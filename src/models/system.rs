use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemStatus {
    pub battery: u8, // 0-100
    pub charging: bool,
    pub location: String,
    pub timestamp: u64, // Unix timestamp
    #[serde(default)]
    pub latitude: Option<f64>,
    #[serde(default)]
    pub longitude: Option<f64>,
}

impl Default for SystemStatus {
    fn default() -> Self {
        Self {
            battery: 0,
            charging: false,
            location: "Unknown".to_string(),
            timestamp: 0,
            latitude: None,
            longitude: None,
        }
    }
}

impl SystemStatus {
    #[inline]
    pub fn battery_icon(&self) -> &'static str {
        match self.battery {
            90..=100 => "🔋",
            50..=89 => "🔋",
            20..=49 => "🪫",
            _ => "🪫",
        }
    }

    #[inline]
    pub fn status_text(&self) -> String {
        if self.charging {
            format!("{}% ⚡ Charging", self.battery)
        } else {
            format!("{}% {}", self.battery, self.battery_icon())
        }
    }

    #[inline]
    pub fn time_ago(&self) -> String {
        let now = worker::Date::now().as_millis() as u64 / 1000;
        let diff = now.saturating_sub(self.timestamp);

        match diff {
            0..=59 => "just now".to_string(),
            60..=119 => "1 minute ago".to_string(),
            120..=3599 => format!("{} minutes ago", diff / 60),
            3600..=7199 => "1 hour ago".to_string(),
            7200..=86399 => format!("{} hours ago", diff / 3600),
            86400..=172799 => "1 day ago".to_string(),
            _ => format!("{} days ago", diff / 86400),
        }
    }

    #[inline]
    pub fn map_url(&self) -> Option<String> {
        if let (Some(lat), Some(lon)) = (self.latitude, self.longitude) {
            let zoom = 13;
            let delta = 0.03;
            Some(format!(
                "https://www.openstreetmap.org/export/embed.html?bbox={},{},{},{}&layer=mapnik&marker={},{}&zoom={}",
                lon - delta, lat - delta, lon + delta, lat + delta, lat, lon, zoom
            ))
        } else {
            None
        }
    }
}
