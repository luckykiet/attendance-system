const request = require('supertest');
const { beforeAll, afterAll, beforeEach, afterEach, describe, test, expect } = require('@jest/globals');
const app = require('../../app');
const db = require('../db');
const { createTestRetail, createTestUser, createTestRegister, createTestEmployee, createTestWorkingAt, createAndSave } = require('../utils');
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
let retail, user, register, employee, workingAt, attendance;
const routePrefix = '/api/specific-break';

const fixedNow = dayjs().date(18).month(3).year(2025).hour(10).minute(0).second(0).millisecond(0);
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

const createToken = (payload, key) => jwt.sign(payload, key, { algorithm: 'HS512' });

const startSpecificBreak = async ({ retail, attendance, workingAt, employee }) => {
    const payload = {
        retailId: retail._id.toString(),
        registerId: workingAt.registerId.toString(),
        attendanceId: attendance._id.toString(),
        shiftId: attendance.shiftId.toString(),
        latitude: 1,
        longitude: 1,
        breakKey: 'breakfast',
    };
    const token = createToken(payload, employee.publicKey);

    return await request(app)
        .post(routePrefix)
        .set('App-Id', deviceId)
        .send({ ...payload, token });
};

const finishSpecificBreak = async ({ retail, attendance, workingAt, employee, breakDbId }) => {
    const payload = {
        retailId: retail._id.toString(),
        registerId: workingAt.registerId.toString(),
        attendanceId: attendance._id.toString(),
        shiftId: attendance.shiftId.toString(),
        latitude: 1,
        longitude: 1,
        breakKey: 'breakfast',
        _id: breakDbId,
    };
    const token = createToken(payload, employee.publicKey);

    return await request(app)
        .post(routePrefix)
        .set('App-Id', deviceId)
        .send({ ...payload, token });
};

describe('POST /api/specific-break', () => {
    beforeEach(async () => {
        retail = await createAndSave(Retail, createTestRetail());
        user = await createAndSave(User, createTestUser({ retailId: retail._id }));
        register = await createAndSave(Register, createTestRegister({ retailId: retail._id }));
        employee = await createAndSave(Employee, createTestEmployee({ retailId: retail._id, deviceId, publicKey }));
        workingAt = await createAndSave(WorkingAt, createTestWorkingAt({
            employeeId: employee._id,
            registerId: register._id,
            userId: user._id,
        }, {
            shifts: {
                ...DAYS_OF_WEEK.reduce((acc, day) => { acc[day] = []; return acc; }, {}),
                [DAYS_OF_WEEK[fixedDay]]: [{ start: '08:00', end: '16:00', isOverNight: false, allowedOverTime: 15, isAvailable: true }],
            }
        }));

        const dailyAttendance = await getDailyAttendance({ registerId: register._id, date: parseInt(fixedNow.format('YYYYMMDD')) });

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

    test('should start a specific break successfully', async () => {
        const res = await startSpecificBreak({ retail, workingAt, attendance, employee });
        expect(res.status).toBe(200);
        expect(res.body.msg).toBe('srv_break_started_successfully');

        const updatedAttendance = await Attendance.findById(attendance._id);
        expect(updatedAttendance.breaks).toHaveLength(1);
    });

    test('should finish a specific break successfully', async () => {
        const startRes = await startSpecificBreak({ retail, workingAt, attendance, employee });
        expect(startRes.status).toBe(200);

        const updatedAttendance = await Attendance.findById(attendance._id);
        const breakDbId = updatedAttendance.breaks[0]._id.toString();

        const finishRes = await finishSpecificBreak({ retail, workingAt, attendance, employee, breakDbId });
        expect(finishRes.status).toBe(200);
        expect(finishRes.body.msg).toBe('srv_break_finished_successfully');

        const finishedAttendance = await Attendance.findById(attendance._id);
        expect(finishedAttendance.breaks[0].checkOutTime).toBeDefined();
    });

    test('should fail if distance too far', async () => {
        geolib.getDistance.mockReturnValueOnce(500);
        const res = await startSpecificBreak({ retail, workingAt, attendance, employee });
        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('srv_outside_allowed_radius');
    });

    test('should fail to start when another break is pending', async () => {
        await startSpecificBreak({ retail, workingAt, attendance, employee });
        const res2 = await startSpecificBreak({ retail, workingAt, attendance, employee });
        expect(res2.status).toBe(400);
        expect(res2.body.msg).toBe('srv_some_break_is_pending');
    });

    test('should fail to finish a non-existing break', async () => {
        const fakeBreakId = new mongoose.Types.ObjectId().toString();
        const res = await finishSpecificBreak({ retail, workingAt, attendance, employee, breakDbId: fakeBreakId });
        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('srv_break_not_found');
    });

    test('should fail to finish a break twice', async () => {
        await startSpecificBreak({ retail, workingAt, attendance, employee });
        const updatedAttendance = await Attendance.findById(attendance._id);
        const breakDbId = updatedAttendance.breaks[0]._id.toString();

        await finishSpecificBreak({ retail, workingAt, attendance, employee, breakDbId });
        const res2 = await finishSpecificBreak({ retail, workingAt, attendance, employee, breakDbId });

        expect(res2.status).toBe(400);
        expect(res2.body.msg).toBe('srv_break_already_finished');
    });

    test('should fail if attendance already checked out', async () => {
        attendance.checkOutTime = new Date();
        await attendance.save();

        const res = await startSpecificBreak({ retail, workingAt, attendance, employee });
        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('srv_already_checked_out');
    });

    test('should fail if pause is pending', async () => {
        attendance.pauses.push({
            checkInTime: fixedNow.toDate(),
            checkInLocation: { latitude: 1, longitude: 1, distance: 10 },
            name: 'Pause',
        });
        await attendance.save();

        const res = await startSpecificBreak({ retail, workingAt, attendance, employee });
        expect(res.status).toBe(400);
        expect(res.body.msg).toBe('srv_some_pause_is_pending');
    });
});
