---
title: "Transmission-Gate Multiplexer"
description: "Two transmission gates and an inverter, 6 transistors instead of ~12 static CMOS — but series stages form an RC ladder whose delay grows quadratically, so buffer every two or three levels."
kind: circuit
source: "0.2) Combinational Logic, §Standard blocks (Multiplexers) and §Trade-offs; Weste & Harris, CMOS VLSI Design, chs. 1, 4, 9; Rabaey, Digital Integrated Circuits, ch. 6"
status: seed
spade: simulated
tags: [digital, combinational-logic, multiplexer, transmission-gate, cmos, pass-transistor]
aliases:
  - Transmission-Gate Multiplexer
  - Transmission Gate Multiplexer
  - Transmission Gate Mux
  - TG Mux
  - TG Multiplexer
  - Transmission Gate
  - CMOS Transmission Gate
  - Pass-Transistor Multiplexer
  - Pass-Gate Multiplexer
---

# Transmission-Gate Multiplexer

**One-line summary:** A 2:1 multiplexer built from two complementary pass switches rather than from logic gates — 6 transistors instead of 12, at the price of an output that is *steered* rather than *driven*, so the circuit has no gain, no isolation, and a delay that compounds quadratically when the cells are cascaded.

```tikz title="CMOS 2:1 transmission-gate multiplexer: two complementary pass switches sharing one select inverter"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- TG-A : conducts when S=0 (pmos gate S, nmos gate Sbar) ----
  \node[pmos] (ap) at (2.6, 3.2) {};
  \node[nmos, xscale=-1] (an) at (5.4, 3.2) {};
  % ---- TG-B : conducts when S=1 (nmos gate S, pmos gate Sbar) ----
  \node[nmos] (bn) at (2.6, 0.4) {};
  \node[pmos, xscale=-1] (bp) at (5.4, 0.4) {};

  % A bus on top of TG-A
  \draw (ap.drain) |- (4.0,4.6) -| (an.drain);
  \draw (4.0,4.6) -- (4.0,5.4) node[anchor=south] {$A$~[1]};
  \fill (4.0,4.6) circle (0.06);

  % shared output node between the two gates
  \draw (ap.source) |- (4.0,1.8) -| (an.source);
  \draw (bn.drain)  |- (4.0,1.8) -| (bp.drain);
  \fill (4.0,1.8) circle (0.06);
  \draw (4.0,1.8) -- (8.0,1.8) node[anchor=west] {$Y$~[1]};

  % B bus under TG-B
  \draw (bn.source) |- (4.0,-1.0) -| (bp.source);
  \draw (4.0,-1.0) -- (4.0,-1.8) node[anchor=north] {$B$~[1]};
  \fill (4.0,-1.0) circle (0.06);

  % select inverter
  \node[not port] (inv) at (1.9,-3.0) {};
  \draw (-0.6,-3.0) node[anchor=east] {$S$~[1]} -- (inv.in);

  % S rail (left, x=1.0): TG-A pmos gate and TG-B nmos gate
  \fill (1.0,-3.0) circle (0.06);
  \draw (1.0,-3.0) -- (1.0,3.2) -- (ap.gate);
  \draw (1.0,0.4) -- (bn.gate);
  \fill (1.0,0.4) circle (0.06);
  \node[anchor=south east] at (1.0,3.2) {$S$};

  % Sbar rail (right, x=7.0): TG-A nmos gate and TG-B pmos gate
  \draw (inv.out) -- (7.0,-3.0) -- (7.0,3.2) -- (an.gate);
  \draw (7.0,0.4) -- (bp.gate);
  \fill (7.0,0.4) circle (0.06);
  \node[anchor=south west] at (7.0,3.2) {$\bar S$};

  \node[text=black!60, align=center] at (4.0,3.2) {TG$_A$\\on when $S=0$};
  \node[text=black!60, align=center] at (4.0,0.4) {TG$_B$\\on when $S=1$};
  \node[anchor=north west, align=left] at (-0.6,-3.8)
    {$Y=\bar S A + S B$ \quad 6 transistors: 4 pass devices $+$ 2 in the select inverter.};
\end{circuitikz}
\end{document}
```

*Own construction; the standard CMOS pass-gate mux drawing, e.g. Weste & Harris ch. 1 and Rabaey ch. 6. The $Y$ wire crosses the $\bar S$ rail with no dot on it — that is a crossing, not a connection. Only the filled dots are junctions.*

**Topic:**

**Price the static-CMOS mux first, so the saving is a number rather than a slogan.** The function is the Shannon expansion of any Boolean function about one variable, $Y=\bar S A + S B$, with $A$, $B$, $S$ and $Y$ all 1 bit. Static CMOS is naturally inverting, so the cheap realisation is not AND-OR but AND-OR-INVERT: an AOI22 computes $\overline{\bar S A + S B}$ in 8 transistors (4 NMOS in two series pairs, 4 PMOS in two parallel-of-series stacks), one output inverter restores the polarity for 2, and one more inverter generates $\bar S$ for 2 — **12 transistors** for a 1-bit mux. The transmission-gate form keeps the same select inverter and replaces the whole logic block with four pass devices: **6 transistors**. For a $w$-bit wide mux the select inverter is shared across all slices, so the counts are $10w+2$ against $4w+2$, and the ratio tends to $2.5$ as $w$ grows.

**Both device polarities are needed, and the threshold condition alone says why.** An NMOS conducts while $V_{GS}>V_{tn}$. Hold its gate at $V_{DD}$ and pass a rising signal: as the source node climbs, $V_{GS}=V_{DD}-V_{\text{out}}$ shrinks, and at $V_{\text{out}}=V_{DD}-V_{tn}$ the device cuts off. It passes a **strong 0 and a weak 1**, and the loss is worse than nominal because the **body effect** $V_{tn}(V_{SB})=V_{t0}+\gamma\!\left(\sqrt{|2\phi_F|+V_{SB}}-\sqrt{|2\phi_F|}\right)$ raises $V_{tn}$ exactly as the source rises. A PMOS is the dual — strong 1, weak 0, cutting off at $|V_{tp}|$. Wire the two in parallel with complementary gate drive and the union is above threshold for *every* output voltage in $[0,V_{DD}]$: the NMOS carries the low half, the PMOS the high half, and both carry the middle, which is also where the on-resistance of the pair is flattest. The decisive penalty of the single-device version is not noise margin but **static power**: a held high of $V_{DD}-V_{tn}$ leaves the next inverter's PMOS partially on, so every stored 1 burns crowbar current forever.

> [!important] A transmission gate is a switch, not a gate, and every property below is a consequence
> The signal path never touches $V_{DD}$ or ground. All the charge that moves $Y$ comes from whichever driver is upstream of $A$ or $B$. So the cell has **no gain** (levels degrade instead of being restored), **no isolation** (the device is bidirectional — $Y$ can drive $A$ just as well), and **no output when both switches are off** (the node floats at high impedance and holds its last value on parasitic capacitance). Static CMOS buys you all three with those extra six transistors, and cascading transmission gates is the act of spending them.

**Cascading turns the chain into an RC ladder, and Elmore gives the quadratic directly.** Model each conducting transmission gate as a resistor $R$ (the parallel on-resistance of the NMOS/PMOS pair at the worst-case output voltage) and each internal node between two gates as a capacitor $C$ (the diffusion capacitance of two devices plus wire). A chain of $N$ gates driven at one end, with the load at the far end, is then a uniform distributed RC line, and its **Elmore delay** is the sum over each resistor of the total downstream capacitance it must charge:

$$t_N=\sum_{i=1}^{N} R\,\bigl(N-i+1\bigr)C = RC\sum_{j=1}^{N} j = \frac{RC\,N(N+1)}{2}$$

The dominant term is $\tfrac12 RC N^2$. This is the whole reason cascading is dangerous: a [[Multiplexer Tree]] of depth $n$ has $n$ *levels*, which for static gates means delay linear in $n$, but if the levels are unbuffered transmission gates the series resistance and capacitance both accumulate along the path and the delay is **quadratic in $n$**. The depth count stops predicting anything.

**Buffer insertion converts the quadratic back to linear, and the spacing has a closed form.** Insert a restoring stage — an inverter pair, or a single inverter with the polarity absorbed downstream — every $k$ transmission gates. There are $N/k$ segments, each a $k$-long ladder of delay $\tfrac12 RC\,k(k+1)$ followed by a buffer of delay $t_{\text{buf}}$:

$$D(k)=\frac{N}{k}\left[\frac{RC\,k(k+1)}{2}+t_{\text{buf}}\right]=N\left[\frac{RC(k+1)}{2}+\frac{t_{\text{buf}}}{k}\right]$$

which is linear in $N$ for any fixed $k$. Differentiating, $\dfrac{dD}{dk}=N\left(\dfrac{RC}{2}-\dfrac{t_{\text{buf}}}{k^{2}}\right)=0$, so

$$k^{\star}=\sqrt{\frac{2\,t_{\text{buf}}}{RC}}$$

The optimum is flat near its minimum — $D(k)$ is within a few percent of $D(k^\star)$ across $k^\star\pm1$ — which is why the design rule survives as a range rather than a number. Buffering also repairs the level degradation of the previous paragraph and re-establishes drive for the next segment, so the same inverter pays for two problems at once. Note that $k^\star$ *grows* with buffer delay and *shrinks* as the pass devices get more resistive, which is the correct intuition: cheap buffers, short segments.

> [!warning] The specific spacing "two or three" is a rule of thumb, not a computed optimum
> Evaluating $k^{\star}=\sqrt{2t_{\text{buf}}/RC}$ needs a characterised on-resistance and node capacitance for a minimum-size transmission gate in a specific process. Neither the long-form note nor any source consulted here supplies them, so the familiar answer of 2–4 is quoted, not derived. Recompute it from your own library's $R_{\text{on}}$ and $C_{\text{diff}}$ before trusting it.

**Counting a 4:1 makes the saving concrete, and shows where the select inverters go.** The tree is three 2:1 cells: two at the first level selected by $S_0$, one at the second selected by $S_1$. That is $3\times4=12$ pass transistors. The two first-level cells *share* one $\bar S_0$ inverter, and the second level needs one $\bar S_1$ inverter, so the select logic is $2\times2=4$ transistors — **16 transistors for a 1-bit 4:1 mux**, against roughly 40 by the two-transistors-per-gate-input proxy used for the static tree in [[Choosing a Combinational Block]]. Sharing the select inverters is not an optimisation you can skip: build each cell with its own inverter and the count goes to 18, and worse, the three copies of $\bar S_0$ now skew independently.

**Select skew is the failure mode, and it is not the static-1 hazard.** The inverter that makes $\bar S$ takes time $t_{\text{inv}}$, so during a select transition $S$ and $\bar S$ are momentarily inconsistent, and one of two things happens. If the skew makes both gates conduct — **make-before-break** — then $A$ and $B$ are shorted through $2R$ and the two upstream drivers fight, giving a current spike and an intermediate output for $t_{\text{inv}}$. If the skew makes both gates open — **break-before-make** — then $Y$ floats for $t_{\text{inv}}$, holding its old value on node capacitance as a dynamic node. Which one you get is set by the sign of the skew and is a deliberate sizing decision, not an accident. Compare this with the static-CMOS mux, whose failure on the same stimulus is a **static-1 hazard**: hold $A=B=1$, toggle $S$, and the two product terms hand over imperfectly so $Y$ dips, curable by the consensus term $AB$ ([[Logic Hazards]], [[Hazard-Free Two-Level Cover]]). The transmission-gate mux has *no* hazard on that stimulus — with $A=B=1$, shorting them together drives 1, and floating holds 1 — so the two realisations of the same Boolean function fail on disjoint inputs.

**The NMOS-only variant is cheaper still and is ratioed, which is why it lost.** Delete both PMOS devices and the 2:1 mux is 2 pass transistors plus the select inverter. This is classical pass-transistor logic (CPL, LEAP), and it reintroduces the weak-1 problem with no mitigation: the pass node settles at $V_{DD}-V_{tn}$ and the following inverter conducts static current. The standard repair is a **level restorer** — a feedback PMOS from the output inverter's output back to the pass node, which pulls the degraded high to the rail once the inverter has flipped. That circuit is **ratioed**: the restorer must be weak enough that a pass device can overpower it and drag the node low on the next $1\to0$ transition, so it needs sizing analysis and it does not port across processes. Six transistors of ratio-less transmission gate beat four transistors that need a SPICE sweep, which is why the TG form is the one in every standard-cell library.

**On an FPGA you cannot build this, and yet it is what the fabric is made of.** The user-visible primitives are LUTs and flip-flops; there is no pass-transistor cell to instantiate, and writing $Y = S\,?\,B : A$ produces a LUT, not the circuit drawn above. Below that boundary, however, this *is* the fabric: every routing multiplexer in a switch box and every LUT's internal $2^k{:}1$ select tree over its SRAM cells is a pass-transistor or transmission-gate tree with level restorers, buffered at exactly the spacing derived above. That is the structural reason routing delay on an FPGA is comparable to logic delay rather than negligible, and the reason vendors buffer the routing at every switch point. See [[FPGAs]] for the mapping boundary. In the delay model of [[Logical Effort]] the tabulated MUX2 figures ($g=2$, $p=4$) describe the static-CMOS realisation; a transmission gate has no logical effort of its own precisely because it is not a gate — you fold its $R$ and $C$ into the driving stage's electrical effort and parasitic delay instead.

**Result.**

$$\boxed{\;Y=\bar S A+SB \ \text{in } 6 \text{ transistors};\qquad t_N=\tfrac12 RC\,N(N{+}1);\qquad k^{\star}=\sqrt{\tfrac{2t_{\text{buf}}}{RC}}\;}$$

**When it breaks.**

- **Unbuffered chains past $k^\star$ stages.** The $\tfrac12 RC N^2$ term overtakes the transistor-count saving quickly; an unbuffered 8-stage chain costs $\tfrac12\cdot8\cdot9\,RC=36\,RC$, against $12\,RC+4t_{\text{buf}}$ for the same chain buffered at $k=2$. Every practical cascade — a [[Barrel Shifters]] stage, a deep mux tree — is buffered.
- **Select skew.** Either contention between the two upstream drivers or a floating output, for $t_{\text{inv}}$ on every select change. Fine into a register, not fine into anything level-sensitive: a clock, an asynchronous reset, or a latch enable.
- **The output is not a driven logic level while both gates are off.** A floating node is not a logic 0; it decays on leakage and moves on coupling. Any consumer that samples asynchronously will eventually see the decay.
- **Bidirectionality.** There is no arrow on a pass device. A downstream driver contending on $Y$ backfeeds into $A$ or $B$, and a unidirectional gate-level simulation will not show it. This is the same reason transmission gates need `tran`/`rtran` primitives rather than `assign` in Verilog.
- **Low supply voltage.** As $V_{DD}$ approaches $2V_t$ the on-resistance at mid-rail blows up, since neither device is comfortably above threshold there. In near-threshold designs static CMOS wins back the ground it lost.
- **FPGA targets.** Not instantiable. Write the function and let the mapper produce a LUT; see [[Multiplexer Tree]] for what the tree becomes after technology mapping.

**RTL (Spade).**

The Boolean function is one `if`, and the tree is that function composed with itself, one level per select bit:

```spade
fn mux2<#uint W>(s: bool, a: uint<W>, b: uint<W>) -> uint<W> {
    if s { b } else { a }
}

fn mux4<#uint W>(s: uint<2>, d0: uint<W>, d1: uint<W>,
                 d2: uint<W>, d3: uint<W>) -> uint<W> {
    let sb = s.as_bits();
    mux2(sb[1], mux2(sb[0], d0, d1), mux2(sb[0], d2, d3))
}
```

`s` is the select rail of the drawing and `a`/`b` are $A$ and $B$; `W` is the slice width, so one `mux2::<W>` is $W$ parallel copies of the four pass devices sharing a single $\bar S$ inverter, and the width is invariant across the cell — a mux is the one arithmetic-adjacent block with no width growth. Everything here is combinational: no `clock` in either signature, no `reg`. In `mux4`, `sb[0]` is the LSB of the select and drives the *first* level, `sb[1]` the second, matching the tree; `.as_bits()` indexes from the LSB, and swapping the two indices produces a circuit that compiles and simulates cleanly for $s\in\{0,3\}$ and swaps $d_1$ with $d_2$ — which is exactly what the asymmetric test vectors below exist to catch. What synthesis does differently from the drawing is everything below the Boolean level: it will emit an AOI22 or a LUT, never a pass gate, because the pass gate is a cell-library choice made after logic synthesis.

The electrical structure, on the other hand, is genuinely not expressible. Spade has a `tri` type with `HIGHIMP`, so a single switch types fine —

```spade
fn tg(en: bool, x: tri) -> tri { if en { x } else { HIGHIMP } }
```

— but the transmission-gate mux *is* the wired join of two such switches onto one node, and there is no wired node:

```
error: Trait bound not satisfied. tri does not implement core::ops::BitOr
  │     tg(!s, a) | tg(s, b)
  │     ^^^^^^^^^ tri does not implement core::ops::BitOr
```

That is the right refusal. A language whose signals are unidirectional and single-driver cannot describe a bidirectional switch network, and the `if`-expression above is honest about being the *function* the network implements, not the network.

**Related Notes (with context):**

- [[Multiplexer Tree]] – depends-on: the tree is built from this cell, and its depth-$n$ delay is linear only if the levels are buffered — unbuffered, the $\tfrac12 RC n^2$ ladder above replaces the level count entirely.
- [[Barrel Shifters]] – supports: $\log_2 n$ mux stages in series is the canonical place the quadratic bites, and where the buffer spacing $k^\star$ actually gets designed rather than assumed.
- [[Logical Effort]] – depends-on: supplies the delay model the buffer-spacing derivation sits in, and the reason a transmission gate has no $g$ of its own.
- [[One-Hot Multiplexer]] – compares: the flat alternative, which spends one wide OR instead of a series resistance and so has the opposite scaling failure.
- [[Logic Hazards]] – counter-example: the static-1 hazard of the gate realisation has no analogue here; select skew fails as contention or a float, on disjoint inputs.
- [[Hazard-Free Two-Level Cover]] – compares: the consensus-term repair applies to the AOI22 form and is meaningless for a switch network.
- [[Demultiplexer]] – extends: the same pass devices run backwards, since a transmission gate is bidirectional and a demux is this circuit with source and load exchanged.
- [[CMOS Logic Gates]] – depends-on: the 12-transistor AOI22 baseline, the threshold condition, and the body effect that the two-polarity argument rests on.
- [[FPGAs]] – counter-example: not instantiable in the fabric, although the routing multiplexers and the LUT's own select tree are exactly this circuit.
- [[Choosing a Combinational Block]] – compares: where this sits against every sibling realisation of the same truth table.

## References

- `0.2) Combinational Logic`, §*Standard blocks* (**Multiplexers**) — the 6-versus-12 transistor claim, the RC-ladder observation, and the buffer-every-two-or-three rule; §*Trade-offs* — the 16-transistor figure for a 4:1 tree and the static-CMOS column it is compared against; §*Fan-in, fan-out and logical effort* — the MUX2 $g=2$, $p=4$ entry.
- Weste & Harris, *CMOS VLSI Design*, ch. 1 (transmission gate as a switch, strong/weak levels), ch. 4 (Elmore delay, RC ladders, buffer insertion), ch. 9 (pass-transistor logic families and level restorers).
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, ch. 6 — pass-transistor logic, the threshold-drop and body-effect analysis, CPL and the ratioed level restorer.
- Mano & Ciletti, *Digital Design*, ch. 4 — the multiplexer as Shannon expansion, and the gate-level realisation this circuit replaces.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter-level. This note has no assigned book source and no copy was consulted; the chapter numbering is stable across editions but the pages are not.
