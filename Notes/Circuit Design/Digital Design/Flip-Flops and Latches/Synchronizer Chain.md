---
title: Synchronizer Chain
description: "N flops in series with nothing between them, buying a factor of exp(T_clk/tau) of MTBF per stage — a few square microns for five orders of magnitude, and the only lever with that leverage."
kind: circuit
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches]
aliases:
  - "Two-Flop Synchronizer"
---

# Synchronizer Chain

$N$ flip-flops in series on the destination clock with nothing combinational between them, the only structure in digital design that buys reliability multiplicatively — one extra flop multiplies MTBF by $e^{T_{clk}/\tau}$.

```tikz title="Two-flop synchronizer across a clock-domain boundary"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- clock-domain boundary ------------------------------------------------
  \draw[dashed,gray] (1.35,-2.05) -- (1.35,2.60);
  \node[gray,anchor=south,align=center,font=\footnotesize] at (1.35,2.60)
       {clock-domain\\crossing};

  % --- asynchronous input ---------------------------------------------------
  \node[anchor=east] at (-0.15,1.55) {$d_{async}$};
  \node[anchor=south,font=\footnotesize] at (0.70,1.65) {1 bit};
  \draw[->] (-0.10,1.55) -- (2.00,1.55);

  % --- stage 1 --------------------------------------------------------------
  \draw (2.00,0.30) rectangle (3.40,2.00);
  \node[anchor=west] at (2.10,1.55) {D};
  \node[anchor=east] at (3.30,1.55) {Q};
  \node at (2.70,0.80) {FF$_1$};
  \draw (2.00,0.55) -- (2.35,0.80) -- (2.00,1.05);

  % --- inter-stage wire: nothing may live here ------------------------------
  \draw[->] (3.40,1.55) -- (5.00,1.55);
  \node[anchor=south,font=\footnotesize] at (4.20,1.62) {$q_1$, 1 bit};
  \node[anchor=north,font=\footnotesize] at (4.20,1.48) {no logic};
  \node[anchor=south,font=\footnotesize] at (4.20,2.15)
       {$q_1$ may still be metastable};

  % --- stage 2 --------------------------------------------------------------
  \draw (5.00,0.30) rectangle (6.40,2.00);
  \node[anchor=west] at (5.10,1.55) {D};
  \node[anchor=east] at (6.30,1.55) {Q};
  \node at (5.70,0.80) {FF$_2$};
  \draw (5.00,0.55) -- (5.35,0.80) -- (5.00,1.05);

  % --- synchronised output --------------------------------------------------
  \draw[->] (6.40,1.55) -- (8.20,1.55);
  \node[anchor=west] at (8.25,1.55) {$d_{sync}$};
  \node[anchor=south,font=\footnotesize] at (7.30,1.65) {1 bit};

  % --- destination clock rail ----------------------------------------------
  \draw (1.55,-0.70) -- (4.75,-0.70);
  \draw (1.75,-0.70) -- (1.75,0.80) -- (2.00,0.80);
  \draw (4.75,-0.70) -- (4.75,0.80) -- (5.00,0.80);
  \node[circ] at (1.75,-0.70) {};
  \node[anchor=north west,font=\footnotesize] at (1.82,-0.82) {$clk_B$};

  % --- resolution-time budget ----------------------------------------------
  \draw[<->,>=latex] (2.35,-1.60) -- (5.35,-1.60);
  \node[anchor=north,font=\footnotesize] at (3.85,-1.68)
       {$t_r = 2\,T_{clk} - t_{setup} - t_{cq}$};
\end{circuitikz}
\end{document}
```

**Read the failure rate before reading the circuit.** [[Metastability and MTBF]] establishes that a flop caught mid-aperture leaves its cross-coupled loop near the unstable point, from which the differential mode diverges as $v_d(t)=v_d(0)e^{t/\tau}$ — so the probability of being unresolved after $t$ is $e^{-t/\tau}$, and

$$\mathrm{MTBF}=\frac{e^{\,t_r/\tau}}{T_0\,f_c\,f_d}$$

with $f_c$ the destination clock frequency, $f_d$ the rate of asynchronous input events, $T_0$ the effective aperture width, and $t_r$ the resolution time allowed. The shape of that expression is the whole design: **linear in everything except $t_r$, exponential in $t_r$.** Halving $f_d$ doubles MTBF. Buying one more clock period of $t_r$ multiplies it.

**The chain is nothing but a machine for enlarging $t_r$.** Register the 1-bit asynchronous signal $d_{async}$ into $\mathrm{FF}_1$, then feed $q_1$ (1 bit) straight into $\mathrm{FF}_2$, and $\mathrm{FF}_1$'s output has a full clock period in which to collapse before anything samples it. With $N$ stages the last stage sees an input that has had

$$t_r = N\,T_{clk} - t_{setup} - t_{cq}$$

to resolve — $N$ whole periods less the setup margin the final stage still demands and the clock-to-Q of the stage driving it (see [[Setup and Hold Constraints]] for both terms). Each additional stage adds exactly $T_{clk}$ to the exponent's numerator, so MTBF gains a constant *factor* $e^{T_{clk}/\tau}$ per stage. That is a geometric return on a linear cost of one flop and one cycle of latency.

**Put the numbers in and the leverage becomes absurd.** Take an asynchronous source at $f_d = 100$ MHz sampled by $f_c = 1$ GHz ($T_{clk} = 1$ ns), with a deliberately poor flop, $\tau = 100$ ps and $T_0 = 20$ ps, and $t_{setup}=80$ ps, $t_{cq}=120$ ps. The denominator is fixed at $T_0f_cf_d = 20\times10^{-12}\cdot10^{9}\cdot10^{8} = 2\times10^{-3}\ \mathrm{s^{-1}}$:

| $N$ | $t_r$ | $e^{t_r/\tau}$ | MTBF |
| --- | --- | --- | --- |
| 1 | 0.80 ns | $e^{8}\approx3.0\times10^{3}$ | $1.5\times10^{6}$ s $\approx$ **17 days** |
| 2 | 1.80 ns | $e^{18}\approx6.6\times10^{7}$ | $3.3\times10^{10}$ s $\approx$ **1000 years** |
| 3 | 2.80 ns | $e^{28}\approx1.4\times10^{12}$ | $7.2\times10^{14}$ s $\approx$ **23 Myr** |

Three flops on this pessimistic library outlast the planet. Two is the industry default because the second stage is where the curve crosses "longer than the product exists".

> [!important]
> **Nothing may sit between the stages.** A gate on the $q_1$ wire costs its propagation delay out of $t_r$ — the one term in an exponent — while buying nothing. On the numbers above, moving 200 ps of logic between $\mathrm{FF}_1$ and $\mathrm{FF}_2$ divides MTBF by $e^{2}\approx7.4$; moving 500 ps divides it by $e^{5}\approx150$. Worse, a metastable $q_1$ driving a fan-out of two gates lets the two branches interpret the intermediate voltage differently, which reintroduces the exact inconsistency the chain exists to remove.

**One synchronizer per signal, and only for control.** The same argument forbids fanning an unsynchronized signal to two destinations: each destination's first flop resolves independently, and they may resolve *differently* — one FSM sees the bit set and another does not, from the same wire in the same cycle. It also forbids passing a multi-bit bus through $W$ parallel chains: each bit resolves on its own coin flip, so the receiver can latch a word assembled from two different source cycles. $\{01\to10\}$ on 2 bits can be observed as $00$ or $11$. The repairs are all structural rather than statistical — a single-bit request/acknowledge handshake, a [[Gray Code Counter]] pointer whose encoding guarantees only one bit changes per increment so a mis-sampled bit yields an adjacent-and-therefore-safe value, or a full [[Asynchronous FIFO]] built from both.

**The chain is fragile against your own synthesis tool.** Structurally these are two ordinary D flops, so retiming will happily absorb one into surrounding logic, and placement has no reason to keep them adjacent — and physical separation eats $t_r$ in routing delay just as logic does. On FPGAs the fix is an attribute the vendor understands: `ASYNC_REG` on AMD/Xilinx forces the flops into the same slice and marks them exempt from optimisation; Intel/Altera use `SYNCHRONIZER_IDENTIFICATION`, which additionally makes the timing engine report an estimated MTBF. Cost there is genuinely near zero — a slice already in use has spare flops. On ASICs the flops come from a characterised synchronizer cell (a wider-swing, higher-$g_m$ master latch, hence smaller $\tau$) carrying a don't-touch, and the two are placed abutted; the false-path or `set_max_delay` exception on the crossing is what stops static timing analysis from reporting an unfixable violation on a path that is deliberately unconstrained.

> [!warning] $\tau$ and $T_0$ are per-library characterisation data, measured on silicon per process corner and voltage. The values used above are illustrative. Real numbers come from the cell datasheet or a metastability characterisation run — never from a textbook.

$$\boxed{\ \mathrm{MTBF}(N)=\frac{\exp\!\big[(N\,T_{clk}-t_{setup}-t_{cq})/\tau\big]}{T_0\,f_c\,f_d}\ }$$

**When it breaks.**

- **Pulses shorter than $T_{clk}$ of the destination.** The chain fixes metastability, not sampling. A source pulse narrower than one destination period can be missed entirely, and no value of $N$ helps. Convert to a level with a toggle flop in the source domain and recover the edge after the chain.
- **$N > 3$ is usually waste.** MTBF is already past any meaningful fleet-hours figure, while $\tau$ itself is only known to a factor, so further stages buy latency you can measure and reliability you cannot.
- **High $f_c$ attacks from both sides.** $t_r$ shrinks with $T_{clk}$ *and* $f_c$ sits in the denominator, so MTBF degrades faster than linearly with frequency. The stage count that sufficed at 200 MHz is not the count for 1 GHz.
- **Asynchronous reset is itself a crossing.** A reset deasserting near the clock edge puts the synchronizer's own flops into the state they exist to prevent. Assert asynchronously, deassert through its own two-flop chain.
- **Within one clock domain the chain is meaningless.** There $d$ is timed, and correctness is the two inequalities of [[Setup and Hold Constraints]]; adding flops there buys latency and nothing else.

```spade
entity sync_chain<#uint N>(clk: clock, rst: bool, d: bool) -> bool {
    reg(clk) q: [bool; N] reset(rst: [false; N]) = q.shift_front(d);
    q.last()
}

entity sync2(clk: clock, rst: bool, d: bool) -> bool {
    inst sync_chain::<2>(clk, rst, d)
}
```

`q` is the chain state, $N$ bits wide, one per box in the diagram; `shift_front` pushes the new `d` into element 0 and drops the last, so `q.last()` is $\mathrm{FF}_N$'s output — the $d_{sync}$ arrow. Everything is registered; there is no combinational path between stages, which is the entire point and is also why the emitted Verilog is exactly $N$ `always @(posedge clk)` assignments. Spade's own `std::cdc::sync2` is the same structure behind an `unsafe` unit. What synthesis does differently from the drawing is precisely the hazard above: without `ASYNC_REG`/don't-touch it may retime or scatter these flops, and the RTL carries no way to say so — the attribute lives in constraints, not in the language.

Simulation is worth running even though metastability is not a modellable event in RTL: what it checks is that the chain is a pure $N$-cycle delay with no widening, reordering, or off-by-one in stage count. A one-cycle pulse (the asymmetric vector — a steady input passes even on a chain of the wrong length) must appear exactly two edges later and last exactly one cycle, and 3000 random inputs must match a two-flop behavioural reference. Rebuilding the wrapper as `sync_chain::<3>` makes both fail, which is the evidence the check has teeth.

**Related Notes**

- [[Metastability and MTBF]] – depends-on: supplies the $e^{t/\tau}$ resolution law and the MTBF expression this circuit manipulates.
- [[Master-Slave D Flip-Flop]] – depends-on: the stage itself, and the aperture window that makes the failure possible.
- [[Setup and Hold Constraints]] – supports: the $t_{setup}$ and $t_{cq}$ subtracted from $N\,T_{clk}$.
- [[Asynchronous FIFO]] – extends: the multi-bit crossing this chain explicitly cannot do.
- [[Gray Code Counter]] – supports: the encoding that lets a pointer cross on parallel chains safely.
- [[Network-On-Chip]] – compares: where hundreds of these crossings are the architecture rather than an afterthought.
- [[Switch Debouncer]] – counter-example: also flops in series on a slow input, but filtering a bounded mechanical bounce, not an unbounded resolution time.

## References

Written from canon; no page-level citations, as no single source was consulted.

- Ginosar, "Metastability and Synchronizers: A Tutorial", *IEEE Design & Test*, 2011 — the MTBF model, the $N$-stage $t_r$ budget, and the three design rules (no fan-out, no logic between stages, control not data).
- Weste & Harris, *CMOS VLSI Design*, sequential circuit design chapter — the time constant $\tau$, synchronizer cell design, and the setup/hold terms in $t_r$.
- Mano & Ciletti, *Digital Design*, synchronous sequential logic chapter — the two-flop synchronizer as the standard asynchronous-input treatment.
