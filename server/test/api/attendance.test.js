const { beforeAll, afterAll, afterEach, beforeEach, describe, test, expect } = require('@jest/globals');
const request = require('supertest');
const app = require('../../app');
const db = require('../db');
const jwt = require('jsonwebtoken');
const geolib = require('geolib');
const dayjs = require('dayjs');
const Attendance = require('../../models/Attendance');
const Retail = require('../../models/Retail');
const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');
const User = require('../../models/User');

const { ObjectId } = require('mongoose').Types;

const {
    createTestRetail,
    createTestUser,
    createTestRegister,
    createTestEmployee,
    createTestWorkingAt,
    createAndSave,
} = require('../utils');
const { getDailyAttendance } = require('../../controllers/api/attendance');
const { DAYS_OF_WEEK } = require('../../constants');
const DailyAttendance = require('../../models/DailyAttendance');

// eslint-disable-next-line no-undef
jest.mock('geolib', () => ({ getDistance: jest.fn() }));

const fixedNow = dayjs().date(18).month(3).year(2025).hour(10).minute(0).second(0).millisecond(0); // friday, 18 April 2025, 10:00:00
const fixedDate = fixedNow.toDate();
const fixedDay = fixedNow.day();

const routePrefix = '/api/attendance';
const workplacesRoute = '/api/workplaces';
let retail, user, register, employee, workingAt;
const deviceId = 'device123';
const publicKey = 'testPublicKey';

beforeAll(async () => {
    await db.connect();
    geolib.getDistance.mockReturnValue(50);
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

describe('Workplaces Tests', () => {
    beforeEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
        // eslint-disable-next-line no-undef
        jest.setSystemTime(fixedDate);
    });

    afterEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useRealTimers();
        await db.clearDatabase();
    });

    describe('getTodayWorkplaces', () => {

        test('should get 2 shifts, one for today one for yesterday', async () => {
            retail = await createAndSave(Retail, createTestRetail());
            user = await createAndSave(User, createTestUser({ retailId: retail._id }));
            register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
            employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));
            workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
                employeeId: employee._id,
                registerId: register._id,
                userId: user._id,
            }));

            const todayKey = DAYS_OF_WEEK[fixedDay];
            const yesterdayKey = DAYS_OF_WEEK[fixedNow.subtract(1, 'day').day()];

            const response = await request(app)
                .post(workplacesRoute)
                .set('App-Id', deviceId)
                .send({
                    longitude: null,
                    latitude: null,
                });

            expect(response.status).toBe(200);
            expect(response.body.msg).toHaveLength(1);
            expect(response.body.msg[0].shifts[todayKey]).toHaveLength(1)
            expect(response.body.msg[0].shifts[yesterdayKey]).toHaveLength(1)
        });

        test('should get 0 shift for both today and yesterday', async () => {
            retail = await createAndSave(Retail, createTestRetail());
            user = await createAndSave(User, createTestUser({ retailId: retail._id }));
            register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
            employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));
            workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
                employeeId: employee._id,
                registerId: register._id,
                userId: user._id,
            }, {
                shifts: DAYS_OF_WEEK.reduce((acc, day) => {
                    acc[day] = [];
                    return acc;
                }
                    , {}),
            }));

            const response = await request(app)
                .post(workplacesRoute)
                .set('App-Id', deviceId)
                .send({
                    longitude: null,
                    latitude: null,
                });

            expect(response.status).toBe(200);
            expect(response.body.msg).toHaveLength(0);
        });
    });
    test('should handle multiple shifts on the same day', async () => {
        retail = await createAndSave(Retail, createTestRetail());
        user = await createAndSave(User, createTestUser({ retailId: retail._id }));
        register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
        employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));

        const todayKey = DAYS_OF_WEEK[fixedDay];

        // Create workingAt with 2 shifts on the same day
        const multipleShifts = {
            [todayKey]: [
                { start: '08:00', end: '12:00', allowedOverTime: 20, isOverNight: false, isAvailable: true },
                { start: '14:00', end: '18:00', allowedOverTime: 20, isOverNight: false, isAvailable: true },
            ],
        };

        workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
            employeeId: employee._id,
            registerId: register._id,
            userId: user._id,
        }, {
            shifts: multipleShifts,
        }));

        const response = await request(app)
            .post(workplacesRoute)
            .set('App-Id', deviceId)
            .send({
                longitude: null,
                latitude: null,
            });

        expect(response.status).toBe(200);
        expect(response.body.msg).toHaveLength(1);

        const shiftsToday = response.body.msg[0].shifts[todayKey];
        expect(Array.isArray(shiftsToday)).toBe(true);
        expect(shiftsToday).toHaveLength(2);

        expect(shiftsToday[0].start).toBe('08:00');
        expect(shiftsToday[0].end).toBe('12:00');
        expect(shiftsToday[1].start).toBe('14:00');
        expect(shiftsToday[1].end).toBe('18:00');
    });
});

describe('Attendance Tests', () => {
    beforeEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
        // eslint-disable-next-line no-undef
        jest.setSystemTime(fixedDate);

        retail = await createAndSave(Retail, createTestRetail());
        user = await createAndSave(User, createTestUser({ retailId: retail._id }));
        register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
        employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));
        workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
            employeeId: employee._id,
            registerId: register._id,
            userId: user._id,
        }));
    });

    afterEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useRealTimers();
        await db.clearDatabase();
    });

    describe('makeAttendance', () => {
        test('should check-in successfully', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];

            const shiftsToday = workingAt.shifts.get(todayKey);

            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(200);
            expect(response.body.msg).toBe('srv_checked_in_successfully');
        });

        test('should check-out successfully', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];

            const shiftsToday = workingAt.shifts.get(todayKey);

            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(200);
            expect(response.body.msg).toBe('srv_checked_in_successfully');

            const respTodayAttendances = await request(app)
                .post(workplacesRoute)
                .set('App-Id', deviceId)
                .send({
                    longitude: null,
                    latitude: null,
                });

            expect(respTodayAttendances.status).toBe(200);
            expect(respTodayAttendances.body.msg).toHaveLength(1);
            expect(respTodayAttendances.body.msg[0].attendances).toHaveLength(1);
            expect(respTodayAttendances.body.msg[0].attendances[0].checkInTime).toBeDefined();
            expect(respTodayAttendances.body.msg[0].attendances[0].checkInTime).toEqual(fixedNow.toDate().toISOString());
            expect(respTodayAttendances.body.msg[0].attendances[0].shiftId.toString()).toEqual(shiftId.toString());

            // eslint-disable-next-line no-undef
            jest.setSystemTime(fixedNow.add(5, 'hours').toDate());

            const payload2 = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: respTodayAttendances.body.msg[0].attendances[0]._id.toString(),
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
                reason: 'Early check-out',
            };

            const token2 = jwt.sign({ ...payload2, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response2 = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload2, token: token2 });

            expect(response2.status).toBe(200);
            expect(response2.body.msg).toBe('srv_checked_out_successfully');
        });

        test('should ask for reason for early check-out', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];

            const shiftsToday = workingAt.shifts.get(todayKey);

            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(200);
            expect(response.body.msg).toBe('srv_checked_in_successfully');

            const respTodayAttendances = await request(app)
                .post(workplacesRoute)
                .set('App-Id', deviceId)
                .send({
                    longitude: null,
                    latitude: null,
                });

            expect(respTodayAttendances.status).toBe(200);
            expect(respTodayAttendances.body.msg).toHaveLength(1);
            expect(respTodayAttendances.body.msg[0].attendances).toHaveLength(1);
            expect(respTodayAttendances.body.msg[0].attendances[0].checkInTime).toBeDefined();
            expect(respTodayAttendances.body.msg[0].attendances[0].checkInTime).toEqual(fixedNow.toDate().toISOString());
            expect(respTodayAttendances.body.msg[0].attendances[0].shiftId.toString()).toEqual(shiftId.toString());


            // eslint-disable-next-line no-undef
            jest.setSystemTime(fixedNow.add(5, 'hours').toDate());

            const payload2 = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: respTodayAttendances.body.msg[0].attendances[0]._id.toString(),
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token2 = jwt.sign({ ...payload2, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response2 = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload2, token: token2 });

            expect(response2.status).toBe(400);
            expect(response2.body.msg).toBe('srv_reason_for_early_check_out_required');
        });

        test('should throw error if outside allowed radius', async () => {
            geolib.getDistance.mockReturnValueOnce(200); // simulate outside radius

            const now = dayjs();
            const todayKey = DAYS_OF_WEEK[now.day()];

            const shiftsToday = workingAt.shifts.get(todayKey);

            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_outside_allowed_radius');
        });

        test('should fail if missing latitude or longitude', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: null,
                latitude: null,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_invalid_request');
        });

        test('should fail if payload and token mismatch', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const tamperedPayload = { ...payload, longitude: 2.0 }; // intentionally different

            const token = jwt.sign({ ...tamperedPayload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_invalid_request');
        });

        test('should not allow double check-in without checkout', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(200);

            const response2 = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response2.status).toBe(400);
            expect(response2.body.msg).toBe('srv_attendance_already_exists');
        });

        test('should fail to check-out if attendanceId not found', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shiftId = shiftsToday?.length > 0 ? shiftsToday[0]._id : null;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: new ObjectId().toString(), // random fake attendanceId
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_attendance_not_found');
        });

        test('should fail if no token provided', async () => {
            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId: new ObjectId().toString(),
                longitude: 1.0,
                latitude: 1.0,
            };

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send(payload);

            expect(response.status).toBe(401);
            expect(response.body.msg).toBe('srv_unauthorized');
        });
        test('should check-in to two different shifts on the same day', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];

            // Update workingAt to have 2 shifts today
            const multipleShifts = {
                [todayKey]: [
                    { start: '08:00', end: '12:00', allowedOverTime: 20, isOverNight: false, isAvailable: true },
                    { start: '14:00', end: '18:00', allowedOverTime: 20, isOverNight: false, isAvailable: true },
                ],
            };

            await WorkingAt.updateOne(
                { _id: workingAt._id },
                { $set: { shifts: multipleShifts } }
            );

            // Refetch workingAt to get updated shifts
            workingAt = await WorkingAt.findById(workingAt._id);

            const shiftsToday = workingAt.shifts.get(todayKey);

            expect(shiftsToday).toHaveLength(2);

            // -- First Shift Check-in --

            const shiftId1 = shiftsToday[0]._id;

            const payload1 = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId: shiftId1,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token1 = jwt.sign({ ...payload1, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response1 = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload1, token: token1 });

            expect(response1.status).toBe(200);
            expect(response1.body.msg).toBe('srv_checked_in_successfully');

            // Simulate some time pass
            // eslint-disable-next-line no-undef
            jest.setSystemTime(fixedNow.add(4, 'hours').toDate());

            // -- Second Shift Check-in --

            const shiftId2 = shiftsToday[1]._id;

            const payload2 = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId: shiftId2,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token2 = jwt.sign({ ...payload2, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response2 = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload2, token: token2 });

            expect(response2.status).toBe(200);
            expect(response2.body.msg).toBe('srv_checked_in_successfully');
        });

        test('should fail check-in with invalid shiftId', async () => {
            const fakeShiftId = new ObjectId(); // shift that does not exist

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId: fakeShiftId.toString(),
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_shift_not_found');
        });
        test('should not allow double check-in to the same shift', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shiftId = shiftsToday?.[0]?._id;

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId,
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const firstResponse = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(firstResponse.status).toBe(200);

            // Try again without checkout
            const secondResponse = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(secondResponse.status).toBe(400);
            expect(secondResponse.body.msg).toBe('srv_attendance_already_exists');
        });
        test('should fail if shiftId is missing', async () => {
            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                // shiftId is missing
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_invalid_request');
        });

        test('should fail to check-in outside working hours', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shift = shiftsToday?.[0];

            expect(shift).toBeDefined();

            // Move system time to 5 hours BEFORE shift start
            const beforeShiftStart = fixedNow.set('hour', 3).toDate(); // Example: 3:00 AM
            // eslint-disable-next-line no-undef
            jest.setSystemTime(beforeShiftStart);

            const payload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId: shift._id.toString(),
                longitude: 1.0,
                latitude: 1.0,
            };

            const token = jwt.sign({ ...payload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...payload, token });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_shift_not_started');
        });
        test('should fail to check-out outside working hours', async () => {
            const todayKey = DAYS_OF_WEEK[fixedDay];
            const shiftsToday = workingAt.shifts.get(todayKey);
            const shift = shiftsToday?.[0];

            expect(shift).toBeDefined();

            // First, check-in properly
            const checkInPayload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId: null,
                shiftId: shift._id.toString(),
                longitude: 1.0,
                latitude: 1.0,
            };

            const checkInToken = jwt.sign({ ...checkInPayload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const checkInResponse = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...checkInPayload, token: checkInToken });

            expect(checkInResponse.status).toBe(200);
            expect(checkInResponse.body.msg).toBe('srv_checked_in_successfully');

            // Get today's attendance
            const workplacesResp = await request(app)
                .post(workplacesRoute)
                .set('App-Id', deviceId)
                .send({
                    longitude: null,
                    latitude: null,
                });

            const attendanceId = workplacesResp.body.msg[0].attendances[0]._id.toString();

            // Now move time FAR OUTSIDE shift end (e.g., +10 hours)
            // eslint-disable-next-line no-undef
            jest.setSystemTime(fixedNow.add(10, 'hours').toDate());

            const checkOutPayload = {
                registerId: register._id.toString(),
                retailId: retail._id.toString(),
                attendanceId,
                shiftId: shift._id.toString(),
                longitude: 1.0,
                latitude: 1.0,
                reason: 'Late check-out',
            };

            const checkOutToken = jwt.sign({ ...checkOutPayload, timestamp: dayjs().unix() }, employee.publicKey, { algorithm: 'HS512' });

            const checkOutResponse = await request(app)
                .post(routePrefix)
                .set('App-Id', deviceId)
                .send({ ...checkOutPayload, token: checkOutToken });

            expect(checkOutResponse.status).toBe(400);
            expect(checkOutResponse.body.msg).toBe('srv_shift_already_ended');
        });
    });

    describe('getAttendances', () => {
        beforeAll(async () => {
            retail = await createAndSave(Retail, createTestRetail());
            user = await createAndSave(User, createTestUser({ retailId: retail._id }));
            register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
            employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));
            workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
                employeeId: employee._id,
                registerId: register._id,
                userId: user._id,
            }));

            await getDailyAttendance({ registerId: register._id, isCreating: true });

            for (let i = 0; i < 15; i++) {
                await new Attendance({
                    registerId: register._id,
                    employeeId: employee._id,
                    workingAtId: workingAt._id, // <--- important
                    shiftId: new ObjectId(),     // or if you have real shiftId, use it
                    start: dayjs().subtract(i, 'day').startOf('day').toDate(), // test check-in start
                    end: dayjs().subtract(i, 'day').endOf('day').toDate(), // test check-out end
                    isOverNight: false, // example for test
                    dailyAttendanceId: new ObjectId(), // still fine
                    checkInTime: dayjs().subtract(i, 'day').add(1, 'hour').toDate(),
                    checkInLocation: {
                        latitude: 1.0,
                        longitude: 1.0,
                        distance: 4,
                    },
                }).save();
            }
        });

        test('should get paginated attendances', async () => {
            const response = await request(app)
                .get(`${routePrefix}s?limit=10&skip=0`)
                .set('App-Id', deviceId);

            expect(response.status).toBe(200);
            expect(response.body.msg.attendances.length).toBe(10);
            expect(response.body.msg.hasMore).toBe(true);
        });

        test('should handle no attendances found', async () => {
            await Attendance.deleteMany();

            const response = await request(app)
                .get(`${routePrefix}s`)
                .set('App-Id', deviceId);

            expect(response.status).toBe(200);
            expect(response.body.msg.attendances).toEqual([]);
            expect(response.body.msg.hasMore).toBe(false);
        });
    });
});

describe('DailyAttendance Aggregation Tests', () => {
    beforeEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
        // eslint-disable-next-line no-undef
        jest.setSystemTime(fixedDate);

        retail = await createAndSave(Retail, createTestRetail());
        register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
        user = await createAndSave(User, createTestUser({ retailId: retail._id }));
        employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));

        workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
            employeeId: employee._id,
            registerId: register._id,
            userId: user._id,
        }));
    });

    afterEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useRealTimers();
        await db.clearDatabase();
    });

    test('should create daily attendance with expected employees', async () => {
        const dailyAttendance = await getDailyAttendance({ registerId: register._id, isCreating: true });

        expect(dailyAttendance).toBeDefined();
        expect(dailyAttendance.expectedShifts.length).toBeGreaterThan(0);
        expect(dailyAttendance.expectedShifts[0].employeeId.toString()).toBe(employee._id.toString());
    });

    test('should correctly increment checkedInOnTime for employee', async () => {
        const dailyAttendance = await getDailyAttendance({ registerId: register._id, isCreating: true });

        expect(dailyAttendance.checkedInOnTime).toBe(0);

        dailyAttendance.checkedInOnTime += 1;
        dailyAttendance.checkedInOnTimeByEmployee.set(employee._id.toString(), 1);
        await dailyAttendance.save();

        const refreshed = await DailyAttendance.findById(dailyAttendance._id).lean();

        expect(refreshed.checkedInOnTime).toBe(1);
        expect(refreshed.checkedInOnTimeByEmployee[employee._id.toString()]).toBe(1);
    });

    test('should correctly increment checkedInLate for employee', async () => {
        const dailyAttendance = await getDailyAttendance({ registerId: register._id, isCreating: true });

        dailyAttendance.checkedInLate += 1;
        dailyAttendance.checkedInLateByEmployee.set(employee._id.toString(), 1);
        await dailyAttendance.save();

        const refreshed = await DailyAttendance.findById(dailyAttendance._id).lean();

        expect(refreshed.checkedInLate).toBe(1);
        expect(refreshed.checkedInLateByEmployee[employee._id.toString()]).toBe(1);
    });

    test('should correctly increment checkedOutEarly for employee', async () => {
        const dailyAttendance = await getDailyAttendance({ registerId: register._id, isCreating: true });

        dailyAttendance.checkedOutEarly += 1;
        dailyAttendance.checkedOutEarlyByEmployee.set(employee._id.toString(), 1);
        await dailyAttendance.save();

        const refreshed = await DailyAttendance.findById(dailyAttendance._id).lean();

        expect(refreshed.checkedOutEarly).toBe(1);
        expect(refreshed.checkedOutEarlyByEmployee[employee._id.toString()]).toBe(1);
    });

    test('should correctly track workingHoursByEmployee', async () => {
        const dailyAttendance = await getDailyAttendance({ registerId: register._id, isCreating: true });
        const shiftId = ObjectId.createFromHexString(workingAt.shifts.get(DAYS_OF_WEEK[fixedDay])[0]._id.toString())
        const employeeId = ObjectId.createFromHexString(employee._id.toString());
        dailyAttendance.workingHoursByEmployee.push({
            employeeId,
            shiftId,
            minutes: 300,
        }); // 300 minutes = 5 hours
        await dailyAttendance.save();

        const refreshed = await DailyAttendance.findById(dailyAttendance._id).lean();

        expect(refreshed.workingHoursByEmployee.find((e) => e.employeeId.equals(employeeId) && e.shiftId.equals(shiftId)).minutes).toBe(300);
    });
});

describe('DailyAttendance Real Aggregation Tests (via makeAttendance)', () => {
    let retail, register, user, employee, workingAt, shift, todayKey;

    const getEmployeeCount = (map, employeeId) => (map?.[employeeId] || 0);

    beforeEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
        // eslint-disable-next-line no-undef
        jest.setSystemTime(fixedDate);

        retail = await createAndSave(Retail, createTestRetail());
        register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
        user = await createAndSave(User, createTestUser({ retailId: retail._id }));
        employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));

        todayKey = DAYS_OF_WEEK[fixedDay];

        workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
            employeeId: employee._id,
            registerId: register._id,
            userId: user._id,
        }));

        shift = workingAt.shifts.get(todayKey)[0];
    });

    afterEach(async () => {
        // eslint-disable-next-line no-undef
        jest.useRealTimers();
        await db.clearDatabase();
    });

    const checkIn = async ({ shift, now = fixedNow }) => {
        const payload = {
            registerId: register._id.toString(),
            retailId: retail._id.toString(),
            attendanceId: null,
            shiftId: shift._id,
            longitude: 1.0,
            latitude: 1.0,
        };

        const token = jwt.sign({ ...payload, timestamp: now.unix() }, employee.publicKey, { algorithm: 'HS512' });

        const response = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...payload, token });

        return response;
    };

    const checkOut = async ({ shift, attendanceId, now = fixedNow.add(8, 'hours') }) => {
        const payload = {
            registerId: register._id.toString(),
            retailId: retail._id.toString(),
            attendanceId,
            shiftId: shift._id,
            longitude: 1.0,
            latitude: 1.0,
            reason: 'Shift ended',
        };

        const token = jwt.sign({ ...payload, timestamp: now.unix() }, employee.publicKey, { algorithm: 'HS512' });

        const response = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...payload, token });

        return response;
    };

    test('should mark check-in on time and check-out on time', async () => {
        const startTime = fixedNow.hour(7).minute(55);
        // eslint-disable-next-line no-undef
        jest.setSystemTime(startTime.toDate());

        const checkInRes = await checkIn({ shift });
        expect(checkInRes.status).toBe(200);

        const dailyAttendance = await DailyAttendance.findOne({ registerId: register._id }).lean();
        expect(getEmployeeCount(dailyAttendance.checkedInOnTimeByEmployee, employee._id.toString())).toBe(1);

        const todayAttendances = await Attendance.find({ dailyAttendanceId: dailyAttendance._id });
        expect(todayAttendances).toHaveLength(1);

        // eslint-disable-next-line no-undef
        jest.setSystemTime(startTime.add(9, 'hour').add(10, 'minute').toDate());

        const checkOutRes = await checkOut({ shift, attendanceId: todayAttendances[0]._id });
        expect(checkOutRes.status).toBe(200);

        const updatedDaily = await DailyAttendance.findById(dailyAttendance._id).lean();
        expect(getEmployeeCount(updatedDaily.checkedOutOnTimeByEmployee, employee._id.toString())).toBe(1);
    });

    test('should mark check-in late if after shift start', async () => {
        // eslint-disable-next-line no-undef
        jest.setSystemTime(fixedNow.add(2, 'hours').toDate()); // Shift already started

        const checkInRes = await checkIn({ shift });
        expect(checkInRes.status).toBe(200);

        const dailyAttendance = await DailyAttendance.findOne({ registerId: register._id }).lean();
        expect(getEmployeeCount(dailyAttendance.checkedInLateByEmployee, employee._id.toString())).toBe(1);
    });

    test('should mark check-out early if before shift end', async () => {
        const checkInRes = await checkIn({ shift });
        expect(checkInRes.status).toBe(200);

        const dailyAttendance = await DailyAttendance.findOne({ registerId: register._id }).lean();
        const todayAttendances = await Attendance.find({ dailyAttendanceId: dailyAttendance._id });

        // eslint-disable-next-line no-undef
        jest.setSystemTime(fixedNow.add(3, 'hours').toDate()); // Before shift end

        const checkOutRes = await checkOut({ shift, attendanceId: todayAttendances[0]._id });
        expect(checkOutRes.status).toBe(200);

        const updatedDaily = await DailyAttendance.findById(dailyAttendance._id).lean();
        expect(getEmployeeCount(updatedDaily.checkedOutEarlyByEmployee, employee._id.toString())).toBe(1);
    });

    test('should calculate working hours correctly', async () => {
        const startTime = fixedNow.hour(7).minute(55);
        // eslint-disable-next-line no-undef
        jest.setSystemTime(startTime.toDate());

        const checkInRes = await checkIn({ shift });
        expect(checkInRes.status).toBe(200);

        const dailyAttendance = await DailyAttendance.findOne({ registerId: register._id }).lean();
        const todayAttendances = await Attendance.find({ dailyAttendanceId: dailyAttendance._id });

        // eslint-disable-next-line no-undef
        jest.setSystemTime(startTime.add(9, 'hour').add(10, 'minute').toDate());

        const checkOutRes = await checkOut({ shift, attendanceId: todayAttendances[0]._id });
        expect(checkOutRes.status).toBe(200);

        const updatedDaily = await DailyAttendance.findById(dailyAttendance._id).lean();

        const workingHoursEntry = updatedDaily.workingHoursByEmployee.find(e =>
            e.employeeId.toString() === employee._id.toString() &&
            e.shiftId.toString() === shift._id.toString()
        );
        expect(workingHoursEntry).toBeDefined();
        expect(workingHoursEntry.minutes).toBeGreaterThan(0);
    });
});
