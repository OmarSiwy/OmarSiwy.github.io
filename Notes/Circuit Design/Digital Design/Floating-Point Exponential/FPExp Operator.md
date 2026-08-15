---
title: FPExp Operator
description: "A complete float-in/float-out exponential: additive range reduction whose 2^E reconstruction is free because it lands straight in the exponent field — at the cost of two constant multipliers held to absolute accuracy 2^{-w_F-g} regardless of how large X is."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-exponential]
aliases:
  - FPExp
  - Floating-Point Exponential Operator
  - Floating-Point exp
---

# FPExp Operator

A faithful `float`$(w_E,w_F)$-in, `float`$(w_E,w_F)$-out exponential built on the additive range reduction $X = E\ln 2 + Y$, distinguished among elementary-function operators by a reconstruction step that costs nothing: $2^E$ *is* the exponent field of the result.

```tikz title="FPExp datapath: unpack, fixed-point conversion, tentative exponent, Y, e^Y, normalize-round-pack"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= unpack =================
  \draw (-5.0,10.0) rectangle (4.6,10.7);
  \node at (-0.2,10.35) {unpack};
  \draw[-latex] (-0.2,11.5) -- (-0.2,10.7);
  \node[anchor=west,font=\footnotesize] at (-0.15,11.2) {$X$\quad\texttt{float}$(w_E,w_F)$};

  % ---- taps out of unpack
  \draw[-latex] (-3.7,10.0) -- (-3.7,9.2);
  \node[anchor=east,font=\footnotesize] at (-3.75,9.62) {$E_X$\ \ $w_E$};
  \draw[-latex] (-1.0,10.0) -- (-1.0,9.2);
  \node[anchor=west,font=\footnotesize] at (-0.95,9.62) {$1.F_X$\ \ \texttt{ufix}$(0,-w_F)$};
  \draw (4.2,10.0) -- (4.2,3.95);
  \node[anchor=east,font=\footnotesize] at (4.15,9.62) {$s_X$};

  % ================= shift to fixed point =================
  \draw (-5.0,8.5) rectangle (0.6,9.2);
  \node at (-2.2,8.85) {shift to fixed point};
  \draw[-latex] (-5.0,8.85) -- (-7.4,8.85);
  \node[anchor=south,font=\footnotesize] at (-6.0,8.9) {\textsf{uo}};

  \draw (-2.2,8.5) -- (-2.2,7.95);
  \node[anchor=west,font=\footnotesize] at (-2.15,8.2) {$|X_{\mathrm{fix}}|$\ \ \texttt{ufix}$(w_E-2,\,-w_F-g)$};
  \draw (-3.7,7.95) -- (1.9,7.95);
  \draw[-latex] (-3.7,7.95) -- (-3.7,7.4);
  \draw[-latex] (1.9,7.95) -- (1.9,6.0);

  % ================= x 1/ln2 =================
  \draw (-4.9,6.7) rectangle (-2.5,7.4);
  \node at (-3.7,7.05) {$\times\,1/\ln 2$};
  \draw[-latex] (-3.7,6.7) -- (-3.7,6.0);
  \node[anchor=west,font=\footnotesize] at (-3.65,6.3) {$|E|$\ \ \texttt{ufix}$(w_E,0)$};

  % ================= x (-ln2) =================
  \draw (-4.9,5.3) rectangle (-2.5,6.0);
  \node at (-3.7,5.65) {$\times\,(-\ln 2)$};
  \draw[-latex] (-3.7,5.3) -- (-3.7,4.3);
  \node[anchor=west,font=\footnotesize] at (-3.65,4.7) {both \texttt{sfix}$(-1,-w_F-g)$};

  % ================= negate =================
  \draw (0.7,5.3) rectangle (3.1,6.0);
  \node at (1.9,5.65) {negate};
  \draw[-latex] (4.2,5.65) -- (3.1,5.65);
  \draw[-latex] (1.9,5.3) -- (1.9,4.3);

  % ================= +/- =================
  \draw (-5.0,3.6) rectangle (3.1,4.3);
  \node at (-0.95,3.95) {$+\ /\ -$};
  \draw[-latex] (4.2,3.95) -- (3.1,3.95);
  \draw[-latex] (-0.95,3.6) -- (-0.95,2.9);
  \node[anchor=west,font=\footnotesize] at (-0.9,3.2) {$Y$\ \ \texttt{sfix}$(-1,-w_F-g)$};

  % ================= e^Y =================
  \draw (-2.7,2.1) rectangle (0.8,2.9);
  \node at (-0.95,2.5) {$e^Y$};
  \draw[-latex] (-0.95,2.1) -- (-0.95,1.4);
  \node[anchor=west,font=\footnotesize] at (-0.9,1.7) {$M$\ \ \texttt{ufix}$(0,-w_F-g)$};

  % ================= normalize-round-pack =================
  \draw (-5.0,0.7) rectangle (4.6,1.4);
  \node at (-0.2,1.05) {normalize -- round -- pack};
  \draw[-latex] (-0.2,0.7) -- (-0.2,0.0);
  \node[anchor=west,font=\footnotesize] at (-0.15,0.3) {$R$\ \ \texttt{float}$(w_E,w_F)$};

  % ============ the free reconstruction: |E| bypasses the datapath ============
  \draw[very thick] (-3.7,6.35) -- (-5.9,6.35) -- (-5.9,1.15);
  \draw[very thick,-latex] (-5.9,1.15) -- (-5.0,1.15);
  \node[anchor=north,rotate=90,font=\footnotesize] at (-5.82,3.7)
    {$|E|$: a bare wire to the exponent field};

  % ================= exception bits =================
  \draw (-5.0,10.35) -- (-7.4,10.35) -- (-7.4,0.9) -- (-5.0,0.9);
  \node[anchor=north,rotate=90,font=\footnotesize] at (-7.48,5.6) {exception / \textsf{uo} bits};
\end{circuitikz}
\end{document}
```

*After Fig. 22.4, p. 648, drawn for Nfloat$(w_E,w_F)$. $g\ge3$ guard bits; $\textsf{uo}$ is the coarse under/overflow flag the shifter derives from the exponent field alone.*

**Fold an unbounded input onto a bounded one with a single subtraction.** The exponential is a homomorphism from $(\mathbb{R},+)$ to $(\mathbb{R}^{+*},\times)$ — $e^{x+y}=e^xe^y$ — and a range reduction is nothing but a homomorphism you can afford to undo. Combining that with $2^x = e^{x\ln 2}$ gives the decomposition the whole operator is built on:

$$X = E\cdot\ln 2 + Y,\qquad E = \left\lfloor \frac{X}{\ln 2}\right\rceil,\qquad Y = X - E\times\ln 2 \tag{22.4--22.6}$$

Rounding to nearest in the middle equation has no tie case, because $\ln 2$ is irrational while $X$ is a dyadic rational, so $X/\ln 2$ is never exactly a half-integer. The reduced argument is then forced into $Y\in[-\tfrac{\ln 2}{2},\tfrac{\ln 2}{2}]$ — an interval of width $0.69$ **whatever the magnitude of $X$**, covered exactly by a fixed-point vector of $w_F+g+1$ bits. Everything downstream of the subtraction is independent of the input exponent; see [[Range Reduction]] for the general pattern this is the cheapest instance of.

**Cash the reduction in as a concatenation rather than a multiplication.** Substituting (22.4) into $2^x=e^{x\ln 2}$ and then applying $e^{x+y}=e^xe^y$,

$$e^X = e^{E\ln 2 + Y} = e^{E\ln 2}\cdot e^Y = 2^E\cdot e^Y \tag{22.7}$$

and $2^E$ is not a multiplication: it is the exponent field of the result, reached by $E$ on a bare $w_E+1$-bit wire — the bold path in the figure, which crosses the entire datapath without meeting a single gate. This is why the exponential alone among the elementary functions pays nothing for reconstruction: its reduction is additive on the input and multiplicative-by-a-power-of-two on the output, which is exactly the structure of a floating-point number ([[Floating-Point Formats]]). The only mismatch is that $e^Y\in[0.7,1.42]$ while a normalised significand must lie in $[1,2)$, leaving one bit of correction:

$$R = \begin{cases} 2^E\cdot e^Y & \text{if } e^Y\ge 1\\ 2^{E-1}\cdot(2e^Y) & \text{if } e^Y<1\end{cases} \tag{22.8}$$

The test is the MSB of $e^Y$, the multiplication by $2$ is a wired shift, and the $-1$ is absorbed into the exponent adder ([[Exponential Normalize-Round-Pack]]). That is the entire reconstruction cost.

**Compute $E$ badly on purpose.** $E=\lfloor X/\ln 2\rceil$ is a multiplication by the irrational $1/\ln 2$, and evaluating it to the precision of $X$ would dominate the operator's area. It does not have to be right. $E$ is *not* the exponent of the result — (22.8) fixes that anyway — it merely selects which $Y$ we land on, so an inaccurate quotient has exactly two consequences: $E$ differs from the ideal by at most one, and the interval of $Y$ widens. The second is actively useful. Since $\tfrac{\ln 2}{2}\approx 0.347$ and the next power of two is $\tfrac12$, **relaxing the specification to $Y\in[-\tfrac12,\tfrac12)$ costs no bit** — the vector holding $Y$ is unchanged — while filling the roughly 30% of a $Y$-addressed table that the tight bound would have left dark. It widens $e^Y$ only to $[0.6,1.7]$, still inside the working range of (22.8); the error analysis below uses the slightly tighter $[0.65,1.65]$. The budget for the block computing $X_{\mathrm{fix}}/\ln 2$ falls straight out of the worst case $Y=-\tfrac12$, where the computed $E\ln 2$ is off by $\tfrac12-\ln 2$, so the pre-rounding quotient was off by at most $\frac{1-\ln 2}{2\ln 2}\le 0.22$ — the whole allowance that [[Tentative Exponent Unit]] gets to spend.

**Do not try to skip the correction step.** The obvious alternative is $E=\lfloor X/\ln 2\rfloor$, floor rather than nearest, giving $Y\in[0,\ln 2)$ and $e^Y\in[1,2)$: a properly normalised significand with no correction at all. It fails, for a reason worth remembering — it holds only if the *whole* datapath, constant multiplier included, is correctly rounded. The moment the target is merely faithful, a 1-bit error in $E$ reappears and the correction comes back. Correct rounding here is extremely expensive [Mul+18], so you pay for the correction regardless; having paid, you may as well cash the $[-\tfrac12,\tfrac12)$ relaxation everywhere else.

**Widths, end to end.** The input is $w_E+w_F+1$ bits, and `unpack` yields $s_X$ (1 bit), $E_X$ ($w_E$ bits) and $1.F_X$ as `ufix`$(0,-w_F)$. `shift to fixed point` produces $|X_{\mathrm{fix}}|$ in `ufix`$(w_E-2,\,-w_F-g)$: the MSB sits at $w_E-2$ because $|X|\ge2^{w_E-1}$ already implies $+0$ or $+\infty$, and the LSB at $-w_F-g$ because $|X|<2^{-w_F-2}$ already implies exactly $1.0$, plus $g$ guard bits. It is one left shifter of distance $E_X-(E_0+w_F+g)$ — a single subtraction by a constant — covering both shift directions ([[Barrel Shifters]], [[Exponential Fixed-Point Converter]]). $|E|$ is `ufix`$(w_E,0)$, while the signed $E$ needs $w_E+1$ bits: the extra bit accommodates the $E-1$ of (22.8) and the rounding-overflow case, and lets `normalize-round-pack` catch the overflowing inputs the coarse $\textsf{uo}$ test let through. $Y$ is `sfix`$(-1,-w_F-g)$, i.e. $w_F+g+1$ bits, and $M\approx e^Y$ is `ufix`$(0,-w_F-g)$.

> [!important] Subtract $E\ln 2$ in extended precision, or the reduction eats the accuracy it exists to protect
> Forming $Y$ is a **catastrophic cancellation by design**: $|X_{\mathrm{fix}}|$ and $E\ln 2$ are each as large as $2^{w_E-1}$ and their difference as small as $2^{-w_F-g}$, so up to $w_E$ leading bits annihilate and every bit of $E\ln 2$ that was rounded away reappears at full weight in $Y$. Two things save it, both deliberate. First, $X_{\mathrm{fix}}$ carries $g$ guard bits *below* the format's LSB; done at working precision $-w_F$ the surviving $Y$ would be accurate only to $2^{-w_F}$ absolute, a full ulp of the result before the inner evaluator has done anything at all. Second, $\ln 2$ is stored to the precision of the **product**, not of the format: a $\ln 2$ rounded to $w_F$ bits injects an error $2^{-w_F}|E|$, growing with $|X|$, so the operator silently loses accuracy on large arguments while passing every small-argument test. The general rule ([[Error Accuracy]]) is that a subtraction of nearly equal quantities takes its intermediate precision from the **output** magnitude, never the input magnitude.

**The multiplier by $\ln 2$ is unusual in two ways.** Its high bits need not be computed at all — by construction the subtraction cancels the integer part and the first fractional bit, and only a *constant* multiplier can know in advance which of its own MSBs to skip. And its shape is few input bits ($w_E+1$) to many output bits ($w_F+g+1$), the textbook case for a table-based [[KCM, Table-Based Constant Multiplication]] rather than shift-and-add. There is also a purely structural FPGA choice here: because $X_{\mathrm{fix}}$ arrives in sign/magnitude, the honest computation is $|X_{\mathrm{fix}}|-E\ln 2$ *then* negate, but Fig. 22.4 instead forms $|X_{\mathrm{fix}}|+(-E\ln 2)$ or $-|X_{\mathrm{fix}}|-(-E\ln 2)$ under control of $s_X$, running the `negate` carry chain concurrently with the two constant multipliers instead of after them ([[Reduced Argument Subtractor]]).

**The inner evaluator gets the easy half of the accuracy problem.** $Y\in(-\tfrac12,\tfrac12)$ gives $e^Y\in[0.65,1.65]$: the interval excludes zero, the MSB is static at position $0$, and the whole of $e^Y$ is a fixed-point computation with no cancellation risk. More than that — the operator promises a *relative* error under $2^{-w_F}$ on $e^X$, but $\delta_R\approx\delta_M/e^Y$ with $e^Y=\Theta(1)$, so a relative error on the result is an **absolute** error of the same order on $M$, which is exactly what a fixed-point datapath delivers naturally. The reverse holds upstream: an absolute error $\delta_Y$ on the reduced argument becomes a *relative* error $\approx\delta_Y$ on $e^X$, since $e^{Y+\delta}=e^Ye^{\delta}\approx e^Y(1+\delta)$. The hard accuracy therefore lives entirely in the range reduction, which is why $e^Y$ can be a truncated table plus one small multiplier while the constant multipliers upstream get the careful treatment ([[Choosing an Exponential Architecture]]).

**Closing the budget fixes $g=3$.** Working in units of $u=2^{-w_F-g}$, an exact `negate` and a faithful $\ln 2$ multiplier give $\bar\delta_Y=1u$. Propagating through the exponential, $\delta'_Y = e^Y\!\left(1-e^{-\delta_Y}\right) = e^Y\!\left(\delta_Y-\tfrac{\delta_Y^2}{2}+\cdots\right)$ by the series for $e^x$, so $|\delta'_Y|<e^Y|\delta_Y|(1+u)$: the error on the reduced argument is amplified by the function value itself. Splitting on (22.8), the $M<1$ branch binds, because doubling the significand doubles both error terms:

$$|\delta_R| < 2^{-w_F-1} + 2|\delta_{\mathrm{arch}}| + 2(1+u)|\delta_Y| \tag{22.18}$$

Specifying the inner evaluator at $\bar\delta_{\mathrm{arch}}<1-2u$ leaves $\bar\delta_R < 2^{-w_F-1}+4u$, and $g=3$ makes $4u=2^{-w_F-1}$, hitting the faithful target $2^{-w_F}$ exactly with nothing to spare. Half that budget goes to the one term no architectural choice can shrink — the final rounding to $w_F$ bits — which is precisely what $g$ exists to pay for. The $e^Y\ge1$ branch has about $1.35u$ of slack, which §22.5 spends by relaxing $\bar\delta_{\mathrm{arch}}$ to $2.3u$.

**Worked example: $e^{3.5}$ in Nfloat(4,4)**, so $w_E=w_F=4$, $g=3$, $u=2^{-7}$. The input $3.5=1.75\times2^1$ unpacks to $s_X=0$, $1.F_X=1.1100_2$, and the shifter lands it exactly as $|X_{\mathrm{fix}}|=011.1000000_2$ in `ufix`$(2,-7)$ — nothing lost, because the significand moved left. Truncated to LSB $-4$ for the first constant multiplier, $3.5\times1.442695=5.049$ rounds to $E=5$; the pre-rounding value is $0.049$ from the integer, comfortably inside the $0.22$ budget. The KCM returns $5\ln2=3.4657$ faithfully at $2^{-7}$, i.e. $444/128=3.46875=011.0111100_2$, and the subtraction annihilates the four leading columns to leave $Y=0.03125=2^{-5}$ in `sfix`$(-1,-7)$. Against the ideal $3.5-5\ln2=0.0342641$ that is $\delta_Y=-0.386u$, and **all of it came from rounding $E\ln2$ at $2^{-7}$** — had $\ln2$ been stored only to the format's own $2^{-4}$, this single term would have been $\approx5\times2^{-4}=8u$ and eaten the entire budget on a constant. The inner evaluator returns $M=1.0000100_2=1.03125$; since $M\ge1$ the exponent stays $5$, and adding the half-ulp $2^{-5}$ then truncating gives $1.F_R=1.0001_2$, so $R=2^5\times1.0625=34$. With $e^{3.5}=33.11545$ and an ulp of $2^5\times2^{-4}=2$, the error is $0.442$ ulp — under the promise, and correctly rounded here, which the operator does not guarantee.

$$\boxed{\ e^X = 2^{E}\cdot e^{Y},\qquad E=\left\lfloor \tfrac{X}{\ln 2}\right\rceil,\qquad Y = X-E\ln 2 \in \left[-\tfrac12,\tfrac12\right),\qquad g=3\ \Rightarrow\ |\delta_R|<2^{-w_F}\ }$$

**When it breaks.**

- **Outside $2^{-w_F-2}\le|X|<2^{w_E-1}$ the datapath is meaningless.** Below, the answer is exactly $1.0$; above, it is $+0$ or $+\infty$. Both are decided by a coarse test on the exponent field alone, and the datapath is dimensioned only to survive the leftovers — everything between $88.73$ and $127$ in IEEEfloat(8,23), for instance, is caught later in `normalize-round-pack` ([[Exponential Special-Case Unit]]).
- **$Y=-\tfrac12$ exactly.** `sfix`$(-1,-w_F-g)$ holds $-\tfrac12$ but not $+\tfrac12$, so the sign-flip path for $X<0$ has one unrepresentable value at the far end of the relaxed interval. The half-open $[-\tfrac12,\tfrac12)$ is not cosmetic.
- **A $\ln 2$ rounded to the format instead of to the product** gives an error proportional to $|E|$. Small-argument tests all pass; accuracy degrades silently as $|X|$ grows.
- **Replacing `negate` by a bare row of XORs** (one's complement, skipping the $+1$) saves an adder but adds $1u$ to $\bar\delta_Y$, which the $e^Y$ amplification turns into a forced $g=4$. One guard bit across the entire datapath costs more than the carry chain it saved.
- **IEEEfloat rather than Nfloat.** A subnormal *result* forces `normalize-round-pack` to grow exponent-comparison logic and a $w_F$-bit shifter ahead of the rounding adder. Software delegates this to a floating-point multiplier computing $2^E\times M$; in hardware that is far too expensive for what it does.
- **Below about eight fraction bits the whole architecture loses.** For BFloat-class formats one $2^{12}\times15$-bit table is a single BRAM and is correctly rounded by construction ([[Direct Tabulation Exponential]]).
- **Faithful is not correctly rounded.** The guarantee is $|\delta_R|<1$ ulp; the last-bit guarantee would cost an unbounded amount of intermediate precision.

**RTL (Spade).**

```spade
// Nfloat(4,4): x = { s | E_X(4) | F(4) }, bias 7, g = 3 guard bits, u = 2^-7.
entity fpexp44(x: uint<9>) -> uint<9> {
    let b  = x.as_bits();
    let sx = b[8];
    let ex: uint<4> = b[4..8].as_uint();
    let fx: uint<4> = b[0..4].as_uint();

    // --- shift to fixed point: |X_fix| = 1.F << (E_X - 4), ufix(2,-7) on 10 bits
    let sig:  uint<5>  = 0b10000 | zext(fx);
    let wide: uint<15> = zext(sig) << zext::<4, 15>(ex);
    let xfix: uint<10> = trunc(wide >> 4);

    // --- tentative exponent |E| = round(X_fix / ln 2), X_fix truncated to LSB -4
    let xtr:  uint<7>  = trunc(xfix >> 3);
    let xt:   uint<9>  = zext(xtr);
    let prod: uint<18> = xt * 369u9;                 // 369/256 ~ 1/ln 2
    let eabs: uint<4>  = trunc((prod + 2048) >> 12); // round to integer

    // --- Y = +-( |X_fix| - |E| ln 2 ): only the low 7 bits survive, sfix(-1,-7)
    let xi:   int<13> = zext::<10, 13>(xfix).as_int();
    let li:   int<13> = zext::<11, 13>(inst kcm_ln2(eabs)).as_int();
    let ymag: int<7>  = trunc(xi - li);
    let y = if sx { -ymag } else { ymag };

    // --- M = e^Y, ufix(0,-7), in [0.65, 1.65]
    let m: uint<8> = inst exp_y_table(y);

    // --- normalize (22.8): one-bit shift, exponent -1 when M < 1
    let ge1 = m.msb();
    let frac: uint<7> = if ge1 { trunc(m) } else { trunc(m << 1u8) };
    let esig: int<7>  = if sx { -zext::<4, 7>(eabs).as_int() }
                        else  {  zext::<4, 7>(eabs).as_int() };
    let er:   uint<5> = trunc((esig + if ge1 { 7 } else { 6 }).as_uint());

    // --- round + pack: ONE adder over the concatenated exponent:significand
    let packed: uint<13> = trunc(zext::<12, 13>(er.concat(frac)) + 4);
    let pb = packed.as_bits();
    let zero: uint<1> = 0;
    zero.concat(pb[7..11].as_uint().concat(pb[3..7].as_uint()))
}
```

`xfix`, `eabs`, `y` and `m` are the $|X_{\mathrm{fix}}|$, $|E|$, $Y$ and $M$ buses of the diagram; `kcm_ln2` is a 16-entry ROM of $\lfloor|E|\ln2\cdot2^{7}\rceil$ ([[KCM, Table-Based Constant Multiplication]]) and `exp_y_table` a 128-entry correctly-rounded ROM ([[Tabulated e^Y]]), both elided here. Two width tricks carry the architecture: `trunc(xi - li)` to `int<7>` **is** the "the constant multiplier need not compute its own high bits" argument made concrete, and the single `+ 4` on `er.concat(frac)` is the $w_E+w_F+1$-bit rounding adder whose carry walks from the significand into the exponent field unaided. The entity is combinational and a real operator pipelines it; the drawing's separate `negate` box appears here only as `if sx` on `ymag`, since synthesis builds the same two's-complement negation from either form.

Simulated exhaustively over all 512 encodings, of which 269 fall in the datapath range ($2^{-6}\le|X|<8$ with a representable normal result), each checked against `$exp` for faithfulness: zero failures, worst case $0.65$ ulp. $e^{3.5}$ returns `0_1100_0001` $=34$ bit for bit, matching the worked example above.

**Related Notes**

- [[Range Reduction]] – depends-on: the general argument-folding pattern this is the cheapest instance of.
- [[Exponential Fixed-Point Converter]] – supports: the single left shifter producing $|X_{\mathrm{fix}}|$ and the $\textsf{uo}$ flag.
- [[Tentative Exponent Unit]] – supports: spends the $0.22$ budget on $X_{\mathrm{fix}}/\ln 2$.
- [[Reduced Argument Subtractor]] – supports: the $\ln 2$ KCM and the cancelling subtraction that forms $Y$.
- [[Exponential Normalize-Round-Pack]] – supports: implements (22.8) and the single concatenated rounding adder.
- [[Exponential Special-Case Unit]] – supports: decides $+0$, $+\infty$ and the exact-$1.0$ region before the datapath runs.
- [[Choosing an Exponential Architecture]] – compares: which $e^Y$ evaluator to drop into the $M$ slot at each precision.
- [[Direct Tabulation Exponential]] – counter-example: below ~8 fraction bits one correctly-rounded table beats this whole operator.
- [[Fixed-Point-In Exponential]] – extends: enter at $X_{\mathrm{fix}}$ and the unpack, shift and negate blocks all vanish.
- [[Barrel Shifters]] – supports: the fixed-point conversion is one of these.
- [[Floating-Point Formats]] – depends-on: why $2^E$ concatenates instead of multiplying.
- [[Floating-Point Operators]] – compares: where this sits among the packed-format operators.
- [[Error Accuracy]] – depends-on: ulp, faithfulness, and the absolute-versus-relative bookkeeping used throughout.
- [[FloPoCo]] – supports: `FPExp` and `FixRealKCM` are the reference implementations of these blocks.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 22 "Floating-Point Exponential":

- §22.1 Mathematical background — pp. 641–642 (identities 22.1–22.3)
- §22.3.1 Overview — pp. 646–647 (22.4–22.8, Fig. 22.4 p. 648)
- §22.3.2 Accuracy considerations — p. 647
- §22.3.3 Fixed-point conversion — pp. 648–649 (22.9)
- §22.3.4 Computation of the tentative exponent — pp. 649–650
- §22.3.5 Computation of $Y$ — p. 650 (22.10)
- §22.3.6 Computation of $e^Y$ — p. 651
- §22.3.7 Normalization and rounding — p. 651
- §22.3.8 Overall error analysis — pp. 651–653 (22.11–22.18)
