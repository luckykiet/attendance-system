const { beforeAll, afterEach, afterAll, describe, test, expect } = require('@jest/globals');
const supertest = require('supertest');
const app = require('../../app');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const db = require('../db');
const { ObjectId } = mongoose.Types;

const routePrefix = '/auth';
const request = supertest(app);

beforeAll(async () => {
    await db.connect();
});

afterEach(async () => {
    await db.clearDatabase();
});

afterAll(async () => {
    await db.closeDatabase();
});

const logoutUser = async (cookie) => {
    await request.post(`${routePrefix}/signout`).set('Cookie', cookie);
};

describe(`POST ${routePrefix}/login`, () => {
    test('should return 200 and log in user successfully', async () => {
        const password = await bcrypt.hash('password123', 10);
        const user = new User({
            email: 'login@example.com',
            username: 'loginuser',
            name: 'Login User',
            password,
            role: 'Admin',
            retailId: new ObjectId(),
            isAvailable: true,
        });
        await user.save();

        const encodedPassword = Buffer.from('password123').toString('base64');
        const response = await request.post(`${routePrefix}/login`).send({
            username: 'loginuser',
            password: encodedPassword,
        });

        expect(response.status).toBe(200);
        expect(response.body.email).toBe('login@example.com');
        expect(response.body.name).toBe('Login User');
        expect(response.body.username).toBe('loginuser');
        expect(response.body.role).toBe('Admin');
        expect(response.headers['set-cookie']).toBeDefined();
        await logoutUser(response.headers['set-cookie']);
    });

    test('should return 401 for invalid login credentials', async () => {
        const response = await request.post(`${routePrefix}/login`).send({
            username: 'loginuser',
            password: 'wrongpassword',
        });

        expect(response.status).toBe(401);
    });
    test('should return 401 for invalid login credentials', async () => {
        const encodedPassword = Buffer.from('password123').toString('base64');
        const response = await request.post(`${routePrefix}/login`).send({
            username: 'wronguser',
            password: encodedPassword,
        });

        expect(response.status).toBe(401);
    });
});

describe(`POST ${routePrefix}/isAuthenticated`, () => {
    test('should return 200 and check if user is authenticated', async () => {
        const password = await bcrypt.hash('password123', 10);
        const user = new User({
            email: 'check@example.com',
            username: 'checkuser',
            name: 'Check User',
            password,
            role: 'Admin',
            retailId: new ObjectId(),
            isAvailable: true,
        });
        await user.save();

        const encodedPassword = Buffer.from('password123').toString('base64');
        const loginResponse = await request.post(`${routePrefix}/login`).send({
            username: 'checkuser',
            password: encodedPassword,
        });

        const response = await request
            .post(`${routePrefix}/isAuthenticated`)
            .set('Cookie', loginResponse.headers['set-cookie']);

        expect(response.status).toBe(200);
        expect(response.body.isAuthenticated).toBe(true);
        expect(response.body.email).toBe('check@example.com');
        expect(response.body.name).toBe('Check User');
        expect(response.body.username).toBe('checkuser');
        expect(response.body.role).toBe('Admin');
    });

    test('should return 400 for non-logged-in user', async () => {
        const response = await request.post(`${routePrefix}/isAuthenticated`);

        expect(response.status).toBe(200);
    });
});

describe(`POST ${routePrefix}/signout`, () => {
    test('should return 200 and sign out user successfully', async () => {
        const password = await bcrypt.hash('password123', 10);
        const user = new User({
            email: 'signout@example.com',
            username: 'signoutuser',
            name: 'Signout User',
            password,
            role: 'Admin',
            retailId: new ObjectId(),
            isAvailable: true,
        });
        await user.save();

        const encodedPassword = Buffer.from('password123').toString('base64');
        const loginResponse = await request.post(`${routePrefix}/login`).send({
            email: 'signout@example.com',
            password: encodedPassword,
        });

        const response = await request
            .post(`${routePrefix}/signout`)
            .set('Cookie', loginResponse.headers['set-cookie']);

        expect(response.status).toBe(200);

        const responseCheckAuth = await request.post(
            `${routePrefix}/isAuthenticated`
        );

        expect(responseCheckAuth.body.isAuthenticated).toBe(false);
    });

    test('should return 200 but indicate non-logged-in user', async () => {
        const response = await request.post(`${routePrefix}/signout`);

        expect(response.status).toBe(200);
    });
});

describe(`POST ${routePrefix}/signup`, () => {
    test('should sign up a user successfully with all attributes', async () => {
        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            tin: '12345678',
            name: 'New User',
            vin: 'VIN1234',
            address: {
                street: '123 Main St',
                city: 'Sample City',
                zip: '12345'
            },
        });

        expect(response.status).toBe(200);
        expect(response.body.email).toBe('newuser@example.com');
        expect(response.body.name).toBe('New User');
        expect(response.body.username).toBe('newuser');
        expect(response.body.role).toBe('Admin');
        expect(response.headers['set-cookie']).toBeDefined();
    });

    test('should not allow duplicate username', async () => {
        const user = new User({
            username: 'existinguser',
            email: 'existing@example.com',
            password: 'password123',
            tin: '87654321',
            retailId: new ObjectId(),
        });
        await user.save();

        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'existinguser',
            email: 'newemail@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            tin: '12345678',
            name: 'New User',
        });

        expect(response.status).toBe(409);
        expect(response.body.msg).toBe('srv_user_exists');
    });

    test('should not allow duplicate email', async () => {
        const user = new User({
            username: 'newuser',
            email: 'existing@example.com',
            password: 'password123',
            tin: '87654321',
            retailId: new ObjectId(),
        });
        await user.save();

        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'uniqueuser',
            email: 'existing@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            tin: '12345678',
            name: 'New User',
        });

        expect(response.status).toBe(409);
        expect(response.body.msg).toBe('srv_email_registered_exists');
    });

    test('should automatically fill address from ARES if address is missing', async () => {
        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'aresuser',
            email: 'aresuser@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            tin: '88721051',
            name: 'ARES User',
        });

        expect(response.status).toBe(200);
        expect(response.body.address).toBeDefined();
        expect(response.body.address.street).toBeDefined();
        expect(response.body.address.city).toBeDefined();
        expect(response.body.address.zip).toBeDefined();
    });

    test('should return error for non-matching passwords', async () => {
        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123',
            confirmPassword: 'differentpassword',
            tin: '12345678',
            name: 'New User',
        });

        expect(response.status).toBe(400);
        expect(response.body.msg).toBe('srv_passwords_not_match');
    });

    test('should assign default role if none is provided', async () => {
        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'defaultroleuser',
            email: 'defaultrole@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            tin: '12345678',
            name: 'Default Role User',
        });

        expect(response.status).toBe(200);
        expect(response.body.role).toBe('Admin');
    });

    test('should handle missing optional attributes gracefully', async () => {
        const response = await request.post(`${routePrefix}/signup`).send({
            username: 'partialuser',
            email: 'partialuser@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            tin: '12345678',
            name: 'Partial User',
        });

        expect(response.status).toBe(200);
        expect(response.body.email).toBe('partialuser@example.com');
        expect(response.body.username).toBe('partialuser');
        expect(response.body.name).toBe('Partial User');
        expect(response.body.vin).toBeUndefined();
        expect(response.body.address).toBeUndefined();
    });
});

