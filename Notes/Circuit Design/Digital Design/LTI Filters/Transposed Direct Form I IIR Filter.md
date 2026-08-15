---
title: Transposed Direct Form I IIR Filter
description: "Direct form I with every wire reversed, so its building block is an MCM rather than an SOPC; same delay count, shorter adder chain, different rounding behaviour."
kind: circuit
source: "ASA §23.1.5.2, pp. 678-679; §23.1.6, p. 681; §23.3, pp. 690-694"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, transposition, mcm]
aliases:
  - Transposed Direct Form I
  - Transposed direct form I
  - Transposed DF-I
  - TDF-I
---

# Transposed Direct Form I IIR Filter

The signal-flow reversal of [[Direct Form I IIR Filter]]: the same $n+m$ delays, but a single broadcast node feeding one multiple-constant multiplication, so the combinational depth is two adders and one multiplier regardless of filter order.

```tikz title="Transposed direct form I, order 2: one broadcast node w(k), one MCM by all five constants, two independent delay-and-add chains"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- broadcast node w(k): one wire, five constant multipliers ----
  \draw[->] (0.6,0.25) -- (0.6,2.25);
  \draw (0.6,2.25) -- (9.0,2.25);
  \node[anchor=south, font=\tiny] at (1.6,2.32) {$w(k)$};
  \node[anchor=south, font=\tiny] at (5.4,2.32) {sfix$(m',\ell_{\text{ext}})$};

  % ---- constant multipliers (apex down) ----
  \foreach \x/\lbl in {2.6/$-a_1$, 4.3/$-a_2$, 5.8/$b_2$, 7.4/$b_1$, 9.0/$b_0$} {
    \draw[->] (\x,2.25) -- (\x,1.5);
    \draw[fill=black!4] (\x-0.42,1.5) -- (\x+0.42,1.5) -- (\x,0.85) -- cycle;
    \node[font=\tiny] at (\x,1.28) {\lbl};
  }

  % ---- left half: transposed all-pole section, chain runs right to left ----
  \draw[->] (-1.5,0) -- (0.38,0);
  \node[anchor=south, font=\tiny] at (-0.7,0.08) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-0.7,-0.08) {sfix$(0,\ell)$};

  \draw (0.6,0) circle (0.22); \node[font=\small] at (0.6,0) {$+$};
  \draw (2.6,0) circle (0.22); \node[font=\small] at (2.6,0) {$+$};

  \draw[fill=black!8] (1.45,-0.3) rectangle (1.75,0.3);
  \draw[fill=black!8] (3.45,-0.3) rectangle (3.75,0.3);
  \node[anchor=north, font=\tiny] at (1.6,-0.36) {$t_1(k{-}1)$};
  \node[anchor=north, font=\tiny] at (3.6,-0.36) {$t_2(k{-}1)$};

  \draw[->] (1.45,0) -- (0.82,0);
  \draw[->] (2.38,0) -- (1.75,0);
  \draw[->] (3.45,0) -- (2.82,0);
  \draw[->] (4.3,0.85) -- (4.3,0) -- (3.75,0);

  \draw[->] (2.6,0.85) -- (2.6,0.22);

  % ---- right half: transposed all-zero section, chain runs left to right ----
  \draw[fill=black!8] (6.35,-0.3) rectangle (6.65,0.3);
  \draw[fill=black!8] (8.15,-0.3) rectangle (8.45,0.3);
  \node[anchor=north, font=\tiny] at (6.5,-0.36) {$v_2(k{-}1)$};
  \node[anchor=north, font=\tiny] at (8.3,-0.36) {$v_1(k{-}1)$};

  \draw (7.4,0) circle (0.22); \node[font=\small] at (7.4,0) {$+$};
  \draw (9.0,0) circle (0.22); \node[font=\small] at (9.0,0) {$+$};

  \draw[->] (5.8,0.85) -- (5.8,0) -- (6.35,0);
  \draw[->] (6.65,0) -- (7.18,0);
  \draw[->] (7.62,0) -- (8.15,0);
  \draw[->] (8.45,0) -- (8.78,0);
  \draw[->] (7.4,0.85) -- (7.4,0.22);
  \draw[->] (9.0,0.85) -- (9.0,0.22);

  % ---- final rounding to the output format ----
  \draw[->] (9.22,0) -- (10.05,0);
  \node[anchor=south, font=\tiny] at (9.63,0.06) {$\widetilde{y}(k)$};
  \draw (10.05,-0.32) rectangle (11.55,0.32);
  \node[font=\tiny] at (10.8,0) {final round};
  \draw[->] (11.55,0) -- (13.15,0);
  \node[anchor=south, font=\tiny] at (12.35,0.10) {$\widetilde{y}_{\text{out}}(k)$};
  \node[anchor=north, font=\tiny] at (12.35,-0.10) {sfix$(m',\ell')$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.9b, p. 679, with the formats of Fig. 23.17, p. 690.*

**Apply the transposition theorem, not algebra.** Any single-input single-output signal-flow graph may be *transposed*: reverse the direction of every wire, replace each fork by an adder and each adder by a fork, and swap the input and output terminals. The transfer function is invariant (p. 678; the book points to §12.5.3, p. 407 for the same operation on a constant-multiplication network). Nothing is re-derived from the difference equation — the graph of [[Direct Form I IIR Filter]] is turned around, and what comes out is a legal implementation of the same $H(z)$.

**Read the two halves off the reversed graph.** Direct form I is the cascade $N(z)$ then $1/D(z)$: the $b_i$ act on the input delay line, the $a_i$ close the loop around the result. Reversing a cascade reverses its order — $(\mathcal{A}\mathcal{B})^{\mathsf T}=\mathcal{B}^{\mathsf T}\mathcal{A}^{\mathsf T}$ — so the transposed structure runs the *recursive* half first. Its intermediate node is what the diagram calls $w(k)$, and the whole circuit realises

$$
w(k) = u(k) - \sum_{i=1}^{m} a_i\,w(k-i),
\qquad
\widetilde{y}(k) = \sum_{i=0}^{n} b_i\,w(k-i)
$$

without ever building a delay line of $w$. Each sum is accumulated backwards, one product per register: $t_m(k)=-a_m w(k)$, $t_i(k) = -a_i w(k) + t_{i+1}(k-1)$ for $1\le i<m$, and $w(k) = u(k) + t_1(k-1)$; symmetrically $v_n(k)=b_n w(k)$, $v_j(k) = b_j w(k) + v_{j+1}(k-1)$, and $\widetilde{y}(k) = b_0 w(k) + v_1(k-1)$. Substituting the $t_i$ backwards reproduces the first recurrence exactly, by nothing but associativity of addition and the fact that a delay of a delayed signal is a delay by two.

**Forks become adders, so an SOPC becomes an MCM.** In direct form I every constant multiplier sees a *different* signal — $b_i$ sees $u(k-i)$ — and their products meet at one summation node: a sum of products by constants ([[SOPC, Sum of Products by Constants]]). Transposition swaps exactly those two roles. Now one signal, $w(k)$, is forked to every constant multiplier, and the summation nodes have been pushed out into the delay chains as *structural adders* (p. 678). That is the definition of a [[Multiple Constant Multiplication]] instance. Because both halves are fed from the same $w(k)$, the whole filter is a **single** MCM over the constant set $\{b_0,\dots,b_n\}\cup\{-a_1,\dots,-a_m\}$ — the largest single MCM instance any of the four canonical structures offers, and therefore the one with the most subexpression sharing to find. The structural adders are not part of that problem and are counted separately (p. 678).

**The critical path stops depending on the order.** Trace the longest combinational route in the diagram: out of a register, through the one adder that produces $w(k)$, through one constant multiplier, into the adder that feeds the next register — one multiplier and two [[Adders]], for any $n$ and $m$. Compare direct form I, where the products of an $(n{+}m)$-term SOPC must all be summed before the result can be registered: one multiplier plus an adder chain (or tree) that grows with the order. The adder count is unchanged at $n+m$ and the register count is unchanged at $n+m$; only their interleaving differs, and that interleaving is the entire benefit. Against [[Transposed Direct Form II IIR Filter]] the comparison is one multiplier better — that structure's path runs $u\to b_0\to+\to y\to -a_1\to+$, two multipliers and two adders (p. 681).

**Every register moves into the extended format.** With input $u(k)$ in `sfix(0, ℓ)` — MSB at position $0$ because these filters are normalised to $\overline{u}=1$, LSB at $\ell$, so $1-\ell$ bits (p. 690) — the internal node carries `sfix(m', ℓ_ext)`, and every one of the $n+m$ registers holds either a $t_i$ or a $v_j$, both of which are sums of products of $w(k)$ and therefore live in that same wide format. Direct form I keeps its $n$ input-side registers at the narrow $1-\ell$ bits and pays the wide format only on the $m$ output-side ones. Worse, the $b_i$ here multiply $w(k)$, not $u(k)$: this structure inherits precisely the drawback the book identifies for direct form II — a multiplier by $b_i$ fed from the loop signal is typically larger than one fed from $u(k)$ (p. 681) — *without* inheriting the register sharing that pays for it, because $t_i$ and $v_j$ are different signals and their two chains cannot be merged. Transposed direct form I buys latency, and it buys it with area.

> [!important] Transposition is exact over $\mathbb{R}$ and never over fixed point
> The theorem preserves the transfer function of an *abstract* filter structure, whose wires carry real numbers (p. 677). A hardware filter has no transfer function at all — rounding is nonlinear, so the set $\mathcal{L}\cap\mathcal{C}$ of implementations that are still LTI is nearly empty (p. 687). Two structures that are transposes of each other therefore agree bit for bit only while the datapath is exact; add one rounding and they are different circuits with different error behaviour, which is why the structure has to be chosen on an arithmetic argument and not a graph-theoretic one. Ground the formats in [[Number Formats]] and the error notion in [[Error Accuracy]].

**The guard-bit count is unchanged; the quantity it has to cover is not.** The feedback amplification of any recursive structure is governed by the error filter $\mathcal{H}_\delta(z) = 1/(1 + \sum_{i=1}^{m} a_i z^{-i})$ — the original filter with its numerator deleted (23.33, p. 693) — so it depends only on the $a_i$ and is the same for all four structures. Its worst-case peak gain fixes the internal LSB at $\ell_{\text{ext}} = \ell' - 1 - \lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$ (23.37, p. 694): one guard bit for the final round-to-nearest, the rest paid to the loop. But here the loop closes around $w$, not around $\widetilde{y}$, so an error injected into the loop is filtered by the numerator on its way out. Applying the WCPG theorem (23.23, p. 690) to that cascade gives

$$\overline{\delta}_{\text{t}} \;\le\; \Big(\textstyle\sum_{i}|b_i|\Big)\,\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\;\overline{\delta}_{\text{loop}} \;+\; \overline{\delta}_{\text{fwd}}$$

and $\left(\sum_i|b_i|\right)\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle \ge \langle\!\langle\mathcal{H}\rangle\!\rangle$, strictly whenever zeros partially cancel poles. Direct form I, whose loop closes around the output itself, gets the tighter constant — the arithmetic advantage that the transposition theorem is blind to.

> [!warning] Not covered in the source — needs outside research
> Chapter 23 carries the error analysis (23.29)–(23.37) through **only** for the direct form of Fig. 23.17, saying of everything else merely that "the techniques presented there can be used for other types of implementations" (p. 690). The cascade bound above is a consequence of the book's own WCPG theorem, but the book neither states it nor gives a faithful $\ell_{\text{ext}}$ formula for the transposed forms, and its trade-off table has no row for transposed direct form I at all. Treat that constant as a bound to be recomputed for the actual coefficients, not as a published result.

**On FPGA the area penalty is smaller than the gate count suggests.** Every LUT in the fabric already carries a flip-flop, so the $n+m$ wide registers this structure refuses to share often ride free in slices the MCM's adders occupy anyway, and the structural adders map onto the hard carry chain. That inverts part of the ASIC argument — see [[FPGAs]].

$$\boxed{\;
w(k) = u(k) + t_1(k{-}1),\quad t_i(k) = -a_i\,w(k) + t_{i+1}(k{-}1),\quad
\widetilde{y}(k) = b_0\,w(k) + v_1(k{-}1),\quad v_j(k) = b_j\,w(k) + v_{j+1}(k{-}1)
\;}$$

with $t_{m+1}\equiv v_{n+1}\equiv 0$: $n+m$ registers, $n+m$ adders, one MCM by $n+m+1$ constants, and a critical path of one multiplier and two adders independent of $n$ and $m$.

**When it breaks.**

- **Poles near the unit circle.** $w$ is the state of the all-pole section alone, so its dynamic range is set by $\langle\!\langle 1/D\rangle\!\rangle$, not by $\langle\!\langle\mathcal{H}\rangle\!\rangle$. Size $m'$ from the wrong one and the internal wraparound that (23.24) declares harmless stops being harmless — the classical direct-form-II overflow trap, inherited whole.
- **Low order.** At $n=m=2$ direct form I's adder chain is only four deep, so the path saving is worth little. It pays at high order — and at high order you should be cascading second-order sections instead, so [[Biquad Cascade]] takes over before this structure's advantage matters.
- **Narrow multipliers were the point.** If the $b_i$ multiplying a loop-width signal is what dominates area, this structure is strictly worse than [[Transposed Direct Form II IIR Filter]], which multiplies them by $u(k)$ *and* shares registers.
- **All $a_i = 0$.** The left half vanishes, $w(k)=u(k)$, and the circuit degenerates exactly into [[Transposed Direct-Form FIR Filter]] — including its unconditional stability, since then $\mathcal{H}_\delta(z)=1$ and no guard bits are owed at all.

**RTL (Spade).**

```spade
// Transposed direct form I, order 2.  b = (3, -5, 2), a = (-1, 1).
entity tdf1_o2(clk: clock, rst: bool, u: int<16>) -> int<32> {
    decl t1;
    decl t2;
    decl v1;
    decl v2;

    reg(clk) t1r: int<32> reset(rst: 0) = t1;
    reg(clk) t2r: int<32> reset(rst: 0) = t2;
    reg(clk) v2r: int<32> reset(rst: 0) = v2;
    reg(clk) v1r: int<32> reset(rst: 0) = v1;

    // A0 -- the one adder between a register and the broadcast node w(k)
    let uw: int<32> = sext(u);
    let w: int<32> = uw +. t1r;

    // recursive MCM of w(k) by {-a1, -a2}, into delayed structural adders
    let t1: int<32> = w +. t2r;
    let t2: int<32> = -w;

    // non-recursive MCM of the same w(k) by {b0, b1, b2}
    let v2: int<32> = w *. 2;
    let v1: int<32> = (w *. -5) +. v2r;

    (w *. 3) +. v1r
}
```

`w` is the top wire of the diagram and the only fan-out node; the four `reg`s are the four shaded boxes, `t1r`/`t2r` the recursive chain and `v1r`/`v2r` the structural one. The input is sign-extended once from $1-\ell = 16$ bits into the internal `sfix(m', ℓ_ext)` format, modelled here as `int<32>`, and every operator is a truncating one (`+.`, `*.`) so that format never grows — the modulo-$2^{m'}$ wraparound of p. 691 made explicit rather than accidental. The route from `t1r` through `+.` to `w`, through one `*.`, and into the next register is the two-adder-one-multiplier critical path. Synthesis will not build the five multipliers written here but one shared network of shifts and adders, which is the whole point of the structure and the one place the drawing and the netlist part company.

**Related Notes.**

- [[Direct Form I IIR Filter]] – extends: this is that graph with every wire reversed, and the only structure it is defined relative to.
- [[Transposed Direct Form II IIR Filter]] – compares: shares registers and keeps the $b_i$ on the narrow $u(k)$, at one extra multiplier of critical path.
- [[Direct Form II IIR Filter]] – compares: reaches the same wide-$b_i$ datapath by commuting the halves rather than by reversing them, and gets register sharing for it.
- [[Transposed Direct-Form FIR Filter]] – depends-on: the $a_i=0$ degeneration of this structure, with the recursive half deleted.
- [[Multiple Constant Multiplication]] – supports: transposition is what turns the constant multipliers into one MCM instance, and MCM is what makes it affordable.
- [[SOPC, Sum of Products by Constants]] – counter-example: the block this structure specifically does *not* contain, and out of which direct form I is built.
- [[Choosing a Filter Structure]] – compares: where this sits in the four-way trade-off at equal guaranteed accuracy.
- [[Biquad Cascade]] – counter-example: at the order where this structure's path advantage matters, factoring into second-order sections beats every direct form.
- [[Adders]] – depends-on: the structural adders in both chains, whose carry propagation sets the two-adder path.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:
  - §23.1.5.1 "Non-recursive filters", pp. 677–678 — transposition of Fig. 23.7 into Fig. 23.8; structural adders.
  - §23.1.5.2 "Recursive filters", pp. 678–679 — Fig. 23.9b; "the building block of the transposed direct form I is an MCM".
  - §23.1.6 "Abstract filter structures versus finite-precision circuits", p. 681 — why a $b_i$ fed from the loop signal is the larger multiplier.
  - §23.2, p. 690 — worst-case peak gain, (23.23).
  - §23.3.2 "Interface considerations", pp. 690–691 — `sfix(0, ℓ)`, `sfix(m', ℓ')`, modulo-$2^{m'}$ internal overflow, (23.24).
  - §23.3.4–23.3.5, pp. 693–694 — error filter $\mathcal{H}_\delta$ (23.33) and the guard-bit count (23.37).
- Long-form note: [[6.1) LTI Filters]], §"Specifying LTI filters by constant-coefficient equations" and §"Trade-offs".
