---
title: Exact Unnormalized Multiplier
description: "A floating-point multiplier that deliberately does not round or normalise: one wide OR handles subnormals, and the doubly biased exponent sum is already the alignment shift distance."
kind: circuit
source: "ASA §21.2.1, pp. 630-632"
status: seed
spade: simulated
tags: [digital, exact-accumulators, multiplier, floating-point]
aliases:
  - "Exact Floating-Point Multiplier"
  - "Exact Multiplier"
  - "Unnormalized Multiplier"
  - "Unnormalised Multiplier"
  - "Exact Unnormalized Multipliers"
---

# Exact Unnormalized Multiplier

A floating-point multiplier for a downstream fixed-point accumulator, distinguished from every other floating-point multiplier by what it omits: no rounding, no normalisation, and — because it emits a *doubly* biased exponent — not even the bias subtraction.

```tikz title="Exact unnormalized floating-point multiplier: sign XOR, doubly biased exponent adder with two isNormal ORs, and an exact significand product"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex,font=\small]
  % ---------------- sign path
  \node[anchor=south] at (-1.0,11.95) {$s_X$};
  \node[anchor=south] at (-0.2,11.95) {$s_Y$};
  \node[xor port,scale=0.75] (xg) at (1.0,10.9) {};
  \draw (-1.0,11.85) |- (xg.in 1);
  \draw (-0.2,11.85) |- (xg.in 2);
  \draw[->] (xg.out) -- (1.9,10.9) -- (1.9,7.45);
  \node[anchor=north] at (1.9,7.4) {$s$};
  \node[anchor=west,scale=0.8] at (1.95,9.0) {$1$};

  % ---------------- exponent path
  \node[anchor=south] at (2.9,11.95) {$E_X$};
  \node[anchor=south] at (3.8,11.95) {$E_Y$};
  \draw[->] (2.9,11.85) -- (2.9,10.05);
  \draw[->] (3.8,11.85) -- (3.8,10.05);
  \node[anchor=east,scale=0.8] at (2.85,11.55) {$w_E$};
  \node[anchor=west,scale=0.8] at (3.85,11.55) {$w_E$};

  \draw[fill=gray!8] (2.4,9.0) rectangle (4.4,10.05);
  \node at (3.4,9.55) {$+$};

  % ---------------- isNormal boxes (a wide OR over the exponent field)
  \draw[fill=gray!8] (5.7,11.0) rectangle (7.5,11.5);
  \node at (6.6,11.25) {\footnotesize isNormal};
  \draw[fill=gray!8] (5.7,10.1) rectangle (7.5,10.6);
  \node at (6.6,10.35) {\footnotesize isNormal};

  \draw[->] (3.8,11.25) -- (5.7,11.25);
  \draw[->] (2.9,10.35) -- (5.7,10.35);
  \node[circ] at (3.8,11.25) {};
  \node[circ] at (2.9,10.35) {};

  % n_x / n_y prepended to the fractions
  \draw[->] (7.5,11.25) -- (11.0,11.25);
  \draw[->] (7.5,10.35) -- (9.0,10.35);
  \node[anchor=south,scale=0.8] at (7.95,11.3) {$n_y$: $1$};
  \node[anchor=south,scale=0.8] at (7.95,10.4) {$n_x$: $1$};

  % n_x / n_y complemented into the exponent adder
  \node[not port,scale=0.5,xscale=-1] (iy) at (5.15,9.90) {};
  \node[not port,scale=0.5,xscale=-1] (ix) at (5.15,9.18) {};
  \draw (5.7,11.15) -- (5.6,11.15) -- (5.6,9.90) -- (iy.in 1);
  \draw (6.0,10.1) -- (6.0,9.18) -- (ix.in 1);
  \draw[->] (iy.out) -- (4.4,9.90);
  \draw[->] (ix.out) -- (4.4,9.18);
  \node[anchor=east,scale=0.75] at (4.32,9.90) {$\overline{n_y}$};
  \node[anchor=east,scale=0.75] at (4.32,9.18) {$\overline{n_x}$};

  \draw[->] (3.4,9.0) -- (3.4,7.45);
  \node[anchor=north] at (3.4,7.4) {$E$};
  \node[anchor=west,scale=0.8] at (3.45,8.2) {$w''_E=w_E{+}1$};

  % ---------------- significand path
  \node[anchor=south] at (9.0,11.95) {$F_X$};
  \node[anchor=south] at (11.0,11.95) {$F_Y$};
  \draw (9.0,11.85) -- (9.0,10.35);
  \draw (11.0,11.85) -- (11.0,11.25);
  \node[anchor=east,scale=0.8] at (8.95,11.6) {$w_F$};
  \node[anchor=east,scale=0.8] at (10.95,11.6) {$w_F$};
  \node[circ] at (9.0,10.35) {};
  \node[circ] at (11.0,11.25) {};

  \draw[very thick,->] (9.0,10.35) -- (9.0,9.7);
  \draw[very thick,->] (11.0,11.25) -- (11.0,9.7);
  \node[anchor=east,scale=0.8] at (8.93,10.12) {$M_X$};
  \node[anchor=east,scale=0.8] at (8.93,9.82) {$w_F{+}1$};
  \node[anchor=west,scale=0.8] at (11.07,10.35) {$M_Y$};
  \node[anchor=west,scale=0.8] at (11.07,10.05) {$w_F{+}1$};

  \draw[fill=gray!8] (8.4,8.0) rectangle (11.6,9.7);
  \node[scale=1.6] at (10.0,8.85) {$\times$};

  \draw[very thick,->] (10.0,8.0) -- (10.0,7.45);
  \node[anchor=north] at (10.0,7.4) {$M$};
  \node[anchor=west,scale=0.8] at (10.07,7.72) {$w''_F=2w_F{+}2$};

  \node[align=center,scale=0.85] at (5.4,6.25)
    {$E=E_X+(1-n_x)+E_Y+(1-n_y)$ is doubly biased --- and is exactly the left-shift\\
     distance that aligns $M$ to an accumulator whose LSB has weight $2^{-2E_0-2w_F}$};
\end{circuitikz}
\end{document}
```

*after Fig. 21.7, p. 631.* The thick wires carry $w_F+1$ and $2w_F+2$ bits; every other wire is $1$ bit or $w_E$ bits as labelled.

**Delete the two blocks that dominate an IEEE multiplier, because the consumer undoes their work anyway.** A conventional [[Floating-Point Operators|floating-point multiplier]] spends most of its area on the *back end*: a normalising shift (the product of two significands in $[1,2)$ lands in $[1,4)$, so it may need a one-bit right shift), a rounding adder, and — if subnormals are supported — a leading-zero count plus a denormalising shifter on the input side. Here the result is handed to a wide fixed-point [[Kulisch Accumulator|accumulator]] that will shift it by an arbitrary distance regardless. Normalising first and then shifting again is wasted work, and rounding first is worse than wasted: it is the *only* error the exact-accumulation datapath would contain. So the back end is deleted outright and the operator emits an unnormalized, unrounded triple $(s, E, M)$.

**Recover the implicit bit with one OR instead of one shifter.** In $\text{IEEEfloat}(w_E,w_F)$ the significand's leading bit is not stored; it is $1$ for normal numbers and $0$ for subnormals, and the encoding signals which by reserving the all-zero exponent field ([[Number Formats]]). The predicate is therefore a *wide OR* over the $w_E$ exponent bits,

$$n_x = \bigvee_{i=0}^{w_E-1} (E_X)_i \in \{0,1\}$$

and $M_X = n_x \cdot 2^{w_F} + F_X$ on $w_F+1$ bits is the significand as an integer — a **concatenation, i.e. pure wiring**, of the OR's output above the stored fraction. This is the whole subnormal handling. A standard IEEE multiplier cannot get away with it: because it must produce a *normalised* result it has to left-shift a subnormal input by its leading-zero count first, which costs a leading-zero counter and a $w_F$-bit shifter on each operand. Removing normalisation from the output removes the denormalising shifter from the input as a side effect.

**Multiply the significands and stop.** $M = M_X M_Y$ on $w''_F = 2w_F+2$ bits, exact by construction: the product of two $(w_F+1)$-bit integers is at most $(2^{w_F+1}-1)^2 < 2^{2w_F+2}$, so no bit is lost and there is nothing to round. This is an ordinary unsigned integer multiplier ([[Multipliers]]) with its full double-width output kept rather than truncated — on an ASIC, whatever partial-product scheme the library prefers, optionally [[Booth's Algorithm|Booth-recoded]] to halve the partial-product count; on FPGA, one or a few hard DSP blocks, where keeping the full $2w_F+2$ bits is *free* because the DSP's multiplier is already full-width and truncation would only add fabric logic. The sign is $s = s_X \oplus s_Y$, one XOR, on $1$ bit.

**Keep the bias in twice, because the double bias is the shift distance.** With bias $E_0 = 2^{w_E-1}-1$, the stored exponent field decodes to a true exponent $e_X = E_X + (1-n_x) - E_0$ (Eq. 2.18, p. 51): the $(1-n_x)$ term is what makes the subnormal case $E_X=0$ read as $e_X = 1-E_0 = e_{min}$ rather than $-E_0$, so the encoding has no gap at the bottom. Summing the two true exponents and folding in $M = M_XM_Y \cdot 2^{2w_F}$ scaled as an integer,

$$X \cdot Y = (-1)^{s}\, M \, 2^{\,E_X + (1-n_x) + E_Y + (1-n_y) - 2E_0 - 2w_F}$$

The obvious circuit would subtract $2E_0$ to recover a singly biased exponent. Do not: the constant is about to be added straight back. An accumulator whose LSB has weight $2^{\ell_A}$ needs $M$ left-shifted by $\,E_X+(1-n_x)+E_Y+(1-n_y) - 2E_0 - 2w_F - \ell_A$, and **by associativity of addition** the two bias terms cancel against $\ell_A$ whenever $\ell_A$ is chosen at the very bottom of the format's range. Emitting the doubly biased

$$E = E_X + \overline{n_x} + E_Y + \overline{n_y}$$

(where $1-n_x = \overline{n_x}$, a single inverter, since $n_x$ is one bit) therefore saves a $w_E$-bit subtraction *and* hands the [[Sign-Padding Alignment Shifter|alignment shifter]] a shift distance it can use with no further arithmetic. When $\ell_A$ is raised above that floor — the application-specific case — the residual constant $\ell_A - \ell_A^{\min}$ is subtracted from $E$, but that subtraction is parametrised by the accumulator, belongs to it, and runs in parallel with the multiplier's critical path (the significand product), so it is free in latency.

> [!warning] The book's alignment constant is two bits off
> §21.2.1 (p. 632) states that $E$ is "exactly the number of bits by which the significand $M$ should be left-shifted in order to align it to an exact accumulator whose LSB is $2e_{min}-2w_F$". Table 2.4 (p. 55) defines $e_{min}=-2^{w_E-1}+2 = 1-E_0$ for $\text{IEEEfloat}$, so $2e_{min}-2w_F = 2-2E_0-2w_F$, whereas the derivation above requires $\ell_A = -2E_0-2w_F$ for the shift to equal $E$. Counterexample: two smallest subnormals give $E_X=E_Y=0$, $n_x=n_y=0$, hence $E=2$ and $M=1$, and shifting by $2$ places their product four times too high. The correct floor is $\ell_A^{\min} = 2(e_{min}-1)-2w_F$, i.e. two bits below the stated one — equivalently, shift by $E-2$ into an accumulator with the book's LSB. The discrepancy is harmless in practice (§21.1 advises padding $\ell_A$ generously, and the residual is absorbed by the same constant subtraction the book already describes), but the constant as printed is wrong.

**Bound the exponent width from the encoding, not from the arithmetic.** $E$ is $w''_E = w_E+1$ bits. The bound is tighter than "sum of two $w_E$-bit numbers plus $2$" suggests: IEEE reserves the all-ones exponent for $\pm\infty$ and NaN, so a *finite* operand has $E_X \le 2^{w_E}-2$, and $n_x=1$ whenever $E_X \ne 0$, which makes $\overline{n_x}=1$ only in the branch where $E_X=0$ contributes nothing. The maximum of $E$ is thus $2(2^{w_E}-2) = 2^{w_E+1}-4$, comfortably inside $w_E+1$ bits. Feed this multiplier an infinity or a NaN and the bound still holds numerically, but the *meaning* does not — exceptional inputs are intercepted downstream by the [[Accumulator Exception FSM|four-state exception FSM]], never here.

**In $\text{Nfloat}$ the operator loses even the ORs.** The FloPoCo-native $\text{Nfloat}(w_E,w_F)$ format carries an explicit 2-bit `exn` field and supports only normal numbers (§2.5.3, p. 54), so $n_x \equiv 1$: the two `isNormal` boxes and both inverters vanish, $M_X = 1.F_X$ is a hard-wired constant-one concatenation, and $E = E_X+E_Y$ is a plain $w_E$-bit-in adder. This is the usual trade — the format that pushed exception handling out into a side-band field makes every arithmetic operator cheaper, and pays for it in two extra stored bits per number.

$$\boxed{\ s=s_X\oplus s_Y,\qquad E=E_X+\overline{n_x}+E_Y+\overline{n_y}\ \ (w_E{+}1\ \text{bits}),\qquad M=M_XM_Y\ \ (2w_F{+}2\ \text{bits}),\qquad X\!\cdot\!Y=(-1)^s M\,2^{E-2E_0-2w_F}\ }$$

**When it breaks.**

- **Nothing consumes the wide output.** The whole justification is that a downstream fixed-point accumulator absorbs $2w_F+2$ bits for free. Feed this into anything that needs an $\text{IEEEfloat}$ result and you have merely moved the normaliser and rounder one block to the right, and paid extra routing for the wider bus. Use the standard multiplier of [[Floating-Point Operators]] instead.
- **Exceptional inputs.** $\pm\infty$ and NaN are encoded in the all-ones exponent, and this operator treats that encoding as an ordinary number. Correctness depends entirely on the [[Accumulator Exception FSM]] downstream; there is no in-block detection and no reason to add one.
- **Zero is not special-cased.** $E_X=F_X=0$ gives $M=0$ and a nonzero $E$; the alignment shifter shifts a zero, which is harmless, but any logic that reads $E$ as a magnitude must not assume $M \ne 0$.
- **$w_F$ past the DSP width.** Once $w_F+1$ exceeds the hard multiplier's operand width (e.g. binary64's $53$ bits against a $18\times25$ DSP) the significand product needs tiling or [[Multipliers|Karatsuba splitting]], and the multiplier — not the exponent path — becomes the entire cost and latency of the block.
- **The exponent-width bound assumes IEEE reservations.** In a format that does not reserve the all-ones exponent, $E$ can reach $2^{w_E+1}-2$ and $w_E+1$ bits still suffice — but only just; widen to $w_E+2$ before assuming anything about a non-standard format.

**RTL (Spade).** Compiled and simulated against a behavioural reference at $(w_E,w_F)=(5,10)$.

```spade
/// The "is normal" bit: one wide OR over the exponent field.
fn is_normal<#uint WE>(e: uint<WE>) -> bool {
    e.as_bits().reduce_or()
}

/// Exact unnormalized floating-point multiplier: no rounding, no normalisation.
/// Returns (sign, doubly biased exponent E, unnormalized product M).
fn exact_mul<#uint WE, #uint WF>(
    sx: bool, ex: uint<WE>, fx: uint<WF>,
    sy: bool, ey: uint<WE>, fy: uint<WF>,
) -> (bool, uint<{WE + 1}>, uint<{2 * WF + 2}>) {
    let nx = is_normal(ex);
    let ny = is_normal(ey);

    let mx: uint<{WF + 1}> = nx.as_uint().concat(fx);
    let my: uint<{WF + 1}> = ny.as_uint().concat(fy);

    let exz: uint<{WE + 1}> = zext(ex);
    let eyz: uint<{WE + 1}> = zext(ey);
    let cx: uint<{WE + 1}> = zext((!nx).as_uint());
    let cy: uint<{WE + 1}> = zext((!ny).as_uint());

    (sx ^^ sy, exz +. eyz +. cx +. cy, mx * my)
}
```

`is_normal` is one `isNormal` box; `nx.as_uint().concat(fx)` is the wire junction where $n_x$ is prepended to $F_X$ — `concat` on integers puts its first argument in the **high** position, which is what makes $M_X$ and not a bit-reversed twin. `(!nx).as_uint()` is the inverter triangle, and the four-term `+.` chain is the single `+` box: every operand is zero-extended to $w_E+1$ *before* adding so that the truncating `+.` never actually truncates (the bound above guarantees no carry out of bit $w_E$), which is the only way to write a multi-input add in Spade — plain `+` widens by one bit per operator and the second `+` would see mismatched widths. `mx * my` widens to exactly $2(w_F+1)$ bits, so no `trunc` and no `zext` appear on the significand path at all. Everything is `fn`, hence purely combinational: no clock, no state, and the whole block is freely pipelinable because it sits *outside* the accumulator's feedback loop. Synthesis will not keep this shape — an FPGA tool absorbs `mx * my` into a DSP block and may register its internal pipeline stages, and both ASIC and FPGA tools will merge the four-term exponent add into a single carry-save reduction rather than three cascaded adders.

**Related notes.**

- [[Multipliers]] – depends-on: the significand product is a plain unsigned integer multiplier with its full double-width output kept.
- [[Booth's Algorithm]] – supports: the usual recoding for that significand multiplier on ASIC, halving the partial-product count.
- [[Floating-Point Operators]] – compares: the rounding, normalising IEEE multiplier, whose entire back end this operator deletes.
- [[Sign-Padding Alignment Shifter]] – extends: consumes $E$ directly as a shift distance, which is why the bias is left in twice.
- [[Exact Sum-of-Products Operator]] – supports: the composed datapath this block is the front end of.
- [[Accumulator Exception FSM]] – supports: handles the $\pm\infty$/NaN cases this block deliberately ignores.
- [[Application-Specific Exact Accumulator]] – extends: when $\ell_A$ is raised off the floor, the residual constant subtraction lands there rather than here.
- [[Number Formats]] – depends-on: the subnormal encoding, the bias $E_0$, and the $\text{Nfloat}$ variant that removes the `isNormal` ORs.
- [[Error Accuracy]] – supports: why deleting the rounding step is the whole point — it is the only error term this datapath would otherwise carry.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 21 "Floating-Point Accumulation and Sum of Products":

- §21.2 Accumulator architectures, p. 630 — Fig. 21.6, the surrounding sum-of-products datapath.
- §21.2.1 Exact floating-point multiplier, pp. 630-632 — **Fig. 21.7** (redrawn above), the `isNormal` construction, the doubly biased exponent, and the $\ell_A$ correction.

Ch. 2 "Number Formats":

- §2.5.1, p. 51 — Eqs. 2.17-2.18, the implicit bit and the $(1-n)$ subnormal exponent term.
- §2.5.3, p. 54 — the $\text{Nfloat}$ format and its `exn` field.
- §2.5, p. 55 — Table 2.4, $E_0 = 2^{w_E-1}-1$ and $e_{min} = -2^{w_E-1}+2$.
