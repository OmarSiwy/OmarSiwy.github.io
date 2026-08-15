---
title: Reduced Argument Subtractor
description: "Y = X_fix - E ln 2 by a KCM that need not compute its own MSBs, because the subtraction is a cancellation by design — few input bits, many output bits, and ln 2 stored to the precision of the product rather than of the format."
kind: circuit
source: "ASA §22.3.5, p. 650 (Fig. 22.4, p. 648)"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, range-reduction, constant-multiplier, subtractor]
aliases:
  - Computation of Y
  - Reduced Argument Computation
  - Y Subtractor
---

# Reduced Argument Subtractor

The block that forms $Y = X_{\mathrm{fix}} - E\ln 2$, and the only subtractor in the operator whose leading $w_E$ bits are guaranteed to cancel — so it does not build them, and neither does the constant multiplier feeding it.

```tikz title="The Y datapath: two constant multipliers, a concurrent negate, and one wrapping adder"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------------- input bus ----------------
  \node[anchor=south,font=\footnotesize] at (0,7.35)
    {$|X_{\mathrm{fix}}|$\quad\texttt{ufix}$(w_E-2,\,-w_F-g)$};
  \draw[very thick] (-3.0,7.2) -- (3.0,7.2);
  \draw[-latex] (-3.0,7.2) -- (-3.0,6.35);
  \draw[-latex] (3.0,7.2) -- (3.0,4.55);
  \node[anchor=east,font=\tiny] at (-3.05,6.90) {truncate to $\ell_X=-4$};
  \node[anchor=east,font=\tiny] at (-3.05,6.62) {\texttt{ufix}$(w_E-2,-4)$};
  \node[anchor=west,font=\tiny] at (3.05,6.05) {\texttt{ufix}$(-1,-w_F-g)$};
  \node[anchor=west,font=\tiny] at (3.05,5.77) {low bits only};

  % ---------------- KCM by 1/ln2 ----------------
  \draw (-4.5,5.55) rectangle (-1.5,6.35);
  \node[font=\footnotesize] at (-3.0,5.95) {$\times\,1/\ln 2$\ \ (KCM)};
  \draw[-latex] (-3.0,5.55) -- (-3.0,4.55);
  \node[anchor=east,font=\tiny] at (-3.05,5.28) {$|E|$\ \ \texttt{ufix}$(w_E,0)$};
  \node[anchor=east,font=\tiny] at (-3.05,5.00) {$w_E+1$ bits};

  % ------- KCM by -ln2 and negate: same rank, hence concurrent -------
  \draw (-4.5,3.75) rectangle (-1.5,4.55);
  \node[font=\footnotesize] at (-3.0,4.15) {$\times\,(-\ln 2)$\ \ (KCM)};
  \draw[dashed,black!55] (-1.42,3.78) rectangle (1.78,4.52);
  \node[font=\tiny,align=center,black!55] at (0.18,4.15)
    {MSBs not built:\\ only $2^{-1}\ldots 2^{-w_F-g}$};
  \draw (1.9,3.75) rectangle (4.1,4.55);
  \node[font=\footnotesize] at (3.0,4.15) {negate};

  \draw (-3.0,3.75) -- (-3.0,3.35);
  \draw[-latex] (-3.0,3.35) -| (-0.8,3.0);
  \draw (3.0,3.75) -- (3.0,3.35);
  \draw[-latex] (3.0,3.35) -| (0.8,3.0);
  \node[anchor=east,font=\tiny] at (-3.05,3.55) {\texttt{sfix}$(-1,-w_F-g)$};
  \node[anchor=west,font=\tiny] at (3.05,3.55) {\texttt{sfix}$(-1,-w_F-g)$};

  % ---------------- the adder ----------------
  \draw (-2.4,2.2) rectangle (2.4,3.0);
  \node[font=\footnotesize] at (0,2.6) {$+\,/-$\ \ ($w_F+g$-bit RCA)};

  % ---------------- sign control ----------------
  \node[anchor=south,font=\footnotesize] at (5.4,7.25) {$s_X$};
  \draw (5.4,7.2) -- (5.4,2.6);
  \draw[-latex] (5.4,4.15) -- (4.1,4.15);
  \draw[-latex] (5.4,2.6) -- (2.4,2.6);

  % ---------------- output ----------------
  \draw[-latex] (0,2.2) -- (0,1.5);
  \node[anchor=north,font=\footnotesize] at (0,1.45)
    {$Y\in[-\tfrac12,\tfrac12)$\ \ \texttt{sfix}$(-1,-w_F-g)$, \ $w_F+g$ bits};
\end{circuitikz}
\end{document}
```

*After Fig. 22.4, p. 648 — the lower half only, with the format annotations of that figure kept verbatim. The dashed region is the part of the $\times(-\ln 2)$ multiplier that the book's format annotation silently deletes: its output is declared* `sfix`$(-1,-w_F-g)$*, so every column of weight $2^0$ and above is absent from the design, not computed and discarded.*

**Start from the specification, not from the expression.** The block implements

$$Y = X_{\mathrm{fix}} - E\times\ln 2 \qquad (22.10)$$

but the expression on the right is not what gets built. The [[Tentative Exponent Unit]] upstream chose $E$ precisely so that $Y \in [-\tfrac12,\tfrac12)$; that is a *promise about the result*, made before the subtraction runs. So the only unknown left is which element of $[-\tfrac12,\tfrac12)$ we land on — the integer part and the first fractional bit of $E\ln 2$ are already known to annihilate against those of $X_{\mathrm{fix}}$. Building hardware to confirm a cancellation you have already proven is the definition of dead logic.

**Read the whole datapath as arithmetic modulo one.** Formally, $Y$ is determined by the residue class of $X_{\mathrm{fix}} - E\ln 2$ in $\mathbb{R}/\mathbb{Z}$ together with the promise $Y\in[-\tfrac12,\tfrac12)$, because that interval is a complete set of representatives — each class has exactly one member in a half-open interval of length $1$. And the fixed-point format `sfix`$(-1,-w_F-g)$ *is* that set of representatives, sampled: it holds $W = (-1)-(-w_F-g)+1 = w_F+g$ bits, so its total two's-complement range is $2^{W}\cdot 2^{-w_F-g} = 1$. The wrap-around of a $W$-bit two's-complement adder is therefore reduction modulo exactly $1$, and $\mathbb{Z}/2^{W}\mathbb{Z} \to (2^{-w_F-g}\mathbb{Z})/\mathbb{Z}$ is a ring isomorphism. **The overflow that a normal adder must avoid is here the arithmetic we want**: no carry-out is discarded by accident, it is discarded by proof.

**That isomorphism is what licenses the constant multiplier to skip its own MSBs.** The $\times(-\ln 2)$ block takes $|E|$ on `ufix`$(w_E,0)$ — $w_E+1$ bits — and emits `sfix`$(-1,-w_F-g)$, i.e. $(-E\ln 2) \bmod 1$. Only a *constant* multiplier can do this. A KCM ([[KCM, Table-Based Constant Multiplication]]) splits its input into $\alpha$-bit subwords and reads $C\cdot e_j\cdot 2^{\alpha j}$ from a table per subword; because $C=-\ln 2$ is fixed, every table entry can be reduced modulo $1$ *at design time*, and the bit-heap columns above weight $2^{-1}$ are then never instantiated. A data-dependent multiplier cannot do this: which high bits cancel depends on the operand, so it must compute them and then throw them away.

**The shape of the problem is the reason it is a table and not a shift-and-add.** This multiplier has few input bits ($w_E+1$) and many output bits ($w_F+g$) — for IEEEfloat(8,23) with $g=3$, nine bits in and twenty-six out. Shift-and-add ([[Multiplication by Constants]]) builds a sum of shifted copies of the *input*, so its cost grows with the number of nonzero digits of the recoded constant, which for an irrational $\ln 2$ at twenty-six-bit precision is a large adder tree over nine-bit operands. A KCM instead builds $\lceil (w_E+1)/\alpha\rceil$ tables of $2^{\alpha}$ entries by $w_F+g$ bits and one multi-operand addition; the cost grows with the *input* width, which is the small one. On an FPGA $\alpha$ is chosen to be the LUT input count so each table row is one LUT deep ([[FPGAs]]); on an ASIC the same tables become synthesised constant logic and the trade-off point moves toward shift-and-add.

> [!important] Store $\ln 2$ to the precision of the product, not to the precision of the format
> This is where naive implementations die. $Y$ is *small* — as small as $2^{-w_F-g}$ — while $X_{\mathrm{fix}}$ and $E\ln 2$ are each as large as $2^{w_E-1}$. Up to $w_E$ leading bits annihilate, so **every bit of $E\ln 2$ that was rounded away reappears at full weight in $Y$.** The constant must be held faithful at LSB $-w_F-g$ across the whole $w_E+1$-bit range of $E$. A $\ln 2$ rounded to $w_F$ bits injects an error of $2^{-w_F}\cdot|E|$ — proportional to $|E|$, hence growing with $|X|$ — and the operator silently loses accuracy for large arguments while passing every small-argument test. The general statement is in [[Error Accuracy]]: a subtraction of nearly equal quantities has its intermediate precision set by the **output** magnitude, never the input magnitude.

**The guard bits are the other half of that bargain.** $X_{\mathrm{fix}}$ arrives from the [[Exponential Fixed-Point Converter]] on `ufix`$(w_E-2,-w_F-g)$ with $g\ge 2$ guard bits below the format's LSB. Done at working precision $-w_F$, the surviving $Y$ would be accurate to $2^{-w_F}$ *absolute*, which — since an absolute error $\delta_Y$ on the reduced argument becomes a *relative* error $\approx\delta_Y$ on $e^X$, from $e^{Y+\delta}=e^Ye^{\delta}\approx e^Y(1+\delta)$ — is a full ulp of the result before the inner evaluator has done anything at all. With the guards, and with a faithful constant multiplier, [[Error Analysis]] closes at $\bar\delta_Y = 1u$, $u = 2^{-w_F-g}$. Note which input is truncated: $\ell_X = -4$ applies only to the copy of $X_{\mathrm{fix}}$ entering the $\times 1/\ln 2$ multiplier, whose entire error budget is $0.22$ *units of $E$*. The subtractor itself sees the untruncated low bits.

**The sign handling buys latency with an adder.** $X_{\mathrm{fix}}$ arrives in sign/magnitude as $(s_X, |X_{\mathrm{fix}}|)$, so what is wanted is $Y = \pm(|X_{\mathrm{fix}}| - E\ln 2)$ with the sign of $X$. The obvious order — subtract, then conditionally negate — puts a second $W$-bit carry propagation in series after the first. Fig. 22.4 instead conditionally negates $|X_{\mathrm{fix}}|$ *first*, in the `negate` box, which runs concurrently with the two constant multipliers and is therefore hidden entirely under their latency; the final $+/-$ then folds the second sign flip into its own operand complement and carry-in, at no extra depth. The price is one extra $W$-bit incrementer in area — a two's-complement negation is $\bar{x}+1$ and only the trailing $+1$ of the *second* negation can be absorbed into the adder's carry-in. That trade is worth making, and cheapening it further is not: replacing `negate` by a bare row of XORs (one's complement, dropping the $+1$) saves the incrementer but adds another $1u$ of error whenever $X<0$, which doubles $\bar\delta_Y$ and breaks the $g=3$ budget outright.

$$\boxed{\ Y \equiv \big(|X_{\mathrm{fix}}| \bmod 1\big) \pm \big((-E\ln 2)\bmod 1\big) \pmod 1,\qquad Y\in[-\tfrac12,\tfrac12)\ \text{on}\ w_F+g\ \text{bits}\ }$$

**When it breaks.**

- **The range promise is now a correctness constraint, not a quality target.** If the tentative exponent unit exceeds its $0.22$ budget and $Y$ escapes $[-\tfrac12,\tfrac12)$, the hardware does not return a slightly-too-large $Y$: it returns the *other* representative, wrong by exactly $1$. A full-width subtractor would have degraded gracefully — $e^Y$ merely leaves $[0.65,1.65]$ and the normaliser still copes. Deleting the MSBs converts a soft failure into a silent catastrophic one, and it is entirely a property of the *upstream* block.
- **$g$ is not a knob you can lower here alone.** The budget of [[Error Analysis]] closes at $g=3$ with nothing to spare, and $\bar\delta_Y$ enters the binding $e^Y<1$ branch doubled.
- **Small $|X|$ is trivial, not special.** For $|X|<2^{-w_F-2}$ the converter forces $X_{\mathrm{fix}}=0$, so $E=0$, $E\ln 2$ is exact, and $Y=0$ — the block is correct by degeneracy, which is why input subnormals need no separate path.
- **No range reduction, no subtractor.** In [[Fixed-Point-In Exponential]] the argument is already bounded and this block, both KCMs with it, disappears.

**RTL (Spade).**

```spade
/// Reduced-argument subtractor: Y = +/-(|X_fix| - E*ln 2), on the surviving bits only.
/// W = w_F + g bits of sfix(-1, -W), i.e. arithmetic modulo 1.
///   xlow: |X_fix| mod 1, ufix(-1,-W)          klow: (-E*ln 2) mod 1, sfix(-1,-W), from the KCM
entity red_arg_sub<#uint W>(xlow: uint<W>, klow: int<W>, sx: bool) -> int<W> {
    // `negate` box: concurrent with the two constant multipliers, not after them
    let xs = if sx { -(xlow.as_int()) } else { xlow.as_int() };
    // `+/-` box: one W-bit adder. The wrap IS the cancellation of the MSBs.
    if sx { xs -. klow } else { xs +. klow }
}
```

`xlow` is the right-hand wire of the diagram (the low slice of $|X_{\mathrm{fix}}|$, taken as a bit range, no logic), `klow` the left-hand one, `sx` the control entering both boxes. The scale factor $2^{-w_F-g}$ is not in the types — Spade has no fixed-point type, so the entity is the integer image of the datapath under the isomorphism above, and every constant in the testbench is a count of ulps. The truncating operators `+.` and `-.` are load-bearing: plain `+` would widen to $W+1$ bits and re-materialise exactly the MSB that the whole design exists to delete. Purely combinational, no `clock` port; synthesis will map the single `if` to operand complement plus carry-in on one carry chain rather than to the two visually distinct boxes of the drawing ([[RCA, Ripple-Carry Adder]]).

Simulated at $W=13$ (binary16, $w_F=10$, $g=3$): 5000 random vectors against the behavioural reference $\pm(x+k) \bmod 2^{13}$, plus six directed vectors computed from real range reductions — $X=3$ ($E=4$, $Y=+0.2274$), $X=5.5$ ($E=8$, where the integer parts $5$ and $5$ cancel without ever being built, $Y=-0.0452$), $X=2.5$, and $X=0.75$ ($E=1$), the last of which overflows the 13-bit adder and is correct *because* of the wrap. All agree with the exact real-valued $Y$ to under $0.3\,u$, the residue being the rounding of $\ln 2$ into the constant.

**Related Notes.**

- [[Range Reduction]] – depends-on: this block is the reconstruction half of the reduction; the interval promise it consumes is defined there.
- [[Tentative Exponent Unit]] – depends-on: produces $E$, and its $0.22$ error bound is what makes deleting the MSBs safe.
- [[KCM, Table-Based Constant Multiplication]] – depends-on: the $\times(-\ln 2)$ block, in the one configuration a KCM was made for — narrow input, wide output, known-dead high columns.
- [[Multiplication by Constants]] – compares: shift-and-add is the alternative, and loses here because its cost tracks the output width.
- [[Error Analysis]] – supports: derives $\bar\delta_Y=1u$ and the amplification of $\delta_Y$ by $e^Y$ downstream.
- [[Exponential Fixed-Point Converter]] – depends-on: supplies $|X_{\mathrm{fix}}|$ and $s_X$ with the $g$ guard bits this block relies on.
- [[RCA, Ripple-Carry Adder]] – depends-on: the $+/-$ box, $w_F+g$ bits wide, mapped to the FPGA carry chain.
- [[Fixed-Point-In Exponential]] – counter-example: no floating-point input, no range reduction, no subtractor at all.
- [[FPExp Operator]] – supports: the operator this block sits inside.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §22.3.5 "Computation of $Y$", p. 650.
- Fig. 22.4, "Architecture of FPExp for the Nfloat$(w_E,w_F)$ format", p. 648 — source of every format annotation above.
- §22.3.2 "Accuracy Considerations", p. 647, for $Y\in[-\tfrac12,\tfrac12)$ and why the bound is relaxed to a power of two.
- §22.3.3–22.3.4, pp. 648–650, for the `ufix`$(w_E-2,-w_F-g)$ input format, the guard bits $g$, and the $0.22$ budget on $E$.
- §22.3.8 "Overall Error Analysis", pp. 651–653, for $\bar\delta_Y=1u$ and the `negate`-versus-XOR-row trade.
