---
title: Convolution Line Buffer
description: "Two row FIFOs and nine registers presenting a fresh 3x3 window every cycle to a dedicated sum-of-products — the canonical building block of a stream/dataflow CNN, buying one activation per clock for two rows of storage."
kind: circuit
source: "ASA §24.5.1, pp. 734-737 (Fig. 24.14, p. 736)"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, cnn, convolution, dataflow, fpga]
aliases:
  - Line Buffer
  - Line Buffers
  - Sliding Window Buffer
  - Convolution Window Buffer
---

# Convolution Line Buffer

A tapped delay line whose taps sit at the pixel offsets of a $K\times K$ kernel, so that a raster stream entering at one activation per cycle presents a complete window to a sum-of-products every cycle — the distinguishing property being that its storage grows with the image *width* and the kernel *height*, and not at all with the image height.

```tikz title="3x3 convolution line buffer: two row FIFOs, nine window registers, one SOP"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % three delay rows, newest at the top; registers staggered right by 0.6 per row
  % so that the nine tap drops miss every box below them
  \foreach \r/\y/\xa in {0/5.2/0.7, 1/3.2/1.3, 2/1.2/1.9}{
    \foreach \c in {0,1,2}{
      \draw[fill=black!6] (\xa+1.9*\c-0.22,\y-0.3) rectangle (\xa+1.9*\c+0.22,\y+0.3);
    }
    \draw[->] (\xa+0.22,\y) -- (\xa+1.9-0.22,\y);
    \draw[->] (\xa+1.9+0.22,\y) -- (\xa+3.8-0.22,\y);
  }
  \node at (0.7,5.2) {$D$}; \node at (2.6,5.2) {$D$}; \node at (4.5,5.2) {$D$};
  \node at (1.3,3.2) {$D$}; \node at (3.2,3.2) {$D$}; \node at (5.1,3.2) {$D$};
  \node at (1.9,1.2) {$D$}; \node at (3.8,1.2) {$D$}; \node at (5.7,1.2) {$D$};

  % input stream
  \draw[->] (-1.9,5.2) -- (0.48,5.2);
  \node[anchor=south] at (-0.7,5.28) {$X$ [$m$], 1 px/cycle};

  % row FIFOs, and the wrap-around that carries the stream to the next row
  \foreach \r/\y/\yb/\xn/\xe in {0/5.2/4.35/1.3/4.72, 1/3.2/2.35/1.9/5.32}{
    \draw[->] (\xe,\y) -- (7.0,\y);
    \draw[fill=black!3] (7.0,\y-0.4) rectangle (11.0,\y+0.4);
    \draw[->] (11.0,\y) -- (11.7,\y) -- (11.7,\yb) -- (-1.3,\yb) -- (-1.3,\y-2.0)
              -- (\xn-0.22,\y-2.0);
  }
  \node[align=center] at (9.0,5.2) {row FIFO\\$(A_x-3)$ words $\times\ m$ bits};
  \node[align=center] at (9.0,3.2) {row FIFO\\$(A_x-3)$ words $\times\ m$ bits};
  \node[anchor=south] at (5.6,5.28) {[$m$]};
  \node[anchor=south] at (6.2,3.28) {[$m$]};
  \draw[->] (5.92,1.2) -- (6.6,1.2);
  \node[anchor=west] at (6.65,1.2) {discarded};

  % nine taps into the sum of products
  \foreach \x in {0.7,2.6,4.5}{ \draw[->] (\x,4.9) -- (\x,0.0); }
  \foreach \x in {1.3,3.2,5.1}{ \draw[->] (\x,2.9) -- (\x,0.0); }
  \foreach \x in {1.9,3.8,5.7}{ \draw[->] (\x,0.9) -- (\x,0.0); }

  \draw[fill=black!3] (0.0,-1.0) rectangle (8.2,0.0);
  \node at (4.1,-0.5) {convolution SOP: $9$ multipliers $+$ compressor tree $+$ bias};
  \node[anchor=west] at (6.3,0.3) {$9\times$[$m$]};
  \draw[->] (8.2,-0.5) -- (11.4,-0.5);
  \node[anchor=south] at (9.8,-0.42) {$Y_{r,c}$ [$q$]};
  \node[anchor=north] at (9.8,-0.58) {1 activation/cycle};

  \node[anchor=west] at (-1.95,4.62) {newest row};
  \node[anchor=west] at (-1.95,2.72) {1 row back};
  \node[anchor=west] at (-1.95,0.72) {2 rows back};
  \node[anchor=south west,fill=white,inner sep=1.5pt] at (5.9,4.46) {loop delay $=A_x$};
  \node[anchor=south west,fill=white,inner sep=1.5pt] at (5.9,2.46) {loop delay $=A_x$};
\end{circuitikz}
\end{document}
```

*After Fig. 24.14, p. 736. Drawn in **delay order**: the top row holds the most recently arrived pixels, so it is the **lowest** image row of the window; the book labels the same boxes in image order instead, which reads as though a register could hold a future sample. Which physical tap gets which weight is settled by the SOP's weight ordering, not by the buffer.*

**Reduce the two-dimensional window to a one-dimensional delay problem.** A stream/dataflow layer ([[Choosing a Deep Learning Datapath]]) receives its feature map in raster order: row by row from the top, left to right within a row, one activation of $m$ bits per clock. Under that ordering the pixel index is an affine function of arrival time — pixel $X_{r,c}$ arrives at cycle $t = rA_x + c$ for a feature map $A_x$ activations wide. Two pixels therefore differ in arrival time by
$$\Delta t = (r_1-r_2)A_x + (c_1-c_2),$$
which depends only on their *relative* position in the grid, never on where in the image the window happens to be. A $3\times3$ window is consequently a fixed set of nine delays applied to one stream, and the whole two-dimensional addressing problem collapses to: build a shift register and tap it in nine places.

**Read the tap set straight off that formula.** Take the newest tap as delay $1$ (one register of pipelining on the input). Substituting $(r_1-r_2)\in\{0,1,2\}$ and $(c_1-c_2)\in\{0,1,2\}$ gives the tap delays
$$\mathcal{D} = \{1,2,3\}\ \cup\ \{A_x{+}1,A_x{+}2,A_x{+}3\}\ \cup\ \{2A_x{+}1,2A_x{+}2,2A_x{+}3\}.$$
Within a group the delays are consecutive, so those three taps come from three back-to-back registers; between groups the gap is $A_x-3$, which is the row FIFO. That is exactly the structure in the diagram, and it is why the count is "nine registers, two FIFOs" rather than nine independent memories: **eight of the nine taps are free**, being intermediate nodes of a delay line the ninth tap needs anyway.

**Size the storage from the deepest tap.** The chain must be $\max\mathcal{D} = 2A_x+3$ elements long. For a general $K\times K$ kernel the same substitution gives $\max\mathcal{D} = (K-1)A_x + K$, split into $K^2$ discrete window registers and $K-1$ FIFOs of $A_x-K$ words each; the identity $K^2 + (K-1)(A_x-K) = (K-1)A_x+K$ checks the partition. Every element is $m$ bits wide, and with $K_z$ input channels interleaved in the stream every delay is scaled by $K_z$ — one line buffer per channel, or one buffer $K_z m$ bits wide.

> [!important] The image height never appears.
> $A_y$ is absent from $(K-1)A_x+K$. This is the whole reason streaming CNN inference fits on chip: a $224\times224$ layer needs $2\times224$ words of buffering for a $3\times3$ kernel, not $224^2$. Doubling the resolution doubles the buffer, not quadruples it, and any frame height whatsoever runs in the same hardware. Contrast the matrix-of-engines architecture, whose cost is set by the *whole* activation tensor living in memory and being restreamed — the memory traffic the chapter identifies as the dominant energy term (p. 723).

**Count the traffic it saves, which is the real payoff.** Computed naively, each output pixel reads its nine neighbours from the activation store: nine reads and one write per cycle, and eight of the nine reads fetch a word that was already fetched for a neighbouring output. The line buffer replaces that with one external read and one external write per cycle regardless of $K$, plus $K-1$ internal FIFO read/write pairs onto local memory. Each activation therefore crosses the expensive boundary exactly once and is reused $K^2$ times from cheap storage — the same "each operand multiplies many things, so give it fast local storage" argument that decides whether a systolic array is fed (p. 735), applied to the operand that streams rather than the one that is stationary.

**The tap widths are trivial; the widths after the taps are not.** Every tap is $m$ bits — a delay changes no width. The SOP behind it grows: nine products of $m\times n$ are $p=m+n$ bits, and summing nine of them needs $q \ge p + \lceil\log_2 9\rceil = p+4$ bits, extended by a further $\lceil\log_2 K_z\rceil$ when channels are accumulated. Nothing rounds anywhere inside that path — the only rounding in the whole layer is the final requantise ([[Requantization Unit]], format rules in [[Number Formats]]), so the buffer contributes no error at all. It is a pure reordering circuit; see [[Error Accuracy]] for why an exact reordering costs nothing in the budget.

**Choose the FIFO implementation from $A_x$, and the answer differs by target.** On an FPGA ([[FPGAs]]) the $A_x-K$ deep delay is not built from flip-flops. Short rows map onto the LUT's addressable shift-register mode, where one [[Lookup-Tables|LUT]] provides 16 or 32 delay stages for a single bit — so an $m$-bit row FIFO of depth $\le 32$ costs $m$ LUTs and no flops. Long rows go to [[Block Memory]] configured as a circular buffer: a simple dual-port BRAM with one address counter running modulo $A_x-K$, write port and read port one location apart, giving the required delay with one read and one write per cycle. Only the $K^2$ window registers stay as real flip-flops, because they are all read simultaneously and a memory has too few ports. On an ASIC the same split holds with a dual-port SRAM macro in place of the BRAM; the crossover moves, because an ASIC has no free 32-deep shift register and small SRAM macros carry a large fixed overhead, so the flip-flop region extends further.

**Everything hard about the circuit is the control that the figure omits.** The book is explicit that the initialization and termination of each buffer and each line, and the zero-padding, are control logic *not shown* in Fig. 24.14 (p. 736). Concretely: the SOP output is meaningless for the first $(K-1)A_x+K$ cycles of a frame while the chain fills, and it is meaningless again on every row boundary, because the window straddling column $A_x-1$ and column $0$ contains pixels from two different rows. A valid flag driven by a column counter and a row counter, or a stream of zeros injected at the borders to implement padding, is what turns the delay line into a convolution.

$$\boxed{\ D_K=(K-1)A_x+K\ \text{cycles},\qquad S_K=\big[K^2+(K-1)(A_x-K)\big]\,K_z\,m\ \text{bits}\ }$$

**When it breaks.**

- **Row boundaries and frame edges.** $K-1$ columns at each row wrap and $K-1$ rows at the top of each frame produce windows spanning discontiguous pixels. Without padding logic those outputs are garbage, not merely inaccurate.
- **Stride $>1$.** The window still advances one pixel per cycle, but only one output in $s$ (in $s^2$ for 2-D stride) is consumed, so the SOP idles $1-1/s^2$ of the time. The buffer is unchanged; the imbalance is the SOP's problem.
- **Several outputs per cycle.** Producing $p$ adjacent outputs simultaneously needs a window $K+p-1$ columns wide, so $ (K+p-1)$ registers per row rather than $K$ — the book's case (c), p. 737. The FIFOs shorten correspondingly; total storage barely moves.
- **Deep layers.** The $K_z$ factor is what actually hurts. A $3\times3$ layer with $A_x=14$ and $K_z=256$ needs more buffer words than one with $A_x=224$ and $K_z=3$, which is why the buffering cost of a CNN does not fall as fast as its spatial size.
- **Rate imbalance across layers.** After a pooling layer the data rate drops by $4\times$ ([[Max Pooling Unit]]), so a downstream line buffer clocked at full rate is mostly idle; the fix is to shrink the arithmetic behind it, e.g. digit-serial ([[Digit-Serial Adder]]), not to shrink the buffer (p. 749).
- **Winograd.** Fast convolution ([[Winograd Convolution]]) changes the *arithmetic* behind the taps and needs a slightly larger window buffer for tiled outputs, but the delay-line structure and its storage law survive untouched.

> [!warning] Not covered in the source — needs outside research
> The chapter gives no cost figure for the buffer itself: no LUT, BRAM or flip-flop count for a line buffer of a given $A_x$ and $m$, and no statement of where the SRL-versus-BRAM crossover falls on any particular device. The costs quoted in §24.6 (p. 748) are for the *arithmetic* only. The FPGA mapping described above is standard practice, not a claim sourced from this book.

**RTL (Spade).**

```spade
/// One N-cycle delay line, W bits wide: the row FIFO.
entity row_fifo<#uint W, #uint N>(clk: clock, rst: bool, x: uint<W>) -> uint<W> {
    reg(clk) d: [uint<W>; N] reset(rst: [0; N]) = d.shift_front(x);
    d.last()
}

/// 3x3 sliding-window line buffer for a raster stream of AX pixels per row.
/// Returns the nine window taps, element 0 being the newest sample.
entity line_buffer<#uint W, #uint AX>(clk: clock, rst: bool, x: uint<W>) -> [uint<W>; 9] {
    reg(clk) a0: uint<W> reset(rst: 0) = x;     // delay 1
    reg(clk) a1: uint<W> reset(rst: 0) = a0;    // delay 2
    reg(clk) a2: uint<W> reset(rst: 0) = a1;    // delay 3

    let r0 = inst row_fifo::<W, {AX - 3}>(clk, rst, a2);   // delay AX
    reg(clk) b0: uint<W> reset(rst: 0) = r0;    // delay AX+1
    reg(clk) b1: uint<W> reset(rst: 0) = b0;    // delay AX+2
    reg(clk) b2: uint<W> reset(rst: 0) = b1;    // delay AX+3

    let r1 = inst row_fifo::<W, {AX - 3}>(clk, rst, b2);   // delay 2AX
    reg(clk) c0: uint<W> reset(rst: 0) = r1;    // delay 2AX+1
    reg(clk) c1: uint<W> reset(rst: 0) = c0;    // delay 2AX+2
    reg(clk) c2: uint<W> reset(rst: 0) = c1;    // delay 2AX+3

    [a0, a1, a2, b0, b1, b2, c0, c1, c2]
}
```

`a0..c2` are the nine drawn $D$ boxes and the two `row_fifo` instances are the two drawn FIFOs; the returned array is the nine tap arrows entering the SOP, packed with element 0 in the least-significant position. Every signal stays $W$ bits — a delay line never changes width — and the whole block is registered, one activation in and one window out per clock, with `AX >= 4` required for the FIFO depth $A_x-3$ to be positive. Where synthesis departs from the drawing: `row_fifo` is written as an array-valued register, which infers flip-flops; on an FPGA you would let the tool retarget it to an SRL or replace it with an inferred dual-port RAM plus a modulo counter, and the ports of that RAM — not the drawn box — are what limits how many taps a row may carry.

**Related Notes.**

- [[Quantized MAC Neuron]] – supports: the sum-of-products the nine taps feed, and where the $q\ge p+4$ accumulator width comes from.
- [[Block Memory]] – depends-on: the row FIFO becomes a circular buffer in a dual-port BRAM once $A_x$ exceeds the shift-register mode's depth.
- [[Lookup-Tables]] – depends-on: short rows live in the LUT's addressable shift-register mode, $m$ LUTs and no flops.
- [[LTI Filters]] – compares: the same tapped delay line, one-dimensional, with coefficients instead of a kernel — a CNN layer is an FIR filter bank with a learnt impulse response.
- [[Choosing a Deep Learning Datapath]] – compares: why this structure belongs to the stream/dataflow class and not the matrix-of-engines one.
- [[Winograd Convolution]] – extends: replaces the arithmetic behind the taps while leaving the buffer's storage law intact.
- [[Max Pooling Unit]] – extends: consumes the SOP's output stream and quarters its rate, which is what unbalances the next stage.
- [[Digit-Serial Adder]] – supports: how the arithmetic downstream is shrunk once pooling has lowered the rate.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §24.5.1 Architectures for Inference — pp. 734–736 (Fig. 24.13 stream/dataflow architecture, Fig. 24.14 the $3\times3$ buffer architecture, p. 736)
- §24.5.2 Fast Convolution Algorithms — p. 737 (the sequential / one-per-cycle / several-per-cycle cases and their buffer implications)
- §24.2 Convolutional Neural Networks — pp. 715–720 (eq. 24.13, kernel and channel dimensions, padding and stride)
- §24.3 Number Formats — pp. 723–726 (memory traffic as the dominant cost, activation width rules)
- §24.6.4 Unrolling a ternary CNN — pp. 748–749 (rate rebalancing after pooling, digit-serial arithmetic)
