use crate::models::{Project, ProjectCategory};
use askama::Template;

#[derive(Template)]
#[template(path = "projects.html")]
pub struct ProjectsPage {
    pub software: Vec<Project>,
    pub hardware: Vec<Project>,
}

impl ProjectsPage {
    pub fn new(hardware: Vec<Project>, software: Vec<Project>) -> Self {
        Self { software, hardware }
    }

    pub fn render_results(&self) -> String {
        format!(
            r#"<div class='project-split'>
    <div class='project-section'>
      <h3>Hardware</h3>
      {}
    </div>
    <div class='project-section'>
      <h3>Software</h3>
      {}
    </div>
  </div>"#,
            self.render_project_list(&self.hardware),
            self.render_project_list(&self.software)
        )
    }

    fn render_project_list(&self, projects: &[Project]) -> String {
        projects
            .iter()
            .map(|p| {
                let image = p.image.as_ref().map(|img| {
                    format!(r#"<img src='{}' alt='{}' class='project-image'>"#, img, p.name)
                }).unwrap_or_default();

                let link = p.link.as_ref().map(|url| {
                    format!(r#"<small><a href='{}' target='_blank' rel='noopener'>View →</a></small>"#, url)
                }).unwrap_or_default();

                format!(
                    r#"<div class='project-card'>
        {}
        <p>{}</p>
        <div class='tech'>{}</div>
        {}
      </div>"#,
                    image,
                    p.description,
                    p.tech.join(", "),
                    link
                )
            })
            .collect::<Vec<_>>()
            .join("\n")
    }
}
