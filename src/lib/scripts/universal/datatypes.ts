import { z } from 'zod';
import { KanjiSubjectCreateInputObjectSchema } from './prisma_schemas/schemas/objects/KanjiSubjectCreateInput.schema';
import { RadicalSubjectCreateInputObjectSchema } from './prisma_schemas/schemas/objects/RadicalSubjectCreateInput.schema';
import { VocabularySubjectCreateInputObjectSchema } from './prisma_schemas/schemas/objects/VocabularySubjectCreateInput.schema';

export const SubjectDataSchema = z.union([
	KanjiSubjectCreateInputObjectSchema,
	VocabularySubjectCreateInputObjectSchema,
	RadicalSubjectCreateInputObjectSchema
]);

export type SubjectDataType = z.infer<typeof SubjectDataSchema>;

export const user_data_type_schema = z.object({
	id: z.string().cuid(),
	name: z.string().min(4).max(100),
	email: z.string().email(),
	created_at: z.date(),
	progress_id: z.string().cuid()
});

export type user_data_type = z.infer<typeof user_data_type_schema>;

export const lesson_data_type_schema = z.object({
	subject_id: z.number().int(),
	skill_level: z.number().min(0),
	next_review: z.date(),
	subject: SubjectDataSchema
});

export type lesson_subject_data_type = z.infer<typeof lesson_data_type_schema>;
