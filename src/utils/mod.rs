use anyhow::Result;
use axum::http::StatusCode;

pub fn handle_error(e: anyhow::Error) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, format!("Error: {}", e))
}

