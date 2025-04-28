const Registration = require('../../models/Registration');
const HttpError = require("../../constants/http-error");
const Employee = require('../../models/Employee');
const Retail = require('../../models/Retail');
const utils = require('../../utils');
const dayjs = require('dayjs');

const getRegistration = async (req, res, next) => {
    try {
        const { tokenId } = req.params;
        const registration = await Registration.findOne({ tokenId });

        if (!registration) {
            throw new HttpError('srv_registration_not_found', 404);
        }

        if (!registration.isDemo && dayjs().isAfter(dayjs(registration.createdAt).add(15, 'minute'))) {
            await Registration.deleteOne({ _id: registration._id });
            throw new HttpError('srv_registration_not_found', 400);
        }

        const registeredDevice = await Employee.findOne({ retailId: registration.retailId, deviceId: req.deviceId });

        if (registeredDevice) {
            throw new HttpError('srv_device_already_registered', 400);
        }

        const employee = await Employee.findOne({ _id: registration.employeeId }).select('name email phone -_id');
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }

        const retail = await Retail.findOne({ _id: registration.retailId }).select('name tin address -_id');
        if (!retail) {
            throw new HttpError('srv_retail_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: { tokenId, employee, retail } });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_registration', 500));
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

        if (!registration.isDemo && dayjs().isAfter(dayjs(registration.createdAt).add(15, 'minute'))) {
            await Registration.deleteOne({ _id: registration._id });
            throw new HttpError('srv_registration_not_found', 400);
        }

        const registeredDevice = await Employee.findOne({ retailId: registration.retailId, deviceId: req.deviceId });

        if (registeredDevice) {
            throw new HttpError('srv_device_already_registered', 400);
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
                registrationToken: registration.isDemo ? registration.tokenId : '',
                registeredAt: dayjs().toDate(),
            }
        });

        await Registration.deleteOne({ _id: registration._id, isDemo: false });

        return res.status(200).json({ success: true, msg: 'srv_device_registered' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_registration', 500));
    }
};

module.exports = {
    getRegistration,
    submitRegistration
};
