use askama::Template;

#[derive(Template)]
#[template(path = "main.html")]
pub struct TaskTemplate<'a> {
    pub tasks: &'a Vec<String>,
}
