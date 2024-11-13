const Register = require('../../models/Register');
const utils = require('../../utils');

const getRegisters = async (req, res, next) => {
    try {
        const { isAvailable } = req.body;
        const query = { retailId: req.user.retailId };

        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable;
        }

        const registers = await Register.find(query);
        return res.status(200).json({ success: true, msg: registers });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_registers_not_found', 404));
    }
};

module.exports = {
    getRegisters,
};  