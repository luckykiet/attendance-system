import { z } from "zod";

const ConfirmPasswordSchema = z.string().max(255, { message: 'srv_password_length' });

export default ConfirmPasswordSchema;