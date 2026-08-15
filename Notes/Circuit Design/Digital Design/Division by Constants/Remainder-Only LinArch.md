---
title: "Remainder-Only LinArch"
description: "X mod D by dropping the quotient outputs from every table: area falls by the predictable factor r/(r+k), delay is unchanged because the remainder chain is the critical path."
kind: circuit
source: "ASA §13.4.2, pp. 435-437; Fig. 13.3, p. 433; Table 13.4, p. 437"
status: seed
spade: simulated
tags: [digital, division-by-constants, modulo, lut, fpga]
aliases:
  - LinArch/R
  - Remainder-Only LinArch Divider
  - LinArch Modulo
---

# Remainder-Only LinArch

The [[LinArch Divider]] with the quotient field deleted from every table: it computes $X \bmod D$ alone, at $r/(r+k)$ of the area and at exactly the same delay.

```tikz title="Remainder-only LinArch: 16-bit modulo 3 in radix 16"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  lut/.style={draw, thick, minimum width=13mm, minimum height=9mm}]
  \foreach \i/\x in {3/0, 2/2.9, 1/5.8, 0/8.7} {
    \node[lut] (L\i) at (\x,0) {$R$-LUT $\i$};
    \node (X\i) at (\x,1.9) {$X_\i$};
    \draw[->] (X\i) -- node[right,pos=0.45] {$k=4$} (L\i.north);
    \draw[dashed,gray,->] (L\i.south) -- (\x,-1.1) node[below,gray] {\scriptsize $Q_\i$};
  }
  \draw[->] (-2.4,0) node[left] {$R_4=0$} -- node[above] {$r=2$} (L3.west);
  \draw[->] (L3.east) -- node[above] {$R_3$} node[below] {$2$} (L2.west);
  \draw[->] (L2.east) -- node[above] {$R_2$} node[below] {$2$} (L1.west);
  \draw[->] (L1.east) -- node[above] {$R_1$} node[below] {$2$} (L0.west);
  \draw[->] (L0.east) -- node[above] {$2$} (11.3,0) node[right] {$R_0=X \bmod 3$};
  \node at (4.35,2.6) {$X$: 16 bits, MSB digit first};
  \node[gray,align=center,font=\scriptsize] at (4.35,-1.9)
    {the deleted quotient column: not stored, not wired, not assembled};
  \node[align=center,font=\scriptsize] at (4.35,-2.8)
    {each $R$-LUT: $k+r=6$ address bits, $r=2$ output bits instead of $6$\\
     area $\times\,r/(r{+}k)=1/3$; the $R_i$ chain, and hence the delay, is untouched};
\end{circuitikz}
\end{document}
```

*after Fig. 13.3, p. 433, with the quotient column removed.*

**Separate the table's two output fields by what consumes them.** A LinArch stage is one table addressed by $Y_i = X_i + 2^kR_{i+1}$ on $k+r$ bits — a concatenation, since the $k$-bit digit $X_i$ and the $r$-bit incoming remainder $R_{i+1}$ occupy disjoint positions. It emits two fields: $Q_i$ on $k$ bits and $R_i$ on $r$ bits. Their fates are not symmetric. $R_i$ is *consumed by the next stage*, so it is a dependency in a chain of length $m=\lceil w/k\rceil$. $Q_i$ is consumed by nobody: because $Q_i \le 2^k-1$ (the second consequence of Lemma 13.2), the digits need no carry propagation and go straight to output pins, where the concatenated $Q_{m-1}\Vert\cdots\Vert Q_0$ *is* the $w$-bit binary quotient. Cutting an output that feeds nothing is a purely local edit: delete the $k$ pins, and the $k$ columns of table that drove them delete themselves.

**Count what survives.** In ASIC the area of a table is proportional to the bits it holds, and rounding the address space up to a power of two, each stage falls from $2^{k+r}(k+r)$ bits to $2^{k+r}r$ bits — a factor of $r/(r+k)$ that you can compute before writing a line of HDL. On FPGA the same factor appears for a different reason. A LUT$\alpha$ has one output, so a $(k+r)$-input, $n$-output table costs $n\cdot 2^{\max(k+r-\alpha,0)}$ LUT$\alpha$ ([[Lookup-Tables]]): **cost is linear in the number of output bits and exponential only in the address width**. Dropping $k$ of the $k+r$ output bits therefore scales the LUT count by the same $r/(r+k)$, and the whole operator costs

$$A_{\text{LinArch}/R}\;\approx\;\left\lceil\frac{w}{k}\right\rceil 2^{\max(r+k-\alpha,\,0)}\,r\quad\text{LUT}\alpha$$

For $D=3$ on a 6-LUT fabric, $r=2$ and the optimal $k=\alpha-r=4$, so the factor is $2/6=1/3$. Table 13.4 (p. 437) measures $w=32$ at 32 LUT $\to$ 11 LUT and $w=128$ at 128 $\to$ 43 — within one LUT of a third both times.

> [!important] The saving is linear, never exponential
> Nothing about the remainder-only variant shrinks the *address*. $Y_i$ still needs all $k$ bits of the dividend digit and all $r$ bits of the incoming remainder, so the exponential term $2^{r+k-\alpha}$ is untouched. You are cutting output columns, which is linear, out of a table whose depth is exponential. Remainder-only LinArch therefore inherits the parent's ceiling exactly: it is a technique for $r<\alpha$, i.e. $D<2^\alpha$, and it blows up at $D=45$ ($r=6$) just as fast as the full divider does.

**Expect no delay improvement, and read the measurements that way.** The critical path of LinArch is $R_{m-1}\to\cdots\to R_0$: $m$ table lookups in series, with no adder anywhere on the datapath. That path is composed entirely of the field you kept. Deleting the quotient removes no stage from it and merges no stages, so the model predicts an unchanged $T\sim\lceil w/k\rceil(r+k)$ — and measurement agrees at the level of placement noise, drifting a few percent in *either* direction: $D=3$, $w=32$ goes 6.0 ns $\to$ 6.5 ns, while $D=5$, $w=128$ goes 38.3 ns $\to$ 37.7 ns. Treat the delay as a constant of the architecture and spend the saved area elsewhere.

**Do not trust $r/(r+k)$ closer than a ranking.** The factor is derived from the predicted table cost, but synthesis absorbs the $2^{r+k}-D2^k$ don't-care rows unevenly between the two variants, and the full divider is already the bigger beneficiary. $D=3$, $w=32$ lands on the model ($11/32=0.34$ against $1/3$); $D=5$, $w=32$ does not ($30/45=0.67$ against a predicted $r/(r+k)=1/2$), because the $Q{+}R$ figure was itself already 45 LUT against a predicted 66. The model orders the choices correctly; it does not budget them.

**Recovering the quotient afterwards is not cheap, so decide up front.** $R$ does not determine $Q$ locally, but it does determine it globally: $X-R = DQ$ is an exact multiple, and $D$ is odd (a power-of-two divisor would be a wire shift), so $D$ is invertible modulo $2^w$ and $Q \equiv (X-R)\,D^{-1} \pmod{2^w}$, exactly, since $Q<2^w$. That is a full $w\times w$ constant multiplication ([[Multiplication by Constants]]) bolted onto a divider you chose specifically to avoid one — as expensive as having used the reciprocal method from the start. The remainder-only decision is architectural, not a late optimisation.

$$\boxed{\ A_{\text{LinArch}/R} = \frac{r}{r+k}\,A_{\text{LinArch}},\qquad T_{\text{LinArch}/R} = T_{\text{LinArch}}\ }$$

## When it breaks

- **Latency-bound designs get nothing.** The area halves or thirds, the delay does not move. If the divider is on the critical path, this variant is the wrong lever.
- **[[Remainder-Only BTCD]] takes over almost immediately.** Dropping the quotient collapses BTCD into a clean binary tree of $2r$-input, $r$-output tables, improving area *and* delay. At $D=5$, $w=32$ the two build the same number of 6-input 3-output LUTs — 30 LUT / 9.8 ns for LinArch against 29 LUT / 3.7 ns for BTCD. Same area, logarithmic delay instead of linear. By $w=128$ it is 126 LUT / 37.7 ns against 129 LUT / 5.2 ns. **If you need only the remainder, this note tells you what it costs; the answer is usually BTCD.**
- **The $r\ge\alpha$ cliff is inherited unchanged.** Once $D\ge 2^\alpha$ the optimal $k$ collapses to 1, $m=w$, and the $2^{r+k-\alpha}$ term reappears. Factor $D$ first ([[Composite Constant Divider]]).
- **Small $w$ is a wash.** At $w=8$, $D=5$ the saving is 9 LUT $\to$ 6 LUT; the fixed cost of the surrounding logic dominates and the architectural choice stops mattering.
- **Only $R_0$ is the remainder.** Every intermediate $R_i$ is a valid residue of a *prefix* of $X$, not of $X$. Tapping the chain early is a common way to build a circuit that is right on short inputs and wrong on long ones.

## RTL (Spade)

```spade
// Remainder-only LinArch table, D = 3, k = 4, r = 2.
// Address Y = R_{i+1} || X_i, k+r = 6 bits; output R_i on r = 2 bits ONLY.
// The Q_i column of the Euclidean table is simply never stored.
fn rtab3(y: uint<6>) -> uint<2> {
    let t: [uint<2>; 64] = [
        0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0,   // Y =  0..15
        1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1,   // Y = 16..31
        2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2,   // Y = 32..47
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,   // Y > 2^k D - 1: don't care
    ];
    t[y]
}

// m = w/k = 4 stages, MSB digit first. No quotient wire anywhere in the datapath.
entity mod3_16(x: uint<16>) -> uint<2> {
    let d = x.as_bits();
    let r4: uint<2> = 0;
    let r3 = rtab3(r4.concat(d[12..16].as_uint()));
    let r2 = rtab3(r3.concat(d[8..12].as_uint()));
    let r1 = rtab3(r2.concat(d[4..8].as_uint()));
    rtab3(r1.concat(d[0..4].as_uint()))
}
```

`rtab3` is one $R$-LUT of the diagram; `r4`…`r1` are the horizontal $R_i$ wires, 2 bits each, and the four `d[..]` slices are $X_3\dots X_0$, 4 bits each, taken MSB digit first — `as_bits()` indexes from the LSB, so the *first* stage reads the *highest* slice. `r.concat(x)` places $r$ high and $x$ low, which is the "$+$" of $Y_i=X_i+2^kR_{i+1}$: pure wiring, zero gates. The whole entity is combinational, so the 4-deep lookup chain is the critical path; register between stages and it pipelines to one residue per cycle. Only 48 of the 64 rows are reachable by Lemma 13.2 — the last 16 are written as zeros so the array is a legal power-of-two literal, and synthesis treats them as the don't-cares they are. Note what is *not* in the file: no $k$-bit output on any stage, no quotient assembly, no output word wider than 2 bits.

## Related Notes

- [[LinArch Divider]] – extends: the same chained-table datapath, with one of the table's two output fields deleted.
- [[Constant Division Digit Table]] – depends-on: the $(k{+}r)$-in, $(k{+}r)$-out stage table whose $Q_i$ column this variant drops, leaving $(k{+}r)$-in, $r$-out.
- [[Remainder-Only BTCD]] – compares: same specification and near-identical area, but logarithmic delay; the reason this note usually loses.
- [[Choosing a Constant Divider]] – compares: where a remainder-only requirement sits against every other variant.
- [[Composite Constant Divider]] – supports: factoring $D$ is what keeps $r<\alpha$ so the linear saving is not swamped by the exponential term.
- [[Lookup-Tables]] – supports: the LUT$\alpha$ cost model in which area is linear in output bits and exponential in address bits, which is the whole argument.
- [[Comparators]] – extends: a divisibility test is this circuit plus a zero-comparison on the 2-bit $R_0$, which lets synthesis shrink the final stage to a single output bit.
- [[Division by Constants]] – compares: the zero-ulp specification and the notation $w,k,r,m,\alpha$ used throughout.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- §13.4.2 Remainder-only variant of LinArch and BTCD — p. 436
- Table 13.4, remainder-only (R) versus Euclidean (Q+R) on Kintex-7, $D\in\{3,5\}$, $w\in\{8,\dots,128\}$ — p. 437
- Fig. 13.3, unrolled LinArch for $16/3$ at $k=4$, $r=2$; ASIC and delay cost models — p. 433
- §13.2.5 FPGA-specific remarks, the $2^{\max(r+k-\alpha,0)}(r+k)$ LUT$\alpha$ model — p. 434
- Lemma 13.2 and its two consequences — pp. 431-432
