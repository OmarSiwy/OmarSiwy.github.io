---
title: Deficit Round Robin Scheduler
description: "Per-VC quantum accumulator that transmits while the deficit covers a flit — weighted fair sharing to within one flit with one adder and one comparator per VC."
kind: circuit
source: "Long-form: Quality of service and virtual channels. Canon: Mano & Ciletti (counters, comparators); Weste & Harris (adder and comparator cost); Shreedhar & Varghese, deficit round robin; Dally & Towles (NoC allocation)."
status: seed
spade: simulated
tags: [digital, network-on-chip, qos, scheduler, fairness, arbiter, counter]
aliases:
  - DRR
  - Deficit Round Robin
  - Deficit Round-Robin
  - Deficit Counter
  - Deficit Round Robin Scheduling
  - Weighted Round Robin
  - WRR
  - Weighted Fair Sharing
---

# Deficit Round Robin Scheduler

A per-VC accumulator that converts a round-robin arbiter's fairness *in grants* into fairness *in transmitted bits*, by carrying the unspent fraction of each VC's quantum forward across rounds instead of discarding it.

```tikz title="One deficit-round-robin lane: quantum adder, flit-cost subtractor, deficit register and eligibility comparator feeding the round-robin arbiter"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- next-deficit candidates, stacked
  \draw (0.9,4.3) rectangle (2.5,5.1); \node at (1.7,4.7) {$0$};
  \draw (0.9,3.0) rectangle (2.5,3.8); \node at (1.7,3.4) {$D_i$};
  \draw (0.9,1.7) rectangle (2.5,2.5); \node at (1.7,2.1) {$D_i + Q_i$};
  \draw (0.9,0.4) rectangle (2.5,1.2); \node at (1.7,0.8) {$D_i - \ell$};

  % ---- multiplexer
  \draw (3.1,0.0) -- (3.8,0.5) -- (3.8,5.0) -- (3.1,5.5) -- cycle;
  \node[rotate=90] at (3.45,2.75) {MUX};
  \draw[->] (2.5,4.7) -- (3.1,4.7);
  \draw[->] (2.5,3.4) -- (3.1,3.4);
  \draw[->] (2.5,2.1) -- (3.1,2.1);
  \draw[->] (2.5,0.8) -- (3.1,0.8);
  \draw[->] (3.45,6.0) -- (3.45,5.25);
  \node[anchor=west] at (3.55,5.8) {sel: empty $\succ$ send $\succ$ round};

  % ---- deficit register
  \draw (4.6,2.25) rectangle (6.3,3.25);
  \node[align=center] at (5.45,2.75) {$D_i$ reg\\$d$ bits};
  \draw[->] (3.8,2.75) -- (4.6,2.75);
  \draw[->] (5.45,1.5) -- (5.45,2.25); \node[anchor=north] at (5.45,1.45) {clk};

  % ---- deficit out, tap for the feedback
  \draw (6.3,2.75) -- (7.8,2.75);
  \node[circ] at (7.0,2.75) {};
  \node[anchor=south] at (7.4,2.8) {$d$};

  % ---- comparator
  \draw (7.8,2.35) rectangle (9.2,3.15); \node at (8.5,2.75) {$\ge$};
  \draw[->] (9.2,2.75) -- (9.9,2.75);

  % ---- eligibility AND
  \draw (9.9,2.35) rectangle (10.7,3.15); \node at (10.3,2.75) {$\wedge$};
  \draw[->] (10.3,1.6) -- (10.3,2.35);
  \node[anchor=north] at (10.3,1.55) {nonempty};
  \draw[->] (10.7,2.75) -- (11.9,2.75);
  \node[anchor=south] at (11.3,2.8) {$r_i$};
  \draw[dashed] (11.9,2.05) rectangle (14.1,3.45);
  \node[align=center] at (13.0,2.75) {round-robin\\arbiter};

  % ---- flit cost bus, feeding both the subtractor and the comparator
  \draw (-0.5,-0.6) -- (8.5,-0.6);
  \node[anchor=east] at (-0.55,-0.6) {$\ell$: $d$};
  \node[circ] at (1.7,-0.6) {};
  \draw[->] (1.7,-0.6) -- (1.7,0.4);
  \draw[->] (8.5,-0.6) -- (8.5,2.35);

  % ---- quantum input
  \draw[->] (-0.5,1.9) -- (0.9,1.9);
  \node[anchor=south] at (0.15,2.0) {$Q_i$: $d$};

  % ---- deficit feedback to the three arithmetic candidates
  \draw (7.0,2.75) -- (7.0,6.6) -- (-1.1,6.6) -- (-1.1,0.8);
  \node[circ] at (-1.1,3.4) {};
  \node[circ] at (-1.1,2.35) {};
  \draw[->] (-1.1,3.4) -- (0.9,3.4);
  \draw[->] (-1.1,2.35) -- (0.9,2.35);
  \draw[->] (-1.1,0.8) -- (0.9,0.8);

  \node[anchor=west] at (4.6,-1.5) {one of $V$ identical lanes; the arbiter's pointer wrap is the round pulse};
\end{circuitikz}
\end{document}
```

**Name precisely what round-robin is fair about, because it is not bandwidth.** A [[Round-Robin Arbiter]] guarantees that a continuously-requesting VC waits at most $V-1$ grants. That bound is stated in *grants*, and a grant is not a fixed amount of traffic. Under [[Wormhole Flow Control]] a packet of $L$ flits that wins switch allocation holds the output channel for $L$ cycles, so over one sweep of the arbiter VC $i$ moves $L_i$ flits and VC $j$ moves $L_j$. The delivered share is

$$\text{share}_i \;=\; \frac{L_i}{\sum_j L_j}$$

which is proportional to packet length and completely outside the designer's control. A VC carrying 16-flit cache-line writebacks takes eight times the bandwidth of one carrying 2-flit coherence probes, on an arbiter that is behaving exactly as specified. Worse, the operator has no knob at all: to weight VC $i$ at twice VC $j$ you would have to let it into the arbiter twice per sweep, which is weighted round robin, and WRR reproduces the same defect one level up — it equalises *turns*, so it is only correct when every turn costs the same.

**Introduce a per-VC balance so a grant can be charged its true cost.** Give VC $i$ a **quantum** $Q_i$, a static configuration register expressed in flits (or in bits — the unit only has to be consistent across VCs), and a **deficit counter** $D_i$, a state register holding the credit that VC has accumulated but not yet spent. Let $\ell$ be the cost of the transfer at the head of the queue, one flit in a NoC. The scheduler runs on two events:

$$
\textbf{round pulse: } D_i \leftarrow D_i + Q_i,
\qquad
\textbf{grant taken: } D_i \leftarrow D_i - \ell,
\qquad
\textbf{queue empty: } D_i \leftarrow 0
$$

and VC $i$ is **eligible** — that is, allowed to raise its request line into the arbiter — only while

$$r_i \;=\; \text{nonempty}_i \;\wedge\; (D_i \ge \ell).$$

The arbiter is unchanged; only its request vector is masked. The round pulse is free because the arbiter already computes it: one round is one complete sweep of the round-robin pointer, so the pulse is the pointer's wrap-to-zero, and on a power-of-two $V$ that is the carry-out of the truncating pointer increment described in [[Round-Robin Arbiter]].

**The share falls out of one accounting identity, with no probability in it.** Consider a VC that stays backlogged across $m$ consecutive rounds. Every unit of credit that enters $D_i$ enters as a quantum and every unit that leaves does so by paying for a transfer, so summing the two update rules over the interval and telescoping gives

$$\ell \cdot \text{sent}_i(m) \;=\; m\,Q_i \;+\; D_i(0) \;-\; D_i(m).$$

The deficit is bounded on both sides. It is never negative, because the subtraction only fires on a grant and a grant only issues when $D_i \ge \ell$; and it is never $\ge \ell_{\max}$ at the end of a round, because the scheduler keeps transmitting from that VC while the deficit still covers a transfer, so a round ends only when $D_i < \ell$. Substituting $0 \le D_i < \ell_{\max}$ into the identity gives the error bound directly:

$$\Big|\, \ell\cdot\text{sent}_i(m) - m\,Q_i \,\Big| \;<\; \ell_{\max}$$

— a *constant*, independent of $m$. Divide by $m$ and the transient vanishes: the long-run share converges to $Q_i / \sum_j Q_j$, and the deviation at any finite horizon is at most one maximum-size transfer. In a NoC all flits are the same size, so $\ell_{\max} = \ell = 1$ flit and the bound is literally one flit — which is the long-form note's "accurate to within a flit", now with its proof attached rather than asserted.

> [!note]
> The bound is $O(1)$ in the *time horizon*, not merely $O(1)$ per flit. That is the whole reason a deficit counter beats any scheme that recomputes a share each round: an error that does not accumulate needs no correction machinery, so a $d$-bit register is a complete implementation of weighted fairness rather than an approximation of one.

**Zeroing the deficit on empty is not housekeeping — it is what keeps the bound true.** Drop that rule and an idle VC keeps collecting $Q_i$ every round. After $k$ idle rounds it holds $kQ_i$ of credit and, the moment a packet arrives, it transmits $kQ_i/\ell$ flits back to back while every other VC waits. The bound above breaks because the derivation assumed the VC was backlogged for the whole interval; credit earned while idle is credit for bandwidth the VC declined to use. The hardware cost of the fix is one more mux input, the constant $0$ in the diagram, selected by $\overline{\text{nonempty}_i}$ — and it takes priority over both arithmetic paths, which is what `sel: empty $\succ$ send $\succ$ round` in the drawing means.

**The $O(1)$-work claim carries a side condition: $Q_i \ge \ell_{\max}$.** A round in which the topped-up deficit still does not cover the head transfer produces no traffic from that VC, and the arbiter has spent a visit for nothing. With $Q_i \ge \ell_{\max}$ every visit to a backlogged VC transmits at least one transfer, so the number of arbiter visits per transfer is bounded by 1 and the scheduler does constant work per flit. With $Q_i < \ell_{\max}$ the ratio degrades to $\lceil \ell_{\max}/Q_i \rceil$ visits per transfer, and since a visit is a cycle of arbitration on a shared switch port, that is a direct throughput loss. In a uniform-flit NoC the condition is $Q_i \ge 1$, which is not a constraint at all — it is one of the few places where fixed-size flits make a networking algorithm strictly easier.

**Size the deficit register from the invariant, not from the quantum.** At the start of a round $D_i < \ell_{\max}$; the round pulse adds $Q_{\max}$; nothing else increases it. So the reachable maximum is $Q_{\max} + \ell_{\max} - 1$ and

$$d \;=\; \big\lceil \log_2 (Q_{\max} + \ell_{\max}) \big\rceil \text{ bits per VC.}$$

Underflow is impossible by construction — the subtraction is gated on the same comparison $D_i \ge \ell$ that produces $r_i$ — so both the adder and the subtractor may be *truncating* $d$-bit operators with no carry-out logic and no saturation, which is exactly what the `+.` and `-.` forms do in the RTL below. Per VC the whole scheduler is one $d$-bit adder, one $d$-bit subtractor, one $d$-bit [[Magnitude Comparator]], one $4{:}1$ $d$-bit mux and one $d$-bit register: $\Theta(d)$ area and, because carry-propagate addition and magnitude comparison are the same prefix problem, $\Theta(\log d)$ delay. Total across the port is $V$ copies, linear in $V$ where any real fair-queueing scheme (virtual clocks, WFQ) would need a sorted priority queue over $V$ timestamps.

**With fixed-size flits the arithmetic collapses, and this is the NoC-specific result.** Set $\ell = 1$. The subtractor becomes a decrement, the adder is unchanged, and the comparator $D_i \ge 1$ is just $D_i \neq 0$ — an $\text{OR}$ reduction of the $d$ bits, one level of an [[Magnitude Comparator]]'s prefix tree rather than the whole tree. What is left is a $d$-bit **up/down counter with a load-zero**, which is the cheapest sequential element in the library. The consequence for a NoC is that a variable-size deficit comparator is only worth building when a "grant" does not cost one flit: a serialised link that sends a flit over $w/w'$ cycles, a VC whose flits are compressed to variable width, or an energy budget rather than a bandwidth budget. Otherwise take the counter.

**Both operators are off the request-to-grant path, which is the reason this composes.** $D_i$ is a register output; it settled at the previous clock edge, so the comparison $D_i \ge \ell$ and the AND with $\text{nonempty}_i$ are one comparator delay ahead of the arbiter, in parallel with nothing else. The arbiter's own path — mask, prefix encode, mux — is untouched, and since that arbiter usually sets the router's clock period ([[Virtual-Channel Router]]), adding QoS weighting here costs *zero* cycle time. The update path $D_i \to \text{mux} \to D_i$ is a separate loop that must close in one cycle, and it carries one $d$-bit add: with $d \le 8$ that is far shorter than the arbiter path on an ASIC and effectively free on an FPGA, where a $d$-bit add and a $d$-bit compare both map onto the hard carry chain at roughly one LUT per two bits and one carry-chain delay total ([[FPGAs]]). The FPGA cost of a $V=4$, $d=6$ scheduler is dominated by the four $4{:}1$ six-bit muxes, not by the arithmetic — a 6-LUT is natively a $4{:}1$ mux, so that is $4 \times 6 = 24$ LUTs of muxing against roughly $4 \times 3$ carry-chain LUTs of arithmetic. Contrast the ASIC, where the ripple-carry form of the adder ([[RCA, Ripple-Carry Adder]]) is the right choice at these widths and the mux is the cheap part.

$$\boxed{\;\ell\cdot\text{sent}_i(m) \;=\; m\,Q_i + D_i(0) - D_i(m), \quad 0 \le D_i < \ell_{\max} \;\Longrightarrow\; \Big|\text{share}_i - \tfrac{Q_i}{\sum_j Q_j}\Big| \to 0,\ \ \text{error} < \ell_{\max}\;}$$

**Where it breaks.**

- **$Q_i < \ell_{\max}$.** Rounds pass with no transfer; work per flit becomes $\lceil \ell_{\max}/Q_i\rceil$ arbiter visits instead of $O(1)$. Fine-grained weight ratios therefore cost throughput, and the way out is to scale *all* quanta up until the smallest exceeds $\ell_{\max}$ — which widens $d$ by $\lceil\log_2 \rceil$ of the scaling factor.
- **Idle VCs.** Without the reset-on-empty the fairness bound is void and a returning VC bursts. Under [[Credit-Based Flow Control]] a VC can also be *nonempty but blocked* for lack of downstream credit; that is not "empty" and its deficit must be held, not cleared, or a repeatedly-blocked VC is permanently robbed.
- **Latency is not scheduled at all.** DRR allocates bandwidth; a VC with a small quantum still waits its turn and its worst-case latency is bounded only by the arbiter's $V-1$ sweep plus $\lceil\ell_{\max}/Q_i\rceil$ rounds. Real-time traffic needs [[TDM Slot Table Scheduler]], whose $(S-1)+H$ bound is hard, or the class separation of [[Priority Aging Arbiter]].
- **Fixed flits make it redundant.** With uniform $\ell$ and equal quanta DRR degenerates to plain round-robin; it earns its area only when quanta differ or when the charged cost varies.
- **Deficit is per-VC, not per-flow.** Several flows sharing a VC share one deficit counter, so DRR gives no isolation inside a VC. Splitting flows costs another [[Virtual Channel Buffer]], which is $Bw$ bits — vastly more than the $d$-bit counter, and the reason $V$ stays small.
- **Head-of-line blocking is untouched.** An eligible VC whose head flit cannot route still blocks its own queue; DRR decides *who* transmits, never *whether* a transmission can complete.

**RTL.**

```spade
entity drr_lane<#uint W>(
    clk: clock,
    rst: bool,
    q: uint<W>,
    cost: uint<W>,
    round: bool,
    nonempty: bool,
    send: bool,
) -> (bool, uint<{W + 1}>) {
    decl nxt;
    reg(clk) d: uint<{W + 1}> reset(rst: 0) = nxt;

    let c: uint<{W + 1}> = zext(cost);
    let qq: uint<{W + 1}> = zext(q);

    let eligible = nonempty && (d >= c);

    let after_round = if round { d +. qq } else { d };
    let after_send = if send { after_round -. c } else { after_round };
    let nxt = if nonempty { after_send } else { 0 };

    (eligible, d)
}
```

`d` is the deficit register of the diagram and `nxt` is the mux output; `after_round` and `after_send` are the two arithmetic mux inputs, chained rather than parallel so that a round pulse and a grant landing in the same cycle produce $D_i + Q_i - \ell$, and the outer `if nonempty` is the priority-zero input that flushes on empty. The width discipline is the invariant made structural: the register is $W+1$ bits while `q` and `cost` are $W$, which is $d = \lceil\log_2(Q_{\max}+\ell_{\max})\rceil$ for $Q_{\max}=\ell_{\max}=2^W-1$, and both operators are the truncating `+.` / `-.` forms because the plain `+` would widen to $W+2$ and the gating on `eligible` already rules out overflow and underflow. `decl nxt` forward-declares the next-state value so the register can be written above the logic feeding it — legal only because the loop is broken by a flop. Synthesis will not build four separate $d$-bit blocks: the mux collapses into the adder's operand select, so the lane costs one adder-width of carry chain, not two.

Verified with `.zettel/sim.sh` against an independent behavioural DRR reference: **3485 checks passed, 0 failures**. Named vectors include the asymmetric $Q=1,\ \ell=128$ case — the lane must stay ineligible for 127 rounds and become eligible on the 128th, which is the check that catches a comparator with the operands swapped — its mirror $Q=128,\ \ell=1$, and a deassertion of `nonempty` that must clear a deficit of 128 to zero. Six throughput runs of 17 to 40 rounds each assert the boxed identity end-to-end, checking $\text{sent} = \lfloor mQ/\ell \rfloor$ and the residual $D < \ell$ for $(Q,\ell) \in \{(1,1),(3,1),(5,3),(7,10),(2,7),(13,4)\}$, followed by 3000 random cycles of all six inputs. A mutant with `>=` weakened to `>` in the eligibility test — an off-by-one that compiles perfectly and passes any symmetric vector — fails this bench on the first round.

**Related notes.**

- [[Round-Robin Arbiter]] – extends: this is that arbiter with its request vector masked by a per-VC credit test; the arbiter itself is unmodified and its pointer wrap supplies the round pulse.
- [[Magnitude Comparator]] – depends-on: the $D_i \ge \ell$ test, which degenerates to a zero-detect OR tree once flits are fixed-size.
- [[RCA, Ripple-Carry Adder]] – depends-on: at $d \le 8$ bits the quantum accumulate and the flit-cost decrement are ripple-carry; a prefix adder buys nothing off the critical path.
- [[Priority Aging Arbiter]] – compares: bounds *latency* for a starving class with a per-VC age counter, where this bounds *bandwidth* with a per-VC credit counter — the same one-register-per-VC trick applied to the other axis.
- [[TDM Slot Table Scheduler]] – counter-example: gives a hard bandwidth *and* latency guarantee from a precomputed table, at the price of wasting unused reservations; DRR wastes nothing and guarantees only the long-run share.
- [[Wormhole Flow Control]] – supports: the variable channel occupancy $L$ per grant is the exact defect DRR corrects.
- [[Virtual Channel Buffer]] – depends-on: the `nonempty` input and the queue whose head transfer sets $\ell$.
- [[Credit-Based Flow Control]] – counter-example: a credit-starved VC is nonempty but unschedulable, and must not be treated as empty or its deficit is wrongly cleared.
- [[Virtual-Channel Router]] – supports: role 3 of virtual channels, traffic-class separation, is only a service *guarantee* once a scheduler like this one sits on the switch allocator.

## References

- Long-form note **6.3) Network-On-Chip**, § *Quality of service and virtual channels* — the three roles of virtual channels, the priority/aging and TDM alternatives, and the "$Q_i/\sum_j Q_j$ share with $O(1)$ work per flit, one adder and one comparator per VC, accurate to within a flit" statement that this note derives.
- Long-form note **6.3) Network-On-Chip**, § *Router microarchitecture* and § *FPGA mapping* — the arbiter's position on the critical path, and the LUT-arity argument reused here for the mux versus the carry chain.
- Shreedhar & Varghese, *Efficient Fair Queueing Using Deficit Round Robin* — the original algorithm, the reset-on-empty rule, and the $Q \ge \ell_{\max}$ condition for $O(1)$ work.
- Mano & Ciletti, *Digital Design* — up/down counters with synchronous load, and magnitude comparators.
- Weste & Harris, *CMOS VLSI Design* — adder and comparator as the same prefix problem, and the $\Theta(\log d)$ delay claim.
- Dally & Towles, *Principles and Practices of Interconnection Networks* — allocation, quality of service, and the interaction of scheduling with wormhole channel occupancy.

> [!warning] No book source, and no synthesis numbers
> This circuit is outside *Application-Specific Arithmetic*. Every area and delay
> statement above is a structural count — gate levels, LUT counts inferred from
> LUT arity, register widths — and **none of it has been backed by a synthesis
> run** in any named technology or FPGA family. Treat the "$24$ LUTs of muxing"
> figure as an arithmetic estimate, not a measurement.

> [!warning] The published relative-fairness constant is not reproduced here
> The bound derived above, $|\ell\cdot\text{sent}_i - mQ_i| < \ell_{\max}$, is the
> one that follows from the update rules and is the one the long-form note
> asserts. The literature also quotes a *relative* fairness bound between two
> backlogged flows as a small multiple of the maximum quantum; that constant is
> not in the available sources and is deliberately not stated. Needs outside
> research before it is quoted.
