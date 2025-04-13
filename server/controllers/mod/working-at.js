const WorkingAt = require('../../models/WorkingAt');
const Register = require('../../models/Register');
const HttpError = require('../../constants/http-error');
const utils = require('../../utils');

const createOrUpdateWorkingAt = async (req, res, next) => {
    try {
        const foundRegister = await Register.findOne({
            _id: req.body.registerId,
            retailId: req.user.retailId,
        });

        if (!foundRegister) {
            throw new HttpError('srv_register_not_found', 404);
        }

        let workingAt = await WorkingAt.findOne({ employeeId: req.body.employeeId, registerId: req.body.registerId });
        
        if (workingAt) {
            workingAt = await WorkingAt.findOneAndUpdate(
                { _id: workingAt._id },
                { $set: req.body },
                { new: true, runValidators: true }
            );
        } else {
            workingAt = new WorkingAt({ ...req.body, workingHours: foundRegister.workingHours });
            workingAt.userId = req.user._id;
            workingAt = await workingAt.save();
        }
        return res.status(201).json({ success: true, msg: workingAt });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_register_creation_failed', 400));
    }
};

module.exports = {
    createOrUpdateWorkingAt
};