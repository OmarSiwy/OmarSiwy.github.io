---
title: Clock Skew and Jitter
description: "Spatial-static versus temporal-random error on the same edge: skew is signed, budgetable and exploitable, jitter is not, and only one of them can eat your hold margin."
kind: concept
source: "0.3) Introduction to Flip-Flops & Latches, §Clock skew and jitter, §Single-cycle timing constraints, §FPGA mapping; Weste & Harris ch. 10 and the clock-distribution chapter"
status: seed
spade: n/a
tags: [digital, flip-flops-and-latches, timing, clocking, skew, jitter, sta]
aliases:
  - Clock Skew
  - Clock Jitter
  - Skew and Jitter
  - Useful Skew
  - Clock Uncertainty
---

# Clock Skew and Jitter

**One-line summary:** The two ways a real clock edge fails to arrive when the schematic says it does — skew, a static difference *between* pins, and jitter, a random difference *between cycles* — which enter the timing checks through completely different doors because only one of them is common to both edges of a check.

```tikz title="Launch and capture clock waveforms: skew as a fixed offset between pins, jitter as an uncertainty band on one edge"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % jitter uncertainty band on the capture edge of cycle n+1
  \fill[gray!25] (4.15,0.35) rectangle (4.85,1.60);

  % launch clock
  \draw[thick] (-0.8,2.4) -- (0,2.4) -- (0,3.2) -- (2,3.2) -- (2,2.4)
     -- (4,2.4) -- (4,3.2) -- (6,3.2) -- (6,2.4) -- (6.6,2.4);
  \node[anchor=east] at (-0.9,2.8) {$clk$ at FF$_L$~[1]};

  % capture clock, late by t_skew
  \draw[thick] (-0.8,0.6) -- (0.5,0.6) -- (0.5,1.4) -- (2.5,1.4) -- (2.5,0.6)
     -- (4.5,0.6) -- (4.5,1.4) -- (6.5,1.4) -- (6.6,1.4);
  \node[anchor=east] at (-0.9,1.0) {$clk$ at FF$_C$~[1]};

  % period
  \draw[dashed] (0,3.2) -- (0,3.85);
  \draw[dashed] (4,3.2) -- (4,3.85);
  \draw[<->] (0,3.7) -- (4,3.7);
  \node[anchor=south] at (2,3.72) {$T_{clk}$};

  % skew between the two edges of cycle n
  \draw[dashed] (0,2.4) -- (0,1.7);
  \draw[dashed] (0.5,1.4) -- (0.5,1.7);
  \draw[<->] (0,1.8) -- (0.5,1.8);
  \node[anchor=south] at (0.25,1.88) {$t_{skew}$};

  % jitter
  \node[anchor=south] at (4.5,1.62) {$\pm t_{j}$};
  \draw[dashed] (4.5,2.4) -- (4.5,2.05);

  \node[anchor=north,align=center] at (2.9,0.1)
    {$t_{skew}=t_{arrival}(C)-t_{arrival}(L)$: static, signed, one number per pin pair\\
     $t_{j}$: cycle-to-cycle, unsigned, a band the same edge lands anywhere inside};
\end{circuitikz}
\end{document}
```

*Own construction; the standard two-waveform picture, e.g. Weste & Harris ch. 10.*

**Topic:**

**Separate the two by which axis the variation lives on, because that single fact predicts everything else.** A synchronous design has exactly one signal — the clock, 1 bit wide — whose *arrival time* is a per-endpoint quantity rather than a per-net one, because it is the only net driving tens of thousands of pins that are all supposed to act simultaneously. **Skew** is variation along space: two clock pins receive the same edge at different instants, because their branches of the tree have unequal depth, unequal load, or sit in different on-die $V_{DD}$ and temperature gradients. It is *repeatable* — the same pin pair shows the same offset every cycle — so it can be measured, budgeted, and deliberately scheduled. **Jitter** is variation along time: one pin receives successive edges at wrong instants, from PLL phase noise, supply ripple through the tree buffers' delay-versus-$V_{DD}$ sensitivity, and thermal noise. It is not repeatable, so it can only be budgeted, never scheduled. The $n$-bit datapath between the flops has no equivalent problem; its delay variation is absorbed into $t_{logic,max}$ and $t_{logic,min}$ and never gets its own name.

**Give skew a sign before doing any algebra, or the two checks will not come out with opposite signs.** For a launch flop $L$ feeding combinational logic feeding a capture flop $C$, define

$$t_{skew} = t_{arrival}(C) - t_{arrival}(L)$$

Positive skew means the capture clock is *late*. This is a directed quantity attached to an ordered pair of pins, not a property of the tree: the same pair contributes $+t_{skew}$ to the path $L\to C$ and $-t_{skew}$ to the path $C\to L$. The single "skew number" quoted for a design — global maximum insertion delay minus global minimum — is an upper bound over all pairs, and a pessimistic one, since most pairs of flops never exchange data.

**Push that signed quantity through both checks from [[Setup and Hold Constraints]] and watch it move in opposite directions.** The launch edge at $t=0$ presents data at $C$'s $D$ pin at $t_{cq,max}+t_{logic,max}$; the capture edge arrives at $T_{clk}+t_{skew}$ and needs stability $t_{setup}$ before it, so

$$T_{clk}\;\ge\;t_{cq}+t_{logic,max}+t_{setup}-t_{skew}$$

The hold check uses the *same* edge $n$ on both sides: fast data launched at $t=0$ arrives at $t_{cq,min}+t_{logic,min}$, while $C$'s aperture stays open until $t_{skew}+t_{hold}$, so

$$t_{cq,min}+t_{logic,min}\;\ge\;t_{hold}+t_{skew}$$

$T_{clk}$ never entered the second inequality, because both of its terms are referred to one edge. Skew enters both, with opposite signs, one-for-one: every picosecond of positive skew is a picosecond of setup slack bought and a picosecond of hold slack spent.

**Jitter enters only the setup inequality, and it is the same cancellation that deleted $T_{clk}$.** Displace edge $n$ by $\delta$. In the hold check both the data-launch time and the aperture-open time shift by $\delta$, so $\delta$ subtracts out — it is **common-mode**, and the check is invariant under it. In the setup check the two sides refer to edges $n$ and $n+1$, and their independent displacements do not cancel; what survives is the *cycle-to-cycle* period error. Sign-off therefore takes the skew budget adversely as an unsigned magnitude $T_{skew}=|t_{skew}|_{max}$ (its true sign is unknown until place-and-route) and adds jitter to setup only:

$$T_{clk}\;\ge\;t_{cq}+t_{logic,max}+t_{setup}+T_{skew}+t_{j}
\qquad
t_{cq,min}+t_{logic,min}\;\ge\;t_{hold}+T_{skew}$$

Together these two terms are what an SDC file calls **clock uncertainty**, and pre-CTS they are a single guessed constant standing in for a tree that does not exist yet.

| | skew | jitter |
| --- | --- | --- |
| nature | spatial, static | temporal, random |
| affects setup | yes, signed | yes, always adverse |
| affects hold | yes, and it is the dangerous one | largely cancels (common edge) |
| fixable after tapeout | no | partially, via supply and PLL cleanup |
| can be exploited | yes, useful skew | no |

> [!important] The exploitable one is the only one that can kill the die
> Positive skew buys setup margin and spends hold margin one-for-one, and those two currencies are not interchangeable. A setup failure is a performance bug — lower the frequency and the part works. A hold failure is *functional*: $T_{clk}$ does not appear in the hold inequality, so the chip is broken at every frequency, at DC, forever. That is why hold is signed off at the **fast** corner (low temperature, high $V_{DD}$, fast process) where $t_{cq,min}+t_{logic,min}$ is smallest while setup is signed off at the slow corner, why hold is repaired by *inserting* delay on short paths (costing area and leakage but never frequency), and why skew scheduling is the one optimisation that can turn a working design into a paperweight.

**Useful skew borrows time across a boundary, and the telescoping sum says it cannot create any.** Deliberately delaying $C$'s clock lends the stage $L\to C$ extra time; the loan is repaid by the next stage $C\to D$, whose skew $t_{arrival}(D)-t_{arrival}(C)$ falls by the same amount. Around any closed cycle in the register graph the arrival times **telescope** and the skews sum identically to zero, so useful skew redistributes slack along a path but cannot add slack to a loop — the maximum frequency of a cyclic circuit is set by its critical *cycle*, mean delay over registers, not by its critical path. On a directed acyclic pipeline segment the redistribution is genuinely free performance, and this is what "clock skew scheduling" solves as a linear program. Every picosecond so borrowed is charged to hold on the same edge, which is why tools do it timidly and only after hold has margin.

**Skew is bought down with topology, and the price is on the power budget.** Balanced structures — H-trees, where every leaf sits at the end of a geometrically identical path, and clock spines with matched taps — exist for no reason other than to make $T_{skew}$ small by construction rather than by optimisation. The residual comes from what geometry cannot match: per-branch load mismatch after buffer sizing, IR drop that slows one region's buffers, and thermal gradients that do the same. The last two are why on-chip variation is derated per-path rather than globally, and why static timing removes **common-path pessimism**: the shared trunk of the tree from the root to the branch point is one physical wire, so derating it twice in opposite directions on the two sides of a check is arithmetic, not physics.

**Jitter is not one number, and using the wrong one over-designs by a factor.** Cycle-to-cycle jitter (adjacent-period error) is what the single-cycle setup check needs. Period jitter and long-term jitter measure accumulation over many cycles, and accumulation is sub-linear for uncorrelated noise — roughly $\sqrt{N}$ for a random walk, and bounded outright once the PLL loop bandwidth pulls the phase back — so charging $N\,t_j$ to an $N$-cycle multicycle path is wrong in the expensive direction. The dominant on-die contributor is usually not the PLL but supply ripple in the tree buffers, which makes clock jitter a consequence of the switching activity of the logic the clock drives: a design that toggles hard on one edge modulates its own clock. Decoupling capacitance is therefore a timing fix, not merely a reliability one.

**A gated clock is a second clock domain wearing the first one's name.** The [[Integrated Clock-Gating Cell]] inserts a latch and an AND into a branch of the tree, and that insertion delay skews every flop downstream of it relative to the ungated leaves. Clock-tree synthesis has to balance the ICG's delay like any other buffer, the enable acquires a setup constraint against the gating cell measured on the *low* phase, and duty-cycle distortion in the tree now matters because the latch's sampling window is the low phase rather than an edge. None of this is visible in the RTL, which says only `if (en)`.

**FPGA mapping removes most of the problem and moves the rest to the boundary.** Global clock buffers drive pre-built, pre-balanced spine-and-row networks whose skew across the die is bounded, characterised, and not the designer's to improve; there is no tree to design and no clock-tree power to trade. Combined with a fixed, characterised intra-slice flop-to-flop delay, this makes datapath **hold violations essentially impossible** — the router cannot produce a path shorter than $t_{hold}$ — so hold is an ASIC concern that returns on an FPGA only at I/O boundaries and at clock-domain crossings. Jitter is dominated by the on-chip PLL/MMCM and is quoted directly in its datasheet, to be entered as clock uncertainty rather than derived. Gating costs a scarce global buffer (`BUFGCE`), which is one more reason the fabric's free per-flop clock enable wins there — see [[Clock Enable Flip-Flop]] and [[FPGAs]].

**Result.**

$$\boxed{\;T_{clk}\ge t_{cq}+t_{logic,max}+t_{setup}+T_{skew}+t_{j}\;;\qquad t_{cq,min}+t_{logic,min}\ge t_{hold}+T_{skew}\;}$$

with $t_{skew}=t_{arrival}(C)-t_{arrival}(L)$ signed, $T_{skew}=|t_{skew}|_{max}$, and $t_j$ absent from the hold check because a displacement common to both sides of one edge cancels.

**When it breaks.**

- **Launch and capture on different PLLs:** jitter is no longer common-mode on the hold check, and the cancellation above is void. Treat it as a clock-domain crossing and use a [[Synchronizer Chain]]; a skew budget between independent sources is not a meaningful number.
- **Multicycle paths:** charging $N\,t_j$ over $N$ cycles over-designs, because jitter accumulates sub-linearly and is bounded by the PLL loop; charging $1\,t_j$ under-designs. Use the vendor's long-term figure, not arithmetic on the cycle-to-cycle one.
- **Pre-CTS timing:** the skew and jitter numbers are a guessed `set_clock_uncertainty` constant. Every conclusion drawn from them, including "hold is clean", is provisional until the tree is built.
- **Aggressive useful skew:** slack borrowed for setup is taken from hold on the same edge, in a design where hold repair is what makes the die functional at all. It is also fragile — the borrowed offset must survive OCV and every corner.
- **Transparent styles:** anything that lengthens the window during which fast data can propagate makes the hold-plus-skew term bite harder, which is why the [[Transparent D Latch]] is dangerous where the [[Master-Slave D Flip-Flop]] is not.
- **Duty-cycle distortion:** neither term above captures it, and both edges matter for latch-based, dual-edge, and clock-gated designs.
- **Very large $T_{skew}$ relative to $t_{hold}$:** at some point no amount of buffer insertion on the short paths fixes hold without lengthening them past the setup limit, and the two inequalities become jointly infeasible. The fix is the tree, not the datapath.

**RTL (Spade).**

`spade: n/a` — there is nothing to write. Skew and jitter are properties of the physical clock distribution network and its variation, not of any structure an HDL can express: the RTL for a launch/capture pair is byte-identical whether the tree is perfectly balanced or badly skewed. In Spade, as in Verilog, a `clock` is a single ideal name with no arrival time attached; the numbers in this note live in the SDC constraints and in the post-CTS timing model, and the H-tree that bounds them is physical design.

**Related Notes (with context):**

- [[Setup and Hold Constraints]] – depends-on: supplies the two inequalities this note perturbs, and the aperture window whose position the skew shifts.
- [[Master-Slave D Flip-Flop]] – supports: the cell whose $t_{setup}$, $t_{hold}$ and $t_{cq}$ the budget is written against.
- [[Integrated Clock-Gating Cell]] – compares: deliberately inserts delay into one branch of the tree, creating skew as a side effect of saving power.
- [[Clock Enable Flip-Flop]] – compares: the alternative that adds mux delay to $t_{logic,max}$ instead of adding skew to a clock branch.
- [[Synchronizer Chain]] – counter-example: what to use when the two clocks have no common tree and no skew relationship exists to budget.
- [[Transparent D Latch]] – counter-example: transparency widens the race window that the hold-plus-skew term bounds.
- [[FPGAs]] – compares: pre-built global trees make skew bounded and datapath hold violations essentially impossible, inverting which of the two checks the designer worries about.
- [[Choosing a Storage Element]] – compares: where these constraints sit against the whole family of sequential cells.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Clock skew and jitter* — the skew/jitter table and the sources of each; §*Single-cycle timing constraints* — the signed-skew derivation of both inequalities and the common-mode cancellation; §*FPGA mapping* — global buffers, `BUFGCE`, and why hold is an ASIC problem.
- Weste & Harris, *CMOS VLSI Design*, sequential-circuit-design and clock-distribution chapters — skew sign convention, useful skew and skew scheduling, H-trees and spines, jitter sources.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, timing-issues chapter — clock distribution networks, supply-noise-induced jitter, and the power cost of the tree.
- Mano & Ciletti, *Digital Design*, synchronous sequential logic — the idealised single-clock model these two effects are the correction to.

> [!warning] Chapter-level citations, no verified page numbers
> This note has no book source in the vault's PDF set; the textbook references above are chapter-level and were not opened for it. The material is standard and stable across editions, but the pages are not given because none were consulted.

> [!warning] Clock-tree power fraction not quoted here
> The long-form note gives 20–40 % of dynamic power as the cost of a clock tree. That is a canonical order-of-magnitude figure, not characterised data, and it varies by more than 2× with flop count, gating coverage and tree style. It is not repeated as a budget number above; characterise the actual design.
