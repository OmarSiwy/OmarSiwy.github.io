fn main() {
    // Size optimization: ensure wasm-opt is run if available
    println!("cargo:rerun-if-changed=build.rs");
}
