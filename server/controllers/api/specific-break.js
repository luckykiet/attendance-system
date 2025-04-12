const HttpError = require("../../constants/http-error");
const Register = require("../../models/Register");
const Retail = require("../../models/Retail");
const WorkingAt = require("../../models/WorkingAt");
const LocalDevice = require('../../models/LocalDevice');

const geolib = require('geolib');

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');

const { DAYS_OF_WEEK, TIME_FORMAT } = require('../../constants');
const _ = require('lodash');
const utils = require('../../utils');
const Attendance = require("../../models/Attendance");
const AttendanceBreakSchema = require("../../models/schemas/AttendanceBreak");

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const applySpecificBreak = async (req, res, next) => {
    try {
        const { latitude, longitude, registerId, localDeviceId, shiftId, attendanceId, breakId, breakKey } = req.body;
        const tokenPayload = req.tokenPayload;

        if (!longitude || !latitude || !registerId || !attendanceId || !shiftId || !breakKey || !tokenPayload) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const tmpBody = JSON.parse(JSON.stringify(req.body));
        delete tmpBody.token;
        delete tokenPayload.timestamp;

        if (!_.isEqual(tmpBody, tokenPayload)) {
            throw new HttpError('srv_invalid_request', 400);
        }

        let register = await Register.findOne({ _id: registerId }).exec();

        if (!register) {
            throw new HttpError('srv_register_not_found', 400);
        }

        const retail = await Retail.findOne({ _id: register.retailId }).exec();

        if (!retail) {
            throw new HttpError('srv_retail_not_found', 400);
        }

        const { employee } = req

        const workingAt = await WorkingAt.findOne({ employeeId: employee._id, registerId: register._id, isAvailable: true }).exec();

        if (!workingAt) {
            throw new HttpError('srv_employee_not_employed', 400);
        }
        // check for overnight shifts
        const now = dayjs();
        const todayKey = DAYS_OF_WEEK[now.day()];
        const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

        const yesterdayShifts = workingAt.shifts.get(yesterdayKey);
        const todayShifts = workingAt.shifts.get(todayKey);

        if ((!todayShifts && !yesterdayShifts) || (!todayShifts.length && !yesterdayShifts.length)) {
            throw new HttpError('srv_employee_not_working_today', 400);
        }
        let isToday = true;
        let shift = todayShifts.find(s => s._id.toString() === shiftId)
        if (!shift) {
            shift = yesterdayShifts.find(s => s._id.toString() === shiftId);
            if (!shift) {
                throw new HttpError('srv_shift_not_found', 400);
            }
            isToday = false;
            // because the shift is overnight, we need to check if the current time is after the end time of the shift. End time is the next day
            const endTime = dayjs(shift.end, TIME_FORMAT, true).add(1, 'day');
            if (now.isAfter(endTime)) {
                throw new HttpError('srv_shift_already_ended', 400);
            }
        }

        if (!shift || !shift.isAvailable) {
            throw new HttpError('srv_employee_not_working_today', 400);
        }

        const localDevices = await LocalDevice.find({ registerId }).exec();

        if (localDevices.length) {
            // should have a local device id, return the list of local devices
            if (!localDeviceId) {
                return res.status(200).json({ success: true, msg: 'srv_local_device_required', localDevices: localDevices.map(d => d.uuid) });
            }
            if (!localDevices.find(d => d.uuid === localDeviceId)) {
                throw new HttpError('srv_invalid_local_device', 400);
            }
        }
        const localDevice = localDeviceId ? localDevices.find(d => d.uuid === localDeviceId) : null;

        const locationToUse = localDevice && localDevice.location ? {
            latitude: localDevice.location.latitude,
            longitude: localDevice.location.longitude,
        } : {
            latitude: register.location.coordinates[1],
            longitude: register.location.coordinates[0],
        };

        const distanceInMeters = geolib.getDistance({ latitude, longitude }, locationToUse);
        const allowedRadius = localDevice && localDevice.location ? localDevice.location.allowedRadius : register.location.allowedRadius;

        if (distanceInMeters > allowedRadius) {
            throw new HttpError('srv_outside_allowed_radius', 400);
        }

        const attendanceQuery = {
            _id: attendanceId,
            workingAtId: workingAt._id,
            shiftId: shift._id,
        };

        const attendance = await Attendance.findOne(attendanceQuery).exec();

        if (!attendance) {
            throw new HttpError('srv_attendance_not_found', 400);
        }

        if (attendance.checkOutTime) {
            throw new HttpError('srv_already_checked_out', 400);
        }

        const breakTemplate = register.specificBreaks[isToday ? todayKey : yesterdayKey][breakKey];

        if (!breakTemplate || !breakTemplate.isAvailable) {
            throw new HttpError('srv_break_not_found', 400);
        }

        const { start: breakStartTime, end: breakEndTime } = utils.getStartEndTime({ start: breakTemplate.start, end: breakTemplate.end, isToday });

        attendance.breaks.some((b) => {
            if (b.checkInTime && !b.checkOutTime && b.type !== breakId) {
                throw new HttpError('srv_already_on_break', 400);
            }
        });

        let breakToApply = shift.breaks.find(b => b._id.toString() === breakId);
        if (!breakToApply) {
            breakToApply = {
                _id: new AttendanceBreakSchema.Types.ObjectId(),
                name: `misc_${breakKey}`,
                type: breakKey,
                reason: breakKey,
                breakHours: {
                    start: shift.start,
                    end: shift.end,
                    isOverNight: shift.isOverNight,
                },
            }
        }
        return res.status(200).json({ success: true, msg: 'srv_checked_in_successfully' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_make_attendance', 500));
    }
};

module.exports = {
    applySpecificBreak,
}