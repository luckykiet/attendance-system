const crypto = require('crypto');
const HttpError = require('../../constants/http-error');
const WorkingAt = require('../../models/WorkingAt');
const Retail = require('../../models/Retail');
const Registration = require('../../models/Registration');
const Employee = require('../../models/Employee');
const utils = require('../../utils');
const { sendMailEmployeeDeviceRegistration } = require('../../mail_sender');

const saveEmployeeRegistration = async ({ employeeId, retailId, tokenId = '' }) => {
    if (tokenId) {
        const foundToken = await Registration.findOne({ tokenId, employeeId, retailId });
        if (foundToken) {
            return foundToken.tokenId;
        }
    }
    const newTokenId = crypto.randomBytes(16).toString('hex');
    const newRegistration = new Registration({ tokenId: newTokenId, employeeId, retailId });
    await newRegistration.save();
    return newTokenId;
};

const employeeRegistration = async (req, res, next) => {
    try {
        const { employeeId } = req.body;
        const employee = await Employee.findOne({ _id: employeeId, retailId: req.user.retailId }).exec();

        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }

        const existingToken = employee.registrationToken;

        const tokenId = await saveEmployeeRegistration({ retailId: req.user.retailId, employeeId, token: existingToken });

        const updateQuery = { deviceId: '' };

        if (tokenId !== existingToken) {
            updateQuery.registrationToken = tokenId;
        }

        await Employee.updateOne({ _id: employeeId }, { $set: updateQuery });

        if (req.action === 'sendEmployeeDeviceRegistration') {
            const retail = await Retail.findOne({ _id: req.user.retailId }).select('name tin address').exec();
            // dont wait for email to be sent
            try {
                sendMailEmployeeDeviceRegistration(employee.email, { employee, retail, tokenId });
            } catch (error) {
                console.log(error)
            }
        }

        res.json({
            success: true,
            msg: tokenId,
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_registers_not_found', 404));
    }
}


const getEmployeeById = async (id, retailId) => {
    if (!id) {
        return null;
    }
    return await Employee.findOne({ _id: id, retailId });
};

const getEmployee = async (req, res, next) => {
    try {
        const employee = await getEmployeeById(req.params.id, req.user.retailId);
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        if (employee.registrationToken) {
            const registration = await Registration.findOne({ tokenId: employee.registrationToken });
            if (!registration) {
                employee.registrationToken = '';
                await Employee.findOneAndUpdate({ _id: employee._id }, { registrationToken: '' });
            }
        }
        return res.status(200).json({ success: true, msg: employee });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_not_found', 404));
    }
};

const getEmployeeWorkingAt = async (req, res, next) => {
    try {
        const employee = await getEmployeeById(req.params.id, req.user.retailId);
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        const workingAts = await WorkingAt.find({ employeeId: employee._id });
        return res.status(200).json({ success: true, msg: workingAts });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_working_at_not_found', 404));
    }
}

const createEmployee = async (req, res, next) => {
    try {
        const foundEmployee = await Employee.findOne({ email: req.body.email, retailId: req.user.retailId });
        if (foundEmployee) {
            throw new HttpError('srv_employee_exists', 409);
        }
        const newEmployee = new Employee({ ...req.body, retailId: req.user.retailId });
        await newEmployee.save();
        return res.status(201).json({ success: true, msg: newEmployee });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_creation_failed', 400));
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            { _id: req.body._id, retailId: req.user.retailId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedEmployee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: updatedEmployee });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_update_failed', 400));
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const deletedEmployee = await Employee.findOneAndDelete({ _id: req.params.id, retailId: req.user.retailId });
        if (!deletedEmployee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: 'srv_employee_deleted' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_deletion_failed', 400));
    }
};

module.exports = {
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeWorkingAt,
    employeeRegistration
};
