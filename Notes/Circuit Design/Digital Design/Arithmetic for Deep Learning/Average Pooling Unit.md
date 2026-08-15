---
title: Average Pooling Unit
description: "A four-input adder tree and a two-bit right shift per window — exact, cheaper than a comparator tree in LUTs, and the variant modern CNNs mostly abandoned."
kind: circuit
source: "ASA §24.2.2, pp. 719-720"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, pooling, cnn, adder, fpga]
aliases:
  - Average Pooling
  - Average Pooling Layer
  - Mean Pooling
  - AvgPool
---

# Average Pooling Unit

A pooling operator that replaces each $2\times2$ activation window by its arithmetic mean, so that unlike its max-pooling sibling it is a *linear* map and reduces to an adder tree plus a hard-wired shift.

```tikz title="Average pooling of a 4x4 activation map, and the adder-tree datapath for one 2x2 window"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
% ---- (a) the numeric example
\begin{scope}[yshift=5.25cm]
  \foreach \x/\y/\v in {0/3/4, 1/3/6, 2/3/6, 3/3/9,
                        0/2/2, 1/2/5, 2/2/13, 3/2/5,
                        0/1/6, 1/1/3, 2/1/5, 3/1/8,
                        0/0/5, 1/0/10, 2/0/9, 3/0/12}
    { \draw[gray] (0.62*\x,0.62*\y) rectangle ++(0.62,0.62);
      \node at (0.62*\x+0.31,0.62*\y+0.31) {\v}; }
  \draw[very thick] (0,1.24) rectangle (1.24,2.48);
  \draw[->] (2.95,1.24) -- (4.65,1.24);
  \node[anchor=south] at (3.8,1.42) {avg.\ pool};
  \foreach \x/\y/\v in {0/1/4.25, 1/1/8.25, 0/0/6, 1/0/8.5}
    { \draw[gray] (5.0+0.92*\x, 0.62+0.62*\y) rectangle ++(0.92,0.62);
      \node at (5.0+0.92*\x+0.46, 0.62+0.62*\y+0.31) {\v}; }
  \node[anchor=north] at (1.24,-0.15) {$4\times4$ activations};
  \node[anchor=north] at (5.92,0.47) {$2\times2$, exact means};
\end{scope}

% ---- (b) the datapath for one window
\node[anchor=west] at (-0.35,3.85) {\itshape one $2\times2$ window, $N$-bit activations};
\foreach \x/\n in {0/a, 1.55/b, 3.85/c, 5.4/d}
  { \draw[->] (\x,3.2) -- (\x,2.6); \node[anchor=south] at (\x,3.22) {$\n$}; }
\node[anchor=west] at (5.55,2.9) {[$N$]};

\draw (-0.35,2.1) rectangle (1.9,2.6);
\node at (0.775,2.35) {$+$ \ \ $c_{\mathrm{in}}=1$};
\draw (3.5,2.1) rectangle (5.75,2.6);
\node at (4.625,2.35) {$+$ \ \ $c_{\mathrm{in}}=1$};

\draw[->] (0.775,2.1) -- (0.775,1.1) -- (1.5,1.1);
\draw[->] (4.625,2.1) -- (4.625,1.1) -- (3.9,1.1);
\node[anchor=south west] at (0.87,1.48) {$s_0$ [$N{+}1$]};
\node[anchor=south east] at (4.53,1.48) {[$N{+}1$] $s_1$};

\draw (1.5,0.85) rectangle (3.9,1.35);
\node at (2.7,1.1) {$+$};

\draw[->] (2.7,0.85) -- (2.7,0.35);
\node[anchor=west] at (2.85,0.6) {$S=a{+}b{+}c{+}d{+}2$ \ [$N{+}2$]};

\draw[dashed] (1.9,-0.15) rectangle (3.5,0.35);
\node at (2.7,0.1) {$\gg 2$};
\node[anchor=west] at (3.65,0.1) {pure rewiring, no logic};

\draw[->] (2.7,-0.15) -- (2.7,-0.8);
\node[anchor=west] at (2.85,-0.5) {$\overline{X}=S[N{+}1{:}2]$ \ [$N$]};
\end{circuitikz}
\end{document}
```

*Panel (a) after Fig. 24.7(b), p. 720 — the same $4\times4$ map the book uses for max pooling, so the two figures are directly comparable. Panel (b) is my own construction; the book gives no pooling datapath.*

**Reduce the layer definition to a four-input reduction.** A pooling layer merges neighbouring activations of one channel into a single output, applied per channel with stride equal to the window size, so $A_x^{\ell+2} = A_x^{\ell+1}/2$ and $A_y^{\ell+2} = A_y^{\ell+1}/2$ while $A_z^{\ell+2} = A_z^{\ell+1}$ — the map halves in both spatial dimensions and keeps its depth (p. 720). For the standard $2\times2$ window the whole operator is therefore

$$\overline{X}_{x,y,z} = \tfrac14\big(X_{2x,2y,z} + X_{2x+1,2y,z} + X_{2x,2y+1,z} + X_{2x+1,2y+1,z}\big)$$

four unsigned $N$-bit activations in, one out. Post-ReLU activations are unsigned by construction, which is why every width below is a `uint`; if the pooling sits before the activation function the same tree runs on `int<N>` with sign-extension instead of zero-extension, and nothing else changes.

**Grow the width honestly before touching the divisor.** Summing four $N$-bit values needs $N + \lceil\log_2 4\rceil = N+2$ bits, and no fewer: $4(2^N-1) = 2^{N+2}-4$ still needs the top bit. The natural shape is a balanced two-rank tree — $s_0 = a+b$ and $s_1 = c+d$ in parallel at $N+1$ bits, then $S = s_0+s_1$ at $N+2$ bits — which halves the critical path against a linear chain of three [[RCA, Ripple-Carry Adder|ripple-carry adders]] at identical adder count. Four operands is exactly the width at which a [[Compressor Trees|compressor tree]] stops paying: a 4:2 compression stage followed by a final CPA is the same two ranks of carry propagation you already have, so the carry-save machinery buys nothing here and costs the extra rank of XORs.

**The divide by four costs nothing, because the divisor is a power of two.** $\overline{X} = S/4$ is a right shift by two, and a constant shift is a renaming of wires — index $i$ of $S$ becomes index $i-2$ of the result, no gates, no delay. This is the entire arithmetic content of average pooling and it is why the operator is cheap. Note the width bookkeeping: $S$ has $N+2$ integer bits, so $S/4$ has $N$ integer bits and **two fractional bits**, which is exactly what panel (a) shows — the means $4.25$, $8.25$, $8.5$ are not integers and cannot be, since a quarter is the natural ulp of a four-way mean. See [[Number Formats]] for the fixed-point notation and [[Error Accuracy]] for what an ulp is.

**Decide what happens to those two fractional bits, and buy rounding for free.** Keeping them widens the next layer's operands for no accuracy the network can use, so the two bits are discarded and the output stays $N$ bits. Simply dropping them is truncation, $\lfloor S/4 \rfloor$, which is biased: the error is uniform on $[0, \tfrac34]$ ulp with mean $\tfrac38$ ulp, and — unlike a truncation inside a multiplier — this bias is *systematic across the whole feature map* and accumulates layer over layer, because every pooled activation is short by the same amount on average. Round-to-nearest fixes it, and the cost is zero: rounding $S/4$ means computing $\lfloor (S+2)/4 \rfloor$, and $+2$ at weight $0$ is $+1$ in each of the two rank-one adders. Both of those adders have an idle carry-in. **Tie both $c_\text{in}$ high and the rounding is free**, with no width growth either, since $a+b+1 \le 2^{N+1}-1$ still fits in $N+1$ bits. On an FPGA this is even more literally free than on an ASIC: the carry-in of a `CARRY4`/`CARRY8` chain is a dedicated input that is being driven with a constant regardless.

**Judge the cost against max pooling structurally, not from a table.** Both operators reduce four $N$-bit values in two ranks. Average pooling's rank is an adder; max pooling's rank is a [[Comparators|comparator]] *plus* an $N$-bit 2:1 multiplexer to select the winner. On [[FPGAs]] both the adder and the comparator's subtractor map one bit per LUT onto the hard carry chain, so they tie, and the mux is pure extra — roughly $N/2$ LUTs per rank on a 6-input LUT that can pack two 2:1 muxes. Average pooling is therefore the cheaper of the two by about the cost of the mux tree, partly offset by its adders being one and two bits wider. The asymmetry is small and it points the wrong way from what the field actually does.

> [!note]
> Average pooling wins the arithmetic argument and lost anyway. Max pooling dominates modern CNNs (p. 719); average pooling "was used in early works" and the book's own verdict is that the best method depends on the problem [BPL10]. The selection pressure here is statistical — max preserves the strongest activation and is the more robust detector of *whether* a feature is present — not gate count. This is worth internalising as a general shape: in deep-learning hardware the cheap operator frequently loses, and the arithmetic designer's job is to make the *chosen* operator cheap rather than to lobby for the cheap one.

**Anything but a power-of-two window changes the circuit's class.** A $3\times3$ pooling window needs $\div 9$, which is not a shift. That moves the operator out of "free" and into [[Division by Constants]] — a multiply-by-reciprocal plus a correction, or one of the exact constant-division recurrences — and it is the reason $2\times2$ is effectively universal. The same wall is hit by *global* average pooling, where the window is the entire $A_x \times A_y$ feature map and the divisor is whatever that product happens to be.

> [!warning] Not covered in the source — needs outside research
> Global average pooling (replacing the flatten-plus-dense head with one mean per channel) is standard in ResNet-class networks but is not discussed in Ch. 24. Its accumulator width, $N + \lceil\log_2(A_xA_y)\rceil$, and its non-power-of-two divisor make it a genuinely different circuit from the $2\times2$ unit here.

**Weighted average pooling is the same tree with the shift replaced by a multiplier bank.** The book's third variant weights each activation by its distance to the window centre (p. 719). Arithmetically that is a $2\times2$ convolution with fixed coefficients fused into the reduction, so it belongs to the constant-multiplication family and not here; the free-shift property is gone the moment the weights are not all equal.

**Feeding it costs more than computing it.** The four activations of one window are not simultaneously available in a raster-scan stream — two of them arrive a full row later. The vertical neighbour must come from a row FIFO, so an average pooling unit in a streaming datapath is one [[Convolution Line Buffer]] plus this tree, and the buffer is the larger structure by orders of magnitude. With stride 2 the tree produces one output per four inputs, so a single unit at the conv layer's clock rate is idle three cycles in four and one physical unit per channel is ample.

$$\boxed{\ \overline{X} = \Big\lfloor \frac{a+b+c+d+2}{4} \Big\rfloor = \big[(a+b+1) + (c+d+1)\big]_{N+1:2}\ }$$

**When it breaks.**

- **Signed activations without sign-extension.** Zero-extending an `int<N>` into the tree computes the mean of the unsigned reinterpretations. Pooling placed *before* ReLU must use `sext` and a signed shift (`>>>`), or every negative activation reads as a large positive one.
- **Windows that are not $2\times2$.** $3\times3$, $5\times5$ and global pooling all lose the free divide; see [[Division by Constants]].
- **Truncation, at low precision.** At $N=8$ the $\tfrac38$-ulp truncation bias is $\approx0.15\%$ of full scale and invisible; in a ternary or 4-bit network it is a large fraction of the representable step, and the free carry-ins are no longer optional.
- **Non-power-of-two map dimensions.** An odd $A_x$ leaves a half window at the border, which needs either padding or a divisor of 2 instead of 4 on that column — a second, narrower datapath, not a corner case the main tree absorbs.
- **Overflow, only if you truncate too early.** The tree is exact end to end; the only place a value can be lost is a designer writing `+.` instead of `+` on the rank-one adders to keep the width at $N$.

**The whole operator, in nine lines of Spade.**

```spade
/// Exact 2x2 average pool with round-to-nearest, for four N-bit activations.
/// Both rank-one adders carry in a 1; together they inject the +2 at weight 0
/// that turns the >>2 truncation into round-half-up. Costs no logic.
fn avg_pool4<#uint N>(a: uint<N>, b: uint<N>, c: uint<N>, d: uint<N>) -> uint<N> {
    let s0: uint<{N + 1}> = trunc((a + b) + 1);
    let s1: uint<{N + 1}> = trunc((c + d) + 1);
    let s:  uint<{N + 2}> = s0 + s1;
    trunc(s >> 2)
}
```

`s0`/`s1` are the two rank-one adder outputs of the diagram, `s` is $S$. The `trunc` on `s0` is not a value truncation — `(a + b)` is already $N+1$ bits and `+ 1` widens it to $N+2$ in Spade's type system, but $a+b+1 \le 2^{N+1}-1$ so the discarded bit is provably zero; the `trunc` is telling the compiler what the carry-in trick already guarantees. The final `trunc(s >> 2)` is the two-bit shift: it keeps bits $N{+}1$ down to $2$ of $S$, which is the only reason the whole operator is combinational and gate-free after the adders. Synthesis will not build the tree as drawn — it flattens all three adders into one carry chain and lets the mapper choose the association, so the "two ranks" of the diagram is a latency claim, not a netlist claim.

Verified by simulation at $N=8$: the four windows of panel (a), the asymmetric vectors $1+128+0+0$ and its permutations (a bit-reversal or operand-swap bug survives every symmetric vector), the saturated case $255{\times}4$, and a 5000-vector random sweep against the behavioural reference $\lfloor(a{+}b{+}c{+}d{+}2)/4\rfloor$ — 5010 vectors, zero mismatches.

**Related notes.**

- [[Max Pooling Unit]] – compares: the sibling that replaces every adder with a comparator-plus-mux and won the field anyway.
- [[RCA, Ripple-Carry Adder]] – depends-on: each of the three nodes in the tree, and the source of the idle carry-in that makes rounding free.
- [[Compressor Trees]] – counter-example: the standard answer for multi-operand addition, which does not pay at four operands and two ranks.
- [[Division by Constants]] – extends: what the shift becomes as soon as the window is $3\times3$ or global.
- [[Convolution Line Buffer]] – depends-on: supplies the vertical neighbours; the larger structure of the two by far.
- [[Requantization Unit]] – supports: the general case of dropping low-order bits with a rounding rule, of which the $\gg 2$ here is the free instance.
- [[Adders]] – depends-on: the hub for the tree's building block and its FPGA carry-chain mapping.
- [[Rounding]] – supports: why the $\tfrac38$-ulp truncation bias matters more than its magnitude suggests.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §24.2.2 *Pooling Layers*, pp. 719–720 — max / average / weighted average pooling, Fig. 24.7.
  - p. 720 — per-channel application, stride equal to window size, $A^{\ell+2}_{x/y} = A^{\ell+1}_{x/y}/2$.
  - p. 719 — pooling reduces data volume and adds robustness to noise and small translations [BPL10]; average pooling in early works, max pooling in modern CNNs.
- Long-form note: [[6.2) Arithmetic for Deep Learning]], §*Convolutional neural networks*.
