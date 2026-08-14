---
title: "T Flip-Flop"
description: "An XOR in front of a D flop: toggles on command, still the right structure for a counter bit even though no library carries it as a cell."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §JK and T flip-flops, and why they are historical; Mano & Ciletti ch. 5; Wakerly ch. 8; Weste & Harris ch. 10"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, toggle, counter, sequential]
aliases:
  - T Flip-Flop
  - T Flop
  - TFF
  - Toggle Flip-Flop
  - Toggle Cell
  - T-Type Flip-Flop
---

# T Flip-Flop

**One-line summary:** The one flip-flop whose input commands a *change* rather than a value — $Q^{+} = T \oplus Q$ — which is exactly the primitive a binary counter needs and exactly the reason it survives as a structure rather than as a cell.

```tikz title="T flip-flop: an XOR closing Q back onto the D input of an edge-triggered flop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[xor port] (x1) at (2.4,2.0) {};
  \node[flipflop D] (ff) at (6.2,1.6) {};
  \coordinate (bot) at (0.9,-0.5);

  % T input
  \draw (x1.in 1) -- ++(-1.7,0) node[anchor=east] {$T$~[1]};

  % XOR out -> D
  \draw (x1.out) |- (ff.pin 1);
  \node[anchor=south east,font=\footnotesize] at ($(ff.pin 1)+(-0.15,0.05)$) {$D$~[1]};

  % clock
  \draw (ff.pin 3) -- ++(-1.6,0) node[anchor=east] {$clk$};

  % outputs
  \draw (ff.pin 6) -- ++(3.0,0) node[anchor=west] {$Q$~[1]};
  \draw (ff.pin 4) -- ++(1.0,0) node[anchor=west] {$\bar{Q}$~[1]};

  % feedback Q -> XOR second input
  \coordinate (fb) at ($(ff.pin 6)+(2.4,0)$);
  \fill (fb) circle (0.06);
  \draw (fb) |- (bot);
  \draw (bot) |- (x1.in 2);

  \node[anchor=north] at (4.6,-1.1) {$D = T \oplus Q \;\Longrightarrow\; Q^{+} = T \oplus Q$};
\end{circuitikz}
\end{document}
```

*Own construction. The flop is a [[Master-Slave D Flip-Flop]] drawn as a block; the only added hardware is the two-input XOR and the wire that closes $Q$ back onto it.*

**Topic:**

**Read the XOR as a controlled inverter and the characteristic equation writes itself.** Every signal here is 1 bit: $T$, $D$, $Q$, $\bar{Q}$, $clk$. XOR against a constant has two closed forms — **identity** $x \oplus 0 = x$ and **complement** $x \oplus 1 = \bar{x}$ — so $D = T \oplus Q$ evaluates to $Q$ when $T=0$ and to $\bar{Q}$ when $T=1$. The flop copies $D$ to $Q$ at the rising edge, so

$$Q^{+} = T \oplus Q, \qquad D = T \oplus Q$$

and the two equations are the *same* equation, which is the whole content of the circuit: a T flop is a D flop whose next-state function has been moved from the outside of the boundary to the inside. Nothing new is stored. There is no second bistable, no new race, no new timing parameter — everything in [[Setup and Hold Constraints]] applies unchanged, because the storage element is unchanged.

**Inverting the characteristic equation gives the excitation equation, and unlike JK it has no don't-cares.** Ask the opposite question — given a desired transition $Q \to Q^{+}$, what must $T$ be? XOR is its own inverse ($a \oplus b = c \iff a \oplus c = b$, since $\oplus$ is associative and self-cancelling, $x \oplus x = 0$), so

$$T = Q \oplus Q^{+}$$

Every one of the four transitions has exactly one legal $T$: $0\!\to\!0$ and $1\!\to\!1$ need $T=0$, $0\!\to\!1$ and $1\!\to\!0$ need $T=1$. This is the sharpest contrast with [[JK Flip-Flop]], whose excitation table has a don't-care in half its entries and whose whole 1970s justification was that those free literals shrink a Karnaugh map. T buys the opposite property: **its excitation function is a total function of the transition, not of the state**, so you can write "flip this bit" without knowing what the bit currently holds. That is the property a counter needs.

**The toggle condition of a counter bit is the carry into that bit, which is why counters are T flops.** Incrementing an $N$-bit unsigned $Q$ flips bit $i$ exactly when every bit below it is $1$ — the carry out of the low block. Writing $m$ for the toggle mask, $Q + 1 \equiv Q \oplus m \pmod{2^N}$ with

$$m_i \;=\; \bigwedge_{j<i} Q_j, \qquad m_0 = 1$$

so a counter is $N$ T flops driven by an AND chain, and with an enable, $T_i = en \wedge \bigwedge_{j<i} Q_j$. The AND chain *is* a ripple carry chain specialised to the constant addend $1$: all the propagate terms are $p_i = Q_i$ and all the generate terms vanish, which is why counter carry logic is cheaper than a general adder even though it has the same $O(N)$ depth. [[Synchronous Counters]] spends gates to distribute that chain to all bits from one clock edge; [[Asynchronous Counters]] deletes the chain entirely by tying $T_i=1$ and using bit $i-1$'s output as bit $i$'s *clock*, trading area for a ripple delay that grows with $N$ and for a per-bit clock that no static timing tool can constrain.

**With $T$ tied high the circuit is a frequency divider, and that is a second, unrelated use.** $T=1$ forces $Q^{+}=\bar{Q}$, so $Q$ has period $2T_{clk}$: exactly one $\div 2$, with a 50 % duty cycle regardless of the incoming duty cycle, because the output transitions only on one clock edge. It is the cheapest possible clock divider and the reason a "toggle flop" appears in clocking sections that have nothing to do with counting — though its output is a *derived clock*, not a gated one, and a design that needs the original edge back must use an [[Integrated Clock-Gating Cell]] instead of dividing.

**The XOR sits inside a single-cycle timing loop, so a T flop is strictly slower than the flop it is built from.** The path $Q \to \text{XOR} \to D$ launches and captures on the same flop, so the setup constraint of [[Setup and Hold Constraints]] closes on itself with zero skew ($t_{skew}=0$, the launch and capture clock pins are the same pin):

$$T_{clk} \;\ge\; t_{cq} + t_{XOR} + t_{setup}$$

There is no logic-depth budget left to spend elsewhere in that loop, and for a counter the XOR term is replaced by the far worse $t_{AND\text{-}chain}$ of the mask above. Note also what the loop is *not*: it passes through a clocked register, so it is a legal, cuttable timing arc, unlike the combinational loop of an [[SR Latch]] that static timing analysis cannot traverse at all. The self-reference in $Q^{+} = f(Q)$ is only dangerous when it closes without a register in it.

**ASIC and FPGA disagree about what the XOR costs, and the disagreement is total.** In a standard-cell library the XOR2 is a real gate — roughly 8–12 transistors static CMOS, a genuine $t_{XOR}$ in the loop above, and the reason a hypothetical hard T cell would need a second characterised data pin and would add load near the clock. On an FPGA the XOR is free: every flip-flop in a slice already has a LUT in front of it, and a spare LUT input absorbs $T$ into logic that was going to be paid for anyway, so `q <= q xor t` and `q <= d` occupy the identical slice. This is the same asymmetry that runs through all of [[FPGAs]] — a small amount of logic in front of a register is not a cost there, it is the shape the fabric already has.

> [!note] T survives as a pattern, not as a cell
> Both T and JK reduce to a D flop plus combinational logic ($D = T \oplus Q$, $D = J\bar{Q} + \bar{K}Q$), so in any standard-cell or LUT library they cost *strictly more* than the D flop the synthesiser would have inferred anyway. Modern libraries carry D flops with asynchronous reset, synchronous reset and clock enable, and no T cell at all. Instantiating a `TFF` primitive in new RTL is a code smell; writing an XOR in front of a register — the toggle *structure* — is correct and standard.

**T is JK restricted to the diagonal, which settles the historical relationship.** Substituting $J = K = T$ into $Q^{+}_{JK} = J\bar{Q} + \bar{K}Q$ gives $T\bar{Q} + \bar{T}Q$, which is the **sum-of-products expansion of XOR** — so $Q^{+} = T \oplus Q$, and every T flop is a JK flop with its inputs tied together. The converse is false: JK has two degrees of freedom (hold, set, reset, toggle) and T has one, so the reduction only runs in this direction. Both are historical as *cells* for the same reason and both remain worth reading, because excitation tables in older references and exam problems are stated in them.

**Result.**

$$\boxed{\ Q^{+} = T \oplus Q,\qquad D = T \oplus Q,\qquad T = Q \oplus Q^{+};\qquad Q+1 \equiv Q \oplus m,\ \ m_i = \textstyle\bigwedge_{j<i} Q_j\ }$$

**When it breaks.**

- **There is no load path.** $T$ can only complement or hold; it cannot write a value. Any counter that must be preset, or any register that must accept new data, needs a mux in front of the flop — i.e. a [[Clock Enable Flip-Flop]] or a plain D flop — and at that point the XOR is a strict subset of the logic you already have.
- **Without a reset the initial state is unknown**, and unlike a D flop you cannot drive it to a known value from the data input in one cycle; you can only complement whatever came out of power-up. A T flop without a reset pin is unusable as a counter bit. On an FPGA the `initial` value covers this; on an ASIC it does not.
- **The $T$ input must be glitch-free by the setup deadline** and, in a ripple ([[Asynchronous Counters]]) arrangement where a flop output is used as a clock, glitch-free at *all* times — a single spurious edge is an uncorrectable miscount, not a transient.
- **The width at which the structure stops paying:** the toggle mask's AND chain is $O(N)$ deep, so above roughly 16–32 bits the counter's own carry logic, not the flop, sets $f_{max}$, and the answer becomes a prescaler, a carry-select split, or an LFSR when only the *sequence* and not the *value* matters — see [[Counters]].
- **As a clock divider its output is a clock**, with all that implies: it needs its own timing constraint, it inherits and adds to [[Clock Skew and Jitter]], and it must not be routed on general fabric.

**RTL (Spade).**

```spade
entity tff(clk: clock, rst: bool, t: bool) -> bool {
    reg(clk) q reset(rst: false) = q ^^ t;
    q
}

entity tff_bank<#uint N>(clk: clock, rst: bool, t: uint<N>) -> uint<N> {
    reg(clk) q reset(rst: 0) = q ^ t;
    q
}
```

`t` is the diagram's $T$ and `q` its $Q$, both 1 bit; `q ^^ t` is the XOR gate and `reg(clk)` is the flop, so the whole drawing is one line and the feedback is the register's legal self-reference (`= q ^^ t`), not a `decl` loop — contrast [[SR Latch]], where the same visual feedback has no register in it and must be forward-declared. `^^` is the bool XOR: `^` is bitwise and is not defined on `bool`, which is why the $N$-bit `tff_bank` — literally $N$ T flops sharing a clock, the register file a counter toggles — uses `^` instead. Width is preserved throughout: XOR is the one arithmetic-adjacent operator that does *not* grow, so no `trunc` appears anywhere. Synthesis will not build the drawing literally: it recognises the XOR-plus-register pattern and maps it to a D flop with the XOR in the preceding LUT (FPGA) or as a discrete XOR2 in the setup path (ASIC), and Spade's `reset()` lowers to a **synchronous** reset, so the reset itself is one more term in that same combinational path rather than a free async pin.

**Related Notes (with context):**

- [[Master-Slave D Flip-Flop]] – depends-on: supplies the entire storage element; the T flop adds one XOR and no new state, timing parameter, or failure mode.
- [[JK Flip-Flop]] – compares: T is JK with $J=K$ tied; JK's don't-care-rich excitation table is the property T deliberately gives up.
- [[Synchronous Counters]] – extends: instantiates this cell $N$ times and builds the AND chain that computes each bit's toggle mask from one clock edge.
- [[Asynchronous Counters]] – counter-example: deletes the mask logic by tying $T=1$ and clocking each stage from the previous output, which is cheaper and untimeable.
- [[Clock Enable Flip-Flop]] – compares: the other one-bit-of-control flop; enable holds a *value*, $T$ holds or inverts it, and only the enable version can load.
- [[Setup and Hold Constraints]] – depends-on: the $Q \to \text{XOR} \to D$ self-loop is a zero-skew single-cycle path, which is what caps a T flop's toggle rate.
- [[Integrated Clock-Gating Cell]] – compares: the correct way to stop a clock, versus dividing it, which is what a $T=1$ flop actually does.
- [[SR Latch]] – compares: the same picture with feedback that does *not* pass through a register, hence a combinational loop STA cannot cut.
- [[Choosing a Storage Element]] – compares: where this sits against every sibling in the folder.
- [[Counters]] – supports: the topic where the toggle structure, and not the T cell, is the standard building block.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*JK and T flip-flops, and why they are historical* — the characteristic equations $Q^{+}_{JK}=J\bar{Q}+\bar{K}Q$ and $Q^{+}_{T}=T\oplus Q$, the reduction of both to a D flop plus logic, the don't-care argument for JK's historical advantage, and the conclusion that the toggle structure survives while the cell does not.
- `2.8) Counters` — the toggle-mask/carry-chain correspondence used above.
- Mano & Ciletti, *Digital Design*, ch. 5 — characteristic and excitation tables for D, T and JK.
- Wakerly, *Digital Design: Principles and Practices*, ch. 8 — binary counters from T flops, synchronous serial versus parallel enable chains, ripple counters.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — sequential cell composition and why libraries carry D flops with reset/enable rather than T or JK cells.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter-level. No copy was consulted for this note — the material is standard canon and the chapter numbering is stable across editions, but the page numbers are not given because they were not read.
