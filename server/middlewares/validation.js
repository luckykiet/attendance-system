const { validationResult } = require('express-validator')
const HttpError = require('../constants/http-error')

const validate = (validations, message) => {
    return async (req, res, next) => {
        for (let validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length) break;
        }

        const errors = validationResult(req);

        if (errors.isEmpty()) {
            return next();
        }

        const customErrors = errors.array().map((e) => {
            if (typeof e.msg === 'object' && e.msg.field && e.msg.message) {
                return { [e.msg.field]: e.msg.message };
            }

            return { [e.path]: e.msg };
        });

        return next(new HttpError({ msg: message, errors: customErrors }, 400));
    };
};

module.exports = { validate }