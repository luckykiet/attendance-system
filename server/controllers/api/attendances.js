const utils = require('../../utils');

const Employee = require('../../models/Employee');
const Register = require('../../models/Register');
const Attendance = require('../../models/Attendance');

const getAttendances = async (req, res, next) => {
    try {
        const { limit = 10, skip = 0 } = req.query;
        const employees = await Employee.find({ deviceId: req.deviceId }).exec();
        if (!employees.length) {
            throw 'srv_employee_not_found';
        }
        const attendances = await Attendance.find({ employeeId: { $in: employees.map(e => e._id) } })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip) || 0)
            .limit(parseInt(limit) + 1 || 11)
            .exec();

        const hasMore = attendances.length > limit;
        if (hasMore) {
            attendances.pop();
        }

        const registerIds = attendances.map(a => a.registerId);
        const registers = await Register.find({ _id: { $in: registerIds } }).select('name address').exec();

        return res.status(200).json({
            success: true,
            msg: { attendances, registers, hasMore }
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_get_latest_attendance', 500));
    }
};

module.exports = { getAttendances }