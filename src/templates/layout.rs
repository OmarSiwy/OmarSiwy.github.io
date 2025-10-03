use askama::Template;

#[derive(Template)]
#[template(path = "layout.html")]
pub struct Layout {
    pub title: String,
    pub page: String,
    pub content: String,
}
