# Synthetic SAR ADC GDS

`generate_sar_adc.py` creates an original educational 8-bit successive-
approximation ADC layout. It is a physical-design narrative, not a PDK-qualified
or electrically characterized circuit.

The generator constructs and round-trip validates a real GDSII library with
`gdstk`, then emits three generated site assets:

- `site/public/gds/sar-adc.gds` — downloadable GDSII.
- `site/public/gds/sar-adc-layout.json` — compact instanced scene geometry.
- `site/public/gds/sar-adc-poster.svg` — static and no-JavaScript fallback.

Run it from the repository's Nix environment:

```sh
bun run generate:gds
```

The normal `dev`, `check`, and `build` commands run it automatically.

## Architecture

The 240 × 160 μm illustrative floorplan contains:

- a 16 × 16 common-centroid-style CDAC with 256 unit capacitors;
- a 16-finger sampling switch bank;
- a symmetric dynamic comparator;
- four rows of synthetic SAR standard cells; and
- reference/common-mode distribution plus top-level signal routes.

The bit-reversed capacitor ordering spreads binary weights across the array for
a visually symmetric educational arrangement. It is not a claim of extracted
matching, DNL, INL, noise, sampling rate, or tapeout readiness.

## Measured output

Measured on the pinned environment on 2026-07-18:

| Item | Result |
| --- | ---: |
| Instanced rectangles | 1,137 |
| Triangles | 13,644 |
| Process-layer draw calls | 10 |
| GDSII | 73,124 bytes |
| Scene JSON | 33,411 bytes raw / 5,980 bytes gzip |
| SVG fallback | 81,432 bytes raw / 5,021 bytes gzip |
| Lazy scene chunk | 888,249 bytes raw / 232,710 bytes gzip |
| Total lazy viewer JavaScript | 295,394 bytes gzip |

The home page uses `client:visible` with a 320 px root margin. React, R3F,
Three.js, and scene JSON are not requested until the viewer approaches the
viewport. The JSON request and scene-module import begin in parallel. Rendering
uses one instanced mesh per layer, a maximum device-pixel ratio of 1.5, and
React Three Fiber's `frameloop="demand"`; no idle 60 FPS loop runs.

The current measurements do not justify Rust/WASM in the visitor path. GDS
creation and validation remain build-time Python/`gdstk`; the browser receives
only prepared rectangles and metadata.
