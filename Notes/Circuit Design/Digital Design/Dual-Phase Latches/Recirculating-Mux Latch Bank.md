---
title: "Recirculating-Mux Latch Bank"
description: "Latch bank holding state by muxing Q back to D instead of gating the clock; keeps both clock trees symmetric (0.18 ns skew) but costs +299 % sequential cells and +142.7 % power, and failed to route on JPEG at 17325 latches."
kind: circuit
source: "0.3a) Dual-Phase Latches, §The costs; Pedroso et al., GLSVLSI 2026, Table 1"
status: seed
spade: simulated
tags: [digital, dual-phase-latches, enable, clock-gating, timing, power]
aliases:
  - "Recirculating Mux Latch Bank"
  - "Recirculation-Mux Latch Bank"
  - "Recirculation Mux"
  - "Enable Latch Bank"
  - "Mux-Feedback Latch Bank"
---

# Recirculating-Mux Latch Bank

An $n$-bit latch bank whose enable is implemented in the data path — a 2:1 mux returning $Q$ to $D$ — so that neither phase's clock is ever gated, at the price of a feedback edge that is a latch loop and therefore cannot borrow.

```tikz title="Recirculating-mux latch bank: the enable mux returns Q to D around a phi1/phi2 pair, leaving both clock trees ungated; a mux around a single latch is a combinational cycle"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  \draw[thick] (0,-0.75) -- (0,0.75) -- (0.75,0.4) -- (0.75,-0.4) -- cycle;
  \node[font=\footnotesize] at (0.37,0) {$2{:}1$};
  \node[font=\scriptsize,anchor=west] at (0.04,0.45) {1};
  \node[font=\scriptsize,anchor=west] at (0.04,-0.45) {0};
  \draw[->,thick] (-1.7,0.45) -- (0,0.45);
  \node[font=\scriptsize,anchor=south] at (-0.9,0.48) {$D$~[$n$]};
  \draw[->,thick] (0.37,1.5) -- (0.37,0.58);
  \node[font=\scriptsize,anchor=west] at (0.45,1.25) {$en$~[1], fanned to $n$ muxes};
  \draw[->,thick] (0.75,0) -- (1.6,0);
  \node[font=\scriptsize,anchor=south] at (1.2,0.62) {$D_{\mathrm{sel}}$~[$n$]};

  \draw[fill=black!8] (1.6,-0.5) rectangle (2.5,0.5);
  \node[font=\scriptsize] at (2.05,0.16) {L1};  \node[font=\scriptsize] at (2.05,-0.2) {$\phi_1$};
  \draw[->,thick] (2.5,0) -- (3.3,0);
  \node[font=\scriptsize,anchor=south] at (2.9,0.03) {[$n$]};
  \draw (3.3,-0.5) rectangle (4.7,0.5);
  \node[font=\scriptsize] at (4.0,0) {logic $d$};
  \draw[->,thick] (4.7,0) -- (5.5,0);
  \node[font=\scriptsize,anchor=south] at (5.1,0.03) {[$n$]};
  \draw[fill=black!8] (5.5,-0.5) rectangle (6.4,0.5);
  \node[font=\scriptsize] at (5.95,0.16) {L2};  \node[font=\scriptsize] at (5.95,-0.2) {$\phi_2$};
  \draw[->,thick] (6.4,0) -- (8.4,0);
  \node[font=\scriptsize,anchor=south] at (7.9,0.03) {$Q$~[$n$]};
  \fill (7.2,0) circle (0.06);

  \draw[->,thick] (2.05,-1.45) -- (2.05,-0.5);
  \node[font=\scriptsize,anchor=east] at (1.95,-1.15) {$\phi_1$};
  \draw[->,thick] (5.95,-1.45) -- (5.95,-0.5);
  \node[font=\scriptsize,anchor=east] at (5.85,-1.25) {$\phi_2$};
  \node[font=\scriptsize,anchor=north,align=center] at (3.6,-1.62)
    {both phases free-running: no gate in either tree\\[-1pt]
     $\Rightarrow$ symmetric insertion delay, $t_{sk}=0.18$\,ns};

  \draw[red!70,thick] (5.72,-0.93) -- (6.18,-0.67);
  \draw[red!70,thick] (5.72,-0.67) -- (6.18,-0.93);
  \node[font=\scriptsize,anchor=west,red!70,align=left] at (6.45,-0.8)
    {clock-gated sibling puts\\[-1pt] an AND \emph{here}: $t_{sk}=2.63$\,ns};

  \draw[very thick,blue!65] (7.2,0) -- (7.2,-3.3) -- (-0.55,-3.3) -- (-0.55,-0.45);
  \draw[->,very thick,blue!65] (-0.55,-0.45) -- (0,-0.45);
  \node[font=\scriptsize,anchor=south,blue!65] at (3.3,-3.26)
    {recirculation: $Q\to D$ across both phases ($m=2$)};
  \node[font=\scriptsize,anchor=north] at (3.3,-3.4)
    {a latch loop cannot borrow: $t_{dq}^{(1)}+d+t_{dq}^{(2)}+t_{\mathrm{mux}}\le T$ with $b_{\mathrm{loop}}=0$};

  \begin{scope}[yshift=-5.4cm,xshift=1.2cm]
    \node[font=\scriptsize,anchor=east] at (-1.75,0) {(a)};
    \draw[thick] (0,-0.6) -- (0,0.6) -- (0.6,0.32) -- (0.6,-0.32) -- cycle;
    \node[font=\tiny] at (0.3,0) {$2{:}1$};
    \draw[->,thick] (-1.5,0.36) -- (0,0.36);
    \node[font=\scriptsize,anchor=south] at (-0.85,0.38) {$D$~[$n$]};
    \draw[->,thick] (0.3,1.15) -- (0.3,0.46);
    \node[font=\scriptsize,anchor=west] at (0.4,0.95) {$en$};
    \draw[->,thick] (0.6,0) -- (1.4,0);
    \draw[fill=black!8] (1.4,-0.5) rectangle (2.3,0.5);
    \node[font=\scriptsize] at (1.85,0.16) {L}; \node[font=\scriptsize] at (1.85,-0.2) {$\phi_1$};
    \draw[->,thick] (2.3,0) -- (3.5,0);
    \node[font=\scriptsize,anchor=south] at (3.2,0.03) {$Q$~[$n$]};
    \fill (2.9,0) circle (0.06);
    \draw[very thick,red!70] (2.9,0) -- (2.9,-1.25) -- (-0.45,-1.25) -- (-0.45,-0.36);
    \draw[->,very thick,red!70] (-0.45,-0.36) -- (0,-0.36);
    \draw[red!70,very thick] (1.05,-1.05) -- (1.45,-1.45);
    \draw[red!70,very thick] (1.05,-1.45) -- (1.45,-1.05);
    \node[font=\scriptsize,anchor=north,align=center,red!70] at (1.6,-1.68)
      {input and output carry the same colour: while $\phi_1$ is high the whole\\[-1pt]
       loop is transparent --- a combinational cycle, not a hold};
  \end{scope}

  \node[font=\scriptsize,anchor=east] at (-1.9,0) {(b)};
\end{circuitikz}
\end{document}
```

**A pipeline that can stall needs a hold, and a latch has no enable pin.** A [[Two-Phase Latch Pipeline]] is a clocking discipline, not a datapath change: every latch is transparent for its whole phase and opaque for the rest, unconditionally. The moment the design needs to *not* advance — a stall, a load enable, an architectural register written on some cycles only — that unconditional schedule has to be broken, and there are exactly two places to break it. Gate the clock, so the latch never opens ([[Clock-Gated Latch Bank]]); or leave the clock alone and arrange for the value arriving at $D$ to be the value already at $Q$. The second is the recirculating mux, and its function is the Shannon expansion of the next-state map about $en$ — $f = en\cdot f|_{en=1} + \overline{en}\cdot f|_{en=0}$, an identity for any Boolean $f$ (see [[Boolean Algebra]]) — with the two cofactors chosen as "new data" and "old data":

$$D_{\mathrm{sel}} \;=\; en\cdot D \;+\; \overline{en}\cdot Q$$

All of $D$, $Q$, $D_{\mathrm{sel}}$ are $n$ bits and the bank is $n$ independent 2:1 [[Multiplexers|muxes]] sharing one $en$ line; $en$ is 1 bit fanned out $n$ ways, which in a real bank means a buffer tree the drawing does not show. No arithmetic happens — this is exact storage, no width growth, nothing to round, so none of [[Number Formats]] or [[Error Accuracy]] is in play.

**The mux cannot close around one latch, and that single fact drives every cost below.** The two-phase discipline is a two-colouring of the netlist: every signal is $\phi_1$- or $\phi_2$-derived, no combinational cone mixes colours, and **no latch may have input and output of the same colour**. A recirculation edge from $Q$ back to the $D$ of the same bank is a self-loop in the latch graph, so $\mathrm{colour}(u)=\mathrm{colour}(u)$ and the rule is violated by construction. The physical consequence is panel (a): while $\phi_1$ is high the latch is a wire, so mux $\to$ latch $\to$ mux is a closed combinational cycle that oscillates or settles into a fixed point of the mux, and neither is a hold. The recirculation path must therefore run from a $\phi_2$ latch back to a $\phi_1$ latch, spanning $m=2$ half-periods — one full period — which pins a complete L1/L2 **pair** to every enabled word. The "a latch is half a flop" area argument, the whole area case for two-phase design, evaporates on exactly those words.

**A latch loop cannot borrow — unroll the recurrence around the cycle and the borrow budget cancels.** Time borrowing in a feed-forward run comes from $A_{i+1}=\max(t_i,A_i)+D_{i+1}$, whose $\max$ lets late data walk through an open latch; unrolled over a window of $L$ segments it gives the constraint of [[Two-Phase Latch Pipeline]], $\sum_{k=j}^{i} D_k \le L\cdot\frac{T}{2}+B$ with $B=\frac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$. Around a cycle the same window wraps onto itself, so the run has no first element and $B$ appears on both sides. Write $\Delta_{\mathrm{loop}}$ for the total delay once around, and let $b^{(k)}$ be the borrow at the loop entry on the $k$-th trip. The entry latch reopens $mT/2$ later each trip, so **by subtracting the shifted grid position from both sides** of $A^{(k+1)}=A^{(k)}+\Delta_{\mathrm{loop}}$,

$$b^{(k+1)} \;=\; b^{(k)} + \Delta_{\mathrm{loop}} - m\tfrac{T}{2}$$

an arithmetic sequence in $k$. It is bounded — a fixed point exists at all — iff $\Delta_{\mathrm{loop}} \le mT/2$, and whenever the inequality is *strict* the sequence decreases until the $\max$ clamps it at $b=0$. Steady-state borrow around a latch loop is therefore zero: the loop must fit the nominal grid unaided, and $B$ buys it nothing. With $m=2$ that is a constraint over one full period,

$$t_{dq}^{(1)} + d + t_{dq}^{(2)} + t_{\mathrm{mux}} \;\le\; T$$

which is structurally the edge-triggered constraint the two-phase conversion was supposed to escape, plus a mux delay with no slack to absorb it. **Every recirculating word is a flop again, timing-wise** — it keeps the latch's lower per-hop overhead ($2t_{dq}$ instead of $t_{cq}+t_{su}$) and loses the borrowing entirely.

**What it buys is the borrow budget everywhere else, by keeping both clock trees ungated.** Skew enters the budget linearly, $B=\frac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$, and a two-phase design has *two* trees driving different latch loads whose insertion delays must be matched to each other as well as balanced internally. Dropping a single AND gate into one phase's tree — which is precisely what [[Clock-Gated Latch Bank]] does — desymmetrises them: the measured RISCV32I figures are **2.63 ns skew gated against 0.18 ns ungated** on SkyWater 130 nm. Recirculation touches no clock, so both trees stay plain buffer trees and the flow's ordinary CTS balancing applies.

> [!important] The 2.63 ns skew consumes the entire product it was bought to protect
> The same RISCV32I closed at $T=6.4$ ns having failed with flops, borrowing up to 2.88 ns. At $T/2=3.2$ ns, a 2.63 ns skew caps the borrow at $B \le 3.2-2.63 = 0.57$ ns before $t_{\mathrm{nov}}$ and $t_{su}$ are even subtracted — so the 2.88 ns borrow **cannot have come from the clock-gated variant**. At 0.18 ns it caps at $B\le 3.02$ ns, which accommodates 2.88 ns with 0.14 ns left for $t_{\mathrm{nov}}+t_{su}$. The source reports both numbers without connecting them; the arithmetic does. This is the case for recirculation: the gated variant is cheaper at everything except the one thing two-phase clocking exists to deliver.

**The cost is a standard-cell explosion, and it is worse than the mux count suggests.** On the same flow (SkyWater 130 nm, TT/25 °C/1.8 V) the recirculating-mux RISCV32I measures **+299.1 % sequential cells** and **+142.7 % total power** (51.7 mW against a 21.3 mW flop baseline), where the gated variant measures +7.3 % and +36.6 %; averaged across designs the gated variant is **−29.2 % power and −50 % latch count** against recirculation. Combinational cells more than double in both variants, 3502 $\to$ 7613/8184, because the $n$-wide mux bank and the $en$ buffer tree add to the logic that retiming already replicated when it redistributed the latch pairs. Two mechanisms compound: the colouring argument above pins a pair per enabled word so the retimer cannot amortise latches across it, and the mux sits in the data path where its delay is charged to the zero-borrow loop rather than to a borrowable segment.

> [!warning] The source reports the totals but not their decomposition
> +299.1 % is a 4× sequential-cell count, and the pinned-pair argument accounts for at most a 2× against the gated variant's latch count. Where the remaining factor comes from — retimer-inserted latches to keep the colouring valid across the mux, per-word clone banks, or something specific to that RTL — is not broken out in the source. Treat the mechanism as explaining the *direction*, not the magnitude.

**Recirculation is a hold, not a power technique, and confusing the two is the usual reason it is chosen wrongly.** With the clock free-running, every latch in a held bank is still clocked every phase and still charges its clock pin; the mux bank additionally toggles whenever $D$ moves, even while $en=0$, unless the upstream cone is separately quiesced. Clock gating exists because the clock net is the largest single switching load in a synchronous design, and recirculation gives up all of that saving by definition. The +142.7 % figure is what "hold the value and pay full clock power on twice the sequential cells" costs.

**On an FPGA the entire cost structure inverts, and the conclusion still does not change.** Every fabric flip-flop has a dedicated clock-enable port, which *is* this mux, implemented inside the slice for free and with no LUT consumed — so on FPGA the vendor guidance is the exact opposite of the ASIC one: use the CE pin, never gate a global clock, because the global network is not built to be gated (see [[Enable Flip-Flop]] and [[FPGAs]]). None of that rescues this circuit, because the *latch* half is the problem: there is no latch primitive, each one costs a LUT with its output routed back to its own input plus a timing exception to break the combinational cycle, and the second skew- and duty-controlled clock phase burns a PLL output and a global buffer.

$$\boxed{\ D_{\mathrm{sel}} = en\cdot D + \overline{en}\cdot Q,\qquad \Delta_{\mathrm{loop}} \le m\tfrac{T}{2}\ \text{ with }\ b_{\mathrm{loop}}=0\ }$$

**When it breaks.**

- **The loop closes inside one phase.** Panel (a): if placement, retiming or a hand-written override puts the mux around a single latch bank, the result is a combinational cycle, not a stall. The two-colouring check on the placed netlist catches it; a cyclic-graph STA run may simply iterate instead of reporting it.
- **$en$ carries the wrong colour.** The enable is a signal like any other, so an $en$ derived from a $\phi_2$ cone feeding a mux in front of a $\phi_1$ latch violates the same colouring rule the datapath obeys. Enable generation has to be coloured, not bolted on.
- **The loop does not fit $T$.** With $b_{\mathrm{loop}}=0$ there is no slack to borrow into, so a loop with $\Delta_{\mathrm{loop}}>mT/2$ has no fixed point at all. PrimeTime and OpenSTA both handle latch loops by iterating to convergence with no divergence lookahead, so this presents as a run that grows arrival times until some violation falls out — not as a clean report.
- **Scale.** The JPEG design's recirculating-mux variant **failed to route**, from congestion at 17 325 latches. Past roughly $10^4$ sequential cells the doubled bank plus the mux bank plus the $en$ fanout is a placement and routing problem before it is a timing one.
- **Power was the requirement.** If the enable exists to save energy rather than to stall correctly, this circuit is the wrong answer by construction — see [[Clock-Gated Latch Bank]], and [[Choosing a Latch Timing Scheme]] for where both sit against the flop baseline.

**RTL (Spade).**

The bank is three combinational loops — one per latch, one through the mux — and `let` bindings are ordered, so writing the equations straight down refers to names that do not exist yet. `decl` forward-declares a name without giving it a driver, which is exactly the primitive needed:

```spade
fn recirc_bank<#uint N>(d: uint<N>, en: bool, phi1: bool, phi2: bool) -> uint<N> {
    decl q1;
    decl q2;
    let dsel = if en { d } else { q2 };
    let q1: uint<N> = if phi1 { dsel } else { q1 };
    let q2: uint<N> = if phi2 { q1 } else { q2 };
    q2
}
```

`dsel` is the mux output wire, `q1`/`q2` are the L1 and L2 banks, all `uint<N>` = $n$ bits, with `en`, `phi1`, `phi2` one bit each; the recirculation is the reference to `q2` inside `dsel`, drawn as the blue wire. It is a `fn`, not an `entity`: there is no `clock` argument and no `reg`, because the state lives in the topology rather than in a storage primitive, and $\phi_1,\phi_2$ are ordinary `bool` levels rather than clocks — which is what "level-sensitive" means. It lowers to three self-referential continuous assignments, `assign \q1 = \phi1 ? \dsel : \q1 ;` and siblings, i.e. a genuinely cyclic netlist, which is why the timing graph downstream is cyclic and has to be iterated. Synthesis maps `q1`/`q2` to library latch cells and `dsel` to a mux bank, and inserts the $en$ buffer tree that neither the drawing nor the RTL shows.

Simulated with `phi1`/`phi2` driven as a non-overlapping pair and compared against a behavioural master-slave-with-enable reference: **3008 vectors pass**, including `0x01` loaded then held across `0x80` and the reverse, which are the vectors that fail under a reversed bit order or an inverted mux select. Inverting the select in the source makes 2996 of them fail, so the check has teeth. Nothing here models the phase overlap, the minimum pulse width, or the borrow arithmetic above; those are electrical and temporal, and no HDL sees them.

**Related Notes (with context):**

- [[Clock-Gated Latch Bank]] – compares: the other way to hold a two-phase bank, cheaper on every axis except the borrow budget it destroys via 2.63 ns skew.
- [[Enable Flip-Flop]] – depends-on: the same $en\cdot D + \overline{en}\cdot Q$ mux in front of a flop; this note is that circuit re-timed onto a half-period grid, where the feedback becomes a latch loop.
- [[Two-Phase Latch Pipeline]] – depends-on: supplies the window constraint and the borrow budget $B$ that the loop derivation above cancels out.
- [[Choosing a Latch Timing Scheme]] – compares: where this sits against the gated bank, the pulsed latch and the plain flop on area, power and sign-off cost.
- [[Pulsed Latch]] – counter-example: keeps a flop-like interface and a single clock, so an enable stays an ordinary mux with borrowable slack instead of a zero-borrow loop.
- [[LSSD Scan Latch Pair]] – supports: the L1/L2 pair this recirculation must span is also the scan cell, so the pinned pair is not pure waste.
- [[Non-Overlapping Two-Phase Clock Generator]] – supports: produces the $\phi_1,\phi_2$ this bank assumes are ungated and mutually balanced.
- [[FPGAs]] – counter-example: the mux is free on a dedicated CE pin while the latch costs a LUT and a timing exception, inverting the ASIC cost ordering.
- [[Multiplexers]] – depends-on: the 2:1 primitive replicated $n$ ways, and why its delay lands on the critical loop.
- [[Dual-Phase Latches]] – extends: the discipline this circuit is the stall mechanism for.

## References

- Local: [[0.3a) Dual-Phase Latches]], §"The costs" — skew, area, power and routing figures; §"Time borrowing / slack passing" — the window constraint and the fixed-point remark for cycles in the latch graph; §"The two-phase scheme" — the two-colouring rule.
- Pedroso, Wang & Guthaus, *An Open-Source Flow for Single-Phase, Edge-Triggered to Two-Phase, Non-Overlapping Clocking Conversion*, GLSVLSI 2026 — Table 1 (SkyWater 130 nm, TT/25 °C/1.8 V): +299.1 % sequential cells, +142.7 % power, 51.7 mW vs 21.3 mW, 0.18 ns vs 2.63 ns skew, JPEG routing failure at 17 325 latches, 2.88 ns borrow at $T=6.4$ ns.
- Shi, Guo, Lin, Wang & Huang, *Handling Latch Loops in Timing Analysis with Improved Complexity and Divergent Loop Detection*, DATE 2025 — iterate-till-converge latch-loop handling and the absence of divergence lookahead.
- Weste & Harris, *CMOS VLSI Design*, sequential circuit design and clocking — recirculating-mux versus clock-gated enable, and why clock gating is the power technique.
- Wakerly, *Digital Design: Principles and Practices*, ch. 8 — load-enable registers as a mux in the D path.
- Mano & Ciletti, *Digital Design*, registers and counters — the parallel-load register built from a mux per bit.
