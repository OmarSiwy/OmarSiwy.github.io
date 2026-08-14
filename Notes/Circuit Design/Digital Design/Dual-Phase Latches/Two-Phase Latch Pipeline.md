---
title: "Two-Phase Latch Pipeline"
description: "Alternating phi1/phi2 transparent-latch banks on a half-period grid with logic between them; removes the per-stage max from the cycle-time constraint at the cost of dual CTS, tool friction and a lost cycle boundary."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, dual-phase-latches]
aliases:
  - "Two-Phase Latch Pipelining"
  - "Two-Phase Non-Overlapping Clocking"
  - "Latch-Based Pipeline"
---

# Two-Phase Latch Pipeline

A pipeline whose sequencing elements are transparent latches alternating between two non-overlapping clock phases on a half-period grid, so the cycle-time constraint binds on a *running average* of stage delays rather than on the single worst stage.

```tikz title="Two-phase latch pipeline: logic between alternating phi1/phi2 latch banks, the non-overlapping clocks, and the max in the arrival recurrence"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  % ---- datapath: logic between alternating latch banks ----
  \draw[->] (-1.0,0) -- (0,0);            \node at (-0.5,0.28) {$n$};
  \draw (0,-0.5) rectangle (1.6,0.5);     \node at (0.8,0) {logic $d_i$};
  \draw[->] (1.6,0) -- (2.4,0);           \node at (2.0,0.28) {$n$};
  \draw[fill=black!8] (2.4,-0.5) rectangle (3.4,0.5);
  \node at (2.9,0.16) {L1};               \node at (2.9,-0.2) {$\phi_1$};
  \draw[->] (3.4,0) -- (4.2,0);           \node at (3.8,0.28) {$n$};
  \draw (4.2,-0.5) rectangle (5.8,0.5);   \node at (5.0,0) {logic $d_{i+1}$};
  \draw[->] (5.8,0) -- (6.6,0);           \node at (6.2,0.28) {$n$};
  \draw[fill=black!8] (6.6,-0.5) rectangle (7.6,0.5);
  \node at (7.1,0.16) {L2};               \node at (7.1,-0.2) {$\phi_2$};
  \draw[->] (7.6,0) -- (8.6,0);           \node at (8.1,0.28) {$n$};
  \draw (8.6,-0.5) rectangle (10.0,0.5);  \node at (9.3,0) {logic $d_{i+2}$};
  \draw[->] (2.9,-1.15) -- (2.9,-0.5);    \node[anchor=east] at (2.8,-0.92) {$\phi_1$};
  \draw[->] (7.1,-1.15) -- (7.1,-0.5);    \node[anchor=east] at (7.0,-0.92) {$\phi_2$};
  \node[font=\scriptsize,anchor=north] at (5.0,-1.25)
    {half-period grid: $t_i=(i-1)T/2$, and no latch-to-latch edge joins two banks of the same phase};

  % ---- clocks ----
  \draw[gray!55,dashed] (0,-2.05) -- (0,-6.75);
  \draw[gray!55,dashed] (4,-2.05) -- (4,-6.75);
  \draw[gray!55,dashed] (8,-2.05) -- (8,-4.9);
  \node[anchor=east] at (-0.15,-2.5) {$\phi_1$};
  \draw[thick] (0,-2.2)--(1.8,-2.2)--(1.8,-2.8)--(4,-2.8)--(4,-2.2)
              --(5.8,-2.2)--(5.8,-2.8)--(8,-2.8)--(8,-2.2)--(9.6,-2.2);
  \node[anchor=east] at (-0.15,-3.7) {$\phi_2$};
  \draw[thick] (0,-4.0)--(2,-4.0)--(2,-3.4)--(3.8,-3.4)--(3.8,-4.0)--(6,-4.0)
              --(6,-3.4)--(7.8,-3.4)--(7.8,-4.0)--(9.6,-4.0);
  \draw[<->] (0.05,-2.38) -- (1.75,-2.38);
  \node[anchor=north,font=\scriptsize] at (0.9,-2.40) {$W$};
  \draw[<->] (0,-3.05) -- (1.4,-3.05);
  \node[anchor=west,font=\scriptsize] at (1.5,-3.05) {$B$};
  \draw[<->] (1.8,-4.28) -- (2.0,-4.28);
  \draw (1.9,-4.28) -- (2.4,-4.62);
  \node[anchor=west,font=\scriptsize] at (2.45,-4.62) {$t_{\mathrm{nov}}$};
  \draw[<->] (0,-4.9) -- (4,-4.9);
  \node[anchor=north,font=\scriptsize] at (2.0,-4.92) {$T$};

  % ---- the max in the arrival recurrence ----
  \node[anchor=east,font=\scriptsize,align=right] at (-0.15,-6.35) {arrivals at\\the D pin of\\the L1 bank};
  \draw[->,thick,gray!75] (2.6,-5.72) -- (4.0,-5.72);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (3.3,-5.70) {early};
  \draw[thick] (4.0,-5.89) -- (4.0,-5.55);
  \node[font=\scriptsize,anchor=west] at (4.12,-5.72)
    {$A_i<t_i$: waits for the opening edge, borrows nothing};
  \draw[->,thick,red!75] (2.6,-6.37) -- (5.0,-6.37);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (3.3,-6.35) {late};
  \node[font=\scriptsize,anchor=west] at (5.15,-6.37)
    {$A_i>t_i$: walks straight through the open latch};
  \draw[<->] (4.0,-6.65) -- (5.0,-6.65);
  \node[anchor=north,font=\scriptsize] at (4.5,-6.67) {borrow $b_i=A_i-t_i$};
\end{circuitikz}
\end{document}
```

*Own construction; waveform convention after Fig. 1 of Pedroso et al., GLSVLSI 2026.*

**Separate the master and the slave in space rather than in time.** A [[Master-Slave D Flip-Flop]] is already two latches on opposite phases, so a half-period of transparency exists inside every flop in the design — edge-triggered practice simply discards it by placing the two latches at the same physical point, where the closed slave re-blocks whatever the open master let through. The two-phase discipline keeps the pair and moves the members apart, putting a combinational stage between L1 and L2. Nothing about the storage cell changes; what changes is where the second half of the pair sits, and that alone converts the flop's hard sampling instant into a window.

**Fix the phases, then fix the grid.** Two non-overlapping 1-bit clocks $\phi_1,\phi_2$ of period $T$, each high for $W$ and separated by a dead gap $t_{\mathrm{nov}}$ on both edges:

$$\phi_1 \text{ high on } [0,\,W],\qquad \phi_2 \text{ high on } [T/2,\,T/2+W],\qquad W=\tfrac{T}{2}-t_{\mathrm{nov}}$$

Latch bank $i$ sits on a half-period grid, opens at $t_i=(i-1)T/2$ and closes at $t_i+W$. Each bank is $n$ independent one-bit [[Level-Sensitive D Latch|transparent latches]] sharing one clock net, with no interaction between bit slices, so the $n$-bit datapath in and out of every bank has the same width and the pipeline computes exactly what the flop version computes — the arithmetic error is $0$ ulp and none of the machinery in [[Error Accuracy]] or [[Number Formats]] applies. This is a clocking discipline, not an arithmetic transform. What it optimises is $T$.

**Level-sensitivity means the output during the open window is a wire, not a register.**

$$Q_i(t)=\begin{cases} D_i(t-t_{dq}) & t\in[t_i,\,t_i+W]\quad\text{(transparent)}\\[2pt] Q_i(t_i+W) & \text{otherwise}\quad\text{(opaque)}\end{cases}$$

**Two-phase is a two-colouring, and that is the whole design rule.** Every signal is $\phi_1$-derived or $\phi_2$-derived; no latch may have input and output of the same colour; no combinational cone may mix colours. Pedroso et al. verify exactly these three rules on the placed netlist and observe that they collapse to one condition — for every latch-to-latch edge $(u,v)$ in the latch graph, $\mathrm{colour}(u)\neq\mathrm{colour}(v)$. Violate it and two transparent banks are open on the same phase with logic between them, which is a combinational cycle rather than a pipeline stage.

**Turn transparency into an arrival recurrence.** Let $A_i$ be the arrival time at bank $i$'s D pin and fold the latch delay into the segment ahead of it, $D_i=d_i+t_{dq}$. Because a transparent latch passes late data straight through and holds early data at the opening edge,

$$A_{i+1}=\max\big(t_i,\;A_i\big)+D_{i+1}$$

That $\max$ is the entire mechanism, and it is the two arrows in the diagram: **early data waits for the opening edge; late data walks through.** A flop is the same recurrence with the $\max$ replaced by its first argument unconditionally.

**Cap the borrow with setup at the closing edge.** Setup requires the data stable $t_{su}$ before the latch *closes*, derated by skew $t_{sk}$ ([[Clock Skew and Jitter]]):

$$A_i\;\le\;t_i+\underbrace{W-t_{su}-t_{sk}}_{\textstyle B},\qquad B=\tfrac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$$

so the borrow $b_i=\max(0,\,A_i-t_i)$ is capped at $B$ — the second half of the substitution $W=T/2-t_{\mathrm{nov}}$.

**Unroll the recurrence and the $\max$ collapses into a family of window sums.** Expanding $A_{i+1}=\max(t_i,A_i)+D_{i+1}$ repeatedly, the $\max$ resolves at whichever latch $j-1$ was the last one *not* to borrow, so its arrival is pinned to the grid and everything after it is a plain sum:

$$A_i=\max_{j\le i}\Big(t_{j-1}+\sum_{k=j}^{i}D_k\Big)$$

Substituting this into the setup bound gives $t_{j-1}+\sum_{k=j}^{i}D_k\le t_i+B$ for every $j$. Substituting the grid $t_i=(i-1)T/2$, $t_{j-1}=(j-2)T/2$ and cancelling by **distributivity** — $(i-1)\tfrac{T}{2}-(j-2)\tfrac{T}{2}=(i-j+1)\tfrac{T}{2}$ — leaves one family of inequalities in the run length $L=i-j+1$, which is the constraint the whole discipline reduces to. Dividing by $L$ puts it in per-stage form:

$$\overline{D}_{[j,i]}\;\le\;\frac{T}{2}+\frac{B}{L}$$

> [!important] The claim is about the running average, and it is weaker than the folklore
> The constraint binds on the **average over every window**, not on the maximum. One slow stage is fine; $L$ consecutive slow stages are fine as long as their *total* excess over the nominal grid stays inside a single $B$. Borrowing accumulates along a run and is repaid by later fast stages, but the accumulated debt is bounded by $B$, not by $L\cdot B$. "Only the average matters" is true asymptotically, as $B/L\to0$, and false for a short pipeline with a large local hump.

**The flop constraint is the degenerate case, which is the cleanest way to see what was bought.** An edge-triggered pipeline requires $\max_i\big(d_i+t_{cq}+t_{su}+t_{sk}\big)\le T$: the $L=1$, $B=0$ member of the same family. A flop resynchronises data to the edge at every boundary, so slack cannot cross a stage and the single worst stage sets $T$ for the whole chip. Note also what the boxed form does *not* contain — for large $L$ the only surviving per-hop overhead is $t_{dq}$. **Setup, skew and non-overlap are paid once per run, not once per stage**, which is the second and less advertised reason latch pipelines win at high stage counts.

**Feedback turns a topological question into a fixed-point one.** Around a cycle in the latch graph spanning $m$ half-periods the same inequality applies with the run wrapping onto itself, so the loop's total delay must fit $m\cdot T/2$. Arrival times can no longer be propagated in topological order, and every static-timing pathology of latch-based design — iterate-till-converge runtime, no lookahead for divergent loops, loop-breaker pessimism — descends from that one structural fact rather than from anything about the cells.

**The gap that makes hold free is bought out of the borrow budget.** Data launched when bank $i$ opens at $t_i$ must not reach bank $i+1$ while it is still open from its previous transparency window, which ended at $t_i-t_{\mathrm{nov}}$. With $\delta$ the *minimum* delays,

$$\delta_{dq}+\delta_{i+1}\;\ge\;t_h+t_{sk}-t_{\mathrm{nov}}$$

Two readings, both load-bearing. First, $T$ does not appear, so a latch hold violation cannot be fixed by slowing the clock, exactly as with flops. Second, $t_{\mathrm{nov}}$ is a free parameter that buys hold margin directly and can drive the requirement *negative* — genuinely better than a flop, and the reason many Google–SkyWater shuttle designs that failed permanently on GPIO scan-chain hold are fixable by widening the gap at no frequency cost. But $B=\tfrac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$: every picosecond of non-overlap taken for hold safety is a picosecond that cannot be borrowed. The two headline benefits are in direct competition, and setting the split is the designer's job — the [[Non-Overlapping Two-Phase Clock Generator]] is where that number is dialled in.

**Everything else it costs is a consequence of having two trees instead of one.** Clock distribution needs two balanced trees with a *phase* relationship to hold as well as a skew budget, and the trees see different latch loads, so their insertion delays differ; when one phase is clock-gated the asymmetry is severe, measured at **2.63 ns skew against 0.18 ns** for the ungated variant from a single AND gate in the $\phi_2$ path ([[Clock-Gated Latch Bank]] versus [[Recirculating-Mux Latch Bank]]). On SkyWater 130 nm the measured totals are +36.6 % power for the clock-gated variant and **+142.7 %** for the recirculation-mux one, with combinational cells more than doubling because the retiming that redistributes the latch pairs also replicates logic; the "a latch is half a flop" area argument does not survive contact with the flow. And with borrowing there is no longer a single time instant separating cycle $n$ from cycle $n+1$ — a signal's cycle depends on how much its predecessors borrowed, which costs waveform debug, cycle-accurate model correlation and assertion timing, with no tooling that gives it back.

**On an FPGA the argument collapses at the fabric level, before any tool is involved.** Every LUT already has a free flop beside it, so the area half of the case evaporates; the global clock network is single-phase, and generating a skew- and duty-controlled second phase burns a PLL output and a global buffer; and clock is already 20–39 % of FPGA dynamic power, so a second tree is expensive before it does anything useful ([[FPGAs]]). The tooling exists and is deliberately discouraged — AMD documents `set_max_time_borrow` in UG835/UG949 with the guidance that latches "are not recommended in general as they are difficult to test and validate in hardware" and that the command "should be used by expert users"; Quartus documents the same semantics. Teng's measurements say latch-based optimisation could cut FPGA clock period by **32 % on average**, and nobody ships it, because no vendor flow will place, route and sign off two-phase latch logic without hand-holding.

$$\boxed{\;\sum_{k=j}^{i}D_k\;\le\;L\cdot\frac{T}{2}+B\;}\qquad\text{for every }1\le j\le i\le N,\quad L=i-j+1$$

### When it breaks

- **Short pipelines with one large hump.** $B/L$ is only generous when $L$ is large. At $L=2$ or $3$ a single stage that overruns by more than $B$ still sets the clock, and the discipline has bought nothing for its two clock trees.
- **The colouring is violated anywhere.** One latch-to-latch edge joining two same-phase banks is a transparent combinational cycle, not a slow path. It will not show up as a timing violation; it shows up as an oscillator.
- **Hold, when $t_{\mathrm{nov}}$ has already been spent.** The race-through inequality has no $T$ in it, so if the non-overlap gap has been minimised to maximise $B$, the only remaining fix is padding the short paths.
- **Sequential loops.** The constraint becomes a fixed point over $m$ half-periods; STA iterates to convergence with no divergence lookahead, and a loop that cannot fit its budget simply iterates until a violation falls out.
- **When the schedule is the binding constraint.** Dual CTS, latch-aware borrow convergence, LEC that must be constrained before synthesis and hold closure against a phase gap rather than an edge are all real engineering time. Below the frequency where borrowing pays, the flop wins on that alone — see [[Choosing a Latch Timing Scheme]].
- **On FPGA, essentially always.** Free flops, a single-phase global network and expert-users-only tool support; the 32 % academic upside is unrealised for flow reasons, not physics reasons.

### RTL (Spade)

The pipeline is built from level-sensitive latches, and a latch is combinational feedback: the hold leg routes $Q$ back to the mux that drives $Q$. Spade's `let` cannot refer to the name it is defining, so the latch bank cannot be written at all.

```spade
entity latch_bank<#uint W>(en: bool, d: uint<W>) -> uint<W> {
    let q = if en { d } else { q };
    q
}
```

```
error: Use of undeclared name q
  ┌─ latchfail.spade:2:32
  │
2 │     let q = if en { d } else { q };
  │                                ^ Undeclared name
```

Passing `q` in as a third port silences the error and type-checks, but what it describes is a bare 2:1 mux with the loop left open — the transparency window, and therefore borrowing, is exactly the part that does not survive. The nearest structure the language is native at is the edge-triggered pipeline that the discipline replaces:

```spade
pipeline(2) two_phase_ref(clk: clock, x: uint<8>, y: uint<8>) -> uint<10> {
        let s: uint<9> = x + y;
    reg;
        let t: uint<10> = s + zext::<8, 9>(x);
    reg;
        t
}
```

The two `reg;` separators stand where the L1 and L2 banks stand in the diagram, and the two `let` lines are the logic between them: `x + y` widens $8\to9$ by the growth rule and the second sum widens $9\to10$, so the datapath's $n$ is 8, 9 and 10 bits at the three points where the drawing writes $n$. Everything here is registered, and that is the whole difference — each `reg;` resynchronises to an edge, so a slow first stage cannot spill into the second, which is the $L=1$, $B=0$ row of the boxed constraint. Synthesis maps this to two flop banks; the drawing maps to four latch banks on two trees, computing the identical function at a shorter $T$.

> [!warning] Simulation here checks the datapath, not the discipline
> The fallback simulates clean — 3007 vectors including $1+128$ and $128+1$ and a 3000-vector random sweep against a behavioural reference, with a deliberately corrupted variant confirmed to fail 2989 of them. That establishes only that the *function* being pipelined is right. No available Spade construct expresses transparency, so nothing in the RTL exercises borrowing, the two-colouring or the race-through window; those live in STA, not in simulation.

### Related Notes

- [[Level-Sensitive D Latch]] – depends-on: the cell whose transparency window this discipline spends, and the source of the $t_{dq}$ folded into every $D_k$.
- [[Master-Slave D Flip-Flop]] – compares: the same two latches placed at one point instead of separated by logic, giving the $L=1$, $B=0$ constraint.
- [[Non-Overlapping Two-Phase Clock Generator]] – supports: produces $\phi_1/\phi_2$ and sets $t_{\mathrm{nov}}$, the parameter that trades hold margin against $B$.
- [[Pulsed Latch]] – compares: one latch on the full-cycle grid with a narrow window, capturing most of the borrow for a fraction of the flow cost.
- [[Clock-Gated Latch Bank]] – supports: the cheap way to hold state in a bank here, and the source of the 2.63 ns phase skew.
- [[Recirculating-Mux Latch Bank]] – compares: holds state without touching the clock trees, at +299 % sequential cells.
- [[LSSD Scan Latch Pair]] – extends: makes the L1/L2 pair its own scan cell, which is why DFT is the best-solved part of this flow.
- [[Clock Skew and Jitter]] – depends-on: $t_{sk}$ appears in both the borrow cap and the race-through inequality, with opposite sign in effect.
- [[Choosing a Latch Timing Scheme]] – compares: where this sits against flops and pulsed latches on frequency, area, power and sign-off cost.
- [[Synchronous Sequential Logic]] – counter-example: the single-edge discipline whose clean cycle boundary this trades away.
- [[FPGAs]] – counter-example: free flops and a single-phase global network reverse the entire cost argument.

## References

Written from the local long-form note; this topic has no source in the book, so no page-level citations are given.

- Local: [[0.3a) Dual-Phase Latches]], §"The two-phase scheme", §"Time borrowing / slack passing", §"The costs", §"FPGA mapping".
- Pedroso, Wang & Guthaus, [*An Open-Source Flow for Single-Phase, Edge-Triggered to Two-Phase, Non-Overlapping Clocking Conversion*](https://arxiv.org/abs/2605.05374), GLSVLSI 2026 — two-colouring verification, the waveform convention, and the SkyWater 130 nm power/skew figures.
- Harris, Horowitz & Liu, [*Timing Analysis Including Clock Skew*](https://doi.org/10.1109/43.806806), IEEE TCAD 18(11), 1999 — the setup/hold formalisation used above.
- Sakallah, Mudge & Olukotun, [*checkTc and minTc*](https://dl.acm.org/doi/10.5555/123186.123312), ICCAD 1990 — multi-phase latch timing as a min–max linear program.
- Teng, [*Latch-Based Performance Optimization for FPGAs*](https://tspace.library.utoronto.ca/bitstream/1807/32631/1/Teng_Xiao_201206_MaSc_thesis.pdf), MASc thesis, University of Toronto, 2012 — 32 % clock-period reduction; clock is 20–39 % of FPGA dynamic power.
- AMD Vivado [UG835 `set_max_time_borrow`](https://docs.amd.com/r/en-US/ug835-vivado-tcl-commands/set_max_time_borrow) and [UG949 Max Time Borrow](https://docs.amd.com/r/2021.2-English/ug949-vivado-design-methodology/Max-Time-Borrow) — expert-users-only guidance.
- Weste & Harris, *CMOS VLSI Design*, sequential circuit design and timing — two-phase clocking, time borrowing and race-through as standard canon.
