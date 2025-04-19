const request = require('supertest');
const { beforeAll, afterAll, beforeEach, afterEach, describe, test, expect } = require('@jest/globals');
const app = require('../../app');
const db = require('../db');
const {
    createTestRetail,
    createTestUser,
    createTestRegister,
    createTestEmployee,
    createTestWorkingAt,
    createAndSave,
} = require('../utils');
const Employee = require('../../models/Employee');
const Attendance = require('../../models/Attendance');
const WorkingAt = require('../../models/WorkingAt');
const Retail = require('../../models/Retail');
const Register = require('../../models/Register');
const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const { DAYS_OF_WEEK } = require('../../constants');
const mongoose = require('mongoose');
const User = require('../../models/User');
const { getDailyAttendance } = require('../../controllers/api/attendance');
const geolib = require('geolib');

// eslint-disable-next-line no-undef
jest.mock('geolib', () => ({ getDistance: jest.fn() }));

const deviceId = 'device123';
const publicKey = 'testPublicKey';
let retail, user, register, employee, workingAt, attendance, brk;
const routePrefix = '/api/break';

const fixedNow = dayjs().date(18).month(3).year(2025).hour(10).minute(0).second(0).millisecond(0); // friday, 18 April 2025, 10:00:00
const fixedDate = fixedNow.toDate();
const fixedDay = fixedNow.day();

beforeAll(async () => {
    await db.connect();
    geolib.getDistance.mockImplementation(({ latitude, longitude }, { latitude: lat2, longitude: lon2 }) => {
        if (latitude === 1 && longitude === 1 && lat2 === 1 && lon2 === 1) {
            return 50;
        }
        return 500;
    });

});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

// Helper to create a token
const createToken = (payload, key) => {
    return jwt.sign(payload, key, { algorithm: 'HS512' });
}

const startBreak = async ({ retail, attendance, workingAt, brk, employee }) => {
    const payload = {
        retailId: retail._id.toString(),
        registerId: workingAt.registerId.toString(),
        attendanceId: attendance._id.toString(),
        shiftId: attendance.shiftId.toString(),
        latitude: 1,
        longitude: 1,
        name: brk.name,
        breakId: brk._id.toString(),
    };
    const token = createToken(payload, employee.publicKey);

    return await request(app)
        .post('/api/break')
        .set('App-Id', deviceId)
        .send({ ...payload, token });
};

const finishBreak = async ({ retail, workingAt, attendance, brk, employee, breakDbId }) => {
    const payload = {
        retailId: retail._id.toString(),
        registerId: workingAt.registerId.toString(),
        attendanceId: attendance._id.toString(),
        shiftId: attendance.shiftId.toString(),
        latitude: 1,
        longitude: 1,
        name: brk.name,
        breakId: brk._id.toString(),
        _id: breakDbId, // break inside attendance.breaks array (_id)
    };
    const token = createToken(payload, employee.publicKey);

    return await request(app)
        .post('/api/break')
        .set('App-Id', deviceId)
        .send({ ...payload, token });
};

describe('POST /api/break', () => {
    beforeEach(async () => {
        retail = await createAndSave(Retail, createTestRetail());
        user = await createAndSave(User, createTestUser({ retailId: retail._id }));
        register = await createAndSave(Register, createTestRegister({ retailId: retail._id },
            {
                breaks: {
                    ...DAYS_OF_WEEK.reduce((acc, day) => {
                        acc[day] = [];
                        return acc;
                    }
                        , {}),
                    [DAYS_OF_WEEK[fixedDay]]: [
                        {
                            name: 'Coffee Break',
                            start: '10:00',
                            end: '12:00',
                            isOverNight: false,
                            duration: 30,
                        },
                    ],
                }
            }
        ));
        employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));
        workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
            employeeId: employee._id,
            registerId: register._id,
            userId: user._id,
        }, {
            shifts: {
                ...DAYS_OF_WEEK.reduce((acc, day) => {
                    acc[day] = [];
                    return acc;
                }
                    , {}),
                [DAYS_OF_WEEK[fixedDay]]: [
                    {
                        start: '08:00',
                        end: '16:00',
                        isOverNight: false,
                        allowedOverTime: 15,
                        isAvailable: true,
                    },
                ],
            }
        }));

        const dailyAttendance = await getDailyAttendance({ registerId: register._id, date: parseInt(fixedNow.format('YYYYMMDD')), isCreating: true });

        attendance = await new Attendance({
            dailyAttendanceId: dailyAttendance._id,
            workingAtId: workingAt._id,
            shiftId: workingAt.shifts.get(DAYS_OF_WEEK[fixedDay])[0]._id,
            start: '08:00',
            end: '16:00',
            isOverNight: false,
            checkInTime: fixedNow.toDate(),
            checkInLocation: { latitude: 1, longitude: 1, distance: 10 },
        }).save();

        brk = register.breaks[DAYS_OF_WEEK[fixedDay]][0];
    });

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

    test('should start a break successfully', async () => {
        const now = fixedNow.clone();

        // eslint-disable-next-line no-undef
        jest.setSystemTime(now.toDate());
        const payload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            name: 'Coffee Break',
            breakId: brk._id.toString(),
        };
        const token = createToken(payload, employee.publicKey);

        const response = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...payload, token });

        expect(response.status).toBe(200);
        expect(response.body.msg).toBe('srv_break_started_successfully');

        const updatedAttendance = await Attendance.findById(attendance._id);
        expect(updatedAttendance.breaks).toHaveLength(1);
        expect(updatedAttendance.breaks[0].name).toBe('Coffee Break');
    });

    test('should finish a break successfully', async () => {
        const now = fixedNow.clone();
        // eslint-disable-next-line no-undef
        jest.setSystemTime(now.toDate());

        // First: Start the break
        const startPayload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            name: 'Coffee Break',
            breakId: brk._id.toString(),
        };
        const startToken = createToken(startPayload, employee.publicKey);

        const startResponse = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...startPayload, token: startToken });

        expect(startResponse.status).toBe(200);
        expect(startResponse.body.msg).toBe('srv_break_started_successfully');

        // Then: Finish the break
        const updatedAttendance = await Attendance.findById(attendance._id);
        const _id = updatedAttendance.breaks[0]._id.toString();

        const finishPayload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            name: 'Coffee Break',
            _id,
            breakId: brk._id.toString(),
        };

        const finishToken = createToken(finishPayload, employee.publicKey);

        const finishResponse = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...finishPayload, token: finishToken });

        expect(finishResponse.status).toBe(200);
        expect(finishResponse.body.msg).toBe('srv_break_finished_successfully');

        const finishedAttendance = await Attendance.findById(attendance._id);
        expect(finishedAttendance.breaks[0].checkOutTime).toBeDefined();
    });


    test('should fail to start break if already pending break', async () => {
        const now = fixedNow.clone();
        // eslint-disable-next-line no-undef
        jest.setSystemTime(now.toDate());

        // Start first break
        const startPayload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            name: 'First Break',
            breakId: brk._id.toString(),
        };
        const startToken = createToken(startPayload, employee.publicKey);

        await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...startPayload, token: startToken });

        // Try to start second break without finishing first
        const secondPayload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            name: 'Second Break',
            breakId: brk._id.toString(),
        };
        const secondToken = createToken(secondPayload, employee.publicKey);

        const response = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...secondPayload, token: secondToken });

        expect(response.status).toBe(400);
        expect(response.body.msg).toBe('srv_some_break_is_pending');
    });


    test('should fail to finish a non-existent break', async () => {
        const now = fixedNow.clone();
        // eslint-disable-next-line no-undef
        jest.setSystemTime(now.toDate());

        const fakeBreakId = new mongoose.Types.ObjectId().toString();

        const finishPayload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            name: 'Fake Break',
            breakId: brk._id.toString(),
            _id: fakeBreakId,  // _id of break (not breakId!)
        };
        const finishToken = createToken(finishPayload, employee.publicKey);

        const response = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...finishPayload, token: finishToken });

        expect(response.status).toBe(400);
        expect(response.body.msg).toBe('srv_break_not_found');
    });


    test('should fail if attendance is already checked out', async () => {
        const now = fixedNow.clone();
        // eslint-disable-next-line no-undef
        jest.setSystemTime(now.toDate());

        // Mark attendance as checked out
        attendance.checkOutTime = now.toDate();
        await attendance.save();

        const payload = {
            retailId: retail._id.toString(),
            registerId: register._id.toString(),
            attendanceId: attendance._id.toString(),
            shiftId: attendance.shiftId.toString(),
            latitude: 1,
            longitude: 1,
            breakId: brk._id.toString(),
            name: 'Break After Checkout',
        };
        const token = createToken(payload, employee.publicKey);

        const response = await request(app)
            .post(routePrefix)
            .set('App-Id', deviceId)
            .send({ ...payload, token: token });

        expect(response.status).toBe(400);
        expect(response.body.msg).toBe('srv_already_checked_out');
    });

    test('should fail if distance too far', async () => {
        geolib.getDistance.mockReturnValueOnce(500); // simulate 500m distance

        const response = await startBreak({ retail, workingAt, attendance, brk, employee });

        expect(response.status).toBe(400);
        expect(response.body.msg).toBe('srv_outside_allowed_radius');
    });

    test('should fail finishing a break twice', async () => {
        const start = await startBreak({ retail, workingAt, attendance, brk, employee });
        expect(start.status).toBe(200);

        const updatedAttendance = await Attendance.findById(attendance._id);
        const breakDbId = updatedAttendance.breaks[0]._id.toString();

        const firstFinish = await finishBreak({ retail, workingAt, attendance, brk, employee, breakDbId });
        expect(firstFinish.status).toBe(200);

        const secondFinish = await finishBreak({ retail, workingAt, attendance, brk, employee, breakDbId });
        expect(secondFinish.status).toBe(400);
        expect(secondFinish.body.msg).toBe('srv_break_already_finished');
    });
    test('should fail if some pause is pending', async () => {
        attendance.pauses.push({
            checkInTime: fixedNow.toDate(),
            checkInLocation: { latitude: 1, longitude: 1, distance: 10 },
            name: 'Pause',
        });
        await attendance.save();

        const response = await startBreak({ retail, workingAt, attendance, brk, employee });

        expect(response.status).toBe(400);
        expect(response.body.msg).toBe('srv_some_pause_is_pending');
    });
});
