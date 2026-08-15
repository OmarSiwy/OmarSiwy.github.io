---
title: "Modulo-N Counter"
description: "Compare-and-clear: an equality match on N-1 drives a synchronous clear — costs a comparator in series with the increment, but the clear port is free on FPGA and Q runs 0..N-1 upward for addressing."
kind: circuit
source: "2.8) Counters §Modulo-N counters, §FPGA mapping — no book source"
status: seed
spade: simulated
tags: [digital, counters, modulo, comparator, fpga]
aliases:
  - Mod-N Counter
  - Modulo-N Counters
  - Divide-by-N Counter
  - Compare-and-Clear Counter
  - Terminal Count Counter
---

# Modulo-N Counter

A binary up-counter whose natural wrap at $2^n$ is overridden by an equality match on $N-1$ that synchronously clears the register, so the state runs $0,1,\dots,N-1$ upward for an arbitrary $N$ rather than a power of two.

```tikz title="Compare-and-clear modulo-N counter: equality match on N-1 steers the register back to zero"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- datapath blocks ---
  \draw (0,1.2) rectangle (1.4,2.8);   \node at (0.7,2.0) {2:1};
  \draw (3.0,1.2) rectangle (4.6,2.8); \node at (3.8,2.0) {REG};
  \draw (6.8,1.2) rectangle (8.6,2.8); \node at (7.7,2.0) {$+1$};
  \draw (4.4,-1.8) rectangle (6.8,-0.6); \node at (5.6,-1.2) {$Q = N-1$};

  % constant 0 into the clear leg of the mux
  \draw[->] (-2.6,1.6) -- (0,1.6);
  \node[above] at (-1.7,1.6) {$0$ \, / \, $n$};

  % mux -> register
  \draw[->] (1.4,2.0) -- (3.0,2.0);
  \node[above] at (2.2,2.0) {$n$};

  % register -> incrementer, with the tap that feeds the comparator
  \draw[->] (4.6,2.0) -- (6.8,2.0);
  \node[above] at (5.9,2.05) {$Q$ \, / \, $n$};
  \fill (5.2,2.0) circle (1.5pt);
  \draw[->] (5.2,2.0) -- (5.2,-0.6);

  % incrementer -> feedback into the mux
  \draw[->] (8.6,2.0) -- (10.0,2.0) -- (10.0,4.0) -- (-1.4,4.0) -- (-1.4,2.4) -- (0,2.4);
  \node[above] at (4.1,4.0) {$Q+1 \bmod 2^{n}$ \, / \, $n$};

  % comparator -> TC out, and back to the mux select
  \draw[->] (6.8,-1.2) -- (10.8,-1.2);
  \node[above] at (9.8,-1.2) {TC \, / \, $1$};
  \fill (8.8,-1.2) circle (1.5pt);
  \draw[->] (8.8,-1.2) -- (8.8,-3.0) -- (0.7,-3.0) -- (0.7,1.2);
  \node[above] at (4.0,-3.0) {sync clear \, / \, $1$};

  % control inputs
  \draw[->] (3.8,0.4) -- (3.8,1.2);  \node[below] at (3.8,0.4) {clk};
  \draw[->] (7.7,0.4) -- (7.7,1.2);  \node[below] at (7.7,0.4) {EN $=c_0$};

\end{circuitikz}
\end{document}
```

**Fix the state space before touching the logic.** The register is $n=\lceil\log_2 N\rceil$ bits and the intended cycle is the $N$ residues $\{0,\dots,N-1\}$; `EN` and the terminal count `TC` are 1 bit each. The incrementer's own modulus is $2^n$, and $2^n \ge N$ with equality only when $N$ is a power of two, so for every other $N$ there are $2^n - N$ states the intended cycle never visits — a fact that costs nothing yet and decides the reset argument at the end of this note. None of the rounding machinery applies: this is exact integer arithmetic on $\mathbb{Z}_N$ ([[Number Formats]]), and the wrap is the specification rather than an error.

**Only one transition is wrong, so only one transition needs overriding.** The binary counter of [[Synchronous Counters]] realises $Q^{+} = Q+1 \bmod 2^n$. Restricted to $Q \in \{0,\dots,N-2\}$ that map already agrees with $Q+1 \bmod N$, because on that range both sides are the ordinary integer $Q+1$ and no reduction fires in either modulus. The two maps differ at exactly one point, $Q = N-1$, where $\bmod N$ demands $0$ and $\bmod 2^n$ delivers $N$. A modulo-$N$ counter is therefore a plain counter plus a single-point patch,

$$Q^{+} \;=\; \begin{cases} 0 & Q = N-1\\ Q+1 & \text{otherwise}\end{cases}$$

and the whole design problem collapses to *detecting one value*. This is why the structure is called compare-and-clear rather than modular reduction: there is no reduction, no conditional subtraction of $N$, and no [[Adders|adder]] anywhere beyond the increment already present.

**The equality test degenerates to a bare AND of the set bits of $N-1$.** A general equality comparator against a constant $K$ is the AND of $n$ literals, one per bit, complemented where $K_i = 0$ ([[Comparators]]):

$$\text{eq}(Q,K)=\bigwedge_{i:\,K_i=1} q_i \;\wedge\; \bigwedge_{i:\,K_i=0} \bar{q_i}$$

Drop the second product. Take $K=N-1$ and suppose the first product holds — $Q$ carries a 1 in every position where $N-1$ does. Then $Q \supseteq N-1$ as bit sets, and since adding set bits only adds weight, $Q \ge N-1$. The reachable state space satisfies $Q \le N-1$ by the induction the clear itself enforces, so $Q = N-1$. The complemented half of the comparator is redundant *because of the invariant the comparator maintains* — a partial decode is exact here in a way it would not be for a general magnitude test. The match therefore costs $\operatorname{popcount}(N-1)$ AND inputs and **no inverters**: mod-10 needs $q_3 q_0$, two inputs rather than four, and mod-16 needs the empty product, which is the power-of-two case reappearing as no comparator at all.

**Where the comparator lands in the loop depends entirely on how the clear is applied.** Build it as a data mux in front of the register — the drawing above — and the loop is

$$T_{\text{clk}} \ \ge\ t_{cq} \;+\; \max\!\big(t_{\text{inc}},\; t_{\text{cmp}}\big) \;+\; t_{\text{mux}} \;+\; t_{su}$$

The comparator is *combinationally parallel* to the incrementer, both fed from the same $Q$, so it lengthens the period only if $t_{\text{cmp}} > t_{\text{inc}}$ — and $t_{\text{inc}}$ is an $n$-stage carry chain while $t_{\text{cmp}}$ is one wide AND, so for any width worth building the compare hides completely. What the structure does cost unconditionally is $t_{\text{mux}}$: one multiplexer level inside a loop that a free-running counter does not have at all. That mux, not the compare, is the real price, and it is what "in series with the increment" actually names.

**On FPGA both the mux and the compare vanish.** Every slice flop already carries a synchronous set/reset port, so driving `SR` with the match uses hardware that is otherwise idle: no LUT, no extra logic level, and the register's D input stays wired straight to the carry chain ([[FPGAs]]). The match itself folds into a 6-LUT that is already computing a toggle term, since $\operatorname{popcount}(N-1) \le n$ inputs and the LUT is wide ([[Lookup-Tables]]). Net cost of an FPGA mod-$N$ counter over a mod-$2^n$ counter: nothing measurable. On ASIC the mux is real — a synchronous-clear flop is a larger cell than a plain D flop, and clear-plus-enable usually resolves to two mux levels in front of the D pin — which is exactly the asymmetry that makes [[Preload-and-Overflow Counter]] and [[Zero-Detect Down Counter]] the better ASIC answers and leaves this one the FPGA answer.

**Take the asynchronous clear only when you have no choice.** It is also free at the flop, but it enlists the counter into the global reset network, replaces a setup check with a recovery/removal check against the clock, and — the failure that actually bites — deasserts asynchronously, so the width of the cleared state is set by routing delay rather than by the clock. Deassertion skew across a wide counter can leave the register holding neither $N-1$ nor $0$ for part of a cycle. A synchronous clear has none of these properties because it is a data path into the flop, timed like any other.

$$\boxed{\ Q^{+} = \begin{cases} 0 & \text{EN} \wedge (Q = N-1)\\ Q+1 \bmod 2^{n} & \text{EN} \wedge \overline{(Q = N-1)} \\ Q & \overline{\text{EN}}\end{cases}
\qquad \text{TC} = \text{EN} \wedge \!\!\bigwedge_{i:\,(N-1)_i=1}\!\! q_i \ }$$

**When it breaks**

- **The unused states are not self-healing by design, only by accident.** The $2^n - N$ states above $N-1$ are unreachable from the legal cycle but perfectly reachable from power-up, a single-event upset, or a partial reset. Landing in one, the next-state function keeps incrementing until it hits $2^n-1$ and wraps to $0$ — recovery, but only because the natural wrap happens to point back into the cycle, and only after up to $2^n-N$ wasted cycles. That argument fails the moment the increment is not $+1$, or the direction is controllable: a counter built on an [[Up-Down Counter]] can sit in a disjoint parasitic cycle forever. Either run the state-graph argument of [[Synchronous Sequential Logic]] explicitly, or spend the reset. Clearing on $Q \ge N-1$ instead of $Q = N-1$ buys back guaranteed one-step recovery at the price of a magnitude comparator.
- **The partial decode dies with the invariant.** Everything above rests on $Q \le N-1$. Add a load port, a preset, or an up/down control and the reachable set is no longer bounded above, so the AND of set bits stops implying equality and you owe the full $n$-literal comparator with its inverters back.
- **A runtime $N$ costs a real comparator.** If $N$ arrives on a port rather than as a synthesis-time constant, nothing constant-folds: the match becomes $n$ XNORs feeding an $n$-input AND ([[Equality Comparator]]), the popcount saving is gone, and $t_{\text{cmp}}$ can now genuinely exceed the increment. At that point [[Zero-Detect Down Counter]] wins outright, its terminal test being an $n$-input NOR whose cost is independent of $N$.
- **The count is not safe to send anywhere asynchronous.** Consecutive states differ in up to $n$ bits and the clear transition $N-1 \to 0$ flips $\operatorname{popcount}(N-1)$ of them at once. Crossing a domain needs [[Gray Counter]], which in turn needs an even modulus.
- **Once the increment is the critical path, stop patching here.** The comparator hides behind the carry chain, but the carry chain is itself $O(n)$; when it binds, the fix is in the incrementer ([[Prefix Incrementer]], [[Two-Stage Prescaled Counter]]), not in the compare. Factoring a large $N$ across stages is [[Cascaded Counter Chain]].

**RTL (Spade)**

```spade
/// Compare-and-clear modulo-N counter. M is the terminal count N-1.
entity mod_n<#uint W, #uint M>(clk: clock, rst: bool, en: bool) -> (uint<W>, bool) {
    decl q_next;
    reg(clk) q: uint<W> reset(rst: 0) = q_next;
    let tc: bool = en && (q == M);
    let q_next: uint<W> = if tc { 0 } else if en { trunc(q + 1) } else { q };
    (q, tc)
}
```

`q` is the REG block and `q_next` the mux output; `tc` is simultaneously the comparator output and the mux select, one signal driving both, which is the whole structure in one line. The modulus enters as the const generic `M` $=N-1$ rather than as a port precisely so `q == M` constant-folds into the partial decode derived above — a `uint<W>` port here would synthesise the full comparator instead. `q + 1` is `uint<{W+1}>`, so `trunc` performs the $\bmod\,2^n$ wrap explicitly, but that wrap is dead logic in a modulo-$N$ counter: `tc` intercepts the only state that could ever reach it. Synthesis will not build the drawn multiplexer — it recognises the constant-zero arm and maps `tc` onto the flop's synchronous reset port, so the FPGA saving above arrives as an inference rather than as something written.

**Related Notes**

- [[Synchronous Counters]] – extends: the mod-$2^n$ counter this patches at exactly one state transition.
- [[Equality Comparator]] – depends-on: the constant-match test, of which the AND-of-set-bits form here is the degenerate case.
- [[Preload-and-Overflow Counter]] – compares: takes the terminal condition free from the carry-out instead of buying a comparator, at the price of a load mux.
- [[Zero-Detect Down Counter]] – compares: terminal test independent of $N$, which is why it is the default for a runtime modulus.
- [[Incrementer]] – depends-on: the half-adder chain and the carry-out that becomes TC.
- [[Up-Down Counter]] – counter-example: a direction control breaks the $Q \le N-1$ invariant the partial decode rests on.
- [[Cascaded Counter Chain]] – extends: factoring a large $N$ across stages rather than into one wide comparator.
- [[Gray Counter]] – counter-example: this counter's clear transition is multi-bit, so it cannot cross a clock domain.
- [[Synchronous Sequential Logic]] – supports: the state-graph argument that decides whether the unused states are recoverable.
- [[Choosing a Counter]] – compares: where this sits against every sibling.

## References

- [[2.8) Counters]] — §Modulo-$N$ counters (the three constructions, and the unused-state warning) and §FPGA mapping (free `CE`/`SR` ports, LUT absorption of the control logic).
- No textbook source for this topic. Compare-and-clear counters are standard in Mano & Ciletti, *Digital Design* (BCD and mod-$N$ counters), Wakerly, *Digital Design: Principles and Practices* (counters and terminal-count decoding), and Weste & Harris, *CMOS VLSI Design* (counter datapaths and synchronous reset). Page numbers are deliberately omitted — no copy was consulted for this note.
