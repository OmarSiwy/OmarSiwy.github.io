---
title: Truncated Shifter
description: "Any shifter with w_R < w_X+S_max: cheaper than an exact full shifter because it never builds the hardware feeding bits doomed to be discarded, at the price of up to 1 ulp unless a sticky bit is kept."
kind: circuit
source: "ASA §10.1–10.1.3, pp. 307–314"
status: seed
spade: simulated
tags: [digital, shifters, truncation, rounding, fpga]
aliases:
  - Truncated Shifters
  - Truncating Shifter
  - Truncated Full Shifter
---

# Truncated Shifter

A shifter whose output is narrower than the exact result, $w_R<w_X+S_{\max}$, so that some shift distances push bits of $X$ out of $R$ — and whose whole point is that the multiplexers that would have carried those bits are never instantiated.

```tikz title="Output layouts of exact, barrel, truncated-full and generic truncated right shifters, w_X = 4"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  R/.style={draw,font=\ttfamily,inner sep=2.2pt,minimum height=4.6mm,anchor=west},
  D/.style={font=\ttfamily,red,inner sep=2.2pt,anchor=west},
  L/.style={font=\scriptsize,anchor=east},
  C/.style={font=\scriptsize,anchor=north}
]
% ---- (a) exact full shifter, wX=4, Smax=6, wR=10 ----
\begin{scope}[yshift=0cm]
  \node[L] at (0,0.0) {$S=0$:};
  \node[R] (a0) at (0,0.0) {xxxx\textcolor{blue}{......}};
  \node[L] at (0,-0.55) {$0<S<S_{\max}$:};
  \node[R] (a1) at (0,-0.55) {\textcolor{blue}{...}xxxx\textcolor{blue}{...}};
  \node[L] at (0,-1.1) {$S=S_{\max}$:};
  \node[R] (a2) at (0,-1.1) {\textcolor{blue}{......}xxxx};
  \node[C,align=center] at (1.1,-1.45)
    {(a) exact full, $w_R=w_X{+}S_{\max}=10$\\ nothing discarded};
\end{scope}
% ---- (b) barrel shifter, wX=wR=4, Smax=4 ----
\begin{scope}[xshift=6.6cm]
  \node[L] at (0,0.0) {$S=0$:};
  \node[R] (b0) at (0,0.0) {xxxx};
  \node[L] at (0,-0.55) {$0<S<S_{\max}$:};
  \node[R] (b1) at (0,-0.55) {\textcolor{blue}{..}xx};
  \node[D] at (b1.east) {xx};
  \node[L] at (0,-1.1) {$S=S_{\max}$:};
  \node[R] (b2) at (0,-1.1) {\textcolor{blue}{....}};
  \node[D] at (b2.east) {xxxx};
  \node[C,align=center] at (0.9,-1.45)
    {(b) barrel, $w_X=w_R=4$\\ $S_{\max}=w_X$};
\end{scope}
% ---- (c) truncated full shifter, wX=4, Smax=10, wR=10 ----
\begin{scope}[yshift=-3.1cm]
  \node[L] at (0,0.0) {$S=0$:};
  \node[R] (c0) at (0,0.0) {xxxx\textcolor{blue}{......}};
  \node[L] at (0,-0.55) {$0<S<w_R{-}w_X$:};
  \node[R] (c1) at (0,-0.55) {\textcolor{blue}{....}xxxx\textcolor{blue}{..}};
  \node[L] at (0,-1.1) {$w_R{-}w_X<S<S_{\max}$:};
  \node[R] (c2) at (0,-1.1) {\textcolor{blue}{........}xx};
  \node[D] at (c2.east) {xx};
  \node[L] at (0,-1.65) {$S=S_{\max}=w_R$:};
  \node[R] (c3) at (0,-1.65) {\textcolor{blue}{..........}};
  \node[D] at (c3.east) {xxxx};
  \node[C,align=center] at (1.1,-2.0)
    {(c) truncated full, $S_{\max}=w_R=10$\\ $X$ can leave $R$ entirely};
\end{scope}
% ---- (d) random truncated shifter, wX=4, wR=8, Smax=6 ----
\begin{scope}[xshift=6.6cm,yshift=-3.1cm]
  \node[L] at (0,0.0) {$S=0$:};
  \node[R] (d0) at (0,0.0) {xxxx\textcolor{blue}{....}};
  \node[L] at (0,-0.55) {$0<S<w_R{-}w_X$:};
  \node[R] (d1) at (0,-0.55) {\textcolor{blue}{..}xxxx\textcolor{blue}{..}};
  \node[L] at (0,-1.1) {$S=S_{\max}$:};
  \node[R] (d2) at (0,-1.1) {\textcolor{blue}{......}xx};
  \node[D] at (d2.east) {xx};
  \node[C,align=center] at (0.9,-1.45)
    {(d) generic truncated, $w_X{=}4$\\ $w_R{=}8$, $S_{\max}{=}6$};
\end{scope}
\node[font=\scriptsize,anchor=west] at (-2.6,-6.1)
  {\texttt{x} = bit of $X$ \quad \textcolor{blue}{\texttt{.}} = pad bit \quad
   \textcolor{red}{\texttt{x}} = discarded \quad box $=R$, $w_R$ bits};
\end{circuitikz}
\end{document}
```

*After Fig. 10.3, p. 310.*

**Read the definition off the inequality, not off the architecture.** A shifter generator is fixed by direction, the input width $w_X$, the maximum distance $S_{\max}$, the output width $w_R$ and the pad values $(p_\text{left},p_\text{right})$; the shift input $S$ is $w_S=\lceil\log_2(S_{\max}+1)\rceil$ bits and is *derived*, not given ([[Shifters]]). Truncation is the single relation $w_R<w_X+S_{\max}$ among those parameters. It says nothing about how the circuit is built and everything about what it promises: there exists at least one legal $S$ for which a bit of $X$ has no position in $R$. Panel (a) above is the boundary case $w_R=w_X+S_{\max}$ — the [[Exact Full Shifter]], no red bits at any $S$; every other panel drops something.

**The saving is hardware that is never built, not hardware that is switched off.** The lazy way to get a truncated output is to instantiate an exact full shifter and wire only $w_R$ of its $w_X+S_{\max}$ output bits to the consumer. That works and it costs full price: the discarded outputs still have muxes behind them, and those muxes still have muxes behind *them*, back to $X$. The objective of a truncated shifter is exactly that hardware (p. 311). Concretely, align $X$ inside a $w_R$-bit word once, by constant routing — for a right shifter, pad it on the right with $w_R-w_X$ pad bits so it sits against the MSB of $R$ — and then run the usual $\gg2^i$ mux rows *inside $w_R$ bits*. Nothing wider than $R$ ever exists, so nothing doomed is ever computed. [[Barrel Shifters]] is this construction at $w_X=w_R$.

**Count the muxes stage by stage and both extremes fall out of one formula.** Consume the bits of $S$ LSB-first, so that after stages $0\ldots i$ the accumulated distance is at most $\sum_{j\le i}2^j=2^{i+1}-1$ by the binary decomposition of $S$. A bit of $X$ can therefore occupy at most $w_X+2^{i+1}-1$ distinct positions at that point; every position beyond that holds a pad constant, and a mux with a constant input is not a mux (it degenerates to an AND gate for zero padding, or to a wire, p. 313). Clip that live span at the output width and stage $i$ is $\min\!\big(w_R,\,w_X+2^{i+1}-1\big)$ 1-bit muxes wide. For $w_X=8,\ w_S=4$ and no clipping this gives $9+11+15+23=58$, the book's exact-full-shifter figure (p. 313); clipping at $w_R=w_X=8$ gives $8\cdot4=32$, the barrel-shifter figure. A truncated shifter interpolates between the two, and the interpolation is monotone in $w_R$: every bit you refuse to output is a bit you stop paying for in every stage that would have carried it.

**The stage-ordering argument changes character once the stages stop growing.** For an exact full shifter, LSB-first ordering is chosen partly because it minimises the summed mux width — $58$ against $81$ for MSB-first (p. 313). Under heavy truncation most stages hit the $w_R$ clip and that summed-width argument evaporates, leaving only the timing argument: $S$ usually comes out of an adder or subtractor whose carry propagation produces the low bits first, so LSB-first overlaps the shift with the computation of $S$ and lets you get away with a slow adder there (p. 313). The one case that overturns even this is a shifter feeding a rounded operator, where reversing the order puts the widest sticky OR first — see [[Shifter with Sticky Bit Computation]].

**Discarding is not the same as losing.** The bits that leave $R$ carry no information whenever they are known to be constant. The clearest case is a left shifter inside a normalizer: it shifts a value up until its leading one reaches the MSB, so everything it pushes off the left is by construction a leading *zero* ([[Normalizers]]). Zero ulp of error, and the shifter is still formally truncated. The same argument rescues the narrowed last stage of an exact full shifter when $S_{\max}\ne2^{w_S}-1$: the bits that stage appears to throw away can only be pad zeroes introduced by earlier stages, because $S>S_{\max}$ never occurs (Fig. 10.5, p. 313). That circuit *looks* truncated in a schematic and is exact.

**When the discarded bits are real, price them in ulps.** For a right shifter with zero padding, the aligned word is $X\cdot2^{\,w_R-w_X}$ and the output is
$$R=\left\lfloor\frac{X}{2^{\,S+w_X-w_R}}\right\rfloor,$$
a floor, so the error $\varepsilon = X/2^{\,S+w_X-w_R}-R$ obeys $0\le\varepsilon<1$ ulp of $R$: the operator is *faithful* but not correctly rounded ([[Error Accuracy]]). Recovering the $\tfrac12$ ulp guarantee of round-to-nearest costs exactly two extra bits of state — a round bit $r$ (the first discarded bit) and a sticky bit $\sigma=\bigvee\{\text{remaining discarded bits}\}$ — because $r$ alone cannot distinguish an exact tie from a value just above one ([[Rounding]]). That is the honest accounting: truncation buys area, and buying back correct rounding spends a little of it on an OR tree. Spending it *inside* the stages rather than after the shifter is what keeps the deal profitable — measured on a single-precision floating-point adder, a barrel shifter with incremental sticky computation beat an exact full shifter plus a wide OR by 20% area and 5% delay (p. 316).

$$\boxed{\ w_R<w_X+S_{\max}\ \Longrightarrow\ \text{cost}=\sum_{i=0}^{w_S-1}\min\!\big(w_R,\ w_X+2^{i+1}-1\big)\ \text{1-bit muxes},\quad \text{depth}=w_S\ }$$

**When it breaks.**

- $S_{\max}\le\max(w_R,w_X)\le\min(w_R,w_X)+S_{\max}$ (Eq. 10.1, p. 311) bounds the useful design space. Violate it upward — $w_R>w_X+S_{\max}$ — and the extra output bits are dead silicon no input bit can reach. Violate it the other way — $S_{\max}>w_R$ when $w_R>w_X$ — and every $S\ge w_R$ produces the same constant, so those distances should be constant-folded out of the generator rather than built.
- $S_{\max}=w_R$ is the extremal *truncated full shifter* (panel c): $X$ can be shifted out completely. Legal, and the right choice when the consumer genuinely wants zero for large $S$, but the top stages are then mostly pad and worth checking against a decoder-plus-AND-mask.
- Truncation error is only "small enough" relative to a stated target accuracy. If the shifter feeds a rounded result, truncation alone forfeits correct rounding; you need $\sigma$, and then [[Shifter with Sticky Bit Computation]] is the circuit, not this one.
- On FPGAs the saving is quantised. Two successive rows of 2:1 muxes merge into one row of 6-input LUTs (p. 314), so narrowing a stage below the neighbouring row's width buys nothing until the LUT count actually drops — and pipeline registers must go every *other* level or the merge is defeated.
- At $w_R\ge w_X+S_{\max}$ there is nothing to truncate and the [[Exact Full Shifter]] is strictly the better documented starting point.

**RTL.** Generic in the three widths, with the alignment as constant routing and the shift confined to $w_R$ bits:

```spade
fn trunc_shr<#uint WX, #uint WR, #uint WS>(x: uint<WX>, s: uint<WS>) -> uint<WR>
    where WR >= WX else "output must be at least as wide as the input"
    , WR >= WS else "shift distance must fit the datapath"
{
    let pad: uint<{WR - WX}> = 0;
    let aligned: uint<WR> = x.concat(pad);
    aligned >> zext::<WS, WR>(s)
}
```

`aligned` is the constant left-alignment of $X$ against the MSB of $R$ — pure wiring, no gates — and `>>` is the $w_S$-deep chain of $w_R$-wide mux rows; the whole entity is combinational. The width arithmetic is the note's point: the shifted word is `uint<WR>`, never `uint<{WX + SMAX}>`, which is why `WR < WX` needs the mirror-image wrapper (pre-truncate $X$ by $w_X-w_R$ instead of padding it) rather than a wider datapath. Synthesis differs from the drawing in one way: the flat `>>` nominally builds $w_S$ rows of $w_R$ muxes, and it is constant propagation from the zero `pad` that recovers the $\min(w_R,\,w_X+2^{i+1}-1)$ narrowing per stage — a generator emits that narrowing directly, the tool has to rediscover it.

Verified at $w_X=4$, $w_R=8$, $S_{\max}=6$ (panel d) against `(X << 4) >> S`: 3007 vectors, including asymmetric cases such as $X=1001_2,\ S=3\Rightarrow R=00010010_2$ and $S=7\Rightarrow R=00000001_2$ with three bits discarded.

**Related notes.**

- [[Exact Full Shifter]] – compares: the $w_R=w_X+S_{\max}$ boundary case this is defined against, and the source of the LSB-first stage order.
- [[Barrel Shifters]] – extends: the $w_X=w_R$ specialisation, necessarily truncated and with every stage at the clip.
- [[Shifter with Sticky Bit Computation]] – extends: adds the one bit that turns a faithful truncation into a correctly rounded one, computed inside the stages.
- [[Normalizers]] – counter-example: truncated by the inequality, exact in practice, because everything it discards is a leading zero.
- [[Truncated Multipliers]] – compares: the same "do not build what you will discard" trade in a multiplier, where the error analysis is harder because many partial products vanish at once.
- [[Rounding]] – depends-on: what round and sticky bits mean and why one of them is not enough.
- [[Error Accuracy]] – depends-on: faithful versus correctly rounded, and the ulp bookkeeping used above.
- [[Choosing a Shifter]] – compares: where this sits against every sibling in the family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.1 Shifters, pp. 307–311 — generator parameters, Fig. 10.3 (p. 310), footnote on the "truncated"/"truncating" naming, constraint (10.1) p. 311.
- §10.1.3 Architecture of an exact full shifter, pp. 312–314 — Figs. 10.4–10.5; the 58-vs-81 mux counts; zero-padding collapsing muxes to AND gates; the 6-LUT merging remark.
- §10.1.4–10.1.5 Barrel shifter and early sticky, pp. 314–316 — the 20% area / 5% delay measurement.
