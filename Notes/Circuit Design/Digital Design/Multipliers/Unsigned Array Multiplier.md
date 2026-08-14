---
title: Unsigned Array Multiplier
description: "Schoolbook radix-2 partial products: one AND gate per bit pair, a w_X x w_Y rectangle dropped into a bit heap — the baseline every other multiplier is measured against."
kind: circuit
source: "ASA §8.1.1, §8.2, §8.3, pp. 203-215"
status: seed
spade: simulated
tags: [digital, multipliers, partial-products, bit-heap, schoolbook]
aliases:
  - Array Multiplier
  - Schoolbook Multiplier
  - Radix-2 Partial Product Generation
  - Partial Product Array
  - Unsigned Multiplier
---

# Unsigned Array Multiplier

The direct expansion of $X\times Y$ into $w_Xw_Y$ independent AND gates — the only multiplier whose partial-product generation costs exactly one gate delay and not one bit of carry, which is why every other multiplier in this topic is quoted as a saving against it.

```tikz title="Partial-product alignment of an unsigned 4x4 multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1.15cm,y=1cm,font=\small]
  % --- the w_X x w_Y rectangle of AND-gate outputs, sheared into rows ---
  \foreach \i in {0,...,3}
    \foreach \j in {0,...,3}
      \node at ({7-(\i+\j)}, {-0.68*\i}) {$x_\i y_\j$};
  \foreach \i in {1,2,3} \node at (-0.75,{-0.68*\i}) {$+$};
  \node[anchor=west,font=\footnotesize] at (8.0,-0.34)
    {row $i$ is $x_i\cdot Y$, shifted left by $i$};
  \node[anchor=west,font=\footnotesize] at (8.0,-1.7)
    {$w_Xw_Y=16$ AND gates, no carry};

  % --- rule and product word ---
  \draw (7.75,-2.38) -- (-1.05,-2.38);
  \node at (-0.75,-2.75) {$=$};
  \foreach \c in {0,...,7} \node at ({7-\c},-2.75) {$p_\c$};

  % --- column heights of the resulting bit heap ---
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/3,5/2,6/1}
    \node[font=\footnotesize] at ({7-\c},-3.35) {\h};
  \node[anchor=west,font=\footnotesize] at (7.6,-3.35) {column heights};

  % --- extents ---
  \draw[|-|] (4,0.62) -- (7,0.62) node[midway,above,font=\footnotesize] {$w_Y=4$};
  \draw[|-|] (-1.55,0.2) -- (-1.55,-2.24)
    node[midway,above,rotate=90,font=\footnotesize] {$w_X=4$ rows};
  \draw[|-|] (0,-4.0) -- (7,-4.0)
    node[midway,below,font=\footnotesize] {$w_P=w_X+w_Y=8$};
\end{circuitikz}
\end{document}
```

*after Fig. 8.6, p. 215.*

**Derive the array from distributivity and nothing else.** Write each unsigned operand in its positional form, $X=\sum_{i=0}^{w_X-1}2^ix_i$ on $w_X$ bits and $Y=\sum_{j=0}^{w_Y-1}2^jy_j$ on $w_Y$ bits, and apply **distributivity of $\times$ over $+$** once per factor (8.13–8.14, p. 214):

$$P=X\times Y=\left(\sum_{i=0}^{w_X-1}2^ix_i\right)\times Y=\sum_{i=0}^{w_X-1}\sum_{j=0}^{w_Y-1}2^{i+j}\,x_iy_j$$

Each term $x_iy_j$ is a single bit — the product of two bits *is* their conjunction, so one AND gate produces it — carrying weight $2^{i+j}$. That is $w_Xw_Y$ gates with no gate depending on another: **constant delay, one gate level, independent of $w$**. What comes out is not a number but a [[Bit Heaps|bit heap]] of $w_Xw_Y$ weighted bits spread over positions $0$ to $w_X+w_Y-2$, i.e. $w_X+w_Y-1$ columns of heights $1,2,\dots,\min(w_X,w_Y),\dots,2,1$ (the diagram's bottom row, summing to $16$ for $4\times4$). Everything difficult about a multiplier is downstream of this line.

**Bound the output width before building anything.** The largest unsigned product is $(2^{w_X}-1)(2^{w_Y}-1)=2^{w_X+w_Y}-2^{w_X}-2^{w_Y}+1$, and since $2^{w_X}+2^{w_Y}>1$ for any $w_X,w_Y\ge1$ the whole expression is strictly below $2^{w_X+w_Y}$. So $P$ always fits on

$$w_P=w_X+w_Y \text{ bits}$$

and no overflow check is ever needed on an exact unsigned multiplier (p. 205). The bound is also *tight* for $w_X,w_Y\ge2$: with $w_X=2$ the maximum is $3(2^{w_Y}-1)\ge2^{w_Y+1}$ whenever $2^{w_Y}\ge3$, so bit $w_X+w_Y-1$ genuinely occurs. Note that the heap only spans $w_X+w_Y-1$ columns while the product occupies $w_X+w_Y$ bits — the top bit $p_{w_X+w_Y-1}$ is produced entirely by carries out of the summation, never by an AND gate, which is why the diagram shows no column height under $p_7$.

**Fixed point changes nothing but the labels.** A fixed-point number is an integer scaled by $2^\ell$ ([[Fixed-Point Representations]]), so a fixed-point multiplier *is* this integer multiplier with an implicit scale of $2^{\ell_X+\ell_Y}$ on its output (p. 213). Reading the exact format straight off the integer result gives $\ell_P=\ell_X+\ell_Y$, $m_P=m_X+m_Y+1$ and hence again $w_P=w_X+w_Y$ (p. 207). Asking for $\ell_P>\ell_X+\ell_Y$ is by definition a request for truncation or rounding; asking for $m_P<m_X+m_Y+1$ is a request for silent overflow. Because of this equivalence the rest of the topic drops $\ell$ entirely and works with the single parameter $w$.

**Commutativity says there is only one array, not two.** The schoolbook layout looks asymmetric: expand $X$ and you get $w_X$ rows of $w_Y$ bits each; expand $Y$ and you get $w_Y$ rows of $w_X$ bits. But $\times$ is **commutative**, so both double sums are the same multiset of terms $2^{i+j}x_iy_j$ — the two layouts produce *identical* dot diagrams (Fig. 8.1, p. 205), differing only in the order in which bits are written inside a column, which by commutativity of $+$ carries no information. Sheared upright, the parallelogram of the paper-and-pencil layout is a plain **rectangle of width $w_X$ and height $w_Y$** (Fig. 8.2, p. 205); the classic phrase "$w_X\times w_Y$ multiplier" actually names the shape of that rectangle. This licenses the book's convention of always expanding $X$ and writing $w=w_X$, and the rectangle is the geometric object that [[Multiplier Tiling]] later covers with sub-multipliers.

**Radix 2 is the reason a cell is one gate.** The property doing the work is that in radix 2 the product of two digits is *one* digit: $x_iy_j\in\{0,1\}$. In any radix above 2 — radix 10, or the radix-4 recoding of [[Booth's Algorithm]] — a digit-by-digit product needs two digits, so a cell stops being a single gate and starts needing its own carry handling (p. 214). That is the whole reason the plain radix-2 array is the baseline rather than a naive first attempt: it is the unique radix at which partial product generation is free.

**The array is a heap generator; the delay is decided by what consumes it.** The parallel multiplier flow is three stages (Fig. 8.5, p. 213): generate partial products, compress, add. Generation is constant time as shown. If the heap is fed to a [[Compressor Trees|compressor tree]] — a [[Wallace Tree]], say — reduction to two rows costs $\mathcal{O}(\log w)$ with $w=\max(w_X,w_Y)$, and the [[RCA, Ripple-Carry Adder|final adder]] resolving those two carry-save rows into $w_P$ bits costs another $\mathcal{O}(\log w)$ if it is a fast adder, so the whole multiplier is $\mathcal{O}(\log w)$. The name *array multiplier* is also used for the variant that **fuses generation with summation**, adding row $i$ into a running total as it is produced: one $w_Y$-bit adder per row, a strikingly regular layout that places and routes almost for free, and a delay of $\mathcal{O}(w)$ because those adders are chained (p. 214). Both readings share the same $w_Xw_Y$ AND gates; they differ only in the bracketing of the sum, which **associativity** leaves free.

> [!important] The rectangle is a specification, not a netlist
> Nothing obliges an implementation to instantiate $w_Xw_Y$ discrete AND gates, and on an FPGA nothing should. A $1\times1$ tile — one bare AND gate — has area $1$ and costs $\#\mathrm{LUT}^\mathrm{mult}+\#\mathrm{LUT}^\mathrm{comp}\cdot w_s=1+0.55\cdot1=1.55$ LUT once the compression its output causes is charged, for an efficiency $E=1/1.55=0.65$: the **worst tile in the whole library** (Table 8.3, p. 229). A $2\times3$ sub-multiplier costs $3+0.55\cdot5=5.75$ LUT for area $6$, so $E=1.04$ — a LUT6 splits into two LUT5s and swallows six bit-products at once. The array tells you *which* bits must exist; [[LUT-Based Multiplier Tiles]] and [[Multiplier Tiling]] decide what silicon they are made of.

**ASIC and FPGA diverge only below the heap.** On an ASIC the AND rectangle is genuinely cheap and the cost of the multiplier is almost entirely the compressor tree, so the design question is which compressor library covers the heap in fewest cells. On an FPGA the same rectangle is the *most expensive possible* way to spend logic, per the tile efficiencies above, and above $w\approx17$ it is not built in logic at all — a hard DSP block covers a $24\times17$ region at area $408$ for one DSP plus $22.55$ LUT ($E^\mathrm{LUT}=18.13$), an order of magnitude better than anything made of LUTs. The unsigned array survives on FPGAs mainly as the *residue*: the strips of the rectangle a DSP tiling leaves uncovered.

$$\boxed{\ P=\sum_{i=0}^{w_X-1}\sum_{j=0}^{w_Y-1}2^{i+j}x_iy_j\ \in[0,2^{w_X+w_Y}),\qquad w_Xw_Y\ \text{AND gates},\ w_P=w_X+w_Y\ }$$

**When it breaks.**

- **Either operand signed and the rectangle is simply wrong.** A two's-complement $X$ contributes $-2^{w-1}x_{w-1}Y$, so every row must be sign-extended to $w_P$ and the top row replaced by its two's complement — see [[Baugh-Wooley Multiplier]]. Feeding signed words to the AND array silently computes the unsigned product of the same bit patterns.
- **$w_X=1$ makes the width formula slack.** The product is just $x_0Y\le2^{w_Y}-1$, which fits $w_Y$ bits, not $w_Y+1$. The tightness argument above needs $\min(w_X,w_Y)\ge2$; at $w_X=1$ the array is a single row and there is no multiplier left to build.
- **Height-1 columns are not a summation problem.** The outermost columns of the heap contain one bit each; they bypass the compressor tree and the final adder entirely. A cost model charging $\mathcal{O}(w_Xw_Y)$ compression for them overstates small multipliers.
- **The asymptotics stop mattering below $w\approx17$ on FPGAs**, where DSP routing delay can dominate an equivalent LUT array, and above it, where a DSP tiling wins outright regardless of gate counts (pp. 222–223).
- **Exactness is often over-delivery.** If the specification does not consume the low output bits, building the full rectangle wastes roughly the triangle below $\ell_\mathrm{ext}$ — see [[Truncated Multipliers]], where dropping those bits is nearly free at the cost of relaxing exact to faithful.
- **Quadratic growth is the whole motivation for the siblings.** $w_Xw_Y$ bits at $w=64$ is $4096$ AND gates and a heap of maximum height $64$; [[Booth's Algorithm]] halves the rows and [[Karatsuba]] attacks the $\mathcal{O}(w^2)$ itself.

> [!warning] Not covered in the source — needs outside research
> The book states that generation-and-summation-fused array multipliers are $\mathcal{O}(w)$ and cites the literature for them (p. 214), but gives no area or delay figures, so there is no number here for the regularity-versus-latency trade against a compressor tree.

**RTL (Spade).**

```spade
/// One partial-product row: the bit x_i ANDed with every bit of Y.
/// WY AND gates sharing one input; no carry, one gate delay.
fn pp_row<#uint WY>(xi: bool, y: uint<WY>) -> uint<WY> {
    if xi { y } else { 0 }
}

/// Unsigned 8x8 schoolbook array multiplier: 64 AND gates in 8 rows,
/// each row weighted by 2^i and accumulated into the running sum.
fn mul8(x: uint<8>, y: uint<8>) -> uint<16> {
    let xb = x.as_bits();
    let r0: uint<16> = zext(pp_row(xb[0], y));
    let r1: uint<16> = zext(pp_row(xb[1], y));
    let r2: uint<16> = zext(pp_row(xb[2], y));
    let r3: uint<16> = zext(pp_row(xb[3], y));
    let r4: uint<16> = zext(pp_row(xb[4], y));
    let r5: uint<16> = zext(pp_row(xb[5], y));
    let r6: uint<16> = zext(pp_row(xb[6], y));
    let r7: uint<16> = zext(pp_row(xb[7], y));

    let a1 = r0 +. (r1 << 1);
    let a2 = a1 +. (r2 << 2);
    let a3 = a2 +. (r3 << 3);
    let a4 = a3 +. (r4 << 4);
    let a5 = a4 +. (r5 << 5);
    let a6 = a5 +. (r6 << 6);
    a6 +. (r7 << 7)
}
```

`pp_row(xb[i], y)` is row $i$ of the diagram — $w_Y=8$ AND gates fed by the single bit $x_i$, which Spade writes as a mask because `if` on a `bool` over a whole word lowers to exactly that; `as_bits()` indexes from the LSB, so `xb[0]` is $x_0$ and the rightmost row. The `<< i` is the diagram's shear, and `a1 … a7` are the *fused* array reading: one adder per row, chained, $\mathcal{O}(w)$ deep. Widths: $x_i$ is 1 bit, a row is $w_Y=8$ bits, the accumulator is $w_P=16$ bits throughout, and every `+.` is the wrapping same-width add — safe only because $255\times255=65025<2^{16}$, so no carry ever leaves the word. All of it is combinational: these are `fn`s, and Spade forbids `reg` and `inst` inside a `fn`. Synthesis will not build the drawn chain — it retimes the additions into a carry-save tree, and an FPGA mapper never emits the 64 discrete AND gates at all, packing $2\times3$ blocks of them into LUT6s as the callout describes.

**Related Notes.**

- [[Bit Heaps]] – depends-on: the multiset the AND rectangle produces, and the framework in which its columns become the only remaining problem.
- [[Compressor Trees]] – extends: what turns the $w_Xw_Y$-bit heap into two rows in $\mathcal{O}(\log w)$.
- [[Wallace Tree]] – extends: the specific reduction schedule most often assumed behind a plain array.
- [[RCA, Ripple-Carry Adder]] – depends-on: the final stage resolving the carry-save pair into $w_X+w_Y$ bits, and the $\mathcal{O}(w)$ chain the fused array reading builds row by row.
- [[Fixed-Point Representations]] – depends-on: why $\ell_P=\ell_X+\ell_Y$ and $m_P=m_X+m_Y+1$ follow from the integer result with no new derivation.
- [[Baugh-Wooley Multiplier]] – extends: the same rectangle once sign extension and one negated row are folded in, at a cost of a few constant bits.
- [[Booth's Algorithm]] – compares: halves the rows by leaving radix 2, and pays with a recoder plus sign extension even in the unsigned case.
- [[Truncated Multipliers]] – compares: the same array with its low triangle never built, exact traded for faithful.
- [[Multiplier Tiling]] – counter-example: on an FPGA the rectangle is covered by DSPs and LUT tiles, and the bare AND gate is the least efficient tile available.
- [[LUT-Based Multiplier Tiles]] – supports: why a $2\times3$ sub-multiplier beats six separate AND gates on a LUT6 architecture.
- [[Karatsuba]] – compares: attacks the $w_Xw_Y$ term itself, at the price of pre-additions on the critical path.
- [[Choosing a Multiplier]] – compares: where this baseline still wins against every sibling above.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- §8.1.1 "Exact Multiplication of Integers", pp. 203–206 — schoolbook expansion, the $w_X+w_Y$ bound, Figs. 8.1–8.2 p. 205 (parallelogram and rectangle).
- §8.1.2 "Fixed-Point Numbers", pp. 206–209 — Table 8.1 p. 207, exact format $\ell_P=\ell_X+\ell_Y$, $m_P=m_X+m_Y+1$ p. 207, Fig. 8.4 p. 208, the MSB issue pp. 208–209.
- §8.2 "Overview of Multiplier Construction", pp. 213–214 — Fig. 8.5 p. 213 (three-stage data flow), constant-time generation and $\mathcal{O}(\log w)$ compression p. 213, $\mathcal{O}(w)$ fused array multipliers p. 214.
- §8.3 "Partial Product Generation and Sign Management", pp. 214–215 — eqs. (8.13)–(8.14) p. 214, the radix-2 one-digit property p. 214, Fig. 8.6 p. 215 (partial product alignment of an unsigned $4\times4$ multiplier).
- §8.4.2 "Multiplier Construction as a Tiling Problem", pp. 228–229 — the efficiency metric and Table 8.3 p. 229 ($1\times1$, $2\times3$ and DSP tile costs).
