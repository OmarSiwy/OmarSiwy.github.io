---
title: "Transposed Direct-Form FIR Filter"
description: "Reverse every wire of the direct form: one multiple-constant multiplication of u(k) followed by delays and structural adders, cutting the critical path to one multiplier plus one adder at the cost of wider registers."
kind: circuit
source: "ASA §23.1.5.1, pp. 677-678; §23.1.6, p. 681"
status: seed
spade: simulated
tags: [digital, lti-filters, fir, mcm, transposition, retiming]
aliases:
  - Transposed FIR
  - Transposed FIR Filter
  - Transposed Direct Form FIR
  - Transposed Non-Recursive Filter
  - Transposed Direct-Form FIR
---

# Transposed Direct-Form FIR Filter

The signal-flow transpose of the direct-form FIR: every multiplication is fed by the *same* node $u(k)$, so the whole coefficient set collapses into one multiple-constant multiplication and the accumulation is spread across the delay line instead of down an adder chain.

```tikz title="Transposed direct-form FIR: one MCM of u(k) feeding a chain of registers and structural adders, with fixed-point formats on every wire"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % input
  \draw[->] (-1.9,3.0) -- (0.6,3.0);
  \node[anchor=south, font=\small] at (-1.5,3.06) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.2,2.94) {sfix$(0,\ell)$};

  % the single MCM block
  \draw[fill=black!4] (0.6,2.6) rectangle (7.6,3.55);
  \node[align=center, font=\tiny] at (4.1,3.08)
    {\textbf{MCM} --- one shared adder graph\\
     computing all four products of $u(k)$};

  % tap wires out of the MCM, down to the delay/adder chain
  \draw[->] (1.2,2.6) -- (1.2,1.42);
  \draw[->] (3.2,2.6) -- (3.2,1.42);
  \draw[->] (5.2,2.6) -- (5.2,1.42);
  \draw[->] (7.2,2.6) -- (7.2,1.42);
  \node[anchor=west, font=\tiny] at (1.28,2.30) {$b_3u(k)$};
  \node[anchor=west, font=\tiny] at (3.28,2.30) {$b_2u(k)$};
  \node[anchor=west, font=\tiny] at (5.28,2.30) {$b_1u(k)$};
  \node[anchor=west, font=\tiny] at (7.28,2.30) {$b_0u(k)$};
  \node[anchor=west, font=\tiny] at (1.28,1.90) {sfix$(m',\ell_{\text{ext}})$};

  % registers (structural delays) and structural adders
  \draw[fill=black!8] (2.05,0.92) rectangle (2.35,1.48);
  \draw[fill=black!8] (4.05,0.92) rectangle (4.35,1.48);
  \draw[fill=black!8] (6.05,0.92) rectangle (6.35,1.48);
  \draw (3.2,1.2) circle (0.22); \node at (3.2,1.2) {$+$};
  \draw (5.2,1.2) circle (0.22); \node at (5.2,1.2) {$+$};
  \draw (7.2,1.2) circle (0.22); \node at (7.2,1.2) {$+$};

  \draw[->] (1.2,1.2) -- (2.05,1.2);
  \draw[->] (2.35,1.2) -- (2.98,1.2);
  \draw[->] (3.42,1.2) -- (4.05,1.2);
  \draw[->] (4.35,1.2) -- (4.98,1.2);
  \draw[->] (5.42,1.2) -- (6.05,1.2);
  \draw[->] (6.35,1.2) -- (6.98,1.2);

  % state labels below the registers
  \node[anchor=north, font=\tiny] at (2.20,0.86) {$w_3(k)$};
  \node[anchor=north, font=\tiny] at (4.20,0.86) {$w_2(k)$};
  \node[anchor=north, font=\tiny] at (6.20,0.86) {$w_1(k)$};

  % output
  \draw[->] (7.42,1.2) -- (8.6,1.2);
  \node[anchor=south, font=\small] at (8.1,1.26) {$y(k)$};
  \node[anchor=north, font=\tiny] at (8.1,1.14) {sfix$(m',\ell_{\text{ext}})$};

  % annotations
  \node[anchor=west, font=\tiny] at (0.0,0.30)
    {$n=3$ registers, all at the internal width -- not at the input width};
  \node[anchor=west, font=\tiny] at (0.0,-0.05)
    {critical path: MCM $+$ one structural adder, independent of $n$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.8, p. 678, with the formats of Fig. 23.17, p. 690.*

**Transposition is a graph rewrite, not an algebraic one.** For any single-input single-output filter structure, reversing the direction of every wire, replacing each wire fork by an adder and each adder by a wire fork, and exchanging the input and output nodes, yields a structure with the same transfer function (p. 678; the same rewrite applied to constant-multiplier adder graphs is §12.5.3, p. 407). Gains and delays stay on the branches they were on. The reason it works is Mason's gain formula read backwards: for a structure with no loops — which every FIR structure is — the transfer function is the sum over all input-to-output paths of the product of the branch gains along the path. Reversing every edge is a bijection between paths of the original graph and paths of the transposed one, and multiplication of branch gains is commutative, so each path contributes the same term. The sums are equal term by term, hence $H(z)$ is unchanged.

**Applying it to the direct form moves every multiplier onto one node.** In the [[Direct-Form FIR Filter]] the input flows down a register chain and each tap $u(k-i)$ forks off into its own multiplier by $b_i$; the products then run down an adder chain. Transposing swaps those two roles. The $n$ forks of the register chain become $n$ adders, the $n$ adders of the accumulation chain become $n$ forks, and — the consequence that names the structure — every multiplier input now hangs off the single node $u(k)$. One value, $n+1$ constants: that is exactly the [[Multiple Constant Multiplication]] problem, so the coefficients are realised as one shared adder graph rather than $n+1$ independent multipliers. The book calls the $n$ adders left over in the delay chain **structural adders**, precisely to distinguish them from the adders *inside* the MCM (p. 678).

**Horner's rule turns the picture into a recurrence.** The transposed structure is what you get by factorising the transfer function repeatedly by $z^{-1}$:

$$H(z)=\sum_{i=0}^{n}b_iz^{-i}=b_0+z^{-1}\Bigl(b_1+z^{-1}\bigl(b_2+\cdots+z^{-1}b_n\bigr)\Bigr)$$

Each parenthesis is one register followed by one structural adder. Naming the value inside the $i$-th parenthesis $w_i$, the structure computes

$$w_n(k)=b_nu(k),\qquad w_i(k)=b_iu(k)+w_{i+1}(k-1)\ \ (1\le i<n),\qquad y(k)=b_0u(k)+w_1(k-1)$$

and a downward induction on $i$ confirms it is the convolution. Base case $w_n(k)=b_nu(k)$. Assuming $w_{i+1}(k)=\sum_{j=i+1}^{n}b_ju(k-(j-i-1))$, substitute $k-1$ for $k$ and add $b_iu(k)$:

$$w_i(k)=b_iu(k)+\sum_{j=i+1}^{n}b_ju\bigl(k-1-(j-i-1)\bigr)=\sum_{j=i}^{n}b_ju(k-(j-i))$$

by re-indexing the shift. At $i=0$ this is $y(k)=\sum_{j=0}^{n}b_ju(k-j)$, the difference equation (23.14). Note the coefficient order in the drawing: $b_n$ enters the chain first and $b_0$ last, because the deepest parenthesis is the one that gets delayed the most times.

**Every signal width changes, and that is the whole trade.** With the interface of [[LTI Filters]] — input `sfix(0, ℓ)`, so $1-\ell$ bits, and internal format `sfix(m', ℓ_ext)`, so $m'-\ell_{\text{ext}}+1$ bits — the direct form's $n$ registers hold delayed copies of $u$ and are $1-\ell$ bits wide. The transposed form's $n$ registers hold the partial sums $w_i$ and are $m'-\ell_{\text{ext}}+1$ bits wide. Nothing else about the register count moves: $n$ either way. Taking the numbers of the worked example in [[LTI Filters]] — 8-bit input, internal `sfix(1,-12)` — the transposed registers are 14 bits against 8, so the delay line costs $1.75\times$ more flip-flops for exactly the same $n$. See [[Number Formats]] for the `sfix` convention; the MCM outputs carry LSB $\ell+\ell_c$ exactly, where $\ell_c$ is the coefficient LSB, because multiplication by a finitely representable constant is exact.

**The critical path stops depending on $n$, and that is what you bought.** In the direct form the whole sum of products by constants sits between two register boundaries: one multiplier followed by $n$ chained adders, or, reassociating by associativity of addition, a tree of depth $\lceil\log_2(n+1)\rceil$. In the transposed form a register sits between every pair of structural adders, so the longest combinational path is the MCM followed by *one* structural adder, whatever $n$ is. The pipelining is free — it reuses registers the filter had to have anyway. Two honest qualifications. "One multiplier" means the depth of the MCM adder graph, and sharing intermediates in [[Multiple Constant Multiplication]] tends to *deepen* the graph while shrinking it, so the MCM is where the remaining depth lives, not in the adder. And the high fan-out node has moved: $u(k)$ now drives every leaf of the MCM at once, where in the direct form the load was spread down the register chain, so past some $n$ the buffer tree on $u(k)$ becomes the path that fails timing.

**FIR rounding is free of amplification, and here it can be free of error entirely.** All $a_i=0$, so the error filter of (23.33) is $\mathcal{H}_\delta(z)=1$ and its worst-case peak gain is $1$: a rounding error injected at cycle $k$ leaves at cycle $k$, with no loop to circulate in ([[LTI Filters]], (23.34)). Better than that, if the $b_i$ are representable at LSB $\ell_c$ and the internal format satisfies $\ell_{\text{ext}}\le\ell+\ell_c$, every MCM product is exact, every structural add is exact, and $\delta_{\text{r}}(k)=0$ identically — the case the book flags at p. 692. The entire error budget of [[Error Accuracy]] then goes to the final rounding, $\overline{\delta_{\text{total}}}=2^{\ell'-1}$, half an ulp, faithful with a full bit to spare. Overflow in the structural adders is harmless for the same reason it is in the direct form: fixed-point arithmetic is modulo $2^{m'}$ and the final result is still correct (p. 691).

> [!note] The transposition destroys the single bit heap
> A direct-form FIR is literally one bit heap: every partial product is a shifted copy of an input word, so the whole SOPC can be compressed once and carry-propagated once ([[Sums of Weighted Bits]]). Registers between the structural adders forbid that — you cannot compress across a clock boundary — so the transposed form pays $n$ genuine carry-propagate adders at internal width where the direct form pays one compressor tree plus one adder. That is the area invoice for the shorter critical path, and it is invisible in an adder-count model that counts an "adder" as a unit. The escape hatch is to keep the delay line in carry-save form and propagate only at the output, which restores the compression but doubles the register width — trading the flip-flops you were already paying too much for.

> [!warning] Not covered in the source — needs outside research
> Ch. 23 gives no FPGA mapping for either FIR form, and defers all constant-multiplication mapping to Ch. 12 (p. 697). The question that matters here — whether the DSP-block cascade path, whose registered accumulator chain is shaped like this structure, beats an MCM in LUTs for a given coefficient set — is not answered anywhere in the chapter. See [[FPGAs]] and [[Multiplication by Constants]].

$$\boxed{\ w_n(k)=b_nu(k),\quad w_i(k)=b_iu(k)+w_{i+1}(k-1),\quad y(k)=b_0u(k)+w_1(k-1)\ }$$

**When it breaks.**

- **Wide output, narrow input.** The register penalty is $\frac{m'-\ell_{\text{ext}}+1}{1-\ell}$. It is mild when the output format resembles the input one and brutal when the specification asks for many more output bits than input bits — which is the normal outcome of an exact FIR (p. 702).
- **Large $n$ with a cheap coefficient set.** If the $b_i$ share almost nothing, the MCM degenerates towards $n+1$ separate multipliers and the transposition has bought only the pipelining, at full register cost. The saving is real exactly to the extent that [[Multiple Constant Multiplication]] finds sharing.
- **The pre-adder trick is unavailable.** A [[Linear-Phase FIR Filter]] in direct form folds symmetric taps, $b_i\bigl(u(k-i)+u(k-n+i)\bigr)$, halving the multipliers at the price of one adder at *input* width. There is only one $u$ node here, so that fold has nothing to fold. The transposed form recovers the same saving differently — repeated constants are trivially shared inside the MCM, one product fanning out to two structural adders — but the two mechanisms cost different things and are not interchangeable.
- **Transposition is a theorem about linear graphs.** The instant a rounding node sits on a branch, the structure is no longer linear and the theorem no longer applies to the *circuit*, only to the ideal filter it approximates. The direct and transposed implementations of the same $b_i$ are equal in exact arithmetic and merely both faithful in hardware — they are not bit-identical, and their limit-cycle behaviour differs (§23.2, p. 687).
- **Retiming recovers part of this for free.** Synthesis with register retiming can push the direct form's output register back into its adder chain and get much of the same path reduction. What retiming cannot do is fuse $n+1$ independent multipliers into one shared adder graph, because that is a different netlist rather than a different register placement. Half of the win is a compile flag; the other half is a structural decision.
- **It does not generalise to the recursive case for free.** The feedback loop of an IIR filter sets an iteration bound that no transposition removes — see [[Transposed Direct Form I IIR Filter]], where transposing costs a critical path of two multipliers and two adders rather than removing one.

**RTL (Spade).** A 4-tap filter with the coefficients of the [[LTI Filters]] worked example quantised at $2^{-11}$: $b=(205,\,614,\,819,\,410)\cdot2^{-11}$, i.e. $(0.1,0.3,0.4,0.2)$ to eleven fractional bits.

```spade
// One MCM of u by (205, 614, 819, 410), sharing 205u across all four:
//   410 = 2*205,  819 = 4*205 - 1,  614 = 3*205 - 1
fn mcm(u: int<20>) -> (int<20>, int<20>, int<20>, int<20>) {
    let t5   = u   +. (u   << 2);        //   5u
    let t41  = (t5 << 3) +. u;           //  41u
    let t205 = (t41 << 2) +. t41;        // 205u
    (t205,                               // b0 = 205
     (t205 +. (t205 << 1)) -. u,         // b1 = 614
     (t205 << 2) -. u,                   // b2 = 819
     t205 << 1)                          // b3 = 410
}

entity tdf_fir4(clk: clock, rst: bool, u: int<8>) -> int<20> {
    let x: int<20> = sext(u);
    let (p0, p1, p2, p3) = mcm(x);
    reg(clk) w3 reset(rst: 0) = p3;
    reg(clk) w2 reset(rst: 0) = p2 +. w3;
    reg(clk) w1 reset(rst: 0) = p1 +. w2;
    p0 +. w1
}
```

`mcm` is the grey box of the diagram: six adders and four hard-wired shifts for four coefficients, where four generic multipliers would be four multipliers. `p0..p3` are the four tap wires; `w1..w3` are the three registers, and each `+.` in a `reg` initialiser is one structural adder — the register/adder alternation of the drawing read bottom-up. Every signal is `int<20>`, which *is* `sfix(1,-18)` at the interface of this note: input LSB $2^{-7}$ times coefficient LSB $2^{-11}$ gives product LSB $2^{-18}$, and $|y|\le 2048\cdot128=2^{18}$ fits a 20-bit signed word, so the truncating `+.` never wraps and $\delta_{\text{r}}=0$ exactly. Synthesis will not draw it this way: it will flatten `mcm` into the delay chain and retime, and the six MCM adders will be merged with the three structural ones into whatever carry structure the target prefers.

Compiled with `spade 0.19.0` and simulated against a behavioural convolution reference: 3025 vectors pass — an explicit impulse response check (the taps must emerge in the order $205,614,819,410$, which is what catches a reversed delay chain), asymmetric named vectors including $1$ followed by $-128$, the saturated corners $\pm128$ and $127$ held for four cycles, and a 3000-vector random sweep.

**Related Notes**

- [[Direct-Form FIR Filter]] – counter-example: identical transfer function, opposite trade — narrow registers and a deep adder chain instead of wide registers and a flat one.
- [[Multiple Constant Multiplication]] – depends-on: the single MCM of $u(k)$ is where every multiplication in this structure lives, and its sharing is the entire area argument.
- [[Shift-and-Add]] – supports: how each shared constant product is built from adders and hard-wired shifts, as in the `mcm` function above.
- [[SOPC, Sum of Products by Constants]] – compares: the direct form's building block, which transposition replaces with an MCM — the two are graph transposes of each other.
- [[Tapped Delay Line]] – compares: the register chain the transposition consumes; here the registers hold partial sums, not samples.
- [[Adders]] – depends-on: the $n$ structural adders are ordinary carry-propagate adders at the internal width.
- [[Linear-Phase FIR Filter]] – compares: coefficient symmetry, which both forms exploit, but by folding taps in one and by sharing constants in the other.
- [[Transposed Direct Form I IIR Filter]] – extends: the same transposition applied to a recursive structure, where a feedback loop limits what it can buy.
- [[Choosing a Filter Structure]] – compares: where this sits against every sibling at equal guaranteed accuracy.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.5, pp. 677–678 — non-recursive filters, (23.14), the direct form (Fig. 23.7) and the transposition rewrite giving Fig. 23.8, MCM plus structural adders.
- §23.1.6, p. 681 — multiplier operand widths across the four structures; why a multiplier fed by $u(k)$ is smaller than one fed by a loop signal.
- §23.3.2–23.3.3, pp. 690–692 — the `sfix(0, ℓ)` / `sfix(m', ℓ_ext)` interface (Fig. 23.17), the modulo-$2^{m'}$ overflow argument, and $\delta_{\text{r}}=0$ for finitely representable coefficients.
- §23.3.4, p. 693 — (23.33), $\mathcal{H}_\delta(z)=1$ for a non-recursive filter.
- §12.5.3, p. 407 (cross-reference from p. 678) — transposition of constant-multiplier adder graphs.
