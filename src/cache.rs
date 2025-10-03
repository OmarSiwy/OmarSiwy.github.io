use crate::models::SystemStatus;
use worker::kv::KvStore;

const KV_KEY: &str = "system_status";

pub async fn get_system_status(kv: &KvStore) -> SystemStatus {
    match kv.get(KV_KEY).json::<SystemStatus>().await {
        Ok(Some(status)) => status,
        _ => SystemStatus::default(),
    }
}

pub async fn update_system_status(kv: &KvStore, status: SystemStatus) {
    let _ = kv.put(KV_KEY, status).unwrap().execute().await;
}
