const bcrypt = require('bcryptjs');
const HttpError = require('../../constants/http-error');
const User = require('../../models/User');
const utils = require('../../utils');


const getUser = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.params.id, retailId: req.user.retailId }).select('-password');
        if (!user) {
            throw new HttpError('srv_user_not_found', 404);
        }

        return res.status(200).json({ success: true, msg: user });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_user_not_found', 404));
    }
};

const createUser = async (req, res, next) => {
    try {
        const foundUser = await User.findOne({
            $or: [{ email: req.body.email, }, { username: req.body.username }],
            retailId: req.user.retailId
        });
        if (foundUser) {
            if (foundUser.email === req.body.email) {
                throw new HttpError('srv_email_exists', 409);
            } else if (foundUser.username === req.body.username) {
                throw new HttpError('srv_username_exists', 409);
            }
            throw new HttpError('srv_user_exists', 409);
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const newUser = new User({ ...req.body, password: hashedPassword, retailId: req.user.retailId });
        await newUser.save();
        return res.status(201).json({ success: true, msg: newUser });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_user_creation_failed', 400));
    }
};

const updateUser = async (req, res, next) => {
    try {
        if (req.body.password) {
            delete req.body.password;
        }
        const foundUser = await User.findOne({ _id: req.body._id, retailId: req.user.retailId });
        if (!foundUser) {
            throw new HttpError('srv_user_not_found', 404);
        }
        if (req.body.role) {
            if (foundUser._id.equals(req.user._id) && req.body.role !== foundUser.role) {
                throw new HttpError('srv_user_cannot_change_own_role', 400);
            }
            if (foundUser.role === 'Admin' && req.body.role !== 'Admin') {
                throw new HttpError('srv_user_cannot_change_admin_role', 400);
            }
        }
        if (req.body.isAvailable !== undefined) {
            if (foundUser._id.equals(req.user._id) && req.body.isAvailable !== foundUser.isAvailable) {
                throw new HttpError('srv_user_cannot_change_own_status', 400);
            }
        }
        if (req.body.email && req.body.email !== foundUser.email) {
            const existsUser = await User.findOne({ email: req.body.email });
            if (existsUser) {
                throw new HttpError('srv_user_exists', 409);
            }
        }

        if (req.body.username && req.body.username !== foundUser.username) {
            const existsUser = await User.findOne({ username: req.body.username });
            if (existsUser) {
                throw new HttpError('srv_user_exists', 409);
            }
        }
        const updatedUser = await User.findOneAndUpdate(
            { _id: req.body._id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        return res.status(200).json({ success: true, msg: updatedUser });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_user_update_failed', 400));
    }
};

const deleteUser = async (req, res, next) => {
    try {
        if (req.params.id === req.user.id) {
            throw new HttpError('srv_user_cannot_delete_self', 400);
        }
        const user = await User.findOne({ _id: req.params.id, retailId: req.user.retailId });
        if (!user) {
            throw new HttpError('srv_user_not_found', 404);
        }
        if (user.role === 'Admin') {
            throw new HttpError('srv_user_cannot_delete_admin', 400);
        }
        const deletedUser = await User.findOneAndDelete({ _id: req.params.id, retailId: req.user.retailId });
        if (!deletedUser) {
            throw new HttpError('srv_user_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: 'srv_user_deleted' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_user_deletion_failed', 400));
    }
};

module.exports = {
    getUser,
    createUser,
    updateUser,
    deleteUser,
};
