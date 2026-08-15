---
title: Dateline Virtual Channel Allocation
description: "Splits every physical torus link into VC0/VC1 with a one-bit header field flipped at a fixed dateline — cuts the wraparound cycle so a torus routes deadlock-free, at 2x the input buffers and a 2:1 mux per link."
kind: circuit
status: seed
spade: simulated
tags: [digital, network-on-chip, torus, virtual-channel, deadlock]
aliases:
  - Dateline
  - Dateline Routing
  - Dateline VC
  - Dateline Virtual Channels
  - Dateline Class Routing
---

# Dateline Virtual Channel Allocation

A monotone one-bit field in the flit header, set on one designated wraparound link per ring, that layers each physical torus channel into $\mathrm{VC}_0$ and $\mathrm{VC}_1$ — the minimum-virtual-channel construction that makes a torus deadlock-free, and the only one of the deadlock constructions whose entire logic is a single OR gate.

```tikz title="Dateline VC allocation: the ring cut, the split input port, and the one-gate allocator"
\usepackage{circuitikz}
\usetikzlibrary{arrows,calc}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]

% ---------- left: the ring and the dateline cut ----------
\foreach \i in {0,...,7} {
  \node[circ] (n\i) at ({90-45*\i}:1.30) {};
  \node[font=\tiny] at ({90-45*\i}:1.70) {\i};
}
\foreach \i/\j in {0/1,1/2,2/3,3/4,4/5,5/6,6/7} {
  \draw[->,thick] (n\i) -- (n\j);
}
\draw[->,very thick,red] (n7) -- (n0);
\node[font=\tiny,red,anchor=east,align=right] at (-1.20,1.55)
  {dateline link\\ $\mathrm{VC}_0\!\to\!\mathrm{VC}_1$};
\node[font=\tiny,anchor=north,align=center] at (0,-2.05)
  {ring, $k=8$\\ $W=\lceil\log_2 k\rceil=3$};

% ---------- right: one input port of one router ----------
\begin{scope}[xshift=4.3cm]

\draw[->,thick] (-1.55,0.45) -- (-0.32,0.45);
\node[font=\tiny,anchor=south] at (-0.95,0.52) {$w$};
\node[font=\tiny,anchor=north,align=center] at (-0.95,0.36) {physical\\ link};

\draw (-0.30,-0.40) -- (-0.30,1.30) -- (0.25,0.95) -- (0.25,-0.05) -- cycle;
\node[font=\tiny,anchor=south] at (-0.02,1.36) {demux};

\draw (1.05,0.70) rectangle (2.75,1.55);
\node[font=\tiny,align=center] at (1.90,1.125) {$\mathrm{VC}_0$ FIFO\\ $B\!\times\!w$};
\draw (1.05,-0.65) rectangle (2.75,0.20);
\node[font=\tiny,align=center] at (1.90,-0.225) {$\mathrm{VC}_1$ FIFO\\ $B\!\times\!w$};

\draw[->] (0.25,0.80) -| (0.65,1.125) -- (1.05,1.125);
\draw[->] (0.25,0.10) -| (0.65,-0.225) -- (1.05,-0.225);

\draw (3.60,-0.65) -- (3.60,1.55) -- (4.15,1.15) -- (4.15,-0.25) -- cycle;
\node[font=\tiny,rotate=90] at (3.87,0.45) {$2{:}1$};
\draw[->] (2.75,1.125) -- (3.60,1.125);
\draw[->] (2.75,-0.225) -- (3.60,-0.225);
\draw[->,thick] (4.15,0.45) -- (5.45,0.45);
\node[font=\tiny,anchor=south] at (4.80,0.52) {$w$};
\node[font=\tiny,anchor=north,align=center] at (4.80,0.36) {to switch /\\ next hop};

\end{scope}

% ---------- bottom: the allocator itself, one AND and one OR ----------
\begin{scope}[xshift=3.0cm]

\node[font=\tiny,anchor=east] at (-0.35,-2.05) {$\mathit{hop}$ (1)};
\node[font=\tiny,anchor=east] at (-0.35,-2.45) {$\mathit{pos}$ ($W$)};
\node[font=\tiny,anchor=east] at (-0.35,-2.85) {$\mathit{dl}$ ($W$)};
\draw[->] (-0.30,-2.45) -- (0.60,-2.45);
\draw[->] (-0.30,-2.85) -- (0.60,-2.85);

\draw (0.60,-3.05) rectangle (2.20,-2.25);
\node[font=\tiny,align=center] at (1.40,-2.65) {$=$ comparator\\ $W$ bits};

\node[and port,scale=0.62] (a1) at (3.40,-2.65) {};
\node[or  port,scale=0.62] (o1) at (5.30,-2.45) {};

\draw (-0.30,-2.05) -- (2.60,-2.05) |- (a1.in 1);
\draw (2.20,-2.65) -- (2.60,-2.65) |- (a1.in 2);

\node[font=\tiny,anchor=east] at (4.20,-2.13) {$\mathit{vc}_{\mathrm{in}}$ (1)};
\draw (4.25,-2.13) -- (4.75,-2.13) |- (o1.in 1);
\draw (a1.out) -- (4.60,-2.65) |- (o1.in 2);

\draw[->] (o1.out) -- (6.30,-2.45);
\node[font=\tiny,anchor=south] at (5.98,-2.40) {$\mathit{vc}_{\mathrm{out}}$ (1)};

\draw[->,dashed] (6.30,-2.45) -| (6.95,-1.30) -- (4.90,-1.30) -- (4.90,-0.72);
\node[font=\tiny,anchor=south west] at (5.15,-1.26) {header field, not a wire};

\end{scope}
\end{circuitikz}
\end{document}
```

**Locate the cycle no turn prohibition can reach.** Deadlock freedom is exactly acyclicity of the channel dependency graph $\mathcal D$, whose vertices are channels and whose edges $c_i\to c_j$ record that some packet may *hold* $c_i$ while *requesting* $c_j$. In a 2D mesh every cycle in $\mathcal D$ must turn four corners, so it must use all four turns of one of the two abstract turn cycles, and forbidding one turn from each is enough — that is the whole content of [[Turn Model Routing]], and [[Dimension-Order Routing Unit]] is the maximally restrictive member of that family. A torus defeats the argument outright: the wraparound link closes the cycle $c_0\to c_1\to\dots\to c_{k-1}\to c_0$ *inside a single dimension*, using no turn at all. No prohibition on turns can break a cycle that contains none, so a torus needs a second, orthogonal mechanism, and that mechanism is virtual channels.

**Layer the channel set instead of pruning it.** Replace each physical channel $c_i$ of a $k$-node ring by two virtual channels $\mathrm{VC}_0(c_i)$ and $\mathrm{VC}_1(c_i)$ with private queues of $B$ flits $\times\ w$ bits each ([[Virtual Channel Buffer]]). Designate one link — the *dateline*, conventionally the wraparound from node $k-1$ to node $0$ — and impose one rule: a packet rides $\mathrm{VC}_0$ until it traverses the dateline link and $\mathrm{VC}_1$ ever after. The physical wire is untouched; the only thing that changes is which of the two buffers the flit lands in at the far end.

> [!important] The proof is a lexicographic labelling, and the labelling is the design
> Measure position $\mathrm{pos}(c)\in\{0,\dots,k-1\}$ along the ring starting immediately *after* the dateline, so the dateline channel itself is $\mathrm{pos}=k-1$. Label $\ell(c)=(v(c),\ \mathrm{pos}(c))$ and order labels lexicographically. Three cases exhaust the edges of $\mathcal D$: a hop that stays on $\mathrm{VC}_0$ increases $\mathrm{pos}$ with $v$ fixed; a hop that stays on $\mathrm{VC}_1$ does the same; the dateline hop goes $(0,k-1)\to(1,0)$, which increases the *first* component and so increases the pair. There is no fourth case, because the rule is monotone — $\mathrm{VC}_1$ never returns to $\mathrm{VC}_0$. Every edge of $\mathcal D$ strictly increases $\ell$, a strict increase along every edge forbids a closed walk, so $\mathcal D$ is acyclic and the routing is deadlock-free. The topological order is $\ell$ itself; you never have to enumerate the graph.

**The allocator that enforces it is one gate.** Let $\mathit{vc}_{\mathrm{in}}$ (1 bit) be the VC index arriving in the header, $\mathit{pos}$ and $\mathit{dl}$ the router's own coordinate and the dateline coordinate ($W=\lceil\log_2 k\rceil$ bits each), and $\mathit{hop}$ (1 bit) the switch allocator's assertion that this flit takes the $+1$ hop on this ring now. Then

$$\mathit{vc}_{\mathrm{out}} = \mathit{vc}_{\mathrm{in}} \vee \big(\mathit{hop} \wedge [\,\mathit{pos}=\mathit{dl}\,]\big)$$

and by idempotence of OR ($a\vee a=a$) a second crossing is a no-op, which is what "monotone" means in gates. In a fabricated router $\mathit{pos}$ and $\mathit{dl}$ are both constants at a given node, so constant propagation collapses the $W$-bit comparator to a literal and the whole allocator degenerates to $\mathit{vc}_{\mathrm{in}}\vee\mathit{hop}$ at exactly one node of the ring and to $\mathit{vc}_{\mathrm{in}}$ at every other. The comparator is a synthesis-time convenience for a parameterised router, not silicon.

**Two virtual channels, not $k$, and the difference is where the order lives.** The original deadlock-free construction indexes the virtual channel by hop count — a packet on its $h$-th hop uses $\mathrm{VC}_h$ — which is acyclic for the same lexicographic reason and costs $V=k$ queues per port. The dateline observes that the well-founded order does not have to be the hop count; it only has to be *some* order that no dependency edge decreases. Under minimal routing a packet crosses the dateline at most once, so a single bit already distinguishes "before" from "after", and $V=2$ suffices. This is a general pattern worth naming: the number of virtual channels a deadlock construction needs is the length of the longest chain in the order it imposes, not the length of the longest path in the network.

**One pair of VCs covers an $n$-dimensional torus.** Extend the label to $\ell(c)=(\dim(c),\ v(c),\ \mathrm{pos}(c))$, lexicographic with $X<Y<Z$. Dimension-order routing already guarantees the first component is non-decreasing and never returns, so the same two virtual channels are reused unchanged in every dimension — $V=2$ total, not $2^n$, and not $2n$. What does scale with dimension is the header: one dateline bit per dimension, $n$ bits, because the crossing state must be tracked per ring. Each direction of a bidirectional torus is a distinct set of physical channels and therefore a distinct ring with its own dateline; the two do not interact, and one bit each is still enough.

**What it costs, and where the cost lands.** Per ring input port: $2Bw$ bits of buffering instead of $Bw$, one $1{:}2$ demux and one $2{:}1$ mux of $w$ bits on the port, and $n$ bits of header. The two layers are not equally loaded — every packet occupies $\mathrm{VC}_0$ for at least its first hop, while $\mathrm{VC}_1$ is entered only by the subset of packets whose minimal path spans the dateline, so $\mathrm{VC}_0$ is the busier queue and the buffer utilisation is skewed by dateline placement. On an FPGA the doubling is nearly free: a $B$-deep flit FIFO fits in LUT shift-register mode at roughly a depth-32 queue per LUT, so $V{=}2$ doubles a handful of LUTs rather than consuming a second 18 Kb BRAM, and the $2{:}1$ mux is one LUT per bit of $w$ ([[FPGAs]]). On an ASIC the same doubling is real register-file area and is the reason $V$ is chosen for head-of-line mitigation first and deadlock second. Neither technology charges for the OR gate; the honest cost of the dateline is the second buffer, and on an FPGA the honest cost of a *torus* is the wraparound wire, not this construction.

$$\boxed{\ \mathit{vc}_{\mathrm{out}} = \mathit{vc}_{\mathrm{in}} \vee \big(\mathit{hop}\wedge[\mathit{pos}=\mathit{dl}]\big),\qquad \ell(c)=(v,\mathrm{pos})\ \text{strictly increases on every edge of }\mathcal D\ \Rightarrow\ \mathcal D\ \text{acyclic}\ }$$

**Where the construction stops holding.**

- **Non-minimal routing.** One bit assumes at most one dateline crossing. Misrouting, fault rerouting or any non-minimal adaptive scheme lets a packet wrap more than once; $m$ possible crossings need $\lceil\log_2(m+1)\rceil$ header bits and $m+1$ virtual channels, and unbounded misrouting cannot be covered at all.
- **Adaptivity, which the rule silently taxes.** Forbidding $\mathrm{VC}_1\to\mathrm{VC}_0$ means a packet that has crossed can never use the $\mathrm{VC}_0$ queue even when it is the only one with credit. The standard repair is Duato's: hold the dateline pair as a restricted *escape* channel and let every additional VC route freely, deadlock freedom resting on the escape set alone.
- **Meshes.** No wraparound, no intra-dimension cycle, so dimension order is already acyclic and the second buffer buys nothing. Applying a dateline to a mesh is pure area.
- **Protocol-level cycles.** Acyclicity of $\mathcal D$ covers the routing function only. A request that cannot be consumed until its reply is injected closes a cycle through the endpoints, not through the channels; message classes need their own VC partition on top of the dateline pair, and sharing them re-introduces deadlock that no routing proof will catch.
- **Folding does not remove the obligation.** Folding a torus equalises the physical wire lengths but leaves the topology — and therefore the ring cycle — intact. The dateline is still required.
- **$k=2$.** The wraparound and the direct link coincide, the "ring" has no distinct cycle to cut, and the construction degenerates.

**The RTL is the OR gate and the select it drives.**

```spade
/// Dateline VC assignment for one ring dimension of a k-ary torus.
/// Combinational: rewrites the flit header's VC index as the flit is forwarded,
/// and emits the one-hot select that steers it into the downstream VC buffer.
///   bit 1 = VC1 selected (also the rewritten header bit), bit 0 = VC0 selected.
entity dateline_vc<#uint W>(
    vc_in: bool,        // VC index arriving in the header, 1 bit
    pos: uint<W>,       // this router's coordinate on the ring, W bits
    dl: uint<W>,        // coordinate whose outgoing +1 link is the wraparound
    hop: bool,          // this flit takes the +1 hop on this ring now
) -> uint<2> {
    let cross = hop && (pos == dl);
    let vc_out = vc_in || cross;   // monotone: VC1 never returns to VC0
    if vc_out { 0b10 } else { 0b01 }
}
```

`vc_in`, `pos`, `dl` and `hop` are the four labelled inputs of the gate row in the diagram, and `pos == dl` is its $W$-bit comparator. The returned `uint<2>` is the one-hot buffer select driving both the input demux and the $2{:}1$ output mux; its bit 1 is simultaneously the rewritten header bit, which is why the entity has one output and not two. Nothing is registered — the VC index is state carried by the flit, not by the router, so this is combinational logic sitting in the VC-allocation stage. Synthesis will not build the drawn comparator: with `pos` and `dl` tied to per-node constants it folds away entirely, leaving one OR gate at the dateline node and a wire everywhere else.

Verified by exhaustive simulation over the whole $W=4$ input space plus a random sweep and a monotonicity sweep (4547 vectors, 0 failures), including asymmetric pairs such as $\mathit{pos}=1,\ \mathit{dl}=8$ — `0001` against `1000`, which a bit-reversed comparator would wrongly call equal.

**Related notes.**

- [[Virtual Channel Buffer]] – depends-on: supplies the two private $B\times w$ queues the dateline rule steers between; without them the "virtual" channel is just a relabelling of one buffer and cuts nothing.
- [[Turn Model Routing]] – compares: the other family of deadlock constructions, which breaks cycles by forbidding turns and therefore cannot touch the torus wraparound cycle at all.
- [[Dimension-Order Routing Unit]] – supports: orders the dimensions so a single VC pair, rather than one pair per dimension, suffices on an $n$-D torus.
- [[Virtual-Channel Router]] – extends: the router this drops into; the dateline output is one input to its VC allocator, which still has to choose among free VCs within the layer.
- [[Wormhole Flow Control]] – depends-on: the reason deadlock is a live hazard here, since a wormhole packet holds channels across many routers at once.
- [[Choosing a Router Architecture]] – compares: where the $2Bw$ buffer cost sits against the other uses of $V$.

## References

No book source. Written from standard interconnection-network canon and from the long-form note.

- Long-form note `6.3) Network-On-Chip`, §*Routing and deadlock freedom* (the channel dependency graph theorem, the turn-model cycle count, the dateline paragraph and its $2\times$ buffer plus $2{:}1$ mux cost) and §*Quality of service and virtual channels* (the three independent jobs of a VC and the $V=2$ figure for deadlock avoidance on a torus). FPGA buffer-primitive costs from its §*FPGA mapping*.
- Dally & Seitz, "Deadlock-Free Message Routing in Multiprocessor Interconnection Networks", *IEEE Trans. Computers* C-36(5), 1987 — the acyclicity theorem, the hop-indexed virtual-channel construction, and the dateline collapse to $V=2$.
- Glass & Ni, "The Turn Model for Adaptive Routing", *ISCA*, 1992 — the two abstract cycles, for the contrast in the opening paragraph.
- Duato, "A New Theory of Deadlock-Free Adaptive Routing in Wormhole Networks", *IEEE TPDS*, 1993 — the escape-channel relaxation cited under *When it breaks*.
- Dally & Towles, *Principles and Practices of Interconnection Networks*, Morgan Kaufmann, 2004 — deadlock avoidance, virtual-channel flow control and router microarchitecture.
