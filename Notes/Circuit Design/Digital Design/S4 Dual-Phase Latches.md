---
title: "Dual-Phase Latches"
description: "Map of the 8 Dual-Phase Latches notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, dual-phase-latches, hub]
aliases:
  - "Dual-Phase Latches"
  - "0.3a) Dual-Phase Latches"
---

# Dual-Phase Latches

**The specification.** Input: a combinational pipeline of $N$ stages with per-stage
delays $d_1\dots d_N$ on an $n$-bit datapath, and a clock of period $T$. Output:
bit-identical to the same pipeline clocked by edge-triggered flops — this is a
*clocking discipline*, not an arithmetic transform, so the arithmetic error is
exactly $0$ ulp and none of the rounding machinery in [[Error Accuracy]] or the
format questions in [[Number Formats]] enter anywhere. What is being optimised is
**throughput**, specifically the removal of the per-stage $\max$ from the timing
constraint, so that $T$ binds on a running average of stage delays rather than on
the single worst stage. It is paid for in min-delay (hold) margin, clock power,
sequential area, and design-flow friction. Every circuit below is a different bet
about which of those four to spend, which is why none of them re-derives this.

### Start here

- [[Choosing a Latch Timing Scheme]] – the trade-off table, carrying the source's
  own measured per-hop cycle times, power and area deltas across all three
  disciplines. Read it first for orientation and again once the mechanisms below
  make sense; the hub deliberately does not duplicate a number from it.

### The two disciplines

- [[Two-Phase Latch Pipeline]] – the full discipline, and the one derivation the
  whole topic rests on: level-sensitivity turns arrival time into a recurrence with
  a $\max$ in it, and unrolling that recurrence is what produces the running-average
  constraint. Read this before anything else structural.
- [[Pulsed Latch]] – the same borrowing mechanism compressed into a narrow window on
  the full-cycle grid, which keeps a flop's one-state-point-per-boundary interface.
  Read it as the answer to "can I have most of this without rebuilding the flow?"

### Making the phases

Each of these is where an abstract phase parameter becomes a physical delay someone
has to close.

- [[Non-Overlapping Two-Phase Clock Generator]] – how $\phi_1\phi_2 = 0$ becomes a
  logical property of a topology instead of a margin to be verified. Read it for
  where the dead gap $t_{\mathrm{nov}}$ physically comes from.
- [[Clock Pulse Generator]] – the pulsed-latch counterpart: a local cell whose
  inverter chain, not the incoming duty cycle, sets the transparency window. Read it
  for what the pulsed scheme costs before it saves anything.
- [[Programmable Local Clock Buffer]] – the leaf cell that derives both phases from
  one global grid and leaves the phase offset and pulse width writable after
  fabrication. Read it for how a shipped part tunes a discipline that silicon
  refused to close at design time.

> [!note] One parameter, pulling two ways
> $t_{\mathrm{nov}}$ carries opposite signs depending on which note you are in:
> widening the dead gap buys hold margin directly, enough to drive the race-through
> requirement negative, and it comes out of the borrow budget picosecond for
> picosecond. The scheme's two headline benefits compete through a single number
> that the designer, not the tool, sets.

### Holding state

A latch that must sometimes *not* update needs an enable, and the two ways to build
one differ by orders of magnitude in measured cost.

- [[Clock-Gated Latch Bank]] – the enable in the clock: one gate instead of $n$
  muxes, and the gate sits in one phase's tree only. Read it for why inter-phase
  skew, not power, is the thing that bites.
- [[Recirculating-Mux Latch Bank]] – the enable in the datapath, keeping both trees
  symmetric at the price of a feedback edge that is a latch loop and therefore
  cannot borrow. Read it for the counter-example to "a latch is half a flop".

### Getting it tested

- [[LSSD Scan Latch Pair]] – the L1/L2 pair used as its own scan cell, race-free by
  clock non-overlap rather than by hold-buffer insertion. This is the one part of
  the two-phase flow that is genuinely solved, and it was solved in 1977; read it
  before concluding that latch-based design is untestable.

### Why the ecosystem fights you anyway

The timing mathematics has been settled since Sakallah, Mudge & Olukotun posed
multi-phase latch timing as a min–max linear program (ICCAD 1990), and every signoff
tool implements borrowing. What is not settled is everything around the analysis:
latch loops make the timing graph cyclic, so arrival times must be iterated to a
fixed point rather than propagated topologically; loop-cutting trades that runtime
for silent pessimism; reported slack at a borrowing endpoint is not a margin;
optimisation engines and Liberty models lag the analysis engines; and equivalence
checking survives only if the flop-to-latch transform is constrained *before*
synthesis. None is a wall, and all are why a schedule-driven team picks flops — and
why the pulsed latch, flop-shaped everywhere the tools look, is where nearly every
high-frequency team lands.

### Where this topic sits

[[Flip-Flops and Latches]] supplies the cell: a master–slave flop *is* two of these
latches in series on opposite phases, so the half-cycle of transparency exploited
here has always existed inside every flop — edge-triggered design simply throws it
away by placing master and slave at the same point. [[Synchronous Sequential Logic]]
is the consumer: it assumes a clean cycle boundary, which is exactly the thing
borrowing destroys. [[FPGAs]] is where the whole topic stops paying, since every LUT
already ships with a free flop beside it and the global clock network is
single-phase.

## References

Not covered in de Dinechin & Kumm, *Application-Specific Arithmetic* — the book
treats pipelining as a frequency/latency trade at the operator level and never
leaves single-phase edge-triggered clocking. Sources are the primary literature, and
every number lives in the note that uses it; the load-bearing ones are:

- Pedroso, Wang & Guthaus, [*An Open-Source Flow for Single-Phase, Edge-Triggered to Two-Phase, Non-Overlapping Clocking Conversion*](https://arxiv.org/abs/2605.05374), GLSVLSI 2026 — constraints, two-colouring check, Table 1 power/area/borrow measurements.
- Sakallah, Mudge & Olukotun, [*checkTc and minTc*](https://dl.acm.org/doi/10.5555/123186.123312), ICCAD 1990 — multi-phase latch timing as a min–max LP.
- Harris, Horowitz & Liu, [*Timing Analysis Including Clock Skew*](https://doi.org/10.1109/43.806806), IEEE TCAD 18(11), 1999 — the setup/hold formalisation used throughout.
- Shi, Guo, Lin, Wang & Huang, [*Handling Latch Loops in Timing Analysis*](https://yibolin.com/publications/papers/TIMING_DATE2025_Shi.pdf), DATE 2025 — iterate-till-converge in PrimeTime and OpenSTA, cycle-cutting pessimism.
- Eichelberger & Williams, [*A Logic Design Structure for LSI Testability*](https://dl.acm.org/doi/10.5555/800262.809169), 14th DAC, 1977 — LSSD.
- Curtis et al., [*Design and Implementation of the POWER6 Microprocessor*](https://ieeexplore.ieee.org/document/4443208/), IEEE JSSC 2008 — C1/C2 clocking and programmable local clock buffers.
