use crate::{cache, models::SystemStatus, AppState};
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use axum_cloudflare_adapter::wasm_compat;
use serde_json::json;

#[wasm_compat]
pub async fn update_status(
    State(state): State<AppState>,
    Json(mut status): Json<SystemStatus>,
) -> impl IntoResponse {
    worker::console_log!("=== Received Status Update ===");
    worker::console_log!("Battery: {}%", status.battery);
    worker::console_log!("Charging: {}", status.charging);
    worker::console_log!("Location: {}", status.location);
    worker::console_log!("Timestamp: {}", status.timestamp);
    worker::console_log!("Spotify present: {}", status.spotify.is_some());

    if let Some(ref spotify) = status.spotify {
        worker::console_log!("  Track: {}", spotify.track_name);
        worker::console_log!("  Artist: {}", spotify.artist_name);
        worker::console_log!("  Playing: {}", spotify.is_playing);
        worker::console_log!("  Album Art present: {}", spotify.album_art.is_some());
    } else {
        // If no Spotify data provided, preserve existing Spotify data
        let existing = cache::get_system_status(&state.kv).await;
        if existing.spotify.is_some() {
            worker::console_log!("  Preserving existing Spotify data");
            status.spotify = existing.spotify;
        }
    }

    cache::update_system_status(&state.kv, status).await;

    worker::console_log!("Status saved to KV");

    (StatusCode::OK, Json(json!({"success": true})))
}

#[wasm_compat]
pub async fn get_status(State(state): State<AppState>) -> impl IntoResponse {
    Json(cache::get_system_status(&state.kv).await)
}
