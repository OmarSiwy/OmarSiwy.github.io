---
title: Binary Tree Constant Divider
description: "BTCD: the same exact division restructured from a chain into a tree — latency logarithmic in w instead of linear, at area proportional to w log w."
kind: circuit
source: "ASA §13.3, p. 434; §13.4.2, p. 436; Tables 13.4–13.5, pp. 437, 440"
status: seed
spade: simulated
tags: [digital, division-by-constants, parallel-prefix, tree, fpga]
aliases:
  - BTCD
  - Binary Tree Constant Division
  - Binary Tree Constant Dividers
---

# Binary Tree Constant Divider

An exact Euclidean divider by a small constant $D$ that computes the same digit
recurrence as the [[LinArch Divider]], but reassociated into a prefix tree, so
its latency is $O(\log w)$ instead of $O(w)$.

```tikz title="BTCD residue prefix tree, 16-bit division by 7 in radix 4"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\footnotesize, >=latex,
  op/.style={draw, thick, circle, inner sep=0pt, minimum size=4.4mm, fill=black!12},
  pt/.style={coordinate},
  lut/.style={draw, thick, minimum width=15mm, minimum height=9mm, font=\scriptsize}]

  % leaves: X_i < 2^k = 4 < D = 7, so each digit is already its own residue
  \foreach \i in {0,...,7} {
    \pgfmathsetmacro{\xx}{(7-\i)*1.4}
    \node (X\i) at (\xx,2.5) {$X_{\i}$};
    \node[op] (A\i) at (\xx,1.5) {};
    \draw[->] (X\i) -- node[right,inner sep=1pt,font=\scriptsize] {$2$} (A\i);
  }
  % level 1: offset d=1, a = 4^1 mod 7 = 4
  \foreach \i in {0,...,6} { \pgfmathsetmacro{\xx}{(7-\i)*1.4} \node[op] (B\i) at (\xx,0.5) {}; }
  \node[pt] (B7) at (0,0.5) {};
  \foreach \i in {0,...,7} { \draw[->] (A\i) -- (B\i); }
  \foreach \i/\j in {0/1,1/2,2/3,3/4,4/5,5/6,6/7} { \draw[->] (A\j) -- (B\i); }
  % level 2: offset d=2, a = 4^2 mod 7 = 2
  \foreach \i in {0,...,5} { \pgfmathsetmacro{\xx}{(7-\i)*1.4} \node[op] (C\i) at (\xx,-0.5) {}; }
  \node[pt] (C6) at (1.4,-0.5) {}; \node[pt] (C7) at (0,-0.5) {};
  \foreach \i in {0,...,7} { \draw[->] (B\i) -- (C\i); }
  \foreach \i/\j in {0/2,1/3,2/4,3/5,4/6,5/7} { \draw[->] (B\j) -- (C\i); }
  % level 3: offset d=4, a = 4^4 mod 7 = 4
  \foreach \i in {0,...,3} { \pgfmathsetmacro{\xx}{(7-\i)*1.4} \node[op] (D\i) at (\xx,-1.5) {}; }
  \node[pt] (D4) at (4.2,-1.5) {}; \node[pt] (D5) at (2.8,-1.5) {};
  \node[pt] (D6) at (1.4,-1.5) {}; \node[pt] (D7) at (0,-1.5) {};
  \foreach \i in {0,...,7} { \draw[->] (C\i) -- (D\i); }
  \foreach \i/\j in {0/4,1/5,2/6,3/7} { \draw[->] (C\j) -- (D\i); }
  % prefix residues out
  \foreach \i in {0,...,7} {
    \pgfmathsetmacro{\xx}{(7-\i)*1.4}
    \draw[->] (D\i) -- (\xx,-2.35);
    \node[font=\scriptsize] at (\xx,-2.6) {$R_{\i}$};
  }
  % level annotations
  \node[anchor=east,font=\scriptsize] at (-0.7,1.5)  {leaves $R^{(0)}_i=X_i$};
  \node[anchor=east,font=\scriptsize] at (-0.7,0.5)  {$d=1$, $a=4$};
  \node[anchor=east,font=\scriptsize] at (-0.7,-0.5) {$d=2$, $a=2$};
  \node[anchor=east,font=\scriptsize] at (-0.7,-1.5) {$d=4$, $a=4$};
  \node[anchor=east,font=\scriptsize,align=right] at (-0.7,-2.6) {$R_0=X\bmod 7$};

  % the node function, and the quotient LUT that hangs off each prefix
  \node[lut] (nd) at (13.0,1.1) {$(a\,h+l)\bmod 7$};
  \draw[->] (11.4,1.5) node[left,font=\scriptsize] {$h$: $r{=}3$} -- (nd.west);
  \draw[->] (11.4,0.7) node[left,font=\scriptsize] {$l$: $r{=}3$} -- ($(nd.west)+(0,-0.4)$);
  \draw[->] (nd.east) -- node[above,font=\scriptsize] {$3$} (15.0,1.1);
  \node[font=\scriptsize,anchor=west] at (11.6,2.1) {each $\bullet$ above is this table: $2r=6$ in, $r=3$ out};

  \node[lut] (ql) at (13.0,-1.1) {$\lfloor (X_i+4R_{i+1})/7\rfloor$};
  \draw[->] (11.4,-0.7) node[left,font=\scriptsize] {$X_i$: $2$} -- ($(ql.west)+(0,0.4)$);
  \draw[->] (11.4,-1.5) node[left,font=\scriptsize] {$R_{i+1}$: $3$} -- (ql.west);
  \draw[->] (ql.east) -- node[above,font=\scriptsize] {$2$} (15.0,-1.1) node[right,font=\scriptsize] {$Q_i$};
  \node[font=\scriptsize,anchor=west,align=left] at (11.6,-2.3)
    {$m=8$ of these, all in parallel,\\one extra LUT level after the tree};
\end{circuitikz}
\end{document}
```

> [!warning] Not covered in the source — needs outside research
> The book gives BTCD one paragraph (§13.3, p. 434) plus one sentence on its
> node shape (p. 436), and defers the construction entirely to [Uğu+17]. The
> operator, its associativity, the per-level constants and the area accounting
> below are **reconstructed here**, not quoted. They are pinned down by the two
> facts the book does state — nodes of $2r$ inputs and $r$ outputs, cost
> $O(w\log w)$ area at $O(\log w)$ delay — and they reproduce the measured
> numbers of Table 13.4, but the node used in [Uğu+17] may differ in detail.

**Start from the recurrence LinArch already proved correct.** Alg. 13.1 reads
$X$ in radix $2^k$ as $m=\lceil w/k\rceil$ digits $X_i$ and threads a remainder
from the most significant digit down:
$$R_i \;=\; \bigl(2^k R_{i+1} + X_i\bigr)\bmod D,\qquad R_m = 0$$
with $R_{i+1}\in[0,D-1]$ on $r=\lceil\log_2 D\rceil$ bits and $X_i$ on $k$ bits,
by Lemma 13.2. Read $R_i$ as a function of the *incoming* $R_{i+1}$ and it is an
affine map on $\mathbb{Z}_D$: $\ \rho \mapsto (a\rho + b)\bmod D$, with
$a = 2^k \bmod D$ and $b = X_i$. LinArch evaluates that chain of $m$ maps by
applying them one at a time, which is why its critical path is $m$ tables deep —
structurally the same choice as rippling a carry one bit at a time.

**Composition of affine maps is affine, and that single closure property is the
whole architecture.** Composing $\rho\mapsto(a_1\rho+b_1)$ and then
$\rho\mapsto(a_2\rho+b_2)$ gives, by distributivity of multiplication over
addition in $\mathbb{Z}_D$,
$$(a_2,b_2)\otimes(a_1,b_1) \;=\; \bigl(a_2a_1 \bmod D,\ \ a_2b_1+b_2 \bmod D\bigr)$$
Function composition is associative, so $\otimes$ is associative, so the chain
$(a,X_{m-1})\otimes\cdots\otimes(a,X_0)$ may be bracketed in any order — in
particular as a balanced tree. This is exactly the argument that turns the carry
recurrence into a [[Parallel Prefix Adders|parallel prefix]] network, and
$\otimes$ is the constant-division analogue of the $(g,p)$ carry operator of the
[[CLA, Carry-Lookahead Adder]]. The book's summary — "BTCD is to LinArch what
fast adders are to carry-propagate adders" (p. 434) — is this sentence.

**The multiplier half of the pair is a compile-time constant, so a node carries
$r$ bits and not $2r$.** A general $\otimes$ node would have to transport both
$a$ and $b$. But in a balanced tree the low operand of every node *at a given
level* spans exactly the same number of digits, $d = 2^\ell$ at level $\ell$, so
its accumulated multiplier is the same constant
$$a_d \;=\; (2^k)^{d} \bmod D \;=\; 2^{kd}\bmod D$$
for every node at that level — known at synthesis time and burned into the
table. Only the residue $b$ crosses a wire. A node is therefore a table of two
$r$-bit residues in, one $r$-bit residue out: $2r$ address bits, $r$ output
bits, precisely the shape the book states on p. 436, here derived rather than
asserted.

**The leaves are free whenever $2^k \le D$.** A leaf must supply $X_i \bmod D$,
and $X_i \le 2^k - 1$, so when $2^k \le D$ the digit *is* its own residue and the
leaf level is wiring — $k$ bits zero-extended to $r$. That holds in the figure
($k=2$, $D=7$) and fails at LinArch's own optimum for $D=3$ on a LUT6 ($k=4$,
$2^k = 16 > 3$), where the leaf row becomes $m$ genuine $k$-input, $r$-output
tables. The $k$ trade-off is not LinArch's either way: BTCD gains nothing from a
large $k$ beyond shrinking $m$, because its depth is $\log_2 m$, not $m$.

**The quotient is what makes this a prefix problem rather than a reduction
problem.** If only $R = R_0$ is wanted, the tree is a plain binary *reduction*:
$m-1$ nodes, $\lceil\log_2 m\rceil$ levels, nothing else. If the quotient is
wanted, every $Q_i = \lfloor(X_i + 2^kR_{i+1})/D\rfloor$ needs its own incoming
residue, i.e. **all $m$ prefixes**, so the reduction must become a prefix
network — a [[Kogge-Stone Tree]] at $m\log_2 m$ nodes and $\log_2 m$ levels, or a
[[Brent-Kung Tree]] at $\approx 2m$ nodes and $2\log_2 m - 1$ levels — followed
by a row of $m$ independent quotient tables of $k+r$ inputs and $k$ outputs. No
carry propagates between those tables: by Lemma 13.2 each $Q_i \le 2^k-1$ is
already a radix-$2^k$ digit, so the quotient is assembled by concatenation.

**That split accounts for the whole of Table 13.4 (p. 437).** For $D=3$,
$w=32$: remainder-only BTCD is 12 LUT / 3.8 ns, the full Euclidean divider
95 LUT / 4.8 ns — an $8\times$ area jump for one extra logic level, which is the
reduction tree ($m-1$ nodes) becoming a prefix network ($m\log m$ nodes) plus
$m$ quotient tables. Against LinArch the remainder-only case is the honest
comparison, and it is where BTCD is unambiguous: at $w=128$, $D=3$, BTCD is
50 LUT / 5.3 ns against LinArch's 43 LUT / 27.2 ns — same order of area, five
times the speed.

> [!note] The reconstruction predicts the measured numbers
> $D=5$ gives $r=3$; take LinArch's optimal $k=3$, so $m=\lceil 32/3\rceil = 11$.
> A remainder-only BTCD is then $m-1=10$ nodes, each $2r=6$ inputs and $r=3$
> outputs, i.e. 3 LUT6 per node: **30 LUT6** at $\lceil\log_2 11\rceil = 4$ LUT
> levels. LinArch is $m=11$ stages of that same 6-in/3-out shape: **33 LUT6** at
> 11 levels. Table 13.4 measures 29 LUT / 3.7 ns and 30 LUT / 9.8 ns — areas
> within one LUT of the prediction, and a delay ratio of 2.6 against the
> predicted $11/4 = 2.75$. This is the book's remark that both build "the same
> number of LUTs with 6 inputs and 3 outputs" (p. 436), made quantitative.

**Cost.** With $m = \lceil w/k\rceil$ digits, the prefix tree is $O(m\log m)$
nodes of fixed size at $O(\log m)$ depth, and the quotient row adds $m$ fixed
tables at one further level. Since $k$ is a constant chosen from $D$ and the
target LUT, that is area $O(w\log w)$ and delay $O(\log w)$ — the book's figures,
p. 434 — against LinArch's $O(w)$ and $O(w)$. The exchange rate is a $\log w$
factor of area bought for a $w/\log w$ factor of latency.

**On FPGA the node wants $2r \le \alpha$, and that binds harder than LinArch's
constraint.** A LUT$\alpha$ absorbs a node for free only while $2r\le\alpha$;
past that each output bit costs $2^{2r-\alpha}$ LUT$\alpha$. LinArch's stage
needs $r+k\le\alpha$ and $k$ can always be dropped to 1, so LinArch degrades as
$2^{r+1-\alpha}$; BTCD has no such knob, because $r$ enters *twice* and nothing
in the node is under the designer's control. On a LUT6 the free zone is $r\le3$,
i.e. $D\le7$. Table 13.5 (p. 440) shows the cliff: at $D=9$ ($r=4$, node $=8$ in
/ 4 out) atomic BTCD costs 218 LUT against LinArch's 87 — BTCD is now the
*larger* of the two. ASIC has no such cliff; there the node is a $2r$-input
Boolean function synthesised directly and the $w\log w$ node count is the whole
cost story.

$$\boxed{\ R_{[j..i]} \;=\; \bigl(a_d\,R_{[j..i+d]} \;+\; R_{[i+d-1..i]}\bigr)\bmod D,
\qquad a_d = 2^{kd}\bmod D\ }$$

where $R_{[b..a]}$ is the residue mod $D$ of the digit run $X_b\ldots X_a$, $d$
the digit span of the low operand, and $a_d$ a per-level constant. Associativity
of this operator is what licenses any bracketing, hence any tree.

**When it breaks.**

- **$w$ too small.** At $w=8$, $D=3$, Table 13.4 gives BTCD 12 LUT / 3.6 ns and
  LinArch 8 LUT / 3.7 ns: identical delay, 50% more area. Below $m\approx8$ the
  $\log_2 m$ saving is under two levels and does not pay. BTCD earns its keep
  from $w=32$ upward.
- **$r > 3$ on a LUT6.** The $2r$-input node overflows the fabric cell at
  $2^{2r-\alpha}$ per output bit; $D=9$ already loses to LinArch on area.
- **Throughput rather than latency is the target.** LinArch pipelines to one
  division per cycle by cutting its chain wherever timing closes; BTCD's
  advantage is purely combinational latency. If you can pipeline, the $\log w$
  area factor buys nothing.
- **Quotient not needed.** Building the full prefix network and then discarding
  $m-1$ of its outputs wastes roughly $\log m$ in area — use the reduction-tree
  form, [[Remainder-Only BTCD]].
- **$D$ composite.** Factoring wins on area and loses on latency: $D=15$,
  $w=32$ is 75 LUT / 9.4 ns as $3\times5$ against BTCD's 199 LUT / 5.8 ns
  (Table 13.5). See [[Composite Constant Divider]].
- **$D$ large or prime.** $r$ is then large, the node explodes, and the
  reciprocal route is the only one whose cost ignores $D$'s magnitude —
  [[Recip Constant Divider]].

**RTL (Spade).** $D=7$, $w=16$, $k=2$, so $r=3$, $m=8$ digits, a Kogge-Stone
prefix of 3 levels with per-level constants $a_1=4$, $a_2=2$, $a_4=4$ — note
$4^4 = 256 \equiv 4 \pmod 7$, so the constants never settle to 1 the way they do
for $D=3$ with even $k$, where every $a_d=1$ and the tree degenerates into a
mod-3 adder tree.

```spade
// prefix node: fold a higher segment's residue `hi` onto a lower one `lo`,
// where the low segment spans d digits, so a = (2^k)^d mod D — a per-level constant
fn node(a: uint<6>, hi: uint<3>, lo: uint<3>) -> uint<3> {
    let y: uint<6> = a *. zext::<3, 6>(hi) +. zext::<3, 6>(lo);
    trunc(y `std::ops::comb_mod` 7)
}

// leaves: X_i < 2^k = 4 < D = 7, so each digit is already its own residue
fn digits(x: uint<16>) -> [uint<3>; 8] {
    let b = x.as_bits();
    [zext::<2,3>(b[0..2].as_uint()),   zext::<2,3>(b[2..4].as_uint()),
     zext::<2,3>(b[4..6].as_uint()),   zext::<2,3>(b[6..8].as_uint()),
     zext::<2,3>(b[8..10].as_uint()),  zext::<2,3>(b[10..12].as_uint()),
     zext::<2,3>(b[12..14].as_uint()), zext::<2,3>(b[14..16].as_uint())]
}

// Kogge-Stone levels, offsets d = 1, 2, 4; a_d = 4^d mod 7 = 4, 2, 4
fn lvl1(t: [uint<3>; 8]) -> [uint<3>; 8] {
    [node(4,t[1],t[0]), node(4,t[2],t[1]), node(4,t[3],t[2]), node(4,t[4],t[3]),
     node(4,t[5],t[4]), node(4,t[6],t[5]), node(4,t[7],t[6]), t[7]]
}
fn lvl2(t: [uint<3>; 8]) -> [uint<3>; 8] {
    [node(2,t[2],t[0]), node(2,t[3],t[1]), node(2,t[4],t[2]), node(2,t[5],t[3]),
     node(2,t[6],t[4]), node(2,t[7],t[5]), t[6], t[7]]
}
fn lvl4(t: [uint<3>; 8]) -> [uint<3>; 8] {
    [node(4,t[4],t[0]), node(4,t[5],t[1]), node(4,t[6],t[2]), node(4,t[7],t[3]),
     t[4], t[5], t[6], t[7]]
}

// quotient digit: Q_i = floor((X_i + 2^k R_{i+1}) / D), no carry to its neighbours
fn qdig(xd: uint<3>, r: uint<3>) -> uint<2> {
    let y: uint<5> = (zext::<3,5>(r) <<. 2) +. zext::<3,5>(xd);
    trunc(y `std::ops::comb_div` 7)
}

entity btcd7_16(x: uint<16>) -> uint<19> {
    let d = digits(x);
    let r = lvl4(lvl2(lvl1(d)));      // r[i] = R_i, the residue of digits 7..i
    let q = qdig(d[7], 0)
        .concat(qdig(d[6], r[7])).concat(qdig(d[5], r[6]))
        .concat(qdig(d[4], r[5])).concat(qdig(d[3], r[4]))
        .concat(qdig(d[2], r[3])).concat(qdig(d[1], r[2]))
        .concat(qdig(d[0], r[1]));
    q.concat(r[0])                    // Q on 16 bits, R on 3
}
```

`node` is one filled circle in the diagram, and `lvl1`/`lvl2`/`lvl4` are its
three rows with the pass-throughs written out as the bare `t[i]` entries; `qdig`
is the detached box on the right, instantiated eight times. Everything is
combinational — no `reg`, one sweep — and the widths are the diagram's labels:
$r=3$ on every tree wire, $k=2$ per digit in and per quotient digit out,
$19 = 16 + 3$ on the packed output. `comb_mod`/`comb_div` read as behavioural
dividers, but both have the literal 7 as divisor and a 6- and 5-bit dividend, so
synthesis constant-folds each into the single $2r$-in/$r$-out and
$(k{+}r)$-in/$k$-out table the architecture calls for rather than the subtractive
divider the operator name suggests. The top quotient digit is
$\lfloor X_7/7\rfloor = 0$, so bits 15:14 of `q` are provably zero and the true
quotient width is $w - \lfloor\log_2 D\rfloor = 14$.

Verified by exhaustive simulation: all $2^{16}$ inputs, plus a 3000-vector
random sweep and eleven named asymmetric cases (`0x8001`, `0x0180`, 128, 129,
65535), checked against Verilog's `x/7` and `x%7`.

**Related notes.**

- [[LinArch Divider]] – extends: the same recurrence evaluated as a chain; BTCD
  reassociates exactly this note's $\otimes$ into a tree.
- [[Remainder-Only BTCD]] – extends: drop the quotient and the prefix network
  collapses to a plain reduction tree, the regime where BTCD dominates outright.
- [[Parallel Prefix Adders]] – compares: the identical associativity argument
  applied to the carry recurrence.
- [[Kogge-Stone Tree]] – supports: the $m\log m$-node, $\log m$-level network
  used above.
- [[Brent-Kung Tree]] – supports: the $\approx 2m$-node alternative, half the
  area at twice the depth.
- [[CLA, Carry-Lookahead Adder]] – compares: its $(g,p)$ operator is the
  carry-chain instance of the affine-composition operator boxed here.
- [[Composite Constant Divider]] – counter-example: factoring $D$ beats BTCD on
  area while losing on latency.
- [[Recip Constant Divider]] – counter-example: the only route whose cost is
  indifferent to the size of $D$.
- [[Choosing a Constant Divider]] – compares: where this sits against every
  sibling.
- [[Sequential Constant Divider]] – compares: the opposite extreme, one table
  reused for $m$ cycles.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- §13.3 Parallel division — p. 434 (the entire BTCD text in the book)
- §13.4.2 Remainder-only variant of LinArch and BTCD; the $2r$-in / $r$-out node
  — p. 436
- Table 13.4, LinArch against BTCD, remainder-only against Q+R,
  $w\in\{8,\dots,128\}$, $D\in\{3,5\}$, Kintex-7 — p. 437
- Table 13.5, atomic BTCD against Recip, LinArch and composite dividers,
  $D\in\{9,15\}$ — p. 440
- §13.2.2 Alg. 13.1 and Lemma 13.2, the recurrence and digit bounds reused here
  — pp. 431–432

Primary sources, cited on p. 441: [Uğu+16] Uğurdağ, Bayram, Levent & Gören,
*Efficient Combinational Circuits for Division by Small Integer Constants*,
ARITH 2016; [Uğu+17] Uğurdağ, de Dinechin, Gener, Gören & Didier, *Hardware
division by small integer constants*, IEEE Trans. Computers 66(12), 2017,
pp. 2097–2110 — the full BTCD construction lives here, not in the textbook.
