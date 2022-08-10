import { z } from 'zod';
import { subjectDataOuterSchema } from './wanikani_data_zod';

export const user_data_type_schema = z.object({
	id: z.string().cuid(),
	name: z.string().min(4).max(100),
	email: z.string().email(),
	createdAt: z.date(),
	progressId: z.string().cuid()
});

export type user_data_type = z.infer<typeof user_data_type_schema>;

export const lesson_data_type_schema = z.object({
	subjectId: z.number().int(),
	skill_level: z.number().min(0),
	next_review: z.date(),
	subject: subjectDataOuterSchema
});

export type lesson_data_type = z.infer<typeof lesson_data_type_schema>;
