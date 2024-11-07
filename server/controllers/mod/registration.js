const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { CONFIG } = require('../../configs');
const Employee = require('../../models/employee');


const JWT_EXPIRATION = '15m';

async function generateQrCode({ registerId, employee }) {
    const payload = { registerId };
    if (employee) {
        payload.employee = employee;
    }
    const token = jwt.sign(payload, CONFIG.jwtSecret, { expiresIn: JWT_EXPIRATION });
    const qrCodeUrl = await QRCode.toDataURL(token);
    return { token, qrCodeUrl };
}

const employeeRegistration = async (req, res) => {
    const { registerId, employee } = req.body;
    let newEmployee = null;
    if (employee) {
        newEmployee = new Employee(employee);
        await newEmployee.save();
    }
    const { token, qrCodeUrl } = await generateQrCode({ registerId, employee: newEmployee });
    res.json({ token, qrCodeUrl });
}

module.exports = {
    employeeRegistration
}