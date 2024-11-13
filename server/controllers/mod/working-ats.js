const WorkingAt = require('../../models/WorkingAt');
const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const HttpError = require('../../constants/http-error');
const utils = require('../../utils');

const updateWorkingAts = async (req, res, next) => {
    try {
        const { employeeId, workingAts } = req.body;

        const foundEmployee = await Employee.findOne({
            _id: employeeId,
            retailId: req.user.retailId,
        });

        if (!foundEmployee) {
            throw new HttpError('srv_employee_not_found', 404);
        }

        const registers = await Register.find({ _id: { $in: workingAts.map((reg) => reg.registerId) }, retailId: req.user.retailId });

        if (registers.length !== workingAts.length) {
            throw new HttpError('srv_register_not_found', 404);
        }

        const toAddWorkingAts = workingAts.filter((workingAt) => workingAt.isAvailable);
        const toRemoveWorkingAts = workingAts.filter((workingAt) => !workingAt.isAvailable);

        await WorkingAt.updateMany({ employeeId, registerId: { $in: toAddWorkingAts.map((reg) => reg.registerId) } }, { $set: { isAvailable: true } }, { runValidators: true });
        await WorkingAt.updateMany({ employeeId, registerId: { $in: toRemoveWorkingAts.map((reg) => reg.registerId) } }, { $set: { isAvailable: false } }, { runValidators: true });

        return res.status(201).json({ success: true, msg: 'srv_working_ats_updated' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_register_creation_failed', 400));
    }
};

module.exports = {
    updateWorkingAts,
};