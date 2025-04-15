const utils = require('../../utils');
const Attendance = require('../../models/Attendance');
const DailyAttendance = require('../../models/DailyAttendance');

const { getAvailableResourcesByDeviceId } = require('./workplaces');

const getAttendances = async (req, res, next) => {
    try {
        const { limit = 10, skip = 0 } = req.query;
        const { workingAts, registers, retails } = await getAvailableResourcesByDeviceId({
            deviceId: req.deviceId,
            employeesSelect: { _id: 1 },
            workingAtsSelect: { registerId: 1, employeeId: 1 },
            registersSelect: { name: 1, address: 1 },
        });

        const workingAtIds = workingAts.map(wa => wa._id);

        const attendances = await Attendance.find({ workingAtId: { $in: workingAtIds } })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip) || 0)
            .limit(parseInt(limit) + 1 || 11)
            .exec();

        const hasMore = attendances.length > limit;

        if (hasMore) {
            attendances.pop();
        }

        const dailyAttendanceIds = attendances.map(a => a.dailyAttendanceId);
        const dailyAttendances = await DailyAttendance.find({ _id: { $in: dailyAttendanceIds } }).select({ date: 1, workingHour: 1, registerId: 1 }).lean().exec();


        return res.status(200).json({
            success: true,
            msg: { dailyAttendances, attendances, registers, workingAts, retails, hasMore }
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_get_latest_attendance', 500));
    }
};

const getAttendancesByRetail = async (req, res, next) => {
    try {
        const { limit = 10, skip = 0 } = req.query;
        const { retailId } = req.params;

        if (!retailId) {
            return res.status(400).json({
                success: false,
                msg: 'srv_invalid_request'
            });
        }

        const { workingAts, registers, retails, employees } = await getAvailableResourcesByDeviceId({
            deviceId: req.deviceId,
            retailId,
            employeesSelect: { _id: 1, name: 1, email: 1, phone: 1 },
            workingAtsSelect: { registerId: 1, employeeId: 1, position: 1, shifts: 1 },
            registersSelect: { name: 1, address: 1 },
        });

        const workingAtIds = workingAts.map(wa => wa._id);

        const attendances = await Attendance.find({ workingAtId: { $in: workingAtIds } })
            .sort({ createdAt: -1 })
            .skip(parseInt(skip) || 0)
            .limit(parseInt(limit) + 1 || 11)
            .exec();

        const hasMore = attendances.length > limit;
        if (hasMore) attendances.pop();

        const retail = retails.find(r => String(r._id) === retailId);

        const dailyAttendanceIds = attendances.map(a => a.dailyAttendanceId);
        const dailyAttendances = await DailyAttendance.find({ _id: { $in: dailyAttendanceIds } }).select({ date: 1, workingHour: 1, registerId: 1 }).lean().exec();


        return res.status(200).json({
            success: true,
            msg: {
                dailyAttendances,
                attendances,
                registers,
                workingAts,
                employees,
                retail,
                hasMore
            }
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_get_latest_attendance', 500));
    }
};


module.exports = { getAttendances, getAttendancesByRetail }