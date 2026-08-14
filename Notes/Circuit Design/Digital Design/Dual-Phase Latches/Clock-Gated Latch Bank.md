---
title: "Clock-Gated Latch Bank"
description: "Latch bank whose enable is implemented by gating one phase's clock; cheapest variant measured (-29.2 % power, -50 % latch count vs recirculation mux) but the gate sits in one tree only, producing 2.63 ns skew against 0.18 ns."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, dual-phase-latches, clock-gating, low-power]
aliases:
  - Gated-Clock Latch Bank
  - Clock Gated Latch Bank
---

# Clock-Gated Latch Bank

An $n$-bit transparent-latch bank whose enable is realised by stopping one phase's clock rather than by feeding $Q$ back to $D$ — one gate instead of $n$ muxes, paid for entirely in inter-phase skew.

```tikz title="Clock-gated latch bank: the ICG sits in the phi2 tree only, so its insertion delay appears as skew between the two phases rather than inside one of them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,>=latex,font=\small]
  % ---------------- datapath ----------------
  \draw[->] (-1.0,0) -- (0.2,0);          \node[font=\scriptsize] at (-0.4,0.25) {$n$};
  \node[font=\scriptsize,anchor=east] at (-1.05,0) {$D$};
  \draw[fill=black!8] (0.2,-0.5) rectangle (2.0,0.5);
  \node[font=\scriptsize] at (1.1,0.20) {L1 bank};
  \node[font=\scriptsize] at (1.1,-0.16) {$n$ latches, $\phi_1$};
  \draw[->] (2.0,0) -- (2.9,0);           \node[font=\scriptsize] at (2.45,0.25) {$n$};
  \draw (2.9,-0.5) rectangle (4.5,0.5);   \node[font=\scriptsize] at (3.7,0) {logic};
  \draw[->] (4.5,0) -- (5.4,0);           \node[font=\scriptsize] at (4.95,0.25) {$n$};
  \draw[fill=black!8] (5.4,-0.5) rectangle (7.4,0.5);
  \node[font=\scriptsize] at (6.4,0.20) {L2 bank};
  \node[font=\scriptsize] at (6.4,-0.16) {$n$ latches, $\phi_2^{g}$};
  \draw[->] (7.4,0) -- (8.4,0);           \node[font=\scriptsize] at (7.9,0.25) {$n$};
  \node[font=\scriptsize,anchor=west] at (8.45,0) {$Q$};

  % ---------------- clock root ----------------
  \node[font=\scriptsize,anchor=east] at (-2.35,-2.3) {CLK};
  \draw (-2.3,-2.3) -- (-1.9,-2.3);
  \draw (-1.9,-2.3) -- (-1.9,2.0);
  \node[circ] at (-1.9,-2.3) {};

  % ---------------- phi1 tree: ungated ----------------
  \draw (-1.9,2.0) -- (-1.3,2.0);
  \draw (-1.3,1.75) rectangle (0.3,2.25);
  \node[font=\scriptsize] at (-0.5,2.0) {$\phi_1$ CTS};
  \draw (0.3,2.0) -- (1.1,2.0);
  \draw[->] (1.1,2.0) -- (1.1,0.52);
  \node[font=\scriptsize,anchor=west] at (1.16,1.30) {$t_{\mathrm{ins}}(\phi_1)$ --- no gate};

  % ---------------- phi2 tree: gated ----------------
  \draw (-1.9,-2.3) -- (-1.3,-2.3);
  \draw (-1.3,-2.55) rectangle (0.3,-2.05);
  \node[font=\scriptsize] at (-0.5,-2.3) {$\phi_2$ CTS};

  % --- ICG cell ---
  \draw[dashed] (2.35,-3.35) rectangle (6.10,-1.80);
  \node[font=\scriptsize,anchor=south west] at (2.40,-1.77) {integrated clock-gating cell};
  \draw (0.3,-2.3) -- (2.60,-2.3);
  \node[circ] at (2.60,-2.3) {};
  \draw[fill=black!8] (2.90,-3.10) rectangle (3.85,-2.52);
  \node[font=\scriptsize] at (3.375,-2.70) {L};
  \node[font=\scriptsize] at (3.375,-2.98) {$\overline{\phi_2}$};
  \draw (2.60,-2.3) -- (2.60,-2.78) -- (2.90,-2.78);
  \draw[->] (3.375,-3.75) -- (3.375,-3.10);
  \node[font=\scriptsize,anchor=north] at (3.375,-3.80) {$en$ (1 bit)};
  \node[and port,scale=0.62] (G) at (5.05,-2.30) {};
  \draw (2.60,-2.3) -- (4.25,-2.3) -- (4.25,-2.14) -| (G.in 1);
  \draw (3.85,-2.81) -- (4.42,-2.81) -- (4.42,-2.46) -| (G.in 2);
  \draw (G.out) -- (6.10,-2.30);

  \draw (6.10,-2.30) -- (6.80,-2.30);
  \draw[->] (6.80,-2.30) -- (6.80,-0.52);
  \node[font=\scriptsize,anchor=west] at (6.86,-1.30)
    {$t_{\mathrm{ins}}(\phi_2)+t_{\mathrm{ICG}}$};

  % ---------------- annotation ----------------
  \node[font=\scriptsize,anchor=north,align=center] at (3.3,-4.35)
    {the gate is in the $\phi_2$ tree only --- its delay is skew \emph{between} the phases,\\
     not skew inside one tree: $2.63$\,ns measured, against $0.18$\,ns ungated};
\end{circuitikz}
\end{document}
```

**Start from what a latch already does for free.** A [[Two-Phase Latch Pipeline]] bank of $n$ latches on phase $\phi_2$ is opaque for half of every period already; holding a value for a *whole* period is nothing more than extending that opaque window across the $\phi_2$-high interval too. Nothing has to be added to the data path to arrange it — the enable can be implemented by never opening the latch. Write $\phi_2^{g}=\phi_2\wedge en$ with $en$ a 1-bit bank-wide signal and $D,Q$ each $n$ bits: when $en=0$ the gated phase is constantly low, the bank never becomes transparent, and $Q$ holds. That is one AND for the whole bank, independent of $n$.

**Contrast the alternative, which pays per bit.** The [[Recirculating-Mux Latch Bank]] keeps both clock trees untouched and puts a 2:1 mux in front of every latch, selecting $Q_i$ instead of $D_i$ when $en=0$. It costs $n$ muxes rather than one gate, and worse, the mux sits *in the data path*, so its delay enters $D_k=d_k+t_{dq}$ in the borrowing constraint of [[Dual-Phase Latches]] on every cycle, enabled or not. It also cannot close its feedback around a single latch: by the two-phase colouring rule no combinational cone may mix phases, and a mux loop around an open latch is a combinational cycle, so the recirculation path has to wrap the whole L1/L2 pair. That is the structural reason the measured latch count roughly doubles — the gated variant needs **50 % fewer latches** and **29.2 % less power** than the recirculating one on average.

**The measured flow numbers say the same thing more bluntly.** On the SkyWater 130 nm RTL-to-GDS flow of Pedroso et al. (Table 1), RISCV32I converted with clock gating draws 29.1 mW against a 21.3 mW flop baseline — $+36.6\,\%$ — with sequential cell count up only $+7.3\,\%$. The recirculating variant of the same design draws 51.7 mW ($+142.7\,\%$) with sequential cells up $+299.1\,\%$, and the recirculating JPEG failed to route at all from congestion at 17 325 latches. Clock gating is not the cheap-and-cheerful option here; it is the only variant of the two that survives contact with a placer.

**Now the bill.** The gate has an insertion delay and it sits in exactly one of the two clock trees. In a single-phase design an ICG's delay is a local perturbation that clock-tree synthesis absorbs by rebalancing the *same* tree against itself. Two-phase clocking has no such freedom: $\phi_1$ and $\phi_2$ must hold a *phase* relationship, and the gate lengthens $\phi_2$'s path without lengthening $\phi_1$'s. The measured consequence is **2.63 ns of skew for the gated RISCV32I against 0.18 ns for the ungated recirculating variant** — a factor of fifteen, from one AND gate.

**Skew is charged twice, and the boxed constraint shows where.** The borrow budget of the two-phase discipline is $B=\tfrac{T}{2}-t_{\mathrm{nov}}-t_{su}-t_{sk}$, so every picosecond of $t_{\mathrm{ICG}}$ that lands in $t_{sk}$ is a picosecond you cannot borrow — subtractively, one for one. The race-through condition $\delta_{dq}+\delta_{i+1}\ge t_h+t_{sk}-t_{\mathrm{nov}}$ carries $t_{sk}$ with a *positive* sign, so the same picosecond simultaneously raises the minimum-delay requirement and must be bought back by widening $t_{\mathrm{nov}}$ — which comes out of $B$ again. Gating a phase is the one modification that degrades both headline benefits of two-phase latching through a single term.

> [!important] The saving is $O(1)$ area and the price is $O(1)$ skew, but the skew is *global*
> Replacing $n$ muxes with one gate is a strictly local win that scales with bank width. The skew it injects is not local: it shifts the phase relationship for the entire $\phi_2$ tree downstream of the gate, and every borrowing path that crosses it pays. This is why clock gating is the *cheap* variant per bank and still a methodology risk per chip.

> [!warning] The skew and borrow figures do not obviously coexist — needs a source-level check
> The same flow reports RISCV32I closing at $T=6.4$ ns (so $T/2=3.2$ ns) with borrowing up to 2.88 ns. A 2.63 ns skew term would leave $B\le 3.2-2.63=0.57$ ns before even subtracting $t_{\mathrm{nov}}$ and $t_{su}$, which cannot support a 2.88 ns borrow. Either the 2.63 ns is a whole-tree skew figure that no single launch/capture pair sees, or the 2.88 ns borrow belongs to a different variant. The long-form note does not disambiguate and neither claim should be quoted as a per-path number without checking Table 1 directly.

**Why the gate has a latch in it.** A bare $\phi_2\wedge en$ is wrong, and wrong in a way that is invisible in RTL simulation. If $en$ glitches while $\phi_2$ is high, the glitch propagates straight through the AND as a runt clock pulse and the bank samples garbage; the fix is to make $en$ provably stable across the whole high interval by resampling it on the *opposite* level. That is what an [[Integrated Clock Gating Cell]] is: a low-phase latch on $en$ feeding the AND, so $en$ is captured while $\phi_2$ is low and cannot move while it is high. Two-phase clocking makes this unusually natural — the opposite phase already exists as a routed net, and the dead band $t_{\mathrm{nov}}$ gives the gating latch a settling window that a single-phase design has to carve out of duty cycle. What it costs is that every clock-gating check in signoff is now evaluated against a phase with a non-overlap requirement instead of against a single edge.

**On FPGA, do not do this at all.** The fabric has no ICG cells to instantiate, the clock nets are global and skew-balanced by construction rather than by CTS, and every flop already has a dedicated clock-enable pin that costs nothing — so the mux form is free and the gated form is not available. `BUFGCE` gates a whole global buffer, which is a clock-region-granularity decision, not a bank-granularity one. The general FPGA argument against two-phase latching in [[FPGAs]] applies here with extra force: you would burn a PLL output and a global buffer to generate $\phi_2$, then insert a gate that the tools will not balance.

$$\boxed{\;\underbrace{n\,A_{\mathrm{lat}}+A_{\mathrm{ICG}}}_{\text{clock-gated}}\;\ll\;\underbrace{n\,(A_{\mathrm{lat}}+A_{\mathrm{mux}})}_{\text{recirculated}},\qquad B=\frac{T}{2}-t_{\mathrm{nov}}-t_{su}-\big(t_{sk}+t_{\mathrm{ICG}}\big)\;}$$

The area advantage is $n\,A_{\mathrm{mux}}-A_{\mathrm{ICG}}$, growing linearly in bank width; the cost is a single additive term inside the skew, independent of $n$ but felt by every path downstream.

**When it breaks.**

- **Narrow banks.** The advantage is $n\,A_{\mathrm{mux}}-A_{\mathrm{ICG}}$, so below the width where that crosses zero — and the ICG has its own clock pin burning power every cycle — the mux is simply cheaper. Gating a 2-bit register is a loss.
- **Per-bit enables.** One gate assumes $en$ is common to all $n$ bits. Byte enables, lane predication or per-bit write masks force one ICG per group, and at group size 1 the structure has degenerated into the mux form with extra clock trees.
- **Designs that actually borrow.** The technique is safe when the gated bank sits on a path with slack to spare and self-defeating when it does not: the skew it adds is subtracted from $B$ directly. A pipeline converted to two-phase *because* it needed borrowing is the worst place to gate.
- **Glitchy enables.** A bare AND is a latent runt-pulse bug; if the library has no ICG, `en` must be launched from a $\overline{\phi_2}$-clocked element by hand and that timing arc has to be constrained explicitly.
- **Scan.** A gated clock is dead in shift mode. The standard fix is to OR a test-enable into the gating latch's data input so the gate is forced transparent during scan; an [[LSSD Scan Latch Pair]] sidesteps the issue by carrying separate scan clocks, which is one more reason two-phase designs tend toward LSSD-style DFT.

**RTL.** Spade has no latch primitive, and the level-sensitive storage element is combinational feedback, which the language cannot name:

```spade
entity latch_bank<#uint N>(clk: clock, en: bool, d: uint<N>) -> uint<N> {
    let q = if en { d } else { q };
    q
}
```

```
error: Use of undeclared name q
  ┌─ latch.spade:2:32
  │
2 │     let q = if en { d } else { q };
  │                                ^ Undeclared name
```

The gating half of the circuit, unusually, *is* expressible — Spade will let you build a clock from a `bool` under `unsafe`, which is the nearest structure the language is native at:

```spade
entity gated_bank<#uint N>(clk: clock, en: bool, d: uint<N>) -> uint<N> {
    let gclk = unsafe { (clk.as_bool() && en).as_clock() };
    reg(gclk) q = d;
    q
}
```

`d` and `q` are the $n$-bit datapath wires into and out of the bank in the diagram; `en` is the 1-bit enable entering the ICG from below; `gclk` is $\phi_2^{g}$, the gated net driving the bank's clock pin. Two things this does not capture. It is **edge-triggered, not level-sensitive** — the bank samples on a rising edge and never becomes transparent, so there is no borrow window and none of the $B$ arithmetic above applies to it; and it is a single-phase construction with no $\phi_1$ partner, so the skew term the whole note is about has nowhere to appear. Synthesis will also differ from the drawing in the one way that matters: the emitted Verilog is literally `assign gclk = clk & en; always @(posedge gclk) q <= d;` — the bare AND, not the ICG. The gating latch is not inferred, and a real flow would blackbox the library's ICG cell instead.

**Related notes.**

- [[Recirculating-Mux Latch Bank]] – compares: the same enable built in the data path instead of the clock, trading $O(1)$ skew for $O(n)$ area and 4× the power.
- [[Integrated Clock Gating Cell]] – depends-on: supplies the gating latch without which the AND turns an enable glitch into a spurious clock edge.
- [[Two-Phase Latch Pipeline]] – extends: the pipeline this bank is a stage of, and the source of the $B$ budget the gate spends.
- [[Enable Flip-Flop]] – counter-example: on FPGA the dedicated CE pin makes the mux free and the gate unavailable, reversing the whole comparison.
- [[Choosing a Latch Timing Scheme]] – compares: where a gated bank sits against pulsed and ungated alternatives.
- [[Non-Overlapping Two-Phase Clock Generator]] – supports: generates the $\phi_1/\phi_2$ pair whose relative skew this gate perturbs.

## References

- [[Dual-Phase Latches]], *The costs* — clock distribution asymmetry, 2.63 ns vs 0.18 ns skew, and the SkyWater 130 nm power/area figures; *EDA tool support*, clock-gating checks paragraph — the $-29.2\,\%$ power / $-50\,\%$ latch-count comparison and the phase-versus-edge check.
- Pedroso, Wang & Guthaus, [*An Open-Source Flow for Single-Phase, Edge-Triggered to Two-Phase, Non-Overlapping Clocking Conversion*](https://arxiv.org/abs/2605.05374), GLSVLSI 2026, Table 1 — all measured numbers quoted above.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 (clock gating, latch-based ICG construction) and ch. 16 (clock distribution) — the glitch argument and the ICG's latch.
- Wakerly, *Digital Design: Principles and Practices*, ch. 10 — why a gated clock is a scan hazard and how test-enable forcing repairs it.
