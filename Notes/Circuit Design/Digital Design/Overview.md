---
title: Digital Design
description: Digital logic from first principles through arithmetic units and ML-oriented architectures.
slug: digital-design
kind: topic
status: growing
aliases:
  - ECE 124
  - Introduction to Digital Design
order: 20
---

I took this course a while ago, but to be honest I lost all my notes, so I'm rewriting this as a small refresher and mental challenge to attempt to recall everything I learned.

Read in order — each part assumes the one before it.

## 0. Digital Logic

- 0.1 [[Boolean Algebra]]
- 0.2 [[Combinational Logic]]
- 0.3 [[Introduction to Flip-Flops & Latches]]
  - 0.3.1 [[Dual-Phase Latches]]
- 0.4 [[Synchronous Sequential Logic]]
- 0.5 [[Asynchronous Sequential Logic]]
  - 0.5.1 [[Moore]]
  - 0.5.2 [[Mealy]]

Applications, following the structure of de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024).

## 1. Foundations

- 1.1 [[Number Formats]]
  - 1.1.1 [[Fixed-Point Representations]]
  - 1.1.2 [[Redundant Number Systems]]
  - 1.1.3 [[Floating-Point Formats]] # IEEE 754 and the ML-oriented minifloats
  - 1.1.4 [[Logarithmic Number Systems]]
- 1.2 [[Error Accuracy]]
  - 1.2.1 [[Rounding]] # ulp, faithful vs. last-bit accuracy, HUB
  - 1.2.2 [[Error Analysis]] # error budgets, design-space exploration
- 1.3 [[FPGAs]]
  - 1.3.1 [[Lookup-Tables]] # BLEs, distributed memory, shift-register LUTs
  - 1.3.2 [[DSP Blocks]]
  - 1.3.3 [[Block Memory]]

## 2. Classic Arithmetic

- 2.1 [[Adders]]
  - 2.1.1 [[RCA, Ripple-Carry Adder]]
  - 2.1.2 [[CSA, Carry-Save Adder]]
  - 2.1.3 [[Carry-Select Adder]]
  - 2.1.4 [[CLA, Carry-Lookahead Adder]]
  - 2.1.5 [[Parallel Prefix Adders]]
    - 2.1.5.1 [[Kogge-Stone Tree]]
    - 2.1.5.2 [[Brent-Kung Tree]]
    - 2.1.5.3 [[Sklansky Tree]]
  - 2.1.6 [[Ternary Adders on FPGAs]]
- 2.2 [[Comparators]]
- 2.3 [[Sums of Weighted Bits]]
  - 2.3.1 [[Bit Heaps]]
  - 2.3.2 [[Compressor Trees]]
    - 2.3.2.1 [[Wallace Tree]]
    - 2.3.2.2 [[Dadda Tree]]
- 2.4 [[Multipliers]]
  - 2.4.1 [[Booth's Algorithm]] # signed and unsigned
  - 2.4.2 [[Multiplier Tiling]] # DSP-based construction on FPGAs
  - 2.4.3 [[Truncated Multipliers]]
  - 2.4.4 [[Karatsuba]]
- 2.5 [[Dividers]]
  - 2.5.1 [[Restoring Division]]
  - 2.5.2 [[Non-Restoring Division]]
  - 2.5.3 [[SRT Division]]
  - 2.5.4 [[Division by Reciprocal]] # Newton-Raphson
  - 2.5.5 [[Goldschmidt Division]]
  - 2.5.6 [[Square Root]]
- 2.6 [[Shifters]]
  - 2.6.1 [[Barrel Shifters]]
  - 2.6.2 [[Leading Zero Counters]]
  - 2.6.3 [[Normalizers]]
- 2.7 [[Floating-Point Operators]] # add, multiply, divide, sqrt, compare
- 2.8 [[Counters]]
  - 2.8.1 [[Synchronous Counters]]
  - 2.8.2 [[Asynchronous Counters]]

## 3. Operator Specialization

- 3.1 [[Multiplication by Constants]]
  - 3.1.1 [[Shift-and-Add]] # signed digit, minimal-adder graphs, ILP
  - 3.1.2 [[KCM, Table-Based Constant Multiplication]]
  - 3.1.3 [[Multiple Constant Multiplication]]
- 3.2 [[Division by Constants]]
- 3.3 [[Squarers and Integer Powers]]
- 3.4 [[Floating-Point Specialization]] # constant multiply, fused operators

## 4. Function Approximation

- 4.1 [[Fixed-Point Function Approximation]] # domain, range, monotonicity
- 4.2 [[Table-Based Function Evaluation]]
  - 4.2.1 [[Multipartite Methods]]
  - 4.2.2 [[Table-and-Addition Methods]]
- 4.3 [[Polynomial Approximation]]
  - 4.3.1 [[Remez Minimax]]
  - 4.3.2 [[Range Reduction]]
  - 4.3.3 [[Horner Evaluation]]
- 4.4 [[Digit Recurrence for Algebraic Functions]] # sqrt, cbrt, Euclidean norms

## 5. Composite Operators

- 5.1 [[CORDIC]] # fixed-point sine and cosine
- 5.2 [[Exact Accumulators]] # floating-point sum and sum-of-products
- 5.3 [[Floating-Point Exponential]]
  - 5.3.1 [[Fixed-Point Computation of eY]]

## 6. Application Domains

- 6.1 [[LTI Filters]] # arithmetic-driven FIR/IIR design
- 6.2 [[Arithmetic for Deep Learning]]
  - 6.2.1 [[Quantization]] # inference and training number formats
  - 6.2.2 [[Fast Convolution Algorithms]]
  - 6.2.3 [[TPU]]
- 6.3 [[Network-On-Chip]]

## 7. Tooling

- 7.1 [[FloPoCo]]
- 7.2 [[ILP for Arithmetic Design]]
