---
title: Prefix Incrementer
description: "Lookahead increment where the carry prefix degenerates to a pure AND-prefix — log-depth carry, half the wires of the adder tree because the generate rail vanishes."
kind: circuit
source: "2.8) Counters §The increment is an adder with one operand tied to 1, §Synchronous counters, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, incrementer, prefix, carry, fpga]
aliases:
  - Prefix Incrementers
  - Lookahead Incrementer
  - Carry-Lookahead Incrementer
  - Parallel Prefix Incrementer
  - AND-Prefix Incrementer
  - Log-Depth Incrementer
---

# Prefix Incrementer

An incrementer whose carries come from a prefix tree instead of a chain, distinguished from every other prefix operator by the fact that its prefix operator is not a four-gate carry node but a bare AND2.

```tikz title="8-bit prefix incrementer: Kogge-Stone AND-prefix tree, EN entering as the carry-in, single-rail nodes"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,
    nd/.style={circle,fill=black,inner sep=1.7pt},
    sq/.style={rectangle,draw,fill=white,inner sep=1.7pt}]

  % bit i sits at x = (7-i)*1.4 ; MSB on the left
  \foreach \i in {0,...,7} {
    \pgfmathsetmacro\x{(7-\i)*1.4}
    \draw[gray!50] (\x,0) -- (\x,-4.2);
    \node[above] at (\x,0.05) {$q_{\i}$};
  }
  \node[anchor=west] at (11.1,0) {$q$ / $8$, one rail per bit};

  % level 1 : span 1, nodes at i = 1..7
  \foreach \i in {1,...,7} {
    \pgfmathsetmacro\x{(7-\i)*1.4}
    \draw (\x+1.4,0) -- (\x,-1.1);
    \node[nd] at (\x,-1.1) {};
  }
  \node[anchor=west] at (11.1,-1.1) {span $1$ \; (7 nodes)};

  % level 2 : span 2, nodes at i = 2..7
  \foreach \i in {2,...,7} {
    \pgfmathsetmacro\x{(7-\i)*1.4}
    \draw (\x+2.8,-1.1) -- (\x,-2.2);
    \node[nd] at (\x,-2.2) {};
  }
  \node[anchor=west] at (11.1,-2.2) {span $2$ \; (6 nodes)};

  % level 3 : span 4, nodes at i = 4..7
  \foreach \i in {4,...,7} {
    \pgfmathsetmacro\x{(7-\i)*1.4}
    \draw (\x+5.6,-2.2) -- (\x,-3.3);
    \node[nd] at (\x,-3.3) {};
  }
  \node[anchor=west] at (11.1,-3.3) {span $4$ \; (4 nodes)};

  % EN rail: one AND per column turns the prefix into a carry
  \draw[<-] (-0.3,-4.2) -- (12.9,-4.2);
  \node[above] at (11.9,-4.15) {EN $=c_{0}$ / $1$};
  \foreach \i in {0,...,7} {
    \pgfmathsetmacro\x{(7-\i)*1.4}
    \node[sq] at (\x,-4.2) {};
  }

  % each AND emits c_{i+1}, which is consumed one bit position to the LEFT
  \foreach \i in {0,...,6} {
    \pgfmathsetmacro\x{(7-\i)*1.4}
    \draw[->] (\x,-4.2) -- (\x-1.4,-5.0);
  }
  % bit 7's carry-out leaves the datapath as the terminal count
  \draw[->] (0,-4.2) -- (-1.6,-5.0);
  \node[anchor=north east] at (-1.5,-5.05) {TC $=c_{8}$ / $1$};
  % bit 0's carry-in is EN itself -- no AND
  \draw[->] (11.2,-4.2) -- (11.2,-5.0);

  % sum row
  \draw (-0.5,-5.8) rectangle (11.9,-5.0);
  \node at (5.7,-5.4) {$8\times$ XOR2 \;:\; $s_i=q_i\oplus c_i$};
  \draw[->] (5.7,-5.8) -- (5.7,-6.5);
  \node[below] at (5.7,-6.5) {$s=q+\mathrm{EN} \bmod 2^{8}$ \; / \; $8$};

  \node[anchor=west,align=left] at (-1.6,-7.6)
    {$\bullet$ prefix node $=$ one AND2 and one $1$-bit wire: with every $g_i=0$\\
     the $(g,a)$ pair collapses to a single rail, so no $g$ track is routed.\\
     $\square$ carry node: $c_{i+1}=\mathrm{EN}\wedge q_i\wedge\cdots\wedge q_0$.};

\end{circuitikz}
\end{document}
```

**Tie the second operand to zero and three per-bit rails become one.** A prefix adder's front end computes, from $n$-bit operands $x$ and $y$, the three 1-bit signals $g_i=x_iy_i$, $p_i=x_i\oplus y_i$, $a_i=x_i\vee y_i$ per position ([[Parallel Prefix Adders]]). An increment is not $Q+1$ written as an addition with $y_0=1$; it is $Q+0$ with the constant folded into the carry-in, $c_0=\mathrm{EN}$, which is what makes **every** $y_i=0$ rather than just the upper $n-1$ of them ([[Incrementer]]). By $x\wedge0=0$, $x\vee0=x$ and $x\oplus0=x$,

$$g_i=0,\qquad p_i=a_i=q_i \qquad (i=0,\dots,n-1)$$

so the front end costs **no gates at all** — the alive signal *is* the state bit, straight off the register output. Everything below is the carry problem alone, which is the only part of an adder that was ever hard.

**The prefix operator collapses to AND, which is the whole content of this note.** The carry operator on 2-bit tuples is $(g_L,a_L)\circ(g_R,a_R)=(g_L\vee a_Lg_R,\;a_La_R)$ — four gates, two bits in on each side, two out. Substitute $g_L=g_R=0$ and evaluate the generate half: $0\vee(a_L\wedge0)=0\vee0=0$, again by $x\wedge0=0$ and the identity $0\vee x=x$. The alive half is untouched. Hence

$$(0,a_L)\circ(0,a_R)=(0,\;a_L\wedge a_R)$$

The generate component is identically $0$ at **every node of the graph**, not merely unused at some of them, so it is a constant and can be deleted from the type. What remains is $(\{0,1\},\wedge)$ — a commutative monoid with identity $1$ — and the reduction is a plain AND-prefix. Per node the bill drops from four gates and two output wires to **one AND2 and one wire**; even the adder's *simplified* carry-only node, which already costs two gates, halves again.

**Fold in the carry-in and the prefix is the carry.** Encode the carry-in as the extra element $X_{-1}=(c_0,c_0)$, the block that generates exactly when $c_0=1$. Folding the all-zero-generate elements first gives $(0,\bigwedge_{j<i}q_j)$, and one more application of $\circ$ attaches the carry-in:

$$\Big(0,\ \bigwedge_{j<i}q_j\Big)\circ(c_0,c_0)=\Big(\,0\vee\big(\textstyle\bigwedge_{j<i}q_j\big)c_0,\ \ \big(\textstyle\bigwedge_{j<i}q_j\big)c_0\Big)$$

Both components are now the same expression, which is the degenerate case of the prefix-adder induction whose first component is $c_i$. So, with the sum row inherited unchanged as $s_i=p_i\oplus c_i$,

$$c_i=\mathrm{EN}\wedge\bigwedge_{j<i}q_j,\qquad q_i^{+}=q_i\oplus c_i,\qquad \mathrm{TC}=c_n=\mathrm{EN}\wedge\bigwedge_{j<n}q_j$$

That is bit-for-bit the closed form the ripple half-adder chain reaches by induction on $c_{i+1}=q_ic_i$ — **by associativity of AND the tree changes the bracketing and nothing else**, so no correctness argument is owed for any particular shape. Bit $i$ toggles when the enable is high and every lower bit is $1$; the terminal count is the carry-out, free as always.

**Read the carry vector as a mask and the circuit stops looking arithmetic.** $c_i=1$ exactly when bits $0\ldots i-1$ are all ones, so if $Q$ has $k$ trailing ones then $c_0\ldots c_k=1$ and $c_j=0$ above. The $n$-bit toggle vector $t=(c_{n-1},\dots,c_0)$ is therefore the mask of the trailing run of ones *plus the first zero above it*, and $Q^{+}=Q\oplus t$ is the software bit-trick $q+1=q\oplus(q\oplus(q+1))$ built in gates. The AND-prefix tree is, structurally, a trailing-ones detector; the same tree with $\overline{q_j}$ on its inputs is the borrow network of a down-counter, since $\overline{Q}+1$ complements to $Q-1$ by the two's-complement identity of [[Number Formats]] — see [[Up-Down Counter]].

**The cost is one AND2 per prefix node, and the graph decides how many.** Widths: $Q$ and $Q^{+}$ are $n$ bits, $\mathrm{EN}$ is 1 bit, the carry vector $c_0\ldots c_n$ is $n+1$ bits, TC is 1 bit. Gates: $n$ XOR2 for the sum row regardless of shape, plus the node count of the chosen graph in AND2s, plus $n$ AND2s if $\mathrm{EN}$ is gated per column as drawn. Depth is $\lceil\log_2 n\rceil\,t_{\mathrm{AND}}+t_{\mathrm{XOR}}$ against the chain's $(n-1)\,t_{\mathrm{AND}}+t_{\mathrm{XOR}}$ ([[Synchronous Counters]], where this term sits inside $T_{\mathrm{clk}}\ge t_{cq}+t_{\text{logic}}+t_{su}+t_{\text{skew}}$). The three named shapes trade the same way they do for adders, only with every node an eighth the size:

- [[Kogge-Stone Tree]] — depth $\lceil\log_2 n\rceil$, $n\log_2 n-n+1$ nodes, fan-out $2$. At $n=8$: 17 AND2, the shape drawn above. Its usual objection is wire tracks, and that objection is **halved here** — one rail per edge instead of two — which is exactly why Kogge-Stone is more defensible in an incrementer than in an adder.
- [[Brent-Kung Tree]] — depth $2\log_2 n-2$, roughly $2n$ nodes, minimal duplication and the shortest spans. One extra level and a quarter of the metal.
- [[Sklansky Tree]] — minimum depth at $\tfrac{n}{2}\log_2 n$ nodes, but one node drives $n/2$ loads. Depth is not delay: that node's RC load, not the level count, sets the path.

**On an FPGA this circuit loses, and it loses structurally rather than narrowly.** Every modern fabric hardens the ripple chain — Xilinx `CARRY4`/`CARRY8`, Intel ALM carry — with a per-bit propagate delay well under one LUT delay and dedicated vertical routing that costs no general interconnect ([[FPGAs]], [[Lookup-Tables]]). The chain incrementer maps one bit per carry cell: the LUT computes the toggle condition, the hard AND does $c_{i+1}=q_ic_i$, the flop is the one already sitting unused in the slice. A prefix tree throws all three away — each node becomes a LUT *and* a general routing hop, so a "level" costs LUT delay plus interconnect delay rather than a fraction of a LUT delay, and the $\log_2 n$ level count buys nothing back. The tree returns on fabric only when the counter physically cannot occupy one carry column: a width that exceeds the column height, or a floorplan that forces the count across regions. On an ASIC there is no hard chain, the comparison is honest gate-for-gate, and the tree wins above some width.

> [!warning] No sourced crossover width
> This note has no book source, and the width at which the tree overtakes the chain is a placed-and-routed property — it depends on the AND2 and XOR2 cell delays, the wire RC of the spans, and on an FPGA on the hardened carry delay, none of which are structural facts. The gate counts and depths above follow from the derivation and are safe; **any specific crossover $n$ must come from synthesis and static timing, not from here.**

**Sparse the tree if the full one is overkill.** Build prefix nodes only at every $k$-th boundary and ripple inside each $k$-bit group: depth $\approx k+\lceil\log_2(n/k)\rceil$ AND levels for $O(n/k \cdot \log(n/k))$ nodes, tunable to whatever the register loop actually needs. This is the same knob as, but a different mechanism from, the [[Two-Stage Prescaled Counter]] and the [[Cascaded Counter Chain]] — those give the upper bits $2^k$ clock periods to settle by exploiting the *rate* at which high bits change, and so remain $O(n)$ in depth while meeting timing. Sparsing shortens the combinational path itself; prescaling hides it. They compose.

$$\boxed{\ (0,a_L)\circ(0,a_R)=(0,\,a_L\wedge a_R)\ \Longrightarrow\ c_i=\mathrm{EN}\wedge\!\!\bigwedge_{j<i}q_j,\quad q_i^{+}=q_i\oplus c_i\ }$$

**When it breaks**

- **Only $\pm1$ degenerates.** Increment by a constant $k$ gives $g_i=q_i\wedge k_i$, which is $q_i$ on every bit where $k$ has a one — the generate rail survives there and you are back to a full two-rail prefix adder on those positions. Only $k=1$ absorbed into $c_0$ (or $k=2^m$, above bit $m$) kills $g$ everywhere. An accumulator, a load-and-add, or a strided counter gets none of this.
- **EN becomes a high fan-out net.** In the chain, $\mathrm{EN}$ drives exactly one node, the carry into bit 0. Gated per column as drawn it drives $n$ ANDs and needs buffering — which is a level, the level you just bought. Folding $\mathrm{EN}$ into the tree as $X_{-1}$ instead keeps its fan-out logarithmic at the cost of one more prefix position; pick deliberately rather than by default.
- **Below roughly a byte, nothing has started.** At $n=4$ the chain is depth 3 and the tree depth 2, for more than twice the gates and all the routing — the asymptotics need width to pay for themselves, and on FPGA they never do.
- **Decode glitching is unchanged.** All $n$ bits still flip at $0111\ldots\to1000\ldots$, so a combinational decode of $Q$ still sees transient codes for $t_{\text{skew}}+\Delta t_{cq}$, and a count crossing a clock domain still needs [[Gray Counter]]. The tree makes the counter faster, not safer.
- **A comparator in series now dominates.** The compare-and-clear [[Modulo-N Counter]] adds an $n$-literal equality to a path that is now only $\log_2 n$ deep, so it becomes the critical term. Prefer [[Preload-and-Overflow Counter]] or [[Zero-Detect Down Counter]], both of which read the terminal condition out of the carry network for free.

**RTL (Spade)**

```spade
// Kogge-Stone AND-prefix incrementer, 8 bits.
fn ks_inc8(q: uint<8>, en: bool) -> uint<9> {
    let a = q.as_bits();

    // level 1 -- span 1
    let y0 = a[0];
    let y1 = a[1] && a[0];
    let y2 = a[2] && a[1];
    let y3 = a[3] && a[2];
    let y4 = a[4] && a[3];
    let y5 = a[5] && a[4];
    let y6 = a[6] && a[5];
    let y7 = a[7] && a[6];

    // level 2 -- span 2
    let z2 = y2 && y0;
    let z3 = y3 && y1;
    let z4 = y4 && y2;
    let z5 = y5 && y3;
    let z6 = y6 && y4;
    let z7 = y7 && y5;

    // level 3 -- span 4
    let p4 = z4 && y0;
    let p5 = z5 && y1;
    let p6 = z6 && z2;
    let p7 = z7 && z3;

    // c[i] is the carry into bit i; c[8] is the terminal count
    let c = [en,
             en && y0, en && y1, en && z2, en && z3,
             en && p4, en && p5, en && p6, en && p7];

    [a[0] != c[0], a[1] != c[1], a[2] != c[2], a[3] != c[3],
     a[4] != c[4], a[5] != c[5], a[6] != c[6], a[7] != c[7],
     c[8]].as_uint()
}
```

`y`, `z`, `p` are the three node rows of the diagram, each `&&` one filled circle; `c` is the row of squares, and `c[8]` is TC. Widths: `q` is 8 bits, the return is 9 — sum in `[0..7]`, terminal count in bit 8 — because `[bool; N].as_uint()` packs **element 0 as the LSB**, the convention that makes a bit-reversed incrementer compile silently and the reason this was simulated rather than merely compiled. `!=` is the boolean XOR here (`^` is not defined on `bool` in Spade). The block is purely combinational; a counter is `reg(clk) q reset(rst: 0) = trunc(ks_inc8(q, en));`, one `trunc` because the wrap at $2^8$ is the specification, not an overflow. Synthesis will not preserve this bracketing — a mapper is free to rebalance the AND tree, and on FPGA it will discard it entirely for the hard carry chain, which is precisely the argument above.

**Related Notes**

- [[Parallel Prefix Adders]] – depends-on: the operator $\circ$, its associativity, and the theorem that any prefix graph is correct — everything this note degenerates.
- [[Incrementer]] – compares: the same closed form computed by the right-nested bracketing, $O(n)$ deep and $n$ gates.
- [[Kogge-Stone Tree]] – extends: the shape drawn above, minimum depth at maximum node count, with its wire penalty halved here.
- [[Brent-Kung Tree]] – compares: one extra level for roughly half the nodes and much shorter spans.
- [[Sklansky Tree]] – compares: minimum depth, fewest nodes of the three, one node at fan-out $n/2$.
- [[Synchronous Counters]] – supports: where $t_{\text{logic}}$ lands in the register loop this circuit is trying to shorten.
- [[Up-Down Counter]] – extends: complement the tree's inputs and the identical graph produces the borrow.
- [[Two-Stage Prescaled Counter]] – compares: meets the same timing constraint by exploiting bit rates instead of by reassociating.
- [[Choosing a Counter]] – compares: where this sits against every sibling.
- [[FPGAs]] – counter-example: the hardened carry chain reverses the asymptotics at every width you would build.

## References

- [[2.8) Counters]] — §The increment is an adder with one operand tied to 1 (the $g_i=0$, $p_i=a_i$ collapse and the "why lookahead degenerates too" paragraph), §Synchronous counters ($t_{\text{logic}}$ for the prefix increment), §Trade-offs (the prefix-increment row), §FPGA mapping (the hard carry chain argument).
- No textbook source for this topic. The material is standard in Weste & Harris, *CMOS VLSI Design* (datapath subsystems: incrementers as degenerate adders, prefix structures), Wakerly, *Digital Design: Principles and Practices* (counters and enable structures), and Mano & Ciletti, *Digital Design* (registers and counters). Page numbers are deliberately omitted — no copy was consulted while writing.
