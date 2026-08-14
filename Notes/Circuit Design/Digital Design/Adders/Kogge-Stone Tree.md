---
title: "Kogge-Stone Tree"
description: "Every output gets its own balanced tree shifted by one: minimum depth log2(w) with fan-out capped at 2, paid for in w*log2(w) nodes and a layout dominated by wire tracks."
kind: circuit
source: "ASA §5.3.6, pp. 118-123 (Figs. 5.16, 5.19)"
status: seed
spade: verified
tags: [digital, adder, prefix, carry, vlsi]
aliases:
  - KS
  - Kogge-Stone
  - Kogge-Stone Adder
  - Kogge-Stone Prefix Adder
  - Kogge-Stone Network
  - Kogge-Stone parallel prefix adder
---

# Kogge-Stone Tree

The parallel prefix network in which every carry is computed by its own balanced binary tree, offset one position from its neighbour's, so that minimum depth $\lceil\log_2 w\rceil$ is reached with **no node ever driving more than two consumers**.

```tikz title="Kogge-Stone 8-column prefix graph: depth 3, 17 nodes, fan-out 2; open nodes are full prefix operators, filled nodes are simplified (carry-only)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=-1.15cm,y=-1.0cm,font=\footnotesize,
  full/.style={circle,draw,fill=white,inner sep=1.9pt},
  simp/.style={circle,fill=black,inner sep=1.9pt}]
  \draw[gray!45] (0,0) -- (0,3.5);
  \node[above] at (0,0) {$c_0$};
  \node[below] at (0,3.6) {$c_0$};
  \foreach \i/\p in {1/0,2/1,3/2,4/3,5/4,6/5,7/6} {
    \draw[gray!45] (\i,0) -- (\i,3.5);
    \node[above] at (\i,0) {$(g_{\p},a_{\p})$};
    \node[below] at (\i,3.6) {$c_{\i}$};
  }
  \foreach \i/\j/\r in {2/1/1,3/2/1,4/3/1,5/4/1,6/5/1,7/6/1,
                        4/2/2,5/3/2,6/4/2,7/5/2}
    { \draw (\j,{\r-1}) -- (\i,\r); \node[full] at (\i,\r) {}; }
  \foreach \i/\j/\r in {1/0/1, 2/0/2,3/1/2, 4/0/3,5/1/3,6/2/3,7/3/3}
    { \draw (\j,{\r-1}) -- (\i,\r); \node[simp] at (\i,\r) {}; }
  \node[anchor=west,gray!60] at (-0.45,1) {span $1$};
  \node[anchor=west,gray!60] at (-0.45,2) {span $2$};
  \node[anchor=west,gray!60] at (-0.45,3) {span $4$};
  \node[full] at (7.0,4.55) {};
  \node[anchor=west] at (6.82,4.55) {full node $\circ$: $(2\ \mathrm{bit})\times(2\ \mathrm{bit})\to 2\ \mathrm{bit}$};
  \node[simp] at (7.0,5.15) {};
  \node[anchor=west] at (6.82,5.15) {simplified node: $(2\ \mathrm{bit})\times(1\ \mathrm{bit})\to 1\ \mathrm{bit}$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.19, p. 123; node shapes after Fig. 5.16, p. 121.*

**Fix the operator the tree is a tree of.** Each bit position $i$ contributes a 2-bit tuple $X_i=(g_i,a_i)$ — the **generate** bit $g_i=x_iy_i$ and the **alive** bit $a_i=x_i\vee y_i$, one bit each, both produced in a single gate level from the $w$-bit operands $X,Y$. The prefix operator composes two such tuples (Eqs. 5.35-5.37, p. 120):

$$(g_Z,a_Z)=(g_L,a_L)\circ(g_R,a_R)=\big(g_L\vee a_L g_R,\ \ a_L a_R\big)$$

Every edge in the graph above is therefore a **2-bit** bus, not one wire. $\circ$ is associative — the book proves it by substitution and distributivity of AND over OR in Eqs. 5.39-5.43, and that proof is the entire correctness argument for this circuit, so it is not repeated here; see [[Parallel Prefix Adders]]. Carry $c_{i+1}$ is the $g$-component of $X_i\circ X_{i-1}\circ\cdots\circ X_{-1}$ with $X_{-1}=(c_0,c_0)$ (Eq. 5.48, p. 121).

**Pick the bracketing whose sub-products nobody else wants.** Associativity means every parenthesization of that product is correct, so the design question is purely *which* sub-products to name. Kogge and Stone [KS73] answer: for output $c_{i+1}$, bracket the factors as a perfectly balanced tree rooted at position $i$. Write the $w=8$ case for $c_7$:

$$c_7=\big((X_6\circ X_5)\circ(X_4\circ X_3)\big)\circ\big((X_2\circ X_1)\circ X_0\big)$$

Its span-2 sub-products are $[6{:}5],[4{:}3],[2{:}1]$. Its neighbour $c_8$ balances the same way about position $7$ and therefore names $[7{:}6],[5{:}4],[3{:}2]$ — the *opposite parity of offset*. Two adjacent outputs never compete for the same sub-product, and the consequence is the property the whole structure exists for.

> [!important] Fan-out is capped at 2 everywhere, for every $w$
> A prefix node's output at column $i$, span $t$, feeds exactly two places: the node one level down in the same column $i$ (span $2t$), and the node one level down at column $i+t$. Nothing else in the graph can reference it, because every other output's balanced tree is offset onto the other parity. An output driving $f$ inputs sees $f\times$ the load capacitance, so either the edge slows or the driver grows and burns dynamic power (p. 121); [[Sklansky Tree]] reaches the same depth but pays $w/2$ here, and that constant is what makes Kogge-Stone the reference for high-frequency ASIC datapaths.

**Read the construction off the stage index.** Stages are indexed by their span $t=1,2,4,\ldots,2^{\lceil\log_2 w\rceil-1}$. At stage $t$, every position $i\ge t$ performs

$$[i:i-2t+1]\;=\;[i:i-t+1]\circ[i-t:i-2t+1]$$

and every position $i<t$ passes its tuple down untouched — its prefix already reaches the bottom. There is no reduction phase and no distribution phase: after $\lceil\log_2 w\rceil$ stages every span has length at least $w$, so every position holds $[i{:}0]$ directly. That absence is precisely what [[Brent-Kung Tree]] reintroduces in exchange for fewer nodes. Widths per stage: $2w$ bits in, $2w$ bits out, and the "combine with the neighbour $t$ down" is pure wiring — zero gates, but $t$ tracks of metal per bit.

**Count the nodes, then count the wires, because the wires are the bill.** Stage $t=2^k$ has $w-2^k$ nodes, so summing over the $\log_2 w$ stages,

$$\sum_{k=0}^{\log_2 w-1}\big(w-2^k\big)=w\log_2 w-\big(2^{\log_2 w}-1\big)=w\log_2 w-w+1$$

by the geometric sum $\sum_{k=0}^{n-1}2^k=2^n-1$. That is $17$ at $w=8$ — count the circles in the diagram. Ten of them are **full** operators ($2\times2\to2$ bits); the other seven are **simplified**: their span already reaches position $-1$, so their result *is* a final carry, no downstream node ever needs their $a$-component, and the operator degenerates to $(2\ \text{bit})\times(1\ \text{bit})\to 1\ \text{bit}$ (Fig. 5.16, p. 121). That is the open/filled distinction in the figure, and it is where roughly a third of the AND gates disappear. The wiring does not shrink: stage $t$ carries about $w$ horizontal spans of length $t$, so total wire length grows as $w\log_2 w$ *with long spans*, and in a real floorplan the routing tracks, not the gates, set the area. This is the "more resources than the Sklansky structure" the book flags on p. 122.

**Inject the carry-in only at the bottom row.** Everything above the last row of simplified nodes is a function of $X,Y$ alone; $c_0$ enters through $c_{i+1}=G_{i:0}\vee A_{i:0}c_0$, one AND-OR per bit, linear in $w$. Duplicating that one row for $c_0=0$ and $c_0=1$ yields $X+Y$ and $X+Y+1$ from a single tree — the [[Compound Adder]], the standard significand adder for floating-point rounding. Sum completion is one XOR per bit, $s_i=p_i\oplus c_i$ with $p_i=x_i\oplus y_i$ (note $p_i\ne a_i$: the tree needs *alive*, the sum needs *propagate*, and they differ exactly when $x_i=y_i=1$). Critical path at $w=8$: $1$ level for $(g_i,a_i)$, $3$ prefix stages, $1$ XOR — five levels against ten for [[RCA, Ripple-Carry Adder]]; at $w=64$ it is eight against sixty-six.

**On an FPGA the asymptotics are the wrong model.** A Kogge-Stone tree maps to soft logic and general routing, while `+` maps to the hardened carry chain, whose per-bit $\tau_\text{cp}\approx0.015\,\text{ns}$ on a Virtex 6 speed-grade 3 [Xil14] is an order of magnitude below one LUT delay. The linear chain therefore wins to well past 32 bits; see [[FPGA Hard Carry Chain Adder]]. [LPB19] only find prefix trees paying on 1024- to 8192-bit operands, and there they report a *quasi-linear relationship between prefix tree complexity and performance* — on FPGA the trees line up in a predictable order rather than trading off, because wire cost dominates uniformly. On ASIC the trade-off is real and Kogge-Stone sits at the minimum-depth corner.

$$\boxed{\ \text{depth}=\lceil\log_2 w\rceil,\qquad \text{nodes}=w\log_2 w-w+1,\qquad \text{fan-out}=2\ }$$

## When it breaks

- **Below $w\approx16$ on ASIC**, or anywhere off the critical path: an RCA is smaller and $\log_2 w$ versus $w$ is $4$ versus $16$ — not worth $w\log_2 w$ nodes plus the routing. See [[Choosing an Adder]].
- **On FPGA below a few hundred bits**: the hard carry chain is faster *and* smaller. The crossover is a property of the fabric, not of $w$.
- **When $w$ is not a power of two**: depth is $\lceil\log_2 w\rceil$ and the last stage is partly idle; the node count above is the power-of-two formula and over-counts otherwise.
- **When routing, not logic, is the constraint**: [[Brent-Kung Tree]] gives roughly $2/3$ the nodes and a fraction of the wire tracks for one extra stage, with fan-out a constant $3$.
- **When the inputs do not arrive together**: a uniform balanced tree is optimal only for a flat arrival profile. With skewed arrival or release times, shape the tree to the profile instead ([Zim97], Ch. 5).
- **Format, not adder**: the result is exact — $c_\text{out}S$ is $w+1$ bits and represents $X+Y+c_0$ with no rounding. Any error in the surrounding datapath is a format decision; see [[Signed Fixed-Point Format]].

## RTL (Spade)

The word-level form of the recurrence: "combine with the neighbour $t$ positions down" is a shift by $t$ on the whole $w$-bit generate and alive vectors.

```spade
fn kogge_stone_8(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
    // level 0: g_i = x_i y_i, a_i = x_i | y_i          (8 bits each)
    let g0 = x & y;
    let a0 = x | y;

    // stage t = 1, 2, 4: [i:i-2t+1] = [i:i-t+1] o [i-t:i-2t+1]
    let g1 = g0 | (a0 & (g0 << 1));
    let a1 = a0 & ((a0 << 1) | 0x01);
    let g2 = g1 | (a1 & (g1 << 2));
    let a2 = a1 & ((a1 << 2) | 0x03);
    let g3 = g2 | (a2 & (g2 << 4));
    let a3 = a2 & ((a2 << 4) | 0x0f);

    // c_{i+1} = G_{i:0} | A_{i:0} c_0   -- the simplified bottom row
    let cin8: uint<8> = if cin { 0xff } else { 0x00 };
    let cout8 = g3 | (a3 & cin8);

    // sum completion: s_i = (x_i ^ y_i) ^ c_i, c_0 = cin
    let cvec = (cout8 << 1) | (if cin { 0x01 } else { 0x00 });
    let s = (x ^ y) ^ cvec;
    cout8.as_bits()[7].as_uint().concat(s)
}
```

`(g1,a1)`, `(g2,a2)`, `(g3,a3)` are the three node rows of the diagram, one `uint<8>` per tuple component: bit $i$ of `g2` is $G_{i:i-3}$ and bit $i$ of `a2` is $A_{i:i-3}$. Each `<< t` is the whole diagonal edge set of one stage and costs wire, not gates. The `| 0x01`, `| 0x03`, `| 0x0f` masks force ones into the alive bits below the span — the low columns are supposed to pass through untouched, and without the mask they would AND against a shifted-in zero and lose their prefix; the generate vector needs no mask because a shifted-in zero is the identity for $\vee$. `cout8` is the row of simplified nodes and `s` the sum-completion XORs, neither of which Fig. 5.19 draws. It is entirely combinational — a `fn` cannot hold a `reg`, so the three stages are logic depth, not pipeline stages; promote it to a `pipeline(3)` `entity` with a `reg;` between levels to cut it, as in [[Pipelined Ripple-Carry Adder]]. Synthesis will not build 24 full nodes: it constant-folds every alive bit no consumer reads, which is exactly how the seven filled nodes in the drawing arise.

## Related Notes

- [[Parallel Prefix Adders]] – depends-on: supplies the associativity proof of $\circ$ that makes any bracketing, this one included, correct by construction.
- [[Sklansky Tree]] – compares: same minimum depth $\log_2 w$ with only $(w/2)\log_2 w$ nodes, bought back as fan-out $w/2$.
- [[Brent-Kung Tree]] – compares: one extra stage, $2w-2-\log_2 w$ nodes, far fewer wire tracks; the opposite corner of the same budget.
- [[Choosing an Adder]] – compares: whether the minimum-depth corner is worth its metal at your $w$ and target.
- [[RCA, Ripple-Carry Adder]] – counter-example: the degenerate prefix graph, depth $w$ with $w$ nodes and no wire longer than one position.
- [[Compound Adder]] – extends: duplicate only the bottom simplified row and one tree yields $X+Y$ and $X+Y+1$.
- [[FPGA Hard Carry Chain Adder]] – counter-example: the hardened linear chain beats $\log_2 w$ depth up to hundreds of bits.
- [[Leading Zero Counters]] – extends: the same scan shape with a different associative operator, so the depth/fan-out trade-off transfers verbatim.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.6 Parallel prefix adders, pp. 118-123 — Eqs. 5.33-5.48; Fig. 5.16 (prefix operator and its simplified version, p. 121), Fig. 5.19 (Kogge-Stone, p. 123); fan-out discussion p. 121; resource comparison against Sklansky p. 122.
- §5.3.7 Compound fast adder, p. 123 — Fig. 5.20.
- §5.4.1 Addition support on AMD FPGAs, pp. 126-127 — $\tau_\text{cp}$ from [Xil14].
- §5.5 Fast adders on FPGAs, pp. 134-139 — [LPB19] on prefix trees for 1024- to 8192-bit FPGA adders.

Primary source: Kogge & Stone [KS73]. Cost surveys: Zimmermann [Zim97], Harris [Har03].
