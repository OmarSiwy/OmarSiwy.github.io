---
title: "Floating-Point Comparator"
description: "Because the biased encoding makes the bit pattern order the numeric order (subnormals included), comparison is an integer comparator on the concatenated exponent and fraction plus a flat layer of NaN/zero/infinity logic."
kind: circuit
source: "ASA §11.5, pp. 357-360"
status: seed
spade: simulated
tags: [digital, floating-point, comparator, ieee754, fpga]
aliases:
  - FP Comparator
  - Floating-Point Comparison
  - FPComparator
---

# Floating-Point Comparator

The one floating-point operator with no datapath at all: an unsigned integer comparator on the concatenated exponent and fraction fields, wrapped in a flat layer of sign, zero and NaN logic that emits four mutually exclusive predicates.

```tikz title="Floating-point comparator: unpack, integer comparator on I = E||F, IEEE 754 output logic"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % ---- operands ----
  \draw[->] (3.0,6.1) -- (3.0,5.2) node[midway,left=1pt] {$X$};
  \draw[->] (8.0,6.1) -- (8.0,5.2) node[midway,left=1pt] {$Y$};
  \node[anchor=west,font=\tiny] at (3.1,5.75) {$1{+}w_E{+}w_F$};
  \node[anchor=west,font=\tiny] at (8.1,5.75) {$1{+}w_E{+}w_F$};

  % ---- unpack ----
  \draw[thick] (0,4.4) rectangle (11.0,5.2);
  \node at (5.5,4.8) {unpack};

  % ---- exception / sign flags: 8 wires straight down to the logic layer ----
  \foreach \x/\y/\lab in {0.5/4.15/{\mathrm{NaN}_X}, 1.4/3.7/{\mathrm{NaN}_Y},
                          2.3/4.15/{\infty_X}, 3.2/3.7/{\infty_Y},
                          4.1/4.15/{z_X}, 5.0/3.7/{z_Y},
                          5.9/4.15/{s_X}, 6.8/3.7/{s_Y}}
    { \draw[->] (\x,4.4) -- (\x,1.7);
      \node[anchor=west,font=\tiny] at (\x,\y) {$\lab$}; }
  \node[anchor=east,font=\tiny] at (-0.1,2.9) {8 flags, $1$ bit each};

  % ---- E and F fields, concatenated into I ----
  \draw (7.6,4.4) -- (7.6,4.0);  \draw (8.2,4.4) -- (8.2,4.0);
  \draw (7.6,4.0) -- (8.2,4.0);  \draw[->] (7.9,4.0) -- (7.9,3.35);
  \node[anchor=east,font=\tiny] at (7.6,4.22) {$E_X$};
  \node[anchor=west,font=\tiny] at (8.2,4.22) {$F_X$};
  \node[anchor=east,font=\tiny] at (7.85,3.65) {$I_X$};

  \draw (9.9,4.4) -- (9.9,4.0);  \draw (10.5,4.4) -- (10.5,4.0);
  \draw (9.9,4.0) -- (10.5,4.0); \draw[->] (10.2,4.0) -- (10.2,3.35);
  \node[anchor=east,font=\tiny] at (9.9,4.22) {$E_Y$};
  \node[anchor=west,font=\tiny] at (10.5,4.22) {$F_Y$};
  \node[anchor=east,font=\tiny] at (10.15,3.65) {$I_Y$};
  \node[font=\tiny] at (9.0,3.62) {$w_E{+}w_F$};

  % ---- integer comparator ----
  \draw[thick] (7.2,2.15) rectangle (11.0,3.35);
  \node at (9.1,3.0) {integer comparator};
  \node[font=\footnotesize] at (9.1,2.5) {$<\qquad=\qquad>$};
  \foreach \x in {7.9,9.1,10.3} { \draw[->] (\x,2.15) -- (\x,1.7); }

  % ---- IEEE 754 logic ----
  \draw[thick] (0,0.9) rectangle (11.0,1.7);
  \node at (5.5,1.3) {IEEE 754 logic};

  % ---- predicates ----
  \foreach \x/\lab in {0.9/{X<Y}, 2.6/{X=Y}, 4.3/{X>Y},
                       6.0/{X?Y}, 7.9/{X\le Y}, 9.9/{X\ge Y}}
    { \draw[->] (\x,0.9) -- (\x,0.35);
      \node[anchor=north,font=\footnotesize] at (\x,0.33) {$\lab$}; }
  \node[anchor=west,font=\tiny] at (10.3,0.6) {$1$};
\end{circuitikz}
\end{document}
```

*after Fig. 11.12, p. 359; the six output predicates are the interface of Fig. 11.11, p. 358.*

**Let the encoding do the arithmetic.** The exponent bias exists precisely so that the order of the positive floating-point numbers, from $0$ to $+\infty$, is the order of their bit patterns read as unsigned integers (Table 2.1, p. 51, cited p. 357). The mechanism is lexicographic: in the stored word the $w_E$-bit exponent field sits immediately above the $w_F$-bit fraction field, so concatenating them into

$$I_X \;=\; E_X \,\|\, F_X \qquad (w_E + w_F \text{ bits})$$

orders first by $E$, and only on ties by $F$ — which is exactly "larger exponent wins, equal exponents broken by significand". Because the bias is a single additive constant, it is order-preserving on the exponent field and the comparison never has to undo it. **Subnormals come out free**: they carry $E=0$ and an implicit leading $0$, so their value $0.F_X \times 2^{1-E_0}$ is monotone in $F_X$ alone, and they occupy the bottom of the same integer range with no special case (p. 357). See [[Floating-Point Formats]] for the encoding itself and [[Number Formats]] for why a biased field rather than a two's-complement one.

**Reintroduce the sign by case analysis, not by widening the comparison.** Floating-point is sign-magnitude, not two's complement, so an unsigned comparison of the whole $1+w_E+w_F$-bit word is wrong the moment the two signs differ — it would rank every negative number above every positive one. The integer comparator therefore sees only $I_X$ and $I_Y$ ($w_E+w_F$ bits each) and produces three 1-bit magnitude results $L=(I_X<I_Y)$, $Q=(I_X=I_Y)$, $G=(I_X>I_Y)$. The output layer resolves the sign by the four cases on $(s_X,s_Y)$: both positive means the numeric order is the magnitude order; both negative means it is the *reverse* magnitude order, by the order-reversing map $t \mapsto -t$; and mixed signs decide the comparison outright without consulting $L$, $Q$, $G$ at all. This is why the book warns that specializing to a single predicate "does not necessarily entail any saving in the integer comparator" (p. 360) — the signed case analysis still needs both directions unless the signs are known fixed.

**Patch the one place the magnitude order lies: $\pm 0$.** Both zeros have $I=0$, so the magnitude comparator correctly reports $Q$, but the mixed-sign rule would then declare $+0 > -0$. The unpack's zero flags $z_X$, $z_Y$ (each 1 bit, $z=(I=0)$ for an IEEE-encoded operand) suppress exactly that: the mixed-sign terms are gated by $\overline{z_X \wedge z_Y}$, and equality is forced true when the signs differ but both operands are zero. This is the specification's "$+0$ and $-0$ compare equal" (p. 357) and it is the *only* place a flag alters an ordering decision.

**NaN is a mask over all three ordering outputs, not a value in the order.** By de Morgan the ordered condition is $\overline{\mathrm{NaN}_X \vee \mathrm{NaN}_Y} = \overline{\mathrm{NaN}_X}\wedge\overline{\mathrm{NaN}_Y}$, and each of $X<Y$, $X=Y$, $X>Y$ is ANDed with it, so a NaN input drives all three to False — including NaN against itself (p. 358). The fourth predicate is the unmasked disjunction, $X?Y = \mathrm{NaN}_X \vee \mathrm{NaN}_Y$, which makes the four outputs mutually exclusive and exhaustive by construction. The mask is not optional bookkeeping: NaN patterns have $E$ all-ones and $F \neq 0$, so their $I$ is numerically *above* every finite number and above $\infty$, and an unmasked comparator would cheerfully report that every NaN is the largest number in the format.

**Infinity needs no case of its own in an IEEE-encoded comparator.** $\infty$ has $E$ all-ones and $F=0$, giving the single largest non-NaN value of $I$, so monotonicity already places it above every finite operand; two infinities of the same sign land on $Q$ with equal signs and compare equal, and $+\infty$ against $-\infty$ falls to the mixed-sign rule with $z=0$ on both sides. The $\infty_X$, $\infty_Y$ wires are drawn anyway because computing "is Zero", "is Infinity" and "is NaN" is *the only difference* between a comparator for IEEE-encoded data and one for an `Nfloat`-encoded datapath (p. 359): in an `Nfloat` the exception class lives in dedicated bits outside $E\|F$, so the flags are read off rather than decoded, and the zero flag in particular can no longer be recovered from $I$.

> [!note] $\le$ is not $\lnot(>)$, but $\ne$ is $\lnot(=)$
> $X\le Y$ and $X\ge Y$ must also return False when either input is NaN, so they are *not* the Boolean negations of $X>Y$ and $X<Y$ — they differ exactly on the NaN inputs, and are built as $(X<Y)\vee(X=Y)$ under the same ordered mask. But $X\ne Y$ **is** the plain negation of $X=Y$, which is why the idiomatic NaN test in every programming language is `x != x` (p. 358).

> [!warning] The Boolean formulas are left as an exercise in the source
> The book gives Tables 11.5 and 11.6 (pp. 358–359) and the block diagram, and explicitly leaves the output-layer equations to the reader. The expressions boxed below are derived here from those two tables and were checked against them exhaustively in simulation, not quoted from the text.

**On FPGAs, this wide comparison is cheap enough to be reused elsewhere.** The comparator's critical path is one $(w_E{+}w_F)$-bit unsigned comparison, which maps onto the fast carry chain as a subtraction with the borrow-out taken as the result — 32 bits of it costs a handful of slices and one carry-chain traversal (Sect. 6.3, p. 148). That cheapness is why the [[Floating-Point Adder]] takes its swap decision by comparing the *concatenation* rather than just the exponents: the same structure that answers "which is bigger" also guarantees $M_X > M_Y$ in the near cases and deletes the absolute-value stage from the significand datapath (p. 338). On ASIC the trade is less clear-cut and the book notes the best choice is technology-dependent. Unlike every other operator in the chapter, there is no accuracy question here at all — comparison is exact by construction, so the faithful-versus-correctly-rounded axis of [[Error Accuracy]] does not apply (p. 357).

With $L,Q,G$ the magnitude results, $s$ the sign bits, $z$ the zero flags and $\mathrm{ord} = \overline{\mathrm{NaN}_X \vee \mathrm{NaN}_Y}$:

$$\boxed{\;\begin{aligned}
X>Y &= \mathrm{ord}\wedge\big[\;\overline{s_X}\,\overline{s_Y}\,G \;\vee\; s_X s_Y L \;\vee\; \overline{s_X}\,s_Y\,\overline{z_X z_Y}\;\big]\\
X<Y &= \mathrm{ord}\wedge\big[\;\overline{s_X}\,\overline{s_Y}\,L \;\vee\; s_X s_Y G \;\vee\; s_X\,\overline{s_Y}\,\overline{z_X z_Y}\;\big]\\
X=Y &= \mathrm{ord}\wedge Q \wedge \big[\;\overline{s_X \oplus s_Y} \;\vee\; z_X\;\big]\\
X?Y &= \mathrm{NaN}_X \vee \mathrm{NaN}_Y
\end{aligned}\;}$$

**Where it stops working.**

- **Non-IEEE encodings.** In FloPoCo's `Nfloat`, zero and infinity are exception codes in bits above the sign, so $z$ cannot be derived as $I=0$ and the unpack layer is genuinely different logic — the only structural difference between the two comparators (p. 359).
- **You wanted a total order.** These four predicates deliberately do not order NaNs and deliberately equate $\pm 0$. Sorting networks, `sort` implementations and hash keys need IEEE 754's `totalOrder` instead, which distinguishes $-0 < +0$ and ranks NaNs by payload; none of that logic is here.
- **Specialization saves less than it looks.** Deleting three of four output predicates is free, but the integer comparator only halves when the sign of both inputs is known fixed at design time, because otherwise both $I_X<I_Y$ and $I_X>I_Y$ are still needed (p. 360).
- **You wanted min/max, not a predicate.** The comparator gives you the select line; the mux and its $2\times(1{+}w_E{+}w_F)$ bits of routing are extra, and NaN propagation rules for `minNum`/`maxNum` are not the comparison rules.
- **Exception signalling.** A quiet comparison and a signalling one differ in what they raise on NaN inputs; the flag generation belongs to [[Floating-Point Exception Handling]], not here.

**RTL.**

```spade
struct Cmp {
    lt: bool,
    eq: bool,
    gt: bool,
    un: bool,
}

fn fp_compare<#uint WE, #uint WF>(
    x: uint<{1 + WE + WF}>,
    y: uint<{1 + WE + WF}>,
) -> Cmp {
    // unpack: sign, the concatenated integer I = E||F, and the special-case flags
    let sx = x.msb();
    let sy = y.msb();
    let ix: uint<{WE + WF}> = trunc(x);
    let iy: uint<{WE + WF}> = trunc(y);

    let ex: uint<WE> = trunc(ix >> WF);
    let ey: uint<WE> = trunc(iy >> WF);
    let fx: uint<WF> = trunc(ix);
    let fy: uint<WF> = trunc(iy);

    let nan_x = ex.as_bits().reduce_and() && fx.as_bits().reduce_or();
    let nan_y = ey.as_bits().reduce_and() && fy.as_bits().reduce_or();
    let zx = ix == 0;
    let zy = iy == 0;

    // integer comparator on I_X and I_Y
    let lt_i = ix < iy;
    let gt_i = ix > iy;
    let eq_i = ix == iy;

    // IEEE 754 logic
    let ord = !(nan_x || nan_y);
    let bothzero = zx && zy;
    Cmp$(
        lt: ord && ((!sx && !sy && lt_i) || (sx && sy && gt_i) || (sx && !sy && !bothzero)),
        eq: ord && eq_i && ((sx == sy) || zx),
        gt: ord && ((!sx && !sy && gt_i) || (sx && sy && lt_i) || (!sx && sy && !bothzero)),
        un: nan_x || nan_y,
    )
}
```

The four `let`s at the top are the diagram's unpack block and cost nothing but wiring: `x.msb()` taps $s_X$, and `trunc(x)` keeps the low $w_E+w_F$ bits, which *is* $I_X$ — the concatenation in the drawing is a no-op in the encoding. `lt_i`/`eq_i`/`gt_i` are the three outputs of the integer comparator box, and the `Cmp$(..)` constructor is the IEEE 754 logic layer, transcribed from the boxed equations. Everything is combinational; a pipelined version would cut after the comparator, since the output layer is two levels of gates against the comparator's $\log_2(w_E{+}w_F)$. Synthesis will not build the `ex`/`fx` splits that the drawing shows — they are only there to detect all-ones and non-zero, and the tool merges those reductions straight into the comparison's own carry logic.

Verified on `fpcmp32 = fp_compare::<8, 23>` (binary32) against a behavioural reference written with the independent monotone-key construction: 5022 vectors pass, comprising 22 named cases taken directly from Tables 11.5 and 11.6 — including $\pm0$ both ways, $\pm\infty$, subnormal-versus-zero, NaN against NaN, and the asymmetric $1.0$ against $128.0$ — and 5000 random patterns biased so all-ones exponents, zeros and subnormals actually occur. Every vector is additionally checked for one-hotness, which is the specification's mutual-exclusivity claim.

**Related notes.**

- [[Magnitude Comparator]] – depends-on: the $(w_E{+}w_F)$-bit unsigned comparator that this operator is built around; everything else here is one gate level.
- [[Comparators]] – compares: where the floating-point case sits among integer and fixed-point comparison structures.
- [[Floating-Point Formats]] – depends-on: the biased-exponent encoding whose monotonicity is the entire trick.
- [[Floating-Point Exception Handling]] – supports: supplies the "is Zero / is Infinity / is NaN" decoding that the unpack block emits.
- [[Exponent Difference and Swap Unit]] – extends: the adder's swap decision is this same comparison on $E\|F$, reused as a control signal rather than an output.
- [[Floating-Point Adder]] – counter-example: the operator where the comparison is the cheap part and the alignment/rounding datapath dominates.
- [[Choosing a Floating-Point Operator]] – compares: the only entry in that table with no accuracy column, because comparison is exact.
- [[Error Accuracy]] – counter-example: the faithful-versus-correctly-rounded trade that governs every other operator does not exist here.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:
  - Sect. 11.5 "Floating-Point Comparison" — 11.5.1 specification and the four predicates, Fig. 11.11 and Table 11.5, pp. 357–358; 11.5.2 implementation, Table 11.6 and Fig. 11.12, pp. 358–359; 11.5.3 specializations and `flopoco FPComparator we=8 wf=23`, p. 360
  - Table 2.1 / Sect. 2.5.1, format encoding and the monotonicity of the biased exponent, p. 51 (cited p. 357)
  - Sect. 6.3, comparison on the FPGA fast carry chain, p. 148 (cited p. 338); the adder's concatenation-based swap decision, p. 338
- [754-19] *IEEE Standard for Floating-Point Arithmetic*, IEEE/ISO/IEC 60559:2020 — the source of the four-predicate specification and of `totalOrder`; cited p. 357.
