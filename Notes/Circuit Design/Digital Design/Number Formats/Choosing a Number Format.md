---
title: Choosing a Number Format
description: "Trade-off table across the 7 Number Formats circuits, with the source's own numbers — and the admission that Chapter 2 contains no synthesis figures at all."
kind: comparison
source: "ASA Ch. 2, pp. 33-63"
status: seed
spade: n/a
tags: [digital, number-formats, comparison, fixed-point, lns, redundant]
aliases:
  - Number Format Trade-offs
  - Which Number Format
  - Number Format Comparison
  - Choosing a Number Representation
---

# Choosing a Number Format

The seven circuits of this topic are not seven answers to one question: four of them are format *boundary* logic that you build whether you like it or not, and only three represent a decision — carry-propagate against carry-free, and fixed point against the logarithmic domain.

| circuit | structural cost | logic depth | width / storage effect | LUT · slice · delay · DSP · cycles | p. |
| --- | --- | --- | --- | --- | --- |
| **Sign Extension** | $0$ gates; one net with fanout $m'-m+1$ | $0$ levels | $\mathrm{sfix}(m,\ell)\to\mathrm{sfix}(m',\ell')$; the *consumer* grows by $m'-m$ full-adder stages | — | 42 |
| **Two's Complement Negator**, stand-alone | $w$ inverters $+$ a $w$-bit increment of half-adder cells (≈ half a full adder) | 1 gate level, then a carry propagation of length $\le w$ — $O(\log w)$ as a prefix network | $w\to w$; the carry out of position $w-1$ is discarded | — | 37 |
| **Two's Complement Negator**, folded into its consumer | $w$ inverters; the $+1$ rides the consuming adder's $c_{\text{in}}$ | 1 gate level | $w\to w$ | — | 37-38 |
| **Sign-Magnitude to Two's Complement Converter** | $w-1$ XOR gates $+$ the same increment, gated by $s$ | 1 XOR level, then the same carry propagation | $w\to w$; fails on the single input $-2^{w-1}$ | — | 38 |
| **Fixed-Point Format Narrowing** at the LSB (truncate) | $0$ gates — the discarded bits are simply not routed | $0$ levels | $\mathrm{ulp}\,2^{\ell}\to2^{\ell'}$, $w'=m'-\ell'+1$ | — | 43 |
| **Fixed-Point Format Narrowing** at the MSB, proof discharged | $0$ gates | $0$ levels | $m\to m'$, errorless iff the discarded bits were a sign extension | — | 43 |
| **Fixed-Point Format Narrowing** at the MSB, guarded | all-equal test over $m-m'+1$ bits (one OR tree, one AND tree) $+$ $w'$ two-input muxes | $O(\log(m-m'+1))$ $+$ 1 mux | $m\to m'$ | — | — † |
| **Carry-Free Signed-Digit Adder** | one SPLIT $+$ one digit add per digit, $\Theta(W)$ total; each SPLIT is a function of $2\lceil\log_2(2a+1)\rceil=6$ input bits at $\beta=4$ | **$2$, independent of $W$** | $3$ bits per digit at $\beta=4,a=3$ — $3W$ bits to hold the range of $2W$ binary bits, **$+50\%$ storage**; result is $W+1$ digits | — | 47-48 † |
| **Carry-Free Signed-Digit Adder**, exit to binary | one full-width carry-propagate subtraction $z^{+}-z^{-}$, or an MSB-first digit recurrence | $\Theta(W)$ | back to $2W$ bits | — | 48 |
| **LNS Multiplier** | **1 adder** of $w_E+w_F$ bits; the divider is that same adder in subtract mode; squarer $=L_X\ll1$ and square root $=L_X\gg1$, $0$ gates each | adder depth, $O(\log w)$ as a prefix tree | word is $w_E+w_F+3$ bits, matching $\mathrm{Nfloat}(w_E,w_F)$ bit for bit | — | 58 |
| **LNS Adder** | 1 subtractor $+$ **one evaluation of $f_\oplus$ or $f_\ominus$ over the whole $(w_E{+}w_F)$-bit word** $+$ 1 adder | subtractor, table and adder in series | direct table $2^{w_E+w_F}$ entries — $32$ at $(3,2)$, $2^{31}$ at $(8,23)$; after range reduction $O(w_F2^{w_F})$, i.e. $14$ live entries at $(3,2)$ but still $\approx2\cdot10^{8}$ entries of $24$ bits $\approx630$ MB at $(8,23)$ | — | 59 † |

† marks a cell the source does not state. The book's p. 43 says MSB narrowing "should be avoided" and never costs the alternative; the SPLIT input count, the $50\%$ storage overhead and every LNS table size are derived from §2.4 and §2.6's own equations in the sibling notes, not read off a page.

> [!warning] Chapter 2 contains no synthesis numbers whatsoever
> The whole "LUT · slice · delay · DSP · cycles" column is `—` on purpose. There is not one LUT count, slice count, DSP-block count, nanosecond figure or cycle count for any of these circuits anywhere in pp. 33-63; the chapter is a formats chapter and prices everything in structure. Real numbers live in the operator chapters — [[Adders]], [[Multipliers]], [[Dividers]] — and comparing *detect-and-saturate* against *widen $m$ by one bit*, or an LNS multiplier against a DSP-block multiplier, needs measurements this source does not supply.

**Four of the seven are obligations, not options.** [[Sign Extension]], [[Two's Complement Negator]] and [[Sign-Magnitude to Two's Complement Converter]] are what a format boundary costs; [[Fixed-Point Format Narrowing]] is what finite width costs. You do not choose between them, you choose *where to put them*, and the only genuinely free placements are in the table: sign extension is free everywhere (p. 42), LSB truncation is free everywhere (p. 43), and negation is free exactly when it lands on an adder that already has an unused carry-in (pp. 37-38). The corresponding rule is one sentence — never build a stand-alone negator or a stand-alone increment if a downstream adder can swallow it, because on that path you are paying full adder latency to change a sign. The one real format decision in this group is sign-magnitude versus two's complement at the interface, and it is not close: two's complement addition is exact in $\mathbb{Z}/2^w\mathbb{Z}$ with one datapath, sign-magnitude needs a magnitude comparator and two, and the book records that it is "almost never used for integers" (p. 38). Convert at the boundary and think in two's complement inside.

**Latency picks the redundant format, and only when the latency is in a loop.** [[Carry-Free Signed-Digit Adder]] is the only circuit here that changes an asymptotic: depth $2$ regardless of $W$, against $\Theta(W)$ for a ripple chain, for the same $\Theta(W)$ logic (pp. 47-48). It buys that with $50\%$ more storage per word, a $W{+}1$-th digit, non-local comparison and sign tests, and — the cost that actually decides it — one full carry-propagate subtraction to get *out* of the representation. So a single redundant addition is strictly worse than a plain one, and the format only pays when many additions sit between one conversion and the next. The clean case is a recurrence whose next input depends on this cycle's output, where the carry chain is inside the feedback loop: SRT-style digit recurrences, long accumulations. Where the adds are independent, the right answer is a plain adder pipelined, or [[CSA, Carry-Save Adder]], which holds the same "carries not yet assimilated" state at one bit per weight instead of a whole extra digit plane.

**Operation mix, not width, picks LNS.** [[LNS Multiplier]] turns multiply into one $(w_E+w_F)$-bit adder and divide into that same adder subtracting, with square and square root as pure wiring, all four exact (eqs. 2.21-2.24, p. 58) — $O(w)$ area where a fixed-point multiplier is $O(w^2)$ and a divider is a digit recurrence. Every bit of that is handed back at [[LNS Adder]], whose transcendental $f_\oplus$ must be evaluated over the full word. Count the workload before choosing: a length-$n$ dot product has $n$ multiplies and $n-1$ adds, a 1:1 ratio at which the table dominates and LNS loses. LNS wins where multiplies, divides and roots heavily outnumber additions *and* $w_F$ is small enough that the table survives — the table is $O(w_F2^{w_F})$ and independent of $w_E$, so $w_F\gtrsim10$ ends the discussion. That is exactly why the live case is small-precision machine learning, and the book's own summary is that for such applications LNS has been shown "more efficient in terms of speed and area than floating point" (p. 60). Against that, LNS represents only powers of two exactly — $3$ is not representable (p. 58) — so anything that needs a contiguous run of exact integers is out.

**Accuracy is a cursor; range is a proof obligation.** The two ends of a fixed-point word fail differently and are chosen differently (p. 43). $\ell$ is continuous: raise it, lose a quantifiable amount of accuracy, save bits in every operator downstream — this is the area-versus-accuracy trade and it is tuned, not proved. $m$ is discrete and unforgiving: get it wrong and the value wraps modulo $2^{m'+1}$, losing sign and order of magnitude at once. So the design flow is asymmetric. Widen with [[Sign Extension]] up to the smallest $m$ a worst-case analysis says cannot overflow, tighten that $m$ with whatever the application knows about its own ranges, and then narrow at the LSB to hit the error budget. Guard hardware exists only for the MSBs whose bound you could not prove; if you find yourself building saturation logic on a path where the proof was available, you bought a mux delay on every output bit for nothing.

**FPGA and ASIC reverse two of these calls.** On an FPGA the hard carry chain is the cheapest structure the fabric offers, so the XOR row of the converter and the inverter row of the negator both fold into LUTs that the increment needed anyway — add, subtract and conditional-negate land on identical resource counts, and the guarded narrow's all-equal test plus saturation mux often costs zero extra logic levels because a 6-input LUT swallows both. That same hardening is what defeats the signed-digit adder below a few hundred bits: constant depth wins nothing against a chain that is already effectively flat, while costing $1.5\times$ the registers. And it flips the LNS accounting entirely — the multiplier becomes one carry-chain, no DSP block at all, against a fixed-point multiplier competing for a scarce discrete DSP budget, while the adder's table stops being LUTs and becomes BRAMs plus a mandatory pipeline register, since a block RAM read is synchronous. On an ASIC none of those hardened resources exist: the XOR row is real silicon roughly twice the area of the NOT row and one gate delay ahead of the adder, the guard tree is a real gate tree on the critical path, and the LNS table is a compiled ROM or synthesised logic that collapses nicely only because most of its entries are the same constant.

**Related Notes.**

- [[Signed Fixed-Point Format]] – depends-on: the $(m,\ell)$ pair every row of the table is parameterised by, and the source of the two knobs the last paragraph splits apart.
- [[Sign Extension]] – compares: the only widening in the list, and the only one that is free in gates at both ends.
- [[Fixed-Point Format Narrowing]] – compares: the reverse direction, where the same identity that made widening free becomes the condition under which narrowing is legal.
- [[Two's Complement Negator]] – compares: the baseline cost of a sign change, and the absorption trick that makes it zero.
- [[Sign-Magnitude to Two's Complement Converter]] – compares: what the boundary costs when the outside world insists on sign-magnitude, plus the one input code that has no image.
- [[Carry-Free Signed-Digit Adder]] – counter-example: the one circuit here that changes an asymptotic, and the one whose advantage an FPGA's hard carry chain erases.
- [[LNS Multiplier]] – compares: the cheap half of the logarithmic domain, $O(w)$ against $O(w^2)$.
- [[LNS Adder]] – counter-example: the expensive half, whose table size is the reason the multiplier's win is confined to small formats.
- [[IEEE 754 Format]] – compares: the middle ground that pays an alignment shifter and a normalising shifter on every addition instead.
- [[Nfloat Format]] – compares: the same middle ground re-cut for a custom pipeline, and the format LNS matches bit for bit at equal $(w_E,w_F)$.
- [[Error Accuracy]] – supports: what "$\tfrac12$ ulp" buys and how the rounding half of narrowing composes through a datapath.
- [[FPGAs]] – supports: the LUT-plus-carry-chain and BRAM structure behind the whole last paragraph.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 2:

- §2.1.3-2.1.4, pp. 37-38 — sign-magnitude's two zeros and its symmetric range; both conversion directions as a two's complement negation; "almost never used for integers"; the failure on $-2^{w-1}$.
- §2.2.3, p. 42 — sign extension and the identity $-2^{m}=-2^{m'}+\sum_{i=m}^{m'-1}2^{i}$, Fig. 2.8.
- §2.2.4, p. 43 — overflow at the MSB versus rounding at the LSB, the worst-case $m$ analysis tightened by context, and $\ell$ as the accuracy-versus-performance cursor.
- §2.4, pp. 46-48 — redundant digit sets, Cauchy's decimal system, the two-step carry-free addition, and the carry-delaying remark.
- §2.5, pp. 48-56 — Table 2.4, p. 55, for the Nfloat width $w_E+w_F+3$ used in the LNS row.
- §2.6.1-2.6.3, pp. 57-60 — Fig. 2.17 (field layout, p. 57), eqs. (2.21)-(2.24) (p. 58), only powers of two exactly representable (p. 58), $f_\oplus$ and $f_\ominus$ (p. 59), and the closing trade-off with the LNS-beats-floating-point applications (p. 60).
