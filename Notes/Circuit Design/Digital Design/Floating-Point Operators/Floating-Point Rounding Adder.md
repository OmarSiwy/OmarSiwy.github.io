---
title: "Floating-Point Rounding Adder"
description: Adds a single 1 at the LSB of the concatenated exponent and fraction so that a fraction overflow carries straight into the exponent field and zeroes the fraction for free — the reason a biased exponent costs nothing.
kind: circuit
source: "ASA §11.1.1–11.1.3, pp. 335-340"
status: seed
spade: simulated
tags: [digital, floating-point-operators, rounding, adder, ieee754]
aliases:
  - Rounding Adder
  - FP Rounding Adder
  - Rounding Incrementer
---

# Floating-Point Rounding Adder

The last block of every floating-point operator: one incrementer laid across the
concatenation of the exponent field and the fraction field, so that a fraction
overflow becomes an ordinary carry into the exponent instead of a separate
detector, incrementer and multiplexer.

```tikz title="Rounding adder: one incrementer across the concatenated exponent and fraction, with the LSB discarded on the way out"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- input bus: the concatenation, drawn as three fields of one vector
\draw[thick] (0,2.2) rectangle (4.2,3.0);
\draw[thick] (4.2,2.2) rectangle (8.4,3.0);
\draw[thick] (8.4,2.2) rectangle (9.4,3.0);
\node at (2.1,2.6) {$E$\;:\;$w_E{+}2$};
\node at (6.3,2.6) {$F$\;:\;$w_F$};
\node at (8.9,2.6) {$R$};
\draw[<-] (2.1,3.0) -- (2.1,3.8);
\node[anchor=south] at (2.1,3.85) {\scriptsize exponent update, $E_X{+}1{-}\lambda$};
\draw[<-] (6.8,3.0) -- (6.8,3.8);
\node[anchor=south] at (6.8,3.85) {\scriptsize LZC $+$ normalizer, $F_N$\;:\;$w_F{+}1$};
\node[anchor=west] at (9.7,2.6) {\scriptsize round bit, weight $2^{-w_F-1}$};

% ---- the incrementer
\draw[->] (2.1,2.2) -- (2.1,1.5);
\draw[->] (6.8,2.2) -- (6.8,1.5);
\draw[dotted] (4.2,2.2) -- (4.2,1.5);
\draw[->,very thick] (4.2,1.85) -- (3.0,1.85) node[left]{\scriptsize carry};
\draw[thick] (0,0.7) rectangle (9.4,1.5);
\node at (4.2,1.1) {$+\,1$\quad ripple-carry incrementer, $w_E{+}w_F{+}3$ bits};
\draw[<-] (9.4,1.1) -- (10.4,1.1) node[right]{$1$};

% ---- output bus
\draw[->] (2.1,0.7) -- (2.1,0.1);
\draw[->] (6.8,0.7) -- (6.8,0.1);
\draw[thick] (0,-0.7) rectangle (4.2,0.1);
\draw[thick] (4.2,-0.7) rectangle (8.4,0.1);
\draw[dashed] (8.4,-0.7) rectangle (9.4,0.1);
\node at (2.1,-0.3) {$E'$\;:\;$w_E{+}2$};
\node at (6.3,-0.3) {$F'$\;:\;$w_F$};
\draw (8.4,-0.7) -- (9.4,0.1);
\draw (8.4,0.1) -- (9.4,-0.7);
\node[anchor=west] at (9.7,-0.3) {\scriptsize discarded LSB};
\draw[->] (2.1,-0.7) -- (2.1,-1.3) node[below]{\scriptsize to pack};
\draw[->] (6.3,-0.7) -- (6.3,-1.3) node[below]{\scriptsize to pack};

\node[anchor=north,align=center,font=\scriptsize] at (5.2,-2.0)
  {$F{=}1\dots1$ and $R{=}1$ makes the carry cross the field boundary:\\
   $F'{=}0\dots0$ and $E'{=}E{+}1$, at no extra hardware cost};
\end{circuitikz}
\end{document}
```

*own construction; it expands the "rounding adder" block of Fig. 11.5, p. 337, following the description on p. 338*

**Fix what arrives and what has to leave.** The normalizer hands over a
significand whose leading $1$ is at position $0$ and implicit, so what travels on
the wire is the fraction $F_N$ on $w_F+1$ bits: the $w_F$ bits the output format
keeps, plus **one extra bit at position $-w_F-1$**, the round bit $R$. In
parallel the exponent datapath hands over the updated biased exponent on $w_E+2$
bits — the $w_E$ stored bits plus one overflow bit and one sign bit, so the pack
block can tell an overflow apart from an underflow (p. 338). Round to nearest,
ties away is by definition "add $2^{-w_F-1}$ to the significand, then truncate to
$w_F$ fraction bits" ([[Rounding]]), which on this wire is *add 1 at the LSB of
$F_N$ and drop that LSB.*

**The interesting case is the one that overflows the fraction.** Take
$F_N = 1\dots1$ with $R=1$: the significand $1.11\dots1$ rounded up is
$10.00\dots0 = 2 \times 1.00\dots0$, so the correct answer needs the fraction
reset to all zeros **and** the exponent incremented — the book's example is
$1.1111110\times10^0 \to 1.000\times10^1$ (p. 335). Written as a block diagram
that reads as four pieces of hardware: an incrementer on the fraction, an
all-ones detector, a second incrementer on the exponent, and a multiplexer to
select it. It is none of those.

**Concatenation turns the exponent increment into the fraction's carry-out.**
Place the $(w_E+2)$-bit exponent immediately above the $(w_F+1)$-bit fraction in
a single $(w_E+w_F+3)$-bit integer,

$$C \;=\; E\cdot 2^{\,w_F+1} \;+\; F_N$$

By the positional weighting of binary, a carry leaving the top of the fraction
field has weight $2^{\,w_F+1}$ inside $C$ — which is exactly the weight of the
LSB of the exponent field. So the carry chain of one $(w_E+w_F+3)$-bit
incrementer, running from the round bit upward, performs both updates. Write
$F_N = 2a + R$ with $a$ the $w_F$ kept fraction bits and $R\in\{0,1\}$ the round
bit; then, by Euclidean division by $2$ and the fact that $R+1 \le 2$,

$$\left\lfloor \frac{C+1}{2} \right\rfloor
\;=\; E\cdot2^{\,w_F} \;+\; a \;+\; \left\lfloor \frac{R+1}{2} \right\rfloor
\;=\; \big(E \,\Vert\, a\big) \;+\; R$$

The final $\gg 1$ is the "discard the LSB" of the specification, and it is a wire
renaming, not a shifter. What the identity says is that the whole block is a
*single integer addition of the round bit to the packed unrounded result* — and
an integer addition propagates a carry across a field boundary without being told
the boundary is there.

**A biased exponent therefore costs nothing.** The field holds $E = e + E_0$ for
a constant bias $E_0$, and incrementing the true exponent $e$ by one increments
$E$ by one, because a constant offset commutes with $+1$. The carry lands in a
biased field and still means the right thing. This is the last remark of Sect.
11.1.2 (p. 338): the bias affects neither the exponent difference — where it
cancels in $E_X - E_Y$ — nor the exponent update, nor the rounding adder. See
[[Floating-Point Formats]] for the encoding this leans on.

> [!important] Subnormals ride the same wire
> The IEEE encoding sets the implicit leading significand bit to $1$ exactly when
> the exponent field is non-zero. So the largest subnormal is $0.11\dots1 \times
> 2^{e_\mathrm{min}}$ stored as *(exponent field $0$, fraction all ones)*, and
> rounding it up must yield the smallest normal $1.00\dots0 \times
> 2^{e_\mathrm{min}}$, stored as *(exponent field $1$, fraction zero)*. That is
> the identical carry across the identical boundary. The book's phrasing on p.
> 340 is that "subnormals need no special management in the rounding adder,
> thanks to the clever encoding of Table 2.1" (p. 48) — every other block in the
> operator pays for subnormal support; this one does not, because the encoding
> was chosen to make the field boundary arithmetically continuous.

**Cost is an incrementer, not an adder.** One operand is the constant $1$, so
every bit position degenerates from a full adder to a half adder: $w_E+w_F+3$ XOR
gates and a carry chain of AND gates. On ASIC the chain is normally rebuilt as a
prefix network to get $\log$ depth, which is why the book counts the rounding
adder as one of the five $\log_2 w_F$-depth "slow blocks" of the baseline adder
(p. 340). On FPGA the honest cost is different: the chain maps to the hard carry
logic, one bit per LUT position, and a 33-bit incrementer for binary32 is a
single carry chain — the same primitive the significand adder used, and cheaper
than the prefix tree that block count assumes ([[RCA, Ripple-Carry Adder]],
[[FPGAs]]).

**The same job appears in two shapes across the chapter.** The divider reuses
this one verbatim: it concatenates $F_Q$ with $E_Q$ and adds the bit of $F_Q$ at
$-w_F-1$, "carry propagating into the exponent as in the adder" (p. 349). The
multiplier does *not* (Fig. 11.7, p. 344): its rounding adder runs on the
fraction alone and exports a carry-out $c_\mathrm{out}$ that drives a multiplexer
between two exponents, $E_X+E_Y-E_0$ and $E_X+E_Y-E_0+1$, both computed in
parallel. That is not a worse design — the multiplier already needs the
incremented exponent for the product-overflow case $P\in[2,4)$, and the two
situations are provably exclusive, so the mux is free where the concatenation
would not be. **Concatenate when the exponent has no second precomputed value
lying around; mux when it does.**

$$\boxed{\ \Big\lfloor \tfrac{1}{2}\big( (E \,\Vert\, F_N) + 1 \big) \Big\rfloor
\;=\; \big(E \,\Vert\, a\big) + R, \qquad F_N = 2a + R\ }$$

**Where it stops working.**

- **The bare $+1$ is ties-away, not ties-to-even.** Detecting a tie needs "round
  bit $=1$ **and** sticky $=0$", so the LSB fix costs a handful of gates here but
  drags in a full [[Sticky Bit Generator]] — the OR of every bit shifted right of
  the round bit. The book is explicit that the gates in the rounding adder are
  not the expense; the sticky is (p. 339).
- **Directed rounding is not a constant injection at all.** Round-toward-$+\infty$
  and friends make the injected value depend on the result sign and on the
  sticky, so the constant $1$ becomes a computed bit. See [[Rounding]].
- **The carry can leave the exponent field.** Nothing in the block stops it: the
  overflow and sign bits above $w_E$ exist precisely to catch it, and turning
  that into $\pm\infty$ is [[Floating-Point Exception Handling]]'s job, not this
  block's. An implementation that keeps only $w_E$ exponent bits wraps silently.
- **The round bit must belong to the *normalized* significand.** In the 1-bit
  right-normalization case (Fig. 11.1b) the sticky has to be updated after the
  shift, or the round bit fed here is stale (p. 339).
- **It never leaves the critical path by being made faster.** The dual-path adder
  moves the shifters off the critical path but keeps a single rounding adder
  after the path multiplexer (Fig. 11.6, p. 341). The only ways out are to fuse
  it into a compression tree ([[Injection Rounding]]) or to pre-load the rounding
  constant somewhere the datapath was going to add anyway.

> [!warning] No area or delay figures in the source
> Chapter 11 reports no synthesis results — no LUT, slice or gate counts, no ns
> delays — for this block or any other. The half-adder-per-bit and single-carry-
> chain claims above follow from the structure, not from a measurement. A real
> number needs your own synthesis run.

**RTL.**

```spade
/// The rounding adder of Fig. 11.5.
///   e : (WE+2)-bit updated biased exponent, sign and overflow bits on top
///   f : (WF+1)-bit normalized fraction, LSB is the round bit
/// Returns the packed (WE+2+WF)-bit result: exponent above, fraction below.
fn round_adder<#uint WE, #uint WF>(
    e: uint<{WE + 2}>,
    f: uint<{WF + 1}>,
) -> uint<{WE + WF + 2}> {
    trunc((e.concat(f) +. 1) >> 1)
}
```

`e.concat(f)` is the input bus of the diagram — for **integers** `concat` puts
its first argument in the high position, the opposite of the array convention, so
this really is exponent-above-fraction. `+. 1` is the incrementer box, and the
wrapping variant is deliberate: it drops the carry out of the *top* of the
exponent field, which in the full operator is absorbed by the two extra exponent
bits before it can escape. `>> 1` is the dashed "discarded LSB" cell and costs no
gates at all — it is a renumbering of wires. The whole thing is a `fn`, so it is
purely combinational; synthesis will not instantiate $w_E{+}w_F{+}3$ full adders
but a half-adder chain, and on FPGA it collapses onto one hard carry chain.

Simulated with `.zettel/sim.sh` at $w_E=8$, $w_F=23$ (binary32 fields: 10-bit
exponent, 24-bit fraction, 33-bit output): **3007 vectors, 0 failures.** Seven
named cases — round bit $0$, round bit $1$ with zero fraction, fraction all ones
with round bit $1$ (the carry-into-exponent case), the subnormal boundary
(exponent field $0$, fraction all ones), the saturated exponent, zero, and the
asymmetric $E=1$ with only the top and bottom fraction bits set — plus 3000
random vectors, all checked against the independent reference $(E \Vert a) + R$
rather than against the implementation's own expression.

**Related notes.**

- [[Floating-Point Adder]] – depends-on: this is its final block; the widths here
  are read straight off Fig. 11.5.
- [[Floating-Point Divider]] – supports: reuses the concatenated form unchanged,
  and needs no tie rule because ties cannot occur in binary FP division.
- [[Floating-Point Multiplier]] – compares: same rounding, but the carry-out
  drives an exponent multiplexer instead of crossing a field boundary.
- [[Injection Rounding]] – extends: deletes this incrementer by folding the
  constant into the multiplier's bit heap.
- [[Sticky Bit Generator]] – supports: what ties-to-even and the directed modes
  need before the injected bit stops being a constant.
- [[Floating-Point Exception Handling]] – depends-on: the consumer of the two
  extra exponent bits this block can overflow into.
- [[RCA, Ripple-Carry Adder]] – depends-on: the incrementer is a ripple-carry
  adder with one operand nailed to a constant.
- [[Rounding]] – depends-on: which mode the constant $1$ actually implements.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 11
  "Basic Floating-Point Operators".
  - Sect. 11.1.1, the rounding step and the concatenation of biased exponent with
    fraction, p. 335; sidebar "Origin of the ties to even rule", p. 336.
  - Sect. 11.1.2, Fig. 11.5 and its datapath widths, p. 337; the rounding-adder
    bullet, the $(w_E{+}2)$-bit exponent update, and the closing remark that a
    biased exponent has no overhead, p. 338.
  - Sect. 11.1.3, ties-to-even as "a handful of gates in the rounding adder",
    p. 339; subnormals needing no management here thanks to the encoding of
    Table 2.1, p. 340.
  - Sect. 11.1.4, Fig. 11.6 — the rounding adder survives the dual-path split,
    p. 341.
  - Sect. 11.2.1, Fig. 11.7 — the multiplier's carry-out-plus-mux variant, p. 344.
  - Sect. 11.3.1, the divider reusing the concatenated form, p. 349.
  - Table 2.1 / Sect. 2.5.1, the format encoding the subnormal carry relies on,
    p. 48.
