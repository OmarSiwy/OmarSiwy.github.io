---
title: Asynchronous Cycle
description: "Chains several unstable states inside one input column so a distance-2 move happens one bit at a time — buys race freedom with transition time, and oscillates forever if the chain has no stable end."
kind: circuit
status: seed
spade: not-expressible
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Cycle
  - Cycles
  - Asynchronous Cycles
  - Cycle (Flow Table)
---

# Asynchronous Cycle

A deliberately chained sequence of unstable states inside one input column, so that a multi-bit state change is executed one bit at a time — the only race-freedom technique that spends time instead of state variables.

```tikz title="A cycle routing a distance-2 transition through a spare code, and the same construction with no stable state"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]

% ---------------- panel A: a terminating cycle ----------------
\begin{scope}
  \node[circle,draw,minimum size=7mm] (a00) at (0,0)   {$00$};
  \node[circle,draw,minimum size=7mm] (a01) at (0,2.4) {$01$};
  \node[circle,draw,minimum size=7mm] (a11) at (2.4,2.4){$11$};
  \node[circle,draw,minimum size=7mm] (a10) at (2.4,0) {$10$};
  \node[circle,draw,minimum size=9mm] at (2.4,2.4) {};

  \draw[dashed,gray] (a01) -- (a11);
  \draw[dashed,gray] (a00) -- (a10);
  \draw[dashed,gray] (a10) -- (a11);
  \draw[dashed,gray] (a00) -- (a01);

  \draw[very thick,->] (a00) -- (a01);
  \draw[very thick,->] (a01) -- (a11);

  \draw[dotted,thick] (a00) -- (a11);
  \node[fill=white,inner sep=1pt] at (1.15,1.15) {$\times$};
  \node[anchor=west,font=\footnotesize] at (0.95,0.62) {$d_H\!=\!2$};

  \node[anchor=west] at (-0.9,-0.75) {$S_a$};
  \node[anchor=west] at (-1.0,3.15)  {$u$: spare code};
  \node[anchor=west] at (1.55,3.15)  {$S_c$ stable};
  \node[anchor=west] at (1.9,-0.75)  {spare};
  \node[anchor=west] at (-1.0,-1.35) {\textbf{cycle} $S_a\!\to\!u\!\to\!S_c$, column $x$};
  \node[anchor=west] at (-1.0,-1.85) {$2\Delta$, one bit per step};
\end{scope}

% ---------------- panel B: a cycle with no stable end ----------
\begin{scope}[xshift=6.6cm]
  \node[circle,draw,minimum size=7mm] (b00) at (0,0)   {$00$};
  \node[circle,draw,minimum size=7mm] (b01) at (0,2.4) {$01$};
  \node[circle,draw,minimum size=7mm] (b11) at (2.4,2.4){$11$};
  \node[circle,draw,minimum size=7mm] (b10) at (2.4,0) {$10$};

  \draw[very thick,->] (b00) -- (b01);
  \draw[very thick,->] (b01) -- (b11);
  \draw[very thick,->] (b11) -- (b10);
  \draw[very thick,->] (b10) -- (b00);

  \node[anchor=west] at (-1.0,-1.35) {\textbf{no fixed point}: oscillates};
  \node[anchor=west] at (-1.0,-1.85) {period $4\Delta$ while $x$ holds};
\end{scope}

\node[anchor=west] at (-1.0,3.9) {$y_1y_2$: 2-bit secondary state, one input column $x$ held fixed};

\end{circuitikz}
\end{document}
```

**Freeze the input and the excitation collapses to a self-map.** In the [[Huffman Feedback Model]] the combinational network computes $Y = f(x,y)$ with $x$ an $n$-bit input word, $y$ the $s$-bit secondary state fed back through $s$ delay elements, and $z = g(x,y)$ the $m$-bit output. Fundamental mode guarantees $x$ is constant for the whole duration of a state change, so within one column the excitation is a function of $y$ alone,

$$f_x : \{0,1\}^s \to \{0,1\}^s, \qquad f_x(y) = f(x,y)$$

and the definition of stability — "the next state equals the row you are in" — is exactly the statement that $y$ is a **fixed point** of $f_x$. Everything below is a statement about the orbits of one self-map on the $s$-cube.

**A cycle is a designed orbit, not an accident.** A cycle is a chain $S_a \to u_1 \to \cdots \to u_{k-1} \to S_c$ of length $k$ with $f_x(u_j) = u_{j+1}$, every intermediate $u_j$ unstable, and $f_x(S_c) = S_c$. What makes it useful is the extra demand that consecutive codes be Hamming-adjacent, $d_H(u_j, u_{j+1}) = 1$. [[Race-Free State Assignment]] shows a transition is race-free iff its endpoints differ in one bit; a cycle takes an edge the assignment cannot make unit-distance and **subdivides** it, walking a path in $Q_s$ rather than a chord. At every step the unstable set

$$D = \{\, i : y_i \ne f_{x,i}(y) \,\}$$

has $\lvert D\rvert = 1$, so by the definition of a race there is no race to analyse. Correctness holds for arbitrary positive $\Delta_1,\dots,\Delta_s$ — not because the delays are matched, but because only one of them is ever in play.

**The currency is time, and it is spent locally.** The transition costs $k$ feedback delays instead of one; a single-transition-time assignment would cost an extra secondary variable, which doubles the rows of the excitation table, adds an $(s{+}1)$-th feedback wire and delay element, and widens *every* product term. The asymmetry is the point: adding a variable is a global cost paid on all transitions, a cycle is a local cost paid on the one transition that would not embed. Route through $j$ spare codes and only that transition slows to $(j{+}1)\Delta$.

**The spare code stops being a don't-care.** Once $u$ carries a transition it is a real row of the excitation table, and its entries in the *other* $2^n - 1$ columns are still unspecified but no longer harmless. Fundamental mode promises the input will not change during a state change, but the cycle stretches that promise from $\Delta$ to $k\Delta$ — the minimum input-separation spec of the finished block is set by its longest cycle, not by its gate delay. Fill $u$'s remaining columns with whatever $S_c$'s row holds, so that a violated promise lands the machine in a defined state instead of a code the flow table never named.

**Outputs are evaluated at every intermediate code.** $z = g(x,y)$ is combinational, so passing through $u$ emits $g(x,u)$ for one gate delay. If $g(x,S_a) = g(x,S_c)$ the entry at $u$ is a genuine don't-care in the table and a mandatory design decision in the circuit: set it equal to the endpoints and $z$ is flat across the cycle; leave it to the minimiser and you get a spike the specification never mentions. If the endpoints do differ, the free entry decides *when* the output changes — at the first step or at the last.

**Termination is the entire correctness condition.** $f_x$ has out-degree exactly one at every node, so the directed graph on $\{0,1\}^s$ is a functional graph: every orbit is a tail leading into a closed loop. The loops of length 1 are the stable states. Delete them — that is, keep only the edges $y \to f_x(y)$ with $f_x(y) \ne y$ — and what remains must be a forest of paths. Any surviving directed cycle is a set of codes with no stable state anywhere in it, and the circuit walks it for as long as $x$ holds, at a period of $k$ feedback delays. That is not a subtle hazard: it is a ring oscillator built by accident, and neither the static-hazard cover check nor Unger's essential-hazard test will report it. Occasionally it is the goal — a clock-less pulse generator is exactly this construction with the stable state deliberately removed.

**FPGA and ASIC mapping punish it in the same place.** A cycle costs no extra logic on either target: the same $Y = f(x,y)$ truth table simply has different entries at the spare codes, so on an FPGA it is the same LUT count and on a standard-cell flow the same cell count. What it costs is toolflow. The feedback path is a combinational loop, which synthesis cuts or errors on by default, so the loop nets need `KEEP`/`DONT_TOUCH` and the timing engine needs an explicit loop exception; and the per-step delay $\Delta$ is routing-dominated and unknown until place-and-route, which means the fundamental-mode window you just widened by $k$ is not a number you control. This is why hand-built cycles belong to full-custom and gate-array work, and why what actually ships is [[Muller C-Element]] pipelines — also combinational feedback, but inside a characterised cell with a vendor-signed hold specification.

$$\boxed{\ \Gamma_x \;=\; \{\, y \to f_x(y) \;:\; f_x(y) \ne y \,\} \ \text{ acyclic } \iff \text{ column } x \text{ always settles}\ }$$

> [!warning] The worked example in [[0.5) Asynchronous Sequential Logic]] calls a race path a cycle
> In the bad-assignment trace ($A{=}00$, $B{=}01$, $C{=}10$, $D{=}11$), the path $D \to C \to B \to A$ in column $00$ is described as a "three-step cycle". Its middle step is $C = 10 \to B = 01$, with $d_H = 2$ — so by the unit-distance requirement above it is not a cycle at all, it is one race feeding another. A designed cycle never contains a distance-2 step; that is the whole reason to build one.

## When it breaks

- **No adjacent spare exists.** $Q_s$ always contains a path between any two codes, but every interior code of that path must be free *in this column*. If the flow table is dense enough that all $2^s$ codes are assigned, there is no cycle to build and you are back to adding a state variable.
- **Length kills the reason you dropped the clock.** Async buys average-case latency; a 3- or 4-step cycle on a common transition hands that saving straight back, and does it while widening the input-separation spec by the same factor.
- **Essential hazards are untouched.** A cycle is a statement about one column; Unger's three-change test is a statement across columns. A table can be perfectly cycled and still require a deliberate feedback delay element.
- **The cover is a separate obligation.** Unit-distance steps kill races, not static hazards — each step still needs a common product term spanning the two adjacent 1-cells, per [[Combinational Logic]].
- **The oscillating variant is invisible to every other check.** Only the acyclicity test on $\Gamma_x$ finds it, and it must be run per column.

## RTL (Spade)

The circuit is **not expressible**. A cycle *is* a combinational feedback loop — the state is a wire that feeds the network that drives it — and Spade has no latch primitive and no self-referencing `let`:

```spade
entity cycle_loop() -> uint<2> {
    let y = excite(y);   // error: Use of undeclared name y
    y
}
```

Passing `y` in as an argument would compile, but it would be a mux, not a loop. The nearest structure Spade is native at closes the same excitation map through a register, which turns each gate delay into a clock cycle:

```spade
/// One input column of an excitation table, as a pure combinational map on the
/// 2-bit secondary state. Fixed points of this map are the stable states.
fn cycle_col(y: uint<2>) -> uint<2> {
    match y {
        0b00 => 0b01,   // unstable: first bit of the distance-2 move
        0b01 => 0b11,   // unstable: second bit
        0b11 => 0b11,   // STABLE - the cycle terminates here
        _    => 0b11,   // spare code 10
    }
}

/// Same shape, no fixed point: this column is a ring oscillator.
fn osc_col(y: uint<2>) -> uint<2> {
    match y {
        0b00 => 0b01,
        0b01 => 0b11,
        0b11 => 0b10,
        _    => 0b00,
    }
}

/// The feedback path Spade *can* close: through a register, not through a wire.
entity cycle_walk(clk: clock, load: bool, y0: uint<2>, bad: bool) -> uint<2> {
    reg(clk) y reset(load: y0) = if bad { osc_col(y) } else { cycle_col(y) };
    y
}
```

`y` is the 2-bit secondary state of the diagram, `cycle_col` is the excitation network of the left panel and `osc_col` the right one, and `load`/`y0` inject a starting code so any node of $Q_2$ can be used as an entry point. What the register captures is the *sequence* of codes — `cycle_col` reaches its fixed point in two steps from $00$ and stays there, `osc_col` has none and counts $00,01,11,10$ forever — and what it does not capture is the mechanism, because the clock supplies exactly the arbitration that the real circuit has to earn from $d_H = 1$. Synthesis will build this as a 2-bit register plus one LUT; the real cycle has no register at all, and its step time is a routing delay rather than a clock period.

## Related Notes

- [[Race-Free State Assignment]] – compares: buys the same race freedom with extra state variables instead of extra time; the cycle is the escape route when the transition graph will not embed in $Q_s$ at the current $s$.
- [[Huffman Feedback Model]] – depends-on: the cycle is an orbit of that loop's excitation map, and one step costs one trip round the loop.
- [[Muller C-Element]] – counter-example: also combinational feedback, but a characterised cell with a signed hold spec, so it survives a synthesis flow where a hand-built cycle does not.
- [[Matched Delay Line]] – compares: makes "wait long enough" an explicit, tunable delay element; a cycle makes it a structural property of the state codes instead.
- [[Asynchronous Sequential Logic]] – depends-on: fundamental mode is what lets the input be treated as frozen for the whole cycle.

## References

No assigned book source; written from standard digital-design canon.

- S. H. Unger, *Asynchronous Sequential Switching Circuits* — cycles, unit-distance transition paths, the fundamental-mode window.
- M. M. Mano & M. D. Ciletti, *Digital Design* — transition tables, cycles and unstable-state chains, race classification.
- J. F. Wakerly, *Digital Design: Principles and Practices* — feedback sequential circuits, cycles as chained unstable states.
- Long-form source: [[0.5) Asynchronous Sequential Logic]], §Cycles and §Races and critical races.
