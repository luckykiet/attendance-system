//@ts-check
const { auth, cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);
    app.use(apiPrefix, require('./public'));
    app.use(apiPrefix + '/ares', require('./ares'));
    app.use(apiPrefix + '/attendance', require('./attendance'));

    app.use(apiPrefix, auth.ensureAuthenticated);
};
