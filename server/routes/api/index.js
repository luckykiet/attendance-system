//@ts-check
const { auth, cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);
    app.use(apiPrefix, require('./public'));
    app.use(apiPrefix + '/ares', require('./ares'));

    app.use(apiPrefix, auth.ensureDeviceId);
    app.use(apiPrefix + '/nearby-companies', require('./nearby-companies'));
    app.use(apiPrefix + '/attendance', require('./attendance'));

};
