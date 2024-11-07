//@ts-check
const { cache } = require('../../middlewares');

module.exports = function (app, apiPrefix) {
    app.use(apiPrefix, cache.noCache);
    app.use(apiPrefix, require('./auth'));
};
