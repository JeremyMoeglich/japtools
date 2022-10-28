use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct CharacterImageMetadataSvg {
    pub inline_styles: bool,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct CharacterImageMetadataPng {
    pub color: String,
    pub dimensions: String,
    pub style_name: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
#[serde(tag = "content_type", content = "metadata")]
pub enum CharacterImageMetadata {
    #[serde(rename = "image/svg+xml")]
    Svg(CharacterImageMetadataSvg),
    #[serde(rename = "image/png")]
    Png(CharacterImageMetadataPng),
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct CharacterImage {
    #[serde(flatten)]
    pub metadata: CharacterImageMetadata,
    pub url: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct SubjectMeaning {
    pub accepted_answer: bool,
    pub meaning: String,
    pub primary: bool,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct AuxiliaryMeaning {
    pub meaning: String,
    #[serde(rename = "type")]
    pub meaning_type: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum ReadingType {
    Onyomi,
    Kunyomi,
    Nanori,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct KanjiReading {
    pub accepted_answer: bool,
    pub primary: bool,
    pub reading: String,
    #[serde(rename = "type")]
    pub reading_type: ReadingType,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct VocabularyReading {
    pub accepted_answer: bool,
    pub primary: bool,
    pub reading: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct RadicalData {
    pub amalgamation_subject_ids: Vec<u32>,
    pub auxiliary_meanings: Vec<AuxiliaryMeaning>,
    pub character_images: Vec<CharacterImage>,
    pub characters: Option<String>,
    pub created_at: String,
    pub document_url: String,
    pub hidden_at: Option<String>,
    pub lesson_position: u32,
    pub level: u32,
    pub meaning_mnemonic: String,
    pub meanings: Vec<SubjectMeaning>,
    pub slug: String,
    pub spaced_repetition_system_id: u32,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct KanjiData {
    pub amalgamation_subject_ids: Vec<u32>,
    pub auxiliary_meanings: Vec<AuxiliaryMeaning>,
    pub characters: String,
    pub component_subject_ids: Vec<u32>,
    pub created_at: String,
    pub document_url: String,
    pub hidden_at: Option<String>,
    pub lesson_position: u32,
    pub level: u32,
    pub meaning_hint: Option<String>,
    pub meaning_mnemonic: String,
    pub meanings: Vec<SubjectMeaning>,
    pub reading_hint: String,
    pub reading_mnemonic: String,
    pub readings: Vec<KanjiReading>,
    pub slug: String,
    pub spaced_repetition_system_id: u32,
    pub visually_similar_subject_ids: Vec<u32>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct ContextSentence {
    pub en: String,
    pub ja: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct PronunciationAudioMetadata {
    pub gender: String,
    pub pronunciation: String,
    pub source_id: u32,
    pub voice_actor_id: u32,
    pub voice_actor_name: String,
    pub voice_description: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct PronunciationAudio {
    pub content_type: String,
    pub metadata: PronunciationAudioMetadata,
    pub url: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct VocabularyData {
    pub auxiliary_meanings: Vec<AuxiliaryMeaning>,
    pub characters: String,
    pub component_subject_ids: Vec<u32>,
    pub context_sentences: Vec<ContextSentence>,
    pub created_at: String,
    pub document_url: String,
    pub hidden_at: Option<String>,
    pub lesson_position: u32,
    pub level: u32,
    pub meaning_mnemonic: String,
    pub meanings: Vec<SubjectMeaning>,
    pub parts_of_speech: Vec<String>,
    pub pronunciation_audios: Vec<PronunciationAudio>,
    pub reading_mnemonic: String,
    pub readings: Vec<VocabularyReading>,
    pub slug: String,
    pub spaced_repetition_system_id: u32,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
#[serde(tag = "object", content = "data")]
#[serde(rename_all = "lowercase")]
pub enum SubjectData {
    Radical(RadicalData),
    Kanji(KanjiData),
    Vocabulary(VocabularyData),
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct SubjectDataOuter {
    pub id: u32,
    pub url: String,
    pub data_updated_at: String,
    #[serde(flatten)]
    pub data: SubjectData,
}
