//@ts-check
const { auth, cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);
    app.use(apiPrefix, require('./public'));
    app.use(apiPrefix + '/locale', require('./locale'));
    app.use(apiPrefix + '/ares', require('./ares'));
    app.use(apiPrefix + '/local-device', require('./local-device'));

    app.use(apiPrefix, auth.ensureDeviceId);
    app.use(apiPrefix + '/registration', require('./registration'));
    app.use(apiPrefix + '/workplaces', require('./workplaces'));
    app.use(apiPrefix + '/attendance', require('./attendance'));
    app.use(apiPrefix + '/attendances', require('./attendances'));
};
