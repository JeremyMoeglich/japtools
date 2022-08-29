// Generated by ts-to-zod
import { z } from "zod";

export const characterImageMetadataSvgSchema = z.object({
    inline_styles: z.boolean()
});

export const characterImageMetadataPngSchema = z.object({
    color: z.string(),
    dimensions: z.string(),
    style_name: z.string()
});

export const characterImageSchema = z.union([z.object({
        metadata: characterImageMetadataPngSchema,
        content_type: z.literal("image/png")
    }), z.object({
        metadata: characterImageMetadataSvgSchema,
        content_type: z.literal("image/svg+xml")
    })]).and(z.object({
    url: z.string()
}));

export const subjectMeaningSchema = z.object({
    accepted_answer: z.boolean(),
    meaning: z.string(),
    primary: z.boolean()
});

export const auxiliaryMeaningSchema = z.object({
    meaning: z.string(),
    type: z.string()
});

export const readingTypeSchema = z.union([z.literal("onyomi"), z.literal("kunyomi"), z.literal("nanori")]);

export const kanjiReadingSchema = z.object({
    accepted_answer: z.boolean(),
    primary: z.boolean(),
    reading: z.string(),
    type: readingTypeSchema
});

export const vocabularyReadingSchema = z.object({
    accepted_answer: z.boolean(),
    primary: z.boolean(),
    reading: z.string()
});

export const radicalDataSchema = z.object({
    amalgamation_subject_ids: z.array(z.number()),
    auxiliary_meanings: z.array(auxiliaryMeaningSchema),
    character_images: z.array(characterImageSchema),
    characters: z.string().nullable(),
    created_at: z.string(),
    document_url: z.string(),
    hidden_at: z.string().nullable(),
    lesson_position: z.number(),
    level: z.number(),
    meaning_mnemonic: z.string(),
    meanings: z.array(subjectMeaningSchema),
    slug: z.string(),
    spaced_repetition_system_id: z.number()
});

export const kanjiDataSchema = z.object({
    amalgamation_subject_ids: z.array(z.number()),
    auxiliary_meanings: z.array(auxiliaryMeaningSchema),
    characters: z.string(),
    component_subject_ids: z.array(z.number()),
    created_at: z.string(),
    document_url: z.string(),
    hidden_at: z.string().nullable(),
    lesson_position: z.number(),
    level: z.number(),
    meaning_hint: z.string().nullable(),
    meaning_mnemonic: z.string(),
    meanings: z.array(subjectMeaningSchema),
    reading_hint: z.string(),
    reading_mnemonic: z.string(),
    readings: z.array(kanjiReadingSchema),
    slug: z.string(),
    spaced_repetition_system_id: z.number(),
    visually_similar_subject_ids: z.array(z.number())
});

export const contextSentenceSchema = z.object({
    en: z.string(),
    ja: z.string()
});

export const pronunciationAudioMetadataSchema = z.object({
    gender: z.string(),
    pronunciation: z.string(),
    source_id: z.number(),
    voice_actor_id: z.number(),
    voice_actor_name: z.string(),
    voice_description: z.string()
});

export const pronunciationAudioSchema = z.object({
    content_type: z.string(),
    metadata: pronunciationAudioMetadataSchema,
    url: z.string()
});

export const vocabularyDataSchema = z.object({
    auxiliary_meanings: z.array(auxiliaryMeaningSchema),
    characters: z.string(),
    component_subject_ids: z.array(z.number()),
    context_sentences: z.array(contextSentenceSchema),
    created_at: z.string(),
    document_url: z.string(),
    hidden_at: z.string().nullable(),
    lesson_position: z.number(),
    level: z.number(),
    meaning_mnemonic: z.string(),
    meanings: z.array(subjectMeaningSchema),
    parts_of_speech: z.array(z.string()),
    pronunciation_audios: z.array(pronunciationAudioSchema),
    reading_mnemonic: z.string(),
    readings: z.array(vocabularyReadingSchema),
    slug: z.string(),
    spaced_repetition_system_id: z.number()
});

export const subjectDataOuterSchema = z.union([z.object({
        data: radicalDataSchema,
        object: z.literal("radical")
    }), z.object({
        data: kanjiDataSchema,
        object: z.literal("kanji")
    }), z.object({
        data: vocabularyDataSchema,
        object: z.literal("vocabulary")
    })]).and(z.object({
    id: z.number(),
    url: z.string(),
    data_updated_at: z.string()
}));
