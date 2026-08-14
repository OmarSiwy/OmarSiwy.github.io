---
title: Huffman Feedback Model
description: "The canonical asynchronous machine: one combinational network closed through its own lumped delays, so state exists without a clock — pays for it with an unknown settling order."
kind: circuit
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Huffman Model
  - Feedback Sequential Circuit
  - Huffman Machine
  - Huffman Feedback Model
---

# Huffman Feedback Model

A sequential circuit built from one combinational network whose outputs are wired back to its own inputs, so the memory is the propagation delay of the loop itself rather than any clocked element.

```tikz title="Huffman feedback model: combinational network closed through s delay elements"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw[thick] (0,0) rectangle (4.4,3);
  \node at (2.2,2.3) {combinational network};
  \node at (2.2,1.5) {$Y=f(x,y)$};
  \node at (2.2,0.8) {$z=g(x,y)$};

  \draw[->] (-2.6,2.4) -- (0,2.4);
  \node at (-1.3,2.75) {$x\;[n]$};

  \draw[->] (4.4,2.4) -- (7.0,2.4);
  \node at (5.7,2.75) {$z\;[m]$};

  \draw[->] (4.4,0.6) -- (6.0,0.6);
  \node at (5.2,0.95) {$Y\;[s]$};
  \draw (6.0,0.6) -- (6.0,-1.3) -- (3.4,-1.3);

  \draw[thick] (1.6,-1.75) rectangle (3.4,-0.85);
  \node at (2.5,-1.3) {$\Delta_1\;\dots\;\Delta_s$};

  \draw (1.6,-1.3) -- (-1.6,-1.3) -- (-1.6,0.6);
  \draw[->] (-1.6,0.6) -- (0,0.6);
  \node at (-0.75,0.95) {$y\;[s]$};

  \node[anchor=west] at (-2.6,-1.75) {\footnotesize stable $\iff y=f(x,y)$};
\end{circuitikz}
\end{document}
```

*Own construction — the standard textbook drawing of a feedback sequential circuit.*

**Fix the interface before the behaviour.** The primary inputs $x$ are $n$ level-sensitive lines; the primary outputs $z$ are $m$ lines. The loop carries $s$ **secondary variables**: $y \in \{0,1\}^s$ on the input side of the network, $Y \in \{0,1\}^s$ on the output side. $y$ and $Y$ are the *same* $s$ wires observed at two points, separated by the delay boxes — that duplication of names is the whole notational trick, and it is what lets a static Boolean function describe a circuit with memory.

**Read the loop as a fixed-point equation, not as a state table.** The network is pure combinational logic, so its behaviour is two Boolean functions plus a delay relation:

$$Y = f(x,y), \qquad z = g(x,y), \qquad y_i(t+\Delta_i) = Y_i(t)$$

The pair $(x,y)$ is the **total state** — $n+s$ bits, and both halves are needed, because the same $y$ under two different $x$ columns is two different situations. Substituting the delay relation into the first equation and asking when nothing moves gives the stability condition directly:

$$y = f(x,y)$$

a fixed point of $f(x,\cdot)$ for the held input. Any total state failing it is **unstable**, and every $y_i$ with $y_i \ne Y_i$ starts moving. In [[Mealy Machine]] terms $g$ depends on $x$; drop that dependence and $z=g(y)$ makes it a [[Moore Machine]] — the classification is orthogonal to the feedback and carries over unchanged.

**The delay boxes are found, not placed.** $\Delta_1 \dots \Delta_s$ are not components on the schematic; they are the propagation delay already present in each feedback wire and in the gates that drive it, lumped into one symbol per variable so the analysis has somewhere to put it. Drawing them is what converts an illegal-looking combinational cycle into an object you can reason about.

> [!important] Everything else in asynchronous design is a consequence of one sentence
> The $\Delta_i$ are positive, unknown, and unequal. So when two or more secondary variables go unstable together, the *order* in which they arrive is set by silicon, not by the specification, and the circuit visits an intermediate code that appears nowhere in the flow table. Races, critical races, essential hazards, and the whole [[Race-Free State Assignment]] apparatus exist to make correctness independent of that order — for **all** positive $\Delta_i$, not for the typical ones.

**Count states for a lower bound on $s$, then expect the bound to be unreachable.** A flow table with $k$ rows needs enough codes:

$$s \ \ge\ \lceil \log_2 k \rceil$$

but that is a *counting* argument and race freedom is a *graph-embedding* one. A transition $S_i \to S_j$ is race-free exactly when $d_H(\text{code}(S_i), \text{code}(S_j)) = 1$, so a race-free assignment exists only if the flow table's transition graph embeds in the $s$-cube $Q_s$ — which has just $s\,2^{s-1}$ edges and is bipartite, killing any odd cycle outright. The usual outcome is $s$ strictly above the counting floor, or a detour through unused codes as an [[Asynchronous Cycle]].

**Fundamental mode is a contract on the environment, not on the circuit.** The classical theory holds only under one restriction: inputs change **one variable at a time**, and no further input change arrives until the circuit has settled into a stable total state. Two separate promises are packed into that sentence.

1. **Single-input-change.** Two simultaneous input changes leave the target genuinely ambiguous — a machine that goes $A \to B$ on $x_1$ and $A \to C$ on $x_2$ has no defined answer for both at once, and the physical circuit picks by delay. SIC is also what makes hazard analysis tractable, since the static-hazard taxonomy is defined per single-variable transition; under multiple-input change you additionally get *function hazards*, which no choice of cover can remove.
2. **Settle before the next change.** This is what bounds the input rate, and it is the exact analogue of the clock period $T_{\text{clk}} \ge t_{pd,\max} + t_{\text{setup}} + t_{\text{skew}}$ — moved from the circuit's obligations onto the environment's. Nothing was saved; the constraint was relocated to somewhere it can sometimes be met more cheaply.

**Relaxing the contract costs analysis.** Requiring the environment to wait only for the *outputs* to respond, not for the internal $y$ to settle, gives **input–output mode**; dropping SIC in favour of specified simultaneous input *bursts* gives **burst mode**, which is what real asynchronous synthesis tools target. Each relaxation reintroduces a class of hazard the previous one had assumed away.

**One edit turns this into the clocked machine.** Replace the $s$ delay boxes with $s$ edge-triggered flip-flops on a common clock and leave $f$ and $g$ untouched: the fixed-point equation becomes a recurrence $y[t{+}1] = f(x[t], y[t])$, all $\Delta_i$ become one uniform value, and the settling order stops existing. That single substitution is why the synchronous discipline is worth its clock tree — and it is why an [[SR Latch]] and a [[Transparent D Latch]] are the smallest interesting instances of this diagram, with $s=1$ and $f$ equal to the hold equation.

**On FPGA the diagram is a synthesis error.** Static timing analysis cannot traverse a cycle, so every toolchain breaks the loop, warns, and then reports timing that is meaningless: Vivado needs `ALLOW_COMBINATORIAL_LOOPS` on the net plus a `set_disable_timing`, Quartus an equivalent cut. Worse, the hazard-free cover of $f$ is by construction *non-minimal*, and the logic optimiser removes exactly the redundant product terms that were added to suppress the glitch — so $f$ must be instantiated as `LUT` primitives under `DONT_TOUCH` rather than synthesised. On ASIC neither problem is structural, but you inherit the obligation to verify by delay-annotated simulation instead of by STA.

**Result.**

$$\boxed{\ Y = f(x,y),\quad y_i(t+\Delta_i) = Y_i(t) \quad\Longrightarrow\quad \text{stable} \iff y = f(x,y)\ }$$

**When it breaks.**

- **Two or more unstable $y_i$ at once.** The model still describes the circuit; it just no longer has a unique trajectory. If the reachable orders disagree on the final stable state it is a critical race and a hard functional bug, not a timing margin.
- **A column with no fixed point.** If $f(x,\cdot)$ has no fixed point in a reachable region, the loop oscillates at its own natural frequency for as long as that input is held. Same circuit, deliberately built, is a ring oscillator.
- **No reset.** Nothing in $Y=f(x,y)$ picks a starting state; power-up lands wherever the loop settles, or in a parasitic fixed point of the *implementation* that is not a row of the table. Initialisation has to be forced into $f$ itself.
- **Essential hazards survive any cover.** They are properties of the flow table, so they cannot be fixed in logic — only by making $\Delta_{\text{feedback}}$ exceed the input's path-length spread, i.e. by a [[Matched Delay Line]] placed by hand.
- **Above a handful of states.** Flow-table reduction, closed covers and cube embedding all scale badly, and the assignment problem gets harder faster than the state count. Real designs stop here and switch to handshake composition — see [[Choosing an Asynchronous Style]].

**RTL (Spade).**

The obvious transcription of $y = f(x,y)$ fails, because a `let` cannot refer to the name it is binding:

```spade
let (y1, y2) = excite(x, y1, y2);
// error: Use of undeclared name y1
// error: Use of undeclared name y2
```

But `decl` forward-declares a name before its defining `let`, and it does **not** insist that the definition be a register. That is enough to close the loop:

```spade
/// Excitation function f of the toggle element's flow table, Gray-assigned
/// state 1=00, 2=01, 3=11, 4=10.  The third product in each equation is the
/// consensus term: dropping it leaves a static-1 hazard on the x transition.
fn excite(x: bool, y1: bool, y2: bool) -> (bool, bool) {
    (
        (y1 && x) || (y2 && !x) || (y1 && y2),
        (!y1 && x) || (y2 && !x) || (!y1 && y2),
    )
}

entity toggle_async(rst: bool, x: bool) -> uint<2> {
    decl y1, y2;
    let (yn1, yn2) = excite(x, y1, y2);
    let y1 = yn1 && !rst;
    let y2 = yn2 && !rst;
    [y2, y1].as_uint()
}
```

`excite` is the network box; `y1, y2` are the two feedback wires and `yn1, yn2` are $Y_1, Y_2$ before the delay, so the $\Delta$ boxes are the zero-length wires between them — the model's one deliberate fiction, made literal. The state is $s=2$ bits, the input $n=1$, the output $m=1$ ($z = y_1$, the MSB of the returned `uint<2>`). `rst` is an AND gate in the feedback path, not a register reset: with no clocked element there is nowhere else to put initialisation. The emitted Verilog is a genuine combinational cycle — `assign \y1 = _e_1733[1];` feeding the same `\f` instance's `y1_i` — which is exactly what synthesis will refuse to time.

The flow table is the canonical toggle element, so $z$ must behave as a T flip-flop: one Gray step per input transition, $z$ toggling once per full period of $x$. Simulated against a reference computing $\text{gray}(n \bmod 4)$ from the transition count alone — 3012 checks, 0 failures, including the asymmetric first step $00 \to 01$ that a $y_1/y_2$ swap fails immediately (a swapped build fails 1512 of them).

> [!warning] The simulation does not validate hazard freedom
> Deleting both consensus terms still passes all 3012 checks. A zero-delay event simulator resolves the loop to its fixed point without ever exposing the glitch, so `PASS` here certifies the flow table and the state assignment and nothing about timing. The property this circuit actually needs — correctness for *arbitrary* positive $\Delta_i$ — is not reachable by any finite number of simulation vectors, which is the honest reason asynchronous design never got a verification story.

**Related Notes (with context):**

- [[Moore Machine]] – compares: the same $f$ and $g$ with the $\Delta$ boxes replaced by clocked registers; the settling order disappears and with it every pathology here.
- [[Mealy Machine]] – compares: this model is Mealy by default, since $g$ reads $x$ directly; a Moore output is the special case $g(y)$.
- [[SR Latch]] – depends-on: the minimal instance, $s=1$ and $f = S \vee \bar{R}y$ — the loop of this diagram drawn as two gates.
- [[Transparent D Latch]] – depends-on: the same $s=1$ loop with the hold term gated by an enable, and the building block the RTL above is really two of.
- [[Race-Free State Assignment]] – extends: turns the unknown settling order from a hazard into a non-event by constraining $\text{code}(\cdot)$ to make every required transition unit-distance.
- [[Asynchronous Cycle]] – extends: routes a distance-2 transition through unused codes when no unit-distance assignment exists at that $s$.
- [[Matched Delay Line]] – supports: the only cure for an essential hazard is a deliberate $\Delta$ in the feedback path exceeding the input's path-length spread.
- [[Muller C-Element]] – counter-example: a feedback loop whose hazard-free cover is the *complete* sum, used as a composable primitive instead of as a synthesised flow table.
- [[Choosing an Asynchronous Style]] – compares: where flow-table design stops paying and handshake composition takes over.

## References

No assigned book source; written from standard digital-design canon.

- D. A. Huffman, "The synthesis of sequential switching circuits" — the feedback model and the flow table.
- S. H. Unger, *Asynchronous Sequential Switching Circuits* — fundamental mode, total states, stability, the essential-hazard test.
- M. M. Mano & M. D. Ciletti, *Digital Design* — analysis of feedback sequential circuits, excitation tables, race-free assignment.
- J. F. Wakerly, *Digital Design: Principles and Practices* — feedback sequential circuits, the latch as the $s=1$ case.
- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — input–output and burst mode, why flow-table design does not scale.
