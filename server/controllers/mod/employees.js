const Employee = require('../../models/Employee');
const utils = require('../../utils/utils');

const getEmployees = async (req, res, next) => {
    try {
        const { limit, search, filters } = req.body;

        const filterConditions = { retailId: req.user.retailId };

        if (search) {
            filterConditions.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { deviceId: { $regex: search, $options: 'i' } },
            ];
        }

        if (filters && filters.isAvailable !== 'all') {
            filterConditions.isAvailable = filters.isAvailable === 'true';
        }

        if (filters && filters.hasDeviceId !== 'all') {
            if (filters.hasDeviceId === 'true') {
                filterConditions.deviceId = { $exists: true, $ne: '' };
            } else {
                filterConditions.deviceId = { $exists: false };
            }
        }

        const queryLimit = limit ? parseInt(limit, 10) : 50;

        const employees = await Employee.find(filterConditions).limit(queryLimit);

        return res.status(200).json({ success: true, msg: employees });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_employees_not_found', 404));
    }
};

module.exports = {
    getEmployees,
};
