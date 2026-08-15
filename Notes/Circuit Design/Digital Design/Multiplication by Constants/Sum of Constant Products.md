---
title: Sum of Constant Products
description: "Many inputs, one output — literally the transposed MCM graph, obtained by reversing every edge so branches become adders and adders become branches."
kind: circuit
source: "ASA §12.5.3, pp. 407-409"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, mcm, sopc, filters]
aliases:
  - SOPC
  - Sum of Constant Products
  - Sum of Products by Constants
  - Sum of Constant Products, Integer Case
---

# Sum of Constant Products

An SOPC computes $R=\sum_{i=0}^{N-1}C_iX_i$ for a fixed coefficient vector — many inputs, one output — and it is not merely analogous to [[Multiple Constant Multiplication]] but the *same graph run backwards*, so every MCM optimisation result transfers to it for free.

```tikz title="SOPC adder graph for 19X + 43Y, obtained by transposing the {19,43} MCM graph"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  \tikzstyle{op}=[draw,circle,inner sep=1.6pt]

  \node (X) at (-0.9,7.4) {$X$};
  \node (Y) at ( 5.3,7.4) {$Y$};

  \node[op] (a1) at (2.4,5.6) {$+$};
  \node[op] (a2) at (2.4,4.0) {$+$};
  \node[op] (a3) at (2.4,2.4) {$+$};
  \node[op] (a4) at (2.4,0.8) {$-$};

  % X rail
  \draw (X) -- (-0.9,5.6);
  \draw[-latex] (-0.9,5.6) -- node[above,font=\scriptsize]{8} (a1.west);

  % Y rail, tapped twice
  \draw (Y) -- (5.3,4.0);
  \node[circ] at (5.3,5.6) {};
  \draw[-latex] (5.3,5.6) -- node[above,font=\scriptsize]{$8\!\ll\!1$} (a1.east);
  \draw[-latex] (5.3,4.0) -- node[above,font=\scriptsize]{8} (a2.east);

  % a1 -> a2, and the a1 bypass to the final subtracter
  \draw (a1.south) -- (2.4,4.9);
  \node[circ] at (2.4,4.9) {};
  \draw[-latex] (2.4,4.9) -- node[right,font=\scriptsize]{$10\!\ll\!2$} (a2.north);
  \node[anchor=east,font=\scriptsize] at (2.2,5.15) {$(X{+}2Y)$};
  \draw (2.4,4.9) -- (0.7,4.9) -- (0.7,0.8);
  \draw[-latex] (0.7,0.8) -- node[above,font=\scriptsize]{10} (a4.west);

  % a2 -> a3 twice (x4 and x1)
  \draw (a2.south) -- (2.4,3.35);
  \node[circ] at (2.4,3.35) {};
  \draw[-latex] (2.4,3.35) -- node[right,font=\scriptsize]{$12\!\ll\!2$} (a3.north);
  \node[anchor=east,font=\scriptsize] at (2.2,3.6) {$(4X{+}9Y)$};
  \draw (2.4,3.35) -- (4.3,3.35) -- (4.3,2.4);
  \draw[-latex] (4.3,2.4) -- node[above,font=\scriptsize]{12} (a3.east);

  % a3 -> a4
  \draw[-latex] (a3.south) -- node[right,font=\scriptsize]{15} (a4.north);
  \node[anchor=east,font=\scriptsize] at (2.2,1.6) {$(20X{+}45Y)$};

  % result
  \draw[-latex] (a4.south) -- node[right,font=\scriptsize]{14} (2.4,-0.35);
  \node[anchor=north,font=\small] at (2.4,-0.4) {$R=19X+43Y$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.22e, p. 409; widths added for $w_X=w_Y=8$ unsigned.*

**Fix the operator.** The SOPC is

$$R=\sum_{i=0}^{N-1}C_iX_i \tag{12.44, p.\,407}$$

with all $C_i$ known at synthesis time and all $X_i$ runtime signals of width $w_{X_i}$. MCM is one input and $M$ outputs; SOPC is $N$ inputs and one output. Both are linear maps with a constant matrix — MCM by a column $\mathbf{C}\in\mathbb{Z}^{M\times1}$, SOPC by a row $\mathbf{C}^{\mathsf T}\in\mathbb{Z}^{1\times N}$ — which is the whole reason the two share an implementation theory. The two-sided generalisation is the [[Constant Matrix Multiplier]].

**Transposition is the linear-algebra transpose made structural.** A shift-and-add circuit is a signal-flow graph: a DAG whose nodes sum their incoming edges and whose edges carry a multiplicative weight $\pm2^s$ (free — a shift is wiring). Such a graph computes $\mathbf y=\mathbf A\mathbf x$ where $A_{ji}$ is the sum of path weights from input $i$ to output $j$. **Transposition** reverses every edge, keeps every weight, and swaps the roles of the terminals: sources become sinks, sinks become sources. Because reversing an edge transposes its contribution to every path product, the reversed graph computes $\mathbf x'=\mathbf A^{\mathsf T}\mathbf y'$. Structurally the reversal exchanges the two node types — a node with $k$ out-edges (a **branch**, free in hardware) acquires $k$ in-edges and becomes an **adder**, and an adder becomes a branch [GD04, p. 407]. Fig. 12.22b-d shows exactly this on the $\{19,43\}$ graph, first with node positions kept and then redrawn top-to-bottom.

**Transpose the $\{19,43\}$ MCM by hand.** The minimal MCM graph (Fig. 12.19c, repeated as Fig. 12.22a) is three adders:

$$n_1=X+2^2X=5X,\qquad n_2=2^2n_1-X=19X,\qquad n_3=2n_2+n_1=43X.$$

Write the transpose mechanically: for every edge $i\to j$ of weight $w$, emit $j'\to i'$ of the same weight, so node $i'$ accumulates $\sum_j w_{ij}\,j'$ over the *outgoing* edges of $i$. Feeding the transposed graph with $X$ at the former $19X$ terminal and $Y$ at the former $43X$ terminal:

$$n_3'=Y,\qquad n_2'=X+2n_3'=X+2Y,\qquad n_1'=2^2n_2'+n_3'=4X+9Y,$$
$$X'=5n_1'-n_2'=(20X+45Y)-(X+2Y)=19X+43Y.$$

That is the diagram, and it confirms the coefficient bookkeeping the book stresses: the signal entering where $19X$ used to leave contributes with weight $19$, and the one entering at $43X$ with weight $43$ (p. 408).

**Count the adders, do not guess them.** Let the SFG have $V$ nodes and $E$ edges, with $N$ sources and $M$ sinks; every non-source node sums its in-edges, costing $\deg^-(v)-1$ two-input adders. Then

$$N_A=\sum_{v\ \text{non-source}}\!\!\big(\deg^-(v)-1\big)=E-(V-N).$$

Transposition preserves $V$ and $E$ and merely exchanges which terminal set has in-degree zero, so

$$N_A^{\mathsf T}=E-(V-M)=N_A-N+M \tag{after p.\,411}$$

which the book states for the CMM case and which specialises here. An MCM has $N=1$ and $M=N_C$ constants, so its transpose costs $N_A+N_C-1$ adders — three becomes four in the example. The extra adder is identifiable: the MCM's input node $X$ had out-degree 3, and a free 3-way fanout transposes into a 3-input summation, i.e. two adders where the MCM spent none. Logic depth follows the same $+1$: the MCM's critical path is $X\to n_1\to n_2\to n_3$, three adders, while the SOPC runs $a_1\to a_2\to a_3\to a_4$, four.

**Widths are not preserved, which is why equal adder counts are not equal area.** In the MCM every node holds $C_kX$, so node width is $w_X+\lceil\log_2 C_k\rceil$ and stays modest. In the transpose each node holds a partial sum of *all* inputs, so widths track the growing coefficient sums: with $w_X=w_Y=8$ unsigned, $X+2Y\le765$ needs 10 bits, $4X+9Y\le3315$ needs 12, $20X+45Y\le16575$ needs 15, and the final $19X+43Y\le15810$ needs 14 — the subtraction narrows the word, because $20X+45Y$ can exceed the true maximum of the result. Cost in full-adder equivalents therefore differs between a graph and its transpose even at identical adder count; see [[Minimum Full-Adder Constant Multiplier]] for why adder count is the wrong objective in the first place. Signedness and the ulp bookkeeping for non-integer coefficients are in [[Number Formats]] and [[Error Accuracy]].

**One output is a structural gift the MCM does not get.** Every intermediate in an SOPC feeds only the single result, so nothing forces the internal sums into non-redundant form: the whole graph can be flattened into one bit heap and resolved by a single carry-propagate adder at the end. On FPGAs this is the dominant implementation — one table-based multiplier per input, all their outputs merged into a shared heap with a single final rounding ([[KCM-Based Sum of Products]], §12.5.5, pp. 412-414). An MCM cannot do this, because each of its $M$ outputs needs its own carry-propagate resolution. The corresponding ASIC move, retiming the adder graph onto carry-save adders, is harder than it looks: there is no 1:1 mapping from CPA-based adder graphs to CSA-based ones — some CPAs collapse to wires, others need two CSAs — so CSA adder graphs need their own optimisation algorithms (p. 407).

$$\boxed{\ \textstyle\sum_i C_iX_i \;=\; \big(\text{MCM}(\{C_i\})\big)^{\mathsf T},\qquad N_A^{\mathsf T}=N_A-N+M\ }$$

**When it breaks.**

- Transposition is cost-neutral only when $N=M$. Going MCM $\to$ SOPC always pays $+(N_C-1)$ adders and roughly $+1$ logic depth; going the other way refunds it.
- Adder count transposes exactly, **full-adder count does not** — the transposed graph carries wider words. Never quote an MCM's area figure for its SOPC.
- Registers do not come along for the ride. A pipeline schedule balanced on the forward DAG is unbalanced on the reversed one and must be re-solved; see [[Pipelined Adder Graph]].
- Real-valued coefficients have no integer adder graph at all. Round them and the rounding error is unanalysed; the operator-level answer is the fused KCM bit heap with a shared guard-bit count $g>\log_2(ND)$ (eq. 12.51, p. 413).
- Above roughly a dozen coefficients the MCM search that you would transpose is itself the bottleneck — exact methods run for minutes to an hour at 16-20 constant bits ([[Minimum-Adder Constant Multiplier]]).
- Very wide $N$ with a latency budget: a linear adder chain like the diagram's is depth $N_A$; use a heap and a compressor tree instead of transposing a chain-shaped MCM.

> [!warning] Recursive filters are outside this analysis
> An IIR SOPC re-injects its own output into the summation, and that infinite recursion needs an error analysis this chapter does not give (p. 414). The same applies to the freedom a frequency-response specification leaves in choosing the coefficients — both are deferred to the filter chapter, see [[LTI Filters]].

```spade
entity sopc_19_43(x: uint<8>, y: uint<8>) -> uint<14> {
    let x10: uint<10> = zext(x);
    let y10: uint<10> = zext(y);
    let a1:  uint<10> = trunc(x10 + (y10 << 1));      // X + 2Y

    let a1w: uint<12> = zext(a1);
    let y12: uint<12> = zext(y);
    let a2:  uint<12> = trunc((a1w << 2) + y12);      // 4A1 + Y  = 4X + 9Y

    let a2w: uint<15> = zext(a2);
    let a3:  uint<15> = trunc((a2w << 2) + a2w);      // 5A2      = 20X + 45Y

    let a1f: uint<15> = zext(a1);
    trunc(a3 - a1f)                                   // A3 - A1  = 19X + 43Y
}
```

`a1`/`a2`/`a3` are the diagram's three internal nodes and the tail expression is the final subtracter; `<< 1` and `<< 2` are the edge weights and cost nothing but routing. Every `zext` widens to the node width computed above before the operator runs, and each `trunc` discards the guaranteed-zero bit that Spade's `+`/`-` add — this is bookkeeping, not truncation, since 10/12/15/14 bits each hold the node's true maximum. The block is purely combinational: synthesis will flatten the four adders into one carry chain per node and, unlike the drawing, is free to re-balance the ripple across them, which is the whole reason a real generator would hand this to a bit heap instead.

Verified by simulation against `19*x + 43*y`: 10 named vectors including the asymmetric $1\cdot19+128\cdot43$ and $128\cdot19+1\cdot43$, plus a 3000-vector random sweep, 3010/3010 exact.

**Related Notes**

- [[Multiple Constant Multiplication]] – depends-on: this note's circuit *is* an MCM adder graph with every edge reversed; optimise there, transpose here.
- [[Constant Matrix Multiplier]] – extends: allows several inputs *and* several outputs, of which MCM and SOPC are the two degenerate cases.
- [[KCM-Based Sum of Products]] – compares: the FPGA answer to the same operator, tables and one fused bit heap instead of an adder graph.
- [[LTI Filters]] – supports: a transposed-form FIR tap bank is exactly this operator, one SOPC per output sample.
- [[Exact Accumulators]] – compares: the other way to sum many terms without intermediate rounding, when the coefficients are not constants.
- [[Pipelined Adder Graph]] – counter-example: register placement is the one property transposition does not carry across.
- [[Minimum Full-Adder Constant Multiplier]] – compares: shows why the transposed graph's equal adder count hides unequal area.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.5.3 "Sum of Constant Products, Integer Case", pp. 407-409 (eq. 12.44, Figs. 12.21-12.22).
- §12.5.4 "Constant Matrix-Vector Multiplication", pp. 410-411 — transposed adder-graph cost $N_A-N+M$.
- §12.5.5 "Table-Based Sum of Products of Fixed-Point Inputs by Real Constants", pp. 412-414 — fused bit heap, shared guard bits, and the recursive-filter caveat.
- §12.5.1, pp. 406-407 — CSA-based adder graphs are not a 1:1 remap of CPA-based ones.
