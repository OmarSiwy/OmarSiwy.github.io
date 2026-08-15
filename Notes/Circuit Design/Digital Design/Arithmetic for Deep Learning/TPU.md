---
title: TPU
description: "A 256x256 systolic array of int8 MAC cells with weights resident and 32-bit 256-deep accumulators — the generic end of the DNN accelerator spectrum, where 16-bit operands are emulated in time at half or quarter throughput."
kind: circuit
source: "ASA §24.5.1, §24.6.1, pp. 734-735, 741-743"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, systolic-array, mac, int8, accelerator, inference]
aliases:
  - Tensor Processing Unit
  - TPUv1
  - Google TPU
  - Matrix Multiply Unit
  - Systolic Array
---

# TPU

A $256\times256$ systolic array of int8 multiply-accumulate cells with the weight matrix held resident — the *generic* inference accelerator, in which the arithmetic is frozen at design time and every wider format is bought back with cycles rather than with silicon.

```tikz title="TPUv1 block structure with operand widths, and one cell of the Matrix Multiply Unit"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % ---------------- PCIe host interface ----------------
  \draw (0,0.2) rectangle (1.3,5.2);
  \node[rotate=90] at (0.65,2.7) {PCIe};

  % ---------------- memories ----------------
  \draw (2.2,4.3) rectangle (6.0,5.2);
  \node[align=center] at (4.1,4.75) {off-chip DRAM};

  \draw (7.6,4.3) rectangle (11.4,5.2);
  \node[align=center] at (9.5,4.75) {Weight FIFO (read-only)};

  \draw (2.2,2.3) rectangle (6.0,3.5);
  \node[align=center] at (4.1,2.9) {Activation Storage\\(DMA, read/write)};

  % ---------------- arithmetic ----------------
  \draw (7.6,2.3) rectangle (11.4,3.5);
  \node[align=center] at (9.5,2.9) {$256\times256$\\Matrix Multiply Unit};

  \draw (7.6,0.2) rectangle (11.4,1.4);
  \node[align=center] at (9.5,0.8) {Accumulators\\$256$-deep, $32$-bit};

  \draw (2.2,0.2) rectangle (6.0,1.4);
  \node[align=center] at (4.1,0.8) {Activation $f$ \& Pooling\\+ requantise};

  % ---------------- interconnect ----------------
  \draw[<->] (1.3,4.75) -- (2.2,4.75);
  \draw[<->] (1.3,2.9) -- (2.2,2.9);
  \draw[<->] (6.0,4.75) -- (7.6,4.75);
  \node[anchor=south,font=\footnotesize] at (6.8,4.80) {DDR3};

  \draw[->] (9.5,4.3) -- (9.5,3.5);
  \node[anchor=west,font=\footnotesize] at (9.60,3.90) {$W$ [8]};

  \draw[->] (6.0,2.9) -- (7.6,2.9);
  \node[anchor=south,font=\footnotesize] at (6.8,2.95) {$X$ [8]};
  \node[anchor=north,font=\footnotesize] at (6.8,2.85) {$256$/cycle};

  \draw[->] (9.5,2.3) -- (9.5,1.4);
  \node[anchor=west,font=\footnotesize] at (9.60,1.85) {$P$ [16]};

  \draw[->] (7.6,0.8) -- (6.0,0.8);
  \node[anchor=south,font=\footnotesize] at (6.8,0.85) {$Y$ [32]};

  \draw[->] (4.1,1.4) -- (4.1,2.3);
  \node[anchor=west,font=\footnotesize] at (4.20,1.85) {$X'$ [8]};

  % ---------------- one cell of the array ----------------
  \draw[dashed,rounded corners] (12.6,0.3) rectangle (17.6,4.5);
  \node[anchor=north,font=\footnotesize] at (15.1,4.45) {one of the $65\,536$ cells};

  \draw (13.2,3.0) rectangle (14.2,3.6);
  \node[font=\footnotesize] at (13.7,3.3) {$w$ reg};
  \draw (13.5,2.0) rectangle (14.3,2.6);
  \node at (13.9,2.3) {$\times$};
  \draw (15.3,2.0) rectangle (16.1,2.6);
  \node at (15.7,2.3) {$+$};

  \draw[->] (13.7,3.0) -- (13.7,2.6);
  \draw[->] (12.6,2.15) -- (13.5,2.15);
  \node[anchor=north,font=\footnotesize] at (13.05,2.10) {$X$ [8]};
  \draw[->] (14.3,2.3) -- (15.3,2.3);
  \node[anchor=south,font=\footnotesize] at (14.8,2.35) {[16]};
  \draw[->] (15.7,3.6) -- (15.7,2.6);
  \node[anchor=west,font=\footnotesize] at (15.80,3.10) {$S_\text{in}$ [32]};
  \draw[->] (15.7,2.0) -- (15.7,1.55);
  \node[anchor=west,font=\footnotesize] at (15.80,1.70) {$S_\text{out}$ [32]};
  \draw[->] (13.9,2.0) -- (13.9,1.35) -- (17.6,1.35);
  \node[anchor=north,font=\footnotesize] at (15.4,1.30) {$X$ forwarded east};

  \node[font=\footnotesize] at (15.1,0.62) {one register per hop $\Rightarrow$ systolic};
\end{circuitikz}
\end{document}
```

*after Fig. 24.16, p. 742; widths and rates from the text on p. 742. The cell inset is my own construction — see the warning below.*

**Place the TPU on the specialization axis before looking at a single width.** The book orders inference architectures from generic to specialized (Fig. 24.12, p. 734): a *matrix of processing engines*, a *stream/dataflow* pipeline with one hardware unit per layer, and a *fully unrolled* netlist with one hardware neuron per neuron. The TPU is the first and most generic of the three. Neurons are virtual: weights and activations live in memory and are streamed through engines of fixed size, so *any* network maps onto the machine and runtime simply grows with network size (p. 735). The price is that every application-specific arithmetic decision has already been spent — the operand format, the product width and the accumulator width are frozen in silicon before anyone knows which network will run. Everything interesting about the TPU is therefore a consequence of that one commitment, and the design problem it leaves is not arithmetic but **matching the memory hierarchy to the compute**: each weight multiplies many activations, possibly across a batch, so fast local storage for weights is what decides whether the array is fed at all (p. 735).

**The $256\times256$ dimension is a bandwidth decision wearing an arithmetic costume.** The Matrix Multiply Unit is $65\,536$ MAC units, and the unit reads and writes 256 values per clock cycle; multiplying a $B\times256$ input matrix by the resident $256\times256$ constant weight matrix takes $B$ cycles and produces a $B\times256$ output (p. 742). Read that as an arithmetic-intensity statement. One load of the weight matrix costs $256\times256$ weight transfers and then supports $B\cdot 256\cdot 256$ multiply-accumulates, so each weight is reused $B$ times and the ratio of MACs to weight bytes moved is exactly $B$. The square shape is what makes the two edge bandwidths equal: 256 activations in per cycle, 256 results out per cycle, over one array whose interior traffic never leaves the chip. Grow the array and the interior grows as $n^2$ while the edges grow as $n$ — that quadratic-over-linear is the whole reason a systolic array is the standard answer to a memory-bound problem.

**The widths are the $p=m+n$, $q\ge p$ rule instantiated at $N=256$.** Each MAC takes 8-bit signed or unsigned inputs and the 16-bit products feed the Accumulators, which perform 256-element 32-bit accumulations (p. 742). That is [[Quantized MAC Neuron]] with the parameters filled in: $m=n=8$ gives exact products at $p=m+n=16$, and summing $N=256$ of them needs $\lceil\log_2 256\rceil = 8$ bits of headroom, so $q \ge 24$ makes the accumulation exact. The TPU takes $q=32$, eight bits above the minimum. Those eight bits are not waste: they are precisely what lets a logical dot product longer than 256 be tiled across several passes through the array, since each doubling of the tile count costs one more headroom bit, and $32-24 = 8$ buys $2^8$ tiles before the bound needs rechecking. Inside one pass the datapath is bit-exact against a binary32 simulation of the same int8 data; all the error in the machine is at the quantization boundaries, in [[Requantization Unit]] on the way back to 8 bits.

**Systolic means one register per hop, and that is the only reason $65\,536$ MACs can be clocked at all.** A 256-long accumulation done combinationally would put 256 dependent 32-bit additions on one path; instead each cell registers both the partial sum it passes south and the activation it passes east, so the critical path of the entire array is *one* $8\times8$ multiplier plus *one* 32-bit adder, independent of $256$. The array is globally synchronous (p. 742) — no handshaking, no local control, just a lockstep grid. What that costs is **skew**: since the partial sum entering row $i$ has already been registered $i$ times, the activation that must meet it has to be delayed by $i$ cycles too, so the input edge of the array is a triangular delay staircase and the pipeline takes on the order of $256+256$ cycles to fill and drain. That latency is invisible when $B$ is large and dominant when $B$ is small, which is the same conclusion the arithmetic-intensity argument reached from the other end.

> [!warning] The book gives the block diagram, not the intra-array dataflow
> Fig. 24.16 and the text on p. 742 fix the block structure, the widths and the rates, but say only "operates as a systolic array". Which operand is stationary and which two directions the moving operands take is not stated. The weight-stationary reading drawn in the inset above — weights resident, activations flowing east, partial sums flowing south — is the one consistent with the *constant* weight matrix and with the Weight FIFO being **read-only** to the Matrix Multiply Unit, but it is an inference, not a citation. Confirming it needs the primary source [Jou+17].

**Sixteen-bit operands are emulated in time, and that is the entire precision story of this machine.** It is possible to use 16-bit precision for either weights or activations, but it halves the speed; using 16-bit for both quarters it (p. 742). The mechanism is schoolbook decomposition plus distributivity: split a 16-bit operand as $X = X_h\,2^8 + X_l$ with $X_h, X_l$ each 8 bits, and
$$W\cdot X = W X_h\,2^8 + W X_l,$$
which is two passes of the 8-bit array with one result shifted left by 8 before the accumulator adds it. Do the same to $W$ and the product expands into four terms, hence four passes. Both factors of the throughput table are that expansion and nothing else. The consequence is the defining property of a generic accelerator: **it does not buy precision with area, it buys it with cycles**, because there is no per-layer datapath to widen. A stream architecture ([[Convolution Line Buffer]]) makes the opposite trade — it can give layer 3 a different multiplier from layer 5 — and that is exactly the freedom the TPU sold to be able to run anything.

**The split memory is an inference-only artefact, and training broke it twice.** Weights sit in an on-chip **Weight FIFO** fed from off-chip DDR3 but *read-only* to the array, while activations sit in a DMA-managed read/write **Activation Storage** (p. 742): the asymmetry encodes the assumption that weights are constants. Training destroys that assumption — it must write weight memory — so TPUv2 and later revert to a unified on-chip memory for both (p. 743). Training breaks the arithmetic too. TPUv1 was inference-only; v2 and v3 added learning, which *arithmetically meant replacing the 8-bit integer computations with bfloat16*, and TPUv4 supports both int8 and bfloat16 (p. 741). The reason is dynamic range, not precision: early-iteration gradient magnitudes are unpredictable and drift as training proceeds ([[Floating-Point Formats]]). Once the accumulator is floating point the exactness argument above dies with it — floating-point addition is not associative, so accumulation order becomes visible in the result, and the wide-integer guarantee has to be re-earned by error analysis instead of by a headroom count.

**On FPGA the same structure is a DSP-block tiling problem, and the fit is poor at int8.** Each cell is one $8\times8$ multiplier and one 32-bit add, which is exactly what a [[DSP Blocks|DSP block]] provides — except that its multiplier is roughly $18\times18$, so an int8 MAC wastes most of one, and heavily quantized networks abandon DSP blocks and build the arithmetic in LUTs instead (p. 748). The two memories map onto [[Block Memory]]: the Weight FIFO is a deep single-port ROM-like buffer, the Activation Storage a true dual-port read/write region, and the 256-wide edge bandwidth is what sets how many BRAMs must be banked in parallel rather than how deep they are. The honest FPGA verdict is that a systolic square is the wrong shape for reconfigurable fabric — you keep the weight-stationary cell and throw away the fixed $256\times256$ size, since on an FPGA you can simply build the array the layer actually needs.

$$\boxed{\ \text{cycles} = B\cdot\Big\lceil\tfrac{m}{8}\Big\rceil\cdot\Big\lceil\tfrac{n}{8}\Big\rceil,\qquad p = m+n = 16,\qquad q = 32 \ \ge\ p + \lceil\log_2 256\rceil = 24\ }$$

**When it breaks.**

- **Small $B$.** The whole economy rests on reusing each resident weight $B$ times. At $B=1$ — latency-bound serving, one image at a time — the machine spends $256$ cycles filling a pipeline to do one column of MACs, and the weight-load traffic that the array exists to amortise is amortised over nothing.
- **Layers whose dot product is not 256 long.** A $256\times256$ tile is padded to fit; a layer with 64 inputs uses a quarter of each column and wastes three quarters of $65\,536$ MACs. Convolutions with small channel counts — the first layers of most CNNs — are the worst case.
- **Sparsity buys exactly zero.** A zero weight still occupies a cell, still consumes a cycle, still burns the register toggles of the operands flowing through it. That is the sharpest contrast with [[Ternary MAC Unit]], where a zero weight deletes hardware from the netlist outright.
- **Sub-8-bit formats buy exactly zero, too.** Ternary, binary and 4-bit operands all occupy an 8-bit MAC on this array, so the entire low-precision literature — [[XNOR-Popcount Neuron]], [[LogicNet Neuron]], [[LNS Neuron]] — is unreachable here. Precision below the design point is free only on architectures that can be rebuilt.
- **The exactness claim is per pass, not per network.** It holds while accumulation is integer and no overflow occurs. On TPUv2+ in bfloat16, and on any int8 configuration where the requantisation between passes truncates, it does not.
- **TPUv1 cannot train.** Read-only weight memory is a hard architectural wall, not a firmware limitation (p. 743).
- **The array is only as good as the feed.** $65\,536$ MACs is a peak number; the binding constraint is 256 activations in and 256 results out per cycle, and any memory system that cannot sustain that turns the whole array into a very large idle grid.

**RTL (Spade).**

```spade
/// One cell of the Matrix Multiply Unit: a weight-stationary int8 MAC.
/// The weight stays resident; the activation is forwarded east one hop per
/// cycle and the 32-bit partial sum flows south one hop per cycle.
entity tpu_pe(
    clk: clock,
    ld: bool,
    w_in: int<8>,
    x_in: int<8>,
    s_in: int<32>,
) -> (int<8>, int<32>) {
    reg(clk) w: int<8> = if ld { w_in } else { w };
    let p: int<16> = w * x_in;
    reg(clk) x_out: int<8> = x_in;
    reg(clk) s_out: int<32> = s_in +. sext::<16, 32>(p);
    (x_out, s_out)
}

/// Two rows of one column of the array: the depth-256 accumulation chain
/// of the TPU, cut to depth 2.
entity mmu_col2(
    clk: clock,
    ld: bool,
    w0: int<8>,
    w1: int<8>,
    x0: int<8>,
    x1: int<8>,
) -> int<32> {
    let (_, s0) = inst tpu_pe(clk, ld, w0, x0, 0);
    let (_, s1) = inst tpu_pe(clk, ld, w1, x1, s0);
    s1
}
```

`w` is the resident weight of the inset, `p` is the $[16]$ wire out of the $\times$ box — `int<8> * int<8>` is `int<16>` by Spade's width rule, which is $p=m+n$ enforced by the type system — and `sext` is the sign-extension into the 32-bit lane, where a zero-extend would silently make every negative product enormous. `s_out` uses the wrapping `+.` rather than the widening `+` because the headroom argument has already shown that 32 bits cannot overflow at $N=256$; the register is the *only* thing that makes this systolic, and deleting it would collapse the whole column into one 256-deep combinational carry path. `mmu_col2` is a column of the array cut to depth 2, and it exhibits the skew directly: `s1` at cycle $k{+}2$ equals $w_0x_0(k) + w_1x_1(k{+}1)$, so the two activations must arrive one cycle apart to be summed together. Synthesis will not build the `+` as drawn — on FPGA it lands in a DSP block's post-adder, on ASIC in the multiplier's own compressor tree, in both cases fusing the $\times$ and $+$ boxes that the diagram separates.

Verified by simulation against a behavioural reference: 3006 vectors — a hand-computed skewed vector ($1\cdot100 + 127\cdot3 = 481$, asymmetric in both weight and activation so a swapped-lane or bit-reversed datapath fails it), the same operands presented *un*-skewed as a negative control, the signed extreme $(-128)(-128) = 16384$, and a 3000-case random sweep checking the column sum, the forwarded activation and the single-cell partial sum every cycle.

**Related Notes.**

- [[Quantized MAC Neuron]] – depends-on: the exactness rule this machine instantiates at $m=n=8$, $p=16$, $q=32$, $N=256$.
- [[DSP Blocks]] – compares: the FPGA primitive one cell would map onto, and the $18\times18$ multiplier it wastes at int8.
- [[Block Memory]] – depends-on: the Weight FIFO and Activation Storage, whose banking sets the 256-wide edge bandwidth.
- [[Floating-Point Formats]] – extends: bfloat16, the format that replaced int8 when v2 added training.
- [[Requantization Unit]] – extends: the $32\to8$ step in the Activation \& Pooling block where all the error is concentrated.
- [[ReLU Unit]] – supports: the $f$ of that block, and the reason the layer's scaling factors never reach a gate.
- [[Max Pooling Unit]] – supports: the pooling half of the same block.
- [[Convolution Line Buffer]] – counter-example: the stream architecture, which buys per-layer arithmetic at the cost of running only one network.
- [[Ternary MAC Unit]] – counter-example: a zero weight deletes hardware there and costs a full cycle here.
- [[XNOR-Popcount Neuron]] – counter-example: the limit case that a fixed 8-bit array cannot exploit at all.
- [[Choosing a Deep Learning Datapath]] – compares: where the generic array sits against every other datapath in the chapter.
- [[Winograd Convolution]] – compares: the other way to cut MAC count, and one this architecture can actually run in software.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §24.5.1 "Architectures for Inference", pp. 734–735 (Fig. 24.12; the matrix-of-engines class and its memory-hierarchy problem).
- §24.6.1 "Google's TPU Family", pp. 741–743 (Fig. 24.16; $256\times256$ array and $65\,536$ MACs; 8-bit signed or unsigned inputs, 16-bit products, 256-element 32-bit accumulations; 256 values read and written per cycle; $B$ cycles for a $B\times256$ input; 16-bit halves or quarters the speed; Weight FIFO read-only from DDR3 versus DMA-managed Activation Storage; bfloat16 from v2, int8 and bfloat16 on v4; unified memory from v2).
- §24.3.1.1 "Fixed-Point Formats for Inference", p. 726 ($p=m+n$, $q\ge p$, and the bit-exactness result the widths above satisfy).
- §24.3 "Number Formats", p. 724 (inference needs precision, training needs dynamic range).
- §24.6.4, p. 748 (DSP blocks wasted by int8; LUT-based arithmetic for heavily quantized networks).
