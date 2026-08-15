---
title: Ternary MAC Unit
description: "Weights restricted to -1, 0, +1 turn every multiply-accumulate into an add, a subtract, or nothing at all — zero weights delete hardware outright, which is what makes an unrolled million-MAC CNN fit an FPGA."
kind: circuit
source: "ASA §24.3.1.2, §24.6.4, pp. 726-727, 746-750"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, ternary, mac, quantization, sparsity, fpga, dnn]
aliases:
  - Ternary MAC
  - Ternary Neuron
  - Ternary Weight Neuron
  - Ternary Multiply-Accumulate
  - Ternary Weight MAC
---

# Ternary MAC Unit

A multiply-accumulate lane whose weight set is $\{-1,0,+1\}$, so the multiplier degenerates into three mutually exclusive cases — a wire, a bitwise complement, and the absence of hardware — and only the third of them is worth the accuracy it costs.

```tikz title="A ternary MAC lane: pass, complement, or delete, summed on one FPGA carry chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % ================= unrolled, constant-weight lanes =================
  \node[anchor=west,font=\footnotesize] at (-2.2,6.0)
    {\textbf{weights are constants} (unrolled architecture): each case is a different netlist};

  % --- lane 0 : W = +1 -> bare wire
  \draw[->] (-2.2,5.0) -- (5.6,5.0);
  \node[anchor=south,font=\footnotesize] at (-1.2,5.03) {$X_0$ [$n$]};
  \node[anchor=south,font=\footnotesize] at (2.4,5.06) {$W_0=+1$: a wire, 0 LUTs};

  % --- lane 1 : W = -1 -> bitwise complement + carry
  \draw[->] (-2.2,3.8) -- (1.2,3.8);
  \node[anchor=south,font=\footnotesize] at (-1.2,3.83) {$X_1$ [$n$]};
  \draw (1.2,3.45) rectangle (3.0,4.15);
  \node at (2.1,3.8) {$\overline{X_1}$};
  \draw[->] (3.0,3.8) -- (5.6,3.8);
  \node[anchor=south,font=\footnotesize] at (2.1,4.18) {$W_1=-1$: $n$ inverters};

  % --- lane 2 : W = 0 -> nothing at all
  \draw (-2.2,2.6) -- (2.9,2.6);
  \draw (2.75,2.75) -- (3.05,2.45);  \draw (2.75,2.45) -- (3.05,2.75);
  \node[anchor=south,font=\footnotesize] at (-1.2,2.63) {$X_2$ [$n$]};
  \node[anchor=south,font=\footnotesize] at (1.6,2.66) {$W_2=0$: deleted, 0 LUTs};

  % --- lane 3 : W = +1 -> bare wire
  \draw[->] (-2.2,1.4) -- (5.6,1.4);
  \node[anchor=south,font=\footnotesize] at (-1.2,1.43) {$X_3$ [$n$]};
  \node[anchor=south,font=\footnotesize] at (2.4,1.46) {$W_3=+1$: a wire, 0 LUTs};

  % width annotation on the three surviving operands
  \node[anchor=north,font=\footnotesize] at (4.55,4.97) {[$n{+}1$]};
  \node[anchor=north,font=\footnotesize] at (4.55,3.77) {[$n{+}1$]};
  \node[anchor=north,font=\footnotesize] at (4.55,1.37) {[$n{+}1$]};

  % ================= the adder =================
  \draw (5.6,0.9) rectangle (8.6,5.5);
  \node[align=center] at (7.1,3.6)
    {3-input\\(\emph{ternary})\\adder\\[2pt] one FPGA\\carry chain};
  \draw[->] (7.1,0.2) -- (7.1,0.9);
  \node[anchor=north,font=\footnotesize,align=center] at (7.1,0.15)
    {constant $k=|\mathcal N|=1$\\(the $+1$ of each $-X$)};

  \draw[->] (8.6,3.2) -- (11.2,3.2);
  \node[anchor=south,font=\footnotesize] at (9.6,3.24) {$Y$ [$q$]};
  \node[anchor=north,font=\footnotesize] at (10.2,3.12)
    {$q=n{+}1{+}\lceil\log_2 N\rceil$};

  % ================= inset : programmable weights =================
  \draw[dashed,rounded corners] (-2.2,-4.6) rectangle (9.4,-1.85);
  \node[anchor=west,font=\footnotesize] at (-2.0,-2.18)
    {\textbf{weights are programmable}: 2 LUTs per bit, and no zero is free};

  \draw[->] (-1.8,-3.5) -- (0.2,-3.5);
  \node[anchor=south,font=\footnotesize] at (-0.8,-3.47) {$X_j$ [$n{+}1$]};
  \draw (0.2,-3.85) rectangle (2.0,-3.15);
  \node at (1.1,-3.5) {$\oplus\, s_j$};
  \draw[->] (2.0,-3.5) -- (3.2,-3.5);
  \draw (3.2,-3.85) rectangle (5.0,-3.15);
  \node at (4.1,-3.5) {$\wedge\, z_j$};
  \draw[->] (5.0,-3.5) -- (7.0,-3.5);
  \node[anchor=south,font=\footnotesize] at (6.0,-3.47) {$T_j$ [$n{+}1$]};
  \node[anchor=west,font=\footnotesize] at (7.05,-3.5) {to the tree};

  \draw[->] (1.1,-2.75) -- (1.1,-3.15);
  \node[anchor=south,font=\footnotesize] at (1.1,-2.72) {$s_j$};
  \draw[->] (4.1,-2.75) -- (4.1,-3.15);
  \node[anchor=south,font=\footnotesize] at (4.1,-2.72) {$z_j$};
  \node[anchor=north,font=\footnotesize] at (3.0,-3.95)
    {weight code $W_j \equiv (s_j,z_j)$, 2 bits \qquad carry-in $c_j = s_j \wedge z_j$};
\end{circuitikz}
\end{document}
```

*Own construction; the case distinction is the text of p. 748, the 3-input adder is the one of §24.6.4, p. 749.*

**Three weight values means three netlists, not one datapath with three modes.** A DNN can be trained down to weights and activations in $\{-1,0,+1\}$, scaled by a per-layer factor $s$ (p. 726). Because $W_j\in\{-1,0,+1\}$, the product $W_jX_j$ takes one of exactly three values, and each has a hardware realisation with no gate in it that deserves the name *multiplier*:

| $W_j$ | $W_jX_j$ | hardware |
| --- | --- | --- |
| $+1$ | $X_j$ | a wire |
| $-1$ | $-X_j = \overline{X_j}+1$, by the two's-complement identity ([[Number Formats]]) | $n$ inverters and one carry |
| $0$ | $0$ | *nothing* — the operand is removed from the sum, not fed in as zeros |

The scaling factor $s$ never appears: everything before the activation function is linear and ReLU is positively homogeneous, so a consistent rescaling passes through the layer and is compensated in the next one (p. 726, [[ReLU Unit]]). What reaches the gates is the integer $\pm1$ or nothing at all.

**The $-1$ case is worth an increment, not an adder, because the increments collect.** Splitting the index set into the positive weights $\mathcal P$ and the negative weights $\mathcal N$ and discarding the zeros,

$$Y=\sum_{j\in\mathcal P}X_j+\sum_{j\in\mathcal N}\big(\overline{X_j}+1\big)
      =\sum_{j\in\mathcal P}X_j+\sum_{j\in\mathcal N}\overline{X_j}+|\mathcal N|$$

by commutativity and associativity of integer addition, which reassociate the $|\mathcal N|$ separate $+1$ terms into one. That constant is known at compile time, so it is absorbed into the layer's bias $B$, or injected as the carry-ins of the adder tree, where a [[RCA, Ripple-Carry Adder]] has a spare $c_{\text{in}}$ per level anyway. It is the $c_{\text{in}}=\text{sub}$ trick of a two's-complement adder–subtractor, amortised across $N$ lanes instead of one. **The subtractions cost the same as the additions.**

**One bit of width growth survives the disappearance of the multiplier, and it is the negation that causes it.** For $X_j$ in $n$-bit two's complement, $X_j\in[-2^{n-1},\,2^{n-1}-1]$, so $W_jX_j\in[-2^{n-1},\,2^{n-1}]$ — the upper endpoint reached only by $-(-2^{n-1})$, and it is precisely the one value $n$-bit two's complement cannot hold. Hence

$$p = n+1$$

for the ternary product, against $p=m+n$ for a general $m\times n$ MAC ([[Quantized MAC Neuron]]). Two things fall out. The general rule applied to the 2-bit weight *code* would predict $p=n+2$ and be one bit loose, because $\{-1,0,+1\}$ is not the full range of a 2-bit signed integer. And the growth does not vanish with the multiplier: exactly one bit is irreducible, and it is bought by the asymmetry of two's complement rather than by any multiplication. With $N$ such terms, $|Y|\le N\,2^{n-1}$, so

$$q = p + \lceil\log_2 N\rceil = n+1+\lceil\log_2 N\rceil$$

leaves the accumulator unable to overflow, and the summation is then exact integer addition — $0$ ulp, reassociable in any order the tree builder likes. The layer is bit-exact against a binary32 simulation of the same ternary weights (p. 726), and [[Error Accuracy]] has nothing to propagate inside it; all the error was spent at training time, choosing $\{-1,0,+1\}$ at all.

> [!note] "Ternary weight" and "ternary adder" are unrelated, and the case study uses both in one sentence.
> A **ternary weight** is a weight from a three-valued set. A **ternary adder** ([[Ternary Adders on FPGAs]]) is a *three-operand* adder, so called because it takes three inputs, and it exists because an FPGA slice can sum three operands on one carry chain for barely more than two. The book applies RPAG's ternary-adder extension to the first layer of a ternary-weight CNN (p. 749) — two different senses of the word, one line apart. Nothing about $\{-1,0,+1\}$ makes a 3-input adder natural; what makes it natural is that the operands after the ternary product are all *unweighted* — no shifts to align — so three of them fit one carry chain exactly.

**Zero is the weight value that pays, and it is the one binary cannot express.** Removing the multiplier is not what makes an unrolled network fit. Take the VGG-7 CIFAR-10 case study: $1\,144\,512$ MAC operations across six convolutional layers (Table 24.7, p. 748), each one an addition once the weights are ternary. At 16-bit activations an adder costs about 16 LUTs, so the dense version needs roughly **18 million LUTs**, and the Ultrascale+ VU9P it targets has about **1.2 million** (p. 748) — a factor of fifteen short with the multipliers already gone. The gap is closed by sparsity: QAT quantizes any float weight below a per-layer threshold to $0$ and everything else to $\pm1$ by its sign, and the threshold is tuned per layer for maximum sparsity at acceptable accuracy (p. 748). Every zero deletes one 16-bit addition — not narrows it, deletes it. That is why ternary beats binary on area *and* on accuracy (p. 727): $\{-1,+1\}$ has no code for "this connection does not exist" ([[XNOR-Popcount Neuron]]).

**Baking the weights in turns the layer into a constant matrix-vector product, and the sharing lives between rows.** In an unrolled architecture every weight set gets its own hardware — every kernel in the early layers, every neuron in the dense layers (p. 747) — so the weights are constants in the netlist and the layer is one instance of constant matrix-vector multiplication ([[Multiple Constant Multiplication]]). The usual multiplierless machinery is half-empty here: the coefficients are $\{-1,0,1\}$, so there are no common factors *between* coefficients and nothing for [[Shift-and-Add]] to decompose inside a single constant. What is left is redundancy *between output rows* — a partial sum such as $X_1+X_5$ recurs in many of them. RPAG (with the ternary-adder extension) is used for the first layers, where the output count is small; CSE heuristics take over for the later ones, because CSE scales better with the number of outputs (p. 749).

**The tree must then be re-sized to a data rate that keeps falling.** The architecture streams over input pixels, one per cycle, so a classification comes out every $A^0_x\times A^0_y$ cycles (p. 746). Each pooling layer cuts the rate — to $1/4$ after the first, $1/16$ after the second — and a conventional stream design absorbs that by widening the channel count, which is not available here because every channel already has its own weights and its own hardware (p. 749). The remaining lever is to trade cycles for logic: after the first pooling a radix-16 [[Digit-Serial Adder]] processes a 16-bit word in 4 cycles, after the second a radix-2 bit-sequential adder takes 16, with parallel-in/serial-out shift registers at each pooling boundary. Same throughput, a fraction of the LUTs.

$$\boxed{\ Y=\sum_{j\in\mathcal P}X_j+\sum_{j\in\mathcal N}\overline{X_j}+|\mathcal N|,\qquad
\text{cost}=\big(|\mathcal P|+|\mathcal N|-1\big)\ \text{adders of } q=n{+}1{+}\lceil\log_2 N\rceil \text{ bits}\ }$$

The cost is set by the number of *nonzero* weights, and $N$ does not appear in it.

**Worked example.** $n=8$, $N=4$, $X=(50,-13,64,9)$, $W=(+1,-1,0,+1)$, so $\mathcal P=\{0,3\}$, $\mathcal N=\{1\}$, $k=|\mathcal N|=1$ and $q=8+1+2=11$. Sign-extend to $q$ *before* complementing:

$$
\begin{aligned}
X_0 &= \texttt{000\,0011\,0010} = +50 &&\text{lane 0: a wire}\\
\overline{X_1} &= \overline{\texttt{111\,1111\,0011}} = \texttt{000\,0000\,1100} = +12 &&\text{lane 1: 11 inverters}\\
&\quad\text{---} &&\text{lane 2: no operand exists}\\
X_3 &= \texttt{000\,0000\,1001} = +9 &&\text{lane 3: a wire}\\
\hline
Y &= 50+12+9+k = \texttt{000\,0100\,1000} = +72
\end{aligned}
$$

Three operands and one constant on one 3-input carry chain, and $+12+k=+13=-X_1$ recovers the negation without a dedicated incrementer. ReLU passes $72$; requantising by the layer's scale $2^{-1}$ gives $X'=36$ exactly ([[Requantization Unit]]).

**Reported result.** All convolutional layers of the VGG-7 fit one VU9P on an AWS F1 instance at **66.6% of LUTs and 41.6% of flip-flops, 122 k frames/s, 30 µs latency** (p. 749). A comparison design keeping ternary weights *and* ternary activations, but with the weights variable rather than constant, reaches 60 k frames/s on older silicon — half the throughput, in exchange for being able to change the weights without recompiling the bitstream.

**When it breaks.**

- **Complementing before sign-extending.** $\overline{X_j}$ computed at $n$ bits and *then* sign-extended to $q$ is not $-X_j-1$; the extension replicates the complemented sign bit and the term comes out with the wrong magnitude and sign. Extend first, complement second. This compiles and synthesises perfectly.
- **$q$ sized by the general MAC rule.** $q=n+\lceil\log_2 N\rceil$ — the width used for an ordinary $m\times n$ MAC — is one bit short here, and it fails on exactly one input: all $N$ activations at $-2^{n-1}$ with all weights $-1$, giving $+N\,2^{n-1}=+2^{q-1}$, which is the one value a $q$-bit two's-complement word cannot hold. Silent wraparound to the most negative result.
- **Programmable weights.** Every economy above assumes the weights are constants in the netlist. Make them runtime inputs and the lane becomes the inset of the figure — an XOR and an AND per bit, about 2 LUTs per activation bit per lane — and, worse, a zero weight now costs exactly as much as a $\pm1$ weight, because the adder must still exist for the case where the weight changes. The sparsity saving vanishes entirely; only the multiplier saving survives.
- **The network must be fixed.** Baking weights into the netlist means a full resynthesis to change a single one. If the model is going to be updated, take the variable-weight design and its halved throughput, or go back to int8 ([[Choosing a Deep Learning Datapath]]).
- **A few points of top-1, and no way to be sure in advance.** Ternary costs a few percentage points against the binary32 reference, ternary behaving slightly better than binary (p. 727). Adding channels or layers can buy that back — binary nets can theoretically implement any digital neural network — but only if the added hardware does not exceed what the narrow weights saved, and the book states plainly that designing a workable binary or ternary network "remains an art".
- **QAT is mandatory and dedicated.** The straight-through estimator alone is not enough at ternary; these precisions need methods of their own (pp. 727, 733–734). Post-training quantization to $\{-1,0,+1\}$ does not work.

**RTL (Spade).**

```spade
/// One ternary lane. The weight is a 2-bit code: bit 0 = "nonzero", bit 1 = sign.
/// There is no multiplier: the three cases are pass, two's-complement negate,
/// and zero.
fn tprod<#uint Q>(x: int<Q>, w: uint<2>) -> int<Q> {
    match w {
        0b01 => x,
        0b11 => -x,
        _    => 0,
    }
}

/// Y = sum_j W_j X_j for N = 4 ternary weights and n = 16-bit activations.
/// Each product is exact in n+1 = 17 bits (negating -2^15 needs the extra bit),
/// so q = 17 + ceil(log2 4) = 19 bits cannot overflow: the sum is exact.
entity tmac4(
    x0: int<16>, x1: int<16>, x2: int<16>, x3: int<16>,
    w0: uint<2>, w1: uint<2>, w2: uint<2>, w3: uint<2>,
) -> int<19> {
    let a0: int<19> = sext(x0);
    let a1: int<19> = sext(x1);
    let a2: int<19> = sext(x2);
    let a3: int<19> = sext(x3);
    tprod(a0, w0) +. tprod(a1, w1) +. tprod(a2, w2) +. tprod(a3, w3)
}
```

`tprod` is one lane of the figure, written in its *programmable* form so that it can be simulated: `w` is the 2-bit code $(s_j,z_j)$ driving the inset's $\oplus s_j$ and $\wedge z_j$. The four `sext` lines are the load-bearing detail — they widen to $q$ *before* `-x` complements, which is the first failure mode listed above; sign-extending after the negate compiles just as cleanly and is wrong. `+.` is the truncating add, correct here only because $q=19$ was already proved unable to overflow for $n=16,N=4$; the widening `+` would have grown the accumulator three more bits for nothing. All of it is combinational. Synthesis will not build the chain of two-operand adders written here — the four operands and the constant collapse onto one or two 3-input carry chains — and in the constant-weight architecture the `match` disappears altogether: each lane specialises to a wire, an inverter row, or an empty netlist, which is the top half of the figure and is the thing no simulation of this entity can show you.

Verified by simulation against a behavioural reference: **4264 vectors**, comprising the worked example above, the asymmetric pair $1-128$ and $128-1$ (which a lane-swapped or bit-reversed datapath fails), the negation corner $-(-2^{15})$, both accumulator extremes $\pm 4\cdot2^{15}$, both encodings of a zero weight, an exhaustive sweep of all 256 weight vectors against fixed asymmetric activations, and a 4000-case random sweep over activations and weight codes.

**Related Notes.**

- [[Quantized MAC Neuron]] – counter-example: the general $p=m+n$ MAC this degenerates from, and the reason $p=n+1$ here is not just $m=2$ substituted in.
- [[Ternary Adders on FPGAs]] – depends-on: the 3-input carry-chain adder the tree is actually built from, and the word this note shares with it by accident.
- [[Multiple Constant Multiplication]] – extends: the whole unrolled layer as one constant matrix-vector product, where the redundancy between output rows lives.
- [[Shift-and-Add]] – counter-example: the multiplierless-constant decomposition that has nothing left to decompose once every coefficient is $\pm1$.
- [[RCA, Ripple-Carry Adder]] – depends-on: the adder the 16-LUT budget is counted in, and the spare $c_{\text{in}}$ that makes the $|\mathcal N|$ increments free.
- [[XNOR-Popcount Neuron]] – compares: one value further down, where the multiplier becomes a gate but zero stops being representable.
- [[Digit-Serial Adder]] – extends: what this tree turns into once pooling drops the data rate to $1/4$ and $1/16$.
- [[Requantization Unit]] – extends: the $q\to n'$ step at the layer boundary, where the only rounding in the path happens.
- [[ReLU Unit]] – supports: the piecewise-linear activation that makes the per-layer scale factor $s$ invisible to the hardware.
- [[LogicNet Neuron]] – extends: one step past unrolling, tabulating the whole neuron instead of building its adder tree.
- [[Choosing a Deep Learning Datapath]] – compares: when the fixed-network, FPGA-only, few-accuracy-points trade is the right one.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §24.3.1.1 "Fixed-Point Formats for Inference", p. 726 (scaling factors absorbed by linearity and ReLU; $p=m+n$, $q\ge p$, and the bit-exactness against a binary32 simulation).
- §24.3.1.2 "Ternary and Binary Formats", pp. 726–727 (weights and activations in $\{-1,0,+1\}$ scaled by $s$; QAT required; a few percentage points of accuracy, ternary above binary; compensation by extra channels or layers).
- §24.6.4 "Unrolling a Ternary CNN", pp. 746–749 (dedicated hardware per weight set; zero weights need no hardware; Table 24.7 and the 1 144 512 MAC total; ~16 LUTs per 16-bit adder, ~18 M LUTs against the VU9P's ~1.2 M; threshold-based sparse QAT; constant matrix-vector multiplication with RPAG and CSE; the ternary-adder extension; digit-serial adders after pooling; 66.6% LUT / 41.6% FF, 122 k frames/s, 30 µs; the variable-weight comparison at 60 k frames/s).
- §24.4.4 "Quantization-Aware Training", pp. 733–734 (the straight-through estimator, and why it does not suffice alone at ternary precision).
