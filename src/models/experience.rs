use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experience {
    pub title: String,
    pub company: String,
    pub company_url: Option<String>,
    pub company_logo: Option<String>,
    pub date: String,
    pub bullets: Vec<String>,
}

pub fn parse_experiences() -> Vec<Experience> {
    vec![
        Experience {
            title: "Analog IC Team Lead".to_string(),
            company: "UWASIC".to_string(),
            company_url: Some("https://uwasic.com/".to_string()),
            company_logo: Some("/images/logos/uwasic-logo.png".to_string()),
            date: "May 2025 - Present".to_string(),
            bullets: vec![
                "Designing mixed-signal applications and development workflows for TinyTapeout".to_string(),
            ],
        },
         Experience {
            title: "Silicon Design Verification Intern".to_string(),
            company: "AMD".to_string(),
            company_url: Some("https://www.amd.com/".to_string()),
            company_logo: Some("/images/logos/amd-logo-png-transparent.png".to_string()),
            date: "Jul 2025 - Aug 2025".to_string(),
            bullets: vec![
                "Using UVM to verify interrupt handling works correctly".to_string(),
            ],
        },
        Experience {
            title: "Digital Hardware Engineering Intern".to_string(),
            company: "Untether AI".to_string(),
            company_url: Some("https://www.untether.ai/".to_string()),
            company_logo: Some("/images/logos/untether_ai_logo.jpg".to_string()),
            date: "May 2025 - Jul 2025".to_string(),
            bullets: vec![
                "Designing the next generation of PCIe interconnects".to_string(),
            ],
        },
        Experience {
            title: "Electrical Engineering Team Member".to_string(),
            company: "Waterloo Aerial Robotics Group".to_string(),
            company_url: Some("https://www.uwarg.com/".to_string()),
            company_logo: Some("/images/logos/waterloo_aerial_robotics_group_logo.jpg".to_string()),
            date: "Feb 2024 - Jul 2025".to_string(),
            bullets: vec![
                "Designing and Testing PCBs with different protocols".to_string(),
            ],
        },
        Experience {
            title: "Technical Product Development".to_string(),
            company: "MEMS Vision".to_string(),
            company_url: Some("https://mems-vision.com/".to_string()),
            company_logo: Some("/images/logos/MemsVision.jpg".to_string()),
            date: "Sep 2024 - Dec 2024".to_string(),
            bullets: vec![
                "PCB design → firmware → software testing for Ultrasound ICs".to_string(),
            ],
        },
    ]
}
