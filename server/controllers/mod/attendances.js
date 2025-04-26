const HttpError = require('../../constants/http-error');
const Employee = require('../../models/Employee');
const Register = require('../../models/Register');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { getDailyAttendance } = require('../api/attendance');
const DailyAttendance = require('../../models/DailyAttendance');

dayjs.extend(customParseFormat);

const getAttendancesByRegisterAndDate = async (req, res, next) => {
    try {
        const { registerId, date } = req.body;
        const register = await Register.findOne({ _id: registerId, retailId: req.user.retailId });

        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }

        if (!date && !dayjs(date, 'YYYYMMDD').isValid()) {
            throw new HttpError('srv_invalid_date', 400);
        }

        const dailyAttendance = await getDailyAttendance({ registerId, date })

        if (!dailyAttendance) {
            throw new HttpError('srv_attendance_not_found', 404);
        }

        const employeeIds = new Set(dailyAttendance.expectedShifts.map(shift => shift.employeeId));

        const employees = await Employee.find({ _id: { $in: Array.from(employeeIds) } }).select({
            name: 1,
            email: 1,
            phone: 1,
            retailId: 1,
            _id: 1,
        }).lean();

        const workingAts = await WorkingAt.find({ registerId, employeeId: { $in: Array.from(employeeIds) } });
        employees.forEach(employee => {
            const workingAt = workingAts.find(workingAt => workingAt.employeeId.toString() === employee._id.toString());
            if (workingAt) {
                employee.workingHours = workingAt.workingHours;
            }
        });
        const attendances = await Attendance.find({ dailyAttendanceId: dailyAttendance._id });
        return res.status(200).json({ success: true, msg: { attendance: dailyAttendance, employees, attendances } });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_attendance_not_found', 404));
    }
}

const getAttendancesByEmployeeAndDate = async (req, res, next) => {
    try {
        const { employeeId, registerId, date } = req.body;
        const employee = await Employee.findOne({ _id: employeeId, retailId: req.user.retailId });
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        if (!date) {
            throw new HttpError('srv_date_not_found', 400);
        }

        if (!dayjs(date, 'YYYYMMDD').isValid()) {
            throw new HttpError('srv_invalid_date', 400);
        }

        const register = await Register.findOne({ _id: registerId, retailId: req.user.retailId });

        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }

        const workingAt = await WorkingAt.findOne({ employeeId, registerId, isAvailable: true });

        if (!workingAt) {
            throw new HttpError('srv_employee_not_working_here', 404);
        }

        const dailyAttendance = await DailyAttendance.findOne({ registerId, date });

        if (!dailyAttendance) {
            throw new HttpError('srv_attendance_not_found', 404);
        }

        const attendance = await Attendance.findOne({ dailyAttendanceId: dailyAttendance._id, workingAtId: workingAt._id });

        if (!attendance) {
            throw new HttpError('srv_attendance_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: attendance });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_attendance_not_found', 404));
    }
}

module.exports = {
    getAttendancesByRegisterAndDate,
    getAttendancesByEmployeeAndDate
};
