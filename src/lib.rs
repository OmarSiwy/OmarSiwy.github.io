use axum::{
    response::{Html, IntoResponse},
    routing::{get, post},
    Router,
};
use axum_cloudflare_adapter::{to_axum_request, to_worker_response, wasm_compat, EnvWrapper};
use tower_service::Service;
use wasm_bindgen::prelude::wasm_bindgen;
use worker::js_sys;
use worker::{console_log, event, Date, Env, Request, Response, Result};

mod cache;
mod handlers;
mod models;
mod templates;

const RESUME_PDF: &[u8] = include_bytes!("../public/resume.pdf");

#[derive(Clone)]
pub struct AppState {
    pub env: EnvWrapper,
    pub kv: worker::kv::KvStore,
}

#[wasm_compat]
async fn not_found() -> Html<&'static str> {
    Html("<h1>404 - Page Not Found</h1><p><a href=\"/\">Go Home</a></p>")
}

#[wasm_compat]
async fn serve_resume() -> impl IntoResponse {
    (
        [
            ("Content-Type", "application/pdf"),
            (
                "Content-Disposition",
                "inline; filename=\"Omar_El-Sawy_Resume.pdf\"",
            ),
        ],
        RESUME_PDF,
    )
}

#[wasm_bindgen]
pub fn setPanicHook(_callback: &js_sys::Function) {
    // Do nothing - this is just to satisfy the shim
}

#[inline]
fn log_request(req: &Request) {
    if let Some(cf) = req.cf() {
        console_log!(
            "{} - [{}], {:?}, {}",
            Date::now().to_string(),
            req.path(),
            cf.coordinates().unwrap_or_default(),
            cf.region().unwrap_or_else(|| "unknown".into())
        );
    }
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    log_request(&req);

    let kv = env.kv("PORTFOLIO_KV")?;
    let state = AppState {
        env: EnvWrapper::new(env),
        kv,
    };

    let mut router = Router::new()
        .route("/", get(handlers::home_page))
        .route("/projects", get(handlers::projects_page))
        .route("/experience", get(handlers::experience_page))
        .route("/resume.pdf", get(serve_resume))
        .route("/api/status", post(handlers::update_status))
        .fallback(get(not_found))
        .with_state(state);

    let axum_request = to_axum_request(req).await.unwrap();
    let axum_response = router.call(axum_request).await.unwrap();
    let response = to_worker_response(axum_response).await.unwrap();

    Ok(response)
}
