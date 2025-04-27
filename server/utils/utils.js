const axios = require("axios")
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const { CONFIG } = require("../configs")
const HttpError = require("../constants/http-error")
const winston = require('winston')
const path = require('path')
const fs = require('fs')
const Register = require("../models/Register");
const Retail = require("../models/Retail");
const WorkingAt = require("../models/WorkingAt");
const LocalDevice = require('../models/LocalDevice');

const geolib = require('geolib');
const { DAYS_OF_WEEK, TIME_FORMAT } = require('../constants');

const { createLoggerConfig } = require('./loggers')
const dayjs = require("dayjs")
const DailyAttendance = require("../models/DailyAttendance")
const Attendance = require("../models/Attendance")
const mongoose = require("mongoose")
const { DATE_FORMAT } = require("../constants/days")
const Employee = require("../models/Employee")

dayjs.extend(require('dayjs/plugin/customParseFormat'))
dayjs.extend(require('dayjs/plugin/isSameOrBefore'))
dayjs.extend(require('dayjs/plugin/isSameOrAfter'))
dayjs.extend(require('dayjs/plugin/isBetween'))
dayjs.extend(require('dayjs/plugin/utc'))

const isValidTime = (time, timeFormat = TIME_FORMAT) => {
    return dayjs.utc(time, timeFormat, true).isValid();
}

const isOverNight = (start, end, timeFormat = TIME_FORMAT) => {
    const startTime = dayjs.utc(start, timeFormat);
    const endTime = dayjs.utc(end, timeFormat);

    return endTime.isBefore(startTime);
}

const getTranslations = async (lang) => {
    try {
        const filePath = path.join(__dirname, '..', 'locales', `${lang}.json`);

        if (!fs.existsSync(filePath)) {
            console.warn(`Translation file for ${lang} not found, falling back to en.json`);
            return getTranslations('en');
        }

        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        return null;
    }
}

const isBetweenTime = ({ time, start, end, isToday = true, timeFormat = TIME_FORMAT }) => {
    let timeMoment = !dayjs.isDayjs(time) ? dayjs(time, timeFormat) : time;

    const { startTime: startMoment, endTime: endMoment } = getStartEndTime({ start, end, timeFormat, isToday });

    return timeMoment.isBetween(startMoment, endMoment);
};

const checkEmployeeResources = async (req) => {
    const { latitude, longitude, registerId, localDeviceId, shiftId } = req.body;

    if (!shiftId) {
        throw new HttpError('srv_invalid_request', 400);
    }

    const register = await Register.findOne({ _id: registerId }).exec();

    if (!register) {
        throw new HttpError('srv_register_not_found', 400);
    }

    const retail = await Retail.findOne({ _id: register.retailId }).exec();

    if (!retail) {
        throw new HttpError('srv_retail_not_found', 400);
    }

    const { employee } = req

    const workingAt = await WorkingAt.findOne({ employeeId: employee._id, registerId: register._id, isAvailable: true }).exec();

    if (!workingAt) {
        throw new HttpError('srv_employee_not_employed', 400);
    }
    // check for overnight shifts
    const now = dayjs();
    const todayKey = DAYS_OF_WEEK[now.day()];
    const yesterdayKey = DAYS_OF_WEEK[now.subtract(1, 'day').day()];

    const yesterdayShifts = workingAt.shifts.get(yesterdayKey);
    const todayShifts = workingAt.shifts.get(todayKey);

    if ((!todayShifts && !yesterdayShifts) || (!todayShifts.length && !yesterdayShifts.length)) {
        throw new HttpError('srv_employee_not_working_today', 400);
    }
    let isToday = true;
    let shift = todayShifts.find(s => s._id.toString() === shiftId)
    if (!shift) {
        shift = yesterdayShifts.find(s => s._id.toString() === shiftId);
        if (!shift) {
            throw new HttpError('srv_shift_not_found', 400);
        }
        isToday = false;
        // because the shift is overnight, we need to check if the current time is after the end time of the shift. End time is the next day
        const endTime = dayjs(shift.end, TIME_FORMAT, true).add(1, 'day');

        if (now.isAfter(endTime)) {
            throw new HttpError('srv_shift_already_ended', 400);
        }
    }

    if (!shift || !shift.isAvailable) {
        throw new HttpError('srv_employee_not_working_today', 400);
    }

    const { startTime: shiftStartTime, endTime: shiftEndTime } = getStartEndTime({ start: shift.start, end: shift.end, isToday });
    if (shift.allowedOverTime && now.isBefore(shiftStartTime.subtract(shift.allowedOverTime, 'minutes'))) {
        throw new HttpError('srv_shift_not_started', 400);
    } else if (shift.allowedOverTime && now.isAfter(shiftEndTime.add(shift.allowedOverTime, 'minutes'))) {
        throw new HttpError('srv_shift_already_ended', 400);
    }

    const workingHour = register.workingHours[isToday ? todayKey : yesterdayKey];

    if (!workingHour.isAvailable || !isBetweenTime({ time: now, start: workingHour.start, end: workingHour.end, isToday })) {
        throw new HttpError('srv_workplace_closed', 400);
    }

    const localDevices = await LocalDevice.find({ registerId }).exec();

    if (localDevices.length) {
        // should have a local device id, return the list of local devices
        if (!localDeviceId) {
            return { localDevices }
        }
        if (!localDevices.find(d => d.uuid === localDeviceId)) {
            throw new HttpError('srv_invalid_local_device', 400);
        }
    }
    const localDevice = localDeviceId ? localDevices.find(d => d.uuid === localDeviceId) : null;

    const locationToUse = localDevice && localDevice.location ? {
        latitude: localDevice.location.latitude,
        longitude: localDevice.location.longitude,
    } : {
        latitude: register.location.coordinates[1],
        longitude: register.location.coordinates[0],
    };

    const distanceInMeters = geolib.getDistance({ latitude, longitude }, locationToUse);
    const allowedRadius = localDevice && localDevice.location ? localDevice.location.allowedRadius : register.location.allowedRadius;

    if (distanceInMeters > allowedRadius) {
        throw new HttpError('srv_outside_allowed_radius', 400);
    }
    return {
        register,
        retail,
        workingAt,
        shift,
        localDevice,
        isToday,
        distanceInMeters,
        allowedRadius,
    }
}

const getStartEndTime = ({
    start,
    end,
    timeFormat = TIME_FORMAT,
    baseDay = dayjs(),
    isToday = true,
}) => {
    const base = isToday ? dayjs(baseDay) : dayjs(baseDay).subtract(1, 'day');

    const startParsed = dayjs(start, timeFormat, true);
    const endParsed = dayjs(end, timeFormat, true);

    if (!startParsed.isValid() || !endParsed.isValid() || startParsed.isSame(endParsed)) {
        return null;
    }

    const startTime = base
        .hour(startParsed.hour())
        .minute(startParsed.minute())
        .second(0)
        .millisecond(0);

    let endTime = base
        .hour(endParsed.hour())
        .minute(endParsed.minute())
        .second(0)
        .millisecond(0);

    let isOverNight = false;
    if (endTime.isBefore(startTime)) {
        isOverNight = true;
        endTime = endTime.add(1, 'day');
    }

    return { startTime, endTime, isOverNight };
};

const isBreakWithinShift = ({
    breakStart,
    breakEnd,
    shiftStart,
    shiftEnd,
    timeFormat = TIME_FORMAT,
}) => {
    const baseDay = dayjs();

    const shiftTime = getStartEndTime({
        start: shiftStart,
        end: shiftEnd,
        timeFormat,
        baseDay,
    });

    if (!shiftTime) return false;

    const { startTime: sStart, endTime: sEnd, isOverNight: shiftIsOvernight } = shiftTime;

    const breakTime = getStartEndTime({
        start: breakStart,
        end: breakEnd,
        timeFormat,
        baseDay,
    });

    if (!breakTime) return false;

    let { startTime: bStart, endTime: bEnd } = breakTime;

    if (shiftIsOvernight && bEnd.isBefore(sStart)) {
        bStart = bStart.add(1, 'day');
        bEnd = bEnd.add(1, 'day');
    }

    return bStart.isBefore(sEnd) && bEnd.isAfter(sStart);
};

const calculateTotalWorkedMinutes = async (attendanceId) => {
    const getLogger = utils.getLogger;
    const logger = getLogger(__filename);
    try {
        const attendance = await Attendance.findOne({ _id: attendanceId }).exec();

        if (!attendance) {
            throw new Error('Attendance not found');
        }
        const dailyAttendance = await DailyAttendance.findOne({ _id: attendance.dailyAttendanceId }).exec();

        if (!dailyAttendance) {
            throw new Error('Daily attendance not found');
        }

        const workingAt = await WorkingAt.findOne({ _id: attendance.workingAtId }).exec();

        if (!workingAt) {
            throw new Error('WorkingAt not found');
        }

        let needUpdate = false;
        const shiftTime = getStartEndTime({
            start: attendance.start,
            end: attendance.end,
            timeFormat: TIME_FORMAT,
            baseDay: dayjs(dailyAttendance.date.toString(), DATE_FORMAT, true),
        });

        if (!shiftTime) {
            throw new Error('Invalid shift time');
        }

        const { endTime: shiftEnd } = shiftTime;

        if (!attendance.checkOutTime) {
            if (shiftEnd.isAfter(dayjs())) {
                throw new Error('Shift end time is in the future');
            }
            needUpdate = true;
            attendance.checkOutTime = shiftEnd.clone().toDate();
            dailyAttendance.checkedOutOnTime += 1;
            dailyAttendance.checkedOutOnTimeByEmployee.set(workingAt.employeeId, (dailyAttendance.checkedOutOnTimeByEmployee.get(workingAt.employeeId) || 0) + 1);
        }

        const checkIn = dayjs(attendance.checkInTime);
        const checkOut = dayjs(attendance.checkOutTime);

        const attendanceTime = utils.getStartEndTime({ start: attendance.start, end: attendance.end, baseDay: dayjs(dailyAttendance.date.toString(), DATE_FORMAT, true) });

        if (!attendanceTime) {
            throw new Error('Invalid attendance time');
        }

        const totalWorkedMinutes = checkOut.diff(checkIn, 'minute');

        let totalExpectedBreakMinutes = 0;
        let totalBreakMinutes = 0;
        let totalPauseMinutes = 0;

        attendance.breaks?.forEach(b => {
            const breakDuration = b.breakHours?.duration || 0;
            if (breakDuration) {
                if (!b.checkOutTime) {
                    b.checkOutTime = attendanceTime.endTime.toDate();
                    needUpdate = true;
                }
                totalExpectedBreakMinutes += breakDuration;
                const realDuration = dayjs(b.checkOutTime).diff(dayjs(b.checkInTime), 'minute');
                totalBreakMinutes += realDuration;
            }
        });

        attendance.pauses?.forEach(p => {
            if (!p.checkOutTime) {
                p.checkOutTime = attendanceTime.endTime.toDate();
                needUpdate = true;
            }
            const realDuration = dayjs(p.checkOutTime).diff(dayjs(p.checkInTime), 'minute');
            totalPauseMinutes += realDuration;
        });

        if (needUpdate) {
            await attendance.save();
        }

        return {
            success: true,
            msg: {
                totalWorkedMinutes,
                totalBreakMinutes,
                totalExpectedBreakMinutes,
                totalPauseMinutes,
            }
        };
    } catch (error) {
        logger.error(`Error calculating total worked minutes: ${error.message}`);
        return { success: false, error: error.message };

    }
}

const finalizeDailyAttendanceAggregation = async (date) => {
    const getLogger = utils.getLogger;
    const logger = getLogger(__filename);
    try {
        logger.info(`Finalizing daily attendance aggregation for date: ${date}`);
        const now = dayjs();
        const targetDate = dayjs(date.toString(), DATE_FORMAT, true).endOf('day');
        if (!targetDate.isValid()) throw new Error('Invalid date');
        if (targetDate.isAfter(now.startOf('day'))) throw new Error('Date cannot be in the future');
        const numericDate = parseInt(targetDate.format(DATE_FORMAT));
        const allDailyAttendances = await DailyAttendance.find({ date: numericDate });

        for (const daily of allDailyAttendances) {
            if (daily.confirmed) {
                logger.warn(`Daily attendance ${daily._id} for date ${date} is already confirmed, skipping.`);
                continue;
            }

            const attendanceDocs = await Attendance.find({ _id: { $in: daily.attendanceIds } }).exec();
            if (!daily.missingEmployees) daily.missingEmployees = [];

            for (const expected of daily.expectedShifts || []) {
                const attendance = attendanceDocs.find(a => a.shiftId.equals(expected.shiftId));

                if (!attendance) {
                    const foundMissing = daily.missingEmployees.find(e => e.employeeId.equals(expected.employeeId) && e.shiftId.equals(expected.shiftId));
                    if (foundMissing) continue;
                    daily.missingEmployees.push({
                        employeeId: expected.employeeId,
                        shiftId: expected.shiftId,
                    });
                    continue;
                }

                const calculatedWorkedMinutes = await calculateTotalWorkedMinutes(attendance._id);
                if (!calculatedWorkedMinutes.success) {
                    logger.error(`Error calculating worked minutes for attendance ${attendance._id}: ${calculatedWorkedMinutes.error}`);
                    continue;
                }

                const existing = daily.workingHoursByEmployee.find(e =>
                    e.employeeId.equals(expected.employeeId) && e.shiftId.equals(expected.shiftId)
                );

                if (existing) {
                    existing.totalWorkedMinutes = calculatedWorkedMinutes.msg.totalWorkedMinutes;
                    existing.totalBreakMinutes = calculatedWorkedMinutes.msg.totalBreakMinutes;
                    existing.totalExpectedBreakMinutes = calculatedWorkedMinutes.msg.totalExpectedBreakMinutes;
                    existing.totalPauseMinutes = calculatedWorkedMinutes.msg.totalPauseMinutes;
                } else {
                    daily.workingHoursByEmployee.push({
                        employeeId: new mongoose.Types.ObjectId(expected.employeeId),
                        shiftId: new mongoose.Types.ObjectId(expected.shiftId),
                        totalWorkedMinutes: calculatedWorkedMinutes.msg.totalWorkedMinutes,
                        totalBreakMinutes: calculatedWorkedMinutes.msg.totalBreakMinutes,
                        totalExpectedBreakMinutes: calculatedWorkedMinutes.msg.totalExpectedBreakMinutes,
                        totalPauseMinutes: calculatedWorkedMinutes.msg.totalPauseMinutes,
                    });
                }
            }
            daily.confirmed = true;
            await daily.save();
        }

        return { success: true, updated: allDailyAttendances.length };
    } catch (error) {
        logger.error(`Error finalizing daily attendance aggregation: ${error.message}`);
        return { success: false, error: error.message };
    }
};

const updateEmployeeDailyAttendance = async ({ employeeId, isDeleting = false, date = dayjs().format(DATE_FORMAT) }) => {
    const getLogger = utils.getLogger;
    const logger = getLogger(__filename);

    try {
        if (!employeeId || !date) {
            logger.warn('Missing required parameters', { employeeId, date });
            throw new Error('Missing required parameters');
        }

        const employee = await Employee.findOne({ _id: employeeId }).exec();
        if (!employee) {
            logger.warn(`No employee found for id ${employeeId}`);
            throw new Error('No employee found');
        }

        const targetDate = dayjs(date.toString(), DATE_FORMAT, true).endOf('day');
        if (!targetDate.isValid()) throw new Error('Invalid date');

        const workingAts = await WorkingAt.find({ employeeId }).exec();

        logger.info(`Updating daily attendance for employee ${employeeId} on date: ${date}`);

        const promises = workingAts.map(async (workingAt) => {
            try {
                const { registerId } = workingAt;
                const numericDate = parseInt(targetDate.format(DATE_FORMAT));
                const daily = await DailyAttendance.findOne({ date: numericDate, registerId }).exec();
                if (!daily) {
                    logger.warn(`No daily attendance found for date ${date} and registerId ${registerId}`);
                    return;
                }

                if (daily.confirmed) {
                    logger.warn('Daily attendance already confirmed');
                    return;
                }
                const attendances = await Attendance.find({ _id: { $in: daily.attendanceIds } }).exec();
                const shiftsToday = workingAt.shifts.get(DAYS_OF_WEEK[targetDate.day()]) || [];

                const attendanceShiftIds = new Set(attendances.map(a => a.shiftId.toString()));
                const allShiftIdsToday = new Set(shiftsToday.map(shift => shift._id.toString()));

                if (!workingAt.isAvailable || isDeleting) {
                    // Employee is unavailable: remove all missing shifts without attendance
                    daily.missingEmployees = daily.missingEmployees.filter(
                        (e) => !e.employeeId.equals(employeeId) || attendanceShiftIds.has(e.shiftId.toString())
                    );
                    daily.expectedShifts = daily.expectedShifts.filter(
                        (e) => !e.employeeId.equals(employeeId) || attendanceShiftIds.has(e.shiftId.toString())
                    );
                    daily.workingHoursByEmployee = daily.workingHoursByEmployee.filter(
                        (e) => !e.employeeId.equals(employeeId) || attendanceShiftIds.has(e.shiftId.toString())
                    );
                } else {
                    for (const shift of shiftsToday) {
                        if (!shift.isAvailable) {
                            // Shift unavailable, remove everything but attendance
                            daily.missingEmployees = daily.missingEmployees.filter(
                                (e) => !(e.employeeId.equals(employeeId) && e.shiftId.equals(shift._id) && !attendanceShiftIds.has(e.shiftId.toString()))
                            );
                            daily.expectedShifts = daily.expectedShifts.filter(
                                (e) => !(e.employeeId.equals(employeeId) && e.shiftId.equals(shift._id) && !attendanceShiftIds.has(e.shiftId.toString()))
                            );
                            daily.workingHoursByEmployee = daily.workingHoursByEmployee.filter(
                                (e) => !(e.employeeId.equals(employeeId) && e.shiftId.equals(shift._id) && !attendanceShiftIds.has(e.shiftId.toString()))
                            );
                        } else {
                            // Shift still available, make sure it exists in expectedShifts
                            const foundIndex = daily.expectedShifts.findIndex(
                                e => e.employeeId.equals(employeeId) && e.shiftId.equals(shift._id)
                            );

                            const expectedShift = {
                                employeeId,
                                shiftId: shift._id,
                                start: shift.start,
                                end: shift.end,
                                isOverNight: shift.isOverNight,
                                allowedOverTime: shift.allowedOverTime,
                            };
                            if (foundIndex !== -1) {
                                // dont update if attendance exists
                                if (!attendanceShiftIds.has(shift._id.toString())) {
                                    daily.expectedShifts[foundIndex] = expectedShift;
                                }
                            } else {
                                daily.expectedShifts.push(expectedShift);
                            }
                        }
                    }
                }

                daily.expectedShifts = daily.expectedShifts.filter(e => {
                    if (!e.employeeId.equals(employeeId)) return true;
                    const shiftIdStr = e.shiftId.toString();
                    const hasAttendance = attendanceShiftIds.has(shiftIdStr);
                    const isStillInWorkingAt = allShiftIdsToday.has(shiftIdStr);
                    return hasAttendance || isStillInWorkingAt;
                });

                daily.missingEmployees = daily.missingEmployees.filter(e => {
                    if (!e.employeeId.equals(employeeId)) return true;
                    const shiftIdStr = e.shiftId.toString();
                    const hasAttendance = attendanceShiftIds.has(shiftIdStr);
                    const isStillInWorkingAt = allShiftIdsToday.has(shiftIdStr);
                    return hasAttendance || isStillInWorkingAt;
                });

                daily.workingHoursByEmployee = daily.workingHoursByEmployee.filter(e => {
                    if (!e.employeeId.equals(employeeId)) return true;
                    const shiftIdStr = e.shiftId.toString();
                    const hasAttendance = attendanceShiftIds.has(shiftIdStr);
                    const isStillInWorkingAt = allShiftIdsToday.has(shiftIdStr);
                    return hasAttendance || isStillInWorkingAt;
                });

                await daily.save();
                logger.info(`Updated daily attendance for registerId ${registerId}`);
            } catch (err) {
                logger.error(`Error updating daily attendance for workingAt ${workingAt._id}: ${err.message}`);
            }
        })

        await Promise.all(promises);

        logger.info(`Employee ${employeeId} daily attendance updated successfully for date ${date}.`);
        return { success: true, msg: 'Daily attendance updated successfully' };
    } catch (error) {
        logger.error(`Error updating daily attendance: ${error.message}`);
        return { success: false, error: error.message };
    }
};


const utils = {
    fetchAresWithTin: async (tin) => {
        const aresLoggers = winston.loggers.get('ares')
        try {
            aresLoggers.info(`Fetching ARES`, { tin })
            const response = await axios.get(
                `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${tin}`,
                { timeout: 5000 }
            )
            const data = response.data

            if (!data) {
                throw new Error(`srv_ares_failed`)
            }

            if (!_.isEmpty(data.kod)) {
                return { success: false, msg: data.subKod ? data.subKod : data.kod }
            }

            const cpFull = !_.isEmpty(data.sidlo?.cisloOrientacni)
                ? `${data.sidlo?.cisloDomovni}/${data.sidlo.cisloOrientacni}`
                : data.sidlo.cisloDomovni

            aresLoggers.info(`ARES data fetched`, { data })

            return {
                success: true,
                msg: {
                    tin: data.ico,
                    name: data.obchodniJmeno,
                    vin: data.dic ? data.dic : '',
                    address: {
                        street: `${!_.isEmpty(data.sidlo.nazevUlice)
                            ? data.sidlo.nazevUlice
                            : data.sidlo.nazevObce
                            } ${cpFull}`,
                        city: data.sidlo.nazevObce,
                        zip: data.sidlo.psc ? data.sidlo.psc.toString() : '',
                    },
                },
            }
        } catch (error) {
            aresLoggers.error(`Error fetching ARES data: ${error.message}`)
            return { success: false, msg: `srv_ares_failed` }
        }
    },
    regex: {
        username: /^[a-z0-9]{4,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        simpleTinRegex: /^\d{7,8}$/,
    },
    signItemToken: (item, time) => {
        return time
            ? jwt.sign(item, CONFIG.jwtSecret, { expiresIn: time })
            : jwt.sign(item, CONFIG.jwtSecret)
    },
    parseExpressErrors: (error, defaultMsg = 'srv_error', defaultStatusCode = 500, defaultLoggerMessage = '', defaultLogger = 'http') => {
        const message = error instanceof Error ? error.message : defaultMsg
        const loggerMessage = defaultLoggerMessage || message
        return error instanceof HttpError ? error : new HttpError(message, defaultStatusCode, loggerMessage, defaultLogger)
    },
    getGrecaptchaSiteKey: (domain) => {
        return CONFIG.grecaptchaSiteKeys[domain] || '';
    },
    getGrecaptchaSecret: (domain) => {
        return CONFIG.grecaptchaSecrets[domain] || '';
    },
    getGoogleMapsApiKey: (domain) => {
        return CONFIG.googleMapsApiKeys[domain] || '';
    },
    _loggers: null,

    getLogger(filePath) {
        const baseName = path.basename(filePath, '.js').toLowerCase();

        if (!this._loggers) {
            this._loggers = {};
        }

        if (!this._loggers[baseName]) {
            createLoggerConfig({ name: baseName });
            this._loggers[baseName] = winston.loggers.get(baseName);
        }

        return this._loggers[baseName];
    },
    getTranslations,
    isValidTime(time, timeFormat = TIME_FORMAT) {
        return isValidTime(time, timeFormat)
    },
    isOverNight: (start, end, timeFormat = TIME_FORMAT) => {
        return isOverNight(start, end, timeFormat)
    },
    validateBreaksWithinWorkingHours: (brk, workingHours, timeFormat = TIME_FORMAT) => {
        const isInsideWorkingHours = isBreakWithinShift({
            breakStart: brk.start,
            breakEnd: brk.end,
            shiftStart: workingHours.start,
            shiftEnd: workingHours.end,
            timeFormat,
        });
        return {
            isStartValid: isInsideWorkingHours,
            isEndValid: isInsideWorkingHours,
        };
    },
    isBetweenTime: ({ time, start, end, isToday = true, timeFormat = TIME_FORMAT }) => {
        return isBetweenTime({ time, start, end, isToday, timeFormat })
    },
    getStartEndTime: ({ start, end, baseDay, timeFormat = TIME_FORMAT, isToday = true }) => {
        return getStartEndTime({ start, end, baseDay, timeFormat, isToday })
    },
    checkEmployeeResources: (req) => {
        return checkEmployeeResources(req)
    },
    isBreakWithinShift: ({ breakStart, breakEnd, shiftStart, shiftEnd, timeFormat = TIME_FORMAT }) => {
        return isBreakWithinShift({ breakStart, breakEnd, shiftStart, shiftEnd, timeFormat })
    },
    finalizeDailyAttendanceAggregation: (date) => {
        return finalizeDailyAttendanceAggregation(date)
    },
    updateEmployeeDailyAttendance: ({ employeeId, isDeleting, date }) => {
        return updateEmployeeDailyAttendance({ employeeId, isDeleting, date })
    },
    calculateTotalWorkedMinutes: (attendanceId) => {
        return calculateTotalWorkedMinutes(attendanceId)
    },
    mapToObj: (map) => {
        return Object.fromEntries(map);
    }
}
module.exports = utils