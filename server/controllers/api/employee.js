const Employee = require("../../models/Employee");
const Registration = require("../../models/Registration");
const utils = require("../../utils");

const cancelDevicePairing = async (req, res, next) => {
    try {
        const { retailId } = req.body;

        const updatedEmployee = await Employee.findOneAndUpdate({ _id: req.employee._id, retailId }, { $set: { deviceId: '', registrationToken: '', publicKey: '' } }, { new: true });

        await Registration.deleteOne({ employeeId: updatedEmployee._id, retailId: retailId });
        return res.status(200).json({ success: true, msg: 'srv_employee_device_pairing_canceled' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_device_pairing_cancellation_failed', 400));
    }
};

module.exports = {
    cancelDevicePairing
};