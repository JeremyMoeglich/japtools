import type { SubjectDataOuter } from './wanikani_data';
import type { JsonObject } from 'type-fest';

interface LessonInterface<ID extends number> {
	subject_type: SubjectDataOuter['object'];
	subject_id: ID;
	required_data: JsonObject;
	skill_level: number;
    lesson_type: string;
}

export interface ReadingAndMeaning<ID extends number> extends LessonInterface<ID> {
	subject_type: 'vocabulary' | 'kanji';
	required_data: {
		reading: string;
		meaning: string;
		excluded_subject_ids: number[];
        to: 'reading' | 'meaning';
	};
    lesson_type: 'reading_and_meaning';
}

export interface SymbolAndMeaning<ID extends number> extends LessonInterface<ID> {
	required_data: {
		symbol: string;
		meaning: string;
        to: 'symbol' | 'meaning';
	};
    lesson_type: 'symbol_and_meaning';
}

export interface KanjiKunOnYomi<ID extends number> extends LessonInterface<ID> {
	subject_type: 'kanji';
	required_data: {
		kanji: string;
		kunyomi: string[];
		onyomi: string[];
	};
    lesson_type: 'kanji_kun_on_yomi';
}

export interface VocabularyKunOnYomi<ID extends number> extends LessonInterface<ID> {
	subject_type: 'vocabulary';
	required_data: {
		vocabulary: string;
		kanji_map: Record<
			string,
			{
				kanji: string;
				form: 'kunyomi' | 'onyomi';
				reading: string[];
			}
		>;
	};
    lesson_type: 'vocabulary_kun_on_yomi';
}

export type Lesson<ID extends number = number> =
	| ReadingAndMeaning<ID>
	| SymbolAndMeaning<ID>
	| KanjiKunOnYomi<ID>
	| VocabularyKunOnYomi<ID>;
