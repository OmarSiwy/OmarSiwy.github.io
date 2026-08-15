---
title: LogicNet Neuron
description: "The entire neuron — constant products, accumulation, batch norm and activation — tabulated into one LUT6, so its cost depends only on input and output word size and never on what it computes."
kind: circuit
source: "ASA §24.6.5, pp. 750-751"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, fpga, lut, quantization]
aliases:
  - LogicNets
  - LogicNet
  - Tabulated Neuron
---

# LogicNet Neuron

A neuron whose sum-of-products, accumulation, batch normalization and activation are all replaced by a single truth table, so the only thing that fixes its cost is the total number of input and output bits.

```tikz title="A binarised 6-input LogicNet neuron collapsed into one LUT6"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]

  % --- the tabulated region -------------------------------------------------
  \draw[dashed, rounded corners=3pt] (1.85,-2.35) rectangle (9.9,2.0);
  \node[anchor=south] at (5.9,2.05) {\footnotesize one LUT6 $=$ 64 configuration bits};

  % --- inputs ---------------------------------------------------------------
  \node[anchor=east] at (0.55,0.4) {$6\times1$-bit};
  \node[anchor=east] at (0.55,-0.1) {activations $x_0\ldots x_5$};
  \draw[thick] (0.6,0.15) -- (1.25,0.15);
  \node[circ] at (1.25,0.15) {};

  % --- constant multipliers -------------------------------------------------
  \draw (2.1,1.35) rectangle (4.1,1.85); \node at (3.1,1.6) {$\times\,0.3254\ldots$};
  \draw (2.1,0.60) rectangle (4.1,1.10); \node at (3.1,0.85) {$\times\,{-}1.9573\ldots$};
  \draw (2.1,-0.15) rectangle (4.1,0.35); \node at (3.1,0.10) {$\times\,{-}0.1074\ldots$};
  \draw (2.1,-1.95) rectangle (4.1,-1.45); \node at (3.1,-1.70) {$\times\,1.7082\ldots$};
  \node at (3.1,-0.75) {$\vdots$};

  \draw[->] (1.25,0.15) -- (1.6,0.15) -- (1.6,1.60) -- (2.1,1.60);
  \draw[->] (1.6,0.15) -- (1.6,0.85) -- (2.1,0.85);
  \draw[->] (1.25,0.15) -- (2.1,0.10);
  \draw[->] (1.6,0.15) -- (1.6,-1.70) -- (2.1,-1.70);

  % --- accumulate, batch norm, activation -----------------------------------
  \draw (5.25,-0.20) circle (0.32); \node at (5.25,-0.20) {$\Sigma$};
  \draw (6.15,-0.55) rectangle (7.35,0.15); \node at (6.75,-0.05) {batch};
  \node at (6.75,-0.35) {norm};
  \draw (7.75,-0.55) rectangle (9.55,0.15); \node at (8.65,-0.20) {activation};

  \draw[->] (4.1,1.60) -- (4.5,1.60) -- (4.5,0.05) -- (4.97,-0.08);
  \draw[->] (4.1,0.85) -- (4.5,0.85) -- (4.5,0.05) -- (4.97,-0.08);
  \draw[->] (4.1,0.10) -- (4.93,-0.20);
  \draw[->] (4.1,-1.70) -- (4.5,-1.70) -- (4.5,-0.45) -- (4.97,-0.32);
  \draw[->] (5.57,-0.20) -- (6.15,-0.20);
  \draw[->] (7.35,-0.20) -- (7.75,-0.20);

  % --- output ---------------------------------------------------------------
  \draw[->] (9.55,-0.20) -- (10.45,-0.20);
  \node[anchor=west] at (10.5,0.05) {$1\times1$-bit};
  \node[anchor=west] at (10.5,-0.45) {activation $y$};

  % --- what survives synthesis ---------------------------------------------
  \node[anchor=north] at (5.9,-2.45) {\footnotesize nothing inside the box exists in hardware: address $=x_5x_4x_3x_2x_1x_0$, data $=y$};

\end{circuitikz}
\end{document}
```

*after Fig. 24.20, p. 750.*

**Collapse the neuron to a Boolean function.** Take a neuron with $n$ incoming activations of $a$ bits each and a quantized output of $b$ bits. Its computation is

$$y = Q\!\Big(\mathrm{BN}\Big(\sum_{i=0}^{n-1} w_i x_i\Big)\Big),$$

where $Q$ is the quantizing activation and $\mathrm{BN}$ the batch normalization. Every $x_i$ is drawn from a finite set of $2^a$ codes, so the whole composite map has a domain of exactly $2^{na}$ points and a codomain of $2^b$ points — it is a **Boolean function of $na$ inputs and $b$ outputs**, and by the completeness of the truth-table representation ([[Boolean Algebra]]) it can be written down in full. Concatenate the activations into one address $A = x_{n-1}\Vert\cdots\Vert x_0$ of width $na$ bits and the neuron becomes a $2^{na}\times b$ lookup ([[Lookup-Tables]]). Nothing inside the dashed box is built: the multipliers, the accumulator width, the normalization constants and the activation's shape are all consumed at table-generation time.

**Read the cost off the interface, not off the arithmetic.** The table holds

$$S = b\,2^{na}\ \text{bits}$$

and the implementation complexity roughly tracks $S$ (p. 750). This is the property that makes LogicNets unusual: **the internal complexity does not matter**. A neuron whose weights are ugly transcendental floats costs exactly what a neuron with weights $\pm1$ costs, and one that folds in a sigmoid costs exactly what one that folds in a ReLU costs. The binarised case in the figure is $n=6$, $a=1$, $b=1$, so $S = 1\cdot 2^{6} = 64$ bits — precisely the configuration word of one 6-input FPGA lookup table, one logic element, one level of logic delay ([[Combinational Logic]]).

**Quantization-aware training disappears with the datapath.** In every other quantized neuron ([[Quantized MAC Neuron]], [[Ternary MAC Unit]]) the weights are hardware objects: they occupy a stored word, they set the multiplier's shape, and rounding them is a perturbation the network has to be trained to tolerate. Here the weights are only ever evaluated by the *generator*, in whatever precision it likes, so they can stay binary32 and **no QAT is required** (p. 750). The same argument disposes of batch normalization: instead of merging $\gamma,\beta,\mu,\sigma$ back into the weights to avoid a runtime affine transform, you simply include $\mathrm{BN}$ in the function you enumerate. And because $Q$ is monotone and $\mathrm{BN}$ is affine with positive scale, the composite $Q\circ\mathrm{BN}$ is itself monotone in the accumulator — so for a 1-bit output the table's entry is nothing but a threshold test $\sum_i w_i x_i \ge \theta$ with a single folded constant $\theta$. The only quantization left in the design lives at the *interfaces* between neurons, which is why accuracy tracks activation precision and nothing else.

**Exponential growth forces sparsity into the training problem.** $S = b\,2^{na}$ doubles with every additional input bit, so the design must attack $na$. The book's two levers (p. 750) are to restrict **fan-in** — impose sparsity on the network and train it with a sparse-CNN algorithm — and to hold the **activation word size below 4 bits**. The arithmetic is unforgiving: $n=6,a=1$ costs 64 bits; $n=6,a=2$ costs $2^{12}=4096$ bits; $n=7,a=3$ costs $2^{21}\approx 2$ Mbit **per neuron**. Between those, the FPGA's own granularity bites at $na=6$. Beyond it, Shannon expansion on the excess address bits splits the table into $2^{na-6}$ LUT6 leaves plus a multiplexer tree, so a design that looked like "one LUT per neuron" becomes a 64-LUT cone the moment $na$ reaches 12.

**On an FPGA this is free; on an ASIC it is only a starting point.** The LUT6 is the fabric's atom, and its contents are configuration bits, not logic — so on an FPGA a 6-input binarised neuron genuinely costs one logic element and the tabulation is the whole implementation ([[FPGAs]]). An ASIC has no such primitive: the truth table is handed to logic synthesis, which minimises it back into a gate network whose cost *does* depend on what the function is. The LogicNets cost model is therefore an FPGA cost model, and the "one LUT per neuron" claim does not transfer.

**Accuracy sets the ceiling, not area.** Across experiments with 1 to 7 activation inputs per neuron and 1 to 3 bits per activation, accuracy depended mainly on **activation precision**, and could not be bought back by scale: a binary network with roughly **ten times more neurons** did not reach the accuracy of a 2-bit network (p. 751). Practical training does not deliver what the theory promises, which is why the technique is confined to small tasks that need extreme throughput.

$$\boxed{\ y = T\big[\,x_{n-1}\Vert\cdots\Vert x_0\,\big],\qquad S = b\,2^{na}\ \text{bits},\ \ \text{independent of } \{w_i\},\ \mathrm{BN},\ Q\ }$$

**When it breaks.**

- $na > 6$ — the one-LUT identity is gone; cost turns into $2^{na-6}$ LUTs plus a mux tree, and the "cost is independent of the function" claim survives only as an upper bound, since synthesis will now find and exploit structure.
- $a \ge 4$ bits of activation — the book's own stated limit (p. 750).
- Dense layers: fan-in restriction is not an implementation detail you can add afterwards, it must be trained in with a sparse-CNN algorithm, so an off-the-shelf pretrained network cannot be tabulated.
- Any weight change requires re-enumerating the tables and re-running place-and-route — even more rigid than the unrolled ternary CNN, where at least the adder network is a recognisable circuit. If weights must stay reprogrammable, [[Quantized MAC Neuron]] is the only option.
- Accuracy is bounded by activation precision; growing the network does not recover it (p. 751).
- Large networks: one table per neuron means area scales with neuron *count* with no reuse whatsoever, so the architecture is unrolled by construction ([[Choosing a Deep Learning Datapath]]).

> [!warning] Not covered in the source — needs outside research
> The book reports no LUT counts, $f_{max}$ or throughput figures for LogicNets, only the accuracy trends. The multi-LUT cascade cost above is derived here by Shannon expansion, not quoted.

**The RTL is the configuration word, not the datapath.**

```spade
/// One binarised LogicNet neuron: six 1-bit activations select one bit of a
/// 64-entry truth table. `init` is the LUT6 configuration word, enumerated
/// offline from the floating-point neuron: bit k is the neuron's output for
/// the input pattern whose binary value is k.
fn logicnet6(x: [bool; 6]) -> bool {
    let init: uint<64> = 0x33003300ff333322;
    init.as_bits()[x.as_uint()]
}

entity logicnet6_lut(x: [bool; 6]) -> bool {
    logicnet6(x)
}
```

`x` is the six-wire bundle entering the dashed box, packed LSB-first — element 0 is $x_0$ — so `x.as_uint()` is the address $A$, 6 bits wide, and the result is 1 bit. `init` is the entire dashed box: the weights, the accumulator, the batch norm and the activation, evaluated offline and frozen into 64 constants. It is purely combinational, one LUT delay, no registers. The one thing synthesis does differently from the drawing is that it never builds the 64:1 multiplexer the code appears to describe — the constant folds into a single LUT6 `INIT` attribute and the mux is the silicon that was already there.

The constant above was enumerated in floating point from the four weights printed in Fig. 24.20 plus two standing in for the ellipsis, $w = (0.3254, -1.9573, -0.1074, 1.7082, 0.6415, -0.8837)$ with a folded threshold $\theta = 0.5$ and $x_i$ coded $0 \mapsto -1$, $1 \mapsto +1$. The testbench recomputes $\sum_i w_i x_i \ge \theta$ in Verilog `real` arithmetic and compares: all 64 addresses exhaustively, plus 3000 random vectors, plus the asymmetric pair $A = 000001$ (output 1) and $A = 100000$ (output 0), which no bit-reversed address ordering can pass.

**Related Notes.**

- [[Lookup-Tables]] – depends-on: the entire construction is one lookup table; everything else here is an argument about what may legally go inside it.
- [[Table-Based Function Evaluation]] – extends: the same tabulate-instead-of-compute move, applied to a mathematical function rather than a trained neuron.
- [[Boolean Algebra]] – supports: a finite domain makes the neuron a Boolean function, which is why the truth table exists at all.
- [[Combinational Logic]] – supports: one table, one level of logic, no state.
- [[XNOR-Popcount Neuron]] – compares: the other way to build a binarised neuron, keeping a real datapath so fan-in can be large.
- [[Quantized MAC Neuron]] – counter-example: weights as hardware objects, needing QAT and reprogrammable, everything this note removes.
- [[Choosing a Deep Learning Datapath]] – compares: places this at the extreme unrolled, high-throughput, small-network corner.
- [[FPGAs]] – depends-on: the cost model is the LUT6, so the technique is fabric-specific.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §24.6.5 "LogicNets", pp. 750–751; Fig. 24.20, p. 750.
- §24.5 case-study context (unrolled architectures), p. 749.
