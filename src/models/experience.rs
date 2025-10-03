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
            company_logo: Some("https://media.licdn.com/dms/image/v2/D4E0BAQGTB0KSS4kq6g/company-logo_100_100/B4EZaDib2uHMAQ-/0/1745963565592/uwasic_logo?e=1762387200&v=beta&t=6_Lxz9PDGBqcPGUZDubJXbMlEz7-j8SHRGahvagoiGc".to_string()),
            date: "May 2025 - Present".to_string(),
            bullets: vec![
                "Designing mixed-signal applications and development workflows for TinyTapeout".to_string(),
            ],
        },
        Experience {
            title: "Silicon Design Verification Intern".to_string(),
            company: "AMD".to_string(),
            company_url: Some("https://www.amd.com/".to_string()),
            company_logo: Some("https://media.licdn.com/dms/image/v2/C560BAQEkjpiqeCK9Ag/company-logo_100_100/company-logo_100_100/0/1654804896089/amd_logo?e=1762387200&v=beta&t=w6KrYpW1Kxy40EhkHxk1AZJFsofVb99xr-TLrlr7FgI".to_string()),
            date: "Jul 2025 - Aug 2025".to_string(),
            bullets: vec![
                "Using UVM to verify interrupt handling works correctly".to_string(),
            ],
        },
        Experience {
            title: "Digital Hardware Engineering Intern".to_string(),
            company: "Untether AI".to_string(),
            company_url: Some("https://www.untether.ai/".to_string()),
            company_logo: Some("https://media.licdn.com/dms/image/v2/C4D0BAQEss-RaVAelpQ/company-logo_100_100/company-logo_100_100/0/1631726326538/untether_ai_logo?e=1762387200&v=beta&t=cdiE58sVEOn139R-N5hJvPTStvrTUudK3jujWCMNX_4".to_string()),
            date: "May 2025 - Jul 2025".to_string(),
            bullets: vec![
                "Designing the next generation of PCIe interconnects".to_string(),
            ],
        },
        Experience {
            title: "Electrical Engineering Team Member".to_string(),
            company: "Waterloo Aerial Robotics Group".to_string(),
            company_url: Some("https://www.uwarg.com/".to_string()),
            company_logo: Some("https://media.licdn.com/dms/image/v2/D560BAQEWYcrE8Yi2Ug/company-logo_100_100/company-logo_100_100/0/1689726883841/waterloo_aerial_robotics_group_logo?e=1762387200&v=beta&t=A1JP-Nf09rkvqgwGiA5jJqizsN-wQGTAEZQvkCBl8Yk".to_string()),
            date: "Feb 2024 - Jul 2025".to_string(),
            bullets: vec![
                "Designing and Testing PCBs with different protocols".to_string(),
            ],
        },
        Experience {
            title: "Technical Product Development".to_string(),
            company: "MEMS Vision".to_string(),
            company_url: Some("https://mems-vision.com/".to_string()),
            company_logo: Some("https://media.licdn.com/dms/image/v2/D4E0BAQEJmhR123r-Bw/company-logo_100_100/B4EZbM6L0EHcAQ-/0/1747194527553?e=1762387200&v=beta&t=xv8viqn1NubNP7UEdRA8ZopxbrUaEm0dVayr4t7Yr_Q".to_string()),
            date: "Sep 2024 - Dec 2024".to_string(),
            bullets: vec![
                "PCB design → firmware → software testing for Ultrasound ICs".to_string(),
            ],
        },
        Experience {
            title: "Programming Tutor".to_string(),
            company: "Self-employed".to_string(),
            company_url: None,
            company_logo: None,
            date: "Sep 2021 - Jul 2023".to_string(),
            bullets: vec![
                "Teaching competitive programming to Waterloo CS applicants (CCC prep)".to_string(),
            ],
        },
        Experience {
            title: "Code Team Lead".to_string(),
            company: "A.B. Lucas Secondary School".to_string(),
            company_url: Some("https://ablucas.tvdsb.ca/".to_string()),
            company_logo: Some("https://media.licdn.com/dms/image/v2/C4D0BAQFuL46hz6PPjw/company-logo_100_100/company-logo_100_100/0/1631300781713?e=1762387200&v=beta&t=PCRwWkk-iJRc3LnrBU042C_lnZIUedjsfuCw7ETR-kc".to_string()),
            date: "Sep 2021 - Mar 2023".to_string(),
            bullets: vec![
                "Led team meetings and mentored new recruits on FRC frameworks & Java fundamentals".to_string(),
            ],
        },
        Experience {
            title: "Cashier".to_string(),
            company: "McDonald's".to_string(),
            company_url: Some("https://www.mcdonalds.com/".to_string()),
            company_logo: Some("https://media.licdn.com/dms/image/v2/C4E0BAQHWxquJ9PJxvw/company-logo_100_100/company-logo_100_100/0/1630594652024/mcdonalds_corporation_logo?e=1762387200&v=beta&t=_dLjzffcjaqO_OEjl9xw2gFiBXdn1gs-vbkJ6LX6vK4".to_string()),
            date: "Jun 2020 - Sep 2020".to_string(),
            bullets: vec![
                "Mastering high-volume food preparation 🍗🔥".to_string(),
            ],
        },
    ]
}
