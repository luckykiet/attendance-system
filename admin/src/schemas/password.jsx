import { z } from 'zod';

const PasswordSchema = z.string()
    .min(8, 'srv_password_requirements')
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'srv_password_requirements')
    .max(255, { message: 'srv_password_length' });

export default PasswordSchema;