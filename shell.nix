{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Rust toolchain
    rustc
    cargo
    rustfmt
    clippy

    # Rust WASM target support
    wasm-pack

    # WASM linker
    lld

    # Bun runtime (includes Node.js compatibility)
    bun

    # Build dependencies
    pkg-config
    openssl

    # System libraries needed for workerd
    stdenv.cc.cc.lib
    zlib

    # Tool for patching binaries on NixOS
    patchelf

    # Development tools
    git

    # LaTeX for resume compilation (use scheme-full for complete package support)
    texlive.combined.scheme-full
  ];

  # Environment variables
  RUST_BACKTRACE = "1";

  # Set LD_LIBRARY_PATH for dynamically linked executables like workerd
  LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
    pkgs.stdenv.cc.cc.lib
    pkgs.zlib
    pkgs.openssl
  ];

  shellHook = ''
    # Add cargo bin to PATH for worker-build and other cargo-installed tools
    export PATH="$HOME/.cargo/bin:$PATH"

    echo "Rust + WASM + Cloudflare Workers development environment"
    echo "Rust version: $(rustc --version)"
    echo "Bun version: $(bun --version)"
    echo ""
    # Install wrangler if not already installed
    if [ ! -d "node_modules/.bin" ] || [ ! -f "node_modules/.bin/wrangler" ]; then
      echo "Installing dependencies..."
      bun install
    fi

    # Patch workerd binary for NixOS
    if [ -f "node_modules/@cloudflare/workerd-linux-64/bin/workerd" ]; then
      CURRENT_INTERP=$(patchelf --print-interpreter node_modules/@cloudflare/workerd-linux-64/bin/workerd 2>/dev/null || echo "")
      NIX_INTERP="$(cat ${pkgs.stdenv.cc}/nix-support/dynamic-linker)"
      if [ "$CURRENT_INTERP" != "$NIX_INTERP" ]; then
        echo "Patching workerd binary for NixOS..."
        patchelf --set-interpreter "$NIX_INTERP" \
                 --set-rpath "${pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib pkgs.zlib pkgs.openssl ]}" \
                 node_modules/@cloudflare/workerd-linux-64/bin/workerd
      fi
    fi

    echo ""
    echo "Available commands:"
    echo "  - cargo build: Build the Rust project"
    echo "  - bun run dev: Run wrangler dev server"
    echo "  - bun run deploy: Deploy to Cloudflare Workers"
  '';
}
