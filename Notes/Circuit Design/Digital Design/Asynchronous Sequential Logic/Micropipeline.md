---
title: Micropipeline
description: "Sutherland's Muller pipeline with capture-pass latches hung off each C-element, turning transition-signalled events into a real datapath stage."
kind: circuit
source: "0.5) Asynchronous Sequential Logic, §Handshaking protocols; Sutherland, 'Micropipelines' (Turing Award lecture); Sparsø & Furber ch. 3"
status: seed
spade: not-expressible
tags: [digital, asynchronous-sequential-logic, pipeline, two-phase, handshake, bundled-data]
aliases:
  - Micropipeline
  - Micropipelines
  - Sutherland Micropipeline
  - Capture-Pass Pipeline
  - Event-Controlled Pipeline
---

# Micropipeline

**One-line summary:** A [[Muller Pipeline]] carrying real data, by hanging an event-controlled capture-pass latch off each C-element — the one pipeline structure in which the storage element is sensitive to *transitions* rather than to levels, which is both why two-phase signalling becomes usable and why the style stayed expensive.

```tikz title="Two micropipeline stages: C-element control, capture-pass latches, matched delay around the logic"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % ---------- datapath row ----------
  \draw[thick] (0,1.8) rectangle (2.0,3.4);
  \node[align=center] at (1.0,2.7) {capture-pass\\latch $L_0$};
  \draw[thick] (5.6,1.8) rectangle (7.6,3.4);
  \node[align=center] at (6.6,2.7) {capture-pass\\latch $L_1$};
  \draw[thick] (3.1,1.95) rectangle (4.5,3.25);
  \node at (3.8,2.6) {$f$};

  \draw[->] (-1.0,2.95) -- (0,2.95);   \node[anchor=south] at (-0.5,3.02) {$d\;[k]$};
  \draw[->] (2.0,2.95) -- (3.1,2.95);
  \draw[->] (4.5,2.95) -- (5.6,2.95);
  \draw[->] (7.6,2.95) -- (8.7,2.95);  \node[anchor=south] at (8.15,3.02) {$d'\;[k]$};

  % ---------- control row: two C-elements ----------
  \draw[thick] (1.35,0) circle (0.42);  \node at (1.35,0) {\textbf{C}};
  \draw[thick] (6.95,0) circle (0.42);  \node at (6.95,0) {\textbf{C}};

  \draw[->] (-1.0,0.18) -- (0.97,0.18);
  \node[anchor=south] at (-0.35,0.26) {$R_{\text{in}}\;[1]$};
  \draw (5.95,-0.18) -- (6.39,-0.18);
  \draw[thick] (6.48,-0.18) circle (0.09);
  \node[anchor=east] at (5.90,-0.18) {$A_{\text{out}}\;[1]$};

  % c0 : capture control of L0, and the acknowledge back to the sender
  \draw (1.77,0) -- (2.2,0) -- (2.2,1.25) -- (1.35,1.25) -- (1.35,1.8);
  \fill (1.35,1.25) circle (0.055);
  \node[anchor=south west] at (1.42,1.40) {C};
  \draw[->] (1.35,1.25) -- (-1.0,1.25);
  \node[anchor=south] at (-0.30,1.32) {$A_{\text{in}}=c_0\;[1]$};

  % Cd_0 -> matched delay -> R_1
  \draw (2.0,2.15) -- (2.55,2.15) -- (2.55,0.9) -- (3.1,0.9);
  \node[anchor=south west] at (2.08,2.20) {Cd};
  \draw[thick] (3.1,0.55) rectangle (4.5,1.25);
  \node at (3.8,0.9) {$\Delta_{\text{match}}$};
  \draw (4.5,0.9) -- (6.05,0.9) -- (6.05,0.18) -- (6.57,0.18);
  \node[anchor=south] at (5.28,0.94) {$R_1\;[1]$};

  % c1 : capture control of L1, pass control of L0, inverted input of C0
  \draw (7.37,0) -- (7.9,0) -- (7.9,1.5) -- (6.95,1.5) -- (6.95,1.8);
  \node[anchor=south west] at (7.02,1.44) {C};
  \draw (7.9,0) -- (7.9,-1.15) -- (-1.35,-1.15);
  \fill (7.9,0) circle (0.055);
  \fill (0.5,-1.15) circle (0.055);
  \node[anchor=south] at (4.3,-1.11) {$c_1\;[1]$};
  \draw (0.5,-1.15) -- (0.5,-0.18) -- (0.79,-0.18);
  \draw[thick] (0.88,-0.18) circle (0.09);
  \draw (-1.35,-1.15) -- (-1.35,2.15) -- (0,2.15);
  \node[anchor=south] at (-0.60,2.19) {P};
\end{circuitikz}
\end{document}
```

*Own construction, after Sutherland's "Micropipelines". No wire crosses another. The `Pd` (pass-done) terminal of each latch is omitted for legibility; it is the exact mirror of `Cd` and acknowledges the return to transparency.*

**Topic:**

**Start from the control skeleton and name precisely what is missing.** A [[Muller Pipeline]] is a chain of [[Muller C-Element]]s, stage $i$ taking the request from stage $i-1$ and the *inverted* state of stage $i+1$:

$$c_i \;=\; \mathrm{C}\big(c_{i-1},\,\overline{c_{i+1}}\big),\qquad \mathrm{C}(a,b)\ \text{holds}\ Y = ab + (a+b)\,y$$

Expanding $ab + (a+b)y$ by **distributivity of AND over OR** gives $Y = ab + ay + by = \mathrm{maj}(a,b,y)$, the complete sum, which is why the element is free of the static-1 hazard that $ab + ay$ alone would carry. Every $c_i$ is 1 bit. That chain is a correct, delay-insensitive, self-initialising flow-control structure — and it moves nothing. It circulates *tokens*, not data. The micropipeline is the answer to one question: what storage element can a $k$-bit datapath use whose only control input is $c_i$?

**Two-phase deletes the idle level, and that single deletion is what forces a new storage element.** Under a [[Four-Phase Handshake]] the request returns to zero between data, so $c_i$ is high for the occupied half of every cycle and low for the empty half. "High means closed" is re-established once per datum, and an ordinary level-sensitive latch driven by $c_i$ is exactly right. A [[Two-Phase Handshake]] abolishes the return-to-zero: $c_i$ is high while datum $n$ sits in the stage and *low* while datum $n{+}1$ sits there. Drive a level-sensitive latch from that wire and it holds the odd data and stays transparent for the even ones — the circuit is not slightly wrong, it is wrong for half of all traffic. What two-phase requires is storage whose behaviour is a function of the *transition* on its control wire, in either direction, and not of the level. That is a double-edge-triggered element, and building one is the entire content and the entire cost of the micropipeline.

**The capture-pass latch has four terminals because it must announce its own completion.** Sutherland's element is normally *transparent*. A transition on `C` (either edge) freezes the data at the output; some time later a transition appears on `Cd`, meaning the capture has actually taken. A transition on `P` restores transparency; `Pd` reports when that has taken. All four are 1 bit; the data path through the element is $k$ bits. The `Cd`/`Pd` outputs are the part that is easy to skim past and impossible to do without: they turn the latch from a component you must characterise into a component that *tells you* when it is done, so the request handed to stage $i+1$ is $Cd_i$ and not $c_i$. The latch's own share of the bundling constraint is discharged locally by a wire instead of globally by a margin — which is the same trade as replacing a global clock with a per-stage handshake, applied one level further down.

**The wiring collapses because the acknowledge wire and the pass wire are the same wire.** Stage $i$ takes its request from the predecessor's capture-done and its back-pressure from the successor's state:

$$c_i \;=\; \mathrm{maj}\big(Cd_{i-1},\ \overline{c_{i+1}},\ c_i\big),\qquad C_i = c_i,\quad P_i = c_{i+1},\quad R_{i+1} = Cd_i$$

Read the middle group again. The wire $c_{i+1}$ that tells $C_i$ "your successor has emptied, you may move" is *the same event* as "$L_i$'s datum has been taken, you may go transparent". One wire, two jobs, no extra control logic — that identity is why the drawing above has nothing in it but C-elements, latches and a delay box. It is also why the whole structure inherits the Muller pipeline's delay-insensitivity in the control domain for free: no matched delay appears anywhere in the handshake itself.

**Processing logic puts the matched delay back, and that is the honest classification of the style.** With $f$ present between $L_i$ and $L_{i+1}$, the request $Cd_i$ must be held off until $f$ has settled, so a [[Matched Delay Line]] goes in the request path:

$$t_{\Delta} \;\ge\; t_{pd,\max}(f) + t_{\text{setup}}$$

This is the [[Bundled-Data Interface]] constraint verbatim — the same worst-case number a clock period would have carried, made local to one stage and paid only when that stage is used. A micropipeline is therefore *bundled data*, not delay-insensitive; the capture-pass latch bought back the latch's own share of the margin and nothing else. If you want the timing assumption gone entirely you must leave this structure and go to [[Dual-Rail Encoding]] with a [[Completion Detection Tree]], and pay $2k$ wires for it.

**The token algebra is unchanged, so the occupancy bound is unchanged.** Stage $i$ holds a datum exactly when its capture and pass events differ in parity:

$$\text{stage } i \text{ full} \iff c_i \ne c_{i+1}$$

All-equal is an empty pipeline (and is what reset must establish — there is no "all zero means empty" convention in two-phase, only "all equal"). Strictly alternating is a full pipeline, and a full pipeline is *stalled*, because $C_i$ requires $c_i = c_{i+1}$ to move. Keeping data in motion needs alternating full and empty stages, so $2N$ stages hold $N$ tokens at peak throughput, identically to the four-phase Muller pipeline. Two-phase changed the signalling and the storage; it did not change the bubble bound, and any claim that a micropipeline is "twice as fast" is confusing transitions per datum with data per stage.

> [!important] The micropipeline does not remove a cost, it relocates one
> Two-phase halves the transitions on the handshake pair, saving roughly half of $C_{\text{wire}}V^2$ per datum on the control wires. It pays for that with a storage element materially larger and slower than a level-sensitive latch, in *every* stage. The trade is therefore decided entirely by whether the interconnect or the logic dominates: it wins on long, chip-crossing or inter-router links ([[Network-On-Chip]]) where one handshake round trip costs more than a latch, and it loses inside a dense datapath where it is all latch and almost no wire. This is why the micropipeline is the canonical asynchronous *link* structure and almost never the asynchronous *datapath*.

**Neither target technology has the cell this circuit is made of.** On ASIC, the capture-pass latch is not in a standard cell library — it is a custom element, so adopting micropipelines means characterising and laying out a new sequential cell before you have a pipeline at all. On FPGA the situation is worse in three independent ways, all of which appear in the [[FPGAs]] section of the long-form note: the C-element is a combinational loop that static timing analysis cannot traverse and that the tools break by default; $\Delta_{\text{match}}$ is not synthesisable, since an inverter chain collapses to a wire and a `CARRY4` delay line is fully PVT-dependent; and there is no double-edge-triggered flop in the fabric — DDR primitives exist only in the I/O ring. What survives on FPGA is the synchronous elastic buffer with a valid/ready pair, which is the micropipeline's token algebra run off a clock, and the [[Asynchronous FIFO]], which is a [[Race-Free State Assignment]] plus a metastability filter and borrows nothing else from this note.

**Result.**

$$\boxed{\ c_i = \mathrm{maj}\big(Cd_{i-1},\,\overline{c_{i+1}},\,c_i\big);\quad (C_i,P_i)=(c_i,\,c_{i+1});\quad R_{i+1}=Cd_i;\quad \text{stage } i \text{ full}\iff c_i \ne c_{i+1}\ }$$

**When it breaks.**

- **The bundling constraint is still a promise, and there is no detector behind it.** If $\Delta_{\text{match}}$ under-estimates $t_{pd,\max}(f)$ at some corner, $L_{i+1}$ captures a partially-settled word. Unlike [[Dual-Rail Encoding]], nothing in the circuit notices; the handshake completes normally and the data are silently wrong.
- **Two-phase has no state to resynchronise to.** Four-phase returns to zero every datum, so a lost or spurious transition is corrected at the next idle level. Two-phase encodes the entire history in parity: one glitch counted as an event permanently inverts every subsequent stage's notion of full and empty, and no idle state exists in which to recover. This makes forks, joins and any noisy link materially riskier than the four-phase equivalent.
- **Reset must equalise, not clear.** "All $c_i$ equal" is the empty pipeline; there is no distinguished zero. Every C-element needs a real clear input, which is one more thing the drawing hides and the cell must provide.
- **50% occupancy at full throughput**, unchanged from [[Muller Pipeline]]. If the reason you reached for a pipeline was storage density, this is the wrong structure.
- **Wire-dominated only.** Below the crossover where a handshake round trip costs less than the extra latch, [[Four-Phase Handshake]] with an ordinary transparent latch is smaller, faster and easier to build. See [[Choosing an Asynchronous Style]].

> [!warning] No transistor counts, delays or energies are quoted
> This note has no assigned book source, and the comparisons above are all *orderings*, not measurements. "Materially larger", "roughly half the wire energy" and the crossover point are qualitative. Real numbers would need a characterised cell library and are not available here.

**RTL (Spade).**

The event-controlled latch is the part with no RTL form. Transcribing it directly fails, and the failure is the general one:

```spade
fn cap_pass(c: bool, p: bool, d: uint<8>) -> uint<8> {
    let q = if c { q } else { d };   // error: Use of undeclared name q
    if p { d } else { q }
}
```

```
error: Use of undeclared name q
  ┌─ cap_pass.spade:2:20
  │
2 │     let q = if c { q } else { d };
  │                    ^ Undeclared name
```

`decl` closes that loop and it compiles — but what compiles is a *level*-sensitive latch, not an event-sensitive one, and the difference is the whole circuit. Transition sensitivity would need `c` promoted to a clock; `unsafe { c.as_clock() }` will do it and emits `always @(posedge \c )`, a data-derived gated clock on one edge only, which is a circuit no synthesis or timing flow will accept and which still is not double-edged. The irreducible blocker is `Cd`/`Pd`: they are *delays*, and a delay is not a value, so no HDL of any kind can express them.

What Spade is native at here is the control chain, which is combinational feedback and nothing else:

```spade
/// Muller C-element with an active-high clear. The cover is the complete
/// sum -- all three prime implicants -- so it is static-1-hazard-free.
fn c_element(rst: bool, a: bool, b: bool, y: bool) -> bool {
    !rst && ((a && b) || (a && y) || (b && y))
}

/// Micropipeline control: three C-element stages, two-phase. Stage i may
/// move only when its predecessor has produced a new event and its
/// successor has emptied; c[i] != c[i+1] means stage i holds a token.
fn mp_ctrl3(rst: bool, r_in: bool, a_out: bool) -> (bool, bool, bool) {
    decl c0, c1, c2;
    let c0 = c_element(rst, r_in, !c1,    c0);
    let c1 = c_element(rst, c0,   !c2,    c1);
    let c2 = c_element(rst, c1,   !a_out, c2);
    (c0, c1, c2)
}
```

`r_in`/`a_out` are the two handshake wires at the ends of the drawing and `c0..c2` are the three C-element outputs; every signal is 1 bit and there is no `clock` in the signature, because the state lives in the topology. This lowers to three genuinely cross-coupled continuous assignments, and it simulates: 12 named vectors — including an asymmetric burst of four requests against zero acknowledges — plus 3000 randomised single-input-change steps under a protocol-legal environment, 3012 checks, all passing against a behavioural relaxation of the same three equations. Without `rst` the emitted loop never leaves `x`, which is the correct physical answer and the reason a real C-element cell carries a clear.

The instructive part is what happens when the latches are added as combinational loops too, with the hold condition read straight off the token algebra:

```spade
let q0: uint<8> = if c0 != c1    { q0 } else { d  };
let q1: uint<8> = if c1 != a_out { q1 } else { q0 };
```

That compiles, and it fails simulation in the most informative way available: over 1109 transactions the token count is *exactly* conserved — nothing is lost or duplicated, the C-element control is perfect — while **853 of the 1109 delivered words are the wrong word**. With no `Cd`, stage 0 re-opens in the same delta as stage 1 captures, so $L_1$ latches whatever $L_0$ has already moved on to. That is a measurement of precisely what `Cd` is for, and it is why the frontmatter says `not-expressible` rather than `verified`: everything about this circuit that RTL can hold is correct, and the circuit still does not work.

**Related Notes (with context):**

- [[Muller Pipeline]] – extends: supplies the entire control chain and the $c_i \ne c_{i+1}$ token algebra; the micropipeline adds only the storage.
- [[Two-Phase Handshake]] – depends-on: the return-to-zero it deletes is exactly what forces the capture-pass latch to exist.
- [[Four-Phase Handshake]] – compares: keeps the idle level, so a plain transparent latch suffices; wins whenever logic rather than wire dominates.
- [[Muller C-Element]] – depends-on: the $\mathrm{maj}(a,b,y)$ complete-sum cover named at every rewriting step above.
- [[Matched Delay Line]] – depends-on: the $\Delta_{\text{match}}$ box; without it the request outruns $f$ and the latch captures unsettled data.
- [[Bundled-Data Interface]] – supports: classifies this circuit — a micropipeline is bundled data, not delay-insensitive.
- [[Dual-Rail Encoding]] – counter-example: removes the timing assumption entirely instead of localising it, at $2k$ wires and data-independent switching.
- [[Completion Detection Tree]] – compares: announces completion from the data, where `Cd` announces it from the storage element.
- [[Dual-Phase Latches]] – compares: the synchronous answer to the same question, where two non-overlapping clock phases replace the two event wires `C` and `P`.
- [[Asynchronous FIFO]] – compares: the one token-flow structure from this topic that FPGAs actually run, and it uses none of this machinery.
- [[Choosing an Asynchronous Style]] – compares: where the wire-versus-logic crossover puts this against every sibling.
- [[Asynchronous Sequential Logic]] – depends-on: fundamental mode, which the handshake exists to enforce on the environment.

## References

- `0.5) Asynchronous Sequential Logic`, §*Handshaking protocols* — bundled data, the matched-delay inequality, four-phase versus two-phase, and the Muller pipeline chain; §*Delay-insensitive and QDI* for the C-element's complete-sum cover; §*FPGA mapping* for the combinational-loop, delay-element and consensus-term problems.
- I. E. Sutherland, "Micropipelines", Turing Award lecture, *Communications of the ACM* 32(6) — transition signalling, the capture-pass storage element and its `C`/`Cd`/`P`/`Pd` terminals, and the event-logic primitives.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design*, ch. 3 — micropipelines as a Muller pipeline plus event-controlled latches, occupancy, and the two-phase/four-phase comparison.
- N. Weste & D. Harris, *CMOS VLSI Design*, ch. 10 — C-element circuit forms and the transistor-level cost of double-edge-triggered storage.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter- or article-level. No copy was consulted for this note, so no page numbers are given; the material is standard and the chapter numbering is stable across editions, but the pages are not.
