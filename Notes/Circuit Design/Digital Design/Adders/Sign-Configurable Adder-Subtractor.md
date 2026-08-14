---
title: "Sign-Configurable Adder/Subtractor"
description: "Negating both inputs needs a constant +2 and there is only one carry-in, so build it on the ternary structure: XOR of the two sub bits gives the +1, AND gives the +2 — the SAD kernel."
kind: circuit
source: "ASA §5.4.5, pp. 133-135"
status: seed
spade: simulated
tags: [digital, adder, subtraction, twos-complement, ternary, fpga, sad]
aliases:
  - "Sign-Configurable Adder/Subtractor"
  - "Sign-Configurable Adder-Subtractor"
  - "Reconfigurable Adder/Subtractor"
  - "Generalized Adder/Subtractor"
---

# Sign-Configurable Adder/Subtractor

An adder whose *both* operands carry an independent negate select, which forces
it onto a ternary (three-addend) structure because the two selects can demand a
constant $+2$ and a carry-propagate adder has only one carry-in.

```tikz title="Sign-configurable adder/subtractor built on the ternary adder structure"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % ---- blocks (filled first, so no label is painted over)
  \draw[fill=black!3] (0.2,3.1) rectangle (3.0,3.9);
  \draw[fill=black!3] (3.2,3.1) rectangle (6.0,3.9);
  \draw[fill=black!3] (6.3,2.95) rectangle (11.3,4.05);
  \draw[fill=black!5] (0.2,1.5) rectangle (11.0,2.5);
  \draw[dashed,fill=black!8] (0.2,-0.1) rectangle (11.0,0.9);

  % ---- inputs
  \node[anchor=south] at (1.1,4.65) {$X$};
  \node[anchor=south] at (4.1,4.65) {$Y$};
  \node[anchor=south] at (7.4,4.65) {$\mathrm{sub}_X$};
  \node[anchor=south] at (9.3,4.65) {$\mathrm{sub}_Y$};
  \draw[->] (1.1,4.6) -- (1.1,3.9);   \node[anchor=west] at (1.15,4.35) {\scriptsize $w$};
  \draw[->] (4.1,4.6) -- (4.1,3.9);   \node[anchor=west] at (4.15,4.35) {\scriptsize $w$};
  \draw[->] (7.4,4.6) -- (7.4,4.0);
  \draw[->] (9.3,4.6) -- (9.3,4.0);

  % ---- select fan-out into the two XOR rows
  \draw (7.4,4.45) -- (2.1,4.45) -- (2.1,3.9);
  \draw (9.3,4.25) -- (5.1,4.25) -- (5.1,3.9);
  \fill (7.4,4.45) circle (1.6pt);
  \fill (9.3,4.25) circle (1.6pt);

  % ---- block labels
  \node[align=center] at (1.6,3.5) {$w\times$ XOR\\[1pt] $X'=X\oplus\mathrm{sub}_X$};
  \node[align=center] at (4.6,3.5) {$w\times$ XOR\\[1pt] $Y'=Y\oplus\mathrm{sub}_Y$};
  \node[align=center] at (8.8,3.5)
    {half adder on the selects\\[2pt]
     \scriptsize $K=2(\mathrm{sub}_X\!\wedge\!\mathrm{sub}_Y)+(\mathrm{sub}_X\!\oplus\!\mathrm{sub}_Y)$};
  \node[align=center] at (5.6,2.0)
    {carry-save row: one FA per bit, in the free LUT layer\\[1pt]
     $X'+Y'+K \;=\; C+S$};
  \node at (5.6,0.4) {RCA on the hardened carry chain,\; $c_{\mathrm{in}}=0$};

  % ---- inter-stage wires
  \draw[->] (1.6,3.1) -- (1.6,2.5);
  \node[anchor=east] at (1.55,2.68) {$X'$};
  \node[anchor=west] at (1.65,2.68) {\scriptsize $w$};
  \draw[->] (4.6,3.1) -- (4.6,2.5);
  \node[anchor=east] at (4.55,2.68) {$Y'$};
  \node[anchor=west] at (4.65,2.68) {\scriptsize $w$};
  \draw[->] (7.4,2.95) -- (7.4,2.5);
  \node[anchor=east] at (7.35,2.68) {$K$};
  \node[anchor=west] at (7.45,2.68) {\scriptsize 2};

  \draw[->] (3.4,1.5) -- (3.4,0.9);
  \node[anchor=south east] at (3.35,1.06) {$S$ \scriptsize $w{+}2$};
  \draw[->] (7.8,1.5) -- (7.8,0.9);
  \node[anchor=south west] at (7.85,1.06) {$C \ll 1$ \scriptsize $w{+}2$};

  \draw[->] (5.6,-0.1) -- (5.6,-0.8);
  \node[anchor=north] at (5.6,-0.85)
    {$S=(-1)^{\mathrm{sub}_X}X+(-1)^{\mathrm{sub}_Y}Y$ \quad \scriptsize $w{+}2$};
\end{circuitikz}
\end{document}
```

*after Figs. 5.27–5.28, pp. 134–135 — those draw the Intel ALM and AMD slice
mappings bit by bit; this is the same circuit at datapath level.*

**Fix what the operator has to compute.** With two $w$-bit two's-complement
inputs $X,Y$ and two independent select bits $\texttt{sub}_X,\texttt{sub}_Y$, the
target is the four-way function

$$S=(-1)^{\texttt{sub}_X}X+(-1)^{\texttt{sub}_Y}Y \tag{5.62}$$

giving $X+Y$, $X-Y$, $-X+Y$, $-X-Y$ on the four select codes. Each select is one
bit; $S$ is $w+2$ bits, for the reason established below. This is a strict
generalisation of [[Two's Complement Adder/Subtractor]], which fixes
$\texttt{sub}_X=0$ and gets away with a single XOR row.

**Expand each conditional negation with the two's-complement identity.** By
$-V=\overline{V}+1$, negating $V$ costs a bitwise complement plus an increment,
and the complement is made conditional by XOR-ing every bit with the select —
using $v\oplus 0=v$, $v\oplus 1=\overline{v}$. Writing $X'=X\oplus\texttt{sub}_X$
for the bitwise XOR against the replicated select (still $w$ bits), and likewise
$Y'$, the four cases collapse into a single expression:

$$S=X'+Y'+\underbrace{(\texttt{sub}_X+\texttt{sub}_Y)}_{K}.$$

$K$ is the sum of two bits, so $K\in\{0,1,2\}$ and it takes **two** bits to
carry.

> [!important] Two increments, one carry-in
> Every carry-propagate adder offers exactly one free constant of weight $1$ —
> the carry-in — which is why the single-sided adder/subtractor is free. Two
> independent negations need $K=2$ on the code $\texttt{sub}_X=\texttt{sub}_Y=1$,
> and weight $2$ is not a slot a CPA has. That one missing slot is the whole
> reason this circuit looks the way it does (p. 133).

**Split $K$ with a half adder on the selects.** $K=\texttt{sub}_X+\texttt{sub}_Y$
is a one-bit addition, so its two output bits are exactly the half-adder outputs
of [[Half Adder]]: sum $\texttt{sub}_X\oplus\texttt{sub}_Y$ at weight $1$, carry
$\texttt{sub}_X\wedge\texttt{sub}_Y$ at weight $2$. So

$$K=2(\texttt{sub}_X\wedge\texttt{sub}_Y)+(\texttt{sub}_X\oplus\texttt{sub}_Y).$$

One AND and one XOR, computed once for the whole word rather than per bit — the
book states this result directly (p. 133) without naming it a half adder, but
that is what it is, and it is why $K$ is $2$ bits wide and never wider.

**Give $K$ a home by moving to three addends.** $X'+Y'+K$ is a three-operand
sum, so build it on the ternary structure of [[Ternary Adders on FPGAs]]: a row
of full adders acting as a carry-save compressor ([[CSA, Carry-Save Adder]])
reduces $\{X',Y',K\}$ to a carry-save pair $(C,S)$ with no carry crossing a cell
boundary, and one carry-propagate adder below collapses the pair. On FPGA that
row is nearly free — the adder barely uses the LUT it sits in, so the compressor
lands in LUTs that were idle in front of the hard carry chain
([[FPGA Hard Carry Chain Adder]], [[Lookup-Tables]]). Because $K$ is nonzero only
in bits $0$ and $1$, every full adder above bit $1$ sees a zero third input and
degenerates to a half adder — visible in Fig. 5.27 as the `FA ← 0` cells — but
the row is still needed at full width, since a carry-save pair has to be produced
for every column.

**The alternative costs a second carry propagation, not a LUT row.** All four
cases are also reachable with two chained CPAs: pre-XOR $Y$ with
$\texttt{sub}_X\oplus\texttt{sub}_Y$ and drive the carry-in with that same bit,
giving $T\in\{X+Y,\,X-Y\}$, then conditionally negate $T$ under $\texttt{sub}_X$
using $-T=\overline{T}+1$ again. Check the code $\texttt{sub}_X=1,
\texttt{sub}_Y=0$: the pre-XOR bit is $1$ so $T=X-Y$, and the post-negation fires,
giving $-X+Y$. Correct on all four codes and no third addend needed — but the
second negation is itself an increment, so the critical path is two full carry
propagations. The ternary form keeps a single chain and pays one LUT layer, which
on FPGA is the layer that was idle anyway. That is the trade which makes the
ternary version right *on FPGA specifically*; in VLSI the compressor row is $w$
real full adders and buys nothing, exactly the book's verdict on ternary adders
generally (p. 132).

**The output needs $w+2$ bits, not $w+1$.** For $X\in[-2^{w-1},2^{w-1}-1]$ the
negation $-X$ ranges over $[-(2^{w-1}-1),2^{w-1}]$, so
$S\in[-(2^{w}-2),\,2^{w}]$. The upper endpoint $2^{w}$ is attained at
$X=Y=-2^{w-1}$ with both selects set, and it does not fit in $w+1$
two's-complement bits, whose maximum is $2^{w}-1$. This is the same $2$-bit
growth the book records for the $X-Y-Z$ ternary variant (p. 132); see
[[Number Formats]] for the range arithmetic. At $w=8$: $-128$ and $-128$, both
negated, gives $256$, which needs $10$ bits.

**Vendor mapping is where the cost actually lands.** On Intel, families with
*shared arithmetic mode* (Arria I/II/V, Stratix II–V) put the compressor FAs
directly in the ALM, so a ternary adder uses the same ALM count as a binary adder
of the same output width (p. 132) — the operator costs only the two extra output
bits. That mode was **dropped in Stratix 10**, after which the compressor needs
additional LUTs. On AMD, the fracturable LUT6 of Virtex 5-7, Spartan 6, Kintex 7,
Artix 7, Zynq and UltraScale/+ hosts the compressor FA in the same LUT as the
adder's XOR (Fig. 5.28), but the $c_i'$ carries must reach the next stage through
**general routing**, which is why the book reports a ternary adder up to $50\,\%$
slower than a binary one at small word sizes (p. 132). Only the second stage
rides the fast dedicated chain.

**Driving the selects from the sign bits turns this into an absolute-value
adder.** Set $\texttt{sub}_X=x_{w-1}$ and $\texttt{sub}_Y=y_{w-1}$ and (5.62)
becomes $S=|X|+|Y|$, with no separate absolute-value stage and no mux — the sign
bit is already a wire. That is the accumulate step of the sum-of-absolute-
differences metric of image processing ([KKZ16], p. 134): the differences come
out of ordinary subtractors, and every adder in the first level of the reduction
tree absorbs two absolute values for free; levels above it see only non-negative
numbers and are plain adders. Compare [[Absolute Difference Operator]], which
solves the adjacent problem — one $|X-Y|$ from a single prefix tree — by a
different identity.

$$\boxed{\ S=(X\oplus\texttt{sub}_X)+(Y\oplus\texttt{sub}_Y)+2(\texttt{sub}_X\wedge\texttt{sub}_Y)+(\texttt{sub}_X\oplus\texttt{sub}_Y)\ }$$

**When it breaks.**

- **Truncating to $w+1$ bits loses exactly one point:** $X=Y=-2^{w-1}$ with both
  selects set. If the operands can never both be the most negative value, $w+1$
  is safe; otherwise the $2$-bit growth is mandatory.
- **In VLSI the compressor row is not free.** $w$ real full adders, roughly a
  second adder's area. On ASIC prefer the two-stage conditional-negate form
  above, or two adders and a mux if latency dominates.
- **AMD tools will not infer the mapping.** Quartus detects `S <= X+Y+Z`; the AMD
  flow does not, so you instantiate primitives or generate with [[FloPoCo]]
  (`XilinxTernaryAddSub`). Writing the identity in plain HDL there gets you two
  chained adders instead of one CSA row and one chain.
- **Stratix 10 and later** have no shared arithmetic mode, so the "same ALM count
  as a binary adder" claim stops holding.
- **The selects are high-fanout control nets.** $\texttt{sub}_X$ drives $w$ XORs
  plus the AND/XOR pair; late arrival gates the entire chain, not one bit of it.
  At large $w$ that is a replication and placement problem, not a logic problem.
- **Unsigned operands are meaningless here** — negation needs a sign, so widen to
  signed first, paying the extra bit up front.

**RTL (Spade).**

```spade
/// Conditional one's complement: s=1 turns v into ~v = -v-1.
fn cneg<#uint W>(v: int<W>, s: bool) -> int<W> {
    if s { ~v } else { v }
}

/// S = (-1)^sub_x X + (-1)^sub_y Y, exact in W+2 bits.
entity sign_cfg_addsub<#uint W>(
    x: int<W>, y: int<W>, sub_x: bool, sub_y: bool
) -> int<{W + 2}> {
    let xp: int<{W + 2}> = sext(cneg(x, sub_x));
    let yp: int<{W + 2}> = sext(cneg(y, sub_y));
    // half adder on the selects: XOR is the weight-1 slot, AND the weight-2 slot
    let k1: int<{W + 2}> = if sub_x ^^ sub_y { 1 } else { 0 };
    let k2: int<{W + 2}> = if sub_x && sub_y { 2 } else { 0 };
    xp +. yp +. k1 +. k2
}
```

`cneg` is one XOR row of the diagram; `k1` and `k2` are the half adder's sum and
carry at weights $1$ and $2$. Everything is combinational — no `reg`, no clock.
The operands are `sext`-ed to $w+2$ bits *before* the additions, and sign
extension is value-preserving, so adding in $w+2$ bits is exact; the `+.` are the
wrapping adds, which never wrap because the true result provably fits, while
plain `+` would widen each intermediate to $w+3$ and then refuse to typecheck
against the next `+`. What synthesis does differently from the drawing: this is
written as a chain of three two-input additions, and only a tool that recognises
the ternary pattern (Quartus) folds it into one CSA row plus one carry chain — on
AMD you get three chained adders unless you instantiate the primitives yourself.

**Related Notes.**

- [[Ternary Adders on FPGAs]] – depends-on: supplies the three-addend structure
  this operator is built on, and the vendor mapping numbers.
- [[Two's Complement Adder/Subtractor]] – extends: the single-sided case, where
  $K\le 1$ fits the carry-in and the operator is free.
- [[Absolute Difference Operator]] – compares: also fuses a sign decision into an
  adder, but for $|X-Y|$ and via a compound prefix tree instead.
- [[CSA, Carry-Save Adder]] – supports: the compressor row is a carry-save adder,
  with $K$ occupying its third input.
- [[Half Adder]] – supports: the select-pair logic is literally one half adder.
- [[FPGA Hard Carry Chain Adder]] – depends-on: the reason the LUT layer in front
  of the chain is free to spend.
- [[Choosing an Adder]] – compares: where the two-stage conditional-negate
  alternative wins instead.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §5.4.5 *Reconfigurable Adder/Subtractor*, pp. 133–135 — Eq. (5.62),
    Figs. 5.27 (Intel ALM) and 5.28 (AMD slice), the XOR/AND split of the
    constant, and the SAD application ([KKZ16]).
  - §5.4.4 *Ternary Adders*, pp. 131–133 — shared arithmetic mode and its removal
    in Stratix 10, the $50\,\%$ AMD penalty, the $1$/$2$-bit word growth for
    negated ternary forms, and the FloPoCo `XilinxTernaryAddSub` generator.
  - §5.2.5, p. 110 — the single-sided adder/subtractor $S=X+(-1)^{\texttt{sub}}Y$.
  - §5.2.2, p. 111 — the carry-save row, Eq. (5.9).
