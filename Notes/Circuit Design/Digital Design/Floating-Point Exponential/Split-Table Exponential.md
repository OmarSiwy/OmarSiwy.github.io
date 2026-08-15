---
title: "Split-Table Exponential"
description: "Scales direct tabulation by splitting X = X_H + X_L and multiplying two tabulated factors — legal and simple, but reconstruction costs a full w_F x w_F multiplier per extra chunk, which is why the book abandons it for range reduction."
kind: circuit
source: "ASA §22.2.4, pp. 645-646"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, table, exponential]
aliases:
  - Split Table Exponential
  - Chunked-Table Exponential
---

# Split-Table Exponential

Direct tabulation with the table address cut into chunks: each chunk's exponential is read from its own table and the results are multiplied back together, trading one table exponential in $w_F$ for several small tables plus a multiplier per join.

```tikz title="Split-table exponential: two tables joined by one significand multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- input
  \draw[->] (0,10.6) -- (0,10.0);
  \node[anchor=west] at (0.1,10.35) {$X$\quad\texttt{float}$(w_E,w_F)$};
  \draw (-4.6,9.3) rectangle (4.6,10.0);
  \node at (0,9.65) {unpack};

  % ---------- taps out of unpack
  \draw (-4.0,9.3) -- (-4.0,1.0);
  \node[anchor=east] at (-4.05,8.6) {$\mathit{exn}_X$};
  \draw[->] (-4.0,1.0) -- (-3.4,1.0);

  \draw (-2.4,9.3) -- (-2.4,8.55);
  \node[anchor=east] at (-2.45,8.9) {$s_X$};
  \draw (-0.6,9.3) -- (-0.6,8.55);
  \node[anchor=east] at (-0.65,8.75) {$E_X$\ \ $w_E$};
  \draw (2.2,9.3) -- (2.2,8.9);
  \node[anchor=west] at (2.3,8.62) {$F_X$\ \ $w_F$};

  % ---------- E_X also feeds the low block
  \draw (-0.6,9.15) -- (5.9,9.15) -- (5.9,6.7);
  \draw[->] (5.9,6.7) -- (5.9,6.6);

  % ---------- fraction split
  \draw (2.2,8.9) -- (1.3,8.9) -- (1.3,8.55);
  \node[anchor=east] at (1.25,8.72) {$F_H$\ \ $w_H$};
  \draw (2.2,8.9) -- (4.3,8.9) -- (4.3,6.7);
  \draw[->] (4.3,6.7) -- (4.3,6.6);
  \node[anchor=west] at (4.35,8.0) {$F_L$\ \ $w_L$};

  % ---------- exponent offset
  \draw (-1.6,7.85) rectangle (0.4,8.55);
  \node at (-0.6,8.2) {$-E_0-E_{X_1}$};
  \draw[->] (-0.6,7.85) -- (-0.6,7.2);
  \draw (-2.4,8.55) -- (-2.4,7.55) -- (-2.1,7.55);
  \draw[->] (-2.1,7.55) -- (-2.1,7.2);
  \draw (1.3,8.55) -- (1.3,7.55) -- (0.9,7.55);
  \draw[->] (0.9,7.55) -- (0.9,7.2);

  % ---------- high table
  \draw (-3.0,6.3) rectangle (1.9,7.2);
  \node at (-0.55,6.95) {table $e^{X_H}$};
  \node at (-0.55,6.55) {$2^{\,a+w_H+1}\times(w_E{+}w_F)$};

  % ---------- low block
  \draw (2.9,5.6) rectangle (7.0,6.6);
  \node at (4.95,6.3) {$e^{X_L}$: small table, or};
  \node at (4.95,5.9) {$1+X_L+X_L^2/2$ (Taylor)};

  % ---------- table outputs
  \draw (-2.3,6.3) -- (-2.3,4.0);
  \node[anchor=east] at (-2.35,5.3) {$E_H$\ \ $w_E$};
  \draw (0.4,6.3) -- (0.4,4.9);
  \node[anchor=west] at (0.5,5.3) {$M_H$\ \ \texttt{ufix}$(0,-w_F-g)$};
  \draw (4.95,5.6) -- (4.95,4.9);
  \node[anchor=west] at (5.05,5.3) {$M_L\in[1,2)$};

  % ---------- multiplier
  \draw (0.0,4.2) -- (5.3,4.2) -- (4.6,3.4) -- (0.7,3.4) -- cycle;
  \node at (2.65,3.8) {$\times$\quad $(w_F{+}g)\times(w_F{+}g)$};
  \draw (0.4,4.9) -- (0.4,4.2);
  \draw (4.95,4.9) -- (4.95,4.2);
  \draw[->] (2.65,3.4) -- (2.65,2.7);
  \node[anchor=west] at (2.75,3.05) {$M_{\mathrm{full}}\in[1,4)$};

  % ---------- normalise / round / pack
  \draw (-3.0,1.9) rectangle (5.6,2.7);
  \node at (1.3,2.3) {normalise (1 bit) -- round -- pack};
  \draw (-2.3,4.0) -- (-2.3,2.7);
  \draw[->] (1.3,1.9) -- (1.3,1.35);

  % ---------- special cases
  \draw (-3.4,0.6) rectangle (5.6,1.35);
  \node at (1.1,0.975) {special case handling};
  \draw[->] (1.1,0.6) -- (1.1,0.0);
  \node[anchor=west] at (1.2,0.3) {$R$\quad\texttt{float}$(w_E,w_F)$};
\end{circuitikz}
\end{document}
```

*Own construction, extending Fig. 22.3, p. 645, with the two-chunk decomposition of pp. 645-646. $a=\lceil\log_2(w_E+w_F+1)\rceil$ is the exponent-amplitude address width inherited from [[Direct Tabulation Exponential]]; $g$ is the guard-bit count.*

**The split is a bit partition, so it is exact.** Write the significand as the concatenation $F_X = F_H \Vert F_L$ with $|F_H| = w_H$, $|F_L| = w_L$, $w_H + w_L = w_F$. Then $X = X_H + X_L$, where $X_H$ keeps the sign, the whole $w_E$-bit exponent field and the top $w_H$ fraction bits, and $X_L$ carries the remaining $w_L$ bits at their original weights. Nothing is rounded here: the two pieces are disjoint bit-fields of one aligned number, so the identity holds in the reals and not merely to within an ulp. Every error in this architecture is therefore attributable to a table or to the multiplier, never to the decomposition — unlike a *multiplicative* split, which would need a division to define its second factor and would round doing it.

**The homomorphism $e^{x+y}=e^x e^y$ converts the additive partition into a product.** Applied to the exact split it gives

$$e^X = e^{X_H + X_L} = e^{X_H}\cdot e^{X_L}$$

and both factors depend on a strictly narrower argument than $X$, so both tabulate in a smaller table. This is the same group homomorphism from $(\mathbb{R},+)$ to $(\mathbb{R}^{+*},\times)$ that makes additive range reduction possible at all — minus the one structural gift range reduction gets, namely that its second factor is a power of two and its join is a concatenation into the exponent field. Here the join is a genuine multiplication.

**The two factors live in different formats, and that asymmetry is the entire cost model.** $e^{X_H}$ spans the whole output range, because $X_H$ still carries the exponent field; it must be stored as a full float of $w_E + w_F$ bits per word, the sign being a known constant (see [[Number Formats]]). $e^{X_L}$ is a different animal. With $0 \le X_L < 1$ we have $e^{X_L} \in [1, e)$, and with the split point at least one bit below the binary point, $e^{X_L}\in[1,2)$ — a bare significand with a fixed MSB, $w_F + g$ bits wide, carrying no exponent at all. Reconstruction is consequently **not** a floating-point multiply: one significand $\times$ significand array, $E_H$ passing through untouched, and a single-bit normalisation that fires only when the product lands in $[2,4)$.

> [!important]
> One multiplier, not one floating-point multiplier. The second factor's exponent is structurally zero, so a join costs a $(w_F{+}g)\times(w_F{+}g)$ array plus a 2:1 mux — which is what makes this architecture tempting, and equally why every further chunk costs exactly that much again.

**The high table shrinks by $2^{w_L}$; nothing else does.** [[Direct Tabulation Exponential]] needs $2^{a + w_F + 1}$ words, with $a=\lceil\log_2(w_E+w_F+1)\rceil$ coming from the exponent amplitude $w_E+w_F+1$ and the $+1$ from folding the sign bit into the address. Removing $w_L$ fraction bits from that address leaves $2^{a + w_H + 1}$ words — smaller by $2^{w_L}$, since it is the address width and not the entry width that fell. For BFloat $=$ IEEEfloat$(8,7)$ the book's direct table has $a=\lceil\log_2 16\rceil = 4$, hence $2^{4+7+1}=2^{12}$ words of $15$ bits, $60$ Kbit (p. 645). Splitting $w_F=7$ into $w_H=4$, $w_L=3$ leaves $2^{4+4+1}=2^{9}$ words of $15$ bits, $7.5$ Kbit, plus an $8$-word table or a Taylor evaluator for the low factor, plus one $10\times10$ multiplier once $g=3$ guard bits are carried. Eight times less memory, bought with one multiplier.

**Taylor beats a table for the low factor as soon as $X_L$ is small.** Since $0 \le X_L < 2^{-k}$ for a split $k$ bits below the binary point, the series $e^{X_L} = 1 + X_L + X_L^2/2 + \cdots$ truncated after the quadratic term errs by less than $2^{-3k}$ to leading order, and its first three coefficients $1$, $1$, $2^{-1}$ are all powers of two — so a second-order evaluation is a squarer, a hardwired right shift and two additions, with no constant multiplier anywhere. That is usually smaller than the ROM it replaces. [[First-Order e^Y Evaluator]] and [[Higher-Order e^Y Evaluator]] develop this properly for the post-range-reduction datapath, where the argument is smaller still.

**Correct rounding — the one thing direct tabulation had for free — does not survive.** A single ROM can store the correctly rounded $e^X$ for every representable input, so that operator is correctly rounded by construction. The split version composes at least four roundings: the $e^{X_H}$ entry, the $e^{X_L}$ entry or its Taylor truncation, the multiplier's product truncation, and the final round-by-truncation down to $w_F$ bits. Each enters the same budget accounted in [[Error Accuracy]], and the best the architecture can then claim is faithful rounding, needing $g$ guard bits carried through the multiplier to claim even that. Trading correct rounding for memory is a genuine regression in the operator's contract, not a wash.

**More chunks give exponential saving at linear cost, so $c$ stops at two or three.** With $c$ chunks, $X = \sum_j X_j$ and $e^X = \prod_j e^{X_j}$ needs $c$ tables and $c-1$ multipliers. Each extra cut divides the largest remaining table by $2^{w_j}$, an exponential gain — but adds one full-width $(w_F{+}g)\times(w_F{+}g)$ multiplier and one more rounding, both constant in size. The marginal saving collapses while the marginal cost does not, and the guard-bit count has to grow to absorb the extra roundings, which retroactively widens every multiplier already placed. The book states the trade in one sentence and does not develop it (p. 646).

**FPGA and ASIC disagree about whether the trade is worth making.** On FPGA the two resources are physically distinct — tables land in [[Block Memory]], multipliers in DSP blocks — so the split spends a resource you may have spare to buy back one you may not, and it runs straight into hard granularity: a table that already fits one BRAM gains nothing from becoming eight times smaller, while the DSP it costs is real. At BFloat, therefore, the split is a pure loss. On ASIC both sides are area on one die, ROM area per bit is high and an array multiplier comparatively cheap, so the crossover arrives at a smaller $w_F$. Neither case rescues the approach: by the $w_F$ at which the direct table has genuinely outgrown the memory budget, the additive range reduction of [[FPExp Operator]] is available and cheaper still, which is exactly why the book records this option and immediately drops it.

$$\boxed{\ e^X=e^{X_H}\cdot e^{X_L},\qquad
\underbrace{2^{a+w_H+1}\ \text{words}}_{w_E+w_F\ \text{bits}}\ +\ \underbrace{2^{w_L}\ \text{words}}_{w_F+g\ \text{bits}}\ +\ \text{one }(w_F{+}g)^2\text{ multiplier},\quad a=\big\lceil\log_2(w_E+w_F+1)\big\rceil\ }$$

**When it breaks.**

- $e^{X_L}\in[1,2)$ holds only when the split point sits at or below weight $2^0$ of the *aligned* value. For an input with a large $E_X$ the low fraction bits still carry weight $\ge 1$, so the low chunk is not small, its Taylor series does not converge quickly, and its table needs $E_X$ in its address too — which is why the diagram routes $E_X$ into the low block.
- Correct rounding is lost. If the operator's contract is correct rounding, the architecture is disqualified regardless of area.
- Below one BRAM's worth of table there is nothing to save, so at BFloat-class precisions the split is strictly worse than [[Direct Tabulation Exponential]].
- The surviving table is still exponential in $w_H$, so keeping it inside the memory budget at large $w_F$ forces $w_H$ down, which forces $c$ up — the losing direction. Additive range reduction, whose table depends on $w_F$ only through the inner $e^Y$ evaluator, takes over.
- The chunk lookups are mutually independent, so all $c$ tables are read in parallel and latency is one memory access plus $\lceil\log_2 c\rceil$ multiplier depths. The architecture is never latency-bound; it is area-bound, and the area argument is the one it loses.

> [!warning] The source asserts $X_L < 1$ without stating the condition
> pp. 645-646 first say "$X = X_H + X_L$ where both $X_H$ and $X_L$ are floating-point numbers", then "actually, $X_L$ is a fixed-point number smaller than 1". Both are true together only when the split point lies at or below the binary point of the aligned significand. The general case, where the low chunk still owns an exponent, is not developed in the book, and the corresponding table-addressing cost is not given.

**RTL.** The tables are ROMs and carry no arithmetic; what this note has to get right is the join. Below is the reconstruction stage for $w_F + g = 8$.

```spade
/// Reconstruction stage of a split-table exponential, w_F + g = 8.
/// mh, ml are the stored fraction fields of the two table outputs; each read
/// factor is the significand 1.m in [1,2).  eh is the exponent field that came
/// out of the e^{X_H} table.  Result: the ufix(0,-8) significand of the
/// product, rounded by truncation, plus the exponent corrected by the one-bit
/// normalisation.
entity exp_recon8(mh: uint<8>, ml: uint<8>, eh: uint<8>) -> (uint<8>, uint<8>) {
    let sh: uint<9> = true.as_uint().concat(mh);
    let sl: uint<9> = true.as_uint().concat(ml);
    let q: uint<18> = sh * sl;
    let ovf = q.as_bits()[17];
    let norm: uint<18> = if ovf { q >> 1 } else { q };
    let m: uint<8> = norm.as_bits()[8..16].as_uint();
    let e: uint<8> = if ovf { trunc(eh + 1) } else { eh };
    (m, e)
}
```

`mh` and `ml` are the wires drawn as $M_H$ and $M_L$; `eh` is $E_H$ running down the left of the figure, and `sh`/`sl` restore the implicit leading one that the `ufix`$(0,-w_F-g)$ annotation leaves unwritten, so each is $9$ bits for an $8$-bit stored fraction. The $9\times9$ product `q` is the trapezoid: $18$ bits, whose top two encode $M_\mathrm{full}\in[1,4)$, so testing bit $17$ *is* the one-bit normalisation and `q >> 1` is free rewiring rather than a shifter. The slice `[8..16]` is round-by-truncation back to $w_F+g$ bits, and `trunc(eh + 1)` is the exponent increment the normalisation owes. All of it is combinational — the registers belong to the ROMs upstream. Synthesis differs from the drawing in one place: on FPGA the $9\times9$ multiply is a single DSP slice, so the box that dominates the area argument above may not appear in the LUT count at all.

Simulated with `.zettel/sim.sh`: 8 named vectors — including the asymmetric $1.00390625 \times 1.5$, the pair straddling the $[2,4)$ normalisation boundary, and an exponent-field wrap — plus 5000 random vectors checked against a behavioural reference that forms the product in full precision and applies a variable shift. 5008 of 5008 pass.

**Related notes.**

- [[Direct Tabulation Exponential]] – extends: this is that architecture with its table address cut in two, and it inherits the $-E_0-E_{X_1}$ addressing verbatim.
- [[Choosing an Exponential Architecture]] – compares: places the split table against range reduction and the iterative family precision by precision.
- [[FPExp Operator]] – counter-example: the operator the book builds instead, whose reconstruction is a concatenation rather than a multiplier.
- [[Higher-Order e^Y Evaluator]] – extends: the same additive split, applied to the already-reduced $Y$ where the low chunk is genuinely tiny and the join is cheap.
- [[First-Order e^Y Evaluator]] – supports: the cheapest form of the $1 + X_L + \cdots$ evaluator this architecture wants for its low factor.
- [[Iterative Table-Based Exponential]] – compares: the other way to trade tables against multipliers, cumulating to about one full multiplier instead of one per chunk.
- [[Table-Based Function Evaluation]] – depends-on: the general table-splitting machinery of which this is the exponential's special case.
- [[Block Memory]] – depends-on: BRAM depth and word width decide where the table saving stops mattering.
- [[Multipliers]] – depends-on: the $(w_F{+}g)^2$ array is the whole cost of every join.
- [[Error Accuracy]] – supports: the four-rounding budget that costs this architecture its correct rounding.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — §22.2.4 "A First Architecture: Direct Tabulation", pp. 645-646, and Fig. 22.3, p. 645.
- Same, §22.5.1 "Using Large Tables and Square Multipliers", pp. 655-656, for the analogous $Y = A + Z$ split applied after range reduction.
- Same, Table 22.1 and Fig. 22.2, p. 644, for the special-case thresholds the surrounding logic enforces.
