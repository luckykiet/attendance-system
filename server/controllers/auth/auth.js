const User = require('../../models/User');
const Retail = require('../../models/Retail');
const HttpError = require('../../constants/http-error');
const utils = require('../../utils');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { CONFIG } = require('../../configs');
const mailSender = require('../../mail_sender');

const signup = async (req, res, next) => {
    let newRetailId = null;
    let newUserId = null;

    try {
        const { username, email, password, tin, name, vin, address } = req.body;

        const existingUserWithUsername = await User.findOne({ username });
        if (existingUserWithUsername) {
            throw new HttpError('srv_user_exists', 409);
        }

        const existingUserWithEmail = await User.findOne({ email });
        if (existingUserWithEmail) {
            throw new HttpError('srv_email_registered_exists', 409);
        }

        const existingRetail = await Retail.findOne({ tin });
        if (existingRetail) {
            throw new HttpError('srv_retail_exists', 409);
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
                }
            } catch (error) {
                console.log(error);
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

        req.body.password = Buffer.from(password).toString('base64');
        passport.authenticate('local', (err, user, options) => {
            if (user) {
                req.login(user, (error) => {
                    if (error) {
                        console.log(error);
                        return next(new HttpError(`srv_failed_to_login`, 500));
                    }
                    return res.json(req.user);
                });
            } else {
                return next(new HttpError(options.message, 401));
            }
        })(req, res, next);
    } catch (error) {
        console.log(error);
        try {
            if (newRetailId) {
                await Retail.findByIdAndDelete(newRetailId);
            }
            if (newUserId) {
                await User.findByIdAndDelete(newUserId);
            }
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        return next(utils.parseExpressErrors(error, 'srv_signup_failed', 500));
    }
};

const login = (req, res, next) => {
    passport.authenticate('local', (err, user, options) => {
        if (user) {
            req.login(user, (error) => {
                if (error) {
                    console.log(error)
                    return next(new HttpError(`srv_failed_to_login`, 500))
                } else {
                    return res.json(req.user)
                }
            })
        } else {
            return next(new HttpError(options.message, 401))
        }
    })(req, res, next)
}

const signout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err)
        }

        req.session.destroy(() => {
            console.log(`srv_signed_out`)
            return res.status(200).json({
                success: true,
                msg: `srv_signed_out`,
            })
        })
    })
}

const passwordResetTokenVerifyMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            return res
                .status(400)
                .json({ success: false, message: 'srv_invalid_request' })
        }

        try {
            const decoded = jwt.verify(token, CONFIG.jwtSecret)
            req.email = decoded.email
            const user = await User.findOne({
                email: decoded.email,
                tokens: token,
            })
            if (!user) {
                throw new HttpError('srv_token_expired', 400)
            }
        } catch {
            throw new HttpError('srv_token_expired', 401)
        }

        next()
    } catch (err) {
        return next(err instanceof HttpError ? err : new HttpError('srv_error', 500))
    }
}

const sendRequestRenewPassword = async (req, res, next) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email: email })
        if (!user) {
            return res.status(200)
                .json({ success: true, msg: 'srv_password_reset_send_to_email' })
        }
        const token = utils.signItemToken({ email }, '15m')
        await User.findByIdAndUpdate(user._id, { $push: { tokens: token } }, { new: true })
        mailSender.sendMailResetPassword(
            email,
            user.username,
            `${CONFIG.protocol}${CONFIG.admin_domain}/reset-password/${token}`
        )

        return res.status(200).json({
            success: true,
            msg: 'srv_password_reset_send_to_email',
        })
    } catch (error) {
        console.log(error)
        next(new HttpError('srv_password_reset_failed', 500))
    }
}

const updatePassword = async (req, res, next) => {
    try {
        const email = req.email
        const body = req.body
        if (!body || !body.newPassword || !body.confirmNewPassword) {
            return next(new HttpError('srv_invalid_request', 400))
        }

        if (body.newPassword !== body.confirmNewPassword) {
            return next(new HttpError('srv_passwords_not_match', 400))
        }

        const user = await User.findOne({ email: email })

        if (!user) {
            return next(new HttpError('srv_user_not_exists', 404))
        }
        const hashedPassword = await bcrypt.hash(body.newPassword, 10)
        user.password = hashedPassword
        user.tokens = []
        await user.save()
        return res.status(200).json({
            success: true,
            msg: 'srv_passwords_changed',
        })
    } catch (err) {
        next(err)
    }
}


module.exports = { signup, login, signout, passwordResetTokenVerifyMiddleware, sendRequestRenewPassword, updatePassword };
