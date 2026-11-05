---
title: Exhaustive Testing
description: How I test simulators, compilers and kernels before a release. A primer on the kinds of testing, why branch coverage plus fuzzing is not enough, the oracle-first stack I build instead, and the numbers a release has to show.
publishedAt: 2026-10-21
updatedAt: 2026-10-21
slug: exhaustive-testing
tags:
  - engineering
  - testing
draft: false
---
Richard Hipp ranks where a project's bugs get found, and Andrew Kelley repeated the list at Systems Distributed '26:

1. whatever developers happen to hit
2. whatever users happen to report
3. full machine-code branch coverage
4. fuzzing with properties checked
5. LLM review

Rungs 1 and 2 are luck. The claim that caught my attention was Kelley's: do 3 and 4 and you stop getting bug reports, because you have tested everything. SQLite is the source of the claim, and SQLite's own history refutes the strong form. 100 percent branch coverage in 2009, and the bug reports from Android stopped. Then coverage-guided fuzzers arrived and found more, because a suite tuned to reach every branch is exactly what a fuzzer flips in creative ways. SQLite wrote its own fuzzer and those stopped. Then Manuel Rigger's query partitioning found more: wrap a query that returned a row as a subquery with a filter, and the same row must come back. No crash, no assertion, a wrong answer. Then LLMs found a million-row input that overflowed the C stack inside SQLite's own quicksort. Figure 1 is that timeline.

```tikz title="Figure 1. SQLite's four stages of bug elimination, and the bug class each new stage found that the previous one could not. Every arrow is a new oracle or a new input distribution. None of them is more coverage."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=black!4] (0,1.9) rectangle (3,3.3);
  \node[align=center] at (1.5,2.6) {\textbf{100\% MC/DC}\\{\scriptsize 2009}};
  \draw[fill=black!4] (3.6,1.9) rectangle (6.6,3.3);
  \node[align=center] at (5.1,2.6) {\textbf{coverage-guided}\\\textbf{fuzzing}\\{\scriptsize 2014}};
  \draw[fill=black!4] (7.2,1.9) rectangle (10.2,3.3);
  \node[align=center] at (8.7,2.6) {\textbf{query}\\\textbf{partitioning}\\{\scriptsize 2019}};
  \draw[fill=black!4] (10.8,1.9) rectangle (13.8,3.3);
  \node[align=center] at (12.3,2.6) {\textbf{LLM review}\\{\scriptsize 2025}};
  \draw[->] (3,2.6) -- (3.6,2.6);
  \draw[->] (6.6,2.6) -- (7.2,2.6);
  \draw[->] (10.2,2.6) -- (10.8,2.6);
  \node[align=center,font=\scriptsize] at (1.5,1.1) {bug reports from\\Android stopped};
  \node[align=center,font=\scriptsize] at (5.1,1.1) {branches a human\\suite never flipped};
  \node[align=center,font=\scriptsize] at (8.7,1.1) {wrong rows,\\no crash};
  \node[align=center,font=\scriptsize] at (12.3,1.1) {stack overflow on a\\million-row input};
\end{circuitikz}
\end{document}
```

Each stage was overtaken by the same move, a **new oracle** or a **new input distribution**, never more coverage. A path that runs and returns the wrong number passes rung 3 and rung 4 both. So I build the plan around oracles first and inputs second, treat every bug from rungs 1, 2 and 5 as evidence that the oracle set is incomplete, and give each one a new oracle or a new generator feature rather than an example test. Kelley adds the caveat his slide left out: a non-trivial change sends you back to the top of the list, so the whole stack has to be cheap to rerun.

An **oracle** is the independent thing that says "this output is wrong". Every test layer names its oracle, or it is not a test.

## A primer: the kinds of testing

One paragraph each, with what the technique catches, what it misses, and what its oracle is.

**Example tests** (unit and integration tests) call a function with a chosen input and compare the result to a hand-worked value from a spec, a paper or a datasheet. They catch the behaviour you thought of and regressions of known bugs. They miss everything you did not think of. The oracle is the worked value, and it must never be recomputed the way the code computes it, or the test passes by construction.

**Assertions in production code** are contracts: a precondition on entry, a postcondition on exit, an invariant in between. They catch corruption at the moment it happens instead of three modules later, and they multiply every other technique, because a fuzzer or a simulator can only see what a crash or an assertion flags. They miss whatever the invariant does not state.

**Coverage** (line, branch, MC/DC, machine-code branch) measures what executed. It catches nothing directly. It is a map of what never ran, with no oracle of its own, and 100 percent coverage with weak assertions finds nothing. Brian Marick's heuristic is the right use: a suite that is weak in a way coverage can detect is probably also weak in a way it cannot.

**Fuzzing** mutates inputs, keeps the ones that reach new code, and reports crashes, hangs, leaks and assertion failures on inputs no human would write. Structure-aware fuzzing generates valid structure, a grammar or a typed value, so the fuzzer explores semantics instead of parse errors. It misses silent wrong output unless the harness checks a property or a reference.

**Property-based testing** generates inputs and checks an invariant: a round trip, idempotence, commutativity, conservation, agreement with a simple model. The stateful form generates operation sequences against the real system and a model, such as a hash map standing in for a database, and compares after each step. Failures shrink to a minimal case. It misses what the property does not say and the deep states random generation rarely reaches.

**Differential testing** runs the same input through two implementations and flags disagreement: another tool, a naive version, the scalar loop against the SIMD one, the CPU against the GPU, yesterday's build against today's. It catches wrong output without knowing the right answer, and misses bugs both sides share.

**Metamorphic testing** is for when no answer is known. A known transformation of the input must change the output predictably: renumber the nodes and the voltages are identical; scale every impedance by k and the currents scale by 1/k; translate a layout and the violations translate with it.

**Certificates** exploit the fact that checking an answer is cheaper than finding it. A linear solve is checked by its scaled residual, a circuit solution by its KCL residual, a derivative by a finite difference, a SAT answer by its proof. The oracle is independent of the algorithm, and it scales with the conditioning of the problem.

**Exhaustive testing** enumerates every input of a small domain: all 256 bytes, all 65,536 half-words, all four billion floats for an elementary function, every length from 0 to three times a vector width. It beats random generation whenever the domain fits.

**Deterministic simulation** runs a stateful or concurrent system single-threaded against a simulated clock, disk and network driven by one seed, injects faults, and checks invariants. Any failure replays exactly from its seed. The system has to be built for it: every source of nondeterminism goes through an injectable interface.

**Fault injection** makes the environment fail on purpose: the Nth allocation returns out-of-memory, the Nth I/O call errors, a matrix is singular. **Sanitizers and safety modes** catch undefined behaviour, races and memory errors as they happen.

**Mutation testing** breaks the code on purpose, one operator at a time, and checks that some test fails. It is the only technique that measures whether tests check outputs rather than merely execute code.

**Snapshot tests** diff output against a stored file and catch unintended change. A snapshot is only as good as its provenance, and a wrong output that got blessed stays wrong.

**Formal methods**, in their lightweight form, prove a property for all inputs up to a bound (Kani for Rust) or validate each compiler transformation against its input (Alive2 for LLVM, which found 47 new bugs and led to eight corrections of the language reference). Worth it for small pure kernels.

Three of those shapes do most of the work in numerical software, and Figure 2 draws them.

```tikz title="Figure 2. The three oracle shapes that carry a simulator. Differential: a second implementation must agree within a tolerance. Metamorphic: a transformed input must give a predictably transformed output, with no reference needed. Certificate: the answer is checked by a computation cheaper and simpler than the one that produced it."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % differential
  \node[font=\scriptsize] at (1.5,3.1) {\textbf{differential}};
  \node at (0,2.2) {$x$};
  \draw[fill=black!4] (0.8,1.9) rectangle (1.7,2.5); \node at (1.25,2.2) {$f$};
  \draw[->] (0.25,2.2) -- (0.8,2.2); \draw[->] (1.7,2.2) -- (2.4,2.2); \node at (2.7,2.2) {$y$};
  \node at (0,0.9) {$x$};
  \draw[fill=black!4] (0.8,0.6) rectangle (1.7,1.2); \node[font=\scriptsize] at (1.25,0.9) {ref};
  \draw[->] (0.25,0.9) -- (0.8,0.9); \draw[->] (1.7,0.9) -- (2.4,0.9); \node at (2.7,0.9) {$y'$};
  \draw[<->] (2.7,1.95) -- (2.7,1.15) node[midway,right,font=\scriptsize] {$|y-y'| \le \mathrm{tol}$};
  % metamorphic
  \node[font=\scriptsize] at (6.3,3.1) {\textbf{metamorphic}};
  \node at (4.2,2.2) {$x$};
  \draw[fill=black!4] (6.4,1.9) rectangle (7.3,2.5); \node at (6.85,2.2) {$f$};
  \draw[->] (4.45,2.2) -- (6.4,2.2); \draw[->] (7.3,2.2) -- (8,2.2); \node at (8.3,2.2) {$y$};
  \node at (4.2,0.9) {$x$};
  \draw[fill=black!4] (4.8,0.6) rectangle (5.5,1.2); \node at (5.15,0.9) {$T$};
  \draw[->] (4.45,0.9) -- (4.8,0.9); \draw[->] (5.5,0.9) -- (6.4,0.9);
  \draw[fill=black!4] (6.4,0.6) rectangle (7.3,1.2); \node at (6.85,0.9) {$f$};
  \draw[->] (7.3,0.9) -- (8,0.9); \node at (8.3,0.9) {$y'$};
  \draw[<->] (8.3,1.95) -- (8.3,1.15) node[midway,right,font=\scriptsize] {$y' = T'(y)$};
  % certificate
  \node[font=\scriptsize] at (11.3,3.1) {\textbf{certificate}};
  \node at (9.8,2.2) {$x$};
  \draw[fill=black!4] (10.6,1.9) rectangle (11.5,2.5); \node at (11.05,2.2) {$f$};
  \draw[->] (10.05,2.2) -- (10.6,2.2); \draw[->] (11.5,2.2) -- (12.2,2.2); \node at (12.5,2.2) {$y$};
  \draw[fill=black!4] (10.6,0.6) rectangle (12.3,1.2); \node[font=\scriptsize] at (11.45,0.9) {check$(x, y)$};
  \draw[->] (9.8,1.95) -- (9.8,0.9) -- (10.6,0.9);
  \draw[->] (12.5,1.95) -- (12.5,1.2);
  \draw[->] (12.3,0.9) -- (12.9,0.9); \node[font=\scriptsize,anchor=west] at (12.9,0.9) {ok};
  \node[font=\scriptsize] at (11.45,0.2) {cheaper than $f$};
\end{circuitikz}
\end{document}
```

## What coverage plus fuzzing cannot catch

The classes that rungs 3 and 4 miss by construction, each with what fills the gap:

| Bug class | Why rungs 3 and 4 miss it | What catches it |
|---|---|---|
| Wrong output that does not crash | coverage measures execution; a fuzzer sees only crashes and assertions | differential, metamorphic and certificate oracles; dense assertions; mutation testing |
| Code that should exist and does not | coverage tools work on the code they are given | tests written from the spec; a reference implementation |
| A spec misread shared by code and tests | 100 percent coverage of the wrong behaviour is achievable | an oracle written independently of the code: ngspice, KLayout, the language reference |
| Value-dependent errors: cancellation, overflow at one input | branch coverage is value-agnostic; Csmith's 10,000 random programs moved GCC branch coverage by 0.85 percent while finding many bugs | ULP tolerances, exhaustive small domains, convergence-order checks |
| Performance and resource exhaustion | neither technique measures time or stack; fuzzers prefer small inputs | benchmarks with thresholds, adversarial-size inputs, explicit bounds |
| Concurrency interleavings | coverage is per thread; two covered branches do not cover their interleaving | deterministic simulation, `loom`, TSan, `jobs=1` against `jobs=N` |
| Target and build nondeterminism | coverage on one target says nothing about another | every shipped ISA, CPU against GPU with tolerance, byte-identity checks |
| Feature combinations | one "best" configuration suppresses behaviours; swarm testing found 42 percent more distinct compiler crashes than a tuned default | randomly disabled features per run |
| Deep state | fuzzers rarely reach long stateful sequences | model-based tests and simulation |

Rungs 3 and 4 are hygiene for anything parser- or compiler-shaped, and SQLite shows they shrink rungs 1 and 2 dramatically. They are not sufficient. A plan that stops there has a hole exactly the size of "wrong number, no crash", which in a simulator is the main bug class.

## Building the stack

Seven steps, each with a done condition.

**1. Read the project.** README, build file, `tests/`, CI, roadmap. Done when I can say in one sentence each what the input language is, what the output is, and what "correct" means for it.

**2. Classify into domains.** A simulator is a compiler (the netlist front end) plus a numerical solver plus a GPU target. Each domain has its own bug classes and its own stack, below. Done when every component maps to at least one domain.

**3. List the bug classes and assign each an oracle.** Crash-class bugs are covered by assertions, sanitizers and fuzzing. Silently wrong bugs need a real oracle, chosen cheapest first:

| Oracle | Use when |
|---|---|
| Assertions in production code | always; they turn silent corruption into a crash a fuzzer can see |
| Reference implementation | another tool, the naive version, the scalar path or the CPU path exists |
| Round trip | parse and print, encode and decode, serialize and load |
| Certificate | a solver output is cheaper to verify than to produce |
| Metamorphic relation | no exact answer exists, but a transformation has a known effect |
| Model | a stateful system; a simple in-memory model defines legal behaviour |
| Golden file | the output is stable and was reviewed once, with its provenance recorded |
| Spec example | a hand-worked value from a standard, paper or datasheet |

Done when every bug class has an oracle, and no oracle recomputes the answer the way the code under test does.

**4. Build the layers, cheapest first,** and stop when the exit criteria hold:

1. Assertions in production code, with safety checks on in test builds.
2. Example tests at public seams: every spec example, every past bug.
3. Property and differential tests with generated inputs and shrinking.
4. Coverage-guided fuzz targets at every untrusted-input boundary, using the property and differential checks as the fuzz oracle.
5. Exhaustive tests for every small domain.
6. Deterministic simulation for anything stateful or parallel.
7. Fault injection: every allocation fails once, I/O errors, timeouts.
8. Coverage, as a gap finder. Every uncovered branch is tested, proven unreachable with an assertion, or deleted.
9. Non-functional checks: benchmarks with thresholds, adversarial sizes, run twice and compare bytes, parallel against sequential, every shipped target.
10. Mutation testing, to check that the layers above can fail.

Done when each bug class names a layer and a file.

**5. Gate it.** A slow gate gets bypassed, so fast tiers stay fast. A flaky test makes its gate meaningless, so it is fixed or quarantined the same day, never retried silently.

| Tier | Budget | Contents |
|---|---|---|
| Pre-commit | under 10 s | format, compile, fast unit and property tests at low iteration counts |
| Merge, required | under 15 min | all example, property and differential tests; sanitizers; every target; fuzz corpus replay; short fuzz on changed targets; coverage must not drop |
| Nightly | hours | long fuzz, many simulation seeds, high-iteration properties, mutation testing, benchmarks, reference-tool differential, GPU runners |
| Release | unbounded | the checklist, the full target matrix, the full fixture set against reference tools |

Main always passes, so the merge queue tests the merged result before it lands. The fuzz corpus lives in the repo and is replayed at merge, and every fuzz or simulation failure becomes a checked-in input. The first check is whether CI runs the tests at all. A suite that never runs automatically is not a gate.

**6. Write the exit criteria as numbers.** They close this article.

**7. Write it down** as `TESTING.md` in the repo: domains, the bug-class-to-oracle-to-layer table, harness sketches, the gate table, the criteria, and every gate runnable from one command.

## Oracles by domain

What the stack looks like in the systems I ship.

### Numerical solvers and simulators

The main bug class is a wrong number inside the plausible range, so certificates come first, and they live inside the solver as assertions so every other layer inherits them. After every converged point in a test build, recompute the KCL residual with an independent, plain evaluation of the device currents and assert it is under `abstol + reltol * max|I|`. After every sparse LU solve, assert the LAPACK-style scaled residual `‖Ax − b‖ / (‖A‖ ‖x‖ ε)` is under a threshold; LAPACK's own tests use 30, and the ratio scales with conditioning instead of against a stored answer. For every device model, draw random terminal voltages inside the model's range and compare the analytic Jacobian against central differences with step `h ≈ sqrt(ε) · max(|v|, 1)` at a relative tolerance near 1e-5. A wrong derivative converges slowly or to the wrong answer, silently, so this is the cheapest oracle that catches the most. In Zig 0.17 it is a fuzz test whose generator is `Smith`:

```zig
fn jacMatchesFd(_: void, s: *std.testing.Smith) anyerror!void {
    const model = models.all[s.index(models.all.len)];
    var v: [model.max_terminals]f64 = undefined;
    for (v[0..model.terminals]) |*x| x.* = @as(f64, @floatFromInt(s.valueRangeAtMost(i32, -3000, 3000))) * 1e-3;
    const params = model.randomParams(s); // within declared ranges
    try checkJacobianFd(model, params, v[0..model.terminals], .{ .rtol = 1e-5, .atol = 1e-12 });
}
test "device jacobian == finite difference" {
    try std.testing.fuzz({}, jacMatchesFd, .{});
}
```

Then analytic cases with closed forms (RC step, RLC resonance), and the Method of Manufactured Solutions for integrators: pick the solution, derive the forcing term, run at three step sizes, and assert the observed order `p = log2(e_h / e_{h/2})` is within 0.2 of theory, order 1 for backward Euler and 2 for trapezoidal. Checking the order catches a bug that checking the error does not.

Then the differential corpus. Every fixture deck sits beside an oracle record naming where its numbers came from, so a reviewer can rerun it: `analytic` with the derivation written out, or a reference simulator with its version, exact command and the deck's hash, so editing the deck without regenerating the oracle fails as stale. Tolerances are per column, mixed absolute and relative, and they follow the oracle's own accuracy. ngspice accepts an iterate at `reltol = 1e-3`, so comparing against it at `1e-6` compares its iteration noise. The analytic oracle wins wherever a derivation exists, because it is the only one that cannot share the engine's modelling mistake. A deck whose feature is missing carries a header line:

```
* KNOWN GAP: an LTRA under .ac stamps its DC series resistance, not the frequency-dependent two-port (#111)
```

The runner reports it as an expected failure and keeps the run green. When the deck starts passing, the run fails until someone deletes the line. An unsupported feature is a failure, never a skip, and there is no separate list of failing decks to drift out of date.

Metamorphic relations run nightly over the whole corpus. Figure 3 shows the simplest two. Renumber nodes and reorder elements: identical results. Scale R and L by k and C by 1/k with the current sources scaled: currents scale by 1/k. Then superposition on linear decks, reciprocity on passive AC decks, the same circuit in two netlist dialects, a time-shifted stimulus on an LTI circuit, and AC small-signal against the finite-difference linearization of DC.

```tikz title="Figure 3. A metamorphic relation on a circuit. The right-hand deck is the left-hand deck with its nodes renumbered and every impedance scaled by k. The simulator has no reference answer for either, but the node voltages must match and every current must be divided by k. A violation is a bug, with no oracle required."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ground]{} to[V, l=$V_s$] (0,2.4) to[R, l=$R$] (2.6,2.4) to[C, l=$C$] (2.6,0) node[ground]{};
  \draw (2.6,2.4) to[short, -o] (3.4,2.4);
  \node[anchor=south,font=\scriptsize] at (0,2.45) {node 1};
  \node[anchor=south,font=\scriptsize] at (3.0,2.5) {node 2};
  \node[font=\scriptsize] at (1.5,-0.6) {deck A};
  \draw[->,thick] (4.0,1.2) -- (5.8,1.2) node[midway,above,font=\scriptsize] {$T$};
  \draw (7.2,0) node[ground]{} to[V, l=$V_s$] (7.2,2.4) to[R, l=$kR$] (9.8,2.4) to[C, l=$C/k$] (9.8,0) node[ground]{};
  \draw (9.8,2.4) to[short, -o] (10.6,2.4);
  \node[anchor=south,font=\scriptsize] at (7.2,2.45) {node 7};
  \node[anchor=south,font=\scriptsize] at (10.2,2.5) {node 3};
  \node[font=\scriptsize] at (8.7,-0.6) {deck $T(\mathrm{A})$};
  \node[font=\scriptsize] at (5.3,-1.3) {must hold: $V_3(t) = V_2(t)$ within tolerance, and every current in $T(\mathrm{A})$ is $1/k$ of its twin in A};
\end{circuitikz}
\end{document}
```

Determinism is a test. Every deck with more than one analysis runs at `--jobs=1` and `--jobs=N`, and the output must be byte-identical. If floating-point reduction order makes that impossible, the order gets fixed, not the test.

### Compilers and front ends

A verifier pass over the IR runs after every pass in test builds. One test per spec clause, positive and negative, with the clause-to-test map tracked, and a test that fails the build on any unannotated catch-all arm over a boundary enum. The front end is fuzzed byte-level and then grammar-aware, and the oracle is no panic plus a diagnostic from the declared set for every rejection. A program generator in the Csmith style produces valid, domain-safe programs, with guards that keep `ln`, `sqrt` and `pow` in domain the way Csmith avoids undefined behaviour, and they run differentially: emitted code against an interpreter, the Jacobian against finite differences, CPU against NVPTX against AMDGCN. Equivalence modulo inputs mutates code that is dead for a given input, and the output must not change, a metamorphic oracle that needs no second compiler. The conformance suite is a ratchet: the pass and fail name lists are checked in, and CI fails on any name that moves from pass to fail. Counts are not diffed. Names are.

### Stateful and parallel systems

All time, randomness, I/O and scheduling go behind injectable interfaces first, or none of the rest is possible. Invariants are asserted after every transition. Random operation sequences run against a sequential model. A seeded simulator permutes the ready-queue order and the worker interleaving, with fault types enabled per seed, swarm style, and "results identical to sequential" as the oracle. Failures replay from their seed, which is what turns "flaky" into "reproducible".

### GPU kernels

The CPU reference is the oracle, and the same kernel source on the CPU is the cheapest differential there is. Sizes are chosen to hit the edges: 0, 1, one less than a block, a block, one more, a non-power-of-two, large. Integer kernels compare bitwise. Float kernels compare within a ULP bound, wider for reductions whose order changes, unless the reduction is made deterministic, which it is in anything I ship. The sanitizer runs memcheck, racecheck and synccheck nightly. Assembly checks for an atomic or a barrier prove the instruction is present, not that the algorithm is right, so memory-model litmus kernels run millions of times on hardware and the forbidden outcome must never appear. A backend that has never run on hardware is untested, whatever its assembly checks say, and the README says "compiles for HIP; untested" until it has passed the corpus on a card.

### SIMD

The scalar oracle is the `W == 1` instantiation of the same generic kernel, never a second hand-written loop, because a twin drifts and an instantiation cannot. Every length from 0 to past three times the widest lane count, several start offsets into one buffer, NaN and ±inf and ±0 and a subnormal, the target's width and a wider one, compared bitwise where the kernel is lane-exact. The test goes red when the peel loop for failed lanes is removed or the vector path runs one iteration fewer than the oracle, and I check that it goes red before trusting it. The suite runs on every ISA level shipped, because lane width changes which code runs, and a benchmark gate runs nightly, because for a vector library a performance regression is a bug.

### Geometry and physical verification

A missed violation signs off a bad chip, so the stack is built against false negatives. Generate a clean layout, inject one known violation, and assert it is found exactly once at the right coordinates, for every rule, with positive, negative and exactly-at-the-limit cases. Boolean laws are exact in integer database units, `area(A ∪ B) = area(A) + area(B) − area(A ∩ B)`, de Morgan, idempotence, over random rectilinear operands with shrinking. A bitmap oracle rasterizes small layouts at grid resolution and implements width, spacing and enclosure on pixels, slow and obviously right, and the real engine must agree with it on random layouts; it would have caught an extension rule that measured bounding boxes and passed an L shape. Translation, rotation, mirroring, scaling together with the rule values, and flattening against hierarchy all leave the violation set unchanged up to the transform. Every rule reports whether it ran, was skipped or refused, with the number of shapes examined, and a skipped rule fails the run, so a rule that silently examines nothing cannot pass.

## Tooling, honestly

Zig 0.17 has `std.testing.fuzz` with a `Smith` that pulls structured values, so a fuzz test whose body checks properties is property-based testing with coverage guidance on top. A plain `zig build test` replays only the corpus plus one empty input, so the corpus is the regression suite and crash files are embedded with `@embedFile`. Leaks and error logs per input count as findings, and `checkAllAllocationFailures` fails each allocation in turn and reports a swallowed out-of-memory. The fuzzer has no comparison feedback: it never implemented the `trace_cmp` hooks libFuzzer and AFL++ use to solve magic bytes, and the 0.17 notes say no changes were made to it. My own trial on 0.16: a target that panics only when the input starts with `bug!` was not found in 2,000,013 runs. So the generators construct valid structure instead of hoping byte mutation finds it, and byte-level parsers can also go through AFL++. There is no line or branch coverage tool for Zig beyond wrapping the test binary in kcov for line coverage, no machine-code branch coverage, and no mutation tool. The substitutes are coverage marks, where production code logs "hit mark X" and one specific test asserts it did, and a script that flips one comparison at a time and checks that the suite fails.

Rust has the tools: `cargo fuzz` with `arbitrary` for structure, `proptest` with its state-machine module, `cargo llvm-cov` for region coverage on stable (branch coverage is nightly-only, and MC/DC support was removed from rustc in August 2025), `cargo mutants`, `loom` and `shuttle` for interleavings, Miri for unsafe code, Kani for bounded proofs. For GPU work, NVIDIA's compute-sanitizer. And in every project, a FileCheck-style assembly check that an abstraction compiles to the hand loop, so a zero-cost claim is a test rather than a comment.

## What a release has to show

The audit that produced this plan ran over six of my own projects, and the first finding was blunt. Three had no CI that ran their tests at all. None used a fuzzer, a property library or coverage tooling. The ingredient most often missing was a cheap independent oracle wired into automation: in one project the cross-check scripts against the reference tool crashed, so the benchmark was grading itself, and in another the reference-simulator comparison was a manual command. Fixing CI was the single highest-value change, which is why "does CI run the tests?" is step one above.

A release ships when every line below is a number or a yes, and a script can check it:

- The corpus passes 100 percent, with only annotated expected failures.
- Every fuzz target has run at least N CPU-hours with no new crash, and corpus growth has plateaued.
- Differential agreement holds within the stated tolerance on every fixture, and every disagreement is fixed or annotated with a root cause. The count of agreeing fixtures is a ratchet that may not decrease.
- `jobs=1` and `jobs=N` are byte-identical on the whole corpus, and so are two runs of the same command.
- CPU and GPU agree within each deck's tolerance on every deck, on hardware, for every backend the release claims.
- The coverage ratchet has not dropped. The mutation score is above its floor, with every survivor triaged.
- Zero open crash bugs. Zero quarantined tests on core.
- A written list of what is still untested.

The numbers are the point. SQLite's test code outweighs its library code by roughly 590 to 1, 10 to 20 percent of its source exists only to be tested, and Hipp's summary of twenty years is "expect to spend most of your time testing". His other line is the one I would put on the wall: testability must be a design objective. The oracle gets named before the code gets written.

## References

**Start here**

- "How SQLite Is Tested", sqlite.org/testing.html
- Richard Hipp, "Reliability Lessons From SQLite", Software Should Work 2026, slides at sqlite.org/u/ssw6
- Andrew Kelley, "State of the (Tagged) Union Address", Systems Distributed '26
- TigerBeetle, TigerStyle, github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md
- Brian Marick, "How to Misuse Code Coverage"
- Alex Kladov, "How to Test" (2021), "Generate All the Things" (2021), "Swarm Testing Data Structures" (2025)

**Fuzzing and generated inputs**

- Zeller et al., _The Fuzzing Book_, fuzzingbook.org
- Claessen and Hughes, "QuickCheck", ICFP 2000; John Hughes, "Testing the Hard Stuff and Staying Sane"
- Yang, Chen, Eide and Regehr, "Finding and Understanding Bugs in C Compilers", PLDI 2011 (Csmith)
- Groce et al., "Swarm Testing", ISSTA 2012
- Le, Afshari and Su, "Compiler Validation via Equivalence Modulo Inputs", PLDI 2014
- Wasmtime, "Contributing: Fuzzing", docs.wasmtime.dev/contributing-fuzzing.html
- Zig 0.17.0 release notes, the Fuzzer section

**Oracles without a reference**

- Chen et al., "Metamorphic Testing: A Review of Challenges and Opportunities", ACM Computing Surveys 2018
- Rigger and Su, "Finding Bugs in Database Systems via Query Partitioning", OOPSLA 2020
- Salari and Knupp, "Code Verification by the Method of Manufactured Solutions", Sandia SAND2000-1444
- LAPACK Working Note 41, section 7, the scaled residual tests
- Bruce Dawson, "There are only four billion floats, so test them all" (2014)
- Lopes et al., "Alive2: Bounded Translation Validation for LLVM", PLDI 2021

**Stateful systems and gating**

- Will Wilson, "Testing Distributed Systems with Deterministic Simulation", Strange Loop 2014
- Graydon Hoare, "The Not Rocket Science Rule of Software Engineering" (2014)
- Google, "Flaky Tests at Google and How We Mitigate Them" (2016); _Software Engineering at Google_, chapters 11 to 14 and 23
- Ferrous Systems, "Coverage marks"
