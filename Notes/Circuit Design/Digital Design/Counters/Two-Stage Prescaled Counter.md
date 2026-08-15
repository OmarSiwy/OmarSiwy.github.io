---
title: "Two-Stage Prescaled Counter"
description: "Fast k-bit low half gates a slow (n-k)-bit high half, so the long carry chain gets 2^k periods to settle and f_max is set by the small slice alone."
kind: circuit
source: "2.8) Counters §Synchronous counters, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, sequential, timing, multicycle, fpga]
aliases:
  - Prescaled Counter
  - Two-Stage Counter
  - Prescaled Binary Counter
  - Prescaler Counter
---

# Two-Stage Prescaled Counter

A synchronous binary counter split at bit $k$ into a fast low half that counts on every enabled edge and a slow high half whose *register enable* — not whose carry-in — is the low half's terminal count, which turns the wide carry chain into a $2^{k}$-cycle multicycle path while leaving the count bit-for-bit identical to a flat one.

```tikz title="Two-stage prescaled counter: the low half's terminal count gates the high half's enable, not its clock and not its carry-in"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  % --- low (fast) half ---
  \draw (0,1.6) rectangle (2.6,3.4);
  \node at (1.3,2.8) {LOW};
  \node at (1.3,2.2) {$k$-bit count};

  % --- AND gate gating the high half ---
  \node[and port, scale=0.8] (A) at (5.2,2.2) {};

  % --- high (slow) half ---
  \draw (6.8,1.6) rectangle (10.0,3.4);
  \node at (8.4,2.8) {HIGH};
  \node at (8.4,2.2) {$(n{-}k)$-bit count};

  % EN into the low half, branched under the boxes into the gate
  \draw[->] (-2.6,3.0) -- (0,3.0);
  \node[anchor=south] at (-1.7,3.02) {EN \, / \, $1$};
  \fill (-1.0,3.0) circle (1.4pt);
  \draw (-1.0,3.0) -- (-1.0,1.15) -- (4.3,1.15);
  \draw[->] (4.3,1.15) |- (A.in 2);

  % TC of the low half into the gate
  \draw[->] (2.6,2.42) -- (A.in 1);
  \node[anchor=south] at (3.3,2.48) {$\mathrm{TC}_{\text{lo}}$ \, / \, $1$};

  % gate output = high-half enable
  \draw[->] (A.out) -- (6.8,2.2);
  \node[anchor=south] at (6.25,2.24) {$\mathrm{EN}_{\text{hi}}$};

  % clk to both halves
  \draw[->] (-1.0,0.6) -- (1.3,0.6);
  \draw (1.3,0.6) -- (8.4,0.6);
  \draw[->] (1.3,0.6) -- (1.3,1.6);
  \draw[->] (8.4,0.6) -- (8.4,1.6);
  \node[anchor=east] at (-1.05,0.6) {clk};

  % outputs, concatenated
  \draw[->] (1.3,3.4) -- (1.3,4.4);
  \draw[->] (8.4,3.4) -- (8.4,4.4);
  \node[anchor=east] at (1.25,4.0) {$Q_{\text{lo}}$ \, / \, $k$};
  \node[anchor=east] at (8.35,4.0) {$Q_{\text{hi}}$ \, / \, $n{-}k$};
  \draw (1.3,4.4) -- (8.4,4.4);
  \draw[->] (4.85,4.4) -- (4.85,5.1);
  \node[anchor=south] at (4.85,5.12) {$Q=\{Q_{\text{hi}},Q_{\text{lo}}\}$ \, / \, $n$};

  % carry-out of the whole counter
  \draw[->] (10.0,3.0) -- (11.4,3.0);
  \node[anchor=south] at (10.7,3.02) {TC \, / \, $1$};

  % timing annotations, below the clock line
  \node[anchor=north,align=center] at (1.3,0.3)
    {\scriptsize sets $f_{\max}$:\\[-2pt] \scriptsize $t_{cq}+(k{-}1)t_{\mathrm{AND}}+t_{\mathrm{XOR}}+t_{su}$};
  \node[anchor=north,align=center] at (8.4,0.3)
    {\scriptsize $2^{k}\,T_{\mathrm{clk}}$ to settle,\\[-2pt] \scriptsize one enabled edge in $2^{k}$};
\end{circuitikz}
\end{document}
```

**Cut the toggle product at bit $k$ and read off what the two pieces are.** [[Synchronous Counters]] gives the whole state update as one AND-prefix: bit $i$ of an $n$-bit count toggles on $t_i=\text{EN}\cdot\prod_{j<i}q_j$, and $\text{TC}=\text{EN}\cdot\prod_{j<n}q_j$ is that prefix's last term. Fix a split $0<k<n$ and name the halves $Q_{\text{lo}}=q_{k-1}\dots q_0$ ($k$ bits) and $Q_{\text{hi}}=q_{n-1}\dots q_k$ ($n-k$ bits), so that $Q=Q_{\text{hi}}\cdot2^{k}+Q_{\text{lo}}$ by positional weight alone. Because AND is associative, the product defining $t_i$ for any $i\ge k$ may be bracketed at $j=k$:

$$t_i=\text{EN}\!\!\prod_{j<i}q_j=\Big(\text{EN}\!\!\prod_{j<k}q_j\Big)\cdot\!\!\prod_{k\le j<i}\!\!q_j=\text{TC}_{\text{lo}}\cdot\!\!\prod_{k\le j<i}\!\!q_j,\qquad \text{TC}_{\text{lo}}=\text{EN}\!\!\prod_{j<k}q_j$$

The left factor is 1 bit wide and is exactly the low half's own terminal count — already sitting at the top of its carry chain, so the split introduces no new logic. The right factor is precisely the toggle product of an $(n-k)$-bit counter over its own state bits. So the high half is an ordinary synchronous counter whose enable is $\text{TC}_{\text{lo}}$, and the identity above is exact: same gates, same state sequence, $Q^{+}=Q+1\bmod 2^{n}$ bit for bit, integer arithmetic at $0$ ulp with nothing from [[Error Accuracy]] in play.

**Pull the common factor out of the chain instead of pushing it through the chain.** The factorisation is only an accounting identity until you decide *where* $\text{TC}_{\text{lo}}$ enters the high half, and the two choices are not the same circuit. Distributing it inward makes $\text{TC}_{\text{lo}}$ the carry-in $c_k$ of the high half's AND chain, so the path $Q_{\text{lo}}\to\text{TC}_{\text{lo}}\to(n-k)\ \text{AND}\to\text{XOR}\to D$ must close in one period — that is slice cascading by carry, and its depth is $O(n)$ again ([[Cascaded Counter Chain]]). Pulling it outward uses $x\oplus0=x$: when $\text{TC}_{\text{lo}}=0$ every high-half toggle term is $0$ **simultaneously**, so $q_i^{+}=q_i$ for all $i\ge k$ at once, and one shared hold signal reproduces the whole word. The common factor therefore leaves the datapath entirely and lands on a register enable shared by $n-k$ flops:

$$q_i^{+}=q_i\oplus\Big(\text{TC}_{\text{lo}}\cdot t'_i\Big)\quad\Longrightarrow\quad D_i=q_i\oplus t'_i,\ \ \text{CE}=\text{TC}_{\text{lo}},\qquad t'_i=\!\!\prod_{k\le j<i}\!\!q_j$$

with $t'_i$ a function of $Q_{\text{hi}}$ alone. That last clause is the payload: nothing in the high half's combinational cone depends on the low half, so the cone's inputs change only when $Q_{\text{hi}}$ itself changes.

> [!important] The saving is a multicycle path, not fewer gates
> $Q_{\text{hi}}$ advances once per $2^{k}$ enabled edges, so its incrementer's output is stable for $2^{k}$ periods and the loop $Q_{\text{hi}}\to t'\to D$ is a multicycle path of depth $2^{k}$. Static timing does not know that. Without an explicit `set_multicycle_path` (setup *and* hold) on the increment, the tool times an $(n-k)$-bit chain against one period and either reports failure or buys the margin back in gate sizing and buffering — the drawing is unchanged and the benefit is entirely fictional. The two paths that remain single-cycle are the $k$-bit low chain and $\text{TC}_{\text{lo}}$ to the CE pins.

**Put numbers on both constraints and see which one binds.** From [[Introduction to Flip-Flops & Latches]] the same-edge closure is $T_{\text{clk}}\ge t_{cq}+t_{\text{logic}}+t_{su}+t_{\text{skew}}$. Applied to the two surviving paths and to the relaxed one:

$$
\begin{aligned}
\text{low half (1 cycle):}\quad & t_{cq}+(k-1)t_{\text{AND}}+t_{\text{XOR}}+t_{su}+t_{\text{skew}}\ \le\ T_{\text{clk}}\\
\text{enable to CE (1 cycle):}\quad & t_{cq}+(k-1)t_{\text{AND}}+t_{\text{AND}}+t_{su}+t_{\text{skew}}\ \le\ T_{\text{clk}}\\
\text{high half ($2^{k}$ cycles):}\quad & t_{cq}+(n-k-1)t_{\text{AND}}+t_{\text{XOR}}+t_{su}\ \le\ 2^{k}\,T_{\text{clk}}
\end{aligned}
$$

The first two are the same $k$-bit chain up to one gate, so $f_{\max}$ is a function of $k$ and of nothing else — the $n$ in the flat counter's bound has been replaced by $k$. The third is an *exponentially* slack lower bound on $k$: substituting the first line's rough equality $T_{\text{clk}}\approx k\,t_{\text{AND}}$ turns it into $n-k\lesssim k\,2^{k}$, so $k=8$ already licenses $n$ into the thousands. Both bounds therefore point the same way — **take the largest $k$ that still closes timing on the low half**, and the high half's budget is never the reason to stop.

**Count what the split actually costs, because it is close to nothing.** No extra flops: the $n$ bits are the same $n$ bits, merely partitioned. One AND2 to form $\text{EN}_{\text{hi}}=\text{EN}\wedge\text{TC}_{\text{lo}}$, and even that vanishes when $\text{TC}_{\text{lo}}$ is already defined with EN folded in, as the factorisation above defines it. Against the alternatives for the same $f_{\max}$: a [[Prefix Incrementer]] buys $O(\log n)$ depth by spending $O(n\log n)$ gates and a routing-heavy tree across all $n$ bits, and a pipelined counter costs latency and a wrong-value window on every read. Prescaling spends one gate and one timing exception. What it does not buy is depth for the *low* $k$ bits — those still carry a linear chain, which is why $k$ is chosen at the point where that chain just closes and not one bit higher.

**Map it to fabric, where the enable is already in the silicon.** On FPGA every slice flop has a `CE` port ([[FPGAs]], [[Lookup-Tables]]), so "put the common factor on the register enable" costs literally zero logic and zero levels — the structure the derivation asks for is the one the fabric was built for. The countervailing fact is that the hard carry chain (`CARRY4`/`CARRY8`, Intel ALM carry) is fast enough that a flat synchronous counter closes at fabric $f_{\max}$ to widths where a designer would not think to split, so the split earns its keep only on wide counters — cycle counters, performance monitors, long timers — or when the chain would have to span a column boundary and pick up general routing. On ASIC the per-bit AND is a real gate delay and the split appears far earlier. Two ASIC-only caveats: the CE net now fans out to $n-k$ flops and its buffer tree is a *single-cycle* path, so an over-large $k$ eventually trades chain delay for fan-out delay; and because the high half is idle $2^{k}-1$ cycles out of $2^{k}$, promoting that CE to an integrated clock gate converts the same signal into a clock-power saving of nearly the whole high half — often the better half of the reason to do this at all.

**Do not confuse this with gating the clock.** A ripple prescaler ([[Asynchronous Counters]]) reaches a superficially similar arrangement by clocking the high half *from* the low half's output, and it is a different circuit with different obligations: $\text{TC}_{\text{lo}}$ becomes a clock, needing clock-quality routing and appearing in static timing as its own generated clock domain, and the word $Q$ is no longer valid on a single edge. Enable-gating keeps one clock net and one domain, so $\{Q_{\text{hi}},Q_{\text{lo}}\}$ remains an exact synchronous binary count that any logic on `clk` may sample directly. The prescaled counter is a synchronous counter throughout; only its timing *constraints* are two-speed.

$$\boxed{\ q_i^{+}=q_i\oplus\big(\text{TC}_{\text{lo}}\cdot t'_i\big),\quad t'_i=\!\!\prod_{k\le j<i}\!\!q_j,\quad \text{TC}_{\text{lo}}=\text{EN}\!\!\prod_{j<k}q_j,\qquad T_{\text{clk}}\ \ge\ t_{cq}+(k-1)t_{\text{AND}}+t_{\text{XOR}}+t_{su}+t_{\text{skew}}\ }$$

**When it breaks**

- **The multicycle exception is not written.** Everything above collapses to a normal counter with an odd enable structure. This is the single failure mode, and it is a constraint-file failure that no amount of RTL review catches.
- **The enable is folded back into the carry-in.** Synthesis or a rewrite that computes $Q_{\text{hi}}+\text{TC}_{\text{lo}}$ instead of gating the capture is functionally identical and structurally fatal — the high half's cone now changes every cycle, the exception becomes false, and the depth is linear again. That is [[Cascaded Counter Chain]] by ripple enable, drawn the same way.
- **Something consumes the full $Q$ combinationally every cycle.** A full-width equality against a threshold ([[Comparators]], as in compare-and-clear [[Modulo-N Counter]]) re-imports the high bits into a single-cycle path and undoes the split from the outside. Prefer a terminal condition that is already a carry-out: [[Preload-and-Overflow Counter]] or [[Zero-Detect Down Counter]].
- **Synchronous load or clear writes both halves in one cycle.** That path is full-width and single-cycle by construction, so the exception must be scoped to the increment cone only, never to the register as a whole.
- **$k$ too small.** At $k=1$ the high half gets two periods; the exception is nearly worthless and the split is pure complexity. The structure pays only when $2^{k}T_{\text{clk}}$ comfortably exceeds the high half's chain delay, which in practice means $k\ge4$.
- **The low half is not modulo $2^{k}$.** If it is a mod-$M$ stage with $M\ne2^{k}$, the composite value is $Q_{\text{hi}}\cdot M+Q_{\text{lo}}$ — a mixed-radix number, not a binary count. The concatenation stops being the count and reading it requires a multiply, so non-power-of-two prescaling belongs only where the count is a deadline rather than a quantity.
- **Boundary polarity.** The high half must be enabled when $Q_{\text{lo}}$ is all ones, i.e. in the cycle *before* the wrap, not when $Q_{\text{lo}}=0$. Gating on zero counts correctly for exactly one cycle and then trails by $2^{k}$ forever.
- **It is no safer to sample from another clock domain.** The transition $\text{0x0FF}\to\text{0x100}$ still flips $k+1$ bits on one edge; the split is a timing decomposition and changes nothing about the encoding. [[Gray Counter]] remains the only fix.

**RTL (Spade)**

```spade
/// Two-stage prescaled counter. A K-bit low half counts every enabled cycle;
/// the H-bit high half sees the low half's terminal count on its register
/// enable, so its own carry chain is a 2^K-cycle multicycle path.
entity prescaled<#uint K, #uint H>(clk: clock, rst: bool, en: bool)
    -> (uint<{H + K}>, bool)
{
    decl hi_inc;
    reg(clk) lo: uint<K> reset(rst: 0) = if en { trunc(lo + 1) } else { lo };
    let tc_lo = en && lo.as_bits().reduce_and();
    reg(clk) hi: uint<H> reset(rst: 0) = if tc_lo { trunc(hi_inc) } else { hi };
    let hi_inc: uint<{H + 1}> = hi + 1;
    (hi.concat(lo), tc_lo && hi_inc.msb())
}
```

`lo` and `hi` are the two boxes; `tc_lo` is the wire out of the AND gate, and it appears **only** as the condition of `hi`'s hold-or-load, never inside `hi_inc` — that separation is the whole note, and writing `hi + zext(tc_lo)` instead would be the same arithmetic with the multicycle property destroyed. `lo + 1` and `hi + 1` widen to $K+1$ and $H+1$ bits by the growth rule, so `hi_inc.msb()` is the high half's carry-out read straight off the chain and `trunc` performs the specified $\bmod\,2^{n}$ wrap; the overall TC is that carry-out ANDed with `tc_lo`, which is all $n$ bits high and EN together. `hi.concat(lo)` places `hi` in the high positions — integer `concat` puts its first argument high, the opposite of the array convention — giving the $n=H+K$ bit count of the top bus in the drawing. Synthesis will not keep the two `+1`s apart from anything else on FPGA: both map onto the hard carry chain and `en`/`tc_lo` onto the slice flops' `CE` ports, which is the fabric spelling of exactly the factorisation derived above.

**Related Notes**

- [[Synchronous Counters]] – depends-on: supplies the AND-prefix $t_i=\text{EN}\prod_{j<i}q_j$ that this note factors at bit $k$.
- [[Cascaded Counter Chain]] – counter-example: the same $\text{TC}\to$ next-slice wire, routed into the carry-in instead of the enable, which restores the linear depth this structure removes.
- [[Prefix Incrementer]] – compares: the other escape from $O(n)$ depth, buying $O(\log n)$ for all $n$ bits with $O(n\log n)$ gates rather than one gate and a timing exception.
- [[Incrementer]] – depends-on: the half-adder collapse that makes the toggle term an AND-prefix in the first place.
- [[Asynchronous Counters]] – compares: reaches a two-speed counter by gating the clock rather than the enable, and pays for it with a second clock domain.
- [[Introduction to Flip-Flops & Latches]] – depends-on: the setup constraint that both the one-cycle and the $2^{k}$-cycle budgets are instances of.
- [[Modulo-N Counter]] – counter-example: a full-width compare re-imports the high bits into the single-cycle path.
- [[Gray Counter]] – compares: fixes the encoding problem this structure explicitly does not touch.
- [[Up-Down Counter]] – extends: the down direction gates on $Q_{\text{lo}}$ all-zeros instead of all-ones, and the multicycle structure survives unchanged.
- [[Choosing a Counter]] – compares: where this sits against every sibling structure.
- [[FPGAs]] – supports: the `CE` port that makes the extracted common factor free on fabric.

## References

- [[2.8) Counters]] — §Synchronous counters (the $T_{\text{clk}}$ constraint, the enable-chaining alternatives, the two-stage decomposition paragraph), §Trade-offs (the two-stage row: $f_{\max}$ set by the $k$-bit slice, $n$ flops, $O(k)$ combinational depth).
- No textbook source for this topic. Standard treatments: Wakerly, *Digital Design: Principles and Practices* — slice cascading and the `ENP`/`ENT` enable structure this note contrasts with; Mano & Ciletti, *Digital Design* — synchronous counters with parallel load and enable; Weste & Harris, *CMOS VLSI Design* — incrementers as degenerate adders, and the clock-gating argument behind the idle high half. Page numbers are deliberately omitted; no copy was consulted while writing.
