---
title: "Cross-Coupled Inverter Bistable"
description: "Two inverters in a loop store a bit forever for free; the loop-gain criterion gives two stable states and the unstable point where metastability lives."
kind: circuit
source: "0.3) Introduction to Flip-Flops & Latches, §Cross-coupled inverters and bistability; Rabaey ch. 7; Weste & Harris ch. 10"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, latch, bistable, metastability, feedback]
aliases:
  - Cross-Coupled Inverter Bistable
  - Cross-Coupled Inverters
  - Cross-Coupled Inverter Pair
  - Inverter Loop
  - Bistable Element
  - Bistable
  - Storage Loop
---

# Cross-Coupled Inverter Bistable

**One-line summary:** The storage core of every latch and flip-flop — two inverters closed into a loop — and the only sequential element with *no inputs at all*, whose DC solution set is three fixed points rather than the two the Boolean model admits.

```tikz title="Cross-coupled inverter pair and its transfer curve against its own inverse, showing two stable crossings and the unstable point V_M"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  %% ---------------- (a) the loop ----------------
  \node[not port] (i1) at (1.5,2.0) {};
  \node[not port,xscale=-1] (i2) at (1.5,0.0) {};

  % v2 = NOT v1 : i1 output goes right, then down into i2's input
  \draw (i1.out) -- (3.5,2.0) -- (3.5,0.0) -- (i2.in);
  % v1 = NOT v2 : i2 output goes left, then up into i1's input
  \draw (i2.out) -- (-0.5,0.0) -- (-0.5,2.0) -- (i1.in);

  \fill (3.5,1.0) circle (0.06);
  \fill (-0.5,1.0) circle (0.06);
  \node[anchor=west] at (3.62,1.0) {$v_2$~[1]};
  \node[anchor=east] at (-0.62,1.0) {$v_1$~[1]};

  \node[anchor=south] at (1.5,3.05) {$v_2=f(v_1)$};
  \node[anchor=north] at (1.5,-1.05) {$v_1=f(v_2)$};
  \node[anchor=north] at (1.5,-1.75) {\textbf{(a)} two inverters, one loop, no inputs};

  %% ---------------- (b) the butterfly ----------------
  \begin{scope}[xshift=7.4cm,yshift=-0.5cm]
    \draw[->] (0,0) -- (3.9,0) node[anchor=west] {$V_1$};
    \draw[->] (0,0) -- (0,3.9) node[anchor=south] {$V_2$};
    \node[anchor=north east] at (0,0) {$0$};
    \node[anchor=north] at (3.0,-0.08) {$V_{DD}$};
    \node[anchor=east] at (-0.08,3.0) {$V_{DD}$};

    % V2 = f(V1)
    \draw[thick] plot[smooth] coordinates
      {(0,3.0) (0.45,2.97) (0.90,2.88) (1.20,2.64) (1.35,2.25)
       (1.50,1.50) (1.65,0.75) (1.80,0.36) (2.10,0.12) (2.55,0.03) (3.0,0)};
    % V1 = f(V2)  (the same curve reflected in the diagonal)
    \draw[thick,dashed] plot[smooth] coordinates
      {(3.0,0) (2.97,0.45) (2.88,0.90) (2.64,1.20) (2.25,1.35)
       (1.50,1.50) (0.75,1.65) (0.36,1.80) (0.12,2.10) (0.03,2.55) (0,3.0)};

    \fill (0,3.0) circle (0.09);
    \fill (3.0,0) circle (0.09);
    \draw[fill=white] (1.50,1.50) circle (0.09);

    \node[anchor=west] at (0.22,3.28) {stable};
    \node[anchor=west] at (3.20,0.42) {stable};
    \node[anchor=south west] at (1.64,1.60) {$V_M$, unstable};
    \node[anchor=north,align=center] at (1.65,-1.05)
      {\textbf{(b)} $f$ (solid) against $f^{-1}$ (dashed):\\
       three crossings, $|A^2|\!<\!1$ at the rails, $|A^2|\!\gg\!1$ at $V_M$};
  \end{scope}

\end{circuitikz}
\end{document}
```

*Own construction; the standard bistability argument and butterfly plot, e.g. Rabaey ch. 7 and Weste & Harris ch. 10.*

**Topic:**

**Turn "it remembers" into an equation with a solution set.** Both nodes are one bit wide as far as the rest of the design is concerned, but the storage mechanism is not Boolean and cannot be explained in Boolean terms; write the circuit as the two DC equations it actually is. Let $f$ be the DC voltage transfer characteristic of one inverter, so panel (a) asserts

$$v_2=f(v_1),\qquad v_1=f(v_2)$$

Substituting the first into the second eliminates $v_2$ and leaves a scalar fixed-point equation in one variable,

$$v_1=f(f(v_1))$$

so the operating points of the circuit are exactly the fixed points of $f\circ f$. Equivalently — and this is the form panel (b) plots — the first equation is the curve $V_2=f(V_1)$ and the second is that same curve reflected in the line $V_2=V_1$, i.e. $f^{-1}$; the operating points are their intersections. Nothing about "memory" has been assumed. Memory will turn out to be the statement that this equation has more than one solution.

**Count the solutions from monotonicity alone.** A CMOS inverter gives a continuous $f$ that is monotone decreasing with $f(0)=V_{DD}$ and $f(V_{DD})=0$. Then $g(V)=f(f(V))-V$ is continuous with $g(0)=f(V_{DD})-0=0^{+}$ and $g(V_{DD})=f(0)-V_{DD}=0^{-}$, and $f\circ f$ is monotone *increasing* (the composition of two decreasing maps), so by the **intermediate value theorem** at least one fixed point exists. Symmetry of a well-balanced inverter forces one of them to be the self-consistent point $V_M=f(V_M)$, where the curve meets the diagonal. Whether there are one or three depends entirely on the slope there: if $|f'(V_M)|\le 1$ the composed map is a contraction everywhere and the fixed point is unique — **the circuit has one operating point and stores nothing**. Only when the inverter has voltage gain greater than unity at its own switching threshold does the curve overshoot its inverse and cross back twice more. Bistability is therefore not a topological consequence of drawing a loop; it is bought with gain, and the gain comes from both devices of the [[CMOS Inverter]] being simultaneously in saturation near $V_M$.

**Stability is the loop-gain criterion, and the chain rule is the whole derivation.** Linearize about an intersection and perturb $v_1$ by $\delta$. One trip around the loop maps $\delta \mapsto A\delta$ at the first inverter and $A\delta \mapsto A^{2}\delta$ at the second, where $A=\left.\frac{df}{dV}\right|$ is that stage's (negative) small-signal gain; by the **chain rule** $A^2$ is exactly $\frac{d}{dV}(f\circ f)$ at the point. Iterating gives $\delta_n = A^{2n}\delta_0$, a geometric sequence, so the point is stable iff

$$|A^{2}|<1$$

which is the **Banach contraction condition** on $f\circ f$ and, read as a feedback system, the statement that the loop gain is below unity. Evaluate it at the three crossings. At the two rail intersections one transistor is off and the other is deep in the linear region, the small-signal gain is $|A|\ll1$, and any injected perturbation decays geometrically — **stable, and self-correcting**. At $V_M$ both devices are saturated and $|A|\gg1$ by design, since large $|A|$ at threshold *is* what makes an inverter restore logic levels; the same perturbation grows geometrically — **unstable**. Two stable states with an unstable one wedged between them is precisely the definition of a bistable, and the unstable point is not a technicality that careful design removes: it is a topological necessity, because two stable fixed points of a continuous 1-D map cannot be adjacent without a repelling one in between.

> [!important] The gain that makes it a good memory is the gain that makes metastability slow
> $|A|\gg1$ at $V_M$ is required for the two stable states to exist at all, and it is the same $|A|$ that appears in the divergence time constant $\tau\approx C/g_m$. There is no design point that gives robust storage and bounded resolution time; see [[Metastability and MTBF]].

**The digital abstraction deletes the third solution, which is why metastability is invisible in RTL.** Model the same loop in two-valued logic: $q = \lnot\lnot q$, whose solution set by **involution of negation** is $\{0,1\}$ — two solutions, both stable, nothing else. The Boolean model is not an approximation of the analog one with a small error; it is missing an entire operating point. Every phenomenon that lives at $V_M$ — unbounded resolution time, the failure of any fixed settling budget, the possibility of two loads reading opposite values from the same node — is therefore structurally inexpressible in RTL, in a two-valued simulator, and in static timing analysis. That is the reason metastability is handled by *probability and margin* ([[Synchronizer Chain]], MTBF) rather than by a constraint a tool can check.

**Bistability is free; writeability is the entire cost.** The loop as drawn has no inputs, holds its state indefinitely, and in CMOS costs four transistors and only leakage power to retain. Nothing else in this folder is that cheap. Every additional transistor in a real storage cell exists to *overpower* the loop for a controlled instant without destroying it, and each sibling is a different answer to that one question: [[SR Latch]] promotes each inverter to a NOR and hands the spare input outside; [[Transparent D Latch]] cuts the feedback path with a transmission gate and drives the node directly; [[Master-Slave D Flip-Flop]] uses two such loops on opposite clock phases so that no path is ever open end to end. A 6T SRAM cell is this pair plus two access transistors, and its sizing rule — the access devices must be strong enough to flip the cell but weak enough not to disturb it during a read — is nothing but the write/retain tension stated in transistor widths.

**Noise immunity is a geometric property of panel (b), not a separate specification.** The largest square that fits inside each lobe of the butterfly is the **static noise margin**: the DC offset that can be injected at a node before the two curves stop crossing there and the stable point disappears. This is why the picture is worth drawing rather than merely asserting that there are two states. It also predicts the failure mode of voltage scaling directly: as $V_{DD}$ falls toward the threshold voltage the inverter gain at $V_M$ collapses, the lobes shrink, and at some point the outer crossings merge into the middle one — the cell becomes monostable and the stored bit is simply gone. Device mismatch does the same thing asymmetrically, shrinking one lobe faster than the other, which is why SRAM retention limits the minimum supply voltage of a whole chip.

**On an FPGA this circuit cannot be built, and that is a fabric property rather than a synthesis limitation.** Implemented in LUTs the pair is a **combinational loop**: a cycle in the timing graph. Static timing analysis has no path to trace, so the loop delay is uncharacterized and placement-dependent, and synthesis will warn or refuse. The fabric supplies bistables as hard primitives instead — the flip-flop in every logic slice, the SRAM bitcells of the configuration memory and of distributed/block RAM — each of which is this same cross-coupled pair, characterized once by the vendor and exposed only through a legal interface. Where an ASIC designer chooses the loop's transistor sizes, an FPGA designer chooses which hard primitive to instantiate; see [[FPGAs]]. Both are the same circuit, and the analog argument above is the one that governs it in either case.

**Result.**

$$\boxed{\ v_1=f(f(v_1));\qquad \text{a fixed point is stable}\iff|A^{2}|<1,\quad A=\left.\frac{df}{dV}\right|_{v_1}\ }$$

Three fixed points when $|f'(V_M)|>1$: two stable at the rails, one unstable at $V_M=f(V_M)$.

**When it breaks.**

- **Inverter gain $|A|\le1$ at $V_M$:** only one fixed point survives, the loop is monostable, and it stores nothing. Reached in practice by aggressive $V_{DD}$ scaling, deep subthreshold operation, or a "restoring" stage that is actually a pass gate.
- **At $V_M$ itself:** stable in the DC sense that nothing moves, and useless, because the escape time $\tau\ln(\Delta V/|v_d(0)|)$ has no upper bound. Handled statistically, never structurally — [[Metastability and MTBF]].
- **No inputs:** the circuit is unwriteable by construction. It is a component, never a top-level element; everything in this folder exists to add a write port to it.
- **Device mismatch and $V_{DD}$ scaling:** shrink the noise-margin squares of panel (b) asymmetrically, so the weaker lobe vanishes first and the cell silently becomes monostable in one polarity only — a retention failure that passes functional test at nominal corner.
- **Single-event upset:** a charge injection exceeding the critical charge pushes the node past $V_M$, and the same positive feedback that makes storage robust then regenerates the *wrong* state permanently. Robustness against noise and robustness against upset are the same mechanism pointed in opposite directions.
- **Two-valued simulation:** cannot pick a state at all (see below). An analog or mixed-signal simulator needs an explicit initial condition, and even then a symmetric netlist started exactly at $V_M$ will sit there forever, because the symmetry that a numerical solver preserves is broken in silicon only by noise.
- **On an FPGA:** it is a combinational loop with no timing model. Instantiate a hard flop or a RAM primitive.

**RTL (Spade).**

The naive transcription fails, and the error is the general shape of the problem:

```spade
fn bistable() -> bool {
    let v1 = !(!v1);   // error: Use of undeclared name v1
    v1
}
```

`let` bindings are ordered and cannot refer forward. `decl` forward-declares a name without giving it a driver, which is exactly what a feedback wire is, and closes the loop:

```spade
fn bistable() -> (bool, bool) {
    decl v1;
    let v2 = !v1;
    let v1 = !v2;
    (v1, v2)
}
```

`v1` and `v2` are the two labelled nodes of panel (a), both `bool` = 1 bit; there is no `clock` in the signature and no `reg`, which is the point — the state lives in the topology, not in a storage primitive, and this is the only entity in the folder with an empty argument list. It lowers to precisely two cross-coupled continuous assignments, `assign v2 = ~v1; assign v1 = ~v2;`, so the emitted Verilog is a genuine combinational cycle; synthesis will report it as one rather than inferring the four-transistor cell a schematic entry tool would give you.

Simulation is what shows the gap between the two models. Left alone, Icarus settles both nodes at neither valid state and stays there forever — the two-valued engine has no more basis for choosing than the symmetric analog circuit does. Forcing either node and releasing it makes the loop hold the forced value, in both polarities and from both nodes: 7/7 vectors pass, with the asymmetric pair (force `v1`, then force the *other* node `v2`) present precisely because a symmetric check would also pass on a loop wired backwards.

```verilog
force dut.\v1  = 1'b1;  #10 check(q, 2'b10, "while forced");
release dut.\v1 ; #10 check(q, 2'b10, "holds after release");   // bistability
force dut.\v2  = 1'b1;  #10 check(q, 2'b01, "other node forced"); // asymmetric
release dut.\v2 ; #10 check(q, 2'b01, "holds the other state");
```

> [!warning] The simulation demonstrates the topology, not the physics
> `force`/`release` is a testbench override, not a circuit input; the real cell is written by a transistor that must *win* against the loop, which is a strength ratio and not a Verilog construct. And the third fixed point is not modelled at all — the `x`/`z` the free loop settles at is a simulator artifact that happens to coincide with "no valid state", not a representation of $V_M$.

**Related Notes (with context):**

- [[CMOS Inverter]] – depends-on: supplies $f$, and the gain $|A|>1$ at $V_M$ without which the loop has only one fixed point.
- [[Metastability and MTBF]] – extends: takes the unstable point derived here and turns $|A|\gg1$ into the divergence time constant $\tau$ and the MTBF exponential.
- [[SR Latch]] – extends: the cheapest write port, made by promoting each inverter to a NOR and handing the spare input outside.
- [[Transparent D Latch]] – extends: cuts the feedback path instead of overpowering it, at the cost of a transparency window.
- [[Master-Slave D Flip-Flop]] – extends: two of these loops on opposite clock phases, so no path is ever open end to end.
- [[Regenerative Latch Comparator]] – counter-example: uses the *instability* as the operating principle, deliberately starting the loop near $V_M$ so that $e^{t/\tau}$ amplifies a millivolt input difference.
- [[Synchronizer Chain]] – supports: the design response to the unstable point, buying resolution time because the exponent is the only term that pays.
- [[Choosing a Storage Element]] – compares: where this sits against every sibling in the folder.
- [[FPGAs]] – compares: the fabric forbids the loop in LUTs and sells it back as hard flops and SRAM bitcells.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Cross-coupled inverters and bistability* — the loop equations, the three intersections, the loop-gain criterion, and the link from $V_M$ to metastability. §*Metastability* — the small-signal divergence used in the callout.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, ch. on designing sequential logic circuits — bistability, the butterfly plot, and the loop-gain argument.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequential circuit design) and the SRAM chapter — the cross-coupled pair as the storage core of every sequential cell, static noise margin, and the write/retain sizing tension.
- Mano & Ciletti, *Digital Design*, ch. 5 — the two-valued view, $q=\lnot\lnot q$, in which the third operating point does not exist.

> [!warning] Printed page numbers not verified
> The textbook citations above are chapter-level. No copy was consulted for this note; the material is standard canon and the chapter numbering is stable across editions, but the pages are not. Static-noise-margin numbers and transistor-level sizing rules are quoted qualitatively only, for the same reason.
