import { z } from 'zod';

import { TIME_FORMAT, validateBreaksWithinWorkingHours } from '@/utils';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const BaseSpecificBreakSchema = z.object({
    start: z.string({ required_error: 'misc_required' })
        .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    end: z.string({ required_error: 'misc_required' })
        .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    duration: z.number({ required_error: 'misc_required' }).min(15, { message: "srv_invalid_duration" }).max(24 * 60, { message: "srv_invalid_duration" }), // in minutes
    isOverNight: z.boolean(),
    isAvailable: z.boolean(),
})

const SpecificBreakSchema = BaseSpecificBreakSchema.superRefine(({ start, end, isOverNight }, ctx) => {
    const startTime = dayjs(start, TIME_FORMAT, true);
    const endTime = dayjs(end, TIME_FORMAT, true);

    if (!startTime.isValid() || !endTime.isValid()) {
        return;
    }

    const expectedOvernight = endTime.isBefore(startTime);

    if (expectedOvernight !== isOverNight) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'srv_invalid_overnight',
            path: ['isOverNight'],
        });
    }
});

export const SpecificBreakSchemaWithWorkingHours = BaseSpecificBreakSchema.extend({
    workingHours: z.object({
        start: z.string({ required_error: 'misc_required' })
            .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
        end: z.string({ required_error: 'misc_required' })
            .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    }),
}).superRefine(({ workingHours, ...specificBrk }, ctx) => {
    const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(specificBrk, workingHours);

    if (specificBrk.isAvailable && !isStartValid) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'srv_invalid_break_range',
            path: ['start'],
        });
    }

    if (specificBrk.isAvailable && !isEndValid) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'srv_invalid_break_range',
            path: ['end'],
        });
    }
}
);

export default SpecificBreakSchema;