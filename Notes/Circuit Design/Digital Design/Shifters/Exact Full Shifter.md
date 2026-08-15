---
title: Exact Full Shifter
description: "Stack of w_S mux rows shifting by 2^i, output widened to w_X+S_max so no input bit is ever lost; LSB-first stage order minimises summed mux width and overlaps with the adder producing S."
kind: circuit
source: "ASA §10.1.3, pp. 312-314 (Figs. 10.4, 10.5)"
status: seed
spade: simulated
tags: [digital, shifters, mux, fpga]
aliases:
  - Exact Shifter
  - Full Shifter
  - exact full shifter
  - Exact Full Right Shifter
---

# Exact Full Shifter

The shifter whose output is widened to $w_R=w_X+S_{\max}$ so that no bit of $X$ is ever discarded — the only member of the family that is exact, at $0$ ulp, for every shift distance in $[0,S_{\max}]$.

```tikz title="Exact full right shifter, w_X = 10, S_max = 15: four LSB-first mux rows, the word growing 10 to 25 bits"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >=latex,
  mux/.style={draw,fill=black!5,rounded corners=1pt,minimum width=58mm,minimum height=6.5mm,inner sep=2pt},
  pad/.style={draw,rounded corners=1pt,minimum height=5mm,inner sep=3pt,font=\scriptsize},
  w/.style={font=\scriptsize,inner sep=1.3pt}
]
\node (X) at (0,10.05) {$X=W_0$};
\draw[-] (0,9.83) -- node[w,right]{$10$} (0,9.35);
\draw (-2.6,9.35) -- (2.6,9.35);
\node[pad] (p0l) at (-2.6,8.95) {$\mathtt{0}\,W_0$};
\node[pad] (p0r) at ( 2.6,8.95) {$W_0\,\mathtt{0}$};
\draw[->] (-2.6,9.35) -- (p0l.north);
\draw[->] ( 2.6,9.35) -- (p0r.north);
\draw[->] (p0l.south) -- node[w,left]{$11$} (-2.6,8.34);
\draw[->] (p0r.south) -- node[w,right]{$11$} ( 2.6,8.34);
\node[w] at (-2.34,8.55) {$1$}; \node[w] at (2.34,8.55) {$0$};
\node[mux] (m0) at (0,8.00) {row of $11$ 1-bit 2:1 muxes\quad shift by $1$};
\node (s0) at (-4.7,8.00) {$s_0$}; \draw[->] (s0) -- (m0.west);

\draw[-] (0,7.67) -- node[w,right]{$W_1$, $11$} (0,7.15);
\draw (-2.6,7.15) -- (2.6,7.15);
\node[pad] (p1l) at (-2.6,6.75) {$\mathtt{00}\,W_1$};
\node[pad] (p1r) at ( 2.6,6.75) {$W_1\,\mathtt{00}$};
\draw[->] (-2.6,7.15) -- (p1l.north);
\draw[->] ( 2.6,7.15) -- (p1r.north);
\draw[->] (p1l.south) -- node[w,left]{$13$} (-2.6,6.14);
\draw[->] (p1r.south) -- node[w,right]{$13$} ( 2.6,6.14);
\node[w] at (-2.34,6.35) {$1$}; \node[w] at (2.34,6.35) {$0$};
\node[mux] (m1) at (0,5.80) {row of $13$ 1-bit 2:1 muxes\quad shift by $2$};
\node (s1) at (-4.7,5.80) {$s_1$}; \draw[->] (s1) -- (m1.west);

\draw[-] (0,5.47) -- node[w,right]{$W_2$, $13$} (0,4.95);
\draw (-2.6,4.95) -- (2.6,4.95);
\node[pad] (p2l) at (-2.6,4.55) {$\mathtt{0000}\,W_2$};
\node[pad] (p2r) at ( 2.6,4.55) {$W_2\,\mathtt{0000}$};
\draw[->] (-2.6,4.95) -- (p2l.north);
\draw[->] ( 2.6,4.95) -- (p2r.north);
\draw[->] (p2l.south) -- node[w,left]{$17$} (-2.6,3.94);
\draw[->] (p2r.south) -- node[w,right]{$17$} ( 2.6,3.94);
\node[w] at (-2.34,4.15) {$1$}; \node[w] at (2.34,4.15) {$0$};
\node[mux] (m2) at (0,3.60) {row of $17$ 1-bit 2:1 muxes\quad shift by $4$};
\node (s2) at (-4.7,3.60) {$s_2$}; \draw[->] (s2) -- (m2.west);

\draw[-] (0,3.27) -- node[w,right]{$W_3$, $17$} (0,2.75);
\draw (-2.6,2.75) -- (2.6,2.75);
\node[pad] (p3l) at (-2.6,2.35) {$\mathtt{0}^{8}\,W_3$};
\node[pad] (p3r) at ( 2.6,2.35) {$W_3\,\mathtt{0}^{8}$};
\draw[->] (-2.6,2.75) -- (p3l.north);
\draw[->] ( 2.6,2.75) -- (p3r.north);
\draw[->] (p3l.south) -- node[w,left]{$25$} (-2.6,1.74);
\draw[->] (p3r.south) -- node[w,right]{$25$} ( 2.6,1.74);
\node[w] at (-2.34,1.95) {$1$}; \node[w] at (2.34,1.95) {$0$};
\node[mux] (m3) at (0,1.40) {row of $25$ 1-bit 2:1 muxes\quad shift by $8$};
\node (s3) at (-4.7,1.40) {$s_3$}; \draw[->] (s3) -- (m3.west);

\draw[->] (0,1.07) -- node[w,right]{$25$} (0,0.35);
\node at (0,0.08) {$R=X\cdot 2^{15-S}$};
\node[w,align=left,anchor=west] at (3.9,8.00) {$w_X=10$\\ $S_{\max}=15$\\ $w_S=4$};
\node[w,align=left,anchor=west] at (3.9,1.40) {$w_R=w_X+S_{\max}=25$};
\end{circuitikz}
\end{document}
```

*after Fig. 10.4, p. 312.*

**Factor the shift distance into independent two-way choices.** Let $\sigma$ be shift-by-one. Shifting is a monoid homomorphism from $(\mathbb{N},+)$ into function composition, $\sigma^a\circ\sigma^b=\sigma^{a+b}$. Expand the unsigned distance $S$ in binary, $S=\sum_{i=0}^{w_S-1}s_i2^i$ with $s_i\in\{0,1\}$ and $w_S=\lceil\log_2(S_{\max}+1)\rceil$, substitute, and re-bracket by **associativity of composition**:

$$X\gg S\;=\;\Big(\sigma^{s_{w_S-1}2^{w_S-1}}\circ\cdots\circ\sigma^{s_12}\circ\sigma^{s_0}\Big)(X)$$

Each factor is identity when $s_i=0$ and a hardwired shift by $2^i$ when $s_i=1$. A hardwired shift is routing, so a factor costs exactly one row of 1-bit 2:1 multiplexers driven by $s_i$: $w_S$ mux levels of depth, $O(w_X\log S_{\max})$ of area. This is the same construction as [[Kogge-Stone Tree]] with a different associative operator — see [[Parallel Prefix Adders]].

**Grow the word instead of dropping bits, and the shift becomes a multiplication.** Call $W_i$ the intermediate word entering stage $i$, with $W_0=X$ on $w_X$ bits. Stage $i$ pads $W_i$ with $2^i$ zeroes on *both* sides to form two words of width $w_X+2^{i+1}-1$, and muxes between them:

$$W_{i+1}=\begin{cases}\mathtt{0}^{2^i}W_i & s_i=1\ \ (\text{shift})\\ W_i\mathtt{0}^{2^i} & s_i=0\ \ (\text{pass})\end{cases}\qquad |W_i|=w_X+2^i-1$$

For $w_X=10$, $S_{\max}=15$ that is $10\to11\to13\to17\to25$, the widths on the diagram. Reading the two branches as *values* rather than as bit strings, prepending zeroes leaves the integer alone and appending $2^i$ zeroes multiplies it by $2^{2^i}$, so after all $w_S$ stages

$$R\;=\;X\cdot 2^{\sum_{i:\,s_i=0}2^i}\;=\;X\cdot 2^{(2^{w_S}-1)-S}\;=\;X\cdot 2^{S_{\max}-S}$$

on $w_R=w_X+S_{\max}$ bits. Nothing is discarded anywhere, which is the definition of *exact*: read $R$ as a fixed-point value with $S_{\max}$ fractional bits and it is $X\gg S$ with $0$ ulp of error ([[Number Formats]], [[Error Accuracy]]). Every other shifter in [[Shifters]] is this circuit with output bits deleted.

> [!important] LSB-first is not a tie-break, it is smaller *and* faster
> The stages commute — **commutativity of $(\mathbb{N},+)$** — so any order computes the same $R$, but the orders do not cost the same because the word is growing. Consuming $S$ least-significant-bit first keeps the narrow stages early: for $w_X=8,\,w_S=4$ the mux count is $(w_X{+}1)+(w_X{+}3)+(w_X{+}7)+(w_X{+}15)=58$, against $(w_X{+}8)+(w_X{+}12)+(w_X{+}14)+(w_X{+}15)=81$ for MSB-first — 28% of the multiplexers gone, for free (p. 313). Independently, $S$ almost always comes out of an adder or subtractor, and carry propagation resolves the **low** bits first, so stage 0 can start while the high bits of $S$ are still settling. The overlap removes the shifter's first level from the critical path *and* means the adder computing $S$ need not be a fast one — a plain [[RCA, Ripple-Carry Adder]] will do.

**Summing the rows gives the area, and it is linear in $w_X$, not in $S_{\max}$.** With LSB-first ordering, stage $i$ contributes $w_X+2^{i+1}-1$ 1-bit muxes, so by the geometric sum $\sum_{i=0}^{w_S-1}2^{i+1}=2^{w_S+1}-2=2S_{\max}$ when $S_{\max}=2^{w_S}-1$:

$$\text{muxes}=\sum_{i=0}^{w_S-1}\!\big(w_X+2^{i+1}-1\big)=w_S(w_X-1)+2S_{\max}$$

which reproduces the book's $58$ at $w_X=8$, $w_S=4$, $S_{\max}=15$. The $2S_{\max}$ term is the price of exactness and it is paid almost entirely in the last stage.

**Only the last stage changes when $S_{\max}$ is not $2^{w_S}-1$.** Real requirements are not powers of two minus one — an IEEE-754 adder needs shifts of $w_F+2$, i.e. 12, 25 or 54 bits for the standard formats, none of the form $2^{w_S}-1$ (p. 311). $S_{\max}$, not $w_S$, is therefore the generator parameter, and $w_S$ is derived from it. The architecture is unchanged except that the final row is narrowed from $w_X+2^{w_S}-1$ to $w_R=w_X+S_{\max}$: for $w_X=10,\,S_{\max}=12$ the widths run $10\to11\to13\to17\to22$ instead of $\to25$ (Fig. 10.5, p. 313). It stays exact because $S>S_{\max}$ never occurs, so the bits the narrowed row appears to discard can only be zeroes that earlier stages introduced.

**A constant pad turns multiplexers into gates, and a non-constant pad is what an arithmetic shift is.** When both pad sides are zero, one input of every affected mux is a constant, so the mux collapses to an AND gate — the muxes on the diagram's outer $2^i$ columns are not really muxes at all. The generator's pad parameter takes $0$, $1$, or "a third input port sampled at runtime"; that last option, fed with the sign bit of $X$, is exactly an arithmetic right shift, i.e. division of a two's-complement number by $2^S$ ([[Number Formats]]). Direction is a generation-time parameter, never a runtime input: a left shifter is a right shifter with the two inputs of every mux exchanged, or equivalently with every $s_i$ complemented (Fig. 10.4 caption, p. 312), and a runtime direction bit should be biased away instead — see [[Bidirectional Shifter]].

**On an FPGA the 2:1 drawing over-counts by exactly two.** A 6-input [[Lookup-Tables|LUT]] holds a 4:1 multiplexer (4 data, 2 select), so two successive rows merge into one row of 6-LUTs: half the LUTs and half the logic depth versus the picture. Back-end tools find this by themselves and [[FloPoCo]] emits plain 2:1 muxes regardless. The one thing the designer must not get wrong: when **pipelining** the shifter, place registers every *other* level, because a register between two mergeable rows destroys the merge (p. 314).

$$\boxed{\ R=X\cdot 2^{S_{\max}-S}\ \text{on}\ w_R=w_X+S_{\max}\ \text{bits},\qquad \text{depth}=w_S,\qquad \text{muxes}=w_S(w_X-1)+2S_{\max}\ }$$

**When it breaks.**

- **When the low bits only ever feed a sticky bit.** Keeping them alive costs width in every stage and then a wide serial OR afterwards. Replacing the exact full shifter of a single-precision floating-point adder ($w_X=w_F+1$, $S_{\max}=w_F+3$) with a barrel shifter of $w_X=w_R=w_F+3$ plus incremental sticky removed **20% of the area and 5% of the delay** (p. 316). See [[Shifter with Sticky Bit Computation]].
- **When $S_{\max}$ approaches $w_X$.** The output is then near $2w_X$ bits and the final row alone is over a third of the multiplexers. If the consumer cannot use those bits, it is a [[Truncated Shifter]] and should be generated as one.
- **When $S$ can exceed $S_{\max}$.** The last-stage narrowing is only correct under $S\le S_{\max}$; violate it and the circuit silently drops significant bits instead of zeroes. The constraint $S_{\max}\le\max(w_R,w_X)\le\min(w_R,w_X)+S_{\max}$ (Eq. 10.1, p. 311) is what keeps a generator honest.
- **When fan-out is charged.** $s_i$ drives all $w_X+2^{i+1}-1$ muxes of its row, and unlike a [[Barrel Shifters|barrel shifter]] the rows are not equal, so the last $s_i$ has the largest load exactly where the word is widest.
- **When $S_{\max}$ is small.** Below three or four stages the $\log$ advantage over a [[One-Hot Shifter]] has not appeared yet; see [[Choosing a Shifter]].

**RTL (Spade).** The Fig. 10.4 instance, $w_X=10$, $S_{\max}=15$, right shift, zero pad:

```spade
fn efs_10_15(x: uint<10>, s: uint<4>) -> uint<25> {
    let z1: uint<1> = 0;
    let z2: uint<2> = 0;
    let z4: uint<4> = 0;
    let z8: uint<8> = 0;
    let sb = s.as_bits();

    let w0: uint<11> = if sb[0] { zext(x)  } else { x.concat(z1)  };
    let w1: uint<13> = if sb[1] { zext(w0) } else { w0.concat(z2) };
    let w2: uint<17> = if sb[2] { zext(w1) } else { w1.concat(z4) };
    let w3: uint<25> = if sb[3] { zext(w2) } else { w2.concat(z8) };
    w3
}
```

`w0`…`w3` are the four buses between the mux rows, and their annotated widths $11,13,17,25$ are the widths on the diagram — Spade will not let one be wrong, since `zext` and `concat` both take their result width from the `let`. `zext(w)` is the left-padded input (the `1` port of each mux: prepend $2^i$ zeroes, value unchanged) and `w.concat(z)` is the right-padded one (the `0` port: append $2^i$ zeroes, value $\times 2^{2^i}$) — note that for **integers** `a.concat(b)` puts `a` in the high half, the opposite of the array convention. `sb = s.as_bits()` indexes LSB-first with `sb[0]` the LSB, which is the stage order the whole note argues for. It is a `fn`, so it is purely combinational: the four `if`s are four mux rows of logic depth, not four cycles. Synthesis will not build $11+13+17+25=66$ multiplexers — every mux with a constant input constant-folds to an AND gate or a wire, and on an FPGA the rows merge two-to-one into 6-LUTs.

Verified against the behavioural reference $R = X\cdot2^{15-S}$ over 8 named vectors plus a 5000-vector random sweep, all passing. The named vectors include $X=1,S=0$ (result $2^{15}$) and $X=1,S=15$ (result $1$), which is the pair that catches a reversed stage order or a swapped mux polarity — symmetric operands do not.

**Related notes.**

- [[Barrel Shifters]] – compares: the same mux rows with $w_R=w_X$, so every row is equal-width and equal-fanout; cheaper, and lossy.
- [[Truncated Shifter]] – compares: what this becomes once the consumer cannot use the low bits, generated directly rather than by discarding outputs.
- [[Shifter with Sticky Bit Computation]] – extends: keeps one bit of information about the discarded bits instead of all of them, and wins 20% area / 5% delay doing it.
- [[Bidirectional Shifter]] – counter-example: the runtime-direction variant this one deliberately is not; bias $S$ by a constant instead.
- [[One-Hot Shifter]] – counter-example: one $(S_{\max}{+}1)$:1 mux per output bit, same asymptotic depth, quadratic area and fan-out $S_{\max}$ on every $x_i$.
- [[Choosing a Shifter]] – compares: where exactness is worth $w_X+S_{\max}$ bits of output.
- [[Kogge-Stone Tree]] – compares: binary powering of a different associative operator, same $\log$ depth for the same reason.
- [[Parallel Prefix Adders]] – supports: supplies the general "associativity buys logarithmic depth" argument this construction instantiates.
- [[RCA, Ripple-Carry Adder]] – supports: the LSB-first order exists so that a slow ripple adder producing $S$ is good enough.
- [[Lookup-Tables]] – depends-on: the 6-LUT 4:1 mux is why the real FPGA depth is $w_S/2$.
- [[Number Formats]] – depends-on: fixes what $R$'s extra $S_{\max}$ bits mean, and what the pad bit must be for an arithmetic shift.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 10 "Shifters and Leading Bit Counters":

- §10.1.2 Parameters, p. 311 — constraint (10.1); $w_S=\lceil\log_2(S_{\max}+1)\rceil$ derived from $S_{\max}$; the 12/25/54-bit IEEE-754 shift distances.
- §10.1.3 Architecture of an exact full shifter, pp. 312-314 — Fig. 10.4 ($w_X=10$, $S_{\max}=15$, widths $10\to25$, p. 312), Fig. 10.5 (narrowed last stage, $S_{\max}=12$, p. 313); the 58-vs-81 mux counts and the adder-overlap argument, p. 313; zero pads collapsing to AND gates and the pad-with-sign-bit case, pp. 313-314; FPGA 6-LUT merging and pipelining every other level, p. 314.
- §10.1.5 Barrel shifter with early sticky bit computation, p. 316 — the 20% area / 5% delay measurement against this architecture.
