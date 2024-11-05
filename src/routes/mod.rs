use axum::{extract::Form, http::StatusCode, response::Html, routing::{get, post}, Router};
use crate::state::task_state::get_tasks;
use serde::Deserialize;

pub mod tasks;
pub mod htmx;

pub fn create_routes() -> Router {
    Router::new()
        .route("/", get(show_tasks))
        .route("/add", post(add_task))
}
