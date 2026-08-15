---
title: "Separable Input-First Allocator"
description: "p input arbiters of V:1 followed by p output arbiters of p:1 — switch allocation in O(log V + log p) delay, accepting a worse matching than a full allocator."
kind: circuit
source: "No book source; Dally & Towles, *Principles and Practices of Interconnection Networks*, ch. 19"
status: seed
spade: simulated
tags: [digital, network-on-chip, allocator, arbiter, crossbar, fpga]
aliases:
  - Separable Allocator
  - Input-First Allocator
  - Input-First Separable Allocator
  - Separable Input-First Allocation
  - Separable Switch Allocator
  - iSLIP
---

# Separable Input-First Allocator

Switch allocation factored into two independent stages of one-hot arbitration — one winner per input port, then one winner per output port — which is the only common allocator whose delay grows with the *logarithm of each dimension separately* rather than with the size of the matching problem.

```tikz title="Separable input-first switch allocator: p input arbiters of V:1 feeding p output arbiters of p:1, with grant feedback"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small,
  blk/.style={draw,thick,minimum width=2.0cm,minimum height=0.8cm,align=center},
  band/.style={draw,thick,fill=black!5}]

% ---------- stage 1 : p input arbiters, V:1 each ----------
\node[blk] at (0.6,4.5) {in arb $0$\\$V{:}1$};
\node[blk] at (0.6,3.0) {in arb $1$\\$V{:}1$};
\node[blk] at (0.6,1.5) {in arb $2$\\$V{:}1$};
\node[blk] at (0.6,0.0) {in arb $3$\\$V{:}1$};

\foreach \y in {4.5,3.0,1.5,0.0}{
  \draw[->] (-1.7,\y) -- (-0.4,\y);
  \node[anchor=south,font=\scriptsize] at (-1.05,\y+0.03) {$V$};
}
\node[anchor=east,align=right,font=\scriptsize] at (-1.75,4.5)
  {VC $0..V{-}1$ of input $0$:\\ready $\wedge$ out-VC $\wedge$ credit};
\node[anchor=east,font=\scriptsize] at (-1.75,3.0) {input $1$};
\node[anchor=east,font=\scriptsize] at (-1.75,1.5) {input $2$};
\node[anchor=east,font=\scriptsize] at (-1.75,0.0) {input $3$};

% ---------- distribution : decode c_i to a one-hot column ----------
\node[band,minimum width=1.6cm,minimum height=5.6cm] at (4.8,2.25) {};
\node[rotate=90,align=center,font=\scriptsize] at (4.8,2.25)
  {decode $c_i$ to one-hot\\$p\times p$ request matrix $R'$};

\foreach \y in {4.5,3.0,1.5,0.0}{
  \draw[->] (1.6,\y) -- (4.0,\y);
  \draw[->] (5.6,\y) -- (6.4,\y);
  \draw[->] (8.4,\y) -- (9.3,\y);
}
\node[anchor=north,font=\scriptsize] at (2.8,4.42) {$1{+}\lceil\log_2 p\rceil$};
\node[anchor=north,font=\scriptsize] at (6.0,4.42) {$p$};
\node[anchor=south,font=\scriptsize] at (8.85,4.58) {$\lceil\log_2 p\rceil$};

% ---------- stage 2 : p output arbiters, p:1 each ----------
\node[blk] at (7.4,4.5) {out arb $0$\\$p{:}1$};
\node[blk] at (7.4,3.0) {out arb $1$\\$p{:}1$};
\node[blk] at (7.4,1.5) {out arb $2$\\$p{:}1$};
\node[blk] at (7.4,0.0) {out arb $3$\\$p{:}1$};

\node[anchor=west,align=left,font=\scriptsize] at (9.35,4.5) {to crossbar select};
\node[anchor=west,font=\scriptsize] at (9.35,3.0) {select};
\node[anchor=west,font=\scriptsize] at (9.35,1.5) {select};
\node[anchor=west,font=\scriptsize] at (9.35,0.0) {select};

% ---------- grant return : an input wins only if its output chose it back ----
\draw[dashed,->] (7.4,-0.4) -- (7.4,-1.25) -- (0.6,-1.25) -- (0.6,-0.4);
\node[anchor=north,align=center,font=\scriptsize] at (4.0,-1.4)
  {$p$ grants back: $g_i = a_i \wedge [\,\mathrm{oarb}_{c_i}\!=\!i\,]$,\\which also steps the round-robin pointers};

% ---------- delay annotation ----------
\draw[|<->|] (-0.4,5.35) -- (1.6,5.35);
\node[anchor=south,font=\scriptsize] at (0.6,5.38) {$\lceil\log_2 V\rceil$};
\draw[|<->|] (6.4,5.35) -- (8.4,5.35);
\node[anchor=south,font=\scriptsize] at (7.4,5.38) {$\lceil\log_2 p\rceil$};
\node[anchor=west,font=\scriptsize] at (8.6,5.38) {prefix-tree depth};

\end{circuitikz}
\end{document}
```

*Own construction, drawn for $p=4$; the two stages and the grant return are exactly the RTL below.*

**Fix the object being allocated.** A [[Virtual-Channel Router]] has $p$ input ports, each holding $V$ [[Virtual Channel Buffer|virtual-channel buffers]], and one $p\times p$ [[Crossbar Switch]]. In the SA stage every input VC that is *eligible* — it holds a flit, VC allocation already gave it an output VC, and [[Credit-Based Flow Control]] says a credit is available downstream — requests exactly one output port, the one its route computation fixed. The request set is therefore a matrix $R\in\{0,1\}^{pV\times p}$, $p^2V$ bits wide, with **at most one $1$ per row**. A legal crossbar configuration is a matching in that bipartite graph, subject to two constraints of different arity:

- *column-like*: at most one grant per output port $o$, because output $o$ has one link;
- *row-block*: at most one grant per input **port** $i$ — not per input VC — because port $i$ drives one crossbar input line, and its $V$ VCs share it.

The answer is $p$ crossbar select fields of $\lceil\log_2 p\rceil$ bits each, plus $p$ VC-select fields of $\lceil\log_2 V\rceil$ bits telling each input port's read mux which buffer to drain.

**Rule out solving the matching exactly.** Maximum bipartite matching admits no bounded-depth combinational form: the augmenting-path argument that proves a matching maximum is inherently sequential, since accepting one edge can force an arbitrary chain of reassignments elsewhere. Every exact allocator therefore has a delay that scales with the *size* of the problem — the [[Wavefront Allocator]] makes this explicit, propagating a priority wave of length $2p-1$ diagonally across a $pV\times p$ cell array. SA runs **every cycle for every flit**, unlike VA which runs once per packet, so it sits on the router's critical path; a delay linear in $p$ is spent from the wrong budget.

**Separate the constraints because their index sets are disjoint.** The two constraints act on rows and on columns, which share no index, so they can be imposed one after the other instead of jointly. *Input-first* imposes the row-block constraint first: for each input port $i$, a $V{:}1$ arbiter over the $V$ eligible VCs elects one survivor, giving a valid bit $a_i$ and its destination $c_i\in\{0,\dots,p-1\}$, $\lceil\log_2 p\rceil$ bits. Decoding each $c_i$ to a one-hot row collapses $R$ into a much smaller matrix $R'\in\{0,1\}^{p\times p}$, again with at most one $1$ per row. Then $p$ output arbiters of $p{:}1$ impose the column constraint on $R'$. Writing $A_n$ for an $n{:}1$ one-hot arbiter,

$$G \;=\; A^{\text{out}}_{p:1}\!\left(\mathrm{dec}\left(A^{\text{in}}_{V:1}(R)\right)\right).$$

**Legality is compositional, and that is the whole point.** Stage 1 emits at most one grant per input port; stage 2 only *deletes* grants, never adds one, so the row-block constraint survives stage 2 untouched — by monotonicity of the conjunction $g_i = a_i \wedge [\,\text{output }c_i\text{ chose }i\,]$. Stage 2 emits at most one grant per output by construction of a one-hot arbiter. $G$ is therefore always a legal matching, with **no iteration, no convergence check and no possibility of an illegal configuration reaching the crossbar** — a decomposition of a constrained problem into two unconstrained ones, which is what buys the delay.

**The delay is additive, not multiplicative.** Each arbiter is a priority-encoder problem. A [[Fixed-Priority Arbiter]] over an $n$-bit request vector $r$ grants the lowest set bit, which is the two's-complement identity

$$g \;=\; r \wedge (-r) \;=\; r \wedge (\overline{r}+1),$$

an increment and therefore a carry chain; by associativity of the prefix-OR that chain reassociates into a tree, writing $h_i=\bigvee_{j<i}r_j$ and $g_i = r_i\wedge\overline{h_i}$, and the depth drops from $n$ to $\lceil\log_2 n\rceil$ ([[Adders]], [[Combinational Logic]]). A [[Round-Robin Arbiter]] is two such trees, an $n$-bit mux and a $\lceil\log_2 n\rceil$-bit pointer flop. The two stages are in series and their sizes are independent, so

$$t_{\mathrm{SA}} \;=\; \Theta(\log V) + \Theta(\log p) \;=\; \Theta(\log V + \log p),$$

against $\Theta(p)$ for a wavefront array over the same request set. With $p=5$, $V=4$ that is roughly $2+3=5$ gate levels plus the decoder, and it is the reason a virtual-channel router closes timing at all.

**Pay for it in matching quality.** Stage 1 chooses a survivor per input port **without knowing anything about output contention**, so it discards requests that stage 2 would have been glad to have. Take $p=2$, $V=2$: input $0$ holds VC$_0\to$ out$_0$ and VC$_1\to$ out$_1$; input $1$ holds only VC$_0\to$ out$_0$. The maximum matching has size $2$ ($0\to$ out$_1$, $1\to$ out$_0$). Input-first with lowest-index priority elects VC$_0$ at input $0$, both survivors collide on out$_0$, input $0$ wins it, input $1$ gets nothing and out$_1$ sits idle: **half the crossbar wasted for a cycle**, and the edge that would have filled it was thrown away one stage earlier. Worse, once round-robin pointers are in play — and they must be, for fairness — the same vector can leave out$_0$ granting input $1$, and then input $0$ is unmatched, out$_1$ is unmatched, and input $0$ *did* request out$_1$: the result is **not even a maximal matching**, let alone a maximum one.

> [!important] Step the pointer only on an accepted grant
> A round-robin arbiter in stage 2 that advances its pointer whenever it *issues* a grant — rather than when that grant survives to become a crossbar configuration — keeps all $p$ output pointers moving in lockstep, and synchronised pointers make every output pick the same input every cycle. Updating only on acceptance lets the pointers **desynchronise**, and that one detail is what takes a single-iteration separable allocator from roughly $1-1/e\approx63\%$ of the crossbar under uniform traffic to $100\%$ (McKeown's iSLIP). The RTL below is fixed-priority precisely to keep it acyclic and simulable; the pointer is the production change, and it is the only place the update discipline can go wrong.

**Iterate if the matching matters more than the clock.** Running the two stages $k$ times, masking off already-matched inputs and outputs between passes, converges to a maximal matching in at most $\min(pV,p)$ iterations and in practice in two or three. Each iteration costs a fresh $\Theta(\log V + \log p)$, so in an on-chip router — where SA is already the critical path and buffers are shallow — $k=1$ is the norm and $k=2$ is the ceiling. Iteration is the knob that continuously trades this allocator toward the wavefront one.

**Choose input-first over output-first on the size of $V$.** The dual factorisation, *output-first*, has $p$ arbiters of $pV{:}1$ elect a winner per output over the full request set, then $p$ arbiters of $p{:}1$ resolve the case where several outputs chose the same input port. Its delay is $\Theta(\log(pV)+\log p)$ — the same class — but its first stage is $p$ arbiters of $pV$ inputs rather than $p$ of $V$, which is $V\times$ the arbiter area, and it discards information about *input* conflicts instead of output conflicts. Neither dominates on throughput; input-first is standard on-chip because $V$ is small (2–8), which makes stage 1 nearly free.

**On FPGA the log-depth prefix tree is the wrong implementation.** A 6-input LUT computes any function of up to six inputs in one level, so a $V{:}1$ arbiter with $V\le6$ and a $p{:}1$ arbiter with $p\le6$ are each **one LUT per grant bit**, and the entire two-stage allocator for $p=5,V=4$ is about three LUT levels including the $\lceil\log_2 p\rceil\to p$ [[Decoders|decoder]] band — the asymptotics never engage ([[Lookup-Tables]]). Above that, the $r\wedge(\overline r+1)$ form maps directly onto the dedicated carry chain, one CARRY4/CARRY8 primitive, which beats a LUT-built prefix tree up to roughly 32–64 bits; on ASIC, where there is no hardened chain, the prefix tree wins from about $n=8$. The allocator's area is negligible either way: for the canonical $p=5$, $V=4$, $B=6$, $w=128$ router it is $5\times4{:}1$ plus $5\times5{:}1$ arbiters against $15{,}360$ bits of input buffer and $3{,}200$ crossbar crosspoints. **The allocators are small in area and large in delay** — the opposite of every other block in the router.

$$\boxed{\ G = A^{\text{out}}_{p:1}\!\left(\mathrm{dec}\left(A^{\text{in}}_{V:1}(R)\right)\right),\qquad t_{\mathrm{SA}} = \Theta(\log V + \log p),\qquad A_{\mathrm{SA}} = \Theta\!\left(p(V+p)\right)\ }$$

**When it breaks.**

- **The matching is not maximum, and under round-robin pointers not even maximal.** Sized-up example above. If the workload's offered load is near capacity and the traffic is adversarial rather than uniform, the lost throughput is real and a [[Wavefront Allocator]] takes over.
- **Starvation hides in the composition, not in either arbiter.** Each arbiter alone is starvation-free. But if an input pointer advances only on acceptance, a VC that wins stage 1 every cycle and loses stage 2 every cycle pins the pointer, and the *other* VCs at that port never run. The input arbiter must also see the grant, which is the dashed return path in the diagram.
- **$V=1$ deletes stage 1 entirely,** and with it the whole point: the allocator degenerates to $p$ output arbiters over one queue per port, and the head-of-line bound of $2-\sqrt2\approx0.586$ on input-queued throughput returns.
- **Large $p$ is limited by the crossbar first.** $\Theta(\log p)$ is still cheap at $p=16$ while $p^2w$ crosspoints are not, so radix growth stops for a reason that has nothing to do with this block.
- **Eligibility must include the credit.** A request that skips the credit check produces a grant into a full downstream buffer and the flit is dropped; the gating AND belongs in front of stage 1, not after stage 2.
- **[[Speculative Switch Allocation]] runs this before VA has answered,** so the "has an output VC" term of the eligibility conjunction is a guess and the grant may be squashed a stage later — legality of $G$ is unaffected, occupancy is not.

```spade
// V:1 input arbiter, V = 2: lowest-index ready VC wins.
fn inarb2(r0: bool, r1: bool) -> (bool, bool) {
    (r0 || r1, !r0 && r1)          // (any, sel) ; sel = index of the winning VC
}

// p:1 output arbiter, p = 4: lowest-index requesting input wins.
fn outarb4(q: [bool; 4]) -> (bool, uint<2>) {
    let g = q[0] || q[1] || q[2] || q[3];
    let s: uint<2> = if q[0] { 0 } else { if q[1] { 1 } else { if q[2] { 2 } else { 3 } } };
    (g, s)
}

// Separable input-first switch allocator, p = 4 ports, V = 2 VCs per port.
// req bit 2i+v          : VC v of input i is eligible (flit, output VC, credit)
// dst bits 2(2i+v) +: 2 : the output port that VC already routed to
// result bits 0..3      : per-input-port crossbar grant
// result bits 4..7      : per-input-port winning VC index
entity sa_if4x2(req: uint<8>, dst: uint<16>) -> uint<8> {
    let r = req.as_bits();
    let d = dst.as_bits();

    let d00: uint<2> = d[0..2].as_uint();
    let d01: uint<2> = d[2..4].as_uint();
    let d10: uint<2> = d[4..6].as_uint();
    let d11: uint<2> = d[6..8].as_uint();
    let d20: uint<2> = d[8..10].as_uint();
    let d21: uint<2> = d[10..12].as_uint();
    let d30: uint<2> = d[12..14].as_uint();
    let d31: uint<2> = d[14..16].as_uint();

    // ---- stage 1: p input arbiters, V:1 each. One survivor per input port.
    let (a0, s0) = inarb2(r[0], r[1]);
    let (a1, s1) = inarb2(r[2], r[3]);
    let (a2, s2) = inarb2(r[4], r[5]);
    let (a3, s3) = inarb2(r[6], r[7]);

    let c0 = if s0 { d01 } else { d00 };
    let c1 = if s1 { d11 } else { d10 };
    let c2 = if s2 { d21 } else { d20 };
    let c3 = if s3 { d31 } else { d30 };

    // ---- stage 2: p output arbiters, p:1 each, over the survivors only.
    let (go0, so0) = outarb4([a0 && c0 == 0, a1 && c1 == 0, a2 && c2 == 0, a3 && c3 == 0]);
    let (go1, so1) = outarb4([a0 && c0 == 1, a1 && c1 == 1, a2 && c2 == 1, a3 && c3 == 1]);
    let (go2, so2) = outarb4([a0 && c0 == 2, a1 && c1 == 2, a2 && c2 == 2, a3 && c3 == 2]);
    let (go3, so3) = outarb4([a0 && c0 == 3, a1 && c1 == 3, a2 && c2 == 3, a3 && c3 == 3]);

    // ---- an input is granted only if the output it asked for chose it back
    let g0 = a0 && match c0 { 0 => go0 && so0 == 0, 1 => go1 && so1 == 0,
                              2 => go2 && so2 == 0, _ => go3 && so3 == 0 };
    let g1 = a1 && match c1 { 0 => go0 && so0 == 1, 1 => go1 && so1 == 1,
                              2 => go2 && so2 == 1, _ => go3 && so3 == 1 };
    let g2 = a2 && match c2 { 0 => go0 && so0 == 2, 1 => go1 && so1 == 2,
                              2 => go2 && so2 == 2, _ => go3 && so3 == 2 };
    let g3 = a3 && match c3 { 0 => go0 && so0 == 3, 1 => go1 && so1 == 3,
                              2 => go2 && so2 == 3, _ => go3 && so3 == 3 };

    [g0, g1, g2, g3, s0, s1, s2, s3].as_uint()
}
```

`inarb2` is one "in arb" box and `outarb4` one "out arb" box; `c0..c3` are the $1+\lceil\log_2 p\rceil$ bit bundles crossing to the decode band, and the four `outarb4([...])` argument arrays *are* the columns of $R'$ — the decoder is written as the four `c == o` comparisons rather than as a separate block. The final `g0..g3` conjunctions are the dashed grant return: an input port is granted only when the output it asked for named it back, which is exactly the monotone deletion that preserves the row-block constraint. Everything is combinational — no `reg`, no `clk` port — because the fixed-priority form has no pointer; adding round-robin adds $p$ pointer registers and makes the block sequential, and only then does the accept-vs-issue update discipline of the callout become expressible. Synthesis will not build the `match` as a four-way mux of comparisons: it will merge the decode and the grant return into the same LUT level, which is why the FPGA depth is three levels and not the six the drawing suggests.

**Related Notes**

- [[Round-Robin Arbiter]] – depends-on: the $n{:}1$ primitive both stages are made of, and where the pointer-update discipline actually lives.
- [[Fixed-Priority Arbiter]] – depends-on: the $r\wedge(-r)$ priority encoder the RTL above instantiates, before fairness is added.
- [[Crossbar Switch]] – supports: consumes the $p$ select fields this allocator produces, one per output port.
- [[Wavefront Allocator]] – compares: solves the same matching in one pass and finds a better one, at $\Theta(p)$ instead of $\Theta(\log V+\log p)$.
- [[Virtual-Channel Router]] – depends-on: this is the SA stage of that pipeline, run once per flit rather than once per packet.
- [[Speculative Switch Allocation]] – extends: runs this block before VA has resolved, and squashes the grant if the guess was wrong.
- [[Virtual Channel Buffer]] – depends-on: the $V$ queues per port whose heads stage 1 arbitrates between.
- [[Credit-Based Flow Control]] – depends-on: supplies the credit term of the eligibility conjunction feeding stage 1.
- [[Choosing a Router Architecture]] – compares: where this allocator sits against every sibling in a full router budget.
- [[Priority Aging Arbiter]] – counter-example: when quality-of-service classes make round-robin's equal shares the wrong fairness, the stage-2 arbiter changes and the separable structure does not.
- [[Network-On-Chip]] – supports: the topic hub; SA is where the interconnect's clock period is decided.

## References

No book source. Written from standard interconnection-network and digital-design canon:

- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — allocators and arbiters, ch. 18–19: separable input-first and output-first allocation, the wavefront alternative, iterative allocation.
- N. McKeown, "The iSLIP Scheduling Algorithm for Input-Queued Switches", *IEEE/ACM Trans. Networking* 7(2):188–201, 1999 — round-robin pointer desynchronisation, update-on-accept, the $1-1/e$ single-iteration random-selection figure and the $100\%$ uniform-traffic result.
- Peh & Dally, "A Delay Model and Speculative Architecture for Pipelined Routers", *HPCA*, 2001 — SA on the critical path, and the speculative variant.
- Karol, Hluchyj & Morgan, "Input Versus Output Queueing on a Space-Division Packet Switch", *IEEE Trans. Comm.* 35(12), 1987 — the $2-\sqrt{2}$ head-of-line bound recovered at $V=1$.
- Weste & Harris, *CMOS VLSI Design*, ch. 11 — priority-encoder and prefix-tree structures, and the depth at which reassociation pays on ASIC.
- Long-form source: `6.3) Network-On-Chip.md`, § Router microarchitecture (SA stage, arbiter derivation, area table) and § FPGA mapping.
