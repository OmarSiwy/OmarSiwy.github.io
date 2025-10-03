use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub name: &'static str,
    pub tagline: &'static str,
    pub intro: &'static str,
    pub email: &'static str,
    pub socials: Socials,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Socials {
    pub github: &'static str,
    pub linkedin: &'static str,
    pub instagram: &'static str,
}

impl Default for Profile {
    fn default() -> Self {
        Self {
            name: "Omar El-Sawy",
            tagline: "Electrical Engineering Student @ UWaterloo",
            intro: "Analog IC Design Team-Lead @ UWASIC | Former Digital Hardware Intern @ AMD & Untether AI | Specializing in RTL Design, Analog IC Design, and PCB Hardware",
            email: "okelsawy@uwaterloo.ca",
            socials: Socials {
                github: "https://github.com/OmarSiwy",
                linkedin: "https://www.linkedin.com/in/omar-el-sawy/",
                instagram: "https://instagram.com/omarsiwy",
            },
        }
    }
}
