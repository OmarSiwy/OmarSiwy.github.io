{
  description = "Omar El-Sawy portfolio development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      formatter = forAllSystems (system: nixpkgs.legacyPackages.${system}.nixfmt);

      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          pythonWithGds = pkgs.python3.withPackages (pythonPackages: [
            pythonPackages.gdstk
          ]);
          runtimeLibraries = [
            pkgs.stdenv.cc.cc.lib
            pkgs.zlib
            pkgs.openssl
          ];
        in
        {
          default = pkgs.mkShell {
            packages = [
              # Astro, TypeScript, Cloudflare, and browser tooling.
              pkgs.bun
              pkgs.nodejs_22

              # Rust, WASM, and optional GDS processing.
              pkgs.rustc
              pkgs.cargo
              pkgs.rustfmt
              pkgs.clippy
              pkgs.wasm-pack
              pkgs.binaryen
              pkgs.lld
              pkgs.klayout
              pythonWithGds

              # Native build and NixOS workerd compatibility.
              pkgs.pkg-config
              pkgs.openssl
              pkgs.zlib
              pkgs.patchelf

              # Resume generation and repository utilities.
              pkgs.texliveFull
              pkgs.git
              pkgs.curl
              pkgs.jq

              # Simulating the Spade RTL embedded in the Digital Design notes.
              # The Spade compiler only type-checks and lowers; iverilog runs the
              # emitted Verilog against a testbench, so a bit-reversed adder
              # cannot pass as "verified".
              pkgs.iverilog
            ];

            RUST_BACKTRACE = "1";
            LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath runtimeLibraries;

            shellHook = ''
              echo "Portfolio development environment"
              echo "  Bun:  $(bun --version)"
              echo "  Node: $(node --version)"
              echo "  Rust: $(rustc --version)"
              echo "  GDS:  $(python -c 'import gdstk; print(gdstk.__version__)')"

              # Wrangler bundles a dynamically linked workerd binary. Patch an
              # already-installed binary for NixOS, but never install packages
              # or otherwise require network access merely by entering the shell.
              for portfolio_workerd_path in \
                "$PWD/node_modules/@cloudflare/workerd-linux-64/bin/workerd" \
                "$PWD/site/node_modules/@cloudflare/workerd-linux-64/bin/workerd"
              do
                if [ -f "$portfolio_workerd_path" ]; then
                  portfolio_current_interpreter="$(patchelf --print-interpreter "$portfolio_workerd_path" 2>/dev/null || true)"
                  portfolio_nix_interpreter="$(cat ${pkgs.stdenv.cc}/nix-support/dynamic-linker)"
                  if [ "$portfolio_current_interpreter" != "$portfolio_nix_interpreter" ]; then
                    patchelf \
                      --set-interpreter "$portfolio_nix_interpreter" \
                      --set-rpath "${pkgs.lib.makeLibraryPath runtimeLibraries}" \
                      "$portfolio_workerd_path"
                  fi
                fi
              done

              echo
              echo "Run 'bun install' once, then use the scripts in package.json."
            '';
          };
        }
      );
    };
}
