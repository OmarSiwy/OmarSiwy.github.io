---
title: "Minimum-Adder Constant Multiplier"
description: "The provably fewest-adder graph for one coefficient, found by enumerating topologies offline and looking the constant up in a table."
kind: circuit
source: "ASA §12.1.2-12.1.3, pp. 369-372"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, scm, adder-graph, optimization]
aliases:
  - SCM
  - Single Constant Multiplication
  - Minimal-Adder Constant Multiplier
  - MAG
  - Minimized Adder Graph
---

# Minimum-Adder Constant Multiplier

A shift-and-add multiplier whose adder graph is not derived from any representation of the constant but *looked up* in a table of provably optimal graphs precomputed by exhaustive enumeration.

```tikz title="Minimum-adder graph for 173X with an 8-bit input, showing the width at each node"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\node (x) at (0,0) {$X$};
\draw[->] (0,-0.15) -- node[right,font=\tiny]{8} (0,-0.9);
\draw (-2.0,-0.9) -- (3.0,-0.9);
\node[draw,minimum width=1.6cm,minimum height=0.6cm] (a15)  at (-1.4,-2.3) {$15X$};
\node[draw,minimum width=1.6cm,minimum height=0.6cm] (a45)  at (-1.4,-4.1) {$45X$};
\node[draw,minimum width=1.8cm,minimum height=0.6cm] (a173) at ( 0.4,-5.9) {$173X$};
\draw[->] (-2.0,-0.9) -- node[left,font=\tiny]{$2^4$}  (-2.0,-2.0);
\draw[->] (-0.8,-0.9) -- node[right,font=\tiny]{$-2^0$} (-0.8,-2.0);
\draw (-1.4,-2.6) -- node[right,font=\tiny]{12} (-1.4,-3.1);
\draw (-2.0,-3.1) -- (-0.8,-3.1);
\draw[->] (-2.0,-3.1) -- node[left,font=\tiny]{$2^1$}  (-2.0,-3.8);
\draw[->] (-0.8,-3.1) -- node[right,font=\tiny]{$2^0$} (-0.8,-3.8);
\draw[->] (-1.4,-4.4) -- node[left,font=\tiny]{14} (-1.4,-5.1) -- node[above,font=\tiny]{$2^0$} (-0.2,-5.1) -- (-0.2,-5.6);
\draw[->] ( 3.0,-0.9) -- node[right,font=\tiny]{8} (3.0,-5.1) -- node[above,font=\tiny]{$2^7$} (1.0,-5.1) -- (1.0,-5.6);
\draw[->] ( 0.4,-6.2) -- node[right,font=\tiny]{16} (0.4,-6.9) node[below,font=\small]{$173X$};
\node[font=\tiny,align=center] at (0.2,-7.6)
  {$15X=2^4X-X$,\quad $45X=15X+2^1\!\cdot\!15X$,\quad $173X=45X+2^7X$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.4, p. 371*

**Establish that the canonical recoding is not the floor.** [[CSD Constant Multiplier]] reaches $93=10\bar100\bar101_{\mathrm{CSD}}$, four nonzeros, three adders. But $93=3\times31$, and by associativity of multiplication a cascade of two constant multipliers computes the same product: $3=11_{\mathrm{MSD}}$ costs one adder, $31=1000\bar1_{\mathrm{MSD}}$ costs one adder, so $93X=3\cdot(31X)$ costs **two** (Fig. 12.3c, p. 367). The saving is visible inside the CSD string too, as the identity $10\bar1_{\mathrm{SD}}=-\bar101_{\mathrm{SD}}$ (eq. 12.3, p. 369): the same three-digit pattern occurs twice, once negated, so computing it once and reusing it removes an adder. Systematising that observation is **common subexpression elimination** (CSE), and CSE is not complete — for $25=10\bar1001_{\mathrm{CSD}}=101_2\cdot101_2$ the repeated factor $101_2$ never appears in the CSD string, because squaring it makes its two ones overlap and carry out to $11001_2$ (p. 369).

**Define the search space rather than a rewriting rule.** Drop representations entirely and work directly on the graph. An adder graph is a DAG whose source node carries the value $1$ (the wire $X$ itself), whose every other node $a$ carries

$$c_a=(-1)^{\phi_{a,\mathrm L}}2^{s_{a,\mathrm L}}c_{a,\mathrm L}+(-1)^{\phi_{a,\mathrm R}}2^{s_{a,\mathrm R}}c_{a,\mathrm R}$$

for two predecessors, and whose sink carries $C$. Multiplying the whole graph through by $X$ turns node values into signals and this equation into a two-input adder or subtracter with hard-wired shifts. **Single constant multiplication (SCM)** asks for such a graph of minimum node count. It is NP-complete (p. 369, citing Cappello & Steiglitz), and no recoding of $C$ can be a complete search of it, because a recoding fixes the topology to a single adder tree over shifted copies of $X$ and forbids intermediate values like $15X$ that are not sub-sums of $C$.

**Reverse the question so the search runs once, offline.** Asking "what is the cheapest graph for $C$" is intractable per constant; asking "**which constants are reachable with at most $N_{\mathrm A}$ adders?**" is a finite enumeration (p. 370). There are finitely many topologies on $N_{\mathrm A}$ nodes, and finitely many shift and sign assignments once shifts are bounded, so one enumerates them all, evaluates the constant each produces, and stores the result. This is the **minimized adder graph** (MAG) algorithm of Dempster and Macleod, which covered every $12$-bit coefficient with up to four adders; Gustafsson et al. reached five adders covering all $19$-bit coefficients, and six adders covering $32$ bits — the last using topology tests of Voronenko and Püschel rather than exhaustive generation (p. 370).

**Store the answer as a single recursion, not a graph.** The table does not hold DAGs. For each odd coefficient it holds the adder count and one decomposition

$$C=C_{\mathrm A}2^{s_{\mathrm A}}+C_{\mathrm B}2^{s_{\mathrm B}} \tag{12.4, p.\,370}$$

which is applied recursively to whichever of $C_{\mathrm A},C_{\mathrm B}$ is not $1$, terminating when both are (Table 12.1, p. 372):

| $C$ | adders | $C_{\mathrm A}$ | $s_{\mathrm A}$ | $C_{\mathrm B}$ | $s_{\mathrm B}$ |
|---|---|---|---|---|---|
| 3 | 1 | 1 | 0 | 1 | 1 |
| 7 | 1 | 1 | 3 | $-1$ | 0 |
| 15 | 1 | 1 | 4 | $-1$ | 0 |
| 45 | 2 | 15 | 0 | 15 | 1 |
| 93 | 2 | 31 | 0 | 31 | 1 |
| 121 | 2 | 1 | 7 | $-7$ | 0 |
| 173 | 3 | 45 | 0 | 1 | 7 |
| 255 | 1 | 1 | 8 | $-1$ | 0 |

Unrolling $C=173$ takes three lookups — $173=45+1\cdot2^7$, then $45=15+15\cdot2^1$, then $15=1\cdot2^4-1$ — and multiplying every line by $X$ gives the circuit drawn above:

$$15X=X\cdot2^4-X,\qquad 45X=15X+15X\cdot2^1,\qquad 173X=45X+X\cdot2^7 \tag{12.5-12.7, p.\,371}$$

Three adders, against the four that $173=10101101_2$ (five ones) would need in binary and the three that its CSD form happens to reach. The graph is a chain, not a tree: $45X$ *reuses* $15X$ on both its inputs, which is exactly the structural freedom a recoding of $C$ cannot express.

**Normalise the even coefficients away so the table only stores odd ones.** Factor $C=2^\ell C_{\text{odd}}$ with $C_{\text{odd}}$ odd. Since $CX=2^\ell(C_{\text{odd}}X)$ and a left shift is a relabelling of output wires, an even coefficient costs exactly what its odd part costs: $120=2^3\cdot15$ needs the one adder that $15$ needs (p. 371). Halving the table's size is the small win; the real one is that the *cost function* over coefficients is invariant under multiplication by two, which is what makes the enumeration finite in the first place.

> [!important] The optimality is free at run time
> Every expensive thing here — the NP-complete search, the topology enumeration, the exhaustive evaluation — happens once, in a paper, for all constants of a given width. What the designer pays is a table lookup and a few recursive expansions. This is the same trade as [[KCM, Table-Based Constant Multiplication]] makes with LUTs, one level up: precompute the hard part and index into it.

**Size each node from its own constant, not from the output width.** For $X$ in $w_X$ bits unsigned, a node carrying value $c_a$ needs $w_X+\lceil\log_2 c_a\rceil$ bits, so the chain widens as it goes: $15X$ is $12$ bits, $45X$ is $14$, $173X$ is $16$, for $w_X=8$. Sizing every intermediate at the final $16$ bits would work and would cost about $20\%$ more adder bits for nothing. The subtraction $2^4X-X$ is safe in unsigned arithmetic because $16X\ge X$ for all $X\ge0$ — the operand order in the table is not arbitrary, and a node whose value the table gives as negative (the $-7$ in the row for $121$) is a subtracter whose *result* is still positive, since the graph invariant is that every node value is a positive integer.

**Expect the adder count to lie about area.** Minimality is in *adders*, and there may be several distinct minimum-adder graphs for one constant with different gate counts (p. 370). Because the two operands are shifted relative to each other they overlap only partially: in $173X=45X+X\cdot2^7$ the $14$-bit $45X$ spans bit positions $0..13$ and $X\cdot2^7$ spans $7..14$, so positions $0..6$ are wires with no logic at all, positions $7..13$ are the only true full-adder columns, and $14..15$ degrade to half adders and a carry-out. That is why [[Minimum Full-Adder Constant Multiplier]] exists as a separate objective, and why it can beat this one at equal adder count.

**On an FPGA the node is the wrong size.** A two-input adder maps to the hard carry chain at one LUT per bit, so on ASIC and FPGA alike adder count times width is a reasonable proxy — but the FPGA carry chain will also absorb a *three*-input add for the same LUT count, which changes what "minimum" means: enumerating ternary topologies puts every constant up to $22$ bits within three adders (p. 378). Use [[Ternary-Adder Constant Multiplier]] on FPGA and this note's tables on ASIC.

$$\boxed{\ C=C_{\mathrm A}2^{s_{\mathrm A}}+C_{\mathrm B}2^{s_{\mathrm B}},\quad\text{applied recursively until }C_{\mathrm A}=C_{\mathrm B}=1\ }$$

with $C$ odd (even constants reduce by $C=2^\ell C_{\text{odd}}$), and the table guaranteeing the resulting node count is the minimum over all adder graphs.

## When it breaks

- **Above the tabulated width.** Published tables stop at $19$ bits for five adders and $32$ for six; a wider constant has no entry and you fall back to heuristics or to an ILP search, which is itself practical only to about $20$ bits (p. 378).
- **When the coefficient is not a compile-time literal.** A runtime-selectable coefficient has no table entry to look up — see [[Reconfigurable Constant Coefficient Multiplier]].
- **When there is more than one coefficient.** Optimising each constant separately wastes the intermediates they could share; [[Multiple Constant Multiplication]] is a different and harder problem, not $n$ copies of this one.
- **When the objective is not adder count.** Registers, fan-out, glitching power and full-adder count all rank the minimum-adder graphs differently, and the table commits you to one of them.
- **When the constant is real, not integer.** Then the product is inexact and the coefficient width is itself a design variable — [[Faithful Shift-and-Add Real Constant Multiplier]].
- **At high frequency.** The chain here is $3$ adders deep with widening operands; pipelining it changes the cost model enough that the minimum-adder graph is often not the minimum-register one — see [[Pipelined Adder Graph]].

## RTL (Spade)

```spade
fn scm173<#uint W>(x: uint<W>) -> uint<{W + 8}> {
    // 15X = X<<4 - X
    let x4:   uint<{W + 4}> = zext(x);
    let c15:  uint<{W + 4}> = trunc((x4 << 4) - x4);
    // 45X = 15X + 15X<<1
    let c15w: uint<{W + 6}> = zext(c15);
    let c45:  uint<{W + 6}> = trunc(c15w + (c15w << 1));
    // 173X = 45X + X<<7
    let c45w: uint<{W + 8}> = zext(c45);
    let x8:   uint<{W + 8}> = zext(x);
    trunc(c45w + (x8 << 7))
}
```

Each `let` is one box in the diagram and each `<<` is one edge label; nothing is registered, so the whole thing is a combinational cone three adders deep. The widths are the diagram's node widths written as types — $W+4$, $W+6$, $W+8$ for $\lceil\log_2 15\rceil$, $\lceil\log_2 45\rceil$, $\lceil\log_2 173\rceil$ — and the `trunc` after each `+` discards the growth bit that Spade adds but the constant's range proves is zero. What synthesis does differently from the drawing: the shifts are not operators at all, they are the routing that the `<<` denotes, and the low $7$ bits of the final adder collapse to wires because $X\cdot2^7$ has nothing there to add.

Simulated against `x * 173` over all $256$ values of an $8$-bit input plus $3000$ random vectors, including asymmetric cases ($1$, $128$, $129$, $170$, $254$): $3266$ vectors, zero mismatches.

## Related Notes

- [[CSD Constant Multiplier]] – compares: the greedy recoding this note beats, and the source of its baseline adder count.
- [[Binary Shift-and-Add Constant Multiplier]] – depends-on: supplies the adder-graph formalism that the enumeration searches over.
- [[Multiple Constant Multiplication]] – extends: the same graph search when several coefficients may share intermediates.
- [[Ternary-Adder Constant Multiplier]] – counter-example: on FPGAs a three-input node costs the same as two, so this note's minimum is not the minimum.
- [[Minimum Full-Adder Constant Multiplier]] – counter-example: among equally minimal graphs, gate count varies by a third.
- [[Pipelined Adder Graph]] – extends: re-optimises the same graph once registers enter the cost function.
- [[Choosing a Constant Multiplier]] – compares: where a tabulated optimal graph sits against KCM and DSP-block alternatives.
- [[FloPoCo]] – supports: `flopoco IntConstMult method=minAdd wIn=10 constant=173` emits exactly this circuit (p. 371).

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §12.1.2 Formalization of the shift-and-add SCM problem, pp. 369-370 (eqs. 12.2-12.3; NP-completeness; CSE incompleteness).
  - §12.1.3 Minimal-adder constant multiplication by graph enumeration, pp. 370-371 (eq. 12.4; eqs. 12.5-12.7; Fig. 12.4; even-coefficient reduction; FloPoCo invocation).
  - Fig. 12.3, p. 367 (binary, CSD and minimum-adder circuits for $93X$).
  - Table 12.1, p. 372 (minimal-adder SCM solutions for odd coefficients to 8 bits).
  - §12.1.4, p. 378 and §12.1.5, p. 378 (practical width ceilings; ternary-adder coverage).
  - §12.1.6, pp. 380-381 (adder count as an imprecise cost metric).
