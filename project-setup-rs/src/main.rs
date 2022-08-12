use dotenv::dotenv;
use indicatif::ProgressBar;
use itertools::Itertools;
use project_root::get_project_root;
use serde::{Deserialize, Serialize};
use serde_json::to_string;
use std::{collections::HashMap, env, error::Error, fs::{File, create_dir_all}, io::prelude::*};

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct CharacterImageMetadataSvg {
    inline_styles: bool,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct CharacterImageMetadataPng {
    color: String,
    dimensions: String,
    style_name: String,
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
    metadata: CharacterImageMetadata,
    url: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct SubjectMeaning {
    accepted_answer: bool,
    meaning: String,
    primary: bool,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct AuxiliaryMeaning {
    meaning: String,
    #[serde(rename = "type")]
    meaning_type: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
#[serde(rename_all = "lowercase")]
enum ReadingType {
    Onyomi,
    Kunyomi,
    Nanori,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct KanjiReading {
    accepted_answer: bool,
    primary: bool,
    reading: String,
    #[serde(rename = "type")]
    reading_type: ReadingType,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct VocabularyReading {
    accepted_answer: bool,
    primary: bool,
    reading: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct RadicalData {
    amalgamation_subject_ids: Vec<u32>,
    auxiliary_meanings: Vec<AuxiliaryMeaning>,
    character_images: Vec<CharacterImage>,
    characters: Option<String>,
    created_at: String,
    document_url: String,
    hidden_at: Option<String>,
    lesson_position: u32,
    level: u32,
    meaning_mnemonic: String,
    meanings: Vec<SubjectMeaning>,
    slug: String,
    spaced_repetition_system_id: u32,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct KanjiData {
    amalgamation_subject_ids: Vec<u32>,
    auxiliary_meanings: Vec<AuxiliaryMeaning>,
    characters: String,
    component_subject_ids: Vec<u32>,
    created_at: String,
    document_url: String,
    hidden_at: Option<String>,
    lesson_position: u32,
    level: u32,
    meaning_hint: Option<String>,
    meaning_mnemonic: String,
    meanings: Vec<SubjectMeaning>,
    reading_hint: String,
    reading_mnemonic: String,
    readings: Vec<KanjiReading>,
    slug: String,
    spaced_repetition_system_id: u32,
    visually_similar_subject_ids: Vec<u32>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct ContextSentence {
    en: String,
    ja: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct PronunciationAudioMetadata {
    gender: String,
    pronunciation: String,
    source_id: u32,
    voice_actor_id: u32,
    voice_actor_name: String,
    voice_description: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct PronunciationAudio {
    content_type: String,
    metadata: PronunciationAudioMetadata,
    url: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct VocabularyData {
    auxiliary_meanings: Vec<AuxiliaryMeaning>,
    characters: String,
    component_subject_ids: Vec<u32>,
    context_sentences: Vec<ContextSentence>,
    created_at: String,
    document_url: String,
    hidden_at: Option<String>,
    lesson_position: u32,
    level: u32,
    meaning_mnemonic: String,
    meanings: Vec<SubjectMeaning>,
    parts_of_speech: Vec<String>,
    pronunciation_audios: Vec<PronunciationAudio>,
    reading_mnemonic: String,
    readings: Vec<VocabularyReading>,
    slug: String,
    spaced_repetition_system_id: u32,
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
    id: u32,
    url: String,
    data_updated_at: String,
    #[serde(flatten)]
    data: SubjectData,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct Pages {
    next_url: Option<String>,
    per_page: u32,
    previous_url: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct RequestData {
    data: Vec<SubjectDataOuter>,
    data_updated_at: String,
    object: String,
    url: String,
    total_count: u32,
    pages: Pages,
}

pub async fn get_wanikani_data() -> Result<HashMap<u32, SubjectDataOuter>, Box<dyn Error>> {
    let client = reqwest::Client::new();

    let mut values = Vec::new();
    let progress_bar = ProgressBar::new(60);
    let wanikani_token = env::var("WANIKANI_TOKEN").expect(
        r#"
            WANIKANI_TOKEN must be set, example for .env (not valid): 
            WANIKANI_TOKEN = "Bearer d57b2ff1-211f-4f6d-a078-bc01447d0235"
        "#);
    if !wanikani_token.starts_with("Bearer ") {
        panic!("WANIKANI_TOKEN must start with 'Bearer '");
    }
    for i in progress_bar.wrap_iter(1..=60) {
        let resp = client
            .get(format!("https://api.wanikani.com/v2/subjects?levels={}", i))
            .header("Authorization", &wanikani_token)
            .send()
            .await?;

        let text = resp.text().await?;
        let value: RequestData = serde_json::from_str(&text)?;
        values.push(value);
    }

    let subject_vector = values.iter().flat_map(|x| x.data.clone()).collect_vec();
    let subject_map = subject_vector
        .into_iter()
        .map(|x| (x.id, x))
        .collect::<HashMap<u32, SubjectDataOuter>>();

    Ok(subject_map)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    match dotenv().ok() {
        Some(_) => (),
        None => {
            panic!("No .env file found");
        }
    }

    let data = to_string(&get_wanikani_data().await?)?;
    let root_path = get_project_root()?;
    let file_path = root_path.join("../src/lib/data/wanikani_data.json");
    create_dir_all(file_path.parent().unwrap())?;
    println!("Writing to {}", file_path.display());
    let mut file = File::create(file_path)?;
    file.write_all(data.as_bytes())?;
    Ok(())
}
