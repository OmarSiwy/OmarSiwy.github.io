use crate::models::{Project, ProjectCategory};
use askama::Template;

#[derive(Template)]
#[template(path = "projects.html")]
pub struct ProjectsPage {
    pub software: Vec<Project>,
    pub hardware: Vec<Project>,
}

impl ProjectsPage {
    pub fn new(projects: Vec<Project>) -> Self {
        let software = projects
            .iter()
            .filter(|p| p.category == ProjectCategory::Software)
            .cloned()
            .collect();

        let hardware = projects
            .iter()
            .filter(|p| p.category == ProjectCategory::Hardware)
            .cloned()
            .collect();

        Self { software, hardware }
    }
}
