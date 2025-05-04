import { z } from 'zod';

const LoginSchema = z.object({
    username: z
        .string({ required_error: 'misc_required' })
        .regex(/^\S+$/, 'srv_invalid_username')
        .max(255),
    password: z.string({ required_error: 'misc_required' }).max(255)
});

export default LoginSchema;