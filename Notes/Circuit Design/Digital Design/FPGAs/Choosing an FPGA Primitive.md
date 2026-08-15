---
title: Choosing an FPGA Primitive
description: "Trade-off table across the 11 FPGAs circuits, with the source's own numbers — which of the five FPGA currencies a given job should be billed in."
kind: comparison
source: "ASA Ch. 4, pp. 87-101; §5.4.1-5.4.2, pp. 126-129; §5.5.1, p. 135"
status: seed
spade: n/a
tags: [digital, fpgas, comparison, area, latency]
aliases:
  - Choosing an FPGA Resource
  - FPGA Primitive Trade-offs
  - FPGA Resource Selection
  - Which FPGA Primitive
---

# Choosing an FPGA Primitive

An FPGA bills a design in five incommensurable currencies — LUT6/ALM, flip-flop, carry chain, DSP unit, memory tile — and the whole of resource selection is deciding which one a given piece of arithmetic should be charged to.

| Primitive | One unit holds | Cost model / count | Delay or latency | Printed pp. |
| --- | --- | --- | --- | --- |
| [[Lookup-Tables]] | any Boolean function of $\alpha \le 6$ inputs, **1 output bit**, in $2^\alpha$ SRAM cells | blind $n$-input function: $L(n) = 2^{n-6} + \lceil (2^{n-6}-1)/3 \rceil$ LUT6 **per output bit**; $L(6)=1$, $L(8)=5$, $L(10)=21$, $L(16)=1365$ (derived from eq. 4.1) | $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns, independent of the function | 90, 127 |
| [[Basic Logic Element]] | 1 LUT + 1 optional FF | LUT:FF ratio near $1{:}1$; an unused FF is wasted silicon, so a pipeline stage costs **0** extra cells | $\tau_{\text{LUT}}$ combinational, or 1 cycle registered | 89, 135 |
| [[Fracturable LUT]] | 1 LUT6 = 2 LUT5 over **shared** inputs, 64 config cells | 2 functions per cell iff $|\mathrm{supp}(g_1)\cup\mathrm{supp}(g_2)| \le 5$; otherwise 1 | $\tau_{\text{LUT}}$, unchanged by fracturing | 90–92 |
| [[AMD BLE]] | V4: LUT4 + dedicated AND + 1 FF · V5–7/UltraScale+: LUT6 → 2×LUT5 + 2 FF · Versal: 4×LUT4 + 2 FF | slice = 2 BLE (V4, 4 slices/CLB), 4 BLE (V5–7), **8 BLE** (UltraScale+, 1 slice/CLB), 8 BLE (Versal) | see carry-chain row; Versal replaces the chain XOR with a `LOOKAHEAD8` unit computing only even carries | 91–92, 127–128 |
| [[Intel ALM]] | half-ALM: 1 LUT4 + 2 LUT3 + **hardened** FA + 2 FF | 1 LAB = 10 ALM = **20 BLE**; $N$-bit RCA = $N$ BLE = $\lceil N/2 \rceil$ ALM with the **entire LUT layer left over**; chains may start only at the 1st or 6th ALM of a LAB | — | 93, 128–129 |
| [[Fast Carry Chain]] | 1 carry bit to the physically adjacent BLE, bypassing the switch matrix | 1 BLE per bit (LUT computes $p_i$ on AMD; free on Intel) | $\tau_{cp} = 0.015$ ns/BLE, $\le 0.06$ ns/slice (4 BLE); $\tau_{\text{XOR}} = 0.21\ldots0.25$ ns; $\tau_{fa} = 0.57$ ns $= 38\,\tau_{cp}$. Adders: $\approx 1$ ns at $w{=}8$, $1.5$ ns at $w{=}16$, $2.5$ ns at $w{=}32$ | 126–127 |
| [[DSP Blocks]] | $R = (X_0+X_1)\times Y + Z$ — UltraScale+: $27{+}27\to27$, $27\times18\to45$, $45{+}48\to48$, signed; Stratix V: $1\times(27{\times}27)$, $2\times(16{\times}16)$ or $3\times(9{\times}9)$; Stratix 10: $2\times(18{\times}18)$ or $1\times(27{\times}27)$ | fixed count per die; an $8\times8\to16$ unsigned product = **1 unit** ($17\times26$ unsigned fits an $18\times27$ signed multiplier) | — | 94–95 |
| [[Three-Multiplication Complex Product]] | Gauss's identity mapped onto the pre- and post-adders | AMD: **3 DSP + 5 add** instead of 4 DSP + 2 add, the 5 additions costing **0 LUT**. Intel: the shared post-adder makes a complex multiply **2 DSP** by the naive formula, and the trick buys nothing | — | 94–95 |
| [[Distributed Memory]] | 1 SLICEM LUT6 = $64\times1$ or $2\times(32\times1)$ simple dual-port; 1 Intel MLAB ALM = $32\times2$ | a $2^6 \times m$ table = exactly $m$ LUT6, i.e. the $L(6)=1$ bound; every address bit past 6 doubles it | **combinational read** at $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns; write takes effect on the next edge | 96–97, 127 |
| [[Shift Register LUT]] | 1 LUT5 = 32-deep addressable delay line, tap $A{+}1 \in \{1,\dots,32\}$ | $\lceil D/32 \rceil \cdot w$ LUT5 for a $w$-bit, $D$-deep line, with fabric routing only at the two ends; a LUT's table can be rewritten through one wire in **32 cycles** | — | 97–98 |
| [[Block Memory]] | AMD 7-series/UltraScale: **36 kbit** ($32\text{k}{\times}1 \ldots 512{\times}72$); Intel M20K: **20 kbit** ($2\text{k}{\times}10$, $1\text{k}{\times}20$, $512{\times}40$) | $N = \lceil 2^a/D \rceil \lceil w/W \rceil$ tiles; the $8\times8$ ROM ($2^{16}\times16 = 1$ Mbit) = **32** BRAM36 plus a 32:1 decode of $16 \times 11 = 176$ LUT6 | nominal FPGA frequency (≈ one logic element's delay) but **several cycles** per access | 98–99 |

Every "—" is a gap in the source, not an omission here. Chapter 4 gives **no latency, no $f_{\max}$ and no register-stage count for DSP blocks** (p. 95), no tap-mux delay or $f_{\max}$ for SRL mode (p. 97), and no timing figures of any kind for Intel cells — the only concrete delays in the whole book are the Virtex 6 speed-grade-3 numbers of pp. 126–127 [Xil14]. Block RAM latency is stated only as "several cycles" (p. 98), never as a count. The SLICEL:SLICEM ratio of a device is likewise not given (p. 96).

> [!warning] Not covered in the source — needs outside research
> Any timing claim about a DSP block, a block RAM access, an SRL tap or any Intel primitive must come from a vendor datasheet. Do not interpolate from the Virtex 6 column.

**Area decides first, because accuracy never decides at all.** The fabric introduces $0$ ulp — LUTs, the carry chain, DSP multipliers and block RAMs all compute exactly what they are configured to compute, and every ulp of error in this vault comes from a choice of format or algorithm ([[Number Formats]], [[Error Accuracy]]) rather than from the substrate. The one place a primitive can surprise you is the DSP's fixed adder widths, where a $27{+}27 \to 27$ pre-add and a $45{+}48 \to 48$ post-add both **wrap** (p. 95), and that is a range argument about the operands, not an inaccuracy of the block. So the question is only ever which of the five currencies to spend, and they are not equally plentiful: LUT6 and ALM are the abundant one, while DSP units and memory tiles are fixed counts stamped on the die. The question is therefore never "how many LUTs" but "can this be kept off the scarce resources". The decision rule falls straight out of $L(n) \approx \tfrac43 2^{n-6}$: a function of six or fewer inputs is one LUT6 per output bit and needs no thought, while every input past the sixth doubles the cost, so anything wider must either factor algebraically or move off logic entirely. The same $8\times8 \to 16$ product prices at **21,840 LUT6** as a blind truth table, **32 BRAM36 plus 176 LUT6** of decode as a ROM, and **one DSP unit** as a multiplication (pp. 90, 95, 99) — three orders of magnitude between the ends, which is why the mapping decision dominates every micro-optimisation inside it. That spread is also a cliff rather than a curve: the DSP is free until the device's units are exhausted, and the next multiplier after that costs the full LUT tiling, which is exactly the discontinuity [[Multiplier Tiling]] optimises against.

**Latency decides only among the three memories, because everything else on the list is combinational.** [[Distributed Memory]] reads asynchronously — the address selects through the LUT's own mux and settles in $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns (p. 127) — whereas [[Block Memory]] reads through pipeline registers inside the tile and cannot return a word in under several cycles (p. 98). In a feed-forward datapath that difference is invisible: the tile's registers are absorbed into a pipeline you were going to build anyway and the operator still retires one lookup per cycle, so block RAM is a **throughput** resource and its latency is free. In a recurrence it is not free, because the read lands inside the loop and lengthens the critical cycle by the full access time — which is why table lookups inside digit recurrences and [[Exact Accumulators]] stay in distributed memory even when the LUT count is worse. The crossover on area is around 64 words deep, past which the 36 kbit tile absorbs address bits for free while distributed memory keeps doubling (p. 98); the crossover on latency does not exist, and if the read is inside a loop the tile is simply disqualified.

**Throughput is close to free on an FPGA, which is what makes latency such a rare deciding constraint.** The LUT:FF ratio sits near $1{:}1$, the flip-flops are wired directly to the LUT and carry outputs inside the BLE, and an unused FF is wasted silicon rather than saved area (p. 135) — so a pipeline stage costs nothing that was not already bought. On an ASIC a flip-flop costs about as much as a full adder and pipelining is a genuine area trade; on an FPGA it is not, and the honest default is to pipeline aggressively and then choose primitives on area alone. The [[Fast Carry Chain]] compounds this: at $\tau_{cp} = 0.015$ ns per bit against $\tau_{fa} = 0.57$ ns to enter and leave the chain, a carry crosses a bit **38 times faster than it enters one** (pp. 126–127), so the $O(w)$ propagation term is dominated by the two $O(1)$ terms at either end until $w$ reaches the hundreds. Below 32 bits, carry acceleration is not a trade-off to evaluate — a prefix tree replaces cheap chain hops with expensive LUT levels *and* generic routing, and loses outright.

**Three of these rows exist only because the target is an FPGA and not an ASIC.** Distributed memory, the shift-register LUT and the fast carry chain are all reconfigurability overhead recycled as datapath: cast Fig. 4.7a into silicon and a $32\times1$ distributed RAM is 32 flip-flops, a 5-to-32 decoder and a 32:1 mux, which nobody would build for a 32-entry table, and a 32-deep tapped delay line is 32 real flip-flops whose area grows with depth exactly as the naive version does (pp. 96–98). They are cheap on an FPGA purely because the cells, decoder and mux are already fabricated and otherwise idle. The same asymmetry runs the other way for the vendor split at the top of the table: on Intel the full adder is **hardened**, so an $N$-bit adder consumes $N$ BLEs and leaves the whole LUT layer free to compute the operands feeding it (pp. 128–129), while on AMD the LUT must produce $p_i = x_i \oplus y_i$ and the addition consumes it. That single structural difference is why [[Three-Multiplication Complex Product]] is worth 25 % of the DSPs on AMD and worth nothing on Intel, where a shared post-adder already does a complex multiply in two units (p. 95). Choose against the three-layer pattern — LUT layer, carry chain, optional FF (p. 94) — rather than against a part number; the vendor-specific numbers age and the pattern has not.

**RTL (Spade).** None. This note compares eleven primitives and instantiates none of them; the synthesizable content lives in the sibling notes, each of which carries its own simulated block.

**Related notes.**

- [[Lookup-Tables]] – depends-on: the unit every area figure in the table is denominated in, and the source of the $L(n)$ exponential that forces most of the decisions above.
- [[Basic Logic Element]] – depends-on: the LUT-plus-flip-flop cell whose near-$1{:}1$ ratio is why the throughput column is almost always free.
- [[Fracturable LUT]] – extends: doubles the logic per cell, but only when both halves read the same five wires, so it improves the area column conditionally.
- [[AMD BLE]] – compares: the vendor whose LUT is *consumed* by the carry chain, across four generations of that trade.
- [[Intel ALM]] – compares: the vendor whose hardened adder leaves the LUT layer free, which changes the right algorithm and not just the count.
- [[Fast Carry Chain]] – supports: the $38\times$ ratio that removes carry propagation from the decision entirely below 32 bits.
- [[DSP Blocks]] – compares: the scarce resource, free until exhausted and then the most expensive thing on the chip.
- [[Three-Multiplication Complex Product]] – extends: what the DSP's idle pre- and post-adders buy once you are already paying for the multiplier.
- [[Distributed Memory]] – compares: the combinational-read memory that wins below ~64 words and inside any recurrence.
- [[Shift Register LUT]] – compares: the cheapest deep delay in the fabric, and the only primitive here that rewrites another primitive's contents.
- [[Block Memory]] – counter-example: the one resource whose latency is not free, and therefore the one that a loop disqualifies regardless of area.
- [[FPGAs]] – depends-on: the topic hub these eleven primitives partition.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- Sect. 4.1.1, pp. 89–91 — minimal BLE (Fig. 4.2, p. 89), LUT4 as $2^4$ SRAM cells plus a mux (Fig. 4.3, p. 90), Boole's expansion eqs. 4.1–4.3 (p. 90), best $\alpha \in [4,6]$ [AR04], the dedicated carry wire.
- Sect. 4.1.2, pp. 91–92 — AMD BLEs and slice/CLB grouping, Figs. 4.5a–c.
- Sect. 4.1.3, p. 93 — the ALM, the LAB of ten ALMs, the configuration list [Alt13], the Stratix 10 simplification [Int17].
- Sect. 4.1.4, p. 94 — the common three-layer pattern the table's rows are organised around.
- Sect. 4.2, pp. 94–95 — eq. 4.4, the complex-product identities eqs. 4.5–4.8, Table 4.1 widths, signed-versus-unsigned, Intel's two-DSP complex multiply.
- Sect. 4.3.1–4.3.3, pp. 95–99 — SLICEL/SLICEM, distributed memory (Fig. 4.7a), shift-register mode (Fig. 4.7b), block memory and Table 4.2 (p. 99).
- Sect. 5.4.1–5.4.2, pp. 126–129 — eqs. 5.50–5.51, Virtex 6 speed-grade-3 timing [Xil14], worst-case adder delays at $w = 8, 16, 32$, Versal `LOOKAHEAD8`, Intel's hardened full adder and chain-start constraint.
- Sect. 5.5.1, p. 135 — LUT:FF ratio near 1 and the cost of pipelining on FPGA versus ASIC.
