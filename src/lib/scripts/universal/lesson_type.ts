import { SubjectDataOuter } from './wanikani_data';
import { JsonObject } from 'type-fest';

interface LessonInterface {
	subject_type: SubjectDataOuter['object'];
	subject_id: number;
	required_data: JsonObject;
}

interface ReadingAndMeaning extends LessonInterface {
    subject_type: 'vocabulary' | 'kanji';
    required_data: {
        reading: string;
        meaning: string;
        excluded_subject_ids: number[];
    };
}

interface SymbolAndMeaning extends LessonInterface {
    required_data: {
        symbol: string;
        meaning: string;
    };
}

interface KanjiKunOnYomi extends LessonInterface {
    subject_type: 'kanji';
    required_data: {
        kanji: string;
        kunyomi: string;
        onyomi: string;
    };
}

interface VocabularyKunOnYomi extends LessonInterface {
    subject_type: 'vocabulary';
    required_data: {
        vocabulary: string;
        kanji_map: Record<string, {
            kanji: string;
            form: 'kunyomi' | 'onyomi';
            reading: string;
        }>;
    }
}

export type Lesson = ReadingAndMeaning | SymbolAndMeaning | KanjiKunOnYomi | VocabularyKunOnYomi;