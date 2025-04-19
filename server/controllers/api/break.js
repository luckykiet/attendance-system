const HttpError = require("../../constants/http-error");

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');

const utils = require('../../utils');
const Attendance = require("../../models/Attendance");
const mongoose = require("mongoose");
const { DAYS_OF_WEEK } = require("../../constants");
const _ = require('lodash');

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const applyBreak = async (req, res, next) => {
    try {
        const { latitude, longitude, registerId, shiftId, attendanceId, _id, name, breakId } = req.body;

        const tokenPayload = req.tokenPayload;

        if (!longitude || !latitude || !registerId || !attendanceId || !shiftId || !name || !tokenPayload) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const tmpBody = JSON.parse(JSON.stringify(req.body));
        delete tmpBody.token;
        delete tokenPayload.timestamp;
        delete tokenPayload.iat;

        if (!_.isEqual(tmpBody, tokenPayload)) {
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

        if (!breakId) {
            throw new HttpError('srv_break_id_required', 400);
        }

        const breakTemplate = register.breaks[isToday ? todayKey : yesterdayKey].find((b) => b._id.toString() === breakId);

        if (!breakTemplate) {
            throw new HttpError('srv_break_not_found', 400);
        }
        
        const breakTemplateTime = utils.getStartEndTime({ start: breakTemplate.start, end: breakTemplate.end, isToday });
        if (breakTemplateTime) {
            const { startTime: breakStartTime, endTime: breakEndTime } = breakTemplateTime;
            if (!attendance && !now.isBetween(breakStartTime, breakEndTime, null, '[]')) {
                throw new HttpError('srv_outside_time', 400);
            }
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

        const newBreak = {
            _id: _id ? _id : new mongoose.Types.ObjectId(),
            breakId: breakId ? breakId : null,
            name: breakTemplate ? breakTemplate.name : name,
            type: breakTemplate ? 'generic' : 'other',
            breakHours: {
                start: breakTemplate.start,
                end: breakTemplate.end,
                isOverNight: breakTemplate.isOverNight,
                duration: breakTemplate.duration,
            },
        }

        if (!attendanceBreak) {
            newBreak.checkInTime = now.toDate();
            newBreak.checkInLocation = {
                latitude,
                longitude,
                distance: distanceInMeters,
            };
            attendance.breaks.push(newBreak);
            await attendance.save();
            return res.status(200).json({ success: true, msg: 'srv_break_started_successfully' });
        }

        attendanceBreak.checkOutTime = now.toDate();
        attendanceBreak.checkOutLocation = {
            latitude,
            longitude,
            distance: distanceInMeters,
        };
        const breakIndex = attendance.breaks.findIndex((b) => b._id.equals(attendanceBreak._id));
        if (breakIndex !== -1) {
            attendance.breaks[breakIndex] = { ...attendance.breaks[breakIndex].toObject(), ...newBreak };
        }
        await attendance.save();
        return res.status(200).json({ success: true, msg: 'srv_break_finished_successfully' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_make_attendance', 500));
    }
};

module.exports = {
    applyBreak,
}