---
title: "Bundled-Data Handshake Link"
description: "Four-phase req/ack sequencing with a Muller C-element join and a matched delay line — clockless link traversal with data-dependent latency, at the price of a timing assumption STA cannot check."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, network-on-chip, asynchronous, handshake, gals, timing]
aliases:
  - Bundled-Data Link
  - Bundled Data
  - Bundled-Data Channel
  - Self-Timed Link
  - Handshake Link
---

# Bundled-Data Handshake Link

A point-to-point link that carries an ordinary single-rail $W$-bit bus plus two control wires, $req$ and $ack$, and replaces the clock edge that would have validated the data with a delay line built to be slower than the data path.

```tikz title="Bundled-data link: matched delay on the request wire, C-element join, and the four-phase return-to-zero handshake"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- datapath ----
  \node[draw, minimum width=1.9cm, minimum height=1.1cm, align=center] (S) at (1,2.4)
        {sender\\latch};
  \node[draw, minimum width=1.9cm, minimum height=1.1cm, align=center] (R) at (9.4,2.4)
        {receiver\\latch};
  \draw[->, thick] (S.east) -- node[above, midway] {data bus, $W$ wires}
                             node[below, midway] {combinational delay $\le t_{d}$} (R.west);

  % ---- request path: matched delay line ----
  \node[draw, minimum width=2.6cm, minimum height=0.8cm, align=center] (D) at (4.2,0.7)
        {matched delay\\$\Delta > t_{d}$};
  \node[circle, draw, minimum size=0.75cm] (C) at (7.6,0.7) {C};
  \draw[->] (1,1.85) -- (1,0.7) -- (D.west);
  \draw[->] (D.east) -- node[above, midway] {$req$, 1 wire} (C.west);

  % ---- C output: latch enable, and the outgoing acknowledge ----
  \draw (C.east) -- (10.9,0.7);
  \draw[->] (9.4,0.7) -- (9.4,1.85);
  \fill (9.4,0.7) circle (1.6pt);
  \node[anchor=west] at (7.95,1.05) {enable};
  \draw[->] (10.9,0.7) -- (10.9,-1.4) -- (0.2,-1.4) -- (0.2,1.85);
  \node[anchor=south] at (5.2,-1.35) {$ack$, 1 wire, return-to-zero};

  % ---- downstream acknowledge into the C-element ----
  \draw[->] (7.6,-0.55) -- (C.south);
  \node[circle, draw, fill=white, inner sep=1.1pt] at (7.6,0.33) {};
  \node[anchor=east] at (7.4,-0.5) {$ack$ of the next stage};

  % ---- four-phase waveform ----
  \begin{scope}[yshift=-5.2cm, xshift=1.4cm]
    \draw[gray!60] (0,-0.35) -- (0,2.15);
    \node[anchor=east] at (-0.15,1.75) {data};
    \node[anchor=east] at (-0.15,0.9)  {$req$};
    \node[anchor=east] at (-0.15,0.15) {$ack$};
    \draw (0,1.55) -- (0.5,1.55) -- (0.9,1.95) -- (5.6,1.95) -- (6.0,1.55) -- (6.6,1.55);
    \draw (0,1.95) -- (0.5,1.95) -- (0.9,1.55) -- (5.6,1.55) -- (6.0,1.95) -- (6.6,1.95);
    \node at (3.2,1.75) {valid};
    \draw[thick] (0,0.7) -- (1.9,0.7) -- (1.9,1.15) -- (4.3,1.15) -- (4.3,0.7) -- (6.6,0.7);
    \draw[thick] (0,-0.05) -- (3.1,-0.05) -- (3.1,0.4) -- (5.5,0.4) -- (5.5,-0.05) -- (6.6,-0.05);
    \draw[<->] (0.9,2.35) -- (1.9,2.35);
    \node[anchor=south] at (1.4,2.4) {$\Delta$};
    \node[anchor=south west] at (1.95,1.15) {\scriptsize 1};
    \node[anchor=south west] at (3.15,0.4)  {\scriptsize 2};
    \node[anchor=south west] at (4.35,0.7)  {\scriptsize 3};
    \node[anchor=south west] at (5.55,-0.05) {\scriptsize 4};
    \node[anchor=north] at (3.3,-0.6) {one four-phase transaction};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Localise the timing contract instead of distributing it.** A synchronous link carries $W$ data wires and shares one global clock; the contract "the data on this bus is valid now" is discharged by a clock edge whose skew is budgeted die-wide. That budget is the expensive part — a global grid across an interconnect that spans the whole die grows as $\Theta(N)$ in wire and buffer power for $N$ tiles, and it is paid on every cycle whether or not the link carries a flit. A bundled-data link keeps the same $W$ single-rail data wires and adds exactly two: $req$ (1 wire, sender to receiver) and $ack$ (1 wire, receiver to sender). $W+2$ wires against the synchronous $W$ plus a share of the clock tree. The contract is now local: *this* sender promises *this* receiver that when $req$ rises the bus is settled, and nothing outside the link has to agree on a phase.

**Sequence the transaction in four phases so both ends return to a known state.** The protocol is a return-to-zero cycle, numbered in the waveform above: (1) sender drives the bus, waits, then raises $req$; (2) receiver captures and raises $ack$; (3) sender observes $ack$ and lowers $req$, releasing the bus; (4) receiver observes $req$ low and lowers $ack$. Only after phase 4 may the next datum start. Every transaction therefore costs four control transitions on two wires. Two-phase (non-return-to-zero) signalling encodes an event as *any* transition, halving that to two, but then every capture element must be sensitive to both edges, which costs area in the latch and in the controller — the classic trade is control-wire energy against control-logic area, and four-phase wins whenever the datapath is wide, because $W$ data transitions dominate the two you saved.

**Make "wait for both" a single gate, and derive why the redundant term is mandatory.** The join element is the [[Muller C-Element]]: two inputs, one output, output goes to 1 only when both inputs are 1, goes to 0 only when both are 0, and holds otherwise. Writing the next output $y^{+}$ as a function of $a$, $b$ and the current $y$, the specification is the majority function of three:

$$y^{+} = \operatorname{maj}(a,b,y) = ab + ay + by$$

and by distributivity of AND over OR, $ay + by = y(a+b)$, giving the form used in every implementation:

$$y^{+} = ab + y(a+b)$$

The term $ab$ is redundant *as a Boolean function* — absorption gives $ab + aby = ab$, and the cover $ay + by$ alone already produces 1 whenever $a=b=y=1$. It is not redundant *as a circuit*. $ab$ is the consensus term of $ay$ and $by$ (consensus theorem: $xz + \bar{x}w \supseteq zw$, here with $y$ the shared literal), and in a circuit with no clock the transition $a{:}1\,b{:}1\,y{:}1 \to a{:}1\,b{:}0\,y{:}1$ walks between the two remaining product terms. Without the consensus term covering the path, one product turns off before the other turns on and the output glitches to 0 — a static-1 hazard. A synchronous design ignores this because the glitch settles before the next edge; here the glitch *is* a protocol event and the link deadlocks or double-fires. The rule is general and is the reason asynchronous logic is written as a full prime-implicant cover rather than a minimal one.

**Guarantee the data is stable before the C-element sees the request.** The C-element only sequences; it does not verify anything about the bus. Validity comes from the matched delay line $\Delta$ on the request wire. If the sender's combinational logic and the wires settle within $t_d$ in the worst corner, then choosing $\Delta > t_{d,\max}$ makes $req$ arrive strictly after the data, and the receiver's 1-bit latch enable is safe. In an ASIC the delay line is built as a *replica*: the same cell types, the same fan-out, ideally the same wire layer as the path it shadows, so that process, voltage and temperature move both together to first order and the margin does not have to cover the full PVT spread. This is why the constraint is $\Delta > t_d$ and not $\Delta > t_d + $ some fixed number — the replica tracks, the margin only covers mismatch.

> [!important]
> Nothing in a standard static timing analysis flow checks $\Delta > t_{d,\max}$. STA verifies setup and hold against clock edges, and this link has no clock; the delay line and the path it shadows are two unrelated combinational cones as far as the tool is concerned. The check has to be set up by hand as a min/max path constraint pair, and if it is wrong the failure is a silent data corruption with no timing violation reported.

**Price the alternative that removes the assumption.** Dual-rail encoding sends each bit on two wires, $\{01\} = 0$, $\{10\} = 1$, $\{00\} = $ spacer, and detects completion by OR-ing each pair and joining the $W$ results in a C-element tree of depth $\lceil \log_2 W \rceil$. Validity is then carried by the data itself, so no timing assumption survives and the link is delay-insensitive. The cost is $2W$ data wires instead of $W$, and roughly $2\times$ the switching energy, because a four-phase dual-rail transaction toggles exactly one wire of every pair on the data phase and the same wire back on the spacer phase — the data is no longer allowed to stay put when it happens not to change. For an on-chip network where the link is a full flit wide, doubling the wire count is a floorplan decision, not a gate-count one, and that is usually what kills it.

**Understand what the clocklessness actually buys.** Latency is data-dependent rather than quantised: a stage completes when its logic completes, not on the next edge, so a fast case is not rounded up to a full period. Idle links consume no switching energy at all, since there is no clock to toggle — for an interconnect whose links are mostly idle, this is the dominant effect and the real motivation. The corollary is that a GALS link has no fixed cycle cost, so it cannot be entered into the round-trip credit calculation the way a synchronous link can; see [[Credit-Based Flow Control]], where the buffer depth $B$ is derived from a *countable* $t_{crt}$.

**On FPGA, do not build this.** Both halves of the circuit fight the fabric. The C-element is a combinational loop — synthesis will either break it, replicate it, or emit a comb-loop warning and leave it untimed, and holding it requires vendor `KEEP`/`DONT_TOUCH` attributes plus manual placement so the loop stays inside one LUT. The matched delay line is worse: FPGA delay lives in the routing, which the placer is free to change on every recompile, and carry-chain or LUT-chain delay swings hard with voltage and temperature, so the margin needed to make $\Delta > t_{d,\max}$ safe across the operating range eats the throughput the asynchronous link was supposed to win. The practical FPGA answer for the same problem — moving data between unrelated clock domains — is the [[Dual-Clock Asynchronous FIFO]], where the only unbounded-time event is metastability resolution on Gray-coded pointers, and that has a computable MTBF. ASIC is where bundled data is a real option, because the replica delay line can be built out of the same cells on the same layers as the path it shadows.

$$\boxed{\ y^{+} = ab + y(a+b) \quad\text{(hazard-free cover)},\qquad \Delta > t_{d,\max}\ }$$

## When it breaks

- **$\Delta$ under-margined.** The receiver latches before the bus settles. There is no timing violation to report, no error flag, and no clock edge to blame — the flit is simply wrong. This is the only failure mode on the list that is silent.
- **$\Delta$ over-margined.** Throughput falls linearly in the excess. A designer who cannot get the replica to track and pads the delay to cover full PVT spread has built a link slower than the synchronous one it replaced.
- **The consensus term optimised away.** Any synthesis pass that minimises $ab + ay + by$ to $ay + by$ produces a functionally identical, hazard-prone C-element. The gate must be instantiated from a cell library, not inferred.
- **Wide buses.** $\Delta$ must cover the slowest of all $W$ bits, so the "data-dependent latency" advantage only materialises when the *stage logic* varies with data, not merely the wires. A pure wire link has a fixed worst case and gains nothing but the idle-power saving.
- **Fan-in above two.** A join of $k$ requests needs a C-tree of depth $\lceil \log_2 k \rceil$, and the delay assumption has to hold against the slowest branch, so the margin compounds with the tree.
- **Test.** There is no clock to stop, single-step or scan, so the standard scan-insertion flow does not apply to the controller. Async control is normally tested by wrapping it in synchronous test logic, which reintroduces part of the cost it avoided.
- **Where a sibling takes over.** Within one clock domain, a plain synchronous link plus [[Credit-Based Flow Control]] is smaller and analysable. Across unrelated domains on FPGA, [[Dual-Clock Asynchronous FIFO]]. Across a constant-phase-offset domain, a phase-tolerant [[Mesochronous Link FIFO]] with no metastability risk at all.

## RTL (Spade)

`spade: not-expressible`. The C-element is state held by a combinational loop, and Spade has no latch primitive: `let` bindings cannot refer to themselves, so the majority-with-feedback equation has nowhere to live. Written out directly:

```spade
fn c_element(a: bool, b: bool) -> bool {
    let y = (a && b) || (y && (a || b));
    y
}
```

```
error: Use of undeclared name y
  ┌─ /tmp/ce_fail.spade:4:26
  │
4 │     let y = (a && b) || (y && (a || b));
  │                          ^ Undeclared name
```

Passing `y` back in as a third argument type-checks, and is exactly the wrong repair — it makes the function a 3-input majority gate with no memory, which is a mux, not a latch. The nearest structure Spade is native at is the same equation with the loop cut by a register, plus the four-phase receiver as a clocked sequencer:

```spade
/// Muller C-element with the feedback loop cut by a register: the majority
/// function y = ab + y(a+b) evaluated once per clock edge.
entity c_element(clk: clock, rst: bool, a: bool, b: bool) -> bool {
    reg(clk) y reset(rst: false) = (a && b) || (y && (a || b));
    y
}

/// Four-phase bundled-data receiver.  `req` has already been delayed past the
/// data path by the matched delay line, so `data` is guaranteed stable when
/// `req` rises.  `ack` mirrors `req` one edge later, completing the RTZ cycle.
entity fourphase_rx<#uint W>(clk: clock, rst: bool, req: bool, data: uint<W>)
    -> (uint<W>, bool)
{
    reg(clk) ack reset(rst: false) = req;
    reg(clk) held reset(rst: 0) = if req && !ack { data } else { held };
    (held, ack)
}
```

`y` is the C-element circle in the diagram, `req` the wire out of the delay box, `ack` the return wire, and `held` the $W$-bit receiver latch — `req && !ack` is the rising-edge detect that stands in for the enable pulse the real circuit gets from the C-element output. Everything is registered, so widths do not grow: `held` is `uint<W>` in and out, and the three control signals are 1 bit each. What this captures is the *ordering* — set on agreement, hold on disagreement, one capture per handshake, no re-capture while `ack` is high. What it does not capture is the entire point of the circuit: the register makes the state change on a clock edge that does not exist in the real link, so latency is quantised again, the hazard argument for the consensus term becomes vacuous, and the matched delay $\Delta$ has no representation at all. Synthesis of the real gate comes from a library cell or a hand-drawn transistor stack, never from this.

The clocked entities above compile and simulate correctly, and simulating them still proves nothing about the asynchronous link: a functional simulator has no notion of $\Delta$, and the failure mode this circuit is defined by — capture before settle — is invisible to it. Only an SDF-annotated or analogue simulation, plus a hand-written min/max path constraint, checks the real design.

## Related Notes

- [[Muller C-Element]] – depends-on: the join gate whose majority-with-feedback equation this link is built around, and the reason the whole thing is not synthesizable from RTL.
- [[Asynchronous Sequential Logic]] – depends-on: supplies the hazard-free-cover rule that forces the consensus term, and the general req/ack framework this protocol instantiates.
- [[Dual-Clock Asynchronous FIFO]] – compares: the other GALS implementation, which buys a computable MTBF and a synthesizable design at the cost of two to three destination-clock cycles per crossing.
- [[Mesochronous Link FIFO]] – compares: what replaces this when the phase offset is arbitrary but constant, where no metastability risk exists in principle.
- [[Credit-Based Flow Control]] – counter-example: its buffer-depth derivation needs a countable round-trip time $t_{crt}$, which a link with data-dependent latency does not provide.

## References

- `6.3) Network-On-Chip.md`, §"Clocking: synchronous, mesochronous, GALS" — the GALS regimes, the C-element equation $y^{+} = ab + y(a+b)$, the bundled-data timing assumption, and the dual-rail comparison at $2\times$ wires and $\approx 2\times$ switching energy.
- Mano & Ciletti, *Digital Design* — asynchronous sequential logic: hazards in level-mode circuits and the requirement that the sum-of-products cover include consensus terms.
- Weste & Harris, *CMOS VLSI Design* — self-timed and bundled-data signalling, matched/replica delay lines, and the C-element as a circuit primitive.
- Wakerly, *Digital Design: Principles and Practices* — static hazards and the consensus theorem.
