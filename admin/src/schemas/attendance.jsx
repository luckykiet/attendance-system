import dayjs from 'dayjs';
import { z } from 'zod';

const AttendanceSchema = z.object({
    _id: z.string().optional(),
    checkInTime: z
        .any()
        .refine((time) => time === null || (dayjs.isDayjs(time) && time.isValid()), {
            message: 'srv_invalid_time_format',
        }),
    checkOutTime: z
        .any()
        .refine((time) => time === null || (dayjs.isDayjs(time) && time.isValid()), {
            message: 'srv_invalid_time_format',
        }),
}).refine(
    ({ checkInTime, checkOutTime }) => {
        if (dayjs.isDayjs(checkInTime) && dayjs.isDayjs(checkOutTime)) {
            return checkInTime.isBefore(checkOutTime);
        }
        return true;
    },
    {
        message: 'srv_close_time_before_open_time',
        path: ['checkOutTime'],
    }
);

export default AttendanceSchema;