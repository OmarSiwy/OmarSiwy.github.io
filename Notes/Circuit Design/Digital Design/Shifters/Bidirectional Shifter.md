---
title: Bidirectional Shifter
description: "A shifter taking a direction bit or signed S; the book's advice is not to build one — bias S by a constant offset and use a unidirectional shifter instead, which is free in a floating-point context because the offset merges into the exponent bias."
kind: circuit
source: "ASA §10.1.1–10.1.2, pp. 308–309"
status: seed
spade: simulated
tags: [digital, shifters, floating-point, fpga]
aliases:
  - "Bidirectional Shifters"
  - "Bi-directional Shifter"
  - "Signed Shifter"
  - "Avoiding Bidirectional Shifters"
---

# Bidirectional Shifter

A shifter that takes the shift direction as a runtime input rather than as a generator parameter — and the one shifter in this chapter that you are told not to build, because a constant offset added to the signed distance turns it into an ordinary unidirectional shifter.

```tikz title="A runtime-direction shifter versus its biased unidirectional replacement"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex,
  box/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=30mm,minimum height=9mm,inner sep=2pt},
  sm/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=11mm,minimum height=6mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.3pt}
]
% ---------- (a) the component NOT to build ----------
\node (xa) at (-4.6,5.3) {$X$};
\draw[->] (-4.6,5.05) -- node[w,right]{$w_X$} (-4.6,4.25);
\node[box] (ba) at (-4.6,3.8) {shifter, both ways};
\node (sa) at (-9.7,4.05) {$S$};
\draw[->] (sa) -- node[w,above]{$w_S{+}1$, signed} (-6.11,4.05);
\node (da) at (-9.7,3.55) {\texttt{dir}};
\draw[->] (da) -- node[w,below]{$1$} (-6.11,3.55);
\draw[->] (-4.6,3.35) -- node[w,right]{$w_R$} (-4.6,2.55);
\node (ra) at (-4.6,2.3) {$R$};
\node[w,align=center] at (-4.6,1.65)
  {two mux arrays $+$ an output mux,\\ each sized for $S_{\max}=\max(S_\ell,S_r)$};
\node at (-4.6,0.8) {(a) do not build this};

% ---------- (b) the biased unidirectional replacement ----------
\node (xb) at (6.4,5.3) {$X$};
\draw[->] (6.4,5.05) -- node[w,right]{$w_X$} (6.4,4.25);
\node[box] (bb) at (6.4,3.8) {$\ll$ \ left shifter};
\node (sb) at (1.1,5.3) {$S$};
\draw[->] (1.1,5.05) -- node[w,left]{$w_S{+}1$, signed} (1.1,4.46);
\node[sm] (add) at (1.1,4.1) {$+\,\Delta$};
\node[w,anchor=north] at (1.1,3.72) {$\Delta=S_r$};
\draw[->] (add.east) -- (2.3,4.1) -- (2.3,3.8)
      -- node[w,above]{$S'\in[0,\,S_\ell{+}S_r]$} (4.89,3.8);
\draw[->] (6.4,3.35) -- node[w,right]{$w_R=w_X{+}S_\ell{+}S_r$} (6.4,2.55);
\node (rb) at (6.4,2.3) {$R$};
\node[w,align=center] at (6.4,1.65)
  {one mux array, $S_{\max}=S_\ell{+}S_r$;\\ LSB of $R$ has weight $2^{-\Delta}$, so $R\,2^{-\Delta}=X\,2^{S}$};
\node at (6.4,0.8) {(b) build this};
\end{circuitikz}
\end{document}
```

*After Fig. 10.1, p. 308, which gives only the two unidirectional black boxes; the runtime-direction box of (a) and the bias path of (b) are this note's construction from the argument of §10.1.1.*

**Fix what a signed shift distance actually means before costing any hardware.** The specification is a value, not a bit pattern: given $X$ on $w_X$ bits and a signed distance $S\in[-S_r,\,+S_\ell]$ with positive meaning left, produce the number $X\cdot 2^{S}$. Encoding $S$ as sign-plus-magnitude — a direction bit `dir` plus an unsigned magnitude — is the "almost equivalently" of p. 308: almost, because sign+magnitude has two encodings of $S=0$, so the direction bit is redundant exactly at the one distance where it does not matter (footnote 1, p. 308). $S$ needs $w_S+1$ bits signed, where $w_S=\lceil\log_2(\max(S_\ell,S_r)+1)\rceil$.

**Both directions are the same placement problem, so make the window hold every placement.** $X\cdot 2^S$ ranges over $S_\ell+S_r+1$ distinct positions of the same $w_X$ bits: the lowest at $S=-S_r$, the highest at $S=+S_\ell$. A register of $w_R=w_X+S_\ell+S_r$ bits contains all of them with nothing lost. Pre-position $X$ at its *rightmost* possible placement — bottom of the window — and every remaining case is reached by a **left** shift alone. Substituting $S'=S+\Delta$ with $\Delta=S_r$ into $X\cdot 2^S$ and factoring the constant out gives

$$X\cdot 2^{S}\;=\;2^{-\Delta}\cdot\big(X\cdot 2^{S+\Delta}\big)\;=\;2^{-\Delta}\cdot\big(X\ll S'\big),\qquad S'\in[0,\,S_\ell+S_r]$$

The factor $2^{-\Delta}$ is **not a shift**. It is a statement about where the binary point of $R$ sits — the LSB of the window carries weight $2^{-\Delta}$ relative to the LSB of $X$ — which is a fixed-point format annotation and therefore zero gates ([[Fixed-Point Representations]], [[Number Formats]]). All that remains as hardware is one unidirectional left shifter of $S_{\max}=S_\ell+S_r$ and one $w_S$-bit addition, exactly the overhead p. 308 quotes.

**The offset is free where these shifts come from.** In floating-point alignment $S$ is an exponent difference, and stored exponents are already biased: the hardware computes $\tilde{E}_x-\tilde{E}_y$ from fields that each carry a constant $B$, so a constant subtraction is already in the datapath ([[Floating-Point Formats]]). $\Delta$ merges into it and disappears — one constant folded into another costs nothing. Even standing alone the adder is trivial: $w_S\le 6$ covers every shift up to 64 bits (p. 309), so it is a 6-bit add on a path that already tolerates it. And because the shifter consumes $S'$ LSB-first, the adder producing $S'$ need not even be fast — its low bits arrive first, which is all stage $0$ needs ([[Exact Full Shifter]]).

**Costing the thing you avoided.** The book asserts the unidirectional reduction "usually leads to more efficient architectures"; here is why, in muxes. A runtime-direction shifter has two honest implementations, and neither is cheap. Duplicate the array — a left shifter and a right shifter in parallel, selected by a $w_R$-wide output mux. Or make each stage three-way (pass, $\ll 2^i$, $\gg 2^i$), which costs two 2:1 muxes per bit per stage, since a 3:1 mux is two 2:1s, and puts `dir` on a fanout of $w_R w_S$. Both land at roughly $2w_Rw_S$ against the biased design's $w_Rw_{S'}$, with $w_{S'}=\lceil\log_2(S_\ell+S_r+1)\rceil$:

| Architecture | 1-bit muxes | Depth | Fanout of the control | Source |
| --- | --- | --- | --- | --- |
| Two arrays $+$ output mux | $2w_Rw_S+w_R$ | $w_S+1$ | $w_R$ on `dir` | derived, not in the book |
| Per-stage 3:1 array | $\approx 2w_Rw_S$ | $w_S$ | $w_Rw_S$ on `dir` | derived, not in the book |
| Bias $+$ left shifter | $w_Rw_{S'}$ $+$ one $w_S$-bit adder | $w_{S'}$ | $w_R$ on each $s'_i$ | p. 308–309 |

**The asymmetric case is where the gap is largest, and it is the common case.** When $S_\ell=S_r=S_{\max}$ the biased design pays one extra mux level, $w_{S'}=w_S+1$, so the saving is $2w_Sw_R\to(w_S{+}1)w_R$ — still near $2\times$ for any $w_S\ge 2$. When the two limits differ, say $S_\ell=20$ and $S_r=2$, a bidirectional shifter must be built for $S_{\max}=20$ *in both directions* because its two halves are symmetric by construction, and 18 of the 20 right-shift positions are dead silicon. The biased design builds $S_{\max}=22$ once. That is precisely p. 309's "in particular in the general case where the maximum left and right shift distances were not identical".

> [!important] On a wide enough window, direction is a label, not hardware
> Take an [[Exact Full Shifter]] with $S_{\max}=2^{w_S}-1$, so its $(w_X+S_{\max})$-bit window holds every placement of $X$. Left-shifting by $S$ and right-shifting by $S$ then enumerate the *same* $S_{\max}+1$ placements, in opposite order, so as bit patterns in that window $X\ll S$ and $X\gg(S_{\max}-S)$ are identical. And $S_{\max}-S=\overline{S}$, the bitwise complement, because $S_{\max}=2^{w_S}-1$. That is the content of the caption of Fig. 10.4, p. 312 — "for a left shifter, just exchange the two inputs to each multiplexer, or (equivalently) complement all the $s_i$" — read as arithmetic rather than as drawing advice. Reversing direction *is* an affine map $S\mapsto\Delta-S$ on the distance, the same species of free constant re-biasing as $S\mapsto S+\Delta$. There was never a second circuit to build; there was a second way to index the one circuit.

**This is why direction is a generator parameter.** Every shifter in the book, and every shifter generated by [[FloPoCo]], is unidirectional; direction is an input to the shifter *generator* (Fig. 10.2, p. 309), alongside $w_X$, $S_{\max}$, $w_R$ and the pad bits $(p_\text{left},p_\text{right})$ — never an input to the shifter (Fig. 10.1, p. 308). Fixing it at generation is what lets stage $i$'s two mux ports be hardwired routing, which costs nothing; a runtime direction is what forces a third port and a real gate. The pad parameter interacts with the choice: $p=-1$, pad from a runtime input port, is how the left pad becomes the sign bit of $X$ and the right shift becomes *arithmetic*, i.e. division of a two's-complement number by $2^S$ (p. 309, and §2.2.3). In the biased scheme that arithmetic pad is still needed — the pre-positioned $X$ must be sign-extended into the top of the window if $X$ is signed — but it is needed on one array instead of two.

$$\boxed{\ X\cdot 2^{S}\;=\;2^{-\Delta}\big(X\ll(S+\Delta)\big),\qquad \Delta=S_r,\quad S+\Delta\in[0,\,S_\ell+S_r]\ }$$

**When it breaks.**

- **The distance must be range-guaranteed upstream.** $S+\Delta$ is computed as a wrapping $w_{S'}$-bit add with no carry-out, which is exactly why it is cheap. Feed it an $S$ outside $[-S_r,S_\ell]$ and it wraps to a legal-looking but wrong placement, silently. Saturation or a range assertion belongs at the producer of $S$, not here.
- **A microprocessor ALU genuinely needs both.** `SLL`/`SRL`/`SRA` are selected by opcode at runtime and must write back into the same $w_X$-bit register, so there is no wider window to relabel and no exponent bias to hide $\Delta$ in. The escape there is not a 3:1 array either — it is one right [[Barrel Shifters|barrel shifter]] wrapped in bit reversal, since $X\ll S=\mathrm{rev}(\mathrm{rev}(X)\gg S)$ and reversal is wiring.
- **The window is the price.** $w_R=w_X+S_\ell+S_r$ is an [[Exact Full Shifter]]. If the consumer only takes $w_X$ bits you are back to a [[Truncated Shifter]] and must decide what the discarded bits cost, which reopens the sticky-bit question ([[Shifter with Sticky Bit Computation]]).
- **$\Delta$ is only free when something else is already adding a constant.** With $S$ arriving as a raw port and no bias subtraction nearby, you pay a real $w_S$-bit adder. Small, but not nothing, and on a $w_S=6$ critical path in front of a 2-level shifter it is no longer negligible.
- **Sign+magnitude is not a signed integer.** If the interface hands you `dir` and $|S|$ rather than two's-complement $S$, converting costs a conditional negation before the bias can be added — cheap at $w_S\le 6$, but it is a step the "just add $\Delta$" story hides.

**RTL (Spade).**

```spade
/// Signed shift by constant re-biasing: the replacement for a bidirectional shifter.
/// `s` is the signed distance (positive = left); `delta` is the largest right shift.
/// The result is a plain unsigned LEFT shift by s+delta on a window wide enough for
/// every placement; its LSB carries weight 2^-delta, so it represents x * 2^s.
fn biased_shift<#uint WX, #uint WS, #uint WR>(
    x: uint<WX>,
    s: int<WS>,
    delta: uint<WS>,
) -> uint<WR> {
    let sp: uint<WS> = s.as_uint() +. delta;
    let win: uint<WR> = zext(x);
    let amount: uint<WR> = zext(sp);
    win << amount
}
```

`sp` is the $+\Delta$ box of the diagram and `win << amount` is the whole left-shifter block; there is no `dir` signal anywhere, which is the point. The bias uses `as_uint` (a bit reinterpretation, not a conversion) followed by the **wrapping** add `+.` rather than `+`: two's-complement addition of $\Delta$ to a signed $S$ produces the correct unsigned $S'$ in the same $w_S$ bits whenever $0\le S+\Delta<2^{w_S}$, so no width growth is needed — the arithmetic that makes the offset free is the same arithmetic that makes it a wrapping add. `zext(x)` into `uint<WR>` is the pre-positioning of $X$ at the bottom of the window, and it is pure routing; with a signed $X$ it would be `sext` instead, which is the $p_\text{left}=-1$ arithmetic-shift case. Everything is a `fn`, so it is combinational; synthesis will not build the flat `<<` as drawn but as the $w_{S'}$-deep mux cascade of [[Exact Full Shifter]], merging two mux rows per 6-LUT on FPGA.

Simulated against a behavioural reference with $w_X=8$, $S\in[-4,+4]$, $\Delta=4$, $w_R=16$: 7 named vectors plus 3000 random ones, all passing. The named set includes the asymmetric pair $(X{=}\mathtt{01}_{16},\,S{=}{+}4)\to\mathtt{0100}_{16}$ and $(X{=}\mathtt{80}_{16},\,S{=}{-}4)\to\mathtt{0080}_{16}$, which fails loudly under either a reversed bit order or a reversed shift direction.

**Related notes.**

- [[Exact Full Shifter]] – depends-on: the unidirectional array the biased distance drives, and the source of the $\overline{S}$ mirror-image identity.
- [[Barrel Shifters]] – compares: the $w_R=w_X$ case, where there is no spare window to absorb the bias and bit reversal replaces it.
- [[Truncated Shifter]] – compares: what the biased design degrades into once the consumer cannot take $w_X+S_\ell+S_r$ bits.
- [[Choosing a Shifter]] – compares: where this decision sits among the rest of the shifter trade-offs.
- [[Shifter with Sticky Bit Computation]] – extends: the floating-point alignment shifter this reduction is aimed at, once the discarded bits have to be accounted for.
- [[Normalizers]] – counter-example: the opposite direction of the same datapath, where the distance is produced by a leading-zero count and is unsigned by construction.
- [[Floating-Point Formats]] – supports: the exponent bias that swallows $\Delta$ at zero cost.
- [[Fixed-Point Representations]] – supports: the $2^{-\Delta}$ factor is a binary-point relabelling in this format, not an operation.
- [[Number Formats]] – depends-on: two's-complement encoding of $S$, and the sign-extension that makes the pad arithmetic.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 10 "Shifters and Leading Bit Counters":

- §10.1, p. 307 — shifter specification: $X$ on $w_X$, $S$ on $w_S$, multiplication or division by $2^S$.
- **Fig. 10.1, p. 308** — the classical black boxes for a left and a right shifter; direction is a property of the box, not a port.
- §10.1.1 "Avoiding bidirectional shifters", pp. 308–309 — the constant-offset argument, footnote 1 on direction-bit versus signed $S$, the $w_S\le 6$ remark, and the asymmetric-limits case.
- §10.1.2 "Parameters of a generic shifter generator", p. 309 — **Fig. 10.2**: direction, $w_X$, $S_{\max}$, $w_R$, $(p_\text{left},p_\text{right})$; $p=-1$ and the LSR/ASR split.
- §10.1.3, p. 312 — caption of Fig. 10.4: exchanging the two mux inputs, equivalently complementing every $s_i$, mirrors a right shifter into a left one.
