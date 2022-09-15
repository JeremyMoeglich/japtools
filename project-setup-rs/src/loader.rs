use std::{collections::HashMap, env, error::Error, path::Path};

use indicatif::ProgressBar;
use itertools::Itertools;
use serde::{Deserialize, Serialize};
use tokio::{
    fs::File,
    io::{AsyncReadExt, AsyncWriteExt},
};

use crate::schema::SubjectDataOuter;

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
