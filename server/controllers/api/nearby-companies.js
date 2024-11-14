const Register = require('../../models/register');
const HttpError = require("../../constants/http-error");
const utils = require('../../utils');

const getNearbyCompanies = async (req, res, next) => {
    try {
        const { longitude, latitude } = req.body;

        if (!longitude || !latitude) {
            throw new HttpError('srv_missing_coordinates', 400);
        }

        const maxDistance = 500;

        const nearbyRegisters = await Register.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: maxDistance
                }
            }
        }).select('name workingHours location');

        const leanNearbyRegisters = nearbyRegisters.map(register => {
            const registerObj = register.toObject();
            delete registerObj.id;
            const regLongitude = registerObj.location.longitude;
            const regLatitude = registerObj.location.latitude;
            registerObj.distanceInMeters = utils.calculateDistance(regLatitude, regLongitude, latitude, longitude);
            return registerObj;
        });

        leanNearbyRegisters.sort((a, b) => a.distanceInMeters - b.distanceInMeters);

        return res.status(200).json({ success: true, msg: leanNearbyRegisters });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_companies', 500));
    }
};

module.exports = {
    getNearbyCompanies
};
