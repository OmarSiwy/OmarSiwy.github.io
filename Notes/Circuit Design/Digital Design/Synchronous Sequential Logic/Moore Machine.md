---
title: Moore Machine
description: "Output is a function of state alone, so it is a registered signal in all but name — glitch-free and safe to use as an enable, at the cost of one cycle and one extra state."
kind: circuit
source: "0.4) Synchronous Sequential Logic §Moore, §Trade-offs, §Moore version — no book source"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, fsm, moore, glitch]
aliases:
  - Moore
  - Moore Machines
  - Moore FSM
  - Moore Finite-State Machine
---

# Moore Machine

A finite-state machine whose output logic reads the state register only, $z^n=\lambda(q^n)$, so the output is stable for a whole clock period and lags the input that caused it by exactly one cycle.

```tikz title="Moore state transition graph of the overlapping 1011 detector: output inside the node, S1 and S4 differing only in output"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- states: the output lives in the node, Moore convention ---
  \foreach \x/\n/\z in {0/0/0, 3/1/0, 6/2/0, 9/3/0, 12/4/1}
    \draw (\x,0) circle (0.62) node {$S_\n/\z$};

  \draw[->] (-2.0,0) -- (-0.62,0);
  \node[above] at (-1.4,0.02) {rst};

  % --- forward chain ---
  \draw[->] (0.62,0.18)  -- node[above]{$1$} (2.38,0.18);
  \draw[->] (3.62,-0.18) -- node[below]{$0$} (5.38,-0.18);
  \draw[->] (6.62,0.18)  -- node[above]{$1$} (8.38,0.18);
  \draw[->] (9.62,0.18)  -- node[above]{$1$} (11.38,0.18);

  % --- self loops: S0 above, S1 below (keeps the long 1-arc clear) ---
  \draw[->] (-0.28,0.55) arc (200:-20:0.42) node[midway,above]{$0$};
  \draw[->] (2.72,-0.55) arc (160:380:0.42) node[midway,below]{$1$};

  % --- back edges at three depths, none sharing an x-span ---
  \draw[->] (6,-0.62) .. controls (4.2,-2.3) and (1.8,-2.3) .. (0,-0.62)
        node[pos=0.32,below]{$0$};
  \draw[->] (9,-0.62) .. controls (8.5,-1.5) and (6.5,-1.5) .. (6,-0.62)
        node[midway,below=-2pt]{$0$};
  \draw[->] (12,-0.62) .. controls (11,-3.4) and (7,-3.4) .. (6,-0.62)
        node[midway,below]{$0$};
  \draw[->] (12,0.62) .. controls (11,3.0) and (4.5,3.0) .. (3.3,0.55)
        node[pos=0.55,above]{$1$};

  \node[align=center] at (6,-4.4)
    {$S_1$ and $S_4$ have identical outgoing edges and differ only in $z$;\\
     that fifth state \emph{is} the output register.};

  \node[anchor=west] at (-2.0,3.4)
    {$z=\lambda(q)$: the input $x$ labels edges only, never the output};

\end{circuitikz}
\end{document}
```

**Fix the machine by what $\lambda$ is allowed to read.** Of the 6-tuple $(X,Q,Z,\delta,\lambda,q_0)$ set out in [[Canonical FSM Structure]], Moore constrains exactly one component: the output map has arity one.

$$q^{n+1}=\delta(q^n,x^n),\qquad z^n=\lambda(q^n)$$

Widths: $x$ is $k$ bits, $z$ is $m$ bits, the state register is $s$ bits holding one of $N$ symbols — $s=\lceil\log_2 N\rceil$ under [[Binary State Encoding]], $s=N$ under [[One-Hot State Encoding]]. $\delta$ is $s$ Boolean functions of $s+k$ variables; $\lambda$ is $m$ Boolean functions of $s$ variables, **and $k$ of the variables a Mealy $\lambda$ would have are simply absent**. Every property below is a consequence of that missing argument, not of anything else in the structure.

**The output is a registered signal in all but name.** $\lambda$'s only inputs are flop outputs, so $z$ inherits flop timing: it begins moving at $t_{pcq}$ after the clock edge, finishes at $t_{pcq}+t_{pd}^{\lambda}$, and is then flat until the next edge. Glitching is confined to that transition window, because a hazard needs two inputs of $\lambda$ to arrive at different times and here the only spread available is the clock-to-Q variation $\Delta t_{cq}$ across the state register — nanoseconds after the edge, not scattered through the cycle. If $\lambda$ is a wire the window closes entirely: the output *is* a flop output and is glitch-free by construction, not by argument. Contrast [[Mealy Machine]], where $z$ tracks $x$ combinationally and therefore repeats every glitch $x$ has, at any time in the cycle.

> [!important] That window is the entire practical case for Moore.
> Glitches inside a synchronous island are free — a downstream flop samples only at the edge, so the combinational cloud may transition as often as it likes ([[Static Hazards]]). They become real events the moment the signal leaves: an asynchronous RAM write-enable, an off-chip strobe, a clock-gating cell, an input to another clock domain. A Moore output is safe at all four boundaries by construction; a Mealy output must be registered first, which costs the same cycle Mealy was chosen to save.

**It costs a cycle, and the cycle is unavoidable rather than an artefact.** The fact "the input just now completed the pattern" is a function of $q^n$ *and* $x^n$; if $\lambda$ may not see $x^n$, that fact must first be transported into $q^{n+1}$ by $\delta$, which is a clock edge. So the response appears in cycle $n+1$. This is a shift, not a distortion — pulse widths and spacings are identical to Mealy's, as the cycle-by-cycle trace in [[1011 Sequence Detector]] shows for the overlapping case where both machines fire twice, Mealy in cycles 4 and 7, Moore in 5 and 8.

**It costs states, and the extra state is literally the output flop.** Two states with identical future behaviour but different required outputs cannot be merged, because the output is carried by the state — partition refinement separates them in round $P_0$, purely on the output column, before any successor is examined. In the detector above, $S_1$ and $S_4$ have the same two outgoing edges ($0\to S_2$, $1\to S_1$) and differ only in $z$. Delete the output column, as Mealy does by moving emission onto the edges, and they merge immediately: five states become four. Compare the two next-state equations for the completing transition, in one-hot form where $D\equiv S_3$:

$$
\underbrace{z=q_D\,x}_{\text{Mealy}}
\qquad\text{versus}\qquad
\underbrace{q_4^{+}=q_3\,x,\quad z=q_4}_{\text{Moore}}
$$

The same product term appears in both. Moore has inserted a flip-flop between it and the output pin — a [[D Flip-Flop]] whose D input is the Mealy output function. That is the whole construction, and it is why the conversion is mechanical in both directions.

$$\boxed{\ z^{\,n+1}_{\text{Moore}}=\lambda_{\text{Mealy}}(q^{n},x^{n})\ }$$

**Count what the extra state actually costs, because $\lceil\log_2 N\rceil$ is a step function.** Four states need $s=2$; five need $s=3$. So on a binary-encoded ASIC the Moore detector pays a *whole extra flop* plus wider $\delta$ fan-in, not the "one flop" the identity above suggests — and it opens $2^3-5=3$ unused codes that synthesis will absorb as don't-cares, which is exactly the condition [[Safe-State FSM Recovery]] exists for. The Spade compiler below emits precisely this: a 3-bit dense tag with codes `3'd5..3'd7` unreachable and undefended. Under one-hot the accounting is different and kinder: $N$ flops become $N+1$, $\delta$'s fan-in is in-degree $+\,k$ and does not move, and $\lambda$ becomes $z=q_4$ — a wire, zero LUTs, the glitch-free case.

**$\lambda$ is outside the critical loop, so this costs nothing in $f_{\max}$.** The cycle-time constraint of [[Introduction to Flip-Flops & Latches]] binds on the loop $q\to\delta\to d\to q$; $\lambda$ is a feed-forward tail hanging off $q$ and appears in no loop. Retiming cannot help it either — by the register-conservation invariant every loop through $\delta$ still holds exactly one register, so $T_c\ge t_{pd}^{\delta}$ regardless ([[Retiming]]). What Moore *does* change is the arrival time of $z$ at the consumer: $t_{pcq}+t_{pd}^{\lambda}$ from the edge, a fixed quantity, whereas Mealy's is $t_{\text{arrival}}(x)+t_{pd}^{\lambda}$ and therefore depends on the producer of $x$. Cascade two Mealy machines and their $\lambda$ paths chain into one combinational path spanning both; a ring of them has a combinational cycle and has left the synchronous discipline outright. **Moore machines compose without that hazard because no Moore output path crosses a module boundary combinationally** — this, not glitching, is why control FSMs in an [[FSMD Controller-Datapath Split]] are registered by default.

**On FPGA the cost collapses to nothing.** Each LUT in a slice is paired with a flip-flop that is otherwise wasted, so if the design's LUT count already forces $N$ slices, one-hot's extra state flop is free silicon ([[FPGAs]], [[Lookup-Tables]]). Vivado and Quartus both default to one-hot above a small state count, and under one-hot the Moore output decode is a wire from a flop straight to the pin — the ideal case of the timing argument above, with $t_{pd}^{\lambda}=0$ and no glitch window at all. On ASIC the extra flop is a real 20–30 transistor cell and the binary step from $s=2$ to $s=3$ is real area; the trade is worth making anyway wherever the output leaves the island, and worth skipping where the consumer is a flop.

**When it breaks**

- **One cycle on a closed loop is one cycle you cannot pipeline away.** If the output feeds a status/decision loop — handshake `ready`/`valid`, a comparator flag steering the next control decision — Moore's latency enters the loop's iteration bound and the machine really is slower. This is the one case where [[Mealy Machine]] is the correct answer, and it is safe precisely because the consumer there is a flop, not an enable.
- **Registered does not mean synchronised.** A Moore output crossing into another clock domain is glitch-free but still asynchronous to the receiver, and still needs a two-flop synchroniser. Multi-bit Moore outputs crossing together need [[Gray Code State Encoding]] or a handshake; glitch-freedom bounds nothing about simultaneity across bits.
- **$\lambda$ deep enough to matter is possible, just rare.** The claim "$\lambda$ is off the critical path" fails when $z$ feeds another machine's $\delta$ — then $t_{pd}^{\lambda}$ is prepended to that machine's loop delay, and the fix is to register $z$ again or to encode so that $\lambda$ is a wire.
- **The state explosion is $|Q|\cdot|Z|$ in the worst case.** Converting a Mealy machine with a wide output vector by splitting each state per incoming output label is bounded by $|Q|\cdot|Z|$ states, which for an $m$-bit output is $|Q|\cdot 2^m$. For anything wider than a couple of bits, do not convert — register the Mealy output instead and accept the identical one-cycle delay for one flop per bit.
- **Unused codes are a Moore-specific liability under binary.** The extra output-carrying states push $N$ past a power of two more often than Mealy does, and every unused code is a don't-care the tool will use to shrink $\delta$. Mark the register safe or an upset lands somewhere with no defined exit.

**RTL (Spade)**

```spade
enum MooreState { S0, S1, S2, S3, S4 }

entity moore_1011(clk: clock, rst: bool, x: bool) -> bool {
    reg(clk) s reset(rst: MooreState::S0) = match (s, x) {
        (MooreState::S0, false) => MooreState::S0,
        (MooreState::S0, true)  => MooreState::S1,
        (MooreState::S1, false) => MooreState::S2,
        (MooreState::S1, true)  => MooreState::S1,
        (MooreState::S2, false) => MooreState::S0,
        (MooreState::S2, true)  => MooreState::S3,
        (MooreState::S3, false) => MooreState::S2,
        (MooreState::S3, true)  => MooreState::S4,
        (MooreState::S4, false) => MooreState::S2,
        (MooreState::S4, true)  => MooreState::S1,
    };
    match s {
        MooreState::S4 => true,
        _              => false,
    }
}
```

The `match (s, x)` is $\delta$ — one arm per edge of the diagram, ten of them, and Spade's exhaustiveness check *is* the completeness test of [[State Transition Graph]]: a missing $(state, input)$ pair will not compile, so this machine cannot infer a latch. The trailing `match s` is $\lambda$, and its scrutinee is the register alone — the Moore constraint expressed as the absence of `x` from that expression, which is the one thing to check when reading FSM RTL. The output is combinational off the state flops, so it is the "registered in all but name" signal, not a true register output; synthesis will collapse it into the state flops' fanout logic. Emitted Verilog confirms the encoding cost derived above: a 3-bit dense tag compared against `3'd0..3'd4`, three codes unreachable — one-hot is a synthesis attribute away, and only there does $z$ become a bare wire.

Simulated against a four-bit shift-register reference for 3012 vectors: the directed asymmetric sequence $1011011$ (fires twice, one cycle late, confirming overlap handling), the time-reversed $1101$ (must never fire — this is the vector that catches a machine whose chain runs backwards), and 3000 random bits. Moving $z$ one state earlier, to $S_3$, produces 543 mismatches, so the check has teeth.

**Related Notes**

- [[Mealy Machine]] – compares: the same detector with $\lambda$ reading $x$ — one cycle earlier, one state fewer, and every glitch on $x$ reproduced on $z$.
- [[Canonical FSM Structure]] – depends-on: the three-block $\delta$/register/$\lambda$ decomposition this note specialises by fixing $\lambda$'s arity.
- [[D Flip-Flop]] – depends-on: the element inserted between the Mealy product term and the output pin; its $t_{pcq}$ is the whole timing argument.
- [[1011 Sequence Detector]] – extends: the worked five-state machine, its state table, and the cycle-by-cycle trace against Mealy.
- [[One-Hot State Encoding]] – supports: the encoding that makes $\lambda$ a wire and the extra state free on FPGA.
- [[Binary State Encoding]] – counter-example: the encoding where the fifth state costs a whole extra flop and three undefended codes.
- [[Safe-State FSM Recovery]] – supports: what to do about those codes once $N$ is pushed past a power of two.
- [[FSMD Controller-Datapath Split]] – extends: the control FSM registered by default, where the one-cycle latency is absorbed into the schedule.
- [[Synchronous Counters]] – compares: a degenerate Moore machine whose $\lambda$ is the identity and whose $\delta$ is $+1$.
- [[Choosing an FSM Encoding]] – compares: the encoding side of the same trade, once the Moore/Mealy question is settled.

## References

- [[0.4) Synchronous Sequential Logic]] — §Moore (the four consequences of $z=\lambda(q)$), §Trade-offs (the Moore/Mealy table and the pick-Moore-by-default rule), §Worked example → Moore version (five-state table, one-hot equations, the $q_4^{+}=q_3x,\ z=q_4$ comparison), §State minimization (the $P_0$ split on output), §FPGA mapping.
- No book source for this topic. Standard treatments: Mano & Ciletti, *Digital Design*, ch. 5 (Moore vs. Mealy state tables and sequence-detector design); Wakerly, *Digital Design: Principles and Practices*, ch. 7 (output timing, unused-state recovery); Weste & Harris, *CMOS VLSI Design*, ch. 10 (the sequencing constraint the $f_{\max}$ argument rests on). No copy was consulted, so page numbers are deliberately omitted.
