---
title: Softmax Unit
description: "Exponential per output plus one reciprocal, normalising the output vector to sum to 1 — the most expensive layer in an inference network and the one you are usually allowed to delete."
kind: circuit
source: "ASA §24.2.5, pp. 721-722"
status: seed
spade: simulated
tags: [digital, deep-learning, softmax, exponential, reciprocal, classifier, argmax, fpga]
aliases:
  - Softmax
  - Softmax Layer
  - Softmax Function
  - Softmax Normalisation
---

# Softmax Unit

The one layer in an inference network that needs a transcendental *and* a division — $N$ exponentials, an adder tree and a reciprocal — and the one whose hardware vanishes completely if the classifier only has to name the winner.

```tikz title="Softmax datapath: max tree, shift, exponential ROM, adder tree, one reciprocal, N scalings, and the argmax bypass"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize,
  blk/.style={draw,fill=gray!8,align=center,inner sep=3pt,minimum height=1.05cm},
  bus/.style={very thick,->}]

  % ---------- row A : max tree, shift, exponential
  \node[blk,minimum width=2.4cm] (MAX) at (1.9,3.3) {max tree\\$N{-}1$ comparators};
  \node[blk,minimum width=2.4cm] (SUB) at (6.0,3.3) {$N$ subtractors\\$D_i=m-X_i$};
  \node[blk,minimum width=2.6cm] (EXP) at (10.6,3.3) {$N\times$ exp ROM\\$2^{8}\times(w_F{+}g)$};

  \draw[bus] (-2.9,3.3) -- (0.70,3.3);
  \node[anchor=south] at (-1.85,3.38) {$X$ \;($N\times8$, signed)};

  % X also feeds the subtractors, routed under row A and above the E bus
  \draw[very thick] (-0.55,3.3) -- (-0.55,2.35) -- (6.0,2.35);
  \draw[bus] (6.0,2.35) -- (6.0,2.77);
  \node[anchor=south] at (4.0,2.42) {$X$ \;($N\times8$)};

  \draw[bus] (3.10,3.3) -- (4.80,3.3);
  \node[anchor=south] at (3.95,3.38) {$m$ \;(8)};
  \draw[bus] (7.20,3.3) -- (9.30,3.3);
  \node[anchor=south] at (8.25,3.40) {$D_i\ge0$};
  \node[anchor=north] at (8.25,3.22) {$N\times8$};

  % ---------- the argmax bypass
  \node[blk,dashed,fill=white,minimum width=3.6cm] (AM) at (6.2,5.5)
       {$\arg\max$ : one-hot ($N$)\\\emph{inference bypass}};
  \draw[very thick,dashed] (1.9,3.83) -- (1.9,5.5);
  \draw[very thick,dashed,->] (1.9,5.5) -- (4.40,5.5);

  % ---------- the E bus wrapping down to row B
  \draw[very thick] (11.90,3.3) -- (13.40,3.3) -- (13.40,1.50) -- (-1.10,1.50);
  \node[anchor=south] at (6.0,1.55)
       {$E_i=e^{-D_i}\in(0,1]$ \;($N\times$ \texttt{ufix}$(0,-w_F{-}g)$, unsigned, no overflow)};
  \draw[bus] (-1.10,1.50) -- (-1.10,0.05) -- (0.40,0.05);
  \draw[bus] (10.6,1.50) -- (10.6,0.58);

  % ---------- row B : accumulate, one reciprocal, N scalings
  \node[blk,minimum width=2.4cm] (ADD) at (1.6,0.05) {adder tree\\$S=\sum_j E_j$};
  \node[blk,minimum width=2.6cm] (REC) at (6.6,0.05) {reciprocal\\$R\approx1/S$};
  \node[blk,minimum width=2.6cm] (MUL) at (10.6,0.05) {$N$ multipliers\\$\sigma_i=E_i\cdot R$};

  \draw[bus] (2.80,0.05) -- (5.30,0.05);
  \node[anchor=south] at (4.05,0.15) {$S\in[1,N]$};
  \node[anchor=north] at (4.05,-0.03) {($q$ bits)};
  \draw[bus] (7.90,0.05) -- (9.30,0.05);
  \node[anchor=south] at (8.60,0.15) {$R$};
  \node[anchor=north] at (8.60,-0.03) {($w_F{+}g$)};
  \draw[bus] (11.90,0.05) -- (13.60,0.05);
  \node[anchor=south] at (12.75,0.15) {$\sigma_i$};
  \node[anchor=north] at (12.75,-0.03) {($N\times w_F$)};
\end{circuitikz}
\end{document}
```

*Own construction — §24.2.5 describes the layer in prose and carries no figure. Widths assume the common case of 8-bit quantized logits and take $w_F$, $g$ from the fixed-point exponential specification of [[Fixed-Point Computation of eY]]; $q = \lceil\log_2 N\rceil + w_F + g$.*

**Fix what the layer is for before costing it.** Softmax is post-processing on the $N$ outputs of the final dense layer, where $N$ is the class count (p. 721). It maps that vector into one that sums to 1:

$$\sigma(X_i) = \frac{e^{X_i}}{\sum_j e^{X_j}} \tag{24.16} \qquad\qquad \sum_i \sigma(X_i) = 1 \tag{24.17}$$

for any real $X \in \mathbb{R}^N$. The book is careful to say the resulting "probabilities" are *an interpretation without any real statistical significance* — the layer's value is that it hands downstream logic a bounded, comparable, non-negative vector instead of activations of arbitrary sign and scale. Because it runs once per inference and not once per activation, its cost sits outside the MAC-count budget that dominates every other layer; that is exactly why it is worth a separate operator rather than a line in a table.

**Shift by the maximum, and the entire datapath becomes unsigned and bounded.** For any constant $c$, multiply numerator and denominator of (24.16) by $e^{-c}$ — legal because $e^{-c} \neq 0$ — and by the law of exponents $e^{X}e^{-c} = e^{X-c}$:

$$\sigma(X_i) = \frac{e^{X_i - c}}{\sum_j e^{X_j - c}}$$

so **softmax is invariant under a uniform additive shift of its inputs.** Choose $c = m = \max_j X_j$ and write $D_i = m - X_i$. Three format facts fall out at once, and they are what makes the unit buildable:

- $D_i \ge 0$ always, with equality for at least one lane, so the exponential's argument is an **unsigned** fixed-point number — no sign bit into the table, no signed range reduction.
- $E_i = e^{-D_i} \in (0,1]$, so $E_i$ is `ufix`$(0,\,-w_F-g)$: MSB at weight $2^0$, **no overflow is possible anywhere in the exponential**, and exactly one lane produces $E_i = 1$.
- $S = \sum_j E_j$ satisfies $1 \le S \le N$, since one term is exactly 1 and every term is at most 1. So the accumulator needs $q = \lceil\log_2 N\rceil + w_F + g$ bits and no more, and — the part that matters for the divider — **the divisor is bounded away from zero**, so there is no divide-by-zero guard and no normalisation step in front of the reciprocal.

Skip the shift and none of that holds. An 8-bit quantized logit reaches $X_i = 127$ in its own units; $e^{127}$ needs about $127/\ln 2 \approx 184$ bits of integer part before any fraction, and the denominator would overflow long before the ratio came out right. The shift costs a comparator tree and $N$ subtractors — hardware the argmax path wants anyway — and buys the whole format argument. See [[Number Formats]] for the fixed-point notation used above.

**The exponential is a fixed-point evaluation, not a floating-point one.** Everything a [[Floating-Point Exponential]] spends area on — the exponent datapath, the range reduction of the argument into $[-\ln 2/2, \ln 2/2]$, the final normalisation and rounding of a significand — exists to handle arguments and results of unknown magnitude. Here both magnitudes are pinned by the previous paragraph, so what remains is precisely the inner evaluator of [[Fixed-Point Computation of eY]]: the additive split $D = A + Z$, an $e^{-A}$ table, and $e^{-Z} = 1 - Z + h(Z)$ with the leading terms free shifts. For a quantized classifier $D_i$ is 8 bits wide, small enough that even the split is waste — a $2^8 \times (w_F+g)$ ROM is a direct tabulation, one block RAM on any FPGA ([[Table-Based Function Evaluation]], [[FPGAs]]), and on ASIC a ROM small enough that replicating it per lane is cheaper than arbitrating a shared one. At 16-bit logits the table is $2^{16}$ deep and the $A+Z$ split stops being optional.

**The table is shorter than its address space, and that is the correct behaviour.** $e^{-D} < 2^{-w_F-g}$ as soon as $D > (w_F+g)\ln 2$, at which point the rounded result is exactly zero. So all addresses above that threshold read zero and can be replaced by a saturating comparator on the address: at $w_F + g = 16$ the ROM is only about $16\ln 2 \approx 11.1$ argument-units deep whatever the logit width, and widening the logits deepens nothing. Underflow here is not a loss of accuracy to be flagged in [[Error Accuracy]]; it is faithful rounding of a term that genuinely contributes nothing to $S$.

**Divide once, not $N$ times.** Every lane divides by the *same* $S$, so factor it out:

$$\sigma_i = \frac{E_i}{S} = E_i \cdot R, \qquad R \approx \frac{1}{S}$$

by associativity of multiplication over the shared factor. That replaces $N$ instances of the most expensive operator in the book with one reciprocal and $N$ multipliers — and a multiplier of this width is one DSP block, while a [[Dividers|divider]] is a multi-cycle recurrence or a large unrolled array. [[Division by Reciprocal]] presents this as an optimisation you may or may not take; in softmax it is the natural form, because the divisor is shared $N$ ways *and* already normalised into $[1,N]$ by the shift, which is the precondition that makes a seed table cheap. The price is that $R$ is a rounded reciprocal, so $\sum_i \sigma_i$ equals 1 only to within about $N$ ulps: **the layer's own defining identity (24.17) does not hold exactly in the hardware.** Anything downstream that tests for a sum of exactly 1 is testing the rounding mode.

**Two passes over the vector is the real architectural cost.** $\sigma_i$ depends on every $X_j$, so no output can leave before the last input arrives — softmax cannot be streamed the way a convolution can. The naive schedule is three passes: one for $m$, one for $S$, one to scale. Two suffice, because the invariance of the second paragraph applies to a *partial* sum as well. Keep $m_k = \max(m_{k-1}, X_k)$ and let $S_k$ be the running sum already shifted to $m_k$; rescaling the previous partial sum from $m_{k-1}$ to $m_k$ multiplies it by $e^{m_{k-1}-m_k}$, giving

$$S_k = S_{k-1}\,e^{m_{k-1}-m_k} + e^{X_k - m_k}$$

which is exact, needs one extra exponential and one extra multiplier per element, and lets max and sum share a single pass. The alternative is an $N$-word buffer holding $E$ while $S$ completes. For a 10-class classifier the buffer is trivially the right answer; the trade only inverts when $N$ is large. In a stream/dataflow architecture the layer is a pipeline bubble either way — see [[Choosing a Deep Learning Datapath]].

> [!warning] The source gives no architecture and no cost figures for softmax
> §24.2.5 says only that "computing the exponentials and the division is quite expensive" and cites two approximation papers [Shi+17; KP20] without summarising them. No LUT count, no delay, no format recommendation, and no streaming schedule appears anywhere in Ch. 24. The datapath, the widths and the two-pass recurrence above are consequences of the chapter's own format rules (p. 726) and of §22.5, not measurements; quote no number from this note as the book's.

**The cheapest softmax is no softmax.** $e^x$ is strictly increasing and $S > 0$ does not depend on $i$, so $\sigma$ is strictly monotone in $X_i$ and therefore **order-preserving**: not only $\arg\max_i \sigma(X_i) = \arg\max_i X_i$, but the top-$n$ sets coincide for every $n$, which covers the top-$n$ accuracy metric as well as top-1. A classifier that reports a label and nothing else can delete the exponentials, the adder tree and the reciprocal, keeping only the max tree already in the diagram with its comparison results retained as a one-hot code (p. 722) — $N-1$ comparators, no transcendental, no divider ([[Argmax Unit]], [[Comparators]]). Softmax survives in *training* for a reason that is purely mathematical: backpropagation needs a smooth differentiable surrogate, and $\arg\max$ has zero gradient almost everywhere. This is the same move as folding batch normalisation into the preceding layer's weights (p. 721) — an inference datapath is defined as much by the layers it proves it can drop as by the ones it builds.

$$\boxed{\ \sigma(X_i) = E_i \cdot R, \quad m = \max_j X_j,\ \ E_i = e^{-(m-X_i)} \in (0,1],\ \ S = \textstyle\sum_j E_j \in [1,N],\ \ R \approx 1/S\ }$$

**When it breaks.**

- **The probabilities are actually used.** Detection confidence thresholds, knowledge distillation, mixture weights, RL policy sampling and any calibrated-uncertainty claim all read $\sigma$ itself, not its arg max. In those the layer is not deletable and the reciprocal's accuracy becomes a specification, not a detail.
- **Attention, not classification.** Inside a transformer the softmax runs per head per query with $N$ = sequence length, on the critical path of every token, not once at the tail of the network. The cost model of this note — one small $N$, once per inference — does not transfer, and the two-pass dependency becomes the dominant scheduling problem rather than a footnote.
- **Logit spread wider than the output format.** If $\max_j X_j - \min_j X_j > (w_F+g)\ln 2$ then every non-maximal $E_i$ underflows to zero, $S = 1$, and $\sigma$ comes out one-hot: the unit has silently *become* an [[Argmax Unit]]. Each value is correctly rounded and the vector is useless. Add guard bits, or work in the log domain, where the same spread costs only a wider integer part ([[LNS Neuron]]).
- **Downstream code that trusts $\sum_i \sigma_i = 1$.** It holds to $O(N)$ ulps, not exactly, and the error is one-sided if $R$ is truncated rather than rounded.
- **Temperature.** $\sigma(X_i/T)$ folds into the ROM contents for a compile-time $T$ and costs nothing; a runtime $T$ needs a multiplier or a shifted address in front of the table, on the critical path.
- **$N = 1$.** $\sigma \equiv 1$ and the whole unit is a constant — worth a `gen if`, not a divider.

**RTL (Spade).**

```spade
fn max4(x: [int<8>; 4]) -> int<8> {
    x[0].max(x[1]).max(x[2].max(x[3]))
}

fn shift1(m: int<8>, xi: int<8>) -> uint<8> {
    trunc((m - xi).as_uint())            // 0 <= m - xi <= 255, so trunc is exact
}

fn sum4(e: [uint<16>; 4]) -> uint<18> {
    let a: uint<18> = trunc(zext::<16, 18>(e[0]) + zext::<16, 18>(e[1]));
    let b: uint<18> = trunc(zext::<16, 18>(e[2]) + zext::<16, 18>(e[3]));
    trunc(a + b)
}

fn scale1(ei: uint<16>, r: uint<16>) -> uint<16> {
    trunc((ei * r) >> 16)                // ufix(0,-16) x ufix(0,-16), keep the top half
}

entity softmax4(x: [int<8>; 4], e: [uint<16>; 4], r: uint<16>)
    -> ([uint<8>; 4], uint<18>, [uint<16>; 4])
{
    let m = max4(x);
    let d = [shift1(m, x[0]), shift1(m, x[1]), shift1(m, x[2]), shift1(m, x[3])];
    let s = sum4(e);
    let y = [scale1(e[0], r), scale1(e[1], r), scale1(e[2], r), scale1(e[3], r)];
    (d, s, y)
}
```

`max4` is the comparator tree and `d` the $N$ subtractors; the `as_uint` after the `int<8>` subtraction is the format change the second paragraph justifies, and it is a reinterpretation, not arithmetic — the hardware is the subtractor and nothing else. `e` enters as the ROM outputs, so the transcendental is the one block *not* in the RTL: its contents are a table, not a datapath. `sum4` is the adder tree carrying $q = 18 = \lceil\log_2 4\rceil + 16$ bits, with each partial sum truncated back because chained `+` widens by one bit at every step; `scale1` is the reciprocal multiply, `ufix`$(0,-16) \times$ `ufix`$(0,-16)$ keeping the upper half of the 32-bit product, which is a truncation and therefore the one-sided error noted above. Everything is combinational — synthesis will balance the four subtractors and the adder tree into whatever depth the clock allows, and will map `scale1` onto DSP blocks that the drawing shows as plain boxes.

Simulated with iverilog against a behavioural reference for all three outputs: **4010 vectors, 0 failures** — 6 named (including the asymmetric $X = (-128, 1, 127, 0)$ with $E = (1, 0, 65535, 256)$, and its lane-reversed twin, which is what catches an array packed LSB-first the wrong way round), a 4-vector sweep walking the maximum through each lane in turn, and 4000 random $(X, E, R)$ tuples.

**Related notes.**

- [[Argmax Unit]] – counter-example: deletes this entire unit, and monotonicity makes the substitution exact for every top-$n$ metric rather than an approximation.
- [[Fixed-Point Computation of eY]] – depends-on: what goes inside the exp ROM once $D_i$ is too wide to tabulate directly.
- [[Floating-Point Exponential]] – compares: the range reduction, exponent path and normalisation the shift-by-max lets this unit skip entirely.
- [[Division by Reciprocal]] – depends-on: one reciprocal shared across $N$ dividends, which is why there is no divider per lane.
- [[Dividers]] – compares: the operator this layer would otherwise need $N$ of, and the cost that motivates the factorisation.
- [[Max Pooling Unit]] – supports: the same comparator tree, one layer type earlier and applied per channel instead of per class.
- [[Choosing a Deep Learning Datapath]] – compares: where a layer that cannot start until its last input arrives fits in a streaming versus a matrix-of-engines architecture.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §24.2.5 *Softmax Layer*, pp. 721-722 — (24.16), (24.17), the "interpretation without statistical significance" caveat, "computing the exponentials and the division is quite expensive", and the $\arg\max$ replacement with a one-hot result.
  - §24.2.6 *An Example CNN*, p. 722 — the VGG-7 tail this unit sits on: two dense layers down to ten neurons, then softmax.
  - §24.2.3 *Batch Normalization*, pp. 720-721 — the companion case of a training-only layer that disappears at inference.
  - §24.3.1, p. 726 — the $p = m+n$, $q \ge p$ (plus $\lceil\log_2 N\rceil$ headroom) width rules for exactness inside a layer, applied here to the $E$ accumulator.
  - §22.5 *Fixed-point computation of $e^Y$*, pp. 655-656 — the $A+Z$ split and the $e^A$ table behind the exp ROM.
