---
title: LinArch Divider
description: "The recurrence unrolled into m chained tables — no adder anywhere on the datapath, area and delay both linear in w, and it pipelines to one exact quotient-and-remainder per cycle."
kind: circuit
source: "ASA §13.2.2–§13.2.5, pp. 430-435"
status: seed
spade: simulated
tags: [digital, division, constant-divisor, lut, fpga]
aliases:
  - LinArch
  - Linear Table-Based Divider
  - Unrolled Constant Divider
  - Linear Architecture Divider
---

# LinArch Divider

Exact Euclidean division of a $w$-bit integer by a small compile-time constant $D$, built as $m=\lceil w/k\rceil$ digit tables chained left to right — the only constant divider whose datapath contains no adder at all.

```tikz title="LinArch unrolled datapath: 16-bit division by 3 in radix 16"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  lut/.style={draw, thick, minimum width=13mm, minimum height=9mm}]
  \foreach \i/\x in {3/0, 2/2.9, 1/5.8, 0/8.7} {
    \node[lut] (L\i) at (\x,0) {LUT $\i$};
    \node (X\i) at (\x,2.0) {$X_\i$};
    \node (Q\i) at (\x,-2.0) {$Q_\i$};
    \draw[->] (X\i) -- node[right,pos=0.5] {$k=4$} (L\i.north);
    \draw[->] (L\i.south) -- node[right,pos=0.5] {$k=4$} (Q\i);
  }
  \draw[->] (-2.3,0) node[left] {$R_4=0$} -- node[above] {$r=2$} (L3.west);
  \draw[->] (L3.east) -- node[above] {$R_3$} node[below] {$2$} (L2.west);
  \draw[->] (L2.east) -- node[above] {$R_2$} node[below] {$2$} (L1.west);
  \draw[->] (L1.east) -- node[above] {$R_1$} node[below] {$2$} (L0.west);
  \draw[->] (L0.east) -- node[above] {$2$} (11.2,0) node[right] {$R_0=R$};
  \node at (4.35,2.7) {$X$: 16 bits, MSB digit first};
  \node at (4.35,-2.7) {$Q$: 16 bits};
  \node[align=center,font=\scriptsize] at (4.35,-3.6)
    {each LUT: $k+r=6$ bits in, $k+r=6$ bits out, $D\cdot 2^k=48$ useful entries\\
     the ``$+$'' of $Y_i=X_i+2^kR_{i+1}$ is pure wiring: $R_{i+1}$ placed above $X_i$};
\end{circuitikz}
\end{document}
```

*after Fig. 13.3, p. 433.*

**Read the input in radix $2^k$ and long division becomes a chain.** Cut the $w$-bit unsigned $X$ (a $\mathrm{ufix}(w-1,0)$, see [[Number Formats]]) into $m=\lceil w/k\rceil$ chunks of $k$ bits,
$$X=\sum_{i=0}^{m-1}X_i\,2^{ki},\qquad X_i\in\{0,\dots,2^k-1\}$$
which is a relabelling of the bits, not a computation. Write $r=\lceil\log_2(D-1)\rceil$ for the width of a remainder — also the width of $D$ itself, since $D$ is not a power of two. The architecture is then paper-and-pencil long division taken literally: sweep the digits most-significant first, carrying a partial remainder $R_{i+1}$ on $r$ bits from each step into the next.

$$
\begin{aligned}
&R_m \leftarrow 0\\
&\textbf{for } i=m-1 \textbf{ down to } 0:\\
&\qquad Y_i \leftarrow X_i + 2^k R_{i+1} &&\text{// } (k{+}r)\text{-bit concatenation, not an addition}\\
&\qquad (Q_i,R_i) \leftarrow \bigl(\lfloor Y_i/D\rfloor,\; Y_i \bmod D\bigr) &&\text{// one table read}\\
&\textbf{return } \Bigl(Q=\textstyle\sum_i Q_i2^{ki},\; R=R_0\Bigr)
\end{aligned}
\tag{Alg. 13.1}
$$

**The chain computes the right thing, by telescoping.** The table's defining property is $Y_i = DQ_i+R_i$. Substitute the loop body into the radix expansion and split the sum by distributivity:
$$X=\sum_{i=0}^{m-1}X_i2^{ki} = \sum_{i=0}^{m-1}\bigl(Y_i-2^kR_{i+1}\bigr)2^{ki} = \sum_{i=0}^{m-1}\bigl(DQ_i+R_i\bigr)2^{ki} - \sum_{i=1}^{m}R_i2^{ki}$$
the second sum being an index shift of the $2^kR_{i+1}2^{ki}=R_{i+1}2^{k(i+1)}$ terms. Every $R_i$ with $1\le i\le m-1$ appears once with each sign and cancels; $R_m=0$ by initialisation. What survives is
$$X = D\sum_{i=0}^{m-1}Q_i2^{ki} + R_0$$
Exactly one Euclidean pair satisfies $X=DQ+R$ with $0\le R<D$, so this *is* the pair. **Accuracy is 0 ulp and there is no error budget** — unlike the [[Recip Constant Divider]], which reaches exactness through an inequality on a truncated product, LinArch reaches it through an invariant that holds digit by digit.

**Nothing accumulates, so nothing needs an adder.** Two facts about the stage, both established in [[Constant Division Digit Table]], make the drawing above the whole circuit. First, $0\le Y_i\le 2^kD-1$, so the table has $k+r$ address bits and its size is fixed by $D$ and $k$ alone — it does not grow with $w$. Second, that bound forces $Q_i=\lfloor Y_i/D\rfloor\le 2^k-1$, so each $Q_i$ is a genuine radix-$2^k$ digit and the concatenated $Q_{m-1}\Vert\cdots\Vert Q_0$ *is* the binary quotient. No carry ever crosses a stage boundary. And the `+` in $Y_i \leftarrow X_i + 2^kR_{i+1}$ costs nothing either: $2^kR_{i+1}$ occupies bits $k\ldots k{+}r{-}1$ and $X_i$ occupies bits $0\ldots k{-}1$, disjoint positions, so the sum is a relabelling of wires — zero gates, zero delay. The critical path is $m$ [[Lookup-Tables]] in series and literally nothing else.

**Unrolling is what buys throughput.** Fold the recurrence onto one table plus a register holding $R$ and clock it $m$ times and you have the [[Sequential Constant Divider]]: $2^{r+k}(r+k)$ bits of table regardless of $w$, but $m$ cycles of latency and one operand in flight. Unroll it into $m$ table instances chained left to right — the figure above — and the latency becomes one combinational sweep with no control logic at all. The reason the book keeps only the unrolled form is that a chain of pure combinational stages accepts registers anywhere: cut it wherever timing closes and it pipelines to **one exact division per cycle**, which the sequential version cannot do at any depth without $m$-way interleaving.

**Cost is linear in $w$ in both dimensions**, where a general divider or multiplier is quadratic:
$$A_{\text{LinArch}} \sim \left\lceil\frac{w}{k}\right\rceil 2^{r+k}(r+k)\ \text{bits},\qquad T \sim \left\lceil\frac{w}{k}\right\rceil (r+k)$$
In ASIC, table area is proportional to the bits held. A table holding $D\cdot2^k$ live entries of $r+k$ bits is normally rounded up to the full $2^{r+k}$ address space, the surplus $2^{r+k}-D2^k$ rows being don't-cares that synthesis absorbs — which is why $D$ vanishes from the model. Table 13.2 (p. 435) confirms the elimination is real, not a modelling convenience: $D=5$ and $D=7$ share $r=3,k=3$ and synthesise to *identical* 45 LUT / 9.3 ns, as do $D=9$ and $D=11$ at 87 LUT / 17.9 ns.

**On an FPGA the exponent in $k$ mostly disappears, and that fixes $k$.** The fabric's cell is a LUT$\alpha$ — $\alpha$ inputs, one output, $\alpha\in[4,6]$ (see [[FPGAs]]) — and it costs the same whether you drive all $\alpha$ inputs or two of them. So there is no point choosing $k$ with $r+k<\alpha$: you would pay for a whole LUT$\alpha$ per output bit and leave address lines idle. Above $\alpha$ the built-in multiplexers assemble small LUTs into large ones, so an $(r+k)$-input, $(r+k)$-output table costs $2^{r+k-\alpha}$ LUT$\alpha$ per output bit rather than $2^{r+k}$:
$$A_{\text{LinArch}}\;\approx\;\left\lceil\frac{w}{k}\right\rceil\,2^{\max(r+k-\alpha,\,0)}(r+k)\ \ \text{LUT}\alpha$$
Minimising over $k$ is now trivial — the bracket is flat for $r+k\le\alpha$ and exponential after, while $\lceil w/k\rceil$ falls monotonically, so take the **smallest $k$ that saturates the LUT**, $k=\alpha-r$, valid whenever $r<\alpha$. The formula collapses to one line that reproduces every estimate in Table 13.2 ($w=32$, $\alpha=6$): $D=3$ gives $r=2,k=4,\lceil32/4\rceil\cdot6=48$; $D=5$ gives $\lceil32/3\rceil\cdot6=66$; $D=9$ gives $16\cdot6=96$; $D=17$ has $r=5$, forcing $k=1$ and $32\cdot6=192$.

$$\boxed{\ (Q_i,R_i)=\mathrm{tbl}\bigl(R_{i+1}\Vert X_i\bigr),\quad R_m=0,\quad Q=Q_{m-1}\Vert\cdots\Vert Q_0,\quad R=R_0 \qquad A\approx\left\lceil\frac{w}{\alpha-r}\right\rceil\alpha\ \text{LUT}\alpha\ \ (r<\alpha)\ }$$

Concretely for $D=3$ on a 6-LUT fabric: $r=2$, $k=4$, radix 16, six LUT6 per stage, so $\lceil w/4\rceil\times6$ — 36 LUT6 for a 24-bit single-precision significand, 78 for a 53-bit double, and 32 measured LUT for $w=32$ against 48 predicted.

## When it breaks

- **$r\ge\alpha$, i.e. $D\ge 2^\alpha$.** The $2^{r+k-\alpha}$ term reappears and $k$ is pinned to 1, so the chain becomes one LUT per input *bit*: $D=17$ costs 165 LUT / 18.5 ns at $w=32$, and $D=45$ ($r=6=\alpha$) costs 371 LUT / 24.3 ns. LinArch is a small-constant technique; factor the divisor instead — [[Composite Constant Divider]].
- **Latency scales with $w$.** $m$ dependent lookups is a ripple, and 26.3 ns at $w=128$ for $D=3$ (Table 13.4, p. 437) is the price. If latency dominates, [[Binary Tree Constant Divider]] restructures the same dependency into a tree for $O(\log w)$ delay.
- **Remainder-only saves area but not time.** Dropping the $Q_i$ outputs shrinks each table by the factor $r/(r+k)$ and nothing else, because the critical path is the $R_i$ chain you still need in full — see [[Remainder-Only LinArch]]. If you want only $R$, the tree wins outright.
- **$D$ must be a synthesis-time constant, and not a power of two** — the latter is a wire shift, and a runtime divisor puts you back in [[Dividers]].
- **Pipelining is not free in registers.** Cutting the chain into $m$ stages costs $O(m^2)$ flip-flops of balancing on the quotient digits, since $Q_{m-1}$ is produced at stage 1 but must arrive with $Q_0$ at stage $m$.

## RTL (Spade)

```spade
/// One LinArch stage: the D=3, k=2 digit table (r=2).
/// Address is R_{i+1} || X_i on k+r = 4 bits; output is (Q_i, R_i), k+r = 4 bits.
fn div3_step(y: uint<4>) -> (uint<2>, uint<2>) {
    match y {
        0  => (0, 0),  1  => (0, 1),  2  => (0, 2),
        3  => (1, 0),  4  => (1, 1),  5  => (1, 2),
        6  => (2, 0),  7  => (2, 1),  8  => (2, 2),
        9  => (3, 0),  10 => (3, 1),  11 => (3, 2),
        _  => (0, 0),          // Y >= 2^k*D is unreachable: don't-cares
    }
}

/// LinArch, w = 8, D = 3, k = 2: m = 4 stages chained MSB digit first.
fn linarch8_div3(x: uint<8>) -> (uint<8>, uint<2>) {
    let b = x.as_bits();
    let (q3, r3) = div3_step(0u2.concat(b[6..8].as_uint()));
    let (q2, r2) = div3_step(r3.concat(b[4..6].as_uint()));
    let (q1, r1) = div3_step(r2.concat(b[2..4].as_uint()));
    let (q0, r0) = div3_step(r1.concat(b[0..2].as_uint()));
    (q3.concat(q2).concat(q1).concat(q0), r0)
}
```

`div3_step` is one box of the diagram; the four calls are the four boxes, and `r3`…`r1` are the horizontal wires between them. Each `concat` is the $Y_i=X_i+2^kR_{i+1}$ of the recurrence — `concat` on integers puts its left operand high, so `r3.concat(x2)` places the remainder above the digit, which is the whole reason no adder appears. The final `q3.concat(q2).concat(q1).concat(q0)` is the quotient assembly: $2+2+2+2=8$ bits, MSB digit leftmost, no carry. Everything is a `fn`, hence purely combinational — this is the unrolled form, and pipelining it means inserting `reg;` stages, which turns it into a `pipeline` and forces the quotient-digit balancing registers noted above. Synthesis will not build four 4-bit ROMs: it flattens the `match` into logic and, on an FPGA, packs each stage into $r+k=4$ LUT4s — which is precisely the "no point choosing $r+k<\alpha$" waste, since $k=4$ would fill a LUT6 for the same cell count.

## Related Notes

- [[Constant Division Digit Table]] – depends-on: supplies the stage, the bound $Y_i\le 2^kD-1$, and the digit property that makes the chain carry-free.
- [[Sequential Constant Divider]] – compares: the same recurrence folded onto one table, trading $m$-cycle latency for $O(1)$ area.
- [[Binary Tree Constant Divider]] – extends: reassociates this chain into a tree, exactly as a parallel-prefix adder does to an [[RCA, Ripple-Carry Adder]].
- [[Remainder-Only LinArch]] – extends: drops the quotient outputs for a factor $r/(r+k)$ in area at unchanged delay.
- [[Composite Constant Divider]] – counter-example: when $r\ge\alpha$ this architecture collapses, and two chained LinArch chains beat one.
- [[Recip Constant Divider]] – compares: exactness by error budget on a constant multiplication rather than by invariant, $O(w^2)$ area but indifferent to $D$.
- [[Choosing a Constant Divider]] – compares: where this sits against every sibling on area, delay and achievable $D$.
- [[Multiplication by Constants]] – supports: the sibling problem, whose techniques the composite variant needs for the remainder reconstruction.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- §13.2.1 Radix-$2^k$ representation, Eq. (13.2) — p. 430
- §13.2.2 Algorithm 13.1, Eq. (13.3), Theorem 13.1, Lemmas 13.1–13.2 — pp. 431–432
- §13.2.3 Iterative or unrolled implementation; Figs. 13.2–13.3 — pp. 432–433
- §13.2.4 Cost evaluation of LinArch — pp. 432–433
- §13.2.5 FPGA-specific remarks; Table 13.2 (LinArch, 32-bit, Kintex-7) — pp. 434–435
- Table 13.4 (LinArch at $w=8\ldots128$) — p. 437
- Table 13.5 (atomic LinArch for $D=45$) — p. 440

Primary source: [DD12] de Dinechin & Didier, "Table-Based Division by Small Integer Constants", ARC 2012; earlier as a combinational-circuit exercise in [Pap06] Paplinski, *CSE2306/1308 Digital Logic*, Lecture 8, Monash 2006.
