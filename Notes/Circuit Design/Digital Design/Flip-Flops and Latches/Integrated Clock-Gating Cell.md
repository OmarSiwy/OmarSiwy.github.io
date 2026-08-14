---
title: "Integrated Clock-Gating Cell"
description: "A low-phase latch feeding an AND — the latch is not optional, it is what stops a glitch on the enable from becoming a spurious clock edge; the largest dynamic-power lever in a synchronous design."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §Gated clocks and enable flops, §FPGA mapping; Weste & Harris ch. 13 (power) and ch. 10; Wakerly ch. 8"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, clock-gating, low-power, latch, glitch]
aliases:
  - Integrated Clock Gating Cell
  - ICG
  - ICG Cell
  - Clock Gating Cell
  - Clock Gate
  - Gated Clock
  - Latch-Based Clock Gate
---

# Integrated Clock-Gating Cell

**One-line summary:** The cell that turns a clock branch off — a level-sensitive latch that samples the enable while the clock is *low*, feeding an AND with the clock — distinguished from a bare AND by the fact that it cannot manufacture a clock edge out of a glitch on its enable.

```tikz title="Integrated clock-gating cell: low-phase enable latch feeding an AND, with the glitch it swallows"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  % ---------------- cell schematic ----------------
  \draw[thick] (2.3,0.9) rectangle (4.5,2.7);
  \node at (3.4,1.8) {\textbf{latch}};
  \node[anchor=west,font=\scriptsize] at (2.36,2.35) {$D$};
  \node[anchor=west,font=\scriptsize] at (2.44,1.30) {$G$};
  \node[anchor=east,font=\scriptsize] at (4.44,2.35) {$Q$};
  \node[anchor=north,font=\scriptsize] at (3.4,0.78) {transparent while $clk=0$};

  \draw (0.0,2.35) node[anchor=east] {$en$~[1]} -- (2.3,2.35);
  \node[anchor=south,font=\scriptsize] at (5.1,2.40) {$en_L$~[1]};

  \draw (0.0,-0.9) node[anchor=east] {$clk$~[1]} -- (1.6,-0.9);
  \fill (1.6,-0.9) circle (0.055);
  \draw (1.6,-0.9) -- (1.6,1.30) -- (2.16,1.30);
  \draw (2.23,1.30) circle (0.07);
  \draw (1.6,-0.9) -- (6.3,-0.9);

  \node[and port] (a) at (7.4,1.1) {};
  \draw (4.5,2.35) -- (5.9,2.35) |- (a.in 1);
  \draw (6.3,-0.9) |- (a.in 2);
  \draw (a.out) -- ++(0.9,0) node[anchor=west] {$clk_g$~[1]};

  % ---------------- waveforms ----------------
  \begin{scope}[yshift=-6.0cm]
    \foreach \y/\n in {2.55/$clk$, 1.70/$en$, 0.85/$en_L$, 0.0/$clk_g$}
      \node[anchor=east,font=\scriptsize] at (0.35,\y+0.25) {\n};
    \draw[thick] (0.5,2.55) -- (1.5,2.55) -- (1.5,3.05) -- (2.5,3.05)
        -- (2.5,2.55) -- (3.5,2.55) -- (3.5,3.05) -- (4.5,3.05)
        -- (4.5,2.55) -- (5.5,2.55) -- (5.5,3.05) -- (6.5,3.05)
        -- (6.5,2.55) -- (7.6,2.55);
    \draw[thick] (0.5,1.70) -- (2.8,1.70) -- (2.8,2.20) -- (4.2,2.20)
        -- (4.2,1.70) -- (5.9,1.70) -- (5.9,2.20) -- (6.2,2.20)
        -- (6.2,1.70) -- (7.6,1.70);
    \draw[thick] (0.5,0.85) -- (2.8,0.85) -- (2.8,1.35) -- (4.2,1.35)
        -- (4.2,0.85) -- (7.6,0.85);
    \draw[thick] (0.5,0.0) -- (3.5,0.0) -- (3.5,0.50) -- (4.5,0.50)
        -- (4.5,0.0) -- (7.6,0.0);
    \draw[gray!60,dashed] (5.9,-0.35) -- (5.9,3.25);
    \draw[gray!60,dashed] (6.2,-0.35) -- (6.2,3.25);
    \node[anchor=north,font=\scriptsize,align=center] at (4.0,-0.5)
      {$en$ settles in the low phase $\Rightarrow$ one clean gated pulse;\\
       the glitch at $clk=1$ meets a closed latch, so $clk_g$ never moves};
  \end{scope}
\end{circuitikz}
\end{document}
```

*Own construction; the standard rising-edge ICG topology as drawn in every low-power library databook and in Weste & Harris ch. 13.*

**Topic:**

**Start from the power equation, because it is the only reason this cell exists.** Dynamic switching power is $P_{dyn}=\alpha\,C\,V_{DD}^{2}\,f$, where $\alpha$ is the activity factor — transitions per clock period. Every data node in a design has $\alpha<0.5$ and most have $\alpha\ll0.1$. The clock net has $\alpha=1$ *by definition*: it is the one node guaranteed to make two transitions every period, and it is also the node with the largest $C$, because it fans out to every sequential element on the die. That product is why the clock tree is routinely quoted at 20–40 % of a chip's dynamic power. Clock gating attacks $f$ on a branch — driving it to zero for the cycles in which the branch's flops are not going to change — and it is the only lever that touches the $\alpha=1$ node at all. All of $clk$, $en$, $clk_g$ and $en_L$ are 1 bit wide; the register they gate is $W$ bits and $W$ never enters the cell.

**The saving is larger than "the flops do not toggle", and this is the point [[Clock Enable Flip-Flop]] misses.** An enable flop is a 2:1 mux in the D path, $D'=en\cdot D+\overline{en}\cdot Q$. When $en=0$ the flop's $Q$ does not change, so $\alpha$ on the *data* node drops — but the clock pin still toggles, the local clock buffer still toggles, and the four clocked transistors inside a master–slave flop still charge and discharge their internal nodes every cycle. Gating removes three costs at once: the branch of the clock tree, the flop's internal clock power, and the data toggling. It also removes the mux delay from $t_{logic,max}$ on every cycle including the critical ones, which is a frequency argument rather than a power one.

**The naive gate is functionally correct and physically wrong.** Write $clk_g=clk\wedge en$. Logically it is exactly right: by the **annihilator of AND** ($x\cdot0=0$) the branch is dead whenever $en=0$, and by the **identity of AND** ($x\cdot1=x$) it is a faithful copy of $clk$ whenever $en=1$. The defect is that the same identity works in the other direction. During the high phase, $clk=1$, so $clk_g=1\cdot en=en$: for half of every period the AND is *transparent to its enable input*. And $en$ is the output of combinational logic, so it is subject to the ordinary transients of [[Hazards and Glitches]] — a $0\!\to\!1\!\to\!0$ pulse of a few gate delays as unequal paths resolve. That pulse arrives at $clk_g$ unattenuated, and a rising transition on a clock net *is* a clock edge. Every flop on the branch captures whatever happened to be on its $D$ pin at that instant.

**The failure mode deserves naming precisely, because it is what makes the latch non-negotiable.** This is not a wrong value on a data path that a testbench would catch; it is an extra edge on a clock. RTL simulation cannot see it — at the RTL level $en$ has no transients, it changes once per delta cycle and the glitch does not exist as an event. Gate-level simulation with back-annotated delays can see it, but only if the applied vectors happen to create the unbalanced arrival that produces the glitch, and only at the corner where the path imbalance is large enough. It therefore passes every regression and appears once, in silicon, at one PVT corner, as an intermittent functional failure — the most expensive class of bug there is.

**The repair is to hold the enable constant over exactly the window in which the AND can pass it.** Feed $en$ through a [[Transparent D Latch]] whose gate is driven by $\overline{clk}$: transparent while $clk=0$, opaque while $clk=1$. Its characteristic equation, by **Shannon expansion** about $clk$ ($f=clk\cdot f_{clk}+\overline{clk}\cdot f_{\overline{clk}}$, with $f_{\overline{clk}}=en$ from transparency and $f_{clk}=en_L$ from hold), is

$$en_L=\overline{clk}\cdot en+clk\cdot en_L$$

Now substitute into the gate and simplify with **distributivity**, the **complement law** $clk\cdot\overline{clk}=0$ and **idempotence** $clk\cdot clk=clk$:

$$clk_g=clk\cdot\big(\overline{clk}\,en+clk\,en_L\big)=\underbrace{clk\,\overline{clk}}_{=0}\,en+clk\,en_L=clk\cdot en_L$$

and during the entire interval in which that expression is not already zero — the high phase — $en_L$ is a *constant*, frozen at the value $en$ held when the clock last fell. The AND is therefore ANDing the clock with a constant, and ANDing with a constant cannot create an edge that the clock did not have. The glitch is not filtered, averaged or attenuated; it is made unobservable by construction, which is the only kind of fix worth having.

**The latch phase must be the complement of the gate's controlling polarity, and the dual case is the reason to remember why rather than what.** A rising-edge design gates with AND and latches on the *low* phase, as drawn. A falling-edge design gates with OR: $clk_g=clk+\overline{en_L}$, which by **De Morgan** is the same circuit read through inverted logic, and its latch must be transparent on the *high* phase. The invariant behind both is one sentence: the latch must be closed for exactly the phase in which the gate passes its enable input, i.e. the phase in which the gate's clock input sits at its non-controlling value. Swap the phase and you get a cell that is opaque precisely when it did not need to be and transparent precisely when it did — one that compiles, simulates, and glitches.

**The cost is a halved timing budget on the enable, and this is the constraint people forget.** $en$ no longer has a full cycle to arrive; it must be stable before the latch closes, which is the *falling* edge. For a nominal 50 % duty cycle the logic producing $en$ must satisfy

$$t_{cq}+t_{logic,en}+t_{setup,L}\ \le\ \tfrac{T_{clk}}{2}-T_{skew}-t_{j}$$

against the ordinary full-cycle inequality in [[Setup and Hold Constraints]]. Enable logic that was comfortable at 300 ps of slack in a full cycle can fail outright once it is gated, and the failure is a setup violation on a path that did not exist in the ungated netlist. Duty cycle is a real parameter here, not an idealisation: a 40 % duty clock leaves $0.4\,T_{clk}$, not half.

**The gated branch is a separate clock for [[Clock Skew and Jitter]] purposes, and a separate problem for test.** The cell inserts its own propagation delay — an AND delay, plus the latch's contribution on the enable path — into the branch, so every flop on $clk_g$ is skewed against every flop on $clk$ by that amount unless clock-tree synthesis balances the ungated path to match. Since skew enters the hold inequality *unsigned by the designer's intent*, an unbalanced gating insertion converts a passing hold path into a failing one at no frequency change; that is the standard way a first clock-gating pass breaks a working design. For scan, every real library cell carries a test-enable input, so what is actually built is $en_{\text{eff}}=en\lor test\_en$ latched, not $en$ latched — without it the gated flops cannot shift during scan and ATPG coverage on that branch collapses to zero.

**Granularity, not existence, is the design decision.** The cell is a handful of gates plus a buffer sized for the branch, and its saving is proportional to the number of flops downstream times their idle fraction. Below roughly eight flops per gate the cell's own area, leakage and skew budget exceed what it saves, which is why synthesis tools expose the decision as a *minimum bit-width* and *maximum fanout* constraint rather than a yes/no switch. The corollary matters more than the number: gating is applied hierarchically — one cell per register bank, then a coarser cell over a whole idle block — because the top-level gates buy the most and cost the least per flop.

**On an FPGA every term in this argument reverses.** Each slice flop has a dedicated `CE` pin, so the enable mux is free — no LUT, no added logic delay — which makes [[Clock Enable Flip-Flop]] the correct answer by default. A gated clock, by contrast, must be routed on a global clock buffer, of which a device has a few dozen in total; the vendor primitive for this is `BUFGCE`, which is a hard clock-enable buffer and *not* a LUT-built version of the cell above. Building the latch out of fabric is strictly worse than not gating: it costs a LUT with combinational feedback, which is a cycle in the timing graph that static timing analysis cannot traverse. See [[FPGAs]] and [[Lookup-Tables]] for the slice structure that makes this true.

> [!important] Write the enable; let synthesis choose the cell
> `if en { q <= d }` is the correct RTL for both targets. A hand-written `assign clk_g = clk & en;` is the classic way to ship a chip that fails at one corner, and a hand-instantiated ICG in FPGA RTL is the classic way to run out of global buffers. The gating decision belongs to a power constraint in the synthesis script, where it can be swept, reported, and reversed.

**Result.**

$$\boxed{\ en_L=\overline{clk}\,en+clk\,en_L,\qquad clk_g=clk\wedge en_L=clk\wedge en(t_{\downarrow}^{-})\ }$$

**When it breaks.**

- **Bare AND, no latch:** any transient on $en$ during the high phase is a clock edge. Invisible in RTL simulation, intermittent in silicon. This is the entire failure the cell exists to prevent.
- **Wrong latch phase:** low-phase latch with an OR gate, or high-phase latch with an AND, gives a cell that is transparent exactly when it must be opaque — and it still passes RTL simulation.
- **Enable derived from the gated clock itself:** once the branch stops, nothing on it can recompute $en$, and the branch never restarts. Enable logic must live on the ungated clock.
- **Synchronous reset behind a gate:** a sync reset reaches a flop only through its clock. Gate the clock and the reset silently does not apply. Asynchronous reset still works; this asymmetry is a standard bug.
- **Duty cycle $\ne$ 50 %:** the enable budget is the low-phase width, not $T_{clk}/2$. Do not size the enable path against half a period on a clock you have not measured.
- **Fewer than ~8 flops per gate:** area, leakage and the skew balancing cost more than the switching energy saved.
- **No test-enable:** the gated flops cannot be scan-shifted, and coverage on the branch goes to zero.
- **Leakage:** gating removes $\alpha C V^2 f$ and nothing else. Static power is untouched — that requires power gating, a different structure with retention and wake-up cost.
- **On an FPGA:** use `CE` or `BUFGCE`. A LUT-built latch is a combinational loop with no timing model.

**RTL (Spade).**

> [!warning] The stub predicted `not-expressible`; that prediction was wrong
> Both halves of the cell *are* expressible. The latch closes with `decl`, exactly as in [[SR Latch]], and Spade does expose the clock as a value — behind `unsafe`. What follows compiles and simulates.

The RTL you should actually write does not mention the cell at all:

```spade
entity enable_reg<#uint W>(clk: clock, en: bool, d: uint<W>) -> uint<W> {
    reg(clk) q initial(0) = if en { d } else { q };
    q
}
```

The cell itself, spelled out, is the drawing transcribed line for line:

```spade
entity icg(clk: clock, en: bool) -> clock {
    decl enl;
    let c   = unsafe { clk.as_bool() };
    let enl = (!c && en) || (c && enl);      // transparent while c = 0
    unsafe { (c && enl).as_clock() }
}

entity gated_reg<#uint W>(clk: clock, en: bool, d: uint<W>) -> uint<W> {
    let gclk = inst icg(clk, en);
    reg(gclk) q initial(0) = d;
    q
}
```

`c` is the $clk$ wire, `enl` is $en_L$, and the returned value is $clk_g$ — all 1 bit, the register $W$ bits, and nothing in the cell scales with $W$. The `let enl = ... || (c && enl)` line is a genuine combinational loop: it lowers to `assign enl = (~c & en) | (c & enl);`, one self-referencing continuous assignment, which is the latch and not a mux. `decl` is what permits the self-reference; `let` bindings are otherwise ordered and cannot refer forward. Synthesis will not build this out of the two gates drawn — it will map the whole thing onto a characterised `CKLNQD`-class library cell with a matched rise/fall AND and a bounded enable setup, because the drawing's timing is only trustworthy when the two are laid out together, which is what the *integrated* in the name means.

Two things Spade is telling you by making this awkward. `clock` is not a `bool`, and converting requires `unsafe` in both directions — the language is refusing to let a clock be computed by accident, which is the right default and exactly the discipline the bare-AND bug violates. And the latch is a combinational loop, which every downstream tool will treat as one; it type-checks, but nothing in the type system encodes that $en$ must be stable before the falling edge.

Simulated with `.zettel/sim.sh` against a behavioural enable-flop reference: **3000 random vectors plus four named cases pass**, with the asymmetric pair $0\text{x}01$ held / $0\text{x}80$ loaded, and an enable glitch injected mid-high-phase on one run in four. `gated_reg8` matches the enable flop on every vector. A third entity built with a bare `clk & en` and no latch was instantiated on the same stimulus and captured a spurious value on the glitch cycle — the bug is reproducible in one line of Verilog, which is why the latch is in the cell.

**Related Notes (with context):**

- [[Clock Enable Flip-Flop]] – compares: the same function built as a D-path mux; free on FPGA, but leaves the clock pin toggling and adds a mux to the critical path.
- [[Transparent D Latch]] – depends-on: supplies the storage element, its characteristic equation, and the transparency window this cell depends on.
- [[Hazards and Glitches]] – depends-on: the transient on $en$ that the latch exists to make unobservable.
- [[Clock Skew and Jitter]] – supports: the gated branch's insertion delay is skew, and skew is what turns a first gating pass into a hold violation.
- [[Setup and Hold Constraints]] – depends-on: the enable's half-cycle setup requirement against the latch's closing edge.
- [[SR Latch]] – compares: the same `decl` combinational loop, one level down, with no clock and no glitch discipline.
- [[Choosing a Storage Element]] – compares: where gating sits against the other ways to make a register hold.
- [[FPGAs]] – counter-example: dedicated `CE` pins and scarce global buffers reverse the entire ASIC argument.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Gated clocks and enable flops* — the enable-flop/gated-clock comparison, the glitch argument, and the $\alpha=1$ clock-net reasoning; §*FPGA mapping* — `CE` pins, `BUFGCE`, and the cost of a LUT-built latch; §*Clock skew and jitter* — the skew model the gated branch joins.
- Weste & Harris, *CMOS VLSI Design*, ch. on power (clock gating, activity factors, the clock-tree power share) and ch. on sequential circuit design (latch and flop structures, transistor counts).
- Wakerly, *Digital Design: Principles and Practices*, sequential-logic chapter — enable behaviour and the hazard treatment behind the glitch argument.
- Mano & Ciletti, *Digital Design* — latch characteristic equations and Shannon expansion as used in the derivation above.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter-level. No copy was consulted for this note; the material is standard and the chapter topics are stable across editions, but the pages are not. The ~8-flops-per-gate crossover and the 20–40 % clock-tree power share are the canonical order-of-magnitude figures every low-power text quotes, not measurements from a characterised library — treat them as ratios to reason with, never as a budget.
