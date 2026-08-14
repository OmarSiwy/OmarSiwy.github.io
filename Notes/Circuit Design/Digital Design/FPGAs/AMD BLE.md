---
title: AMD BLE
description: "Three generations of the Xilinx/AMD logic element — Virtex-4 LUT4 with a dedicated AND, Virtex-5/7/UltraScale fracturable LUT6 with two FFs, Versal four LUT4s with cascade routing — and what changed in each."
kind: circuit
source: "ASA §4.1.2 and §4.1.4, pp. 91-94; §5.4.1, pp. 126-128"
status: seed
spade: simulated
tags: [digital, fpgas, lut, carry, ble]
aliases:
  - Xilinx BLE
  - AMD/Xilinx BLE
  - Virtex BLE
  - Versal BLE
  - Configurable Logic Block
  - CLB
---

# AMD BLE

The AMD/Xilinx logic element is a LUT layer, a hardened carry MUX and one or two flip-flops in a fixed order; across twenty years the LUT layer got wider and then re-split, but the ordering never changed.

```tikz title="Three generations of the AMD/Xilinx BLE: Virtex-4, Virtex-5/7 and UltraScale(+), and Versal"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]

% ================= (a) Virtex-4 =================
\begin{scope}[xshift=0cm]
  \draw[thick] (0,-1.05) rectangle (5.2,3.7);
  \node[anchor=south] at (2.6,3.75) {\bfseries (a) Virtex-4 BLE (half slice)};
  \foreach \x/\n in {0.6/a,1.0/b,1.4/c,1.8/d}{
    \draw[->] (\x,3.55) -- (\x,2.9);
    \node[anchor=south,font=\footnotesize] at (\x,3.55) {$\n$};}
  \draw[->] (0.6,3.40) -- (3.9,3.40) -- (3.9,2.9);
  \draw[->] (1.0,3.22) -- (4.1,3.22) -- (4.1,2.9);
  \filldraw (0.6,3.40) circle (0.035); \filldraw (1.0,3.22) circle (0.035);
  \draw (0.4,2.3) rectangle (2.0,2.9); \node at (1.2,2.6) {LUT4};
  \node[anchor=west,font=\footnotesize] at (2.1,2.05) {16 SRAM cells};
  \draw (3.6,2.3) rectangle (4.4,2.9); \node at (4.0,2.6) {\&};
  \draw (2.4,1.35) -- (3.0,1.5) -- (3.0,0.7) -- (2.4,0.85) -- cycle;
  \node[font=\footnotesize] at (2.72,1.1) {MUX};
  \draw (1.2,2.3) -- (1.2,0.25);
  \filldraw (1.2,1.75) circle (0.035);
  \draw[->] (1.2,1.75) -- (2.7,1.75) -- (2.7,1.5);
  \node[anchor=west,font=\footnotesize] at (1.28,1.92) {$p$ (1)};
  \draw[->] (4.0,2.3) -- (4.0,1.28) -- (3.0,1.28);
  \draw[->] (5.2,0.92) -- (3.0,0.92);
  \node[anchor=west,font=\footnotesize] at (5.25,0.92) {$c_{\mathrm{in}}$ (1)};
  \draw[->] (2.4,1.1) -- (0,1.1);
  \node[anchor=east,font=\footnotesize] at (-0.05,1.1) {(1) $c_{\mathrm{out}}$};
  \node[xor port,scale=0.7,rotate=-90] (xa) at (3.9,-0.1) {};
  \draw (1.2,0.25) -| (xa.in 1);
  \filldraw (4.6,0.92) circle (0.035);
  \draw (4.6,0.92) -- (4.6,0.45) -| (xa.in 2);
  \draw (3.65,-1.05) rectangle (4.15,-0.6); \node[font=\footnotesize] at (3.9,-0.82) {FF};
  \draw[->] (xa.out) -- (3.9,-0.6);
  \draw[->] (3.9,-1.05) -- (3.9,-1.45);
  \node[anchor=north,font=\footnotesize] at (3.9,-1.48) {$y$ (1)};
\end{scope}

% ================= (b) Virtex-5/6/7, UltraScale(+) =================
\begin{scope}[xshift=8.8cm]
  \draw[thick] (0,-1.05) rectangle (5.6,3.7);
  \node[anchor=south] at (2.8,3.75) {\bfseries (b) Virtex-5/6/7, UltraScale(+) BLE};
  \foreach \x/\n in {0.5/a,0.9/b,1.3/c,1.7/d,2.1/e}{
    \draw[->] (\x,3.55) -- (\x,3.0);
    \node[anchor=south,font=\footnotesize] at (\x,3.55) {$\n$};}
  \draw (0.5,3.0) -- (2.1,3.0);
  \draw[->] (0.85,3.0) -- (0.85,2.9);  \draw[->] (2.15,3.0) -- (2.15,2.9);
  \draw (0.3,2.3) rectangle (1.4,2.9); \node[font=\footnotesize] at (0.85,2.6) {LUT5};
  \draw (1.6,2.3) rectangle (2.7,2.9); \node[font=\footnotesize] at (2.15,2.6) {LUT5};
  \node[anchor=west,font=\footnotesize] at (2.8,2.6) {64 SRAM cells};
  \draw[->] (2.5,3.55) -- (2.5,1.75) -- (2.06,1.75);
  \node[anchor=south,font=\footnotesize] at (2.5,3.55) {$f$};
  \draw (0.85,2.3) -- (0.85,1.95);  \draw (2.15,2.3) -- (2.15,1.95);
  \draw (0.6,1.95) -- (2.2,1.95) -- (1.75,1.55) -- (1.25,1.55) -- cycle;
  \node[font=\footnotesize] at (1.5,1.79) {mux};
  \draw (1.5,1.55) -- (1.5,1.45) -- (2.6,1.45) -- (2.6,1.32);
  \node[anchor=south,font=\footnotesize] at (2.45,1.47) {O6};
  \filldraw (0.85,2.12) circle (0.035);
  \draw (0.85,2.12) -- (0.4,2.12) -- (0.4,-0.6);
  \filldraw (0.4,1.2) circle (0.035);
  \draw[->] (0.4,1.2) -- (2.9,1.2);
  \node[anchor=south,font=\footnotesize] at (1.3,1.21) {O5};
  \draw (2.3,1.25) -- (2.9,1.4) -- (2.9,0.6) -- (2.3,0.75) -- cycle;
  \node[font=\footnotesize] at (2.62,1.0) {MUX};
  \draw[->] (5.6,0.8) -- (2.9,0.8);
  \node[anchor=west,font=\footnotesize] at (5.65,0.8) {$c_{\mathrm{in}}$ (1)};
  \draw[->] (2.3,1.0) -- (0,1.0);
  \node[anchor=east,font=\footnotesize] at (-0.05,1.0) {(1) $c_{\mathrm{out}}$};
  \node[xor port,scale=0.7,rotate=-90] (xb) at (3.7,-0.1) {};
  \filldraw (2.05,1.45) circle (0.035);
  \draw (2.05,1.45) -- (2.05,0.25) -| (xb.in 1);
  \filldraw (4.4,0.8) circle (0.035);
  \draw (4.4,0.8) -- (4.4,0.45) -| (xb.in 2);
  \draw (3.45,-1.05) rectangle (3.95,-0.6); \node[font=\footnotesize] at (3.7,-0.82) {FF};
  \draw[->] (xb.out) -- (3.7,-0.6);
  \draw[->] (3.7,-1.05) -- (3.7,-1.45);
  \node[anchor=north,font=\footnotesize] at (3.7,-1.48) {$y_1$ (1)};
  \draw[dashed] (0.15,-1.05) rectangle (0.65,-0.6); \node[font=\footnotesize] at (0.4,-0.82) {FF};
  \draw[->] (0.4,-1.05) -- (0.4,-1.45);
  \node[anchor=north,font=\footnotesize] at (0.4,-1.48) {$y_2$ (1)};
\end{scope}

% ================= (c) Versal =================
\begin{scope}[xshift=2.4cm,yshift=-6.6cm]
  \draw[thick] (0,-0.95) rectangle (8.0,2.9);
  \node[anchor=south] at (4.0,2.95) {\bfseries (c) Versal BLE (1/8 slice)};
  \foreach \x/\n in {0.95/a,2.35/b,3.75/c,5.15/d,6.0/e,6.5/f}{
    \draw[->] (\x,2.75) -- (\x,2.5);
    \node[anchor=south,font=\footnotesize] at (\x,2.75) {$\n$};}
  \draw (0.95,2.5) -- (6.5,2.5);
  \foreach \x in {0.95,2.35,3.75,5.15}{\draw[->] (\x,2.5) -- (\x,2.35);}
  \foreach \x in {0.5,1.9,3.3,4.7}{\draw (\x,1.75) rectangle (\x+0.9,2.35);
    \node[font=\footnotesize] at (\x+0.45,2.05) {LUT4};}
  \draw (6.1,0.75) rectangle (7.8,1.45);
  \node[align=center,font=\footnotesize] at (6.95,1.1) {carry\\lookahead};
  \draw (0.95,1.75) -- (0.95,0.95) -- (6.1,0.95);
  \node[anchor=south,font=\footnotesize] at (1.6,0.96) {prop};
  \draw[->] (8.0,1.25) -- (7.8,1.25);
  \node[anchor=west,font=\footnotesize] at (8.05,1.25) {$c_{\mathrm{in}}$ (1)};
  \draw[->] (6.1,1.25) -- (0,1.25);
  \node[anchor=east,font=\footnotesize] at (-0.05,1.25) {(1) $c_{\mathrm{out}}$};
  \draw[->] (6.5,0.4) -- (0,0.4);
  \node[anchor=west,font=\footnotesize] at (6.55,0.4) {$\mathrm{casc}_{\mathrm{in}}$};
  \node[anchor=east,font=\footnotesize] at (-0.05,0.4) {$\mathrm{casc}_{\mathrm{out}}$};
  \foreach \x/\l in {2.35/{O5\_1},3.75/{O6},5.15/{O5\_2}}{
    \draw (\x,1.75) -- (\x,0.4); \filldraw (\x,0.4) circle (0.035);
    \node[anchor=west,font=\footnotesize] at (\x+0.06,1.6) {\l};}
  \foreach \x in {2.35,3.75}{
    \draw (\x-0.25,-0.95) rectangle (\x+0.25,-0.5);
    \node[font=\footnotesize] at (\x,-0.72) {FF};
    \draw[->] (\x,0.4) -- (\x,-0.5);
    \draw[->] (\x,-0.95) -- (\x,-1.35);}
  \node[anchor=north,font=\footnotesize] at (2.35,-1.38) {$y_1$ (1)};
  \node[anchor=north,font=\footnotesize] at (3.75,-1.38) {$y_2$ (1)};
\end{scope}

\end{circuitikz}
\end{document}
```

*After Figs. 4.5a, 4.5b and 4.5c, p. 92. Configuration multiplexers are omitted, as in the book.*

**Fix the packing hierarchy before any part number.** AMD groups BLEs into **slices**, and slices into **configurable logic blocks (CLBs)** (p. 91). The count at each level is the only thing that has moved monotonically: a Virtex-4 slice holds 2 BLEs and a CLB holds 4 slices, so 8 BLEs per CLB; a series-5/6/7 slice holds 4 BLEs; an UltraScale/UltraScale+ slice holds 8 BLEs and a CLB holds exactly one slice, spending the recovered area on routing rather than logic; a Versal slice again holds 8 BLEs. Every "$N$ BLEs" cost figure in [[Adders]] and [[Multipliers]] converts to slices through this table and nothing else.

**Virtex-4: one LUT4, a dedicated AND, one flip-flop.** The LUT4 is $2^4 = 16$ configuration SRAM cells behind a 16:1 multiplexer (see [[Lookup-Tables]]), so it realises any $f(a,b,c,d)$ with $a,\dots,d$ each 1 bit and one 1-bit output. That output, call it $p$, is *not* the BLE output — it is the select of the hardened carry multiplexer, and it is separately XORed with the 1-bit $c_{\text{in}}$ to make the 1-bit sum, which the flip-flop may or may not register depending on one configuration bit. The extra `&` gate is the generation's signature: a 1-bit AND of two of the four inputs, taken *outside* the LUT, whose only purpose is to form a partial product $x_i \wedge y_j$ for free while the LUT is busy computing something else ([[Multipliers]], p. 91).

**Virtex-5 onward: the LUT gets wider, then splits again.** From Virtex-5 the LUT4 becomes a **LUT6** — $2^6 = 64$ configuration cells — that can be configured as two independent LUT5s over the *same* five inputs $a\ldots e$, with the sixth input $f$ selecting between them. That is Boole's expansion read backwards, $f_6(a..e,f) = \bar f \wedge f_{\bar f}(a..e) \vee f \wedge f_f(a..e)$, and it is developed in [[Fracturable LUT]]. The two outputs are named `O6` (the full 6-input function, 1 bit) and `O5` (the lower LUT5 alone, 1 bit). The dedicated AND disappears: with six inputs and a fracture there are better ways to build partial products (p. 91), and `O5` takes over its wiring, feeding the carry MUX's data input. From the 6 and 7 series onward a **second flip-flop** is added so `O5` can be registered independently of the carry path — the grey FF in Fig. 4.5b.

> [!warning] The book is precise about which family gained the second flip-flop, and it is not Virtex-5
> Page 91 attributes the extra FF to "the 6 and 7 series as well as the UltraScale(+) architectures", and attributes the removal of the AND gate to the same set ("*They* also contain the same carry logic as the Virtex 4, but the AND gate is omitted"). Whether a Virtex-5 BLE still carries the AND gate is therefore left open by the source; Fig. 4.5b covers Virtex-5 through UltraScale+ with a single drawing and marks only the FF as generation-dependent.

**Why the carry recurrence is a multiplexer and not an OR.** The obvious form $c_{i+1} = g_i \vee (p_i \wedge c_i)$ needs an AND, an OR and a separately computed generate $g_i = x_i \wedge y_i$. AMD instead hardens (eqs. 5.50–5.51, p. 126)

$$p_i = x_i \oplus y_i, \qquad s_i = p_i \oplus c_i, \qquad c_{i+1} = (p_i \wedge c_i) \vee (\overline{p_i} \wedge x_i)$$

which is exactly a 2:1 MUX with select $p_i$. The two forms agree by case analysis on $p_i$. If $p_i = 1$ then $x_i \neq y_i$, so $g_i = x_i \wedge y_i = 0$ and the standard form gives $c_i$ — which is what the MUX passes. If $p_i = 0$ then $x_i = y_i$, so $g_i = x_i$ and the standard form gives $x_i$ — again what the MUX passes. The point is *where* the work lands: the LUT computes only $p_i$, one 4-to-1-bit function it was going to be configured for anyway, and the entire $c_i \to c_{i+1}$ path is a single pass gate with a pre-computed select. That is the fastest structure available in silicon and is why the chain crosses a bit in tens of picoseconds ([[Fast Carry Chain]]).

**Versal splits both LUT5s again and takes the XOR out of the chain.** The Versal BLE holds **four LUT4s** and two FFs, exposing `prop`, `O5_1`, `O6`, `O5_2` (1 bit each). Two changes follow. First, since a LUT4 is now individually addressable, the adder's sum XOR $s_i = p_i \oplus c_i$ can be computed *inside* a LUT4 rather than by a hardened gate, and its result is handed to the neighbouring BLE over a dedicated `cascin`/`cascout` pair instead of through the switch matrix (p. 92). Second, the carries are no longer a ripple of MUXes at all: a `LOOKAHEAD8` unit derives the *even* carries of the slice's eight BLEs from the propagate signals in one shot, and the odd carries and sums come out of the LUT4s (pp. 127–128). Fig. 4.5c draws a single MUX because it is logically equivalent, not because that is the silicon.

**The invariant is worth more than the table.** Every one of the three panels, and every Intel panel in [[Intel ALM]], is the same three layers in the same order (p. 94): a LUT layer subdividable into smaller LUTs, a fast carry chain, optional flip-flops. Design an operator against those three layers and it retargets; design it against "the Virtex-6 CARRY4 primitive" and it does not. The concrete numbers below are the part of this note that will age.

| | Virtex-4 | Virtex-5/6/7, UltraScale(+) | Versal |
| --- | --- | --- | --- |
| LUT layer | 1 LUT4, 16 cells | 1 LUT6, 64 cells $\to$ 2 LUT5 (shared inputs) | 4 LUT4 |
| Extra gate | dedicated `&` | — | — |
| Adder support | XOR + MUX, hardened | XOR + MUX, hardened | lookahead unit; XOR inside a LUT4 |
| Inter-BLE wires | $c_{\text{in}}/c_{\text{out}}$ | $c_{\text{in}}/c_{\text{out}}$ | $c_{\text{in}}/c_{\text{out}}$, `cascin`/`cascout` |
| FFs per BLE | 1 | 1 (Virtex-5), 2 (6/7/UltraScale(+)) | 2 |
| BLEs per slice | 2 | 4; 8 on UltraScale(+) | 8 |
| Slices per CLB | 4 | 4; 1 on UltraScale(+) | — |

$$\boxed{\ c_{i+1} = (p_i \wedge c_i) \vee (\overline{p_i} \wedge x_i)\quad\text{with}\quad p_i = x_i \oplus y_i,\qquad \text{BLE} = \text{LUT layer} \to \text{carry chain} \to \text{optional FF}\ }$$

**When it breaks.**

- The fracture is only free when both halves share a support set. Two genuinely independent 5-input functions do not fit one LUT6, so the "two LUT5s per BLE" figure is an upper bound the mapper rarely reaches — see [[Fracturable LUT]].
- The carry MUX form assumes $p_i$ is available before $c_i$ arrives. It is, because $p_i$ comes from the LUT and $c_i$ from the neighbour, but it means a merged-functionality adder that folds extra logic into the LUT lengthens the *setup* to the chain, not the chain itself ([[Adders]]).
- One flip-flop per BLE (Virtex-4) makes a two-output BLE useless for pipelining both halves; that is the real cost of the missing second FF, not area.
- Versal's `LOOKAHEAD8` only produces the even carries. An operator that wants an arbitrary carry tap mid-slice does not get one, and the odd bits cost LUT4s.
- The AND gate of Virtex-4 is dead weight for anything that is not a multiplier array; on later parts nothing replaces it, so partial-product generation moves back into the LUT layer.
- Accuracy is not a BLE property. Integer addition on the chain is exact at 0 ulp; every rounding decision belongs to the format ([[Number Formats]], [[Error Accuracy]]).

> [!warning] Not covered in the source — needs outside research
> The book gives no configuration-cell count for the Versal BLE, and does not say how the six inputs $a\ldots f$ are distributed over its four LUT4s (Fig. 4.5c draws the input bus without a routing detail). Four independent LUT4s would need 16 inputs; six are shown, so the sharing constraints must be substantial, and they are not stated.

```spade
/// One AMD BLE of the Virtex-5/6/7 and UltraScale(+) generation: a fracturable
/// LUT6 (64 configuration cells), the hardened carry XOR + MUX, two optional FFs.
entity ble6(
    clk: clock,
    init: uint<64>,   // the LUT6 configuration SRAM
    ins: [bool; 6],   // a..f; ins[0] = a is the LSB of the LUT address
    cin: bool,
    reg1: bool,       // configuration bits: registered or combinational
    reg2: bool,
) -> (bool, bool, bool) {           // (y1, y2, cout)
    let cells = init.as_bits();
    let o6 = cells[ins.as_uint()];                          // full 6-input function
    let o5 = cells[zext::<5, 6>(ins[0..5].as_uint())];      // lower LUT5, f tied to 0
    let sum  = o6 ^^ cin;                                   // hardened XOR
    let cout = if o6 { cin } else { o5 };                   // hardened carry MUX
    reg(clk) q1 = sum;
    reg(clk) q2 = o5;
    (if reg1 { q1 } else { sum }, if reg2 { q2 } else { o5 }, cout)
}

/// One Virtex-7 slice: four BLEs on the carry chain, configured as a 4-bit adder.
/// 0x66666666_AAAAAAAA is the LUT6 truth table of `if f { a xor b } else { a }`,
/// so with f tied high O6 = a xor b = propagate and O5 = a = the MUX data input.
entity slice4(clk: clock, x: uint<4>, y: uint<4>, cin: bool) -> uint<5> {
    let xb = x.as_bits();
    let yb = y.as_bits();
    let cfg: uint<64> = 0x66666666AAAAAAAA;
    let (s0, _, c1) = inst ble6(clk, cfg, [xb[0], yb[0], false, false, false, true], cin, false, false);
    let (s1, _, c2) = inst ble6(clk, cfg, [xb[1], yb[1], false, false, false, true], c1,  false, false);
    let (s2, _, c3) = inst ble6(clk, cfg, [xb[2], yb[2], false, false, false, true], c2,  false, false);
    let (s3, _, c4) = inst ble6(clk, cfg, [xb[3], yb[3], false, false, false, true], c3,  false, false);
    [s0, s1, s2, s3, c4].as_uint()
}
```

`init` is the drawing's 64 SRAM cells; `o6`/`o5` are the wires labelled O6 and O5; `cout` is the MUX output and `sum` the XOR output. Everything up to the two `reg`s is combinational, and `reg1`/`reg2` are the configuration bits that bypass them — the flip-flops exist whether or not they are used, which is the whole reason pipelining is cheap on FPGA. Widths: `ins` is 6 bits in, `cin`/`cout`/`y1`/`y2` are 1 bit each, and `slice4` grows $4 \to 5$ bits because the final $c_4$ becomes the MSB. Synthesis will not build this: a real mapper emits `LUT6_2` plus a `CARRY4`/`CARRY8` primitive, and the `cells[...]` array index that models the LUT's address multiplexer becomes configuration data, not logic.

Verified by simulation: 5 named vectors (including the asymmetric $1 + 8$ and $8 + 1$, which a bit-reversed chain would fail), all 512 exhaustive $(x, y, c_{\text{in}})$ combinations, and 3000 random vectors against a behavioural `x + y + cin`.

- [[Basic Logic Element]] – extends: the generic LUT-plus-FF cell this is a vendor specialisation of.
- [[Fracturable LUT]] – depends-on: the Boole-expansion argument that lets one LUT6 act as two LUT5s.
- [[Fast Carry Chain]] – depends-on: the timing that makes the hardened MUX worth its silicon.
- [[Intel ALM]] – compares: the same three layers with a hardened full adder instead of a LUT-computed propagate.
- [[Choosing an FPGA Primitive]] – compares: when to spend a BLE at all rather than a DSP or a block RAM.
- [[Adders]] – supports: every BLE-count and delay figure for FPGA adders is denominated in this cell.
- [[Multipliers]] – supports: the Virtex-4 `&` gate exists only to feed partial-product arrays.
- [[Distributed Memory]] – extends: the same LUT SRAM rewired as a small writable RAM.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- Sect. 4.1.1, pp. 89–91 — minimal BLE, LUT4 realisation, Boole's expansion (eqs. 4.1–4.3), best $\alpha \in [4,6]$, the fast carry chain as a generic feature.
- Sect. 4.1.2, pp. 91–92 — AMD BLEs, slices and CLBs, Figs. 4.5a–c, the Virtex-4 AND gate, the LUT6 fracture, the second FF, Versal cascade routing.
- Sect. 4.1.4, p. 94 — the three-layer pattern common to all families.
- Sect. 5.4.1, pp. 126–128 — carry-chain equations 5.50–5.51, the MUX form, Versal `LOOKAHEAD8`.
