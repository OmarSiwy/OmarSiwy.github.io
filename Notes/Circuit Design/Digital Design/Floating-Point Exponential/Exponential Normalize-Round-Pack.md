---
title: "Exponential Normalize-Round-Pack"
description: "One multiplexer on the MSB of M, one half-ulp bit, and a single w_E+w_F+1-bit adder across the concatenated exponent-and-significand field — biased formats make rounding overflow increment the exponent for free; IEEEfloat adds a subnormal shifter."
kind: circuit
source: "ASA §22.3.7, p. 651 (box of Fig. 22.4, p. 648)"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, rounding, normalization, packing, fpga]
aliases:
  - normalize-round-pack
  - Normalize-Round-Pack
  - Exponential Rounding and Packing
---

# Exponential Normalize-Round-Pack

The output stage of a floating-point exponential: the only normaliser in hardware that is a single two-input multiplexer rather than a shifter, because $e^Y$ is bounded away from zero and can be at most one bit short of normalised.

```tikz title="Inside normalize-round-pack: one-bit normalisation mux, one half-ulp bit, one adder across the concatenated exponent and fraction fields"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex,font=\small]
  % ===================== inputs =====================
  \node[anchor=south] at (1.5,9.00) {$E$};
  \node[anchor=east,font=\tiny] at (1.40,8.62) {$w_E{+}1$ bits, biased};
  \draw[->] (1.5,8.95) -- (1.5,7.95);

  \node[anchor=south] at (6.0,9.00) {$M$};
  \node[anchor=west,font=\tiny] at (6.12,8.62) {\texttt{ufix}$(0,-w_F-g)$, $w_F{+}g{+}1$ bits};
  \draw[->] (6.0,8.95) -- (6.0,7.95);

  % ---- the msb(M) control line ----
  \fill (6.0,8.20) circle (2.2pt);
  \draw (6.0,8.20) -- (3.0,8.20);
  \node[anchor=south,font=\tiny] at (4.50,8.24) {$\mathrm{msb}(M)$ : is $e^Y\ge 1$?};
  \draw[->] (3.9,8.20) -- (3.9,7.65) -- (4.55,7.65);
  \fill (3.9,8.20) circle (2.2pt);
  \draw[->] (3.0,8.20) -- (3.0,7.65) -- (2.75,7.65);

  % ===================== normalise =====================
  \draw (0.4,7.35) rectangle (2.6,7.95);
  \node at (1.5,7.65) {$E-\overline{\mathrm{msb}}$};
  \draw (4.7,7.35) rectangle (7.3,7.95);
  \node at (6.0,7.65) {shift left by $0$ or $1$};

  \draw[->] (1.5,7.35) -- (1.5,6.65);
  \node[anchor=west,font=\tiny] at (1.62,7.02) {$E_R$};
  \draw[->] (6.0,7.35) -- (6.0,6.65);
  \node[anchor=east,font=\tiny] at (5.88,7.18) {$M_{\mathrm{norm}}\in[1,2)$};

  % ===================== bit fields after normalisation =====================
  \draw (0.4,6.05) rectangle (2.6,6.65);
  \node[font=\footnotesize] at (1.5,6.35) {$E_R$ : $w_E{+}1$};

  \draw (4.0,6.05) rectangle (4.6,6.65);  \node[font=\footnotesize] at (4.3,6.35) {$1$};
  \draw (4.6,6.05) rectangle (6.6,6.65);  \node[font=\footnotesize] at (5.6,6.35) {$F$ : $w_F$};
  \draw (6.6,6.05) rectangle (7.1,6.65);  \node[font=\footnotesize] at (6.85,6.35) {$r$};
  \draw[dashed] (7.1,6.05) rectangle (9.4,6.65);
  \node[font=\footnotesize] at (8.25,6.35) {$g-1$ discarded};
  \node[anchor=south,font=\tiny] at (4.30,6.68) {$2^{0}$};
  \node[anchor=south,font=\tiny] at (6.85,6.68) {$2^{-w_F-1}$};

  % ---- routing into the packed field ----
  \draw[->] (1.5,6.05) -- (1.5,5.30);
  \draw[->] (5.6,6.05) -- (5.6,5.65) -- (3.6,5.65) -- (3.6,5.30);
  \draw[->] (6.85,6.05) -- (6.85,4.80) -- (4.75,4.80) -- (4.75,4.05) -- (4.62,4.05);
  \node[anchor=west,font=\tiny] at (6.95,5.40) {half-ulp bit};

  % ===================== packed field =====================
  \draw (0.4,4.70) rectangle (2.6,5.30);
  \node[font=\footnotesize] at (1.5,5.00) {$E_R$ : $w_E{+}1$};
  \draw (2.6,4.70) rectangle (4.6,5.30);
  \node[font=\footnotesize] at (3.6,5.00) {$F$ : $w_F$};
  \node[anchor=east,font=\tiny] at (0.30,5.00) {packed};

  \draw[->] (2.5,4.70) -- (2.5,4.35);

  % ===================== the one adder =====================
  \draw (0.4,3.75) rectangle (4.6,4.35);
  \node at (2.5,4.05) {$+$\quad\footnotesize one $w_E{+}w_F{+}1$-bit adder};
  \draw[->] (2.5,3.75) -- (2.5,3.35);

  % ===================== result field =====================
  \draw (0.0,2.75) rectangle (0.6,3.35);  \node[font=\footnotesize] at (0.3,3.05) {$o$};
  \draw (0.6,2.75) rectangle (2.6,3.35);  \node[font=\footnotesize] at (1.6,3.05) {$E'_R$ : $w_E$};
  \draw (2.6,2.75) rectangle (4.6,3.35);  \node[font=\footnotesize] at (3.6,3.05) {$F_R$ : $w_F$};

  \draw[->] (0.3,2.75) -- (0.3,1.30) -- (1.05,1.30);
  \node[anchor=west,font=\tiny] at (1.10,1.30) {overflow out of $E'_R$ $\Rightarrow\ \pm\infty$};
  \draw[->] (3.1,2.75) -- (3.1,2.30);
  \node[anchor=north] at (3.1,2.25) {$R$ : \texttt{Nfloat}$(w_E,w_F)$};

  % ===================== IEEEfloat addendum =====================
  \draw[dashed,black!60] (5.30,3.05) rectangle (10.30,4.55);
  \node[anchor=north west,font=\footnotesize,text width=4.75cm] at (5.42,4.48)
    {\textbf{IEEEfloat only:} exponent compare $+$ a $w_F$-bit shifter, inserted \emph{before} the adder, so a subnormal result is rounded in the same pass.};
  \draw[dashed,black!60,->] (5.30,3.40) -- (4.70,3.40);
\end{circuitikz}
\end{document}
```

*after the `normalize-round-pack` box of Fig. 22.4, p. 648, expanded from the text of §22.3.7, p. 651.*

**One multiplexer suffices because the reduced argument bounds the significand from both sides.** The block receives $M$, a fixed-point approximation of $e^Y$ in `ufix`$(0,-w_F-g)$ — $w_F+g+1$ bits, MSB at weight $2^0$ — and the tentative exponent $E$ on $w_E+1$ bits from the [[Tentative Exponent Unit]]. Range reduction has already pinned $Y\in(-\tfrac12,\tfrac12)$, so $e^Y\in[0.65,1.65]$ (§22.3.6, p. 651): the value can be short of the normalised interval $[1,2)$ by at most a factor of two, and can never exceed it. Hence (22.8) is decided by one wire, the MSB of $M$ at weight $2^0$, and the shift it selects is $0$ or $1$ positions — a row of $w_F+g+1$ two-input multiplexers. There is no leading-zero count and no barrel shifter, which is what a general floating-point [[Normalizers|normaliser]] must build; the saving comes from $e^x>0$ everywhere, so the inner evaluation has no cancellation and no unbounded run of leading zeros.

**The exponent correction is a decrement conditioned on the same wire, and it is the cheaper half of the mux.** By (22.8), $R=2^E\cdot e^Y$ when $M\ge1$ and $R=2^{E-1}\cdot(2e^Y)$ otherwise, so the exponent the result will actually carry is

$$E_R = E - \overline{\mathrm{msb}(M)}$$

on $w_E+1$ bits. Note the direction: $E$ from upstream equals either $E_R$ or $E_R+1$ (p. 649), never the other way, because $2e^Y$ can only *raise* the significand into range. Since the format is biased ([[Floating-Point Formats]]), $E$ arrives already offset by $E_0$ and this decrement is one subtractor on the biased field, not a signed-arithmetic step.

**Rounding is one constant bit, by the identity $\lfloor x\rceil=\lfloor x+\tfrac12\rfloor$.** Let $M_{\mathrm{norm}}$ be the normalised significand; its bits at weights $2^{-1}\ldots2^{-w_F}$ form the fraction field $F$ ($w_F$ bits), the bit at $2^{-w_F-1}$ is the round bit $r$, and the remaining $g-1$ bits are discarded. Adding $r$ at position $-w_F$ and truncating is round-to-nearest on the $w_F$-bit fraction, exactly the round bit of [[Rounding]], and it costs $\bar\delta_{\text{final round}}=2^{-w_F-1}$. That single term is *half the whole faithfulness budget* $2^{-w_F}$; the error analysis of §22.3.8 spends the other half on everything upstream, which with $g=3$ leaves $4u$ where $u=2^{-w_F-g}$ ([[Error Accuracy]]). The $g-1$ bits below $r$ are dropped without a sticky bit — this is round-half-up, not round-to-nearest-even, and the operator promises only faithfulness, so the tie direction is free.

> [!important] The rounding adder increments the exponent for free because a biased float is an order-isomorphism onto the integers
> In a biased format the exponent field is an unsigned integer that increases with the value and the fraction field is unsigned. Concatenate them and read the result as one unsigned integer: consecutive representable positive floats map to *consecutive integers*, so "advance by one ulp" is literally integer $+1$. That is why a **single adder of size $w_E+w_F+1$** can add the rounding bit to the concatenated exponent-and-significand field. When $F$ is all ones and $r=1$ — the $1.111\ldots\to10.000\ldots$ case — the fraction wraps to zero and the carry propagates into the exponent field, incrementing it. The mandatory right-shift-by-one of a re-normalisation never has to be built, because a significand of $10.000\ldots$ shifted right *is* $1.000\ldots$, and $1.000\ldots$ is what an all-zero fraction field already means. No separate exponent-increment path, no second normalisation pass ([[Floating-Point Operators]]).

**The $+1$ in the adder width is an overflow detector, not slack.** $E$ needs $w_E+1$ bits rather than $w_E$ because it may equal $E_R+1$ with $E_R$ already at $e_{\max}$ (p. 649). Concatenating that $w_E+1$-bit field with the $w_F$-bit fraction gives exactly $w_E+w_F+1$ bits — the book's adder width falls out of the headroom bit, it is not a separate choice. After the addition the top bit is set precisely when the exponent has walked past the format's range, either because the input was large or because the rounding carry pushed it there. §22.3.4 makes this explicit: input filtering upstream cannot catch every overflowing argument (the `uo` flag misses inputs between $X_{\max}$ and the next power of two — for IEEEfloat$(8,23)$, between $88.73$ and $127$), so *the whole datapath is dimensioned so that these cases are detected in this box*, which then hands $\pm\infty$ to the [[Exponential Special-Case Unit]].

**Nfloat is finished here; IEEEfloat is not, and the extra hardware must go before the adder.** Nfloat has no subnormals, so a normalised significand and an in-range exponent is a complete result. IEEEfloat results can be subnormal near the underflow threshold, and the classic software answer — hand $2^E$ and $M$ to a floating-point multiplier — is absurd in hardware for a power-of-two multiply. Instead the box grows exponent-comparison logic against $e_{\min}$ and a $w_F$-bit right shifter (p. 651). The shifter must sit *before* the rounding adder: shifting after rounding would round at the normalised position and then move the bits, which rounds at the wrong weight; shifting first puts the surviving bits at their final positions so the one round bit still lands at $2^{-w_F-1}$ of the *stored* format.

**On FPGAs the whole block is one carry chain plus one LUT level.** Each bit of the packed field is a three-input function — two candidate bits of $M$ (the shifted and unshifted alternatives) and $\mathrm{msb}(M)$ — so the normalisation mux and the field selection collapse into the LUT that already feeds the adder input, and the only depth left is the $w_E+w_F+1$-bit addition on the hard carry chain ([[FPGAs]]). For binary32 that field is $8+23+1=32$ bits, a single carry-chain segment on every mainstream architecture. On ASIC there is no such merge: the mux row is real gates ahead of a real $32$-bit adder, and the adder architecture becomes a genuine choice ([[Adders]]) rather than a fixed resource.

$$\boxed{\ R = \Big(\underbrace{\big(E-\overline{\mathrm{msb}(M)}\big)}_{w_E+1\ \text{bits}}\ \Vert\ \underbrace{F}_{w_F\ \text{bits}}\Big) + r\ }$$

with $M_{\mathrm{norm}} = M \ll \overline{\mathrm{msb}(M)}$, $F$ its bits at weights $2^{-1}\ldots2^{-w_F}$, and $r$ its bit at $2^{-w_F-1}$. One adder, $w_E+w_F+1$ bits wide, combinational.

**When it breaks.**

- **A wider $Y$ than $(-\tfrac12,\tfrac12)$.** The one-bit mux is valid only because $e^Y<2$. Loosen the tentative-exponent bound past the $0.22$ budget of §22.3.4 and $M$ can need a two-bit shift, at which point a real [[Normalizers|normaliser]] returns and the block stops being free.
- **A non-monotone exponent encoding.** The carry trick requires biased exponent and unsigned fraction. A two's-complement exponent field, or a sign-magnitude significand, breaks the order-isomorphism: the carry crosses into a field where $+1$ is not "the next number", and you are back to an explicit increment-and-renormalise path.
- **$g=0$.** With no guard bits there is no bit at $2^{-w_F-1}$ to serve as $r$; the block degenerates to truncation, whose error is $2^{-w_F}$ for this step alone and consumes the entire faithfulness budget before any upstream error is counted.
- **More than one exponent step out of range.** The headroom is exactly one bit. The box detects overflow, but only for arguments the upstream filter has already narrowed to within one exponent of the representable range; it is not a general saturation unit.
- **Correct rounding.** Dropping the $g-1$ bits below $r$ discards the sticky information, so the result is faithful, never correctly rounded. Correct rounding would need unbounded intermediate precision in the range reduction (p. 647), which is why the whole chapter targets 1 ulp instead.

**RTL (Spade).**

```spade
// normalize-round-pack for Nfloat(WE, WF) with G guard bits.
//   m : ufix(0, -WF-G), the fixed-point e^Y, WF+G+1 bits, MSB at weight 2^0
//   e : the biased tentative exponent, WE+1 bits (one bit of headroom)
// out: {E_R : WE+1} || {F : WF}; a set MSB means the exponent overflowed.
entity nrp<#uint WE, #uint WF, #uint G>(
    m: uint<{WF + G + 1}>,
    e: uint<{WE + 1}>,
) -> uint<{WE + WF + 1}> {
    let norm = m.msb();                                        // is e^Y >= 1 ?
    let ms: uint<{WF + G + 1}> = if norm { m } else { m << 1 }; // normalise
    let er: uint<{WE + 1}> = if norm { e } else { e -. 1 };
    let (guard, hi) = ms.as_bits().split_at::<G>();            // index 0 = LSB
    let (fbits, _) = hi.split_at::<WF>();                      // drop the hidden 1
    let frac: uint<WF> = fbits.as_uint();
    let rb: uint<{WE + WF + 1}> = if guard.last() { 1 } else { 0 };
    er.concat(frac) +. rb                                      // the one adder
}
```

`norm` is the control wire tapped off $M$ in the diagram; `ms` is $M_{\mathrm{norm}}$ and `er` is $E_R$. `split_at::<G>` performs the field split drawn as the bit strip: `guard.last()` is the bit at $2^{-w_F-1}$, i.e. the round bit $r$, and everything below it in `guard` is simply never read — the $g-1$ discarded cells. `er.concat(frac)` is the packed field (integer `concat` puts the left operand high, so the exponent lands above the fraction), and the final `+.` is the single $w_E+w_F+1$-bit adder, wrapping rather than widening so that its carry-out is the overflow flag the top bit already encodes. All combinational. Synthesis will not build the drawn mux row separately: on an FPGA it folds into the LUTs feeding the carry chain, and the `<< 1` is pure routing in any technology.

Verified on the concrete instance `nrp::<4, 4, 3>` — Nfloat$(4,4)$ with $g=3$, the worked example of §22.3 — against a behavioural Verilog reference: 6 named vectors, 3000 random, and an exhaustive sweep of all $2^{13}$ input pairs, all matching. The named vectors include the $e^{3.5}$ case ($M=1.0000100_2$, biased $E=12$, giving $1.0001_2\times2^{5}=34$), the $M<1$ branch, a rounding carry that propagates out of an all-ones fraction into the exponent, and the asymmetric pair $M=00000001_2$ against $M=10000000_2$ — the vector that a reversed bit order would fail and a symmetric one would not.

**Related Notes.**

- [[FPExp Operator]] – depends-on: this is the last of its six blocks, and the only one that touches the output format.
- [[Tentative Exponent Unit]] – depends-on: produces $E$ on $w_E+1$ bits, and the guarantee $E\in\{E_R,E_R+1\}$ that makes the correction one-directional.
- [[First-Order e^Y Evaluator]] – depends-on: produces $M$ in `ufix`$(0,-w_F-g)$, whose $[0.65,1.65]$ range is the precondition for the one-bit mux.
- [[Normalizers]] – compares: the general case, where an unbounded leading-zero run forces an LZC plus a logarithmic-depth shifter; the exponential escapes both.
- [[Rounding]] – supports: supplies the half-ulp round bit and the $2^{-w_F-1}$ term this block contributes to the budget.
- [[Floating-Point Formats]] – supports: the biased exponent field is what makes the concatenated field monotone and the rounding carry free.
- [[Floating-Point Operators]] – compares: an adder or multiplier pays for a separate normalise-and-increment path after rounding; here the same adder does both.
- [[Exponential Special-Case Unit]] – extends: consumes the overflow bit this block produces, together with the upstream `uo` flag.
- [[Error Accuracy]] – supports: the faithfulness target $2^{-w_F}$ that the final rounding spends half of.
- [[Fixed-Point-In Exponential]] – counter-example: entering the operator one block downstream skips the fixed-point conversion but still ends here, since a fixed-point-in exponential is still floating-point-out.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22.

- §22.3.7 Normalization and rounding, p. 651 — the three steps, the $w_E+w_F+1$-bit adder, and the IEEEfloat addendum.
- §22.3.1 Overview, pp. 646–647 — (22.8), the one-bit correction this block implements.
- §22.3.4 Computation of the tentative exponent, p. 649 — $E$ on $w_E+1$ bits, $E\in\{E_R,E_R+1\}$, and the requirement that overflow be detected in this box.
- §22.3.6 Computation of $e^Y$, p. 651 — $e^Y\in[0.65,1.65]$ and the `ufix`$(0,-w_F-g)$ output format.
- §22.3.8 Overall error analysis, pp. 651–653 — (22.15)–(22.18), where the $2^{-w_F-1}$ final-rounding term is charged.
- Fig. 22.4, p. 648 — the block's position in the FPExp architecture.
- §2.5 biased floating-point formats, cited from p. 651.
