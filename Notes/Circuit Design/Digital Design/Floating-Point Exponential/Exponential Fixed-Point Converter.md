---
title: "Exponential Fixed-Point Converter"
description: "One left barrel shifter plus a constant subtraction on the exponent turns the floating-point input into ufix(w_E-2, -w_F-g) and raises the coarse under/overflow flag — subnormal inputs need no special path because they all fall in the return-1.0 region."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-exponential]
aliases:
  - Shift to Fixed Point
  - Exponential Fixed-Point Conversion
  - X_fix
---

# Exponential Fixed-Point Converter

The front end of a floating-point exponential, which converts the floating-point argument to a single fixed-point format wide enough to cover every input the datapath will actually evaluate — and narrow enough that the conversion is one left shifter, because the special-case filter caps the exponent from above and the return-1.0 threshold caps it from below.

```tikz title="Shift-to-fixed-point: one constant subtraction, one unidirectional shifter, and a fixed output window"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= packed input word =================
  \draw (3.4,9.2) rectangle (9.0,9.8);
  \draw (4.0,9.2) -- (4.0,9.8);
  \draw (5.8,9.2) -- (5.8,9.8);
  \node[font=\tiny] at (3.7,9.5) {$s_X$};
  \node[font=\footnotesize] at (4.9,9.5) {$E_X$};
  \node[font=\footnotesize] at (7.4,9.5) {$F_X$};
  \node[anchor=south,font=\tiny] at (4.9,9.83) {$w_E=8$};
  \node[anchor=south,font=\tiny] at (7.4,9.83) {$w_F=23$};
  \node[anchor=east,font=\footnotesize] at (3.35,9.5) {$X$\ \ Nfloat$(8,23)$:};

  % ================= shift distance =================
  \draw[-latex] (4.9,9.2) -- (4.9,8.6);
  \draw (2.6,7.8) rectangle (7.2,8.6);
  \node[align=center,font=\footnotesize] at (4.9,8.2)
    {$d = E_X - (E_0 - w_F - g)$\\[1pt]\tiny one subtraction by the constant $101$};
  \draw (4.9,7.8) -- (4.9,7.2);
  \draw (1.0,7.2) -- (8.6,7.2);
  \node[anchor=south west,font=\tiny] at (4.95,7.24) {$d$: 6 bits, $0\le d\le 32$};

  \draw[-latex] (1.0,7.2) -- (1.0,7.0);
  \draw (-0.3,6.3) rectangle (2.3,7.0);
  \node[align=center,font=\tiny] at (1.0,6.65) {$d<0$\\$|X|<2^{1-w_F-g}$};
  \draw[-latex] (1.0,6.3) -- (1.0,4.15) -- (2.8,4.15);
  \node[anchor=west,font=\tiny] at (1.05,5.4) {\textsf{zero}};

  \draw[-latex] (8.6,7.2) -- (8.6,7.0);
  \draw (7.3,6.3) rectangle (10.1,7.0);
  \node[align=center,font=\tiny] at (8.7,6.65) {$d>w_E{-}2{+}w_F{+}g$\\$|X|\ge 2^{w_E-1}$};
  \draw[-latex] (10.1,6.65) -- (10.45,6.65);
  \node[anchor=west,font=\footnotesize] at (10.5,6.65) {\textsf{uo}};

  \draw[-latex] (4.9,7.2) -- (4.9,5.6);

  % ================= significand path =================
  \draw (7.4,9.2) -- (7.4,8.95) -- (11.6,8.95);
  \draw[-latex] (11.6,8.95) -- (11.6,8.7);
  \draw (10.4,8.0) rectangle (12.8,8.7);
  \node[align=center,font=\tiny] at (11.6,8.35) {prepend the hidden $1$};
  \draw (11.6,8.0) -- (11.6,5.3);
  \draw[-latex] (11.6,5.3) -- (8.0,5.3);
  \node[anchor=south,font=\tiny] at (9.8,5.34) {$1.F_X$\ \ \texttt{ufix}$(0,-w_F)$, 24 bits};

  % ================= single left shifter =================
  \draw (2.8,5.0) rectangle (8.0,5.6);
  \node[font=\footnotesize] at (5.4,5.3) {single left shifter, $\ll d$};
  \draw[-latex] (5.4,5.0) -- (5.4,4.5);
  \node[anchor=west,font=\tiny] at (5.45,4.75) {56 bits, 6 mux stages};

  \draw (2.8,3.8) rectangle (8.0,4.5);
  \node[font=\footnotesize] at (5.4,4.15) {keep bits $[55{:}23]$, force $0$ if \textsf{zero}};
  \draw[-latex] (5.4,3.8) -- (5.4,3.25);
  \node[anchor=west,font=\footnotesize] at (5.45,3.5)
    {$|X_{\mathrm{fix}}|$\ \ \texttt{ufix}$(w_E{-}2,-w_F{-}g)=$ \texttt{ufix}$(6,-26)$, 33 bits};

  % ================= alignment strip =================
  \node[anchor=west,font=\footnotesize] at (0,2.6)
    {Inside the shifter: the 56-bit word, MSB left; bit $p$ has weight $2^{p-49}$.};

  \draw[thick] (0,1.75) rectangle (4.8,2.15);
  \fill (0.0,1.75) rectangle (0.2,2.15);
  \node[anchor=west,font=\tiny] at (4.95,1.95)
    {$1.F_X$ at $d=32$, i.e.\ $e=w_E{-}2=6$: leading $1$ at weight $2^{6}$, nothing lost};

  \draw (0,0.9) rectangle (11.2,1.5);
  \fill[black!12] (6.6,0.9) rectangle (11.2,1.5);
  \draw (6.6,0.9) -- (6.6,1.5);
  \node[font=\tiny] at (3.3,1.2) {kept: 33 bits $=|X_{\mathrm{fix}}|$};
  \node[font=\tiny] at (8.9,1.2) {dropped: $w_F=23$ bits};
  \node[anchor=east,font=\tiny] at (-0.05,1.2) {shifter out};
  \node[anchor=north,font=\tiny] at (0.15,0.88) {55};
  \node[anchor=north,font=\tiny] at (6.6,0.88) {23};
  \node[anchor=north,font=\tiny] at (11.1,0.88) {0};

  \draw[thick] (6.4,-0.1) rectangle (11.2,0.3);
  \fill (6.4,-0.1) rectangle (6.6,0.3);
  \node[anchor=east,align=right,font=\tiny] at (6.3,0.1)
    {$1.F_X$ at $d=0$, i.e.\ $e=-(w_F{+}g)=-26$:\\leading $1$ at weight $2^{-26}$, every trailing bit lost};
\end{circuitikz}
\end{document}
```

*After the `shift to fixed point` box of Fig. 22.4, p. 648, opened up; the bit-alignment strip and the concrete IEEEfloat(8,23) numbers are my own, from §22.3.3, pp. 648–649.*

**Read the MSB off the special-case filter, not off the format.** The exponential is one of the few functions whose useful input range is far narrower than its input format. In IEEEfloat(8,23) the finite-result window is $X\in(-103.3,\,88.73)$, so the book relaxes the two exact thresholds to a single power-of-two test on the magnitude,

$$|X| \ge 2^{w_E-1} \ \Longrightarrow\ \exp(X) = 0 \ \text{or}\ +\infty \qquad (22.9)$$

which for $(8,23)$ means any $|X|\ge 2^7 = 128$. Relaxing costs nothing in hardware because the floating-point input arrives in sign/magnitude ([[Floating-Point Formats]]): $|X|\ge 2^{w_E-1}$ is a comparison of the exponent field against a constant, no significand involved. The datapath is therefore only ever asked to represent $|X| < 2^{w_E-1}$, which fixes the MSB of the unsigned $X_{\mathrm{fix}}$ at position $w_E-2$.

**Read the LSB off the return-1.0 threshold, then add guard bits.** At the other end, $|X| < 2^{-w_F-2}$ forces $e^X$ to round to exactly $1.0$ (Table 22.1), so no information below weight $-w_F-2$ can change the result and the nominal LSB is $-w_F-2$. That is the *nominal* LSB: everything downstream — the constant multiplications, the $e^Y$ evaluator, the final rounding — spends error budget in units of the internal ulp, so the real LSB is pushed to $-w_F-g$ for $g\ge 2$ guard bits, and the operator-wide analysis pins $g=3$ ([[Error Accuracy]]). The result is one static format,

$$X_{\mathrm{fix}} \in \texttt{ufix}(w_E-2,\ -w_F-g), \qquad w_E+w_F+g-1 \text{ bits},$$

33 bits for IEEEfloat(8,23) with $g=3$ ([[Fixed-Point Representations]]).

**Bias the shift distance so a bidirectional shift becomes a unidirectional one.** Write $e = E_X - E_0$ for the unbiased exponent, $E_0$ the format's bias, so $|X| = 2^{e}\cdot 1.F_X$ with $1.F_X$ in $\texttt{ufix}(0,-w_F)$, $w_F+1$ bits. Placing $1.F_X$ into the output format means moving its leading 1 to weight $2^e$: a *left* shift by up to $w_E-2$ when $e\ge 0$, a *right* shift by up to $w_F+g$ when $e<0$. A shifter that goes both ways costs roughly twice a one-way shifter of the same span ([[Barrel Shifters]]), and there is a standard way out: the two ranges are contiguous, so adding the constant $w_F+g$ to the distance makes it non-negative everywhere the value survives at all. Take

$$d \;=\; e + w_F + g \;=\; E_X - (E_0 - w_F - g) \;\in\; [\,0,\ w_E-2+w_F+g\,],$$

zero-extend $1.F_X$ into a word of $w_E+2w_F+g-1$ bits, left-shift by $d$, and read $|X_{\mathrm{fix}}|$ out of the **fixed** window starting at bit $w_F$. Because the bias is a compile-time constant, $d$ costs exactly one subtraction of a constant from $E_X$ — no adder tree, no exponent comparison, no leading-zero count.

> [!warning] The printed shift distance has its sign inverted
> Page 649 gives the distance as $E_X-(E_0+w_F+g)$, and this note's long-form source copied it. That form cannot be right: two sentences later the same page states that the distance is negative exactly when $X_{\mathrm{fix}}$ must be forced to $0$, and larger than $w_E-2+w_F+g$ exactly when $\textsf{uo}$ fires. Those two endpoints pin the distance to $[0,\,w_E-2+w_F+g]$, which only $d = E_X-(E_0-w_F-g)$ delivers — and only that form reproduces the book's own error analysis, whose "$X$ large" branch loses no significand bits provided $g\ge 1$. The worked example in the long-form note happens to have $w_E-1=g$, which makes both formulas agree numerically and hid the sign error. The Spade block below is simulated against $\lfloor |X|\cdot 2^{w_F+g}\rfloor$ and confirms the corrected form.

**Both out-of-range tests are comparisons on the same constant-shifted exponent.** If $d<0$, i.e. $|X| < 2^{1-w_F-g}$, the whole significand has fallen off the right of the window and $X_{\mathrm{fix}}$ is forced to $0$ — which is not a degradation but the correct answer, since $0$ propagates as $E=0$, $Y=0$, $e^Y=1$, the return-1.0 result. If $d > w_E-2+w_F+g$, i.e. $|X|\ge 2^{w_E-1}$, the coarse under/overflow flag $\textsf{uo}$ is raised and the value of $|X_{\mathrm{fix}}|$ stops mattering, so no saturation logic is needed. Both are comparisons of $E_X$ against constants; the entire block is one constant subtractor, two constant comparators, and one shifter.

**Input subnormals need no path of their own, and this is the one place in a floating-point operator where that is true.** A subnormal in IEEEfloat has $E_X=0$, no hidden 1, and magnitude below $2^{1-E_0-w_F}$ — orders of magnitude under the $2^{-w_F-2}$ return-1.0 threshold. So the correct output is $X_{\mathrm{fix}}=0$, which is precisely what the $d<0$ test already produces; prepending the hidden 1 unconditionally is harmless because the shifted word is discarded. Every other floating-point operator pays for subnormal inputs with a leading-zero counter and a normalising shifter; here the function's own flatness near zero swallows the entire subnormal range, and the block is no more complex in IEEEfloat than in Nfloat.

**The dropped low bits are the whole of the "$X$ small" error term.** The output window discards the low $w_F$ bits of the shifted word. For $e \ge -g$ we have $d \ge w_F$, the significand sits entirely inside the window, and the conversion is **exact** — that is the "$X$ large" branch of the error analysis, and it is why the analysis needs $g\ge 1$. Below that, trailing significand bits fall off, costing at most $1u$ with $u = 2^{-w_F-g}$. The cost is absorbed for free: in that regime the tentative exponent is $E=0$, so $E\ln 2$ is exact and this truncation is the *only* contributor to $\bar\delta_Y$, which the budget already allots $1u$. Rounding to nearest here would buy an adder and nothing else.

**On FPGAs the padding, not the muxing, is what you pay for.** The shifter spans $w_E+2w_F+g-1 = 56$ bit positions while only $w_E+w_F+g-1 = 33$ of them reach the output — the padding is the price of making the shift unidirectional, and it is routing rather than logic. That trade is worth it on an FPGA, where a 6-input LUT implements a 4:1 multiplexer and a barrel shifter therefore folds into roughly $\lceil \log_4 \rceil$ levels of the same fabric the rest of the design uses, so halving the mux count of a bidirectional shifter is a direct area saving ([[Shifters]]). On an ASIC the padded width matters more, because the wide low half is dead wire in every stage; a right-shift formulation from a fixed high anchor spans the same 56 positions, so there is no cheaper rearrangement.

$$\boxed{\ d = E_X - (E_0 - w_F - g),\qquad |X_{\mathrm{fix}}| = \big\lfloor\, |X| \cdot 2^{\,w_F+g}\big\rfloor \ \text{ on } \ \texttt{ufix}(w_E-2,\,-w_F-g)\ }$$

**When it breaks.**

- **The $\textsf{uo}$ flag is deliberately too coarse to be final.** For IEEEfloat(8,23) everything in $[88.73,\,128)$ passes it and still overflows. Those inputs must be caught downstream, which is why the tentative exponent carries $w_E+1$ bits and why `normalize-round-pack` re-checks the exponent.
- **It does not classify, it only filters.** $\textsf{uo}$ says "$0$ or $+\infty$" without saying which — that needs $s_X$ — and says nothing about Inf versus NaN inputs. The special-case unit owns that.
- **$g<2$ breaks the LSB.** The return-1.0 threshold sits at $-w_F-2$, so $g\ge 2$ is structural, not budgetary; and $g\ge 1$ is what makes the "$X$ large" branch lossless. $g=3$ comes from the global error budget, not from this block.
- **Output subnormals are not free even though input subnormals are.** In IEEEfloat a result below the smallest normal needs a $w_F$-bit shifter and exponent comparison — that cost lands entirely in `normalize-round-pack`, and this block is unchanged.
- **A fixed-point-in operator deletes this block outright**, along with the entire "$X$ small" case of the error analysis, because its argument is already exact in a static format.

**RTL (Spade).**

```spade
/// shift-to-fixed-point for the exponential's range reduction.
/// Nfloat(8,23), g = 3:  E_0 = 127, E_0 - w_F - g = 101, X_fix is ufix(6,-26).
entity exp_shift_to_fix(ex: uint<8>, fx: uint<23>) -> (uint<33>, bool) {
    let one: uint<1> = 1;
    let sig: uint<24> = one.concat(fx);        // 1.F_X, ufix(0,-w_F)

    let d: uint<6> = trunc(ex -. 101);         // d = E_X - (E_0 - w_F - g)
    let zero = ex < 101;                       // d < 0  -> X_fix = 0
    let uo   = ex > 133;                       // d > 32 -> coarse under/overflow

    let wide: uint<56> = zext(sig);
    let sh:   uint<56> = zext(d);
    let shifted: uint<56> = wide << sh;

    let xfix: uint<33> = shifted.as_bits()[23..56].as_uint();
    (if zero { 0 } else { xfix }, uo)
}
```

`ex`/`fx` are the unpacked exponent and fraction fields; `one.concat(fx)` is the *prepend the hidden 1* box, `wide` is the zero-padded 56-bit shifter word of the alignment strip, and the slice `[23..56]` is the fixed output window — index 0 is the LSB in Spade, so `[23..56]` is exactly bits $[55{:}23]$ in the drawing. `-.` is the wrapping subtract, correct here only because `zero` masks the case where it wraps. The block is purely combinational, no clock and no register; synthesis will not build the 56-bit word the source implies — the low 23 bits of the final stage are dead and get swept, and the two comparators against 101 and 133 collapse into a handful of gates on `ex` alone.

Simulated with `.zettel/sim.sh` against $\lfloor |X|\cdot 2^{26}\rfloor$ computed in exact 64-bit integer arithmetic: 5012 vectors, zero failures. The named vectors include the asymmetric pair $F_X = 1$ versus $F_X = 2^{22}$, which a reversed window or a reversed `concat` would swap, plus both range boundaries ($E_X = 100/101$ and $133/134$) and a subnormal.

**Related Notes.**

- [[FPExp Operator]] – supports: this is the first block of its datapath, and the format it fixes here is the format every later block inherits.
- [[Tentative Exponent Unit]] – supports: consumes $X_{\mathrm{fix}}$ truncated to LSB $-4$, so most of the width bought here is not even seen by the next block.
- [[Reduced Argument Subtractor]] – supports: consumes $X_{\mathrm{fix}}$ at full width, and the $g$ guard bits placed here are what survive its catastrophic cancellation.
- [[Fixed-Point-In Exponential]] – counter-example: deletes this block entirely and is both smaller and more accurate for it.
- [[Exponential Special-Case Unit]] – compares: does the exact classification that the $\textsf{uo}$ flag here only approximates.
- [[Barrel Shifters]] – depends-on: the single unidirectional shifter, and the reason a bidirectional one is worth biasing away.
- [[Floating-Point Formats]] – depends-on: sign/magnitude input, biased exponent, hidden bit, subnormal encoding.
- [[Fixed-Point Representations]] – depends-on: the `ufix(m,l)` notation the output format is stated in.
- [[Shifters]] – depends-on: FPGA and ASIC mappings of the shift network.
- [[Error Accuracy]] – depends-on: the ulp and guard-bit vocabulary the $g=3$ choice is argued in.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §22.2, Table 22.1 and Fig. 22.2, pp. 643–645 — the borderline cases, including the $|X|<2^{-w_F-2}\Rightarrow 1.0$ threshold that fixes the LSB.
- §22.3.1, Fig. 22.4, p. 648 — the FPExp architecture; the `shift to fixed point` box is the subject of this note.
- §22.3.2, p. 647 — why the relaxation to a pure exponent test is admissible.
- §22.3.3, pp. 648–649 — (22.9), the MSB and LSB derivation, the shift distance, the $\textsf{uo}$ and force-to-zero conditions, and the subnormal argument.
- §22.3.8, pp. 651–653 — the error analysis whose "$X$ small" / "$X$ large" split this block's truncation feeds, and the choice $g=3$.
- Chap. 10 — the single-left-shifter construction for a bidirectional shift.
