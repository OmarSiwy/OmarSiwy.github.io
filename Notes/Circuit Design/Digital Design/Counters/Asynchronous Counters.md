---
title: Asynchronous Counters
description: "Ripple chain of divide-by-twos with no increment logic at all — highest raw toggle rate and one flop on the clock tree, paid for with n·t_cq of invalid word and a decoded glitch at every edge."
kind: circuit
source: "2.8) Counters §Asynchronous (ripple) counters, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, ripple, clocking, low-power]
aliases:
  - Ripple Counter
  - Ripple Counters
  - Asynchronous Counter
  - Ripple-Carry Counter
  - Clock Divider Chain
---

# Asynchronous Counters

A cascade of $n$ divide-by-two flip-flops in which stage $i$ is clocked by stage $i-1$'s output rather than by the system clock, so the increment exists only as a propagation delay and never as a gate.

```tikz title="Four-stage ripple counter: each Q_i is the next stage's clock, with cumulative settling time"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- four independent divide-by-two stages ---
  \foreach \i in {0,1,2,3} {
    \pgfmathsetmacro\x{3.6*\i}
    \draw (\x,0) rectangle (\x+2.2,1.4);
    \node at (\x+1.1,0.92) {T FF, $T{=}1$};
    \node at (\x+1.1,0.40) {$\div 2$};
    \draw (\x+1.0,0.0) -- (\x+1.1,0.24) -- (\x+1.2,0.0);
    \node at (\x+1.1,1.85) {stage \i};
  }

  % --- system clock into stage 0 from below ---
  \draw[->] (1.1,-2.6) -- (1.1,0.0);
  \node[anchor=east] at (1.0,-2.35) {clk \, / \, $1$, rate $f$};

  % --- Q_i out to the right, then down and back into stage i+1's clock ---
  \foreach \i in {0,1,2} {
    \pgfmathsetmacro\x{3.6*\i}
    \pgfmathsetmacro\n{3.6*\i+3.6}
    \draw (\x+2.2,0.7) -- (\x+3.4,0.7);
    \fill (\x+2.8,0.7) circle (1.5pt);
    \draw (\x+2.8,0.7) -- (\x+2.8,-2.6) -- (\n+1.1,-2.6);
    \draw (\n+1.1,-2.6) -- (\n+1.1,-0.35);
    \draw (\n+1.1,-0.24) circle (0.11);
    \draw[->] (\n+1.1,-0.13) -- (\n+1.1,0.0);
  }

  % Q_i stub labels and toggle rates
  \foreach \i/\p in {0/1,1/2,2/3} {
    \pgfmathsetmacro\x{3.6*\i}
    \node[anchor=south] at (\x+2.75,0.80) {$Q_{\i}$/$1$};
    \node[anchor=east]  at (\x+2.65,-1.5) {rate $f/2^{\p}$};
  }
  \draw[->] (13.0,0.7) -- (14.6,0.7);
  \node[anchor=south] at (13.8,0.80) {$Q_3$ \, / \, $1$};
  \node[anchor=north] at (13.8,0.58) {rate $f/16$};

  % --- settling annotation ---
  \node[anchor=east] at (-0.4,-3.4) {$Q_i$ settles at:};
  \foreach \i/\p in {0/1,1/2,2/3,3/4} {
    \pgfmathsetmacro\x{3.6*\i}
    \node at (\x+1.1,-3.4) {$\p\,t_{cq}$};
  }

  % --- legend line ---
  \draw (-0.3,-4.2) circle (0.11);
  \node[anchor=west] at (0.0,-4.2)
    {$\overline{Q_i}$ : stage $i{+}1$ toggles when $Q_i$ falls $1\!\to\!0$ --- the carry condition realised in time, not in gates};
  \node[anchor=west] at (-0.4,-4.9)
    {the word $Q=Q_3Q_2Q_1Q_0$ ($4$ bits) is invalid for $4\,t_{cq}$ after every clk edge};

\end{circuitikz}
\end{document}
```

**Read the carry condition as an event instead of a signal.** The binary increment's toggle condition, established in [[Incrementer]], is $t_i=\mathrm{EN}\cdot\prod_{j<i}q_j$: bit $i$ flips exactly when every lower bit is $1$ and the counter is enabled. Now observe *when* the conjunction $\prod_{j<i}q_j$ can transition from true to false. Bit $i-1$ is the lowest-weight member of that product, and by the same recurrence it is the last of the lower bits to change, so the product goes false precisely at the moment $q_{i-1}$ falls $1\to0$. The converse also holds: $q_{i-1}$ can only fall when $\prod_{j<i-1}q_j$ was true, which is $\prod_{j<i}q_j$ true. The predicate and the event are therefore equivalent, and if a flip-flop can be made to fire on that event, the AND-chain computing the predicate is redundant. That is the entire circuit: **clock stage $i$ with $Q_{i-1}$ and delete the increment logic.** No AND gates, no XOR gates, no carry chain, no enable fan-out — $n$ flops and $n-1$ wires.

**Each stage is a divide-by-two, and that fixes the edge polarity.** A T flip-flop with $T$ tied to $1$ inverts on every active edge of its clock, so its output is a square wave at exactly half the clock's rate: $Q_i$ toggles at $f/2^{i+1}$ where $f$ is the system clock rate. Every signal here is $1$ bit — `clk`, each $Q_i$ — and only the concatenation $Q=Q_{n-1}\cdots Q_0$ is $n$ bits wide. Polarity follows from the falling-edge requirement above. With **negative-edge** flops, wiring $Q_{i-1}$ straight into stage $i$'s clock fires on $Q_{i-1}\!\downarrow$ and the chain counts **up**. With **positive-edge** flops the same wiring fires on $Q_{i-1}\!\uparrow$, which is the condition $\prod_{j<i}\overline{q_j}$ — every lower bit $0$ — so the identical chain counts **down**; feeding $\overline{Q_{i-1}}$ instead restores the up-count. This is the same duality the long-form note derives from $\overline{\overline{Q}+1}=Q-1 \bmod 2^n$ ([[Number Formats]]), except here it costs an inverter or a choice of flop rather than an XOR per bit — and [[Up-Down Counter]] needs a runtime multiplexer on the clock, which is precisely the thing you must never build.

**The price is that the toggles are causally chained, not concurrent.** Stage $i$ cannot move until stage $i-1$'s output has moved, so clock-to-Q delays add rather than overlap:

$$Q_i \text{ settles at } (i+1)\,t_{cq} \text{ after the clk edge} \quad\Longrightarrow\quad Q \text{ is invalid for } n\,t_{cq}$$

For $n=16$ and $t_{cq}=120\,\text{ps}$ that is $1.9\,\text{ns}$ of garbage after every edge — longer than a full clock period at $500\,\text{MHz}$, meaning there is no sampling instant at which the word is correct. Contrast [[Synchronous Counters]], where the whole word is valid after $t_{cq}+t_{\text{skew}}$ regardless of $n$, because the flops move concurrently.

**During settling the counter occupies states that are not on its own state graph.** These are not near-misses; they are entirely different counts. Take $011\to100$ on a three-stage chain:

$$011 \xrightarrow{\;t_{cq}\;} 010 \xrightarrow{\;2t_{cq}\;} 000 \xrightarrow{\;3t_{cq}\;} 100$$

A combinational decoder watching for $000$ fires a spurious pulse of width $t_{cq}$ in the middle of the $3\to4$ transition. This is worth separating from an ordinary logic hazard: a hazard is a marginal-timing artefact that a slower clock removes, whereas this glitch's width is set by $t_{cq}$ — a silicon constant — and is therefore **independent of $T_{\text{clk}}$**. Slowing the clock down does not shrink it; it only makes it a smaller fraction of the period. Any [[Modulo-N Counter]] built by decoding $Q=N-1$ out of a ripple chain will therefore clear itself early, at whichever transient code happens to match first.

**What you buy is the flop's own toggle limit and almost no clock power.** Each stage's timing constraint involves exactly one flip-flop's self-loop, so

$$T_{\min}=t_{cq}+t_{su}$$

with **no $n$ in it** — the fastest of any structure in [[Choosing a Counter]], because there is no combinational logic between a flop's output and its own input at all. The power argument is just as strong and is the more common reason to reach for the circuit. Stage $i$ toggles at $f/2^{i+1}$, so total flop switching activity is $\sum_{i\ge0} f/2^{i+1} < f$ regardless of how many stages you add, by the geometric series. More importantly, **only stage 0 sits on the high-rate clock net.** A synchronous divider must distribute $f$ to all $n$ flops through a balanced clock tree, and that tree — not the flops — usually dominates the dynamic power of a divider; the ripple chain replaces it with $n-1$ short local wires that each toggle at a geometrically decaying rate.

**On FPGA this argument inverts, and the circuit becomes the wrong choice almost everywhere.** Every $Q_i$ is a clock, so on fabric it must be routed onto the global clock network to reach the next stage's flop with usable skew — and global clock resources are a small fixed pool per device, sized for a handful of design clocks, not for one per counter bit ([[FPGAs]]). Route $Q_i$ on general interconnect instead and its skew against the data it captures is unbounded. Meanwhile the thing the ripple chain was saving you — the increment logic — is already free on fabric: the hard carry chain and the slice flop's `CE` port mean a synchronous counter costs one LUT and one flop per bit with the carry cell thrown in ([[Lookup-Tables]]). The trade the circuit makes is a good one only when the clock tree is yours to pay for, which is the ASIC case.

**Static timing analysis sees $n$ clock domains, not one.** Each $Q_i$ is a generated clock derived from `clk` by a divide-by-two, and the tool must be told so; every path that leaves the chain crosses from a generated clock back to `clk` and is, formally, a clock-domain crossing with no phase relationship the tool can constrain ([[Asynchronous Sequential Logic]] frames the general hazard). This, rather than the glitch, is what makes a ripple counter expensive to *own* in a real flow.

> [!important] The chain is correct only if nothing ever reads the middle of it.
> Every defect above — invalid word, transient codes, decoded glitch, $n$ generated clocks — vanishes if the only consumer is the last stage $Q_{n-1}$. That signal is a clean square wave at $f/2^n$, merely delayed by $n\,t_{cq}$, and delay on a free-running divider output is not an error. Ripple counters are a **clock-divider** structure that happens to expose a count, not a counter that happens to be cheap.

$$\boxed{\ Q_i^{+}=\overline{Q_i}\ \text{ on } Q_{i-1}\!\downarrow \quad\Longrightarrow\quad
T_{\min}=t_{cq}+t_{su},\quad
t_{\text{valid}}=n\,t_{cq},\quad
\text{activity}<f \ }$$

**When it breaks**

- **Any decode of the full word.** Terminal-count compare, address decode, a `==N` strobe: all of them see the transient codes. The escape is to decode from a resynchronised copy, at which point you have paid for a register bank and should have built a [[Synchronous Counters|synchronous counter]].
- **Any clock-domain crossing.** Multiple bits change per count *and* they change at different times, so a [[Gray Counter]]'s one-bit-in-flight guarantee is unavailable in principle — Gray coding requires all bits to be candidates for change at one instant.
- **Synchronous clear cannot reach the chain.** Holding a synchronous reset on stage 0 stops it toggling, which removes the only clock stages $1\ldots n-1$ have, so they freeze at whatever they held. The chain needs a genuine **asynchronous** CLR wired to every stage; this is not a stylistic preference. Verified below in simulation: a 4-stage chain at $Q=5$ with a synchronous reset asserted for 64 clock periods ends at $Q=4$ — bit 0 cleared, the upper three frozen.
- **Non-power-of-two moduli.** There is no cheap modulus control. The classic feedback trick — decode $N$ and pulse the asynchronous clear — is exactly the decode-the-word case above, and its clear pulse is self-terminating, so its width is a race between the decoder and the reset path. [[Preload-and-Overflow Counter]] and [[Zero-Detect Down Counter]] both assume a common clock and neither applies.
- **The width at which it stops mattering.** Below roughly $n=4$ the whole comparison is moot: a synchronous counter's carry chain is one or two gates, $f_{\max}$ is set by the flop either way, and the clock-tree power of four flops is not worth a design review. The argument only pays at large $n$ with a high $f$ — which is the prescaler case, where [[Two-Stage Prescaled Counter]] uses a short ripple front end feeding a synchronous back end and takes both wins.

**RTL (Spade)**

```spade
entity ripple<#uint N>(clk: clock) -> uint<N> {
    gen if N == 0 {
        0
    } else {
        reg(clk) q: bool initial(false) = !q;
        let hi: uint<{N - 1}> = inst ripple::<{N - 1}>(unsafe { (!q).as_clock() });
        hi.concat(q.as_uint())
    }
}
```

`q` is one stage's flip-flop and `= !q` is the $T{=}1$ tie; the recursion is the chain, one stage per level, terminated by `gen if N == 0` at the empty `uint<0>`. `unsafe { (!q).as_clock() }` is the wire that leaves stage $i$ and enters stage $i+1$'s clock port in the diagram — Spade's registers are rising-edge, so the inversion supplies the bubble and makes the chain count **up**; drop the `!` and the same code counts down. `hi.concat(q.as_uint())` places `q` in the low bit, since integer `concat` puts its left operand high, so $Q_0$ is the LSB as drawn. Note what the entity does *not* have: no reset port, no enable, no combinational logic, and — uniquely among the counters here — **more than one clock domain inside one entity**. Synthesis will not reproduce the drawing's tidy local wires: it must promote each $Q_i$ onto a clock network, which is the FPGA objection above appearing as a placement problem rather than a logic one.

**Related Notes**

- [[Synchronous Counters]] – compares: the same count with one clock and an explicit carry chain; valid word in $t_{cq}$ instead of $n\,t_{cq}$, at the cost of the clock tree and the increment logic.
- [[Incrementer]] – counter-example: the toggle condition $\prod_{j<i}q_j$ realised in gates, which is exactly the logic this circuit deletes by realising it in time.
- [[Introduction to Flip-Flops & Latches]] – depends-on: $t_{cq}$, $t_{su}$, and the divide-by-two behaviour of a T flip-flop, which are the only primitives the analysis uses.
- [[Two-Stage Prescaled Counter]] – extends: a short ripple prescaler in front of a synchronous counter, keeping the toggle rate without exposing a rippling word.
- [[Asynchronous Sequential Logic]] – supports: the general framing for circuits whose state advances on events rather than on a common clock, and the hazards that follow.
- [[Modulo-N Counter]] – counter-example: every construction there decodes or compares the state word, which is the one thing this chain cannot survive.
- [[Choosing a Counter]] – compares: where the ripple row sits against every sibling.

## References

- [[2.8) Counters]] — §Asynchronous (ripple) counters (the $(i+1)\,t_{cq}$ settling bound, the $011\to100$ transient walk and the decoded glitch, the clock-power and prescaler arguments) and §Trade-offs (the "Async ripple" row: $f_{\max}$ set by one flop, no combinational depth, one flop at $f$).

> [!warning] No sourced silicon numbers
> The long-form note carries the same flag and it applies here unchanged. $t_{cq}$, $t_{su}$, gate delays, LUT and slice counts, clock-tree power and the number of global clock buffers on a given device are all process- and fabric-dependent and must come from a datasheet or from synthesis. The $16$-bit, $120\,\text{ps}$ figure is a worked illustration carried over from the long-form note, not a measurement.

- Mano & Ciletti, *Digital Design* — registers and counters chapter; ripple counters, the ripple-vs-synchronous comparison, unused-state and reset analysis.
- Wakerly, *Digital Design: Principles and Practices* — sequential building blocks; ripple counters and the reasons synchronous designs displaced them, decoding glitches.
- Weste & Harris, *CMOS VLSI Design* — datapath and clocking subsystems; the clock-power argument for dividers and the generated-clock consequences of a ripple chain.
