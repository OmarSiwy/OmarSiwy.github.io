---
title: Choosing a Counter
description: "Trade-off table across the 17 Counters circuits, with the source's own numbers."
kind: comparison
source: "2.8) Counters §Trade-offs, §Synchronous counters, §Asynchronous (ripple) counters, §Modulo-N counters, §Gray counters, §LFSR counters, §Ring and Johnson counters, §FPGA mapping — no book source"
status: seed
spade: n/a
tags: [digital, counters, comparison, timing, fpga]
aliases:
  - Counter Comparison
  - Counter Trade-offs
  - Which Counter
  - Counter Selection
---

# Choosing a Counter

Every counter in this folder computes the same thing — a state that advances one step per enabled edge — so the choice is never arithmetic; it is decided by the clock period, the decode, and the domain crossing.

> [!warning] No sourced silicon numbers, and therefore no printed pages
> This topic has no book source. Every figure below is **structural** — gate counts, gate-input counts, logic depth, flop counts, toggles per cycle — derived in the long-form note and in the sibling notes, and it carries a `§` reference rather than a page. Absolute delays, LUT and slice counts, DSP-block counts and power figures depend entirely on process and fabric and must come from synthesis or a datasheet, never from this table. The one numeric illustration that looks like a measurement — $16$ bits at $t_{cq}=120\,\text{ps}$ giving $1.9\,\text{ns}$ — is a worked example, not silicon data.

| Structure | Flops | Logic | Comb. depth / $f_{\max}$ bound | Decode & CDC | Printed page | § in `2.8) Counters` |
| --- | --- | --- | --- | --- | --- | --- |
| [[Incrementer]] | 0 (combinational) | $n$ XOR2 $+$ $n$ AND2 — roughly half an adder | $(n{-}1)t_{\text{AND}}+t_{\text{XOR}}$ | TC $=c_n$, free | — | §The increment is an adder with one operand tied to 1 |
| [[Prefix Incrementer]] | 0 (combinational) | $n$ XOR2 $+$ one AND2 per prefix node; Kogge-Stone $n\log_2 n-n+1$ nodes, $=17$ AND2 at $n=8$ | $\lceil\log_2 n\rceil\,t_{\text{AND}}+t_{\text{XOR}}$ | one rail per edge, not two | — | §The increment…, §Trade-offs |
| [[Synchronous Counters]] | $n$ | $n$ AND2 $+$ $n$ XOR2 (4 and 4 at $n=4$) | $t_{cq}+(n{-}1)t_{\text{AND}}+t_{\text{XOR}}+t_{su}+t_{\text{skew}}$ | glitches for $t_{\text{skew}}+\Delta t_{cq}$; not CDC safe | — | §Synchronous counters, §Trade-offs |
| [[Up-Down Counter]] | $n$ | $+\,n$ XOR2 over the incrementer, all in one level; $0$ LUTs on fabric | $+\,t_{\text{XOR}}$, independent of prefix shape | TC pulses when UP moves | — | §The increment… (down-counting), §FPGA mapping |
| [[Asynchronous Counters]] | $n$ | none | $t_{cq}+t_{su}$ of **one** flop, no $n$ in it | word invalid $n\,t_{cq}$ ($1.9\,\text{ns}$ at $n{=}16$, $t_{cq}{=}120\,\text{ps}$); $t_{cq}$-wide decode glitch every edge | — | §Asynchronous (ripple) counters |
| [[Cascaded Counter Chain]] | $n$, as $m=n/k$ slices | ripple enable $\Theta(m)$ gates; parallel enable $\Theta(m^2)$ gate inputs | $m\,t_{\text{TC}}$ vs. one wide-AND level | — | — | §Synchronous counters (enable chaining) |
| [[Two-Stage Prescaled Counter]] | $n$ | as the flat counter | $t_{cq}+(k{-}1)t_{\text{AND}}+t_{\text{XOR}}+t_{su}+t_{\text{skew}}$; high half gets $2^{k}$ periods | — | — | §Synchronous counters (two-stage decomposition) |
| [[Modulo-N Counter]] | $n$ | match $=\operatorname{popcount}(N{-}1)$ AND inputs, no inverters ($2$ for mod-10, $0$ for mod-16) | compare is parallel to the increment; $+\,t_{\text{mux}}$ in the loop | $Q$ runs $0\ldots N{-}1$ upward | — | §Modulo-$N$ counters (1), §FPGA mapping |
| [[Preload-and-Overflow Counter]] | $n$ | comparator deleted; $n$ 2:1 muxes, $0$ on fabric for constant $N$ | $t_{cq}+t_{\text{inc}}+t_{\text{mux}}+t_{su}$ — a wash against compare-and-clear | $Q=k-N \bmod 2^n$, biased | — | §Modulo-$N$ counters (2) |
| [[Zero-Detect Down Counter]] | $n$ | $n$-input NOR, constant in $N$; $n$ 2:1 muxes | $t_{cq}+t_{\text{chain}}(n)+t_{\text{mux}}+t_{su}$ | terminal test is the borrow-out | — | §Modulo-$N$ counters (3) |
| [[Gray Counter]] | $2n$ | increment $+\,(n{-}1)$ XOR2 | increment path $+\,t_{\text{XOR}}$ on the *setup* path only | $d_H=1$ per step — **CDC safe** | — | §Gray counters, §Trade-offs |
| [[Gray Code Converter]] | 0 (combinational) | forward $n{-}1$ XOR2; reverse $n\log_2 n-(n{-}1)$ XOR2 ($17$ at $n{=}8$, vs. $7$ ripple) | forward $1$ level; reverse $\lceil\log_2 n\rceil$ ($3$ at $n{=}8$, vs. $7$ ripple); $\lceil\log_6 n\rceil$ LUT levels on fabric | — | — | §Gray counters |
| [[Fibonacci LFSR]] | $n$ | $|T|-1$ XOR2 | $t_{cq}+\lceil\log_2|T|\rceil t_{\text{XOR2}}+t_{su}+t_{\text{skew}}$ | period $2^n-1$; non-monotone, equality decode only | — | §LFSR counters |
| [[Galois LFSR]] | $n$ | $w-1$ XOR2 — same count as Fibonacci | $t_{cq}+t_{\text{XOR2}}+t_{su}$, independent of $n$ **and** $w$ | period $2^n-1$; fanout $w$ on $s_{n-1}$ | — | §LFSR counters, §Trade-offs |
| [[De Bruijn Counter]] | $n$ | LFSR $+$ one $(n{-}1)$-input NOR | LFSR depth $+$ the NOR | period $2^n$, every $n$-bit word once | — | §LFSR counters (warning) |
| [[Ring Counter]] | $N$ for $N$ states | none; self-correction costs one $(N{-}1)$-input NOR, depth $\lceil\log_k(N{-}1)\rceil$ | $t_{cq}+t_{su}$ (depth $0$); $t_{cq}+t_{\text{NOR}(N-1)}+t_{su}$ corrected | decode depth $0$, structurally glitch-free; 2 flops toggle per cycle | — | §Ring and Johnson counters |
| [[Johnson Counter]] | $n$ for $2n$ states | one inverter; $2n$ AND2 of depth 1 decode all states | $t_{cq}+t_{\text{INV}}+t_{su}$ | one bit per step — **CDC safe over $2n$ states**; 1 flop toggles per cycle | — | §Ring and Johnson counters |

Every entry in the **Printed page** column is `—`, and this is not an omission: the long-form note is written from digital-design canon with chapter-level citations only, so there is no printed page behind any number here. The same `—` covers the three quantities a synthesis report would give and this note cannot: **LUT and slice counts, DSP-block counts, and absolute delay in nanoseconds.** Cycle counts *are* present, because they are definitional rather than measured — $2^n$, $2^n-1$, $N$, $2n$, $N$ — and so are gate and gate-input counts, because they follow from the derivations. Where a row's cell is `—` inside the table, the source genuinely says nothing about that structure on that axis; `[[Cascaded Counter Chain]]` and `[[Two-Stage Prescaled Counter]]` in particular are re-associations of a synchronous counter's enable and inherit its decode and CDC behaviour unchanged, so there is nothing separate to record.

**When the clock period is the binding constraint, stop computing the count.** The whole spread of $f_{\max}$ in the table is one question — how much logic sits between a flop's Q and its own D — and the answer runs from $O(n)$ down to zero. A [[Synchronous Counters|synchronous]] carry-chain counter puts $(n{-}1)t_{\text{AND}}+t_{\text{XOR}}$ in that loop, which is invisible at $n=8$ and fatal at $n=64$ on a fast ASIC clock. The escapes are ordered by what you are willing to give up. Give up nothing and take [[Prefix Incrementer]]: the count stays monotone and exact, depth drops to $\lceil\log_2 n\rceil$, and the price is prefix nodes and wire tracks — on an FPGA this is the wrong move, because the hard carry chain beats a LUT tree at any width you would plausibly build. Give up *when* the high bits are correct and take [[Two-Stage Prescaled Counter]]: only the $k$-bit low slice is in the period, the high half gets $2^k$ cycles to settle, and the count is bit-for-bit identical to the flat one — the cost is a multicycle exception in the constraint file, which no RTL review catches when it is missing. Give up **monotonicity** and take [[Galois LFSR]]: one XOR2 of depth for any width, within a gate of the flop's own toggle limit, and the state is a permuted alphabet rather than a number. Give up the count entirely and take [[Asynchronous Counters]], whose bound has no $n$ in it at all. [[Fibonacci LFSR]] sits alongside Galois at $\lceil\log_2|T|\rceil$ depth and is only equal to it when the polynomial is a trinomial — and Swan's theorem forbids primitive trinomials exactly at $n=16,32,64$, so at the widths hardware is actually built the pentanomial makes Fibonacci two levels and Galois still one.

**When the count is decoded every cycle, flop count stops being the metric.** A binary counter's decode is an AND over $\lceil\log_2 N\rceil$ literals that do not arrive together, so for $t_{\text{skew}}+\Delta t_{cq}$ after every edge the decoder evaluates a mixture of the old and new words, and the decode of a mixture is not the mixture of the decodes — it can assert a phase belonging to neither state. [[Ring Counter]] deletes the problem structurally: $\phi_k$ *is* $q_k$, decode depth zero, nothing to race against itself, which is why one-hot is the default for multi-phase clock generators, round-robin arbiters and high-speed one-hot state encodings. It costs $N$ flops for $N$ states, which is hopeless past a handful. [[Johnson Counter]] doubles the density to $2n$ states from $n$ flops for one inverter, decodes every state in one AND2, and those decodes are hazard-free because a two-input AND with one input held is monotone in the other; at $n=2$ its states are quadrature phases. Both stop being defensible fast: at 256 states Johnson costs 128 flops against a binary counter's 8. The rule is that the *decoded output* has to be the product — phases, a sequencer, a small arbiter — and the moment you want a number back, [[Synchronous Counters]] or [[Gray Counter]] takes over. If you keep the binary counter and must decode it safely, register the decode: compute "will equal $N$ next cycle" from $Q^{+}$ and clock it, so the strobe leaves a flop rather than a cone of logic.

**When the count crosses a clock domain, there is exactly one structure and it is not a choice.** Each bit of a bus resolves metastability independently, so $m$ bits changing at one source edge let the receiver latch any of $2^m$ mixtures — sampling a binary pointer across $0111\to1000$ yields $1111$ or $0000$, values that were never counts. [[Gray Counter]] bounds the mixture set to two, both of them legal counts, for $2n$ flops and one XOR level that lands on the setup path of the Gray register only, never inside the increment recurrence. Register the conversion; a combinational $b\oplus(b\gg1)$ off the binary register emits hazards from that register's own skew and the whole argument collapses. [[Johnson Counter]] is also a Gray code and crosses safely, but only over $2n$ states. Note the asymmetry [[Gray Code Converter]] documents: forward is $n-1$ XOR2 at depth one, backward is a prefix tree — which is why a Gray counter converts forward inside its loop and never backward. And Gray needs an even modulus, because each step flips one bit and codeword parity alternates, so a non-power-of-two FIFO sizes its pointer up and handles depth elsewhere.

**When the modulus is not a power of two, the answer is a fabric question and an $N$-mutability question.** All three constructions cost the same in depth, since the comparator evaluates on $Q$ in parallel with the increment and $t_{\text{cmp}}<t_{\text{inc}}$ for any width worth building; what differs is what has to be regenerated when $N$ changes and what the flop's own ports absorb. On an FPGA, take [[Modulo-N Counter]]: the match folds into a 6-LUT already computing a toggle term and the synchronous clear drives an `SR` port that was idle, so a mod-$N$ counter costs nothing measurable over a mod-$2^n$ one — and if $N$ is a compile-time constant, [[Preload-and-Overflow Counter]] is equally free, because a constant load is per-bit flip-flop set/reset rather than logic. On an ASIC the clear-plus-enable mux is real and the comparator's literal-polarity map is a function of $N$, so [[Zero-Detect Down Counter]] is the default for timers: the $n$-input NOR is $N$-independent, the terminal condition is the borrow-out already in the chain, and $N$ becomes a register value instead of a synthesis constant. Choose compare-and-clear anyway when $Q$ must run $0\ldots N-1$ upward for addressing — preload publishes $k-N \bmod 2^n$, and un-biasing it costs the adder you were avoiding. The wider structural notes cut across all three: [[Cascaded Counter Chain]] decides how a wide counter's enable is delivered — $\Theta(m)$ gates and $m\,t_{\text{TC}}$ of depth rippling, against one wide-AND level and $\Theta(m^2)$ gate inputs broadcasting — and every mod-$N$ counter with $N<2^n$ has $2^n-N$ unreachable states that must be proven self-starting or reset, which applies equally to the non-self-starting ring, Johnson and LFSR structures.

**Related Notes**

- [[Incrementer]] – depends-on: the half-adder chain every binary counter above is wrapped around.
- [[Prefix Incrementer]] – compares: the same increment at $\lceil\log_2 n\rceil$ depth, and the wrong answer on a hard carry chain.
- [[Synchronous Counters]] – compares: the default, and the baseline every other row is measured against.
- [[Up-Down Counter]] – extends: both directions in one datapath for $n$ XOR2 in a single level, free on a LUT fabric.
- [[Asynchronous Counters]] – compares: fastest and lowest clock power, correct only when nobody decodes the word.
- [[Cascaded Counter Chain]] – extends: how the enable reaches slice $j$, and the depth-versus-fan-in choice that follows.
- [[Two-Stage Prescaled Counter]] – extends: buys $f_{\max}$ with a multicycle path rather than with a different structure.
- [[Modulo-N Counter]] – compares: the FPGA answer for a non-power-of-two modulus, and the one that keeps $Q$ ascending.
- [[Preload-and-Overflow Counter]] – compares: deletes the comparator by biasing the state, free on fabric for constant $N$.
- [[Zero-Detect Down Counter]] – compares: the ASIC default for timers, constant hardware across every $N$.
- [[Gray Counter]] – compares: the only cheap way to be correct across a clock domain.
- [[Gray Code Converter]] – depends-on: the forward XOR row inside the Gray counter's loop, and the tree it avoids.
- [[Fibonacci LFSR]] – compares: $2^n-1$ states for $|T|-1$ gates, with an unbroken shift path an `SRL` can hide.
- [[Galois LFSR]] – compares: the fastest structure that still visits $2^n-1$ states with $n$ flops.
- [[De Bruijn Counter]] – extends: one NOR buys the missing state and a full period of $2^n$.
- [[Ring Counter]] – compares: zero decode logic and zero decode delay, paid for with $N$ flops for $N$ states.
- [[Johnson Counter]] – compares: twice a ring's density, one inverter of depth, and a Gray code over $2n$ states.
- [[Counters]] – supports: the topic hub these seventeen circuits were cut out of.

No RTL block: this note compares structures and synthesises nothing of its own — every entity lives in the sibling it belongs to.

## References

No book source; written from established digital-design canon, chapter-level citations only, so no page number in this note is verified against a printed text and none is given.

- `2.8) Counters` — §The increment is an adder with one operand tied to 1, §Synchronous counters, §Asynchronous (ripple) counters, §Modulo-$N$ counters, §Gray counters, §LFSR counters, §Ring and Johnson counters, §FPGA mapping, §Trade-offs, §Worked example.
- Mano & Ciletti, *Digital Design* — ripple versus synchronous counters, ring and Johnson counters, unused-state analysis.
- Wakerly, *Digital Design: Principles and Practices* — LFSRs and primitive polynomials, the 74x161/163 `ENP`/`ENT` enable structure.
- Weste & Harris, *CMOS VLSI Design* — incrementers as degenerate adders, prefix structures, clock-power arguments for dividers.
- Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design" (SNUG) — Gray-coded pointers and the conservative-flag argument.
