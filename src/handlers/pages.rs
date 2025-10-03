use askama::Template;
use axum::{extract::State, response::Html};
use axum_cloudflare_adapter::wasm_compat;

use crate::{
    cache, AppState,
    models::{experience::parse_experiences, project::fetch_github_projects, Profile},
    templates::{ExperiencePage, HomePage, Layout, ProjectsPage},
};

#[wasm_compat]
pub async fn home_page(State(state): State<AppState>, req: axum::extract::Request) -> Html<String> {
    let is_htmx = req.headers().get("hx-request").is_some();

    let profile = Profile::default();
    let status = cache::get_system_status(&state.kv).await;

    worker::console_log!(
        "Home page - Battery: {}%, Charging: {}, Location: {}",
        status.battery,
        status.charging,
        status.location
    );

    let home = HomePage::new(profile, status);
    let content = home.render().unwrap();

    if is_htmx {
        return Html(content);
    }

    let layout = Layout {
        title: "Home".to_string(),
        page: "home".to_string(),
        content,
    };
    Html(layout.render().unwrap())
}

#[wasm_compat]
pub async fn experience_page(req: axum::extract::Request) -> Html<String> {
    let is_htmx = req.headers().get("hx-request").is_some();

    let experiences = parse_experiences();
    let page = ExperiencePage::new(experiences);
    let content = page.render().unwrap();

    if is_htmx {
        return Html(content);
    }

    let layout = Layout {
        title: "Experience".to_string(),
        page: "experience".to_string(),
        content,
    };
    Html(layout.render().unwrap())
}

#[wasm_compat]
pub async fn projects_page(req: axum::extract::Request) -> Html<String> {
    let is_htmx = req.headers().get("hx-request").is_some();

    let projects = fetch_github_projects().await;
    let page = ProjectsPage::new(projects);
    let content = page.render().unwrap();

    if is_htmx {
        return Html(content);
    }

    let layout = Layout {
        title: "Portfolio".to_string(),
        page: "projects".to_string(),
        content,
    };
    Html(layout.render().unwrap())
}

