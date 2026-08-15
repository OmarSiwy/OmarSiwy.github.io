---
title: "Ternary-Adder Constant Multiplier"
description: "Uses the FPGA carry chain's free third input so that every constant up to 22 bits needs at most three adders, saving about a third of the resources."
kind: circuit
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, fpga, adder-graph, scm]
aliases:
  - Ternary Adder Constant Multiplier
  - Least-Ternary-Adder Constant Multiplier
  - minAddTernary
---

# Ternary-Adder Constant Multiplier

A shift-and-add constant multiplier whose adder-graph nodes take **three** shifted-and-signed copies instead of two, because on an FPGA the third input is very nearly free — which collapses every constant up to $22$ bits to at most three adders.

```tikz title="Optimal ternary adder graph for 683X: two nodes instead of four"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small, line width=0.7pt]
  % --- adder nodes -------------------------------------------------
  \node[draw, circle, minimum size=11pt, inner sep=0pt] (a) at (0,3.0) {$+$};
  \node[draw, circle, minimum size=11pt, inner sep=0pt] (b) at (0,0.8) {$+$};

  % --- input X and its fan-out ------------------------------------
  \node[anchor=south] at (0,4.75) {$X$};
  \draw[->] (0,4.7) -- (0,3.25);
  \node[anchor=west] at (0.08,3.95) {\scriptsize $w_X$};
  \fill (0,4.35) circle (1.6pt);
  \fill (-1.55,4.35) circle (1.6pt);

  % X << 1  into node a (left)
  \draw (0,4.35) -- (-1.55,4.35) -- (-1.55,3.0);
  \draw[->] (-1.55,3.0) -- (-0.28,3.0);
  \node[anchor=south] at (-0.9,3.02) {$\ll 1$};

  % X << 3  into node a (right)
  \draw (0,4.35) -- (1.55,4.35) -- (1.55,3.0);
  \draw[->] (1.55,3.0) -- (0.28,3.0);
  \node[anchor=south] at (0.9,3.02) {$\ll 3$};

  % --- 11X spine ---------------------------------------------------
  \node[anchor=west] at (0.12,2.62) {$(11X)$};
  \draw[->] (0,2.75) -- (0,1.05);
  \node[anchor=east] at (-0.1,1.75) {\scriptsize $w_X{+}4$};
  \fill (0,2.2) circle (1.6pt);

  % 11X << 6 into node b (right)
  \draw (0,2.2) -- (1.55,2.2) -- (1.55,0.8);
  \draw[->] (1.55,0.8) -- (0.28,0.8);
  \node[anchor=south] at (0.9,0.82) {$\ll 6$};

  % -(X << 5) into node b (left)
  \draw (-1.55,4.35) -- (-2.9,4.35) -- (-2.9,0.8);
  \draw[->] (-2.9,0.8) -- (-0.28,0.8);
  \node[anchor=south] at (-1.6,0.82) {$\ll 5$};
  \node[anchor=north east] at (-0.24,0.72) {$-$};

  % --- output ------------------------------------------------------
  \draw[->] (0,0.55) -- (0,-0.35);
  \node[anchor=north] at (0,-0.4) {$683X$};
  \node[anchor=west] at (0.08,0.1) {\scriptsize $w_X{+}10$};
\end{circuitikz}
\end{document}
```

*after Fig. 12.6b, p. 379.*

**Widen the node, not the graph.** A [[Minimum-Adder Constant Multiplier]] searches over graphs whose every node is the two-input recursion $c_a=(-1)^{\phi_{a,\mathrm L}}2^{s_{a,\mathrm L}}c_{a,\mathrm L}+(-1)^{\phi_{a,\mathrm R}}2^{s_{a,\mathrm R}}c_{a,\mathrm R}$. Replacing that node with a three-input one — constraint $\mathcal C2^*$ of the ILP model —

$$c_a=c^{\mathrm{sh,sg}}_{a,\mathrm L}+c^{\mathrm{sh,sg}}_{a,\mathrm M}+c^{\mathrm{sh,sg}}_{a,\mathrm R},\qquad a=1\dots N_{\mathrm A}$$

changes nothing about the *mathematics* of the search — the superscript $\mathrm{sh,sg}$ still means "shifted by $s_{a,i}$ and negated iff $\phi_{a,i}=1$", the ordering constraint still forbids node $a$ from reading node $k\ge a$, and the output constraint is still $c_{N_{\mathrm A}}=C$. Only one rule loosens: $\mathcal C5\mathrm c^*$ replaces "at most one input negated" with

$$\phi_{a,\mathrm L}+\phi_{a,\mathrm M}+\phi_{a,\mathrm R}\le2 ,$$

because a ternary adder with **two** of its three inputs pre-complemented is still realizable on a modern FPGA carry chain, while all three are not (p. 379). Everything else in the linearization — the big-$M$ indicator constraints $\mathcal C3\mathrm a/\mathrm b$, $\mathcal C4\mathrm a/\mathrm b$, $\mathcal C5\mathrm a/\mathrm b$ — is copied verbatim with the index set widened from $i\in\{\mathrm L,\mathrm R\}$ to $i\in\{\mathrm L,\mathrm M,\mathrm R\}$ (p. 380).

**The third input costs nothing because the LUT layer is already there.** This is the whole justification and it is architectural, not arithmetic. An FPGA logic cell is a $\alpha$-input [[Lookup-Tables|LUT]] *in front of* a hardened full adder; a two-input adder uses the carry chain and leaves the LUT computing a bare $x_i\oplus y_i$, i.e. two of its $\alpha\in\{4,5,6\}$ inputs. Spending the idle inputs on a carry-save row that compresses $3\to2$ before the chain gives $X+Y+Z$ in the same cell count as $X+Y$ — see [[Ternary Adders on FPGAs]] for the mapping and for the vendor-dependent delay penalty. On an ASIC the premise is simply false: there a ternary adder is an explicit carry-save row plus a full carry-propagate adder, strictly more area than one binary adder, and this entire section stops paying.

**Enumeration says three adders cover 22 bits.** Applying the graph-enumeration method of the two-input case to ternary topologies, Kumm et al. evaluated every topology of up to three ternary adders and found that **all constants up to $22$ bits are reachable with three ternary adders or fewer**; the smallest constant needing a fourth is $7{,}154{,}955$ (p. 378). The two-input tables reach only $19$ bits, and need up to five adders to do it. Averaged over the coefficient word size, the improvement (Fig. 12.7b, p. 380) is essentially zero below five bits — those constants were already one or two adders — then jumps to $35\text{--}45\%$ and stays there, which is the origin of the "about $1/3$ of the resources" figure.

**Read the two-node graph for $683$.** The upper node builds $11X$ from three copies of $X$ at shifts $0,1,3$, which is just the binary expansion $11=1011_2=2^0+2^1+2^3$ — a ternary adder absorbs a three-nonzero constant in one level where a binary graph needs two. The lower node then produces

$$683=-2^5+11+2^6\cdot11=-32+11+704 ,$$

using the one negation that $\mathcal C5\mathrm c^*$ allows, and reusing $X$ itself as the negated operand rather than a fresh intermediate. Widths: $X$ is $w_X$ bits, $11X$ is $w_X+4$, the result $683X$ is $w_X+10$ since $683<2^{10}$; for $w_X=8$ that is $18$ bits, matching $683\cdot255=174165<2^{18}$. The two-input optimum for the same constant (Fig. 12.6a) is $17X$, $3X$, $85X$, $683X$ — **four** adders at logic depth $3$. Ternary halves the adder count *and* drops the depth to $2$.

> [!note] "Adder cost" in Fig. 12.7 is adder *count*, not area.
> The very next subsection (§12.1.6, p. 381) shows that adder count lies: for $49X$, two graphs with identical adder count differ by $1/3$ in full-adder equivalents, because shifted operands overlap only partially and the non-overlapping low bits are wires. A ternary node whose three operands are spread over wide shifts wastes most of its third input on zeros. Read the $1/3$ as a strong hint, not a resource estimate — see [[Minimum Full-Adder Constant Multiplier]].

$$\boxed{\ c_a=c^{\mathrm{sh,sg}}_{a,\mathrm L}+c^{\mathrm{sh,sg}}_{a,\mathrm M}+c^{\mathrm{sh,sg}}_{a,\mathrm R},\quad \textstyle\sum_i\phi_{a,i}\le2 \;\Longrightarrow\; N_{\mathrm A}\le3\ \text{ for all } w_C\le22\ }$$

**When it breaks**

- **Above $22$ bits there is no table.** $7{,}154{,}955$ is the first constant needing a fourth ternary adder; past the enumerated range you are back to ILP or heuristics, and the ILP's own practical ceiling is about $20$ bits (p. 378).
- **Below $\approx5$-bit coefficients the saving is zero** — such constants already cost zero or one adder, so there is nothing to merge.
- **Non-FPGA targets invert the conclusion.** On an ASIC the ternary node costs more than the binary one it replaces; the graph is then optimizing the wrong metric.
- **Delay, not just area.** The ternary adder is at best as fast as the binary one and on some vendors noticeably slower ([[Ternary Adders on FPGAs]]), so a depth-$2$ ternary graph does not automatically beat a depth-$3$ binary one on the critical path.
- **All-three-negated nodes are unrealizable**, so the search space is genuinely smaller than "any $\pm2^s$ triple" — a graph you derive on paper may not map.
- **A table beats all of it at small $w_X$.** For $C=683$, $w_X=8$, a [[KCM, Table-Based Constant Multiplication|KCM]] costs $38$ LUTs at depth one LUT plus one carry chain, and costs the same for *every* $10$-bit constant. Shift-and-add of any flavour only wins when $w_X$ is large or the constant is unusually friendly — see [[Choosing a Constant Multiplier]].

**RTL (Spade)**

```spade
/// One ternary adder node of an adder graph: three pre-aligned operands,
/// summed on a single FPGA carry chain.
fn tadd<#uint N>(a: int<N>, b: int<N>, c: int<N>) -> int<N> {
    a +. b +. c
}

/// 683 X as two ternary nodes:  11X = X + 2X + 8X,  683X = -32X + 11X + 704X.
fn mul683(x: uint<8>) -> uint<18> {
    let xs: int<19> = sext(x.to_int());
    let n11  = tadd::<19>(xs, xs << 1, xs << 3);
    let n683 = tadd::<19>(-(xs << 5), n11, n11 << 6);
    trunc(n683.as_uint())
}
```

`n11` is the upper circle of the diagram and `n683` the lower one; the `<<` amounts are the edge labels, and the unary `-` is the minus sign on the lower node's left input. Everything is `fn`, hence purely combinational — an adder graph has no state. The one honest discrepancy with the drawing is width: the source carries a uniform signed $19$-bit datapath (enough for $704\cdot255=179520$ and for the negative partial $-32X$, per [[Number Formats]]), whereas synthesis prunes the shifted-in zeros and the sign-extension bits back to the $w_X+4$ and $w_X+10$ the diagram labels. The other thing synthesis does differently is the important one: `a +. b +. c` is written as two adds, and only vendor inference of shared-arithmetic / ternary-carry mode turns it into *one* chain. If that inference does not fire, you get two binary adders and the entire argument of this note evaporates — check the map report, do not assume.

**Related Notes**

- [[Ternary Adders on FPGAs]] – depends-on: supplies the "third input is free" premise that this whole optimization rests on.
- [[Minimum-Adder Constant Multiplier]] – extends: identical search, two-input nodes; this note swaps the node and re-runs it.
- [[Minimum Full-Adder Constant Multiplier]] – counter-example: adder count is not area, and the $1/3$ saving is quoted in the metric that lies.
- [[Lookup-Tables]] – supports: the idle LUT inputs in front of the carry chain are what pay for the third operand.
- [[KCM, Table-Based Constant Multiplication]] – compares: the table-based rival that ignores the constant's structure entirely.
- [[Multiple Constant Multiplication]] – extends: the same ternary node drops into the MCM formulation by changing only the output constraint.
- [[Choosing a Constant Multiplier]] – compares: where this sits against every sibling technique.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 12.

- §12.1.5 "Minimal-Adder Constant Multiplication Using Ternary Adders", pp. 378–380 — graph-enumeration results [Kum+16], the $22$-bit / three-adder bound, $7{,}154{,}955$, Fig. 12.6 ($683X$, two-input vs. ternary), Fig. 12.7 (adder cost and relative improvement), the $\mathcal C2^*/\mathcal C5\mathrm c^*$ ILP extension, and the FloPoCo recipe `IntConstMult method=minAddTernary`.
- §12.1.4 ILP model, constraints $\mathcal C1$–$\mathcal C6$ and their big-$M$ linearization, pp. 373–378.
- §12.1.6 bit-level cost, the $49X$ example, pp. 380–382.
- §5.4.4 ternary adders on FPGAs (referenced from p. 378 as the enabling mapping).
