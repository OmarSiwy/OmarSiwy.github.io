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

        Self {
            software,
            hardware,
            both,
        }
    }

    pub fn render_results(&self) -> String {
        let mut result = String::new();

        // Hardware and Software sections (side-by-side)
        if !self.hardware.is_empty() || !self.software.is_empty() {
            result.push_str("<div class='project-split'>");

            if !self.hardware.is_empty() {
                result.push_str(&format!(
                    r#"
<section class='project-section'>
  <h3>Hardware</h3>
  {}
</section>"#,
                    self.render_project_cards(&self.hardware, false)
                ));
            }

            if !self.software.is_empty() {
                result.push_str(&format!(
                    r#"
<section class='project-section'>
  <h3>Software</h3>
  {}
</section>"#,
                    self.render_project_cards(&self.software, false)
                ));
            }

            result.push_str("</div>");
        }

        // Hardware + Software section (full width)
        if !self.both.is_empty() {
            result.push_str(&format!(
                r#"
<section class='project-section-full'>
  <h3>Hardware + Software</h3>
  <div class='projects-grid'>
    {}
  </div>
</section>"#,
                self.render_project_cards(&self.both, true)
            ));
        }

        result
    }

    fn render_project_cards(&self, projects: &[Project], is_wide: bool) -> String {
        projects
            .iter()
            .map(|p| {
                let card_class = if is_wide {
                    "project-card-wide"
                } else {
                    "project-card"
                };

                let image = p
                    .image
                    .as_ref()
                    .map(|img| format!(r#"<img src='{}' alt='{}'>"#, img, p.name))
                    .unwrap_or_default();

                let link = p
                    .link
                    .as_ref()
                    .map(|url| {
                        format!(
                            r#"<a href='{}' target='_blank' rel='noopener'>View →</a>"#,
                            url
                        )
                    })
                    .unwrap_or_default();

                format!(
                    r#"<article class='{}'>
  {}
  <h4>{}</h4>
  <p>{}</p>
  <span class='tech'>{}</span>
  {}
</article>"#,
                    card_class,
                    image,
                    p.name,
                    p.description,
                    p.tech.join(", "),
                    link
                )
            })
            .collect::<Vec<_>>()
            .join("\n")
    }
}
