---
title: Lookahead Routing
description: "Computes hop i+1's output port during hop i and carries it in the head flit — removes route computation from the critical path for one extra port field per flit."
kind: circuit
source: "6.3) Network-On-Chip, §Router microarchitecture, §Routing and deadlock freedom, §Flow control"
status: seed
spade: simulated
tags: [digital, network-on-chip, routing, pipeline, latency, mesh]
aliases:
  - "Look-Ahead Routing"
  - "Lookahead Route Computation"
  - "LA-RC"
  - "Lookahead Routing Unit"
---

# Lookahead Routing

A route-computation unit relocated one hop upstream: each router evaluates the routing function for its *neighbour* and ships the answer in the head flit, so the router that will use the port never has to compute it — distinguished from every other pipeline optimisation by changing no allocation, no buffer and no routing function, only *when* the function is evaluated.

```tikz title="Lookahead routing: the head flit's port field feeds VA directly while the LA-RC unit computes the next hop's port from the neighbour's hard-wired address"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\footnotesize]

  % ================= incoming head flit =================
  \draw (-5.2,3.0) rectangle (-3.0,3.7);
  \node at (-4.1,3.35) {dest $d$: $2\lceil\log_2 k\rceil$};
  \draw[line width=1pt] (-5.2,2.3) rectangle (-3.0,3.0);
  \node at (-4.1,2.65) {port $P_i$: $\lceil\log_2 p\rceil$};
  \draw (-5.2,1.6) rectangle (-3.0,2.3);
  \node at (-4.1,1.95) {payload};
  \node[anchor=south] at (-4.1,3.75) {head flit in};

  % ================= router i =================
  \draw[line width=1pt] (0.0,1.15) rectangle (7.4,6.4);
  \node[anchor=west] at (0.15,6.1) {\textbf{router $i$} at $(x_c,y_c)$};

  \draw (1.6,3.9) rectangle (5.0,5.0);
  \node[align=center] at (3.3,4.45)
    {LA-RC\\$P_{i+1}=R\big(\mathrm{nbr}(n_i,P_i),\,d\big)$};

  \draw (0.15,4.4) rectangle (1.5,5.0);
  \node[align=center] at (0.825,4.7) {$(x_c,y_c)$\\const};
  \draw[->] (1.5,4.7) -- (1.6,4.7);

  \draw (1.4,2.35) rectangle (3.0,3.15);
  \node[align=center] at (2.2,2.75) {VA\\$pV\!\times\!pV$};
  \draw (3.6,2.35) rectangle (5.2,3.15);
  \node[align=center] at (4.4,2.75) {SA\\$pV\!\to\!p$};
  \draw (5.6,1.45) rectangle (7.0,3.15);
  \node[align=center] at (6.3,2.3) {XB\\$p\!\times\!p$};

  % dest -> LA-RC
  \draw[->] (-3.0,3.35) -- (0.7,3.35) -- (0.7,4.2) -- (1.6,4.2);
  % port -> VA directly: no RC stage in the way
  \draw[->] (-3.0,2.65) -- (1.4,2.65);
  \node[anchor=south] at (-1.5,2.70) {no RC on this path};
  % port also picks the neighbour, routed over the top
  \draw[->] (-5.2,2.65) -- (-5.9,2.65) -- (-5.9,5.55) -- (3.3,5.55) -- (3.3,5.0);
  \node[anchor=south] at (-2.6,5.58) {$P_i$ selects which neighbour};
  \node[circ] at (-5.2,2.65) {};
  % payload -> crossbar
  \draw[->] (-3.0,1.95) -- (5.6,1.95);
  % allocator chain
  \draw[->] (3.0,2.75) -- (3.6,2.75);
  \draw[->] (5.2,2.75) -- (5.6,2.75);

  % ================= outgoing head flit =================
  \draw[line width=1pt] (8.4,4.1) rectangle (10.8,4.8);
  \node at (9.6,4.45) {port $P_{i+1}$};
  \draw (8.4,3.4) rectangle (10.8,4.1);
  \node at (9.6,3.75) {dest $d$};
  \draw (8.4,2.7) rectangle (10.8,3.4);
  \node at (9.6,3.05) {payload};
  \node[anchor=south] at (9.6,4.85) {head flit out};

  \draw[->] (5.0,4.45) -- (8.4,4.45);
  \draw[->] (7.0,2.75) -- (7.8,2.75) -- (7.8,3.75) -- (8.4,3.75);
  \draw[->] (7.0,2.15) -- (7.5,2.15) -- (7.5,3.05) -- (8.4,3.05);

  % ================= router i+1 =================
  \draw[dashed] (11.6,2.7) rectangle (13.9,4.8);
  \node[align=center] at (12.75,3.75)
    {\textbf{router $i{+}1$}\\reads $P_{i+1}$;\\VA in cycle $0$};
  \draw[->] (10.8,3.75) -- (11.6,3.75);

  % ================= pipeline timeline =================
  \node[anchor=east] at (-1.2,0.25) {canonical $t_r=4$:};
  \foreach \i/\s in {0/RC,1/VA,2/SA,3/ST}{
    \draw (-1.0+1.7*\i,-0.1) rectangle (0.6+1.7*\i,0.6);
    \node at (-0.2+1.7*\i,0.25) {\s};
  }
  \node[anchor=east] at (-1.2,-1.05) {lookahead $t_r=3$:};
  \foreach \i/\s in {0/VA,1/SA,2/ST}{
    \draw (-1.0+1.7*\i,-1.4) rectangle (0.6+1.7*\i,-0.7);
    \node at (-0.2+1.7*\i,-1.05) {\s};
  }
  \draw[dashed] (-1.0,-2.3) rectangle (0.6,-1.6);
  \node at (-0.2,-1.95) {LA-RC};
  \node[anchor=west] at (0.8,-1.95)
    {computed for hop $i{+}1$, in parallel with VA, off the critical path};
  \draw[->] (5.75,0.25) -- (6.6,0.25) -- (6.6,-1.05) -- (5.75,-1.05);
  \node[anchor=west] at (6.7,-0.4) {one cycle per hop, and $t_{crt}$ shrinks by one};

\end{circuitikz}
\end{document}
```

**Locate the serial dependence, because it is not where the gate delay is.** In the canonical four-stage [[Virtual-Channel Router]] the head flit arrives, RC turns its $2\lceil\log_2 k\rceil$-bit destination into a $\lceil\log_2 p\rceil$-bit output port, and only then can VA request an output VC on that port — VA's request vector is indexed *by* the port RC produces. RC itself is trivial, two magnitude comparators feeding a five-way priority mux ([[Dimension-Order Routing Unit]], [[Comparators]]), and on a $k\le16$ mesh it is one LUT level. It costs a whole pipeline stage anyway, because the dependence is a data dependence, not a delay problem: you cannot start allocating a resource before you know which resource you want. Shaving gates off RC therefore buys nothing at all, and that is the observation the whole optimisation grows from.

**Read the arguments of the routing function and notice that none of them is private to the routing node.** Deterministic routing is a map $R(n,d)\mapsto P$ from current node $n$ and destination $d$ to an output port. At node $n_i$, holding a flit that is about to leave on port $P_i$, both arguments of the *next* evaluation are already in hand: $d$ is a field of the flit and travels with it unmodified, and the next node is

$$n_{i+1}=\mathrm{nbr}(n_i,P_i)=\big(x_c+[P_i{=}E]-[P_i{=}W],\ \ y_c+[P_i{=}N]-[P_i{=}S]\big)$$

where $(x_c,y_c)$ is the router's own address — a synthesis constant, since each router instance is placed at a known mesh coordinate. So $\mathrm{nbr}$ is not an adder: it is a $5{:}1$ mux over five constant $\lceil\log_2 k\rceil$-bit pairs, selected by $P_i$, and constant folding collapses it to wires. Hence

$$P_{i+1}=R\big(\mathrm{nbr}(n_i,P_i),\,d\big)$$

is computable at hop $i$, using only hop $i$'s inputs.

> [!important] The eligibility criterion is a property of the routing function, not of the router
> Lookahead is exact precisely when every argument of $R$ is known one hop early. For dimension-order routing the arguments are $(n,d)$; for a [[Turn Model Routing]] function they are $(n,d,\text{inbound direction})$ — and the inbound direction at $n_{i+1}$ is exactly $P_i$, the port the flit is leaving on, which the computing router already holds. Both are therefore lookahead-able verbatim. Nothing about the *function* changes, so the channel dependency graph is bit-for-bit the same graph and the acyclicity argument that proved the routing deadlock-free carries over untouched. This is why lookahead is free of risk in a way that speculation is not: it re-times an evaluation, it does not gamble on one.

**Close the recurrence by moving the base case off the network.** $P_{i+1}=R(\mathrm{nbr}(n_i,P_i),d)$ is a first-order recurrence in the port field, and induction needs a $P_0$. That one is computed by the network interface at injection, $P_0=R(n_{\text{src}},d)$, where it sits in no router pipeline and competes with no allocator. From there every $P_{i+1}$ is produced one hop before it is consumed, so no router in the network ever evaluates its own route. The RC hardware is not deleted — it is instantiated the same number of times, once per router plus once per NIC — it is only *rescheduled*, which is the entire content of the optimisation and the reason its area cost is approximately zero.

**Price the cycle you bought, and notice you are paid twice for it.** With RC gone the hop is $t_r=3$, and zero-load latency $T_0=H\,t_r+(L-1)$ falls by exactly $H$ cycles — the saving multiplies by hop count, so it grows with the diameter of the network, which is where latency was hurting in the first place. The second payment is subtler: $t_r$ appears inside the credit round trip

$$t_{crt}=t_{\text{link}}^{\rightarrow}+t_{\text{router}}+t_{\text{credit}}+t_{\text{link}}^{\leftarrow}$$

and [[Credit-Based Flow Control]] caps sustained link utilisation at $\eta=\min(1,B/t_{crt})$. A stage removed removes one cycle from $t_{crt}$ — $7\to6$ for the reference router with one-cycle links each way and one cycle of credit logic — so the buffer depth needed for $\eta=1$ drops by one flit *per virtual channel*. For $p=5$, $V=4$, $w=128$ that is $pVw=2560$ bits of [[Virtual Channel Buffer]] storage removed per router, against a total buffer budget of $pVBw=15{,}360$ bits: a sixth of the dominant area term, recovered by a scheduling change.

> [!warning] The long-form note states $t_{crt}=5$ for a three-stage router with one-cycle links and one cycle of credit logic; its own formula gives $1+3+1+1=6$. The relative claim used here — one stage removed is one cycle of $t_{crt}$ — is what the formula supports, and is the only form worth relying on.

**Account for the cost honestly: it is header space, not wires.** The head flit gains a $\lceil\log_2 p\rceil$-bit port field, three bits on a $p=5$ mesh. That is not a widening of the link — the channel is $w$ bits regardless, and body flits carry nothing new — so the field is charged against the head flit's control budget, alongside the destination and the VC identifier. It is free until the head flit is full, at which point it is very expensive; see below. The logic added is the $5{:}1$ constant mux in front of the comparators, which folds away, plus one RC instance in each network interface.

**Adaptive routing is where the criterion fails, and it fails for a concrete reason.** An adaptive $R$ returns a *set* of productive outputs and a selection function picks among them by free-VC count or downstream credit — state belonging to node $n_{i+1}$, sampled at node $n_i$, one hop and one cycle before it is used. Precomputing the choice means choosing on stale congestion data, which is worse than not being adaptive at all. The standard split repairs it: the productive *set* depends only on $(n,d)$ and is computed ahead exactly as here; only the selection is deferred to arrival, where it degenerates to a narrow priority mux over an at-most-$p$-bit mask instead of two magnitude comparators plus a mux. Most of the stage is still recovered, and the part that is not is precisely the part that had to read live state.

**On FPGA the win is larger than the LUT count suggests.** Nothing changes in area: the same comparators, the same mux, both sub-LUT-level for $k\le16$. What changes is that the RC$\to$VA path crossed a LUT level *plus* the routing delay between two logic clusters, and on an FPGA inter-cluster routing dominates logic delay ([[FPGAs]]), so a dependence that costs one LUT level in an ASIC estimate costs a substantial fraction of a clock period in the fabric. The complementary point is the one that decides whether the scheme is affordable at all: flit width $w$ prices both the SRL-based input buffers and the $p^2w$ crossbar, so a scheme that widened the *link* by three bits would pay for it $p^2$ times over — lookahead widens only the head flit's field allocation, and $w$ is untouched.

$$\boxed{\ P_{i+1}=R\big(\mathrm{nbr}(n_i,P_i),\,d\big),\quad P_0=R(n_{\text{src}},d)\ \text{at the NIC}\ \Longrightarrow\ t_r\!\to\!t_r-1,\ \ t_{crt}\!\to\!t_{crt}-1\ }$$

**When it breaks.**

- **The head flit is already full.** Three bits that do not fit push the packet from $L$ to $L+1$ flits, costing one cycle of serialisation in $T_0=Ht_r+(L-1)$ and $1/L$ of the link's payload bandwidth on every hop. For a short packet — $L=2$, a cache-coherence request — that trade is a loss, and the fix is to overwrite the *consumed* port field in place rather than adding one, since $P_i$ is dead the moment the flit leaves.
- **Adaptive or congestion-aware selection.** The precomputed choice is made on state that is one hop stale, as above. Precompute the productive set only.
- **Deflection or fault tolerance.** The scheme assumes the flit actually departs on $P_i$. A bufferless or deflection network, or a link that fails between computation and use, invalidates the carried port, and the receiving router must be able to fall back to a local RC — which means the RC unit cannot actually be deleted from the router, only removed from its pipeline.
- **Datelines and VC classes.** On a torus the [[Dateline Virtual Channel Allocation]] class is part of the routing decision, not just the port. Carry the class in the lookahead field too, or the arriving router re-acquires exactly the dependence the optimisation removed.
- **Diminishing returns at low $t_r$.** The saving is $H$ cycles out of $Ht_r$, so it is a $1/t_r$ fraction: large at $t_r=4$, and once [[Speculative Switch Allocation]] and buffer bypass have taken the router to $t_r=1$ there is no stage left to remove and the remaining cycle is buffer write plus crossbar plus link.
- **Short paths.** At $H=1$ — a concentrated topology, or PE-to-local traffic — the only route computation that ever runs is the NIC's, and the port field is pure overhead.

**RTL (Spade).**

```spade
fn xy_port<#uint C>(xc: uint<C>, yc: uint<C>, xd: uint<C>, yd: uint<C>) -> uint<3> {
    if xd > xc { 0 }
    else { if xd < xc { 1 }
    else { if yd > yc { 2 }
    else { if yd < yc { 3 } else { 4 } } } }
}

fn neighbour<#uint C>(xc: uint<C>, yc: uint<C>, p: uint<3>) -> (uint<C>, uint<C>) {
    match p {
        0 => (xc +. 1, yc),
        1 => (xc -. 1, yc),
        2 => (xc, yc +. 1),
        3 => (xc, yc -. 1),
        _ => (xc, yc),
    }
}

entity la_rc<#uint C>(
    clk: clock,
    xc: uint<C>, yc: uint<C>,     // this router's address: a synthesis constant
    xd: uint<C>, yd: uint<C>,     // destination, from the head flit
    port_in: uint<3>,             // this hop's port, already in the head flit
) -> uint<3> {
    let (xn, yn) = neighbour(xc, yc, port_in);
    reg(clk) port_out = xy_port(xn, yn, xd, yd);
    port_out
}
```

`port_in` is the thick `port $P_i$` field of the diagram, `port_out` is the field written into the departing head flit, and the single `reg(clk)` is the output register the flit leaves through — so the LA-RC cone has a whole cycle to itself and cannot be the critical path, which is the claim the drawing makes with a dashed box. Coordinates are $C=\lceil\log_2 k\rceil$ bits and stay $C$ bits: `+.` and `-.` are the truncating variants, since plain `+` would widen to $C+1$ and the neighbour of a mesh coordinate is a mesh coordinate. The wrap they imply is unreachable on a mesh — dimension-order never routes off an edge — and is the *correct* neighbour on a torus, so one entity serves both. Synthesis will differ from the drawing in one way: with $x_c,y_c$ tied to constants the `match` folds into five hard-wired coordinate pairs, so the "LA-RC" block reduces to the same two comparators and priority mux the ordinary RC unit is, fed different wires.

Simulated against a behavioural reference that evaluates XY routing at the neighbour: **5054 vectors pass** — the entire $4^4\times 8=2048$-point input space of a $4\times4$ mesh, a 3000-vector random sweep, and six named vectors including the asymmetric pair $(1,0)\!\to\!(3,2)$ leaving east against its mirror $(3,2)\!\to\!(1,0)$ leaving west, which is what separates a correct unit from one with the port encoding reversed. Two mutants confirm the test bites: swapping the $E$ and $W$ arms of `neighbour` fails 921 vectors, and replacing `neighbour(...)` with `(xc, yc)` — that is, degenerating lookahead back into ordinary route computation — fails 984. The vector that matters most is `eject-lookahead`, node $(2,2)$ heading east to destination $(3,2)$: the unit must emit $L$, because the *next* router is the destination and must be told to eject without computing anything.

**Related Notes (with context):**

- [[Virtual-Channel Router]] – extends: removes stage 1 of that pipeline, taking $t_r$ from 4 to 3 and $t_{crt}$ with it.
- [[Dimension-Order Routing Unit]] – depends-on: the routing function being evaluated, unchanged, only fed the neighbour's coordinates instead of its own.
- [[Turn Model Routing]] – extends: also lookahead-able, because its third argument, the inbound direction, is the port the upstream router just chose.
- [[Speculative Switch Allocation]] – supports: the orthogonal collapse; together they take four stages to two.
- [[Credit-Based Flow Control]] – supports: supplies $t_{crt}$, which is where the second payment for the removed stage arrives.
- [[Virtual Channel Buffer]] – supports: the flit of depth per VC that the shorter credit loop no longer needs.
- [[Wormhole Flow Control]] – depends-on: only the head flit carries a route, and body flits inherit its channel, which is why one extra header field suffices for the whole packet.
- [[Dateline Virtual Channel Allocation]] – counter-example: the VC class is part of the decision on a torus, so the lookahead field must carry it or the dependence returns.
- [[Choosing a Router Architecture]] – compares: where a 3-stage lookahead router sits against the canonical and the fully collapsed alternatives.

## References

- Local: [[6.3) Network-On-Chip]] §"Router microarchitecture" (the four-stage RC/VA/SA/ST pipeline, the $p{=}5,V{=}4,B{=}6,w{=}128$ area table, and the statement that lookahead routing removes RC from the critical path); §"Routing and deadlock freedom" (the routing function $R$, the XY case analysis, the channel dependency graph and its acyclicity criterion, the turn model); §"Flow control" ($t_{crt}$, $\eta=\min(1,B/t_{crt})$, and the buffer floor); §"FPGA mapping" (LUT-arity crossbar cost and SRL-based buffers).
- Peh & Dally, "A Delay Model and Speculative Architecture for Pipelined Routers", *HPCA*, 2001 — lookahead routing and speculative switch allocation as the two standard pipeline collapses.
- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — ch. 16–17 router microarchitecture and pipelining, ch. 8 routing functions, ch. 13 credit-based flow control.
- Glass & Ni, "The Turn Model for Adaptive Routing", *ISCA*, 1992 — the routing functions whose third argument is the inbound direction.
- Mano & Ciletti, *Digital Design*, and Wakerly, *Digital Design: Principles and Practices* — magnitude comparators, priority encoders and the constant-select multiplexer the neighbour computation folds into.
