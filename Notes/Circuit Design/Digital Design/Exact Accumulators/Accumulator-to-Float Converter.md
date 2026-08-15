---
title: "Accumulator-to-Float Converter"
description: "FixToFloat for an accumulator inside the output exponent range: leading-sign count and normaliser, XOR negation, exponent E0+m_A-C, and a single adder that rounds and packs at once."
kind: circuit
source: "ASA §21.2.4, pp. 636-637"
status: seed
spade: simulated
tags: [digital, exact-accumulators, floating-point, normalizer, rounding]
aliases:
  - FixToFloat
  - Accumulator to Float Converter
  - Fix-to-Float Converter
  - Accumulator Conversion to Floating Point
---

# Accumulator-to-Float Converter

The fixed-point-to-float block at the end of an exact accumulator, in the case where the accumulator's range already fits the output exponent range — so one leading-sign normalisation and one adder do the negation, the rounding and the packing together.

```tikz title="FixToFloat for an accumulator inside the output exponent range: normaliser, XOR row, exponent processing, and a single rounding-and-packing adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- accumulator input
  \draw[->] (7.3,5.9) -- (7.3,4.9);
  \node[anchor=south] at (7.3,5.92) {$A$ (two's complement)};
  \node[anchor=west,scale=0.8] at (7.36,5.35) {$w_A$};

  % ---------- sign tap, routed down the right-hand side
  \draw (7.3,5.5) -- (10.4,5.5) -- (10.4,1.5) -- (9.6,1.5);
  \draw[->] (10.4,3.0) -- (7.8,3.0);
  \node[anchor=west,scale=0.8] at (10.46,4.3) {$s$: $1$};

  % ---------- normaliser (shifter trapezoid)
  \draw (5.2,3.9) -- (8.9,3.9) -- (9.6,4.9) -- (5.2,4.9) -- cycle;
  \node[scale=0.75,align=center] at (7.0,4.4) {normaliser\\ (leading-sign count $+$ shift)};

  % ---------- leading-sign count to exponent processing
  \draw[->] (5.2,4.4) -- (3.0,4.4);
  \node[anchor=south,scale=0.8] at (4.1,4.44) {$C$: $w_C$};

  % ---------- exponent processing
  \draw (0.2,3.9) rectangle (3.0,4.9);
  \node[scale=0.8,align=center] at (1.6,4.4) {exponent processing\\ $E=E_0+m_A-C$};

  % ---------- signed fraction into the xor row
  \draw[->] (7.1,3.9) -- (7.1,3.3);
  \node[anchor=west,scale=0.8] at (7.16,3.6) {$F_s$: $w'_F{+}1$};

  \draw (6.2,2.7) rectangle (7.8,3.3);
  \node[scale=0.85] at (7.0,3.0) {xor};

  \draw[->] (7.0,2.7) -- (7.0,1.9);
  \node[anchor=west,scale=0.8] at (7.06,2.3) {$F$: $w'_F{+}1$};

  % ---------- exponent and zero flag down to the pack block
  \draw[->] (1.0,3.9) -- (1.0,1.9);
  \node[anchor=west,scale=0.8] at (1.06,2.9) {$z$: $1$};
  \draw[->] (2.3,3.9) -- (2.3,1.9);
  \node[anchor=west,scale=0.8] at (2.36,2.9) {$E$: $w'_E$};

  % ---------- exception bits from the accumulator
  \draw[->] (-0.3,5.9) -- (-0.3,1.9);
  \node[anchor=south,scale=0.8] at (-0.3,5.92) {exn};

  % ---------- round, exception handling and pack
  \draw (-0.6,1.1) rectangle (9.6,1.9);
  \node[scale=0.85] at (4.5,1.5)
    {rounding, exception handling \& pack: one $w'_E+w'_F$-bit adder};

  \draw[->] (4.5,1.1) -- (4.5,0.35);
  \node[anchor=west,scale=0.8] at (4.56,0.7) {$R$: $\text{float}(w'_E,w'_F)$};
\end{circuitikz}
\end{document}
```

*After Fig. 21.11, p. 637.*

**Ask first whether the block is needed at all.** It is drawn as a separate component precisely because it is often absent. An FPGA integrating for hours — the inductance application of [[Application-Specific Exact Accumulator]] — produces one $w_A$-bit word at the end, and converting that in software costs nothing; dedicating logic to it would be logic not spent on throughput. The common case that *does* need it is one normalisation every $N$ accumulations, a dot product of length $N$, and there the converter is used once per $N$ cycles, so a single pipelined instance can be time-shared between up to $N$ dot-product operators for the price of muxing and routing (p. 636). Everything below assumes the easy case: the accumulator's exponent span sits inside $[e_{min},e_{max}]$ of the output format, which covers the exact sum operator and most application-specific accumulators. When it does not, the accumulator splits into zones — [[Three-Zone Accumulator Converter]].

**Normalise around the sign, because the accumulator is two's complement.** $A$ arrives on $w_A = m_A - \ell_A + 1$ bits with its MSB at weight $2^{m_A}$, and it is two's complement, not sign/magnitude — that is the whole point of [[Two's-Complement Exact Accumulator]], where addition and subtraction are the same circuit. A magnitude normaliser counts leading zeroes; here the redundant prefix is a run of copies of the sign, so the count is a *leading sign count* $C$ ([[Leading Zero Counters]], [[Normalizers]]). Since $A_{w_A-1}$ is by definition equal to the sign, $C \ge 1$ always, and $C \le w_A$. The useful shift is $C-1$, not $C$: one copy of the sign must survive or the shifted word changes value. This combined counter-and-shifter is by far the most expensive block in the converter, and its cost is what makes conversion worth avoiding or sharing.

**The exponent is one subtraction, and it follows from where the first informative bit lands.** After the run of $C$ sign copies, the first bit that differs from the sign sits at weight $2^{m_A-C}$, so $|A| \in [2^{m_A-C}, 2^{m_A-C+1})$ and the real exponent is $m_A - C$. Adding the format's bias $E_0$ ([[Floating-Point Formats]]) gives the tentative biased exponent on $w'_E$ bits, from a count on $w_C = \lceil \log_2(w_A+1) \rceil$ bits. Because $m_A$ and $E_0$ are both compile-time constants, this is a constant-minus-variable subtraction of $w_C$ bits into $w'_E$ — one small carry chain, negligible beside the normaliser. The same block raises the zero flag $z$, since $A=0$ is the one input for which no exponent is meaningful.

**Negate after normalising, not before, and defer the $+1$.** The normaliser emits $F_s$ on $w'_F+1$ bits — the $w'_F$ bits below the leading bit, with a rounding bit appended at the LSB — and $F_s$ is still *signed*: for negative $A$ those bits are the two's-complement pattern, not the magnitude. Recovering the magnitude uses the identity $-x = \bar{x} + 1$, and the two halves are split across two blocks. The XOR row does $\bar{x}$: $w'_F+1$ gates, one per bit, conditioned on $s$. Doing this after the shifter rather than before it is the reason the row is $w'_F+1$ wide and not $w_A$ wide — for a binary32 exact sum that is 25 gates instead of 277. The $+1$ does not get its own incrementer at all; it is handed to the adder in the next block.

**One adder rounds, carries and packs, and the free carry is an encoding trick.** Concatenate $E$ (on $w'_E$ bits) above $F$ (on $w'_F+1$ bits) and add, at the LSB, the sum $s + r$ of the deferred negation bit and the rounding bit — a value in $\{0,1,2\}$. Truncating the discarded LSB afterwards is wiring, so the real carry-propagate is $w'_E + w'_F$ bits with a carry-in generated by a single full adder at the round position. Two overflows then come out for nothing, both because IEEE-style encodings place the exponent and fraction fields *adjacently* (Table 2.1, p. 51): a carry out of the fraction field is, bit for bit, an increment of the exponent field. That is exactly what fraction overflow on rounding requires — fraction wraps to zero, exponent up one. It is also what the extreme accumulator value $-2^{m_A}$ requires: there $C=1$, so the tentative exponent $E_0+m_A-1$ is one too small and the negated fraction is all ones, whose $+1$ carries straight into the exponent and repairs it. No comparator, no special case.

$$\boxed{\ R \;=\; \Big[\;\underbrace{E_0+m_A-C}_{w'_E}\;\Big\Vert\;\underbrace{F_s \oplus s}_{w'_F+1}\;\Big] \;+\; (s+r)\ ,\quad\text{result read above the LSB}\ }$$

> [!warning] The XOR-then-round shortcut is not $0.5$ ulp on negative accumulators, and the source does not say so.
> The chapter presents this datapath as round-to-nearest, ties away, and notes only that *ties to even* additionally needs a sticky bit. But the XOR row negates the **truncated** field, whereas correct rounding needs the truncation of the **negated** value, and those do not commute. Write the exact magnitude in units of the round-bit position as $N - t$, where $N = \overline{F_s} + 1$ and $t \in [0,1)$ is the discarded tail; the circuit delivers $\lfloor (N+1)/2 \rfloor$, which is correct unless $N$ is odd and $t \neq 0$, and then it is $(1+t)/2$ ulp too large — always more than $0.5$, approaching $1$. Concretely, $A = -1025$ with $w'_F = 8$ has $|A| = 2^{10}+1$ and should round to $-1024$; the datapath as described returns $-1028$, an error of $0.75$ ulp. $N$ odd is just $F_s$ odd, so the repair is one AND gate: suppress the rounding bit when $s \wedge \text{sticky} \wedge F_{s,0}$. The sticky the chapter defers to ties-to-even is therefore already needed for ties-away. The RTL below includes the correction; without it, $1100$ of $5091$ test vectors miss the correctly rounded result, all of them negative.

**When it breaks.**

- **Accumulator wider than the output exponent range.** The exact sum-of-products case has $w_A = 554$ against a binary32 span of $277$; bits at the extremes can never reach the result and must be handled as zones instead — [[Three-Zone Accumulator Converter]].
- **The zero flag as stated.** $C = w_A$ means every bit equals the sign, which is $A=0$ *or* $A=-2^{\ell_A}$ (the all-ones word). The latter is a perfectly good non-zero result, and the carry mechanism above already produces it correctly, so the flag must be $z = (C = w_A) \wedge \lnot s$ or the smallest representable negative accumulator is flushed to zero.
- **Ties to even.** Costs a sticky bit out of the normaliser — the OR of everything it shifts out — consumed exactly as in a floating-point adder ([[Rounding]]). Nothing in IEEE-754 compels it here, since the accumulator is not an IEEE operation, but an IEEE-facing output usually wants it.
- **Exponent overflow.** The derivation assumes $m_A \le e_{max}$ and $\ell_A \ge e_{min}-w'_F$. Outside that, $E$ leaves the $w'_E$ field and the free carry becomes an unsignalled wraparound.
- **Latency, not throughput, is the reason to share.** The converter is deeply pipelined and used once per $N$ inputs; time-sharing it across operators is nearly free, whereas replicating it per accumulator pays the normaliser's area every time.

**RTL (Spade).** A concrete instance: $w_A = 16$, $m_A = 15$, $\ell_A = 0$, output $\text{float}(w'_E{=}8, w'_F{=}8)$ with $E_0 = 127$, packed as $\{s, E, F\}$.

```spade
// leading-sign count, presented as x = a for a >= 0, x = ~a for a < 0,
// so C = clz(x) and C is always in [1, 16].
fn lsc16(x: uint<16>) -> uint<5> {
    let b = x.as_bits();
    if b[15] { 0 } else if b[14] { 1 } else if b[13] { 2 } else if b[12] { 3 }
    else if b[11] { 4 } else if b[10] { 5 } else if b[9] { 6 } else if b[8] { 7 }
    else if b[7] { 8 } else if b[6] { 9 } else if b[5] { 10 } else if b[4] { 11 }
    else if b[3] { 12 } else if b[2] { 13 } else if b[1] { 14 } else if b[0] { 15 }
    else { 16 }
}

entity fix2float16(a: int<16>) -> uint<17> {
    let s = a.sign_bit();
    let ua: uint<16> = a.as_uint();

    // normaliser: leading-sign count, then shift the single sign bit to the top
    let c = lsc16(if s { ~ua } else { ua });
    let sh: uint<16> = trunc(zext::<5, 16>(c) - 1);
    let v: uint<16> = ua << sh;

    // still-signed fraction: w'_F bits below the leading bit, plus a round bit
    let fs: uint<9> = trunc(v >> 5);
    let sticky: bool = (v & 0x1F) != 0;

    // exponent processing: E = E_0 + m_A - C = 142 - C, and the zero flag
    let cw: uint<9> = zext(c);
    let e: uint<8> = trunc(142 - cw);
    let z: bool = c == 16 && !s;

    // XOR row: bitwise negation, the +1 is deferred into the final adder
    let f: uint<9> = if s { ~fs } else { fs };

    // round to nearest, ties away; the round bit is suppressed when the XOR row
    // negated a truncated field of odd magnitude in half-ulp units
    let r: bool = !(s && sticky && fs.as_bits()[0]);
    let ad: uint<17> = if s { if r { 2 } else { 1 } } else { if r { 1 } else { 0 } };

    // round, exception handling & pack: one add over the concatenated E:F
    let q: uint<17> = trunc(e.concat(f) + ad);
    let m: uint<16> = trunc(q >> 1);
    let su: uint<1> = if s { 1 } else { 0 };
    if z { 0 } else { su.concat(m) }
}
```

`c` is the diagram's $C$, `v` the normaliser's shifted output, `fs` the wire $F_s$, `f` the XOR row's $F$, and `ad` the $s+r$ that enters at the LSB of the packing adder. The shift is by `c - 1`, matching the leading-sign convention. `e.concat(f)` is $17 = w'_E + w'_F + 1$ bits and the `>> 1` after the add discards the round position; synthesis will not build a 17-bit adder followed by a shift, it will build the $w'_E + w'_F = 16$-bit adder of the figure with a carry-in from a single full adder on the discarded bit. Everything here is combinational — a real converter pipelines the normaliser and the packing adder into separate stages, which is what makes it shareable across $N$ operators.

Verified with `.zettel/sim.sh` against an independent behavioural model that takes $|A|$, finds its MSB and rounds to nearest with ties away: **5091 vectors pass**, comprising named cases ($0$, $\pm1$, $\pm129$, $\pm 2^k$ and $\pm(2^k{+}1)$ for every $k$, $32767$, $-32768$, `16'h5555`, `16'hAAAA`, `16'h7F81`) and a 5000-vector random sweep. The asymmetric patterns matter: symmetric ones survive a reversed bit order, which is exactly what a $w_A$-wide shifter can get wrong.

**Related Notes.**

- [[Three-Zone Accumulator Converter]] – extends: the same converter when the accumulator outruns the output exponent range, with the normaliser fed only the middle zone.
- [[Normalizers]] – depends-on: supplies the combined leading-sign counter and shifter that dominates this block's area.
- [[Leading Zero Counters]] – depends-on: the count $C$, in its count-the-sign-bit variant rather than count-the-zeroes.
- [[Rounding]] – supports: the ties-away versus ties-to-even choice and the sticky bit the latter needs.
- [[Floating-Point Formats]] – depends-on: the adjacent exponent and fraction fields that make the rounding carry increment the exponent for free.
- [[Two's-Complement Exact Accumulator]] – depends-on: produces the two's-complement $A$ that forces a leading *sign* count here.
- [[Exact Sum-of-Products Operator]] – compares: places this block at the end of the full datapath.
- [[Application-Specific Exact Accumulator]] – counter-example: the case where the block is omitted entirely and conversion happens in software.
- [[Accumulator Exception FSM]] – supports: sources the `exn` bits this block folds into the packed result.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21 "Floating-Point Accumulation and Sum of Products":

- §21.2.4 "Conversion of the Accumulator Back to Floating Point", pp. 636-637, and Fig. 21.11, p. 637 — the block structure, $E = E_0 + m_A - C$, the XOR row, and the single packing adder.
- §21.3 "Cost, Speed, and Accuracy", p. 638 — FixToFloat sized against a floating-point adder of the same fraction width.
- Table 2.1, p. 51 — the adjacent exponent and fraction fields that make the rounding carry increment the exponent.
- §10.3, p. 323 — the leading sign counter and the normaliser it drives.
