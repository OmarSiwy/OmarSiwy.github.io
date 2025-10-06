use crate::{
    cache,
    models::{experience::parse_experiences, project::fetch_github_projects, Profile},
    templates::{ExperiencePage, HomePage, Layout, ProjectsPage, StatusCard},
    AppState,
};
use askama::Template;
use axum::{extract::State, response::Html};
use axum_cloudflare_adapter::wasm_compat;

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

#[wasm_compat]
pub async fn status_card(State(state): State<AppState>) -> Html<String> {
    let status = cache::get_system_status(&state.kv).await;

    worker::console_log!("=== Status Card ===");
    worker::console_log!("Spotify present: {}", status.spotify.is_some());

    let card = StatusCard { status };
    Html(card.render().unwrap())
}


#[wasm_compat]
pub async fn search_projects(req: axum::extract::Request) -> Html<String> {
    use std::collections::HashMap;
    let query_string = req.uri().query().unwrap_or("");
    let params: HashMap<String, String> = query_string
        .split('&')
        .filter_map(|s| {
            let mut parts = s.splitn(2, '=');
            Some((parts.next()?.to_string(), parts.next()?.to_string()))
        })
        .collect();
    let search_query = params.get("q").map(|s| s.as_str()).unwrap_or("");
    let all_projects = fetch_github_projects().await;
    let filtered: Vec<_> = if search_query.is_empty() {
        all_projects
    } else {
        all_projects
            .into_iter()
            .filter(|p| p.matches_search(search_query))
            .collect()
    };
    let page = ProjectsPage::new(filtered);
    Html(page.render_results())
}
