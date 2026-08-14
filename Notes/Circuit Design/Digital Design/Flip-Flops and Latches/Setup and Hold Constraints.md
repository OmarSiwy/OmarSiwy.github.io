---
title: Setup and Hold Constraints
description: "The aperture window around the edge, and the two inequalities it produces — one you can buy with frequency and one you cannot, which is why hold failures are dead silicon and setup failures are just a slower part."
kind: concept
source: "0.3) Introduction to Flip-Flops & Latches, §Setup, hold, clock-to-Q, and the aperture window / §Single-cycle timing constraints / §Worked example; Weste & Harris ch. 10; Mano & Ciletti ch. 5; Wakerly ch. 8"
status: seed
spade: simulated
tags: [digital, flip-flops-and-latches, timing, sta, skew, setup, hold]
aliases:
  - Setup and Hold Time
  - "Single-Cycle Timing Constraint"
  - Setup Time
  - Hold Time
  - Aperture Window
  - Max-Delay and Min-Delay Constraints
---

# Setup and Hold Constraints

**One-line summary:** The two inequalities that a launch–logic–capture path must satisfy for the flop's "data crosses only at the edge" guarantee to hold, distinguished from every other timing rule by the fact that only one of them contains $T_{clk}$.

```tikz title="Launch-logic-capture path with clock skew, and the aperture window at the capture flop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
% ---------- (a) the constrained path ----------
\begin{scope}[yshift=7.2cm]
  \draw (0,0) rectangle (1.3,1.7); \node at (0.65,1.2) {FF$_L$}; \node at (0.65,0.45) {$D\;Q$};
  \draw (3.0,0.15) rectangle (5.7,1.55); \node at (4.35,1.05) {combinational};
  \node at (4.35,0.55) {$t_{logic}$~[$n$]};
  \draw (7.4,0) rectangle (8.7,1.7); \node at (8.05,1.2) {FF$_C$}; \node at (8.05,0.45) {$D\;Q$};
  \draw[->] (1.3,1.0) -- (3.0,1.0); \node at (2.15,1.35) {[$n$]};
  \draw[->] (5.7,1.0) -- (7.4,1.0); \node at (6.55,1.35) {[$n$]};
  \draw[->] (-1.4,1.0) -- (0,1.0);
  \draw[->] (8.7,1.0) -- (10.1,1.0);
  \draw (-1.4,-1.3) -- (0.65,-1.3);
  \draw[->] (0.65,-1.3) -- (0.65,0);
  \fill (0.0,-1.3) circle (0.06);
  \draw (0.0,-1.3) -- (0.0,-2.1) -- (6.6,-2.1);
  \draw (6.6,-2.1) rectangle (7.5,-1.7);
  \node at (7.05,-1.9) {$t_{skew}$};
  \draw (7.5,-1.9) -- (8.05,-1.9);
  \draw[->] (8.05,-1.9) -- (8.05,0);
  \node at (-1.9,-1.3) {$clk$~[1]};
  \node[anchor=west] at (-2.6,-3.0) {(a) launch $\to$ logic $\to$ capture};
\end{scope}
% ---------- (b) the aperture window at FF_C ----------
\fill[black!12] (2.9,0.7) rectangle (5.0,2.6);
\draw[dashed,black!55] (2.9,0.7) rectangle (5.0,2.6);
\draw[densely dotted] (4.0,-0.9) -- (4.0,3.45);
% clock
\draw[thick] (0,2.6) -- (4.0,2.6) -- (4.0,3.3) -- (8.0,3.3);
\node[anchor=east] at (-0.15,2.95) {$clk_C$~[1]};
\node[anchor=west] at (5.15,3.5) {capture edge};
% D at FF_C
\draw[thick] (0,0.9) -- (2.3,0.9) -- (2.55,1.6) -- (8.0,1.6);
\node[anchor=east] at (-0.15,1.25) {$D_C$~[$n$]};
% Q of FF_C
\draw[thick] (0,-0.6) -- (4.0,-0.6) -- (4.9,0.1) -- (8.0,0.1);
\node[anchor=east] at (-0.15,-0.25) {$Q_C$~[$n$]};
% dimension arrows
\draw[<->] (2.9,2.05) -- (4.0,2.05);
\draw[<->] (4.0,2.05) -- (5.0,2.05);
\node[anchor=south] at (3.45,2.12) {$t_{setup}$};
\node[anchor=south] at (4.50,2.12) {$t_{hold}$};
\draw[<->] (4.0,-1.15) -- (4.9,-1.15);
\node[anchor=north] at (4.45,-1.22) {$t_{cq}$};
\node[anchor=west] at (0.0,0.30) {aperture $T_A$};
\node[anchor=west] at (-2.6,-2.1) {(b) $D_C$ must not move inside the shaded keep-out window};
\end{circuitikz}
\end{document}
```

*Own construction. Panel (a) is the standard two-flop timing path; panel (b) is the same capture flop drawn against time, with the shaded region the aperture window.*

**Topic:**

**Three characterized numbers describe a flop at its clock boundary, and the third is the one people forget.** For the capture flop of panel (a), all of $D$, $Q$ and the combinational bus are $n$ bits wide and $clk$ is 1 bit, but the constraint is per-bit and the width never enters it:

| Parameter | Definition | Bounds the |
| --- | --- | --- |
| $t_{setup}$ | $D$ must be stable this long **before** the edge | leading side of the aperture |
| $t_{hold}$ | $D$ must remain stable this long **after** the edge | trailing side |
| $t_{cq}$ | edge $\to$ $Q$ valid, characterized as $t_{cq,max}$ and $t_{cq,min}$ | departure of new data |

Together the interval $[-t_{setup},\,+t_{hold}]$ around the edge is the **aperture window**: a keep-out zone during which $D$ must not move. Its width $T_A = t_{setup}+t_{hold}$ is a property of the cell; its *position* relative to the edge is not fixed by physics, and $t_{hold}$ is frequently **negative** in modern libraries, because the internal clock path to the slave stage is slow enough that $D$ may legally change slightly before the nominal edge. A negative hold time is not a typo in the datasheet and it is the reason a well-characterized library needs almost no hold buffering on short local paths.

**The two numbers are physical facts about the master–slave structure, not axioms.** Inside a [[Master-Slave D Flip-Flop]], $t_{setup}$ is the time the master's cross-coupled loop needs to regenerate a full-swing value before the edge cuts it off, and $t_{hold}$ is the time until the master's transparency window is genuinely closed. Neither is a hard cliff: push $D$ closer to the edge and $t_{cq}$ degrades smoothly, then sharply. Libraries define $t_{setup}$ at the point where $t_{cq}$ has degraded by 10 %, which is why setup and $t_{cq}$ trade against each other and why a single scalar "setup time" is a **linearization of a curve**. Sign-off treats it as a constant because static analysis needs a constant; the underlying object is a surface, and the last few picoseconds of "margin" are the part of the surface where the linearization is worst.

**Give the skew a sign before writing any inequality, or half the algebra comes out backwards.** Define
$$t_{skew} \;=\; t_{arrival}(C) - t_{arrival}(L)$$
so that *positive skew means the capture clock is late*. Everything below is signed with respect to that convention; [[Clock Skew and Jitter]] covers where the number comes from and why it can be scheduled.

**Setup is a max-delay constraint: chase the slowest data from one edge to the next.** Put the launch edge at $t=0$. By the definition of $t_{cq,max}$, FF$_L$'s output is valid at $t_{cq,max}$; adding the worst-case propagation of the cloud, the data reaches FF$_C$'s $D$ pin at $t_{cq,max}+t_{logic,max}$. The capture edge arrives at $T_{clk}+t_{skew}$, and the aperture requires stability $t_{setup}$ before it:
$$t_{cq,max}+t_{logic,max}+t_{setup} \;\le\; T_{clk}+t_{skew}$$
Subtracting $t_{skew}$ from both sides — a linear rearrangement, nothing more — isolates the period:
$$T_{clk}\;\ge\;t_{cq,max}+t_{logic,max}+t_{setup}-t_{skew}$$
This is a *performance* statement. Every term on the right is a delay you can attack with logic depth, drive strength, or architecture, and if you attack none of them you can simply raise $T_{clk}$.

**Hold is a min-delay constraint on a single edge, and that is why $T_{clk}$ vanishes.** The *same* edge $n$ that launches the data being captured also launches the *next* data through the fastest path. That fast data leaves at $t_{cq,min}$ and arrives at FF$_C$ at $t_{cq,min}+t_{logic,min}$. Edge $n$ itself reaches FF$_C$ at $t_{skew}$, so FF$_C$'s aperture stays open until $t_{skew}+t_{hold}$. New data must not arrive before the window shuts:
$$t_{cq,min}+t_{logic,min} \;\ge\; t_{skew}+t_{hold}$$
Note what never appeared: **$T_{clk}$**. Both sides are measured from the same edge, so the period cancels before it is ever written down. That is not an algebraic accident; it is the structure of the problem, and it is the entire content of this note.

**In practice both signs and both extremes are unknown, so budget them adversely.** The sign of $t_{skew}$ is not known until place-and-route, so both inequalities are re-written with an uncertainty magnitude $T_{skew}=|t_{skew}|_{max}$ taken in the harmful direction, plus cycle-to-cycle **jitter** $t_j$ on the period:
$$T_{clk}\;\ge\;t_{cq,max}+t_{logic,max}+t_{setup}+T_{skew}+t_{j}$$
$$t_{cq,min}+t_{logic,min}\;\ge\;t_{hold}+T_{skew}$$
Jitter appears only in the setup equation. The hold check compares two paths launched by *one* edge, so a random displacement of that edge is **common-mode and cancels** — the same cancellation, for the same reason, that removed $T_{clk}$. Sign-off enforces the two at opposite process corners: hold at the **fast** corner (low temperature, high $V_{DD}$, fast process) where $t_{cq,min}+t_{logic,min}$ is smallest, setup at the slow corner. Two corners, opposite directions, both mandatory; a design signed off at one corner only is unverified, not merely optimistic.

> [!important] You cannot slow your way out of a hold violation
> $T_{clk}$ is in the setup inequality and **not** in the hold inequality. A setup failure is a performance bug: drop the frequency and the part works, ship it slower, fix it next spin. A hold failure is a *functional* bug — the chip is broken at every frequency, at DC, forever, and no board-level change can rescue it. Hold is repaired by *adding* delay (buffer insertion on short paths), which costs area and leakage but never costs frequency, which is why tools do it automatically and generously: the alternative is a dead die. Positive skew buys setup margin and spends hold margin one-for-one, so useful-skew scheduling is playing with the only lever that can turn a working chip into a paperweight.

**Put numbers on it: an 8-bit register-to-register path.** Take FF$_L$[8] $\to$ an 8-bit [[RCA, Ripple-Carry Adder]] $\to$ FF$_C$[9], with illustrative library numbers (assumed, not characterization data):
$$t_{cq,max}=120\ \mathrm{ps},\quad t_{cq,min}=60\ \mathrm{ps},\quad t_{setup}=80\ \mathrm{ps},\quad t_{hold}=50\ \mathrm{ps},\quad T_{skew}=40\ \mathrm{ps},\quad t_j=25\ \mathrm{ps}$$
The adder's longest path is the carry chain through all 8 bits and its shortest is bit 0's sum, which waits on no carry at all — a ripple adder is the extreme case of a path set with a huge max/min spread, which is exactly what makes it a good example. Take $t_{logic,max}=8\times 90=720$ ps and $t_{logic,min}=45$ ps. Setup:
$$T_{clk}\ \ge\ 120+720+80+40+25 \;=\; 985\ \mathrm{ps}\ \Longrightarrow\ f_{max}=1.02\ \mathrm{GHz}$$
Hold: $t_{cq,min}+t_{logic,min}=60+45=105$ ps against $t_{hold}+T_{skew}=50+40=90$ ps, so $105\ge 90$ passes with 15 ps of margin. Now let the router put FF$_C$ on a clock branch 70 ps late instead of 40:
$$105\ \ge\ 50+70=120\quad\textbf{false}\quad\Longrightarrow\ \text{violation of }15\ \mathrm{ps}$$
Halving the clock to 500 MHz changes neither side — there is no $T_{clk}$ in the inequality. The only fix is roughly $+15$ ps of buffering on the bit-0 sum path, which *relaxes* setup on that path too, since bit 0 was nowhere near critical. Cost: one buffer, zero frequency.

**FPGA and ASIC agree on the algebra and disagree completely on who owns the risk.** On an ASIC every term is yours: the clock tree is synthesized to your $T_{skew}$ budget, and hold fixing consumes real area and leakage across tens of thousands of short paths. On an FPGA the global clock networks are hardened, balanced, and characterized, so $T_{skew}$ within one clock region is small and known before you compile; combined with routing delays that are large relative to $t_{hold}$, hold violations on a single-clock design are essentially eliminated by construction and the vendor tool will report hold slack in the hundreds of picoseconds without doing anything. Two exceptions survive and both are real: paths that **cross clock regions or clock domains**, and paths through a **gated or non-global clock** you routed on general fabric. The practical FPGA consequence is that the setup inequality is the only one you tune, and you tune it almost entirely through $t_{logic,max}$ — which is why FPGA design converges on pipelining far more aggressively than ASIC design does.

**The failure mode has no error term, which makes this the one place in the vault where accuracy analysis does not apply.** Every operator note in [[Error Accuracy]] ends with a bound in ulp. A sequential element has no such bound: it either meets the inequality and reproduces its input exactly, or it violates the inequality and captures an arbitrary value — possibly after an unbounded delay, since a $D$ transition inside the aperture leaves the master's loop near its unstable point, which is the subject of [[Synchronizer Chain]]. The error in ulp is $0$ for every passing configuration and undefined for every failing one. That is why timing closure is stated as inequalities rather than error bounds, and why "close enough" is not a category that exists here.

**Result.**

$$\boxed{\ T_{clk}\;\ge\;t_{cq,max}+t_{logic,max}+t_{setup}+T_{skew}+t_{j}\qquad\text{and}\qquad t_{cq,min}+t_{logic,min}\;\ge\;t_{hold}+T_{skew}\ }$$

**When it breaks.**

- **Hold violation.** Not fixable by frequency, by voltage, or by anything on the board. Fix in silicon with buffer insertion, or the die is scrap.
- **Negative $t_{hold}$ read as zero.** Treating a library's $-20$ ps hold as $0$ throws away real margin and makes the tool insert buffers it does not need; treating a positive one as negligible does the opposite and is fatal.
- **Multi-cycle and false paths.** Both inequalities above assume the data must cross in exactly one cycle. Declare a path multi-cycle and the setup right-hand side becomes $N\,T_{clk}$ while the **hold check stays on the launch edge unless you move it too** — the classic sign-off mistake, because the tool will not infer the hold exception from the setup one.
- **Crossing clock domains.** $t_{skew}$ between unrelated clocks is unbounded, so neither inequality can be satisfied and neither is meaningful. The answer is not tighter timing, it is a [[Synchronizer Chain]].
- **Transparency.** Anything that opens a window rather than sampling an edge — [[Transparent D Latch]], [[Dual-Phase Latches]], pulsed latches — lengthens the interval during which fast data can race through, so the hold constraint degrades by roughly the transparency width. That is the price of the slack-borrowing those styles buy.
- **Clock gating.** A gate in the clock path adds skew to everything downstream of it; this is why the repair is a characterized [[Integrated Clock-Gating Cell]] rather than an AND gate, and why a [[Clock Enable Flip-Flop]] — which puts a mux in the $D$ path and adds it to $t_{logic,max}$ every cycle — is the timing-safe alternative.
- **The aperture is not a cliff.** Just-passing setup is the region where the 10 %-degradation linearization is least trustworthy; a path that closes with 1 ps of slack is not the same object as one that closes with 100 ps.

**RTL (Spade).**

The path the constraints govern is perfectly synthesizable — what is *not* expressible in any HDL is the constraint itself:

```spade
entity launch_capture<#uint W>(clk: clock, rst: bool, x: uint<W>, y: uint<W>) -> uint<{W + 1}> {
    reg(clk) xl reset(rst: 0) = x;      // FF_L : launches at edge n, valid after t_cq
    reg(clk) yl reset(rst: 0) = y;
    let s = xl + yl;                    // combinational cloud: t_logic,min .. t_logic,max
    reg(clk) sc reset(rst: 0) = s;      // FF_C : captures at edge n+1, needs t_setup
    sc
}
```

`xl`/`yl` are FF$_L$ in panel (a) and `sc` is FF$_C$; `s` is the $n$-bit bus through the cloud, widened to $W+1$ by the adder's carry-out ($+$ grows by one bit in Spade, so `s` and `sc` are `uint<W+1>` while the inputs are `uint<W>`). Latency is exactly 2 cycles, and the whole point is what is missing: **no line of this file mentions $t_{setup}$, $t_{hold}$, $t_{cq}$ or $t_{skew}$.** Those live in the `.lib` cell characterization and the SDC constraint file, and the RTL is timing-agnostic by construction — which is exactly why an RTL simulation passes at 100 MHz and at 100 GHz alike, and why a hold-violating netlist simulates perfectly and fails on the bench. Synthesis will also do one thing the drawing does not: with retiming enabled it may move the capture flop *into* the carry chain to balance $t_{logic,max}$, changing the path set the inequalities are evaluated over while leaving the cycle-accurate behaviour above unchanged.

**Related Notes (with context):**

- [[Master-Slave D Flip-Flop]] – depends-on: the internal structure that makes $t_{setup}$ and $t_{hold}$ physical quantities rather than stipulations.
- [[Clock Skew and Jitter]] – depends-on: supplies $t_{skew}$ and $t_j$, their signs, and why one can be scheduled and the other only budgeted.
- [[RCA, Ripple-Carry Adder]] – supports: the worked example's cloud, and the canonical case of a huge $t_{logic,max}/t_{logic,min}$ spread inside one operator.
- [[Dual-Phase Latches]] – counter-example: deliberately reintroduces transparency to let slack flow between stages, trading exactly the hold margin this note protects.
- [[Transparent D Latch]] – compares: the same three parameters characterized against a window rather than an edge.
- [[Synchronizer Chain]] – extends: what happens when the aperture is violated by an input that no constraint can control.
- [[Clock Enable Flip-Flop]] – compares: holds state by adding a mux to $t_{logic,max}$, i.e. pays for the hold-safe option in setup.
- [[Integrated Clock-Gating Cell]] – compares: holds state by gating the clock, moving the cost into $T_{skew}$ and requiring a characterized cell to bound it.
- [[Choosing a Storage Element]] – compares: where each storage style sits once these two inequalities are the scoring function.
- [[Error Accuracy]] – counter-example: the one operator class whose failure is categorical, with no ulp bound on either side.

## References

- `0.3) Introduction to Flip-Flops & Latches`, §*Setup, hold, clock-to-Q, and the aperture window*, §*Single-cycle timing constraints*, §*Worked example* — the aperture definition, both derivations, the common-mode cancellation argument, and the 8-bit numeric example reproduced above.
- Weste & Harris, *CMOS VLSI Design*, ch. on sequential circuit design and timing — max-delay/min-delay derivation, the 10 %-degradation definition of $t_{setup}$, useful skew, and time borrowing.
- Mano & Ciletti, *Digital Design*, ch. 5 (Synchronous Sequential Logic) — flip-flop timing parameters and the single-cycle timing model.
- Wakerly, *Digital Design: Principles and Practices*, ch. 8 — setup/hold definitions and the behavioural treatment of clock skew.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter-level. No copy was consulted for this note; the material is standard and the chapter numbering is stable across editions, but the page numbers are not given because they were not read.

> [!warning] Library numbers are illustrative, not characterized
> Every picosecond in the worked example is an assumption chosen to make the arithmetic legible. No process, no library and no corner is implied. Real $t_{setup}$, $t_{hold}$ and $t_{cq}$ come from a `.lib` and vary with input slew and output load, which is a two-dimensional table, not a scalar.
