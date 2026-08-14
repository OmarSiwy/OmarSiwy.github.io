---
title: "Half-Unit Biased Format"
description: "An implicit trailing 1 at weight 2^(l-1) makes negation a bitwise inversion and makes rounding-to-nearest exactly free, at the price of never representing zero."
kind: circuit
source: "ASA §3.1.6, pp. 71-73"
status: seed
spade: simulated
tags: [digital, error-accuracy, fixed-point, rounding, hub, fpga]
aliases:
  - HUB
  - HUB format
  - HUB Format
  - Half-Unit Biased
  - Half-Unit Biased (HUB) Format
---

# Half-Unit Biased Format

A fixed-point encoding whose stored code is offset by a constant, never-stored half-ulp, which buys carry-free negation and free round-to-nearest at the cost of an exact zero.

```tikz title="A signed 3-bit HUB code, its implicit half-ulp, and the grid of values it represents"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  bit/.style={draw, minimum width=9mm, minimum height=7mm, inner sep=0pt},
  imp/.style={draw, dashed, minimum width=9mm, minimum height=7mm, inner sep=0pt, fill=black!8}]

  % ---- stored code: signed HUB, 3 bits, m=0, l=-2 -------------------
  \begin{scope}[xshift=32mm]
    \node[bit] (s)  at (0,0)   {$s$};
    \node[bit] (b1) at (0.9,0) {$b_{-1}$};
    \node[bit] (b2) at (1.8,0) {$b_{-2}$};
    \node[imp] (bh) at (2.7,0) {$1$};
    \node[font=\scriptsize] at (0,0.62)   {$-2^{0}$};
    \node[font=\scriptsize] at (0.9,0.62) {$2^{-1}$};
    \node[font=\scriptsize] at (1.8,0.62) {$2^{-2}$};
    \node[font=\scriptsize] at (2.7,0.62) {$2^{-3}$};
    \fill (0.45,-0.47) circle (0.05);
    \draw[|<->|] (-0.45,-0.9) -- node[below,font=\scriptsize]{3 stored bits, $u=2^{-2}$} (2.25,-0.9);
    \draw[->,>=stealth] (4.1,-0.75) -- (2.95,-0.25);
    \node[anchor=west,font=\scriptsize,align=left] at (4.1,-0.95)
      {implicit half-ulp $2^{\ell-1}$:\\never stored, never routed};
  \end{scope}

  % ---- number line: value(c) = (c + 1/2)*2^-2 -----------------------
  \begin{scope}[yshift=-40mm, xshift=-45mm]
    \fill[black!10] (9,-0.16) rectangle (10.5,0.16);
    \draw[->,>=stealth] (-0.5,0) -- (12.7,0) node[right,font=\scriptsize]{value};
    \foreach \code/\val in {%
        {011}/0.875, {010}/0.625, {001}/0.375, {000}/0.125,
        {111}/-0.125, {110}/-0.375, {101}/-0.625, {100}/-0.875}
      { \draw ({6*\val+6},-0.16) -- ({6*\val+6},0.16);
        \node[font=\scriptsize] at ({6*\val+6},0.44) {\texttt{\code}}; }
    \foreach \val in {0.875, 0.375, -0.125, -0.625}
      { \node[font=\scriptsize] at ({6*\val+6},-0.42) {$\val$}; }
    \foreach \val in {0.625, 0.125, -0.375, -0.875}
      { \node[font=\scriptsize] at ({6*\val+6},-0.86) {$\val$}; }

    \node[ocirc] at (6,0) {};
    \node[font=\scriptsize,align=center] at (6,1.32) {$0$ is not\\representable};
    \draw[->,>=stealth] (6,0.95) -- (6,0.18);

    \draw[dashed] (2.25,0.66) -- (2.25,2.05);
    \draw[dashed] (9.75,0.66) -- (9.75,2.05);
    \draw[<->,>=stealth] (2.25,2.05) -- node[above,font=\scriptsize]
      {\texttt{101} and \texttt{010} are bitwise complements: negation costs no carry} (9.75,2.05);

    \draw[dotted] (9,0.16) -- (9,-1.25);
    \draw[dotted] (10.5,0.16) -- (10.5,-1.25);
    \node[font=\scriptsize,align=center] at (9.75,-1.52)
      {every $x\in[\tfrac12,\tfrac34)$ truncates to \texttt{010}\\error $\le 2^{-3}=\tfrac12 u$, no adder};
  \end{scope}
\end{circuitikz}
\end{document}
```

*constructed from Tables 3.1 and 3.2, p. 72.*

**Shift the grid by half a quantum instead of shifting the value.** Take any signed fixed-point format $\mathrm{sfix}(m,\ell)$ from [[Fixed-Point Representations]], on $w=m-\ell+1$ bits, with $u=\mathrm{ulp}=2^{\ell}$. The HUB variant stores the *same* $w$-bit two's-complement code $c$ and declares that the value it denotes is

$$v(c) \;=\; \big(c+\tfrac12\big)\,2^{\ell} \;=\; c\,2^{\ell}+2^{\ell-1}.$$

Every stored bit keeps its weight; one extra bit of weight $2^{\ell-1}$ is appended and hard-wired to $1$. Because that bit is a constant it is never stored, never registered and never routed — the width of a HUB signal is $w$, exactly as before. All that changed is which reals the $2^{w}$ codes name: odd multiples of $u/2$ rather than multiples of $u$. Formalised by Hormigo and Villalba, and used here only as an *internal* format.

> [!warning] The book's own format label is inconsistent
> Table 3.1 is captioned "the signed $\mathrm{HUB}(1,-2)$ representation" but lists 3-bit codes `0.11 … 1.00` spanning $[-0.875, 0.875]$. Under the book's own convention (§2.2, $w=m-\ell+1$, MSB weight $2^{m}$), $\mathrm{sfix}(1,-2)$ is **4** bits spanning $[-2,1.75]$; the table is $\mathrm{sfix}(0,-2)$ plus $2^{-3}$. The "1" is a `Qi.f`-style *count* of integer bits, not the MSB position $m$. Read HUB's first parameter off the bit pattern, not off the caption.

**Symmetry about zero is what makes negation an inverter row.** The representable set $\{(c+\tfrac12)u : c \in [-2^{w-1}, 2^{w-1})\}$ contains $(c+\tfrac12)u$ iff it contains $-(c+\tfrac12)u = (-c-1+\tfrac12)u$, and $-c-1$ is in range whenever $c$ is. So the set is closed under negation — unlike two's complement, whose most negative code has no positive partner. The code that realises it is exactly the bitwise complement, by the two's-complement identity $\bar{c} = -c-1$:

$$v(\bar c) \;=\; \big(\bar c+\tfrac12\big)u \;=\; \big({-c}-1+\tfrac12\big)u \;=\; -\big(c+\tfrac12\big)u \;=\; -v(c).$$

Two's complement needs $-x = \bar x + 1$, and that $+1$ is an increment across the whole word — a $w$-bit carry propagation. HUB absorbs the $+1$ into the format itself, so negation is $w$ independent inverters: zero carry, zero depth beyond one gate. Read it off the diagram: $\texttt{010}\mapsto\texttt{101}$, $0.625\mapsto-0.625$.

**Round-to-nearest degenerates into truncation because the grid points sit at the truncation midpoints.** Let $x$ be any real and let $c=\lfloor x/u \rfloor$, i.e. plain truncation of $x$ to $\ell$ — dropping bits, free. Then $x = (c+f)u$ with $f\in[0,1)$, and the HUB value that code denotes is $(c+\tfrac12)u$, so

$$\delta \;=\; v(c)-x \;=\; \big(\tfrac12-f\big)u \;\in\; \big(-\tfrac12 u,\ \tfrac12 u\big].$$

That is the half-ulp bound of round-to-nearest, obtained with the hardware cost of truncation. This is the point of the format: [[Rounding]] to nearest normally costs one addition of $2^{\ell-1}$ — Eq. (3.1) — and the whole trade-off of that section is whether that adder is cheaper than one extra output bit. HUB dissolves the question by paying the $2^{\ell-1}$ once, symbolically, at format-definition time.

**HUB $\to$ HUB rounding is strictly better than half an ulp, which is what faithfulness wants.** Round a $\mathrm{HUB}(m,\ell_1)$ value into $\mathrm{HUB}(m,\ell_2)$, $\ell_2>\ell_1$, by the same truncation — drop the low $g=\ell_2-\ell_1$ bits of the code. Write $c_1 2^{\ell_1} = c_2 2^{\ell_2} + r$ with $r$ a multiple of $2^{\ell_1}$ in $[0,2^{\ell_2})$. Then

$$\delta \;=\; v_2(c_2)-v_1(c_1) \;=\; 2^{\ell_2-1}-r-2^{\ell_1-1},$$

which over $r\in\{0,2^{\ell_1},\dots,2^{\ell_2}-2^{\ell_1}\}$ ranges symmetrically over $\pm(2^{\ell_2-1}-2^{\ell_1-1})$. The bound is *attained but never equal to a half ulp*: the source grid consists of odd multiples of $2^{\ell_1-1}$ and the target midpoints are multiples of $2^{\ell_2}$, which are **even** multiples of $2^{\ell_1-1}$ since $\ell_2-\ell_1+1\ge 2$ — so a source point can never land on a target midpoint. The strict inequality $\delta<\tfrac12\mathrm{ulp}$ that a [[Faithful Operator]] argument needs comes out of the format for free, with no guard bit spent to buy it.

**On FPGA the saving is a carry chain, not LUTs.** A two's-complement negation is an inverter row plus a carry-propagate increment, and on FPGA an increment is a full carry-chain row: one LUT and one carry cell per bit, plus the chain's placement constraint, which pins the operand to a column. HUB negation is $w$ inverters, and an inverter never costs a LUT on its own — it folds into the truth table of whichever LUT consumes the signal, so a HUB sign flip is genuinely free, not merely cheap. In [[CORDIC]] and in symmetric-coefficient FIR structures the negation sits *inside* the recurrence, so removing its carry propagation shortens the critical path rather than just shrinking area. See [[FPGAs]] for what a carry-chain row actually costs.

$$\boxed{\ v(c)=\big(c+\tfrac12\big)2^{\ell},\qquad v(\bar c)=-v(c),\qquad \lfloor x\rceil_{\mathrm{HUB}}=\lfloor x\rfloor_{\ell}\ }$$

**When it breaks.**

- **Zero is not representable.** The nearest values are $\pm 2^{\ell-1}$. Anything that must detect, produce or preserve an exact zero — a reset value, a zero-flush, a comparison against $0$, a multiplier that must return exact $0$ — needs either a plain format or an out-of-band flag. This alone is why the book keeps HUB internal rather than building whole systems in it.
- **HUB is not closed under addition.** HUB values are odd multiples of $u/2$; a sum of two odd multiples is an even multiple, so $a+b=(A+B+1)u$ lands *exactly* on a midpoint of the HUB grid at every scale. Every HUB addition is therefore a tie, and rounding it back into HUB costs the full $\tfrac12 u$ every time, one-signed. The addition itself is still one ordinary two's-complement add (the $+1$ folds into the carry-in), but the accuracy argument that justified the format does not survive it.
- **Mixing formats costs a conversion.** A HUB code and a plain code of the same width are different numbers; feeding one into an operator expecting the other is a silent $2^{\ell-1}$ bias. Conversions are cheap (append/strip the constant bit, then re-round) but they must be *deliberate*, which is an interface-discipline cost, not a gate cost.
- **The win vanishes if the half-ulp was already free.** When the rounding constant can be dropped into a bit heap column or an unused carry-in that the architecture already provides, plain round-to-nearest costs nothing either, and HUB's zero problem buys you nothing.

> [!warning] HUB arithmetic operators are not covered in the source
> §3.1.6 (pp. 71-73) defines the format and proves the two properties above; it gives no adder, multiplier or accumulator structure, and no area or delay figures. The closure argument above is derived here from the definition, not quoted. The cited HUB operator designs (Hormigo & Villalba HV14/HV16a/HV16b, Chap. 17 for multipartite) are outside this chapter.

**RTL (Spade).**

```spade
/// HUB(m, l) code: W = m - l + 1 two's-complement bits.
/// value(c) = (c + 1/2) * 2^l  -- the trailing 1 at weight 2^(l-1) is implicit.

/// Negation: bitwise inversion, no carry propagation.
fn hub_neg<#uint W>(c: int<W>) -> int<W> { ~c }

/// Round-to-nearest into HUB: drop the G low bits. G = l2 - l1.
fn hub_round<#uint WIN, #uint G>(x: int<WIN>) -> int<{WIN - G}> {
    x.as_bits()[G..WIN].as_int()
}
```

`hub_neg` is the $w$-inverter row of the diagram; it is combinational and its width is unchanged, `int<W>` to `int<W>`, because HUB negation never carries. `hub_round` is the drop-the-low-bits truncation: `WIN` bits in, `WIN - G` out, with the sign bit surviving as the new MSB — taking the top bits of a two's-complement word *is* $\lfloor\cdot\rfloor$, which is why the same slice serves both a general-real input and a HUB input. Synthesis emits nothing for either: `hub_round` is pure rewiring, and the inverters of `hub_neg` are absorbed into the downstream LUTs, so the drawing's two blocks have no silicon of their own.

Simulated with `hub_neg3` and `hub_round12to3` (input $\mathrm{sfix}(0,-11)$, output the 3-bit HUB code of the diagram): 7 named vectors including the four rows of Table 3.2 and the asymmetric pair $\pm\tfrac12$, all $4096$ inputs checked against **both** bounds ($|\delta|\le 2^{-3}$ from a general real, $|\delta|\le 2^{-3}-2^{-12}$ read as HUB $\to$ HUB), all 8 codes checked for $v(\bar c)=-v(c)$, plus 6000 random vectors against `>>>` and `~`.

**Related Notes (with context):**

- [[Fixed-Point Representations]] – depends-on: supplies $w=m-\ell+1$, the weight of every bit and the two's-complement identity $\bar c=-c-1$ that the negation proof rests on.
- [[Truncation Unit]] – compares: identical hardware, drop the low bits; into a plain grid it is a $1$-ulp one-signed error, into a HUB grid a symmetric half-ulp one.
- [[CORDIC]] – extends: the rotation recurrence negates once per stage inside the loop, so carry-free negation shortens the critical path, not just the area.
- [[Multipartite Methods]] – extends: HUB is the internal format of the table-plus-adder decomposition, where the free half-ulp is spent on the error budget instead of on guard bits.
- [[LTI Filters]] – supports: FIR datapaths are the book's first cited application of HUB as an internal format.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

| § | Topic | Pages |
| --- | --- | --- |
| 2.2.1-2.2.2 | $\mathrm{ufix}/\mathrm{sfix}(m,\ell)$, $w=m-\ell+1$, bit weights, Figs. 2.4-2.5 | 40-42 |
| 3.1.3-3.1.4 | round-to-nearest Eq. (3.1); truncation versus rounding | 68-70 |
| 3.1.6 | half-unit biased format, Tables 3.1-3.2, HUB $\to$ HUB bound | 71-73 |

Long-form source: [[1.2) Error Accuracy]], §§ "Half-Unit Biased (HUB) Format", "Trade-offs".
