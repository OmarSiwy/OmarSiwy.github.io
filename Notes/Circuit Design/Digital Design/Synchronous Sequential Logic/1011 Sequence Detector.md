---
title: 1011 Sequence Detector
description: "The canonical overlapping pattern detector, built twice: four Mealy states versus five Moore, with the one-hot invariant proved by induction and the binary encoding collapsing one flop into a shift register."
kind: circuit
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic]
aliases:
  - "Sequence Detector"
  - "Overlapping Sequence Detector"
  - "1011 Detector"
---

# 1011 Sequence Detector

A four-state machine that asserts $z$ whenever the last four bits of a serial input were $1011$, overlaps included — so $1011011$ must fire twice, and the edge that makes it fire twice is the only interesting edge in the graph.

```tikz title="Mealy state transition graph for the overlapping 1011 detector"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- states: name = longest prefix of 1011 that is a suffix of the input --
  \draw (0,0)   circle (0.52);
  \node at (0,0.13)   {$A$};   \node[font=\tiny] at (0,-0.24)   {$\varepsilon$};
  \draw (2.8,0) circle (0.52);
  \node at (2.8,0.13) {$B$};   \node[font=\tiny] at (2.8,-0.24) {$1$};
  \draw (5.6,0) circle (0.52);
  \node at (5.6,0.13) {$C$};   \node[font=\tiny] at (5.6,-0.24) {$10$};
  \draw (8.4,0) circle (0.52);
  \node at (8.4,0.13) {$D$};   \node[font=\tiny] at (8.4,-0.24) {$101$};

  % --- reset ---------------------------------------------------------------
  \draw[->,>=latex] (-1.45,0) -- (-0.52,0);
  \node[anchor=east,font=\footnotesize] at (-1.50,0) {reset};

  % --- forward edges: the match extending ----------------------------------
  \draw[->,>=latex] (0.52,0)  -- (2.28,0);
  \node[anchor=south,font=\footnotesize] at (1.40,0.06) {$1/0$};
  \draw[->,>=latex] (3.32,0)  -- (5.08,0);
  \node[anchor=south,font=\footnotesize] at (4.20,0.06) {$0/0$};
  \draw[->,>=latex] (6.12,0)  -- (7.88,0);
  \node[anchor=south,font=\footnotesize] at (7.00,0.06) {$1/0$};

  % --- self loops ----------------------------------------------------------
  \draw[->,>=latex] (-0.34,0.39) .. controls (-0.95,1.40) and (0.95,1.40) .. (0.34,0.39);
  \node[anchor=south,font=\footnotesize] at (0,1.12) {$0/0$};
  \draw[->,>=latex] (2.46,0.39) .. controls (1.85,1.40) and (3.75,1.40) .. (3.14,0.39);
  \node[anchor=south,font=\footnotesize] at (2.8,1.12) {$1/0$};

  % --- D --0--> C : keep the 10 suffix -------------------------------------
  \draw[->,>=latex] (8.22,0.47) .. controls (7.75,1.50) and (6.25,1.50) .. (5.78,0.47);
  \node[anchor=south,font=\footnotesize] at (7.00,1.22) {$0/0$};

  % --- C --0--> A : 100 destroys every partial match -----------------------
  \draw[->,>=latex] (5.32,-0.45) .. controls (4.55,-1.95) and (0.75,-1.95) .. (-0.02,-0.48);
  \node[anchor=north,font=\footnotesize] at (1.35,-1.70) {$0/0$};

  % --- D --1--> B : THE OVERLAP EDGE ---------------------------------------
  \draw[->,>=latex,very thick] (8.46,-0.50) .. controls (8.20,-3.35) and (3.10,-3.35) .. (2.84,-0.50);
  \node[anchor=north,font=\footnotesize] at (5.60,-2.95)
       {$1/\mathbf{1}$\ \ overlap: fire, then keep the trailing $1$};

  % --- legend --------------------------------------------------------------
  \node[anchor=west,font=\footnotesize] at (-1.55,2.15)
       {Mealy: edge label is $x/z$, both 1 bit. State $=$ longest prefix of $1011$ matched so far.};
\end{circuitikz}
\end{document}
```

**Fix the specification as a language before drawing anything.** The input $x$ is 1 bit per clock, the output $z$ is 1 bit, and $z=1$ exactly when the four most recent bits are $1011$. "Overlapping" means the window slides by one bit, not by four: on $1011011$ the windows ending at bit 4 and at bit 7 both match, and both must fire. Nothing here is arithmetic — the machine computes a predicate, so unlike everything in [[Number Formats]] there is no ulp and no rounding to argue about. The only quantity being traded is *which cycle* the answer appears in.

**Name each state after a suffix and the state table writes itself.** Let the state be the longest prefix of $1011$ that is also a suffix of the input seen so far: $A=\varepsilon$, $B=1$, $C=10$, $D=101$. That definition is total — every input string has exactly one such longest prefix — so the four states are complete, and the next state after reading $x$ is determined by recomputing the same quantity on the extended string. This is exactly the Knuth–Morris–Pratt failure function realised in flip-flops, which is why the graph never needs to "back up" over input it has already consumed.

| Present | $x=0$: next / $z$ | $x=1$: next / $z$ | Reasoning for the $x$-branch |
| --- | --- | --- | --- |
| $A$ | $A$ / 0 | $B$ / 0 | a $1$ starts a match |
| $B$ | $C$ / 0 | $B$ / 0 | $11$: keep the last $1$ |
| $C$ | $A$ / 0 | $D$ / 0 | $100$ throws everything away |
| $D$ | $C$ / 0 | $B$ / **1** | match; the trailing $1$ is a fresh prefix |

The $D \xrightarrow{1} B$ edge is the overlap and is the one line a naive design gets wrong. After firing, the string ends in $1011$; its proper suffixes are $011$, $11$, $1$, $\varepsilon$, and the longest of those that is also a prefix of $1011$ is $1$ — hence $B$, not $A$. Restarting at $A$ silently converts the detector into a *non-overlapping* one, which still passes every symmetric test you are likely to invent by hand.

**Transcribe incoming edges to get the one-hot logic.** Under [[One-Hot State Encoding]] the state is four flops $q_A,q_B,q_C,q_D$ with exactly one hot, and the next-state function for a state is the OR over its *incoming* edges, $q_S^{+}=\bigvee q_T c$:

$$
\begin{aligned}
q_A^{+} &= q_A\bar{x} + q_C\bar{x} &&= (q_A+q_C)\,\bar{x} &&\text{distributivity of AND over OR}\\
q_B^{+} &= q_Ax + q_Bx + q_Dx &&= (q_A+q_B+q_D)\,x &&\text{same}\\
q_C^{+} &= q_B\bar{x} + q_D\bar{x} &&= (q_B+q_D)\,\bar{x} &&\text{same}\\
q_D^{+} &= q_Cx &&&&\text{single incoming edge}\\
z &= q_Dx &&&&\text{the one edge labelled }1/1
\end{aligned}
$$

**The one-hot invariant is not an assumption, it is a theorem.** Sum the four next-state functions and use $\sum q = 1$ as the induction hypothesis:

$$
\begin{aligned}
\textstyle\sum q^{+} &= (q_A+q_C)\bar{x} + (q_B+q_D)\bar{x} + (q_A+q_B+q_D)x + q_Cx\\
&= \bar{x}(q_A+q_B+q_C+q_D) + x(q_A+q_B+q_C+q_D) &&\text{commutativity, then distributivity}\\
&= (\bar{x}+x)\cdot 1 &&\text{hypothesis } \textstyle\sum q = 1\\
&= 1 &&\text{complement law } x+\bar{x}=1
\end{aligned}
$$

Exactly one bit hot in, exactly one hot out — by induction from the reset state, forever. The proof is what licenses the OR-of-incoming-edges shortcut: it is only equivalent to the full next-state function while the invariant holds.

**Substituting a binary code collapses one flop into a wire.** Take [[Binary State Encoding]] with $A=00$, $B=01$, $C=10$, $D=11$ over state $s_1s_0$ (2 bits), substitute $q_A=\bar{s_1}\bar{s_0}$, $q_B=\bar{s_1}s_0$, $q_C=s_1\bar{s_0}$, $q_D=s_1s_0$ into the one-hot forms, and simplify:

$$
\begin{aligned}
s_0^{+} &= x\,(q_A+q_B+q_C+q_D) &&\text{$s_0=1$ in }B,D\text{; all four have an }x\text{-edge into one of them}\\
&= x\cdot 1 = x &&\text{one-hot completeness}\\[4pt]
s_1^{+} &= \bar{x}(q_B+q_D) + x\,q_C &&\text{$s_1=1$ in }C,D\\
&= \bar{x}(\bar{s_1}s_0 + s_1s_0) + x\,s_1\bar{s_0}\\
&= \bar{x}s_0(\bar{s_1}+s_1) + x\,s_1\bar{s_0} &&\text{distributivity}\\
&= s_0\bar{x} + s_1\bar{s_0}x &&\text{complement then identity } y\cdot 1=y\\[4pt]
z &= s_1s_0x
\end{aligned}
$$

$s_0^{+}=x$ is not luck. Under this assignment $s_0$ *is* the proposition "the previous input bit was $1$", so that flop has no next-state logic at all — it is a one-stage [[Shift Register LUT]]-style delay, and the detector is a 1-bit history register plus one 3-input function. Total: 2 flops and 2 LUT6 for $\delta+\lambda$, against 4 flops and 5 LUT6 one-hot, both one LUT level deep. At $N=4$ states binary wins outright; the FPGA argument for one-hot only turns over once $\lceil\log_2 N\rceil + k > 6$, i.e. around $N\approx16$ — see [[Choosing an FSM Encoding]].

**Moore buys a glitch-free output for one state, one flop and one cycle.** A [[Moore Machine]] cannot express "$z$ on the edge", so the completed match needs a state of its own: $S_0=\varepsilon$, $S_1=1$, $S_2=10$, $S_3=101$, $S_4=1011$.

| Present | $z$ | $x=0$ | $x=1$ |
| --- | --- | --- | --- |
| $S_0$ | 0 | $S_0$ | $S_1$ |
| $S_1$ | 0 | $S_2$ | $S_1$ |
| $S_2$ | 0 | $S_0$ | $S_3$ |
| $S_3$ | 0 | $S_2$ | $S_4$ |
| $S_4$ | **1** | $S_2$ | $S_1$ |

$S_4$'s two edges are identical to $S_1$'s — after $1011$ the useful suffix is just $1$ — so the pair differs only in output, which is precisely the split that state minimization is forbidden to merge. One-hot:

$$
q_0^{+}=(q_0+q_2)\bar{x},\quad
q_1^{+}=(q_0+q_1+q_4)x,\quad
q_2^{+}=(q_1+q_3+q_4)\bar{x},\quad
q_3^{+}=q_2x,\quad
q_4^{+}=q_3x,\quad
z=q_4
$$

Compare $q_4^{+}=q_3x,\ z=q_4$ against the [[Mealy Machine]] form $z=q_Dx$ with $D\equiv S_3$: it is the *same product term* with a flip-flop inserted between it and the output. **A Moore machine is its Mealy machine with the output logic registered** — one extra flop, one extra state, one extra cycle, zero glitch.

**Read the two machines against the same input and the difference is a shift, not a distortion.** Input $x = 1,0,1,1,0,1,1$; present state is the value held *during* the cycle.

| Cycle | $x$ | Mealy state | Mealy $z$ | Moore state | Moore $z$ |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | $A$ | 0 | $S_0$ | 0 |
| 2 | 0 | $B$ | 0 | $S_1$ | 0 |
| 3 | 1 | $C$ | 0 | $S_2$ | 0 |
| 4 | 1 | $D$ | **1** | $S_3$ | 0 |
| 5 | 0 | $B$ | 0 | $S_4$ | **1** |
| 6 | 1 | $C$ | 0 | $S_2$ | 0 |
| 7 | 1 | $D$ | **1** | $S_3$ | 0 |
| 8 | — | $B$ | 0 | $S_4$ | **1** |

Mealy fires in cycles 4 and 7 — the cycles in which the completing bit is present — and needs no eighth cycle. Moore fires in 5 and 8, and does need one, because a pattern that finished during cycle 7 cannot be reported until cycle 8. Both fire twice, so both handle the overlap; pulse widths and spacings are identical. Reading the one-hot Mealy equations back against cycle 4: $q_D=1$ and $x=1$, so $z=q_Dx=1$ within the cycle, and $q_B^{+}=(q_A+q_B+q_D)x=1$ latches $B$ for cycle 5.

$$\boxed{\ s_0^{+}=x,\qquad s_1^{+}=s_0\bar{x}+s_1\bar{s_0}x,\qquad z=s_1s_0x\ }$$

**When it breaks.**

- **Mealy $z$ is combinational on $x$.** Any glitch or late arrival on $x$ appears on $z$ within the cycle. It is safe only into a flip-flop; feeding it to a clock enable, an asynchronous set, or an output pin exports the hazard. If $x$ crosses a clock domain it must be synchronized *before* this machine, not after.
- **"Overlapping" is a specification, not a default.** Change $D\xrightarrow{1}B$ to $D\xrightarrow{1}A$ and you have a non-overlapping detector that fires once on $1011011$. Both compile; only a test with an overlapping string separates them.
- **Illegal states scale with the encoding, not the machine.** Binary uses all four codes of 2 bits, so it cannot lock up. One-hot over 5 Moore states leaves $2^5-5=27$ unreachable codes, every one of which needs [[Safe-State FSM Recovery]] before the design goes near a radiation or noise budget.
- **Long patterns invert the argument.** For a pattern of length $L$ the FSM costs $\lceil\log_2 L\rceil$ flops but a next-state function whose fan-in grows with it, while a plain $L$-bit shift register plus an $L$-input AND costs $L$ flops and *zero* next-state logic — one LUT level for $L\le 6$ on FPGA. Past roughly $L=8$ the shift-register-and-compare form is smaller in logic and strictly faster; the FSM only wins back when the pattern is a set of patterns or carries don't-cares.
- **One bit per cycle is baked in.** At two or more input bits per clock the state is no longer "longest matched prefix" alone and the whole construction restarts as a multi-window match.

```spade
enum St { A, B, C, D }

entity mealy1011(clk: clock, rst: bool, x: bool) -> bool {
    decl next;
    reg(clk) s reset(rst: St::A) = next;
    let next = match (s, x) {
        (St::A, false) => St::A,   (St::A, true) => St::B,
        (St::B, false) => St::C,   (St::B, true) => St::B,
        (St::C, false) => St::A,   (St::C, true) => St::D,
        (St::D, false) => St::C,   (St::D, true) => St::B,
    };
    match (s, x) { (St::D, true) => true, _ => false }
}

entity mealy1011_bin(clk: clock, rst: bool, x: bool) -> bool {
    reg(clk) s0 reset(rst: false) = x;
    reg(clk) s1 reset(rst: false) = (s0 && !x) || (s1 && !s0 && x);
    s1 && s0 && x
}

enum M { S0, S1, S2, S3, S4 }

entity moore1011(clk: clock, rst: bool, x: bool) -> bool {
    decl next;
    reg(clk) s reset(rst: M::S0) = next;
    let next = match (s, x) {
        (M::S0, false) => M::S0,   (M::S0, true) => M::S1,
        (M::S1, false) => M::S2,   (M::S1, true) => M::S1,
        (M::S2, false) => M::S0,   (M::S2, true) => M::S3,
        (M::S3, false) => M::S2,   (M::S3, true) => M::S4,
        (M::S4, false) => M::S2,   (M::S4, true) => M::S1,
    };
    match s { M::S4 => true, _ => false }
}
```

`mealy1011` is the graph above transcribed literally — `s` is the circle, the `match` is the edge set, the output `match` is the single $1/1$ label. `mealy1011_bin` is the boxed result instead: `s0` is the wire with no logic on it ($s_0^{+}=x$), `s1` is the one 3-input function, and both are 1 bit, so the whole detector is 2 flops. All three are registered state with a combinational output; `moore1011`'s output reads `s` only, so it is glitch-free by construction while both Mealy outputs are not. Synthesis will not respect the encoding as drawn: FSM extraction re-encodes the `enum` on its own cost model (`fsm_encoding` on AMD, `SYNCHRONIZER`-style attributes aside), so `mealy1011` and `mealy1011_bin` routinely converge to the same two flops after mapping — the difference the source code carries is readability, not silicon.

Simulation is what separates this from an FSM skeleton, because a wrong answer is possible here in three independent ways: a mis-transcribed edge, a mis-simplified Boolean equation, and a wrong overlap rule. All three entities were driven from one behavioural reference — $z_t = [x_{t-3}x_{t-2}x_{t-1}x_t = 1011]$ for Mealy, and its one-cycle delay for Moore — over 3000 random bits plus six directed strings, including the asymmetric $1011011$ (must fire exactly twice), the bit-reversed $1101$ and $0110$ (must never fire), and $10111011$. Mutating `(St::D, true) => St::A` or dropping the $x$ from the second product term of $s_1^{+}$ makes the directed strings fail immediately, which is the evidence the check has teeth.

**Related Notes**

- [[Mealy Machine]] – depends-on: the output-on-the-edge form that gives the four-state version and the combinational $z$.
- [[Moore Machine]] – compares: the same detector one cycle later, glitch-free, for one extra state and one extra flop.
- [[One-Hot State Encoding]] – supports: the encoding whose incoming-edge transcription produced the equations, plus the invariant proved above.
- [[Binary State Encoding]] – supports: the substitution that collapses $s_0$ into a bare delay and halves the flop count.
- [[Shift Register LUT]] – extends: what $s_0$ is a one-stage instance of, and the structure that beats this FSM outright for long patterns.
- [[State Transition Graph]] – depends-on: the notation the diagram is drawn in.
- [[Choosing an FSM Encoding]] – compares: where $N=4$ sits on the binary-versus-one-hot crossover.
- [[Safe-State FSM Recovery]] – extends: what to do about the 27 illegal codes the one-hot Moore version leaves behind.

## References

No book source. Written from standard digital-design canon:

- Mano & Ciletti, *Digital Design*, ch. 5 (state tables and graphs, Moore versus Mealy) and §5.7–5.9 (state reduction, state assignment, sequence-detector design).
- Wakerly, *Digital Design: Principles and Practices*, ch. 7 (state-machine structure, Mealy output timing and hazards, unused-state recovery).
- Weste & Harris, *CMOS VLSI Design*, ch. 10 (sequencing) and §1.4 (FSMD control/datapath split).
- Knuth, Morris & Pratt, "Fast Pattern Matching in Strings", *SIAM J. Comput.* 6 (1977) — the failure function the state naming implements.
