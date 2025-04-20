import { DATE_FORMAT } from '@/utils';
import dayjs from 'dayjs';
import { z } from 'zod';

// output is YYYYMMDD but display is DD.MM.YYYY
const dateString = z.string({ required_error: 'misc_required' })
    .refine((date) => dayjs(date, DATE_FORMAT, true).isValid(), { message: 'DD.MM.YYYY' }).refine((date) => {
        const dateDayjs = dayjs(date, DATE_FORMAT, true).endOf('day');
        const today = dayjs().endOf('day');
        return !dateDayjs.isAfter(today);
    }, {
        message: 'srv_date_can_not_be_in_future',
    });

const DashboardSchema = z.object({
    start: dateString,
    end: dateString,
}).refine(({ start, end }) => {
    const startDate = dayjs(start, DATE_FORMAT, true).startOf('day');
    const endDate = dayjs(end, DATE_FORMAT, true).endOf('day');
    return startDate.isValid() && endDate.isValid() && startDate.isBefore(endDate);
}, {
    message: 'srv_end_time_before_start_time',
    path: ['start'],
});


export default DashboardSchema;
