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
const mongoose = require('mongoose');
const { demoAccount } = require('../../demo');
const geolib = require('geolib');
const Retail = require('../../models/Retail');

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

const getDailyAttendance = async ({ date = null, registerId, isCreating = false }) => {
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
            const newDailyAttendance = {
                date: numericDate,
                registerId,
                workingHour: workingHours,
                expectedShifts: [],
                attendanceIds: [],
                checkedInOnTime: 0,
                checkedInLate: 0,
                checkedOutOnTime: 0,
                checkedOutEarly: 0,
                checkedInOnTimeByEmployee: {},
                checkedInLateByEmployee: {},
                checkedOutOnTimeByEmployee: {},
                checkedOutEarlyByEmployee: {},
                missingEmployees: [],
                workingHoursByEmployee: [],
                confirmed: false,
            };

            dailyAttendance = new DailyAttendance(newDailyAttendance);
        } else if (dailyAttendance) {
            dailyAttendance.workingHour = workingHours;
        }

        const orConditions = DAY_KEYS.map((day) => ({
            [`shifts.${day}.0`]: { $exists: true }
        }));

        const employeesWorkingAts = await WorkingAt.find({
            registerId,
            $or: orConditions,
        }).select('employeeId shifts').exec();

        const expectedShifts = [];

        for (const workingAt of employeesWorkingAts) {
            const employeeId = workingAt.employeeId;
            const shiftsToday = workingAt.shifts.get(dayKey) || [];

            for (const shift of shiftsToday) {
                if (shift.isAvailable) {
                    expectedShifts.push({
                        employeeId,
                        shiftId: shift._id,
                        start: shift.start,
                        end: shift.end,
                        isOverNight: shift.isOverNight || false,
                        allowedOverTime: shift.allowedOverTime || 0,
                    });
                }
            }
        }

        dailyAttendance.expectedShifts = expectedShifts;

        if (isCreating) {
            await dailyAttendance.save();
        }

        return dailyAttendance;
    } catch (error) {
        console.error(error);
        return typeof error === 'string' ? error : 'srv_failed_to_get_daily_attendance';
    }
};

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

        if (!attendanceId) {
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

        const employeeId = workingAt.employeeId.toString();

        dailyAttendance.attendanceIds = _.uniq([
            ...dailyAttendance.attendanceIds.map(id => id.toString()),
            attendance._id.toString()
        ]);

        const now = dayjs();

        if (aggregation.checkOutTime) {
            const expected = dailyAttendance.expectedShifts.find(e =>
                e.employeeId.equals(employeeId) && attendance.shiftId.equals(e.shiftId)
            );

            if (expected) {
                const shiftEnd = dayjs(expected.end, TIME_FORMAT);
                if (now.isBefore(shiftEnd)) {
                    dailyAttendance.checkedOutEarly += 1;
                    dailyAttendance.checkedOutEarlyByEmployee.set(employeeId, (dailyAttendance.checkedOutEarlyByEmployee.get(employeeId) || 0) + 1);
                } else {
                    dailyAttendance.checkedOutOnTime += 1;
                    dailyAttendance.checkedOutOnTimeByEmployee.set(employeeId, (dailyAttendance.checkedOutOnTimeByEmployee.get(employeeId) || 0) + 1);
                }
            }

            const checkIn = dayjs(attendance.checkInTime);
            const checkOut = dayjs(attendance.checkOutTime);
            let totalExceededBreaks = 0;
            let totalPauses = 0;
            let needUpdate = false;

            const attendanceTime = utils.getStartEndTime({ start: attendance.start, end: attendance.end, baseDay: dayjs(dailyAttendance.date.toString(), 'YYYYMMDD') });
            if (!attendanceTime) {
                throw 'srv_invalid_shift';
            }

            attendance.breaks?.forEach(b => {
                const breakDuration = b.breakHours?.duration || 0;
                if (breakDuration) {
                    if (!b.checkOutTime) {
                        b.checkOutTime = attendanceTime.endTime.toDate();
                        needUpdate = true;
                    }
                    const realDuration = dayjs(b.checkOutTime).diff(dayjs(b.checkInTime), 'minute');
                    totalExceededBreaks += realDuration > 0 && realDuration > breakDuration ? realDuration - breakDuration : 0;
                }
            });

            attendance.pauses?.forEach(p => {
                if (!p.checkOutTime) {
                    p.checkOutTime = attendanceTime.endTime.toDate();
                    needUpdate = true;
                }
                const realDuration = dayjs(p.checkOutTime).diff(dayjs(p.checkInTime), 'minute');
                totalPauses += realDuration > 0 ? realDuration : 0;
            });

            if (needUpdate) {
                await attendance.save();
            }

            const totalWorked = checkOut.diff(checkIn, 'minute') - totalExceededBreaks - totalPauses;
            const existing = dailyAttendance.workingHoursByEmployee.find(e =>
                e.employeeId.toString() === employeeId && e.shiftId.toString() === attendance.shiftId.toString()
            );

            if (existing) {
                existing.minutes = totalWorked;
            } else {
                dailyAttendance.workingHoursByEmployee.push({
                    employeeId: new mongoose.Types.ObjectId(employeeId),
                    shiftId: new mongoose.Types.ObjectId(attendance.shiftId),
                    minutes: totalWorked,
                });
            }
        }
        else if (aggregation.checkInTime) {
            const expected = dailyAttendance.expectedShifts.find(e =>
                employeeId === e.employeeId.toString() && attendance.shiftId.equals(e.shiftId)
            );

            if (expected) {
                const shiftStart = dayjs(expected.start, TIME_FORMAT);
                if (now.isAfter(shiftStart)) {
                    dailyAttendance.checkedInLate += 1;
                    dailyAttendance.checkedInLateByEmployee.set(employeeId, (dailyAttendance.checkedInLateByEmployee.get(employeeId) || 0) + 1);
                } else {
                    dailyAttendance.checkedInOnTime += 1;
                    dailyAttendance.checkedInOnTimeByEmployee.set(employeeId, (dailyAttendance.checkedInOnTimeByEmployee.get(employeeId) || 0) + 1);
                }
            }
        }

        await dailyAttendance.save();
        return dailyAttendance;
    } catch (error) {
        console.log(error);
        return typeof error === 'string' ? error : 'srv_failed_update_daily_attendance';
    }
};


const makeAttendance = async (req, res, next) => {
    try {
        const { latitude, longitude, registerId, attendanceId, reason } = req.body;
        const { employee } = req;
        const tokenPayload = req.tokenPayload;
        if (!longitude || !latitude || !registerId || !tokenPayload) {
            throw new HttpError('srv_invalid_request', 400);
        }
        const tmpBody = JSON.parse(JSON.stringify(req.body));
        delete tmpBody.token;
        delete tokenPayload.timestamp;
        delete tokenPayload.iat;

        if (!_.isEqual(tmpBody, tokenPayload)) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const tmpRegister = await Register.findOne({ _id: registerId }).exec();
        if (!tmpRegister) {
            throw new HttpError('srv_register_not_found', 400);
        }
        const tmpRetail = await Retail.findOne({ _id: tmpRegister.retailId }).exec();
        if (!tmpRetail) {
            throw new HttpError('srv_retail_not_found', 400);
        }
        const isDemo = tmpRetail.name === demoAccount.retail.tin;
        // demo registers
        if (isDemo) {
            const demoNames = demoAccount.registers.map(r => r.name);
            // update demo register location to user's location
            await Register.updateMany({ retailId: retail._id, name: { $in: demoNames } }, { location: { type: 'Point', coordinates: [longitude, latitude], allowedRadius: 1000 } }).exec();

            const register = await Register.findOne({ _id: registerId }).exec();

            if (register.name === 'Demo always success') {
                const dailyAttendance = await getDailyAttendance({ registerId, isCreating: true });

                if (typeof dailyAttendance === 'string') {
                    throw new HttpError(dailyAttendance, 400);
                }

                const now = dayjs();

                let attendance = await Attendance.findOne({ dailyAttendanceId: dailyAttendance._id, employeeId: employee._id, }).exec();

                // reset attendance for demo purposes
                if (attendance && attendance.checkOutTime) {
                    await Attendance.deleteOne({ _id: attendance._id }).exec();
                    attendance = null
                }

                const distanceInMeters = geolib.getDistance({ latitude, longitude }, {
                    latitude: register.location.coordinates[1],
                    longitude: register.location.coordinates[0],
                });
                if (attendance) {
                    const foundPendingBreak = attendance.breaks.find(b => !b.checkOutTime);

                    if (foundPendingBreak) {
                        throw new HttpError('srv_pending_breaks', 400);
                    }

                    const foundPendingPause = attendance.pauses.find(b => !b.checkOutTime);

                    if (foundPendingPause) {
                        throw new HttpError('srv_pending_pause', 400);
                    }
                    // checking out
                    const checkOutLocation = { latitude, longitude, distance: distanceInMeters };
                    attendance.checkOutTime = now.toDate();
                    attendance.checkOutLocation = checkOutLocation;
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
                            checkOutTime: newAttendance.checkOutTime,
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
            } else if (register.name === 'Demo always fail') {
                throw new HttpError('srv_outside_allowed_radius', 400);
            }
        }

        const resources = await utils.checkEmployeeResources(req);

        if (!resources) {
            throw new HttpError('srv_invalid_request', 400);
        }

        if (resources.localDevices) {
            return res.status(200).json({ success: true, msg: 'srv_local_device_required', localDevices: resources.localDevices.map(d => d.uuid) });
        }

        const { workingAt, shift, retail, distanceInMeters, isToday } = resources;

        const now = dayjs();
        const yesterday = now.subtract(1, 'day');

        const shiftTime = utils.getStartEndTime({ start: shift.start, end: shift.end, isToday });

        if (!shiftTime) {
            throw new HttpError('srv_invalid_shift', 400);
        }

        const { endTime: shiftEndTime } = shiftTime;

        const dailyAttendance = await getDailyAttendance({ date: isToday ? now.format('YYYYMMDD') : yesterday.format('YYYYMMDD'), registerId, isCreating: true });

        if (typeof dailyAttendance === 'string') {
            throw new HttpError(dailyAttendance, 400);
        }

        if (dailyAttendance.expectedShifts.findIndex(e => e.employeeId.toString() === employee._id.toString() && shift._id.equals(e.shiftId)) === -1) {
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
            // is identifying check out
            attendanceQuery._id = attendanceId;
        }

        const attendance = await Attendance.findOne(attendanceQuery).exec();

        if (attendance && !attendanceId) {
            throw new HttpError('srv_attendance_already_exists', 400);
        }

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

            const foundPendingPause = attendance.pauses.find(b => !b.checkOutTime);

            if (foundPendingPause) {
                throw new HttpError('srv_pending_pause', 400);
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