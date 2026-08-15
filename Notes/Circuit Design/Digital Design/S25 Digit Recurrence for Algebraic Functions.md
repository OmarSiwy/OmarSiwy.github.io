---
title: Digit Recurrence for Algebraic Functions
description: "Map of the 10 Digit Recurrence for Algebraic Functions notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, digit-recurrence-for-algebraic-functions, hub]
aliases:
  - Square Root
  - Digit Recurrence for Algebraic Functions
  - "4.4) Digit Recurrence for Algebraic Functions"
---

# Digit Recurrence for Algebraic Functions

An **algebraic function** is one defined implicitly by a polynomial equation in its own
result. $Q$ with $QD - N = 0$ is the linear case, and that is [[Dividers]]. $S$ with
$S^2 - M = 0$ is the quadratic case, and that is everything below.

**Input.** A fixed-point significand, $M \in [1,4)$ in `ufix(1,`$\ell$`)` for the square
root; other functions rescale the same way, and floating point reduces to it.
**Output.** $S_n \approx f(M)$ in `ufix(1,-n)`, one radix-$\beta$ digit per cycle,
most-significant first.
**Accuracy.** The recurrence carries an **exact** residual, so the raw result is a
round-down — error in $[0,1)$ ulp — and round-to-nearest, $\le \tfrac12$ ulp, costs
exactly one extra iteration rather than a second pass ([[Error Accuracy]]).
**Optimised for.** Area and per-iteration critical path. Latency is
$O(n / \log_2\beta)$ cycles and is the price paid.

Every circuit below follows from that line. No multiplier appears anywhere in the topic
because the digit set is small enough that "multiply by $d$" is a multiplexer; the
residual is kept carry-save because the per-iteration adder is the critical path; the
digit set is made redundant because deciding a digit from a carry-save number otherwise
needs a full carry propagation. What differs between them is only **how hard the
digit-selection inequality is to satisfy**.

Notation is shared across all ten, after Table 19.1, p. 574:

| Symbol | Meaning |
| --- | --- |
| $\beta$ | radix |
| $\gamma$ | digit-set parameter: digits live in $\{-\gamma,\dots,\gamma\}$ |
| $\rho = \gamma/(\beta-1)$ | redundancy factor, a property of the number system alone |
| $d_j$ | one radix-$\beta$ digit of the result |
| $S_i$ | partial result after $i$ digits |
| $W_i$ | scaled remainder; $\beta^i(M - S_i^2)$ for the square root |

- [[Choosing a Digit Recurrence]] – the trade-off table across all ten, plus digit
  recurrence against Newton-Raphson and against polynomial approximation, with the
  chapter's own numbers and an explicit mark on every entry it does not quantify.
  Read it first if you are picking rather than learning.

### Getting the operand into range

- [[Square Root Range Reduction]] – read it before anything else: it is why $M$ lives
  in $[1,4)$ and why the exponent path is a decrement and a one-bit shift, no adder.

### The binary square root, two ways

Radix 2, digits $\{0,1\}$, no redundancy anywhere. Both are small enough to hold in
your head, and the redundant machinery afterwards is an attack on their two costs.

- [[Restoring Square Root]] – the paper-and-pencil algorithm in gates. Start here for
  where the recurrence $W_{i+1} = \beta W_i - 2d\,S_i - \beta^{-i-1}d^2$ comes from and
  why appending a digit needs no adder.
- [[Non-Restoring Square Root]] – deletes the restore mux by keeping the *tentative*
  remainder as the state. Read it for the moment the digit becomes literally an
  inverted sign bit, and because it is the FPGA default.

### Buying a shorter iteration with redundancy

The critical path is the carry propagation inside the subtraction, and it grows with
$i$ as $S_i$ widens. Redundancy removes it — and hands the bill to three other blocks.

- [[SRT Square Root]] – the load-bearing derivation: redundant digit set, carry-save
  residual, and the selection-interval overlap that makes an approximate digit legal.
  The other three in this group exist only because this one needs them.
- [[Square Root Digit Selection Function]] – the combinational block itself. Read it
  for how few bits of a truncated, one-sided residual actually suffice, and why the
  boundaries move every iteration here but stand still for division.
- [[Square Root Seed Table]] – jumps the first $i_0$ iterations, and is the one place
  here where the wrong rounding mode makes a design *infeasible*, not just inaccurate.
- [[On-the-Fly Converter]] – turns the signed-digit result back into binary using
  concatenation only, by carrying a pre-decremented copy alongside. An ASIC idiom;
  read the FPGA caveat in it before assuming radix 4 wins.

### The same recurrence, harder equations

- [[Digit-Recurrence Cube Root]] – one degree up. Read it for the trick that keeps a
  multiplier out even though $S_i^2$ now appears in the recurrence, and for the
  chapter's only quantified head-to-head against a multiplier-based design.
- [[Digit-Recurrence Euclidean Norm]] – $\sqrt{X^2+Y^2+Z^2}$ in one pass. Read it for
  a residual that is deliberately *inexact*, and what that forces on the digit set.
- [[E-Method]] – the generalisation: a vector recurrence on $\mathbf{A}\mathbf{y} =
  \mathbf{b}$ that evaluates a rational function with neither multiplier nor divider.
  Read it last, and read its convergence conditions before believing it applies.

### Where this sits

[[Dividers]] is the linear case and the parent of every idea here — SRT, carry-save
remainders and on-the-fly conversion were all invented there first. Formats and the
redundant representations come from [[Number Formats]] and [[Sums of Weighted Bits]],
the ulp bookkeeping from [[Error Accuracy]], the normaliser from [[Shifters]]. The
competition is [[Polynomial Approximation]], and for the 2D norm [[CORDIC]]; downstream,
[[Floating-Point Operators]] wraps these in exponent handling and [[FloPoCo]] generates
them.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 19,
"Digit Recurrence for Algebraic Functions", pp. 573–595.
