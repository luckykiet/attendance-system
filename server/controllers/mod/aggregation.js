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
            totalExpectedWorkingHours: 0,

            checkedInOnTime: 0,
            checkedInLate: 0,
            missingCheckIn: 0,

            checkedOutOnTime: 0,
            checkedOutEarly: 0,
            missingCheckOut: 0,

            totalWorkingMinutes: 0,
            workingHoursByEmployee: new Map(),
            expectedWorkingHoursByEmployee: new Map(),
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
                const expectedWorkingMinutesByEmployee = new Map();
                const expectedShiftsAmountByEmployee = new Map();

                daily.expectedShifts.forEach(({ employeeId, start, end }) => {
                    const empId = employeeId.toString();
                    if (!employeeIds.has(empId)) {
                        employeeIds.add(empId);
                    }
                    if (!expectedShiftsAmountByEmployee.has(empId)) {
                        expectedShiftsAmountByEmployee.set(empId, 0);
                    }
                    expectedShiftsAmountByEmployee.set(empId, expectedShiftsAmountByEmployee.get(empId) + 1);

                    if (!expectedWorkingMinutesByEmployee.has(empId)) {
                        expectedWorkingMinutesByEmployee.set(empId, 0);
                    }

                    const shiftTime = utils.getStartEndTime({ start, end, baseDay: dayjs(daily.date.toString(), DATE_FORMAT) });
                    if (shiftTime) {
                        const { startTime, endTime } = shiftTime;
                        const minutes = endTime.diff(startTime, 'minute');
                        expectedWorkingMinutesByEmployee.set(empId, expectedWorkingMinutesByEmployee.get(empId) + minutes);
                    }
                });


                expectedWorkingMinutesByEmployee.forEach((minutes, empId) => {
                    if (!aggregation.expectedWorkingHoursByEmployee.has(empId)) {
                        aggregation.expectedWorkingHoursByEmployee.set(empId, 0);
                    }
                    aggregation.expectedWorkingHoursByEmployee.set(
                        empId,
                        aggregation.expectedWorkingHoursByEmployee.get(empId) + minutes
                    );
                    aggregation.totalExpectedWorkingHours += minutes;
                });

                expectedShiftsAmountByEmployee.forEach((amount, empId) => {
                    if (!aggregation.expectedShiftsAmountByEmployee.has(empId)) {
                        aggregation.expectedShiftsAmountByEmployee.set(empId, 0);
                    }
                    aggregation.expectedShiftsAmountByEmployee.set(
                        empId,
                        aggregation.expectedShiftsAmountByEmployee.get(empId) + amount
                    );
                    aggregation.totalExpectedWorkingHours += amount;
                });
            }

            if (Array.isArray(daily.workingHoursByEmployee)) {
                const dailyWorkingMinutesByEmployee = new Map();

                daily.workingHoursByEmployee.forEach(({ employeeId, minutes }) => {
                    const empId = employeeId.toString();
                    if (!dailyWorkingMinutesByEmployee.has(empId)) {
                        dailyWorkingMinutesByEmployee.set(empId, 0);
                    }
                    dailyWorkingMinutesByEmployee.set(empId, dailyWorkingMinutesByEmployee.get(empId) + minutes);
                });

                dailyWorkingMinutesByEmployee.forEach((minutes, empId) => {
                    if (!aggregation.workingHoursByEmployee.has(empId)) {
                        aggregation.workingHoursByEmployee.set(empId, 0);
                    }
                    aggregation.workingHoursByEmployee.set(
                        empId,
                        aggregation.workingHoursByEmployee.get(empId) + minutes
                    );
                    aggregation.totalWorkingMinutes += minutes;
                });
            }

            if (Array.isArray(daily.attendanceIds)) {
                const actualShiftsAmountByEmployee = new Map();
                daily.attendanceIds.forEach(attendanceId => {

                    const attendance = attendances.find(att => att._id.equals(attendanceId));

                    if (!attendance) return;
                    const workingAt = workingAts.find(w => w._id.equals(attendance.workingAtId));

                    if (!workingAt) return;

                    const empId = workingAt.employeeId.toString();

                    if (!actualShiftsAmountByEmployee.has(empId)) {
                        actualShiftsAmountByEmployee.set(empId, 0);
                    }
                    actualShiftsAmountByEmployee.set(empId, actualShiftsAmountByEmployee.get(empId) + 1);
                });

                actualShiftsAmountByEmployee.forEach((amount, empId) => {
                    if (!aggregation.actualShiftsAmountByEmployee.has(empId)) {
                        aggregation.actualShiftsAmountByEmployee.set(empId, 0);
                    }
                    aggregation.actualShiftsAmountByEmployee.set(
                        empId,
                        aggregation.actualShiftsAmountByEmployee.get(empId) + amount
                    );
                });
            }
        });

        const workingHoursByEmployeeObj = {};
        aggregation.workingHoursByEmployee.forEach((minutes, employeeId) => {
            workingHoursByEmployeeObj[employeeId] = minutes;
        });

        const expectedWorkingHoursByEmployeeObj = {};
        aggregation.expectedWorkingHoursByEmployee.forEach((minutes, employeeId) => {
            expectedWorkingHoursByEmployeeObj[employeeId] = minutes;
        });

        const expectedShiftsAmountByEmployeeObj = {};
        aggregation.expectedShiftsAmountByEmployee.forEach((amount, employeeId) => {
            expectedShiftsAmountByEmployeeObj[employeeId] = amount;
        });

        const actualShiftsAmountByEmployeeObj = {};
        aggregation.actualShiftsAmountByEmployee.forEach((amount, employeeId) => {
            actualShiftsAmountByEmployeeObj[employeeId] = amount;
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

        return res.status(200).json({
            success: true,
            msg: {
                ...aggregation,
                workingHoursByEmployee: workingHoursByEmployeeObj,
                expectedWorkingHoursByEmployee: expectedWorkingHoursByEmployeeObj,
                expectedShiftsAmountByEmployee: expectedShiftsAmountByEmployeeObj,
                actualShiftsAmountByEmployee: actualShiftsAmountByEmployeeObj,
                employees
            }
        });
    } catch (error) {
        console.log(error)
        return next(utils.parseExpressErrors(error, 'srv_attendance_aggregation_failed', 500));
    }
};


module.exports = {
    getAttendanceAggregationRegisterAndByRange,
};