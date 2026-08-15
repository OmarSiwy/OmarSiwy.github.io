---
title: "Credit-Based Flow Control"
description: "An up/down mirror counter of ceil(log2(B+1)) bits per output VC, send gated on count>0 — lossless backpressure with full link utilisation whenever B >= t_crt."
kind: circuit
source: "6.3) Network-On-Chip §Flow control, §Worked example: a 4-flit packet under XY and wormhole — no book source"
status: seed
spade: simulated
tags: [digital, network-on-chip, flow-control, backpressure, counters, fpga]
aliases:
  - Credit-Based Backpressure
  - Credit Flow Control
  - Credit Counter
  - Credits
---

# Credit-Based Flow Control

Link-level backpressure in which the *sender* holds an up/down counter mirroring the receiver's free-slot count and refuses to send when it reads zero — the only one of the three common schemes that is both lossless and, given enough buffer, capable of driving the link at full rate.

```tikz title="Credit-based flow control across one link: upstream mirror counter, send gated on non-zero, credit returned per dequeue"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  % ---- router enclosures ----
  \draw[dashed,gray] (-0.3,-1.0) rectangle (5.9,4.0);
  \node[anchor=south] at (2.9,4.05) {upstream router};
  \draw[dashed,gray] (7.7,-1.0) rectangle (13.7,4.0);
  \node[anchor=south] at (10.7,4.05) {downstream router};

  % ---- upstream: output VC and credit counter ----
  \draw (0.2,2.7) rectangle (2.6,3.6);
  \node[align=center] at (1.4,3.15) {output VC\\[-2pt]\scriptsize (holds the flit)};

  \draw (0.1,0.25) rectangle (3.3,1.9);
  \node[align=center] at (1.7,1.05)
    {credit counter $\kappa$\\[-2pt]\scriptsize up/down, $W$ bits\\[-2pt]
     \scriptsize $W=\lceil\log_2(B{+}1)\rceil$};

  \draw (3.7,0.8) rectangle (4.4,1.5);
  \node at (4.05,1.15) {$\neq 0$};

  \node[and port,scale=0.85] (A) at (5.2,2.6) {};

  % req into the gate
  \draw (2.6,3.15) -- (4.45,3.15);
  \draw[->] (4.45,3.15) |- (A.in 1);
  \node[anchor=south] at (3.4,3.18) {req \, / \, $1$};

  % go = (kappa != 0) into the gate
  \draw[->] (3.3,1.15) -- (3.7,1.15);
  \draw (4.4,1.15) -- (4.75,1.15);
  \draw[->] (4.75,1.15) |- (A.in 2);
  \node[anchor=east] at (4.58,1.85) {go \, / \, $1$};

  % ---- forward link ----
  \draw[->] (A.out) -- (8.2,2.6);
  \node[anchor=south] at (7.0,2.66) {flit \, / \, $w$ bits};
  \node[anchor=north] at (7.0,2.54) {$t^{\rightarrow}_{\text{link}}$};

  % ---- downstream: B-slot input buffer ----
  \draw (8.2,2.1) rectangle (11.4,3.1);
  \foreach \x in {9.0,9.8,10.6} \draw (\x,2.1) -- (\x,3.1);
  \node[anchor=south] at (9.8,3.15) {input VC buffer, $B$ slots};
  \draw[->] (11.4,2.6) -- (13.5,2.6);
  \node[anchor=north] at (12.5,2.5) {\scriptsize to SA, $t_{\text{router}}$};

  % dequeue frees a slot -> credit
  \fill (12.3,2.6) circle (1.4pt);
  \draw (12.3,2.6) -- (12.3,1.15);
  \draw[->] (12.3,1.15) -- (11.4,1.15);
  \draw (8.4,0.5) rectangle (11.4,1.8);
  \node[align=center] at (9.9,1.15)
    {free-slot logic\\[-2pt]\scriptsize $+1$ per dequeue\\[-2pt]\scriptsize $t_{\text{credit}}$};

  % ---- reverse credit link ----
  \draw (8.4,1.15) -- (7.0,1.15) -- (7.0,-0.6) -- (1.5,-0.6);
  \draw[->] (1.5,-0.6) -- (1.5,0.4);
  \node[anchor=south] at (4.3,-0.57) {credit \, / \, $1$ \quad $t^{\leftarrow}_{\text{link}}$};

  % ---- round trip annotation ----
  \node[anchor=north] at (6.7,-1.15)
    {$t_{crt}=t^{\rightarrow}_{\text{link}}+t_{\text{router}}+t_{\text{credit}}+t^{\leftarrow}_{\text{link}}
      \quad\Longrightarrow\quad \eta=\min\!\left(1,\tfrac{B}{t_{crt}}\right)$};
\end{circuitikz}
\end{document}
```

**Fix the invariant before designing any logic, because the invariant is the whole circuit.** One link, one virtual channel. Downstream the [[Virtual Channel Buffer]] holds $B$ flits; write $o$ for its occupancy and $\phi$ for the number of flits that have left the sender and not yet been written — in flight on the wire or in the receiver's input register. Upstream the sender keeps $\kappa$, and the claim to maintain is

$$\kappa \;=\; B - o - \phi \qquad\Longrightarrow\qquad o + \phi \le B\ \text{ whenever }\ \kappa\ge 0$$

Read the right-hand implication as the statement that *no flit is ever dropped*: every flit already committed to the link has a slot reserved for it before it was sent. The sender therefore does not need to know $o$, which it cannot know — it only needs a quantity it can maintain locally and which is never optimistic. Decrementing $\kappa$ at the moment of *sending* rather than at the moment of *arrival* is exactly what makes $\phi$ appear on the right-hand side, and that one design choice is what buys losslessness across an arbitrarily long link.

**Turn the two events into one recurrence and read the width off its range.** In any cycle two independent things can happen: a flit is sent ($s\in\{0,1\}$) and a credit is returned ($c\in\{0,1\}$). Each send costs one slot and each credit restores one, so by the invariant above, $\kappa$ obeys the first-order recurrence

$$\kappa^{+} = \kappa - s + c,\qquad s = \text{req}\wedge(\kappa>0),\qquad c\in\{0,1\}$$

The gating $s=\text{req}\wedge(\kappa>0)$ is what keeps the recurrence inside $[0,B]$: $\kappa$ can only be decremented from a strictly positive value, and $c=1$ only ever follows a matching earlier $s=1$, so $\kappa\le B$ by induction on the credit-conservation of the link. Since $\kappa$ ranges over the $B+1$ values $\{0,\dots,B\}$ — not $B$ — the state is

$$W=\lceil\log_2(B+1)\rceil\ \text{bits},$$

and the off-by-one there is real: $B=8$ needs 4 bits, not 3. The increment is $\delta=c-s\in\{-1,0,+1\}$, a 2-bit signed select feeding one [[Synchronous Counters|synchronous up/down counter]], **not** two counters and not a two-port structure. Simultaneous send and credit is the $\delta=0$ case and cancels exactly, which is the ordinary steady state of a saturated link, so it is the case worth getting right first.

> [!important] The counter is pessimistic by construction, and that is the safety argument
> A "downstream full" flag would be a fact about the receiver that is $t_{crt}$ cycles old by the time the sender can act on it, and acting on stale fullness is precisely how a flit gets dropped. $\kappa$ carries no such staleness because it charges a flit the instant it leaves: it can only ever *under*-estimate the free space, never over-estimate it. The price of that safety is that a credit in flight is invisible, which is what makes throughput — not correctness — depend on $t_{crt}$.

**Follow one credit around the loop and the buffer sizing rule falls out.** Let $t_{crt}$ be the number of cycles from sending a flit to the corresponding credit being usable by the sender's gate:

$$t_{crt}=t^{\rightarrow}_{\text{link}}+t_{\text{router}}+t_{\text{credit}}+t^{\leftarrow}_{\text{link}}$$

The sender may have at most $B$ flits outstanding — that is the invariant again — and each one ties up a credit for $t_{crt}$ cycles, so a saturated link is a $B$-token pipeline of latency $t_{crt}$ and Little's law gives the sustained utilisation directly:

$$\eta=\min\!\left(1,\ \frac{B}{t_{crt}}\right)$$

A 3-stage router with one-cycle links each way and one cycle of credit logic gives $t_{crt}=5$, so $B<5$ throttles the link *with no contention anywhere in the network*. This is the single most common NoC sizing mistake: shrinking buffers to save area and silently capping every link at $B/5$ of its bandwidth, in a measurement that shows up as diffuse latency rather than as anything pointing at the buffer. Note what $B\ge t_{crt}$ is **not** — it is not $B\ge L$ for packet length $L$. Under [[Wormhole Flow Control]] the buffer floor is set by the credit loop alone and is independent of packet length, which is the entire reason wormhole buffers can be two or four flits deep; under [[Virtual Cut-Through Flow Control]] and [[Store-and-Forward Flow Control]] the floor is $\max(L,t_{crt})$ because a blocked packet must collapse into one node.

**Count the hardware, because it is smaller than the alternatives' hidden costs.** Per output virtual channel: $W$ flip-flops, one $W$-bit incrementer/decrementer, and a $W$-input OR to form $\kappa\ne 0$. A router with $P$ ports and $V$ VCs per port therefore carries $PV$ such counters and $PV$ reverse wires, or one shared reverse wire plus a $\lceil\log_2 V\rceil$-bit credit-VC identifier when the reverse channel is serialised. Against that, **on/off** signalling replaces the counter with one wire and a threshold, but the off threshold must leave $t_{crt}$ slots of headroom or flits are dropped — it wastes buffer, the expensive resource, to save $W$ wires, the cheap one. **Ack/nack** keeps no reverse state at all and retransmits instead, spending energy proportional to the drop rate and needing a copy of every unacknowledged flit at the sender, which is the buffer it claimed to save. On FPGA ([[FPGAs]]) all of this is nearly free: the up/down counter sits on the hard carry chain and the zero-detect is one or two LUT levels, so $W$ never sets $f_{\max}$; on ASIC the same is true, and the timing question is instead whether $\kappa\ne 0$ can reach the switch-allocator input in the same cycle, which is what pushes designs toward computing `go` one cycle early from $\kappa^{+}$.

**Note where the payload isn't.** Nothing here is arithmetic on data — the flit crosses bit-identical and in order, so the error contribution is exactly $0$ ulp and [[Error Accuracy]] has nothing to say about it. The only quantity this circuit trades in is cycles, and every design decision above is a cycle-count argument. That is also why the counter's own arithmetic must be exact: a single lost or duplicated credit is not a small error, it is a permanent change to the effective buffer depth.

$$\boxed{\ \kappa^{+}=\kappa-s+c,\quad s=\text{req}\wedge(\kappa>0),\quad W=\lceil\log_2(B{+}1)\rceil,\quad \eta=\min\!\left(1,\tfrac{B}{t_{crt}}\right)\ }$$

**When it breaks**

- **$B<t_{crt}$.** Correct, lossless, and capped at $B/t_{crt}$ of the link's bandwidth forever. Nothing in simulation reports an error; the link is simply slower than the wire it runs on.
- **The two ends are not reset consistently.** $\kappa$ must come out of reset equal to the receiver's actual free count. Reset early on one side of a link and the sender either believes in credits that do not exist (overrun, lost flits) or permanently under-counts (throughput loss that never heals). Links whose ends can reset independently need an initialisation handshake before the first flit, not just a shared reset net.
- **A credit is corrupted or dropped.** There is no retransmission and no resynchronisation: the buffer depth silently becomes $B-1$ and stays there. This is the argument for parity or ECC on the reverse channel even when the forward channel has none — one bit of reverse state is worth more than one bit of payload.
- **One counter shared across virtual channels.** The invariant is per-buffer; a counter shared over $V$ VCs cannot tell which VC has room, so a blocked VC blocks all of them and the virtual channels stop being independent. Per-VC counters are not an optimisation, they are what makes [[Virtual-Channel Router|virtual channels]] work.
- **Packet-granular buffer allocation.** Under cut-through or store-and-forward the receiver must reserve $L$ slots atomically, so the test is $\kappa\ge L$ at the head flit and the counter is decremented by $L$ at once — a comparator and a subtract, not a decrement, and the sender must know $L$ before sending the head.
- **The link crosses a clock domain.** $\kappa$ is a multi-bit level, so returning a raw count across an asynchronous boundary is a classic multi-bit CDC failure. Credits must cross as single-cycle pulses through a pulse synchroniser, or the whole buffer must become a [[Dual-Clock Asynchronous FIFO]] whose pointer comparison does the same job in Gray code.
- **A credit and a send in the same cycle at $\kappa=0$.** $\delta=0$ is only correct when the send actually happened; if `req` was gated off by $\kappa=0$ then $s=0$ and the credit must still be counted. Deriving $\delta$ from `req` instead of from the *gated* send is the standard bug, and it loses one credit per stall.

**RTL (Spade)**

```spade
/// Upstream credit counter mirroring one downstream input VC of depth B.
/// W = ceil(log2(B+1)) bits. `req` asks to send, `crd` is a returning credit.
/// Sends are gated on kappa > 0, so the buffer can never be overrun.
entity credit_ctr<#uint W>(clk: clock, rst: bool, b0: uint<W>, req: bool, crd: bool)
    -> (bool, uint<W>)
{
    decl nxt;
    reg(clk) k: uint<W> reset(rst: b0) = nxt;
    let go  = k != 0;
    let snd = req && go;
    let nxt: uint<W> = match (snd, crd) {
        (true,  false) => trunc(k - 1),
        (false, true)  => trunc(k + 1),
        _              => k,
    };
    (snd, k)
}
```

`k` is the counter box in the drawing, `go` is the $\ne 0$ block, and `snd` is the AND gate's output — the flit-valid that leaves the router, so it is deliberately `req && go` and never bare `req`, which is the last bullet above written as one line of code. The `match` is the 2-bit increment select: the fourth case, send *and* credit together, falls into `_ => k` and holds, so no adder sees both events at once. `k - 1` and `k + 1` widen to $W+1$ bits by Spade's growth rule and `trunc` returns them to $W$; that truncation is safe only because the gate guarantees $\kappa>0$ before a decrement and credit conservation guarantees $\kappa<B$ before an increment — remove the gate and `trunc` turns underflow into a full buffer. `b0` is a port rather than a constant so the depth is set at reset by link initialisation, and everything except `snd` is registered: synthesis will map the increment onto a carry chain and `go` onto an OR-reduce, and will likely retime `go` back across the register to compute it from `nxt` when the switch allocator's timing demands it.

**Related Notes**

- [[Virtual Channel Buffer]] – depends-on: the $B$-slot buffer whose free-slot count $\kappa$ is a delayed mirror of.
- [[Synchronous Counters]] – depends-on: the up/down counter that the $\kappa^{+}=\kappa-s+c$ recurrence is built from.
- [[Bundled-Data Handshake Link]] – compares: req/ack achieves the same losslessness with no counter at all, but stalls for the full round trip on every transfer — credits are what keeps $\eta=1$ once $t_{crt}>1$.
- [[Wormhole Flow Control]] – supports: the scheme whose buffer floor this note supplies, $B\ge t_{crt}$ rather than $B\ge L$.
- [[Virtual Cut-Through Flow Control]] – compares: same counter, decremented by $L$ at the head flit instead of by one per flit.
- [[Store-and-Forward Flow Control]] – compares: the packet-granular extreme, where the credit loop is hidden inside a latency already $O(HL)$.
- [[Virtual-Channel Router]] – supports: the router that instantiates one of these per output VC and feeds `go` into switch allocation.
- [[Dual-Clock Asynchronous FIFO]] – counter-example: solves the same producer/consumer problem with Gray-coded pointer comparison, which is what credits must become at a clock-domain boundary.
- [[Choosing a Router Architecture]] – compares: where credit-based backpressure sits against on/off and ack/nack in a full router budget.

## References

- [[6.3) Network-On-Chip]] — §Flow control (the $t_{crt}$ decomposition, $\eta=\min(1,B/t_{crt})$, the $W=\lceil\log_2(B{+}1)\rceil$ up/down mirror counter and the on/off and ack/nack alternatives), §Worked example: a 4-flit packet under XY and wormhole (the cycle-by-cycle credit trace $\kappa_{CD}$ and the one-router-per-cycle stall propagation).
- No textbook source for this topic. Standard treatments: Dally & Towles, *Principles and Practices of Interconnection Networks* — flow-control taxonomy and the credit round-trip buffer bound; Wakerly, *Digital Design: Principles and Practices* — synchronous up/down counters and terminal-count gating; Weste & Harris, *CMOS VLSI Design* — the incrementer/decrementer and zero-detect structures the counter is built from. Page numbers are deliberately omitted; no copy was consulted while writing.
