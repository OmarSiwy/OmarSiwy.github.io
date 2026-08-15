---
title: Max Pooling Unit
description: "A comparator tree over a 2x2 strided window, halving width and height per channel for the cost of three comparators and no arithmetic at all."
kind: circuit
source: "ASA §24.2.2, pp. 719-720"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, pooling, comparator, cnn]
aliases:
  - Max Pooling
  - Max Pool
  - Maxpool
  - Max Pooling Layer
---

# Max Pooling Unit

A max pooling unit reduces each $2\times2$ activation window of one channel to its largest element, and it is the only stage in a CNN inference datapath that contains no adder, no multiplier and no rounding.

```tikz title="2x2 max pooling: the book's numeric example above, the comparator tree that implements it below"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- input tile, values from Fig. 24.7(a) ----
  \foreach \i in {0,...,4} {
    \draw[gray!60] (\i*0.7,0) -- (\i*0.7,2.8);
    \draw[gray!60] (0,\i*0.7) -- (2.8,\i*0.7);
  }
  \foreach \v/\c/\r in {4/0/0, 6/1/0, 6/2/0, 9/3/0,
                        2/0/1, 5/1/1, 13/2/1, 5/3/1,
                        6/0/2, 3/1/2, 5/2/2, 8/3/2,
                        5/0/3, 10/1/3, 9/2/3, 12/3/3}
    { \node at (\c*0.7+0.35, 2.8-\r*0.7-0.35) {\v}; }
  \draw[very thick] (0,1.4) rectangle (1.4,2.8);
  \draw[very thick] (1.4,1.4) rectangle (2.8,2.8);
  \draw[very thick] (0,0) rectangle (1.4,1.4);
  \draw[very thick] (1.4,0) rectangle (2.8,1.4);
  \node[anchor=north] at (1.4,-0.15) {$A_x\times A_y$, one channel, $[m]$/cell};

  \draw[->,thick] (3.2,1.4) -- (4.5,1.4);
  \node[anchor=south] at (3.85,1.5) {\scriptsize max pool};
  \node[anchor=north] at (3.85,1.3) {\scriptsize $2\times2$, stride 2};

  % ---- output tile ----
  \begin{scope}[xshift=4.9cm, yshift=0.7cm]
    \foreach \i in {0,1,2} {
      \draw[gray!60] (\i*0.7,0) -- (\i*0.7,1.4);
      \draw[gray!60] (0,\i*0.7) -- (1.4,\i*0.7);
    }
    \draw[very thick] (0,0) rectangle (1.4,1.4);
    \node at (0.35,1.05) {6};  \node at (1.05,1.05) {13};
    \node at (0.35,0.35) {10}; \node at (1.05,0.35) {12};
    \node[anchor=north] at (0.7,-0.15) {$\frac{A_x}{2}\times\frac{A_y}{2}$, still $[m]$};
  \end{scope}

  % ---- comparator tree for one window ----
  \node at (0.6,-1.7) {$x_{00}$}; \node at (2.2,-1.7) {$x_{01}$};
  \node at (4.0,-1.7) {$x_{10}$}; \node at (5.6,-1.7) {$x_{11}$};
  \draw[->] (0.6,-1.95) -- (0.6,-2.4); \draw[->] (2.2,-1.95) -- (2.2,-2.4);
  \draw[->] (4.0,-1.95) -- (4.0,-2.4); \draw[->] (5.6,-1.95) -- (5.6,-2.4);
  \node[anchor=west] at (0.68,-2.2) {\scriptsize $[m]$};
  \node[anchor=west] at (4.08,-2.2) {\scriptsize $[m]$};

  \draw (0.0,-3.1) rectangle (2.8,-2.4);
  \node at (1.4,-2.75) {\scriptsize max2};
  \draw (3.4,-3.1) rectangle (6.2,-2.4);
  \node at (4.8,-2.75) {\scriptsize max2};
  \node[anchor=west,align=left] at (6.5,-2.75) {\scriptsize each max2 $=$ $m$-bit magnitude\\[-2pt]\scriptsize compare $+$ $m$-bit 2:1 mux};

  \draw[->] (1.4,-3.1) -- (1.4,-3.6) -- (2.4,-3.6) -- (2.4,-3.95);
  \draw[->] (4.8,-3.1) -- (4.8,-3.6) -- (3.8,-3.6) -- (3.8,-3.95);
  \node[anchor=south] at (1.9,-3.58) {\scriptsize $[m]$};
  \node[anchor=south] at (4.3,-3.58) {\scriptsize $[m]$};

  \draw (1.8,-4.65) rectangle (4.4,-3.95);
  \node at (3.1,-4.3) {\scriptsize max2};
  \node[anchor=west,align=left] at (6.5,-4.3) {\scriptsize 3 comparators, depth 2,\\[-2pt]\scriptsize zero adders};
  \draw[->] (3.1,-4.65) -- (3.1,-5.3);
  \node[anchor=west] at (3.18,-5.0) {$P_{x,y}$ $[m]$ --- no width growth};
\end{circuitikz}
\end{document}
```

*Numeric tiles after Fig. 24.7(a), p. 720; the comparator tree is my own reading of the hardware that figure implies — the book draws the operation, not the circuit.*

**Fix what the layer is required to compute.** A pooling layer merges neighbouring activations of layer $\ell+1$ into a single activation of layer $\ell+2$, and it does so *per channel*: the window sweeps $x$ and $y$ only, never $z$, so $A_z^{\ell+2} = A_z^{\ell+1}$ (p. 720). The stride is set equal to the window size, which makes the windows a disjoint tiling of the tile and gives $A_{x/y}^{\ell+2} = A_{x/y}^{\ell+1}/2$ for the $2\times2$ case. Every value in and out is one activation word of $m$ bits in whatever format [[Number Formats]] fixed for that layer — the same $m$ on both sides, because a maximum of a set is an element of that set.

**Reduce the definition to a comparator tree.** $\max$ over a set has no preferred evaluation order: it is associative and commutative, exactly like $+$, so the four-input reduction may be bracketed however the layout prefers. Bracketing as a balanced tree, $\max(\max(x_{00},x_{01}),\max(x_{10},x_{11}))$, gives three two-input units at depth two instead of the depth-three chain $\max(x_{00},\max(x_{01},\max(x_{10},x_{11})))$ — same three units, one level less delay, so the tree is strictly better and the chain is never worth drawing. Each two-input unit is an $m$-bit magnitude comparison feeding the select of an $m$-bit 2:1 multiplexer ([[Comparators]], [[Magnitude Comparator]]); nothing in the datapath ever produces a value that is not already one of its inputs, which is why there is no $m+1$st bit anywhere in the diagram.

**Reassociate the window into rows and columns to shrink the buffer.** In a streaming (dataflow) implementation the tile arrives in raster order, one activation per cycle, and the naive reading is that a $2\times2$ window needs a full row of history — the same $A_x$-word FIFO that a $3\times3$ convolution needs ([[Convolution Line Buffer]]). Associativity kills that requirement. Write the window reduction as $\max\bigl(\max(x_{00},x_{01}),\max(x_{10},x_{11})\bigr)$, i.e. horizontal first: as row $2r$ streams past, one max2 unit collapses each adjacent column pair, producing $\lceil A_x/2\rceil$ partial maxima that go into a FIFO **half a row wide**; as row $2r+1$ streams past, the same horizontal collapse happens and a second max2 unit combines it with the FIFO output to emit $P_{x,y}$. Two physical comparators and $\lceil A_x/2\rceil\cdot m$ bits of storage replace three comparators and $A_x\cdot m$ bits, and this is precisely the separability argument used for separable filters, applied to a semiring whose addition is $\max$.

**Nothing here has an error budget.** Every other operator in the datapath — the multiplier bank, the compressor tree, the requantiser — has an accuracy story, because each either grows the word or throws bits away. Max pooling has neither: the output is bit-identical to one of the inputs, so the layer contributes exactly zero ulp of error and does not appear in the layer-by-layer analysis of [[Error Accuracy]] at all. Contrast [[Average Pooling Unit]], which sums four $m$-bit words into $m+2$ bits and then shifts right by two, and therefore *does* need a rounding decision. That asymmetry, and not any statistical argument, is the reason max pooling is nearly free to insert anywhere in a fixed-point pipeline.

> [!note]
> **Max commutes with every monotone map.** For any non-decreasing $f$, $\max\bigl(f(a),f(b)\bigr) = f\bigl(\max(a,b)\bigr)$, because $f$ preserves the order that $\max$ selects on. Every pointwise element the layer sits next to is non-decreasing: ReLU is, leaky ReLU with $\alpha \ge 0$ is, and a requantisation $x \mapsto \lfloor \gamma x \rceil$ with $\gamma>0$ is. So the pooling unit can be slid to either side of them without changing a single output bit. That is a scheduling degree of freedom, not a curiosity: put the pooling *before* the requantiser and the requantiser runs at a quarter of the activation rate on a quarter of the data; put it *after* the ReLU and the activations are guaranteed non-negative, so the comparator is unsigned.

**Signedness picks the comparator, and it is the only real design choice.** An unsigned $m$-bit comparison and a two's-complement one differ by exactly one inversion: $a <_{\text{signed}} b$ iff $\bar a_{m-1}a_{m-2{:}0} <_{\text{unsigned}} \bar b_{m-1}b_{m-2{:}0}$, since flipping the sign bit is the order-preserving bijection from the two's-complement ordering to the unsigned one. So the cost is one XOR on each MSB, or zero if the layer sits after a [[ReLU Unit]] and the format is already unsigned. Get it wrong in the signed case and the circuit still compiles, still passes any test vector drawn from the non-negative half, and silently reports $-1$ (`0xFF`) as the largest of $\{-1, 1, 2, 3\}$.

**Max is the one reduction that runs MSB-first with no carry propagation.** Scan the candidates a bit at a time from the most significant end, keeping one "still in contention" flip-flop per candidate. At each position, if any live candidate has a $1$ there, kill every live candidate with a $0$ there; the output bit is the OR of the live candidates' bits. The recursion is over the prefix order and never needs to look back, because a decision made at bit $i$ can never be reversed by bit $i-1$ — the opposite of addition, where the carry forces LSB-first. The consequence for hardware: max pooling composes with an MSB-first digit-serial datapath at one flip-flop per candidate and a handful of gates per digit, where a [[Digit-Serial Adder]] must run the other way and the two cannot share a direction.

**FPGA and ASIC diverge on the mux, not the comparator.** The comparison is a subtraction whose only surviving output is the borrow-out, so on FPGA it maps onto the same hard carry chain as an adder of the same width — one carry stage per bit, and see [[FPGAs]] — while the $m$-bit 2:1 select is a separate LUT per bit that the carry chain cannot absorb. On an ASIC the same split appears as a comparator cell plus an $m$-wide mux row, but there the mux is the cheap half. Either way the whole tree is small enough that in a real accelerator it disappears against the MAC array; what pooling actually costs is the FIFO and the control that manages row and tile boundaries.

$$\boxed{\ P_{x,y,z}=\max_{i,j\in\{0,1\}} X^{\ell+1}_{2x+i,\;2y+j,\;z}\ \in\ \{X^{\ell+1}_{\cdot}\},\qquad \max\bigl(f(a),f(b)\bigr)=f\bigl(\max(a,b)\bigr)\ \text{for non-decreasing } f\ }$$

**When it breaks.**

- **Overlapping pooling.** A $3\times3$ window at stride 2 (AlexNet-style) makes the windows share columns, so the disjoint-tiling assumption fails and the half-row FIFO trick with it: you are back to a real [[Convolution Line Buffer]] with two row FIFOs and a $3\times3$ register window, and the comparator count goes from 3 to 8.
- **Odd $A_x$ or $A_y$.** The last window is short and must be padded with the *identity of $\max$*, which is the format's minimum — $0$ for unsigned post-ReLU data, the most negative representable value for signed. Zero-padding a signed tile is a genuine bug, not a rounding difference: a padded $0$ beats every real negative activation in the window.
- **Floating-point activations.** For two non-negative IEEE-754 values the bit pattern is order-isomorphic to the number, so the unsigned integer comparator is already the correct float comparator and no exponent/mantissa split is needed. Sign and NaN break it, so this shortcut is only legal downstream of a ReLU.
- **Training.** Inference discards which of the four won; backpropagation does not, because the gradient routes entirely to the arg-max position. A training-capable pooling unit must also emit and store a 2-bit index per window — see [[Argmax Unit]] for the same comparator tree carrying its index along.
- **Asymptotically it never matters.** The comparators are $O(m)$ per output against $O(K_x K_y K_z m n)$ for the convolution that feeds them. There is no width at which optimising the pooling unit repays the effort; optimise the buffer instead.

> [!warning] Not covered in the source — needs outside research
> The book presents pooling as an operation (Fig. 24.7) and states the comparator/adder distinction in one sentence, but gives no cost model, no LUT or delay figures, and no guidance on the parallel-tree versus streaming-reassociation trade-off. The half-row-FIFO construction above, the MSB-first digit-serial argument and the FPGA carry-chain mapping are reconstructions, consistent with the book's other operator treatments but not stated there.

**The RTL is three lines because the operation is.**

```spade
fn max2<#uint W>(a: uint<W>, b: uint<W>) -> uint<W> {
    if a > b { a } else { b }
}

fn max_pool_2x2<#uint W>(
    x00: uint<W>, x01: uint<W>,
    x10: uint<W>, x11: uint<W>,
) -> uint<W> {
    max2(max2(x00, x01), max2(x10, x11))
}
```

`max2` is one box of the diagram: `a > b` is the magnitude comparator, the `if` is the $m$-bit 2:1 mux, and because the result type is `uint<W>` rather than `uint<{W+1}>` the compiler itself witnesses the no-width-growth claim — an adder here would not typecheck. The bracketing in `max_pool_2x2` is the balanced tree, so the critical path is two comparator delays, not three; it is purely combinational, and the streaming variant would wrap the same `max2` in an `entity` with a `reg` and a `std::mem::fifo`. Synthesis will not build three independent comparators as drawn: it flattens the tree into a single 4-input select whose one-hot conditions it shares, which is why the drawn comparator count is an upper bound. Verified against the 8-bit monomorphisation `entity mp8(x00, x01, x10, x11) -> uint<8>`.

**Related Notes.**

- [[Magnitude Comparator]] – depends-on: each max2 box is one of these plus a mux; its width/delay trade-off is the only trade-off this unit has.
- [[Convolution Line Buffer]] – compares: the buffer max pooling *avoids* — associativity halves it to $\lceil A_x/2\rceil$ words, and overlapping windows give it back.
- [[Average Pooling Unit]] – compares: same window and stride, but an adder tree plus a shift, so it carries a rounding decision this one does not.
- [[Argmax Unit]] – extends: the same comparator tree carrying the winner's index, which is what training needs and inference throws away.
- [[ReLU Unit]] – supports: monotone, so it commutes through this unit; placing it first makes the comparator unsigned.
- [[Requantization Unit]] – supports: also monotone, so pooling can be scheduled before it and run it at a quarter rate.
- [[Digit-Serial Adder]] – counter-example: max streams MSB-first without carry propagation, addition cannot, so the two fix opposite digit orders.
- [[Choosing a Deep Learning Datapath]] – compares: where a pooling stage sits in the layer-by-layer resource budget.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §24.2.2 "Pooling Layers", pp. 719–720, and Fig. 24.7 (p. 720).
- §24.2.1 "Practical Considerations", p. 719, for stride and padding.
- §24.5.1 "Architectures for Inference", pp. 734–736, and Fig. 24.14, for the streaming/line-buffer context the pooling FIFO lives in.
- Long-form note `6.2) Arithmetic for Deep Learning.md`, section "Convolutional neural networks".
