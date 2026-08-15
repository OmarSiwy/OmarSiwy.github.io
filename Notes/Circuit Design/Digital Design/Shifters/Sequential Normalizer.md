---
title: Sequential Normalizer
description: "A state machine that shifts left one bit per cycle while the MSB is zero, counting as it goes; the cheapest normalizer in existence and the only one with variable latency, so it cannot be pipelined."
kind: circuit
source: "ASA §10.3, p. 324 (final paragraph); recurrence and cost derived here from FSM canon"
status: seed
spade: simulated
tags: [digital, shifters, normalizer, lzc, fsm, iterative]
aliases:
  - Sequential Normalizer
  - While-Loop Normalizer
  - Iterative Normalizer
  - Shift-and-Count Normalizer
---

# Sequential Normalizer

A normalizer that keeps exactly one shift stage — shift-by-one — and reuses it once per cycle under a register, so its area is independent of $S_{\max}$ and its latency is the leading-zero count of the data.

```tikz title="Sequential normalizer: one shift-by-one stage under a register, with the count and the exit condition"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >=latex,
  blk/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=30mm,minimum height=7mm,inner sep=2pt},
  wide/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=40mm,minimum height=7mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
% ---- datapath ----
\node[w] at (-1.0,5.05) {$X$};
\draw[->] (-1.0,4.85) -- node[w,left]{$w_X$} (-1.0,4.25);
\node[blk] (mux) at (0,3.9) {$w_X\times$ 2:1 mux};
\node[w] at (-1.0,4.13) {$0$};
\node[w] at ( 1.0,4.13) {$1$};
\draw[->] (-3.0,3.9) -- (-1.5,3.9);
\node[w,anchor=south] at (-2.25,3.96) {load};
\node[blk] (reg) at (0,2.5) {$R$: $w_X$-bit register};
\draw[->] (0,3.55) -- node[w,right]{$w_X$} (0,2.85);
\draw (0,2.15) -- (0,1.1);
\draw[->] (0,1.1) -- node[w,right]{$w_R$} (0,0.5);
\node[w] at (0,0.28) {$R$};

% ---- feedback: hardwired shift by one ----
\node[circ] at (0,1.6) {};
\draw (0,1.6) -- (2.6,1.6) -- (2.6,4.8) -- (1.0,4.8);
\draw[->] (1.0,4.8) -- (1.0,4.25);
\node[w,anchor=south] at (1.9,4.86) {$\ll 1$ : wiring, no gates};

% ---- msb tap ----
\node[circ] at (2.6,3.4) {};
\draw (2.6,3.4) -- (3.6,3.4);
\draw[->] (3.6,3.4) |- (4.2,3.9);
\node[w,anchor=north] at (3.3,3.35) {$\mathrm{msb}(R)$};

% ---- counter ----
\node[blk] (cnt) at (6.2,2.5) {$C$: $w_C$-bit counter};
\node[blk] (cmp) at (6.2,1.15) {$C \stackrel{?}{=} S_{\max}$};
\draw (6.2,2.15) -- (6.2,1.8);
\node[circ] at (6.2,1.8) {};
\draw[->] (6.2,1.8) -- (6.2,1.5);
\draw[->] (6.2,1.8) -- node[w,above]{$w_C$} (8.6,1.8);
\node[w] at (8.85,1.8) {$C$};

% ---- done ----
\node[wide] (dn) at (6.2,3.9) {done $=\mathrm{msb}(R)\vee(C{=}S_{\max})$};
\draw (6.2,0.8) -- (6.2,0.5) -- (9.3,0.5) -- (9.3,3.9);
\draw[->] (9.3,3.9) -- (8.2,3.9);
\draw[->] (6.2,4.25) -- (6.2,4.9);
\node[w] at (6.2,5.1) {done};

% ---- enables ----
\draw[->] (-3.0,2.5) -- (-1.5,2.5);
\node[w,anchor=south] at (-2.25,2.56) {en $=\overline{\text{done}}$};
\draw[->] (3.25,2.5) -- (4.7,2.5);
\node[w,anchor=south] at (3.97,2.56) {en $=\overline{\text{done}}$};
\end{circuitikz}
\end{document}
```

**Spend the shift decomposition in time instead of in space.** [[Barrel Shifters]] and the [[Fused Normalizer]] both rest on the same identity — shifting is a monoid homomorphism $(\mathbb{N},+)\to(\text{functions},\circ)$, $\sigma^{a}\circ\sigma^{b}=\sigma^{a+b}$ — and both spend it the same way: expand $S$ in binary and instantiate one mux row per bit, $w_S=\lceil\log_2(S_{\max}+1)\rceil$ rows of hardware evaluated in one cycle. The sequential normalizer takes the *unary* decomposition of the very same homomorphism,
$$\sigma^{C}=\underbrace{\sigma\circ\sigma\circ\cdots\circ\sigma}_{C\ \text{times}},$$
and instantiates the single factor $\sigma^{1}$ once. Composition is realised by a register rather than by wire, so the $C$ applications are serialised in time. Nothing about the algebra changes; only the schedule does.

**Turn normalization into a recurrence over a two-part state.** The state is $(R_t,C_t)$ with $R_t$ on $w_X$ bits and $C_t$ on $w_C=\lceil\log_2(S_{\max}+1)\rceil$ bits, initialised $R_0=X$, $C_0=0$. One iteration is
$$(R_{t+1},C_{t+1})=\begin{cases}(R_t\ll 1,\ C_t+1) & \overline{\mathrm{msb}(R_t)}\wedge(C_t\neq S_{\max})\\[2pt](R_t,\ C_t) & \text{otherwise.}\end{cases}$$
The guard is the whole design. Its loop invariant is $R_t=X\cdot 2^{C_t}$ *exactly* — not modulo $2^{w_X}$ — because $\ll 1$ is injective on $w_X$ bits precisely when the bit leaving the top is zero, which is the guard. So the recurrence maintains $X\cdot2^{C_t}<2^{w_X}$ by construction, and on exit through the first disjunct $\mathrm{msb}(R)=1$ gives $2^{w_X-1}\le R<2^{w_X}$: normalized, no bit of $X$ lost. That is the same losslessness the exact full shifter buys with extra width, obtained here for free from the exit test.

**One bit does double duty, which is why there is no separate LZC.** In the pipelinable construction the count comes from a [[Leading Zero Counters|leading zero counter]] and is then handed to a shifter as its distance; the [[Fused Normalizer]] merges the two by exploiting that the naive LZC emits $c_j$ MSB-first, in exactly the order a largest-shift-first barrel shifter consumes them. Here the merge is total: $\mathrm{msb}(R_t)$ *is* the LZC's per-level test, evaluated one bit-position at a time, and $C$ is just the tally of how many times it came out zero. There is no NOR tree at any width — a single flip-flop output is simultaneously the loop's exit condition and the certificate that the previous shift was lossless. The counter is therefore not overhead attached to a shifter; it is the LZC, unrolled in time.

**The saturation term is not decoration.** For $X=0$ no leading one exists, $\mathrm{msb}(R_t)=0$ forever, and without the $C_t\neq S_{\max}$ conjunct the machine never terminates. Bounding the count is the sequential analogue of the combinational trick of right-padding $X$ with **ones** to width $2^{w_C}-1$ so that $C$ saturates at $w_X$ instead of running off ([[Leading Zero Counters]], p. 318–319). The exit is then $R=0$, $C=S_{\max}$, and the surrounding format has to encode "zero" out of band — see [[Number Formats]] for why a normalized significand cannot represent it.

**Cost is the register file plus the loop control, and nothing else.** The datapath is $w_X$ flip-flops and a $w_X$-wide 2:1 multiplexer to select $X$ against $R\ll1$; the shift itself is routing, so no gate is charged to it at any $S_{\max}$. Loop control adds $w_C$ flip-flops, a $w_C$-bit incrementer, a $w_C$-bit equality comparator against $S_{\max}$, and one OR — for $w_X=S_{\max}=32$ that is 6 flip-flops and two 6-bit operators against a 32-bit datapath. Compare the [[Fused Normalizer]] at $O(w_X\log w_X)$ multiplexers (p. 325): the sequential form is asymptotically a factor $\log w_X$ cheaper in area and pays for it with a factor of up to $w_X$ in latency. On an **FPGA** the hold is free — every LUT's flip-flop carries a dedicated clock-enable, so `en` costs no logic and the load multiplexer collapses into the same LUT that already drives the register. On an **ASIC** the hold is a real multiplexer per bit, or a gated clock with its own timing sign-off, which is the one place the two technologies price this circuit differently.

**Latency is the data, so the average and the worst case are far apart.** Load takes one cycle, then $C$ shift cycles: $C+1$ cycles of occupancy with $C\in[0,S_{\max}]$. If $X$ is uniform on $[0,2^{w_X})$ then $\Pr[C=k]=2^{-(k+1)}$ and $\mathbb{E}[C]=\sum_{k\ge0}k2^{-(k+1)}=1$, so the *typical* cost is two cycles regardless of $w_X$ — the worst case is exponentially rare (derived here; not in the book). That statistic is a trap. The application that needs a normalizer at all is floating-point subtraction of near-equal operands, where cancellation makes $C$ large exactly on the inputs that matter, and it is the deadline, not the mean, that sizes the clock budget.

**Variable latency is a structural bar to pipelining, not an engineering inconvenience.** A pipeline needs a schedule fixed at elaboration: stage $j$ must hold operand $n$ while stage $j+1$ holds operand $n-1$, which requires the trip count to be a constant. Here the trip count is a function of the operand, so there is no initiation interval to quote and the operator must be wrapped in a handshake ([[Synchronous Sequential Logic]]). Note that "iterative" alone is not the obstacle — [[Restoring Division]] is also a one-digit-per-cycle recurrence, but its trip count is exactly $w_Q$ whatever the operands, so it unrolls into a fixed pipeline. The difference is entirely that division's exit test changes the *digit* it produces while normalization's exit test changes the *number of iterations*.

$$\boxed{\ (R_{t+1},C_{t+1})=\begin{cases}(R_t\ll1,\ C_t+1) & \overline{\mathrm{msb}(R_t)}\wedge(C_t\neq S_{\max})\\(R_t,\ C_t) & \text{otherwise}\end{cases}\qquad \text{latency}=C+1\ \text{cycles},\ \ C\in[0,S_{\max}]\ }$$

**When it breaks.**

- $X=0$: no leading one, so the machine only halts on the saturation term. Drop it and the circuit hangs — this is the single most common bug in this design.
- Any fixed cycle budget: there is no width at which the sequential form wins on latency. Its best case ties the combinational normalizer's one cycle and its worst case is $S_{\max}+1$. It competes on area only.
- Cancellation-dominated workloads: the $\mathbb{E}[C]=1$ argument inverts, and the worst case becomes the common case.
- $w_R<w_X$: the discarded low bits still need a sticky bit for ties-to-even ([[Error Accuracy]], [[Rounding]]). Cheap here — the whole word is sitting in a register at exit, so it is one wide OR over the low $w_X-w_R$ bits, done once rather than incrementally as in the [[Shifter with Sticky Bit Computation]].
- Two's-complement significands (posits, and the formats of [[Floating-Point Formats]]): the exit test becomes "top two bits differ" rather than $\mathrm{msb}=1$, since what is being counted is the leading *sign* bit. The recurrence is otherwise unchanged.

```spade
/// One iteration of the normalization recurrence.
/// `load` seeds the state with X; `done` freezes it.
entity norm_iter<#uint W, #uint WC>(
    clk: clock,
    load: bool,
    x: uint<W>,
    smax: uint<WC>,
) -> (uint<W>, uint<WC>, bool) {
    decl done;
    reg(clk) r: uint<W>  reset(load: x) = if done { r } else { r << 1 };
    reg(clk) c: uint<WC> reset(load: 0) = if done { c } else { trunc(c + 1) };
    let done = r.msb() || (c == smax);
    (r, c, done)
}
```

`r` is the $w_X$-bit register in the drawing and `r << 1` is its hardwired feedback path; the synchronous `reset(load: x)` port *is* the load multiplexer, which is why no explicit mux appears in the source. `c` is the counter, `done` the OR block, and `if done { r } else { .. }` the two clock enables. The whole entity is one iteration — instantiating it does not unroll anything, and a $w_X$-cycle operator is this same instance visited $C+1$ times. Synthesis will differ from the drawing in one place: on an FPGA the `if done` on each register becomes the flip-flop's CE pin rather than a mux in the LUT fabric, so the mux row in the diagram costs nothing there.

`norm_iter::<8,4>` was driven to completion and its final $(R,C,\text{done})$ checked against a behavioural leading-zero reference: 3006 vectors, including the asymmetric pair $00000001$ ($C=7$) and $10000000$ ($C=0$) that a reversed bit order would swap, the all-zero saturation case ($C=S_{\max}=8$), and 3000 `$random` words — all exact.

**Related Notes.**

- [[Normalizers]] – compares: the specification this answers, and where the other three implementations sit against it.
- [[Fused Normalizer]] – compares: the same LZC/shifter merge done in space in one cycle, at $O(w_X\log w_X)$ muxes instead of $O(w_X)$ flip-flops.
- [[Leading Zero Counters]] – depends-on: the count this machine produces one bit-test per cycle is that recurrence, unrolled in time.
- [[Barrel Shifters]] – counter-example: binary decomposition of the same shift homomorphism, all $\log_2 S_{\max}$ factors instantiated at once.
- [[Restoring Division]] – compares: also one digit per cycle, but with a trip count fixed at elaboration, which is exactly what makes it pipelinable and this not.
- [[Moore]] – supports: `done` is a function of $(R,C)$ alone, so it is glitch-free and safe to use directly as the enable and as a handshake output.
- [[Synchronous Sequential Logic]] – depends-on: the handshake and control discipline a variable-latency operator forces on everything downstream.
- [[Choosing a Shifter]] – compares: where this sits in the full area/latency table.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.3 Normalizer (combined LZC + shifter), pp. 323–325 — Figs. 10.13–10.15; the while-loop variant is the final paragraph of p. 324, and the $O(w_X\log w_X)$ / $O(\log^2 w_X)$ costs of its combinational rival are on p. 325.
- §10.2.1 Naive LZC, pp. 318–320 — the padding-with-ones saturation argument reused here for the $C=S_{\max}$ exit.

The recurrence, its loop invariant, the loop-control cost breakdown and the $\mathbb{E}[C]=1$ latency distribution are not in the book; they follow from standard FSM practice (Mano & Ciletti, *Digital Design*, Ch. 5; Wakerly, *Digital Design: Principles and Practices*, Ch. 9).
