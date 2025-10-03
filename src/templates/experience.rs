use askama::Template;
use crate::models::Experience;

#[derive(Template)]
#[template(path = "experience.html")]
pub struct ExperiencePage {
    pub experiences: Vec<Experience>,
}

impl ExperiencePage {
    pub fn new(experiences: Vec<Experience>) -> Self {
        Self { experiences }
    }
}
