---
title: Fracturable LUT
description: "One LUT6 split into two LUT5s over shared inputs by Boole's expansion — twice the logic per cell, but only when both halves have the same support set."
kind: circuit
source: "ASA §4.1.1-4.1.2, pp. 90-92"
status: seed
spade: simulated
tags: [digital, fpgas, lut, shannon, ble]
aliases:
  - Fracturable LUT6
  - Fractured LUT
  - LUT6_2
  - Fracturable LUTs
---

# Fracturable LUT

A LUT6 whose internal Boole-expansion multiplexer is brought out as a second output, so one cell delivers either one arbitrary 6-input function or two arbitrary 5-input functions — provided both functions read the *same* five wires.

```tikz title="Fracturable LUT6: two LUT5 cofactors over shared inputs, one expansion MUX"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % shared input bus a..e (5 wires), and the sixth input f
  \draw[thick] (0.9,3.6) -- (4.4,3.6);
  \node[anchor=south] at (2.0,3.7) {$a\,b\,c\,d\,e$};
  \draw (2.75,3.45) -- (3.0,3.75) node[anchor=south west,inner sep=1pt] {\scriptsize 5};
  \draw (1.5,3.6) -- (1.5,2.6);
  \draw (3.5,3.6) -- (3.5,2.6);
  \draw (5.3,3.75) node[anchor=south] {$f$} -- (5.3,0.775) -- (3.5,0.775);
  \node[anchor=west] at (5.4,1.6) {\scriptsize sixth input};
  \node[anchor=west] at (5.4,1.2) {\scriptsize = MUX select};

  % the two LUT5 halves: the cofactors of Boole's expansion
  \draw (0.7,1.7) rectangle (2.3,2.6);
  \node[align=center] at (1.5,2.15) {LUT5\\[-2pt]{\scriptsize $g_{\overline f}$, 32 cells}};
  \draw (2.7,1.7) rectangle (4.3,2.6);
  \node[align=center] at (3.5,2.15) {LUT5\\[-2pt]{\scriptsize $g_{f}$, 32 cells}};

  % half outputs into the expansion MUX
  \draw (1.5,1.7) -- (1.5,1.05);
  \draw (3.5,1.7) -- (3.5,1.05);
  \draw[thick] (1.0,1.05) -- (4.0,1.05) -- (3.0,0.5) -- (2.0,0.5) -- cycle;
  \node[anchor=south east,inner sep=1pt] at (1.44,1.08) {\scriptsize 0};
  \node[anchor=south west,inner sep=1pt] at (3.56,1.08) {\scriptsize 1};

  % O6 out of the MUX, O5 tapped straight off the lower half
  \draw (2.5,0.5) -- (2.5,-0.2) node[anchor=north] {O6 \scriptsize (1 b)};
  \node[circ] at (1.5,1.4) {};
  \draw (1.5,1.4) -- (0.1,1.4) -- (0.1,-0.2) node[anchor=north] {O5 \scriptsize (1 b)};
\end{circuitikz}
\end{document}
```

*After Figs. 4.4 and 4.5b, pp. 91-92.*

**Read Boole's expansion backwards.** The cofactor identity that builds multiplexer trees in [[Combinational Logic]] decomposes any Boolean function on one chosen variable. Writing the sixth input as $f$ and the other five as $a\ldots e$, eq. 4.1 (p. 90) at $\alpha=6$ reads

$$g(a,\dots,e,f) \;=\; \overline{f}\wedge g_{\overline f}(a,\dots,e) \;\vee\; f\wedge g_{f}(a,\dots,e)$$

with the **cofactors** obtained by substitution, $g_{\overline f}=g(a,\dots,e,0)$ and $g_f=g(a,\dots,e,1)$ (eqs. 4.2-4.3). The right-hand side is literally a 2:1 multiplexer selecting between two functions of five variables, so **LUT$\alpha$ = two LUT$(\alpha-1)$ + one MUX** (Fig. 4.4, p. 91). Read forwards, that is how a LUT4 is *built* from LUT3s; read backwards, it is why a LUT6 can be *split*.

**The multiplexer is already inside the cell, so the split is free.** A LUT6 is a 64-bit SRAM addressed through a 64:1 multiplexer ([[Lookup-Tables]]), and that multiplexer is physically a tree whose last stage is exactly the expansion MUX above: under control of the top address bit $f$ it selects between the 32-cell half holding $g_{\overline f}$ and the 32-cell half holding $g_f$. Fracturing adds no SRAM cell and no logic level — it only routes the node *before* that last stage out to the fabric as a second port. AMD names the two ports `O6` (1 bit, the full six-input function) and `O5` (1 bit, the lower half's five-input function); the configuration word stays 64 bits and the address stays 6 bits either way. Nothing here is an FPGA-only idea, but it is an FPGA-only *bargain*: in an ASIC the same decomposition means physically instantiating two smaller ROMs and a mux, and you pay for all three.

**The price is a shared support set.** Both halves are addressed by the same five physical wires $a\ldots e$, because the cell's only other input is $f$ and $f$ has been spent on the select (Virtex 5 onward, p. 91). Two LUT5s in one cell are therefore *not* two independent LUT5s: the pair of functions must have a **combined support of at most five distinct variables**. Two arbitrary functions of the same five signals pack perfectly; two arbitrary 4-input functions with disjoint supports need eight wires and do not pack at all. The natural fit is a bit-slice emitting two outputs from one operand window — and the second flip-flop that arrived with the same generation (Fig. 4.5b) exists precisely so both outputs can be registered without leaving the BLE ([[Basic Logic Element]]).

**Fracturing further trades table depth for granularity.** Versal applies the same identity one level deeper and exposes four LUT4s per BLE, with outputs `O5_1`, `O6`, `O5_2` and a `cascin`/`cascout` path to the neighbouring BLE (Fig. 4.5c, p. 92). The extra granularity is not decoration: Versal's carry chain has no XOR gate left, so the sum $s_i=p_i\oplus c_i$ must be built from LUTs, and it is the four-way fracture that supplies $\overline{p_i}$, the sum multiplexer and the odd carry $c_{i+1}=x_iy_i\vee x_ic_i\vee y_ic_i$ inside a single cell (eqs. 5.52-5.56, p. 127). Intel fractures along a different axis: an ALM shares **eight** input lines across its two BLEs, so it holds two independent LUT4s, or an independent LUT3 *and* LUT5, or one LUT6 (p. 93) — more freedom than AMD's five shared wires, at the cost of a harder packing problem ([[Intel ALM]]).

**Past six inputs the cost doubles per input, fracture or not.** Apply the expansion $n-6$ times against a LUT6 leaf: you get $2^{\,n-6}$ residual six-input functions plus a MUX tree over the $n-6$ remaining select bits. A LUT6 makes a 4:1 MUX (4 data + 2 select), so the tree collapses four signals per cell and costs $\lceil(2^{\,n-6}-1)/3\rceil$ cells:

$$L(n) \;=\; 2^{\,n-6} + \left\lceil \frac{2^{\,n-6}-1}{3} \right\rceil \;\approx\; \frac{4}{3}\,2^{\,n-6}\ \text{LUT6 per output bit}$$

so $L(6)=1$, $L(8)=5$, $L(10)=21$, $L(16)=1365$. Fracturing acts only at the *bottom* of this recursion, where residual functions happen to need five inputs or fewer; it changes a constant factor and leaves the exponential untouched. That is why table-based methods ([[Table-Based Function Evaluation]]) spend all their effort shrinking the address rather than the table.

$$\boxed{\ \texttt{O6}=g(a,\dots,e,f),\quad \texttt{O5}=g_{\overline f}(a,\dots,e),\qquad \text{two LUT5s iff } \bigl|\,\mathrm{supp}(g_1)\cup\mathrm{supp}(g_2)\,\bigr|\le 5\ }$$

**When it breaks.**

- **Disjoint supports.** Two 3-input functions on six different signals fit a LUT6's input count but not a fractured pair — the halves cannot be addressed separately. The packer falls back to two whole LUT6s and the area estimate you did by input-counting doubles.
- **The sixth input is not spare.** Using `O6` as a six-input function commits $f$ to the data, not the select. You get one 6-input function *or* the fracture, never both.
- **Two consumers per cell, no more.** Only two FFs in the BLE (Fig. 4.5b); a third registered result forces a second BLE, so a fracture that saves a LUT can still cost a slice.
- **`O5` is not a free carry-chain input.** On series 4-7 and UltraScale the carry MUX takes $p_i=x_i\oplus y_i$ from the LUT and its data bit from a bypass wire, not from `O5` (Fig. 5.23, p. 126) — see [[Fast Carry Chain]]. Versal is the family where the fracture and the adder actually meet.
- **The array may already be spoken for.** The same SRAM backs [[Distributed Memory]] and the [[Shift Register LUT]]; a cell configured as RAM or SRL is not available to be fractured as logic.
- **Above roughly eight inputs it stops mattering.** $L(n)$ dominates, and a constant-factor gain at the leaves is invisible next to $2^{\,n-6}$.

**RTL (Spade).**

```spade
/// Fracturable LUT6: one 64-cell configuration word, two outputs.
fn lut6_2(init: uint<64>, x: uint<6>) -> (bool, bool) {
    let cell  = init.as_bits();                 // [bool; 64], index 0 = LSB
    let lo    = cell[0..32];                    // the g_f-bar half, the one that drives O5
    let addr5 = x.as_bits()[0..5].as_uint();    // uint<5>: the five shared inputs a..e
    (cell[x], lo[addr5])                        // (O6, O5)
}
```

`init` is the configuration word — the truth table, loaded at bitstream time, not a datapath signal — and `x` is the 6-bit address $(f,e,d,c,b,a)$ with $a$ in bit 0. `cell[x]` is the whole 64:1 multiplexer of the diagram; `lo[addr5]` is the 32:1 sub-tree feeding `O5`; and the fact that one `addr5` indexes both is the shared-support constraint made syntactic — there is no second address to give the second output. Everything is combinational, the flip-flops of Fig. 4.5b sitting outside this block. Synthesis will not build a 64:1 mux from it: on an FPGA the entire body *is* the configuration of one physical LUT6, and only on an ASIC does it lower to a real 64-word ROM plus decoder.

Compiled and simulated as `lut6_2` behind a `uint<2>` wrapper: 3012 vectors, comprising 11 named cases and a 3000-vector random sweep of `init` and `x` against the reference `o6 = init[x]`, `o5 = init[{1'b0,x[4:0]}]`. The named cases are deliberately asymmetric — a single set cell at address 1 versus address 33, and an AND5 in the low half against an OR5 in the high half — because a symmetric truth table passes even when the two halves are swapped, which is the one bug this block can plausibly have.

**Related Notes.**

- [[Lookup-Tables]] – depends-on: the $2^{\alpha}$-cell SRAM-plus-MUX whose last mux stage this note exposes.
- [[Basic Logic Element]] – supports: the cell it lives in, whose second FF is what makes the second output usable.
- [[Combinational Logic]] – depends-on: Boole's expansion and the cofactor identity in general form.
- [[Multiplexers]] – supports: the 2:1 select the fracture exposes is the top stage of the LUT's own mux tree.
- [[AMD BLE]] – extends: which AMD generation fractures how, and what the slice around it looks like.
- [[Intel ALM]] – compares: fracture by sharing eight input lines across two BLEs instead of five inside one.
- [[Fast Carry Chain]] – counter-example: the arithmetic path that does *not* consume `O5` on series 4-7.
- [[Choosing an FPGA Primitive]] – compares: when the packing constraint makes a DSP block or block RAM the cheaper home.
- [[Table-Based Function Evaluation]] – extends: where $L(n)$ becomes the binding cost and the address, not the table, is what gets shrunk.
- [[FPGAs]] – depends-on: the fabric this is one cell of.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §4.1.1 "Look-Up Tables and Flip-Flops", pp. 89-90 — Figs. 4.2, 4.3 and eqs. 4.1-4.3.
- §4.1.1, p. 91, Fig. 4.4 — LUT4 realized from two LUT3s by Boole's expansion theorem.
- §4.1.2 "Basic Logic Elements of AMD FPGAs", pp. 91-92, Figs. 4.5b and 4.5c — the fracturable LUT6 with shared inputs, and the Versal four-LUT4 BLE.
- §4.1.3 "Basic Logic Elements of Intel FPGAs", p. 93 — ALM configurations.
- §5.4.1 "Addition Support on AMD FPGAs", pp. 126-127, Fig. 5.23 and eqs. 5.50-5.56.
