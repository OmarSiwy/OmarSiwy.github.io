---
title: Pulsed Latch
description: "One transparent latch on the full-cycle grid clocked by a narrow pulse; buys a t_p - t_su - t_sk borrow window with a flop-like interface for STA, scan and LEC — the settlement nearly every high-frequency team lands on."
kind: circuit
status: seed
spade: simulated
tags: [digital, dual-phase-latches]
aliases:
  - "Pulsed Latches"
  - "Pulse-Triggered Latch"
  - "Pulsed-Latch Cell"
---

# Pulsed Latch

A single level-sensitive latch sitting where a flop would sit — one per boundary on the **full-cycle** grid — opened by a pulse of width $t_p \ll T$ rather than by a half-period phase, so it keeps a flop's one-state-point-per-boundary interface while still passing late data straight through.

```tikz title="Pulsed latch: one latch per full-cycle boundary, a shared pulser, and the borrow window carved out of the pulse"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  % ================= the cell: one latch per boundary, shared pulser =================
  \draw[->] (-1.0,0) -- (0,0);            \node[font=\scriptsize] at (-0.5,0.25) {$n$};
  \draw (0,-0.45) rectangle (1.5,0.45);   \node[font=\scriptsize] at (0.75,0) {logic $d_i$};
  \draw[->] (1.5,0) -- (2.2,0);           \node[font=\scriptsize] at (1.85,0.25) {$n$};
  \draw[fill=black!8] (2.2,-0.45) rectangle (3.0,0.45);
  \node[font=\scriptsize] at (2.6,0.16) {L};
  \node[font=\scriptsize] at (2.6,-0.20) {$n$};
  \draw[->] (3.0,0) -- (3.7,0);           \node[font=\scriptsize] at (3.35,0.25) {$n$};
  \draw (3.7,-0.45) rectangle (5.2,0.45);
  \node[font=\scriptsize] at (4.45,0) {logic $d_{i+1}$};
  \draw[->] (5.2,0) -- (5.9,0);           \node[font=\scriptsize] at (5.55,0.25) {$n$};

  % pulser feeding a whole cluster
  \draw[->] (-1.0,1.75) -- (-0.1,1.75);   \node[font=\scriptsize] at (-0.55,2.0) {$clk$~[1]};
  \draw (-0.1,1.35) rectangle (1.5,2.15);
  \node[font=\scriptsize] at (0.7,1.75) {pulser};
  \draw[thick] (1.5,1.75) -- (5.7,1.75);
  \node[font=\scriptsize,anchor=south] at (3.6,1.78) {$pulse$~[1], width $t_p$};
  \draw[->] (2.6,1.75) -- (2.6,0.45);
  \draw[->,dashed] (4.3,1.75) -- (4.3,1.05);
  \draw[->,dashed] (5.4,1.75) -- (5.4,1.05);
  \node[font=\scriptsize,anchor=north] at (4.85,1.02) {rest of the cluster};

  % ================= timing =================
  \draw[gray!55,dashed] (0,-1.15) -- (0,-5.1);
  \draw[gray!55,dashed] (0.6,-2.35) -- (0.6,-4.55);
  \draw[gray!55,dashed] (3,-1.15) -- (3,-3.95);
  \draw[gray!55,dashed] (3,-4.75) -- (3,-5.1);

  % clk
  \node[font=\scriptsize,anchor=east] at (-0.35,-1.7) {$clk$};
  \draw[thick] (-0.3,-2.0)--(0,-2.0)--(0,-1.4)--(1.5,-1.4)--(1.5,-2.0)--(3,-2.0)
              --(3,-1.4)--(4.5,-1.4)--(4.5,-2.0)--(6.0,-2.0);

  % pulse, with the borrow window shaded inside it
  \fill[red!30]   (0,-3.3) rectangle (0.38,-2.7);
  \fill[black!25] (0.38,-3.3) rectangle (0.6,-2.7);
  \fill[red!30]   (3,-3.3) rectangle (3.38,-2.7);
  \fill[black!25] (3.38,-3.3) rectangle (3.6,-2.7);
  \node[font=\scriptsize,anchor=east] at (-0.35,-3.0) {$pulse$};
  \draw[thick] (-0.3,-3.3)--(0,-3.3)--(0,-2.7)--(0.6,-2.7)--(0.6,-3.3)--(3,-3.3)
              --(3,-2.7)--(3.6,-2.7)--(3.6,-3.3)--(6.0,-3.3);
  \draw[<->] (0,-2.45) -- (0.6,-2.45);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (0.3,-2.44) {$t_p$};

  % borrow / setup breakdown
  \draw (0.19,-3.35) -- (0.19,-3.62) -- (-0.1,-3.62);
  \node[font=\scriptsize,anchor=east] at (-0.12,-3.62) {$B_p=t_p-t_{su}-t_{sk}$};
  \draw (0.49,-2.68) -- (0.85,-2.20);
  \node[font=\scriptsize,anchor=west] at (0.87,-2.18) {$t_{su}+t_{sk}$};
  \node[font=\scriptsize,anchor=west] at (0.75,-3.62)
    {data arriving inside the red band still walks straight through};

  % hold requirement runs past the close of the pulse
  \draw[->,thick] (0,-4.05) -- (0,-3.75);
  \draw[<->] (0,-4.15) -- (1.15,-4.15);
  \node[font=\scriptsize,anchor=west] at (1.2,-4.15)
    {min-delay requirement $\ \delta_{dq}+\delta_{i+1}\ \ge\ t_p+t_h+t_{sk}$};
  \draw[->,thick,red!75] (0,-4.55) -- (0.45,-4.55);
  \node[font=\scriptsize,anchor=west,red!75] at (1.2,-4.55)
    {a short path that finishes inside the pulse overwrites the datum};

  % period
  \draw[<->] (0,-5.05) -- (3,-5.05);
  \node[font=\scriptsize,anchor=south,inner sep=1pt] at (1.5,-5.04) {$T$};
  \node[font=\scriptsize,anchor=north,align=center] at (1.5,-5.12)
    {one latch per \emph{full} cycle: widening $t_p$ slides the red band\\
     and the min-delay arrow to the right together};
\end{circuitikz}
\end{document}
```

**Keep the latch, throw away the grid.** [[Two-Phase Latch Pipeline]] gets its speed from two changes at once: it makes the storage element transparent, *and* it halves the placement grid so latches land every $T/2$. Those are separable. A pulsed latch takes only the first: the boundary spacing stays at $T$, exactly where a [[Master-Slave D Flip-Flop]] would put it, and one latch replaces the master–slave pair. Everything downstream of that choice — one state point per boundary, one clock net, one scan cell, one LEC correspondence — is inherited from the flop discipline unchanged, which is why the sign-off cost is nearly nil and why this is the variant that actually ships.

**A narrow pulse is a phase you chose the width of.** The cell is the [[Level-Sensitive D Latch]] verbatim, $Q^{+} = pulse\cdot D + \overline{pulse}\cdot Q$, an $n$-bit bank being $n$ independent 1-bit slices sharing one 1-bit $pulse$ net with no interaction between slices. What changes is only the waveform on that net: instead of a $W \approx T/2$ level it carries a pulse of width $t_p$, typically an eighth to a sixth of the period, generated once per cluster by a [[Clock Pulse Generator]] and distributed on an ordinary single-phase tree. The pulser's area and clock energy divide over every latch it drives, so the per-bit overhead falls as the cluster grows — the reason pulsed latches are placed and clocked in banks rather than individually.

**The borrow window is what the pulse leaves over after setup.** Let $A_i$ be the arrival time at latch $i$'s D pin and $D_i = d_i + t_{dq}$ fold the latch's data-to-output delay into segment $i$, so all delays are $n$-bit-datapath worst-case paths. Latch $i$ opens at $t_i = (i-1)T$ and closes at $t_i + t_p$. Level-sensitivity gives the same recurrence as the two-phase case,

$$A_{i+1} = \max\big(t_i,\;A_i\big) + D_{i+1}$$

with the $\max$ doing the work: early data waits for the opening edge, late data walks straight through. Setup demands the data be stable $t_{su}$ before the *closing* edge, derated by skew $t_{sk}$:

$$A_i \;\le\; t_i + \underbrace{t_p - t_{su} - t_{sk}}_{\textstyle B_p}$$

so the borrow $b_i = \max(0, A_i - t_i)$ is capped at $B_p$. Unrolling the recurrence — the $\max$ is taken over the last latch that was *not* borrowing — gives $A_i = \max_{j\le i}\big(t_{j-1} + \sum_{k=j}^{i} D_k\big)$; substituting the grid $t_i = (i-1)T$ and cancelling collapses the system to one family of inequalities, with $L = i-j+1$ the length of the run.

**The full-cycle grid costs a factor of two against two-phase and buys back the entire flow.** The corresponding two-phase bound is $\sum_{[j,i]} D_k \le L\tfrac{T}{2} + B$ with $B = \tfrac{T}{2} - t_{\mathrm{nov}} - t_{su} - t_{sk}$: both the per-hop budget and the borrow window are roughly halved and doubled respectively relative to the pulsed form. Dividing the pulsed bound by $L$ gives $\overline{D}_{[j,i]} \le T + B_p/L$, and since $B_p$ is a small constant while the two-phase $B$ scales with $T$, the pulsed relaxation **vanishes as $L$ grows** while the two-phase one does not. Long runs of slow stages are exactly what two-phase is for; a single local hump is what a pulsed latch fixes.

**Both limits of $t_p$ recover a sibling.** Set $t_p = 0$: then $B_p = -(t_{su}+t_{sk})$ and the $L=1$ row reads $d_k + t_{dq} + t_{su} + t_{sk} \le T$, which is the edge-triggered flop constraint with $t_{cq}$ replaced by the latch's smaller $t_{dq}$ — a zero-width pulsed latch is a flop, and a slightly cheaper one. Push $t_p$ toward $T/2$ and $B_p$ approaches the two-phase $B$, but so does the min-delay requirement $\delta_{dq}+\delta_{i+1} \ge t_p + t_h + t_{sk}$, which becomes a half-period of mandatory padding on every short path in the block. The usable range is bounded on the right by hold, not by timing theory, which is why shipped parts sit at 2.9–5.2 FO4 (POWER6) or one sixth of a cycle (Itanium 2) rather than anywhere near $T/2$.

**One knob, two signs.** In two-phase the hold knob is the non-overlap $t_{\mathrm{nov}}$, which *reduces* the requirement $\delta_{dq}+\delta_{i+1} \ge t_h + t_{sk} - t_{\mathrm{nov}}$ and can drive it negative — free hold margin at the cost of $B$. A pulsed latch has no such gap: the same $t_p$ that opens the borrow window also extends the interval during which a short path can overwrite the datum, so widening it makes both quantities worse in the min-delay ledger and better in the max-delay one. That is why the pulsed latch has the **worst** hold exposure of the three schemes despite being the tamest in every other respect, and why hold-buffer insertion, not frequency, is what a pulsed-latch block spends its area on.

**On an FPGA none of this is available.** The fabric has no latch primitive, so the cell becomes a LUT with its output routed back to one of its own inputs — a combinational cycle that the timing engine must be told to break, occupying a LUT while the dedicated flop beside it sits unused ([[FPGAs]]). Worse, $t_p$ is a routed delay-chain width of order 100 ps that no vendor router will hold constant across placement, temperature and speed grade. Pulsed latches are an ASIC technique; on FPGA the honest answer is the free flop.

$$\boxed{\;\sum_{k=j}^{i} D_k \;\le\; L\,T + B_p,\qquad B_p = t_p - t_{su} - t_{sk}\;}$$

**Worked example.** Four unbalanced stages, $d = 220/180/300/200$ ps, so $D = (240,200,320,220)$ ps with $t_{dq}=20$; overheads $t_{su}=25$, $t_{sk}=15$, $t_p=90$, giving $B_p = 90-25-15 = 50$ ps. The constraint rearranges to $T \ge \big(\sum_{[j,i]} D - 50\big)/L$:

| $L$ | runs → required $T$ (ps) |
| --- | --- |
| 1 | $190,\;150,\;\mathbf{270},\;170$ |
| 2 | $195,\;235,\;245$ |
| 3 | $236.7,\;230$ |
| 4 | $232.5$ |

$T = \mathbf{270}$ ps, against $\max_i d_i + t_{cq}+t_{su}+t_{sk} = 300+45+30+15 = 390$ ps for flops on the same pipeline — a $1.44\times$ gain — and against $210$ ps per hop for full two-phase, which needs $T=420$ ps but sequences two stages inside it.

> [!important] A pulsed latch does not remove the max, it discounts it
> The binding row above is $L=1$, the same row that binds a flop: the single $320$ ps segment still sets the clock, merely relieved by its $50$ ps borrow. Two-phase on the same pipeline moves the binding row to $L=4$, where the *whole-pipeline average* sets the period and no individual stage does. That structural difference — which row of the table wins — is the real dividing line between the two schemes, and it is why a pulsed latch helps a pipeline with one slow stage and barely helps one that is slow everywhere.

**When it breaks.**

- **Hold, first and worst.** $\delta_{dq}+\delta_{i+1} \ge t_p + t_h + t_{sk}$ contains no $T$, so slowing the clock never fixes it, and $t_p$ makes it strictly harder. A block with many short logic paths pays for the borrow window in delay buffers and may give back the power saving entirely.
- **Pulse-width variation is a timing variable, not a constant.** $t_p$ comes from a delay chain and tracks P/V/T differently from the logic it gates. Below a minimum width the latch fails to capture at all; POWER6's answer was three lab-selectable widths with hold padding done for the narrowest, which is the honest way to close it and costs the margin of the widest setting.
- **The gain is bounded by $B_p/\!\max_i D_i$.** When the pipeline's imbalance is large the discount is a rounding error against the worst stage; when it is small there was nothing to borrow. Both ends favour flops on flow cost alone — see [[Choosing a Latch Timing Scheme]].
- **Clock gating lands on the pulser, not the latch.** Gating a pulse net means gating $clk$ upstream of the pulser, so the gate sits in the same tree the pulse is derived from and the gating check is against a pulse edge whose position depends on the delay chain. A [[Clock-Gated Latch Bank]] and a pulsed cluster share this problem.
- **Two pulsed latches in a combinational ring do not make a state machine.** Like any single-latch stage, the discipline needs a non-transparent interval on every loop; that is supplied here by $t_p \ll T$, and it disappears if a pulse ever widens toward the cycle. A latch that is transparent for the whole period is a wire.

**RTL (Spade).**

```spade
fn pulsed_latch<#uint W>(d: uint<W>, pulse: bool) -> uint<W> {
    decl q;
    let q = if pulse { d } else { q };
    q
}
```

`d` and `q` are the $n$-bit wires entering and leaving the shaded L box; `pulse` is the 1-bit net from the pulser, shared by every slice of the bank and by the rest of the cluster. `decl` forward-declares `q` without a driver, which is the primitive that closes a combinational cycle — without it, `let q = if pulse { d } else { q }` is `error: Use of undeclared name q`, because `let` bindings are ordered. It is a `fn`, not an `entity`: no `clock` in the signature and no `reg`, since the state lives in the topology. Synthesis emits exactly one continuous assignment per bank, `assign \q = \pulse ? \d : \q ;`, a genuine loop in the netlist that STA must be given a loop-breaker for. **Nothing in this block carries $t_p$** — the pulse width is the entire design parameter of a pulsed latch and it lives in the pulser's delay chain, invisible to any HDL; the RTL is bit-identical to a full-phase latch and to an enable flop, and only the waveform on `pulse` distinguishes the three.

Simulated with a concrete `plat8` wrapper against a behavioural `always @* if (pulse) qref = d;` reference: 8 named vectors plus a 3000-vector random sweep, 3008 total, zero failures. The named set includes the asymmetric pair $\mathtt{01}/\mathtt{80}$, which is what catches a bit-reversed bank, and three mid-pulse changes of `d` that a testbench sampling only on edges would pass either way.

**Related Notes (with context):**

- [[Level-Sensitive D Latch]] – depends-on: the cell itself, unchanged; only the waveform on its enable differs.
- [[Master-Slave D Flip-Flop]] – compares: the boundary this replaces one-for-one, and the $t_p \to 0$ limit of the constraint above.
- [[Clock Pulse Generator]] – depends-on: produces $t_p$, and its width variation is this circuit's dominant timing risk.
- [[Two-Phase Latch Pipeline]] – compares: same latch, half the grid — moves the binding constraint from $L=1$ to large $L$ at full flow cost.
- [[Programmable Local Clock Buffer]] – supports: makes $t_p$ selectable per cluster after fabrication, which is how POWER6 closed the hold/borrow trade in the lab.
- [[Choosing a Latch Timing Scheme]] – compares: where this sits against flop and full two-phase on frequency, hold and sign-off cost.
- [[LSSD Scan Latch Pair]] – counter-example: the DFT structure a pulsed latch specifically avoids needing, by keeping one state point per boundary.
- [[Clock-Gated Latch Bank]] – supports: the gating a pulsed cluster uses, applied upstream of the pulser rather than at the latch.
- [[Dual-Phase Latches]] – extends: the full constraint derivation, the flow costs, and the industrial record this note summarises.
- [[Error Accuracy]] – counter-example: a clocking discipline, so the arithmetic error is exactly $0$ ulp and no rounding analysis applies.

> [!warning] The per-cell area and clock-energy figures have no process node attached
> "~25 % smaller per cell" and "~40 % lower clock-pin energy per cell" against a flop appear in the source without a library or node. Only the block-level figure is qualified: 7.3 % average total-power reduction, 4.3–11.2 % range, 45 nm, including pulser and hold-buffer overhead. Use the per-cell numbers as ratios, never as a budget.

## References

- Local: [[0.3a) Dual-Phase Latches]], §"Trade-off table" (pulsed-latch column and the $L=1$ discount), §"Worked example" ($d=220/180/300/200$, $B_p=50$, $T=270$ ps), §"Industrial record" (Itanium 2 pulse width and deskew, POWER6 pulsed mode and FO4 widths, the pragmatic-settlement verdict).
- Naffziger et al., *The Implementation of the Itanium 2 Microprocessor*, IEEE JSSC 37(11), 2002 — pulsed latches at ~1/6 cycle (125 ps at 1.2 GHz), fuse-based deskew to 24 ps.
- Curtis et al., *Design and Implementation of the POWER6 Microprocessor*, IEEE JSSC 2008 — pulsed mode, 2.9/4.2/5.2 FO4 selectable pulse widths, hold padding for the narrowest.
- Consoli & Rabaey et al., *Pulsed-Latch Circuits to Push the Envelope of ASIC Design* — 7.3 % average power reduction at 45 nm including pulser and delay-buffer overhead.
- Harris, Horowitz & Liu, *Timing Analysis Including Clock Skew*, IEEE TCAD 18(11), 1999 — the setup/hold formalisation the recurrence above uses.
- Weste & Harris, *CMOS VLSI Design*, sequential circuit design — pulsed-latch cells, pulse generation and the minimum-pulse-width failure mode.
