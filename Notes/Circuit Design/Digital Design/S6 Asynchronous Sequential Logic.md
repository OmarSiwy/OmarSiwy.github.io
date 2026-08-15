---
title: Asynchronous Sequential Logic
description: "Map of the 15 Asynchronous Sequential Logic notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, asynchronous-sequential-logic, hub]
aliases:
  - "Handshake Ready-Valid"
  - Asynchronous Sequential Logic
  - "0.5) Asynchronous Sequential Logic"
---

# Asynchronous Sequential Logic

**Inputs:** $n$ level-sensitive lines $x$, or a $k$-bit datum accompanied by a $\{\text{req},\text{ack}\}$ pair.
**Outputs:** $m$ lines $z$, plus $s$ *secondary* variables $y$ fed back into the same combinational network, so that state exists without a register.
**Correctness promise — there is no ulp here, and that is the point.** Every allowed input change must drive the circuit to the *unique* next state its specification names, for **arbitrary positive gate and wire delays**: no static hazard on an excitation, no critical race, no essential hazard, no unacknowledged transition. A synchronous design buys that promise with one number, $T_{\text{clk}} \ge t_{pd,\max} + t_{\text{setup}} + t_{\text{skew}}$; remove the clock and it becomes fifteen separate structural obligations, which is what the notes below are.
**Optimised for:** average-case latency and dynamic energy — the circuit finishes when it is done, not when an edge says it may be. Paid for in area, spectral predictability, testability, and design effort.

Two contracts sit underneath everything and are stated once here so no note re-derives them. The **fundamental-mode assumption** — inputs change one variable at a time and no further change arrives until the circuit is stable — is a constraint on the *environment*, not the circuit, and it is the async analogue of a clock period. The **isochronic fork** — when a wire forks, the branch delays differ by much less than a gate delay — is the single timing assumption that separates buildable QDI from provably-useless pure delay-insensitivity. Every note that relaxes one says which one.

### Start here

- [[Choosing an Asynchronous Style]] — the trade-off table across all fifteen, plus the four constraints that actually decide: is the block duty-cycled, is the delay spread data-dependent, does the wire dominate the logic, is switching activity a security requirement. Read it before any individual note, and read it again after; the hub deliberately does not duplicate it.

### The classical feedback machine

The 1950s theory, and still the only vocabulary for what goes wrong.

- [[Huffman Feedback Model]] — the object every other note is a special case of: one combinational network closed through its own lumped delays. Start here for what a *state* even means without a clock, and for the flow-table machinery that specifies one.
- [[Race-Free State Assignment]] — read for why the obvious binary encoding is a functional bug, not a timing margin, and why race freedom is a graph-embedding question about the $s$-cube rather than a counting question about $2^s \ge k$.
- [[Asynchronous Cycle]] — the escape when the graph does not embed: route a distance-2 move through unused codes one bit at a time. Read for the cost, and for the failure mode where a cycle with no stable end becomes a ring oscillator you did not ask for.

### The rendezvous primitive and the pipelines built from it

Once you stop specifying a machine and start composing stages, everything reduces to one gate.

- [[Muller C-Element]] — the one state-holding primitive async gets for free. Read it before any pipeline note; its hazard-free cover is the consensus argument from [[Boolean Algebra]] doing structural work, and it is the term every synthesis tool wants to delete.
- [[Muller Pipeline]] — what a chain of those gates does on its own: correct for any gate delay, no matched delays anywhere, self-initialising. Read for the occupancy price, which is where the "half the stages are bubbles" figure comes from.
- [[Micropipeline]] — Sutherland's version, with latches hung off the C-element outputs. Read for how a control chain becomes a datapath, and for what event-sensitive storage costs.

### Protocols on the two control wires

The same $\{\text{req},\text{ack}\}$ pair, three different bargains with timing.

- [[Bundled-Data Interface]] — read first of the three: it keeps an ordinary single-rail datapath and pays for it with one timing assumption per stage. This is what actually gets built, on ASIC and especially on FPGA.
- [[Four-Phase Handshake]] — return-to-zero level signalling. Read for why latch control reduces to a wire, and why half the protocol does no useful work.
- [[Two-Phase Handshake]] — transition signalling instead. Read for the one situation where it wins outright — long wires, where transitions dominate and storage cost does not — and be honest about how rarely that is your situation.

### Encodings that carry their own validity

Delete the timing assumption by moving validity into the data. This is where the area goes.

- [[Dual-Rail Encoding]] — two wires and a spacer code per bit. Read for how a timing assumption becomes an area cost, and for the switching activity that is data-*independent*, which is simultaneously the power argument against it and the side-channel argument for it.
- [[1-of-4 Encoding]] — the same wire count carrying twice the payload per transition. Read as the cheap refinement of the previous note, not as a separate philosophy.
- [[Completion Detection Tree]] — the circuit that turns a self-validating encoding into an actual `done` signal. Read for why the tree lands on the critical path, and why a four-phase dual-rail tree is built from C-elements rather than ANDs.

### The two things you have to physically build

Everything else is logic. These are not, which is why they are where async designs actually fail.

- [[Matched Delay Line]] — the deliberate delay that makes bundled data legal, and the one component the whole toolchain is trying to optimise away. Read alongside [[FPGAs]]: a carry-chain delay with a location constraint is the only version that survives a router.
- [[Mutual Exclusion Element]] — read this one even if you never build an async block. Two independent requests cannot be arbitrated in bounded time; the mutex does not remove metastability, it confines and filters it, and that impossibility is a theorem rather than a tooling gap.

### What actually ships

- [[Asynchronous FIFO]] — Gray-coded pointers through synchronisers. Read last: it is the whole topic collapsed into the one structure every RTL engineer builds, where a race-free unit-distance assignment does real work and nothing else from this hub appears. If you read exactly two notes here, read this one and [[Choosing an Asynchronous Style]].

### Where this topic sits

[[Synchronous Sequential Logic]] is the alternative that won, and its state-encoding notes are the same $d_H$ argument with a clock covering the mistakes; [[Combinational Logic]] supplies the hazard taxonomy and hazard-free covers that every excitation here must satisfy. [[Flip-Flops and Latches]] is downstream in the historical sense — an edge-triggered cell *is* a solved essential-hazard problem, which is why it is never re-synthesised from its own truth table. [[Network-On-Chip]] is the live consumer: long inter-router links with no shared clock are exactly the case that favours transition signalling, and every clock-domain crossing anywhere is an async problem no synchronous technique makes go away.

## References

No assigned book source for this topic; the long-form note it replaces was written from standard digital-design canon.

- S. H. Unger, *Asynchronous Sequential Switching Circuits* — fundamental mode, race classification, the three-change essential-hazard test.
- M. M. Mano & M. D. Ciletti, *Digital Design*, ch. 9 — flow tables, primitive tables and merger diagrams, race-free assignment.
- J. F. Wakerly, *Digital Design: Principles and Practices* — feedback sequential circuits, cycles.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design*, ch. 2–3 — handshake protocols, bundled data vs. dual-rail, Muller pipelines, QDI.
- I. E. Sutherland, "Micropipelines" (Turing Award lecture) — two-phase transition signalling.
- A. J. Martin, on the limitations of delay-insensitive circuits — the isochronic-fork argument.
- N. Weste & D. Harris, *CMOS VLSI Design*, ch. 10 — C-element circuit forms, mutex, clock-tree power, CDC.
