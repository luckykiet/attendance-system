import { z } from 'zod';

const WorkingAtSchema = z.object({
    position: z.string().optional(),
});

export default WorkingAtSchema;