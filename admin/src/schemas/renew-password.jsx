import { z } from "zod";
import PasswordSchema from "./password";
import ConfirmPasswordSchema from "./confirm-password";

const BaseSchema = z.object({
    password: PasswordSchema,
    confirmPassword: ConfirmPasswordSchema
})
const RenewPasswordSchema = BaseSchema.refine((data) => data.password === data.confirmPassword, {
    message: 'srv_passwords_not_match',
    path: ['confirmPassword'],
})

export default RenewPasswordSchema;