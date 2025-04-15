const utils = require('../../utils');

const Register = require('../../models/Register');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const DailyAttendance = require('../../models/DailyAttendance');
const HttpError = require("../../constants/http-error");
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');
const { DAYS_OF_WEEK } = require('../../constants');
const _ = require('lodash');
const { DAY_KEYS } = require('../../configs');

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const getDailyAttendance = async ({ date = null, registerId }) => {
    try {
        if (!registerId) {
            throw 'srv_register_not_found';
        }
        const register = await Register.findOne({ _id: registerId }).exec();

        if (!register) {
            throw 'srv_register_not_found';
        }

        const dateToUse = date ? dayjs(date, 'YYYYMMDD', true) : dayjs();

        if (date && !dateToUse.isValid()) {
            throw 'srv_invalid_date';
        }

        let dailyAttendance = await DailyAttendance.findOne({ date: parseInt(dateToUse.format('YYYYMMDD')), registerId }).exec();

        const dayIndex = dateToUse.day();
        const dayKey = DAYS_OF_WEEK[dayIndex];
        const hours = register.workingHours[dayKey];
        if (!dailyAttendance) {
            dailyAttendance = await new DailyAttendance({
                date: parseInt(dateToUse.format('YYYYMMDD')),
                workingHour: hours,
                registerId,
                employeeIds: [],
                checkIns: [],
                checkOuts: [],
                checkInsLate: [],
                checkOutsEarly: [],
            }).save();
        } else {
            // update the working hours
            dailyAttendance.workingHour = hours;
        }
        // get all employees working at the register
        const orConditions = DAY_KEYS.map((day) => ({
            [`shifts.${day}.0`]: { $exists: true }
        }));
        const employeesWorkingAts = await WorkingAt.find({
            registerId,
            $or: orConditions
        }).select('employeeId').exec();

        // update the employeeIds in the daily attendance
        dailyAttendance.employeeIds = employeesWorkingAts.map(w => w.employeeId);
        await dailyAttendance.save();
        return dailyAttendance;
    } catch (error) {
        console.log(error)
        return typeof error === 'string' ? error : 'srv_failed_to_get_daily_attendance';
    }
};

// date Date() format
const updateDailyAttendance = async ({ type, date, attendanceId, dailyAttendanceId }) => {
    try {
        if (!dailyAttendanceId) {
            throw 'srv_daily_attendance_not_found';
        }
        if (!date) {
            throw 'srv_missing_date';
        }

        const dailyAttendance = await DailyAttendance.findOne({ _id: dailyAttendanceId }).exec();

        if (!dailyAttendance) {
            throw 'srv_daily_attendance_not_found';
        }

        const dateToUse = dayjs(date);

        if (!dateToUse.isValid() || parseInt(dateToUse.format('YYYYMMDD')) !== dailyAttendance.date) {
            throw 'srv_invalid_date';
        }

        if (!type) {
            throw 'srv_missing_type';
        }

        if (!['checkIn', 'checkOut'].includes(type)) {
            throw 'srv_invalid_type';
        }

        const attendance = await Attendance.findOne({ _id: attendanceId }).exec();
        if (!attendance) {
            throw 'srv_attendance_not_found';
        }
        const workingAt = await WorkingAt.findOne({ employeeId: attendance.employeeId, registerId: dailyAttendance.registerId }).exec();
        if (!workingAt) {
            throw 'srv_employee_not_working_here';
        }

        const dayIndex = dateToUse.day();
        const dayKey = DAYS_OF_WEEK[dayIndex];
        // get individual check in/out times
        if (type === 'checkIn') {
            dailyAttendance.checkIns.push(attendanceId);
            const employeeCheckInTime = dayjs(workingAt.workingHours[dayKey].start, 'HH:mm', true);
            if (dateToUse.isAfter(employeeCheckInTime)) {
                dailyAttendance.checkInsLate.push(attendanceId);
                dailyAttendance.checkInsLateByEmployee.push(attendance.employeeId);
            }
        } else {
            dailyAttendance.checkOuts.push(attendanceId);
            const employeeCheckOutTime = dayjs(workingAt.workingHours[dayKey].end, 'HH:mm', true);
            if (dateToUse.isBefore(employeeCheckOutTime)) {
                dailyAttendance.checkOutsEarly.push(attendanceId);
                dailyAttendance.checkOutsEarlyByEmployee.push(attendance.employeeId);
            }
        }
        await dailyAttendance.save();
        return dailyAttendance;
    }
    catch (error) {
        return typeof error === 'string' ? error : 'srv_failed_update_daily_attendance';
    }
}

const makeAttendance = async (req, res, next) => {
    try {
        const { latitude, longitude, registerId, attendanceId, reason } = req.body;
        const tokenPayload = req.tokenPayload;
        if (!longitude || !latitude || !registerId || !tokenPayload) {
            throw new HttpError('srv_invalid_request', 400);
        }
        const tmpBody = JSON.parse(JSON.stringify(req.body));
        delete tmpBody.token;
        delete tokenPayload.timestamp;

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

        const { workingAt, shift, distanceInMeters, isToday } = resources;

        // demo registers
        // if (retail.tin === '12345678') {
        //     await Register.updateMany({ retailId: retail._id }, { location: { type: 'Point', coordinates: [longitude, latitude], allowedRadius: 1000 } }).exec();
        //     register = await Register.findOne({ _id: registerId }).exec();
        //     if (register.name === 'Demo always success') {
        //         const dailyAttendance = await getDailyAttendance({ registerId });

        //         if (typeof dailyAttendance === 'string') {
        //             throw new HttpError(dailyAttendance, 400);
        //         }

        //         const now = dayjs();

        //         let attendance = await Attendance.findOne({ dailyAttendanceId: dailyAttendance._id, employeeId: employee._id, }).exec();

        //         // reset attendance for demo purposes
        //         if (attendance && attendance.checkOutTime) {
        //             await Attendance.deleteOne({ _id: attendance._id }).exec();
        //             attendance = null
        //         }

        //         const distanceInMeters = geolib.getDistance({ latitude, longitude }, {
        //             latitude: register.location.coordinates[1],
        //             longitude: register.location.coordinates[0],
        //         });
        //         if (attendance) {
        //             // checking out
        //             const checkOutLocation = { latitude, longitude, distance: distanceInMeters };
        //             attendance.checkOutTime = now.toDate();
        //             attendance.checkOutLocation = checkOutLocation;
        //             await attendance.save();

        //             try {
        //                 const update = await updateDailyAttendance({ type: 'checkOut', date: now.toDate(), attendanceId: attendance._id, dailyAttendanceId: dailyAttendance._id });
        //                 if (typeof update === 'string') {
        //                     throw update;
        //                 }
        //             } catch (error) {
        //                 console.log(error)

        //             }
        //             return res.status(200).json({ success: true, msg: 'srv_checked_out_successfully' });
        //         }

        //         // checking in
        //         const checkInLocation = { latitude, longitude, distance: distanceInMeters };
        //         const checkInTime = now.toDate();
        //         const newAttendance = await new Attendance({
        //             registerId,
        //             dailyAttendanceId: dailyAttendance._id,
        //             employeeId: employee._id,
        //             checkInTime,
        //             checkInLocation,
        //             workingHour: workingAt.workingHours[DAYS_OF_WEEK[now.day()]],
        //         }).save();

        //         try {
        //             const update = await updateDailyAttendance({ type: 'checkIn', date: now.toDate(), attendanceId: newAttendance._id, dailyAttendanceId: dailyAttendance._id });
        //             if (typeof update === 'string') {
        //                 throw update;
        //             }
        //         } catch (error) {
        //             console.log(error)
        //         }

        //         return res.status(200).json({ success: true, msg: 'srv_checked_in_successfully' });
        //     } else if (register.name === 'Demo always fail') {
        //         throw new HttpError('srv_outside_allowed_radius', 400);
        //     }
        // }

        const now = dayjs();

        const { employee } = req;

        const { end: shiftEndTime } = utils.getStartEndTime({ start: shift.start, end: shift.end, isToday });

        const dailyAttendance = await getDailyAttendance({ registerId });

        if (typeof dailyAttendance === 'string') {
            throw new HttpError(dailyAttendance, 400);
        }

        if (dailyAttendance.employeeIds.indexOf(employee._id) === -1) {
            throw new HttpError('srv_you_not_working_today', 400);
        }

        if (!dailyAttendance.workingHour.isAvailable) {
            throw new HttpError('srv_workplace_closed_today', 400);
        }
        const attendanceQuery = {
            dailyAttendanceId: dailyAttendance._id,
            workingAtId: workingAt._id,
            shiftId: shift._id,
        };

        if (attendanceId) {
            attendanceQuery._id = attendanceId;
        }

        const attendance = await Attendance.findOne(attendanceQuery).exec();

        if (attendance) {
            if (!attendance.shiftId.equals(shift._id)) {
                throw new HttpError('srv_invalid_shift', 400);
            }

            if (attendance.checkOutTime) {
                throw new HttpError('srv_already_checked_out', 400);
            }

            const foundPendingBreak = attendance.breaks.find(b => !b.checkOutTime);

            if (foundPendingBreak) {
                throw new HttpError('srv_pending_breaks', 400);
            }
            
            if (now.isBefore(shiftEndTime) && !reason) {
                throw new HttpError('srv_reason_for_early_check_out_required', 400);
            }

            // checking out
            const checkOutLocation = { latitude, longitude, distance: distanceInMeters };
            attendance.checkOutTime = now.toDate();
            attendance.checkOutLocation = checkOutLocation;

            attendance.start = shift.start;
            attendance.end = shift.end;
            attendance.isOverNight = shift.isOverNight;

            attendance.reason = reason && typeof reason === 'string' ? reason.trim() : '';

            await attendance.save();

            try {
                const update = await updateDailyAttendance({ type: 'checkOut', date: now.toDate(), attendanceId: attendance._id, dailyAttendanceId: dailyAttendance._id });
                if (typeof update === 'string') {
                    throw update;
                }
            } catch (error) {
                console.log(error)

            }
            return res.status(200).json({ success: true, msg: 'srv_checked_out_successfully' });
        }

        if (attendanceId) {
            throw new HttpError('srv_attendance_not_found', 400);
        }

        // checking in
        const checkInLocation = { latitude, longitude, distance: distanceInMeters };
        const checkInTime = now.toDate();

        const newAttendance = new Attendance({
            workingAtId: workingAt._id,
            dailyAttendanceId: dailyAttendance._id,
            employeeId: employee._id,
            checkInTime,
            checkInLocation,
            shiftId: shift._id,
            start: shift.start,
            end: shift.end,
            isOverNight: shift.isOverNight,
        });

        await newAttendance.save();

        try {
            const update = await updateDailyAttendance({ type: 'checkIn', date: now.toDate(), attendanceId: newAttendance._id, dailyAttendanceId: dailyAttendance._id });
            if (typeof update === 'string') {
                throw update;
            }
        } catch (error) {
            console.log(error)
        }

        return res.status(200).json({ success: true, msg: 'srv_checked_in_successfully' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_make_attendance', 500));
    }
};

module.exports = {
    makeAttendance,
    getDailyAttendance,
}