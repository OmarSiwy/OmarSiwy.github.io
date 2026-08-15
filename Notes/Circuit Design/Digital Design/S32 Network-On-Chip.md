---
title: "Network-On-Chip"
description: "Map of the 22 Network-On-Chip notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, network-on-chip, hub]
aliases:
  - "Network-On-Chip Link"
  - "Network-On-Chip"
  - "6.3) Network-On-Chip"
  - "Channel Dependency Graph"
---

# Network-On-Chip

**The specification.** Input: a packet of $L$ flits of $w$ bits, the head flit carrying a destination $(x_d,y_d)$ of $2\lceil\log_2 k\rceil$ bits. Output: the same $L$ flits, bit-exact and in order, at that destination's local port. Accuracy: **exact, $0$ ulp** — an interconnect computes the identity function on its payload, so the payload's format and its whole error budget ([[Number Formats]], [[Error Accuracy]]) pass through untouched. What is optimised is **throughput**: the sustainable injection rate $\lambda$ in flits/cycle/node, subject to a per-tile area budget and a zero-load latency target $T_0 = H t_r + (L-1)$.

The only error an interconnect can contribute is *cycles*, and three hard constraints fall out of that. Delivery must be **lossless** — no drop, so backpressure is mandatory and every buffer needs an owner. It must be **in order** — so a packet may not be split across divergent paths. And it must be **deadlock-free** — a livelock-free routing function is not enough, because a cyclic buffer dependency stalls forever and raises no error signal. Every note below is one answer to one of those three, and **none of them needs to restate this paragraph**.

```tikz title="4x4 mesh of per-tile routers with local PE ports, and one XY route across it"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  \foreach \x in {0,1,2,3}{ \foreach \y in {0,1,2,3}{
     \draw[fill=white] (1.9*\x-0.25,1.9*\y-0.25) rectangle (1.9*\x+0.25,1.9*\y+0.25);}}
  \foreach \x in {0,1,2}{ \foreach \y in {0,1,2,3}{
     \draw[<->] (1.9*\x+0.25,1.9*\y) -- (1.9*\x+1.65,1.9*\y);}}
  \foreach \x in {0,1,2,3}{ \foreach \y in {0,1,2}{
     \draw[<->] (1.9*\x,1.9*\y+0.25) -- (1.9*\x,1.9*\y+1.65);}}
  \foreach \x in {0,1,2,3}{ \foreach \y in {0,1,2,3}{
     \draw[<->] (1.9*\x-0.25,1.9*\y-0.25) -- (1.9*\x-0.62,1.9*\y-0.62);
     \draw (1.9*\x-1.12,1.9*\y-0.92) rectangle (1.9*\x-0.62,1.9*\y-0.62);}}
  \draw[line width=1.6pt] (1.9,0) -- (5.7,0) -- (5.7,3.8);
  \node[anchor=north] at (1.9,-1.15) {src $(1,0)$};
  \node[anchor=west]  at (6.15,3.8) {dst $(3,2)$};
  \node[anchor=south] at (2.85,5.95) {one channel: $w$ data $+\ \lceil\log_2(B{+}1)\rceil$ credit};
  \draw[thin] (2.85,5.95) -- (2.85,5.75);
  \node[anchor=west] at (-1.2,-2.0) {$\square$ router, $p=5$ ports \quad $\square$ PE on the local port};
  \node[anchor=west] at (-1.2,-2.5) {bold: the XY route $(1,0)\to(3,2)$, $H=5$ router traversals};
\end{circuitikz}
\end{document}
```

Why a network and not a bus: a shared bus has a bisection of exactly one channel, so per-node bandwidth is $\Theta(1/N)$ while its energy per bit is $\Theta(N)$, and its global arbiter's $\lceil\log_2 N\rceil$-deep decision plus a cross-die grant return sets the clock period. Segmented links plus per-tile switches make every wire one tile pitch, every arbitration local over $p=5$ ports, and the channel count $\Theta(N)$. The price is a router per tile and a latency of $\Theta(\bar H)$ hops.

- **[[Choosing a Router Architecture]]** – the trade-off table across all 22, with the source's own buffer, crosspoint, delay and utilisation numbers. Read it first if you are sizing a router, last if you are learning them. It is deliberately the only place those numbers live.

### The whole router, once

- [[Virtual-Channel Router]] – the four-stage RC / VA / SA / ST pipeline every other note in this folder is a stage, a buffer or a wire of. Read it before anything below so the pieces have somewhere to attach.

### Routing: making the dependency graph acyclic

Deadlock freedom is exactly acyclicity of the channel dependency graph, and each of these is a different construction for achieving it, verified by exhibiting the topological order.

- [[Dimension-Order Routing Unit]] – two comparators and a priority mux; stateless, off the critical path, and the cheapest acyclicity argument there is.
- [[Turn Model Routing]] – why XY forbids four turns when two suffice, and what the surplus two were buying you had you kept them.
- [[Dateline Virtual Channel Allocation]] – the wraparound of a torus closes a cycle inside one dimension with no turn at all; this is the fix, and the reason a torus costs $2\times$ the buffers.

### The datapath the routing decision drives

- [[Virtual Channel Buffer]] – $V$ independent queues behind one physical input, which is what turns one blocked head into $V-1$ still-eligible ones.
- [[Crossbar Switch]] – $p$ independent $p{:}1$ muxes of $w$ bits; the $p^2w$ crosspoint term is why radix, not diameter, is the number to watch.

### Deciding who moves this cycle

Arbitration is a priority-encoder problem, and it sits on the critical path of every cycle, so this is where the router's clock period is actually decided.

- [[Fixed-Priority Arbiter]] – the prefix-OR smear, $g = r \wedge (-r)$, and the depth-$\lceil\log_2 n\rceil$ reassociation it shares with [[Adders]].
- [[Round-Robin Arbiter]] – two of those plus a pointer; read it for what fairness costs in gate delay, not in area.
- [[Separable Input-First Allocator]] – the standard switch allocator: $p$ arbiters of $V{:}1$ feeding $p$ of $p{:}1$, matching worse than optimally but fast.
- [[Wavefront Allocator]] – the better matching, and the diagonal propagation that makes it slower; the counter-example that shows match quality is not free.

### Flow control: which resource is allocated per packet, which per flit

- [[Store-and-Forward Flow Control]] – serialises the packet at every hop, $T_0 = H(t_r+L)$; the baseline the other two beat.
- [[Virtual Cut-Through Flow Control]] – forward the head once the downstream can hold the whole packet; serialisation paid once, buffers still $\ge L$.
- [[Wormhole Flow Control]] – buffers per flit instead of per packet, which decouples $B$ from $L$ entirely and introduces the stalled worm that spans several routers.
- [[Credit-Based Flow Control]] – the counter pair that makes any of the above lossless, and the credit round-trip $t_{crt}$ that sets the real buffer floor $B \ge t_{crt}$, not $L$.

### Taking stages out of the pipeline

- [[Lookahead Routing]] – compute hop $i{+}1$'s port during hop $i$ and RC leaves the critical path entirely.
- [[Speculative Switch Allocation]] – run SA beside VA and discard the grant when VA fails; a stage bought for a misspeculation rate.

### Crossing clock domains

The interconnect spans exactly the region over which one clock is hardest to distribute, so a link is often also a domain crossing — and every crossing lands in $t_{crt}$, inflating the buffer depth the flow-control notes ask for.

- [[Mesochronous Link FIFO]] – same frequency, fixed unknown phase: a 2–4 flit phase-tolerant FIFO and a one-time training sequence, no metastability in principle.
- [[Dual-Clock Asynchronous FIFO]] – unrelated frequencies: Gray-coded pointers ([[Counters]]) through two-flop synchronizers, and why the pointers are Gray while the data is not.
- [[Bundled-Data Handshake Link]] – drop the receiver clock altogether; the C-element join of [[Asynchronous Sequential Logic]] and the matched-delay timing assumption it rests on.

### Service guarantees on top of virtual channels

- [[TDM Slot Table Scheduler]] – an offline slot table gives a *hard* bandwidth and latency bound instead of a statistical one, at the cost of every idle reserved slot.
- [[Priority Aging Arbiter]] – strict class priority starves; a saturating age counter bounds the starvation for $\lceil\log_2 P_{\max}\rceil$ bits per lane.
- [[Deficit Round Robin Scheduler]] – weighted sharing among best-effort classes at $O(1)$ work per flit, accurate to within one flit.

### Where this sits

The payload's format and error budget are fixed upstream by [[Number Formats]] and [[Error Accuracy]] and the network changes neither. Internally the topic is built from [[Combinational Logic]] (priority encoders, muxes, decoders), the prefix reassociation of [[Adders]], the magnitude compare of [[Comparators]], the up/down and Gray counters of [[Counters]], the setup/hold and synchronizer reasoning of [[Flip-Flops and Latches]], and the handshake sequencing of [[Asynchronous Sequential Logic]]. Downstream it is the fabric that multi-tile [[Arithmetic for Deep Learning]] and multi-channel [[LTI Filters]] designs are wired with, and on [[FPGAs]] it competes with a crossbar-style bus fabric that only stops fitting once $p^2w$ does.

## References

No book source — written from standard interconnection-network and digital-design canon:

- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — topology metrics and the bisection bound (ch. 3, 5), flow control (ch. 12–13), router microarchitecture (ch. 16–17), allocators and arbiters (ch. 18–19).
- Dally & Seitz, "Deadlock-Free Message Routing in Multiprocessor Interconnection Networks", *IEEE Trans. Computers* C-36(5), 1987 — the channel dependency graph theorem and the dateline construction.
- Glass & Ni, "The Turn Model for Adaptive Routing", *ISCA*, 1992.
- Peh & Dally, "A Delay Model and Speculative Architecture for Pipelined Routers", *HPCA*, 2001.
- Karol, Hluchyj & Morgan, "Input Versus Output Queueing on a Space-Division Packet Switch", *IEEE Trans. Comm.* 35(12), 1987 — the $2-\sqrt2$ head-of-line saturation bound.
- Goossens, Dielissen & Rădulescu, "Æthereal Network on Chip", *IEEE Design & Test* 22(5), 2005 — TDM slot tables versus best-effort.
- Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design", SNUG 2002.
- Weste & Harris, *CMOS VLSI Design*, ch. 6 (wire RC and repeaters), ch. 10 (synchronizers, MTBF, metastability).
