---
title: Modular Squaring Table
description: "Tabulate x^2 mod p to build a modular multiplier from ab=((a+b)^2-(a-b)^2)/4 — a wildly discontinuous function that tabulation handles without noticing."
kind: circuit
source: "ASA §16.4.1, pp. 489-490"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, modular-arithmetic, rom, table, rns]
aliases:
  - Quarter-Square Modular Multiplier
  - Modular Squarer
  - x^2 mod p Table
---

# Modular Squaring Table

A read-only table of $x^2 \bmod p$ that turns a modular multiplication into two
table reads and one modular subtraction — and the one function in this chapter
for which *no* smoothness-based approximation technique exists, because the
tabulated function is nowhere continuous.

```tikz title="Quarter-square modular multiplier built from two copies of a squaring table mod 23"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  >=latex,
  blk/.style={draw, thick, minimum width=2.1cm, minimum height=0.95cm,
              align=center, font=\small},
  rom/.style={draw, thick, fill=black!6, minimum width=2.6cm,
              minimum height=1.35cm, align=center, font=\small},
  w/.style={font=\scriptsize}
]
  % ---- input buses -------------------------------------------------------
  \node[w] (a) at (-0.35,2.55) {$a$};
  \node[w] (b) at (-0.35,0.05) {$b$};
  \node[w,anchor=south] at (0.15,2.63) {5};
  \node[w,anchor=south] at (0.15,0.13) {5};

  \draw[thick] (-0.1,2.55) -- (0.75,2.55);
  \draw[thick,->] (0.75,2.55) -- (1.25,2.55);
  \draw[thick] (0.75,2.55) -- (0.75,0.55);
  \draw[thick,->] (0.75,0.55) -- (1.25,0.55);

  \draw[thick] (-0.1,0.05) -- (0.45,0.05);
  \draw[thick,->] (0.45,0.05) -- (1.25,0.05);
  \draw[thick] (0.45,0.05) -- (0.45,2.05);
  \draw[thick,->] (0.45,2.05) -- (1.25,2.05);

  % ---- front end ---------------------------------------------------------
  \node[blk] (add) at (2.3,2.3) {$a+b$\\[-2pt]\scriptsize unreduced adder};
  \node[blk] (dif) at (2.3,0.3) {$|a-b|$\\[-2pt]\scriptsize abs.\ difference};

  % ---- tables ------------------------------------------------------------
  \node[rom] (t1) at (6.9,2.3) {ROM $T$\\[3pt]$T[x]=\tfrac{x^2}{4}\ \mathrm{mod}\ 23$};
  \node[rom] (t2) at (6.9,0.3) {ROM $T$\\[3pt]$T[x]=\tfrac{x^2}{4}\ \mathrm{mod}\ 23$};

  \draw[thick,->] (add.east) -- (t1.west);
  \draw[thick,->] (dif.east) -- (t2.west);
  \node[w,anchor=south] at (4.5,2.42) {6};
  \node[w,anchor=north] at (4.5,2.22) {$0\ldots44$};
  \node[w,anchor=south] at (4.5,0.42) {6};
  \node[w,anchor=north] at (4.5,0.22) {$0\ldots22$};

  % ---- modular subtractor ------------------------------------------------
  \node[blk,minimum height=1.7cm,minimum width=2.4cm] (sub) at (10.6,1.3)
        {$T_s-T_d$\\[-1pt]$\mathrm{mod}\ 23$\\[-2pt]\scriptsize add $23$, then\\[-3pt]
         \scriptsize conditional $-23$};

  \draw[thick] (t1.east) -- (9.2,2.3) -- (9.2,1.75);
  \draw[thick,->] (9.2,1.75) -- (9.4,1.75);
  \draw[thick] (t2.east) -- (9.2,0.3) -- (9.2,0.85);
  \draw[thick,->] (9.2,0.85) -- (9.4,0.85);
  \node[w,anchor=south] at (8.7,2.42) {5};
  \node[w,anchor=south] at (8.7,0.42) {5};

  \draw[thick,->] (sub.east) -- (12.5,1.3);
  \node[w,anchor=south] at (12.1,1.42) {5};
  \node[w,anchor=west,font=\small] at (12.55,1.3) {$ab \bmod 23$};

  \node[w,anchor=north,align=center] at (6.9,-0.75)
    {identical contents, $2^{6}\times5=320$ bits each\\
     $\to$ 5 six-input LUTs each};
\end{circuitikz}
\end{document}
```

*Own construction, from the generator invocation of case 4, p. 490.*

**Trade the multiplier for two squarings.** The quarter-square identity
$$ab \;=\; \frac{(a+b)^2-(a-b)^2}{4}$$
is just the difference of the two binomial expansions: $(a+b)^2-(a-b)^2 = 4ab$,
so the identity is exact over $\mathbb{Z}$ and needs no rounding argument. It
buys a multiplier from a *squarer*, and a squarer is a one-argument function —
which is precisely the shape a table can hold. Read modulo an odd prime $p$, the
division by $4$ is not a shift but multiplication by the inverse $4^{-1}$ in
$\mathbb{Z}_p$, which exists exactly because $\gcd(4,p)=1$. For $p=23$,
$4\cdot 6 = 24 \equiv 1$, so $4^{-1}=6$.

**Fold the constant into the entries so the datapath never divides.** Writing
$4^{-1}$ as a separate stage would reintroduce the modular multiplication we set
out to remove — circular. Instead define the tabulated function to be the
quarter-square itself:
$$T(x) \;=\; \big(4^{-1}x^2\big) \bmod p .$$
The entries are computed once at generation time in arbitrary precision, so
absorbing a constant into them costs nothing at all. By distributivity of
multiplication over subtraction in $\mathbb{Z}_p$,
$$T(a+b)-T(a-b) \;\equiv\; 4^{-1}\big((a+b)^2-(a-b)^2\big) \;\equiv\; 4^{-1}\cdot 4ab \;\equiv\; ab \pmod p,$$
and the whole operator is two reads and one subtraction. The book's own command
tabulates the plain square and leaves the $\div 4$ to the surrounding logic; the
folded form is the same table with a permuted image.

**Squaring is even, so the sign of $a-b$ costs nothing.** $a-b$ ranges over
$(-(p-1), p-1)$ and is negative half the time, which would normally force a
two's-complement address and a signed table. But $T(-x)=T(x)$ because
$(-x)^2=x^2$, so feeding $|a-b|$ gives the identical entry. An absolute
difference — one comparator and one conditional negate, by the two's-complement
identity $-x = \bar{x}+1$ of [[Number Formats]] — replaces the signed half of the
table and halves the address range at the same time.

**The adder needs no modular reduction either, because the table absorbs it.**
$a,b \in [0,p)$ are $w = \lceil \log_2 p\rceil = 5$ bits, so $a+b$ spans
$[0, 2p-2] = [0,44]$ and needs $6$ bits. The tempting move is a modular adder to
pull that back into $[0,p)$ and keep the address at $5$ bits. Do not: $T$ is
tabulated over the whole $6$-bit address space and $T(x)$ depends only on
$x \bmod p$, so the plain unreduced sum indexes the correct entry directly. One
address bit is cheaper than a comparator and a conditional subtractor, and on a
$\alpha=6$ LUT fabric the sixth bit is *free* — a $2^5\times 5$ ROM and a
$2^6\times 5$ ROM both cost 5 LUTs, by the quantization argument in
[[LUT-Array Function Table]]. The same slack means the operator stays correct
for any unreduced $a,b$ with $a+b \le 63$, since the identity holds over
$\mathbb{Z}$ before reduction.

**Widths, end to end.** Inputs $a,b$: $5$ bits each. Sum $s=a+b$: $6$ bits.
Absolute difference $d=|a-b|$: $6$ bits carried, $[0,22]$ attained. Table output:
$\lceil\log_2 p\rceil = 5$ bits — and here the attained maximum is $18$, because
the image of $T$ is the set of quadratic residues scaled by $4^{-1}$, so it is
$\{0,1,2,3,4,6,8,9,12,13,16,18\}$: only $12$ of the $23$ residues ever appear.
Final modular subtraction: compute $T_s + p - T_d \in [1, 2p-1]$ in $6$ bits, then
one conditional $-p$. Result: $5$ bits. All combinational.

**Discontinuity is the whole point.** $x \mapsto x^2 \bmod p$ has no derivative
bound, no monotone stretch longer than a few addresses, and no closed-form real
extension — consecutive entries here run $\ldots,16,3,2,13,13,2,3,16,\ldots$,
jumping most of the output range between neighbours. Every technique that buys
back the ROM exponent assumes the opposite. Polynomial approximation needs
bounded derivatives on each segment; the table-and-addition family and lossless
differential table compression need "small local variations" between neighbouring
addresses (LDTC's validity test rejects a slice the moment
$\max(S)-\min(S) \ge 2^{w_L}$, p. 501); digit recurrence needs $f$ to be
algebraic. None of them survive contact with a modular square.

> [!important] Plain tabulation is the only approximation method that applies
> Tabulation makes no assumption relating $f$ at neighbouring addresses — it only
> requires $f$ to be *defined and finite* on its domain. That is why it is the
> lightest hypothesis in the whole of [[Fixed-Point Function Approximation]], and
> why a function chosen specifically to be pathological still costs exactly
> $2^{n}\cdot m$ bits and one ROM delay. See [[Function Table ROM]] for the cost
> law this note inherits.

**Generating it.** In FloPoCo the function is a Sollya expression, and the
integer semantics have to be built out of a fixed-point one. `lsbIn=-6` makes
the input $X = i/2^6$ for $i = 0\ldots63$, so the expression rescales with
`x*1b6` (`1b6` is Sollya for $2^6$) and implements the modulo out of the floor
function, since Sollya has no `mod` (p. 490):

```
flopoco FixFunctionByTable \
  f="x*1b6*x*1b6-23*floor(x*1b6*x*1b6/23)" \
  signedIn=false lsbIn=-6 lsbOut=0
```

`lsbOut=0` makes the output a plain integer; the generator infers the output MSB
from the attained range, giving the $5$ bits above. Folding in $4^{-1}$ is one
more factor inside both `floor` arguments.

**Cost, and when it is actually a win.** Two tables at $2^{w+1}\times w$ bits, or
$2\cdot 2^6\cdot 5 = 640$ bits at $p=23$ — 5 LUTs per table on a $6$-LUT fabric
by $2^{\max(k-\alpha,0)}\times n$, plus a $5$-bit adder, an absolute difference
and a modular subtractor. The alternative is a $5\times 5$ multiplier feeding a
mod-$23$ reducer. On a LUT fabric with no spare DSP the table version wins at
this size; the moment a DSP block is idle, the direct multiplier is free and this
circuit is a waste of two BRAM-sized tables.

> [!warning] The book gives no measured area for this case
> §16.4.1 supplies only the generator invocation for $x^2 \bmod 23$. Every LUT
> and bit count above is derived from the §16.4.2 cost laws (pp. 491-492), not
> measured — and §16.4.2 itself shows the derived number is pessimistic (25 LUTs
> measured against 32 predicted for the sine table). Expect logic synthesis to do
> better than $5$ LUTs per table here, since $11$ of the $23$ output codes never
> occur and are free don't-cares.

$$\boxed{\ ab \bmod p \;=\; \big(T(a+b) - T(|a-b|)\big) \bmod p, \qquad T(x) = \big(4^{-1}x^2\big)\bmod p\ }$$

**When it breaks**

- **$p$ even.** $4^{-1}$ does not exist mod $2^k$, so the folded table is
  undefined. Non-modular quarter-square multiplication survives via
  $ab = \lfloor (a+b)^2/4\rfloor - \lfloor (a-b)^2/4\rfloor$, which is exact for
  integers because $a+b$ and $a-b$ have the same parity — but that is a different
  table and a different note.
- **$p$ beyond about $10$ bits.** The address is $w+1$ bits, so the pair of
  tables costs $2^{w+2}w$ bits: $8$ kbit at $w=8$, $256$ kbit at $w=12$,
  $4$ Mibit at $w=16$. The exponential of [[Function Table ROM]] applies
  unchanged, and it is the only reason this technique is confined to RNS channel
  moduli and small-prime cryptographic toys rather than being a general modular
  multiplier.
- **Inputs not pre-reduced.** Correct only while $a+b$ stays inside the address
  space ($\le 63$ here). Feed $a,b \in [0,2^5)$ and it still works; widen either
  input and the sum aliases to the wrong entry, silently.
- **One physical table, two reads.** The diagram draws two ROMs because a LUT
  fabric duplicates them for free. On block RAM, use the second port or accept
  two cycles — the operator becomes sequential and the identity says nothing
  about that.
- **Timing.** Two levels of table plus two carry chains. Deeper than a DSP
  multiply at any width where a DSP exists.

**RTL (Spade)**

```spade
/// T[x] = (x^2 / 4) mod 23, tabulated for every 6-bit address.
fn qsq23(x: uint<6>) -> uint<5> {
    [ 0,  6,  1,  8,  4, 12,  9, 18, 16,  3,  2, 13, 13,  2,  3, 16,
     18,  9, 12,  4,  8,  1,  6,  0,  6,  1,  8,  4, 12,  9, 18, 16,
      3,  2, 13, 13,  2,  3, 16, 18,  9, 12,  4,  8,  1,  6,  0,  6,
      1,  8,  4, 12,  9, 18, 16,  3,  2, 13, 13,  2,  3, 16, 18,  9][x]
}

/// a*b mod 23 for a, b in [0,23), by two table reads and one modular subtract.
fn modmul23(a: uint<5>, b: uint<5>) -> uint<5> {
    let s: uint<6> = a + b;
    let d: uint<6> = if a >= b { a - b } else { b - a };
    let ts: uint<5> = qsq23(s);
    let td: uint<5> = qsq23(d);
    let w: uint<6> = trunc(zext::<5, 6>(ts) + 23);
    let v: uint<6> = w -. zext::<5, 6>(td);
    if v >= 23 { trunc(v -. 23) } else { trunc(v) }
}
```

`qsq23` is one ROM box in the diagram; Spade's array-with-runtime-index lowers to
a Verilog `case`, and synthesis — not the source — decides whether that becomes
5 LUTs or a block RAM, so the two drawn ROMs are one shared `fn` here. `s` and
`d` are the two 6-bit address wires: `a + b` widens $5\to6$ for free, and the
`if a >= b` is the absolute difference, not a modular reduction. The last three
lines are the modular subtractor: add $p$ *before* subtracting so the unsigned
intermediate `v` never underflows, then one conditional $-23$. `-.` is the
truncating subtract, keeping the width at 6 where the plain `-` would widen to 7.
Everything is a `fn`, so the whole operator is combinational — one ROM delay plus
two carry chains, no clock anywhere.

Simulated against `(a*b) % 23`: all $23^2 = 529$ in-range pairs exhaustively,
plus $3000$ random vectors and named asymmetric cases $5\cdot 7$, $1\cdot 22$,
$22\cdot 1$, $0\cdot 17$ — the asymmetric pairs are the ones that catch a swapped
$T_s/T_d$, which the symmetric $22\cdot 22$ would pass.

**Related Notes**

- [[Function Table ROM]] – depends-on: this is that ROM, with a function chosen to
  have no structure at all; the $2^n\cdot m$ cost law and the LUT quantization
  come from there unchanged.
- [[Squarers and Integer Powers]] – compares: the dedicated-squarer route to the
  same quarter-square identity, which beats tabulation as soon as $p$ outgrows a
  few LUTs.
- [[Multipliers]] – counter-example: the whole point is that a general multiplier
  is *not* the cheapest way to a modular product at RNS-channel widths.
- [[Division by Constants]] – supports: the $\bmod 23$ that fills these entries is
  a division by a constant, done once at generation time instead of in silicon.
- [[Choosing a Function Approximation Method]] – compares: the entry in that
  decision table for "$f$ has no smoothness whatsoever", where every branch but
  plain tabulation is closed.
- [[LUT-Array Function Table]] – extends: why the sixth address bit is free and
  the fifth would have been wasted.
- [[Tabulated Reciprocal]] – compares: the same generator, the same cost law, on a
  function that *is* smooth — so every later chapter's technique applies to it and
  none apply here.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 16,
"Generalities on Fixed-Point Function Approximation":

- §16.4 A First Generic Approximator: Simple Tabulation, p. 488 — plain tabulation
  needs only that $f$ be defined and finite; no differentiability, no architectural
  overhead.
- §16.4.1 Tabulating Precomputed Function Values in a ROM, pp. 489-490 — Sollya as
  the entry generator; hands-on case 4, $x^2 \bmod p$ for modular multiplication
  via $ab = \frac{(a+b)^2-(a-b)^2}{4}$, the `1b6` rescaling and the floor-based
  modulo.
- §16.4.2 Actual Cost of a ROM, pp. 491-492 — $2^{\max(k-\alpha,0)}\times n$ LUT
  cost and the measured 25-vs-32 discrepancy quoted in the warning above.
- §17.1.2-17.1.3 The Parameter Space of LDTC / The LDTC Optimization Algorithm,
  pp. 499-501 — the "small local variations" hypothesis and the validity test that
  a modular square fails.
