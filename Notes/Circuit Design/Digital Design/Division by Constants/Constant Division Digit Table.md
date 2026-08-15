---
title: Constant Division Digit Table
description: "The (k+r)-in, (k+r)-out table that divides one radix-2^k digit prefixed by an incoming remainder; D*2^k useful entries, size independent of w, the loop body of every table-based constant divider."
kind: circuit
source: "ASA §13.2.1-13.2.5, pp. 429-435"
status: seed
spade: simulated
tags: [digital, division, constant-divisor, lookup-table, fpga]
aliases:
  - Digit Table
  - Division Digit Table
  - Constant Division LUT
  - LinArch Table
---

# Constant Division Digit Table

A combinational table that maps one incoming remainder concatenated with one radix-$2^k$ dividend digit to a quotient digit and an outgoing remainder — the only stateful-looking part of table-based constant division, and the one component whose size is fixed by $D$ and $k$ alone, never by the dividend width $w$.

```tikz title="One digit table: the loop body of long division, in decimal and in radix 2^k"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  tbl/.style={draw, thick, minimum width=26mm, minimum height=10mm, align=center},
  hl/.style={draw, thick, rounded corners=1pt}]

  % ---- left: paper-and-pencil 776 / 3, the algorithm the table implements
  \node at (0.55,2.35) {\itshape decimal, $D=3$};
  \node at (0.00,1.40) {$7$};  \node at (0.55,1.40) {$7$};  \node at (1.10,1.40) {$6$};
  \node at (0.00,0.70) {$1$};  \node at (0.55,0.70) {$7$};
  \node at (0.55,0.00) {$2$};  \node at (1.10,0.00) {$6$};
  \node at (1.10,-0.70) {$2$};
  \node[hl] at (0.00,1.40) [minimum width=5.5mm, minimum height=6mm] {};
  \node[hl] at (0.275,0.70) [minimum width=11mm, minimum height=6mm] {};
  \node[hl] at (0.825,0.00) [minimum width=11mm, minimum height=6mm] {};
  \draw[thick] (1.50,1.75) -- (1.50,-1.05);
  \draw[thick] (1.50,0.95) -- (3.05,0.95);
  \node at (1.80,1.40) {$3$};
  \node at (1.80,0.55) {$2$}; \node at (2.25,0.55) {$5$}; \node at (2.70,0.55) {$8$};
  \node[anchor=west] at (1.55,-0.70) {\scriptsize remainder};
  \draw[->] (0.55,1.13) -- (0.55,0.99);
  \draw[->] (1.10,1.13) -- (1.10,0.29);
  \draw[->] (1.10,-0.27) -- (1.10,-0.45);
  \node[align=center,font=\scriptsize] at (1.30,-1.55)
    {each boxed pair is one table read:\\ $17\div3\to(5,2)$, $26\div3\to(8,2)$};

  % ---- right: the same loop body as a binary table
  \node at (7.00,2.75) {\itshape binary, radix $2^k$};
  \draw[thick] (6.00,1.75) rectangle (7.00,2.15);
  \draw[thick] (7.00,1.75) rectangle (8.00,2.15);
  \node at (6.50,1.95) {$R_{i+1}$};
  \node at (7.50,1.95) {$X_i$};
  \node[font=\scriptsize] at (6.50,2.35) {$r$ bits};
  \node[font=\scriptsize] at (7.50,2.35) {$k$ bits};
  \draw[->] (4.30,1.95) -- node[below,font=\scriptsize,pos=0.38] {from stage $i{+}1$} (5.95,1.95);
  \draw[->] (7.00,1.72) -- node[right] {$Y_i$, $k+r$ bits} (7.00,0.90);
  \node[tbl] (T) at (7.00,0.40) {table for $D$\\$D\cdot 2^k$ useful rows};
  \draw[->] (6.40,-0.10) -- node[left] {$k$} (6.40,-0.95);
  \draw[->] (7.60,-0.10) -- node[right] {$r$} (7.60,-0.95);
  \node[anchor=north] at (6.40,-1.00) {$Q_i$};
  \node[anchor=north] at (7.60,-1.00) {$R_i$};
  \node[align=center,font=\scriptsize] at (7.00,-1.80)
    {$0\le Y_i\le 2^kD-1$ and $0\le Q_i\le 2^k-1$:\\ address width $k+r$, independent of $w$};

  \draw[->,thick] (3.30,0.40) -- node[above,font=\scriptsize] {same loop body} (4.60,0.40);
\end{circuitikz}
\end{document}
```

*after Fig. 13.1, p. 430.*

**Read long division as a hardware loop.** Divide $776$ by $3$ on paper: $7\div3$ gives digit $2$ remainder $1$; bring down the next digit and divide $17$ by $3$, giving $5$ remainder $2$; bring down again and divide $26$ by $3$, giving $8$ remainder $2$. The step that repeats is *itself a division* — but of a two-digit number whose leading digit is a remainder modulo $3$, hence at most $2$. There are only $30$ such operands, so the loop body is a 30-entry table, and that table divides a decimal number of *any* length by 3. Everything below is that observation carried into radix $2^k$.

**Cut the dividend into digits so the table has a fixed-width port.** With $X$ an unsigned $w$-bit integer, write it in radix $2^k$ as
$$X=\sum_{i=0}^{m-1}X_i\,2^{ki},\qquad X_i\in\{0,\dots,2^k-1\},\qquad m=\left\lceil\frac{w}{k}\right\rceil \tag{13.2}$$
This is a re-bracketing of the bit vector, not a computation: $X_i$ is the slice `X[k*i+k-1 : k*i]`. Let $r=\lceil\log_2(D-1)\rceil$ be the width of the largest possible remainder; since $D$ is not a power of two, $r$ is also the width of $D$. So the table's ports are $X_i$ on $k$ bits, an incoming remainder $R_{i+1}$ on $r$ bits, a quotient digit $Q_i$ on $k$ bits, and an outgoing remainder $R_i$ on $r$ bits. See [[Number Formats]] for the integer format this all sits in.

**The "bring down a digit" step is wiring, not arithmetic.** The partial dividend the table divides is
$$Y_i \;\leftarrow\; X_i + 2^k R_{i+1}$$
Written with a $+$, but $2^kR_{i+1}$ occupies bit positions $k\ldots k+r-1$ and $X_i$ occupies $0\ldots k-1$: the two operands have **disjoint support**, so the sum is a concatenation. No carry can be generated because no bit position receives two ones. Zero gates, zero delay — the entire "+" is the routing that places $R_{i+1}$ above $X_i$ on the address bus. This is why the datapath of a chain of these tables contains no adder anywhere.

**Bound the address, and the table stops depending on the dividend.** $R_{i+1}$ is either $0$ (loop initialisation) or a remainder modulo $D$, so $0\le R_{i+1}\le D-1$; and $0\le X_i\le 2^k-1$ by (13.2). Substituting both bounds into the concatenation,
$$0\;\le\;Y_i\;=\;X_i+2^kR_{i+1}\;\le\;(2^k-1)+2^k(D-1)\;=\;2^kD-1 \tag{Lemma 13.2}$$
Hence $Y_i<2^kD\le 2^{k+r}$: the address bus is $k+r$ bits wide and exactly $D\cdot2^k$ of its $2^{k+r}$ rows are reachable. Neither $w$ nor $m$ appears anywhere in that bound, because the only thing the previous stage passes forward is a value already reduced modulo $D$.

> [!important] The table is the whole design, and it is $w$-independent
> Every table-based constant divider — sequential, unrolled, remainder-only, composite — instantiates *this* table and differs only in how many copies it builds and how it wires them. A 128-bit divider by 3 and an 8-bit divider by 3 contain byte-identical tables; only the instance count changes. Choosing $D$ and $k$ therefore fully determines the per-stage cost, before you know $w$.

**Bound the output, and the quotient digits need no carry propagation.** From Lemma 13.2, $Q_i=\lfloor Y_i/D\rfloor\le\lfloor(2^kD-1)/D\rfloor=2^k-1$, by monotonicity of the floor. So each $Q_i$ genuinely fits in $k$ bits and is a legal radix-$2^k$ digit. That is the load-bearing consequence: the quotient digits produced by successive tables can simply be *placed side by side* as bit fields to form the binary quotient — there is never a carry out of one digit into the next, so no adder and no carry-propagation delay is needed to assemble $Q$ either.

**The table content, in full, for $D=3$, $k=2$.** Here $r=2$, so the table is 4 bits in and 4 bits out with $D\cdot2^k=12$ reachable rows; the address is $Y=R_{i+1}\Vert X_i$ and the datum is $Q_i\Vert R_i$.

| $Y$ | $Q_i$ | $R_i$ | | $Y$ | $Q_i$ | $R_i$ | | $Y$ | $Q_i$ | $R_i$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `0000` | `00` | `00` | | `0100` | `01` | `01` | | `1000` | `10` | `10` |
| `0001` | `00` | `01` | | `0101` | `01` | `10` | | `1001` | `11` | `00` |
| `0010` | `00` | `10` | | `0110` | `10` | `00` | | `1010` | `11` | `01` |
| `0011` | `01` | `00` | | `0111` | `10` | `01` | | `1011` | `11` | `10` |

Addresses `1100`–`1111` encode $R_{i+1}=3>D-1$ and are unreachable by Lemma 13.2 — four don't-care rows that synthesis is free to fill with whatever minimises the logic. Row `1011` is the extremal case $Y=2^kD-1=11$, and it returns $Q_i=3=2^k-1$: the bound is tight, and the table is never asked for a wider quotient digit than $k$ bits.

**Size it for the technology, because the two cost models disagree.** In ASIC the area of a table is essentially proportional to the bits it holds. Rounding the address space up to the next power of two — which costs nothing, since the extra rows are the don't-cares just identified — removes $D$ from the model entirely and leaves $2^{r+k}(r+k)$ bits, with delay proportional to the address width $(r+k)$. Table 13.2 (p. 435) confirms the removal empirically: $D=5$ and $D=7$ share $r=3,k=3$ and synthesise to *identical* area and delay (45 LUT, 9.3 ns), as do $D=9$ and $D=11$.

**On an FPGA the cost is a step function, and it dictates $k$.** The fabric's cell is a LUT$\alpha$ — $\alpha$ inputs, one output, $\alpha\in[4,6]$ — and it costs the same whether you drive all $\alpha$ address lines or two of them. So a $(k+r)$-input, $(k+r)$-output table costs

$$A \;\approx\; 2^{\max(r+k-\alpha,\ 0)}\,(r+k)\ \ \text{LUT}\alpha$$

the $2^{r+k-\alpha}$ factor appearing only above $\alpha$ because the fabric's built-in multiplexers assemble small LUTs into larger ones for free up to that point. Two consequences. Below $\alpha$ the table is *free to enlarge*: choosing $k$ with $r+k<\alpha$ pays for a full LUT$\alpha$ and wastes address lines, so **always take the smallest $k$ with $r+k\ge\alpha$**, i.e. $k=\alpha-r$ when $r<\alpha$. Above $\alpha$ the cost doubles per extra address bit. For $D=3$ on a 6-LUT device: $r=2$, $k=4$, radix 16, and one table is $6$ LUT6 — the concrete circuit the diagram's right panel draws. See [[Lookup-Tables]] for how the assembly multiplexers work.

$$\boxed{\;0\le Y_i\le 2^kD-1,\quad 0\le Q_i\le 2^k-1\ \Longrightarrow\ (k{+}r)\ \text{in},\ (k{+}r)\ \text{out},\ D\cdot2^k\ \text{useful rows}\;}$$

## When it breaks

- **$r\ge\alpha$.** The $2^{r+k-\alpha}$ term reactivates and every extra address bit doubles the table. $D=45$ has $r=6=\alpha$ on a 6-LUT device, forcing $k=1$: one bit of quotient per lookup, and the divider degenerates into a bit-serial chain. Past this point factor the divisor instead — [[Composite Constant Divider]].
- **$D$ a power of two.** Then $\lfloor X/D\rfloor$ is a wire shift and the table is pure waste. The whole construction assumes $D$ is not a power of two; that assumption is also what makes $r$ simultaneously the width of $D-1$ and of $D$.
- **Large $k$ chosen for speed.** Fewer stages, but table area is exponential in $k$. Above $r+k\approx\alpha+2$ the LUT count per stage grows faster than the stage count falls, and [[Recip Constant Divider]] — whose cost ignores $D$ entirely — takes over.
- **Mapping the table to block RAM.** Tempting at large $k$, but a [[Block Memory]] read is registered and its latency is a cycle, not a gate delay; that converts a combinational chain of $m$ tables into an $m$-cycle pipeline. Only the [[Sequential Constant Divider]], which is already clocked, tolerates it.
- **The don't-care rows are only don't-cares if the invariant holds.** Feed the table an $R_{i+1}\ge D$ — from a mis-sized register, or by chaining tables built for different $D$ — and it returns whatever the don't-care fill happened to produce. Nothing in the circuit range-checks its own input.

## RTL (Spade)

```spade
fn digit_step<#uint K, #uint R, #uint D>(rin: uint<R>, x: uint<K>) -> uint<{K + R}> {
    let y: uint<{R + K}> = rin.concat(x);
    let d: uint<{R + K}> = D;
    let q: uint<K> = trunc(y `std::ops::comb_div` d);
    let rout: uint<R> = trunc(y `std::ops::comb_mod` d);
    q.concat(rout)
}
```

`rin.concat(x)` *is* the "$+$" of $Y_i=X_i+2^kR_{i+1}$ — for integers `concat` puts its first argument in the high bits, so this places $R_{i+1}$ above $X_i$ and emits pure wiring, matching the split address rectangle in the diagram. The two `trunc` calls are the note's two bounds stated as types: `comb_div` and `comb_mod` return $K+R$ bits, and truncating them to $K$ and $R$ is exactly Lemma 13.2 and $Q_i\le2^k-1$ — if either bound were false this would silently drop a bit. The block is a `fn`, so it is combinational with no clock; the returned $K+R$ bits are one table row, $Q_i$ high and $R_i$ low.

Synthesis will not build the divider this code names. With `d` a constant, `comb_div`/`comb_mod` on a $k+r$-bit operand constant-fold to a $(k+r)$-input truth table — the twelve rows above — which the mapper then packs into $k+r$ LUT$\alpha$. The specification is written as a division because that is what the table *means*; the netlist contains no subtracter.

Verified by instantiating `digit_step::<4, 2, 3>` ($D=3$, $k=4$, $r=2$) and simulating: all 48 legal addresses exhaustively, seven named vectors including the asymmetric pair $(R_{i+1},X_i)=(0,1)$ versus $(1,0)$ — $Y=1$ against $Y=16$, which a swapped concatenation would fail — the extremal $Y=2^kD-1=47\to(15,2)$, and 3000 random addresses across the full 6-bit space against a behavioural `y/3, y%3` reference. 3055 vectors, zero mismatches.

## Related Notes

- [[LinArch Divider]] – extends: chains $m=\lceil w/k\rceil$ copies of this table left to right, one combinational sweep, no adder anywhere.
- [[Sequential Constant Divider]] – extends: folds the chain onto a single copy plus an $r$-bit remainder register, clocked $m$ times.
- [[Remainder-Only LinArch]] – extends: drops the $Q_i$ field from every row, shrinking each table from $k+r$ to $r$ output bits at unchanged delay.
- [[Binary Tree Constant Divider]] – compares: abandons this table's serial remainder dependency for a tree of $2r$-in, $r$-out tables, trading linear delay for logarithmic.
- [[Composite Constant Divider]] – counter-example: once $r\ge\alpha$ this table stops being cheap, and two tables for $D_a$ and $D_b$ beat one for $D_aD_b$.
- [[Recip Constant Divider]] – compares: the alternative whose cost is independent of the magnitude of $D$, at $O(w^2)$ area.
- [[Choosing a Constant Divider]] – compares: where a table-based divider sits against every sibling at a given $w$, $D$ and delay target.
- [[Lookup-Tables]] – depends-on: the LUT$\alpha$ cost model and the free assembly multiplexers that make $r+k\ge\alpha$ the right target.
- [[Block Memory]] – depends-on: the registered-read alternative to LUT mapping, viable only in the sequential variant.
- [[Combinational Logic]] – depends-on: the truth table this reduces to once $D$ is folded in.
- [[KCM, Table-Based Constant Multiplication]] – compares: the same "constant folded into a table addressed by one digit" trick, applied to multiplication instead of division.
- [[Table-Based Function Evaluation]] – compares: the general case, where the table is an approximation and carries an error budget; here it is exact and carries none.
- [[Number Formats]] – depends-on: the unsigned integer format of $X$, $Q$ and $R$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- Table 13.1, notations ($k$, $r$, $m$, $\alpha$) — p. 428
- §13.2, Fig. 13.1 (decimal $776/3$) — pp. 429–430
- §13.2.1 Radix-$2^k$ representation, Eq. (13.2) — p. 430
- §13.2.2 Algorithm 13.1, Eq. (13.3) defining $r$, Theorem 13.1, Lemmas 13.1–13.2 — pp. 431–432
- §13.2.4 Cost evaluation, $2^{r+k}(r+k)$ and the don't-care argument — p. 433
- §13.2.5 FPGA-specific remarks, LUT$\alpha$ cost and the choice of $k$; Table 13.2 — pp. 434–435

Primary source: [DD12] de Dinechin & Didier, *Table-Based Division by Small Integer Constants*, ARC 2012; the technique appears earlier as a combinational-circuit exercise in [Pap06] Paplinski, Monash lecture notes, 2006.
