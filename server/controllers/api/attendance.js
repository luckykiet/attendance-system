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
const mongoose = require('mongoose');
const { demoAccount } = require('../../demo');
const geolib = require('geolib');
const Retail = require('../../models/Retail');
const { DAY_KEYS } = require('../../configs');
const { DATE_FORMAT } = require('../../constants/days');
const Employee = require('../../models/Employee');

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

        const dateToUse = date ? dayjs(date.toString(), DATE_FORMAT, true) : dayjs();
        if (date && !dateToUse.isValid()) {
            throw 'srv_invalid_date';
        }

        const numericDate = parseInt(dateToUse.format(DATE_FORMAT));
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

        if (!dailyAttendance.confirmed) {
            const orConditions = DAY_KEYS.map((day) => ({
                [`shifts.${day}.0`]: { $exists: true }
            }));

            const employeesWorkingAts = await WorkingAt.find({
                registerId,
                $or: orConditions,
            }).exec();
            const employees = await Employee.find({ _id: { $in: employeesWorkingAts.map(e => e.employeeId) } }).exec();
            const attendances = await Attendance.find({ _id: { $in: dailyAttendance.attendanceIds } }).exec();
            const attendanceShiftIds = new Set(attendances.map(a => a.shiftId.toString()));
            const expectedShifts = [];

            for (const workingAt of employeesWorkingAts) {
                const employeeId = workingAt.employeeId;
                const shiftsToday = workingAt.shifts.get(dayKey) || [];

                for (const shift of shiftsToday) {
                    // keep the shift if it is in attendanceShiftIds
                    if (attendanceShiftIds.has(shift._id.toString())) {
                        const existing = dailyAttendance.expectedShifts.find(e => e.employeeId.equals(employeeId) && e.shiftId.equals(shift._id));
                        if (existing) {
                            expectedShifts.push(existing);
                        }
                    } else {
                        const employee = employees.find(e => e._id.equals(employeeId));
                        if (!employee || !employee.isAvailable) {
                            continue;
                        }
                        if (workingAt.isAvailable && shift.isAvailable) {
                            expectedShifts.push({
                                employeeId,
                                shiftId: shift._id,
                                start: shift.start,
                                end: shift.end,
                                isOverNight: shift.isOverNight || false,
                                allowedOverTime: shift.allowedOverTime || 0,
                            });
                        } else {
                            // if the employee is not available, remove the shift from expectedShifts
                            const existing = dailyAttendance.expectedShifts.find(e => e.employeeId.equals(employeeId) && e.shiftId.equals(shift._id));
                            if (existing) {
                                expectedShifts.splice(expectedShifts.indexOf(existing), 1);
                            }
                        }
                    }
                }
            }
            dailyAttendance.expectedShifts = expectedShifts;
            await dailyAttendance.save();
        }

        return dailyAttendance;
    } catch (error) {
        console.error(error);
        return typeof error === 'string' ? error : 'srv_failed_to_get_daily_attendance';
    }
};

// This function updates the actual daily attendance record
const updateDailyAttendance = async ({ aggregation = null, attendanceId }) => {
    try {
        if (!aggregation) {
            throw 'srv_missing_aggregation';
        }

        if (!attendanceId) {
            throw 'srv_missing_attendance';
        }

        const attendance = await Attendance.findOne({ _id: attendanceId }).exec();
        if (!attendance) {
            throw 'srv_attendance_not_found';
        }

        const dailyAttendance = await DailyAttendance.findOne({ _id: attendance.dailyAttendanceId }).exec();
        if (!dailyAttendance) {
            throw 'srv_daily_attendance_not_found';
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

        const expected = dailyAttendance.expectedShifts.find(e =>
            employeeId === e.employeeId.toString() && attendance.shiftId.equals(e.shiftId)
        );

        if (!expected) {
            throw 'srv_expected_shift_not_found';
        }

        const shiftTime = utils.getStartEndTime({ start: expected.start, end: expected.end, baseDay: dayjs(dailyAttendance.date.toString(), DATE_FORMAT, true) });

        if (!shiftTime) {
            throw 'srv_invalid_shift';
        }

        const { startTime: shiftStartTime, endTime: shiftEndTime } = shiftTime;

        if (aggregation.checkOutTime) {
            const calculatedWorkedMinutes = await utils.calculateTotalWorkedMinutes(attendance._id);
            if (!calculatedWorkedMinutes.success) {
                throw 'srv_failed_calculate_worked_minutes';
            }
            const existing = dailyAttendance.workingHoursByEmployee.find(e =>
                e.employeeId.equals(workingAt.employeeId) && e.shiftId.equals(attendance.shiftId)
            );

            if (existing) {
                existing.totalWorkedMinutes = calculatedWorkedMinutes.msg.totalWorkedMinutes;
                existing.totalBreakMinutes = calculatedWorkedMinutes.msg.totalBreakMinutes;
                existing.totalExpectedBreakMinutes = calculatedWorkedMinutes.msg.totalExpectedBreakMinutes;
                existing.totalPauseMinutes = calculatedWorkedMinutes.msg.totalPauseMinutes;
            } else {
                dailyAttendance.workingHoursByEmployee.push({
                    employeeId: new mongoose.Types.ObjectId(workingAt.employeeId),
                    shiftId: new mongoose.Types.ObjectId(attendance.shiftId),
                    totalWorkedMinutes: calculatedWorkedMinutes.msg.totalWorkedMinutes,
                    totalBreakMinutes: calculatedWorkedMinutes.msg.totalBreakMinutes,
                    totalExpectedBreakMinutes: calculatedWorkedMinutes.msg.totalExpectedBreakMinutes,
                    totalPauseMinutes: calculatedWorkedMinutes.msg.totalPauseMinutes,
                });
            }

            if (now.isBefore(shiftEndTime)) {
                dailyAttendance.checkedOutEarly += 1;
                dailyAttendance.checkedOutEarlyByEmployee.set(employeeId, (dailyAttendance.checkedOutEarlyByEmployee.get(employeeId) || 0) + 1);
            } else {
                dailyAttendance.checkedOutOnTime += 1;
                dailyAttendance.checkedOutOnTimeByEmployee.set(employeeId, (dailyAttendance.checkedOutOnTimeByEmployee.get(employeeId) || 0) + 1);
            }
        } else if (aggregation.checkInTime) {
            if (now.isAfter(shiftStartTime)) {
                dailyAttendance.checkedInLate += 1;
                dailyAttendance.checkedInLateByEmployee.set(employeeId, (dailyAttendance.checkedInLateByEmployee.get(employeeId) || 0) + 1);
            } else {
                dailyAttendance.checkedInOnTime += 1;
                dailyAttendance.checkedInOnTimeByEmployee.set(employeeId, (dailyAttendance.checkedInOnTimeByEmployee.get(employeeId) || 0) + 1);
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
        const { latitude, longitude, registerId, attendanceId, reason, shiftId } = req.body;

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
        const isDemo = tmpRetail.tin === demoAccount.retail.tin;
        // demo registers
        const demoNames = demoAccount.registers.map(r => r.name);
        if (isDemo && demoNames.includes(tmpRegister.name)) {
            // update demo register location to user's location
            await Register.updateMany({ retailId: tmpRetail._id, name: { $in: demoNames } }, { location: { type: 'Point', coordinates: [longitude, latitude], allowedRadius: 1000 } }).exec();

            const register = await Register.findOne({ _id: registerId }).exec();

            const workingAt = await WorkingAt.findOne({ employeeId: employee._id, registerId: register._id, isAvailable: true }).exec();

            if (!workingAt) {
                throw new HttpError('srv_employee_not_employed', 400);
            }

            const now = dayjs();
            const todayKey = DAYS_OF_WEEK[now.day()];

            if (register.name === 'Demo always success') {
                const dailyAttendance = await getDailyAttendance({ registerId });

                if (typeof dailyAttendance === 'string') {
                    throw new HttpError(dailyAttendance, 400);
                }

                let attendance = await Attendance.findOne({ dailyAttendanceId: dailyAttendance._id, workingAtId: workingAt._id, }).exec();

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
                        });
                        if (typeof update === 'string') {
                            throw update;
                        }
                    } catch (error) {
                        console.log(error)
                    }
                    return res.status(200).json({ success: true, msg: 'srv_checked_out_successfully' });
                }
                const shift = workingAt.shifts.get(todayKey).find((s) => s._id.equals(shiftId)) || null;
                // checking in
                const checkInLocation = { latitude, longitude, distance: distanceInMeters };
                const checkInTime = now.toDate();
                const newAttendance = new Attendance({
                    workingAtId: workingAt._id,
                    dailyAttendanceId: dailyAttendance._id,
                    employeeId: employee._id,
                    checkInTime,
                    checkInLocation,
                    shiftId,
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

        const { workingAt, shift, distanceInMeters, isToday } = resources;

        const now = dayjs();
        const yesterday = now.subtract(1, 'day');

        const shiftTime = utils.getStartEndTime({ start: shift.start, end: shift.end, isToday });

        if (!shiftTime) {
            throw new HttpError('srv_invalid_shift', 400);
        }

        const { endTime: shiftEndTime } = shiftTime;

        const dailyAttendance = await getDailyAttendance({ date: isToday ? now.format(DATE_FORMAT) : yesterday.format(DATE_FORMAT), registerId });

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