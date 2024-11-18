const HttpError = require('../../constants/http-error');
const Employee = require('../../models/Employee');
const Register = require('../../models/Register');
const Attendance = require('../../models/Attendance');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { getDailyAttendance } = require('../api/attendance');

dayjs.extend(customParseFormat);

const getAttendancesByRegisterAndDate = async (req, res, next) => {
    try {
        const { registerId, date } = req.body;
        const register = await Register.findOne({ _id: registerId, retailId: req.user.retailId });
        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }
        if (!date) {
            throw new HttpError('srv_date_not_found', 400);
        }

        if (!dayjs(date, 'YYYYMMDD').isValid()) {
            throw new HttpError('srv_invalid_date', 400);
        }

        const attendance = await getDailyAttendance({ registerId, date })
        if (!attendance) {
            throw new HttpError('srv_attendance_not_found', 404);
        }

        const employees = await Employee.find({ _id: { $in: attendance.employeeIds } });

        const attendances = await Attendance.find({ dailyAttendanceId: attendance._id });

        return res.status(200).json({ success: true, msg: { attendance, employees, attendances } });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_attendance_not_found', 404));
    }
}

module.exports = {
    getAttendancesByRegisterAndDate
};
