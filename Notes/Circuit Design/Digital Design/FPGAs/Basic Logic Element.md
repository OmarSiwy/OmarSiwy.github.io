---
title: Basic Logic Element
description: "The minimal FPGA cell: one LUT plus an optional flip-flop selected by a config bit — free pipelining, because an unused FF is wasted silicon rather than saved area."
kind: circuit
source: "ASA §4.1.1 and §4.1.4, pp. 89-94; §5.5.1, p. 135"
status: seed
spade: simulated
tags: [digital, fpgas, lut, flip-flop, pipelining]
aliases:
  - BLE
  - BLEs
  - Basic Logic Elements
  - Logic Element
---

# Basic Logic Element

The unit an FPGA is billed in: one look-up table followed by a flip-flop that a configuration bit may bypass, so that any $\alpha$-input Boolean function and one pipeline register cost exactly one cell between them.

```tikz title="Minimal BLE: a LUT4 with an optional flip-flop, bypassed by a configuration cell"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]
% ---- BLE boundary
\draw[dashed,rounded corners=3pt] (-2.1,-2.7) rectangle (4.5,2.7);

% ---- LUT
\draw (0,1.2) rectangle (3.0,2.4);
\node at (1.5,2.05) {LUT4};
\node[font=\scriptsize] at (1.5,1.55) {$2^4 = 16$ config cells};
\draw[->] (0.5,3.0) -- (0.5,2.4); \node[anchor=south] at (0.5,3.02) {$a$};
\draw[->] (1.1,3.0) -- (1.1,2.4); \node[anchor=south] at (1.1,3.02) {$b$};
\draw[->] (1.7,3.0) -- (1.7,2.4); \node[anchor=south] at (1.7,3.02) {$c$};
\draw[->] (2.3,3.0) -- (2.3,2.4); \node[anchor=south] at (2.3,3.02) {$d$};
\node[anchor=west,font=\scriptsize] at (2.5,3.05) {1 bit each};

% ---- LUT output, fanning to the FF and to the bypass
\draw (1.5,1.2) -- (1.5,0.7);
\fill (1.5,0.7) circle (0.05);
\node[anchor=west] at (1.56,0.92) {$o$ (1)};
\draw (1.5,0.7) -- (0.35,0.7) -- (0.35,0.25);
\draw[->] (0.35,0.25) -- (0.9,0.25);
\draw (1.5,0.7) -- (3.6,0.7) -- (3.6,-1.05);

% ---- flip-flop
\draw (0.9,-0.45) rectangle (2.1,0.45);
\node[anchor=west] at (0.95,0.25) {D};
\node[anchor=east] at (2.05,0.25) {Q};
\draw (0.9,-0.05) -- (1.08,-0.17) -- (0.9,-0.29);
\draw[->] (-1.3,-0.17) -- (0.9,-0.17);
\node[anchor=south] at (-1.0,-0.15) {clk};
\draw (2.1,0.25) -- (2.6,0.25) -- (2.6,-1.05);

% ---- bypass multiplexer
\draw (2.35,-1.05) -- (3.85,-1.05) -- (3.45,-1.65) -- (2.75,-1.65) -- cycle;
\node[anchor=south east,font=\scriptsize] at (2.60,-1.03) {1};
\node[anchor=south west,font=\scriptsize] at (3.60,-1.03) {0};

% ---- the bypass configuration cell
\draw[fill=white] (1.30,-1.45) rectangle (1.70,-1.15);
\node[anchor=east] at (1.25,-1.30) {bypass cell (1)};
\draw[->] (1.70,-1.30) -- (2.52,-1.30);

% ---- output
\draw[->] (3.1,-1.65) -- (3.1,-2.7);
\node[anchor=north] at (3.1,-2.75) {$y$ (1)};

\node[anchor=north west,align=left] at (-2.1,-3.3)
  {All datapath signals are 1 bit wide; 17 SRAM configuration cells per BLE\\
   (16 truth-table + 1 bypass). $\bullet$ = connection.};
\end{circuitikz}
\end{document}
```

*After Fig. 4.2, p. 89.*

**Read the bypass as configuration, not as logic.** The white cell driving the output multiplexer is an SRAM bit in the same configuration memory that holds the truth table, written once when the bitstream is loaded (p. 87). It selects the flip-flop's $Q$ when it holds a 1, and the LUT's combinational output $o$ otherwise; the BLE is then "purely combinatorial" (p. 89). Because the bit is constant at runtime, the multiplexer is not a datapath element at all — synthesis resolves it away and leaves either a wire or a register. Nothing in the drawing is optional in silicon: the mux, the FF and all $2^\alpha$ table cells are fabricated whether the design uses them or not.

**The input count $\alpha$ is the one architectural knob, and it is bounded from both sides.** A LUT$\alpha$ is a $2^\alpha$-bit ROM read through a $2^\alpha$:1 multiplexer, so **both** the cell count and the multiplexer depth grow as $2^\alpha$ — area and delay push in the same direction, which is unusual and is why there is a single optimum rather than a trade-off curve. Architectural exploration over real benchmark circuits placed the best area–delay products at $\alpha \in \{4,\ldots,6\}$ [AR04] (p. 90), and every commercial family has stayed inside that window since. The universality argument that makes any $\alpha$ acceptable, and the cost of a function needing more than $\alpha$ inputs, are in [[Lookup-Tables]].

**Every commercial BLE is the same three layers in the same order.** Comparing AMD's Figs. 4.5a–c against Intel's Fig. 4.6, the book extracts one common pattern (p. 94): first a layer of LUT(s) subdividable into smaller LUTs ([[Fracturable LUT]]); then a fast carry chain to accelerate addition ([[Fast Carry Chain]]); finally optional FF(s) to store the result. Fig. 4.2 above is that pattern with the middle layer removed — the minimal BLE, which no shipping device has been for two decades. Design against the three layers, not against a part number: the vendor-specific widths and counts in [[AMD BLE]] and [[Intel ALM]] age within a generation, the layering has not.

**The middle layer is the one that moves; the FF layer is the one that is free.** Versal drops the XOR out of the carry chain and computes carries in a separate lookahead unit (p. 92), and Intel hardens the whole full adder instead of building it from a LUT — so layer 2 is genuinely vendor-specific. Layer 3 is not, and it is the layer with the arithmetic consequence: on FPGA the LUT:FF ratio is close to $1{:}1$, the FFs sit *inside* the BLE wired directly to the LUT and carry outputs, and an FF left unconfigured is simply wasted silicon (p. 135). In an ASIC a flip-flop costs roughly as much as a full adder, so a pipeline stage is bought with area; here it is already paid for.

**The asymmetry has a direct consequence for operator design.** Registering an existing combinational result costs zero additional LUTs and zero additional routing, because the register is on the wire the result already travels. Deepening a pipeline on an FPGA therefore buys frequency at almost no area, which is why [[Adders]] concludes that pipelining a plain carry-chain adder beats spending LUTs on carry-acceleration topologies. The condition is precise, though, and worth stating as the thing to check: the register must land **exactly at a BLE output**. A retiming step that wants a register in the middle of what the mapper packed into one LUT cannot use that BLE's flip-flop — it has to spend a whole further BLE whose LUT computes the identity function.

> [!note] "Free" means free *given* that the LUT is already there.
> Free pipelining is not a property of flip-flops on FPGAs, it is a property of flip-flops that are downstream of a LUT you were paying for anyway. A shift register or a delay line made of BLE flip-flops pays full price — one BLE per bit per stage, LUT included and unused — which is exactly the case [[Shift Register LUT]] and [[Distributed Memory]] exist to serve.

$$\boxed{\;y \;=\; (\overline{s}\wedge o)\;\vee\;(s\wedge q),\qquad o = f(a,b,c,d),\quad q_{n} = o_{n-1},\quad s \in \{0,1\}\ \text{fixed at configuration}\;}$$

Since $s$ is a constant, the identity collapses at synthesis by the annihilation laws $0 \wedge x = 0$ and $1 \wedge x = x$ to either $y = o$ or $y = q$: the pipeline register costs nothing beyond the BLE that $f$ already occupies.

**When it breaks.**

- **More than $\alpha$ inputs.** Past six inputs a function needs several LUTs plus generic routing between them; the cost curve is in [[Lookup-Tables]] and it doubles per extra input.
- **Registers not at a BLE output.** Retiming into the middle of a mapped LUT, or a register whose fanout forces duplication, spends a BLE per register with the LUT wasted. Free pipelining is a statement about the *output* of a cell, nothing else.
- **FF-heavy designs.** Delay lines and shift registers invert the ratio — LUTs idle, FFs exhausted. Move them to [[Shift Register LUT]] or [[Distributed Memory]].
- **No runtime choice.** The bypass bit is static. A datapath that must select between a registered and a combinational value *while running* pays for a real multiplexer, i.e. a LUT input and a level of logic.
- **The BLE stops being the right unit** once the operation is a multiplication or a table with an address wider than about eleven bits; [[Choosing an FPGA Primitive]] is where that hand-off is priced.

**RTL.**

```spade
/// One basic logic element: a LUT4 held in 16 configuration cells,
/// followed by a flip-flop that a 17th configuration cell may bypass.
entity ble4(clk: clock, cfg: uint<16>, ff_en: bool, a: bool, b: bool, c: bool, d: bool) -> bool {
    let addr = [a, b, c, d].as_uint();   // index 0 = LSB, so a is the low address bit
    let comb = cfg.as_bits()[addr];      // the 2^4 : 1 MUX of Fig. 4.3
    reg(clk) q = comb;
    if ff_en { q } else { comb }
}
```

`cfg` is the 16 truth-table cells and `ff_en` the 17th, the bypass cell of the diagram; `addr` is the $a\ldots d$ bundle, and because Spade packs array element 0 into the least-significant position, $a$ weights $2^0$ — get that backwards and the cell compiles clean while addressing a bit-reversed table. `comb` is the wire labelled $o$, `q` is $Q$, and the `if` is the output multiplexer. Synthesis differs from the drawing in one way that matters: `cfg` and `ff_en` are ordinary inputs here, so this elaborates as a real 16:1 mux plus a real 2:1 mux, whereas on a device both are configuration constants and the whole thing collapses into one BLE with nothing left over.

**Related Notes.**

- [[Lookup-Tables]] – depends-on: the first layer, why an $\alpha$-LUT realizes every $\alpha$-input function, and what the seventh input costs.
- [[Fracturable LUT]] – extends: the subdivision the first layer is allowed to perform.
- [[Fast Carry Chain]] – extends: the middle layer this note draws as absent and every shipping BLE has.
- [[Introduction to Flip-Flops & Latches]] – depends-on: the third layer is edge-triggered, which is what makes the bypass a configuration choice with no timing consequence.
- [[Adders]] – supports: pipelining beats carry-acceleration on FPGAs precisely because of the free-FF asymmetry established here.
- [[AMD BLE]] – extends: how AMD fills the three layers, generation by generation.
- [[Intel ALM]] – compares: the same three layers with a hardened full adder in the middle instead of LUT-built XOR.
- [[Choosing an FPGA Primitive]] – compares: when the BLE stops being the cheapest way to compute a function.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- Ch. 4 opening, p. 87 — SRAM configuration held for the whole run, loaded in milliseconds.
- Sect. 4.1.1, pp. 89–90 — minimal BLE and Fig. 4.2, the FF-enable SRAM cell, LUT$\alpha$ as a $2^\alpha$-bit ROM (Fig. 4.3), best $\alpha \in \{4,\ldots,6\}$ [AR04].
- Sect. 4.1.2, p. 92 — Versal's carry-lookahead unit, i.e. the vendor drift in layer 2.
- Sect. 4.1.4, p. 94 — the three-layer common pattern across Figs. 4.5 and 4.6.
- Sect. 5.5.1, p. 135 — LUT:FF ratio near 1, unused FFs wasted, FPGA vs ASIC pipelining cost.
