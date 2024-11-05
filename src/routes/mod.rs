use axum::response::Html;
use std::fs;
use std::io::Result;
use askama::Template;
use crate::templates::IndexTemplate;

// Route handler to render the index page
pub async fn render_index() -> Html<String> {
    let template = IndexTemplate {
        title: "Portfolio",
        heading: "Welcome to My Portfolio",
        description: "This is a statically generated page served on GitHub Pages.",
    };

    Html(template.render().unwrap())
}

// Function to render the template and save it as a static HTML file
pub fn save_as_static() -> Result<()> {
    let template = IndexTemplate {
        title: "Portfolio",
        heading: "Welcome to My Portfolio",
        description: "This is a statically generated page served on GitHub Pages.",
    };

    // Render the template and save it to the `dist` folder
    let rendered_html = template.render().unwrap();
    fs::create_dir_all("dist")?;
    fs::write("dist/index.html", rendered_html)?;
    Ok(())
}
