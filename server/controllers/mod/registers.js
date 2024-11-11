const HttpError = require('../../constants/http-error');
const Register = require('../../models/Register');

const getRegisters = async (req, res, next) => {
    try {
        const registers = await Register.find({ retailId: req.user.retailId });
        return res.status(200).json({ success: true, msg: registers });
    } catch (error) {
        return next(error instanceof HttpError ? error : new HttpError('srv_registers_not_found', 404));
    }
};

module.exports = {
    getRegisters,
};  