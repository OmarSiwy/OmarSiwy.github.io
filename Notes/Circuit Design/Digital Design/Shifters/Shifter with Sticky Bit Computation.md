---
title: Shifter with Sticky Bit Computation
description: "Barrel shifter in reversed (largest-shift-first) stage order that ORs each stage's discarded bits in place; turns an exact full shifter plus wide OR into a same-width barrel shifter, measured 20% less area and 5% less delay in a binary32 adder."
kind: circuit
source: "ASA §10.1.5, pp. 315-317"
status: seed
spade: simulated
tags: [digital, shifters, sticky, rounding, floating-point]
aliases:
  - Sticky Bit Computation
  - Early Sticky-Bit Computation
  - Barrel Shifter with Early Sticky Bit Computation
---

# Shifter with Sticky Bit Computation

A truncated barrel shifter whose stages run largest-shift-first and whose every stage ORs the bits it is about to throw away into a running flag, so the shifted word and the sticky bit become available at the same gate level.

```tikz title="Reversed-order 8-bit right barrel shifter with incremental sticky accumulation"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >=latex,
  mux/.style={draw,fill=black!5,rounded corners=1pt,minimum width=36mm,minimum height=7mm,inner sep=2pt},
  gate/.style={draw,rounded corners=1.2pt,minimum width=9mm,minimum height=5.5mm,inner sep=1pt},
  w/.style={font=\scriptsize,inner sep=1.3pt}
]
% ---- stage 2 : shift by 4, discards the low 4 bits ----
\node (X) at (0,6.5) {$X$};
\draw[->] (0,6.25) -- (0,5.35); \node[w] at (-0.22,6.05) {$8$};
\node[mux] (m2) at (0,5.0) {$\gg 4$ \ or pass};
\node (s2) at (-3.6,5.0) {$s_2$}; \draw[->] (s2) -- (m2.west);
\draw[->] (0,5.75) -- node[w,above]{$4$} (3.1,5.75);
\node[gate] (o2) at (3.6,5.75) {OR};
\node[gate] (a2) at (5.7,5.75) {$\wedge$};
\draw[->] (o2.east) -- (a2.west);
\draw[->] (5.7,5.0) -- node[w,right]{$s_2$} (a2.south);

% ---- stage 1 : shift by 2 ----
\draw[->] (0,4.65) -- (0,3.85); \node[w] at (-0.22,4.0) {$8$};
\node[mux] (m1) at (0,3.5) {$\gg 2$ \ or pass};
\node (s1) at (-3.6,3.5) {$s_1$}; \draw[->] (s1) -- (m1.west);
\draw[->] (0,4.25) -- node[w,above]{$2$} (3.1,4.25);
\node[gate] (o1) at (3.6,4.25) {OR};
\node[gate] (a1) at (5.7,4.25) {$\wedge$};
\draw[->] (o1.east) -- (a1.west);
\draw[->] (5.7,3.5) -- node[w,right]{$s_1$} (a1.south);

% ---- stage 0 : shift by 1 ----
\draw[->] (0,3.15) -- (0,2.35); \node[w] at (-0.22,2.5) {$8$};
\node[mux] (m0) at (0,2.0) {$\gg 1$ \ or pass};
\node (s0) at (-3.6,2.0) {$s_0$}; \draw[->] (s0) -- (m0.west);
\draw[->] (0,2.75) -- node[w,above]{$1$} (3.1,2.75);
\node[gate] (o0) at (3.6,2.75) {OR};
\node[gate] (a0) at (5.7,2.75) {$\wedge$};
\draw[->] (o0.east) -- (a0.west);
\draw[->] (5.7,2.0) -- node[w,right]{$s_0$} (a0.south);

\draw[->] (0,1.65) -- node[w,left]{$8$} (0,1.0);
\node at (0,0.75) {$R$};

% ---- sticky accumulation chain ----
\node[gate] (c1) at (8.4,4.25) {OR};
\node[gate] (c0) at (8.4,2.75) {OR};
\draw[->] (a2.east) -- node[w,above]{$t_2$} (8.4,5.75) -- (c1.north);
\draw[->] (a1.east) -- node[w,above]{$t_1$} (c1.west);
\draw[->] (c1.south) -- (c0.north);
\draw[->] (a0.east) -- node[w,above]{$t_0$} (c0.west);
\draw[->] (c0.south) -- node[w,right]{$\sigma$} (8.4,1.7);
\node at (8.4,1.45) {sticky};
\end{circuitikz}
\end{document}
```

*After Fig. 10.7, p. 317, redrawn at $w_X=w_R=8$, $S_{\max}=7$ to match the worked example below; the book's figure is the $w_X=w_R=12$, four-stage shifter of a binary16 adder.*

**Name the one bit the shift is not allowed to lose.** In floating-point addition the smaller significand is right-shifted to align exponents, and the adder consumes only the upper bits. Whether the bits below the round bit were *all zero* or not is exactly the difference between an exact tie and a value strictly above the midpoint, and round-to-nearest-even resolves the two differently ([[Rounding]]). That single bit of information is the **sticky bit**, on 1 bit, for an input $X$ on $w_X$ bits and an unsigned shift distance $S$ on $w_S=\lceil\log_2(S_{\max}+1)\rceil$ bits:

$$\sigma=\bigvee_{i\in\mathcal{D}}x_i,\qquad \mathcal{D}=\{\text{bits of }X\text{ discarded by the shift}\}$$

Without $\sigma$ a truncated shift is only *faithful*, at up to $1$ ulp of $R$; with a round bit and $\sigma$ it is correctly rounded, at $\le\tfrac12$ ulp ([[Error Accuracy]]).

**Price the obvious architecture, then refuse to pay it.** The naive construction is an [[Exact Full Shifter]] — output widened to $w_R=w_X+S_{\max}$ so nothing is ever dropped — followed by a wide OR over the low bits. It pays twice: once in datapath width, keeping bits alive whose only destiny is to be OR-ed away, and once in latency, because that wide OR is entirely serial *after* the last mux stage.

**Split the OR along the same binary decomposition the shift already uses.** A barrel shifter realises $X\gg S$ as $w_S$ stages, stage $j$ shifting by $2^j$ under control of $s_j$ ([[Barrel Shifters]]). Let $\mathcal{D}_j\subseteq\mathcal{D}$ be the bits stage $j$ throws away. Because a right shift pads at the *top*, everything stage $j$ drops off the bottom is a genuine bit of $X$ and not padding injected earlier, so the $\mathcal{D}_j$ are pairwise disjoint and $\bigcup_j\mathcal{D}_j=\mathcal{D}$. By **associativity of OR** the reduction can be re-bracketed along that partition, and by **idempotence** the re-bracketing would be harmless even if the sets overlapped:

$$\sigma=\bigvee_{j=0}^{w_S-1}t_j,\qquad t_j=s_j\wedge\!\!\bigvee_{i\in\mathcal{D}_j}\!\!x_i$$

Stage $j$ discards exactly $2^j$ bits and only when $s_j=1$, so $t_j$ is a $2^j$-wide OR over bits already present at that stage, gated by $s_j$. Nothing new is routed anywhere. The **gate count of the OR is unchanged** — $\sum_{j}2^j=2^{w_S}-1$ OR inputs either way, by the geometric sum — plus $w_S$ AND gates and $w_S-1$ accumulation ORs; only the *placement* moves.

**Collapse the datapath width.** Since no bit now has to survive to be OR-ed later, the output need not grow, and the exact full shifter with $w_X=w_F+1$, $S_{\max}=w_F+3$ becomes a barrel shifter with $w_X=w_R=w_F+3$ (p. 316) — one width for every stage, one fanout for every $s_j$. This is where the measured area saving comes from.

**Spend the stage-ordering freedom on the OR chain.** Shift composition is a monoid homomorphism from $(\mathbb{N},+)$, and $+$ is commutative, so the $w_S$ stages may be permuted freely without changing $R$ or $\sigma$. Under unit gate delay, index the stages by position $p=0,1,\dots,w_S-1$ in the order they are traversed; the word entering position $p$ is ready after $p$ mux levels, and the OR of $2^j$ bits has depth $j$, so

$$\text{ready}(t_j)=p+j+1.$$

LSB-first ($p=j$, the default order of [[Barrel Shifters]]) gives $2j+1$: the **widest** OR starts **last**, and $\sigma$ trails $R$ by nearly a factor of two, $2w_S-1$ against $w_S$. Reversing the order — largest shift first, $p=w_S-1-j$ — gives $\text{ready}(t_j)=w_S$ for *every* $j$. All $t_j$ land simultaneously, at the same level as $R$, and the sticky costs only the $\lceil\log_2 w_S\rceil$ levels of the accumulation tree on top. Equalising the arrival times, not shortening any one OR, is what the reversal buys.

> [!note] "Early" is the whole point
> The same gates, moved. Computing $\sigma$ after the shift makes a wide OR into pure added latency in series with the whole shifter; computing it incrementally inside the stages hides that OR under mux delay that was going to be paid anyway, and lets the word stay narrow. Measured on a single-precision floating-point adder, the reversed-order incremental version cut **20% of the area and 5% of the delay** against an exact full shifter plus a wide OR (p. 316), with comparable savings reported for posit addition.

**Worked example.** $w_X=w_R=8$, $S_{\max}=7$, $w_S=3$, reversed stage order, $X=10110101_2=181$, $S=5=s_2s_1s_0=101_2$:

| Stage | $s_j$ | Action | $\mathcal{D}_j$ | $t_j$ | Word after stage |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | $10110101$ |
| $j=2$ | 1 | $\gg 4$ | $0101$ | $1\wedge(0{\vee}1{\vee}0{\vee}1)=1$ | $00001011$ |
| $j=1$ | 0 | pass | $\varnothing$ | $0\wedge(1{\vee}1)=0$ | $00001011$ |
| $j=0$ | 1 | $\gg 1$ | $1$ | $1\wedge 1=1$ | $00000101$ |

giving $R=00000101_2=5$ and $\sigma=t_2\vee t_1\vee t_0=1$. The disjoint discarded sets reassemble to $\mathcal{D}=\{0101\}\cup\varnothing\cup\{1\}=x_4x_3x_2x_1x_0=10101$, the low 5 bits of $X$, as the partition argument promised. Running the same operands LSB-first — $\gg1$ discarding $1$, pass, $\gg4$ discarding $1010$ — gives the identical $R$ and $\sigma$, which is commutativity of $(\mathbb{N},+)$ made visible.

Exactly, $181/2^5=5.65625$. Truncation alone leaves $R=5$, an error of $0.65625$ ulp — above $\tfrac12$, hence faithful but not correctly rounded. Split $\mathcal{D}$ into round bit $r=x_4=1$ and $\sigma=x_3{\vee}x_2{\vee}x_1{\vee}x_0=1$: $r\wedge\sigma$ means "strictly above the midpoint", round-to-nearest increments to $6$, error $0.34375$ ulp. Had $\sigma$ been $0$ with $r=1$ the value would have been an exact tie and ties-to-even would have kept $R=5$. Those two cases are indistinguishable without $\sigma$.

**On FPGA the OR is not a tree.** A wide OR/NOR maps onto the fast carry chain rather than a tree of LUTs, so its delay is far below $\log_2$ of its width and the timing argument above is conservative — but the reversal is still what removes the OR from the tail. Independently, a 6-LUT holds a 4:1 multiplexer, so two adjacent mux rows merge into one LUT level; when pipelining, place registers every *other* stage or the merge is destroyed (p. 314). On ASIC the accumulation is a genuine $\lceil\log_2 w_S\rceil$ tree, and with $w_S\le6$ for every IEEE format its cost is essentially free either way.

$$\boxed{\ \sigma=\bigvee_{j=0}^{w_S-1}t_j,\qquad t_j=s_j\wedge\!\!\bigvee_{i\in\mathcal{D}_j}\!\!x_i,\qquad \mathcal{D}_j\ \text{disjoint},\ \textstyle\bigcup_j\mathcal{D}_j=\mathcal{D}\ }$$

## When it breaks

- **$S>S_{\max}$ silently corrupts $\sigma$.** Bits then leave the word without any stage's OR seeing them. The generator's $S_{\max}$ must bound the exponent difference, which is why an IEEE adder asks for $S_{\max}=w_F+3$ rather than a power of two minus one.
- **Direction is baked in.** The disjointness argument uses the fact that padding enters at the opposite end from the discarded bits. A bidirectional shifter breaks it; bias $S$ to unidirectional instead ([[Bidirectional Shifter]]).
- **The round bit is not covered.** $\sigma$ replaces everything strictly below the round bit; the round bit itself must still be carried inside $R$, which is what the $+3$ in $w_R=w_F+3$ pays for. $\sigma$ alone does not give round-to-nearest ([[Rounding]]).
- **One bit is lossy on purpose.** $\sigma$ cannot reconstruct the discarded value, so anything needing the exact residual — error-free transforms, exact accumulation — needs the [[Exact Full Shifter]] and its full $w_X+S_{\max}$ width.
- **Reversal forfeits the adder overlap.** LSB-first exists because $S$ usually comes out of a carry-propagate subtractor that produces its *low* bits first, letting stage 0 start early. Largest-first needs $s_{w_S-1}$ immediately. The reversal wins when $S$ arrives all at once, and loses when the subtractor computing $S$ is the slow part; below $w_S\approx3$ neither ordering has room to matter.

## RTL (Spade)

```spade
// One reversed-order stage: right-shift by K under s, and OR out the K bits
// this stage discards. Returns (word, t_j).
fn sticky_stage<#uint W, #uint K>(x: uint<W>, s: bool) -> (uint<W>, bool) {
    let dropped = x.as_bits()[0..K].reduce_or();
    let shifted: uint<W> = zext(x.as_bits()[K..W].as_uint());
    (if s { shifted } else { x }, s && dropped)
}

// w_X = w_R = 8, S_max = 7, w_S = 3, largest shift first.
fn shift_sticky8(x: uint<8>, s: uint<3>) -> (uint<8>, bool) {
    let b = s.as_bits();
    let (r2, t2) = sticky_stage::<8, 4>(x, b[2]);
    let (r1, t1) = sticky_stage::<8, 2>(r2, b[1]);
    let (r0, t0) = sticky_stage::<8, 1>(r1, b[0]);
    (r0, t2 || t1 || t0)
}
```

`sticky_stage` is one row of the diagram: `dropped` is the OR block, `s && dropped` is the AND gate producing $t_j$, and the `if` is the $w_X$-wide mux. `as_bits()` indexes LSB-first, so `[0..K]` is exactly $\mathcal{D}_j$ and `[K..W]` is the surviving word, zero-extended back to $W$ — that `zext` is the top padding, and it is free routing rather than logic. The call order in `shift_sticky8` is $j=2,1,0$, the reversal itself; writing it $0,1,2$ compiles and simulates identically, which is precisely why the ordering is a timing decision and not a functional one. Everything is combinational: `t2 || t1 || t0` is drawn as a two-gate chain but synthesis will balance it into a tree, and on FPGA into carry logic.

## Related Notes

- [[Barrel Shifters]] – extends: this is that structure with the stage order reversed and one gated OR bolted onto each stage.
- [[Exact Full Shifter]] – compares: the architecture it replaces, and the one to fall back to when the discarded bits are needed exactly.
- [[Truncated Shifter]] – depends-on: this *is* a truncated shifter; $\sigma$ is what makes the truncation correctly-roundable rather than merely faithful.
- [[Bidirectional Shifter]] – counter-example: the disjointness of the $\mathcal{D}_j$ fails once direction is a runtime input.
- [[Fused Normalizer]] – extends: the same move — spend stage-ordering freedom so a side computation arrives with the shifted word — applied to the leading-zero count instead of the sticky bit.
- [[Rounding]] – supports: $\sigma$ is the input round-to-nearest-even needs to separate a tie from a near-tie.
- [[Error Accuracy]] – supports: quantifies the $1$ ulp to $\tfrac12$ ulp improvement $\sigma$ buys.
- [[Floating-Point Operators]] – compares: the alignment shifter of an FP adder is the consumer that justifies the whole construction.
- [[Floating-Point Formats]] – depends-on: $w_F$ fixes $w_X=w_R=w_F+3$ and $S_{\max}$.
- [[Choosing a Shifter]] – compares: where this sits against every sibling shifter.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.1.4 Barrel shifter, pp. 314–315 — Fig. 10.6; 6-LUT mux merging and the pipelining caveat, p. 314; the FPGA wide-OR remark, p. 315.
- §10.1.5 Barrel shifter with early sticky bit computation, pp. 315–317 — Fig. 10.7, p. 317; the reversed stage-order argument, p. 315; the 20% area / 5% delay measurement and the $w_X=w_F+1,\ S_{\max}=w_F+3\to w_X=w_R=w_F+3$ collapse, p. 316.
- §10.1 Shifters, pp. 307–311 — generator parameters and the $S_{\max}$ constraint (10.1).

> [!warning] Printed-page offset differs by chapter
> In this PDF, printed page 107 is PDF page 129 (offset $+22$), but printed page 317 is PDF page 336 (offset $+19$). Verify the offset locally before citing a page from a different chapter.
