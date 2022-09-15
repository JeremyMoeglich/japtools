use dotenv::dotenv;
use loader::load_wanikani_data;
use std::error::Error;
use upload::upload_to_db;

mod db;
mod loader;
mod schema;
mod upload;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    match dotenv().ok() {
        Some(_) => (),
        None => {
            panic!("No .env file found");
        }
    }

    let map = load_wanikani_data().await?;
    upload_to_db(map).await?;

    Ok(())
}
