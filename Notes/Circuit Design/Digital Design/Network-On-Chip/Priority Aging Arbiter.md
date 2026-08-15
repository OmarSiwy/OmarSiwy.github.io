---
title: Priority Aging Arbiter
description: "A saturating wait counter per VC added to the class priority before comparison — bounds starvation under fixed-priority QoS, at log2(P_max) bits per VC and a wider arbiter compare."
kind: circuit
source: "Long-form: 6.3) Network-On-Chip §Quality of service and virtual channels. Canon: Dally & Towles ch. 18-19; Mano & Ciletti (comparators, saturating counters). No book source."
status: seed
spade: simulated
tags: [digital, network-on-chip, arbiter, qos, starvation, counter, comparator]
aliases:
  - Aging Arbiter
  - Priority Aging
  - Aged Priority Arbiter
  - Weighted Priority Arbiter with Aging
  - Anti-Starvation Arbiter
---

# Priority Aging Arbiter

A fixed-priority arbiter whose comparison key is the class priority *plus* a per-requester saturating wait counter, which is the one change that converts unbounded starvation into a wait bounded by $\tau$ times the priority gap.

```tikz title="Priority aging arbiter: per-lane saturating age counter, class-priority adder, arg-max compare tree, and the accept-gated clear"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---------------- lane 0 ----------------
  \draw (1.7,4.6) rectangle (3.9,5.8);
  \node[align=center] at (2.8,5.2) {age ctr $0$\\$+1$ per $\tau$\\sat.\ at $P_{\max}$};
  \draw[->] (0.15,5.5) -- (1.7,5.5); \node[anchor=south] at (0.8,5.55) {$r_0$};
  \draw[->] (1.3,4.9) -- (1.7,4.9);
  \draw (4.7,4.7) rectangle (5.7,5.7); \node at (5.2,5.2) {$+$};
  \draw[->] (3.9,5.2) -- (4.7,5.2); \node[anchor=south] at (4.3,5.25) {$A$};
  \draw[->] (5.2,3.9) -- (5.2,4.7); \node[anchor=west] at (5.25,4.1) {$b_0$: $C$};
  \draw[->] (5.7,5.2) -- (6.7,5.2); \node[anchor=south] at (6.2,5.25) {$C{+}1$};

  % ---------------- lane 1 ----------------
  \draw (1.7,2.6) rectangle (3.9,3.8);
  \node[align=center] at (2.8,3.2) {age ctr $1$\\$+1$ per $\tau$\\sat.\ at $P_{\max}$};
  \draw[->] (0.15,3.5) -- (1.7,3.5); \node[anchor=south] at (0.8,3.55) {$r_1$};
  \draw[->] (1.3,2.9) -- (1.7,2.9);
  \node[circ] at (1.3,2.9) {};
  \draw (4.7,2.7) rectangle (5.7,3.7); \node at (5.2,3.2) {$+$};
  \draw[->] (3.9,3.2) -- (4.7,3.2); \node[anchor=south] at (4.3,3.25) {$A$};
  \draw[->] (5.2,1.9) -- (5.2,2.7); \node[anchor=west] at (5.25,2.1) {$b_1$: $C$};
  \draw[->] (5.7,3.2) -- (6.7,3.2); \node[anchor=south] at (6.2,3.25) {$C{+}1$};

  % ---------------- vertical dots ----------------
  \node at (2.8,1.9) {$\vdots$};

  % ---------------- lane V-1 ----------------
  \draw (1.7,-0.2) rectangle (3.9,1.0);
  \node[align=center] at (2.8,0.4) {age ctr $V\!-\!1$\\$+1$ per $\tau$\\sat.\ at $P_{\max}$};
  \draw[->] (0.15,0.7) -- (1.7,0.7); \node[anchor=south] at (0.7,0.75) {$r_{V-1}$};
  \draw[->] (1.3,0.1) -- (1.7,0.1);
  \node[circ] at (1.3,0.1) {};
  \draw (4.7,-0.1) rectangle (5.7,0.9); \node at (5.2,0.4) {$+$};
  \draw[->] (3.9,0.4) -- (4.7,0.4); \node[anchor=south] at (4.3,0.45) {$A$};
  \draw[->] (5.2,-0.9) -- (5.2,-0.1); \node[anchor=west] at (5.25,-0.7) {$b_{V-1}$: $C$};
  \draw[->] (5.7,0.4) -- (6.7,0.4); \node[anchor=south] at (6.2,0.45) {$C{+}1$};

  % ---------------- arg-max tree ----------------
  \draw (6.7,-0.6) rectangle (8.5,6.2);
  \node[rotate=90, align=center] at (7.6,2.8)
    {arg-max tree\\$\lceil\log_2 V\rceil$ compare levels\\ties break to low index};

  % ---------------- grant out ----------------
  \draw[->] (8.5,2.8) -- (11.2,2.8);
  \node[anchor=south, align=center] at (10.0,2.9)
    {grant: $\lceil\log_2 V\rceil$ bits\\$+$ valid};
  \node[circ] at (9.9,2.8) {};

  % ---------------- clear feedback ----------------
  \draw (9.9,2.8) -- (9.9,-2.3) -- (6.6,-2.3);
  \draw (4.4,-2.7) rectangle (6.6,-1.9);
  \node[align=center] at (5.5,-2.3) {$1{:}V$ decode\\$\wedge$ accept};
  \draw[->] (4.4,-2.3) -- (1.3,-2.3) -- (1.3,4.9);
  \node[anchor=south] at (2.8,-2.25) {clear};
\end{circuitikz}
\end{document}
```

**Name exactly what fixed priority guarantees, because that is what aging must not destroy.** Give each traffic class its own virtual channel and make the switch arbiter fixed-priority across classes, round-robin within. The guarantee this buys is a *head-of-line* one: a high-priority flit never queues behind a low-priority flit, because the low-priority flit sits in a different buffer and loses every comparison it enters. That is the entire point of role 3 of virtual channels — traffic-class separation — and it is why a [[Round-Robin Arbiter]] alone cannot provide quality of service: round-robin equalises turns by construction, so it has no way to express "this class matters more". The defect is the dual of the guarantee. With $b_i$ the constant class priority of requester $i$, the grant is $\arg\max_i b_i$ over asserted requests, and if a higher class asserts continuously the lower class waits forever. Nothing is broken; the priority order is simply a constant, and a constant has no memory of who has been waiting.

**Make waiting itself a number the comparator can see.** Attach to each of the $V$ requesters a counter $t_i$ of the cycles it has been asserting without being granted, and define the *effective* priority as the class base plus a quantised, clamped function of that wait:

$$\pi_i \;=\; b_i \;+\; \min\!\Big(P_{\max},\ \Big\lfloor \frac{t_i}{\tau} \Big\rfloor\Big)$$

with $b_i$ carried in $C$ bits, the age term $a_i = \min(P_{\max},\lfloor t_i/\tau\rfloor)$ in $A = \lceil\log_2 (P_{\max}+1)\rceil$ bits, and the sum $\pi_i$ in $\max(A,C)+1$ bits — the $+1$ is the ordinary carry-out growth of an unsigned add, not a design choice ([[Number Formats]]). The arbiter is then $g = \arg\max_i \pi_i$ over asserted requests. Two of the three pieces are worth naming individually, because each fixes a distinct failure.

**The floor by $\tau$ is a prescaler, and it decouples counter width from the starvation bound.** Incrementing $a_i$ once per cycle makes $A$ grow like $\log_2$ of the tolerable wait; incrementing once per $\tau$ cycles makes the *same* $A$ cover $\tau$ times the wait. Since $\tau$ is chosen as a power of two, $\lfloor t_i/\tau\rfloor$ is a right shift, so the divider is free: you do not build a counter of $t_i$ and then divide, you build a $\log_2\tau$-bit free-running prescaler shared across all $V$ lanes and gate the $A$-bit age counters with its terminal count ([[Counters]]). Sharing the prescaler is what keeps the per-lane cost at $A$ flops rather than $A + \log_2\tau$.

**The clamp at $P_{\max}$ is what makes the priority function monotone, and monotonicity is the whole proof.** A wrapping $A$-bit counter would take a requester that has waited $2^A$ ticks and hand it an age of $0$ — a priority *inversion* precisely at the moment the requester most deserves service, and one that repeats with period $2^A\tau$, so the starved lane never accumulates. Saturating instead means $a_i$ is non-decreasing in $t_i$, so $\pi_i$ is non-decreasing in $t_i$, and a requester's standing against a fixed rival can only improve while it waits. Saturation is one AND-reduce of the counter's own bits used as an increment enable: hold when $a_i = 2^A - 1$. On the drawing that is entirely inside the age-counter box; in silicon it is one $A$-input AND, off the arbiter's request-to-grant path because it feeds only the counter's own enable.

**Now the bound.** Let requester $i$ contend against a rival $j$ that is being granted continuously, so $a_j$ is pinned at $0$ and $\pi_j = b_j$. Write the priority gap $\Delta = b_j - b_i \ge 0$. Requester $i$ wins the comparison as soon as $b_i + a_i \ge b_j$, i.e. as soon as $a_i \ge \Delta$, provided the tie at equality is broken *towards* $i$; with a strict $>$ comparison the threshold is $a_i \ge \Delta + 1$ instead. The age reaches $\Delta$ after $\tau\Delta$ cycles of waiting, so

$$t_i^{\text{wait}} \;\le\; \tau\,\Delta \;+\; O(1)\qquad\text{provided}\qquad P_{\max} \;\ge\; \Delta .$$

The proviso is not decoration. If $P_{\max} < \Delta$ the age saturates below the gap, $\pi_i$ stops growing strictly below $\pi_j$, and the arbiter is back to plain fixed priority with a wasted counter per lane. The design rule that follows is a single inequality: $P_{\max}$ must be at least the largest class-priority difference the arbiter can ever see, so $A \ge \lceil\log_2(b_{\max}-b_{\min}+1)\rceil$, and $\tau$ is then set from the deadline, $\tau \le T_{\text{deadline}}/\Delta$.

> [!important]
> Aging does not weaken the fixed-priority guarantee, it time-limits it. Within any window shorter than $\tau\Delta$ the arbiter behaves *exactly* like [[Fixed-Priority Arbiter]] — the ages have not moved enough to change any comparison — so the high-priority class keeps its low-latency property on the timescale it cares about, and only pays it back on a timescale the low-priority class cares about. Choosing $\tau$ is choosing where that boundary sits.

**Clear on the accepted grant, not on the issued one.** The counter's reset condition is "this lane is not currently waiting", which decomposes into two cases: the request deasserted (nothing pending, age is meaningless) or the request was granted *and the grant stuck*. Those differ in a real router. Under [[Speculative Switch Allocation]] a switch grant is thrown away when the parallel VC allocation fails, and under [[Credit-Based Flow Control]] it is thrown away when no downstream credit is available. Clearing on the issued grant charges the lane for a turn it never got; if the misspeculation is correlated with the lane — and it is, because the same downstream congestion causes both — the lane's age is reset every time it nearly wins, and the bound above evaporates. Hence the `∧ accept` term in the decode block on the drawing: `clear_i = grant_valid ∧ accept ∧ (g = i)`.

**Cost, and where it lands relative to the siblings.** Per requester: $A$ flops, one $C$-bit adder that grows to $C+1$, plus the saturation AND. Shared: a $\log_2\tau$-bit prescaler, and an arg-max tree of $V-1$ nodes, each a $(C{+}1)$-bit [[Magnitude Comparator]] and a $(C{+}1)$-bit-plus-index mux, at depth $\lceil\log_2 V\rceil$. Compare that with a [[Fixed-Priority Arbiter]], whose entire body is a prefix-OR over *one-bit* requests: aging keeps the same $\Theta(\log V)$ depth but multiplies the width of every node in the tree by $C+1$, which is where the delay goes. Against a [[Round-Robin Arbiter]] the trade is different in kind — round-robin pays $\lceil\log_2 V\rceil$ pointer flops in total and gets a bound of $V-1$ *grants*; aging pays $VA$ flops and gets a bound in *cycles*, which is the currency a real-time class is specified in.

**On an FPGA the counters are free and the tree is not.** Each age counter is $A$ bits of the hard carry chain, which on a modern fabric is one LUT-and-carry cell per bit and does not consume routing; the $C$-bit priority adder is the same resource, so a lane costs roughly $A + C$ carry cells ([[FPGAs]]). The magnitude comparator is also a carry-chain structure — subtract and look at the borrow — so each tree node is a short chain, but the *tree* is $\lceil\log_2 V\rceil$ chains in series with routing between them, and FPGA routing delay dominates logic delay. That reverses the ASIC intuition: on an ASIC you attack the comparator width, on an FPGA you attack the tree depth, which for the $V = 4$ to $8$ an arbiter actually sees means flattening the tree into a single wide compare rather than deepening it. On an ASIC the natural optimisation is the opposite one, sharing the subtractor borrow chains across tree levels.

$$\boxed{\ \pi_i = b_i + \min\!\big(P_{\max},\lfloor t_i/\tau\rfloor\big),\quad g=\arg\max_i \pi_i,\qquad t_i^{\text{wait}} \le \tau\,\Delta \ \ \text{iff}\ \ P_{\max}\ge\Delta=b_{\max}-b_i\ }$$

**Where it stops working.**

- **$P_{\max} < \Delta$.** The saturated age cannot close the gap; the lane starves exactly as it did before, and the counters are pure area. This is the most common way the circuit is built wrong, because $P_{\max}$ is usually picked from "how long may a packet wait" and $\Delta$ from an unrelated QoS table.
- **$P_{\max} = \Delta$ with a strict comparison.** The age reaches the rival's priority but never exceeds it, so the outcome is decided entirely by the tie-break direction. Ties to the low index means a starved *high*-index lane never wins. The simulation below exercises exactly this case.
- **Grants that are withdrawn.** Clearing on issue rather than acceptance voids the bound, as above.
- **Equal bases within a class.** With all $b_i$ equal the arbiter degenerates to oldest-first, which is FIFO-fair in *grants* but not in *bytes*: under wormhole flow control a worm holds an output for $\lceil L/B\rceil$ cycles, so long packets take a proportionally larger share. [[Deficit Round Robin Scheduler]] is the fix for that axis.
- **Coarse $\tau$ makes ties common.** Many lanes sit at the same age between prescaler ticks, so within a tick the arbiter is fixed-priority by index. Fine for $V\le 8$; visible as index bias for larger $V$.
- **A statistical bound is not a hard bound.** $\tau\Delta$ holds against one rival class. It says nothing about a *reserved-bandwidth* guarantee — for that the contention has to be removed offline rather than resolved online, which is what [[TDM Slot Table Scheduler]] does.
- **Aging is not a deadlock fix.** It bounds waiting on an arbiter, not waiting on a channel-dependency cycle. A cyclic hold-and-wait among virtual channels is untouched by any amount of aging; see [[Dateline Virtual Channel Allocation]].

**RTL.**

```spade
/// Saturating age counter for one requester.
entity vc_age<#uint PW>(clk: clock, rst: bool, hold: bool, tick: bool) -> uint<PW> {
    reg(clk) age reset(rst: 0) =
        if !hold { 0 }
        else if tick && !age.as_bits().reduce_and() { trunc(age + 1) }
        else { age };
    age
}

/// Pairwise arg-max; ties keep the incumbent, so the lower index wins.
fn better(pa: uint<5>, ia: uint<2>, pb: uint<5>, ib: uint<2>) -> (uint<5>, uint<2>) {
    if pb > pa { (pb, ib) } else { (pa, ia) }
}

entity aging_arb4(clk: clock, rst: bool, tick: bool,
                  req: [bool; 4], base: [uint<4>; 4]) -> uint<3> {
    decl w0, w1, w2, w3;

    let a0 = inst vc_age::<4>(clk, rst, req[0] && !w0, tick);
    let a1 = inst vc_age::<4>(clk, rst, req[1] && !w1, tick);
    let a2 = inst vc_age::<4>(clk, rst, req[2] && !w2, tick);
    let a3 = inst vc_age::<4>(clk, rst, req[3] && !w3, tick);

    let p0: uint<5> = if req[0] { base[0] + a0 } else { 0 };
    let p1: uint<5> = if req[1] { base[1] + a1 } else { 0 };
    let p2: uint<5> = if req[2] { base[2] + a2 } else { 0 };
    let p3: uint<5> = if req[3] { base[3] + a3 } else { 0 };

    let (q01, i01) = better(p0, 0, p1, 1);
    let (q23, i23) = better(p2, 2, p3, 3);
    let (_,   g)   = better(q01, i01, q23, i23);

    let any = req[0] || req[1] || req[2] || req[3];
    let w0 = any && g == 0;
    let w1 = any && g == 1;
    let w2 = any && g == 2;
    let w3 = any && g == 3;

    any.as_uint().concat(g)
}
```

$V=4$, $A=C=4$, so $\pi_i$ is `uint<5>` — that is the `base[i] + a_i` widening rule, $4+4\to5$ bits, and it is the $C{+}1$ label on every adder-to-tree wire in the drawing. The two `better` calls at the same level are the tree's first compare level and the third is its second, matching the $\lceil\log_2 4\rceil = 2$ levels drawn; `if pb > pa` is strict, which is what breaks ties to the lower index. `decl w0..w3` forward-declares the win flags so each `vc_age` can be instantiated with `hold = req && !won` before `won` exists textually — legal because the loop is broken by the counter's own register, and the counters are the only clocked state in the block. `tick` is the shared prescaler's terminal count, so the `τ` divider is an input here rather than logic. Synthesis will not build the drawing's separate `1:V decode` block: with $V=4$ the decoder collapses into the four two-bit comparisons `g == k` shown, and it will also merge `req[i] &&` into the counter's enable rather than its clear.

Verified with `.zettel/sim.sh` against a behavioural reference that re-implements the saturating counters and the arg-max independently: **3063 checks passed, 0 failures.** Beyond 3000 random `$random` vectors on `req`, `base` and `tick`, the named cases are the asymmetric starvation vector — `base = (0,·,·,8)`, `req = 1001`, ticking, where lane 0 must first win at age exactly $8 = \Delta$ and not one cycle earlier — and the saturation vector `base = (·,15,0,·)`, `req = 0110`, where the starved lane is the *higher* index, its age parks at $15$, the comparison only ever ties, and the tie-break to the low index means it must lose all $40$ cycles. That second vector is the third bullet of "where it stops working" turned into an assertion; it is also the vector that caught two wrong hand-computed expectations before it caught anything about the RTL.

**Related notes.**

- [[Fixed-Priority Arbiter]] – extends: this is that circuit with a state-dependent term added to the comparison key; delete the age counters and it becomes that circuit exactly.
- [[Round-Robin Arbiter]] – compares: the other anti-starvation mechanism, bounding grants rather than cycles and unable to express class priority at all.
- [[Magnitude Comparator]] – depends-on: each of the $V-1$ arg-max tree nodes is one, at $(C{+}1)$ bits rather than the one bit a fixed-priority prefix node needs.
- [[Counters]] – depends-on: the per-lane saturating counter and the shared power-of-two prescaler that implements $\lfloor t/\tau\rfloor$.
- [[Deficit Round Robin Scheduler]] – compares: fair in transmitted bytes rather than in grants, which is the axis aging leaves untouched.
- [[TDM Slot Table Scheduler]] – counter-example: removes contention offline for a hard bandwidth guarantee, where aging only bounds an online wait.
- [[Speculative Switch Allocation]] – counter-example: issues grants that may be discarded, so the age clear must be gated on acceptance or the bound is void.
- [[Virtual Channel Buffer]] – supports: one age counter per VC, so $VA$ flops ride alongside the $VBw$ bits of buffer this arbiter selects among.
- [[Separable Input-First Allocator]] – supports: the $V{:}1$ and $p{:}1$ arbiter slots this drops into when the router needs QoS classes.
- [[Virtual-Channel Router]] – supports: role 3 of virtual channels, traffic-class separation, is only a service guarantee once this arbiter is the one doing the selection.

## References

- Long-form note **6.3) Network-On-Chip**, § *Quality of service and virtual channels* — the three roles of virtual channels, the priority/best-effort mechanism, and the aging formula $\text{prio} = \min(P_{\max},\lfloor t_{\text{wait}}/\tau\rfloor)$ added to the class priority, with its stated cost of $\lceil\log_2 P_{\max}\rceil$ bits per VC and a wider arbiter comparison.
- Dally & Towles, *Principles and Practices of Interconnection Networks*, chs. 18–19 — arbitration and allocation, priority arbiters, and the fairness taxonomy the starvation bound above sits in.
- Goossens, Dielissen & Rădulescu, "Æthereal Network on Chip", *IEEE Design & Test* 22(5), 2005 — the guaranteed-throughput alternative that aging is measured against.
- Mano & Ciletti, *Digital Design* — magnitude comparators, saturating and prescaled counters.

> [!warning] No book source, and no quantitative implementation data
> This circuit is outside *Application-Specific Arithmetic*; everything above is
> the long-form note plus standard interconnect canon. There is **no LUT count,
> no gate count in a named technology, and no delay figure** in any available
> source, and no published measurement of what $\tau$ and $P_{\max}$ real NoCs
> ship with. The cost statements here are structural counts ($A$ flops per lane,
> $V-1$ comparators, $\lceil\log_2 V\rceil$ levels) and the FPGA-versus-ASIC
> claims are resource-type arguments; none has been backed by a synthesis run.
> Needs outside research before any of it is quoted as a number.
