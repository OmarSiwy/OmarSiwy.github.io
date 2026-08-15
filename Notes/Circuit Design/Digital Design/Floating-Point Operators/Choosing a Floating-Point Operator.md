---
title: "Choosing a Floating-Point Operator"
description: "Trade-off table across the 18 Floating-Point Operators circuits, with the source's own numbers — and the observation that the whole chapter is one asymmetry: addition is five slow blocks in series, multiplication is two."
kind: comparison
source: "ASA Ch. 11, pp. 329-360"
status: seed
spade: n/a
tags: [digital, floating-point-operators, comparison, rounding, ieee754, fpga]
aliases:
  - Floating-Point Operator Comparison
  - Floating-Point Operator Trade-offs
  - Which Floating-Point Operator
  - Floating-Point Operator Selection
---

# Choosing a Floating-Point Operator

Every circuit in [[Floating-Point Operators]] is either a piece of one of four operators or a way of buying latency or the last ulp back; what separates them is a single structural fact, that $2^a2^b=2^{a+b}$ separates exactly while $2^a+2^b$ does not.

The source's own cost metric is the number of **slow blocks** — components of $\log_2 w_F$ depth — that a design puts on one critical path (pp. 340, 342). It is used below because it is the only cost the chapter actually quantifies.

| Circuit | Slow ($\log_2 w_F$-depth) blocks | Other cost, as the source states it | Accuracy | p. |
| --- | --- | --- | --- | --- |
| [[Exponent Difference and Swap Unit]] | **0** — the exponent datapath is $w_E$ wide, not $w_F$ | difference **saturated to $w_F+2$**, so it leaves on $\lceil\log_2(w_F{+}2)\rceil$ bits and sizes the shifter behind it; on FPGA the swap decision is one $(w_E{+}w_F)$-bit comparison on the fast carry chain (§6.3, p. 148) | exact | 337-338 |
| [[Floating-Point Adder]] | **5** in series: alignment shifter, significand adder, LZC, normalizer, rounding adder | significand adder is $(w_F{+}3)$-in / $(w_F{+}4)$-out; exponent path kept on $w_E+2$ bits so pack can tell overflow from underflow | $\le\tfrac12$ ulp, ties **away**; subnormals flushed | 335, 337, 340 |
| [[Dual-Path Floating-Point Adder]] | far **2**, near **2** — "quite well balanced"; **with subnormals the near path becomes 3** and is the critical path on its own | $+1$ significand adder, $+1$ output mux. The shifters are *not* duplicated — each path builds only the one it needs | unchanged | 341-342 |
| [[Leading Zero Anticipator]] | takes the near path back to **2** by moving the LZC beside the subtraction | $+1$ correction mux for the one-bit prediction error; the LZA itself is larger than an LZC — no figure given | unchanged | 342 |
| [[Speculative Floating-Point Adder]] | **1 cycle, double precision, 1 GHz** (Lutz, [Lut19]) | **two 54-bit incrementers and seven 54-bit adders**, "along with a large number of multiplexers" | unchanged | 342 |
| [[Sticky Bit Generator]] | **1**, and foldable into the alignment shifter (§10.1.5) | full shifter $+$ wide OR tree, *or* the OR folded into all $\lceil\log_2(w_F{+}2)\rceil$ shifter stages; **"the bulk of the overhead"** of ties-to-even | unlocks ties-to-even and every directed mode | 336, 339 |
| [[Floating-Point Rounding Adder]] | **1**, and it is the worst kind — a carry propagation across all $w_E+w_F$ bits | one incrementer on the $(w_E{+}2)\Vert(w_F{+}1)$ concatenation; the exponent bump on fraction overflow is **free** | $\le\tfrac12$ ulp, ties away | 335, 338, 345 |
| [[Floating-Point Exception Handling]] | **0** — the only logic in the chapter whose depth does not grow with $w_F$ | a flat gate layer at each end; it is the *sole* difference between an IEEE-encoded comparator and an `Nfloat` one | n/a | 331, 359 |
| [[Subnormal Normalization Unit]] | naive route in a multiplier: **more than doubles the latency** of Fig. 11.7. One-shift route: **0** added — LZC, exponent update and shift distance all run beside the multiplier | one LZC, one shifter, exponent 1 bit wider. In the adder it costs no area to speak of but **forbids the fused LZC+shifter**, which is what breaks the dual path | unchanged | 340, 345-346, 350 |
| [[Floating-Point Multiplier]] | **2**: significand multiplier, then rounding adder | $(w_F{+}1)\times(w_F{+}1)$ multiplier, $P$ on $2w_F+2$ bits. Normalization is a **1-bit mux** over the static range $P\in[1,4)$, and the exponent increment is a **mux, not a carry propagation**, because product overflow and rounding overflow are exclusive | $\le\tfrac12$ ulp, ties away | 343-345 |
| [[Faithful Floating-Point Multiplier]] | **2**, architecture **unchanged** | a truncated significand multiplier faithful to `ufix(1,`$-w_F-1$`)`; "an appreciable reduction in area and delay" is the entire quantification given | $<2^{-w_F}=1$ ulp, both binades | 346 |
| [[Injection Rounding]] | **1** — the two fuse | $+1$ bit-heap column for the constant $2^{-w_F-1}$, one compound adder in place of the plain one, one mux on the overflow bit | $\le\tfrac12$ ulp, ties away | 346-347 |
| [[Floating-Point Divider]] | **1** ($\div$ block) $+$ **1** (rounding adder) | the $-1$ for the possible left normalization costs **no adder at all**: $E_0$ with its LSB replaced by $q_0$, a wire. Both exponent adders exact on $w_E+2$ bits. Subnormals in [Bru18]: **$+2$ cycles** before, **$+1$ cycle** after | already correctly rounded — ties provably impossible when input and output formats match | 347-350 |
| [[Correct Rounding from Faithful Quotient]] | $+1$ multiply, $+1$ rounding addition | a **left-truncated** $M_QM_Y$ (only bits below $2^{-w_F}$ can differ), one comparison, some logic — **to buy one bit** | $<1$ ulp $\to$ $\le\tfrac12$ ulp | 351-352 |
| [[Floating-Point Square Root]] | **1** — the $\sqrt{\ }$ block, and nothing else | **one addition** on the exponent, total: $\lfloor E_X/2\rfloor$ is a wire tap, $\lfloor E_0/2\rfloor=2^{w_E-2}-1$ is a constant string of ones and $e$ is the carry-in. **No rounding and no normalization logic outside the $\sqrt{\ }$ block** | correctly rounded; ties provably impossible; can never overflow or underflow | 353-356 |
| [[Faithful Square Root Normalization Unit]] | **0** — one mux, off the critical path | $M_S$ widened to `ufix(1,`$-w_F$`)`, one precomputed $E_S+1$, one mux driven by the MSB; **no extra rounding step** afterwards, unlike multiplier and divider | repairs **one** input value in $2^{w_F}$, where a faithful $\sqrt{\ }$ may return the unrepresentable $2.0$ | 355 |
| [[Left-Truncated Squarer]] | $+1$ squarer | only the columns of $S_0^2$ that can differ from $X$; the square-root transpose of the divider's left-truncated multiplier ([Din+10]) | $<1$ ulp $\to$ $\le\tfrac12$ ulp | 356-357 |
| [[Floating-Point Comparator]] | **1** — a $(w_E{+}w_F)$-bit integer comparison | plus a flat NaN/zero/infinity layer. **Subnormals are free** — the biased encoding already orders them. Deleting predicates is free; the comparator itself only halves when both input signs are fixed | exact by construction | 357-360 |

**Chapter 11 reports no synthesis results whatsoever, so five columns you would expect are "—" everywhere: LUT counts, slice counts, DSP block counts, $f_\text{max}$ and ns delay.** Cycle counts are $1$ for every row except the two that state otherwise ([Bru18]'s $+2/+1$ for the divider's subnormals, p. 350, and Lutz's 1-cycle double-precision adder, p. 342). The only hard quantities in the whole chapter are the bit widths of Figs. 11.5-11.10, the slow-block arguments above, "two 54-bit incrementers and seven 54-bit adders" (p. 342), "more than doubles the latency" (p. 345) and "an appreciable reduction in area and delay" (p. 346). Anything more precise is your own synthesis run.

**The chapter's second axis is the accuracy contract, and it does not rank the operators the same way.**

| Operator | What the last ulp costs | What faithful buys | p. |
| --- | --- | --- | --- |
| Add | the sticky over the whole shifted-out tail, plus tie logic — the sticky **is** the compliance cost | nothing worth having; a faithful adder "would bring little benefit" | 339 |
| Multiply | an exact $(2w_F{+}2)$-bit product plus a rounding adder; ties-to-even is an OR tree that never joins the critical path | a truncated significand multiplier, **architecture unchanged** | 344-346 |
| Divide | a left-truncated multiply $+$ a comparison $+$ a second rounding addition $+$ logic, **for one bit** | a divider faithful to $2^{-w_F-2}$; the bound survives normalization and rounding | 348, 351-352 |
| Square root | a left-truncated squarer for $\operatorname{sign}(S_0^2-X)$ | a faithful $\sqrt{\ }$ — but it drags in the $M_X^\text{max}$ fix, or one input returns $1.0$ instead of $\approx2.0$ | 355-357 |
| Compare | — | — (exact by construction) | 357 |

**If the constraint is latency, the only operator worth restructuring is the adder.** Multiplication has two slow blocks and division and square root have essentially one plus their kernel; addition has five, and every trick in the chapter aims at that number. Take the plain [[Floating-Point Adder]] whenever the operator is buried in a pipelined application-specific datapath — five blocks in series is fine if you have five stages to give them, and it is the smallest thing that adds two floats correctly. Go to the [[Dual-Path Floating-Point Adder]] the moment single-cycle or near-single-cycle addition is a requirement: it halves the depth for one extra significand adder and one output mux, because a large alignment shift and a large normalization shift cannot both happen. Add a [[Leading Zero Anticipator]] as soon as you also need subnormals, and not before — subnormal support forbids the fused LZC+shifter, which pushes the near path to three slow blocks and eats exactly the gain you paid for. [[Speculative Floating-Point Adder]] is where this ends and it is an ARM-scale answer: seven 54-bit adders and two incrementers to reach one cycle at 1 GHz, which is worth it only when the adder is the machine's headline number rather than one block in a datapath.

**If the constraint is accuracy, decide first whether the operator is user-visible, then take the cheapest thing that meets the budget.** Inside a datapath already sized by an error analysis ([[Error Accuracy]]), faithful is almost always the right contract for multiply, divide and square root: [[Faithful Floating-Point Multiplier]] is free in the sense that matters, since the architecture does not change at all and only the significand multiplier shrinks; the divider is faithful as soon as its kernel is; and the square root is the easiest operator in the chapter to begin with. Buying the last ulp back — [[Correct Rounding from Faithful Quotient]] or [[Left-Truncated Squarer]] — costs a whole extra multiplication or squaring, a comparison and a second rounding, and the book's own verdict is that for a fixed application accuracy you are usually better off keeping the faithful result **one bit wider** than paying for that hardware. Reserve correct rounding for operators that are programmer-visible or that must reproduce bit-for-bit across implementations. Two exceptions cut the other way: the [[Floating-Point Divider]] is correctly rounded for free, because ties cannot occur when input and output formats match, so there is nothing to save by relaxing it; and if you do go faithful on the square root you must buy the [[Faithful Square Root Normalization Unit]] regardless of budget, because its failure mode is a factor of two at one input value out of $2^{w_F}$ and random testing will never find it.

**If the constraint is area, the question is really "how much of IEEE 754 do I actually need", and the answer is dominated by two blocks.** The [[Sticky Bit Generator]] is the bulk of an adder's compliance cost, and it is all-or-nothing: it is mandatory for every directed rounding mode, so if you need those you pay for it and ties-to-even then comes nearly free on top. If you need neither, drop to round-to-nearest ties-away — a lone $1$ injected at position $-w_F-1$, which the [[Floating-Point Rounding Adder]] is already doing — and delete the block. The [[Subnormal Normalization Unit]] is the other one, and the chapter's headline advice is to not buy it: **widening the exponent by one bit is usually cheaper than supporting subnormals** (p. 330). If you must, use the one-shift route rather than normalize-multiply-denormalize, which more than doubles a multiplier's latency; the cost that actually hurts is not area but that in an adder it lands on the critical path and breaks the dual path. [[Floating-Point Exception Handling]] you do not get to choose — it is a flat gate layer around every operator here, and it is also the only thing distinguishing an IEEE comparator from an `Nfloat` one.

**FPGA and ASIC diverge in three places, and only one of them is a choice.** On FPGA, do the swap in the [[Exponent Difference and Swap Unit]] by comparing the whole exponent-fraction concatenation rather than the exponents alone: the wide comparison is fast and cheap on the fast carry logic (§6.3, p. 148), and it guarantees $M_X>M_Y$ so the significand block collapses from $|M_X\pm M_{Y_\text{a}}|$ to a plain subtraction with no absolute value and no sign-change flag. The book is explicit that the best $|M_X\pm M_{Y_\text{a}}|$ is technology-dependent — on ASIC a compound adder may win instead (p. 338). [[Injection Rounding]] is a natural fit for the FPGA bit-heap flow, since the injected constant is one more column in a heap that is going to be compressed anyway and the compound adder rides the same carry chain as the plain one; it is the single best latency trade available to a multiplier on either technology, turning two slow blocks into one. And the format decision sits above all of it: `Nfloat` and relaxed compliance are correct for an operator buried in an application-specific datapath, full IEEE 754 becomes non-negotiable the moment the architecture is programmable and exposes standard formats — the book's case study is GPUs, where the liberties were acceptable while GPU programming was niche and unacceptable the moment it went mainstream (p. 330).

**Related Notes.**

- [[Floating-Point Operators]] – depends-on: the topic note this table summarises, with every derivation behind it.
- [[Floating-Point Adder]] – compares: the five-blocks-in-series baseline every adder row is measured against.
- [[Dual-Path Floating-Point Adder]] – compares: five slow blocks down to two per path, for one adder and one mux.
- [[Leading Zero Anticipator]] – extends: what makes the dual path survive subnormal support.
- [[Speculative Floating-Point Adder]] – compares: the extreme end, one cycle at 1 GHz for seven 54-bit adders.
- [[Exponent Difference and Swap Unit]] – depends-on: the front block of every adder row, and where the FPGA/ASIC fork starts.
- [[Sticky Bit Generator]] – compares: the bulk of an adder's IEEE 754 cost, and all-or-nothing.
- [[Floating-Point Rounding Adder]] – depends-on: the last block of every operator, and the reason a biased exponent is free.
- [[Floating-Point Exception Handling]] – depends-on: the flat layer wrapped around every row, chosen by nothing.
- [[Subnormal Normalization Unit]] – compares: the feature the chapter recommends replacing with one more exponent bit.
- [[Floating-Point Multiplier]] – compares: two slow blocks, quadratic area — structurally trivial where the adder is awful.
- [[Faithful Floating-Point Multiplier]] – extends: the same architecture with a smaller multiplier and 1 ulp instead of half.
- [[Injection Rounding]] – extends: the multiplier's one latency trick, two slow blocks into one.
- [[Floating-Point Divider]] – compares: correctly rounded for free, and an exponent path with one adder fewer than it looks.
- [[Correct Rounding from Faithful Quotient]] – extends: a whole multiply and a second rounding, for one bit.
- [[Floating-Point Square Root]] – compares: the cheapest operator here — no rounding, no normalization, one exponent addition.
- [[Faithful Square Root Normalization Unit]] – counter-example: the one row you buy for correctness rather than for cost.
- [[Left-Truncated Squarer]] – extends: the square-root transpose of the divider's last-ulp multiply.
- [[Floating-Point Comparator]] – compares: the row where the encoding does the work and subnormals cost nothing.
- [[Number Formats]] – depends-on: the biased encoding and the "is normal" bit that half these rows exploit.
- [[Error Accuracy]] – depends-on: the ulp and faithfulness definitions the accuracy column is written in.

No diagram: the two structures worth placing side by side, the baseline and the dual path, are already drawn in [[Floating-Point Adder]] and [[Dual-Path Floating-Point Adder]], and a third copy would say less than the slow-block column does.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 11 "Basic Floating-Point Operators", pp. 329-360. Every number above is from:

- Chapter introduction, pp. 329-330 — faithful versus correct as a context-specific choice, subnormals versus one more exponent bit, and the GPU case study.
- §11.1.1, pp. 331-336 — Table 11.1 and the exception interface (p. 331); far/near terminology and Figs. 11.1-11.4; the $(w_F{+}3)$-in / $(w_F{+}4)$-out adder sizing and the sticky's role in directed rounding (pp. 335-336).
- §11.1.2, Fig. 11.5, pp. 336-339 — the five-block baseline, the exponent difference saturated to $w_F+2$ (p. 337), the saturated LZC, the $E_X+1$ trick, the $w_E+2$-bit exponent and the rounding adder's free exponent bump (p. 338); the FPGA concatenated-comparison swap (p. 338, citing §6.3, p. 148).
- §11.1.3, pp. 339-340 — ties-to-even, the sticky as the bulk of the overhead, "would bring little benefit" for a faithful adder (p. 339); subnormal support and the loss of the fused LZC+shifter (p. 340).
- §11.1.4, Fig. 11.6, pp. 340-342 — the mutual-exclusion observation and the far/near block counts (p. 341); "quite well balanced", the near path's third slow block under subnormals, leading zero anticipation, and Lutz's operator count (p. 342).
- §11.2, pp. 343-347 — eq. (11.1) and Fig. 11.7, the two-binade range and the exponent multiplexer (pp. 343-345); ties-to-even off the critical path and "more than doubles the latency" for naive subnormal multiplication (p. 345); the faithful multiplier's two error budgets (p. 346); injection rounding, the bit-heap column, the compound adder and the overflow mux (pp. 346-347).
- §11.3, pp. 347-352 — eq. (11.2) and Fig. 11.8, the LSB-substitution trick (p. 349); no ties in binary FP division, the null-remainder sticky for directed modes, [Bru18]'s $+2/+1$ cycles (pp. 349-350); the faithful error propagation (p. 351); Fig. 11.9 and the left-truncated deciding multiply (pp. 351-352).
- §11.4, pp. 353-357 — eqs. (11.4)-(11.6) and Fig. 11.10, the single-addition exponent halving and the absence of rounding logic (p. 354); the $M_X^\text{max}$ Taylor bound and the three repairs (p. 355); no ties for square root, subnormal inputs reusing the baseline unchanged (p. 356); the left-truncated squarer, [Din+10] (pp. 356-357).
- §11.5, Tables 11.5-11.6, Figs. 11.11-11.12, pp. 357-360 — bit-pattern order including subnormals (p. 357); the four predicates and the NaN rules (pp. 358-359); specialization and when the integer comparator halves (p. 360).

Secondary: [Lut19] D. Lutz, "ARM Floating-Point 2019: Latency, Area, Power", *ARITH* 2019 (cited p. 342); [SN01] Schmookler & Nowka and [Lut17] Lutz on leading zero anticipation (cited p. 342); [Bru18] J. Bruguera, "Radix-64 Floating-Point Divider", *ARITH* 2018 (cited p. 350); [Din+10] de Dinechin, Joldeş, Pasca, Revy, *FPL* 2010 (cited p. 356); [Mul+18] Muller et al., *Handbook of Floating-Point Arithmetic*, 2nd ed. — lemma 4.13, no ties in binary FP division (cited p. 349).

No RTL: this note is a comparison, not a circuit.
