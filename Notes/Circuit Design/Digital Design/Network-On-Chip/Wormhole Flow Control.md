---
title: Wormhole Flow Control
description: "Channel allocated per packet, buffers per flit — decouples buffer depth from packet length entirely, at the cost of a stalled worm holding channels across several routers."
kind: circuit
source: "6.3) Network-On-Chip, §Flow control, §Worked example: a 4-flit packet under XY and wormhole"
status: seed
spade: simulated
tags: [digital, network-on-chip, flow-control, credit, buffer, fpga]
aliases:
  - Wormhole
  - Wormhole Routing
  - Wormhole Switching
  - Wormhole Flow-Control
---

# Wormhole Flow Control

The flow-control discipline that allocates the *channel* per packet but the *buffer* per flit, so that buffer depth stops being a function of packet length and becomes a function of the credit round trip instead.

```tikz title="A stalled 4-flit worm spread across four routers: each holds one flit, all three channels between them are held and idle, and the credit counter in C has one slot left for D"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\footnotesize]
  % ---------- four routers along the path A -> B -> C -> D
  \foreach \x in {0,3.1,6.2,9.3}{
    \draw[line width=0.8pt] (\x,0) rectangle (\x+2.2,1.6);
    \draw (\x+0.2,0.3) rectangle (\x+1.05,1.0);
    \draw (\x+1.15,0.3) rectangle (\x+2.0,1.0);
  }
  \node at (1.1,1.3)  {router $A\,(1,0)$};
  \node at (4.2,1.3)  {router $B\,(2,0)$};
  \node at (7.3,1.3)  {router $C\,(3,0)$};
  \node at (10.4,1.3) {router $D\,(3,1)$};

  % ---------- one 4-flit worm, one flit per router
  \node at (0.62,0.65)  {T};
  \node at (3.72,0.65)  {B$_2$};
  \node at (6.82,0.65)  {B$_1$};
  \node at (9.92,0.65)  {H};

  % ---------- forward channels, all three held by this one packet
  \foreach \x in {2.2,5.3,8.4}{
    \draw[->,line width=0.9pt] (\x,0.65) -- (\x+0.9,0.65);
    \node[anchor=south] at (\x+0.45,0.68) {$w$};
    \draw[<-,dashed] (\x,0.15) -- (\x+0.9,0.15);
  }
  \node[anchor=north] at (2.65,-0.12) {\scriptsize credit: 1 wire per VC};

  % ---------- credit mirror in C for D's input buffer
  \draw (6.1,-1.95) rectangle (10.1,-0.8);
  \node[align=center] at (8.1,-1.38) {credit counter $\kappa_{CD}=1$,\\width $\lceil\log_2(B{+}1)\rceil=2$ b};
  \draw[->] (8.85,0.15) -- (8.85,-0.8);
  \draw[->] (6.9,-0.8) -- (6.9,0);
  \node[anchor=east] at (6.85,-0.45) {send iff $\kappa>0$};

  % ---------- D's chosen output is blocked by another packet
  \draw[->,line width=0.9pt] (11.5,0.65) -- (12.2,0.65);
  \draw[line width=1.1pt] (12.3,0.4) -- (12.8,0.9);
  \draw[line width=1.1pt] (12.3,0.9) -- (12.8,0.4);
  \node[anchor=north,align=center] at (12.55,0.3) {north\\output\\VC busy};

  % ---------- the held-but-idle span
  \draw[thick] (0,2.05) -- (11.5,2.05);
  \draw[thick] (0,2.05) -- (0,1.85);
  \draw[thick] (11.5,2.05) -- (11.5,1.85);
  \node[anchor=south,align=center] at (5.75,2.08)
    {three channels \textbf{held and idle} while the head is blocked --- the head-of-line cost};

  \node[anchor=north west,align=left] at (0,-2.45)
    {each slot holds one flit of $w$ bits, $B=2$ slots per input VC $\;\bullet\;$
     channel allocated \textbf{per packet} (head to tail),\\
     buffer allocated \textbf{per flit} $\;\Rightarrow\; B$ independent of packet length $L$
     $\;\bullet\;$ next cycle B$_1$ enters $D$,\\
     $\kappa_{CD}\!\to\!0$, and the stall walks upstream one router per cycle};
\end{circuitikz}
\end{document}
```

**Separate the two allocations that every simpler scheme fuses.** A packet of $L$ *flits* — flow-control digits, $w$ bits each, the unit the buffers are built in — moves across $H$ routers. Flow control is the rule deciding, for each of the two resources a hop consumes, whether it is claimed per packet or per flit. The **channel** (the physical link and the output VC behind it) is claimed once, by the head flit, and released by the tail: a 2-bit type field in the flit header distinguishes head / body / tail / single-flit, and only the head carries the $2\lceil\log_2 k\rceil$-bit destination on a $k\times k$ mesh, so body and tail flits are pure payload and cost no header bandwidth. The **buffer** is claimed one flit at a time, gated only on whether the downstream input has a free slot. Store-and-forward and [[Virtual Cut-Through Flow Control]] both claim *both* per packet, and that single decision is what forces $B\ge L$ on them: a blocked packet must be able to collapse into one node. Wormhole never has to collapse; when it blocks it stays spread out, which is exactly what the diagram shows.

**Derive the zero-load latency, and see where the serialization went.** Let $t_r$ be the router latency in cycles and $H$ the number of router traversals. Under [[Store-and-Forward Flow Control]] a router forwards nothing until the tail arrives, so each hop costs $t_r$ plus the $L$ cycles of serialization onto the link, and the total is $T_0 = H(t_r + L)$ — the $L$ term is paid $H$ times. Wormhole forwards the head the cycle after it arrives, so the head pays $H t_r$ and every subsequent flit follows one cycle behind it in a pipeline of depth $H$; the tail therefore exits $L-1$ cycles after the head, and

$$T_0 = H\,t_r + (L-1)$$

The serialization is paid **once**, at the tail of the pipeline rather than at every stage — the same reassociation of a repeated cost into a single one that turns a ripple into a prefix tree. For the worked route $(1,0)\to(3,2)$ under dimension-order routing, $H=5$ and $L=4$ with a 1-cycle router: $T_0 = 5\cdot1 + 3 = 8$ cycles, against $5\cdot(1+4) = 25$ for store-and-forward. Virtual cut-through gets the same $T_0=8$; the difference between it and wormhole is not latency at all, it is $B$.

**The floor on $B$ is the credit round trip, and it has nothing to do with $L$.** With [[Credit-Based Flow Control]] the upstream router holds a mirror counter $\kappa$ of the downstream free-slot count — an up/down counter of $\lceil\log_2(B{+}1)\rceil$ bits so that "full" is representable ([[Counters]]) — decremented on send, incremented on credit return, and a send is gated on $\kappa>0$. Let $t_{crt}$ be the cycles from sending a flit to the corresponding credit being usable again upstream:

$$t_{crt}=t_{\text{link}}^{\rightarrow}+t_{\text{router}}+t_{\text{credit}}+t_{\text{link}}^{\leftarrow}$$

At most $B$ flits may be outstanding on that loop, so over $t_{crt}$ cycles at most $B$ flits move, and the sustained utilization of a contention-free link is

$$\eta=\min\!\left(1,\ \frac{B}{t_{crt}}\right)$$

A 3-stage router with one-cycle links each way and one cycle of credit logic gives $t_{crt}=1+3+1+1=6$, so $B<6$ throttles the link to $B/6$ of its bandwidth **with no contention anywhere on the chip**. This is the sizing mistake that survives every routing optimization: buffers are shrunk to recover area, and the loss reappears in traffic simulation as congestion that no amount of routing cleverness removes. Note the coupling it creates with [[Lookahead Routing]] and [[Speculative Switch Allocation]] — $t_{\text{router}}$ *is* the pipeline depth, so a stage removed both shortens the hop and lowers the buffer floor, and is paid back twice.

> [!warning] The long-form note states $t_{crt}=5$ for a 3-stage router with one-cycle links each way and one cycle of credit logic. Substituting into its own formula gives $1+3+1+1=6$. The formula is the authority; treat the $5$ as a slip and re-derive rather than quoting it.

**Price the head-of-line cost, because it is the entire bill for the decoupling.** A stalled worm occupies $\lceil L/B\rceil$ routers and holds every channel between them idle but unavailable — three of them in the diagram. Trace the block at $D$: the head consumes a credit entering $D$ and cannot win switch allocation, $B_1$ follows and takes the last slot, $\kappa_{CD}$ hits $0$, and $C$ stalls; one cycle later $B$ stalls, then $A$. **The stall propagates one router per cycle upstream, and that propagation rate is why $B\ge t_{crt}$ is the floor** — with $B$ below it the link would have gone idle before the block even reached back that far. Continuing the worked example with a 3-cycle block on $D$'s north output, total latency is $11$ cycles against $T_0=8$: the block is passed through to the packet exactly once, not amplified, because wormhole never re-serializes. What *is* amplified is the damage to everyone else. A single FIFO per input port saturates at $2-\sqrt2\approx0.586$ of capacity under uniform random destinations (Karol's input-queued switch bound), because the blocked head hides a ready flit behind it. Giving the arbiter $V$ independent heads to choose from — the second role of a [[Virtual Channel Buffer]] — pushes throughput back toward $1$; the gain is steep to $V=4$ and flat after.

**In-order delivery is a free consequence, not a separate mechanism.** Because the channel is held from head to tail, every flit of a packet follows the identical path through the identical output VC, arriving in issue order. There is no reassembly buffer at the destination and no sequence number in the flit header — both of which a scheme allocating the *channel* per flit would need, and both of which would cost more than the head-of-line blocking they avoid. This is also why the [[Virtual-Channel Router]]'s VA stage runs once per packet while its SA stage runs every cycle: the per-packet/per-flit split in the microarchitecture is a direct transcription of the split defined here. The payload itself is never interpreted — a router computes the identity function on data, so the questions of [[Number Formats]] and the error budget of [[Error Accuracy]] pass through untouched, and the only currency this circuit trades in is cycles.

**On an FPGA the small buffer floor is what makes the scheme affordable.** Because $B$ tracks $t_{crt}$ rather than $L$, a per-VC FIFO is typically 4–8 flits: at $w=64$ that is 256–512 bits, against a BRAM's 18 Kb, so a BRAM per VC wastes over 95 % of it. The right primitive is the shift-register LUT mode, which yields a depth-32 FIFO in a single LUT ([[Lookup-Tables]], [[Block Memory]]) — and a store-and-forward design carrying $B\ge L$ with $L=16$ or more would not fit that primitive nearly as comfortably. The trap on the FPGA side is the reverse coupling: FPGA routing delay dominates logic delay, so long links get pipelined, and **each register stage inserted into a link extends $t_{crt}$ and therefore raises the buffer floor**. Pipelining a link to close timing and then leaving $B$ alone silently caps that link's bandwidth ([[FPGAs]]).

$$\boxed{\ T_0 = H\,t_r + (L-1),\qquad B \ge t_{crt}\ \text{(not}\ B\ge L\text{)},\qquad \eta=\min\!\left(1,\frac{B}{t_{crt}}\right)\ }$$

**When it breaks.**

- **$B < t_{crt}$.** The link runs at $B/t_{crt}$ of its bandwidth on a completely idle chip. Deleting the coupling to $L$ does not delete the coupling to the round trip; it replaces one floor with another, smaller one.
- **$V=1$.** Without virtual channels the head-of-line cost is the dominant term: $2-\sqrt2\approx0.586$ saturation throughput, and a worm blocked deep in the network sterilizes $\lceil L/B\rceil$ channels it is not using. Wormhole without VCs performs badly under load, and every deployed wormhole network has them.
- **Deadlock.** Holding channels across routers is precisely the precondition for a cyclic hold-and-wait. Wormhole makes routing-level deadlock freedom mandatory rather than optional — [[Turn Model Routing]] to break the abstract cycles, [[Dateline Virtual Channel Allocation]] for the torus wraparound that no turn model can reach.
- **Short packets.** At $L=1$ the head is the tail, every scheme degenerates to the same thing, and the header overhead of the type and destination fields is the whole packet. Below roughly $L=4$ the $(L-1)$ term is noise and the choice between wormhole and cut-through is decided entirely by buffer area.
- **Small networks.** Below roughly 16 masters a flat crossbar or an FPGA AXI fabric beats the whole packet-switched apparatus, and the flow-control question does not arise ([[Choosing a Router Architecture]]).
- **Not an accuracy question.** Nothing here rounds, truncates or grows in width: the payload is delivered bit-identical and in order, error $0$ ulp. A flow-control scheme that delivers a wrong *value* is broken, not inaccurate.

**RTL (Spade).**

The synthesizable core is the per-input-VC state that makes the scheme what it is: one bit saying whether the channel is currently held, a register holding *which* output it is held to, and the credit mirror gating the send.

```spade
entity wormhole_port<#uint W, #uint B>(
    clk: clock,
    rst: bool,
    valid: bool,
    is_head: bool,
    is_tail: bool,
    req_port: uint<3>,
    credit_ret: bool,
    flit_in: uint<W>,
) -> (bool, uint<3>, uint<W>) {
    decl send;

    // channel state: held from the head's grant until the tail departs
    reg(clk) held reset(rst: false) =
        if send && is_tail { false } else if send && is_head { true } else { held };
    reg(clk) port: uint<3> reset(rst: 0) =
        if send && is_head { req_port } else { port };

    // credit mirror: one slot per downstream flit buffer
    reg(clk) kappa: uint<4> reset(rst: B) =
        if send && !credit_ret { trunc(kappa - 1) }
        else { if credit_ret && !send { trunc(kappa + 1) } else { kappa } };

    let owns = held || is_head;
    let send = valid && owns && (kappa != 0);
    let out_port = if held { port } else { req_port };

    (send, out_port, flit_in)
}
```

`held` and `port` together are the "channel allocated per packet" half — `port` is latched from `req_port` only on the head and thereafter *overrides* it, which is what keeps the whole worm on one output; `kappa` is the counter drawn under router $C$ and `send` is its `send iff $\kappa>0$` gate, the "buffer allocated per flit" half. Widths: `req_port` is $\lceil\log_2 p\rceil = 3$ bits for a 5-port mesh router, `flit_in` is the $w$-bit datapath, and `kappa` is carried at 4 bits rather than the minimal $\lceil\log_2(B{+}1)\rceil$ because Spade's reset value takes the const generic `B` directly; a real instance would size it from `B`. Everything is combinational out of registers, so `send` and `out_port` are valid the same cycle the flit is presented — synthesis will retime the `kappa != 0` comparison into the counter's own logic, which the drawing shows as a separate gate.

Simulated against a behavioural reference plus nine hand-computed directed vectors: **3018 checks pass**. The directed sequence drives a rival request of port 5 on the body flits while the head granted port 2, and payloads `0x01` against `0x80` — the asymmetric pair that separates a correct hold from one that re-reads `req_port` every cycle or reverses the payload bus. Replacing `out_port` with a bare `req_port` fails 895 of the 3018, and dropping the credit-return increment fails 2727, so both halves of the mechanism are genuinely under test. What simulation says nothing about: contention between worms, since one input port is modelled here, and the allocator that produces `req_port` in the first place.

**Related Notes (with context):**

- [[Virtual Cut-Through Flow Control]] – compares: identical $T_0$, but allocates the buffer per packet too, so it needs $B\ge L$ and never leaves a packet spread across routers.
- [[Store-and-Forward Flow Control]] – counter-example: allocates both per packet *and* waits for the tail, paying the $L$ serialization at every one of the $H$ hops.
- [[Credit-Based Flow Control]] – depends-on: supplies $\kappa$, the `send iff $\kappa>0$` gate, and the $t_{crt}$ that becomes this scheme's buffer floor.
- [[Virtual Channel Buffer]] – depends-on: the $B\times w$ per-VC storage that flit-granular allocation sizes, and the $V$ independent heads that hide the head-of-line cost.
- [[Virtual-Channel Router]] – extends: implements the per-packet/per-flit split as the VA/SA stage split of a real pipeline.
- [[Dateline Virtual Channel Allocation]] – supports: holding channels across routers makes deadlock freedom mandatory, and the torus needs VCs to get it.
- [[Turn Model Routing]] – supports: the routing-level half of the same deadlock obligation, by forbidding turns instead of adding buffers.
- [[Lookahead Routing]] – extends: shortening $t_{\text{router}}$ shortens $t_{crt}$, so it lowers the buffer floor as well as the hop latency.
- [[Choosing a Router Architecture]] – compares: where this sits against the bufferless, cut-through and flat-crossbar alternatives.
- [[Counters]] – depends-on: the $\pm0$/$\pm1$ up-down counter that the credit mirror reduces to.
- [[FPGAs]] – supports: the small buffer floor is what lets a per-VC FIFO live in one SRL LUT instead of a BRAM.

## References

- Local: [[6.3) Network-On-Chip]] §"Flow control" (the three-scheme taxonomy and its comparison table, $t_{crt}$, $\eta=\min(1,B/t_{crt})$, the credit-counter structure and the on/off and ack/nack alternatives, Karol's $2-\sqrt2$ bound), §"Worked example: a 4-flit packet under XY and wormhole" (the $(1,0)\to(3,2)$ route, the cycle-by-cycle occupancy table, and the backpressure trace with $\kappa_{CD}$); §"FPGA mapping" for the SRL-versus-BRAM buffer crossover and the pipelined-link consequence.
- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — ch. 12–13, the flow-control taxonomy, buffered flow control and the credit round-trip bound.
- Dally & Seitz, "Deadlock-Free Message Routing in Multiprocessor Interconnection Networks", *IEEE Trans. Computers* C-36(5), 1987 — wormhole routing and the channel-dependency argument it makes mandatory.
- Karol, Hluchyj & Morgan, "Input Versus Output Queueing on a Space-Division Packet Switch", *IEEE Trans. Comm.* 35(12), 1987 — the $2-\sqrt2$ head-of-line saturation bound.
- Mano & Ciletti, *Digital Design*, and Wakerly, *Digital Design: Principles and Practices* — the up/down counter and the register-plus-mux hold structure the RTL above reduces to.
