import { z } from 'zod';

import { TIME_FORMAT, validateBreaksWithinWorkingHours } from '@/utils';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const BaseBreakSchema = z.object({
    start: z.string({ required_error: 'misc_required' })
        .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    end: z.string({ required_error: 'misc_required' })
        .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    name: z.string().min(1, { message: "misc_required" }),
    duration: z.number({ required_error: 'misc_required' }).min(15, { message: "srv_invalid_duration" }).max(24 * 60, { message: "srv_invalid_duration" }), // in minutes
    isOverNight: z.boolean(),
});

const BreakSchema = BaseBreakSchema.superRefine(({ start, end, isOverNight }, ctx) => {
    const startTime = dayjs(start, TIME_FORMAT, true);
    const endTime = dayjs(end, TIME_FORMAT, true);

    if (!startTime.isValid() || !endTime.isValid() || startTime.isSame(endTime)) {
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

export const BreakSchemaWithWorkingHours = BaseBreakSchema.extend({
    workingHours: z.object({
        start: z.string({ required_error: 'misc_required' })
            .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
        end: z.string({ required_error: 'misc_required' })
            .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
        isOverNight: z.boolean(),
    }),
}).superRefine(({ workingHours, ...brk }, ctx) => {
    const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHours);
    if (!isStartValid) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'srv_invalid_break_range',
            path: ['start'],
        });
    }

    if (!isEndValid) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'srv_invalid_break_range',
            path: ['end'],
        });
    }
}
);

export default BreakSchema;