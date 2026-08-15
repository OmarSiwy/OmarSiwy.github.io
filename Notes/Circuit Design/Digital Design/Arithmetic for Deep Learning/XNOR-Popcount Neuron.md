---
title: "XNOR-Popcount Neuron"
description: "Encode -1 as 0 and the multiplier becomes one XNOR gate, the adder tree becomes a population counter, and the activation plus folded batch norm becomes a single unsigned threshold comparator — a neuron with no arithmetic operator left in it."
kind: circuit
source: "ASA §24.3.1.2, p. 726; §24.6.2, pp. 743-744 (Fig. 24.9c, p. 725; Tables 24.3-24.4)"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, binarized, popcount, quantization, fpga]
aliases:
  - XNOR Popcount Neuron
  - XNOR-Popcount
  - Binarized Neuron
  - Binary Neuron
  - BNN Neuron
  - FINN Neuron
---

# XNOR-Popcount Neuron

A neuron whose weights and activations are both restricted to $\{-1,+1\}$, so that the entire dot product plus activation reduces to a bank of XNOR gates, a population counter, and one unsigned comparison — the only neuron in this chapter that contains no arithmetic operator at all.

```tikz title="Binarized neuron: XNOR gate bank, population counter, unsigned threshold comparator"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- XNOR gate bank: one gate per synapse, the whole multiplier ---
  \node[xnor port] (g0) at (2.6,3.2) {};
  \node[xnor port] (g1) at (2.6,1.6) {};
  \node[xnor port] (gn) at (2.6,-0.8) {};

  \draw (0.4,3.35) node[left] {$x_0$} -- (g0.in 1);
  \draw (0.4,3.05) node[left] {$w_0$} -- (g0.in 2);
  \draw (0.4,1.75) node[left] {$x_1$} -- (g1.in 1);
  \draw (0.4,1.45) node[left] {$w_1$} -- (g1.in 2);
  \draw (0.4,-0.65) node[left] {$x_{N-1}$} -- (gn.in 1);
  \draw (0.4,-0.95) node[left] {$w_{N-1}$} -- (gn.in 2);

  \node at (2.6,0.4) {$\vdots$};
  \node[anchor=west] at (-1.4,4.6) {$x_i,w_i$: $1$ bit each, code $0=-1$, $1=+1$};

  % --- popcount block ---
  \draw (5.4,-1.6) rectangle (7.6,4.0);
  \node at (6.5,1.5) {popcount};
  \node at (6.5,0.8) {$\sum_i P_i$};

  \draw[->] (g0.out) -- (5.4,3.2);
  \draw[->] (g1.out) -- (5.4,1.6);
  \draw[->] (gn.out) -- (5.4,-0.8);
  \node[anchor=south] at (4.4,3.25) {$P_0$};
  \node[anchor=south] at (4.4,1.65) {$P_1$};
  \node[anchor=south] at (4.4,-0.75) {$P_{N-1}$};
  \node at (4.4,0.4) {$\vdots$};
  \node[anchor=north] at (4.4,-1.4) {$1$ bit each};

  % --- threshold comparator ---
  \draw (10.4,0.6) rectangle (12.8,2.4);
  \node at (11.6,1.8) {unsigned $\ge$};
  \node at (11.6,1.1) {threshold $\theta$};

  \draw[->] (7.6,1.5) -- (10.4,1.5);
  \node[anchor=south] at (9.0,1.6) {$\operatorname{popcnt}$};
  \node[anchor=north] at (9.0,1.4) {$\lceil\log_2(N{+}1)\rceil$ bits};

  \draw[->] (12.8,1.5) -- (14.6,1.5);
  \node[anchor=south] at (13.7,1.6) {$x'$};
  \node[anchor=north] at (13.7,1.4) {$1$ bit};

  \node[anchor=north west] at (-1.4,-2.4)
    {$S=2\operatorname{popcnt}-N$ is affine with constant coefficients, so it is folded into $\theta$ and never built.};

\end{circuitikz}
\end{document}
```

*after Fig. 24.9(c), p. 725, with the popcount and threshold detail of §24.6.2, pp. 743–744.*

**Choose the encoding first — the gate falls out of it, not the other way round.** A binarized network has activations $x_i$ and weights $w_i$ drawn from $\{-1,+1\}$ (scaled by a per-layer factor $s$, which is linear and therefore absorbed exactly as in [[Quantization]]). Encode the *value* $-1$ by the *code* `0` and $+1$ by `1`, so one bit carries a sign and nothing else. Under that map the product's value is $+1$ exactly when the two operands agree, and the code of the product is $1$ exactly when the two codes are equal:

| $x_i$ code (value) | $w_i$ code (value) | $P_i$ code (value) |
| --- | --- | --- |
| 0 ($-1$) | 0 ($-1$) | 1 ($+1$) |
| 0 ($-1$) | 1 ($+1$) | 0 ($-1$) |
| 1 ($+1$) | 0 ($-1$) | 0 ($-1$) |
| 1 ($+1$) | 1 ($+1$) | 1 ($+1$) |

That column is the truth table of $P_i = \overline{x_i \oplus w_i} = (x_i = w_i)$, i.e. XNOR (Table 24.3, p. 743). The $2n$-bit array multiplier of [[Multipliers]] has become a single two-input gate of depth 1. Nothing about this is an approximation: within the encoding it is *exact*, and the accuracy that was lost was lost earlier, when training quantized the weights.

> [!warning] The book's Fig. 24.9(c) labels the block `xor`, while its own Table 24.3 (p. 743) and text give XNOR. XOR is the correct gate under the *opposite* code assignment ($-1\mapsto 1$), where it computes the product's sign bit rather than its code; XNOR is correct for the $-1\mapsto 0$ convention the rest of §24.6.2 uses. The two conventions are related by inverting both operands and the output, so the hardware count is identical — but only one of them matches the threshold arithmetic below.

**Turn the accumulation into a count by exploiting that only two product values exist.** The dot product to compute is $S=\sum_{i=0}^{N-1} P_i^{\text{val}}$ with $P_i^{\text{val}}\in\{-1,+1\}$. Substitute the code-to-value map $P_i^{\text{val}} = 2P_i - 1$, which is the unique affine bijection sending $0\mapsto-1$ and $1\mapsto+1$, and push the sum through by linearity:

$$S=\sum_{i=0}^{N-1}\bigl(2P_i-1\bigr)=2\sum_{i=0}^{N-1}P_i-N=2\operatorname{popcnt}(P)-N,\qquad \operatorname{popcnt}(P)=\sum_i P_i \tag{24.40}$$

Read from the codes alone this is the observation the book makes from Table 24.4 (p. 744): every bit that flips from 0 to 1 raises $S$ by exactly 2, because it moves one term from $-1$ to $+1$. The multi-operand summation of [[Sums of Weighted Bits]] — normally a compressor tree over columns of different weights — has degenerated to a single column of $N$ bits all of weight $2^0$. That is a *parallel counter*, the simplest object in the bit-heap toolbox.

**Fold the affine map, the batch norm and the sign activation into one constant.** The activation is $\operatorname{sign}(\cdot)$, itself a one-bit quantization of $\tanh$ (Fig. 24.3b, p. 712). Batch normalization at inference is the constant affine map $X_{\text{norm}}=\gamma\frac{S-\mu_B}{\sqrt{\sigma_B^2}}+\beta$ (eqs. 24.14–24.15, p. 720–721), so the neuron's output code is $1$ iff

$$\gamma\frac{S-\mu_B}{\sigma_B}+\beta \ge 0 \;\Longleftrightarrow\; S \ge \mu_B - \frac{\beta\,\sigma_B}{\gamma} \;=:\; \tau \qquad (\gamma/\sigma_B>0)$$

by dividing through by the positive constant $\gamma/\sigma_B$ — the one step where the sign of a learnt parameter matters, and the reason the comparator's direction is a per-neuron compile-time choice rather than a fixed one. Now substitute $S=2\operatorname{popcnt}-N$ and divide by 2:

$$\operatorname{popcnt} \ge \frac{\tau+N}{2}, \qquad \theta := \left\lceil \frac{\tau+N}{2} \right\rceil$$

the ceiling being exact because $\operatorname{popcnt}$ is an integer. Every constant in sight — $\gamma,\beta,\mu_B,\sigma_B,N$ — is known at compile time, so $\theta$ is a per-neuron literal and $S$ is **never computed**. No subtraction, no doubling, no bias adder: the threshold comparator of [[Magnitude Comparator]] reads the popcount directly, and it is *unsigned*, since $\operatorname{popcnt}\in[0,N]$ (p. 744).

**Count the wires, because the widths are the whole cost story.** $x_i$, $w_i$, $P_i$ and $x'$ are 1 bit each; the XNOR bank is $N$ gates of depth 1 and no fan-in constraint. $\operatorname{popcnt}\in[0,N]$ needs $\lceil\log_2(N+1)\rceil$ bits — 4 bits for $N=9$ (a $3\times3$ kernel), 10 bits for $N=512$. The comparator is that same width. Compare with a [[Quantized MAC Neuron]] on the same $N$: $m$-bit activations and $n$-bit weights give $N$ products of $p=m+n$ bits and an accumulator of $q\ge p+\lceil\log_2 N\rceil$ bits, so for $m=n=8,\,N=512$ that is a 512-term, 24-bit compressor tree against a 10-bit one here. Storage falls by the same factor: one bit per weight instead of eight, which is what makes a whole binarized network fit in on-chip [[Block Memory]] and removes the off-chip traffic that dominates energy.

**On an FPGA the popcount is nearly free, and that is the point of the whole scheme.** A 6-input LUT computes any function of 6 bits, so it can implement a 6:3 generalized parallel counter directly — six product bits in, a 3-bit count out — reducing $N$ bits to $\lceil N/6\rceil$ three-bit numbers in one LUT level. Better still, the XNOR that produces each $P_i$ has only two inputs, so it is absorbed into the *same* LUT as the first counter stage: a 6-LUT fed by three $(x_i,w_i)$ pairs computes three XNORs and their sum with nothing left over. The remaining small numbers go into a compressor tree and a final adder on the hard carry chain ([[FPGAs]], [[Lookup-Tables]]). On ASIC the equivalent is a Wallace-style tree of full adders used as 3:2 counters, depth $O(\log N)$; there is no LUT to hide the XNOR in, so the gate bank is a visible extra level, but it is one level of two-input gates against a full multiplier array. Either way the neuron is [[Combinational Logic]] end to end — the only registers in a FINN-style stream architecture are the pipeline stages inserted for $f_{\max}$, not because the algorithm needs state.

$$\boxed{\ P_i=\overline{x_i\oplus w_i},\qquad S=2\operatorname{popcnt}(P)-N,\qquad x'=\bigl[\operatorname{popcnt}(P)\ge\theta\bigr]\ }$$

**When it breaks**

- **Zero is not representable.** $\{-1,+1\}$ has no way to say "this synapse does not matter", so pruning buys nothing and a weight that wants to be near zero must commit to a sign. Ternary weights in $\{-1,0,+1\}$ recover that — a zero weight instantiates *no hardware at all* in an unrolled design — at the cost of two bits per weight and a real, if tiny, adder tree; see [[Ternary MAC Unit]]. The book reports ternary behaving slightly better than binary (p. 727).
- **The magnitude of the activation is gone, not approximated.** There is no ulp statement to make here and [[Error Accuracy]] does not apply past the layer boundary: the arithmetic inside the neuron is exact with respect to its binarized inputs, and the entire error lives in the binarization itself. Whether the network still classifies is answered by running the test set, not by an error bound.
- **It only works with quantization-aware training.** Post-training quantization to one bit destroys the network. Even with QAT, expect a few percentage points of top-1 accuracy against the binary32 baseline (p. 727), recoverable by widening or deepening the network — but only if that overhead does not exceed the precision saving, and the book is explicit that designing a good binary network "remains an art".
- **The comparator direction is per-neuron.** If $\gamma/\sigma_B<0$ the division above reverses the inequality and that neuron needs $\operatorname{popcnt}\le\theta'$. Handled at compile time by inverting the threshold and the output bit, but a datapath that hard-wires $\ge$ and generates only $\theta$ will silently mis-classify on those neurons.
- **Degenerate thresholds.** $\tau<-N$ gives $\theta\le0$ and the neuron is a constant $1$; $\tau>N$ gives $\theta>N$ and it is a constant $0$. Both are legal outputs of the folding arithmetic and both mean the comparator, the counter and the gates can all be deleted — worth a check in the generator, since a constant neuron in a large layer is free area otherwise spent.
- **Wider activations reverse the argument.** A common variant keeps binary or ternary *weights* but 4-bit activations (p. 726). The XNOR dies immediately — a 4-bit value times $\pm1$ is a conditional negation, not a gate — and the popcount goes back to being a signed adder tree. The extreme point documented here is only reachable when *both* operands are one bit.

**RTL (Spade)**

```spade
/// Population count of an N-bit vector, split in half so the depth is log N.
fn popcount<#uint N>(p: [bool; N]) -> uint<N> {
    gen if N == 1 {
        p[0].as_uint()
    } else {
        let (lo, hi) = p.split_at::<{N / 2}>();
        let l: uint<N> = zext(popcount(lo));
        let h: uint<N> = zext(popcount(hi));
        trunc(l + h)
    }
}

/// One binarized neuron: XNOR the sign codes, count the ones, compare to the
/// folded batch-norm threshold.
fn xnor_neuron<#uint N>(x: [bool; N], w: [bool; N], theta: uint<N>) -> (uint<N>, bool) {
    let p: [bool; N] = (~(x.as_uint() ^ w.as_uint())).as_bits();
    let c = popcount(p);
    (c, c >= theta)
}
```

`x` and `w` are the two input buses of the diagram and `p` is the $P$ bus: `~(x.as_uint() ^ w.as_uint())` is the whole gate bank in one expression, since `^` on a `uint<N>` is bitwise and `~` is the bitwise complement — `!` is bool-only and would not typecheck here. `c` is the popcount wire and the returned `bool` is $x'$. The recursion carries `uint<N>` rather than the $\lceil\log_2(N+1)\rceil$ bits the value actually needs, purely so the two halves have a common width for `+`; the top $N-\lceil\log_2(N+1)\rceil$ bits are provably constant zero and every synthesiser removes them, but the source is honest that they are there. `split_at` gives a balanced tree of depth $\lceil\log_2 N\rceil$ instead of the $N$-deep chain a naive fold produces; synthesis then re-maps that tree onto 6:3 counters and the carry chain, so the *drawn* structure survives only as an intent. Everything here is a `fn`, not an `entity` — the neuron is combinational, and Spade's `fn` cannot contain a register even by accident.

**Related Notes**

- [[Quantized MAC Neuron]] – compares: the same neuron at 8 bits, with a real multiplier, an exact $q$-bit accumulator and a requantizer; this note is its degenerate limit.
- [[Ternary MAC Unit]] – extends: adds the zero code back, trading one bit of weight storage for the ability to prune.
- [[Sums of Weighted Bits]] – depends-on: the popcount is a single-column bit heap, and the 6:3 LUT counters it compresses with are that topic's parallel counters.
- [[Magnitude Comparator]] – depends-on: the unsigned $\ge$ that the sign activation and batch norm collapse into.
- [[Synchronous Counters]] – counter-example: the book points at a counter for `popcnt`, but a sequential counter costs $N$ cycles; only the combinational parallel counter keeps the one-classification-per-cycle rate a stream architecture is built for.
- [[Combinational Logic]] – supports: the finished neuron is pure combinational logic, which is the claim the whole construction exists to make.
- [[LogicNet Neuron]] – extends: pushes the same idea one step further and replaces the neuron's *function* by a truth table in a LUT.
- [[Choosing a Deep Learning Datapath]] – compares: where this sits against every sibling neuron in the chapter.
- [[Number Formats]] – depends-on: the code-to-value map and the per-layer scaling factor this note takes as given.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 24:
  - §24.2.3 Batch normalization — pp. 720–721 (eqs. 24.14–24.15), the constants folded into $\theta$.
  - §24.3.1.2 Ternary and Binary Formats — p. 726, and Fig. 24.9(c), p. 725.
  - §24.6.2 Binary CNN Architecture — pp. 743–744 (Table 24.3 XNOR, Table 24.4 and eq. 24.40 popcount, the unsigned threshold comparator).
  - §24.3.1.2 accuracy discussion — p. 727 (QAT requirement, few points of accuracy, ternary vs. binary).
- [[6.2) Arithmetic for Deep Learning]] — §Binary CNNs — the multiplier disappears, §Ternary and binary, §Worked example.
