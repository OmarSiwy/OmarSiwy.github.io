---
title: "Race-Free State Assignment"
description: "Codes the flow table so every required transition is a Hamming-1 edge of the s-cube, killing critical races at the cost of extra state variables — a graph-embedding problem, not a counting one."
kind: circuit
source: "No book source — 0.5) Asynchronous Sequential Logic; Mano & Ciletti ch. 9; Unger"
status: seed
spade: not-expressible
tags: [digital, asynchronous-sequential-logic, state-assignment, race, hamming, gray-code]
aliases:
  - Race-Free Assignment
  - Critical Race
  - Critical Races
  - Unit-Distance State Assignment
  - Single-Transition-Time Assignment
  - STT Assignment
---

# Race-Free State Assignment

A state assignment for an asynchronous flow table is race-free exactly when every transition the table demands joins two codes at Hamming distance 1, which makes the choice of codes a graph-embedding problem in the $s$-cube rather than the free relabelling it is in a clocked machine.

```tikz title="The same four-state flow table under two assignments: binary count leaves two required transitions as chords of the 2-cube, Gray places all four on cube edges"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex]
  % ===== left panel: binary-count assignment =====
  \draw[gray!55] (0,0) -- (2.6,0) -- (2.6,2.6) -- (0,2.6) -- cycle;
  \draw[very thick] (0,0) -- (2.6,0);
  \draw[very thick] (0,2.6) -- (2.6,2.6);
  \draw[very thick, dashed, red!75!black] (2.6,0) -- (0,2.6);
  \draw[very thick, dashed, red!75!black] (0,0) -- (2.6,2.6);
  \node[circ] at (0,0) {};   \node[circ] at (2.6,0) {};
  \node[circ] at (2.6,2.6) {}; \node[circ] at (0,2.6) {};
  \node[anchor=north east] at (0,-0.05)   {$A{=}00$};
  \node[anchor=north west] at (2.6,-0.05) {$B{=}01$};
  \node[anchor=south west] at (2.6,2.65)  {$D{=}11$};
  \node[anchor=south east] at (0,2.65)    {$C{=}10$};
  \node[anchor=west] at (0.12,1.3) {\scriptsize $d_H{=}2$};
  \node[anchor=east] at (2.48,1.3) {\scriptsize $d_H{=}2$};
  \node[anchor=north] at (1.3,-0.75) {binary count: 2 chords};
  \node[anchor=north] at (1.3,-1.25) {\small $B\!\to\!C$ via $00\;{=}\;A$, stable $\Rightarrow$ critical race};

  % ===== right panel: race-free (Gray) assignment =====
  \begin{scope}[xshift=6.6cm]
    \draw[gray!55] (0,0) -- (2.6,0) -- (2.6,2.6) -- (0,2.6) -- cycle;
    \draw[very thick] (0,0) -- (2.6,0) -- (2.6,2.6) -- (0,2.6) -- cycle;
    \node[circ] at (0,0) {};   \node[circ] at (2.6,0) {};
    \node[circ] at (2.6,2.6) {}; \node[circ] at (0,2.6) {};
    \node[anchor=north east] at (0,-0.05)   {$A{=}00$};
    \node[anchor=north west] at (2.6,-0.05) {$B{=}01$};
    \node[anchor=south west] at (2.6,2.65)  {$C{=}11$};
    \node[anchor=south east] at (0,2.65)    {$D{=}10$};
    \node[anchor=south] at (1.3,0.08) {\small $y_2$};
    \node[anchor=south] at (1.3,2.68) {\small $y_2$};
    \node[anchor=west]  at (2.68,1.3) {\small $y_1$};
    \node[anchor=east]  at (-0.08,1.3) {\small $y_1$};
    \node[anchor=north] at (1.3,-0.75) {Gray: every edge $d_H{=}1$};
    \node[anchor=north] at (1.3,-1.25) {\small transition graph $=$ $Q_2$ itself};
  \end{scope}

  \node[anchor=south] at (4.6,3.35) {state code $y_1y_2$, 2 bits $\;\Rightarrow\;$ vertices of the 2-cube $Q_2$};
\end{circuitikz}
\end{document}
```

**Turn "no race" into a distance condition.** In the [[Huffman Feedback Model]] the machine holds its state in $s$ secondary variables $y_1\ldots y_s$ ($s$ bits), each fed back through its own delay $\Delta_i$, with excitation $Y_i = f_i(x, y)$. From a stable point $(x,y)$ let the input change to $x'$ and collect the variables the new excitation disagrees with:

$$D=\{\,i \;:\; y_i \ne f_i(x',y)\,\}$$

If $\lvert D\rvert = 1$ the machine has one wire to move and one place to land. If $\lvert D\rvert \ge 2$ the members of $D$ change in an order set by the physical $\Delta_i$, and the code passes through intermediate values that were never rows of the flow table. That is a **race**. It is **non-critical** if every order converges on the same final stable state, and **critical** if two orders end in different stable states — at which point the circuit's function is decided by manufacturing spread and temperature, and no timing margin repairs it because there is no timing constraint to tighten. The cure is therefore structural: forbid $\lvert D\rvert \ge 2$ outright by demanding, for every transition $S_i \to S_j$ the table requires,

$$d_H\big(\text{code}(S_i),\,\text{code}(S_j)\big)=1$$

**Read the criterion as a graph embedding, not as a counting exercise.** Collect the required transitions into a **transition graph** $T$ on the $k$ states. The condition above says every edge of $T$ must be an edge of the hypercube $Q_s$ after the states are placed on its vertices — that is, $T$ must embed as a subgraph of $Q_s$. This is strictly stronger than the synchronous requirement $2^s \ge k$, which only asks for enough vertices. $Q_s$ supplies $2^s$ vertices but only $s\,2^{s-1}$ edges, so a state with more than $s$ distinct successors cannot be placed at all; and $Q_s$ is bipartite (colour a vertex by the parity of its weight, and every edge flips parity), so **any odd cycle in $T$ is unembeddable in $Q_s$ for every $s$**, not merely for the smallest one. Free relabelling in a clocked machine is free precisely because a register makes the intermediate code unobservable; here there is no register, so the intermediate code is the circuit's actual state for one $\Delta$.

**Watch the failure on a concrete table.** Four states, two inputs $x_1x_2$ (2 bits), one output $z$ (1 bit); stable entries in **bold**.

| present | $00$ | $01$ | $11$ | $10$ | $z$ |
| --- | --- | --- | --- | --- | --- |
| $A$ | **A** | $B$ | $D$ | **A** | 0 |
| $B$ | $A$ | **B** | **B** | $C$ | 0 |
| $C$ | $B$ | $D$ | **C** | **C** | 1 |
| $D$ | $A$ | **D** | **D** | $C$ | 1 |

The transitions demanded are $A\!\leftrightarrow\!B$, $B\!\to\!C$, $C\!\to\!D$, $C\!\to\!B$, $D\!\to\!C$, $D\!\to\!A$ — so $T$ is the 4-cycle $A\!-\!B\!-\!C\!-\!D\!-\!A$, an even cycle, hence embeddable in $Q_2$ in principle. The obvious binary count $A{=}00$, $B{=}01$, $C{=}10$, $D{=}11$ nevertheless fails, because it maps the 4-cycle onto the square's two *diagonals* as well as two of its sides: $B\!-\!C$ ($01\to10$) and $D\!-\!A$ ($11\to00$) both have $d_H=2$.

**Trace $B \to C$.** Start stable in $B$ in column $x_1x_2=11$, so $y_1y_2=01$. Let $x_2$ fall — one input variable, so fundamental mode is respected — putting the machine in column $10$, where the table says $B\to C$. The excitation is $Y_1Y_2 = \text{code}(C) = 10$ against the present $y_1y_2 = 01$, so $D=\{1,2\}$ and both variables are unstable at once:

| order | intermediate code | row entered | column $10$ entry | outcome |
| --- | --- | --- | --- | --- |
| $y_1$ first | $11$ | $D$ | $C=10$ | $y_2$ falls → $10=C$ ✓ |
| $y_2$ first | $00$ | $A$ | **$A$ (stable)** | machine stops at $A$ ✗ |
| simultaneous | $10$ | $C$ | — | $C$ ✓ |

If $\Delta_2 < \Delta_1$ the circuit lands in $A$, and $A$ is **stable in column 10** — it does not recover when the delays settle, and it emits $z=0$ where the specification demands $z=1$. Two orders, two final states: a critical race, and a functional bug rather than a timing violation.

**Not every chord is fatal — which is why the criterion is sufficient, not necessary.** Take $D \to A$ in column $00$, also $d_H=2$, from $11$ to $00$:

- $y_2$ first $\to 10 = C$; row $C$, column $00$ $\to B = 01$; row $B$, column $00$ $\to A = 00$. Settles at $A$.
- $y_1$ first $\to 01 = B$; row $B$, column $00$ $\to A = 00$. Settles at $A$.

Both orders converge, so this one is a **non-critical** race, and the first path is a three-step [[Asynchronous Cycle]] $D\to C\to B\to A$ entirely inside column $00$. It is functionally correct and still undesirable: it costs three gate delays instead of one and glitches $z$ from 1 to 0 through an intermediate that the specification never mentions. $d_H = 1$ is the condition that makes the question moot rather than the condition that a working circuit strictly needs.

**The repair is to lay the assignment along the cycle.** Walk the 4-cycle of $T$ around the 4-cycle of $Q_2$ — which is exactly what a 2-bit [[Gray Code]] enumerates:

$$A=00,\quad B=01,\quad C=11,\quad D=10$$

| transition | codes | $d_H$ |
| --- | --- | --- |
| $A\to B$ | $00\to01$ | 1 |
| $B\to C$ | $01\to11$ | 1 |
| $C\to D$ | $11\to10$ | 1 |
| $D\to A$ | $10\to00$ | 1 |
| $C\to B$ | $11\to01$ | 1 |
| $D\to C$ | $10\to11$ | 1 |

Re-trace $B\to C$: stable in $B$ with $y_1y_2=01$, column $11$; $x_2$ falls to column $10$; the excitation is now $Y_1Y_2 = \text{code}(C) = 11$, so only $y_1$ is unstable and $\lvert D\rvert = 1$. There is no race to analyse — $y_1$ rises after $\Delta_1$, the code becomes $11 = C$, and $C$ is stable in column $10$, for any $\Delta_1,\Delta_2 > 0$. Re-trace $D\to A$: $10 \to 00$ moves $y_1$ alone, so the three-step cycle and its glitch on $z$ are gone with it. Note what was *not* spent: still $s=2$, still four codes, no extra logic. When an embedding exists it is free; the cost appears only when it does not.

**When $T$ does not embed, buy the embedding.** Three standard escapes, in increasing order of what they cost:

1. **Route through unused codes.** Turn a $d_H=2$ transition into a deliberate chain of unit-distance steps — an [[Asynchronous Cycle]] — using codes no state occupies. Costs transition time, not area, and needs spare vertices.
2. **Duplicate a row.** Give one logical state two codes, each adjacent to a different neighbour. This is the standard answer to an odd cycle, because splitting a vertex breaks the parity obstruction that no amount of extra $s$ can.
3. **Add state variables.** More dimensions bring more edges. Universal schemes — Huffman's multiple-row, Liu's shared-row, Tracey's single-transition-time assignment — guarantee race freedom on *any* table by construction, at an $s$ well above $\lceil \log_2 k\rceil$.

> [!warning] Not covered in the source — needs outside research
> The exact $s$ that Tracey's and Liu's universal constructions require as a function of $k$ is a result this note does not derive and should not be quoted from memory. Take "substantially more than $\lceil \log_2 k\rceil$" as the working statement until the bound is checked against Tracey (1966) or Unger.

**Race freedom is not hazard freedom.** The assignment fixes *which codes* the machine visits; the excitation cover fixes *whether it gets there cleanly*. Mapping the table under the Gray assignment gives the 1-bit excitation

$$Y_1 \;=\; y_1x_1 \;+\; y_1x_2 \;+\; \overline{y_2}\,x_1x_2 \;+\; y_2\,x_1\overline{x_2}$$

Every pair of adjacent 1-cells here happens to sit inside a common product term, so no single-variable transition passes through a moment where all four terms are 0 and this cover is static-1-hazard-free — but that is luck, not method. The general obligation is a [[Hazard-Free Cover]]: add consensus terms, by the consensus theorem of [[Combinational Logic]], until every $1\!-\!1$ adjacency is covered by one implicant. And a glitch on $Y_i$ in a feedback machine is not cosmetic — it is fed straight back into $y_i$ and latched by the loop, so a static hazard here manufactures exactly the wrong-state outcome that the race analysis just eliminated.

**On an FPGA the theorem still holds and the implementation does not.** The $d_H=1$ argument is delay-independent, so it survives any technology. What does not survive is the feedback loop itself: a LUT-plus-routing loop has a $\Delta$ set by the placer, re-derived on every recompile, and the tools refuse combinational loops by default — the constraint that unblocks them turns off the timing analysis you would need to trust the result. So on FPGA the unit-distance idea ships almost exclusively in its clocked form, where the register supplies the delay and the encoding buys safety across a clock boundary instead of within one machine. On ASIC the loop is buildable, but only with the feedback delay explicitly instantiated and characterised.

> [!note] Gray-coded FIFO pointers are this exact theorem
> The one place every RTL engineer meets race-free assignment is the clock-domain-crossing [[Asynchronous FIFO]]. The read and write pointers are Gray coded so that a pointer sampled *while it is changing* differs from a valid value in at most one bit — the receiver either sees the old count or the new one, never a code that was never written. That is $d_H = 1$ doing in a synchroniser exactly what it does in a flow table: making the intermediate value harmless because there is no intermediate value.

$$\boxed{\ \text{assignment race-free}\iff \forall\,(S_i\!\to\!S_j)\in T:\ d_H\big(\mathrm{code}(S_i),\mathrm{code}(S_j)\big)=1 \iff T\hookrightarrow Q_s\ }$$

**When it breaks**

- **Odd cycles never embed.** $Q_s$ is bipartite for every $s$, so a transition graph with an odd cycle is unembeddable at any width. Adding state variables cannot help; only row duplication or routing through unused codes can.
- **Degree exceeds $s$.** A state with more than $s$ required successors has more neighbours than a cube vertex has edges. The counting test $2^s \ge k$ passes and the assignment is still impossible.
- **Fundamental mode is the hidden premise.** The whole analysis assumes one input variable changes at a time and the machine settles before the next change. Two simultaneous input changes make the flow table itself meaningless, and $d_H=1$ protects nothing.
- **Essential hazards are untouched.** They are a property of the table's transition sequence, present in every implementation of it, and curable only by delay in the feedback path. A perfectly race-free assignment still has them.
- **Outputs still glitch on cycles.** Escape route 1 restores race freedom but sends $z$ through intermediate states, so the output assignment must be chosen to hold $z$ constant along each cycle or the glitch is real.
- **A cycle with no stable state oscillates.** Route a transition through unused codes carelessly and the column's unstable-entry graph contains a loop; the circuit becomes a ring oscillator for as long as that input holds.

**RTL (Spade): the machine itself is not expressible.** It is a fundamental-mode feedback machine, and Spade has no delay primitive and no latch, so the natural transcription is rejected outright:

```spade
entity huffman_loop(x1: bool, x2: bool) -> bool {
    let y1 = y1_next(x1, x2, y1, y2);
    let y2 = y1_next(x2, x1, y2, y1);
    y1
}
```

```
error: Use of undeclared name y1
6 │     let y1 = y1_next(x1, x2, y1, y2);
  │                              ^^ Undeclared name
```

> [!warning] `decl` makes this compile, and that is the trap
> Forward-declaring the loop (`decl y1, y2;`) type-checks and lowers to Verilog — and the emitted netlist is `\y1_next \y1_next_0 (..., .y1_i(\y1 ), .output__(\y1 ));`, a genuine zero-delay combinational loop. It compiles because Spade never checks for combinational cycles, not because the machine has been captured. The parameters the entire race analysis is about, $\Delta_1$ and $\Delta_2$, do not exist in that netlist: a simulator resolves it to whatever its own event scheduler settles on, and synthesis reports it as an unconstrained loop. Compiling is not modelling here.

The nearest structure Spade is native at is the same unit-distance encoding with a clock supplying the delay — the flow table's next-state map wrapped in a state register, which is what the FIFO-pointer form of this idea actually is:

```spade
/// Flow-table next state under the race-free assignment
/// A = 0b00, B = 0b01, C = 0b11, D = 0b10; input column x = x1x2.
fn next_code(y: uint<2>, x: uint<2>) -> uint<2> {
    match (y, x) {
        (0b00, 0b01) => 0b01,   // A -> B
        (0b00, 0b11) => 0b10,   // A -> D
        (0b00, _)    => 0b00,   // A stable in columns 00, 10
        (0b01, 0b00) => 0b00,   // B -> A
        (0b01, 0b10) => 0b11,   // B -> C
        (0b01, _)    => 0b01,   // B stable in columns 01, 11
        (0b11, 0b00) => 0b01,   // C -> B
        (0b11, 0b01) => 0b10,   // C -> D
        (0b11, _)    => 0b11,   // C stable in columns 11, 10
        (0b10, 0b00) => 0b00,   // D -> A
        (0b10, 0b10) => 0b11,   // D -> C
        _            => 0b10,   // D stable in columns 01, 11
    }
}

entity gray_fsm(clk: clock, rst: bool, x: uint<2>) -> uint<2> {
    reg(clk) y reset(rst: 0b00) = next_code(y, x);
    y
}
```

`y` is the 2-bit code on the right-hand square of the diagram and `x` is the flow table's column index, also 2 bits; `next_code` is the combinational excitation $Y_1Y_2$ and the `reg` is the feedback path with its $\Delta$ replaced by a clock edge. What this captures is the encoding — simulation checks all 16 flow-table cells and 3006 clocked transitions, and every one moves the code by Hamming distance at most 1, which is the note's claim made executable. What it does not capture is the thing that makes the async version hard: with a register in the loop, $\lvert D\rvert \ge 2$ is harmless, all $s$ bits change on the same edge, and a wrong assignment costs nothing. The theorem only has teeth when the delay is a wire.

## References

No assigned book source; written from standard digital-design canon and from `0.5) Asynchronous Sequential Logic`, §§ *Races and critical races*, *Cycles*, *Worked example: a critical race and its repair*.

- S. H. Unger, *Asynchronous Sequential Switching Circuits* — race classification, unit-distance assignment, universal schemes.
- M. M. Mano & M. D. Ciletti, *Digital Design* — flow tables, races and critical races, race-free assignment by example.
- J. F. Wakerly, *Digital Design: Principles and Practices* — feedback sequential circuits, cycles, state-assignment practice.
- N. Weste & D. Harris, *CMOS VLSI Design* — Gray-coded pointers and clock-domain crossing.

**Related Notes (with context):**

- [[Huffman Feedback Model]] – depends-on: supplies the $s$ secondary variables, the delays $\Delta_i$ and the excitation $Y_i$ that make "two variables change at once" a physical event at all.
- [[Asynchronous Cycle]] – extends: the escape route when the transition graph does not embed, trading transition time for the state variables this note would otherwise have to add.
- [[Gray Code]] – supports: the ready-made unit-distance enumeration, which is the embedding of a Hamiltonian cycle into $Q_s$ written as a code.
- [[State Encoding]] – compares: in a clocked machine any bijection is legal and the encoding is chosen for logic depth or power, because the register hides every intermediate code this note is fighting.
- [[Asynchronous FIFO]] – supports: where the theorem actually ships, with the synchroniser rather than a flow table as the consumer of $d_H = 1$.
- [[Hazard-Free Cover]] – depends-on: race freedom is only half the obligation; a static hazard on $Y_i$ is fed back into $y_i$ and produces the same wrong stable state the assignment just ruled out.
- [[Asynchronous Sequential Logic]] – compares: the hub, for where state assignment sits against essential hazards, handshaking and the delay-insensitive styles that avoid flow tables entirely.
