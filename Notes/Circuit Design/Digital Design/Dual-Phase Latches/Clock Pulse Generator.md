---
title: Clock Pulse Generator
description: "Delay chain plus AND producing the narrow t_p pulse for a pulsed-latch cluster; area and clock energy are amortised over the latches it drives, and its width sets both the borrow window and the hold requirement."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, dual-phase-latches]
aliases:
  - Pulser
  - Pulse Generator
  - Clock Pulser
  - Local Pulse Generator
---

# Clock Pulse Generator

A leaf-level combinational cell that ANDs the clock with a delayed copy of its own complement, so the width of the pulse it emits is set by a local inverter chain rather than by the duty cycle of the clock that arrives.

```tikz title="Clock pulse generator: an odd inverter chain feeding one input of an AND, and the resulting t_p-wide pulse against clk"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  % ================= schematic: delay chain + AND =================
  \node[anchor=east] at (-0.05,0) {$clk$~[1]};
  \draw[thick] (0,0) -- (1.0,0);
  \fill (1.0,0) circle (0.06);

  \node[and port] (A) at (6.6,0.15) {};
  \draw[thick] (1.0,0) -- (1.0,0.85) -| (A.in 1);

  \node[not port] (n1) at (2.1,-1.5) {};
  \node[not port] (n2) at (3.5,-1.5) {};
  \node[not port] (n3) at (4.9,-1.5) {};
  \draw[thick] (1.0,0) -- (1.0,-1.5) -- (n1.in);
  \draw[thick] (n1.out) -- (n2.in);
  \draw[thick] (n2.out) -- (n3.in);
  \draw[thick] (n3.out) -- (5.9,-1.5) |- (A.in 2);
  \node[font=\scriptsize,anchor=north] at (3.5,-2.35)
    {odd inverter chain: delay $t_d$, and the inversion the AND needs};
  \node[font=\scriptsize,anchor=west] at (6.0,-0.85) {$\overline{clk}(t{-}t_d)$~[1]};

  \draw[thick,->] (A.out) -- (8.4,0.15);
  \node[font=\scriptsize,anchor=south] at (7.7,0.20) {$\phi_p$~[1]};
  \node[font=\scriptsize,anchor=north,align=center] at (7.7,0.05)
    {to a whole latch\\cluster};
  \node[font=\scriptsize,anchor=south] at (3.3,0.87) {$clk$~[1], undelayed};

  % ================= waveforms =================
  \begin{scope}[xshift=0.2cm,yshift=-5.1cm,x=0.95cm]
    \foreach \t in {0,0.7,4,4.7}
      \draw[gray!55,dashed] (\t,0.75) -- (\t,-2.55);

    % clk
    \node[anchor=east,font=\small] at (-0.95,0.28) {$clk$};
    \draw[thick] (-0.9,0)--(0,0)--(0,0.55)--(2,0.55)--(2,0)--(4,0)
                --(4,0.55)--(6,0.55)--(6,0)--(7.4,0);
    % delayed complement
    \node[anchor=east,font=\small] at (-0.95,-1.02) {$\overline{clk}(t{-}t_d)$};
    \draw[thick] (-0.9,-0.75)--(0.7,-0.75)--(0.7,-1.3)--(2.7,-1.3)--(2.7,-0.75)
                --(4.7,-0.75)--(4.7,-1.3)--(6.7,-1.3)--(6.7,-0.75)--(7.4,-0.75);
    % pulse
    \node[anchor=east,font=\small] at (-0.95,-2.22) {$\phi_p$};
    \fill[red!30] (0,-2.5) rectangle (0.7,-1.95);
    \fill[red!30] (4,-2.5) rectangle (4.7,-1.95);
    \draw[thick] (-0.9,-2.5)--(0,-2.5)--(0,-1.95)--(0.7,-1.95)--(0.7,-2.5)
                --(4,-2.5)--(4,-1.95)--(4.7,-1.95)--(4.7,-2.5)--(7.4,-2.5);

    % t_d annotation
    \draw[<->] (0,-0.62) -- (0.7,-0.62);
    \node[font=\scriptsize,anchor=south,inner sep=1pt] at (0.35,-0.60) {$t_d$};
    % t_p annotation
    \draw[<->] (0,-1.82) -- (0.7,-1.82);
    \node[font=\scriptsize,anchor=south,inner sep=1pt] at (0.35,-1.80) {$t_p=t_d$};

    % minimum write width the latch demands
    \draw[thick,|-|] (4,-2.80) -- (4.42,-2.80);
    \node[font=\scriptsize,anchor=west] at (4.95,-2.80)
      {$t_w$: latch minimum write width --- $t_p$ must cover it at every corner};

    % duty-cycle immunity
    \draw[<->] (0,0.68) -- (2,0.68);
    \node[font=\scriptsize,anchor=south,inner sep=1pt] at (1.0,0.70) {$T_{\mathrm{high}}$};
    \node[font=\scriptsize,anchor=west] at (2.4,1.40)
      {pulse ends on $t_d$, not on the clock's falling edge:};
    \node[font=\scriptsize,anchor=west] at (2.4,1.06)
      {$t_p$ is independent of duty cycle while $T_{\mathrm{high}}>t_d$};
  \end{scope}
\end{circuitikz}
\end{document}
```

**The narrow clock cannot be distributed, so it has to be manufactured at the leaf.** The obvious way to clock a [[Pulsed Latch]] is to broadcast a clock whose high time already equals $t_p$. It does not survive the trip. A buffer chain preserves *edge positions* to within its skew budget but does not preserve *high time*: every stage has unequal rise and fall drive, and every net has an RC that filters the shorter of the two intervals harder, so a pulse a few FO4 wide shrinks monotonically down the tree and past some depth arrives as nothing at all. What the tree does transport reliably is a roughly 50 %-duty waveform, where both intervals are large compared with any single stage's asymmetry. So the discipline splits: distribute the robust waveform globally, and synthesise the fragile one locally, one generator per cluster of latches. Everything else in this note follows from that split — pulse width becomes a *local* quantity, with local process variation, local supply noise and a local mismatch budget, and it stops being a property of the clock at all.

**The naive Boolean form is identically zero, and the delay is the only thing that saves it.** Complementation gives $x \wedge \bar{x} = 0$ for every $x$, so a gate wired to AND the clock with its own inverse emits a constant $0$ in any zero-delay semantics. The pulse exists purely because the complement arriving at the second input is *stale*. Writing the delayed signal explicitly,

$$\phi_p(t) \;=\; clk(t)\;\wedge\;\overline{clk}(t-t_d)$$

the two operands disagree exactly on $[t_r,\,t_r+t_d]$ after each rising edge $t_r$: $clk$ has already gone high, the chain has not yet driven its output low. This is a **static-0 hazard** in the sense of [[Static Hazards]] — the same unequal-reconvergent-path glitch that combinational design spends effort eliminating — built deliberately, sized on purpose, and used as the output. All three signals are 1 bit; there is nothing numeric here, no width growth and no rounding, so none of [[Number Formats]] applies.

**Odd inversion count is a constraint, not a style choice.** The AND needs the complement, so the chain length must be odd, and the coarse tuning knob for $t_p$ is therefore adding or removing inverters *in pairs* — width is quantised in units of roughly $2t_{inv}$. Fine granularity has to come from somewhere else: loading the intermediate nodes with capacitance, weakening (current-starving) the stages, or replacing the chain with a NAND fed by a longer chain. A three-inverter chain is the canonical minimum, since a single inverter's delay is usually below the latch's minimum write width.

**The width is squeezed from both sides, and the two bounds move in opposite directions.** The lower bound is the latch's minimum write width $t_w$: the pass gate must charge the storage node through its own $RC$ and overpower the keeper, and if the pulse closes first the latch either holds the old value or lands metastable. The upper bound is hold. Carrying the pulsed-latch constraints from [[Dual-Phase Latches]] across, the borrow window and the minimum-delay requirement are

$$B_p \;=\; t_p - t_{su} - t_{sk}, \qquad\qquad \delta_{\min} \;\ge\; t_p + t_h + t_{sk}$$

Both are affine in $t_p$ with slope $+1$. Adding a picosecond of pulse width buys exactly one picosecond of time borrowing and demands exactly one more picosecond of padding on every short path in the cluster — **there is no leverage in this trade, only a choice of where to spend**. With the worked numbers from the long-form treatment ($t_p = 90$, $t_{su} = 25$, $t_{sk} = 15$ ps) the generator is worth $B_p = 50$ ps of borrow, which is what turns a 390 ps flop hop into a 270 ps pulsed-latch hop; the same 90 ps is added verbatim to the hold requirement of every path the cluster launches.

**Duty-cycle distortion is rejected, and that is the whole robustness argument.** The falling edge of $\phi_p$ is produced by the delay chain, not by the clock, so it does not move when the incoming duty cycle does. The only way the clock's own falling edge can reach the output is by truncating the pulse before the chain does:

$$t_p \;=\; \min\!\big(t_d,\; T_{\mathrm{high}}\big), \qquad\text{and re-arming needs}\quad T_{\mathrm{low}} > t_d$$

Since $t_d$ is a few FO4 and $T/2$ is tens of FO4, both conditions hold with an order of magnitude to spare, and duty distortion accumulated over the tree is simply invisible at the latch. The same argument covers jitter: cycle-to-cycle jitter displaces $t_r$, and the direct and delayed inputs are displaced together, so it modulates the pulse's *position* but not its *width*. What does modulate the width is anything that changes gate delay inside the $t_d$ window itself — supply droop with a time constant comparable to $t_d$, and local $V_t$ mismatch between the chain and the latch it drives. See [[Clock Skew and Jitter]] for the position budget; the width budget is a separate, purely local one.

**Everything the generator costs is divided by the cluster it drives.** The cell has area, and it toggles at the full clock rate driving a local net, so it burns real clock energy. Against that, a [[Pulsed Latch]] presents roughly half the clocked transistors of a master–slave flop — around $-40\%$ clock-pin energy per cell. With $M$ latches on one generator, the local clock energy per cycle is $M\,E_{\mathrm{latch}} + E_{\mathrm{pulser}}$ against the flop baseline $M\,E_{\mathrm{flop}}$, so the scheme only pays above

$$M^{*} \;=\; \frac{E_{\mathrm{pulser}}}{E_{\mathrm{flop}} - E_{\mathrm{latch}}}$$

which is why pulsed latches are deployed as *banks* — a datapath register, a register-file write port, a FIFO stage — and essentially never as a single scattered bit. Below $M^{*}$ the generator is pure overhead and the flop wins outright.

> [!warning] The break-even cluster size is not in the sources
> $M^{*}$ above is the correct model, but neither the long-form note nor the canonical texts give characterised $E_{\mathrm{pulser}}$ or a recommended $M$. Published pulsed-latch flows report only the *net* result after amortisation (7.3 % average total-power reduction at 45 nm, range 4.3–11.2 %). Treat the cluster size as something to extract from your own library, not a number to quote.

**Cluster size has a second ceiling that is not about energy.** The pulse has to reach every latch in the cluster as a pulse. Along the local net the $RC$ that filters duty cycle in the global tree is at work again, so the far end sees both a later edge — ordinary local skew, which eats $t_{sk}$ in both inequalities above — and a *narrower* pulse, which eats directly into the $t_w$ margin. The cluster radius is therefore bounded by whichever of the two runs out first, and the check is not the usual skew check: a tool that verifies arrival times at every latch pin can still miss a pulse that has eroded below the library's `min_pulse_width` on the last leaf.

**Widening the AND turns the generator into the cluster's clock gate and its width control.** Adding an enable input makes one gate stop $M$ latches, which is where most of the clock-power saving in a [[Clock-Gated Latch Bank]] actually comes from; the enable must be glitch-free for the same reason as any [[Combinational Logic]] clock gate, since an enable edge landing inside the clock's high time emits a runt pulse rather than no pulse. Bringing several taps of the delay chain out to a multiplexer makes $t_p$ selectable, which is the core of a [[Programmable Local Clock Buffer]]. POWER6 shipped exactly this — three selectable widths of 2.9 / 4.2 / 5.2 FO4 — so the part could be tuned on the bench. The catch follows from $\delta_{\min} \ge t_p + t_h + t_{sk}$: hold padding is inserted at design time against *one* chosen setting, and every wider setting spends margin the netlist was never padded for. A width mux is a diagnostic knob with a documented ceiling, not a shipping configuration option.

**On an FPGA the circuit is not merely expensive, it is actively deleted.** Synthesis sees $clk \wedge \overline{clk}$, applies complementation exactly as above, proves the cone constant $0$, and removes it — the delay chain has no meaning to a tool whose delay model is a post-route annotation, not an input. Surviving requires `KEEP`/`DONT_TOUCH` on every node of the chain, and what survives is a delay that is an artefact of placement and routing with a PVT spread far wider than any ASIC inverter chain, plus a combinational path on a clock net that the timing engine will not sign off. The only calibrated delay elements a commercial fabric offers live in the IO ring (`IDELAY`/`ODELAY`) or as PLL phase shift, neither of which is available at a leaf inside the array. This is a harder "no" than the [[Non-Overlapping Two-Phase Clock Generator]], which can at least be built from two PLL outputs: on [[FPGAs]] the pulsed latch has no clock source, and the free flop beside every LUT is the answer.

$$\boxed{\;\phi_p(t)=clk(t)\wedge\overline{clk}(t-t_d),\qquad t_p=\min(t_d,\,T_{\mathrm{high}}),\qquad t_w \;\le\; t_p \;\le\; \delta_{\min}-t_h-t_{sk}\;}$$

**When it breaks.**

- **Slow corner, and the two ends do not track.** At SS/low-$V_{DD}$/low-$T$ the chain slows, which widens $t_p$ — helpful — but the latch's $t_w$ slows too, and the two are different circuits: an inverter chain is a drive-to-load ratio, a latch write is a pass gate fighting a keeper. They track partially, never exactly. The corner that actually kills the design is fast chain against slow latch, which is local mismatch rather than a global corner and does not appear in a corner sweep at all.
- **The pulse is below `min_pulse_width` at some leaf.** Liberty models this and STA checks it, but only where the library author characterised it and only against the pulse the timing engine believes exists. Erosion along the local net is the common way to violate it silently.
- **Any glitch on $clk$ is a full-width write.** The generator has no edge-rejection: a spur wider than a couple of gate delays produces a complete $t_d$-wide pulse, and downstream the latch cannot tell it from a clock cycle.
- **$T_{\mathrm{high}}$ or $T_{\mathrm{low}}$ falls below $t_d$.** The first truncates the pulse to the clock's high time and silently reintroduces every duty-cycle dependence the circuit exists to remove; the second stops the chain re-arming and drops pulses entirely. Both bite when the clock is heavily divided, gated with a ragged enable, or slowed for debug — the failure appears at *low* frequency, which is the opposite of engineering intuition.
- **Hold, everywhere in the cluster at once.** Because $\delta_{\min}$ scales with $t_p$ and $t_p$ is a per-cluster constant, a width change is not a local edit: it re-opens min-delay on every short path the cluster launches. This is the single largest reason [[Choosing a Latch Timing Scheme]] lands on flops for anything not frequency-critical.
- **No cheap self-check.** The pulse is a picosecond-scale analog property of a specific placed cell. It is invisible to RTL simulation, invisible to gate-level simulation with unit delays, and only partially visible to STA. It is a SPICE-signoff item, and it stays one.

**RTL (Spade).**

The circuit is a delay, and Spade has no way to name one. The direct transcription does not resolve:

```
error: Use of undeclared name delay
  ┌─ direct.spade:2:13
  │
2 │     clk && !delay(clk)
  │             ^^^^^ Undeclared name
```

Dropping the delay to make it compile is worse than not compiling, because it succeeds. `fn pulser_zerodelay(clk: bool) -> bool { clk && !clk }` passes the compiler and lowers to

```verilog
assign _e_2174 = ~_e_2175;          // ~clk
assign _e_2182 = _e_2183 & _e_2184; // clk & ~clk
```

which is the drawing, gate for gate, and is identically $0$ — synthesis will constant-fold it away exactly as an FPGA tool does. This is a different limit from the combinational feedback that blocks a plain latch: there the language cannot express the *topology*, here it expresses the topology perfectly and cannot express the only thing that makes it work.

The nearest native structure replaces the analog delay element with a register, giving a synchronous one-shot whose width is counted in clock cycles instead of picoseconds:

```spade
entity pulse_gen(clk: clock, rst: bool, trig: bool, w: uint<4>) -> bool {
    reg(clk) prev reset(rst: false) = trig;
    let edge = trig && !prev;
    reg(clk) cnt: uint<4> reset(rst: 0) =
        if edge { w } else if cnt != 0 { trunc(cnt - 1) } else { 0 };
    cnt != 0
}
```

`prev` is the delay chain, `edge` is the AND, and `w` is the tap multiplexer of the programmable variant; `cnt` is `uint<4>`, so `cnt - 1` is `uint<5>` and must be truncated back. It is an `entity`, not a `fn`, because a register needs a clock. It reproduces two real properties — the pulse is retriggerable only on a *rising* edge, and its width is set by the delay element rather than by how long `trig` stays high — and it reproduces neither of the two that matter physically: the width is quantised to whole clock periods rather than to $2t_{inv}$, and it cannot be shorter than the clock it is derived from, which is the entire purpose of the real circuit. Simulated against a behavioural one-shot for 6229 cycles plus 7 directed width vectors including the asymmetric case (`w = 3` with `trig` held high for 12 cycles, which must still emit a 3-cycle pulse), 0 mismatches.

**Related Notes (with context):**

- [[Pulsed Latch]] – supports: the consumer, and the circuit whose $t_w$ sets the lower bound on $t_p$.
- [[Programmable Local Clock Buffer]] – extends: brings the delay-chain taps out to a mux so $t_p$ becomes a runtime setting.
- [[Clock-Gated Latch Bank]] – extends: widens the AND with an enable so one gate stops the whole cluster.
- [[Clock Skew and Jitter]] – depends-on: supplies $t_{sk}$, which appears in both the borrow and the hold bound, and the reason jitter moves the pulse without widening it.
- [[Non-Overlapping Two-Phase Clock Generator]] – compares: the same "make the awkward waveform locally" idea, but generating a phase relationship instead of a width.
- [[Static Hazards]] – counter-example: this is the glitch that hazard-free synthesis exists to remove, kept and sized on purpose.
- [[Choosing a Latch Timing Scheme]] – compares: where the pulser's amortisation and hold cost land against flops and full two-phase.
- [[Dual-Phase Latches]] – depends-on: the borrow and race-through inequalities the pulse width is squeezed between.
- [[FPGAs]] – counter-example: the fabric deletes the delay chain and offers no leaf-level calibrated delay to rebuild it with.

## References

No book source for this topic; written from canon and from the local long-form note.

- Weste & Harris, *CMOS VLSI Design*, sequential circuit design and clocking — pulsed latches, delay-chain pulse generators, minimum pulse width and pulse-width variation, pulse widths quoted in FO4.
- Mano & Ciletti, *Digital Design*, hazards in combinational circuits — the static-0 hazard that this circuit is.
- Wakerly, *Digital Design: Principles and Practices*, one-shots and pulse-mode circuits — retriggerable versus non-retriggerable behaviour and the edge-only trigger.
- Rabaey, Chandrakasan & Nikolić, *Digital Integrated Circuits*, timing issues in digital circuits — local clock generation, pulse erosion on distributed $RC$ nets.
- Local: [[0.3a) Dual-Phase Latches]], §"Trade-off table" (borrow $B_p = t_p - t_{su} - t_{sk}$, hold $\delta \ge t_p + t_h + t_{sk}$, 390 → 270 ps/hop, ~25 % area and ~40 % clock-pin energy per cell) and §"Industrial record" (POWER6 selectable 2.9 / 4.2 / 5.2 FO4 pulse widths; Itanium 2's ~1/6-cycle pulse; 7.3 % average power reduction at 45 nm after pulser and hold-buffer overhead).
