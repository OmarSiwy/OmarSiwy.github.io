---
title: Pipelined Adder Graph
description: "Registers an MCM graph for throughput and minimises the balancing flops that then dominate cost — four registers instead of nine for {23,43}."
kind: circuit
source: "ASA §12.5.1.2, pp. 405-407"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, mcm, pipelining, fpga]
aliases:
  - PAG
  - Pipelined Adder Graphs
  - PMCM
  - Pipelined Multiple Constant Multiplication
  - RPAG
---

# Pipelined Adder Graph

An [[Multiple Constant Multiplication|MCM]] adder graph cut into clock stages, distinguished from every other constant-multiplier structure by the fact that its dominant cost is not the adders but the *registers* that hold values alive between stages.

```tikz title="ASAP-pipelined Hcub graph versus an RPAG graph for {23,43}: same four adders, nine registers against four"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  ad/.style={draw, circle, inner sep=0pt, minimum size=0.44cm},
  rg/.style={draw, fill=black!12, minimum width=0.40cm, minimum height=0.18cm, inner sep=0pt},
  st/.style={dashed, gray},
  w/.style={font=\tiny, inner sep=1pt}
]

%%%%%%%%%%%%%%%%%%%%%%%%%%%% left panel: ASAP-pipelined Hcub %%%%%%%%%%%%%%%%%%%
\draw[st] (-0.25,5.4) -- (3.75,5.4);
\draw[st] (-0.25,3.8) -- (3.75,3.8);
\draw[st] (-0.25,2.2) -- (3.75,2.2);
\draw[st] (-0.25,0.6) -- (3.75,0.6);

\node at (2.0,7.5) {$X$};
\node[w,anchor=west] at (2.06,7.0) {$w$};
\draw (2.0,7.3) -- (2.0,6.6);
\draw (0.4,6.6) -- (3.2,6.6);

\node[ad] (a1) at (1.2,6.0) {$+$};
\draw (0.4,6.6) -- (0.4,6.0) -- (a1.west);
\draw (2.0,6.6) -- (2.0,6.0) -- (a1.east);
\node[w] at (0.62,6.35) {$\ll 3$};
\node[w] at (1.55,6.22) {$-$};

\node[rg] (r7) at (1.2,5.4) {};
\draw (a1.south) -- (r7.north);
\node[rg] (rx) at (3.2,5.4) {};
\draw (3.2,6.6) -- (rx.north);
\node[w] at (3.42,6.15) {$\ll 4$};

\node[ad] (a2) at (2.1,4.4) {$+$};
\draw (r7.south) -- (1.2,4.4) -- (a2.west);
\draw (rx.south) -- (3.2,4.4) -- (a2.east);
\node[w,anchor=west] at (1.26,4.90) {$7X$, $w{+}3$};
\draw (1.2,5.05) -- (0.4,5.05) -- (0.4,3.8);
\node[rg] (b7a) at (0.4,3.8) {};
\node[rg] (b7b) at (0.4,2.2) {};
\draw (b7a.south) -- (b7b.north);

\node[rg] (r23) at (2.1,3.8) {};
\draw (a2.south) -- (r23.north);
\node[w,anchor=west] at (2.18,3.57) {$23X$, $w{+}5$};

\node[ad] (a3) at (1.5,2.8) {$+$};
\draw (r23.south) -- (2.1,2.8) -- (a3.east);
\draw (2.1,3.35) -- (0.95,3.35) -- (0.95,2.8) -- (a3.west);
\node[w] at (1.17,3.13) {$\ll 1$};
\draw (2.1,3.35) -- (3.2,3.35) -- (3.2,2.2);
\node[rg] (b23a) at (3.2,2.2) {};
\node[rg] (b23b) at (3.2,0.6) {};
\draw (b23a.south) -- (b23b.north);

\node[rg] (r69) at (1.5,2.2) {};
\draw (a3.south) -- (r69.north);
\node[w,anchor=west] at (1.58,1.86) {$69X$, $w{+}7$};

\node[ad] (a4) at (0.9,1.2) {$+$};
\draw (b7b.south) -- (0.4,1.2) -- (a4.west);
\draw (r69.south) -- (1.5,1.2) -- (a4.east);
\node[w] at (0.62,1.55) {$\ll 4$};
\node[w] at (1.26,1.42) {$-$};

\node[rg] (r43) at (0.9,0.6) {};
\draw (a4.south) -- (r43.north);
\draw[-latex] (r43.south) -- (0.9,0.05);
\draw[-latex] (b23b.south) -- (3.2,0.05);
\node[w] at (0.9,-0.22) {$43X$, $w{+}6$};
\node[w] at (3.2,-0.22) {$23X$, $w{+}5$};

\node[font=\scriptsize] at (1.75,-0.75) {(a) ASAP-pipelined $\mathrm{H_{cub}}$: 4 adders, 9 registers};
\node[font=\scriptsize] at (1.75,-1.1) {(5 of them purely balancing)};

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% right panel: RPAG PAG %%%%%%%%%%%%%%%%%%%%%%%%%%%
\draw[st] (6.7,2.6) -- (10.0,2.6);
\draw[st] (6.7,0.6) -- (10.0,0.6);

\node at (8.4,4.7) {$X$};
\node[w,anchor=west] at (8.46,4.2) {$w$};
\draw (8.4,4.5) -- (8.4,3.8);
\draw (7.0,3.8) -- (9.8,3.8);

\node[ad] (p1) at (7.5,3.2) {$+$};
\draw (7.0,3.8) -- (7.0,3.2) -- (p1.west);
\draw (8.0,3.8) -- (8.0,3.2) -- (p1.east);
\node[w] at (7.22,3.55) {$\ll 1$};

\node[ad] (p2) at (9.3,3.2) {$+$};
\draw (8.8,3.8) -- (8.8,3.2) -- (p2.west);
\draw (9.8,3.8) -- (9.8,3.2) -- (p2.east);
\node[w] at (9.02,3.55) {$\ll 2$};

\node[rg] (q3) at (7.5,2.6) {};
\node[rg] (q5) at (9.3,2.6) {};
\draw (p1.south) -- (q3.north);
\draw (p2.south) -- (q5.north);
\node[w,anchor=east] at (7.38,2.25) {$3X$, $w{+}2$};
\node[w,anchor=west] at (9.42,2.25) {$5X$, $w{+}3$};

\draw (q3.south) -- (7.5,1.95) -- (9.62,1.95);
\draw (q5.south) -- (9.3,1.70) -- (8.15,1.70);

\node[ad] (p3) at (7.8,1.2) {$+$};
\node[ad] (p4) at (9.2,1.2) {$+$};

\draw (7.58,1.95) -- (7.58,1.2) -- (p3.west);
\draw (8.15,1.70) -- (8.15,1.2) -- (p3.east);
\node[w,anchor=west] at (8.20,1.55) {$\ll 3$};

\draw (8.85,1.70) -- (8.85,1.2) -- (p4.west);
\draw (9.62,1.95) -- (9.62,1.2) -- (p4.east);
\node[w,anchor=east] at (8.80,1.32) {$\ll 2$};

\node[rg] (o43) at (7.8,0.6) {};
\node[rg] (o23) at (9.2,0.6) {};
\draw (p3.south) -- (o43.north);
\draw (p4.south) -- (o23.north);
\draw[-latex] (o43.south) -- (7.8,0.05);
\draw[-latex] (o23.south) -- (9.2,0.05);
\node[w] at (7.8,-0.22) {$43X$, $w{+}6$};
\node[w] at (9.2,-0.22) {$23X$, $w{+}5$};

\node[font=\scriptsize] at (8.5,-0.75) {(b) RPAG: 4 adders, 4 registers};
\node[font=\scriptsize] at (8.5,-1.1) {(no balancing, depth 2)};

\end{circuitikz}
\end{document}
```

*after Fig. 12.20 b–c, p. 406.*

**Cut a feed-forward DAG anywhere and the function survives.** An adder graph has no cycles: every node is a fresh value $c_uX$ derived from earlier ones by an $\mathcal A$-operation $c_u=|2^{l_1}c_a\pm2^{l_2}c_b|/2^{l_3}$. Inserting a register on every edge that crosses a chosen cut therefore changes nothing but latency — there is no loop for the delay to accumulate around. The clock period drops from the sum of the adder delays along the deepest path to the delay of the single slowest adder, so throughput becomes independent of the graph's depth. The cost of that freedom is one register *word* per value per stage boundary it crosses, and those words are wide: for $X$ unsigned on $w$ bits, $cX$ needs $w+\lceil\log_2 c\rceil$ bits, so $3X$ is $w{+}2$, $5X$ and $7X$ are $w{+}3$, $23X$ is $w{+}5$, $43X$ is $w{+}6$ and $69X$ is $w{+}7$.

**ASAP scheduling makes the register count a function of the graph's shape, not its size.** Give every node a stage $s(u)$: $s(X)=0$ and $s(a)=1+\max s(\text{inputs})$ for an adder, the earliest legal placement. Let $S=\max_a s(a)$ and let $\sigma(u)$ be the last stage at which $u$ is consumed, counting a target output as consumed at $S+1$ so that all outputs leave the operator together. A value produced at $s(u)$ and consumed at $\sigma(u)$ occupies a register at each of the $\sigma(u)-s(u)$ boundaries in between. One of those — the boundary immediately after the adder — is the pipeline register you were buying; every further one is a *balance* register, paid purely because the consumer sits deeper than the producer. Deep, irregular graphs pay a lot of them.

**The $\{23,43\}$ example makes the tax explicit.** $\mathrm H_{\mathrm{cub}}$ finds the four-adder chain of panel (a): $7X=2^3X-X$ at stage 1, $23X=7X+2^4X$ at stage 2, $69X=23X+2\cdot23X$ at stage 3, and $43X=2^4\cdot7X-69X$ at stage 4, so $S=4$. Now count. $X$ is consumed at stages 1 and 2, so $\sigma(X)=2$ and — taking $X$ to arrive already registered from upstream — it needs $1$ extra register. $7X$ is born at 1 and last consumed at 4: $3$ registers, $2$ of them balance. $23X$ is born at 2, feeds $69X$ at 3, and must still be presented at $S+1=5$ alongside $43X$: $3$ registers, $2$ balance. $69X$ and $43X$ need $1$ each, neither balancing. Total $9$, of which $5$ exist only to balance — the book's numbers exactly (p. 406). In flip-flops at $w=8$ that is $8+3\cdot11+3\cdot13+15+14=109$.

**RPAG buys the same four adders with a graph that has nothing to balance.** Panel (b) realises $3X=X+2X$ and $5X=X+4X$ in stage 1, then $43X=2^3\cdot5X+3X$ and $23X=2^2\cdot5X+3X$ in stage 2. Every value is consumed exactly one stage after it is produced, so $\sigma(u)-s(u)=1$ throughout and the balance term vanishes *identically*, not by luck: $N_B=0$, $N_R=N_A=4$. At $w=8$ that is $10+11+14+13=48$ flip-flops against $109$, a $2.3\times$ reduction at unchanged adder count and with the logic depth cut from $4$ to $2$. The reason a post-hoc schedule cannot reach this is that the adder count and the register count are optimised against each other: minimising adders first fixes a shape, and no scheduler can un-fix it. Finding the optimal schedule for a *given* graph is already its own problem (KZ11); optimising graph and schedule jointly is the **pipelined MCM (PMCM)** problem, and RPAG is the heuristic that emits pipelined adder graphs directly rather than pipelining an MCM solution afterwards (p. 405).

**On FPGAs the four registers are free and the five balance registers are not.** Every LUT in a Xilinx or Intel slice has a companion flip-flop on its output; an adder mapped onto the fast carry chain leaves those flip-flops unused, so registering an adder's result costs no extra resource at all (p. 406, and see [[Lookup-Tables]]). That immediately reclassifies the two designs: panel (b)'s registers are *all* adder outputs and cost nothing, while three of panel (a)'s five balance registers sit on wires with no adder to share a slice with, and must consume LUTs of their own — or be pushed into SRL-mode shift registers, which is why long balance chains are cheaper than short ones on Xilinx parts. On ASICs there is no such subsidy: every flip-flop is real area and real clock power, and the alternative lever for speed is to keep the graph shallow with carry-save arithmetic instead. That is not a drop-in substitution — there is no 1:1 mapping from a CPA-based adder graph to a CSA one, since some CPAs collapse to wires while others need two CSAs, so CSA graphs need their own optimisation algorithms (p. 407). See [[Carry-Save Adder]].

$$\boxed{\;N_R=N_A+N_B,\qquad N_B=\big(\sigma(X)-1\big)+\sum_{a\in A}\big(\sigma(a)-s(a)-1\big)\;}$$

with $\sigma(u)=\max\{s(v):v\in\operatorname{succ}(u)\}$, outputs counted as consumed at $S+1$. Cost in flip-flops is $\sum_u\big(\sigma(u)-s(u)\big)\big(w+\lceil\log_2c_u\rceil\big)$ — a register on $69X$ is $40\%$ more expensive than one on $3X$, so *which* value you strand across stages matters as much as how many.

> [!important]
> Adder count and register count are not two views of one cost. The $\{23,43\}$ pair has minimum-adder solutions with $9$ registers and with $4$; choosing the graph *before* choosing the schedule throws that factor away, and no amount of retiming gets it back.

**When it breaks.** If throughput is not the binding constraint the registers are pure overhead and an unpipelined [[Minimum-Adder Constant Multiplier|minimum-adder graph]] wins outright. If the graph is fixed — a vendor IP block, or a shape forced by a shared sub-expression elsewhere — you are reduced to optimal scheduling on that shape and the factor above is unavailable. On ASIC the free-flip-flop argument collapses and the trade tilts back towards carry-save. Feedback kills the whole method: an adder graph inside a recursive filter sits on a loop whose iteration bound caps the pipeline depth, and the book defers recursive SOPC entirely (p. 414). And PMCM is harder than MCM, which is already NP-complete, so the search cost grows faster than the coefficient word size — for wide constants or large target sets you take whatever the heuristic returns.

> [!warning] Fig. 12.20b draws eight registers, the text says nine
> The register on the $23X$ output path at the third stage boundary is missing from the figure — the vertical wire crosses the third dashed line with no box on it. The text's count of "nine additional registers … five … to balance" (p. 406) is the consistent one and is what the schedule requires; the diagram above restores the missing box.

> [!warning] RPAG's search is not described in this chapter
> The book gives RPAG's *output* (Fig. 12.20c) and its motivation, but not the algorithm; it cites [Kum+12; Kum15] for that and [Kum+13a] for optimal ILP-based PMCM (p. 405). The claim above that RPAG's construction makes $N_B=0$ *identically* is read off the figure's structure, not from a stated invariant of the algorithm — treat it as a property of this solution until the primary sources are checked.

```spade
/// One pipeline stage per adder level of the RPAG graph for {23, 43}.
pipeline(2) pag_23_43<#uint W>(clk: clock, x: uint<W>)
    -> (uint<{W + 5}>, uint<{W + 6}>)
{
        // stage 0 -- the two shared fundamentals
        let x2: uint<{W + 2}> = zext(x);
        let x3: uint<{W + 2}> = trunc(x2 + (x2 << 1));     // 3X  = X + 2X
        let x5w: uint<{W + 3}> = zext(x);
        let x5: uint<{W + 3}> = trunc(x5w + (x5w << 2));   // 5X  = X + 4X
    reg;
        // stage 1 -- both outputs, same depth, no balancing
        let a23: uint<{W + 5}> = zext(x5);
        let b23: uint<{W + 5}> = zext(x3);
        let y23: uint<{W + 5}> = trunc((a23 << 2) + b23);  // 23X = 4*5X + 3X
        let a43: uint<{W + 6}> = zext(x5);
        let b43: uint<{W + 6}> = zext(x3);
        let y43: uint<{W + 6}> = trunc((a43 << 3) + b43);  // 43X = 8*5X + 3X
    reg;
        (y23, y43)
}
```

The two `reg;` markers *are* the two dashed lines of panel (b): the first holds `x3` and `x5`, the second holds the two outputs, and because no name is read more than one stage after it is written, Spade inserts no balance registers — write the $\mathrm H_{\mathrm{cub}}$ graph the same way and it would silently insert five. Widths follow the diagram: `+` grows by one bit, and truncating $3X$ back to $w{+}2$ and $23X$ back to $w{+}5$ is safe because $3(2^w-1)<2^{w+2}$ and $23(2^w-1)<2^{w+5}$. Synthesis will build none of the shifts — a constant `<<` is wiring — and will fuse each `zext`/shift/`+` triple into one carry chain, so the drawing's four adder symbols are four carry chains of $w{+}2$, $w{+}3$, $w{+}5$ and $w{+}6$ bits.

Simulated with `.zettel/sim.sh` against a behavioural $23X$/$43X$ reference: 3010 checks — 3000 random plus ten named vectors including the deliberately asymmetric $X=1$, $X=128$, $X=3$ and $X=173$, which would separate the two outputs if the tuple packing or either shift were wrong — zero mismatches.

**Related notes.**

- [[Multiple Constant Multiplication]] – extends: this is that adder graph with a schedule and registers on it, and the register term added to its objective.
- [[Carry-Save Adder]] – compares: the ASIC lever for the same speed, with no 1:1 mapping from a CPA adder graph to a CSA one.
- [[Lookup-Tables]] – supports: the companion flip-flop on every LUT output is exactly why the four registers of panel (b) cost nothing.
- [[Minimum-Adder Constant Multiplier]] – counter-example: minimising adders first is what produces the nine-register shape.
- [[Choosing a Constant Multiplier]] – compares: where a pipelined graph sits against the tabulated and DSP-based alternatives.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §12.5.1.2 "Pipelined Multiple Constant Multiplication", PMCM problem statement, RPAG, ASAP register count for $\{23,43\}$, FPGA free-register argument, CSA remark — Fig. 12.20, pp. 405–407.
- §12.5.1 MCM heuristics ($\mathrm H_{\mathrm{cub}}$, DiffAG) that supply the graph being pipelined — pp. 403–404.
- §12.5.5 "Filters and SOPC" box, recursion deferred to Chap. 23 — p. 414.
