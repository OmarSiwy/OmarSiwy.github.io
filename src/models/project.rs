use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProjectCategory {
    Software = 0,
    Hardware = 1,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: u16,
    pub name: String,
    pub description: String,
    pub category: ProjectCategory,
    pub tech: Vec<String>,
    pub link: Option<String>,
    pub image: Option<String>,
    pub year: u16,
}

impl Project {
    #[inline]
    pub fn matches_search(&self, query: &str) -> bool {
        let query = query.to_lowercase();
        self.name.to_lowercase().contains(&query)
            || self.description.to_lowercase().contains(&query)
            || self.tech.iter().any(|t| t.to_lowercase().contains(&query))
    }
}

// INFO.md metadata format (YAML frontmatter):
// ---
// description: "Your project description"
// category: "Software" or "Hardware"
// tech: ["Rust", "WASM", "Cloudflare"]
// image: "https://example.com/image.png"
// year: 2025
// ---
#[derive(Debug, Deserialize)]
struct ProjectMetadata {
    description: String,
    category: String,
    tech: Vec<String>,
    image: Option<String>,
    year: Option<u16>,
}

#[derive(Debug, Deserialize)]
struct GitHubRepo {
    name: String,
    html_url: String,
    created_at: String,
}

static CACHED_PROJECTS: OnceLock<Vec<Project>> = OnceLock::new();
const GITHUB_USERNAME: &str = "OmarSiwy";

// Additional repos you contributed to (format: "owner/repo")
const CONTRIBUTED_REPOS: &[&str] = &[
    // Add repos here, e.g.:
    // "torvalds/linux",
    // "rust-lang/rust",
];

/// Fetch projects from GitHub API and parse INFO.md for metadata
pub async fn fetch_github_projects() -> Vec<Project> {
    // Return cached projects if available
    if let Some(projects) = CACHED_PROJECTS.get() {
        return projects.clone();
    }

    // Fetch from GitHub API
    match fetch_from_github().await {
        Ok(projects) => {
            let _ = CACHED_PROJECTS.set(projects.clone());
            projects
        }
        Err(_) => Vec::new(),
    }
}

async fn fetch_from_github() -> Result<Vec<Project>, Box<dyn std::error::Error>> {
    let mut projects = Vec::new();
    let mut id_counter = 0u16;

    // 1. Fetch user's own repositories
    let repos_url = format!(
        "https://api.github.com/users/{}/repos?per_page=100",
        GITHUB_USERNAME
    );

    let mut opts = worker::RequestInit::new();
    opts.headers = {
        let mut headers = worker::Headers::new();
        headers.set("User-Agent", "portfolio-site")?;
        headers.set("Accept", "application/vnd.github.v3+json")?;
        headers
    };

    let request = worker::Request::new_with_init(&repos_url, &opts)?;
    let mut response = worker::Fetch::Request(request).send().await?;
    let repos: Vec<GitHubRepo> = response.json().await?;

    for repo in repos.iter() {
        if let Some(project) = fetch_project_from_repo(
            GITHUB_USERNAME,
            &repo.name,
            &repo.html_url,
            &repo.created_at,
            id_counter,
        )
        .await
        {
            projects.push(project);
            id_counter += 1;
        }
    }

    // 2. Fetch contributed repositories
    for contributed_repo in CONTRIBUTED_REPOS {
        let parts: Vec<&str> = contributed_repo.split('/').collect();
        if parts.len() != 2 {
            continue;
        }
        let (owner, repo_name) = (parts[0], parts[1]);

        // Fetch repo info
        let repo_info_url = format!("https://api.github.com/repos/{}/{}", owner, repo_name);
        let mut info_opts = worker::RequestInit::new();
        info_opts.headers = {
            let mut headers = worker::Headers::new();
            headers.set("User-Agent", "portfolio-site")?;
            headers.set("Accept", "application/vnd.github.v3+json")?;
            headers
        };

        let info_request = worker::Request::new_with_init(&repo_info_url, &info_opts)?;
        if let Ok(mut info_response) = worker::Fetch::Request(info_request).send().await {
            if let Ok(repo_info) = info_response.json::<GitHubRepo>().await {
                if let Some(project) = fetch_project_from_repo(
                    owner,
                    repo_name,
                    &repo_info.html_url,
                    &repo_info.created_at,
                    id_counter,
                )
                .await
                {
                    projects.push(project);
                    id_counter += 1;
                }
            }
        }
    }

    Ok(projects)
}

async fn fetch_project_from_repo(
    owner: &str,
    repo_name: &str,
    html_url: &str,
    created_at: &str,
    id: u16,
) -> Option<Project> {
    // Try to fetch INFO.md from the repository
    let info_url = format!(
        "https://raw.githubusercontent.com/{}/{}/main/INFO.md",
        owner, repo_name
    );

    let mut info_opts = worker::RequestInit::new();
    info_opts.headers = {
        let mut headers = worker::Headers::new();
        headers.set("User-Agent", "portfolio-site").ok()?;
        headers
    };

    let info_request = worker::Request::new_with_init(&info_url, &info_opts).ok()?;

    if let Ok(mut info_response) = worker::Fetch::Request(info_request).send().await {
        if info_response.status_code() == 200 {
            if let Ok(content) = info_response.text().await {
                if let Some(metadata) = parse_info_md(&content) {
                    let year = metadata.year.unwrap_or_else(|| {
                        // Extract year from created_at: "2024-01-15T10:30:00Z"
                        created_at
                            .split('-')
                            .next()
                            .and_then(|y| y.parse().ok())
                            .unwrap_or(2024)
                    });

                    let category = match metadata.category.as_str() {
                        "Hardware" => ProjectCategory::Hardware,
                        _ => ProjectCategory::Software,
                    };

                    return Some(Project {
                        id,
                        name: repo_name.to_string(),
                        description: metadata.description,
                        category,
                        tech: metadata.tech,
                        link: Some(html_url.to_string()),
                        image: metadata.image,
                        year,
                    });
                }
            }
        }
    }

    None
}

fn parse_info_md(content: &str) -> Option<ProjectMetadata> {
    // Extract YAML frontmatter between --- markers
    let content = content.trim();
    if !content.starts_with("---") {
        return None;
    }

    let parts: Vec<&str> = content.splitn(3, "---").collect();
    if parts.len() < 3 {
        return None;
    }

    // Parse YAML frontmatter
    serde_yaml::from_str(parts[1].trim()).ok()
}
