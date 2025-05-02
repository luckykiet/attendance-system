const User = require('../../models/User');
const Retail = require('../../models/Retail');
const HttpError = require('../../constants/http-error');
const utils = require('../../utils');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mailSender = require('../../mail_sender');
const { CONFIG } = require('../../configs');
const urlJoin = require('proper-url-join');

const signupLogger = utils.getLogger('signup');
const authLogger = utils.getLogger('auth');
const passwordResetLogger = utils.getLogger('passwordreset');

const signup = async (req, res, next) => {
    let newRetailId = null;
    let newUserId = null;
    try {
        // eslint-disable-next-line no-unused-vars
        const { password, confirmPassword, recaptcha, ...logData } = req.body;
        const { username, email, name, tin, vin, address } = logData;

        signupLogger.info(`Signup attempt`, logData);

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            if (existingUser.username === username) {
                throw new HttpError('srv_username_exists', 409, 'Username exists', 'signup');
            }
            if (existingUser.email === email) {
                throw new HttpError('srv_email_exists', 409, 'Email exists', 'signup');
            }
            throw new HttpError('srv_user_exists', 409, 'User exists', 'signup');
        }

        const existingRetail = await Retail.findOne({ tin });

        if (existingRetail) {
            throw new HttpError('srv_retail_exists', 409, 'Retail exists', 'signup');
        }

        let userAddress = address || {
            street: '',
            city: '',
            zip: '',
        };

        if (!address || !address.street || !address.city || !address.zip) {
            try {
                const aresData = await utils.fetchAresWithTin(tin);
                if (aresData) {
                    userAddress = {
                        street: aresData.address.street,
                        city: aresData.address.city,
                        zip: aresData.address.zip,
                    };
                } else {
                    signupLogger.info(`No ARES data found`);
                }
            } catch (error) {
                signupLogger.error(`Error fetching ARES data: ${error.message}`);
            }
        }

        const newRetail = new Retail({
            tin,
            vin,
            name,
            address: userAddress,
            registerIds: [],
        });
        await newRetail.save();
        newRetailId = newRetail._id;

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            name,
            role: 'Admin',
            retailId: newRetail._id,
        });
        await newUser.save();
        newUserId = newUser._id;

        signupLogger.info(`User created`, { userId: newUserId });
        signupLogger.info(`Retail created`, { retailId: newRetailId });

        req.body.password = Buffer.from(password).toString('base64');
        passport.authenticate('local', (err, user, options) => {
            if (err) {
                return next(new HttpError('srv_failed_to_login', 500, 'Authentication error', 'signup'));
            }

            if (!user) {
                return next(new HttpError(options?.message || 'srv_failed_to_login', 401, 'Authentication failed', 'signup'));
            }

            req.login(user, (error) => {
                if (error) {
                    return next(new HttpError('srv_failed_to_login', 500, 'Failed to login', 'signup'));
                }
                signupLogger.info(`Logged in`, { username: user.username });
                return res.json(req.user);
            });
        })(req, res, next);
    } catch (error) {
        try {
            if (newRetailId) {
                await Retail.findByIdAndDelete(newRetailId);
                signupLogger.info(`Rolled back retail creation`, { retailId: newRetailId });
            }
            if (newUserId) {
                await User.findByIdAndDelete(newUserId);
                signupLogger.info(`Rolled back user creation`, { userId: newUserId });
            }
        } catch (rollbackError) {
            signupLogger.error(`Rollback failed: ${rollbackError.message}`);
        }

        return next(utils.parseExpressErrors(error, 'srv_signup_failed', 500));
    }
};

const login = (req, res, next) => {
    passport.authenticate('local', (err, user, options) => {
        if (err) {
            return next(new HttpError('srv_failed_to_login', 500, 'Authentication error', 'auth'));
        }

        if (!user) {
            return next(new HttpError(options?.message || 'srv_failed_to_login', 401, 'User not found', 'auth'));
        }

        req.login(user, (error) => {
            if (error) {
                return next(new HttpError('srv_failed_to_login', 500, 'Failed to login', 'auth'));
            }
            authLogger.info(`Logged in`, { username: user.username });
            return res.json(req.user);
        });
    })(req, res, next);
};

const signout = (req, res, next) => {
    if (!req.user) {
        authLogger.info(`Sign out attempt without user`);
        return res.status(200).json({
            success: true,
            msg: `srv_signed_out`,
        });
    }
    authLogger.info(`Signing out`, { username: req.user.username });
    req.logout((err) => {
        if (err) {
            authLogger.error(`Sign out failed: ${err.message}`);
            return next(err);
        }

        req.session.destroy(() => {
            authLogger.info(`Signed out`);
            return res.status(200).json({
                success: true,
                msg: `srv_signed_out`,
            });
        });
    });
};

const passwordResetTokenVerifyMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new HttpError('srv_token_not_provided', 400, 'Token not provided', 'passwordreset');
        }

        passwordResetLogger.info('Verifying password reset token', { token });

        try {
            const decoded = jwt.verify(token, CONFIG.jwtSecret);
            req.email = decoded.email;
            const user = await User.findOne({
                email: decoded.email,
                tokens: token,
            });
            if (!user) {
                throw new HttpError('srv_token_expired', 400, 'User not found', 'passwordreset');
            }
        } catch {
            throw new HttpError('srv_token_expired', 400, 'Token expired', 'passwordreset');
        }

        passwordResetLogger.info('Token verified');
        next();
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_token_expired', 500));
    }
};

const sendRequestRenewPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        authLogger.info(`Password reset request`, { email });

        const user = await User.findOne({ email });

        if (!user) {
            authLogger.info(`User not found`);
            return res.status(200).json({ success: true, msg: 'srv_password_reset_send_to_email' });
        }

        const token = utils.signItemToken({ email }, '15m');

        await User.findByIdAndUpdate(user._id, { $push: { tokens: token } }, { new: true });

        if (!CONFIG.isTest) {
            mailSender.sendMailResetPassword(
                email,
                user.username,
                urlJoin(CONFIG.url, 'reset-password', token),
            );
        }

        authLogger.info(`Password reset email sent`, { token });

        return res.status(200).json({
            success: true,
            msg: 'srv_password_reset_send_to_email',
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_password_reset_failed', 500));
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const email = req.email;
        const body = req.body;

        authLogger.info(`Password update attempt`, { email });

        if (!body || !body.newPassword || !body.confirmNewPassword) {
            throw new HttpError('srv_invalid_request', 400, 'Invalid request', 'passwordreset');
        }

        if (body.newPassword !== body.confirmNewPassword) {
            throw new HttpError('srv_passwords_not_match', 400, 'Passwords do not match', 'passwordreset');
        }

        const user = await User.findOne({ email: email });

        if (!user) {
            throw new HttpError('srv_user_not_found', 404, 'User not found', 'passwordreset');
        }
        const hashedPassword = await bcrypt.hash(body.newPassword, 12);
        user.password = hashedPassword;
        user.tokens = [];
        await user.save();

        authLogger.info(`Password updated`);

        return res.status(200).json({
            success: true,
            msg: 'srv_passwords_changed',
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_password_reset_failed', 500));
    }
};

const checkIsAuthenticated = (req, res, next) => {
    try {
        if (!req.isAuthenticated()) {
            return res.json({ isAuthenticated: false });
        }
        return res.json({
            isAuthenticated: true,
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            retailId: req.user.registerId,
        });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_unexpected_error', 500));
    }
};

module.exports = { signup, login, signout, passwordResetTokenVerifyMiddleware, sendRequestRenewPassword, updatePassword, checkIsAuthenticated };
