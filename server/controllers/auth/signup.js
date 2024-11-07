const User = require('../../models/User');
const Retail = require('../../models/Retail');
const HttpError = require('../../constants/http-error');
const utils = require('../../utils');
const passport = require('passport');
const bcrypt = require('bcryptjs');

const signup = async (req, res, next) => {
    let newRetailId = null;
    let newUserId = null;

    try {
        const { username, email, password, tin, name, vin, address } = req.body;

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            throw new HttpError('srv_user_exists', 409);
        }

        const existingRetail = await Retail.findOne({ tin });
        if (existingRetail) {
            throw new HttpError('srv_retail_exists', 409);
        }

        let userAddress = address;
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
        next(error instanceof HttpError ? error : new HttpError('srv_unexpected_error', 500));
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

module.exports = { signup, login, signout };
