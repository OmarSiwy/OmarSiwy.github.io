---
title: Direct Tabulation Exponential
description: "The whole exponential as one ROM addressed by exponent-minus-constant concatenated with the fraction — correctly rounded by construction and one BRAM at BFloat, but the table grows as 2^{w_F} and dies above about 8 fraction bits."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-exponential, rom, table, bfloat]
aliases:
  - Direct Tabulation
  - Directly Tabulated Exponential
  - Direct Tabulation Architecture
---

# Direct Tabulation Exponential

A floating-point exponential built as a single read-only table addressed by the input's own bit fields, which is the only architecture in the chapter that is **correctly rounded** rather than merely faithful — and the only one whose cost doubles with every fraction bit.

```tikz title="Direct tabulation exponential: unpack, constant subtraction on the exponent field, one table, special-case handling"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- input
  \draw[->] (0,9.3) -- (0,8.4);
  \node[anchor=west] at (0.1,8.95) {$X$\quad\texttt{float}$(w_E,w_F)$};

  % ---------- unpack
  \draw (-4.6,7.7) rectangle (4.2,8.4);
  \node at (-0.2,8.05) {unpack};

  % ---------- exception bits, straight past everything
  \draw[->] (-4.0,7.7) -- (-4.0,3.3);
  \node[anchor=east] at (-4.05,7.3) {$\mathrm{exn}_X$};

  % ---------- sign: top address bit, and the sign of the flushed results
  \draw (-2.6,7.7) -- (-2.6,5.7);
  \node[anchor=east] at (-2.65,7.3) {$s_X$};
  \node[anchor=east] at (-2.65,6.8) {$1$};
  \draw (-2.6,5.7) -- (-1.4,5.7);
  \draw[->] (-1.4,5.7) -- (-1.4,4.9);
  \draw[->] (-2.6,5.7) -- (-2.6,3.3);

  % ---------- exponent field into the constant subtraction
  \draw[->] (0.6,7.7) -- (0.6,7.0);
  \node[anchor=west] at (0.65,7.35) {$E_X$\quad$w_E$};
  \draw (-0.5,6.3) rectangle (1.7,7.0);
  \node at (0.6,6.65) {$-\,E_0-E_{X_1}$};
  \draw[->] (0.6,6.3) -- (0.6,4.9);
  \node[anchor=west] at (0.65,5.6) {$a$};

  % ---------- fraction: low address bits, verbatim
  \draw (3.4,7.7) -- (3.4,5.7);
  \node[anchor=west] at (3.45,7.3) {$F_X$};
  \node[anchor=west] at (3.45,6.4) {$w_F$};
  \draw (3.4,5.7) -- (2.6,5.7);
  \draw[->] (2.6,5.7) -- (2.6,4.9);

  % ---------- the table
  \draw (-2.2,4.2) rectangle (3.4,4.9);
  \node at (0.6,4.55) {table};
  \node[anchor=west] at (3.5,4.55) {$2^{\,1+a+w_F}$ words $\times\ (w_E+w_F)$ bits};
  \draw[->] (0.6,4.2) -- (0.6,3.3);
  \node[anchor=west] at (0.65,3.75) {$w_E+w_F$\quad(the result sign is a constant $0$)};

  % ---------- special-case handling
  \draw (-4.6,2.6) rectangle (4.2,3.3);
  \node at (-0.2,2.95) {special case handling};
  \draw[->] (-0.2,2.6) -- (-0.2,1.7);
  \node[anchor=west] at (-0.15,2.15) {$R$\quad\texttt{float}$(w_E,w_F)$};

  \node[anchor=west] at (-4.6,1.0) {$a=\lceil\log_2(w_E+w_F+1)\rceil$};
\end{circuitikz}
\end{document}
```

*After Fig. 22.3, p. 645.*

**Measure the useful domain in binades, not in values.** Outside $[X_{\min},X_{\max}]$ the exponential flushes to $+0$ or $+\infty$, and inside $[-X_1,X_1]$ with $X_1=2^{-w_F-2}$ it returns exactly $1.0$, so only the two intervals $[X_{\min},-X_1]$ and $[X_1,X_{\max}]$ need computing at all (p. 644, and see [[Exponential Special-Case Unit]]). The decisive observation is that those intervals are narrow *in the exponent*: the exponent of $X_1$ is $E_{X_1}=-w_F-2$, and the exponent of both $X_{\min}$ and $X_{\max}$ is $w_E-2$, because $X_{\min}$ and $X_{\max}$ are logarithms of format extremes and a logarithm collapses the format's exponent range into a handful of integer bits. Counting inclusively, the exponent amplitude is

$$(w_E-2)-(-w_F-2)+1 = w_E+w_F+1$$

binades, in **both** intervals. For IEEEfloat(8,23) that is 32 binades out of the 254 the format can represent — the exponential's finite domain uses about an eighth of the exponent axis, and everything outside is a constant.

**Address the table with the format's own fields, unmodified.** Within one binade the representable values are $1.F_X$ scaled by a power of two, so if the address's high part selects the binade and its low part is $F_X$ verbatim, consecutive addresses enumerate consecutive representable magnitudes in increasing order. Selecting the binade means mapping the biased exponent field $E_X$ down to $[0,\,w_E+w_F]$, which is the single subtraction of a compile-time constant

$$A = E_X - E_0 - E_{X_1}, \qquad E_0=\text{the format's bias},\ E_{X_1}=-w_F-2$$

on an $a=\lceil\log_2(w_E+w_F+1)\rceil$-bit result — a $w_E$-bit adder against a constant, nothing more. Concatenating gives a $(1+a+w_F)$-bit address

$$\mathrm{addr} = s_X \,\|\, A \,\|\, F_X$$

where folding $s_X$ in as the top bit is what merges the two tables the interval structure asked for into one (p. 645). No shifter, no normaliser, no multiplier: the [[Floating-Point Formats|floating-point format]] is already a lookup key, and this architecture is the observation that it is.

**The word is one bit narrower than the output format.** $e^X>0$ for every $X$, so the result's sign bit is the constant $0$ and there is no reason to store it — the table holds only $E_R$ and $F_R$, i.e. $w_E+w_F$ bits per word. That is the whole of the "computing just right" content of this design, and for BFloat it is the difference between 16-bit and 15-bit words.

**The size is exponential in $w_F$ and only logarithmic in $w_E$, which is exactly the wrong way round.** Each of the two interval tables holds $2^{a+w_F}$ words, and the merged table twice that. Widening the exponent by a bit adds at most one address bit through the ceiling; widening the fraction by a bit doubles the table. For BFloat $=$ IEEEfloat(8,7): $a=\lceil\log_2 16\rceil=4$, so $2^{4+7}=2048$ words per interval, $2^{12}=4096$ merged, $\times15$ bits $=61440$ bits (p. 645). That is one small [[Block Memory|block RAM]] array — strictly, two 36 Kbit primitives on a Xilinx-class fabric, since 61440 bits does not fit in one — with a 4-bit subtractor beside it and nothing else. For IEEEfloat(8,23) the same formula gives $a=\lceil\log_2 32\rceil=5$ and $2^{5+23}=2^{28}$ words per interval, $2^{29}$ merged, at 31 bits each: about 16 Gbit. The architecture does not degrade with precision, it evaporates.

> [!important] Correct rounding is free here and expensive everywhere else
> Every other exponential architecture in the chapter computes, so it accumulates approximation error and settles for **faithful** rounding ($|\delta_R|<1$ ulp, see [[Error Accuracy]]). This one does not compute: each word is the correctly rounded $e^X$ for its one input $X$, evaluated offline in arbitrary precision. There is no datapath to analyse, no guard bits, no [[Rounding|rounding]] mode to implement — the rounding happened at table-generation time. The last-bit guarantee that costs unbounded intermediate precision in the range-reduced operator costs zero gates here, and that is the reason the book keeps this architecture on the table for small formats rather than treating it as a toy.

**The special-case comparators may be coarse, and the table absorbs the boundary.** Around the memory sits only the overflow/underflow logic: $\mathrm{addr}$'s high field underflows the table when $E_X < E_0+E_{X_1}$ and overflows it when $E_X > E_0+w_E-2$, and these are comparisons against constants on the $w_E$-bit exponent field alone — no comparison against the irrational $X_{\min}$, $X_{\max}$ is ever built (p. 644). The low comparison is allowed to be conservative in one direction for free: if it lets a value with $|X|$ slightly below $X_1$ reach the table, the table's own entry for that value is the correctly rounded $e^X$, which *is* $1.0$ there by the definition of $X_1$. The comparator only has to be tight enough that the address stays in range; the arithmetic answer is unaffected either way.

**Splitting the input buys one more format and then stops.** The obvious rescue for larger $w_F$ is $X = X_H + X_L$ — $X_H$ carrying the sign, exponent and upper fraction bits, $X_L$ the remaining ones — so that $e^X = e^{X_H}\cdot e^{X_L}$ with both factors tabulated, or $e^{X_L}$ expanded as a Taylor series since $X_L<1$ (p. 646). The identity is the same $e^{x+y}=e^xe^y$ homomorphism the whole chapter runs on, but reconstruction is now a **multiplication**, at least $w_F\times w_F$ plus guard bits, and more chunks means more multipliers. Correct rounding is lost the moment a product is rounded. The book stops the line here: additive range reduction into $2^E\cdot e^Y$ ([[FPExp Operator]]) reconstructs by concatenation instead of by multiplication, which is strictly cheaper and scales, so there is no format where the split table is the best answer.

**On FPGA the crossover sits later than the gate count suggests.** The table is a hard BRAM the design was probably not using, its latency is one registered read at full $f_{max}$, and a true dual-port BRAM yields two exponentials per cycle for the same area — none of which shows up in a LUT count. On ASIC the same 60 Kbit is a real ROM macro or, worse, a synthesised mux tree over [[Lookup-Tables|LUT]]-equivalent logic that grows linearly in entries, so the range-reduced datapath wins several fraction bits earlier there. The book's own comparison (p. 655) notes that tabulating $e^Y$ *after* range reduction needs only $2^{10}\times11$ bits at BFloat — four times smaller — yet leaves it "unclear" whether that wins, precisely because the architectural overhead around it costs more than the memory it saves and it gives up correct rounding ([[Tabulated e^Y]]).

$$\boxed{\ N_{\text{words}} = 2^{\,1+\lceil\log_2(w_E+w_F+1)\rceil+w_F},\qquad w_{\text{word}} = w_E+w_F\ }$$

**When it breaks.**

- Above $w_F\approx 8$ the table stops fitting on-chip: each fraction bit doubles it, and binary16 ($w_F=10$) already asks for $2^{15}$ words, single for $2^{28}$. This is the whole of the architecture's applicability condition.
- Subnormal inputs are not a special path — they all satisfy $|X|<X_1$ and return $1.0$ — but subnormal *outputs* are, because they need $R$'s exponent field below the format's minimum; those words simply hold the encoded subnormal, which is legal only because the table is generated offline. Nfloat has no subnormals and the question disappears.
- The address is only defined on $[E_0+E_{X_1},\,E_0+w_E-2]$; outside it the high field wraps and the table returns garbage. Correctness depends entirely on the special-case unit muxing that garbage away, so the two blocks are not independently verifiable.
- Two formats with the same $(w_E,w_F)$ but different bias — IEEEfloat versus Nfloat — need different table *contents* and different $E_0$, even though the hardware is bit-identical. The table is not portable; the circuit is.
- A correctly rounded table is not free to *build*: generating $2^{12}$ arbitrary-precision exponentials is a build-time cost, and for a parameterised generator it recurs at every instantiation.

**RTL (Spade).** The table itself is a memory primitive initialised from a generated file, so the synthesisable *logic* of this architecture is precisely what the entity below contains — address formation and range classification. That is the point worth checking: a swapped field or a reversed concatenation compiles perfectly and silently returns some other number's exponential.

```spade
/// Address generation + special-case classification around a directly
/// tabulated exponential, for BFloat = IEEEfloat(8,7).
/// Bias E_0 = 127, E_{X_1} = -w_F - 2 = -9, so the high address field is
/// A = E_X - E_0 - E_{X_1} = E_X - 118, four bits wide.
entity bfloat_exp_addr(sx: bool, ex: uint<8>, fx: uint<7>) -> (uint<12>, bool, bool) {
    let field: uint<4> = trunc(ex -. 118);
    let addr: uint<12> = sx.as_uint().concat(field).concat(fx);
    let small = ex < 118;
    let big   = ex > 133;
    (addr, small, big)
}
```

`sx`, `ex`, `fx` are the three taps leaving the `unpack` box; `field` is the $-E_0-E_{X_1}$ box, written as a wrapping subtract because its result is only meaningful when `small` and `big` are both false; `addr` is the wire into the table, high part first, so `sx` lands in bit 11 and $F_X$ occupies bits 6–0. `small` and `big` are the coarse comparators feeding `special case handling`: `small` forces $R=1.0$, `big` forces $+\infty$ when `sx` is false and $+0$ when it is true. Everything here is combinational; synthesis will absorb the subtract and both comparators into the BRAM's input register stage, so the drawn box costs no cycle of its own.

Simulated with `.zettel/sim.sh`: 12 named vectors (including the asymmetric $F_X=1$ versus $F_X=64$ pair and both signs, which a reversed concatenation fails immediately), an exhaustive walk of all 2048 in-range $(E_X,F_X)$ pairs checking that `addr` increments by exactly one as $|X|$ increases — the property the whole addressing scheme exists to provide — and 3000 random vectors against a behavioural reference. 5060 vectors, zero failures.

**Related Notes.**

- [[Choosing an Exponential Architecture]] – compares: places the $w_F\approx8$ crossover where this stops being the answer against every sibling.
- [[Split-Table Exponential]] – extends: splits $X=X_H+X_L$ so two smaller tables reach a wider format, paying a $w_F\times w_F$ multiplier and correct rounding for it.
- [[FPExp Operator]] – counter-example: reconstructs by concatenation instead of by table, so its cost grows linearly where this one grows exponentially.
- [[Tabulated e^Y]] – compares: the same "just tabulate it" move applied after range reduction, four times smaller at BFloat but only faithful.
- [[Exponential Special-Case Unit]] – supports: the `special case handling` box drawn here, and the reason the comparators may be coarse.
- [[Block Memory]] – depends-on: the whole architecture is a bet that the table lands in an otherwise-idle BRAM.
- [[Rounding]] – supports: correct rounding is achieved by generating the table rounded, not by any hardware.
- [[Floating-Point Formats]] – depends-on: the address fields are the format's fields, so the bias $E_0$ is baked into the constant subtraction.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22 "Floating-Point Exponential":

- §22.2.3 Input filtering — pp. 643–644 (Table 22.1 for $X_{\min}$, $X_{\max}$, $X_1$; Fig. 22.2; the coarse exponent-only comparators)
- §22.2.4 A first architecture: direct tabulation — pp. 645–646 (Fig. 22.3; the exponent amplitude $w_E+w_F+1$; the BFloat instance; the $X=X_H+X_L$ split and why it is dropped)
- §22.5 Fixed-point computation of $e^Y$ — p. 655 (the $2^{10}\times11$ tabulated-$e^Y$ comparison, and the remark that it is unclear whether it beats direct tabulation, "all the more as the latter provides a correctly rounded result")

> [!warning] Page-offset correction
> The brief states PDF page $=$ printed page $+22$. In Chapter 22 the offset is
> **$+10$**: PDF 655 renders printed 645, PDF 667 renders printed 657 (checked
> with `pdftotext` on four pages). Every page number cited above is the printed
> one, read at PDF page $-10$.
