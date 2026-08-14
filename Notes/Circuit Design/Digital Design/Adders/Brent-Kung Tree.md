---
title: "Brent-Kung Tree"
description: "Reduction tree up, inverse distribution tree down: the fewest nodes and the lightest, most regular wiring, at one extra stage and a constant fan-out of 3."
kind: circuit
source: "ASA §5.3.6, pp. 118-123 (Fig. 5.16; the [BK1] discussion, p. 122)"
status: seed
spade: simulated
tags: [digital, adder, prefix, carry, vlsi, fpga]
aliases:
  - BK
  - Brent-Kung
  - Brent-Kung Adder
  - Brent-Kung Tree Adder
  - Brent-Kung Prefix Adder
  - Brent-Kung Network
  - Brent-Kung parallel prefix adder
---

# Brent-Kung Tree

The parallel prefix network built as a binary reduction tree followed by its inverse distribution tree, so that **no sub-product is ever computed twice** — the minimum node count of the classical family, $2w-2-\log_2 w$, bought with one extra stage of depth.

```tikz title="Brent-Kung 8-column prefix graph: depth 4, 11 nodes, fan-out 3; open nodes are full prefix operators, filled nodes are simplified (carry-only, assuming c0 = 0)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=-1.15cm,y=-1.0cm,font=\footnotesize,
  full/.style={circle,draw,fill=white,inner sep=1.9pt},
  simp/.style={circle,fill=black,inner sep=1.9pt}]
  \foreach \i/\ip in {0/1,1/2,2/3,3/4,4/5,5/6,6/7,7/8} {
    \draw[gray!45] (\i,0) -- (\i,4.5);
    \node[above] at (\i,0) {$(g_{\i},a_{\i})$};
    \node[below] at (\i,4.6) {$c_{\ip}$};
  }
  \foreach \i/\j/\r in {3/2/1, 5/4/1, 7/6/1, 7/5/2}
    { \draw (\j,{\r-1}) -- (\i,\r); \node[full] at (\i,\r) {}; }
  \foreach \i/\j/\r in {1/0/1, 3/1/2, 7/3/3, 5/3/3, 2/1/4, 4/3/4, 6/5/4}
    { \draw (\j,{\r-1}) -- (\i,\r); \node[simp] at (\i,\r) {}; }
  \node[anchor=west,gray!60] at (-0.35,1) {reduce, span $2$};
  \node[anchor=west,gray!60] at (-0.35,2) {reduce, span $4$};
  \node[anchor=west,gray!60] at (-0.35,3) {reduce $[7{:}0]$ $+$ distribute $[5{:}0]$};
  \node[anchor=west,gray!60] at (-0.35,4) {distribute $[2{:}0],[4{:}0],[6{:}0]$};
  \node[full] at (7.0,5.7) {};
  \node[anchor=west] at (6.80,5.7) {full node: $(2\,\mathrm{bit})\times(2\,\mathrm{bit})\to 2\,\mathrm{bit}$};
  \node[simp] at (7.0,6.3) {};
  \node[anchor=west] at (6.80,6.3) {simplified: $(2\,\mathrm{bit})\times(1\,\mathrm{bit})\to 1\,\mathrm{bit}$};
\end{circuitikz}
\end{document}
```

*after the [BK1] discussion on p. 122; node shapes after Fig. 5.16, p. 121. Rows are the two construction **phases**, not an as-soon-as-possible schedule — $[2{:}0]$ is drawn in the last row but is ready in the second.*

**Fix the operator, then forget the arithmetic.** Bit position $i$ contributes the 2-bit tuple $X_i=(g_i,a_i)$ — generate $g_i=x_iy_i$ and alive $a_i=x_i\vee y_i$, one bit each, both available one gate level after the $w$-bit operands $X,Y$ arrive. The prefix operator composes two tuples (Eqs. 5.35-5.37, p. 120):

$$(g_Z,a_Z)=(g_L,a_L)\circ(g_R,a_R)=\big(g_L\vee a_L g_R,\ \ a_L a_R\big)$$

Every solid edge in the graph above is a **2-bit** bus. $\circ$ is associative — proved by substitution and distributivity of AND over OR in Eqs. 5.39-5.43, and that proof is the entire correctness argument for every graph in this family, so it lives once in [[Parallel Prefix Adders]] and is not repeated. Carry $c_{i+1}$ is the $g$-component of $X_i\circ\cdots\circ X_{-1}$ with $X_{-1}=(c_0,c_0)$ (Eq. 5.48, p. 121). So the only design question left is *which sub-products to name*, and Brent and Kung [BK1] answer: name each one exactly once.

**Reduce by halving, then distribute the leftovers.** Phase one is the textbook reduction of an associative product. At level $t=1,2,\ldots,\log_2 w$, positions $i\equiv 2^t-1 \pmod{2^t}$ combine two adjacent spans of length $2^{t-1}$:

$$[i:i-2^t+1]\;=\;[i:i-2^{t-1}+1]\;\circ\;[i-2^{t-1}:i-2^t+1]$$

That halves the live positions each level and terminates with the single root $[w{-}1{:}0]$ — $w-1$ nodes, the minimum possible for one $w$-fold reduction, since every node consumes two operands and destroys one. But a prefix problem wants **all** $w$ prefixes, and the reduction has produced only $\log_2 w$ of them (the right-aligned spans $[0{:}0],[1{:}0],[3{:}0],[7{:}0],\ldots$). Phase two runs the same tree backwards, filling positions the reduction skipped: at level $t=\log_2 w-1$ down to $1$, every position $i$ whose prefix is still short is completed by composing its own span onto the already-finished prefix immediately below it,

$$[i{:}0]\;=\;[i:i-2^{t-1}+1]\;\circ\;[i-2^{t-1}{:}0]$$

which is legal *by associativity alone* — the left factor is a span the reduction already built, the right factor is a prefix the distribution already finished, and re-bracketing costs nothing. This is Blelloch's up-sweep/down-sweep scan, arrived at from the carry recurrence.

> [!important] Nothing is duplicated, and that is where the node count comes from
> Read the graph and check: every sub-product it names — $[1{:}0]$, $[3{:}2]$, $[5{:}4]$, $[7{:}6]$, $[3{:}0]$, $[7{:}4]$, $[5{:}0]$, and the four outputs — is consumed by something, and no two nodes compute the same span. Contrast [[Kogge-Stone Tree]], where $[3{:}2]$ and $[2{:}1]$ both exist because two different outputs each wanted their own balanced tree. The count follows from the recurrence $N(w)=N(w/2)+(w-1)$: $w/2$ merges in the reduction plus $w/2-1$ fills in the distribution, on top of the $w/2$-wide sub-problem. With $N(1)=0$, telescoping gives $\sum_{j=1}^{\log_2 w}(2^j-1)=2w-2-\log_2 w$ by the geometric sum — $11$ at $w=8$, against $17$ for Kogge-Stone and $12$ for [[Sklansky Tree]]. It is the cheapest of the three, and the gap widens with $w$.

**The two phases overlap by one level, so the depth is $2\log_2 w-2$, not $2\log_2 w-1$.** Naively the reduction costs $\log_2 w$ levels and the distribution another $\log_2 w-1$. But the root $[w{-}1{:}0]$ produced by the last reduction level feeds *only* $c_w$ — no distribution node reads it — so the first distribution level does not wait for it and the two run in the same stage. At $w=8$ that stage is row 3 of the graph: $[7{:}0]$ (last reduce) and $[5{:}0]$ (first distribute) both sit there, and neither depends on the other. The true critical path is the output $c_7=[6{:}0]$:

$$[1{:}0]\ \to\ [3{:}0]\ \to\ [5{:}0]\ \to\ [6{:}0]$$

four $\circ$-stages, plus one gate level for $(g_i,a_i)$ and one XOR for the sum: six levels in total against Kogge-Stone's five at $w=8$. At $w=64$ the gap is $10$ $\circ$-stages against $6$.

**Fan-out is $3$, and the $3$ is what matters, not the $2$.** Count the consumers of $[3{:}0]$ in the graph: the reduction node at column $7$, the distribution node at column $5$, and the distribution node at column $4$. Three — one more than Kogge-Stone's cap. The structure of the argument is what makes it a constant: a completed prefix $[2^t{-}1{:}0]$ is read by exactly one node of the enclosing reduction, one node of the enclosing distribution, and one leaf fill, regardless of $w$. At $w=16$, $[7{:}0]$ likewise feeds three. Since an output driving $f$ inputs sees $f\times$ the load capacitance — so either a slow edge or a fat driver burning dynamic power (p. 121) — a *bounded* fan-out is the whole game, and Sklansky's $w/2$ is not bounded. The wiring is correspondingly light: the reduction and distribution levels together carry $O(w)$ edges in total rather than $w$ per level, which is why the layout is famously regular and why the tree tiles cleanly into a bit-sliced floorplan.

**Most of the nodes are not full operators.** With $c_0=0$ the extraction collapses to $c_{i+1}=G_{i:0}$, so a node's $a$-component is live only if some consumer reads it. A consumer always reads $a_L$ from its **left** operand (it appears in $g_L\vee a_Lg_R$) but reads $a_R$ from its right operand only if the consumer is itself full. Chasing that through the graph leaves exactly four full nodes — $[3{:}2]$, $[5{:}4]$, $[7{:}6]$, $[7{:}4]$, the ones that feed something as a left operand — and **seven simplified** ones, which take $(g_L,a_L)$ and only $g_R$ and emit a single bit: two gates instead of four, one wire instead of two (Fig. 5.16, p. 121). The entire distribution phase degenerates. With a live $c_0$ the picture changes: every $[i{:}0]$ then needs $A_{i:0}$ for $c_{i+1}=G_{i:0}\vee A_{i:0}c_0$, and you either pay the $a$-halves back or inject $c_0$ as a $-1$ column at the right edge. Duplicating just that bottom AND-OR row for both values of $c_0$ gives $X+Y$ and $X+Y+1$ from one tree — the [[Compound Adder]].

**On an FPGA this is the tree to reach for, and you still should not.** Depth is cheap on an FPGA (a level is one LUT) and wire is expensive (routing, not logic, dominates), which is exactly the corner Brent-Kung occupies — the opposite of the ASIC ranking. It is nonetheless beaten outright by `+` up to hundreds of bits, because the hardened carry chain runs at $\tau_\text{cp}\approx0.015$ ns per bit on a Virtex 6 speed-grade 3 [Xil14], an order of magnitude under one LUT delay; see [[FPGA Hard Carry Chain Adder]]. [LPB19] find prefix networks paying only at $1024$ to $8192$ bits, and there report a *quasi-linear relationship between prefix tree complexity and performance* — on FPGA the family lines up in a predictable order instead of trading off, because wire cost dominates uniformly. Sum completion, $s_i=p_i\oplus c_i$ with $p_i=x_i\oplus y_i$, is one XOR per bit either way; note $p_i\ne a_i$, they differ exactly when $x_i=y_i=1$.

$$\boxed{\ \text{depth}=2\log_2 w-2,\qquad \text{nodes}=2w-2-\log_2 w,\qquad \text{fan-out}=3\ }$$

## When it breaks

- **On an ASIC critical path at large $w$**: $2\log_2 w-2$ against $\log_2 w$ is $10$ versus $6$ at $w=64$ — nearly twice the levels. If you can pay for the metal, [[Kogge-Stone Tree]] is the minimum-depth corner and this is not close.
- **When $w$ is not a power of two**: the halving recursion is only clean for $w=2^k$. Pad to the next power of two and the top levels sit partly idle; both closed forms above are the power-of-two values and over-count otherwise.
- **The wires are few but not short.** Bounded fan-out does not mean bounded span: the top reduction node still reaches $w/2$ positions across the word, so at very large $w$ that one edge is a long wire, even though there are $O(w)$ edges in total rather than $O(w\log w)$.
- **When you want the middle of the trade-off**: the Han-Carlson network keeps this reduction/distribution skeleton but runs a Kogge-Stone core on the odd positions only, landing at $\log_2 w+1$ depth with fan-out $2$. It is the usual production choice and neither endpoint of this note is.
- **Below $w\approx16$, or off the critical path**: an [[RCA, Ripple-Carry Adder]] is smaller and the $\log$ is not yet worth $11$ nodes of soft logic. See [[Choosing an Adder]].
- **Format, not adder**: the $(w{+}1)$-bit result $c_\text{out}S$ represents $X+Y+c_0$ exactly, 0 ulp. Any error around it is a format decision — see [[Error Accuracy]].

## RTL (Spade)

The graph transcribed node for node: eleven `prefix_op` calls in the order the two phases build them.

```spade
fn prefix_op(gl: bool, al: bool, gr: bool, ar: bool) -> (bool, bool) {
    (gl || (al && gr), al && ar)
}

fn brent_kung_8(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
    let g = (x & y).as_bits();
    let a = (x | y).as_bits();

    // up-sweep: reduce by halving
    let p10 = prefix_op(g[1], a[1], g[0], a[0]);
    let p32 = prefix_op(g[3], a[3], g[2], a[2]);
    let p54 = prefix_op(g[5], a[5], g[4], a[4]);
    let p76 = prefix_op(g[7], a[7], g[6], a[6]);
    let p30 = prefix_op(p32.0, p32.1, p10.0, p10.1);
    let p74 = prefix_op(p76.0, p76.1, p54.0, p54.1);
    let p70 = prefix_op(p74.0, p74.1, p30.0, p30.1);

    // down-sweep: fill the prefixes the reduction skipped
    let p50 = prefix_op(p54.0, p54.1, p30.0, p30.1);
    let p20 = prefix_op(g[2], a[2], p10.0, p10.1);
    let p40 = prefix_op(g[4], a[4], p30.0, p30.1);
    let p60 = prefix_op(g[6], a[6], p50.0, p50.1);

    // c_{i+1} = G_{i:0} | A_{i:0} c_0   -- the bottom row, linear in w
    let c1 = g[0]  || (a[0]  && cin);
    let c2 = p10.0 || (p10.1 && cin);
    let c3 = p20.0 || (p20.1 && cin);
    let c4 = p30.0 || (p30.1 && cin);
    let c5 = p40.0 || (p40.1 && cin);
    let c6 = p50.0 || (p50.1 && cin);
    let c7 = p60.0 || (p60.1 && cin);
    let c8 = p70.0 || (p70.1 && cin);

    // sum completion: s_i = (x_i ^ y_i) ^ c_i, with c_0 = cin
    let cvec = [cin, c1, c2, c3, c4, c5, c6, c7].as_uint();
    let s = (x ^ y) ^ cvec;
    c8.as_uint().concat(s)
}
```

`pXY` is the node at column `X` holding $[X{:}Y]$, so `p32`/`p54`/`p76`/`p74` are the four open circles and the rest are filled; `p50` and `p70` are the two nodes sharing row 3, and nothing in the code makes one wait for the other. The tuple is the 2-bit bus: `.0` is the $g$ wire, `.1` the $a$ wire. Widths: `g`/`a` are `[bool; 8]` with index 0 the LSB, `cvec` is the 8-bit carry vector $c_7\ldots c_0$ shifted into place by starting the array with `cin`, and `concat` puts `c8` in the high position for a `uint<9>`. It is entirely combinational — a `fn` cannot hold a `reg`, so the four rows are logic depth, not pipeline stages; lift it to a `pipeline(4)` `entity` with `reg;` between phases to cut it, as in [[Pipelined Ripple-Carry Adder]]. Synthesis will not build eleven full nodes as drawn: tie `cin` to `false` and it constant-folds the `a` half out of the seven simplified ones, which is precisely how the fill pattern in the figure arises.

## Related Notes

- [[Parallel Prefix Adders]] – depends-on: supplies the associativity of $\circ$ that makes the up-sweep/down-sweep re-bracketing correct without any arithmetic argument.
- [[Kogge-Stone Tree]] – compares: the opposite corner — half the depth, $17$ nodes against $11$, and a layout dominated by wire tracks.
- [[Sklansky Tree]] – compares: minimum depth with $12$ nodes, paid as fan-out $w/2$; the only one of the three whose fan-out is unbounded.
- [[Choosing an Adder]] – compares: whether the area/routing corner is the one your design is actually stuck in.
- [[RCA, Ripple-Carry Adder]] – counter-example: the degenerate prefix graph, $w$ nodes and no wire longer than one position, and still the right answer below $w\approx16$.
- [[Compound Adder]] – extends: duplicate only the bottom AND-OR row and one tree yields $X+Y$ and $X+Y+1$.
- [[Conditional-Sum Adder]] – compares: the same recursive halving applied to muxed sums instead of $\circ$-nodes, which is why it inherits Sklansky's fan-out rather than this one's.
- [[FPGA Hard Carry Chain Adder]] – counter-example: this is the FPGA-friendly tree and the hardened linear chain still beats it to hundreds of bits.
- [[Pipelined Ripple-Carry Adder]] – compares: on FPGA, cutting the linear chain with registers buys throughput more cheaply than any tree buys latency.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.6 Parallel prefix adders, pp. 118-123 — Eqs. 5.33-5.48; Fig. 5.16 (the prefix operator and its simplified form, p. 121); the [BK1] discussion and the Sklansky/Kogge-Stone resource comparison, p. 122; fan-out and load capacitance, p. 121.
- §5.3.7 Compound fast adder, p. 123 — Fig. 5.20.
- §5.4.1 Addition support on AMD FPGAs, pp. 126-127 — $\tau_\text{cp}$ from [Xil14].
- §5.5 Fast adders on FPGAs, pp. 134-139 — [LPB19] on Brent-Kung, Han-Carlson, Kogge-Stone and Sklansky networks for 1024- to 8192-bit FPGA adders.

Primary source: Brent & Kung [BK1]. Cost surveys: Zimmermann [Zim97], Harris [Har03].
