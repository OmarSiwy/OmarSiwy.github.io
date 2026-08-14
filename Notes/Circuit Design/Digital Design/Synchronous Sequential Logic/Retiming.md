---
title: Retiming
description: "Moving existing registers across gates without changing I/O behaviour, bounded by register conservation around every directed cycle — which is why no retiming makes an FSM faster than its next-state logic."
kind: circuit
source: "0.4) Synchronous Sequential Logic, §Pipelining and retiming; Leiserson & Saxe, Retiming Synchronous Circuitry; Weste & Harris ch. 10; Mano & Ciletti ch. 5"
status: seed
spade: simulated
tags: [digital, synchronous-sequential-logic, retiming, timing, pipelining, fpga]
aliases:
  - Retiming
  - Register Retiming
  - Leiserson-Saxe Retiming
  - Leiserson–Saxe Retiming
  - Iteration Bound
  - Register Balancing
---

# Retiming

**One-line summary:** Retiming relocates the registers a circuit already has across its combinational nodes, and the property that distinguishes it from every other timing transformation is that it changes nothing observable — not the function, not the cycle count, not the latency — because the register count around every directed cycle is invariant under it.

```tikz title="Retiming: a backward move replicates one register onto every input edge, and the register count around a directed cycle is conserved"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]

  % ---------- row 1: the local move, backward across a fan-in-2 node ----------
  \node[anchor=west] at (-2.6,2.6) {\textbf{(a)} backward move $r(g)=+1$: one register out, $|\mathrm{fan\text{-}in}|$ registers in};

  % before
  \draw (0,0.6) rectangle (1.4,2.0);
  \node at (0.7,1.3) {$g$};
  \draw[->] (-1.8,1.75) -- (0,1.75);  \node[anchor=south] at (-1.4,1.8) {$a$};
  \node[anchor=north] at (-1.4,1.72) {$n$};
  \draw[->] (-1.8,0.85) -- (0,0.85);  \node[anchor=south] at (-1.4,0.9) {$b$};
  \node[anchor=north] at (-1.4,0.82) {$n$};
  \draw (2.2,0.9) rectangle (2.7,1.7);
  \node at (2.45,1.3) {\scriptsize R};
  \draw[->] (1.4,1.3) -- (2.2,1.3);
  \draw[->] (2.7,1.3) -- (3.6,1.3);
  \node[anchor=south] at (3.3,1.35) {$y$};
  \node[anchor=north] at (3.3,1.27) {$m$};
  \node[anchor=north] at (1.5,0.45) {\scriptsize $w=1$ on the out-edge, $m$ flops};

  % arrow
  \draw[->,thick] (4.1,1.3) -- (5.3,1.3);
  \node[anchor=south] at (4.7,1.35) {\scriptsize retime};

  % after
  \draw (7.8,0.6) rectangle (9.2,2.0);
  \node at (8.5,1.3) {$g$};
  \draw (6.3,1.4) rectangle (6.8,2.1); \node at (6.55,1.75) {\scriptsize R};
  \draw (6.3,0.5) rectangle (6.8,1.2); \node at (6.55,0.85) {\scriptsize R};
  \draw[->] (5.6,1.75) -- (6.3,1.75); \node[anchor=south] at (5.85,1.8) {$a$};
  \node[anchor=north] at (5.85,1.72) {$n$};
  \draw[->] (5.6,0.85) -- (6.3,0.85); \node[anchor=south] at (5.85,0.9) {$b$};
  \node[anchor=north] at (5.85,0.82) {$n$};
  \draw[->] (6.8,1.75) -- (7.8,1.75);
  \draw[->] (6.8,0.85) -- (7.8,0.85);
  \draw[->] (9.2,1.3) -- (10.4,1.3);
  \node[anchor=south] at (10.0,1.35) {$y$};
  \node[anchor=north] at (10.0,1.27) {$m$};
  \node[anchor=north] at (7.6,0.45) {\scriptsize $w=1$ on both in-edges, $2n$ flops};

  % ---------- row 2: conservation around a directed cycle ----------
  \node[anchor=west] at (-2.6,-0.6) {\textbf{(b)} around any directed cycle the register count $\sum_\ell w$ is invariant};

  \begin{scope}[yshift=-3.1cm]
    % nodes
    \draw (0,0.3) rectangle (1.5,1.3);   \node at (0.75,0.8) {$\delta_1$};
    \draw (3.4,0.3) rectangle (4.9,1.3); \node at (4.15,0.8) {$\delta_2$};
    \draw (6.8,0.3) rectangle (8.3,1.3); \node at (7.55,0.8) {$\delta_3$};
    \node[anchor=north] at (0.75,0.25) {\scriptsize $t_{pd}=3$};
    \node[anchor=north] at (4.15,0.25) {\scriptsize $t_{pd}=2$};
    \node[anchor=north] at (7.55,0.25) {\scriptsize $t_{pd}=2$};

    % forward edges
    \draw (1.5,0.8) -- (2.2,0.8);
    \draw (2.2,0.45) rectangle (2.7,1.15); \node at (2.45,0.8) {\scriptsize R};
    \draw[->] (2.7,0.8) -- (3.4,0.8);
    \node[anchor=south] at (2.45,1.2) {\scriptsize $w=1$};

    \draw[->] (4.9,0.8) -- (6.8,0.8);
    \node[anchor=south] at (5.85,0.85) {\scriptsize $w=0$};
    \node[anchor=north] at (5.85,0.75) {\scriptsize $s$};

    % feedback edge
    \draw (8.3,0.8) -- (8.9,0.8) -- (8.9,-0.9) -- (-0.6,-0.9) -- (-0.6,0.8) -- (0,0.8);
    \draw[->] (-0.05,0.8) -- (0,0.8);
    \node[anchor=south] at (4.15,-0.85) {\scriptsize $w=0$ \; ($s$ bits)};

    \node[anchor=west] at (0.2,-1.75) {$\displaystyle \sum_{\ell} w = 1 \;\Rightarrow\; T_c \ge \frac{3+2+2}{1} = 7\ \mathrm{ns}$, for every legal retiming $r$};
  \end{scope}

\end{circuitikz}
\end{document}
```

*Own construction. Panel (a) is the local move; panel (b) is the invariant that makes the move safe and simultaneously caps what it can buy.*

**Topic:**

**Turn the circuit into a weighted graph so that "moving a register" becomes arithmetic on integers.** Model the design as a directed graph $G = (V, E)$ in which each vertex $v$ is a combinational node with propagation delay $t_{pd}(v)$, and each edge $e : u \to v$ carries an integer weight $w(e) \ge 0$ — the number of registers sitting on that wire. The edge is $n$ bits wide, so $w(e)$ registers on it cost $w(e)\cdot n$ flip-flops; the weight counts *stages*, not flops, and that distinction is the source of most retiming surprises later. A **retiming** is nothing more than an integer labelling $r : V \to \mathbb{Z}$, read as "move $r(v)$ register stages from $v$'s output edges back onto its input edges". The new edge weights are

$$w_r(e) = w(e) + r(v) - r(u), \qquad e : u \to v$$

and the labelling is **legal** exactly when $w_r(e) \ge 0$ for every edge, since a wire cannot carry a negative number of flops. Panel (a) is the single move $r(g) = +1$: one stage leaves the out-edge and one stage appears on *each* in-edge, because the definition applies to every edge incident on $g$ at once and $g$ has two of them. That is not a heuristic rule of thumb, it is what $w_r(e) = w(e) + r(v) - r(u)$ says when $v = g$ is the head of two edges.

**Conservation around a cycle falls out of the labelling by telescoping, and it is the whole theory in one line.** Take any directed cycle $\ell = v_0 \to v_1 \to \cdots \to v_k = v_0$ and sum the retimed weights along it:

$$
\begin{aligned}
\sum_{e \in \ell} w_r(e) &= \sum_{i=0}^{k-1} \big[\, w(e_i) + r(v_{i+1}) - r(v_i) \,\big] \\
&= \sum_{e \in \ell} w(e) \;+\; \sum_{i=0}^{k-1}\big[\,r(v_{i+1}) - r(v_i)\,\big] && \text{associativity and commutativity of }+\\
&= \sum_{e \in \ell} w(e) && \text{telescoping: } v_k = v_0
\end{aligned}
$$

Every vertex on the cycle appears once as a head with $+r$ and once as a tail with $-r$, so the retiming term cancels identically. Structurally, $r$ is a *potential* on the vertices and $w_r - w$ is its gradient; the integral of a gradient around a closed loop is zero, which is the same statement one rung more abstract. The consequence is that **no legal retiming can change the number of register stages in a feedback loop** — it can only slide them around inside it.

**The cycle count is conserved, so the cycle's delay must be shared out among a fixed number of registers, and that is a hard lower bound on $T_c$.** Traverse a cycle $\ell$ once: the signal passes through combinational delay $\sum_{v \in \ell} t_{pd}(v)$ and through $\sum_{e\in\ell} w(e)$ registers, and each register-to-register segment must fit in one clock period. Summing the per-segment constraints over the whole cycle gives $\sum_{v\in\ell} t_{pd}(v) \le T_c \sum_{e\in\ell} w(e)$, hence the **iteration bound**

$$T_c \;\ge\; \max_{\text{cycles } \ell} \frac{\sum_{v\in\ell} t_{pd}(v)}{\sum_{e\in\ell} w(e)}$$

which by the conservation result is the *same number before and after any retiming*. It is a property of the circuit graph, not of where the flops currently sit. Panel (b) shows the canonical case: a three-node loop of total delay $7$ ns holding one register stage is stuck at $T_c \ge 7$ ns whether that register sits between $\delta_1$ and $\delta_2$, between $\delta_2$ and $\delta_3$, or on the feedback edge.

**For an FSM the bound collapses to the delay of the next-state logic, and that is the floor this note exists to name.** In the [[Canonical FSM Structure]] there is exactly one cycle, $q \to \delta \to d \to q$, and it contains exactly one register stage — the $s$-bit state register. The ratio is therefore $t_{pd}^{\delta} / 1$, and **no amount of retiming makes a state machine run faster than its next-state logic**. This is why timing closure on a control-dominated block never improves by asking the tool to retime harder. The escapes are all algorithmic, and all of them change something the retiming was forbidden to change:

- **Restructure $\delta$ itself** — re-encode to cut fan-in ([[One-Hot State Encoding]] flattens the support of each next-state bit to in-degree $+\,k$, independent of $N$; see [[Choosing an FSM Encoding]]), factor one machine into communicating smaller ones, or precompute the transition conditions one cycle early into a flop so that the loop sees only a mux.
- **[[C-Slow Retiming]]** — replace every register with $C$ in series and interleave $C$ independent problem instances. Now $\sum_{e\in\ell} w = C$ and the bound drops by exactly $C\times$, at $C\times$ the latency per instance and only if $C$ independent streams genuinely exist.
- **Split the problem** so that the deep logic is no longer inside the loop at all — the [[FSMD Controller-Datapath Split]], where the arithmetic lives in a feed-forward datapath that [[Pipeline Register Insertion]] *is* allowed to cut.

**Register count is not conserved, and knowing which direction pays is the practical half of the transformation.** Total flop count after retiming is $\sum_e w_r(e)\cdot n_e$; substituting the definition and collecting per vertex, the change is

$$\Delta\text{flops} \;=\; \sum_{v \in V} r(v)\Big( \textstyle\sum_{e \,\text{into}\, v} n_e \;-\; \sum_{e \,\text{out of}\, v} n_e \Big)$$

So a backward move ($r(v) = +1$ in the sign convention above, one stage pulled onto the inputs) pays when the node's total input width is *smaller* than its output width, and costs when it is larger — panel (a) trades $m$ flops for $2n$, a loss whenever $2n > m$, which for an $n$-bit adder node ($m = n+1$) it always is. Minimising $\Delta$flops subject to $w_r \ge 0$ and the period constraints is a min-cost flow problem, the LP dual of the retiming feasibility system; the minimum-period version is solved by binary search over the finitely many candidate periods, testing each with a system of difference constraints $r(u) - r(v) \le c$ that Bellman–Ford settles in one shortest-path pass. Both are Leiserson and Saxe's original results and both are what a synthesis tool actually runs when you enable retiming.

> [!note] Forward retiming preserves the reset state; backward retiming generally cannot
> Push a register *forward* through a node $g$ and the new register's initial value is $g(\text{initial values of the inputs})$ — always computable, always unique. Pull one *backward* and you must solve $g(\text{new initials}) = \text{old initial}$, i.e. invert $g$, and combinational functions are not injective: an AND gate whose output register resets to $0$ has three admissible input pre-images and no principled way to choose. This asymmetry, not any timing consideration, is why tools refuse to retime across flops with a reset they must honour, and why "equivalent initial state" is a separate and harder condition than "equivalent function". A retiming that is legal by $w_r \ge 0$ can still be wrong for the first few cycles after reset.

**On an FPGA the arithmetic changes twice over, once in your favour and once against.** Each slice pairs a LUT with a flip-flop that is otherwise wasted, so the $2n$ flops that panel (a) spends are free as long as the design's LUT count already forced those slices to exist — backward retiming across a wide node is close to costless on FPGA and directly area-negative on ASIC. Against you: **the finest retiming granularity is one LUT, not one gate.** A $\delta$-bit with $\le 6$ inputs is a single LUT6 of roughly $0.1$–$0.3$ ns plus routing, and there is no legal place to put a register inside it, so $t_{pd}$ of that vertex is atomic and the graph is coarse exactly where you most want it fine. Routing, not logic, is what the retimed register has to be inserted around. Hard carry chains are worse still: a chain is a single macro with register taps only at defined points, so the vertex delay of a wide [[Adders]] node cannot be subdivided by retiming at all. Vivado exposes the transformation both as a synthesis option and again in `phys_opt_design -retime`; Quartus as a physical-synthesis option. Both refuse to cross black boxes, DSP and block-RAM macros, and anything carrying `DONT_TOUCH` or `KEEP` — which includes, deliberately, the state register of a [[Safe-State FSM Recovery]] design.

**Result.**

$$\boxed{\ w_r(e) = w(e) + r(v) - r(u) \ge 0 \quad\Longrightarrow\quad \sum_{e\in\ell} w_r(e) = \sum_{e\in\ell} w(e) \quad\Longrightarrow\quad T_c \ge \max_{\ell} \frac{\sum_{v\in\ell} t_{pd}(v)}{\sum_{e\in\ell} w(e)}\ }$$

**When it breaks.**

- **A node is atomic.** Retiming cannot place a register inside a vertex, so the achievable period is also floored by $\max_v t_{pd}(v)$. If one 64-bit comparator is a single node, the cycle-ratio bound is unreachable and the fix is resynthesis — splitting the node — not retiming.
- **A cycle with zero registers has an infinite bound.** $\sum_{e\in\ell} w(e) = 0$ makes the ratio undefined and no legal $r$ can create a stage from nothing; the circuit is a combinational loop and belongs to [[Asynchronous Sequential Logic]], not here.
- **Weight is stages, cost is stages $\times$ width.** Moving a stage off a 1-bit control edge onto a 64-bit data edge is perfectly legal and multiplies the flop cost by 64. The legality condition sees none of this.
- **Initial state.** Backward moves across non-invertible logic do not preserve reset behaviour (see the note above); the retimed circuit agrees with the original only after the pipeline has flushed.
- **Enables, resets and clock gates are edges too.** A flop with a clock enable cannot be retimed unless the enable network is retimed with it, which usually means the tool declines.
- **The I/O boundary must be pinned.** Tie all ports to a single host vertex with $r(\text{host}) = 0$; allow $r(\text{host}) \ne 0$ and the port latency shifts, at which point you have not retimed, you have pipelined — a *different* specification, which is [[Pipeline Register Insertion]].
- **It never helps a shallow machine.** When $t_{pd}^{\delta}$ is already one LUT level, sequencing overhead $t_{pcq} + t_{\text{setup}}$ dominates $T_c$ and retiming has nothing to move that matters.

**RTL (Spade).**

```spade
// Before retiming: combinational node, then one register on its output edge.
entity pre_retime(clk: clock, a: uint<8>, b: uint<8>) -> uint<9> {
    reg(clk) y = a + b;
    y
}

// After retiming r(add) = -1: the register moves backward across the node and
// is REPLICATED onto every input edge. Same latency, same I/O behaviour.
entity post_retime(clk: clock, a: uint<8>, b: uint<8>) -> uint<9> {
    reg(clk) ra = a;
    reg(clk) rb = b;
    ra + rb
}

// The illegal move: only one input edge got a register.
entity bad_retime(clk: clock, a: uint<8>, b: uint<8>) -> uint<9> {
    reg(clk) ra = a;
    ra + b
}
```

`pre_retime` is the left half of panel (a) and `post_retime` the right half, with $n = 8$ and $m = 9$ — the widths are why this particular move is an area loss ($2n = 16$ flops replacing $m = 9$), even though it is the move that shortens the input-to-register path. Both entities are one register stage deep and both are one cycle of latency; the only thing that changed is which side of the `+` the flops sit on, which is the entire content of $w_r(e) = w(e) + r(v) - r(u)$. `bad_retime` is the same move applied to one in-edge instead of all of them, and it is here because it is the failure the definition forbids. What synthesis does differently from the drawing: it is free to undo this, since `post_retime` is exactly the pattern a retiming-enabled tool recognises and rebalances on its own — the source text expresses an intent the back end may legally overrule in either direction.

Simulated against a behavioural one-cycle-delayed reference: 3007 checks (7 named vectors including the asymmetric $1 + 128$ and $128 + 1$ pair, then 3000 random), 0 failures, and `pre_retime` agreed with `post_retime` on every one. The deliberately half-retimed `bad_retime` disagreed with the reference on 2992 of those 3007 checks, which is what gives the test its power: the check is only meaningful because inputs change while the previous result is being observed, so a vector set that holds the operands stable across the sampling edge passes all three entities and proves nothing.

**Related Notes (with context):**

- [[Canonical FSM Structure]] – depends-on: supplies the single-register loop $q \to \delta \to q$ on which this bound evaluates to $t_{pd}^{\delta}$, the floor an FSM cannot retime under.
- [[C-Slow Retiming]] – extends: the one legal way to raise $\sum_{e\in\ell} w$, buying a $C\times$ lower bound at $C\times$ the latency.
- [[Pipeline Register Insertion]] – compares: adds registers to feed-forward paths instead of moving existing ones, so it changes the cycle count and is not behaviour-preserving.
- [[FSMD Controller-Datapath Split]] – extends: moves the deep arithmetic out of the loop entirely, which is what makes pipelining legal where retiming was capped.
- [[Choosing an FSM Encoding]] – supports: re-encoding shrinks $t_{pd}^{\delta}$ itself, the numerator this bound is stuck with.
- [[One-Hot State Encoding]] – supports: the encoding whose next-state support is flat in $N$, and therefore the usual first move once retiming is exhausted.
- [[Safe-State FSM Recovery]] – counter-example: state registers deliberately marked `KEEP`, which excludes them from retiming altogether.
- [[Asynchronous Sequential Logic]] – counter-example: the zero-register cycle, where the iteration bound is undefined and no legal $r$ exists.
- [[Mealy Machine]] – compares: registering $z$ is a forward retiming of the output logic that turns it into a [[Moore Machine]] one cycle late — legal on $\lambda$, never on $\delta$.
- [[FPGAs]] – depends-on: LUT granularity sets the finest vertex the graph can have, and free slice flops set the price of a backward move.
- [[Synchronous Sequential Logic]] – supports: the topic this transformation belongs to.

## References

- `0.4) Synchronous Sequential Logic`, §*Pipelining and retiming* — the backward/forward replication rules, the conservation invariant, the iteration bound as stated, the FSM floor $t_{pd}^{\delta}$, and the two escapes (restructure $\delta$, C-slow).
- `0.4) Synchronous Sequential Logic`, §*FPGA mapping* — free slice flops, LUT-level delay quantisation of roughly $0.1$–$0.3$ ns plus routing, and the $\lceil \text{fan-in}/6 \rceil$ depth metric used here for vertex granularity.
- Leiserson & Saxe, *Retiming Synchronous Circuitry* — the labelling $r : V \to \mathbb{Z}$, the legality condition $w_r \ge 0$, min-period retiming by binary search over candidate periods with a Bellman–Ford feasibility test, and min-area retiming as a min-cost flow.
- Weste & Harris, *CMOS VLSI Design*, ch. 10 — retiming as a sequencing transformation, and the sequencing overhead that makes it pointless on a shallow loop.
- Mano & Ciletti, *Digital Design*, ch. 5 — the canonical FSM whose single-register loop the bound is applied to.

> [!warning] Page numbers and tool option names not verified
> No copy of Weste & Harris or Mano & Ciletti was consulted for this note, and the Leiserson–Saxe result is cited by title; chapter numbering is stable across editions but printed pages are not given because they were not read. The Vivado and Quartus option names are given as vendor-documented feature names, not as verified command syntax for a specific tool version — check them against the release you are on before scripting them.
