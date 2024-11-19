const HttpError = require('../../constants/http-error');
const Register = require('../../models/Register');
const Attendance = require('../../models/Attendance');
const utils = require('../../utils');

const updateAttendanceById = async (req, res, next) => {
    try {
        const { _id: attendanceId, ...data } = req.body;

        const attendance = await Attendance.findOne({ _id: attendanceId });
        if (!attendance) {
            throw new HttpError('srv_attendance_not_found', 404);
        }

        const register = await Register.findOne({ _id: attendance.registerId, retailId: req.user.retailId });
        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }
        const newAttendance = await Attendance.findOneAndUpdate({ _id: attendanceId }, { $set: data }, { runValidators: true, new: true });
        return res.status(200).json({ success: true, msg: newAttendance });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_update_attendance', 500));
    }
}

module.exports = {
    updateAttendanceById
};