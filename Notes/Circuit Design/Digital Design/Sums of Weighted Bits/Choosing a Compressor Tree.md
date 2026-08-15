---
title: Choosing a Compressor Tree
description: "Trade-off table across the 15 Sums of Weighted Bits circuits, with the source's own numbers."
kind: comparison
source: "ASA Ch. 7, pp. 151-201"
status: seed
spade: n/a
tags: [digital, sums-of-weighted-bits, comparison]
aliases:
  - Choosing a Compressor Tree
  - Compressor Tree Selection
  - Which Compressor Tree
  - Compressor Tree Trade-offs
---

# Choosing a Compressor Tree

The chapter offers four heap-shaping rewrites, three full-adder schedules, four compressor cells and two synthesis strategies; which one you reach for is decided almost entirely by whether the target prices a full adder as a cell or as a LUT6, and by whether the tree is pipelined.

| Circuit | Area cost | Depth cost | The source's numbers, and the printed page |
| --- | --- | --- | --- |
| [[Merged Multiply-Accumulate]] | $\le n$ extra full adders — linear in the addend width | $\le 1$ extra compression level, for any $n$ | The alternative it beats: a separate $n$-bit adder behind the multiplier at $n$ delay and $n$ area, or $\log n$ delay and $n\log n$ area with a fast adder (p. 157) |
| [[Constant-One Sign Extension]] | one constant row for the **whole** heap, plus one inverter per sign bit | none | Naive extension replicates $s$ over positions $p\dots q$, i.e. $s(2^{q+1}-2^{p})$; the two differ by $(1-s)2^{q+1}\equiv0\bmod 2^{q+1}$ (pp. 162-163). No cell or LUT count given |
| [[Single-Heap Polynomial Evaluation]] | $w+w(w-1)+\tfrac{w(w-1)(w-2)}{6}=\Theta(w^3)$ dots against $3w^2$ for two chained multipliers | one compression instead of two, at every width | Crossover printed as $w\ge14$ (p. 165); at $w=14$ the heap is $560$ dots against $588$, so the true first win for the multipliers is $w=15$ ($680$ vs $675$) |
| [[Truncated Bit Heap]] | deletes the cheapest bits outright; the recentring constant $C=2^{\ell-1}-2^{\ell_{\text{ext}}}$ doubles how many | none — it only shortens columns | Book's `ufix(-1,-12)` multiplier: $\ell_{\text{ext}}=\ell-4=-16$, $t=7$, $\delta_{\tilde R}\in[-1793\cdot2^{-24},1792\cdot2^{-24}]$, $\bar\delta_{\tilde R}<2^{-13}$ (Fig. 7.17, p. 171) |
| [[Compressor Trees]] | one FA removes exactly one dot: $\#\mathrm{FA}=N_{\text{in}}-N_{\text{out}}$ | $L=\min\{l:m_l\ge h_{\max}\}=\Theta(\log_{1.5}h_{\max})$ | $m_l=\lfloor1.5\,m_{l-1}\rfloor$, $m_0=2$: $2,3,4,6,9,13,19,28,42,63,94,141,211,316,474$ (Table 7.1, p. 176) |
| [[Dadda Tree]] | **fewest** FA and HA of any schedule | $L$ as above | **14-bit** final adder on the $8\times8$ example; widest interconnect, most FFs if pipelined (Figs. 7.19-7.20, pp. 178-180) |
| [[Reduced Area Compressor Tree]] | more FA and HA than Dadda | same $L$ as Dadda | **10-bit** final adder on the same $8\times8$ example, and "significantly fewer" FFs when pipelined (pp. 177-180) |
| [[Wallace Tree]] | — | — | — (not in this source; see below) |
| [[Parallel Counter]] | $q=\lceil\log_2(p+1)\rceil$; $\delta=p-q$ peaks at $p=2^q-1$, giving $(7;3)$, $(15;4)$ | a $(7;3)$ is 4 FAs in 3 levels | On AMD: $(3;2)$ at 1 LUT6, $E=1$; $(6;3)$ at 3 LUT6, $E=1$; $(7;3)$ printed at 2 LUT6, $E=1.33$, delay $\tau_L+2\tau_{CC}$ (Table 7.3, p. 184 — that row is inconsistent, see below) |
| [[4-2 Compressor]] | 2 FAs per cell; a width-$n$ row is $2n$ FAs, so it saves nothing built from stock cells | no carry propagation, so usable **down to the last stage** | $4n+1$ bits in, $2n+1$ out; the 7:3 generalisation has 9 inputs, 5 outputs, 2 lateral carries (Fig. 7.21, pp. 181-182) |
| [[Carry-Chain 4-2 Compressor]] | $k$ LUT6 for a width-$k$ row | $\tau_L+k\,\tau_{CC}$ | $E=2-\tfrac1k$, against the ternary adder's $E=2-\tfrac2k$ at $2\tau_L+\tau_R+k\tau_{CC}\approx3\tau+k\tau_{CC}$, and the 2-input adder's flat $E=1$ (Table 7.3, p. 184; Fig. 7.24, p. 186) |
| [[Generalized Parallel Counter]] | $q=\lceil\log_2(\sum_j 2^jp_j+1)\rceil$; no GPC inside one LUT's fan-in exceeds $E=1$ | $\tau_L+4\tau_{CC}\approx\tau$ for a carry-chain cell | $(1,3,2,5;5)$: 11 bits in, 5 out, 4 LUT6, **one AMD slice**, $E=1.5$ (Fig. 7.22, p. 183). Best in the table: $(6,0,7;5)$ at 4 LUT6, $E=2$ (Table 7.3, p. 184) |
| [[Efficiency-Driven Compression Heuristic]] | **0.55 LUT6 per compressed bit**, linear to 16 384 bits — down from 0.65 in [KK18] purely from the newer compressors | stages saturate at **5-6** across four orders of magnitude | Seconds where Gurobi hits a 1-hour timeout; below 1024 bits it needs 4 stages on `IntMultiAdder` where the optimum needs 3 (Figs. 7.28-7.29, pp. 196-197) |
| [[Pipelined Compressor Tree]] | the free $(1;1)$ pseudo GPC becomes a flip-flop at **0.5 LUT6** — two FFs per LUT6 on AMD | $S\in\{2,\dots,6\}$ for heaps to 16 384 bits | Deferring a dot by $\Delta s$ stages costs $\tfrac12\Delta s$ LUT6 (pp. 193-194; Fig. 7.29b, p. 197) |
| [[Split Final Adder]] | — | — | — (one paragraph, p. 194: no timing model, no measured area or delay) |

**Where the table says "—".** Wallace is absent from the source outright — the string never occurs in the book, which uses [[Reduced Area Compressor Tree|Reduced Area]] as its ASAP pole, so no FA, HA or final-adder count for a Wallace-scheduled heap can be quoted here. The split final adder is stated but never measured. **Two numbers the book owes and never pays: DSP-block counts and cycle counts.** Both benchmark shapes of §7.4 are explicitly LUT-only (`useDSP=0`, p. 195), and every "stage" above is a combinational compression level, not a clock cycle — the only cycle-adjacent figure in the chapter is the pipeline depth $S\in\{2,\dots,6\}$, which is a consequence of $\Theta(\log_{1.5}h)$ rather than a design choice. DSP-based decomposition is a different chapter.

> [!warning] Two numbers in the source's own tables do not survive checking
> **Table 7.2, p. 180** prints FA $=0$, HA $=0$, FF $=-80$ for both Dadda and RA on the $8\times8$ example, and the prose on p. 177 repeats "0 full adders and 0 half adders". The identity $\#\mathrm{FA}=N_{\text{in}}-N_{\text{out}}$ with $N_{\text{in}}=64$ and $N_{\text{out}}\le32$ forces $\#\mathrm{FA}\ge32$. Only the final-adder lengths, 14 against 10, are usable, which is why the Dadda and RA rows above quote a direction and not a count.
> **The $(7;3)$ row of Table 7.3, p. 184** prints $k=2$ and $E=1.33$; (7.27) on its own numbers gives $E=(7-3)/2=2$, and $1.33=4/3$ is what $k=3$ would give. Do not build a cost model on that row.

**Accuracy decides before anything else does, because it changes the heap you are scheduling.** [[Truncated Bit Heap|Truncation]] is not an optimisation applied to a finished tree — it deletes columns from the right before a single compressor is placed, and on a $6\times6$ multiplier that is 10 of 36 AND gates gone at 0.89 ulp worst case (vault worked example, by the method of pp. 168-172). Run it first, always, unless the operator is specified exact. It also reorders every other decision downstream: the comparison between a fused $X-X^3/6$ heap and two chained multipliers must be made on the *truncated* heaps, not the exact ones, because truncation deletes a different fraction of each (p. 174). The one case to be careful with is a heap holding both $x_i$ and $\overline{x_i}$ — the worst-case bound $\Delta$ assumes every dropped bit can be 1 at once, which correlation makes unreachable, so the bound stays safe but pessimistic and can lose the lexicographic order that justifies the two-loop search (p. 175).

**Area on ASIC means cells, so the full adder is the unit and the Dadda/RA axis is the whole question.** Pick [[Dadda Tree|Dadda]] when the tree is combinational and cell count dominates: as-late-as-possible is exactly the schedule that spends the fewest FAs and HAs. Pick [[Reduced Area Compressor Tree|Reduced Area]] when either of Dadda's two structural costs bites — a 14-bit final adder against RA's 10 on the same $8\times8$ heap if the adder is on the critical path, or the flip-flop bill if the tree is pipelined. The identity $\#\mathrm{FA}=N_{\text{in}}-N_{\text{out}}$ says a schedule cannot choose its full-adder count freely; it chooses how much work to leave the final adder, and the FA count follows. So "Dadda is smaller" and "RA has a shorter adder" are the same sentence read from opposite ends, and the tie-break is whichever of tree area and adder delay you are actually short of. Larger ASIC cells — the [[Parallel Counter|$(7;3)$ counter]], the [[4-2 Compressor|4:2 row compressor]] — are worth nothing assembled from stock full adders (a width-$n$ 4:2 row *is* $2n$ FAs); they pay only when you own the cell and can flatten it at gate or transistor level. Between those two, prefer the 4:2: a counter is undefined once the column is shorter than $p$, so it is dead weight in the late stages, while the 4:2 has no height precondition and stays usable to the last one.

**On FPGA that entire paragraph inverts, and the deciding number is $E=\delta/k$.** Table 7.3 prices a $(3;2)$ at a whole LUT6 for $E=1$ while a $(6,0,7;5)$ gets $E=2$ from four, so minimising *full-adder count* is not minimising *area* — a Dadda or RA schedule is optimising the wrong objective on a LUT fabric, and neither has anything to say about a library of irregular [[Generalized Parallel Counter|GPC]] shapes. Anything above six inputs needs the carry chain (no cell inside one LUT's fan-in can beat $E=1$), which is why the chapter's good compressors are all chain-recruiting: $(1,3,2,5;5)$ eats eleven bits in one slice at about one LUT delay. Use the [[Efficiency-Driven Compression Heuristic]] as the default — it runs in seconds at 16 384 bits, costs a linear 0.55 LUT6 per compressed bit, and is usually one stage off optimal. Reach for ILP only in the last 2-3 stages, or on heaps of a few hundred bits where an hour of Gurobi is affordable and one saved stage matters; below roughly 100 dots skip the heuristic entirely, the solver will finish in well under the hour. Finish with a carry-chain adder rather than a prefix tree, and use the [[Carry-Chain 4-2 Compressor]] over a ternary adder for the wide rows: slightly better efficiency at a third of the delay.

**Pipelining is the single switch that flips the most decisions at once.** Registering a stage boundary reprices the free $(1;1)$ wire as a flip-flop at 0.5 LUT6, so a dot deferred by $\Delta s$ stages costs $\tfrac12\Delta s$ LUT6 whether or not it is ever compressed — area becomes proportional to dot-stage *crossings* rather than to compressors placed, and every objective bends toward compressing early. That is precisely why [[Reduced Area Compressor Tree|RA]] beats [[Dadda Tree|Dadda]] on a pipelined tree while losing on a combinational one, and why the efficiency heuristic needs no modification at all: $(1;1)$ sorts last, so it already defers only as a last resort. Pipelining also deletes the reason [[Split Final Adder]] exists — the Gaussian arrival profile of a triangular heap is a combinational artefact, and truncation flattens it before pipelining removes it, so build a split adder only for a combinational exact multiplier. Latency arguments, finally, are why [[Merged Multiply-Accumulate|merging]] and [[Single-Heap Polynomial Evaluation|single-heap polynomials]] are nearly free: absorbing a whole extra operand costs at most one extra level and a whole cubed polynomial costs one compression instead of two, because depth is logarithmic in heap *height* and merging mostly makes heaps wider. The counterweight is architectural, not arithmetic — a merged sub-expression stops existing as a word, so anything else consuming it must recompute it (p. 160). Merge while the addend has one consumer.

$$\boxed{\ \text{ASIC: minimise } \#\mathrm{FA}\ \Rightarrow\ \text{Dadda / RA.}\qquad \text{FPGA: maximise } E=\tfrac{\delta}{k}\ \Rightarrow\ \text{GPC library} + \text{heuristic.}\ }$$

**Related Notes (with context).**

- [[Bit Heaps]] – depends-on: the canonical form every row of the table is a different way of evaluating.
- [[Compressor Trees]] – depends-on: the $\Theta(\log_{1.5}h_{\max})$ stage bound and the $\#\mathrm{FA}=N_{\text{in}}-N_{\text{out}}$ identity that make the schedules comparable at all.
- [[Merged Multiply-Accumulate]] – compares: the cheapest thing you can add to a heap — one row, at most one level.
- [[Constant-One Sign Extension]] – compares: how signedness enters the heap without costing a row per summand.
- [[Single-Heap Polynomial Evaluation]] – compares: merge a whole polynomial, and pay in dots rather than in compressions.
- [[Truncated Bit Heap]] – depends-on: run this before choosing a schedule, because it changes the heap being scheduled.
- [[Dadda Tree]] – compares: the ALAP pole; fewest cells, longest final adder, most flip-flops.
- [[Reduced Area Compressor Tree]] – compares: the ASAP pole this book documents; more cells, 10-bit adder instead of 14.
- [[Wallace Tree]] – compares: the historical ASAP schedule, absent from this source, which is why its column reads "—".
- [[Parallel Counter]] – compares: maximal compression per output bit, but dead once the column is shorter than $p$.
- [[4-2 Compressor]] – compares: the row compressor that survives to the last stage, and only pays if you own the cell.
- [[Carry-Chain 4-2 Compressor]] – compares: the same idea inverted for FPGA, keeping the chain instead of avoiding it.
- [[Generalized Parallel Counter]] – compares: the cell that makes $E=\delta/k$, not FA count, the right FPGA objective.
- [[Efficiency-Driven Compression Heuristic]] – compares: the default choice above a few hundred bits, at 0.55 LUT6 per compressed bit.
- [[Pipelined Compressor Tree]] – counter-example: registering the stages reprices the wire and reverses the Dadda-versus-RA verdict.
- [[Split Final Adder]] – extends: what to do with the two rows the tree leaves, when the tree is combinational.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7, pp. 151-201.

- §7.1.2, p. 157 — merged multiply-accumulate; the $n$ / $n\log n$ cost of the separate adder.
- §7.2.2, pp. 162-163 — sign extension as one constant row.
- §7.2.3, pp. 164-167 — algebraic rewrites, (7.6), the $w\ge14$ crossover.
- §7.2.4, pp. 167-175 — truncation, (7.24), Fig. 7.17 (p. 171), correlated bits (p. 175).
- §7.3.1, pp. 176-180 — (7.25) and Table 7.1 (p. 176); Dadda and Reduced Area, Figs. 7.19-7.20 and Table 7.2 (pp. 178-180).
- §7.3.2, pp. 180-186 — counters (p. 180), row compressors and Fig. 7.21 (pp. 181-182), GPCs and Fig. 7.22 (pp. 182-183), Table 7.3 (p. 184), Fig. 7.24 (p. 186).
- §7.3.3, pp. 186-193 — Listing 7.2 (p. 188), the ILP (pp. 189-191), the combined flow and the 0.5 LUT6 register price (pp. 192-194).
- §7.3.4, p. 194 — arrival profile and the split final adder.
- §7.4, pp. 194-197 — benchmarks (p. 195), Fig. 7.28 (p. 196), Fig. 7.29 (p. 197).
