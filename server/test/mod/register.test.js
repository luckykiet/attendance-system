const { beforeAll, afterEach, afterAll, describe, test, expect } = require('@jest/globals');
const supertest = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const db = require('../db');
// const Register = require('../../models/Register'); // assuming it exists
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

const routePrefix = '/mod/register';
const request = supertest(app);
const { ObjectId } = mongoose.Types;

const login = async () => {
    const user = new User({
        username: 'adminuser',
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpass', 10),
        name: 'Admin User',
        role: 'Admin',
        isAvailable: true,
        retailId: new ObjectId(),
    });
    await user.save();

    const login = await request.post('/auth/login').send({
        username: 'adminuser',
        password: Buffer.from('adminpass').toString('base64'),
    });
    return login.headers['set-cookie'];
}


beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

describe(`unauthorized access`, () => {
    test('should prevent any access', async () => {
        const response1 = await request.get(`${routePrefix}`);
        expect(response1.status).toBe(401);

        const response2 = await request.post(`${routePrefix}`);
        expect(response2.status).toBe(401);

        const response3 = await request.put(`${routePrefix}`);
        expect(response3.status).toBe(401);

        const response4 = await request.delete(`${routePrefix}`);
        expect(response4.status).toBe(401);
    });
});

describe(`POST ${routePrefix}`, () => {
    test('should return 404 for invalid route', async () => {
        const cookie = await login();
        const response = await request.post(`${routePrefix}/invalid`).set('Cookie', cookie)
        expect(response.status).toBe(404);
    }
    );

    test('should return 0 registers', async () => {
        const cookie = await login();
        const response = await request
            .post(`${routePrefix}s`)
            .set('Cookie', cookie);
        expect(response.status).toBe(200);
        expect(response.body.msg).toBeInstanceOf(Array);
        expect(response.body.msg).toHaveLength(0);
    }
    );

    const validRegisterPayload = {
        name: 'Sample Register',
        address: {
            street: '123 Sample St',
            city: 'Testville',
            zip: '99999',
        },
        location: {
            latitude: 48.148598,
            longitude: 17.107748,
            allowedRadius: 100,
        },
        workingHours: {
            mon: { start: '07:00', end: '20:00', isOverNight: false, isAvailable: true },
            tue: { start: '07:00', end: '20:00', isOverNight: false, isAvailable: true },
            wed: { start: '07:00', end: '20:00', isOverNight: false, isAvailable: true },
            thu: { start: '07:00', end: '02:00', isOverNight: true, isAvailable: true },
            fri: { start: '07:00', end: '20:00', isOverNight: false, isAvailable: true },
            sat: { start: '07:00', end: '20:00', isOverNight: false, isAvailable: true },
            sun: { start: '07:00', end: '20:00', isOverNight: false, isAvailable: false },
        },
        specificBreaks: {
            mon: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
            tue: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
            wed: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
            thu: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
            fri: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
            sat: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
            sun: {
                breakfast: {
                    start: '07:00',
                    end: '08:00',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                lunch: {
                    start: '12:00',
                    end: '12:30',
                    duration: 30,
                    isOverNight: false,
                    isAvailable: true,
                },
                dinner: {
                    start: '18:00',
                    end: '19:00',
                    duration: 60,
                    isOverNight: false,
                    isAvailable: false,
                },
            },
        },
        breaks: {
            mon: [
                { name: "Break 1", start: '10:00', end: '10:15', duration: 15, isOverNight: false, isAvailable: true },
            ],
            tue: [
                { name: "Break 2", start: '10:00', end: '10:15', duration: 15, isOverNight: false, isAvailable: true },
                { name: "Break 3", start: '11:00', end: '12:15', duration: 30, isOverNight: false, isAvailable: true },
            ],
            wed: [],
            thu: [
                { name: "Break 4", start: '10:00', end: '10:15', duration: 15, isOverNight: false, isAvailable: true },
            ],
            fri: [
                { name: "Break 5", start: '10:00', end: '10:15', duration: 15, isOverNight: false, isAvailable: true },
            ],
            sat: [
                { name: "Break 6", start: '10:00', end: '10:15', duration: 15, isOverNight: false, isAvailable: true },
            ],
            sun: [],
        },
        maxLocalDevices: 5,
        isAvailable: true,
    };

    test('should create a register successfully with full valid payload', async () => {
        const cookie = await login();
        const response = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(validRegisterPayload);

        expect(response.status).toBe(201);
        expect(response.body.msg.name).toBe('Sample Register');
        expect(response.body.msg._id).toBeDefined();
    });

    test('should fail when required fields are missing', async () => {
        const cookie = await login();
        const response = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.msg).toBeDefined();
        expect(response.body.msg.errors).toBeInstanceOf(Array);
    });

    test('should reject invalid workingHours format', async () => {
        const cookie = await login();

        const payload1 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload1.workingHours.mon.start = 'invalid';

        const response1 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload1);

        expect(response1.status).toBe(400);
        expect(response1.body.msg.errors).toBeDefined();
        expect(response1.body.msg.errors).toContainEqual({
            'workingHours.mon.start': 'srv_invalid_time'
        });

        const payload2 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload2.workingHours.tue.start = '25:00';

        const response2 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload2);

        expect(response2.status).toBe(400);
        expect(response2.body.msg.errors).toBeDefined();
        expect(response2.body.msg.errors).toContainEqual({
            'workingHours.tue.start': 'srv_invalid_time'
        });

        const payload3 = JSON.parse(JSON.stringify(validRegisterPayload));
        delete payload3.workingHours.wed;

        const response3 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload3);

        expect(response3.status).toBe(400);
        expect(response3.body.msg.errors).toBeDefined();
        expect(response3.body.msg.errors).toContainEqual({
            'workingHours.wed.start': 'misc_required'
        });

        // Case 4: Invalid .thu.end
        const payload4 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload4.workingHours.thu.end = '25:00';

        const response4 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload4);

        expect(response4.status).toBe(400);
        expect(response4.body.msg.errors).toBeDefined();
        expect(response4.body.msg.errors).toContainEqual({
            'workingHours.thu.end': 'srv_invalid_time'
        });

        // Case 5: Removed .fri
        const payload5 = JSON.parse(JSON.stringify(validRegisterPayload));
        delete payload5.workingHours.fri;

        const response5 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload5);

        expect(response5.status).toBe(400);
        expect(response5.body.msg.errors).toBeDefined();
        expect(response5.body.msg.errors).toContainEqual({
            'workingHours.fri.start': 'misc_required'
        });
    });

    test('should reject invalid specificBreaks configuration', async () => {
        const cookie = await login();

        // Case 1: duration too low (< 15)
        const payload1 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload1.specificBreaks.mon.lunch.duration = 5;

        const res1 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload1);

        expect(res1.status).toBe(400);
        expect(res1.body.msg.errors).toContainEqual({
            'specificBreaks.mon.lunch.duration': 'srv_invalid_duration'
        });

        // Case 2: invalid time format
        const payload2 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload2.specificBreaks.mon.lunch.start = 'invalid';

        const res2 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload2);

        expect(res2.status).toBe(400);
        expect(res2.body.msg.errors).toContainEqual({
            'specificBreaks.mon.lunch.start': 'srv_invalid_time'
        });

        // Case 3: isOverNight mismatch (start=22:00, end=06:00, but isOverNight=false)
        const payload3 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload3.workingHours.mon.start = '07:00';
        payload3.workingHours.mon.end = '06:00';
        payload3.workingHours.mon.isOverNight = true;

        payload3.specificBreaks.mon.lunch.start = '22:00';
        payload3.specificBreaks.mon.lunch.end = '06:00';
        payload3.specificBreaks.mon.lunch.isOverNight = false;

        const res3 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload3);

        expect(res3.status).toBe(400);
        expect(res3.body.msg.errors).toContainEqual({
            'specificBreaks.mon.lunch.isOverNight': 'srv_invalid_overnight'
        });

        // Case 4: isAvailable is not boolean
        const payload4 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload4.specificBreaks.mon.lunch.isAvailable = 'yes';

        const res4 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload4);

        expect(res4.status).toBe(400);
        expect(res4.body.msg.errors).toContainEqual({
            'specificBreaks.mon.lunch.isAvailable': 'misc_required'
        });

        // Case 5: Missing required `start`
        const payload5 = JSON.parse(JSON.stringify(validRegisterPayload));
        delete payload5.specificBreaks.mon.lunch.start;

        const res5 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload5);

        expect(res5.status).toBe(400);
        expect(res5.body.msg.errors).toContainEqual({
            'specificBreaks.mon.lunch.start': 'misc_required'
        });

        // Case 6: invalid time format
        const payload6 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload6.specificBreaks.mon.lunch.end = '25:00';

        const res6 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload6);

        expect(res6.status).toBe(400);
        expect(res6.body.msg.errors).toContainEqual({
            'specificBreaks.mon.lunch.end': 'srv_invalid_time'
        });

        // Case 7: out of working hours
        const payload7 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload7.workingHours.mon.end = '23:49';
        payload7.specificBreaks.mon.dinner.end = '23:50';

        const res7 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload7);

        expect(res7.status).toBe(400);
        expect(res7.body.msg.errors).toContainEqual({
            'specificBreaks.mon.dinner.end': 'srv_invalid_break_range'
        });
    });

    test('should reject if isOverNight flag does not match actual time range', async () => {
        const cookie = await login();
        const payload = JSON.parse(JSON.stringify(validRegisterPayload));
        payload.workingHours.mon.start = '22:00';
        payload.workingHours.mon.end = '06:00';
        payload.workingHours.mon.isOverNight = false;

        const response = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.msg.errors).toBeDefined();
        expect(response.body.msg.errors).toContainEqual({
            'workingHours.mon.isOverNight': 'srv_invalid_overnight'
        });

        const payload2 = JSON.parse(JSON.stringify(validRegisterPayload));
        payload2.workingHours.tue.start = '07:00';
        payload2.workingHours.tue.end = '06:00';
        payload2.workingHours.tue.isOverNight = true;
        
        payload2.breaks.tue[1].start = '22:00';
        payload2.breaks.tue[1].end = '06:00';
        payload2.breaks.tue[1].isOverNight = false;

        const response2 = await request
            .post(`${routePrefix}`)
            .set('Cookie', cookie)
            .send(payload2);

        expect(response2.status).toBe(400);
        expect(response2.body.msg.errors).toBeDefined();
        expect(response2.body.msg.errors).toContainEqual({
            'breaks.tue[1].isOverNight': 'srv_invalid_overnight'
        });
    });

    test('should return 401 if not authenticated', async () => {
        const response = await request
            .post(`${routePrefix}`)
            .send(validRegisterPayload);

        expect(response.status).toBe(401);
    });
});

describe(`POST ${routePrefix}s`, () => {
    test('should return all registers', async () => {
        const cookie = await login();
        const response = await request
            .post(`${routePrefix}s`)
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body.msg).toBeInstanceOf(Array);
    });
});