use askama::Template;
use axum::{
    response::Html,
    routing::get,
    Router,
};
use std::fs;
use std::net::SocketAddr;

#[derive(Template)]
#[template(path = "main.html")]
struct IndexTemplate<'a> {
    title: &'a str,
    heading: &'a str,
    description: &'a str,
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(render_index));

    // Render and save the HTML statically
    save_static_index().expect("Failed to save static HTML");

    // Run the Axum server locally for testing (optional)
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Listening on http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

// Route handler to render the index page
async fn render_index() -> Html<String> {
    let template = IndexTemplate {
        title: "Portfolio",
        heading: "Welcome to My Portfolio",
        description: "This is a statically generated page served on GitHub Pages.",
    };

    Html(template.render().unwrap())
}

// Function to render the template and save as a static HTML file
fn save_static_index() -> Result<(), std::io::Error> {
    let template = IndexTemplate {
        title: "Portfolio",
        heading: "Welcome to My Portfolio",
        description: "This is a statically generated page served on GitHub Pages.",
    };

    // Render the template and save to the dist folder
    let rendered_html = template.render().unwrap();
    fs::create_dir_all("dist")?;
    fs::write("dist/index.html", rendered_html)?;
    Ok(())
}
