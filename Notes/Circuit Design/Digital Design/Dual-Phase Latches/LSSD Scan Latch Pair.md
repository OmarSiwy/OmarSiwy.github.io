---
title: LSSD Scan Latch Pair
description: "IBM's L1/L2 pair used as its own scan cell with separate system and non-overlapping scan clocks A and B; race- and hazard-free in both modes, and the reason two-phase DFT is the one genuinely solved part of the flow."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, dual-phase-latches]
aliases:
  - LSSD
  - Level-Sensitive Scan Design
  - Shift Register Latch
  - SRL
  - L1/L2 Latch Pair
---

# LSSD Scan Latch Pair

An L1/L2 transparent-latch pair given a second data port and a third clock, so the same two latches serve as the design's state element and as one bit of its scan chain — with the shift path made race-free by clock non-overlap instead of by hold-buffer insertion.

```tikz title="LSSD shift register latch: L1 with system port D/C and scan port I/A, L2 on shift clock B, and the three-clock waveform in system and shift mode"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  % ================= the SRL cell =================
  \draw[fill=black!8] (2.0,-0.5) rectangle (3.5,1.0);
  \node at (2.75,0.45) {L1};
  \draw[fill=black!8] (4.8,-0.5) rectangle (6.2,1.0);
  \node at (5.5,0.45) {L2};

  % data inputs
  \draw[->] (0.5,0.7) -- (2.0,0.7);  \node[anchor=east] at (0.45,0.7) {$D$};
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (1.25,0.72) {$n$};
  \draw[->] (0.5,0.2) -- (2.0,0.2);  \node[anchor=east] at (0.45,0.2) {$I$};
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (1.25,0.22) {$1$};

  % clock stubs
  \draw[->] (2.4,-1.05) -- (2.4,-0.5); \node[font=\small,anchor=north] at (2.4,-1.06) {$C$};
  \draw[->] (3.1,-1.05) -- (3.1,-0.5); \node[font=\small,anchor=north] at (3.1,-1.06) {$A$};
  \draw[->] (5.5,-1.05) -- (5.5,-0.5); \node[font=\small,anchor=north] at (5.5,-1.06) {$B$};

  % L1 -> system logic, L1 -> L2, L2 -> next scan cell
  \draw[->] (3.5,0.7) -- (4.1,0.7) -- (4.1,1.75) -- (7.0,1.75);
  \node[font=\scriptsize,anchor=south] at (5.5,1.78) {$+L1$ to system logic, $n$ bits};
  \draw[->] (3.5,0.2) -- (4.8,0.2);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (4.15,0.22) {$1$};
  \draw[->] (6.2,0.2) -- (7.6,0.2);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (6.9,0.22) {$1$};
  \node[font=\scriptsize,anchor=west] at (6.35,-0.28) {scan-out, to $I$ of SRL $i{+}1$};

  % ================= clock waveforms =================
  \draw[gray!55,dashed] (3.5,-2.05) -- (3.5,-4.90);
  \node[font=\scriptsize,anchor=south] at (1.85,-2.03) {system mode: $A=B=0$};
  \node[font=\scriptsize,anchor=south] at (5.9,-2.03) {shift mode: $C=0$};

  \node[anchor=east] at (0.2,-2.40) {$C$};
  \draw[thick] (0.3,-2.6)--(0.8,-2.6)--(0.8,-2.2)--(1.4,-2.2)--(1.4,-2.6)
              --(2.2,-2.6)--(2.2,-2.2)--(2.8,-2.2)--(2.8,-2.6)--(8.0,-2.6);
  \node[anchor=east] at (0.2,-3.40) {$A$};
  \draw[thick] (0.3,-3.6)--(4.0,-3.6)--(4.0,-3.2)--(4.6,-3.2)--(4.6,-3.6)
              --(5.6,-3.6)--(5.6,-3.2)--(6.2,-3.2)--(6.2,-3.6)
              --(7.2,-3.6)--(7.2,-3.2)--(7.8,-3.2)--(7.8,-3.6)--(8.0,-3.6);
  \node[anchor=east] at (0.2,-4.40) {$B$};
  \draw[thick] (0.3,-4.6)--(4.9,-4.6)--(4.9,-4.2)--(5.5,-4.2)--(5.5,-4.6)
              --(6.5,-4.6)--(6.5,-4.2)--(7.1,-4.2)--(7.1,-4.6)--(8.0,-4.6);

  % non-overlap gap
  \draw[gray!60,dotted] (4.6,-3.2) -- (4.6,-4.6);
  \draw[gray!60,dotted] (4.9,-3.2) -- (4.9,-4.6);
  \draw[<->] (4.6,-3.90) -- (4.9,-3.90);
  \node[font=\scriptsize,anchor=west,inner sep=2pt] at (4.95,-3.90) {$t_{\mathrm{nov}}$};

  \node[font=\scriptsize,anchor=north] at (4.3,-5.00)
    {one shift step per $(A,B)$ pair: $L2_{i-1}\!\to\!L1_i$ on $A$, then $L1_i\!\to\!L2_i$ on $B$};
  \node[font=\scriptsize,anchor=north] at (4.3,-5.42)
    {$A$ and $B$ never overlap, so the shift is correct for any $\delta_{dq}$ --- and there is
     no logic between cells};
\end{circuitikz}
\end{document}
```

**Give the latch pair a second data port and the state element becomes the scan chain.** L1 is a polarity-hold latch with two independent data/clock port pairs: the system datum $D$ (1 bit of an $n$-bit bank) admitted while $C$ is high, and the scan datum $I$ (always 1 bit) admitted while $A$ is high. L2 is an ordinary transparent latch whose data input is $L1$'s output and whose clock is $B$. The system logic reads $+L1$, the $n$-bit true output of the L1 bank; the chain reads L2's output, which drives $I$ of SRL $i{+}1$ with nothing in between. An $n$-bit architectural register therefore costs $n$ SRLs and contributes $n$ to the chain length $S$, while the scan interface into and out of the whole chip stays one bit wide in each direction plus three 1-bit clock nets $C$, $A$, $B$.

**The pair is a master–slave flop that has been un-collapsed twice.** [[Master-Slave D Flip-Flop]] is exactly two level-sensitive latches on opposite phases at one physical point; [[Two-Phase Latch Pipeline]] separates them *in space* and puts logic between them. LSSD separates them *in function*: it keeps the pair abutted but gives L1 a second way in, so the same silicon that resolves the master–slave race also resolves the shift race. This is why a two-phase design is closer to LSSD than a flop design is — the L1/L2 pair and the non-overlapping clock discipline are already there, and DFT is a matter of adding the $I/A$ port rather than of restructuring the state.

**Derive the shift-path hold condition and the whole argument falls out.** The race-through inequality for two-phase latches, from [[Two-Phase Latch Pipeline]], bounds the *minimum* delays around a hop: data launched when latch $i$ opens must not overtake latch $i{+}1$'s previous transparency window, which closed $t_{\mathrm{nov}}$ earlier, so

$$\delta_{dq} + \delta_{i+1} \;\ge\; t_h + t_{sk} - t_{\mathrm{nov}}$$

Now substitute what a scan chain actually is. Between L2 of cell $i$ and L1 of cell $i{+}1$ the combinational cone is empty — the cells abut and the connection is a wire — so $\delta_{i+1}=0$ identically and the requirement collapses onto the cell alone:

$$\delta^{L2}_{dq} \;\ge\; t_h + t_{sk} - t_{\mathrm{nov}}$$

Two readings, and both are the reason LSSD exists. First, $\delta_{i+1}=0$ is the *smallest value the term can take anywhere in the design*, so the scan chain is the worst hold path on the die by construction — which is why scan-chain hold, not logic hold, is the failure that kills parts in the lab. Second, the clock period $T$ does not appear, so no amount of slowing the shift clock repairs it; only $t_{\mathrm{nov}}$ does, picosecond for picosecond.

> [!important] In shift mode the non-overlap gap is free
> In the system pipeline every picosecond of $t_{\mathrm{nov}}$ comes straight out of the borrow budget $B=\tfrac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$, so hold margin and speed are in direct competition. During shift there is no logic to time and no borrowing to protect: shift frequency is a test-cost parameter, not a specification. $t_{\mathrm{nov}}$ on $A$/$B$ can therefore be widened until the inequality is satisfied with margin, at zero cost to the shipped clock. A single-edge scan architecture — muxed-D — has $t_{\mathrm{nov}}=0$ identically and must instead meet $\delta_{dq}\ge t_h+t_{sk}$ by inserting delay buffers on every hop of every chain, which is a per-net physical fix rather than a one-line clock-generation choice.

**Level-sensitivity is a claim about the whole design, not about the cell.** Eichelberger & Williams define the discipline as a rule set, and the guarantee only holds if every rule holds: all internal storage is polarity-hold latches; no latch may be fed by a latch that its own clock also controls; every latch clock traces back to a clock primary input; a clock input may never reach a latch's *data* pin, directly or through logic; and every system latch belongs to an SRL. The fourth rule is the one designers break — it is what makes the latch's own gate-level implementation hazard-free with respect to the clock, so a [[Static Hazards|static hazard]] on a clock path cannot corrupt held state. Violate one rule in one macro and the property being claimed for the chip — that the steady-state response depends only on the logic, not on the delays — is simply no longer true, with nothing in the netlist to mark where.

**The two standard configurations differ only in what $B$ does when the part is running.** In *single-latch design* the system function uses L1 alone: $C$ is the system clock, $+L1$ feeds the logic, and $A$ and $B$ are both held low outside test — L2 is scan-only silicon, which is the configuration drawn above. In *double-latch design* $C$ and $B$ are the two non-overlapping system clocks and the L1/L2 pair *is* the system master–slave element, so L2 is not overhead at all and only the $I/A$ port is. The choice is the usual one: single-latch costs a latch of pure test area and buys a half-cycle of transparency for the system path; double-latch costs nothing extra but forces the whole design onto the two-phase discipline.

**Testing reduces to a combinational problem, which is the entire point.** Once every state bit is settable and observable through the chain, ATPG never has to reason about sequential depth: load the chain in $S$ shift steps, apply one system-clock capture, unload while loading the next pattern. For $P$ patterns over a chain of $S$ SRLs the cost is $\approx P\!\cdot\!S$ shift steps with load and unload overlapped, each step being one $(A,B)$ pulse pair rather than one clock edge. That linear-in-state-count test time is not improved by LSSD — it is the price of serial scan in any form — but the *pattern generation* problem drops from sequential to combinational, and it stays there regardless of clock skew, because the level-sensitive rules removed the delay dependence.

**On FPGAs none of this applies.** The fabric's flops are not user-configurable into a scan cell, configuration readback and the vendor's own test structures replace user scan entirely, and there is no second clock phase to be had without burning a PLL output and a global buffer on a clock network that is already 20–39 % of dynamic power. LSSD is an ASIC discipline that presupposes you own the standard-cell library.

$$\boxed{\;\delta^{L2}_{dq}\;\ge\;t_h+t_{sk}-t_{\mathrm{nov}}\quad\text{with}\quad\delta_{\text{logic}}=0\;}$$

The shift path is the design's worst-case hold path, and the only free variable in it is the non-overlap gap.

**When it breaks**

- **The guarantee is global, and its violation is silent.** Race-freedom follows from the rule set, not from the cell. One macro that lets a clock reach a data pin, or one same-phase latch-to-latch path, and the chip no longer has the property being claimed for it — with nothing in the netlist marking where. This is a lint problem, and the lint has to run before tape-out because no test will find it.
- **Delay-independence does not cover delay test.** The claim is stated for the stuck-at model. At-speed transition and path-delay test needs a timed launch/capture sequence on the system clock, which re-introduces exactly the timing dependence the discipline was defined to remove, so LSSD's strongest guarantee does not extend to its most valuable modern test.
- **Three clock nets, one of them a phase constraint.** $A$ and $B$ must stay non-overlapping *after* CTS, which is stronger than a skew budget and is the same difficulty [[Non-Overlapping Two-Phase Clock Generator]] exists to manage — one study reports a 54 % power increase for an LSSD standard-cell design over a non-scannable one, and in single-latch design L2 is dead area whenever the part is running.
- **The ecosystem moved.** Muxed-D is what your library vendor characterised and your ATPG tool was tuned against. LSSD works, and it works off the beaten path — the same reason [[Two-Phase Latch Pipeline]] loses to flops for reasons unrelated to whether its timing theory is sound.

> [!warning] The 54 % power figure is uncited in the long-form note
> It is quoted there as "one study reports"; the study is not identified, the process node and the baseline definition are unknown, and it should not be used as a design number without tracing it.

> [!warning] Not covered in the source — needs outside research
> No area figure per SRL against a muxed-D scan flop, and no measured comparison of ATPG pattern counts or test time between LSSD and muxed-D on the same design.

**RTL (Spade)**

Not expressible. The SRL is two *level-sensitive* latches with three independent clock ports, and Spade has neither a latch primitive nor a `let` that may reference itself, so the transparency window cannot be written at all:

```spade
fn d_latch(d: bool, en: bool) -> bool {
    let q = if en { d } else { q };
    q
}
```

```
error: Use of undeclared name q
  ┌─ latch2.spade:2:32
  │
2 │     let q = if en { d } else { q };
  │                                ^ Undeclared name
```

Passing `q` in as a parameter would compile, and would be a multiplexer, not a latch. What Spade *is* native at is the two-clock structure around the latches — it will happily put two registers on two distinct clock nets, which is the shift path as a master–slave chain:

```spade
entity srl(clk_a: clock, clk_b: clock, se: bool, si: bool, d: bool) -> bool {
    reg(clk_a) l1 initial(false) = if se { si } else { d };
    reg(clk_b) l2 initial(false) = l1;
    l2
}

entity srl_chain4(clk_a: clock, clk_b: clock, se: bool, si: bool, d: uint<4>) -> uint<4> {
    let db = d.as_bits();
    let q0 = inst srl(clk_a, clk_b, se, si, db[0]);
    let q1 = inst srl(clk_a, clk_b, se, q0, db[1]);
    let q2 = inst srl(clk_a, clk_b, se, q1, db[2]);
    let q3 = inst srl(clk_a, clk_b, se, q2, db[3]);
    [q0, q1, q2, q3].as_uint()
}
```

`l1` and `l2` are the two boxes in the diagram, `clk_b` is $B$, and each `srl`'s `si` is the previous cell's `l2` — the abutted, zero-logic hop the boxed inequality is about. `d.as_bits()` gives `[bool; 4]` with index 0 the LSB, so `q0` is the head of the chain and `q3` the scan-out; the bank width is the array length and nothing widens. This captures the shift *function*: simulated over 3008 vectors against a behavioural two-bank reference, including shifting a single 1 from `q0` to `q3` to catch a reversed chain. It captures none of the physics. `clk_a` stands in for both $C$ and $A$ because Spade cannot select between clock nets, so the mode multiplexing has moved into `se` — which is precisely the muxed-D structure LSSD exists to avoid. And because both banks are edge-triggered, the model is correct *by assumption* rather than by non-overlap: it has no transparency window, so it cannot exhibit the race the drawing's $t_{\mathrm{nov}}$ prevents, and cannot demonstrate that preventing it works. Synthesis of this text yields flip-flops on two clock domains, which a CTS tool will treat as two unrelated clocks rather than two phases of one.

**Related Notes**

- [[Master-Slave D Flip-Flop]] – depends-on: the same L1/L2 pair, collapsed to one point with no second data port; LSSD is that flop with a scan way in.
- [[Two-Phase Latch Pipeline]] – supports: already has the pair and the non-overlapping clocks, so it gets this DFT structure almost for free — the one part of the two-phase flow that is genuinely solved.
- [[Non-Overlapping Two-Phase Clock Generator]] – depends-on: produces the $A$/$B$ gap that the boxed hold inequality spends.
- [[Programmable Local Clock Buffer]] – extends: POWER6's C1/C2 buffer is where a shipped version of these clocks is actually generated, with scannable pairs and selectable pulse widths.
- [[Choosing a Latch Timing Scheme]] – compares: where the DFT column sits against the frequency and power columns for every sibling.
- [[Static Hazards]] – supports: the hazard-free clock path the fourth LSSD rule is protecting.

## References

- [[0.3a) Dual-Phase Latches]] §"EDA tool support — the real answer" (DFT and scan) and §"Industrial record" — the LSSD claim, the 54 % power figure, and the race-through inequality reused above.
- Eichelberger & Williams, [*A Logic Design Structure for LSI Testability*](https://dl.acm.org/doi/10.5555/800262.809169), 14th DAC, 1977 — the SRL, the design rules, and the race-/hazard-free argument.
- Curtis et al., [*Design and Implementation of the POWER6 Microprocessor*](https://ieeexplore.ieee.org/document/4443208/), IEEE JSSC 2008 — scannable master–slave pairs on C1/C2 in a shipped 4.7 GHz part.
- Pedroso, Wang & Guthaus, [*An Open-Source Flow for Single-Phase, Edge-Triggered to Two-Phase, Non-Overlapping Clocking Conversion*](https://arxiv.org/abs/2605.05374), GLSVLSI 2026 — GPIO scan-chain hold as the permanent shuttle failure that non-overlap fixes.
