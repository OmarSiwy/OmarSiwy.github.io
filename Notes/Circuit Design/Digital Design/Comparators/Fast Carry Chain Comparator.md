---
title: Fast Carry Chain Comparator
description: "Two aligned 2-bit chunks per BLE feed a synthetic subtraction on the dedicated carry chain: w/2 LUTs for X<Y, the area optimum and the latency optimum to 64 bits."
kind: circuit
source: "ASA §6.3.1 and Table 6.2, p. 148"
status: seed
spade: simulated
tags: [digital, comparators, fpga, lut, carry]
aliases:
  - Fast Carry Comparator
  - Fast Carry Chain Comparators
  - FPGA Comparator
  - Carry Chain Comparator
---

# Fast Carry Chain Comparator

An FPGA comparator that packs *two* aligned bits of $X$ and two of $Y$ into each basic logic element, so the dedicated carry chain resolves $X<Y$ in $\lceil w/2\rceil$ LUTs instead of the $w$ a plain subtracter would spend.

```tikz title="w=8 fast carry chain comparator: four BLEs, each holding one 2-bit chunk pair"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node[draw,minimum width=1.8cm,minimum height=1.0cm] (l3) at (0,0) {BLE$_3$};
\node[draw,minimum width=1.8cm,minimum height=1.0cm] (l2) at (2.6,0) {BLE$_2$};
\node[draw,minimum width=1.8cm,minimum height=1.0cm] (l1) at (5.2,0) {BLE$_1$};
\node[draw,minimum width=1.8cm,minimum height=1.0cm] (l0) at (7.8,0) {BLE$_0$};
\foreach \i in {0,1,2,3}{
  \draw[<-] ([xshift=-5mm]l\i.north) -- node[left,font=\tiny]{2} ++(0,1.0) node[above,font=\small]{$X_{\i}$};
  \draw[<-] ([xshift=5mm]l\i.north) -- node[right,font=\tiny]{2} ++(0,1.0) node[above,font=\small]{$Y_{\i}$};
}
\draw[->] (9.9,0) -- node[above,font=\tiny]{$c_0\!=\!1$} node[below,font=\tiny]{1} (l0.east);
\draw[->] (l0.west) -- node[above,font=\tiny]{$c_1$} node[below,font=\tiny]{1} (l1.east);
\draw[->] (l1.west) -- node[above,font=\tiny]{$c_2$} node[below,font=\tiny]{1} (l2.east);
\draw[->] (l2.west) -- node[above,font=\tiny]{$c_3$} node[below,font=\tiny]{1} (l3.east);
\draw[->] (l3.west) -- node[above,font=\tiny]{$c_4$} node[below,font=\tiny]{1} ++(-2.7,0)
  node[left,font=\small]{$\overline{c_4}=[X<Y]$};
\node[font=\tiny,align=center] at (3.9,-1.9)
  {each BLE: two LUT-4s of $(X_i,Y_i)$ emit $x'_i=[X_i>Y_i]$ and $\overline{y'_i}=[X_i\ge Y_i]$ (Table 6.2, p.\,148);\\
   the hard full adder then computes $x'_i+\overline{y'_i}+c_i$ on the dedicated carry chain};
\end{circuitikz}
\end{document}
```

*after Table 6.2, p. 148*

**Start from the carry-out, and notice what the naive mapping wastes.** $[X<Y]$ is the complement of the carry out of $X+\overline{Y}+1$; the derivation is in [[Magnitude Comparator]] and is not repeated here. Mapping that literally onto an FPGA instantiates a $w$-bit subtracter on the carry chain and throws away all $w$ sum bits, costing $w$ LUTs for one bit of output. The waste is not the discarded sums — those are free, they are just unrouted wires. The waste is that each carry stage is being asked to digest only **one** bit of $X$ and one bit of $Y$.

**Spend the second LUT the BLE already contains.** On most modern FPGAs a basic logic element computes $\mathrm{FA}\bigl(p(a,b,c,d),\,q(a,b,c,d),\,c_i\bigr)$ (Sect. 5.4, p. 125): *two* independent arbitrary 4-input functions of the same four inputs, feeding one hard full adder ([[Lookup-Tables]]). A subtracter uses one of them — $p=x_i\oplus\overline{y_i}$ with $q$ tied to $x_i$ — and leaves the other idle. Using both is where the factor of two comes from, and it is why the improvement is exactly $2$ and not some other constant: there are exactly two LUT outputs per carry stage.

> [!important] The saving is architectural, not algorithmic
> $\lceil w/2\rceil$ is not a better comparison algorithm than $w$. It is the same prefix reduction with twice as much of the operand pushed into each stage, because the silicon offers two 4-LUTs per hard full adder and the textbook subtracter only claims one. Any construction that keeps a carry stage fed with fewer than 4 operand bits is leaving the same factor on the table — see [[Ternary Adders on FPGAs]] for the addition-side version of exactly this argument.

**Feed each BLE two aligned 2-bit chunks.** Split $X$ and $Y$ ($w$ bits each, unsigned) into $\lceil w/2\rceil$ aligned chunks $X_i,Y_i$ of $2$ bits, so $(a,b,c,d)=(X_i,Y_i)$ saturates the LUT-4 width exactly. The two LUTs emit one bit each that compares the same way the chunks do (Table 6.2, p. 148):

| | $X_i<Y_i$ | $X_i=Y_i$ | $X_i>Y_i$ |
| --- | --- | --- | --- |
| $x'_i$ | 0 | 0 | 1 |
| $y'_i$ | 1 | 0 | 0 |

Because both LUTs are *arbitrary* functions, taking $\overline{y'_i}$ instead of $y'_i$ is free — the truth table is just written complemented — so the full adder receives $x'_i$ and $\overline{y'_i}$ directly with no inverter in the path.

**The synthetic subtraction has the right sign.** Collect the chunk bits into two $\lceil w/2\rceil$-bit unsigned integers $X'=\sum_i x'_i 2^i$ and $Y'=\sum_i y'_i 2^i$. By construction $x'_i$ and $y'_i$ are never both $1$, so $X'$ and $Y'$ differ first — reading from the most significant end — at the highest index $j$ where chunk $j$ disagrees; and there $x'_j>y'_j$ exactly when $X_j>Y_j$. Unsigned order is lexicographic on bits from the MSB down, so $\operatorname{sign}(X'-Y')=\operatorname{sign}(X-Y)$: comparing the synthetic pair answers the original question. Running $X'+\overline{Y'}+1$ on the fast carry logic and reading the carry out therefore gives $[X\ge Y]$, and the $+1$ is free because the chain's $c_0$ input is a hard constant.

**The chain performs the prefix reduction unchanged.** Tracing $x'_i+\overline{y'_i}+c_i$ against the encoding recovers the three carry roles verbatim:

| chunk verdict | $x'_i$ | $\overline{y'_i}$ | $c_{i+1}$ | prefix role |
| --- | --- | --- | --- | --- |
| $X_i>Y_i$ | 1 | 1 | $1$ | generate ($G_i$) |
| $X_i=Y_i$ | 0 | 1 | $c_i$ | propagate ($E_i$) |
| $X_i<Y_i$ | 0 | 0 | $0$ | kill |

This is the $(G,E)$ operator of [[Binary Tree Comparator]] with $(G,E)$ renamed $(g,p)$ — associativity is what lets the chunk boundaries be redrawn at all, and it is the same associativity proved once for [[Adders]]. The reason the chain still wins on FPGA despite its $O(w)$ depth is that its edges never leave the dedicated carry path, whereas a prefix tree's edges cross the general routing fabric; on the devices of [[FPGAs]] that difference is roughly two orders of magnitude per hop, so up to **64 bits** the $\lceil w/2\rceil$-long chain is also the best *latency* available (p. 148).

**Equality chunks wider, ordering cannot.** For $X=Y$ each chunk needs only **one** output bit — its equality flag — so a single LUT6 can absorb 3 bits of $X$ and 3 of $Y$, giving $\lceil w/3\rceil$ LUTs on recent AMD devices (p. 148). Ordering needs **two** bits out of each chunk, and two independent outputs from one logic element restrict how many inputs they may share, which pins the ordering variant at 2-bit chunks. This is the concrete cost of the asymmetry noted in Sect. 6.2: asking only for $X=Y$ genuinely buys a simplification, asking only for $X<Y$ does not.

**Worked example — 16 bits against a threshold.** Compare $X=\mathtt{0xB3A0}$ against $C=\mathtt{0xB3A7}$, $w=16$, so $\lceil16/2\rceil=8$ chunks in 8 BLEs. Chunking both LSB-first into 2-bit pieces:

| $i$ | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $X_i$ | 10 | 11 | 00 | 11 | 10 | 10 | 00 | 00 |
| $C_i$ | 10 | 11 | 00 | 11 | 10 | 10 | 01 | 11 |
| verdict | $=$ | $=$ | $=$ | $=$ | $=$ | $=$ | $<$ | $<$ |
| role | prop | prop | prop | prop | prop | prop | kill | kill |

so $X'=\mathtt{00000000}$ and $Y'=\mathtt{00000011}$. Seeded with $c_0=1$, stage 0 kills, stage 1 kills again, and stages 2–7 all propagate: $c_8=0$, hence $X\ge C$ is false and $\mathbf{X<C}$ — correct, since $\mathtt{0xB3A0}<\mathtt{0xB3A7}$. Note the shape of the reduction: the six top chunks abstain and the verdict decided at stage 0 survives untouched to the output. Had $X_1$ been $\mathtt{10}$ instead of $\mathtt{00}$, stage 1 would have *generated* and overridden stage 0 in a single carry step. Freezing $C$ lets a LUT see $\alpha$ bits of $X$ alone and widens the chunks further — that is [[Constant Comparator]], not this circuit.

Result, with $k=\lceil w/2\rceil$ chunks:

$$\boxed{\ [X<Y]\;=\;\overline{c_{k}},\qquad c_{i+1}=\mathrm{maj}\bigl(x'_i,\overline{y'_i},c_i\bigr),\quad c_0=1,\qquad \text{cost }\lceil w/2\rceil\text{ LUTs}\ }$$

> [!warning] The source calls $X<Y$ the carry out; it is the *complement* of the carry out
> Both p. 146 ("the sign bit of the subtraction $X-Y$ and is also its carry out") and p. 148 ("the $X<Y$ bit is the carry-out of $X-Y$") state this. Counterexample at $w=2$: $X=3$, $Y=1$. Then $X+\overline{Y}+1 = 3+2+1 = 6 = \mathtt{110}_2$, so $c_2=1$ while $X<Y$ is false. The carry out is $[X\ge Y]$; $[X<Y]$ is the *borrow*. Nothing downstream in the chapter depends on the polarity, but the RTL below does, and an inverter dropped here is a comparator that is wrong on every input.

**When it breaks**

- **Past roughly 64 bits** the $\lceil w/2\rceil$-stage carry propagation becomes the critical path and the latency crown moves to [[Two-Level Fast Carry Comparator]] — at strictly worse area, so only take it when latency actually binds.
- **Wanting more than one predicate.** $X<Y$ and $X\ge Y$ share one chain (complement the output). $X>Y$ and $X\le Y$ need the operands swapped, which is a *second* chain: $w$ LUTs, not $\lceil w/2\rceil$. Building all three orderings triples what you budgeted.
- **When $X-Y$ is wanted anyway.** Then the plain subtracter's $w$ LUTs produce the difference *and* the comparison, and the chunked version is a pure loss — it discards the sum bits it never computed.
- **When one operand is constant**, this is no longer the optimum: chunks widen from 2 bits to $\alpha$ and both area and depth fall by the same factor ([[Constant Comparator]]).
- **On ASIC** the premise evaporates. There is no BLE, no free second LUT and no hardened carry path, so the $O(\log w)$ prefix structure of [[Binary Tree Comparator]] is the right answer instead.

> [!warning] No measured numbers in this chapter
> Ch. 6 gives no synthesis table — no ns delays, no slice or LUT counts per device. The only quantitative claims made are the $\lceil w/2\rceil$ and $\lceil w/3\rceil$ formulas and the "best latency up to 64 bits" crossover. Anything more precise needs outside research.

**RTL (Spade)**

```spade
// Table 6.2: one 2-bit chunk pair -> (x'_i, y'_i). Two LUT-4s of the same
// four inputs; on real silicon the second LUT emits the complement directly.
fn verdict(xc: uint<2>, yc: uint<2>) -> (bool, bool) {
    (xc > yc, xc < yc)
}

// Chunk the operands LSB-first into the two synthetic C-bit integers X', Y'.
fn synth<#uint C>(x: uint<{2 * C}>, y: uint<{2 * C}>) -> (uint<C>, uint<C>) {
    gen if C == 0 {
        (0, 0)
    } else {
        let (g, l) = verdict(x.as_bits()[0..2].as_uint(), y.as_bits()[0..2].as_uint());
        let xh: uint<{2 * C - 2}> = trunc(x >> 2);
        let yh: uint<{2 * C - 2}> = trunc(y >> 2);
        let (gh, lh) = synth::<{C - 1}>(xh, yh);
        (gh.concat(g.as_uint()), lh.concat(l.as_uint()))
    }
}

// X' + ~Y' + 1 on the fast carry chain; bit C of the sum is the carry out.
fn cmp_lt<#uint C>(x: uint<{2 * C}>, y: uint<{2 * C}>) -> bool {
    let (xp, yp) = synth::<C>(x, y);
    let s: uint<{C + 1}> = (xp + (~yp)) +. 1;
    !s.msb()
}
```

`verdict` is the LUT pair inside one BLE of the diagram; `synth`'s recursion is the chain of BLEs, element $i$ of $X'$ landing on BLE$_i$. Widths: $2C=w$ in, $C=\lceil w/2\rceil$ per synthetic operand, and `xp + (~yp)` grows to $C+1$ bits so that `.msb()` *is* $c_k$ — hence `!s.msb()`, the complement flagged in the warning above. Everything is combinational; there is no `reg`. Synthesis will not build the literal $(C+1)$-bit adder shown: `xp + ~yp + 1` has one operand bit per LUT pair, so the mapper collapses it onto the hard carry chain and the sum bits are dropped as unloaded, which is the whole point of the construction.

Verified against a behavioural `<` at $w=8$ over all $65536$ operand pairs plus a $3000$-vector random sweep and eight named asymmetric cases (including $1<128$ and $\mathtt{0x3F}<\mathtt{0x40}$, which straddles a chunk boundary): $68544$ vectors, zero mismatches.

**Related Notes**

- [[Choosing a Comparator]] – compares: where this sits against every sibling; it is the default pick for $w\le 64$.
- [[Magnitude Comparator]] – depends-on: supplies the $\overline{c_w}=[X<Y]$ identity this circuit maps to hardware.
- [[Binary Tree Comparator]] – compares: the same $(G,E)$ prefix operator at $O(\log w)$ depth, and the answer on ASIC where the hard carry path does not exist.
- [[Equality Comparator]] – extends: the $X=Y$ predicate needs one output bit per chunk, so it chunks 3 bits wide instead of 2.
- [[Two-Level Fast Carry Comparator]] – extends: re-encodes chunk verdicts into a second carry chain once $\lceil w/2\rceil$ propagation is too deep.
- [[Constant Comparator]] – extends: freezing $Y$ collapses the leaves and widens the chunk to a full LUT.
- [[Lookup-Tables]] – depends-on: the $\mathrm{FA}(p,q,c_i)$ BLE with two independent 4-LUTs is the entire premise.
- [[Ternary Adders on FPGAs]] – supports: the same "claim the idle second LUT per carry stage" trick, applied to addition.
- [[FPGAs]] – depends-on: the dedicated carry path, whose speed relative to general routing is why an $O(w)$ chain beats an $O(\log w)$ tree here.
- [[Adders]] – supports: associativity of the carry operator, proved once there and reused unchanged.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 6 "Fixed-Point Comparison".
  - Sect. 6.1.2 Area and Delay Considerations, p. 146 — $X<Y$ from the subtraction's carry.
  - Sect. 6.2 Basic Binary Tree Comparison, p. 147 — the $X=Y$ / $X<Y$ asymmetry (one bit vs two).
  - Sect. 6.3.1 Exploiting Fast Carry Logic and **Table 6.2**, p. 148 — the $\lceil w/2\rceil$ construction, the $\lceil w/3\rceil$ equality variant, and the 64-bit latency crossover.
  - Sect. 5.4, p. 125 — the $\mathrm{FA}(p(a,b,c,d),q(a,b,c,d),c_i)$ BLE model, cited from p. 148.
- [PZC10] Perri, Zicari, Corsonello, "Efficient Absolute Difference Circuits in Virtex-5 FPGAs", *Melecon* 2010, pp. 309–313 (listed p. 150) — the original $w/2$-LUT comparator.
