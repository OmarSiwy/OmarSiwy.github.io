---
title: "DSP-Cascade Squarer"
description: "Rewrites the two-way split so all shift amounts become multiples of 17, letting the AMD DSP cascade carry the partial sum; costs one pre-shift of X1 and caps X at 33 bits."
kind: circuit
source: "ASA §14.2.2, pp. 445-446; cascade alignment rule §8.4.2.4, pp. 231-232"
status: seed
spade: simulated
tags: [digital, squarer, dsp, fpga, high-radix, amd, multiplier]
aliases:
  - DSP Cascade Squarer
  - Cascaded DSP Squarer
  - DSP-Chained Squarer
  - 33-Bit DSP Squarer
  - Squarer with DSP Cascade
---

# DSP-Cascade Squarer

A two-way [[High-Radix Squarer]] whose split is re-weighted so that every partial product lands at a weight that is a multiple of 17 — the only inter-DSP shift the AMD cascade routing can express — at the price of a one-bit pre-shift and a hard ceiling of 33 bits on $X$.

```tikz title="Three-DSP cascade squaring a 33-bit X, with all partial-product weights at multiples of 17"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,
  dsp/.style={draw,thick,rounded corners=1pt,minimum width=34mm,minimum height=17mm,align=center,fill=white},
  bar/.style={draw,minimum height=6.5mm,align=center,fill=white},
  sh/.style={draw,minimum width=9mm,minimum height=5.5mm,align=center,fill=white}]

  % ---- input and split
  \node[anchor=south] at (5.2,5.95) {$X$};
  \draw[-latex] (5.2,5.9) -- (5.2,5.15);
  \node[anchor=west] at (5.28,5.5) {\scriptsize 33};
  \node[bar,minimum width=112mm] (spl) at (5.2,4.8)
       {$X = 2^{17}X_1 + X_0$\quad\scriptsize($X_1$: 16 bits,\ \ $X_0$: 17 bits)};

  % ---- operands into DSP A
  \draw[-latex] (0,4.47) -- (0,3.2);
  \node[anchor=west] at (0.08,3.80) {$X_0 \times X_0$};
  \node[anchor=east] at (-0.08,3.80) {\scriptsize 17};

  % ---- operands into DSP B
  \draw[-latex] (4.45,4.47) -- (4.45,4.15);
  \node[sh] (sh) at (4.45,3.85) {$\ll 1$};
  \draw[-latex] (4.45,3.55) -- (4.45,3.2);
  \node[anchor=east] at (4.37,4.31) {\scriptsize 16};
  \node[anchor=east] at (4.37,3.38) {\scriptsize 17};
  \draw[-latex] (5.95,4.47) -- (5.95,3.2);
  \node[anchor=west] at (6.03,3.80) {$(2X_1) \times X_0$};
  \node[anchor=west] at (6.03,3.34) {\scriptsize 17};

  % ---- operands into DSP C
  \draw[-latex] (10.4,4.47) -- (10.4,3.2);
  \node[anchor=west] at (10.48,3.80) {$X_1 \times X_1$};
  \node[anchor=east] at (10.32,3.80) {\scriptsize 16};

  % ---- the three DSP blocks
  \node[dsp] (A) at (0,2.35)
     {\textbf{DSP A}\\[2pt] $S_0 = X_0^{2}$\\[2pt] \scriptsize weight $2^{0}$};
  \node[dsp] (B) at (5.2,2.35)
     {\textbf{DSP B}\\[2pt] $S_1 = (2X_1)X_0$\\ $+\ \lfloor S_0/2^{17}\rfloor$\\[2pt] \scriptsize weight $2^{17}$};
  \node[dsp] (C) at (10.4,2.35)
     {\textbf{DSP C}\\[2pt] $S_2 = X_1^{2}$\\ $+\ \lfloor S_1/2^{17}\rfloor$\\[2pt] \scriptsize weight $2^{34}$};

  % ---- cascade path (PCOUT -> PCIN, the only routable shift)
  \draw[-latex,thick] (1.7,2.35) -- (3.5,2.35);
  \node[anchor=south] at (2.6,2.47) {\scriptsize cascade};
  \node[anchor=north] at (2.6,2.23) {\scriptsize $\gg 17$\ (17)};
  \draw[-latex,thick] (6.9,2.35) -- (8.7,2.35);
  \node[anchor=south] at (7.8,2.47) {\scriptsize cascade};
  \node[anchor=north] at (7.8,2.23) {\scriptsize $\gg 17$\ (18)};

  % ---- result field
  \draw[-latex] (0,1.5) -- (0,0.15);
  \node[anchor=west] at (0.08,0.82) {\scriptsize $S_0 \bmod 2^{17}$};
  \draw[-latex] (5.2,1.5) -- (5.2,0.15);
  \node[anchor=west] at (5.28,0.82) {\scriptsize $S_1 \bmod 2^{17}$};
  \draw[-latex] (10.4,1.5) -- (10.4,0.15);
  \node[anchor=east] at (10.32,0.82) {\scriptsize $S_2$};

  \node[bar,minimum width=112mm] (res) at (5.2,-0.2) {};
  \node at (1.1,-0.2) {\scriptsize $X^2[16{:}0]$\ (17)};
  \node at (5.2,-0.2) {\scriptsize $X^2[33{:}17]$\ (17)};
  \node at (9.3,-0.2) {\scriptsize $X^2[65{:}34]$\ (32)};
  \draw (2.6,-0.525) -- (2.6,0.125);
  \draw (7.8,-0.525) -- (7.8,0.125);
  \draw[-latex] (5.2,-0.55) -- (5.2,-1.2);
  \node[anchor=north] at (5.2,-1.25) {$X^{2}$\ \ \scriptsize 66 bits};

  \node[gray] at (5.2,-2.1)
     {\scriptsize every partial-product weight is a multiple of 17, so no soft adder appears in this drawing};
\end{circuitikz}
\end{document}
```

**Start from the split, and notice that the algebra is already finished.** Read $X$ in radix $2^{k}$ with two subwords, $X = 2^{k}X_1 + X_0$, and expand by the binomial identity:

$$X^{2}=(2^{k}X_1+X_0)^{2}=2^{2k}X_1^{2}+2\cdot 2^{k}X_1X_0+X_0^{2}\tag{14.2}$$

Three products instead of the four a general two-way-split multiplier needs, because $X_1X_0$ and $X_0X_1$ are the same value by commutativity and are simply reused — the [[High-Radix Squarer]] argument, and it costs no extra additions. Everything from here is *placement*: the three products already exist, and the only remaining question is what hardware performs the weighted sum $2^{2k}(\cdot)+2^{k+1}(\cdot)+(\cdot)$.

**The cascade path is a routing resource with exactly one legal shift, and (14.2) does not fit it.** An AMD DSP block can take its neighbour's post-adder result directly, `PCOUT` to `PCIN`, on dedicated wiring that bypasses the general fabric; the receiving block then computes its own product plus that incoming sum. That path is not a general shifter. The book's tiling analysis states the rule twice: DSP products "should either be aligned or shifted by exactly 17 bits, the only shift value allowed by the specific routing resource" (p. 232), i.e. the chain input performs a shift by 17 bits and nothing else (p. 445). Now instantiate (14.2) at the natural $k=17$, so that each of $X_1,X_0$ fills one DSP operand port. The three weights are $2^{0}$, $2^{k+1}=2^{18}$ and $2^{2k}=2^{34}$ — exponents $0, 18, 34$. Only $0$ and $34$ are multiples of $17$; the middle term is off by one, and it is off by one *because of the factor 2 in the cross term*, which is precisely the thing squaring adds that multiplication does not have. The three-way split (14.3) is worse still: $0,18,34,35,42,64$. Any partial product whose weight is not reachable by a chain of 17-bit hops must leave its block through the general fabric and be summed in soft logic.

**Move the doubling out of the weight and into the operand.** $2\cdot 2^{k}X_1X_0=2^{k}\,(2X_1)\,X_0$ by associativity and commutativity of multiplication — the factor $2$ may be grouped with the weight or with either operand, and all three groupings denote the same number. Grouped with the weight it is a one-place shift in the *alignment*, which the cascade cannot perform; grouped with $X_1$ it is a one-place shift at a DSP *input*, which is a wire relabelling and costs nothing. So rewrite (14.2) at $k=17$ as

$$(2^{17}X_1+X_0)^{2}=2^{34}X_1^{2}+2^{17}(2X_1)X_0+X_0^{2}\tag{14.4}$$

whose exponents are $0,17,34$ — consecutive multiples of 17, hence exactly one cascade hop apart.

> [!important] A constant factor can live in the weight or in an operand; only one of the two is routable.
> Nothing arithmetic changed between (14.2) and (14.4): they are the same expression, reassociated. What changed is which piece of hardware is asked to realise the $\times 2$. Placed in the alignment it is a shift the fixed cascade routing does not implement, and it forces the entire sum out into the fabric; placed in the operand it is free. Whenever a hard block accepts only a quantised set of alignments, look for a constant you can migrate across the multiplication rather than fighting the router.

**The freed bit is not free forever, and that is where the 33-bit ceiling comes from.** $2X_1$ is one bit wider than $X_1$. The DSP operand port that would have held a 17-bit $X_1$ can hold $2X_1$ only if $X_1$ was at most 16 bits, so with $X_0$ at the full 17 bits the input is capped at $16+17=33$ bits. The book states the bound in exactly this form: the spare bit exists "only if the size of $X_1$ is at most 16, i.e., if the size of $X$ is at most 33", which covers the case that matters in practice, the 32-bit integer (p. 446). Widths through the datapath, all unsigned: $X_0$ is 17 bits and $X_1$ is 16, so $X_0^{2}$ is 34 bits, $(2X_1)X_0$ is $17+17=34$ bits, $X_1^{2}$ is 32 bits, and $X^{2}<2^{66}$ occupies 66 bits. Because $X$ is unsigned so is $X^{2}$, and an even power is unsigned by construction in any case — the format is $\mathrm{ufix}$, see [[Number Formats]] and §14.1, p. 444.

**Chain the three products LSB-first, because the cascade shift acts on the incoming sum.** The chain input arrives divided by $2^{17}$, so the block that receives it must sit 17 bits *higher* in weight than the block that sent it. Ordering the terms of (14.4) by increasing weight gives the recurrence the diagram draws:

$$S_0=X_0^{2},\qquad S_1=(2X_1)X_0+\left\lfloor \frac{S_0}{2^{17}}\right\rfloor,\qquad S_2=X_1^{2}+\left\lfloor \frac{S_1}{2^{17}}\right\rfloor$$

The 17 bits each hop discards are not lost. No later stage can modify them, since every subsequent contribution carries weight at least $2^{17}$ above them, so they are already final output bits and are read straight off the block that produced them. Reassembling by concatenation,

$$2^{34}S_2+2^{17}\left(S_1\bmod 2^{17}\right)+\left(S_0\bmod 2^{17}\right)=2^{34}X_1^{2}+2^{18}X_1X_0+X_0^{2}=X^{2},$$

by two applications of the Euclidean division identity $2^{17}\lfloor S/2^{17}\rfloor+(S\bmod 2^{17})=S$ and nothing else. The bound $S_2<2^{32}$ follows from $2^{34}S_2\le X^{2}<2^{66}$, which is why the top field is 32 bits wide and no 67th bit ever appears.

**What this buys is routing and soft logic, not DSP blocks.** The DSP count is unchanged at three: these are the same three products as the [[High-Radix Squarer]], and the 4-to-3 saving over a general multiplier was already banked there. What (14.4) removes is the adder. In the (14.2) form the three DSP outputs — 34, 34 and 32 bits at three mutually unroutable weights — must exit onto general routing and be compressed and carry-propagated in LUTs and the hard carry chain ([[Sums of Weighted Bits]], [[Adders]]), which costs LUT area and adds a second, fabric-speed segment to the critical path. In the (14.4) form the DSP post-adders perform the whole summation internally on dedicated wires and the fabric sees only the final 66-bit concatenation, which is pure wiring. On an ASIC none of this applies: an ASIC multiplier array has no quantised alignment, so the right implementation there is one merged bit heap over all of (14.2) and this note's rewrite is pointless.

**The trick generalises to any cascade granularity $k$, with the ceiling moving to $2k-1$.** Repeat the derivation with $k$ symbolic: $(2^{k}X_1+X_0)^{2}=2^{2k}X_1^{2}+2^{k}(2X_1)X_0+X_0^{2}$, weights $0,k,2k$, all multiples of $k$ for every $k$; the constraint is $|X_1|\le k-1$ and $|X_0|\le k$, hence $|X|\le 2k-1$. The book notes only that the technique "applies similarly to Intel FPGAs, albeit with different values of the input shift", instancing Stratix V cascading inputs at 18 and 27 bits (p. 446) — which by the formula above would place the ceiling at 35 and 53 bits respectively.

> [!warning] Not covered in the source — needs outside research
> The book gives the Intel shift values but not the corresponding operand-width caps; the $2k-1$ figures above are the algebraic consequence, not a datasheet claim, and whether an Intel DSP port actually accepts a $k$-bit unsigned operand under its signed interpretation is family-specific and untabulated here. §14.2.2 also reports no LUT counts, no $f_{\max}$ and no measured comparison between the (14.2) and (14.4) mappings, so "removes the soft adder" is a structural argument rather than a quantified one. Finally, the tiling discussion deliberately limits super-tiles to **two** chained DSPs because "the delay or latency … increases with the size of the super-tile" (p. 232); this squarer chains **three**, and the resulting latency is nowhere costed.

$$\boxed{\ (2^{k}X_1+X_0)^{2}=2^{2k}X_1^{2}+2^{k}(2X_1)X_0+X_0^{2},\qquad |X|\le 2k-1\ }$$
$$\boxed{\ S_{j}=P_{j}+\left\lfloor S_{j-1}/2^{k}\right\rfloor,\qquad X^{2}=2^{2k}S_2+\textstyle\sum_{j<2} 2^{jk}\left(S_j \bmod 2^{k}\right)\ }$$

**When it breaks.**

- $|X|>33$ on AMD ($>2k-1$ in general). There is no spare bit in $X_1$ and the rewrite is unavailable; fall back to the three-way split (14.3), or to [[Squarer Tiling]] over a mixed set of DSP and LUT tiles.
- $|X|\le 17$. One DSP squares $X$ outright and the whole construction is dead weight; the split only starts paying once a second block is unavoidable.
- Signed $X$. The derivation above is for unsigned integers. Two's-complement operands spend a bit of each port on sign extension, out of the same budget the $\ll 1$ just spent, and the subwords have mixed signedness — $X_1$ signed, $X_0$ unsigned — so the cross term needs the correction machinery of §8.4.1, not this identity.
- Deep chains. Three DSPs in series is one hop past the super-tile heuristic, and if the blocks are pipelined the latency is three block delays rather than one. Where throughput matters more than LUT area, the misaligned (14.2) form with a soft adder pipelines flatter.
- ASIC targets, and any FPGA without a cascade path. The constraint this note works around does not exist there; merge everything into a single bit heap.
- Truncation. Nothing here interacts with LSB truncation, but the cascade delivers the low bits *before* the top block finishes, so a [[Truncated Squarer]] built on this structure drops whole cascade stages rather than heap columns — the compensation constant is then chosen against a coarser granularity.

**In Spade.** The three DSP post-adders are the three `let`s of the recurrence; a synthesiser targeting AMD infers a `DSP48` from each `*` together with the adjacent `+`, and the final concatenation is the result field of the diagram.

```spade
fn dsp_cascade_sq33(x: uint<33>) -> uint<66> {
    let b  = x.as_bits();
    let x0: uint<17> = b[0..17].as_uint();      // low subword
    let x1: uint<16> = b[17..33].as_uint();     // high subword, one bit short by design
    let z:  uint<1>  = 0;
    let x1d: uint<17> = x1.concat(z);           // 2*X1 — the whole trick, one wire relabel

    let s0: uint<34> = x0 * x0;                 // DSP A, weight 2^0
    let s1: uint<35> = x1d * x0 + (s0 >> 17);   // DSP B, weight 2^17
    let p2: uint<35> = zext(x1 * x1);
    let s2: uint<32> = trunc(p2 + (s1 >> 17));  // DSP C, weight 2^34

    let lo0: uint<17> = s0.as_bits()[0..17].as_uint();
    let lo1: uint<17> = s1.as_bits()[0..17].as_uint();
    s2.concat(lo1).concat(lo0)
}
```

`s0`, `s1`, `s2` are the three block outputs; `s0 >> 17` and `s1 >> 17` are the two cascade arrows, and `lo0`/`lo1` are exactly the bits those shifts drop, which the final `concat` puts back — for integers `concat` places the receiver in the **high** part, so `s2.concat(lo1).concat(lo0)` is $2^{34}S_2 \,\|\, 2^{17}S_1[16{:}0] \,\|\, S_0[16{:}0]$, MSB first. The width arithmetic carries the argument: `*` doubles ($17\times17\to34$, $16\times16\to32$), `+` grows by one ($34\to35$), and the `trunc` on `s2` is the $S_2<2^{32}$ bound proved above rather than a discarded carry — drop it and the output would be 67 bits wide for a 66-bit value. It is a `fn`, so everything here is combinational; real DSP blocks are registered at their inputs, at the product and at the post-adder, so synthesis will insert those stages and stretch the cascade to three block latencies, which the drawing does not show.

**Related notes.**

- [[High-Radix Squarer]] – depends-on: supplies (14.2), the subword split and the 4→3 DSP saving this note inherits without improving on.
- [[DSP Blocks]] – depends-on: the `PCOUT`→`PCIN` cascade, its single legal 17-bit shift, and the port widths that fix the 33-bit ceiling.
- [[Squarer Tiling]] – extends: the same alignment rule read geometrically, as super-tiles whose corner-to-corner vector must sum to 0 or 17 (Fig. 8.17, p. 232).
- [[Truncated Squarer]] – extends: dropping low columns composes with this structure by deleting whole cascade stages instead of heap columns.
- [[Choosing a Squarer]] – compares: when three chained DSPs beat a LUT bit heap, and when the 33-bit cap disqualifies the approach outright.
- [[Multipliers]] – compares: the same cascade constraint governs DSP multiplier super-tiles, but with no factor 2 to migrate the alignment is already legal there.
- [[Sums of Weighted Bits]] – counter-example: the compressor tree this construction exists in order not to instantiate.
- [[Number Formats]] – supports: why an even power of an unsigned input needs no sign handling and lands in $\mathrm{ufix}$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.2.2 High-radix square, pp. 445-446 — Eqs. (14.2) and (14.3) with their weight lists $0,18,34$ and $0,18,34,35,42,64$; Eq. (14.4) and the one-bit pre-shift of $X_1$; the 16-bit/33-bit bound; the Stratix V 18- and 27-bit cascade shifts.
- §14.1 Squares, cubes and other integer powers, p. 444 — an even power is always positive and takes the format $\mathrm{ufix}(pm,p\ell)$.
- §8.4.2.4 DSP-based sub-multipliers, pp. 231-232 — the super-tile of chained DSP blocks [DP09]; "the DSP products should either be aligned or shifted by exactly 17 bits, the only shift value allowed by the specific routing resource"; Fig. 8.17, all super-tiles of two $17\times24$ DSP48E1 blocks at shift 0 or 17; the latency argument that limits super-tiles to two DSPs.
- §14.2.1 Basics, p. 445 — Eq. (14.1), the bit-level square whose reuse argument this subword split mirrors one level up.
