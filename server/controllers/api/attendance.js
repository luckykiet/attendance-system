const { utils } = require("../../utils");

const Employee = require('../../models/Employee');
const Register = require('../../models/Register');

const makeAttendance = async (req, res) => {
    const { employeeId, publicKey, latitude, longitude, registerId } = req.body;

    const employee = await Employee.findOne({ _id: employeeId });

    if (employee && employee.verifyPublicKey(publicKey) && employee.isAssociatedWithCompany(registerId)) {
        const register = await Register.findOne({ _id: registerId });
        const distance = utils.calculateDistance(
            register.location.latitude,
            register.location.longitude,
            latitude,
            longitude
        );

        if (distance <= register.location.allowedRadius) {
            return res.json({ success: true });
        }
    }

    res.status(400).json({ success: false, msg: 'srv_attendance_failed' });
};

module.exports = {
    makeAttendance
}