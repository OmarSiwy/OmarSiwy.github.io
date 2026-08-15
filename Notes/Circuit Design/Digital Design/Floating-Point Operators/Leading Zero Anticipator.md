---
title: Leading Zero Anticipator
description: "Predicts the leading zero count from the two operands in parallel with the subtraction rather than measuring it on the result, moving the LZC off the near path's critical path for the cost of a one-bit correction mux."
kind: circuit
source: "ASA §11.1.4, pp. 340-342"
status: seed
spade: simulated
tags: [digital, floating-point-operators, lza, normalization, adder]
aliases:
  - LZA
  - Leading Zero Anticipation
  - Leading-Zero Anticipation
  - Leading Zero Anticipators
  - Leading Zero Predictor
---

# Leading Zero Anticipator

A leading zero anticipator computes the normalization shift distance of $|M_X - M_{Y'_\mathrm{a}}|$ from the *operands*, concurrently with the subtraction that produces it, at the price of a prediction that can be one bit short.

```tikz title="Leading zero anticipator on the near path: pre-encoder and LZC run beside the subtractor, and a one-bit mux corrects the shift"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  blk/.style={draw,minimum height=0.62cm,inner sep=3pt,align=center},
  lbl/.style={font=\scriptsize}]

% ---------------- inputs ----------------
\node[anchor=south] at (-2.8,0.62) {$M_X$};
\node[anchor=south] at (-1.2,0.62) {$M_{Y'_\mathrm{a}}$};
\draw (-2.8,0.58) -- (-2.8,0.30);
\draw (-1.2,0.58) -- (-1.2,0.30);
\draw[-latex] (-2.8,0.30) -- (-3.5,0.30) -- (-3.5,-0.29);
\draw[-latex] (-1.2,0.30) -- (-2.1,0.30) -- (-2.1,-0.29);
\draw[-latex] (-2.8,0.30) -- ( 2.9,0.30) -- ( 2.9,-0.29);
\draw[-latex] (-1.2,0.30) -- ( 3.9,0.30) -- ( 3.9,-0.29);
\node[lbl,anchor=south] at (1.6,0.34) {$2\times(w_F{+}1)$};

% ---------------- the two chains, run in parallel ----------------
\node[blk,minimum width=3.0cm] (sub) at (-2.8,-0.6) {compound subtractor};
\node[blk,minimum width=3.6cm] (pre) at ( 3.4,-0.6)
  {pre-encoder, $w_F{+}1$ slices\\[-2pt] $f_i=t_i\wedge\overline{s_{i-1}}$};
\node[blk,minimum width=2.0cm] (lzc) at ( 3.4,-2.0) {LZC};
\draw[-latex] (pre.south) -- node[right,lbl]{$F$, $w_F{+}1$} (lzc.north);
\draw[-latex] (sub.south) -- node[left,lbl]{$|D|$, $w_F{+}1$} (-2.8,-2.99);

\draw[dashed] (0.35,-2.55) -- (0.35,0.15);
\node[lbl,anchor=west,rotate=90] at (0.35,-2.5) {run in parallel};

% ---------------- normalizer + correction ----------------
\node[blk,minimum width=5.6cm] (norm) at (-0.6,-3.3) {normalizer: left shift by $\lambda_p$};
\draw (3.4,-2.31) -- (3.4,-3.3);
\draw[-latex] (3.4,-3.3) -- (2.42,-3.3);
\node[lbl,anchor=south] at (2.95,-3.26) {$\lambda_p$};
\node[lbl,anchor=west] at (3.5,-2.75) {$\lceil\log_2(w_F{+}2)\rceil$};

\node[blk,minimum width=4.2cm] (mux) at (-0.6,-4.5) {correction: $\ll 0$ or $\ll 1$};
\draw[-latex] (-0.6,-3.61) -- node[right,lbl]{$N_p$, $w_F{+}1$} (-0.6,-4.19);
\draw (-0.6,-3.90) -- (-4.5,-3.90) -- (-4.5,-4.5);
\draw[-latex] (-4.5,-4.5) -- (-2.72,-4.5);
\node[lbl,anchor=east] at (-4.62,-4.2) {$c=\overline{N_p[w_F]}$};
\draw[-latex] (-0.6,-4.81) -- node[right,lbl]{$w_F{+}1$} (-0.6,-5.35)
  node[below,font=\small]{$N$};

% ---------------- exponent ----------------
\node[blk,minimum width=2.6cm] (exp) at (6.5,-4.5) {$E_X-\lambda_p-c$};
\draw[-latex] (3.4,-2.6) -- (6.5,-2.6) -- (6.5,-4.19);
\draw[-latex] (1.5,-4.5) -- node[above,lbl]{$c$} (5.2,-4.5);
\draw[-latex] (6.5,-4.81) -- (6.5,-5.35) node[below,font=\small]{$E_R$};

% ---------------- one pre-encoder slice ----------------
\node[lbl,anchor=west] at (-6.6,-6.05) {one slice of the pre-encoder:};
\node[xor port,scale=0.5] (x1) at (-3.1,-6.75) {};
\node[and port,scale=0.5] (a1) at (-3.1,-7.65) {};
\node[and port,scale=0.5] (a2) at (-1.1,-7.10) {};
\node[ocirc,scale=0.6] (o1) at (-2.55,-7.65) {};
\draw (-3.8,-6.63) -- (x1.in 1); \node[lbl,anchor=east] at (-3.83,-6.63) {$a_i$};
\draw (-3.8,-6.87) -- (x1.in 2); \node[lbl,anchor=east] at (-3.83,-6.87) {$b_i$};
\draw (-3.8,-7.53) -- (a1.in 1); \node[lbl,anchor=east] at (-3.83,-7.53) {$\overline{a_{i-1}}$};
\draw (-3.8,-7.77) -- (a1.in 2); \node[lbl,anchor=east] at (-3.83,-7.77) {$b_{i-1}$};
\draw (a1.out) -- (o1.west);
\draw (x1.out) -- (-2.1,-6.75) -- (-2.1,-6.98) -- (a2.in 1);
\draw (o1.east) -- (-2.1,-7.65) -- (-2.1,-7.22) -- (a2.in 2);
\draw[-latex] (a2.out) -- (-0.4,-7.10) node[lbl,anchor=west] {$f_i$};
\node[lbl,anchor=south] at (-2.45,-6.72) {$t_i$};
\node[lbl,anchor=north] at (-2.35,-7.72) {$\overline{s_{i-1}}$};
\node[lbl,anchor=west,align=left] at (0.2,-7.10)
  {two gate levels, independent of $w_F$ --- this is the entire\\
   cost of taking the LZC off the subtraction's critical path.};

\end{circuitikz}
\end{document}
```

**Start from the timing debt, because it is what the block is paid to remove.** On the near path of a [[Dual-Path Floating-Point Adder]] the chain is a $1$-bit alignment mux, a compound subtractor on $w_F+1$ bits, a leading zero counter, and a normalization shifter. Without subnormal support the LZC and the shifter fuse into one $\log_2 w_F$-deep pass, which is what [[Leading Zero Counters]] pays its quadratic depth for; with subnormals they cannot, because the count must be compared against $E_X$ and saturated between the two, and the near path then carries **three** $\log_2 w_F$ operations against the far path's two and owns the critical path outright (p. 342). Only one of the three is removable: the subtraction feeds the shifter's data and the count feeds its control, so the count is the one that can be produced from somewhere else.

**Read the difference as a borrow-free signed-digit string.** Write the two $(w_F+1)$-bit significands as $A=\sum_i a_i2^i$ and $B=\sum_i b_i2^i$ with $A \ge B$, and set $d_i = a_i - b_i \in \{-1,0,+1\}$. Distributing the subtraction over the positional sum,

$$D \;=\; A - B \;=\; \sum_{i=0}^{w_F} d_i\,2^{\,i}$$

which is exact and, crucially, **local**: every digit $d_i$ depends on column $i$ alone, so the whole string is available one gate after the operands, with no carry propagation ([[Number Formats]] for the redundant-digit reading of this).

**Bound the uncertainty before designing any logic for it.** Let $k$ be the highest index with $d_k \ne 0$; since $D \ge 0$ its leading nonzero digit is $+1$. Let $m < k$ be the highest index below $k$ with $d_m \ne -1$, so that $d_{k-1}=\dots=d_{m+1}=-1$ is a maximal run. Splitting the sum at $m$ and applying the geometric identity $\sum_{i=m+1}^{k-1}2^i = 2^k - 2^{m+1}$,

$$D \;=\; 2^k \;-\; \big(2^k - 2^{m+1}\big) \;+\!\!\sum_{i\le m} d_i2^i \;=\; 2^{\,m+1} + \sum_{i\le m} d_i2^{\,i},\qquad \Big|\sum_{i\le m} d_i2^i\Big| \le 2^{\,m+1}-1$$

by the triangle inequality on digits bounded by $1$. Hence $1 \le D \le 2^{\,m+2}-1$: **the leading one of $D$ sits at position $m+1$ or at $m$, never anywhere else.** That single inequality is the whole theory of the anticipator — the position $m+1$ is a function of the operands, and it is right to within one bit.

**Turn "where the borrow run breaks" into two gates per bit.** Position $m+1$ is characterised by two local conditions: $d_{m+1} \ne 0$, and $d_m \ne -1$. Writing $t_i = a_i \oplus b_i$ for "the digit is nonzero" and $s_i = \overline{a_i}\wedge b_i$ for "the digit is $-1$", that reads

$$f_i \;=\; t_i \wedge \overline{s_{i-1}}, \qquad s_{-1} := 0$$

and $F$ has its leading one exactly at $m+1$. Above $k$ every $d_i=0$ so $t_i=0$; at $i=k$ (when $k>m+1$) the digit below is $-1$ so $\overline{s_{k-1}}=0$; strictly between, each $d_i=-1$ sits above another $-1$ and is likewise suppressed. Only at $m+1$ do both conjuncts hold. Lower bits of $F$ may be anything — a leading-bit search ignores them. Applying De Morgan to $\overline{s_{i-1}}$ gives the implementable form $\overline{a_{i-1}}\wedge b_{i-1}$ inverted, i.e. the AND-inverted-output drawn in the slice above: **two gate levels, one slice per bit, and no dependence on $w_F$ at all.**

**Lift the slice to a word-level expression, which is what the RTL and the FPGA both want.** With $T = A \oplus B$ and $S = \overline{A} \wedge B$ on $w_F+1$ bits, the shift-by-one that turns $s_{i-1}$ into a column-$i$ signal is a wiring change, so

$$F \;=\; T \wedge \overline{(S \ll 1)}$$

with a zero shifted into bit $0$, which is precisely the $s_{-1}=0$ convention. Each $f_i$ is a function of four inputs $a_i,b_i,a_{i-1},b_{i-1}$, so on FPGA the whole pre-encoder is **one LUT per bit** — $w_F+1$ LUTs, a single logic level, and no carry chain. On ASIC it is $3(w_F+1)$ two-input gates of depth $2$. Either way the pre-encoder is invisible next to the LZC that follows it, which is why the LZA is quoted as "an LZC plus a row of gates" and why the near path's arithmetic depth drops from three logarithmic stages to two.

**Feed the same LZC, and correct on the low side only.** $F$ goes into an ordinary leading zero counter — [[Leading Zero Counters]] unchanged, saturating at $w_F+1$ so that $A=B$ (which gives $F=0$) reports total cancellation. Its output $\lambda_p = w_F - (m+1)$ satisfies $\lambda_p \le \lambda \le \lambda_p + 1$ where $\lambda$ is the true leading zero count of $|D|$, so the [[Normalizers|normalizer]] shift is either right or one bit short — never too long.

> [!note] The error is one-directional, and that is what makes the fix a multiplexer
> Because $F$'s leading one can only be *at or above* the true leading one of $D$, the shifted significand $N_p$ is either already normalized or exactly half of what it should be. Inspecting its MSB and conditionally shifting one more bit is a $2{:}1$ mux and a decrement on the exponent, $E_R = E_X - \lambda_p - c$ with $c = \overline{N_p[w_F]}$. A two-sided error would have required a second variable shifter and would have destroyed the entire saving.

**Nothing is given up in accuracy.** The correction is exact, so the operator's error is still that of the rounding adder alone — the anticipator is a *timing* approximation, not a numerical one, and none of the faithful-rounding bookkeeping of [[Error Accuracy]] applies to it. The near path also computes no sticky bit (p. 342), so there is no lost information for the mux to disturb.

**Resolve the operand order, which the derivation quietly assumed.** Everything above needs $A \ge B$. On the near path the exponent difference is $d \in \{0,1\}$, and the two cases are not alike. For $d=1$, $M_X \in [1,2)$ while $M_{Y'_\mathrm{a}} = M_Y/2 \in [\tfrac12,1)$, so $M_X > M_{Y'_\mathrm{a}}$ **always** and the ordering is known before any logic runs. Only $d=0$ is ambiguous, and there the standard answer is to instantiate the pre-encoder and its LZC twice, once per ordering, and select between the two $\lceil\log_2(w_F+2)\rceil$-bit counts with the subtractor's sign — a one-gate mux on a narrow bus, arriving exactly when the subtraction does, hence off the critical path. The duplicated LZC, not the pre-encoder, is the real area cost of anticipation.

> [!warning] The textbook gives one paragraph, no equations
> ASA p. 342 states only that leading zero anticipation replaces the LZC with a component taking $M_X$ and $M_{Y_\mathrm{a}}$, running in parallel with the subtraction, wrong by at most one bit and corrected by a final multiplexer, and refers the reader to the survey [SN01] and to [Lut17]. The digit-string derivation, the encoding $f_i = t_i \wedge \overline{s_{i-1}}$, the one-directional error bound and the operand-order discussion above are the canonical [SN01] construction re-derived here; the book supplies none of them. It also gives **no area or delay figures** for an LZA — the gate and LUT counts quoted above are structural counts of the encoding, not measurements.

$$\boxed{\;f_i = (a_i\oplus b_i)\wedge\overline{(\overline{a_{i-1}}\wedge b_{i-1})},\qquad \lambda_p = \mathrm{LZC}(F),\qquad \lambda_p \le \lambda \le \lambda_p + 1\;}$$

## When it breaks

- **$A < B$ silently under-predicts.** Running the encoding on the wrong ordering produces a $\lambda_p$ that is one bit *too large*, so the correction mux shifts the wrong way and the result is denormalized by a factor of two. The ordering guarantee is a precondition, not a hint.
- **It buys nothing on the far path.** There the normalization is at most $2$ bits and the LZC is already trivial; anticipation only pays where the shift is full-width, i.e. under cancellation with $d\in\{0,1\}$.
- **It fights the fused normalizer.** [[Leading Zero Counters]] is cheapest when its levels merge into the shifter, and that fusion consumes the count MSB-first as it is produced. An LZA hands the shifter a finished count, so the two optimizations are alternatives: anticipate when subnormal support has already broken the fusion, fuse when it has not.
- **Small $w_F$.** With $w_F = 10$ (binary16) the LZC is three or four levels deep; duplicating it plus a correction mux can cost more delay than it removes. The technique is aimed at binary64 and wider.
- **The saturating case is not free.** $F = 0$ must map to "result is zero", and the LZC's saturation value has to survive the exponent subtraction — the same comparison-and-mux that subnormal support forced onto the near path in the first place ([[Subnormal Normalization Unit]]).

## RTL (Spade)

```spade
/// LZA pre-encoding for A - B on N bits, valid when A >= B.
/// f_i = (a_i ^ b_i) & ~(~a_{i-1} & b_{i-1}); bit 0 sees a shifted-in zero.
fn lza_pre<#uint N>(a: uint<N>, b: uint<N>) -> uint<N> {
    (a ^ b) & ~((~a & b) << 1)
}

/// The anticipator: pre-encoder, then the ordinary naive LZC of the sibling note.
entity lza15(a: uint<15>, b: uint<15>) -> uint<4> {
    lzc15(lza_pre::<15>(a, b).as_bits())
}
```

`a` and `b` are $M_X$ and $M_{Y'_\mathrm{a}}$ at the top of the diagram, and the single expression in `lza_pre` is the whole row of slices: `a ^ b` is the $t_i$ XOR, `~a & b` is $s_i$, `<< 1` is the one-position wire offset that presents $s_{i-1}$ to column $i$ (shifting a zero into bit 0, which *is* the $s_{-1}=0$ convention rather than a boundary special case), and the outer `~ ... &` is the AND-with-inverted-input gate. Widths do not grow anywhere: `^`, `&`, `~` and `<<` are all $N \to N$ in Spade, unlike `+`, so no truncation appears. Everything is combinational — no `reg`, no clock port — and `lzc15` is instantiated verbatim from [[Leading Zero Counters]], which is the point: the anticipator adds a row of gates in front of an unchanged counter. Synthesis will not build the drawn XOR–AND pairs; on FPGA each $f_i$ collapses into one 4-input LUT, and the `<< 1` disappears into routing.

Simulated against a behavioural leading-zero reference over **8008 vectors**, checking the predicate $\lambda_p \le \lambda \le \lambda_p+1$ rather than equality: eight named cases including the asymmetric $2^{14} - 1$ and $1 - 0$, maximal cancellation $2^{14}-(2^{14}-1)$ predicting exactly, the one-too-high case $2^{14}-3$, and $A=B$ saturating to $15$; then a 5000-vector random sweep with the operands sorted, then a 3000-vector sweep of near-cancellation pairs $B = A - r$, $r < 8$, which is where the encoding is stressed. Result: 5567 exact, 2441 off by one, **zero violations** of the bound.

## Related Notes

- [[Leading Zero Counters]] – depends-on: the anticipator is a pre-encoder bolted to an unmodified LZC, and inherits its saturation semantics and its width $\lceil\log_2(w_F+2)\rceil$.
- [[Dual-Path Floating-Point Adder]] – supports: the only architecture that needs this, and only on its near path once subnormal support has unbalanced the two.
- [[Normalizers]] – depends-on: consumes $\lambda_p$; the one-bit correction is a second, trivial normalizer stacked on it.
- [[Speculative Floating-Point Adder]] – extends: pushes the same "compute before you know" idea from the shift distance to the differences and the rounding additions themselves.
- [[Subnormal Normalization Unit]] – compares: the block whose insertion between counter and shifter breaks the fused normalizer and thereby creates the problem anticipation solves.
- [[Floating-Point Adder]] – compares: the baseline where the LZC sits serially between the significand adder and the normalizer, with nothing to anticipate from.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 11 "Basic Floating-Point Operators":

- §11.1.4 Dual-path architectures and other speculative techniques, pp. 340–342 — the near/far exclusivity argument, Fig. 11.6 p. 341, the three-versus-two logarithmic-stage imbalance under subnormal support, and the one-paragraph description of leading zero anticipation.
- §11.1.3, p. 340 — why subnormal support forbids the combined leading zero counter and shifter.
- [SN01] Schmookler & Nowka, "Leading Zero Anticipation and Detection", *ARITH* 2001, and [Lut17] Lutz, "Optimized Leading Zero Anticipators", *Asilomar* 2017 — cited p. 342 as the reference survey and its recent improvements; the encoding derived above is the classical one they survey.
- Chapter 10 §10.2–10.2.1, pp. 316–320 — the leading zero counter reused unchanged downstream of the pre-encoder.
