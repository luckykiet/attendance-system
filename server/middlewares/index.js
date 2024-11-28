const auth = require('./auth');
const cache = require('./cache');
const ipAddress = require('./ip-address');
const recaptcha = require('./recaptcha');
const validation = require('./validation');
const privileges = require('./privileges');

module.exports = {
    auth,
    cache,
    ipAddress,
    recaptcha,
    validation,
    privileges
}