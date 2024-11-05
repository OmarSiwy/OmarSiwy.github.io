use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;

mod routes;
mod templates;

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(routes::render_index));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    println!("Listening on http://{}", addr);

    let server = tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    if let Err(e) = routes::save_as_static() {
        eprintln!("Failed to save static HTML: {}", e);
    }
    let _ = server.await;
}
