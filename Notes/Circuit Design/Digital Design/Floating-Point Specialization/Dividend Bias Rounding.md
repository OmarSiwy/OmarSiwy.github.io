---
title: Dividend Bias Rounding
description: "Round-to-nearest for free: pre-load H=(D-1)/2 into the low bits the normalization shift already zeroed, deleting the rounding adder's area and latency both."
kind: circuit
source: "ASA §15.2.1.2, pp. 465-466"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, division, rounding, constant, fpga]
aliases:
  - Dividend Bias
  - Dividend Pre-Bias
  - Pre-Biased Dividend
  - Rounding by Dividend Bias
---

# Dividend Bias Rounding

Round-to-nearest for a divider by an odd constant $D$, obtained by concatenating the constant $H=(D-1)/2$ into the dividend instead of incrementing the quotient — the only rounding scheme in the chapter whose hardware cost is exactly zero gates.

```tikz title="Bit positions of the dividend: the left shift by E_D+eps opens exactly the field that H occupies, so adding H is concatenation"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
\def\w{0.62}
% ---- row 1: the significand, w_F+1 bits ----
\foreach \i/\b in {0/1,1/0,2/1,3/1,4/0}{
  \draw (\w*\i,2.6) rectangle (\w*\i+\w,2.6+\w);
  \node at (\w*\i+0.5*\w,2.6+0.5*\w) {\b};}
\draw[|<->|] (0,2.6+\w+0.22) -- node[above,font=\tiny]{$I_X=2^{w_F}(1{+}F_X)$, $w_F{+}1$ bits} (5*\w,2.6+\w+0.22);
\node[anchor=west,font=\tiny] at (5*\w+0.35,2.6+0.5*\w) {$=10110_2=22$ \quad ($w_F=4$, $X=1.0110_2$)};
\node[anchor=east,font=\tiny] at (-0.25,2.6+0.5*\w) {significand};
% ---- shift arrow ----
\draw[->,thick] (3.5*\w,2.45) -- node[right,font=\tiny]{$\ll(E_D{+}\varepsilon)$, here $2$ bits} (3.5*\w,1.75);
% ---- row 2: shifted dividend, low field guaranteed zero ----
\foreach \i/\b in {0/1,1/0,2/1,3/1,4/0}{
  \draw (\w*\i,1.0) rectangle (\w*\i+\w,1.0+\w);
  \node at (\w*\i+0.5*\w,1.0+0.5*\w) {\b};}
\foreach \i/\b in {5/0,6/0}{
  \fill[black!10] (\w*\i,1.0) rectangle (\w*\i+\w,1.0+\w);
  \draw (\w*\i,1.0) rectangle (\w*\i+\w,1.0+\w);
  \node[gray] at (\w*\i+0.5*\w,1.0+0.5*\w) {\b};}
\node[anchor=east,font=\tiny] at (-0.25,1.0+0.5*\w) {shifted};
\node[anchor=west,font=\tiny,align=left] at (7*\w+0.35,1.0+0.5*\w)
  {$=1011000_2=88$; the shaded low field is\\ $E_D{+}\varepsilon$ bits wide and is $0$ by construction};
% ---- H dropped in ----
\node[draw,minimum height=0.45cm,font=\tiny] (hbox) at (3.3*\w,0.35) {$H=\tfrac{D-1}{2}=1_2$, $E_D$ bits};
\draw[->] (hbox.east) -- (6.5*\w,0.35) -- (6.5*\w,0.05);
% ---- row 3: result, pure wiring ----
\foreach \i/\b in {0/1,1/0,2/1,3/1,4/0,5/0}{
  \draw (\w*\i,-0.6) rectangle (\w*\i+\w,-0.6+\w);
  \node at (\w*\i+0.5*\w,-0.6+0.5*\w) {\b};}
\draw[very thick] (6*\w,-0.6) rectangle (7*\w,-0.6+\w);
\node[font=\bfseries] at (6.5*\w,-0.6+0.5*\w) {1};
\node[anchor=east,font=\tiny] at (-0.25,-0.6+0.5*\w) {dividend};
\node[anchor=west,font=\tiny] at (7*\w+0.35,-0.6+0.5*\w)
  {$=1011001_2=89$ \quad no adder, no carry can propagate};
\node[anchor=north west,font=\tiny,align=left] at (0,-1.35)
  {Here $D=3=2^1(1.1_2)$, so $E_D=1$, $H=1$, and $F_X<F_D$ forces $\varepsilon=1$.\\[3pt]
   $\left\lfloor\dfrac{2^{E_D+\varepsilon}(1{+}F_X)}{D}\right\rceil
    =\left\lfloor\dfrac{2^{E_D+\varepsilon}(1{+}F_X)\;\Vert\;H}{D}\right\rfloor$:
   round-to-nearest moves from the result to the\\[3pt] dividend, and lands in bits the
   normalization shift has already zeroed. $\lfloor 88/3\rceil=\lfloor 89/3\rfloor=29$.
   Divider bus: $w_F{+}E_D{+}2$ bits.};
\end{circuitikz}
\end{document}
```

*Own construction; the surrounding operator is Fig. 15.7, p. 465.*

**Fix the notation the trick lives in.** Write the odd constant as $D=2^{E_D}(1+F_D)$ with $1+F_D\in[1,2)$, so $D$ is an integer of $E_D+1$ bits and $F_D$ fits on $E_D$ bits — $5=2^2(1.01_2)$ gives $E_D=2$. The floating-point input is $X=2^{E_X}(1+F_X)$ with $F_X$ on $w_F$ bits, and the significand entering the divider is the integer $I_X=2^{w_F}(1+F_X)$ on $w_F+1$ bits, MSB always $1$. The normalization step of [[Floating-Point Divider by a Small Odd Constant]] left-shifts $I_X$ by $E_D+\varepsilon$ where $\varepsilon=[\,F_X<F_D\,]\in\{0,1\}$, giving a dividend bus of $w_F+E_D+2$ bits and a divider that returns $\lfloor N/D\rfloor$ for $N$ that dividend. Formats and the meaning of an ulp are in [[Number Formats]] and [[Error Accuracy]].

**Name the rounding you get if you do nothing, and the cost of repairing it.** A Euclidean divider that discards its remainder computes $\lfloor N/D\rfloor$, which is round-toward-zero — not IEEE-754's default and up to a full ulp wrong. The obvious repair compares the final remainder against $D/2$ and increments the quotient. The comparison itself is genuinely free: the rightmost table of the constant-divider recurrence ([[Division by Constants]], Fig. 13.3, p. 433) can be repurposed to emit the comparison result instead of the remainder digit. What is not free is the increment, a $(w_F+1)$-bit carry propagation sitting *after* the divider, i.e. squarely on the critical path, and paid for with a full [[RCA, Ripple-Carry Adder]] or a faster and larger equivalent.

**Move the half-ulp from the result to the dividend.** Round-to-nearest on a real $z$ is $\lfloor z\rceil=\lfloor z+\tfrac12\rfloor$ whenever $z$ is not exactly a tie. Applying it to the quotient and clearing the denominator by the distributivity of division over addition,

$$\left\lfloor \frac{2^{E_D+\varepsilon}(1+F_X)}{D}\right\rceil = \left\lfloor \frac{2^{E_D+\varepsilon}(1+F_X)+D/2}{D}\right\rfloor$$

which has traded an increment of the *quotient* for an addition into the *dividend*. That looks like no progress at all — $D/2$ is not even an integer — until oddness is used.

**Split $D/2$ using the oddness of $D$.** Powers of two are managed as exponents in a floating-point context, so $D$ may be taken odd; write $D=2H+1$ with $H=(D-1)/2$ an integer. Then $D/2=H+\tfrac12$, and dividing the split through by $D$:

$$\left\lfloor \frac{N+D/2}{D}\right\rfloor = \left\lfloor \frac{N+H}{D}+\frac{1}{2D}\right\rfloor,\qquad N=2^{E_D+\varepsilon}(1+F_X)$$

**Discard the residue $1/(2D)$ by a granularity argument.** Euclidean division of the integer $N+H$ by $D$ gives $N+H=qD+r$ with $0\le r\le D-1$, so the bracketed quantity is $q+\frac{2r+1}{2D}$. Since $r\le D-1$ we have $2r+1\le 2D-1<2D$, and since $r\ge 0$ we have $2r+1>0$; the fractional part is therefore in $(0,1)$ and the floor is $q$ either way. The added $\tfrac{1}{2D}$ can never carry the value across an integer boundary because a rational with denominator $D$ sits at least $\tfrac1D$ below the next integer, and $\tfrac{1}{2D}<\tfrac1D$. Hence

$$\left\lfloor \frac{N+H}{D}+\frac{1}{2D}\right\rfloor=\left\lfloor \frac{N+H}{D}\right\rfloor$$

and the correction is now a plain integer addition of a *design-time constant* into the dividend.

**Count the bits $H$ occupies, and the bits the shift already zeroed.** From $1+F_D\in[1,2)$ we get $2^{E_D}\le D<2^{E_D+1}$, hence $H=(D-1)/2<2^{E_D}$: the addend fits on exactly $E_D$ bits, never more. Meanwhile $N$ is $I_X$ shifted left by $E_D+\varepsilon\ge E_D$ bits, so its bottom $E_D+\varepsilon$ bits are zero by construction. The addend is narrower than the guaranteed-zero field, so no bit of $H$ ever meets a bit of $N$.

> [!important] Adding $H$ is wiring, not arithmetic
> Because the two operands have disjoint supports, $N+H$ is the bit-concatenation $N \,\Vert\, H$ — there is no bit position where both are $1$, so no carry is generated anywhere and no carry can propagate. The rounding adder's area *and* its latency both vanish, and the divider's input bus stays $w_F+E_D+2$ bits wide: the same bus it needed for the shift alone (p. 466). On an FPGA that deletes roughly $w_F+1$ LUTs and one full traversal of the hard carry chain from the post-divider path; on an ASIC it deletes a significand-wide adder from the slowest stage of the operator.

**Show that ties genuinely cannot occur, so no sticky logic is needed either.** The identity $\lfloor z\rceil=\lfloor z+\tfrac12\rfloor$ silently picks *round-half-up* at a tie, which is not IEEE-754's round-half-to-even — so it is only legal if ties are impossible. Suppose $N/D=m+\tfrac12$ for an integer $m$. Multiplying by $2D$ gives $2N=D(2m+1)$, so $D=2(N-mD)$ is even, contradicting the oddness of $D$. No exact halfway case exists, the choice of tie-break is vacuous, and the sticky-bit machinery that [[Pseudo-Sticky Tie Anticipation]] exists to cheapen is not needed at all here. This is the deeper reason the specialization works: oddness buys the integer split *and* the tie-freedom, from the same hypothesis.

$$\boxed{\ \left\lfloor \frac{2^{E_D+\varepsilon}(1{+}F_X)}{D}\right\rceil=\left\lfloor \frac{2^{E_D+\varepsilon}(1{+}F_X)\ \Vert\ H}{D}\right\rfloor,\qquad H=\frac{D-1}{2}\ \text{on } E_D \text{ bits}\ }$$

**When it breaks**

- **$D$ even.** $H=(D-1)/2$ is not an integer and the split collapses. Factor $D'=2^kD$ with $D$ odd and absorb $2^k$ into the exponent — the exponent adder adds $k-E_D-1$ instead of $-E_D-1$ (p. 466). This is not a limitation in practice, only a preprocessing obligation.
- **Tie-freedom is not portable across formats.** The proof above rounds at the weight of the dividend's LSB. Round the same quotient onto a coarser output grid of step $2^j$ and a tie needs $2N=D(2m+1)2^j$, which an odd $D$ satisfies happily ($D=3$, $N=3$, $j=1$). Different input and output formats bring both the tie cases and the sticky logic straight back.
- **$D=1$.** $E_D=0$, $H=0$, the zero field is empty and the whole operator degenerates to a wire — correct, but the note has nothing to say.
- **Non-constant divisors.** $H$ stops being a design-time constant, and worse, $E_D$ becomes a runtime value, so placing $H$ costs a barrel shifter. At that point a generic divider with an explicit rounding stage is the honest choice, and the whole specialization argument of [[Floating-Point Specialization]] evaporates.
- **A different normalization convention.** The trick is parasitic on the fact that this operator *left*-shifts by at least $E_D$. Any architecture that right-shifts, or that normalizes after the division rather than before, has no guaranteed-zero field and pays for the adder.

**RTL (Spade)**

```spade
use std::ops::comb_div;

/// Dividend-bias rounding for a divider by an odd constant D = 2*H + 1.
/// ED = floor(log2 D), so H = (D-1)/2 fits on exactly ED bits.
/// ix  : I_X = 2^WF (1 + F_X), WF+1 bits, MSB always 1
/// eps : 1 when F_X < F_D, the extra normalizing left shift
entity dividend_bias<#uint WF, #uint ED, #uint D, #uint H>(
    ix: uint<{WF + 1}>,
    eps: bool,
) -> uint<{WF + ED + 2}> {
    let h: uint<ED> = H;
    let z: uint<1> = 0;
    let dividend: uint<{WF + ED + 2}> = if eps {
        ix.concat(z.concat(h))      // I_X . 0 . H
    } else {
        z.concat(ix.concat(h))      // 0 . I_X . H
    };
    let d: uint<{WF + ED + 2}> = D;
    dividend `comb_div` d
}
```

`ix` is the top row of the diagram and `h` the boxed constant; the two `concat` arms are the whole circuit, since for integers `x.concat(y)` places `x` high and the compiler lowers it to a Verilog bit-vector literal — a rename, not a gate. The $\varepsilon$ multiplexer is the `if`, and it is the *only* logic on this path: `z` is the single zero bit the shift opens above $H$ when $\varepsilon=1$, so both arms are exactly $w_F+E_D+2$ bits and no `trunc` is needed. All of it is combinational; the top $E_D$ bits of the returned quotient are provably zero, since $N<2^{w_F+E_D+2}$ and $D\ge 2^{E_D}$ force $Q<2^{w_F+2}$. Synthesis will not build `comb_div` as drawn — a generic divider is a placeholder for the constant-divisor recurrence of [[Division by Constants]], which is what a real operator instantiates here.

Verified by simulation on the $D=3$, $w_F=23$ instance against an independent behavioural reference that never mentions $H$ — round-to-nearest computed the naive way as $\lfloor(2N+D)/2D\rfloor$ — over 7 named vectors plus a 3000-point random sweep of normalized significands: 3007/3007 match. Forcing $H=0$, i.e. reverting to truncation, fails the same testbench, so the check has teeth.

**Related Notes**

- [[Floating-Point Divider by a Small Odd Constant]] – depends-on: the operator this rounding lives inside, and the source of the $\varepsilon$ shift that opens the zero field.
- [[Division by Constants]] – depends-on: the Euclidean constant-divisor recurrence that consumes the biased dividend and whose tables make the remainder comparison free.
- [[RCA, Ripple-Carry Adder]] – counter-example: the block this note deletes; its $(w_F+1)$-bit carry propagation is exactly the latency the bias buys back.
- [[Rounding]] – supports: the $\lfloor z\rceil=\lfloor z+\tfrac12\rfloor$ identity, the tie-break rules, and why round-half-up would otherwise be illegal.
- [[Pseudo-Sticky Tie Anticipation]] – compares: what the same chapter has to build when ties *can* occur; oddness of $D$ makes all of it unnecessary here.
- [[Floating-Point Multiplier by a Rational Constant]] – extends: reuses this exact divider-plus-bias as the denominator half of a rational constant operator.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §15.2.1.1 Normalization and §15.2.1.2 Rounding, pp. 465-466 (eqs. 15.10-15.12); §15.2.1.3 Dividing by a Scaled Odd Integer, p. 466; Fig. 15.7, p. 465.
- Ibid., Fig. 13.3, p. 433, for the constant-divider table whose spare output supplies the remainder comparison.
- Long-form note `3.4) Floating-Point Specialization`, "The baseline operator for normalized inputs".
