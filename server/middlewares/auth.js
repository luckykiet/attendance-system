const Employee = require('../models/Employee')
const HttpError = require('../constants/http-error')
const utils = require('../utils')
const jwt = require('jsonwebtoken')

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        next(new HttpError(`srv_unauthorized`, 401))
    }
}

const ensureDeviceId = (req, res, next) => {
    const appId = req.get('App-Id');
    if (appId) {
        req.deviceId = appId;
        next();
    } else {
        next(new HttpError(`srv_unauthorized`, 401));
    }
};

/**
 * Must be called after ensureDeviceId, only POST or PUT method
 *
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const ensureTokenVerified = async (req, res, next) => {
    try {
        const { token, retailId } = req.body;

        if (!req.deviceId || !token || !retailId) {
            throw new HttpError(`srv_unauthorized`, 401);
        }

        const employee = await Employee.findOne({ deviceId: req.deviceId, retailId }).exec();

        if (!employee) {
            throw new HttpError(`srv_employee_not_found`, 404);
        }

        try {
            jwt.verify(token, employee.publicKey);
        } catch {
            throw new HttpError('srv_invalid_token', 400);
        }
        req.employee = employee;
        next()
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_token_verification_failed', 400));
    }
}

module.exports = {
    ensureAuthenticated,
    ensureDeviceId,
    ensureTokenVerified
}