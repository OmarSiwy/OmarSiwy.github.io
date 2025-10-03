use std::sync::RwLock;
use crate::models::SystemStatus;

static CACHED_STATUS: RwLock<Option<SystemStatus>> = RwLock::new(None);

#[inline]
pub fn get_system_status() -> SystemStatus {
    CACHED_STATUS
        .read()
        .unwrap()
        .clone()
        .unwrap_or_default()
}

#[inline]
pub fn update_system_status(status: SystemStatus) {
    *CACHED_STATUS.write().unwrap() = Some(status);
}
