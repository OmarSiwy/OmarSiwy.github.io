---
title: Virtual Channel Buffer
description: "V independent flit queues sharing one physical input port — gives the switch arbiter V independent heads, lifting the 2-sqrt(2) head-of-line saturation bound toward 1 at a linear V*B*w buffer cost."
kind: circuit
source: "6.3) Network-On-Chip §Flow control, §Quality of service and virtual channels, §FPGA mapping — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, buffer, fifo, flow-control, arbitration, fpga]
aliases:
  - Virtual Channel
  - Virtual Channels
  - Virtual Channel Buffers
  - VC Buffer
  - VC Buffers
---

# Virtual Channel Buffer

$V$ flit queues sharing one physical link and one crossbar input port, distinguished from a plain input FIFO by presenting the switch arbiter $V$ independently schedulable heads instead of one.

```tikz title="Virtual channel buffer: ingress vcid demux, V flit queues of depth B, egress V:1 head mux driven by the switch allocator's grant, per-VC control state and credit counters"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- incoming physical link
  \draw[->] (-3.6,2.0) -- (-1.5,2.0);
  \node[anchor=south] at (-2.55,2.05) {flit $+$ vcid};
  \node[anchor=north] at (-2.55,1.95) {$w+\lceil\log_2 V\rceil$};

  % ---- ingress demux
  \draw (-1.5,0.1) -- (-1.0,0.45) -- (-1.0,3.45) -- (-1.5,3.8) -- cycle;
  \node[rotate=90] at (-1.25,1.95) {demux};

  % ---- the four virtual channels
  \foreach \y/\name in {3.3/{VC$_0$}, 2.4/{VC$_1$}, 1.5/{VC$_2$}, 0.6/{VC$_{V-1}$}} {
    \draw (0.7,\y-0.32) rectangle (3.9,\y+0.32);
    \foreach \d in {1.5,2.3,3.1} { \draw (\d,\y-0.32) -- (\d,\y+0.32); }
    \draw[->] (-1.0,\y) -- (0.7,\y);
    \node[anchor=south] at (-0.15,\y+0.02) {\name};
    \draw[->] (3.9,\y) -- (5.0,\y);
  }
  \node[anchor=north] at (2.3,0.22) {$B$ flits $\times\ w$ bits, per VC};
  \node[anchor=south] at (1.1,3.68) {tail (shift in)};
  \node[anchor=south] at (3.6,3.68) {head};

  % ---- egress mux
  \draw (5.0,0.28) -- (5.9,0.78) -- (5.9,3.12) -- (5.0,3.62) -- cycle;
  \node[rotate=90] at (5.45,1.95) {$V{:}1$};
  \draw[->] (5.45,4.15) -- (5.45,3.4);
  \node[anchor=west] at (5.55,4.3) {grant (SA): $\lceil\log_2 V\rceil$};

  % ---- head tap to the allocators
  \fill (4.45,3.3) circle (1.6pt);
  \draw[->] (4.45,3.3) -- (4.45,4.15);
  \node[anchor=east] at (4.35,4.3) {heads $\to$ RC / VA / SA};

  % ---- to crossbar
  \draw[->] (5.9,1.95) -- (7.9,1.95);
  \node[anchor=south] at (6.9,2.0) {to crossbar};
  \node[anchor=north] at (6.9,1.9) {$w$};

  % ---- per-VC control state
  \draw (0.7,-2.6) rectangle (7.9,-0.45);
  \node[anchor=north,align=center] at (4.3,-0.55)
    {per-VC control state, $V$ copies\\
     $G$: idle / routing / waiting / active\\
     $R$: $\lceil\log_2 p\rceil$ \qquad $O$: $\lceil\log_2 pV\rceil$\\
     credit counter: $\lceil\log_2(B{+}1)\rceil$ bits};
  \draw[->] (0.7,-1.5) -- (-3.6,-1.5);
  \node[anchor=south] at (-1.7,-1.45) {credits out, one per VC};

\end{circuitikz}
\end{document}
```

**A virtual channel is a buffer plus a state record, not a wire.** The physical link is unchanged: $w$ data bits, time-multiplexed at *flit* granularity, plus $\lceil\log_2 V\rceil$ bits of vcid riding alongside so the receiver knows which queue to drop the flit into. What is replicated $V$ times is everything on the receiving side — a $B\times w$-bit queue, and a control record holding $G$ (the channel's state: idle, routing, waiting for an output VC, active), the computed route $R$ at $\lceil\log_2 p\rceil$ bits for a radix-$p$ router, the granted output virtual channel $O$ at $\lceil\log_2 pV\rceil$ bits, and a credit counter of $\lceil\log_2(B{+}1)\rceil$ bits. The whole point of the split is that *channel ownership* and *buffer ownership* stop being the same thing: under [[Wormhole Flow Control]] a packet owns a channel end to end, and a virtual channel lets a second packet own the same physical wire on the cycles the first one is stalled.

**A single FIFO fails because FIFO discipline hides work from the arbiter.** With one queue per input port the switch allocator can only see the head flit; if that head wants an output port that is busy, the flit behind it — which may want a completely free output — cannot be considered. Under uniform random destinations that occlusion caps an input-queued switch at

$$\Theta_{\text{sat}} = 2-\sqrt{2}\approx 0.586$$

of capacity (Karol, Hluchyj & Morgan, 1987), independently of radix in the large-$p$ limit. That is not a buffering shortfall — the queue can be arbitrarily deep and the bound does not move — so it cannot be fixed by adding depth. It is a *scheduling visibility* shortfall, and the only repair is to make more than one flit per input eligible in the same cycle. $V$ queues do exactly that: the input arbiter now runs a $V{:}1$ selection among heads that are, to first order, independent draws over destinations, so the probability that an input has nothing eligible is roughly the $V$-th power of the probability that one head is blocked. The gain is steep to $V=4$ and flat afterwards, which is why almost every real router picks a small $V$.

**Under wormhole the blockage spans routers, so the visibility loss is worse than the switch model suggests.** A wormhole packet of $L$ flits with per-input depth $B$ occupies $\lceil L/B\rceil$ routers when it stalls and holds every channel along that span idle-but-unavailable ([[Wormhole Flow Control]]). One blocked head therefore removes several links from the network, not one crossbar port. [[Virtual Cut-Through Flow Control]] and [[Store-and-Forward Flow Control]] avoid this by demanding $B\ge L$ so a blocked packet collapses into a single node — they pay for head-of-line locality with buffer proportional to packet length. Virtual channels buy the same locality without that coupling: a stalled worm still spans routers, but it no longer excludes traffic from them, because the flits behind it live in a different queue.

**Depth per VC is set by the credit round trip, not by the packet.** Let $t_{crt}$ be the cycles from launching a flit to the returning credit being usable upstream ([[Credit-Based Flow Control]]):

$$t_{crt}=t_{\text{link}}^{\rightarrow}+t_{\text{router}}+t_{\text{credit}}+t_{\text{link}}^{\leftarrow}$$

A sender may have at most $B$ flits outstanding on a VC before it runs out of credits, so with a continuous stream the sustained utilization of that VC is

$$\eta=\min\!\left(1,\ \frac{B}{t_{crt}}\right)$$

A three-stage router with one-cycle links each way and one cycle of credit logic gives $t_{crt}=5$, so $B=2$ caps the channel at $40\%$ *with no contention anywhere in the network*. This is the sizing law, and $L$ does not appear in it.

> [!important] Adding virtual channels multiplies the buffer floor; it does not divide it.
> $B\ge t_{crt}$ is a constraint on *each* VC independently, because credits are accounted per VC — a flit sitting in VC$_1$ returns no credit that VC$_0$ can spend. Splitting a fixed $VB$ budget across more VCs therefore drives every channel below the floor at once, and a design that "adds virtual channels for throughput" while holding total storage constant makes throughput strictly worse. The honest cost of $V$ VCs is $pVBw$ bits with $B\ge t_{crt}$ held fixed, i.e. linear in $V$ with no relief.

**Cost is linear in $V$ and the return is not, which is what fixes the design point.** For a router of radix $p$ the buffer is $pVBw$ bits; at $p=5$, $V=4$, $B=6$, $w=128$ that is $15{,}360$ bits, and it dominates both area and leakage in the [[Virtual-Channel Router]]. The egress $V{:}1$ head mux is $w$ copies of a $V{:}1$ mux, cheap. The expensive second-order effect is on allocation: virtual channel allocation becomes a $pV\times pV$ bipartite match, and the [[Separable Input-First Allocator]] grows an extra stage — $p$ input arbiters of $V{:}1$ in front of the $p$ output arbiters of $p{:}1$, adding $\Theta(\log V)$ to a path that already decides the clock period. Throughput per unit of $V$ falls off after $4$ while both of those grow, and that is the whole argument for $V\in\{2,4\}$.

**Three unrelated jobs want three different values of $V$, and the design takes the maximum, not the sum.** Deadlock freedom by the dateline construction needs $V=2$ per dimension on a torus and $V=1$ on a mesh under dimension order ([[Dateline Virtual Channel Allocation]], [[Dimension-Order Routing Unit]]). Head-of-line mitigation wants $V\approx 4$. Traffic-class separation wants one VC per class that must not block another, which is what turns virtual channels into a service guarantee ([[Priority Aging Arbiter]], [[Deficit Round Robin Scheduler]]). These compose only if the *allocation policy* is compatible: a dateline scheme reserves specific VC indices for specific route phases, so those indices are not freely available to the class scheme, and the counts multiply rather than max out wherever the partitions conflict.

**FPGA mapping inverts the usual instinct that buffers are memory.** A per-VC queue of $B=6$, $w=64$ is $384$ bits. A block RAM is 18 Kb, so one per VC wastes $98\%$ of it; the right primitive is the LUT's shift-register mode, which yields a depth-32 FIFO in a single LUT ([[Lookup-Tables]], [[FPGAs]]). That is exactly the structure of the RTL below — shift in at the tail, index the head — and it is why a shift-register FIFO, which would be a poor choice in an ASIC standard-cell flow, is the natural one here. Move to [[Block Memory]] only when $VB$ is large enough to fill a BRAM; the crossover is around $V\ge 8$ with deep queues, and past it, sharing one BRAM across all VCs of a port with a pointer table beats per-VC storage. The $V{:}1$ head mux maps well too: a 6-input LUT natively implements a $4{:}1$ mux, so $V=4$ costs one LUT per bit and $V=5$ costs two — another reason the practical values of $V$ are powers of two. On ASIC the same queues become a small register file or custom SRAM, and the shift-register form is wrong there because it toggles every stored bit on every push.

$$\boxed{\ \eta = \min\!\left(1,\ \frac{B}{t_{crt}}\right)\ \text{per VC},\qquad \text{storage} = pVBw \ \text{bits},\qquad \Theta_{\text{sat}}: \ 2-\sqrt2 \ \xrightarrow{\ V\ }\ 1\ }$$

**When it breaks**

- **$V=1$ is the degenerate case and it is not free.** All the per-VC state, the demux and the head mux collapse away, but so does the reason for the vcid field on the link. A router built parameterically for $V$ and instantiated at $V=1$ carries $\lceil\log_2 1\rceil = 0$ bits of vcid, and code that assumed at least one bit breaks.
- **Splitting a fixed buffer budget.** Covered above and worth repeating because it is the standard mistake: $VB$ constant with $V$ rising drops every VC below $t_{crt}$ and reduces throughput.
- **Virtual channels do not by themselves remove deadlock.** They add nodes to the channel dependency graph; whether the graph is acyclic depends on the allocation *policy*. Letting a packet pick any free VC can reintroduce exactly the cycle the extra channels were bought to break — see [[Dateline Virtual Channel Allocation]] and [[Turn Model Routing]].
- **A VC is held for a whole packet, not a whole flit.** Virtual channel allocation happens once per packet and body flits must follow the head's VC, so $V$ virtual channels do not give $V$ independent packets per input when packets are long: an input with $V$ active long packets is fully allocated and behaves, for arrival purposes, like a blocked port again.
- **Starvation.** Round-robin among VC heads is fair; fixed priority across classes is not, and the fix is aging, at $\lceil\log_2 P_{\max}\rceil$ extra bits per VC and a wider arbiter comparison ([[Priority Aging Arbiter]], [[Round-Robin Arbiter]]).
- **The head mux is on the critical path.** Head selection sits between the queue read and the crossbar input, so it lands inside the switch-traversal stage. Adding VCs lengthens it, and at that point the queue read must be registered — which adds a cycle to $t_{crt}$ and therefore, by the boxed law, forces every VC deeper.
- **Shared-buffer variants trade area for a new hazard.** One physical memory with a per-VC linked list saves the $V$-way partitioning waste but has a single read port; two VCs granted in the same cycle then cannot both be read, so the sharing reintroduces a coupling between channels that were supposed to be independent.

**RTL (Spade)**

```spade
/// One virtual channel: a B-deep, W-bit shift-in FIFO plus its fill count.
entity vc_queue<#uint B, #uint W>(
    clk: clock,
    rst: bool,
    push: bool,
    pop: bool,
    din: uint<W>,
) -> (uint<W>, bool, bool) {
    decl n;
    let empty = n == 0;
    let full  = n == B;
    let wr = push && !full;
    let rd = pop && !empty;

    reg(clk) q: [uint<W>; B] reset(rst: [0; B]) = if wr { q.shift_front(din) } else { q };
    reg(clk) n: uint<{uint::bits_for(B) + 1}> reset(rst: 0) = match (wr, rd) {
        (true, false) => trunc(n + 1),
        (false, true) => trunc(n - 1),
        _             => n,
    };

    (q[trunc(n - 1)], empty, full)
}

/// Four virtual channels sharing one physical input port: ingress demux on the
/// flit's vcid, egress mux on the switch allocator's grant.
entity vc_buffer4<#uint B, #uint W>(
    clk: clock,
    rst: bool,
    valid: bool,
    vcid: uint<2>,
    din: uint<W>,
    pop: bool,
    grant: uint<2>,
) -> (uint<W>, [bool; 4], [bool; 4]) {
    let (h0, e0, f0) = inst vc_queue::<B, W>(clk, rst, valid && vcid == 0, pop && grant == 0, din);
    let (h1, e1, f1) = inst vc_queue::<B, W>(clk, rst, valid && vcid == 1, pop && grant == 1, din);
    let (h2, e2, f2) = inst vc_queue::<B, W>(clk, rst, valid && vcid == 2, pop && grant == 2, din);
    let (h3, e3, f3) = inst vc_queue::<B, W>(clk, rst, valid && vcid == 3, pop && grant == 3, din);

    let head = match grant { 0 => h0, 1 => h1, 2 => h2, _ => h3 };
    (head, [e0, e1, e2, e3], [f0, f1, f2, f3])
}
```

`valid && vcid == k` is the diagram's ingress demux and `match grant` its egress $V{:}1$ mux; `q` is one VC's $B\times W$ queue and `n` its fill count, one bit wider than an index so it can hold $B$ itself — the same $0\ldots B$ range, and the same role, as the credit counter. `shift_front` writes at index $0$ and drops index $B-1$, so the oldest flit sits at index $n-1$ and the head read is a runtime array index — a shift-register FIFO with a pointer, which is the SRL mapping argued for above, not a dual-pointer RAM. The head read and both flags are combinational off the register state, so the mux delay adds to switch traversal exactly as the critical-path caveat says. Synthesis diverges from the drawing in one place: the four `inst`s draw as four disjoint queues, but `din` fans out to all of them and only `wr` differs, so the tool builds one $W$-bit broadcast and $V$ enables rather than $V$ data paths.

Simulated against a behavioural four-queue reference: 3000 random $(\texttt{valid},\texttt{vcid},\texttt{din},\texttt{pop},\texttt{grant})$ vectors plus directed cases pushing $\texttt{0x01}$ into VC$_0$ and $\texttt{0x80}$ into VC$_1$ — asymmetric on purpose, since a swapped vcid decode or a reversed queue index passes every symmetric vector — and an overflow case confirming that a full VC drops the incoming flit rather than the stored head.

**Related Notes**

- [[Virtual-Channel Router]] – supports: the router this is the input stage of; every other block there sizes off $V$ and $B$.
- [[Wormhole Flow Control]] – depends-on: the flow control whose channel-per-packet, buffer-per-flit split is what makes virtual channels meaningful.
- [[Credit-Based Flow Control]] – depends-on: supplies $t_{crt}$ and the per-VC credit counter that sets $B$.
- [[Virtual Cut-Through Flow Control]] – compares: buys head-of-line locality with $B\ge L$ instead of with $V$ queues.
- [[Store-and-Forward Flow Control]] – compares: the same trade taken further, at $H(t_r+L)$ latency.
- [[Dateline Virtual Channel Allocation]] – extends: the policy that turns these queues into a deadlock-freedom argument rather than just throughput.
- [[Separable Input-First Allocator]] – extends: the $V{:}1$ head selection this exposes, in front of the $p{:}1$ output stage.
- [[Round-Robin Arbiter]] – supports: the fair choice among the $V$ heads.
- [[Speculative Switch Allocation]] – extends: overlaps the per-packet VC allocation with the per-flit switch allocation these queues feed.
- [[Crossbar Switch]] – supports: the consumer of the head mux output, and the term that scales as $p^2w$ while this one scales as $pVBw$.
- [[Lookup-Tables]] – depends-on: the shift-register LUT mode that makes a shallow per-VC queue nearly free on FPGA.
- [[Block Memory]] – counter-example: the primitive that looks right for "buffers" and is wrong until $VB$ is large enough to fill one.
- [[Choosing a Router Architecture]] – compares: where $V$ and $B$ sit against every other router knob.

## References

- [[Network-On-Chip]] — §Flow control (the $t_{crt}$ buffer floor, $\eta=\min(1,B/t_{crt})$, and the $2-\sqrt2$ input-queued bound); §Quality of service and virtual channels (the three roles of $V$ and the values each implies); §FPGA mapping (BRAM waste, the SRL FIFO, and LUT arity in the head mux); §Router microarchitecture (the area table, $pVBw$, and the allocator stages).
- No book source for this topic. Standard treatment in Dally & Towles, *Principles and Practices of Interconnection Networks*, ch. 12–13 (flow control) and ch. 16–17 (router microarchitecture); Dally & Seitz, *IEEE Trans. Computers* C-36(5), 1987, for virtual channels as a deadlock construction; Karol, Hluchyj & Morgan, *IEEE Trans. Comm.* 35(12), 1987, for the $2-\sqrt2$ saturation bound. FIFO and shift-register structure follows the canon in Wakerly, *Digital Design: Principles and Practices*, and Weste & Harris, *CMOS VLSI Design* (register files and the energy cost of shift-based storage). Page numbers are deliberately omitted — no copy was consulted for this note.
