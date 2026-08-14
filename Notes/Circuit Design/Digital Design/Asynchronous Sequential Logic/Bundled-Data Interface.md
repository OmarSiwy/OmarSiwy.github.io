---
title: "Bundled-Data Interface"
description: "Keeps an ordinary single-rail datapath and adds req/ack plus one matched delay line — the synchronous period constraint made local to one stage, so only the stages that run pay it."
kind: circuit
source: "no book source — long-form §Handshaking protocols, §FPGA mapping, §Trade-offs"
status: seed
spade: not-expressible
tags: [digital, asynchronous-sequential-logic]
aliases:
  - "Bundled Data"
  - "Bundled-Data"
  - "Bundled-Data Channel"
  - "Bundled-Data Protocol"
  - "Single-Rail Handshake"
---

# Bundled-Data Interface

A bundled-data interface carries a $k$-bit single-rail datapath unchanged and bolts on two 1-bit control wires, `req` and `ack`, whose request is routed through a **matched delay line** sized to the datapath's own worst-case propagation — making it the one asynchronous style whose datapath costs exactly what the synchronous datapath costs.

```tikz title="Four-phase bundled-data stage: data goes through f, req goes through a matched delay"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- data path: ordinary single-rail k bits ----
  \draw[thick] (-0.7,1.5) rectangle (0.7,2.7);
  \node at (0,2.1) {$L_s$};
  \draw[thick] (2.6,1.4) rectangle (5.2,2.8);
  \node at (3.9,2.35) {combinational $f$};
  \node at (3.9,1.85) {$t_{pd,\max}$};
  \draw[thick] (7.1,1.5) rectangle (8.5,2.7);
  \node at (7.8,2.1) {$L_r$};

  \draw[->,thick] (-2.1,2.1) -- (-0.7,2.1);
  \node at (-1.4,2.45) {$k$};
  \draw[->,thick] (0.7,2.1) -- (2.6,2.1);
  \node at (1.65,2.45) {$k$};
  \draw[->,thick] (5.2,2.1) -- (7.1,2.1);
  \node at (6.15,2.45) {$k$};
  \draw[->,thick] (8.5,2.1) -- (9.9,2.1);
  \node at (9.2,2.45) {$k$};

  % ---- request path: one matched delay line ----
  \draw[thick] (2.6,-0.1) rectangle (5.2,0.9);
  \node at (3.9,0.58) {matched delay};
  \node at (3.9,0.13) {$t_d$};

  \draw[->,thick] (0,1.5) -- (0,0.4) -- (2.6,0.4);
  \node at (1.3,0.72) {$\mathit{req}$\quad$1$};
  \draw[->,thick] (5.2,0.4) -- (7.8,0.4) -- (7.8,1.5);
  \node at (6.5,0.72) {$1$};

  % ---- acknowledge returns over the top ----
  \draw[->,thick] (7.8,2.7) -- (7.8,4.0) -- (0,4.0) -- (0,2.7);
  \node at (3.9,4.3) {$\mathit{ack}$\quad$1$};

  \node at (3.9,-0.75) {$t_d \;\ge\; t_{pd,\max} + t_{\mathrm{setup}}$};
\end{circuitikz}
\end{document}
```

*Sender latch $L_s$, combinational function block $f$, receiver latch $L_r$. Data is $k$ wires; `req` and `ack` are 1 wire each, independent of $k$.*

**Localise the period constraint instead of removing it.** A synchronous pipeline closes one global inequality, $T_{\text{clk}} \ge \max_i\big(t_{pd,\max}^{(i)}\big) + t_{\text{setup}} + t_{\text{skew}}$: every stage pays the slowest stage's delay, every cycle, whether or not it has work. Bundled data keeps the *same form* of inequality but quantifies it per stage,

$$t_d^{(i)} \;\ge\; t_{pd,\max}^{(i)} + t_{\text{setup}},$$

so the $\max_i$ disappears from the cost of stage $i$. Two consequences follow directly. First, an unbalanced pipeline stops rounding every stage up to the worst one — total latency becomes $\sum_i t_{pd,\max}^{(i)}$ instead of $N\max_i t_{pd,\max}^{(i)}$. Second, a stage that is not handed a token consumes no dynamic power at all, because there is no clock edge to consume it; idle is free rather than merely idle.

**Bundling means validity lives on a wire, not in the data.** The $k$ data wires are single-rail, so no combination of their values distinguishes "settled" from "still resolving" — unlike [[Dual-Rail Encoding]], where the spacer codeword $00$ makes validity a function of the data itself. The protocol therefore *asserts* validity out of band: the receiver may treat the bus as valid exactly when `req` has arrived. Correctness is then the pair of arrival-time inequalities

$$t_{\text{arr}}(\text{data at } L_r) + t_{\text{setup}} \;\le\; t_{\text{arr}}(\mathit{req} \text{ at } L_r),$$

a **relative timing constraint** between two physically distinct paths. This is the whole character of the style: there is no Boolean function whose truth you can check, and violating it does not deadlock, glitch, or raise a flag — the link runs at full speed and latches stale bits.

**Sequence the two wires four-phase.** The standard control is `req↑ → ack↑ → req↓ → ack↓` (see [[Four-Phase Handshake]]): level signalling, so the latch enable is literally a wire and the controller is a handful of gates. The cycle time is $t_d + t_{\text{ack}} + t_{\text{recovery}}$, of which only the first term does work — the return-to-zero half is pure overhead, and it is why a bundled-data stage does not beat a synchronous stage on throughput. [[Two-Phase Handshake]] halves the wire transitions but demands event-sensitive storage, which is larger and slower than a level-sensitive latch; it wins only when the wire dominates the logic.

**Match the delay with the same silicon the datapath uses.** $t_d$ must track $t_{pd,\max}$ across process, voltage and temperature, and a delay line built from different structures than the datapath will not: an inverter chain and a LUT-plus-routing path have different voltage sensitivities, so a margin verified at the typical corner can evaporate at a fast-silicon/high-voltage corner where the delay line speeds up more than the logic does. The fix is structural rather than numerical — build the [[Matched Delay Line]] out of a replica of the critical path. For an adder this is unusually clean, because the critical path *is* the carry chain: on FPGA a [[Fast Carry Chain]] of the same length as the [[Ripple-Carry Adder]] it guards is the ideal matched delay, since it is the identical hardware in the identical column, tracking by construction.

> [!important]
> Bundled data does **not** buy data-dependent latency. `req` is launched through a fixed delay sized for the worst case, so a $k$-bit ripple-carry adder pays all $k$ carry stages on every operand pair — even though for uniform random operands the expected longest carry chain is only $\Theta(\log_2 k)$, roughly 6 for $k = 64$. Harvesting that gap requires the datapath to *announce* completion, which means dual-rail plus a [[Completion Detection Tree]]. What bundled data buys is per-stage rather than global worst case, and zero cost when idle.

**Count the wires.** Data $k$, control $2$, total $k + 2$ — independent of $k$ in the control, which is the entire cost argument against dual-rail's $2k + 1$. The area of the function block $f$ is unchanged from the synchronous design, versus roughly $2\times$ for a QDI datapath built from dual-rail gates, and the completion tree that a QDI stage needs sits **on** the critical path whereas the matched delay sits beside it. The price is one unverifiable timing assumption per stage.

**FPGA mapping is where the style becomes the only option.** Three tool facts drive it. Delay elements are not synthesisable: a chain of inverters is removed by the involution $\lnot\lnot x = x$ and collapses to a wire, so what survives is a `CARRY4`/`CARRY8` chain or a LUT chain with a location constraint and `DONT_TOUCH` on every net. The controller's state-holding loop is a combinational cycle, which static timing analysis cannot traverse — Vivado needs `ALLOW_COMBINATORIAL_LOOPS` on the net plus `set_disable_timing`, and Quartus an equivalent loop cut. And STA can express `set_max_delay` on the data path and `set_min_delay` on the request path separately, but it will not compare them: it checks the two bounds you chose, never the relation you actually need. That is hand-certification with tool assistance, not timing closure. Against that, bundled data is still the only async style that maps at all — QDI's [[Dual-Rail Encoding|isochronic fork]] assumption requires two branches of a fork to match in delay, and FPGA routing delay is set by the router and dominates logic delay, so the one assumption QDI needs is the one FPGA routing will not honour.

$$\boxed{\ t_d \;\ge\; t_{pd,\max} + t_{\text{setup}}, \qquad \text{wires} = k + 2\ }$$

**When it breaks.**

- **Under-margined delay at an untested corner.** The failure is silent data corruption at full speed, with no deadlock and no error bit. Nothing in the functional simulation catches it; nothing in a stuck-at test set catches it either, because a violated relative-timing constraint is not a stuck-at fault.
- **Delay line and datapath built from different structures.** PVT tracking is only as good as the structural similarity. A replica critical path is the requirement, not a tuned number of inverters.
- **Wide data buses.** The bundling constraint is per bit: the *slowest* of the $k$ data wires must beat `req`. Skew across a wide bus eats margin that the replica path does not model, and the route to the far end of a 64-bit bus is not in the delay line.
- **Deep pipelines with balanced stages.** If every $t_{pd,\max}^{(i)}$ is already equal, $\sum_i t_{pd,\max}^{(i)} = N\max_i t_{pd,\max}^{(i)}$ and the latency argument returns nothing, while the four-phase return-to-zero overhead is still paid. Bundled data pays off on *unbalanced* or *duty-cycled* logic.
- **Large data-dependent delay spread.** Where the gap between average and worst case is the point, the matched delay throws it away — [[Dual-Rail Encoding]] with completion detection takes over.
- **Near-threshold operation.** $t_{pd}$ varies by orders of magnitude with $V_{DD}$ and no single delay line tracks it; QDI is the requirement, not an option. See [[Choosing an Asynchronous Style]].

**RTL (Spade).** The interface is not expressible. Its controller holds state without a clock, which is combinational feedback, and Spade has no latch primitive — a `let` cannot refer to itself:

```spade
entity latch_ctrl(req: bool, d: bool) -> bool {
    let q = if req { d } else { q };
    q
}
```

```
error: Use of undeclared name q
  ┌─ latch_ctrl.spade:2:33
  │
2 │     let q = if req { d } else { q };
  │                                 ^ Undeclared name
```

The second half is not expressible for a deeper reason than syntax: the matched delay is a *physical* quantity, and no HDL has a construct whose meaning is "take longer than that other path". The nearest structure Spade is native at is the same four-phase sequence with the delay line replaced by a cycle count — a clocked sequencer that reproduces the protocol's ordering and nothing of its timing:

```spade
enum Phase {
    Idle,
    Settle { n: uint<8> },
    Assert,
    Recover,
}

/// Four-phase bundled-data sender, with the matched delay stood in for by `dly` clock cycles.
entity bd_sender(clk: clock, rst: bool, go: bool, ack: bool, dly: uint<8>)
    -> (bool, bool)
{
    reg(clk) phase reset(rst: Phase::Idle) = match phase {
        Phase::Idle      => if go     { Phase::Settle$(n: dly) } else { Phase::Idle },
        Phase::Settle(n) => if n == 0 { Phase::Assert } else { Phase::Settle$(n: trunc(n - 1)) },
        Phase::Assert    => if ack    { Phase::Recover } else { Phase::Assert },
        Phase::Recover   => if !ack   { Phase::Idle } else { Phase::Recover },
    };

    let load = match phase { Phase::Idle   => go,   _ => false };
    let req  = match phase { Phase::Assert => true, _ => false };
    (load, req)
}
```

`load` is the enable on $L_s$ in the diagram, `req` is the wire leaving the matched delay box, and `ack` is the return path over the top; `dly` is an 8-bit down-count standing in for $t_d$, so `req` rises exactly $\texttt{dly}+2$ cycles after `go`. Everything here is registered, which is precisely what the real circuit is not — the `Assert`/`Recover` pair is the return-to-zero half made explicit as states. What synthesis does differently from the drawing is the whole point of the note: it gives you a delay quantised to the clock it was supposed to eliminate, and it gives you setup/hold checks on `phase` in place of the one constraint that actually matters, $t_d \ge t_{pd,\max} + t_{\text{setup}}$, which no tool in this flow can see. Do not repair the first block by passing `q` in as an argument — it type-checks and it is a multiplexer, not a latch.

**Related Notes.**

- [[Matched Delay Line]] – depends-on: the timing assumption of this interface is that component, and its PVT tracking is the whole risk.
- [[Four-Phase Handshake]] – depends-on: supplies the `req`/`ack` sequencing the two control wires run.
- [[Two-Phase Handshake]] – compares: same two wires, event-signalled, cheaper on the wire and dearer in the latch.
- [[Fast Carry Chain]] – supports: the only FPGA structure that gives a matched delay tracking a carry-propagate datapath by construction.
- [[Ripple-Carry Adder]] – supports: the canonical function block behind $f$, and the one whose average-versus-worst-case gap this style declines to harvest.
- [[Dual-Rail Encoding]] – counter-example: drops the timing assumption entirely by encoding validity in the data, at $2k$ wires and double the datapath.
- [[Completion Detection Tree]] – counter-example: the mechanism that would turn worst-case latency into actual latency, and the one bundled data does without.
- [[Micropipeline]] – extends: hangs bundled-data latches off a [[Muller Pipeline]] to get an elastic FIFO out of the same two wires.
- [[Choosing an Asynchronous Style]] – compares: where this sits against dual-rail QDI and plain synchronous.

## References

- Long-form note [[0.5) Asynchronous Sequential Logic]], §Handshaking protocols (bundled data, four-phase versus two-phase), §FPGA mapping (delay elements, combinational loops, isochronic forks), §Trade-offs (latency, area, power, timing closure).
- Standard canon for the relative-timing framing and the FPGA constraints: Mano & Ciletti, *Digital Design*; Wakerly, *Digital Design: Principles and Practices*; Weste & Harris, *CMOS VLSI Design*.

> [!warning] Not covered in the source — needs outside research
> No book source is assigned to this note, so every quantitative claim above is either an inequality derived here or an asymptotic order. No LUT counts, gate delays, margin percentages, or measured energy figures are quoted, because inventing them would be worse than omitting them.
