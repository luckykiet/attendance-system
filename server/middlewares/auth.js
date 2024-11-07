const HttpError = require('../constants/http-error')

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        next(new HttpError(`srv_unauthorized`, 401))
    }
}

module.exports = {
    ensureAuthenticated
}