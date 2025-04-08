import dayjs from "dayjs";
import { z } from "zod";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const BaseRetailSchema = z.object({
    name: z.string().min(1, { message: 'misc_required' }).max(255),
    address: z.object({
        street: z.string().min(1, { message: 'misc_required' }).max(255),
        city: z.string().min(1, { message: 'misc_required' }).max(255),
        zip: z.string().min(1, { message: 'misc_required' }).max(20),
    }),
    tin: z
        .string()
        .regex(/^[0-9]{8}$/, { message: 'srv_invalid_tin' }),
    vin: z.string().optional(),
})

const RetailSchema = BaseRetailSchema

export default RetailSchema;
