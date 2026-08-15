---
title: Synchronous Sequential Logic
description: "Map of the 13 Synchronous Sequential Logic notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, synchronous-sequential-logic, hub]
aliases:
  - Synchronous Sequential Logic
  - "0.4) Synchronous Sequential Logic"
  - "Truth Table"
  - "State Minimization"
---

# Synchronous Sequential Logic

**The specification.** Input: a $k$-bit vector $x$ sampled on the rising edge of one clock, plus a synchronous reset. State: $N$ symbols held in $s$ flip-flops. Output: an $m$-bit vector $z$, a function of the state alone or of the state and the current input. Accuracy: **exact** — a state machine computes a predicate or a schedule, so there is no ulp to spend and nothing in this topic links to [[Error Accuracy]] for a bound. The only error currency is *latency*, measured in whole cycles. Optimised: $f_{\max}$ first — the register-to-register path through the next-state logic — then flop count, then LUT count.

Every cycle-time claim in the topic rests on the register constraint derived in [[Flip-Flops and Latches]]:

$$T_c \;\ge\; t_{pcq} + t_{pd}^{\text{NSL}} + t_{\text{setup}} + t_{\text{skew}}$$

Nothing below re-derives it. Every circuit here is an attempt either to shrink $t_{pd}^{\text{NSL}}$ or to stop caring about it.

**The discipline that makes all of this legal** is one rule: every cycle in the signal-flow graph passes through at least one edge-triggered flip-flop, and every flop takes the same clock. Combinational logic is then acyclic by construction, time is observed only at edges, and composition is closed — two synchronous blocks wired together are synchronous, which is false for [[Asynchronous Sequential Logic]]. The price is that the slowest path in the design sets $T_c$ for every path.

> [!important] Glitches are free inside a cycle and fatal across one
> The combinational cloud may glitch arbitrarily between edges because a downstream flop samples only at the edge. The moment an output leaves the synchronous island — an asynchronous RAM write-enable, an off-chip strobe, a clock-gating cell, another clock domain — glitches become real events. This one fact decides Moore vs. Mealy, decides whether a state bus may be sampled elsewhere, and is why "register the output" is the default advice.

Read the trade-off table before anything else if you already know the material and just need to pick:

- [[Choosing an FSM Encoding]] – compares: all thirteen circuits in one table, with the cycle, flop and LUT counts from the worked example. The rest of this hub deliberately does not repeat those numbers.

### The template and the two output styles

Read these four in order; they are one idea cut four ways, and everything after assumes them.

- [[Canonical FSM Structure]] – depends-on: the three blocks every machine reduces to, and the proof that only the $q \to \delta \to q$ loop is on the critical path.
- [[Moore Machine]] – extends: output from state alone. Read it for why a Moore output is a registered signal in all but name.
- [[Mealy Machine]] – compares: output from state *and* input. Read it for the one cycle you buy and the combinational $x \to \lambda \to z$ path you pay with, which chains across cascaded machines.
- [[State Transition Graph]] – supports: the notation both machines are specified in, plus the completeness and determinism checks that stop synthesis inferring a latch.

### Committing the states to bits

The encoding $\text{enc}: Q \to \{0,1\}^s$ fixes $\delta$ and $\lambda$ as Boolean functions, so these three are not cosmetic — they are the same machine with wildly different logic. The assignment problem is NP-hard; these are the three defaults.

- [[Binary State Encoding]] – depends-on: $\lceil \log_2 N\rceil$ flops, the minimum. Read it for the fan-in that grows with $N$ and why that is the whole case against it on FPGA.
- [[One-Hot State Encoding]] – counter-example: $N$ flops, fan-in equal to in-degree and therefore *flat* in $N$. Read it for why the asymptotic argument reverses when flops come free with the LUTs in [[FPGAs]].
- [[Gray Code State Encoding]] – extends: binary's width with single-bit transitions. Read it only if the graph is chain-shaped, or if the state bus is sampled from another clock domain and at most one bit may be metastable.

### When the state space leaks

- [[Safe-State FSM Recovery]] – supports: with $s$ flops there are $2^s$ codes and only $N$ states; synthesis uses the leftovers as don't-cares, so an unused code can transition anywhere at all. Read it for the four escalating costs of getting back, and for the attribute without which the tool deletes your recovery arm.

### When one machine is no longer the answer

- [[FSMD Controller-Datapath Split]] – extends: past a handful of states the design stops being one FSM. Read it for the rule that keeps state counts sane — an 8-bit accumulator is one register, not 256 states — and for the status-flag loop that pipelining cannot break.

### Making it meet timing

Three moves on the same object, distinguished by whether the cycle count changes.

- [[Pipeline Register Insertion]] – extends: cut a feed-forward path with $p$ stages, $T_c \to T_c/p$. Read it for why this is exactly what you cannot do to $\delta$, which sits in a loop.
- [[Retiming]] – extends: move *existing* registers across gates, I/O behaviour unchanged. Read it for the register-conservation invariant and the iteration bound it implies — the reason no retiming makes a plain FSM faster than its next-state logic.
- [[C-Slow Retiming]] – extends: the only way under that floor. Read it for what it demands in return — $C$ genuinely independent instances, at $C\times$ the per-instance latency.

### Worked end to end

- [[1011 Sequence Detector]] – supports: the overlapping pattern detector built twice, Mealy in four states and Moore in five, with both encodings' equations and a cycle-by-cycle trace. Every number quoted in [[Choosing an FSM Encoding]] is counted here.

### Where this sits

$\delta$ and $\lambda$ are pure combinational logic, so everything in [[Combinational Logic]] and every rewriting law in [[Boolean Algebra]] applies to them unchanged; the state register is the only sequential element, and its timing comes from [[Flip-Flops and Latches]]. Downstream, this topic supplies the control half of every sequenced operator in the vault — [[Dividers]], [[CORDIC]] and [[Digit Recurrence for Algebraic Functions]] are all a datapath plus one of these machines. Drop the single-clock rule and you are in [[Asynchronous Sequential Logic]]; keep it but split the clock in two and you are in [[Dual-Phase Latches]].

## References

No book source — this topic is outside de Dinechin & Kumm. Written from standard digital-design canon:

- Mano & Ciletti, *Digital Design*, ch. 5 (synchronous sequential logic, state tables and graphs) and §5.7–5.9 (state reduction, assignment, sequence-detector design).
- Wakerly, *Digital Design: Principles and Practices*, ch. 7 (state-machine structure, Moore vs. Mealy timing, unused-state recovery).
- Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequencing, the setup/hold cycle-time constraint) and §1.4 (the FSMD control/datapath split).
- Leiserson & Saxe, "Retiming Synchronous Circuitry", *Algorithmica* **6** (1991) — the register-conservation invariant and the iteration bound.
