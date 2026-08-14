---
title: "Non-Overlapping Two-Phase Clock Generator"
description: "Cross-coupled NAND pair with delay chains producing phi1/phi2 with a tunable dead gap t_nov; the gap buys hold margin picosecond for picosecond out of the borrow budget B."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, dual-phase-latches, clocking, latch, asic]
aliases:
  - "Two-Phase Clock Generator"
  - "Non-Overlapping Clock Generator"
  - "Non-Overlapping Clocks"
  - "Two-Phase Non-Overlapping Clock"
  - "Non-Overlap Time"
---

# Non-Overlapping Two-Phase Clock Generator

A cross-coupled NAND pair with a delay chain in each feedback leg, which makes $\phi_1\phi_2=0$ a *logical* property of the topology instead of a timing margin somebody has to verify.

```tikz title="Cross-coupled NAND two-phase clock generator: each phase waits for the other's fall to be acknowledged through a delay chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  % ---------------- gates ----------------
  \node[nand port] (A) at (2.6,1.9) {};
  \node[nand port] (B) at (2.6,-1.9) {};
  \node[not port]  (I0) at (0.8,-3.15) {};
  \node[not port]  (OA) at (6.9,1.9) {};
  \node[not port]  (OB) at (6.9,-1.9) {};

  % ---------------- clk distribution ----------------
  \draw (-1.25,0) node[left] {clk} -- (-0.2,0);
  \node[circ] at (-0.2,0) {};
  \draw (A.in 1) -| (-0.2,0);
  \draw (-0.2,0) -- (-0.2,-3.15) -- (I0.in);
  \draw (I0.out) -- (1.9,-3.15) |- (B.in 2);
  \node[font=\scriptsize,anchor=south] at (1.35,-3.08) {$\overline{\text{clk}}$};

  % ---------------- delay chains ----------------
  \draw (A.out) -- (3.7,1.9);
  \draw[fill=black!6] (3.7,1.55) rectangle (5.4,2.25);
  \node[font=\scriptsize,align=center] at (4.55,1.9) {$2k$ inverters\\[-2pt]$t_d$};
  \draw (5.4,1.9) -- (OA.in);
  \node[circ] at (6.2,1.9) {};
  \draw (OA.out) -- (8.1,1.9) node[right] {$\phi_1$};
  \node[font=\scriptsize,anchor=south] at (3.35,1.96) {$\overline{\phi_1}$};

  \draw (B.out) -- (3.7,-1.9);
  \draw[fill=black!6] (3.7,-2.25) rectangle (5.4,-1.55);
  \node[font=\scriptsize,align=center] at (4.55,-1.9) {$2k$ inverters\\[-2pt]$t_d$};
  \draw (5.4,-1.9) -- (OB.in);
  \node[circ] at (6.2,-1.9) {};
  \draw (OB.out) -- (8.1,-1.9) node[right] {$\phi_2$};
  \node[font=\scriptsize,anchor=north] at (3.35,-1.96) {$\overline{\phi_2}$};

  % ---------------- cross-coupled feedback ----------------
  \draw[thick] (6.2,1.9) -- (6.2,0.5) -- (1.4,0.5) |- (B.in 1);
  \draw[thick] (6.2,-1.9) -- (6.2,-0.5) -- (1.6,-0.5) |- (A.in 2);
  \node[font=\scriptsize,anchor=south] at (4.0,0.55) {$\overline{\phi_1}$ delayed --- ``$\phi_1$ has fallen''};
  \node[font=\scriptsize,anchor=north] at (4.0,-0.55) {$\overline{\phi_2}$ delayed --- ``$\phi_2$ has fallen''};

  \node[font=\scriptsize,anchor=west] at (-1.3,3.05)
    {every wire is 1 bit; $\phi_1=\text{clk}\wedge\overline{\phi_2}$, \ $\phi_2=\overline{\text{clk}}\wedge\overline{\phi_1}$, so $\phi_1\phi_2=0$ identically};

  % ================= waveforms =================
  \draw[gray!55,dashed] (0.4,-4.15) -- (0.4,-7.55);
  \draw[gray!55,dashed] (2.6,-4.15) -- (2.6,-7.55);
  \draw[gray!55,dashed] (3.9,-4.15) -- (3.9,-7.55);
  \fill[red!12] (2.6,-7.45) rectangle (3.9,-4.35);

  \node[anchor=east] at (-0.15,-4.55) {clk};
  \draw[thick] (-0.1,-4.35) -- (0.4,-4.35) -- (0.4,-4.95) -- (7.4,-4.95);

  \node[anchor=east] at (-0.15,-5.75) {$\phi_1$};
  \draw[thick] (-0.1,-5.55) -- (2.6,-5.55) -- (2.6,-6.15) -- (7.4,-6.15);

  \node[anchor=east] at (-0.15,-7.05) {$\phi_2$};
  \draw[thick] (-0.1,-7.45) -- (3.9,-7.45) -- (3.9,-6.85) -- (7.4,-6.85);

  \draw[<->] (0.4,-5.25) -- (2.6,-5.25);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (1.5,-5.27) {$t_{\mathrm{nand}}+t_{\mathrm{inv}}$};
  \draw[<->] (2.6,-6.50) -- (3.9,-6.50);
  \node[font=\scriptsize,anchor=west,inner sep=3pt] at (4.0,-6.50) {$t_{\mathrm{nov}}=t_d+t_{\mathrm{nand}}$};
  \node[font=\scriptsize,anchor=north west,align=left] at (-0.1,-7.75)
    {$\phi_2$ waits for $\overline{\phi_1}$ to arrive high --- the gap is an observed event, not a matched-delay assumption};
\end{circuitikz}
\end{document}
```

*Own construction. The loop carries the phases active-low, which is what lets a NAND implement $\phi_1=\text{clk}\wedge\overline{\phi_2}$; the final inverter on each side is where $\phi_1,\phi_2$ come out.*

**A matched delay line does not produce non-overlap, it produces a hope.** The naive generator is $\phi_1=\text{clk}$ and $\phi_2$ = an inverted-and-delayed copy, with the gap set by *matching* the delay against the clock edge. Rise/fall asymmetry, the receiving gate's switching threshold, duty distortion in the incoming clock and independent PVT drift on the two legs all move the crossing point, and nothing in the circuit stops the gap from going negative. When it does, both latch banks of a [[Two-Phase Latch Pipeline]] are transparent at once, two pipeline stages merge into one combinational cone, and data races through. That failure does not surface as negative slack — it surfaces as wrong data, in silicon.

**Replace the assumption with an acknowledgement.** Write the intent as a pair of Boolean equations on 1-bit signals: $\phi_1=\text{clk}\wedge\overline{\phi_2}$ and $\phi_2=\overline{\text{clk}}\wedge\overline{\phi_1}$. Their product is

$$\phi_1\phi_2=(\text{clk}\wedge\overline{\phi_2})\wedge\phi_2=\text{clk}\wedge(\overline{\phi_2}\wedge\phi_2)=0$$

by associativity and then complementation. Nothing in that argument mentions a delay, so it holds for **any** delay inserted anywhere in the loop — the exclusion is structural. Applying De Morgan to the first equation, $\overline{\phi_1}=\overline{\text{clk}\wedge\overline{\phi_2}}=\text{NAND}(\text{clk},\overline{\phi_2})$, so a NAND implements it directly *provided the loop carries the complemented phases*. That is the whole reason the schematic's internal nodes are $\overline{\phi_1},\overline{\phi_2}$ and each phase is tapped through one final inverter; wire the true phases back and you get $\phi_1=\text{clk}\wedge\phi_2$, which is an overlap generator.

**The delay chain sets the gap; the topology sets the exclusion.** Let $t_n$ be a NAND delay, $t_i$ an inverter delay, and $t_A,t_B$ the delays of the two chains ($t_A$ carries $\overline{\phi_1}$ to NAND-B, $t_B$ carries $\overline{\phi_2}$ to NAND-A). Walk the clk falling edge at time $DT$, where $D$ is the incoming duty cycle: NAND-A sees clk low and drives $\overline{\phi_1}$ high at $DT+t_n$, so $\phi_1$ falls at $DT+t_n+t_i$. NAND-B cannot respond until that high level has crawled through chain A, arriving at $DT+t_n+t_A$; then $\overline{\phi_2}$ falls at $DT+2t_n+t_A$ and $\phi_2$ rises at $DT+2t_n+t_A+t_i$. Subtracting, the gap is $t_n+t_A$ — the $DT$ and the $t_i$ cancel, so **the gap does not depend on the clock at all**. Repeating for the rising edge gives $t_n+t_B$ by the identical cancellation.

> [!important] The failure direction is toward safety
> $t_{\mathrm{nov}}$ is a *causal lower bound*, not a target. NAND-B is physically incapable of raising $\phi_2$ before $\overline{\phi_1}$ has arrived, so a chain that runs slow at a cold, high-$V_t$ corner produces a **wider** gap, never a narrower one. Every mechanism that would break a matched-delay generator — process drift, temperature, threshold shift, $V_{DD}$ droop — costs borrow budget here and cannot cost hold margin. That asymmetry, not the gap itself, is why this topology is the one that ships.

**The input inverter is not free, and the two windows are not equal.** Carrying the same time-stamps forward, $\phi_1$ is high from $2t_i+2t_n+t_B$ to $DT+t_n+t_i$ and $\phi_2$ from $DT+2t_n+t_A+t_i$ to $T+2t_i+t_n$, giving

$$W_1=DT-t_i-(t_n+t_B),\qquad W_2=(1-D)T+t_i-(t_n+t_A)$$

The $\pm t_i$ is the cost of generating $\overline{\text{clk}}$ on one leg only: at a perfect $D=\tfrac12$ the two transparency windows still differ by $2t_i$. Since the borrow budget of [[Two-Phase Latch Pipeline]] is capped by the *smaller* window, $B=\min(W_1,W_2)-t_{su}-t_{sk}$, the idealised $W=\tfrac{T}{2}-t_{\mathrm{nov}}$ of [[Dual-Phase Latches]] is the average of the two and overstates the budget by $t_i$. The repair is the calibration knob: **make the two chains unequal.** $t_A$ and $t_B$ are independent, so setting $t_B=t_A-t_i$ equalises the windows at $D=\tfrac12$, and skewing them further compensates a known duty distortion. Sizing them equal because the drawing looks symmetric is the mistake.

**One gate is always forced, so the loop is not bistable.** This is the same cross-coupled pair as an [[SR Latch]], and the resemblance is where the intuition goes wrong. With clk held high, $\overline{\text{clk}}=0$ pins NAND-B's output to 1 regardless of feedback; with clk held low, NAND-A is pinned the same way. The loop is only *closed* during the transition, for the $t_n+t_A$ or $t_n+t_B$ it takes the acknowledgement to arrive. Consequently there is no forbidden state — $\overline{\phi_1}=\overline{\phi_2}=0$ (both phases high) demands clk $=1$ and $\overline{\phi_2}=1$ simultaneously, a contradiction, so it self-clears in one gate delay — and there is no metastability, because the resolving input is a full-swing external clock rather than a race between two internally generated signals. A power-on reset is unnecessary; the first clk edge sequences the circuit.

**On an FPGA, do not build this.** Three separate fabric reasons, any one of which is fatal. The delay chain has no meaning: a chain of LUT buffers is subject to optimisation, replication and unconstrained routing delay, and no vendor tool will let you constrain a *minimum* combinational delay. The feedback path is an unconstrained combinational loop, which static timing analysis cannot traverse and which the tool will either cut arbitrarily or flag and stop on. And the phases would have to leave the global clock network to pass through fabric logic and re-enter it, spending a BUFG and all its skew guarantees. The FPGA-native construction is to **oversample instead of delay**: run a $2^{k+1}\times$ clock from a PLL into a free-running counter and decode both phases from it, so the gap becomes an integer number of fast-clock periods and every path in the generator is a flop-to-flop path that STA understands. That is what the Spade block below does. It costs a PLL output and it quantises $t_{\mathrm{nov}}$ to one fast-clock period — consistent with the verdict in [[Dual-Phase Latches]] that two-phase latch pipelining is close to a non-starter on commercial FPGAs.

$$\boxed{\ t_{\mathrm{nov}}^{\downarrow\phi_1}=t_n+t_A,\quad t_{\mathrm{nov}}^{\downarrow\phi_2}=t_n+t_B,\quad W_1+W_2=T-t_{\mathrm{nov}}^{\downarrow\phi_1}-t_{\mathrm{nov}}^{\downarrow\phi_2}\ }$$

The last identity is the trade in its sharpest form: the two gaps and the two transparency windows partition one clock period exactly, so every picosecond of hold margin bought at the generator is a picosecond removed from the borrow budget $B$ downstream, with no slack anywhere in between.

## When it breaks

- **The gap is guaranteed at the output pins, not at the latch clock pins.** Two clock trees with insertion delays $t_{\text{ins},1}\ne t_{\text{ins},2}$ subtract the mismatch straight out of the gap, $t_{\mathrm{nov}}^{\text{eff}}=t_{\mathrm{nov}}-|t_{\text{ins},1}-t_{\text{ins},2}|$, and it can go negative at the leaves while the generator's own waveform is perfect. A single AND gate in one phase's tree produced 2.63 ns of skew against 0.18 ns for the ungated variant in the flow measured in [[Dual-Phase Latches]] — orders of magnitude more than any gap you would generate. Budget the trees before sizing the chains.
- **Never gate inside the loop.** A [[Clock-Gated Latch Bank]] must be gated *downstream* of the generator. Gating a feedback leg means the acknowledgement never returns, and the other phase stalls high permanently — a deadlock, not a glitch.
- **$t_{\mathrm{nov}}$ is absolute, $T$ is not.** The gap is a gate-delay sum and does not shrink with the period, so the fraction of the cycle it consumes grows as $1/T$. Past some frequency the generator eats more borrow budget than the two-phase discipline was buying.
- **Opposite signoff corners.** Hold margin needs the gap large, so it closes at the *fast* chain corner; the borrow budget needs the windows large, so it closes at the *slow* chain corner. Both must be run and they pull in opposite directions — a single-corner sign-off on this block is meaningless.
- **The generator stops working if the chain outruns the half period.** $W_1$ or $W_2$ going negative means the acknowledgement arrives after the next clk edge; the loop then swallows edges and the phases degenerate rather than merely narrowing.
- **Duty distortion lands entirely on $W_1$ vs $W_2$.** The gaps are immune to $D$ but the windows are not, and the smaller window sets $B$ — see [[Clock Skew and Jitter]] for the jitter half of the same accounting.

## RTL (Spade)

The gate-level circuit is not expressible, but not for the reason one expects. The direct transcription fails to name-resolve, since `let` bindings are not in scope in their own initialiser:

```spade
fn nonoverlap(clk: bool) -> (bool, bool) {
    let phi1 = clk && !phi2;
    let phi2 = !clk && !phi1;
    (phi1, phi2)
}
```

```
error: Use of undeclared name phi2
2 │     let phi1 = clk && !phi2;
  │                        ^^^^ Undeclared name
```

A forward declaration removes that objection entirely, and the loop compiles:

```spade
entity nonoverlap(clk: bool) -> (bool, bool) {
    decl phi2;
    let phi1 = clk && !phi2;
    let phi2 = !clk && !phi1;
    (phi1, phi2)
}
```

It lowers to `assign phi1 = clk & ~phi2; assign phi2 = ~clk & ~phi1;` — a genuine combinational loop, which simulates without oscillating precisely because of the "one gate is always forced" argument above. Simulated over 200 random `clk` values, `phi1 && phi2` never occurs, so the exclusion property survives into RTL. **The dead time is identically zero.** What Spade cannot express is not the feedback, it is $t_d$: RTL has no unit of time, `#5` is simulation-only in Verilog and unsynthesizable, and a delay chain written as a chain of buffers is exactly what every synthesis tool is built to delete. This block is a physical-delay circuit wearing a logic-gate costume, and $t_{\mathrm{nov}}$ — its entire reason to exist — lives in the one dimension no HDL models.

The structure Spade *is* native at is the oversampled decode, which trades the delay chain for a counter and is the correct answer on FPGA anyway:

```spade
/// Two non-overlapping phases decoded from a 2^(N+1)-times oversampled clock.
/// Each phase is high for 2^N - gap fast ticks; `gap` fast ticks of dead time
/// sit on both edges, so t_nov = gap * T_fast by construction.
entity two_phase<#uint N>(clk: clock, rst: bool, gap: uint<N>) -> (bool, bool) {
    reg(clk) cnt: uint<{N + 1}> reset(rst: 0) = trunc(cnt + 1);
    let half = cnt.msb();
    let pos: uint<N> = cnt.as_bits()[0..N].as_uint();
    let open = !(pos + gap).msb();
    (open && !half, open && half)
}
```

`cnt` is the whole circuit's state: $N+1$ bits free-running on the fast clock, wrapping by `trunc` so the period is exactly $2^{N+1}$ fast ticks with no comparator. Its MSB is the half-period selector — `half` low is $\phi_1$'s half, high is $\phi_2$'s — and the low $N$ bits are the position `pos` inside that half, so the two phases are the same window decoded against opposite values of one bit. `open` is the dead-time test done branchlessly: `pos + gap` widens to $N+1$ bits, and its MSB is set exactly when $\texttt{pos}\ge 2^N-\texttt{gap}$, i.e. in the last `gap` ticks of each half. Both outputs are combinational off `cnt`, so the phase edges carry one register's clock-to-Q and nothing else, and `gap` is a live input — a runtime-writable $t_{\mathrm{nov}}$, which is the counter-based analogue of the tapped delay chain in a [[Programmable Local Clock Buffer]]. What synthesis does differently from the drawing is everything: there is no cross-coupling and no acknowledgement left, only a counter and two AND gates. Mutual exclusion is now a property of the decode, holding for every `gap` including `gap = 0`, where the phases meet edge-to-edge with no dead time at all.

> [!warning] No measured $t_d$ or $t_{\mathrm{nov}}$ numbers in the available sources
> The only figure in reach is the $t_{\mathrm{nov}}=30$ ps used in the worked example of [[Dual-Phase Latches]], which is an illustrative value chosen to make the arithmetic clean, not a measurement of any library's generator. Sizing a real chain needs a characterised cell library and both extreme corners, and no such data appears in the material this vault has.

## Related Notes (with context)

- [[Two-Phase Latch Pipeline]] – supports: the consumer of $\phi_1,\phi_2$; $t_{\mathrm{nov}}$ appears as a subtraction in its borrow budget and as an addition in its hold margin.
- [[Dual-Phase Latches]] – depends-on: the borrow and race-through constraints this circuit's one knob moves.
- [[SR Latch]] – compares: same cross-coupled pair, but clk pins one gate in both steady states, so there is no forbidden state and no metastability.
- [[Clock Skew and Jitter]] – depends-on: the generated gap survives only what the two trees' insertion mismatch and jitter leave of it.
- [[Clock Pulse Generator]] – compares: the single-phase answer to the same problem, where one delayed edge suffices because there is no second phase to exclude.
- [[Programmable Local Clock Buffer]] – extends: moves the tap selection to the leaf, making $t_{\mathrm{nov}}$ per-block and tunable after fabrication.
- [[Clock-Gated Latch Bank]] – counter-example: gating one phase is what re-opens the gap this circuit closed, and gating inside the loop deadlocks it.
- [[Choosing a Latch Timing Scheme]] – compares: where the $t_{\mathrm{nov}}$-versus-$B$ split sits against pulsed and edge-triggered alternatives.

## References

- [[Dual-Phase Latches]] — §"The two-phase scheme" for $W=\tfrac{T}{2}-t_{\mathrm{nov}}$ and the phase grid; §"The costs" for the race-through inequality $\delta_{dq}+\delta_{i+1}\ge t_h+t_{sk}-t_{\mathrm{nov}}$, the borrow budget $B=\tfrac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$, the 2.63 ns / 0.18 ns gated-versus-ungated skew measurement, and the FPGA verdict.
- Weste & Harris, *CMOS VLSI Design: A Circuits and Systems Perspective*, 4th ed. — two-phase non-overlapping clock generation and the delay-chain sizing trade.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, 2nd ed., Ch. 10 — the cross-coupled generator and the failure mode of matched-delay clock generation.
- Wakerly, *Digital Design: Principles and Practices* — cross-coupled NAND behaviour and the forbidden-state argument this circuit escapes.
- Spade 0.19.0, verified locally: the `decl` form of the loop compiles and simulates; the plain `let` form does not resolve.
