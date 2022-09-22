use std::{collections::HashMap, error::Error, sync::Arc};
use tokio_stream::{self as stream};

use futures_util::StreamExt;
use indicatif::ProgressBar;
use itertools::Itertools;

use crate::{
    db::{self},
    schema::{CharacterImageMetadata, ReadingType, SubjectData, SubjectDataOuter},
};

pub async fn upload_to_db(map: HashMap<u32, SubjectDataOuter>) -> Result<(), Box<dyn Error>> {
    let client = Arc::new(db::new_client().await.expect("Failed to create client"));
    println!("Deleting old data...");
    client
        .subject_index()
        .delete_many(vec![db::subject_index::subject_id::gte(0)])
        .exec()
        .await?;
    client
        .kanji_subject()
        .delete_many(vec![db::kanji_subject::id::gte(0)])
        .exec()
        .await?;
    client
        .radical_subject()
        .delete_many(vec![db::radical_subject::id::gte(0)])
        .exec()
        .await?;
    client
        .vocabulary_subject()
        .delete_many(vec![db::vocabulary_subject::id::gte(0)])
        .exec()
        .await?;

    println!("Uploading new data...");
    
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
                        vec![
                            db::subject_index::readings::set(match &subject.data {
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
                            }),
                            db::subject_index::meanings::set(match &subject.data {
                                SubjectData::Radical(_) => vec![],
                                SubjectData::Kanji(data) => data
                                    .meanings
                                    .iter()
                                    .map(|x| x.meaning.clone())
                                    .collect_vec(),
                                SubjectData::Vocabulary(data) => data
                                    .meanings
                                    .iter()
                                    .map(|x| x.meaning.clone())
                                    .collect_vec(),
                            }),
                        ],
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
                            .subject_meaning()
                            .create_many(
                                kanji_data
                                    .meanings
                                    .iter()
                                    .map(|meaning| {
                                        db::subject_meaning::create(
                                            meaning.accepted_answer,
                                            meaning.meaning.clone(),
                                            meaning.primary,
                                            vec![db::subject_meaning::kanji_subject_id::set(Some(
                                                subject.id as i32,
                                            ))],
                                        )
                                    })
                                    .collect_vec(),
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
                                    db::radical_subject::image_url::set({
                                        let v =
                                            &radical_data.character_images.iter().max_by_key(|x| {
                                                match &x.metadata {
                                                    CharacterImageMetadata::Png(data) => {
                                                        let dimensions = {
                                                            let split = data.dimensions.split('x');
                                                            let mut split = split
                                                                .map(|x| x.parse::<u32>().unwrap());
                                                            (
                                                                split.next().unwrap(),
                                                                split.next().unwrap(),
                                                            )
                                                        };
                                                        dimensions.0 * dimensions.1
                                                    }
                                                    _ => 0,
                                                }
                                            });
                                        let url = match v {
                                            Some(x) => match &x.metadata {
                                                CharacterImageMetadata::Png(_) => {
                                                    Some(x.url.clone())
                                                }
                                                _ => None,
                                            },
                                            None => None,
                                        };

                                        url
                                    }),
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
