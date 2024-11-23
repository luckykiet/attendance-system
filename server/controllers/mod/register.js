const HttpError = require('../../constants/http-error');
const Register = require('../../models/Register');
const WorkingAt = require('../../models/WorkingAt');
const DailyAttendance = require('../../models/DailyAttendance');
const utils = require('../../utils');
const dayjs = require('dayjs');
const { DAYS_OF_WEEK } = require('../../constants');
const LocalDevice = require('../../models/LocalDevice');

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
        return next(utils.parseExpressErrors(error, 'srv_register_not_found', 404));
    }
};

const createRegister = async (req, res, next) => {
    try {
        const { latitude, longitude, allowedRadius } = req.body.location;

        const newRegister = new Register({
            ...req.body,
            retailId: req.user.retailId,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
                allowedRadius: allowedRadius || 100,
            },
        });

        await newRegister.save();
        return res.status(201).json({ success: true, msg: newRegister });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_register_creation_failed', 400));
    }
};

const updateRegister = async (req, res, next) => {
    try {
        const { latitude, longitude, allowedRadius } = req.body.location;

        const foundRegister = await getRegisterById(req.body._id, req.user.retailId);

        if (!foundRegister) {
            throw new HttpError('srv_register_not_found', 404);
        }

        if (req.body.maxLocalDevices && req.body.maxLocalDevices !== foundRegister.maxLocalDevices) {
            const localDevices = await LocalDevice.find({ registerId: req.body._id });
            if (localDevices.length > req.body.maxLocalDevices) {
                throw new HttpError('srv_max_local_devices_exceeded', 400);
            }
        }
        const updatedRegister = await Register.findOneAndUpdate(
            { _id: foundRegister._id },
            {
                $set: {
                    ...req.body,
                    location: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                        allowedRadius: allowedRadius || 100,
                    },
                },
            },
            { new: true, runValidators: true }
        );


        if (!updatedRegister) {
            throw new HttpError('srv_register_not_found', 404);
        }

        // update daily attendance working hours
        const today = dayjs()
        const todayAttendance = await DailyAttendance.findOne({ date: parseInt(today.format('YYYYMMDD')), registerId: updatedRegister._id, })
        const todayIndex = today.day()
        const todayKey = DAYS_OF_WEEK[todayIndex];
        const workingHour = updatedRegister.workingHours[todayKey]
        if (todayAttendance) {
            await DailyAttendance.findOneAndUpdate({ _id: todayAttendance._id }, { $set: { workingHour } })
        }
        return res.status(200).json({ success: true, msg: updatedRegister });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_register_update_failed', 400));
    }
};

const deleteRegister = async (req, res, next) => {
    try {
        const deletedRegister = await Register.findOneAndDelete({ _id: req.params.id, retailId: req.user.retailId });
        if (!deletedRegister) {
            throw new HttpError('srv_register_not_found', 404);
        }
        await WorkingAt.deleteMany({ registerId: req.params.id });
        await LocalDevice.deleteMany({ registerId: req.params.id });
        return res.status(200).json({ success: true, msg: 'srv_register_deleted' });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_register_deletion_failed', 400));
    }
};

module.exports = {
    getRegister,
    createRegister,
    updateRegister,
    deleteRegister,
};
