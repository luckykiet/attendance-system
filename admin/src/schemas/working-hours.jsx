import { z } from 'zod';

import { TIME_FORMAT } from '@/utils';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


const BaseWorkingHourSchema = z.object({
    start: z.string({ required_error: 'misc_required' })
        .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    end: z.string({ required_error: 'misc_required' })
        .refine((date) => dayjs(date, TIME_FORMAT, true).isValid(), { message: TIME_FORMAT }),
    isOverNight: z.boolean(),
    isAvailable: z.boolean(),
})

const WorkingHourSchema = BaseWorkingHourSchema.superRefine(({ start, end, isOverNight }, ctx) => {
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

export default WorkingHourSchema;