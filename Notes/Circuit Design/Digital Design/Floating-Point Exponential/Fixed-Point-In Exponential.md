---
title: "Fixed-Point-In Exponential"
description: "The FPExp datapath entered at X_fix: no unpack, no input shifter, no negate box, and exact guard bits — smaller and more accurate than converting to float first, at the price of signed constant multipliers."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-exponential, exponential, fixed-point, range-reduction]
aliases:
  - FixExp
  - Fixed-Point-In, Floating-Point-Out Exponential
  - Fixed-Point-In Floating-Point-Out Exponential
  - Fix-in Float-out Exponential
---

# Fixed-Point-In Exponential

An exponential whose input is an exact `sfix` word and whose output is a `float`, obtained by entering the [[FPExp Operator]] datapath one block downstream of its input converter.

```tikz title="The FPExp datapath entered at X_fix, with the three deleted blocks ghosted"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ===================== the deleted float front end (ghosted) =====================
  \draw[dashed,black!40] (-5.6,10.5) rectangle (1.2,11.1);
  \node[black!45] at (-2.2,10.8) {unpack};
  \draw[dashed,black!40,->] (-2.2,11.9) -- (-2.2,11.1);
  \node[anchor=west,black!45] at (-2.1,11.6) {$X$\quad\texttt{float}$(w_E,w_F)$};
  \draw[dashed,black!40,->] (-3.85,10.5) -- (-3.85,9.9);
  \draw[dashed,black!40] (-5.6,9.3) rectangle (-2.1,9.9);
  \node[black!45] at (-3.85,9.6) {shift to fixed point};
  \draw[dashed,black!40] (0.8,10.5) -- (0.8,9.9);
  \node[anchor=north east,black!45] at (0.75,10.35) {$s_X$};
  \node[anchor=west,black!45,align=left,font=\footnotesize] at (1.4,9.6)
    {\emph{deleted}: unpack, barrel shifter\\ and the sign path};
  \draw[dashed,black!40] (-3.85,9.3) -- (-3.85,8.95);

  % ===================== entry point =====================
  \draw[black!55] (-7.4,8.75) -- (-1.7,8.75);
  \node[anchor=north west,font=\footnotesize,black!55] at (-7.4,8.72)
    {the fixed-point-in operator starts here};

  \draw[->,very thick] (-1.0,9.6) -- (-1.0,7.85);
  \node[anchor=west] at (-0.9,8.9) {$X_{\mathrm{fix}}$\quad\texttt{sfix}$(w_E,-w_F)$, \textbf{exact}, $w_E{+}w_F{+}1$ bits};

  % ===================== pad g zero bits: a wire, not a block =====================
  \draw (-3.4,7.2) rectangle (1.4,7.85);
  \node at (-1.0,7.52) {pad $g$ zero bits \ (bare wire)};
  \draw[->] (-1.0,7.2) -- (-1.0,6.6);
  \node[anchor=west] at (-0.9,6.9) {\texttt{sfix}$(w_E,-w_F-g)$};

  % fan-out
  \draw (-1.0,6.6) -- (-4.6,6.6) -- (-4.6,6.05);
  \draw (-1.0,6.6) -- (1.6,6.6) -- (1.6,2.75);

  % ===================== x 1/ln2 (signed KCM) =====================
  \draw (-6.4,5.35) rectangle (-2.8,6.05);
  \node at (-4.6,5.7) {$\times\,1/\ln 2$, \ \textbf{signed} KCM};
  \draw[->] (-4.6,5.35) -- (-4.6,4.55);
  \node[anchor=west] at (-4.5,4.95) {$E$ \ \texttt{sint}$(w_E{+}2)$};

  % E also goes to the packer
  \draw (-4.6,4.85) -- (-7.2,4.85) -- (-7.2,-0.20);
  \draw[->] (-7.2,-0.20) -- (-5.6,-0.20);
  \node[anchor=south,rotate=90,font=\footnotesize] at (-7.3,2.4) {$E$: a bare wire to the exponent field};

  % ===================== x ln2 (signed KCM) =====================
  \draw (-6.4,3.85) rectangle (-2.8,4.55);
  \node at (-4.6,4.2) {$\times\,\ln 2$, \ \textbf{signed} KCM};
  \node[anchor=west,font=\footnotesize,align=left] at (-2.7,4.2) {MSBs not\\ computed};
  \draw[->] (-4.6,3.85) -- (-4.6,2.75);
  \node[anchor=west] at (-4.5,3.25) {$E\ln 2$ \ \texttt{sfix}$(w_E,-w_F-g)$};

  % ===================== ghosted negate =====================
  \draw[dashed,black!40] (2.9,3.85) rectangle (4.9,4.55);
  \node[black!45] at (3.9,4.2) {negate};
  \node[anchor=west,black!45,font=\footnotesize,align=left] at (5.05,4.2)
    {\emph{deleted}: $X_{\mathrm{fix}}$\\ is already signed};

  % ===================== subtract =====================
  \draw (-5.6,2.05) rectangle (2.4,2.75);
  \node at (-1.6,2.4) {$-$ \ \ (cancellation by design)};
  \draw[->] (-1.6,2.05) -- (-1.6,1.45);
  \node[anchor=west] at (-1.5,1.75) {$Y$\quad\texttt{sfix}$(-1,-w_F-g)$, \ $w_F{+}g{+}1$ bits};

  % ===================== e^Y =====================
  \draw (-3.2,0.75) rectangle (0.0,1.45);
  \node at (-1.6,1.1) {$e^Y$ evaluator};
  \draw[->] (-1.6,0.75) -- (-1.6,0.15);
  \node[anchor=west] at (-1.5,0.45) {$M$\quad\texttt{ufix}$(0,-w_F-g)$};

  % ===================== normalize round pack =====================
  \draw (-5.6,-0.55) rectangle (2.4,0.15);
  \node at (-1.6,-0.2) {normalize -- round -- pack \ (+ over/underflow)};
  \draw[->] (-1.6,-0.55) -- (-1.6,-1.15);
  \node[anchor=west] at (-1.5,-0.85) {$R$\quad\texttt{float}$(w_E,w_F)$};
\end{circuitikz}
\end{document}
```

*Own construction from Fig. 22.4, p. 648, with the blocks §22.4 removes drawn dashed. Everything below the rule is the fixed-point-in operator; everything above it is what the caller no longer pays for.*

**Take the signature seriously: this operator's natural input format is not its output format.** A fixed-point exponential with the same format in and out is a category error — from `sfix`$(m,\ell)$ the result reaches $e^{2^m-1}$, so its MSB must sit at $m'=\lceil 1.4427(2^m-1)\rceil$, which is $184$ for a perfectly ordinary $m=7$ (p. 643). The output belongs in floating point, where the format is used fully. But nothing forces the *input* into floating point, and the "computing just right" reading of the specification is therefore **fixed point in, floating point out** ([[Number Formats]], [[Fixed-Point Representations]], [[Floating-Point Formats]]). It is not a standard operator, and it does not need to be: it is literally a sub-circuit of the full one.

**Deleting the front end deletes three blocks, not one.** The nominal input is $X_{\mathrm{fix}}$ in `sfix`$(w_E,-w_F)$ — $w_E+w_F+1$ bits, chosen to match the IEEEfloat output word (p. 654). Against the full operator this removes `unpack` (no sign, exponent and significand fields to split), `shift to fixed point` (no barrel shifter of $w_E{-}2+w_F{+}g$ positions, no shift-distance subtractor $d=E_X-(E_0+w_F+g)$, no dropped LSBs — see [[Exponential Fixed-Point Converter]]), and `negate`, because a two's-complement $X_{\mathrm{fix}}$ already carries its sign in the datapath rather than in a separate sign bit. What remains is exactly the range reduction, the inner evaluator, and the packer.

**The exactness of the input is a statement about the guard bits, not about the arithmetic.** $X_{\mathrm{fix}}$ is entered at LSB $-w_F$, while the internal datapath runs at LSB $-w_F-g$ with $g\ge 3$. The $g$ low-order bits are therefore **literally zero** (p. 654), so widening the input to the internal format is a wire — a concatenation with a constant zero field, not a shifter and not a rounding. In the full operator that same widening is the shifter's output field, and the "$X$ small" branch of the error analysis exists precisely because significand bits fall off its right end for at most $1u$. That branch has no counterpart here: for a fixed-point input there is no case split at all.

**So the whole $\bar\delta_Y$ budget is spent on one multiplier.** With $\delta_Y=Y-(X_{\mathrm{fix}}-E\ln 2)$ and $E$ the value the architecture actually produced, the only remaining error source in the reduction is the constant multiplication by $\ln 2$ ([[Reduced Argument Subtractor]]), still bounded by $1u$ for a faithful multiplier — the same number as in [[FPExp Operator]], but now with the shifter term and the `negate` term both structurally absent rather than merely bounded. Everything downstream is unchanged: $\bar\delta_{\mathrm{arch}}<1-2u$ from the $e^Y$ evaluator, and (22.18) still binds at $\bar\delta_R<2^{-w_F-1}+4u$, so $g=3$ still lands exactly on faithful ([[Error Accuracy]]).

> [!note] The input being exact is not a licence to drop the guard bits
> $g$ protects the *output* of the subtraction, not its input. $Y$ is as small as $2^{-w_F-g}$ while $X_{\mathrm{fix}}$ and $E\ln 2$ are each as large as $2^{w_E}$: forming $Y$ annihilates up to $w_E$ leading bits, and every bit of $E\ln 2$ that was rounded away reappears at full weight in what survives. An exact input does nothing about that, because the term it removes is upstream of the cancellation and the term that matters is inside it. The intermediate precision of a range reduction is set by the magnitude of its **output**.

**The two constant multipliers become signed, and that is the whole price.** Fig. 22.4 keeps $|X_{\mathrm{fix}}|$ unsigned and pushes the sign into the `negate`/$\pm$ pair, so both KCMs see unsigned operands; here they see two's-complement ones (p. 654). For a KCM this costs the sign-extension of every partial product plus a signed table for the top digit — the tables for the remaining digits are unchanged, because the constant is what indexes them ([[Multiplication by Constants]]). It is a genuinely smaller cost than the barrel shifter it replaces, but it is not free, and it is the one line item that moves in the wrong direction.

**One width does grow.** In the full operator $|X|\ge 2^{w_E-1}$ is already a special case, so the internal MSB sits at $w_E-2$ and $E$ fits in $w_E+1$ signed bits. At the nominal fixed-point input format the MSB sits at $w_E$, so $|E|=|\lfloor X_{\mathrm{fix}}/\ln 2\rceil|<1.4427\cdot 2^{w_E}<2^{w_E+1}$ and $E$ needs $w_E+2$ signed bits. By the same one-bit shift, the "round the constant instead" recipe for the $1/\ln 2$ multiplier moves from $\ell_C=-3-w_E$ to $\ell_C=-4-w_E$. The $0.22$ budget on $X_{\mathrm{fix}}/\ln 2$ is unchanged, since it is fixed by the requirement $Y\in[-\tfrac12,\tfrac12)$ and nothing about that requirement moved.

**Over/underflow detection has to be paid for explicitly.** In the full operator the shift distance produces the coarse $\textsf{uo}$ flag for free — $d<0$ and $d>w_E-2+w_F+g$ are comparisons the shifter needs anyway. With no shifter there is no free flag, so the special-case logic becomes two magnitude comparisons on the high bits of $X_{\mathrm{fix}}$, or, cheaper, nothing at all: let $E$ run out of the destination exponent range and let `normalize-round-pack` detect it, which it must be able to do regardless ([[Exponential Special-Case Unit]], [[Exponential Normalize-Round-Pack]]).

**The reason to build it is upstream of the operator.** If an application takes the exponential of a *sum* — especially a long one — it should not form that sum in floating point (p. 643). A fixed-point summation is **exact** as long as it does not overflow, contributing zero rounding error where a floating-point summation contributes one rounding per term ([[Exact Accumulators]]). Feeding that exact sum to a fixed-point-in exponential is smaller *and* more accurate than converting it to float first, and the conversion you skip is exactly the shifter this operator does not contain. The mirror statement holds for the logarithm, whose natural operator is float in, fixed out; an application summing logarithms should sum them in fixed point too.

> [!warning] Not covered in the source — needs outside research
> §22.4 is three sentences (p. 654). The book gives this variant no figure, no width table, no error analysis and no cost figures, and Chapter 22 reports no LUT, slice, DSP or delay numbers for *any* of its architectures. The widths above ($E$ on $w_E+2$ bits, $\ell_C=-4-w_E$, the zero-pad, the over/underflow argument) are derived here from §22.3's analysis applied to the stated `sfix`$(w_E,-w_F)$ input; they are consistent with the book but are not stated by it. Do not cite them as the book's.

$$\boxed{\;X_{\mathrm{fix}}\ \text{exact}\ \Longrightarrow\ \delta_Y=\delta_{\times\ln 2}\ \text{alone},\qquad \bar\delta_Y\le 1u,\quad u=2^{-w_F-g}\;}$$

**When it breaks.**

- **The argument is already a float.** Then you pay a float-to-fix converter to enter here, which is the barrel shifter you deleted, and you have moved cost rather than removed it. This variant wins only when the argument is *born* in fixed point.
- **Many integer bits.** The useful domain of $\exp$ is roughly $[-103.3,\,88.73]$ at IEEEfloat(8,23); an input with more than about seven integer bits spends its width on values that are all special cases. Above $m\approx 7$ the extra input bits address nothing but $+0$ and $+\infty$.
- **Very small arguments.** $|X_{\mathrm{fix}}|<2^{-w_F-2}$ returns exactly $1.0$, so the LSB at $-w_F$ is the right place to stop — but if you need $e^X$ for tiny $X$ to full *relative* accuracy, the answer is $\mathrm{expm1}$, a different operator with a different range reduction.
- **Dropping $g$ because the input is exact.** Costs one ulp of the result immediately; see the callout.
- **Sign asymmetry in the signed KCM.** Two's complement is asymmetric, so $X_{\mathrm{fix}}=-2^{w_E}$ has no positive counterpart and must be inside the multiplier's verified range; the unsigned magnitude path in Fig. 22.4 never sees this case.

**RTL (Spade).** The range-reduction front end at $w_E=4$, $w_F=4$, $g=3$: $X_{\mathrm{fix}}$ is `sfix`$(4,-4)$ in `int<9>`, the internal LSB is $2^{-7}$, and both constant multipliers are signed.

```spade
/// Range-reduction front end of the fixed-point-in exponential.
/// X_fix is an exact sfix(4,-4) carried in int<9>; the internal datapath
/// LSB is 2^-7, i.e. g = 3 guard bits below the input's own LSB.
entity fixin_reduce(x: int<9>) -> (int<6>, int<7>) {
    // E = round(X / ln 2).  Signed KCM by 1/ln2 ~ 369/2^8 = round(2^8/ln 2)/2^8.
    let xe: int<10> = sext(x);
    let p: int<20> = xe * 369;
    let e: int<6> = trunc((p + 2048) >>> 12);

    // E ln 2 at LSB 2^-7.  Signed KCM by ln2*2^7 ~ 22713/2^8.
    let ee: int<16> = sext(e);
    let q: int<32> = ee * 22713;
    let l: int<13> = trunc((q + 128) >>> 8);

    // Y = X_fix - E ln 2.  X_fix enters by zero-padding g bits: a wire, not a shifter.
    let xs: int<13> = sext(x);
    let xg: int<13> = xs << 3;
    let y: int<7> = trunc(xg - l);
    (e, y)
}
```

`x` is the thick arrow into the drawing; `xg = xs << 3` is the `pad g zero bits` box, and it is a re-wiring of a constant amount, not the variable shifter above the rule. The two `*` are the two signed KCMs, and both operands of each are `int` — that is the signedness the note is about. `(p + 2048) >>> 12` is round-to-nearest by add-half-then-floor, `>>>` being the arithmetic shift that makes floor correct for negative $X$; `e` is the $w_E+2=6$-bit signed exponent and leaves as a bare wire. The final `trunc` to `int<7>` is the claim $Y\in\texttt{sfix}(-1,-w_F-g)$: with $1/\ln 2$ approximated by $369/2^8$ the pre-rounding error is $\le 0.021$, so $|Y|\le\ln 2\cdot 0.521<0.361$, comfortably inside $[-\tfrac12,\tfrac12)$ — the testbench asserts this rather than assuming it. Everything is combinational; synthesis will fold both constant multipliers into shift-and-add or LUT tables rather than the multiplier arrays the `*` suggests, and will drop the high bits of `q` that the subtraction is going to cancel anyway.

Simulated over the exhaustive 512-point input space plus 3000 random vectors, checked both against a behavioural reference and against $Y \approx X - E\ln 2$ evaluated in reals, with $|Y|<\tfrac12$ asserted on every vector.

**Related Notes.**

- [[FPExp Operator]] – extends: the full float-in operator; this is that datapath entered one block downstream, with the same $g$ and the same error budget.
- [[Exponential Fixed-Point Converter]] – counter-example: the block this variant exists to not contain, and the block you re-introduce if the argument arrives as a float.
- [[Reduced Argument Subtractor]] – depends-on: the $\times\ln 2$ KCM and the cancellation that now carries the entire $\bar\delta_Y$ budget alone.
- [[Tentative Exponent Unit]] – depends-on: the $\times 1/\ln 2$ block, here one bit wider and signed.
- [[Exponential Special-Case Unit]] – supports: over/underflow detection, which loses the free ride it had on the shifter's distance computation.
- [[Exponential Normalize-Round-Pack]] – depends-on: unchanged by this variant, and now the only place a leftover overflow can be caught.
- [[Exact Accumulators]] – supports: the exact fixed-point sum that is the reason to want this signature at all.
- [[Multiplication by Constants]] – depends-on: both KCMs become signed, which is the one cost that moves the wrong way.
- [[Fixed-Point Representations]] – depends-on: the `sfix`$(w_E,-w_F)$ input format and its two's-complement asymmetry.
- [[Floating-Point Formats]] – depends-on: the output word the input format is sized to match.
- [[Choosing an Exponential Architecture]] – compares: where this sits against the float-in siblings.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22:

- §22.2.1 Fixed point versus floating point — pp. 642–643 ($m'=\lceil 1.4427(2^m-1)\rceil$, the $m=7\Rightarrow m'=184$ example)
- §22.2.2 Fixed-point-in, floating-point-out version — p. 643 (the sub-circuit argument; sum in fixed point, not float; the mirror statement for the logarithm)
- §22.3.3 Fixed-point conversion — pp. 648–649 (Fig. 22.4, the blocks this variant deletes)
- §22.3.5 Computation of $Y$ — p. 650 (the KCM by $\ln 2$ and the sign handling of Fig. 22.4)
- §22.3.8 Overall error analysis — pp. 651–653 (22.11–22.18; $\bar\delta_Y=1u$, $g=3$)
- §22.4 Fixed-point-in, floating-point out exponential — p. 654 (`sfix`$(w_E,-w_F)$; exact $g$ guard bits; the `negate` box saved, the signed constant multipliers required)
