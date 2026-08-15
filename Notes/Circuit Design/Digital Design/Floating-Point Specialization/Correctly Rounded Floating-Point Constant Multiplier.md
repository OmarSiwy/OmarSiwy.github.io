---
title: "Correctly Rounded Floating-Point Constant Multiplier"
description: "Same architecture with an exact constant multiplier on 2+w_F+k bits, giving bit-for-bit IEEE results so an HLS compiler may legally substitute it."
kind: circuit
source: "ASA §15.1.3, pp. 457-459"
status: seed
spade: simulated
tags: [digital, floating-point, constant-multiplier, rounding, hls]
aliases:
  - Correctly Rounded Constant Multiplier
  - Exact Floating-Point Constant Multiplier
  - Correctly Rounded Multiplication by a Floating-Point Constant
---

# Correctly Rounded Floating-Point Constant Multiplier

Multiplication of a float by a compile-time float constant $C$ whose significand multiplier is *exact* rather than faithful, so the single final rounding reproduces an IEEE-754 multiplier bit for bit.

```tikz title="Tie patterns in the exact integer significand product"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  bit/.style={draw, minimum width=0.5cm, minimum height=0.5cm, inner sep=0pt,
              anchor=south west, font=\small},
  kb/.style={bit, fill=black!12},
  tb/.style={bit, fill=black!35}]

  % --- row A: I_X >= I_{C^-1}, product normalised, MSB at 2^{w_F+k+1}
  \node[bit] at (0,1.7) {1};
  \foreach \i in {1,...,5} { \node[kb] at ({\i*0.5},1.7) {}; }
  \node[tb] at (3.0,1.7) {1};
  \foreach \i in {7,...,11} { \node[bit] at ({\i*0.5},1.7) {0}; }
  \node[anchor=east, font=\small] at (-0.1,1.95) {$I_CI_X=$};
  \node[anchor=west, font=\small] at (6.2,1.95) {$I_X\ge I_{C^{-1}}$: tie $\Leftrightarrow 2^{k}\mid I_CI_X$};

  % --- row B: I_X < I_{C^-1}, product not normalised, MSB at 2^{w_F+k}
  \node[bit] at (0,0.5) {0};
  \node[bit] at (0.5,0.5) {1};
  \foreach \i in {2,...,6} { \node[kb] at ({\i*0.5},0.5) {}; }
  \node[tb] at (3.5,0.5) {1};
  \foreach \i in {8,...,11} { \node[bit] at ({\i*0.5},0.5) {0}; }
  \node[anchor=east, font=\small] at (-0.1,0.75) {$I_CI_X=$};
  \node[anchor=west, font=\small] at (6.2,0.75) {$I_X< I_{C^{-1}}$: tie $\Leftrightarrow 2^{k-1}\mid I_CI_X$};

  % --- spans
  \draw[latex-latex] (0,2.55) -- (3.0,2.55)
        node[midway, above, font=\small] {$1+w_F$ bits kept};
  \draw[latex-latex] (3.5,2.55) -- (6.0,2.55)
        node[midway, above, font=\small] {$k$ zeros};
  \draw[latex-latex] (4.0,0.15) -- (6.0,0.15)
        node[midway, below, font=\small] {$k-1$ zeros};
  \draw[latex-latex] (0,-0.75) -- (6.0,-0.75)
        node[midway, below, font=\small] {$w_F+k+2$ bits, exact};

  \draw[dotted] (3.0,1.6) -- (3.0,2.45);
  \draw[dotted] (4.0,0.4) -- (4.0,0.05);

  \node[anchor=west, font=\small] at (6.2,-0.75)
        {dark cell $=$ the $\frac{1}{2}$-ulp bit};
\end{circuitikz}
\end{document}
```

*after Fig. 15.4, p. 458*

**Change one block and inherit the rest of the architecture.** Take the [[Faithful Floating-Point Constant Multiplier]] of Fig. 15.3, p. 456 — unpack, a $w_E$-bit exponent add $(E_X+E_0)+E_C$ carried on $w_E+1$ bits, a `product normal?` comparator on $F_X$, a constant significand multiplier, a 1-bit normalizer, pack — and replace the *faithful* significand multiplier by an *exact* one. Nothing else moves (p. 458). The exponent path, the exception logic and the one-bit normalization argument are untouched because they never depended on how accurately the significand product was computed, only on its range $[1,4)$.

**Why the exact multiplier is affordable at all.** $C$ is itself a float, so its fraction is finite: $F_C\in\mathrm{ufix}(-1,-k)$ for some positive integer $k$, and when $C$ has the same format as the input, $k\le w_F$. A finite constant means the product $(1+F_C)\times(1+F_X)$ is a *finite* fixed-point value — $2+w_F+k$ bits — and a shift-and-add or KCM graph can compute all of it. Contrast the faithful operator, which deliberately truncates and accepts 1 ulp. See [[Number Formats]] for the `ufix`/`sfix` notation and [[Error Accuracy]] for what "exact" buys over "faithful".

**The HLS motive, stated plainly.** A compiler is only allowed to swap a generic multiplier for a specialized one if the swap is invisible: the result must be bit-for-bit what a software run produces. Faithful rounding fails that test, correct rounding passes it, and that is the entire reason this variant exists rather than being an accuracy luxury (p. 457). The same construction is reused one section later with $k>w_F$ to handle irrational constants.

**One methodological simplification falls out for free.** In the faithful operator the limit case $F_X=\lfloor F_{C^{-1}}\rfloor_{-w_F}$ could round either way, so `product normal?` had to be built *after* the multiplier, by asking the built multiplier what it does on that one input. With an exact multiplier the product on that input is a determined real number, so the comparison $\ge$ versus $>$ is decided from $C$ alone (p. 458). The [[Product Normalization Predictor]] becomes pure compile-time arithmetic.

**Move to integer significands, because rounding is a divisibility question.** Write $I_X=2^{w_F}(1+F_X)$, an integer in $[2^{w_F},2^{w_F+1}-1]$ on $w_F+1$ bits, and $I_C=2^k(1+F_C)$ on $k+1$ bits. Choosing $k$ *minimal* — the smallest precision that represents $F_C$ — forces $I_C$ to be **odd**: if it were even, $F_C$ would fit on $k-1$ bits. The exact integer product $I_CI_X$ occupies $w_F+k+2$ bits. Round-to-nearest-ties-to-away needs nothing more; the round bit's position is known in advance ($-w_F$ or $-w_F+1$, from `product normal?`), so the rounding addition merges into the multiplier's bit heap exactly as in the faithful case. Ties-to-even is the only mode that costs extra, because it needs a sticky bit, so the question worth asking is whether a tie can occur at all.

**A tie is $k-1$ trailing zeros, and $I_C$ being odd hands the condition straight to $I_X$.** A tie means the discarded field of the product is $1$ followed by zeros — the $\frac12$-ulp bit set and nothing below it. The diagram shows the two alignments: if $I_X\ge I_{C^{-1}}$ the product is normalized on $w_F+k+2$ bits and $k$ zeros follow the half-ulp bit, so $2^{k}\mid I_CI_X$; if $I_X<I_{C^{-1}}$ the product's leading bit is $0$ and only $k-1$ zeros follow, so $2^{k-1}\mid I_CI_X$. The weaker of the two, $2^{k-1}\mid I_CI_X$, is therefore necessary in both cases. Now apply Euclid's lemma: $2^{k-1}$ is a prime power and $I_C$ is odd, so $\gcd(2^{k-1},I_C)=1$ and divisibility transfers entirely to the other factor, $2^{k-1}\mid I_X$. Hence $I_X\ge 2^{k-1}$.

**Four compile-time tests, in decreasing order of how much hardware they delete.** All of them are inequalities on $k$ and $I_C$, evaluated by the generator before a single LUT is placed, with $I_{C^{-1}}=2^k(1+F_{C^{-1}})$ and $1+F_{C^{-1}}=2/(1+F_C)$:

| condition on the constant | tie situation | hardware consequence |
| --- | --- | --- |
| $k-1>w_F$ | impossible, since $I_X<2^{w_F+1}\le 2^{k-1}$ | no sticky path at all |
| $k-1=w_F$ | only $I_X=2^{w_F}$, i.e. significand exactly $1$ | [[Pseudo-Sticky Tie Anticipation]] on $F_X$, off the multiplier's critical path |
| $k=w_F$, $1+F_C>\tfrac43$ | impossible: $I_{C^{-1}}<3\cdot 2^{w_F-1}$ and no odd multiple of $2^{w_F-1}$ is smaller and still in range | none |
| $k=w_F$, $1+F_C<\tfrac43$ | the single value $I_X=3\cdot 2^{w_F-1}$ | pseudo-sticky on $F_X$ |
| $k<w_F$ | $I_X<I_{C^{-1}}$ an odd multiple of $2^{k-1}$, or $I_X\ge I_{C^{-1}}$ an odd multiple of $2^k$ | anticipation still works but filters fewer cases; otherwise a full [[Sticky Bit Computation]] on the low product bits |

The third row is the one worth following through, because it is where the argument is prettiest and where the book slipped. $I_CI_{C^{-1}}=2^{2k}\cdot 2=2^{2k+1}$ by construction, so at $k=w_F$ the threshold $I_{C^{-1}}<3\cdot 2^{w_F-1}$ is equivalent to $I_C>2^{2w_F+1}/(3\cdot 2^{w_F-1})=\tfrac43 2^{w_F}$. Under that condition the only candidate ties would be odd multiples of $2^{w_F-1}$ lying in $[2^{w_F},2^{w_F+1})$ and below $I_{C^{-1}}$; the smallest such multiple is $3\cdot 2^{w_F-1}$, which the threshold excludes, and $2^{w_F}=2\cdot 2^{w_F-1}$ is an *even* multiple. No tie, no sticky logic, for a constant whose significand merely exceeds $4/3$.

> [!warning] Two arithmetic slips in the printed text, p. 459
> The book gives the no-tie threshold as $I_C>\tfrac23 2^{w_F}$. That is vacuous — $I_C\in[2^{w_F},2^{w_F+1})$ always exceeds $\tfrac23 2^{w_F}$ — and it is inconsistent with the very next clause, which asserts $I_{C^{-1}}=\tfrac32 2^{w_F}$. The threshold is $\tfrac23 2^{w_F+1}=\tfrac43 2^{w_F}$; a factor of two was lost in the exponent. Immediately after, the single tie case is printed as $I_X=3\cdot 2^{w_F}$, which lies outside $I_X$'s range $[2^{w_F},2^{w_F+1})$; it is $3\cdot 2^{w_F-1}$. The table above uses the corrected values.

**FPGA versus ASIC.** The extra cost of correct rounding here is entirely in the constant multiplier, and constant multiplication is *sublinear* in the constant's size [DIZ07] — the operand does not grow, only the number of shifted addends, and those share the carry chain. On an FPGA a wider exact multiplier consumes more carry-chain rows in the [[Sums of Weighted Bits]] compression; on an ASIC it widens the adder tree by roughly $\log$ depth. Either way the delta over the faithful version is small for $k\le w_F$ and only becomes the "less than a factor 2 in area" penalty in the real-constant case where $k\approx 2w_F+1$ (p. 460).

$$\boxed{\ I_C\ \text{odd}\ \Longrightarrow\ \big(\text{a tie exists}\iff \exists\, I_X\in[2^{w_F},2^{w_F+1})\ \text{with}\ 2^{k-1}\mid I_X\big)\ }$$

**Where it breaks.**

- **$k$ not minimal.** Every result above rests on $I_C$ being odd. Feed the generator a constant padded with trailing zeros and the parity argument evaporates — ties reappear that the analysis said were impossible. Normalize the constant first.
- **$C$ irrational.** There is no finite $k$; the operator must first be reduced to a finite $\widetilde C_k=\lfloor 1+F_C\rfloor_{-k}$ with $k\approx 2w_F+1$, at which point $k-1>w_F$ and the whole tie table collapses to its first row — correct rounding of a real constant is *cheaper* to prove tie-free than that of a float constant.
- **Rational $C=A/B$.** The exclusion-zone theorem (Thm. 15.1, p. 461) gives a much tighter bound than truncating $A/B$ and applying this analysis; see [[Floating-Point Multiplier by a Rational Constant]].
- **Subnormals.** Everything here assumes normal inputs and outputs. Adding subnormal support for $C<1$ forces rounding *after* normalization and destroys the merged-rounding trick that made the round bit free — see [[Constant Multiplier with Subnormal Support]].
- **Mixed formats.** $k\le w_F$ only holds when the constant's format is no wider than the input's. A double-precision constant multiplying a single-precision input lands in the $k-1>w_F$ row, which is good for ties but doubles the multiplier.

**RTL (Spade).** The significand path of the diagram, with the constant pinned to a concrete float so the widths are checkable.

```spade
// Correctly rounded significand path, w_F = 8, C = 25/16 (I_C = 25 odd, k = 4).
entity crmul25(ix: uint<9>) -> (uint<10>, bool) {
    let ic: uint<9> = 25;
    let p: uint<14> = trunc(ix * ic);
    let b = p.as_bits();
    let norm = b[13];

    let kept: uint<10> = if norm { zext(b[5..14].as_uint()) } else { zext(b[4..13].as_uint()) };
    let r     = if norm { b[4] } else { b[3] };
    let stky  = if norm { b[0..4].as_uint() != 0 } else { b[0..3].as_uint() != 0 };

    let inc: uint<10> = zext((r && (stky || kept.as_bits()[0])).as_uint());
    (trunc(kept + inc), norm)
}
```

`ix` is $I_X$ on $w_F+1=9$ bits and `p` is the exact product $I_CI_X$ on $w_F+k+2=14$ bits — the two rows of the diagram, distinguished by `norm` $=$ `p[13]`, which is the `product normal?` decision read off the product instead of predicted from $F_X$. The kept field is the $1+w_F=9$ shaded cells, the round bit `r` is the dark cell, and `stky` ORs the $k$ or $k-1$ cells below it, so `r && !stky` is exactly the tie the divisibility argument counts. `inc` implements ties-to-even by folding `kept`'s LSB into the increment. All combinational, no clock; synthesis will not build the `ix * ic` multiplier — with $I_C$ constant it becomes the shift-and-add graph $25X=(X\ll 4)+(X\ll 3)+X$, and the `+ inc` addition merges into that graph's final adder rather than standing alone.

**Related notes.**

- [[Faithful Floating-Point Constant Multiplier]] – extends: identical datapath, exact significand multiplier in place of the faithful one.
- [[Product Normalization Predictor]] – supports: the `product normal?` block, whose limit case becomes decidable from the constant alone once the multiplier is exact.
- [[Pseudo-Sticky Tie Anticipation]] – extends: the cheap sticky replacement the tie table selects in the $k-1=w_F$ and $k=w_F$ rows.
- [[Sticky Bit Computation]] – supports: the full-width fallback used when the table proves nothing.
- [[Floating-Point Multiplier by a Rational Constant]] – compares: replaces parity counting with an exclusion-zone bound for $C=A/B$.
- [[Constant Multiplier with Subnormal Support]] – counter-example: the merged rounding assumed here is forfeited once $C<1$ can produce subnormals.
- [[Rounding]] – depends-on: definitions of ties-to-even, ties-to-away and the sticky bit.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §15.1.2 "The Baseline Faithful Multiplier by a Constant", pp. 455-457 (inherited architecture, Fig. 15.3, p. 456).
- §15.1.3 "Correctly Rounded Multiplication by a Floating-Point Constant", pp. 457-459 (exact multiplier, Fig. 15.4, p. 458, tie analysis).
- §15.1.4, p. 460 (sublinear cost of constant multiplication, [DIZ07]; $k\approx 2w_F+1$ for real constants).
- §11.2.2 (sticky bit computation); §6.3.3 (constant comparator area).
