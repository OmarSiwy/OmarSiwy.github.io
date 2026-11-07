---
title: Analog Design in the Age of AI
description: The flow I use to take an analog block from spec to signed-off layout with LLM agents doing most of the typing. Every hand-off is an executable gate, margin is a number, and the agent never grades its own work.
publishedAt: 2026-10-21
updatedAt: 2026-10-26
slug: analog-design-age-of-ai
tags:
  - analog
  - tooling
  - llm
draft: false
---

Earlier notes of mine argued three things separately: where the analog design cycle hurts, what tooling I had to build before a language model could be useful on it, and how to size a circuit for margin instead of for a nominal point. This post folds them into one argument and one question. An agent is going to write most of the netlists, behavioral models, testbenches, layout generators and scripts in my designs from now on. Given that, what flow maximizes the probability that the chip works, and where exactly does the agent sit in it?

The short version. Analog designs die at hand-offs, and the probability that a design works is close to the product of the probabilities that each hand-off preserves the spec. A flow raises that product by making every hand-off an executable check, with a margin defined in the space where variation acts. That was true before language models. What changes with them is the discipline around the checks, because the thing writing the design is now fast, confident, tireless, and bad at grading its own work.

This is my view as someone building open-source tools for it, not a survey. Where I make a claim about someone else's tool or paper, it is numbered and linked at the bottom.

## 1. P(success) is a product of hand-offs

The cycle, as it is actually run:

1. **Architecture.** Split the system into blocks, hand each one a specification, and model the whole thing behaviorally before touching a transistor.
2. **Topology.** Pick a circuit for each block and back it with hand calculations.
3. **Sizing.** Size it until it meets its spec across corners and Monte Carlo.
4. **Layout.** Draw it, extract it, and find out what the schematic lied about.
5. **Integration.** Put the blocks together and verify the top level.
6. **Silicon.** Measure it, and find out what the models lied about.

None of this is linear. Post-layout results send you back to sizing, sizing failures send you back to topology, and a block that cannot hit its spec sends you back to architecture to renegotiate. That recursion is why a serious block takes months and a mixed-signal front end takes a year or more.

Write the outcome as a chain. The design works if the architecture spec was achievable, and the schematic met the block spec given the architecture, and the extracted layout met it given the schematic, and the blocks met it together given that each did alone, and the silicon behaved like the extracted netlist, and the tests asked the right questions. Six conditional probabilities, each below one for a reason you can name:

| Hand-off | Why the factor is below one |
|---|---|
| spec to architecture | block specs are handed down as point values before anyone knows how sensitive the system is to each one |
| architecture to schematic | a nominal pass is a point, not a region; a spec that is just met sits at 50 % yield (section 2) |
| schematic to layout | parasitics, layout effects on matching, and coupling the schematic never modelled |
| blocks to system | supply and substrate coupling, bias distribution, loading by a neighbour, start-up order |
| extracted netlist to silicon | models wrong by an unknown amount; corners that are not worst cases for your metric |
| silicon to shipped part | finite test time; interfaces that fail in dimensions margin does not see |

The 2022 Wilson Research Group study puts first-silicon success at roughly a quarter of projects, with analog tuning flaws a leading and growing cause of respins [1]. That is the product doing its work.

### What changes when an agent writes the design

Two results from this year put numbers on it. In Yoshioka's "vibe tapeout" study, Claude Sonnet 5.5 agents took an 11-bit, 5.12 MS/s SAR ADC from an English spec to a DRC- and LVS-clean, post-extraction sign-off on sky130, with no GUI, through text wrappers around SPICE, Magic and netgen [2]. Every arm met the SNDR spec at schematic level. Every arm then lost 8 to 13 dB at first extraction and spent 8 to 14 hours finding out why. The arm given a sanitized reference design (architecture, device ratios, floorplan images, no GDS) signed off in 18.9 hours without intervention. The arm given only the spec never reached sign-off. From-scratch layouts came out 1.6 to 2.8 times the area of the ported one. The Analog Design Bench, 50 transistor-level tasks written by 17 designers and graded by an isolated verifier, reports full-specification pass rates between 8 and 78 percent across 15 agent configurations in two-hour attempts, with most failures at electrical closure rather than at legality, and a task-matched reference topology worth 18.7 points to one model [3].

Read those against the table above. The architecture-to-schematic factor got cheap: an agent reaches a passing schematic in minutes to hours. The factors that were always the killers did not move. Worse, the same study catalogued how agents fail silently: an extraction flow that lumped coupling capacitance into capacitance to ground and reported 67 dB where the real number was 58; a block that passed LVS with unconnected nets; a GDS exported without port labels; a helper agent that "met" the spec by fitting decode weights after looking at the FFT, which no chip can do without calibration; and agents that kept optimizing past spec until a deadline stopped them [2]. All of these were caught only by independent re-verification.

So an AI-era flow is not the old flow run faster. It is the old flow with the gates made executable and independent, with the spec and the acceptance criteria owned by a human, and with the agent used for the parts of the work where it is strong.

## 2. Two pictures you have to get right first

### 2.1 Variation is the bell. The pass probability is not.

An earlier draft of mine described "an N-dimensional bell curve whose height is the probability of success" and said the goal was to sit at its peak. That picture is wrong, and the correction matters for everything below.

Write the sizing as a vector $x$ (widths, lengths, currents, or gm/Id intents), the deterministic conditions as a finite set of corners $c$ (supply, temperature, foundry section, a parasitic scenario), and the statistical parameters as $s$, drawn from a distribution whose covariance depends on $x$ because local mismatch scales as $1/\sqrt{WL}$ [11][12]. Each spec is an inequality $f_i(x, s, c) \ge b_i$. The acceptance region is the set of $s$ for which every spec holds at every corner, and the parametric yield is the probability mass of the bell that lands inside it [5]. The bell is the variation. The pass probability is the integral.

Two consequences follow. First, a nominal optimizer that pushes along a Pareto front (least power for the spec, say) drives some spec to equality. If $f_i = b_i$ at the nominal point and the variation is smooth and symmetric, half the bell is outside that spec: the partial yield on it is 50 %. A design "optimized" at nominal has to be backed off before it is a design. Second, the right objective is not a point on a surface but a distance from the boundary. The standard formulation is design centering:

$$
\max_{x}\; t \quad \text{subject to} \quad \mathrm{sense}_i \, \frac{f_i(x, c) - b_i}{s_i} \;\ge\; t \quad \text{for every spec } i \text{ and corner } c .
$$

Maximize the smallest normalized slack over all specs and corners. The scale $s_i$ decides what margin means. With $s_i = |b_i|$ it is relative margin, the "20 % on every spec" a designer usually means. With $s_i$ the standard deviation of $f_i$ under mismatch it is the worst-case distance in sigmas, and every partial yield is at least $\Phi(t)$ [4][5]. Mismatch enters either as $k$ sigmas subtracted from each spec or through $s_i$ itself. Figure 1 is the picture.

```tikz title="Figure 1. The acceptance region A in two of the sizing variables. Variation is the cloud around the chosen point; yield is the part of the cloud inside A. A nominal optimum sits on the boundary and gives 50 % on its binding spec. The design center maximizes the smallest normalized slack t, and a slide along the power axis picks the cheapest point that still clears the margin floor."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.0,0) node[anchor=west] {$x_1$};
  \draw[->] (0,0) -- (0,5.6) node[anchor=south] {$x_2$};
  \node[font=\scriptsize,anchor=north west] at (0.15,5.5) {$A$: every spec met at every corner, in two of the sizing variables};
  \draw[thick,fill=black!5] plot[smooth cycle,tension=0.7] coordinates
    {(1.1,2.4) (1.7,1.2) (3.6,1.0) (4.9,1.25) (5.25,2.6) (4.9,3.8) (3.6,4.25) (2.2,4.1) (1.3,3.4)};
  \node[font=\scriptsize,anchor=north] at (3.6,0.85) {UGF at ss};
  \node[font=\scriptsize,anchor=west] at (5.35,2.6) {PM at ff};
  \node[font=\scriptsize,anchor=south] at (3.6,4.35) {gain at ss};
  % nominal optimum on the boundary
  \foreach \p in {(1.65,0.95),(2.15,1.45),(1.75,1.4),(2.1,0.98),(1.55,1.25),(2.25,1.15),(1.9,0.85),(2.0,1.55),(1.5,1.0),(2.3,1.4),(1.8,1.1),(2.05,1.28)}
    \fill[black!45] \p circle (0.04);
  \fill (1.9,1.19) circle (0.07);
  \node[font=\scriptsize,anchor=south east] at (1.8,1.3) {nominal};
  % design center
  \draw[dashed] (3.6,2.6) circle (1.6);
  \foreach \p in {(3.4,2.4),(3.9,2.8),(3.5,2.9),(3.8,2.3),(3.3,2.7),(3.95,2.55),(3.6,2.2),(3.7,3.0),(3.25,2.45),(3.85,2.95),(3.55,2.65),(3.75,2.5)}
    \fill[black!45] \p circle (0.04);
  \fill (3.6,2.6) circle (0.07);
  \draw[<->] (3.6,2.6) -- (5.2,2.6) node[midway,anchor=south,font=\scriptsize] {$t$};
  \draw[<->] (3.6,2.6) -- (3.6,4.2) node[midway,anchor=west,font=\scriptsize] {$t$};
  \node[font=\scriptsize,anchor=south west] at (4.15,3.1) {center};
  % the power slide
  \draw[->,dashed] (3.6,2.6) -- (3.3,1.7);
  \draw[dashed,black!50] (3.3,1.7) circle (0.7);
  \draw[fill=white] (3.3,1.7) circle (0.07);
  \node[font=\scriptsize,anchor=north west] at (3.4,1.65) {slide};
  \node[font=\scriptsize,anchor=north west,align=left,text width=8.2cm] at (0,-0.35)
    {\textbf{nominal}: the smallest $W_n$ and $I_B$ that pass. It sits on the boundary, so half of its variation cloud is outside $A$: 50\,\% yield on that spec. \textbf{center}: the largest inscribed circle in normalized slack; the binding specs touch it at once. \textbf{slide}: the least $I_B$ whose re-centered slack still clears the floor.};
\end{circuitikz}
\end{document}
```

None of this is new. Antreich, Graeb and Wieser formalized worst-case distances in 1994, MunEDA has sold it as WiCkeD since 2000, and Cadence's Variation Option and Keysight's ADS yield optimizer do versions of it [4][6][7][8]. What is new is that an open stack can afford it for every block instead of the one that scares you most, and that an agent can be told to run it rather than asked to feel its way to a margin.

### 2.2 Margin belongs to one PDK

A centered design is centered against one set of models. Change the process and the sizes are wrong, not just the layout. What ports across processes is the design intent: the topology, the specs, the gm/Id (or inversion coefficient) at which each device runs, its current, the rule that chose its length, and the current ratios [15][17][18]. What does not port is everything the intent is solved into: width, gate voltage, intrinsic gain at a given length, the set of available lengths, supply and headroom, the mismatch coefficient $A_{VT}$, $f_T$, flicker noise, layout-dependent effects, and fin quantization [15][19][20].

My own numbers for a five-transistor OTA sized from intents on two kits: current, power and gain-bandwidth agreed within 7 % between FreePDK45 and ASAP7, and the DC gain was 35.7 dB on one and 24.6 dB on the other, because ASAP7 offers a single 21 nm gate length and gain at a fixed length is not an invariant. The same resize shrank the input pair's gate area by about 50 times, which for equal $A_{VT}$ is about 7 times the offset sigma. Neither is a bug in the method. Both are what "margin is per PDK" means in practice.

The consequences for the flow: store intents, not widths; re-solve width from each kit's own characterization; carry the specs, the corner roles and the $k$-sigma choice along with the intents; re-center on the target kit before believing any margin; and leave a tuning knob, a reference current or a back gate, for what the models get wrong. A gm/Id residual in a retarget log shows the solve worked, not that the design is centered.

In my tools that is concrete. Schemify-PDK-Manager installs the kit per project, pins its version, and maps technology-neutral devices onto it. GmIDVisualizer characterizes that kit's devices into lookup tables. Every width on a cell's documentation page is one `gmid.*` call into those tables, so a kit switch re-solves the page instead of leaving stale widths in it, and Schemify-Interop carries the same intents into Virtuoso, where they are solved on the target kit.

## 3. The flow

```tikz title="Figure 2. The flow as a chain of gated hand-offs. Solid arrows go forward through the gates. The solid loop on the left joins sizing to post-layout: it is part of the flow, not a way back. Dashed arrows are the only legal ways back, each to the stage that owns the failure. The gray line in each box says who does the work."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % stage boxes: x 0..8.4, height 1.1, pitch 1.7
  \draw[fill=black!4] (0,12.35) rectangle (8.4,13.45);
  \node[align=center,text width=8.1cm] at (4.2,12.9)
    {\textbf{1a. Spec table, golden model, golden testbench}\\
     {\scriptsize\color{black!60} you: spec, acceptance, deadlines $\cdot$ agent: model and bench}};
  \draw[fill=black!4] (0,10.65) rectangle (8.4,11.75);
  \node[align=center,text width=8.1cm] at (4.2,11.2)
    {\textbf{1b. Tree to fundamental blocks; specs flow down}\\
     {\scriptsize\color{black!60} agent: split, models, bench per node $\cdot$ you: approve}};
  \draw[fill=black!4] (0,8.95) rectangle (8.4,10.05);
  \node[align=center,text width=8.1cm] at (4.2,9.5)
    {\textbf{2. Topology per block, decision record}\\
     {\scriptsize\color{black!60} agent: literature, comparison table $\cdot$ you: approve the choice}};
  \draw[fill=black!4] (0,7.25) rectangle (8.4,8.35);
  \node[align=center,text width=8.1cm] at (4.2,7.8)
    {\textbf{3. Sizing as gm/Id intents; burn-down to zero}\\
     {\scriptsize\color{black!60} agent: intents, netlists, benches $\cdot$ simulator: corners, MC}};
  \draw[fill=black!4] (0,5.55) rectangle (8.4,6.65);
  \node[align=center,text width=8.1cm] at (4.2,6.1)
    {\textbf{4. Centering: max-min slack, $k\sigma$ mismatch}\\
     {\scriptsize\color{black!60} optimizer owns the search $\cdot$ agent writes the objective}};
  \draw[fill=black!4] (0,3.85) rectangle (8.4,4.95);
  \node[align=center,text width=8.1cm] at (4.2,4.4)
    {\textbf{5. Layout: generator code, check scripts}\\
     {\scriptsize\color{black!60} agent: generator and scripts $\cdot$ a past design if one exists}};
  \draw[fill=black!4] (0,2.15) rectangle (8.4,3.25);
  \node[align=center,text width=8.1cm] at (4.2,2.7)
    {\textbf{6. Post-layout: the same benches, extracted}\\
     {\scriptsize\color{black!60} independent script recomputes $\cdot$ agent explains the gap}};
  \draw[fill=black!4] (0,0.45) rectangle (8.4,1.55);
  \node[align=center,text width=8.1cm] at (4.2,1.0)
    {\textbf{7. Sign-off; handoff with intents; re-center}\\
     {\scriptsize\color{black!60} you: waivers $\cdot$ the target environment repeats the gates}};
  % forward arrows with gate tags
  \draw[->] (4.2,12.35) -- (4.2,11.75); \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,12.05) {G0};
  \draw[->] (4.2,10.65) -- (4.2,10.05); \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,10.35) {every node matches its model};
  \draw[->] (4.2,8.95) -- (4.2,8.35);   \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,8.65) {record with sources};
  \draw[->] (4.2,7.25) -- (4.2,6.65);   \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,6.95) {G1};
  \draw[->] (4.2,5.55) -- (4.2,4.95);   \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,5.25) {G2};
  \draw[->] (4.2,3.85) -- (4.2,3.25);   \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,3.55) {G3 G4};
  \draw[->] (4.2,2.15) -- (4.2,1.55);   \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,1.85) {G5 G6};
  \draw[->] (4.2,0.45) -- (4.2,-0.25);  \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,0.1) {G7};
  \node[font=\scriptsize,anchor=north] at (4.2,-0.3) {to silicon, and to the tests margin cannot answer};
  % the legal ways back
  \draw[->,dashed] (8.4,9.7) -- (8.9,9.7) -- (8.9,11.0) -- (8.4,11.0);
  \node[font=\scriptsize,anchor=west,align=left,text width=3.2cm] at (9.1,10.35)
    {no candidate passes headroom or gain on this PDK: renegotiate the split or the spec};
  \draw[->,dashed] (8.4,8.0) -- (8.9,8.0) -- (8.9,9.3) -- (8.4,9.3);
  \node[font=\scriptsize,anchor=west,align=left,text width=3.2cm] at (9.1,8.65)
    {a spec that sizing cannot meet goes back to the topology};
  \draw[->,dashed] (8.4,6.3) -- (8.9,6.3) -- (8.9,7.6) -- (8.4,7.6);
  \node[font=\scriptsize,anchor=west,align=left,text width=3.2cm] at (9.1,6.95)
    {no centered point clears the margin floor at the power budget};
  \draw[->,dashed] (8.4,2.9) -- (8.9,2.9) -- (8.9,4.2) -- (8.4,4.2);
  \node[font=\scriptsize,anchor=west,align=left,text width=3.2cm] at (9.1,3.55)
    {a post-layout miss: fix the largest contributor in layout first};
  % the sizing-layout loop: part of the flow, not a way back
  \draw[->,thick] (0,2.5) -- (-0.5,2.5) -- (-0.5,7.8) -- (0,7.8);
  \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt,rotate=90] at (-0.5,5.15) {sizing--layout loop};
  \node[font=\scriptsize,anchor=east,align=right,text width=3.4cm] at (-0.9,5.15)
    {\textbf{analog block}: the loop runs once. Extracted parasitics go back into the benches as fixed C and R, and the block is re-centered. \textbf{cell or tile}: stages 3 to 6 are one evaluation. The generator and extraction sit inside the sizing objective, a model fitted to the generator's own layouts carries the search, the top candidates are re-run through layout, extraction and the bench, and the gate number is the extracted one.};
  \node[font=\scriptsize,anchor=north west,align=left,text width=10.4cm] at (0,-0.8)
    {The golden testbench is written once at 1a and never edited to make a block pass. A failing spec returns to the stage that owns it, never to the bench; a spec change is a logged decision. The solid loop on the left is not a return: for a cell or a tile it is the objective function, and for an analog block it runs once with the extracted parasitics carried back.};
\end{circuitikz}
\end{document}
```

The flow is top-down and burn-down. The system starts as a block diagram of Verilog-A models, each a known circuit in behavioral form. Every later stage replaces one model with its transistor circuit and re-runs the same testbench. The design is done when no Verilog-A remains and every golden testbench passes, with margin, from schematic through post-layout. Three ideas carry it:

- **The golden testbench** is written once at stage 1 and never edited to make a block pass. The same bench decides the golden model, the block diagram, each transistor block and the extracted layout. If the spec itself was wrong, changing the bench is a decision that gets logged, not a fix.
- **The burn-down count** is the progress bar: the number of Verilog-A nodes still at their default. It only goes down, leaf first, and Analog-Skills' `va-tree` prints it with the tree.
- **Margin** is a number chosen at stage 1 per spec and checked at every gate. A pass without margin is a fail.

Six ground rules the agent runs under. One simulator for everything, ESPice, so a result never depends on which engine ran it. One project format as the spine, Schemify's, so every tool reads from and writes back to the same files. Derive, never type: a block number comes from a spec with its margin and a device size from a lookup on the active kit, and a typed number in a design is a bug. Verify independently: a reported pass is a claim until a separate script recomputes the deciding number from raw data. Research before deciding: every topology, formula and layout technique cites where it came from. Log what every tool was used for, append-only, so the next session or the next agent picks up where this one stopped instead of redoing it. Analog-Skills is these rules and the stages below written for the agent, with one reference file per tool. Each stage names the tool that does each step; section 5 gives each tool's status.

### Stage 1. Spec, golden model, golden bench, hierarchy

Kundert's rule for top-down mixed-signal design is that specifications should be executable models and scripts that get used daily, not documents, and that the classic failure is a circuit-level design that is never checked against the architectural description because the architectural testbenches cannot be reused [21]. Gielen and Rutenbar describe the same descent as specification translation: a block's specs are derived from its parent's and verified by simulation before going down a level, until the sub-blocks are single devices and translation becomes sizing [22]. Stage 1 is those two papers made mechanical.

1. **Spec table.** One row per requirement: condition, target with margin, unit, and the measurement that decides it. A spec without a condition cannot be translated and goes back to whoever wrote it.
2. **Golden model.** The whole system as one Verilog-A block, the behavioral implementation of the top Schemify cell, which ESPice compiles through VerA when a deck loads it. This is the executable spec. It models block behavior, swing and impedances and gain first, then slew and bandwidth as needed, not transistors [23]. Digital control such as SAR logic or a calibration state machine stays IEEE 1364 Verilog and runs in the same simulation, on VerA's event engine inside ESPice.
3. **Golden testbench.** A Verilog-A testbench module for time-domain specs and Schemify bench records (corners, sweeps, Monte Carlo and spec lines in one file) for small-signal ones, with every measured value on a node and every limit a parameter named after its spec key. It runs unchanged on the golden model, on the block diagram, on each transistor block, and on the extracted layout.
4. **Hierarchy tree.** Break the system down level by level until every leaf is a fundamental circuit block: a known circuit that maps to one transistor topology and one sizing procedure, whose spec sheet is measurable on its own pins (a differential pair with its tail, a current mirror, a cascode load, a latch, a switch). A node that names no known circuit is not a leaf yet. Every node is a Schemify cell with two implementations, its behavioral model and the diagram of its children, and its own golden bench.
5. **Specs flow down.** Each node's spec sheet derives from its parent's with margin, every number with its source.
6. **Equivalence at every level.** Each node's children diagram is checked against the node's own model on the node's bench. A parent that passes while its children fail is a finding: a constraint the parent model hid.
7. **Spec sensitivity.** With the system still behavioral, sweep each block's model parameters by its margin on the system bench and record which block specs the system fails first. This is the only Monte Carlo possible before transistors exist, and it is the first factor in the product: it tells you where the margin has to go before anyone sizes anything.

```tikz title="Figure 3. The burn-down tree for a two-stage Miller op-amp: five Verilog-A nodes, retired leaf-first in the circled order, until none remain."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % root
  \draw[fill=black!4,rounded corners=2pt] (2.0,4.1) rectangle (6.0,5.1);
  \node[align=center] at (4.0,4.6) {\textbf{opamp2}\quad{\scriptsize L0}\\{\scriptsize\color{black!60} opamp\_beh $\to$ XS1, XS2, $C_c$}};
  % level 1
  \draw[fill=black!4,rounded corners=2pt] (-0.6,2.1) rectangle (3.4,3.1);
  \node[align=center] at (1.4,2.6) {\textbf{stage1}\quad{\scriptsize L1}\\{\scriptsize\color{black!60} ota\_beh $\to$ XDP, XLD}};
  \draw[fill=black!4,rounded corners=2pt] (4.6,2.1) rectangle (8.6,3.1);
  \node[align=center] at (6.6,2.6) {\textbf{cs\_stage}$^{*}$\quad{\scriptsize L1}\\{\scriptsize\color{black!60} cs\_stage $\to$ M6 M7 M8, $I_{ref}$}};
  % leaves
  \draw[fill=black!4,rounded corners=2pt] (-2.6,0.1) rectangle (2.2,1.1);
  \node[align=center] at (-0.2,0.6) {\textbf{diffpair}$^{*}$\quad{\scriptsize L2}\\{\scriptsize\color{black!60} diffpair\_tail $\to$ M1 M2 M5 M6, $I_{ref}$}};
  \draw[fill=black!4,rounded corners=2pt] (2.6,0.1) rectangle (6.6,1.1);
  \node[align=center] at (4.6,0.6) {\textbf{mirror}$^{*}$\quad{\scriptsize L2}\\{\scriptsize\color{black!60} cmirror $\to$ M3 M4}};
  % edges
  \draw (4.0,4.1) -- (4.0,3.6) -- (1.4,3.6) -- (1.4,3.1);
  \draw (4.0,3.6) -- (6.6,3.6) -- (6.6,3.1);
  \draw (1.4,2.1) -- (1.4,1.6) -- (-0.2,1.6) -- (-0.2,1.1);
  \draw (1.4,1.6) -- (4.6,1.6) -- (4.6,1.1);
  % retirement order
  \node[draw,circle,fill=white,font=\scriptsize,inner sep=1.2pt] at (8.6,3.1) {1};
  \node[draw,circle,fill=white,font=\scriptsize,inner sep=1.2pt] at (6.6,1.1) {2};
  \node[draw,circle,fill=white,font=\scriptsize,inner sep=1.2pt] at (2.2,1.1) {3};
  \node[draw,circle,fill=white,font=\scriptsize,inner sep=1.2pt] at (3.4,3.1) {4};
  \node[draw,circle,fill=white,font=\scriptsize,inner sep=1.2pt] at (6.0,5.1) {5};
  % legend
  \node[font=\scriptsize,anchor=north west,align=left,text width=10.4cm] at (-2.6,-0.3)
    {$^{*}$ a fundamental circuit block: one known topology, one sizing procedure, a spec sheet measurable on its own pins. Circled numbers: the order in which each node's Verilog-A model was retired in the verified run, leaf first. A leaf retires when its transistors pass the leaf's own golden bench; a parent only after all its children, when the children's diagram matches the parent's own model on the parent's bench. The count of nodes still behavioral is the progress bar: 5, 4, 3, 2, 1, 0.};
\end{circuitikz}
\end{document}
```

A verified run on a two-stage Miller op-amp, ESPice through Schemify, the same bench throughout:

| Node and metrics | golden model | children, behavioral | all transistors |
|---|---|---|---|
| opamp2: A0, PM, UGF | 80.00 dB, 69.5°, 96.5 MHz | 79.54 dB, 62.4°, 97.3 MHz | 81.11 dB, 64.3°, 97.9 MHz |
| stage1 (5T OTA): A0, PM, UGF | 39.99 dB, 87.7°, 158.6 MHz | 39.82 dB, 87.7°, 159.1 MHz | 40.58 dB, 87.7°, 160.8 MHz |
| cs_stage: gain, UGF | 39.69 dB, 384 MHz | | 40.38 dB, 410 MHz |
| mirror: Iout, Vsg | 51.52 µA, 0.596 V | | 51.52 µA, 0.578 V |
| diffpair: gm, Itail | 1.000 mS, 108 µA | | 1.010 mS, 99.7 µA |

The seven-degree phase-margin gap between the golden model and its children at the top is the point of step 6. The golden model ignored the right-half-plane zero of the second stage; the children diagram did not. The gap was charged to the children's specs (second-stage transconductance and the compensation capacitor), not hidden in a looser bench. Yoshioka's study saw the same effect from the other side: the arm told to write Verilog-A models and block specs before any transistor reached schematic sign-off with 5.6 dB more SNDR and half the power of the arm given only the spec [2].

*Factor raised: spec to architecture. The sensitivity of the system to each block's spec is measured before anything is sized, and the hand-off from behavioral to transistor is checked at every node rather than once at the end.*

### Stage 2. Topology, per block

This is the stage where the agent is strongest, and the stage where it most needs a procedure, because a language model will happily produce a plausible topology with a plausible justification for anything. The procedure:

1. Classify the block into a family: amplifier core, switched-capacitor stage, SAR, delta-sigma, DAC, LDO, bandgap, PLL, comparator, TIA, filter. For a converter or a PLL, choose the architecture before any transistor topology. For ADCs that means the target point against the published frontier in Murmann's survey, after the hard limits: the kT energy floor, the jitter floor, the speed-resolution frontier [41].
2. Read in a fixed order: the textbook chapter for the family, then the tutorial columns and short courses, then JSSC and ISSCC for the lowest-voltage variants, then theses for the derivations and failed attempts that papers leave out, then an open-PDK implementation if one exists.
3. Build a comparison table with at least three candidates, every cell a number computed at the target supply and kit with the family's equations: gain in units of $g_m r_o$, speed limit, swing from the stack count, input common-mode range from the gate-voltage lookups (`gmid.vgs` on the kit's tables), noise contributors, power branches, area, stability burden, kit fit, maturity.
4. Score maturity. Canonical: in two textbooks with a design procedure, a tutorial, many silicon uses. Then established, recent, novel. Downgrade a candidate published at 1.5 times your supply, or with a free gate length when yours is fixed.
5. Decide. Discard what fails headroom or gain at the target kit. Discard what fails at the worst corner by hand calculation. Pick the highest maturity, break ties on power and then area, keep the runner-up as the fallback. If nothing passes, go back to stage 1 with the specific conflict. Never invent a topology silently.
6. Write a decision record with the table and the sources on the cell's documentation page, where the sizing math of the next stage will live.

The headroom check alone removes most candidates at low supply. At 0.8 V with saturation voltages around 0.15 V, a telescopic cascode has five devices in the output branch and about 0.05 V of swing left; a folded cascode has four and 0.2 V; a two-stage amplifier with a common-source output has two and 0.5 V. The gain check under a fixed-length kit is just as blunt. On ASAP7 a five-transistor OTA gives roughly 24 to 28 dB and a two-stage about 52 to 57 dB, so anything above 60 dB at 0.8 V means a cascoded first stage, gain boosting or three stages. That is a topology decision the agent must surface, not a sizing problem it can grind at.

*Factor raised: architecture to schematic, before any simulation. A topology that cannot meet the spec at this supply and this kit is rejected by arithmetic, with the rejection written down.*

### Stage 3. Sizing, burn-down, centering

An earlier note of mine claimed that any block spec can be turned into amplifier specs and then sized with gm/Id. That is true for most of the flow, with a handful of primitives that must be carried alongside the amplifier sheet because they are not amplifier specs:

| Primitive | Relation | What it sizes |
|---|---|---|
| speed, linear | $g_m \ge \omega_u C_\mathrm{eff}$ | $g_m$, so $I_D$ at a chosen gm/Id |
| accuracy, static | $A_0 \ge 1/(\beta\,\varepsilon)$ | $L$ from the $g_m r_o$ tables, and the topology |
| thermal noise | $4kT\gamma/g_m$ per Hz, or $kT/C$ when sampled | $g_m$, or $C$ |
| matching | $\sigma(\Delta V_T) = A_{VT}/\sqrt{WL}$ | area, not $g_m$ |
| large signal | $SR = I/C$; swing $= V_{DD} - \sum V_{Dsat}$ | current, stack count, overdrive |
| regeneration | $\tau = C/g_m$ | $g_m/C$, so $f_T$ |
| switches | $R_\mathrm{on} C$ | width, from the triode table, not gm/Id |
| timing | $\mathrm{SNR}_\mathrm{jitter} = 1/(\omega_\mathrm{in}\sigma_t)^2$ | the clock path, not the block |

The sizing loop per transistor role: decide what constrains it ($g_m$, $g_m r_o$, area, $V_{Dsat}$, $R_\mathrm{on}$, or a fixed current); get $g_m$ from the spec or $I_D$ from the bias; pick the smallest $L$ whose $g_m r_o$ meets the gain share and whose $f_T$ meets the speed share; pick gm/Id; width is $I_D$ divided by the current density the table gives; estimate $C_{gg}$ from $g_m$ and $f_T$ and feed it back; check matching area and headroom; iterate. Murmann's four steps, $g_m$, then $L$, then gm/Id, then $W$, are the same loop [16]. In the project the derivation lives as a live documentation page on the Schemify cell: prose for the reasoning, variables for the numbers, every width exactly one lookup call, `gmid.w(dev, gm_id, l, id)` into GmIDVisualizer's tables for the active kit, so that it exports as an intent, specs as bounds that turn red.

Then the burn-down: write the subcircuit as a netlist, render it as a schematic and symbol in Schemify, flip the block from behavioral to schematic in Schemify, run the golden testbench on ESPice, log the new count. Pass with margin, next block. Fail, back to sizing, then topology, never to the bench.

Gate G1 is the pre-layout matrix: every spec at every corner and in Monte Carlo with mismatch, stability measured on the closed loop at its real operating point (ESPice's `.lstb`, the double injection of [34]), start-up at slow and fast supply ramps, and a yield interval rather than a yield number. Gate G2 is centering. Here is what it looks like on the simplest circuit I own.

```tikz title="Figure 4. The five-transistor OTA used for the centering example: a PMOS mirror load, an NMOS input pair, and a mirrored tail current. Four sizing variables and four specs, checked at seven corners."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % PMOS mirror load, sources on the VDD rail
  \node[pmos, xscale=-1] (M3) at (2.0,5.0) {};
  \node[pmos]            (M4) at (6.0,5.0) {};
  % NMOS input pair
  \node[nmos]            (M1) at (2.0,2.6) {};
  \node[nmos, xscale=-1] (M2) at (6.0,2.6) {};
  % tail current mirror
  \node[nmos, xscale=-1] (MT0) at (-1.4,0.2) {};
  \node[nmos]            (MT)  at (4.0,0.2) {};
  % VDD rail
  \draw (-1.4,6.3) -- (7.0,6.3) node[anchor=west] {$V_{DD}$};
  \draw (M3.source) -- (2.0,6.3);
  \draw (M4.source) -- (6.0,6.3);
  \fill (2.0,6.3) circle (0.06);
  \fill (6.0,6.3) circle (0.06);
  % bias current into the diode-connected mirror input
  \draw (-1.4,6.3) to[american current source, l_=$I_B$] (-1.4,1.6) -- (MT0.drain);
  \fill (-1.4,6.3) circle (0.06);
  \draw (-1.4,1.6) -- (0.2,1.6) -- (0.2,0.2);
  \fill (-1.4,1.6) circle (0.06);
  \fill (0.2,0.2) circle (0.06);
  \draw (MT0.gate) -- (MT.gate);
  % diode-connected M3 and the mirror gate line
  \draw (M3.gate) -- (M4.gate);
  \draw (M3.drain) -- (M1.drain);
  \draw (3.4,5.0) -- (3.4,3.8) -- (2.0,3.8);
  \fill (3.4,5.0) circle (0.06);
  \fill (2.0,3.8) circle (0.06);
  % output node and load
  \draw (M4.drain) -- (M2.drain);
  \fill (6.0,3.8) circle (0.06);
  \draw (6.0,3.8) -- (9.0,3.8);
  \node[anchor=south] at (7.5,3.85) {$v_{out}$};
  \draw (9.0,3.8) to[C, l=$C_L$] (9.0,1.9) node[ground]{};
  % sources of the pair to the tail
  \draw (M1.source) -- (2.0,1.4) -- (6.0,1.4) -- (M2.source);
  \draw (4.0,1.4) -- (MT.drain);
  \fill (4.0,1.4) circle (0.06);
  % inputs
  \draw (M1.gate) -- (0.2,2.6) node[anchor=south west] {$v_{in+}$};
  \draw (M2.gate) -- (8.0,2.6) node[anchor=south east] {$v_{in-}$};
  % ground
  \draw (MT.source) -- (4.0,-0.6) -- (-1.4,-0.6) -- (MT0.source);
  \draw (1.3,-0.6) node[ground]{};
  % the sizing variables
  \node[font=\scriptsize,anchor=east] at (1.3,5.0) {$W_p/L$};
  \node[font=\scriptsize,anchor=west] at (6.7,5.0) {$W_p/L$};
  \node[font=\scriptsize,anchor=west] at (2.5,2.6) {$W_n/L$};
  \node[font=\scriptsize,anchor=east] at (5.5,2.6) {$W_n/L$};
  \node[font=\scriptsize,anchor=west] at (4.7,0.2) {$10\,\mu$m$/2\,\mu$m, fixed};
  \node[font=\scriptsize,anchor=east] at (-2.1,0.2) {$10\,\mu$m$/2\,\mu$m};
  \node[font=\scriptsize,anchor=north west,align=left,text width=10.4cm] at (-2.6,-1.3)
    {Four sizing variables: $W_n$, $W_p$, the shared $L$, and $I_B$. Specs on this bench: $A_0 \ge 100$~V/V, UGF $\ge 20$~MHz into 1~pF, PM $\ge 60^\circ$, offset at most 10~mV, at every corner, with mismatch as $3\sigma$ of input-pair threshold shift that scales with $1/\sqrt{WL}$.};
\end{circuitikz}
\end{document}
```

Four sizing variables: the pair width, the load width, a shared length and the bias current. Four specs: open-loop gain of at least 100 V/V, unity-gain frequency of at least 20 MHz into 1 pF, phase margin of at least 60 degrees, offset of at most 10 mV. Corners: typical; slow at 85 °C and 1.62 V with 50 % extra parasitics as a stand-in for layout; fast at −40 °C and 1.98 V; the two skews; and mismatch entering as three sigmas of input-pair threshold shift whose sigma follows the optimized $WL$ through Pelgrom's law [11]. The objective is the maximin slack above with $s_i = |b_i|$. The driver is about a hundred lines of Python around the ESPice command line: one deck per sizing point and corner, every deck in flight at once, and a compass search on the logarithm of the variables, because the objective is a minimum with kinks wherever the binding spec changes.

| Step | Result | Cost |
|---|---|---|
| center | $t = 0.406$: every spec 40.6 % inside its limit at every corner | 145 points × 5 corners = 725 runs in 0.46 s |
| binding at the center | PM at ss, offset at ff, offset at ss, PM at ff, all within 0.002 of each other | |
| margin against power | $I_B$ = 6.8, 7.9, 8.5, 9.0, 12.5 µA gives $t$ = −0.085, 0.072, 0.156, 0.216, 0.395 | |
| least power with $t \ge 0.2$ | $I_B$ = 9.04 µA, 33 µW; binding UGF at ss and offset at ff | 3,365 runs in 2.0 s |

Four specs binding at the same slack is what a centered design looks like: no single move raises all of them. The center does not sit at the power cap; above about 23 µA, more current lowers gm/Id and gain faster than it raises bandwidth. The maximin optimum is a set rather than a point, and the power slide (fix the current, re-center the rest, bisect for the least current that still clears the floor) is how you pick inside it. ESPice's in-deck optimizer, HSPICE's `OPTIMIZE` cards on Levenberg-Marquardt, with a bisection on the margin found the same center, $t = 0.406$, by a different route, which is the kind of agreement I want before trusting either.

The same loop on the sky130 kit, with the kit's own corner sections and its own mismatch drawn through sixteen seeds, centered the OTA to $t = 0.134$ in 2,730 runs and 31 seconds on 32 threads, with offset and bandwidth at the slow corner binding. Almost all of that time was the kit being re-parsed at every point, a gap ESPice has since partly closed: a step in width or length now picks its model bin without a re-parse. Sixteen seeds give a sigma with about 18 % relative error, so the final point gets a full Monte Carlo at each corner before it is believed, and again after extraction.

Two caveats keep this honest. A hundred thousand simulations covers five parameters at ten values each. A two-stage Miller OTA has eight to ten independent variables after matched devices are tied, so a grid over it is $10^8$ to $10^{10}$ points. Hand analysis and gm/Id are what tell you which five dimensions matter. Fast simulation changes which questions you ask the simulator and which you ask the pencil; it does not remove the pencil. And brute force cannot reach high sigma: a hundred thousand samples resolves a tail to about four sigma, and six-sigma sign-off needs worst-case-distance methods or scaled-sigma sampling, as the commercial tools do [7][14][42]. Nothing in my stack does either yet.

One rule for the agent falls out of this stage, and I state it as a ground rule: the numerical optimizer owns the response surface. A search over more than one continuous variable is a script with a stated objective and a logged result. Bayesian optimization, evolutionary search and reinforcement learning as in AutoCkt all live here [28]; a language model does not. A sequence of hand-adjusted guesses in a transcript is not a result, and a goal moved to make the slack positive is a lie.

A second rule decides what the objective is evaluated on. For an amplifier the benches run on the schematic, a parasitic-scale corner stands in for layout, and the extracted netlist is checked once, at stage 6. For a cell or an FPGA tile, whose area, delay and power only exist after layout, the objective is evaluated on the generated layout itself, and stages 3 to 6 of figure 2 are one loop. The fifth decision of the layout stage says how, and why the search still runs on a fitted model most of the time.

*Factor raised: architecture to schematic. The block meets its spec as a region, with its binding specs and its distance to the boundary written down, not as a point.*

### Stage 4. Layout

Layout is the biggest single time sink in an analog block. It is tied to one kit by construction, and a small schematic change ripples through matching, symmetry and routing. It is also where the agent-assisted designs in the studies above actually lost their performance. Five decisions:

**Generator first.** Every block is laid out with generator code (Rust, through Philis's macroMaster crate, which adds typed open kits and in-process signoff), not by free-form placement and routing. The lineage is BAG: a generator captures the procedure, so it can be re-run on another kit, where a GDS can only be redrawn [24][26]. Free-form automatic place-and-route (Philis proper, in the ALIGN and MAGICAL lineage [25]) is a later, optional pass on the same netlist, kept only if it signs off and beats the generator on area and on the symmetry of the extracted parasitics. What free-form solving is good for is discovering how to lay out a pattern. The plan is to freeze what it finds into recipes that the generator applies, so the output is code, not geometry. Recipes trade some optimality for predictability and portability. They do not guarantee the optimal layout. They guarantee a known-good one you can run again. Layout is also the one place I do not use a learned model at all. There is nowhere near enough analog layout data to train one, synthetic data repeats itself, and the constraints are already written down in Hastings, Pelgrom and the layout literature, so it is a constrained optimization problem with a theory behind it [43].

**Floorplan from a reference if one exists.** A prior design of the same block, in any process, with sizes as ratios, fixes the floorplan, block dimensions and unit sizes that a from-scratch layout over-margins by 1.6 to 2.8 times in area [2]. Past designs are assets. Keep them.

**Constraints as check scripts, not prose.** Before any geometry, the matching, bias, routing, substrate and reliability constraints come out of the theory: Pelgrom for how much area, common-centroid arrays and dummies for gradients, well-proximity and stress distances, shielding, star-connected sources on matched devices, electromigration from simulated currents. Each one is then written as a script that reads the extracted netlist GPurify writes: per-bit effective capacitor weight and coupling per unit, the P/N capacitance and resistance difference on every differential net, the reference-path resistance to the farthest driver. DRC and LVS cannot see any of these. A greedy router will give one side of a common-centroid pair 0.34 fF of coupling and the other side 0.88 fF while passing both; matched routing is the generator author's job, which is to say the agent's, under a script that checks it.

**Three checkpoints, in Yoshioka's words because they are good ones [2].** After the first layout: render it to an image at full scale with block outlines and look at it; find empty area, asymmetry in differential paths, and how the most sensitive nets are routed. After the first post-extraction run: explain the gap between schematic and post-layout with experiments that change one thing at a time, fix the largest contributors in layout, re-run. Before finishing: list everything that passes DRC and LVS but could still make the chip fail or miss spec, check each item, fix what you can. In that study the agents found, by their own one-change-at-a-time runs, that bottom-plate routes to sparse LSB capacitors carried 0.44 to 0.67 fF of coupling per unit against 0.36 fF for the MSB, enough to pull the DAC weights off binary even with a perfect common centroid; a small emulator fed with the extracted weights predicted 63.9 dB for the fix before the layout was regenerated, and extraction gave 63.6 dB. That is the shape of a good post-layout loop: a model of the cause that predicts the fix, then the fix.

**Layout inside the sizing loop, when the metric is a post-layout number.** The four decisions above keep sizing and layout as two stages with a return path between them. That is right for an amplifier: the sizing space is continuous, the specs are small-signal quantities the schematic predicts to within a parasitic-scale corner, and one layout is generated, extracted and checked. It is wrong for a cell or an FPGA tile, where the three numbers being optimized do not exist before layout. The area is the layout's area, and at advanced nodes the delay and power are set by the contact, M0 and diffusion parasitics that the schematic never sees [44]. Nobody sizes those on schematic numbers, and nobody runs a full layout, extraction and characterization inside a wide search either. The published answers sit at the two ends. Arm's ASAP7 library exhaustively enumerates the fin combinations a FinFET cell can have, lays out, extracts and simulates each, picks the most balanced rising and falling edges, and characterizes the result from the extracted netlist [45][46][44]. COFFE keeps layout out of the loop because "layout is a very time consuming task" and estimates instead: a transistor-area model refit against its own 65 nm layouts after the textbook one over-predicted area "by as much as 143 %", wire lengths derived from that area, and a sizing that converges in two to four passes as the loads it predicts settle [27]. COFFE 2 measured what the wire model is worth: without it, delay is under-predicted by 9 to 82 % depending on the circuit and the cost function, 78 % for the switch block [47]. Between the two ends, the cell-synthesis papers of the last two years put a learned parasitic model inside the loop and extract only the finalists: a capacitance surrogate at 1.24 % error trained on 22,075 generated ASAP7 layouts, with the top-K layouts sent through extraction and characterization [48]; a delay, transition and power surrogate at 0.92 % error over 19,500 cells [49]; and on the analog side ParaGraph, a graph network that cut the simulation error of designer-estimated parasitics from over 100 % to under 10 %, which the sizing paper that followed used because "parasitic prediction removes the need for in-the-loop layout generation" [50]. The analog sizers that do generate a layout per candidate report the price, 40 minutes against 16 for the same amplifier, and call automatic layout generation "the bottleneck of layout-aware methodologies" [51].

So for a cell or a tile, stages 3 to 6 of figure 2 are one evaluation, and the loop drawn there is designed in rather than a return. The generator is the objective function. For each candidate it produces a layout, runs DRC and LVS as feasibility (a candidate that fails is infeasible, not scored), extracts, and runs the same bench; the number the optimizer sees is the extracted one. Since that costs seconds to minutes per cell even with a fast generator [52], the search runs on a model fitted to the generator's own layouts, area and wire length as functions of the sizes in COFFE's manner, refit whenever the generator or the kit changes, and the candidates it ranks highest are re-run through the generator, extraction and the bench. The gate number is never the model's. The COFFE rewrite in section 7 is built this way: a macroMaster generator per tile circuit, the generator inside the ESPice loop, the fitted model only to decide which candidates earn a layout, and every reported number from an extracted netlist. For an analog block the same loop runs once: the extracted parasitics go back into the benches as fixed capacitors and resistors, and the block is re-centered. What the commercial tools sell as in-design extraction, parasitics pulled from a partially drawn layout while a human edits it [53], is this loop made incremental; in a generator flow it collapses into running extraction inside the generator.

Gate G5 is the golden testbench on GPurify's extracted netlist, back in the same Schemify bench, at every corner and in Monte Carlo. A fix for one defect is followed by every spec at every corner again, because fixes shift other parasitics: a shrunken unit capacitor that fixed slow-corner timing broke the DAC weights at typical in the same study. And a failure that layout cannot fix goes back to sizing with the extracted parasitics carried in as fixed capacitors and resistors, so that the pre-layout benches predict post-layout next time, rather than re-centering on post-layout numbers alone.

*Factor raised: schematic to layout. The layout is a program that a kit change re-runs, its hidden failure modes have scripts that look for them, and the post-layout gap is explained before it is patched.*

### Stage 5. Sign-off and handoff

| Gate | Green means | Run by |
|---|---|---|
| G0, spec and benches | every spec has a number, unit, condition and margin; the golden model meets it; one bench per analysis family with spec lines | Schemify benches, VerA models, ESPice |
| G1, pre-layout | all specs at every corner and in Monte Carlo with margin; every loop's phase and gain margin per corner; start-up verified; yield interval reported | ESPice through Schemify |
| G2, centering | the smallest normalized slack $t$ at or above the floor over specs and corners with $k\sigma$ mismatch; binding set logged; full Monte Carlo at the chosen point | a driver script around ESPice |
| G3, DRC | zero violations on the foundry deck with front-end, back-end, antenna and density rules on, or a written waiver per rule | GPurify in the loop; the kit's own KLayout or Magic deck signs off [54] |
| G4, LVS | match, zero property errors, device counts checked by hand for matched groups, dummies on both sides | GPurify in the loop; Netgen or the kit's KLayout LVS signs off [54] |
| G5, post-layout | the same benches on the extracted view at all corners and in Monte Carlo; the stability floor holds; the pre/post table is saved | GPurify's extraction in the same ESPice benches |
| G6, reliability | electromigration per wire and via from simulated currents at the hot corner; IR drop on bias and source lines within the offset budget; every bias check clean in start-up and worst transients; aging shown or approximated | ESPice for currents, `.biaschk` and MOSRA aging; GPurify for current density, IR drop and ESD paths; the two not yet joined |
| G7, handoff | export with intents, report reviewed, a list of what the target environment must recreate; re-center on the target kit | Schemify-Interop, Schemify-PDK-Manager |

Never mark a gate green on nominal-only results, on a capacitance-only extraction for a high-frequency block, on a tool's internal DRC or LVS when a foundry deck exists, on fewer Monte Carlo samples than the yield target needs, or on a number only the design run itself reported.

Two cells in the last column are weaker than the rest. G2 runs on a script per block, not on a tool. G6 has both halves and no joint: ESPice simulates the currents and GPurify checks wires and vias against current budgets, but nothing yet carries the simulated current of each branch to the wire and via that carry it, so that step is still done by hand.

*Factor raised: extracted netlist to silicon, as far as a flow can. What reaches the foundry has survived the same bench at every level, and what it still cannot know is listed rather than assumed.*

## 4. Where the agent sits, and where it must not

Language models speak relational knowledge, not geometry. They are good at netlists and bad at schematics. So the agent writes netlists, Verilog-A models, testbenches, generator code and check scripts, and I read the result as a schematic Schemify drew and a live documentation page in Schemify. That one inversion, text in and picture out, is most of what made the collaboration work. The rest is a delegation map. The fits in the first eight rows are Yoshioka's, confirmed by my own runs; the last three are mine [2].

| Task | Fit | What the flow does about it |
|---|---|---|
| porting a block with a reference design | very good | keep every past design; hand the agent ratios and floorplan images |
| schematic design to a spec | good | the stage 2 procedure, decision records, and a golden bench that decides |
| block layout, DRC and LVS clean | good | generators, plus check scripts for what DRC and LVS cannot see |
| floorplan and area from scratch | fair | reference design first; area targets from the schematic |
| post-layout diagnosis | fair, slow | one change at a time, and a small model that predicts the fix before regenerating |
| debugging from symptoms | poor | one hypothesis, one targeted run, log it, next hypothesis; never stack fixes |
| self-verification | poor | an independent script recomputes the deciding number from raw data |
| knowing when to stop | poor | every stage has a written "done when"; optimizing past spec plus margin is wasted time |
| literature research and decision records | very good | required at every stage, every claim with its source, unverifiable claims marked |
| a search over a many-dimensional response surface | poor | the numerical optimizer owns it; the agent writes the objective |
| spec, acceptance criteria, deadlines, waivers | not delegated | the human owns them |

The false passes deserve their own table, because they are the ways an agent-run flow fails without anyone noticing. Each one has an independent check that catches it, and the flow requires the check, not the agent's word.

| False pass | Caught by |
|---|---|
| a post-extraction number too good, because the extractor lumped coupling into capacitance to ground | compare against a capacitance-only extraction; count the coupling cards |
| a block that passes LVS with unconnected nets | an open-net report, and a functional simulation of the extracted block |
| a GDS exported without port labels | re-read the GDS, list its labels, run LVS from that file |
| reported numbers that differ from re-measured ones | recompute from the raw waveform with a separate, fixed script |
| performance met by post-processing fitted to the result | evaluate with the output path the chip has; calibration counts only if it runs on chip and blind |
| a bench or a frozen input edited to pass | diff the benches against the stage 1 copy |

Two habits matter more than they look. Every tool interaction is logged, append-only, with the stage, the block, the command, the outcome, the burn-down count and the next step, in one `LOG.md` per tool under the project, so a session that resumes reads the log before touching a block. And the human sets the spec, the acceptance criteria and the deadlines, and signs the waivers. In Yoshioka's setup a supervising agent re-verified everything from raw data and gave no design advice, and a stronger helper was called only when a design agent was stuck, logged as an intervention [2]. That division is the right one.

## 5. The tools, and their honest status

As an open-source project I do not have Cadence or Synopsys, so most of this had to exist before the flow could. All code is at github.com/OmarSiwy and github.com/UW-ASIC, except Analog-Skills, which is still private. Where a number below is measured it says where. Otherwise it is a target.

| Tool | What it is | Status |
|---|---|---|
| **Schemify** | the spine: cells with several implementations (behavioral, schematic, extracted), benches with corners, sweeps, Monte Carlo and specs, a live documentation page where the sizing math runs, technology-neutral device classes, a headless command line the agent drives, and plugins for kits, gm/Id tables, interchange and netlist-to-schematic (the next three rows) | 1.0.0; used for everything above; the native ESPice path landed this month [39] |
| **Schemify-PDK-Manager** | a Schemify plugin that installs a kit per project and pins its version: sky130, gf180mcu and IHP SG13G2 through ciel, FreePDK45 and ASAP7 from pinned sources, any other kit from a local path; designs drawn with technology-neutral devices retarget through mapping files | supports those five kits; proprietary kits over ssh are planned, not built [39] |
| **GmIDVisualizer** | a Schemify plugin that characterizes a kit's devices with ESPice or ngspice into lookup tables and hands them to documentation pages as `gmid.*` functions: width, gate voltage, current density, gain and $f_T$ at a gm/Id, a length and any $V_{DS}$ | every width on a sizing page is one of its calls; the standalone build also plots the tables [39] |
| **Schemify-Interop** | import and export between Schemify, xschem and Virtuoso, the last through a SKILL exchange file, with gm/Id intents solved on the target kit | a Virtuoso round trip is byte-identical; Monte Carlo and optimizer setups do not cross [39] |
| **ESPice** | a SPICE in Zig with VerA built in: every device model is Verilog-A compiled at build time, and one line loads a kit's model source at run time; reads ngspice and HSPICE decks and SPICE cards under Spectre's lexical rules; native loop-gain, transfer-function, mismatch and Monte Carlo analyses, and periodic steady-state, harmonic-balance, phase-noise and MOSRA aging analyses that this flow has not exercised yet | 1.2.0. Median 3.3 times faster than ngspice over 473 decks (faster on 466, agreeing on 424, differing on 13) and 3.5 times faster than VACASK over 270 (agreeing on 234, differing on 17), process start-up included, CPU, one machine [36]. A 13-device deck runs in 4.2 ms; 32 threads give 0.6 ms of wall time per corner run. Sweep points run as GPU lanes on request, on Gompute kernels, and the automatic backend picks the GPU only on FP64-class cards; the hundred-thousand-point throughput I want is a target I have not measured |
| **VerA** | a Verilog-AMS and IEEE 1364 compiler: exact Jacobians, evaluation generic over the scalar type (f64, f32, SIMD lanes), targets for the CPU, a shared library, OSDI 0.4 for ngspice, NVPTX and AMDGCN; testbenches written as comments in the model; a live conformance report | OpenVAF-Reloaded compiles Verilog-A to OSDI for ngspice and VACASK, and if that is all you need, use it [37]. VerA exists because I needed the digital side for mixed behavioral models, a compiler the agent can be pointed at whose every diagnostic names the clause of the standard, and one device kernel that builds for CPU lanes and GPU lanes. The first compile of BSIM-CMG is about four minutes and 2.8 GB, then cached in milliseconds. Its own plan says full conformance is not implemented, and lists the open items |
| **Gompute** | a Zig library that defines a kernel once and specializes it at compile time for CPU threads, CUDA or HIP; the CPU path is checked against the hand-written loop's assembly on every build | what ESPice's GPU lanes are built on [36] |
| **Philis, macroMaster, GPurify** | layout from a netlist: 91 recognized topologies feed constraints at three tiers, then device generators, analytic and annealed placement, negotiated routing, and signoff by GPurify (DRC, LVS, ERC and extraction with per-rule coverage accounting; its ERC also carries current-density, IR-drop and ESD-path rules that read a design-intent file); macroMaster is the generator route, with typed sky130, gf180mcu, IHP SG13G2 and ASAP7 kits | pre-1.0. On sky130 a pair, an RC filter, a bandgap core and an OTA sign off clean, the OTA in 344 s; a 4-bit DAC and a transmission-gate chain do not; about seventy open issues. GPurify agrees with KLayout on 43 of 43 DRC cases and with physics-derived answers on 167 layouts, and its own README says not to tape out on its verdict alone. Foundry decks remain the sign-off [40] |
| **Analog-Skills** | the flow above, written for an agent: stages with "done when" criteria, one reference file per tool with a troubleshooting table, a skill per Schemify plugin, the research notes on centering and portability, the theory notes they cite, and one Nix shell holding the tools the skills drive [38] | in use, still private; the measured numbers in this post come from its verification runs |

Each of these has a commercial counterpart that is more mature: Virtuoso with the Variation Option, WiCkeD, Solido, PrimeSim and PrimeWave, BAG and its descendants [6][7][9][10][24]. The claim is not that mine are better. It is that the whole loop is open, cheap enough to run on every block, and built to be driven by an agent: text in, text out, every result on a node or a measurement line, every gap logged instead of worked around. One term I used to borrow: in industry "FastSPICE" means engines that trade accuracy for capacity on huge designs. ESPice is a plain SPICE that is fast. I have stopped borrowing the term.

The gaps the centering runs found are the kind of thing the flow is meant to surface rather than hide. Eight copies of a subcircuit crashed the operating point, so the in-deck method capped at seven corners. Swept widths on a binned kit forced a full re-parse per point. The linearized mismatch analysis could not read sigmas from the kit's model cards. Each went into the issue tracker with a reproduction, and two have since been closed in part. That is what "log the gap, never work around it" buys: an agent that works around a tool limitation produces a design nobody can reproduce, and a tool that never gets fixed.

A fully open flow needs more than my tools being open. Part of what it needs is borrowed. By the rule in stage 5, DRC and LVS sign off on the kit's own decks, not on mine, and for sky130, gf180mcu and IHP SG13G2 those decks are open and run in KLayout, Magic and Netgen [54]. The generators follow the BAG lineage [24][26], digital blocks and chip assembly go through OpenROAD and LibreLane [55], and silicon from an open kit comes through a shuttle such as Tiny Tapeout or wafer.space [35][56]. FreePDK45 and ASAP7, the kits behind the portability numbers in section 2.2, cannot make that trip: both are predictive, and neither has an open LVS deck.

The rest is missing. Centering is a hundred-line script per block; an open counterpart of WiCkeD, with worst-case distances from ESPice's sensitivities, a yield bound in place of a point estimate and high-sigma sampling for replicated cells, is the largest piece nobody has written. G6 needs the joint described in stage 5, from ESPice's branch currents to GPurify's wires and vias. A PLL or SerDes block needs field-solved passives and a link-level eye; openEMS, Palace and PyBERT do those in the open [57][58], but nothing joins them to this flow yet. Supply and substrate coupling at integration has no open tool that I know of.

## 6. What none of this fixes

Centering lowers the probability of a parametric failure and shortens the loop. It does not replace silicon test, and an earlier version of this argument flirted with the idea that a well-centered design with 20 % margin could skip some. It cannot, for reasons that each live outside the margin analysis:

- **Models are wrong by unknown amounts.** Synopsys reports a 7 nm ring-oscillator study in which some dies at 0.675 V ran slower than the slow-slow corner while the fast-fast corner was pessimistic, and correlating the models to silicon bought a 3.5 % margin reduction [2
- 9]. A margin is only as real as the model behind it.
- **Centering sets the mean, not the spread.** With a 10 GHz minimum and a 12 GHz mean, a 1 GHz sigma fails about 2.3 % of parts and a 0.5 GHz sigma fails about 32 ppm. Same "20 % margin", three orders of magnitude apart.
- **Corners are not worst cases for every metric** [13], and a steady-state margin says nothing about start-up, mode transitions or recovery from overload.
- **Defects and aging are not parameter variation.** An open via is not a sigma. Reliability guidance separates early-life test escapes from bias-temperature and hot-carrier wear-out, which need aging models and a mission profile, and qualification flows separate characterization, accelerated stress and production screening [30][31].
- **Interfaces fail in dimensions margin does not see:** PAM4 level mismatch, jitter spectral content, burst errors through a decision-feedback equalizer and forward error correction, protocol state. The PCIe 6.0 validation literature is a catalogue of them [32].
- **Testing is finite too.** Zero errors in $N$ bits bounds the error ratio at about $3/N$ with 95 % confidence, so demonstrating $10^{-12}$ takes about $3 \times 10^{12}$ bits [33].
- **Integration is where chips actually die,** and nothing above addresses it beyond co-simulating behavioral models with transistor blocks. Supply and ground coupling, substrate noise, bias distribution, loading by a neighbour, common-mode mismatches at interfaces, clock jitter leaking into a data path, thermal gradients, ESD and start-up order all appear at integration and nowhere before. If you came here for a fix to that, this is not it.

So the claim is narrower and stronger than my first draft. An executable, gated flow with real centering raises the schematic-level and layout-level factors of the product, and it does so with an agent doing the typing. The tests that remain are the ones that answer a question the margin analysis did not.

## 7. Where I am applying it first

1. **FPGA tiles.** Small circuits, big sweep spaces, and a published baseline: COFFE sizes a full tile with HSPICE in hours, and a 2025 paper adds Bayesian optimization on top of COFFE 2 [27]. My open rewrite sizes every tile circuit with ESPice and the layout generator in one loop, as the layout stage describes: a model fitted to the generator's own layouts carries the search, every candidate it ranks highest is laid out, extracted and signed off, every number it reports is an extracted one, and every new topology is an A/B against COFFE's circuit for the same role, never a standalone number. If generators plus layout in the loop cannot beat the baseline, the idea is wrong and I will find out cheaply.
2. **Analog compute cells.** Same shape of problem, and the thing I eventually want to build: a charge-domain in-memory tile where the weights are capacitances, a multiply is $Q = CV$, and an accumulate is a column summing charge. The stage 1 method has already paid for itself there. The behavioral trade-off table for that tile has fifteen analog candidates against two systolic baselines. Two of the fastest-looking ones, a StrongARM-based column converter on pooled tiles, are marked infeasible because the level buffers do not settle and the comparator noise misses the gate by 7.9 dB, and one of them would draw about 140 W per die in buffers alone. Those numbers came out of the golden bench before any of it was sized, which is where you want to learn them.
3. **Later, if those work.** A PAM4 transceiver as the credible demonstration. Its spec sheet exists, 28 Gb/s per binary path with a three-tap feed-forward equalizer, a one-tap decision-feedback equalizer and a 14 GHz clock, and the method has already flagged what a bench cannot yet decide: the pre-driver has no spec, and the split of the 16 mA output current across the equalizer taps is a suggestion, not a decision. A spec without a condition goes back to stage 1. After that, transistor-level optimization of a fixed, replicated digital datapath such as the matrix-multiply array in a transformer accelerator. Full-custom datapaths are an old idea that standard cells beat on productivity. The bet is that generators change that trade for a core replicated thousands of times.

## Sources

1. Siemens EDA / Wilson Research Group, 2022 Functional Verification Study, part 12: https://blogs.sw.siemens.com/verificationhorizons/2023/01/09/part-12-the-2022-wilson-research-group-functional-verification-study/
2. K. Yoshioka, "The Era of Vibe Tapeout: Dark Age or Golden Age for Analog Circuit Design?", arXiv:2610.15240, 2026: https://arxiv.org/abs/2610.15240
3. "Long-Horizon Analog Design Bench: Benchmarking Agents on Hours-Long Analog and Mixed-Signal Circuit Design Tasks", arXiv:2609.33356, 2026: https://arxiv.org/abs/2609.33356
4. K. Antreich, H. Graeb, C. Wieser, "Circuit analysis and optimization driven by worst-case distances", IEEE TCAD 13(1), 1994, doi:10.1109/43.273749
5. H. Graeb, *Analog Design Centering and Sizing*, Springer, 2007, doi:10.1007/978-1-4020-6004-5
6. K. Antreich et al., "WiCkeD: analog circuit synthesis incorporating mismatch", CICC 2000, doi:10.1109/CICC.2000.852720; MunEDA history: https://semiwiki.com/eda/muneda/3457-a-brief-history-of-muneda/
7. Cadence, Virtuoso Variation Option datasheet: https://www.cadence.com/en_US/home/resources/datasheets/virtuoso-variation-option-ds.html
8. Keysight, ADS "Tuning, Optimization, and Statistical Design": https://edadownload.software.keysight.com/eedl/ads/2011_01/pdf/optstat.pdf
9. Siemens, Solido Design Environment fact sheet: https://www.europractice.stfc.ac.uk/media/pdf/siemens/Siemens-SW-Solido-Design-Environment-FS.pdf
10. Synopsys PrimeSim SPICE: https://www.synopsys.com/implementation-and-signoff/ams-simulation/primesim-spice.html; PrimeWave: https://www.synopsys.com/implementation-and-signoff/ams-simulation/primewave.html
11. M. Pelgrom, A. Duinmaijer, A. Welbers, "Matching properties of MOS transistors", IEEE JSSC 24(5), 1989, doi:10.1109/JSSC.1989.572629
12. P. Kinget, "Device mismatch and tradeoffs in the design of analog circuits", IEEE JSSC 40(6), 2005, doi:10.1109/JSSC.2005.848021
13. C. McAndrew, I.-S. Lim, B. Braswell, D. Garrity, "Corner models: Inaccurate at best, and it only gets worst...", CICC 2013, doi:10.1109/CICC.2013.6658428
14. S. Sun, X. Li, H. Liu, K. Luo, B. Gu, "Fast statistical analysis of rare circuit failure events via scaled-sigma sampling", IEEE TCAD 34(7), 2015, doi:10.1109/TCAD.2015.2404895
15. P. Jespers, B. Murmann, *Systematic Design of Analog CMOS Circuits: Using Pre-Computed Lookup Tables*, Cambridge University Press, 2017, doi:10.1017/9781108125840
16. B. Murmann, "Systematic Design of Analog Circuits Using Pre-Computed Lookup Tables", IEEE Toronto SSCS, 2016: https://www.ieeetoronto.ca/wp-content/uploads/2020/06/20160226toronto_sscs.pdf; "Gm/ID-Based Analog Circuit Sizing Using Ngspice and Python", MOS-AK 2024: https://www.mos-ak.org/silicon_valley_2024/Presentations/T8_Murmann_MOS-AK_2024.pdf
17. F. Silveira, D. Flandre, P. Jespers, "A gm/ID based methodology for the design of CMOS analog circuits", IEEE JSSC 31(9), 1996, doi:10.1109/4.535416
18. C. Galup-Montoro, M. Schneider, R. Coitinho, "Resizing rules for MOS analog-design reuse", IEEE Design & Test 19(2), 2002, doi:10.1109/54.990442
19. A.-J. Annema, B. Nauta, R. van Langevelde, H. Tuinhout, "Analog circuits in ultra-deep-submicron CMOS", IEEE JSSC 40(1), 2005, doi:10.1109/JSSC.2004.837247
20. P. Drennan, M. Kniffin, D. Locascio, "Implications of proximity effects for analog design", CICC 2006, doi:10.1109/CICC.2006.320869
21. K. Kundert, *Principles of Top-Down Mixed-Signal Design*, The Designer's Guide Community: https://designers-guide.org/design/tdd-principles.pdf
22. G. Gielen, R. Rutenbar, "Computer-aided design of analog and mixed-signal integrated circuits", Proc. IEEE 88(12), 2000, doi:10.1109/5.899053
23. Cadence, *Creating Analog Behavioral Models*, Verilog-AMS application note, 2003
24. J. Crossley et al., "BAG: A designer-oriented integrated framework for the development of AMS circuit generators", ICCAD 2013, doi:10.1109/ICCAD.2013.6691100; E. Chang et al., "BAG2: A process-portable framework for generator-based AMS circuit design", CICC 2018, doi:10.1109/CICC.2018.8357061
25. K. Kunal et al., "ALIGN: Open-source analog layout automation from the ground up", DAC 2019, doi:10.1145/3316781.3323471; B. Xu et al., "MAGICAL: Toward fully automated analog IC layout leveraging human and machine intelligence", ICCAD 2019
26. E. Chang et al., "BAG2: A process-portable framework for generator-based AMS circuit design", CICC 2018, doi:10.1109/CICC.2018.8357061
27. C. Chiasson, V. Betz, "COFFE: Fully-automated transistor sizing for FPGAs", FPT 2013: https://www.eecg.utoronto.ca/~vaughn/papers/fpt2013_coffe.pdf; Cao et al., "Two-Phase Transistor Sizing for FPGAs via Bayesian Optimization", FPGA 2025, doi:10.1145/3706628.3708825
28. K. Settaluri et al., "AutoCkt: Deep reinforcement learning of analog circuit designs", DATE 2020: https://arxiv.org/abs/2001.01808
29. Synopsys, Model to Hardware Correlation, SLM use-case datasheet: https://www.synopsys.com/content/dam/synopsys/solutions/slm/datasheets/slm-mhc-use-case-ds.pdf
30. Texas Instruments, Reliability: https://www.ti.com/quality-reliability/reliability.html; ADC12QJ1600-SHP Production Flow and Reliability Report (SLVK151): https://www.ti.com/lit/pdf/SLVK151
31. Cadence, Analog Reliability Analysis for Mission-Critical Applications: https://www.cadence.com/en_US/home/resources/white-papers/analog-reliability-analysis-for-mission-critical-applications-wp.html
32. Tektronix and Synopsys, PCIe 6.0 PHY validation: https://www.tek.com/en/documents/whitepaper/pcie-6-phy-validation; Cadence, PCIe 6.0 Electrical Testing: https://www.chipestimate.com/PCIe-60-Electrical-Testing-for-High-Data-Bandwidth-Applications/Cadence/Technical-Article/2023/02/14
33. Keysight, "BER: bit error rate or bit error ratio": https://www.keysight.com/blogs/en/tech/2019/03/10/ber-is-it-bit-error-rate-or-bit-error-ratio
34. M. Tian, V. Visvanathan, J. Hantgan, K. Kundert, "Striving for small-signal stability", IEEE Circuits and Devices Magazine, 2001: https://kenkundert.com/docs/cd2001-01.pdf
35. Tiny Tapeout: https://tinytapeout.com/
36. ESPice: https://github.com/OmarSiwy/ESPice (the benchmark table in its README, regenerated on each release); Gompute: https://github.com/OmarSiwy/Gompute
37. OpenVAF-Reloaded: https://github.com/OpenVAF/OpenVAF-Reloaded
38. VerA: https://github.com/OmarSiwy/VerA; Analog-Skills: https://github.com/OmarSiwy/Analog-Skills (private for now)
39. Schemify: https://github.com/OmarSiwy/Schemify; Schemify-PDK-Manager: https://github.com/OmarSiwy/Schemify-PDK-Manager; GmIDVisualizer: https://github.com/OmarSiwy/GmIDVisualizer; Schemify-Interop: https://github.com/OmarSiwy/Schemify-Interop
40. Philis: https://github.com/UW-ASIC/Philis; GPurify: https://github.com/UW-ASIC/GPurify
41. B. Murmann, ADC Performance Survey 1997-2026: https://github.com/bmurmann/ADC-survey
42. T. McConaghy, K. Breen, J. Dyck, A. Gupta, *Variation-Aware Design of Custom Integrated Circuits: A Hands-on Field Guide*, Springer, 2013, doi:10.1007/978-1-4614-2269-3
43. A. Hastings, *The Art of Analog Layout*, 2nd ed., Pearson, 2005
44. J.-S. Yoon et al., "Performance, Power, and Area of Standard Cells in Sub 3 nm Node Using Buried Power Rail", IEEE TED 69(3), 2022 (the LVS, extraction, Liberate chain, and "the parasitic RCs at MOL level increase greatly as technology node advances"): https://gtcad.gatech.edu/www/papers/ted22-a.pdf; EDN, "Parasitic extraction must solve advanced-node issues", 2018: https://www.edn.com/parasitic-extraction-must-solve-advanced-node-issues/
45. X. Xu, N. Shah, A. Evans, S. Sinha, B. Cline, G. Yeric (Arm), "Standard Cell Library Design and Optimization Methodology for ASAP7 PDK", ICCAD 2017: https://arxiv.org/abs/1807.11396
46. V. Vashishtha, M. Vangala, L. T. Clark, "ASAP7 predictive design kit development and cell design technology co-optimization", ICCAD 2017, doi:10.1109/ICCAD.2017.8203889; L. T. Clark et al., "ASAP7: A 7-nm finFET predictive process design kit", Microelectronics Journal 53, 2016, doi:10.1016/j.mejo.2016.04.006
47. S. Yazdanshenas, V. Betz, "COFFE 2: Automatic Modelling and Optimization of Complex and Heterogeneous FPGA Architectures", ACM TRETS 12(1), 2019, doi:10.1145/3301298; the wire-load numbers are from S. Yazdanshenas, *Datacenter-optimized FPGAs*, PhD thesis, University of Toronto, 2019, ch. 9: https://utoronto.scholaris.ca/bitstream/1807/97003/3/Yazdanshenas_Sadegh_201906_PhD_thesis.pdf
48. K. Guo, J. Huang, W. Yu, Y. Lin, "CAPCell: Standard Cell Layout Synthesis with Parasitic Capacitance Aware Parallel Sampling", ISEDA 2026: https://yibolin.com/publications/papers/CELL_ISEDA2026_Guo.pdf
49. H. Zhang, K. Guo, B. Zhang, Y. Lin, R. Wang, "FusionCell: Cross-Attentive Fusion of Layout Geometry and Netlist Topology for Standard-Cell Performance Prediction", arXiv:2605.20287, 2026: https://arxiv.org/abs/2605.20287
50. H. Ren, G. F. Kokai, W. J. Turner, T. Ku, "ParaGraph: Layout Parasitics and Device Parameter Prediction using Graph Neural Networks", DAC 2020, doi:10.1109/DAC18072.2020.9218515; M. Liu, W. J. Turner, G. F. Kokai, B. Khailany, D. Z. Pan, H. Ren, "Parasitic-Aware Analog Circuit Sizing with Graph Neural Networks and Bayesian Optimization", DATE 2021, doi:10.23919/DATE51398.2021.9474253
51. N. Lourenço, R. Martins, N. Horta, "Layout-Aware Sizing of Analog ICs using Floorplan & Routing Estimates for Parasitic Extraction", DATE 2015: https://past.date-conference.com/proceedings-archive/2015/pdf/0411.pdf
52. H. Ren, M. Fojtik, "NVCell: Standard Cell Layout in Advanced Technology Nodes with Reinforcement Learning", DAC 2021, doi:10.1109/DAC18074.2021.9586188; C.-T. Ho et al., "NVCell 2: Routability-Driven Standard Cell Layout in Advanced Nodes with Lattice Graph Routability Model", ISPD 2023: https://mik226.github.io/HoHFK23.pdf
53. Synopsys, Custom Compiler datasheet (Extraction Fusion: parasitics "extracted from a partially completed layout"): https://www.synopsys.com/content/dam/synopsys/implementation&signoff/datasheets/custom-compiler-ds.pdf; Cadence, Electrically Aware Design, as described in eeNews Europe: https://www.eenewseurope.com/en/electrically-aware-design-can-speed-ic-design-flow/
54. KLayout: https://www.klayout.de; Magic: http://opencircuitdesign.com/magic/; Netgen: http://opencircuitdesign.com/netgen/
55. OpenROAD: https://github.com/The-OpenROAD-Project/OpenROAD; LibreLane, the successor to OpenLane 2: https://github.com/librelane/librelane
56. wafer.space, GF180MCU shuttle runs: https://wafer.space
57. openEMS: https://www.openems.de; Palace: https://github.com/awslabs/palace; their IHP SG13G2 flows: https://github.com/VolkerMuehlhaus/openems_ihp_sg13g2, https://github.com/VolkerMuehlhaus/gds2palace_ihp_sg13g2
58. PyBERT: https://github.com/capn-freako/PyBERT
