use axum::response::IntoResponse;

// Embed all project images at compile time
const MVMBLOCK: &[u8] = include_bytes!("../../public/images/MVMBlock.png");
const VMMCORE: &[u8] = include_bytes!("../../public/images/VMMCore.jpg");
const OPTIMIZER_FLOW: &[u8] = include_bytes!("../../public/images/optimizer_flow.png");
const RISCVCPU: &[u8] = include_bytes!("../../public/images/riscvcpu.png");
const MULTIPLIER_WORKFLOW: &[u8] = include_bytes!("../../public/images/multiplier_workflow.png");
const FPACCUM: &[u8] = include_bytes!("../../public/images/fpaccum.png");
const COMPOS_ARCH: &[u8] = include_bytes!("../../public/images/compos_arch.png");
const CILEEXPLORER: &[u8] = include_bytes!("../../public/images/CileExplorer.png");

// Company logos
const UWASIC_LOGO: &[u8] = include_bytes!("../../public/images/logos/uwasic-logo.png");
const AMD_LOGO: &[u8] = include_bytes!("../../public/images/logos/amd-logo-png-transparent.png");
const UNTETHER_LOGO: &[u8] = include_bytes!("../../public/images/logos/untether_ai_logo.jpg");
const WARG_LOGO: &[u8] = include_bytes!("../../public/images/logos/waterloo_aerial_robotics_group_logo.jpg");
const MEMS_LOGO: &[u8] = include_bytes!("../../public/images/logos/MemsVision.jpg");

pub async fn serve_mvmblock() -> impl IntoResponse {
    ([("Content-Type", "image/png")], MVMBLOCK)
}

pub async fn serve_vmmcore() -> impl IntoResponse {
    ([("Content-Type", "image/jpeg")], VMMCORE)
}

pub async fn serve_optimizer_flow() -> impl IntoResponse {
    ([("Content-Type", "image/png")], OPTIMIZER_FLOW)
}

pub async fn serve_riscvcpu() -> impl IntoResponse {
    ([("Content-Type", "image/png")], RISCVCPU)
}

pub async fn serve_multiplier_workflow() -> impl IntoResponse {
    ([("Content-Type", "image/png")], MULTIPLIER_WORKFLOW)
}

pub async fn serve_fpaccum() -> impl IntoResponse {
    ([("Content-Type", "image/png")], FPACCUM)
}

pub async fn serve_compos_arch() -> impl IntoResponse {
    ([("Content-Type", "image/png")], COMPOS_ARCH)
}

pub async fn serve_cileexplorer() -> impl IntoResponse {
    ([("Content-Type", "image/png")], CILEEXPLORER)
}

// Company logo serving functions
pub async fn serve_uwasic_logo() -> impl IntoResponse {
    ([("Content-Type", "image/png")], UWASIC_LOGO)
}

pub async fn serve_amd_logo() -> impl IntoResponse {
    ([("Content-Type", "image/png")], AMD_LOGO)
}

pub async fn serve_untether_logo() -> impl IntoResponse {
    ([("Content-Type", "image/jpeg")], UNTETHER_LOGO)
}

pub async fn serve_warg_logo() -> impl IntoResponse {
    ([("Content-Type", "image/jpeg")], WARG_LOGO)
}

pub async fn serve_mems_logo() -> impl IntoResponse {
    ([("Content-Type", "image/jpeg")], MEMS_LOGO)
}
