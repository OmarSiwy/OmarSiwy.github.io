---
title: Shifters
description: "Map of the 16 Shifters notes, and the specification they all answer to."
kind: hub
status: seed
spade: n/a
tags: [digital, shifters, hub]
aliases:
  - Shifters
  - "2.6) Shifters"
---

# Shifters

**Specification.** Take $X$ on $w_X$ bits and an unsigned distance $S$ on
$w_S=\lceil\log_2(S_{\max}+1)\rceil$ bits; produce $R$ on $w_R$ bits equal to $X$
shifted by $S$ in a direction fixed **at generation time**, optionally with a sticky
bit $\sigma=\bigvee(\text{bits shifted out})$. Exact ($w_R=w_X+S_{\max}$) loses
nothing, $0$ ulp; truncated ($w_R<w_X+S_{\max}$) drops low bits and costs up to $1$
ulp of $R$, which $\sigma$ plus a round bit brings back to $\le\tfrac12$ ulp under
round-to-nearest ([[Number Formats]], [[Error Accuracy]]). The parameter is $S_{\max}$,
never $w_S$ — real requirements like $w_F+2$ are not of the form $2^{w_S}-1$ — and every
legal shape obeys $S_{\max}\le\max(w_R,w_X)\le\min(w_R,w_X)+S_{\max}$ (Eq. 10.1, p. 311),
outside which either an output bit is unreachable from any input bit or the result is a
constant. **What is optimised is latency**, then area, then the fanout of $S$: a shifter
is almost never the answer to anything, it is a step on somebody else's critical path.

> [!important] Every circuit here is one associative operator powered in binary
> Shift-by-one composes as $\sigma^a\circ\sigma^b=\sigma^{a+b}$, so expanding
> $S=\sum_i s_i2^i$ and reassociating gives one two-way choice per bit of $S$: one row of
> 2:1 multiplexers, $\lceil\log_2(S_{\max}+1)\rceil$ deep, $O(w_X\log S_{\max})$ area. Finding
> the leading one is the same statement with OR as the operator. This is precisely why
> the prefix trees in [[Adders]] work, and the differences between the notes below are
> which association of the operator you pick and where you spend the commutativity.

### Start here

- [[Choosing a Shifter]] – the trade-off table: mux counts, depths and the source's
  measured area/delay numbers, plus the four constraints that actually decide. Read it
  before any note below; nothing else here tabulates cost.

### The shape of the shifter — what gets kept, what gets dropped

- [[Exact Full Shifter]] – the base architecture the rest specialise, and the note that
  argues out stage order (LSB-first) on both area and adder-overlap grounds.
- [[Truncated Shifter]] – read when the output is narrower than the exact result and you
  need to know what that costs in ulp before deciding to pay for $\sigma$.
- [[Barrel Shifters]] – the $w_X=w_R$ case, i.e. the ALU shifter; read it as the shifter
  you build by default unless something forces you elsewhere.
- [[Shifter with Sticky Bit Computation]] – read whenever the shifter feeds a rounded
  operator, because it is strictly cheaper *and* strictly faster than shift-then-OR.
- [[Bidirectional Shifter]] – read to be talked out of building one; the argument for
  biasing $S$ into a unidirectional shift is the topic's most reusable design move.

### Shifters that are not a multiplexer network

- [[One-Hot Shifter]] – the obvious alternative, kept as the counter-example that fixes
  why the staged decomposition is worth the trouble.
- [[Shift by Multiplier]] – read on FPGA when a hard multiplier is idle and the logic
  fabric is not.
- [[Sporadic Shifter]] – read when the set of distances you actually need is small and
  discrete, so $[0,S_{\max}]$ is the wrong thing to optimise against.

### Counting leading bits

- [[Leading Zero Counters]] – the recurrence everything in this group is an association
  of, plus the naive architecture that is still the right FPGA answer.
- [[Oklobdzija LZC Tree]] – read for the balanced association: $O(\log w_X)$ depth, and
  the fanout price that comes with it.
- [[Monotonic String Leading Zero Counter]] – read when that fanout shows up in timing
  reports, and as the form that generalises cleanly to everything else in this group.
- [[Leading Bit Counter]] – read when the bit value to count must be a runtime input
  rather than baked in, and to see why the book keeps three components instead of one.
- [[Leading Zero Anticipation]] – read when the count is on the critical path of an
  addition and must not wait for the sum.

### Normalizers — count and shift as one operator

- [[Normalizers]] – the composition that turns a fixed-point number into a significand
  and an exponent; read first, it defines what the other two are variants of.
- [[Fused Normalizer]] – read for the one case where the *naive* LZC beats the fast ones,
  because its count bits arrive MSB-first in exactly the order a shifter consumes them.
- [[Sequential Normalizer]] – read when area matters and latency does not; the whole
  operator collapses to a one-bit shift and a state machine.

### Where this sits

$S$ almost always arrives from an exponent subtraction, so the biasing tricks here are
continuous with [[Number Formats]] and the operators in [[Floating-Point Operators]] —
alignment shift, sticky bit, normalisation and leading-zero anticipation are all
consumed there, and the $\tfrac12$ ulp claim only closes with [[Error Accuracy]]. The
associativity argument is shared with [[Adders]], the DSP-based and LUT-merging mappings
with [[FPGAs]], and [[Multipliers]] both borrows shifters and, via a $2^S$ product,
replaces them.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10
"Shifters and Leading Bit Counters", pp. 307–326: §10.1 shifters and the generator
parameters, pp. 307–316; §10.2 variations on leading zero counters, pp. 316–322;
§10.3 normalizer, pp. 323–325; §10.4 to read further, p. 325.
