const HttpError = require('../../constants/http-error');
const AbsenceRequest = require('../../models/AbsenceRequest');
const Register = require('../../models/Register');
const Retail = require('../../models/Retail');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');

const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');
const utils = require('../../utils');

dayjs.extend(require('dayjs/plugin/customParseFormat'));

const getAbsenceRequests = async (req, res, next) => {
    try {
        const { from, to, token, registerId } = req.body;

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
        const format = 'YYYYMMDD';
        const start = from ? parseInt(dayjs(from).startOf('day').format(format)) : parseInt(dayjs().startOf('day').format(format));
        const end = to ? parseInt(dayjs(to).endOf('day').format(format)) : null;

        const requests = await AbsenceRequest.find({
            registerId,
            employeeId: employee._id,
            start: { $gte: start, ...(end && { $lte: end }) },
        }).select({
            logs: 0,
            __v: 0,
        }).exec();
        res.status(201).json(requests);
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_create_missing_request', 500));
    }
}

module.exports = { getAbsenceRequests };
