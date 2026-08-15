---
title: "Booth-Recoded Squarer"
description: "Applies radix-4 Booth digits to the folded square, shrinking the heap by about 3/4 but paying for a recoder and a Zi*Zj function; usually loses to the plain folded squarer."
kind: circuit
source: "ASA §14.2.3, p. 446"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, booth, recoding, bit-heap]
aliases:
  - "Booth Squarer"
  - "Booth Recoding for Squarers"
  - "Radix-4 Booth Squarer"
  - "Booth-Recoded Squarers"
---

# Booth-Recoded Squarer

A squarer that folds the partial-product array over radix-4 [[Booth's Algorithm|Booth]] digits instead of over raw bits, so that a $2\times2$ block of the tiling board collapses into a single signed digit product — the one squarer variant in the chapter whose partial products carry a sign.

```tikz title="Radix-4 Booth grouping of the folded squarer tiling board, n=8"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \def\u{0.5}
  \foreach \r in {0,...,7} {
    \foreach \c in {0,...,7} {
      \pgfmathtruncatemacro{\s}{\r+\c}
      \ifnum\s<7
        \fill[blue!22] (\c*\u,-\r*\u) rectangle ++(\u,-\u);
      \else\ifnum\s=7
        \fill[red!35] (\c*\u,-\r*\u) rectangle ++(\u,-\u);
      \fi\fi
    }
  }
  \draw[gray!45,step=\u] (0,0) grid (8*\u,-8*\u);
  \foreach \k in {0,2,4,6,8} {
    \draw[very thick] (\k*\u,0) -- (\k*\u,-8*\u);
    \draw[very thick] (0,-\k*\u) -- (8*\u,-\k*\u);
  }
  \foreach \c in {0,...,7} {
    \pgfmathtruncatemacro{\b}{7-\c}
    \node[font=\tiny,anchor=south] at (\c*\u+0.5*\u,0.03) {$x_{\b}$};
  }
  \foreach \r in {0,...,7} {
    \node[font=\tiny,anchor=east] at (-0.06,-\r*\u-0.5*\u) {$x_{\r}$};
  }
  \foreach \d in {0,...,3} {
    \pgfmathtruncatemacro{\dd}{3-\d}
    \node[font=\footnotesize,anchor=south] at (\d*2*\u+\u,0.36) {$Z_{\dd}$};
    \node[font=\footnotesize,anchor=east] at (-0.42,-\d*2*\u-\u) {$Z_{\d}$};
  }
  \draw[very thick,orange!85!black] (4*\u,0) rectangle (6*\u,-2*\u);
  \node[font=\footnotesize\bfseries,orange!60!black] at (5*\u,-\u) {A};
  \draw[very thick,green!45!black] (4*\u,-2*\u) rectangle (6*\u,-4*\u);
  \node[font=\footnotesize\bfseries,green!35!black] at (5*\u,-3*\u) {B};
  \node[anchor=north west,align=left,font=\footnotesize] at (8*\u+0.5,-0.1)
    {\textcolor{orange!60!black}{\textbf{A}} off-diagonal block $(i,j)=(1,0)$:\\[1pt]
     $4$ blue bits $\;\to\;Z_1Z_0\in\{0,\pm1,\pm2,\pm4\}$,\\[1pt]
     $3$ magnitude bits $+$ sign, spanning\\[1pt]
     the same three columns $2i{+}2j{+}1\dots{+}3$};
  \node[anchor=north west,align=left,font=\footnotesize] at (8*\u+0.5,-1.75)
    {\textcolor{green!35!black}{\textbf{B}} diagonal block $i=j=1$:\\[1pt]
     $2$ red $+\,1$ blue bit $\;\to\;Z_1^{2}\in\{0,1,4\}$,\\[1pt]
     $2$ unsigned bits, relative weights $1$ and $4$};
  \node[anchor=north west,align=left,font=\footnotesize] at (0,-8*\u-0.5)
    {$n=8$ bits $=4$ radix-$4$ digits.\quad
     Radix-2 heap $8+\tbinom{8}{2}=36$ bits;\quad
     Booth data bits $4\cdot2+6\cdot3=26$.};
\end{circuitikz}
\end{document}
```

*Own construction; the board convention — red $x_ix_i$ on the diagonal, blue $x_ix_j$ with $i>j$ above it, nothing below — is that of Fig. 14.1, p. 444.*

**Recode the operand, then fold the recoded operand.** Take $X$ on $n$ bits with $n$ even, and set $m=n/2$. Radix-4 Booth recoding rewrites

$$X=\sum_{i=0}^{m-1} 4^{i}Z_i,\qquad Z_i=-2x_{2i+1}+x_{2i}+x_{2i-1},\qquad Z_i\in\{-2,-1,0,1,2\}\tag{14.5}$$

with $x_{-1}=0$ by convention. Each digit is a **3-bit two's-complement** signal, and for a signed $n$-bit $X$ the $m$ digits reproduce $X$ exactly — an unsigned operand needs one extra digit, because the leading digit of the recoding must be allowed to be negative. See [[Booth's Algorithm]] for why the overlapping window is the right recoder and [[Redundant Number Systems]] for the general position of a signed-digit alphabet. Booth almost halves a *multiplier's* heap, which is the entire reason to try it here (§8.3.2, p. 215).

**The folding argument never looked at the alphabet, so it transposes verbatim.** The derivation behind [[Folded Array Squarer|equation (14.1)]] used exactly one property of the digits — that $Z_iZ_j=Z_jZ_i$, commutativity of multiplication — to merge the two symmetric halves of the array into one triangle at doubled weight. Expanding the square of the sum and applying that merge to the recoded expansion,

$$X^{2}=\Big(\sum_i 4^{i}Z_i\Big)^{2}=\sum_i 4^{2i}Z_i^{2}\;+\;2\!\!\sum_{0\le j<i}\!\!4^{i+j}Z_iZ_j\tag{14.6}$$

which is the same shape as before: a diagonal of squares plus one triangle of cross products, the triangle carrying the factor $2$ that pays for having discarded its mirror image. In column terms $2\cdot 4^{i+j}=2^{2i+2j+1}$, so the cross product of digits $i$ and $j$ enters the heap at weight $2^{2i+2j+1}$.

> [!warning] Equation (14.6) as printed on p. 446 has the wrong exponent
> The book writes the cross term as $\sum_{i>j}4^{i+j+1}Z_iZ_j$, transposing the $+1$ from (14.1) — where the base is $2$, so $2^{i+j+1}=2\cdot 2^{i+j}$ is correct — into a base-$4$ expression, where $4^{i+j+1}=4\cdot 4^{i+j}$ is twice too large. Evaluating both forms over all $256$ signed 8-bit inputs, the printed form returns $X^2$ for $13$ of them (the ones where every cross term happens to vanish) and the corrected form for all $256$. The RTL below uses the corrected weights, and simulating the printed weights is how the discrepancy surfaced.

**On the diagonal the digit alphabet pays for itself.** $Z_i\in\{-2,\dots,2\}$ gives $Z_i^{2}\in\{0,1,4\}$ regardless of sign, so the diagonal term is **unsigned** and its binary patterns are $000$, $001$, $100$: bit $1$ is never set. It is therefore **2 heap bits**, not three, sitting at columns $4i$ and $4i+2$. The three radix-2 bits it replaces are $x_{2i}^2$ at column $4i$ and the pair $x_{2i+1}^2,\;x_{2i}x_{2i+1}$ both at column $4i+2$ — block **B** in the diagram, two red cells and one blue. Three bits become two, with no sign to carry.

**Off the diagonal the alphabet costs what it saves.** $Z_iZ_j\in\{0,\pm1,\pm2,\pm4\}$: four magnitudes, so **3 magnitude bits**, and those three bits land in columns $2i+2j+1,\,{+}2,\,{+}3$ — exactly the three columns already occupied by the four blue bits of block **A**, whose weights are $2^{2i+2j+1}$, $2^{2i+2j+2}$ (twice) and $2^{2i+2j+3}$. But the term is signed, and the signed range $[-4,4]$ does not fit in three two's-complement bits, which reach only $[-4,3]$; the case $Z_i=Z_j=\pm2$ forces a **fourth** bit. Sign *extension* above that bit is free, by the constant-one identity $-2^{q}s=2^{q}\bar{s}-2^{q}$ that turns every replicated sign into one bit plus a compile-time constant, but the sign bit itself is a real signal in a real column. So the honest off-diagonal trade is four heap bits for four heap bits.

**Count it.** For $n=2m$ bits the radix-2 folded heap is $n+\binom{n}{2}=2m^{2}+m$ bits. Counting the cross term as the book does, at 3 bits:

$$\frac{2m+3\binom{m}{2}}{2m^{2}+m}=\frac{3m+1}{4m+2}\;\xrightarrow[m\to\infty]{}\;\frac34$$

which is the $3/4$ of p. 446, and at $n=8$ it is $26/36$. Counting the sign bit, the cross term is 4 bits, the entire off-diagonal saving vanishes, and only the diagonal contributes:

$$\frac{2m+4\binom{m}{2}}{2m^{2}+m}=\frac{2m}{2m+1}\;\xrightarrow[m\to\infty]{}\;1 .$$

At $n=8$ that is $32/36$. The truth sits between the two, since a compressor tree does absorb sign bits at negligible marginal cost once they are dense — but the direction is unambiguous, and it is the direction of the book's verdict. Note also that this is a bit *count*, not a term-by-term equality: Booth digits move information between adjacent blocks, so no block of the diagram maps onto its replacement in isolation.

> [!important] The two halvings do not compose
> Booth's leverage on a multiplier is that it kills whole *rows*: $n$ partial products of width $n$ become $n/2$ of width $n{+}1$, and the fixed per-row sign overhead is amortised over a row that is $n$ bits wide. A squarer has already halved its array — by folding, using free wires and the commutativity of $x_ix_j$ — and folding and recoding exploit the *same* redundancy from two directions, so the second mechanism finds much less left to remove. Worse, after folding the payload of one recoded term is 3 bits rather than $n$, so the sign overhead that was negligible on a multiplier row is now comparable to the payload it decorates. That is the structural reason a Booth squarer disappoints, and no amount of recoder tuning changes it.

**The recoder is cheap; the digit product is not.** Recoding costs $m$ three-input cells, one per digit, and is the same hardware as in a Booth multiplier. The expensive part is that each $Z_iZ_j$ is now a **Boolean function of 6 input bits** — $x_{2i+1},x_{2i},x_{2i-1}$ and $x_{2j+1},x_{2j},x_{2j-1}$ — emitting 4 bits, where the plain squarer emitted its 4 blue bits as 4 AND gates on 4 input bits. On ASIC that is four small functions against four single gates, and there is no argument to be had. On [[FPGAs|FPGA]] the input count is what decides: 6 inputs saturate a LUT6, so each of the 4 output bits is a full LUT6 that cannot fracture, whereas the 4 AND gates depend on only 4 shared inputs and pack two per fracturable LUT6 ([[Lookup-Tables]]). The recoded block is the more expensive of the two before a single compressor is placed.

> [!warning] Chapter 14 reports no measured LUT counts, DSP counts or delays for the Booth-recoded squarer. The $3/4$ factor is the only hard number given, and the "probably less efficient" verdict on p. 446 is stated without a synthesis result. The LUT argument above follows from input counts, not from measurement — needs outside research to be settled numerically.

$$\boxed{\ X^{2}=\sum_{i} 4^{2i}Z_i^{2}\;+\;\sum_{i>j} 2\cdot 4^{i+j}\,Z_iZ_j,\qquad Z_i\in\{-2,\dots,2\}\ }$$

**When it breaks.**

- **The printed weight.** Build (14.6) as written on p. 446 and the operator is wrong for all but a handful of inputs. Use $2\cdot4^{i+j}$.
- **Small $m$.** At $m\le 2$ the $3/4$ asymptote is nowhere near reached — $(3m{+}1)/(4m{+}2)$ is $0.7$ at $m=2$ even on the optimistic count, against a fixed recoder cost that does not shrink.
- **Truncation.** [[Truncated Squarer|Heap truncation]] assumes one-sided, non-negative discarded columns; signed cross products make the discarded sum two-sided, so the error bound doubles and a guard column is lost — exactly cancelling the squarer's usual one-column advantage. See [[Error Accuracy]] for the faithfulness budget being spent here.
- **Any DSP or tiling target.** Once the operator is decomposed into [[High-Radix Squarer|subword squares]] or covered by [[Squarer Tiling|tiles]], the partial products never exist as a bit heap at all and digit-level recoding has nothing to act on.
- **The one case where it wins.** If $X$ arrives already in a signed-digit or Booth-recoded form from an upstream operator — a [[Redundant Number Systems|redundant]] datapath, or a digit-recurrence unit that emits digits natively — the recoder is free and only the $Z_iZ_j$ logic is charged, which moves the comparison back towards even.

**RTL.**

```spade
/// Radix-4 Booth digit: Z = -2*hi + mid + lo, so Z in {-2,-1,0,1,2}.
fn booth_digit(hi: bool, mid: bool, lo: bool) -> int<3> {
    match (hi, mid, lo) {
        (false, false, false) => 0,
        (false, false, true)  => 1,
        (false, true,  false) => 1,
        (false, true,  true)  => 2,
        (true,  false, false) => -2,
        (true,  false, true)  => -1,
        (true,  true,  false) => -1,
        (true,  true,  true)  => 0,
    }
}

/// Z^2 in {0,1,4}: two heap bits, at relative weights 1 and 4. Bit 1 is never set.
fn digit_square(z: int<3>) -> uint<3> {
    let one  = (z == 1) || (z == -1);
    let four = (z == 2) || (z == -2);
    [one, false, four].as_uint()
}

entity booth_sq8(x: int<8>) -> uint<15> {
    let b = x.as_bits();
    let z0 = booth_digit(b[1], b[0], false);
    let z1 = booth_digit(b[3], b[2], b[1]);
    let z2 = booth_digit(b[5], b[4], b[3]);
    let z3 = booth_digit(b[7], b[6], b[5]);

    let d0: int<17> = sext(digit_square(z0).to_int());
    let d1: int<17> = sext(digit_square(z1).to_int()) << 4;
    let d2: int<17> = sext(digit_square(z2).to_int()) << 8;
    let d3: int<17> = sext(digit_square(z3).to_int()) << 12;

    let c10: int<17> = sext(z1 * z0) << 3;
    let c20: int<17> = sext(z2 * z0) << 5;
    let c21: int<17> = sext(z2 * z1) << 7;
    let c30: int<17> = sext(z3 * z0) << 7;
    let c31: int<17> = sext(z3 * z1) << 9;
    let c32: int<17> = sext(z3 * z2) << 11;

    let s = d0 +. d1 +. d2 +. d3 +. c10 +. c20 +. c21 +. c30 +. c31 +. c32;
    trunc(s.as_uint())
}
```

The four `booth_digit` calls are the four column groups along the top of the diagram, each reading the overlapping 3-bit window $x_{2i+1}x_{2i}x_{2i-1}$; `digit_square` is block **B** and its `false` in the middle position is the claim that bit 1 of $Z_i^2$ is dead wire, not logic. Every `<<` is the weight $2^{4i}$ or $2^{2i+2j+1}$ and is pure routing — the diagonal shifts are multiples of 4, the cross-term shifts are odd, and that parity is the whole content of the corrected exponent. Widths: digits are `int<3>`, `z_i * z_j` widens to `int<6>` for a value that only ever occupies $[-4,4]$, and the accumulator is held at `int<17>` by the truncating `+.` so that the ten terms chain without the usual $N{+}1$ growth; the result of squaring a signed 8-bit input is at most $2^{14}$, hence `uint<15>`. All combinational. Synthesis will not build ten adders in a line — it collapses the `+.` chain into a compressor tree, and it will flatten each `z_i * z_j` into the 6-input Boolean function the note costs above rather than instantiating a $3\times3$ signed multiplier.

Verified against the behavioural reference $X\cdot X$: 12 named vectors including the deliberately lopsided $65=01000001_2$ and $-86=10101010_2$, an exhaustive sweep of all 256 signed 8-bit inputs, and a 3000-vector random sweep — 3268 checks, no failures. The same testbench against the printed $4^{i+j+1}$ weights fails on 243 of the 256 exhaustive inputs.

**Related notes.**

- [[Folded Array Squarer]] – counter-example: the plain (14.1) squarer, which is the baseline this one is trying to beat and, on the book's own verdict, does not.
- [[Booth's Algorithm]] – depends-on: supplies the recoding (14.5) and the reason to expect a halving that does not arrive.
- [[Redundant Number Systems]] – depends-on: the signed-digit alphabet whose sign is the cost centre here, and the one setting where the recoder comes for free.
- [[High-Radix Squarer]] – compares: the other way to move a squarer to radix $2^k$, splitting into subword multiplications rather than signed digits, and the one that actually pays.
- [[Choosing a Squarer]] – compares: where this variant sits against every sibling.
- [[Truncated Squarer]] – counter-example: truncation reasoning assumes non-negative discarded columns, which signed cross products break.
- [[Squarer Tiling]] – compares: on FPGA the partial products are covered by tiles and never form the heap this note recodes.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §14.2.1 Basics and Fig. 14.1 (tiling board of a 12-bit square), p. 444.
- §14.2.1, eq. (14.1) and Fig. 14.2 (bit heap of an exact 12-bit squarer), p. 445.
- §14.2.3 Booth Recoding, eqs. (14.5)–(14.6), the $3/4$ factor and the "probably less efficient" verdict, p. 446.
- §8.3.2 Booth recoding for multipliers, p. 215.
