---
title: Choosing an Adder
description: "Trade-off table across the 24 Adders circuits, with the source's own numbers — and the one fork (FPGA or ASIC) that decides most of them before any of the rest matters."
kind: comparison
source: "ASA Ch. 5, pp. 103-143"
status: seed
spade: n/a
tags: [digital, adders, comparison, fpga, vlsi]
aliases:
  - Adder Comparison
  - Adder Trade-offs
  - Which Adder
  - Adder Selection
---

# Choosing an Adder

Every circuit in [[Adders]] computes the same function; they differ only in how much of the carry recurrence they refuse to wait for, and what they pay for the refusal.

| Circuit | Latency | Area | Fan-out / wiring | p. |
| --- | --- | --- | --- | --- |
| [[Full Adder]] | $c_i\to c_{i+1}$: 2 gate levels; $x_i\to c_{i+1}$: 3 † | 5 gates † | — | 107 |
| [[Half Adder]] | 1 gate, both outputs | 1 XOR + 1 AND | — | 107 |
| [[RCA, Ripple-Carry Adder]] | $(w-1)\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa})$ (Eq. 5.7) | $w$ FA — minimal | 1, nearest-neighbour | 108 |
| [[Two's Complement Adder-Subtractor]] | $+0$ over the base adder | $+w$ XOR (Eq. 5.8); $0$ extra on FPGA | unchanged | 110, 133 |
| [[Saturating Adder]] | $+1$ mux level | $w$ 2:1 muxes; flag is $c_\text{out}$, free | one shared select, fan-out $w$ | 105 |
| [[CSA, Carry-Save Adder]] | **independent of $w$** (Eq. 5.9) | $w$ FA, 3 in / 2 out | none — no inter-cell carry | 111 |
| [[High-Radix Carry-Save Adder]] | $\alpha$-bit ripple per group | $w$ FA; $w/\alpha$ carry bits kept; digit set $\{0,\dots,2^\alpha\}$ | none across groups | 112 |
| [[Switched Ripple-Carry Adder]] | $O(w)$, but $\tau_\text{cp}$ is a switch, not a gate — Eq. 5.7 stops being a valid model | 3 switches + GKP per bit | pass gates do not regenerate | 114 |
| [[Carry-Select Adder]], group $m$ | $\tau_\text{CPA}(m)+(\lceil w/m\rceil-1)\,\tau_\text{mux}$ | $\approx 2\times$ RCA + muxes | $m$ on the mux select | 115 |
| [[Conditional-Sum Adder]] | $\tau_\text{add}(1)+\log_2 w\;\tau_\text{mux}$ (Eq. 5.17) — **first $O(\log w)$** | linear in $w$ (leaf CPAs shared) | $w/2$ on the top select | 115-116 |
| [[CLA, Carry-Lookahead Adder]], $m=4$ | 2 gate levels per group, $O(w/m)$ overall | high; fan-**in** grows with $m$ | wide AND rank + one wide OR | 117 |
| [[Hierarchical Carry-Lookahead Adder]] | $O(\log_m w)$ levels | tree of fat CLA-$m$ nodes | $m$ | 118 |
| [[Kogge-Stone Tree]] | $\log_2 w=3$ — **minimum depth** | $17=w\log_2 w-w+1$ nodes ‡ | **2**; $\approx w$ long spans per stage — heaviest | 121, 123 |
| [[Sklansky Tree]] | $\log_2 w=3$ | $12=\frac{w}{2}\log_2 w$ nodes ‡ | $w/2=4$; light wiring | 119, 122 |
| [[Brent-Kung Tree]] | $2\log_2 w-2=4$ | $11=2w-2-\log_2 w$ — **fewest nodes** ‡ | $3$, constant in $w$; lightest, most regular | 122 |
| [[Compound Adder]] | $+0$ — the duplicated row is the existing bottom row | one extra simplified prefix row, linear in $w$ | as the host tree | 123 |
| [[Absolute Difference Operator]] | one compound tree + one mux level | one tree, not two; $+1$ NOR for the $X{=}Y$ flag | as the host tree | 124 |
| [[Compound Triple Sum]] | $+1$ half-adder level $+1$ mux level | $w$ HA + three $(w{+}2)$-bit muxes as printed § | $3\times$ carry-out fan-in as printed | 125 |
| [[FPGA Hard Carry Chain Adder]] | $\tau_\text{cp}=\mathbf{0.015}$ ns/bit vs $\tau_\text{fa}=\mathbf{0.57}$ ns (**$38\times$**), $\tau_\text{LUT}=0.14\ldots0.32$ ns, $\tau_\text{XOR}=0.21\ldots0.25$ ns; $\approx$**1 / 1.5 / 2.5 ns** at $w=8/16/32$ | $w$ BLEs, LUTs mostly idle | 1; dedicated CLB-to-CLB links, no general fabric | 126-127 |
| [[LUT-Merged Adder]] | $+0$ | **zero extra resources**: 2 LUT4s per FA input (Intel, Eq. 5.57); 2 LUT5s or 1 LUT6 (AMD, Eqs. 5.58-5.59); 2 LUT4s (Versal, Eq. 5.60) | unchanged | 129-130 |
| [[Ternary Adders on FPGAs]] | $\approx$ RCA + 1 LUT layer; **up to 50 % slower** than binary at small $w$ (AMD) | **same ALM count as a binary adder** of equal output width (Intel shared-arithmetic mode); $+1$ bit for $X-Y+Z$ / $X+Y-Z$, $+2$ for $X-Y-Z$ | CSA carries cross the general fabric (AMD) | 132 |
| [[Sign-Configurable Adder-Subtractor]] | as the ternary adder | ternary structure; $+1$ XOR and $+1$ AND on the selects (Eq. 5.62); output $w+2$ bits ¶ | as the ternary adder | 133-135 |
| [[Pipelined Ripple-Carry Adder]] | clock set by $m$, not $w$; **$k-1$ extra cycles**, $k=w/m$ | per waited stage: $2m$ input FFs, $m$ output FFs, **1** carry FF; DNP10 avoids **about half** the input-balancing BLEs | output FFs free (BLE registers); FF runs fold into SRLs | 135-137 |
| [[AAM Carry-Select Adder]] | benefit only from $w\ge$ **256**; **single-cycle** latency | **one LUT5 per output bit**; resources comparable to the pipelined adder at equal speed; prefix-CCC variants at **1024-8192** bits | CCC rides the fast chain, zero general routing | 137-139 |

**No absolute resource counts exist in this chapter.** Chapter 5 gives Virtex-6 *timings* (pp. 126-127) and *relative* resource statements — "the same number of ALMs as a binary adder", "a single LUT5 per output bit", "about half the BLEs" — and never a LUT, slice or $f_\text{max}$ table for any architecture. It uses no DSP blocks at all: addition is a carry-chain operator, so the DSP column would be $0$ everywhere and is omitted rather than written as "—". Cycle counts are $1$ for every row except the pipelined adder.

† The 5-gate count and the 2-level carry path are the gate-level realisation drawn in [[Full Adder]]; p. 107 gives only the black box, the truth table and Eqs. 5.2-5.4. ‡ Prefix node counts are for $w=8$, read off the graphs in [[Parallel Prefix Adders]], which omit the carry-in factor $X_{-1}=(c_0,c_0)$. § p. 125 says "a multiplexer" and then "three $w+2$-bit multiplexers" one paragraph later; [[Compound Triple Sum]] shows the singular is right and the true cost is one $(w{+}1)$-bit mux. ¶ The $w+2$ output width is derived in [[Sign-Configurable Adder-Subtractor]] from the $X=Y=-2^{w-1}$ corner; the book states only Eq. 5.62.

**The first question is not "how fast" but "FPGA or ASIC", because it reverses the ranking.** On FPGA the carry is the cheapest signal in the datapath and general routing is the expensive one, so every architecture that buys depth with fabric logic loses: rippling 32 bits costs $0.48$ ns of hardened chain, while five levels of a prefix tree cost at least $0.14$ ns of LUT *plus routing* each, and the book's verdict is flat — *"fast adder architectures … are useless when targeting FPGAs for typical sizes (up to 32 bits)"* (p. 134). Write `+`, let the tool infer the chain, and stop. On ASIC that inequality does not exist: there is no privileged carry path, a mux costs a gate rather than a routing hop, and $O(\log w)$ is genuinely reachable. Read the table's bottom five rows as an FPGA menu and its middle ten as an ASIC menu; almost nothing crosses.

**On ASIC, pick by which of depth, node count and fan-out you can afford to lose, because you cannot have all three.** Below roughly 16 bits or anywhere off the critical path, use an [[RCA, Ripple-Carry Adder]]: $w$ full adders is the floor, and the linear delay it pays is invisible if the adder is not what the clock is waiting for. On the critical path go to a prefix tree and let the binding resource choose which one — [[Kogge-Stone Tree]] for minimum depth when you can pay $w\log_2 w$ nodes and a layout dominated by wire tracks, [[Brent-Kung Tree]] when area, power or routing binds and one extra stage is affordable, [[Sklansky Tree]] when $w$ is small enough that a $w/2$ fan-out is still a light load or you are willing to buffer. [[Carry-Select Adder]] and [[CLA, Carry-Lookahead Adder]] are the intermediate answers: both stay $O(w)$ but shrink the per-group constant, which is enough when the width is moderate and a tree's wiring is not. [[Conditional-Sum Adder]] and [[Hierarchical Carry-Lookahead Adder]] are worth knowing mainly because they *are* prefix adders in disguise — the conditional-sum adder is Sklansky with muxes in place of $\circ$-nodes, and it inherits the identical $w/2$ fan-out pathology.

**If what you need is throughput rather than latency, stop optimising the carry network.** A [[CSA, Carry-Save Adder]] does not shorten a single addition — it removes the carry propagation from the *inner* loop and defers one real addition to the end, which is why it is the core of [[Multipliers]] and [[Dividers]] and useless on its own. [[High-Radix Carry-Save Adder]] is the same idea with a knob: propagate $\alpha$ bits before keeping a carry, trading critical path for the number of redundant bits you must register. On FPGA the throughput answer is the [[Pipelined Ripple-Carry Adder]], because a BLE flip-flop you decline to use is wasted rather than saved; you accept $k-1$ cycles of latency and any word size becomes affordable. Only when the latency itself must stay single-cycle *and* $w\ge256$ does the [[AAM Carry-Select Adder]] earn its two extra logic layers — and past a thousand bits it is prefix networks, back inside the AAM's carry-computation circuit, that rank predictably again.

**The remaining choices are interface decisions, not speed decisions, and they compose with whatever you picked above.** [[Saturating Adder]] changes what happens on overflow, [[Two's Complement Adder-Subtractor]] changes the sign of one operand for $w$ XOR gates and no delay, [[Compound Adder]] emits $X+Y$ and $X+Y+1$ so a late rounding bit can select, and [[Absolute Difference Operator]] and [[Compound Triple Sum]] are that same trick pointed at $|X-Y|$ and at $\{X{+}Y,\,{+}1,\,{+}2\}$. None of them touches the carry recurrence, so all of them work on top of an RCA, a Kogge-Stone tree or a hard carry chain alike — except that on FPGA the compound family's saving evaporates, since a hardened chain has no exposed intermediate row to duplicate and you buy a second adder instead. Two FPGA-only options genuinely have no ASIC counterpart: [[LUT-Merged Adder]], where a third addend, an operand mux or a KCM table rides in the LUT the adder was wasting, and [[Ternary Adders on FPGAs]], which is a carry-save row spent into that same idle layer — so if you are adding three numbers on an Intel part with shared-arithmetic mode, ask for $X+Y+Z$ before you ask for two adders. [[Sign-Configurable Adder-Subtractor]] is the ternary structure with both signs configurable, and driving its selects from the operands' sign bits gives the SAD kernel for free.

Accuracy never enters the choice: every circuit here is exact, $0$ ulp, except the [[Saturating Adder]], whose whole point is to be deliberately wrong in the bounded direction. All error in a fixed-point datapath comes from the format decisions of [[Error Accuracy]] and [[Number Formats]], never from the adder.

**Related Notes.**

- [[Adders]] – depends-on: the topic note this table summarises, with the derivations behind every row.
- [[Parallel Prefix Adders]] – depends-on: why the three trees are one construction, and where the node counts come from.
- [[Full Adder]] – depends-on: the cell every other row is built out of.
- [[Half Adder]] – depends-on: the degenerate cell that shaves the LSB and does the $X+Y=S+C$ rewrite.
- [[RCA, Ripple-Carry Adder]] – compares: the baseline, and still the right answer below ~16 bits on ASIC and ~32 on FPGA.
- [[Two's Complement Adder-Subtractor]] – compares: an interface change, $w$ XORs and no delay, orthogonal to every row.
- [[Saturating Adder]] – compares: the only row that is deliberately not the exact sum.
- [[CSA, Carry-Save Adder]] – counter-example: optimises the loop, not the addition — its delay does not depend on $w$ at all.
- [[High-Radix Carry-Save Adder]] – extends: the same trick with $\alpha$ as an explicit area/speed knob.
- [[Switched Ripple-Carry Adder]] – compares: shrinks $\tau_\text{cp}$ instead of the depth, and is what the FPGA chain turned out to be.
- [[Carry-Select Adder]] – compares: doubles area to replace $m$ carry stages with one mux delay.
- [[Conditional-Sum Adder]] – extends: carry-select applied to itself, the first $O(\log w)$ row.
- [[CLA, Carry-Lookahead Adder]] – compares: the row whose asymptotics die of fan-in rather than depth.
- [[Hierarchical Carry-Lookahead Adder]] – extends: the same blocks in a radix-$m$ tree, i.e. the prefix formulation unnamed.
- [[Kogge-Stone Tree]] – compares: minimum depth, fan-out 2, most nodes and most wire.
- [[Brent-Kung Tree]] – compares: fewest nodes and lightest wiring, one extra stage.
- [[Sklansky Tree]] – compares: minimum depth at half Kogge-Stone's nodes, billed as $w/2$ fan-out.
- [[Compound Adder]] – extends: two results from one tree, for the price of one linear row.
- [[Absolute Difference Operator]] – extends: the compound trick over $(X,\overline{Y})$, plus a free equality flag.
- [[Compound Triple Sum]] – extends: three results from one tree, at one half-adder row.
- [[FPGA Hard Carry Chain Adder]] – counter-example: the row that reverses the whole ranking below 256 bits.
- [[LUT-Merged Adder]] – extends: free logic in front of any FPGA adder, at zero resources.
- [[Ternary Adders on FPGAs]] – extends: what to spend that free logic on when there are three addends.
- [[Sign-Configurable Adder-Subtractor]] – extends: the ternary structure with both operand signs configurable.
- [[Pipelined Ripple-Carry Adder]] – compares: the FPGA answer when throughput, not latency, is the constraint.
- [[AAM Carry-Select Adder]] – compares: the only combinational FPGA scheme that pays, and only past 256 bits.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition", pp. 103-143. Every number in the table above is from:

- §5.1, pp. 104-106 — the generic / modulo-$2^w$ / saturating interfaces (p. 105).
- §5.2, pp. 106-112 — full and half adder (p. 107); RCA delay Eq. 5.7 (p. 108); adder/subtractor Eq. 5.8 (p. 110); carry-save Eq. 5.9 (p. 111); HRCS and Fig. 5.10 (p. 112).
- §5.3, pp. 112-125 — switched ripple-carry (p. 114); carry-select (p. 115); conditional-sum Eqs. 5.16-5.17 (pp. 115-116); CLA (p. 117); hierarchical CLA (p. 118); prefix cost criteria (p. 121); the three trees and their node counts (pp. 119, 122-123); compound adder (p. 123); absolute difference (p. 124); triple sum Eq. 5.49 (p. 125).
- §5.4, pp. 125-134 — Virtex-6 timings from [Xil14] (pp. 126-127); LUT merging Eqs. 5.57-5.60 (pp. 129-130); ternary adders on Intel and AMD (p. 132); sign-configurable Eq. 5.62 (pp. 133-135).
- §5.5, pp. 134-139 — the "useless on FPGA" verdict (p. 134); pipelining cost and DNP10 (pp. 135-137); AAM, Table 5.2 and Eqs. 5.63-5.66, the 256-bit crossover and [LPB19]'s 1024-8192-bit results (pp. 137-139).

No RTL: this note is a comparison, not a circuit.
