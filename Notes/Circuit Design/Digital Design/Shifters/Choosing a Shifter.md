---
title: Choosing a Shifter
description: "Trade-off table across the 16 Shifters circuits, with the source's own numbers — and the four constraints (output width, rounding, FPGA hard blocks, ASIC depth) that actually decide which one you build."
kind: comparison
source: "ASA Ch. 10, pp. 307-327"
status: seed
spade: n/a
tags: [digital, shifters, comparison, lzc, normalizer, fpga]
aliases:
  - Shifter Trade-offs
  - Shifter Comparison
  - Which Shifter
  - Choosing a Leading Zero Counter
  - Choosing a Normalizer
---

# Choosing a Shifter

A shifter is never the answer to anything — it is a step on somebody else's critical path — so the choice among these sixteen circuits is made by whatever constrains that path: how many output bits must survive, whether the consumer rounds, and whether the fabric hands you a free LUT merge or a free multiplier.

**Shifters**, normalised to $w_X=w_R=n=16$, $S_{\max}=n-1=15$, $w_S=4$ wherever a variant admits that shape.

| Variant | 1-bit muxes | Depth | Fanout | Concrete figure | Page |
| --- | --- | --- | --- | --- | --- |
| [[Exact Full Shifter]] | $\sum_i(w_X+2^{i+1}-1)$, LSB-first | $w_S$ | $w_R$ per $s_i$ | $58$ at $w_X{=}8,w_S{=}4$; $81$ MSB-first | p. 313 |
| [[Truncated Shifter]] | $\sum_i\min(w_R,\,w_X+2^{i+1}-1)$ | $w_S$ | $w_R$ per $s_i$ | interpolates $32\ldots58$ at $w_X{=}8$ | p. 313 |
| [[Barrel Shifters]] | $w_X\lceil\log_2(S_{\max}{+}1)\rceil$ | $\lceil\log_2(S_{\max}{+}1)\rceil$ | $w_X$ per $s_i$ | $16\times4=64$ muxes, depth $4$ | p. 315 |
| Barrel shifter on 6-LUTs | $\tfrac12 n\log_2 n$ LUTs | $\tfrac12\log_2 n$ | — | $32$ LUTs, depth $2$ | p. 314 |
| [[Shifter with Sticky Bit Computation]] | as barrel at $w_X{=}w_R{=}w_F{+}3$ | $w_S$ | $w_X$ per $s_i$ | **−20% area, −5% delay** vs. exact full + wide OR, binary32 adder | p. 316 |
| [[Bidirectional Shifter]] (two arrays) | $2w_Rw_S+w_R$ | $w_S+1$ | $w_R$ on `dir` | — | derived |
| [[Bidirectional Shifter]] (biased, recommended) | $w_Rw_{S'}$ + one $w_S$-bit adder | $w_{S'}$ | $w_R$ per $s'_i$ | — | p. 308–309 |
| [[One-Hot Shifter]] | $n(n-1)$ 2:1-equivalents | $2+\lceil\log_2(S_{\max}{+}1)\rceil$ | $S_{\max}$ on every $x_i$ | $240$ cells, fanout $15$ | derived |
| [[Shift by Multiplier]] | $S_{\max}{+}1$ LUTs + 1 DSP | 1 LUT + 1 DSP | $S_{\max}{+}1$ on $S$ | $16$ LUT6 + 1 DSP, exact 31-bit output | p. 325 |
| [[Sporadic Shifter]] | $m\,w_X$, $\lceil\log_2|\mathcal{S}|\rceil\le m\le w_S$ | $m$ | $w_X$ per enable | $\mathcal{S}{=}\{0,3,5,8\}$: $m{=}2$ rows against $4$ | p. 325 |

**Leading bit counters**, $w_X$ bits, $w_C=\lceil\log_2(w_X+1)\rceil$; concrete column at $w_X=16$, $w_C=4$.

| Variant | Muxes | Other gates | Delay | Fanout | Page |
| --- | --- | --- | --- | --- | --- |
| [[Leading Zero Counters]] (naive) | $w_X-w_C$ | $w_X-w_C$ 2-input NORs | $d_k=\tfrac{k(k+1)}{2}$, $=10$ levels | 2 | pp. 319–320 |
| [[Oklobdzija LZC Tree]] | $2^{k+1}-k-2\approx2w_X$, $=26$ | $w_X$ ANDs | $\log_2 w_X=4$ levels | $\log_2 w_X$ on $z_L$ | pp. 320–321 |
| [[Monotonic String Leading Zero Counter]] | none | Kogge–Stone prefix-OR + $w_X{-}1$ ANDs + $w_C$ ORs of width $w_X/2$; $92$ 2-input gates | $\approx2\log_2 w_X$ | $\le2$ | pp. 321–322 |
| [[Leading Bit Counter]] | as its base LZC | $+\,w_X$ XORs | $+\,1+\lceil\log_f w_X\rceil$ | $w_X$ on $b$ | p. 316 |
| [[Leading Zero Anticipation]] | — | $w$ LUTs, or $\approx3$ gates/bit on ASIC | off the critical path; $\pm1$ correction mux | 2 | p. 322, p. 342 |

**Normalizers**, concrete column at $w_X=14$, $w_C=4$.

| Variant | 1-bit muxes | Levels of delay | Latency | Pipelinable | Page |
| --- | --- | --- | --- | --- | --- |
| [[Normalizers]] (LZC then shifter) | $w_Xw_C+w_X-w_C=66$ | $\tfrac{w_C(w_C+1)}{2}+w_C=14$ | 1 cycle, constant | yes | p. 323, p. 315 |
| [[Fused Normalizer]] | $w_Xw_C=56$, plus $2^{w_C}{-}1=15$ NOR inputs | $\tfrac{w_C(w_C+1)}{2}=10$; $\approx\log_2 w_X$ on FPGA | 1 cycle, constant | yes | p. 325 |
| [[Sequential Normalizer]] | one $w_X$-wide row + $w_X{+}w_C$ flip-flops | 1 per cycle | $C+1$ cycles, $C\in[0,S_{\max}]$ | **no** | p. 324 |

Every "—" is a number the book does not give. §10.1.4 (p. 314) is three sentences and never presents the flat one-hot form at all, so its cell counts, depth and fanout are derived; likewise both bidirectional rows, since p. 308–309 argues the case qualitatively. §10.4 (p. 325) devotes one paragraph each to DSP-based and sporadic shifters and reports no area, delay or power for either — the LUT6 figures in the [[Shift by Multiplier]] row are derived from DSP port geometry, and no figure from Chen et al. is reproduced anywhere in this folder because that paper was not read. The [[Monotonic String Leading Zero Counter]] gate count is structural, not measured; the book gives no LUT or delay figure for it, for the [[Fused Normalizer]], or for the [[Sequential Normalizer]], whose cost model is FSM canon rather than ASA. The only *measured* number in the whole chapter is the 20%/5% on p. 316.

> [!warning] One sibling contradicts itself on the flat count
> [[One-Hot Shifter]] says "120 AND cells" in prose while its own boxed formula $\tfrac12n(n{+}1)$ gives $136$ at $n=16$. Both are the AND-cell count; the mux-equivalent figure $n(n-1)=240$ is what appears in every table here and in [[Barrel Shifters]], and is unaffected. Prefer the mux-equivalent column until that prose is fixed.

**Let the output width decide before anything else, because it is the only choice with an accuracy consequence.** Constraint (10.1), $S_{\max}\le\max(w_R,w_X)\le\min(w_R,w_X)+S_{\max}$ (p. 311), bounds the design space; inside it, $w_R=w_X+S_{\max}$ buys exactness at $0$ ulp and everything narrower is faithful only, up to $1$ ulp ([[Error Accuracy]]). Pick the [[Exact Full Shifter]] when a later stage still needs the low bits — and consume $S$ LSB-first, which costs $58$ muxes against $81$ for MSB-first at $w_X=8$, $w_S=4$ (p. 313), and starts stage 0 while the adder producing $S$ is still resolving its high bits. Pick a [[Truncated Shifter]] the moment the consumer is narrower than that, because the saving is hardware never built rather than hardware switched off: at $w_X=8$ the same formula falls from $58$ to $32$ once every stage is clipped at $w_R=8$. [[Barrel Shifters]] is that clip taken to $w_R=w_X$ and is the default ALU answer. Never build a [[Bidirectional Shifter]]: bias $S$ by the largest right shift and the direction disappears into an offset that a floating-point datapath was already paying as exponent bias (p. 308–309), against roughly $2w_Rw_S$ muxes for either honest two-direction implementation.

**If the consumer rounds, the sticky bit picks the architecture, and it picks it in your favour.** A shifter feeding an IEEE adder must distinguish an exact tie from a value just above one, which truncation alone cannot ([[Rounding]]). The naive construction — exact full shifter, then a wide OR over the discarded bits — pays twice, once in width to keep doomed bits alive and once in a serial OR. [[Shifter with Sticky Bit Computation]] pays neither: reversing the stage order puts the widest OR first, the word never grows past $w_F+3$, and the measured result on a binary32 adder is 20% less area and 5% less delay (p. 316). There is no constraint under which the naive form is preferable, so this is the one row of the table with a strict winner. The same argument transfers unchanged to a [[Sporadic Shifter]], whose per-stage discarded sets are still disjoint, and fails for [[One-Hot Shifter]] and [[Shift by Multiplier]], which have no stages to hide the OR inside — the DSP delivers the exact product and then makes you pay for the summary in series.

**On an FPGA, count LUTs and hard blocks; the mux columns above are the wrong currency.** A 6-input LUT is a 4:1 multiplexer, so two mux rows fold into one and a 16-bit barrel shifter is 32 LUTs at depth 2 rather than 64 muxes at depth 4 (p. 314) — with the standing trap that pipeline registers must go every *other* level or the fold is destroyed. Against that, [[Shift by Multiplier]] is $S_{\max}+1=16$ LUTs and one DSP at $w_X=16$, half the logic of the truncated barrel shifter while delivering the exact 31-bit result, and the gap widens with width because the decoder cost tracks $S_{\max}$ alone: 26 LUTs against 60 at $w_X=24$, $S_{\max}=25$ (p. 325). Take it whenever a DSP is idle. In the counters the same fabric argument reverses the asymptotics: wide NORs ride the fast carry chain rather than a gate tree, so the naive [[Leading Zero Counters]] at $O(\log^2 w_X)$ is the FPGA choice despite the tree variants (p. 320), and it is the *only* one that fuses. [[Sporadic Shifter]] buys nothing below $|\mathcal{S}|>4$, since a flat 4:1 mux already fits one LUT.

**On ASIC at large widths, depth is the only thing worth buying, and fanout is what you pay with.** [[Oklobdzija LZC Tree]] reaches $\log_2 w_X$ levels for about $2w_X$ muxes — 26 at $w_X=16$ against the naive 12 — but its select $z_L$ drives a whole $k$-bit mux slice at every level, so the unit-delay model understates it and the gap closes as $w_X$ grows (p. 321). Switch to [[Monotonic String Leading Zero Counter]] when that fanout appears in timing reports: same order of depth with fanout capped at 2, at $\Theta(w_X\log w_X)$ gates instead of $\Theta(w_X)$. Use [[Leading Bit Counter]] only when the counted value is genuinely a runtime input, since its extra XOR row hands $b$ a fanout of $w_X$ and undoes exactly the property the logarithmic counters were bought for (p. 316) — three separate components is the book's deliberate choice. The best move is to need no counter on the path at all: [[Leading Zero Anticipation]] runs beside the addition for about three gates per bit and leaves a one-bit correction mux behind (p. 342). For the composite, [[Normalizers]] pays both latencies in series (14 levels at $w_X=14$), [[Fused Normalizer]] removes the shifter's $w_C$ levels and $w_X-w_C$ muxes by consuming the naive counter's MSB-first bits as they appear — but has nowhere to do arithmetic on the count, so it is out for IEEE-754 subnormals (p. 324) — and [[Sequential Normalizer]] is cheaper than any of them and out of the running the moment a fixed initiation interval is required, its latency being $C+1$ cycles of the data itself.

No RTL block: this note instantiates nothing.

**Related Notes.**

- [[Exact Full Shifter]] – compares: the $w_R=w_X+S_{\max}$ end of the table, the only $0$ ulp option.
- [[Truncated Shifter]] – compares: everything between that end and the barrel shifter, priced by one $\min$ formula.
- [[Barrel Shifters]] – compares: the $w_X=w_R$ case and the baseline every other row is measured against.
- [[Shifter with Sticky Bit Computation]] – compares: the strict winner whenever the consumer rounds.
- [[Bidirectional Shifter]] – counter-example: the row you should never build, kept in the table to price the alternative.
- [[One-Hot Shifter]] – counter-example: better depth on paper, $\Theta(n^2)$ cells and fanout $S_{\max}$ in silicon.
- [[Shift by Multiplier]] – compares: the FPGA row that wins on both axes when a DSP is free.
- [[Sporadic Shifter]] – extends: the same cascade optimised against a finite shift set instead of a range.
- [[Leading Zero Counters]] – compares: the naive counter, and the FPGA default.
- [[Leading Bit Counter]] – extends: the counter generalised to a runtime bit value, at $b$'s fanout.
- [[Oklobdzija LZC Tree]] – compares: logarithmic depth for double the muxes and a growing select load.
- [[Monotonic String Leading Zero Counter]] – compares: the same depth with fanout capped at 2.
- [[Leading Zero Anticipation]] – extends: removes the counter from the critical path instead of speeding it up.
- [[Normalizers]] – compares: counter and shifter in series, constant latency, pipelinable.
- [[Fused Normalizer]] – compares: the same pair merged, $w_C$ levels cheaper, unusable for IEEE-754.
- [[Sequential Normalizer]] – compares: cheapest of all, and the only variable-latency entry.
- [[Shifters]] – supports: the topic hub these sixteen circuits are cut from.
- [[Error Accuracy]] – depends-on: the ulp accounting behind the exact/truncated split.
- [[Rounding]] – depends-on: why a sticky bit, not just a round bit, is what buys $\tfrac12$ ulp.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 10 "Shifters and Leading Bit Counters":

- §10.1, pp. 307–311 — generator parameters, constraint (10.1) p. 311, the exact/truncated/barrel classification.
- §10.1.1–10.1.2, pp. 308–309 — avoiding bidirectional shifters.
- §10.1.3, pp. 312–314 — LSB-first stage widths, the 58-vs-81 mux counts (p. 313), 6-LUT merging and the every-other-level pipelining rule (p. 314).
- §10.1.4–10.1.5, pp. 314–316 — barrel shifter $16\times4=64$ muxes at depth 4 (p. 315), wide ORs on the fast carry chain (p. 315), the 20% area / 5% delay measurement (p. 316).
- §10.2, pp. 316–322 — LZC/LOC/LBC kept as three components (p. 316), ones-padding (pp. 318–319), naive area and $d_k=k(k+1)/2$ (pp. 319–320), Oklobdzija mux count and fanout caveat (pp. 320–321), monotonic string conversion (pp. 321–322).
- §10.3, pp. 323–325 — normalizer interface (p. 323), the IEEE-754 restriction and the while-loop variant (p. 324), $O(w_X\log w_X)$ area and $O(\log^2 w_X)$ delay with the FPGA carry-chain caveat (p. 325).
- §10.4, p. 325 — DSP-based shifts, sporadic shifters, tabulated shifts of constant $X$.
- §11.1.4, p. 342 — where the LZC sits on a floating-point adder's near path, and the LZA correction multiplexer.
