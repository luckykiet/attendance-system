const { body } = require('express-validator');
const { DAY_KEYS } = require('../configs');
const { isValidTime, isOverNight } = require('../utils');

const validateShifts = () => {
    return DAY_KEYS.flatMap((day) => [
        body(`shifts.${day}`)
            .isArray().withMessage('srv_invalid_shift_array'),

        body(`shifts.${day}.*.start`)
            .notEmpty().withMessage('misc_required')
            .bail()
            .custom((value) => {
                if (!isValidTime(value)) throw new Error('srv_invalid_time');
                return true;
            }),

        body(`shifts.${day}.*.end`)
            .notEmpty().withMessage('misc_required')
            .bail()
            .custom((value) => {
                if (!isValidTime(value)) throw new Error('srv_invalid_time');
                return true;
            }),

        body(`shifts.${day}.*.allowedOverTime`)
            .notEmpty().withMessage('misc_required').bail()
            .isInt({ min: 5, max: 24 * 60 }).withMessage('srv_invalid_allowedOverTime_range'),

        body(`shifts.${day}.*.isOverNight`)
            .isBoolean().withMessage('misc_required')
            .custom((value, { req, path }) => {
                const [, , index] = path.match(/shifts\.(\w+)\.(\d+)/) || [];
                const start = req.body.shifts?.[day]?.[index]?.start;
                const end = req.body.shifts?.[day]?.[index]?.end;

                if (!start || !end) return true;
                const expected = isOverNight(start, end);
                if (value !== expected) {
                    throw new Error('srv_invalid_overnight');
                }
                return true;
            }),

        body(`shifts.${day}.*.isAvailable`)
            .isBoolean().withMessage('misc_required')
    ]);
};

const createOrUpdateWorkingAtValidation = [
    body('employeeId').notEmpty().withMessage('misc_required').bail().isMongoId().withMessage('srv_invalid_id'),
    body('registerId').notEmpty().withMessage('misc_required').bail().isMongoId().withMessage('srv_invalid_id'),
    body('userId').optional().isMongoId().withMessage('srv_invalid_id'),
    body('position').optional().trim().isLength({ max: 255 }).withMessage('srv_invalid_length'),
    body('isAvailable').isBoolean().withMessage('srv_invalid_boolean'),

    ...validateShifts(),
];

module.exports = {
    createOrUpdateWorkingAtValidation,
};
