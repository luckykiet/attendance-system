const HttpError = require('../../constants/http-error');
const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const DailyAttendance = require('../../models/DailyAttendance');
const { DATE_FORMAT } = require('../../constants/days');
const Attendance = require('../../models/Attendance');
const WorkingAt = require('../../models/WorkingAt');

dayjs.extend(customParseFormat);

const getAttendanceAggregationRegisterAndByRange = async (req, res, next) => {
    try {
        const { registerId } = req.params;
        const { start, end } = req.query;

        if (!registerId || !start || !end) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const register = await Register.findOne({ _id: registerId, retailId: req.user.retailId });
        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }

        if (!dayjs(start, DATE_FORMAT, true).isValid() || !dayjs(end, DATE_FORMAT, true).isValid()) {
            throw new HttpError('srv_invalid_date', 400);
        }

        const dailyAttendances = await DailyAttendance.find({
            registerId,
            date: { $gte: Number(start), $lte: Number(end) }
        });
        const attendances = await Attendance.find({
            dailyAttendanceId: { $in: dailyAttendances.map(daily => daily._id) }
        })

        const workingAts = await WorkingAt.find({
            registerId,
            _id: { $in: attendances.map(att => att.workingAtId) }
        });

        // Initialize aggregation
        const aggregation = {
            totalDays: dailyAttendances.length || 0,
            totalExpectedShifts: 0,
            totalAttendances: 0,
            totalExpectedWorkedMinutes: 0,
            totalExpectedBreakMinutes: 0,
            totalWorkedMinutes: 0,
            totalBreakMinutes: 0,
            totalPauseMinutes: 0,

            checkedInOnTime: 0,
            checkedInLate: 0,
            missingCheckIn: 0,

            checkedOutOnTime: 0,
            checkedOutEarly: 0,
            missingCheckOut: 0,

            expectedWorkedMinutesByEmployee: new Map(),
            workedMinutesByEmployee: new Map(),
            expectedBreakMinutesByEmployee: new Map(),
            breakMinutesByEmployee: new Map(),
            pauseMinutesByEmployee: new Map(),

            expectedShiftsAmountByEmployee: new Map(),
            actualShiftsAmountByEmployee: new Map(),
            employees: [],
        };

        if (!dailyAttendances.length) {
            return res.status(200).json({ success: true, msg: aggregation });
        }

        const employeeIds = new Set();

        dailyAttendances.forEach(daily => {
            aggregation.totalExpectedShifts += daily.expectedShifts.length;
            aggregation.totalAttendances += daily.attendanceIds.length;

            aggregation.checkedInOnTime += daily.checkedInOnTime || 0;
            aggregation.checkedInLate += daily.checkedInLate || 0;
            aggregation.checkedOutOnTime += daily.checkedOutOnTime || 0;
            aggregation.checkedOutEarly += daily.checkedOutEarly || 0;

            aggregation.missingCheckIn += daily.missingEmployees ? daily.missingEmployees.length : 0;
            aggregation.missingCheckOut += daily.missingEmployees ? daily.missingEmployees.length : 0;

            if (Array.isArray(daily.expectedShifts)) {
                daily.expectedShifts.forEach(({ employeeId, start, end }) => {
                    const empId = employeeId.toString();
                    if (!employeeIds.has(empId)) {
                        employeeIds.add(empId);
                    }
                    if (!aggregation.expectedShiftsAmountByEmployee.has(empId)) {
                        aggregation.expectedShiftsAmountByEmployee.set(empId, 0);
                    }
                    aggregation.expectedShiftsAmountByEmployee.set(empId, aggregation.expectedShiftsAmountByEmployee.get(empId) + 1);
                    aggregation.totalExpectedShifts += 1;

                    const shiftTime = utils.getStartEndTime({ start, end, baseDay: dayjs(daily.date.toString(), DATE_FORMAT) });
                    if (shiftTime) {
                        const { startTime, endTime } = shiftTime;
                        const minutes = endTime.diff(startTime, 'minute');
                        if (!aggregation.expectedWorkedMinutesByEmployee.has(empId)) {
                            aggregation.expectedWorkedMinutesByEmployee.set(empId, 0);
                        }
                        aggregation.expectedWorkedMinutesByEmployee.set(empId, aggregation.expectedWorkedMinutesByEmployee.get(empId) + minutes);
                        aggregation.totalExpectedWorkedMinutes += minutes;
                    }
                });
            }

            if (Array.isArray(daily.workingHoursByEmployee)) {
                const keys = {
                    workedMinutesByEmployee: 'totalWorkedMinutes',
                    expectedBreakMinutesByEmployee: 'totalExpectedBreakMinutes',
                    breakMinutesByEmployee: 'totalBreakMinutes',
                    pauseMinutesByEmployee: 'totalPauseMinutes'
                };

                daily.workingHoursByEmployee.forEach((workingHour) => {
                    const { employeeId, ...rest } = workingHour.toObject();
                    const empId = employeeId.toString();
                    Object.entries(keys).forEach(([mapKey, fieldKey]) => {
                        if (!aggregation[mapKey].has(empId)) {
                            aggregation[mapKey].set(empId, 0);
                        }
                        const value = rest[fieldKey] || 0;
                        aggregation[mapKey].set(empId, aggregation[mapKey].get(empId) + value);
                        aggregation[fieldKey] += value;
                    });
                });
            }

            if (Array.isArray(daily.attendanceIds)) {
                daily.attendanceIds.forEach(attendanceId => {
                    const attendance = attendances.find(att => att._id.equals(attendanceId));

                    if (!attendance) return;
                    const workingAt = workingAts.find(w => w._id.equals(attendance.workingAtId));

                    if (!workingAt) return;

                    const empId = workingAt.employeeId.toString();

                    if (!aggregation.actualShiftsAmountByEmployee.has(empId)) {
                        aggregation.actualShiftsAmountByEmployee.set(empId, 0);
                    }
                    aggregation.actualShiftsAmountByEmployee.set(empId, aggregation.actualShiftsAmountByEmployee.get(empId) + 1);
                });
            }
        });

        const employees = await Employee.find({
            _id: { $in: Array.from(employeeIds) },
            retailId: req.user.retailId
        }).select({
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
        }).lean();


        for (const key in aggregation) {
            if (aggregation[key] instanceof Map) {
                aggregation[key] = utils.mapToObj(aggregation[key]);
            }
        }

        return res.status(200).json({
            success: true,
            msg: {
                ...aggregation,
                employees
            }
        });
    } catch (error) {
        console.log(error)
        return next(utils.parseExpressErrors(error, 'srv_attendance_aggregation_failed', 500));
    }
};

const getAttendanceAggregationEmployeeAndByRange = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        const { start, end } = req.query;

        if (!employeeId || !start || !end) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const employee = await Employee.findOne({ _id: employeeId, retailId: req.user.retailId }).select({
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
        }).lean().exec();
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }

        if (!dayjs(start, DATE_FORMAT, true).isValid() || !dayjs(end, DATE_FORMAT, true).isValid()) {
            throw new HttpError('srv_invalid_date', 400);
        }

        const workingAts = await WorkingAt.find({ employeeId });

        const registerIds = workingAts.map(workingAt => workingAt.registerId);

        const dailyAttendances = await DailyAttendance.find({
            registerId: { $in: registerIds },
            date: { $gte: Number(start), $lte: Number(end) }
        });

        const attendances = await Attendance.find({
            dailyAttendanceId: { $in: dailyAttendances.map(daily => daily._id) }
        })

        const registers = await Register.find({
            _id: { $in: dailyAttendances.map(daily => daily.registerId) },
            retailId: req.user.retailId
        });

        const aggregation = {
            totalDays: dailyAttendances.length,
            totalExpectedShifts: 0,
            totalAttendances: attendances.length,
            totalExpectedWorkedMinutes: 0,
            totalExpectedBreakMinutes: 0,
            totalWorkedMinutes: 0,
            totalBreakMinutes: 0,
            totalPauseMinutes: 0,
            totalRegisters: registers.length,
            totalShifts: 0,

            checkedInOnTime: 0,
            checkedInLate: 0,
            missingCheckIn: 0,

            checkedOutOnTime: 0,
            checkedOutEarly: 0,
            missingCheckOut: 0,

            expectedWorkedMinutesByRegister: new Map(),
            workedMinutesByRegister: new Map(),
            expectedBreakMinutesByRegister: new Map(),
            breakMinutesByRegister: new Map(),
            pauseMinutesByRegister: new Map(),

            expectedShiftsAmountByRegister: new Map(),
            actualShiftsAmountByRegister: new Map(),
        };

        dailyAttendances.forEach(daily => {
            aggregation.checkedInOnTime += daily.checkedInOnTimeByEmployee.get(employeeId) || 0;
            aggregation.checkedInLate += daily.checkedInLateByEmployee.get(employeeId) || 0;
            aggregation.checkedOutOnTime += daily.checkedOutOnTimeByEmployee.get(employeeId) || 0;
            aggregation.checkedOutEarly += daily.checkedOutEarlyByEmployee.get(employeeId) || 0;

            aggregation.missingCheckIn += daily.missingEmployees.filter(emp => emp.employeeId.equals(employeeId)).length || 0;
            aggregation.missingCheckOut += daily.missingEmployees.filter(emp => emp.employeeId.equals(employeeId)).length || 0;

            const registerId = daily.registerId.toString();
            if (Array.isArray(daily.expectedShifts)) {
                daily.expectedShifts.forEach(({ employeeId: shiftEmployeeId, start, end }) => {
                    if (!shiftEmployeeId.equals(employeeId)) return;

                    if (!aggregation.expectedShiftsAmountByRegister.has(registerId)) {
                        aggregation.expectedShiftsAmountByRegister.set(registerId, 0);
                    }
                    aggregation.expectedShiftsAmountByRegister.set(registerId, aggregation.expectedShiftsAmountByRegister.get(registerId) + 1);
                    aggregation.totalExpectedShifts += 1;

                    const shiftTime = utils.getStartEndTime({ start, end, baseDay: dayjs(daily.date.toString(), DATE_FORMAT) });
                    if (shiftTime) {
                        const { startTime, endTime } = shiftTime;
                        const minutes = endTime.diff(startTime, 'minute');
                        if (!aggregation.expectedWorkedMinutesByRegister.has(registerId)) {
                            aggregation.expectedWorkedMinutesByRegister.set(registerId, 0);
                        }
                        aggregation.expectedWorkedMinutesByRegister.set(registerId, aggregation.expectedWorkedMinutesByRegister.get(registerId) + minutes);
                        aggregation.totalExpectedWorkedMinutes += minutes;
                    }
                });
            }

            if (Array.isArray(daily.workingHoursByEmployee)) {
                const keys = {
                    workedMinutesByRegister: 'totalWorkedMinutes',
                    expectedBreakMinutesByRegister: 'totalExpectedBreakMinutes',
                    breakMinutesByRegister: 'totalBreakMinutes',
                    pauseMinutesByRegister: 'totalPauseMinutes'
                };

                const workingHours = daily.workingHoursByEmployee.filter(wh => wh.employeeId.equals(employeeId));

                workingHours.forEach((workingHour) => {
                    const { employeeId: whEmployeeId, ...rest } = workingHour.toObject();
                    if (whEmployeeId.toString() !== employeeId.toString()) return;
                    Object.entries(keys).forEach(([mapKey, fieldKey]) => {
                        if (!aggregation[mapKey].has(registerId)) {
                            aggregation[mapKey].set(registerId, 0);
                        }
                        const value = rest[fieldKey] || 0;
                        aggregation[mapKey].set(registerId, aggregation[mapKey].get(registerId) + value);
                        aggregation[fieldKey] += value;
                    });
                });
            }

            const filteredAttendances = attendances.filter(att => att.dailyAttendanceId.equals(daily._id));
            if (Array.isArray(filteredAttendances)) {
                filteredAttendances.forEach(() => {
                    if (!aggregation.actualShiftsAmountByRegister.has(registerId)) {
                        aggregation.actualShiftsAmountByRegister.set(registerId, 0);
                    }
                    aggregation.actualShiftsAmountByRegister.set(registerId, aggregation.actualShiftsAmountByRegister.get(registerId) + 1);
                    aggregation.totalShifts += 1;
                });
            }
        });

        for (const key in aggregation) {
            if (aggregation[key] instanceof Map) {
                aggregation[key] = utils.mapToObj(aggregation[key]);
            }
        }

        return res.status(200).json({
            success: true,
            msg: {
                ...aggregation,
                registers: registers.map(register => ({
                    _id: register._id,
                    name: register.name,
                    address: register.address,
                }))
            }
        });
    } catch (error) {
        console.log(error);
        return next(utils.parseExpressErrors(error, 'srv_attendance_aggregation_failed', 500));
    }
};

module.exports = {
    getAttendanceAggregationRegisterAndByRange,
    getAttendanceAggregationEmployeeAndByRange
};