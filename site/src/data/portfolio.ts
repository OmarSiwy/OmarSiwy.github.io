export const profile = {
	name: 'Omar El-Sawy',
	tagline: 'Electrical Engineering Student at the University of Waterloo',
	intro:
		'Analog and digital hardware. EDA tools. Fast systems. Built at UWASIC, AMD, and Untether AI.',
	email: 'okelsawy@uwaterloo.ca',
	socials: {
		github: 'https://github.com/OmarSiwy',
		linkedin: 'https://www.linkedin.com/in/omar-el-sawy/',
		instagram: 'https://instagram.com/omarsawe',
	},
} as const;

export interface PortfolioImage {
	src: string
	alt: string
	width: number
	height: number
	fit?: 'cover' | 'contain'
	background?: 'light' | 'dark'
}

export interface Experience {
	role: string
	company: string
	url: string
	period: string
	details: readonly string[]
	image: PortfolioImage
}

export const experiences: readonly Experience[] = [
	{
		role: 'Analog IC Team Lead',
		company: 'UWASIC',
		url: 'https://uwasic.com/',
		period: 'May 2025 — present',
		details: ['Designing mixed-signal applications and development workflows for TinyTapeout.'],
		image: {
			src: '/assets/experience/uwasic.svg',
			alt: 'UWASIC logo and silicon layout marks',
			width: 1984,
			height: 472,
			fit: 'contain',
		},
	},
	{
		role: 'Silicon Design Verification Intern',
		company: 'AMD',
		url: 'https://www.amd.com/',
		period: 'Jul 2025 — Aug 2025',
		details: ['Used UVM to verify interrupt handling behavior.'],
		image: {
			src: '/assets/experience/amd.jpg',
			alt: 'AMD together we advance graphic over a processor',
			width: 1200,
			height: 675,
		},
	},
	{
		role: 'Digital Hardware Engineering Intern',
		company: 'Untether AI',
		url: 'https://www.untether.ai/',
		period: 'May 2025 — Jul 2025',
		details: ['Designed the next generation of PCIe interconnects.'],
		image: {
			src: '/assets/experience/untether-ai.png',
			alt: 'Untether AI logo',
			width: 1200,
			height: 627,
			fit: 'contain',
			background: 'light',
		},
	},
	{
		role: 'Electrical Engineering Team Member',
		company: 'Waterloo Aerial Robotics Group',
		url: 'https://www.uwarg.com/',
		period: 'Feb 2024 — Jul 2025',
		details: ['Designed and tested PCBs using multiple communication protocols.'],
		image: {
			src: '/assets/experience/uwarg.png',
			alt: 'Waterloo Aerial Robotics Group logo',
			width: 706,
			height: 150,
			fit: 'contain',
			background: 'light',
		},
	},
	{
		role: 'Technical Product Development',
		company: 'MEMS Vision',
		url: 'https://mems-vision.com/',
		period: 'Sep 2024 — Dec 2024',
		details: ['Worked across PCB design, firmware, and software testing for ultrasound ICs.'],
		image: {
			src: '/assets/experience/mems-vision.png',
			alt: 'MEMS Vision logo',
			width: 1223,
			height: 239,
			fit: 'contain',
			background: 'light',
		},
	},
] as const;

export interface Project {
	name: string
	year: number
	category: string
	description: string
	tech: readonly string[]
	url: string
	featured: boolean
	image?: PortfolioImage
}

export const projects: readonly Project[] = [
	{
		name: 'Analog Matrix–Vector Multiplier',
		year: 2025,
		category: 'Analog / mixed-signal',
		description:
			'A current-based analog matrix–vector multiplier for neural-network acceleration, targeting a SkyWater 130 nm TinyTapeout shuttle.',
		tech: ['XSchem', 'NGSpice', 'Magic', 'TinyTapeout'],
		url: 'https://github.com/UW-ASIC/Matrix-Vector-Multiplier',
		featured: true,
	},
	{
		name: 'UWASIC Optimizer',
		year: 2024,
		category: 'EDA software',
		description:
			'Constraint-aware analog design-space exploration with automatic netlist modification and SPICE metric extraction.',
		tech: ['Python', 'Rust', 'XSchem', 'NGSpice', 'Maturin'],
		url: 'https://github.com/UW-ASIC/UWASIC-ALG',
		featured: true,
	},
	{
		name: 'RISC-V CPU',
		year: 2024,
		category: 'Digital hardware',
		description:
			'An RV32E processor with a five-stage pipeline, forwarding, hazard detection, and directed verification tests.',
		tech: ['SystemVerilog', 'UVM', 'RISC-V', 'Vivado'],
		url: 'https://github.com/OmarSiwy/RISC-V-CPU',
		featured: false,
	},
	{
		name: 'Digital Multiplier Generator',
		year: 2024,
		category: 'Digital hardware',
		description:
			'A parameterized multiplier IP generator spanning Booth encoding, compressor trees, and parallel-prefix adders.',
		tech: ['SystemVerilog', 'Python', 'Yosys', 'OpenROAD'],
		url: 'https://github.com/OmarSiwy/Fast_Multiplier',
		featured: false,
	},
	{
		name: 'OpenMX FP4/FP6 Accumulator',
		year: 2024,
		category: 'ML hardware',
		description:
			'A parameterized floating-point MAC datapath supporting FP4 and FP6 formats from the OCP Microscaling specification.',
		tech: ['SystemVerilog', 'Python', 'IEEE 754', 'OCP MX'],
		url: 'https://github.com/OmarSiwy/OpenMX_FP',
		featured: false,
	},
	{
		name: 'CompOS',
		year: 2024,
		category: 'Systems software',
		description:
			'A small real-time operating system using Zig coroutines for deterministic scheduling without a stack per task.',
		tech: ['Zig', 'C', 'Coroutines', 'Bare metal'],
		url: 'https://github.com/OmarSiwy/CompOS',
		featured: false,
	},
	{
		name: 'CileExplorer',
		year: 2023,
		category: 'GPU software',
		description:
			'A CUDA-backed file explorer experimenting with parallel directory traversal, metadata extraction, and search.',
		tech: ['C', 'CUDA', 'Zig', 'GPU acceleration'],
		url: 'https://github.com/OmarSiwy/CileExplorer',
		featured: false,
	},
] as const;
