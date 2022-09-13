import type { SubjectType } from '@prisma/client';
import type { JsonObject } from 'type-fest';
import type { ReadingTypeType } from './datatypes';

interface LessonInterface<ID extends number> {
	subject_type: SubjectType;
	subject_id: ID;
	required_data: JsonObject;
	skill_level: number;
	lesson_type: string;
}

export interface ReadingAndMeaning<ID extends number> extends LessonInterface<ID> {
	subject_type: 'VOCABULARY' | 'KANJI';
	required_data: {
		readings: string[];
		meanings: string[];
		//excluded_subject_ids: number[];
		to: 'readings' | 'meanings';
	};
	lesson_type: 'reading_and_meaning';
}

export interface TextAndMeaning<ID extends number> extends LessonInterface<ID> {
	required_data: {
		text: string;
		meanings: string[];
		to: 'symbol' | 'meanings';
	};
	lesson_type: 'text_and_meaning';
}

export interface KanjiNanKunOnYomi<ID extends number> extends LessonInterface<ID> {
	subject_type: 'KANJI';
	required_data: {
		kanji: string;
		kunyomi: string[];
		onyomi: string[];
		nanori: string[];
	};
	lesson_type: 'kanji_nan_kun_on_yomi';
}

export interface VocabularyKunOnYomi<ID extends number> extends LessonInterface<ID> {
	subject_type: 'VOCABULARY';
	required_data: {
		vocabulary: string;
		string_map: (ReadingTypeType | 'NONE')[];
	};
	lesson_type: 'vocabulary_kun_on_yomi';
}

export type Lesson<ID extends number = number> =
	| ReadingAndMeaning<ID>
	| TextAndMeaning<ID>
	| KanjiNanKunOnYomi<ID>
	| VocabularyKunOnYomi<ID>;
