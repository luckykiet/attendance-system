const HttpError = require('../../constants/http-error');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');
const utils = require('../../utils');

const getEmployeeById = async (id, retailId) => {
    if (!id) {
        return null;
    }
    return await Employee.findOne({ _id: id, retailId });
};

const getEmployee = async (req, res, next) => {
    try {
        const employee = await getEmployeeById(req.params.id, req.user.retailId);
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }

        return res.status(200).json({ success: true, msg: employee });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_not_found', 404));
    }
};

const getEmployeeWorkingAt = async (req, res, next) => {
    try {
        const employee = await getEmployeeById(req.params.id, req.user.retailId);
        if (!employee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        const workingAts = await WorkingAt.find({ employeeId: employee._id });
        return res.status(200).json({ success: true, msg: workingAts });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_working_at_not_found', 404));
    }
}

const createEmployee = async (req, res, next) => {
    try {
        const foundEmployee = await Employee.findOne({ email: req.body.email, retailId: req.user.retailId });
        if (foundEmployee) {
            throw new HttpError('srv_employee_exists', 409);
        }
        const newEmployee = new Employee({ ...req.body, retailId: req.user.retailId });
        await newEmployee.save();
        return res.status(201).json({ success: true, msg: newEmployee });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_creation_failed', 400));
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const updatedEmployee = await Employee.findOneAndUpdate(
            { _id: req.body._id, retailId: req.user.retailId },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!updatedEmployee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: updatedEmployee });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_update_failed', 400));
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const deletedEmployee = await Employee.findOneAndDelete({ _id: req.params.id, retailId: req.user.retailId });
        if (!deletedEmployee) {
            throw new HttpError('srv_employee_not_found', 404);
        }
        return res.status(200).json({ success: true, msg: 'srv_employee_deleted' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employee_deletion_failed', 400));
    }
};

module.exports = {
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeWorkingAt
};
