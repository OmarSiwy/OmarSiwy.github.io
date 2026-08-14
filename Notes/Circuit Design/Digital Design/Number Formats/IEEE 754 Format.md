---
title: IEEE 754 Format
description: "Sign, biased exponent and a normalised significand whose leading 1 is never stored — a free bit of precision, unique representations, and 2^277 of dynamic range on 32 bits."
kind: concept
source: "ASA §2.5.1, pp. 48-52"
status: seed
spade: simulated
tags: [digital, number-formats, floating-point, ieee754, subnormals]
aliases:
  - IEEE 754
  - IEEEfloat
  - Binary Floating-Point Format
  - Floating-Point Format
  - binary32
  - binary16
  - Implicit Bit
  - Subnormal Numbers
---

# IEEE 754 Format

A sign–exponent–significand encoding in which the significand is *normalised* so that its leading bit is always $1$ and therefore never stored, which is what makes the representation both unique and one bit more precise than its width suggests.

```tikz title="Bit fields of IEEEfloat(wE,wF), the positive reals of IEEEfloat(3,2) on the real axis, and a zoom showing subnormals joining the first binade with no change of spacing"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.62cm,y=1cm,font=\footnotesize]

% ---------- the three bit fields ----------
\draw[fill=red!18]   (0,3.0) rectangle (1,3.55);   \node at (0.5,3.28) {$s$};
\draw[fill=violet!18](1,3.0) rectangle (6,3.55);   \node at (3.5,3.28) {$E$};
\draw[fill=green!14] (6,3.0) rectangle (15,3.55);  \node at (10.5,3.28) {$F$};

\draw[<->] (0,3.85) -- (1,3.85);  \node at (0.5,4.1) {$1$};
\draw[<->] (1,3.85) -- (6,3.85);  \node at (3.5,4.1) {$w_E$};
\draw[<->] (6,3.85) -- (15,3.85); \node at (10.5,4.1) {$w_F$};

\node[anchor=north] at (0.5,2.95) {sign};
\node[anchor=north] at (3.5,2.95) {unsigned int};
\node[anchor=north] at (10.5,2.95) {$\mathrm{ufix}(-1,-w_F)$};
\node[anchor=west]  at (15.4,3.28) {$w=1+w_E+w_F$ bits};
\node[anchor=west]  at (15.4,4.1)  {$X=(-1)^{s}\,2^{E-E_0+1-n}(n+F)$};
\node[anchor=west]  at (15.4,2.6)  {$n=[E\neq 0]$, \ $E_0=2^{w_E-1}-1$};
\node[anchor=west]  at (0,2.0) {$E=0$: subnormal or zero \quad $0<E<2^{w_E}-1$: normal \quad $E=2^{w_E}-1$: $\pm\infty$ ($F=0$) or NaN};

% ---------- the positive reals of IEEEfloat(3,2) ----------
\draw[->] (-0.4,0.6) -- (15.6,0.6) node[anchor=west] {$\mathbb{R}$};
\foreach \e in {-2,-1,0,1,2,3}{
  \foreach \k in {0,1,2,3}{
    \pgfmathsetmacro{\v}{(1+\k/4)*(2^\e)}
    \draw (\v,0.42) -- (\v,0.78);
  }
  \pgfmathsetmacro{\p}{2^\e}
  \draw[very thick] (\p,0.28) -- (\p,0.92);
}
\foreach \k in {0,1,2,3}{
  \pgfmathsetmacro{\u}{(\k/4)*(2^(-2))}
  \draw[red!70!black,very thick] (\u,0.44) -- (\u,0.76);
}
\node[anchor=south] at (0,0.95) {$0$};
\node[anchor=south] at (1,0.95) {$1$};
\node[anchor=south] at (2,0.95) {$2$};
\node[anchor=south] at (4,0.95) {$4$};
\node[anchor=south] at (8,0.95) {$8$};
\node[anchor=south] at (14,0.95) {$14$};
\draw[decorate,decoration={brace,amplitude=4pt,mirror}] (4,0.2) -- (8,0.2);
\node[anchor=north] at (6,0.05) {one binade: $2^{w_F}$ points};
\node[anchor=west] at (15.6,0.15) {positive half, $\mathrm{IEEEfloat}(3,2)$};

% ---------- zoom on [0,1] ----------
\draw[->] (-0.4,-1.5) -- (15.6,-1.5) node[anchor=west] {};
\foreach \k in {0,1,2,3}{
  \pgfmathsetmacro{\u}{15*(\k/4)*(2^(-2))}
  \draw[red!70!black,very thick] (\u,-1.68) -- (\u,-1.32);
}
\foreach \e in {-2,-1}{
  \foreach \k in {0,1,2,3}{
    \pgfmathsetmacro{\v}{15*(1+\k/4)*(2^\e)}
    \draw (\v,-1.68) -- (\v,-1.32);
  }
}
\draw[very thick] (15,-1.75) -- (15,-1.25);
\node[anchor=south] at (0,-1.22) {$0$};
\node[anchor=south] at (3.75,-1.22) {$2^{e_{\min}}$};
\node[anchor=south] at (15,-1.22) {$1$};
\draw[red!70!black,decorate,decoration={brace,amplitude=4pt,mirror}] (0,-1.85) -- (3.75,-1.85);
\draw[decorate,decoration={brace,amplitude=4pt,mirror}] (3.75,-1.85) -- (7.5,-1.85);
\node[anchor=north,red!70!black] at (1.9,-2.0) {subnormals, $E=0$};
\node[anchor=north] at (5.6,-2.0) {first binade};
\node[anchor=west] at (0,-2.65) {same absolute spacing $2^{e_{\min}-w_F}$: no gap at the join};
\node[anchor=west] at (15.6,-1.5) {zoom on $[0,1]$};

\end{circuitikz}
\end{document}
```

*after Figs. 2.11–2.13, pp. 49–50.*

**Split the word into three fields and fix what each one means.** A $w$-bit word is cut into a sign $s$ (1 bit), an exponent field $E$ ($w_E$ bits, read as a plain unsigned integer), and a fraction field $F$ ($w_F$ bits, read as $\mathrm{ufix}(-1,-w_F)$ so that $F\in[0,1)$ — see [[Unsigned Fixed-Point Format]] for that weight convention). Hence $w=1+w_E+w_F$, and the whole family is parameterised by two numbers; the book writes it $\mathrm{IEEEfloat}(w_E,w_F)$ even for $(w_E,w_F)$ pairs the standard never defined, which is exactly what application-specific hardware wants. Nothing above is a *value* yet: the meaning of the fields depends on which of three regions $E$ falls in, and that dispatch is the whole design.

**Normalise the significand, and the leading bit becomes free.** For $0<E<2^{w_E}-1$ the number is *normal* and

$$X_{\text{normal}}=(-1)^{s}\times(1+F)\times2^{E-E_{0}},\qquad E_{0}=2^{w_E-1}-1 \tag{2.12, 2.13}$$

The significand $1+F$ lies in $[1,2)$, so written in binary its leading digit is necessarily $1$ — never $0$, because a leading $0$ would put the value below $1$. A bit whose value is known everywhere in the domain carries no information and need not be stored: this is the **implicit bit**, and it buys a $(w_F+1)$-bit significand out of a $w_F$-bit field. The second, less advertised payoff is *uniqueness*. Without normalisation $1.00_2\times2^0$ and $0.10_2\times2^1$ would be two encodings of the same real; forcing the leading digit non-zero leaves exactly one, so equality of values is equality of encodings and a comparator never has to renormalise its inputs.

**The bias is a shift, so the exponent field stays unsigned.** Subtracting the constant $E_0=2^{w_E-1}-1$ — binary $011\ldots1$ — maps the unsigned range of $E$ onto a signed exponent without ever storing a signed number. Because the two extremal codes $E=0$ and $E=2^{w_E}-1$ are reserved, the usable field values are $E\in[1,2^{w_E}-2]$ and the actual exponent spans

$$e_{\min}=-2^{w_E-1}+2,\qquad e_{\max}=2^{w_E-1}-1 \tag{2.14, 2.15}$$

The asymmetry ($|e_{\min}|<|e_{\max}|+1$ by one) is the price of those two stolen codes, and it is precisely what [[Nfloat Format]] buys back.

**Freeze the exponent at $E=0$ to fill the gap around zero.** If $E=0$ meant "$e=e_{\min}-E_0$" the smallest positive number would be $2^{e_{\min}}$ and everything below it would collapse to zero — a hole in the number line $2^{w_F}$ times wider than the spacing just above it. Instead the standard drops the implicit bit and keeps the exponent at $e_{\min}$:

$$X_{\text{subnormal}}=(-1)^{s}\times(0+F)\times2^{e_{\min}} \tag{2.16}$$

Since $F$ steps by $2^{-w_F}$, subnormals are spaced $2^{e_{\min}-w_F}$ apart — the *same* absolute spacing as the first normal binade, which is why the zoom panel of the diagram shows no discontinuity at the join. The mathematical property this rescues is $x-y=0\Leftrightarrow x=y$: without subnormals, two distinct nearby numbers can differ by less than $2^{e_{\min}}$ and their difference rounds to zero. Zero itself is the case $F=0$, so it is a subnormal — and since $s$ is still a free bit there are two zeros, $+0$ and $-0$, whose only real justification is being the reciprocals of the two infinities. They compare equal.

**One formula covers both branches, at the cost of one comparator.** Introduce the "is normal" indicator $n=[E\neq0]$, which is both the implicit bit and the flag that decides whether the exponent is $E-E_0$ or frozen. Then (2.12) and (2.16) are the same expression:

$$n=\begin{cases}0 & \text{if } E=0\\ 1 & \text{otherwise}\end{cases}\qquad X=(-1)^{s}\times2^{E-E_{0}+1-n}\times(n+F) \tag{2.17, 2.18}$$

Check the seam: for $E=1,n=1$ the exponent is $1-E_0=e_{\min}$; for $E=0,n=0$ it is $0-E_0+1=e_{\min}$ as well, so the frozen exponent falls out of the algebra rather than being a special case in the hardware. In a datapath the significand is carried as the integer $M=n\cdot2^{w_F}+F\cdot2^{w_F}$, i.e. the $(w_F+1)$-bit concatenation $n\,\|\,F$, and $X=(-1)^{s}M\,2^{E-E_0+1-n-w_F}$.

**Exceptionals consume the top code.** $E=2^{w_E}-1$ encodes $\pm\infty$ when $F=0$ and NaN for any $F\neq0$; NaN quiet/signalling status and payloads live in the remaining fraction bits and are irrelevant to arithmetic hardware. So of the $2^{w_E}$ exponent codes, one is spent on subnormals-and-zero and one on infinities-and-NaN, leaving $2^{w_E}-2$ binades of normals.

> [!note] The bias exists so that a float comparator is an integer comparator
> With $E_0=011\ldots1$, the bit pattern of a non-negative float, read as an ordinary unsigned integer, is **monotone in the value** — across zero, subnormals, normals and $+\infty$ alike (Table 2.1, p. 51). Comparison, sorting, and "next/previous representable float" (an integer increment) therefore need no floating-point logic at all. A two's-complement exponent field would break the order at the exponent's sign boundary, putting all the tiny numbers above all the large ones. The whole layout — sign first, then exponent, then fraction, all big-endian — is chosen to make that lexicographic order coincide with the numeric one. For negative values the order reverses, so a full signed comparator is an integer comparator plus a conditional negation.

**The standard sizes trade $w_E$ against $w_F$ inside a fixed budget.**

| | binary16 | binary32 | binary64 | binary128 |
| --- | --- | --- | --- | --- |
| total bits | 16 | 32 | 64 | 128 |
| $w_F$ | 10 | 23 | 52 | 112 |
| $w_E$ | 5 | 8 | 11 | 15 |
| $e_{\min},e_{\max}$ | $-14,+15$ | $-126,+127$ | $-1022,+1023$ | $-16382,+16383$ |
| smallest subnormal | $6.0\cdot10^{-8}$ | $1.4\cdot10^{-45}$ | $4.9\cdot10^{-324}$ | $6.5\cdot10^{-4966}$ |
| smallest normal | $6.0\cdot10^{-5}$ | $1.2\cdot10^{-38}$ | $2.2\cdot10^{-308}$ | $3.4\cdot10^{-4932}$ |
| largest | $6.6\cdot10^{4}$ | $3.4\cdot10^{38}$ | $1.8\cdot10^{308}$ | $1.2\cdot10^{4932}$ |

*Table 2.2, p. 52.* The dynamic range is what the format is for: binary32 spans $3.4\cdot10^{38}/1.4\cdot10^{-45}\approx2.4\cdot10^{83}\approx2^{277}$, so a fixed-point format holding the same largest value at the same smallest resolution needs $277$ bits. Thirty-two bits buy that range by spending $w_E=8$ of them on a *scale* instead of on magnitude — which is also the whole cost: relative precision is fixed at $2^{-w_F}$ everywhere, so the spacing grows with the value, and every arithmetic result must be rounded back onto the grid. See [[Error Accuracy]] for the ulp and relative-error machinery; the geometry in the diagram — $2^{w_F}$ equally spaced points per binade, binades doubling in width — is its whole content.

> [!warning] Source error: Table 2.2, p. 52 lists $2^{-w_F}\approx3\cdot10^{-8}$ for binary32
> With $w_F=23$ the correct value is $2^{-23}=1.19\cdot10^{-7}$. Even the half-ulp relative bound $2^{-24}=5.96\cdot10^{-8}$ is not $3\cdot10^{-8}$ (that is $2^{-25}$). The binary16, binary64 and binary128 entries in the same row all agree with $2^{-w_F}$, so this is a typo in the one column, not a different quantity.

**In hardware the encoding is nearly free and the decoding is not.** Field extraction costs nothing — it is a wire split, on FPGA and ASIC alike — and recovering $n$ is one $w_E$-input NOR ($\lceil w_E/k\rceil$ LUTs on a $k$-input FPGA, one small gate in an ASIC). What is expensive is everything downstream of the *normalisation invariant*: because every result must be pushed back into $[1,2)$, every operator ends with a leading-zero count and a variable shift, and supporting subnormals adds a second such shifter on the input side to denormalise operands. Exception handling is worse than it looks in a pipeline: each operator must decode $\pm\infty$/NaN out of the exponent field at its inputs and re-encode them at its outputs, when in a fixed pipeline it would be strictly cheaper to forward two exception wires — which is exactly the trade [[Nfloat Format]] makes.

$$\boxed{\ X=(-1)^{s}\times2^{E-E_{0}+1-n}\times(n+F),\quad n=[E\neq0],\quad E_{0}=2^{w_E-1}-1\ }$$

**When it breaks.**

- **Subnormal support is a design decision, not a given.** It costs a denormalising shifter and a leading-zero counter in *every* operator, and many application-specific pipelines flush to zero instead. One extra exponent bit buys more usable range than subnormals do, far more cheaply.
- **The two zeros leak.** $+0$ and $-0$ compare equal but are distinct bit patterns, so a bitwise equality check, a hash, or a sort on the integer reinterpretation will separate them.
- **Monotone-as-integer only holds for one sign.** The trick that makes a comparator cheap needs a conditional negation before it works across the sign boundary.
- **The reserved codes cost a binade at each end.** If the value range is known at design time — which is what "application-specific" means — those codes are pure waste; see [[Nfloat Format]].
- **8-bit and 16-bit instances are storage formats.** At small $w_F$ the accumulation of a sum of products must be carried wider than the format, or rounding dominates the result.

**RTL (Spade).** Decode is the only part of IEEE 754 that is purely combinational and format-generic, so that is what the block builds: word in, $(s,\ \text{class},\ M,\ e)$ out, valid for any $(w_E,w_F)$.

```spade
/// Decode an IEEEfloat(WE, WF) word into sign, exception class, significand
/// (implicit bit restored) and unbiased exponent, per eq. (2.17)-(2.18).
fn ieee_decode<#uint WE, #uint WF>(x: uint<{WE + WF + 1}>)
    -> (bool, uint<2>, uint<{WF + 1}>, int<{WE + 1}>)
{
    let b = x.as_bits();
    let f: uint<WF>  = b[0..WF].as_uint();
    let ef: uint<WE> = b[WF..WF+WE].as_uint();
    let s: bool      = x.msb();

    // E0 = 2^(WE-1) - 1 is the bit pattern 0111...1
    let low: uint<{WE - 1}> = 0;
    let bias: uint<WE> = zext(~low);
    let zero_e: uint<WE> = 0;

    let n: bool   = ef != zero_e;      // implicit bit / "is normal"
    let top: bool = ef == ~zero_e;     // reserved code: infinity or NaN

    let m: uint<{WF + 1}> = n.as_uint().concat(f);

    let diff: int<{WE + 2}> = ef.to_int() - bias.to_int();
    let bump: int<{WE + 2}> = if n { 0 } else { 1 };   // the "+1-n" of (2.18)
    let e: int<{WE + 1}> = trunc(diff + bump);

    let exn: uint<2> = if top {
        if f == 0 { 0b10 } else { 0b11 }               // inf / NaN
    } else {
        if n || (f != 0) { 0b01 } else { 0b00 }        // finite / zero
    };

    (s, exn, m, e)
}
```

`x` is the whole $w=1+w_E+w_F$-bit word of the diagram's top panel; `b[0..WF]` is $F$, `b[WF..WF+WE]` is $E$, and `x.msb()` is $s$ — all three are wire splits, no logic. `m` is the $(w_F+1)$-bit significand with the implicit bit `n` concatenated on top, which is the diagram's normalisation invariant made physical. `e` is signed and $w_E+1$ bits: the bias subtraction naturally produces $w_E+2$, and the extra bit is truncated only after the $+1-n$ correction, so the frozen subnormal exponent and the normal exponent share one adder. Everything here is a `fn`, hence combinational — the synthesised cost is one $w_E$-input NOR, one $w_E$-input AND and a $(w_E{+}2)$-bit constant subtractor, and synthesis will fold that subtractor into the surrounding logic rather than instantiate it as drawn.

Verified with `spade 0.19.0` and simulated through `.zettel/sim.sh` on a concrete `ieee_decode::<5,10>` (binary16) wrapper against an independent behavioural Verilog model: **68 549 vectors pass**, comprising 13 named corner cases ($\pm0$, smallest and largest subnormal, smallest and largest normal, $1.0$, $-5.0$, $\pm\infty$, NaN, and the asymmetric `0x0080`/`0x4900`), a 3000-vector random sweep, and an exhaustive sweep of all $65\,536$ binary16 codes.

**Related Notes.**

- [[Nfloat Format]] – compares: takes the same $(w_E,w_F)$ and moves all four special cases into an explicit 2-bit `exn` field, spending two bits of width to delete the decode/encode logic this format forces on every operator.
- [[Floating-Point Operators]] – extends: every adder, multiplier and comparator in that hub opens with exactly this decode and closes with its inverse.
- [[Unsigned Fixed-Point Format]] – depends-on: $F$ is a $\mathrm{ufix}(-1,-w_F)$ field, and that note fixes the bit-weight convention it is read with.
- [[Error Accuracy]] – supports: converts the binade geometry above into the ulp and relative-error bounds every rounded operator is specified by.
- [[Signed Fixed-Point Format]] – counter-example: constant *absolute* spacing across the whole range, where this format has constant *relative* spacing within each binade.
- [[Choosing a Number Format]] – compares: where floating point wins and loses against fixed-point and logarithmic representations.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), §2.5.1 "The IEEE 754 Formats", pp. 48–52.
- Fig. 2.11 (bit fields), p. 49; Fig. 2.12 (normals on the real axis) and Fig. 2.13 (zoom on the subnormals), pp. 49–50.
- Eqs. (2.12)–(2.18), pp. 49–51.
- §2.5.1.4 "Motivation for the Biased Exponent" and Table 2.1 (binary16 encoding), p. 51.
- Table 2.2 (standard formats), p. 52 — see the warning above.
