//@ts-check
const { auth, cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);

    app.use(apiPrefix + '/auth', require('../auth/auth'));

    app.use(apiPrefix, auth.ensureAuthenticated);
    app.use(apiPrefix + '/registration', require('./registration'));
    app.use(apiPrefix + '/retail', require('./retail'));
    app.use(apiPrefix + '/register', require('./register'));
    app.use(apiPrefix + '/registers', require('./registers'));
};
