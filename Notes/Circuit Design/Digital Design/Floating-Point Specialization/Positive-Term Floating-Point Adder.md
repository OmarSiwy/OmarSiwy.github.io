---
title: "Positive-Term Floating-Point Adder"
description: "Guaranteed same-sign operands make the close path unreachable, so the LZC, the left normalizer and the path mux all vanish — about a third of the adder, at no accuracy cost."
kind: circuit
source: "ASA §15.4, p. 468; Fig. 11.6, p. 341"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, adder, floating-point, rounding]
aliases:
  - Floating-Point Addition of Positive Terms
  - Same-Sign Floating-Point Adder
  - Far-Path-Only Floating-Point Adder
  - Positive-Term FP Adder
---

# Positive-Term Floating-Point Adder

A floating-point adder for operands that are guaranteed to share a sign, which therefore keeps only the *far* path of a dual-path adder and contains no leading-zero counter and no left normalizer at all.

```tikz title="Dual-path floating-point adder with the close path, its LZC, its left normalizer and the path-select multiplexer deleted"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
\node[draw,minimum width=12.4cm,minimum height=0.85cm] (top) at (0,8.0)
  {unpack \& exception handling, exponent difference \& swap};
\draw[<-] ([xshift=-15mm]top.north) -- ++(0,0.75) node[above,font=\small]{$X$};
\draw[<-] ([xshift=15mm]top.north) -- ++(0,0.75) node[above,font=\small]{$Y$};
\node[font=\tiny,anchor=east] at (-1.65,8.8) {$1{+}w_E{+}w_F$};
\node[font=\tiny,anchor=west] at (1.65,8.8) {$1{+}w_E{+}w_F$};
% ---------------- far path: everything that survives ----------------
\node[font=\tiny,anchor=west] at (-0.35,6.72) {\textbf{far path} --- all that survives};
\node[draw,thick,minimum width=3.6cm,minimum height=0.75cm] (f1) at (-0.6,6.05) {alignment shift $\gg$};
\node[draw,thick,minimum width=3.6cm,minimum height=0.75cm] (f2) at (-0.6,4.65) {$M_X+M_{Y_a}$};
\node[draw,thick,minimum width=3.6cm,minimum height=0.75cm] (f3) at (-0.6,3.35) {1-bit right shift};
\node[draw,thick,minimum width=3.6cm,minimum height=0.75cm] (f4) at (-0.6,1.0) {rounding adder};
\node[draw,minimum width=2.4cm,minimum height=0.75cm] (e1) at (-4.7,2.3) {exp.\ update};
\node[draw,minimum width=8.6cm,minimum height=0.85cm] (pk) at (-0.6,-0.4) {exception handling \& pack};
\draw[->] (-0.6,7.575) -- node[right,font=\tiny,pos=0.25]{$2(w_F{+}1)$: $M_X,M_Y$} (f1.north);
\draw[->] (-3.1,7.575) -- node[left,font=\tiny,pos=0.45]{$\lceil\log_2(w_F{+}2)\rceil$} (-3.1,6.05) -- (f1.west);
\draw[->] (-4.7,7.575) -- node[left,font=\tiny]{$w_E{+}1$} (e1.north);
\draw[->] (f1.south) -- node[right,font=\tiny]{$w_F{+}3$} (f2.north);
\draw[->] (f2.south) -- node[right,font=\tiny]{$w_F{+}4$} (f3.north);
\draw[->] (f3.south) -- node[right,font=\tiny]{$w_F{+}1$} (f4.north);
\draw[->] (e1.south) -- (-4.7,1.0) -- node[above,font=\tiny]{$w_E{+}2$} (f4.west);
\draw[->] (f4.south) -- node[right,font=\tiny]{$w_E{+}2{+}w_F$} (pk.north);
\draw[->] (pk.south) -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} ++(0,-0.75) node[below,font=\small]{$R$};
% ---------------- close path: deleted ----------------
\node[font=\tiny,anchor=west,text=gray,align=left] at (5.05,7.05)
  {\textbf{close path} --- unreachable\\ when all terms share a sign};
\node[draw,dashed,gray,minimum width=3.4cm,minimum height=0.75cm] (c1) at (4.5,6.05) {\color{gray}$\gg$ 0 or 1 bit};
\node[draw,dashed,gray,minimum width=3.4cm,minimum height=0.75cm] (c2) at (4.5,4.65) {\color{gray}$|M_X-M_{Y_a}|$};
\node[draw,dashed,gray,minimum width=3.4cm,minimum height=1.0cm,align=center] (c3) at (4.5,3.25) {\color{gray}LZC $+$ $(w_F{+}1)$-bit\\left normalizer};
\node[draw,dashed,gray,minimum width=2.6cm,minimum height=0.7cm] (mx) at (4.5,1.6) {\color{gray}near/far mux};
\foreach \n in {c1,c2,c3,mx}{
  \draw[gray,dashed] (\n.north west) -- (\n.south east);
  \draw[gray,dashed] (\n.south west) -- (\n.north east);}
\draw[gray,dashed,->] (4.5,7.575) -- (c1.north);
\draw[gray,dashed,->] (c1.south) -- (c2.north);
\draw[gray,dashed,->] (c2.south) -- (c3.north);
\draw[gray,dashed,->] (c3.south) -- (mx.north);
\draw[gray,dashed,->] (mx.west) -- node[above,font=\tiny,text=gray]{$w_F{+}1$} (f4.east);
\draw[gray,dashed,<-] (e1.east) -- node[below,font=\tiny,text=gray,pos=1.0]{$\lambda$} ++(1.1,0);
\draw[gray,dashed] (-2.85,2.45) -- (-3.15,2.15);
\draw[gray,dashed] (-2.85,2.15) -- (-3.15,2.45);
\node[font=\tiny,align=left,anchor=north west] at (6.6,4.4)
  {\textbf{deleted} (no accuracy cost ---\\ the case cannot occur):\\[2pt]
   $\bullet$ LZC, $\lceil\log_2(w_F{+}1)\rceil$ levels\\
   $\bullet$ $(w_F{+}1)$-bit left normalizer\\
   $\bullet$ path-select multiplexer\\
   $\bullet$ close-path exponent\\ \phantom{$\bullet$} decrement $-\lambda$\\
   $\bullet$ second significand adder\\[3pt]
   $\approx 1/3$ of a generic FP adder\\ {}[Som+20], p.\,468.};
\end{circuitikz}
\end{document}
```

*after Fig. 11.6, p. 341*

**Split the sum by how far the result can drift from the operands.** Order the operands so that $E_X\ge E_Y$, write $d=E_X-E_Y\ge 0$ for the exponent difference, and let $m_X,m_Y\in[1,2)$ be the significands of the two $(1+w_E+w_F)$-bit inputs ([[Number Formats]]). Aligning $Y$ to $X$'s exponent scales its significand by $2^{-d}$, so the pre-normalization result is $S=m_X\pm 2^{-d}m_Y$ and there are exactly three regimes:

| case | range of $S$ | normalization required |
| --- | --- | --- |
| effective addition, any $d$ | $S\in[1,4)$ | at most a **1-bit right** shift |
| effective subtraction, $d\ge 2$ | $S>1-2^{-2}\cdot 2=\tfrac12$ | at most a **1-bit left** shift (*far path*) |
| effective subtraction, $d\in\{0,1\}$ | $S$ can be as small as $2^{-w_F}$ | up to $w_F+1$ bits of **left** shift (*close path*) |

The first two rows follow from the interval arithmetic alone: $m_X\in[1,2)$ and $2^{-d}m_Y\in(0,2)$ give $S<4$ for addition, and for subtraction with $d\ge 2$ the subtrahend is at most $2^{-2}\cdot 2=\tfrac12$, so at least half of the leading $1$ survives. Only the third row escapes this bound, because $d\le 1$ lets the two significands be arbitrarily close and cancellation is then unbounded.

**Read that table as a statement about shift direction, not about magnitude.** A right shift by at most one bit is a multiplexer. A left shift by an amount that is *unknown until the operands are subtracted* is a leading-zero count feeding a full barrel shifter — the LZC of [[Leading Zero Counters]] followed by the $(w_F{+}1)$-bit left normalizer of [[Normalizers]] and [[Shifters]]. That is why the general operator is built as two paths at all: the third row's hardware is useless to the first two rows, and the first two rows' large alignment shifter is useless to the third. The book's Fig. 11.6 labels the third-row path *near path*; the literature more often calls it the *close path*. They are the same path.

**Delete the row the application cannot reach.** If every term entering the adder carries the same sign — probabilities being summed, or probabilities multiplied in the log domain, which is the book's own example (p. 468) — then the effective operation is always addition and rows two and three never fire. The specialization is not an approximation and not a guard: it is the observation that a case whose *precondition* is excluded needs no silicon. What survives is the first row, which is precisely the far path: alignment shift $\to$ adder $\to$ 1-bit right shift $\to$ round.

**Count what actually leaves the netlist.** Removing the close path removes the LZC ($\lceil\log_2(w_F{+}1)\rceil$ levels of comparison), the $(w_F{+}1)$-bit left normalizer, the second significand adder that computed $|M_X-M_{Y_a}|$, the close-path exponent decrement by the leading-zero count $\lambda$, and — because there is now nothing to select between — the path-select multiplexer that a dual-path adder pays for unconditionally. The book measures the total at **about $1/3$ of the hardware of a generic floating-point adder** [Som+20], p. 468.

> [!important] This deletes the critical path; it does not shrink it
> Most specializations trade accuracy for area: the faithful constant multiplier gives up correct rounding, the truncated multiplier gives up low-order columns. This one gives up nothing. The deleted case is *unreachable*, not approximated, so the error bound is still the $0.5$ ulp of round-to-nearest ([[Error Accuracy]]) that a fully general adder achieves. Free specializations are rare — recognize one when the precondition removes a case rather than weakening a bound.

**Keep the right shifter; it belongs to the surviving path.** The alignment shift is a right shift by $d$, controlled by $\lceil\log_2(w_F{+}2)\rceil$ bits, and it is the *only* shifter left. It also drags along the sticky logic: the book remarks (p. 342) that no sticky computation is needed on the near path, precisely because a near-path subtraction shifts by at most one bit and loses nothing. The far path shifts operand bits off the bottom, so the path that survives here is exactly the path that must compute a sticky bit. Specializing away the close path therefore does not simplify rounding by one gate.

**Widths, end to end.** Both significands enter as $w_F+1$ bits with the implicit leading one restored; the aligned operand is carried at $w_F+3$ bits so that a guard bit and a sticky bit sit below the ulp; the significand adder produces $w_F+4$ bits, whose top bit is the carry that drives the 1-bit right shift; after that shift the significand is back to $w_F+1$ bits and enters the rounding adder together with the exponent, carried at $w_E+1$ bits so that the increment from the right shift and a second increment from a rounding overflow $1.11\ldots1\to10.0$ cannot wrap. The diagram carries $w_E+2$ because the general operator also propagates over/underflow information into the pack stage, which a same-sign adder still needs.

**On FPGA the deleted blocks are the expensive kind.** The surviving significand adder maps onto the hard carry chain, one LUT per bit and near-zero routing ([[FPGAs]]); the LZC and the left barrel shifter map onto neither — they become $\log_2(w_F)$ stages of LUT multiplexers plus the routing between them, which is where FPGA area and delay actually go. So the qualitative direction of the saving is more favourable on FPGA than the raw block count suggests, while on an ASIC the removed path also removes a full significand adder's worth of standard cells.

> [!warning] The $\approx 1/3$ figure is quoted, not broken down
> The book cites [Som+20] for the saving without giving a technology, a format, or a split between area and delay, and the FPGA-versus-ASIC comparison above is architectural reasoning rather than a measured number. Treat $1/3$ as an order-of-magnitude expectation for a $(w_E,w_F)$ of practical size, not as a portable constant.

$$\boxed{\ \operatorname{sgn}X=\operatorname{sgn}Y\ \Longrightarrow\ S=m_X+2^{-d}m_Y\in[1,4)\ \Longrightarrow\ \text{normalization}\in\{\gg 0,\ \gg 1\}\ }$$

**When it breaks.**

- **One negative term destroys the guarantee, silently.** The operator does not detect mixed signs; it computes a sum of magnitudes. If the sign guarantee is only statistical, or is established by an upstream property that a later code change can break, the result is wrong with no exception raised. This operator must never be exposed as a drop-in IEEE adder.
- **Subnormal inputs** carry no implicit leading one, so the significand path's $[1,2)$ assumption fails; subnormal support has to be added back exactly as for a generic adder.
- **Accumulation, not addition.** A long same-sign sum grows monotonically, so overflow to $+\infty$ is the live failure mode rather than cancellation; that is an exponent-range question, not a path question.
- **The moment both $X+Y$ and $X-Y$ are wanted** — the FFT butterfly — the close path returns for the difference, and the right structure is the shared 3-path adder rather than this one.
- **The saving does not scale with $w_F$ in the same way as the rest of the operator**: the LZC is only $\lceil\log_2(w_F{+}1)\rceil$ deep, so at very small $w_F$ the deleted blocks are a smaller fraction than $1/3$ and the fixed cost of unpacking and rounding dominates.

**RTL (Spade).**

```spade
// Positive-term floating-point adder, binary16 (wE = 5, wF = 10).
// Both operands assumed >= 0 and normalized. Far path only: no LZC,
// no left normalizer, no path mux.
entity fpadd_pos(x: uint<16>, y: uint<16>) -> uint<16> {
    let ex: uint<5>  = x.as_bits()[10..15].as_uint();
    let fx: uint<10> = x.as_bits()[0..10].as_uint();
    let ey: uint<5>  = y.as_bits()[10..15].as_uint();
    let fy: uint<10> = y.as_bits()[0..10].as_uint();

    // swap so the big operand is first: d = eb - es >= 0
    let (eb, fb, es, fs) = if ex >= ey { (ex, fx, ey, fy) } else { (ey, fy, ex, fx) };
    let d: uint<6> = eb - es;

    let one: uint<1> = 1;
    let pad: uint<2> = 0;
    let mbe: uint<13> = one.concat(fb).concat(pad);   // (wF+1)+2 bits
    let mse: uint<13> = one.concat(fs).concat(pad);

    // alignment shift, saturated at wF+3 = 13: beyond that everything is sticky
    let dc: uint<13> = if d > 13 { 13 } else { zext(d) };
    let msa: uint<13> = mse >> dc;
    let sticky0: bool = (msa << dc) != mse;

    let sum: uint<14> = mbe + msa;                    // in [2^12, 2^14)
    let sb = sum.as_bits();
    let carry: bool = sb[13];

    // the entire normalization: one bit, right, never left
    let n: uint<13> = if carry { sb[1..14].as_uint() } else { sb[0..13].as_uint() };
    let s1: bool    = if carry { sticky0 || sb[0] } else { sticky0 };
    let ebw: uint<6> = zext(eb);
    let e1: uint<6> = if carry { trunc(ebw + 1) } else { ebw };

    let nb = n.as_bits();
    let inc: bool = nb[1] && (s1 || nb[0] || nb[2]);  // round to nearest, ties to even
    let incu: uint<11> = if inc { 1 } else { 0 };
    let sigr: uint<12> = nb[2..13].as_uint() + incu;

    let ovf: bool = sigr.as_bits()[11];               // 1.111..1 rounded up to 10.0
    let e2: uint<6> = if ovf { trunc(e1 + 1) } else { e1 };
    let frac: uint<10> = if ovf { 0 } else { trunc(sigr) };

    let sign: uint<1> = 0;
    let e5: uint<5> = trunc(e2);
    sign.concat(e5).concat(frac)
}
```

`msa` is the *alignment shift* box and `sum` is the $M_X+M_{Y_a}$ adder; the single `if carry` mux on line `n` is the entire *1-bit right shift* box, and there is no left shift anywhere in the entity — that absence is the note. Widths track the diagram exactly for $w_F=10$: 13 bits $=w_F+3$ into the adder, 14 bits $=w_F+4$ out of it, 11 bits $=w_F+1$ into the rounding adder, and a 6-bit $=w_E+1$ exponent that absorbs both increments. The block is purely combinational; a real operator pipelines it after the alignment shift and after the adder. Synthesis will build one thing differently from the drawing: `sticky0` is written as a re-shift and compare, which would infer a *second* barrel shifter — hardware computes it from an OR-tree over the mask of shifted-out positions, folded into the same shifter's stages.

**Related Notes**

- [[Dual-Path Floating-Point Adder]] – compares: the general operator this specializes, which pays for both paths and the mux between them because either case can occur.
- [[Floating-Point Adder]] – depends-on: unpacking, exponent difference and swap, alignment, rounding and packing are inherited from it unchanged.
- [[Leading Zero Counters]] – counter-example: the block whose absence defines this adder; a same-sign sum has no leading zeros to count.
- [[Normalizers]] – counter-example: the right-shift normalization survives as a 1-bit mux while the left normalizer disappears entirely.
- [[Fused Sum of Squares]] – extends: the same argument, with positivity supplied by squaring rather than by the application.
- [[Fused Add-Subtract Unit]] – compares: needing both sum and difference brings the close path straight back.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where a free specialization sits against the ones that cost accuracy.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §15.4 "Floating-Point Addition of Positive Terms", p. 468 — the same-sign precondition, the log-domain motivation, and the $\approx 1/3$ saving attributed to [Som+20].
  - §11.1.2 and Fig. 11.6 "Overview of a dual-path floating-point adder", p. 341, with the near/far discussion and the "no sticky computation on the near path" remark, p. 342.
  - Fig. 11.5, p. 337 — the baseline single-path adder whose LZC+shifter blocks §15.4 removes.
  - §10.3 — normalizers and the leading-zero-count output used for the exponent update.
  - §15.5, p. 469 — the combined sum-and-difference 3-path architecture; §15.6, pp. 469–470 — fused sum of squares [DKP09; MS13].
