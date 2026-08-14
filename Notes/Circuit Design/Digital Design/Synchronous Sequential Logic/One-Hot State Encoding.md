---
title: "One-Hot State Encoding"
description: "One flop per state, next-state equation transcribed straight from incoming edges, giving fan-in equal to in-degree and therefore flat in N — the reason FPGA tools default to it above ~16 states."
kind: circuit
source: "0.4) Synchronous Sequential Logic §State assignment, §FPGA mapping, §Worked example — no book source"
status: seed
spade: simulated
tags: [digital, fsm, state-encoding, one-hot, fpga]
aliases:
  - One-Hot Encoding
  - One-Hot State Assignment
  - One-Hot FSM
  - One-Hot
---

# One-Hot State Encoding

A state assignment that spends one flip-flop per state and keeps exactly one of them set, so that each next-state equation reads off a single state's incoming edges and its fan-in never grows with the state count.

```tikz title="One-hot next-state logic of a 4-state Mealy machine: one flop per state, each fed by an OR of its incoming edges ANDed with the edge condition"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---------- row A : q_A^+ = (q_A + q_C) xbar ----------
  \node[or port] (oA) at (1.9,6.2) {};
  \node[anchor=east] at (0.15,6.45) {$q_A$};
  \node[anchor=east] at (0.15,5.95) {$q_C$};
  \draw (0.3,6.45) -- (oA.in 1);
  \draw (0.3,5.95) -- (oA.in 2);
  \node[and port] (aA) at (4.4,6.45) {};
  \draw (oA.out) -- ++(0.25,0) |- (aA.in 1);
  \draw (2.95,6.2) -- (aA.in 2);
  \node[anchor=east] at (2.9,6.2) {$\bar{x}$};

  % ---------- row B : q_B^+ = (q_A + q_B + q_D) x ----------
  \node[or port] (oB1) at (0.9,4.6) {};
  \node[anchor=east] at (-0.85,4.85) {$q_A$};
  \node[anchor=east] at (-0.85,4.35) {$q_B$};
  \draw (-0.7,4.85) -- (oB1.in 1);
  \draw (-0.7,4.35) -- (oB1.in 2);
  \node[or port] (oB2) at (2.5,4.2) {};
  \draw (oB1.out) -- ++(0.25,0) |- (oB2.in 1);
  \node[anchor=east] at (0.95,3.95) {$q_D$};
  \draw (1.0,3.95) -- (oB2.in 2);
  \node[and port] (aB) at (4.4,4.45) {};
  \draw (oB2.out) -- ++(0.05,0) |- (aB.in 1);
  \node[anchor=south] at (3.42,4.26) {$x$};

  % ---------- row C : q_C^+ = (q_B + q_D) xbar ----------
  \node[or port] (oC) at (1.9,2.2) {};
  \node[anchor=east] at (0.15,2.45) {$q_B$};
  \node[anchor=east] at (0.15,1.95) {$q_D$};
  \draw (0.3,2.45) -- (oC.in 1);
  \draw (0.3,1.95) -- (oC.in 2);
  \node[and port] (aC) at (4.4,2.45) {};
  \draw (oC.out) -- ++(0.25,0) |- (aC.in 1);
  \draw (2.95,2.2) -- (aC.in 2);
  \node[anchor=east] at (2.9,2.2) {$\bar{x}$};

  % ---------- row D : q_D^+ = q_C x ----------
  \node[and port] (aD) at (4.4,0.45) {};
  \node[anchor=east] at (2.9,0.7) {$q_C$};
  \draw (2.95,0.7) -- (aD.in 1);
  \draw (2.95,0.2) -- (aD.in 2);
  \node[anchor=east] at (2.9,0.2) {$x$};

  % ---------- the four state flops ----------
  \foreach \y/\lab in {6/{$q_A$}, 4/{$q_B$}, 2/{$q_C$}, 0/{$q_D$}} {
    \draw (5.7,\y) rectangle (7.5,\y+0.9);
    \node at (6.75,\y+0.45) {\lab};
    \node[anchor=west] at (5.75,\y+0.75) {\tiny D};
    \draw (5.7,\y+0.05) -- (6.02,\y+0.2) -- (5.7,\y+0.35);
    \draw (5.35,\y+0.2) -- (5.7,\y+0.2);
    \draw[->] (7.5,\y+0.45) -- (8.5,\y+0.45);
  }
  \draw[->] (aA.out) -- (5.7,6.45);
  \draw[->] (aB.out) -- (5.7,4.45);
  \draw[->] (aC.out) -- (5.7,2.45);
  \draw[->] (aD.out) -- (5.7,0.45);
  \node[anchor=west] at (8.55,6.45) {$q_A$ \; 1 bit};
  \node[anchor=west] at (8.55,4.45) {$q_B$ \; 1 bit};
  \node[anchor=west] at (8.55,2.45) {$q_C$ \; 1 bit};
  \node[anchor=west] at (8.55,0.45) {$q_D$ \; 1 bit};

  % ---------- clock rail ----------
  \draw (5.35,-1.0) -- (5.35,6.2);
  \node[anchor=north] at (5.35,-1.05) {clk};

  % ---------- Mealy output ----------
  \node[and port] (az) at (10.9,-1.3) {};
  \node[anchor=east] at (9.2,-1.05) {$q_D$};
  \draw (9.25,-1.05) -- (az.in 1);
  \draw (9.25,-1.55) -- (az.in 2);
  \node[anchor=east] at (9.2,-1.55) {$x$};
  \draw[->] (az.out) -- ++(0.9,0) node[anchor=west] {$z$ \; 1 bit};

  % ---------- annotations ----------
  \node[anchor=west] at (-1.5,7.6)
    {$q_S^{+}=\bigvee_{(T,c)\to S} q_T\,c$ : one flop per state, fan-in $=$ in-degree $+\,k$, flat in $N$};
  \node[anchor=west] at (-1.5,-2.4)
    {state bus $(q_A,q_B,q_C,q_D)$: 4 bits, exactly one hot; every $q$ on the left is the flop of the same name};
  \node[anchor=west] at (-1.5,-3.0)
    {reset drives $q_A\!\leftarrow\!1$, $q_B,q_C,q_D\!\leftarrow\!0$ --- the invariant $\sum q=1$ is established, never checked};

\end{circuitikz}
\end{document}
```

**Transcribe incoming edges, not the state table.** For a machine with state set $Q$, $|Q|=N$, and input $x$ of $k$ bits, the code is $\text{enc}: Q \to \{0,1\}^N$ with $\text{enc}(S)$ the indicator vector of $S$; the state register is $N$ bits wide and each $q_S$ is 1 bit. Because $q_S = 1$ exactly when the machine is in $S$, the next-state function of that one bit is the disjunction over the edges that *arrive* at $S$:

$$q_S^{+} \;=\; \bigvee_{(T,\,c)\;\to\;S} q_T \cdot c$$

with $c$ the input condition labelling the edge, a function of the $k$-bit $x$ only. Nothing here mentions the other $N-1$ states except through the specific $q_T$ that can reach $S$, so the fan-in of the cone feeding $q_S$'s D input is $\text{indeg}(S) + \text{width}(c)$ — bounded by the [[State Transition Graph]], never by $N$. That single sentence is the entire case for the encoding: as the machine grows, [[Binary State Encoding]]'s fan-in grows as $\lceil\log_2 N\rceil + k$ while this one does not grow at all.

**Count the total logic, not just the depth.** Each edge contributes exactly one product term to exactly one equation, so summing over states gives $\sum_{S} \text{indeg}(S) = |E|$: the whole of $\delta$ is $|E|$ AND terms and $N$ OR trees, *linear in the graph you drew*. This is why one-hot equations need no Karnaugh map and no minimiser — the transcription is already a minimal sum of products in the sense that no product covers two edges. Binary offers no such guarantee: substituting $q_S$ by a conjunction of $\lceil\log_2 N\rceil$ literals turns each of those products into a wider cube, and the $\lceil\log_2 N\rceil$ output bits must then be minimised separately, each as a function of all state bits plus $x$.

**Prove the invariant rather than enforcing it.** The encoding rests on $\sum_S q_S = 1$, and that is a *theorem about the recurrence*, not a circuit that has to be built. Sum the four next-state functions of the 4-state [[1011 Sequence Detector]] drawn above ($A=\varepsilon$, $B=1$, $C=10$, $D=101$, $k=1$):

$$
\begin{aligned}
\textstyle\sum q^{+} &= (q_A+q_C)\bar{x} + (q_B+q_D)\bar{x} + (q_A+q_B+q_D)x + q_Cx\\
&= \bar{x}(q_A+q_B+q_C+q_D) + x(q_A+q_B+q_C+q_D) &&\text{commutativity, then distributivity of AND over OR}\\
&= (\bar{x}+x)\cdot 1 &&\text{induction hypothesis } \textstyle\sum q = 1\\
&= 1 &&\text{complement law } x+\bar{x}=1
\end{aligned}
$$

The middle step is where completeness of the [[State Transition Graph]] pays: every state has an outgoing edge for each of the $2^k$ input combinations, so each $q_T$ appears under every literal of $x$, and the sum factors. The base case is the reset value, which is why **reset is part of the encoding, not housekeeping** — an all-zeros reset, the reflex from binary, leaves $\sum q = 0$ and the machine dead forever. Exactly one bit hot in, exactly one hot out, from $q_{S_0}=1$ onwards.

**Read the mutual exclusion off the same invariant.** At most one $q_T$ is 1, and determinism makes the conditions on one state's outgoing edges disjoint, so at most one product term in any $q_S^{+}$ is asserted at a time. The OR is therefore a 1-of-$n$ *selector*, not a general cover, and the AND-OR pair is the natural [[Multiplexers|multiplexer]] structure rather than an arbitrary two-level function — which is what lets a synthesiser map it to a carry-chain OR or a wide-OR primitive without checking anything.

**Output logic collapses to a wire.** A [[Moore Machine]] output that is asserted in states $S \in Z$ is $z = \bigvee_{S\in Z} q_S$, and for the common case $|Z|=1$ it is literally the flop's Q pin: zero logic, zero delay, and glitch-free because it is a register output. The [[Mealy Machine]] output costs one AND: in the diagram, $z = q_D\,x$, one product for the one edge labelled $1/1$. Under binary the same $z$ is $s_1s_0x$ — a decode of the state code before the useful term appears, and that decode grows with $\lceil\log_2 N\rceil$.

> [!important] "Flat in $N$" is a statement about in-degree, not about one-hot.
> A state that everything can jump to — an error sink, an abort, an idle state reachable from anywhere — has $\text{indeg} = N-1$, and its equation is the OR of the entire state bus. One-hot has not removed the wide gate, it has *localised* it: $N-1$ of the $N$ equations are still narrow, and only the sink pays. Binary spreads that same cost across every bit of $\delta$. Check the in-degree histogram of the graph before quoting the flat-fan-in claim.

**The crossover is a LUT-level count.** On an FPGA a $\delta$-bit with $\le 6$ inputs is one LUT6, roughly $0.1$–$0.3$ ns plus routing; a 7-input function is two levels plus a route between them, which more than doubles the delay because routing dominates ([[Lookup-Tables]]). The metric is therefore $\lceil \text{fan-in}/6 \rceil$ levels, not literal gate count. Binary crosses 6 inputs when $\lceil\log_2 N\rceil + k > 6$, i.e. at $N > 16$ for $k=2$; one-hot's typical in-degree of 3–5 keeps a 64-state machine at one LUT level per state bit. Vivado and Quartus both default to one-hot and re-encode automatically above a small state count for exactly this reason. The flop cost that looks damning on paper is also mostly imaginary there: an FPGA slice pairs every LUT with a flip-flop that is otherwise wasted, so if the design's LUT count already forces $N$ slices, one-hot's $N$ flops are free and binary's saving of $N - \lceil\log_2 N\rceil$ flops buys unused silicon ([[FPGAs]]).

**On ASIC the arithmetic reverses.** A flop is 6–10 transistors more than a gate and is never free, so $N$ flops against $\lceil\log_2 N\rceil$ is a real area and clock-power bill — every one of the $N$ flops toggles the clock tree whether or not the state moves. Depth is continuous rather than quantised in sixes, so binary's wider fan-in costs a fraction of a gate delay instead of a whole extra level plus a route. Pick binary for ASIC unless $\delta$ is genuinely the critical path; the one-hot rewrite is then a targeted fix for [[Retiming|the iteration bound]], since no retiming can make an FSM faster than its own $\delta$.

**Pay for it in the code space.** With $N$ flops there are $2^N$ codes and $N$ legal ones, so $2^N - N$ codes are unused — nearly the entire space, against at most $N-1$ unused codes for binary. Synthesis treats them as don't-cares and uses them to simplify $\delta$, which is precisely why an illegal code, once entered by an upset or a reset that misses a flop, can transition anywhere at all, including into a closed loop containing no legal state. The decoded check $\text{legal} = \big(\bigvee_S q_S\big) \wedge \neg\bigvee_{S \ne T}(q_S q_T)$ costs $O(N^2)$ pairwise terms — the price of the sparse code, and the subject of [[Safe-State FSM Recovery]].

$$\boxed{\ q_S^{+} = \bigvee_{(T,\,c)\to S} q_T\,c \quad\Longrightarrow\quad \text{fan-in}(q_S^{+}) = \text{indeg}(S) + k,\qquad |\delta| = |E| \text{ products},\qquad \textstyle\sum_S q_S = 1\ }$$

**When it breaks**

- **Small $N$.** On the 4-state machine above, binary needs 2 flops and 2 LUT6 against one-hot's 4 flops and 5 LUT6, both one LUT level deep — binary wins outright and the encoding argument is pure overhead. The crossover on FPGA is around $N \approx 16$ for $k=2$; below it, use whatever reads better.
- **A dense graph.** The flat-fan-in claim is $\text{indeg} + k$, so a machine whose states are mutually reachable ($|E| \sim N^2$) has one-hot equations as wide as the state bus and $|E|$ product terms in total. One-hot is a bet that the transition graph is sparse, which most control FSMs are and most *decoders* are not.
- **A wide condition.** $k$ enters every equation additively. A transition guarded by an 8-bit comparison already exceeds a LUT6 on its own, and the fix is not the encoding but registering the condition one cycle early ([[FSMD Controller-Datapath Split]]).
- **The state bus leaving the module.** $N$ bits crossing a clock domain is $N$ chances to be sampled mid-transition, and one-hot changes *two* bits per step, so the sampled word can be all-zero or two-hot. [[Gray Code State Encoding]] is the encoding for that job; one-hot is for $\delta$'s depth and nothing else.
- **Manual state minimisation afterwards.** Merging equivalent states saves one flop each under one-hot instead of shrinking a $\lceil\log_2 N\rceil$-wide register, and it can *lengthen* $\delta$ by concentrating in-degree on the surviving state. Minimise to expose don't-cares, not reflexively.

**RTL (Spade)**

```spade
entity onehot_1011(clk: clock, rst: bool, x: bool) -> bool {
    decl q_next;
    reg(clk) q: [bool; 4] reset(rst: [true, false, false, false]) = q_next;
    let q_next: [bool; 4] = [
        (q[0] || q[2]) && !x,        // q_A+ = (q_A + q_C) !x
        (q[0] || q[1] || q[3]) && x, // q_B+ = (q_A + q_B + q_D) x
        (q[1] || q[3]) && !x,        // q_C+ = (q_B + q_D) !x
        q[2] && x                    // q_D+ = q_C x
    ];
    q[3] && x                        // z = q_D x  (Mealy)
}
```

`q` is the four flop boxes of the diagram and `q_next` the four AND outputs feeding their D pins; `decl` is needed only because the register is written above the logic that drives it. The array *is* the encoding — an `enum FsmState { A, B, C, D }` would compile to the same behaviour but hand the choice of code to the synthesiser, which is the one decision this note exists to take back. Element 0 of a `[bool; N]` packs into the LSB, so the emitted Verilog register is the 4-bit bus $q_Dq_Cq_Bq_A$; the reset value `[true, false, false, false]` is the base case of the invariant proof above, and writing `[false; 4]` there is the dead-machine bug. Everything is combinational except the one register, and synthesis will collapse each OR-AND pair into a single LUT6 — the two-level drawing is a delay model, not a netlist.

Simulated against a behavioural reference (`z = (last three inputs == 101) && x`) for **3035 vectors**: the overlapping sequence $1011011$ firing exactly twice, the time-reversed $1101$ firing never, back-to-back and saturated runs, then 3000 random bits. Deleting the $q_D$ term from $q_B^{+}$ — the overlap edge — makes the reference disagree on the second match, which is the check the named vectors exist to force.

**Related Notes**

- [[Binary State Encoding]] – compares: the same machine at $\lceil\log_2 N\rceil$ flops and $\lceil\log_2 N\rceil + k$ fan-in, the direct trade against this one.
- [[Choosing an FSM Encoding]] – compares: where this sits against binary, Gray and the hybrids, with the crossover conditions.
- [[Gray Code State Encoding]] – counter-example: one bit per transition instead of two, which is what a state bus crossing a clock domain needs and this encoding cannot give.
- [[State Transition Graph]] – depends-on: in-degree and completeness, the two graph properties the fan-in bound and the invariant proof rest on.
- [[Safe-State FSM Recovery]] – extends: what to do about the $2^N - N$ illegal codes this encoding creates.
- [[1011 Sequence Detector]] – supports: the worked machine whose table the equations above transcribe.
- [[Mealy Machine]] – supports: the $z=q_Dx$ output form; [[Moore Machine]] – supports: the case where the output is a bare flop pin.
- [[Lookup-Tables]] – depends-on: the six-input quantisation of depth that sets the crossover; [[FPGAs]] – supports: the free-flop-per-LUT argument.
- [[Canonical FSM Structure]] – depends-on: the $\delta$/$\lambda$/register decomposition this encoding chooses a code for.

## References

- [[0.4) Synchronous Sequential Logic]] — §State assignment (the transcription rule and the fan-in argument), §FPGA mapping (LUT-level quantisation, the crossover at $N\approx16$, free flops), §Unreachable and unused states (the $2^N-N$ code space and the decoded legality check), §Worked example: overlapping 1011 detector — Mealy version (the four equations, the invariant sum, the binary comparison).
- No textbook source for this topic. Standard canon: Mano & Ciletti, *Digital Design*, ch. 5 (state assignment, sequence-detector design); Wakerly, *Digital Design: Principles and Practices*, ch. 7 (one-hot machines, unused-state recovery); Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequencing and the flop cost that reverses the argument on ASIC). Page numbers are deliberately omitted — no copy was consulted for this note.
