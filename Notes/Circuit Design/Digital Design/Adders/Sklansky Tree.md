---
title: Sklansky Tree
description: "Recursive halving on the outputs: minimum depth with only (w/2)log2(w) nodes, and the bill arrives as fan-out w/2 on every block midpoint."
kind: circuit
source: "ASA §5.3.6, pp. 118-123 (Figs. 5.15b, 5.16, 5.18)"
status: seed
spade: simulated
tags: [digital, adder, prefix, carry, fanout, vlsi]
aliases:
  - Sklansky
  - Sklansky Adder
  - Sklansky Prefix Adder
  - Sklansky parallel prefix adder
  - Divide-and-Conquer Prefix Adder
---

# Sklansky Tree

The parallel prefix network built by recursively halving the *output* range — every position in the upper half of a block hangs directly off that block's midpoint prefix — reaching minimum depth $\log_2 n$ with half the nodes of [[Kogge-Stone Tree]] and paying for it with a single net of fan-out $n/2$.

```tikz title="Sklansky 8-column prefix graph: depth 3, 12 nodes; the four thick edges all leave one node, which is the fan-out w/2"
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
  % full (open) nodes: their alive half is still read downstream
  \foreach \i/\j/\r in {3/2/1,5/4/1,7/6/1, 6/5/2,7/5/2}
    { \draw (\j,{\r-1}) -- (\i,\r); \node[full] at (\i,\r) {}; }
  % simplified (filled) nodes: the span already reaches $c_0$, so only $g$ is emitted
  \foreach \i/\j/\r in {1/0/1, 2/1/2,3/1/2}
    { \draw (\j,{\r-1}) -- (\i,\r); \node[simp] at (\i,\r) {}; }
  % last block: all four edges leave the single midpoint node $[2{:}{-}1]$
  \foreach \i in {4,5,6,7}
    { \draw[very thick] (3,2) -- (\i,3); \node[simp] at (\i,3) {}; }
  \node[anchor=west,gray!60] at (-0.45,1) {block $2$};
  \node[anchor=west,gray!60] at (-0.45,2) {block $4$};
  \node[anchor=west,gray!60] at (-0.45,3) {block $8$};
  \node[full] at (7.0,4.7) {};
  \node[anchor=west] at (6.82,4.7) {full node $\circ$: $(2\ \mathrm{bit})\times(2\ \mathrm{bit})\to 2\ \mathrm{bit}$};
  \node[simp] at (7.0,5.3) {};
  \node[anchor=west] at (6.82,5.3) {simplified node: $(2\ \mathrm{bit})\times(1\ \mathrm{bit})\to 1\ \mathrm{bit}$};
  \draw[very thick] (7.15,5.9) -- (6.85,5.9);
  \node[anchor=west] at (6.82,5.9) {the four consumers of $[2{:}{-}1]$: fan-out $w/2=4$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.18, p. 122; node shapes after Fig. 5.16, p. 121.*

**Fix the operator, then stop worrying about correctness.** Each bit position $i$ contributes the 2-bit tuple $X_i=(g_i,a_i)$ — **generate** $g_i=x_iy_i$ and **alive** $a_i=x_i\vee y_i$, one bit each, both available one gate level after the $w$-bit operands $X,Y$ arrive. The prefix operator composes two tuples (Eqs. 5.35-5.37, p. 120):

$$(g_L,a_L)\circ(g_R,a_R)=\big(\,g_L\vee a_Lg_R,\ \ a_La_R\,\big)$$

so every edge in the graph above is a **2-bit** bus, and $c_{i+1}$ is the $g$-half of $X_i\circ X_{i-1}\circ\cdots\circ X_{-1}$ with $X_{-1}=(c_0,c_0)$ (Eq. 5.48, p. 121). $\circ$ is associative — proved by substitution and **distributivity of AND over OR** in Eqs. 5.39-5.43, and that proof, not anything about this particular graph, is the entire correctness argument; see [[Parallel Prefix Adders]]. Every bracketing of that product is a legal adder, so the only question left is *which sub-products to name*.

**Sklansky's answer: name the ones that the most outputs can share.** Bracket the product by splitting the index range in half, computing both halves recursively, then handing the left (more significant) half a single copy of the right half's total. Written out for $c_7$ on $n=8$ prefix inputs:

$$c_7=\underbrace{\big(X_6\circ(X_5\circ X_4)\big)}_{[6{:}3]}\ \circ\ \underbrace{\big((X_3\circ X_2)\circ(X_1\circ X_0)\big)}_{[3{:}0]}$$

Its neighbours $c_5,c_6,c_8$ split about the *same* midpoint and therefore end in the *same* right factor $[3{:}0]$. That is the whole design decision: [[Kogge-Stone Tree]] gives every output its own private balanced tree offset by one, so nothing is shared and nothing is contended; Sklansky maximises sharing at the same depth, and the shared node becomes a single wire that four outputs pull on.

**Read the construction off the block size, not off a span.** Level $k=1,2,\ldots,\log_2 n$ works on blocks of $2^k$ consecutive positions. Within a block starting at $b$, every position $i$ in the **upper half** already holds $[i:m+1]$ from level $k-1$, and the midpoint $m=b+2^{k-1}-1$ already holds $[m:b]$, so one node finishes it:

$$[i:b]\;=\;[i:m+1]\circ[m:b]$$

Positions in the lower half do nothing at this level — their prefix already reaches the block start — and after $\log_2 n$ levels the single block is the whole range, so every position holds $[i:0]$. Contrast the shift description of Kogge-Stone: there the *offset* doubles each stage and every position is active; here the *block* doubles and only half the positions are active, which is precisely the factor of two in node count.

**Count the nodes; the count is a level-wise identity, not a sum.** At level $k$ there are $n/2^k$ blocks each producing $2^{k-1}$ nodes, so each level produces

$$\frac{n}{2^k}\cdot 2^{k-1}=\frac{n}{2}\quad\text{nodes, independent of }k$$

— the $2^k$ cancels — and over $\log_2 n$ levels that is $\tfrac{n}{2}\log_2 n$. At $n=8$: $12$, the twelve circles above, and the *"12 adders in Fig. 5.15b compared to 8 adders of Fig. 5.15a"* the book counts for its prefix-sum example on p. 119. Against Kogge-Stone's $n\log_2 n-n+1=17$ that is about $70\%$ of the nodes at the same depth $3$, and the gap widens with $n$ — the ratio tends to $\tfrac12$.

> [!important] The saving and the pathology are the same wire
> Sharing $[3{:}0]$ across four outputs is *why* there are 12 nodes and not 17, and it is also why that node drives 4 loads. At level $k$ a block midpoint feeds the $2^{k-1}$ positions of its upper half, so fan-out is graded $1,2,4,\ldots$ and the top-level midpoint $[n/2-1:0]$ carries the maximum $n/2$ — four at $n=8$, sixteen at $n=32$, growing linearly while depth grows logarithmically. An output driving $f$ inputs sees $f\times$ the load capacitance; a VLSI flow buys the edge rate back with a stronger driver, which costs area and **dynamic power** (p. 121). Kogge-Stone's flat cap of $2$ is what those $5$ extra nodes are buying.

**This is the conditional-sum adder, drawn as a prefix graph.** The [[Conditional-Sum Adder]] halves the operand, computes the high half speculatively for both carry-ins and selects with a mux, so its $c_{w/2}$ drives a $w/2$-bit multiplexer — $w/2$ gate inputs (p. 116). That is the identical net with the identical fan-out: replace every $\circ$ node by a 1-bit mux and the two graphs coincide. The prefix formulation is the more useful one because it exposes the fan-out as a graph property you can trade against depth, rather than as a surprise the synthesiser silently absorbs into buffers.

**Inject the carry-in in one row and the sum in another.** Two arrangements give the same adder. Fig. 5.18 makes $c_0$ the rightmost prefix input $X_{-1}=(c_0,c_0)$, so $n=w+1$ columns yield $c_1\ldots c_w$ directly; every node whose span reaches $X_{-1}$ then emits only its $g$-half — its result *is* a carry, no consumer reads its alive bit — which is the filled/open distinction of Fig. 5.16 and takes those nodes from four gates to two. The alternative (Fig. 5.15b) runs the tree on $X_0\ldots X_{w-1}$ alone and injects $c_0$ afterwards in one row of $w$ AND-ORs, $c_{i+1}=G_{i:0}\vee A_{i:0}c_0$: one gate level, cost **linear in $w$**, and duplicating just that row for $c_0\in\{0,1\}$ yields $X+Y$ and $X+Y+1$ from one tree — the [[Compound Adder]]. Sum completion is one XOR per bit, $s_i=p_i\oplus c_i$ with $p_i=x_i\oplus y_i$; note $p_i\neq a_i$, since the tree needs *alive* and the sum needs *propagate*, and they differ exactly when $x_i=y_i=1$. Neither row is drawn in Fig. 5.18.

**On an FPGA the fan-out argument changes shape, and then the whole comparison changes target.** Load capacitance is not the FPGA cost model: a net with $w/2$ sinks costs *routing* — extra switch-box hops, and possibly a replicated driver LUT the tools insert for you — while a LUT presents 6 fixed inputs whether the net feeding it is heavy or light. What dominates instead is that `+` maps to the hardened carry chain rather than to any tree at all, and that chain beats $\log_2 w$ soft logic well past 32 bits; see [[FPGA Hard Carry Chain Adder]]. [LPB19] find prefix trees paying only on $1024$- to $8192$-bit operands, and there report a quasi-linear relationship between prefix-tree complexity and performance — on FPGA the structures line up in a predictable order instead of trading off, which erases most of Sklansky's advantage over [[Brent-Kung Tree]].

> [!warning] The source quantifies neither side of the fan-out trade
> The book states the $n/2$ fan-out and says a stronger driver costs power (p. 121), but gives no delay, driver-size or energy figure for it, and no gate or LUT count for any of the three trees. The break-even between $5$ saved nodes and one $n/2$-load net is technology-dependent and is not derivable from this chapter — needs outside research ([Zim97] tabulates area, delay and wire cost; [Har03] parameterises the taxonomy).

$$\boxed{\ \text{depth}=\log_2 n,\qquad \text{nodes}=\frac{n}{2}\log_2 n,\qquad \text{max fan-out}=\frac{n}{2}\ }$$

**When it breaks.**

- **Large $n$ on ASIC.** Fan-out $n/2$ grows linearly. Past roughly a few tens of bits the buffering needed to drive that net re-introduces the $\log$ depth you just bought, so the nominal $\log_2 n$ stops being the delay. Kogge-Stone's constant $2$ and Brent-Kung's constant $3$ have no such failure mode.
- **$n$ not a power of two.** The halving is exact only on powers of two; depth becomes $\lceil\log_2 n\rceil$, the top blocks are ragged, and $\tfrac{n}{2}\log_2 n$ over-counts.
- **Skewed arrival or release times.** Uniform halving is optimal only for a flat input-arrival profile. When input bits arrive at different times, or output bits are required at different times, shape the tree to the profile instead ([Zim97], Ch. 5).
- **On FPGA below a few hundred bits.** The hard carry chain is faster *and* smaller; the crossover is a property of the fabric, not of $w$. See [[Choosing an Adder]].
- **Format, not adder.** The result is exact — $c_\text{out}S$ is $w+1$ bits holding $X+Y+c_0$ with no rounding. Anything lossy in the surrounding datapath is a format decision; see [[Number Formats]] and [[Error Accuracy]].

**RTL (Spade).** Unlike Kogge-Stone, Sklansky is not a sequence of uniform shifts — the midpoint is *broadcast*, not translated — so the twelve nodes are written out, one `po` call per circle in the diagram.

```spade
/// full prefix operator o : (g,a) x (g,a) -> (g,a)
fn po(l: (bool, bool), r: (bool, bool)) -> (bool, bool) {
    let (gl, al) = l;
    let (gr, ar) = r;
    (gl || (al && gr), al && ar)
}

/// simplified node: the right operand's alive half is never read
fn pos(l: (bool, bool), gr: bool) -> bool {
    let (gl, al) = l;
    gl || (al && gr)
}

fn sklansky8(x: uint<8>, y: uint<8>, cin: bool) -> uint<9> {
    let g = (x & y).as_bits();          // generate, 8 bits
    let a = (x | y).as_bits();          // alive,    8 bits

    // block 2: pair the two halves of every 2-block
    let p10 = po((g[1], a[1]), (g[0], a[0]));
    let p32 = po((g[3], a[3]), (g[2], a[2]));
    let p54 = po((g[5], a[5]), (g[4], a[4]));
    let p76 = po((g[7], a[7]), (g[6], a[6]));

    // block 4: the upper half of every 4-block hangs off that block's midpoint
    let p20 = po((g[2], a[2]), p10);
    let p30 = po(p32, p10);
    let p64 = po((g[6], a[6]), p54);
    let p74 = po(p76, p54);

    // block 8: all four upper outputs hang off the single midpoint [3:0]
    let p40 = po((g[4], a[4]), p30);
    let p50 = po(p54, p30);
    let p60 = po(p64, p30);
    let p70 = po(p74, p30);

    // bottom row of simplified nodes: c_{i+1} = G_{i:0} | A_{i:0} c_0
    let c: [bool; 8] = [cin,
        pos((g[0], a[0]), cin), pos(p10, cin), pos(p20, cin), pos(p30, cin),
        pos(p40, cin),          pos(p50, cin), pos(p60, cin)];

    let s = (x ^ y) ^ c.as_uint();      // sum completion, 8 bits
    pos(p70, cin).as_uint().concat(s)   // c_8 : s , 9 bits
}
```

`pXY` names the node at column $X$ holding $[X{:}Y]$, so `p30` is the thick-edged midpoint of the drawing and `p40 p50 p60 p70` are its four thick edges — the fan-out is literally the number of times one identifier appears on a right-hand side. This is the Fig. 5.15b arrangement: the tree runs on $X_0\ldots X_7$ and $c_0$ enters only in the `pos` row, so `sklansky8` is a full 8-bit adder with a 9-bit result, whereas Fig. 5.18 spends a column on $c_0$ and adds 7 bits — the same 12-node graph, shifted one column. Widths: `g` and `a` are `[bool; 8]`, every `po` result is a 2-bit tuple, every `pos` result is 1 bit, `c.as_uint()` packs element 0 as the LSB so `c` is the carry vector $c_7\ldots c_0$, and `concat` on integers puts $c_8$ high. It is entirely combinational — a `fn` cannot hold a `reg`, so the three block levels are logic depth, not pipeline stages. Synthesis will not reproduce the drawing: it constant-folds the alive half of any `po` whose consumers all ignore it (which is where Fig. 5.18's filled nodes come from), and it inserts buffers on `p30` that no line of this code mentions.

**Related Notes.**

- [[Parallel Prefix Adders]] – depends-on: supplies the associativity of $\circ$, which is the entire correctness proof for this bracketing and every other.
- [[Kogge-Stone Tree]] – compares: same minimum depth, $n\log_2 n-n+1$ nodes instead of $\tfrac n2\log_2 n$, fan-out capped at $2$ instead of $n/2$.
- [[Brent-Kung Tree]] – compares: the third corner — fewest nodes and lightest wiring, constant fan-out $3$, one extra level.
- [[Conditional-Sum Adder]] – compares: the identical graph with muxes in place of $\circ$-nodes, and the identical $w/2$ fan-out on its select net.
- [[RCA, Ripple-Carry Adder]] – counter-example: the fully right-nested bracketing — depth $w$, fan-out $1$, no sharing to pay for.
- [[Compound Adder]] – extends: duplicate only the carry-injection row and one tree emits $X+Y$ and $X+Y+1$.
- [[Choosing an Adder]] – compares: whether minimum depth at $n/2$ fan-out is the right corner for your $w$ and target.
- [[FPGA Hard Carry Chain Adder]] – counter-example: on FPGA the hardened linear chain beats every tree here up to hundreds of bits.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.6 Parallel prefix adders, pp. 118-123 — Fig. 5.15 (sequential versus Sklansky prefix sum, 12 adders against 8, p. 119); Eqs. 5.33-5.48 (tuple, operator, associativity proof, carry identity, pp. 120-121); Fig. 5.16 (full and simplified prefix operator, p. 121); fan-out discussion and the $w/2$ figure, p. 121; Fig. 5.18 (the Sklansky parallel-prefix adder, p. 122).
- §5.3.3 Conditional-sum adder, p. 116 — the same $w/2$ fan-out on a select net, Fig. 5.13.
- §5.3.7 Compound fast adder, p. 123 — Fig. 5.20.
- §5.5 Fast adders on FPGAs, pp. 134-139 — [LPB19] on prefix trees for 1024- to 8192-bit FPGA adders.

Primary source: Sklansky [Skl60]. Cost surveys: Zimmermann [Zim97], Harris [Har03].
