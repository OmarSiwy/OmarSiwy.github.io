---
title: Dividers
description: "Map of the 18 Dividers notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, dividers, hub]
aliases:
  - Dividers
  - "2.5) Dividers"
---

# Dividers

Division is where the two arithmetic families finally diverge. Addition and
multiplication have one right answer computed one way; division has two, and they
optimise opposite things.

**Inputs.** $X$ on $w_X$ bits and $D \neq 0$ on $w_D$ bits, fixed-point per
[[Number Formats]]. Most of the circuits below further require $D$ to be a
*normalized significand*, $D \in [1,2)$ — the singularity at $D \to 0$ is what makes
general fixed-point division expensive, and every escape from that restriction costs
hardware.
**Outputs.** A quotient $Q$ with ulp $u_Q = 2^{\ell_Q}$, and — digit recurrences only —
an **exact** remainder $R$ on the format of $D$, so $w_R = w_D$ whatever $\ell_Q$ you
asked for. In $X = QD + R$ the remainder *is* the rounding error, so an exact $R$ is a
correct rounding decision obtained for free.
**Accuracy.** Digit recurrence: exact, hence correctly roundable at no extra cost.
Multiplicative: faithful only, $|\delta_Q| = |Q - X/D| < 2^{-w_F-2}$ (9.46, p. 289) —
the error budget lives in [[Error Accuracy]].
**Optimised for.** Digit recurrence minimises **area** — one add/sub per cycle,
latency $\propto w_Q$. Multiplicative minimises **latency** — iteration count
$\propto \log w_Q$ — by spending the multipliers of [[Multipliers]].

Every choice below traces back to one line: *do you already own a multiplier, and do
you need the remainder?*

- [[Choosing a Divider]] – the trade-off table: latency, area, multiplier cost,
  self-correction and accuracy for all 18, with the source's own numbers. Read it
  first if you are picking rather than learning.

### Digit recurrence: subtract a multiple of $D$ every cycle

The recurrence $R_{i+1} = \beta R_i - q_{k-i-1}D$ is correct by construction; the
entire subject is the cost of choosing $q$, because the honest choice
$q = \lfloor \beta R_i / D \rfloor$ is itself a division.

- [[Restoring Division]] – the paper-and-pencil algorithm in gates, and the cheapest
  divider that exists. Start here; everything else is an attack on one of its costs.
- [[Non-Restoring Division]] – deletes the restore multiplexer by letting the
  remainder go negative. Read it for the first sight of a signed digit set doing work.
- [[SRT Division]] – the general redundant-digit recurrence and the selection-interval
  overlap argument that makes an *approximate* digit choice legal. The load-bearing
  derivation of the topic.
- [[Radix-4 Maximally Redundant Divider]] – the same machinery at
  $\gamma = \beta - 1$: what maximal redundancy buys, and the $3D$ term it costs.

### Making digit selection cheap

Redundancy converts "know $\beta R_i/D$ exactly" into "know it to within
$\varepsilon < 2\rho - 1$". These three spend that slack in different currencies.

- [[Quotient Digit Selection Table]] – the combinational block itself, its input
  widths, and the border cell whose mislabelling was the 1995 Pentium FDIV bug.
- [[Comparison-Based Digit Selection]] – replaces the table with parallel comparisons
  against multiples of $D$. Read it when $D$ is an arbitrary integer and no fixed-size
  table can exist.
- [[Divisor Prescaling]] – scales $D$ towards 1 so the selection function stops
  depending on $D$ at all. Read it before believing any very-high-radix divider.

**The P-D diagram.** Multiplying the selection condition
$-\rho \le \beta R_i/D - q_{-i} \le \rho$ through by $D$ turns each digit's validity
region into the wedge between the straight lines $\beta R_i = (k-\rho)D$ and
$\beta R_i = (k+\rho)D$; plotting $\beta R_i$ against $D$ draws all of them at once,
and that plot — partial remainder against divisor, also called a Robertson diagram —
is the P-D diagram (Fig. 9.5, p. 274). Because $\rho > 1/2$ the wedges *overlap*, by a
vertical extent $(2\rho-1)D$: the geometry of exactly the $\varepsilon < 2\rho - 1$
slack the three notes above spend. Truncating $D$ to $a$ bits and $\beta R_i$ to $b$
bits tiles the plane with $2^{-a} \times 2^{-b}$ rectangles, and a digit may be
assigned to a rectangle iff the whole rectangle lies inside one wedge — so it is the
overlap, and nothing else, that lets a few leading bits decide $q_{-i}$; with the
abutting intervals of a non-redundant digit set no rectangle ever fits, and the
boundary can be resolved only exactly, which is to say by dividing. One caveat is
visible only in the picture: the wedges narrow as $D \to 0$, which is why the diagram
is always drawn clipped at $D = 1/2$ and why the tables above presume a normalized
divisor.

### Shortening the iteration and the tail

- [[Carry-Save Partial Remainder]] – removes carry propagation from the loop, and
  hands the bill to digit selection. The dominant ASIC lever.
- [[On-the-Fly Quotient Conversion]] – removes the final carry-propagate subtraction
  that turns signed digits into binary, using concatenation only.
- [[Radix-64 Speculative Divider]] – all of the above stacked at once in one published
  double-precision design. Read it as the existence proof for how far latency can be
  bought with area.

### Multiplicative: approximate $1/D$, then multiply

A different family, sharing no hardware with the one above and producing no remainder.

- [[Division by Reciprocal]] – the framing note: the error split
  $\delta_Q = \delta_\text{mult} + X\delta_\text{recip}$ that sizes every guard bit in
  this group. Read it before any of the iterations.
- [[Reciprocal Seed Table]] – where all of them start, and why the seed is deliberately
  built to underestimate $1/D$.
- [[Newton-Raphson Reciprocal]] – $r_{i+1} = 2r_i - Dr_i^2$. Read it for why
  re-measuring the error against $D$ makes the iteration forgive its own rounding.
- [[Quadratic Series Divider]] – the same convergence with the squarer and the
  multiplier in parallel rather than in series, and a datapath that *shrinks*.
- [[Goldschmidt Division]] – two independent multiplications per step: pipelines
  beautifully, never corrects itself. The counter-example to self-correction.
- [[Halley Reciprocal Iteration]] – cubic convergence, for when the seed table is small
  and one step must finish the job.
- [[VFloat Ad Hoc Series Divider]] – a two-term expansion around a truncated divisor;
  the small-precision, DSP-block-shaped answer.

### The twin problem

- [[Newton-Raphson Square Root]] – $X = S^2 + R$ with $0 \le R < 2S+1$ is $X = QD + R$
  with the divisor replaced by a function of the running result, so every algorithm
  above has a square-root twin. This is the twin that matters in practice.

### Where this sits

Formats and the meaning of "faithful" come from [[Number Formats]] and
[[Error Accuracy]]; the redundant remainders of the fast recurrences are the
carry-save arithmetic of [[Sums of Weighted Bits]], and the multiplicative family is
almost entirely made of [[Multipliers]] and [[Squarers and Integer Powers]].
Downstream, [[Floating-Point Operators]] wraps these in exponent handling, and
[[Digit Recurrence for Algebraic Functions]] generalises the recurrence past $\sqrt{\cdot}$
to arbitrary algebraic functions. If $D$ is known at design time none of this applies —
go to [[Division by Constants]] instead. FPGA-specific packing, DSP blocks and the
`FPDiv` generator are in [[FPGAs]] and [[FloPoCo]].

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9,
"Fixed-Point Division", pp. 259–305.
