import { REGEX } from '@/utils';
import { z } from 'zod';

const BaseEmployeeSchema = z.object({
    name: z.string().min(1, { message: 'misc_required' }).max(255),
    email: z.string().email({ message: 'srv_invalid_email' }),
    phone: z.string().optional().refine((val) => !val || REGEX.phone.test(val), { message: 'srv_invalid_phone' }),
    registrationToken: z.string().optional(),
    deviceId: z.string().optional(),
    isAvailable: z.boolean(),
});

const EmployeeSchema = BaseEmployeeSchema;

export default EmployeeSchema;