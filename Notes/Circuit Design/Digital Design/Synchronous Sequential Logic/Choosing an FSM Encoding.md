---
title: Choosing an FSM Encoding
description: "Trade-off table across the 13 Synchronous Sequential Logic circuits, with the source's own numbers — and the four constraints (composition, area, depth, iteration bound) that actually pick one."
kind: comparison
source: "0.4) Synchronous Sequential Logic §Trade-offs, §State assignment, §FPGA mapping, §Pipelining and retiming, §Worked example — no book source"
status: seed
spade: n/a
tags: [digital, synchronous-sequential-logic, comparison, fsm, encoding, fpga]
aliases:
  - Choosing an FSM Encoding
  - FSM Encoding
  - State Encoding Comparison
  - Moore vs Mealy
---

# Choosing an FSM Encoding

Sequential logic is exact, so the only currency is cycles, flops and LUT levels — and every choice below spends exactly one of those three to buy another.

| Circuit | What it decides | The source's numbers | Printed page |
| --- | --- | --- | --- |
| [[Canonical FSM Structure]] | where the critical path is | $T_c \ge t_{pcq} + t_{pd}^{\delta} + t_{\text{setup}} + t_{\text{skew}}$; $\lambda$ is **not** in the loop, so output depth costs 0 in $f_{\max}$ | — |
| [[Moore Machine]] | when the answer appears | 1 cycle after the triggering input; **5 states** on the 1011 detector; glitch window = $\lambda$'s transition after the edge, zero if $\lambda$ is a wire | — |
| [[Mealy Machine]] | same | same cycle; **4 states**; adds one $x\to\lambda\to z$ path that chains across cascaded machines; tracks every glitch on $x$ | — |
| [[State Transition Graph]] | whether it is a machine at all | $2^k$ outgoing edges required per state; a missing edge becomes an inferred latch; overlapping edges plus `parallel_case` desynchronise sim from silicon | — |
| [[Binary State Encoding]] | flop count | $s=\lceil\log_2 N\rceil$; at $N{=}4,k{=}1$: **2 flops, 2 LUT6, 1 LUT level**; fan-in $\lceil\log_2 N\rceil + k$; $\le N-1$ unused codes; Moore's $N{=}5$ needs 3 flops and leaves 3 dead codes | — |
| [[One-Hot State Encoding]] | $\delta$ depth | $s=N$; at $N{=}4,k{=}1$: **4 flops, 5 LUT6, 1 LUT level**; fan-in $=\text{indeg}(S)+k$, flat in $N$; crossover at $N\approx16$ for $k{=}2$; $2^N-N$ unused codes | — |
| [[Gray Code State Encoding]] | bits in flight per transition | $s=\lceil\log_2 N\rceil$, same width as binary; Hamming distance 1 per step, so at most **one bit metastable** at a crossing | — |
| [[Safe-State FSM Recovery]] | what happens after an upset | 4 escalating steps; the decoded one-hot check costs $O(N^2)$ pairwise terms; distance-3 codes cost extra flops and forfeit the don't-cares | — |
| [[FSMD Controller-Datapath Split]] | how big $N$ is allowed to get | an 8-bit accumulator is **1 register** as datapath, **256 states** as control; flattened $\lvert Q\rvert = N\prod_r 2^{w_r}$ | — |
| [[Pipeline Register Insertion]] | throughput of feed-forward logic | $p$ stages: $T_c \to T_c/p$, latency $\to p$ cycles, 1 result/cycle; applies to $\lambda$, **never** to $\delta$ | — |
| [[Retiming]] | whether moving registers can help | register count around any directed cycle conserved $\Rightarrow T_c \ge \max_\ell \frac{\sum_v t_{pd}(v)}{\#\text{reg}(\ell)}$; an FSM loop holds exactly **1** register, so the floor is the full delay of $\delta$ | — |
| [[C-Slow Retiming]] | the only way under that floor | bound drops $C\times$; flops $s \to Cs$; per-instance latency $K \to KC$ cycles; needs $C$ genuinely independent streams | — |
| [[1011 Sequence Detector]] | the whole argument, concretely | Mealy 4 states / Moore 5; binary 2 flops + 2 LUT6 vs one-hot 4 flops + 5 LUT6, both 1 level; Mealy fires cycles 4 and 7, Moore 5 and 8 | — |

**Every page cell is "—" because there is no book source.** This topic sits outside de Dinechin & Kumm; the long-form note was written from Mano & Ciletti ch. 5, Wakerly ch. 7, Weste & Harris ch. 10, and Leiserson–Saxe (1991), none of which supply per-figure page anchors here. The only absolute delay the source commits to is the FPGA one: a $\le 6$-input function is one LUT6 at roughly $0.1$–$0.3$ ns plus routing, and a 7-input function is two levels plus a route, which more than doubles it. No DSP-block count and no post-place-and-route $f_{\max}$ exists anywhere in the source — every LUT and flop figure above is a hand count off the 4-state worked example, not a tool report.

**Composition decides Moore vs Mealy, not latency.** The one-cycle difference is real but it is rarely what breaks a design; what breaks a design is where $z$ goes. A [[Moore Machine]] output is a combinational function of flop outputs alone, so it is a registered signal in all but name and may be wired straight into a write-enable, a clock-gate, an asynchronous FIFO, or another clock domain. A [[Mealy Machine]] output cannot, because it tracks every glitch on $x$ mid-cycle, and two cascaded Mealy machines share one combinational path across both — a ring of them has a combinational cycle and has left the synchronous discipline outright. So the rule is: Moore by default, and reach for Mealy only when the consumer is a flop *and* the cycle is genuinely on a critical loop — a ready/valid handshake, or a status flag feeding the next control decision in an [[FSMD Controller-Datapath Split]]. The two are equally expressive, so this is never an argument about what can be computed; it costs [[Moore Machine|Moore]] one extra state and one extra cycle on the [[1011 Sequence Detector]] and nothing else.

**Area and depth decide the encoding, and the two answers differ by target.** On ASIC a flop is real silicon and real clock-tree power, so $N$ flops against $\lceil\log_2 N\rceil$ is a bill you pay every cycle whether or not the state moves, while $\delta$'s extra fan-in costs a continuous fraction of a gate delay — pick [[Binary State Encoding]] and re-encode only if $\delta$ measures as the critical path. On FPGA the arithmetic reverses because a slice pairs each LUT with an otherwise-dead flop: binary's saving of $N - \lceil\log_2 N\rceil$ flops buys unused silicon, while depth is quantised in sixes, so the metric is $\lceil\text{fan-in}/6\rceil$ levels. Binary's fan-in $\lceil\log_2 N\rceil + k$ crosses 6 at about $N > 16$ for $k=2$; [[One-Hot State Encoding]]'s in-degree of 3–5 keeps even a 64-state machine at one level per bit, which is exactly why Vivado and Quartus default to one-hot and re-encode above a small state count. Below the crossover the argument is pure overhead — at $N=4$ binary wins outright on both counts — and [[Gray Code State Encoding]] enters on neither axis: it is the same width as binary and worth asking for only when the STG is chain-shaped, or when the state bus is sampled by an unrelated clock and you need the worst case to degrade from arbitrary corruption to one cycle of latency.

**Throughput decides which register transform is even legal.** [[Pipeline Register Insertion]] is the cheap answer and it only works on feed-forward logic: $p$ cuts give $T_c/p$ for $p$ cycles of latency, which covers the datapath and covers $\lambda$ — registering a Mealy output *is* the Moore machine, one cycle late. It does not cover $\delta$, because a register inside the $q\to\delta\to q$ loop builds a different machine rather than a faster one. [[Retiming]] proves that is not a failure of imagination: register count around every directed cycle is conserved, an FSM loop contains exactly one register, so no legal placement gets $T_c$ below the full delay of $\delta$. That leaves two genuinely different moves. Restructure $\delta$ — re-encode to one-hot, split the machine, precompute conditions a cycle early — or [[C-Slow Retiming]], which replaces every register with $C$ in series and interleaves $C$ independent problems, dropping the bound $C$-fold at $C\times$ the per-instance latency and $C\times$ the flops. C-slowing is the only thing on this list that gets under the $\delta$ floor, and it is worthless without $C$ real streams to feed it.

**State count is a design decision before it is an encoding decision.** Every number in the table scales in $N$, so the largest single lever is refusing to let $N$ grow: [[FSMD Controller-Datapath Split]] keeps wide data in registers and only the schedule in states, which is the difference between one 8-bit register and 256 states. [[State Transition Graph]] is where completeness and determinism get checked, and it is worth doing before encoding because a missing edge becomes an inferred latch that no encoding choice can fix afterwards. [[Safe-State FSM Recovery]] is the one cost that runs the other way from the FPGA encoding advice: one-hot's $2^N - N$ unused codes are nearly the whole space, synthesis absorbs them as don't-cares, and the decoded legality check that closes the hole costs $O(N^2)$ pairwise terms — so the encoding that is cheapest to run is the most expensive to make robust.

**Result.**

$$\boxed{\
\underbrace{\lceil\log_2 N\rceil + k > 6}_{\text{one-hot on FPGA}}
\quad\text{but}\quad
T_c \;\ge\; t_{pd}^{\delta}\ \text{ for every encoding, and only } C\text{-slowing divides it}
\ }$$

**When it breaks.**

- **$N \le 4$.** Both encodings fit in one LUT level; the table's 2-vs-4 flops and 2-vs-5 LUT6 are absolute counts too small to design around. Use whichever reads better.
- **Wide guards.** $k$ enters every fan-in additively, so a transition guarded by an 8-bit comparison exceeds a LUT6 on its own and no encoding rescues it — register the condition a cycle early instead.
- **Synthesis overrules you.** Vivado and Quartus re-encode any register they recognise as an FSM, so a hand-written Gray or one-hot assignment survives only with the encoding attribute set, and safe-state logic survives only with a `KEEP`/`fsm_safe_state` attribute. The RTL simulation will otherwise lie about all three.
- **The comparison assumes one clock.** Everything here rests on the synchronous discipline; a state bus crossing domains is a [[Gray Code State Encoding]] and synchroniser problem, not an encoding-cost problem.
- **A fixed-cycle contract.** C-slowing preserves behaviour per instance in instance-time, not in cycles, so any protocol with a specified latency must sit outside the C-slowed island.

**RTL (Spade).** None — this note compares circuits rather than describing one, and every structure in the table has its own compiled and simulated block in its own note.

**Related Notes (with context):**

- [[Canonical FSM Structure]] – depends-on: the three-block template whose $q\to\delta\to q$ loop is the quantity every row of the table is trying to shrink.
- [[Moore Machine]] – compares: the default output style, safe as an enable at one cycle and one state of cost.
- [[Mealy Machine]] – compares: the same machine answering a cycle earlier, paying with a combinational $x\to z$ path.
- [[State Transition Graph]] – depends-on: the representation the encoding is applied to, and where completeness is checked.
- [[Binary State Encoding]] – compares: minimum flops, fan-in growing as $\lceil\log_2 N\rceil + k$; the ASIC default.
- [[One-Hot State Encoding]] – compares: fan-in flat in $N$ at $N$ flops; the FPGA default above $N\approx16$.
- [[Gray Code State Encoding]] – compares: binary's width with one bit in flight, chosen for chains and clock-domain crossings only.
- [[Safe-State FSM Recovery]] – counter-example: the one axis on which one-hot's sparse code is the expensive choice.
- [[FSMD Controller-Datapath Split]] – supports: keeps $N$ small enough for any of this to matter.
- [[Pipeline Register Insertion]] – compares: buys $f_{\max}$ on feed-forward paths, and is exactly what $\delta$ forbids.
- [[Retiming]] – depends-on: the conservation argument that turns $t_{pd}^{\delta}$ into a hard floor.
- [[C-Slow Retiming]] – extends: the only transform that gets under that floor, at $C\times$ latency and $C\times$ flops.
- [[1011 Sequence Detector]] – supports: the worked machine every flop, LUT and state count in the table is counted from.
- [[Synchronous Sequential Logic]] – depends-on: the topic hub these thirteen notes were cut from.

## References

- [[0.4) Synchronous Sequential Logic]] — §Trade-offs (both trade-off tables: Moore/Mealy behaviour, and the binary-vs-one-hot counts at $N=4$, $k=1$), §State assignment (widths, fan-in expressions), §FPGA mapping (LUT6 timing, the $N\approx16$ crossover, free slice flops), §Unreachable and unused states (code-space counts, the four recovery steps), §Datapath plus control (the 256-state accumulator), §Pipelining and retiming (the iteration bound, $C$-slowing), §Worked example: overlapping 1011 detector (state counts, flop and LUT counts, the cycle trace).
- No book source. The long-form note's own canon: Mano & Ciletti, *Digital Design*, ch. 5 and 5.7–5.9; Wakerly, *Digital Design*, ch. 7; Weste & Harris, *CMOS VLSI Design*, ch. 10 and 1.4; Leiserson & Saxe, "Retiming Synchronous Circuitry", *Algorithmica* 6 (1991). No printed page numbers are available for any figure in this topic.
