const utils = require('../../utils');

const Register = require('../../models/Register');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const DailyAttendance = require('../../models/DailyAttendance');
const HttpError = require("../../constants/http-error");
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const isBetween = require('dayjs/plugin/isBetween');
const { DAYS_OF_WEEK, TIME_FORMAT } = require('../../constants');
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

        const dateToUse = date ? dayjs(date.toString(), 'YYYYMMDD', true) : dayjs();
        if (date && !dateToUse.isValid()) {
            throw 'srv_invalid_date';
        }

        const numericDate = parseInt(dateToUse.format('YYYYMMDD'));
        let dailyAttendance = await DailyAttendance.findOne({ date: numericDate, registerId }).exec();

        const dayIndex = dateToUse.day();
        const dayKey = DAYS_OF_WEEK[dayIndex];
        const workingHours = register.workingHours?.[dayKey] || null;

        if (!dailyAttendance) {
            dailyAttendance = new DailyAttendance({
                date: numericDate,
                registerId,
                workingHour: workingHours,
                expectedEmployees: [],
                attendanceIds: [],
                checkedInOnTime: [],
                checkedInLate: [],
                checkedOutOnTime: [],
                checkedOutEarly: [],
                missingCheckOut: [],
                workingHoursByEmployee: {},
            });
        } else {
            dailyAttendance.workingHour = workingHours;
        }

        const orConditions = DAY_KEYS.map((day) => ({
            [`shifts.${day}.0`]: { $exists: true }
        }));
        const employeesWorkingAts = await WorkingAt.find({
            registerId,
            $or: orConditions,
        }).select('employeeId shifts').exec();

        const expectedEmployees = [];

        for (const workingAt of employeesWorkingAts) {
            const employeeId = workingAt.employeeId;
            const shiftsToday = workingAt.shifts.get(dayKey) || [];
            for (const shift of shiftsToday) {
                if (shift.isAvailable) {
                    expectedEmployees.push({
                        employeeId,
                        shiftId: shift._id,
                        shiftStart: shift.start,
                        shiftEnd: shift.end,
                        isOverNight: shift.isOverNight || false,
                    });
                }
            }
        }

        dailyAttendance.expectedEmployees = expectedEmployees;

        await dailyAttendance.save();
        return dailyAttendance;
    } catch (error) {
        console.error(error);
        return typeof error === 'string' ? error : 'srv_failed_to_get_daily_attendance';
    }
};

// const aggregation = {
//      attendanceId
//     checkInTime: date or null,
//     checkOutTime: date or null,
// }
const updateDailyAttendance = async ({ aggregation = null, attendanceId, dailyAttendanceId }) => {
    try {
        if (!dailyAttendanceId) {
            throw 'srv_daily_attendance_not_found';
        }

        if (!aggregation) {
            throw 'srv_missing_aggregation';
        }

        const dailyAttendance = await DailyAttendance.findOne({ _id: dailyAttendanceId }).exec();

        if (!dailyAttendance) {
            throw 'srv_daily_attendance_not_found';
        }

        if (!attendanceId || !aggregation) {
            throw 'srv_missing_attendance';
        }

        const attendance = await Attendance.findOne({ _id: attendanceId }).exec();

        if (!attendance) {
            throw 'srv_attendance_not_found';
        }

        const workingAt = await WorkingAt.findOne({ _id: attendance.workingAtId }).exec();

        if (!workingAt) {
            throw 'srv_employee_not_working_here';
        }

        // get individual check in/out times
        dailyAttendance.attendanceIds = _.uniq([...dailyAttendance.attendanceIds.map(id => id.toString()), attendance._id.toString()]);
        const now = dayjs();

        const employeeId = workingAt.employeeId;
        if (aggregation.checkOutTime) {
            const expected = dailyAttendance.expectedEmployees.find(e =>
                employeeId.equals(e.employeeId) && attendance.shiftId.equals(e.shiftId)
            );

            if (expected) {
                const shiftEnd = dayjs(expected.shiftEnd, TIME_FORMAT);
                if (now.isBefore(shiftEnd)) {
                    dailyAttendance.checkedOutEarly = _.uniq([...dailyAttendance.checkedOutEarly, workingAt.employeeId]);
                } else {
                    dailyAttendance.checkedOutOnTime = _.uniq([...dailyAttendance.checkedOutOnTime, workingAt.employeeId]);
                }
            }

            // Calculate worked minutes
            const checkIn = dayjs(attendance.checkInTime);
            const checkOut = dayjs(attendance.checkOutTime);
            let totalExceededBreaks = 0;
            let totalPauses = 0;

            // only calculate exceeded breaks duration
            // if employee did not check out, break will be ended at shift end
            let needUpdate = false
            const attendanceTime = utils.getStartEndTime({ start: attendance.start, end: attendance.end, baseDay: dayjs(dailyAttendance.date.toString(), 'YYYYMMDD') });

            if (!attendanceTime) {
                throw 'srv_invalid_shift';
            }

            attendance.breaks?.forEach(b => {
                const breakDuration = b.breakHours?.duration || 0;
                if (breakDuration) {
                    if (!b.checkOutTime) {
                        const { endTime: shiftEndTime } = attendanceTime;
                        needUpdate = true
                        b.checkOutTime = shiftEndTime.toDate();
                    }
                    const realDuration = dayjs(b.checkOutTime).diff(dayjs(b.checkInTime), 'minute');
                    totalExceededBreaks += realDuration > 0 && realDuration > breakDuration ? realDuration - breakDuration : 0;
                }
            });

            attendance.pauses?.forEach(p => {
                if (!p.checkOutTime) {
                    const { endTime: shiftEndTime } = attendanceTime;
                    needUpdate = true
                    p.checkOutTime = shiftEndTime.toDate();
                }
                const realDuration = dayjs(p.checkOutTime).diff(dayjs(p.checkInTime), 'minute');
                totalPauses += realDuration > 0 ? realDuration : 0;
            });

            if (needUpdate) {
                await attendance.save();
            }

            const totalWorked = checkOut.diff(checkIn, 'minute') - totalExceededBreaks - totalPauses;
            dailyAttendance.workingHoursByEmployee.set(employeeId.toString(), totalWorked);
        }
        else if (aggregation.checkInTime) {
            const expected = dailyAttendance.expectedEmployees.find(e =>
                employeeId.equals(e.employeeId) && attendance.shiftId.equals(e.shiftId)
            );

            if (expected) {
                const shiftStart = dayjs(expected.shiftStart, TIME_FORMAT);
                if (now.isAfter(shiftStart)) {
                    dailyAttendance.checkedInLate = _.uniq([...dailyAttendance.checkedInLate, workingAt.employeeId]);
                } else {
                    dailyAttendance.checkedInOnTime = _.uniq([...dailyAttendance.checkedInOnTime, workingAt.employeeId]);
                }
            }
        }

        await dailyAttendance.save();
        return dailyAttendance;
    }
    catch (error) {
        console.log(error)
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

        const shiftTime = utils.getStartEndTime({ start: shift.start, end: shift.end, isToday });

        if (!shiftTime) {
            throw new HttpError('srv_invalid_shift', 400);
        }

        const { endTime: shiftEndTime } = shiftTime;

        const dailyAttendance = await getDailyAttendance({ date: now.format('YYYYMMDD'), registerId });

        if (typeof dailyAttendance === 'string') {
            throw new HttpError(dailyAttendance, 400);
        }

        if (dailyAttendance.expectedEmployees.findIndex(e => e.employeeId.toString() === employee._id.toString() && shift._id.equals(e.shiftId)) === -1) {
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
                const update = await updateDailyAttendance({
                    aggregation: {
                        checkOutTime: attendance.checkOutTime,
                    },
                    attendanceId: attendance._id,
                    dailyAttendanceId: dailyAttendance._id
                });
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
            const update = await updateDailyAttendance({
                aggregation: {

                    checkInTime,
                },
                attendanceId: newAttendance._id,
                dailyAttendanceId: dailyAttendance._id
            });

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