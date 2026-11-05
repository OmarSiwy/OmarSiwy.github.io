---
title: Layout Fundamentals
description: From polygons to masks - layers, design rules (width, spacing, enclosure, extension, density, antenna), DRC/LVS/PEX, pattern generation, and drawing a MOSFET with fingers, shared diffusions, gate and body contacts.
kind: topic
status: growing
aliases:
  - Layout Fundamentals
  - Analog Layout
  - Design Rules
  - Layout
---

Layout turns a schematic into the polygons that become photomasks. This note covers the drawing itself: what the layers are, the rules every polygon has to obey and where those rules come from, how software checks the result, how the data becomes a mask, and how to draw a MOSFET well. Matching patterns, guard rings, substrate noise and floorplanning each have their own note (links at the point of use).

## The big picture

```tikz title="Layer legend for every diagram in this note, and a PMOS drawn with it. Active is coloured by its implant (p+ orange for the PMOS, n+ green for the well tap); the n-well encloses both, poly crosses active to form the gate (W along the poly, L across it), contacts drop metal 1 onto source, drain, gate and a well tap. After Razavi Fig. 19.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  mtwo/.style={fill=violet!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black},
  well/.style={fill=cyan!18,draw=cyan!50!black,dashed,thick}]
  % legend (Layout-series legend from CMOS Processing)
  \node[anchor=west,font=\scriptsize\bfseries] at (-4.6,5.15) {legend};
  \draw[diff] (-4.5,4.5) rectangle (-4.0,4.8); \node[anchor=west,font=\scriptsize] at (-3.9,4.65) {n$^+$ diffusion (active)};
  \draw[pdiff] (-4.5,3.95) rectangle (-4.0,4.25); \node[anchor=west,font=\scriptsize] at (-3.9,4.1) {p$^+$ diffusion (active)};
  \draw[poly] (-4.5,3.4) rectangle (-4.0,3.7); \node[anchor=west,font=\scriptsize] at (-3.9,3.55) {polysilicon};
  \draw[mone] (-4.5,2.85) rectangle (-4.0,3.15); \node[anchor=west,font=\scriptsize] at (-3.9,3.0) {metal 1};
  \draw[mtwo] (-4.5,2.3) rectangle (-4.0,2.6); \node[anchor=west,font=\scriptsize] at (-3.9,2.45) {metal 2};
  \draw[ct] (-4.35,1.8) rectangle (-4.15,2.0); \node[anchor=west,font=\scriptsize] at (-3.9,1.9) {contact / via};
  \draw[well] (-4.5,1.2) rectangle (-4.0,1.5); \node[anchor=west,font=\scriptsize] at (-3.9,1.35) {n-well};
  \draw[fill=gray!45,draw=black!60] (-4.5,0.65) rectangle (-4.0,0.95); \node[anchor=west,font=\scriptsize] at (-3.9,0.8) {STI (cross-sections)};
  \draw[fill=orange!12,draw=black!60] (-4.5,0.1) rectangle (-4.0,0.4); \node[anchor=west,font=\scriptsize] at (-3.9,0.25) {p-substrate};
  % PMOS in n-well
  \draw[well] (0,0) rectangle (6.2,4.8);
  \node[anchor=north east,font=\scriptsize] at (6.15,4.75) {n-well};
  \draw[pdiff] (0.8,0.8) rectangle (3.6,3.2);
  \draw[poly] (2.0,0.35) rectangle (2.4,3.65);
  \draw[poly] (1.85,3.65) rectangle (2.55,4.35);
  \draw[diff] (4.7,0.8) rectangle (5.5,3.2);
  \foreach \y in {1.15,1.9,2.65} {
    \draw[ct] (1.2,\y) rectangle (1.4,{\y+0.2});
    \draw[ct] (3.0,\y) rectangle (3.2,{\y+0.2});
    \draw[ct] (5.0,\y) rectangle (5.2,{\y+0.2});
  }
  \draw[ct] (2.1,3.9) rectangle (2.3,4.1);
  \draw[mone] (1.05,0.95) rectangle (1.55,3.05);
  \draw[mone] (2.85,0.95) rectangle (3.35,3.05);
  \draw[mone] (4.85,0.95) rectangle (5.35,3.05);
  \draw[mone] (1.95,3.75) rectangle (2.45,4.25);
  \node[font=\scriptsize] at (1.3,-0.3) {S};
  \node[font=\scriptsize] at (3.1,-0.3) {D};
  \node[anchor=west,font=\scriptsize] at (2.6,4.0) {G};
  \node[font=\scriptsize] at (5.1,-0.3) {n$^+$ well tap (B)};
  \draw[<->] (-0.3,0.8) -- (-0.3,3.2) node[midway,left,font=\scriptsize] {$W$};
  \draw[densely dotted] (-0.4,0.8) -- (0.8,0.8);
  \draw[densely dotted] (-0.4,3.2) -- (0.8,3.2);
  \draw[<->] (2.0,0.12) -- (2.4,0.12);
  \node[font=\scriptsize] at (2.62,0.12) {$L$};
\end{circuitikz}
\end{document}
```

```tikz title="The layout loop. Draw, then three checks, each with its own way of failing back: DRC (geometry against the rule deck), LVS (does the layout's netlist equal the schematic's?), PEX plus post-layout simulation (does it still meet spec with wire and junction parasitics?). Only then does pattern generation turn the layers into masks. After Hastings Secs. 3.2, 3.3, 15.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,rounded corners=3pt,align=center,minimum height=1.0cm,minimum width=2.0cm,font=\scriptsize}}
  \node[blk] (sch) at (0,0) {schematic\\+ simulation};
  \node[blk] (lay) at (3.3,0) {layout editor\\(Pcells, hierarchy)};
  \node[blk] (drc) at (6.8,0) {DRC\\geometry vs.\ rule deck};
  \node[blk] (lvs) at (10.4,0) {LVS\\layout net = sch.\ net?};
  \node[blk] (pex) at (10.4,-2.6) {PEX\\add wire/junction $R$, $C$};
  \node[blk] (post) at (7.0,-2.6) {post-layout\\simulation};
  \node[blk] (pg) at (3.5,-2.6) {pattern generation\\combine, size, OPC, fracture};
  \node[blk] (mask) at (0,-2.6) {mask shop\\$\to$ reticles};
  \draw[->,thick] (sch) -- (lay);
  \draw[->,thick] (lay) -- (drc);
  \draw[->,thick] (drc) -- (lvs);
  \draw[->,thick] (lvs) -- (pex);
  \draw[->,thick] (pex) -- (post);
  \draw[->,thick] (post) -- node[above,font=\scriptsize]{pass} (pg);
  \draw[->,thick] (pg) -- (mask);
  \draw[->,red!70!black] (drc.north) to[out=135,in=45] node[above,font=\scriptsize]{violations} ([xshift=0.4cm]lay.north);
  \draw[->,red!70!black] (lvs.north) to[out=140,in=40] node[above,font=\scriptsize]{shorts, opens, wrong $W/L$} ([xshift=-0.4cm]lay.north);
  \draw[->,red!70!black] (post.north west) -- node[left,font=\scriptsize,pos=0.4]{misses spec} (sch.south east);
\end{circuitikz}
\end{document}
```

> [!important] The five things to remember
> 1. **You draw layers; the fab needs masks.** Pattern generation combines, sizes and inverts drawn layers into mask data. Many layers you draw (NMoat, active, tap) are *coding layers*, not masks.
> 2. **Every rule is a tolerance stack:** drawn dimension ≥ the dimension that must survive + worst-case linewidth error + misalignment + outdiffusion + depletion. Four families: **width, spacing, enclosure, extension**, plus whole-chip rules for **density** and **antenna**.
> 3. **Verification has three stages, in order:** DRC (manufacturable?), LVS (the circuit you meant?), PEX + post-layout sim (does it still work with the parasitics?). LVS topological errors are never waived.
> 4. **Drawing a MOSFET:** $W$ is where poly crosses active, $L$ is the poly width. Split wide devices into fingers (gate resistance falls as $1/N^2$, drain cap roughly halves), share diffusions between series devices, contact the gate off the active area, and keep every point of the device close to a body contact.
> 5. **The surroundings are part of the device.** STI stress and well proximity shift $V_{TH}$ and $\mu$ near active and well edges: add dummy fingers and keep matched PMOS a few µm inside the well ([[Device Matching]] has the numbers).

**Map:** [[#Level 0 Layers, Masks and the Layout Database|layers and data]] → [[#Level 1 Design Rules|design rules]] → [[#Level 2 Verification and Mask Making|DRC, LVS, PEX, pattern generation]] → [[#Level 3 Drawing the MOSFET|drawing the MOSFET]] → [[#Level 4 The Neighbourhood Is Part of the Device|layout-dependent effects]].

> [!tip] Remark
> The process steps each mask drives (well implant, STI, gate, S/D implant, contact, metal) are in [[CMOS Processing]], whose first diagram is the full inverter cross-section and the colour legend this note uses (n+ green, p+ orange, poly red, M1 blue, M2 purple, contacts black, n-well cyan dashed, STI grey, p-sub peach; in top views active takes its implant's colour). This note starts from "a mask exists for each of those steps".

## Level 0: Layers, Masks and the Layout Database

### What you draw vs. what becomes a mask

The simplest n-well CMOS process needs eight masks: **n-well, (inverse) moat/active, poly, NSD, PSD, contact, metal, protective-overcoat removal (POR)**. Each added metal level adds a via mask and a metal mask.

```tikz title="Coding layers. The designer draws one NMoat shape plus poly; the pattern-generation deck derives three masks from it: NSD (NMoat oversized to cover misalignment), Moat (NMoat OR PMoat), and InvMoat (the colour reversal, a dark-field mask). After Hastings Sec. 12.2.1, Fig. 12.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sel/.style={draw=orange!80!black,densely dotted,thick}]
  % drawn
  \draw[diff] (0,0.5) rectangle (2.2,2.5);
  \draw[poly] (0.9,0) rectangle (1.3,3.0);
  \node[align=center,font=\scriptsize] at (1.1,-0.55) {drawn:\\NMoat + poly};
  \draw[->,thick] (2.6,1.5) -- (3.6,1.5) node[midway,above,font=\scriptsize]{PG deck};
  % NSD
  \begin{scope}[xshift=4.0cm]
    \draw[green!45!black,densely dashed] (0,0.5) rectangle (2.2,2.5);
    \draw[sel,fill=orange!15] (-0.3,0.2) rectangle (2.5,2.8);
    \draw[green!45!black,densely dashed] (0,0.5) rectangle (2.2,2.5);
    \node[align=center,font=\scriptsize] at (1.1,-0.55) {NSD =\\NMoat oversized};
  \end{scope}
  % Moat
  \begin{scope}[xshift=7.3cm]
    \draw[diff] (0,0.5) rectangle (2.2,2.5);
    \node[align=center,font=\scriptsize] at (1.1,-0.55) {Moat =\\NMoat + PMoat};
  \end{scope}
  % InvMoat
  \begin{scope}[xshift=10.4cm]
    \fill[gray!70] (-0.4,0) rectangle (2.6,3.0);
    \fill[white] (0,0.5) rectangle (2.2,2.5);
    \draw (0,0.5) rectangle (2.2,2.5);
    \node[align=center,font=\scriptsize] at (1.1,-0.55) {InvMoat = NOT Moat\\(dark field)};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Layer type | Drawn by you? | Becomes a mask directly? | Examples |
|---|---|---|---|
| Mask layer | yes | yes, one-to-one | poly, contact, metal |
| Coding (drawing) layer | yes | no, transformed by the PG deck | NMoat/PMoat; active + tap |
| Generated layer | no | yes | NSD, PSD, InvMoat |
| Pseudolayer | yes | never | markers telling DRC/LVS what a region is (resistor body, dummy, voltage class) |

> [!tip] Remark
> Which physical step each drawn layer ends up driving (NWELL → well implant, ACTIVE → STI trench, POLY → gate etch, …) is tabulated in [[CMOS Processing#From Drawn Layers to Masks]]. Here the question is only how the data gets from your layers to those masks.

> [!note]- Detail: three ways to code the same NMOS, and the clipping problem
> - **Mask layers** (moat, NSD, PSD drawn explicitly): most shapes, no surprises.
> - **NMoat / PMoat**: one shape makes both moat and its select. The deck is
>   `PSD = PMoat oversized by 1.0`, `NSD = NMoat oversized by 1.0`, `Moat = NMoat + PMoat`, `InvMoat = Moat\`.
>   Abutting NMoat and PMoat (a butting tap) then gives *overlapping* NSD and PSD that must be clipped (`PSD = PSD not common to NMoat`, and vice versa); simple clipping leaves slivers outside moat, and "even the most sophisticated clipping routines sometimes produce questionable results."
> - **Active + tap**: active is moat; the select type follows the well (PSD inside n-well, NSD outside); drawing *tap* over active flips it. If tap extends past active by more than the S/D oversize, no clipping is needed.
>
> Razavi notes the same thing from the user side: in modern tools the implants and even the wells are generated from the device geometry, so you draw fewer layers. (Hastings Sec. 12.2.1; Razavi Sec. 19.1.)

### The layout database

```tikz title="Paths (left): a centerline plus a width; the end style changes the drawn length by half a width at each end. Orientations (right): the eight Manhattan transforms of an instance, shown on a cell holding an F whose lower-left corner is the origin (diamond). After Hastings Figs. 3.5, 3.6."
\usepackage{circuitikz}
\newcommand{\Fshape}{\draw[fill=blue!55,draw=black!70] (0,0) -- (0.2,0) -- (0.2,0.4) -- (0.45,0.4) -- (0.45,0.58) -- (0.2,0.58) -- (0.2,0.82) -- (0.55,0.82) -- (0.55,1.0) -- (0,1.0) -- cycle; \draw[fill=white] (-0.07,0) -- (0,0.07) -- (0.07,0) -- (0,-0.07) -- cycle;}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \c/\t/\y in {butt/flush (type 0)/2.6, rect/extended (type 2)/1.3, round/rounded (type 1)/0} {
    \draw[line width=9pt,blue!40,line cap=\c,line join=miter] (0,\y) -- (1.6,\y) -- (1.6,{\y+0.8});
    \draw[densely dashed] (0,\y) -- (1.6,\y) -- (1.6,{\y+0.8});
    \fill (0,\y) circle (1.2pt); \fill (1.6,\y) circle (1.2pt); \fill (1.6,{\y+0.8}) circle (1.2pt);
    \node[anchor=west,font=\scriptsize] at (2.0,{\y+0.3}) {\t};
  }
  \begin{scope}[xshift=5.6cm,yshift=2.3cm]
    \foreach \x/\y/\t in {0/0/R0, 2.4/0/R90, 4.8/0/R180, 7.2/0/R270, 0/-3.0/MX, 2.4/-3.0/MY, 4.8/-3.0/MX90, 7.2/-3.0/MY90} {
      \draw[gray!50] ({\x-1.05},\y) -- ({\x+1.05},\y); \draw[gray!50] (\x,{\y-1.05}) -- (\x,{\y+1.05});
      \node[font=\scriptsize] at (\x,{\y-1.35}) {\t};
    }
    \begin{scope}[shift={(0,0)}] \Fshape \end{scope}
    \begin{scope}[shift={(2.4,0)},rotate=90] \Fshape \end{scope}
    \begin{scope}[shift={(4.8,0)},rotate=180] \Fshape \end{scope}
    \begin{scope}[shift={(7.2,0)},rotate=270] \Fshape \end{scope}
    \begin{scope}[shift={(0,-3.0)},yscale=-1] \Fshape \end{scope}
    \begin{scope}[shift={(2.4,-3.0)},xscale=-1] \Fshape \end{scope}
    \begin{scope}[shift={(4.8,-3.0)},rotate=90,yscale=-1] \Fshape \end{scope}
    \begin{scope}[shift={(7.2,-3.0)},rotate=90,xscale=-1] \Fshape \end{scope}
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Coordinates are integers.** You type user units (µm); the editor stores database units (DBU = UU × DBU/UU ratio, e.g. 1000). Converting a database to a finer ratio is safe only by an integer factor. Keep every vertex on the **minimum grid** (the coding increment) set in the tech file.
- **Shapes:** rectangles, polygons, paths, (circles). Use orthogonal ("Manhattan") geometry unless the process says otherwise. **No self-intersecting polygons and no acute angles.** Path widths should be multiples of twice the coding increment so both edges land on grid.
- **Hierarchy:** a cell holds shapes and *instances* of other cells; the root is the top cell. Editing a cell edits every instance of it.
- **Pins** carry net names; LVS matches them to the schematic's pins (case-sensitive).
- **Pcells** generate a device from parameters ($W$, $L$, fingers); a tested Pcell always passes DRC. Start from the Pcell closest to what you want, then explode and edit only if it really costs performance.

> [!note]- Detail: interchange formats (CIF, GDSII, OASIS)
> | | CIF | GDSII stream | OASIS |
> |---|---|---|---|
> | Encoding | text | binary | binary, compressed, delta-coded |
> | Units | µm at 100 DBU/UU, fixed | user and database unit stored in metres | any DBU/UU |
> | Layers | by name | number 0–63 + datatype 0–63 (tools extend to 255, Cadence to 32 767); no names, needs a map file | number + datatype, unlimited |
> | Shapes | box, polygon, circle ("flash"), wire | boundary (≤200 vertices; Cadence 8000), path types 0–3, text; no circles | rectangles, polygons, circles, paths, trapezoids, repetitions |
> | Instances | any-angle rotation | any angle + magnification (most tools only honour Manhattan) | any angle + magnification, repetition patterns |
>
> GDSII (Calma, Release 6.0, 1982) is the de-facto standard; OASIS (SEMI, 2001+) aims for about 10× smaller files. Pcells do not survive translation: each instance is exploded into a plain cell. (Hastings Secs. 3.1.1–3.1.5.)

> [!note]- Detail: clear vs. dark masks
> Positive resist dissolves where light hits it; negative resist stays where light hits it. Whether the mask is a copy of your polygons (clear field: opaque shapes on clear glass) or its colour reversal (dark field) depends on both:
>
> | Layout polygons represent… | positive resist | negative resist |
> |---|---|---|
> | openings in resist (contacts, windows) | dark mask | clear mask |
> | material that stays (metal lines, poly) | clear mask | dark mask |
>
> The PG deck chooses this per layer; you always draw the "obvious" shape. (Hastings Table 3.3.)

## Level 1: Design Rules

### The four families

```tikz title="Each rule (top) and the failure it prevents (bottom). Width: a narrow line necks and opens or becomes resistive. Spacing: a narrow gap bridges and shorts. Enclosure: a contact must stay inside both the poly and the metal after misalignment. Extension: gate poly must run past active, or the S/D implant goes around the end of the gate and shorts source to drain. After Razavi Figs. 19.2-19.6 and Carusone Fig. 2.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black}]
  \node[rotate=90,font=\small] at (-0.6,3.8) {rule};
  \node[rotate=90,font=\small] at (-0.6,1.2) {violation};
  \draw[gray] (-0.3,2.5) -- (13.4,2.5);
  % width
  \draw[poly] (1.0,2.9) rectangle (1.4,4.8);
  \draw[<->] (1.0,3.6) -- (1.4,3.6);
  \node[anchor=east] at (0.95,3.6) {$W_{min}$};
  \node at (1.2,5.15) {\small width};
  \draw[poly] (1.1,0.2) -- (1.3,0.2) -- (1.3,0.9) -- (1.23,1.2) -- (1.3,1.5) -- (1.3,2.2) -- (1.1,2.2) -- (1.1,1.5) -- (1.17,1.2) -- (1.1,0.9) -- cycle;
  \draw[->,red!70!black] (2.0,1.2) -- (1.35,1.2);
  \node[anchor=west,align=left] at (1.9,1.2) {necks:\\open or\\high $R$};
  % spacing
  \begin{scope}[xshift=3.4cm]
    \draw[poly] (0.6,2.9) rectangle (1.0,4.8);
    \draw[poly] (1.7,2.9) rectangle (2.1,4.8);
    \draw[<->] (1.0,3.6) -- (1.7,3.6) node[midway,above] {$S_{min}$};
    \node at (1.35,5.15) {\small spacing};
    \draw[poly] (0.6,0.2) rectangle (1.0,2.2);
    \draw[poly] (1.2,0.2) rectangle (1.6,2.2);
    \draw[poly] (1.0,1.0) rectangle (1.2,1.35);
    \node[anchor=west,align=left] at (1.75,1.2) {bridge:\\short};
  \end{scope}
  % enclosure
  \begin{scope}[xshift=6.8cm]
    \draw[poly] (0.3,2.9) rectangle (2.1,4.7);
    \draw[mone] (0.65,3.25) rectangle (1.75,4.35);
    \draw[ct] (1.0,3.6) rectangle (1.4,4.0);
    \draw[<->] (1.4,3.8) -- (1.75,3.8);
    \node[anchor=west] at (2.15,4.2) {$E_1$ metal};
    \draw (1.6,3.8) -- (2.15,4.2);
    \draw[<->] (1.4,3.45) -- (2.1,3.45);
    \node[anchor=west] at (2.15,3.3) {$E_2$ poly};
    \node at (1.2,5.15) {\small enclosure};
    \draw[poly] (0.3,0.3) rectangle (2.1,2.1);
    \draw[mone] (0.65,0.65) rectangle (1.75,1.75);
    \draw[ct] (1.55,1.0) rectangle (1.95,1.4);
    \node[anchor=west,align=left] at (2.15,1.2) {contact\\outside\\metal: open};
  \end{scope}
  % extension
  \begin{scope}[xshift=10.6cm]
    \draw[diff] (0.2,3.2) rectangle (2.2,4.3);
    \draw[poly] (1.0,2.75) rectangle (1.4,4.75);
    \draw[<->] (1.6,4.3) -- (1.6,4.75);
    \node[anchor=west] at (1.65,4.55) {$X_{ext}$};
    \node at (1.2,5.15) {\small extension};
    \draw[diff] (0.2,0.6) rectangle (2.2,1.7);
    \draw[poly] (1.0,0.3) rectangle (1.4,1.5);
    \draw[->,red!70!black] (1.2,2.15) -- (1.2,1.62);
    \node[align=center] at (1.2,2.3) {S--D short};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Family | What it constrains | Typical example |
|---|---|---|
| **Width** | smallest dimension of one shape | poly, metal, contact (often `exact`: only one contact size allowed) |
| **Spacing** | gap between shapes, same or different layer | poly–poly, metal–metal, active–poly, n-active to n-well |
| **Enclosure** (overlap) | how far shape A must surround B | metal and active around a contact; well around p+ active |
| **Extension** (overhang) | how far A must stick out past B | gate poly past active |

Plus **maximum** rules: wide metal may need slots or a larger spacing; antenna and density limits apply to whole nodes and whole tiles (below). A modern process has several hundred rules.

### Where the numbers come from

$$
\boxed{D_{\text{drawn}} \;\ge\; D_{\text{must survive}} \;+\; \sum_k \Delta_k^{\max}}
$$

The $\Delta_k$ are worst-case edge movements. Hastings's rules of thumb: **linewidth control ≈ 10 %** of the minimum feature; **mask misalignment ≈ 20 %** of the minimum feature; **two misalignments ≈ 160 %** of one (partly random, so not 200 %); **lateral outdiffusion ≈ 80 %** of junction depth; add **≥ 50 %** margin to tabulated depletion widths.

> [!tip] Remark
> The misalignment terms are the overlay budget of [[CMOS Processing#Resolution, Depth of Focus and Overlay]], where independent mask errors add as $\sigma_{tot}=\sqrt{\sum\sigma_i^2}$ (141 % for two). Hastings's 160 % sits between that and a straight sum (200 %) because run-out is partly systematic. Outdiffusion is the lateral spread in [[CMOS Processing#Diffusion and Ion Implantation]].

```tikz title="Building the NDIF-to-NDIF spacing rule of Hastings's example process (x_j = 1 um, P-epi 1e16, 10 V): two outdiffusions of 0.8 um, two depletion widths of 2 um (1.5 um plus margin, rounded), 0.2 um linewidth control. Rule = 5.8 um; at 20 V it becomes 7.8 um. After Hastings Sec. 3.2.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \fill[orange!12] (0,-1.4) rectangle (8.8,2.4);
  \node[anchor=south west] at (0.05,-1.4) {P-epi};
  % depletion regions
  \draw[densely dashed,fill=yellow!20] (0,2.4) -- (4.3,2.4) arc[start angle=0,end angle=-90,x radius=2.8,y radius=3.0] -- (0,-0.6);
  \draw[densely dashed,fill=yellow!20] (8.8,2.4) -- (4.5,2.4) arc[start angle=180,end angle=270,x radius=2.8,y radius=3.0] -- (8.8,-0.6);
  % diffusions
  \draw[fill=green!45,draw=black!60] (0,2.4) -- (2.3,2.4) arc[start angle=0,end angle=-90,x radius=0.8,y radius=1.0] -- (0,1.4) -- cycle;
  \draw[fill=green!45,draw=black!60] (8.8,2.4) -- (6.5,2.4) arc[start angle=180,end angle=270,x radius=0.8,y radius=1.0] -- (8.8,1.4) -- cycle;
  \node at (0.7,1.9) {N+};
  \node at (8.1,1.9) {N+};
  \node at (2.2,0.0) {depletion};
  % oxide with windows
  \draw[line width=2pt,gray!60!black] (1.5,2.45) -- (7.3,2.45);
  % dimension chain
  \foreach \a/\b/\t in {1.5/2.3/0.8, 2.3/4.3/2.0, 4.5/6.5/2.0, 6.5/7.3/0.8} {
    \draw[<->] (\a,2.85) -- (\b,2.85) node[midway,above] {\t};
  }
  \draw[densely dotted] (4.3,2.4) -- (4.3,3.4);
  \draw[densely dotted] (4.5,2.4) -- (4.5,3.4);
  \node at (4.4,3.55) {0.2};
  \draw[densely dotted] (1.5,2.4) -- (1.5,4.0);
  \draw[densely dotted] (7.3,2.4) -- (7.3,4.0);
  \draw[<->,thick] (1.5,3.95) -- (7.3,3.95) node[midway,above] {NDIF spacing to NDIF $= 5.8$ µm};
  \node[align=center] at (1.5,4.65) {drawn\\edge};
  \node[align=center] at (7.3,4.65) {drawn\\edge};
\end{circuitikz}
\end{document}
```

> [!note]- Worked example: the full rule set of Hastings's four-mask process
> Equipment: 0.8 µm features, 0.1 µm linewidth control per geometry (0.2 µm for two), 0.2 µm misalignment. NDIF: phosphorus, $x_j = 1.0$ µm, into $10^{16}$ cm⁻³ P-epi.
>
> | Rule | Value | Built from |
> |---|---|---|
> | NDIF width | 2.0 µm | 0.8 µm would print, but widths below ~2 $x_j$ suffer dilution |
> | NDIF spacing to NDIF | 5.8 µm (10 V), 7.8 µm (20 V) | 2×0.8 outdiffusion + 2×2 (or 2×3) depletion + 0.2 linewidth |
> | CONT width | 1.0 µm exact | aluminium does not fill openings much below 1 µm; one size keeps etch bias uniform |
> | CONT spacing to CONT | 1.0 µm | 0.8 feature + 0.2 linewidth |
> | NDIF overlap CONT | 0.4 µm | 0 + 0.2 linewidth + 0.2 misalignment |
> | METAL width, spacing | 1.8 µm, 1.8 µm | thick metal over topography ≈ 2× feature (1.6) + 0.2 |
> | METAL overlap CONT | 0.4 µm | metal must seal the contact: 0 + 0.2 + 0.2 |
> | POR width | 10 µm | wet etch; pads are > 50 µm anyway |
> | POR spacing to POR | 4.2 µm | 2 µm overcoat + 2×1.0 overetch + 0.2 |
> | METAL overlap POR | 1.4 µm | 1.0 overetch + 0.2 + 0.2 |
>
> (Hastings Sec. 3.2.3, pp. 136–142.) The table of depletion widths it uses is Hastings Table 3.1.

> [!note]- Detail: process bias, OPC sizing and "drawn vs silicon" dimensions
> Etching enlarges openings systematically (*process bias*, ≲ 10 % of layer thickness for dry etch). Rather than folding this into the rules, fabs apply a **process size adjust** during pattern generation (e.g. metal oversized 0.05 µm per side), so a 1 µm drawn line is 1 µm on silicon, and the adjust can be retuned without touching your layout. Carusone's example: you draw $L = 0.1$ µm, the mask gets 0.12 µm to cover lateral diffusion and poly etch loss.
>
> Older analog processes used a 90 % optical shrink, so layouts had *drawn* and *silicon* dimensions that differed by 10 %. A capacitance per µm² quoted in the wrong one is a ~20 % error. Modern rules are in silicon µm. (Hastings pp. 138, 142–143; Carusone Sec. 2.2.1.)

### λ rules: a minimum transistor

Scalable (Mead–Conway) rules write every dimension as a multiple of $\lambda$, half the minimum gate length. Real analog processes use absolute µm rules, but λ rules make the structure of a transistor easy to see and give quick parasitic estimates.

```tikz title="Left: the minimum contacted transistor in lambda rules. Gate 2 lambda; poly extends 2 lambda past active; contacts 2 lambda, enclosed by 1 lambda of active, kept 2 lambda from the gate; so active extends 5 lambda past the gate. Right: an n-well must enclose p+ active by 3 lambda and keep 5 lambda from n+ active, so PMOS and NMOS sit at least 8 lambda apart. After Carusone Figs. 2.14, 2.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  ct/.style={fill=black},
  well/.style={fill=cyan!18,draw=cyan!50!black,dashed,thick}]
  \begin{scope}[scale=0.36]
    \draw[diff] (0,0) rectangle (12,6);
    \draw[poly] (5,-2) rectangle (7,8);
    \draw[ct] (1,2) rectangle (3,4);
    \draw[ct] (9,2) rectangle (11,4);
    \draw[<->] (0,9.3) -- (5,9.3) node[midway,above] {$5\lambda$};
    \draw[<->] (5,9.3) -- (7,9.3) node[midway,above] {$2\lambda$};
    \draw[densely dotted] (0,6) -- (0,9.6); \draw[densely dotted] (5,8) -- (5,9.6); \draw[densely dotted] (7,8) -- (7,9.6);
    \draw[<->] (7.6,6) -- (7.6,8) node[midway,right] {$2\lambda$ ext.};
    \draw[<->] (0,-1.0) -- (1,-1.0); \node at (0.5,-2.0) {$\lambda$};
    \draw[<->] (1,-1.0) -- (3,-1.0); \node at (2,-2.0) {$2\lambda$};
    \draw[<->] (3,-1.0) -- (5,-1.0); \node at (4,-2.0) {$2\lambda$};
    \draw[<->] (-1.0,0) -- (-1.0,6) node[midway,left] {$W$};
    \node at (6,-3.6) {contact $\lambda$ in active, $2\lambda$ from gate};
  \end{scope}
  \begin{scope}[xshift=5.6cm,scale=0.36]
    \draw[well] (0,-1) rectangle (9,7);
    \node[anchor=north west] at (0,7) {n-well};
    \draw[pdiff] (3,0) rectangle (6,6); \node at (4.5,3) {p$^+$};
    \draw[diff] (14,0) rectangle (17,6); \node at (15.5,3) {n$^+$};
    \draw[<->] (6,8.3) -- (9,8.3) node[midway,above] {$3\lambda$};
    \draw[<->] (9,8.3) -- (14,8.3) node[midway,above] {$5\lambda$};
    \draw[densely dotted] (6,6) -- (6,8.6); \draw[densely dotted] (9,7) -- (9,8.6); \draw[densely dotted] (14,6) -- (14,8.6);
    \draw[<->,thick] (6,-2.3) -- (14,-2.3) node[midway,below] {PMOS--NMOS $\ge 8\lambda$};
    \draw[densely dotted] (6,0) -- (6,-2.6); \draw[densely dotted] (14,0) -- (14,-2.6);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{A_S = A_D \approx 5\lambda W,\qquad P_S = P_D \approx 10\lambda + W}
$$

for a contacted junction (the perimeter leaves out the gate edge, which has no field implant and little sidewall cap). These feed $AS, AD, PS, PD$ in the SPICE card before layout exists.

> [!tip] Remark
> These areas and perimeters set $C_{SB}$ and $C_{DB}$ through $C_j\cdot A + C_{jsw}\cdot P$ in [[MosFETs#Capacitances]]. Every trick in [[#Level 3 Drawing the MOSFET|Level 3]] is a way to shrink $A$ and $P$ on the node that matters.

> [!note]- Why: the n-well needs more room from n+ than from p+
> The well diffuses far sideways, and an NMOS junction shorted to the n-well (at $V_{DD}$) kills the circuit, so n+ active must stay 5λ away. A p+ substrate tie can sit much closer (~2λ) because it is at ground and separated from the well by a reverse-biased junction. Carusone's λ rules assume ≤ 0.75λ misalignment per mask, so ≤ 1.5λ between two masks; a 2λ separation between shapes that would short if they touched is therefore always safe. (Carusone Sec. 2.2.1.)

### Density (fill) rules

```tikz title="Density is checked per tile. A tile with one isolated wire (left) polishes unevenly under CMP and blurs in shallow-depth-of-focus lithography; fill shapes bring it into the allowed window (right). Block fill over sensitive devices and keep it a controlled distance from analog nets. After Carusone Sec. 2.2.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  mone/.style={fill=blue!55,draw=black!70},
  dum/.style={fill=blue!25,draw=black!50}]
  \draw[thick] (0,0) rectangle (4,4);
  \draw[mone] (0.4,1.8) rectangle (3.6,2.2);
  \node[align=center] at (2,-0.55) {M1 density $\approx 8\,\%$: below minimum\\(e.g.\ rule: 10--35 \%)};
  \begin{scope}[xshift=5.4cm]
    \draw[thick] (0,0) rectangle (4,4);
    \draw[mone] (0.4,1.8) rectangle (3.6,2.2);
    \foreach \x in {0.3,1.0,1.7,2.4,3.1} { \foreach \y in {0.3,0.9,2.7,3.3} { \draw[dum] (\x,\y) rectangle ({\x+0.4},{\y+0.35}); } }
    \fill[white] (2.3,2.55) rectangle (3.95,3.95);
    \draw[thick,densely dashed,orange!80!black] (2.3,2.55) rectangle (3.95,3.95);
    \node[align=center,orange!60!black] at (3.12,3.25) {fill block\\(sensitive\\device)};
    \draw[thick] (0,0) rectangle (4,4);
    \node[align=center] at (2,-0.55) {dummy fill added: density in window,\\blocked where it would add parasitics};
  \end{scope}
\end{circuitikz}
\end{document}
```

- CMP polishes high spots first, so a tile's thickness tracks its pattern density ([[CMOS Processing#Planarization (CMP) and Dummy Fill]]); shallow depth of focus then blurs whatever is out of plane.
- Rules bound the fraction of each **tile** covered by each layer (Carusone's example: 10–35 % for metal 1 over the chip), and tighten with every node.
- Analog layouts are dominated by large passives that leave layers empty, so they need fill. Tools insert it automatically; **check where it lands**: fill near a capacitor, inductor or high-impedance node is a parasitic you did not simulate. Put fill-block layers over devices that must not see it (see [[Inductor]] and [[Capacitor]] for the device-specific rules).

### Antenna rules

```tikz title="Antenna effect. (a) During metal-1 etch the large M1 plate is already tied to the gate; it collects plasma charge and drives it through the thin gate oxide. (b) Break the M1 and rejoin it in M2, so the plate is not on the gate while M1 is etched. (c) Or give the charge a path: a reverse-biased n+/p-sub antenna diode on the node. After Razavi Fig. 19.8, Carusone Fig. 2.19, Hastings Sec. 5.1.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  ct/.style={fill=black}]
  \foreach \s in {0,4.7,9.4} {
    \begin{scope}[xshift=\s cm]
      \fill[orange!12] (0,0) rectangle (4,1);
      \node[anchor=south west] at (0,0) {p-sub};
      \draw[fill=orange!60] (2.8,1.0) rectangle (3.4,1.07);
      \draw[poly] (2.8,1.07) rectangle (3.4,1.4);
      \draw[ct] (3.0,1.4) rectangle (3.2,2.0);
    \end{scope}
  }
  % (a)
  \draw[mone] (0.2,2.0) rectangle (3.6,2.3);
  \foreach \x in {0.4,0.9,1.4,1.9,2.4,2.9,3.4} { \node[red!70!black] at (\x,2.45) {$+$}; }
  \foreach \x in {0.6,1.6,2.6} { \draw[->,gray] (\x,3.4) -- (\x,2.65); }
  \node at (1.6,3.6) {plasma};
  \draw[->,red!70!black,thick] (3.1,1.95) -- (3.1,1.05);
  \node[anchor=west,align=left,red!70!black] at (3.45,0.6) {oxide\\damage};
  \node[font=\small] at (2.0,-0.45) {(a) vulnerable};
  % (b)
  \begin{scope}[xshift=4.7cm]
    \draw[mone] (0.2,2.0) rectangle (2.3,2.3);
    \draw[mone] (2.8,2.0) rectangle (3.6,2.3);
    \draw[ct] (0.6,2.3) rectangle (0.8,2.8);
    \draw[ct] (3.0,2.3) rectangle (3.2,2.8);
    \draw[mtwo] (0.4,2.8) rectangle (3.5,3.1);
    \node[anchor=south] at (1.95,3.1) {M2 joins later};
    \node[align=center] at (1.25,1.55) {plate floats\\during M1 etch};
    \node[font=\small] at (2.0,-0.45) {(b) M2 jumper};
  \end{scope}
  % (c)
  \begin{scope}[xshift=9.4cm]
    \draw[fill=green!45,draw=black!60] (0.5,0.75) rectangle (1.3,1.0);
    \node[font=\tiny] at (0.9,0.875) {n$^+$};
    \draw[ct] (0.8,1.0) rectangle (1.0,2.0);
    \draw[mone] (0.2,2.0) rectangle (3.6,2.3);
    \draw[->,green!40!black,thick] (1.15,1.95) -- (1.15,1.1);
    \node[anchor=west,align=left] at (1.25,1.5) {charge\\drains};
    \node[font=\small] at (2.0,-0.45) {(c) antenna diode};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{AR_{\text{periph}} = \frac{\text{perimeter of layer } X \text{ on the node}}{\text{gate-oxide area on the node}},\qquad AR_{\text{area}} = \frac{\text{area of layer } X \text{ on the node}}{\text{gate-oxide area on the node}}}
$$

- Plasma etch and ashing deposit charge on exposed conductors; a conductor connected to a gate injects it through the oxide. That causes breakdown or, below that, a $V_{TH}$ shift from trapped charge.
- Etch damage scales with the exposed **perimeter**, ashing damage with the **area**. Hastings's typical poly limits: $AR_{\text{periph}} \approx 100$ µm⁻¹, $AR_{\text{area}} \approx 500$. Each conductor layer has its own pair, evaluated over the whole electrically connected node *as it exists at that layer's etch*.
- **Fixes:** jumper up a layer next to the gate (break long poly with an M1 jumper; break M1 with M2); add an antenna diode. A violation on the **top** metal cannot be jumpered; it needs a diode.

> [!note]- Detail: why a diode works, and its fine print
> An NSD/p-substrate diode clamps negative excursions to a diode drop. It clamps positive ones only by avalanche, which is too high for ≤ 3.3 V oxides. Hastings: connecting the node to *both* an NSD/substrate diode and a PSD/n-well diode protects it; the n-well/substrate junction leaks heavily during plasma processing because the plasma's UV light generates carriers in it. So the PSD antenna diode must not be covered by metal, poly or dummy fill (draw fill-block over it). Many decks first check metal/gate ratios and then forgive nodes that pass a metal/diffusion ratio. In operation the diode is reverse-biased and costs only its junction capacitance. (Hastings pp. 227–229; Carusone Sec. 2.2.3.)

## Level 2: Verification and Mask Making

### How a checker sees layers: geometric operations

```tikz title="DRC and LVS decks build new layers from drawn ones before checking anything. With MOAT (active) and POLY: the union, GATE = POLY AND MOAT (the channel: this is how LVS finds transistors), S/D = MOAT minus POLY, FIELDPOLY = POLY minus MOAT, and XOR. Dashed outlines are the inputs; grey is the result. After Hastings Figs. 3.9-3.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \tikzset{res/.style={fill=gray!55,draw=none}}
  \newcommand{\inputs}{\draw[green!45!black,densely dashed] (0,0.4) rectangle (2,1.6); \draw[red!60!black,densely dashed] (0.8,0) rectangle (1.2,2.0);}
  \begin{scope}[shift={(0,2.9)}]
    \draw[fill=green!45,draw=black!60] (0,0.4) rectangle (2,1.6);
    \draw[fill=red!65,draw=black!70] (0.8,0) rectangle (1.2,2.0);
    \node at (1,-0.35) {inputs: MOAT, POLY};
  \end{scope}
  \begin{scope}[shift={(3.9,2.9)}]
    \fill[res] (0,0.4) rectangle (2,1.6); \fill[res] (0.8,0) rectangle (1.2,2.0); \inputs
    \node at (1,-0.35) {MOAT + POLY (OR)};
  \end{scope}
  \begin{scope}[shift={(7.8,2.9)}]
    \fill[res] (0.8,0.4) rectangle (1.2,1.6); \inputs
    \node at (1,-0.35) {GATE = POLY $*$ MOAT};
  \end{scope}
  \begin{scope}[shift={(0,0)}]
    \fill[res] (0,0.4) rectangle (0.8,1.6); \fill[res] (1.2,0.4) rectangle (2,1.6); \inputs
    \node at (1,-0.35) {SD = MOAT $-$ POLY};
  \end{scope}
  \begin{scope}[shift={(3.9,0)}]
    \fill[res] (0.8,0) rectangle (1.2,0.4); \fill[res] (0.8,1.6) rectangle (1.2,2.0); \inputs
    \node at (1,-0.35) {FIELDPOLY = POLY $-$ MOAT};
  \end{scope}
  \begin{scope}[shift={(7.8,0)}]
    \fill[res] (0,0.4) rectangle (0.8,1.6); \fill[res] (1.2,0.4) rectangle (2,1.6);
    \fill[res] (0.8,0) rectangle (1.2,0.4); \fill[res] (0.8,1.6) rectangle (1.2,2.0); \inputs
    \node at (1,-0.35) {MOAT xor POLY};
  \end{scope}
\end{circuitikz}
\end{document}
```

Then the **rule checks** run on merged polygons (touching shapes on one layer are merged first, across hierarchy): `width`, `spacing` (intra- and inter-figure), `overlap` (= enclosure: A must surround B), `overhang` (= extension), optionally `exact`. Violations come back as diagnostic shapes on the layout.

> [!note]- Detail: size adjusts are not reversible
> Oversize moves every edge out by $d$; undersize moves it in. A U-shape oversized until its notch closes, then undersized by the same amount, is a rectangle, not the U. A U undersized until its thin arm vanishes, then oversized, is an L. Decks use this deliberately (e.g. to merge minimum-spaced shapes for latent-antenna checks), but chains of size adjusts surprise people. Arcs approximated by polygons also trip vertex-to-vertex width and spacing checks with false errors. (Hastings Figs. 3.14–3.16.)

### DRC, LVS, PEX

```tikz title="What each check reads and writes. LVS extracts devices (GATE = POLY AND ACTIVE, sized by the shape) and nets (through contacts and metal), then compares that netlist to the schematic's. PEX adds wire and junction parasitics to the same netlist for post-layout simulation."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black}]
  \tikzset{blk/.style={draw,thick,rounded corners=3pt,align=left,font=\scriptsize,inner sep=4pt}}
  % mini layout
  \draw[diff] (0,0.4) rectangle (2.6,1.8);
  \draw[poly] (0.8,0) rectangle (1.05,2.3);
  \draw[poly] (1.55,0) rectangle (1.8,2.3);
  \draw[poly] (0.8,2.3) rectangle (1.8,2.55);
  \foreach \x in {0.3,1.2,2.1} { \draw[ct] (\x,0.95) rectangle ({\x+0.2},1.15); }
  \node at (1.3,-0.35) {layout (GDS)};
  \node[blk] (ext) at (6.6,1.3) {\texttt{M1 d g s b nch W=2.8u L=.1u}\\\texttt{\ \ nf=2 AD=.. AS=.. PD=.. PS=..}};
  \node[blk] (sch) at (6.6,3.2) {schematic netlist\\\texttt{M1 d g s b nch W=2.8u L=.1u nf=2}};
  \node[blk] (cmp) at (12.4,2.25) {LVS compare\\topological: devices, nets, pins\\parametric: $W$, $L$, model};
  \node[blk] (pex) at (6.6,-0.6) {PEX: $+\,R_{wire}$, $C_{wire\to gnd}$, $C_{coupling}$};
  \node[blk] (sim) at (12.4,-0.6) {post-layout\\SPICE};
  \draw[->,thick] (2.8,1.3) -- node[above]{extract} (ext.west);
  \draw[->] (ext.east) -- (cmp.west);
  \draw[->] (sch.east) -- (cmp.west);
  \draw[->,thick] (2.8,0.6) -- (3.3,0.6) |- (pex.west);
  \draw[->] (pex) -- (sim);
\end{circuitikz}
\end{document}
```

| Check | Question | Typical errors | Can it be waived? |
|---|---|---|---|
| **DRC** | Is every shape manufacturable? | width, spacing, enclosure, density, antenna | a few false diagnostics, only after review with process engineering |
| **LVS topological** | Same devices, same nets, same pins? | short, open, unmatched device/net, misspelled pin | **never**: one error can hide others |
| **LVS parametric** | Same $W$, $L$, model? | finger count, wrong device type, guard-ring diode area | some, reviewed with the circuit designer |
| **PEX** | What parasitic $R$, $C$ did the layout add? | none: it is a netlist, judged by post-layout sim | n/a |

> [!tip] Remark
> LVS's view of a transistor is the GATE layer from the previous diagram: a dummy device whose source/drain is not where LVS expects can be misidentified. Mark dummies with the deck's pseudolayer (see [[Device Matching]]).

> [!note]- Detail: hierarchical vs. flat checking, and the tape-out checklist
> Early DRC flattened everything into polygons (*flat* verification). Modern tools keep hierarchy (*hierarchical*), which is faster and reports errors in the cell where they live, except with many overlapping instances or routing on top of cells. LVS assumes layout hierarchy matches schematic hierarchy, except layout-only cells (guard rings, power-device pieces). Hastings's final review asks, among others: all DRC diagnostics reviewed and waived? zero LVS topological errors? LVS parametric errors reviewed? power wires checked for electromigration (see [[Electromigration]])? high-current lead resistances verified? all antenna violations fixed? every pin ESD-protected? (Hastings Secs. 3.2, 15.1.1, 15.5.)

### Pattern generation

```tikz title="Pattern generation (top): the PG deck turns drawn layers into mask data. Optical proximity correction (bottom): an L drawn at the resolution limit prints with rounded corners and pulled-back ends; the mask gets serifs and hammerheads so the print comes back close to the drawing. After Hastings Secs. 3.3.1-3.3.4, Fig. 3.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \tikzset{blk/.style={draw,thick,rounded corners=3pt,align=center,font=\scriptsize,minimum width=2.1cm,minimum height=0.9cm}}
  \node[blk] (a) at (0,0) {combine\\coding layers};
  \node[blk] (b) at (2.6,0) {process\\size adjust};
  \node[blk] (c) at (5.2,0) {OPC};
  \node[blk] (d) at (7.8,0) {tone: clear\\or dark field};
  \node[blk] (e) at (10.4,0) {fracture into\\trapezoids};
  \node[blk] (f) at (13.0,0) {reticle\\(4$\times$/5$\times$)};
  \foreach \u/\v in {a/b,b/c,c/d,d/e,e/f} { \draw[->,thick] (\u) -- (\v); }
  % OPC
  \begin{scope}[yshift=-3.6cm]
    \draw[fill=blue!55,draw=black!70] (0,0) -- (0.5,0) -- (0.5,1.5) -- (1.8,1.5) -- (1.8,2.0) -- (0,2.0) -- cycle;
    \node at (0.9,-0.4) {drawn};
    \begin{scope}[xshift=3.0cm]
      \draw[fill=blue!55,draw=black!70,rounded corners=5pt] (0.06,0.25) -- (0.44,0.25) -- (0.44,1.45) -- (1.6,1.45) -- (1.6,1.95) -- (0.06,1.95) -- cycle;
      \draw[densely dashed] (0,0) -- (0.5,0) -- (0.5,1.5) -- (1.8,1.5) -- (1.8,2.0) -- (0,2.0) -- cycle;
      \node[align=center] at (0.9,-0.5) {printed, no OPC:\\corners round, ends pull back};
    \end{scope}
    \begin{scope}[xshift=6.6cm]
      \draw[fill=gray!40] (0,0) -- (0.5,0) -- (0.5,1.5) -- (1.8,1.5) -- (1.8,2.0) -- (0,2.0) -- cycle;
      \draw[fill=gray!40] (-0.12,-0.12) rectangle (0.62,0.15);
      \draw[fill=gray!40] (1.65,1.38) rectangle (1.92,2.12);
      \draw[fill=gray!40] (-0.12,1.88) rectangle (0.12,2.12);
      \fill[white] (0.5,1.5) rectangle (0.62,1.38);
      \node[align=center] at (0.9,-0.5) {mask with OPC:\\hammerheads, serifs};
    \end{scope}
    \begin{scope}[xshift=10.2cm]
      \draw[fill=blue!55,draw=black!70,rounded corners=2pt] (0,0.02) -- (0.5,0.02) -- (0.5,1.5) -- (1.78,1.5) -- (1.78,2.0) -- (0,2.0) -- cycle;
      \node[align=center] at (0.9,-0.5) {printed with OPC:\\close to drawn};
    \end{scope}
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Resolution:** minimum feature $\approx \lambda_{light}/(2\,NA)$ (Hastings's Abbe estimate; the general form $k_1\lambda/NA$ is in [[CMOS Processing#Resolution, Depth of Focus and Overlay]]). An I-line stepper (365 nm, NA 0.6) resolves about 0.3 µm and runs a 0.5 µm process comfortably. DUV (248, 193 nm) goes to somewhat below 50 nm; below that EUV (13.5 nm).
- **Analog processes trail digital** and use milder OPC, mostly on gate and moat (and on damascene metal).
- **Rule for you:** draw nothing a decomposer cannot fill. No exposed acute interior angles, no off-grid vertices, and follow design rules even for logos and text. A fab can put a lot on hold for "chip art" it mistakes for a rule violation.

> [!note]- Detail: from rubylith to MEBES
> Masks were once cut from 400× rubylith and photoreduced twice. Optical pattern generators (1970s) flashed rotated rectangles from a list ("rectangular decomposition"), which cannot fill an acute interior angle; hence the old rule. MEBES electron-beam writers (and later laser writers) rasterize trapezoids, which can. The PG deck still does the same four jobs: combine layers, size-adjust, choose tone, decompose. Reticles hold several die or several designs (multi-project wafers, MOSIS since 1981); process-control structures live in the scribe streets. (Hastings Sec. 3.3.)

## Level 3: Drawing the MOSFET

> [!tip] Remark
> [[MosFETs#Layout]] gives the one-paragraph version (fold wide devices, size fingers by $R_g$ vs $1/g_m$, share diffusions) and the perimeter formula $C_P$. This level is the drawing practice behind it.

### Anatomy of one finger

```tikz title="One NMOS finger with the dimensions the rules set, and the A-A' cross-section. Designer-chosen: W and L. Rule-set: poly extension past active X, contact-to-gate spacing c, active enclosure of contact e, hence S/D extension E. The gate contact sits on poly over field oxide, not over the channel. After Razavi Figs. 2.29, 19.1, 19.6 and Hastings Fig. 12.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black},
  sel/.style={draw=orange!80!black,densely dotted,thick}]
  \draw[diff] (0,0) rectangle (5,3);
  \draw[poly] (2.2,-0.8) rectangle (2.8,3.8);
  \draw[poly] (2.0,-1.7) rectangle (3.0,-0.8);
  \foreach \y in {0.4,1.3,2.2} { \draw[ct] (0.6,\y) rectangle (1.0,{\y+0.4}); \draw[ct] (4.0,\y) rectangle (4.4,{\y+0.4}); }
  \draw[ct] (2.3,-1.45) rectangle (2.7,-1.05);
  \draw[mone] (0.45,0.25) rectangle (1.15,2.75);
  \draw[mone] (3.85,0.25) rectangle (4.55,2.75);
  \draw[mone] (2.15,-1.6) rectangle (2.85,-0.9);
  \draw[<->] (2.2,4.1) -- (2.8,4.1) node[midway,above] {$L$};
  \draw[<->] (-0.8,0) -- (-0.8,3) node[midway,left] {$W$};
  \draw[<->] (3.05,3.0) -- (3.05,3.8) node[midway,right] {$X$};
  \draw[<->] (0,-0.6) -- (2.2,-0.6) node[midway,below] {$E$};
  \draw[<->] (1.0,2.95) -- (2.2,2.95) node[midway,above] {$c$};
  \draw[<->] (0,0.6) -- (0.6,0.6);
  \node at (0.3,0.85) {$e$};
  \node[anchor=west] at (3.1,-1.25) {gate contact over field};
  \draw[densely dashed] (-1.3,1.05) -- (6.3,1.05);
  \node at (-1.45,1.05) {A}; \node at (6.45,1.05) {A$'$};
  \node at (0.8,3.25) {S}; \node at (4.2,3.25) {D};
  % cross-section
  \begin{scope}[yshift=-5.6cm]
    \fill[orange!12] (-0.8,0) rectangle (5.8,1.6);
    \node[anchor=south west] at (-0.8,0) {p-substrate};
    \draw[fill=gray!45] (-0.8,1.0) rectangle (0,1.6); \draw[fill=gray!45] (5,1.0) rectangle (5.8,1.6);
    \node at (-0.4,1.3) {STI}; \node at (5.4,1.3) {STI};
    \draw[fill=green!45,draw=black!60] (0,1.6) -- (0,1.15) -- (2.3,1.15) -- (2.3,1.6);
    \draw[fill=green!45,draw=black!60] (2.7,1.6) -- (2.7,1.15) -- (5,1.15) -- (5,1.6);
    \node at (1.4,1.35) {n$^+$}; \node at (3.6,1.35) {n$^+$};
    \draw[fill=orange!60] (2.2,1.6) rectangle (2.8,1.67);
    \draw[poly] (2.2,1.67) rectangle (2.8,2.1);
    \draw[ct] (0.6,1.6) rectangle (1.0,2.5);
    \draw[ct] (4.0,1.6) rectangle (4.4,2.5);
    \draw[fill=blue!55,draw=black!70] (0.45,2.5) rectangle (1.15,2.75);
    \draw[fill=blue!55,draw=black!70] (3.85,2.5) rectangle (4.55,2.75);
    \node[anchor=west] at (5.9,1.63) {gate oxide};
    \draw (5.9,1.63) -- (2.8,1.635);
    \node at (2.5,-0.35) {A--A$'$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> The A–A′ cut is the NMOS half of the inverter cross-section in [[CMOS Processing]]; the channel is exactly poly ∩ active because the gate is self-aligned ([[CMOS Processing#The Self-Aligned Gate]]), which is why LVS can find it as GATE = POLY AND ACTIVE.

- **$W$ and $L$ are the only dimensions you choose.** $X$, $c$, $e$, and so $E$, are minimum rules. Carusone: $E \approx 5\lambda$; Razavi: $E$ is typically 3–4× $L_{min}$.
- **Many small contacts, not one big one:** fill the S/D strip with minimum contacts. That spreads current and lowers contact resistance; one contact on a wide device leaves the far end debiased. Contacts come in one fixed size ([[CMOS Processing#Contacts Arrays of Small Squares]]).
- **Gate contact off the channel.** Many processes forbid contacts over active gate; the poly runs out past active onto field and is contacted there.
- **Strap resistive layers with metal** (poly, diffusion) wherever they carry current.

### Fingers

```tikz title="The same total W as one, two and four fingers. Labels under each diffusion strip: S or D. Two fingers (even) can put the extra strip on the source, so the drain has one strip and both outer edges are sources. Carusone's numbers for W = 80 lambda, lambda = 0.2 um: one finger C_db = 7.4 fF, four fingers C_db = 3.3 fF. After Razavi Fig. 19.10, Hastings Fig. 12.25, Carusone Ex. 2.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  ct/.style={fill=black}]
  % 1 finger
  \draw[diff] (0,0) rectangle (1.9,4);
  \draw[poly] (0.8,-0.3) rectangle (1.1,4.3);
  \foreach \y in {0.3,1.3,2.3,3.3} { \draw[ct] (0.25,\y) rectangle (0.5,{\y+0.25}); \draw[ct] (1.4,\y) rectangle (1.65,{\y+0.25}); }
  \node at (0.4,-0.55) {S}; \node at (1.5,-0.55) {D};
  \node[align=center] at (0.95,-1.3) {1 finger\\1 S, 1 D strip};
  % 2 fingers
  \begin{scope}[xshift=3.0cm,yshift=1.0cm]
    \draw[diff] (0,0) rectangle (3.0,2);
    \draw[poly] (0.8,-0.3) rectangle (1.1,2.3);
    \draw[poly] (1.9,-0.3) rectangle (2.2,2.3);
    \foreach \y in {0.3,1.3} { \foreach \x in {0.25,1.375,2.5} { \draw[ct] (\x,\y) rectangle ({\x+0.25},{\y+0.25}); } }
    \node at (0.4,-0.55) {S}; \node[blue!60!black] at (1.5,-0.55) {\bfseries D}; \node at (2.6,-0.55) {S};
    \node[align=center] at (1.5,-2.3) {2 fingers (even)\\drain minimised: 1 D, 2 S};
  \end{scope}
  % 4 fingers
  \begin{scope}[xshift=7.2cm,yshift=1.5cm]
    \draw[diff] (0,0) rectangle (5.2,1);
    \foreach \x in {0.8,1.9,3.0,4.1} { \draw[poly] (\x,-0.3) rectangle ({\x+0.3},1.3); }
    \foreach \x in {0.25,1.375,2.475,3.575,4.675} { \draw[ct] (\x,0.38) rectangle ({\x+0.25},0.63); }
    \foreach \x/\t in {0.4/S,2.6/S,4.8/S} { \node at (\x,-0.55) {\t}; }
    \foreach \x in {1.5,3.7} { \node[blue!60!black] at (\x,-0.55) {\bfseries D}; }
    \node[align=center] at (2.6,-2.8) {4 fingers: 2 D (each shared by 2 gates), 3 S\\$C_{db}$: 7.4 fF $\to$ 3.3 fF (Carusone Ex.\ 2.2)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Why finger:** a single finger of $W/L \gtrsim 10$ is long and spindly. Fingers fix the aspect ratio, cut gate resistance, and let neighbours share S/D strips, which reduces junction cap by up to ~50 %.
- **Odd $N$:** equal numbers of S and D strips. **Even $N$:** one extra strip; put it on the **source** ("minimize the drain"), because drain cap usually matters more. High-speed designers split even small devices into two fingers for this reason.
- **Notation:** $N(W_f/L)$ means $N$ fingers of width $W_f$. If the schematic specifies it, draw exactly that. Otherwise you may refinger (1000/0.5 → 20(50/0.5)), but tell the circuit designer: ESD robustness, for one, depends on per-finger width.
- **Matched devices use the same finger width** (100/0.5 and 2(100/0.5) → 4(25/0.5) and 8(25/0.5)).
- **Too many fingers** add S/D perimeter. Keep $N E \ll W$ (Razavi's $C_P$ in [[MosFETs#Layout]]); the fix when gate resistance and perimeter disagree is to contact the gate at both ends.

### Gate resistance and gate contacts

```tikz title="Effective (noise-equivalent) gate resistance, with R_G = R_sq W/L for the whole width as one finger. Contacted at one end, the distributed line acts like R_G/3. Strapping both ends quarters it. N fingers in parallel each carry W/N and divide it by N^2. After Razavi Figs. 7.21, 7.22, 19.9 and Sec. 19.2.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black}]
  % (a)
  \draw[diff] (0,0) rectangle (1.8,4);
  \draw[poly] (0.75,-0.4) rectangle (1.05,4.3);
  \draw[poly] (0.6,-1.0) rectangle (1.2,-0.4);
  \draw[ct] (0.8,-0.8) rectangle (1.0,-0.6);
  \draw[->,red!70!black] (1.25,-0.3) -- (1.25,4.2);
  \node[align=center] at (0.9,-1.7) {(a) one end\\$R_{g,\mathrm{eff}} = R_G/3$};
  % (b)
  \begin{scope}[xshift=3.4cm]
    \draw[diff] (0,0) rectangle (1.8,4);
    \draw[poly] (0.75,-0.4) rectangle (1.05,4.4);
    \draw[poly] (0.6,-1.0) rectangle (1.2,-0.4);
    \draw[poly] (0.6,4.4) rectangle (1.2,5.0);
    \draw[ct] (0.8,-0.8) rectangle (1.0,-0.6);
    \draw[ct] (0.8,4.6) rectangle (1.0,4.8);
    \draw[mone] (0.65,-0.9) -- (2.3,-0.9) -- (2.3,4.9) -- (0.65,4.9) -- (0.65,4.5) -- (2.0,4.5) -- (2.0,-0.5) -- (0.65,-0.5) -- cycle;
    \node[align=center] at (0.9,-1.7) {(b) both ends strapped\\$R_G/12$};
  \end{scope}
  % (c)
  \begin{scope}[xshift=7.4cm,yshift=1.0cm]
    \draw[diff] (0,0) rectangle (4.2,1.0);
    \foreach \x in {0.6,1.6,2.6,3.6} { \draw[poly] (\x,-0.4) rectangle ({\x+0.3},1.3); }
    \draw[poly] (0.6,-0.7) rectangle (3.9,-0.4);
    \draw[ct] (2.15,-0.65) rectangle (2.35,-0.45);
    \node[align=center] at (2.1,-2.7) {(c) $N$ fingers, one end\\$R_{g,\mathrm{eff}} = \dfrac{R_\square W}{3N^2L}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{g,\text{eff}} = \frac{R_\square}{3}\,\frac{W}{N^2 L}\ \ \text{(one end)},\qquad \div 4 \text{ if both ends are contacted}}
$$

Rule of thumb (Razavi): per-finger gate resistance below the finger's $1/g_m$; for low noise, $\tfrac15$ to $\tfrac1{10}$ of it.

> [!tip] Remark
> The $R_G/3$ factor and the noise it adds ($4kTR_G/3$) are derived in [[Noise#Gate Resistance]]. Layout's only job is making $R_G$ small.

> [!note]- Worked example: how many fingers? (Razavi Ex. 19.1)
> $W/L = 5\ \mu\text{m}/40$ nm, $I_D = 1$ mA, $g_m = 1/(100\ \Omega)$, poly $R_\square = 30\ \Omega/\square$, $\gamma = 1$. Goal: gate-resistance noise voltage = $\tfrac15$ of the gate-referred channel noise voltage.
>
> Channel: $\overline{V_n^2} = 4kT\gamma\cdot 100$. Gate: $N$ fingers in parallel, $R_{g,\text{eff}} = \frac{30\cdot(5/0.04)}{3N^2} = \frac{1250}{N^2}$, so $\overline{V_n^2} = 4kT\cdot1250/N^2$.
>
> Amplitude ratio $\tfrac15$ → power ratio $\tfrac1{25}$: $1250/N^2 = 100/25 = 4$, so $N^2 = 312.5$, $N = 17.7$. **18 fingers** (each 0.28 µm wide).

### Shared diffusions and merged devices

```tikz title="Series devices of equal width (a cascode, a NAND stack). (a) Two separate devices joined by metal: two contacted junctions on the internal node. (b) One active strip, two gates: the shared junction needs no contact and shrinks to the poly-poly spacing. Carusone's numbers (lambda = 0.2 um, W = 2 um): a contacted junction is 2 um^2 / 4 um perimeter, the shared uncontacted one 0.8 um^2 / 0.8 um. (c) Unequal widths can still share a source with a notched moat. After Razavi Fig. 19.12, Carusone Fig. 2.16 / Ex. 2.1, Hastings Fig. 12.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black}]
  % (a)
  \draw[diff] (0,0) rectangle (1.8,2); \draw[poly] (0.75,-0.3) rectangle (1.05,2.3);
  \draw[diff] (2.6,0) rectangle (4.4,2); \draw[poly] (3.35,-0.3) rectangle (3.65,2.3);
  \foreach \x in {0.2,1.35,2.8,3.95} { \foreach \y in {0.4,1.3} { \draw[ct] (\x,\y) rectangle ({\x+0.25},{\y+0.25}); } }
  \draw[mone] (1.3,0.3) rectangle (3.05,1.7);
  \node at (0.9,2.6) {M1}; \node at (3.5,2.6) {M2};
  \node[align=center] at (2.2,-0.9) {(a) separate: internal node\\= 2 contacted junctions + wire};
  % (b)
  \begin{scope}[xshift=5.6cm]
    \draw[diff] (0,0) rectangle (3.0,2);
    \draw[poly] (0.75,-0.3) rectangle (1.05,2.3);
    \draw[poly] (1.95,-0.3) rectangle (2.25,2.3);
    \foreach \x in {0.2,2.55} { \foreach \y in {0.4,1.3} { \draw[ct] (\x,\y) rectangle ({\x+0.25},{\y+0.25}); } }
    \draw[<->] (1.05,1.0) -- (1.95,1.0); \node[align=center] at (1.5,1.45) {no\\contact};
    \node at (0.9,2.6) {M1}; \node at (2.1,2.6) {M2};
    \node[align=center] at (1.5,-0.9) {(b) shared: $A$ 2 $\to$ 0.8 µm$^2$,\\$P$ 4 $\to$ 0.8 µm};
  \end{scope}
  % (c)
  \begin{scope}[xshift=9.8cm]
    \draw[diff] (0,0.6) -- (0.95,0.6) -- (0.95,0) -- (2.85,0) -- (2.85,2.6) -- (0.95,2.6) -- (0.95,2.0) -- (0,2.0) -- cycle;
    \draw[poly] (0.5,0.3) rectangle (0.75,2.3);
    \draw[poly] (2.1,-0.3) rectangle (2.35,2.9);
    \foreach \y in {0.6,1.15,1.7} { \draw[ct] (1.35,\y) rectangle (1.6,{\y+0.25}); }
    \node at (0.62,2.55) {M1}; \node at (2.2,3.15) {M2};
    \node at (1.47,2.25) {S};
    \node[align=center] at (1.4,-0.9) {(c) notched moat:\\$W_1 \ne W_2$, shared S};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Share every diffusion you can** between devices on the same node: series stacks (cascode, NAND), parallel devices (fingers), and devices with a common source.
- The node that gains most is the **uncontacted internal node** of a series stack (cascode drain of the input device): it is pure parasitic, so make it minimum.
- In SPICE, split a shared junction's area and perimeter between the two devices (or give it all to one and zero to the other).
- NMOS and PMOS can never share a diffusion: they live in oppositely doped regions.

### Body (backgate) contacts

```tikz title="PMOS body contacts. (a) Abutting (butting) tap: the n+ tap touches the p+ source, saving the n-active-to-p-active spacing; legal only when body = source. (b) Separate tap: body on its own net, full spacing. (c) Wide arrays: put taps on both sides or thread them through the array, so no point of the device is far from a tap (Hastings: limit typically 25-250 um, process dependent). After Hastings Figs. 12.34, 12.35, Carusone Fig. 2.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  tap/.style={fill=green!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  ct/.style={fill=black},
  well/.style={fill=cyan!18,draw=cyan!50!black,dashed,thick}]
  % (a)
  \draw[well] (-0.3,-0.7) rectangle (3.2,2.6);
  \draw[pdiff] (0,0) rectangle (2.2,2);
  \draw[tap] (2.2,0) rectangle (2.8,2);
  \draw[poly] (0.85,-0.4) rectangle (1.15,2.3);
  \foreach \y in {0.3,0.85,1.4} { \draw[ct] (0.25,\y) rectangle (0.5,{\y+0.25}); \draw[ct] (1.6,\y) rectangle (1.85,{\y+0.25}); \draw[ct] (2.38,\y) rectangle (2.63,{\y+0.25}); }
  \node at (0.4,2.3) {D}; \node at (1.7,2.3) {S}; \node at (2.5,2.3) {n$^+$};
  \node[align=center] at (1.45,-1.25) {(a) abutting tap};
  % (b)
  \begin{scope}[xshift=4.2cm]
    \draw[well] (-0.3,-0.7) rectangle (3.7,2.6);
    \draw[pdiff] (0,0) rectangle (2.2,2);
    \draw[tap] (2.8,0) rectangle (3.4,2);
    \draw[poly] (0.85,-0.4) rectangle (1.15,2.3);
    \foreach \y in {0.3,0.85,1.4} { \draw[ct] (0.25,\y) rectangle (0.5,{\y+0.25}); \draw[ct] (1.6,\y) rectangle (1.85,{\y+0.25}); \draw[ct] (2.98,\y) rectangle (3.23,{\y+0.25}); }
    \draw[<->] (2.2,1.0) -- (2.8,1.0);
    \node at (3.1,2.3) {n$^+$};
    \node[align=center] at (1.7,-1.25) {(b) separate tap\\(body $\ne$ source)};
  \end{scope}
  % (c)
  \begin{scope}[xshift=8.9cm]
    \draw[well] (-0.3,-0.7) rectangle (5.6,2.6);
    \draw[tap] (0,0) rectangle (0.5,2);
    \draw[pdiff] (0.9,0) rectangle (4.4,2);
    \draw[tap] (4.8,0) rectangle (5.3,2);
    \foreach \x in {1.45,2.35,3.25} { \draw[poly] (\x,-0.4) rectangle ({\x+0.25},2.3); }
    \draw[tap] (2.03,0.85) rectangle (2.25,1.15);
    \draw[<->,red!70!black] (2.6,-0.45) -- (4.8,-0.45) node[midway,above,font=\tiny] {$\le d_{max}$};
    \node[align=center] at (2.65,-1.25) {(c) taps both sides / distributed in source;\\every point $\le d_{max}$ from a tap};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Every MOSFET needs a body contact nearby.** Without one, backgate current debiases the body, forward-biases the parasitic bipolars and can trigger **latch-up**. Design rules give a maximum distance from any transistor to the nearest tap; Carusone's λ example is 100λ.
- **Abutting (butting) taps** only when body = source. Even-finger, drain-minimized devices have sources at both ends, so they can be tapped on both sides.
- **Backgate pinning:** put taps on the side of a victim that faces a device that may inject carriers.

> [!tip] Remark
> Why the distance matters (the SCR loop, $R_{well}$, $R_{sub}$) is in [[Guard Rings, ESD and Interconnect#Latch-up]]. Full guard rings (majority- and minority-carrier) are in [[Guard Rings, ESD and Interconnect]]. Here a tap is just a contact to the body.

### Folding a wide device into a block

```tikz title="Bad: a 1000/0.5 device as one finger is a 1 mm sliver. Good: the same device as 20(50/0.5), drawn here with 8 of its fingers. Gate poly is bussed on one side, drain metal leaves on the opposite side so it does not run over the gate bus (less C_gd), and sources share the outer strips. Very many fingers go in two rows. After Hastings Sec. 12.2.8, Razavi Fig. 19.11, Carusone Sec. 2.4.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  mone/.style={fill=blue!55,fill opacity=0.45,draw=black!70},
  mtwo/.style={fill=violet!55,fill opacity=0.45,draw=black!70},
  ct/.style={fill=black}]
  % bad
  \draw[diff] (0,-1.5) rectangle (0.5,5.0);
  \draw[poly] (0.2,-1.7) rectangle (0.3,5.2);
  \node[align=center] at (0.25,-2.2) {1000/0.5};
  \node[anchor=west,align=left,red!70!black] at (0.7,1.8) {1 mm long:\\huge $R_G$,\\one big drain,\\won't fit};
  % good
  \begin{scope}[xshift=3.6cm]
    \draw[diff] (0,0) rectangle (8.4,2.4);
    \foreach \i in {0,...,7} {
      \pgfmathsetmacro{\x}{0.55+\i*1.0}
      \draw[poly] (\x,-0.5) rectangle ({\x+0.25},2.6);
    }
    \draw[poly] (0.55,-0.85) rectangle (9.0,-0.5);
    \draw[ct] (8.65,-0.78) rectangle (8.85,-0.58);
    \foreach \i in {0,...,8} {
      \pgfmathsetmacro{\x}{0.12+\i*1.0}
      \foreach \y in {0.3,1.0,1.7} { \draw[ct] (\x,\y) rectangle ({\x+0.2},{\y+0.2}); }
    }
    % drains (odd strips) up to M2 bus
    \foreach \i in {1,3,5,7} {
      \pgfmathsetmacro{\x}{0.02+\i*1.0}
      \draw[mone] (\x,0.2) rectangle ({\x+0.4},3.3);
    }
    \draw[mtwo] (0.9,3.0) rectangle (7.5,3.5);
    \node[anchor=west] at (7.6,3.25) {D bus (top)};
    % sources down
    \foreach \i in {0,2,4,6,8} {
      \pgfmathsetmacro{\x}{0.02+\i*1.0}
      \draw[mone] (\x,-1.4) rectangle ({\x+0.4},2.2);
    }
    \draw[mone] (0.02,-1.6) rectangle (8.42,-1.25);
    \node[anchor=west] at (9.1,-1.42) {S bus};
    \node[anchor=west] at (9.1,-0.67) {G bus};
    \node[align=center] at (4.2,-2.3) {20(50/0.5), 8 fingers drawn: S D S D \dots\ S; D leaves on the side away from G};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Variant layouts

```tikz title="Variants for special cases. Serpentine: a long thin moat snaked under a poly plate gives a very long L in a small area (trickle current sources; poor matching). Annular: the gate surrounds the drain, giving the smallest drain cap per unit width (the source cap grows instead). Waffle: a poly mesh with alternating S/D squares packs the most width per area for low-R switches, but is hard to metallize and has no room for body contacts. After Hastings Figs. 12.29, 12.30, 13.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  diff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  ct/.style={fill=black}]
  % serpentine
  \draw[line width=6pt,green!45,line join=miter] (0,0.3) -- (2.6,0.3) -- (2.6,1.0) -- (0.4,1.0) -- (0.4,1.7) -- (2.6,1.7) -- (2.6,2.4) -- (0,2.4);
  \draw[poly,fill opacity=0.55] (0.2,0.0) rectangle (2.85,2.7);
  \draw[diff] (-0.5,0.15) rectangle (0,0.45); \draw[ct] (-0.35,0.22) rectangle (-0.15,0.38);
  \draw[diff] (-0.5,2.25) rectangle (0,2.55); \draw[ct] (-0.35,2.32) rectangle (-0.15,2.48);
  \node[align=center] at (1.2,-0.6) {serpentine: long $L$};
  % annular
  \begin{scope}[xshift=4.0cm]
    \draw[diff] (0,0) rectangle (2.7,2.7);
    \draw[poly] (0.5,0.5) rectangle (2.2,2.2);
    \draw[diff] (0.85,0.85) rectangle (1.85,1.85);
    \draw[ct] (1.25,1.25) rectangle (1.45,1.45);
    \foreach \p in {(0.15,1.25),(2.35,1.25),(1.25,0.15),(1.25,2.35)} { \draw[ct] \p rectangle ++(0.2,0.2); }
    \node at (1.35,1.65) {D}; \node at (0.25,2.45) {S};
    \node[align=center] at (1.35,-0.6) {annular: min.\ $C_{db}/W$};
  \end{scope}
  % waffle
  \begin{scope}[xshift=8.0cm]
    \draw[diff] (0,0) rectangle (2.8,2.8);
    \foreach \v in {0.6,1.3,2.0} { \draw[poly] (\v,-0.2) rectangle ({\v+0.2},3.0); \draw[poly] (-0.2,\v) rectangle (3.0,{\v+0.2}); }
    \foreach \i in {0,...,3} { \foreach \j in {0,...,3} {
      \pgfmathsetmacro{\cx}{0.35+\i*0.7}
      \pgfmathsetmacro{\cy}{0.35+\j*0.7}
      \pgfmathtruncatemacro{\pty}{mod(\i+\j,2)}
      \ifnum\pty=0 \node[font=\tiny] at (\cx,\cy) {S}; \else \node[font=\tiny,blue!60!black] at (\cx,\cy) {D}; \fi
    } }
    \node[align=center] at (1.4,-0.6) {waffle: max.\ $W$/area};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!note]- Detail: power-transistor metallization
> For large low-$R_{on}$ devices the metal, not the silicon, often sets the resistance. Hastings's procedure: guess metal ≈ ⅓ of $R_{on}$, size the silicon for the rest, finger it, put fingers on M1 and buses on M2 (or M2+M3), compute bus/finger resistance, check electromigration where fingers meet buses, iterate. Diagonal (trapezoidal-bus) and bent-gate layouts relax electromigration; in Hastings's example the waffle gets 64 % more $W/L$ in the same area on silicon alone, but the gain roughly halves once metal is counted, its 90° corners avalanche early under ESD, and it has nowhere to put distributed body contacts. (Hastings Sec. 13.1.4.)

## Level 4: The Neighbourhood Is Part of the Device

Same $W/L$, same schematic, different current: in nanometre processes a device's surroundings shift its $V_{TH}$ and $\mu$, and no design rule flags it. The physics and the numbers live in [[Device Matching]]; at the drawing level the habits are:

| Effect | What to draw | Owner (physics, numbers, diagrams) |
|---|---|---|
| STI stress / length of diffusion | extend the moat past the last active gate, or add tied-off dummy fingers at both ends (two per edge in the newest nodes); equal S/D extension on every device that must match | [[Device Matching#STI Stress and the Length-of-Diffusion Effect]] |
| Well proximity | keep matched PMOS gates several µm inside the n-well (≈ 3 µm conservative, Carusone) | [[Device Matching#Well Proximity Effect]] |
| Implant shadowing, orientation | same orientation for matched devices; gate-aligned rather than parallel-gate; replicate or remove metal running over only one of a pair | [[Device Matching#Orientation and Implant Shadowing]] |
| Etch / litho microloading | identical neighbours: dummies at array ends, same gate spacing | [[Device Matching#Etch, Lithography and Dummies]] |
| Ground-line IR drop in bias distribution | distribute currents, mirror locally; scale ratios by unit fingers at equal $L$ | [[Device Matching#Wiring Resistance and Reference Distribution]], [[Current Mirrors#Sizing Same L, Unit Devices]] |
| Gradients | cross-coupling, common centroid | [[Device Matching]], [[Common-Centroid Layout]] |

> [!tip] Remark
> These are the process effects tabulated in [[CMOS Processing#Process Effects a Layout Must Respect]] (tilted implants, trench-fill stress, well-implant scatter), seen from the layout side. Dummy fingers are cheap here because the multi-finger device from [[#Fingers]] already has the right pitch: add one more gate at each end and tie it off.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| More fingers $N$ | $R_g \propto 1/N^2$, drain cap (shared strips), aspect ratio | S/D perimeter cap ($\propto (N+1)E$), area per finger overhead |
| Contact gate at both ends | $R_g$ ÷ 4 | metal strap, a little area and $C_{gd}$ if routed carelessly |
| Even $N$, drain minimized | least $C_{db}$, taps on both ends | source cap slightly up |
| Shared / uncontacted diffusion | internal-node cap down several × | devices must have the same width (or notched moat) and be adjacent |
| Many contacts per strip | contact $R$, uniform current | none worth naming |
| Dummy fingers | STI stress and etch edge effects off the active gates | area, extra S/D cap on end strips |
| Taps close / distributed | latch-up margin, body debiasing | area, slight source $R$ |
| Antenna jumpers / diodes | gate-oxide integrity, $V_{TH}$ shift | via resistance; diode adds junction cap |
| Dummy fill | CMP planarity, litho focus | uncontrolled parasitics unless blocked/controlled |
| Pcells | DRC-clean, fast, consistent | less control; exploded Pcells lose their parameters |

## Cheat sheet

| Quantity | Equation / value |
|---|---|
| Design rule | $D_{\text{drawn}} \ge D_{\text{must survive}} + \sum_k\Delta_k^{\max}$ |
| Rules of thumb (Hastings) | linewidth control ≈ 10 % of min. feature; misalignment ≈ 20 %; two misalignments ≈ 160 % of one; outdiffusion ≈ 0.8 $x_j$; depletion +50 % margin |
| Min. resolvable feature | $\approx \lambda_{light}/(2NA)$ (365 nm, NA 0.6 → 0.3 µm) |
| λ-rule contacted junction | $A_S = A_D \approx 5\lambda W$, $P_S = P_D \approx 10\lambda + W$ |
| λ-rule well spacing | p⁺ in well by 3λ, well to n⁺ by 5λ → PMOS–NMOS ≥ 8λ |
| Antenna ratios | $AR_{\text{periph}} = P_X/A_{gate}$ (poly ≈ 100 µm⁻¹), $AR_{\text{area}} = A_X/A_{gate}$ (poly ≈ 500) |
| Density | per-tile fraction in a window (e.g. M1 10–35 %) |
| Gate resistance | $R_{g,\text{eff}} = \dfrac{R_\square W}{3N^2L}$ (one end); ÷4 with both ends |
| Finger rule | per-finger $R_g < 1/g_m$; low noise $\tfrac15$–$\tfrac1{10}$ of it |
| S/D perimeter (odd $N$) | $C_P = \left[(N+1)E + \frac{N+1}{N}W\right]C_{jsw}$ ([[MosFETs#Layout]]) |
| Body-tap distance | ≤ 25–250 µm to nearest tap (process rule; Carusone's λ example 100λ) |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (PDF page = printed + 1)
  - Ch. 3 (pp. 117–149): §3.1 layout editors (coordinates, grid, shapes, hierarchy, transformations, pins, Pcells, CIF/GDSII/OASIS, Figs. 3.1–3.8); §3.2 design rules (geometric operations Figs. 3.9–3.14, rule checks Figs. 3.15–3.18, rule construction: minimum feature size, process bias, linewidth control, mask alignment, outdiffusion, depletion Table 3.1, worked example Table 3.2, scalable rules); §3.3 pattern generation (optical PG, coding/generated/pseudolayers, clear/dark masks Table 3.3, photolithography, MEBES, OPC Fig. 3.22).
  - §5.1.6 (pp. 226–229): antenna effect, peripheral/areal ratios, jumpers, antenna diodes (Figs. 5.8, 5.9).
  - §12.2.1 (pp. 590–593): coding the MOS transistor, Fig. 12.9, S/D clipping. §12.2.8 (pp. 610–616): sectioned transistors, drain minimization, merged transistors, serpentine, annular. §12.2.9 (pp. 616–620): backgate contacts, pinning, abutting vs separate, 25–250 µm.
  - §13.1.4 (pp. 659–664): power-transistor metallization, waffle and bent-gate layouts. §13.2–13.3 only for drawing practice (matching left to [[Device Matching]]).
  - §15.1.1 (p. 781) LVS and hierarchy; §15.5 (pp. 821–822) final layout checklist.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - §19.1 (pp. 733–736): layers, minimum width/spacing/enclosure/extension, Fig. 19.7, antenna effect Fig. 19.8.
  - §19.2.1 (pp. 737–739): multifinger devices and Ex. 19.1, $C_P$ (19.4–19.5), shared cascode junction Fig. 19.12. §19.2.2–19.2.5 (symmetry, shadowing, STI, well proximity, reference distribution) read and summarised in Level 4 only, since [[Device Matching]] already owns them; §19.2.6 passives, §19.2.7 interconnect, §19.3 substrate coupling left to their owner notes.
  - §7.x gate-resistance noise, Figs. 7.21–7.22 ($R_G/3$, both-end contact $R_G/4$).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - §2.2 (pp. 86–96): λ rules Fig. 2.14, misalignment shorts Fig. 2.15, shared junctions Fig. 2.16 and Ex. 2.1, inverter Fig. 2.17, parallel transistors Fig. 2.18 and Ex. 2.2, planarity and fill, antenna rules Fig. 2.19, latch-up (summary only).
  - §2.3.1 (pp. 96–98): lateral diffusion, overetch, well proximity and STI (summary only). §2.4.1 (pp. 103–104): multi-finger transistor layout, drain routed away from gate, dummy conventions.
- **Owner's Zettelkasten** (`AnalogTheory/Process Layout and Packaging/`): 15i (design rule as a tolerance stack).
