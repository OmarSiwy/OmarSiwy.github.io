---
title: "JK Flip-Flop"
description: "Hold/set/reset/toggle in one cell, whose excitation table is half don't-cares — free literals under K-map minimization when gates were DIP pins, and dead weight in a standard-cell library."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §JK and T flip-flops, and why they are historical; Mano & Ciletti ch. 5; Wakerly ch. 7"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, flip-flop, jk, excitation-table]
aliases:
  - JK Flip-Flop
  - JK Flipflop
  - J-K Flip-Flop
  - JK FF
  - JK Flip-Flops
  - JK Master-Slave Flip-Flop
---

# JK Flip-Flop

**One-line summary:** The [[SR Latch]] with its own outputs fed back into its inputs, which makes the forbidden code $S=R=1$ structurally unreachable and repurposes it as *toggle* — the only storage element whose four input codes span all four functions of one state bit.

```tikz title="JK flip-flop as a D flip-flop with next-state logic D = J·Qbar + Kbar·Q, showing both feedback paths"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % --- next-state logic  D = J.Qbar + Kbar.Q ---
  \node[and port] (a1) at (3.0,3.6) {};
  \node[and port] (a2) at (3.0,1.4) {};
  \node[or  port] (o1) at (5.6,2.5) {};
  \node[not port] (nk) at (0.9,1.75) {};

  \draw (a1.in 2) -- ++(-2.6,0) node[anchor=east] {$J$~[1]};
  \draw (nk.in)   -- ++(-1.1,0) node[anchor=east] {$K$~[1]};
  \draw (nk.out)  |- (a2.in 1);

  \draw (a1.out) |- (o1.in 1);
  \draw (a2.out) |- (o1.in 2);

  % --- D flip-flop ---
  \draw[thick] (7.2,0.9) rectangle (9.2,4.1);
  \node at (8.2,3.75) {D-FF};
  \node[anchor=west] at (7.25,3.2) {D};
  \node[anchor=east] at (9.15,3.2) {$Q$};
  \node[anchor=east] at (9.15,1.5) {$\bar{Q}$};
  \draw (7.2,1.5) -- ++(0.32,0.19) -- ++(-0.32,0.19);
  \draw (7.2,1.5) -- (6.4,1.5) node[anchor=east] {$clk$};

  % OR -> D
  \draw (o1.out) -- (6.7,2.5) |- (7.2,3.2);
  \node[anchor=south] at (5.9,2.55) {$D$~[1]};

  % outputs
  \draw (9.2,3.2) -- (11.2,3.2) node[anchor=west] {$Q$~[1]};
  \draw (9.2,1.5) -- (11.2,1.5) node[anchor=west] {$\bar{Q}$~[1]};

  % feedback: Qbar over the top into the J AND
  \fill (10.6,1.5) circle (0.06);
  \draw (10.6,1.5) -- (10.6,5.0) -- (1.6,5.0) |- (a1.in 1);

  % feedback: Q under the bottom into the Kbar AND
  \fill (9.7,3.2) circle (0.06);
  \draw (9.7,3.2) -- (9.7,-0.7) -- (1.9,-0.7) |- (a2.in 2);

  \node[anchor=north] at (5.0,-1.4)
    {$D=J\bar{Q}+\bar{K}Q\;\Longrightarrow\;Q^{+}=J\bar{Q}+\bar{K}Q$};
\end{circuitikz}
\end{document}
```

*Own construction; the standard synthesised form, e.g. Mano & Ciletti ch. 5. Only the two filled dots are connections — where the $Q$ feedback drops past the $\bar{Q}$ output line on the right, that is a crossing.*

**Topic:**

**Gate each SR input with the output it must not fight, and the forbidden code deletes itself.** [[SR Latch]] gives $Q^{+}=S+\bar{R}\,Q$ valid only on the domain $SR=0$, and every repair in that note either removes the code by priority or removes an input entirely. The JK takes the third route: keep both inputs, and make the illegal combination *unreachable by construction* by substituting

$$S = J\bar{Q},\qquad R = KQ$$

Then $SR = J\bar{Q}\cdot KQ = JK\,(Q\bar{Q}) = JK\cdot 0 = 0$ by the **complement law** $Q\bar{Q}=0$, for every value of $J$ and $K$. This is the whole idea and it is worth stating precisely: the constraint is discharged by an algebraic identity on the feedback, not by a promise about the inputs. The set path is armed only while the flop is reset, the reset path only while it is set, so the two paths are never simultaneously live no matter what the outside world does. All five signals $J$, $K$, $Q$, $\bar{Q}$, $D$ are 1 bit wide; an $n$-bit register is $n$ independent copies, with no carry or coupling between them.

**Substitute and simplify to get the characteristic equation.** Put the two expressions into $Q^{+}=S+\bar{R}Q$:

$$Q^{+} = J\bar{Q} + \overline{KQ}\,Q
       = J\bar{Q} + (\bar{K}+\bar{Q})\,Q
       = J\bar{Q} + \bar{K}Q + Q\bar{Q}
       = J\bar{Q} + \bar{K}Q$$

by **De Morgan** $\overline{xy}=\bar{x}+\bar{y}$, then **distributivity of AND over OR**, then the **complement law** again to kill $Q\bar{Q}$. The result is a function of three variables that the drawing above realises directly as two ANDs and an OR in front of a plain D flop, since $D=Q^{+}$ is the defining property of a D flip-flop.

**Reading the four codes off the equation gives the four functions of one bit.** Evaluate $Q^{+}=J\bar{Q}+\bar{K}Q$ at each input code:

| $J$ | $K$ | $Q^{+}$ | function |
| --- | --- | --- | --- |
| 0 | 0 | $Q$ | hold |
| 0 | 1 | $0$ | reset |
| 1 | 0 | $1$ | set |
| 1 | 1 | $\bar{Q}$ | toggle |

There are exactly four functions $\{0,1\}\to\{0,1\}$ — constant-0, constant-1, identity, negation — and the JK provides all four, one per input code, with no code left over. That completeness is the reason it looked like the *right* primitive in 1970: nothing about one bit of state is outside its reach, so no external gate is ever logically required.

**The excitation table is the artefact that actually mattered, and half of it is don't-cares.** Synthesis of a state machine runs backwards from the equation: given a required transition $Q\!\to\!Q^{+}$, what inputs produce it? Invert the table above:

| $Q\to Q^{+}$ | $J$ | $K$ | | $D$ |
| --- | --- | --- | --- | --- |
| $0\to 0$ | 0 | $\times$ | | 0 |
| $0\to 1$ | 1 | $\times$ | | 1 |
| $1\to 0$ | $\times$ | 1 | | 0 |
| $1\to 1$ | $\times$ | 0 | | 1 |

Four of the eight $J$/$K$ entries are unconstrained, because when $Q=0$ the $K$ input is ANDed with $Q$ and cannot reach the output at all, and symmetrically for $J$ when $Q=1$. The D flop's column has zero don't-cares — $D$ is pinned by the transition, always. Under [[Karnaugh Maps]] a don't-care cell may be absorbed into either the 1-cover or the 0-cover, whichever grows the prime implicant, so each of $J_i$ and $K_i$ is minimised over a map in which half the cells are free. You pay for this by synthesising $2n$ excitation functions for an $n$-bit machine instead of $n$, but each is typically far cheaper. The canonical demonstration is a binary up-counter: bit $i$ toggles exactly when all lower bits are 1, giving

$$J_i = K_i = Q_{i-1}Q_{i-2}\cdots Q_0, \qquad D_i = Q_i \oplus (Q_{i-1}\cdots Q_0)$$

so the JK form shares a *single* product term between two inputs while the D form needs the same product plus an XOR per bit. In an SSI design where that XOR is another 14-pin package per four bits, this is not a rounding error. See [[Synchronous Sequential Logic]] for the state-assignment step this excitation table feeds.

**The advantage evaporated because minimisation moved, not because the algebra changed.** Every argument above is still true; what changed is who performs it. A modern synthesiser optimises the entire combinational cone between flops, across boundaries, with full don't-care extraction from unreachable states — so the don't-care freedom the JK exposed *at the flop pin* is now exploited everywhere at once by the tool, and exposing it again at the pin buys nothing. Meanwhile the costs are real and local: $D = J\bar{Q}+\bar{K}Q$ is two more levels of logic that sit in the setup path, the cell needs a second data pin characterised for setup and hold (and a $J$/$K$ arc pair for every corner), and the extra pins add capacitance next to the clocked stage. Standard-cell libraries answered by dropping the cell: they carry D flops with asynchronous reset, synchronous reset and clock enable, and usually no JK at all.

**On an FPGA the arithmetic is different but the conclusion is the same.** Every slice flop is a plain D with a dedicated `CE` pin, and $J\bar{Q}+\bar{K}Q$ is a 3-input function that vanishes into a 6-LUT which is already there and already only partly used — see [[FPGAs]]. So a JK on an FPGA is genuinely free in area, and still pointless: it costs one LUT *level of delay* on the $D$ path that a direct $D$ assignment would not, and it hides the hold condition. The tool infers the free `CE` pin from an explicit `if (en)`; it cannot infer it from "the coincidence $J=K=0$", so the hold that should have cost zero logic becomes combinational feedback through the LUT instead.

> [!important] The structure survived; the cell did not
> The toggle pattern — an XOR in front of a D flop — is still exactly how you build a counter bit, and the excitation-table method is still how hand-synthesis problems are posed in older references and exams. Read JK, and write D. Instantiating a JK in new RTL is a code smell, not an optimisation.

**Setting $J=K=T$ collapses it to the one form still worth building.** Under that tie, $Q^{+}=T\bar{Q}+\bar{T}Q = T\oplus Q$ by the **definition of XOR** as the sum-of-products $x\bar{y}+\bar{x}y$. That is the [[T Flip-Flop]], and it is what [[Counters]] are made of. The JK is therefore best understood as the T flop plus one extra degree of freedom that lets the same cell also hold, set and reset — a degree of freedom that cost one input pin and stopped paying for itself around the time gates stopped being packages.

**The part that actually shipped was a master–slave, and it had a defect the equation does not show.** The 7473/7476 family built the JK as two level-sensitive latches, not as [[Master-Slave D Flip-Flop]] with logic in front. During the entire clock-high phase the master is transparent *and* its input is gated by the slave's $Q$, so a transient $1$ on $J$ while $Q=0$ sets the master and — because $J$'s path is now disarmed by $\bar{Q}$ going low inside the master — **cannot be undone before the falling edge**. This is *ones-catching*: the flop remembers a glitch that was never present at any clock edge. The practical consequence is that a master–slave JK's effective setup requirement is the whole high phase of the clock, not a $t_{setup}$ window, which is a qualitatively different timing contract from the one in [[Setup and Hold Constraints]]. Edge-triggered JK parts were introduced precisely to close this, and the modern equivalent — a true edge-triggered D flop with combinational logic in front, i.e. the drawing above — never had the problem, because the logic is outside the storage element and is resampled at each edge.

**Result.**

$$\boxed{\ Q^{+}=J\bar{Q}+\bar{K}Q,\qquad SR=J\bar{Q}\cdot KQ=0\ \text{identically};\qquad J=K=T\ \Rightarrow\ Q^{+}=T\oplus Q\ }$$

**When it breaks.**

- **Master–slave implementations catch ones.** Inputs must be stable for the entire clock-high phase, not merely across the aperture window. Any glitch-prone combinational logic driving $J$ or $K$ is unsafe. Edge-triggered realisations are not affected.
- **There is no explicit hold input.** Hold is the coincidence $J=K=0$, so a glitch on either input inside the aperture changes state rather than being ignored, and enable-inference for a slice `CE` pin or an [[Integrated Clock-Gating Cell]] does not fire. When the intent is "update conditionally", a [[Clock Enable Flip-Flop]] states it directly and is strictly cheaper.
- **No cell in the library.** Synthesis maps the JK back to a D flop plus $J\bar{Q}+\bar{K}Q$, so the two logic levels land in the setup path and the reported $f_{max}$ drops relative to the D form the tool would otherwise have chosen. You did not get a primitive; you got a primitive plus a tax.
- **The don't-care win is not additive with a synthesiser.** Hand-minimising $J$/$K$ equations and then handing them to a tool that would have extracted the same don't-cares over a larger cone usually produces *worse* logic, because you have fixed a boundary the optimiser wanted to cross.
- **One bit only.** There is no $n$-bit JK with useful internal structure; a wide register is $n$ copies and every argument above applies per bit.
- **Where a sibling takes over:** [[T Flip-Flop]] for counters, [[Clock Enable Flip-Flop]] for conditional update, [[Master-Slave D Flip-Flop]] for everything else. [[Choosing a Storage Element]] has the full comparison.

**RTL (Spade).**

```spade
entity jk_ff(clk: clock, rst: bool, j: bool, k: bool) -> bool {
    reg(clk) q reset(rst: false) = (j && !q) || (!k && q);
    q
}
```

`j` and `k` are the two external inputs of the drawing and the register's next-state expression is the $D$ net between the OR gate and the flop; the feedback on `q` is the register's self-reference, which Spade allows in a `reg` and rejects in a `let`, so the loop that is drawn as two wires is here a single sequential assignment. All four signals are `bool` = 1 bit; `!` is Spade's boolean negation (bitwise not is `~`, and `^` is not defined on `bool` — the T form must be written `t ^^ q` or `t != q`). Synthesis will not build the diagram: it flattens $J\bar{Q}+\bar{K}Q$ into one LUT on an FPGA, or into whatever 3-input cell the library prices best on an ASIC, and the two-AND/one-OR decomposition survives only as a way of reading the equation.

Simulated against a behavioural reference with the reset case, eight named vectors covering hold/set/hold/reset/toggle/toggle/set/reset, and 3000 random $(J,K)$ pairs. The named vectors are deliberately asymmetric — $(J,K)=(1,0)$ from $Q=0$ and $(0,1)$ from $Q=1$ — because a $J$/$K$ swap compiles cleanly, passes every symmetric code, and is exactly the bug this circuit invites.

**Related Notes (with context):**

- [[SR Latch]] – depends-on: supplies $Q^{+}=S+\bar{R}Q$ and the constraint $SR=0$ that the feedback here discharges identically.
- [[T Flip-Flop]] – extends: the $J=K=T$ tie, and the only descendant still worth building.
- [[Master-Slave D Flip-Flop]] – compares: the edge-triggered storage element this is built on top of, and the structure the original JK parts used internally with the ones-catching defect.
- [[Karnaugh Maps]] – depends-on: the minimisation step under which the excitation table's don't-cares become free literals.
- [[Synchronous Sequential Logic]] – supports: the state-assignment and excitation-table method this cell was designed to serve.
- [[Clock Enable Flip-Flop]] – counter-example: states "hold" as an explicit input instead of a coincidence of two, and is cheaper on every modern target.
- [[Counters]] – supports: the toggle pattern is the surviving use, as an XOR in front of a D flop rather than as a JK cell.
- [[Choosing a Storage Element]] – compares: where this sits against every sibling in the folder.
- [[Boolean Algebra]] – depends-on: complement, De Morgan and distributivity, named at each rewriting step above.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*JK and T flip-flops, and why they are historical* — the characteristic equations, the don't-care argument, the reduction to a D flop with input logic, and the conclusion that the cells are absent from modern libraries.
- Mano & Ciletti, *Digital Design*, ch. 5 (Synchronous Sequential Logic) — characteristic and excitation tables for SR/D/JK/T, and the excitation-table synthesis method.
- Wakerly, *Digital Design: Principles and Practices*, ch. 7 — the master–slave JK, ones-catching, and the edge-triggered replacements.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — why sequential libraries standardise on D with reset/enable variants.

> [!warning] No transistor counts, delays or LUT counts are quoted
> This note has no book source and no characterised library, so the cost arguments above are structural (levels of logic, pin count, which path the logic lands in) and deliberately carry no numbers. Comparing a JK against a D flop in area or $f_{max}$ requires the actual PDK or device family.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter-level. No copy was consulted; the material is standard and the chapter numbering stable across editions, but the pages are not given because they were not read.
