import { ROLES } from '@/configs';
import { REGEX } from '@/utils';
import { z } from 'zod';

const BaseUserSchema = z.object({
    userId: z.string().optional(),
    name: z.string().min(1, { message: 'misc_required' }).max(255),
    email: z.string().email({ message: 'srv_invalid_email' }),
    username: z
        .string({ required_error: 'misc_required' })
        .trim()
        .min(6, { message: 'srv_username_length' })
        .max(20, { message: 'srv_username_length' })
        .regex(REGEX.username, { message: 'srv_username_no_whitespace' }),
    phone: z
        .string()
        .optional()
        .refine((val) => !val || REGEX.phone.test(val), { message: 'srv_invalid_phone' }),
    password: z
        .string()
        .min(8, { message: 'srv_password_length' })
        .max(255, { message: 'srv_password_length' })
        .optional()
        .or(z.literal('')),
    confirmPassword: z
        .string()
        .max(255, { message: 'srv_password_length' })
        .optional()
        .or(z.literal('')),
    role: z.enum(ROLES, { message: 'srv_invalid_role' }),
    notes: z.string().optional(),
    isAvailable: z.boolean(),
})

const UserSchema = BaseUserSchema.superRefine((data, ctx) => {
    if (!data.userId && !data.password) {
        ctx.addIssue({
            path: ['password'],
            message: 'misc_required',
        });
    }

    if (!data.userId && !data.confirmPassword) {
        ctx.addIssue({
            path: ['confirmPassword'],
            message: 'misc_required',
        });
    }

    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
        ctx.addIssue({
            path: ['confirmPassword'],
            message: 'srv_passwords_not_match',
        });
    }
});

export default UserSchema;