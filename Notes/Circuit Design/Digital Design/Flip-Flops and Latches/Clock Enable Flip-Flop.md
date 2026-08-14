---
title: "Clock Enable Flip-Flop"
description: "A 2:1 mux in the D path to hold a value: timing-safe and free on an FPGA's dedicated CE pin, but on an ASIC it taxes the critical path every cycle and saves no clock power."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §Gated clocks and enable flops, §FPGA mapping; Weste & Harris ch. 10; Wakerly ch. 8"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, enable, clock-gating, fpga, power]
aliases:
  - "Enable Flip-Flop"
  - "Clock Enable Flip-Flop"
  - "CE Flip-Flop"
  - "Enable Register"
  - "Load-Enable Register"
---

# Clock Enable Flip-Flop

**One-line summary:** An edge-triggered flop whose next-state function is multiplexed between the new data and its own output, so it holds a value without ever touching the clock — the one hold mechanism that introduces no new clock domain and no new timing exception.

```tikz title="Clock enable flip-flop: a 2:1 mux selects between new data and the flop's own output, clock free-running"
\usepackage{circuitikz}
\usetikzlibrary{calc}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ---- edge-triggered flip-flop (the storage element, unchanged) --------
  \node[flipflop D] (ff) at (6.2,0) {};
  \coordinate (m) at ($(ff.pin 1) + (-1.8,0)$);   % mux output node

  % ---- 2:1 mux in the D path -------------------------------------------
  \draw[thick] ($(m)+(-0.75,-1.15)$) -- ($(m)+(-0.75,1.15)$)
            -- ($(m)+(0,0.65)$)  -- ($(m)+(0,-0.65)$) -- cycle;
  \node[font=\tiny] at ($(m)+(-0.38,0)$) {mux};
  \node[font=\tiny,anchor=west] at ($(m)+(-0.72,0.72)$) {1};
  \node[font=\tiny,anchor=west] at ($(m)+(-0.72,-0.72)$) {0};

  % data in and select
  \draw ($(m)+(-3.6,0.72)$) node[anchor=east] {$D$~[$W$]} -- ($(m)+(-0.75,0.72)$);
  \draw ($(m)+(-0.38,-2.2)$) node[anchor=north] {$en$~[1]} -- ($(m)+(-0.38,-1.0)$);

  % mux output -> flop D
  \draw (m) -- (ff.pin 1) node[midway,above,font=\small] {$D'$~[$W$]};

  % clock: free-running, routed clear of the enable
  \draw (ff.pin 3) -- ++(-0.8,0) -- ++(0,-1.6) -- ++(-2.6,0)
        node[anchor=east] {$clk$~[1]};

  % ---- output and hold path --------------------------------------------
  \draw (ff.pin 6) -- ($(ff.pin 6)+(2.4,0)$) node[anchor=west] {$Q$~[$W$]};
  \draw (ff.pin 4) -- ++(0.5,0) node[anchor=west,font=\tiny] {$\overline{Q}$};
  \coordinate (tap) at ($(ff.pin 6)+(1.7,0)$);
  \fill (tap) circle (0.055);
  \draw (tap) -- ($(tap)+(0,-4.0)$) -- ($(m)+(-3.0,-4.0)$)
             -- ($(m)+(-3.0,-0.72)$) -- ($(m)+(-0.75,-0.72)$);
  \node[font=\small,anchor=north] at ($(m)+(1.4,-4.08)$)
    {hold path: $Q$ is rewritten into itself every cycle};

  % ---- annotation -------------------------------------------------------
  \node[anchor=north west,align=left] at ($(m)+(-3.6,-4.9)$)
    {$D' = (en \wedge D)\vee(\overline{en}\wedge Q)$ \;---\; the clock never stops,
     so no clock power is saved.\\
     ASIC: one mux delay added to every path into this flop.\quad
     FPGA: this mux \emph{is} the slice flop's \texttt{CE} pin --- 0 LUTs, 0 added delay.};
\end{circuitikz}
\end{document}
```

*Own construction. Drawn for $W$ bits: one flop and one mux per bit, with the single-bit $en$ fanned out to all $W$ mux instances.*

**Topic:**

**Start from the fact that a flop has no hold input.** A [[Master-Slave D Flip-Flop]] samples $D$ on every active edge, unconditionally — that unconditionality is the entire reason it has a checkable timing model. So "make this register keep its value" cannot be expressed by asking the flop to do less; it must be expressed either by changing *what it samples* or by removing *the edge*. Those two answers are the enable flop and the [[Integrated Clock-Gating Cell]], and they differ in nothing at the register-transfer level and in almost everything below it. The enable flop takes the first road: leave the clock alone, and make the sampled value equal to the stored value on the cycles where nothing should change.

**Derive the D-path function as a Shannon expansion about the enable.** The required behaviour is $Q^{+}=D$ when $en=1$ and $Q^{+}=Q$ when $en=0$. Expanding the unknown next-state function about $en$ by **Shannon's expansion theorem**, $f = en\cdot f_{en=1} + \overline{en}\cdot f_{en=0}$, and substituting the two cofactors directly gives

$$D' \;=\; (en \wedge D)\;\vee\;(\overline{en} \wedge Q)$$

which is, term for term, the definition of a 2:1 multiplexer — see [[Multiplexers]]. The derivation is that short because the specification *is* already a cofactor pair; there is no minimisation step and nothing to be clever about. Widths: $D$, $D'$ and $Q$ are $W$ bits, $en$ is exactly 1 bit, and the circuit is $W$ independent copies of a 1-bit mux driven by a common $en$ — the enable is a control signal with fanout $W$, not a bus. Note also that $D'$ depends on $Q$, so the datapath now contains a combinational path from the flop's output back to its own input; the loop is *not* combinational feedback, because the flop breaks it, but it is a new timing arc and the two paragraphs below are about what that arc costs.

**The setup cost is paid on every cycle, including the ones you care about.** The mux sits in series with the logic feeding the flop, so the single-cycle setup constraint of [[Setup and Hold Constraints]] gains a term:

$$t_{cq} + t_{logic,max} + t_{mux} + t_{setup} \;\le\; T - T_{skew}$$

The asymmetry that makes this expensive is that $t_{mux}$ is unconditional. On the cycles where $en=0$ — the cycles the enable exists to optimise — the circuit is idle and the delay is irrelevant; on the cycles where $en=1$ the mux is pure overhead added to a path that was already the reason for the clock period. A design that enables a register 5 % of the time still pays $t_{mux}$ 100 % of the time. On a deep pipeline where every stage is enable-controlled, that is one mux delay per stage across the whole machine, which is why a synthesis flow under a tight timing constraint will move enables into the gating cell and a flow under a loose one will not.

**The hold direction, by contrast, is free, and the reason is that the skew term vanishes.** The new arc runs $Q \to \text{mux} \to D'$ on the *same* flop, so both endpoints share one clock pin and $T_{skew}=0$ identically. The hold check is then $t_{cq,min} + t_{mux,min} \ge t_{hold}$, and since $t_{cq,min}$ alone satisfies hold on a legal flop-to-flop path with zero skew, adding a mux only increases the margin. This is the structural reason the enable flop is described as "timing-safe": it can make a design fail setup, which a static timing analyser will tell you about at every corner, and it cannot introduce the class of failure that survives simulation.

**What it saves is datapath activity, not clock power.** Dynamic power is $P \propto \alpha C V^2 f$, and the enable reduces $\alpha$ only on the nodes downstream of $Q$: with $Q$ held constant, the entire combinational cone it feeds stops toggling, and for a wide register feeding a wide operator that is a large capacitance switched to zero. The clock net is untouched. The flop's internal clock inverters — typically the four clocked transistors of the master–slave structure — toggle twice per period regardless, and the clock tree, the highest-activity node in the design at $\alpha = 1$ by definition, delivers every edge. Worse, the mux itself is new capacitance that toggles whenever $D$ or $Q$ changes. Enabling a register therefore *reduces* total power in a design dominated by datapath switching and can *increase* it in one dominated by clock power, which is exactly the regime the [[Integrated Clock-Gating Cell]] exists for.

**The enable is itself a timing endpoint, and this is where the two mechanisms diverge sharply.** For the enable flop, $en$ must satisfy ordinary setup and hold at the mux's select input — one more data path with one more inequality, checkable by the same tool with the same model, and wrong values of $en$ produce wrong data, never wrong clocking. For the gating cell, $en$ must be stable across the transparency window of the gating latch, and a violation produces a spurious or truncated clock edge: a *functional* failure of the storage element rather than a data error. That is the substance of "timing-safe". A glitch on the enable of a CE flop selects the wrong operand for one cycle; a glitch on the enable of a bare AND-gated clock destroys state.

> [!note] Write the enable, let the tool choose
> RTL should say `if (en) { q <= d; }` and let synthesis pick between the mux and the gating cell under a power constraint, because the choice depends on the extracted clock-tree capacitance and the final timing slack — neither of which exists when the RTL is written. Hand-instantiating `assign clk_g = clk & en;` is the classic way to ship a chip that fails at one corner.

**On an FPGA the mux is not built at all, and the trade-off inverts.** Every slice flop carries a dedicated clock-enable pin, so the enable costs no LUT and adds no logic delay — the mux exists inside the hard flop, on a path the vendor characterised. Meanwhile the gated clock, cheap on an ASIC, becomes expensive: a gated clock must be driven onto a global clock buffer resource, of which a device has a few dozen, and it creates a clock domain that the tool must model separately. Prefer `CE`; reach for `BUFGCE` only when the power measurement demands it. See [[Lookup-Tables]] and [[FPGAs]] for the slice structure this rests on.

**The FPGA cost that does exist is packing, not logic.** The flops in a slice share their control inputs — one clock, one clock enable, one set/reset per group — so two registers whose enables are different expressions cannot occupy the same group of flops regardless of how much room is left. A design that generates a distinct enable term per register therefore fragments placement, inflates routing, and degrades timing, with a utilisation report that still shows plenty of free flops. The cure is to *share* enable signals deliberately, which is the opposite of the instinct that produced them.

> [!warning] Slice geometry is vendor- and family-specific
> The number of flops sharing one control set, and whether the set includes the reset, differs between vendors and between families of one vendor. The qualitative constraint — control sets are shared and fragment packing — is universal; the counts are not. Read the device's configurable-logic-block user guide before budgeting.

**Reset must outrank enable, and the hard primitive enforces it.** The natural coding is `if (rst) { q <= 0 } else if (en) { q <= d }`, giving reset strict priority. This is not stylistic: the FPGA flop primitive has a fixed internal priority in which set/reset dominates clock enable, so RTL that intends the other order ($en$ dominating $rst$) cannot map to the primitive and synthesis must build the difference out of a LUT in the D path — reintroducing exactly the logic delay the `CE` pin was supposed to eliminate. Writing the priority the hardware already has is free; writing the other one is not.

**Result.**

$$\boxed{\ Q^{+} = (en \wedge D)\vee(\overline{en}\wedge Q)\ \ \text{with}\ \ clk\ \text{free-running};\quad \Delta t_{setup\text{-}path} = t_{mux},\ \ \Delta P_{clk} = 0\ }$$

**When it breaks.**

- **Clock power dominates.** The enable flop saves none of it. Once the clock tree plus the flops' internal clock loads outweigh the datapath cone being idled — wide, deeply banked, rarely-written register files are the standard case — the [[Integrated Clock-Gating Cell]] is the only mechanism that helps.
- **The D path is already critical.** Adding $t_{mux}$ to a path with no slack costs a cycle of period on the whole design. At that point the enable belongs in the clock, or one pipeline stage earlier.
- **Very high enable fanout.** $en$ drives $W$ mux selects; for large $W$ it needs its own buffer tree, and that tree's delay lands in the setup equation for $en$ itself.
- **FPGA, many distinct enable expressions.** Control-set fragmentation degrades placement long before flop utilisation does. Share enables, or accept the packing loss knowingly.
- **Priority inverted.** Any coding where the enable dominates the reset falls off the hard primitive and lands back in the fabric.
- **`en` unknown at reset.** The mux gives the register no defined value unless a reset drives it; unlike a gated clock, a de-asserted enable does not mean "unwritten", it means "rewritten with the old, possibly `X`, value" — and that `X` is then self-sustaining in simulation forever.

**RTL (Spade).**

```spade
/// Clock-enable register: a 2:1 mux in the D path, D' = en ? d : q.
entity ce_reg<#uint W>(clk: clock, rst: bool, en: bool, d: uint<W>) -> uint<W> {
    reg(clk) q reset(rst: 0) = if en { d } else { q };
    q
}
```

The `if en { d } else { q }` expression *is* the mux of the drawing: `d` is the upper input, the self-reference `q` is the hold path drawn looping back from the output, and `en` is the select. Widths are exact — the register, both mux inputs and the output are all `uint<W>`, with no widening operator anywhere, so nothing needs `trunc`. Only `reg(clk)` is registered; everything else is the combinational D path, and `clk` appears solely as the register's clock and is never an operand, which is the whole point of the circuit. Synthesis will not build this as a discrete mux followed by a flop: on an ASIC it maps to a library `DFFE` cell whose select is inside the cell, and on an FPGA the mux disappears entirely into the slice flop's `CE` pin, so the drawn gate has no counterpart in the netlist even though the function is identical. Note also that `reset` takes priority over `en` here by construction of the `reg` statement, matching the hard primitive.

Verified with `spade 0.19.0` (clean on the first compile) and simulated through `.zettel/sim.sh` against a behavioural reference `q <= rst ? 0 : (en ? d : q)`: **3009 vectors, 0 failures** — 9 named vectors plus a 3000-vector random sweep over `(rst, en, d)`. The named set is deliberately asymmetric: loading `0x01`, holding while `d = 0x80`, then loading `0x80` and holding while `d = 0x01`. A symmetric pattern such as `0xFF`/`0x00` passes even if the enable polarity is inverted or the bus is reversed; this one does not.

**Related Notes (with context):**

- [[Master-Slave D Flip-Flop]] – depends-on: supplies the unconditional edge-triggered element this circuit wraps, and the $t_{cq}$/$t_{setup}$ parameters the mux delay is added to.
- [[Integrated Clock-Gating Cell]] – compares: the other answer to the same requirement — saves the clock power this one cannot, at the cost of a new clock domain and a latch-window constraint on $en$.
- [[Multiplexers]] – depends-on: the D-path function is a 2:1 mux, and the Shannon expansion about $en$ is what makes it one.
- [[Lookup-Tables]] – counter-example: on an FPGA the mux costs nothing precisely because it is *not* built from LUTs — it is the slice flop's dedicated `CE` pin.
- [[Setup and Hold Constraints]] – supports: the inequality $t_{mux}$ is added to, and the zero-skew argument that makes the hold direction free.
- [[Clock Skew and Jitter]] – supports: $T_{skew}=0$ on the $Q\to D'$ self-arc because both endpoints share one clock pin — the reason the new path cannot cause a hold failure.
- [[Transparent D Latch]] – compares: the same $Q^{+}=$ mux-of-$(D,Q)$ equation, but with the *clock* as the select, which is what makes the latch transparent and this circuit not.
- [[Choosing a Storage Element]] – compares: where the enable flop sits against every sibling in this folder.
- [[Counters]] – supports: the canonical consumer, where the enable is the count-enable and the held value is the state itself.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Gated clocks and enable flops* — the enable-flop versus gated-clock comparison, $D' = en\cdot D + \overline{en}\cdot Q$, and the "write the enable, let the tool choose" rule.
- `0.3) Introduction to Flip-Flops & Latches`, §*FPGA mapping* — dedicated `CE` pin, global-buffer scarcity, `BUFGCE`.
- Weste & Harris, *CMOS VLSI Design*, ch. on sequential circuit design — enabled-flop cell structure, clocked-transistor counts, and the clock-power argument.
- Wakerly, *Digital Design: Principles and Practices*, sequential-logic chapter — the load-enable register as a mux-plus-register, and the reset/enable priority convention.
- Mano & Ciletti, *Digital Design*, ch. on registers and counters — register with parallel load.

> [!warning] Printed page numbers not verified
> This note has no book source. The three textbook citations are chapter-level; no copy was consulted and no page numbers are claimed. The material is standard and the chapter placement is stable across editions, but treat every unnumbered structural claim (clocked-transistor counts, cell names) as canon rather than as characterised data from a specific library.
