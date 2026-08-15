---
title: Choosing a Combinational Block
description: "Trade-off table across the 10 Combinational Logic circuits, with the source's own numbers — and the one constraint (fan-in, not depth) that decides almost every row."
kind: comparison
source: "0.2) Combinational Logic §Standard blocks, §Fan-in fan-out and logical effort, §Worked example: a 4:1 multiplexer, §FPGA mapping, §Trade-offs — no book source"
status: seed
spade: n/a
tags: [digital, combinational-logic, comparison, logical-effort, fan-in, fpga]
aliases:
  - Choosing a Combinational Block
  - Combinational Block Trade-offs
  - Combinational Logic Comparison
  - Which Combinational Block
---

# Choosing a Combinational Block

Ten realisations of seven truth tables, all exact at $0$ ulp, so the entire choice is made on area, depth, delay and glitch energy — and in nine of the ten rows the number that actually decides is **gate fan-in**, not level count.

| Block | Worked case | Gates | Gate inputs (area proxy) | Depth | Delay | Widest gate | FPGA cost | Source § (printed page) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [[Binary Decoder]] | $3\!\to\!8$ | $8$ AND3 $+$ $3$ INV | $n2^n = 24$ | $1$ AND$n$ level | $32.6\,\tau$ at $n{=}8$ (INV→NAND8→INV) | $n$ | $2^n$ LUTs at depth $1$ for $n\le6$ | §Standard blocks (—) |
| [[Predecoder]] | $4\!\to\!16$ | $24$ AND2 (flat: $16$ AND4) | $48$ (flat: $64$); $\Theta(2^n)$ vs $n2^n$ | $\lceil\log_2 n\rceil$ | $25.1\,\tau$ at $n{=}8$ (5 stages) | $2$ | strictly worse below $n{=}6$ — it only adds levels | §Standard blocks, §Fan-in (—) |
| [[Demultiplexer]] | $1\!\to\!8$, folded | $8$ AND4 $+$ $3$ INV | $(n{+}1)2^n = 32$ | decoder $+1$, or decoder after folding | — | $n{+}1$ | $2^n$ LUTs at depth $1$ for $n\le5$ | §Standard blocks (—) |
| ″ tree variant | $1\!\to\!8$ | $2^{n+1}-2 = 14$ AND2 | $28$ | $n = 3$ | — | $2$ | same | §Standard blocks (—) |
| [[Binary Encoder]] | $8\!\to\!3$ | $9$ OR2 ($+\,7$ OR2 for `valid`) | $n2^{n-1} = 12$ | $n{-}1 = 2$ (`valid`: $n = 3$) | — | $2$ (flat rail: $2^{n-1}$) | $5$ LUTs; $55$ LUTs / 3 levels at $64\!\to\!6$ | §Standard blocks (—) |
| [[Priority Encoder]] | $8\!\to\!3$ | $w\log_2 w + w + \tfrac{w}{2}\log_2 w = 44$ | — | $2n = 6$ ($3$ prefix $+\,1$ mask $+\,2$ encoder) | — | $2$ | $n{+}1$ LUTs at depth $1$ for $w\le6$; $\lceil\log_6 w\rceil$ levels above | §Standard blocks (—) |
| [[Multiplexer Tree]] | $4{:}1$, $w{=}1$ | $11$ ($2^n{-}1 = 3$ MUX2) | $20$ | $5$ gate levels ($n$ MUX2) | $\mathbf{12\,\tau}$ (data); $6n\,\tau$ | $2$ | $1$ LUT6; $8{:}1 = 2$ LUT6 $+$ `MUXF7` | §Worked example, §Trade-offs (—) |
| [[One-Hot Multiplexer]] | $4{:}1$, $w{=}1$ | $7$ (4 NAND3 $+$ NAND4 $+$ 2 INV) | $18$ | $3$ gate levels | $\mathbf{13.6\,\tau}$ (select); $22\,\tau$ at $8{:}1$, $36.5\,\tau$ at $16{:}1$ | $4$, growing as $2^n$ | $1$ LUT6 at $4{:}1$; a $\lceil\log_6 2^n\rceil$ OR tree above | §Worked example, §Trade-offs (—) |
| [[Transmission-Gate Multiplexer]] | $4{:}1$, $w{=}1$ | $3$ TG cells $+$ $2$ INV | $16$ transistors (static tree: $\approx40$) | $n$ pass stages | $t_N = \tfrac12 RC\,N(N{+}1)$ — **quadratic**, not linear | — (not a gate) | not instantiable | §Standard blocks (—) |
| [[XOR Parity Tree]] | $64$-input | $n{-}1 = 63$ XOR2 | $126$ | $\lceil\log_2 n\rceil = 6$ | $48\,\tau$ ($8\,\tau$/level; chain: $504\,\tau$) | $2$ | $\lceil\log_6 64\rceil = 3$ LUT levels | §Standard blocks, §FPGA mapping (—) |
| [[Hazard-Free Two-Level Cover]] | $4{:}1$ repair | $+4$ AND3 (flat) / $+3$ AND2 (tree) | $18\to34$ ($+89\%$) / $20\to29$ ($+45\%$) | unchanged | — (wider OR, so $p$ grows) | $8$ (flat OR) | no-op below the LUT boundary | §Glitches and hazards (—) |

**Every printed page in the last column is `—`, and that is not an omission.** The long-form source carries no assigned book source; its own `## References` says so and cites Mano & Ciletti, Wakerly and Weste & Harris by chapter only. The section names are given in place of pages so each row is still traceable, but no row here can be pinned to a printed page and none has been invented. The four `—` delay cells are the same story from the other direction: the source prices the multiplexer family, the decoder and the XOR tree in $\tau$ and never prices the demultiplexer, either encoder, or the hazard repair, so those rows are quoted in levels and gates only.

> [!warning] Two numbers in the source's own `## Trade-offs` table are wrong and are corrected above
> It gives the flat $4{:}1$ hazard repair as "$+4$ AND2, $\approx20\%$ area". $D_0D_1$ is not an implicant of the mux — at $D = (1,1,0,0)$, $S_1S_0 = 10$ it is $1$ while $Y = D_2 = 0$ — so the terms are AND3 and the cost is $+89\%$ in gate inputs. The tree's $D_{2i}D_{2i+1}$ AND2 form quoted there *is* correct. Derived in [[Hazard-Free Two-Level Cover]]. Separately, [[Priority Encoder]] shows the source's priority-encoder depth row ($n$) counts the prefix network alone; the operator is $2n$.

**Fan-in decides first, and it decides most of the table.** [[Logical Effort]] charges a wide gate twice — $g$ and $p$ both grow linearly in the input count — so past about four inputs a deeper tree of narrow gates beats a shallower flat gate, and past about eight the flat gate is not a manufacturable cell at all. Every "flat versus factored" pair above is that one crossover wearing a different name: [[Binary Decoder]] against [[Predecoder]], [[One-Hot Multiplexer]] against [[Multiplexer Tree]], the flat OR rail of [[Binary Encoder]] against its OR2 tree. So the default is the factored form whenever the width parameter can grow: pick the mux tree, pick the predecoder, pick the balanced XOR tree, and pick them without doing the arithmetic, because the arithmetic only ever comes out one way. Take the flat form in exactly two situations — the width is pinned small and will stay pinned ($4{:}1$ and below, where flat is genuinely $7$ gates against $11$), or the merge is not a gate at all. That second case is the one worth remembering: a wired-OR bus, a tri-state column, or a one-hot-driven [[Transmission-Gate Multiplexer]] turns the $2^n$-wide OR into a metal node, the exponential $p$ term disappears, and the flat form becomes the right answer for crossbars, register-file read ports and SRAM column muxes.

**Latency is not depth, and the $4{:}1$ mux is the counterexample to memorise.** The flat form is two gate levels shallower than the tree and $13.6\,\tau$ against the tree's $12\,\tau$ — slower while shallower, because a NAND4 carries $p = 4$ and the select literal branches to half the products. The gap widens with width ($22$ vs $18$ at $8{:}1$, $36.5$ vs $24$ at $16{:}1$), since the flat form's parasitic term alone contributes $2^n$ while the tree's whole delay is $6n$. Two corollaries. First, if you are optimising for latency, optimise the *support and fan-in* of each node, not the level count — the level count is what makes the flat form look good and it is the metric that lies. Second, the tree's linear $6n$ holds only for restoring static gates: cascade unbuffered transmission gates instead and the Elmore delay of the resulting RC ladder is $\tfrac12 RC\,N(N{+}1)$, quadratic, so the depth count stops predicting anything and you buffer every $k^\star = \sqrt{2t_{\text{buf}}/RC}$ stages. Choose the TG cell when transistor count dominates — $16$ transistors against $\approx40$ for a $4{:}1$, a ratio tending to $2.5$ as data width grows — and only when you own the buffering discipline, the select-skew polarity and the fact that the output is steered rather than driven.

**On an FPGA most of the preceding paragraph is a netlist the mapper deleted.** A $4{:}1$ mux is $6$ inputs and fits one LUT6 exactly, so the tree and the flat form are the *same circuit* after technology mapping and the NAND4 argument is moot; a decoder for $n\le6$ is $2^n$ LUTs at one level with no fan-in penalty whatsoever; predecoding below $n = 6$ can only add levels. The unit of area is "a function of $\le6$ variables", so you count inputs, not gates, and the crossover that mattered at $n\approx4$ on an ASIC moves to the LUT boundary at $6$. One block reverses sign outright: [[XOR Parity Tree]] is gate-dominated on an ASIC (XOR2 has $g = 4$, $p = 4$, the worst pair in the library, and a $64$-input tree is $48\,\tau$ across $6$ levels), while on an FPGA a $6$-input parity is one LUT and the same tree is $3$ levels — opposite optimisations from the same netlist. Two blocks stop existing: the transmission-gate mux is not instantiable at all, and the consensus term of [[Hazard-Free Two-Level Cover]] is a no-op, because a LUT is not a two-level network and adding a redundant product changes only the truth table you programme, which is identical.

**The last two rows are chosen on correctness and on energy, not on cost.** [[Binary Encoder]] is nearly free — $9$ OR2 at depth $2$ for $8\!\to\!3$, cheaper than the decoder it inverts because there is no complement to generate — but it is the one block whose correctness is a precondition on its input rather than a property of its logic: two hot bits emit the OR of two addresses, which is a legal address for neither and raises no flag. Use it wherever one-hotness is structural (undoing a decoder, an SRAM row-select plane, a one-hot state register, the select side of a one-hot mux) and use [[Priority Encoder]] the moment the inputs are independently asserted — interrupt lines, arbitration requests, ready vectors — paying $2n$ levels instead of $n{-}1$ to make the function total. Glitch cost works the same way: inside a synchronous pipeline every hazard above is invisible to function and the repair buys nothing but area, so the hazard-free cover is worth its $+89\%$ (flat) or $+45\%$ (tree) only when the output feeds something level-sensitive — a clock, an asynchronous reset, a latch enable, an asynchronous next-state network. It remains the only hazard repair with a clean K-map criterion, which is the real reason to keep a two-level form around: dynamic hazards have no such criterion and no such repair.

## When it breaks

- **The choice dissolves below the LUT boundary.** Any cone of $\le6$ inputs is one LUT at one level, so every ASIC comparison above evaporates for $n\le5$-ish and the honest answer is to write the function and count its support ([[Lookup-Tables]], [[FPGAs]]).
- **The select is already one-hot.** Encoding it back to binary to feed a [[Multiplexer Tree]] costs a priority encoder in front and throws away the depth the tree saved; [[One-Hot Multiplexer]] takes over.
- **Wide fan-out is not in this table.** A decoder rail at $n = 8$ drives $128$ gate inputs, and the buffer chain sized for $\hat f\approx4$ that this forces is where the real delay lives — a cost the gate-input column does not show.
- **All $\tau$ figures assume $H = 1$ and $w = 1$.** A real load or a $w$-bit datapath rescales the electrical effort in every row, and for a $w$-bit path the hazard-repair area multiplies by $w$ since each bit lane is its own two-level function.
- **The $2^n$-wide OR of the flat mux is not always a gate.** On a wired-OR or tri-state node it is a wire, the exponential term vanishes, and the row that loses at every width above becomes the right choice.

No RTL block: this note instantiates nothing — it selects among blocks whose Spade is given in their own notes.

## Related Notes

- [[Binary Decoder]] – compares: the flat baseline whose $n2^n$ gate inputs and $n$-input ANDs set the fan-in problem the rest of the table answers.
- [[Predecoder]] – compares: the same decoder factored to AND2s, $32.6\,\tau\to25.1\,\tau$ at $n = 8$, and the reason "wide and flat" loses on an ASIC.
- [[Demultiplexer]] – compares: a decoder with the enable driven by data, so it inherits the decoder's row plus one AND level — or none, once the enable folds in.
- [[Binary Encoder]] – compares: the cheapest block here and the only one that is silently wrong on inputs it cannot detect.
- [[Priority Encoder]] – extends: buys totality over the encoder for $2n$ levels instead of $n{-}1$, which is the price of not trusting an invariant.
- [[Multiplexer Tree]] – compares: the default whenever the select width can grow, $6n\,\tau$ with nothing ever wider than two inputs.
- [[One-Hot Multiplexer]] – counter-example: shallower than the tree at every width and slower from $4{:}1$ upward, unless the wide OR is a wire rather than a gate.
- [[Transmission-Gate Multiplexer]] – compares: wins on transistor count ($16$ vs $\approx40$ for a $4{:}1$) and loses on cascading, where delay turns quadratic.
- [[XOR Parity Tree]] – compares: the one row whose ASIC and FPGA optimisations point opposite ways, gate-dominated on one and input-count-dominated on the other.
- [[Hazard-Free Two-Level Cover]] – depends-on: prices the timing property the rest of the table ignores, and is worth buying only outside a synchronous pipeline.
- [[Logical Effort]] – depends-on: supplies every $\tau$ in the table and the $g,p$ growth that makes fan-in, not depth, the deciding constraint.
- [[Logic Hazards]] – supports: the taxonomy behind the glitch column, and why dynamic hazards have no entry in it.
- [[Combinational Logic]] – depends-on: the long-form note every number here is re-cut from.

## References

- `0.2) Combinational Logic` — §Standard blocks (the cost/depth table for decoder, demux, encoder, priority encoder, mux, parity), §Fan-in, fan-out and logical effort (the $g$/$p$ table and the $n\approx4$ crossover), §Worked example: a 4:1 multiplexer, two ways ($12\,\tau$ vs $13.6\,\tau$; $11$/$20$ vs $7$/$18$ gates and gate inputs), §FPGA mapping (LUT6 boundary, `MUXF7`/`MUXF8`, XOR is free), §Trade-offs. No printed pages: that note has no assigned book source.
- Per-row derivations and their corrections live in the sibling notes linked above; where a sibling and the source disagree, the sibling's figure is the one quoted here.
- Underlying canon, by chapter only — Mano & Ciletti, *Digital Design*, chs. 3-4; Wakerly, *Digital Design*, chs. 4, 6; Weste & Harris, *CMOS VLSI Design*, chs. 4, 12; Sutherland, Sproull & Harris, *Logical Effort*, chs. 1-3.
