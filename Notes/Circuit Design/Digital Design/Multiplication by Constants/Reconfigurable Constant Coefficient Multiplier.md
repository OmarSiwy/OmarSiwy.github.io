---
title: Reconfigurable Constant Coefficient Multiplier
description: "Fuses the adder graphs of a small coefficient set into one graph with MUXes on the adder inputs — C in {45,19} for two adders and two MUXes."
kind: circuit
source: "ASA §12.6.2, pp. 416-417"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, reconfigurable, mux, fpga, adder-graph]
aliases:
  - RCCM
  - Reconfigurable Constant Multiplier
  - Reconfigurable Constant Multiplication
  - Time-Multiplexed Constant Multiplier
---

# Reconfigurable Constant Coefficient Multiplier

A shift-and-add constant multiplier whose coefficient is chosen at run time from a small fixed set, by fusing the adder graphs of every constant in that set into one graph and putting the choice on the *adder inputs* rather than on the output.

```tikz title="RCCM for C in {45,19}: two adders, two MUXes, with every bus width labelled"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% input fan-out bus
\node (x) at (0,0.75) {$X$};
\draw[->] (0,0.55) -- node[right,font=\tiny]{8} (0,0.05);
\draw (-2.6,0) -- (2.6,0);
\fill (-2.6,0) circle (1.2pt); \fill (-0.55,0) circle (1.2pt);
\fill (0.55,0) circle (1.2pt);  \fill (2.6,0) circle (1.2pt);
% --- stage 1 : MUX ---
\draw (-1.15,-1.30) -- (1.15,-1.30) -- (0.55,-1.78) -- (-0.55,-1.78) -- cycle;
\node[font=\tiny] at (0,-1.54) {MUX};
\draw[->] (-0.55,0) -- node[left,font=\tiny]{$\ll 2$} node[right,font=\tiny]{10} (-0.55,-1.30);
\draw[->] ( 0.55,0) -- node[left,font=\tiny]{9} node[right,font=\tiny]{$\ll 1$} ( 0.55,-1.30);
\draw[dashed,->] (-1.70,-1.54) -- node[above,font=\tiny]{$s$} (-0.90,-1.54);
% --- stage 1 : adder ---
\draw[->] (0,-1.78) -- node[right,font=\tiny]{10} (0,-2.28);
\draw (0,-2.5) circle (0.22); \node[font=\small] at (0,-2.5) {$+$};
\draw[->] (-2.6,0) -- node[left,font=\tiny]{$\ll 0$} node[right,font=\tiny]{8} (-2.6,-2.5) -- (-0.22,-2.5);
% s1 bus
\draw (0,-2.72) -- (0,-3.15);
\node[anchor=west,font=\tiny] at (0.14,-2.93) {$\{5X,\,3X\}$};
\draw (-1.90,-3.15) -- (-0.55,-3.15);
\fill (-0.55,-3.15) circle (1.2pt);
% --- stage 2 : MUX ---
\draw (-1.15,-3.90) -- (1.15,-3.90) -- (0.55,-4.38) -- (-0.55,-4.38) -- cycle;
\node[font=\tiny] at (0,-4.14) {MUX};
\draw[->] (-0.55,-3.15) -- node[left,font=\tiny]{$\ll 3$} node[right,font=\tiny]{14} (-0.55,-3.90);
\draw[->] (2.6,0) -- node[right,font=\tiny]{$\ll 4$} (2.6,-3.60)
  -- node[below,font=\tiny]{12} (0.55,-3.60) -- (0.55,-3.90);
\draw[dashed,->] (-1.70,-4.14) -- node[above,font=\tiny]{$s$} (-0.90,-4.14);
% --- stage 2 : adder ---
\draw[->] (0,-4.38) -- node[right,font=\tiny]{14} (0,-4.93);
\draw (0,-5.15) circle (0.22); \node[font=\small] at (0,-5.15) {$+$};
\draw[->] (-1.90,-3.15) -- node[left,font=\tiny]{11} (-1.90,-5.15) -- (-0.22,-5.15);
\draw[->] (0,-5.37) -- node[right,font=\tiny]{14} (0,-5.90)
  node[below,font=\small] {$\{45X,\,19X\}$};
\node[font=\tiny,align=center] at (0,-6.65)
  {$s=0:\;(2^2{+}1)(2^3{+}1)X=45X$\qquad $s=1:\;(2^1{+}1)X+2^4X=19X$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.28, p. 417; widths added for $w_X=8$*

**The specification is not one constant but a small alphabet of them.** $C$ is drawn from $\{C_0,\dots,C_N\}$ and an index of $\lceil\log_2 N\rceil$ control bits says which (p. 416). This is the shape of every time-multiplexed filter — one physical multiplier walking a tap set, one coefficient per cycle — and of a CNN layer whose weights change between layers but not within one. The book calls the resulting operator a **reconfigurable constant coefficient multiplier** (RCCM), or equivalently a *time-multiplexed* constant multiplier.

**The two obvious operators bracket the design, and both are bad.** Build $N+1$ independent constant multipliers by any method of [[Binary Shift-and-Add Constant Multiplier]] and select their outputs with one $w_R$-bit MUX: correct, but $N$ of the $N+1$ graphs compute dead values every cycle, and the area is the *sum* of the graphs. Or build a general [[Multipliers|multiplier]] and hold $C$ in a register: area independent of $N$, but a full $w_X\times w_C$ multiplier is far more expensive than any single constant graph, which is the entire reason this chapter exists. The RCCM is the interpolation — one graph, sized closer to a single constant than to the sum.

**Move the MUX from the output to the adder inputs, and the sharing becomes structural.** An adder node in a shift-and-add graph computes $P + 2^s Q$, and it is parameterised by two things: *which* earlier nodes $P$ and $Q$ are, and *how far* the shift $s$ is. Neither is logic — the choice of source is wiring and the shift is wiring. Making both selectable at run time therefore costs exactly one MUX per adder input that actually varies, and nothing else. Where the output-MUX construction replicates the adders and selects once, the RCCM keeps one copy of the adders and selects on every edge that differs between constants.

**Read the figure as two edge choices, not two shift choices.** For $s=0$ the first MUX takes $\ll2$, so the first adder computes $X+2^2X=5X$, and the second MUX takes $2^3$ times that node, so the output is $5X+2^3\cdot5X=(2^2+1)(2^3+1)X=45X$. For $s=1$ the first MUX takes $\ll1$, giving $X+2^1X=3X$, and the second MUX switches **source**, reading $2^4X$ off the input bus instead of the stage-1 node, so the output is $3X+2^4X=(2^1+1)X+2^4X=19X$. That second MUX is the whole idea in one component: the two constants do not merely want different shifts on the same DAG, they want different *edges*, and a MUX on an adder input reconfigures the edge as cheaply as it reconfigures the weight.

**Count what was actually bought.** Taken separately, both constants are two-adder constants and no fewer: $\mathrm{nz}(45)=\mathrm{nz}(101101_2)=4$ and $\mathrm{nz}(19)=\mathrm{nz}(10011_2)=3$, so the lower bound $N_{\mathrm A}\ge\lceil\log_2\mathrm{nz}(C)\rceil$ of [[Minimum-Adder Constant Multiplier]] gives $2$ for each, and $45=(2^2+1)(2^3+1)$, $19=(2^1+1)+2^4$ realise it. The separate-multiplier operator is therefore **four adders plus one $14$-bit output MUX**; the fused operator is **two adders plus a $10$-bit and a $14$-bit MUX**. Half the adders, in exchange for $24$ MUX bits where there were $14$.

$$\boxed{\ C\in\{45,19\}:\quad 2\ \text{adders}+2\ \text{MUXes}\quad\text{against}\quad 4\ \text{adders}+1\ \text{MUX}\ }$$

**Whether that trade pays is a fabric question, and the FPGA answer is the harsh one.** On an FPGA a bit of adder is one LUT driving the hard carry chain, and a bit of $2$:$1$ MUX is also one LUT — see [[Lookup-Tables]] — so swapping one adder for one MUX of equal width buys nothing at all, and the fusion only wins when it deletes *more* adder bits than it adds MUX bits. On an ASIC a $2$:$1$ MUX cell is a small fraction of a full-adder cell, so the same fusion pays much earlier. Delay moves the other way on both fabrics: each MUX inserts a logic level in front of its adder, so the critical path becomes $N_{\mathrm A}$ adder delays *plus* $N_{\mathrm A}$ MUX delays, and if the operator is pipelined that extra level has to be absorbed into the stages — see [[Pipelined Adder Graph]].

**Widths are set by the worst constant in the set, and that is a real cost.** Every node must be wide enough for whichever constant drives it hardest. The stage-1 node holds $5X$ or $3X$, so it is $\lceil\log_2 5\rceil+w_X=11$ bits even on the cycles when it only carries $3X$; the stage-2 MUX must present $2^3\cdot5X$ ($14$ bits) and $2^4X$ ($12$ bits) on one bus, so it is $14$ bits wide with the narrower input zero-padded. A set containing one large coefficient and many small ones makes every small coefficient pay the large one's width — which is why the composition of the coefficient set, not merely its size, decides whether an RCCM is worth building.

**The shift placement is itself an optimisation variable.** Because a shift is free wiring, the same fused graph admits many assignments of shifts to edges that produce the same set of constants — pushing a factor of $2$ off one edge and onto the edges downstream of it, say. They are all functionally identical and none of them are cost-identical, because moving a shift moves the bit positions of every node below it and therefore the width of every adder and MUX below it. The book points at Möller et al., *Optimal Shift Reassignment in Reconfigurable Constant Multiplication Circuits* (2018) for exactly this sub-problem (p. 417).

> [!warning] The fusion algorithms themselves are out of scope in the source
> The book states that fusing several adder graphs into one reconfigurable graph has been solved for ASICs (Turner et al. 2001; Tummeltshammer et al. 2007; Möller et al. 2018) and for FPGAs (Möller et al. 2017; Möller 2017), that the same algorithms handle a coefficient *vector* ([[Multiple Constant Multiplication]]) or *matrix* ([[Constant Matrix Multiplier]]) per index, and then explicitly declines to give them (p. 417). It also gives no crossover point — no rule for the $N$ at which an RCCM stops beating a general multiplier. Both need outside research.

**If the coefficient changes slowly, do not build MUXes at all.** The FPGA-only alternative is to leave a fixed [[KCM, Table-Based Constant Multiplication|KCM]] in place and rewrite its LUT *contents* through the fabric's reconfiguration port. The run-time logic cost is then zero — the operator is exactly as cheap as a fixed KCM, no MUXes, no widened nodes — but the switch takes on the order of $32$ clock cycles on recent Xilinx parts (p. 417). That rules out cycle-by-cycle time multiplexing and is entirely fine for CNN weights that change per layer or per frame, which is the use case Hardieck et al. (2019) target; see [[Quantization]] for what those weights look like by the time they arrive. Recent Intel [[DSP Blocks]] make the same move in hard silicon: they carry a small coefficient memory holding up to eight constants (p. 416), so the DSP block *is* an RCCM at zero fabric cost — at the price of losing the split freedom of eq. 12.53 that [[DSP-Block Constant Multiplier]] exploits.

**Where it breaks.**

- **The set grows.** MUX cost is linear in $N$ (an $N$:$1$ MUX per reconfigured input) while the sharing available between graphs saturates; past some $N$ the fused graph costs more than a general multiplier with a coefficient register, and the book gives no bound on where.
- **The coefficients have nothing in common.** Fusion only pays when the graphs overlap. A set of unrelated constants degenerates towards $N$ disjoint graphs sharing an input bus — that is, back to the output-MUX construction, plus the widened nodes.
- **Adder count is still not area.** The §12.1.6 warning applies with an extra term: a fusion that reduces $N_{\mathrm A}$ can increase the *width* of the surviving adders, and on FPGA the MUX bits cost the same as the adder bits they replaced.
- **Switching rate decides the whole architecture.** If the coefficient must change every cycle, LUT reconfiguration is unavailable and the MUXes are mandatory; if it changes once a frame, the MUXes are pure waste.
- **Negative coefficients.** The figure has only adders. A set spanning both signs needs the add/subtract mode selected as well — one more select bit into the carry-in and the operand inverters. Cheap, but it is another thing the fused graph carries and it is not drawn.
- **Truncated variants.** If the RCCM is faithful rather than exact, the error bound must hold for the *worst* constant in the set, so the guard bits are sized by the whole alphabet — see [[Error Accuracy]] and [[Faithful Shift-and-Add Real Constant Multiplier]].

**The figure in RTL.** One entity, two MUXes, two adders, `sel` selecting the whole coefficient:

```spade
// RCCM for C in {45,19}, Fig. 12.28.  sel=false -> 45X, sel=true -> 19X.
entity rccm45_19(x: uint<8>, sel: bool) -> uint<14> {
    let xw: uint<14> = zext(x);
    let m1: uint<14> = if sel { xw << 1 } else { xw << 2 };   // MUX 1
    let s1: uint<14> = xw +. m1;                              // {5X, 3X}
    let m2: uint<14> = if sel { xw << 4 } else { s1 << 3 };   // MUX 2
    s1 +. m2                                                  // {45X, 19X}
}
```

`m1` and `m2` are the two trapezoids, `s1` the upper adder circle, the tail expression the lower one; `sel = false` is the left input of both MUXes. `m2` is where the two constants take *different sources* — `xw` versus `s1` — which is the structural reconfiguration the drawing shows and a shift-only MUX could not express. Everything is carried at $14$ bits because both arms of an `if` must share a type; that is a carrier, not a wire count, and synthesis prunes `m1` to $10$ bits and `s1` to $11$, recovering exactly the widths annotated on the diagram. The adds are the wrapping `+.` because $14$ bits provably suffice ($45\cdot255=11475<2^{14}$) and plain `+` would widen each node for a carry that cannot occur. The operator is purely combinational — a constant multiplier has no state; in a time-multiplexed filter `sel` is the registered tap index, and that register is the only sequential element in sight.

**Related notes.**

- [[Multiple Constant Multiplication]] – compares: MCM shares one input across constants simultaneously in space, an RCCM shares one datapath across them successively in time; the same fusion algorithms serve both.
- [[Binary Shift-and-Add Constant Multiplier]] – depends-on: the adder graph the MUXes are inserted into.
- [[Minimum-Adder Constant Multiplier]] – supports: gives the per-constant adder counts the fused graph has to beat, and the lower bound used above.
- [[Multiplexers]] – depends-on: the select element whose per-bit cost decides whether the fusion pays.
- [[Lookup-Tables]] – depends-on: on FPGA a MUX bit and an adder bit are both one LUT, which is what makes the trade so tight.
- [[KCM, Table-Based Constant Multiplication]] – counter-example: reconfigure the table contents instead of the graph, and the run-time MUX cost vanishes at the price of a $32$-cycle switch.
- [[DSP Blocks]] – extends: Intel blocks hold up to eight coefficients in hard silicon, an RCCM for free.
- [[DSP-Block Constant Multiplier]] – compares: the split freedom of eq. 12.53, which a coefficient-memory DSP gives up.
- [[Constant Matrix Multiplier]] – extends: the reconfigured index can select a whole matrix of constants, not a scalar.
- [[Pipelined Adder Graph]] – supports: where the extra MUX level in the critical path has to be absorbed.
- [[Quantization]] – supports: the setting that produces per-layer weight sets small enough to fuse.
- [[Choosing a Constant Multiplier]] – compares: where a reconfigurable operator sits against the fixed-coefficient techniques.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 12, "Multiplication by Constants".

- §12.6.1, DSP coefficient memory holding up to eight constants, eq. 12.53 and Fig. 12.27, pp. 415–416
- §12.6.2 Reconfigurable Constant Multiplication, Fig. 12.28 ($C\in\{45,19\}$ in two adders and two MUXes), LUT reconfiguration at about $32$ cycles, pp. 416–417
- §12.1 lower bound $N_{\mathrm A}\ge\lceil\log_2\mathrm{nz}(C)\rceil$ and the bit-level cost model, pp. 373, 380–382
