---
title: Square Root Range Reduction
description: "Forces an even exponent so the square root is a one-bit exponent shift, at the cost of one denormalising shift of the significand into [1,4)."
kind: circuit
source: "ASA §19.1.1, pp. 574-575"
status: seed
spade: simulated
tags: [digital, square-root, floating-point, range-reduction, normalization, digit-recurrence-for-algebraic-functions]
aliases:
  - Square Root Range Reduction
  - Range Reduction for Square Root
  - Even-Exponent Reduction
  - Square-Root Argument Reduction
---

# Square Root Range Reduction

The front end of every floating-point square root: it forces the exponent even so that halving it is a wire shift, and pays for that with a single conditional one-bit shift of the significand into $[1,4)$.

```tikz title="Square root range reduction: the reduced domain M in [1,4) and its image [1,2), split into the even- and odd-exponent branches"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1.5cm, y=1.7cm]
  % the two branches of the reduced domain
  \fill[blue!10] (1,0) rectangle (2,2);
  \fill[orange!18] (2,0) rectangle (4,2);

  % axes
  \draw[->,>=latex] (0,0) -- (5.6,0) node[anchor=north east] {$X$};
  \draw[->,>=latex] (0,0) -- (0,2.55);

  % curve
  \draw[very thick,magenta,domain=0:5.3,samples=120,smooth] plot (\x,{sqrt(\x)});
  \node[anchor=south east,magenta] at (5.4,2.25) {$\sqrt{X}$};

  % guides
  \draw[dotted] (1,0) -- (1,1) -- (0,1);
  \draw[dotted] (2,0) -- (2,1.4142);
  \draw[dotted] (4,0) -- (4,2) -- (0,2);

  % ticks
  \foreach \x/\l in {1/1, 2/2, 4/4} {
    \draw (\x,0) -- (\x,-0.05);
    \node[anchor=north] at (\x,-0.06) {\small $\l$};
  }
  \node[anchor=north east] at (0,0) {\small $0$};
  \foreach \y/\l in {1/1, 2/2} {
    \draw (0,\y) -- (-0.04,\y);
    \node[anchor=east] at (-0.04,\y) {\small $\l$};
  }

  % branch labels inside the bands
  \node[anchor=south] at (1.5,2.02) {\small $E$ even};
  \node[anchor=south] at (3.0,2.02) {\small $E$ odd};
  \node[anchor=north] at (1.5,0.92) {\scriptsize $M=1.F$};
  \node[anchor=north] at (3.0,0.92) {\scriptsize $M=2{\times}1.F$};

  % domain / codomain brackets
  \draw[<->,>=latex] (1,-0.34) -- (4,-0.34);
  \node[anchor=north] at (2.5,-0.42)
    {\small $M \in [1,4)$ \; in \; \texttt{ufix(1,$\ell$)}, $2-\ell$ bits};
  \draw[<->,>=latex] (-0.80,1) -- (-0.80,2);
  \node[anchor=south,rotate=90] at (-0.82,1.5) {\small $\sqrt{M}\in[1,2)$};
\end{circuitikz}
\end{document}
```

*after Fig. 19.1, p. 575.*

**The parity of the exponent is the whole problem.** The square root is defined on positive reals only, and its binary range reduction rests on one identity,

$$\sqrt{2^{2p}x} = 2^p\sqrt{x}$$

which pulls a power of two out of the radicand only when its exponent is **even**. Given a normalised $X = 2^E\cdot 1.F$ with $1.F\in[1,2)$ and $E$ an integer, an odd $E$ would give $\sqrt{X} = 2^{E/2}\sqrt{1.F}$ with $E/2$ a half-integer — not a representable exponent. Nothing in the format can hold it, so the parity has to be fixed before the iteration starts, not after.

**Absorb the odd bit into the significand instead of into the exponent.** If $E$ is even take $2p = E$ directly. If $E$ is odd, *denormalise by one bit* — rewrite $X = 2^{E-1}\cdot(2\times 1.F)$, which is the same number by associativity of the product with $2^{-1}\cdot 2 = 1$ — so that $2p = E-1$ is even and the surplus factor of two lands in the significand. Since $1.F \in [1,2)$, the shifted significand $2\times 1.F$ lands in $[2,4)$. Merging the two branches:

$$
\sqrt{2^E\cdot 1.F} = 2^{E'/2}\sqrt{M},\qquad
\begin{cases} E'=E,\; M=1.F & E \text{ even}\\[2pt] E'=E-1,\; M=2\times1.F & E \text{ odd}\end{cases}
$$

so $M\in[1,4)$ unconditionally and $\sqrt{M}\in[1,2)$ unconditionally — the codomain is exactly one binade wide, which is what makes the result renormalisation-free. Because $\sqrt M \ge 1$ always, the leading digit of the digit recurrence is known before iteration 0: $d_0 = 1$, $S_0 = 1$ (see [[Digit Recurrence for Algebraic Functions]]).

**Both datapaths are shift-and-select, no adder on the significand side.** The exponent test is the low bit of $E$ — a wire. The exponent result is $E' \gg 1$, an arithmetic right shift by one on a signed exponent, again a wire. The significand path is a conditional left shift by one over $w$ bits ($w = 24$ for binary32, $53$ for binary64), which is one 2:1 multiplexer per bit selected by the parity bit — **not** a [[Barrel Shifters|barrel shifter]], because the shift distance is one or zero and nothing else. The reduced significand needs one extra integer bit to hold the $[2,4)$ case: $M$ lives in `ufix(1,`$\ell$`)`, $2-\ell$ bits, so `uint<25>` for binary32 against the stored 23-bit fraction. That extra bit is the real recurring cost — every $W_i$ and $S_i$ in the recurrence downstream carries it.

**A biased exponent field turns the free shift into one small constant addition.** The equation above is written in the *unbiased* exponent $E$; hardware stores $e = E + B$ with $B$ the format bias. Two things change. First, parity: $E \equiv e + B \pmod 2$, so with $B = 127$ (binary32, odd) the test inverts — $E$ is odd exactly when the stored field $e$ is **even**, i.e. the parity bit is $\overline{e_0}$, still a wire. Second, the output field is $e_{\text{out}} = E'/2 + B = (E' + 2B)/2$, and substituting $E' = e - B - [E \text{ odd}]$ gives

$$e_{\text{out}} = \left\lfloor \frac{e + B - [E\text{ odd}]}{2} \right\rfloor$$

which for binary32 is "add 127 or 126, then shift right by one" — a $\lceil\log_2\rceil$-width increment, not a wire. The book's claim that the exponent path costs no adder is exact for the mathematical exponent and off by one small constant adder for a stored IEEE-754 field ([[Number Formats]]). It is still off the significand critical path, which is what actually matters.

**Fixed-point inputs pay a normaliser round trip.** A fixed-point number with a large dynamic range is best converted to floating point first: a [[Leading Zero Counters|leading-zero counter]] to find the shift distance and a [[Normalizers|normaliser]] to apply it ([[Shifters]]). Note that the LZC output *is* the exponent, so its low bit doubles as the parity bit — the even/odd branch is free once you have normalised. After the square root a second shifter converts back, and because the result exponent is $E'/2$, the denormalising shift on the way back is half as far as the one on the way in.

**Whether you need the reduction at all depends on the evaluation method.** It matters most for methods that exploit differentiability: $\sqrt{\cdot}$ is *not* differentiable at $0$, its derivative $1/(2\sqrt x)$ blows up, and [[Polynomial Approximation]] degrades badly on any interval touching the origin — the minimax error of a degree-$d$ polynomial on $[0,a]$ does not shrink the way it does on $[1,4)$. Reducing to a fixed interval bounded away from zero is what makes a polynomial or a [[Square Root Seed Table|seed table]] viable at all. Plain tabulation over the whole input range does not care and does not need the reduction; a digit recurrence does not care about differentiability either, but still wants the reduction so that $S_0 = 1$ is known and the residual bound is scale-invariant.

$$\boxed{\;\sqrt{2^{E}\cdot 1.F} \;=\; 2^{E'/2}\sqrt{M},\qquad E' = E - (E \bmod 2),\quad M = 2^{E\bmod 2}\cdot 1.F \in [1,4)\;}$$

**When it breaks.**

- **Subnormals.** $X$ subnormal has no implicit leading one, so $1.F \in [1,2)$ fails and the reduction produces an $M$ outside $[1,4)$. A subnormal must be normalised first — LZC plus shifter — and the LZC result then folds into the exponent parity. This is the case that forces a real normaliser into an otherwise mux-only front end.
- **Zero, negatives, NaN.** $\sqrt{\cdot}$ is real only on $[0,\infty)$. IEEE-754 requires $\sqrt{-0} = -0$ and $\sqrt{x} = \text{NaN}$ for $x < 0$; neither is expressible in this reduction, so both are special-cased before it and bypass the datapath entirely.
- **Biased exponent field.** As above: one constant adder, not a wire.
- **Very wide fixed point.** The normalise / de-normalise round trip costs two shifters plus an LZC. If the input range is narrow enough that the exponent is statically known, skip the reduction and feed the fixed-point value straight in.
- **Tabulated evaluation.** With a full lookup table the reduction is pure overhead — the table indexes the raw input just as well.

**RTL (Spade).** The whole front end, sized for binary32.

```spade
/// binary32 square-root range reduction.
/// e: stored (biased) exponent field, f: stored fraction.
/// Returns (e_out, M) with M = 1.F or 2*1.F held in ufix(1,-23) as uint<25>.
entity sqrt_rr32(e: uint<8>, f: uint<23>) -> (uint<8>, uint<25>) {
    // bias 127 is odd, so E = e - 127 is odd exactly when e is even.
    let odd = !e.as_bits()[0];

    let sig: uint<24> = (1u1).concat(f);
    let m: uint<25> = if odd { zext::<24, 25>(sig) << 1 } else { zext(sig) };

    let k: uint<10> = if odd { 126 } else { 127 };
    let s: uint<10> = zext::<8, 10>(e) +. k;
    let e_out: uint<8> = trunc(s >> 1);

    (e_out, m)
}
```

`odd` is the parity wire — bit 0 of the stored field, inverted because the bias is odd. `sig` re-attaches the implicit leading one by concatenation, 23 bits becoming 24; `m` is the conditional one-bit left shift into 25 bits, the mux row of the paragraph above. `k` and the `+.` are the biased-field correction: 10 bits of headroom so $e + 127 \le 381$ never wraps, then `>> 1` and `trunc` back to the 8-bit field. The whole entity is combinational — no `reg`, one gate delay for the parity and one carry chain of 10 bits for the exponent. Synthesis will not build the `<< 1` as logic at all: it is a renaming of wires, and the two `zext` arms collapse into the same 25-bit bus with one mux select.

**Related notes.**

- [[Floating-Point Operators]] – depends-on: every floating-point square root opens with this block, and its special-case logic (zero, negative, NaN, subnormal) sits beside it.
- [[Range Reduction]] – compares: the general argument-reduction pattern for function evaluation; the square-root case is the cheapest instance because the reduction is exact and needs no multiplication.
- [[Normalizers]] – supports: supplies the $1.F \in [1,2)$ this reduction assumes, and handles subnormal inputs the reduction alone cannot.
- [[Leading Zero Counters]] – supports: produces the shift distance for the fixed-point route, and its low bit is the exponent parity for free.
- [[Barrel Shifters]] – counter-example: the general shifter this block does *not* need — the distance here is one bit, so a single mux row replaces $\log_2 w$ stages.
- [[Square Root Seed Table]] – extends: tabulates $S_{i_0}$ over the reduced interval, which only has a bounded index because $M$ was pinned to $[1,4)$.
- [[Restoring Square Root]] – depends-on: consumes $M$ and starts from $S_0 = 1$, $W_0 = M - 1$, both of which are consequences of this reduction.
- [[SRT Square Root]] – depends-on: same input contract, redundant digit set.
- [[Digit Recurrence for Algebraic Functions]] – depends-on: the recurrence whose scale-invariant residual bound assumes $M \in [1,4)$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §19.1.1 "Range Reduction for Floating-Point and Fixed-Point Binary", Eqs. (19.1)–(19.3) and Fig. 19.1 — pp. 574–575.
- §19.1.2 "Generic Radix-$\beta$ Formulation", for $d_0 = 1$, $S_0 = 1$ and the `ufix(1,`$\ell$`)` format of $M$ — pp. 575–576.
- §10.3 (normaliser = leading-zero counter + shifter), cited from p. 574.
