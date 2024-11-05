mod routes;
mod templates;

#[tokio::main]
async fn main() {
    if let Err(e) = routes::save_as_static() {
        eprintln!("Failed to save static HTML: {}", e);
    }
}
