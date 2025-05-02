const express = require('express');
const router = express.Router()
const { recaptcha } = require('../../middlewares');
const { validate } = require('../../middlewares/validation');
const { signup, signout, login, passwordResetTokenVerifyMiddleware, sendRequestRenewPassword, updatePassword, checkIsAuthenticated, getVerifiedForgotPasswordEmail } = require('../../controllers/auth/auth');
const { SignUpValidation, ForgotPasswordValidation, LoginValidation } = require('../../validation/auth');

router.post('/isAuthenticated', checkIsAuthenticated);

router.post('/login', recaptcha.checkReCaptcha, validate(LoginValidation), login)

router.post('/signout', signout)

router.post('/signup', recaptcha.checkReCaptcha, validate(SignUpValidation), signup);

router.post('/forgot-password', validate(ForgotPasswordValidation), sendRequestRenewPassword)

router.put('/reset-password', passwordResetTokenVerifyMiddleware, updatePassword)

router.get('/forgot-password', passwordResetTokenVerifyMiddleware, getVerifiedForgotPasswordEmail)

module.exports = router