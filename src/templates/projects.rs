use crate::models::{Project, ProjectCategory};
use askama::Template;

#[derive(Template)]
#[template(path = "projects.html")]
pub struct ProjectsPage {
    pub software: Vec<Project>,
    pub hardware: Vec<Project>,
    pub both: Vec<Project>,
}

impl ProjectsPage {
    pub fn new(projects: Vec<Project>) -> Self {
        let mut software = Vec::new();
        let mut hardware = Vec::new();
        let mut both = Vec::new();

        for project in projects {
            match project.category {
                ProjectCategory::Software => software.push(project),
                ProjectCategory::Hardware => hardware.push(project),
                ProjectCategory::Both => both.push(project),
            }
        }

        Self { software, hardware, both }
    }

    pub fn render_results(&self) -> String {
        let mut sections = Vec::new();

        if !self.hardware.is_empty() {
            sections.push(format!(
                r#"<div class='project-section'>
      <h3>Hardware</h3>
      {}
    </div>"#,
                self.render_project_list(&self.hardware)
            ));
        }

        if !self.both.is_empty() {
            sections.push(format!(
                r#"<div class='project-section'>
      <h3>Hardware/Software</h3>
      {}
    </div>"#,
                self.render_project_list(&self.both)
            ));
        }

        if !self.software.is_empty() {
            sections.push(format!(
                r#"<div class='project-section'>
      <h3>Software</h3>
      {}
    </div>"#,
                self.render_project_list(&self.software)
            ));
        }

        format!(r#"<div class='project-split'>{}</div>"#, sections.join("\n"))
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
