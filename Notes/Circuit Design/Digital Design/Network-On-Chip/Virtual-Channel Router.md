---
title: "Virtual-Channel Router"
description: "The whole per-tile switch as a 4-stage pipeline (RC/VA/SA/ST) — buys segmented links and local arbitration instead of a die-spanning bus, at the cost of one router and ~H hops of latency per tile."
kind: circuit
source: "6.3) Network-On-Chip, §Why the bus stops scaling, §Router microarchitecture, §FPGA mapping"
status: seed
spade: simulated
tags: [digital, network-on-chip, router, crossbar, arbiter, pipeline, fpga]
aliases:
  - "Virtual Channel Router"
  - "VC Router"
  - "NoC Router"
  - "Router Microarchitecture"
  - "Router Pipeline"
---

# Virtual-Channel Router

The per-tile switch of a packet-switched interconnect: $p$ input ports each holding $V$ independently allocatable flit buffers, a $p\times p$ crossbar, and two allocators — distinguished from every simpler switch by allocating the *buffer* per flit and the *virtual channel* per packet, so that one blocked packet does not idle the physical link it sits on.

```tikz title="Virtual-channel router as a four-stage pipeline: input VC buffers and route computation, VC allocation, switch allocation gated by credits, crossbar and link traversal"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\footnotesize]
  % ---- pipeline stage bands
  \foreach \x in {3.15,5.75,8.05}{ \draw[dashed,gray] (\x,-2.9) -- (\x,5.0); }
  \node[anchor=south] at (1.5,5.05) {\textbf{1. RC}};
  \node[anchor=south] at (4.45,5.05) {\textbf{2. VA}};
  \node[anchor=south] at (6.9,5.05) {\textbf{3. SA}};
  \node[anchor=south] at (11.0,5.05) {\textbf{4. ST / LT}};

  % ---- input port 0
  \draw (0.1,1.2) rectangle (3.0,3.3);
  \node[anchor=west] at (0.25,3.05) {input port $0$};
  \foreach \i in {0,1,2}{ \draw (0.35,1.45+0.4*\i) rectangle (2.75,1.79+0.4*\i); }
  \node[anchor=west] at (0.45,1.62) {VC$_0$: $B\times w$};
  \node[anchor=west] at (0.45,2.02) {VC$_1$};
  \node[anchor=west] at (0.45,2.42) {VC$_{V-1}$};
  \draw[->] (-1.2,2.25) -- (0.1,2.25);
  \node[anchor=south] at (-0.55,2.30) {$w$};

  % ---- input port p-1
  \draw (0.1,-2.0) rectangle (3.0,0.1);
  \node[anchor=west] at (0.25,-0.15) {input port $p{-}1$};
  \foreach \i in {0,1,2}{ \draw (0.35,-1.75+0.4*\i) rectangle (2.75,-1.41+0.4*\i); }
  \draw[->] (-1.2,-0.95) -- (0.1,-0.95);
  \node[anchor=south] at (-0.55,-0.90) {$w$};
  \node at (1.55,0.6) {$\vdots$};

  % ---- RC
  \draw (0.35,3.95) rectangle (2.95,4.85);
  \node[align=center] at (1.65,4.40) {RC: XY route\\$2\lceil\log_2 k\rceil\!\to\!\lceil\log_2 p\rceil$};
  \draw[->] (1.65,3.3) -- (1.65,3.95);
  \node[anchor=west] at (1.72,3.62) {head flit};

  % ---- VA
  \draw (3.45,2.85) rectangle (5.55,4.65);
  \node[align=center] at (4.5,3.75) {VA\\$pV\!\times\!pV$\\once per packet};
  \draw[->] (2.95,4.40) -- (3.45,4.40);

  % ---- SA
  \draw (6.05,2.85) rectangle (7.85,4.65);
  \node[align=center] at (6.95,3.75) {SA\\$pV\!\to\!p$\\every cycle};
  \draw[->] (5.55,3.75) -- (6.05,3.75);

  % ---- crossbar
  \draw[line width=1pt] (8.35,-2.0) rectangle (10.65,3.3);
  \node[align=center] at (9.5,0.6) {$p\times p$ crossbar\\$p^2w$ crosspoints};
  \draw[->] (3.0,2.25) -- (8.35,2.25);
  \node[anchor=south] at (4.6,2.30) {$w$};
  \draw[->] (3.0,-0.95) -- (8.35,-0.95);
  \node[anchor=south] at (4.6,-0.90) {$w$};
  \draw[->] (7.85,3.85) -- (9.5,3.85) -- (9.5,3.3);
  \node[anchor=south] at (9.3,3.90) {sel: $p\lceil\log_2 p\rceil$};

  % ---- output
  \draw (11.15,1.55) rectangle (13.25,2.95);
  \node[align=center] at (12.2,2.25) {output reg\\$+$ VC mux};
  \draw[->] (10.65,2.25) -- (11.15,2.25);
  \draw[->] (13.25,2.25) -- (14.45,2.25);
  \node[anchor=south] at (13.85,2.30) {$w$};

  \draw (11.15,-1.65) rectangle (13.25,-0.25);
  \node[align=center] at (12.2,-0.95) {credit ctrs\\$pV\lceil\log_2(B{+}1)\rceil$};
  \draw[<-] (13.25,-0.95) -- (14.45,-0.95);
  \node[anchor=south] at (13.85,-0.90) {credits};
  \draw[->] (11.15,-0.95) -- (11.15,-2.6) -- (6.95,-2.6) -- (6.95,2.85);
  \node[anchor=south] at (9.2,-2.56) {credit $>0$?};

  \node[anchor=north,align=center] at (6.0,-3.2)
    {$t_r=4$ cycles per hop $\;\bullet\;$ lookahead routing removes RC, speculative SA overlaps VA $\Rightarrow t_r=2$};
\end{circuitikz}
\end{document}
```

**Justify the router before designing it: a shared bus fails in four independent ways, and only one of them is the famous one.** A bus is one channel with $N$ taps. Its **capacitance** is $C_{\text{bus}} = N C_{\text{in}} + c_w\ell$ with $\ell=\Theta(\sqrt A)$ for die area $A$, and every transfer pays all of it — energy per bit is $\Theta(N)$ for a message between neighbours that needed $\Theta(1)$. Its **arbitration** is a priority encode over an $N$-bit request vector, depth $\lceil\log_2 N\rceil$ even reassociated into a prefix tree ([[Combinational Logic]]), and the grant must return across the die inside one bus cycle, so the arbiter is a clock-period floor that rises with $N$. Its **bandwidth** is $w/T_{\text{bus}}$ no matter what $N$ is, hence $\Theta(1/N)$ per node. And past roughly 45 nm it will not **close timing** at all, because a cross-die combinational span exceeds a useful clock period — and a pipelined bus is already a degenerate one-hop network. Replacing the medium with segmented registered links plus a switch per tile fixes all four at once: each link spans one tile pitch so wire delay is a fixed fraction of a cycle independent of $N$, arbitration is local over $p=5$ ports instead of $N$, and channel count grows as $\Theta(N)$ so aggregate bandwidth grows with the chip. What you buy that with is this circuit, replicated $N$ times, and a latency of $\Theta(\bar H)$ hops instead of one cycle.

**Four numbers fix every width in the router, and all of them are $\lceil\log_2\rceil$ of a design parameter.** Radix $p$ (ports including the local PE port; $p=5$ on a mesh), virtual channels per port $V$, buffer depth $B$ flits per VC, and flit width $w$. From those: the datapath is $w$ bits everywhere, the head flit carries a destination of $2\lceil\log_2 k\rceil$ bits on a $k\times k$ mesh, the route computation emits $\lceil\log_2 p\rceil$ bits of output-port select, VC allocation emits $\lceil\log_2 V\rceil$ bits of output-VC identifier, the crossbar select bus is $p\lceil\log_2 p\rceil$ bits, and each credit counter is $\lceil\log_2(B{+}1)\rceil$ bits so that a full buffer is representable ([[Counters]]). The payload itself is never interpreted: a router computes the identity function on data, so the format questions of [[Number Formats]] and the error budget of [[Error Accuracy]] pass through it untouched. Its only error currency is cycles.

**Split the hop into four stages so that no single cycle contains both an allocation and a wire crossing a tile.** The canonical pipeline moves one flit per stage per cycle:

1. **RC** — route computation, head flit only. Two magnitude comparators of $\lceil\log_2 k\rceil$ bits feeding a 5-way priority mux ([[Dimension-Order Routing Unit]]); stateless, sub-LUT-level, never the critical path.
2. **VA** — virtual channel allocation. A bipartite matching of up to $pV$ requesting input VCs onto $pV$ output VCs, at most one each way, performed **once per packet**. The head flit's grant is inherited by every body flit behind it, which is what makes wormhole flow control coherent — the worm owns one output VC end to end.
3. **SA** — switch allocation. **Every cycle**, every flit that already holds an output VC *and* sees a non-zero credit competes for a crossbar output. The standard [[Separable Input-First Allocator]] factors the $pV\times p$ match into $p$ input arbiters of $V{:}1$ followed by $p$ output arbiters of $p{:}1$, delay $\Theta(\log V+\log p)$ with prefix trees; a [[Wavefront Allocator]] matches better and is slower.
4. **ST/LT** — switch traversal through the [[Crossbar Switch]], then link traversal to the neighbour.

The per-packet/per-flit asymmetry between VA and SA is the whole architectural idea. Allocating the buffer per flit is what decouples $B$ from packet length $L$ ([[Wormhole Flow Control]]); allocating the VC per packet is what keeps flits of one packet in order without any reassembly logic at the destination. A router that allocated both per packet is [[Virtual Cut-Through Flow Control]] and needs $B\ge L$; one that allocated both per flit would have to reorder.

**The allocators set the clock period; the buffers set the area; and they are not the same component.** For a representative $p=5$, $V=4$, $B=6$, $w=128$ router:

| Component | Expression | This router |
| --- | --- | --- |
| Input buffers | $pVBw$ bits | $15{,}360$ bits |
| Crossbar | $p^2w$ crosspoints | $3{,}200$ |
| SA arbiters | $p$ of $V{:}1$ $+$ $p$ of $p{:}1$ | $5\times4{:}1 + 5\times5{:}1$ |
| VA | $pV$ of $pV{:}1$ | $20\times20{:}1$ |
| Credit counters | $pV\lceil\log_2(B{+}1)\rceil$ flops | $60$ flops |

Buffers dominate area and leakage; the crossbar dominates the *scaling*, because $p^2w$ is quadratic in radix — doubling radix to halve the diameter quadruples the switch. The allocators are negligible in area and decisive in delay, and the reason is that an arbiter is a carry chain in disguise: a fixed-priority arbiter granting the lowest set bit of request vector $r$ is the two's-complement identity $g = r\wedge(-r) = r\wedge(\overline r + 1)$, an increment, hence a ripple. Reassociating it as a prefix-OR $h_i=\bigvee_{j<i}r_j$ with $g_i = r_i\wedge\overline{h_i}$ drops the depth from $n$ to $\lceil\log_2 n\rceil$ by associativity of OR alone ([[Fixed-Priority Arbiter]]). A [[Round-Robin Arbiter]] is two such trees plus a pointer register, and it runs every cycle in the SA stage, so it is where the router's clock period is actually decided.

**Buffer depth is not sized by packet length but by the credit round trip, and the pipeline depth is inside that loop.** With [[Credit-Based Flow Control]] the upstream router may have at most $B$ flits outstanding on a VC before it must wait for a credit, so the sustained link utilisation is $\eta=\min(1, B/t_{crt})$ where

$$t_{crt}=t_{\text{link}}^{\rightarrow}+t_{\text{router}}+t_{\text{credit}}+t_{\text{link}}^{\leftarrow}$$

$t_{\text{router}}$ *is* the stage count $t_r$ of this note. A 4-stage router with one-cycle links each way and one cycle of credit logic gives $t_{crt}=7$, so $B<7$ throttles every link to $B/7$ of its bandwidth with no contention anywhere on the chip. This couples the two design knobs that look independent: **shortening the pipeline shortens $t_{crt}$ and therefore also shrinks the buffer floor**, so a stage removed is paid back twice.

**Nothing ships at four stages, and the two standard collapses are orthogonal.** [[Lookahead Routing]] computes hop $i{+}1$'s output port during hop $i$ and carries it in the head flit, removing RC from the critical path entirely — legal because dimension-order routing depends only on the destination and the *next* node's coordinates, both known one hop early. [[Speculative Switch Allocation]] runs SA in parallel with VA on the assumption the VC grant will succeed, and discards the switch grant when it does not; the cost is a misspeculation rate that rises with load, exactly when you can least afford wasted crossbar slots. Together they take 4 stages to 2, and a buffer-bypass path for the empty-input case takes it to 1 at low load.

**On an FPGA the cost ordering inverts, because the crossbar is priced by LUT arity rather than by transistor count.** A $p{:}1$ mux of $w$ bits is $w$ instances of a $p{:}1$ mux, and a 6-input LUT natively implements a $4{:}1$ mux (4 data + 2 select), so a $5{:}1$ mux costs 2 LUTs plus a dedicated wide-mux resource ([[Lookup-Tables]]). For $p=5$, $w=64$ that is roughly $5\times64\times2\approx640$ LUTs of crossbar alone; rounding radix down to 4 by muxing the local port onto an existing direction halves it, and the saving comes entirely from LUT arity rather than from any graph theory. Buffers invert too: a per-VC FIFO of $B=6$ by $w=64$ is 384 bits against a BRAM's 18 Kb, so a BRAM per VC wastes 98 % of it — the right primitive is the shift-register LUT mode, a depth-32 FIFO per LUT ([[Virtual Channel Buffer]], [[Block Memory]]). Move to BRAM only around $V\ge 8$ with deep queues, and at that point share one BRAM across all VCs of a port with a pointer table. And because FPGA routing delay dominates logic delay, mesh nearest-neighbour links map well while torus wraparound links do not: fold the torus so every link is a uniform two tile pitches, or pipeline the long ones and remember that each added stage extends $t_{crt}$ and forces deeper buffers.

$$\boxed{\ T_0 = H\,t_r + (L-1),\qquad A_{\text{router}}\approx \underbrace{pVBw}_{\text{buffers}} + \underbrace{p^2w}_{\text{crossbar}},\qquad \eta=\min\!\left(1,\frac{B}{t_{crt}}\right)\ }$$

**When it breaks.**

- **$B < t_{crt}$.** The link runs at $B/t_{crt}$ of its bandwidth on an idle chip. This is the most common NoC sizing mistake: buffers are shrunk to recover area, and the throughput loss shows up in traffic simulation as "congestion" that no amount of routing cleverness removes.
- **$V=1$.** A single FIFO per input saturates at $2-\sqrt2\approx 0.586$ of capacity under uniform random destinations (Karol's input-queued bound) because the blocked head hides a ready flit. The gain from adding VCs is steep to $V\approx4$ and flat after, so $V>4$ is buying deadlock freedom or QoS classes, not throughput ([[Dateline Virtual Channel Allocation]], [[TDM Slot Table Scheduler]]).
- **High radix.** $p^2w$ is quadratic, so the switch is the term that stops the "flatten the topology to cut the diameter" argument. Past $p\approx8$ the crossbar dominates and a hierarchical or concentrated topology wins instead.
- **Speculation under load.** Speculative SA is a latency optimisation whose misprediction rate grows with offered load; at saturation it burns crossbar slots that the non-speculative version would have granted to someone else.
- **Small $N$.** Below roughly 16 masters an FPGA's AXI crossbar fabric is smaller and lower latency, because the FPGA already provides the global routing the NoC exists to avoid. The crossover moves earlier if the design spans multiple clock domains anyway, since the GALS link is then free ([[Choosing a Router Architecture]]).
- **The identity function.** Nothing here rounds, saturates or grows in width — a router that delivers a wrong *value* is broken, not inaccurate. Every trade-off above is priced in cycles and area only.

**RTL (Spade).**

A Spade `pipeline(N)` is the right form because the stage boundaries *are* the specification: the declared depth is checked at every call site, so the RC/VA/SA/ST split cannot silently drift.

```spade
fn xy_port(xc: uint<2>, yc: uint<2>, xd: uint<2>, yd: uint<2>) -> uint<3> {
    if xd > xc { 0 }
    else { if xd < xc { 1 }
    else { if yd > yc { 2 }
    else { if yd < yc { 3 } else { 4 } } } }
}

pipeline(4) vc_router<#uint W>(
    clk: clock,
    valid: bool,
    xc: uint<2>, yc: uint<2>,
    xd: uint<2>, yd: uint<2>,
    vc_free: bool,
    credit: bool,
    flit: uint<W>,
) -> (bool, uint<3>, uint<W>) {
    'rc
        let port = xy_port(xc, yc, xd, yd);
    reg;
        let va = valid && vc_free;
    reg;
        let sa = va && credit;
    reg;
        let go = sa;
    reg;
        (go, port, flit)
}
```

`port` is the crossbar `sel` wire of the diagram, 3 bits because $\lceil\log_2 5\rceil = 3$ with E/W/N/S/L $=0..4$; `flit` is the $w$-bit datapath arrow, generic in `W` and instantiated at 8; `vc_free` is VA's one-bit reply and `credit` is the `credit > 0?` line coming back from the counter bank. Each `reg;` is one stage boundary, so the entity's latency is exactly the $t_r=4$ that feeds $T_0=Ht_r+(L-1)$ and $t_{crt}$ above, and every combinational cone is confined to a single stage — which is the whole point of the split. The honest limitation: pipeline inputs enter at stage 0, so `vc_free` and `credit` travel *with* the flit rather than being sampled live in stages 2 and 3; a real allocator reads current allocator and counter state, which in Spade is an `entity` port outside the stage flow. Synthesis will also merge the four one-bit control regs into a shift register and replicate the `port` pipeline registers per fanout, neither of which the drawing shows.

Simulated against a behavioural XY-routing reference plus a bit-exact payload check four cycles downstream: **3014 vectors pass**, including the asymmetric pairs $(1,0)\!\to\!(3,2)$ with payload `0x01` against $(3,2)\!\to\!(1,0)$ with `0x80`, which is the vector that separates a correct router from one with its port encoding or its payload bus reversed. Swapping the E and W arms in `xy_port` fails 2243 of them and adding a fifth stage fails 3010, so both the routing function and the declared latency are actually under test. What simulation says nothing about: contention, since one flit is in flight at a time; and the allocators, which are modelled here as the single `vc_free`/`credit` grants their real implementations produce.

**Related Notes (with context):**

- [[Dimension-Order Routing Unit]] – depends-on: the RC stage in full — the two comparators and the priority mux that `xy_port` above is.
- [[Virtual Channel Buffer]] – depends-on: the $V\times B\times w$ storage per input port, and the primitive it maps to on FPGA versus ASIC.
- [[Separable Input-First Allocator]] – depends-on: the SA stage factored into $V{:}1$ then $p{:}1$ arbitration, and the delay that sets this router's clock period.
- [[Crossbar Switch]] – depends-on: the ST stage, and the $p^2w$ term that makes radix the number to watch.
- [[Credit-Based Flow Control]] – depends-on: supplies the `credit > 0?` gate and the $t_{crt}$ that turns pipeline depth into a buffer-depth requirement.
- [[Round-Robin Arbiter]] – supports: the fair arbiter inside SA, and where the prefix-tree reassociation of the priority encoder actually lands on the critical path.
- [[Wormhole Flow Control]] – depends-on: the allocation granularity — channel per packet, buffer per flit — that the VA/SA split implements.
- [[Lookahead Routing]] – extends: removes stage 1 by computing the next hop's port one hop early.
- [[Speculative Switch Allocation]] – extends: overlaps stages 2 and 3, trading a misspeculation rate for a cycle.
- [[Choosing a Router Architecture]] – compares: where this sits against the bufferless, the store-and-forward and the flat-crossbar alternatives.
- [[Store-and-Forward Flow Control]] – counter-example: allocates everything per packet, needs $B\ge L$, and serialises the packet at every hop for $T_0=H(t_r+L)$.
- [[FPGAs]] – counter-example: LUT arity, not transistor count, prices the crossbar, which reverses the usual radix-versus-buffer trade.

## References

- Local: [[6.3) Network-On-Chip]] §"Why the bus stops scaling" (the four bus failure modes and the segmented-link replacement), §"Router microarchitecture" (the four-stage pipeline, the area table for $p{=}5,V{=}4,B{=}6,w{=}128$, the arbiter-as-carry-chain identity, the two pipeline collapses), §"FPGA mapping" (LUT-arity crossbar cost, SRL versus BRAM buffers, torus link folding); §"Flow control" for $t_{crt}$ and $\eta$; §"Flow control" for the $2-\sqrt2$ bound.
- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — ch. 16–17 router microarchitecture and pipeline, ch. 18–19 allocators and arbiters, ch. 12–13 flow-control taxonomy.
- Peh & Dally, "A Delay Model and Speculative Architecture for Pipelined Routers", *HPCA*, 2001 — speculative switch allocation and lookahead routing.
- Karol, Hluchyj & Morgan, "Input Versus Output Queueing on a Space-Division Packet Switch", *IEEE Trans. Comm.* 35(12), 1987 — the $2-\sqrt2$ head-of-line saturation bound.
- Weste & Harris, *CMOS VLSI Design*, ch. 6 — wire RC, repeaters and the $\Theta(\sqrt A)$ bus-length argument.
- Mano & Ciletti, *Digital Design*, and Wakerly, *Digital Design: Principles and Practices* — priority encoders, multiplexer trees and the register-plus-mux structures the arbiters and crossbar reduce to.
