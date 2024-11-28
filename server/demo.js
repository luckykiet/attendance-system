const Retail = require('./models/Retail')
const Register = require('./models/Register')
const User = require('./models/User')
const Employee = require('./models/Employee')
const bcrypt = require('bcryptjs')

const demoAccount = {
    retail: {
        tin: '12345678',
        vin: 'CZ12345678',
        name: 'Demo Retail',
        address: {
            street: 'Demo Street',
            city: 'Demo City',
            zip: '12345',
        },
        isAvailable: true,
    },
    register: {
        name: 'Demo Register',
        address: {
            street: 'Demo Street',
            city: 'Demo City',
            zip: '12345',
        },
        location: {
            type: 'Point',
            coordinates: [14.123456, 50.123456],
            allowedRadius: 100,
        },
        workingHours: {
            mon: { start: '00:00', end: '23:59', isAvailable: true },
            tue: { start: '00:00', end: '23:59', isAvailable: true },
            wed: { start: '00:00', end: '23:59', isAvailable: true },
            thu: { start: '00:00', end: '23:59', isAvailable: true },
            fri: { start: '00:00', end: '23:59', isAvailable: true },
            sat: { start: '00:00', end: '23:59', isAvailable: true },
            sun: { start: '00:00', end: '23:59', isAvailable: true },
        },
        maxLocalDevices: 0,
        isAvailable: true,
    },
    user: {
        email: 'abc@xyz.com',
        username: 'demo',
        password: 'demodemo',
        name: 'Demo User',
        phone: '123456789',
        role: 'Admin',
        notes: 'Demo User',
        isAvailable: true,
    },
    employees: {
        demo: {
            email: 'abc@xyz.com',
            name: 'Demo User',
            registrationToken: 'demo',
        },
        apple: {
            email: 'demo.apple@xyz.com',
            name: 'Demo Apple',
            registrationToken: 'demoapple',
        },
        google: {
            email: 'demo.google@xyz.com',
            name: 'Demo Google',
            registrationToken: 'demogoogle',
        },
    },
}

const generateDemoData = async () => {
    try {
        const retail = await Retail.findOneAndUpdate({ tin: demoAccount.retail.tin }, demoAccount.retail, { upsert: true, new: true })
        const password = await bcrypt.hash(demoAccount.user.password, 12)
        await User.findOneAndUpdate({ email: demoAccount.user.email }, { ...demoAccount.user, password, retailId: retail._id }, { upsert: true, new: true })
        
        await Register.findOneAndUpdate({ retailId: retail._id, name: 'Demo with local device' }, { ...demoAccount.register, retailId: retail._id, name: 'Demo with local device', maxLocalDevices: 1 }, { upsert: true, new: true })
        await Register.findOneAndUpdate({ retailId: retail._id, name: 'Demo without local device' }, { ...demoAccount.register, retailId: retail._id, name: 'Demo without local device' }, { upsert: true, new: true })
        await Employee.findOneAndUpdate({ retailId: retail._id, email: demoAccount.employees.demo.email }, { ...demoAccount.employees.demo, retailId: retail._id, }, { upsert: true, new: true })
        await Employee.findOneAndUpdate({ retailId: retail._id, email: demoAccount.employees.apple.email }, { ...demoAccount.employees.apple, retailId: retail._id, }, { upsert: true, new: true })
        await Employee.findOneAndUpdate({ retailId: retail._id, email: demoAccount.employees.google.email }, { ...demoAccount.employees.google, retailId: retail._id, }, { upsert: true, new: true })
    } catch (error) {
        console.error('Retail create error:', error)
    }
}

module.exports = { demoAccount, generateDemoData }