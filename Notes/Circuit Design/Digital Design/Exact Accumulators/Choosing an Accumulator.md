---
title: Choosing an Accumulator
description: "Trade-off table across the 12 Exact Accumulators circuits, with the source's own numbers."
kind: comparison
source: "ASA Ch. 21, pp. 623-639"
status: seed
spade: n/a
tags: [digital, exact-accumulators, comparison]
aliases:
  - Choosing an Accumulator
  - Accumulator Selection
  - Which Accumulator
---

# Choosing an Accumulator

Every circuit in this folder is one block of the same datapath or one substitute for one block, so the choice is never "which accumulator" in the abstract — it is how wide to make the register, whether to cut the carry chain, and whether to build the conversion at all.

| Circuit | Where it sits | Size, in the source's own terms | Delay inside the loop | Cycles | Summation error |
| --- | --- | --- | --- | --- | --- |
| [[Floating-Point Accumulator Loop]] | the whole thing | 1 FP adder | the entire FP adder: $l = 3\ldots5$ cycles ASIC, up to tens on FPGA (p. 623) | one summand every $l$ (p. 623) | $(N-1)u\sum_i\lvert X_i\rvert$, grows with $N$ (p. 624) |
| [[Exact Sum-of-Products Operator]] | the whole thing | FloatToFix + accumulator + FixToFloat $\approx$ an FP adder with a $w_A$-bit fraction (p. 638) | one $w_A$-bit integer add | 1/cycle; $N+k+\text{latency}$ for $N$ products | $0$ |
| [[Exact Unnormalized Multiplier]] | front, outside loop | "slightly cheaper and faster than an Nfloat multiplier, much cheaper than an IEEEfloat one" (p. 638) | none — freely pipelinable | — | $0$; emits $M$ on $2w_F{+}2$ b, $E$ on $w_E{+}1$ b (p. 631) |
| [[Sign-Padding Alignment Shifter]] | front, outside loop | XOR row shrinks $w_A \to w''_F$ bits (Fig. 21.9, p. 633); one of the two blocks that dominate area (p. 638) | none — freely pipelinable | — | $0$ when $\ell_A$ is the exact LSB |
| [[Two's-Complement Exact Accumulator]] | the loop | adder + registers "much smaller than both FloatToFix and FixToFloat" (p. 638) | one $w_A$-bit carry propagation | 1/cycle | $0$ |
| [[Kulisch Accumulator]] | the loop, universal sizing | 277 b / 554 b binary32, 2098 b / 4196 b binary64 (Tables 21.1–21.2, pp. 626–627), $+58$ guard b (p. 627); $\approx$ **ten times** a binary32 FP adder (p. 638) | $w_A$ bits unless chunked | 1/cycle | $0$, unconditionally |
| [[Application-Specific Exact Accumulator]] | the loop, tailored sizing | **63 b** against 177 b, from $m_A{=}24$, $m_X{=}8$, $\ell_A{=}-38$ (p. 629); a 64-b accumulator for 32-b data $\approx$ a 64-b FP adder (p. 638) | $w_A$ bits unless chunked | 1/cycle | $0$ inside the envelope; $2^{\ell_A}$ per truncated summand |
| [[High-Radix Carry-Save Accumulator]] | the loop | $k-1$ extra flip-flops, $k=\lceil w_A/\alpha\rceil$; overhead over the ripple-carry accumulator of Fig. 21.8 is "only a few percent" (p. 636) | $\alpha$ bits; $\alpha=32$ already reaches very high FPGA frequency (p. 636) | 1/cycle, plus $k$ flush cycles ("3 cycles in Fig. 21.10", p. 636) | $0$ — the sum is stored exactly, in radix-$2^\alpha$ carry-save |
| [[Sign-Magnitude Accumulator]] | the loop, rejected | — (needs a compound adder, Sect. 5.3.7, p. 123) | two $w_A$-bit carry chains, or one plus a select | 1/cycle, no flush | $0$ |
| [[Accumulator Exception FSM]] | beside the loop | — (4 states: 2 b of `exn` + 1 b of sign) | none — off the loop | — | n/a |
| [[Accumulator-to-Float Converter]] | back end | the normaliser is "the most expensive component" (p. 636); round-and-pack is one $w'_E{+}w'_F$-b adder (p. 637) | none; shareable between up to $N$ dot products (p. 636) | once per $N$ accumulations | $0.5$ ulp, the only rounding in the datapath |
| [[Three-Zone Accumulator Converter]] | back end, wide $w_A$ | splits 554 b into $128 + 277 + 149$ (Fig. 21.12, p. 638) | none | once per $N$ | $0.5$ ulp; normaliser now shifts at most $e_{max}-e_{min}=253$ b (p. 638) |

**Every "—" is a gap in the source, not an omission here.** §21.3 is explicit that its cost statements are *rules of thumb* "supported by experience", citing [Din+08; UD17; Ugu+20] for the measurements; the chapter itself publishes no LUT counts, no slice counts, no DSP-block counts, no logic depths and no delays in nanoseconds. The single absolute performance figure in the whole chapter is "a 64-bit accumulator achieves a frequency above 200 MHz" (p. 635), and it names no device, no speed grade and no toolchain. Everything else is a width, a cycle count, or a ratio against a floating-point adder of stated fraction size.

> [!warning] Not covered in the source — needs outside research
> The sign-magnitude accumulator is dismissed on structural grounds with no cost figures of any kind; the chapter points at [UD17] for the architecture comparison that actually measured it. Any claim that it is $2\times$ or $1.5\times$ the two's-complement version would have to come from that paper, not from Chapter 21.

**Accuracy is not the axis that decides — width is.** Once you leave [[Floating-Point Accumulator Loop]], every option in the table has zero summation error, so "how exact" stops being a question and "over what range" starts. That range is $w_A$, and $w_A$ is the only genuinely expensive parameter, because $e_{max}-e_{min}\approx 2^{w_E}$ makes the register grow exponentially in exponent width while growing only linearly in significand width. [[Kulisch Accumulator]] pays that exponential in full — 554 bits plus 58 guard bits for binary32 sums of products — and gets exactness on data it has never seen, which is what a general-purpose unit in a processor pipeline needs and what a datapath compiled for one integral does not. [[Application-Specific Exact Accumulator]] buys the same exactness on the data you actually have for 63 bits instead of 177, and the reason to take it is the area ratio at the end of the table: ten times a binary32 adder against roughly one 64-bit adder. The catch is that finite $m_A$ makes overflow possible and finite $\ell_A$ makes truncation possible, so you inherit an overflow comparator and a rounding-or-truncating shifter that the universal version, by construction, cannot need. Since ten extra bits of $w_A$ barely move the area (p. 639) and buy three orders of magnitude of margin, the sane failure mode is to over-size.

**Frequency is decided by what is left inside the loop, and only three of these circuits are inside it.** The multiplier, the shifter, the exception FSM and both converters are combinational or off the feedback path, so they can be pipelined to any depth and never set the clock; their cost is area, not frequency. The loop is one $w_A$-bit addition, and at $w_A = 554$ that addition alone sets the frequency of the entire design. [[High-Radix Carry-Save Accumulator]] is the answer whenever $w_A$ is large enough that the carry chain is the binding constraint: it makes the critical path $\alpha$ bits by construction, which is a frequency you *choose* rather than one you measure, for $k-1$ flip-flops and $k$ flush cycles at the end. Its one real limit is short accumulations — a length-8 dot product against a 554-bit accumulator spends most of its cycles flushing, and the plain wide adder at a lower clock wins. [[Sign-Magnitude Accumulator]] is in the table as the road not taken for exactly this reason: it puts a second $w_A$-bit carry propagation in the loop, and the compound adder that removes the second chain costs more hardware than the two's-complement version it was meant to beat.

**FPGA and ASIC do not agree about which of those loop options is right.** On FPGA the two's-complement accumulator is close to a free ride: a logic cell provides a flip-flop directly behind the adder bit it computes, so the register costs nothing, the addition rides the hard carry chain, and the feedback is local routing inside one column — hence 64 bits above 200 MHz (p. 635), and hence chunking costing only a few percent, since the $c_i$ loops are local too (p. 636). On ASIC none of those three is free, and a parallel-prefix adder is a real competitor to chunking: it is $\log w_A$ deep inside the loop rather than $\alpha$ deep, which for moderate $w_A$ can be the shorter path and costs no flush cycles. The FPGA argument also runs the other way at the front of the datapath, where [[Sign-Padding Alignment Shifter]] costs literally zero extra LUTs because the pad input is already a mux input, while on ASIC the same transformation removes $w_A-w''_F$ XOR cells but leaves one XOR of delay behind.

**Two of these blocks are decisions about whether to build anything at all.** [[Accumulator-to-Float Converter]] is a separate component precisely because it is so often absent: an FPGA integrating for hours produces one $w_A$-bit word and converting it in software is free, and the common case that does need it — one normalisation every $N$ accumulations — uses it once per $N$ cycles, so a single pipelined instance is shared across up to $N$ dot-product operators. Build it only when the running sum is needed, and reach for [[Three-Zone Accumulator Converter]] only when $w_A$ actually outruns the output exponent range, which is the sum-of-products case and essentially never the tailored one. [[Accumulator Exception FSM]] is the opposite kind of decision: three flip-flops that are not a cost item in either technology, and the only reason to think about them is that a silently wrong `NaN` is indistinguishable downstream from a correct answer.

$$\boxed{\ \text{loop delay} = \min(w_A,\ \alpha)\ \text{bits};\qquad \text{area} \approx \text{FP adder with fraction } w_A;\qquad \text{error} = 0.5\ \text{ulp, once}\ }$$

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21, "Floating-Point Accumulation and Sum of Products", pp. 623–639.

- FP adder latency $l$ in the loop, error growth with $N$: pp. 623–624
- Tables 21.1, 21.2 — exact accumulator widths for binary16/32/64, sum and sum of products: pp. 626–627
- Kulisch universal sizing and the 58 spurious-overflow guard bits: p. 627
- Fig. 21.5 and the inductance parametrization, $m_A=24$, $m_X=8$, $\ell_A=-38$, 63 b vs 177 b: pp. 628–630
- Figs. 21.6, 21.7 — exact multiplier, $2w_F+2$-bit product, doubly biased exponent: p. 631
- Figs. 21.8, 21.9 — two's complement accumulator, XOR row moved before the shifter: p. 633
- §21.2.2.2 exceptions FSM; application-specific overflow and truncation: pp. 633–635
- FPGA mapping, 64-bit accumulator above 200 MHz: p. 635
- Fig. 21.10, high-radix carry-save: $k-1$ registers, $\alpha=32$, few percent overhead, $k$ flush cycles: pp. 635–636
- §21.2.4 — converter shared across $N$ dot products, normaliser the most expensive component: pp. 636–637
- Fig. 21.12, three-zone split; §21.3 cost/speed/accuracy rules of thumb, the 10× and 64-bit-adder comparisons: pp. 638–639
