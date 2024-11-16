const Registration = require('../../models/Registration');
const HttpError = require("../../constants/http-error");
const Employee = require('../../models/Employee');
const Retail = require('../../models/Retail');
const utils = require('../../utils');

const getRegistration = async (req, res, next) => {
    try {
        const { tokenId } = req.params;
        const registration = await Registration.findOne({ tokenId });

        if (!registration) {
            throw new HttpError('srv_registration_not_found', 404);
        }

        const employee = await Employee.findOne({ _id: registration.employeeId }).select('name email phone -_id');
        const retail = await Retail.findOne({ _id: registration.retailId }).select('name tin address -_id');

        return res.status(200).json({ success: true, msg: { tokenId, employee, retail } });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_registrationƒ', 500));
    }
};

const submitRegistration = async (req, res, next) => {
    try {
        const { tokenId, form } = req.body;
        const { deviceId } = req;
        const registration = await Registration.findOne({ tokenId });

        if (!registration) {
            throw new HttpError('srv_registration_not_found', 404);
        }

        const employee = await Employee.findOne({ _id: registration.employeeId, retailId: registration.retailId });

        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }

        await Employee.updateOne({ _id: employee._id }, {
            $set: {
                deviceId,
                publicKey: form.publicKey,
                name: form.name,
                email: form.email,
                phone: form.phone,
                registrationToken: '',
            }
        });

        await Registration.deleteOne({_id: registration._id});

        return res.status(200).json({ success: true, msg: 'srv_device_registered' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_registrationƒ', 500));
    }
};

module.exports = {
    getRegistration,
    submitRegistration
};
