---
title: Programmable Local Clock Buffer
description: "POWER6's C1/C2 local clock buffer with delay-C1 cycle-stealing mode and three selectable pulse widths (2.9/4.2/5.2 FO4), so cycle boundaries can be moved in hardware to tune frequency after fabrication."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, dual-phase-latches]
aliases:
  - LCB
  - Local Clock Buffer
  - Programmable Local Clock Buffers
  - Local Clock Buffers
---

# Programmable Local Clock Buffer

The leaf cell of a two-phase clock tree that derives both latch phases from a single global grid clock, with the C1/C2 phase offset and the C2 pulse width chosen by scan-loaded configuration bits rather than by layout — the one sequencing element whose timing constants are still writable after the die exists.

```tikz title="Programmable local clock buffer: one gated global clock in, C1 and C2 out, with a delay-C1 bypass mux on the C1 path and a tap-selectable chopper on the C2 path, both steered by a scan-loaded configuration latch"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]

  % ================= clock gate =================
  \node[and port, scale=0.85] (cg) at (0.7,0) {};
  \draw[->] (-2.3,0.17) -- (cg.in 1);
  \node[anchor=south,font=\scriptsize] at (-1.5,0.19) {GCLK\,(1)};
  \draw[->] (-2.3,-0.95) -- (-0.5,-0.95) |- (cg.in 2);
  \node[anchor=north,font=\scriptsize] at (-1.4,-0.98) {$\mathit{act}\wedge\overline{\mathit{thold}}$};
  \coordinate (A) at (2.0,0);
  \draw (cg.out) -- (A);
  \fill (A) circle (1.5pt);
  \node[anchor=east,font=\scriptsize] at (1.92,0.14) {gated\,(1)};

  % ================= C1 path : delay-C1 cycle stealing =================
  \draw (A) -- (2.0,1.8);
  \fill (2.0,1.8) circle (1.5pt);
  \draw[->] (2.0,1.8) -- (2.9,1.8);
  \draw (2.9,2.15) rectangle (4.5,1.45);
  \node[font=\scriptsize] at (3.7,1.8) {delay $\tau_{c1}$};
  \draw (4.5,1.8) -- (5.3,1.8) -- (5.3,2.05) -- (5.7,2.05);
  \draw (2.0,1.8) -- (2.0,1.05) -- (5.3,1.05) -- (5.3,1.55) -- (5.7,1.55);
  \draw[fill=black!6] (5.7,2.25) rectangle (6.6,1.35);
  \node[font=\scriptsize,align=center] at (6.15,1.8) {2:1\\mux};
  \draw[->] (6.6,1.8) -- (8.4,1.8);
  \node[anchor=south,font=\scriptsize] at (7.6,1.84) {$C1$\,(1)};
  \node[anchor=west,font=\scriptsize] at (1.1,3.7)
    {delay-C1 mode: slides the L1 closing edge into the C2/C1 overlap};

  % ================= C2 path : programmable pulse chopper =================
  \draw[->] (2.0,0) -- (2.0,-1.8) -- (2.7,-1.8);
  \draw (2.7,-1.45) rectangle (4.6,-2.15);
  \node[font=\scriptsize,align=center] at (3.65,-1.8) {inverting delay\\chain, 3 taps};
  \draw[->] (4.6,-1.62) -- (5.3,-1.62);
  \draw[->] (4.6,-1.80) -- (5.3,-1.80);
  \draw[->] (4.6,-1.98) -- (5.3,-1.98);
  \draw[fill=black!6] (5.3,-1.35) rectangle (6.2,-2.25);
  \node[font=\scriptsize,align=center] at (5.75,-1.8) {4:1\\mux};
  \node[and port, scale=0.85] (ch) at (8.1,-1.55) {};
  \draw (6.2,-1.8) |- (ch.in 2);
  \fill (2.0,-0.55) circle (1.5pt);
  \draw (2.0,-0.55) -- (6.6,-0.55) |- (ch.in 1);
  \draw[->] (ch.out) -- (9.9,-1.55);
  \node[anchor=south,font=\scriptsize] at (9.3,-1.51) {$C2$\,(1)};
  \node[anchor=north west,font=\scriptsize,align=left] at (-0.6,-2.5)
    {$C2=\mathrm{gated}\wedge\overline{\mathrm{tap}}$\\
     taps: 2.9 / 4.2 / 5.2 FO4\\4th mux input: no chop};

  % ================= configuration latch =================
  \draw[fill=black!4] (1.5,-4.55) rectangle (4.6,-3.85);
  \node[font=\scriptsize,align=center] at (3.05,-4.20)
    {cfg[3:0] scan latch\\{\tiny\{wsel[1:0], pulse, dly\_c1\}}};
  \draw[->,dashed] (-1.4,-4.20) -- (1.5,-4.20);
  \node[anchor=south,font=\scriptsize] at (0.05,-4.16) {scan\,(4)};
  \draw[dashed] (4.6,-4.20) -- (10.9,-4.20);
  \draw[->,dashed] (10.9,-4.20) -- (10.9,3.0) -- (6.15,3.0) -- (6.15,2.25);
  \draw[->,dashed] (6.6,-4.20) -- (6.6,-2.75) -- (5.75,-2.75) -- (5.75,-2.25);
  \node[anchor=west,font=\scriptsize] at (11.0,0.4) {control\,(4)};

\end{circuitikz}
\end{document}
```

**Move the phase generator from the root to the leaf.** A [[Non-Overlapping Two-Phase Clock Generator]] at the root of the chip forces two balanced trees to every latch, with a *phase* relationship to hold as well as a skew budget — and the two trees see different latch loads, so their insertion delays differ. Distributing one grid clock and deriving $\phi_1,\phi_2$ locally collapses that to a single tree plus a small leaf cell replicated a few thousand times. Both the non-overlap gap $t_{\mathrm{nov}}$ and the transparency window $W$ then become *local* properties, set independently per latch bank instead of globally. The price is that every copy of the delay chain is an independent PVT sample, so the phase relationship the LCB produces is matched only to within local mismatch, not to within tree balance.

**The chopper turns a level into a pulse, and the pulse width is a delay, not a Boolean.** With $g$ the gated grid clock and $g_\tau$ the same net after an *odd* inverter chain of propagation delay $\tau$, the local pulse is

$$C2(t) \;=\; g(t)\wedge\overline{g_\tau(t)} \;=\; g(t)\wedge g(t-\tau)$$

using $\overline{g_\tau} = \overline{\overline{g(t-\tau)}} = g(t-\tau)$ by involution of complement — the odd chain supplies the inversion the AND needs, so no separate inverter is spent. The rising edge of $C2$ is the rising edge of $g$; the falling edge is $\tau$ later, because that is when the delayed copy falls. The width of the transparency window is therefore *exactly* the chain's propagation delay, which is why the number is quoted in FO4 rather than in picoseconds: FO4 is the unit that tracks the process the chain is built in. The chain is 1 bit wide throughout, as is $C1$, $C2$ and the grid clock; only the configuration bus is wider, at 4 bits.

**Making $\tau$ selectable makes the borrow window a runtime parameter — and the hold requirement with it.** From the [[Pulsed Latch]] constraint, a latch clocked by a pulse of width $t_p$ has borrow budget and minimum-delay requirement

$$B_p \;=\; t_p - t_{su} - t_{sk}, \qquad \delta_{dq}+\delta_{i+1} \;\ge\; t_p + t_h + t_{sk}$$

Both are affine in $t_p$ with the *same* slope and opposite sign of benefit: every picosecond added to the pulse buys a picosecond of time borrowing and costs a picosecond of hold margin. A fixed-width pulser has to guess that split at tapeout. POWER6 refused to guess and built three taps — 2.9, 4.2 and 5.2 FO4 — into the mux, so the split could be re-chosen in the lab against measured silicon.

$$\boxed{\;B_p(\text{wsel}) \;=\; t_p(\text{wsel}) - t_{su} - t_{sk},\qquad \delta_{\min}(\text{wsel}) \;=\; t_p(\text{wsel}) + t_h + t_{sk}\;}$$

**Delay-C1 mode moves the cycle boundary rather than the window around it.** The [[Two-Phase Latch Pipeline]] places latch $i$ on the grid at $t_i=(i-1)T/2$ and closes the run-length constraint as $\sum_{k=j}^{i} D_k \le L\,\tfrac{T}{2} + B$. Delaying $C1$ by $\tau_{c1}$ relative to $C2$ does not touch $B$ — it shifts the odd-indexed $t_i$ by $+\tau_{c1}$ and leaves the even ones alone. Runs that *start* on an L2 boundary and end on an L1 boundary gain $\tau_{c1}$ of budget; runs of the opposite parity lose exactly the same amount. This is useful skew, applied at the leaf and with the sign chosen per latch bank, and it is zero-sum by construction: the sum of the two run budgets is invariant, because $\tau_{c1}$ enters one with $+$ and the other with $-$. Note the mechanism is orthogonal to pulsing — delay-C1 works on level-sensitive C1/C2 with no chopper at all, which is why the 4:1 mux carries a no-chop input.

**Gating belongs in front of the split, not behind it.** The clock enable $\mathit{act}\wedge\overline{\mathit{thold}}$ is ANDed with the grid clock *once*, upstream of the C1/C2 fork, so both phases stop together and the enable's own delay is common to both. A [[Clock-Gated Latch Bank]] that gates one phase downstream instead puts an AND in a single phase's tree, and the measured cost of that asymmetry is 2.63 ns of skew against 0.18 ns for an ungated variant. The LCB's whole shape is an argument for gating at the point where the phases are still one signal.

> [!important] The knob exists because the model is wrong by a few percent, not because the model is unknown
> $t_p$, $\tau_{c1}$ and $t_{\mathrm{nov}}$ are all fully determined by the timing constraints above — you can compute the optimum before tapeout. What you cannot compute is the delay chain's actual FO4 on the die you got. The LCB is a calibration knob, not a design decision deferred; the design decision was made, and the knob exists to correct it against measurement.

**FPGAs have no counterpart.** The nearest fabric primitive is a global buffer with a clock enable (`BUFGCE` and relatives), which gates but neither chops nor delays; a phase offset has to come from a PLL/MMCM output, of which there are single digits per device and each of which serves a whole clock region rather than a latch bank. The LCB's entire premise — a cheap programmable phase generator replicated at every leaf — is an ASIC-only structure, and it is the concrete reason the [[Two-Phase Latch Pipeline]] is close to a non-starter on commercial FPGAs even though the timing theory carries over unchanged.

## When it breaks

- **The delay chain does not track the logic it is stealing time for.** An inverter chain and a 4-input NAND critical path derate differently across voltage and temperature, so a pulse width calibrated at one operating point is wrong at another. FO4 is a good unit, not an exact one.
- **Signoff cost multiplies.** Three widths $\times$ delay-C1 on/off $\times$ pulsed/level is eight timing configurations, all of which must close, and hold must close in the *worst* of them regardless of which one ships.
- **Granularity is coarser than the drawing suggests.** The configuration latch is shared across a group of LCBs, so tuning moves a region, not a bank. Local mismatch inside the region is not correctable by this mechanism at all.
- **Narrow pulses die in distribution.** The 2.9 FO4 setting only survives because $C2$ is generated at the leaf and travels a short distance. The same pulse launched from the root would not arrive.
- **Where a sibling takes over.** If the pulse never needs to change, a fixed [[Clock Pulse Generator]] amortised over a latch cluster is smaller, and if the phases never need to change, a root-level generator saves the replicated chain entirely.

> [!warning] Source ambiguity — hold padding target
> The long-form note records that POWER6's three pulse widths were built in "with padding done for the narrowest", while its own trade-off table states the hold requirement $\delta \ge t_p + t_h + t_{sk}$ *grows* with pulse width. Read literally these contradict: a part padded to $2.9\,\text{FO4} + t_h + t_{sk}$ races the moment the lab selects the 5.2 FO4 tap. The consistent reading is that padding was sized for the narrowest *margin*, i.e. the widest pulse. Not resolvable without the JSSC text.

## RTL (Spade)

`spade: not-expressible`, but not for the usual reason. There is no combinational feedback here — the obstruction is that the circuit's entire function is a *delay*, and delay has no value in Boolean algebra. Writing the chopper in RTL compiles cleanly:

```spade
entity chopper(clk: clock) -> bool {
    let c = unsafe { clk.as_bool() };
    let c_delayed = !!!c;          // three inverters == the delay chain, in RTL
    c && !c_delayed
}
```

and lowers to exactly the inverter chain, which is the problem. From the emitted Verilog:

```verilog
assign _e_2195 = ~_e_2196;        // c_delayed = ~~~c
assign _e_2203 = ~_e_2204;
assign \c_delayed  = _e_2211;
assign _e_2227 = _e_2228 & _e_2229;   // output = c & ~c_delayed
```

$c \wedge \overline{\overline{\overline{\overline{c}}}} = c \wedge c = c$ by involution: the "pulse" is the whole clock, and the buffer is a wire. Use an even chain instead and the same file compiles to $c \wedge \overline{c} = 0$ by complementation, i.e. a constant. Both degenerate cases compile, neither is a pulse, and no amount of RTL fixes it — the intended output is not a Boolean function of the inputs at all. Spade also cannot help here the way it can with latches: `clock` is a distinct type, convertible only under `unsafe { .. }`, precisely so that clock-path structures do not get written by accident.

What Spade *is* native at is the configuration plane — the scan-loaded latch and the decode that steers the two muxes, which is ordinary synthesizable logic:

```spade
/// cfg[0] = delay-C1 (cycle-stealing) mode
/// cfg[1] = pulsed mode (C1 held high, C2 chopped)
/// cfg[3:2] = pulse-width code: 0 -> 2.9 FO4, 1 -> 4.2 FO4, 2 and 3 -> 5.2 FO4
/// result[3:0] = one-hot tap select (bit 0 = no chop), [4] = delay-C1, [5] = clock enable
entity lcb_ctrl(clk: clock, scan_en: bool, scan_cfg: uint<4>,
                act: bool, thold: bool) -> uint<6>
{
    reg(clk) cfg: uint<4> initial(0) = if scan_en { scan_cfg } else { cfg };
    let b = cfg.as_bits();
    let dly_c1 = b[0];
    let pulse  = b[1];
    let wsel   = b[2..4].as_uint();
    let tap = [ !pulse,
                pulse && wsel == 0,
                pulse && wsel == 1,
                pulse && wsel >= 2 ];
    tap.concat([dly_c1, act && !thold]).as_uint()
}
```

`tap[0]` is the 4:1 mux's no-chop input in the diagram, `tap[1..3]` its three delay taps; `result[4]` drives the 2:1 mux on the $C1$ path and `result[5]` is the AND gate feeding the whole cell. The configuration latch is the only registered element — everything downstream is combinational, one bit wide, and lives on the clock net rather than the datapath. What this does *not* capture is every timing property that matters: it says which tap is selected, never what that tap is worth in picoseconds. The reserved code 3 folding onto the widest setting is a deliberate default-safe choice for setup, not for hold, since the widest pulse has the largest $\delta_{\min}$.

Synthesis would also do one thing the drawing does not: it treats `lcb_ctrl` as ordinary logic and the LCB proper as a hard macro, so the two never appear in the same netlist. The configuration bits cross that boundary as static control, which is what makes them a signoff *mode* rather than a timing arc.

## Related Notes

- [[Clock Pulse Generator]] – depends-on: this is that circuit with the delay chain tapped and a mux added, plus the C1 path.
- [[Clock Skew and Jitter]] – depends-on: the $t_{sk}$ term appearing in both $B_p$ and $\delta_{\min}$, and the reason a replicated leaf generator is a mismatch source.
- [[Pulsed Latch]] – supports: the sequencing element the C2 output clocks, and where $B_p$ and $\delta_{\min}$ are derived.
- [[Two-Phase Latch Pipeline]] – supports: the run-length constraint whose grid positions $t_i$ delay-C1 mode perturbs.
- [[Clock-Gated Latch Bank]] – counter-example: gates one phase downstream and pays 2.63 ns of skew for it; this cell gates upstream of the fork instead.
- [[Non-Overlapping Two-Phase Clock Generator]] – compares: the same two phases produced once at the root instead of locally, with one delay chain rather than thousands.
- [[LSSD Scan Latch Pair]] – supports: the scan chain that loads `cfg`, and the C1/C2 naming this cell inherits.
- [[Choosing a Latch Timing Scheme]] – compares: where post-silicon tunability sits against the fixed-timing alternatives.
- [[Dual-Phase Latches]] – the topic hub.

## References

- "Industrial record", [[Dual-Phase Latches]] — POWER6 C1/C2 clocking, delay-C1 cycle stealing, pulsed mode, the 2.9/4.2/5.2 FO4 pulse widths, and the 2.63 ns clock-gated skew figure.
- "The costs" and "Trade-off table", [[Dual-Phase Latches]] — $B_p = t_p-t_{su}-t_{sk}$, the hold requirement growing with pulse width, and the dual-tree distribution cost.
- Curtis et al., *Design and Implementation of the POWER6 Microprocessor*, IEEE JSSC 2008 — the primary source behind the industrial record above; not consulted directly here.
