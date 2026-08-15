---
title: Multiple Constant Multiplication
description: "One input, several coefficients, one fused adder graph — sharing intermediates that no per-constant optimum would ever reveal ({19,43} in three adders, not five)."
kind: circuit
source: "ASA §12.5.1, pp. 402-406"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, mcm, adder-graph, shift-and-add, fpga]
aliases:
  - MCM
  - Multiple-Constant Multiplication
  - Multiple constant multiplication
  - MCM Adder Graph
---

# Multiple Constant Multiplication

A single shift-and-add graph computing $C_1X,\dots,C_nX$ for one variable input and a fixed coefficient set, minimising adders **across** the coefficients rather than one coefficient at a time.

```tikz title="Three-adder MCM graph computing 19X and 43X from one 8-bit input"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  \node (X) at (0,0) {$X$};
  \node[circle,draw,inner sep=1.5pt] (a1) at (3.0,0) {$+$};
  \node[draw,minimum width=0.9cm,minimum height=0.5cm] (s2b) at (5.4,0) {$\ll 2$};
  \node[circle,draw,inner sep=1.5pt] (a2) at (7.4,0) {$+$};
  \node[draw,minimum width=0.9cm,minimum height=0.5cm] (s1) at (9.4,0) {$\ll 1$};
  \node[circle,draw,inner sep=1.5pt] (a3) at (11.2,0) {$+$};

  \draw[->] (X) -- (a1);
  \draw[->] (a1) -- (s2b);
  \draw[->] (s2b) -- (a2);
  \draw[->] (a2) -- (s1);
  \draw[->] (s1) -- (a3);
  \draw[->] (a3) -- (12.6,0);

  \fill (1.3,0) circle (1.6pt);
  \fill (4.3,0) circle (1.6pt);
  \fill (8.4,0) circle (1.6pt);

  \node[draw,minimum width=0.9cm,minimum height=0.5cm] (s2a) at (2.1,1.5) {$\ll 2$};
  \draw (1.3,0) -- (1.3,1.5);
  \draw[->] (1.3,1.5) -- (s2a);
  \draw (s2a) -- (3.0,1.5);
  \draw[->] (3.0,1.5) -- (a1);

  \draw (1.3,0) -- (1.3,-1.3) -- (7.4,-1.3);
  \draw[->] (7.4,-1.3) -- (a2);
  \node[anchor=west] at (7.55,-0.62) {$-$};

  \draw (4.3,0) -- (4.3,-2.2) -- (11.2,-2.2);
  \draw[->] (11.2,-2.2) -- (a3);

  \draw (8.4,0) -- (8.4,1.5) -- (12.0,1.5);
  \draw[->] (12.0,1.5) -- (12.6,1.5);

  \node[anchor=south] at (0.6,0.08) {$8$};
  \node[anchor=south] at (2.1,1.95) {$X\!\ll\!2$, $10$};
  \node[anchor=south] at (4.35,0.08) {$5X$, $11$};
  \node[anchor=south east] at (8.3,0.28) {$19X$, $13$};
  \node[anchor=south] at (11.9,0.08) {$43X$, $14$};
  \node[anchor=south] at (12.0,1.58) {$19X$, $13$};
  \node[anchor=south] at (5.6,-1.28) {$X$, $8$};
  \node[anchor=south] at (7.6,-2.18) {$5X$, $11$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.19c, p. 403.*

**Separate the operation from its per-coefficient parts.** MCM multiplies one variable $X$ by a set of compile-time constants $T=\{C_1,\dots,C_n\}$ — one input, many outputs. It is the kernel of every fixed-coefficient FIR filter, of the twiddle stage of an FFT, and of a DCT. The naive implementation instantiates one [[Binary Shift-and-Add Constant Multiplier]] per coefficient and pays $\sum_j N_{\mathrm A}^{\mathrm{SCM}}(C_j)$ adders. That is an upper bound and nothing more: an SCM graph reaches its target through *intermediate fundamentals* — odd factors such as $3X$, $5X$, $7X$ that exist only as wires inside the graph — and once several graphs share a substrate, a fundamental built for one coefficient is free for all the others. The problem is therefore not "solve $n$ SCM instances" but "find one directed acyclic adder graph whose node set contains $T$", and since SCM alone is NP-complete, so is this.

**Watch the $\{19,43\}$ optimum escape both obvious constructions.** The individually optimal graphs cost $3+2=5$ two-input adders: $43X$ via $3X=X+(X\!\ll\!1)$, $11X=3X+(X\!\ll\!3)$, $43X=11X+(X\!\ll\!5)$, and $19X$ via that same $3X$ then $19X=3X+(X\!\ll\!4)$ (Fig. 12.19a,b, p. 403). Inspection now spots the shared $3X$ and deletes one adder, giving four — that is resource sharing, and it is the ceiling of what staring at two *finished* graphs can achieve. The true optimum is **three**, and it is invisible from those graphs because it does not contain $3X$ at all. It comes from the observation $43=19\cdot2+5$, i.e. one output built from another output:

$$t_1=X+(X\!\ll\!2)=5X,\qquad t_2=(t_1\!\ll\!2)-X=19X,\qquad t_3=(t_2\!\ll\!1)+t_1=43X$$

Each step is an $\mathcal A$-operation $c_a=\pm2^{s_{\mathrm L}}c_{\mathrm L}\pm2^{s_{\mathrm R}}c_{\mathrm R}$, so correctness is arithmetic identity rather than search: $5\cdot4-1=19$ by distributivity of multiplication over subtraction, and $19\cdot2+5=43$. The middle node subtracts, which on an FPGA carry chain costs exactly what an addition costs and on an ASIC costs one inverter row plus a forced carry-in — see [[Minimum Full-Adder Constant Multiplier]] for why negative intermediates are systematically cheap at the bit level.

**Size each node to its own fundamental, not to the widest output.** For unsigned $X$ of width $w_X$, a node holding $cX$ needs $w_X+\lceil\log_2 c\rceil$ bits. With $w_X=8$: $5X$ is $11$ bits, $19X$ is $13$, $43X$ is $14$, and the shifted operand $X\!\ll\!2$ is $10$. Sizing the shared node to its widest consumer — carrying $5X$ as $14$ bits because $43X$ is $14$ bits — wastes three bits of adder in every stage downstream of it, and the waste compounds along the chain. The shifts themselves are free: they are wiring, no logic and no delay, and the only thing they determine is how far the two operands of each adder overlap, hence how much of that adder is a real full-adder row rather than a pass-through (§12.1.5, p. 381). For signed $X$ the same widths hold with $\lceil\log_2|c|\rceil$ and sign-extension in place of zero-extension, per [[Number Formats]].

**Start every heuristic from the part that is provably optimal.** Both state-of-the-art MCM heuristics open identically. Maintain a *realised set* $R$, initially $\{1\}$, and repeatedly move into $R$ every target of $T$ reachable from $R$ by a single $\mathcal A$-operation, recursing until nothing more moves. If $T$ empties, the solution is optimal by construction — every target cost exactly one adder and no graph can beat that (p. 403). Only when targets remain must a **non-output fundamental** (NOF) be inserted: a node nobody asked for, bought purely to shorten the path to the nodes that were asked for. The $\{19,43\}$ instance never gets that far: $5X$ is one $\mathcal A$-operation from $\{1\}$, $19X$ one from $\{1,5\}$, $43X$ one from $\{1,5,19\}$, so the optimal part alone drains $T$ and the three-adder graph above is *proved* minimal, not merely found.

**Choose the next intermediate by how much it shortens every remaining distance.** $\mathrm H_{\mathrm{cub}}$ (Voronenko & Püschel) defines the $\mathcal A$-distance $\mathrm{dist}(R,t)$ as the minimum number of $\mathcal A$-operations needed to reach $t$ from $R$ — evaluated exactly for topologies up to three adders, estimated beyond — and scores a candidate successor $s$ by its **cumulative** benefit over all surviving targets:

$$B(R,s,t)=\mathrm{dist}(R,t)-\mathrm{dist}(R\cup\{s\},t) \tag{12.41, p. 404}$$

The successor maximising $\sum_{t\in T\setminus R}B(R,s,t)$ joins $R$, the optimal part runs again — usually draining several more targets at once — and the loop repeats until $T$ is empty. The word *cumulative* is the entire design decision: an NOF that halves the distance to one target and does nothing for the rest loses to one that shaves a single adder off four targets.

**Or merge coefficient sets whose difference you already own.** DiffAG (Gustafsson) attacks the same residue from the other side. After the optimal part it builds an undirected complete graph whose nodes are *sets* of coefficients — $N_0=R$, plus one singleton $N_i=\{t_i\}$ per unrealised target — and labels each edge $(i,j)$ with the **difference set** $D_{ij}$ of fundamentals that would let the elements of $N_j$ be computed from those of $N_i$ and vice versa. Whenever some $d_{ij}\in D_{ij}$ already lies in $R$, those two nodes merge for free; when no edge offers that, the least-cost and most frequently occurring difference is realised and merging resumes, until one node remains. Because the state is a partition rather than a frontier, a step costs in the number of coefficient *sets* rather than in coefficient magnitude — which is why DiffAG wins on large target sets with small coefficient word size and $\mathrm H_{\mathrm{cub}}$ wins in the opposite regime (p. 404).

**Make output assignment a decision variable to get the exact answer.** The SCM integer-linear program of [[ILP for Arithmetic Design]] pins one adder to the single target. For MCM that constraint is replaced by a binary $o_{a,j}$ meaning "adder $a$ realises output $j$", with the indicator constraint $C_j=c_a$ whenever $o_{a,j}=1$ (eq. 12.42, p. 405), linearised into the big-$M$ pair $c_a-M+Mo_{a,j}\le C_j\le c_a+M-Mo_{a,j}$ with $M>\max_j(C_j)$. Because $N_{\mathrm A}$ decides how many copies of the constraint block exist, it cannot itself be a variable: the solver is re-invoked with $N_{\mathrm A}$ incremented from a lower bound until the model turns feasible. The bound counts $N_{\mathrm{uq}}$, the positive, odd, unique coefficients — each needs an adder of its own — and adds the cheapest single-coefficient SCM cost, since at least one of them must still be built up from $1$.

**Re-cost the graph the moment throughput forces registers into it.** Minimum adder count is the right objective only for a purely combinational block. Pipeline the graph and registers take over the cost: ASAP-scheduling the $\mathrm H_{\mathrm{cub}}$ solution for $\{23,43\}$ needs nine extra registers, of which five exist only to balance path lengths, whereas RPAG searches directly in the space of *pipelined* adder graphs and returns one with the same adder count and four registers (Fig. 12.20, pp. 405-406). On an FPGA the gap widens further, because each LUT already carries a flip-flop that would otherwise sit idle — pipeline registers are free there and are pure area on an ASIC, so the two targets do not even agree on which graph is better. See [[Pipelined Adder Graph]].

> [!warning] Every adder count on this page is a proxy
> §12.1.5 shows adder count misreports bit-level cost by up to a third for a *single* constant, because shifted operands overlap only partially and the non-overlapping bits degrade to half adders or to wire. The chapter gives no worked bit-level cost model for MCM, deferring it to later work (p. 405).

$$\boxed{\ N_{\mathrm{A,lb,MCM}}=N_{\mathrm{uq}}+\min_{t\in T}\left\lceil\log_2\mathrm{nz}(t)\right\rceil-1\ }$$

with $N_{\mathrm{uq}}$ the number of positive, odd, unique coefficients in $T$ and $\mathrm{nz}(t)$ the nonzero count of $t$'s minimal signed-digit form (eq. 12.43, p. 405).

**When it breaks.**

- **The optimum is not reachable by inspection.** $\{19,43\}$ is the counter-example in miniature: sharing subexpressions between finished SCM graphs gets four adders, the optimum is three, and the gap is a coefficient computed from another coefficient.
- **Exact solving does not scale.** The MCM ILP is practical only for small instances or for producing lower bounds; past that the heuristics are all there is (p. 404).
- **The two heuristics swap places.** Many short coefficients favour DiffAG; few wide ones favour $\mathrm H_{\mathrm{cub}}$. Neither dominates.
- **The objective is wrong once you pipeline.** Minimum-adder and minimum-cost-pipelined solutions differ, and the FPGA/ASIC verdict differs with them.
- **Small $w_X$ hands the win to tables.** Below roughly the LUT input count, [[Table-Based Multiple Constant Multiplication]] gives lower area *and* lower delay on FPGAs.
- **A runtime-variable coefficient set kills it outright.** An adder graph is soldered to one $T$; if the coefficients move, see [[Reconfigurable Constant Coefficient Multiplier]].

**RTL.**

```spade
entity mcm_19_43(x: uint<8>) -> (uint<13>, uint<14>) {
    // 5X = X + (X << 2)
    let x11: uint<11> = zext(x);
    let t5: uint<11> = trunc(x11 + (x11 << 2));

    // 19X = (5X << 2) - X
    let t5_13: uint<13> = zext(t5);
    let x13:   uint<13> = zext(x);
    let t19: uint<13> = trunc((t5_13 << 2) - x13);

    // 43X = (19X << 1) + 5X
    let t19_14: uint<14> = zext(t19);
    let t5_14:  uint<14> = zext(t5);
    let t43: uint<14> = trunc((t19_14 << 1) + t5_14);

    (t19, t43)
}
```

`t5`, `t19`, `t43` are the three adder circles of the diagram in order, and the `zext` lines ahead of each adder are that adder's width annotations, not hardware. Every `<<` has a constant amount and disappears into routing, so the block is three ripple-carry adders deep and nothing else: combinational, no clock, no register, latency one carry chain per stage. The `trunc` calls are exact rather than lossy — each result is bounded by $43\cdot255=10965<2^{14}$, and the subtraction cannot underflow because $20X\ge X$ for unsigned $X$. Synthesis will not build three full-width adders as drawn: the low two bits of the first adder, the low two of the second and the low bit of the third have only one live operand and collapse to wire, which is precisely the bit-level discount that the adder count hides.

**Related Notes**

- [[Minimum-Adder Constant Multiplier]] – depends-on: MCM generalises that problem from one target to a set, reusing its $\mathcal A$-operation and graph enumeration wholesale.
- [[Binary Shift-and-Add Constant Multiplier]] – depends-on: the per-coefficient baseline whose summed cost MCM undercuts.
- [[ILP for Arithmetic Design]] – supports: supplies the SCM model that eq. 12.42's output-selection variable extends.
- [[Sum of Constant Products]] – compares: the transpose operator, many inputs and one output, sharing the same adder graph read backwards.
- [[Constant Matrix Multiplier]] – extends: several inputs *and* several outputs, where two MCM blocks are beaten by optimising the matrix as a unit.
- [[Table-Based Multiple Constant Multiplication]] – compares: shares identical LUT contents instead of intermediate fundamentals, and wins for small $w_X$.
- [[Pipelined Adder Graph]] – extends: re-solves the same graph with registers in the objective.
- [[Ternary-Adder Constant Multiplier]] – extends: swaps the two-input adder node for the three-input node an FPGA carry chain gives away.
- [[Reconfigurable Constant Coefficient Multiplier]] – counter-example: the coefficient set is not fixed, so no single adder graph exists.
- [[LTI Filters]] – supports: the FIR filter is the application that makes a shared coefficient set the common case rather than a curiosity.
- [[Choosing a Constant Multiplier]] – compares: where MCM sits against tables, DSP blocks and plain multipliers.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 12.

- §12.5 generalisations of SCM — MCM, CMM, SOPC, p. 402
- §12.5.1 MCM using shift-and-add, the $\{19,43\}$ example, Fig. 12.19, pp. 402-403
- §12.5.1 RAG-n; $\mathrm H_{\mathrm{cub}}$ optimal part and cumulative benefit, eq. 12.41; DiffAG difference sets, pp. 403-404
- §12.5.1.1 ILP extension, output variable $o_{a,j}$ eq. 12.42, lower bound eq. 12.43, p. 405
- §12.5.1.2 pipelined MCM, ASAP versus RPAG, Fig. 12.20, pp. 405-406
- §12.1.5 bit-level cost of an adder graph, p. 381
