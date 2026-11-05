---
title: Layout Automation
description: Analog placement and routing as constrained optimisation, written for someone building the tool - constraint types and what a tool must guarantee, generators and templates, slicing trees, sequence pairs and B*-trees with symmetry, annealing and cost functions, sensitivity-driven placement and routing, symmetric and shielded routing, layout-aware sizing, LDE-aware placement, ML, and what is still open.
kind: topic
status: growing
aliases:
  - Layout Automation
  - Analog Layout Automation
  - Analog Layout Synthesis
  - Placement and Routing
---

This note treats analog layout as what it is for a tool: a search over geometry under constraints that come from circuit theory. It starts with the whole flow on one screen, then lists what a tool must guarantee for each constraint type, then goes one level deeper per section: generators, placement representations, optimisation, performance-driven placement and routing, routing techniques, layout in the sizing loop, and finally LDEs, constraint-driven flows, ML and the open problems. Stop after any section and you still have a correct, coarser picture of how an analog P&R tool works.

> [!tip] Remark
> This is the layout stage of the owner's flow, [[Analog Design Flow#Stage 4. Layout]]: generators first, free-form P&R (Philis, in the ALIGN and MAGICAL lineage) as an optional pass, constraints as check scripts. This note is the theory behind those decisions; each section ends its tool-relevant point in a Remark.

## The big picture

```tikz title="The analog layout flow a tool implements: constraints and sensitivities from the netlist, then generation, placement and routing, then extraction and a check against the layout margin. After Lampaert Fig. 1.9 and Xu et al. Fig. 1."
\usepackage{circuitikz}
\usetikzlibrary{fit}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=1.3cm,text width=2.6cm,font=\scriptsize}]
  \node[blk,fill=yellow!15] (in) at (0,0) {\textbf{netlist + specs}\\ sized devices,\\ $P\in[P_{min},P_{max}]$};
  \node[blk,fill=green!12] (con) at (3.4,0) {\textbf{constraints}\\ structure recognition,\\ sensitivities $\partial P/\partial x$};
  \node[blk,fill=orange!15] (gen) at (6.8,0) {\textbf{device generation}\\ Pcells, module\\ generators, variants};
  \node[blk,fill=blue!10] (pl) at (10.2,0) {\textbf{placement}\\ representation + SA;\\ cost: area, $\Delta P$};
  \node[blk,fill=violet!12] (rt) at (13.6,0) {\textbf{routing}\\ symmetric, shielded,\\ sensitivity A*};
  \node[blk,fill=gray!15] (ver) at (13.6,-2.7) {\textbf{extract + simulate}\\ DRC, LVS, PEX,\\ post-layout benches};
  \node[blk,fill=red!8] (ok) at (10.2,-2.7) {\textbf{inside margin?}\\ $P_{proc}+\Delta P_{lay}$\\ $\in[P_{min},P_{max}]$};
  \node[blk,fill=green!20] (done) at (6.8,-2.7) {\textbf{sign-off}};
  \draw[->,thick] (in) -- (con); \draw[->,thick] (con) -- (gen); \draw[->,thick] (gen) -- (pl); \draw[->,thick] (pl) -- (rt); \draw[->,thick] (rt) -- (ver); \draw[->,thick] (ver) -- (ok);
  \draw[->,thick] (ok) -- node[above,font=\scriptsize] {yes} (done);
  \draw[->,thick,dashed,red!70!black] (ok.south) -- ++(0,-0.5) -| node[pos=0.25,below,font=\scriptsize] {no: re-place, re-route, or re-size with the parasitics carried back} (in.south);
  \node[draw,dashed,rounded corners,fit=(gen) (pl) (rt),inner sep=5pt] (box) {};
  \node[font=\scriptsize,anchor=south] at (box.north) {what a layout tool owns: procedural/template, optimisation P\&R, or retargeting};
\end{circuitikz}
\end{document}
```

```tikz title="Why placement decides performance: the same five devices scattered (left) and as a symmetry island (right). Layer legend as in CMOS Processing. After Lin and Chang Fig. 2.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70}]
  % macro-like drawing: device at (x,y) of 1.6 x 1.0 with 3 poly fingers
  \newcommand{\dev}[4]{% x y style label
    \draw[#3] (#1,#2) rectangle ++(1.6,1.0);
    \foreach \f in {0.35,0.75,1.15} {\draw[poly] ({#1+\f},{#2-0.12}) rectangle ++(0.12,1.24);}
    \node[font=\scriptsize\bfseries,fill=white,inner sep=1pt] at ({#1+0.8},{#2+0.5}) {#4};}
  % ---------- BAD ----------
  \node[font=\bfseries] at (2.9,6.0) {bad: scattered};
  \draw[nwell] (3.6,3.8) rectangle (5.8,5.2);
  \draw[nwell] (-0.2,-0.2) rectangle (2.0,1.2);
  \dev{3.9}{4.0}{pdiff}{M3}
  \dev{0.1}{0.0}{pdiff}{M4}
  \dev{0.1}{3.6}{ndiff}{M1}
  \dev{4.1}{0.2}{ndiff}{M2}
  \dev{2.2}{2.0}{ndiff}{M5}
  \draw[<->,red!70!black,thick] (0.9,3.45) -- (4.9,1.35) node[pos=0.8,above right,font=\scriptsize] {$D$ large};
  \node[font=\scriptsize,align=center,red!70!black] at (2.9,-0.8) {pair far apart: $\sigma^2(\Delta V_T)=\frac{A^2}{WL}+S^2D^2$ grows;\\ no common axis: routes cannot be mirrored};
  % ---------- GOOD ----------
  \begin{scope}[xshift=8.0cm]
  \node[font=\bfseries] at (2.0,6.0) {good: symmetry island};
  \draw[nwell] (0.1,3.8) rectangle (3.9,5.2);
  \dev{0.3}{4.0}{pdiff}{M3}
  \dev{2.1}{4.0}{pdiff}{M4}
  \dev{0.3}{2.4}{ndiff}{M1}
  \dev{2.1}{2.4}{ndiff}{M2}
  \dev{1.2}{0.8}{ndiff}{M5}
  \draw[dashed,thick] (2.0,0.3) -- (2.0,5.5);
  \node[font=\scriptsize,anchor=west] at (2.05,0.45) {axis $\hat x$};
  % mirrored M1 routes: M1->M3 and M2->M4 drains, M2 tail bus
  \draw[mone] (0.40,3.4) rectangle (0.56,4.0);
  \draw[mone] (3.44,3.4) rectangle (3.60,4.0);
  \foreach \x in {0.40,3.44} {\draw[cont] (\x+0.03,3.45) rectangle ++(0.1,0.1); \draw[cont] (\x+0.03,3.85) rectangle ++(0.1,0.1);}
  \draw[mtwo] (0.9,2.05) rectangle (3.1,2.22);
  \draw[mtwo] (1.92,1.8) rectangle (2.08,2.22);
  \node[font=\scriptsize,anchor=west] at (3.95,3.7) {mirrored M1};
  \node[font=\scriptsize,anchor=west] at (3.95,2.13) {tail on M2};
  \node[font=\scriptsize,align=center,green!40!black] at (2.0,-0.6) {$x_j+x_j'=2\hat x$, $y_j=y_j'$; M5 self-symmetric ($x_5=\hat x$);\\ pairs abut, so $D$ is one device pitch};
  \end{scope}
  % ---------- legend ----------
  \begin{scope}[xshift=14.9cm,yshift=1.0cm]
  \node[anchor=west,font=\scriptsize\bfseries] at (0,4.3) {legend};
  \foreach \y/\s/\t in {3.8/ndiff/{n+ diffusion},3.3/pdiff/{p+ diffusion},2.8/poly/{poly},2.3/nwell/{n-well},1.8/mone/{metal 1},1.3/mtwo/{metal 2},0.8/cont/{contact / via}} {
    \draw[\s] (0,\y-0.15) rectangle (0.45,\y+0.15);
    \node[anchor=west,font=\scriptsize] at (0.55,\y) {\t};}
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Analog P&R is constrained optimisation.** Hard constraints (symmetry, equal orientation and variant, DRC) are built into the representation or the move set so that every candidate obeys them; soft goals (area, wire length, performance) go into the cost. A hard constraint left in the cost gets traded away.
> 2. **The layout budget is a number.** After sizing and process variation, each performance $P$ has a layout margin $\Delta P_{lay}\in[P_{min}-P^{min}_{proc},\ P_{max}-P^{max}_{proc}]$, and to first order $\Delta P_j=\sum_i S^{P_j}_{x_i}x_i$ over the layout parasitics $x_i$ (wire $R$, $C$, coupling, matched-pair distance, temperature difference).
> 3. **The representation sets the search space.** $n$ blocks have $(n!)^2$ sequence pairs; restricting to symmetric-feasible pairs leaves at most $(n!)^2/\prod_k(2p_k+s_k)!$ (99.86 % fewer for 7 cells with one 4-cell group), and an ASF-B*-tree packs a symmetry island in $O(n)$.
> 4. **An analog router minimises performance loss, not length.** Path cost is the sensitivity-weighted parasitic it adds, searched with A*; symmetric nets are routed once and mirrored, with design rules checked on both sides.
> 5. **Generators are predictable, optimisers are general, and neither knows post-layout performance.** There is no analog equivalent of static timing; evaluating a layout means extraction and simulation, which dominates the cost of every learned model (92.89 % of the lifecycle in one OTA study).

**Map:** [[#What a tool must guarantee|guarantees per constraint]] → [[#Level 0 Why Analog P&R Is Hard|why it is hard]] → [[#Level 1 Generators, Templates and Retargeting|generators and templates]] → [[#Level 2 Placement Representations|slicing, sequence pair, B*-tree]] → [[#Level 3 Optimisation|annealing and cost]] → [[#Level 4 Performance-Driven Placement and Routing|sensitivities and margins]] → [[#Level 5 Analog Routing|symmetric, shielded, sized routing]] → [[#Level 6 Layout in the Sizing Loop|layout-aware sizing]] → [[#Level 7 LDEs, Constraint-Driven Flows and ML|LDE, constraints, ML]] → [[#Open problems|open problems]].

## What a tool must guarantee

This is a layout note, not a circuit block, so there is no spec translation. In its place: for each constraint type, what the tool must guarantee, how a tool enforces it, and how a check script verifies it afterwards (DRC and LVS see none of these). Constraint generation, the step that produces these from a netlist, comes first.

```tikz title="Constraint generation: building blocks and symmetry analysis fill a graph of requirements, merged in importance order into a tree of groups that a placer can enforce. After Strasser et al. Figs. 3.6-3.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  dv/.style={circle,draw,thick,fill=white,minimum size=0.75cm,inner sep=0pt,font=\scriptsize\bfseries},
  grp/.style={draw,thick,rounded corners=2pt,font=\scriptsize,align=center,inner sep=2pt}]
  \node[font=\bfseries] at (2.4,4.3) {SMP graph (requirements)};
  \node[dv] (P1) at (1.2,3.2) {P1}; \node[dv] (P2) at (3.6,3.2) {P2};
  \node[dv] (N3) at (0.0,1.0) {N3}; \node[dv] (N1) at (1.6,1.0) {N1};
  \node[dv] (N2) at (3.2,1.0) {N2}; \node[dv] (N4) at (4.8,1.0) {N4};
  \draw[red!70!black,very thick] (P1) -- (P2);
  \draw[red!70!black,very thick] (N1) to[bend right=35] (N2);
  \draw[red!70!black,very thick] (N3) to[bend right=40] (N4);
  \draw[blue!70!black,very thick,densely dotted] (P1) to[bend left=20] (P2);
  \draw[blue!70!black,very thick,densely dotted] (N1) -- (N3);
  \draw[blue!70!black,very thick,densely dotted] (N2) -- (N4);
  \draw[green!50!black,thick,dashed] (P1) -- (N1); \draw[green!50!black,thick,dashed] (P2) -- (N2);
  \draw[gray,thin] (P1) -- (N3); \draw[gray,thin] (P2) -- (N4);
  % legend
  \begin{scope}[yshift=-0.9cm]
  \draw[red!70!black,very thick] (-0.3,-0.4) -- (0.3,-0.4) node[right,font=\scriptsize,black] {$M_S$ matching from symmetry};
  \draw[blue!70!black,very thick,densely dotted] (-0.3,-0.8) -- (0.3,-0.8) node[right,font=\scriptsize,black] {$M_B$ matching inside a building block (mirror, pair)};
  \draw[green!50!black,thick,dashed] (-0.3,-1.2) -- (0.3,-1.2) node[right,font=\scriptsize,black] {$S$ symmetry (shared axis)};
  \draw[gray,thin] (-0.3,-1.6) -- (0.3,-1.6) node[right,font=\scriptsize,black] {$P_N$ proximity from a shared net};
  \node[font=\scriptsize,anchor=west] at (-0.3,-2.1) {merge in importance order $M_S\succ M_B\succ P_B\succ S\succ P_N$};
  \end{scope}
  \draw[->,very thick] (6.0,2.0) -- (7.0,2.0) node[midway,above,font=\scriptsize] {Alg.\ 3.1};
  % tree
  \begin{scope}[xshift=7.4cm]
  \node[font=\bfseries] at (3.4,4.3) {HSMPG tree (groups)};
  \node[grp,fill=gray!15] (r) at (3.4,3.5) {$PG_N$: whole circuit};
  \node[grp,fill=green!15] (sg) at (3.4,2.5) {$SG_1$: one axis};
  \node[grp,fill=red!12] (ms1) at (1.4,1.4) {$MG_S$\\(P1,P2)};
  \node[grp,fill=blue!10] (mb) at (5.0,1.4) {$MG_B$: mirrors\\ N1-N3, N2-N4};
  \node[grp,fill=red!12] (ms2) at (4.0,0.0) {$MG_S$\\(N1,N2)};
  \node[grp,fill=red!12] (ms3) at (6.0,0.0) {$MG_S$\\(N3,N4)};
  \draw (r) -- (sg); \draw (sg) -- (ms1); \draw (sg) -- (mb); \draw (mb) -- (ms2); \draw (mb) -- (ms3);
  \node[font=\scriptsize,align=left,anchor=north west] at (0.2,-0.9) {each group becomes a placer constraint:\\ $MG\to$ same variant + orientation (+ common centroid)\\ $SG\to x_i+x_i'=2\hat x,\ y_i=y_i'$\\ $PG\to$ connected placement (shared well / ring)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!note]- Detail: how the SMP graph and HSMPG tree are built (Strasser, Eick, Graeb, Ch. 3)
> 1. **Netlist proximity ($P_N$):** every pair of devices on a common net gets an edge (a complete subgraph per net), so short nets are preferred.
> 2. **Building-block recognition:** subgraph isomorphism against a library: differential pair, level shifter, simple current mirror (match both transistors); cascode, four-transistor and wide-swing mirrors (match the lower pair and the upper pair, keep each lower/upper column close, $P_B$).
> 3. **Symmetry analysis:** all symmetric device pairs that share an axis form a *symmetry compound*; each pair gets an $M_S$ edge, the compound a complete $S$ subgraph.
> 4. **Agglomerate in importance order** $M_S\succ M_B\succ P_B\succ S\succ P_N$: for each type, take the subgraph of that type's edges, make each connected component a group (matching, symmetry or proximity group), collapse it into a super node, repeat.
>
> Why $M_S$ beats $M_B$: if N1 matches N2 and N3 matches N4 (symmetry), a mismatch inside the mirror N1-N3 equals the one inside N2-N4, so both halves shift together (gain error, usually tolerable); breaking symmetry matching gives offset (usually critical). On five industrial circuits (9 to 42 devices) the groups had 2 to 14 members, 2.2 to 2.9 on average, which keeps each enumeration small.

| Constraint | Guarantee (formal) | Enforce by | Verify after layout |
|---|---|---|---|
| **Symmetry** (mirror) | pair $(i,i')$: $x_i+x_{i'}+w_i=2\hat x$, $y_i=y_{i'}$; self-symmetric: $x_i+w_i/2=\hat x$; pairs get identical variants, mirrored orientation | representation (S-F sequence pair, ASF-B*-tree) or move set (move pairs together) | axis per group; pairwise coordinate and geometry check |
| **Symmetry** (perfect) | as above with *identical* orientation (oblique implants) | same; routing can no longer be mirrored, so match parasitics instead | per-net $R$, $C$ difference on each pair |
| **Matching** | same variant, same orientation, current in the same direction; distance $D$ small enough that $\sigma^2(\Delta P)=A_P^2/WL+S_P^2D^2$ fits the budget | move set for variant/orientation; distance as a cost term via $S^{P}_{D}$ | orientation and variant equality; distance vs budget |
| **Common centroid** | equal centroids per device; dispersion | generator or dedicated placer | centroid computation; see [[Common-Centroid Layout]] |
| **Proximity / hierarchy** | group forms a connected placement (shared well, one guard ring); symmetry island: every module abuts another of its group | hierarchical representation (HB*-tree hierarchy nodes) | connectivity of each group's footprint |
| **Minimum distance** | $d(m,n)\ge d_{min}$ to modules outside a well/ring; piecewise for shared deep trench: $d\le s_{max}$ or $d\ge d_{DTI}$ | packing rule (linear and piecewise-linear constraints) | DRC plus the group-to-outside distance |
| **Thermal** | matched pairs on one isotherm of every heat source | cost term via $S^{P}_{\Delta T}$ and a temperature map | thermal map at the hot corner; $\Delta T$ per pair |
| **Current path / signal flow** | devices ordered along the current or signal flow (monotonic current paths) | placement constraint or cost; listed by Xu et al. as existing work | ordering check |
| **Symmetric nets** | paired nets with equal $R$, $C$ and coupling | route one, mirror it, check DRC on both sides; or exact-length matching per layer | extracted $\Delta R$, $\Delta C$ per pair |
| **Net classes** | sensitive nets kept from noisy ones; shields at a quiet DC potential | net ordering, spacing, shield insertion | coupling cards between class pairs |
| **Current / IR** | wire width $\ge$ EM width; IR drop on bias and ground taps within budget | width from simulated branch currents; net splitting | current density and IR per segment; see [[Electromigration]] |
| **LDE** | WPE, LOD/STI and OSE equal across matched devices | well islands, dummies, LDE-aware placement | per-device LDE parameters from extraction |
| **Performance** | $\Delta P_{lay,j}\in[\Delta P^{min}_{lay,j},\Delta P^{max}_{lay,j}]$ for every spec | cost term (direct) or parasitic bounds (indirect) | post-layout simulation of every spec |

> [!tip] Remark
> Constraint categories from Jerke and Lienig (Ch. 7): *technology* (width, spacing), *functional* (max IR drop, max offset), *methodology* (hierarchy depth, power layer) and *commercial* (die area). Implicit constraints (the designer "just knows" a pair is symmetric) are invisible to tools; only explicit ones can be enforced or verified. The owner's flow writes them as check scripts on the extracted netlist for exactly this reason ([[Analog Design Flow#Stage 4. Layout]]).

## Level 0: Why Analog P&R Is Hard

### Analog vs digital

| | Digital P&R | Analog P&R |
|---|---|---|
| Size | millions of cells | 10 to 100 devices per circuit-level block (Lampaert) |
| Cell shapes | fixed height, few shapes | sizes vary by orders of magnitude; each device has several variants |
| Objective | wire length, timing (static timing model) | performance specs; no universal performance model |
| Constraints | few types (delay, skew) per object | many coupled types per object: symmetry, matching, proximity, thermal, coupling, current |
| Steps | separable (place, then route) | overlapping: device generation, placement and global routing interact |
| Pins | points | arbitrary rectilinear shapes; devices may legally overlap (merging) |

> [!note]- Why: the packing problem itself is hard
> Deciding whether fixed-orientation rectangles fit into a given chip is NP-complete; finding a minimum-area packing is NP-hard (Balasa Ch. 1). Analog adds symmetry and matching on top, and each extra constraint type tends to need its own algorithm, which is why tools lag digital ones (Jerke and Lienig Ch. 7). Analog parts were reported on 75 % of chips, taking 40 % of design effort and causing 50 % of errors found after first silicon (Graeb, Preface, quoting EDA Weekly 2005).

### Three ways to automate it

| Family | Knowledge lives in | Strength | Weakness |
|---|---|---|---|
| **Procedural** (module generators, Pcells) | code written per topology | high quality, predictable, matching and merging coded in | large coding effort per new topology; technology port |
| **Template** (design by example, layout scripts) | one expert layout, made relative | fast; keeps expert placement and routing | one template per circuit type; flexibility limited for large size changes; 1.5 to 2× the manual layout time to build |
| **Rule-based** | a designer-editable rule set | adaptable | quality only as good as the rules; rules are context-dependent |
| **Algorithmic (optimisation P&R)** | the algorithm and cost function | general, any topology | quality depends on cost function and on a complete constraint set; slower |
| **Retargeting** (compaction) | an existing, silicon-proven layout | keeps every manual decision | only moderate changes; source layout needed |

Manual circuit-level layout splits roughly 50 % module generation, 12.5 % placement, 25 % routing, 12.5 % verification; generators remove most of the first and verification, and LAYLA's placer and router gave a 5 to 7× productivity gain over manual layout across more than 20 mixed-signal and RF chips (Lampaert Ch. 6).

> [!tip] Remark
> This table is the reason for the owner's "generator first, P&R as an optional pass, freeze what P&R discovers into recipes" decision ([[Analog Design Flow#Stage 4. Layout]]): procedural generators win on predictability and portability, optimisation wins on generality, and recipes are a way to move knowledge from the second into the first.

## Level 1: Generators, Templates and Retargeting

### Procedural module generators and Pcells

```tikz title="A generator in interface mode: one transistor, three finger variants, and the shape function (Pareto staircase of bounding boxes) the placer chooses from. After Lampaert Fig. 3.1 and Castro-Lopez Sec. 6.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  ndiff/.style={fill=green!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70}]
  \newcommand{\mos}[4]{% x0 nf fingerheight label  (finger pitch 0.6, total W = nf*h)
    \pgfmathsetmacro{\dwid}{0.6*#2+0.3}
    \draw[ndiff] (#1,0) rectangle ({#1+\dwid},#3);
    \foreach \k in {1,...,#2} {\draw[poly] ({#1+0.6*\k-0.08},-0.2) rectangle ({#1+0.6*\k+0.08},{#3+0.2});}
    \pgfmathtruncatemacro{\nc}{#2}
    \foreach \k in {0,...,\nc} {\foreach \yy in {0.25,0.75} {\pgfmathparse{\yy*#3}\draw[cont] ({#1+0.6*\k+0.08},{\pgfmathresult-0.06}) rectangle ++(0.12,0.12);}}
    \draw[densely dashed,gray] ({#1-0.15},-0.35) rectangle ({#1+\dwid+0.15},{#3+0.35});
    \node[font=\scriptsize,align=center,anchor=north] at ({#1+\dwid/2},-0.45) {#4};}
  \mos{0}{1}{4.0}{$n_f=1$\\ tall, narrow}
  \mos{2.0}{2}{2.0}{$n_f=2$}
  \mos{4.6}{4}{1.0}{$n_f=4$\\ short, wide}
  \node[font=\scriptsize,align=left,anchor=west] at (0,5.4) {same $W/L$, three variants from one generator call (\emph{interface mode} returns only boxes + pins)};
  % shape function plot
  \begin{scope}[xshift=9.6cm]
    \draw[->] (0,0) -- (4.4,0) node[below left,font=\scriptsize] {width $w$};
    \draw[->] (0,0) -- (0,4.6) node[above,font=\scriptsize] {height $h$};
    \foreach \x/\y/\l in {1.2/4.7/1,1.8/2.7/2,3.0/1.7/4} {\fill (\x*0.85,\y*0.85) circle (2.5pt) node[below left,font=\scriptsize] {$n_f{=}\l$};}
    \fill[red!70!black] (2.5*0.85,3.2*0.85) circle (2.5pt) node[right,font=\scriptsize] {dominated: drop};
    \draw[thick,blue!70!black] (1.2*0.85,4.4) -- (1.2*0.85,4.7*0.85) -- (1.8*0.85,4.7*0.85) -- (1.8*0.85,2.7*0.85) -- (3.0*0.85,2.7*0.85) -- (3.0*0.85,1.7*0.85) -- (4.2,1.7*0.85);
    \node[font=\scriptsize,blue!70!black,align=left,anchor=west] at (0.2,-0.7) {shape function = Pareto staircase of $(w,h)$;\\ placer / floorplan sizer picks one point};
  \end{scope}
\end{circuitikz}
\end{document}
```

- A **module generator** is a parameterised program that draws one fixed configuration (a transistor, a pair, a capacitor array). In a placer it runs in two modes: **interface mode** returns, for each variant, only what the placer needs (bounding box or rectangle cover, terminal geometry, bulk net, thermal profile); **layout mode** draws the variant the placer picked (Lampaert §3.5).
- **Variants** (finger count, stacked vs interdigitated, aspect ratio) make a device a *soft* block; the placer chooses among them. The set of non-dominated $(w,h)$ is the device's **shape function**.
- **Technology independence:** write generators in symbolic *geometrical process parameters* (minimum width, spacing, enclosure per rule) and *electrical process parameters* (sheet resistance, area capacitance, max current density), plus *device definitions* mapping generic layers to the process's layers. LAYLA's library ran on more than 20 processes from 5 foundries without source changes (Lampaert §3.6).

> [!tip] Remark
> What a Pcell is and why it is DRC-clean by construction is in [[Layout Fundamentals#The layout database]]; finger counts and their capacitance trade-off are in [[Layout Fundamentals#Fingers]] and [[MosFETs#Layout]]. A generator for a tool adds the interface mode: geometry abstractions for a placer, without drawing.

### Device merging and transistor stacking

```tikz title="Transistor stacking: an Euler trail through the diffusion graph is a gap-free stack; the shared tail diffusion halves the junction on that node. After Lampaert Figs. 3.2-3.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  ndiff/.style={fill=green!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  net/.style={circle,draw,thick,fill=white,minimum size=0.8cm,inner sep=0pt,font=\scriptsize}]
  \node[font=\bfseries] at (1.5,3.4) {diffusion graph};
  \node[net] (a) at (0,2) {out1}; \node[net] (t) at (1.5,2) {tail}; \node[net] (b) at (3,2) {out2};
  \node[net] (g) at (1.5,0.3) {gnd};
  \draw[very thick] (a) -- node[above,font=\scriptsize] {M1} (t);
  \draw[very thick] (t) -- node[above,font=\scriptsize] {M2} (b);
  \draw[very thick,gray] (t) -- node[right,font=\scriptsize] {M5 (other $W$)} (g);
  \node[font=\scriptsize,align=left,anchor=north west] at (-0.6,-0.4) {vertex = net, edge = transistor (S--D);\\ an Euler trail = one gap-free stack;\\ odd-degree nets: join to a supervertex,\\ each super-edge = one diffusion break};
  % unmerged
  \begin{scope}[xshift=5.2cm,yshift=0.4cm]
  \node[font=\footnotesize\bfseries,red!70!black,align=center] at (1.7,3.0) {separate devices:\\ 4 S/D regions};
  \draw[ndiff] (0,0.6) rectangle (1.4,2.2); \draw[poly] (0.62,0.4) rectangle (0.78,2.4);
  \draw[ndiff] (2.0,0.6) rectangle (3.4,2.2); \draw[poly] (2.62,0.4) rectangle (2.78,2.4);
  \foreach \x in {0.15,0.95,2.15,2.95} {\draw[cont] (\x,1.1) rectangle ++(0.25,0.25); \draw[cont] (\x,1.5) rectangle ++(0.25,0.25);}
  \node[font=\scriptsize] at (0.3,0.3) {out1}; \node[font=\scriptsize] at (1.1,0.3) {tail};
  \node[font=\scriptsize] at (2.3,0.3) {tail}; \node[font=\scriptsize] at (3.1,0.3) {out2};
  \node[font=\scriptsize,align=center,red!70!black] at (1.7,-0.3) {tail junction area $\times2$};
  \end{scope}
  % merged
  \begin{scope}[xshift=10.2cm,yshift=0.4cm]
  \node[font=\footnotesize\bfseries,green!40!black,align=center] at (1.2,3.0) {stacked along the trail\\ out1, M1, tail, M2, out2};
  \draw[ndiff] (0,0.6) rectangle (2.4,2.2);
  \draw[poly] (0.62,0.4) rectangle (0.78,2.4); \draw[poly] (1.62,0.4) rectangle (1.78,2.4);
  \foreach \x in {0.15,0.95,1.95} {\draw[cont] (\x,1.1) rectangle ++(0.25,0.25); \draw[cont] (\x,1.5) rectangle ++(0.25,0.25);}
  \node[font=\scriptsize] at (0.3,0.3) {out1}; \node[font=\scriptsize] at (1.2,0.3) {tail}; \node[font=\scriptsize] at (2.1,0.3) {out2};
  \node[font=\scriptsize,align=center,green!40!black] at (1.2,-0.3) {one shared tail region:\\ less $C_{SB}$ on tail, less area};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{C_{jSB}=\frac{A_SC_j}{(1+V_{SB}/\phi_j)^{m_j}}+\frac{P_SC_{jsw}}{(1+V_{SB}/\phi_j)^{m_{jsw}}}}
$$

Sharing a diffusion between two electrically connected devices of the same type and bulk removes one junction's area and perimeter from the node (sign convention: $V_{SB}$ reverse bias). Three strategies (Lampaert §3.3):

1. **Fixed library of multi-device generators** (pairs, mirrors, cascodes): sharing is coded in; but a circuit that does not map onto the library loses it.
2. **Dynamic merging in the placer** (KOAN): overlap of two terminals is *legal* iff same net, same layer, same bulk potential; legal overlap lowers junction capacitance and therefore the cost. Burden moves into the placer; some structures (interdigitated cascodes) cannot be built this way.
3. **Pre-computed alternative stack sets**, swapped as a placer move.

LAYLA's conclusion: dedicated generators for recurring structures (interdigitated cascodes, common-centroid input pairs) plus dynamic merging during placement.

> [!note]- Detail: the stacking algorithms
> Build the diffusion graph (vertex = net, edge = transistor from source to drain), split it by device type and bulk net, fold wide devices, split by channel width, then partition each subgraph into paths: each path is one stack.
> - Malavasi (1995): enumerate all paths by dynamic programming, build a compatibility graph, find cliques, score with an analog cost. Exponential time.
> - A 1996 constraint-driven algorithm (Lampaert's ref. [Bas 96]): make the graph Eulerian by joining every odd-degree vertex to one supervertex (each such edge becomes a diffusion break), then find an Euler trail that respects symmetry and matching. Linear time, minimum-cost for a class of circuits.
> The same half-diffusion-graph Euler path is what ALIGN uses for common-centroid MOS rows ([[Common-Centroid Layout#Level 5 Generating Arrays Automatically]]).

### Templates that survive resizing

```tikz title="Template resizing: relative constraints stored per axis can overlap after resizing; adding x edges between every pair that could overlap prevents it. After Dundar and Unutulmaz Fig. 4.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  el/.style={draw,thick,fill=gray!15},
  eg/.style={->,thick,blue!70!black}]
  % initial
  \node[font=\footnotesize\bfseries] at (1.6,3.3) {template (initial sizes)};
  \draw[el] (0,1.6) rectangle (1.2,2.6) node[midway] {a};
  \draw[el] (0,0) rectangle (1.2,1.2) node[midway] {c};
  \draw[el] (1.8,0) rectangle (2.8,1.0) node[midway] {b};
  \draw[eg] (1.2,0.6) -- (1.8,0.6);
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {simple graph: c$\to$b only\\ (a does not ``see'' b)};
  % simple resized
  \begin{scope}[xshift=4.6cm]
  \node[font=\footnotesize\bfseries,red!70!black] at (1.6,3.3) {resize: a wider, b taller};
  \draw[el] (0,1.6) rectangle (2.3,2.6) node[pos=0.3] {a};
  \draw[el] (0,0) rectangle (1.2,1.2) node[midway] {c};
  \draw[el] (1.8,0) rectangle (2.8,2.0) node[midway] {b};
  \fill[red,opacity=0.5] (1.8,1.6) rectangle (2.3,2.0);
  \draw[eg] (1.2,0.6) -- (1.8,0.6);
  \node[font=\scriptsize,align=center,red!70!black] at (1.5,-0.6) {x and y constraints coded\\ separately: a and b overlap};
  \end{scope}
  % extended
  \begin{scope}[xshift=9.2cm]
  \node[font=\footnotesize\bfseries,green!40!black] at (1.8,3.3) {extended graph};
  \draw[el] (0,1.6) rectangle (2.3,2.6) node[midway] {a};
  \draw[el] (0,0) rectangle (1.2,1.2) node[midway] {c};
  \draw[el] (2.6,0) rectangle (3.6,2.0) node[midway] {b};
  \draw[eg] (1.2,0.6) -- (2.6,0.6);
  \draw[eg] (2.3,1.8) -- (2.6,1.8);
  \node[font=\scriptsize,align=center,green!40!black] at (1.7,-0.6) {add a$\to$b: every pair that could\\ overlap gets an x edge; then compact};
  \end{scope}
\end{circuitikz}
\end{document}
```

A template stores *relations*, not coordinates: "b is right of a", "a aligned with b", written as one-dimensional equations per edge (the layout description script of Dündar and Unutulmaz §4.5.6.1, extracted from the horizontal and vertical constraint graphs of an existing placement). Because x and y relations are stored separately, resizing two blocks can create an overlap no single relation forbids. The fix: add an x edge between every pair that could overlap after resizing (higher x, nothing between them), then compact. Per-layer spacing edges are added only between shapes of *different* nets; the constraints are solved as an LP.

- Template languages in the literature: BALLISTIC (a few hundred lines for a medium analog cell), CAIRO (a C library), LAYGEN (template routing adapted to a new placement, then a genetic optimiser), and the modern template engines BAG and LAYGO cited by Xu et al.
- Templates are what layout-aware sizing uses in its inner loop, because instancing one takes seconds ([[#Level 6 Layout in the Sizing Loop]]).

### Retargeting by compaction

```tikz title="Retargeting by compaction: design rules become a constraint graph solved by longest path; symmetry needs four-variable constraints and therefore LP. After Said et al. Figs. 5.2-5.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  ndiff/.style={fill=green!45,draw=black!60},
  mone/.style={fill=blue!55,draw=black!70},
  vx/.style={circle,draw,thick,fill=white,minimum size=0.75cm,inner sep=0pt,font=\scriptsize}]
  \node[font=\footnotesize\bfseries,anchor=west] at (-0.2,4.0) {1-D compaction: every rule is $x_j-x_i\ge d_{ij}$};
  \draw[mone] (0,1.8) rectangle (1.0,3.0); \node[font=\scriptsize,white] at (0.5,2.4) {M1};
  \draw[ndiff] (2.5,1.6) rectangle (4.5,3.2); \node[font=\scriptsize] at (3.5,2.4) {active};
  \draw[<->] (0,1.4) -- (1.0,1.4) node[midway,below,font=\scriptsize] {$\ge2$};
  \draw[<->] (1.0,1.4) -- (2.5,1.4) node[midway,below,font=\scriptsize] {$\ge3$};
  \draw[<->] (2.5,1.4) -- (4.5,1.4) node[midway,below,font=\scriptsize] {$\ge4$};
  \foreach \x/\l in {0/x_1,1.0/x_2,2.5/x_3,4.5/x_4} {\draw[densely dotted] (\x,1.0) -- (\x,3.3); \node[font=\scriptsize,above] at (\x,3.25) {$\l$};}
  % graph
  \begin{scope}[yshift=-0.1cm]
  \node[vx] (s) at (-0.8,0) {$v_0$};
  \node[vx] (a) at (0.6,0) {$x_1$}; \node[vx] (b) at (2.0,0) {$x_2$}; \node[vx] (c) at (3.4,0) {$x_3$}; \node[vx] (d) at (4.8,0) {$x_4$};
  \draw[->,thick] (s) -- node[above,font=\scriptsize] {0} (a);
  \draw[->,thick] (a) -- node[above,font=\scriptsize] {2} (b);
  \draw[->,thick] (b) -- node[above,font=\scriptsize] {3} (c);
  \draw[->,thick] (c) -- node[above,font=\scriptsize] {4} (d);
  \draw[->,thick,gray] (s) to[bend right=30] node[below,font=\scriptsize] {0} (c);
  \node[font=\scriptsize,align=left,anchor=west] at (5.5,0) {longest path from $v_0$:\\ $x_1=0,\ x_2=2,\ x_3=5,\ x_4=9$\\ = minimum width; $O(V+E)$ on a DAG};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west,red!70!black] at (5.5,2.4) {symmetry / matching need\\ $x_b-x_a=x_d-x_c$: four variables,\\ not an edge $\Rightarrow$ linear program\\ (graph-based simplex in Ch.\ 5)};
\end{circuitikz}
\end{document}
```

Migration keeps the source floorplan, placement and routing and re-solves positions under the target's rules (Said, Dessouky et al., Ch. 5). Flow: map layers, recognise devices (an LVS run links each shape to a netlist device), turn the target DRC deck into constraints, then compact with the new device sizes.

$$
\boxed{x_j-x_i\ge d_{ij}\ \Rightarrow\ x_i=\text{longest path from }v_0}
$$

- Two-variable rules form a DAG; the longest path gives the minimum-width solution in linear time. It pushes everything left (the *long wire* problem) and cannot express symmetry, $x_b-x_a=x_d-x_c$, which needs linear programming. Their graph-based simplex reduces to the graph method when all constraints are two-variable and to matrix simplex in the general case.
- Merge each contact or via array into one large shape before compaction (one constraint set instead of sixteen) and regenerate the array afterwards with at least the source's via count.

> [!tip] Remark
> Designers accept far more automation for migration than for new design, because the source has already been through silicon (Ch. 5). The owner's flow gets the same effect differently: a generator is re-run on the new kit instead of compacting a GDS ([[Analog Design Flow#Stage 4. Layout]]).

## Level 2: Placement Representations

### The placement problem

Given devices (with variants) and a netlist: choose a variant, orientation and position for each device so that the layout is design-rule correct, compact, routable, satisfies symmetry, matching, proximity and geometric constraints (aspect ratio, fixed height, pin positions), and keeps $\Delta P_{lay}$ inside the margins (Lampaert §4.2).

> [!note]- Detail: the three symmetry forms (Cohn; Balasa §1.1.4)
> 1. **Mirror symmetry:** pairs have identical geometry, mirrored orientation. Device parasitics match and terminals line up, so routing can be mirrored. The default.
> 2. **Perfect symmetry:** identical (not mirrored) orientation, for anisotropic steps such as tilted implants. Terminals are no longer mirror images, so wires must be parasitic-matched without being geometric mirrors; hard with mixed symmetric and asymmetric circuitry.
> 3. **Self-symmetry:** a symmetric device centred on the axis, e.g. a bias device connected to both halves, or for thermal symmetry.
> A *symmetry group* shares one axis; a circuit can have several groups, nested or aligned to a common axis.

### Absolute vs topological representations

| | Absolute (flat) | Topological (relative) |
|---|---|---|
| Encodes | coordinates; overlaps allowed during search | relations (left-of, above); no illegal overlap |
| Moves | shift, rotate, mirror | edit the code (swap, move a node, rotate) |
| Symmetry | easy: move pairs together | needs a feasibility condition on the code |
| Merging | natural (legal overlap is a feature) | needs extra handling |
| Cost | overlap penalty to drive to zero; weight hard to tune; post-processing to remove gaps | packing algorithm per move |
| Used by | KOAN/ANAGRAM II, PUPPY-A, LAYLA | slicing (ILAC), sequence pair, B*-tree, O-tree, TCG, CBL |

All the symmetric-feasible topological methods beat the absolute representation on run time, sometimes on quality, and were easier to tune (Balasa §1.5).

### Slicing trees

```tikz title="Slicing representation: a floorplan, its slicing tree and Polish expression, and a pinwheel that no slicing tree can reach. After Balasa Sec. 1.1.6 and Lampaert Fig. 4.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  el/.style={draw,thick,fill=gray!12},
  op/.style={circle,draw,thick,fill=yellow!20,minimum size=0.6cm,inner sep=0pt,font=\scriptsize},
  lf/.style={rectangle,draw,thick,fill=gray!12,minimum size=0.5cm,inner sep=1pt,font=\scriptsize}]
  \node[font=\footnotesize\bfseries] at (1.5,3.6) {slicing floorplan};
  \draw[el] (0,0) rectangle (3,1.2) node[midway] {A};
  \draw[el] (0,1.2) rectangle (1.2,3.2) node[midway] {B};
  \draw[el] (1.2,1.2) rectangle (3,2.2) node[midway] {C};
  \draw[el] (1.2,2.2) rectangle (3,3.2) node[midway] {D};
  \draw[red!70!black,very thick,dashed] (-0.2,1.2) -- (3.2,1.2);
  \draw[blue!70!black,very thick,dashed] (1.2,1.2) -- (1.2,3.4);
  \begin{scope}[xshift=4.8cm,yshift=0.2cm]
    \node[font=\footnotesize\bfseries] at (1.2,3.4) {slicing tree};
    \node[op,draw=red!70!black] (h1) at (1.2,2.7) {H};
    \node[lf] (a) at (0.2,1.8) {A};
    \node[op,draw=blue!70!black] (v1) at (2.0,1.8) {V};
    \node[lf] (b) at (1.3,0.9) {B};
    \node[op,draw=red!70!black] (h2) at (2.7,0.9) {H};
    \node[lf] (c) at (2.2,0.0) {C}; \node[lf] (d) at (3.2,0.0) {D};
    \draw (h1) -- (a); \draw (h1) -- (v1); \draw (v1) -- (b); \draw (v1) -- (h2); \draw (h2) -- (c); \draw (h2) -- (d);
    \node[font=\scriptsize,anchor=north] at (1.6,-0.5) {Polish: A B C D H V H};
  \end{scope}
  \begin{scope}[xshift=10cm]
    \node[font=\footnotesize\bfseries,red!70!black] at (1.5,3.6) {not slicing (pinwheel)};
    \draw[el] (0,0) rectangle (2,1) node[midway] {A};
    \draw[el] (2,0) rectangle (3,2) node[midway] {B};
    \draw[el] (1,2) rectangle (3,3) node[midway] {C};
    \draw[el] (0,1) rectangle (1,3) node[midway] {D};
    \draw[el,fill=gray!30] (1,1) rectangle (2,2) node[midway] {E};
    \node[font=\scriptsize,align=center] at (1.5,-0.6) {no straight cut separates it;\\ slicing trees cannot reach it};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Recursive horizontal and vertical cuts; stored as a binary tree or a normalised Polish expression; annealing moves swap operands or operators.
- **Shape functions** combine cheaply: horizontal addition $(w_1+w_2,\max(h_1,h_2))$, vertical addition $(\max(w_1,w_2),h_1+h_2)$; drop dominated shapes at each level (Stockmeyer). This is why slicing survives in templates and layout-aware sizing.
- For dense analog placement it is a poor choice: unreachable topologies cost density when block sizes differ widely, and symmetry needs virtual axes in the cost (Balasa §1.1.6; Lampaert §4.5.1).

### Sequence pairs

```tikz title="A symmetric-feasible sequence pair (constructed and checked for this note): the pair encodes left-of and above; the symmetry steps move S onto the axis. After Balasa Sec. 1.3 and Fig. 1.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.9cm,y=0.9cm,
  el/.style={draw,thick,fill=gray!12},
  sy/.style={draw,thick,fill=green!15}]
  \node[font=\footnotesize\bfseries] at (3,4.9) {placement};
  \draw[el] (0,3) rectangle (6,4); \node at (1.5,3.5) {X (free)};
  \draw[sy] (0,0) rectangle (1,3) node[midway] {B};
  \draw[sy] (5,0) rectangle (6,3) node[midway] {B$'$};
  \draw[sy] (1,1) rectangle (3,3) node[midway] {A};
  \draw[sy] (3,1) rectangle (5,3) node[midway] {A$'$};
  \draw[sy] (2,0) rectangle (4,1); \node at (3.5,0.5) {S};
  \draw[dashed,red!70!black] (1,0) rectangle (3,1);
  \node[font=\scriptsize,red!70!black,anchor=east] at (2.9,-0.35) {S after LCS pass};
  \draw[->,red!70!black,thick] (1.3,0.5) -- (1.9,0.5);
  \draw[very thick,dashed,blue!70!black] (3,-0.9) -- (3,4.3); \node[font=\scriptsize,blue!70!black,anchor=west] at (3.1,-0.7) {axis $\hat x=3$};
  % sequences
  \begin{scope}[xshift=7.6cm]
  \node[font=\footnotesize\bfseries,anchor=west] at (0,4.6) {sequence pair};
  \node[font=\small,anchor=west] at (0,3.8) {$\alpha$ = X\ \ B\ \ A\ \ A$'$\ \ S\ \ B$'$};
  \node[font=\small,anchor=west] at (0,3.1) {$\beta$ = B\ \ S\ \ A\ \ A$'$\ \ B$'$\ \ X};
  \node[font=\scriptsize,align=left,anchor=north west] at (0,2.6) {a before b in $\alpha$ and $\beta$ $\Rightarrow$ a \textbf{left of} b\\ a before b in $\alpha$, after in $\beta$ $\Rightarrow$ a \textbf{above} b\\[3pt]
  symmetric-feasible (Balasa): for $x\ne y$ in the group\\ $\alpha^{-1}(x)<\alpha^{-1}(y)\iff\beta^{-1}(\mathrm{sym}\,y)<\beta^{-1}(\mathrm{sym}\,x)$\\ e.g.\ B before A in $\alpha$, so A$'$ before B$'$ in $\beta$ \checkmark\\[3pt]
  moves keep the property: swap x,y in $\alpha$ $\Rightarrow$\\ swap sym$(x)$, sym$(y)$ in $\beta$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\begin{aligned}&\alpha^{-1}(a)<\alpha^{-1}(b)\wedge\beta^{-1}(a)<\beta^{-1}(b)\Rightarrow a\text{ left of }b\\ &\alpha^{-1}(a)<\alpha^{-1}(b)\wedge\beta^{-1}(a)>\beta^{-1}(b)\Rightarrow a\text{ above }b\end{aligned}}
$$

- Every packing is reachable ($P$-admissible); $(n!)^2$ codes. Evaluation: longest common subsequence of $\alpha$ and $\beta$ weighted by widths gives x (and of $\alpha^R,\beta$ weighted by heights gives y), $O(n\log\log n)$ with a priority queue.
- **Symmetric-feasible (S-F)** (Balasa and Lampaert): for all distinct $x,y$ in a group, $\alpha^{-1}(x)<\alpha^{-1}(y)\iff\beta^{-1}(\mathrm{sym}\,y)<\beta^{-1}(\mathrm{sym}\,x)$. A sufficient condition: every S-F code yields a symmetric placement.

$$
\boxed{N_{SF}\le\frac{(n!)^2}{\prod_{k=1}^{G}(2p_k+s_k)!}}
$$

for $G$ groups with $p_k$ pairs and $s_k$ self-symmetric cells. Example (Balasa §1.3): $n=7$, one group with $p=s=2$: $(7!)^2/6!=35{,}280$ S-F codes against $25{,}401{,}600$, a 99.86 % smaller search space.

> [!note]- Detail: evaluating an S-F sequence pair with symmetry (Balasa §1.3.1)
> - **Step 1y:** LCS pass over $\alpha$ reversed for ordinates; when one cell of a pair is raised, raise its partner and repeat the pass. S-F guarantees termination; typically at most three passes, worst case $\Theta(p)$.
> - **Step 1x:** plain LCS pass for abscissae.
> - **Step 2x:** build the embedding DAG of pairs (outer pair before inner pair, from the right contour), choose $\hat x=\max\frac{x_j+(x_k+w_k)}{2}$ over innermost pairs, shift pairs toward the axis.
> - **Step 3x / 4x:** sweep right then left, pushing whichever cell of a pair violates $x_j+x_k+w_k=2\hat x$.
> Multiple groups: process one group at a time, inner groups first ($O(G\,n\log\log n)$); keep cells of different groups from interleaving in both sequences unless the groups are designed to nest. The move set preserves S-F: swapping $x,y$ in $\alpha$ swaps $\mathrm{sym}\,x$, $\mathrm{sym}\,y$ in $\beta$; the initial code puts the group in nested-bracket order.
>
> In the figure, the LCS pass places S at $x=1$; the symmetry steps move it to $x=2$ so that it centres on $\hat x=3$ (checked by evaluating the pair).

> [!tip] Remark
> TCG is equivalent to the sequence pair (β is the topological sort of both closure graphs), so it has the same $(n!)^2$ space with slower, quadratic evaluation (Balasa §1.4.1). A tool gains nothing by choosing it over S-F sequence pairs.

### B*-trees, ASF-B*-trees and symmetry islands

```tikz title="B*-tree of a compacted placement (left), and an ASF-B*-tree that packs only the right half of a symmetry island (right). After Lin and Chang Figs. 2.7-2.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.8cm,y=0.8cm,
  el/.style={draw,thick,fill=gray!12},
  rp/.style={draw,thick,fill=green!25},
  nd/.style={circle,draw,thick,fill=white,minimum size=0.6cm,inner sep=0pt,font=\scriptsize}]
  \node[font=\footnotesize\bfseries] at (3,4.0) {compacted placement};
  \draw[el] (0,0) rectangle (3,2) node[midway] {$b_0$};
  \draw[el] (3,0) rectangle (5,1) node[midway] {$b_1$};
  \draw[el] (5,0) rectangle (6,3) node[midway] {$b_2$};
  \draw[el] (3,1) rectangle (5,2) node[midway] {$b_3$};
  \draw[el] (0,2) rectangle (3,3) node[midway] {$b_4$};
  \begin{scope}[xshift=7.3cm,yshift=0.2cm]
    \node[font=\footnotesize\bfseries] at (1.6,3.8) {B*-tree};
    \node[nd] (n0) at (1.5,3) {$n_0$};
    \node[nd] (n1) at (0.5,2) {$n_1$}; \node[nd] (n4) at (2.5,2) {$n_4$};
    \node[nd] (n2) at (-0.3,1) {$n_2$}; \node[nd] (n3) at (1.3,1) {$n_3$};
    \draw[->,thick,blue!70!black] (n0) -- node[left,font=\scriptsize] {L} (n1);
    \draw[->,thick,red!70!black] (n0) -- node[right,font=\scriptsize] {R} (n4);
    \draw[->,thick,blue!70!black] (n1) -- node[left,font=\scriptsize] {L} (n2);
    \draw[->,thick,red!70!black] (n1) -- node[right,font=\scriptsize] {R} (n3);
    \node[font=\scriptsize,align=left,anchor=north west] at (-0.8,0.3) {\textcolor{blue!70!black}{L}: $x=x_p+w_p$ (right neighbour)\\ \textcolor{red!70!black}{R}: $x=x_p$ (stacked above)\\ $y$ from a contour list: $O(n)$ pack};
  \end{scope}
  \begin{scope}[xshift=13.6cm]
    \node[font=\footnotesize\bfseries] at (0,4.0) {symmetry island (ASF-B*-tree)};
    \draw[el] (-2,0) rectangle (0,1); \draw[rp] (0,0) rectangle (2,1); \node at (-1,0.5) {$S_0$};
    \draw[el] (-1,1) rectangle (0,2); \draw[rp] (0,1) rectangle (1,2); \node at (-0.5,1.5) {$S_2$};
    \draw[el] (-3,1) rectangle (-1,3) node[midway] {$b_1$};
    \draw[rp] (1,1) rectangle (3,3) node[midway] {$b_1'$};
    \draw[very thick,dashed,blue!70!black] (0,-0.4) -- (0,3.4);
    \node[nd] (r0) at (4.6,2.6) {$S_0^r$}; \node[nd] (r2) at (5.4,1.6) {$S_2^r$}; \node[nd] (r1) at (4.6,0.6) {$b_1'$};
    \draw[->,thick,red!70!black] (r0) -- (r2); \draw[->,thick,blue!70!black] (r2) -- (r1);
    \node[font=\scriptsize,align=left,anchor=north west] at (-3.2,-0.5) {pack only the right half (green), mirror the rest;\\ self-symmetric halves must abut the axis, so they\\ stay on the rightmost (R) branch: always feasible};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **B*-tree:** an ordered binary tree of a compacted (left- and down-packed) placement; left child = lowest adjacent module on the right ($x=x_p+w_p$), right child = first module above at the same x ($x=x_p$); y from a doubly linked contour. Packing is $O(n)$.
- **Trees vs sequence pairs:** labelled binary trees number $b_n\,n!$ with $b_n=\binom{2n}{n}/(n+1)$, fewer than $(n!)^2$ for $n\ge3$. When symmetry groups dominate the circuit, S-F sequence pairs can be the smaller space; when asymmetric cells dominate, trees are. Balasa found trees faster, sequence pairs somewhat better in quality.
- **Symmetry island** (Lin and Chang): a placement of a group in which each module abuts another and the group is connected; preferred because Pelgrom's distance term grows with spacing.
- **ASF-B*-tree:** pack only the *representatives* (right half of each pair and of each self-symmetric cell) and mirror the rest. A self-symmetric representative must abut the axis, so it stays on the rightmost branch (vertical axis); then every tree is symmetric-feasible, packing yields a symmetry island, and compacted symmetric placements correspond one-to-one with trees.
- **HB*-tree:** hierarchy nodes hold an ASF-B*-tree (an island) and contour nodes for its rectilinear top edge, so islands and free modules are placed together. Extends to nested symmetry, proximity clusters, and plugging in other sub-placers (common-centroid, signal-flow).

| Approach (symmetry) | Perturb | Pack |
|---|---|---|
| B*-tree (Balasa) | $O(\lg n)$ | $O(n^2)$ |
| B*-tree + segment / red-black tree / skip list | $O(\lg n)$ | $O(n\lg n)$ |
| Sequence pair (Balasa, Lampaert) | $O(1)$ | $O(n^2)$ |
| SP + priority queue | $O(1)$ | $O(m\,n\lg\lg n)$, $m$ groups |
| SP + LP (Koda) | $O(1)$ | $\Omega(n^2)$ |
| TCG-S / TCG | $O(n^2)$ / $O(n)$ | $O(n^2)$ |
| ASF-B*-tree + HB*-tree | $O(\lg n)$ | $O(n)$ |

On two industrial analog benchmarks the HB*-tree averaged 1.6 % less area than SP+LP and 10.3 % less than SP with dummy nodes, and ran 39.88× and 5.68× faster than those two (Lin and Chang §2.6, Table 2.6; different machines for the older works).

> [!note]- Detail: HB*-tree moves (Lin and Chang §2.5)
> Op1 rotate, Op2 move a node, Op3 swap two nodes; for ASF-B*-trees also Op4 change a representative (pick $b_j$ or $b_j'$, or flip a self-symmetric half: same area, shorter wires) and Op5 convert vertical to horizontal symmetry (rotate every module and swap children; rarely used, since axis direction is usually fixed by the supply lines). Rotating a pair rotates both; a self-symmetric node moves only along the rightmost branch; a swap involving a self-symmetric node stays on that branch. Hierarchy nodes are picked with lower probability because moving a whole island is a big jump. After an island changes shape, contour nodes may vanish; their orphaned children are re-attached to the nearest contour node in amortised constant time. Alignment of several islands to one axis: insert a zero-width dummy block whose width is adjusted.

### Hierarchy and deterministic enumeration

Plantage (Strasser, Eick, Graeb, Ch. 3) skips annealing: enumerate every B*-tree of each small basic group (the HSMPG groups above), keep the Pareto set of shapes, and combine groups bottom-up with an *enhanced shape addition* that merges B*-trees instead of bounding boxes, so no white space is added. It handles proximity, symmetry, common centroid, variant, linear and piecewise-linear minimum-distance constraints deterministically, has no tuning parameters, parallelises, and returns a set of placements with different aspect ratios instead of one.

> [!tip] Remark
> For a tool-builder the choice is concrete: annealing over a symmetric-feasible code (one good layout, tunable, incremental cost) or hierarchical enumeration (a Pareto set of shapes, deterministic, needs good small groups from constraint generation). The owner's Philis uses analytic and annealed placement ([[Analog Design Flow#5. The tools, and their honest status]]); the HSMPG grouping is a natural front end for either.

## Level 3: Optimisation

### Simulated annealing

```tikz title="Simulated annealing for placement and LAYLA's weight schedule: performance and aspect terms dominate early, the overlap penalty late. After Lampaert Figs. 4.4 and Sec. 4.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=0.9cm,text width=3.7cm,font=\scriptsize}]
  \node[blk,fill=yellow!15] (i) at (0,5.1) {initial code: coordinates,\\ S-F sequence pair, or ASF-B*-tree\\ $T_0=-\overline{\Delta C^+}/\ln P_0$};
  \node[blk,fill=blue!10] (m) at (0,3.5) {perturb: swap, move, rotate,\\ change variant (\emph{pairs move together})};
  \node[blk,fill=orange!15] (p) at (0,1.9) {pack $\to$ coordinates\\ estimate nets, $\Delta P$};
  \node[blk,fill=green!12] (c) at (0,0.45) {$\Delta C\le0$: accept\\ else accept w.p.\ $e^{-\Delta C/T}$};
  \node[blk,fill=gray!15] (t) at (0,-1.0) {equilibrium? $T\leftarrow aT$\\ ($a=0.8\ldots0.95$); frozen? stop};
  \draw[->,thick] (i) -- (m); \draw[->,thick] (m) -- (p); \draw[->,thick] (p) -- (c); \draw[->,thick] (c) -- (t);
  \draw[->,thick] (c.east) -- ++(0.5,0) |- node[pos=0.25,right,font=\scriptsize] {inner loop} (m.east);
  \draw[->,thick] (t.west) -- ++(-0.5,0) |- (m.west);
  % weight schedule
  \begin{scope}[xshift=4.6cm,yshift=-0.8cm]
    \node[font=\footnotesize\bfseries,anchor=west] at (0,5.6) {LAYLA cost and its weights};
    \node[font=\scriptsize,anchor=west] at (0,5.0) {$C=\alpha C_{area}+\beta C_{AR}+\gamma C_{overlap}+\delta C_{perf}$};
    \draw[->] (0,0) -- (5,0) node[below left,font=\scriptsize] {inner loops (cooling) $\to$};
    \draw[->] (0,0) -- (0,4.2) node[above,font=\scriptsize] {weight};
    \draw[very thick,red!70!black] (0,3.6) -- (4.6,0.6) node[right,font=\scriptsize] {$\beta,\delta$ (aspect, perf.)};
    \draw[very thick,blue!70!black] (0,0.6) -- (4.6,3.6) node[right,font=\scriptsize] {$\gamma$ (illegal overlap)};
    \node[font=\scriptsize,align=left,anchor=north west] at (0,-0.5) {early: get the configuration and $\Delta P$ right;\\ late: drive illegal overlap to zero (hard)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{P_{accept}=\begin{cases}1&\Delta C\le0\\ e^{-\Delta C/T}&\Delta C>0\end{cases}\qquad T_0=-\frac{\overline{\Delta C^+}}{\ln P_0}}
$$

- Why annealing: it accepts arbitrary constraints in the move set and arbitrary cost functions, evaluates the whole placement at every step (needed for parasitic estimates), and tolerates the moderate sizes of analog problems. Constructive and partitioning placers decide sequentially on partial information, which is wrong for performance-driven analog placement (Lampaert §4.4.7).
- **Schedule (LAYLA):** $T_0$ from random moves so that the average uphill step is accepted with $P_0=0.6$ (so $T_0\approx1.96\,\overline{\Delta C^+}$); chain length by a quasi-equilibrium test; $T_{k+1}=aT_k$ with $a$ between 0.8 and 0.95, higher when chains are long (critical region); stop when the final costs of several chains agree. The HB*-tree experiments used $a=0.9$ and 20,000 moves per temperature.

> [!important] Hard constraints in the move set, soft goals in the cost
> A penalty term is traded off against everything else and is driven to zero only if that wins overall. So symmetry, equal orientation and equal variant are maintained by construction (pairs always move together); performance, aspect ratio and area are costs; overlap (in a flat representation) is a cost whose weight ramps up late, because some overlaps are beneficial merges (Lampaert §4.6).

### Cost functions

$$
\boxed{C=\alpha\,C_{area}+\beta\,C_{AR}+\gamma\,C_{overlap}+\delta\,C_{perf},\qquad C_{perf}=\sum_j\max\!\left(0,\ \Delta P_j-\Delta P^{max}_{lay,j},\ \Delta P^{min}_{lay,j}-\Delta P_j\right)}
$$

- $C_{area}$ = bounding-box area; $C_{AR}=|AR-AR_{target}|$; $C_{overlap}=\sum_{i<j}$ illegal overlap area. $C_{perf}$ is zero inside every margin and grows with the violation.
- Weights move during the anneal: $\beta,\delta$ high early (get the configuration right), $\gamma$ high late (remove illegal overlap).
- Topological placers with no performance model use $\Phi=\alpha A+\beta\,\mathrm{HPWL}$ (HB*-tree).
- Routing space: LAYLA reserves a border around each device, a static part (sum of widths of wires on that side, widths from terminal currents) plus a dynamic part from estimated passing nets.

### Net-length estimators

```tikz title="Net-length estimators on the same four pins: half-perimeter 8, spanning tree 11, Steiner tree 10. After Lampaert Fig. 4.13 and Dundar Fig. 4.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.7cm,y=0.7cm,
  pin/.style={fill=black},
  w/.style={very thick,blue!70!black}]
  \newcommand{\pins}{\foreach \p in {(0,0),(4,1),(1,3),(3,4)} {\fill[pin] \p ++(-0.15,-0.15) rectangle ++(0.3,0.3);}}
  \node[font=\footnotesize\bfseries] at (2,5.0) {half-perimeter};
  \draw[dashed,thick,red!70!black] (0,0) rectangle (4,4); \pins
  \node[font=\scriptsize,align=center] at (2,-1.0) {$L=W_{bb}+H_{bb}=8$\\ $O(n)$, no geometry};
  \begin{scope}[xshift=4.6cm]
  \node[font=\footnotesize\bfseries] at (2,5.0) {spanning tree (MST)};
  \draw[w] (0,0) -- (1,0) -- (1,3); \draw[w] (1,3) -- (3,3) -- (3,4); \draw[w] (4,1) -- (4,4) -- (3,4); \pins
  \node[font=\scriptsize,align=center] at (2,-1.0) {pin-to-pin edges: $L=4+3+4=11$\\ $O(n^2)$; gives segments $\Rightarrow C_{xy}$};
  \end{scope}
  \begin{scope}[xshift=9.2cm]
  \node[font=\footnotesize\bfseries] at (2,5.0) {rectilinear Steiner};
  \draw[w] (0,0) -- (1,0) -- (1,3) -- (3,3) -- (3,4); \draw[w] (3,3) -- (3,1) -- (4,1); \fill[red!70!black] (3,3) circle (3pt); \pins
  \node[font=\scriptsize,align=center] at (2,-1.0) {Steiner point (red): $L=10$\\ NP-hard; MST $\le1.5\times$ RSMT};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Estimator | Cost | Gives geometry? |
|---|---|---|
| Half-perimeter of terminal bounding box | $O(n)$ | no |
| Minimum spanning tree (edge-to-edge Manhattan) | $O(n^2)$ | yes: segments for $R$, $C$, coupling |
| Centre of mass, complete graph | $O(n^2)$ | partial |
| Source to sinks | $O(n)$ | partial |
| Rectilinear Steiner tree | NP-hard; heuristics $O(n\log n)$ to $O(n^2)$ | yes, shortest |

LAYLA uses the MST with edge-to-edge Manhattan distance, because analog terminals are large shapes and the coupling estimate needs segments; the rectilinear MST is at most 1.5× the rectilinear Steiner tree (Dündar §4.2.4).

> [!tip] Remark
> Other optimisers in the sources: genetic algorithms (LAYGEN's router, GA+SA hybrids), linear programming inside annealing (sequence pair + LP), ILP and deterministic enumeration (Plantage), tabu search for integrated place-and-route, analytical placement and Bayesian optimisation over placer net weights in recent work (Xu et al.). Annealing remains the common engine because hard constraints fit its move set.

## Level 4: Performance-Driven Placement and Routing

### The margin and the linear model

```tikz title="Where the layout margin comes from (left) and the two ways to use it: one set of parasitic bounds (indirect) or the performance itself in the cost (direct). After Lampaert Figs. 2.2 and 2.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=0.8cm,text width=2.6cm,font=\scriptsize}]
  \node[font=\footnotesize\bfseries,anchor=west] at (-1.2,4.3) {where the layout budget comes from};
  \foreach \y/\l in {3.4/(a) spec,2.4/(b) nominal,1.4/(c) process,0.4/(d) layout} {\draw[gray] (0.4,\y) -- (7.2,\y); \node[font=\scriptsize,anchor=east] at (0.4,\y) {\l};}
  \draw[line width=2.5pt] (1,3.4) -- (6.6,3.4); \node[font=\scriptsize,above] at (1,3.5) {$P_{min}$}; \node[font=\scriptsize,above] at (6.6,3.5) {$P_{max}$};
  \fill (4.1,2.4) circle (3pt) node[above,font=\scriptsize] {$P_{nom}$};
  \draw[line width=2.5pt,orange!80!black] (3.0,1.4) -- (5.0,1.4); \node[font=\scriptsize,above] at (3.0,1.5) {$P^{min}_{proc}$}; \node[font=\scriptsize,above] at (5.0,1.5) {$P^{max}_{proc}$};
  \draw[line width=2.5pt,green!50!black] (1,0.4) -- (3.0,0.4); \draw[line width=2.5pt,green!50!black] (5.0,0.4) -- (6.6,0.4);
  \node[font=\scriptsize,below,green!40!black] at (2,0.3) {$\Delta P^{min}_{lay}=P_{min}-P^{min}_{proc}$};
  \node[font=\scriptsize,below,green!40!black] at (5.8,0.3) {$\Delta P^{max}_{lay}=P_{max}-P^{max}_{proc}$};
  \foreach \x in {1,3.0,5.0,6.6} {\draw[densely dotted] (\x,0.2) -- (\x,3.6);}
  % flows
  \begin{scope}[xshift=9.6cm,yshift=0.2cm]
    \node[font=\footnotesize\bfseries] at (1.4,4.1) {indirect};
    \node[blk,fill=yellow!15] (a1) at (1.4,3.2) {specs + sensitivities};
    \node[blk,fill=red!8] (a2) at (1.4,1.9) {pick ONE set of\\ parasitic bounds};
    \node[blk,fill=blue!10] (a3) at (1.4,0.6) {P\&R meets bounds};
    \draw[->,thick] (a1) -- (a2); \draw[->,thick] (a2) -- (a3);
    \draw[->,thick,dashed,red!70!black] (a3.east) -- ++(0.3,0) |- node[pos=0.25,right,font=\scriptsize,align=left] {miss:\\ new set,\\ iterate} (a2.east);
    \node[font=\footnotesize\bfseries] at (6.2,4.1) {direct (LAYLA)};
    \node[blk,fill=yellow!15] (b1) at (6.2,3.2) {specs + sensitivities};
    \node[blk,fill=blue!10,text width=3.2cm] (b2) at (6.2,1.6) {P\&R cost $=$ violation of\\ $\Delta P_j=\sum_i S^{P_j}_{x_i}\,x_i$,\\ evaluated at every move};
    \draw[->,thick] (b1) -- (b2);
    \node[font=\scriptsize,align=center,green!40!black] at (6.2,0.3) {layout meets specs, or the\\ specs are flagged infeasible};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta P^{min}_{lay}=P_{min}-P^{min}_{proc},\qquad \Delta P^{max}_{lay}=P_{max}-P^{max}_{proc},\qquad \Delta P_j\approx\sum_{i=1}^{N_x}S^{P_j}_{x_i}\,x_i,\quad S^{P_j}_{x_i}=\frac{\partial P_j}{\partial x_i}}
$$

Nominal sizing ignores parasitics and statistics; statistical (tolerance) design widens the nominal point into an interval; what is left between that interval and the spec is the layout's budget (Lampaert §2.2). The linear model is valid because layout is supposed to keep each performance near nominal.

> [!tip] Remark
> The interval $[P^{min}_{proc},P^{max}_{proc}]$ is what centering produces: nominal design then tolerance design (Graeb, *Analog Design Centering and Sizing* §1.4). The owner's version, including how much post-layout margin to keep, is [[Design Centering#3.8 Post-layout margin]].

> [!note]- Detail: computing the sensitivities (Lampaert §2.4.2)
> With the DC system $f(x^0,h)=0$ and Jacobian $M$:
> - **Perturbation:** re-solve for each perturbed parameter. Simple, general, one solve per parameter, and error-prone because it differences two close numbers (worse in transient).
> - **Direct:** $M\,\partial x^0/\partial h=-\partial f/\partial h$, reusing the LU factors; one solve per parameter, all outputs.
> - **Adjoint:** for a scalar output $\phi=d^Tx^0$, solve $M^Tx'=-d$ once; then $\partial\phi/\partial h=x'^T\,\partial f/\partial h$ for every parameter. Two solves in total regardless of the number of parasitics, which is what $N_p\times N_x$ sensitivities need.
> LAYLA used perturbation because no simulator it could use exposed adjoint sensitivities. A simulator built for this loop should expose direct and adjoint sensitivities of every measured performance to every parasitic element.

### Indirect vs direct

- **Indirect (Berkeley: Choudhury, Charbon, Malavasi):** map specs to one set of parasitic bounds, chosen to maximise a "layout flexibility" model, then make every tool respect the bounds (channel and area routing, placement, compaction). The bounds solve
  $$\sum_jS^{+}_{ij}p_j\le\Delta W^{+}_{i,max},\qquad\sum_jS^{-}_{ij}p_j\le\Delta W^{-}_{i,max}$$
  with $S^{\pm}$ the positive and negative parts of the sensitivities. Infinitely many bound sets satisfy these; picking one over-constrains the tools and causes iterations when it cannot be met (the analog analogue of net-based timing-driven layout).
- **Direct (LAYLA):** evaluate $\Delta P_j$ from the geometry of each intermediate solution and penalise only real spec violations. No intermediate bounds; the tool either finds a layout meeting all specs or flags them infeasible, and spare margin can go to other goals (yield, testability).

### What a placer estimates

```tikz title="Thermal-aware placement: a matched pair across isotherms (left) vs mirrored about the heat source (right). After Lampaert Sec. 4.9.3 and Figs. 4.24-4.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70}]
  \newcommand{\dev}[4]{\draw[#3] (#1,#2) rectangle ++(1.0,0.7); \foreach \f in {0.3,0.65} {\draw[poly] ({#1+\f},{#2-0.08}) rectangle ++(0.08,0.86);} \node[font=\scriptsize\bfseries,fill=white,inner sep=0.5pt] at ({#1+0.5},{#2+0.35}) {#4};}
  \newcommand{\hot}[2]{\foreach \r/\c in {1.9/10,1.4/18,0.95/28,0.55/40} {\fill[red!\c] (#1,#2) circle (\r);} \draw[pdiff] ({#1-0.6},{#2-0.4}) rectangle ++(1.2,0.8); \node[font=\scriptsize\bfseries] at (#1,#2) {output};}
  \begin{scope}
    \node[font=\footnotesize\bfseries,red!70!black] at (2.8,4.3) {bad: pair across isotherms};
    \hot{1.2}{2.0}
    \dev{1.9}{2.2}{ndiff}{M1a}
    \dev{4.2}{0.6}{ndiff}{M1b}
    \node[font=\scriptsize,align=center,red!70!black] at (2.8,-1.2) {$\Delta T_{ab}$ large $\Rightarrow\ \Delta V_{os}=S^{V_{os}}_{\Delta T}\Delta T$};
  \end{scope}
  \begin{scope}[xshift=7.6cm]
    \node[font=\footnotesize\bfseries,green!40!black] at (2.0,4.3) {good: pair on one isotherm};
    \hot{2.0}{1.2}
    \dev{0.2}{2.0}{ndiff}{M1a}
    \dev{2.8}{2.0}{ndiff}{M1b}
    \draw[dashed,thick] (2.0,-0.9) -- (2.0,3.9);
    \node[font=\scriptsize,align=center,green!40!black] at (2.0,-1.2) {mirror the pair about the heat source's axis};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (13.0,2.4) {placer: $T(x,y)=\sum_k$ (precomputed\\ profile of device $k$, shifted)\\ superposition, so each move\\ costs one table lookup per pair};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta P_{j,int}=\sum_k\left(S^{P_j}_{C_k}C_k+\sum_iS^{P_j}_{R_{k,i}}R_{k,i}+\sum_{i\ne k}\tfrac12S^{P_j}_{C_{ki}}C_{ki}\right),\quad \sigma^2(V_{T0})=\frac{A^2_{V_{T0}}}{WL}+S^2_{V_{T0}}D^2,\quad \Delta P_{j,dist}=\sum_kS^{P_j}_{D_k}D_k}
$$

- **Interconnect:** from the MST of each net: $C_x$ = wire area × average area capacitance + terminal capacitances; coupling from parallel run length and overlap area of MST segments; $R=\rho_{\square,av}(L/t_x)/W$ with width from the terminal current.
- **Mismatch:** the area term is fixed after sizing; only the distance term changes with placement, so the placer needs $S^{P_j}_{D_k}$ per matched pair. The full form (Lampaert Eq. 4.25) is $\Delta P_j=\sum_k\big(|S^{P_j}_{\Delta V_{T0}}|\,3\sigma(V_{T0})_k+|S^{P_j}_{\Delta\beta}|\,3\sigma(\beta)_k\big)$.
- **Thermal:** precompute the temperature profile of a unit source on the die (double Fourier series, evaluated with a DCT), build each variant's profile by superposing unit sources once, and get any placement's temperature map by superposing shifted device profiles. Then $\Delta P_j=\sum_kS^{P_j}_{\Delta T_k}\Delta T_k$.

> [!example] Worked example: offset budget of a placed comparator (Lampaert §4.12.1, Table 4.2)
> Spec: offset < 5 mV, delay < 5 ns. Distance degradation per pair = distance × sensitivity: M1-M2 60 µm × 12 µV/µm = 0.720 mV; M3-M5 and M4-M6 70 µm × 2.9 = 0.203 mV each; M7-M8 118 µm × 0.2 = 0.024 mV; M11-M12 119 µm × 1.93 = 0.230 mV; M13-M14 38 µm × 3.8 = 0.145 mV; M15-M16 40 µm × 3 = 0.120 mV. Total 1.645 mV. The placer kept the most sensitive pair closest. Result: offset 3.7 mV, delay 2.8 ns (both pass); the same placer with the performance term disabled gave 6.9 mV and 5.4 ns (both fail), for 106 s vs 93 s of CPU.

> [!example] Worked example: thermal offset in a class-AB op amp (Lampaert §4.12.4, Tables 4.5–4.6)
> 140 mW, mostly in the output devices. Sensitivities of offset to pair temperature difference and the resulting $\Delta T$: M1a-M1b 1.6 mV/°C × 0.153 °C = 0.245 mV; M8a-M8b 3.7 × 0.084 = 0.319 mV; M13a-M13b 6.0 × 0.074 = 0.448 mV; total 1.012 mV. Nominal offset 1.3 mV, 2.3 mV after placement, spec < 3 mV. The sensitive pairs ended up placed symmetrically about the output transistors.

> [!tip] Remark
> Pelgrom's area and distance terms and the temperature rules are owned by [[Device Matching#Distance the Long-Range Term]] and [[Device Matching#Temperature and Heat Sources]]; here they are only cost terms. Substrate coupling is the one parasitic every contact shares, which is why substrate-aware placement needs incremental Green's-function updates instead of a lookup: [[Substrate Noise#Design Optimisation Constraints, Sensitivities, Placement]].

### Performance-driven routing

```tikz title="Sensitivity-driven A* routing: the shortest path runs beside a noisy net and costs more performance than a longer path away from it. After Lampaert Sec. 5.7 and Dundar Fig. 4.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.6cm,y=0.6cm]
  \draw[gray!40,step=1] (0,0) grid (14,9);
  \fill[gray!55] (5,6) rectangle (7,9); \node[font=\scriptsize,white] at (6,7.5) {device};
  \fill[violet!55] (3,2.6) rectangle (14,3.0);
  \node[font=\scriptsize,anchor=south,violet!70!black,fill=white,inner sep=1pt] at (8,3.05) {noisy net (clock) on M2};
  \fill[black] (1,0) rectangle (2,1); \node[font=\scriptsize\bfseries,white] at (1.5,0.5) {S};
  \fill[black] (12,7) rectangle (13,8); \node[font=\scriptsize\bfseries,white] at (12.5,7.5) {T};
  \draw[line width=3pt,red!70!black,opacity=0.8] (1.5,1) -- (1.5,2.0) -- (12.5,2.0) -- (12.5,7);
  \draw[line width=3pt,blue!70!black,opacity=0.8] (1.5,1) -- (1.5,5) -- (8.5,5);
  \fill[orange] (8,4.5) rectangle (9,5.5);
  \draw[dashed,very thick,orange!70!black] (9,5) -- (12.15,5) -- (12.15,7);
  \node[font=\scriptsize,red!70!black,anchor=north] at (7,-0.1) {red: shortest, but runs beside the clock for most of its length: large $S^{P}_{C_{ki}}C_{ki}$};
  \node[font=\scriptsize,blue!70!black,anchor=south,fill=white,inner sep=1pt] at (4.5,5.1) {blue: away from the clock};
  \node[font=\scriptsize,orange!60!black,anchor=north,fill=white,inner sep=1pt] at (8.5,4.4) {head cell; $h$ = est. cost to T};
  \node[font=\scriptsize,align=left,anchor=west] at (14.8,6.8) {A*: expand the partial path with least\\ $f=g+h$, \quad $g=\sum_{\text{segments}}\sum_j \Delta P_j$\\[2pt] $\Delta P_j=S^{P_j}_{C_i}C_i+S^{P_j}_{R_i}R_i+\sum_k S^{P_j}_{C_{ki}}C_{ki}$\\[2pt] $h$: same model on a Manhattan path to T;\\ a lower bound, so the first path to reach T\\ is the cheapest};
  \node[font=\scriptsize,align=left,anchor=west] at (14.8,2.4) {hard bounds (ANAGRAM III; LAYLA's\\ manufacturability phase): drop a partial\\ path from the heap as soon as one\\ $\Delta P_j$ exceeds its margin};
\end{circuitikz}
\end{document}
```

$$
\boxed{f(x)=g(x)+h(x),\qquad g=\sum_{\text{segments}}\sum_{j=1}^{N_s}\Delta P_j,\qquad F_k=\frac{1}{N_s}\sum_{j=1}^{N_s}\frac{\Delta P_j^{k}}{\Delta P_j}}
$$

- **Path search:** line expansion or maze routing with A*. The actual cost $g$ of a partial path sums the performance degradation of each added segment's $R$, $C$ to ground and lateral, fringe and overlap coupling (extracted inside a region of influence around the segment); the predictor $h$ uses the same model on a minimum Manhattan path to the target, a lower bound, so the search returns the minimum-cost path (Lampaert §5.7).
- **Net scheduling (LAYLA):** (1) pre-route every net alone, ignoring DRC and other nets (fast); (2) compute each net's performance impact factor $F_k\in[0,1]$; rip up and reroute in *increasing* $F_k$, so the most critical nets keep their ideal routes; (3) if margin remains, a manufacturability phase.
- **ROAD:** A* on a non-uniform, dynamically refined grid (no fixed wire pitch), weights from sensitivities divided by the allowed variation; after routing, extract, compare with bounds, raise the weights of violating parasitics and reroute; when all weights hit their maximum, go back to placement with wider ranges. Shields are added last, only where spacing fails. Symmetric nets get top routing priority.
- **ANAGRAM III:** prune any partial path whose accumulated parasitic exceeds its bound, instead of trading length against crosstalk.

> [!example] Worked example: spending spare margin on yield (Lampaert §5.10, Tables 5.1–5.3)
> Manufacturability cost $T=\sum_{i\ne k}\lambda_{ki}\Psi_{ki}$ (expected bridging faults × difficulty of detecting them), with partial paths that would break a spec pruned. Opamp 1: UGBW 1.013 → 1.010 MHz (spec > 1), PM 61.04° → 60.09° (spec > 60°), test error rate 0.11 % → 0.01 %. Opamp 2: UGBW 7.13 → 7.06 MHz (> 7), PM 70.3° → 70.2° (> 70°), test error rate 0.21 % → 0.03 %. CPU split for Opamp 2: placement 263 s, routing 321 s, yield step 213 s.

## Level 5: Analog Routing

### Algorithms and representations

| Algorithm | Idea | Analog use |
|---|---|---|
| Lee / Moore maze | wavefront numbering, backtrace; finds the shortest path if one exists; $O(nm)$ grid memory and time | basis of most area routers |
| Line expansion | search over line segments; fewer bends, less memory, not always shortest | ANAGRAM, LAYLA (gridless) |
| A* | best-first with an admissible estimate; worst case $O(n^2)$, much better on average | ROAD, sensitivity-driven routers |
| Channel (left-edge, VCG/HCG) | route channels between slices | early tools; poor parasitic control, rarely used now |
| Steiner heuristics | connect multi-terminal nets | Prim-like (grow from one terminal) or Kruskal-like (join closest pair) |
| Candidate generation + compatibility graph | generate routes per net, select a compatible set | x-y routing on layer pairs; treats all nets together |

> [!tip] Remark
> Representations: uniform grid (simple, memory-heavy), non-uniform grid, tile-based (corner stitching), or gridless with arbitrary-width wires and over-the-device routing (ANAGRAM II, ROAD, LAYLA). Analog needs gridless or non-uniform: wire widths vary with current and terminals are large shapes.

### Symmetric routing

```tikz title="Symmetric routing: mirrored obstacles keep detours symmetric; a crossing on one net only unbalances R and C; a connector gives both nets a layer change. After Dundar Figs. 4.13-4.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  cont/.style={fill=black,draw=none},
  pin/.style={fill=gray!70,draw=black}]
  % panel 1: mirrored obstacles
  \node[font=\footnotesize\bfseries,align=center] at (2,4.4) {asymmetric obstacle:\\ mirror it, route one half};
  \draw[dashed,thick] (2,-0.3) -- (2,3.8);
  \draw[pin] (0.2,0.2) rectangle (0.6,0.6); \draw[pin] (3.4,0.2) rectangle (3.8,0.6);
  \draw[pin] (1.4,3.0) rectangle (1.8,3.4); \draw[pin] (2.2,3.0) rectangle (2.6,3.4);
  \fill[gray!70] (2.6,1.4) rectangle (3.4,2.2); \node[font=\scriptsize,white] at (3.0,1.8) {obst.};
  \draw[gray!70,dashed,thick] (0.6,1.4) rectangle (1.4,2.2); \node[font=\scriptsize] at (1.0,1.8) {ghost};
  \draw[mone] (0.32,0.6) rectangle (0.48,2.6); \draw[mone] (0.32,2.45) rectangle (1.65,2.6); \draw[mone] (1.5,2.45) rectangle (1.65,3.0);
  \draw[mone] (3.52,0.6) rectangle (3.68,2.6); \draw[mone] (2.35,2.45) rectangle (3.68,2.6); \draw[mone] (2.35,2.45) rectangle (2.5,3.0);
  \node[font=\scriptsize,align=center] at (2,-0.8) {the detour exists on both sides,\\ so $R$ and $C$ stay equal};
  % panel 2: crossing bad
  \begin{scope}[xshift=5.4cm]
  \node[font=\footnotesize\bfseries,red!70!black,align=center] at (2,4.4) {nets must cross:\\ bridge on one net only};
  \draw[dashed,thick] (2,-0.3) -- (2,3.8);
  \draw[pin] (0.2,3.0) rectangle (0.6,3.4) node[midway,font=\scriptsize] {a}; \draw[pin] (3.4,3.0) rectangle (3.8,3.4) node[midway,font=\scriptsize] {b};
  \draw[pin] (0.2,0.2) rectangle (0.6,0.6) node[midway,font=\scriptsize] {b}; \draw[pin] (3.4,0.2) rectangle (3.8,0.6) node[midway,font=\scriptsize] {a};
  % net a: all M1
  \draw[mone] (0.32,1.75) rectangle (0.48,3.0); \draw[mone] (0.32,1.75) rectangle (3.68,1.9); \draw[mone] (3.52,0.6) rectangle (3.68,1.9);
  % net b: M1, M2 bridge over a, M1
  \draw[mone] (3.52,2.5) rectangle (3.68,3.0); \draw[mone] (0.92,2.5) rectangle (3.68,2.65);
  \draw[mtwo] (0.92,1.15) rectangle (1.08,2.65);
  \draw[mone] (0.32,1.15) rectangle (1.08,1.3); \draw[mone] (0.32,0.6) rectangle (0.48,1.3);
  \foreach \p in {(0.95,2.53),(0.95,1.18)} {\fill[cont] \p rectangle ++(0.1,0.1);}
  \node[font=\scriptsize,align=center,red!70!black] at (2,-0.8) {b: 2 vias + M2, a: M1 only\\ $\Rightarrow R_a\ne R_b,\ C_a\ne C_b$};
  \end{scope}
  % panel 3: connector
  \begin{scope}[xshift=10.8cm]
  \node[font=\footnotesize\bfseries,green!40!black,align=center] at (2,4.4) {connector at the axis:\\ both nets jog on M2};
  \draw[dashed,thick] (2,-0.3) -- (2,3.8);
  \draw[pin] (0.2,3.0) rectangle (0.6,3.4) node[midway,font=\scriptsize] {a}; \draw[pin] (3.4,3.0) rectangle (3.8,3.4) node[midway,font=\scriptsize] {b};
  \draw[pin] (0.2,0.2) rectangle (0.6,0.6) node[midway,font=\scriptsize] {b}; \draw[pin] (3.4,0.2) rectangle (3.8,0.6) node[midway,font=\scriptsize] {a};
  % a: M1 top, M2 jog at x=1.8, M1 bottom at y=1.4
  \draw[mone] (0.32,2.35) rectangle (0.48,3.0); \draw[mone] (0.32,2.35) rectangle (1.88,2.5);
  \draw[mtwo] (1.72,1.35) rectangle (1.88,2.5);
  \draw[mone] (1.72,1.35) rectangle (3.68,1.5); \draw[mone] (3.52,0.6) rectangle (3.68,1.5);
  % b: mirror, jog at x=2.2, bottom at y=1.0
  \draw[mone] (3.52,2.35) rectangle (3.68,3.0); \draw[mone] (2.12,2.35) rectangle (3.68,2.5);
  \draw[mtwo] (2.12,0.95) rectangle (2.28,2.5);
  \draw[mone] (0.32,0.95) rectangle (2.28,1.1); \draw[mone] (0.32,0.6) rectangle (0.48,1.1);
  \foreach \p in {(1.75,2.38),(1.75,1.38),(2.15,2.38),(2.15,0.98)} {\fill[cont] \p rectangle ++(0.1,0.1);}
  \node[font=\scriptsize,align=center,green!40!black] at (2,-0.8) {each net: 2 vias and one M2 jog\\ next to the axis: $R$, $C$ nearly equal};
  \end{scope}
  \begin{scope}[xshift=15.6cm,yshift=1.2cm]
  \draw[mone] (0,1.4) rectangle (0.45,1.7); \node[anchor=west,font=\scriptsize] at (0.55,1.55) {metal 1};
  \draw[mtwo] (0,0.9) rectangle (0.45,1.2); \node[anchor=west,font=\scriptsize] at (0.55,1.05) {metal 2};
  \fill[cont] (0.1,0.45) rectangle (0.35,0.7); \node[anchor=west,font=\scriptsize] at (0.55,0.57) {via};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Route one net of a symmetric pair, mirror it; a cell is accepted only if it is design-rule legal on *both* sides (LAYLA), equivalently mirror all obstacles first and route one half (ROAD), or grow both halves together (ANAGRAM II). The result detours around an obstacle that exists on one side only.
- When the paired nets must cross the axis, a plain crossing puts the bridge on one net only; a *connector* gives both nets a layer change near the axis so $R$ and $C$ nearly match (coupling to other nets can still differ).
- Exact route matching (Ozdal and Hentschke, cited by Xu et al.) requires equal wire length per layer for the two nets; Chen et al. instead maximise the degree of symmetry without an explicit constraint.
- Bundles of symmetric nets: corners make inner and outer nets differ in length, and an aggressor couples unequally into each; balance with extra path and adjustment sections.

### Crosstalk, net classes and shielding

```tikz title="Three shields in cross-section, same layer, between layers and through the bulk; the shield must sit at a quiet DC potential. After Dundar Fig. 4.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  psub/.style={fill=orange!12,draw=black!60},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  fl/.style={->,thick,red!70!black}]
  % (a) same layer
  \node[font=\footnotesize\bfseries] at (2,3.6) {(a) same layer};
  \draw[psub] (0,0) rectangle (4,0.8); \draw[diel] (0,0.8) rectangle (4,3.0);
  \draw[mone] (0.4,1.8) rectangle (1.0,2.2); \node[font=\scriptsize,above] at (0.7,2.2) {aggr.};
  \draw[mone] (1.7,1.8) rectangle (2.3,2.2); \node[font=\scriptsize,above] at (2.0,2.2) {GND};
  \draw[mone] (3.0,1.8) rectangle (3.6,2.2); \node[font=\scriptsize,above] at (3.3,2.2) {victim};
  \draw[fl] (1.0,2.0) -- (1.7,2.0);
  \node[font=\scriptsize,align=center] at (2,-0.5) {lateral field ends on the shield};
  % (b) between layers
  \begin{scope}[xshift=5.0cm]
  \node[font=\footnotesize\bfseries] at (2,3.6) {(b) between layers};
  \draw[psub] (0,0) rectangle (4,0.8); \draw[sti] (0,0.5) rectangle (4,0.8); \draw[diel] (0,0.8) rectangle (4,3.0);
  \draw[poly] (1.6,0.9) rectangle (2.4,1.2); \node[font=\scriptsize,anchor=west] at (2.45,1.05) {victim (poly)};
  \draw[mone] (0.6,1.6) rectangle (3.4,1.9); \node[font=\scriptsize,anchor=west] at (3.45,1.75) {GND};
  \draw[mtwo] (1.6,2.4) rectangle (2.4,2.7); \node[font=\scriptsize,anchor=west] at (2.45,2.55) {aggr.};
  \draw[fl] (2.0,2.4) -- (2.0,1.9);
  \node[font=\scriptsize,align=center] at (2,-0.5) {grounded plate between the two};
  \end{scope}
  % (c) bulk
  \begin{scope}[xshift=10.0cm]
  \node[font=\footnotesize\bfseries] at (2,3.6) {(c) through the bulk};
  \draw[psub] (0,0) rectangle (4,1.6); \draw[diel] (0,1.6) rectangle (4,3.0);
  \draw[ndiff] (0.3,1.35) rectangle (1.1,1.6); \node[font=\scriptsize,above] at (0.7,1.6) {aggr.};
  \draw[ndiff] (2.9,1.35) rectangle (3.7,1.6); \node[font=\scriptsize,above] at (3.3,1.6) {victim};
  \draw[pdiff] (1.6,1.35) rectangle (2.4,1.6);
  \draw[cont] (1.9,1.6) rectangle (2.1,2.2); \draw[mone] (1.6,2.2) rectangle (2.4,2.45); \node[font=\scriptsize,above] at (2.0,2.45) {GND};
  \draw[fl] (1.0,1.3) to[out=-60,in=-120] (1.8,1.3);
  \draw[->,thick,red!70!black,dashed] (1.0,1.2) to[out=-70,in=-110] (3.0,1.2);
  \node[font=\scriptsize,align=center] at (2,-0.5) {row of substrate ties sinks the current};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (14.3,1.6) {a shield works only if it\\ sits at a quiet DC potential;\\ ROAD adds shields last,\\ when spacing fails};
\end{circuitikz}
\end{document}
```

$$
\boxed{C_{1D}=A\,C_\alpha+S\,C_\beta,\qquad C_{2D}=C_{1D}+\frac{\Delta l\,C_\gamma}{d}}
$$

- $A$ overlap area, $S$ its perimeter, $\Delta l$ parallel run, $d$ spacing. 1-D and 2-D models are cheap enough for the inner loop; 2.5-D uses precomputed cross-sections; 3-D uses a library of solved structures. RF needs RLC or EM models.
- **Net classes (ILAC):** sensitive, noisy, non-critical, power. Route power first, then sensitive, then non-critical, noisy last; power and non-critical nets end up between sensitive and noisy ones. ANAGRAM: neutral (supply, bias), noisy (clocks, outputs), sensitive.
- **Order matters** because routed nets become obstacles: critical nets first get the privileged tracks.

> [!tip] Remark
> The rules a designer follows for crossings, coupling and shields are in [[Guard Rings, ESD and Interconnect#Crossing, Coupling and Shielding]]; substrate shielding in depth is in [[Substrate Noise]]. This section is how a router decides when to apply them.

### Net splitting and wire sizing

```tikz title="Net splitting (left, middle) and a current-driven tree whose segment widths follow the summed branch currents (right). After Dundar Fig. 4.12 and Sec. 4.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  mone/.style={fill=blue!55,draw=black!70},
  pin/.style={fill=gray!70,draw=black}]
  % net splitting
  \node[font=\footnotesize\bfseries,red!70!black] at (1.6,4.4) {shared ground line};
  \draw[mone] (0,0.3) rectangle (3.2,0.55); \draw[pin] (-0.4,0.15) rectangle (0,0.7); \node[font=\scriptsize,left] at (-0.4,0.42) {GND};
  \draw[mone] (2.6,0.55) rectangle (2.85,3.2); \node[font=\scriptsize,align=center] at (2.72,3.55) {output stage\\ $I$ large};
  \draw[mone] (1.0,0.55) rectangle (1.2,3.2); \node[font=\scriptsize,align=center] at (1.1,3.55) {sensitive\\ ref.\ tap};
  \draw[<->,red!70!black,thick] (0,0.0) -- (1.1,0.0) node[midway,below,font=\scriptsize] {$V=IR_{wire}$};
  \node[font=\scriptsize,align=center,red!70!black] at (1.6,-0.8) {tap sees the output\\ current's IR drop};
  \begin{scope}[xshift=4.8cm]
  \node[font=\footnotesize\bfseries,green!40!black] at (1.6,4.4) {split (star) or widen};
  \draw[mone] (0,0.3) rectangle (3.2,0.7); \draw[pin] (-0.4,0.15) rectangle (0,1.2);
  \draw[mone] (2.6,0.7) rectangle (2.95,3.2); \node[font=\scriptsize,align=center] at (2.77,3.55) {output stage};
  \draw[mone] (0,0.95) rectangle (1.1,1.1); \draw[mone] (0.95,0.95) rectangle (1.1,3.2); \node[font=\scriptsize,align=center] at (1.02,3.55) {ref.\ tap};
  \node[font=\scriptsize,align=center,green!40!black] at (1.6,-0.8) {tap returns on its own line;\\ $R_{wire}=\rho_\square\,l/w$ on the trunk};
  \end{scope}
  % current-driven steiner
  \begin{scope}[xshift=10.2cm]
  \node[font=\footnotesize\bfseries] at (2.2,4.4) {current-driven tree};
  \draw[pin] (-0.3,1.6) rectangle (0.1,2.2); \node[font=\scriptsize,left] at (-0.3,1.9) {src $4I$};
  \draw[mone] (0.1,1.7) rectangle (2.0,2.1);
  \draw[mone] (1.9,2.0) rectangle (2.1,3.4); \draw[pin] (1.8,3.4) rectangle (2.2,3.7); \node[font=\scriptsize,above] at (2.0,3.7) {$I$};
  \draw[mone] (2.0,1.75) rectangle (3.4,2.05);
  \draw[mone] (3.3,2.0) rectangle (3.5,3.4); \draw[pin] (3.2,3.4) rectangle (3.6,3.7); \node[font=\scriptsize,above] at (3.4,3.7) {$I$};
  \draw[mone] (3.4,1.8) rectangle (4.4,2.0);
  \draw[mone] (4.3,0.6) rectangle (4.5,2.0); \draw[pin] (4.2,0.3) rectangle (4.6,0.6); \node[font=\scriptsize,below] at (4.4,0.3) {$2I$};
  \fill[red!70!black] (2.0,1.9) circle (2pt); \fill[red!70!black] (3.4,1.9) circle (2pt);
  \node[font=\scriptsize,align=left,anchor=north west] at (-0.4,1.3) {segment width $\propto$ current it carries\\ ($4I$, $3I$, $2I$): sum branch currents\\ at each Steiner point (KCL first,\\ then size for EM and $IR$)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{wire}=\frac{l\,\rho_\square}{w},\qquad V_{drop}=I\,R_{wire}}
$$

- **Net splitting:** a high-current branch and a sensitive tap on the same wire share its $IR$ drop; give the tap its own return, or widen the shared segment (Dündar §4.4.1). ROAD's net splitter estimates which parts of a net carry little current.
- **Current-driven routing:** simulate branch currents (from user patterns or Monte Carlo), build the Steiner tree greedily from three terminals at a time, sum currents at each Steiner point (KCL) and size each segment for its own current; or build the terminal tree bottom-up from the smallest-current terminal and refine by annealing. A terminal-to-terminal sequence fixed before detailed routing keeps already-routed currents valid.

> [!tip] Remark
> The per-net performance case for wire width (R-sensitive nets wide, RC-sensitive moderate, symmetric nets equal; the 7 nm OTA results) is owned by [[Electromigration#Wire width is also a performance knob]], and the EM and IR checks by [[Electromigration]] and [[Guard Rings, ESD and Interconnect#Wires Are Resistors IR Drop]]. The owner's G6 gate needs exactly this joint: simulated branch currents carried to the wire and via that carries them ([[Analog Design Flow#Stage 5. Sign-off and handoff]]).

### Integrated placement and routing

- **KOAN/ANAGRAM II:** wires become annealable objects, reshaped as devices move; the cost holds DRC violations, crosstalk and net area.
- **GELSA:** slicing placement with approximate routing at every step; global and local symmetry in the cost.
- **ALADIN:** Steiner-tree global routing (Dijkstra on a channel graph weighted by congestion) for every intermediate placement, then compaction-based constructive detailed routing that needs no channel-width estimate.
- **Sequence pair with wires:** each wire is rectangles in the sequence pair with a wire-connectivity ordering condition.
- Tabu search over tiles that can be moved, swapped, routed and resized, including constraint transformation, beat the sequential flow (Dündar §4.5.4).

Analog has few nets, so putting global routing inside placement is affordable where it is not in digital (Dündar §4.5.4).

## Level 6: Layout in the Sizing Loop

```tikz title="Layout-aware sizing: a template-based layout and its parasitics inside the simulation-based sizing loop. After Castro-Lopez et al. Fig. 6.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=1.2cm,text width=2.9cm,font=\scriptsize}]
  \node[blk,fill=yellow!15] (o) at (0,0) {\textbf{optimiser}\\ SA (adaptive $T$)\\ then Powell};
  \node[blk,fill=green!12] (g) at (4.0,0) {\textbf{GC module}\\ slicing tree +\\ shape functions:\\ pick fingers, styles};
  \node[blk,fill=orange!15] (t) at (8.0,0) {\textbf{template instance}\\ Pcells; placement\\ and routing fixed};
  \node[blk,fill=blue!10] (x) at (12.0,0) {\textbf{parasitics}\\ A: extract (3-D A--G)\\ B: analytic + table};
  \node[blk,fill=violet!12] (s) at (12.0,-2.6) {\textbf{simulate}\\ SPICE with\\ parasitics};
  \node[blk,fill=red!8] (c) at (4.0,-2.6) {\textbf{cost}\\ infeasible: $\max_j w_j\log(y_j/Y_j)$\\ feasible: weighted\\ sum of log objectives};
  \draw[->,thick] (o) -- node[above,font=\scriptsize] {$\mathbf x$} (g); \draw[->,thick] (g) -- node[above,font=\scriptsize] {W, H} (t); \draw[->,thick] (t) -- (x); \draw[->,thick] (x) -- (s);
  \draw[->,thick] (s) -- node[above,font=\scriptsize] {performances + area} (c); \draw[->,thick] (c) -| (o);
  \node[font=\scriptsize,align=center] at (8.0,-4.0) {every candidate is evaluated \emph{with} its own layout:\\ area, aspect ratio and parasitics are known during sizing};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{infeasible: }\psi(\mathbf x)=\max_j\,w_j\log\frac{y_j(\mathbf x)}{Y_j}\qquad\text{feasible: weighted sum of }\log|y_{o,i}(\mathbf x)|}
$$

Layout-aware sizing (Castro-López et al., Ch. 6) puts a template-based layout inside the simulation-based sizing loop, so each candidate is simulated with its own parasitics and its own area:

1. The optimiser proposes $\mathbf x$ (sizes, currents).
2. The **geometric-constraints module** runs a modified Stockmeyer pass on the template's slicing tree: each leaf's shape function comes from its generator's styles and finger counts; it picks the geometric parameters that minimise area and *area loss* subject to the user's aspect ratio or maximum width and height.
3. A template instance is generated (Pcells) and its parasitics estimated: **approach A** = geometric device extraction + 3-D analytical-geometric wire extraction (commercial extractor quality); **approach B** = analytic diffusion area and perimeter per layout style + a lookup table of routing parasitics built once per template by sampling (first ~100 instances to find the critical parasitics, then denser sampling of only the relevant parameters).
4. Simulate with the parasitics; feed performance and geometry into the cost.

> [!example] Worked example: the same op amp sized three ways (Castro-López Tables 6.7–6.8)
> Specs: DC gain 110 dB, UGF 90 MHz, PM 65°, swing 5.25 V, slew 40 V/µs, minimise power and area, aspect ratio 1; load 100 kΩ ∥ 8 pF.
> - **I, no layout information:** nominal UGF 91.8 MHz and PM 67.6° pass, but extracted UGF 89.8 MHz and PM 63.4° fail; area 195.8 × 358.8 µm², aspect 0.55; 507.8 s.
> - **II, geometry + approach B:** extracted 105.4 MHz, 65.0°, all pass; 173.8 × 191.25 µm², aspect 0.91; 612.31 s.
> - **III, geometry + approach A:** 106.6 MHz, 66.2°, all pass (estimate equals extraction by construction); 189.6 × 193.05 µm², aspect 0.98; 880.3 s, with layout instancing and extraction about 17 % of the sizing time.

> [!tip] Remark
> This is the "generator is the objective function" loop of [[Analog Design Flow#Stage 4. Layout]]: a fast generator in the sizing loop, extraction of each candidate (or a model fitted to the generator's own layouts), and the extracted number as the only one that counts. Castro-López's approach B is an early fitted-model variant; their footnote that a template costs 1.5 to 2× a manual layout is the price of the generator.

## Level 7: LDEs, Constraint-Driven Flows and ML

### Layout-dependent effects

```tikz title="LDE-aware placement: separate wells put matched PMOS at different well-edge distances (left); one well island with dummies gives every device the same WPE and LOD (right). After Xu et al. Sec. II-B and Strasser Fig. 3.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  dpoly/.style={fill=red!25,draw=black!50}]
  \newcommand{\pdev}[3]{\draw[pdiff] (#1,#2) rectangle ++(1.0,0.8); \foreach \f in {0.3,0.62} {\draw[poly] ({#1+\f},{#2-0.1}) rectangle ++(0.08,1.0);} \node[font=\scriptsize\bfseries,fill=white,inner sep=0.5pt] at ({#1+0.5},{#2+0.4}) {#3};}
  \node[font=\footnotesize\bfseries,red!70!black] at (2.6,3.3) {one well per device};
  \foreach \x/\l in {0/P1,1.8/P2,3.6/P3} {\draw[nwell] (\x-0.15,0.85) rectangle (\x+1.15,2.45); \pdev{\x}{1.25}{\l}}
  \draw[<->,red!70!black] (1.15,0.65) -- (1.65,0.65) node[midway,below,font=\scriptsize] {well space};
  \draw[<->,red!70!black,thick] (1.0,2.6) -- (1.15,2.6); \node[font=\scriptsize,red!70!black,anchor=south] at (1.1,2.65) {edge too close};
  \node[font=\scriptsize,align=center,red!70!black] at (2.4,0.0) {WPE shifts $V_{TH}$ by distance to the well edge;\\ well-to-well spacing costs area};
  \begin{scope}[xshift=7.4cm]
  \node[font=\footnotesize\bfseries,green!40!black] at (2.9,3.3) {well island};
  \draw[nwell] (-0.9,0.2) rectangle (6.7,2.7);
  \foreach \x in {-0.5,5.5} {\draw[pdiff] (\x,1.25) rectangle ++(0.8,0.8); \draw[dpoly] (\x+0.36,1.15) rectangle ++(0.08,1.0);}
  \node[font=\scriptsize] at (-0.1,1.0) {dummy}; \node[font=\scriptsize] at (5.9,1.0) {dummy};
  \pdev{0.6}{1.25}{P1} \pdev{2.4}{1.25}{P2} \pdev{4.2}{1.25}{P3}
  \draw[ndiff] (-0.7,2.3) rectangle (6.5,2.5); \node[font=\scriptsize,anchor=west] at (6.8,2.4) {n+ well tie};
  \draw[<->,green!40!black,thick] (-0.9,0.5) -- (-0.5,0.5); \draw[densely dotted] (-0.5,0.4) -- (-0.5,1.25); \node[font=\scriptsize,green!40!black,anchor=west,inner sep=1pt] at (-0.45,0.5) {$\ge d_{WPE}$ (edge to first active)};
  \node[font=\scriptsize,align=center,green!40!black] at (2.9,-0.2) {all matched PMOS share one well, same edge distance;\\ dummies give every finger the same LOD / OSE};
  \end{scope}
\end{circuitikz}
\end{document}
```

- LDE-aware placement targets the well proximity effect (WPE), length of diffusion (LOD) and oxide-to-oxide spacing (OSE); WPE ties placement to **well island generation**, which recent work automates (including GAN-guided wells learned from manual layouts) (Xu et al. §II-B).
- Wells and guard rings appear in placement as minimum-distance constraints: modules inside a well or ring keep $d\ge d_{min}$ from everything outside; deep-trench devices sharing a trench have a forbidden distance band, $d\le s_{max}$ or $d\ge d_{DTI}$ (Strasser Ch. 3).
- Thermal-aware placement (thermal-driven symmetry, thermal-driven placement with matching) is the same family.

> [!tip] Remark
> What WPE, LOD/STI stress and their layout fixes are, with numbers, is owned by [[Device Matching#Well Proximity Effect]] and [[Device Matching#STI Stress and the Length-of-Diffusion Effect]]. A tool's job is to make every matched device see the same value, then verify it from extracted LDE parameters.

### Constraint-driven design

```tikz title="Components of a constraint-driven flow around one constraint store, and a complex constraint written in constraint logic programming. After Jerke and Lienig Figs. 7.3-7.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=1.0cm,text width=3.6cm,font=\scriptsize},
  st/.style={draw,thick,fill=gray!12,align=center,minimum height=0.6cm,text width=2.2cm,font=\scriptsize}]
  \node[st] (s1) at (0,3.0) {circuit design};
  \node[st] (s2) at (0,2.0) {floorplan / devices};
  \node[st] (s3) at (0,1.0) {placement, routing};
  \node[st] (s4) at (0,0.0) {verification};
  \draw[->,thick] (s1) -- (s2); \draw[->,thick] (s2) -- (s3); \draw[->,thick] (s3) -- (s4);
  \node[blk,fill=yellow!20,minimum height=3.6cm,text width=2.4cm] (m) at (3.6,1.5) {\textbf{constraint\\ management}\\[3pt] one store,\\ linked to design\\ objects; assign\\ top-down /\\ bottom-up;\\ detect over-\\ constraint};
  \node[blk,fill=green!12] (d) at (7.9,3.7) {\textbf{derivation}\\ specs $\to$ constraints\\ by rule, deduction, or expert};
  \node[blk,fill=orange!15] (t) at (7.9,2.2) {\textbf{transformation}\\ e.g.\ IR-drop $\to$ placement\\ and wire-width constraints};
  \node[blk,fill=blue!10] (c) at (7.9,0.7) {\textbf{sensitivity (CSA)}\\ which parameter matters,\\ how close to the bound};
  \node[blk,fill=red!8] (v) at (7.9,-0.8) {\textbf{verification}\\ meta-rules over DRC,\\ LVS, extraction};
  \foreach \n in {d,t,c,v} {\draw[<->,thick] (m.east) -- (\n.west);}
  \foreach \n in {s1,s2,s3,s4} {\draw[<->,gray] (\n.east) -- (m.west);}
  \node[font=\scriptsize,align=left,anchor=west] at (10.2,1.5) {complex constraint (CLP):\\[2pt] \texttt{starShaped(N)} $\wedge$ \texttt{netPin(N,P1)}\\ $\wedge$ \texttt{netPin(N,P2)} $\wedge$ \texttt{irDrop(P1,P2,V)}\\ $\wedge$ $V<0.1$\,V\\[4pt] simple constraints are unified\\ through shared variables N, P1, P2, V};
\end{circuitikz}
\end{document}
```

- **Management:** one store linked to design objects, assigned top-down (a shield constraint from a pad down to a sub-cell terminal), bottom-up, or across a virtual hierarchy; detects over-constraint (a constraint satisfaction problem; resolve by propagation, relaxation or backtracking, since weights stop discriminating when many constraints have similar weights).
- **Derivation:** objectives → constraints by rule, by deduction (a rule for "transistor" applies to MOS and bipolar), or by expert input.
- **Transformation:** a higher-level constraint becomes lower-level ones, e.g. an IR-drop budget becomes placement plus wire-width constraints; the choice of rule removes degrees of freedom.
- **Constraint sensitivity analysis:** sensitivity of an output to each parameter plus the relative distance to its bound, $d_l=e^{x_l-x}-1$, $d_u=e^{x-x_u}-1$ (violation when positive); used to pick which parameter to fix and to find weakly coupled sub-problems to solve in parallel. Scales to a few thousand variables.
- **Verification:** static (sign-off) and dynamic ("what-if" inside algorithms); meta-verification splits a complex constraint into sub-checks run by existing tools, cheapest first; initial rule-writing effort is comparable to writing DRC and LVS decks.

> [!example] Over-constraint, caught by verification (Jerke and Lienig Fig. 7.7)
> Two wires carry the same DC current $i$, $V_{IR,j}=i\,R\,l_j/w_j$, with the lengths fixed as drawn in their figure. Requiring $V_{IR,1}\le V_{IR,2}$ together with $w_1>w_2$ is feasible; requiring $V_{IR,1}\le V_{IR,2}$ together with $w_1\le w_2$ is flagged as conflicting in their example: the smaller IR drop is demanded of the wire that is not allowed to be wider.

### Modern flows and machine learning

```tikz title="Performance modelling for layout: data acquisition dominates the lifecycle; a placer explored by BO or annealing, scored by extraction or a learned surrogate, with multi-objective selection. After Xu et al. Figs. 1-3 and Sec. III."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=0.9cm,text width=2.5cm,font=\scriptsize}]
  \node[font=\footnotesize\bfseries,anchor=west] at (0,3.3) {OTA performance-model lifecycle (Xu et al.\ 2024)};
  \fill[orange!60] (0,2.2) rectangle (9.289,2.8); \fill[blue!50] (9.289,2.2) rectangle (10,2.8);
  \draw (0,2.2) rectangle (10,2.8);
  \node[font=\scriptsize] at (4.6,2.5) {data acquisition: P\&R + PEX + post-layout sim, 92.89\,\%};
  \node[font=\scriptsize,anchor=west] at (10.1,2.5) {train + infer 7.11\,\%};
  \node[font=\scriptsize,align=left,anchor=north west] at (0,2.0) {one label (PEX + post-sim) costs about as much as 3--4 P\&R runs;\\ transfer to a new design: accuracy drops 3--22\,\% vs.\ training from scratch};
  \begin{scope}[yshift=-0.9cm]
  \node[blk,fill=yellow!15] (w) at (0,0) {knobs: net weights\\ (BO) or random SA};
  \node[blk,fill=blue!10] (p) at (3.2,0) {analog placer\\ (MAGICAL)};
  \node[blk,fill=red!8] (e) at (6.4,0.7) {PEX + simulate\\ (slow, exact)};
  \node[blk,fill=green!12] (m) at (6.4,-0.7) {CNN / GNN\\ surrogate (fast)};
  \node[blk,fill=gray!15] (o) at (9.6,0) {MOBO: Pareto set\\ of offset, CMRR,\\ BW, gain, noise};
  \draw[->,thick] (w) -- (p); \draw[->,thick] (p) -- (e); \draw[->,thick] (p) -- (m); \draw[->,thick] (e) -- (o); \draw[->,thick] (m) -- (o);
  \draw[->,thick,dashed] (o.south) -- ++(0,-1.0) -| (w.south);
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Open end-to-end flows:** template-based (BAG, LAYGO), digital P&R tools reused for analog, and analog P&R (MAGICAL, ALIGN); both MAGICAL and ALIGN use ML components and have silicon results. Classical P&R optimised proxies (area, wire length); a complete flow can now be judged by post-layout simulation (Xu et al. §I).
- **Learn from humans:** VAE-predicted routing regions turned into router guidance (GeniusRoute), GAN-guided well generation (WellGAN) and well-aware placement, VAE for primitive-cell layout. Limited by small datasets and no direct performance optimisation.
- **Optimise post-layout performance directly:** Bayesian optimisation over the placer's net weights with extraction and simulation in the loop (good layouts, slow, suited to small circuits); CNN placement-quality prediction from tens of thousands of MAGICAL placements; a GNN inside an annealing placer.
- **Findings (Xu et al. §III):** data acquisition is 92.89 % of the modelling lifecycle; transfer to another sizing of the same topology works better than to another topology, with accuracy 3 % to 22 % below training from scratch (e.g. OTA2 DC gain 81.35 % → 59.50 %); multi-objective BO beat weighted-sum BO on 3 to 5 metrics per design across four OTAs (counting top-1 results).

> [!tip] Remark
> The data-cost finding is the quantitative version of the owner's reason for not using a learned model for layout ([[Analog Design Flow#Stage 4. Layout]]): labels need extraction and simulation, and there is little analog layout data. Faster PEX and SPICE shorten this loop directly, which is where ESPice and GPurify sit.

## Open problems

From the sources, with what each means for a tool:

1. **No analog static-timing equivalent.** Post-layout performance needs extraction plus simulation; linear sensitivities only hold near nominal; learned models are data-starved (Xu et al.; Lampaert Ch. 2). *For a tool:* make sensitivities and extraction cheap enough to sit in the loop.
2. **Routing is still open** (Dündar §4.8): routing quality is bounded by folding, merging and placement before it; one-step layout generation instead of a sequential flow is a research direction.
3. **RF interconnect is a device**, so routing must model it as one (Dündar §4.8).
4. **Manufacturability and yield** at advanced nodes: more complex rules, simple router extensions will not be enough (Dündar §4.8); spare performance margin can buy yield (Lampaert Ch. 5).
5. **Constraint completeness and verification coverage:** no method yet checks that a constraint set is complete; constraint sensitivity analysis is limited to a few thousand variables; design steps should remove freedom gradually rather than abruptly (Jerke and Lienig §7.7).
6. **Representation for ML-driven P&R** is overlooked; current work uses net weights or random annealing as proxies (Xu et al. §IV-B).
7. **Multi-objective optimisation** of physical design, since analog metrics compete (Xu et al. §IV-B).
8. **Transferability and efficient data:** active learning, pre-training, out-of-distribution detection, faster simulation (Xu et al. §IV-A).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Absolute (flat) representation | easy symmetry moves, merging via overlap | overlap penalty, slow search, post-processing |
| Slicing tree | fast shape-function sizing, templates | unreachable topologies, symmetry only via cost |
| S-F sequence pair | all packings, symmetry by construction | $O(n\log\log n)$ to $O(n^2)$ evaluation, bigger space than trees |
| ASF-B*/HB*-tree | $O(n)$ packing, symmetry islands, hierarchy | compacted placements only; contour bookkeeping |
| Deterministic enumeration (Plantage) | no tuning, Pareto set of shapes | needs small groups from constraint generation |
| Hard constraint in move set | always satisfied, no wasted evaluations | more complex moves |
| Constraint as cost penalty | simple | may be traded away; weights to tune |
| Direct performance cost | no bound-picking iterations; spare margin usable | sensitivities needed; linear model |
| Parasitic bounds (indirect) | simple tool interfaces | one arbitrary bound set over-constrains |
| MST net model | segments for $R$, $C$, coupling | $O(n^2)$ per net per move |
| Symmetric routing (mirror + double DRC) | matched $R$, $C$ | detours; crossings need connectors |
| Shields | coupling | tracks, capacitance to ground |
| Procedural generator | quality, predictability, portability | effort per topology |
| Template in the sizing loop | parasitics and area known during sizing | 1.5 to 2× manual layout to build; limited flexibility |
| Extraction in the loop (approach A) | estimate = extraction | ~73 % more CPU than no layout (880 vs 508 s) |
| ML surrogate | fast inference | 93 % of effort in data; weak cross-topology transfer |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Symmetry pair (vertical axis) | $x_i+x_{i'}+w_i=2\hat x$, $y_i=y_{i'}$; self-symmetric $x_i+w_i/2=\hat x$ |
| Sequence pair relations | before in $\alpha$ and $\beta$: left of; before in $\alpha$, after in $\beta$: above |
| S-F condition | $\alpha^{-1}(x)<\alpha^{-1}(y)\iff\beta^{-1}(\mathrm{sym}\,y)<\beta^{-1}(\mathrm{sym}\,x)$ |
| S-F count | $N_{SF}\le(n!)^2/\prod_k(2p_k+s_k)!$ |
| Labelled binary trees | $b_n\,n!$, $b_n=\binom{2n}{n}/(n+1)$, $<(n!)^2$ for $n\ge3$ |
| B*-tree packing | left child $x=x_p+w_p$, right child $x=x_p$; $O(n)$ with a contour |
| Shape addition | H: $(w_1+w_2,\max h)$; V: $(\max w,h_1+h_2)$ |
| Compaction | $x_j-x_i\ge d_{ij}$, longest path from $v_0$ |
| Metropolis | accept with $e^{-\Delta C/T}$; $T_0=-\overline{\Delta C^+}/\ln P_0$, $T_{k+1}=aT_k$, $a=0.8\ldots0.95$ |
| Placement cost | $C=\alpha C_{area}+\beta C_{AR}+\gamma C_{overlap}+\delta C_{perf}$ |
| Layout margin | $\Delta P^{min}_{lay}=P_{min}-P^{min}_{proc}$, $\Delta P^{max}_{lay}=P_{max}-P^{max}_{proc}$ |
| Linear degradation | $\Delta P_j=\sum_iS^{P_j}_{x_i}x_i$ |
| Parasitic bounds (indirect) | $\sum_jS^{\pm}_{ij}p_j\le\Delta W^{\pm}_{i,max}$ |
| Interconnect degradation | $\Delta P_j=\sum_k(S_{C_k}C_k+\sum_iS_{R_{k,i}}R_{k,i}+\sum_{i\ne k}\frac12S_{C_{ki}}C_{ki})$ |
| Mismatch with distance | $\sigma^2=A^2/WL+S^2D^2$; $\Delta P_{j,dist}=\sum_kS^{P_j}_{D_k}D_k$ |
| Thermal degradation | $\Delta P_j=\sum_kS^{P_j}_{\Delta T_k}\Delta T_k$ |
| A* | $f=g+h$, $h$ admissible |
| Net impact factor | $F_k=\frac1{N_s}\sum_j\Delta P^k_j/\Delta P_j$ |
| Manufacturability term | $T=\sum_{i\ne k}\lambda_{ki}\Psi_{ki}$ |
| Coupling models | $C_{1D}=AC_\alpha+SC_\beta$, $C_{2D}=C_{1D}+\Delta l\,C_\gamma/d$ |
| Wire | $R=l\rho_\square/w$, $V_{drop}=IR$ |
| Junction cap | $C_{jSB}=A_SC_j/(1+V_{SB}/\phi_j)^{m_j}+P_SC_{jsw}/(1+V_{SB}/\phi_j)^{m_{jsw}}$ |
| Layout-aware sizing cost | infeasible $\max_jw_j\log(y_j/Y_j)$ |
| Constraint distance | $d_l=e^{x_l-x}-1$, $d_u=e^{x-x_u}-1$ (violation if $>0$) |
| Steiner vs MST | rectilinear MST $\le1.5\times$ rectilinear Steiner |

## References

- **Graeb (ed.), *Analog Layout Synthesis: A Survey of Topological Approaches*, Springer 2011** (PDF page = printed + 14):
  - Preface pp. v–vii (75 % / 40 % / 50 % figures).
  - Ch. 1 Balasa, "Device-Level Topological Placement with Symmetry Constraints", pp. 3–58: placement problem and methods §1.1 (symmetry forms, absolute vs topological, representation choice); §1.3 S-F sequence pairs, Lemma 1, evaluation Steps 1y–4x, multiple groups, move set; §1.4 TCG equivalence, binary/O-trees, Lemma 2, S-F binary trees and move sets; §1.5 Table 1.1. §1.2 contour data structures (segment, red-black, skip list, priority queue) read for complexity only.
  - Ch. 2 Lin and Chang, "Hierarchical Placement with Layout Constraints", pp. 61–93: constraints Figs. 2.1–2.3, Eqs. 2.1–2.3, symmetry island Def. 2.1, B*-tree, ASF-B*-tree Lemmas 2.1–2.2 and Theorems 2.1–2.3, HB*-tree, Eq. 2.4–2.5, moves Op1–Op5, Table 2.2, Tables 2.5–2.6, §2.7–2.8.
  - Ch. 3 Strasser, Eick, Graeb, "Deterministic Analog Placement by Enhanced Shape Functions", pp. 95–148: definitions, constraint types and DTI (Eqs. 3.13–3.18), SMP graph and HSMPG tree (Table 3.1, Eq. 3.19, Algorithm 3.1), shape functions §3.4, Table 3.2, conclusion. The B*-tree constraint-solving details of §3.3 and §3.5 were skimmed.
  - Ch. 4 Dündar and Unutulmaz, "Routing Analog Circuits", pp. 149–204: §4.2 algorithms, §4.3 representations, §4.4 net splitting, symmetric routing (Figs. 4.13–4.14), crosstalk Eqs. 4.2–4.3 and shielding Fig. 4.16, §4.5 strategies (ILAC, MIGHTY, SALIM, SLAM, ANAGRAM Eq. 4.4, ANAGRAM II, parasitic bounds Eqs. 4.5–4.7, PARCAR, ROAD, ANAGRAM III, A* Eqs. 4.8–4.9, integrated P&R, ALADIN, templates and LDS Figs. 4.22–4.25, x-y routing), §4.7 yield and current-driven routing, §4.8. RF and FPAA routers (§4.6) read, not used.
  - Ch. 5 Said, Dessouky et al., "Analog Layout Retargeting", pp. 205–242: §5.1–5.4 flow, constraint graph and LP (Eqs. 5.1–5.4), §5.6 contact merging, §5.9. The graph-based simplex details of §5.5 not reproduced.
  - Ch. 6 Castro-López et al., "The Layout-Aware Solution", pp. 243–268: Table 6.1, Eqs. 6.1–6.4, template cost footnote, Fig. 6.1 flow, §6.4 GC module (Table 6.2), §6.5 approaches A/B, Tables 6.7–6.8.
  - Ch. 7 Jerke and Lienig, "Constraint-Driven Design Methodology", pp. 269–298: §7.2–7.4 (categories, CLP Fig. 7.3, components Fig. 7.4, CSA Eq. 7.1, verification Fig. 7.7), §7.7 outlook. §7.5–7.6 skimmed.
- **Lampaert, Gielen, Sansen, *Analog Layout Generation for Performance and Manufacturability*, Kluwer 1999** (PDF page = printed + 12): Ch. 1 pp. 1–20 (design flow, layout styles, procedural / template / rule-based / algorithmic tools, LAYLA overview); Ch. 2 pp. 21–52 (margins Eqs. 2.1–2.7, indirect methods and flexibility, direct method Eqs. 2.12–2.13, sensitivity methods Eqs. 2.14–2.24, mismatch rules, thermal model Eqs. 2.40–2.49, substrate measures); Ch. 3 pp. 53–70 (variants, merging Eq. 3.1, strategies, stacking, interface/layout modes, technology independence); Ch. 4 pp. 71–118 (problem, representations, device model, interconnect area Eqs. 4.4–4.5, constraint handling, cost Eqs. 4.6–4.12, net estimators, Eqs. 4.13–4.32, schedule Eqs. 4.36–4.40, Tables 4.1–4.6); Ch. 5 pp. 119–153 (problem, cost Eqs. 5.4–5.11, symmetric routing, multi-terminal nets, scheduling Eqs. 5.12–5.15, Tables 5.1–5.3); Ch. 6 pp. 155–157 (industrial use, time split, 5–7×). The gridless maze data structures of §5.6 and the yield/testability fault model of §5.9 summarised only.
- **Xu, Li, Ho, Yu, Zhu, "Performance-Driven Analog Layout Automation: Current Status and Future Directions (Invited Paper)", ASP-DAC 2024, pp. 679–685:** §I–II (template, digital-P&R and analog P&R flows; conventional constraints; performance-aware, LDE, thermal, learn-from-human and BO methods), §III (lifecycle, Table I transfer, MOBO vs weighted BO), §IV.
- **Graeb, *Analog Design Centering and Sizing*, Springer 2007:** §1.3–1.4 pp. 7–13 (synthesis steps; nominal then tolerance design) for the origin of the process interval only.
