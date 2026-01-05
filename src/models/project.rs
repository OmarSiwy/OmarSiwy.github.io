use serde::{Deserialize, Serialize};

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProjectCategory {
    Software = 0,
    Hardware = 1,
    Both = 2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: u16,
    pub name: String,
    pub description: String,
    pub category: ProjectCategory,
    pub tech: Vec<String>,
    pub link: Option<String>,
    pub image: Option<String>,
    pub images: Vec<String>, // Support for multiple images
    pub year: u16,
}

impl Project {
    #[inline]
    pub fn matches_search(&self, query: &str) -> bool {
        let query = query.to_lowercase();
        self.name.to_lowercase().contains(&query)
            || self.description.to_lowercase().contains(&query)
            || self.tech.iter().any(|t| t.to_lowercase().contains(&query))
    }
}

/// Get static portfolio projects from curated list
pub async fn fetch_github_projects() -> Vec<Project> {
    get_static_projects()
}

/// Static project data extracted from portfolio LaTeX file
fn get_static_projects() -> Vec<Project> {
    vec![
        Project {
            id: 0,
            name: "Analog Matrix-Vector Multiplier".to_string(),
            description: "Designing current-based analog matrix-vector multiplier for neural network acceleration, planning to tapeout to SkyWater 130nm through TinyTapeout. Built analog core using current mirror multiplication cells for power-efficient computation (~30uW). Used XSchem and Python for parametric schematic capture with hierarchical design methodology. Validating performance through NGSpice transient and AC analysis, characterizing linearity metrics (THD < 1%) and achieving 40dB SNR.".to_string(),
            category: ProjectCategory::Hardware,
            tech: vec![
                "XSchem".to_string(),
                "NGSpice".to_string(),
                "Magic".to_string(),
                "TinyTapeout".to_string(),
                "Mixed-Signal".to_string(),
            ],
            link: Some("https://github.com/UW-ASIC/Matrix-Vector-Multiplier".to_string()),
            image: Some("/images/MVMBlock.png".to_string()),
            images: vec!["/images/MVMBlock.png".to_string(), "/images/VMMCore.jpg".to_string()],
            year: 2025,
        },
        Project {
            id: 1,
            name: "UWASIC Optimizer".to_string(),
            description: "Built circuit optimization tool that automates analog design space exploration by programmatically controlling XSchem and NGSpice through Python bindings. Implemented constraint-aware parameter sweeping with relational dependencies (W/L ratios, matched pairs), enabling designers to explore valid design spaces. Engineered automatic netlist extraction and modification pipeline. Developed metric extraction framework that parses SPICE output for design figures of merit (GBW, phase margin, slew rate). Used Maturin for Python-Rust bindings to achieve fast parameter iteration.".to_string(),
            category: ProjectCategory::Both,
            tech: vec![
                "Python".to_string(),
                "XSchem".to_string(),
                "NGSpice".to_string(),
                "Maturin".to_string(),
                "Rust".to_string(),
            ],
            link: Some("https://github.com/UW-ASIC/UWASIC-ALG".to_string()),
            image: Some("/images/optimizer_flow.png".to_string()),
            images: vec!["/images/optimizer_flow.png".to_string()],
            year: 2024,
        },
        Project {
            id: 2,
            name: "RISC-V CPU".to_string(),
            description: "Designed complete RV32E processor with classic 5-stage pipeline (IF, ID, EX, MEM, WB), implementing base integer instructions plus M/F/D/C extensions for embedded applications. Built forwarding and hazard detection logic to resolve data and control hazards, maintaining pipeline throughput and minimizing stall cycles for back-to-back dependent instructions. Created directed tests for memory access patterns and debug interface functionality per RISC-V debug spec.".to_string(),
            category: ProjectCategory::Hardware,
            tech: vec![
                "SystemVerilog".to_string(),
                "UVM".to_string(),
                "RISC-V ISA".to_string(),
                "Vivado".to_string(),
            ],
            link: Some("https://github.com/OmarSiwy/RISC-V-CPU".to_string()),
            image: Some("/images/riscvcpu.png".to_string()),
            images: vec!["/images/riscvcpu.png".to_string()],
            year: 2024,
        },
        Project {
            id: 3,
            name: "Digital Multiplier Generator".to_string(),
            description: "Building multiplier IP generator implementing Booth encoding, Dadda/Bickerstaff trees, and parallel prefix adders (Kogge-Stone, Brent-Kung, Sklansky) with parameterized bit-width and pipeline depth. Developed Python code generator that produces synthesizable SystemVerilog for different arithmetic architectures. Integrated with OpenROAD physical design flow on 65nm PDK, performing synthesis, placement, and routing to extract accurate PPA metrics. Designed for upstreaming to Yosys as synthesis plugin.".to_string(),
            category: ProjectCategory::Hardware,
            tech: vec![
                "SystemVerilog".to_string(),
                "Python".to_string(),
                "Yosys".to_string(),
                "OpenROAD".to_string(),
            ],
            link: Some("https://github.com/OmarSiwy/Fast_Multiplier".to_string()),
            image: Some("/images/multiplier_workflow.png".to_string()),
            images: vec!["/images/multiplier_workflow.png".to_string()],
            year: 2024,
        },
        Project {
            id: 4,
            name: "OpenMX FP4/FP6 Accumulator".to_string(),
            description: "Designed parameterized floating-point MAC unit supporting FP4 (E2M1) and FP6 (E2M3/E3M2) formats per OCP Microscaling specification, targeting efficient ML inference hardware. Implemented full datapath including exact FP multiplier, float-to-fixed conversion with alignment, pipelined carry-save accumulator, and fixed-to-float conversion with leading-one detection and rounding. Built configurable rounding modes with parameterized accumulator width. Validated IEEE 754 compliance through Python-generated test vectors. Optimized for ASIC implementation using carry-save arithmetic.".to_string(),
            category: ProjectCategory::Hardware,
            tech: vec![
                "SystemVerilog".to_string(),
                "Python".to_string(),
                "IEEE 754".to_string(),
                "OCP MX Spec".to_string(),
            ],
            link: Some("https://github.com/OmarSiwy/OpenMX_FP".to_string()),
            image: Some("/images/fpaccum.png".to_string()),
            images: vec!["/images/fpaccum.png".to_string()],
            year: 2024,
        },
        Project {
            id: 5,
            name: "CompOS".to_string(),
            description: "Architected RTOS replacing traditional task stacks with Zig coroutines, eliminating per-task memory overhead (typically 1-4KB per task) and reducing context switch latency by 1.5x over FreeRTOS. Leveraged Zig's compile-time metaprogramming (comptime) to perform task scheduling analysis and memory allocation at compile time, achieving fully deterministic real-time behavior. Designed cooperative multitasking with explicit yield points for predictable timing. Built C-compatible ABI allowing integration with existing embedded codebases.".to_string(),
            category: ProjectCategory::Software,
            tech: vec![
                "Zig".to_string(),
                "C".to_string(),
                "Coroutines".to_string(),
                "Bare-Metal".to_string(),
            ],
            link: Some("https://github.com/OmarSiwy/CompOS".to_string()),
            image: Some("/images/compos_arch.png".to_string()),
            images: vec!["/images/compos_arch.png".to_string()],
            year: 2024,
        },
        Project {
            id: 6,
            name: "CileExplorer".to_string(),
            description: "Developed file explorer offloading directory traversal and search operations to GPU, achieving massive parallelization through CUDA's thread hierarchy (blocks and warps). Implemented parallel metadata extraction and string matching using CUDA kernels, demonstrating practical application of GPU computing to traditionally CPU-bound I/O workloads. Optimized CPU-GPU data transfer pipeline through batched operations and CUDA streams. Built using Zig build system with CUDA integration. Benchmarked on Linux with NVIDIA GPUs, showing search performance scaling with thread count.".to_string(),
            category: ProjectCategory::Software,
            tech: vec![
                "C".to_string(),
                "CUDA".to_string(),
                "Zig".to_string(),
                "GPU Acceleration".to_string(),
            ],
            link: Some("https://github.com/OmarSiwy/CileExplorer".to_string()),
            image: Some("/images/CileExplorer.png".to_string()),
            images: vec!["/images/CileExplorer.png".to_string()],
            year: 2023,
        },
    ]
}
