---
title: "DSP-Block Constant Multiplier"
description: "Splits the coefficient as c_Low +/- 2^B c_High across a cascaded DSP pair; the free choice of B lets a filter share sub-constants and drop ten DSPs to seven."
kind: circuit
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, fpga, dsp, mcm]
aliases:
  - DSP-Based Constant Multiplier
  - DSP Constant Multiplier
  - Hybrid DSP Adder-Graph Constant Multiplier
---

# DSP-Block Constant Multiplier

A constant multiplier built from a cascaded pair of hard DSP blocks, distinguished from every other technique in this topic by the fact that the split point $B$ of the coefficient is a *free* parameter rather than a fixed bit boundary.

```tikz title="Constant multiplier on a cascaded DSP48E pair, with the free split exponent B"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]
  \tikzset{blk/.style={draw, minimum width=2.1cm, minimum height=1.0cm, align=center}}

  % --- input fan-out -------------------------------------------------
  \node[anchor=east] at (-0.15,3.2) {$x$};
  \draw[->] (-0.1,3.2) -- (0.95,3.2);
  \node[anchor=south] at (0.42,3.24) {24};
  \draw (0.95,4.4) -- (0.95,2.0);
  \node[circ] at (0.95,3.2) {};

  % --- high DSP ------------------------------------------------------
  \node[blk] (dh) at (2.6,4.4) {DSP $17\!\times\!24$};
  \draw[->] (0.95,4.4) -- (dh.west);
  \node[anchor=south] at (2.6,5.7) {$c_{\mathrm{High}}$};
  \draw[->] (2.6,5.6) -- (dh.north);
  \node[anchor=west] at (2.7,5.2) {17};

  % --- low DSP -------------------------------------------------------
  \node[blk] (dl) at (2.6,2.0) {DSP $17\!\times\!24$};
  \draw[->] (0.95,2.0) -- (dl.west);
  \node[anchor=north] at (2.6,0.7) {$c_{\mathrm{Low}}$};
  \draw[->] (2.6,0.8) -- (dl.south);
  \node[anchor=west] at (2.7,1.2) {17};

  % --- shifter -------------------------------------------------------
  \node[blk, minimum width=1.2cm] (sh) at (5.6,4.4) {$\ll B$};
  \draw[->] (dh.east) -- (sh.west);
  \node[anchor=south] at (4.6,4.46) {$\le41$};

  % --- post-adder ----------------------------------------------------
  \draw[fill=white] (7.9,3.2) circle (0.26);
  \node at (7.9,3.2) {$+$};
  \draw[->] (sh.east) -| (7.9,3.46);
  \node[anchor=south] at (7.0,4.46) {$\le48$};
  \draw[->] (dl.east) -| (7.9,2.94);
  \node[anchor=south] at (5.6,2.06) {$\le41$};
  \draw[->] (8.16,3.2) -- (9.3,3.2);
  \node[anchor=south] at (8.73,3.26) {48};
  \node[anchor=west] at (9.35,3.2) {$c\cdot x$};

  % --- annotation ----------------------------------------------------
  \node[anchor=west] at (-0.2,-0.2)
    {$c=c_{\mathrm{Low}}\pm2^{B}c_{\mathrm{High}},\qquad
       c_{\mathrm{Low}},c_{\mathrm{High}}<2^{17},\qquad
       B\ \text{free subject to}\ B+w_{c_{\mathrm{High}}}+w_x\le48$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.26b, p. 415*

**Start from the cascade a generic multiplier already needs.** The DSP48E of Xilinx Virtex 5/6/7 has an *asymmetric* multiplier: $17$ bits on one port, $24$ on the other. A $24\times24$ product therefore does not fit one block, and the standard construction splits one argument at bit $17$ — the widest slice the narrow port accepts — into $a_{23..17}$ ($7$ bits) and $a_{16..0}$ ($17$ bits). By distributivity of multiplication over addition,

$$a\cdot b = a_{16..0}\cdot b \;+\; 2^{17}\,a_{23..17}\cdot b ,$$

two $17\times24\to41$-bit products recombined by the DSP's built-in post-adder, with the $2^{17}$ realised as hard wiring on the cascade path (Fig. 12.26a, p. 415). Nothing here is a choice: $17$ is where the port width forces the cut.

**Freeze one argument and the split stops being forced.** When $b=c$ is a compile-time constant, the two operands of the split are no longer a *slice* of a runtime signal — they are two numbers the generator picks. The only thing the hardware demands is that the algebraic identity hold and that each part fit the narrow port, so the split becomes

$$c=c_{\mathrm{Low}}\pm2^{B}c_{\mathrm{High}}\tag{12.53, p.\,415}$$

with $B$ ranging freely instead of being pinned at $17$. The minus sign is available because the DSP's post-adder is an add/subtract ALU, which is exactly the same reason [[CSD Constant Multiplier]] gets its subtractions for free. Note the reversal of roles against Fig. 12.26a: the runtime argument $x$ ($w_x=24$ bits) now goes *unsplit* to the wide port of both blocks, and it is the constant that is cut.

**Count what the freedom actually costs and buys.** The constraints are only that both parts fit the narrow port, $c_{\mathrm{Low}},c_{\mathrm{High}}<2^{17}$, and that the shifted sum fits the $48$-bit accumulator, $B+w_{c_{\mathrm{High}}}+w_x\le48$. Within that box a single constant admits many decompositions. The book lists five for the $24$-bit constant $11508221$ (eqs. 12.54–12.58, p. 415):

$$11508221 = 104957+2^{17}\!\cdot\!87 = 39421+2^{16}\!\cdot\!175 = 6653+2^{15}\!\cdot\!351 = 39421+2^{15}\!\cdot\!350 = 72189+2^{15}\!\cdot\!349$$

Every one of these builds the *same* multiplier at the *same* cost — two DSPs, one post-add. The choice is therefore free in the strict sense: it changes nothing locally, so it can be spent entirely on a non-local objective.

**Spend the freedom on sharing sub-constants across taps.** In a filter you are not multiplying by one constant but by a vector of them — see [[Multiple Constant Multiplication]]. If two taps can be given splits with a *common* part, the DSP computing that part is instantiated once and its output fanned out, because a DSP result is just a wire like any adder-graph node. A hybrid (P)MCM search inside the RPAG algorithm does exactly this, folding the DSP products into the adder graph as ordinary nodes: a five-coefficient single-precision benchmark filter needing ten DSP blocks by the conventional per-coefficient realisation drops to **seven** once the splits are chosen jointly (Fig. 12.27, pp. 415–416). The saving is pure sharing — $94495$ appears once in the optimised graph and feeds two output coefficients.

**Or spend it on making one half cheap in LUTs.** The second use of the freedom is to steer one part towards a constant with very few nonzero digits, so that it can be dropped out of the DSP entirely and realised in fabric as a [[Binary Shift-and-Add Constant Multiplier]] or a [[CSD Constant Multiplier]]. That converts a two-DSP operator into a one-DSP-plus-one-adder operator, which is the trade you want in exactly the regime this whole technique targets: DSP *scarcity*. When DSPs are plentiful the constant multiplication is one instruction and there is nothing to optimise; the interesting problem only exists when the design has fewer DSP blocks than constant multiplications and must mix hard blocks with adder graphs.

> [!note]
> The reason this technique has no analogue in the rest of the topic is that it is the only one whose *local* cost function is flat. Every other constant-multiplication method has a single best realisation per constant; here an entire family costs the same, so the search can be pushed up a level to the whole coefficient set for free.

**The freedom is a vendor accident, not a law.** Recent Intel DSP blocks have inputs of *identical* size, so there is no narrow port, no forced split, and consequently no free $B$ — the technique above simply does not apply (p. 416). Those blocks instead carry a small coefficient memory holding up to eight constants, which reframes the DSP as a [[Reconfigurable Constant Coefficient Multiplier]] rather than a fixed one. On ASICs the question never arises: there is no hard multiplier to cascade and shift-and-add wins unconditionally, see [[Choosing a Constant Multiplier]].

$$\boxed{\ c = c_{\mathrm{Low}} \pm 2^{B} c_{\mathrm{High}},\qquad c_{\mathrm{Low}},c_{\mathrm{High}} < 2^{17},\qquad B+w_{c_{\mathrm{High}}}+w_x \le 48\ }$$

**When it breaks.**

- **DSPs are plentiful.** Then $c\cdot x$ is one block and one instruction; the split has nothing to optimise and the note is moot.
- **Symmetric-input DSPs.** Intel Stratix-class blocks pin $B$ by removing the asymmetry that created it.
- **$w_c > 34$.** Two $17$-bit parts cannot represent a constant wider than $2\cdot17$ bits, so no split exists and the operator needs a third block or a fabric assist.
- **Accumulator overflow.** $B+w_{c_{\mathrm{High}}}+w_x > 48$ silently wraps in the post-adder; the width constraint is not enforced by the tools, it is a proof obligation on the generator.
- **Latency, not area, is the budget.** Each DSP stage is registered to reach its rated $f_{\max}$, so the cascade costs at least two cycles. An unpipelined LUT-based [[KCM, Table-Based Constant Multiplication]] can be lower latency even at higher area.

> [!warning] Not covered in the source — needs outside research
> The book lists five splits of $11508221$ and says "$\vdots$", but never states how many splits exist in total, nor gives the enumeration procedure or the cost model by which RPAG scores one split against another. Both are deferred to the citation [KZ12].

> [!warning] Not covered in the source — needs outside research
> No LUT count, $f_{\max}$ or latency figure is given for the DSP path anywhere in §12.6.1 — the only quantitative result in the section is the DSP count dropping from ten to seven.

**RTL (Spade).**

```spade
/// c = CL + 2^B * CH, evaluated on two cascaded DSP blocks.
/// B is a const generic: every legal (CL, CH, B) is the same hardware.
entity dsp_split_mul<#uint CL, #uint CH, #uint B>(clk: clock, x: uint<24>) -> uint<48> {
    let xw: uint<48> = zext(x);
    reg(clk) p_low:  uint<48> = xw *. CL;          // DSP 1: c_Low  * x
    reg(clk) p_high: uint<48> = xw *. CH;          // DSP 2: c_High * x
    reg(clk) acc:    uint<48> = p_low +. (p_high << B);   // cascade post-adder
    acc
}

// c = 11508221, two of the five legal splits — same result, same cost
entity mul_c_a(clk: clock, x: uint<24>) -> uint<48> { inst dsp_split_mul::<104957, 87, 17>(clk, x) }
entity mul_c_b(clk: clock, x: uint<24>) -> uint<48> { inst dsp_split_mul::<39421, 175, 16>(clk, x) }
```

`p_low` and `p_high` are the two DSP boxes in the diagram, `<< B` is the cascade shift, and `acc` is the post-adder. Widths are carried at $48$ throughout with the truncating operators `*.` and `+.` rather than the widening `*` and `+`, because the DSP accumulator is a fixed $48$-bit resource and the constraint $B+w_{c_{\mathrm{High}}}+w_x\le48$ is what makes the truncation lossless — Spade will not check that for you. Each `reg(clk)` is a real DSP pipeline stage, giving a latency of two cycles. Synthesis departs from the drawing in one place: the `<< B` is a constant shift, so it costs no logic at all and disappears into the routing between the two blocks.

**Related Notes (with context).**

- [[DSP Blocks]] – depends-on: supplies the asymmetric $17\times24$ port pair and the cascade post-adder that the whole construction is built from.
- [[Multiple Constant Multiplication]] – extends: the freedom in $B$ is worthless for one constant and only pays off when splits are chosen jointly across a coefficient set.
- [[Multiplier Tiling]] – compares: the same "cover a large product with hard blocks" problem, but tiling a full $x\cdot y$ rather than exploiting a constant.
- [[Choosing a Constant Multiplier]] – compares: places this against every sibling; on ASIC it does not exist, on FPGA it wins only under DSP scarcity.
- [[Reconfigurable Constant Coefficient Multiplier]] – extends: what an Intel DSP with a coefficient memory becomes once the split freedom is gone.
- [[Binary Shift-and-Add Constant Multiplier]] – supports: the fabric realisation one half of the split is steered towards.
- [[CSD Constant Multiplier]] – supports: source of the $\pm$ in the split, and the cheapest fabric target for a steered half.
- [[Pipelined Adder Graph]] – extends: RPAG, the search that folds DSP products into the adder graph as ordinary nodes.
- [[FPGAs]] – depends-on: the technique is entirely a consequence of one vendor's hard-block port widths.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.6.1 "Constant Multiplication Using DSP Blocks on FPGAs", pp. 414–416 — eq. 12.53 and the split enumeration 12.54–12.58 (p. 415), Fig. 12.26 (p. 415), Fig. 12.27 and the ten-to-seven DSP result (p. 416).
- Same, §12.6.2 "Reconfigurable Constant Multiplication", p. 417 — the Intel coefficient-memory reframing.
- Cited there for the algorithms, not reproduced in the book: [Mer+18] on DSP argument zero-padding, [KZ12] on hybrid MCM inside RPAG, [Int18b] on the Intel coefficient memory.
