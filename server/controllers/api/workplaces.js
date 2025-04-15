const Retail = require('../../models/Retail');
const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const DailyAttendance = require('../../models/DailyAttendance');
const utils = require('../../utils');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { DAYS_OF_WEEK } = require('../../constants');
const geolib = require('geolib');

dayjs.extend(customParseFormat);

const getAvailableResourcesByDeviceId = async ({ deviceId, retailId, employeesSelect = {}, workingAtsSelect = {}, registersSelect = {}, retailsSelect = {} }) => {
    if (!deviceId) {
        return null;
    }

    const employeeQuery = {
        deviceId,
        isAvailable: true
    };

    if (retailId) {
        employeeQuery.retailId = retailId;
    }

    const employees = await Employee.find(employeeQuery)
        .select({
            retailId: 1,
            ...employeesSelect
        })
        .exec();

    if (!employees.length) {
        return null;
    }

    const employeeIds = employees.map(e => e._id);

    let workingAts = await WorkingAt.find({ employeeId: { $in: employeeIds }, isAvailable: true })
        .select(
            {
                employeeId: 1,
                registerId: 1,
                shifts: 1,
                ...workingAtsSelect
            })
        .exec();

    if (!workingAts.length) {
        return null;
    }

    workingAts.forEach(wa => {
        const shifts = wa.shifts instanceof Map ? Object.fromEntries(wa.shifts) : wa.shifts;
        for (const day in shifts) {
            if (Array.isArray(shifts[day])) {
                shifts[day] = shifts[day].filter(s => s.isAvailable);
            }
        }
        wa.shifts = shifts;
    });

    const registerIds = workingAts.map(w => w.registerId);
    const registerQuery = {
        _id: { $in: registerIds },
        isAvailable: true
    };
    if (retailId) {
        registerQuery.retailId = retailId;
    }
    const registers = await Register.find(registerQuery)
        .select({
            retailId: 1,
            ...registersSelect
        })
        .exec();

    if (registersSelect.specificBreaks || registersSelect.breaks) {
        registers.forEach(register => {
            if (register.specificBreaks) {
                const filteredSpecificBreaks = {};

                (Object.keys(register.specificBreaks)).forEach((day) => {
                    const originalBreaks = register.specificBreaks[day];

                    filteredSpecificBreaks[day] = Object.keys(originalBreaks).reduce((acc, brkKey) => {
                        const brk = originalBreaks[brkKey];
                        if (brk?.isAvailable) acc[brkKey] = brk;
                        return acc;
                    }, {});
                });

                register.specificBreaks = filteredSpecificBreaks;
            }
        });
    }
    const availableRegisterIds = registers.map(r => r._id.toString());

    workingAts = workingAts.filter(wa => availableRegisterIds.includes(wa.registerId.toString()));

    const usedEmployeeIds = new Set(workingAts.map(wa => wa.employeeId.toString()));
    const filteredEmployees = employees.filter(emp => usedEmployeeIds.has(emp._id.toString()));

    const retailIds = filteredEmployees.map(emp => emp.retailId);
    const retails = await Retail.find({ _id: { $in: retailIds } }).select(retailsSelect).exec();

    return {
        employees: filteredEmployees,
        workingAts,
        registers,
        retails,
    };
}

const getTodayWorkplaces = async (req, res, next) => {
    try {
        const { longitude, latitude, date } = req.body;
        const hasLocation = !!(longitude && latitude);

        const { workingAts, registers } = await getAvailableResourcesByDeviceId({
            deviceId: req.deviceId,
            employeesSelect: {
                name: 1,
                phone: 1,
                email: 1,
            },
            workingAtsSelect: {
                position: 1,
            },
            retailsSelect: {
                name: 1,
                address: 1,
                tin: 1,
                vin: 1,
            },
            registersSelect: {
                name: 1,
                workingHours: 1,
                address: 1,
                specificBreaks: 1,
                breaks: 1,
                location: 1,
            }
        });

        const dateToUse = date ? dayjs(date) : dayjs();
        const dayKey = DAYS_OF_WEEK[dateToUse.day()];
        const yesterdayKey = DAYS_OF_WEEK[dateToUse.subtract(1, 'day').day()];

        // Extract today's and yesterday's shifts only
        workingAts.forEach(wa => {
            const shifts = wa.shifts instanceof Map ? Object.fromEntries(wa.shifts) : wa.shifts;
            const todayShifts = Array.isArray(shifts[dayKey]) ? shifts[dayKey].filter(s => s.isAvailable) : [];
            const yesterdayShifts = Array.isArray(shifts[yesterdayKey]) ? shifts[yesterdayKey].filter(s => s.isAvailable) : [];

            wa.shifts = {
                [dayKey]: todayShifts,
                ...(yesterdayShifts.length > 0 ? { [yesterdayKey]: yesterdayShifts } : {})
            };
        });

        const filteredRegisterIds = workingAts.map(w => {
            const shifts = w.shifts instanceof Map ? Object.fromEntries(w.shifts) : w.shifts;
            const todayShifts = shifts[dayKey] || [];
            const yesterdayShifts = shifts[yesterdayKey] || [];
            return (todayShifts.length > 0 || yesterdayShifts.length > 0) ? w.registerId : null;
        }).filter(Boolean);

        const dailyAttendances = await DailyAttendance.find({
            date: { $in: [parseInt(dateToUse.format('YYYYMMDD')), parseInt(dateToUse.subtract(1, 'day').format('YYYYMMDD'))] },
            registerId: { $in: filteredRegisterIds },
        }).exec();

        const attendances = await Attendance.find({
            dailyAttendanceId: { $in: dailyAttendances.map((da) => da._id) },
        }).select({
            workingAtId: 1,
            checkInTime: 1,
            checkOutTime: 1,
            breaks: 1,
            pauses: 1,
            shiftId: 1,
        }).exec();

        const nearbyRegisters = [];

        filteredRegisterIds.forEach(registerId => {
            const register = registers.find(r => r._id.equals(registerId));
            if (register) {
                nearbyRegisters.push(register);
            }
        });

        const leanNearbyRegisters = nearbyRegisters.map(register => {
            const registerObj = register.toObject();
            delete registerObj.id;

            const workingAt = workingAts.find(w => w.registerId.equals(register._id));
            registerObj.attendances = attendances.filter(a => a.workingAtId.equals(workingAt._id));
            registerObj.shifts = workingAt.shifts;

            if (hasLocation && registerObj.location) {
                registerObj.distanceInMeters = geolib.getDistance(
                    { latitude, longitude },
                    {
                        latitude: registerObj.location.latitude,
                        longitude: registerObj.location.longitude,
                    }
                );
            } else {
                registerObj.distanceInMeters = null;
            }

            return registerObj;
        });

        leanNearbyRegisters.sort((a, b) =>
            hasLocation
                ? a.distanceInMeters - b.distanceInMeters
                : a.name.localeCompare(b.name)
        );

        return res.status(200).json({ success: true, msg: leanNearbyRegisters });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_workplaces', 500));
    }
};

const getMyWorkingPlaces = async (req, res, next) => {
    try {
        const defaultResponse = { success: true, msg: { workingAts: [], registers: [], employees: [], retails: [] } };

        const { employees, workingAts, registers, retails } = await getAvailableResourcesByDeviceId({
            deviceId: req.deviceId,
            employeesSelect: {
                name: 1,
                phone: 1,
                email: 1,
            },
            workingAtsSelect: {
                position: 1,
            },
            registersSelect: {
                name: 1,
                workingHours: 1,
                address: 1,
            },
            retailsSelect: {
                name: 1,
                address: 1,
                tin: 1,
                vin: 1,
            },
        });

        if (!employees || !workingAts || !registers || !retails) {
            return res.status(200).json(defaultResponse);
        }

        return res.status(200).json({
            success: true,
            msg: {
                retails,
                registers,
                workingAts,
                employees,
            },
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_workplaces', 500));
    }
};

module.exports = {
    getTodayWorkplaces,
    getMyWorkingPlaces,
    getAvailableResourcesByDeviceId
};
