---
title: Digital Design
description: "Digital logic from first principles through arithmetic units and ML-oriented architectures."
kind: hub
status: seed
spade: n/a
tags: [digital, hub]
aliases:
  - ECE 124
  - Introduction to Digital Design
  - Digital Design
---

# Digital Design

I took this course a while ago, but to be honest I lost all my notes, so I'm rewriting this as a small refresher and mental challenge to attempt to recall everything I learned. [[Overview]] is the reading order in prose; this note is the same seven parts as a map of the vault, one link per hub, 34 hubs and a little over 500 circuits underneath them.

Read in order — each part assumes the one before it. Parts 1 through 7 follow de Dinechin & Kumm; part 0 is the ordinary digital-logic course that has to come first, because none of the arithmetic makes sense before gates, timing and state do.

### 0. Digital Logic

- [[S1 Boolean Algebra]] – switching functions, canonical forms, minimisation and the cost model everything downstream inherits; 7 notes.
- [[S2 Combinational Logic]] – decoders, muxes, encoders and the standard blocks a datapath is assembled from; 12 notes.
- [[S3 Flip-Flops and Latches]] – how state is captured, and the setup/hold/metastability accounting that decides a clock period; 12 notes.
- [[S4 Dual-Phase Latches]] – two-phase and pulsed-latch timing, time borrowing, and why latches survive where flip-flops are wasteful; 8 notes.
- [[S5 Synchronous Sequential Logic]] – Moore and Mealy machines, state assignment, encoding and datapath-plus-control; 13 notes.
- [[S6 Asynchronous Sequential Logic]] – fundamental-mode and handshake styles, hazards, races, and clock-domain crossing; 15 notes.

### 1. Foundations

- [[S7 Number Formats]] – fixed-point, redundant, floating-point and logarithmic representations, and what each costs in hardware; 10 notes.
- [[S8 Error Accuracy]] – ulps, rounding modes, faithful versus correct rounding, and the error budget that sizes every approximation; 10 notes.
- [[S9 FPGAs]] – LUTs, carry chains, DSP blocks and block RAM as the primitives that reverse half the classical asymptotics; 11 notes.

### 2. Classic Arithmetic

- [[S10 Adders]] – the carry chain and every way to shorten it, from ripple through parallel-prefix trees to hardened FPGA chains; 25 notes.
- [[S11 Comparators]] – equality and magnitude as degenerate subtractions, and the prefix structures they reuse; 7 notes.
- [[S12 Sums of Weighted Bits]] – bit heaps, compressors and Wallace/Dadda trees: the generalisation that makes multipliers a special case; 16 notes.
- [[S13 Multipliers]] – partial-product generation, Booth recoding, DSP tiling, Karatsuba and truncation; 17 notes.
- [[S14 Dividers]] – restoring, non-restoring and SRT recurrences against the multiplicative Newton and Goldschmidt families; 18 notes.
- [[S15 Shifters]] – barrel and logarithmic shifters, leading-zero counting and normalisation; 16 notes.
- [[S16 Floating-Point Operators]] – add, multiply, divide, square root and compare, built out of the fixed-point pieces above; 18 notes.
- [[S17 Counters]] – binary, LFSR, Johnson, Gray and prescaled counters, and where a counter beats an adder; 17 notes.

### 3. Operator Specialization

- [[S18 Multiplication by Constants]] – shift-and-add graphs, signed-digit recoding, KCM tables and multiple-constant sharing; 20 notes.
- [[S19 Division by Constants]] – reciprocal multiplication, Euclidean and modular tricks that turn a divider into a few adders; 8 notes.
- [[S20 Squarers and Integer Powers]] – the symmetry that halves a multiplier's partial products, and the powers it extends to; 11 notes.
- [[S21 Floating-Point Specialization]] – constant multipliers, fused operators and format-specific shortcuts in floating point; 16 notes.

### 4. Function Approximation

- [[S22 Fixed-Point Function Approximation]] – domain and range analysis, monotonicity, and the framework the next three hubs plug into; 11 notes.
- [[S23 Table-Based Function Evaluation]] – plain ROM, bipartite and multipartite tables, and table-and-addition methods; 12 notes.
- [[S24 Polynomial Approximation]] – Remez minimax, range reduction, Horner and the coefficient quantisation problem; 15 notes.
- [[S25 Digit Recurrence for Algebraic Functions]] – square root, cube root, Euclidean norm and the E-method, one digit per cycle; 10 notes.

### 5. Composite Operators

- [[S26 CORDIC]] – shift-add rotations for sine, cosine and their friends, iterative through fully unrolled; 10 notes.
- [[S27 Exact Accumulators]] – long accumulators and Kulisch-style sums that make floating-point summation order-independent; 12 notes.
- [[S28 Floating-Point Exponential]] – the full $e^x$ operator: argument reduction, the fixed-point core, reconstruction; 14 notes.
- [[S29 Fixed-Point Computation of eY]] – the core that exponential sits on, factored out because it is reusable on its own; 9 notes.

### 6. Application Domains

- [[S30 LTI Filters]] – FIR and IIR structures designed from the arithmetic outwards rather than from the transfer function inwards; 13 notes.
- [[S31 Arithmetic for Deep Learning]] – quantised MACs, ternary and XNOR neurons, Winograd convolution, pooling and systolic arrays; 16 notes.
- [[S32 Network-On-Chip]] – routers, arbiters, crossbars, flow control and topology, for when the operators outgrow one wire bundle; 22 notes.

### 7. Tooling

- [[S33 FloPoCo]] – the operator generator this material was mostly written around, and its frequency-directed pipelining; 6 notes.
- [[S34 ILP for Arithmetic Design]] – posing adder graphs and compressor trees as integer programs and letting a solver do the search; 2 notes.

### How to read the vault

The `S`-numbered notes are **maps, not content** — each one states the specification its topic answers to, then lists its circuits in the order they make sense in. Nothing is derived twice: a hub establishes the shared framing once and every circuit under it links back rather than repeating it.

Each topic that holds a real choice carries a **`Choosing a …` note** — [[Choosing an Adder]], [[Choosing a Multiplier]], [[Choosing a Number Format]], and thirty more. Those are the only places latency, area and FPGA timing numbers live, deliberately, so that comparisons stay in one file and cannot drift apart. A hub tells you what exists; a `Choosing` note tells you which one.

Every circuit note ends in a **Spade block that was compiled**, and — wherever the circuit computes a value rather than merely routing one — **simulated against a behavioural reference** before it shipped. Structural blocks with no arithmetic meaning stop at compilation. If a note says `spade: not-expressible`, the compiler error quoted in it is a real one, run and pasted, not paraphrased.

## References

de Dinechin, F. & Kumm, M. *Application-Specific Arithmetic: Computing Just Right for the Reconfigurable Computer and the Dark Silicon Era*. Springer, 2024 — the source for parts 1 through 7 and their ordering. Part 0 follows the standard digital-logic canon (Mano & Ciletti; Wakerly; Weste & Harris).
