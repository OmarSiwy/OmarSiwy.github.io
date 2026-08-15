---
title: "Left-Truncated Squarer"
description: "Decides the sign of S0^2 - X to lift a faithful square root to a correctly rounded one, computing only the bits of the square that can differ from X — the square-root transpose of the divider's left-truncated multiplier."
kind: circuit
source: "ASA §11.4.4, pp. 356-357; §11.3.4, pp. 351-352"
status: seed
spade: simulated
tags: [digital, floating-point-operators, square-root, squarer, rounding, truncation]
aliases:
  - Left-Truncated Squarers
  - Left Truncated Squarer
  - Correct Rounding from Faithful Square Root
  - Correctly Rounded Square Root
---

# Left-Truncated Squarer

A squarer that computes only the low columns of $S_0^2$ — the ones that can possibly differ from $X$ — because that is all the information needed to decide whether a faithful square root $S_0$ sits above or below the exact $\sqrt{X}$.

```tikz title="Left-truncated squarer deciding the sign of S0^2 - X"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % --- what has to be decided, on the real line ---------------------------
  \draw[->,thick] (0.2,4.6) -- (8.6,4.6);
  \foreach \p in {1,3,5,7} { \draw (\p,4.45) -- (\p,4.75); }
  \node[anchor=south] at (7.6,4.8) {\scriptsize grid $=$ \texttt{ufix}$(0,-w_F)$};
  \draw[red,thick] (4,4.35) -- (4,5.05);
  \draw[red,thick,|-|] (3,5.05) -- (5,5.05);
  \node[red,anchor=south] at (4,5.1) {\scriptsize $\sqrt{X}$ lies in here, width $2^{-w_F}$};
  \node[red,anchor=north] at (4,4.3) {\scriptsize $S_0$, LSB $=1$};

  % --- the deciding datapath ----------------------------------------------
  \node[anchor=south] at (2.0,2.9) {$S_0$};
  \draw[->] (2.0,2.9) -- (2.0,2.1);
  \node[anchor=west] at (2.1,2.5) {\scriptsize $w_F{+}2$};

  \node[anchor=south] at (6.7,2.9) {$X$};
  \draw[->] (6.7,2.9) -- (6.7,2.1);
  \node[anchor=west] at (6.8,2.5) {\scriptsize $w_F{+}2$};

  \draw (-0.2,1.1) rectangle (4.2,2.1);
  \node at (2.0,1.78) {left-truncated squarer};
  \node at (2.0,1.38) {\scriptsize columns $<2^{-w_F+1}$ only};

  \draw (5.0,1.1) rectangle (8.4,2.1);
  \node at (6.7,1.78) {low 2 bits of $X$};
  \node at (6.7,1.38) {\scriptsize weights $2^{-w_F+1},\,2^{-w_F}$};

  \draw[->] (2.0,1.1) -- (2.0,0.5);
  \node[anchor=west] at (2.1,0.8) {\scriptsize $w_F{+}4$};

  \draw[->] (6.7,1.1) -- (6.7,0.5);
  \node[anchor=west] at (6.8,0.8) {\scriptsize $2$};

  \draw (-0.2,-0.3) rectangle (8.4,0.5);
  \node at (4.1,0.1) {wrapping subtract on $w_F{+}4$ bits};

  \draw[->] (4.3,-0.3) -- (4.3,-1.0);
  \node[anchor=west] at (4.4,-0.65) {\scriptsize MSB $=$ sign of $S_0^2-X$, 1 bit};
  \node[anchor=north] at (4.3,-1.05) {round up $\Longleftrightarrow$ MSB $=1$};
\end{circuitikz}
\end{document}
```

*Own construction. The number line at the top is the square-root reading of Fig. 11.9, p. 352.*

**Start from a root that is faithful to one extra bit.** The input to the $\sqrt{\ }$ block of [[Floating-Point Square Root]] is the pre-normalized significand $X=M_X^\mathrm{norm}\in[1,4)$, format `ufix(1,`$-w_F$`)`, so $w_F+2$ bits with LSB weight $2^{-w_F}$. Ask the block for $S_0$ faithful not to the target format but to `ufix(0,`$-w_F-1$`)` — also $w_F+2$ bits, but with LSB weight $2^{-w_F-1}$, one binade finer:

$$\big|S_0-\sqrt{X}\big|<2^{-w_F-1}$$

Then the low bit of $S_0$ splits the problem in two, exactly as it does for the quotient in [[Correct Rounding from Faithful Quotient]]. If $\mathrm{LSB}(S_0)=0$, $S_0$ is already a `ufix(0,`$-w_F$`)` number and the bound puts $\sqrt X$ within half an ulp of it, so $S_0$ *is* the correctly rounded root and costs nothing. If $\mathrm{LSB}(S_0)=1$, $S_0$ is the midpoint of two consecutive representable significands and the bound says $\sqrt X$ lies inside that one-ulp interval — the red bracket above. Only the second case needs hardware, and it needs exactly one bit: which side of $S_0$ is $\sqrt X$ on.

**Replace the root by a square so the test is algebraic.** $t\mapsto t^2$ is strictly increasing on $\mathbb{R}^{+}$ and both $S_0$ and $\sqrt X$ are positive, so

$$\operatorname{sign}\big(S_0-\sqrt X\big)=\operatorname{sign}\big(S_0^2-X\big)$$

and the deciding hardware is a *squarer*, never a root extractor. This is the whole content of the transposition from division: where the divider forms the remainder $\sigma M_X-M_QM_Y$ with a multiplier, the square root forms $S_0^2-X$ with a squarer. The technique generalizes to any algebraic function — invert the function symbolically and evaluate the inverse, which is always polynomial (Sect. 16.3.1, p. 357).

**Bound the difference to find where the square may be cut.** Factor the difference of squares and bound each factor separately. $S_0<2$ and $\sqrt X<2$, so $S_0+\sqrt X<4$, and

$$\big|S_0^2-X\big|=\big|S_0-\sqrt X\big|\cdot\big(S_0+\sqrt X\big)<4\cdot2^{-w_F-1}=2^{-w_F+1}$$

Since $X$ has LSB weight $2^{-w_F}$, that is $2\,\mathrm{ulp}(X)$. Write $S_0^2=H+L$ where $H$ collects the columns of weight $\ge2^{-w_F}$ (a multiple of $u=2^{-w_F}$, like $X$) and $L\in[0,u)$ collects everything below. Then $H-X$ is a multiple of $u$ and $S_0^2-X=(H-X)+L$, so the bound forces

$$H-X\in\{-2u,\,-u,\,0,\,+u\}$$

— four cases, and in each of them the sign of $(H-X)+L$ is the sign of $H-X$ except when $H-X=0$, where it is $L\ge0$. The decision is therefore $[\,H\ge X\,]$, and $H$ and $X$ need only be compared **modulo $4u$**: their two lowest columns, weights $2^{-w_F+1}$ and $2^{-w_F}$. Everything of $S_0^2$ above $2^{-w_F+1}$ is dead weight.

> [!note] Left truncation is exact; right truncation is not
> A [[Truncated Multipliers|truncated multiplier]] drops the *low* columns and must inject a compensation constant, because those columns feed carries upward into the bits it keeps. Left truncation drops the *high* columns, and carries never propagate downward — a column of weight $2^k$ contributes only to weights $>2^k$. So the retained bits of a left-truncated squarer are **bit-exact**, with no compensation term and no error to analyse ([[Error Accuracy]] has nothing to say here). The two words look symmetric and the circuits are not: one is an approximation you must budget for, the other is free deletion of hardware you do not need.

**Make the comparison a wrap-around subtraction.** Keeping columns $2^{-w_F+1}$ down to $2^{-2w_F-2}$ gives $w_F+4$ bits of $S_0^2$; take the two low bits of $X$ into the same weights and subtract on those $w_F+4$ bits, discarding the borrow-out. Because the true difference satisfies $|S_0^2-X|<2^{-w_F+1}$, it fits in a two's-complement number with MSB weight $-2^{-w_F+1}$ and $w_F+4$ bits total, and the two's-complement identity means the wrapped result *is* that number. Its MSB is the answer: set means $S_0^2<X$, so $S_0<\sqrt X$ and the midpoint rounds up. No comparator, no sign-magnitude logic, one carry chain of $w_F+4$ bits ([[Adders]]).

**The zero case cannot occur.** $S_0^2=X$ would make $S_0$ an exact midpoint whose square is a floating-point number of the input format, and the tie proof of §11.4.3.1 (p. 356) rules that out: for $S=M+2^{-w_F-1}$ with $M$ in `ufix(0,`$-w_F$`)`, $S^2=M^2+2^{-w_F}M+2^{-2w_F-2}$ has a set bit at position $0$ or $1$ *and* a set bit at position $-2w_F-2$, spanning more than $w_F+1$ significant bits. So the square root, unlike a general algebraic function, never needs a tie rule bolted onto this circuit — see [[Number Formats]] for why the span argument settles representability.

**Count what the cut saves.** Let $n=w_F+2$ be the width of $S_0$. A full $n\times n$ multiplier heap carries $n^2$ AND terms; a squarer heap carries about $n^2/2$, because $s_is_j+s_js_i=2s_is_j$ folds each off-diagonal pair into a single term one column up ([[Squarers and Integer Powers]]). Left truncation keeps the cross terms with $i+j\le n$, roughly $\sum_{m\le n}m/2\approx n^2/4$ of them, plus about $n/2$ diagonal terms — so **half** the square's heap and a quarter of the multiplier's. The divider's deciding multiplier is left-truncated too, at $\approx n^2/2$; the square root's decision is therefore about half of it. On FPGAs both go through the same bit-heap flow and the discarded columns simply never enter the [[Compressor Trees|compressor tree]]; on ASIC the saving is the same Wallace-tree columns, unbuilt. What neither technology changes is the shape of the surviving heap: the widest column of a square sits in the middle, and the cut lands right there, so the retained part is the *tall* half — the depth of the compression tree falls by roughly one level, not by half.

> [!warning] The book states the transposition but never re-derives the bound
> §11.4.4 is four sentences long: "just replace $X/Y$ with $\sqrt{X}$ in Fig. 11.9, and determine the sign of $S_0-\sqrt X$ as that of $S_0^2-X$" (p. 356). It does not redo the truncation argument, and the answer is not identical to the divider's — the factor $S_0+\sqrt X<4$ costs one extra column, so the cut sits at $2^{-w_F+1}$ rather than the divider's $2^{-w_F}$, and the decision is a two-bit comparison rather than a single-bit match. The derivation above is this note's, following the divider's on p. 352. The book gives no architecture, no figure and no cost figure for the squarer itself; [Din+10] is the only cited source, and any LUT, DSP or delay number needs outside research or your own synthesis run.

$$\boxed{\ \operatorname{sign}\big(S_0^2-X\big)\;=\;\operatorname{MSB}\Big(\big(S_0^2\bmod 2^{-w_F+2}\big)-\big(X\bmod 2^{-w_F+2}\big)\Big)\ }$$

read as a $(w_F{+}4)$-bit two's-complement subtraction with the borrow-out discarded.

**When it breaks.**

- **The extra bit is the precondition, not a nicety.** With $S_0$ only faithful to `ufix(0,`$-w_F$`)`, the exact root has *three* candidate neighbours and one sign bit cannot choose between them. Whatever produces $S_0$ must be sized for $2^{-w_F-1}$, which is itself more expensive than a plain faithful root.
- **A wider $X$ moves the cut down.** The 2-ulp bound is measured in ulps of $X$'s format. Feed the circuit an $X$ carrying extra bits — a fused multiply-then-root, or a pre-scaled operand — and the retained column count grows one for one with $X$'s precision, and ties become possible again, so the zero case has to come back as a tie rule.
- **Restricting to the even-exponent half buys nothing.** If $X\in[1,2)$ only, $S_0+\sqrt X<2\sqrt2\approx2.83$ and the bound becomes $1.41\,\mathrm{ulp}$ — still above one ulp, so the extra column stays. The two-bit comparison is not an artefact of a loose bound.
- **Rounding up can never overflow the format**, and for a reason worth knowing: the largest $\sqrt X$ is $\sqrt{4-2^{1-w_F}}\approx2-2^{-w_F-1}-2^{-2w_F-4}$, a hair *below* the top midpoint, so round-to-nearest returns $2-2^{-w_F}$ and never $2.0$. That is the same Taylor expansion which, for a *faithful* root, produces the catastrophic single-input bug handled by the [[Faithful Square Root Normalization Unit]] — correct rounding closes it for free.
- **The economics usually say don't.** A squarer, a subtraction, a second rounding addition and the surrounding logic, to buy one bit. The book's conclusion for divide holds verbatim for square root: for the same accuracy it is often cheaper to keep the faithful result in a format one bit wider (pp. 352, 357). Build this only when the operator is user-visible or bit-reproducibility is a requirement — see [[Choosing a Floating-Point Operator]].

**RTL (Spade).**

```spade
/// WF = fraction width of the target format.
///   s = S0 * 2^(WF+1),  S0 faithful to ufix(0,-WF-1), S0 in [1,2)
///   x = X  * 2^WF,      X = M_X^norm in [1,4), format ufix(1,-WF)
/// Returns true when S0 < sqrt(X), i.e. the midpoint must be rounded up.
fn sqrt_round_up<#uint WF>(s: uint<{WF + 2}>, x: uint<{WF + 2}>) -> bool {
    let sw: uint<{WF + 4}> = zext(s);
    // left truncation: `*.` keeps only the low WF+4 columns of the square heap.
    let sq = sw *. sw;
    // X contributes only its two lowest bits, at weights 2^-WF and 2^-WF+1.
    let xlo: uint<2> = trunc(x);
    let pad: uint<{WF + 2}> = 0;
    let xs: uint<{WF + 4}> = xlo.concat(pad);
    (sq -. xs).msb()
}
```

`sw *. sw` is the left-truncated squarer box: the truncating multiply keeps the low $w_F+4$ bits, which is precisely the exact low part of the square, so synthesis never builds the $w_F$ discarded columns. `xlo.concat(pad)` is the "low 2 bits of $X$" box — `concat` on integers puts the left operand high, placing $X$'s two LSBs at weights $2^{-w_F+1}$ and $2^{-w_F}$ of the retained field. `-.` is the wrapping subtract that makes the two's-complement identity do the sign extraction, and `.msb()` is the output wire. Everything is combinational; a real operator would register this alongside the [[Floating-Point Rounding Adder]] that consumes the bit, and would share the heap with nothing else, since $S_0$ is not available until the $\sqrt{\ }$ block finishes.

Verified against a behavioural reference: 3008 vectors at $w_F=8$ (named asymmetric cases plus a 3000-point random sweep over faithful $(S_0,X)$ pairs) and 95 exhaustive vectors at $w_F=4$, all passing `sign(s*s - 2^(WF+2)*x)`.

**Related Notes.**

- [[Correct Rounding from Faithful Quotient]] – compares: the same construction one operator over, with a multiplier instead of a squarer and a one-bit rather than two-bit decision.
- [[Floating-Point Square Root]] – depends-on: supplies the pre-normalized $X$ and the $S_0$ this circuit judges.
- [[Faithful Square Root Normalization Unit]] – counter-example: the failure mode that appears when you stop one bit short of correct rounding, and vanishes here.
- [[Squarers and Integer Powers]] – extends: the folding that halves a square's heap before this note ever truncates it.
- [[Truncated Multipliers]] – compares: truncation at the other end, approximate and needing compensation, where this one is exact.
- [[Choosing a Floating-Point Operator]] – compares: whether the last ulp is worth this much silicon at all.
- [[Compressor Trees]] – supports: what the surviving columns are actually summed by.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §11.3.4 "Correct Rounding Out of a Faithfully Rounded Quotient", pp. 351–352, incl. Fig. 11.9 p. 352 — the truncation argument transposed here.
  - §11.4.1 "Baseline Square Root Architecture", pp. 353–354, incl. Fig. 11.10 p. 354 — formats of $X$ and $M_S$.
  - §11.4.2 "Faithful Floating-Point Square Root", p. 355 — the $M_X^\mathrm{max}$ Taylor expansion.
  - §11.4.3.1 "Tie Rule", p. 356 — why $S_0^2=X$ cannot happen.
  - §11.4.4 "Correct Rounding Out of Faithful Rounding for Square Root", pp. 356–357, and the closing remark on cost, p. 357.
- [Din+10] de Dinechin, Joldeş, Pasca, Revy, "Multiplicative square root algorithms for FPGAs", FPL 2010, pp. 574–577 (cited p. 356).
