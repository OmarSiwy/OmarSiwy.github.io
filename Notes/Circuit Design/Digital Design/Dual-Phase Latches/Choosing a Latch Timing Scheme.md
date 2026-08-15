---
title: Choosing a Latch Timing Scheme
description: "Trade-off table across the eight Dual-Phase Latches circuits with the source's own measured numbers, and the constraint that actually decides between them: 390 → 270 → 210 ps/hop bought with hold margin, clock trees and flow friction."
kind: comparison
source: "0.3a) Dual-Phase Latches §Trade-off table, §The costs, §Worked example, §Industrial record; Pedroso et al. GLSVLSI 2026 Table 1"
status: seed
spade: n/a
tags: [digital, dual-phase-latches, comparison, timing, clocking]
aliases:
  - Latch Timing Scheme
  - Choosing a Latch Clocking Scheme
  - Latch vs Flop
  - Flop vs Latch
---

# Choosing a Latch Timing Scheme

Three sequencing disciplines differing only in where the two latches of a master–slave pair are placed and how wide their transparency window is, plus the five support cells that make each one buildable — and the constraint that picks between them is almost never frequency.

**The top-level choice is how far apart the master and the slave sit.**

| | Edge-triggered flop (baseline) | [[Pulsed Latch]] | [[Two-Phase Latch Pipeline]] |
| --- | --- | --- | --- |
| Grid | full cycle, pair co-located | full cycle, one latch | half period, pair split by logic |
| Timing constraint | $\max_i d_i \le T - t_{oh}$ | $\sum_{[j,i]} D \le LT + B_p$ | $\sum_{[j,i]} D \le L\tfrac{T}{2} + B$ |
| Borrow window | none | $t_p - t_{su} - t_{sk} = 50$ ps | $\tfrac{T}{2} - t_{\mathrm{nov}} - t_{su} - t_{sk} = 140$ ps |
| Cycle time per hop | 390 ps | 270 ps | 210 ps |
| Speed-up on the example | 1× | **1.44×** | **1.86×** |
| Hold requirement | baseline; unfixable by raising $T$ | **worst** — $\delta \ge t_p + t_h + t_{sk}$, grows with $t_p$ | tunable to zero via $t_{\mathrm{nov}}$, paid out of $B$ |
| Area | baseline | ~25 % smaller per cell, pulser amortised | +7.3 % (gated) to +299.1 % (recirc) seq. cells |
| Clock power | baseline | −40 % clock-pin energy per cell; 7.3 % avg block power (4.3–11.2 %, 45 nm) | +36.6 % (gated) to +142.7 % (recirc) total |
| Flow / DFT friction | none | low — flop-like interface, standard scan | high — latch loops, borrow convergence, LEC constraints, dual CTS |
| FPGA | free flop beside every LUT | no latch primitive; $t_p$ is unroutable | 32 % academic upside, nobody ships it |

Per-hop delays, $B$, $B_p$ and the 1.44×/1.86× come from the four-stage worked example ($d = 220/180/300/200$ ps, $t_p = 90$, $t_{su} = 25$, $t_{sk} = 15$, $t_{\mathrm{nov}} = 30$ ps) in [[Dual-Phase Latches]] §Worked example. Area, power and cell counts are SkyWater 130 nm, TT/25 °C/1.8 V, Pedroso et al. GLSVLSI 2026 Table 1, via §The costs. Per-cell pulsed-latch figures come from §Industrial record and carry **no process node** — use them as ratios. The 45 nm block figure is Consoli & Rabaey.

**The sub-choices, once the discipline is fixed.** These five are not alternatives to the three above; each belongs to exactly one of them, and two pairs of them are alternatives to each other.

| Circuit | Chooses between | Numbers the source gives | Where it bills |
| --- | --- | --- | --- |
| [[Non-Overlapping Two-Phase Clock Generator]] | sizes $t_{\mathrm{nov}}$ for a two-phase pipeline | — | every ps of gap is a ps off $B = \tfrac{T}{2} - t_{\mathrm{nov}} - t_{su} - t_{sk}$; the gap holds at its own pins, not at the latch clock pins |
| [[Clock Pulse Generator]] | sizes $t_p$ for a pulsed-latch cluster | POWER6 shipped 2.9 / 4.2 / 5.2 FO4; Itanium 2 ~1/6 cycle = 125 ps at 1.2 GHz | $B_p$ and $\delta_{\min}$ are both affine in $t_p$ with slope $+1$ — no leverage, only a choice of where to spend |
| [[Programmable Local Clock Buffer]] | fixed vs field-tunable $t_p$ and phase offset | 3 widths 2.9 / 4.2 / 5.2 FO4; delay-C1 cycle stealing; POWER6 at 4.7 GHz | hold padding is inserted once, at design time, against one selected width |
| [[Clock-Gated Latch Bank]] | how a two-phase bank holds state | **−29.2 % power, −50 % latch count** vs recirculation; +7.3 % seq. cells, +36.6 % power (29.1 mW vs 21.3 mW); **2.63 ns skew** | one AND in $\phi_2$'s tree only, so the enable's insertion delay appears as inter-phase skew |
| [[Recirculating-Mux Latch Bank]] | the same choice, the other way | **0.18 ns skew**; +299.1 % seq. cells, +142.7 % power (51.7 mW); JPEG **failed to route** at 17 325 latches | $n$ muxes in the data path, and the feedback loop is a latch loop that cannot borrow |
| [[LSSD Scan Latch Pair]] | how a two-phase design is tested | 54 % power increase over a non-scannable standard-cell design (uncited in the source) | cell area and a third clock net that must stay non-overlapping *after* CTS |

Dashes are real gaps, not omissions. The sources give no characterised delay-chain $t_d$, no measured $t_{\mathrm{nov}}$, no pulser energy $E_{\mathrm{pulser}}$ and therefore no break-even cluster size $M$ — those are library extractions, not quotable constants. There are also no LUT, slice or DSP counts anywhere in this topic, because two-phase latch pipelining is an ASIC technique and every FPGA number in the source is a reason *not* to do it.

> [!warning] No printed page numbers exist for this topic
> Dual-phase latching is outside de Dinechin & Kumm, so every figure above is cited to a paper and a section of the long-form note rather than to a printed book page. The two load-bearing primary sources are Pedroso et al. Table 1 (all SkyWater 130 nm area/power/skew figures) and Curtis et al. JSSC 2008 (all POWER6 figures); the worked-example picoseconds are the long-form note's own construction, not a measurement.

**Frequency alone almost never justifies leaving flops.** The worked example is deliberately mild — max/mean imbalance of only 1.33× — and it still yields 1.44× from pulsed latches and 1.86× from full two-phase, because a flop resynchronises to the edge every stage and the single worst stage sets $T$ for the whole chip. That is a real number, and it is also the *least* useful one here, because the flop flow is free and every alternative bills somewhere else. Start with flops and only move when a specific measured stage is holding the block back. If the pipeline's imbalance is a hump — a few consecutive slow stages — the boxed constraint of [[Two-Phase Latch Pipeline]] says the borrow accumulates along the run but is capped at a single $B$, not $L \cdot B$, so a deep pipeline with one large local hump gets less than the average-delay argument promises. Measure the running window, not the max/mean ratio.

**Hold margin, not frequency, is what actually separates the two latch schemes.** They pull in opposite directions on min-delay. A [[Pulsed Latch]] makes hold strictly *worse* than a flop: $\delta \ge t_p + t_h + t_{sk}$, so every picosecond of borrow window bought from the [[Clock Pulse Generator]] is a picosecond of mandatory padding on every short path in the cluster, and the usable range of $t_p$ is bounded on the right by hold rather than by timing theory — which is why shipped parts sit at 2.9–5.2 FO4 or one sixth of a cycle rather than anywhere near $T/2$. A [[Two-Phase Latch Pipeline]] does the reverse: $\delta_{dq} + \delta_{i+1} \ge t_h + t_{sk} - t_{\mathrm{nov}}$ can be driven *negative* by widening the gap in the [[Non-Overlapping Two-Phase Clock Generator]], making hold free. If the block's problem is a scan chain or a GPIO path that fails hold permanently and cannot be padded, two-phase is the only scheme on this page that fixes it, and the fix costs frequency only through $B$. If the block's problem is frequency and hold is already comfortable, pulsed latches are the cheaper trade.

**Area and power decide it in the other direction, and the flow numbers are brutal.** "A latch is half a flop" is true per cell and false at the block level: retiming replicates logic, so combinational cells more than doubled (3502 → 7613/8184) in both measured two-phase variants, and total power rose 36.6 % in the *best* one. Pulsed latches keep most of the per-cell win — ~25 % smaller, −40 % clock-pin energy — and land at a measured 7.3 % average block-level power *reduction* at 45 nm after paying for pulsers and hold buffers. That sign difference is the whole argument. Within two-phase, the enable scheme is a genuine fork: [[Clock-Gated Latch Bank]] wins on every axis measured (−29.2 % power, −50 % latch count) except the one the discipline exists to deliver, since its single AND gate produced 2.63 ns of inter-phase skew against 0.18 ns for [[Recirculating-Mux Latch Bank]], and skew comes straight out of $B$. Recirculation's own bill — +299.1 % sequential cells, +142.7 % power, and an outright routing failure on JPEG at 17 325 latches — means neither answer is comfortable. Gate at the point where the phases are still one signal, as the [[Programmable Local Clock Buffer]] does, and the fork mostly disappears.

**On FPGA the answer is flops, and it is not close.** The area case evaporates because every LUT already has a free flop beside it; a second phase burns a PLL output and a global buffer on a network already accounting for 20–39 % of dynamic power; there is no latch primitive, so a pulsed latch becomes a LUT with a combinational cycle the timing engine has to be told to break; and $t_p$ is a routed delay of order 100 ps that no vendor router holds constant across placement, temperature and speed grade. AMD's own guidance on `set_max_time_borrow` is that latches "are not recommended in general" and the command "should be used by expert users". The academic upside — 32 % average clock-period reduction on FPGA benchmarks — is real and unrealised for flow reasons, not physics reasons. On ASIC the signoff position is inverted only in DFT: [[LSSD Scan Latch Pair]] makes the L1/L2 pair its own scan cell and has forty years of race-free ATPG behind it, so testability is the one part of the two-phase flow that is *better* solved than the flop equivalent. Everything else around it — borrow convergence as an $O(n^2)$ fixed-point iteration with no divergence lookahead, loop-breaking that trades runtime for silent pessimism, zero reported slack at borrowing endpoints, Liberty models that cannot express borrowing across multiple latches — is why a schedule-driven team picks flops even when the timing argument says otherwise.

$$\boxed{\ \text{flops by default}\ \to\ \text{pulsed latches for frequency}\ \to\ \text{two-phase only for hold robustness you own the flow to close}\ }$$

**Related Notes (with context):**

- [[Two-Phase Latch Pipeline]] – compares: the full discipline, 210 ps/hop and 1.86× on the example, paid in dual CTS, tool friction and a lost cycle boundary.
- [[Pulsed Latch]] – compares: the settlement, 270 ps/hop with a flop-like interface for STA, scan and LEC, at the cost of the worst hold requirement here.
- [[Non-Overlapping Two-Phase Clock Generator]] – depends-on: sets the $t_{\mathrm{nov}}$ that makes two-phase hold margin free, spending $B$ picosecond for picosecond.
- [[Clock Pulse Generator]] – depends-on: sets the $t_p$ that is simultaneously the pulsed-latch borrow window and its hold requirement.
- [[Programmable Local Clock Buffer]] – extends: makes both of those constants writable after the die exists, which is how POWER6 tuned frequency in the lab.
- [[Clock-Gated Latch Bank]] – compares: the cheap way to hold a two-phase bank, and the source of the 2.63 ns phase skew that eats the borrow budget.
- [[Recirculating-Mux Latch Bank]] – counter-example: buys back the 0.18 ns skew with +299 % sequential cells and a routing failure, which is why "cheapest" is the wrong axis.
- [[LSSD Scan Latch Pair]] – supports: the reason DFT is the one part of the two-phase flow that is genuinely solved.
- [[Dual-Phase Latches]] – depends-on: the long-form derivation, worked example and tool-support survey every number above is taken from.

No RTL block: this note compares circuits rather than describing one, and each sibling carries its own.

## References

- [[Dual-Phase Latches]] — §"Trade-off table" (constraint forms, hold, area/power/friction rows), §"The costs" (2.63 ns vs 0.18 ns skew, SkyWater 130 nm power and cell counts, JPEG routing failure), §"Worked example" (390 / 270 / 210 ps per hop, $B = 140$, $B_p = 50$, 1.44× and 1.86×), §"FPGA mapping" (20–39 % clock power, 32 % Teng figure, expert-users-only guidance), §"EDA tool support" (borrow convergence, LSSD, LEC), §"Industrial record" (POWER6 FO4 widths, Itanium 2 pulse, 7.3 % at 45 nm).
- Pedroso, Wang & Guthaus, *An Open-Source Flow for Single-Phase, Edge-Triggered to Two-Phase, Non-Overlapping Clocking Conversion*, GLSVLSI 2026 — Table 1, source of every SkyWater 130 nm figure quoted above.
- Curtis et al., *Design and Implementation of the POWER6 Microprocessor*, IEEE JSSC 2008 — C1/C2 clocking, delay-C1 cycle stealing, 2.9 / 4.2 / 5.2 FO4 selectable pulse widths.
- Naffziger et al., *The Implementation of the Itanium 2 Microprocessor*, IEEE JSSC 37(11), 2002 — ~1/6-cycle pulse, 125 ps at 1.2 GHz.
- Consoli & Rabaey et al., *Pulsed-Latch Circuits to Push the Envelope of ASIC Design* — 7.3 % average power reduction at 45 nm, 4.3–11.2 % range, including pulser and delay-buffer overhead.
- Teng, *Latch-Based Performance Optimization for FPGAs*, MASc thesis, University of Toronto, 2012 — 32 % clock-period reduction; clock is 20–39 % of FPGA dynamic power.
