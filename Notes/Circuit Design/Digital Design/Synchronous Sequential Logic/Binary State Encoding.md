---
title: Binary State Encoding
description: "Minimum flop count at ceil(log2 N) bits, paying for it with next-state fan-in that grows as log2 N + k and a separate minimization per state bit."
kind: circuit
source: "No book source — Mano & Ciletti ch. 5.7, Wakerly ch. 7"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, fsm, encoding]
aliases:
  - State Encoding
  - Binary Encoding
  - Binary State Assignment
  - Encoded State Machine
---

# Binary State Encoding

The dense state assignment: number the $N$ states $0\ldots N-1$ and hold that
number in $\lceil\log_2 N\rceil$ flops, the minimum any encoding can use, at the
cost of a next-state function whose every bit reads every state bit.

```tikz title="Binary-encoded Mealy 1011 detector: 2 flops, next-state and output logic"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small, >=stealth]
  % --- input x -------------------------------------------------------------
  \draw[->] (0.0,1.8) -- (1.8,1.8);
  \node[anchor=east] at (0.0,1.8) {$x$ \scriptsize(1)};
  \draw (0.7,1.8) node[circ]{} -- (0.7,3.9);
  \draw[->] (0.7,3.9) -- (9.2,3.9);

  % --- next-state logic ----------------------------------------------------
  \draw (1.8,0.7) rectangle (5.6,2.4);
  \node[align=center] at (3.7,1.9) {next-state $\delta$};
  \node[align=center] at (3.7,1.35) {$s_0^{+}=x$};
  \node[align=center] at (3.7,0.98) {$s_1^{+}=s_0\bar{x}+s_1\bar{s_0}x$};

  % --- state register ------------------------------------------------------
  \draw[->] (5.6,1.55) -- (6.7,1.55);
  \node[anchor=south] at (6.15,1.6) {\scriptsize 2};
  \draw (6.7,0.7) rectangle (8.1,2.4);
  \node[align=center] at (7.4,1.7) {state};
  \node[align=center] at (7.4,1.2) {2 flops};
  \draw[->] (7.4,0.0) -- (7.4,0.7);
  \node[anchor=north] at (7.4,0.0) {\scriptsize clk};

  % --- state bus out and feedback -----------------------------------------
  \draw (8.1,1.55) -- (10.1,1.55);
  \node[anchor=south] at (9.4,1.62) {$s_1s_0$ \scriptsize(2)};
  \draw (8.8,1.55) node[circ]{} -- (8.8,-0.9) -- (1.2,-0.9) -- (1.2,1.15);
  \draw[->] (1.2,1.15) -- (1.8,1.15);

  % --- output logic --------------------------------------------------------
  \draw (9.2,2.8) rectangle (11.4,4.3);
  \node at (10.3,3.55) {$z=s_1\,s_0\,x$};
  \draw (10.1,1.55) -- (10.1,2.4) -- (8.6,2.4) -- (8.6,3.1);
  \draw[->] (8.6,3.1) -- (9.2,3.1);
  \draw[->] (11.4,3.55) -- (12.3,3.55);
  \node[anchor=west] at (12.3,3.55) {$z$ \scriptsize(1)};
\end{circuitikz}
\end{document}
```

**Fix the code and the transition function becomes a truth table.** An encoding
is an injection $\text{enc}: Q \to \{0,1\}^s$; binary picks the identity on the
state's index, so $s = \lceil\log_2 N\rceil$ is forced and is the information-
theoretic floor — $s$ bits can name at most $2^s$ states, so no encoding beats
it. With the code fixed, the state table of the [[State Transition Graph]] *is*
a truth table with $s$ extra input columns, and $\delta$ and $\lambda$ fall out
of it by ordinary two-level minimization on a [[Karnaugh Map]] — one map per
state bit, $s$ independent minimizations, because nothing ties the bits of an
encoded state to each other.

**Count the fan-in, because that is what you bought the flops with.** Each
next-state bit $s_j^{+}$ is in general a function of all $s$ state bits and all
$k$ inputs, so its support is $\lceil\log_2 N\rceil + k$ variables, growing
logarithmically with the state count. The [[One-Hot State Encoding]] pays $N$
flops to make the support of $q_S^{+}$ the in-degree of $S$ plus the condition
width — flat in $N$. That single contrast is the entire encoding decision: binary
minimizes register area and lets $\delta$ grow; one-hot fixes $\delta$ and lets
the register grow. Neither dominates, and the crossover is set by the target
technology, not by the machine.

**Derive the code from the one-hot equations rather than from the table.** For
the Mealy [[1011 Sequence Detector]] with $A=00,\;B=01,\;C=10,\;D=11$ on state
$s_1s_0$, substitute the minterms $q_A=\bar{s_1}\bar{s_0}$, $q_B=\bar{s_1}s_0$,
$q_C=s_1\bar{s_0}$, $q_D=s_1s_0$ into the transcribed one-hot forms:

$$
\begin{aligned}
s_0^{+} &= x\,(q_A+q_B+q_C+q_D) &&\text{$s_0=1$ in }B,D\text{; every state has an }x\text{-edge into one of them}\\
&= x\cdot 1 = x &&\text{one-hot completeness } \textstyle\sum q = 1\\[4pt]
s_1^{+} &= \bar{x}(q_B+q_D) + x\,q_C &&\text{$s_1=1$ in }C,D\\
&= \bar{x}(\bar{s_1}s_0 + s_1s_0) + x\,s_1\bar{s_0}\\
&= \bar{x}s_0(\bar{s_1}+s_1) + x\,s_1\bar{s_0} &&\text{distributivity of AND over OR}\\
&= s_0\bar{x} + s_1\bar{s_0}x &&\text{complement law } \bar{s_1}+s_1=1,\text{ then } y\cdot 1 = y\\[4pt]
z &= s_1s_0x &&\text{the one edge labelled }1/1
\end{aligned}
$$

Every signal here is one bit; the state bus is two. Going through one-hot first
is not a detour — the one-hot equation is a mechanical transcription of incoming
edges, and OR-ing minterms is the standard change of basis into any binary code,
so the only real work is the Boolean simplification, which is where the laws
above earn their names.

> [!note] The code can give a state bit a physical meaning
> $s_0^{+}=x$ is not luck. Under this assignment $s_0=1$ exactly in $B$ and $D$,
> the two states whose defining suffix ends in $1$, so $s_0$ *is* the predicate
> "the previous input bit was $1$" — a one-stage shift register, zero logic. A
> different permutation of the same four codes buys you nothing of the sort. The
> assignment problem is NP-hard precisely because these collapses are visible
> only after minimization.

**Budget the leftover codes.** With $s$ flops there are $2^s$ codes and $N$
states, leaving $2^s-N$ unused — zero when $N$ is a power of two, up to $N-1$
otherwise. The Mealy detector at $N=4$ has none, which is why it is the clean
case; the Moore version at $N=5$ needs 3 flops and leaves 3 dead codes.
Synthesis treats them as don't-cares and spends them simplifying $\delta$, so an
unused code entered by an upset or a reset skew can transition anywhere at all,
including into a closed loop containing no real state. Binary's exposure here is
smaller than one-hot's in absolute terms ($2^s-N$ against $2^N-N$) but is much
harder to *detect*: one-hot illegality is a population count, whereas a binary
code has no in-band invariant to check at all — see [[Safe-State FSM Recovery]].

**On FPGA the flop saving is usually worth nothing.** A slice pairs every
[[Lookup-Tables|LUT]] with a flip-flop that is otherwise wasted, so if LUT count
already forces $N$ slices, the $N-\lceil\log_2 N\rceil$ flops binary saves were
unused silicon. What the fabric does charge for is depth, quantized to LUT
levels: a function of $\le 6$ variables is one LUT6, seven variables is two
levels plus a route between them, and routing dominates. So the metric is
$\lceil(\lceil\log_2 N\rceil + k)/6\rceil$, which crosses from one level to two
at about $N>16$ for $k=2$ — the reason Vivado and Quartus re-encode to one-hot
above a small state count. On ASIC the arithmetic inverts: a flop is 6–10× the
area of a two-input gate and is never free, and a wide static gate is cheap, so
binary is the default and one-hot is the exception you argue for.

$$\boxed{\;s=\lceil\log_2 N\rceil\ \text{flops},\qquad
\operatorname{supp}(\delta_j)\subseteq\{s_0..s_{s-1}\}\cup\{x_0..x_{k-1}\}
\;\Rightarrow\; \text{fan-in} \le \lceil\log_2 N\rceil + k\;}$$

**When it breaks.**

- **$N$ large on FPGA.** Past $\lceil\log_2 N\rceil + k > 6$ the next-state logic
  spills to a second LUT level, doubling the delay of the one loop retiming
  cannot shorten. [[One-Hot State Encoding]] takes over; [[Choosing an FSM Encoding]]
  has the full comparison.
- **A state bus leaving the clock domain.** Multiple bits change per transition,
  so a sampled binary code can land on a value the machine was never in. Use
  [[Gray Code State Encoding]] if the graph is chain-shaped, or synchronize a
  single request bit instead of the state.
- **Non-power-of-two $N$.** The $2^s-N$ don't-cares are consumed silently by
  minimization; recovery logic written against them is unreachable in the model
  and is deleted unless the register carries a safe-FSM attribute.
- **Radiation or safety-critical parts.** Minimum-width codes have Hamming
  distance 1 between adjacent states, so a single upset is a legal, undetectable
  state change. A distance-3 code costs the flops back and forfeits the
  don't-care simplification.
- **The saving is small in absolute terms below $N\approx8$.** Two flops versus
  four is a rounding error in any real design; pick on the $\delta$ depth, not on
  the register.

> [!warning] Not covered in the source — needs outside research
> Which of the $\binom{2^s}{N}N!$ binary assignments is best is left open here.
> The classical heuristics (adjacency-based assignment, KISS/NOVA-style
> constraint generation) and any measured gate-count benefit over an arbitrary
> code are outside both the long-form note and the canon cited below.

**RTL (Spade).**

```spade
// Binary-encoded Mealy 1011 detector. State s = s1 s0 : A=00 B=01 C=10 D=11.
entity detect1011_bin(clk: clock, rst: bool, x: bool) -> bool {
    decl next;
    reg(clk) s: uint<2> reset(rst: 0) = next;

    let b  = s.as_bits();       // [bool; 2], index 0 = LSB
    let s0 = b[0];
    let s1 = b[1];

    let next = [x, (s0 && !x) || (s1 && !s0 && x)].as_uint();
    s1 && s0 && x
}
```

`s` is the two-flop block in the diagram, `next` the wire out of the $\delta$
box, and the returned expression the output box — all three combinational paths
are one expression deep, so the whole design is 2 flops plus 2 LUT6. The array
literal is the encoding made explicit: index 0 is the LSB, so `[x, ...]` puts
$s_0^{+}=x$ in the low bit, and swapping the two elements is exactly the
bit-order bug that compiles clean and fails simulation. `decl next` exists only
because the register is written before its input is defined; it is a forward
declaration, not combinational feedback. Synthesis will not keep `s` as a
literal 2-bit vector if it re-encodes the FSM — on FPGA it will silently convert
to one-hot unless the register carries a `fsm_encoding` attribute.

Simulated with `.zettel/sim.sh`: 3024 vectors, 0 failures — the overlapping
stream $1011011$ firing exactly twice, the reversed pattern $1101$ never firing,
and a 3000-vector random sweep against a three-bit-history reference model.
Swapping the two array elements fails 461 of the same 3024, which is what makes
the pass meaningful.

**Related Notes**

- [[One-Hot State Encoding]] – compares: trades $N$ flops for fan-in that does
  not grow with $N$; the direct alternative at every decision point above.
- [[Gray Code State Encoding]] – extends: same $\lceil\log_2 N\rceil$ width, with
  the assignment constrained to single-bit transitions.
- [[Choosing an FSM Encoding]] – compares: the crossover table this note's
  fan-in count feeds into.
- [[Karnaugh Map]] – depends-on: the per-bit minimization that turns the encoded
  state table into $\delta$.
- [[Lookup-Tables]] – depends-on: LUT input count is what converts fan-in into
  delay, and is the whole FPGA argument.
- [[1011 Sequence Detector]] – supports: the worked machine, encoded both ways.
- [[Safe-State FSM Recovery]] – counter-example: the unused codes this encoding
  minimizes are the ones hardest to detect once entered.
- [[State Transition Graph]] – depends-on: the graph whose node set this encoding
  is a map out of.

## References

No book source. Written from the long-form note `0.4) Synchronous Sequential
Logic` (§ State assignment, § Unreachable and unused states, § FPGA mapping,
§ Trade-offs, § Worked example: overlapping 1011 detector — Mealy version) and
from standard canon:

- Mano & Ciletti, *Digital Design*, ch. 5.7–5.9 — state reduction, state
  assignment, sequence-detector design.
- Wakerly, *Digital Design: Principles and Practices*, ch. 7 — state machine
  structure, unused-state recovery.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — sequencing and the cycle-time
  constraint that makes $\delta$ depth the only thing that matters.
