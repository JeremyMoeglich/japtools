import type { SubjectType } from '@prisma/client/edge';
import type { JsonObject } from 'type-fest';
import type { ReadingTypeType } from './datatypes';

interface LessonInterface<ID extends number> {
	subject_type: SubjectType;
	subject_id: ID;
	required_data: JsonObject;
	skill_level: number;
	lesson_type: string;
	need_input: boolean;
	preferred_tab: 'Readings' | 'Meanings';
}

export type ReadingAndMeaning<ID extends number> = {
	subject_type: 'VOCABULARY' | 'KANJI';
	subject_id: ID;
	skill_level: number;
	lesson_type: 'reading_and_meaning';
	need_input: true;
} & (
	| {
			required_data: {
				readings: string[];
				meanings: string[];
				//excluded_subject_ids: number[];
				to: 'readings';
			};
			preferred_tab: 'Readings';
	  }
	| {
			required_data: {
				readings: string[];
				meanings: string[];
				//excluded_subject_ids: number[];
				to: 'meanings';
			};
			preferred_tab: 'Meanings';
	  }
);

export type TextAndMeaning<ID extends number> = {
	lesson_type: 'text_and_meaning';
	need_input: true;
	skill_level: number;
	subject_id: ID;
} & (
	| {
			subject_type: 'VOCABULARY' | 'KANJI';
			required_data: {
				to: 'meanings';
				meanings: string[];
				text: string;
			};
			preferred_tab: 'Meanings';
	  }
	| {
			subject_type: 'VOCABULARY' | 'KANJI';
			required_data: {
				to: 'symbol';
				readings: string[];
				meanings: string[];
				text: string;
			};
			preferred_tab: 'Readings';
	  }
	| {
			subject_type: 'RADICAL';
			required_data: {
				meanings: string[];
				to: 'meanings';
			} & (
				| {
						text: string;
				  }
				| {
						image_url: string;
				  }
			);
			preferred_tab: 'Meanings';
	  }
);

export interface KanjiNanKunOnYomi<ID extends number> extends LessonInterface<ID> {
	subject_type: 'KANJI';
	required_data: {
		kanji: string;
		kunyomi: string[];
		onyomi: string[];
		nanori: string[];
	};
	lesson_type: 'kanji_nan_kun_on_yomi';
	need_input: false;
	preferred_tab: 'Readings';
}

export interface VocabularyKunOnYomi<ID extends number> extends LessonInterface<ID> {
	subject_type: 'VOCABULARY';
	required_data: {
		vocabulary: string;
		string_map: (ReadingTypeType | 'NONE')[];
	};
	lesson_type: 'vocabulary_kun_on_yomi';
	need_input: false;
	preferred_tab: 'Readings';
}

export type Lesson<ID extends number = number> =
	| ReadingAndMeaning<ID>
	| TextAndMeaning<ID>
	//| KanjiNanKunOnYomi<ID>
	| VocabularyKunOnYomi<ID>;
