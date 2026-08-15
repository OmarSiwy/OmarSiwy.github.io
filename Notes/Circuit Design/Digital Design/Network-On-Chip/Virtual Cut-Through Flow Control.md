---
title: "Virtual Cut-Through Flow Control"
description: "Forwards the head as soon as the downstream can hold the whole packet — pays serialization once, H*t_r+(L-1), but still needs B >= L so a blocked packet collapses into one node."
kind: circuit
source: "6.3) Network-On-Chip §Flow control — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, flow-control, buffering, credits]
aliases:
  - Virtual Cut-Through
  - VCT
  - Virtual Cut-Through Switching
  - Cut-Through Switching
  - Cut-Through Flow Control
---

# Virtual Cut-Through Flow Control

Allocates buffer and channel per packet like [[Store-and-Forward Flow Control]], but releases the head to the next hop the instant the downstream buffer can hold the *entire* packet, so serialization is paid once for the route instead of once per hop.

```tikz title="Store-and-forward against virtual cut-through as a space-time diagram, and the free-slot comparator that decides admission"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

% ============ panel A: space-time.  u = 0.28 cm/cycle, x = 0.28*(cycle+3) ============
\node[anchor=west] at (-1.0,3.8) {\textbf{store-and-forward}};
\foreach \k/\y/\s in {0/3.25/0, 1/2.8/5, 2/2.35/10, 3/1.9/15} {
  \node[anchor=east] at (-0.15,\y) {\tiny node $\k$};
  \draw[dotted,black!45] (0,\y) -- (5.5,\y);
  \draw[fill=black!12] ({0.28*\s},\y-0.15) rectangle ({0.28*(\s+4)},\y+0.15);
}
\draw[|<->|] (0.84,1.5) -- (5.04,1.5);
\node[anchor=south] at (2.94,1.48) {\tiny $H(t_r+L)$};

\node[anchor=west] at (-1.0,1.0) {\textbf{virtual cut-through}};
\foreach \k/\y/\s in {0/0.45/0, 1/0.0/4, 2/-0.45/5, 3/-0.9/6} {
  \node[anchor=east] at (-0.15,\y) {\tiny node $\k$};
  \draw[dotted,black!45] (0,\y) -- (5.5,\y);
  \draw[fill=black!30] ({0.28*\s},\y-0.15) rectangle ({0.28*(\s+4)},\y+0.15);
}
\draw[|<->|] (0.84,-1.3) -- (2.52,-1.3);
\node[anchor=west] at (2.62,-1.3) {\tiny $Ht_r+(L-1)$};

\draw[->] (0,-1.75) -- (5.5,-1.75) node[anchor=west] {\tiny cycle};
\foreach \c in {0,5,10,15} {
  \draw ({0.28*(\c+3)},-1.70) -- ({0.28*(\c+3)},-1.80);
  \node[anchor=north] at ({0.28*(\c+3)},-1.80) {\tiny \c};
}
\node[anchor=west,align=left] at (-1.0,-2.35) {\tiny a bar is the packet occupying that node's buffer; $L=4$ flits of $w$ bits,\\ \tiny one flit per cycle, $t_r=1$, $H=3$ hops.  Cycle $0$ = head ready at node $0$.};

% ============ panel B: the admission test ============
\node[anchor=west] at (6.3,3.8) {\textbf{admission: grant only if the whole packet fits}};

\draw (6.3,0.95) rectangle (8.3,2.85);
\node[anchor=north] at (7.3,2.8) {\tiny upstream router};
\draw (6.5,2.05) rectangle (8.1,2.45);
\node at (7.3,2.25) {\tiny head flit ($L$)};
\draw (6.5,1.35) rectangle (8.1,1.75);
\node at (7.3,1.55) {\tiny output port};

\draw (10.6,0.95) rectangle (13.2,2.85);
\node[anchor=north] at (11.9,2.8) {\tiny downstream router};
\foreach \i in {0,1,2} { \draw (10.9,{1.55+0.35*\i}) rectangle (12.9,{1.83+0.35*\i}); }
\node[anchor=north] at (11.9,1.48) {\tiny $B\times w$, \ $B\ge L$};

\draw[->] (8.3,1.55) -- (10.6,1.55);
\node[anchor=south] at (9.45,1.55) {\tiny flit, $w$ b};

\draw[->] (11.5,0.95) -- (11.5,0.35) -- (7.6,0.35) -- (7.6,-0.4);
\node[anchor=south] at (9.8,0.35) {\tiny credit, 1 b \ ($+1$)};
\draw[->] (6.7,0.95) -- (6.7,-0.4);
\node[anchor=east] at (6.6,0.3) {\tiny send ($-1$)};

\draw (6.3,-1.4) rectangle (8.0,-0.4);
\node[anchor=north,align=center] at (7.15,-0.5) {\tiny free-slot mirror\\ \tiny $\lceil\log_2(B{+}1)\rceil$ b};

\draw (8.8,-1.35) rectangle (9.9,-0.45);
\node at (9.35,-0.9) {$\ge$};
\draw[->] (8.0,-0.9) -- (8.8,-0.9);
\node[anchor=south] at (8.4,-0.88) {\tiny free};

\draw[->] (9.35,-1.95) -- (9.35,-1.35);
\node[anchor=east] at (9.25,-1.95) {\tiny $L$ from the header};

\node[and port] (A) at (11.4,-0.9) {};
\draw[->] (9.9,-0.9) -| (A.in 1);
\draw[->] (10.4,-1.95) -| (A.in 2);
\node[anchor=west] at (10.5,-1.95) {\tiny head flit valid};
\draw[->] (A.out) -- (13.4,-0.9);
\node[anchor=south] at (12.6,-0.88) {\tiny grant};
\node[anchor=north,align=center] at (12.6,-0.95) {\tiny held for\\ \tiny all $L$ flits};

\node[anchor=west] at (6.3,-3.05) {\tiny wormhole is this datapath with the comparator folded to $\ge 1$: one flit, not one packet};

\end{circuitikz}
\end{document}
```

*Own construction; [[6.3) Network-On-Chip]] gives the three schemes as prose and a table, with no figure.*

**Read flow control as two independent allocation decisions, and cut-through moves exactly one of them.** A flow-control scheme answers two questions: at what granularity is a *buffer* handed to traffic, and at what granularity is a *channel*. Store-and-forward answers "per packet" to both and additionally refuses to forward until the packet is complete. Wormhole answers "per packet" for the channel and "per flit" for the buffer. Virtual cut-through keeps both allocations per packet — so a granted packet owns the downstream buffer and the channel until its tail passes — and changes only the *trigger*: the head advances on a predicate over free space rather than on the arrival of the tail. Everything else in this note follows from that one substitution. Signal widths for the rest of the argument: a flit is $w$ bits, a packet is $L$ flits, an input buffer holds $B$ flits and so is $B\times w$ bits, the free-slot count is $\lceil\log_2(B{+}1)\rceil$ bits because it ranges over $0\dots B$ inclusive, and the length field in the head flit is $\lceil\log_2(L_{\max}{+}1)\rceil$ bits.

**Removing the tail wait collapses $H$ serializations into one, and the saving is exact.** Take $t_r$ as the router traversal latency in cycles — route computation, allocation, switch and link folded together — with one flit per cycle per channel. Under store-and-forward, node $k$ may not transmit until it holds all $L$ flits, so the packet's residence at each node spans $L$ cycles and the next hop begins $t_r$ later; hops compose additively and

$$T_0^{\text{SF}} = H\,(t_r + L)$$

Under cut-through the head is released as soon as its own allocation completes, so head arrival times are the arithmetic sequence $t_r, 2t_r, \dots, H t_r$. The body flits follow one per cycle down a chain of channels that are each busy for one cycle per flit, so the tail sits exactly $L-1$ cycles behind the head at *every* point on the route — the offset is invariant along the path because every channel has the same throughput. The tail therefore lands $L-1$ cycles after the head:

$$T_0^{\text{VCT}} = H\,t_r + (L-1)$$

Subtracting, $T_0^{\text{SF}} - T_0^{\text{VCT}} = (H-1)L + 1$. Serialization is paid $H$ times in one scheme and once in the other, and the residue $+1$ is the single $t_r$-free cycle at the source. With $H=5$, $t_r=3$ and $L=16$ that is $95$ cycles against $30$ — a factor of three that costs nothing but a comparator, which is why store-and-forward survives only in off-chip protocols where a whole packet must be checksummed before it can be trusted.

**The price of the early forward is that the downstream must be able to swallow the packet whole.** Under store-and-forward a blocked packet is trivially somewhere: it is sitting complete in one node's buffer, which is why $B \ge L$ was already required. Cut-through must preserve that property while the packet is in flight, because a packet whose head has advanced and then blocks is *spread across the route*, holding channels. The admission predicate is what restores it:

$$\text{grant} = \text{head\_valid} \wedge (\text{free} \ge L)$$

Granting only when $L$ slots are free means the downstream node has committed to absorbing every remaining flit, so if the head blocks after the grant, the body drains in behind it and the packet collapses into that one node — releasing every channel and every upstream buffer it was occupying. That collapse is the whole safety argument, and it is why $B \ge L$ is inherited unchanged from store-and-forward rather than being relaxed.

> [!important]
> $B \ge L$ under cut-through is a **liveness precondition, not a sizing guideline**. If $B < L$ then $\text{free} \le B < L$ holds permanently, the predicate is never satisfiable, and no packet of length $L$ is ever granted anywhere in the network. A buffer that is one flit too small does not degrade throughput — it stops the network. This is the failure mode to check first when a variable-length protocol is dropped onto a fabric sized for a fixed $L$.

**Because a blocked packet occupies exactly one buffer, the deadlock analysis is unchanged from store-and-forward.** Deadlock freedom is proved on a dependency graph whose vertices are the resources a packet can hold while waiting for another. Under cut-through that set is a single input buffer per packet — the collapse guarantees it — so the graph is the same buffer-level graph store-and-forward induces, and any routing function with an acyclic channel dependency graph, such as [[Dimension-Order Routing Unit|dimension-order routing]] or a legal [[Turn Model Routing|turn model]], remains deadlock-free without modification. [[Wormhole Flow Control]] does not get this for free: a blocked worm holds $\lceil L/B \rceil$ routers' worth of channels simultaneously, so the graph must be drawn over channels, has strictly more edges, and closes cycles that the buffer-level graph does not — which is the real reason wormhole networks reach for virtual channels while cut-through networks often do not need to.

**The buffer that liveness forces usually pays for itself in link utilization.** Credit-based backpressure ([[Credit-Based Flow Control]]) caps sustained utilization at

$$\eta = \min\!\left(1,\ \frac{B}{t_{crt}}\right), \qquad t_{crt}=t_{\text{link}}^{\rightarrow}+t_{\text{router}}+t_{\text{credit}}+t_{\text{link}}^{\leftarrow}$$

because the sender may have at most $B$ flits outstanding before it must wait for a credit. A wormhole design has to size $B$ against $t_{crt}$ deliberately, and shrinking buffers to save area silently throttles every link to $B/t_{crt}$ of its bandwidth with no contention anywhere. Cut-through has already been forced to $B \ge L$, so whenever $L \ge t_{crt}$ — a 3-stage router with one-cycle links each way and one cycle of credit logic gives $t_{crt}=5$, so any packet of five flits or more — full utilization comes free with the liveness requirement. The buffer is not wasted; it is doing two jobs.

**What cut-through does not fix is head-of-line blocking, only where it happens.** A single FIFO per input port saturates at $2-\sqrt{2}\approx 0.586$ of capacity under uniform random destinations (Karol's input-queued switch bound): the blocked head hides a ready flit behind it, and no amount of switch bandwidth recovers the loss. Cut-through confines that blocking to one router instead of letting it span $\lceil L/B \rceil$ of them, which bounds the *reach* of a stalled packet but not its cost at the port where it stalls. The fix is orthogonal — $V$ [[Virtual Channel Buffer|virtual channels]] give the [[Separable Input-First Allocator|allocator]] $V$ independent heads to choose from, pushing throughput toward $1$, steeply up to $V=4$ and flat after — and it multiplies the buffer bill, since $B \ge L$ is required *per VC*, not per port.

**On FPGA the mapping decision is set by which term of the latency formula the buffer lands in.** $H t_r$ multiplies the router latency by the hop count, while the serialization term $L-1$ is paid once, so anything that adds a cycle to $t_r$ is charged $H$ times and anything that lengthens the packet is charged once. A $B\times w$ buffer with $L=16$ and $w=64$ is $1024$ bits per VC per port; that fits a [[Block Memory|BRAM]] many times over, but a BRAM's synchronous read costs a cycle inside $t_r$ and therefore $H$ cycles end-to-end. Distributed LUT RAM has a combinational read and keeps $t_r$ at its logic-limited value, at roughly an order of magnitude worse bit density ([[FPGAs]]). The rule that falls out is to hold shallow buffers in distributed RAM and push to BRAM only once $B\,w$ per VC is large enough that the area saving beats $H$ cycles of added zero-load latency — the opposite of the instinct that BRAM is always the cheaper store. On ASIC the buffer is a small register file or SRAM macro and the same latency accounting applies; the comparator itself is $\lceil\log_2(B{+}1)\rceil$ bits wide and disappears into a single carry chain either way ([[Comparators]]).

$$\boxed{\ T_0 = H\,t_r + (L-1),\qquad \text{grant} = \text{head\_valid} \wedge (\text{free} \ge L),\qquad B \ge L\ }$$

**When it breaks**

- **The length must be known at the head.** The comparator needs $L$ before the packet moves, so either the header carries a $\lceil\log_2(L_{\max}{+}1)\rceil$-bit length field or every packet is fixed length and the comparator folds against a constant. A protocol that streams until an end-of-packet marker — perfectly legal under wormhole, which only ever asks about one flit — cannot be run under cut-through at all.
- **Testing `free >= L` is not the same as reserving $L$ slots.** With more than one input contending for the same output, two heads can both observe $\text{free} \ge L$ in the same cycle and both be granted, after which neither packet fits. The free count must be decremented by $L$ at grant time, or the output port locked to the winner for the packet's duration. A per-flit decrement alone, as in the RTL below, is only correct once that lock exists.
- **Under saturation the latency advantage evaporates.** If the head blocks at every hop, the packet is pulled into each node in turn and $T_0$ walks back up to $H(t_r+L)$. Cut-through is a low-load optimisation that degrades gracefully to store-and-forward; the buffers it needs, it needs at all loads.
- **$B \ge L$ per VC dominates router area.** A 5-port router with $V=4$ VCs, $L=16$ and $w=64$ carries $5 \cdot 4 \cdot 1024 = 20{,}480$ bits of buffer, and buffers dominate NoC area and leakage. Decoupling $B$ from $L$ is the entire reason [[Wormhole Flow Control]] displaced cut-through on chip, where wire and buffer budgets are tight, while cut-through remains standard off chip where they are not.
- **Long packets defeat the whole scheme.** As $L$ grows, $B \ge L$ grows with it and the packet occupies a buffer for longer, so a single long packet blocks a port for $L$ cycles regardless of priority. Bounding $L$ and fragmenting above the bound is not optional; it is what makes the $2-\sqrt{2}$ bound the *worst* case rather than an average.

**RTL (Spade)**

```spade
entity vct_admit<#uint B>(
    clk: clock,
    rst: bool,
    head: bool,
    len: uint<{uint::bits_for(B + 1)}>,
    send: bool,
    credit: bool,
) -> (bool, uint<{uint::bits_for(B + 1)}>) {
    decl free_next;
    reg(clk) free: uint<{uint::bits_for(B + 1)}> reset(rst: B) = free_next;
    let free_next = match (send, credit) {
        (true, false) => free -. 1,
        (false, true) => free +. 1,
        _             => free,
    };
    (head && (free >= len), free)
}
```

`free` is the free-slot mirror box of the diagram — the upstream router's private copy of the downstream buffer's occupancy, never the buffer itself, which is why it is $\lceil\log_2(B{+}1)\rceil$ bits and not $B\times w$; the width comes out of `uint::bits_for(B + 1)` rather than `bits_for(B)` because the count must represent $B$ itself, not just $B-1$. `send` and `credit` are the two tap-off arrows: the truncating `-.` and `+.` are used deliberately, since `-` and `+` would widen to $\lceil\log_2(B{+}1)\rceil + 1$ bits and the four-way `match` guarantees the counter never leaves $[0,B]$ anyway, so no saturation logic is synthesised. The `(true, true)` arm falling into `_` is the $\pm 0$ case of simultaneous send-and-credit — one flit leaving as one slot frees — which is why the counter needs a two-bit increment select rather than a second write port ([[Counters]]). Everything is registered except `grant`, which is combinational on the *current* `free`, so the comparator sits in the same cycle as the switch allocator's decision; synthesis will merge it into the allocator's timing path rather than leaving it as the standalone magnitude comparator the drawing shows.

**Related Notes**

- [[Store-and-Forward Flow Control]] – compares: identical per-packet allocation and identical $B \ge L$, waiting for the tail instead of the predicate, at a cost of $(H-1)L+1$ cycles.
- [[Wormhole Flow Control]] – extends: the same datapath with the comparator constant folded to $1$, decoupling $B$ from $L$ but spreading a blocked packet across $\lceil L/B \rceil$ routers.
- [[Credit-Based Flow Control]] – depends-on: the free-slot mirror, the credit return wire, and the $\eta = \min(1, B/t_{crt})$ ceiling this scheme satisfies for free.
- [[Virtual Channel Buffer]] – supports: the $V$ independent heads that attack the head-of-line blocking cut-through confines but does not remove.
- [[Turn Model Routing]] – supports: deadlock freedom argued on the buffer dependency graph, which is exactly the graph the packet collapse preserves.
- [[Choosing a Router Architecture]] – compares: where this sits against every sibling flow-control and router choice.
- [[Counters]] – depends-on: the up/down counter with a $\pm 0$ update and no second port.
- [[FPGAs]] – extends: the BRAM-versus-distributed-RAM mapping of the $B \times w$ buffer, and why a cycle of read latency is charged $H$ times.
- [[Network-On-Chip]] – depends-on: topology, hop count $H$ and the router pipeline that sets $t_r$.

## References

- [[6.3) Network-On-Chip]] — §Flow control: the three-scheme taxonomy and which resource is allocated per packet versus per flit, $T_0 = H(t_r+L)$ and $T_0 = Ht_r+(L-1)$, the $B \ge L$ requirement and the collapse-into-one-node argument, the credit round trip $t_{crt}$ and $\eta=\min(1, B/t_{crt})$, the comparison table, and Karol's $2-\sqrt{2}\approx 0.586$ input-queued switch bound.
- No textbook source for this topic in *Application-Specific Arithmetic*. The flow-control taxonomy, the zero-load latency expressions and the head-of-line bound are standard in Dally & Towles, *Principles and Practices of Interconnection Networks*, ch. 12–13 — the reference [[6.3) Network-On-Chip]] itself cites. No copy was consulted for this note, so no page numbers are given.
