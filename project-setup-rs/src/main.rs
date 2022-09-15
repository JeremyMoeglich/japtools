use dotenv::dotenv;
use futures_util::StreamExt;
use indicatif::ProgressBar;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, env, error::Error, path::Path, sync::Arc};
use tokio::{
    fs::File,
    io::{AsyncReadExt, AsyncWriteExt},
};
use tokio_stream::{self as stream};

mod db;

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

pub async fn fetch_wanikani_data() -> Result<HashMap<u32, SubjectDataOuter>, Box<dyn Error>> {
    let client = reqwest::Client::new();

    let mut values = Vec::new();
    let progress_bar = ProgressBar::new(60);
    let wanikani_token = env::var("WANIKANI_TOKEN").expect(
        r#"
            WANIKANI_TOKEN must be set, example for .env (not valid): 
            WANIKANI_TOKEN = "Bearer d57b2ff1-211f-4f6d-a078-bc01447d0235"
        "#,
    );
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

    progress_bar.finish();
    let subject_vector = values.iter().flat_map(|x| x.data.clone()).collect_vec();
    let subject_map = subject_vector
        .into_iter()
        .map(|x| (x.id, x))
        .collect::<HashMap<u32, SubjectDataOuter>>();

    let mut file = File::create("wanikani.json").await?;
    file.write_all(serde_json::to_string(&subject_map).unwrap().as_bytes())
        .await?;

    Ok(subject_map)
}

pub async fn load_wanikani_data() -> Result<HashMap<u32, SubjectDataOuter>, Box<dyn Error>> {
    let filename = "wanikani.json";
    if Path::new(filename).exists() {
        let mut file = File::open(filename).await?;
        let mut contents = String::new();
        file.read_to_string(&mut contents).await?;
        let subject_map: HashMap<u32, SubjectDataOuter> = serde_json::from_str(&contents)?;
        Ok(subject_map)
    } else {
        fetch_wanikani_data().await
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    match dotenv().ok() {
        Some(_) => (),
        None => {
            panic!("No .env file found");
        }
    }

    let map = Arc::new(load_wanikani_data().await?);
    let client = Arc::new(db::new_client().await.expect("Failed to create client"));

    //write json to file tokio

    let mut tasks = stream::iter(map.clone().iter().map(|x| x.1.clone()).collect_vec())
        .map(|subject| {
            let client = client.clone();
            tokio::spawn(async move {
                let index_exists = client
                    .subject_index()
                    .find_unique(db::subject_index::subject_id::equals(subject.id as i32))
                    .exec()
                    .await
                    .unwrap();

                match &index_exists {
                    Some(index) => match index.subject_type {
                        db::SubjectType::Radical => {
                            match client
                                .radical_subject()
                                .delete(db::radical_subject::id::equals(index.subject_id as i32))
                                .exec()
                                .await
                            {
                                Ok(_) => (),
                                Err(e) => println!("Error deleting radical: {}", e),
                            }
                        }
                        db::SubjectType::Kanji => {
                            match client
                                .kanji_subject()
                                .delete(db::kanji_subject::id::equals(index.subject_id as i32))
                                .exec()
                                .await
                            {
                                Ok(_) => (),
                                Err(e) => println!("Error deleting kanji: {}", e),
                            }
                        }
                        db::SubjectType::Vocabulary => {
                            match client
                                .vocabulary_subject()
                                .delete(db::vocabulary_subject::id::equals(index.subject_id as i32))
                                .exec()
                                .await
                            {
                                Ok(_) => (),
                                Err(e) => println!("Error deleting vocabulary: {}", e),
                            }
                        }
                    },
                    None => (),
                }

                if let Some(index) = index_exists {
                    match client
                        .subject_index()
                        .delete(db::subject_index::subject_id::equals(
                            index.subject_id as i32,
                        ))
                        .exec()
                        .await
                    {
                        Ok(_) => (),
                        Err(e) => println!("Error deleting index: {}", e),
                    }
                }
                client
                    .subject_index()
                    .create(
                        match &subject.data {
                            SubjectData::Radical(_) => db::SubjectType::Radical,
                            SubjectData::Kanji(_) => db::SubjectType::Kanji,
                            SubjectData::Vocabulary(_) => db::SubjectType::Vocabulary,
                        },
                        subject.id as i32,
                        match &subject.data {
                            SubjectData::Radical(data) => data.level as i32,
                            SubjectData::Kanji(data) => data.level as i32,
                            SubjectData::Vocabulary(data) => data.level as i32,
                        },
                        vec![db::subject_index::readings::set(match &subject.data {
                            SubjectData::Radical(_) => vec![],
                            SubjectData::Kanji(data) => data
                                .readings
                                .iter()
                                .map(|x| x.reading.clone())
                                .collect_vec(),
                            SubjectData::Vocabulary(data) => data
                                .readings
                                .iter()
                                .map(|x| x.reading.clone())
                                .collect_vec(),
                        })],
                    )
                    .exec()
                    .await
                    .unwrap();
                match &subject.data {
                    SubjectData::Kanji(kanji_data) => {
                        client
                            .kanji_subject()
                            .create(
                                subject.id as i32,
                                kanji_data.characters.clone(),
                                kanji_data.lesson_position as i32,
                                kanji_data.level as i32,
                                kanji_data.meaning_mnemonic.clone(),
                                kanji_data.reading_hint.clone(),
                                kanji_data.reading_mnemonic.clone(),
                                vec![
                                    db::kanji_subject::meaning_hint::set(
                                        kanji_data.meaning_hint.clone(),
                                    ),
                                    db::kanji_subject::amalgamation_subject_ids::set(
                                        kanji_data
                                            .amalgamation_subject_ids
                                            .iter()
                                            .map(|x| *x as i32)
                                            .collect(),
                                    ),
                                    db::kanji_subject::component_subject_ids::set(
                                        kanji_data
                                            .component_subject_ids
                                            .iter()
                                            .map(|x| *x as i32)
                                            .collect(),
                                    ),
                                    db::kanji_subject::visually_similar_subject_ids::set(
                                        kanji_data
                                            .visually_similar_subject_ids
                                            .iter()
                                            .map(|x| *x as i32)
                                            .collect(),
                                    ),
                                ],
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .kanji_reading()
                            .create_many(
                                kanji_data
                                    .readings
                                    .iter()
                                    .map(|reading| {
                                        db::kanji_reading::create(
                                            reading.reading.clone(),
                                            match reading.reading_type {
                                                ReadingType::Onyomi => db::ReadingType::Onyomi,
                                                ReadingType::Kunyomi => db::ReadingType::Kunyomi,
                                                ReadingType::Nanori => db::ReadingType::Nanori,
                                            },
                                            reading.primary,
                                            vec![db::kanji_reading::kanji_subject_id::set(Some(
                                                subject.id as i32,
                                            ))],
                                        )
                                    })
                                    .collect(),
                            )
                            .exec()
                            .await
                            .unwrap();

                        client
                            .auxiliary_meaning()
                            .create_many(
                                kanji_data
                                    .auxiliary_meanings
                                    .iter()
                                    .map(|auxiliary_meaning| {
                                        db::auxiliary_meaning::create(
                                            auxiliary_meaning.meaning.clone(),
                                            auxiliary_meaning.meaning_type.clone(),
                                            vec![db::auxiliary_meaning::kanji_subject_id::set(
                                                Some(subject.id as i32),
                                            )],
                                        )
                                    })
                                    .collect(),
                            )
                            .exec()
                            .await
                            .unwrap();

                        client
                            .auxiliary_meaning()
                            .create_many(
                                kanji_data
                                    .auxiliary_meanings
                                    .iter()
                                    .map(|auxiliary_meaning| {
                                        db::auxiliary_meaning::create(
                                            auxiliary_meaning.meaning.clone(),
                                            auxiliary_meaning.meaning_type.clone(),
                                            vec![db::auxiliary_meaning::kanji_subject_id::set(
                                                Some(subject.id as i32),
                                            )],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                    }
                    SubjectData::Radical(radical_data) => {
                        client
                            .radical_subject()
                            .create(
                                subject.id as i32,
                                radical_data.lesson_position as i32,
                                radical_data.level as i32,
                                radical_data.meaning_mnemonic.clone(),
                                vec![
                                    db::radical_subject::characters::set(
                                        radical_data.characters.clone(),
                                    ),
                                    db::radical_subject::amalgamation_subject_ids::set(
                                        radical_data
                                            .amalgamation_subject_ids
                                            .iter()
                                            .map(|x| *x as i32)
                                            .collect(),
                                    ),
                                    db::radical_subject::image_url::set(
                                        match radical_data
                                            .character_images
                                            .iter()
                                            .map(|x| Some(x))
                                            .find(|x| match &x.unwrap().metadata {
                                                CharacterImageMetadata::Svg(data) => {
                                                    data.inline_styles
                                                }
                                                _ => false,
                                            })
                                            .unwrap_or({
                                                let v = &radical_data
                                                    .character_images
                                                    .iter()
                                                    .max_by_key(|x| match &x.metadata {
                                                        CharacterImageMetadata::Png(data) => {
                                                            let dimensions = {
                                                                let split =
                                                                    data.dimensions.split('x');
                                                                let mut split = split.map(|x| {
                                                                    x.parse::<u32>().unwrap()
                                                                });
                                                                (
                                                                    split.next().unwrap(),
                                                                    split.next().unwrap(),
                                                                )
                                                            };
                                                            dimensions.0 * dimensions.1
                                                        }
                                                        _ => 0,
                                                    });
                                                match v {
                                                    Some(x) => match &x.metadata {
                                                        CharacterImageMetadata::Png(_) => {
                                                            Some(x)
                                                        }
                                                        _ => None,
                                                    },
                                                    None => None,
                                                }
                                            }) {
                                            Some(x) => Some(x.url.clone()),
                                            None => None,
                                        },
                                    ),
                                ],
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .auxiliary_meaning()
                            .create_many(
                                radical_data
                                    .auxiliary_meanings
                                    .iter()
                                    .map(|auxiliary_meaning| {
                                        db::auxiliary_meaning::create(
                                            auxiliary_meaning.meaning.clone(),
                                            auxiliary_meaning.meaning_type.clone(),
                                            vec![db::auxiliary_meaning::radical_subject_id::set(
                                                Some(subject.id as i32),
                                            )],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .subject_meaning()
                            .create_many(
                                radical_data
                                    .meanings
                                    .iter()
                                    .map(|meaning| {
                                        db::subject_meaning::create(
                                            meaning.accepted_answer,
                                            meaning.meaning.clone(),
                                            meaning.primary,
                                            vec![db::subject_meaning::radical_subject_id::set(
                                                Some(subject.id as i32),
                                            )],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                    }
                    SubjectData::Vocabulary(vocabulary_data) => {
                        client
                            .vocabulary_subject()
                            .create(
                                subject.id as i32,
                                vocabulary_data.characters.clone(),
                                vocabulary_data.lesson_position as i32,
                                vocabulary_data.level as i32,
                                vocabulary_data.meaning_mnemonic.clone(),
                                vocabulary_data.reading_mnemonic.clone(),
                                vec![db::vocabulary_subject::component_subject_ids::set(
                                    vocabulary_data
                                        .component_subject_ids
                                        .iter()
                                        .map(|x| *x as i32)
                                        .collect(),
                                )],
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .auxiliary_meaning()
                            .create_many(
                                vocabulary_data
                                    .auxiliary_meanings
                                    .iter()
                                    .map(|auxiliary_meaning| {
                                        db::auxiliary_meaning::create(
                                            auxiliary_meaning.meaning.clone(),
                                            auxiliary_meaning.meaning_type.clone(),
                                            vec![
                                                db::auxiliary_meaning::vocabulary_subject_id::set(
                                                    Some(subject.id as i32),
                                                ),
                                            ],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .context_sentence()
                            .create_many(
                                vocabulary_data
                                    .context_sentences
                                    .iter()
                                    .map(|context_sentence| {
                                        db::context_sentence::create(
                                            context_sentence.en.clone(),
                                            context_sentence.ja.clone(),
                                            vec![db::context_sentence::vocabulary_subject_id::set(
                                                Some(subject.id as i32),
                                            )],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .subject_meaning()
                            .create_many(
                                vocabulary_data
                                    .meanings
                                    .iter()
                                    .map(|meaning| {
                                        db::subject_meaning::create(
                                            meaning.accepted_answer,
                                            meaning.meaning.clone(),
                                            meaning.primary,
                                            vec![db::subject_meaning::vocabulary_subject_id::set(
                                                Some(subject.id as i32),
                                            )],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                        client
                            .vocabulary_reading()
                            .create_many(
                                vocabulary_data
                                    .readings
                                    .iter()
                                    .map(|reading| {
                                        db::vocabulary_reading::create(
                                            reading.reading.clone(),
                                            reading.accepted_answer,
                                            reading.primary,
                                            vec![
                                                db::vocabulary_reading::vocabulary_subject_id::set(
                                                    Some(subject.id as i32),
                                                ),
                                            ],
                                        )
                                    })
                                    .collect_vec(),
                            )
                            .exec()
                            .await
                            .unwrap();
                    }
                };
            })
        })
        .buffer_unordered(300);

    let progress_bar = ProgressBar::new(map.len() as u64);

    while let Some(res) = tasks.next().await {
        res.unwrap();
        progress_bar.inc(1);
    }
    progress_bar.finish();

    Ok(())
}
