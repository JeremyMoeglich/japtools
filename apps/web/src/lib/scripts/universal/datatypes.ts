import type { SubjectType } from '@prisma/client/edge';
import { z } from 'zod';

export const ReadingTypeSchema = z.union([
	z.literal('ONYOMI'),
	z.literal('KUNYOMI'),
	z.literal('NANORI')
]);
export type ReadingTypeType = z.infer<typeof ReadingTypeSchema>;

export const AuxiliaryMeaningSchema = z.object({
	id: z.string(),
	meaning: z.string(),
	auxiliary_type: z.string(),
	subject_id: z.number().int()
});

export const SubjectMeaningSchema = z.object({
	id: z.string(),
	accepted_answer: z.boolean(),
	meaning: z.string(),
	primary: z.boolean(),
	subject_id: z.number().int()
});

export const KanjiReadingSchema = z.object({
	id: z.string(),
	reading: z.string(),
	reading_type: ReadingTypeSchema,
	primary: z.boolean(),
	subject_id: z.number().int()
});

export const ContextSentenceSchema = z.object({
	id: z.string(),
	en: z.string(),
	ja: z.string(),
	subject_id: z.number().int()
});

export const VocabularyReadingSchema = z.object({
	id: z.string(),
	reading: z.string(),
	primary: z.boolean(),
	accepted_answer: z.boolean(),
	subject_id: z.number().int()
});

export type KanjiReadingType = z.infer<typeof KanjiReadingSchema>;
export type VocabularyReadingType = z.infer<typeof VocabularyReadingSchema>;

export const RadicalDataSchema = z
	.object({
		id: z.number().int(),
		amalgamation_subject_ids: z.array(z.number().int()),
		auxiliary_meanings: z.array(AuxiliaryMeaningSchema),
		characters: z.string().optional(),
		lesson_position: z.number().int(),
		level: z.number().int(),
		meaning_mnemonic: z.string(),
		meanings: z.array(SubjectMeaningSchema),
		image_url: z.string().optional()
	})
	.strict();

export const KanjiDataSchema = z
	.object({
		id: z.number().int(),
		amalgamation_subject_ids: z.array(z.number().int()),
		auxiliary_meanings: z.array(AuxiliaryMeaningSchema),
		characters: z.string(),
		component_subject_ids: z.array(z.number().int()),
		lesson_position: z.number().int(),
		level: z.number().int(),
		meaning_hint: z.string().optional(),
		meaning_mnemonic: z.string(),
		meanings: z.array(SubjectMeaningSchema),
		reading_hint: z.string(),
		reading_mnemonic: z.string(),
		readings: z.array(KanjiReadingSchema),
		visually_similar_subject_ids: z.array(z.number().int())
	})
	.strict();

export const VocabularyDataSchema = z
	.object({
		id: z.number().int(),
		auxiliary_meanings: z.array(AuxiliaryMeaningSchema),
		characters: z.string(),
		component_subject_ids: z.array(z.number().int()),
		context_sentences: z.array(ContextSentenceSchema),
		lesson_position: z.number().int(),
		level: z.number().int(),
		meaning_mnemonic: z.string(),
		meanings: z.array(SubjectMeaningSchema),
		reading_mnemonic: z.string(),
		readings: z.array(VocabularyReadingSchema)
	})
	.strict();

export const SubjectDataSchema = z.union([
	RadicalDataSchema,
	KanjiDataSchema,
	VocabularyDataSchema
]);

export type SubjectDataType = z.infer<typeof SubjectDataSchema>;
export type KanjiDataType = z.infer<typeof KanjiDataSchema>;
export type RadicalDataType = z.infer<typeof RadicalDataSchema>;
export type VocabularyDataType = z.infer<typeof VocabularyDataSchema>;

export function get_subject_type(subject: SubjectDataType): SubjectType {
	if ('reading_hint' in subject) {
		return 'KANJI';
	} else if ('reading_mnemonic' in subject) return 'VOCABULARY';
	else {
		return 'RADICAL';
	}
}

export function is_kanji_data(subject: SubjectDataType): subject is KanjiDataType {
	return get_subject_type(subject) === 'KANJI';
}

export function is_vocabulary_data(subject: SubjectDataType): subject is VocabularyDataType {
	return get_subject_type(subject) === 'VOCABULARY';
}

export function is_radical_data(subject: SubjectDataType): subject is RadicalDataType {
	return get_subject_type(subject) === 'RADICAL';
}

export const user_data_type_schema = z.object({
	id: z.string(),
	name: z.string().min(4).max(100),
	email: z.string().email(),
	created_at: z.date(),
	progress_id: z.string(),
	total_completed: z.number().int()
});

export type user_data_type = z.infer<typeof user_data_type_schema>;

export const LessonSubjectDataSchema = z.object({
	subject_id: z.number().int(),
	skill_level: z.number().min(0),
	next_review: z.date(),
	subject: SubjectDataSchema
});

export type LessonSubjectDataType = z.infer<typeof LessonSubjectDataSchema>;
