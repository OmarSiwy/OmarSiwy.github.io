---
title: ILP for Arithmetic Design
description: "Map of the 2 ILP for Arithmetic Design notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, ilp-for-arithmetic-design, hub]
aliases:
  - ILP for Arithmetic Design
  - "7.2) ILP for Arithmetic Design"
---

# ILP for Arithmetic Design

**The specification.** Input: a combinatorial design question stated as decision
variables $\mathbf{x}$ — which adder, which shift, which word size, which
compressor — a linear objective $\mathbf{c}^{\mathsf T}\mathbf{x}$, and linear
constraints $\mathbf{A}\mathbf{x}\le\mathbf{b}$ encoding "this is a legal
circuit". Output: one of three answers, and confusing them is the classic
mistake — a *proven-optimal* assignment, *infeasible* meaning no legal circuit
exists **under those constraints**, or, after a time limit, the best legal
circuit found so far with no optimality proof (pp. 784–785). Accuracy is exact in
principle and in practice bounded by the solver's **integer feasibility
tolerance**, typically $10^{-5}$ and never to be set below $10^{-9}$, against a
practical dynamic range of about $10^{4}$ (p. 796). What is optimised is whatever
the objective row says — adder count, LUT count, coefficient word length, power.

This is the odd hub out. Every other topic here answers "how do I compute $f$";
this one answers "of the circuits that legally compute $f$, which is cheapest,
and can I *prove* it". The circuits themselves live in the topics below; what is
shared, and what is written down once here, is the encoding.

**Shared vocabulary.** Both notes are built from the same three gadgets, and it
is worth recognising them before reading either. Implication $x\to y$ is the
single row $x\le y$ (p. 792), which excludes exactly the one false row of the
truth table and costs no auxiliary variable — so implication *chains* are free,
and that is what makes the counter below linear. Exclusive choice is
$\sum_i x_i=1$ (p. 792), the "select exactly one of these options" workhorse, with
$\sum_i x_i\le 1$ as its "at most one" weakening. A conditional constraint
"$X=Y$ if $z=1$" becomes the **big-M** pair

$$Y-M+Mz \;\le\; X \;\le\; Y+M-Mz$$

which collapses to $X=Y$ at $z=1$ and is vacuous at $z=0$ provided
$M\ge|Y-X|$ everywhere (p. 793). Big-M is normally faster than a solver's native
indicator constraint, but it carries the topic's hard ceiling: $1/M$ must stay
above the feasibility tolerance, so $M\lesssim 10^{5}$, and past that size the
model has to fall back to native indicators and accept the slower solve
(pp. 793, 796).

### Boolean structure written as constraint rows

- [[Trailing Zero Counter]] – read it first, and read it as two things at once:
  it is a real circuit with a real critical path, and it is the smallest complete
  worked instance of the modelling art, where you can watch a monotone predicate
  chain replace a stack of wide ANDs and see the cost drop from quadratic to
  linear in the word size. The application that motivates it — minimising the
  *bit width* rather than the value of a fixed-point coefficient — is also the
  cleanest example of an objective that is combinatorial rather than arithmetic.

### A whole architecture as one feasibility problem

- [[Minimal-Adder Adder Graph]] – read it for a formulation carried end to end:
  variables, constraints, the outer loop over adder count, the returned
  assignment, and the check that the assignment really is the circuit. Read it
  especially for its two structural moves — ordering the adders to kill
  permutation symmetry, and freezing the parameter that makes the problem
  nonlinear so the residual is linear — because both are general, and for the
  honest account of where the method stops working.

### Where the method stops

Two limits end this approach, and recognising them early is worth more than a
better encoding. **Run time**: ILP is NP-hard, small instances solve in under a
second, and then there is a wall past which the optimum takes hours, days, or
memory the machine does not have (p. 795). The levers, in the order worth trying,
are to cut *variables* rather than constraints (constraints that shrink the
search space by excluding symmetric solutions speed it up even though the model
is nominally bigger), to set a time limit and renounce the optimality proof —
most of a run is spent proving, not finding — to declare integral-by-construction
variables real, and to warm-start from a heuristic (pp. 795–796).
**Numerics**: solvers work in binary64 even when every variable is binary, so a
returned assignment is not automatically a solution to your problem. Always
re-check it against the original constraints (p. 796).

### Where this sits

Upstream are the topics that pose the questions: [[Multiplication by Constants]],
[[Sums of Weighted Bits]], [[Multipliers]], [[Table-Based Function Evaluation]]
and [[LTI Filters]] each contain an NP-hard search that this book writes as an
ILP, which is the argument for learning the encoding once instead of five times.
[[Error Accuracy]] enters as a single linear row — the accumulated-error budget
becomes one constraint over the word-size decisions — and [[FPGAs]] supplies the
cost coefficients that turn "fewest adders" into "fewest LUTs". Downstream,
[[FloPoCo]] is where a solver actually gets called, which is why the same
generator can emit a proven-optimal operator on one machine and a heuristic one
on another.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024,
Appendix B "Optimization Using Integer Linear Programming", printed pp. 781–797:
B.1 linear programming problems pp. 782–784, B.2 solvers and tooling
pp. 784–787, B.3 practical problem modelling pp. 787–794, B.4 limitations
pp. 795–796. The gadget tables are B.1 p. 789 and B.2 p. 792. The worked
formulation is Sect. 12.1.4 "Minimal-Adder Constant Multiplication by Using ILP",
pp. 373–378. Cross-references collected on p. 781: compressor trees Sect. 7.3.3.2
p. 189, multiplication Sect. 8.4.3 p. 233, constant multiplication Sect. 12.1.4
p. 373, function approximation Sect. 17.2.11 p. 522 and Sect. 18.4.4 p. 566,
digital filters Chap. 23 p. 669.
