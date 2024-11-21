const { beforeAll, afterAll, describe, test, expect } = require('@jest/globals');
const request = require('supertest');
const app = require('../../app');
const Employee = require('../../models/Employee');
const Register = require('../../models/Register');
const Retail = require('../../models/Retail');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const User = require('../../models/User');
// const DailyAttendance = require('../../models/DailyAttendance');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dayjs = require('dayjs');
const db = require('../db');
const { ObjectId } = mongoose.Types;
const geolib = require('geolib');

const routePrefix = '/api/attendance';
let employee, register, retail, user;
let employees = [];
const deviceId = 'device123';

// eslint-disable-next-line no-undef
jest.mock('geolib', () => ({
    // eslint-disable-next-line no-undef
    getDistance: jest.fn(),
}));

beforeAll(async () => {
    await db.connect();
    geolib.getDistance.mockReturnValue(50);

    retail = await new Retail({
        name: 'Test Retail',
        tin: '12345678',
        address: {
            street: 'Test Street',
            city: 'Test City',
            zip: '12345',
        }
    }).save();

    user = await new User({
        email: 'login@example.com',
        username: 'loginuser',
        name: 'Login User',
        password: 'password',
        role: 'Admin',
        retailId: retail._id,
        isAvailable: true,
    }).save();

    register = await new Register({
        retailId: retail._id,
        name: 'Test Register',
        location: { coordinates: [1.0, 1.0], allowedRadius: 100 },
        address: {
            street: 'Test Street',
            city: 'Test City',
            zip: '12345',
        },
        workingHours: {
            mon: { start: '08:00', end: '17:00', isAvailable: true },
            tue: { start: '08:00', end: '17:00', isAvailable: true },
            wed: { start: '08:00', end: '17:00', isAvailable: true },
            thu: { start: '08:00', end: '17:00', isAvailable: true },
            fri: { start: '08:00', end: '17:00', isAvailable: true },
            sat: { start: '10:00', end: '15:00', isAvailable: true },
            sun: { start: '00:00', end: '00:00', isAvailable: false },
        },
    }).save();

    for (let i = 0; i < 15; i++) {
        const newEmployee = await new Employee({
            email: `test${i}@example.com`,
            name: `Test Employee ${i}`,
            username: `employee${i}`,
            deviceId: `device${i}`,
            retailId: retail._id,
            publicKey: `testPublicKey${i}`,
        }).save();

        employees.push(newEmployee._id);
    }

    employee = await new Employee({
        email: 'test@example.com',
        name: 'Test Employee',
        username: 'employee1',
        deviceId,
        retailId: retail._id,
        publicKey: 'testPublicKey',
    }).save();

    // dailyAttendance = await new DailyAttendance({
    //     registerId: register._id,
    //     date: parseInt(dayjs().format('YYYYMMDD')),
    //     workingHour: { start: '08:00', end: '17:00', isAvailable: true }
    // }).save();

    await new WorkingAt({
        employeeId: employee._id,
        registerId: register._id,
        userId: user._id,
        workingHours: {
            mon: { start: '08:00', end: '17:00', isAvailable: true },
            tue: { start: '08:00', end: '17:00', isAvailable: true },
            wed: { start: '08:00', end: '17:00', isAvailable: true },
            thu: { start: '08:00', end: '17:00', isAvailable: true },
            fri: { start: '08:00', end: '17:00', isAvailable: true },
            sat: { start: '10:00', end: '15:00', isAvailable: true },
            sun: { start: '00:00', end: '00:00', isAvailable: false },
            isAvailable: true,
        }
    }).save();

    geolib.getDistance.mockReturnValue(50);
});

afterAll(async () => {
    await db.clearDatabase();
    await db.closeDatabase();
});

describe('Attendance Tests', () => {
    describe('makeAttendance', () => {
        test('should check-in successfully', async () => {
            const payload = {
                registerId: register._id.toString(),
                latitude: 1.0,
                longitude: 1.0,
                timestamp: dayjs().unix()
            };

            const token = jwt.sign(payload, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(`${routePrefix}`)
                .set('App-Id', deviceId)
                .send({
                    ...payload,
                    token,
                });

            expect(response.status).toBe(200);
            expect(response.body.msg).toBe('srv_checked_in_successfully');
        });

        test('should throw error if outside allowed radius', async () => {
            geolib.getDistance.mockReturnValueOnce(200); // Outside allowed radius

            const payload = {
                registerId: register._id.toString(),
                latitude: 1.0,
                longitude: 1.0,
                timestamp: dayjs().unix()
            };

            const token = jwt.sign(payload, employee.publicKey, { algorithm: 'HS512' });

            const response = await request(app)
                .post(`${routePrefix}`)
                .set('App-Id', deviceId)
                .send({
                    ...payload,
                    token,
                });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_outside_allowed_radius');
        });

        test('should throw error if invalid token', async () => {
            const payload = {
                registerId: register._id.toString(),
                latitude: 1.0,
                longitude: 1.0,
                timestamp: dayjs().unix()
            };

            const invalidToken = jwt.sign(payload, 'wrong-public-key', { algorithm: 'HS512' });

            const response = await request(app)
                .post(`${routePrefix}`)
                .set('App-Id', deviceId)
                .send({
                    ...payload,
                    token: invalidToken,
                });

            expect(response.status).toBe(400);
            expect(response.body.msg).toBe('srv_invalid_token');
        });
    });

    describe('getAttendances', () => {
        beforeAll(async () => {
            for (let i = 0; i < 15; i++) {
                await new Attendance({
                    registerId: register._id,
                    employeeId: employee._id,
                    dailyAttendanceId: new ObjectId(),
                    checkInTime: dayjs().subtract(i, 'day').toDate(),
                    checkInLocation: {
                        latitude: 1.0,
                        longitude: 1.0,
                        distance: 4
                    }
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
            await Attendance.deleteMany({});

            const response = await request(app)
                .get(`${routePrefix}s`)
                .set('App-Id', deviceId);

            expect(response.status).toBe(200);
            expect(response.body.msg.attendances).toEqual([]);
            expect(response.body.msg.hasMore).toBe(false);
        });
    });
});
