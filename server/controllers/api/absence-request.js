const HttpError = require('../../constants/http-error');
const AbsenceRequest = require('../../models/AbsenceRequest');
const Register = require('../../models/Register');
const Retail = require('../../models/Retail');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');

const jwt = require('jsonwebtoken');
const utils = require('../../utils');

const createAbsenceRequest = async (req, res, next) => {
    try {
        const { days, start, end, reason, token, registerId } = req.body;

        const register = await Register.findOne({ _id: registerId }).exec();

        if (!register) {
            throw new HttpError('srv_register_not_found', 400);
        }

        const retail = await Retail.findOne({ _id: register.retailId }).exec();

        if (!retail) {
            throw new HttpError('srv_retail_not_found', 400);
        }

        const employee = await Employee.findOne({ deviceId: req.deviceId, retailId: retail._id }).exec();

        if (!employee) {
            throw new HttpError('srv_employee_not_found', 400);
        }

        try {
            jwt.verify(token, employee.publicKey);
        } catch {
            throw new HttpError('srv_invalid_token', 400);
        }

        const workingAt = await WorkingAt.findOne({ employeeId: employee._id, registerId: register._id, isAvailable: true }).exec();

        if (!workingAt) {
            throw new HttpError('srv_employee_not_employed', 400);
        }

        const status = 'pending';

        const newRequest = new AbsenceRequest({
            attendanceIds: [],
            registerId,
            employeeId: employee._id,
            days,
            start,
            end,
            reason,
            notes: '',
            status: status,
            logs: [{
                status: status,
                userId: null,
            }]
        });

        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_create_missing_request', 500));
    }
}

module.exports = { createAbsenceRequest };
