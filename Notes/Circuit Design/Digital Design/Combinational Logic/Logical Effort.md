---
title: Logical Effort
description: "d = g·h + p prices fan-in properly, gives D_min = N·F^(1/N) + P and the FO4 yardstick, and explains why a shallower flat netlist can be the slower one."
kind: concept
status: seed
spade: n/a
tags: [digital, combinational-logic]
aliases:
  - Logical Effort
  - Electrical Effort
  - Parasitic Delay
  - FO4
  - Fan-In Penalty
---

# Logical Effort

A linear delay model $d = gh + p$ in which a gate's topology ($g$), its load ($h$) and its self-loading ($p$) are separated, so that a wide gate is charged for being wide — the thing level-counting refuses to do.

```tikz title="Worst-case paths of a 4:1 multiplexer built two ways, with per-stage logical-effort delays"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}
  \tikzset{crit/.style={line width=1.1pt}}

  % ================= (a) tree of three MUX2, worst path =================
  \node[anchor=west] at (-1.0,1.9) {\textbf{(a)} Tree of three MUX2 --- worst path is the \emph{select} path $S_0$, $N=3$.};

  \node[not port] (inv) at (1.2,0.1) {};
  \draw[crit] (-0.4,0.1) node[anchor=east] {$S_0$} -- (inv.in);
  \draw[crit] (inv.out) -- (2.2,0.1);
  \fill (2.2,0.1) circle (1.4pt);

  % blocks
  \draw (3.4,-0.5) rectangle (4.6,0.7); \node[font=\tiny] at (4.0,0.1) {MUX2};
  \draw (6.4,-0.5) rectangle (7.6,0.7); \node[font=\tiny] at (7.0,0.1) {MUX2};
  \draw[black!45] (3.4,-2.5) rectangle (4.6,-1.7); \node[font=\tiny,text=black!45] at (4.0,-2.1) {MUX2};

  % select routing with branch b=2
  \draw[crit] (2.2,0.1) -- (2.2,-1.1) -- (4.0,-1.1) -- (4.0,-0.5);
  \draw[black!45] (2.2,-1.1) -- (2.2,-2.1) -- (3.4,-2.1);
  \node[anchor=west, text=black!60] at (2.3,-1.45) {$b=2$};

  % data in
  \draw[black!45] (3.05,0.5) node[anchor=east,text=black!45] {$D_0$} -- (3.4,0.5);
  \draw[black!45] (3.05,-0.3) node[anchor=east,text=black!45] {$D_1$} -- (3.4,-0.3);

  % stage 2 to stage 3
  \draw[crit] (4.6,0.1) -- (5.5,0.1) -- (5.5,0.5) -- (6.4,0.5);
  \draw[black!45] (4.6,-2.1) -- (5.5,-2.1) -- (5.5,-0.3) -- (6.4,-0.3);
  \draw[crit] (7.6,0.1) -- (8.8,0.1); \node[anchor=south] at (8.3,0.15) {$Y$};
  \draw (7.0,-1.1) node[anchor=north] {$S_1$} -- (7.0,-0.5);

  \node[anchor=south, text=black!60] at (1.2,0.75) {$3\,\tau$};
  \node[anchor=south, text=black!60] at (4.0,0.75) {$6\,\tau$};
  \node[anchor=south, text=black!60] at (7.0,0.75) {$6\,\tau$};
  \node[anchor=west, text=black!60] at (8.9,0.1) {$\Sigma = 15\,\tau$};
  \node[anchor=north west, align=left, text=black!60] at (-1.0,-3.15)
    {$G=1\cdot2\cdot2=4$, $B=2$, $H=1$ $\Rightarrow$ $F=8$, $\hat f = F^{1/3}=2$;\quad
     $P=1+4+4=9$;\quad stage $=\hat f + p$.};

  % ================= (b) flat two-level NAND-NAND =================
  \begin{scope}[yshift=-7.4cm]
  \node[anchor=west] at (-1.0,2.6) {\textbf{(b)} Flat two-level NAND--NAND --- worst path is also the \emph{select} path, $N=3$.};

  \node[not port] (i2) at (1.2,0.1) {};
  \node[nand port, number inputs=3] (n1) at (4.4,1.0) {};
  \node[nand port, number inputs=3, draw=black!45] (n2) at (4.4,-1.1) {};
  \node[nand port, number inputs=4] (n4) at (8.0,0.1) {};

  \draw[crit] (-0.4,0.1) node[anchor=east] {$S_0$} -- (i2.in);
  \draw[crit] (i2.out) -- (2.4,0.1);
  \fill (2.4,0.1) circle (1.4pt);
  \draw[crit] (2.4,0.1) |- (n1.in 3);
  \draw[black!45] (2.4,0.1) |- (n2.in 3);
  \node[anchor=west, text=black!60] at (2.5,-0.3) {$b=2$};

  \draw[black!45] (3.0,1.3) node[anchor=east,text=black!45] {$D_0$} -- (n1.in 1);
  \draw[black!45] (3.0,1.0) node[anchor=east,text=black!45] {$\bar S_1$} -- (n1.in 2);
  \draw[black!45] (3.0,-0.8) node[anchor=east,text=black!45] {$D_1$} -- (n2.in 1);
  \draw[black!45] (3.0,-1.1) node[anchor=east,text=black!45] {$\bar S_1$} -- (n2.in 2);

  \draw[crit] (n1.out) -- (6.4,1.0) |- (n4.in 1);
  \draw[black!45] (n2.out) -- (6.4,-1.1) |- (n4.in 4);
  \draw[black!45] (6.7,0.25) -- (n4.in 2);
  \draw[black!45] (6.7,-0.05) -- (n4.in 3);
  \node[anchor=east, text=black!45, align=right, font=\footnotesize] at (6.65,0.1)
    {other two\\ NAND3};
  \draw[crit] (n4.out) -- (9.6,0.1); \node[anchor=south] at (9.1,0.15) {$Y$};

  \node[anchor=south, text=black!60] at (1.2,0.75) {$2.88\,\tau$};
  \node[anchor=south, text=black!60] at (4.4,1.85) {$4.88\,\tau$};
  \node[anchor=south, text=black!60] at (8.0,0.95) {$5.88\,\tau$};
  \node[anchor=west, text=black!60] at (9.7,0.1) {$\Sigma = 13.6\,\tau$};
  \node[anchor=north west, align=left, text=black!60] at (-1.0,-2.0)
    {$G=1\cdot\tfrac53\cdot2=\tfrac{10}{3}$, $B=2$, $H=1$ $\Rightarrow$ $F=6.67$, $\hat f=F^{1/3}=1.88$;\quad
     $P=1+3+4=8$.};
  \node[anchor=north west, align=left] at (-1.0,-2.8)
    {At $4{:}1$ the flat form is both shallower \emph{and} faster. The fan-in penalty only\\
     overtakes the depth saving further up the family --- see the $16{:}1$ row.};
  \end{scope}
\end{circuitikz}
\end{document}
```

*$w=1$, so every net drawn is 1 bit wide. Bold is the worst-case path; the number above each stage is that stage's $\hat f + p$. My own construction from the numbers below.*

**Separate what the gate is from what it drives.** The unit-gate model — count levels, assume every level costs the same — is wrong in a specific and predictable way: it prices a NAND4 the same as a NAND2. Logical effort repairs this by writing the delay of one stage, in units of $\tau$ (the delay of an inverter driving an identical inverter with no parasitics), as

$$d = f + p = g\,h + p,\qquad h=\frac{C_{\text{out}}}{C_{\text{in}}}$$

$g$, the **logical effort**, is how much worse the gate is than an inverter at delivering current per unit of input capacitance — a pure function of topology, independent of transistor sizing, because sizing a gate up scales $C_{\text{in}}$ and drive strength together and $g$ is their ratio. $h$, the **electrical effort** or fan-out, is the load ratio and is the only term the designer changes by resizing. $p$, the **parasitic delay**, is self-loading from the gate's own drain diffusion and is independent of load: it is what remains when $h\to0$.

**The fan-in penalty is charged twice.** For static CMOS the table below is the standard tabulation; $n$ is the number of inputs.

| Gate | $g$ | $p$ |
| --- | --- | --- |
| INV | $1$ | $1$ |
| NAND2 / NAND3 / NAND$n$ | $\tfrac43$ / $\tfrac53$ / $\tfrac{n+2}{3}$ | $2$ / $3$ / $n$ |
| NOR2 / NOR3 / NOR$n$ | $\tfrac53$ / $\tfrac73$ / $\tfrac{2n+1}{3}$ | $2$ / $3$ / $n$ |
| XOR2 | $4$ | $4$ |
| MUX2 (per data or select input) | $2$ | $4$ |

Both columns grow linearly in $n$, so a wide gate is hit twice — once because its series stack is slower per unit input capacitance, once because its output diffusion is bigger. NOR is worse than NAND at every $n$ because the series stack is PMOS, whose mobility is roughly a third of NMOS. Past $n\approx4$ a tree of narrow gates wins even though the tree is deeper: this is the quantitative reason a wide address decode is split into a [[Predecoder]] plus a narrow final AND, and the reason wide ORs and [[XOR Parity Tree]]s are treed rather than flattened.

**Compose along a path multiplicatively, then minimise.** The path effort of $N$ stages is the product of three independent factors,

$$F = GBH,\qquad G=\prod_{i} g_i,\quad B=\prod_{i} b_i,\quad H=\frac{C_{\text{end}}}{C_{\text{start}}}$$

where the **branching effort** $b_i$ = (on-path $+$ off-path load) / (on-path load) accounts for the capacitance that leaves the path at stage $i$ and therefore has to be driven but contributes no delay of its own. $G$ and $H$ are fixed by the netlist and the environment; sizing redistributes $h_i$ among the stages under the constraint $\prod h_i = BH$. Minimising $D=\sum_i (g_ih_i+p_i)$ subject to that constraint — take $\partial D/\partial h_i$ with a Lagrange multiplier, or observe that the arithmetic mean of the $g_ih_i$ is minimised at fixed geometric mean when they are all equal — gives **equal effort per stage**, $\hat f = F^{1/N}$, and therefore

$$D_{\min} = N F^{1/N} + P,\qquad P=\sum_i p_i$$

Note what does *not* appear: the individual $g_i$. Only their product matters, so moving logical effort between stages is free and only the total counts.

**The optimum stage effort is a constant, and that constant is FO4.** Treat $N$ as continuous in $D_{\min}=NF^{1/N}+Np_{\text{inv}}$ for a chain of inverters and differentiate: $\partial D/\partial N = F^{1/N}(1-\ln F^{1/N}) + p_{\text{inv}} = 0$, which with $p_{\text{inv}}=1$ gives $\hat f \approx 3.6$. Universally rounded to $4$, this is the origin of the **FO4** delay — an inverter driving four copies of itself — as the technology-independent unit in which pipeline depths and cycle times are quoted. The curve around the optimum is very flat: anywhere from $\hat f = 2.4$ to $\hat f = 6$ costs under 15% over the minimum, which is why "aim for fan-out 4, do not agonise" is sound advice.

**Applying it to a 4:1 multiplexer settles the question level-counting cannot.** With $w=1$, unit input capacitance and unit load ($H=1$), design A is a [[Multiplexer Tree]] of three MUX2s (11 gates, 20 gate-inputs) and design B is the flat two-level cover $Y=D_0\bar S_1\bar S_0 + D_1\bar S_1S_0 + D_2S_1\bar S_0 + D_3S_1S_0$ built NAND-NAND (4 NAND3 $+$ 1 NAND4 $+$ 2 INV $=$ 7 gates, 18 gate-inputs). B is two levels deep, A is four. Evaluating the four paths that reach $Y$:

| path | $N$ | $G$ | $B$ | $F$ | $\hat f$ | $P$ | $D_{\min}$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A, data $D_i\to$ MUX $\to$ MUX | $2$ | $2\cdot2=4$ | $1$ | $4$ | $2$ | $4{+}4=8$ | $12\,\tau$ |
| A, select $S_0\to$ INV $\to$ MUX $\to$ MUX | $3$ | $1\cdot2\cdot2=4$ | $2$ | $8$ | $2$ | $1{+}4{+}4=9$ | $\mathbf{15\,\tau}$ |
| B, data $D_i\to$ NAND3 $\to$ NAND4 | $2$ | $\tfrac53\cdot2=\tfrac{10}{3}$ | $1$ | $3.33$ | $1.83$ | $3{+}4=7$ | $10.7\,\tau$ |
| B, select $S_0\to$ INV $\to$ NAND3 $\to$ NAND4 | $3$ | $1\cdot\tfrac53\cdot2=\tfrac{10}{3}$ | $2$ | $6.67$ | $1.88$ | $1{+}3{+}4=8$ | $\mathbf{13.6\,\tau}$ |

Both worst paths are select paths, and both carry $b=2$ because one shared inverter feeds two second-stage gates. At $4{:}1$ the flat form wins on both comparisons — data against data, worst against worst. Four inputs is simply not wide enough for the fan-in penalty of a NAND4 ($g=2$, $p=4$) to overtake two whole MUX2 stages at $p=4$ each.

> [!warning] The long-form note draws the opposite conclusion, and the comparison behind it is not like-for-like
> [[0.2) Combinational Logic]] reports "B is $13.6\,\tau$ against A's $12\,\tau$", i.e. the flat design is shallower and slower. That compares **B's select path against A's data path**. Its expression for A's select path, $F=(1)(2)(2)(1)=4$ with $P=1+4=5$, contains only two stages and stops at the level-1 mux output — it never reaches $Y$. Carried through the second mux the same way B's is carried through the NAND4, A's select path is $F=8$, $P=9$, $D_{\min}=15\,\tau$. On any consistent comparison the flat $4{:}1$ mux is the faster one.

**The inversion is real, it just happens further up the family.** Compare data paths only, so the two designs are measured the same way, and sweep the mux width. A $2^n{:}1$ tree is $n$ MUX2 stages, $G=2^n$, $P=4n$; the flat form is one NAND$(n{+}1)$ into one NAND$2^n$.

| | $4{:}1$ | $8{:}1$ | $16{:}1$ |
| --- | --- | --- | --- |
| tree, depth | $2$ | $3$ | $4$ |
| tree, $D_{\min}$ | $12\,\tau$ | $18\,\tau$ | $24\,\tau$ |
| flat, depth | $2$ | $2$ | $2$ |
| flat, $D_{\min}$ | $10.7\,\tau$ | $17.2\,\tau$ | $28.5\,\tau$ |

The crossover sits between $8{:}1$ and $16{:}1$. At $16{:}1$ the tree is twice as deep and $4.5\,\tau$ faster, because the flat form's $P$ alone is $5+16=21\,\tau$ — a 16-input NAND's parasitic delay is 16 inverters' worth, and no amount of sizing touches $P$. That is the honest statement of the lesson: level counting is not merely imprecise, it has the wrong sign in a regime you can locate exactly by computing $F$ and $P$.

$$\boxed{\ d = g\,h + p,\qquad D_{\min} = N F^{1/N} + P,\qquad F=GBH\ }$$

**On an FPGA the model is scaffolding under the abstraction, not a design tool.** A $4{:}1$ mux has $4+2=6$ inputs and fits one LUT6 exactly, so designs A and B are the *same* circuit after technology mapping and arguing about NAND4s is arguing about a netlist the mapper deleted. What survives the port to [[FPGAs]] is only the shape of the argument: the LUT's cost is a step function of *support size*, so the quantity to minimise is the number of inputs feeding each logic cone, not $g$ and $p$. A 6-input XOR is one LUT, making a parity tree $\lceil\log_6 w\rceil$ levels where the ASIC version pays $g=4$ per XOR2 — the same function, opposite optimisation.

**When it breaks.**

- **Large $H$ or long wires.** $h=C_{\text{out}}/C_{\text{in}}$ assumes the load is gate capacitance. A long interconnect adds an $RC$ term that is quadratic in length and not in the model at all; at that point buffer insertion is a wire problem, not a logic problem.
- **$N$ far from optimal.** $D_{\min}=NF^{1/N}+P$ assumes you may size freely. If $N$ is fixed and $F^{1/N}$ lands far above $\sim6$, the linear model understates delay badly — the real gate is slew-limited, and $d=gh+p$ has no slew term.
- **Skewed and dynamic logic.** $g$ and $p$ above are for static CMOS with equal rise and fall. Domino, skewed-static and pass-gate families have their own $g$ tables; a [[Transmission-Gate Multiplexer]] is not on this table at all, because a pass gate is not a restoring stage and its delay is quadratic in the number chained.
- **Arrival times are not equal.** The whole path calculus assumes all inputs to a stage arrive together. When selects arrive early — the usual case, since they come from a decoder or a control register — the select paths above are not critical and the ranking can flip back.
- **Below the LUT boundary.** On an FPGA it stops predicting anything, as above.
- **Area, power and glitching are outside it.** The model has no term for either. Two netlists with equal $D_{\min}$ can differ by 2x in switching energy, and neither $g$ nor $p$ tells you whether a cover is hazard-free — that is [[Hazard-Free Two-Level Cover]]'s question, and the answer generally costs area the delay model will not charge you for.

**RTL (Spade): `n/a`.** Logical effort prices a netlist; it does not describe one. There is nothing to synthesise — and the point is sharper than that, because designs A and B are the *same* Spade source (`if s { .. } else { .. }` or a match on the select), differing only in what the synthesiser is asked to build from it. The model lives strictly below the RTL abstraction, in the technology mapper and the sizer.

**Related notes.**

- [[Multiplexer Tree]] – supports: the design A above; logical effort is what tells you when its logarithmic depth actually pays.
- [[One-Hot Multiplexer]] – compares: trades the select tree for a decoded AND-OR, moving the branching effort $B$ from the mux into the decoder.
- [[Predecoder]] – extends: the direct application of the fan-in penalty — split a wide AND into two narrow levels precisely because $g$ and $p$ both grow with $n$.
- [[XOR Parity Tree]] – supports: the $g=4$ of XOR2 is the reason parity is expensive on an ASIC and free on a LUT.
- [[Transmission-Gate Multiplexer]] – counter-example: a non-restoring structure whose delay is quadratic in stages, outside this model entirely.
- [[Hazard-Free Two-Level Cover]] – compares: the other cost of a netlist, which $d=gh+p$ says nothing about.
- [[Choosing a Combinational Block]] – compares: where the delay numbers here sit against area and glitch energy.
- [[Combinational Logic]] – depends-on: propagation and contamination delay, and the critical-path definition this model quantifies.

## References

Established digital-design canon; no page numbers, since this note has no assigned book source.

- $g$, $p$, $\hat f = F^{1/N}$, branching effort, and the FO4 optimum — Sutherland, Sproull & Harris, *Logical Effort: Designing Fast CMOS Circuits*, chs. 1-3; Weste & Harris, *CMOS VLSI Design*, ch. 4.
- Two-level covers, mux trees, and the NAND-NAND transform — Mano & Ciletti, *Digital Design*, chs. 3-4; Wakerly, *Digital Design: Principles and Practices*, ch. 6.
- Long-form source for the worked example and the gate/transistor counts — [[0.2) Combinational Logic]], §§ *Fan-in, fan-out and logical effort*, *Worked example: a 4:1 multiplexer, two ways*, *FPGA mapping*. Its Design A select-path figure is corrected above.
