---
title: The System Designer Approach to Analog
description: How to take an analog design from spec to signed-off layout with P(success) as close to 1 as possible before fabrication, sizing with gm/ID and ID/W tables, centering before minimizing, and letting LLMs type but never grade.
publishedAt: 2026-11-07
updatedAt: 2026-11-07
slug: system-designer-approach-analog
tags:
  - analog
  - tooling
  - llm
draft: true
---

As analog design becomes more and more accessible to the public, a wave of people wanting to work on their own projects has started. However, the typical design flow of analog projects is not widely discussed, especially with the involvement of LLMs. Below, we discuss how to approach any analog design project to ensure P(success) is as close to 1 as possible before fabrication.

The short version: a design dies at its hand-offs, so P(success) is roughly the product of the probabilities that each hand-off preserves the spec. Make every hand-off an executable check with margin, size from simulated device tables, center over corners and mismatch, then shrink to the minimum cost. Let the LLM type; never let it grade.

## P(success) is a product

```tikz title="Figure 1. P(success) as a product of six hand-offs. Each factor is below one for a reason you can name, and a stage of the flow exists to raise it."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % seven states of a design and the six hand-offs between them
  \foreach \i/\t in {0/spec,1/architecture,2/schematic,3/layout,4/system,5/silicon,6/{shipped part}} {
    \draw[fill=black!4] ({2.45*\i-0.95},-0.4) rectangle ({2.45*\i+0.95},0.4);
    \node[font=\footnotesize] at ({2.45*\i},0) {\t};
  }
  \foreach \i/\r/\s in {
    1/{specs fixed before the system's sensitivity is known}/{stage 1},
    2/{a spec that is just met sits at 50\,\% yield}/{stages 2 to 4},
    3/{parasitics, layout effects, coupling}/{stages 5 and 6},
    4/{coupling, bias, start-up order, control logic}/{equivalence checks, functional gate},
    5/{models wrong by an unknown amount}/{model margin, trim},
    6/{finite test time; interfaces margin cannot see}/{observability, test}} {
    \draw[->,thick] ({2.45*\i-1.5},0) -- ({2.45*\i-0.95},0);
    \node[font=\footnotesize,anchor=south] at ({2.45*\i-1.225},0.45) {$p_\i$};
    \node[font=\scriptsize\hyphenpenalty10000\relax,align=center,text width=2.3cm,anchor=north] at ({2.45*\i-1.225},-0.6) {\r};
    \node[font=\scriptsize\bfseries\hyphenpenalty10000\relax,align=center,text width=2.3cm,anchor=north] at ({2.45*\i-1.225},-2.0) {\s};
  }
  \node[font=\scriptsize\color{black!60},anchor=east] at (-1.1,-0.95) {why $p_i < 1$};
  \node[font=\scriptsize\color{black!60},anchor=east] at (-1.1,-2.2) {raised by};
  \draw[black!30] (-2.6,-1.85) -- (15.7,-1.85);
  \node[anchor=north] at (7.35,-2.95) {$P(\text{success}) \;\approx\; p_1\, p_2\, p_3\, p_4\, p_5\, p_6$};
\end{circuitikz}
\end{document}
```

*Figure 1. P(success) as a product of six hand-offs, why each factor falls below one, and the stage of the flow that raises it.*

First-silicon success fell from about 32% of ASIC projects in 2020 [1] to 24% in 2022 [2] and 14% in 2024, the lowest in more than twenty years of the survey [3]. Logic and functional flaws lead; flaws in tuning analog circuits rose to 41% of respins in 2020, at almost every node including 150 nm and larger [1]; and a reading of the 2024 survey puts 70% of respins down to design errors from spec changes [4]. LLMs move only $p_2$. In Yoshioka's vibe-tapeout study, every agent arm met SNDR at schematic level on sky130, then lost 8 to 13 dB at its first post-extraction simulation [5].

## Ground rules

```tikz title="Figure 2. One golden bench judges every view of the design, from the behavioral model to the extracted layout. An independent script recomputes the deciding number, and a failure goes back to the stage that owns the spec, never to the bench."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % four views of the same design, all judged by one bench
  \foreach \i/\t/\s in {0/{golden model}/{one Verilog-A block},
                        1/{block diagram}/{children as models},
                        2/{transistor blocks}/{models burned down},
                        3/{extracted layout}/{with R, C and coupling}} {
    \draw[fill=black!4] (0,{3.3-1.1*\i-0.42}) rectangle (4.0,{3.3-1.1*\i+0.42});
    \node[align=center] at (2.0,{3.3-1.1*\i}) {\textbf{\t}\\{\scriptsize\color{black!60}\s}};
    \draw[->] (4.0,{3.3-1.1*\i}) -- (5.0,{3.3-1.1*\i});
  }
  \draw[thick,fill=black!10] (5.0,-0.42) rectangle (7.9,3.72);
  \node[align=center,text width=2.6cm,font=\small\hyphenpenalty10000\relax] at (6.45,1.65)
    {\textbf{golden bench}\\[4pt]{\scriptsize written once, at stage 1\\[3pt] every limit a parameter named after its spec\\[3pt] never edited to make a block pass}};
  % the verdict comes from an independent recomputation
  \draw[->] (7.9,1.65) -- (9.3,1.65) node[midway,anchor=south,font=\scriptsize] {raw data};
  \draw[fill=black!4] (9.3,1.0) rectangle (12.5,2.3);
  \node[align=center] at (10.9,1.65) {\textbf{independent check}\\{\scriptsize recomputes the}\\[-2pt]{\scriptsize deciding number}};
  \draw[->] (12.5,1.65) -- (13.2,1.65);
  \draw[fill=white] (13.2,1.0) rectangle (15.2,2.3);
  \node[align=center] at (14.2,1.65) {\textbf{slack $\ge$}\\\textbf{margin?}};
  \draw[->] (14.2,2.3) -- (14.2,3.0) node[anchor=south,font=\scriptsize] {yes: next block};
  \draw[->] (14.2,1.0) -- (14.2,0.3) node[anchor=north,font=\scriptsize,align=center] {no: back to the stage\\that owns the spec};
  % the illegal way back
  \draw[->,dashed,black!45] (13.2,1.15) -- (7.9,0.0);
  \node[font=\Large,black!70] at (10.55,0.57) {$\times$};
  \node[font=\scriptsize,black!60,anchor=north] at (10.55,0.3) {never to the bench};
\end{circuitikz}
\end{document}
```

*Figure 2. One golden bench judges every view of the design. An independent script recomputes the deciding number, and a failure returns to the stage that owns the spec, never to the bench.*

- **The spec is executable:** a model and a bench you run daily, not a document [6].
- **Margin is a number**, set per spec at stage 1. A pass without margin is a fail.
- **Derive, never type.** Numbers come from a spec plus margin or from a lookup on the active kit.
- **Cite, then log.** Every decision names its source, and every tool run is logged so the next session resumes instead of redoing.

## The flow

```tikz title="Figure 3. The flow as a chain of gated stages. Solid arrows go forward through the gates. Dashed arrows are the only legal ways back, each to the stage that owns the failure. The solid loop on the left joins sizing to post-layout. Stage 7, the minimum, is optional: it runs after layout, with the generator inside its loop."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % stage boxes: x 0..8.4, height 1.0, pitch 1.5
  \foreach \i/\t/\s in {
    0/{1. Spec table, golden model, golden bench}/{split to fundamental blocks; specs flow down with margin},
    1/{2. Topology per block}/{three candidates compared by arithmetic; a decision record},
    2/{3. Sizing from simulated tables}/{$g_m/I_D$ or $I_D/W$ intents; burn the models down to zero},
    3/{4. Design centering}/{maximize the smallest slack over corners and $k\sigma$ mismatch},
    4/{5. Layout}/{generator code; constraints as check scripts},
    5/{6. Post-layout}/{the same benches on the extracted netlist},
    7/{8. Sign-off and handoff}/{legal, functional, parametric, reliable; export the intents}} {
    \draw[fill=black!4] (0,{10.5-1.5*\i}) rectangle (8.4,{11.5-1.5*\i});
    \node[align=center,text width=8.1cm] at (4.2,{11.0-1.5*\i})
      {\textbf{\t}\\{\scriptsize\color{black!60} \s}};
  }
  % the optional minimum: after layout, with the generator inside its loop
  \draw[dashed,fill=white] (0,1.5) rectangle (8.4,2.5);
  \node[align=center,text width=8.1cm] at (4.2,2.0)
    {\textbf{7. Optional: the minimum}\\{\scriptsize\color{black!60} least area or power that still clears the post-layout floor}};
  % forward arrows with gate tags
  \foreach \i/\g in {0/G0,1/{decision record},2/{G1 G1f},3/G2,4/{G3 G4},5/{G5 G6},6/{G5 at the yield bound}} {
    \draw[->] (4.2,{10.5-1.5*\i}) -- (4.2,{10.0-1.5*\i});
    \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,{10.25-1.5*\i}) {\g};
  }
  \draw[->] (4.2,0) -- (4.2,-0.6);
  \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt] at (4.2,-0.3) {G7};
  \node[font=\scriptsize,anchor=north] at (4.2,-0.65) {to silicon, with a trim knob for what margin cannot see};
  % the only legal ways back
  \draw[->,dashed] (8.4,9.7) -- (8.9,9.7) -- (8.9,11.0) -- (8.4,11.0);
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=west,align=left,text width=3.2cm] at (9.1,10.35)
    {no candidate fits this supply and kit: renegotiate the split or the spec};
  \draw[->,dashed] (8.4,8.2) -- (8.9,8.2) -- (8.9,9.3) -- (8.4,9.3);
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=west,align=left,text width=3.2cm] at (9.1,8.75)
    {a spec that sizing cannot meet goes back to the topology};
  \draw[->,dashed] (8.4,6.7) -- (8.9,6.7) -- (8.9,7.8) -- (8.4,7.8);
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=west,align=left,text width=3.2cm] at (9.1,7.25)
    {no center clears the margin floor at the power budget};
  \draw[->,dashed] (8.4,3.7) -- (8.9,3.7) -- (8.9,5.0) -- (8.4,5.0);
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=west,align=left,text width=3.2cm] at (9.1,4.35)
    {a post-layout miss: fix the largest contributor in layout first};
  % the minimum's own loop: every candidate regenerated and extracted
  \draw[->,thick] (8.4,1.75) -- (8.9,1.75) -- (8.9,2.25) -- (8.4,2.25);
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=west,align=left,text width=3.2cm] at (9.1,2.0)
    {the generator re-lays out and extracts every candidate};
  % the sizing-layout loop: part of the flow, not a way back
  \draw[->,thick] (0,3.5) -- (-0.5,3.5) -- (-0.5,8.0) -- (0,8.0);
  \node[draw,fill=white,font=\scriptsize,inner sep=1.5pt,rotate=90] at (-0.5,5.75) {sizing and layout loop};
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=east,align=right,text width=3.4cm] at (-0.9,5.75)
    {\textbf{analog block}: runs once. Extracted R and C return to the benches as fixed parasitics, then re-center. \textbf{cell or tile}: stages 3 to 6 are one evaluation, and the gate number is the extracted one.};
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=north west,align=left,text width=8.4cm] at (0,-1.2)
    {The golden bench is written at stage 1 and never edited to make a block pass. Dashed arrows are the only legal ways back, each to the stage that owns the failure.};
\end{circuitikz}
\end{document}
```

*Figure 3. The flow as a chain of gated stages. Dashed arrows are the only legal ways back; stage 7 is optional and runs after layout, with the generator inside its loop.*

The flow is top-down and burn-down: each stage swaps one behavioral model for transistors and re-runs the same bench, which is top-down design in Kundert's sense [6] with specifications translated level by level as in [7]. The long version, with my tools at each step, is [[Analog Design Flow|the full flow note]].

### Stage 1. Spec, golden model, golden bench, hierarchy

```tikz title="Figure 4. The burn-down tree for a two-stage Miller op-amp: five Verilog-A nodes retired leaf first until none remain, each against its own golden bench."
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

*Figure 4. The burn-down tree for a two-stage Miller op-amp, from my verified run: five Verilog-A nodes retired leaf first, each against its own golden bench.*

1. **Spec table:** condition, target with margin, unit and the deciding measurement, one row per requirement. No condition, no spec.
2. **Golden model and bench:** the system as one Verilog-A block, digital control in Verilog, every limit a parameter named after its spec.
3. **Hierarchy:** split to fundamental blocks, with specs flowing down with margin [7]. The children must match the parent's model on its bench. In Figure 4 they lost 7° of phase margin to a right-half-plane zero the model ignored, and the gap was charged to the second stage, not hidden in a looser bench.
4. **Spec sensitivity:** before any transistor exists, sweep each block's model parameters by its margin on the system bench to see where the margin must go.

Writing functional models first raised schematic-level SNDR by 5.6 dB and halved the power against starting from the spec alone [5].

### Stage 2. Topology

```tikz title="Figure 5. Headroom at 0.8 V, drawn to scale. Each stacked device takes about 0.15 V of V_Dsat, and the output keeps what is left: 0.05 V for a telescopic cascode, 0.2 V for a folded cascode, 0.5 V for a two-stage output."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % drawn to scale: 0.15 V of V_Dsat per device = 1.6 units, so V_DD = 0.8 V = 8.533
  \draw (0,8.533) -- (14.6,8.533);
  \draw (0,0) -- (14.6,0);
  \node[font=\scriptsize,anchor=east] at (0,8.533) {$V_{DD} = 0.8$\,V};
  \draw (0.3,0) node[ground]{};
  % column titles
  \node[font=\footnotesize,align=center] at (2.0,9.25) {\textbf{telescopic cascode}\\[-1pt]{\scriptsize 5 devices}};
  \node[font=\footnotesize,align=center] at (7.0,9.25) {\textbf{folded cascode}\\[-1pt]{\scriptsize 4 devices}};
  \node[font=\footnotesize,align=center] at (12.0,9.25) {\textbf{two-stage output}\\[-1pt]{\scriptsize 2 devices}};
  % telescopic: tail, input, cascode | out | cascode, source
  \node[nmos] (A1) at (2.0,0.8) {};
  \node[nmos] (A2) at (2.0,2.4) {};
  \node[nmos] (A3) at (2.0,4.0) {};
  \node[pmos] (A4) at (2.0,6.133) {};
  \node[pmos] (A5) at (2.0,7.733) {};
  \draw (A1.S) -- (2.0,0); \draw (A1.D) -- (A2.S); \draw (A2.D) -- (A3.S);
  \draw (A3.D) -- (A4.D); \draw (A4.S) -- (A5.D); \draw (A5.S) -- (2.0,8.533);
  \fill (2.0,5.067) circle (0.06);
  % folded cascode output branch: sink, cascode | out | cascode, source
  \node[nmos] (B1) at (7.0,0.8) {};
  \node[nmos] (B2) at (7.0,2.4) {};
  \node[pmos] (B3) at (7.0,6.133) {};
  \node[pmos] (B4) at (7.0,7.733) {};
  \draw (B1.S) -- (7.0,0); \draw (B1.D) -- (B2.S); \draw (B2.D) -- (B3.D);
  \draw (B3.S) -- (B4.D); \draw (B4.S) -- (7.0,8.533);
  \fill (7.0,4.267) circle (0.06);
  % two-stage output: driver | out | load
  \node[nmos] (C1) at (12.0,0.8) {};
  \node[pmos] (C2) at (12.0,7.733) {};
  \draw (C1.S) -- (12.0,0); \draw (C1.D) -- (C2.D); \draw (C2.S) -- (12.0,8.533);
  \fill (12.0,4.267) circle (0.06);
  % to-scale voltage budget bars beside each stack
  \foreach \x/\segs in {2.8/{0/1.6,1.6/3.2,3.2/4.8,5.333/6.933,6.933/8.533},
                        7.8/{0/1.6,1.6/3.2,5.333/6.933,6.933/8.533},
                        12.8/{0/1.6,6.933/8.533}} {
    \foreach \a/\b in \segs { \draw[fill=black!20] (\x,\a) rectangle ({\x+0.35},\b); }
  }
  \draw[thick,fill=white] (2.8,4.8) rectangle (3.15,5.333);
  \draw[thick,fill=white] (7.8,3.2) rectangle (8.15,5.333);
  \draw[thick,fill=white] (12.8,1.6) rectangle (13.15,6.933);
  \draw[dashed,black!50] (2.0,5.067) -- (2.8,5.067);
  \draw[dashed,black!50] (7.0,4.267) -- (7.8,4.267);
  \draw[dashed,black!50] (12.0,4.267) -- (12.8,4.267);
  \node[font=\scriptsize,anchor=west,align=left] at (3.25,5.067) {out: \textbf{0.05\,V}\\swing};
  \node[font=\scriptsize,anchor=west,align=left] at (8.25,4.267) {out: \textbf{0.2\,V}\\swing};
  \node[font=\scriptsize,anchor=west,align=left] at (13.25,4.267) {out: \textbf{0.5\,V}\\swing};
  \node[font=\scriptsize,anchor=west,black!60] at (3.25,0.8) {$V_{Dsat}$ 0.15\,V};
  \node[font=\scriptsize,anchor=west,black!60] at (8.25,0.8) {$V_{Dsat}$ 0.15\,V};
  \node[font=\scriptsize,anchor=west,black!60] at (13.25,0.8) {$V_{Dsat}$ 0.15\,V};
  \node[font=\scriptsize,anchor=north,align=center] at (7.3,-0.75)
    {Drawn to scale: each device takes $V_{Dsat} \approx 0.15$\,V of the 0.8\,V supply, and the output keeps what is left.};
\end{circuitikz}
\end{document}
```

*Figure 5. Headroom at 0.8 V, drawn to scale: every stacked device takes about 0.15 V of $V_{Dsat}$, and the output keeps what is left.*

An LLM will justify any plausible topology, so make it compute. Pick converter and PLL architectures first, against the noise and jitter floors and the published frontier [8]. Compare three candidates from the literature in numbers at your supply and kit, discard what fails headroom (Figure 5) or gain, and keep the most mature survivor and the runner-up, with the table and its sources. Gain is just as blunt: with the single gate length of ASAP7 [9], a five-transistor OTA gives 24 to 28 dB and a two-stage 52 to 57 dB, so 60 dB at 0.8 V needs a cascoded first stage, gain boosting or three stages.

### Stage 3. Sizing with gm/ID and ID/W

The square law misjudges a nanometer device's $g_m$ by 20 to 60% in strong inversion and by 2× or more in moderate inversion [10]. So simulate each device once per kit, sweeping $L$, $V_{GS}$, $V_{DS}$ and $V_{SB}$ on a reference width, and size from the tables. The $g_m/I_D$ methodology [10], [11], current density $I_D/W$, the inversion coefficient of the EKV model [12] and Razavi's reference-transistor scaling [13] are one idea: the simulator names the operating point with a width-independent ratio, and width scales it, because $K$ devices in parallel multiply $I_D$ and $g_m$ by $K$ and leave every ratio alone.

```tikz title="Figure 6. Transconductance efficiency against current density. g_m/I_D indexes strong and moderate inversion well; in weak inversion it flattens at 1/(n U_T), so I_D/W takes over as the index. V_Dsat is about 2/(g_m/I_D)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!15] (1.66,0) rectangle (4.17,5.6);
  \draw[->] (0,0) -- (7.7,0) node[right] {$I_D/I_S\ \propto I_D/W$};
  \draw[->] (0,0) -- (0,6.1) node[above] {$g_m/I_D$ (S/A)};
  \foreach \e/\x in {-2/0,-1/1.2,0/2.4,1/3.6,2/4.8,3/6.0,4/7.2} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {$10^{\e}$}; }
  \foreach \s in {10,20,30} { \draw (0.08,{0.18*\s}) -- (-0.08,{0.18*\s}) node[left,font=\scriptsize] {\s}; }
  \draw[dashed] (0,5.33) -- (7.4,5.33);
  \draw[dashed,domain=0:4,samples=40] plot ({1.2*(\x+2)},{0.18*29.6/pow(10,\x/2)});
  \draw[very thick,domain=-2:2,samples=100] plot ({1.2*(log10(pow(10,2*\x)+pow(10,\x))+2)},{0.18*29.6/(1+pow(10,\x))});
  \node[font=\scriptsize] at (0.8,5.85) {weak};
  \node[font=\scriptsize] at (2.9,5.85) {moderate};
  \node[font=\scriptsize] at (5.7,5.85) {strong};
  \node[font=\scriptsize,anchor=north] at (6.2,5.25) {$1/(nU_T)\approx 30$};
  \node[font=\scriptsize,anchor=west] at (4.6,2.0) {$\approx 2/V_{OV}$ (square law)};
  \node[font=\scriptsize,anchor=west] at (4.6,1.5) {$V_{D,sat}\approx 2/(g_m/I_D)$};
\end{circuitikz}
\end{document}
```

*Figure 6. Transconductance efficiency against current density (basic EKV, $n = 1.3$). Adapted from [10], Figs. 1.6 and 2.8.*

Index by $g_m/I_D$ in strong and moderate inversion, where it is the power knob and sets headroom. Index by $I_D/W$ in weak inversion, where $g_m/I_D$ stops moving. Same table, same point, two names.

```tikz title="Figure 7. The sizing step for one device: g_m from the spec, then L, then the inversion level, then I_D, then W from the current density in the table."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\t in {0/{1. $g_m$ from the spec (gain, bandwidth, noise)},1/{2. Pick $L$: short = fast, small; long = gain, matching},2/{3. Pick $g_m/I_D$: large = low power, swing; small = fast, small},3/{4. $I_D = g_m\,/\,(g_m/I_D)$},4/{5. $W = I_D\,/\,(I_D/W)$}} {
    \draw[fill=black!4,rounded corners=2pt] (0,{-1.2*\i}) rectangle (9.6,{-1.2*\i+0.8});
    \node at (4.8,{-1.2*\i+0.4}) {\t};
  }
  \foreach \i in {0,1,2,3} { \draw[->] (4.8,{-1.2*\i}) -- (4.8,{-1.2*\i-0.4}); }
  \draw[fill=gray!15,rounded corners=2pt] (10.6,-4.0) rectangle (13.8,-1.2);
  \node[align=center,font=\scriptsize] at (12.2,-2.6) {lookup table\\ SPICE sweep of\\ $L, V_{GS}, V_{DS}, V_{SB}$\\ at reference $W$:\\ $g_m/I_D$, $I_D/W$,\\ $f_T$, $g_m/g_{ds}$, $C$'s};
  \draw[->] (10.6,-2.0) -- (9.6,-2.0);
  \draw[->] (10.6,-3.2) -- (9.6,-4.4);
\end{circuitikz}
\end{document}
```

*Figure 7. The sizing step for one device. Adapted from [10], Sec. 1.2.3 and Fig. 1.7.*

```tikz title="Figure 8. The intrinsic gain stage: unity-gain frequency g_m/C_L, DC gain g_m/g_ds. It is also the half circuit of every differential pair."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M){};
  \draw (M.S) node[ground]{};
  \draw (M.G) -- ++(-0.6,0) node[ocirc]{} node[left]{$v_{in}$};
  \draw (M.D) -- (0,1.2) coordinate (o);
  \draw (o) to[I, l_=$I_D$, invert] (0,3.2) node[vcc]{$V_{DD}$};
  \draw (o) -- (1.6,1.2) to[C, l=$C_L$] (1.6,-0.77) node[ground]{};
  \draw (1.6,1.2) -- (2.4,1.2) node[ocirc]{} node[right]{$v_{out}$};
  \begin{scope}[xshift=5.2cm,yshift=-0.6cm]
    \draw[->] (0,0) -- (6.0,0) node[right] {$\log\omega$};
    \draw[->] (0,0) -- (0,3.4) node[above] {$\lvert A_v\rvert$ (dB)};
    \draw[thick] (0,2.6) -- (1.8,2.6) -- (4.4,0.0);
    \draw[dashed] (1.8,0) -- (1.8,2.6);
    \node[below,font=\scriptsize] at (1.8,0) {$\omega_c$};
    \node[below,font=\scriptsize] at (4.4,0) {$\omega_u = g_m/C_L$};
    \node[left,font=\scriptsize] at (0,2.6) {$g_m/g_{ds}$};
    \node[font=\scriptsize,anchor=west] at (2.9,2.1) {$-20$ dB/dec};
    \draw[dotted] (5.5,0) -- (5.5,1.6);
    \node[font=\scriptsize,anchor=south] at (5.5,1.6) {$\omega_T$};
    \draw[<->] (4.4,0.5) -- (5.5,0.5) node[midway,above,font=\scriptsize] {FO};
  \end{scope}
\end{circuitikz}
\end{document}
```

*Figure 8. The intrinsic gain stage, also the half circuit of every differential pair. Adapted from [10], Figs. 3.1 to 3.3.*

For 1 GHz into 1 pF at 60 nm and 15 S/A, $g_m = 6.28$ mS, $I_D = 419$ µA, and at 10.05 µA/µm, $W = 41.7$ µm; SPICE lands 3% low until the device's own drain capacitance joins $C_L$ and the step repeats [10]. $V_{GS}$ is an output: it moves 100 to 200 mV over corners, so bias by current.

For a whole amplifier the specs land in a fixed order, ratios before absolutes. Steps 1, 2, 3 and 6 are normalized, so a stage for 1 GHz into 1 pF is also the stage for 100 MHz into 10 pF.

```tikz title="Figure 9. Each amplifier spec fixes one sizing quantity, in this order, from the same lookup table. Steps 5 to 8 repeat until self-loading converges."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\s/\t in {
    0/{Corners ($g_m$ spread)}/{0. Pre-distort: design nominal for $\omega_u/0.7$},
    1/{Swing, CM range, $V_{DD}$, HD3}/{1. $g_m/I_D$ floor/ceiling per device: $V_{D,sat}\approx 2/(g_m/I_D)$},
    2/{DC gain $A_0$, static error}/{2. $L$ per device from the $g_m/g_{ds}$ lookup},
    3/{Phase margin}/{3. $f_T$ at non-dominant nodes: their $L$, $g_m/I_D$},
    4/{Noise ($kT/C$ or PSD)}/{4. Capacitors $C_{Ltot}$ (or $g_m$ for a PSD spec)},
    5/{Settling $t_s$, $\epsilon_d$; GBW}/{5. $g_m = \omega_u C_{Ltot}/\beta$},
    6/{Power (minimise)}/{6. Input $g_m/I_D$: trade $f_T$ against $g_m/I_D$ via $\beta$},
    7/{Slew rate, step size}/{7. $I_D = \max\left[g_m/(g_m/I_D),\ SR\cdot C\right]$},
    8/{Offset, $1/f$, area}/{8. $W = I_D/(I_D/W)$; check $WL$, $C_{dd}$; iterate 5--8}} {
    \draw[fill=gray!12,rounded corners=2pt] (0,{-1.05*\i}) rectangle (4.2,{-1.05*\i+0.75});
    \node[font=\scriptsize] at (2.1,{-1.05*\i+0.375}) {\s};
    \draw[fill=black!3,rounded corners=2pt] (4.9,{-1.05*\i}) rectangle (12.2,{-1.05*\i+0.75});
    \node[font=\scriptsize] at (8.55,{-1.05*\i+0.375}) {\t};
    \draw[->] (4.2,{-1.05*\i+0.375}) -- (4.9,{-1.05*\i+0.375});
  }
  \foreach \i in {0,...,7} { \draw[->] (8.55,{-1.05*\i}) -- (8.55,{-1.05*\i-0.3}); }
  \draw[fill=gray!25,rounded corners=2pt] (12.9,-6.0) rectangle (15.3,-1.6);
  \node[align=center,font=\scriptsize] at (14.1,-3.8) {lookup\\table\\[2pt] $g_m/g_{ds}$\\ $f_T$, $C/W$\\ $I_D/W$};
  \draw (12.6,-1.725) -- (12.6,-8.025);
  \draw (12.9,-3.8) -- (12.6,-3.8);
  \foreach \i in {2,3,6,8} { \draw[->] (12.6,{-1.05*\i+0.375}) -- (12.2,{-1.05*\i+0.375}); }
  \draw[->] (12.6,-7.6) -- (12.6,-8.025) -- (12.2,-8.025);
\end{circuitikz}
\end{document}
```

*Figure 9. Each amplifier spec fixes one sizing quantity, in this order. After [10], Secs. 3.1, 5.6.3, 6.1.2 and 6.4.*

Switches size from the $V_{DS} = 0$ table, latches from $C/g_m$, matched pairs from area. The tables cannot see the final terminal voltages (look up again once biased), width effects on $g_m/g_{ds}$ (10 to 20% at long $L$ in weak inversion [10]), or layout effects, which can move bias points 20 to 30% [14]. The optima are shallow: a few S/A below the minimum-current point costs about 20% more current and saves about 45% of the width [10].

```tikz title="Figure 10. Store intents, not widths. The same five-transistor OTA intent solved on two kits keeps current, power and GBW, but not gain or offset."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % what is stored versus what is solved per kit
  \draw[thick,fill=black!10] (0,0.3) rectangle (3.6,3.7);
  \node[align=center,text width=3.3cm] at (1.8,2.0)
    {\textbf{intent}\\[3pt]{\scriptsize topology and specs\\ $g_m/I_D$ and $I_D$ per device\\ the rule that chose $L$\\ current ratios}};
  \node[font=\scriptsize,anchor=south] at (1.8,3.75) {stored: ports across kits};
  \foreach \y/\k/\r in {2.9/{FreePDK45 tables}/{gain 35.7\,dB},
                        1.1/{ASAP7 tables}/{gain 24.6\,dB (one gate length)\\ input-pair area $\div 50$, offset $\sigma \times 7$}} {
    \draw[->] (3.6,\y) -- (4.6,\y);
    \draw[fill=black!4] (4.6,{\y-0.45}) rectangle (7.4,{\y+0.45});
    \node[align=center,font=\footnotesize] at (6.0,\y) {solve on\\\k};
    \draw[->] (7.4,\y) -- (8.2,\y);
    \draw[fill=white] (8.2,{\y-0.6}) rectangle (12.4,{\y+0.6});
    \node[align=center,font=\scriptsize,text width=4.0cm] at (10.3,\y) {$W$, $V_{GS}$ for this kit\\ \r};
  }
  \node[font=\scriptsize,anchor=south] at (10.3,3.55) {solved: per kit, does not port};
  \node[font=\scriptsize,anchor=north,align=center,text width=12cm] at (6.2,0.1)
    {current, power and GBW agree within 7\,\%; gain and offset do not.\\ Re-solve on each kit and re-center before trusting any margin.};
\end{circuitikz}
\end{document}
```

*Figure 10. Store intents, not widths: one five-transistor OTA intent solved on FreePDK45 [15] and ASAP7 [9], from my runs.*

Inversion level and current ratios are what port between processes [16]; widths are solved per kit, so re-center on each kit before trusting a margin. G1 then checks every spec at every corner and in mismatch Monte Carlo, loop stability closed-loop at the real operating point [17], and start-up at slow and fast supply ramps. Derivations and worked OTAs: [[gm-ID Design Methodology|gm/ID design methodology]] and [[MosFETs#Why gm/ID, why ID/W|why gm/ID and ID/W work]].

### Stage 4. Design centering

```tikz title="Figure 11. The five-transistor OTA used below: four sizing variables, four specs, five corners plus 3-sigma input-pair mismatch."
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

*Figure 11. The five-transistor OTA used in the centering and minimum examples.*

```tikz title="Figure 12. The acceptance region A in two of the sizing variables. Variation is the cloud around the chosen point, and yield is the part of the cloud inside A. A nominal optimum sits on the boundary and gives 50% on its binding spec. The center maximizes the smallest normalized slack t, and a slide along the power axis picks the cheapest point that still clears the margin floor."
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

*Figure 12. The acceptance region in two sizing variables. A nominal optimum sits on the boundary; the center maximizes the smallest normalized slack. After [18], [19].*

A nominal optimizer pushes until some spec hits equality, which leaves half the variation cloud outside (Figure 12). Centering maximizes the smallest normalized slack over every spec and corner instead [18]:

$$
\max_{x}\; t \quad \text{subject to} \quad \mathrm{sense}_i \, \frac{f_i(x, c) - b_i}{s_i} \;\ge\; t \quad \text{for every spec } i \text{ and corner } c .
$$

$s_i = |b_i|$ gives relative margin, the "20% on every spec" designers mean. $s_i = \sigma_i$ gives the worst-case distance in sigmas, and every partial yield is at least $\Phi(t)$ [19]. $\sigma$ depends on the sizing, since mismatch scales as $1/\sqrt{WL}$ [20].

```tikz title="Figure 13. The centering loop. Every corner and mismatch seed runs in parallel, each spec's slack is normalized with k sigma subtracted, and a derivative-free optimizer maximizes the smallest slack."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % the optimizer proposes a sizing
  \draw[thick,fill=black!10] (0,1.5) rectangle (3.0,2.7);
  \node[align=center] at (1.5,2.1) {\textbf{optimizer}\\{\scriptsize derivative-free,}\\[-2pt]{\scriptsize on $\log x$}};
  \draw[->] (3.0,2.1) -- (4.6,2.1) node[midway,anchor=south,font=\scriptsize] {sizing $x$};
  % every corner times every seed, run in parallel
  \foreach \r/\c in {0/tt,1/ss,2/ff,3/sf,4/fs} {
    \foreach \s in {0,...,5} {
      \draw[fill=black!8] ({4.7+0.42*\s},{2.62-0.36*\r}) rectangle ({5.02+0.42*\s},{2.9-0.36*\r});
    }
    \node[font=\scriptsize,anchor=west] at (7.25,{2.76-0.36*\r}) {\c};
  }
  \node[font=\scriptsize,anchor=south,align=center] at (5.95,2.95) {nominal + $N$ mismatch seeds};
  \node[font=\scriptsize,anchor=west,align=left] at (7.8,2.05) {every run\\in parallel,\\same seeds\\for every $x$};
  % measurements become slacks
  \draw[->] (5.95,1.18) -- (5.95,0.4) node[midway,anchor=west,font=\scriptsize] {$f_{ic}$, and $\sigma_i$ from the seeds};
  \draw[fill=black!4] (3.5,-0.5) rectangle (8.7,0.4);
  \node at (6.1,-0.05) {$s_{ic} = \mathrm{sense}_i\,(f_{ic} \mp k\sigma_i - b_i)/|b_i|$};
  \draw[->] (3.5,-0.05) -- (2.8,-0.05);
  \draw[fill=black!4] (0,-0.5) rectangle (2.8,0.4);
  \node at (1.4,-0.05) {$t(x) = \min_{i,c} s_{ic}$};
  \draw[->] (1.4,0.4) -- (1.4,1.5) node[midway,anchor=east,font=\scriptsize] {maximize $t$};
  \node[font=\scriptsize,anchor=north west,align=left,text width=11cm] at (0,-0.75)
    {Converged: full Monte Carlo at every corner, then again after extraction (G2).};
\end{circuitikz}
\end{document}
```

*Figure 13. The centering loop: every corner and mismatch seed in parallel, slack normalized per spec, the smallest slack maximized.*

Corners carry global variation and the seeds carry local mismatch only, because process Monte Carlo stacked on a corner counts global variation twice [18]. On sky130, `tt_mm` adds local mismatch to `tt`, while `mc` adds global variation too. On the OTA the loop reached $t = 0.406$ (every spec 40.6% inside its limit at every corner) in 725 runs and 0.46 s, with four specs binding at once, which is what centered looks like. On sky130 with 16 seeds it gave $t = 0.134$ in 31 s, with about 18% error on each sigma, hence the final full Monte Carlo.

Brute force resolves about 4σ with $10^5$ samples. Replicated cells sign off nearer 6σ, since block yield is $Y_\text{chip}^{1/N}$ [21], and need worst-case-distance or scaled-sigma methods [22]. The search belongs to the optimizer, never to the LLM: a goal moved to make the slack positive is a lie. More in [[Design Centering|design centering]].

### Stage 5. Layout

```tikz title="Figure 14. Where layout enters the loop. (a) For the centered analog block the loop runs once: extracted R and C return to the benches and the block is re-centered. (b) For a cell or tile, and for the minimum in stage 7, layout is inside the objective: a surrogate fitted to the generator's layouts ranks candidates, and only the top K are laid out and extracted."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) analog block: one pass back through sizing
  \node[font=\footnotesize\bfseries,anchor=west] at (0,4.35) {(a) analog block: the loop runs once};
  \foreach \y/\t/\s in {3.3/{size and center}/{schematic + parasitic-scale corner},
                        1.8/{generate the layout}/{DRC and LVS clean},
                        0.3/{extract, same benches}/{the post-layout gate}} {
    \draw[fill=black!4] (0,{\y-0.5}) rectangle (4.4,{\y+0.5});
    \node[align=center] at (2.2,\y) {\textbf{\t}\\{\scriptsize\color{black!60}\s}};
  }
  \draw[->] (2.2,2.8) -- (2.2,2.3);
  \draw[->] (2.2,1.3) -- (2.2,0.8);
  \draw[->,thick] (4.4,0.3) -- (5.0,0.3) -- (5.0,3.3) -- (4.4,3.3);
  \node[font=\scriptsize\hyphenpenalty10000\relax,anchor=west,align=left,text width=2.2cm] at (5.15,1.8)
    {once: extracted R and C go back as fixed parasitics, then re-center};
  % (b) cell or tile: the generator is the objective
  \node[font=\footnotesize\bfseries,anchor=west] at (8.0,4.35) {(b) cell or tile: layout is inside the objective};
  \draw[thick,fill=black!10] (8.0,2.8) rectangle (11.0,3.8);
  \node at (9.5,3.3) {\textbf{optimizer}};
  \draw[fill=black!4] (12.2,2.8) rectangle (16.2,3.8);
  \node[align=center] at (14.2,3.3) {\textbf{surrogate}\\{\scriptsize\color{black!60}fitted to the generator's layouts}};
  \draw[fill=black!4] (12.2,-0.2) rectangle (16.2,0.8);
  \node[align=center] at (14.2,0.3) {\textbf{generator}\\{\scriptsize\color{black!60}DRC and LVS as feasibility}};
  \draw[fill=black!4] (8.0,-0.2) rectangle (11.0,0.8);
  \node[align=center] at (9.5,0.3) {\textbf{extract, bench}\\{\scriptsize\color{black!60}what the gate sees}};
  \draw[->] (11.0,3.3) -- (12.2,3.3) node[midway,anchor=south,font=\scriptsize] {ranks};
  \draw[->] (14.2,2.8) -- (14.2,0.8) node[midway,anchor=west,font=\scriptsize] {top $K$ only};
  \draw[->] (12.2,0.3) -- (11.0,0.3) node[midway,anchor=north,font=\scriptsize] {layout};
  \draw[->] (9.5,0.8) -- (9.5,2.8) node[midway,anchor=east,font=\scriptsize,align=right] {extracted\\number};
  \draw[->,dashed,black!50] (11.0,0.75) -- (12.2,2.85);
  \node[font=\scriptsize,anchor=west,align=left,black!60] at (11.75,1.55) {refit on a new\\generator or kit};
\end{circuitikz}
\end{document}
```

*Figure 14. Where layout enters the loop: (a) once, for the centered analog block; (b) inside the objective, for a cell or tile [23] and for the minimum in stage 7.*

- **Generators, not drawn geometry.** A generator re-runs on another kit; a GDS can only be redrawn [24], [25]. Free-form place-and-route [26], [27] stays optional.
- **Start from a reference.** From-scratch agent layouts came out 1.6 to 2.8× the area of the ported one, which reached sign-off in 18.9 hours without intervention [5].
- **Constraints as check scripts** over the extracted netlist [20], [28]: C and R difference per differential net, capacitor weights, electromigration. A greedy router can give the two halves of a common-centroid pair 0.34 and 0.88 fF of coupling and pass both DRC and LVS.
- **Three checkpoints.** Look at the first layout at full scale. Explain the first post-extraction gap one change at a time, largest contributor first; an SAR emulator fed the extracted capacitor weights predicted 63.9 dB for the fix, and extraction then gave 63.6 dB [5]. Before finishing, list what passes DRC and LVS but could still fail.

A generator that re-runs cheaply is what lets stage 7 search on extracted numbers (Figure 14b); for a whole tile, where the candidates are many, a surrogate fitted to the generator's layouts picks which ones earn a layout [23]. The gate number is always the extracted one. G3 and G4 are DRC and LVS on the foundry's own decks.

### Stage 6. Post-layout

The same golden benches run on the extracted netlist, coupling included, at every corner and in mismatch Monte Carlo (G5). Re-run everything after any fix, since fixes move other parasitics: shrinking a unit capacitor to fix slow-corner timing shifted the DAC weights through routing coupling [5]. A miss that layout cannot fix goes back to sizing with the extracted parasitics fixed in the benches. G6 covers electromigration and IR drop from simulated currents, safe operating area and aging. The re-centered, extracted design is where stage 7 starts.

### Stage 7. Optional: shrink to the minimum

Centering buys the most margin; the minimum spends it. Search for it after layout: the layout is a generator, so every candidate the search tries is regenerated, checked and extracted cheaply, and the yield bound it constrains is a post-layout bound. That matters most here, because the minimum sits on the yield boundary, where a parasitic estimate is least trustworthy. Minimize cost subject to a yield floor, which structural engineers call reliability-based design optimization [29]:

$$
\min_{x}\; \mathrm{cost}(x) \quad \text{subject to} \quad \beta_{w,i}(x) \ge \beta_{\min} \quad \text{for every spec } i \text{ and corner } c ,
$$

with $\beta_{w,i}$ the worst-case distance in sigmas [19]. The centered slack under a budget never falls as the budget grows, so bisect on the budget; the curve is the yield-optimized Pareto front [30].

```tikz title="Figure 15. The minimum on the OTA. Each point is the slack after re-centering at a fixed bias current. The least budget that clears the 0.2 floor is 9.04 uA, against 23 uA at the center."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x: bias-current budget B on a log axis, 6 to 26 uA over 10 units; y: centered slack, 8 units per 1.0
  \fill[black!6] (0,-0.8) rectangle (10,0);
  \node[font=\scriptsize,anchor=south east,black!60] at (9.9,-0.78) {$t < 0$: some spec fails at some corner};
  \draw[->] (0,-0.8) -- (10.5,-0.8) node[anchor=west,font=\scriptsize,align=left] {budget $B$: bias\\current, log scale};
  \draw[->] (0,-0.8) -- (0,4.0) node[anchor=south,font=\scriptsize] {centered slack $t^*(B)$};
  \foreach \x/\l in {0/6,1.962/8,3.484/10,6.249/15,8.211/20,9.733/25} {
    \draw (\x,-0.72) -- (\x,-0.88) node[anchor=north,font=\scriptsize] {\l\,$\mu$A};
  }
  \foreach \y/\l in {0/0,0.8/0.1,1.6/0.2,2.4/0.3,3.2/0.4} {
    \draw (0.08,\y) -- (-0.08,\y) node[anchor=east,font=\scriptsize] {\l};
  }
  \draw[black!35] (0,0) -- (10,0);
  \draw[dashed] (0,1.6) -- (10,1.6) node[anchor=west,font=\scriptsize] {floor $t = 0.2$};
  % measured: least current at each re-centered point; flat past the center, where the budget stops binding
  \draw[thick] plot coordinates {(0.854,-0.68) (1.876,0.576) (2.375,1.248) (2.689,1.568) (2.765,1.728) (2.915,1.904) (5.006,3.16) (9.164,3.248) (10.0,3.248)};
  \foreach \p in {(0.854,-0.68),(1.876,0.576),(2.375,1.248),(2.689,1.568),(2.765,1.728),(2.915,1.904),(5.006,3.16)} {
    \fill \p circle (0.055);
  }
  \fill (9.164,3.248) circle (0.1);
  \node[font=\scriptsize,anchor=south east,align=right] at (9.1,3.35) {\textbf{center}: $t = 0.406$ at 23\,$\mu$A};
  \draw[thick,fill=white] (2.796,1.6) circle (0.1);
  \draw[->] (4.0,0.75) -- (2.9,1.5);
  \node[font=\scriptsize,anchor=north west,align=left] at (3.95,0.85) {\textbf{minimum}: the least budget\\whose centered slack clears\\the floor, 9.04\,$\mu$A (33\,$\mu$W)};
  \node[font=\scriptsize,anchor=north west,align=left] at (0.25,3.85) {$t^*(B)$ never falls as $B$ grows,\\so bisect on $B$};
\end{circuitikz}
\end{document}
```

*Figure 15. The minimum on the OTA: slack after re-centering at each bias-current budget, from the schematic-level runs in [[Design Centering|design centering]]. In the flow, each point is a regenerated, extracted layout.*

Noise and model error also hurt most at the boundary, so tighten the statistics:

1. **Set $\beta_{\min}$ from the chip.** $Y_\text{block} = Y_\text{chip}^{1/N}$, so 32 comparators at a 3σ chip target need about 4σ each [31].
2. **Fix the seeds during the search.** Sampled yield lets the optimizer pick the candidate whose noise landed high, the optimizer's curse [32]; common seeds shrink it [33].
3. **Constrain the Clopper-Pearson lower bound** on yield [34], never the point estimate.
4. **Respect the mismatch model.** The search drives matched devices to the smallest $WL$ allowed, where mismatch stops following $1/\sqrt{\text{area}}$ [35]. Keep geometry floors, and take $\sigma$ from the kit's Monte Carlo.
5. **Verify with fresh seeds** on the final extracted layout: more than 2,300 zero-fail samples per corner prove 3σ at 95% confidence [36], the rule of three, $P_\text{fail} \le 3/N$ [37].
6. **Add a model-error margin.** Bump $\beta_{\min}$, or with silicon data, optimize over a distributionally robust set [38].

More in [[The Minimum, the Loop, and the Sign-off|the minimum, the loop and the sign-off]].

### Stage 8. Sign-off

Everything so far is legal or parametric, yet "catastrophic failures in chips are due to functional bugs, and not due to missed performance specifications," often "simple" errors such as inverted signals, swapped bit lines and incorrect power-up sequencing [39]. Analog verification also finds control-logic bugs in blocks with many settings and start-up deadlocks between a regulator and a shared bias [40], and power-aware mixed-signal simulation finds missing level shifters and incorrect power-up and power-down sequences [41]. So sign-off has four factors:

| Factor | Gates | Green means |
|---|---|---|
| legal | G3, G4 | foundry DRC and LVS clean or waived in writing; ERC, antenna, density, ESD, latch-up |
| functional | G1f | every mode and control bit in a self-checking run; polarity and connectivity assertions; start-up at slow and fast ramps; power sequencing; co-simulation with the real digital |
| parametric | G1, G2, G5 | corners × mismatch Monte Carlo on the extracted netlist; the Clopper-Pearson yield bound at target with 95% confidence; high sigma for replicated cells |
| reliable | G6 | electromigration, IR drop, safe operating area, aging |

G0 opens the flow (every spec has a number, unit, condition and margin), and G7 closes it (export the intents, list what the target must recreate, re-center on the target kit). No gate goes green on nominal-only results, capacitance-only extraction of a fast block, too few samples, or a number only the design run reported. The functional gate is the cheapest to add: once the benches are code, every mode and control bit is a loop.

## What margin cannot fix

```tikz title="Figure 16. Centering sets the mean, not the spread. Both designs sit at a 12 GHz mean against a 10 GHz minimum, the same 20% margin; a 1 GHz sigma fails 2.3% of parts and a 0.5 GHz sigma fails 32 ppm."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % frequency axis: 1.2 units per GHz, starting at 8 GHz; densities scaled by 1/sigma
  \fill[black!30] (0,0) -- plot[domain=0:2.4,samples=60] (\x,{1.8*exp(-((\x/1.2-4)*(\x/1.2-4))/2)}) -- (2.4,0) -- cycle;
  \draw[thick,dashed] plot[domain=0:9.6,samples=140] (\x,{1.8*exp(-((\x/1.2-4)*(\x/1.2-4))/2)});
  \draw[very thick] plot[domain=1.2:8.4,samples=140] (\x,{3.6*exp(-((\x/1.2-4)*(\x/1.2-4))/0.5)});
  \draw[->] (0,0) -- (10.1,0) node[anchor=west,font=\scriptsize] {GHz};
  \foreach \f in {8,10,12,14,16} { \draw ({1.2*(\f-8)},0.08) -- ({1.2*(\f-8)},-0.08) node[anchor=north,font=\scriptsize] {\f}; }
  \draw[thick] (2.4,-0.1) -- (2.4,3.95);
  \node[font=\scriptsize,anchor=south east,align=right] at (2.35,3.55) {spec:\\10\,GHz minimum};
  \draw[black!45] (4.8,0) -- (4.8,3.95);
  \node[font=\scriptsize,anchor=south west,align=left] at (4.9,3.55) {both means 12\,GHz:\\``20\,\% margin''};
  \draw[->] (0.6,1.35) -- (1.95,0.12);
  \node[font=\scriptsize,anchor=south,align=center] at (0.6,1.35) {$\sigma = 1$\,GHz:\\\textbf{2.3\,\%} fail};
  \draw[->] (6.9,2.3) -- (5.45,2.3);
  \node[font=\scriptsize,anchor=west,align=left] at (6.95,2.3) {$\sigma = 0.5$\,GHz:\\\textbf{32\,ppm} fail};
\end{circuitikz}
\end{document}
```

*Figure 16. Centering sets the mean, not the spread: the same 20% margin fails 2.3% of parts at a 1 GHz sigma and 32 ppm at 0.5 GHz.*

- **Wrong models.** On a 7 nm design, silicon was slower than the slow-slow corner for some dies at 0.675 V while the fast-fast target was over-margined; correlating the models to silicon cut design margins by 3.5% [42].
- **Corners** that are not worst cases for your metric [43], and start-up or overload, which steady-state margin never sees.
- **Defects and aging.** An open via is not a sigma.
- **Integration.** Supply and substrate coupling, bias distribution and start-up order exist nowhere before it; co-simulate the behavioral models with the transistor blocks.

Insure what you cannot bound. Trim, calibration and observability turn a parametric miss into a register write: digitally assisted analog cut an amplifier's power 62% with a digital post-processor costing 3.6% of the power and 18% of the area [44], [45]. Every control bit is a new place for a functional bug, so G1f must cover them all.

## Where the LLM sits

```tikz title="Figure 17. Who does what. You own the spec, the acceptance criteria and the waivers. The agent writes text and you review pictures. The optimizer owns every search, and an independent check, never the agent, produces the verdict."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \x/\w/\t/\s/\f in {
    0/3.2/{you}/{spec, acceptance criteria, deadlines, waivers}/10,
    4.5/3.6/{agent}/{writes netlists, Verilog-A, benches, generators, check scripts}/4,
    9.4/2.8/{simulator}/{plus the optimizer, which owns every search}/4,
    13.5/3.2/{independent check}/{recomputes the deciding number from raw data}/4} {
    \draw[fill=black!\f] (\x,1.2) rectangle ({\x+\w},3.2);
    \node[align=center,text width={(\w-0.3)*1cm},font=\small\hyphenpenalty10000\relax] at ({\x+\w/2},2.2) {\textbf{\t}\\[2pt]{\scriptsize\color{black!60}\s}};
  }
  \draw[->] (3.2,2.2) -- (4.5,2.2) node[midway,anchor=south,font=\scriptsize] {spec};
  \draw[->] (8.1,2.2) -- (9.4,2.2) node[midway,anchor=south,font=\scriptsize] {text};
  \draw[->] (12.2,2.2) -- (13.5,2.2) node[midway,anchor=south,font=\scriptsize] {raw data};
  % text in, picture out
  \draw[->] (6.3,3.2) -- (6.3,3.9) -- (1.6,3.9) -- (1.6,3.2);
  \node[font=\scriptsize,anchor=south] at (3.95,3.92) {rendered schematics and plots: text in, picture out};
  % the verdict never comes from the agent
  \draw[->] (15.1,1.2) -- (15.1,0.4) -- (1.6,0.4) -- (1.6,1.2);
  \node[font=\scriptsize,anchor=north] at (8.35,0.38) {the gate verdict goes to you, never through the agent};
  \node[font=\scriptsize,black!60,anchor=north] at (6.3,1.16) {never grades its own work};
\end{circuitikz}
\end{document}
```

*Figure 17. Who does what: the agent writes, the optimizer searches, an independent check decides, and you own the spec and the waivers. After the division of labor in [5].*

In the vibe-tapeout study the agent was very good at porting a block with a reference design and good at producing DRC- and LVS-clean block layouts, but poor at debugging from symptoms, verifying itself and knowing when to stop [5]. The failures that matter are silent, and each was caught only by independent re-verification:

| False pass [5] | Caught by |
|---|---|
| extraction overestimated SNDR at 66.99 dB; R and C combined from separate extractions gave 57.67 dB | a capacitance-only extraction to compare; count the coupling cards |
| LVS passed with open nets | an open-net report and a functional simulation of the extracted block |
| GDS exported without ports | re-read the GDS, list its labels, run LVS from that file |
| a "pass" from a decoder whose nonbinary weights were chosen after seeing the FFT | evaluate through the output path the chip has |
| a bench edited to pass | diff against the stage 1 copy |

The Analog Design Bench agrees: across 15 agent configurations, full-specification pass rates on its 50 tasks ran from 8.0% to 78.0%, and most failed submissions passed legality but failed electrical acceptance [46].

## Tools

| Need | Open options |
|---|---|
| kits | sky130, gf180mcu, IHP SG13G2; FreePDK45 and ASAP7 are predictive, with no open LVS deck |
| simulation | ngspice, Xyce, [ESPice](https://github.com/OmarSiwy/ESPice); Verilog-A through [OpenVAF-Reloaded](https://github.com/OpenVAF/OpenVAF-Reloaded) or [VerA](https://github.com/OmarSiwy/VerA) |
| schematics and benches | xschem, [Schemify](https://github.com/OmarSiwy/Schemify) |
| $g_m/I_D$ tables | [GmIDVisualizer](https://github.com/OmarSiwy/GmIDVisualizer), [pygmid](https://github.com/dreoilin/pygmid), [Mosplot](https://github.com/medwatt/gmid), [Murmann's scripts](https://github.com/bmurmann/Book-on-gm-ID-design) |
| centering and the minimum | a hundred-line script around the simulator; nothing open does worst-case-distance centering yet |
| layout | generator frameworks such as BAG [24], [25]; [Philis](https://github.com/UW-ASIC/Philis) and [GPurify](https://github.com/UW-ASIC/GPurify), both pre-1.0 |
| sign-off | the kit's own decks in [KLayout](https://www.klayout.de), [Magic](http://opencircuitdesign.com/magic/) and [Netgen](http://opencircuitdesign.com/netgen/) |
| chip and fabrication | [OpenROAD](https://github.com/The-OpenROAD-Project/OpenROAD), [LibreLane](https://github.com/librelane/librelane); [Tiny Tapeout](https://tinytapeout.com/) and [wafer.space](https://wafer.space) shuttles |

The claim is narrow. Variation is the part a flow can bound at design time, to a stated confidence: center first, then shrink to the minimum against a yield bound. Functional bugs it bounds with exhaustive mode simulation, cheap once the benches are code. Wrong models it can only insure against, with trim and observability. Silicon test answers the rest.

## References

1. H. Foster, "Part 12: The 2020 Wilson Research Group functional verification study," *Verification Horizons*, Siemens EDA, Feb. 3, 2021. [Online]. Available: https://blogs.sw.siemens.com/verificationhorizons/2021/02/03/part-12-the-2020-wilson-research-group-functional-verification-study/
2. H. Foster, "Part 12: The 2022 Wilson Research Group functional verification study," *Verification Horizons*, Siemens EDA, Jan. 9, 2023. [Online]. Available: https://blogs.sw.siemens.com/verificationhorizons/2023/01/09/part-12-the-2022-wilson-research-group-functional-verification-study/
3. H. Foster, "Why first-silicon success is getting harder for system companies," *Verification Horizons*, Siemens EDA, Sep. 3, 2025. [Online]. Available: https://blogs.sw.siemens.com/verificationhorizons/2025/09/03/why-first-silicon-success-is-getting-harder-for-system-companies/
4. E. Sperling, "First-time silicon success plummets," *Semiconductor Engineering*, Mar. 27, 2025. [Online]. Available: https://semiengineering.com/first-time-silicon-success-plummets/
5. K. Yoshioka, "The era of vibe tapeout: Dark age or golden age for analog circuit design?" arXiv:2610.15240, Oct. 2026. [Online]. Available: https://arxiv.org/abs/2610.15240
6. K. Kundert, "Principles of top-down mixed-signal design," Designer's Guide Consulting, Feb. 2003. [Online]. Available: https://designers-guide.org/design/tdd-principles.pdf
7. G. G. E. Gielen and R. A. Rutenbar, "Computer-aided design of analog and mixed-signal integrated circuits," *Proc. IEEE*, vol. 88, no. 12, pp. 1825-1854, Dec. 2000, doi: [10.1109/5.899053](https://doi.org/10.1109/5.899053).
8. B. Murmann, "ADC performance survey 1997-2026." [Online]. Available: https://github.com/bmurmann/ADC-survey
9. L. T. Clark *et al.*, "ASAP7: A 7-nm finFET predictive process design kit," *Microelectronics J.*, vol. 53, pp. 105-115, Jul. 2016, doi: [10.1016/j.mejo.2016.04.006](https://doi.org/10.1016/j.mejo.2016.04.006).
10. P. G. A. Jespers and B. Murmann, *Systematic Design of Analog CMOS Circuits: Using Pre-Computed Lookup Tables*. Cambridge, U.K.: Cambridge Univ. Press, 2017, doi: [10.1017/9781108125840](https://doi.org/10.1017/9781108125840).
11. F. Silveira, D. Flandre, and P. G. A. Jespers, "A gm/ID based methodology for the design of CMOS analog circuits and its application to the synthesis of a silicon-on-insulator micropower OTA," *IEEE J. Solid-State Circuits*, vol. 31, no. 9, pp. 1314-1319, Sep. 1996, doi: [10.1109/4.535416](https://doi.org/10.1109/4.535416).
12. C. C. Enz, F. Krummenacher, and E. A. Vittoz, "An analytical MOS transistor model valid in all regions of operation and dedicated to low-voltage and low-current applications," *Analog Integr. Circuits Signal Process.*, vol. 8, no. 1, pp. 83-114, Jul. 1995, doi: [10.1007/BF01239381](https://doi.org/10.1007/BF01239381).
13. B. Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed. New York, NY, USA: McGraw-Hill Education, 2017.
14. P. G. Drennan, M. L. Kniffin, and D. R. Locascio, "Implications of proximity effects for analog design," in *Proc. IEEE Custom Integr. Circuits Conf. (CICC)*, 2006, pp. 169-176, doi: [10.1109/CICC.2006.320869](https://doi.org/10.1109/CICC.2006.320869).
15. J. E. Stine *et al.*, "FreePDK: An open-source variation-aware design kit," in *Proc. IEEE Int. Conf. Microelectronic Systems Education (MSE)*, 2007, pp. 173-174, doi: [10.1109/MSE.2007.44](https://doi.org/10.1109/MSE.2007.44).
16. C. Galup-Montoro, M. C. Schneider, and R. M. Coitinho, "Resizing rules for MOS analog-design reuse," *IEEE Des. Test Comput.*, vol. 19, no. 2, pp. 50-58, 2002, doi: [10.1109/54.990442](https://doi.org/10.1109/54.990442).
17. M. Tian, V. Visvanathan, J. Hantgan, and K. Kundert, "Striving for small-signal stability," *IEEE Circuits Devices Mag.*, vol. 17, no. 1, pp. 31-41, Jan. 2001, doi: [10.1109/101.900125](https://doi.org/10.1109/101.900125).
18. H. E. Graeb, *Analog Design Centering and Sizing*. Dordrecht, The Netherlands: Springer, 2007, doi: [10.1007/978-1-4020-6004-5](https://doi.org/10.1007/978-1-4020-6004-5).
19. K. J. Antreich, H. E. Graeb, and C. U. Wieser, "Circuit analysis and optimization driven by worst-case distances," *IEEE Trans. Comput.-Aided Design Integr. Circuits Syst.*, vol. 13, no. 1, pp. 57-71, Jan. 1994, doi: [10.1109/43.273749](https://doi.org/10.1109/43.273749).
20. M. J. M. Pelgrom, A. C. J. Duinmaijer, and A. P. G. Welbers, "Matching properties of MOS transistors," *IEEE J. Solid-State Circuits*, vol. 24, no. 5, pp. 1433-1439, Oct. 1989, doi: [10.1109/JSSC.1989.572629](https://doi.org/10.1109/JSSC.1989.572629).
21. T. McConaghy, K. Breen, J. Dyck, and A. Gupta, *Variation-Aware Design of Custom Integrated Circuits: A Hands-on Field Guide*. New York, NY, USA: Springer, 2013, doi: [10.1007/978-1-4614-2269-3](https://doi.org/10.1007/978-1-4614-2269-3).
22. S. Sun, X. Li, H. Liu, K. Luo, and B. Gu, "Fast statistical analysis of rare circuit failure events via scaled-sigma sampling for high-dimensional variation space," *IEEE Trans. Comput.-Aided Design Integr. Circuits Syst.*, vol. 34, no. 7, pp. 1096-1109, Jul. 2015, doi: [10.1109/TCAD.2015.2404895](https://doi.org/10.1109/TCAD.2015.2404895).
23. C. Chiasson and V. Betz, "COFFE: Fully-automated transistor sizing for FPGAs," in *Proc. Int. Conf. Field-Programmable Technol. (FPT)*, 2013, pp. 34-41, doi: [10.1109/FPT.2013.6718327](https://doi.org/10.1109/FPT.2013.6718327).
24. J. Crossley *et al.*, "BAG: A designer-oriented integrated framework for the development of AMS circuit generators," in *Proc. IEEE/ACM Int. Conf. Comput.-Aided Design (ICCAD)*, 2013, pp. 74-81, doi: [10.1109/ICCAD.2013.6691100](https://doi.org/10.1109/ICCAD.2013.6691100).
25. E. Chang *et al.*, "BAG2: A process-portable framework for generator-based AMS circuit design," in *Proc. IEEE Custom Integr. Circuits Conf. (CICC)*, 2018, pp. 1-8, doi: [10.1109/CICC.2018.8357061](https://doi.org/10.1109/CICC.2018.8357061).
26. K. Kunal *et al.*, "ALIGN: Open-source analog layout automation from the ground up," in *Proc. 56th ACM/IEEE Design Autom. Conf. (DAC)*, 2019, pp. 1-4, doi: [10.1145/3316781.3323471](https://doi.org/10.1145/3316781.3323471).
27. H. Chen *et al.*, "MAGICAL: An open-source fully automated analog IC layout system from netlist to GDSII," *IEEE Des. Test*, vol. 38, no. 2, pp. 19-26, 2021, doi: [10.1109/MDAT.2020.3024153](https://doi.org/10.1109/MDAT.2020.3024153).
28. A. Hastings, *The Art of Analog Layout*, 2nd ed. Upper Saddle River, NJ, USA: Prentice Hall, 2005.
29. R. H. Lopez and A. T. Beck, "Reliability-based design optimization strategies based on FORM: A review," *J. Braz. Soc. Mech. Sci. Eng.*, vol. 34, no. 4, pp. 506-514, 2012, doi: [10.1590/S1678-58782012000400012](https://doi.org/10.1590/S1678-58782012000400012).
30. D. Mueller-Gritschneder and H. Graeb, "Computation of yield-optimized Pareto fronts for analog integrated circuit specifications," in *Proc. Design, Autom. Test Eur. Conf. (DATE)*, 2010, pp. 1088-1093, doi: [10.1109/DATE.2010.5456971](https://doi.org/10.1109/DATE.2010.5456971).
31. P. B. Y. Tan, A. V. Kordesch, and O. Sidek, "How to design for analog yield using Monte Carlo mismatch SPICE models," in *Proc. NSTI Nanotech Workshop on Compact Modeling*, 2005. [Online]. Available: https://briefs.techconnect.org/wp-content/volumes/Nanotech2005WCM/pdf/1031.pdf
32. J. E. Smith and R. L. Winkler, "The optimizer's curse: Skepticism and postdecision surprise in decision analysis," *Manage. Sci.*, vol. 52, no. 3, pp. 311-322, 2006, doi: [10.1287/mnsc.1050.0451](https://doi.org/10.1287/mnsc.1050.0451).
33. W.-K. Mak, D. P. Morton, and R. K. Wood, "Monte Carlo bounding techniques for determining solution quality in stochastic programs," *Oper. Res. Lett.*, vol. 24, no. 1-2, pp. 47-56, 1999, doi: [10.1016/S0167-6377(98)00054-6](https://doi.org/10.1016/S0167-6377%2898%2900054-6).
34. C. J. Clopper and E. S. Pearson, "The use of confidence or fiducial limits illustrated in the case of the binomial," *Biometrika*, vol. 26, no. 4, pp. 404-413, 1934, doi: [10.1093/biomet/26.4.404](https://doi.org/10.1093/biomet/26.4.404).
35. P. G. Drennan and C. C. McAndrew, "Understanding MOSFET mismatch for analog design," *IEEE J. Solid-State Circuits*, vol. 38, no. 3, pp. 450-456, Mar. 2003, doi: [10.1109/JSSC.2002.808305](https://doi.org/10.1109/JSSC.2002.808305).
36. H. Liu, S. Weber, and W. Zhang, "Efficient extraction of K-sigma corners from Monte Carlo simulation," U.S. Patent 9 805 158 B1, Oct. 31, 2017 (assigned to Cadence Design Systems). [Online]. Available: https://patents.google.com/patent/US9805158B1/en
37. J. A. Hanley and A. Lippman-Hand, "If nothing goes wrong, is everything all right? Interpreting zero numerators," *JAMA*, vol. 249, no. 13, pp. 1743-1745, 1983, doi: [10.1001/jama.1983.03330370053031](https://doi.org/10.1001/jama.1983.03330370053031).
38. Y. Pan, Z. He, N. Guo, and Z. Zhang, "Distributionally robust circuit design optimization under variation shifts," arXiv:2308.08111, Aug. 2023. [Online]. Available: https://arxiv.org/abs/2308.08111
39. K. Kundert and H. Chang, "Verification of complex analog integrated circuits," in *Proc. IEEE Custom Integr. Circuits Conf. (CICC)*, 2006, pp. 177-184, doi: [10.1109/CICC.2006.320883](https://doi.org/10.1109/CICC.2006.320883).
40. H. Chang and K. Kundert, "Introduction to analog verification," Designer's Guide Consulting, Oct. 2009. [Online]. Available: https://kenkundert.com/docs/av-intro.pdf
41. A. Pandey, M. Welponer, and G. Kowalczyk, "Power-aware verification in mixed-signal simulation," presented at DVCon Europe, 2014. [Online]. Available: https://dvcon-proceedings.org/wp-content/uploads/power-aware-verification-in-mixed-signal-simulation.pdf
42. Synopsys, "Model to hardware correlation," Silicon Lifecycle Management use-case datasheet. [Online]. Available: https://www.synopsys.com/content/dam/synopsys/solutions/slm/datasheets/slm-mhc-use-case-ds.pdf
43. C. C. McAndrew, I.-S. Lim, B. Braswell, and D. Garrity, "Corner models: Inaccurate at best, and it only gets worst...," in *Proc. IEEE Custom Integr. Circuits Conf. (CICC)*, 2013, pp. 1-4, doi: [10.1109/CICC.2013.6658428](https://doi.org/10.1109/CICC.2013.6658428).
44. B. Murmann, "Digitally assisted analog circuits," presented at Hot Chips 17, 2005. [Online]. Available: https://old.hotchips.org/wp-content/uploads/hc_archives/hc17/3_Tue/HC17.S5/HC17.S5T3.pdf
45. B. Murmann, "Digitally assisted analog circuits," *IEEE Micro*, vol. 26, no. 2, pp. 38-47, 2006, doi: [10.1109/MM.2006.33](https://doi.org/10.1109/MM.2006.33).
46. Analog Design Bench Team, "Long-horizon analog design bench: Benchmarking agents on hours-long analog and mixed-signal circuit design tasks," arXiv:2609.33356, Sep. 2026. [Online]. Available: https://arxiv.org/abs/2609.33356
