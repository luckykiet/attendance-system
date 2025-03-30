const axios = require("axios")
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const { CONFIG } = require("../configs")
const HttpError = require("../constants/http-error")
const { TIME_FORMAT } = require('../constants')
const winston = require('winston')
const path = require('path')
const fs = require('fs')

const { createLoggerConfig } = require('./loggers')
const dayjs = require("dayjs")
dayjs.extend(require('dayjs/plugin/customParseFormat'))
dayjs.extend(require('dayjs/plugin/isSameOrBefore'))
dayjs.extend(require('dayjs/plugin/isSameOrAfter'))
dayjs.extend(require('dayjs/plugin/utc'))

const isValidTime = (time, timeFormat = TIME_FORMAT) => {
    return dayjs.utc(time, timeFormat, true).isValid();
}

const isOverNight = (start, end, timeFormat = TIME_FORMAT) => {
    const startTime = dayjs(start, timeFormat);
    const endTime = dayjs(end, timeFormat);

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
            return { success: false, msg: error instanceof Error ? error.message : error.response?.data || `srv_ares_failed` }
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
    get loggers() {
        if (!this._loggers) {
            const files = ['http', 'auth', 'signup', 'passwordreset', 'ares'];
            this._loggers = {};

            files.forEach(file => {
                createLoggerConfig({ name: file });
                this._loggers[file] = winston.loggers.get(file);
            });
        }
        return this._loggers;
    },
    getTranslations,
    isValidTime(time, timeFormat = TIME_FORMAT) {
        return isValidTime(time, timeFormat)
    },
    isOverNight: (start, end, timeFormat = TIME_FORMAT) => {
        return isOverNight(start, end, timeFormat)
    },
    validateBreaksWithinWorkingHours: (brk, workingHours, timeFormat = TIME_FORMAT) => {
        const workStart = dayjs(workingHours.start, timeFormat);
        let workEnd = dayjs(workingHours.end, timeFormat);

        if (workEnd.isBefore(workStart)) {
            workEnd = workEnd.add(1, 'day');
        }

        let breakStart = dayjs(brk.start, timeFormat);
        let breakEnd = dayjs(brk.end, timeFormat);

        if (breakEnd.isBefore(breakStart)) {
            breakEnd = breakEnd.add(1, 'day');
        }

        return {
            isStartValid: breakStart.isSameOrAfter(workStart),
            isEndValid: breakEnd.isSameOrBefore(workEnd),
        };
    },
}
module.exports = utils