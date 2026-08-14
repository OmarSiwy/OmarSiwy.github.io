---
title: Shift Register LUT
description: "The SLICEM's other mode: the 32 FFs chained instead of addressed, giving an addressable 32-deep delay line in one LUT5 — and a way to rewrite a LUT's contents through one wire in 32 cycles."
kind: circuit
source: "ASA §4.3.2, pp. 96-98"
status: seed
spade: simulated
tags: [digital, fpgas, memory, delay-line]
aliases:
  - SRL
  - SRL32
  - Shift Register LUTs
  - Shift-Register LUT
---

# Shift Register LUT

A SLICEM LUT5 whose 32 storage cells are chained head-to-tail instead of address-decoded, so the LUT's read address selects *which delayed copy* of the input to emit rather than which stored bit.

```tikz title="Shift-register LUT: 32 chained FFs read by the LUT's own 32:1 address mux"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- clock bus
  \draw (-3.4,1.15) -- (7.4,1.15);
  \node[anchor=east] at (-3.5,1.15) {clk};
  \draw[->] (0,1.15) -- (0,0.42);
  \draw[->] (1.8,1.15) -- (1.8,0.42);
  \draw[->] (3.6,1.15) -- (3.6,0.42);
  \draw[->] (6.6,1.15) -- (6.6,0.42);

  % --- the 32 chained flip-flops (4 drawn, 28 elided)
  \node[draw,minimum width=1.1cm,minimum height=0.85cm] (q0) at (0,0)   {$q_0$};
  \node[draw,minimum width=1.1cm,minimum height=0.85cm] (q1) at (1.8,0) {$q_1$};
  \node[draw,minimum width=1.1cm,minimum height=0.85cm] (q2) at (3.6,0) {$q_2$};
  \node[draw,minimum width=1.1cm,minimum height=0.85cm] (q31) at (6.6,0) {$q_{31}$};
  \node at (5.1,0) {$\cdots$};

  \draw[->] (-3.4,0) -- (q0.west);
  \node[anchor=south] at (-1.95,0.1) {DI1 / MC31$_{\text{prev}}$ (1)};
  \draw[->] (q0.east) -- (q1.west);
  \draw[->] (q1.east) -- (q2.west);
  \draw (q2.east) -- (4.7,0);
  \draw[->] (5.5,0) -- (q31.west);
  \draw[->] (q31.east) -- (8.3,0);
  \node[anchor=west] at (8.35,0) {MC31 (1)};

  % --- read multiplexer
  \draw (-0.85,-1.55) -- (7.45,-1.55) -- (6.45,-2.6) -- (0.15,-2.6) -- cycle;
  \node at (3.3,-2.25) {32 : 1};

  \draw (q0.south)  -- (0,-1.55);   \node[anchor=north west] at (0.06,-1.6)  {\footnotesize 0};
  \draw (q1.south)  -- (1.8,-1.55); \node[anchor=north west] at (1.86,-1.6)  {\footnotesize 1};
  \draw (q2.south)  -- (3.6,-1.55); \node[anchor=north west] at (3.66,-1.6)  {\footnotesize 2};
  \draw (q31.south) -- (6.6,-1.55); \node[anchor=north east] at (6.54,-1.6)  {\footnotesize 31};
  \node at (5.1,-1.15) {$\cdots$};

  \draw[->] (-3.4,-2.1) -- (-0.32,-2.1);
  \node[anchor=east] at (-3.5,-2.1) {A0\dots4 (5)};

  \draw[->] (3.3,-2.6) -- (3.3,-3.35);
  \node[anchor=west] at (3.4,-3.15) {O5 (1) $= q_{A}$};
\end{circuitikz}
\end{document}
```

*after Fig. 4.7b, p. 97; tap indices drawn in the order the hardware addresses them (see the warning below).*

**Keep the cells, change only the wiring between them.** [[Distributed Memory]] mode turns a LUT5's 32 configuration cells into writable flip-flops and adds a one-hot write decoder driven by the write address WA0…4. Shift-register mode keeps the same 32 FFs and the same 32:1 read mux and deletes the decoder, wiring instead the output of cell $k$ into the data input of cell $k{+}1$. The only ports that change are the head and the tail: DI1 (1 bit) feeds the chain, MC31 (1 bit) leaves it. Both are configuration modes of the same silicon, so a given LUT5 is a table, a RAM, or a delay line — never two at once.

**Turn the address into a delay.** Let $d(n)$ be the 1-bit value on DI1 at cycle $n$. The chain gives $q_0(n) = d(n-1)$ and $q_k(n) = q_{k-1}(n-1)$; unrolling that recurrence $k$ times yields $q_k(n) = d(n-k-1)$ by induction on $k$. The read mux emits $q_A$, where the 5-bit address $A \in \{0,\dots,31\}$ arrives on the very inputs A0…4 that would otherwise index the truth table, so

$$\mathrm{O5}(n) \;=\; d\bigl(n - (A+1)\bigr).$$

One LUT5 is therefore a delay line of runtime-selectable depth $A+1$, between 1 and 32 cycles. The $+1$ is not an off-by-one to be tidied away: the data must clock through at least one FF before any tap can observe it, which is the "at least a delay of one" of p. 97.

**Why this is the cheapest delay in the fabric.** Thirty-two cycles of delay built from ordinary [[Basic Logic Element]] flip-flops costs 32 FFs *and* 32 hops of general routing, because a BLE's FF is fed from that BLE's LUT output — each stage is a separate placement with its own timing closure. The SRL chain is internal to one LUT5: zero fabric routing between stages, and the whole cost is the one LUT it occupies. A LUT6 fractures into two LUT5s ([[Fracturable LUT]]), so it buys either two independent 32-deep lines or, by cascading MC31 into the next LUT5's DI1, one 64-deep line; cascading further is how depth $D$ is reached. A $w$-bit-wide, $D$-deep line costs

$$w \left\lceil \frac{D}{32} \right\rceil \text{ LUT5},$$

with fabric routing only at the two ends. The comparison worth holding is [[Block Memory]]: a circular buffer in a 36 kbit tile does the same job with an address counter, but spends a whole tile and several cycles of access latency (p. 98), so it wins only when $D$ is large enough that the LUT count would be embarrassing.

**On an ASIC the trick does not exist.** There, a 32-deep tapped delay line *is* 32 flip-flops plus a 32:1 mux, and its area grows with depth exactly as the naive FPGA version does. The SRL is cheap purely because the configuration memory sitting in every SLICEM LUT is already paid for and otherwise idle — a reconfigurability overhead recycled as a datapath resource.

> [!important]
> The 32 FFs *are* the LUT5's truth table — a LUT is a ROM ([[Lookup-Tables]]). Shifting 32 bits in through DI1 therefore does not merely fill a delay line, it **replaces the Boolean function the LUT computes**, in 32 clock cycles, over one wire, with no partial-reconfiguration bitstream and no interruption to the rest of the design (p. 98).

**That makes a constant swappable at runtime.** The structure stays fixed and only the table changes, which is the cheap end of dynamic reconfiguration [Möl17; Har+19]. It is what lets [[Multiplication by Constants]] keep its constant-specific shift-and-add structure while still admitting a new constant occasionally, and what lets the coefficient tables of [[LTI Filters]] be retuned without re-synthesis. The economics are a lifetime argument: the operator is unavailable for the 32 cycles of the shift, so the technique pays exactly when a coefficient survives many more than 32 samples — and loses outright to a real multiplier when the coefficient changes every sample.

$$\boxed{\ \mathrm{O5}(n) = \mathrm{DI1}\bigl(n - (A+1)\bigr),\quad A \in \{0,\dots,31\}
\qquad\text{cost } = w\left\lceil D/32 \right\rceil \text{ LUT5}\ }$$

**Where it stops paying.**

- **No reset.** The FFs come up with whatever the bitstream loaded and there is no synchronous clear on the chain. Flushing means clocking 32 zeros through it — 32 cycles, not one. Anything on a fast-abort or fast-restart path needs real FFs.
- **One tap at a time.** A LUT5 exposes exactly one address and one output, so an SRL is a *single-tap* resource. A direct-form FIR needs all $N$ taps of its delay line simultaneously and cannot be folded into one; the SRL fits where the delay is one long lump — pipeline balancing, latency alignment between unequal branches, a serial or polyphase structure's deep buffer.
- **Shallow delays lose.** Below roughly four stages a plain FF chain uses BLE flip-flops that are idle anyway and costs no LUT at all, while the SRL spends a LUT5 that could have been logic.
- **Retargeting $A$ mid-stream is not a re-timing.** Changing the address re-points the tap instantly; the stream at the output jumps forward or backward, dropping or repeating samples. Safe as one-time delay calibration, wrong as a streaming operation.
- **SLICEM only.** Logic slices do not have the mode. A design asking for more SRLs than the device's SLICEM budget spills the excess into ordinary FFs, and the cost model above stops holding.

> [!warning] Figure 4.7b's tap numbering is drawn backwards
> The book draws the chain bottom-to-top: DI1 enters the cell next to mux port **31**, and the cell next to mux port **0** is the one that drives MC31. Read literally, that makes address 0 the 32-cycle tap and address 31 the 1-cycle tap. It also contradicts the figure's own labelling — a port named MC31 should be the output of stage 31, not of stage 0 — and it contradicts AMD's SRLC32E primitive, where `A = 0` selects a one-cycle delay and `Q31` is the 32nd stage. The diagram above uses the hardware order. The prose of p. 97 ("having at least a delay of one") is correct under either reading.

> [!warning] Not covered in the source — needs outside research
> Chapter 4 gives no $f_{\max}$, no tap-mux delay and no clock-enable timing for SRL mode, so this note carries no timing numbers. It also describes the mode only for AMD SLICEMs; whether an Intel MLAB ALM offers an equivalent chained mode is not stated (p. 96 mentions only its $32\times2$ dual-port RAM configuration).

**In RTL.** Spade has no SRL primitive, so the mode is written as what it is — a 32-element array register with a runtime-indexed read:

```spade
entity srl32(clk: clock, ce: bool, d: bool, a: uint<5>) -> (bool, bool) {
    reg(clk) q: [bool; 32] initial([false; 32]) =
        if ce { q.shift_front(d) } else { q };
    (q[a], q[31])
}
```

`q` is the column of flip-flops in the diagram, element 0 the cell nearest DI1; `shift_front` is precisely the wiring $q_k \leftarrow q_{k-1}$, and `initial` stands for the power-on contents the bitstream supplies — Spade has no way to express the *absence* of a reset, so note that there is deliberately no `reset(...)` clause here. The runtime array index `q[a]` is the 32:1 read mux with `a` = A0…4 (5 bits), and `q[31]` is MC31, the fixed cascade tap. Everything is registered except that one mux. Synthesis on an FPGA collapses the whole entity into a single SRL32E primitive; on any other target it is 32 flops and a mux, which is exactly the cost the SRL exists to avoid.

Simulated against a behavioural `{sh[30:0], d}` reference: 3085 clocked vectors, including a single-impulse test asserting that `a = 3` emits at cycle 4 and at no other cycle, that MC31 emits at cycle 32, that `ce = 0` freezes the chain, and a 3000-cycle random sweep of `d`, `ce` and `a`.

**Related notes.**

- [[Distributed Memory]] – compares: the same 32 cells with a write decoder instead of a chain; the two modes are mutually exclusive in one LUT5.
- [[Lookup-Tables]] – depends-on: the identity "a LUT is a ROM" is what makes shifting 32 bits in a reprogramming of the function.
- [[Fracturable LUT]] – supports: the LUT6-into-two-LUT5 split that sets the 32-versus-64 granularity.
- [[Block Memory]] – counter-example: past a few hundred cycles of depth the tile-based circular buffer beats $\lceil D/32 \rceil$ LUT5, at the price of multi-cycle access.
- [[Basic Logic Element]] – compares: the FF-chain baseline this mode undercuts by removing the routing between stages.
- [[Multiplication by Constants]] – extends: a constant-specific datapath stays fixed while its table is shifted in anew.
- [[LTI Filters]] – extends: coefficient retuning without re-synthesis, and the delay-line buffers the structure needs.
- [[Choosing an FPGA Primitive]] – compares: where a delay belongs among LUT, FF, SRL and block RAM.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §4.3.2 "Shift Register LUTs", pp. 97–98; Fig. 4.7b, p. 97.
- §4.3.1 "Distributed Memory", pp. 96–97 — the SLICEM structure this mode reuses.
- §4.3.3 "Block Memory", p. 98 — the multi-cycle alternative for deep buffers.
