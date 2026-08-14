---
title: Mealy Machine
description: "Output is a function of state and current input, answering one cycle earlier with strictly fewer states, but adding a combinational x-to-z path that chains across cascaded machines and tracks every input glitch."
kind: circuit
source: "0.4) Synchronous Sequential Logic §Mealy, §Trade-offs, §Worked example — no book source"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic]
aliases:
  - Mealy
---

# Mealy Machine

A finite-state machine whose output logic reads the current input as well as the current state, so the response appears in the same cycle as the input that caused it rather than the next one.

```tikz title="Mealy machine: the x-to-lambda bypass, and the combinational path it opens across two cascaded machines"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ================= top panel: one Mealy machine =================
  \draw (0,-0.7) rectangle (1.9,0.7);
  \node[align=center] at (0.95,0) {next-state\\$\delta$};
  \draw (3.2,-0.7) rectangle (4.7,0.7);
  \node[align=center] at (3.95,0) {state\\reg};
  \draw (6.5,-0.7) rectangle (8.4,0.7);
  \node[align=center] at (7.45,0) {output\\$\lambda$};

  \draw[->] (-2.7,0.35) -- (0,0.35);
  \node[above] at (-2.62,0.35) {$x$};
  \node[below] at (-2.62,0.3) {$k$};

  \draw[->] (1.9,0) -- (3.2,0);
  \node[above] at (2.55,0.02) {$s$};
  \draw (4.7,0) -- (6.5,0);
  \draw[->] (6.4,0) -- (6.5,0);
  \fill (5.4,0) circle (1.6pt);
  \node[above] at (5.6,0.02) {$q$ ($s$ bits)};

  \draw[->] (8.4,0) -- (10.1,0);
  \node[above] at (9.4,0.02) {$z$};
  \node[below] at (9.4,-0.03) {$m$};

  % state feedback
  \draw[->] (5.4,0) -- (5.4,-2.0) -- (-1.6,-2.0) -- (-1.6,-0.35) -- (0,-0.35);
  \node[above] at (1.9,-2.0) {$q$ held one cycle};

  % the Mealy bypass, drawn heavy
  \fill (-2.2,0.35) circle (1.6pt);
  \draw[->,line width=1.1pt] (-2.2,0.35) -- (-2.2,1.9) -- (7.45,1.9) -- (7.45,0.7);
  \node[above] at (2.6,1.95) {$x\to\lambda\to z$: combinational, $k$ bits --- the whole difference};

  % clock
  \draw[->] (3.95,-2.6) -- (3.95,-0.7);
  \node[below] at (3.95,-2.6) {clk, rst};

  \node[anchor=west] at (-2.7,-3.2) {$q^{n+1}=\delta(q^{n},x^{n})$ \quad but \quad $z^{n}=\lambda(q^{n},x^{n})$, not $\lambda(q^{n})$};

  % ================= bottom panel: two cascaded machines =================
  \draw (0,-6.6) rectangle (2.6,-5.0);
  \node[align=center] at (1.3,-5.8) {Mealy 1\\$\delta_1,\lambda_1$};
  \draw (5.6,-6.6) rectangle (8.2,-5.0);
  \node[align=center] at (6.9,-5.8) {Mealy 2\\$\delta_2,\lambda_2$};

  \draw[->,line width=1.1pt] (-2.7,-5.8) -- (0,-5.8);
  \node[above] at (-1.35,-5.8) {$x_1$};
  \draw[->,line width=1.1pt] (2.6,-5.8) -- (5.6,-5.8);
  \node[above] at (4.1,-5.8) {$z_1=x_2$};
  \node[below] at (4.1,-5.85) {never registered};
  \draw[->,line width=1.1pt] (8.2,-5.8) -- (10.6,-5.8);
  \node[above] at (9.4,-5.8) {$z_2$};

  % span bracket
  \draw[|-|] (-2.7,-7.1) -- (10.6,-7.1);
  \node[below] at (3.95,-7.15) {one combinational path: $t_{pd}^{\lambda_1}+t_{pd}^{\delta_2}$ lands on machine 2's setup, and $+\,t_{pd}^{\lambda_2}$ on $z_2$};

  % ring
  \draw[dashed] (9.7,-5.8) -- (9.7,-4.2) -- (-2.35,-4.2);
  \draw[->,dashed] (-2.35,-4.2) -- (-2.35,-5.8);
  \fill (9.7,-5.8) circle (1.6pt);
  \fill (-2.35,-5.8) circle (1.6pt);
  \node[above] at (3.85,-4.2) {close the ring and this becomes a combinational cycle --- no longer a synchronous circuit};

\end{circuitikz}
\end{document}
```

**Attach the output to the edge, not to the node.** In the 6-tuple $(X,Q,Z,\delta,\lambda,q_0)$ of [[Canonical FSM Structure]] the two combinational blocks are unchanged; only $\lambda$'s argument list differs:

$$q^{n+1}=\delta(q^{n},x^{n}), \qquad z^{n}=\lambda(q^{n},x^{n})$$

against Moore's $z^{n}=\lambda(q^{n})$. Widths: $x$ is $k$ bits, $z$ is $m$ bits, and the state register is $s$ bits — $s=\lceil\log_2 N\rceil$ under [[Binary State Encoding]], $s=N$ under [[One-Hot State Encoding]], for $N$ states. So $\lambda$ is $m$ Boolean functions of $s+k$ variables instead of $m$ functions of $s$: the *only* structural change is $k$ extra input variables on one combinational cone, minimized by the ordinary laws of [[Boolean Algebra]]. On the [[State Transition Graph]] this is the difference between writing the output inside the node and writing `input/output` on the edge, and the edge is the finer object — several edges enter one node, and they may now disagree about $z$.

**That extra resolution is what buys back the states.** Two states that behave identically going forward but must emit different outputs cannot be merged in a Moore machine, because there the output *is* carried by the state; in a Mealy machine they merge, because the differing emission rides on the incoming edges. The construction in both directions is explicit: Mealy $\to$ Moore splits each state into one copy per distinct incoming output label, giving at most $|Q|\cdot|Z|$ states, and Moore $\to$ Mealy is the identity map on a $\lambda$ that ignores $x$. Hence

$$|Q_{\text{Mealy}}| \;\le\; |Q_{\text{Moore}}| \;\le\; |Q_{\text{Mealy}}|\cdot|Z|$$

and neither machine can compute anything the other cannot. The choice is never about expressiveness, only about *when* the answer appears and what it costs.

**Read the output equation straight off the edge labels.** Collect every edge carrying output $1$; each contributes the product of its source-state indicator and its input condition, and $z$ is their disjunction. For the overlapping [[1011 Sequence Detector]] with states $A=\varepsilon$, $B=1$, $C=10$, $D=101$ there is exactly one such edge, $D\xrightarrow{1/1}B$:

$$z=q_D\,x$$

Substituting the binary assignment $A=00,B=01,C=10,D=11$ — so $q_D=s_1s_0$ — gives $z=s_1s_0x$, a single 3-input product. The machine needs four states, not five, and the fifth Moore state $S_4$ is recovered exactly by registering this product: from the Moore equations $q_4^{+}=q_3x$ with $z=q_4$, and $D\equiv S_3$, so $q_4^{+}$ *is* $z$ delayed one cycle.

> [!important] A Moore machine is its Mealy machine with the output logic registered.
> One extra flop, one extra state, one extra cycle, zero glitch — and in that order, because the flop is what creates the state and the state is what costs the cycle. Read backwards: registering a Mealy output does not "fix" it into something new, it converts it into the Moore machine you would have drawn anyway. There is no third option hiding between them.

**The new path misses $f_{\max}$ locally and hits it at the boundary.** The cycle-setting loop is $q\to\delta\to d\to q$, and $\lambda$ is not in it — for a *single* machine, output-logic depth is free, exactly as in Moore. What Mealy adds is $x\to\lambda\to z$, whose arrival time is $t_{\text{arr}}(z)=t_{\text{arr}}(x)+t_{pd}^{\lambda}$. If $x$ comes from a flop, $t_{\text{arr}}(x)=t_{pcq}$ and nothing is unusual. If $x$ is itself the Mealy output of an upstream machine, the two combinational cones concatenate: the bottom panel of the diagram has no register anywhere between $x_1$ and machine 2's $D$ input, so machine 2's setup constraint is not its own $\delta_2$ but

$$T \;\ge\; t_{pcq} + \sum_{j<i} t_{pd}^{\lambda_j} + t_{pd}^{\delta_i} + t_{su}$$

which grows linearly in cascade depth $i$ while every individual machine still reports a comfortable $f_{\max}$ in isolation. Close the cascade into a ring and the sum has no last term at all — a combinational cycle, which static timing reports as an unconstrained loop rather than as a slack violation, because there is no path to bound.

**The output tracks every glitch on the input, because that is what "combinational" means.** $z$ is a combinational function of $x$, so a [[Static Hazards|static hazard]] on $x$, or merely $x$ settling late in the cycle, produces a transient on $z$ mid-cycle. A flop sampling $z$ at the next edge does not care: the transient has settled long before the setup window, and this is the only legitimate consumer. Everything level-sensitive does care — a write enable will write, a FIFO push will push, an asynchronous reset will reset, and a signal used as a clock will produce an edge. The rule is mechanical: a Mealy output may drive $D$ inputs and combinational logic, never an enable, a strobe, a clock, or a [[Two-Flop Synchronizer]] feeding another domain.

**On FPGA the repair costs nothing, on ASIC it costs a flop.** $\lambda$ is a LUT either way, and in every mainstream fabric each LUT is paired with a flip-flop in the same slice that is usually idle ([[Lookup-Tables]], [[FPGAs]]) — so registering a Mealy output is free in area and adds no LUT level, which makes "register it before it leaves the module" a rule you can follow unconditionally. On ASIC the flop is real area, real clock-tree load, and real power, so the trade is genuine and worth arguing about. The encoding choice is orthogonal and unchanged from the Moore case: for the 1011 detector, binary needs 2 flops and 2 LUT6 while one-hot needs 4 flops and 5 LUT6, both one LUT level deep, and the crossover only moves in one-hot's favour once $\lceil\log_2 N\rceil+k>6$ overflows a LUT6 — see [[Choosing an FSM Encoding]].

$$\boxed{\ z^{n}=\lambda(q^{n},x^{n}) \quad\Longrightarrow\quad T \ge t_{pcq} + \sum_{j<i} t_{pd}^{\lambda_j} + t_{pd}^{\delta_i} + t_{su}\ }$$

**When it breaks**

- **"Fewer states" is $\le$, not $<$.** When every state already determines its output — a counter publishing its own count, a controller whose outputs are per-state control words — the Moore split is trivial and both machines have $|Q|$ states. Mealy then buys the cycle and nothing else, and pays the $x\to z$ path for it.
- **Cascades, and only cascades, are the timing hazard.** One Mealy machine feeding a register bank is timing-identical to the Moore version. Two feeding each other are not, and the damage is invisible in each module's own timing report.
- **Rings are not slow, they are illegal.** A combinational cycle has no defined settling time; synthesis may or may not warn, simulation may or may not oscillate, and the part may work at one temperature. Break it with a register, not with a timing constraint.
- **The glitch is not a simulation artifact.** RTL simulation with zero-delay logic shows a clean $z$; gate-level simulation and silicon do not. Never conclude from a passing RTL testbench that a Mealy output is safe as an enable.
- **Mealy across a clock domain is meaningless.** The receiving domain has no cycle in which "the same cycle" is defined. Register the output, then hand the registered version to [[Two-Flop Synchronizer]] or to a [[Handshake Ready-Valid]] pair; the one-cycle saving is destroyed by the synchroniser anyway.
- **Moore is the default.** Take Mealy when the cycle is genuinely on a critical control loop — a `ready` that must combinationally reflect the current `valid`, a status flag feeding this cycle's decision — and when the consumer is a flop.

**RTL (Spade)**

```spade
enum P1011 { A, B, C, D }

entity mealy_1011(clk: clock, rst: bool, x: bool) -> bool {
    decl next;
    reg(clk) q reset(rst: P1011::A) = next;

    let next = match (q, x) {
        (P1011::A, false) => P1011::A,
        (P1011::A, true)  => P1011::B,
        (P1011::B, false) => P1011::C,
        (P1011::B, true)  => P1011::B,
        (P1011::C, false) => P1011::A,
        (P1011::C, true)  => P1011::D,
        (P1011::D, false) => P1011::C,
        (P1011::D, true)  => P1011::B,
    };

    match q { P1011::D => x, _ => false }
}
```

`q` is the state register of the diagram and `next` is the wire out of $\delta$; `decl` is required only because the register is written above the logic that feeds it. The whole Mealy property is the last line: the output is a tail expression, not a `reg`, and it mentions `x` — that expression *is* the heavy bypass in the drawing, and `P1011::D => x` is $z=q_Dx$ transcribed. All signals are 1 bit except `q`, whose width synthesis chooses: the `enum` is deliberately not given an encoding here, so a tool is free to emit 2 bits (binary) or 4 (one-hot) from the same source, which is the one thing synthesis will do differently from any drawing of this machine.

Verified by simulation: 3022 vectors, including the overlapping `1011011` firing exactly twice in the cycles of its completing bits, the bit-reversed `1101` correctly never firing, an explicit check that the pulse is not one cycle late, and a 3000-bit random sweep against a behavioural "last four bits were 1011" reference.

**Related Notes**

- [[Moore Machine]] – compares: the same machine with $\lambda$'s $x$ argument deleted and a flop inserted; one more state, one more cycle, no bypass.
- [[1011 Sequence Detector]] – supports: the worked four-state machine, its transition table, and both encodings' equations.
- [[Canonical FSM Structure]] – depends-on: the $\delta$ / register / $\lambda$ decomposition this note only re-argues one wire of.
- [[State Transition Graph]] – depends-on: `input/output` edge labelling, which is where the output equation is read from.
- [[Choosing an FSM Encoding]] – compares: binary versus one-hot for the same machine, and the LUT6 crossover.
- [[Handshake Ready-Valid]] – extends: the case where the same-cycle response is the point, and combinational `ready` from `valid` is a deliberate Mealy path.
- [[Two-Flop Synchronizer]] – counter-example: a consumer a Mealy output must never reach unregistered.
- [[FSMD Controller-Datapath Split]] – extends: Mealy control outputs steering the datapath in the cycle their condition arrives.

## References

- [[Synchronous Sequential Logic]] — §Mealy (the four consequences of $z=\lambda(q,x)$), §Trade-offs (the Moore/Mealy table and the encoding counts), §Worked example: overlapping 1011 detector, §Mealy version (state table, one-hot and binary equations, cycle-by-cycle trace).
- No textbook source for this topic. Standard in Mano & Ciletti, *Digital Design*, ch. 5 (state tables, graphs and sequence-detector design); Wakerly, *Digital Design: Principles and Practices*, ch. 7 (Moore versus Mealy output timing); Weste & Harris, *CMOS VLSI Design*, ch. 10 (the setup constraint the cascade sum above is an instance of). Page numbers are deliberately omitted — no copy was consulted for this note.
