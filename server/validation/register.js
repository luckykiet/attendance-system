const { body } = require('express-validator');
const { SPECIFIC_BREAKS } = require("../configs")
const { DAYS_OF_WEEK } = require('../constants');
const { isValidTime, isOverNight, validateBreaksWithinWorkingHours } = require('../utils');

const validateSpecificBreaks = () => {
    return DAYS_OF_WEEK.flatMap((day) =>
        SPECIFIC_BREAKS.flatMap((type) => [
            body(`specificBreaks.${day}.${type}.start`)
                .notEmpty().withMessage('misc_required')
                .custom((value) => {
                    if (!isValidTime(value)) throw new Error('srv_invalid_time');
                    return true;
                }),

            body(`specificBreaks.${day}.${type}.end`)
                .notEmpty().withMessage('misc_required')
                .bail()
                .custom((value) => {
                    if (!isValidTime(value)) throw new Error('srv_invalid_time');
                    return true;
                }),

            body(`specificBreaks.${day}.${type}.duration`)
                .notEmpty().withMessage('misc_required')
                .isInt({ min: 15, max: 1440 }).withMessage('srv_invalid_duration'),

            body(`specificBreaks.${day}.${type}.isOverNight`)
                .isBoolean().withMessage('misc_required')
                .custom((value, { req }) => {
                    const start = req.body.specificBreaks?.[day]?.[type]?.start;
                    const end = req.body.specificBreaks?.[day]?.[type]?.end;

                    if (!isValidTime(start) || !isValidTime(end)) return true;
                    const expected = isOverNight(start, end);
                    if (value !== expected) throw new Error('srv_invalid_overnight');
                    return true;
                }),

            body(`specificBreaks.${day}.${type}.isAvailable`)
                .isBoolean().withMessage('misc_required'),

            body(`specificBreaks.${day}.${type}`).custom((brk, { req }) => {
                const workingHour = req.body.workingHours?.[day];
                const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHour);

                if (!isStartValid) {
                    throw {
                        field: `specificBreaks.${day}.${type}.start`,
                        message: 'srv_invalid_break_range',
                    };
                }

                if (!isEndValid) {
                    throw {
                        field: `specificBreaks.${day}.${type}.end`,
                        message: 'srv_invalid_break_range',
                    };
                }
                return true;
            })
        ])
    )
}
const validateBreaks = () => {
    return DAYS_OF_WEEK.flatMap((day) => [
        body(`breaks.${day}`)
            .isArray()
            .withMessage('misc_required')
            .custom((breaks, { req }) => {
                const workingHour = req.body.workingHours?.[day];
                if (!workingHour) return true;

                for (let i = 0; i < breaks.length; i++) {
                    const brk = breaks[i];
                    const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHour);

                    if (!isStartValid) {
                        throw {
                            field: `breaks.${day}[${i}].start`,
                            message: 'srv_invalid_break_range',
                        };
                    }

                    if (!isEndValid) {
                        throw {
                            field: `breaks.${day}[${i}].end`,
                            message: 'srv_invalid_break_range',
                        };
                    }

                    const start = brk.start;
                    const end = brk.end;

                    if (start && end) {
                        const isValid = isOverNight(start, end);
                        if (brk.isOverNight !== isValid) {
                            throw {
                                field: `breaks.${day}[${i}].isOverNight`,
                                message: 'srv_invalid_overnight',
                            };
                        }
                    }
                }

                return true;
            }),
    ]);
};

const validateWorkingHours = () => {
    return DAYS_OF_WEEK.flatMap(day => [
        body(`workingHours.${day}.start`).notEmpty().withMessage('misc_required').custom((value) => {
            const isValid = isValidTime(value);
            if (!isValid) throw new Error('srv_invalid_time');
            return true;
        }),
        body(`workingHours.${day}.end`).notEmpty().withMessage('misc_required').custom((value) => {
            const isValid = isValidTime(value);
            if (!isValid) throw new Error('srv_invalid_time');
            return true;
        }),
        body(`workingHours.${day}.isOverNight`)
            .isBoolean().withMessage('misc_required')
            .custom((value, { req }) => {
                const start = req.body.workingHours?.[day]?.start;
                const end = req.body.workingHours?.[day]?.end;

                if (!start || !end) return true;
                const isValid = isOverNight(start, end);
                if (value !== isValid) {
                    throw new Error('srv_invalid_overnight');
                }
                return true;
            }),

        body(`workingHours.${day}.isAvailable`).isBoolean().withMessage('misc_required'),
    ])
}

const NewRegisterValidation = [
    body('name').trim().notEmpty().withMessage('misc_required').isLength({ max: 255 }).withMessage('srv_invalid_length'),

    body('address.street').trim().notEmpty().withMessage('misc_required').isLength({ max: 255 }).withMessage('srv_invalid_length'),
    body('address.city').trim().notEmpty().withMessage('misc_required').isLength({ max: 255 }).withMessage('srv_invalid_length'),
    body('address.zip').trim().notEmpty().withMessage('misc_required').isLength({ max: 20 }).withMessage('srv_invalid_length'),

    body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('srv_invalid_latitude'),
    body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('srv_invalid_longitude'),
    body('location.allowedRadius').isFloat({ gt: 0, lt: 5001 }).withMessage('srv_invalid_radius'),

    body('maxLocalDevices').isInt({ min: 0 }).withMessage('srv_invalid_device_count'),
    body('isAvailable').isBoolean(),


    ...validateWorkingHours(),

    ...validateSpecificBreaks(),

    ...validateBreaks(),
]

const UpdateRegisterValidation = [body('_id').notEmpty().isMongoId().withMessage('misc_required'), ...NewRegisterValidation]

module.exports = {
    NewRegisterValidation,
    UpdateRegisterValidation
}