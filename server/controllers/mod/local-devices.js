const HttpError = require('../../constants/http-error');
const LocalDevice = require('../../models/LocalDevice');
const Register = require('../../models/Register');
const utils = require('../../utils/utils');
const geolib = require('geolib');

const getLocalDevices = async (req, res, next) => {
    try {
        const { registerId } = req.params;

        const register = await Register.findOne({ _id: registerId, retailId: req.user.retailId });
        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }

        const localDevices = await LocalDevice.find({ registerId });

        const newLocalDevices = localDevices.map((device) => {
            const distance = geolib.getDistance(
                {
                    latitude: register.location.coordinates[1],
                    longitude: register.location.coordinates[0],
                },
                {
                    latitude: device.location.latitude,
                    longitude: device.location.longitude,
                }
            );

            return {
                ...device.toObject(),
                distance,
            };
        });

        return res.status(200).json({ success: true, msg: newLocalDevices });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employees_not_found', 404));
    }
};

module.exports = {
    getLocalDevices,
};
