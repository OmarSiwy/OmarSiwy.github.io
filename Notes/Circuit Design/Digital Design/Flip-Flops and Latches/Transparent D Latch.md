---
title: Transparent D Latch
description: "Tie R to the complement of S and the forbidden state vanishes: a 2:1 mux whose select is the clock and whose feedback leg is the hold path, 8-12 transistors, transparent for a whole phase."
kind: circuit
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches]
aliases:
  - "Level-Sensitive D Latch"
---

# Transparent D Latch

A one-bit storage element that is a plain wire from $D$ to $Q$ for the entire half-period in which its clock is asserted, and a closed feedback loop for the other half — the only common sequential primitive with no hard sampling instant.

```tikz title="Transparent D latch as a 2:1 multiplexer closed through its own output, with the transparent and opaque phases in time"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ---- 2:1 mux with the hold leg closed through its own output ----
  \draw[thick] (3,0) -- (3,2.4) -- (4.4,1.8) -- (4.4,0.6) -- cycle;
  \node[font=\footnotesize] at (3.7,1.2) {$2{:}1$};
  \node[font=\scriptsize,anchor=west] at (3.05,1.8) {1};
  \node[font=\scriptsize,anchor=west] at (3.05,0.6) {0};
  % D input
  \draw[->,thick] (0.6,1.8) -- (3,1.8);
  \node[anchor=south] at (1.6,1.85) {$D$~[1]};
  % select
  \draw[->,thick] (3.7,3.3) -- (3.7,2.1);
  \node[anchor=west] at (3.85,3.0) {$clk$~[1]};
  % output
  \draw[->,thick] (4.4,1.2) -- (7.4,1.2);
  \node[anchor=south] at (6.6,1.25) {$Q$~[1]};
  \fill (5.6,1.2) circle (0.07);
  % hold leg
  \draw[thick] (5.6,1.2) -- (5.6,-0.9) -- (2.1,-0.9) -- (2.1,0.6);
  \draw[->,thick] (2.1,0.6) -- (3,0.6);
  \node[anchor=north,font=\footnotesize] at (3.85,-0.95) {hold leg (combinational feedback)};

  % ---- what transparency looks like in time ----
  \begin{scope}[yshift=-5.4cm,xshift=0.4cm]
    \fill[gray!15] (0.5,-0.45) rectangle (2.5,2.95);
    \fill[gray!15] (4.5,-0.45) rectangle (6.5,2.95);
    \node[font=\scriptsize,anchor=south] at (1.5,2.95) {transparent};
    \node[font=\scriptsize,anchor=south] at (5.5,2.95) {transparent};
    \node[font=\scriptsize,anchor=south] at (3.5,2.95) {opaque};
    \draw[thick] (0,2.2)--(0.5,2.2)--(0.5,2.8)--(2.5,2.8)--(2.5,2.2)--(4.5,2.2)
                 --(4.5,2.8)--(6.5,2.8)--(6.5,2.2)--(7.6,2.2);
    \draw[thick] (0,1.1)--(1.5,1.1)--(1.5,1.7)--(3.5,1.7)--(3.5,1.1)--(5.5,1.1)
                 --(5.5,1.7)--(7.6,1.7);
    \draw[thick] (0,0)--(1.5,0)--(1.5,0.6)--(4.5,0.6)--(4.5,0)--(5.5,0)
                 --(5.5,0.6)--(7.6,0.6);
    \node[anchor=east] at (-0.1,2.5) {$clk$~[1]};
    \node[anchor=east] at (-0.1,1.4) {$D$~[1]};
    \node[anchor=east] at (-0.1,0.3) {$Q$~[1]};
    \draw[dashed,gray] (3.5,1.1) -- (3.5,-0.8);
    \draw[dashed,gray] (4.5,0.6) -- (4.5,-1.5);
    \node[font=\scriptsize,anchor=east] at (3.4,-1.0) {$D$ falls while opaque: ignored};
    \node[font=\scriptsize,anchor=west] at (4.6,-1.7) {phase opens: $Q$ jumps to the \emph{present} $D$};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Delete the forbidden state instead of forbidding it.** The [[SR Latch]] has characteristic equation $Q^{+} = S + \bar{R}\,Q$ and one input code, $S=R=1$, that breaks the complementarity $\bar{Q} = \overline{Q}$ and leaves the release $S,R:1\!\to\!0$ as a race between two gate delays. Rather than documenting that code as illegal and trusting every caller, make it unreachable: substitute $R = \bar{S}$, rename $S$ to $D$, and the two-input alphabet collapses to one bit. By **complement and idempotence**, $\bar{R} = \bar{\bar{D}} = D$, so

$$Q^{+} \;=\; D + D\,Q \;=\; D$$

by **absorption** $x + xy = x$. One input, one bit stored, no invalid code — but also no hold: the loop now tracks $D$ forever, which is a buffer, not a memory.

**Gate the write and the equation becomes a multiplexer.** Hold has to be reintroduced from outside, by a signal that says when the write is allowed. Take the **Shannon expansion** of the next-state function about $clk$ — $f = clk\cdot f|_{clk=1} + \overline{clk}\cdot f|_{clk=0}$, an identity for any Boolean $f$ (see [[Boolean Algebra]]) — and choose the two cofactors to be "write" and "hold":

$$Q^{+} \;=\; clk\cdot D \;+\; \overline{clk}\cdot Q$$

That expression *is* the 2:1 multiplexer identity $\mathrm{mux}(s,a,b) = s\,a + \bar{s}\,b$ with $s = clk$, $a = D$, $b = Q$. The latch is a mux whose select is the clock and whose $0$-leg is wired to its own output. All three signals are 1 bit wide; an $N$-bit latch is $N$ independent copies sharing one $clk$ net, with no interaction between bit slices — there is no carry, no width growth, nothing to round (see [[Number Formats]] for why exact storage has no ulp).

**Both phases fall out of the same equation by substitution.** With $clk=1$ the identity $x\cdot 1 = x$ and $x\cdot 0 = 0$ give $Q^{+} = D$: the latch is **transparent**, and $Q$ follows $D$ after a plain combinational delay $t_{dq}$, the mux's data-to-output propagation. With $clk=0$ they give $Q^{+} = Q$: the latch is **opaque**, the feedback leg is selected, and the loop of the [[Cross-Coupled Inverter Bistable]] closes and regenerates. Nothing in the equation names an *instant*; the write window is a whole phase, which is what "level-sensitive" means and what distinguishes this from every edge-triggered sibling.

**The physical circuit is the mux drawn with pass transistors.** In static CMOS the standard implementation is two transmission gates — one passing $D$, one passing the loop — driven by $clk$ and $\overline{clk}$, plus two inverters forming the storage core, roughly 8–12 transistors and only **2 clocked transistors** of load on the clock net per bit. The transmission-gate mux is the natural choice here rather than a static-gate mux because the feedback leg wants to be a switch in a loop, not a driven gate output; the sizing and stage-count caveats are in [[Transmission-Gate Multiplexer]]. Compare the [[Master-Slave D Flip-Flop]] at 20–26 transistors and 4 clocked transistors — twice the clock power per bit, for a hard edge.

> [!warning] Transistor counts here are canonical order-of-magnitude figures, not characterized data
> This note has no book source. 8–12 transistors is the value every VLSI text quotes for a static transmission-gate latch; real cells vary by roughly 2× across families (static vs. dynamic, single- vs. dual-rail, low- vs. high-$V_t$). Use them for ratios against the flop, never for an area or power budget.

**On an FPGA the cost structure inverts.** There is no latch primitive in the fabric. A latch must be built as a [[Lookup-Tables|LUT]] configured with $Q^{+} = clk\,D + \overline{clk}\,Q$ and its own output routed back to one of its inputs, which burns a LUT *and* creates a combinational cycle that static timing analysis must be told to break with a special-case constraint — while the dedicated flop sitting next to that same LUT would have been free. This is why vendor tools warn on inferred latches, and the inference is almost never intentional: an incomplete `if` or `case` in [[Combinational Logic]] leaves some input combination with no assignment, and "keep the previous value" is exactly the $\overline{clk}\cdot Q$ term above.

**Transparency is simultaneously the feature and the hazard.** Because the input is electrically connected to the output for the whole asserted phase, data that arrives *late* into a transparent latch still passes straight through — slack unused by one stage flows forward into the next, which is time borrowing and is the entire reason latches survive in high-performance design ([[Dual-Phase Latches]]). The same connection means the hold requirement is not a few picoseconds around an edge but the full phase width $T_{phase}$:

$$t_{cq,min} + t_{logic,min} \;\ge\; t_{hold} + T_{skew} + T_{phase}$$

against the flop's $t_{cq,min} + t_{logic,min} \ge t_{hold} + T_{skew}$ ([[Setup and Hold Constraints]]). $T_{phase}$ is on the order of half a clock period, so the minimum-delay requirement is three orders of magnitude larger than a flop's and slowing the clock makes it *worse*, not better.

**One latch cannot close a sequential loop.** Wire `latch → logic → latch` with a single phase and, while $clk=1$, the whole ring is transparent: it is a combinational cycle that either oscillates or settles into a fixed point of the logic, and neither is a state machine. A usable sequential element needs an interval in which *nothing* on the loop is transparent — which is why the useful structures are always two latches on opposite phases, either fused into a flop or kept explicit as a two-phase pipeline.

$$\boxed{\ Q^{+} \;=\; clk\cdot D \;+\; \overline{clk}\cdot Q\ }$$

**When it breaks.**

- **Both cofactors asserted at once.** If $clk$ and $\overline{clk}$ overlap — a locally inverted clock has a window of width $t_{inv}$ where both are high — both transmission gates conduct and the write path fights the hold path. The node is briefly driven by a contention divider, not a logic level.
- **Glitches on $clk$.** Because the write window is a level, any spur on the clock is a write. A latch has no edge to be robust about; this is precisely why an [[Integrated Clock-Gating Cell]] puts the latch *before* the AND rather than trusting a clean enable.
- **The hold inequality has no $T_{clk}$ in it.** $T_{phase}$ scales with the period, so lowering the frequency raises the right-hand side. There is no frequency at which a latch-based hold violation goes away; only buffering the short path fixes it.
- **Tool support.** Loop-breaking constraints, borrow limits, and latch-aware STA are patchily supported and vendor-specific. Below the frequency where borrowing pays, the flop wins on engineering time alone — see [[Choosing a Storage Element]].
- **Never as an accident.** An inferred latch is this circuit built by a synthesizer that guessed at your intent from an unassigned branch. It is almost always a bug, and on an FPGA an expensive one.

**RTL (Spade).**

`let` bindings are ordered, so the equation written straight down refers to a name that does not exist yet:

```
error: Use of undeclared name q
  ┌─ latch.spade:2:32
  │
2 │     let q = if en { d } else { q };
  │                                ^ Undeclared name
```

`decl` forward-declares a name without giving it a driver, which is exactly the primitive needed to close a combinational cycle — the same construction the [[SR Latch]] uses:

```spade
fn d_latch(d: bool, en: bool) -> bool {
    decl q;
    let q = if en { d } else { q };
    q
}
```

`d` and `en` are the mux's data and select in the drawing, `q` is both the output wire and the hold leg, all `bool` = 1 bit. It is a `fn`, not an `entity`: no `clock` in the signature and no `reg`, because the state lives in the topology rather than in a storage primitive. This lowers to a single continuous assignment, `assign \q = \en ? \d : \q ;` — a genuine combinational loop in the emitted Verilog, which is precisely what a synthesis tool reports as an inferred latch. Nothing here models the phase-overlap contention or the minimum pulse width; those are electrical, and no HDL sees them.

> [!important] Simulating this is the only way to tell it from a flop
> The identical Boolean function inside `reg(clk) q = if en { d } else { q };` compiles just as cleanly and is an enable **flop** — it also passes any testbench that only samples on clock edges. The vectors that separate them change `d` in the middle of an asserted phase and demand that `q` move immediately; both blocks were simulated and only the `decl` form does.

**Related Notes (with context):**

- [[SR Latch]] – depends-on: substituting $R=\bar S$ into its characteristic equation is where this circuit comes from.
- [[Cross-Coupled Inverter Bistable]] – depends-on: the loop the hold leg closes, and the source of the regeneration time constant.
- [[Transmission-Gate Multiplexer]] – supports: the physical realisation of the 2:1 mux, and why a pass-gate mux suits a feedback leg.
- [[Master-Slave D Flip-Flop]] – extends: two of these on opposite phases, never transparent together, buying a hard edge for 2× the clocked load.
- [[Dual-Phase Latches]] – extends: keeps the transparency explicit and spends it on time borrowing.
- [[Setup and Hold Constraints]] – compares: the flop's two checkable inequalities against this circuit's phase-wide hold requirement.
- [[Integrated Clock-Gating Cell]] – supports: uses a low-phase latch specifically to absorb enable glitches.
- [[Choosing a Storage Element]] – compares: where the latch sits against flop and pulsed latch on area, clock power, and sign-off cost.
- [[Combinational Logic]] – counter-example: the incomplete `if`/`case` that produces this circuit by accident instead of by intent.
- [[Lookup-Tables]] – counter-example: on an FPGA the latch costs a LUT and a timing exception while the flop next to it is free.

## References

Written from canon; this topic has no source in the book, so no page-level citations are given.

- Mano & Ciletti, *Digital Design*, sequential-logic chapter — SR and D characteristic equations, the forbidden-state argument, level- vs. edge-sensitivity.
- Wakerly, *Digital Design: Principles and Practices*, latches and flip-flops — behavioural treatment of transparency and the inferred-latch failure mode.
- Weste & Harris, *CMOS VLSI Design*, sequential circuit design — transmission-gate latch structure, transistor and clocked-load counts, phase overlap and contention.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, designing sequential logic circuits — the mux-based latch and its static/dynamic variants.
- Local: [[0.3) Introduction to Flip-Flops & Latches]], §"Level-sensitive D latch and transparency" and §"Trade-offs".
