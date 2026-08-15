---
title: Choosing a Logic Realization
description: "Trade-off table across the 6 Boolean Algebra circuits, with the source's own numbers."
kind: comparison
source: "0.1) Boolean Algebra §Cost metrics, §FPGA mapping, §Trade-offs, §Worked example — no book source"
status: seed
spade: n/a
tags: [digital, boolean-algebra, comparison]
aliases:
  - Choosing a Logic Realisation
  - Logic Realization
  - Logic Realisation
  - Two-Level vs Multi-Level
  - Which Logic Style
---

# Choosing a Logic Realization

Six realizations of the same Boolean function, ranked by the constraint that actually decides between them — depth, literal count, gate polarity, or support size — because no two of the four rank them the same way.

**The counts, on the three functions every sibling costs.** Inverters excluded from gate counts; XOR counted as one gate of depth $1$; fan-in unbounded except in the column that says otherwise. Every signal in every row is $1$ bit wide — Boolean algebra assigns no weights, so there is no ulp here and nothing to round ([[Number Formats]]).

| Function | Realization | $L$ | Gates | $D$ | $D$ at fan-in 2 | Source |
| --- | --- | --- | --- | --- | --- | --- |
| $c_{out}=\sum m(3,5,6,7)$ | two-level SOP $ab+ac+bc$ | 6 | 3×AND2 + OR3 = 4 | 2 | 3 | §Trade-offs |
| | two-level POS $(a{+}b)(a{+}c)(b{+}c)$ | 6 | 3×OR2 + AND3 = 4 | 2 | — | [[Two-Level POS Network]] |
| | NAND-NAND | 6 | 3×NAND2 + NAND3 = 4 | 2 | — | §Trade-offs |
| | NOR-NOR | 6 | 3×NOR2 + NOR3 = 4 | 2 | — | [[NOR-NOR Network]] |
| | factored $ab+c(a+b)$ | 5 | 2×AND2 + 2×OR2 = 4 | 3 | 3 | §Trade-offs |
| | Shannon on $a$: $\mathrm{mux}(a,\,bc,\,b{+}c)$ | — | 1 mux + AND2 + OR2 = 3 | 2 | — | [[Shannon Expansion Multiplexer]] |
| | one 3-LUT | — | 1 | 1 | 1 | §Trade-offs |
| full adder ($s$ and $c_{out}$) | two-level SOP, no sharing | 18 | 9 | 2 | — | §Trade-offs |
| | factored, $h=a\oplus b$ shared | 10 | 5 | 3 | — | §Trade-offs |
| | same network, 3 named nodes | 8 | 5 | 3 | — | [[Multi-Level Factored Network]] |
| | two 3-LUTs | — | 2 | 1 | — | §Trade-offs |
| 4-input parity | minimal SOP $=$ canonical SOP | 32 | 8×AND4 + OR8 = 9 | 2 | 5 | §Trade-offs |
| | minimal POS $=$ canonical POS | 32 | — | 2 | — | [[Two-Level POS Network]] |
| | NAND-only XOR tree | 24 | 12×NAND2 | 6 | — | §Trade-offs |
| | factored XOR tree $(a\oplus b)\oplus(c\oplus d)$ | 6 | 3 | 2 | 2 | §Trade-offs |
| | one 4-LUT | — | 1 | 1 | 1 | §Trade-offs |

**What the dashes are, and why there are no page numbers.** The `Source` column names sections, not pages, because there is no book source for this topic — [[0.1) Boolean Algebra]] is the primary and it carries no pagination, and no copy of Mano, Wakerly or Weste & Harris was opened for any note in this folder. `—` in $L$ means literal count is not a cost the row's target can see: a LUT bills support size, and a mux bills switches, not variable occurrences. `—` in the fan-in-$2$ column means no sibling recosted that netlist and the figure was not invented here. Absent entirely, from every note in the folder: **absolute delay in ns, area in µm² or slices, energy, and any DSP-block count** — those need a process node and a cell library, and there is none. **Cycle counts are absent because they are all zero**: every realization here is one combinational cone, and clocking enters at [[Synchronous Sequential Logic]], not here.

The one place a real delay model does get run is the NAND/NOR comparison, on the majority network above, under logical effort with $\gamma=2$, branching $B=2$, $N=2$ stages, $P=5$:

| | $G$ | $\hat f$ at $H=1$ | $D$ at $H=1$ | $D$ at $H=16$ |
| --- | --- | --- | --- | --- |
| NAND-NAND | $20/9$ | $2.11$ | $9.2\tau$ | $21.9\tau$ |
| NOR-NOR | $35/9$ | $2.79$ | $10.6\tau$ | $27.3\tau$ |

$15\%$ at unit load, $25\%$ at a fanout of $16$, asymptotically $\sqrt{35/20}=1.32$ — all from [[NOR-NOR Network]].

> [!warning] Two literal-count conventions collide in the full-adder rows
> $18$ and $10$ count variable occurrences in the expressions; $8$ counts references in a three-node network; counting *gate inputs* in the realization the two-level pair is $25$. The ratio survives all three readings ($2.25\times$, $2.5\times$), but the columns are not comparable across them. Fix the convention before quoting any of these against a synthesis report.

**If depth decides, the two-level forms win by definition and the win is often worthless.** Every function has a canonical SOP, so $D=2$ is a universal upper bound and no other structure in this folder has a depth independent of $n$. The catch is in the fan-in-$2$ column: parity goes from $D=2$ to $D=5$ the moment an $8$-input OR stops being one gate delay, while the XOR tree stays at $2$. So "two-level" is a claim about netlist ranks and only becomes a delay claim under a fan-in budget you can actually buy. Take the two-level form when the cone is genuinely small — control decode, address decode, an interlock — where $p$ is under about a dozen and the depth advantage survives the re-cost. Take it also when the path is one gate delay from a setup violation, since factoring is an area transform that is *sometimes* free, never a speed transform.

**If area decides, factor, and expect the exchange rate to vary.** Literal count is the ASIC area proxy because a static CMOS complex gate spends one NMOS and one PMOS per literal — $2L$ transistors — and two-level minimization cannot reach the reductions factoring finds, because it works on each output in isolation at fixed depth. The full adder pays one level of depth for $18\to10$ literals and $9\to5$ gates, and the level is paid only once because $s$ needed $a\oplus b$ anyway. Parity pays *nothing*: $32\to6$ literals at identical depth $2$, a $5.3\times$ reduction, because its eight prime implicants are all minterms and none combine, so two-level minimization achieves literally nothing on it. That is the case to remember — check for an XOR structure before minimizing anything, because the two-level answer to parity is the worst realization in the whole table on both metrics at once.

**If the target is static CMOS, the polarity question has a fixed answer and the SOP/POS question does not.** There is no non-inverting primitive: an AND gate *is* a NAND plus an inverter, so rewriting a two-level SOP as NAND-NAND is free — identical literals, gates and depth, one inverter deleted per gate — and there is no reason not to. The dual is equally free in algebra and not in silicon: NOR series-stacks the low-mobility PMOS, giving $g_{\text{NOR-}k}=(2k+1)/3$ against $g_{\text{NAND-}k}=(k+2)/3$ and the $15$–$25\%$ above. Prefer NAND. The ranking is a property of the device pair, not of the logic, and it *flips* in dynamic and domino logic where the PMOS stack disappears — which is why a fabricated PLA is physically a NOR-NOR array. Whether to start from SOP or POS is a separate question with no default: it is decided by which polarity's cover is smaller, and the zero-count heuristic is not a theorem. The running example has $6$ zeros against $10$ ones and the SOP still wins, $7$ literals to $9$. Cost both; it is three map operations. POS earns its keep where the zero set is small and structured, and where the consumer wants $\bar f$ anyway, because then an OAI cell delivers a two-level POS with its inversion in one CMOS stage.

**If the target is an FPGA, none of the above is a cost and the table's last row is the answer.** A $k$-LUT implements *any* function of $k$ variables at one LUT and depth $1$, so a $64$-literal canonical SOP and a $7$-literal minimal SOP over the same four variables are the identical 4-LUT configuration. Literal count is invisible, product count is invisible, gate polarity is invisible; the surviving metric is **support size**, and with $k=6$ on current devices every six-variable cone is free. Running an exact two-level minimizer before FPGA synthesis is wasted effort. What replaces it is Shannon expansion used as decomposition — one expansion turns a $(k{+}1)$-variable function into two $k$-LUTs and a mux the fabric already provides beside every LUT pair — and its interest is that the mux tree, the canonical SOP and the LUT are the same recursion stopped at three different depths. Blind expansion is exponential, $2^{n-k}$ leaf LUTs; the mapper's real job is choosing split variables whose cofactors share subfunctions.

$$\boxed{\ \text{depth}\Rightarrow\text{two-level};\quad \text{area}\Rightarrow\text{factored};\quad \text{static CMOS}\Rightarrow\text{NAND-NAND, always};\quad \text{FPGA}\Rightarrow\text{decompose to support }\le k\ }$$

**When the table stops helping**

- **Wide fan-in.** Every $D$ column except the fan-in-$2$ one prices a $2^{n-1}$-input OR at one gate delay. Past roughly a dozen products, re-cost with $D=\lceil\log_k n\rceil+\lceil\log_k p\rceil$ before comparing anything.
- **Hazards.** A minimum cover deletes exactly the consensus terms that hold the output steady through a transition, so the cheapest row is generally not the glitch-free one. Minimality and hazard-freedom are opposed objectives, and the choice is made in the cover, before any row of this table applies ([[Combinational Logic]]).
- **XOR-heavy functions.** $L$ as a $2L$-transistor proxy is an AND/OR model. A CMOS XOR2 is not four transistors, so the $L=6$ XOR tree is not one-fifth the area of the $L=32$ SOP. Compare literal counts only within one gate family.
- **Multiple outputs.** Every per-function row costs one output at a time except the full-adder rows. Sharing across outputs is where factoring and PLAs both earn their living, and it is a harder problem than either single-output column suggests.
- **Scale.** Prime implicants grow as $\Theta(3^n/n)$ and minimum unate covering is NP-hard, so exact two-level minimization is gone well before $n=16$ and multi-level minimization has no exact algorithm at all. Past that point the table compares heuristic outputs, not minima.

**No RTL.** This note synthesizes nothing — it is a comparison of six realizations whose Spade blocks live in the six sibling notes, each compiled and, where it computes a value, simulated there.

**Related Notes**

- [[Two-Level SOP Network]] – compares: the depth-$2$ baseline every other row is measured against, and the only form with a canonical representative.
- [[Two-Level POS Network]] – compares: the same cost at the same depth on the zeros instead of the ones, so the choice between them is a property of $f$, not of style.
- [[NAND-NAND Network]] – extends: the SOP rewritten in one primitive at zero cost, the default on any static CMOS target.
- [[NOR-NOR Network]] – compares: the POS-side dual, algebraically identical and $15$–$25\%$ slower in static CMOS, faster in dynamic logic.
- [[Multi-Level Factored Network]] – counter-example: the row that beats two-level minimization on literals by up to $5.3\times$, sometimes for a level of depth and sometimes for nothing.
- [[Shannon Expansion Multiplexer]] – extends: the realization whose cost model is support size rather than literals, and the decomposition step FPGA mapping actually runs.
- [[Karnaugh Map]] – depends-on: where the covers being costed in the two-level rows come from.
- [[Lookup-Tables]] – counter-example: the target on which every column but the last two reads zero.
- [[FPGAs]] – supports: why support size replaces literal count once the fabric is fixed.
- [[CMOS Logic Gates]] – depends-on: the inherent inversion and the PMOS mobility that decide the NAND-versus-NOR row.

## References

- [[0.1) Boolean Algebra]] — §Cost metrics (literal count as the $2L$ transistor proxy, the bounded-fan-in depth formula), §FPGA mapping (support size, $k=6$, decomposition as the real problem), §Trade-offs (every row marked *§Trade-offs* above, quoted verbatim), §Worked example — the full adder (the shared-$h$ network and its $L=10$, $5$ gates, $D=3$).
- Sibling notes for the rows they contributed: [[Two-Level POS Network]] (the self-dual majority POS, the parity POS, the $7$-versus-$9$ polarity result), [[NOR-NOR Network]] (the logical-effort table and the $\gamma$ argument), [[Multi-Level Factored Network]] (the three-node literal convention and the clash flagged above), [[Shannon Expansion Multiplexer]] (the mux realization of the carry and the $2^k-1$ tree), [[Two-Level SOP Network]] (the fan-in-$2$ recost column).
- No textbook source for this topic. Standard canon behind it: Mano & Ciletti, *Digital Design*; Wakerly, *Digital Design: Principles and Practices*; Weste & Harris, *CMOS VLSI Design*; Brayton et al., *Logic Minimization Algorithms for VLSI Synthesis*, 1984. Page numbers are deliberately omitted — no copy was consulted.
