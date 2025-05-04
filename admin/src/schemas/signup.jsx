import { REGEX } from '@/utils';
import { z } from 'zod';
import PasswordSchema from './password';
import ConfirmPasswordSchema from './confirm-password';

const BaseSchema = z.object({
    username: z
        .string()
        .trim()
        .min(6, { message: 'srv_username_length' })
        .max(255, { message: 'srv_username_length' })
        .regex(REGEX.username, { message: 'srv_username_no_whitespace' }),
    email: z
        .string()
        .email({ message: 'srv_wrong_email_format' }),
    tin: z
        .string()
        .regex(/^[0-9]{8}$/, { message: 'srv_invalid_tin' }),
    name: z
        .string()
        .max(255, { message: 'srv_name_max_length' }),
    vin: z
        .string()
        .max(20, { message: 'srv_vin_max_length' })
        .optional(),
    address: z.object({
        street: z
            .string()
            .max(255, { message: 'srv_street_max_length' })
            .optional(),
        city: z
            .string()
            .max(255, { message: 'srv_city_max_length' })
            .optional(),
        zip: z
            .string()
            .regex(/^\d{3} ?\d{2}$/, { message: 'srv_invalid_zip' })
            .optional(),
    }),
    password: PasswordSchema,
    confirmPassword: ConfirmPasswordSchema
})

const SignupSchema = BaseSchema.refine((data) => data.password === data.confirmPassword, {
    message: 'srv_passwords_not_match',
    path: ['confirmPassword']
});

export default SignupSchema;