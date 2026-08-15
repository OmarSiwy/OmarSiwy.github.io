---
title: "Choosing a Specialized Floating-Point Operator"
description: "Trade-off table across the 16 Floating-Point Specialization circuits, with the source's own numbers — bit widths, block counts and two ratios, and no synthesis figures anywhere."
kind: comparison
source: "ASA Chap. 15, pp. 453-472"
status: seed
spade: n/a
tags: [digital, floating-point-specialization, comparison, floating-point, hls]
aliases:
  - Choosing a Floating-Point Specialization
  - Floating-Point Specialization Trade-offs
  - Choosing a Specialized FP Operator
---

# Choosing a Specialized Floating-Point Operator

Two independent levers run through this topic and they pull opposite ways: **specialization** deletes hardware because a compile-time constant makes some cases unreachable, and **fusion** adds hardware because deleting a rounding step requires a wider internal datapath. A choice is only meaningful once you know which lever you are pulling.

| Circuit | Area — the source's own measure | Latency / logic depth | Error | LUT · slice · DSP · delay · cycles | Page |
| --- | --- | --- | --- | --- | --- |
| *generic FP multiplier* (baseline) | full $(w_F{+}1)\times(w_F{+}1)$ multiplier $+$ bias subtractor $+$ sign XOR $+$ post-normalization rounding adder | exp add → mult → 1-bit norm → round adder, in series | $0.5$ ulp | — | 344 |
| [[Floating-Point Multiplier by a Power of Two]] | exponent adder only; the significand datapath does not exist | one $(w_E{+}1)$-bit add, result as $\mathrm{sfix}(w_E,0)$ | $0$ (exact) | — | 454-455 |
| [[Faithful Floating-Point Constant Multiplier]] | constant multiplier on $k=1{+}w_F$ constant bits; bias subtractor, sign XOR and generic multiplier all deleted | rounding folded into the bit heap; `product normal?` in parallel with the product | $1$ ulp | — | 455-457 |
| [[Product Normalization Predictor]] | one constant comparator on $F_X$; the post-normalization adder it replaces is "at least as large" | takes the exponent update and the rounding addition off the critical path | exact decision; no error of its own | — | 456 |
| [[Correctly Rounded Floating-Point Constant Multiplier]] | *exact* constant multiplier on $2{+}w_F{+}k$ bits, $k\le w_F$ for a float $C$; $k\approx 2w_F{+}1$ for a real $C$, costing **less than a factor 2 in area** | delay overhead "much smaller", since delay grows logarithmically with precision | $0.5$ ulp, bit-for-bit IEEE | — | 457-460 |
| [[Pseudo-Sticky Tie Anticipation]] | replaces the sticky path over the low product bits by a test on $F_X$; when $k-1>w_F$ there is **no sticky path at all** | off the multiplier's critical path | unchanged, $0.5$ ulp | — | 458-459 |
| [[Floating-Point Multiplier by a Rational Constant]] | truncate $A/B$ to $w_F+1+\lceil\log_2 B\rceil$ bits; exclusion zone of radius $2^{-w_F-1}/B$ around every midpoint | same architecture as the float-constant case | $0.5$ ulp | — | 461-462 |
| [[Saturated Normalizer]] | LZC $+$ shifter of range $E_C$ instead of $w_F$ | depth $\lceil\log_2(E_C{+}1)\rceil$ instead of $\lceil\log_2(w_F{+}1)\rceil$ — one $\log$ factor shallower | unchanged | — | 462-463 |
| [[Constant Multiplier with Subnormal Support]] | $C>1$: $+$ one saturated normalizer, shift $\le E_C$. $C<1$: $+$ a post-multiplier right shift of range $\lvert E_C\rvert$, and the merged rounding is **forfeited** | $C<1$ reverts to rounding *after* normalization | unchanged | — | 462-464 |
| [[Floating-Point Divider by a Small Odd Constant]] | constant divider $+$ one small exponent adder $+$ one significand mux; divider bus $w_F{+}E_D{+}2$ bits | normalization decision is an $E_D$-bit compare of $F_X$ against $F_D$ | $0.5$ ulp, bit-for-bit IEEE | — | 464-466 |
| [[Dividend Bias Rounding]] | the rounding adder **entirely**: $H=(D{-}1)/2$ on $E_D$ bits drops into the $E_D{+}\varepsilon$ bits the shift already zeroed | zero — concatenation, no carry can propagate; $D$ odd ⇒ no sticky logic either | unchanged, $0.5$ ulp | — | 466 |
| [[Floating-Point Power Operator]] | exact $(1{+}F_X)^p$ is $p\times(1{+}w_F)$ bits; square-and-multiply gives $M^5=(M^2)^2\times M$ — two squarers and one multiplier instead of four multiplications | $p$-bit normalization; the $p{-}1$ border comparisons run in parallel and priority-encode, so exponent processing is off the critical path | $0.5$ ulp exact; $1$ ulp if replaced by polynomial approximation | — | 467-469 |
| [[Positive-Term Floating-Point Adder]] | close path deleted: LZC, $(w_F{+}1)$-bit left normalizer, path-select mux, close-path exponent decrement — **about $1/3$ the hardware of a generic FP adder** [Som+20] | the LZC's $\lceil\log_2(w_F{+}1)\rceil$ levels leave the operator | $0.5$ ulp — **no accuracy cost** | — | 468-469 |
| [[Fused Add-Subtract Unit]] | 3 paths (1 close, 2 far) and **1** alignment shifter, against 4 paths and 2 shifters for two adders; operand decode shared | one decode and one alignment shift instead of two | $0.5$ ulp | — | 469 |
| [[Fused Multiply-Add]] | internal accumulator $\approx 3w_F$ bits; **more expensive than an adder and a multiplier combined** | one rounding and one normalization instead of two in series | $0.5$ ulp always, against $1$ ulp unfused without cancellation and **unbounded** under cancellation | — | 469 |
| [[Fused Sum of Squares]] | saves **both area and latency** against separate multipliers and adders; positivity deletes the close path as above | one rounding for the whole sum | $1$ ulp (faithful) | — | 12, 470 |
| [[Divide-by-Self Specialization]] | a divider replaced by a mux driven by an exponent test — $8$ bits for single precision, $11$ for double | the mux propagates and can be **pushed down the computation** | exact | — | 471-472 |

**The last column is empty because the source is empty there.** Chapter 15 quantifies cost as bit widths, structural block counts, and exactly two ratios — "about 1/3 the hardware of a generic floating-point adder" (p. 469) and "less than this factor 2 in area" (p. 460). There is no LUT count, no slice count, no DSP count, no delay in nanoseconds and no cycle count anywhere in pp. 453-472. Everything above is a width, a block, a depth, or one of those two ratios. Nothing has been supplied from elsewhere to fill the column.

> [!warning] Two entries are the book's own gaps, not omissions here
> The $C<1$ subnormal architecture is declined outright — "We do not detail the architecture here" (p. 464) — so its row states only the two savings the text does give. And §15.2 offers no cost figure at all for a generic FP divider to compare the constant divider against; the claim is qualitative, "at a fraction of the cost" (p. 464).

**Is one operand a synthesis-time constant?** If yes, the specialized variant is never worse, and the only question left is which one. $C=2^{E_C}$ is the degenerate case worth checking for first: the significand path vanishes outright and the operator is one $(w_E{+}1)$-bit exponent add at zero error, so an HLS compiler that instantiates a full multiplier for `x * 2.0` is paying for a rewiring. For a genuine constant, the bias subtractor goes because $E_C$ is available *unbiased* at compile time and $(E_R+E_0)=(E_X+E_0)+E_C$ lands already biased (p. 454) — that is an algebraic saving, not a circuit trick, and it does not depend on which rounding you pick. A rational $A/B$ is not a special case to avoid: Theorem 15.1 fixes the truncation width at $w_F+1+\lceil\log_2 B\rceil$ bits, so dividing by $3$ or by $10$ costs barely more than multiplying by an arbitrary float.

**Accuracy is decided by legality, not by numerics.** The gap between faithful and correctly rounded is one bit, and it costs roughly double the constant width — $k\approx 2w_F+1$ against $k=1+w_F$ — which because constant multiplication is sublinear in constant size [DIZ07] comes out as *less than* a factor 2 in area, and much less than that in delay (p. 460). The book still calls that a large price for one bit. So do not buy correct rounding for accuracy's sake; buy it when the operator must be substitutable for a software run bit-for-bit, which is the HLS case and the only case where a compiler is legally allowed to swap a generic multiplier for a constant one. Then check whether you even have to pay the sticky path: the parity argument behind tie anticipation frequently proves ties impossible outright when $k-1>w_F$, and the proof is compile-time arithmetic on the constant.

**Latency-driven choices are almost all free.** The distinctive thing about this topic is how many optimizations improve delay at zero or negative area cost, because what they delete is a serial block and what they add is a comparator against a constant. The normalization predictor replaces a post-normalization adder with a comparator that is provably no larger (p. 456); dividend bias rounding replaces a rounding adder with *wiring*, since the normalization left shift has already zeroed exactly the $E_D$ bits $H$ occupies; the power operator's $p-1$ border comparisons priority-encode in parallel with a significand path that is far longer anyway. If latency is the binding constraint, take all three — there is nothing to trade. The one place the pattern reverses is subnormal support with $C<1$, where the right shift cannot be moved before the multiplier (no shifted-out bit may be discarded), so rounding returns to its position after normalization and the merged-rounding trick is lost.

**Cancellation decides everything on the fusion axis.** Fusion is worth its wider datapath exactly when the unfused error bound is measured against the wrong quantity: with $|ab|\lesssim|ab+c|$ the FMA buys half an ulp against one, which rarely justifies being more expensive than an adder and a multiplier combined, but under cancellation the unfused relative error is bounded by nothing at all while the FMA's is still $u$. The same criterion, read the other way, is why sign structure is the cheapest information an application can hand you: guaranteed same-sign terms make the close path unreachable, and its LZC, left normalizer and path mux come out for free at $0.5$ ulp. That is the design rule of p. 470 in both directions — faithful rounding yields significantly cheaper fused operators *only* for sums of same-sign terms, because otherwise handling cancellation forces you to compute most of the exact bits anyway. A fused sum of squares gets that guarantee from its own dataflow rather than from the user's inputs, which is why it saves area *and* latency where a general fused sum of products saves neither.

**On FPGA the economics shift twice more.** Constant significand multipliers are built from shift-and-add graphs or KCM tables in LUTs and the fast carry chain, so they never touch a DSP block — which is what makes the "less than $2\times$ area" figure for correct rounding tolerable, since the area being doubled is the cheap kind. And the `x/x` guard that is not worth writing in software, where the test may cost more than the division on a superscalar, is an all-zeroes-or-all-ones check on 8 or 11 exponent bits in hardware (p. 471); better still, $1.0$ is absorbed by multiplication and NaN is contagious, so the resulting mux pushes downstream and opens further specializations. On ASIC the first argument weakens — there is no DSP block to escape — but the deletions of blocks and paths are technology-independent and survive intact.

> [!note] The only free lunch in the chapter is a *precondition*, not a circuit
> Every area saving above is bought with either a compile-time constant or an accuracy relaxation, except one: the positive-term adder deletes about a third of the operator at $0.5$ ulp, unchanged, because the case it removes is unreachable rather than approximated. When an application can guarantee a sign, take it.

## Related Notes

- [[Floating-Point Multiplier by a Power of Two]] – compares: the degenerate specialization, exact and nearly free, that every other row is measured against.
- [[Faithful Floating-Point Constant Multiplier]] – compares: the baseline $\times C$ architecture the correctly rounded and subnormal variants both extend.
- [[Product Normalization Predictor]] – supports: the constant comparator that makes the faithful multiplier's merged rounding possible.
- [[Correctly Rounded Floating-Point Constant Multiplier]] – compares: the same architecture bought up to $0.5$ ulp for under twice the area.
- [[Pseudo-Sticky Tie Anticipation]] – supports: proves away most of the sticky hardware correct rounding would otherwise demand.
- [[Floating-Point Multiplier by a Rational Constant]] – extends: correct rounding for $A/B$ via an exclusion-zone bound on the truncation width.
- [[Saturated Normalizer]] – depends-on: the shallower normalizer that subnormal support is built from.
- [[Constant Multiplier with Subnormal Support]] – counter-example: the one specialization that *adds* hardware and gives back the merged-rounding trick when $C<1$.
- [[Floating-Point Divider by a Small Odd Constant]] – compares: the division-side counterpart of the constant multiplier, correctly rounded by construction.
- [[Dividend Bias Rounding]] – supports: deletes the divider's rounding adder in both area and latency by moving the correction into the dividend.
- [[Floating-Point Power Operator]] – extends: generalizes the normalization predictor from two operands to $p$ powers.
- [[Positive-Term Floating-Point Adder]] – compares: the only specialization here that costs nothing in accuracy.
- [[Fused Add-Subtract Unit]] – compares: fusion that saves area rather than buying accuracy, by sharing decode and alignment.
- [[Fused Multiply-Add]] – counter-example: the fusion that costs more than the sum of its parts, and is worth it only under cancellation.
- [[Fused Sum of Squares]] – extends: applies the positive-term argument inside a fusion, saving area and latency at once.
- [[Divide-by-Self Specialization]] – compares: a specialization whose economics exist only in hardware.
- [[Number Formats]] – depends-on: the $\mathrm{float}\langle w_E,w_F\rangle$ decomposition every row above is written in.
- [[Error Accuracy]] – depends-on: what $0.5$ ulp, $1$ ulp and "unbounded" mean in the error column.
- [[Multiplication by Constants]] – depends-on: the sublinearity result [DIZ07] that makes correct rounding affordable.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chap. 15 "Specialization and Fusion of Floating-Point Operators", pp. 453-472.
  - p. 454 — the unbiased-$E_C$ identity that deletes the bias subtractor; the power-of-two collapse.
  - p. 456 — "a post-normalization adder would be at least as large as the constant comparator in the `product normal?` block ... this improvement in delay comes at no cost in area".
  - pp. 458-459 — the odd-$I_C$ parity argument and the tie-case table behind pseudo-sticky anticipation.
  - p. 460 — $k\approx 2w_F+1$ for an irrational constant, sublinearity [DIZ07], "less than this factor 2 in area — this remains a large price to pay for one more bit of accuracy", and the logarithmic delay overhead.
  - p. 461 — Theorem 15.1, the $w_F+1+\lceil\log_2 B\rceil$ truncation width.
  - pp. 462-464 — the saturated normalizer's shift range $E_C$ versus $w_F$; "We do not detail the architecture here" for the $C<1$ subnormal case (p. 464).
  - pp. 464-466 — `FPConstDiv` "at a fraction of the cost"; the $E_D$-bit normalization compare; the $H$-concatenation that deletes the rounding adder.
  - pp. 467-469 — $p\times(1+w_F)$ exact power, square-and-multiply $M^5=(M^2)^2\times M$, the parallel border comparisons off the critical path.
  - p. 469 — "This saves about 1/3 the hardware of a generic floating-point adder [Som+20]"; the 3-path sum-and-difference [TDX12]; "an FMA is more expensive than an adder and a multiplier combined, as the requirement of a single rounding mandates a wider internal datapath".
  - p. 470 — the design rule that faithful rounding gives significantly cheaper fused operators only for sums of same-sign terms.
  - pp. 471-472 — the C-standard non-equivalences [StdC18]; "The exponent is only 8 bits for single precision and 11 bits for double precision"; pushing the multiplexer down the computation, Fig. 15.9.
- Fig. 1.5, p. 12 — the faithful fused sum of three squares, saving both area and latency.
- Baselines cross-referenced from within the chapter: Fig. 11.5 (FP adder) p. 337, Fig. 11.6 (dual-path adder) p. 341, Fig. 11.7 (FP multiplier) p. 344; §6.3.3 (comparison against a constant) p. 149.
