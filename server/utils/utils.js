require('./loggers')
const axios = require("axios")
const _ = require('lodash')
const jwt = require('jsonwebtoken')
const { CONFIG } = require("../configs")
const HttpError = require("../constants/http-error")
const winston = require('winston')

const utils = {
    fetchAresWithTin: async (tin) => {
        try {
            console.log(`Fetching ARES: ${tin}`)
            const response = await axios.get(
                `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${tin}`,
                { timeout: 5000 }
            )
            const data = response.data
            if (!data) {
                return { success: false, msg: `srv_ares_failed` }
            }
            if (!_.isEmpty(data.kod)) {
                return { success: false, msg: data.subKod ? data.subKod : data.kod }
            }
            const cpFull = !_.isEmpty(data.sidlo?.cisloOrientacni)
                ? `${data.sidlo?.cisloDomovni}/${data.sidlo.cisloOrientacni}`
                : data.sidlo.cisloDomovni

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
            return { success: false, msg: error.response?.data || `srv_ares_failed` }
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
    loggers: {
        auth: winston.loggers.get('auth'),
        signup: winston.loggers.get('signup'),
        passwordreset: winston.loggers.get('passwordreset'),
        http: winston.loggers.get('http'),
    },
}
module.exports = utils