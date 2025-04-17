const { body, param } = require('express-validator');
const { SPECIFIC_BREAKS } = require("../configs")
const { DAYS_OF_WEEK } = require('../constants');
const { isValidTime, validateBreaksWithinWorkingHours, getStartEndTime } = require('../utils');

const validateSpecificBreaks = () => {
    return DAYS_OF_WEEK.flatMap((day) =>
        SPECIFIC_BREAKS.flatMap((type) => [
            body(`specificBreaks.${day}.${type}.start`)
                .notEmpty().withMessage('misc_required').bail()
                .custom((start, { req }) => {
                    if (!isValidTime(start)) {
                        throw new Error('srv_invalid_time');
                    };

                    const sbTime = getStartEndTime({ end: req.body.specificBreaks?.[day]?.[type]?.end, start });

                    if (!sbTime) {
                        throw {
                            field: `specificBreaks.${day}.${type}.end`,
                            message: 'srv_invalid_time',
                        }
                    }

                    return true;
                }),

            body(`specificBreaks.${day}.${type}.end`)
                .notEmpty().withMessage('misc_required')
                .bail()
                .custom((end, { req }) => {
                    if (!isValidTime(end)) {
                        throw new Error('srv_invalid_time');
                    };

                    const sbTime = getStartEndTime({ start: req.body.specificBreaks?.[day]?.[type]?.start, end });

                    if (!sbTime) {
                        throw {
                            field: `specificBreaks.${day}.${type}.start`,
                            message: 'srv_invalid_time',
                        }
                    }

                    return true;
                }),


            body(`specificBreaks.${day}.${type}.duration`)
                .notEmpty().withMessage('misc_required').bail()
                .isInt({ min: 15, max: 1440 }).withMessage('srv_invalid_duration').bail(),

            body(`specificBreaks.${day}.${type}.isOverNight`)
                .isBoolean().withMessage('misc_required').bail()
                .custom((value, { req }) => {
                    const sbTime = getStartEndTime({ start: req.body.specificBreaks?.[day]?.[type]?.start, end: req.body.specificBreaks?.[day]?.[type]?.end });

                    if (!sbTime) {
                        throw new Error('srv_invalid_time');
                    }
                    const { isOverNight } = sbTime;

                    if (value !== isOverNight) throw new Error('srv_invalid_overnight');
                    return true;
                }),

            body(`specificBreaks.${day}.${type}.isAvailable`)
                .isBoolean().withMessage('misc_required').bail(),

            body(`specificBreaks.${day}.${type}`).custom((brk, { req }) => {
                const workingHour = req.body.workingHours?.[day];

                if (!workingHour) {
                    throw new Error('srv_invalid_working_hours');
                };
                const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHour);

                if (brk.isAvailable && !isStartValid) {
                    throw {
                        field: `specificBreaks.${day}.${type}.start`,
                        message: 'srv_invalid_break_range',
                    };
                }

                if (brk.isAvailable && !isEndValid) {
                    throw {
                        field: `specificBreaks.${day}.${type}.end`,
                        message: 'srv_invalid_break_range',
                    };
                }
                return true;
            }).bail()
        ])
    )
}
const validateBreaks = () => {
    return DAYS_OF_WEEK.flatMap((day) => [
        body(`breaks.${day}`)
            .isArray()
            .withMessage('misc_required').bail()
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

                    if (!isValidTime(brk.start)) {
                        throw {
                            field: `breaks.${day}[${i}].start`,
                            message: 'srv_invalid_time',
                        };
                    }

                    if (!isValidTime(brk.end)) {
                        throw {
                            field: `breaks.${day}[${i}].end`,
                            message: 'srv_invalid_time',
                        };
                    }

                    const brkTime = getStartEndTime({ start: brk.start, end: brk.end });

                    if (!brkTime) {
                        throw {
                            field: `breaks.${day}[${i}]`,
                            message: 'srv_invalid_time',
                        };
                    }
                    const { isOverNight } = brkTime;

                    if (brk.isOverNight !== isOverNight) {
                        throw {
                            field: `breaks.${day}[${i}].isOverNight`,
                            message: 'srv_invalid_overnight',
                        };
                    }
                }

                return true;
            }).bail(),
    ]);
};

const validateWorkingHours = () => {
    return DAYS_OF_WEEK.flatMap(day => [
        body(`workingHours.${day}.start`).notEmpty().withMessage('misc_required').bail()
            .custom((start, { req }) => {
                if (!isValidTime(start)) {
                    throw new Error('srv_invalid_time');
                };

                const wkTime = getStartEndTime({ end: req.body.workingHours?.[day]?.end, start });

                if (!wkTime) {
                    throw {
                        field: `workingHours.${day}.end`,
                        message: 'srv_invalid_time',
                    }
                }

                return true;
            }).bail(),
        body(`workingHours.${day}.end`).notEmpty().withMessage('misc_required').bail().custom((end, { req }) => {
            if (!isValidTime(end)) {
                throw new Error('srv_invalid_time');
            };

            const wkTime = getStartEndTime({ end, start: req.body.workingHours?.[day]?.start });

            if (!wkTime) {
                throw {
                    field: `workingHours.${day}.start`,
                    message: 'srv_invalid_time',
                }
            }

            return true;
        }).bail(),
        body(`workingHours.${day}.isOverNight`)
            .isBoolean().withMessage('misc_required')
            .custom((value, { req }) => {
                const start = req.body.workingHours?.[day]?.start;
                const end = req.body.workingHours?.[day]?.end;

                if (!isValidTime(start)) {
                    throw {
                        field: `workingHours.${day}.start`,
                        message: 'srv_invalid_time',
                    }
                }
                if (!isValidTime(end)) {
                    throw {
                        field: `workingHours.${day}.end`,
                        message: 'srv_invalid_time',
                    }
                }

                const wkTime = getStartEndTime({ start, end });

                if (!wkTime) {
                    throw new Error('srv_invalid_time');
                }

                const { isOverNight } = wkTime;

                if (value !== isOverNight) {
                    throw new Error('srv_invalid_overnight');
                }
                return true;
            }).bail(),

        body(`workingHours.${day}.isAvailable`).isBoolean().withMessage('misc_required').bail(),
    ])
}

const NewRegisterValidation = [
    body('name').trim().notEmpty().withMessage('misc_required').bail().isLength({ max: 255 }).withMessage('srv_invalid_length').bail(),

    body('address.street').trim().notEmpty().withMessage('misc_required').bail().isLength({ max: 255 }).withMessage('srv_invalid_length'),
    body('address.city').trim().notEmpty().withMessage('misc_required').bail().isLength({ max: 255 }).withMessage('srv_invalid_length').bail(),
    body('address.zip').trim().notEmpty().withMessage('misc_required').bail().isLength({ max: 20 }).withMessage('srv_invalid_length').bail(),

    body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('srv_invalid_latitude').bail(),
    body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('srv_invalid_longitude').bail(),
    body('location.allowedRadius').isFloat({ gt: 0, lt: 5001 }).withMessage('srv_invalid_radius').bail(),

    body('maxLocalDevices').isInt({ min: 0 }).withMessage('srv_invalid_device_count').bail(),
    body('isAvailable').isBoolean().bail(),


    ...validateWorkingHours(),

    ...validateSpecificBreaks(),

    ...validateBreaks(),
]

const UpdateRegisterValidation = [body('_id').notEmpty().isMongoId().withMessage('misc_required').bail(), ...NewRegisterValidation]

const GetRegisterValidation = [param('id').notEmpty().isMongoId().withMessage('misc_required').bail()]
const DeleteRegisterValidation = [param('id').notEmpty().isMongoId().withMessage('misc_required').bail()]

module.exports = {
    NewRegisterValidation,
    UpdateRegisterValidation,
    GetRegisterValidation,
    DeleteRegisterValidation
}