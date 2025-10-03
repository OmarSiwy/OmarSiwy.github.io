use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use axum_cloudflare_adapter::wasm_compat;
use serde_json::json;

use crate::{cache, models::SystemStatus, AppState};

#[wasm_compat]
pub async fn update_status(
    State(state): State<AppState>,
    Json(status): Json<SystemStatus>,
) -> impl IntoResponse {
    worker::console_log!(
        "Received status update - Battery: {}%, Charging: {}, Location: {}, Timestamp: {}",
        status.battery,
        status.charging,
        status.location,
        status.timestamp
    );
    cache::update_system_status(&state.kv, status).await;
    (StatusCode::OK, Json(json!({"success": true})))
}

#[wasm_compat]
pub async fn get_status(State(state): State<AppState>) -> impl IntoResponse {
    Json(cache::get_system_status(&state.kv).await)
}
