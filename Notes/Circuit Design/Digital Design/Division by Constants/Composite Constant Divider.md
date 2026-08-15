---
title: Composite Constant Divider
description: "Divide by D = Da*Db as two chained dividers plus a multiply-add for R = Da*Rb + Ra; turns a table exponential in ra+rb into two tables exponential in ra and rb separately."
kind: circuit
source: "ASA §13.5, pp. 437-441"
status: seed
spade: simulated
tags: [digital, division-by-constants, division, table, fpga]
aliases:
  - Composite Division
  - Composite Divider
  - Factored Constant Divider
  - Composite Constant Division
---

# Composite Constant Divider

An exact Euclidean divider by a *factorable* constant $D=D_aD_b$, built as a divider by $D_a$ feeding a divider by $D_b$ plus a small multiply-add that reassembles the remainder — the one member of the [[Division by Constants]] family whose cost depends on the factors of $D$ rather than on its magnitude.

```tikz title="Composite divider: 16-bit division by 15 = 3 x 5, two chained LinArch dividers and a multiply-add"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  lut/.style={draw, thick, minimum width=9mm, minimum height=7mm},
  op/.style={draw, thick, minimum width=8mm, minimum height=7mm}]
  % stage A: divide by 3, k=4, r=2, m=4
  \foreach \i/\x in {3/0, 2/2.2, 1/4.4, 0/6.6} {
    \node[lut] (A\i) at (\x,0) {$/3$};
    \node (X\i) at (\x,1.5) {$X_\i$};
    \draw[->] (X\i) -- node[right] {$4$} (A\i.north);
  }
  \draw[->] (-1.7,0) node[left] {$R_4{=}0$} -- node[above] {$2$} (A3.west);
  \foreach \a/\b in {3/2, 2/1, 1/0} { \draw[->] (A\a.east) -- node[above] {$2$} (A\b.west); }
  \draw[->] (A0.east) -- node[above] {$R_a$} node[below] {$2$} (8.6,0);
  % stage B: divide by 5, k=3, r=3, m=5
  \foreach \i/\x in {4/0, 3/1.8, 2/3.6, 1/5.4, 0/7.2} {
    \node[lut] (B\i) at (\x,-2.4) {$/5$};
    \node (Q\i) at (\x,-3.9) {$Q_\i$};
    \draw[->] (B\i.south) -- node[right] {$3$} (Q\i);
  }
  \draw[->] (-1.7,-2.4) node[left] {$0$} -- node[above] {$3$} (B4.west);
  \foreach \a/\b in {4/3, 3/2, 2/1, 1/0} { \draw[->] (B\a.east) -- node[above] {$3$} (B\b.west); }
  % Qa re-chunked from radix 2^4 into radix 2^3
  \node[draw, thick, minimum width=88mm, minimum height=6mm, font=\scriptsize] (rc) at (3.6,-1.2)
    {$Q_a$, 15 bits: re-chunk radix $2^4\to$ radix $2^3$};
  \foreach \x in {0, 2.2, 4.4, 6.6} { \draw[->] (\x,-0.35) -- node[right] {$4$} (\x,-0.9); }
  \foreach \x in {0, 1.8, 3.6, 5.4, 7.2} { \draw[->] (\x,-1.5) -- node[right] {$3$} (\x,-2.05); }
  % remainder reconstruction  R = 3 Rb + Ra
  \node[op] (mul) at (9.7,-2.4) {$\times 3$};
  \node[op] (add) at (11.5,-2.4) {$+$};
  \draw[->] (B0.east) -- node[above] {$R_b$} node[below] {$3$} (mul.west);
  \draw[->] (mul.east) -- node[above] {$4$} (add.west);
  \draw[->] (8.6,0) -- (11.5,0) -- node[right] {$2$} (add.north);
  \draw[->] (add.east) -- node[above] {$4$} (13.0,-2.4) node[right] {$R$};
  \node[anchor=west,font=\scriptsize] at (-1.7,-4.7) {$X$: 16 bits \quad $Q=Q_b$: 15 bits (top 2 provably 0) \quad $R=3R_b+R_a$: 4 bits};
\end{circuitikz}
\end{document}
```

*after Fig. 13.4, p. 439.*

**Divide twice and collect the two remainders.** Write $D=D_aD_b$ with both factors integers $>1$. Divide the $w$-bit unsigned input $X$ (a $\mathrm{ufix}(w-1,0)$ — see [[Number Formats]]) by $D_a$, then divide the quotient that comes out by $D_b$:

$$X = D_aQ_a + R_a,\qquad 0\le R_a\le D_a-1 \tag{13.5}$$
$$Q_a = D_bQ_b + R_b,\qquad 0\le R_b\le D_b-1 \tag{13.6}$$

Substituting (13.6) into (13.5) and distributing $D_a$ over the sum,

$$X = D_a\bigl(D_bQ_b+R_b\bigr)+R_a = \underbrace{D_aD_b}_{D}\,Q_b \;+\; \underbrace{D_aR_b+R_a}_{R} \tag{13.7}$$

Widths: $X$ is $w$ bits, $Q_a$ is $w-\lfloor\log_2 D_a\rfloor$ bits, $R_a$ is $r_a=\lceil\log_2 D_a\rceil$ bits, $Q_b$ is $w-\lfloor\log_2 D\rfloor$ bits, $R_b$ is $r_b$ bits, and the reconstructed $R$ is $r_D=\lceil\log_2 D\rceil$ bits.

**The identity alone is not enough — the composed remainder has to be in range.** Equation (13.7) is an arbitrary decomposition of $X$ until you check $0\le R<D$; only then is $Q_b$ *the* quotient. Both digit bounds are tight, so take them at their maxima:

$$R = D_aR_b+R_a \;\le\; D_a(D_b-1)+(D_a-1) \;=\; D_aD_b-1 \;=\; D-1$$

The reading that makes this obvious rather than lucky: $(R_a,R_b)\mapsto D_aR_b+R_a$ is exactly **positional notation in the mixed radix $(D_a,D_b)$**, with $R_a$ the low digit and $R_b$ the high one. A mixed-radix pair of digits is a bijection onto $\{0,\dots,D_aD_b-1\}$, so the map is not merely bounded, it is onto — every remainder mod $D$ is produced by exactly one $(R_a,R_b)$. Accuracy is 0 ulp on both outputs; there is no error budget in play here at all ([[Error Accuracy]]).

**Recursion is free, because the same statement applies to each factor.** If $D_a$ or $D_b$ factors further, apply (13.5)–(13.7) to it. $45=5\times3\times3$ becomes three chained dividers and two nested multiply-adds, with $R$ assembled as a three-digit mixed-radix number. Nothing in the argument above cared that $D_a$ was atomic.

**Why splitting pays: the divisor's bit-width sits in a denominator.** On an FPGA whose basic cell is a LUT$\alpha$, a table-based divider by $D$ costs $A(D,w)\approx\lceil w/(\alpha-r_D)\rceil\,\alpha$ LUT$\alpha$ (derived in [[LinArch Divider]]; the radix is $k=\alpha-r_D$, the largest chunk whose table still fits one LUT layer). The second sub-divider sees $Q_a$, which is only $\lfloor\log_2 D_a\rfloor$ bits shorter than $X$, so setting $w'\approx w$ and dividing out the common $w\alpha$, the composite wins exactly when

$$\frac{1}{\alpha-r_{a}}+\frac{1}{\alpha-r_{b}} \;<\; \frac{1}{\alpha-r_{D}}$$

Read the two sides asymmetrically. Since $r_D\approx r_a+r_b$, the right-hand denominator shrinks toward zero as $D$ grows and the monolithic cost **diverges** at $r_D=\alpha$; each factor's denominator stays comfortably positive. That is the whole trick: a table whose size is exponential in $r_a+r_b$ is replaced by two tables exponential in $r_a$ and in $r_b$ separately — **a product of table sizes becomes a sum.** Check it on $D=9=3\times3$, $\alpha=6$: $r_a=r_b=2$, $r_D=4$, and $\tfrac14+\tfrac14=\tfrac12$ against $\tfrac12$, a predicted dead heat of $48+48=96$ against $96$ LUT6. Measurement gives 65 against 87, because two small tables leave synthesis more don't-cares to absorb than one large one.

**The reconstruction is cheap twice over, and its cost does not grow with $w$.** $R=D_aR_b+R_a$ multiplies an $r_b$-bit operand by a compile-time constant, so it is a [[Multiplication by Constants]] problem, not a multiplier: for $D_a=3$ it is the [[Shift-and-Add]] form $x+(x\ll1)$, one $(r_b{+}1)$-bit ripple adder ([[Adders]]), and the final $+R_a$ is a second adder of $r_D$ bits. Both operands are *remainders*, so both are a handful of bits wide however large $w$ is — for $D=15$ the multiply-add is 3 bits by 3, producing 4. With three or more factors the several $\times D_i$ constants share subexpressions and become a [[Multiple Constant Multiplication]] instance.

> [!important] The two chains are skewed, not serialised
> The naive reading of the picture is that a composite divider's latency is the sum of the two chains, which would make it strictly worse than the atomic one. It is not, because both chains sweep **MSB digit first**: sub-divider B's leftmost stage only needs $Q_a$'s leading digit, which chain A has produced after one LUT. The two chains run one stage apart, so the depth is $\max(m_a,m_b)$ plus the one LUT that finishes the quotient — not $m_a+m_b$. For $D=9$, $w=32$: atomic LinArch is forced to $k=2$, hence $m=16$ LUTs deep, while each $/3$ sub-divider gets $k=4$ and $m=8$, giving $8+1$. Half the depth, and 17.9 ns collapses to 7.0 ns.

**Digit re-chunking is the one piece of glue the algebra hides.** $Q_a$ leaves chain A as $m_a$ digits of $k_a$ bits and enters chain B as $m_b$ digits of $k_b$ bits, and in general $k_a\ne k_b$ — for $15=3\times5$, $k_a=4$ and $k_b=3$. That regrouping is pure wiring, zero gates, but it does mean the digit boundaries of the two chains do not line up, so the one-stage skew above is an approximation and the true depth is set by which of B's stages waits longest on A. On an ASIC nothing changes structurally; only the $\alpha$-dependent choice of $k$ is FPGA-specific, and an ASIC picks $k$ by balancing table area against stage count instead.

**Factor order changes the result by a few per cent, in a direction no simple rule predicts.** The cost model above is symmetric in $r_a$ and $r_b$ to first order, so it ranks $D_a\times D_b$ and $D_b\times D_a$ equal; measurement does not. From Table 13.5 ($w=32$, Kintex-7, optimal $k$ throughout):

| $D$ | Decomposition | Predicted LUT | Measured LUT | Delay (ns) |
| --- | --- | --- | --- | --- |
| 9 | Atomic LinArch | 96 | 87 | 17.9 |
| 9 | $3\times3$ | $48{+}48=96$ | **65** | 7.0 |
| 15 | Atomic LinArch | 96 | 87 | 17.9 |
| 15 | $5\times3$ | $66{+}48=114$ | 80 | 9.6 |
| 15 | $3\times5$ | $68{+}46=114$ | **75** | 9.4 |
| 45 | Atomic LinArch | 448 | 371 | 24.3 |
| 45 | $9\times5$ | $96{+}60=156$ | 134 | 18.4 |
| 45 | $5\times9$ | $66{+}90=156$ | 134 | 18.3 |
| 45 | $5\times3\times3$ | $66{+}48{+}48=162$ | **108** | 10.0 |
| 45 | $3\times3\times5$ | $48{+}48{+}60=156$ | 113 | 9.8 |
| 45 | $15\times3$ | $96{+}48=144$ | 120 | 18.5 |
| 45 | $3\times15$ | $48{+}96=144$ | 125 | 17.6 |

Two things to read off. First, **splitting into more, smaller factors dominates splitting into fewer, larger ones**: $5\times3\times3$ beats $9\times5$ by 26 LUT and 8.4 ns, and both two-factor splits of 45 that keep a $\ge 9$ factor stay stuck near 18 ns because that factor's $r$ forces a small $k$ and a deep chain. Second, **within a fixed multiset of factors the ordering is worth 3–6% but has no consistent direction** — $3\times5$ beats $5\times3$, yet $15\times3$ beats $3\times15$ and $5\times3\times3$ beats $3\times3\times5$. The permutation space of a small $D$ has a handful of members; enumerate it rather than reasoning about it.

> [!warning] Not covered in the source — needs outside research
> The book tabulates orderings without offering a rule that predicts them, and Table 13.5's caption states outright that the predicted column **ignores the cost of the remainder reconstruction** while the measured column includes it. So there is no published cost model for the multiply-add, and no criterion for factor ordering beyond exhaustive synthesis.

> [!warning] Arithmetic slip in Table 13.5, p. 440
> The $3\times5$ row prints its prediction as $68{+}46=114$. Neither term is producible by $\lceil w'/(\alpha-r)\rceil\alpha$ with $\alpha=6$ — 46 is not a multiple of 6 — and the total coincides with the $5\times3$ row. The intended split is $48{+}66$, the same two terms transposed. The table above prints the corrected value; every other prediction in the table reproduces exactly.

$$\boxed{\ X = D_aD_b\,Q_b + \bigl(D_aR_b+R_a\bigr),\qquad 0\le D_aR_b+R_a\le D_aD_b-1\ }$$

**When it breaks.**

- $D$ prime, or $D=2^j\cdot p$ with $p$ prime and large: there is nothing to split, and [[Recip Constant Divider]] is the only option whose cost ignores $|D|$.
- Both factors still large ($r_a,r_b\ge\alpha$): each sub-table re-enters the exponential regime and the sum of two explosions is still an explosion. The technique needs factors below $2^\alpha$, i.e. below 64 on a 6-LUT fabric.
- Latency, against a tree. Composite $D=15$ is 9.4 ns; atomic [[Binary Tree Constant Divider]] is 5.8 ns at 199 LUT. Composite wins area by 2.7$\times$ and loses latency by 1.6$\times$ — a different corner of the trade-off, not a strict improvement ([[Choosing a Constant Divider]]).
- The predicted column ranks, it does not budget. Synthesis beats it by 10–30%, and for $D=15$ the model actually *prefers* the atomic divider (96 against 114) while measurement reverses the verdict (87 against 75). Never reject a split on the model alone.
- No width savings, only table savings: the second stage sees $w-\lfloor\log_2 D_a\rfloor$ bits, which for small $D_a$ is essentially $w$. Splitting shortens tables, not operands.
- Remainder-only builds do not compose as cleanly — dropping $Q_a$ is not an option, since chain B consumes it. Only the *final* stage may be trimmed to [[Remainder-Only LinArch]], and the reconstruction still needs $R_a$ from the full stage A.

**RTL (Spade).** $w=16$, $D=15=3\times5$ — the circuit in the diagram. `step3` and `step5` are the digit tables of [[Constant Division Digit Table]]; `comb_div`/`comb_mod` on a 6-bit operand is a 6-input, 6-output *truth table*, which synthesis tabulates, not a sequential divider.

```spade
use std::ops::comb_div;
use std::ops::comb_mod;

// one radix-2^4 digit divided by 3:  k+r = 6 bits in, k+r = 6 bits out
fn step3(r: uint<2>, x: uint<4>) -> (uint<4>, uint<2>) {
    let y = r.concat(x);
    (trunc(y `comb_div` 3), trunc(y `comb_mod` 3))
}

// one radix-2^3 digit divided by 5:  k+r = 6 bits in, 6 bits out
fn step5(r: uint<3>, x: uint<3>) -> (uint<3>, uint<3>) {
    let y = r.concat(x);
    (trunc(y `comb_div` 5), trunc(y `comb_mod` 5))
}

fn div3_16(x: uint<16>) -> (uint<16>, uint<2>) {
    let b = x.as_bits();
    let (q3, r3) = step3(0,  b[12..16].as_uint());
    let (q2, r2) = step3(r3, b[8..12].as_uint());
    let (q1, r1) = step3(r2, b[4..8].as_uint());
    let (q0, r0) = step3(r1, b[0..4].as_uint());
    (q3.concat(q2).concat(q1).concat(q0), r0)
}

fn div5_15(x: uint<15>) -> (uint<15>, uint<3>) {
    let b = x.as_bits();
    let (q4, r4) = step5(0,  b[12..15].as_uint());
    let (q3, r3) = step5(r4, b[9..12].as_uint());
    let (q2, r2) = step5(r3, b[6..9].as_uint());
    let (q1, r1) = step5(r2, b[3..6].as_uint());
    let (q0, r0) = step5(r1, b[0..3].as_uint());
    (q4.concat(q3).concat(q2).concat(q1).concat(q0), r0)
}

entity div15(x: uint<16>) -> (uint<15>, uint<4>) {
    let (qa, ra) = div3_16(x);
    let (qb, rb) = div5_15(trunc(qa));       // Qa's MSB is provably 0
    let v: uint<4> = zext(rb);
    let three_rb = v + (v << 1);             // x3 as shift-and-add, uint<5>
    (qb, trunc(three_rb + zext::<2, 5>(ra)))
}
```

`div3_16` is the top chain and `div5_15` the bottom one; `r0` of each is the wire labelled $R_a$ and $R_b$. The `concat` in each `stepN` is the diagram's "$+$" in $Y_i = X_i + 2^kR_{i+1}$ — disjoint bit positions, so it is wiring, not an adder. The whole design is combinational: `entity` is used only so a testbench can instantiate it. `trunc(qa)` drops $Q_a$'s bit 15, which is $\lfloor X_3/3\rfloor$'s bit 3 and hence always 0 since $X_3\le15$; `three_rb` widens to `uint<5>` because `+` grows by one bit, and the final `trunc` to `uint<4>` is safe because $R\le14$. Synthesis will do one thing the drawing does not: it will merge the $\times3$ and the $+R_a$ into a single 4-input-per-bit function and absorb both into the last row of LUTs, so the two boxes on the right are one LUT deep, not two.

Simulated exhaustively over all $2^{16}$ inputs plus 3000 random vectors against `x/15`, `x%15`; asymmetric cases 1, 14, 128, 200, 32768, 65535 included.

**Related Notes.**

- [[LinArch Divider]] – depends-on: each of the two boxes in the diagram *is* a LinArch chain; the cost model $\lceil w/(\alpha-r)\rceil\alpha$ that the splitting condition compares against is derived there.
- [[Constant Division Digit Table]] – depends-on: the $/3$ and $/5$ cells, whose $(k{+}r)$-in $(k{+}r)$-out size is what the factorisation is shrinking.
- [[Multiplication by Constants]] – depends-on: the $\times D_a$ in the remainder reconstruction is a constant multiplication on $r_b$ bits, never a multiplier.
- [[Shift-and-Add]] – supports: $\times3$ as $x+(x\ll1)$, the concrete form the reconstruction takes for the commonest factor.
- [[Multiple Constant Multiplication]] – extends: with three or more factors the several $\times D_i$ constants share subexpressions.
- [[Adders]] – depends-on: the two small ripple adders that finish $R=D_aR_b+R_a$.
- [[Recip Constant Divider]] – counter-example: its cost is independent of $|D|$, so it needs no factorisation and beats this whenever $D$ is prime or large.
- [[Binary Tree Constant Divider]] – compares: attacks the same linear-depth problem by restructuring one divider into a tree instead of splitting the divisor; faster, larger.
- [[Choosing a Constant Divider]] – compares: where this sits against every sibling on the same Kintex-7 numbers.
- [[Sequential Constant Divider]] – compares: the opposite fold of the same recurrence — one table reused over $m$ cycles rather than more tables run concurrently.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §13.5 Composite Division; §13.5.1 Algorithm, Eqs. (13.4)–(13.7) — pp. 437–438
- §13.5.2 Architecture; Fig. 13.4 (16-bit $/15 = 3\times5$, critical path highlighted) — pp. 438–439
- §13.5.3 Results and Discussions; Table 13.5 (composite 32-bit dividers on Kintex-7) — pp. 439–440
- §13.2.5 FPGA-specific remarks; Table 13.2, source of $A\approx\lceil w/(\alpha-r)\rceil\alpha$ — pp. 434–435
- Table 13.4 (BTCD vs LinArch, used for the latency comparison) — p. 437

> [!warning] Page-offset correction for this chapter
> The vault's stated rule "PDF page = printed page + 22" holds early in the book (PDF 129 = printed 107) but **not** in Chapter 13: PDF 452 renders printed 436, an offset of +16. The PDF gains front matter between the two points. Pages cited above were read at offset +16 and carry the printed numbers claimed.
