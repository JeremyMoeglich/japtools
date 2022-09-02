export interface CharacterImageMetadataSvg {
	inline_styles: boolean;
}

export interface CharacterImageMetadataPng {
	color: string;
	dimensions: string;
	style_name: string;
}

export type CharacterImage = (
	| {
			metadata: CharacterImageMetadataPng;
			content_type: 'image/png';
	  }
	| {
			metadata: CharacterImageMetadataSvg;
			content_type: 'image/svg+xml';
	  }
) & {
	url: string;
};

export interface SubjectMeaning {
	accepted_answer: boolean;
	meaning: string;
	primary: boolean;
}

export interface AuxiliaryMeaning {
	meaning: string;
	type: string;
}

export type ReadingType = 'onyomi' | 'kunyomi' | 'nanori';

export interface KanjiReading {
	accepted_answer: boolean;
	primary: boolean;
	reading: string;
	type: ReadingType;
}

export interface VocabularyReading {
	accepted_answer: boolean;
	primary: boolean;
	reading: string;
}

export interface RadicalData {
	amalgamation_subject_ids: Array<number>;
	auxiliary_meanings: Array<AuxiliaryMeaning>;
	character_images: Array<CharacterImage>;
	characters: string | null;
	created_at: string;
	document_url: string;
	hidden_at: string | null;
	lesson_position: number;
	level: number;
	meaning_mnemonic: string;
	meanings: Array<SubjectMeaning>;
	slug: string;
	spaced_repetition_system_id: number;
}

export interface KanjiData {
	amalgamation_subject_ids: Array<number>;
	auxiliary_meanings: Array<AuxiliaryMeaning>;
	characters: string;
	component_subject_ids: Array<number>;
	created_at: string;
	document_url: string;
	hidden_at: string | null;
	lesson_position: number;
	level: number;
	meaning_hint: string | null;
	meaning_mnemonic: string;
	meanings: Array<SubjectMeaning>;
	reading_hint: string;
	reading_mnemonic: string;
	readings: Array<KanjiReading>;
	slug: string;
	spaced_repetition_system_id: number;
	visually_similar_subject_ids: Array<number>;
}

export interface ContextSentence {
	en: string;
	ja: string;
}

export interface PronunciationAudioMetadata {
	gender: string;
	pronunciation: string;
	source_id: number;
	voice_actor_id: number;
	voice_actor_name: string;
	voice_description: string;
}

export interface PronunciationAudio {
	content_type: string;
	metadata: PronunciationAudioMetadata;
	url: string;
}

export interface VocabularyData {
	auxiliary_meanings: Array<AuxiliaryMeaning>;
	characters: string;
	component_subject_ids: Array<number>;
	context_sentences: Array<ContextSentence>;
	created_at: string;
	document_url: string;
	hidden_at: string | null;
	lesson_position: number;
	level: number;
	meaning_mnemonic: string;
	meanings: Array<SubjectMeaning>;
	parts_of_speech: Array<string>;
	pronunciation_audios: Array<PronunciationAudio>;
	reading_mnemonic: string;
	readings: Array<VocabularyReading>;
	slug: string;
	spaced_repetition_system_id: number;
}

export type SubjectDataOuter = (
	| {
			data: RadicalData;
			object: 'radical';
	  }
	| {
			data: KanjiData;
			object: 'kanji';
	  }
	| {
			data: VocabularyData;
			object: 'vocabulary';
	  }
) & {
	id: number;
	url: string;
	data_updated_at: string;
};
