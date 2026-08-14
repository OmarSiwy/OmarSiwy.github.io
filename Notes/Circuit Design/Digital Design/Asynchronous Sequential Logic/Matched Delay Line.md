---
title: Matched Delay Line
description: "A delay longer than the datapath it shadows, so a bundled-data request never outruns its data — the one thing in the flow you must build, and the one thing synthesis will delete."
kind: circuit
status: seed
spade: n/a
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Matched Delay
  - Matched Delay Lines
  - Delay Matching
  - Bundled-Data Delay Line
---

# Matched Delay Line

A 1-bit delay element deliberately built to be slower than the $k$-bit combinational path running beside it, so that a control transition arriving at the far end is a guarantee that the data has already settled.

```tikz title="Matched delay line shadowing a bundled-data stage"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- datapath ---
  \draw[thick] (0,0.9) rectangle (2.8,2.3);
  \node at (1.4,1.75) {combinational $f$};
  \node at (1.4,1.25) {$t_{pd,\max}$};
  \draw[->,thick] (-1.7,1.6) -- (0,1.6);
  \node[anchor=south] at (-0.85,1.7) {$d_{\text{in}}\,[k]$};
  \draw[->,thick] (2.8,1.6) -- (6.2,1.6);
  \node[anchor=south] at (4.5,1.7) {$[k]$};
  \draw[thick] (6.2,0.9) rectangle (7.2,2.3);
  \node at (6.7,1.6) {\textbf{L}};
  \draw[->,thick] (7.2,1.6) -- (9.1,1.6);
  \node[anchor=south] at (8.15,1.7) {$d_{\text{out}}\,[k]$};

  % --- matched delay line in the request path ---
  \node[not port] (n1) at (0.75,-0.9) {};
  \node[not port] (n2) at (2.25,-0.9) {};
  \node[not port] (n3) at (3.75,-0.9) {};
  \node[not port] (n4) at (5.25,-0.9) {};
  \draw[->,thick] (-1.7,-0.9) -- (n1.in);
  \node[anchor=south] at (-0.85,-0.8) {$req_{\text{in}}\,[1]$};
  \draw[thick] (n1.out) -- (n2.in);
  \draw[thick] (n2.out) -- (n3.in);
  \draw[thick] (n3.out) -- (n4.in);
  \draw[->,thick] (n4.out) -- (6.7,-0.9) -- (6.7,0.9);
  \node[anchor=west] at (6.8,-0.5) {$req_{\text{out}}$ (latch enable)};

  \draw[dashed] (-0.15,-1.8) rectangle (6.0,-0.02);
  \node[anchor=north] at (2.9,-1.85) {matched delay, $t_{\text{matched}}$ --- \texttt{DONT\_TOUCH} + \texttt{LOC}};

  \node[anchor=north] at (3.2,-2.55) {$t_{\text{matched}}\;\ge\;t_{pd,\max}+t_{\text{setup}}$};
\end{circuitikz}
\end{document}
```

*Own construction; the four-inverter chain is schematic — the count is whatever characterisation says it must be.*

**Reduce the whole handshake's correctness to one inequality.** In a [[Bundled-Data Interface]] the datapath stays ordinary single-rail — $k$ wires carrying $d$, plus $req$ and $ack$ at 1 bit each. Nothing in that encoding announces when $d$ is valid, so validity has to be asserted by a separate wire, and the assertion is only true if the wire is slower than the data:

$$t_{\text{matched}} \;\ge\; t_{pd,\max}(f) + t_{\text{setup}}$$

This is literally the period constraint of [[Synchronous Sequential Logic]] with the global clock replaced by a per-stage signal. Same worst-case number, same $t_{pd,\max}$, same setup term. The win is not that the number got smaller — it did not — but that it became *local*: only this stage pays it, and only on the cycles this stage is actually used. A stage that is idle costs nothing, and a stage whose worst case is rare no longer holds the rest of the chip to its own bad day.

**Note that the same element solves a second, older problem.** Classical [[Huffman Feedback Model]] design needs a delay for a different reason: an *essential hazard* is a property of the flow table, not of the cover, so no consensus term removes it. Its mechanism is skew — the input $x_i$ reaches different gates by paths of different length, a secondary variable $y_j$ changes and propagates before the late copy of $x_i$ arrives, and the circuit runs ahead as though $x_i$ had changed three times. The only cure is to make the feedback slower than the skew:

$$\Delta_{\text{feedback}} \;>\; \max_{\text{gates } g}\big(t_{x_i \to g}\big) - \min_{\text{gates } g}\big(t_{x_i \to g}\big)$$

Both inequalities have the same shape: a deliberately-built delay dominating a path delay you do not otherwise control. The difference is what it shadows — a whole datapath in one case, an input fanout skew in the other.

**Understand why "matched" is the load-bearing word, not "delay".** Meeting the inequality once, at one corner, is easy: pad the chain until it is comfortably long. The problem is that $t_{pd,\max}(f)$ moves with process, voltage and temperature, sometimes by a factor of several between slow-cold and fast-hot. If the delay line does *not* move the same way, the margin you characterised at nominal evaporates at some corner and the latch captures a partially-settled $d$ — a silent data corruption with no failing timing report behind it. So the line is built from the *same* circuit family as the logic it shadows: inverters and interconnect on the same die, ideally a structural replica of the critical path (a dummy copy of the carry chain, the same wire lengths) rather than a generic inverter string. Then $t_{\text{matched}}/t_{pd,\max}$ is a ratio of like quantities and tracks, and the margin you need is only the *residual mismatch* rather than the full PVT spread.

> [!warning] Not covered in the source — needs outside research
> No margin percentage is quoted here. How much of $t_{pd,\max}$ a matched line must add to survive PVT and on-chip variation is a per-process characterisation number, and inventing one would be worse than omitting it. Treat "tens of percent, and worse on FPGA" as an ordering, not a measurement.

**Note that the cost is $O(1)$ in datapath width.** The line carries $req$, which is 1 bit, whatever $k$ is. Widen the datapath from 8 to 64 bits and the delay line does not widen — it only lengthens if the wider $f$ got slower. That is the structural reason bundled data is the cheap async style: [[Dual-Rail Encoding]] pays $2k$ wires and a $k$-input [[Completion Detection Tree]] to *measure* completion, while bundled data pays one 1-bit chain to *assume* it. You trade wires for a timing assumption.

**Follow what the FPGA flow does to it.** Every property that makes a delay line work is invisible to RTL synthesis, so the flow attacks it from three directions at once.

- **The logic optimiser deletes it.** An even-length inverter chain computes the identity function. A synthesiser that collapses $\overline{\overline{\overline{\overline{req}}}} = req$ to a wire is not misbehaving; it is applying involution of complement, which is a theorem of [[Boolean Algebra]]. The netlist simply does not contain the fact that this identity was wanted for its delay.
- **What survives is a hard primitive with a placement constraint.** Either a [[Fast Carry Chain]] (`CARRY4`/`CARRY8`) with a `LOC` pinning it to a column — attractive because the carry chain is the fastest, most repeatable, best-characterised delay on the die — or a chain of [[Lookup-Tables]] with `DONT_TOUCH` on *every* intermediate net, since one un-annotated net is enough to let the optimiser splice through it.
- **Static timing analysis cannot check it.** STA reports the *bound* on a path, not that a path is slower than another path by a required margin; and on FPGA the routing delay dominates the logic delay and is chosen by the router, so the ratio you characterised changes when the placement changes. The standard flow's answer is a `set_max_delay` on the datapath and a hand-certified assertion on the delay line, which is a promise, not a proof.

> [!important] The delay line is the one part of an asynchronous design whose correctness lives in the constraint file rather than in the HDL. Every other element — C-elements, latches, function blocks — has a logic function that a netlist can carry. This one has the identity function and a number, and the netlist can only carry the identity.

$$\boxed{\ t_{\text{matched}} \;\ge\; t_{pd,\max}(f) + t_{\text{setup}}
\qquad\text{and}\qquad
\Delta_{\text{feedback}} \;>\; \max_{g} t_{x_i \to g} - \min_{g} t_{x_i \to g}\ }$$

**When it breaks.**

- **The datapath's worst case is data-dependent and long.** A matched line must cover $t_{pd,\max}$, so a stage whose delay spread is wide (a ripple-carry addition, where the true worst case is a full-length carry propagation that almost never happens) gets no average-case benefit at all — the whole point of async, gone. Completion detection, i.e. [[Dual-Rail Encoding]], is what recovers it.
- **Near-threshold and subthreshold operation.** $t_{pd}$ varies by orders of magnitude with $V_{DD}$ and temperature, and the delay line's variation is *not* perfectly correlated with the logic's, because the logic has different stack depths and fanouts. No matched line survives this; QDI does, which is the main reason QDI exists.
- **The shadowed path changes after characterisation.** ECO, a re-route, a different placement seed, a synthesis-tool upgrade — any of these can slow the datapath without touching the line. The constraint is not self-checking, so the failure appears as an intermittent data corruption in silicon, not as a violated report.
- **FPGA routing skew.** The delay line and the datapath are routed independently. The ratio is set by the router, which optimises for the constraints it was given and has no notion of "these two paths must stay in proportion."
- **The line is too long.** Over-padding is safe but pure loss: it is the per-stage cycle time. Push the margin far enough and the bundled-data stage is slower than the synchronous stage it replaced, at which point the clock tree's power was a bargain.

**RTL (Spade): `n/a`.** There is nothing to write. The circuit's logic function is the identity, and its entire specification is a *number* — a delay that no HDL semantics expresses and no synthesiser preserves. The point is checkable rather than rhetorical: a four-inverter chain written as `let a = !d; let b = !a; ...` compiles cleanly, and the emitted Verilog is four chained `assign _e = ~_e;` statements which any downstream optimiser folds to `assign output__ = req;` by involution. Compiling it would demonstrate the deletion, not the delay. The real artifact is an `XDC`/`SDC` fragment — a primitive instantiation, a `LOC`, a `DONT_TOUCH`, a `set_max_delay` — which is not RTL.

**Related Notes**

- [[Bundled-Data Interface]] – supports: this is the timing assumption that whole protocol rests on; without it, $req$ means nothing.
- [[Fast Carry Chain]] – depends-on: the preferred FPGA carrier, because it is the most repeatable and best-characterised delay on the die.
- [[Lookup-Tables]] – depends-on: the fallback carrier, one LUT per delay increment, `DONT_TOUCH` on every net between them.
- [[Huffman Feedback Model]] – supports: the older use, where the delay sits in the feedback path to defeat an essential hazard rather than in a request path.
- [[Dual-Rail Encoding]] – counter-example: measures completion instead of assuming it, deleting the timing assumption at the price of $2k$ wires.
- [[Completion Detection Tree]] – compares: what you build when a matched delay cannot track, e.g. at near-threshold voltages.
- [[Choosing an Asynchronous Style]] – compares: where the bundled-data/matched-delay point sits against every sibling.

## References

No assigned book source; written from standard digital-design canon and from
`0.5) Asynchronous Sequential Logic` §§ *Handshaking protocols*, *FPGA mapping*,
*Essential hazards*.

- S. H. Unger, *Asynchronous Sequential Switching Circuits* — essential hazards and the delay cure in the feedback path.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — bundled data, matched delays, the timing-model hierarchy.
- I. E. Sutherland, "Micropipelines" — matched delays in the two-phase request path.
- N. Weste & D. Harris, *CMOS VLSI Design* — delay matching, PVT tracking, on-chip variation.
- M. M. Mano & M. D. Ciletti, *Digital Design* — flow tables and the feedback delay requirement.
