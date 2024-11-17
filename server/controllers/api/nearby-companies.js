const Register = require('../../models/Register');
const Employee = require('../../models/Employee');
const WorkingAt = require('../../models/WorkingAt');
const Attendance = require('../../models/Attendance');
const HttpError = require("../../constants/http-error");
const utils = require('../../utils');

const getNearbyCompanies = async (req, res, next) => {
    try {
        const { longitude, latitude } = req.body;

        if (!longitude || !latitude) {
            throw new HttpError('srv_missing_coordinates', 400);
        }

        // get the employee(s) by the deviceId
        const employees = await Employee.find({ deviceId: req.deviceId }).select('retailId').exec();

        if (!employees.length) {
            return res.status(200).json({ success: true, msg: [] });
        }

        // get only the registerIds where the employee is working
        const workingAts = await WorkingAt.find({ employeeId: { $in: employees.map(e => e._id) }, isAvailable: true }).select('registerId workingHours').exec();

        if (!workingAts.length) {
            return res.status(200).json({ success: true, msg: [] });
        }

        const attendances = await Attendance.find({ registerId: { $in: workingAts.map((w) => w.registerId) } }).select('registerId checkInTime checkOutTime').exec();

        const maxDistance = 500;

        // get all registers near the employee, where the employee is working at and belongs to the same company
        const nearbyRegisters = await Register.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [longitude, latitude] },
                    $maxDistance: maxDistance
                }
            },
            _id: { $in: workingAts.map(w => w.registerId) }
        }).select('name workingHours location address');

        const leanNearbyRegisters = nearbyRegisters.map(register => {
            const attendance = attendances.find(a => a.registerId.equals(register._id));
            const workingAt = workingAts.find(w => w.registerId.equals(register._id));
            const registerObj = register.toObject();
            delete registerObj.id;

            registerObj.checkInTime = attendance?.checkInTime || null;
            registerObj.checkOutTime = attendance?.checkOutTime || null;
            registerObj.employeeWorkingHours = workingAt.workingHours;

            const regLongitude = registerObj.location.longitude;
            const regLatitude = registerObj.location.latitude;
            registerObj.distanceInMeters = utils.calculateDistance({ originLat: latitude, originLon: longitude, newLat: regLatitude, newLon: regLongitude });
            return registerObj;
        });

        leanNearbyRegisters.sort((a, b) => a.distanceInMeters - b.distanceInMeters);

        return res.status(200).json({ success: true, msg: leanNearbyRegisters });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_companies', 500));
    }
};

const getMyWorkingPlaces = async (req, res, next) => {
    try {
        // get the employee(s) by the deviceId
        const employees = await Employee.find({ deviceId: req.deviceId }).select('retailId').exec();

        if (!employees.length) {
            return res.status(200).json({ success: true, msg: { workingAts: [], registers: [] } });
        }

        // get only the registerIds where the employee is working
        const workingAts = await WorkingAt.find({ employeeId: { $in: employees.map(e => e._id) }, isAvailable: true }).select('registerId workingHours').exec();

        if (!workingAts.length) {
            return res.status(200).json({ success: true, msg: { workingAts: [], registers: [] } });
        }

        // get all registers near the employee, where the employee is working at and belongs to the same company
        const registers = await Register.find({ _id: { $in: workingAts.map(w => w.registerId) } }).select('name workingHours address');

        return res.status(200).json({ success: true, msg: { registers, workingAts } });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_failed_to_get_companies', 500));
    }
};

module.exports = {
    getNearbyCompanies,
    getMyWorkingPlaces
};
