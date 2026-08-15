---
title: Sporadic Shifter
description: "When only a discrete subset of shift distances is ever needed, the multiplexer network is optimised against that set instead of against the whole range [0,S_max]."
kind: circuit
source: "ASA §10.4, p. 325"
status: seed
spade: simulated
tags: [digital, shifters, mux, fpga, optimization]
aliases:
  - Sporadic Shifters
  - Sporadic Logarithmic Shifter
  - Discrete-Set Shifter
---

# Sporadic Shifter

A shifter whose stage offsets are chosen so that their subset sums cover a given finite set $\mathcal{S}$ of required shift distances, rather than the whole interval $[0,S_{\max}]$ a [[Barrel Shifters|barrel shifter]] covers.

```tikz title="Two-stage sporadic right shifter for the shift set {0,3,5,8}"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >=latex,
  mux/.style={draw,fill=black!5,rounded corners=1pt,minimum width=54mm,minimum height=7mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.3pt}
]
\node (X) at (0,6.35) {$X = x_{15}\ldots x_0$};
\draw[-] (0,6.1) -- node[w,right]{$16$} (0,5.75);
\draw (-2.2,5.75) -- (2.2,5.75);
\draw[->] (-2.2,5.75) -- node[w,left]{$000\,x_{15}{\ldots}x_3$} (-2.2,5.25);
\draw[->] ( 2.2,5.75) -- node[w,right]{$x_{15}{\ldots}x_0$} ( 2.2,5.25);
\node[mux] (m0) at (0,4.9) {$16\times$ 2:1 mux \quad $\gg d_1 = 3$};
\node[w] at (-2.2,5.12) {$1$}; \node[w] at (2.2,5.12) {$0$};
\node (e0) at (-4.75,4.9) {$e_1 = s_0$}; \draw[->] (-3.85,4.9) -- (m0.west);

\draw[-] (0,4.55) -- node[w,right]{$16$} (0,3.95);
\draw (-2.2,3.95) -- (2.2,3.95);
\draw[->] (-2.2,3.95) -- node[w,left]{$00000\,\cdot{\ldots}$} (-2.2,3.45);
\draw[->] ( 2.2,3.95) -- node[w,right]{$\cdot{\ldots}$} ( 2.2,3.45);
\node[mux] (m1) at (0,3.1) {$16\times$ 2:1 mux \quad $\gg d_2 = 5$};
\node[w] at (-2.2,3.32) {$1$}; \node[w] at (2.2,3.32) {$0$};
\node (e1) at (-4.75,3.1) {$e_2 = s_1$}; \draw[->] (-3.85,3.1) -- (m1.west);

\draw[->] (0,2.75) -- node[w,right]{$16$} (0,2.05);
\node at (0,1.8) {$R = X \gg S$};

\node[w,align=left,anchor=north west] at (4.0,6.25)
  {$\mathcal{S}=\{0,3,5,8\}$\\[1pt] $D=(d_1,d_2)=(3,5)$\\[1pt] $m=2=\lceil\log_2|\mathcal{S}|\rceil$};
\node[w,align=left,anchor=north west] at (4.0,4.75)
  {$s_1s_0 \mapsto (e_2,e_1) \mapsto S$\\[1pt]
   $00 \mapsto (0,0) \mapsto 0$\\[1pt]
   $01 \mapsto (0,1) \mapsto 3$\\[1pt]
   $10 \mapsto (1,0) \mapsto 5$\\[1pt]
   $11 \mapsto (1,1) \mapsto 8$};
\node[w,align=left,anchor=north west] at (4.0,2.4)
  {a barrel shifter over\\ $[0,8]$ needs $4$ rows};
\end{circuitikz}
\end{document}
```

**Replace the shift range by a shift set.** The generic shifter of [[Shifters]] is parameterised by $S_{\max}$ and must answer every distance in $[0,S_{\max}]$, because $S$ is an arbitrary $w_S$-bit runtime input. Many application-specific datapaths never use that freedom: a fixed filter bank scales by three known powers of two, an [[Logarithmic Number Systems|LNS]] or posit decoder aligns at a handful of regime widths, a hand-scheduled FFT applies four distinct twiddle scalings. The specification is then a finite set $\mathcal{S}=\{S_1,\dots,S_{|\mathcal{S}|}\}\subset[0,S_{\max}]$ known at generation time, and the runtime input is no longer a distance but a **selector** $s$ on $\lceil\log_2|\mathcal{S}|\rceil$ bits. Shifters built against $\mathcal{S}$ rather than $[0,S_{\max}]$ are called *sporadic* (p. 325).

**A cascade of enabled stages realises exactly the subset sums of its offsets.** Shift-by-one $\sigma$ generates a monoid homomorphism from $(\mathbb{N},+)$ into function composition, $\sigma^a\circ\sigma^b=\sigma^{a+b}$ — the single law the whole shifter family rests on. Give stage $j$ a hardwired offset $d_j$ and an independent enable $e_j\in\{0,1\}$, so it computes $\sigma^{e_jd_j}$. Composing $m$ such stages and collecting exponents by that homomorphism,

$$\bigcirc_{j=1}^{m}\sigma^{e_jd_j}=\sigma^{\sum_{j}e_jd_j}$$

so the set of distances the cascade can produce is precisely the **subset-sum set** of the offset multiset $D=(d_1,\dots,d_m)$:

$$\Sigma(D)=\Big\{\textstyle\sum_{j\in J}d_j\;:\;J\subseteq\{1,\dots,m\}\Big\}$$

and by commutativity of $(\mathbb{N},+)$ the stage order does not change $\Sigma(D)$. A barrel shifter is the special case $D=(1,2,4,\dots,2^{w_S-1})$, whose subset-sum set is the full interval $[0,2^{w_S}-1]$ by uniqueness of binary expansion. **Sporadic design drops the requirement that $\Sigma(D)$ be an interval** and asks only for $\mathcal{S}\subseteq\Sigma(D)$ — distances in $\Sigma(D)\setminus\mathcal{S}$ are don't-cares that cost nothing, since no selector code maps to them.

**Counting stages gives an immediate lower bound.** $\Sigma(D)$ is the image of $\{0,1\}^m$ under $e\mapsto\sum_je_jd_j$, so $|\Sigma(D)|\le2^m$, and $\mathcal{S}\subseteq\Sigma(D)$ forces

$$m\;\ge\;\lceil\log_2|\mathcal{S}|\rceil$$

The barrel shifter is always available as a fallback, giving $m\le\lceil\log_2(S_{\max}+1)\rceil$. The entire prize of the sporadic construction is the gap between those two logarithms: one of $|\mathcal{S}|$, one of the range. For the figure's $\mathcal{S}=\{0,3,5,8\}$ the range bound is $\lceil\log_2 9\rceil=4$ rows and the set bound is $2$ — and $D=(3,5)$ attains it, since $\Sigma(3,5)=\{0,3,5,8\}=\mathcal{S}$ exactly. Half the muxes and half the depth, for a shifter that is functionally identical *on the inputs that occur*.

**The bound is not always attainable, which is what makes this a search.** Take $\mathcal{S}=\{0,1,2,4\}$, again $|\mathcal{S}|=4$, so the bound says $m\ge2$. With $m=2$ we would need $\Sigma(d_1,d_2)=\{0,d_1,d_2,d_1{+}d_2\}$ to equal $\mathcal{S}$ — four distinct values, so equality, not containment. The largest element of a subset-sum set of non-negative offsets is $d_1+d_2$, forcing $d_1+d_2=4$ and $\{d_1,d_2\}=\{1,2\}$, whence $d_1+d_2=3\ne4$: contradiction. Three stages, e.g. $D=(1,1,2)$ with $\Sigma=\{0,1,2,3,4\}$, are necessary. So $m$ depends on the additive structure of $\mathcal{S}$, not merely on its cardinality, and choosing $D$ is a discrete optimisation over offset multisets — the same shape of problem as picking a shared adder graph in [[Multiple Constant Multiplication]], and the natural job of the solver in [[ILP for Arithmetic Design]].

**Control moves out of the datapath and into a tiny decoder.** In the generic shifter the bits of $S$ *are* the stage enables, for free. Here the selector $s$ on $\lceil\log_2|\mathcal{S}|\rceil$ bits must be mapped to $m$ enables by a fixed table, a combinational block with $\lceil\log_2|\mathcal{S}|\rceil$ inputs and $m$ outputs. On an FPGA that is exactly $m$ [[Lookup-Tables|LUT]]s whenever $|\mathcal{S}|\le64$, i.e. essentially always — negligible next to the $m\,w_X$ muxes of the datapath, and off the critical path if the selector is registered. The figure's example is the degenerate case where the table is the identity: $\Sigma(3,5)$ hits each element of $\mathcal{S}$ under exactly one enable pattern, so $e_1=s_0$ and $e_2=s_1$ with no decoder at all. That happens iff $|\Sigma(D)|=|\mathcal{S}|=2^m$.

**Widths follow the offsets rather than the powers of two.** For the truncated case $w_X=w_R$ (the barrel-shaped one drawn above) every row is $w_X$ 1-bit muxes wide, so area is $m\,w_X$ and depth $m$ mux levels. For an [[Exact Full Shifter|exact full]] sporadic shifter the word grows by the offset it just admitted: after stage $j$ the width is $w_X+\sum_{k\le j}d_k$, and $w_R=w_X+\max\mathcal{S}$. Two consequences. First, order the stages **smallest offset first** — the identical argument to LSB-first in [[Exact Full Shifter]], with $2^i$ replaced by $d_j$: it keeps the narrow rows where the word is still short and minimises $\sum_j(w_X+\sum_{k<j}d_k)$. Second, if $\sum_jd_j>\max\mathcal{S}$ the cascade produces pad bits that are provably zero for every reachable enable pattern, and those columns prune away — an $\mathcal{S}$ whose cover is loose costs width as well as stages. Sticky-bit accumulation ([[Shifter with Sticky Bit Computation]]) carries over unchanged, because the sets $\mathcal{D}_j$ of bits discarded by each stage are still disjoint and still union to $\mathcal{D}$; only the widths of the per-stage ORs change from $2^j$ to $d_j$.

> [!important] The competitor is a flat mux, not the barrel shifter
> Against a barrel shifter the cascade wins trivially. The construction it must actually beat is the flat mux-per-position form of [[One-Hot Shifter]] restricted to $\mathcal{S}$ — one $|\mathcal{S}|$-input mux per output bit, driven by a one-hot decode of $s$, costing $w_X(|\mathcal{S}|-1)$ 2:1-equivalents at depth $\lceil\log_2|\mathcal{S}|\rceil$. That is the *same depth* as the best possible cascade, and its area penalty is only $|\mathcal{S}|-1$ versus $m\approx\log_2|\mathcal{S}|$. For a sporadic set of four or eight distances the two are close enough that layout, fanout on $X$, and whether the offsets happen to be routable decide it — not the asymptotics.

**On FPGAs the crossover moves further against the cascade.** A 6-input LUT is a 4:1 multiplexer (4 data, 2 select), so two successive rows of 2:1 muxes merge into one LUT row: the cascade costs $\lceil m/2\rceil$ LUT levels and about $\tfrac12mw_X$ LUTs. But the *same* LUT swallows a flat 4:1 mux whole. So for $|\mathcal{S}|\le4$ the flat form is one LUT level and $w_X$ LUTs, and no two-stage cascade can beat it — sporadic optimisation buys nothing on FPGA until $|\mathcal{S}|>4$, i.e. $m\ge3$. Where it does pay is when $S_{\max}$ is large and $\mathcal{S}$ is sparse: replacing a 6-row barrel shifter (3 LUT levels) with a 3-row cascade (2 LUT levels) is a real latency win on somebody else's critical path, which is the only reason to touch a shifter at all. Note also the pipelining rule from [[Barrel Shifters]] survives: register every *other* row, or the LUT merge is destroyed.

$$\boxed{\ \mathcal{S}\subseteq\Sigma(D),\qquad \big\lceil\log_2|\mathcal{S}|\big\rceil\;\le\;m\;\le\;\big\lceil\log_2(S_{\max}+1)\big\rceil\ }$$

> [!warning] The book gives this one paragraph — most of the above is derived here
> ASA p. 325 states only that "in some applications, only a set of discrete shifts are necessary […] it is possible to derive an optimized organization of the multiplexers from the set of shift values", citing Chen et al., *New Hardware and Power Efficient Sporadic Logarithmic Shifters for DSP Applications*, IEEE TCAD 37.4 (2018), pp. 896–900. The subset-sum formulation, the bound $m\ge\lceil\log_2|\mathcal{S}|\rceil$, the $\{0,1,2,4\}$ counter-example, the smallest-offset-first ordering and the FPGA crossover at $|\mathcal{S}|=4$ are derived in this note, not taken from the book. **No area, delay or power figure from Chen et al. is reproduced here, because that paper was not read** — treat any quantitative claim about published sporadic shifters as needing outside research.

## When it breaks

- **$\mathcal{S}$ must be closed at generation time.** One late requirement for an unlisted distance and the operator is simply wrong — there is no graceful degradation, unlike a barrel shifter given an out-of-range $S$. If $\mathcal{S}$ is only *usually* small, build the barrel shifter.
- **$|\mathcal{S}|\le4$ on FPGA.** The flat mux is already one LUT level and $w_X$ LUTs; the cascade ties at best. Below $m=3$ this note is theory, not engineering.
- **$|\mathcal{S}|$ approaching $S_{\max}$.** As $\mathcal{S}$ fills its range the two logarithms converge and $D$ degenerates to the powers of two: the sporadic shifter *is* the barrel shifter, with a decoder bolted on for nothing.
- **Loose covers cost width.** When $\Sigma(D)\supsetneq\mathcal{S}$ with $\sum_jd_j>\max\mathcal{S}$, an exact full sporadic shifter carries columns that can only ever be zero. Prune them or use the truncated form.
- **The offsets are no longer powers of two,** so a stage is a genuine constant-distance rewiring rather than a bit-index rename. Free in ASIC routing and free in FPGA routing, but it defeats any tooling that pattern-matches `>>` by a power of two — including the DSP trick of [[Shift by Multiplier]], which needs $S$ as a one-hot power, not as a subset sum.
- **Selector, not distance.** The interface is incompatible with anything upstream that computes $S$ arithmetically (an exponent difference, an [[Leading Zero Counters|LZC]] output). Sporadic shifters belong where the shift is chosen by control, never where it is computed by a datapath.

## RTL (Spade)

```spade
/// Sporadic right shifter for the shift set S = {0, 3, 5, 8}.
/// Stage offsets D = (3, 5); selector bit j enables stage j, so the
/// realised distance is the subset sum 3*s[0] + 5*s[1].
entity sporadic_shifter<#uint W>(x: uint<W>, sel: uint<2>) -> uint<W> {
    let e = sel.as_bits();
    let s0 = if e[0] { x >> 3 } else { x };
    if e[1] { s0 >> 5 } else { s0 }
}
```

`x` is the $w_X=W$-bit datapath; `sel` is the $\lceil\log_2|\mathcal{S}|\rceil=2$-bit **selector**, and the identity decode of the figure is what lets `sel.as_bits()` be used directly as the enable vector `e` — a set needing a real decoder would insert a `match sel { .. }` producing `[bool; m]` here. Each `if` is one row of $W$ 1-bit muxes; `x >> 3` and `>> 5` are the hardwired offsets $d_1,d_2$, which cost routing only. `>>` on `uint<W>` returns `uint<W>`, so this is the truncated form $w_X=w_R$ — bits shifted past the LSB are lost, and a sticky bit would have to be OR-ed out of `x.as_bits()[0..3]` and `s0.as_bits()[0..5]` inside the respective stages. Purely combinational: synthesis will flatten both rows into a single 4:1 mux per bit, one 6-LUT level, which is precisely the FPGA caveat above.

Compiled and simulated with a concrete `sporadic16` wrapper against a behavioural `x >> {0,3,5,8}[sel]` reference: 7 named vectors — including the asymmetric `16'h8001`, which distinguishes a correct shift from a reversed bit order or swapped offsets — plus a 3000-vector random sweep, 3007/3007 passing.

## Related Notes

- [[Barrel Shifters]] – compares: the $\mathcal{S}=[0,S_{\max}]$ case, whose binary offsets $D=(1,2,4,\dots)$ attain the same bound over the full range.
- [[One-Hot Shifter]] – compares: the flat $|\mathcal{S}|$:1 mux is the real competitor at small $|\mathcal{S}|$, matching the cascade in depth.
- [[Exact Full Shifter]] – extends: supplies the stage-ordering argument, with $2^i$ replaced by $d_j$ and LSB-first becoming smallest-offset-first.
- [[Multiple Constant Multiplication]] – compares: same discrete search, covering a set of constants by shared shift-and-add stages instead of a set of distances by shared offsets.
- [[ILP for Arithmetic Design]] – supports: the formulation that actually picks $D$, since minimising $m$ subject to $\mathcal{S}\subseteq\Sigma(D)$ has no closed form.
- [[Shifter with Sticky Bit Computation]] – extends: per-stage sticky accumulation survives unchanged, with OR widths $d_j$ instead of $2^j$.
- [[Choosing a Shifter]] – compares: where this sits against every sibling.
- [[Shift by Multiplier]] – counter-example: the DSP route needs $S$ one-hot encoded as a power of two, which a subset-sum cascade never produces.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.4 To read further, p. 325 — sporadic shifters, one paragraph, citing [Che+18].
- §10.1.3 Architecture of an exact full shifter, pp. 312–314 — stage ordering and the two-mux-rows-per-6-LUT merge, both reused here.
- §10.1.4 Barrel shifter, pp. 314–315 — the $w_X\lceil\log_2(S_{\max}+1)\rceil$ baseline this construction is measured against.
- References, p. 326 — Chen, Chang, Wang, Zhao & Rahardja, "New Hardware and Power Efficient Sporadic Logarithmic Shifters for DSP Applications", *IEEE TCAD* 37.4 (2018), pp. 896–900. Not consulted.
