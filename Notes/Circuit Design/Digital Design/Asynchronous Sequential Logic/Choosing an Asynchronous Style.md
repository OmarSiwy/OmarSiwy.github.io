---
title: Choosing an Asynchronous Style
description: "Trade-off table across the 15 Asynchronous Sequential Logic circuits, with the source's own numbers — and the four constraints that actually decide between them."
kind: comparison
source: "0.5) Asynchronous Sequential Logic §Trade-offs — no book source"
status: seed
spade: n/a
tags: [digital, asynchronous-sequential-logic, comparison]
aliases:
  - Choosing an Asynchronous Style
  - Asynchronous Style Comparison
  - Async Style Trade-offs
  - Choosing an Async Style
---

# Choosing an Asynchronous Style

Fifteen structures that all buy the same thing — sequencing without a clock — ranked by the four constraints that actually pick between them: whether the target is FPGA or ASIC, whether wire or logic dominates, whether a delay line can track the datapath, and whether anything has to arbitrate.

> [!warning] No printed pages exist for this topic
> The brief for this note asks for the printed page behind every number. This topic has **no assigned book source** — see the long-form note's own `[!warning]` under §Trade-offs — so the provenance column names the *section of the long-form note or the sibling note* the figure was derived in, and every figure below is either a counting argument, an inequality, or a simulation count from a sibling's own testbench. No measured LUT counts, gate delays, energies or cycle times are available anywhere in this topic, so every cell that would hold one holds `—`.

| Structure | Area / wire cost | Time cost | FPGA | provenance |
| --- | --- | --- | --- | --- |
| [[Huffman Feedback Model]] | $s \ge \lceil\log_2 k\rceil$ feedback variables for $k$ flow-table rows — a floor, usually not achievable | one $\Delta_i$ per state change, arrival **order unknown** | combinational loop; STA cannot traverse it | §The feedback model |
| [[Race-Free State Assignment]] | one extra secondary variable doubles the excitation table's rows, adds an $(s{+}1)$-th feedback wire, widens **every** product term | none — the transition is 1 bit, so $\lvert D\rvert = 1$ | ships only in its clocked form | §Races and critical races |
| [[Asynchronous Cycle]] | **zero** extra logic — same LUT count, same cell count, only different entries at spare codes | $j$ spare codes $\Rightarrow (j{+}1)\Delta$ on that transition; a $k$-step cycle widens the input-separation spec to $k\Delta$ | same loop problem, and $\Delta$ is routing-dominated | Asynchronous Cycle |
| [[Muller C-Element]] | $2n+4$ transistors for $n$ inputs, against roughly **3×** that for the two-level SOP network | — | **1 LUT3** plus one feedback route | Muller C-Element |
| [[Muller Pipeline]] | 1 LUT + 1 loop per stage | $2N$ stages hold at most $N$ tokens — **half the stages are bubbles** at peak throughput | loop plus a consensus term the optimiser deletes | §Handshaking protocols |
| [[Micropipeline]] | capture-pass latch is **not in any standard cell library** | same $2N$-per-$N$ bound, unchanged by two-phase | no double-edge-triggered flop in the fabric; DDR lives in the I/O ring only | Micropipeline |
| [[Bundled-Data Interface]] | $k + 2$ wires | $t_d \ge t_{pd,\max} + t_{\text{setup}}$ — the synchronous number, made local | the **only** style that maps at all | §Handshaking protocols |
| [[Four-Phase Handshake]] | latch control is one wire | **4** transitions/datum; $T_{\text{cycle}} = 2(t_f + t_r)$, latency $t_f$; peak $1/(4t_{\text{link}})$ | — | Four-Phase Handshake |
| [[Two-Phase Handshake]] | event-sensitive storage, "materially larger" — no figure | **2** transitions/datum, $E_{\text{2ph}} = \tfrac12 E_{\text{4ph}}$; peak $1/(2t_{\text{link}})$ | survives only as the 1-bit toggle synchroniser | Two-Phase Handshake |
| [[Dual-Rail Encoding]] | $2k$ wires, $\tfrac12$ bit/wire; **2 LUTs per bit** against 1; DIMS block is $2^n$ minterms | **4×** the transitions of single-rail under uniform random data, and data-independent | 2 LUTs/bit combinationally, C-elements in four-phase | §Handshaking protocols |
| [[1-of-4 Encoding]] | 4 wires per 2 bits — $R(4) = R(2) = \tfrac12$, identical to dual-rail; $R(8) = \tfrac38$ stops paying | $T(4) = \tfrac12 T(2)$: **2 edges/symbol vs 4** — measured 2000 edges against dual-rail's 4000 over 1000 symbols | leaf saving vanishes: both detectors are one 6-LUT | 1-of-4 Encoding |
| [[Completion Detection Tree]] | 32-bit word on 6-LUTs: **14 LUTs, 3 logic levels** | $T_{\text{det}} = t_{\vee} + \lceil\log_r k\rceil\,t_{\wedge}$, on the critical path | $r = 6$; first level absorbs 3 whole rail pairs | Completion Detection Tree |
| [[Matched Delay Line]] | one delay chain per stage | $t_{\text{matched}} \ge t_{pd,\max}(f) + t_{\text{setup}}$; for essential hazards $\Delta_{\text{fb}} > \max_g t_{x_i \to g} - \min_g t_{x_i \to g}$ | not synthesisable — an inverter chain collapses to a wire | §Essential hazards |
| [[Mutual Exclusion Element]] | arbitrates exactly **2**; $n$ clients need $n-1$ elements at depth $\lceil\log_2 n\rceil$ | resolution $\propto e^{-t/\tau}$ — **unbounded**, never zero | no filter exists at any effort level; pay 2 fixed cycles and a finite MTBF instead | Mutual Exclusion Element |
| [[Asynchronous FIFO]] | pointer is $n{+}1$ bits for depth $2^n$; both flags are one $(n{+}1)$-bit equality comparator | 2 destination cycles each way, credit round trip **3–5 cycles of the slower clock** | the one structure that maps cleanly: BRAM + fabric flops | §FPGA mapping |

Every `—` above is a number the source does not have. There is no measured LUT count, gate delay, DSP-block count, energy or cycle time anywhere in this topic, and no printed page to cite one from; the entries that do carry digits are transistor counts from a CMOS schematic, LUT counts derived arithmetically from 6-LUT fan-in, transition counts from a protocol's own state diagram, and one simulation edge count from `1-of-4 Encoding`'s testbench. Treat the rest as orderings.

**FPGA is the first filter, and it eliminates most of the table before any trade-off is reached.** Four independent tool facts, all in §FPGA mapping, cut in the same direction: combinational loops are a first-class STA error, so the [[Huffman Feedback Model]], every [[Muller C-Element]] and therefore every [[Muller Pipeline]] and [[Micropipeline]] needs `ALLOW_COMBINATORIAL_LOOPS` plus `set_disable_timing`, after which the reported timing means nothing; the hazard-free cover is by construction non-minimal, so the optimiser deletes exactly the consensus term that was added, and you stop synthesising and instantiate a `LUT3` under `DONT_TOUCH`; delay elements collapse to a wire, so a [[Matched Delay Line]] survives only as a `CARRY4` chain with a location constraint; and isochronic forks are unenforceable, because routing delay dominates logic delay and is chosen by the router. That last one is decisive — QDI's single timing assumption is the one assumption FPGA routing will not honour. So on FPGA the answer is bundled data with a carry-chain delay and a `set_max_delay`, or it is the [[Asynchronous FIFO]] and nothing else from this topic. On ASIC every row of the table is buildable, the C-element is a standard cell, and the choice becomes a real engineering one.

**Wire versus logic decides two-phase against four-phase, and nothing else does.** The saving is exactly a factor of two in control-wire transitions — $2$ per datum against $4$, $E_{\text{2ph}} = \tfrac12 E_{\text{4ph}}$ — and it is a combinatorial fact, not a technology estimate, because both protocols walk the same $(\mathit{req},\mathit{ack})$ 4-cycle and [[Two-Phase Handshake]] simply delivers a datum every half lap. The cost is that abolishing the return-to-zero level forces event-sensitive storage, which is where the [[Micropipeline]]'s capture-pass latch comes from and why it is not in a standard cell library. Both terms scale with wire length and neither scales with $k$, so the crossover is geometric: take two-phase on long chip-crossing or inter-router links where one handshake round trip costs more than an extra latch, take [[Four-Phase Handshake]] with an ordinary transparent latch inside a dense datapath where it is all latch and almost no wire. The occupancy bound does *not* enter this decision — $2N$ stages hold $N$ tokens under both, so "twice as fast" is confusing transitions per datum with data per stage.

**Whether a delay line can track the datapath decides bundled data against QDI.** [[Bundled-Data Interface]] costs $k+2$ wires and one inequality, $t_d \ge t_{pd,\max} + t_{\text{setup}}$ — the synchronous period constraint, same worst-case number, made local so only the stages that run pay it. [[Dual-Rail Encoding]] deletes the inequality entirely and charges $2k$ wires, half the rate per wire, 2 LUTs per bit against 1, a superlinear-in-fan-in DIMS logic cost, and roughly $4\times$ the transitions of single-rail because the return-to-spacer phase makes activity data-independent. That is a bad trade almost always, and the exceptions are the ones where the matched delay *cannot* be made to track: near-threshold and subthreshold operation, where $t_{pd}$ varies by orders of magnitude with $V_{DD}$ and temperature and the delay line's variation is not perfectly correlated with the logic's because the stack depths differ. The second exception inverts the sign of the same defect — data-independent switching activity is exactly what a side-channel-resistant design wants, so the worst power property in the table becomes the reason to choose it. Once dual-rail is chosen, [[1-of-4 Encoding]] is nearly free: same wire count, same $\tfrac12$ bit/wire rate, half the edges, and the only reason not to take it is that a wider $1$-of-$N$ stops paying at $R(8) = \tfrac38$. Note where the cost lands, though — dropping the timing assumption does not delete the time, it moves it into the [[Completion Detection Tree]], whose $\lceil\log_r k\rceil$ depth sits on the critical path where a matched delay would have sat.

**Arbitration and the classical flow-table layer are not choices at all.** A [[Mutual Exclusion Element]] is the only entry in the table with unbounded latency — resolution goes as $e^{-t/\tau}$ and no argument bounds when the balance point is left — and it is also unavoidable, because any genuinely unclocked arbitration must contain metastability somewhere and the mutex is the structure that filters rather than propagates it. There is nothing to compare it against except giving up the requirement: on FPGA, two synchroniser cycles and a finite MTBF feeding a synchronous arbiter, which buys bounded response with a design the tools can verify. Below the protocols, the choice between [[Race-Free State Assignment]] and an [[Asynchronous Cycle]] is settled by where the cost lands rather than how big it is: an extra state variable doubles the excitation table's rows, adds a feedback wire and widens every product term — a *global* cost paid on all transitions — while a cycle costs no logic at all and slows only the one transition that would not embed, to $(j{+}1)\Delta$. Take the cycle when a single transition fails to embed in $Q_s$; take the extra variable when many do, or when the widened input-separation spec of $k\Delta$ is what the environment cannot meet.

$$\boxed{\ \text{2-phase} \iff t_{\text{link}} \gg t_{\text{latch}}; \qquad \text{QDI} \iff \nexists\, t_d \text{ tracking } t_{pd,\max}(\text{PVT}); \qquad \text{FPGA} \Rightarrow \text{bundled data}\ }$$

**Where the comparison stops being useful.** Take synchronous unless there is a specific reason not to — the tooling advantage swamps every row above, and the three reasons are static timing analysis, testability, and determinism, none of which appear in a latency table. The average-case win that motivates the whole topic is a chain result: $\mathbb{E}[T_{\text{async}}] = N\,\mathbb{E}[t]$ holds along a chain, but any join waits for $\mathbb{E}[\max_i t_i] \to t_{\max}$, so wide parallelism with frequent barriers recovers almost none of it. And the table's orderings are only orderings — with no measured numbers anywhere in this topic, the crossover points named above are arguments about which term dominates, not thresholds you can evaluate. What survives all of that is narrow and real: duty-cycled sensor and RFID front ends, GALS interfaces where clock-domain crossing is intrinsically asynchronous, and long NoC links.

No RTL block: this note compares structures rather than describing one, and every circuit it names carries its own Spade or its own `not-expressible` argument.

**Related Notes (with context).**

- [[Huffman Feedback Model]] – depends-on: the model every other row is an escape from, and the source of the unknown settling order they all pay for.
- [[Race-Free State Assignment]] – compares: the global fix for a non-embedding transition graph, priced in secondary variables.
- [[Asynchronous Cycle]] – compares: the local fix for the same problem, priced in transition time instead.
- [[Muller C-Element]] – depends-on: the primitive under every handshake row, at $2n+4$ transistors or one LUT3.
- [[Muller Pipeline]] – compares: the four-phase control chain, and where the $2N$-stages-per-$N$-tokens bound comes from.
- [[Micropipeline]] – compares: the same bound with two-phase signalling and a storage element no library ships.
- [[Bundled-Data Interface]] – compares: the default choice on both targets and the only one FPGAs map.
- [[Four-Phase Handshake]] – compares: cheap storage, four transitions per datum.
- [[Two-Phase Handshake]] – compares: two transitions per datum, expensive storage — the wire-versus-logic crossover.
- [[Dual-Rail Encoding]] – compares: deletes the timing assumption for $2k$ wires and data-independent activity.
- [[1-of-4 Encoding]] – extends: the same rate as dual-rail at half the edges, once dual-rail is already chosen.
- [[Completion Detection Tree]] – depends-on: where the deleted timing assumption reappears, as $\lceil\log_r k\rceil$ on the critical path.
- [[Matched Delay Line]] – depends-on: the one component bundled data cannot do without and synthesis will delete.
- [[Mutual Exclusion Element]] – counter-example: unbounded latency, and unavoidable anyway.
- [[Asynchronous FIFO]] – compares: the only row an FPGA runs, and the classical theorem's one industrial application.

## References

- 0.5) Asynchronous Sequential Logic — §The feedback model, §Why anyone gives up a clock, §Races and critical races, §Essential hazards, §Cycles, §Handshaking protocols, §Delay-insensitive and QDI, §FPGA mapping, §Trade-offs. No book source is assigned to this topic.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — handshake protocols, bundled data vs. dual-rail, pipeline occupancy.
- I. E. Sutherland, "Micropipelines" (Turing Award lecture) — two-phase transition signalling.
- A. J. Martin, on the limitations of delay-insensitive circuits — the isochronic-fork argument.
- N. Weste & D. Harris, *CMOS VLSI Design* — C-element circuit forms, mutex filter, clock-tree power, CDC.
