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

const finalizeDailyAttendanceAggregation = async (date) => {
    const dayjs = require('dayjs');
    const targetDate = dayjs(date, 'YYYYMMDD');
    if (!targetDate.isValid()) throw new Error('Invalid date');

    const numericDate = parseInt(targetDate.format('YYYYMMDD'));
    const allDailyAttendances = await DailyAttendance.find({ date: numericDate });

    for (const daily of allDailyAttendances) {
        const attendanceDocs = await Attendance.find({ dailyAttendanceId: daily._id });

        const missingCheckIn = [];
        const missingCheckOut = [];
        const workingHoursByEmployee = {};

        for (const expected of daily.expectedEmployees || []) {
            const eid = expected.employeeId.toString();
            const attendance = attendanceDocs.find(a =>
                a.employeeId.toString() === eid &&
                a.shiftId.toString() === expected.shiftId.toString()
            );

            if (!attendance) {
                missingCheckIn.push(expected.employeeId);
            } else {
                if (!attendance.checkOutTime) {
                    missingCheckOut.push(expected.employeeId);
                } else {
                    const start = dayjs(attendance.checkInTime);
                    const end = dayjs(attendance.checkOutTime);

                    let totalBreaks = 0;
                    let totalPauses = 0;

                    (attendance.breaks || []).forEach(b => {
                        if (b.start && b.end) {
                            totalBreaks += dayjs(b.end).diff(dayjs(b.start), 'minute');
                        }
                    });

                    (attendance.pauses || []).forEach(p => {
                        if (p.start && p.end) {
                            totalPauses += dayjs(p.end).diff(dayjs(p.start), 'minute');
                        }
                    });

                    const worked = end.diff(start, 'minute') - totalBreaks - totalPauses;
                    workingHoursByEmployee[eid] = worked;
                }
            }
        }

        daily.missingCheckIn = missingCheckIn;
        daily.missingCheckOut = missingCheckOut;
        daily.workingHoursByEmployee = workingHoursByEmployee;

        await daily.save();
    }

    return { success: true, updated: allDailyAttendances.length };
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
    confirmTokenPayload: (payload) => {
        if (!payload) {
            return false
        }
        const tmpBody = JSON.parse(JSON.stringify(payload));
        delete tmpBody.token;
        delete payload.timestamp;


        return !_.isEqual(tmpBody, payload)
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
}
module.exports = utils