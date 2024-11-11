const HttpError = require('../../constants/http-error');
const Register = require('../../models/Register');

const getRegisterById = async (id, retailId) => {
    if (!id) {
        return null;
    }
    return await Register.findOne({ _id: id, retailId });
};

const getRegister = async (req, res, next) => {
    try {
        const register = await getRegisterById(req.params.id, req.user.retailId);
        if (!register) {
            throw new HttpError('srv_register_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: register });
    } catch (error) {
        return next(error instanceof HttpError ? error : new HttpError('srv_register_not_found', 404));
    }
};

const createRegister = async (req, res, next) => {
    try {
        const newRegister = new Register({ ...req.body, retailId: req.user.retailId });
        await newRegister.save();
        return res.status(201).json({ success: true, msg: newRegister });
    } catch (error) {
        return next(error instanceof HttpError ? error : new HttpError(error instanceof Error ? error.message : 'srv_register_creation_failed', 400));
    }
};

const updateRegister = async (req, res, next) => {
    try {
        const updatedRegister = await Register.findOneAndUpdate(
            { _id: req.params.id, retailId: req.user.retailId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedRegister) {
            throw new HttpError('srv_register_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: updatedRegister });
    } catch (error) {
        return next(error instanceof HttpError ? error : new HttpError('srv_register_update_failed', 400));
    }
};

const deleteRegister = async (req, res, next) => {
    try {
        const deletedRegister = await Register.findOneAndDelete({ _id: req.params.id, retailId: req.user.retailId });
        if (!deletedRegister) {
            throw new HttpError('srv_register_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: 'srv_register_deleted' });
    } catch (error) {
        return next(error instanceof HttpError ? error : new HttpError('srv_register_deletion_failed', 400));
    }
};

module.exports = {
    getRegister,
    createRegister,
    updateRegister,
    deleteRegister,
};
