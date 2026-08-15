---
title: "Dimension-Order Routing Unit"
description: "Two magnitude comparators feeding a 5-way priority mux that emits E/W/N/S/L — stateless deadlock-free routing for a mesh, at the cost of zero path diversity."
kind: circuit
source: "6.3) Network-On-Chip §Routing and deadlock freedom, §Worked example — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, routing, comparator, mesh]
aliases:
  - XY Routing
  - XY Router
  - Dimension-Order Routing
  - Dimension Order Routing
  - DOR
---

# Dimension-Order Routing Unit

The deterministic mesh routing function that exhausts the $X$ dimension before touching $Y$, computed by two magnitude comparators and three AND gates with no stored state whatsoever.

```tikz title="Dimension-order routing unit: two magnitude comparators, the X-equality flag gating the Y outputs, one-hot 5-bit port select"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- comparator X ----
  \draw (1.6,3.4) rectangle (3.9,5.2);
  \node at (2.75,4.65) {cmp $X$};
  \node at (2.75,3.95) {$x_d \gtrless x_c$};
  \draw[->] (0.15,4.8) -- (1.6,4.8);
  \node[anchor=east] at (0.1,4.8) {$x_d$ [$n$]};
  \draw[->] (0.15,3.8) -- (1.6,3.8);
  \node[anchor=east] at (0.1,3.8) {$x_c$ [$n$]};

  % ---- comparator Y ----
  \draw (1.6,0.4) rectangle (3.9,2.2);
  \node at (2.75,1.65) {cmp $Y$};
  \node at (2.75,0.95) {$y_d \gtrless y_c$};
  \draw[->] (0.15,1.8) -- (1.6,1.8);
  \node[anchor=east] at (0.1,1.8) {$y_d$ [$n$]};
  \draw[->] (0.15,0.8) -- (1.6,0.8);
  \node[anchor=east] at (0.1,0.8) {$y_c$ [$n$]};

  % ---- gates ----
  \node[and port] (gn) at (7.9,2.6) {};
  \node[and port] (gs) at (7.9,0.5) {};
  \node[and port] (gl) at (7.9,-1.6) {};

  % ---- direct outputs E, W ----
  \draw[->] (3.9,5.05) -- (10.2,5.05);
  \node[anchor=south] at (6.6,5.1) {$g_x=[\,x_d>x_c\,]$};
  \node[anchor=west] at (10.25,5.05) {$E$};
  \draw[->] (3.9,4.35) -- (10.2,4.35);
  \node[anchor=south] at (6.6,4.4) {$l_x=[\,x_d<x_c\,]$};
  \node[anchor=west] at (10.25,4.35) {$W$};

  % ---- e_x enable trunk ----
  \draw (3.9,3.65) -- (6.1,3.65);
  \node[anchor=south] at (5.0,3.7) {$e_x=[\,x_d=x_c\,]$};
  \draw (6.1,3.65) |- (gn.in 1);
  \draw (6.1,3.65) |- (gs.in 1);
  \draw (6.1,3.65) |- (gl.in 1);
  \fill (gn.in 1 -| 6.1,0) circle (1.6pt);
  \fill (gs.in 1 -| 6.1,0) circle (1.6pt);

  % ---- Y comparator outputs ----
  \draw (3.9,2.0) -- (4.4,2.0) |- (gn.in 2);
  \node[anchor=south] at (gn.in 2 -| 5.55,0) {$g_y$};
  \draw (3.9,1.3) -- (4.9,1.3) |- (gs.in 2);
  \node[anchor=south] at (gs.in 2 -| 5.55,0) {$l_y$};
  \draw (3.9,0.6) -- (5.4,0.6) |- (gl.in 2);
  \node[anchor=south] at (gl.in 2 -| 5.55,0) {$e_y$};

  % ---- gate outputs ----
  \draw[->] (gn.out) -- (10.2,2.6);
  \node[anchor=west] at (10.25,2.6) {$N$};
  \draw[->] (gs.out) -- (10.2,0.5);
  \node[anchor=west] at (10.25,0.5) {$S$};
  \draw[->] (gl.out) -- (10.2,-1.6);
  \node[anchor=west] at (10.25,-1.6) {$L$};

  % ---- one-hot boundary ----
  \draw[dashed] (9.9,-2.1) -- (9.9,5.7);
  \node[anchor=west,align=left] at (10.7,1.6)
    {one-hot, 5 bits,\\ zero flops:\\ to switch allocator};

\end{circuitikz}
\end{document}
```

**Read the routing function as a trichotomy, not as a subtraction.** On a $k\times k$ mesh each coordinate is an unsigned integer of $n=\lceil\log_2 k\rceil$ bits ([[Number Formats]] for the encoding; nothing here is signed). The specification is written with differences,

$$
\text{port}=\begin{cases}
E & \Delta x>0\\ W & \Delta x<0\\ N & \Delta x=0,\ \Delta y>0\\ S & \Delta x=0,\ \Delta y<0\\ L & \Delta x=\Delta y=0
\end{cases}
\qquad \Delta x = x_d-x_c,\ \ \Delta y = y_d-y_c ,
$$

but every branch tests only the *sign* and the *zero-ness* of a difference, never its magnitude. Building $\Delta x$ literally costs an $(n{+}1)$-bit two's-complement subtractor whose $n-1$ low bits are then thrown away — the classic case where the [[Magnitude Comparator]] is not an optimisation of the subtractor but a different, smaller circuit. Name the three comparator outputs

$$g_x=[\,x_d>x_c\,],\qquad l_x=[\,x_d<x_c\,],\qquad e_x=[\,x_d=x_c\,]$$

and likewise $g_y,l_y,e_y$; each is 1 bit, each comparator sees $2n$ bits of input.

**Gate the second dimension with the first — that is the entire circuit.** Dimension order says a packet may not move in $Y$ while it still owes a hop in $X$, and "still owes a hop in $X$" is exactly $\overline{e_x}$. So the five port signals are

$$E=g_x,\quad W=l_x,\quad N=e_x\wedge g_y,\quad S=e_x\wedge l_y,\quad L=e_x\wedge e_y .$$

Six of the ten literals cost nothing: $E$ and $W$ are comparator outputs used raw, because a packet with $\Delta x\neq0$ has its answer already. The dimension priority is not a control decision taken somewhere else — it is the single wire $e_x$, fanned to three gates.

> [!important] The "5-way priority mux" collapses into three AND gates because the comparators already emit disjoint terms.
> A magnitude comparator is *complete and exclusive*: $g\vee l\vee e=1$ and the three are pairwise disjoint. Summing the port signals and applying distributivity of AND over OR,
> $$E\vee W\vee N\vee S\vee L \;=\; g_x\vee l_x\vee\big(e_x\wedge(g_y\vee l_y\vee e_y)\big) \;=\; g_x\vee l_x\vee e_x \;=\;1,$$
> and any two of the five conjoin to $0$ — either through $g_x l_x=0$, or through $e_x\overline{e_x}=0$, or through the $Y$ trichotomy under the common factor $e_x$. The output is therefore *exactly* one-hot by construction, so the [[Priority Encoder]] the case-split resembles is never built: its arbitration has been discharged at compile time by choosing which flag gates which output. An **adaptive** router does need the encoder, because its productive set genuinely has more than one member and something must break the tie at runtime.

**Widths and cost, with $n=\lceil\log_2 k\rceil$.** Inputs: $x_c,y_c$ ($n$ bits each, hardwired constants at a given router — the node's own address) and $x_d,y_d$ ($n$ bits each, carried in the flit header, so $2n$ header bits). Outputs: 5 bits one-hot, or 3 bits if the consumer prefers encoded, at the price of re-encoding what was already resolved. State: **zero flip-flops**. Gate count: each comparator is one equality tree ($n$ XNOR plus an AND-reduce) and one greater-than prefix network, $O(n)$ gates at depth $O(\log n)$ ([[Comparators]]); the gating adds three AND2 at depth 1. Because $e_x$ is a shared output of the $X$ comparator, the $Y$ path is not lengthened by the ordering — $N$, $S$, $L$ settle one gate after $g_y,l_y,e_y$ do, and $E$, $W$ settle before that.

**On FPGA the whole unit is two 6-LUT levels, and the second level absorbs the gating for free.** Split each comparison at the half-word boundary: level 1 computes $g^{hi},e^{hi},g^{lo}$ for $X$ and for $Y$, each a function of $2\lceil n/2\rceil\le 4$ inputs for $k\le16$, so one 6-LUT each with inputs to spare. Level 2 evaluates the standard recombination $g = g^{hi}\vee(e^{hi}\wedge g^{lo})$ — and for the gated ports it evaluates $N=(e^{hi}_x\wedge e^{lo}_x)\wedge\big(g^{hi}_y\vee(e^{hi}_y\wedge g^{lo}_y)\big)$, a function of the five signals $e^{hi}_x,e^{lo}_x,g^{hi}_y,e^{hi}_y,g^{lo}_y$, which still fits a single 6-LUT ([[Lookup-Tables]]). So a $16\times16$ mesh costs 5 LUTs in level 1 and 5 in level 2, two levels total, no carry chain and no flops. On ASIC the same two levels are a comparator cell plus an AND, and the synthesiser will usually flatten $e_x\wedge g_y$ into the comparator's final stage rather than emit a separate gate.

> [!warning] The long-form note's "for $k\le16$ that is one LUT level" is optimistic and is corrected above.
> One level holds only for $E$ and $W$ at $k\le8$: those are 6-input functions of $(x_d,x_c)$ with $n=3$, which is exactly one 6-LUT. $N$, $S$ and $L$ depend on all $4n$ input bits and cannot be one level for any $n\ge2$; at $k\le16$ nothing is one level. Two levels is the honest number, and it is still the cheapest stage in the router by a wide margin.

**Deadlock freedom is a property of the channel ordering, not of these gates.** The circuit is correct in the sense that it computes a productive port; that it is also *deadlock-free* is the separate labelling argument in [[Network-On-Chip]] — label each channel $\ell(c)=(\dim(c),\text{coord}(c))$ lexicographically with $X<Y$, observe that dimension order makes $\ell$ strictly increasing along every dependency edge, conclude the channel dependency graph is acyclic. The gates enforce exactly one clause of that argument, "no $Y\to X$ edge", by refusing to assert $N$, $S$ or $L$ while $\overline{e_x}$ holds. Nothing in the hardware checks the other clause — that a packet never reverses within a dimension — because monotone motion toward the destination makes reversal unreachable, not forbidden.

**Statelessness is what lets the stage move.** Having no flops means the routing computation is not tied to the pipeline stage it nominally occupies, so it can be hoisted a hop upstream: [[Lookahead Routing]] runs these comparators at router $i$ against router $i{+}1$'s coordinates — which are the current coordinates plus a known unit offset in the port direction just chosen — and ships the resulting 5-bit select in the header. The route then arrives already computed and the RC stage vanishes from the critical path, at a cost of 5 header bits. That trade is only available because there is no state to carry across the hoist.

$$\boxed{\ E=g_x,\quad W=l_x,\quad N=e_x g_y,\quad S=e_x l_y,\quad L=e_x e_y,\qquad E+W+N+S+L=1\ }$$

**When it breaks**

- **Zero path diversity, by definition.** $|R|=1$ for every source–destination pair, so a hot link cannot be routed around and an adversarial permutation — transpose, bit-reversal — concentrates load on a few channels while the rest of the bisection idles. This is the cost the description names, and it is not a tuning parameter: it is the same property that made the deadlock proof one paragraph long.
- **Any single link failure disconnects every pair whose XY path crosses it.** There is no second choice to fall back on. Fault tolerance requires a second routing function and therefore a second acyclicity argument; it cannot be bolted on to this unit.
- **It is over-restrictive by two turns.** Cycles in the dependency graph need all four turns of one abstract rotation, so two prohibitions suffice; XY forbids four. [[Turn Model Routing]] recovers the surplus — west-first, north-last, negative-first — with the same comparators and a slightly larger gating network, and that surplus is exactly the adaptivity thrown away here.
- **A torus is not a mesh.** The wraparound closes a dependency cycle *inside* a single dimension, needing no turn at all, so the dimension-order labelling does not apply. The fix is orthogonal to this circuit: split each channel into two virtual channels and switch at a dateline ([[Dateline Virtual Channel Allocation]]).
- **Every router in the network must use the same dimension order.** A mixture of XY and YX nodes re-admits $Y\to X$ edges and reintroduces cycles. The order is a network-wide constant, not a per-router configuration bit.
- **Holes break the monotone argument, not just the performance.** Faulty nodes, non-rectangular floorplans and irregular meshes can leave $g_x$ asserted with no East neighbour to take. The unit will happily assert a port that does not exist; nothing downstream will notice.
- **Higher dimensions extend the priority chain, not the concept.** A $d$-dimensional mesh needs $d$ comparators and gating terms $e_1\cdots e_{j-1}\wedge g_j$, whose depth grows as $\lceil\log_2 d\rceil$ once the equality prefix is built as a tree. Past $d\approx3$ the prefix, not the comparators, sets the delay.

**RTL (Spade)**

```spade
/// Dimension-order (XY) routing. Returns a one-hot port select;
/// array element 0 is the LSB, so the packing is [E, W, N, S, L].
fn dor_route<#uint N>(
    xc: uint<N>, yc: uint<N>,
    xd: uint<N>, yd: uint<N>,
) -> [bool; 5] {
    let gx = xd > xc;
    let lx = xd < xc;
    let ex = xd == xc;

    let gy = yd > yc;
    let ly = yd < yc;
    let ey = yd == yc;

    [gx, lx, ex && gy, ex && ly, ex && ey]
}
```

It is a `fn` and not an `entity` for a reason the note has already argued: a `fn` in Spade may not contain a `reg`, so the type system is enforcing the statelessness claim rather than merely documenting it. `gx`/`lx`/`ex` are the three wires leaving `cmp X` in the diagram and `ex` is the trunk with the two junction dots; `ex && gy` is the top AND gate. `&&` is used rather than `&` because the operands are `bool` — the bitwise `&` would want equal-width integers. The comparison operators are `uint<N> × uint<N> → bool`, so no width growth occurs anywhere and the return value is 5 bits regardless of $N$; the $2n$-bit input width lives entirely in the comparator arguments. Synthesis will not build the two comparators separately as drawn — it flattens $e_x\wedge g_y$ into the $Y$ comparator's last level as described above, which is the one place the netlist stops matching the picture.

Verified by simulating the emitted Verilog against a behavioural reference for $n=4$: 13 named vectors (including the $(1,0)\to(3,2)$ route of the worked example, and the asymmetric pair $1\to8$ / $8\to1$ that a swapped $E$/$W$ would fail), the full exhaustive $16^4=65536$ coordinate space, and 3000 random vectors — 68549 checks, zero mismatches, and the one-hot invariant asserted on every one of them.

**Related Notes**

- [[Magnitude Comparator]] – depends-on: supplies $(g,l,e)$ directly, and the trichotomy that makes the output one-hot without arbitration.
- [[Priority Encoder]] – compares: the structure this function looks like, and which the gating discharges at design time instead of at runtime.
- [[Combinational Logic]] – supports: the distributivity step and the disjoint-cover argument behind the one-hot proof.
- [[Turn Model Routing]] – extends: same comparators, two prohibitions instead of four, adaptivity recovered.
- [[Lookahead Routing]] – extends: hoists this stage one hop upstream, which only works because it holds no state.
- [[Dateline Virtual Channel Allocation]] – counter-example: the torus cycle that dimension order cannot break.
- [[Crossbar Switch]] – supports: the consumer of the 5-bit one-hot, which wants exactly this encoding for its select lines.
- [[Virtual-Channel Router]] – extends: where this unit sits as the RC stage of a full router pipeline.
- [[Choosing a Router Architecture]] – compares: where deterministic dimension order sits against every adaptive sibling.

## References

- [[6.3) Network-On-Chip]] — §Routing and deadlock freedom (the case split, the comparator-plus-priority-mux structure, the channel-dependency-graph theorem and the XY labelling that makes $\mathcal D$ acyclic, the turn-model surplus) and §Worked example (the $(1,0)\to(3,2)$ route used as a named test vector, and the monotone label chain $(X,1)\prec(X,2)\prec(X,3)\prec(Y,0)\prec(Y,1)$).
- No textbook source for this topic. The routing function, the deadlock theorem and the turn model are standard in Dally & Towles, *Principles and Practices of Interconnection Networks*; the comparator and one-hot-select structures are standard in Mano & Ciletti, *Digital Design* and Wakerly, *Digital Design: Principles and Practices*; the LUT-level accounting follows the fabric model in Weste & Harris, *CMOS VLSI Design*. Page numbers are deliberately omitted — no copy was consulted for this note.
