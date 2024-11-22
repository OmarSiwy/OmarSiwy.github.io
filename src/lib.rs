use axum::http::header::CONTENT_TYPE;
use axum::{
    extract::{Path, State},
    response::IntoResponse,
    routing::get,
    Router as AxumRouter,
};
use axum_cloudflare_adapter::{to_axum_request, to_worker_response, wasm_compat, EnvWrapper};
use std::ops::Deref;
use std::str::FromStr;
use tower_service::Service;
use worker::{console_log, event, Date, Env, Request, Response, Result, Var};
use url::Url;
use cfg_if::cfg_if;

cfg_if! {
    // https://github.com/rustwasm/console_error_panic_hook#readme
    if #[cfg(feature = "console_error_panic_hook")] {
        extern crate console_error_panic_hook;
        pub use self::console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        pub fn set_panic_hook() {}
    }
}

fn log_request(req: &Request) {
    if let Some(cf) = req.cf() {
        console_log!(
            "{} - [{}], located at: {:?}, within: {}",
            Date::now().to_string(),
            req.path(),
            cf.coordinates().unwrap_or_default(),
            cf.region().unwrap_or_else(|| "unknown region".into())
        );
    } else {
        console_log!(
            "{} - [{}], CF data unavailable",
            Date::now().to_string(),
            req.path()
        );
    }
}


#[wasm_compat]
pub async fn index(State(state): State<AxumState>) -> impl IntoResponse {
    let url = Url::from_str("https://omarelsawy.com").unwrap();
    let mut response = worker::Fetch::Url(url).send().await.unwrap();
    let body_text = response.text().await.unwrap();

    let env: &Env = state.env_wrapper.env.deref();
    let worker_rs_version: Var = env.var("WORKERS_RS_VERSION").unwrap();

    console_log!("WORKERS_RS_VERSION: {}", worker_rs_version.to_string());

    let content_type = response.headers().get("content-type").unwrap().unwrap();
    axum::response::Response::builder()
        .header(CONTENT_TYPE, content_type)
        .body(body_text)
        .unwrap()
}

#[wasm_compat]
pub async fn with_pathname(Path(path): Path<String>) -> impl IntoResponse {
    let mut url = Url::from_str("https://logankeenan.com").unwrap();
    url.set_path(path.as_str());
    let mut response = worker::Fetch::Url(url).send().await.unwrap();
    let body_text = response.text().await.unwrap();

    let content_type = response.headers().get("content-type").unwrap().unwrap();
    axum::response::Response::builder()
        .header(CONTENT_TYPE, content_type)
        .body(body_text)
        .unwrap()
}

#[derive(Clone)]
pub struct AxumState {
    pub env_wrapper: EnvWrapper,
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: worker::Context) -> Result<Response> {
    log_request(&req);
    // Optionally, get more helpful error messages written to the console in the case of a panic.
    set_panic_hook();

    let axum_state = AxumState {
        env_wrapper: EnvWrapper::new(env),
    };

    let mut _router: AxumRouter = AxumRouter::new()
        .route("/", get(index))
        .route("/*path", get(with_pathname))
        .with_state(axum_state);

    let axum_request = to_axum_request(req).await.unwrap();
    let axum_response = _router.call(axum_request).await.unwrap();
    let response = to_worker_response(axum_response).await.unwrap();

    Ok(response)
}
