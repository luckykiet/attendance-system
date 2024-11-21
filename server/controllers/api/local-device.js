const utils = require('../../utils');
const Register = require('../../models/Register');
const LocalDevice = require('../../models/LocalDevice');
// const geolib = require('geolib');
const HttpError = require('../../constants/http-error');
const crypto = require('crypto');

const registerLocalDevice = async (req, res, next) => {
    try {
        const { deviceId, registerId, location } = req.body;
        if (!deviceId || !registerId || !location || !location.latitude || !location.longitude) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const localDevice = await LocalDevice.findOne({ deviceId: deviceId }).exec();
        if (localDevice) {
            throw new HttpError('srv_device_already_registered', 409);
        }

        const register = await Register.findOne({ _id: registerId }).exec();
        if (!register) {
            throw new HttpError('srv_register_not_found', 400);
        }

        if (!register.maxLocalDevices || register.maxLocalDevices <= 0) {
            throw new HttpError('srv_max_local_devices_reached', 400);
        }

        // const distanceInMeters = geolib.getDistance(location, { latitude: register.location.coordinates[1], longitude: register.location.coordinates[0] });

        // if (distanceInMeters > register.location.allowedRadius) {
        //     throw new HttpError('srv_outside_allowed_radius', 400);
        // }
        const uuid = crypto.randomUUID();
        const newLocalDevice = await new LocalDevice({
            deviceId,
            registerId,
            location,
            uuid
        }).save();

        return res.status(200).json({
            success: true,
            msg: { ...newLocalDevice.toObject() }
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_register_local_device', 500));
    }
}

const unregisterLocalDevice = async (req, res, next) => {
    try {
        const { deviceId, registerId, uuid } = req.body;
        if (!deviceId) {
            throw new HttpError('srv_invalid_request', 400);
        }

        const localDevice = await LocalDevice.findOne({ deviceId, registerId, uuid }).exec();
        
        if (!localDevice) {
            throw new HttpError('srv_device_not_found', 404);
        }

        await LocalDevice.findOneAndDelete({ _id: localDevice._id }).exec();

        return res.status(200).json({
            success: true,
            msg: 'srv_device_unregistered'
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_unregister_local_device', 500));
    }
}

module.exports = { registerLocalDevice, unregisterLocalDevice };