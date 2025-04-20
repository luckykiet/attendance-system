const Employee = require("../../models/Employee");
const Registration = require("../../models/Registration");
const utils = require("../../utils");

const cancelDevicePairing = async (req, res, next) => {
    try {
        const { retailId } = req.body;
        const registration = await Registration.findOne({ employeeId: req.employee._id, retailId });

        const updateQuery = { deviceId: '', publicKey: '' }

        if (registration && !registration.isDemo) {
            updateQuery.registrationToken = '';
            await Registration.deleteOne({ employeeId: req.employee._id, retailId: retailId });
        }

        await Employee.findOneAndUpdate({ _id: req.employee._id, retailId }, { $set: updateQuery }, { new: true });

        return res.status(200).json({ success: true, msg: 'srv_employee_device_pairing_canceled' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_device_pairing_cancellation_failed', 400));
    }
};

module.exports = {
    cancelDevicePairing
};