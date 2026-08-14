---
title: Canonical FSM Structure
description: "The three-block template every state machine reduces to — next-state logic, state register, output logic — with the critical path living only in the q-to-delta-to-q loop."
kind: circuit
source: "0.4) Synchronous Sequential Logic, §Canonical FSM structure; Mano & Ciletti ch. 5; Wakerly, §Sequential Logic Design Principles; Weste & Harris ch. 10"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, fsm, state-machine, sequential, timing]
aliases:
  - Canonical FSM Structure
  - Canonical FSM
  - FSM Structure
  - FSM
  - Finite State Machine
  - Finite-State Machine
  - State Machine
  - Three-Block FSM
  - Next-State Logic
  - Output Logic
  - State Register
---

# Canonical FSM Structure

**One-line summary:** Every synchronous state machine is the same three blocks — $\delta$, a register, $\lambda$ — and the distinguishing property is that exactly one of them is sequential, which collapses the whole design problem onto a single combinational loop $q \to \delta \to d \to q$.

```tikz title="Canonical finite-state-machine structure: next-state logic, state register, output logic"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % blocks
  \draw (-1.3,-0.9) rectangle (1.3,0.9);
  \node[align=center] at (0,0) {next-state\\logic $\delta$};
  \draw (3.0,-0.9) rectangle (4.6,0.9);
  \node[align=center] at (3.8,0) {state\\register};
  \draw (6.6,-0.9) rectangle (9.0,0.9);
  \node[align=center] at (7.8,0) {output\\logic $\lambda$};

  % input
  \draw[->] (-3.6,0.35) -- (-1.3,0.35);
  \node at (-3.35,0.78) {$x$};
  \node at (-2.1,0.68) {$k$};

  % nsl -> reg
  \draw[->] (1.3,0) -- (3.0,0);
  \node at (2.15,0.32) {$d$};
  \node at (2.15,-0.32) {$s$};

  % reg -> output logic
  \draw[->] (4.6,0) -- (6.6,0);
  \node at (5.4,0.32) {$q$};
  \node at (5.4,-0.32) {$s$};

  % output
  \draw[->] (9.0,0) -- (10.8,0);
  \node at (10.2,0.32) {$z$};
  \node at (10.2,-0.32) {$m$};

  % feedback
  \draw[->] (5.6,0) -- (5.6,-2.6) -- (-2.6,-2.6) -- (-2.6,-0.35) -- (-1.3,-0.35);
  \filldraw (5.6,0) circle (1.6pt);
  \node[anchor=south] at (1.2,-2.52) {$q$ \; ($s$ bits, one cycle old)};

  % Mealy bypass
  \draw[->,dashed] (-3.0,0.35) -- (-3.0,2.1) -- (7.8,2.1) -- (7.8,0.9);
  \filldraw (-3.0,0.35) circle (1.6pt);
  \node at (2.4,2.4) {Mealy-only path ($k$ bits): input straight into $\lambda$};

  % clock / reset
  \draw[->] (3.8,-1.95) -- (3.8,-0.9);
  \node[anchor=north] at (3.8,-2.0) {clk, rst};
\end{circuitikz}
\end{document}
```

*Own construction. The dashed tap is drawn once so that Moore and Mealy are the same picture with one wire deleted or kept, rather than two unrelated drawings.*

**Topic:**

**Decompose until exactly one block is sequential, because that is what makes the rest tractable.** The machine is the 6-tuple $(X, Q, Z, \delta, \lambda, q_0)$ with

$$
q^{n+1} = \delta(q^n, x^n), \qquad
z^n = \begin{cases}\lambda(q^n) & \text{Moore}\\ \lambda(q^n, x^n) & \text{Mealy}\end{cases}
$$

and the three-block drawing is nothing more than a rendering of those two equations: $\delta$ evaluates the first, the register applies the time shift $n \to n+1$, $\lambda$ evaluates the second. Widths: $x$ is $k$ bits, $z$ is $m$ bits, and both $d$ (the register input) and $q$ (its output) are $s$ bits, where $s$ is fixed by the encoding of the $N = |Q|$ symbols. The *only* sequential element in the entire structure is that register — $\delta$ and $\lambda$ are pure combinational logic, so everything in [[Combinational Logic]] applies to them unchanged, including hazards, which is why an [[1011 Sequence Detector]] built this way can glitch on $z$ mid-cycle without being wrong.

**Choosing an encoding is what turns the abstract functions into Boolean functions.** Pick an injective map $\text{enc} : Q \to \{0,1\}^s$ and the two equations above become $s + m$ Boolean functions of $s + k$ variables, minimizable by the laws in [[Boolean Algebra]] — absorption, consensus, the usual two-level covering. That count is the entire cost model of an FSM, and it is where the encoding notes take over: [[Binary State Encoding]] takes $s = \lceil \log_2 N \rceil$, [[One-Hot State Encoding]] takes $s = N$ and buys a $\delta$ that is one OR of incoming transition terms per bit, [[Gray Code State Encoding]] takes $s = \lceil \log_2 N \rceil$ and constrains *which* codeword goes to which state. No encoding changes $\delta$ as a function on $Q$; each changes the Boolean functions that implement it, and therefore its depth. The specification the encoding is applied to is the [[State Transition Graph]].

**The critical path is a loop, and it contains exactly one register.** Trace the only cycle in the signal-flow graph: $q$ leaves the register, crosses $\delta$, arrives at $d$, and is captured by the same register on the next edge. That is the register-to-register path of [[Introduction to Flip-Flops & Latches]], so

$$T_c \;\ge\; t_{pcq} + t_{pd}^{\delta} + t_{\text{setup}} + t_{\text{skew}}$$

with the hold side $t_{ccq} + t_{cd}^{\delta} \ge t_{\text{hold}} + t_{\text{skew}}$. Launch and capture are the same register bank fed by the same clock leaf, so $t_{\text{skew}}$ here is small by construction — a state machine is one of the few structures where the skew term is genuinely near zero, and where every ounce of the budget goes to $t_{pd}^{\delta}$. Every design move in this topic is an attempt to shrink $t_{pd}^{\delta}$ or to stop caring about it: re-encode ([[Choosing an FSM Encoding]]), cut the machine into control plus datapath ([[FSMD Controller-Datapath Split]]), or move registers across the logic ([[Retiming]], [[C-Slow Retiming]]).

> [!note] $\lambda$ is not in the loop
> Output logic depth is free in $f_{\max}$. $q \to \lambda \to z$ launches at a register and ends at a port, so it is an output path constrained by the *consumer's* setup time, not by $T_c$ of this machine. You may make $\lambda$ arbitrarily deep without slowing the machine down — and this stops being true the instant $z$ feeds another machine's $\delta$, at which point $t_{pd}^{\lambda}$ is prepended to that machine's loop and the two paths concatenate.

**The feedback is legal only because a register cuts it.** The drawing has a cycle in it, and a cycle in combinational logic is a latch or an oscillator, not a function. What makes this one a *function* is that the loop passes through an edge-triggered element, so the graph obtained by deleting register outputs is acyclic and static timing analysis can traverse it as a finite set of paths. Cut the register out and you are in [[Asynchronous Sequential Logic]], where the loop delays themselves become state and the analysis is no longer a per-path inequality. This is also the practical reason RTL for an FSM never writes the feedback explicitly: the register's own self-reference carries it.

**One flop per state bit, and the synthesiser will not preserve your block boundaries.** The structure costs $s$ flip-flops — literal [[D Flip-Flop]] instances, one per bit of $q$, sharing one clock and one reset — plus whatever $\delta$ and $\lambda$ cost as two-level or multi-level logic. On an ASIC, $\delta$ maps to standard cells and its depth is roughly $\lceil \log_{f} (\text{fanin}) \rceil$ stages of gates; on an FPGA it maps to $k$-input LUTs, so what matters is not literal count but *support size*: a next-state bit depending on $\le k$ variables is one LUT and one level of delay regardless of how ugly its expression is, and a bit depending on more is a LUT tree. This is exactly why one-hot is the FPGA default — each next-state bit's support is the set of source states of its incoming transitions, usually two or three — and it is a consequence of [[FPGAs]] pricing logic by variable count rather than by gate count. The synthesiser will then flatten $\delta$ and $\lambda$ together, absorb $\lambda$ into the same LUTs when it is shallow, and re-encode the states unless told not to; the three boxes are a reasoning device, not a netlist.

**Reset is what makes $q_0$ exist in silicon.** The 6-tuple names an initial state; hardware has none until a reset drives it there, and until then $q$ holds an arbitrary one of $2^s$ patterns, of which only $N$ are legal. Synchronous reset costs one more term in the $\delta$ combinational path — it is a mux in front of the register, so it lengthens the very loop that sets $T_c$ — while asynchronous reset costs a dedicated flop pin and a recovery/removal check instead. When $2^s > N$ the difference between "reachable from $q_0$" and "reachable at all" becomes a safety question, which is [[Safe-State FSM Recovery]].

**Result.**

$$\boxed{\ q^{n+1} = \delta(q^n, x^n),\quad z^n = \lambda(q^n\,[,\,x^n]);\qquad T_c \ge t_{pcq} + t_{pd}^{\delta} + t_{\text{setup}} + t_{\text{skew}}\ }$$

**When it breaks.**

- **$z$ feeding another $\delta$ voids the "$\lambda$ is free" result.** Cascade two Mealy machines and their combinational paths concatenate; close a ring of them and you have a combinational cycle with no register in it, which breaks the synchronous discipline outright. Register the output, or accept that the two machines share one $T_c$ budget.
- **More than one clock and the template does not compose.** Two blocks on different clocks are two machines, not one; $q$ crossing between them needs a synchronizer, and the $t_{\text{skew}}$ term above stops being small.
- **The state space explodes before the logic does.** An FSM whose "state" includes a counter value or a data word has $N$ exponential in the datapath width, and $\delta$ becomes an adder pretending to be a transition function. That is the signal to split into control plus datapath — see [[FSMD Controller-Datapath Split]].
- **Deep $\delta$ cannot be fixed by encoding alone.** Once $t_{pd}^{\delta}$ is dominated by a wide priority decode or an arithmetic comparison, re-encoding buys a level or two and no more; the remedy is pipelining the machine ([[Pipeline Register Insertion]]) or retiming, both of which change the cycle count and therefore the specification.
- **Illegal states are reachable in hardware even when they are unreachable in the graph**, via reset failure, single-event upsets, or a synthesiser that used a don't-care for the unused $2^s - N$ codes. The template as drawn has no recovery path.
- **A combinational $z$ leaving the synchronous island is a different circuit.** Glitches on $\lambda$'s output are free inside a cycle and fatal as a write-enable, an off-chip strobe, or a clock-gate enable.

**RTL (Spade).**

```spade
enum St { S0, S1, S2 }

fn delta(q: St, x: bool) -> St {
    match (q, x) {
        (St::S0, true) => St::S1,
        (St::S1, true) => St::S2,
        (St::S2, true) => St::S0,
        (s, false)     => s,
    }
}

fn lambda_moore(q: St) -> bool {
    match q {
        St::S2 => true,
        _      => false,
    }
}

fn lambda_mealy(q: St, x: bool) -> bool {
    lambda_moore(delta(q, x))
}

entity fsm(clk: clock, rst: bool, x: bool) -> (bool, bool) {
    decl d;
    reg(clk) q reset(rst: St::S0) = d;
    let d = delta(q, x);
    (lambda_moore(q), lambda_mealy(q, x))
}
```

The three `fn`s are the three boxes: `delta` is the left block, `reg(clk) q` is the state register with $q_0 = $ `St::S0`, and the two `lambda`s are the right block drawn once with and once without the dashed tap. `d` and `q` are both $s$ bits — Spade picks $s$ from the `enum`, which is the encoding decision deferred to the synthesiser, so this source text is genuinely encoding-agnostic. The forward `decl d` exists only to name the wire in the diagram; `reg(clk) q ... = delta(q, x)` is legal self-reference and lowers identically. What synthesis does differently: it flattens `delta` and `lambda_mealy` into one cone (`lambda_mealy` calls `delta`, so the duplicated next-state logic is shared, not built twice), and `reset()` lowers to a **synchronous** reset — one more mux in the $q \to \delta \to q$ loop, exactly the cost noted above.

Simulated with a 3000-cycle random sweep plus a named asymmetric walk: 3008 checks, 0 failures, against a behavioural mod-3 reference. The walk exists because the interesting property is asymmetric *in time* — `lambda_mealy` must assert one cycle before `lambda_moore` for the same input — and a symmetric vector cannot see a swapped or unregistered output. It caught one: in the emitted Verilog a returned tuple packs element 0 into the **high** bit of `output__`, so the naive `y[0] == moore` binding is backwards.

**Related Notes (with context):**

- [[Moore Machine]] – extends: instantiates this template with the dashed tap deleted, paying a cycle of latency and an extra state for a glitch-free output.
- [[Mealy Machine]] – extends: instantiates it with the tap kept, buying a cycle back and creating the $x \to \lambda \to z$ path this note's timing result excludes.
- [[State Transition Graph]] – depends-on: the specification $\delta$ and $\lambda$ are read off from before any encoding exists.
- [[Choosing an FSM Encoding]] – compares: decides $s$ and therefore both the flop count and the depth of $\delta$ in the loop above.
- [[Binary State Encoding]] – extends: the minimal-$s$ instantiation, $s = \lceil \log_2 N \rceil$.
- [[One-Hot State Encoding]] – extends: trades $s = N$ flops for a $\delta$ of minimal support, which is what makes it the FPGA default.
- [[D Flip-Flop]] – depends-on: supplies the one sequential element; $s$ of them, one clock, one reset.
- [[Combinational Logic]] – depends-on: $\delta$ and $\lambda$ are ordinary combinational cones, hazards and all.
- [[Boolean Algebra]] – depends-on: minimizes the $s + m$ functions the encoding produces.
- [[FSMD Controller-Datapath Split]] – extends: the answer when $N$ grows with a data word rather than with the control problem.
- [[Retiming]] – extends: moves registers across $\delta$ to rebalance the loop without changing the machine's behaviour.
- [[Pipeline Register Insertion]] – extends: cuts $\delta$ with registers, which changes the cycle count and so is not behaviour-preserving.
- [[Safe-State FSM Recovery]] – counter-example: what the template does *not* handle, namely the $2^s - N$ codes it can enter but never leave.
- [[Asynchronous Sequential Logic]] – counter-example: the same feedback loop with the register removed, where delays become state.
- [[Synchronous Sequential Logic]] – supports: the topic this template organises.

## References

- `0.4) Synchronous Sequential Logic`, §*Canonical FSM structure* — the three-block decomposition, the 6-tuple $(X, Q, Z, \delta, \lambda, q_0)$, the reduction of $\delta$ and $\lambda$ to $s+m$ Boolean functions of $s+k$ variables, and the observation that the critical path is $q \to \delta \to d \to q$ with $\lambda$ outside it.
- `0.3) Introduction to Flip-Flops & Latches` — the register-to-register constraint $T_c \ge t_{pcq} + t_{pd} + t_{\text{setup}} + t_{\text{skew}}$ and its hold counterpart, used here unmodified.
- Mano & Ciletti, *Digital Design*, ch. 5 — the canonical Moore/Mealy block diagram, state tables and the encoding step.
- Wakerly, *Digital Design: Principles and Practices*, §*Sequential Logic Design Principles* — clocked synchronous state-machine structure, excitation and output equations, state assignment.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — sequencing overhead $t_{pcq} + t_{\text{setup}}$ and why it, not the logic, sets the floor on $T_c$ for a shallow $\delta$.

> [!warning] Printed page numbers not verified
> The three textbook citations are chapter- or section-level. No copy was consulted for this note — the material is standard canon and the chapter numbering is stable across editions, but page numbers are not given because they were not read. Wakerly's sequential-design chapter is numbered differently in the 3rd and 4th editions, so it is cited by title.
