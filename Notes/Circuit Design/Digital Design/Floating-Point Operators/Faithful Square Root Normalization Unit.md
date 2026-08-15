---
title: Faithful Square Root Normalization Unit
description: "Fixes the single input value where a faithful square root may return 2.0, unrepresentable in the output format: widen MS by one bit and let its MSB mux between ES and a precomputed ES+1. One value, catastrophically wrong, invisible to random testing."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-operators, square-root, normalization, faithful-rounding]
aliases:
  - Square Root Normalization Unit
  - Faithful Square Root Normalisation Unit
  - Faithful Square Root Overflow Fix
---

# Faithful Square Root Normalization Unit

A one-bit-wide patch on the output of a faithfully rounded floating-point square root: it widens $M_S$ by a single bit and uses that bit to select between $E_S$ and a precomputed $E_S+1$ — the only normalizer in arithmetic that needs no shifter, no significand multiplexer and no second rounding step.

```tikz title="Faithful square root output stage: widened M_S, MSB muxing E_S against E_S+1"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small,
  blk/.style={draw, rounded corners=1pt, align=center, inner sep=4pt}]

  % ---- upstream: exponent adder and the faithful square-root block ----
  \node[blk, minimum height=0.9cm] (ea) at (-3.2,5.0) {exponent\\adder};
  \node[blk, minimum width=2.2cm, minimum height=1.0cm] (sq) at (1.5,5.0) {$\sqrt{\,M_X\,}$};

  \draw[->] (1.5,6.3) -- (sq.north);
  \node[anchor=west] at (1.75,6.15) {$M_X^{\mathrm{norm}}\in[1,4)$};
  \node[anchor=west] at (1.75,5.85) {\scriptsize\texttt{ufix(1,}$-w_F$\texttt{)}};
  \draw[->] (-3.2,6.3) -- (ea.north);
  \node[anchor=east] at (-3.45,6.15) {$E_X,\;e$};

  % ---- M_S bus out of the faithful sqrt, one bit wider than the baseline ----
  \draw (sq.south) -- (1.5,3.2);
  \node[anchor=west] at (1.75,4.15) {$M_S\in[1,2]$};
  \node[anchor=west] at (1.75,3.85) {\scriptsize\texttt{ufix(1,}$-w_F$\texttt{)}, $w_F+2$ bits};

  % MSB tap (weight 2^1) -> mux select
  \draw[->] (1.5,3.2) -- (-0.4,3.2) -- (-0.4,1.9) -- (-1.3,1.9);
  \node[anchor=south] at (0.55,3.25) {\scriptsize $1$};
  \node[anchor=west] at (-0.35,2.4) {\scriptsize MSB, $2^1$};

  % low w_F bits go straight to pack, untouched
  \draw[->] (1.5,3.2) -- (1.5,0.8);
  \node[anchor=west] at (1.6,1.9) {\scriptsize $w_F$ LSBs $=F_R$};

  % ---- the normalization unit itself ----
  \draw[dashed, gray] (-4.35,1.35) rectangle (-1.0,3.95);
  \node[gray, rotate=90, anchor=south] at (-4.45,2.65) {\scriptsize normalization unit};

  \node[blk, minimum width=1.0cm, minimum height=0.7cm] (inc) at (-1.85,3.3) {$+1$};
  \node[blk, minimum width=2.4cm, minimum height=0.75cm] (mx) at (-2.55,1.9) {mux};

  \draw (ea.south) -- (-3.2,4.0);
  \node[anchor=east] at (-3.3,4.35) {\scriptsize $w_E$};
  \draw[->] (-3.2,4.0) -| (inc.north);
  \draw[->] (-3.2,4.0) -- (-3.2,2.275);
  \draw[->] (inc.south) -- (-1.85,2.275);
  \node[anchor=south east] at (-3.2,2.3) {\scriptsize $E_S$};
  \node[anchor=south east] at (-1.92,2.3) {\scriptsize $E_S{+}1$};

  % ---- pack ----
  \node[blk, minimum width=7.2cm, minimum height=0.7cm] (pk) at (-0.7,0.45) {exception handling \& pack};
  \draw[->] (mx.south) -- (-2.55,0.8);
  \node[anchor=east] at (-2.65,1.15) {\scriptsize $w_E$};
  \draw[->] (pk.south) -- (-0.7,-0.35);
  \node[anchor=west] at (-0.6,-0.2) {$R$};

\end{circuitikz}
\end{document}
```

*after Fig. 11.10, p. 354, with the modification prescribed in Sect. 11.4.2, p. 355.*

**Start from the guarantee this unit exists to repair.** The baseline [[Floating-Point Square Root]] is the cheapest of the four basic operators precisely because it needs no normalizer: the 1-bit pre-normalization delivers $M_X^{\mathrm{norm}}\in[1,4)$ on `ufix(1,`$-w_F$`)` ($w_F+2$ bits), and the square root is monotone, so $M_S=\sqrt{M_X^{\mathrm{norm}}}\in[1,2)$ — already the target format `ufix(0,`$-w_F$`)`, $w_F+1$ bits, weights $2^0$ down to $2^{-w_F}$. The book states the guarantee in its strongest form: *a correctly rounded $M_S$ is necessarily already normalized* (p. 354). The word doing the work is **correctly**. Weaken the $\sqrt{\ }$ block to faithful and the guarantee fails — at exactly one value of $M_X^{\mathrm{norm}}$.

**Locate the failing value by expanding the square root at the top of the interval.** The largest pre-normalized significand is $M_X^{\max}=2\,(2-2^{-w_F})=4-2^{1-w_F}$. Write $\varepsilon=2^{1-w_F}$ and factor the $4$ out so the expansion is around $1$:

$$\sqrt{4-\varepsilon}=2\sqrt{1-\tfrac{\varepsilon}{4}}$$

Then the binomial series $\sqrt{1-u}=1-\tfrac{u}{2}-\tfrac{u^2}{8}-O(u^3)$ at $u=\varepsilon/4$ gives, to second order,

$$\sqrt{M_X^{\max}}=2-\tfrac{\varepsilon}{4}-\tfrac{\varepsilon^2}{64}-O(\varepsilon^3)\approx 2-2^{-w_F-1}-2^{-2w_F-4}$$

**Read that number against the output grid.** The largest number representable in `ufix(0,`$-w_F$`)` is $2-2^{-w_F}$, and the next point up on the grid — $2.0$ — is outside the format. The exact square root lands at $2-2^{-w_F-1}$, the **midpoint** of those two, minus a hair of $2^{-2w_F-4}$. Faithfulness only promises $|M_S-\sqrt{M_X^{\mathrm{norm}}}|<2^{-w_F}$ ([[Error Accuracy]]), and

$$\big|2.0-\sqrt{M_X^{\max}}\big|=2^{-w_F-1}+2^{-2w_F-4}\;<\;2^{-w_F}$$

so a faithful $\sqrt{\ }$ block is fully entitled to return $M_S=2.0$. Correct rounding would have picked $2-2^{-w_F}$, being below the midpoint; faithful rounding declines to choose. This is the whole gap between the two accuracy contracts, made concrete on one input.

**The failure mode is a factor of two, not an ulp.** $2.0$ has its single set bit at weight $2^1$, one position above the top of the `ufix(0,`$-w_F$`)` bus of Fig. 11.10. Truncating the bus discards it and leaves $w_F+1$ zeros, which the pack stage reads as the implicit leading one with an all-zero fraction — the encoding of $1.0$. So $\sqrt{4-2^{1-w_F}}$ comes back as $1.0\times2^{E_S}$ instead of $\approx2.0\times2^{E_S}$: a relative error of $50\%$ from an operator whose specification promised one ulp, and the same for every input whose significand is $M_X^{\max}$, i.e. all $4^i M_X^{\max}$ (p. 355).

> [!important] One value out of $2^{w_F}$, and random testing will never find it
> $M_X^{\max}$ is a single point in a mantissa space of size $2^{w_F}$. A uniform random test bench hits it with probability $2^{-w_F}$ — one draw in $8.4$ million for binary32, one in $9\times10^{15}$ for binary64. A faithful $\sqrt{\ }$ block may also, by luck, return the correctly rounded $2-2^{-w_F}$ here and be perfectly correct without the fix (p. 355). Neither "it passed a billion random vectors" nor "this implementation happens to be fine" is an argument; the input is known and named, so test it by name.

**Fix it by widening the bus, not by shifting the significand.** Three repairs are available: clamp $\sqrt{M_X^{\max}}$ to $2-2^{-w_F}$ ad hoc, saturate inside the $\sqrt{\ }$ block, or add this explicit normalization unit (p. 355). The unit widens $M_S$ to `ufix(1,`$-w_F$`)` — $w_F+2$ bits, weights $2^{1}$ down to $2^{-w_F}$ — and treats the new MSB $m_1$ as an overflow flag driving a $w_E$-bit 2:1 multiplexer between $E_S$ and $E_S+1$.

**The reason it costs nothing on the significand side is a lemma, not luck.** Since $M_X^{\mathrm{norm}}<4$ and the square root is monotone, $\sqrt{M_X^{\mathrm{norm}}}<2$; combined with the faithfulness bound this gives $M_S<2+2^{-w_F}$. On the `ufix(1,`$-w_F$`)` grid the successor of $2$ is $2+2^{-w_F}$, which the strict inequality excludes. Therefore

$$m_1=1\;\Longrightarrow\;M_S=2.0\ \text{exactly}\;\Longrightarrow\;m_i=0\ \ \text{for all}\ i<1$$

The low $w_F$ bits are *already* the correct fraction field in both cases: when $m_1=0$ the number is normalized with its leading one at weight $2^0$ and the low $w_F$ bits are $F_R$ by definition; when $m_1=1$ they are all zero, and $1.0\times2^{E_S+1}=2.0\times2^{E_S}$ is exactly the value wanted. One wire serves both branches. This is why — unlike the multiplier and the divider, where a post-normalization shift exposes a fresh round bit and forces a second rounding addition ([[Floating-Point Rounding Adder]], [[Faithful Floating-Point Multiplier]]) — **no rounding step follows this normalization** (p. 355).

**On the exponent side the cost is one incrementer, and it is off the critical path.** $E_S=\lfloor E_X/2\rfloor+\lfloor E_0/2\rfloor+e$ (eq. 11.6, p. 354) is available as soon as the exponent field is unpacked, long before the $\sqrt{\ }$ block finishes; the $w_E$-bit increment is therefore *precomputed in parallel* with the square root, and the only latency the unit adds to the operator is one 2:1 multiplexer, gated by a select that arrives with $M_S$ itself. On an FPGA the incrementer maps onto the hard carry chain ([[FPGAs]]) and a $w_E$-bit mux is one LUT per bit; on an ASIC both are equally unremarkable. There is no interesting technology split here — the unit is small enough that the choice never matters.

**The incremented exponent cannot escape the normal range.** With $E_X\le 2^{w_E}-2$ (the largest exponent field that is not the reserved $\infty$/NaN encoding), $\lfloor E_X/2\rfloor\le 2^{w_E-1}-1$; with $\lfloor E_0/2\rfloor=2^{w_E-2}-1$ a constant string of $w_E-2$ ones and $e\le1$ a carry-in,

$$E_S+1\;\le\;\big(2^{w_E-1}-1\big)+\big(2^{w_E-2}-1\big)+1+1\;=\;3\cdot2^{w_E-2}\;\le\;2^{w_E}-2\quad(w_E\ge3)$$

the last step because $2^{w_E}-3\cdot2^{w_E-2}=2^{w_E-2}\ge2$. The incrementer's carry-out is therefore provably dead and can be discarded — the concrete form of the book's remark that $E_S$ "can always be computed exactly on $w_E$ bits" (p. 355). Widths and encodings throughout are those of [[Number Formats]].

$$\boxed{\;m_1=1\;\Longrightarrow\;M_S=2\ \text{exactly}\;;\qquad E_R=E_S+m_1,\qquad F_R=(m_{-1},\dots,m_{-w_F})\;}$$

**When it breaks.**

- **Only faithful blocks need it.** Under round-to-nearest a correctly rounded $M_S$ is normalized by construction, and ties cannot occur for square root at all, so the baseline is safe whatever the tie rule (p. 356). Adding this unit there is dead silicon.
- **Rounding up needs it even when correctly rounded.** $\mathrm{RU}(\sqrt{M_X^{\max}})=2.0$, so an RU-compliant square root requires exactly this normalization unit for exactly this one case (p. 356) — the accuracy contract is not what triggers it, the direction is. Rounding down and rounding to zero do not ([[Rounding]]).
- **The lemma is load-bearing.** $m_1=1\Rightarrow M_S=2$ rests on the error bound being $<2^{-w_F}$. A $\sqrt{\ }$ block that is *worse* than faithful can emit $M_S>2$ with nonzero low bits, and the fraction wire then truncates them silently — the original bug, one bit further up. The unit is exactly as correct as the faithfulness claim it sits on; verify that claim separately.
- **$w_E=2$.** The headroom argument above needs $w_E\ge3$. No real format is that small, but a hand-cut application-specific `Nfloat` could be.
- **It does not buy correct rounding.** Faithful-plus-this-unit is still faithful. Recovering the last ulp needs the sign of $S_0^2-X$, i.e. a [[Left-Truncated Squarer]] — a different and much larger piece of hardware ([[Correct Rounding from Faithful Quotient]] transposes directly, p. 357).
- **Do not generalize the free ride.** Multiply and divide overflow their significand routinely rather than once, and at values that are not exact powers of two, so their normalizers need a real shifter ([[Normalizers]]). Square root gets the cheap version only because its single overflow value is $2.0$.

> [!warning] No synthesis numbers in Chapter 11
> The chapter reports no LUT, slice, gate or delay figures for any variant, including this unit. "One $w_E$-bit incrementer and one $w_E$-bit mux" is a structural count read off Fig. 11.10 and the text, not a measurement. Anything quantitative needs your own synthesis run.

**In Spade,** the whole unit — one bit tapped, one exponent select, one fraction slice:

```spade
// M_S arrives as ufix(1,-WF): WF+2 bits, weights 2^1 .. 2^-WF.
fn sqrt_norm<#uint WE, #uint WF>(
    e_s: uint<WE>,
    m_s: uint<{WF + 2}>,
) -> (uint<WE>, uint<WF>) {
    let ovf = m_s.msb();
    let e_r = if ovf { trunc(e_s + 1) } else { e_s };
    let f_r: uint<WF> = trunc(m_s);
    (e_r, f_r)
}
```

`m_s` is the widened bus leaving the $\sqrt{\ }$ block; `m_s.msb()` is the single wire tapped off it in the diagram, and `f_r` is the untouched drop straight into pack — `trunc` keeps the low $w_F$ bits, which is the *whole* significand path, no shifter. `e_s + 1` widens to $w_E+1$ bits per Spade's growth rule, and the `trunc` back to $w_E$ is the carry-out that the headroom argument above proved dead; write it as `e_s +. 1` and nothing changes. Everything here is combinational, and synthesis will not build the drawing's separate incrementer and mux: it will collapse them into one $w_E$-bit row of carry-chain logic with `ovf` folded into the carry-in.

Verified by simulating a concrete `entity sqrt_norm_8_23(e_s: uint<8>, m_s: uint<25>) -> uint<31>` wrapper against a reference that checks the *semantics* rather than the bit pattern — $(2^{w_F}+F_R)\cdot 2^{E_R}=M_S\cdot 2^{E_S}$ — over $4507$ vectors: named cases including $M_S=2.0$ at both exponent extremes and asymmetric fractions, plus a random sweep of $M_S$ across its legal range $[1,2]$.

**Related notes.**

- [[Floating-Point Square Root]] – depends-on: the baseline operator this unit bolts onto, and the source of $E_S=\lfloor E_X/2\rfloor+\lfloor E_0/2\rfloor+e$.
- [[Normalizers]] – compares: the general post-normalization problem, of which this is the degenerate one-bit, no-shifter case.
- [[Rounding]] – supports: faithful versus correct rounding, and why rounding up alone re-triggers this case.
- [[Faithful Floating-Point Multiplier]] – counter-example: the same accuracy relaxation on a multiplier leaves the architecture unchanged and needs no fix at all.
- [[Left-Truncated Squarer]] – extends: the hardware that turns this faithful result into a correctly rounded one.
- [[Floating-Point Exception Handling]] – depends-on: consumes $E_R$ and $F_R$ downstream and owns the $\infty$/NaN encodings this unit's incrementer must not reach.
- [[Choosing a Floating-Point Operator]] – compares: where faithful square root sits against the correctly rounded alternative.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 11 "Basic Floating-Point Operators".
  - Sect. 11.4.1 Baseline square root architecture — eqs. (11.4)–(11.6), Fig. 11.10, the "correctly rounded $M_S$ is necessarily already normalized" guarantee, and $E_S$ exact on $w_E$ bits, pp. 353–355
  - Sect. 11.4.2 Faithful floating-point square root — the Taylor development of $\sqrt{M_X^{\max}}$, the three repairs, and the two-bullet modification of Fig. 11.10 this note implements, p. 355
  - Sect. 11.4.3 IEEE 754 compliance — no ties for square root, and rounding up as the mode that needs this unit regardless of accuracy contract, p. 356
  - Sect. 11.4.4 Correct rounding out of faithful rounding for square root, p. 357
- [Din+10] de Dinechin, Joldeş, Pasca, Revy, "Multiplicative square root algorithms for FPGAs", *FPL* 2010, pp. 574–577 — the left-truncated squarer; cited p. 356.
