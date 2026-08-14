---
title: Parallel Prefix Adders
description: "All carries are the prefixes of one associative reduction, so any prefix graph is correct by construction — correctness is free and only depth, node count, fan-out and wire tracks differ."
kind: concept
source: "ASA §5.3.6, pp. 118-123 (Figs. 5.15-5.17)"
status: seed
spade: simulated
tags: [digital, adder, prefix, carry, associativity, vlsi]
aliases:
  - PPA
  - Parallel Prefix Adder
  - Prefix Adder
  - Prefix Adders
  - Parallel Prefix
  - Parallel Prefix Operation
  - Prefix Graph
  - Prefix Network
  - Prefix Operator
  - Carry Prefix Problem
---

# Parallel Prefix Adders

The reformulation that turns the whole fast-adder design space into a single question: the carries of a $w$-bit adder are the *prefixes* of one associative reduction, so every legal bracketing of that reduction is a correct adder, and the only thing left to choose is the shape.

```tikz title="The prefix operator, its simplified carry-only version, and the ripple-carry adder as the degenerate right-nested prefix graph"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % --- (a) the full prefix node: 2 bits in on each side, 2 bits out
  \node[draw,circle,minimum size=8mm] (A) at (0,0) {};
  \node at (-1.05,1.45) {$(g_L,a_L)$};
  \node at (1.05,1.45) {$(g_R,a_R)$};
  \draw[->] (-0.30,1.20) -- (-0.30,0.34) node[midway,left] {$2$};
  \draw[->] (0.30,1.20) -- (0.30,0.34) node[midway,right] {$2$};
  \draw[->] (0,-0.42) -- (0,-1.20) node[midway,right] {$2$};
  \node at (0,-1.50) {$(g_{out},a_{out})$};
  \node at (0,-2.15) {(a) full node: 4 gates};

  % --- (b) the simplified node: right input and output are 1 bit
  \begin{scope}[xshift=4.3cm]
    \node[draw,circle,fill=black,minimum size=8mm] (B) at (0,0) {};
    \node at (-1.05,1.45) {$(g_L,a_L)$};
    \node at (0.95,1.45) {$g_R$};
    \draw[->] (-0.30,1.20) -- (-0.30,0.34) node[midway,left] {$2$};
    \draw[->] (0.30,1.20) -- (0.30,0.34) node[midway,right] {$1$};
    \draw[->] (0,-0.42) -- (0,-1.20) node[midway,right] {$1$};
    \node at (0,-1.50) {$g_{out}$};
    \node at (0,-2.15) {(b) simplified: 2 gates};
  \end{scope}

  % --- (c) the ripple-carry adder as the fully right-nested prefix graph
  \begin{scope}[yshift=-3.6cm,xshift=5.6cm,x=-0.78cm,y=-0.60cm,
                op/.style={circle,fill=black,inner sep=1.6pt}]
    \foreach \i/\ip in {0/1,1/2,2/3,3/4,4/5,5/6,6/7,7/8} {
      \draw[gray!45] (\i,0) -- (\i,8.35);
      \node[above,rotate=90,anchor=west] at (\i,-0.45) {$X_{\i}$};
      \node[below] at (\i,8.45) {$c_{\ip}$};
    }
    \draw[gray!45] (-1,0) -- (-1,0.9);
    \node[above,rotate=90,anchor=west] at (-1,-0.45) {$X_{-1}$};
    \foreach \i in {0,1,2,3,4,5,6,7} {
      \draw ({\i-1},\i) -- (\i,{\i+1});
      \node[op] at (\i,{\i+1}) {};
    }
    \node[anchor=north] at (3.5,9.4) {(c) RCA $=$ right-nested bracketing, depth $8$};
  \end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 5.16, p. 121 (panels a, b) and Fig. 5.17, p. 122 (panel c).*

**Condense the full adder's carry on the input pair.** For $w$-bit operands $x,y$ the carry-out of bit $i$ is $c_{i+1}=x_ic_i\vee y_ic_i\vee x_iy_i$ (Eq. 5.3, p. 107) — a function of $c_i$, but only *conditionally*. Collapsing the truth table on $(x_i,y_i)$ leaves three cases: $x_i y_i = 00$ **kills** the carry, $01$ and $10$ **propagate** it, $11$ **generates** it. Encode them with signals that read the inputs only, so all $w$ of them settle after one gate delay in parallel:

$$p_i=x_i\oplus y_i,\qquad g_i=x_iy_i,\qquad a_i=x_i\vee y_i$$

each 1 bit wide, for $i=0\ldots w-1$. $a_i$ is the **alive** signal — generate or propagate, i.e. "a carry entering leaves". Every one of $p$, $g$, $a$ is a single 2-input gate per bit; see [[Boolean Algebra]] for the identities used from here on.

**Split the adder into carries and sums, and note only one half is hard.** The recurrence and the sum decouple (Eqs. 5.13, 5.11):

$$c_{i+1}=g_i\vee a_ic_i,\qquad s_i=p_i\oplus c_i$$

Once every $c_i$ is known, every $s_i$ costs one XOR, all $w$ in parallel. **"Fast adder" therefore means exactly "fast computation of all $c_i$", and nothing else.** That is what makes the reformulation below worth the trouble: it attacks the only part that is not already $O(1)$.

**Pair the two per-bit signals so the recurrence becomes one operator.** Define the 2-bit tuple $X_i=(g_i,a_i)$ and the operator $\circ$ (Eqs. 5.33-5.37, p. 120):

$$(g_L,a_L)\circ(g_R,a_R)\;=\;\big(\,g_L\vee a_Lg_R,\;\;a_La_R\,\big)$$

Read it as *"a carry leaves the combined block if the left (more significant) half generates one, or if the left half is alive and the right half hands one over; the combined block is alive only if both halves are"*. Four gates, two bits in on each side, two bits out — panel (a).

> [!important] $\circ$ is **associative**, and that is the whole reason prefix trees exist
> Expand $(U\circ V)\circ W$ on the generate component, applying the definition twice:
> $$g_{(U\circ V)\circ W}=g_{U\circ V}\vee a_{U\circ V}\,g_W=\big(g_U\vee a_Ug_V\big)\vee a_Ua_Vg_W$$
> Now the other bracketing:
> $$g_{U\circ(V\circ W)}=g_U\vee a_U\,g_{V\circ W}=g_U\vee a_U\big(g_V\vee a_Vg_W\big)$$
> and **by distributivity of AND over OR**, $a_U(g_V\vee a_Vg_W)=a_Ug_V\vee a_Ua_Vg_W$. The two expressions are the same term, so the generate halves agree. The alive halves are
> $$a_{(U\circ V)\circ W}=a_Ua_Va_W=a_{U\circ(V\circ W)}$$
> **by associativity of AND**. Hence $(U\circ V)\circ W=U\circ(V\circ W)$. $\blacksquare$ *(Eqs. 5.38-5.43, p. 120.)*
>
> Associativity means the reduction $X_{i-1}\circ X_{i-2}\circ\cdots\circ X_{-1}$ has **no canonical bracketing**. Every valid parenthesization computes the same carry, and each one is a different circuit.

**Unroll the recurrence to see that the carries are the prefixes.** Set $X_{-1}=(g_{-1},a_{-1})=(c_0,c_0)$, which encodes the carry-in as a block that generates exactly when $c_0=1$. The first step is

$$(g_0,a_0)\circ(c_0,c_0)=(g_0\vee a_0c_0,\;a_0c_0)=(c_1,\;a_0c_0)$$

and by induction on $i$ the first component of the $i$-fold product is exactly the carry (Eqs. 5.44-5.48, p. 121):

$$\big(c_i,\;a_{i-1}a_{i-2}\cdots a_0c_0\big)=\bigcirc_{j=-1}^{\,i-1}(g_j,a_j)$$

So computing **all** carries $c_1\ldots c_w$ is computing **all prefixes** of one associative reduction — a *parallel prefix* problem, structurally identical to the running-sum example the book opens the section with, where 8 sequential adders (Fig. 5.15a, p. 119) become 12 adders of depth 3 (Fig. 5.15b). The adder design space is the space of prefix graphs.

**Read the design space straight off the associativity.** A prefix graph on $w$ inputs is any DAG of $\circ$-nodes whose output at position $i$ is a correctly-parenthesized product $X_{i-1}\circ\cdots\circ X_{-1}$. Because $\circ$ is associative, **correctness is free** — every such graph is right, and no per-architecture proof is ever needed. What differs is four numbers:

- **depth** — stages on the critical path, hence latency;
- **node count** — area and static power;
- **max fan-out** — an output driving $f$ inputs sees $f\times$ the load capacitance, so either slow edges or a bigger driver and more dynamic power (p. 121);
- **wire tracks** — routing congestion and wire delay; on FPGAs this decides whether you stay on the hard carry chain or spill into the general fabric.

**Count how big the space actually is.** Take $c_7=X_6\circ X_5\circ X_4\circ X_3\circ X_2\circ X_1\circ X_0$: a single associative product of seven factors, so $C_6=132$ legal bracketings (Catalan). Four of them are named architectures:

$$
\begin{aligned}
\textbf{RCA:}\quad & X_6\circ\Big(X_5\circ\big(X_4\circ\big(X_3\circ\big(X_2\circ(X_1\circ X_0)\big)\big)\big)\Big) && \text{depth }6\\[2pt]
\textbf{Kogge-Stone:}\quad & \big((X_6\circ X_5)\circ(X_4\circ X_3)\big)\circ\big((X_2\circ X_1)\circ X_0\big) && \text{depth }3\\[2pt]
\textbf{Sklansky:}\quad & \big(X_6\circ(X_5\circ X_4)\big)\circ\big((X_3\circ X_2)\circ(X_1\circ X_0)\big) && \text{depth }3\\[2pt]
\textbf{Brent-Kung:}\quad & X_6\circ\Big((X_5\circ X_4)\circ\big((X_3\circ X_2)\circ(X_1\circ X_0)\big)\Big) && \text{depth }4
\end{aligned}
$$

Every line is the same value **by associativity alone** — no arithmetic identity, no case analysis, nothing about carries. What separates them is which sub-products the *neighbouring* outputs can reuse: Kogge-Stone puts its sub-products on offsets its neighbours never touch, so nothing drives more than two consumers and the bill is nodes and metal; Sklansky makes $[3{:}0]$ the right operand of all four upper outputs, which is maximal sharing at minimum depth and exactly why that node carries fan-out $w/2$; Brent-Kung refuses to duplicate anything, giving the fewest nodes for one extra level. Depth, node count, fan-out: pick two.

**The ripple-carry adder is not a different circuit — it is the degenerate bracketing.** Panel (c) is the fully right-nested product, innermost pair at the LSB end, one node per level: $w$ nodes, depth $w$, and no wire longer than one position (Fig. 5.17, p. 122). The [[CLA, Carry-Lookahead Adder]] is the same reduction reparenthesized into fixed-width groups, and the [[Conditional-Sum Adder]] is Sklansky with multiplexers substituted for $\circ$-nodes. All of them are one construction seen from different angles.

**Drop the alive half wherever nobody reads it.** A node whose only consumers are carry outputs never has its $a$ component used. That node takes the full pair $(g_L,a_L)$ on the left but only the single bit $g_R$ on the right and emits one bit $g_{out}=g_L\vee a_Lg_R$ — **two gates instead of four, one output wire instead of two** (panel b). Drawn as a filled circle against the full operator's hollow circle (Fig. 5.16, p. 121). The bottom row of every prefix adder is entirely simplified nodes, and the count is linear in $w$; the RCA in panel (c) is *all* simplified nodes. This is not a footnote — it is why the [[Compound Adder]] is nearly free, since everything above that bottom row is independent of $c_0$ and only the linear-in-$w$ row must be duplicated to get $X+Y$ and $X+Y+1$ together (Fig. 5.20, p. 123).

**On FPGAs the four metrics are weighted differently than on an ASIC.** A stage costs one LUT delay and is cheap; a long horizontal span costs a routing hop and is not. That pushes the choice toward wire-light shapes like [[Brent-Kung Tree]] and away from Kogge-Stone, and it is why the [[FPGA Hard Carry Chain Adder]] — the degenerate depth-$w$ graph, hardened into dedicated silicon — beats every $\log_2 w$ tree up to widths in the hundreds. Prefix trees return on FPGAs only at very large $w$, or when the carry chain's fixed column placement is the constraint.

$$\boxed{\ \big(c_i,\;a_{i-1}\cdots a_0c_0\big)=\bigcirc_{j=-1}^{\,i-1}(g_j,a_j),\qquad (g_L,a_L)\circ(g_R,a_R)=(g_L\vee a_Lg_R,\ a_La_R)\ }$$

Any DAG realizing this product is a correct adder; only depth, nodes, fan-out and wire tracks are in play.

**When it breaks.** Depth is not delay: a depth-3 Sklansky at $w=64$ has a node driving 32 loads, and the real critical path is that RC load, not three gate delays — the metric only ranks architectures when fan-out is bounded or buffered, and buffering costs a stage back. The graphs as usually drawn omit $X_{-1}$; a nonzero carry-in enters either as an extra rightmost column or, equivalently, folded into the sum-completion row as $c_{i+1}=G_{i:0}\vee A_{i:0}c_0$ — forget it and the adder is silently off by one whenever $c_0=1$, which is exactly the subtract path. Below $w\approx16$ on any FPGA, and below $w\approx8$ on an ASIC, the asymptotics have not started and the ripple chain wins on every axis. The formulation assumes all $X_i$ arrive simultaneously; with skewed arrival times the balanced tree is the *wrong* shape and the tree should be built to the arrival profile instead (Zim97, Ch. 5). And if you need many additions rather than one, the right move is not a better prefix graph but no carry propagation at all — see [[CSA, Carry-Save Adder]] and [[Compressor Trees]]. Finally, $\circ$ here is a 2-input operator; prefix nodes accepting more than two inputs (BL01) shift the whole depth/area curve and are not covered by the counts above.

## RTL (Spade)

Two bracketings of the same reduction, sharing the same front end (`ga`) and back end (`complete`). Only the middle function differs — which is the claim of this note, made executable.

```spade
fn pfx(l: (bool, bool), r: (bool, bool)) -> (bool, bool) {
    let (gl, al) = l;
    let (gr, ar) = r;
    (gl || (al && gr), al && ar)
}

fn ga(x: uint<8>, y: uint<8>) -> [(bool, bool); 8] {
    let a = x.as_bits();
    let b = y.as_bits();
    [(a[0] && b[0], a[0] || b[0]), (a[1] && b[1], a[1] || b[1]),
     (a[2] && b[2], a[2] || b[2]), (a[3] && b[3], a[3] || b[3]),
     (a[4] && b[4], a[4] || b[4]), (a[5] && b[5], a[5] || b[5]),
     (a[6] && b[6], a[6] || b[6]), (a[7] && b[7], a[7] || b[7])]
}

// right-nested bracketing: the ripple-carry chain, depth 8, 8 nodes
fn serial(xg: [(bool, bool); 8]) -> [(bool, bool); 8] {
    let p0 = xg[0];
    let p1 = pfx(xg[1], p0);
    let p2 = pfx(xg[2], p1);
    let p3 = pfx(xg[3], p2);
    let p4 = pfx(xg[4], p3);
    let p5 = pfx(xg[5], p4);
    let p6 = pfx(xg[6], p5);
    let p7 = pfx(xg[7], p6);
    [p0, p1, p2, p3, p4, p5, p6, p7]
}

// Sklansky bracketing: recursive halving, depth 3, 12 nodes
fn sklansky(xg: [(bool, bool); 8]) -> [(bool, bool); 8] {
    let q1 = pfx(xg[1], xg[0]);
    let q3 = pfx(xg[3], xg[2]);
    let q5 = pfx(xg[5], xg[4]);
    let q7 = pfx(xg[7], xg[6]);
    let p2 = pfx(xg[2], q1);
    let p3 = pfx(q3, q1);
    let r6 = pfx(xg[6], q5);
    let r7 = pfx(q7, q5);
    [xg[0], q1, p2, p3,
     pfx(xg[4], p3), pfx(q5, p3), pfx(r6, p3), pfx(r7, p3)]
}

// the bottom row of simplified nodes, then the sum XORs
fn complete(x: uint<8>, y: uint<8>, p: [(bool, bool); 8], cin: bool) -> uint<9> {
    let a = x.as_bits();
    let b = y.as_bits();
    let c = [cin,
             p[0].0 || (p[0].1 && cin), p[1].0 || (p[1].1 && cin),
             p[2].0 || (p[2].1 && cin), p[3].0 || (p[3].1 && cin),
             p[4].0 || (p[4].1 && cin), p[5].0 || (p[5].1 && cin),
             p[6].0 || (p[6].1 && cin), p[7].0 || (p[7].1 && cin)];
    [a[0] ^^ b[0] ^^ c[0], a[1] ^^ b[1] ^^ c[1],
     a[2] ^^ b[2] ^^ c[2], a[3] ^^ b[3] ^^ c[3],
     a[4] ^^ b[4] ^^ c[4], a[5] ^^ b[5] ^^ c[5],
     a[6] ^^ b[6] ^^ c[6], a[7] ^^ b[7] ^^ c[7], c[8]].as_uint()
}

entity ppa8(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
    complete(x, y, sklansky(ga(x, y)), cin)
}

entity ppa8s(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
    complete(x, y, serial(ga(x, y)), cin)
}
```

`pfx` is one hollow circle of panel (a): both arguments and the result are 2-bit tuples, four gates. `ga` is the row of input signals above the graph, `[(bool, bool); 8]` being $X_0\ldots X_7$ with element 0 the LSB. `serial` is literally panel (c) — eight nodes on the diagonal — and `sklansky` is the same eight prefixes computed in three levels; nothing else in the file changes between them. `complete` is the bottom row of *simplified* nodes ($g\vee(a\wedge c_0)$, panel b, one bit out) plus the sum-completion XORs, and the $9$-bit result is $\{c_8,s_7\ldots s_0\}$: $8+8+1\to 9$ bits, no truncation anywhere. All of it is combinational — a `fn` cannot hold a `reg`, so the three Sklansky levels are logic depth, not pipeline stages. Synthesis will not reproduce the drawing node-for-node: it constant-folds every alive component no consumer reads (turning full nodes into simplified ones automatically) and will happily re-balance the `serial` chain, which is why the depth-8 version is a *specification* of the RCA bracketing and not a way to get one out of a synthesiser.

Simulated with `iverilog` against the behavioural reference `x + y + cin`: 10 named vectors including the asymmetric $1+128$, $128+1$, $3+192+1$ and $255+1$, then 4000 random $(x,y,c_0)$ triples — 4010 vectors, both entities, zero mismatches, and `ppa8 === ppa8s` on every one. That last equality is the associativity proof re-checked in silicon.

## Related Notes

- [[RCA, Ripple-Carry Adder]] – counter-example: the degenerate right-nested bracketing, panel (c) — same reduction, worst depth, cheapest wires.
- [[Kogge-Stone Tree]] – extends: the minimum-depth, fan-out-2 corner of this design space.
- [[Sklansky Tree]] – extends: minimum depth with half the nodes, paid as fan-out $w/2$; the bracketing the RTL above implements.
- [[Brent-Kung Tree]] – extends: fewest nodes and wire tracks for one extra level.
- [[CLA, Carry-Lookahead Adder]] – compares: the same reduction reparenthesized into fixed-width groups rather than a tree.
- [[Conditional-Sum Adder]] – compares: the Sklansky bracketing with multiplexers substituted for $\circ$-nodes.
- [[Compound Adder]] – extends: only the bottom simplified row depends on $c_0$, so $X+Y$ and $X+Y+1$ come out of one tree.
- [[Choosing an Adder]] – compares: which corner of depth $\times$ nodes $\times$ fan-out your target actually wants.
- [[FPGA Hard Carry Chain Adder]] – counter-example: hardening the degenerate graph into silicon reverses the asymptotics up to hundreds of bits.
- [[Boolean Algebra]] – depends-on: distributivity of AND over OR and associativity of AND are the only two laws the proof uses.
- [[Leading Zero Counters]] – extends: the same prefix machinery with a different associative operator, so depth/fan-out trade-offs transfer verbatim.
- [[Compressor Trees]] – compares: the other escape from carry propagation — defer it rather than parallelize it.
- [[CSA, Carry-Save Adder]] – compares: no carry propagation at all when many operands are summed.
- [[Adders]] – depends-on: the hub this reformulation organizes.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.2 Addition basics, p. 107 — Eq. 5.3, the full-adder carry.
- §5.3.5 Carry-lookahead, p. 118 — Eqs. 5.24-5.27, the group-signal reparenthesization the prefix view generalizes.
- §5.3.6 Parallel prefix adders, pp. 118-123 — prefix sums and Fig. 5.15 (p. 119); Eqs. 5.33-5.37 defining $\circ$ and Eqs. 5.38-5.43 proving associativity (p. 120); Eqs. 5.44-5.48 and Fig. 5.16, the prefix operator and its simplified version (p. 121); fan-out as a first-class metric (p. 121); Fig. 5.17, the carry-propagate adder as a special case (p. 122).
- §5.3.7 Compound fast adder, p. 123 — Fig. 5.20.

Design-space surveys cited there: Zimmermann [Zim97] (area, delay, wire cost, fan-out; skewed arrival times in Ch. 5), Harris [Har03] (taxonomy of stage count, fan-out and wire tracks), Bilgory & Lewis [BL01] (prefix operators with more than two inputs), Roy et al. [Roy+21] (reinforcement-learning search of the space at NVIDIA).
