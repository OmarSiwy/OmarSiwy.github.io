---
title: "Two-Phase Handshake"
description: "Every transition is an event, halving wire toggles on long links — wins when the wire dominates and loses when the event-sensitive storage it forces does."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Transition Signalling
  - Transition Signaling
  - NRZ Handshake
  - Non-Return-to-Zero Handshake
  - Two-Phase Handshaking
  - Two-Phase Protocol
---

# Two-Phase Handshake

A two-wire request/acknowledge protocol in which every *transition* on either wire counts as one event regardless of direction, so a complete transfer costs two wire transitions where [[Four-Phase Handshake]] costs four.

```tikz title="Four-phase and two-phase req/ack waveforms carrying data over the same wire activity"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % datum boundaries (drawn first, so waveforms sit on top)
  \draw[dashed,gray] (4,4.0) -- (4,6.1);
  \draw[dashed,gray] (8,4.0) -- (8,6.1);
  \foreach \x in {2,4,6,8} { \draw[dashed,gray] (\x,0.55) -- (\x,2.75); }

  % ---- four-phase, upper panel ----
  \node[anchor=west] at (0,6.45) {\textbf{four-phase} (return-to-zero): 4 transitions per datum};
  \node[anchor=east] at (-0.15,5.4) {$\mathit{req}$ [1]};
  \draw[thick] (0,5.4) -- (1,5.4) -- (1,6.0) -- (3,6.0) -- (3,5.4)
            -- (5,5.4) -- (5,6.0) -- (7,6.0) -- (7,5.4) -- (9,5.4);
  \node[anchor=east] at (-0.15,4.2) {$\mathit{ack}$ [1]};
  \draw[thick] (0,4.2) -- (2,4.2) -- (2,4.8) -- (4,4.8) -- (4,4.2)
            -- (6,4.2) -- (6,4.8) -- (8,4.8) -- (8,4.2) -- (9,4.2);
  \node at (2,3.75) {datum 0};
  \node at (6,3.75) {datum 1};

  % ---- two-phase, lower panel ----
  \node[anchor=west] at (0,3.15) {\textbf{two-phase} (transition signalling): 2 transitions per datum};
  \node[anchor=east] at (-0.15,2.0) {$\mathit{req}$ [1]};
  \draw[thick] (0,2.0) -- (1,2.0) -- (1,2.6) -- (3,2.6) -- (3,2.0)
            -- (5,2.0) -- (5,2.6) -- (7,2.6) -- (7,2.0) -- (9,2.0);
  \node[anchor=east] at (-0.15,0.8) {$\mathit{ack}$ [1]};
  \draw[thick] (0,0.8) -- (2,0.8) -- (2,1.4) -- (4,1.4) -- (4,0.8)
            -- (6,0.8) -- (6,1.4) -- (8,1.4) -- (8,0.8) -- (9,0.8);
  \foreach \x in {1,3,5,7} { \draw[thick,->] (\x,3.0) -- (\x,2.72); }
  \foreach \x in {2,4,6,8} { \draw[thick,->] (\x,0.35) -- (\x,0.72); }

  % data bus, two-phase
  \node[anchor=east] at (-0.15,-0.15) {$d$ [$k$]};
  \draw[thick] (0,-0.45) -- (0.7,-0.45); \draw[thick] (0,0.15) -- (0.7,0.15);
  \foreach \x/\n in {1/0, 3/1, 5/2, 7/3} {
    \draw[thick] (\x-0.3,-0.45) -- (\x,0.15) -- (\x+1.7,0.15) -- (\x+2,-0.45) -- cycle;
    \node at (\x+0.85,-0.15) {$D_{\n}$};
  }
  \node at (2,-0.95) {datum 0};
  \node at (4,-0.95) {datum 1};
  \node at (6,-0.95) {datum 2};
  \node at (8,-0.95) {datum 3};
\end{circuitikz}
\end{document}
```

*The two wires carry identical activity in both panels; the two-phase channel gets four data across it in the time the four-phase channel gets two. Arrows mark the events.*

**Move the channel's state off the wire levels and into their relation.** The sender drives a 1-bit $\mathit{req}$, the receiver a 1-bit $\mathit{ack}$, and the payload $d$ is $k$ bits of ordinary single-rail data as in [[Bundled-Data Interface]]. Neither wire has an "active" level. What the two ends agree on is the exclusive-or of the pair:

$$\mathit{full} \;=\; \mathit{req} \oplus \mathit{ack}$$

Both wires equal means the channel is empty and the sender may act; they differ means a datum is in flight and the receiver must act. A transfer is: sender places $d$, waits for the matched delay of [[Matched Delay Line]] to guarantee $d$ is settled, then complements $\mathit{req}$; the receiver captures $d$ and complements $\mathit{ack}$. Two transitions, and the channel is back to empty in the *opposite* level pair from where it started. Because $\oplus$ is symmetric in its arguments' polarity, the protocol is identical on the $0{\to}1$ and the $1{\to}0$ halves — which is exactly the property four-phase throws away by insisting the wires return to zero.

**Count the transitions, because that is the whole argument.** A wire of capacitance $C$ driven between rails $V_{dd}$ dissipates $\tfrac{1}{2}CV_{dd}^2$ per transition. Four-phase spends $\mathit{req}{\uparrow}, \mathit{ack}{\uparrow}, \mathit{req}{\downarrow}, \mathit{ack}{\downarrow}$ — four transitions, $2CV_{dd}^2$ per datum. Two-phase spends one transition per wire, $CV_{dd}^2$ per datum. Exactly half, and the ratio is a hard combinatorial fact rather than a technology-dependent estimate. The same halving shows up in latency: four-phase needs *two* round trips of link delay $t_{\text{link}}$ before the next datum may be launched, two-phase needs one, so peak channel throughput goes from $1/(4t_{\text{link}})$ to $1/(2t_{\text{link}})$. Both wins scale with $C$ and $t_{\text{link}}$, which is to say with wire length, and neither depends on $k$.

**Pay for it in the storage element, which is where the argument turns around.** Four-phase's $\mathit{req}$ is a level, so it can be wired straight to a latch enable — the control logic is literally a wire. Two-phase's $\mathit{req}$ carries information only in its edges, and both edges mean the same thing, so the capture element must be *event*-sensitive with no clock to reference. The three realisations are a double-edge-triggered flip-flop (two level-sensitive latches plus an output multiplexer, roughly twice the area and one extra gate delay), Sutherland's capture-pass latch, or an XOR that recovers a level and drives an ordinary latch with it. That last one is the practical answer: $\mathit{full} = \mathit{req} \oplus \mathit{ack}$ *is* a level, so one XOR per channel end converts transition signalling back into the level signalling every ordinary latch and every [[Muller C-Element]] already speaks.

> [!important]
> The conversion is cheap and local, the wire saving is expensive and distributed — so the design rule is **two-phase on the long wire, four-phase inside the block**, with a two-to-four phase converter (an XOR plus a toggle plus a C-element) at each end. A two-phase protocol run end-to-end through a datapath pays the double-edge storage cost at every stage and saves wire energy only on the one link that was long.

**Nothing else changes, which is the point.** The timing assumption is unchanged: $\mathit{req}$ still has to be delayed past the datapath's worst case, $t_{\text{matched}} \ge t_{pd,\max} + t_{\text{setup}}$, so two-phase is orthogonal to the encoding choice and composes with bundled data exactly as four-phase does. It does *not* compose with ordinary [[Dual-Rail Encoding]], whose return-to-spacer phase is inherently four-phase — the spacer is what makes completion detection possible, and deleting it deletes the encoding's reason to exist. Occupancy is also unchanged: a single $\mathit{req}/\mathit{ack}$ pair holds at most one datum, since $\mathit{req} \oplus \mathit{ack}$ is a single bit. Buffering means chaining stages, which is [[Micropipeline]].

**On FPGA the storage cost is not merely large, it is unavailable.** Fabric registers in every mainstream family are single-edge; double-data-rate capture exists only as a dedicated `IDDR`/`ODDR` primitive in the I/O column, not in the general logic fabric. So a fabric two-phase design has no choice but the XOR-to-level conversion, and once a level exists a synchronous designer will clock it — at which point the protocol's advantage is gone, because a clocked register toggles a clock wire far more often than the two transitions you saved. What survives, and is used constantly, is the degenerate one-bit case: the **toggle pulse synchroniser**. An event in clock domain A complements a flop, two flip-flops re-time it into domain B, and an XOR against its own delayed copy turns the transition back into a one-cycle pulse. That is two-phase signalling in full, and it is why the only place FPGAs run it is clock-domain crossing — see [[Asynchronous FIFO]] and the `sync2`/`handshake` primitives every vendor and HDL standard library ships.

$$\boxed{\ \mathit{full} \;=\; \mathit{req}\oplus\mathit{ack}, \qquad \text{2 transitions/datum vs. 4}, \qquad E_{\text{2ph}} = \tfrac{1}{2}E_{\text{4ph}}\ }$$

**When it breaks.**

- **Initialisation has no distinguished idle state.** $\mathit{req}=\mathit{ack}=0$ is empty and so is $\mathit{req}=\mathit{ack}=1$; there is no level either end can inspect to learn the channel's phase. A reset that reaches one end and not the other leaves the channel permanently reporting "full" with no datum behind it, and nothing on the wire distinguishes that from a legitimate transfer. Four-phase's all-zeros idle is self-evident by inspection, and this is the single most common source of two-phase bring-up bugs.
- **Short channels lose.** The saving is $\tfrac{1}{2}CV_{dd}^2$ times two transitions; the cost is the extra area, leakage and delay of event-sensitive storage at both ends. Below the wire length where $C_{\text{wire}}$ dominates the endpoint gate capacitance, four-phase is strictly better.
- **One datum in flight per channel.** No bursting; a producer faster than one round trip must be given more stages.
- **Data must be held.** The sender may not disturb $d$ until $\mathit{ack}$ has toggled, so the bundled-data timing assumption and its matched delay line are still fully in force.
- **No arbitration.** Two-phase orders events on one channel and says nothing about two senders contending for one receiver; that needs a [[Mutual Exclusion Element]].
- **Return-to-spacer encodings are excluded**, as above.

> [!warning] Not covered in the source — needs outside research
> This note has no assigned book source. The energy and latency ratios above are exact consequences of the transition count, but no area figure, gate count or measured energy for a double-edge-triggered element versus a level-sensitive latch is quoted, because none was available to check.

**RTL: the element that matters is the one Spade cannot write.** The capture element a true two-phase stage is built from has no clock, and it holds its value when $\mathit{req}$ and $\mathit{ack}$ agree — combinational feedback, which Spade has no primitive for and which `let` cannot express because a binding may not name itself:

```spade
fn capture(req: bool, ack: bool, d: uint<8>) -> uint<8> {
    let q = if req != ack { d } else { q };
    q
}
```

```
error: Use of undeclared name q
  ┌─ capture.spade:2:40
  │
2 │     let q = if req != ack { d } else { q };
  │                                        ^ Undeclared name
```

Passing `q` in as an argument would compile, and would be a multiplexer rather than a latch. The nearest structure Spade is native at is the clocked form — the toggle protocol kept exactly, the storage replaced by a register:

```spade
/// One two-phase pipeline stage. Occupancy lives in the XOR of the toggle
/// wires exactly as in the asynchronous protocol; only the storage is clocked.
entity two_phase_stage<#uint W>(
    clk: clock,
    rst: bool,
    req_i: bool,
    d_i: uint<W>,
    ack_i: bool,
) -> (bool, bool, uint<W>) {
    decl advance;
    reg(clk) ack_o reset(rst: false) = if advance { !ack_o } else { ack_o };
    reg(clk) req_o reset(rst: false) = if advance { !req_o } else { req_o };
    reg(clk) d_o: uint<W> reset(rst: 0) = if advance { d_i } else { d_o };
    // input pending: upstream toggled req and we have not yet toggled ack
    // output free:   our req matches downstream ack, so the last datum was taken
    let advance = (req_i != ack_o) && (req_o == ack_i);
    (ack_o, req_o, d_o)
}
```

`req_i`, `ack_i`, `req_o`, `ack_o` are the four 1-bit wires of the diagram — the left channel's pair and the right channel's pair — and `d_i`/`d_o` are the $W$-bit bundled payload. `req_i != ack_o` and `req_o == ack_i` are the two XOR occupancy predicates written as comparisons, since `^` is not defined on `bool` in Spade. Everything is registered on one clock edge, so the whole stage advances in a single cycle when both predicates hold.

What this captures: the toggle encoding, the one-place occupancy, the flow-control rule, and the fact that a stage may advance only when its successor has emptied. What it does not capture is the entire reason to use two-phase — there is a clock here, and its transitions swamp the two the protocol saved. Read it as an executable specification of the protocol's *state machine*, not as the circuit.

Simulated with a producer and a consumer that both stall by a random number of cycles, checking every delivered word against a reference queue: 400 data words, in order, no drops or duplicates, including the asymmetric named vectors `0x01` and `0x80` that catch a reversed bit order. Reversing `d_o`'s bit order in the register makes the same testbench fail, so the check is load-bearing.

**Related Notes**

- [[Four-Phase Handshake]] – compares: the same two wires with return-to-zero levels, twice the transitions and a latch enable that is free.
- [[Micropipeline]] – extends: chains this one-place channel into a real pipeline, and is where the capture-pass latch that Spade cannot express actually lives.
- [[Network-On-Chip Link]] – supports: the case that justifies the protocol, where the wire is long enough that its capacitance dominates everything at either end.
- [[Bundled-Data Interface]] – depends-on: two-phase changes only the signalling; the single-rail payload and its timing assumption are unchanged.
- [[Dual-Rail Encoding]] – counter-example: its return-to-spacer phase is inherently four-phase, so the transition saving cannot be had at all.
- [[Choosing an Asynchronous Style]] – compares: where this sits once area, energy and tooling are weighed together.

## References

- *0.5) Asynchronous Sequential Logic*, "Handshaking protocols" and "Trade-offs" — bundled data, the matched-delay constraint, and the four- versus two-phase transition count.
- Sutherland, "Micropipelines", *Communications of the ACM* 32(6), 1989 — transition signalling and the capture-pass latch.
- Mano & Ciletti, *Digital Design*, ch. 9 (asynchronous sequential logic) — fundamental mode and the level-signalling baseline.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — switched-capacitance energy $\tfrac{1}{2}CV_{dd}^2$ per transition, and interconnect capacitance.
