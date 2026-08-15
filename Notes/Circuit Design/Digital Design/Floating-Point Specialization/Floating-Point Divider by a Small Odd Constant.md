---
title: "Floating-Point Divider by a Small Odd Constant"
description: "Wraps a Euclidean constant divider in one small exponent adder and one significand mux; the normalization decision is an E_D-bit compare against F_D."
kind: circuit
source: "ASA §15.2, pp. 464-466"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, division, constant, fpga]
aliases:
  - Floating-Point Constant Divider
  - FPConstDiv
  - Floating-Point Division by a Small Integer Constant
---

# Floating-Point Divider by a Small Odd Constant

A correctly rounded IEEE-754 divider for the case where the divisor is a compile-time odd integer $D$, in which the normalizer, the exponent-difference logic and the rounding adder all collapse into one $E_D$-bit comparison.

```tikz title="Floating-point division by a small odd constant: one comparator, one significand mux, one small exponent adder wrapped around a Euclidean constant divider"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
% ---------------- unpack ----------------
\node[draw,minimum width=9.2cm,minimum height=0.8cm] (up) at (0,7.4) {unpack \& exception handling};
\draw[->] (0,8.5) node[above]{$X$} -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} (up.north);
% sign rail (left) and exception rail (right)
\draw[->] (-4.6,7.4) -- (-6.0,7.4) node[above,font=\tiny]{$s_X$} -- (-6.0,1.1) -- (-4.6,1.1);
\draw[->] (4.6,7.4) -- (7.7,7.4) node[above,font=\tiny]{exn, $2$} -- (7.7,1.1) -- (4.6,1.1);

% ---------------- significand bus ----------------
\draw (3.4,7.0) -- (3.4,6.3) node[right,font=\tiny,pos=0.4]{$F_X$, $w_F$};
% comparator, fed by the leading E_D bits only
\draw[->] (3.4,6.6) -- (-1.0,6.6) -- node[left,font=\tiny,pos=0.55]{$E_D$} (-1.0,6.0);
\node[draw,minimum width=2.4cm,minimum height=0.7cm] (cmp) at (-1.0,5.65) {$F_X \ge F_D\,$?};

% ---------------- significand mux ----------------
\draw[->] (3.4,6.3) -| (2.5,5.3);
\draw[->] (3.4,6.3) -| (4.3,5.3);
\node[font=\tiny,anchor=east] at (2.42,5.7) {$\ll 1$};
\node[font=\tiny,anchor=west] at (4.38,5.7) {$\ll 0$};
\draw (2.2,5.3) -- (4.6,5.3) -- (4.25,4.8) -- (2.55,4.8) -- cycle;
\node[font=\tiny] at (3.4,5.05) {mux};
\draw[->] (cmp.east) -- (2.0,5.65) -- (2.0,5.05) -- (2.2,5.05);
\node[font=\tiny,anchor=east] at (1.95,5.25) {$\varepsilon$};

% ---------------- concatenate H, then divide ----------------
\draw[->] (3.4,4.8) -- node[right,font=\tiny]{$w_F{+}2$} (3.4,4.15);
\node[font=\footnotesize] at (3.4,3.85) {$\Vert$};
\node[draw,dashed,minimum height=0.5cm,font=\tiny] (hb) at (5.7,3.85) {$H=\tfrac{D-1}{2}$, $E_D$ bits};
\draw[->] (hb.west) -- (3.7,3.85);
\draw[->] (3.4,3.55) -- node[right,font=\tiny]{$w_F{+}E_D{+}2$} (3.4,2.9);
\node[draw,minimum width=2.6cm,minimum height=0.9cm,align=center] (div) at (3.4,2.4) {divider\\ by $D$};
\draw[->] (div.south) -- node[right,font=\tiny]{$F_R$, $w_F{+}1$} (3.4,1.5);

% ---------------- exponent path ----------------
\node[draw,minimum width=2.2cm,minimum height=0.7cm] (ea) at (-3.7,2.9) {$-E_D-1$};
\draw[->] (-3.7,7.0) -- node[left,font=\tiny,pos=0.35]{$E_X{+}E_0$, $w_E$} (ea.north);
\draw[->] (cmp.west) -- (-2.2,3.05) -- node[above,font=\tiny]{$+1$} (-2.6,3.05);
\draw[->] (ea.south) -- node[left,font=\tiny]{$E_R{+}E_0$, $w_E{+}1$} (-3.7,1.5);

% ---------------- pack ----------------
\node[draw,minimum width=9.2cm,minimum height=0.8cm] (pk) at (0,1.1) {exception handling \& pack};
\draw[->] (pk.south) -- (0,0.1) node[below]{$R$};
\end{circuitikz}
\end{document}
```

*after Fig. 15.7, p. 465.*

**Put the constant in floating-point form and read off its two useful widths.** Write $D=2^{E_D}(1+F_D)$ with $1+F_D\in[1,2)$. Because $D$ is an odd *integer*, its significand is the integer itself: $D$ occupies exactly $E_D+1$ bits, and $F_D$ — the significand minus its implicit leading one — occupies exactly $E_D$ bits. For $D=5=2^2\cdot 1.01_2$ this gives $E_D=2$ and $F_D=.01_2$; for $D=3=2^1\cdot 1.1_2$ it gives $E_D=1$ and $F_D=.1_2$. Both constants are two-digit objects, and $E_D=\lfloor\log_2 D\rfloor$ is the single parameter every width below is written in. Restricting to odd $D$ costs nothing: any $D'=2^kD$ differs only in the exponent, handled at the end.

**The singularity that makes a generic divider expensive never arises here.** By the quotient rule for exponents,

$$\frac{X}{D}=\frac{2^{E_X}(1+F_X)}{2^{E_D}(1+F_D)}=2^{E_X-E_D}\cdot\frac{1+F_X}{1+F_D}$$

and since both significands lie in $[1,2)$, their ratio lies in $[0.5,2)$. A generic floating-point divider must contend with a quotient significand that can need a normalizing shift of arbitrary size, plus a divisor that may be zero; here the divisor is a fixed nonzero constant and the quotient significand is off-normal by **at most one bit**. The entire barrel-shifter normalizer of a generic divider ([[Dividers]]) reduces to a two-way choice.

**One comparison decides that choice, and it costs $E_D$ bits.** Let $\varepsilon=[\,F_X<F_D\,]$. If $F_X\ge F_D$ the ratio is in $[1,2)$ and is already normalized; otherwise it is in $[0.5,1)$ and the input significand is pre-shifted left one bit, which multiplies the quotient by two and decrements the result exponent:

$$
Y=\begin{cases}
\left\lfloor \dfrac{2^{E_D}(1+F_X)}{D}\right\rceil_{-w_F}2^{E_X-E_D} & F_X\ge F_D\quad(\text{ratio}\in[1,2))\\[10pt]
\left\lfloor \dfrac{2^{E_D+1}(1+F_X)}{D}\right\rceil_{-w_F}2^{E_X-E_D-1} & F_X<F_D\quad(\text{ratio}\in[0.5,1))
\end{cases}
$$

Comparing $F_X$ against $F_D$ looks like a $w_F$-bit comparison, but $F_D$ is zero below bit $E_D$, so all trailing bits of $F_X$ are irrelevant to the ordering and the test reduces to an $E_D$-bit [[Magnitude Comparator]] on the leading $E_D$ bits of $F_X$ (p. 465). For $D=3$ that is one wire, $\varepsilon=\overline{F_X[w_F-1]}$; for $D<32$ it is at most five bits, which is one LUT.

**The exponent path is one adder whose carry-in is the comparison.** The biased result exponent is $E_R+E_0=(E_X+E_0)-E_D-\varepsilon$, so the hardware adds the compile-time constant $-E_D-1$ and re-injects $\varepsilon$'s complement through the carry-in — no second adder, no mux on the exponent. Its width is $w_E+1$: the extra bit is what the exception logic reads to detect overflow and underflow, exactly as in a generic operator. Sign is a wire, since $D>0$.

> [!warning] Source inconsistency
> Fig. 15.7 labels the exponent adder $-E_C-1$ and §15.2.1.3 writes $E_c$, while §15.2.1 defines the constant's exponent as $E_D$. They are the same quantity; this note uses $E_D$ throughout.

**The dividend is the muxed significand with the rounding constant wired into its tail.** The unpacked significand $1.F_X$ is $w_F+1$ bits; the $\varepsilon$ mux produces $w_F+2$ bits; the further fixed left shift by $E_D$ is pure routing, and the round-to-nearest constant $H=\frac{D-1}{2}$ — an $E_D$-bit number — drops into the low $E_D$ bits that the shift has just zeroed. The bus into the divider is therefore $w_F+E_D+2$ bits, and the concatenation carries no adder and no carry chain. The derivation that turns $\lfloor z\rceil=\lfloor z+\tfrac12\rfloor$ into that wiring is in [[Dividend Bias Rounding]]; the consequence for this operator is that its critical path contains a comparator, a mux, and the divider — nothing else.

**What remains is a Euclidean divider by a constant, not a divider.** The $(w_F+E_D+2)$-bit dividend goes into the radix-$2^\alpha$ digit-recurrence chain of [[Division by Constants]], whose per-digit remainder table is $\alpha+\lceil\log_2 D\rceil$ bits in and out — small enough for one LUT level per digit, which is why this operator is dramatically cheaper on FPGA than a generic divider rather than merely somewhat cheaper. The quotient is $w_F+1$ bits with its MSB guaranteed set by the normalization above, so the implicit one is dropped by truncation and no post-normalization exists. On ASIC the same chain is a ripple of small constant-input adders; the FPGA advantage is narrower because there is no LUT to absorb the table for free.

**Scaled constants move one compile-time number and nothing else.** For $D'=2^kD$ the significand path is unchanged — $2^k$ has no significand — and the exponent adder adds $k-E_D-1$ instead of $-E_D-1$. When $k\ge E_D+1$ the added constant is non-negative, so the operator can overflow but can no longer underflow, and the exponent adder's extra bit is reinterpreted by the exception logic as overflow only (p. 466). Dividing by $12=2^2\cdot 3$ or by $0.75=2^{-2}\cdot 3$ therefore reuses the divide-by-3 datapath bit for bit.

$$\boxed{\ Y=\left\lfloor \frac{2^{E_D+\varepsilon}(1+F_X)+H}{D}\right\rfloor\cdot 2^{E_X-E_D-\varepsilon},\qquad \varepsilon=[F_X<F_D],\quad H=\tfrac{D-1}{2}\ }$$

**When it breaks.**

- **Even $D$.** The construction assumes $D$ odd, both for $H=(D-1)/2$ to be an integer and for the no-tie argument. Factor $D=2^kD_{\text{odd}}$ first; failing to do so gives a non-integer $H$ and a wrong result, not a slow one.
- **Mismatched input and output formats.** With identical formats and odd $D$ a tie is impossible, which is what deletes the sticky logic. Widen or narrow the output and exact halfway cases reappear, and a sticky path must be added back ([[Rounding]]).
- **Subnormal inputs.** The datapath above assumes $1+F_X\in[1,2)$. Subnormals need the same treatment as multiplication by the inverse constant — see [[Constant Multiplier with Subnormal Support]].
- **$D$ stops being small.** Every advantage is written in $E_D=\lfloor\log_2 D\rfloor$: the comparator is $E_D$ bits, $H$ is $E_D$ bits, the divider bus grows as $w_F+E_D+2$, and the per-digit table grows as $2^{\alpha+\lceil\log_2 D\rceil}$. Past a few dozen the table stops fitting a LUT and a reciprocal-multiplication or generic divider ([[Dividers]]) wins.
- **Composite $D$.** For $D=9$ a cascade of two divide-by-3 operators is cheaper than one divide-by-9 table, because the table cost is exponential in $\lceil\log_2 D\rceil$ while the cascade cost is linear in the number of factors.
- **Exceptions are not in this datapath.** Zero, $\pm\infty$ and NaN are carried by the 2-bit `exn` rail around it; the arithmetic core is valid only for normal $X$.

## RTL (Spade)

```spade
// Floating-point division by a small odd constant, binary32, D = 3.
// The three D-dependent constants: E_D = 1, F_D = .1_2 (E_D bits), H = (D-1)/2 = 1.
// Normal inputs only -- exceptions ride the surrounding unpack/pack blocks.
entity fpdiv_by3(s: bool, e: uint<8>, f: uint<23>) -> uint<32> {
    // F_X >= F_D reduces to the leading E_D = 1 bit of F_X
    let geq = f.msb();

    // significand 1.F_X, w_F+1 = 24 bits
    let one: uint<1> = 1;
    let ix: uint<24> = one.concat(f);

    // dividend = (1+F_X) << (E_D + eps)  ||  H       -- w_F+E_D+2 = 26 bits
    let ixz: uint<26> = zext(ix);
    let sh: uint<26> = if geq { ixz << 1 } else { ixz << 2 };
    let dividend: uint<26> = sh | 1;

    // Euclidean divider by the constant D
    let q: uint<26> = dividend `std::ops::comb_div` 3;

    // q is w_F+1 = 24 bits with its MSB set: drop the implicit one
    let frac: uint<23> = q.as_bits()[0..23].as_uint();

    // exponent adder: (E_X + E_0) - E_D - eps
    let dec: uint<8> = if geq { 1 } else { 2 };
    let er: uint<8> = trunc(e - dec);

    s.as_uint().concat(er).concat(frac)
}
```

`geq` is the comparator box, `sh` is the mux output already merged with the fixed $E_D$-bit routing shift (the drawing separates them; in gates they are the same set of wires), `dividend` is the $\Vert$ junction at $w_F+E_D+2=26$ bits, and `q` is $F_R$. The whole entity is combinational — a real operator registers it into a pipeline whose depth is set by the divider chain, not by this wrapper. Two things synthesis does differently from the drawing: `comb_div` by the literal 3 is a placeholder for the digit-recurrence chain of [[Division by Constants]] rather than a general divider, and the `e - dec` subtraction is emitted as a $w_E+1$-bit adder with `geq` folded into its carry-in.

Simulated against a behavioural reference that recomputes $(1+F_X)/3$ in double precision and renormalizes independently: 8 named vectors including the $F_X=F_D$ boundary and a bit-reversal pair, plus a 3000-vector random sweep — 3008/3008 pass.

## Related Notes

- [[Division by Constants]] – depends-on: supplies the Euclidean digit-recurrence divider that this operator wraps.
- [[Dividend Bias Rounding]] – supports: derives the $H$-into-the-dividend trick that deletes the rounding adder here.
- [[Magnitude Comparator]] – depends-on: the $F_X\ge F_D$ test, narrowed to $E_D$ bits.
- [[Dividers]] – compares: the generic operators, whose normalizer and variable-divisor recurrence this one deletes.
- [[Constant Multiplier with Subnormal Support]] – extends: subnormal handling, identical to multiplication by the inverse.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where this sits against every other specialized floating-point operator.
- [[FloPoCo]] – supports: generates this operator as `FPConstDiv we=8 wf=23 d=3`.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §15.2 "Floating-Point Division by a Small Integer Constant", pp. 464-466 — Eqs. (15.5)-(15.12), Fig. 15.7 (p. 465).
- §15.2.1.3 "Dividing by a Scaled Odd Integer", p. 466.
- §15.2.2 "Subnormal Handling", p. 467.
- Ch. 13, "Division by Constants" — the Euclidean divider this operator instantiates.
