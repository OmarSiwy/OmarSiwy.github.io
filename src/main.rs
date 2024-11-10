use axum::{http::StatusCode, response::Html, routing::get, Router, handler::HandlerWithoutStateExt};
use tower_http::services::ServeDir;

async fn handle_404() -> (StatusCode, &'static str) {
    (StatusCode::NOT_FOUND, "Not found")
}

#[tokio::main]
async fn main() {
    let service = handle_404.into_service();
    let serve_dir = ServeDir::new("static").not_found_service(service);
    let app = Router::new()
        .nest_service("/static", serve_dir.clone())
        .route("/", get(render_index));

    // Start the server
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    axum::serve(listener, app.into_make_service()).await.unwrap();
}

async fn render_index() -> Html<&'static str> {
    Html(
        r#"
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portfolio with WebAssembly</title>
        </head>
        <body id="wasm-example">
          <script type="module">
              import init from "/static/pkg/graphics.js";
              init().then(() => {
                  console.log("WASM Loaded");
              });
          </script>
        </body>
        </html>     
        "#
    )
}
