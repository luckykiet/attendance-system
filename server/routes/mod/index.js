//@ts-check
const { auth, cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);
    
    app.use(apiPrefix + '/auth', require('../auth/auth'));
    
    app.use(apiPrefix, auth.ensureAuthenticated);
    app.use(apiPrefix + '/registration', require('./registration'));
};
