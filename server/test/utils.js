const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { customAlphabet } = require('nanoid');

const { ObjectId } = mongoose.Types;

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

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

const login = async (request, role = 'Admin', retailId = new ObjectId()) => {
    const username = `user${nanoid()}`;
    const email = `${username}@example.com`;

    const user = new User({
        username,
        email,
        password: await bcrypt.hash('adminpass', 10),
        name: 'Test User',
        role,
        isAvailable: true,
        retailId,
    });

    await user.save();

    const loginResponse = await request.post('/auth/login').send({
        username,
        password: Buffer.from('adminpass').toString('base64'),
    });

    return loginResponse.headers['set-cookie'];
};

const createRegister = async (request) => {
    const cookie = await login(request);

    const createResponse = await request
        .post('/mod/register')
        .set('Cookie', cookie)
        .send(validRegisterPayload);

    const createdId = createResponse.body.msg._id;

    return { cookie, createdId };
}

async function createTestRetail(overrides = {}) {
    const retail = {
        name: 'Test Retail',
        tin: Math.floor(Math.random() * 1e8).toString().padStart(8, '0'), // random tin
        address: {
            street: 'Test Street',
            city: 'Test City',
            zip: '12345',
        },
        ...overrides,
    };
    return retail;
}

async function createTestUser({ retailId }, overrides = {}) {
    const user = {
        email: `testuser${Math.floor(Math.random() * 10000)}@example.com`,
        username: `testuser${Math.floor(Math.random() * 10000)}`,
        name: 'Test User',
        password: 'password',
        role: 'Admin',
        retailId,
        isAvailable: true,
        ...overrides,
    };
    return user;
}

async function createTestRegister({ retailId }, overrides = {}) {
    const payload = {
        ...validRegisterPayload,
        retailId,
        location: {
            type: 'Point',
            coordinates: [1.0, 1.0], // Add dummy coordinates for test
        },
        ...overrides,
    };

    return payload;
}

async function createTestEmployee({ retailId, publicKey, deviceId }, overrides = {}) {
    const employee = {
        email: `testemployee${Math.floor(Math.random() * 10000)}@example.com`,
        username: `testemployee${Math.floor(Math.random() * 10000)}`,
        name: 'Test Employee',
        deviceId: deviceId ? deviceId : `device${Math.floor(Math.random() * 10000)}`,
        publicKey: publicKey ? publicKey : `publicKey${Math.floor(Math.random() * 10000)}`,
        retailId,
        ...overrides,
    }
    return employee;
}

async function createTestWorkingAt({ employeeId, registerId, userId }, overrides = {}) {
    const defaultShift = {
        start: '08:00',
        end: '17:00',
        allowedOverTime: 20,
        isOverNight: false,
        isAvailable: true,
    };

    const workingAt = {
        employeeId,
        registerId,
        userId,
        position: 'Test Position',
        isAvailable: true,
        shifts: {
            mon: [{ ...defaultShift }],
            tue: [{ ...defaultShift }],
            wed: [{ ...defaultShift }],
            thu: [{ ...defaultShift }],
            fri: [{ ...defaultShift }],
            sat: [{ ...defaultShift }],
            sun: [{ ...defaultShift }],
        },
        ...overrides,
    }

    return workingAt;
}

const createAndSave = async (Model, factoryFn) => {
    const doc = new Model(await factoryFn);
    return await doc.save();
};

module.exports = {
    login,
    createRegister,
    validRegisterPayload,
    createTestRetail,
    createTestUser,
    createTestRegister,
    createTestEmployee,
    createTestWorkingAt,
    createAndSave,
};