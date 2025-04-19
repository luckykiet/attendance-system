const HttpError = require('../../constants/http-error');
const Employee = require('../../models/Employee');
const Register = require('../../models/Register');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const DailyAttendance = require('../../models/DailyAttendance');

dayjs.extend(customParseFormat);

const getAttendanceAggregationRegisterAndByRange = async (req, res, next) => {
    try {
        const { registerId, from, to } = req.body;

        if (!registerId || !from || !to) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const register = await Register.findOne({ _id: registerId, retailId: req.user.retailId });
        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }

        if (!dayjs(from, 'YYYYMMDD', true).isValid() || !dayjs(to, 'YYYYMMDD', true).isValid()) {
            throw new HttpError('srv_invalid_date', 400);
        }

        const dailyAttendances = await DailyAttendance.find({
            registerId,
            date: { $gte: Number(from), $lte: Number(to) }
        }).lean();

        // Initialize aggregation
        const aggregation = {
            totalDays: dailyAttendances.length || 0,
            totalexpectedShifts: 0,
            totalExpectedShifts: 0,
            totalAttendances: 0,

            checkedInOnTime: 0,
            checkedInLate: 0,
            missingCheckIn: 0,

            checkedOutOnTime: 0,
            checkedOutEarly: 0,
            missingCheckOut: 0,

            totalWorkingMinutes: 0,
            workingHoursByEmployee: new Map(),
        };

        if (!dailyAttendances.length) {
            return res.status(200).json({ success: true, msg: aggregation });
        }

        dailyAttendances.forEach(daily => {
            aggregation.totalexpectedShifts += daily.expectedShifts.length;
            aggregation.totalAttendances += daily.attendanceIds.length;

            aggregation.checkedInOnTime += daily.checkedInOnTime.length;
            aggregation.checkedInLate += daily.checkedInLate.length;
            aggregation.missingCheckIn += daily.missingCheckIn.length;

            aggregation.checkedOutOnTime += daily.checkedOutOnTime.length;
            aggregation.checkedOutEarly += daily.checkedOutEarly.length;
            aggregation.missingCheckOut += daily.missingCheckOut.length;

            if (daily.workingHoursByEmployee) {
                for (const minutes of daily.workingHoursByEmployee.values()) {
                    aggregation.totalWorkingMinutes += minutes;
                }
            }
        });

        return res.status(200).json({ success: true, msg: aggregation });

    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_attendance_aggregation_failed', 500));
    }
};

module.exports = {
    getAttendanceAggregationRegisterAndByRange,
};