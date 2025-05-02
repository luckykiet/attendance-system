const { body } = require('express-validator');
const utils = require('../utils');

const SignUpValidation = [
    body('username')
        .trim().toLowerCase()
        .notEmpty({ ignore_whitespace: true }).withMessage('srv_username_required')
        .bail()
        .isLength({ min: 6, max: 255 }).withMessage('srv_username_length')
        .bail()
        .matches(utils.regex.username).withMessage('srv_invalid_username')
        .bail(),

    body('email')
        .trim().toLowerCase()
        .notEmpty().withMessage('srv_email_required').bail()
        .isEmail().withMessage('srv_invalid_email').bail(),

    body('tin')
        .trim()
        .notEmpty().withMessage('srv_tin_required').bail()
        .matches(utils.regex.simpleTinRegex).withMessage('srv_invalid_tin').bail(),

    body('name')
        .trim()
        .notEmpty().withMessage('srv_name_required').bail()
        .isLength({ max: 255 }).withMessage('srv_name_length').bail(),

    body('vin')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('srv_invalid_vin').bail(),

    body('address.street')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('srv_street_length').bail(),

    body('address.city')
        .optional()
        .trim()
        .isLength({ max: 255 }).withMessage('srv_city_length').bail(),

    body('address.zip')
        .optional()
        .trim()
        .isLength({ max: 20 }).withMessage('srv_invalid_zip').bail(),

    body('password')
        .notEmpty({ ignore_whitespace: true }).withMessage('srv_password_required')
        .isString()
        .isLength({ min: 8, max: 255 }).withMessage('srv_password_length').bail(),

    body('confirmPassword')
        .notEmpty().withMessage('srv_confirm_password_required').bail()
        .custom((confirmPassword, { req }) => confirmPassword === req.body.password)
        .withMessage('srv_passwords_not_match').bail(),
]

const ForgotPasswordValidation = [
    body('email')
        .trim().toLowerCase()
        .notEmpty({ ignore_whitespace: true }).withMessage('srv_email_required').bail()
        .isEmail().withMessage('srv_invalid_email').bail(),
]

const LoginValidation = [
    body('username').notEmpty({ ignore_whitespace: true }).bail(),
    body('password').notEmpty().bail(),
];

module.exports = {
    SignUpValidation,
    LoginValidation,
    ForgotPasswordValidation
}