---
title: Choosing a Storage Element
description: "Trade-off table across the 10 Flip-Flops and Latches circuits, with the source's own numbers."
kind: comparison
source: "0.3) Introduction to Flip-Flops & Latches, §Trade-offs, §FPGA mapping, §Metastability, §Worked example; Weste & Harris ch. 10; Rabaey ch. 7; Mano & Ciletti ch. 5; Wakerly ch. 7-8"
status: seed
spade: n/a
tags: [digital, flip-flops-and-latches, comparison]
aliases:
  - Choosing a Storage Element
  - Choosing a Flip-Flop
  - Latch vs Flip-Flop
  - Storage Element Comparison
---

# Choosing a Storage Element

**One-line summary:** Which of the ten storage structures in this folder to reach for, decided by whichever of area, clock power, timing-model checkability, or MTBF is the binding constraint — never by which one is "better".

| circuit | transistors, static CMOS | clocked devices / bit | storage nodes / bit | added to $t_{logic,max}$ | FPGA mapping | page |
| --- | --- | --- | --- | --- | --- | --- |
| [[Cross-Coupled Inverter Bistable]] | 4 | 0 | 1 | — (no input exists) | — | — |
| [[SR Latch]] | 8 (two NOR2) | 0 | 1 | — | 2 LUTs fed back = combinational loop | — |
| [[Switch Debouncer]] | 8 (two NAND2) + 2 pull-ups | 0 | 1 | — | not an FPGA structure | — |
| [[Transparent D Latch]] | 8–12 | 2 | 1 | $t_{dq}$ if data arrives while transparent, else $t_{cq}$ | 1 LUT fed back; discouraged | — |
| [[Master-Slave D Flip-Flop]] | 20–26 | 4 | 2 | always $t_{cq}$ | free — one flop per LUT output | — |
| [[JK Flip-Flop]] | 20–26 + $J\bar{Q}+\bar{K}Q$ | 4 | 2 | 2 extra logic levels on $D$ | absorbed by a 6-LUT; costs 1 LUT level of delay | — |
| [[T Flip-Flop]] | 20–26 + XOR2 (8–12) | 4 | 2 | $t_{XOR}$ on $D$ | free — a spare LUT input | — |
| [[Clock Enable Flip-Flop]] | 20–26 + 2:1 mux | 4 | 2 | $t_{mux}$, **every** cycle | 0 LUTs, 0 added delay (dedicated `CE` pin) | — |
| [[Synchronizer Chain]] | $N\times(20\text{–}26)$ | $4N$ | $2N$ | nothing — nothing may be placed between stages | $N$ slice flops, free | — |
| [[Integrated Clock-Gating Cell]] | latch + AND, a handful of gates, amortised over $\ge{\sim}8$ flops | removes the branch | — | removes $t_{mux}$; adds a setup constraint on $en$ | needs a global buffer (`BUFGCE`), a few dozen per device | — |

**Every page cell is `—` on purpose.** The long-form source carries no page-level citations because it has no book source; its own References section says so. The transistor and clocked-device counts are the canonical static-CMOS figures every VLSI text quotes, not measurements from a characterised library — real cells vary by roughly $2\times$ across families (static vs. dynamic, single- vs. dual-rail, low- vs. high-$V_t$). Use them as ratios. Two further numbers have no column above because they belong to one row each: the clock tree is routinely quoted at **20–40 % of a chip's dynamic power**, which is the entire budget the gating cell attacks, and the crossover below which a gating cell costs more than it saves is **roughly eight flops per gate**. Latency in cycles is likewise a one-row property: only the synchronizer chain has one, $N$ cycles for $N$ stages.

**Area decides only at the very bottom of the table, and only against writeability.** Four transistors buy indefinite retention and no way to write; eight buy a writeable bistable with one input code, $S=R=1$, for which no consistent state exists. Everything between 8 and 26 transistors is being spent to make the write *controlled* — first by a clock ([[Transparent D Latch]], 8–12), then by an edge ([[Master-Slave D Flip-Flop]], 20–26). If you are choosing a storage element for a datapath, area is not your constraint and this axis will not decide anything; the $3\times$ between latch and flop is real but it is dwarfed by the logic between them. Area decides in exactly one place: an SRAM array, where the cell is the bistable pair plus two access transistors and the count is multiplied by millions.

**Clock power and the checkability of the timing model are the two that actually decide, and they point in opposite directions.** The flop's four clocked devices per bit are twice the latch's two, and the clock is the only net in the design with activity $\alpha=1$ by definition, so that factor of two lands on the largest single term in dynamic power. The latch also passes slack forward — data arriving during the transparent phase pays only $t_{dq}$ — where the flop throws away every picosecond a fast stage did not use. Against that, the flop's two latches are never transparent at the same instant, which collapses correctness to two independent inequalities checkable in $O(\text{paths})$ ([[Setup and Hold Constraints]]) instead of a loop analysis with borrowing propagating across stages. Pick the flop by default and for anything going into a synthesis flow; the tools, the libraries and the sign-off methodology all assume it. Pick the latch only when you specifically want slack to flow between unbalanced stages and you own the analysis. Note which cost the latch's transparency is: its hold requirement extends across the whole transparent phase, and a hold failure is broken at every frequency.

**Once the flop is chosen, the remaining question is how to make it hold, and the answer inverts between ASIC and FPGA.** On an ASIC the enable mux is unconditional overhead — a design that enables a register 5 % of the time still pays $t_{mux}$ 100 % of the time — and it saves no clock power at all, because the clock pin, the local buffer and the four internal clocked devices toggle regardless. So on an ASIC, gate the clock: it removes the tree branch, the internal clock power and the data toggling at once, at the price of a skewed sub-domain that STA must model, a setup constraint on $en$, and a scan bypass. On an FPGA every term reverses. The enable mux *is* the slice flop's `CE` pin, costing zero LUTs and zero delay, while a gated clock must occupy one of a few dozen global buffers; and a LUT-built latch — whether as a storage element or inside a hand-rolled gating cell — is a cycle in the timing graph that static timing analysis cannot traverse. Write `if en { q <= d }` and let the constraint file decide, which is the only form that is correct on both targets.

**[[JK Flip-Flop]] and [[T Flip-Flop]] are not on this axis at all; they lost to a change in who performs minimisation.** JK's excitation table is half don't-cares, which under K-map minimisation was free literals back when a gate was a pin on a DIP. A modern synthesiser extracts don't-cares across the whole cone between flops, so exposing them again at the flop pin buys nothing while the two extra logic levels on $D$, the second characterised data pin and the extra clock-adjacent load are all still charged. Read them, do not instantiate them. The toggle *structure* survives — an XOR in front of a D flop is still the right counter bit — just not as a library cell.

**Reliability is a separate axis with a return nothing else in digital design matches.** If a signal crosses from another clock domain, none of the choices above matter: the aperture window will be violated eventually and resolution time is unbounded. The [[Synchronizer Chain]] is the only lever, and it works because $t_r$ sits in an exponent while everything else sits in a product — each stage adds $T_{clk}$ to the numerator and multiplies MTBF by a constant factor $e^{T_{clk}/\tau}$. On the source's worked assumptions ($f_c=1$ GHz, $f_d=100$ MHz, $\tau=100$ ps, $T_0=20$ ps) that is 17 days at $N=1$, 1000 years at $N=2$, and 23 Myr at $N=3$: five orders of magnitude for one flop and one cycle of latency. Put nothing between the stages, never fan out an unsynchronised signal, and synchronise control rather than data.

**Related Notes (with context):**

- [[Cross-Coupled Inverter Bistable]] – depends-on: the 4-transistor loop every row in the table is built around, and the unstable point the synchroniser exists to survive.
- [[SR Latch]] – compares: the cheapest writeable row, ruled out everywhere by the $S=R=1$ code whose release is an unarbitrated race.
- [[Switch Debouncer]] – counter-example: the one application where that forbidden code is unreachable by construction, so the cheapest row wins outright.
- [[Transparent D Latch]] – compares: half the clocked load of the flop and slack that flows forward, paid for with a hold requirement spanning the whole transparent phase.
- [[Master-Slave D Flip-Flop]] – compares: the default, and the only row whose timing model a synthesis flow can check without solving loop equations.
- [[JK Flip-Flop]] – counter-example: cheaper than a D flop only under a minimisation regime that no longer exists.
- [[T Flip-Flop]] – extends: the D flop plus an XOR, still the right counter bit and still not a library cell.
- [[Clock Enable Flip-Flop]] – compares: the timing-safe way to hold, free on an FPGA and a per-cycle tax on an ASIC.
- [[Integrated Clock-Gating Cell]] – compares: the same hold, done by removing the clock instead of the data, which is where the 20–40 % lives.
- [[Synchronizer Chain]] – supports: the axis none of the others touch, and the only exponential return in the folder.
- [[Setup and Hold Constraints]] – depends-on: the two inequalities that make the flop's column of this table checkable.
- [[Clock Skew and Jitter]] – depends-on: the uncertainty term that a gating insertion adds to the branch it gates.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Trade-offs* — the transistor, clocked-device and storage-node counts, and the default-to-the-flop conclusion; §*FPGA mapping* — the `CE`/`BUFGCE` inversion and the cost of a LUT-built latch; §*Gated clocks and enable flops* — the $\alpha=1$ argument; §*Metastability* and §*Worked example* — the MTBF model and the 17 days / 1000 years / 23 Myr table.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — transistor counts, the latch/flop/pulsed-latch comparison, and $\tau$.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, ch. 7 — bistability and master–slave race-through.
- Mano & Ciletti, *Digital Design*, ch. 5; Wakerly, *Digital Design*, ch. 7–8 — SR/D/JK/T characteristic and excitation tables, debouncing.

> [!warning] No page numbers exist for any figure in this note
> The source has no book source, so every citation here is chapter-level and every page cell in the table is `—`. Nothing above was read out of a specific edition; the numbers are the canonical order-of-magnitude values, cross-checked only for agreement with the sibling notes that state them.
