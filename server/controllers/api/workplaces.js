const Retail = require('../../models/Retail');
const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const DailyAttendance = require('../../models/DailyAttendance');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { DAYS_OF_WEEK } = require('../../constants');
const geolib = require('geolib');

dayjs.extend(customParseFormat);

const getTodayWorkplaces = async (req, res, next) => {
    try {
        // date is optional, if not provided, it will take the current date; date format: YYYYMMDD
        const { longitude, latitude, date } = req.body;

        let hasLocation = true;
        if (!longitude || !latitude) {
            hasLocation = false;
        }

        // get the employee(s) by the deviceId
        const employees = await Employee.find({ deviceId: req.deviceId }).select('retailId').exec();

        if (!employees.length) {
            return res.status(200).json({ success: true, msg: [] });
        }

        // get only the registerIds where the employee is working today
        const workingAts = await WorkingAt.find({ employeeId: { $in: employees.map(e => e._id) }, isAvailable: true }).select('registerId shifts').exec();

        if (!workingAts.length) {
            return res.status(200).json({ success: true, msg: [] });
        }

        const dateToUse = date ? dayjs(date) : dayjs();
        const dayIndex = dateToUse.day();
        const dayKey = DAYS_OF_WEEK[dayIndex];
        let todayShifts = [];
        workingAts.forEach(wa => {
            const shifts = wa.shifts instanceof Map ? Object.fromEntries(wa.shifts) : wa.shifts;
            if (Array.isArray(shifts[dayKey])) {
                todayShifts = shifts[dayKey].filter(s => s.isAvailable);
            }
            delete wa.shifts;
            wa.shifts[dayKey] = todayShifts;
        });

        const dailyAttendances = await DailyAttendance.find({ date: parseInt(dateToUse.format('YYYYMMDD')), registerId: { $in: workingAts.map((wa) => wa.registerId) } }).exec();
        const attendances = await Attendance.find({ dailyAttendanceId: { $in: dailyAttendances.map((da) => da._id) } }).select('registerId checkInTime checkOutTime').exec()

        // get all registers, where the employee is working at and belongs to the same company
        const nearbyRegisters = await Register.find({
            _id: { $in: workingAts.map(w => w.registerId) }
        }).select('name workingHours location address');

        const leanNearbyRegisters = nearbyRegisters.map(register => {
            const attendance = attendances.find(a => a.registerId.equals(register._id));
            const workingAt = workingAts.find(w => w.registerId.equals(register._id));
            const registerObj = register.toObject();
            delete registerObj.id;

            registerObj.checkInTime = attendance?.checkInTime || null;
            registerObj.checkOutTime = attendance?.checkOutTime || null;
            registerObj.shifts = workingAt.shifts;

            const regLongitude = registerObj.location.longitude;
            const regLatitude = registerObj.location.latitude;
            registerObj.distanceInMeters = hasLocation ? geolib.getDistance({ latitude, longitude }, { latitude: regLatitude, longitude: regLongitude }) : null;
            return registerObj;
        });
        if (hasLocation) {
            leanNearbyRegisters.sort((a, b) => a.distanceInMeters - b.distanceInMeters);
        } else {
            leanNearbyRegisters.sort((a, b) => a.name.localeCompare(b.name));
        }

        return res.status(200).json({ success: true, msg: leanNearbyRegisters });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_workplaces', 500));
    }
};

const getMyWorkingPlaces = async (req, res, next) => {
    try {
        const defaultResponse = { success: true, msg: { workingAts: [], registers: [], employees: [], retails: [] } };

        const employees = await Employee.find({ deviceId: req.deviceId, isAvailable: true })
            .select('retailId name phone email')
            .exec();

        if (!employees.length) {
            return res.status(200).json(defaultResponse);
        }

        const employeeIds = employees.map(e => e._id);

        let workingAts = await WorkingAt.find({ employeeId: { $in: employeeIds }, isAvailable: true })
            .select('registerId shifts position employeeId')
            .exec();

        if (!workingAts.length) {
            return res.status(200).json(defaultResponse);
        }

        workingAts.forEach(wa => {
            const shifts = wa.shifts instanceof Map ? Object.fromEntries(wa.shifts) : wa.shifts;
            for (const day in shifts) {
                if (Array.isArray(shifts[day])) {
                    shifts[day] = shifts[day].filter(s => s.isAvailable);
                }
            }
            wa.shifts = shifts;
        });

        const registerIds = workingAts.map(w => w.registerId);

        const registers = await Register.find({ _id: { $in: registerIds }, isAvailable: true })
            .select('retailId name workingHours address')
            .exec();

        const availableRegisterIds = registers.map(r => r._id.toString());

        workingAts = workingAts.filter(wa => availableRegisterIds.includes(wa.registerId.toString()));

        const usedEmployeeIds = new Set(workingAts.map(wa => wa.employeeId.toString()));
        const filteredEmployees = employees.filter(emp => usedEmployeeIds.has(emp._id.toString()));

        const retailIds = filteredEmployees.map(emp => emp.retailId);
        const retails = await Retail.find({ _id: { $in: retailIds } })
            .select('name address tin vin')
            .exec();

        return res.status(200).json({
            success: true,
            msg: {
                retails,
                registers,
                workingAts,
                employees: filteredEmployees,
            },
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_workplaces', 500));
    }
};

module.exports = {
    getTodayWorkplaces,
    getMyWorkingPlaces
};
