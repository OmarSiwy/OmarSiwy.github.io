---
title: "Master-Slave D Flip-Flop"
description: "Two opposite-phase latches that are never transparent at the same instant, buying the hard clock edge that collapses timing to two checkable inequalities — for 20-26 transistors and four clocked loads per bit."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §Master–slave edge-triggered D flip-flop, §Diagram, §FPGA mapping; Weste & Harris ch. 10; Rabaey ch. 7; Mano & Ciletti ch. 5"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, flip-flop, edge-triggered, register, clocking]
aliases:
  - "D Flip-Flop"
  - "Master-Slave D Flip-Flop"
  - "Master-Slave Flip-Flop"
  - "Master–Slave D Flip-Flop"
  - "Edge-Triggered D Flip-Flop"
  - "DFF"
  - "D Flop"
---

# Master-Slave D Flip-Flop

**One-line summary:** Two level-sensitive D latches in series on opposite clock phases, whose defining property is that they are never transparent at the same instant — so unlike the latch it is built from, there is no combinational path from $D$ to $Q$ at *any* time, and data advances exactly one stage per clock edge.

```tikz title="Master-slave D flip-flop: two mux-based latches on opposite clock phases, with the local inverter that generates the second phase"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ---- master latch: 2:1 mux, sel=clkbar, leg1=D, leg0=hold ----
  \draw[thick] (0,3.4) -- (0.95,3.0) -- (0.95,1.4) -- (0,1.0) -- cycle;
  \node[font=\scriptsize] at (0.24,3.0) {0};
  \node[font=\scriptsize] at (0.24,1.4) {1};
  \node[font=\scriptsize,anchor=south] at (0.475,3.45) {MASTER};

  % ---- slave latch: sel=clk, leg1=QM, leg0=hold ----
  \draw[thick] (5.0,3.4) -- (5.95,3.0) -- (5.95,1.4) -- (5.0,1.0) -- cycle;
  \node[font=\scriptsize] at (5.24,3.0) {0};
  \node[font=\scriptsize] at (5.24,1.4) {1};
  \node[font=\scriptsize,anchor=south] at (5.475,3.45) {SLAVE};

  % ---- datapath ----
  \draw[->] (-2.4,1.4) -- (0,1.4);
  \node[anchor=south] at (-1.2,1.45) {$D$~[1]};

  \draw[->] (0.95,2.2) -- (3.5,2.2) -- (3.5,1.4) -- (5.0,1.4);
  \node[anchor=south] at (2.2,2.25) {$Q_M$~[1]};

  \draw[->] (5.95,2.2) -- (8.4,2.2);
  \node[anchor=south] at (7.6,2.25) {$Q$~[1]};

  % ---- hold loops, routed over the top so nothing crosses the clock ----
  \fill (1.6,2.2) circle (0.055);
  \draw (1.6,2.2) -- (1.6,4.25) -- (-0.6,4.25) -- (-0.6,3.0) -- (0,3.0);
  \fill (6.6,2.2) circle (0.055);
  \draw (6.6,2.2) -- (6.6,4.25) -- (4.4,4.25) -- (4.4,3.0) -- (5.0,3.0);
  \node[font=\scriptsize,anchor=south] at (0.5,4.3) {hold};
  \node[font=\scriptsize,anchor=south] at (5.5,4.3) {hold};

  % ---- clock rail ----
  \draw (-2.4,-1.5) -- (5.475,-1.5);
  \node[anchor=east] at (-2.45,-1.5) {$clk$~[1]};
  \fill (0.475,-1.5) circle (0.055);

  % local inverter generating clkbar
  \draw (0.475,-1.5) -- (0.475,-1.05);
  \draw[thick] (0.2,-1.05) -- (0.75,-1.05) -- (0.475,-0.5) -- cycle;
  \draw (0.475,-0.39) circle (0.11);
  \draw[->] (0.475,-0.28) -- (0.475,1.2);
  \node[anchor=west] at (0.62,0.4) {$\overline{clk}$};

  \draw[->] (5.475,-1.5) -- (5.475,1.2);
  \node[anchor=west] at (5.62,0.4) {$clk$};

  % ---- phase annotations ----
  \node[font=\scriptsize,anchor=north,align=center] at (0.475,-1.8)
    {transparent when\\$clk=0$: samples $D$};
  \node[font=\scriptsize,anchor=north,align=center] at (5.475,-1.8)
    {transparent when\\$clk=1$: drives $Q$};
  \node[font=\scriptsize,anchor=north,align=center] at (3.0,-2.9)
    {inverter delay $t_{inv}$ leaves both briefly transparent
     $\Rightarrow$ race-through window $\Rightarrow$ $t_{hold}$};
\end{circuitikz}
\end{document}
```

*Own construction, drawn at mux level to expose the select polarities and the local inverter; the same structure is the "static flip-flop" of Weste \& Harris ch. 10 and Rabaey ch. 7. Both latches are the identical cell — only the select polarity differs, which is why one of them needs $\overline{clk}$ and why that inverter is the whole problem.*

**Topic:**

**Start from the latch's one defect, because it dictates the entire structure.** A [[Transparent D Latch]] is the 2:1 multiplexer $Q^{+} = clk\cdot D + \overline{clk}\cdot Q$, and while $clk=1$ it is a *wire*: $D$ reaches $Q$ through a plain combinational delay $t_{dq}$. That transparency is fatal for state machines. Close a loop `latch → logic → latch` and during the transparent phase the loop is a combinational cycle — it oscillates, or it settles to a fixed point of the logic, and neither is a state transition. What is needed is not a better latch but a *phase during which nothing is transparent*, and the cheapest way to manufacture one out of a component that is transparent half the time is to put two of them in series and drive their selects with complementary signals.

**The invariant is one line of Boolean algebra, and everything else is a consequence of it.** Let $\tau_M$ and $\tau_S$ be the predicates "master is transparent" and "slave is transparent". As drawn, $\tau_M = \overline{clk}$ and $\tau_S = clk$, so by the **complement law** $x\wedge\bar{x}=0$,

$$\tau_M \wedge \tau_S \;=\; \overline{clk}\wedge clk \;=\; 0$$

A combinational path from $D$ to $Q$ exists only when both latches are simultaneously transparent, i.e. only on $\tau_M\wedge\tau_S$, which is identically false. The flip-flop therefore has **no** $D\to Q$ path at any instant — not a short one, not a fast one, none. That is the entire product being sold, and it is worth noticing that it is bought by a Boolean identity rather than by any timing argument.

**Compose the two latch equations over a full period to recover $z^{-1}$.** Write both latches with the same characteristic equation, select negated on the master:

$$Q_M^{+} = \overline{clk}\cdot D + clk\cdot Q_M, \qquad Q^{+} = clk\cdot Q_M + \overline{clk}\cdot Q$$

On the low half ($clk=0$), **identity and annihilator of AND** collapse these to $Q_M = D$ and $Q^{+}=Q$: the master follows $D$, the slave holds. On the high half ($clk=1$) they collapse the other way, to $Q_M^{+}=Q_M$ and $Q = Q_M$: the master freezes, the slave copies it out. The only value the slave can ever see is the one the master held at the instant of the rising transition, so with $t^{n}_{\uparrow}$ the $n$-th rising edge,

$$Q^{n+1} = D\!\left(t^{n}_{\uparrow}\right)$$

which is exactly the unit delay $z^{-1}$ that every construction in [[Synchronous Sequential Logic]] assumes. All signals here are 1 bit: $D$, $Q_M$, $Q$, $clk$, $\overline{clk}$. An $n$-bit register is $n$ *independent* copies sharing one clock net — there is no interaction between bits, no carry, nothing to reassociate, so unlike every adder in this vault the cost is exactly linear in $n$ with a zero-width critical path.

**The price is two storage nodes, four clocked transistors, and a real $t_{cq}$.** In static CMOS the pair is typically 20–26 transistors against 8–12 for the single latch, with $4$ clocked transistors of load per bit against $2$. Clock load is the expensive part, not area: the clock is the only net in the design with switching activity $\alpha=1$ by definition, so doubling the clocked devices per bit doubles the largest single term in dynamic power. And the flop always pays a full clock-to-$Q$, $t_{cq}$, whereas a latch whose data arrives during its transparent phase pays only $t_{dq}$ and passes the leftover time forward. What is bought in exchange is that the timing problem stops being a loop-analysis problem: with a hard edge, correctness reduces to the two independent inequalities of [[Setup and Hold Constraints]], checkable in $O(\text{paths})$ by a tool that never has to solve a fixed-point equation. That is the only reason every mainstream synthesis and static-timing flow is built around flops.

**The overlap invariant is not free, and its failure is the physical origin of $t_{hold}$.** The algebra above assumed $\overline{clk}$ is the exact complement of $clk$. It is not: the drawing generates it with a local inverter of delay $t_{inv}$, so for a window of roughly $t_{inv}$ after each edge both phases are momentarily asserted and $\tau_M\wedge\tau_S = 1$. During that window the flop *is* a transparent latch, and a fast enough change on $D$ can walk straight through both stages and corrupt the value the slave was supposed to hold. This is **internal race-through**, and it is not a marginal effect — it is a functional failure with no frequency dependence. $t_{hold}$ is precisely the cell designer's characterised promise about when that window has closed; a library with a large internal clock-path delay to the second stage can legitimately report a *negative* $t_{hold}$, meaning data may change slightly before the nominal edge and still be safe. The circuit-level repairs are to shrink $t_{inv}$ (large inverter, both phases routed locally), to make the master's cut-off lead the slave's opening deliberately, or in the transmission-gate flop to distribute both $clk$ and $\overline{clk}$ so no local inversion is needed at all.

**The hard edge also throws away every picosecond of slack a fast stage did not use.** Because $\tau_M\wedge\tau_S=0$ holds *always*, data physically cannot leave a stage early, and stage $k$ finishing $200$ ps ahead of schedule cannot lend that time to stage $k+1$. $T_{clk}$ is set by the single worst stage, and in a pipeline that cannot be balanced by construction — a multiplier array feeding a trivial mux — that is a large amount of purchased silicon sitting idle. Making the boundary soft, so slack flows forward, means giving the transparency back and accepting the hold exposure that comes with it; that is the whole subject of [[Dual-Phase Latches]].

**On an FPGA every one of these trade-offs inverts.** Every LUT output in a slice has a dedicated flip-flop wired next to it, so a flop costs nothing you were not already paying for — an *unused* one is the waste. A latch, by contrast, has no primitive at all and must be built from a LUT with its output fed back, which burns a [[Lookup-Tables|LUT]] *and* creates a combinational cycle that static timing analysis cannot traverse; vendor tools warn on inferred latches for exactly this reason, and the usual cause is an incomplete `if` or `case`, not intent. Hold violations, the ASIC designer's nightmare, are essentially impossible on the FPGA datapath: the intra-slice flop-to-flop delay is fixed and characterised, the global clock tree's skew is small and known, and the router cannot produce a path shorter than $t_{hold}$. Hold returns only at I/O boundaries and clock-domain crossings. Finally, every slice flop has a dedicated `CE` pin, so the enable mux of a [[Clock Enable Flip-Flop]] is free, while a gated clock must consume one of a few dozen global buffer resources — the opposite of the ASIC ranking, where an [[Integrated Clock-Gating Cell]] is the single largest dynamic-power lever available.

> [!important] "Never transparent at the same time" is a structural claim, and the inverter quietly violates it
> The Boolean identity $\overline{clk}\wedge clk=0$ is exact only for an ideal complement. Every real implementation approximates it, the approximation error is a window of width $\approx t_{inv}$, and the entire concept of hold time exists to bound what may happen inside that window. Read $t_{hold}$ as "the size of the lie in the invariant", and the asymmetry between setup and hold stops being arbitrary.

**Result.**

$$\boxed{\ \tau_M\wedge\tau_S=\overline{clk}\wedge clk=0 \;\;\Longrightarrow\;\; Q^{n+1}=D\!\left(t^{n}_{\uparrow}\right)\ \ \text{(1 bit, } t_{cq}\text{ after the edge)}\ }$$

**When it breaks.**

- **$D$ moves inside the aperture $[-t_{setup},\,+t_{hold}]$:** the master is cut off mid-regeneration and parks near the unstable point of the [[Cross-Coupled Inverter Bistable]]. Resolution time is exponentially distributed with no upper bound, so the output may be neither $0$ nor $1$ for arbitrarily long. Any asynchronous source needs a [[Synchronizer Chain]].
- **$t_{inv}$ too large, or clock slew too slow:** the race-through window widens until fast data crosses both stages on one edge. This is why libraries impose a maximum clock transition time — a slow edge stretches the overlap even when $t_{inv}$ is small.
- **Skew large enough to eat the hold margin:** the hold inequality contains no $T_{clk}$, so a hold failure is functional at every frequency and at DC. See [[Clock Skew and Jitter]] and [[Setup and Hold Constraints]].
- **A glitch on a gated clock:** a bare `clk & en` can emit a spurious edge, and a spurious edge is indistinguishable from a real one to this circuit. Gate only with an [[Integrated Clock-Gating Cell]].
- **Clock power dominates:** at $4$ clocked transistors per bit the flop is the wrong element for very wide, rarely-changing state. Enable rather than re-clock, or move to the single-storage-node schemes of [[Dual-Phase Latches]].
- **Unbalanceable pipelines:** the hard edge cannot pass slack. Below a few stages the cost is noise; in a deep, badly balanced pipeline it is the dominant loss.

**RTL (Spade).**

The flip-flop is not something you build in Spade — it *is* the primitive. `reg(clk)` lowers to precisely this cell, so the entire note reduces to one line of body:

```spade
entity dff<#uint W>(clk: clock, rst: bool, d: uint<W>) -> uint<W> {
    reg(clk) q reset(rst: 0) = d;
    q
}
```

`d` is the drawing's $D$, `q` is $Q$, and $Q_M$ has no name because it has no existence at the language level — the two-latch decomposition is an *implementation* of the contract $Q^{n+1}=D(t^n_\uparrow)$, not the contract itself. `W` is the register width and costs exactly `W` independent copies of the drawing sharing one `clk`; the body is the only sequential element, everything else is wire. `reset(rst: 0)` is synchronous, so it is a mux on the $D$ leg rather than a separate reset transistor path — the asynchronous variant is a library-cell property that Spade does not expose. Synthesis will not build what is drawn above: it picks a characterised flop cell, which may be a transmission-gate master-slave, a differential sense-amp flop, or on an FPGA the fixed slice register, and the emitted Verilog is a plain `always @(posedge clk)` in which no latch appears at all.

Note what is *not* expressible: the master-slave decomposition itself. Spade has no latch primitive and `let` cannot self-reference, so the individual latch cannot be written (see [[Transparent D Latch]]) even though the flop built from two of them is a one-liner. The language exposes the abstraction, not the construction.

Simulated against a behavioural reference through `.zettel/sim.sh` with an 8-bit concrete wrapper: 11 named vectors including the asymmetric pair `0x01` then `0x80` (which is what catches a reversed bit order), plus 3000 random $(d, rst)$ pairs, 3011 total, zero mismatches. The testbench was mutation-checked by reversing the bit order in the register, which fails 2651 of them.

**Related Notes (with context):**

- [[Transparent D Latch]] – depends-on: the component this is two of, and the source of both the transparency that had to be eliminated and the mux equation that was composed twice above.
- [[Setup and Hold Constraints]] – extends: the two inequalities that the hard edge makes checkable, and the formal home of the $t_{hold}$ this circuit's race-through window defines.
- [[Synchronous Sequential Logic]] – supports: every FSM and pipeline construction assumes exactly the $z^{-1}$ established here.
- [[Dual-Phase Latches]] – counter-example: gives the hard edge back in exchange for slack passing between unbalanced stages, inverting nearly every trade-off in this note.
- [[Synchronizer Chain]] – extends: $N$ of these in series, nothing combinational between them, is the only defence when $D$ is asynchronous and the aperture will eventually be violated.
- [[Cross-Coupled Inverter Bistable]] – depends-on: supplies the two stable states each latch holds and the unstable point that a setup violation parks the master on.
- [[Clock Skew and Jitter]] – depends-on: the skew term that appears in both timing inequalities and the reason the hold one is the dangerous half.
- [[Clock Enable Flip-Flop]] – extends: a mux on the $D$ leg turning this into a conditionally-updating register at zero cost on an FPGA.
- [[Integrated Clock-Gating Cell]] – supports: the only safe way to stop this circuit's clock, because a bare AND can synthesise an edge that is indistinguishable from a real one.
- [[T Flip-Flop]] – extends: an XOR in front of the $D$ pin, which is how every bit of a binary counter is actually built.
- [[JK Flip-Flop]] – compares: the historical four-way alternative, which reduces to this circuit plus combinational logic and therefore costs strictly more in any modern library.
- [[Lookup-Tables]] – compares: the FPGA fabric in which this element is free and its own component, the latch, is expensive.
- [[Choosing a Storage Element]] – compares: where this sits against the latch and the pulsed latch across area, clock power, and hold margin.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Master–slave edge-triggered D flip-flop* — the never-simultaneously-transparent invariant, the transistor and clocked-load counts, and internal race-through as the origin of $t_{hold}$; §*Diagram* — the block-level two-phase structure redrawn here at mux level; §*FPGA mapping* — the four inverted trade-offs.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequential circuit design) — static and transmission-gate master-slave structures, race-through and clock-overlap analysis, setup/hold characterisation.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, ch. 7 — the two-phase master-slave register, its clock-load cost, and the comparison against pulsed and dynamic alternatives.
- Mano & Ciletti, *Digital Design*, ch. 5 — characteristic equation of the D flip-flop and the master-slave construction at gate level.

> [!warning] Transistor and clocked-load counts are canonical, not characterised
> This note has no book source. $20$–$26$ transistors and $4$ clocked devices per bit are the figures every textbook quotes for a static-CMOS master-slave flop; real values are PDK-dependent and vary by roughly $2\times$ across cell families. Use them for ratios, never for a power or area budget.

> [!warning] Textbook citations are chapter-level
> No page numbers are given for Weste & Harris, Rabaey, or Mano & Ciletti because no copy was consulted for this note. The material is standard and the chapter numbering is stable across editions, but the pages are not verified.
