---
title: "Floating-Point Multiplier by a Power of Two"
description: "Multiplying by 2^E_C collapses to one exponent add and exception logic — the significand path disappears entirely, at zero error."
kind: circuit
source: "ASA §15.1.1, pp. 454-455"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, floating-point, constant-multiplication, exponent, hls]
aliases:
  - Floating-Point Multiplication by a Power of Two
  - FP Multiplier by a Power of Two
  - Multiplication by a Power of Two
  - Power-of-Two Scaling
  - Exponent-Only Multiplier
---

# Floating-Point Multiplier by a Power of Two

The degenerate case of floating-point constant multiplication, $C=(-1)^{s_C}2^{E_C}$ with $F_C=0$: the only arithmetic left in the operator is a $(w_E{+}1)$-bit add on the exponent field, and it is the only multiplier in the chapter whose error is exactly zero.

```tikz title="Floating-point multiplier by a power of two: the significand is routed straight through, and the single spare bit of the exponent sum is what detects both overflow and underflow"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,x=1cm,y=1cm,
  blk/.style={draw,rounded corners=1pt,fill=blue!6,minimum height=0.64cm}]

% ---- input
\draw[->] (0,5.5) node[anchor=south] {$X$} -- (0,4.72);
\node[anchor=west] at (0.12,5.12) {$3{+}w_E{+}w_F$};

\node[blk,minimum width=8.4cm] (up) at (0,4.4) {unpack \& exception handling};
\node[blk,minimum width=8.4cm] (pk) at (0,0.6) {exception handling \& pack};

% ---- sign rail: one XOR against a constant
\node[blk,minimum width=1.15cm] (xr) at (-5.5,2.5) {$\oplus\,s_C$};
\draw[->] (-4.2,4.4) -- (-5.5,4.4) -- (-5.5,2.82);
\node[anchor=west] at (-5.4,3.7) {$s_X$, 1};
\draw[->] (-5.5,2.18) -- (-5.5,0.6) -- (-4.2,0.6);
\node[anchor=west] at (-5.4,1.4) {$s_R$, 1};

% ---- exception rail
\draw[->] (4.2,4.4) -- (5.6,4.4) -- (5.6,0.6) -- (4.2,0.6);
\node[anchor=east] at (5.5,3.85) {$\mathrm{exn}_X$, 2};

% ---- exponent path: the only arithmetic in the operator
\node[blk,minimum width=1.9cm] (ea) at (-2.2,2.5) {$+\,E_C$};
\draw[->] (-2.2,4.08) -- (ea.north);
\node[anchor=west] at (-2.1,3.62) {$E_X{+}E_0$};
\node[anchor=west] at (-2.1,3.20) {$\mathrm{ufix}(w_E{-}1,0)$, $w_E$};
\draw[->] (ea.south) -- (-2.2,0.92);
\node[anchor=west] at (-2.1,1.82) {$E_R{+}E_0$};
\node[anchor=west] at (-2.1,1.40) {$\mathrm{sfix}(w_E,0)$, $w_E{+}1$};
\node[anchor=west,align=left,font=\scriptsize] at (-1.05,2.55)
  {sign bit of this sfix\\ $=$ overflow \emph{or} underflow};

% ---- significand path: a wire
\draw[->] (2.7,4.08) -- (2.7,0.92);
\node[anchor=west] at (2.8,3.00) {$F_R=F_X$, $w_F$};
\node[anchor=north west,align=left,font=\scriptsize] at (2.8,2.70)
  {pure routing:\\ no shifter,\\ no rounding,\\ $0$ ulp};

% ---- output
\draw[->] (0,0.28) -- (0,-0.55) node[anchor=north] {$R$};
\node[anchor=west] at (0.12,-0.18) {$3{+}w_E{+}w_F$};

\end{circuitikz}
\end{document}
```

*after Fig. 15.2, p. 455*

**Delete the significand path with one line of algebra.** Setting $F_C=0$ in $C=(-1)^{s_C}2^{E_C}(1+F_C)$ leaves $C=(-1)^{s_C}2^{E_C}$, and commutativity and associativity of real multiplication regroup the product of $X=(-1)^{s_X}2^{E_X}(1+F_X)$ with it as

$$X\cdot C\;=\;(-1)^{s_X\oplus s_C}\;2^{E_X+E_C}\;(1+F_X)$$

using $(-1)^a(-1)^b=(-1)^{a\oplus b}$ on the sign bits. The bracket is *untransformed*: $1+F_R = 1+F_X$, so the result's fraction field is the input's fraction field, $w_F$ bits of wire. Everything the generic multiplier of [[Floating-Point Multiplier]] builds around that bracket then dies with it — the $(w_F{+}1)\times(w_F{+}1)$ significand multiplier has nothing to multiply, and because $1\le 1+F_X<2$ was already true of the input, the product is normalized by construction, so the $1$-bit normalizer and the post-normalization rounding adder have nothing to do either. No bit is discarded anywhere, which is why this operator's error is $0$ ulp rather than the $0.5$ ulp of a correctly rounded one ([[Error Accuracy]]): it is not "well rounded", it is exact.

**The bias cancels, so the exponent adder shrinks rather than merely surviving.** A generic multiplier adds two *biased* fields, $(E_X+E_0)+(E_Y+E_0)=(E_R+E_0)+E_0$, and must subtract one bias back out. Here $E_C$ is known at synthesis time and is known *unbiased*, so

$$(E_R+E_0)\;=\;(E_X+E_0)+E_C$$

lands in biased form directly (p. 454): the bias subtractor is deleted, not shrunk. What remains is an add-by-constant, which the synthesizer simplifies column by column — every column where $E_C$'s bit is $0$ degenerates to a half-adder — so even this last block is cheaper than a two-operand adder of the same width. The sign path is one XOR against a constant, hence a wire when $s_C=0$ and an inverter when $s_C=1$.

**Widths, and why the exponent needs exactly one extra bit.** In the Nfloat$\langle w_E,w_F\rangle$ format of [[Floating-Point Formats]] (Fig. 2.15, p. 54) a number is `exn`$\,$(2)$\,\|\,s\,$(1)$\,\|\,E\,$($w_E$)$\,\|\,F\,$($w_F$), total $w_E+w_F+3$ bits, with the same bias $E_0=2^{w_E-1}-1$ as IEEE-754. The input exponent field is $\mathrm{ufix}(w_E-1,0)$ — $w_E$ bits, weights $2^{w_E-1}$ down to $2^0$. The tentative result is carried on $w_E+1$ bits and *read as* $\mathrm{sfix}(w_E,0)$, i.e. with weight $-2^{w_E}$ on the new top bit. The point of that reading is the next paragraph.

> [!important] One sign bit tests both directions, and that is not a coincidence
> Because Nfloat encodes zero, infinity and NaN in the separate `exn` field instead of reserving extremal exponent codes, the biased exponent of a normal number spans the **whole** unsigned range $[0,2^{w_E}-1]$ (Table 2.4, p. 55: $e_{\min}=-2^{w_E-1}+1$, $e_{\max}=2^{w_E-1}$). "Representable" is therefore literally "fits in $w_E$ unsigned bits". Now let $S=(E_X+E_0)+E_C$ be the exact integer sum. With $E_X+E_0\in[0,2^{w_E}-1]$ and $E_C\in[e_{\min},e_{\max}]$ — $E_C$ must lie in the format's own exponent range, or $C$ itself is not a number of the format — we get $S\in[-2^{w_E-1}+1,\;2^{w_E}+2^{w_E-1}-1]$, which fits in $w_E+1$ bits with no wraparound modulo $2^{w_E+1}$. Under the $\mathrm{sfix}(w_E,0)$ reading, the values $S\ge 2^{w_E}$ (overflow, only possible when $E_C>0$) have bit $w_E$ set by definition, and the values $S<0$ (underflow, only possible when $E_C<0$) are stored as $2^{w_E+1}+S\ge 2^{w_E+1}-2^{w_E-1}+1>2^{w_E}$, so they have bit $w_E$ set too. The in-range values $S\in[0,2^{w_E}-1]$ have it clear. The test is an exact iff, and the two out-of-range tails cannot reach far enough to collide with each other or fold back into the valid window, precisely because each overshoots by less than $2^{w_E-1}$. So `exception handling & pack` implements Table 11.2, p. 343 with **one wire and no comparator** — and it distinguishes overflow from underflow for free, because the sign of $E_C$ is a compile-time constant.

**Exception handling is Table 11.2 with six of its seven columns deleted.** The generic multiplier's special-case table is $7\times7$ because either operand may be NaN, $\pm0$ or $\pm\infty$. A power-of-two constant is finite and non-zero, so only one column survives and the table degenerates to a map on $\mathrm{exn}_X$ alone: NaN stays NaN, $\pm\infty$ stays $\pm\infty$, $\pm0$ stays $\pm0$, and a normal input stays normal unless the sign bit above fires, in which case it becomes $\pm\infty$ (when $E_C>0$) or $\pm0$ (when $E_C<0$). The sign is $s_X\oplus s_C$ in all five cases, so the sign path never branches. The saving here is not the gate count — it is that the whole $0\times\infty\to$ NaN interlock, which is the only genuinely awkward row of the generic table, is unreachable.

**IEEE-754 encoding is what would break this, not the arithmetic.** In an IEEEfloat the codes $0$ and $2^{w_E}-1$ are reserved for subnormals/zero and for infinities/NaN, so the biased range for normals is only $[1,2^{w_E}-2]$. The single sign bit then no longer coincides with the range test: it still catches $S<0$ and $S\ge2^{w_E}$, but misses $S=0$ and $S=2^{w_E}-1$, so you must compare against two constants instead of inspecting one wire. This is the datapath cost of a memory-oriented encoding, and it is exactly the reason the book argues that a hardware pipeline should transmit exception bits directly rather than re-encode them at every stage (Sect. 2.5.4, pp. 55-56).

**Build it because compilers will not.** `x * 2.0` and `x * 0.5` are ordinary code — twiddle factors in a radix-2 FFT, the $\tfrac12$ of a trapezoid rule, the halving step of a bisection — and an HLS tool that does not pattern-match the constant instantiates a full generic multiplier, normalizer and rounding adder to perform a rewiring (p. 454). This is the cheapest specialization in the chapter and the one most likely to be left on the table.

**On FPGA the operator effectively disappears; on ASIC it is a short prefix.** The $(w_E{+}1)$-bit constant add maps onto a single hard carry chain ([[FPGAs]]) — the shortest arithmetic structure the fabric has — while the significand path costs zero LUTs because it is routing the packer would perform anyway, and the exception map is one small LUT. The win over a generic multiplier is therefore counted mostly in **DSP blocks freed**, not in LUTs saved. On ASIC there is no dedicated chain, so the same add is a ripple or prefix network of $w_E+1$ bits, constant-folded per column; that is still one to two orders of magnitude below a $(w_F{+}1)^2$ multiplier array for any realistic $w_F$, but it is not free the way the carry chain is.

$$\boxed{\ s_R=s_X\oplus s_C,\qquad F_R=F_X,\qquad (E_R+E_0)=(E_X+E_0)+E_C \ \text{on}\ w_E{+}1\ \text{bits},\ \mathrm{sfix}(w_E,0)\ }$$

**When it breaks.**

- **Subnormals.** The book flags it in one line: "this simple architecture does not manage subnormal properly" (p. 455). Within Nfloat there are none to manage, so the caveat only bites at an IEEE boundary or in an IEEEfloat implementation, where a saturated normalizer of shift range $|E_C|$ has to be bolted on — see [[Constant Multiplier with Subnormal Support]].
- **$E_C=0$.** Then $C=\pm1$ and there is no multiplication left at all; the compiler has already removed it (p. 454) and what remains is a sign flip.
- **$E_C$ outside the format's exponent range.** The single-bit argument above depends on each out-of-range tail overshooting by less than $2^{w_E-1}$. A constant whose exponent exceeds the format's own range breaks that, and the range check becomes a genuine two-sided comparison.
- **Different $w_E$ or $w_F$ between input and output.** Most of the tricks in this chapter assume the output format equals the input format (p. 453). Change $w_F$ and the fraction stops being a wire; change $w_E$ and the bias no longer cancels.
- **Underflow is a flush, not a gradual result.** The architecture maps an underflowing product to $\pm0$. A format with subnormals would want a shifted-out significand instead, which is a different operator.
- **A runtime $E_C$ is not this circuit.** If the scale factor varies, the constant-folding of the adder is lost and the operator becomes a generic `ldexp` exponent path — still cheap, but no longer a specialization, and the overflow/underflow discrimination now needs the sign of $E_C$ as a signal.

**RTL (Spade).**

```spade
// (E_R + E_0) = (E_X + E_0) + E_C, carried on w_E+1 bits read as sfix(w_E, 0).
fn scale_exp<#uint WE>(ef: uint<WE>, ec: int<{WE + 1}>) -> int<{WE + 1}> {
    let ex: uint<{WE + 1}> = zext(ef);
    ex.as_int() +. ec
}

// The one spare bit: its sign flags overflow (E_C>0) and underflow (E_C<0) alike.
fn exp_out_of_range<#uint WE>(er: int<{WE + 1}>) -> bool {
    er.sign_bit()
}

// Table 11.2 collapsed to one column, C = (-1)^{s_C} 2^{E_C} finite and non-zero.
// exn: 00 zero, 01 normal, 10 infinity, 11 NaN  (Nfloat, Table 2.3, p. 54).
fn exn_pow2(exn_x: uint<2>, oor: bool, ec_neg: bool) -> uint<2> {
    match exn_x {
        1 => if oor { if ec_neg { 0 } else { 2 } } else { 1 },
        _ => exn_x,
    }
}

// Concrete Nfloat<11,52> payload s|E|F -- the fields line up with binary64.
entity fpmul_pow2_n1152(x: uint<64>, sc: bool, ec: int<12>) -> uint<64> {
    let b = x.as_bits();
    let fr: uint<52> = b[0..52].as_uint();
    let ef: uint<11> = b[52..63].as_uint();
    let sx: bool = b[63];
    let erf: uint<11> = trunc(scale_exp::<11>(ef, ec).as_uint());
    (sx ^^ sc).as_uint().concat(erf).concat(fr)
}
```

`scale_exp` is the `+E_C` box: `zext` widens the $w_E$-bit field to $w_E+1$, `as_int` is the reinterpretation that turns $\mathrm{ufix}(w_E-1,0)$ into $\mathrm{sfix}(w_E,0)$ at zero hardware cost, and `+.` is the *wrapping* add — the non-widening `+` would return $w_E+2$ bits, which is precisely the bit the argument above proves unnecessary. `exp_out_of_range` is the wire in the diagram, `sign_bit()` selecting bit $w_E$. In `fpmul_pow2_n1152` the slice `b[0..52]` is $F_R=F_X$, the vertical wire on the right of the drawing, and `concat` reassembles the packed word with `sx ^^ sc` highest; every item is a `fn` or a combinational `entity`, so the whole operator is one carry chain deep with no register anywhere. The one thing synthesis does differently from the drawing: `ec` is a port here so the block elaborates as a real adder, whereas in the specialized instance $E_C$ is a literal and the tool constant-folds it column by column.

Verified by simulation against the simulator's own `double` multiply — $6015$ vectors, zero mismatches: $9$ named exception vectors covering both overflow boundaries ($E$ field $2045$ with $E_C=2$ then $3$) and both underflow boundaries ($E$ field $5$ with $E_C=-5$ then $-6$) plus the three pass-through `exn` codes, $6$ named asymmetric value vectors (`0x3FF123456789ABCD` $\times\,(-2^{7})$ among them, chosen so a swapped or bit-reversed fraction field cannot survive), and two $3000$-vector random sweeps — one on the packed datapath against `$realtobits`, one on the exception logic against an integer reference over the full port range. Mutating `+.` to `-.` in `scale_exp` produces $4507$ failures, so the testbench is not vacuous.

**Related Notes.**

- [[Floating-Point Multiplier]] – compares: the generic operator this is a deletion of; everything between unpack and pack except one adder is what specialization removes.
- [[Floating-Point Formats]] – depends-on: Nfloat's separate `exn` field is what frees the whole exponent range, and that is what reduces the range check to a single sign bit.
- [[Faithful Floating-Point Constant Multiplier]] – extends: the next case up, $F_C\ne0$, where the significand path and a normalization decision both come back.
- [[Constant Multiplier with Subnormal Support]] – extends: supplies the saturated normalizer this architecture omits.
- [[Barrel Shifters]] – counter-example: in fixed point the same $\times2^{E_C}$ costs a shifter, because there is no exponent field to absorb it; here the shift *is* the exponent.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where the zero-cost, zero-error corner of the design space sits against the faithful and correctly rounded variants.
- [[Error Accuracy]] – depends-on: grounds the claim that this operator's error is $0$ ulp rather than $0.5$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 15 "Specialization and Fusion of Floating-Point Operators":

- §15.1 Floating-point constant multiplication, pp. 453-454 — Fig. 15.1 (black-box interface), Eq. (15.1) $C=(-1)^{s_C}2^{E_C}(1+F_C)$; the biased exponent obtained "with no need to subtract the bias $E_0$"; the observation that $C<1$ excludes overflow and $C>1$ excludes flush-to-zero; the warning that the tricks assume identical $w_E,w_F$ on input and output (p. 453).
- §15.1.1 Floating-point multiplication by a power of two, pp. 454-455 — Fig. 15.2 (redrawn above); the $w_E+1$-bit tentative exponent as an sfix, "both cases are detected when $E_R+E_0$ becomes negative"; the HLS motivation ("multiplications by 2.0 or 0.5 are quite common in actual code"); the $E_C=0$ remark; and the note on p. 455 that the architecture does not manage subnormals.
- §15.1.6 Subnormal handling, pp. 462-464 — the saturated normalizer of shift range $E_C$ that this architecture omits.
- Ch. 11 "Floating-Point Operators": Table 11.2, p. 343 — special cases of floating-point multiplication for round to nearest, the $7\times7$ table this operator degenerates; Fig. 11.7, p. 344 — the generic multiplier.
- Ch. 2 "Number Formats", §2.5.3 A simplified floating-point format, p. 54 — Fig. 2.15 (Nfloat field layout `exn|s|E|F`), Eq. (2.19), Table 2.3 (exn encoding 00/01/10/11); Table 2.4, p. 55 — $e_{\min}=-2^{w_E-1}+1$, $e_{\max}=2^{w_E-1}$, i.e. the full unsigned exponent range that makes the single-sign-bit test exact; §2.5.4, pp. 55-56 — why a hardware pipeline transmits exception bits rather than re-encoding them.
