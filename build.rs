use std::process::Command;
use std::path::Path;

fn main() {
    // Create WGPU Project and store it in a known directory
    let out_dir = Path::new("../static/pkg");
    Command::new("wasm-pack")
        .args(&["build", "--target", "web", "--out-dir", out_dir.to_str().unwrap()])
        .current_dir("graphics")
        .status()
        .expect("Failed to build graphics project with wasm-pack");
}
