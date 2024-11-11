const express = require('express');
const router = express.Router()
const HttpError = require('../../constants/http-error');
const { checkReCaptcha } = require('../../middlewares/recaptcha');
const { validate } = require('../../middlewares/validation');
const { body } = require('express-validator')
const utils = require('../../utils/utils');
const { signup, signout, login, passwordResetTokenVerifyMiddleware, sendRequestRenewPassword, updatePassword } = require('../../controllers/auth/auth');

router.post('/isAuthenticated', (req, res, next) => {
    try {
        if (!req.isAuthenticated()) {
            return res.json({ isAuthenticated: false });
        }
        return res.json({
            isAuthenticated: true,
            username: req.user.username,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            retailId: req.user.registerId,
        });
    } catch (error) {
        return next(error instanceof Error ? error.message : new HttpError('srv_unexpected_error', 500))
    }
});

router.post(
    '/login',
    checkReCaptcha,
    validate([
        body('username').notEmpty({ ignore_whitespace: true }),
        body('password').notEmpty(),
    ]),
    login
)

router.post('/signout', signout)

router.post(
    '/signup',
    checkReCaptcha,
    validate([
        body('username')
            .trim()
            .notEmpty({ ignore_whitespace: true }).withMessage('srv_username_required')
            .bail()
            .isLength({ min: 4, max: 255 }).withMessage('srv_invalid_username_length')
            .bail()
            .matches(utils.regex.username).withMessage('srv_invalid_username')
            .bail(),

        body('email')
            .trim()
            .notEmpty().withMessage('srv_email_required').bail()
            .isEmail().withMessage('srv_invalid_email').bail(),

        body('tin')
            .trim()
            .notEmpty().withMessage('srv_tin_required').bail()
            .matches(utils.regex.simpleTinRegex).withMessage('srv_invalid_tin').bail(),

        body('name')
            .trim()
            .notEmpty().withMessage('srv_name_required').bail()
            .isLength({ max: 255 }).withMessage('srv_invalid_name_length').bail(),

        body('vin')
            .optional()
            .trim()
            .isLength({ max: 255 }).withMessage('srv_invalid_vin').bail(),

        body('address.street')
            .optional()
            .trim()
            .isLength({ max: 255 }).withMessage('srv_invalid_street_length').bail(),

        body('address.city')
            .optional()
            .trim()
            .isLength({ max: 255 }).withMessage('srv_invalid_city_length').bail(),

        body('address.zip')
            .optional()
            .trim()
            .isLength({ max: 20 }).withMessage('srv_invalid_zip_length').bail(),

        body('password')
            .notEmpty({ ignore_whitespace: true }).withMessage('srv_password_required')
            .isString()
            .isLength({ min: 8, max: 255 }).withMessage('srv_invalid_password_length').bail(),

        body('confirmPassword')
            .notEmpty().withMessage('srv_confirm_password_required').bail()
            .custom((confirmPassword, { req }) => confirmPassword === req.body.password)
            .withMessage('srv_passwords_not_match').bail(),
    ]),
    signup
);

router.post('/forgot-password', sendRequestRenewPassword)

router.put('/reset-password', passwordResetTokenVerifyMiddleware, updatePassword)

router.get('/forgot-password', passwordResetTokenVerifyMiddleware,
    (req, res) => {
        res.status(200).json({ success: true, msg: { email: req.email } })
    }
)

module.exports = router