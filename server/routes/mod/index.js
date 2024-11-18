//@ts-check
const { auth, cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);

    app.use(apiPrefix + '/auth', require('../auth/auth'));

    app.use(apiPrefix, auth.ensureAuthenticated);
    app.use(apiPrefix + '/retail', require('./retail'));
    app.use(apiPrefix + '/register', require('./register'));
    app.use(apiPrefix + '/registers', require('./registers'));
    app.use(apiPrefix + '/employee', require('./employee'));
    app.use(apiPrefix + '/employees', require('./employees'));
    app.use(apiPrefix + '/working-at', require('./working-at'));
    app.use(apiPrefix + '/working-ats', require('./working-ats'));
    app.use(apiPrefix + '/attendances', require('./attendances'));
};
