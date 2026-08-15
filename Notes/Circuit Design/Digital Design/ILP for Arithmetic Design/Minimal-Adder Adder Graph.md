---
title: "Minimal-Adder Adder Graph"
description: "The shift/add/subtract DAG an ILP feasibility solve returns for a single constant, e.g. 93X in two adders against three for CSD; proven minimal, but only up to ~20-bit constants before the run-time wall."
kind: circuit
source: "ASA §12.1.4, pp. 373-378; §12.1.5-12.1.6, pp. 378-382"
status: seed
spade: simulated
tags: [digital, ilp-for-arithmetic-design, constant-multiplication, scm, adder-graph, fpga]
aliases:
  - Adder Graph
  - Adder Graphs
  - SCM Adder Graph
  - Minimal-Adder Constant Multiplication
  - Minimal-Adder SCM
---

# Minimal-Adder Adder Graph

A directed acyclic graph of shifts, additions and subtractions computing $CX$ for one constant $C$, whose node count is not merely small but *proven* smallest, because it is the first $N_\mathrm{A}$ for which an ILP feasibility problem admits any solution at all.

```tikz title="Minimal-adder graph for 93X: two adders, shifts 1 and 5, one negated input, annotated with the ILP decision variables that encode it"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex]
\footnotesize
% ---- input node, c_0 = 1
\node (x) at (0,0.5) {$X$};
\node[anchor=west,font=\tiny] at (0.28,0.5) {$c_0=1$};
\draw[->] (0,0.2) -- (0,-0.5);
\node[anchor=west,font=\tiny] at (0.1,-0.15) {$w$};
\draw (-2.0,-0.5) -- (2.0,-0.5);
% ---- adder 1 : 3X = 2X + X
\node[draw,circle,inner sep=1.5pt] (a1) at (0,-2.1) {$+$};
\draw (-2.0,-0.5) -- (-2.0,-2.1);
\draw[->] (-2.0,-2.1) -- (a1);
\draw ( 2.0,-0.5) -- ( 2.0,-2.1);
\draw[->] ( 2.0,-2.1) -- (a1);
\node[anchor=south,font=\tiny] at (-1.25,-2.03) {$\ll 1$};
\node[anchor=south,font=\tiny] at ( 1.25,-2.03) {$\ll 0$};
\node[anchor=north,font=\tiny] at (-1.25,-2.17) {$w{+}1$};
\node[anchor=north,font=\tiny] at ( 1.25,-2.17) {$w$};
% ---- fan-out of 3X
\draw[->] (0,-2.4) -- (0,-3.1);
\node[anchor=west,font=\tiny] at (0.12,-2.6) {$c_1=3$ \ $(3X)$};
\node[anchor=east,font=\tiny] at (-0.12,-2.78) {$w{+}2$};
\draw (-2.0,-3.1) -- (2.0,-3.1);
% ---- adder 2 : 93X = 32*3X - 3X
\node[draw,circle,inner sep=1.5pt] (a2) at (0,-4.7) {$+$};
\draw (-2.0,-3.1) -- (-2.0,-4.7);
\draw[->] (-2.0,-4.7) -- (a2);
\draw ( 2.0,-3.1) -- ( 2.0,-4.7);
\draw[->] ( 2.0,-4.7) -- (a2);
\node[anchor=south,font=\tiny] at (-1.25,-4.63) {$\ll 5$};
\node[anchor=south,font=\tiny] at ( 1.35,-4.63) {$\ll 0$};
\node[anchor=north,font=\tiny] at (-1.25,-4.77) {$w{+}7$};
\node[anchor=north,font=\tiny] at ( 1.35,-4.77) {$w{+}2$};
\node[font=\small] at (0.62,-4.52) {$-$};
\node[anchor=west,font=\tiny] at (0.12,-5.2) {$c_2=93$};
\draw[->] (0,-5.0) -- (0,-5.8) node[below,font=\small] {$93X$};
\node[anchor=east,font=\tiny] at (-0.12,-5.38) {$w{+}7$};
% ---- decision variables that encode each node
\node[anchor=west,font=\tiny,align=left,inner sep=2pt] at (2.7,-2.1)
  {adder 1\\[1pt]
   $c_{1,\mathrm L,0}=c_{1,\mathrm R,0}=1$\\[1pt]
   $\varphi_{1,\mathrm L,1}=1,\ \varphi_{1,\mathrm R,0}=1$\\[1pt]
   $\phi_{1,\mathrm L}=\phi_{1,\mathrm R}=0$\\[1pt]
   $c_1=2^1\cdot 1+2^0\cdot 1=3$};
\node[anchor=west,font=\tiny,align=left,inner sep=2pt] at (2.7,-4.7)
  {adder 2\\[1pt]
   $c_{2,\mathrm L,1}=c_{2,\mathrm R,1}=1$\\[1pt]
   $\varphi_{2,\mathrm L,5}=1,\ \varphi_{2,\mathrm R,0}=1$\\[1pt]
   $\phi_{2,\mathrm L}=0,\ \phi_{2,\mathrm R}=1$\\[1pt]
   $c_2=2^5\cdot 3-2^0\cdot 3=93$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.3c, p. 367, with the variable assignment of Fig. 12.5, p. 375, transposed onto it.*

**Read the graph as arithmetic on constants, not on data.** Label the adder nodes $a=1\dots N_\mathrm{A}$ and give the input a node $a=0$ with $c_0=1$ ($\mathcal{C}1$, p. 374). Every node computes

$$c_a=(-1)^{\phi_{a,\mathrm L}}2^{s_{a,\mathrm L}}c_{a,\mathrm L}+(-1)^{\phi_{a,\mathrm R}}2^{s_{a,\mathrm R}}c_{a,\mathrm R}\qquad(12.9,\ \text{p.\,374})$$

where $c_{a,i}$ is the constant arriving at input $i\in\{\mathrm L,\mathrm R\}$, $s_{a,i}$ its shift and $\phi_{a,i}$ its sign. The circuit is recovered by multiplying the whole graph through by $X$: distributivity of multiplication over addition makes node $a$ carry the wire $c_aX$, and $2^{s}c_{a,i}X$ is a hardwired left shift, free in place-and-route. Widths follow from the node constants alone — node $a$ needs $w+\lceil\log_2(c_a+1)\rceil$ bits for an unsigned $w$-bit $X$, so in the drawing $3X$ is $w{+}2$ bits and $93X$ is $w{+}7$. A negated input is a two's-complement negation, $-x=\bar x+1$ ([[Number Formats]]), which the adder absorbs as an inverted operand plus a carry-in; it costs the same as an addition, which is why "adder" covers both in this literature (p. 368).

**Make the adder count a loop, not a variable.** $N_\mathrm{A}$ decides *how many* instances of (12.9) exist, so it cannot be a decision variable of the model that contains them. The algorithm therefore fixes $N_\mathrm{A}$, solves a pure **feasibility** problem with no objective row, and increments $N_\mathrm{A}$ until one is feasible (p. 373) — the freeze-the-nonlinearity decomposition of [[ILP for Arithmetic Design]], with the objective row left free for a secondary criterion such as power. The starting point is the counting bound: one adder can create at most two nonzero signed digits, two adders at most four, so

$$N_\mathrm{A,lb,SCM}=\lceil\log_2(\mathrm{nz}(c))\rceil\qquad(12.8,\ \text{p.\,373})$$

with $\mathrm{nz}$ the nonzero count of a minimal signed-digit form. For $C=93$, CSD gives $93=10\bar100\bar101_{\mathrm{CSD}}=2^7-2^5-2^2+2^0$, so $\mathrm{nz}=4$ and $N_\mathrm{A,lb}=2$. The solve at $N_\mathrm{A}=2$ returns feasible, the loop stops on its first iteration, and *that* is the minimality proof — not an argument about the graph, but the absence of any graph one node smaller.

**Every constraint is one of the standard gadgets.** The seven variable families (Table 12.2, p. 375) are three integer chains and three binary decisions per adder input:

| Symbol | Domain | Meaning |
|---|---|---|
| $c_a$ | $\mathbb{N}$, bounded $c_a<2C$ | constant computed at adder $a$ |
| $c_{a,i}$ | $\mathbb{N}$ | constant arriving at input $i$ of adder $a$ |
| $c^{\mathrm{sh}}_{a,i}$ | $\mathbb{N}$ | that constant after its shift |
| $c^{\mathrm{sh,sg}}_{a,i}$ | $\mathbb{Z}$ | after shift *and* sign |
| $c_{a,i,k}$ | $\{0,1\}$ | input $i$ of adder $a$ is fed by node $k$ |
| $\varphi_{a,i,s}$ | $\{0,1\}$ | that input is shifted by $s$ |
| $\phi_{a,i}$ | $\{0,1\}$ | that input is negated |

$\mathcal{C}2$ splits (12.9) into the linear sum $c_a=c^{\mathrm{sh,sg}}_{a,\mathrm L}+c^{\mathrm{sh,sg}}_{a,\mathrm R}$; $\mathcal{C}3$b and $\mathcal{C}4$b are exactly-one selections $\sum_k c_{a,i,k}=1$, $\sum_s\varphi_{a,i,s}=1$; $\mathcal{C}5$c is the at-most-one form $\phi_{a,\mathrm L}+\phi_{a,\mathrm R}\le1$, because subtracting both inputs is never cheaper; $\mathcal{C}6$ pins the output, $c_{N_\mathrm{A}}=C$. The three that are *not* linear — source selection $\mathcal{C}3$a, shift $\mathcal{C}4$a, sign $\mathcal{C}5$a/b — are indicator constraints, rewritten with big-M as, e.g., $c_k-M+Mc_{a,i,k}\le c_{a,i}\le c_k+M-Mc_{a,i,k}$ (p. 377). Two structural restrictions do the real work on run time: $k<a$ in $\mathcal{C}3$b orders the adders, which simultaneously forbids combinational loops and collapses the permutation symmetry of the search space (p. 376); and $\mathcal{C}4$c/$\mathcal{C}4$d ($\varphi_{a,\mathrm R,s}=0$ for $s>0$, $\varphi_{a,\mathrm L,s}=\varphi_{a,\mathrm R,s}$ for $s<0$) exploit the fact that only one input ever needs a positive shift, deleting most of the $\varphi$ grid before the solver sees it.

**Check the big-M against the solver's tolerance before believing anything.** The critical row is $\mathcal{C}4$a$'$, where $M$ must exceed $\max 2^sc_a$; bounding $c_a<2C$ and $s\le S_{\max}$ gives the book's recommendation $M=2C\,2^{S_{\max}}$ (p. 378). At $C=93$ with $S_{\max}=6$ that is $M=11904$, so $1/M\approx8.4\times10^{-5}$, comfortably clear of the $10^{-5}$ integer feasibility tolerance — big-M is safe at this size and is the faster encoding. It stops being safe long before the run time does; see *When it breaks*.

**Verify the returned assignment by recomputing it.** At $N_\mathrm{A}=2$ the solver reports $c_{1,\mathrm L,0}=c_{1,\mathrm R,0}=1$, $\varphi_{1,\mathrm L,1}=\varphi_{1,\mathrm R,0}=1$, $\phi_{1,\cdot}=0$, and $c_{2,\mathrm L,1}=c_{2,\mathrm R,1}=1$, $\varphi_{2,\mathrm L,5}=\varphi_{2,\mathrm R,0}=1$, $\phi_{2,\mathrm L}=0$, $\phi_{2,\mathrm R}=1$. Substituting into $\mathcal{C}2$: $c_1=2^1\cdot1+2^0\cdot1=3$ and $c_2=2^5\cdot3-2^0\cdot3=96-3=93$, satisfying $\mathcal{C}6$, with $\mathcal{C}5$c holding as $0+1\le1$. In hardware that is $3X=X+2X$ then $93X=2^5(3X)-3X$: two adders against three for the CSD graph of Fig. 12.3b and four for the plain binary expansion $93=(2^6+2^4+2^3+2^2+1)$ of Fig. 12.3a. The product is exact, $0$ ulp ([[Error Accuracy]]), because $C$ and $X$ are integers and no bit is ever discarded — the only cost of the shifts is width.

> [!important] Recompute the solution rather than trusting the status line
> Solvers work in binary64 even when every variable is integral, so a reported optimum is optimal *on the solver's rounded arithmetic* (p. 796). Substituting the returned $\varphi$ and $\phi$ back into $\mathcal{C}2$ by hand — the $96-3$ above — is the whole verification, and it is cheap. Separately, "infeasible" from one solve means infeasible **at that $N_\mathrm{A}$**, which is the outer loop working as designed, not a statement that $C$ has no adder graph.

**Adder count is a proxy, and a loose one.** Because each input is shifted, parts of every adder are adding zero bits: at the LSB the corresponding full-adder cells vanish, at the MSB they degrade to half adders (p. 381). The bit-level cost therefore depends on *which* intermediate constant the graph picks, not only on how many. The book's example is $49X$ in two adders either way: through $7X$ it takes $11+14=25$ full-adder equivalents, while through the negative intermediate $-15X$ it takes $8+8=16$, about a third less, because $-15X$ leaves four LSBs of the following addition to be copied rather than computed (Fig. 12.8, p. 382). Minimal-adder and minimal-full-adder are different objectives on the same graph, and the second needs a bit-level extension of this same ILP.

**On FPGAs the model grows rows, not machinery.** Every FPGA-specific variant in this book — combination with LUT-based multipliers, pipelining, ternary adders, run-time reconfiguration — enters as extra decision variables and extra constraints on the formulation above, never as a new algorithm (p. 373). Ternary adders are the sharpest case: [[Ternary Adders on FPGAs]] map three-input additions onto one level of the hard carry chain, and replacing $\mathcal{C}2$ by $c_a=c^{\mathrm{sh,sg}}_{a,\mathrm L}+c^{\mathrm{sh,sg}}_{a,\mathrm M}+c^{\mathrm{sh,sg}}_{a,\mathrm R}$ and $\mathcal{C}5$c by $\phi_{a,\mathrm L}+\phi_{a,\mathrm M}+\phi_{a,\mathrm R}\le2$ is the entire extension (p. 379). It buys a lot: every constant up to 22 bits is realizable in three ternary adders or fewer — 7,154,955 is the first that needs four — against a two-input bound of 19 bits, and about $1/3$ of the resources on average for coefficients wider than five bits (Fig. 12.7, p. 380). Each node is then a [[RCA, Ripple-Carry Adder]] on the fabric's carry chain, so on FPGA the depth of the graph, not its width, is what the critical path sees. The declarative payoff is that any improvement in ILP solver performance improves the circuits with no change to the tool (p. 373).

$$\boxed{\ c_a=(-1)^{\phi_{a,\mathrm L}}2^{s_{a,\mathrm L}}c_{a,\mathrm L}+(-1)^{\phi_{a,\mathrm R}}2^{s_{a,\mathrm R}}c_{a,\mathrm R},\quad c_0=1,\ c_{N_\mathrm{A}}=C,\quad N_\mathrm{A}\ \ge\ \lceil\log_2\mathrm{nz}(C)\rceil\ }$$

**When it breaks**

- **Past ~20-bit constants.** Gurobi with indicator constraints on a laptop: under one second up to 12 bits, sub-second to several minutes at 16 bits, up to an hour at 20 bits (p. 378). Beyond that the exact model is unusable and the heuristics of §12.5.1 take over. The wall is the branch-and-bound tree, exponential in the number of integer variables, and the number of those grows with both $N_\mathrm{A}$ and $S_{\max}$.
- **Big-M outruns the numeric range first.** $M=2C\,2^{S_{\max}}$ grows *quadratically* in the constant's magnitude: a 20-bit $C$ with $S_{\max}=20$ gives $M\approx2\times10^{12}$, so $1/M$ is seven orders below the $10^{-5}$ feasibility tolerance and the model must fall back to native indicator constraints — numerically robust, but slower because of the weaker relaxation (p. 374, p. 378, p. 796).
- **The minimum is not unique, and the model does not care which one it hands you.** The graph above builds $3X$ then scales it; Table 12.1 (p. 372) records $93=31\cdot2^0+31\cdot2^1$, i.e. build $31X=2^5X-X$ then $93X=31X+62X$ — also two adders, different intermediates, different bit-level cost and different fan-out. With no objective row there is nothing to break the tie.
- **Only what is modelled is optimized.** Two-input adders, one negated input per node ($\mathcal{C}5$c), a positive shift on at most one input ($\mathcal{C}4$c/d), no pipeline registers, no fan-out limit, no glue cost. Each of those is a legitimate restriction of the search space and each makes "proven optimal" a claim about the model, not about your netlist.
- **One constant only.** Sharing intermediates across a coefficient set is a different, larger problem — see [[Multiple Constant Multiplication]] — and the per-constant optima are usually the wrong starting point for it, because the shared subgraph a fused solution wants may be optimal for none of the coefficients alone.
- **$X$ signed, or fractional.** The formulation is stated for integer $C$ and integer $X$. A signed $X$ costs sign extension on every branch and changes the width arithmetic; a fractional $C$ must first be quantised, and *which* quantisation to pick is itself an ILP coupled to the accuracy spec rather than a preprocessing step.

**RTL (Spade)**

```spade
/// Minimal-adder adder graph for C = 93, generic in the input width.
///   node 1: c_1 = 2^1*c_0 + 2^0*c_0 = 3       -> 3X
///   node 2: c_2 = 2^5*c_1 - 2^0*c_1 = 93      -> 93X
fn scm93<#uint W>(x: uint<W>) -> uint<{W + 7}> {
    let t: uint<{W + 2}> = zext(x);
    let c1: uint<{W + 2}> = t +. (t << 1);      // 3X, fits in W+2 bits
    let u: uint<{W + 7}> = zext(c1);
    (u << 5) -. u                               // 32*3X - 3X = 93X
}
```

Each `let` is one node of the drawing: `t` is the input bus $c_0$, `c1` is the $w{+}2$-bit wire out of adder 1, and the final expression is adder 2 with its right input negated. The `zext`s are the width annotations on the arrows, and they are why the truncating operators `+.` and `-.` are safe rather than lossy — the result already fits, since $3(2^W-1)<2^{W+2}$ and $93(2^W-1)<2^{W+7}$, so nothing is discarded and the multiplication stays exact. `<< 1` and `<< 5` are pure rewiring and synthesise to no logic at all; what synthesis *will* do differently from the drawing is refuse to build two independent adders — the shifted operands mean the low bit of adder 1 and the low five bits of adder 2 are additions with a zero operand, which collapse to wires or half adders, exactly the bit-level saving of Fig. 12.8. All combinational; a pipelined variant registers between the nodes, which changes the objective and is a different solve.

Simulated with 9 named vectors — including the asymmetric $x=1$ and $x=128$, which distinguish the two shift paths — plus 3000 random and all 256 exhaustive 8-bit inputs against the behavioural reference `x * 93`: 3265 vectors, zero mismatches.

**Related Notes**

- [[Shift-and-Add]] – depends-on: supplies the graph vocabulary — nodes as constants, edges as shifts and signs — that this note turns into decision variables.
- [[Multiplication by Constants]] – compares: places the exact minimal-adder solve against the heuristics and the table-based KCM route it is bounded by.
- [[Multiple Constant Multiplication]] – extends: the same model with $\mathcal{C}6$ generalised to several output constants, sharing intermediates across the set.
- [[Ternary Adders on FPGAs]] – extends: replaces $\mathcal{C}2$ with a three-input sum and $\mathcal{C}5$c with $\le2$ negations, reaching 22-bit constants in three adders.
- [[RCA, Ripple-Carry Adder]] – depends-on: what each node becomes on the carry chain, and where the bit-level cost of a shifted operand is actually paid.
- [[Trailing Zero Counter]] – compares: the same gadget catalogue applied to a different objective, minimizing coefficient word length instead of adder count.
- [[ILP for Arithmetic Design]] – depends-on: the indicator/big-M encodings and the freeze-the-nonlinearity outer loop this model is assembled from.
- [[FPGAs]] – supports: the fabric whose hard carry chain and LUT structure the FPGA-specific extensions add rows for.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §12.1, adder graphs, binary and CSD realizations of $93X$, pp. 366–368 — Fig. 12.3, p. 367; Algorithm 12.1 (CSD conversion), p. 368.
- Table 12.1, minimal-adder SCM solutions for coefficients up to 8 bit, p. 372.
- §12.1.4, Minimal-Adder Constant Multiplication by Using ILP, pp. 373–378 — lower bound (12.8) and the $N_\mathrm{A}$ loop, p. 373; nonlinear model (12.9)–(12.10) and $\mathcal{C}1$–$\mathcal{C}2$, p. 374; Table 12.2 and Fig. 12.5, p. 375; $\mathcal{C}3$–$\mathcal{C}4$, p. 376; $\mathcal{C}5$–$\mathcal{C}6$, p. 377; linearization $\mathcal{C}3$a$'$–$\mathcal{C}5$b$'$ and the choice of $M$, pp. 377–378; run-time and numeric limits, p. 378.
- §12.1.5, ternary-adder SCM, pp. 378–380 — Fig. 12.6, p. 379; Fig. 12.7 and $\mathcal{C}2^*$/$\mathcal{C}5$c$^*$, pp. 379–380.
- §12.1.6, minimizing logic resources instead of adders, pp. 380–382 — Fig. 12.8, p. 382.
- Appendix B.3.3, indicator constraints and big-M, p. 793; B.4, run time and numerical instabilities, pp. 795–796.
