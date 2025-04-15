const HttpError = require("../../constants/http-error");

const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');

const utils = require('../../utils');
const Attendance = require("../../models/Attendance");
const mongoose = require("mongoose");

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const applyPause = async (req, res, next) => {
    try {
        const { latitude, longitude, registerId, shiftId, attendanceId, name } = req.body;
        const tokenPayload = req.tokenPayload;
        const _id = req.body._id;

        if (!longitude || !latitude || !registerId || !attendanceId || !shiftId || !name || !tokenPayload) {
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

        const { workingAt, shift, distanceInMeters } = resources;

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
        let pause = null;

        if (_id) {
            pause = attendance.pauses.find((b) => b._id.equals(_id));
            if (!pause) {
                throw new HttpError('srv_pause_not_found', 400);
            }

            if (pause.checkOutTime) {
                throw new HttpError('srv_pause_already_finished', 400);
            }
        }

        const foundPendingPause = attendance.pauses.find((p) => {
            if (pause) {
                return !p._id.equals(_id) && p.checkInTime && !p.checkOutTime;
            }
            return p.checkInTime && !p.checkOutTime;
        });

        if (foundPendingPause) {
            throw new HttpError('srv_some_pause_is_pending', 400);
        }

        const attendancePendingBreak = attendance.breaks.find((b) => b.checkInTime && !b.checkOutTime);

        if (attendancePendingBreak) {
            throw new HttpError('srv_some_break_is_pending', 400);
        }
        const newPause = {
            _id: _id ? _id : new mongoose.Types.ObjectId(),
            name: name,
        }

        if (!pause) {
            newPause.checkInTime = now.toDate();
            newPause.checkInLocation = {
                latitude,
                longitude,
                distance: distanceInMeters,
            };
            attendance.pauses.push(newPause);
            await attendance.save();
            return res.status(200).json({ success: true, msg: 'srv_pause_started_successfully' });
        }

        newPause.checkOutTime = now.toDate();
        newPause.checkOutLocation = {
            latitude,
            longitude,
            distance: distanceInMeters,
        };

        const pauseIndex = attendance.pauses.findIndex((p) => p._id.equals(_id));
        if (pauseIndex !== -1) {
            attendance.pauses[pauseIndex] = { ...attendance.pauses[pauseIndex].toObject(), ...newPause };
        } else {
            throw new HttpError('srv_pause_not_found', 400);
        }
        await attendance.save();
        return res.status(200).json({ success: true, msg: 'srv_pause_finished_successfully' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_make_attendance', 500));
    }
};

module.exports = {
    applyPause,
}