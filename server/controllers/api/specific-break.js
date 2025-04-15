const HttpError = require("../../constants/http-error");

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');

const { DAYS_OF_WEEK } = require('../../constants');
const utils = require('../../utils');
const Attendance = require("../../models/Attendance");
const mongoose = require("mongoose");

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const applySpecificBreak = async (req, res, next) => {
    try {
        const { latitude, longitude, registerId, shiftId, attendanceId, breakKey } = req.body;
        const _id = req.body._id;
        const tokenPayload = req.tokenPayload;

        if (!longitude || !latitude || !registerId || !attendanceId || !shiftId || !breakKey || !tokenPayload) {
            throw new HttpError('srv_invalid_request', 400);
        }

        if (!utils.confirmTokenPayload(tokenPayload)) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const resources = await utils.checkEmployeeResources(req);

        if (!resources) {
            throw new HttpError('srv_invalid_request', 400);
        }

        if (resources.localDevices) {
            return res.status(200).json({ success: true, msg: 'srv_local_device_required', localDevices: resources.localDevices.map(d => d.uuid) });
        }

        const { workingAt, shift, register, isToday, distanceInMeters } = resources;

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

        const now = dayjs();
        const todayKey = DAYS_OF_WEEK[now.day()];
        const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

        const breakTemplate = register.specificBreaks[isToday ? todayKey : yesterdayKey][breakKey];

        if (!breakTemplate || !breakTemplate.isAvailable) {
            throw new HttpError('srv_break_not_found', 400);
        }

        const { startTime: breakStartTime, endTime: breakEndTime } = utils.getStartEndTime({ start: breakTemplate.start, end: breakTemplate.end, isToday });

        if (!attendance && !now.isBetween(breakStartTime, breakEndTime, null, '[]')) {
            throw new HttpError('srv_outside_time', 400);
        }

        let attendanceBreak = null;

        if (_id) {
            attendanceBreak = attendance.breaks.find((b) => b._id.equals(_id));
            if (!attendanceBreak) {
                throw new HttpError('srv_break_not_found', 400);
            }

            if (attendanceBreak.checkOutTime) {
                throw new HttpError('srv_break_already_finished', 400);
            }
        }

        const foundPendingPause = attendance.pauses.find((p) => p.checkInTime && !p.checkOutTime);

        if (foundPendingPause) {
            throw new HttpError('srv_some_pause_is_pending', 400);
        }

        const attendancePendingBreak = attendance.breaks.find((b) => {
            if (attendanceBreak) {
                return !b._id.equals(_id) && b.checkInTime && !b.checkOutTime;
            }
            return b.checkInTime && !b.checkOutTime;
        });

        if (attendancePendingBreak) {
            throw new HttpError('srv_some_break_is_pending', 400);
        }

        if (!attendanceBreak) {
            const newBreak = {
                _id: new mongoose.Types.ObjectId(),
                name: `misc_${breakKey}`,
                type: breakKey,
                breakHours: {
                    start: breakTemplate.start,
                    end: breakTemplate.end,
                    isOverNight: breakTemplate.isOverNight,
                    duration: breakTemplate.duration,
                },
                checkInTime: now.toDate(),
                checkInLocation: {
                    latitude,
                    longitude,
                    distance: distanceInMeters,
                },
            }
            attendance.breaks.push(newBreak);
            await attendance.save();
            return res.status(200).json({ success: true, msg: 'srv_break_started_successfully' });
        }

        attendanceBreak.name = `misc_${breakKey}`;
        attendanceBreak.type = breakKey;
        attendanceBreak.breakHours.start = shift.start;
        attendanceBreak.breakHours.end = shift.end;
        attendanceBreak.breakHours.isOverNight = shift.isOverNight;
        attendanceBreak.breakHours.duration = breakTemplate.duration;
        attendanceBreak.checkOutTime = now.toDate();
        attendanceBreak.checkOutLocation = {
            latitude,
            longitude,
            distance: distanceInMeters,
        }; 

        const breakIndex = attendance.breaks.findIndex((b) => b._id.equals(attendanceBreak._id));
        if (breakIndex !== -1) {
            attendance.breaks[breakIndex] = { ...attendance.breaks[breakIndex].toObject(), ...attendanceBreak };
        }
        await attendance.save();
        return res.status(200).json({ success: true, msg: 'srv_break_finished_successfully' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_make_attendance', 500));
    }
};

module.exports = {
    applySpecificBreak,
}