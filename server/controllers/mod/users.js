const User = require('../../models/User');
const utils = require('../../utils/utils');

const getUsers = async (req, res, next) => {
    try {
        const { limit, search, filters } = req.body;

        const filterConditions = { retailId: req.user.retailId };

        if (search) {
            filterConditions.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (filters && filters.isAvailable !== 'all') {
            filterConditions.isAvailable = filters.isAvailable === 'true';
        }

        const queryLimit = limit ? parseInt(limit, 10) : 50;

        const users = await User.find(filterConditions).select('name email phone username role notes isAvailable').limit(queryLimit);

        return res.status(200).json({ success: true, msg: users });
    } catch (error) {
        return next(utils.parseExpressErrors(error, 'srv_users_not_found', 404));
    }
};

module.exports = {
    getUsers,
};
