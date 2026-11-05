#!/usr/bin/env python3
"""Generate a synthetic 8-bit SAR ADC GDS and compact web scene.

This layout is an educational floorplan created specifically for the portfolio.
It contains no foundry rules, PDK cells, proprietary geometry, or measured
electrical claims. All dimensions are illustrative micrometres.
"""

from __future__ import annotations

import html
import json
import math
from pathlib import Path
from typing import Any

import gdstk


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DIRECTORY = REPOSITORY_ROOT / "site" / "public" / "gds"
GDS_PATH = PUBLIC_DIRECTORY / "sar-adc.gds"
JSON_PATH = PUBLIC_DIRECTORY / "sar-adc-layout.json"
POSTER_PATH = PUBLIC_DIRECTORY / "sar-adc-poster.svg"

DIE_WIDTH = 240.0
DIE_HEIGHT = 160.0

LAYERS: list[dict[str, Any]] = [
    {
        "id": "substrate",
        "name": "Die boundary",
        "gdsLayer": 235,
        "datatype": 4,
        "color": "#1a2630",
        "z": 0.0,
        "thickness": 0.8,
        "opacity": 1.0,
    },
    {
        "id": "nwell",
        "name": "N-well",
        "gdsLayer": 64,
        "datatype": 20,
        "color": "#3c7d78",
        "z": 1.0,
        "thickness": 0.45,
        "opacity": 0.42,
    },
    {
        "id": "active",
        "name": "Active diffusion",
        "gdsLayer": 65,
        "datatype": 20,
        "color": "#79d1a6",
        "z": 1.8,
        "thickness": 0.55,
        "opacity": 0.86,
    },
    {
        "id": "poly",
        "name": "Polysilicon",
        "gdsLayer": 66,
        "datatype": 20,
        "color": "#ef6574",
        "z": 2.7,
        "thickness": 0.45,
        "opacity": 0.94,
    },
    {
        "id": "metal1",
        "name": "Metal 1",
        "gdsLayer": 67,
        "datatype": 20,
        "color": "#5ca6ee",
        "z": 4.0,
        "thickness": 0.65,
        "opacity": 0.9,
    },
    {
        "id": "via1",
        "name": "Via 1",
        "gdsLayer": 67,
        "datatype": 44,
        "color": "#f1df87",
        "z": 5.0,
        "thickness": 0.75,
        "opacity": 1.0,
    },
    {
        "id": "metal2",
        "name": "Metal 2",
        "gdsLayer": 68,
        "datatype": 20,
        "color": "#ba8bf1",
        "z": 6.2,
        "thickness": 0.8,
        "opacity": 0.88,
    },
    {
        "id": "via2",
        "name": "Via 2",
        "gdsLayer": 68,
        "datatype": 44,
        "color": "#ffd36e",
        "z": 7.4,
        "thickness": 0.8,
        "opacity": 1.0,
    },
    {
        "id": "metal3",
        "name": "Metal 3",
        "gdsLayer": 69,
        "datatype": 20,
        "color": "#e58d52",
        "z": 8.8,
        "thickness": 0.95,
        "opacity": 0.91,
    },
    {
        "id": "metal4",
        "name": "Metal 4",
        "gdsLayer": 70,
        "datatype": 20,
        "color": "#52d1c4",
        "z": 10.5,
        "thickness": 1.1,
        "opacity": 0.94,
    },
]

BLOCKS = [
    {
        "id": "cdac",
        "name": "Binary-weighted CDAC",
        "shortName": "CDAC",
        "bounds": [8.0, 38.0, 124.0, 110.0],
        "description": "A 16 × 16 common-centroid array of 256 synthetic unit capacitors implements the 8-bit charge-redistribution DAC.",
    },
    {
        "id": "sample-switch",
        "name": "Bootstrapped sampling switch",
        "shortName": "S/H",
        "bounds": [8.0, 10.0, 124.0, 23.0],
        "description": "Parallel switch fingers sample VIN onto the CDAC bottom plate while a compact bootstrap network controls the gate drive.",
    },
    {
        "id": "comparator",
        "name": "Dynamic comparator",
        "shortName": "COMP",
        "bounds": [144.0, 92.0, 48.0, 57.0],
        "description": "A symmetric StrongARM-style latch compares the CDAC residue against the common-mode reference after each bit trial.",
    },
    {
        "id": "sar-logic",
        "name": "SAR sequencer",
        "shortName": "SAR",
        "bounds": [143.0, 10.0, 89.0, 75.0],
        "description": "The digital sequencer performs one binary-search decision per clock and drives the eight CDAC control lines.",
    },
    {
        "id": "reference",
        "name": "Reference and common-mode buffer",
        "shortName": "REF",
        "bounds": [197.0, 94.0, 35.0, 55.0],
        "description": "A schematic reference block distributes VREFP, VREFN, and VCM to the capacitor array and comparator.",
    },
]

SIGNALS = [
    {"id": "vin", "name": "VIN", "color": "#ffb36b"},
    {"id": "sampled", "name": "V-SAMP", "color": "#f18479"},
    {"id": "vcm", "name": "VCM", "color": "#72d6cb"},
    {"id": "vrefp", "name": "VREFP", "color": "#ffcf70"},
    {"id": "vrefn", "name": "VREFN", "color": "#7db6ff"},
    {"id": "compare", "name": "COMPARE", "color": "#dc8eff"},
    {"id": "clock", "name": "SAR CLK", "color": "#90e287"},
    *[
        {"id": f"dac-b{bit}", "name": f"DAC B{bit}", "color": "#e58d52"}
        for bit in range(7, -1, -1)
    ],
]


def rounded(value: float) -> float:
    return round(value, 3)


def reversed_bits(value: int, width: int = 8) -> int:
    result = 0
    for _ in range(width):
        result = (result << 1) | (value & 1)
        value >>= 1
    return result


def bit_for_unit(unit_index: int) -> int:
    rank = reversed_bits(unit_index)
    thresholds = [128, 192, 224, 240, 248, 252, 254, 255]
    for bit, threshold in zip(range(7, -1, -1), thresholds, strict=True):
        if rank < threshold:
            return bit
    return -1


def build_layout() -> tuple[gdstk.Library, dict[str, list[list[float | int]]]]:
    library = gdstk.Library(unit=1e-6, precision=1e-9)
    cell = library.new_cell("SAR_ADC_8B_SYNTHETIC")
    layer_rectangles: dict[str, list[list[float | int]]] = {layer["id"]: [] for layer in LAYERS}
    layer_index = {layer["id"]: layer for layer in LAYERS}
    block_index = {block["id"]: index for index, block in enumerate(BLOCKS)}
    signal_index = {signal["id"]: index for index, signal in enumerate(SIGNALS)}

    def add_rectangle(
        layer_id: str,
        x: float,
        y: float,
        width: float,
        height: float,
        block_id: str | None = None,
        signal_id: str | None = None,
    ) -> None:
        if width <= 0 or height <= 0:
            raise ValueError(f"Invalid rectangle {layer_id}: {width} × {height}")
        layer = layer_index[layer_id]
        cell.add(
            gdstk.rectangle(
                (x, y),
                (x + width, y + height),
                layer=layer["gdsLayer"],
                datatype=layer["datatype"],
            )
        )
        layer_rectangles[layer_id].append(
            [
                rounded(x),
                rounded(y),
                rounded(width),
                rounded(height),
                block_index.get(block_id, -1),
                signal_index.get(signal_id, -1),
            ]
        )

    # Die, seal ring, and power frame.
    add_rectangle("substrate", 0.0, 0.0, DIE_WIDTH, DIE_HEIGHT)
    for rectangle in [
        (2.0, 2.0, 236.0, 1.6),
        (2.0, 156.4, 236.0, 1.6),
        (2.0, 3.6, 1.6, 152.8),
        (236.4, 3.6, 1.6, 152.8),
    ]:
        add_rectangle("active", *rectangle)
        add_rectangle("metal1", *rectangle)

    # 8-bit CDAC: 256 unit capacitors spread by bit-reversed ordering to make a
    # visibly symmetric educational common-centroid array.
    add_rectangle("nwell", 8.0, 38.0, 124.0, 110.0, "cdac")
    capacitor_origin_x = 10.0
    capacitor_origin_y = 42.0
    pitch_x = 7.45
    pitch_y = 6.35
    for row in range(16):
        for column in range(16):
            unit_index = row * 16 + column
            bit = bit_for_unit(unit_index)
            signal_id = f"dac-b{bit}" if bit >= 0 else "vcm"
            x = capacitor_origin_x + column * pitch_x
            y = capacitor_origin_y + row * pitch_y
            add_rectangle("metal2", x + 0.35, y + 0.35, 6.7, 5.65, "cdac", "vcm")
            add_rectangle("metal3", x + 1.05, y + 1.0, 5.3, 4.35, "cdac", signal_id)
            add_rectangle("via2", x + 3.15, y + 2.65, 1.1, 1.0, "cdac", signal_id)

    # CDAC buses: common bottom plate, bit lines, and reference spine.
    add_rectangle("metal2", 8.8, 38.8, 121.8, 1.7, "cdac", "vcm")
    add_rectangle("metal2", 8.8, 146.0, 121.8, 1.4, "cdac", "vcm")
    for bit in range(8):
        x = 11.2 + bit * 14.7
        add_rectangle("metal4", x, 39.0, 0.9, 108.0, "cdac", f"dac-b{7 - bit}")
    add_rectangle("metal4", 129.0, 40.0, 2.1, 106.0, "cdac", "vrefp")

    # Sampling switch bank and bootstrap route.
    add_rectangle("nwell", 8.0, 10.0, 124.0, 23.0, "sample-switch")
    add_rectangle("metal2", 9.0, 13.0, 121.5, 1.3, "sample-switch", "vin")
    add_rectangle("metal2", 9.0, 29.2, 121.5, 1.3, "sample-switch", "sampled")
    for finger in range(16):
        x = 11.0 + finger * 7.35
        add_rectangle("active", x, 18.0, 5.1, 5.4, "sample-switch", "vin")
        add_rectangle("poly", x + 2.2, 16.5, 0.75, 8.4, "sample-switch", "clock")
        add_rectangle("metal1", x + 0.3, 18.6, 1.3, 4.2, "sample-switch", "vin")
        add_rectangle("metal1", x + 3.5, 18.6, 1.3, 4.2, "sample-switch", "sampled")
        add_rectangle("via1", x + 0.55, 20.0, 0.8, 1.0, "sample-switch", "vin")
        add_rectangle("via1", x + 3.75, 20.0, 0.8, 1.0, "sample-switch", "sampled")

    # Dynamic comparator, kept strongly symmetric around its differential axis.
    add_rectangle("nwell", 144.0, 92.0, 48.0, 57.0, "comparator")
    for side in range(2):
        x_offset = 149.0 + side * 23.0
        for device in range(4):
            y = 99.0 + device * 10.0
            add_rectangle("active", x_offset, y, 14.0, 5.0, "comparator", "compare")
            add_rectangle("poly", x_offset + 3.2, y - 1.0, 0.8, 7.0, "comparator", "compare")
            add_rectangle("poly", x_offset + 9.8, y - 1.0, 0.8, 7.0, "comparator", "clock")
            add_rectangle("metal1", x_offset + 0.6, y + 1.6, 12.8, 1.3, "comparator", "compare")
    add_rectangle("metal2", 150.0, 142.0, 36.0, 1.5, "comparator", "vcm")
    add_rectangle("metal2", 169.2, 96.0, 1.6, 49.0, "comparator", "compare")
    add_rectangle("metal3", 145.5, 119.0, 45.0, 1.7, "comparator", "compare")

    # SAR standard-cell rows and the eight bit-control trunks.
    add_rectangle("nwell", 143.0, 10.0, 89.0, 75.0, "sar-logic")
    for row in range(4):
        for column in range(8):
            x = 147.0 + column * 10.1
            y = 16.0 + row * 14.6
            add_rectangle("active", x, y, 7.8, 3.3, "sar-logic", "clock")
            add_rectangle("active", x, y + 5.2, 7.8, 3.3, "sar-logic", "compare")
            add_rectangle("poly", x + 2.0, y - 0.7, 0.7, 10.0, "sar-logic", "clock")
            add_rectangle("poly", x + 5.1, y - 0.7, 0.7, 10.0, "sar-logic", "compare")
            add_rectangle("metal1", x + 0.3, y + 3.7, 7.2, 1.1, "sar-logic", "clock")
    add_rectangle("metal2", 145.0, 12.0, 85.0, 1.3, "sar-logic", "clock")
    add_rectangle("metal2", 145.0, 80.5, 85.0, 1.3, "sar-logic", "compare")
    for bit in range(8):
        x = 150.0 + bit * 10.0
        add_rectangle("metal3", x, 14.0, 1.15, 68.0, "sar-logic", f"dac-b{bit}")

    # Reference/common-mode generator and distribution routes.
    add_rectangle("nwell", 197.0, 94.0, 35.0, 55.0, "reference")
    for row in range(5):
        y = 100.0 + row * 8.6
        add_rectangle("active", 201.0, y, 26.0, 4.3, "reference", "vcm")
        for gate in range(4):
            add_rectangle("poly", 204.0 + gate * 6.1, y - 0.8, 0.75, 5.9, "reference", "vrefp")
        add_rectangle("metal1", 202.0, y + 1.5, 24.0, 1.2, "reference", "vrefn")
    add_rectangle("metal3", 201.0, 97.0, 2.0, 49.0, "reference", "vrefp")
    add_rectangle("metal3", 225.0, 97.0, 2.0, 49.0, "reference", "vrefn")
    add_rectangle("metal4", 194.0, 150.5, 39.0, 1.8, "reference", "vcm")

    # Top-level signal routes and bond-pad abstractions.
    add_rectangle("metal4", 5.0, 6.0, 130.0, 1.6, None, "vin")
    add_rectangle("metal4", 134.0, 6.0, 100.0, 1.6, None, "clock")
    add_rectangle("metal4", 135.0, 87.0, 101.0, 1.6, None, "compare")
    for pad_x, signal in [(8.0, "vin"), (42.0, "vrefp"), (76.0, "vrefn"), (110.0, "vcm"), (224.0, "clock")]:
        add_rectangle("metal4", pad_x, 2.0, 8.0, 8.0, None, signal)

    for block in BLOCKS:
        x, y, width, height = block["bounds"]
        cell.add(
            gdstk.Label(
                block["shortName"],
                (x + width / 2, y + height / 2),
                anchor="o",
                layer=71,
                texttype=0,
            )
        )

    return library, layer_rectangles


def create_poster(layout: dict[str, Any]) -> str:
    width = 960
    height = 680
    margin_x = 54
    margin_top = 88
    scale = min((width - 2 * margin_x) / DIE_WIDTH, (height - margin_top - 52) / DIE_HEIGHT)

    def svg_rectangle(rectangle: list[float | int], color: str, opacity: float) -> str:
        x, y, rect_width, rect_height = [float(value) for value in rectangle[:4]]
        svg_x = margin_x + x * scale
        svg_y = margin_top + (DIE_HEIGHT - y - rect_height) * scale
        return (
            f'<rect x="{svg_x:.2f}" y="{svg_y:.2f}" width="{rect_width * scale:.2f}" '
            f'height="{rect_height * scale:.2f}" fill="{color}" fill-opacity="{opacity:.3f}"/>'
        )

    visible_layer_ids = {"active", "poly", "metal1", "metal2", "metal3", "metal4"}
    shapes = []
    for layer in layout["layers"]:
        if layer["id"] not in visible_layer_ids:
            continue
        poster_opacity = min(float(layer["opacity"]), 0.78)
        shapes.extend(svg_rectangle(rectangle, layer["color"], poster_opacity) for rectangle in layer["rectangles"])

    block_shapes = []
    for block in layout["blocks"]:
        x, y, block_width, block_height = block["bounds"]
        svg_x = margin_x + x * scale
        svg_y = margin_top + (DIE_HEIGHT - y - block_height) * scale
        block_shapes.append(
            f'<rect x="{svg_x:.2f}" y="{svg_y:.2f}" width="{block_width * scale:.2f}" '
            f'height="{block_height * scale:.2f}" rx="4" fill="none" stroke="#dce5ea" '
            'stroke-opacity=".62" stroke-width="1.2" stroke-dasharray="5 5"/>'
        )
        block_shapes.append(
            f'<text x="{svg_x + 8:.2f}" y="{svg_y + 18:.2f}" fill="#f4f7f8" '
            f'font-family="ui-monospace,monospace" font-size="11">{html.escape(block["shortName"])}</text>'
        )

    return "".join(
        [
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 680" role="img" ',
            'aria-labelledby="title description">',
            '<title id="title">Synthetic 8-bit SAR ADC GDS layout</title>',
            '<desc id="description">Top-down poster showing the capacitor DAC, sampling switch, comparator, SAR logic, and reference blocks.</desc>',
            '<rect width="960" height="680" rx="12" fill="#080d12"/>',
            '<path d="M54 58H906" stroke="#283640"/>',
            '<text x="54" y="38" fill="#e9eef1" font-family="ui-sans-serif,system-ui" font-size="21" font-weight="600">SAR_ADC_8B_SYNTHETIC</text>',
            '<text x="906" y="38" text-anchor="end" fill="#82919a" font-family="ui-monospace,monospace" font-size="12">240 × 160 μm · educational layout</text>',
            f'<rect x="{margin_x}" y="{margin_top}" width="{DIE_WIDTH * scale:.2f}" height="{DIE_HEIGHT * scale:.2f}" fill="#101a22" stroke="#53636e"/>',
            *shapes,
            *block_shapes,
            '<g transform="translate(54 650)" font-family="ui-monospace,monospace" font-size="11" fill="#91a0a9">',
            '<circle cx="5" cy="-4" r="4" fill="#e58d52"/><text x="16" y="0">routing</text>',
            '<circle cx="100" cy="-4" r="4" fill="#ba8bf1"/><text x="111" y="0">capacitors</text>',
            '<circle cx="220" cy="-4" r="4" fill="#79d1a6"/><text x="231" y="0">devices</text>',
            '</g></svg>',
        ]
    )


def main() -> None:
    PUBLIC_DIRECTORY.mkdir(parents=True, exist_ok=True)

    library, layer_rectangles = build_layout()
    library.write_gds(GDS_PATH)

    round_trip_library = gdstk.read_gds(GDS_PATH)
    top_cells = round_trip_library.top_level()
    if len(top_cells) != 1 or top_cells[0].name != "SAR_ADC_8B_SYNTHETIC":
        raise RuntimeError("Generated GDS failed hierarchy round-trip validation")

    instance_count = sum(len(rectangles) for rectangles in layer_rectangles.values())
    layout_layers = [
        {**layer, "rectangles": layer_rectangles[layer["id"]]}
        for layer in LAYERS
        if layer_rectangles[layer["id"]]
    ]
    layout: dict[str, Any] = {
        "schemaVersion": 1,
        "meta": {
            "name": "Synthetic 8-bit SAR ADC",
            "cell": "SAR_ADC_8B_SYNTHETIC",
            "process": "Generic educational CMOS",
            "units": "μm",
            "resolutionNm": 1,
            "architecture": "8-bit charge-redistribution SAR",
            "electricalStatus": "Illustrative floorplan; not tapeout-ready or electrically characterized",
        },
        "bounds": [0.0, 0.0, DIE_WIDTH, DIE_HEIGHT],
        "layers": layout_layers,
        "blocks": BLOCKS,
        "signals": SIGNALS,
        "metrics": {
            "instances": instance_count,
            "triangles": instance_count * 12,
            "layerDrawCalls": len(layout_layers),
            "unitCapacitors": 256,
        },
    }

    compact_json = json.dumps(layout, ensure_ascii=False, separators=(",", ":"))
    JSON_PATH.write_text(compact_json + "\n", encoding="utf-8")
    POSTER_PATH.write_text(create_poster(layout), encoding="utf-8")

    print(
        "Generated synthetic SAR ADC: "
        f"{instance_count} instances, {instance_count * 12} triangles, "
        f"{len(layout_layers)} layer draw calls, "
        f"GDS {GDS_PATH.stat().st_size} B, "
        f"JSON {JSON_PATH.stat().st_size} B, "
        f"poster {POSTER_PATH.stat().st_size} B"
    )


if __name__ == "__main__":
    main()
