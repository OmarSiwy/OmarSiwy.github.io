---
title: Requantization Unit
description: "Shift, round, saturate and narrow the wide accumulator back to the layer's output word size, folded into the ReLU that follows it — the single point where all of a DNN layer's error is introduced."
kind: circuit
source: "ASA §24.3.1.1, pp. 725-726; Fig. 24.9(b), p. 725"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, quantization, rounding, saturation, relu, fixed-point]
aliases:
  - Requantization
  - Requantisation Unit
  - Requantiser
  - Requantize Unit
  - Output Requantization
  - Quantization Layer
  - Rescale and Saturate Unit
---

# Requantization Unit

The stage that converts a layer's exact wide accumulator into the next layer's narrow activation format — a sign test, a rounding add, a per-layer right shift and a saturating narrow — and the only block in a quantized DNN layer that destroys information.

```tikz title="Requantization unit: ReLU, round-to-nearest, per-layer right shift and saturating narrow, expanded out of the ReLU box of Fig. 24.9(b)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,x=1cm,y=1cm,
  blk/.style={draw,rounded corners=1pt,fill=blue!6,minimum width=1.5cm,minimum height=0.7cm}]

% ---- the accumulator that feeds it (left end of Fig. 24.9b) ----
\node[blk,minimum width=1.0cm] (sum) at (-0.4,0) {$\Sigma$};
\node[anchor=east] at (-1.6,0) {products $P$};
\draw[->] (-1.55,0) -- (sum.west);

% ---- ReLU: sign bit selects zero ----
\node[blk] (relu) at (2.6,0) {ReLU};
\draw[->] (sum.east) -- (relu.west);
\node[anchor=south] at (0.7,0.08) {$Y$};
\node[anchor=north] at (0.7,-0.08) {$q$, signed};
\node[anchor=north,align=center] at (2.6,-0.5) {$y_{q-1}\,?\,0:Y$};

% ---- round to nearest: add one half ulp of the output format ----
\node[blk,minimum width=1.0cm] (add) at (5.2,0) {$+$};
\draw[->] (relu.east) -- (add.west);
\node[anchor=south] at (3.95,0.08) {$U$};
\node[anchor=north] at (3.95,-0.08) {$q{-}1$};
\node[anchor=north,align=center] at (5.2,-0.5) {round};

\node[blk,minimum width=1.6cm] (half) at (5.2,1.7) {$2^{s-1}$};
\draw[->] (half.south) -- (add.north);

% ---- barrel shift by the per-layer exponent ----
\node[blk] (sh) at (8.1,0) {$\gg s$};
\draw[->] (add.east) -- (sh.west);
\node[anchor=south] at (6.85,0.08) {$V$};
\node[anchor=north] at (6.85,-0.08) {$q$};
\node[anchor=north,align=center] at (8.1,-0.5) {drop $s$ low bits};

% ---- saturate and narrow ----
\node[blk,minimum width=1.9cm] (sat) at (11.2,0) {saturate};
\draw[->] (sh.east) -- (sat.west);
\node[anchor=south] at (9.75,0.08) {$W$};
\node[anchor=north] at (9.75,-0.08) {$q$};
\node[anchor=north,align=center] at (11.2,-0.5) {$W>2^{n'}{-}1\,?$};

\draw[->] (sat.east) -- (13.4,0) node[anchor=west] {$X'$};
\node[anchor=north] at (12.95,-0.08) {$n'$};

% ---- per-layer shift constant, the only programmable input ----
\draw (2.6,3.4) node[anchor=east] {$s$ (per layer, $\lceil\log_2 q\rceil$ bits)} -- (8.1,3.4);
\draw[->] (5.2,3.4) -- (half.north);
\draw[->] (8.1,3.4) -- (8.1,0.36);
\node[circ,scale=0.5] at (5.2,3.4) {};

% ---- dashed box around the requantize unit proper ----
\draw[dashed] (1.35,-1.15) rectangle (12.6,2.6);
\node[anchor=south west] at (1.4,2.65) {requantization unit};

\end{circuitikz}
\end{document}
```

*The ReLU box of Fig. 24.9 (b), p. 725, opened up; signal names and widths follow the $m,n,p,q,n'$ labelling of that figure.*

**Everything upstream of this block is exact, which is what makes the block worth isolating.** With $m$-bit activations and $n$-bit weights the products are exact at $p=m+n$ bits, and an accumulator of $q\ge p$ bits — plus $\lceil\log_2 N\rceil$ headroom for $N$ terms — makes the summation exact as long as it does not overflow (p. 726). Concretely, 8-bit weights and activations, exact 16-bit products and a 24-bit $Y$ reproduce a binary32 simulation of the same 8-bit data *bit for bit*. $Y$ never leaves the operator, so those extra bits cost no memory traffic, and since one activation serves many multiply-accumulates their contribution to area is small. The consequence is sharp: a quantized layer performs exactly **one** rounding, and it is here. The interval reasoning of [[Error Accuracy]] applies up to $Y$ and stops at $X'$, because past this point the specification is a task metric with no ulp bound at all.

**The format change is a difference of exponents, and therefore a shift.** Under post-training quantization every fixed-point format collapses to a plain integer, because all computation before the activation is linear and ReLU is piecewise linear, so any consistent scaling is absorbed (p. 726). Write the layer's chosen scalings explicitly: an activation code $X$ denotes the value $X\cdot 2^{-a}$ and a weight code $W$ denotes $W\cdot2^{-w}$. Multiplication of represented values multiplies the scalings, $2^{-a}\cdot2^{-w}=2^{-(a+w)}$, and addition preserves a common scaling by distributivity, so the accumulator code $Y$ denotes $Y\cdot2^{-(a+w)}$. If the next layer's activation format is $2^{-a'}$, the code it wants is

$$X' \;=\; Y\cdot 2^{-(a+w)}\cdot 2^{\,a'} \;=\; Y\cdot 2^{-s},\qquad s = a+w-a' .$$

All three exponents are compile-time choices — the book's per-layer formats, what other communities call block floating point with a per-*layer* exponent that is never adjusted at runtime — so $s$ is a constant, and multiplication by $2^{-s}$ is a right shift. There is no multiplier anywhere in this block.

**Round rather than truncate, because truncation is a biased error and this is the only error in the layer.** Discarding $s$ bits subtracts a quantity roughly uniform on $[0,2^{s})$, an error of mean $-2^{s-1}$ — a systematic negative offset applied identically at every neuron of the layer, which is a shift of the layer's bias rather than noise, and which accumulates layer after layer. Round-to-nearest removes it by the standard identity $\lfloor (U+2^{s-1})/2^{s}\rfloor = \lfloor U/2^{s}\rceil$ (see [[Rounding]]): add half an output ulp, then truncate. Two things make that add cheap. First, the ReLU has already forced $U\ge0$, so there is no sign-dependent correction term and round-half-up *is* round-to-nearest. Second, the addend $2^{s-1}$ has a single bit set, so carries can only start at position $s-1$: the "adder" is an incrementer over the top $q-s$ bits, not a $q$-bit adder.

> [!important] The rounding add can be deleted entirely by pre-loading the accumulator
> Addition is associative, so $2^{s-1}$ may be injected anywhere in the summation — in particular into the accumulator's initialisation, alongside the layer's bias term, where it costs nothing because that port already exists. The reordering is legal even though it moves the constant to the *wrong side* of the ReLU: for every $Y<0$ we have $\lfloor (Y+2^{s-1})/2^{s}\rfloor \le 0$, so clamping at zero *after* the shift recovers exactly the same result as testing the sign of $Y$ before it. The price is that the datapath stays signed through the shifter — an arithmetic right shift rather than a logical one — and the ReLU becomes a clamp on the shifted value. On a machine whose accumulator already loads a constant bias, that trades a whole incrementer for one sign bit.

**Saturate rather than wrap, and pick $s$ from the observed distribution rather than the worst case.** The worst-case-safe choice $s=q-n'$ guarantees $W<2^{n'}$ and never clips — and wastes almost the entire output range, because real activations occupy a small fraction of the accumulator's reachable interval and would all land in the bottom few codes. Layer exponents are therefore calibrated on a percentile of the measured activation distribution, which makes $W\ge2^{n'}$ a designed-for event rather than a bug. Wrapping is not an option: modular reduction maps a large activation to an arbitrary small one, inverting that feature's contribution to the next layer, whereas clipping is monotone and merely compresses the tail — and under quantization-aware training the network is retrained *around* the clipping and learns to live inside it. Detection is an OR-reduction of the discarded high bits $W_{n'},\dots,W_{q-1}$ driving an $n'$-bit mux to all ones. Because the ReLU has already made the value unsigned there is only one bound to test; a leaky-ReLU or a linear output layer needs a two-sided signed clamp and roughly double the logic.

**Trace the widths once, end to end.** $Y$ is $q=24$ bits signed. After the ReLU, $U$ is non-negative and its magnitude fits in $q-1=23$ bits. $U+2^{s-1}$ needs at most $q$ bits, since both operands are below $2^{q-1}$. The shift preserves width, so $W$ is $q$ bits of which only the top $q-s$ can be non-zero and the low $n'$ of *those* are the answer; the $s$ bits shifted out are the entire information loss of the layer. $X'$ is $n'=8$ bits unsigned. The control input $s$ needs $\lceil\log_2 q\rceil=5$ bits, and only when it is programmable at all. See [[Fixed-Point Representations]] for the $\mathrm{ufix}/\mathrm{sfix}$ notation these widths instantiate.

**On FPGA a compile-time $s$ makes most of this block disappear; on a generic engine it does not.** In a stream/dataflow architecture (Fig. 24.13, p. 736) there is one hardware unit per layer, so $s$ is baked into the netlist: the shift becomes routing — zero LUTs, zero delay — the rounding constant folds into the accumulator's reset value on the hard carry chain (see [[FPGAs]]), and only the saturation survives, as roughly $n'$ LUTs plus a shallow OR tree. In a matrix-of-processing-engines accelerator the same Activation & Pooling unit must serve every layer of every network, so $s$ arrives from a control register and you pay a genuine $q$-bit barrel shifter, $O(q\log q)$ muxes deep in $\log q$ stages — the [[TPU]] case (p. 742). On ASIC the same split holds, minus the free routing. Either way the unit is amortised over the whole $N$-term dot product it terminates, which is why the book dismisses its cost in a single sentence.

> [!warning] The general affine rescale is not covered in the source
> This note follows the book's model, in which per-layer scalings are free to choose and are therefore chosen as powers of two, making the rescale a pure shift. Production int8 pipelines commonly use per-tensor *affine* quantization with an arbitrary real scale ratio and a non-zero zero-point, implemented as a multiply by a fixed-point constant $M_0\in[\tfrac12,1)$ followed by a shift, often with a distinct $M_0$ per output channel. That variant puts a real multiplier and a constant memory inside this block, and neither its cost nor its accuracy is analysed in Ch. 24 — needs outside research.

$$\boxed{\;X' \;=\; \min\!\Big(2^{n'}-1,\;\Big\lfloor \tfrac{\max(0,\,Y)\;+\;2^{\,s-1}}{2^{\,s}} \Big\rfloor\Big),\qquad s=a+w-a'\;}$$

**When it breaks.**

- **$s=0$.** The constant $2^{s-1}$ is not an integer and the correct behaviour is to add nothing. Hardware must special-case it — in the RTL below `(1 << s) >> 1` yields $0$ without needing a comparator.
- **$s \ge q$.** Everything shifts out and the layer emits zeros. Not a corner case to guard, but a symptom that the layer exponents were calibrated wrong.
- **Accumulator overflow.** Every exactness claim above is conditional on $q$ being wide enough for $N$ terms. If $Y$ wraps, this block faithfully rescales garbage and the saturation logic will not catch it, because a wrapped accumulator looks like a small legal value. The guard belongs upstream — see [[Quantized MAC Neuron]].
- **Non-ReLU activations.** Sigmoid, tanh and softmax are not piecewise linear, so the scaling factors stop being absorbable and this block is replaced by a table or a polynomial; the fold-into-ReLU argument evaporates. [[Softmax Unit]] is the usual offender at the output layer.
- **Ternary and binary layers.** At $n'=1$ or $2$ the shift-and-saturate degenerates into a threshold comparison and the whole block collapses to one comparator — see [[XNOR-Popcount Neuron]].
- **Training.** None of this applies. Gradients need dynamic range rather than precision, so training datapaths use floating point or LNS and have no requantization stage of this shape at all.

**RTL (Spade).**

```spade
// ReLU + requantize: exact int<Q> accumulator -> uint<N> activation
fn requantize<#uint Q, #uint N>(y: int<Q>, s: uint<Q>) -> uint<N>
where Q >= N else "output must be narrower than the accumulator"
{
    // ReLU: the sign bit alone selects zero, leaving a non-negative magnitude
    let u: uint<Q> = if y.sign_bit() { 0 } else { y.as_uint() };
    // round to nearest: add half an output ulp; s = 0 correctly adds nothing
    let one: uint<Q> = 1;
    let half: uint<Q> = (one << s) >> 1;
    let v: uint<{Q + 1}> = u + half;
    let sh: uint<{Q + 1}> = zext(s);
    let w: uint<{Q + 1}> = v >> sh;
    // saturate, then narrow
    let maxv: uint<{Q + 1}> = zext(~(0 as uint<N>));
    if w > maxv { ~(0 as uint<N>) } else { trunc(w) }
}
```

`y`, `u`, `v`, `w` are the four labelled arrows of the diagram in order — accumulator output, ReLU wire, rounding-adder output, shifter output. Everything is a `fn`, so the unit is purely combinational: one mux level for the ReLU, one incrementer, one barrel shifter and one compare-and-mux, and the pipeline registers a real design inserts here belong to the accumulator, not to this block. Two width notes: `u` is declared `uint<Q>` although the diagram says $q-1$, because the top bit is provably zero after the ReLU but the type system cannot see that, and `v` is `uint<{Q+1}>` because Spade's `+` always widens — synthesis deletes both dead bits. The shift amount is typed `uint<Q>` only because Spade requires both operands of `<<` to share a type; the wrapper below narrows it to the $\lceil\log_2 q\rceil$ bits that physically exist, and when $s$ is a compile-time constant the shifter is not built at all.

Simulated through the concrete instantiation `entity requant24_8(y: int<24>, s: uint<5>) -> uint<8> { requantize::<24,8>(y, zext(s)) }`, at the book's illustrative widths (8-bit data, exact 16-bit products, 24-bit accumulator, p. 726). 5014 vectors, zero mismatches, against an integer behavioural reference $\min(255,\lfloor\max(0,Y)/2^{s}\rceil)$: 14 named cases — ReLU on $-1$ and on $-2^{23}$; the round-half-up boundary $2047$ versus $2048$ at $s=12$; saturation at $2^{20}$ and at $2^{23}-1$; the pass-through $s=0$; and the asymmetric pair $Y=1$ versus $Y=4096$, which a bit-reversed shifter would swap — plus 5000 random $(Y,s)$ pairs over $s\in[0,23]$.

**Related Notes.**

- [[ReLU Unit]] – extends: the activation this block is fused into; alone it is a sign-bit mux, and everything else here rides along on the same stage.
- [[Quantized MAC Neuron]] – depends-on: produces the exact wide $Y$, and owns the no-overflow condition that this block's exactness argument assumes.
- [[Rounding]] – depends-on: supplies the add-half-then-truncate identity and the bias argument for preferring it to plain truncation.
- [[Fixed-Point Representations]] – depends-on: the scaling exponents $a$, $w$, $a'$ whose difference is the shift amount.
- [[Normalizers]] – compares: the same barrel shifter, driven by a data-dependent leading-zero count instead of a per-layer constant — exactly the hardware this block avoids paying for.
- [[Truncated Multipliers]] – compares: the other way to discard low bits, namely never computing them, which is unavailable here because those bits were needed for the accumulation to be exact.
- [[TPU]] – supports: the Activation & Pooling unit, where this block is programmable rather than hard-wired.
- [[Choosing a Deep Learning Datapath]] – compares: how $n'$ and $s$ trade against memory traffic once the whole network is scored.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 24 "Arithmetic for Deep Learning":

- §24.3 Number Formats, p. 725 — Fig. 24.9, six proposed neuron datapaths; panel (b) "all-linear quantized to (small) integers" with the $m,n,p,q,n'$ width labels, redrawn above.
- §24.3.1.1 Fixed-Point Formats for Inference, p. 726 — PTQ of all weights to one 16-bit format ($m=n=p'=n'=16$ on Fig. 24.9b); scaling factors irrelevant because everything before the ReLU is linear and the ReLU is piecewise linear, hence fixed-point reduces to integers; per-layer custom formats down to 8 bits, called dynamic fixed point or block floating point (footnote 4); the width rules $p=m+n$ and $q\ge p$; the 8/16/24-bit illustration matching a binary32 simulation; "the quantization to the output format (of activations) is also easy to integrate in the ReLU operation", and the amortisation of its cost over many multiplications and additions.
- §24.3.1.2 Ternary and Binary Formats, pp. 726-727 — where $n'$ falls to one or two bits and this block degenerates to a threshold.
- §24.5.1 Architectures for Inference, pp. 735-736 — Fig. 24.13, the stream/dataflow class with one hardware unit per layer, which is what makes $s$ a compile-time constant.
- §24.6.1 Google's TPU Family, p. 742 — Fig. 24.16; the 32-bit accumulators and the Activation & Pooling unit that must serve every layer, hence a programmable shift.
