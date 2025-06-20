const Retail = require('./models/Retail')
const Register = require('./models/Register')
const User = require('./models/User')
const Employee = require('./models/Employee')
const Registration = require('./models/Registration')
const WorkingAt = require('./models/WorkingAt')
const LocalDevice = require('./models/LocalDevice')
const DailyAttendance = require('./models/DailyAttendance')
const Attendance = require('./models/Attendance')
const bcrypt = require('bcryptjs')

const defaultSpecificBreaks = {
    breakfast: {
        start: "07:00",
        end: "09:00",
        duration: 60,
        isOverNight: false,
        isAvailable: true,
    },
    lunch: {
        start: "11:00",
        end: "13:00",
        duration: 60,
        isOverNight: false,
        isAvailable: true,
    },
    dinner: {
        start: "17:00",
        end: "19:00",
        duration: 60,
        isOverNight: false,
        isAvailable: true,
    },
}

const defaultBreak = {
    start: '00:00',
    end: '23:59',
    name: 'Walking break',
    duration: 30,
    isOverNight: false,
}

const defaultShift = {
    start: '00:00',
    end: '23:59',
    allowedOverTime: 1440, // in minutes
    isOverNight: false,
    isAvailable: true,
}

const defaultWorkingHours = { start: '00:00', end: '23:59', isOverNight: false, isAvailable: true };

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
        breaks: {
            mon: [defaultBreak],
            tue: [defaultBreak],
            wed: [defaultBreak],
            thu: [defaultBreak],
            fri: [defaultBreak],
            sat: [defaultBreak],
            sun: [defaultBreak],
        },
        specificBreaks: {
            mon: defaultSpecificBreaks,
            tue: defaultSpecificBreaks,
            wed: defaultSpecificBreaks,
            thu: defaultSpecificBreaks,
            fri: defaultSpecificBreaks,
            sat: defaultSpecificBreaks,
            sun: defaultSpecificBreaks
        },
        workingHours: {
            mon: defaultWorkingHours,
            tue: defaultWorkingHours,
            wed: defaultWorkingHours,
            thu: defaultWorkingHours,
            fri: defaultWorkingHours,
            sat: defaultWorkingHours,
            sun: defaultWorkingHours,
        },
        maxLocalDevices: 0,
        isAvailable: true,
    },
    registers: [
        {
            name: 'Demo with local device',
            maxLocalDevices: 1,
        },
        {
            name: 'Demo always success',
        },
        {
            name: 'Demo always fail',
        },
    ],
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
    localDevice: {
        deviceId: '00000000-0000-0000-0000-000000000000',
        uuid: '00000000-0000-0000-0000-000000000000',
        location: {
            latitude: 50.123456,
            longitude: 14.123456,
            allowedRadius: 1000,
        },
    }
};

const generateDemoData = async () => {
    try {
        const retail = await Retail.findOneAndUpdate({ tin: demoAccount.retail.tin }, demoAccount.retail, { upsert: true, new: true })
        const password = await bcrypt.hash(demoAccount.user.password, 12)
        await User.findOneAndUpdate({ email: demoAccount.user.email }, { ...demoAccount.user, password, retailId: retail._id }, { upsert: true, new: true })

        const registers = await Promise.all(demoAccount.registers.map(async register => {
            const newRegister = await Register.findOneAndUpdate({ retailId: retail._id, name: register.name }, { ...demoAccount.register, retailId: retail._id, ...register }, { upsert: true, new: true })
            if (register.maxLocalDevices) {
                await LocalDevice.findOneAndUpdate({ deviceId: demoAccount.localDevice.deviceId }, { ...demoAccount.localDevice, registerId: newRegister._id }, { upsert: true, new: true })
            }
            await DailyAttendance.deleteMany({ registerId: newRegister._id })
            return newRegister;
        }))

        const promises = Object.keys(demoAccount.employees).map(async key => {
            const employee = await Employee.findOneAndUpdate({ retailId: retail._id, email: demoAccount.employees[key].email }, { ...demoAccount.employees[key], retailId: retail._id, }, { upsert: true, new: true })
            await Promise.all(registers.map(async register => {
                return await WorkingAt.findOneAndUpdate({ registerId: register._id, employeeId: employee._id },
                    {
                        registerId: register._id,
                        employeeId: employee._id,
                        workingHours: register.workingHours,
                        shifts: {
                            mon: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift],
                            tue: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift],
                            wed: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift],
                            thu: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift],
                            fri: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift],
                            sat: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift],
                            sun: [{ ...defaultShift, start: '00:00', end: '08:00' }, { ...defaultShift, start: '08:00', end: '16:00' }, { ...defaultShift, start: '16:00', end: '23:59' }, defaultShift]
                        },
                        isAvailable: true
                    }, { upsert: true, new: true })
            }))
            await Registration.findOneAndUpdate({ retailId: retail._id, employeeId: employee._id }, { tokenId: demoAccount.employees[key].registrationToken, retailId: retail._id, employeeId: employee._id, isDemo: true }, { upsert: true, new: true })
            const workingAt = await WorkingAt.findOne({ registerId: { $in: registers.map((reg) => reg._id) }, employeeId: employee._id })
            await Attendance.deleteMany({ workingAtId: workingAt._id })
        })
        await Promise.all(promises);

    } catch (error) {
        console.error('Demo creation error:', error)
    }
}

module.exports = { demoAccount, generateDemoData }