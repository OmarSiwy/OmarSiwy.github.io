---
title: LNS Multiplier
description: "Multiply, divide, square and square root as one adder, one subtractor, one left shift and one right shift on the logarithm — all four exact, O(w) area against O(w^2) for a fixed-point multiplier."
kind: circuit
source: "ASA §2.6.1-2.6.2, pp. 57-59"
status: seed
spade: simulated
tags: [digital, number-formats, lns, multiplier, logarithm]
aliases:
  - Logarithmic Number System Multiplier
  - LNS Multiplication
  - LNS Divider
  - Log-Domain Multiplier
---

# LNS Multiplier

A multiplier for numbers stored as their base-2 logarithm, which reduces the entire operation to one $(w_E+w_F)$-bit two's-complement addition and one XOR gate — the one operator family where a logarithmic format beats every other representation outright.

```tikz title="LNS multiplicative datapath: sign XOR, one two's-complement adder on the logarithms, exception combining, and the range check that replaces rounding"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,font=\footnotesize,>=latex]

% ---------- operand words (Fig. 2.17 field layout) ----------
\draw (0,6.4) rectangle (4.4,7.0);
\draw (0.8,6.4) -- (0.8,7.0);  \draw (1.25,6.4) -- (1.25,7.0);
\node at (0.4,6.7) {\tiny exn}; \node at (1.02,6.7) {$s$}; \node at (2.8,6.7) {$L_X$};
\node[above] at (0.4,7.02) {\tiny 2}; \node[above] at (1.02,7.02) {\tiny 1};
\node[above] at (2.8,7.02) {\tiny $w_E+w_F$};
\node[left] at (-0.1,6.7) {$X$};

\draw (5.6,6.4) rectangle (10.0,7.0);
\draw (6.4,6.4) -- (6.4,7.0);  \draw (6.85,6.4) -- (6.85,7.0);
\node at (6.0,6.7) {\tiny exn}; \node at (6.62,6.7) {$s$}; \node at (8.4,6.7) {$L_Y$};
\node[above] at (6.0,7.02) {\tiny 2}; \node[above] at (6.62,7.02) {\tiny 1};
\node[above] at (8.4,7.02) {\tiny $w_E+w_F$};
\node[left] at (5.5,6.7) {$Y$};

% ---------- row B: the whole arithmetic ----------
\draw (3.6,4.2) rectangle (7.6,5.0);
\node[align=center] at (5.6,4.6) {$L_X + L_Y$\\ \tiny two's-complement adder};
\draw (8.2,4.2) rectangle (10.0,5.0);
\node at (9.1,4.6) {$s_X \oplus s_Y$};

% ---------- row C ----------
\draw (0.0,2.9) rectangle (3.0,3.7);
\node[align=center] at (1.5,3.3) {\tiny exn combine\\ \tiny (Table 2.3)};
\draw (3.6,2.9) rectangle (7.6,3.7);
\node[align=center] at (5.6,3.3) {\tiny overflow $\to\infty$, underflow $\to 0$\\ \tiny drop MSB};

% ---------- result word ----------
\draw (2.0,1.2) rectangle (8.0,1.8);
\draw (2.8,1.2) -- (2.8,1.8);  \draw (3.4,1.2) -- (3.4,1.8);
\node at (2.4,1.5) {\tiny exn}; \node at (3.1,1.5) {$s$}; \node at (5.7,1.5) {$L_{X\times Y}$};
\node[left] at (1.9,1.5) {$X\times Y$};

% ---------- buses ----------
\draw[->] (0.4,6.4) -- (0.4,3.7);
\draw[->] (6.0,6.4) -- (6.0,6.2) -- (2.2,6.2) -- (2.2,3.7);
\draw[->] (1.02,6.4) -- (1.02,5.9) -- (8.7,5.9) -- (8.7,5.0);
\draw[->] (6.62,6.4) -- (6.62,5.75) -- (9.5,5.75) -- (9.5,5.0);
\draw[->] (2.8,6.4) -- (2.8,5.45) -- (4.4,5.45) -- (4.4,5.0);
\draw[->] (8.4,6.4) -- (8.4,5.3) -- (6.8,5.3) -- (6.8,5.0);
\draw[->] (5.6,4.2) -- (5.6,3.7);
\node[anchor=west] at (5.65,3.95) {\tiny $w_E+w_F+1$};
\draw[->] (3.6,3.3) -- (3.0,3.3);
\node[above] at (3.3,3.32) {\tiny 2};
\draw[->] (1.5,2.9) -- (1.5,2.3) -- (2.4,2.3) -- (2.4,1.8);
\draw[->] (5.7,2.9) -- (5.7,1.8);
\node[anchor=west] at (5.75,2.65) {\tiny $w_E+w_F$};
\draw[->] (9.1,4.2) -- (9.1,2.3) -- (3.1,2.3) -- (3.1,1.8);

% ---------- the three siblings on the same hardware ----------
\node[draw,dashed,align=left,anchor=west,inner sep=4pt] at (8.3,0.9)
  {\tiny same datapath:\\ \tiny $X/Y$: adder in subtract mode\\ \tiny $X^2$: $L_X \ll 1$ (no logic)\\ \tiny $\sqrt{X}$: $L_X \gg 1$ (no logic)};

\end{circuitikz}
\end{document}
```

*Field layout after Fig. 2.17, p. 57; the datapath is my own construction.*

**Fix the encoding before counting gates.** An LNS word of the FloPoCo-like shape carries three fields: a 2-bit `exn` code, a 1-bit sign $s$, and a two's-complement fixed-point logarithm $L_X$ in the format $\mathrm{sfix}(w_E-1,-w_F)$ — $w_E$ bits of integer part, $w_F$ bits of fraction, $w_E+w_F$ bits in total ([[Signed Fixed-Point Format]]). The value is

$$X=(-1)^{s}\times 2^{L_{X}}$$

so the whole word is $w_E+w_F+3$ bits, matching [[Nfloat Format]] with the same parameters bit for bit. $\log_2 0=-\infty$, so zero is not expressible and joins $\pm\infty$ and NaN in `exn` (Table 2.3, p. 54). That is not a wart to be worked around later: the multiplier below cannot produce a correct zero without it.

**Turn the product into a sum.** Substituting the two encodings into $X\times Y$ and applying $2^{a}\cdot 2^{b}=2^{a+b}$ — equivalently $\log_2(uv)=\log_2 u+\log_2 v$ — separates the sign from the magnitude:

$$X\times Y=(-1)^{s_X}2^{L_X}\cdot(-1)^{s_Y}2^{L_Y}=(-1)^{s_X+s_Y}\,2^{L_X+L_Y}$$

and since $(-1)^n$ depends only on the parity of $n$, $(-1)^{s_X+s_Y}=(-1)^{s_X\oplus s_Y}$. So the magnitude is one addition of two $(w_E+w_F)$-bit two's-complement numbers and the sign is one XOR gate. Nothing else exists in the operator: no partial products, no alignment, no normalisation, no rounding logic.

**The one bit of growth is the entire error story.** The sum of two values in $\mathrm{sfix}(w_E-1,-w_F)$ lies exactly in $\mathrm{sfix}(w_E,-w_F)$ — $w_E+w_F+1$ bits, one integer bit wider, no fractional bits added, because addition of two numbers on the same grid stays on that grid. The product is therefore **exact**, and the only way to lose it is for that extra bit to be significant, which is a *range* failure, not a precision one. A positive overflow means the true product exceeded the largest representable value and the result must be forced to $\infty$; a negative overflow means it fell below the smallest and must be forced to zero. Compare a fixed-point multiplier, which produces a $2w$-bit exact product and then throws half of it away under a rounding rule ([[Error Accuracy]]), or a floating-point multiplier, which rounds the significand product back to $w_F+1$ bits on every single operation.

**Divide, square and root are the same silicon or no silicon.** The same three identities fall out of the same log law:

$$L_{X/Y}=L_X-L_Y,\qquad L_{X^{2}}=2L_X,\qquad L_{\sqrt{X}}=\left\lfloor\tfrac12 L_X\right\rfloor$$

Division reuses the adder in subtract mode — by the two's-complement identity $-x=\bar{x}+1$, that is one inverter per bit on the $L_Y$ input plus a carry-in of 1 ([[Two's Complement Negator]]), the standard adder/subtractor trick and *not* a second adder. Squaring is $L_X\ll 1$ and square root is $L_X\gg 1$ (arithmetic, since $L_X$ is signed): both are pure wiring, zero gates, zero delay. Against a fixed-point divider — a digit recurrence costing $O(w)$ cycles — or a fixed-point square root, this is the largest cost gap in all of computer arithmetic.

> [!important] Three of the four are exact; the square root is not.
> The floor in $L_{\sqrt X}=\lfloor\frac12 L_X\rfloor$ is real. Halving an odd multiple of the ulp $2^{-w_F}$ needs one extra fractional bit, and the right shift discards it. In $\mathrm{LNS}(3,2)$ take $L_X=0.25$, so $X=2^{0.25}$: the true root is $2^{0.125}$, but $\lfloor 0.125\rfloor$ on the $2^{-2}$ grid is $0$ and the operator returns $1$ — a relative error of $2^{0.125}-1\approx 8.3\%$, one full ulp of the format. Multiplication, division and squaring lose nothing; the root always truncates toward zero.

**The cost gap is asymptotic, not just constant.** An LNS multiplier is $O(w)$ in area and $O(\log w)$ in delay if the adder is a prefix tree ([[Adders]]), where $w=w_E+w_F$. A fixed-point multiplier of the same width is $O(w^2)$ partial-product bits ([[Multipliers]]). A floating-point multiplier sits between the two: a $(w_F+1)\times(w_F+1)$ significand array, an exponent adder, a one-bit normalising shift and a rounder. The LNS multiplier has no array at all, and — because $L_X$ is already two's complement and the sign travels in its own bit — it never needs the sign-magnitude conversions a signed fixed-point multiplier pays for ([[Sign-Magnitude to Two's Complement Converter]]).

**On an FPGA the operator collapses onto the hard carry chain.** A $(w_E+w_F)$-bit addition is the single cheapest structure the fabric offers: one carry-chain cell per bit, no DSP block, no block RAM ([[FPGAs]]). A fixed-point multiplier of comparable width consumes DSP slices, which are a scarce, discretely allocated resource. The asymmetry matters more here than on an ASIC, because the FPGA's adder is hardened silicon while its multiplier competes for a fixed budget of hard blocks. All of that saving is then handed straight back to [[LNS Adder]], whose $f_\oplus$ table wants block RAM by the megabit.

$$\boxed{\;L_{X\times Y}=L_X+L_Y,\quad s_{X\times Y}=s_X\oplus s_Y,\quad L_{X/Y}=L_X-L_Y,\quad L_{X^{2}}=2L_X,\quad L_{\sqrt X}=\left\lfloor\tfrac12 L_X\right\rfloor\;}$$

**When it breaks.**

- **Zero is not a number here.** Without the `exn` path the multiplier is simply wrong, and $0\times\infty$ must be trapped to NaN explicitly — there is no exponent field whose extremal value does it for free.
- **Overflow replaces rounding, and it is silent.** The single MSB of growth is the only guard. Beyond it the result saturates to $\infty$ or $0$ with no intermediate degradation, so an algorithm that relied on gradual underflow has no analogue.
- **Square root truncates**, one ulp of $L$, every time the low bit of $L_X$ is set.
- **"Exact" means exact in the log domain.** Only powers of two are exactly representable as *values* — $3$ is not — so the error lives entirely in getting in and out of the format, and an LNS product of two rounded inputs is no better than its inputs.
- **The format only pays if additions are rare.** Every $+$ in the surrounding algorithm costs an evaluation of $f_\oplus(r)=\log_2(1+2^r)$ over the full $w_E+w_F$-bit word; tabulated outright that is $2^{w_E+w_F}$ entries — 32 at $(w_E,w_F)=(3,2)$ but $2^{31}$ at binary32-like $(8,23)$. LNS is therefore confined to small formats, and a free multiplier is no consolation in an algorithm dominated by sums.
- **The adder is still an adder.** At large $w_E+w_F$ its carry propagation, not the multiply, sets the critical path, and the usual adder-architecture choice returns.

```spade
/// exn combination for a product: 00 zero, 01 normal, 10 inf, 11 NaN.
fn exn_mul(a: uint<2>, b: uint<2>) -> uint<2> {
    match (a, b) {
        (0b11, _)    => 0b11,   // NaN propagates
        (_, 0b11)    => 0b11,
        (0b00, 0b10) => 0b11,   // 0 * inf
        (0b10, 0b00) => 0b11,
        (0b00, _)    => 0b00,
        (_, 0b00)    => 0b00,
        (0b10, _)    => 0b10,
        (_, 0b10)    => 0b10,
        _            => 0b01,
    }
}

/// LNS multiplier, W = wE + wF. Result packed as exn:s:L, matching Fig. 2.17.
entity lns_mul<#uint W>(
    xe: uint<2>, xs: bool, xl: int<W>,
    ye: uint<2>, ys: bool, yl: int<W>,
) -> uint<{W + 3}> {
    let sum: int<{W + 1}> = xl + yl;         // exact, W+1 bits
    let low: int<W>        = trunc(sum);     // back onto the sfix(wE-1,-wF) grid
    let back: int<{W + 1}> = sext(low);
    let ovf = sum != back;                   // the extra bit was significant
    let neg = sum.sign_bit();                // negative overflow = underflow to 0

    let base = exn_mul(xe, ye);
    let exn = if base == 0b01 && ovf {
        if neg { 0b00 } else { 0b10 }
    } else {
        base
    };
    exn.concat((xs ^^ ys).as_uint()).concat(low.as_uint())
}
```

`xl`/`yl` are the two $L$ buses entering the adder in the diagram, `sum` is the $w_E+w_F+1$-bit wire leaving it, and `ovf`/`neg` are the two flags the range block hands left to the exn combiner. The whole entity is combinational — there is nothing to register, which is the point. `sum != sext(trunc(sum))` is the width-safe way to ask whether the MSB of growth was significant, because Spade integers are not indexable; synthesis will not build the second adder that `sext` suggests, it will collapse to `sum[W] != sum[W-1]`, two wires and one XOR. Simulated at $(w_E,w_F)=(4,4)$ against a behavioural reference: 10 named vectors plus a 5000-vector random sweep over all four `exn` codes and both signs, 5010/5010 matching.

**Related Notes**

- [[Multipliers]] – compares: the $O(w^2)$ array this replaces with an adder, and the format conversion that makes the comparison unfair.
- [[Dividers]] – compares: a digit recurrence costing $O(w)$ cycles becomes the same adder in subtract mode.
- [[Squarers and Integer Powers]] – compares: a dedicated squarer array collapses to $L_X\ll 1$, zero gates.
- [[Square Root]] – counter-example: the one member of the family LNS does not get for free, because the shift truncates.
- [[LNS Adder]] – counter-example: the operator that spends everything this one saves.
- [[Nfloat Format]] – compares: identical word width and comparable range, opposite cost split between $\times$ and $+$.
- [[Two's Complement Negator]] – supports: turns the adder into the divider without a second adder.
- [[Number Formats]] – depends-on: the $\mathrm{sfix}$ grid and ulp reasoning the exactness argument rests on.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §2.6.1 "An Example LNS Format", pp. 57-58 — Fig. 2.17 (field layout), Eq. (2.20).
- §2.6.2 "LNS Operations", p. 58 — Eqs. (2.21)-(2.24).
- §2.6.3 "LNS in Arbitrary Base", p. 59 — $f_\oplus$, $f_\ominus$ and the cost of addition.
- Table 2.3, p. 54 — `exn` encoding, shared with the Nfloat format.
- Table 2.4, p. 55 — Nfloat range and total width, for the bit-for-bit comparison.
