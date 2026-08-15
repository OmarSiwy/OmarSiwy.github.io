---
title: Arithmetic for Deep Learning
description: "Map of the 16 Arithmetic for Deep Learning notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, arithmetic-for-deep-learning, hub]
aliases:
  - Quantization
  - Fast Convolution Algorithms
  - Arithmetic for Deep Learning
  - "6.2) Arithmetic for Deep Learning"
---

# Arithmetic for Deep Learning

**The specification.** Input: an activation tensor and a weight tensor, each in a format you get to choose — anything from binary32 down to one bit. Output: an activation tensor, same freedom. Accuracy promised: **none, in ulp.** The contract is a *task-level* metric — top-1 accuracy, mAP, IoU — scored against a binary32 reference implementation (p. 724). What is optimised is energy per multiply-accumulate and **memory traffic**, then throughput; area only insofar as it buys those two.

Every circuit below is one answer to the question that specification leaves open — *what does the multiplier become?* — and the answer is decided less by gate count than by whether the weights are allowed to change after synthesis.

> [!important] There is no $\varepsilon$ to budget against, and that is the whole topic
> Everywhere else in this vault the specification is an interval: produce $\hat y$ with $|\hat y - f(x)| \le \varepsilon$, and [[Error Accuracy]] propagates $\varepsilon$ backwards to size every intermediate signal. Here the target function $F^*$ is *unknown* — defined only by a finite table of human-labelled examples (p. 714) — and the network is already an approximation of it that nobody can bound. So the specification degenerates to: **shrink the arithmetic until the measured task metric drops, then stop.** Individual outputs are permitted to be wrong.
>
> Under quantization-aware training the network is then *retrained around the arithmetic* (p. 733): the target moves to fit the datapath. You cannot retrain $\sin x$ to be friendlier to your table, which is why this chapter reaches 1-bit operands while [[Polynomial Approximation]] fights for one last ulp.
>
> What does transfer: once the formats at a layer's boundary are fixed, the *inside* of the layer is classic exact budget-driven arithmetic. All the error lives at the boundaries, in the requantisation between one layer and the next.

Two splits organise the formats and therefore the reading. **Training vs. inference:** training needs *dynamic range* because gradient magnitudes are unpredictable, so it runs in floating point (bfloat16, FP8) — no note below is a training datapath. Inference needs only *precision* over a known range, so 8 bits of fixed point suffice provided training was directed accordingly (p. 724). **Data format vs. compute format:** what is stored and what the operator works in are different, and the internal one is always wider (p. 724).

- **[[Choosing a Deep Learning Datapath]]** – the trade-off table across all 16, with the source's own accumulator widths, LUT counts, frame rates and accuracy deltas, plus the architecture taxonomy of Fig. 24.12. Read it first if you are picking a datapath, last if you are learning them. It is deliberately the only place those numbers live.

### One layer, end to end

Read these four in order; together they are a complete inference layer, and everything after them is a substitution into one of the four.

- [[Quantized MAC Neuron]] – the integer sum-of-products at the centre of everything: exact $p = m+n$ products into a $q$-bit accumulator, so the layer is bit-exact against a binary32 simulation of the same quantized data.
- [[Requantization Unit]] – shift, round, saturate, narrow. The single point at which a DNN layer introduces any error at all; the reason the accumulator's extra width costs no memory traffic.
- [[ReLU Unit]] – a sign test and a mux, but read it for *why*: piecewise linearity is what lets a rescaling be pushed through the nonlinearity and absorbed downstream, which is what makes free choice of per-layer scaling factors legal everywhere else.
- [[Convolution Line Buffer]] – how the operands arrive. Two row FIFOs and nine registers present a fresh $3\times3$ window every cycle, and this is the canonical stream-architecture building block (Fig. 24.14).

### Reductions between and after layers

- [[Max Pooling Unit]] – a comparator tree over a strided window; the variant modern CNNs actually use, and the one that costs no arithmetic.
- [[Average Pooling Unit]] – an add tree and a shift; cheaper in LUTs than the comparators, and mostly abandoned. Read it against max pooling, not alone.
- [[Softmax Unit]] – exponentials plus a reciprocal, the most expensive layer in the network.
- [[Argmax Unit]] – and the reason you usually get to delete it: softmax is monotonic, so if you only need the winning class a comparator tree suffices.

Batch normalization has no note because it has no inference hardware. At training time $\mu_B,\sigma_B$ change every batch, but at inference they are constants, so the whole layer collapses to one affine map that folds into the preceding layer's weights and bias (p. 721). It reappears only folded — as a per-neuron threshold in the binarized neuron below, as tabulated coefficients in the LogicNet one.

### Fewer multiplications, same arithmetic

- [[Winograd Convolution]] – pre-add, multiply element-wise, post-add: provably minimal in multiplications, the same identity family as Karatsuba, and a trade that stops paying once the multiplier is small enough that three adders cost more than one multiply. It therefore *competes* with everything in the next section.

### The multiplier disappears

Each of these deletes the multiplier by a different mechanism; they are alternatives, not a progression, and all of them require quantization-aware training.

- [[Ternary MAC Unit]] – weights in $\{-1,0,+1\}$, so a multiply is an add, a subtract, or no hardware at all. The zeros are the point: sparsity is what makes an unrolled million-MAC CNN fit an FPGA.
- [[XNOR-Popcount Neuron]] – one bit per operand. The multiply is an XNOR gate, the adder tree is a population counter, the activation is one unsigned comparator. Nothing recognisable as an arithmetic operator survives.
- [[Log-Activation Shift Neuron]] – logarithmic activations against linear weights turn the multiplier into a barrel shifter, with a leading-one detector re-encoding the result.
- [[LNS Neuron]] – both operands in the log domain, so the multiply is an addition; an antilog table returns to fixed point so the *sum* stays exact. Read it for how the two conversions are the only rounding in the path.
- [[LogicNet Neuron]] – the limit case: products, accumulation, batch norm and activation all tabulated into one LUT6, so cost depends only on the input and output word sizes and never on what the neuron computes.

### Where the target changes the answer

- [[TPU]] – the generic end of the spectrum, and the concrete instance of the $q \ge p$ rule at scale: a $256\times256$ systolic array of int8 MACs feeding 32-bit accumulators, where 16-bit operands are emulated in time.
- [[Digit-Serial Adder]] – the specialised end. Pooling cuts the data rate to a quarter and then a sixteenth, and this is how you spend that slack: fewer bits of adder per operation instead of idle hardware. Read it after the ternary unit above, where the need arises.

FPGA mapping is not a section of its own because it is not separable from the circuits — DSP blocks are abandoned below int8, ternary carry-chain adders make $X+Y+Z$ cost what $X+Y$ costs, and the LUT is small enough to *be* the neuron. Each note says so where it matters; [[FPGAs]] and [[Lookup-Tables]] carry the fabric details.

### Where this sits

[[Number Formats]] fixes the encodings and [[Error Accuracy]] owns the ulp reasoning that this topic uniquely does *not* get to use. Upstream the components are ordinary: [[Multipliers]] and [[Sums of Weighted Bits]] build the MAC, [[Adders]] the accumulator, [[Comparators]] the pooling and argmax trees, [[Shifters]] the requantiser, and [[Multiplication by Constants]] every unrolled layer whose weights are baked into the netlist. Downstream, [[Floating-Point Exponential]] and [[Dividers]] are what softmax costs, and [[Exact Accumulators]] is the general treatment of the summation-order problem this topic solves by brute width.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, **Chapter 24, "Arithmetic for Deep Learning", pp. 707–751**.

- §24.1 Neural network overview — pp. 708–715
- §24.2 Convolutional neural networks — pp. 715–723
- §24.3 Number formats — pp. 723–730
- §24.4 Training — pp. 730–734
- §24.5 Implementation aspects — pp. 734–741
- §24.6 Case studies — pp. 741–751
