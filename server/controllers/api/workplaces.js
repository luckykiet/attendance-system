const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const DailyAttendance = require('../../models/DailyAttendance');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { DAYS_OF_WEEK } = require('../../constants');

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

        const dateToUse = date ? dayjs(date) : dayjs();
        const dayIndex = dateToUse.day();
        const dayKey = DAYS_OF_WEEK[dayIndex];

        const workingHourKey = `workingHours.${dayKey}.isAvailable`;

        // get only the registerIds where the employee is working today
        const workingAts = await WorkingAt.find({ employeeId: { $in: employees.map(e => e._id) }, [workingHourKey]: true, isAvailable: true }).select('registerId workingHours').exec();

        if (!workingAts.length) {
            return res.status(200).json({ success: true, msg: [] });
        }

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
            registerObj.employeeWorkingHours = workingAt.workingHours;

            const regLongitude = registerObj.location.longitude;
            const regLatitude = registerObj.location.latitude;
            registerObj.distanceInMeters = hasLocation ? utils.calculateDistance({ originLat: latitude, originLon: longitude, newLat: regLatitude, newLon: regLongitude }) : null;
            return registerObj;
        });
        if (hasLocation) {
            leanNearbyRegisters.sort((a, b) => a.distanceInMeters - b.distanceInMeters);
        } else {
            leanNearbyRegisters.sort((a, b) => a.name.localeCompare(b.name));
        }

        return res.status(200).json({ success: true, msg: leanNearbyRegisters });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_companies', 500));
    }
};

const getMyWorkingPlaces = async (req, res, next) => {
    try {
        // get the employee(s) by the deviceId
        const employees = await Employee.find({ deviceId: req.deviceId }).select('retailId').exec();

        if (!employees.length) {
            return res.status(200).json({ success: true, msg: { workingAts: [], registers: [] } });
        }

        // get only the registerIds where the employee is working
        const workingAts = await WorkingAt.find({ employeeId: { $in: employees.map(e => e._id) }, isAvailable: true }).select('registerId workingHours').exec();

        if (!workingAts.length) {
            return res.status(200).json({ success: true, msg: { workingAts: [], registers: [] } });
        }

        // get all registers near the employee, where the employee is working at and belongs to the same company
        const registers = await Register.find({ _id: { $in: workingAts.map(w => w.registerId) } }).select('name workingHours address');

        return res.status(200).json({ success: true, msg: { registers, workingAts } });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_companies', 500));
    }
};

module.exports = {
    getTodayWorkplaces,
    getMyWorkingPlaces
};
