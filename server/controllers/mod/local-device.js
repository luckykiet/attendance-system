const HttpError = require('../../constants/http-error');
const utils = require('../../utils');
const LocalDevice = require('../../models/LocalDevice');
const Register = require('../../models/Register');

const deleteLocalDevice = async (req, res, next) => {
    try {
        const localDevice = await LocalDevice.findOne({ deviceId: req.params.localDeviceId });
        if (!localDevice) {
            throw new HttpError('srv_local_device_not_found', 404);
        }
        const register = await Register.findOne({ _id: localDevice.registerId, retailId: req.user.retailId });
        if (!register) {
            throw new HttpError('srv_local_device_not_found', 404);
        }
        await LocalDevice.findOneAndDelete({ _id: localDevice._id });
        return res.status(200).json({ success: true, msg: 'srv_local_device_deleted' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_local_device_deletion_failed', 400));
    }
};

module.exports = {
    deleteLocalDevice,
};
