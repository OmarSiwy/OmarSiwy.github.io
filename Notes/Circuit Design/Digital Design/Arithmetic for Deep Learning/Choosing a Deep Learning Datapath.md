---
title: Choosing a Deep Learning Datapath
description: "Trade-off table across the 16 Arithmetic for Deep Learning circuits, with the source's own numbers — and the two inequalities that decide which of them you get to use."
kind: comparison
source: "ASA Ch. 24, pp. 707-751"
status: seed
spade: n/a
tags: [digital, arithmetic-for-deep-learning, comparison, quantization, fpga]
aliases:
  - Choosing a DNN Datapath
  - Choosing a Neural Network Datapath
  - DNN Datapath Trade-offs
  - Deep Learning Datapath Comparison
---

# Choosing a Deep Learning Datapath

Every circuit in this topic is one answer to a single question — *what does the multiplier become?* — and the answer is fixed not by gate count but by whether the weights are allowed to change after synthesis.

```tikz title="The three inference architecture classes and which circuits inhabit each"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw[->,>=latex,thick] (0,0) -- (14.4,0);
  \node[anchor=north] at (0.2,-0.15) {\footnotesize generic, weights in memory};
  \node[anchor=north] at (14.2,-0.15) {\footnotesize specialised, weights in the netlist};

  \draw (0.0,0.6) rectangle (4.2,1.5);
  \node[align=center] at (2.1,1.05) {matrix of engines\\\footnotesize runtime grows with the net};
  \draw (5.1,0.6) rectangle (9.3,1.5);
  \node[align=center] at (7.2,1.05) {stream / dataflow\\\footnotesize one unit per layer};
  \draw (10.2,0.6) rectangle (14.4,1.5);
  \node[align=center] at (12.3,1.05) {unrolled\\\footnotesize one unit per neuron};

  \draw (2.1,0.6) -- (2.1,0.15); \node[circle,fill,inner sep=1.4pt] at (2.1,0.0) {};
  \draw (7.2,0.6) -- (7.2,0.15); \node[circle,fill,inner sep=1.4pt] at (7.2,0.0) {};
  \draw (12.3,0.6) -- (12.3,0.15); \node[circle,fill,inner sep=1.4pt] at (12.3,0.0) {};

  \node[anchor=north west,align=left] at (0.0,-0.85) {\footnotesize TPU\\\footnotesize Quantized MAC Neuron\\\footnotesize Requantization Unit};
  \node[anchor=north west,align=left] at (5.1,-0.85) {\footnotesize Convolution Line Buffer\\\footnotesize XNOR-Popcount Neuron\\\footnotesize Winograd Convolution\\\footnotesize Max / Average Pooling};
  \node[anchor=north west,align=left] at (10.2,-0.85) {\footnotesize Ternary MAC Unit\\\footnotesize Digit-Serial Adder\\\footnotesize LogicNet Neuron};

  \draw[<->,>=latex] (0.2,-3.3) -- (14.2,-3.3);
  \node[anchor=south west] at (0.2,-3.25) {\footnotesize weights reprogrammable};
  \node[anchor=south east] at (14.2,-3.25) {\footnotesize recompile to change a weight};
  \node[anchor=north west] at (0.2,-3.35) {\footnotesize 8-bit operands, 32-bit accumulators};
  \node[anchor=north east] at (14.2,-3.35) {\footnotesize 1--2-bit operands, no multiplier};
\end{circuitikz}
\end{document}
```

*Class boundaries and the generic-to-specialised ordering after Fig. 24.12, p. 734; the placement of the individual circuits on the axis is my own reading of where each case study sits.*

**Read the multiply column first — it is the only column that changes cost by orders of magnitude.** The rows below are ordered by decreasing operand width, which is the same order as the diagram's axis and very nearly the same order as decreasing accuracy.

| Circuit | Multiply becomes | Accumulate becomes | Numbers the source states | p. |
| --- | --- | --- | --- | --- |
| [[Quantized MAC Neuron]] | an $m\times n$ integer multiplier | a $q$-bit adder tree, $q \ge p + \lceil\log_2 N\rceil$ | 8-bit weights and activations $\Rightarrow$ exact 16-bit products, **24-bit** accumulator matches a binary32 simulation of the same data; all weights to one **16-bit** format with no accuracy loss (PTQ); per-layer 8-bit with slight degradation; **5 to 8** weight bits under QAT comparable to binary32 | 726 |
| [[TPU]] | a $256\times256$ systolic array of int8 MACs | 256-element **32-bit** accumulations | **65 536** MAC units; 8-bit signed or unsigned inputs, **16-bit** products; 256 values read and written per cycle; a $B\times256$ by $256\times256$ product takes **$B$** cycles; 16-bit on one operand **halves** the speed, on both **quarters** it; ~a dozen instructions | 742 |
| [[Winograd Convolution]] | $n=(m+r-1)^d$ multiplies instead of $(mr)^d$ | pre- and post-addition matrices | $F(2,2)$: 4 mult / 2 add $\to$ **3 mult / 5 add**. $F(2,3)$: 6/4 $\to$ **4/11** (12 without CSE). 2-D $F(2^2,2^2)$: 16/12 $\to$ **9/16** (23). 2-D $F(2^2,3^2)$: 36/32 $\to$ **16/77** (92). One $p$-bit multiplier $\approx$ **$p$ adders** | 740–741 |
| [[LNS Neuron]] | one adder, plus log and antilog tables | an exact fixed-point sum after the antilog | "good accuracy" at **4 to 6** bit word sizes, at which point both tables are plain FPGA LUTs | 727–728 |
| [[Log-Activation Shift Neuron]] | a barrel shifter (log activations, linear weights) | an ordinary fixed-point adder tree, plus a leading-one detector on the way back | — | 727 |
| [[Ternary MAC Unit]] | nothing — an add, a subtract, or no hardware | the same adder tree, one node shorter per zero weight | VGG-7/CIFAR-10 needs **1 144 512** MACs; at 16-bit activations **~16 LUTs per adder** $\Rightarrow$ **~18 million LUTs**, against **~1.2 million** on an Ultrascale+ VU9P. After sparsity, CMVM and digit-serial: **66.6 % of LUTs, 41.6 % of FFs, 122 k frames/s, 30 µs latency**. A variable-weight ternary comparison point reaches **60 k frames/s** | 748–750 |
| [[XNOR-Popcount Neuron]] | **one XNOR gate** | a population counter, $S = 2\operatorname{popcnt}(P) - N$ | 1 bit per weight; activation + folded batch norm + bias collapse to **one unsigned threshold comparator**; a few percentage points of accuracy below binary32, ternary slightly better than binary | 726–727, 743–744 |
| [[LogicNet Neuron]] | nothing — the whole neuron is a table | nothing | a binarized **6-input, 1-bit-output** neuron is **one LUT6**; storage depends only on input and output word size, so **no QAT is needed**; complexity grows exponentially in input bits, so activations are held **below 4 bits**; experiments used **1 to 7** inputs and **1 to 3** activation bits; **~10× more neurons** in a binary net did not reach a 2-bit net's accuracy | 750–751 |

The plumbing around the neuron is a separate decision, and the source costs almost none of it:

| Circuit | Structure | Numbers the source states | p. |
| --- | --- | --- | --- |
| [[Requantization Unit]] | shift, round, saturate, narrow $q \to n'$ | — ("easy to integrate in the ReLU operation") | 725–726 |
| [[ReLU Unit]] | sign test + mux | — ("one ReLU for many additions and multiplications, so its contribution to the cost is very small") | 726 |
| [[Softmax Unit]] | $N$ exponentials + one reciprocal | — | 721–722 |
| [[Argmax Unit]] | comparator tree emitting a one-hot code | — (the classifier of Fig. 24.8 has $N=10$ outputs) | 722 |
| [[Max Pooling Unit]] | comparators only | — ("needs comparators only"; $2\times2$ stride-2 halves width and height, channel count untouched) | 719–720 |
| [[Average Pooling Unit]] | adder tree + right shift | — | 719–720 |
| [[Convolution Line Buffer]] | two row FIFOs + nine registers | **one activation per cycle** out of a $3\times3$ window | 736 |
| [[Digit-Serial Adder]] | one radix-$2^k$ digit per cycle, carry in a register | after the first pooling the rate is $1/4$, so a **radix-16** adder takes **4 cycles** per 16-bit word; after the second the rate is $1/16$, so a **radix-2** bit-sequential adder takes **16 cycles** | 749 |

> [!warning] Every "—" above is a real gap, not an omission
> The book gives no LUT count, no slice count, no logic depth, no delay and no DSP-block figure for the activation, requantisation, pooling, softmax or argmax units, and none for the log-shift neuron. It costs them qualitatively — "very small", "comparators only" — and moves on. The comparator counts, tree depths and FIFO widths that appear in the individual notes are standard constructions, derived there and marked as such; do not cite them to this book. The only hard resource numbers in the whole chapter are the ternary VGG-7 mapping (p. 748–749), the TPU array (p. 742) and the two multiplication-count tables (Table 24.2, p. 740; Table 24.7, p. 748).

**Accuracy is the binding constraint on almost every real project, and it settles the choice before area ever enters.** If a top-1 number has been promised to somebody, take [[Quantized MAC Neuron]] with per-layer 8-bit formats and QAT and stop: 5 to 8 weight bits reach accuracy comparable to the binary32 network (p. 726), and the operator itself is *bit-exact* — with $p=m+n$ and $q \ge p + \lceil\log_2 N\rceil$ there is no rounding anywhere inside the layer, so the entire error budget sits in one [[Requantization Unit]] per layer and can be reasoned about in isolation. Everything below that row in the table costs "a few percentage points" against binary32 (p. 727) and, worse, costs training effort with an unbounded schedule: the book's own verdict is that "it remains an art to design a binary or ternary network". [[XNOR-Popcount Neuron]] and [[Ternary MAC Unit]] are not optimisations you apply to a finished network, they are network architectures you commit to before training starts.

**Once accuracy has slack, the question is whether the weights are allowed to move, and that is the diagram's axis.** Weights resident in memory means [[TPU]]: any network maps onto it, runtime grows with network size, and the memory hierarchy rather than the arithmetic decides whether the array is fed (p. 735). Weights baked into the netlist means the unrolled end, where zero weights cost literally nothing and nonzero ones become constant multiplications — which is the only reason a 1 144 512-MAC network fits an FPGA at all, since the naive ternary mapping wants ~18 million LUTs on a device with ~1.2 million (p. 748). The price is a full recompilation to change one weight, and the book makes the comparison concrete: 122 k frames/s with constant weights against 60 k frames/s for a variable-weight ternary design on older silicon (p. 749–750). Half the throughput is what reprogrammability costs. In between, the stream architecture — one hardware unit per layer, [[Convolution Line Buffer]] feeding a dedicated sum-of-products — is the one the book calls "probably the most promising candidate in the context of application-specific arithmetic" (p. 735), and its design problem is not any single operator but balancing parallelism between layers.

**Inside a stream architecture, throughput is a rate-matching problem, and pooling is what creates the slack.** A $2\times2$ stride-2 [[Max Pooling Unit]] cuts the activation rate to $1/4$ and the next one to $1/16$, so downstream hardware is idle three cycles in four. Sharing arithmetic is the obvious fix and is incompatible with exploiting sparsity and inter-row redundancy, because those two optimisations have already specialised each adder to its own constant row (p. 749). The arithmetic fix is [[Digit-Serial Adder]]: spend the slack as cycles instead of idling, radix-16 for four cycles per 16-bit word after the first pooling and radix-2 for sixteen after the second, at the cost of parallel-in/serial-out shift registers at each boundary. Choose [[Average Pooling Unit]] over max only if the network was trained that way — it is the cheaper of the two in LUTs and it lost the field anyway (p. 719). At the output, delete [[Softmax Unit]] and instantiate [[Argmax Unit]] whenever you are doing inference and only need the winning class: softmax is monotonic, so the substitution is exact, and it removes $N$ exponentials and a division from the shallowest layer in the network (p. 722). Keep softmax only if you are training, or if a downstream consumer genuinely needs calibrated probabilities.

**FPGA versus ASIC flips two of these decisions and one of them silently.** [[Winograd Convolution]] trades one multiply for three adds, and one $p$-bit fixed-point multiplier costs roughly $p$ adders (p. 741) — so the trade is a win at binary32 and a loss below about $p=3$. Winograd and aggressive quantization are therefore *competing* optimisations, not composable ones, and on an int8 FPGA datapath built out of LUTs rather than DSP blocks the Winograd rewrite can cost you area. It also loses accuracy relative to the direct algorithm when the intermediates are rounded rather than exact, which is exactly what happens in floating point. The second flip is the table: at 4 to 6 bits an [[LNS Neuron]]'s log and antilog become plain FPGA LUTs (p. 728), and at 6 binary inputs and 1 output bit a whole [[LogicNet Neuron]] is one LUT6 (p. 750) — both are the same move, that below some operand width a truth table beats a datapath, and both are FPGA arguments that do not transfer to an ASIC where a table is an SRAM macro. [[Log-Activation Shift Neuron]] is the conservative point on that spectrum: keep weights linear, put only the activations in the log domain, and the multiplier degenerates to a barrel shifter with no table on the forward path at all. And note what does *not* flip: [[ReLU Unit]] is free everywhere, and its piecewise linearity is what makes the free choice of scaling factors legal in every row of both tables above (p. 713).

$$\boxed{\ \underbrace{q \ \ge\ m+n+\lceil\log_2 N\rceil}_{\text{0 ulp inside the layer, p. 726}} \qquad\text{and}\qquad \underbrace{1\ \text{mult} \approx p\ \text{adders} \Rightarrow \text{Winograd pays only while } p \gg 3}_{\text{p. 741}}\ }$$

**When this comparison stops helping.** It is a chapter about *inference*: every row assumes the weights are already trained and the format question is which fixed-point encoding survives. Training reopens the question at the format level, not the circuit level — bfloat16 or FP8, dynamic range rather than precision (p. 729) — and none of the multiplier-deleting circuits apply, because gradients need range that ternary and binary do not have. The table also assumes a convolutional or dense feedforward network; an RNN or an attention block changes which layer dominates and can make [[Softmax Unit]] the thing you cannot delete. And the accuracy column is a *classification* accuracy: for detection the metric is IoU or mAP (p. 715), and "a few percentage points" does not translate.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 24 "Arithmetic for Deep Learning", pp. 707–751.

- §24.1.2 Activation Functions — pp. 712–713 (ReLU piecewise linearity, the scaling argument)
- §24.1.4 Training Metrics — p. 715 (top-$n$ accuracy, IoU, mAP)
- §24.2.2 Pooling Layers — pp. 719–720
- §24.2.5 Softmax Layer — pp. 721–722 (the monotonicity substitution)
- §24.3.1.1 Fixed-Point Formats for Inference — pp. 725–726 (16-bit PTQ, per-layer 8-bit, 5–8-bit QAT, $p=m+n$, $q\ge p$, the 8/16/24-bit illustration)
- §24.3.1.2 Ternary and Binary Formats — pp. 726–727
- §24.3.1.3 Logarithmic Formats — pp. 727–728 (4–6-bit LNS)
- §24.3.2 Formats for Training — pp. 729–730
- §24.5.1 Architectures for Inference — pp. 734–736 (Fig. 24.12–24.14)
- §24.5.2 Fast Convolution Algorithms — pp. 737–741 (Table 24.2, p. 740; the multiplier $\approx p$ adders rule, p. 741)
- §24.6.1 TPU — pp. 741–743 (Fig. 24.16, p. 742)
- §24.6.2 Binary CNNs — pp. 743–744
- §24.6.4 Unrolling a Ternary CNN — pp. 746–750 (Table 24.7 and the LUT budget, p. 748; Fig. 24.19 and the mapping result, p. 749)
- §24.6.5 LogicNets — pp. 750–751 (Fig. 24.20, p. 750)
