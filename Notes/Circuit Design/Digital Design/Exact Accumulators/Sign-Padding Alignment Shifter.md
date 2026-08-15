---
title: "Sign-Padding Alignment Shifter"
description: "The FloatToFix front end: negate on w''_F bits before shifting instead of w_A bits after, paid for with a shifter that pads both ends with the sign bit."
kind: circuit
source: "ASA §21.2.2, pp. 632-634"
status: seed
spade: simulated
tags: [digital, exact-accumulators, shifter, twos-complement, alignment, fpga]
aliases:
  - FloatToFix
  - Float2Fix
  - Alignment Shifter
  - Sign-Padding Shifter
---

# Sign-Padding Alignment Shifter

The block that converts a signed floating-point summand into the accumulator's two's-complement fixed-point format, distinguished from the obvious version by performing the negation *before* the alignment shift, which is legal only because the shifter pads both ends with the sign bit instead of with zeros.

```tikz title="FloatToFix with the XOR row moved ahead of the shifter, so the shifter pads with the sign bit"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- top-level inputs
  \node[anchor=south] at (0,5.2) {$s$};
  \node[anchor=south] at (4.6,5.2) {$E$};
  \node[anchor=south] at (8.05,5.2) {$M$};

  % ---------- the sign spine
  \draw (0,5.15) -- (0,-1.55);
  \fill (0,4.55) circle (2pt);
  \fill (0,0.55) circle (2pt);

  % ---------- s branch into the xor row
  \draw (0,4.55) -- (6.4,4.55) -- (6.4,3.9);
  \draw[->] (6.4,3.9) -- (6.8,3.9);
  \node[anchor=south east,scale=0.75] at (6.42,3.96) {$1$};

  % ---------- E: the left-shift distance
  \draw[->,line width=1.1pt] (4.6,5.15) -- (4.6,1.07);
  \node[anchor=east,scale=0.75] at (4.54,3.6) {$w''_E$};

  % ---------- M: the unnormalised, unrounded significand product
  \draw[->,line width=1.1pt] (8.05,5.15) -- (8.05,4.27);
  \node[anchor=west,scale=0.75] at (8.11,4.75) {$w''_F$};

  % ---------- the small XOR row
  \draw (6.8,3.55) rectangle (9.3,4.25);
  \node at (8.05,3.9) {xor};

  \draw[->,line width=1.1pt] (8.05,3.55) -- (8.05,1.07);
  \node[anchor=west,scale=0.75] at (8.11,2.35) {$w''_F$};

  % ---------- the sign-padding left shifter
  \draw (2.6,0.25) -- (9.7,0.25) -- (9.7,1.05) -- (3.4,1.05) -- cycle;
  \node at (7.0,0.64) {shifter};
  \draw[->] (0,0.55) -- (2.88,0.55);
  \node[anchor=south,scale=0.72] at (1.45,0.6) {pad bit $=s$};

  % ---------- output
  \draw[->,line width=1.1pt] (5.6,0.25) -- (5.6,-0.72);
  \node[anchor=west,scale=0.75] at (5.66,-0.3) {$w_A$};
  \node[anchor=north] at (5.6,-0.76) {$X_{\text{fix}}$ (ones' complement if $s=1$)};

  % ---------- the deferred +1
  \draw[->,dashed] (0,-1.55) -- (4.1,-1.55);
  \node[anchor=west,scale=0.75] at (4.16,-1.55)
    {$c_{\text{in}}=s$ at the $w_A$-bit accumulator adder};
\end{circuitikz}
\end{document}
```

*after Fig. 21.9, p. 633; the dashed carry-in is drawn from the adder of Fig. 21.8, p. 633.*

**Fix what the front end owes the accumulator.** Its three inputs come straight out of the [[Exact Unnormalized Multiplier]]: a sign $s$ on $1$ bit, an unnormalised significand product $M$ on $w''_F = 2w_F+2$ bits, and a doubly-biased exponent $E$ on $w''_E = w_E+1$ bits. $M$ is *unsigned* — the format is $\text{ufix}(1,-2w_F)$, so $M\in[0,4)$ ([[Fixed-Point Representations]]) — and $E$ was deliberately left doubly biased because that value is not an exponent to be decoded but literally the number of positions by which $M$ must be shifted left to land in the accumulator's grid $\text{sfix}(m_A,\ell_A)$, which is $w_A = m_A-\ell_A+1$ bits wide ([[Number Formats]]). The block's whole job is therefore $X_{\text{fix}} = (-1)^s\,2^{E}M$, one shift and one sign.

**Two's complement turns the sign into a row of XORs and a carry.** The accumulator is kept in two's complement, so a negative summand must be negated, and negation there is the identity $-x = \bar{x}+1$. Bitwise complement conditional on $s$ is a row of 2-input XOR gates driven by $s$; the $+1$ is a single carry-in, and the loop already contains a $w_A$-bit adder with an unused $c_{\text{in}}$, so the increment is free. The naive placement (Fig. 21.8) does the shift first and the negation second, which puts that XOR row on the aligned word — $w_A$ gates. For the binary32 exact sum of products, $w_A = 554$ against $w''_F = 48$: the negation costs eleven times more than the number it is negating.

**Push the XOR row back through the shifter.** Write $\mathrm{sh}_p(x,E)$ for the left shift of $x$ by $E$ into a $w_A$-bit field with the vacated positions — below the shifted word and above it — filled with the constant $p$. A shift is a *wire permutation* plus constant insertion, and bitwise XOR with a constant is applied independently per position, so the two commute on every bit that carries data. The only bits that need care are the padding positions, and there $0\oplus s = s$. Hence

$$\mathrm{sh}_{s}\big(M\oplus s^{w''_F},\,E\big)\;=\;\mathrm{sh}_{0}(M,E)\oplus s^{w_A},$$

where $s^{k}$ means $s$ replicated $k$ times. The right-hand side is Fig. 21.8 — align with zeros, then complement everything. The left-hand side is Fig. 21.9 — complement $w''_F$ bits, then align with a shifter whose pad constant has been changed from $0$ to the live signal $s$. They are equal bit for bit, and the XOR row has shrunk from $w_A$ to $w''_F$ gates: $554\to 48$, saving $506$ XORs in the binary32 case.

**The upper padding is $s$ too, and that is the step worth checking twice.** Padding the low end with $s$ is easy to accept — those positions held $0$ and $\bar 0 = 1$. The high end looks like it should be a sign extension of something, and it is, but of the *complemented* word: because $M \ge 0$, the value $2^{E}M$ is non-negative and its two's-complement sign bits above the shifted field are all $0$; complementing makes them all $1$. So "pad the top with $s$" and "sign-extend the ones' complement" are the same instruction, and both reduce to filling with $s$. No separate sign-extension logic is needed anywhere in the block, and no fanout tree beyond the one the padding already demands.

**The $+1$ deliberately does not happen here.** What leaves the shifter is $\overline{2^{E}M}$ when $s=1$, i.e. the ones' complement, one ulp of $\ell_A$ short of the true value. The completion is the accumulator adder's $c_{\text{in}} = s$, drawn dashed above. This is not an oversight to be tidied up: performing the increment inside FloatToFix would mean a second $w_A$-bit carry propagation per summand, which is precisely the cost that [[Two's-Complement Exact Accumulator]] exists to avoid.

**What the rearrangement does not buy is fanout on $s$.** In Fig. 21.8, $s$ drove $w_A$ XOR gates. In Fig. 21.9 it drives $w''_F$ XOR gates plus every padding input of the shifter, and in a log-depth [[Barrel Shifters|barrel shifter]] the stage that shifts by $2^k$ inserts $2^k$ pad bits, so the padding inputs sum to roughly $w_A$ across the stages. The load on $s$ is a wash; both versions need a buffer tree of about the same size. The saving is gates and area, not drive strength — a distinction worth keeping straight, because a design that is fanout-limited rather than area-limited gains nothing from this transformation.

**On an FPGA the XOR row can disappear entirely; on an ASIC it merely shrinks.** A [[Shifters|shifter]] stage is a row of 2:1 multiplexers, one LUT per bit, and the pad input is already one of that LUT's inputs — swapping the constant $0$ for the signal $s$ changes the truth table and costs nothing ([[FPGAs]]). The surviving $w''_F$ XORs are a 2-input function feeding the first mux stage, so `(sel ? a : pad) XOR s` is a 4-input function that packs into the same 6-LUT as the mux it feeds; the XOR row costs zero LUTs and zero extra logic levels there. On an ASIC the row is $w''_F$ real XOR cells in series with the shifter, so the transformation removes $w_A - w''_F$ gates of area but leaves one XOR of delay on the path — it is an area optimisation, not a latency one. Either way FloatToFix is purely combinational and can be pipelined at will, because it sits *outside* the accumulation loop.

$$\boxed{\ \mathrm{sh}_{s}\big(M\oplus s^{w''_F},E\big)=\mathrm{sh}_{0}(M,E)\oplus s^{w_A}\quad\Longrightarrow\quad \text{XOR count } w_A \to w''_F\ }$$

> [!warning] Figure typo in the source
> Fig. 21.9 labels the xor block's output $w'_F$. XOR is bitwise and cannot change a width, and its input is labelled $w''_F$ two millimetres above; $w'_F$ is the *converter output* fraction width, which belongs to [[Accumulator-to-Float Converter]] and has nothing to do with this wire. Read it as $w''_F = 2w_F+2$.

**When it breaks.**

- $X_{\text{fix}}$ is the ones' complement, not the value. Feed it to anything without a spare carry-in — a compressor tree, a register, a second shifter — and every negative summand is one ulp of $\ell_A$ too small. The $+1$ has to land somewhere.
- The upper padding is correct only because the exact accumulator is sized so that $2^{E}M$ never reaches $m_A$. Give the accumulator a finite, application-specific $m_A$ and overflow becomes possible, so $E$ must additionally be compared against $m_A$ and the result routed to the exception FSM ([[Application-Specific Exact Accumulator]], [[Accumulator Exception FSM]]).
- The shift distance must fit in $w''_E$ bits *as delivered*. It does, but only just: binary32 needs $w_A - w''_F = 506$ distinct positions and $w''_E = 9$ bits give $512$. Choose $\ell_A > 2e_{min}-2w_F$ and the constant $\ell_A - (2e_{min}-2w_F)$ must be subtracted from $E$ first — cheap, and off the loop, but it is a subtractor that Fig. 21.9 does not draw.
- Underflowing summands fall off the bottom of the shifter and are silently truncated. Rounding them instead means a shifter targeting $\text{sfix}(m_A,\ell_A-1)$, an adder one bit wider with a constant LSB of $1$, and that LSB dropped afterwards ([[Error Accuracy]]).
- The whole construction presupposes a two's-complement accumulator. A [[Sign-Magnitude Accumulator]] has no XOR row to shrink, because it selects add or subtract instead — and pays for it with a second carry propagation inside the loop.

**In Spade.** The generic version needs one mux stage per bit of the shift distance, so it is written out concretely — $w''_F = 8$, $w_A = 24$, a 4-bit distance:

```spade
/// FloatToFix front end of Fig. 21.9: negate on the w''_F-bit significand,
/// then align it with a left shifter that pads *both* ends with the sign bit.
/// Emits the ones' complement when s = 1; the +1 of -x = ~x + 1 is the
/// accumulator adder's carry-in and is not part of this block.
entity spad_align(s: bool, e: uint<4>, m: uint<8>) -> uint<24> {
    // the small XOR row: w''_F bits, not w_A bits
    let ones_f: uint<8> = if s { 255 } else { 0 };
    let xm = m ^ ones_f;

    // the high padding is the same bit, so seed the w_A-bit word with it
    let hi: uint<16> = if s { 65535 } else { 0 };
    let w0: uint<24> = hi.concat(xm);

    // four mux stages; each shifts in 2^k copies of the pad bit instead of 0
    let p1: uint<24> = if s { 1 } else { 0 };
    let p2: uint<24> = if s { 3 } else { 0 };
    let p4: uint<24> = if s { 15 } else { 0 };
    let p8: uint<24> = if s { 255 } else { 0 };

    let eb = e.as_bits();
    let w1 = if eb[0] { (w0 << 1) | p1 } else { w0 };
    let w2 = if eb[1] { (w1 << 2) | p2 } else { w1 };
    let w3 = if eb[2] { (w2 << 4) | p4 } else { w2 };
    if eb[3] { (w3 << 8) | p8 } else { w3 }
}
```

`xm` is the xor block of the diagram and is 8 bits wide, never 24. `hi.concat(xm)` is the upper padding: `concat` on integers puts its receiver in the *high* half, so the word entering the shifter already carries $s$ above the significand — that is the shifter's static pad, and `p1`…`p8` are its dynamic pad, one `|` per stage supplying the $2^k$ bits that the shift vacated. The four `if eb[k]` lines are the four mux rows of the trapezoid, with `e` running from LSB to MSB so the stages compose to a shift by $e$. Everything is combinational — no `reg`, no clock — and synthesis will not build four cascaded 24-bit shifters: it sees one LUT per bit per stage, with the `|` folded into the same LUT as the mux, which is the FPGA argument above.

Simulated with `.zettel/sim.sh` against the behavioural reference `((m << e) ^ {24{s}})` — literally the right-hand side of the boxed identity, so the testbench checks Fig. 21.9 against Fig. 21.8 rather than against itself: 11204 vectors, zero mismatches. That is all $2\times16\times256 = 8192$ input combinations exhaustively, 3000 random, and 12 named cases including the asymmetric pairs `m=0x01,e=1` versus `m=0x80,e=1`, which a reversed bit order would confuse. Replacing the pad constants with zeros makes 5569 of those vectors fail immediately, so the sign padding is carrying the derivation's weight and not decorating it.

**Related notes.**

- [[Exact Unnormalized Multiplier]] – depends-on: produces $s$, $M$ and the doubly-biased $E$ that this block consumes raw as a shift distance.
- [[Two's-Complement Exact Accumulator]] – depends-on: the consumer; its adder's $c_{\text{in}} = s$ supplies the $+1$ this shifter deliberately omits.
- [[Barrel Shifters]] – extends: the standard log-depth shifter, changed in exactly one place — the pad constant becomes a live signal.
- [[Shifters]] – depends-on: the padding-bit count per stage, which is what pins the fanout on $s$ at roughly $w_A$.
- [[Fixed-Point Representations]] – depends-on: the $\text{ufix}(1,-2w_F)$ input and $\text{sfix}(m_A,\ell_A)$ output grids the alignment maps between.
- [[Sign-Magnitude Accumulator]] – counter-example: removes the XOR row entirely by selecting add or subtract, and pays a second carry propagation inside the loop for it.
- [[Application-Specific Exact Accumulator]] – extends: adds overflow comparison against $m_A$ and the truncated or rounded variants of this shifter.
- [[Accumulator-to-Float Converter]] – compares: the mirror image on the way out, where the same XOR-row-placement argument moves the negation to after the normaliser, onto $w'_F+1$ bits instead of $w_A$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §21.2.1 "Exact Floating-Point Multiplier", pp. 631-632 — the origin of $s$, $E$, $M$ and the widths $w''_E = w_E+1$, $w''_F = 2w_F+2$ (Fig. 21.7, p. 631).
- §21.2.2.1 "Exact Accumulator", pp. 632-633, incl. Fig. 21.8 (XOR row after the shifter) and Fig. 21.9 (XOR row before it, sign-padding shifter).
- §21.2.2.3 "Application-Specific Accumulator", p. 634 — truncated and rounded shifter variants, overflow detection against $m_A$.
- §21.2.2.4 "Two's Complement Versus Sign-Magnitude", p. 634 — why the XOR row exists at all.
- Chap. 10 (shifter architectures), cross-referenced from p. 633 for the per-stage padding-bit count behind the fanout argument.
