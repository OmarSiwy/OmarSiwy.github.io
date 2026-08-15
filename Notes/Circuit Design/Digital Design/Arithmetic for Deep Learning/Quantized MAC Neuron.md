---
title: Quantized MAC Neuron
description: "The integer sum-of-products datapath of one artificial neuron: exact p=m+n products into a q-bit accumulator so the layer is bit-exact against a binary32 simulation of the same 8-bit data — at the cost of an accumulator wider than anything ever stored."
kind: circuit
source: "ASA §24.1, §24.3.1.1, pp. 708-715, 724-726"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, mac, quantization, fixed-point, dnn, inference]
aliases:
  - MAC Neuron
  - Integer MAC Neuron
  - Quantized Neuron
  - Artificial Neuron
  - Sum-of-Products Neuron
---

# Quantized MAC Neuron

One neuron built as $N$ exact $m\times n$ integer products summed into an accumulator wide enough that no rounding occurs anywhere between the input format and the output format.

```tikz title="One quantized neuron: exact products into a wide accumulator, with the only rounding at the output boundary"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % --- the region in which nothing is rounded ---
  \draw[dashed,rounded corners] (1.15,-0.85) rectangle (6.90,2.65);
  \node[anchor=south,font=\footnotesize] at (4.00,2.68)
    {exact: $0$ ulp anywhere inside};

  % --- multiplier ---
  \draw (1.6,0.3) rectangle (2.6,1.3);
  \node at (2.1,0.8) {$\times$};
  \draw[->] (-0.6,1.05) -- (1.6,1.05);
  \node[anchor=south,font=\footnotesize] at (0.5,1.08) {$W$ [$m$]};
  \draw[->] (-0.6,0.55) -- (1.6,0.55);
  \node[anchor=north,font=\footnotesize] at (0.5,0.52) {$X$ [$n$]};

  % --- accumulator ---
  \draw (5.0,-0.4) rectangle (6.4,2.4);
  \node at (5.7,1.0) {$\Sigma$};
  \draw[->] (2.6,0.8) -- (5.0,0.8);
  \node[anchor=south,font=\footnotesize] at (3.80,0.85) {$P$ [$p=m{+}n$]};

  \foreach \y in {1.5,1.8,2.1}
    \draw[->,dotted,thick] (4.05,\y) -- (5.0,\y);
  \node[anchor=east,font=\footnotesize,align=right] at (3.97,1.80)
    {$N{-}1$ further\\products};

  \draw[->] (3.70,0.0) -- (5.0,0.0);
  \node[anchor=north,font=\footnotesize] at (4.35,-0.03) {$B$ [$q$]};

  % --- out of the exact region ---
  \draw[->] (6.4,1.0) -- (8.0,1.0);
  \node[anchor=south,font=\footnotesize] at (7.45,1.03) {$Y$ [$q$]};

  \draw (8.0,0.5) rectangle (9.3,1.5);
  \node at (8.65,1.0) {ReLU};
  \draw[->] (9.3,1.0) -- (9.9,1.0);
  \draw (9.9,0.5) rectangle (11.8,1.5);
  \node[align=center] at (10.85,1.0) {requantise\\$q\to n'$};
  \draw[->] (11.8,1.0) -- (13.1,1.0);
  \node[anchor=south,font=\footnotesize] at (12.45,1.03) {$X'$ [$n'$]};

  \draw[<-] (10.85,0.5) -- (10.85,-0.55);
  \node[anchor=north,font=\footnotesize,align=center] at (10.85,-0.60)
    {the only rounding\\in the whole neuron};

  % --- the widths that make the claim true ---
  \node[anchor=north,font=\footnotesize] at (4.00,-0.95)
    {$m=n=8 \;\Rightarrow\; p=16$, \quad $q\ge p+\lceil\log_2 N\rceil$ \quad ($q=24$ suffices for $N\le 256$)};
\end{circuitikz}
\end{document}
```

*after Fig. 24.9 (b), p. 725; widths from the rule stated on p. 726.*

**One equation is the entire arithmetic content of deep learning, and it is a dot product.** Neuron $i$ of layer $\ell$ computes

$$X_i^{\ell+1} = f\Big(\underbrace{\textstyle\sum_j W_{i,j}^\ell X_j^\ell + B_i^\ell}_{=\,Y_i^\ell}\Big) \tag{24.1}$$

— a sum of $N$ products plus a bias, then one unary nonlinearity ([[ReLU Unit]]). Everything else in a network is a scheduling decision about which $j$ range over which operands: a dense layer stacks (24.1) into $\mathbf X^{\ell+1} = \mathbf f(\mathbf W^\ell\mathbf X^\ell + \mathbf B^\ell)$, and a convolutional layer is the same thing with a banded Toeplitz $\mathbf W$ ([[Convolution Line Buffer]]). So one MAC neuron is the atom of every DNN accelerator, and the only free variables in it are five widths: $m$ for the weight $W$, $n$ for the activation $X$, $p$ for the product $P$, $q$ for the accumulator and $Y$, and $n'$ for the output activation $X'$.

**Quantization deletes the scaling factors, so the datapath is integer and not fixed-point.** Under post-training quantization every weight of a network can be moved to a single 16-bit fixed-point format without degrading the accuracy — $m=n=p=n'=16$ in the figure (p. 726). The crucial observation is what happens to the *positions* of the binary points: every operation before the activation is linear, and ReLU is positively homogeneous, $\max(0,\lambda X)=\lambda\max(0,X)$ for $\lambda>0$, so a consistent rescaling of all weights and activations passes straight through the layer and can be compensated in the next one. The scaling factors are therefore irrelevant to the hardware, and **fixed-point formats reduce to plain integers** (p. 726). See [[Fixed-Point Representations]] for what is being given up; here nothing is, because the exponent is a compile-time bookkeeping constant that never reaches a gate.

Giving each layer's inputs, weights and outputs a *separate* format takes this to 8 bits with only slight degradation in classification accuracy (p. 726), and to 5–8 bits under quantization-aware training. That per-layer format is what other communities call block floating point — a shared exponent over a block of integer significands — except that the exponent is chosen once at compile time and never adjusted at runtime, so from a hardware view there is nothing dynamic about it and no exponent datapath exists.

**Exactness of the product is a range argument, not a design choice.** For $m$-bit and $n$-bit two's-complement operands, $W\in[-2^{m-1},2^{m-1}-1]$ and $X\in[-2^{n-1},2^{n-1}-1]$, the extreme products are $(-2^{m-1})(-2^{n-1}) = 2^{m+n-2}$ and $(-2^{m-1})(2^{n-1}-1) = -2^{m+n-2}+2^{m-1}$. Both lie inside $[-2^{p-1},2^{p-1}-1]$ for $p=m+n$, with the positive extreme one bit short of the top — the well-known asymmetry that makes signed multiplication never quite fill its output word. So $p=m+n$ makes every product **exact**, and no smaller $p$ does. For $m=n=8$ this is the 16-bit product of the [[TPU]]'s MAC units.

**Exactness of the sum is a headroom argument, and it buys order-independence.** With $N$ exact terms of magnitude below $2^{p-1}$ each, $|Y| < N\cdot 2^{p-1} + |B|$, so $q \ge p + \lceil\log_2 N\rceil$ leaves the accumulator unable to overflow, and the book's rule "$q \ge p$ so that the summation can be exact as long as no overflow occurs" (p. 726) is that inequality with the headroom term made explicit. Once it holds, the accumulation is addition in $\mathbb Z$ — associative and commutative — so **the order of accumulation cannot change the result**. That is the whole reason [[Exact Accumulators]] exist, arrived at here for free rather than through a Kulisch-style long accumulator: a $q$ of 24 or 32 bits is already long enough to be exact for the $N$ that occurs, so no rounding-order reproducibility problem exists inside a layer. The compressor tree implementing $\Sigma$ can therefore be reassociated arbitrarily for delay ([[Compressor Trees]]) without a single word of error analysis.

**The wide accumulator is free because $Y$ never leaves the operator.** The two pressures on a DNN accelerator are memory footprint and memory traffic, and traffic dominates energy and performance (pp. 723–724). $Y$ is consumed by the activation function in the same cycle it is produced and is never stored, so the extra $q-n$ bits cost **zero** memory traffic — the thing being optimised is untouched. Their area cost is small for the same structural reason: there is one activation function and one requantisation per $N$ multiplications and $N$ additions, so amortised over the layer the wide word is a rounding error in the cost model (p. 726). This is why the general engineering instinct to narrow every intermediate is exactly wrong here.

**What all of that buys is a stated bit-exactness result.** With 8-bit weights and biases, exact 16-bit products, and a 24-bit $Y$, the hardware **matches a binary32 simulation of the same 8-bit data**, as long as no overflow occurs (p. 726). The comparison is against binary32 with low-precision weights fed in and quantization layers behind the activation functions — that is, against the software model an ML engineer actually trains and evaluates. The integer datapath is not an approximation of that model; it is that model.

> [!important] Exact with respect to the quantized network, not with respect to anything anyone wanted.
> Zero ulp inside the dashed box says nothing about the network's answers. All the error lives at the two boundaries: the quantization of $W$ and $X$ on the way in, and the requantisation $q\to n'$ on the way out ([[Requantization Unit]]). Those errors have no bound — the specification of a DNN is a task-level metric measured against a binary32 reference, not an interval (p. 724) — so the machinery of [[Error Analysis]] has nothing to propagate here. What exactness buys is that the hardware and the software model agree, which makes the *measured* accuracy of the quantized network a property you can trust and iterate on. Without it, every accuracy regression has two possible causes.

**On FPGA the width rule is a direct LUT bill; on ASIC it is not.** A DSP block holds a multiplier of roughly $18\times18$ bits ([[FPGAs]]), so an $8\times8$ int8 MAC wastes most of one, and heavily quantized networks abandon DSP blocks and build both $\times$ and $\Sigma$ out of LUTs and the hard carry chain. There the accumulator width is linear cost you can count: an adder at 16-bit activations runs about 16 LUTs (p. 748), so every bit of $q$ is a LUT per accumulation, replicated across the array. On ASIC the wide accumulator is a few extra full-adder cells in a tree whose depth is $O(\log N)$ regardless, and the choice barely registers. The consequence is that the FPGA designer is the one tempted to shave $q$, and is exactly the one who should not: $q$ is what makes the bit-exactness claim true, and it is the cheapest bit in the datapath per unit of confidence.

$$\boxed{\ p = m+n,\qquad q \ \ge\ p + \lceil\log_2 N\rceil\ \Longrightarrow\ Y=\sum_{j=1}^{N} W_jX_j + B\ \text{ is exact}\ }$$

**When it breaks.**

- **$q = p$.** Read literally, the book's "$q\ge p$" is satisfied by $q=p$, which overflows for any $N>1$. The headroom term is not optional, and overflow in two's complement is silent — the operator goes from bit-exact to catastrophically wrong with no flag.
- **The lanes do not share an ulp.** Summing before rescaling is only legal because one format covers the whole layer's weights and one covers the whole layer's activations. Per-channel or per-tensor scales that differ *within* a dot product make the $N$ products incommensurate; they must be aligned first, and the alignment shift is where rounding re-enters.
- **The accumulator is floating point.** Everything above is a property of integer accumulation. In bfloat16 or FP8 the sum is not associative, order matters again, and the exactness claim reverts to the ordinary error-budget analysis of [[Exact Accumulators]] — which is the situation during training, not inference.
- **Below about 5 bits the multiplier stops existing.** At ternary or binary weights $\times$ degenerates to a negation or an XNOR and $\Sigma$ to an adder tree or a population count ([[Ternary MAC Unit]], [[XNOR-Popcount Neuron]]). The width rule survives — the products are still exact — but the cost model this note optimises has nothing left to optimise.
- **Fast convolution competes rather than composes.** Winograd's pre-additions grow the operands by a bit each, so the $\odot$ multipliers get slightly wider even as they get fewer; and since a $p$-bit multiplier costs roughly $p$ adders, the trade of one multiply for three adds stops paying as $p$ falls toward int8 ([[Winograd Convolution]]).
- **Exactness is not accuracy.** Nothing here predicts top-1. Shrink $m$ and $n$ until the task metric moves, then stop ([[Choosing a Deep Learning Datapath]]).

**RTL (Spade).**

```spade
/// One exact product of the neuron: an m-bit weight by an n-bit activation is
/// p = m + n bits, then sign-extended into the q-bit accumulator.
fn product(w: int<8>, x: int<8>) -> int<24> {
    let p: int<16> = w * x;
    sext(p)
}

/// Y = sum_j W_j X_j + B for N = 4 taps, m = n = 8, p = 16, q = 24.
/// Every term is exact and the accumulator cannot overflow, so Y is exact.
entity neuron4(
    w0: int<8>, w1: int<8>, w2: int<8>, w3: int<8>,
    x0: int<8>, x1: int<8>, x2: int<8>, x3: int<8>,
    b: int<24>,
) -> int<24> {
    product(w0, x0) +. product(w1, x1)
        +. product(w2, x2) +. product(w3, x3) +. b
}
```

`product` is the $\times$ box: `int<8> * int<8>` is `int<16>` by Spade's own width rule, which *is* $p=m+n$ enforced by the type system, and `sext` is the sign-extension into the accumulator lane — a zero-extend here would silently make every negative product enormous. `neuron4` is the $\Sigma$ box: the terms use the wrapping `+.` rather than the widening `+` precisely because the exactness argument has already proved that no wrap can occur, $4\cdot 2^{14}+|B| < 2^{23}$, so a fixed 24-bit adder chain is enough. All of it is combinational — a `fn` may hold neither `reg` nor `inst`, and $Y$ is by construction a value that never gets stored. Synthesis will not build the four chained adders written here; a compressor tree flattens all five terms into one carry-save heap and one final adder, which is legal only because of the associativity the exact accumulator guarantees.

Verified by simulation against a behavioural reference: 5009 vectors, including asymmetric lane pairings that a bit-reversed or lane-swapped datapath would fail, both signed extremes $\pm 2^{14}$, and a 5000-case random sweep.

**Related Notes.**

- [[Multipliers]] – depends-on: the $\times$ box, and the only reason $p=m+n$ is affordable at $m=n=8$.
- [[Compressor Trees]] – supports: the $\Sigma$ box, reassociable for delay exactly because the accumulator is exact.
- [[Exact Accumulators]] – compares: the same guarantee bought by a long accumulator, where here the natural $q$ is already long enough.
- [[Fixed-Point Representations]] – depends-on: the format whose scaling factor this datapath is allowed to ignore entirely.
- [[Error Analysis]] – counter-example: the interval-propagation method that has nothing to propagate once the operator is exact and the specification is a task metric.
- [[ReLU Unit]] – extends: the unary stage that consumes $Y$ and makes the free choice of scaling legal in the first place.
- [[Requantization Unit]] – extends: the $q\to n'$ step where all of this note's rounding is concentrated.
- [[Ternary MAC Unit]] – counter-example: the same neuron once the weights are $\{-1,0,+1\}$ and the multiplier disappears.
- [[XNOR-Popcount Neuron]] – counter-example: the limit in which both the multiplier and the adder tree are gone.
- [[TPU]] – extends: this neuron at $p=16$, $q=32$, $N=256$, replicated 65 536 times into a systolic array.
- [[Choosing a Deep Learning Datapath]] – compares: where int8 MAC sits against every other format in the chapter.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §24.1 "Neural Network Overview", pp. 708–715 (eq. 24.1, the neuron; eqs. 24.5–24.6; activation functions, pp. 712–713).
- §24.3 "Number Formats", pp. 723–724 (memory footprint and traffic; the binary32 reference; data format against compute format).
- §24.3.1.1 "Fixed-Point Formats for Inference", pp. 725–726 (Fig. 24.9 (b); PTQ to 16 bits; per-layer formats to 8 bits; $p=m+n$, $q\ge p$, and the 8/16/24 bit-exactness result).
- §24.6.1 "TPU", p. 742 (8-bit operands, 16-bit products, 32-bit 256-deep accumulators).
- §24.6.4, p. 748 (~16 LUTs per 16-bit adder on FPGA).
