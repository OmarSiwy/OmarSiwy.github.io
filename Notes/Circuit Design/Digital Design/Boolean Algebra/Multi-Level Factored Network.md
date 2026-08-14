---
title: "Multi-Level Factored Network"
description: "Factoring and shared subexpressions trade one or more levels of depth for large literal-count reductions that two-level minimization cannot find."
kind: circuit
source: "0.1) Boolean Algebra §Specification, §Distributive, §Cost metrics, §Trade-offs, §Worked example — no book source"
status: seed
spade: simulated
tags: [digital, boolean-algebra, synthesis, area, fpga]
aliases:
  - "Multi-Level Logic"
  - "Multi-Level Network"
  - "Multi-Level Synthesis"
  - "Factored Form"
  - "Factored Network"
  - "Shared Subexpression"
  - "Common Subexpression Extraction"
---

# Multi-Level Factored Network

A logic network of depth greater than two, built by running distributivity backwards and naming the repeated pieces, whose distinguishing property is that its cost is measured across *all* outputs at once rather than one output at a time.

```tikz title="Factored full adder: h = a XOR b is one node feeding both outputs, across three levels"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}
  \node[xor port] (X1) at (0,4.2) {};
  \node[and port] (A1) at (0,2.2) {};
  \node[xor port] (X2) at (3.6,3.6) {};
  \node[and port] (A2) at (3.6,1.0) {};
  \node[or port]  (O1) at (6.2,1.6) {};
  \coordinate (cb) at (1.2,0);
  \coordinate (hb) at (1.8,0);
  % --- a and b rails
  \draw (X1.in 1) -- ++(-1.5,0) coordinate (atap);
  \draw (atap) -- (atap |- A1.in 1) -- (A1.in 1);
  \draw (atap) -- ++(-0.6,0) node[anchor=east] {$a$};
  \draw (X1.in 2) -- ++(-1.1,0) coordinate (btap);
  \draw (btap) -- (btap |- A1.in 2) -- (A1.in 2);
  \draw (btap) -- ++(-1.0,0) node[anchor=east] {$b$};
  \fill (atap) circle (0.055);
  \fill (btap) circle (0.055);
  % --- carry-in: over the top to X2, tapped down to A2
  \draw (-2.9,4.95) node[anchor=east] {$c_{in}$} -- (2.7,4.95) |- (X2.in 1);
  \draw (1.2,4.95) -- (cb |- A2.in 2) -- (A2.in 2);
  \fill (1.2,4.95) circle (0.055);
  % --- h = a xor b, the extracted subexpression, fan-out 2
  \draw[red!75!black, very thick] (X1.out) -- (hb |- X1.out) -- (hb |- A2.in 1);
  \draw[red!75!black, very thick] (X2.in 2) -- (hb |- X2.in 2);
  \draw[red!75!black, very thick] (A2.in 1) -- (hb |- A2.in 1);
  \fill[red!75!black] (hb |- X2.in 2) circle (0.075);
  \node[anchor=west, font=\footnotesize, red!70!black] at (1.9,2.62) {$h=a\oplus b$, fan-out $2$};
  % --- ab routed under everything into the OR
  \draw (A1.out) -- ++(0.35,0) |- (5.2,-0.95) |- (O1.in 2);
  \node[anchor=north, font=\footnotesize] at (2.9,-1.0) {$ab$};
  \draw (A2.out) -- ++(0.45,0) |- (O1.in 1);
  \node[anchor=north, font=\footnotesize] at (3.6,0.35) {$c_{in}h$};
  % --- outputs
  \draw (X2.out) -- ++(1.1,0) node[anchor=west] {$s=h\oplus c_{in}$};
  \draw (O1.out) -- ++(0.7,0) node[anchor=west] {$c_{out}=ab+c_{in}h$};
  % --- level markers
  \draw[dashed, gray] (1.55,-1.5) -- (1.55,5.6);
  \draw[dashed, gray] (5.0,-1.5) -- (5.0,5.6);
  \node[font=\footnotesize, gray!60!black] at (0.0,5.85) {level 1};
  \node[font=\footnotesize, gray!60!black] at (3.3,5.85) {level 2};
  \node[font=\footnotesize, gray!60!black] at (6.4,5.85) {level 3};
  \node[anchor=west, font=\footnotesize, align=left] at (-3.9,-2.1)
    {All signals $1$ bit. Factored: $5$ gates, $D=3$.\\
     Two-level SOP for the same pair of outputs: $9$ gates, $D=2$.\\
     The single red node is what no two-level minimizer can find --- it belongs to neither output alone.};
\end{circuitikz}
\end{document}
```

Every wire drawn is $1$ bit; the three inputs and two outputs are $1$ bit each. The level markers count gate delays, not wires: $ab$ is produced at level $1$ and consumed at level $3$, which is slack, not depth.

**Read distributivity backwards and a level appears.** Two-level minimization ([[Karnaugh Map]], Quine–McCluskey, Espresso) fixes the shape of the answer before it starts: a sum of products, depth $2$, and the only freedom left is *which* products. Factoring gives that freedom back by applying [[0.1) Boolean Algebra#Distributive|H4]] right to left. Each application $ab+ac\to a(b+c)$ deletes one occurrence of the factored variable and inserts one gate level, and it is an identity, so the function is untouched. On the full adder's carry-out — three $1$-bit inputs $a,b,c_{in}$, minimal SOP forced because all three prime implicants are essential:

$$c_{out}=ab+ac_{in}+bc_{in} \;\xrightarrow{\ \text{distributivity in } c_{in}\ }\; ab+c_{in}(a+b)$$

Six literals become five, depth $2$ becomes $3$. That is the entire mechanism, repeated.

**The next step is not distributivity — it is a don't-care, and that is where the algorithms split.** Replacing $a+b$ by $a\oplus b$ looks illegal, since the two disagree at $a=b=1$. It is legal because at $a=b=1$ the term $ab$ already forces $c_{out}=1$, so the other operand of the OR is unobservable there. Formally, split $a+b$ on the covered case and apply absorption $x+xc=x$:

$$ab+c_{in}(a+b)=ab+c_{in}\big(ab+(a\oplus b)\big)=\underbrace{ab+abc_{in}}_{=\,ab\ \text{[absorption]}}+c_{in}(a\oplus b)=ab+c_{in}(a\oplus b)$$

The step used the complement axiom H5 (through $ab$ and $a\oplus b$ partitioning $a+b$), not just distributivity. That distinction has a name: rewriting that uses only the ring-like laws is **algebraic** division, rewriting that additionally exploits $x\bar x=0$, $x+\bar x=1$ and don't-cares is **Boolean** division. Algebraic division is fast and is what every production tool runs; Boolean division finds strictly more, at a cost that makes exhaustive use of it impractical.

**Extraction, not factoring, is the part two-level minimization structurally cannot reach.** A K-map or a prime-implicant chart minimizes *one* function. Given the full adder's two outputs it is run twice, in isolation, and the resulting $s=\bar a\bar bc_{in}+\bar ab\bar c_{in}+a\bar b\bar c_{in}+abc_{in}$ and $c_{out}=ab+ac_{in}+bc_{in}$ share no product term at all — $s$'s checkerboard map has no two adjacent ones, so its minimal SOP *is* its canonical SOP and there is nothing to merge. Factoring $s$ on $c_{in}$ by [[Shannon Expansion Multiplexer|Shannon expansion]] exposes what the two-level view hid:

$$s=\bar c_{in}(\bar ab+a\bar b)+c_{in}(\bar a\bar b+ab)=\bar c_{in}(a\oplus b)+c_{in}\overline{(a\oplus b)}=(a\oplus b)\oplus c_{in}$$

using $\overline{a\oplus b}=\bar a\bar b+ab$, itself De Morgan applied to $a\oplus b=a\bar b+\bar ab$. Now name $h=a\oplus b$ once and both outputs reference it. The red node in the diagram is a *network* node, not a term of either output's expression, and no amount of per-output minimization produces it.

**State the counting convention or the literal count means nothing.** Literal count $L$ is the area proxy because a static CMOS complex gate spends one NMOS and one PMOS per literal — $2L$ transistors. In a two-level form $L$ is unambiguous: the number of variable occurrences, $ab+\bar ac$ has $L=4$. In a multi-level network it depends on how far you decompose, because a reference to an internal node counts as a literal exactly like a variable:

| form | nodes | $L$ | gates | $D$ |
| --- | --- | --- | --- | --- |
| two-level, $s$ and $c_{out}$ minimized separately | $2$ | $12+6=18$ | $9$ | $2$ |
| factored, three nodes: $h=a\oplus b$, $s=h\oplus c_{in}$, $c_{out}=ab+c_{in}h$ | $3$ | $2+2+4=8$ | $5$ | $3$ |
| same network, fully decomposed to $2$-input gates | $5$ | $5\times2=10$ | $5$ | $3$ |

> [!warning] The long-form note's trade-off table mixes two conventions
> [[0.1) Boolean Algebra#Trade-offs]] quotes $18$ for the two-level full adder and $10$ for the factored one. $18$ counts variable occurrences in the expressions; $10$ counts gate inputs in the realization. Counted the second way the two-level pair is $4\!\times\!\text{AND3}+\text{OR4}+3\!\times\!\text{AND2}+\text{OR3}=25$, not $18$. The ratio survives either way — $2.25\times$ or $2.5\times$ — but the two columns are not comparable as printed. Fix the convention first, then compare.

**Depth is the currency, and the exchange rate is not fixed.** One factoring step adds one level *if* the factored subexpression was not already available; extracting $h$ costs nothing extra in the full adder because $s$ needed $a\oplus b$ anyway. The rate also runs the other way. Four-input parity is the extreme: its minimal SOP equals its canonical SOP — eight prime implicants, all minterms, none combinable, so two-level minimization achieves *literally nothing* — at $L=32$, while the tree $(a\oplus b)\oplus(c\oplus d)$ costs $L=6$ at the **same** depth $2$. A $5.3\times$ literal reduction for zero depth. Any claim that multi-level always costs a level is a claim about the two-level form's fan-in, not about factoring.

**Two-level depth is a fiction under bounded fan-in, which biases every comparison.** A $p$-product SOP is $D=2$ only if a $p$-input OR is one gate delay. Under a fan-in limit of $k$ it is really $D=\lceil\log_k p\rceil+\lceil\log_k n\rceil$, so the parity SOP's OR8 is already a tree. Since $p$ can be exponential in $n$ and a factored network's node fan-ins are bounded by construction, the honest comparison is between two logarithmic depths, and the multi-level form frequently wins both metrics at once. Compare against [[Two-Level SOP Network]] only after fixing $k$.

**The gain is delivered by the tool, not by hand.** Production multi-level synthesis (SIS, and ABC after it) alternates two moves over a network of nodes: *decomposition*, splitting a node into smaller ones, and *extraction*, finding a divisor common to several nodes and promoting it to its own node. Candidate divisors come from **kernels** — the cube-free quotients of a node by one of its cubes — because two expressions have a common algebraic multiple-cube divisor if and only if their kernels intersect, which turns "search all divisors" into "intersect two finite kernel sets". The full adder's $h$ is the smallest interesting instance of this. There is no canonical multi-level form and no exact algorithm; the loop stops when the literal count stops falling.

**On an FPGA the entire trade-off evaporates.** A $k$-input [[Lookup-Tables|LUT]] implements *any* function of $k$ variables at a cost of one LUT and a depth of one, so literal count is invisible and product-term count is invisible. What survives is the **support size** of each logic cone. The full adder's two outputs both have support $\{a,b,c_{in}\}$, so on a $k=6$ device each is one LUT at depth $1$ and the factored network's shared $h$ buys nothing — it would be re-absorbed into both LUTs. The FPGA problem is *decomposition* to $\le k$ support, which is the same second move above with a different cost function and no extraction step. Factoring pays on ASIC standard-cell flows, where literals really do buy transistors; see [[FPGAs]]. The one place it still pays on FPGA is when the shared node feeds cones whose *combined* support exceeds $k$.

$$\boxed{\ ab+ac_{in}+bc_{in}\ \xrightarrow[\text{H4 backwards}]{\text{factor}}\ ab+c_{in}(a+b)\ \xrightarrow[\text{absorption on }ab]{\text{Boolean div.}}\ ab+c_{in}h,\quad h=a\oplus b,\quad L:18\to8,\ D:2\to3\ }$$

**When it breaks**

- **The path is depth-critical.** Address decoders, control decode, anything one gate delay from a setup violation: buy the depth, pay the literals, and keep the two-level form. Factoring is an *area* transform that happens to be free sometimes, not a speed transform.
- **Literal count ignores fan-out, and extraction creates fan-out.** The shared node $h$ drives two loads instead of one; at high fan-out it needs a buffer tree whose delay and area $L$ does not model. Extraction is the one transform that systematically makes this worse, because "used by many nodes" is exactly what it optimizes for.
- **$2L$ transistors is an AND/OR model.** A CMOS XOR2 is not four transistors, so a network measured at $L=6$ built entirely from XORs is not one third the area of an $L=18$ AND/OR network. Compare literal counts only within one gate family, or count transistors.
- **Hazards move, and usually multiply.** Two-level minimization already deletes the [[0.1) Boolean Algebra#Consensus|consensus]] terms that suppress static hazards; a multi-level network additionally lets a glitch on one shared node propagate to every consumer of that node, so a single hazard becomes several correlated output glitches. Synchronous logic samples on an edge and does not care; [[Static Hazards|asynchronous logic]] does, and minimizes less for exactly this reason.
- **No canonical form, so no cheap equivalence check.** Canonical SOP is unique, which is what makes it useful as a normal form rather than as a netlist. A factored network is not, so equivalence checking between two multi-level versions of the same function is a SAT problem, not a comparison.
- **The problem is not solved, only heuristically attacked.** Exact multi-level minimization has no algorithm; algebraic division is a restriction chosen for tractability and it provably misses factorizations that Boolean division finds. Do not read a synthesis report's literal count as a lower bound.
- **The target is a LUT fabric.** See above: run decomposition to support $\le k$ instead, and skip minimization entirely.

**RTL (Spade)**

```spade
/// Two-level minimal SOP, each output minimized in isolation: L = 18, D = 2.
fn fa_sop(a: bool, b: bool, c: bool) -> (bool, bool) {
    let s = (!a && !b && c) || (!a && b && !c) || (a && !b && !c) || (a && b && c);
    let co = (a && b) || (a && c) || (b && c);
    (s, co)
}

/// Multi-level factored: h = a XOR b extracted once, used by both outputs. L = 8, D = 3.
fn fa_factored(a: bool, b: bool, c: bool) -> (bool, bool) {
    let h = a != b;
    (h != c, (a && b) || (c && h))
}
```

`let h` is the red node of the diagram, and the fact that it appears in two expressions is the whole content of the note — in Spade a `let` used twice is one wire with fan-out $2$, not two copies. `!=` is XOR here because `^` is not defined on `bool`. Both are `fn`, so both are purely combinational: no clock, no state, and each of the five named subexpressions of `fa_factored` is one gate in the drawing. Every signal is $1$ bit, so no width arithmetic arises at all. Synthesis will honour neither block: a standard-cell tool re-factors both into whatever its library's timing wants, and an FPGA tool collapses each output into a single LUT and deletes `h` — which is the FPGA paragraph above, visible in the netlist.

Both entities were simulated against the behavioural reference `a + b + c` over the complete $2^3$ truth table plus $3000$ random vectors, and against **each other** — that equality is the claim that factoring is truth-preserving, checked rather than asserted.

**Related Notes**

- [[Two-Level SOP Network]] – compares: the fixed-depth form this one is measured against, and the only one with a canonical representative.
- [[Two-Level POS Network]] – compares: the dual starting point; factoring a POS uses OR-over-AND, $a+bc=(a+b)(a+c)$.
- [[Karnaugh Map]] – depends-on: produces the minimal two-level form that factoring takes as input, one output at a time.
- [[Shannon Expansion Multiplexer]] – supports: expanding on one variable is the decomposition step that exposed $h$ in the sum.
- [[NAND-NAND Network]] – extends: the technology mapping applied *after* factoring; every AND becomes a NAND at no cost.
- [[NOR-NOR Network]] – extends: the dual mapping, for a factored POS network.
- [[Choosing a Logic Realization]] – compares: where this sits against every sibling, by target and by which cost dominates.
- [[Parallel Prefix Adders]] – extends: the same trade at datapath scale — associativity re-brackets a depth-$w$ chain into a depth-$\log w$ tree, and the prefix nodes are shared subexpressions by another name.
- [[Static Hazards]] – counter-example: the one regime where a *smaller* literal count is the wrong answer, because the redundant terms are load-bearing.
- [[Lookup-Tables]] – counter-example: a cost model in which literal count is exactly zero and only support size is billed.

## References

- [[0.1) Boolean Algebra]] — §Specification (literal count and logic depth as the two cost metrics), §The laws/Distributive and §Absorption (the two rewrites used above), §Cost metrics (the $2L$ transistor proxy and the bounded-fan-in depth formula), §Trade-offs (the full adder and 4-input parity rows), §Worked example — the full adder (truth table, both K-maps, the shared form). All counts here were recomputed from the truth tables; the one place they disagree with that note is flagged in the callout above.
- No textbook source for this topic. Standard material: Mano & Ciletti, *Digital Design*, ch. 3 (two-level minimization) and ch. 4 (multi-level realizations); Wakerly, *Digital Design: Principles and Practices*, ch. 4; Weste & Harris, *CMOS VLSI Design*, ch. 1 and 4 (literal count as a transistor proxy, fan-out and buffering). Kernels, algebraic versus Boolean division and the extract/decompose loop are from Brayton, Hachtel, McMullen & Sangiovanni-Vincentelli, *Logic Minimization Algorithms for VLSI Synthesis* (1984) and the SIS/ABC line of tools that followed. Page numbers are deliberately omitted — no copy was consulted for this note.
