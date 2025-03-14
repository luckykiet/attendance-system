import { SPECIFIC_BREAKS } from '@/configs';

import BreakSchema from '@/schemas/break';
import WorkingHourSchema from '@/schemas/working-hours';
import SpecificBreakSchema from '@/schemas/specific-break';
import { getDaysOfWeek, validateBreaksWithinWorkingHours } from '@/utils';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { z } from 'zod';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const daysOfWeek = getDaysOfWeek(true);

const BaseRegisterSchema = z.object({
    name: z.string().min(1, { message: 'misc_required' }).max(255),
    address: z.object({
        street: z.string().min(1, { message: 'misc_required' }).max(255),
        city: z.string().min(1, { message: 'misc_required' }).max(255),
        zip: z.string().min(1, { message: 'misc_required' }).max(20),
    }),
    location: z.object({
        latitude: z.number().min(-90, { message: 'srv_invalid_latitude' }).max(90),
        longitude: z.number().min(-180, { message: 'srv_invalid_longitude' }).max(180),
        allowedRadius: z.number().positive().max(5000),
    }),
    workingHours: z.object(
        daysOfWeek.reduce((acc, day) => {
            acc[day] = WorkingHourSchema;
            return acc;
        }, {})
    ),
    specificBreaks: z.object(
        daysOfWeek.reduce((acc, day) => {
            acc[day] = z.object(
                SPECIFIC_BREAKS.reduce((accBrk, brk) => {
                    accBrk[brk] = SpecificBreakSchema;
                    return accBrk;
                }, {})
            );
            return acc;
        }, {})
    ),
    breaks: z.object(
        daysOfWeek.reduce((acc, day) => {
            acc[day] = z.array(BreakSchema);
            return acc;
        }, {})
    ),
    maxLocalDevices: z.number().int().min(0, { message: 'srv_invalid_device_count' }),
    isAvailable: z.boolean(),
})

const RegisterSchema = BaseRegisterSchema.superRefine(({ breaks, specificBreaks, workingHours }, ctx) => {
    Object.entries(specificBreaks).forEach(([day, specificBreak]) => {
        const workingHour = workingHours[day];
        Object.entries(specificBreak).forEach(([type, brk]) => {
            const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHour);

            if (!isStartValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'srv_invalid_break_range',
                    path: ['specificBreaks', day, type, 'start'],
                });
            }

            if (!isEndValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'srv_invalid_break_range',
                    path: ['specificBreaks', day, type, 'end'],
                });
            }
        });
    });

    Object.entries(breaks).forEach(([day, dayBreaks]) => {
        const workingHour = workingHours[day];
        Object.entries(dayBreaks).forEach(([index, brk]) => {
            const { isStartValid, isEndValid } = validateBreaksWithinWorkingHours(brk, workingHour);
            if (!isStartValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'srv_invalid_break_range',
                    path: ['breaks', day, index, 'start'],
                });
            }

            if (!isEndValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'srv_invalid_break_range',
                    path: ['breaks', day, index, 'end'],
                });
            }
        });
    });
});

export default RegisterSchema;