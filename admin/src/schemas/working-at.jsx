import { z } from 'zod';
import ShiftSchema from './shift';
import { getDaysOfWeek } from '@/utils';

const daysOfWeek = getDaysOfWeek(true);

const shiftsSchema = z.object(
  daysOfWeek.reduce((acc, day) => {
    acc[day] = z.array(ShiftSchema);
    return acc;
  }, {})
);

const WorkingAtSchema = z.object({
  position: z.string().optional(),
  isAvailable: z.boolean(),
  shifts: shiftsSchema,
});

export default WorkingAtSchema;
