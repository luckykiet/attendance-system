const HttpError = require('../constants/http-error')

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        next(new HttpError(`srv_unauthorized`, 401))
    }
}

const ensureDeviceId = (req, res, next) => {
    const appId = req.get('App-Id');
    if (appId) {
        req.deviceId = appId;
        next();
    } else {
        next(new HttpError(`srv_unauthorized`, 401));
    }
};

module.exports = {
    ensureAuthenticated,
    ensureDeviceId
}