---
title: Floorplanning and Top-Level Assembly
description: From a parts list to a taped-out die. Estimate the area, choose core- or pad-limited, place blocks by noise, heat and stress, build the padring (scribe, seal, ground ring, pads, ESD), route the top level in channels, and sign off with a checklist.
kind: topic
status: growing
aliases:
  - Floorplanning and Top-Level Assembly
  - Floorplanning
  - Padring
  - Top-Level Layout
---

Every other Layout note draws one device or one cell. This note draws the whole die: how big it must be, where each block goes, what sits in the ring of pads around it, how the blocks get wired together, and what to check before the masks are made. It starts with the die on one screen and then goes one level deeper per section: area estimate, floorplan, padring, top-level wiring, sign-off.

## The big picture

```tikz title="The die on one screen: scribe street, scribe seal, ground ring, bondpads with an ESD device behind each, corner exclusion zones, and a core split into a quiet analog half and a noisy half, with power and matched devices on the same thermal axis at opposite ends. After Hastings Figs. 15.3, 15.5, 15.10 and Sec. 15.2. Layer colours: legend of CMOS Processing."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  pdiff/.style={fill=orange!65,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12},
  chan/.style={fill=white,draw=none}]
  % scribe street (top and right, Hastings convention)
  \draw[scribe] (0,0) rectangle (10.4,10.4);
  \fill[white] (0,0) rectangle (10,10);
  \node[font=\scriptsize,rotate=-90] at (10.2,5) {scribe street};
  % die edge / scribe seal (contact+via ring on PSD)
  \draw[pdiff] (0,0) rectangle (10,10);
  \fill[white] (0.08,0.08) rectangle (9.92,9.92);
  \draw[black,line width=0.8pt] (0.04,0.04) rectangle (9.96,9.96);
  % ground ring (M1)
  \draw[mone] (0.12,0.12) rectangle (9.88,9.88);
  \fill[white] (0.4,0.4) rectangle (9.6,9.6);
  % corner exclusion zones
  \foreach \cx/\cy/\sx/\sy in {0/0/1/1,10/0/-1/1,0/10/1/-1,10/10/-1/-1} {
    \fill[white] (\cx,\cy) -- ++(\sx*0.9,0) -- ++(-\sx*0.9,\sy*0.9) -- cycle;
    \draw[pattern=north east lines,draw=black!60] (\cx,\cy) -- ++(\sx*0.9,0) -- ++(-\sx*0.9,\sy*0.9) -- cycle;
  }
  % pads + ESD cells
  \foreach \p in {2.6,3.8,5.0,6.2,7.4} {
    \draw[mtwo] (\p-0.35,0.5) rectangle (\p+0.35,1.2); \draw[por] (\p-0.25,0.6) rectangle (\p+0.25,1.1);
    \draw[pdiff] (\p-0.3,1.3) rectangle (\p+0.3,1.55);
    \draw[mtwo] (\p-0.35,8.8) rectangle (\p+0.35,9.5); \draw[por] (\p-0.25,8.9) rectangle (\p+0.25,9.4);
    \draw[pdiff] (\p-0.3,8.45) rectangle (\p+0.3,8.7);
    \draw[mtwo] (0.5,\p-0.35) rectangle (1.2,\p+0.35); \draw[por] (0.6,\p-0.25) rectangle (1.1,\p+0.25);
    \draw[pdiff] (1.3,\p-0.3) rectangle (1.55,\p+0.3);
    \draw[mtwo] (8.8,\p-0.35) rectangle (9.5,\p+0.35); \draw[por] (8.9,\p-0.25) rectangle (9.4,\p+0.25);
    \draw[pdiff] (8.45,\p-0.3) rectangle (8.7,\p+0.3);
  }
  % core outline
  \draw[black!60,dashed] (1.7,1.7) rectangle (8.3,8.3);
  % symmetry axis (behind blocks)
  \draw[dash dot,thick,red!70!black] (1.7,5) -- (8.3,5);
  \node[font=\scriptsize,red!70!black] at (5,-0.3) {dash-dot: thermal / symmetry axis};
  % blocks: quiet half left, noisy half right
  \node[ana,minimum width=2.3cm,minimum height=1.6cm] at (3.0,7.35) {ADC /\\sensitive analog};
  \node[ana,minimum width=1.9cm,minimum height=1.2cm] at (2.8,5.0) {matched\\array};
  \node[ana,minimum width=2.3cm,minimum height=1.6cm] at (3.0,2.65) {bandgap\\bias};
  \node[dig,minimum width=3.2cm,minimum height=1.9cm] at (6.55,7.2) {digital logic\\(noisy)};
  \node[pwr,minimum width=1.5cm,minimum height=1.6cm] at (7.4,5.0) {power\\device};
  \node[rf,minimum width=2.4cm,minimum height=1.6cm] at (6.9,2.65) {PLL / VCO\\(own ring)};
  \node[font=\tiny] at (5.55,4.55) {quiet half $\leftarrow$ $\rightarrow$ noisy half};
  % callouts on the right
  \begin{scope}[font=\scriptsize]
  \draw[->] (11.2,9.6) node[right,align=left] {scribe street (saw kerf,\\50--75\,$\mu$m)} -- (10.2,9.6);
  \draw[->] (11.2,8.85) node[right] {scribe seal (contact + via rings on PSD)} -- (9.98,8.85);
  \draw[->] (11.2,8.2) node[right] {ground ring (substrate, ESD return)} -- (9.75,8.2);
  \draw[->] (11.2,7.35) node[right] {bondpad (top metal, PO opening)} -- (9.4,7.35);
  \draw[->] (11.2,6.6) node[right] {ESD device per pad} -- (8.6,6.2);
  \draw[->] (11.2,-0.7) node[right] {corner exclusion zone (no circuitry)} -- (9.7,0.2);
  \draw[->] (11.2,5.4) node[right,align=left] {core: blocks + channels\\(dashed outline)} -- (8.3,5.4);
  \end{scope}
  % legend
  \node[anchor=west,font=\bfseries\scriptsize] at (11.2,4.4) {Legend (CMOS Processing colours)};
  \foreach \y/\s/\t in {3.95/pdiff/{p+ diffusion (seal tap, ESD)},3.55/mone/{metal 1 (ground ring)},3.15/mtwo/{top metal (pads)},2.75/por/{PO opening (POR)},2.35/cont/{contact / via}} {
    \draw[\s] (11.25,\y-0.13) rectangle (11.65,\y+0.13);
    \node[anchor=west,font=\scriptsize] at (11.75,\y) {\t};
  }
  \node[anchor=west,font=\bfseries\scriptsize] at (11.2,1.5) {Floorplan blocks (not layers)};
  \foreach \y/\s/\t in {1.1/ana/{analog},0.7/dig/{digital},0.3/rf/{RF / clock},-0.1/pwr/{power}} {
    \draw[\s] (11.25,\y-0.13) rectangle (11.65,\y+0.13);
    \node[anchor=west,font=\scriptsize] at (11.75,\y) {\t};
  }
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Area comes from a parts list plus three factors.** Core $A_c \approx R_f P_f\sum A_{cell} + P_f\sum A_{pwr}$; die $A_{die}\approx(\sqrt{A_c}+2W_{pr}+W_s)^2$. Estimates within ±20 % are routinely achievable (Hastings §15.1).
> 2. **Core-limited or pad-limited.** $N_p$ pads need perimeter $P_{min}\approx(N_p+4)(W_p+S_p)+4W_s$. If $P_{min}/(4\sqrt{A_{die}})>1$ the pads, not the circuit, set the die size.
> 3. **Place by noise, heat and stress.** Noisy blocks and their pads on one side, sensitive ones on the other. Power devices and matched arrays sit on the same die axis at opposite ends; nothing precise in the corners.
> 4. **The padring is built first, from the outside in:** scribe street → scribe seal → ground ring → bondpads → ESD devices → guard rings. Pad order is a circuit decision: bond-wire mutual inductance couples whatever sits next to whatever.
> 5. **Route the top level in reserved channels,** one direction per metal layer, wide leads first, the primary channels sized for 10–20 % of all top-level signals. Then sign off with DRC, LVS, EM, ESD, latch-up and a checklist review.

**Map:** [[#Level 0 Die Area Estimation|area estimate]] → [[#Level 1 Floorplanning|floorplan: pads, partitions, heat, channels]] → [[#Level 2 Constructing the Padring|padring: scribe, seal, ground ring, bondpads, pad order, ESD]] → [[#Level 3 Manual Top-Level Interconnection|top-level routing: vias, pitch, channels, power, priorities]] → [[#Level 4 Final Layout Checklist and Tape-Out|checklist and tape-out]].

> [!tip] Remark: who owns what
> This note owns die-level decisions. The rules it applies live elsewhere: thermal and stress placement of a matched pair in [[Device Matching#Temperature and Heat Sources]] and [[Device Matching#Mechanical Stress and Package Shift]]; ESD clamp design and the substrate-return budget in [[Guard Rings, ESD and Interconnect#Rail Clamps and Whole-Chip Strategy]]; star/Kelvin wiring and shielding in [[Guard Rings, ESD and Interconnect#Star Routing and Kelvin Connections]] and [[Guard Rings, ESD and Interconnect#Crossing, Coupling and Shielding]]; scribe-seal construction in [[Failure Mechanisms#Scribe Seals]]; wire widths for current in [[Electromigration]]; how far apart noisy and quiet blocks must be in [[Substrate Noise#Floorplanning and Spacing]].

## What the floorplan does to block specs

A floorplan has no specs of its own. It decides how much of each block's budget the die eats. Each placement choice lands on one amplifier or block spec:

| Floorplan decision | Error it creates if done badly | Block spec it eats |
|---|---|---|
| Matched array off the thermal axis, or near an edge/corner | Gradient across the pair: $\Delta V_{TH}\approx 2$ mV/°C × $\Delta T$, stress-induced $\Delta k$ | Input offset, CMRR, mirror ratio accuracy |
| Clock/digital pad beside an analog input pad | $v = M\,dI/dt$ on one input but not the other | Input-referred noise and spurs, SFDR, PSRR |
| Too few supply/ground pads | Bounce $L\,\Delta I/(N\Delta t)$ on the rails | PSRR, settling, comparator offset |
| Noisy lead routed over a high-impedance node | $\Delta V = CR\,dV/dt$ | Reference noise, offset of a sampled node |
| High-current lead too long/narrow | $IR$ drop in the return path | Gain error, reference accuracy |

> [!tip] Remark
> These are the same amplifier specs as [[Single-Stage#Amplifier Specifications]]. Layout cannot add margin to them; it can only stop spending it. Size the circuit first ([[gm-ID Design Methodology]]), then use the floorplan to keep the extracted result inside that margin.

## Level 0: Die Area Estimation

### Partition and populate the database

The lead circuit designer splits the design into a hierarchy of cells (top cell → subsystems → leaf cells) before anyone draws a polygon, and enters empty schematics with only pins. Layout then estimates each cell from a sketch schematic that gives values to anything area-hungry: large capacitors, high-value resistors, matched arrays, power devices.

- One cell ≈ what fits legibly on one B-size (≈A3) sheet: about **50–100 components**. Bigger → split.
- **A matched array lives in one cell**, never scattered across several.
- Cell and pin names: lower case, start with a letter, letters/digits/underscore only, ≤ 32 characters (SPICE is case-insensitive; original GDSII limit). Pick one bus convention (`data(7:0)`, index 0 = LSB) and never deviate.

> [!tip] Remark
> Cells, instances and the eight orientations an instance can take are in [[Layout Fundamentals#The layout database]]. LVS assumes the layout hierarchy matches the schematic one, so partitioning is also an LVS decision ([[Layout Fundamentals#DRC, LVS, PEX]]).

> [!note]- Detail: naming suffixes that help the layout designer (Hastings §15.1.1, §15.4.4)
> - Negative logic: append `b` or `z` (`enableb` is active low).
> - Voltage domain: append it (`enable3p3` lives in the 3.3 V domain, `enable1p5` in 1.5 V).
> - Routing class: `_n` for noisy nets, `_s` for sensitive, `_hv` for high-voltage. A layout designer cannot tell these apart from a schematic alone; the circuit designer must mark them.
> - Pin direction: input, output, or input/output. Editors flag a net with only inputs as floating and a net with two outputs as shorted; most analog pins should be input/output.

### Cell areas from components

```tikz title="What a cell-area estimate counts: a serpentine resistor and a striped MOS transistor, each with the empirical factor for heads, dummies and terminations. After Hastings Eqs. 15.2-15.6."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % ---- resistor serpentine ----
  \node[anchor=west,font=\bfseries\scriptsize] at (0,4.75) {(a) resistor: $A\approx 1.2\,R\,W_r(W_r+S_r)/R_S$};
  \foreach \i in {0,...,4} { \draw[poly] (0.4+\i*0.9,0.6) rectangle (0.9+\i*0.9,3.6); }
  \foreach \i in {0,2} { \draw[poly] (0.4+\i*0.9,3.6) rectangle (1.8+\i*0.9,3.95); }
  \foreach \i in {1,3} { \draw[poly] (0.4+\i*0.9,0.25) rectangle (1.8+\i*0.9,0.6); }
  \draw[poly] (0.4,0.0) rectangle (0.9,0.6); \draw[poly] (4.0,3.6) rectangle (4.5,4.2);
  \draw[cont] (0.55,0.08) rectangle (0.75,0.28); \draw[cont] (4.15,3.92) rectangle (4.35,4.12);
  \node[font=\scriptsize,anchor=east] at (0.35,0.18) {head};
  \draw[<->] (0.4,2.1) -- (0.9,2.1) node[midway,above,font=\scriptsize] {$W_r$};
  \draw[<->] (0.9,1.6) -- (1.3,1.6) node[midway,below,font=\scriptsize] {$S_r$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.8,2.4) {total length $L=R\,W_r/R_S$\\each strip occupies $W_r+S_r$\\$\times 1.2$: heads, dummies};
  % ---- MOS stripes ----
  \begin{scope}[xshift=9cm]
  \node[anchor=west,font=\bfseries\scriptsize] at (0,4.75) {(b) MOS: $A\approx 1.3\,W_g(L_g+S_{gg})$};
  \draw[ndiff] (0,0.6) rectangle (4.6,3.4);
  \foreach \i in {0,...,4} {
    \draw[poly] (0.55+\i*0.85,0.25) rectangle (0.85+\i*0.85,3.75);
  }
  \foreach \i in {0,...,5} { \foreach \y in {1.0,1.6,2.2,2.8} { \draw[cont] (0.2+\i*0.85,\y) rectangle (0.38+\i*0.85,\y+0.18); } }
  \draw[<->] (0.55,3.95) -- (0.85,3.95) node[midway,above,font=\scriptsize] {$L_g$};
  \draw[<->] (0.85,0.1) -- (1.4,0.1) node[midway,below,font=\scriptsize] {$S_{gg}$};
  \draw[<->] (4.85,0.6) -- (4.85,3.4) node[midway,right,font=\scriptsize] {$W_g$ per stripe};
  \node[font=\scriptsize,align=left,anchor=west] at (0,-0.75) {$W_g$ = total gate width; each stripe of gate costs $L_g+S_{gg}$ in pitch;\\$\times 1.3$: end terminations, well spacing, packing};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (0,-0.75) {capacitor: $A\approx 1.1\,C/C_a$,\quad $C_a[\mathrm{pF}/\mu\mathrm{m}^2]=0.885\,\varepsilon_r/t[\text{\AA}]$\\power MOS: $A\approx R_{SP}/(R_{DS(on)}-R_P)$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_{cell}\approx P_{f(cell)}\sum A}
$$

Sum the component areas, then multiply by a **cell packing factor** for isolation, wiring and imperfect packing. Today a quick auto-placement of the real components is usually more accurate; the formulas are for when no schematic exists yet.

| Component | Area estimate (Hastings Eqs. 15.2–15.6) |
|---|---|
| Resistor | $A\approx 1.2\,R\,W_r(W_r+S_r)/R_S$ |
| Parallel-plate capacitor | $A\approx 1.1\,C/C_a$, with $C_a[\mathrm{pF}/\mu\mathrm{m}^2]=0.885\,\varepsilon_r/t[\text{Å}]$ |
| MOS transistor | $A\approx 1.3\,W_g(L_g+S_{gg})$ |
| MOS power transistor | $A\approx R_{SP}/(R_{DS(on)}-R_P)$ |
| Bipolar transistor | lay out sample devices and record their areas |

| Process / metal | Cell packing factor $P_{f(cell)}$ |
|---|---|
| Standard bipolar, single-level metal | 1.5–3.0 |
| Standard bipolar, double-level metal | 1.3–2.5 |
| CMOS / BiCMOS, two metals | 1.2–1.8 (more metal layers barely help analog) |

Two sanity numbers (Hastings): a 500 kΩ, 200 Ω/□ poly resistor with $W_r=S_r=2\ \mu$m takes 24 000 µm²; a 100 pF capacitor on 200 Å oxide ($C_a = 0.017$ pF/µm²) takes about 6400 µm².

> [!tip] Remark
> The 1.2 and 1.1 cover dummies and terminations, the same dummies [[Device Matching#Etch, Lithography and Dummies]] demands. If a design needs more dummies than usual, raise the factor. Resistor and capacitor layout itself is in [[Resistor]] and [[Capacitor]].

> [!note]- Detail: power devices and the bandgap example (Hastings §15.1.2)
> - **Power MOS** scale with on-resistance. $R_{SP}$ is the specific on-resistance (Ω·area) of a reference device of the same type, gate length and $V_{GS}$; $R_P$ is everything outside the transistor (metal, bond wires, leadframe). On-resistance varies about ±25 % over process and rises roughly 50 % from 25 °C to 125 °C, so the worst-case hot $R_{DS(on)}$ can be nearly twice nominal. Size for that.
> - Estimate large power devices as **stand-alone** blocks: rectangles pack almost perfectly, so they get no cell packing factor.
> - **Worked example (Table 15.1):** a standard-bipolar Brokaw bandgap (resistors, a 40 pF junction capacitor, 15 transistors) adds up to 95 400 µm² of components; with a conservative $P_f = 2$ the cell is **0.19 mm²**. Overestimating is far cheaper than underestimating.

### Core-limited or pad-limited

```tikz title="Core-limited vs pad-limited. In (a) the core fills the space inside the padring and the gaps between pads take ESD and filler cells; in (b) the pad count sets the perimeter and the core floats in wasted area. After Hastings Fig. 15.3."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  \foreach \xo/\ttl/\cs/\np in {0/{(a) core-limited: $\mathcal P<1$}/3.0/5, 6.6/{(b) pad-limited: $\mathcal P>1$}/1.9/9} {
    \begin{scope}[xshift=\xo cm]
      \draw[scribe] (0,0) rectangle (5.2,5.2);
      \draw[mone] (0.25,0.25) rectangle (4.95,4.95);
      \fill[white] (0.4,0.4) rectangle (4.8,4.8);
      \pgfmathsetmacro{\pitch}{3.3/\np}
      \foreach \k in {1,...,\np} {
        \pgfmathsetmacro{\p}{0.95+(\k-0.5)*\pitch}
        \draw[mtwo] (\p-0.14,0.48) rectangle (\p+0.14,0.82);
        \draw[mtwo] (\p-0.14,4.38) rectangle (\p+0.14,4.72);
        \draw[mtwo] (0.48,\p-0.14) rectangle (0.82,\p+0.14);
        \draw[mtwo] (4.38,\p-0.14) rectangle (4.72,\p+0.14);
      }
      \node[blk,fill=yellow!25,minimum width=\cs cm,minimum height=\cs cm] at (2.6,2.6) {core\\$A_c$};
      \node[font=\scriptsize] at (2.6,-0.35) {\ttl};
    \end{scope}
  }
  \draw[<->] (0,5.45) -- (5.2,5.45) node[midway,above,font=\scriptsize] {$\sqrt{A_c}+2W_{pr}+W_s$};

  \node[font=\scriptsize,align=center] at (8.0,5.55) {wasted area};
  \draw[->] (8.0,5.35) -- (8.25,4.1);
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,4.3) {$W_s$: scribe street};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,3.8) {$W_{pr}$: padring (seal, ring,};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,3.4) {\quad pads, ESD, guard rings)};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,2.8) {(a) gaps between pads};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,2.4) {\quad hold ESD, non-critical cells};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,1.8) {(b) die size set by};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,1.4) {\quad perimeter: $A_{die}=P_{min}^2/16$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_c \approx R_f\,P_{f(die)}\sum A_{cell} + P_{f(die)}\sum A_{pwr}}
\qquad
\boxed{A_{die}\approx\left(\sqrt{A_c}+2W_{pr}+W_s\right)^2}
$$

$$
\boxed{P_{min}\approx (N_p+4)(W_p+S_p)+4W_s}
\qquad
\boxed{\mathcal{P}=\frac{P_{min}}{4\sqrt{A_{die}}}}
\qquad
\mathcal P>1:\ \boxed{A_{die}=\frac{P_{min}^2}{16}}
$$

- $R_f$ = **routing factor** (area of top-level wiring), $P_{f(die)}$ = **die packing factor** (gaps between cells plus a safety margin). $A_c$ excludes everything in the padring.
- $W_{pr}$ = padring width (seal, ground ring, pads, guard rings): typically **100–150 µm**. $W_s$ = scribe street: **50–75 µm** for sawing, as little as **25 µm** with laser dicing.
- In Eq. 15.9, $W_p$ = pad width, $S_p$ = facing-edge pad spacing, $W_s$ = scribe + seal + ground ring. If the rules keep pads a distance from the corners, add 8× that distance to $P_{min}$.
- **Pad-limited fixes:** a longer aspect ratio rarely adds enough perimeter. A second, staggered row of pads inside the first works if the assembly site approves the bond-wire geometry.

| Factor | Typical value (Hastings §15.1.3) |
|---|---|
| $P_{f(die)}$, 20–30 cells not crafted to fit | 1.1–1.2 |
| $P_{f(die)}$, hand-crafted "tight pack" | < 1.05 (slow, hard to modify: tiny cost-driven dice only) |
| $R_f$, single-level metal, 50–100 components | ≤ 1.2 (routing forced through custom devices) |
| $R_f$, one metal + poly, up to a few thousand components | 1.2–1.4 |
| $R_f$, double-level metal, several thousand transistors | 1.1–1.3 channel; ≈1.1 mixed maze + channel |
| $R_f$, triple-level metal, many thousands | 1.1–1.2 channel |
| $R_f$, four metals | near 1 with maze routing (if cells keep off M3/M4) |

> [!example] Worked example: the dual op amp (Hastings Table 15.2)
> Cells: two 0.32 mm² amplifiers (one cell placed twice, mirrored) and a 0.13 mm² bias block, 8-pin SOIC, 25 µm PCC wire, 75 µm pads, 100 µm padring, 75 µm scribe. Hastings' estimate is **1.33 mm²**, a square die **1153 × 1153 µm**, rounded to the mask vendor's increment (≤ 1 µm, no difficulty).
>
> Pad check (my arithmetic, Hastings' inputs): pitch 125 µm so $W_p+S_p = 125$ µm; take $W_s\approx 75 + 50 = 125$ µm (scribe plus seal and ring). $P_{min} = 12\times125+4\times125 = 2000$ µm against a perimeter of $4\times1153 = 4612$ µm: $\mathcal P\approx0.43$, **core-limited**.

> [!warning] Unverified: how Hastings' 1.33 mm² is reached
> Table 15.2 lists $P_f = 1$, $R_f = 1.2$, and the text says 20 % of the core is reserved for routing. But $(\sqrt{0.77\ \text{mm}^2} + 2\cdot100 + 75\ \mu\text{m})^2 = (877+275)^2\ \mu\text{m}^2 \approx 1.33$ mm² uses the bare 0.77 mm² sum, with no 1.2 applied. With $R_f = 1.2$ Eq. 15.8 gives about 1.53 mm². Treat the book's number as "routing included in the cell areas".

### Cost and gross margin

$$
\boxed{N_d=\frac{\eta\pi d^2}{4A_{die}}}\qquad
\boxed{C_d=\frac{C_m+C_p}{N_dY_p}}\qquad
\boxed{C_f=\frac{C_d+C_a}{Y_a}}\qquad
\boxed{GPM=\frac{S-C_f}{S}\cdot100\,\%}
$$

$\eta$ = wafer utilization (0.85–0.95), $d$ = wafer diameter, $A_{die}$ includes the scribe street, $C_m$ = wafer cost, $C_p$ = probe cost per wafer, $Y_p$ = probe yield (analog: 0.8–0.95), $C_a$ = assembly and test cost, $Y_a$ = assembly yield (usually > 0.95), $S$ = selling price.

> [!example] Worked example (Hastings §15.1.4)
> 10 mm² die, 200 mm wafer, $\eta = 0.95$: $N_d = 0.95\pi(200)^2/(4\cdot10) \approx 2980$. A probed wafer costs \$750 at $Y_p = 0.9$: $C_d = 750/(2980\cdot0.9)\approx 28$ ¢. Assembly 15 ¢ at $Y_a = 0.98$: $C_f = 0.43/0.98\approx 44$ ¢. Sold at \$1.00: **GPM = 56 %**. Most companies question a part that can't reach 50 %.

Area enters cost linearly through $N_d$ (and through yield), which is why the estimate must be honest in both directions: too small and the floorplan breaks, too large and the part loses money.

## Level 1: Floorplanning

The **floorplan** is a to-scale sketch of the die: outline with scribe and corner exclusion zones, ground ring, pads, ESD devices, guard rings, every cell and power device as a correctly sized rectangle, the key power and bus routing, and the routing channels. It is the template for the whole layout. When a cell turns out larger or smaller than its slot, revise the floorplan.

### The worksheet and pad order

Inputs: area of every cell, the die area estimate, the package, and the **pin list in order**. Then:

1. Square die of the estimated area, rounded to the mask grid. Mark the scribe street on the side(s) the fab requires (bottom/left, top/right, or half-width on all four; same wafer pattern, different layout origin).
2. Choose the **smallest leadframe** whose mount pad takes the die with 10–20 % margin in X and Y (oversized mount pads delaminate from the mold compound).
3. Place each block next to the pins it uses. Two copies of a block are **mirror-image placements of one cell** (less work, matched behaviour).
4. Reserve the routing area (the $R_f$ share) as explicit channels.
5. Overlay the leadframe drawing and place pads next to their fingers (below).
6. Mark every high-current lead with its DC current and allowed resistance.

```tikz title="Floorplan of the 8-pin dual op amp, scribe on the top and right, origin at the lower left. Mirrored amplifier cells sit beside their pins, the bias block between them, two narrow routing strips reserve the R_f share; the high-current leads (top metal) are marked with their DC currents. After Hastings Figs. 15.5 and 15.7."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % die with scribe on top and right
  \draw[scribe] (0,0) rectangle (8.5,8.5);
  \fill[white] (0,0) rectangle (8,8);
  \node[font=\scriptsize] at (4,8.25) {scribe street (top and right)};
  \draw[mone] (0,0) rectangle (8,8); \fill[white] (0.15,0.15) rectangle (7.85,7.85);
  \node[font=\scriptsize] at (0,-0.3) {$\times$ (0,0)};
  % core blocks
  \node[ana,minimum width=2.0cm,minimum height=5.2cm,anchor=south west] at (1.3,1.4) {};
  \node[ana,minimum width=1.2cm,minimum height=5.2cm,anchor=south west] at (3.4,1.4) {};
  \node[ana,minimum width=2.0cm,minimum height=5.2cm,anchor=south west] at (4.7,1.4) {};
  \node[font=\scriptsize,align=center] at (2.3,5.6) {AMP1\\0.32 mm$^2$\\inputs here};
  \node[font=\scriptsize,rotate=90] at (3.7,4.6) {BIAS 0.13 mm$^2$};
  \node[font=\scriptsize,align=center] at (5.7,5.6) {AMP2\\(mirror)\\inputs here};
  \fill[gray!20] (3.3,1.4) rectangle (3.4,6.6); \fill[gray!20] (4.6,1.4) rectangle (4.7,6.6);
  % pads
  \foreach \x/\y/\n in {4.0/7.3/1,0.65/5.8/2,0.65/4.0/3,0.65/2.2/4,4.0/0.7/5,7.35/2.2/6,7.35/4.0/7,7.35/5.8/8} {
    \draw[mtwo] (\x-0.35,\y-0.35) rectangle (\x+0.35,\y+0.35); \draw[por] (\x-0.25,\y-0.25) rectangle (\x+0.25,\y+0.25);
    \node[font=\scriptsize] at (\x,\y) {\n};
  }
  \foreach \y/\t in {5.8/IN1$-$,4.0/IN1$+$,2.2/OUT1} \node[font=\scriptsize,anchor=east] at (-0.1,\y) {\t};
  \foreach \y/\t in {5.8/IN2$-$,4.0/IN2$+$,2.2/OUT2} \node[font=\scriptsize,anchor=west] at (8.6,\y) {\t};
  \node[font=\scriptsize,anchor=south] at (4.0,8.55) {VCC};
  \node[font=\scriptsize,anchor=north] at (4.0,-0.1) {VEE (= substrate, merges with ground ring)};
  % output stages
  \draw[pwr] (1.5,1.9) rectangle (2.8,2.6); \node[font=\tiny] at (2.15,2.25) {Q1--Q2};
  \draw[pwr] (5.2,1.9) rectangle (6.5,2.6); \node[font=\tiny] at (5.85,2.25) {Q3--Q4};
  % high current leads (top metal)
  \draw[mtwo] (3.92,2.15) rectangle (4.08,6.95);
  \draw[mtwo] (2.8,2.15) rectangle (5.2,2.31);
  \draw[mtwo] (1.0,2.15) rectangle (1.5,2.31); \draw[mtwo] (6.5,2.15) rectangle (7.0,2.31);
  \draw[mtwo] (2.05,1.05) rectangle (2.21,1.9); \draw[mtwo] (5.79,1.05) rectangle (5.95,1.9);
  \draw[mtwo] (2.05,0.89) rectangle (5.95,1.05);
  \node[font=\tiny,rotate=90,fill=white,inner sep=1pt] at (4.25,4.3) {60 mA};
  \foreach \x/\y in {1.25/2.5,3.3/2.5,4.7/2.5,6.75/2.5,3.1/0.75,4.9/0.75} \node[font=\tiny,fill=white,inner sep=0.5pt] at (\x,\y) {30 mA};
  % thermal note
  \draw[<->,red!70!black] (9.9,2.4) -- (9.9,5.6);
  \node[font=\scriptsize,align=left,anchor=west,red!70!black] at (10.0,4.0) {elongated cell: inputs\\far from the hot\\output stage};
\end{circuitikz}
\end{document}
```

The amplifiers come out tall and thin, which helps: the inputs sit at the far end from the output transistors that dissipate heat. The supply pads go to the middle of the top and bottom edges, where their leads can reach all three blocks, and VEE (the substrate) merges with the ground ring around the die.

> [!tip] Remark
> Electromigration sets the *minimum* width of each marked lead, but metal resistance often forces much wider ones; marking currents on the floorplan exposes long, awkward leads before anything is drawn. The width rules are in [[Electromigration#Bias lines, power nets and output stages]].

### Pads against the leadframe

```tikz title="Bondpads against an 8-pin leadframe. (a) Each pad near its finger: no wire crosses or approaches another. (b) Bunched pads send wires over neighbouring ball bonds. After Hastings Fig. 15.6."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  \foreach \xo/\ttl/\bad in {0/{(a) acceptable: wires fan out, never cross}/0, 7.2/{(b) unacceptable: pads bunched, wires pass over neighbouring balls}/1} {
  \begin{scope}[xshift=\xo cm]
    % leadframe fingers (4 per side, left and right) in grey
    \foreach \y in {0.6,1.9,3.2,4.5} {
      \fill[gray!40,draw=black!50] (-0.2,\y-0.3) rectangle (0.9,\y+0.3);
      \fill[gray!40,draw=black!50] (5.1,\y-0.3) rectangle (6.2,\y+0.3);
    }
    \fill[gray!25,draw=black!50] (1.7,0.6) rectangle (4.3,4.5);
    \node[font=\tiny] at (3.0,0.8) {mount pad};
    \draw[fill=white,draw=black!60] (2.1,1.3) rectangle (3.9,3.8);
    \node[font=\tiny] at (3.0,2.55) {die};
    \foreach \y/\n in {4.5/1,3.2/2,1.9/3,0.6/4} \node[font=\tiny] at (0.35,\y) {\n};
    \foreach \y/\n in {0.6/5,1.9/6,3.2/7,4.5/8} \node[font=\tiny] at (5.65,\y) {\n};
    \ifnum\bad=0
      \foreach \py/\fy in {3.5/4.5,2.85/3.2,2.2/1.9,1.55/0.6} {
        \draw[mtwo] (2.15,\py-0.13) rectangle (2.41,\py+0.13);
        \draw[thick] (2.28,\py) -- (0.75,\fy);
        \draw[mtwo] (3.59,\py-0.13) rectangle (3.85,\py+0.13);
        \draw[thick] (3.72,\py) -- (5.25,\fy);
      }
    \else
      \foreach \py/\fy in {3.6/4.5,3.3/3.2,3.0/1.9,2.7/0.6} {
        \draw[mtwo] (2.15,\py-0.13) rectangle (2.41,\py+0.13);
        \draw[thick] (2.28,\py) -- (0.75,\fy);
      }
      \draw[red,thick] (2.28,3.6) circle (0.28);
      \foreach \py/\fy in {3.5/4.5,2.85/3.2,2.2/1.9,1.55/0.6} {
        \draw[mtwo] (3.59,\py-0.13) rectangle (3.85,\py+0.13);
        \draw[thick] (3.72,\py) -- (5.25,\fy);
      }
    \fi
    \node[font=\scriptsize] at (3.0,-0.3) {\ttl};
  \end{scope}}
\end{circuitikz}
\end{document}
```

- Start with each pad directly opposite its lead finger: shortest wires, widest separation (Hastings calls this "excellent").
- Pads may then slide to suit the core, but **bond wires must not cross or pass close to another wire or ball bond**. Bunched pads (b) force wires over neighbouring bonds and the bonder damages them.
- Have the assembly site verify the arrangement with its tools before layout continues.

### Analog, digital and RF partitions

```tikz title="Pad order is a circuit decision. (a) A clock and a digital supply sandwiched between analog inputs couple through bond-wire mutual inductance, and unequally into the two inputs. (b) Analog pins on one side shielded by their own grounds, supply beside its ground, digital pins on a perpendicular side. After Razavi Figs. 19.72-19.75."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  \foreach \xo/\ttl in {0/{(a) bad: clock and digital supply among analog pins},8.8/{(b) good: analog side and digital side perpendicular}} {
    \begin{scope}[xshift=\xo cm]
    \fill[white,draw=black!60] (1.8,1.2) rectangle (7.6,7.2);
    \draw[mone] (1.8,1.2) rectangle (7.6,7.2); \fill[white] (1.92,1.32) rectangle (7.48,7.08);
    \node[font=\scriptsize] at (3.6,-0.6) {\ttl};
    \end{scope}
  }
  % ---------- bad ----------
  \foreach \y/\t/\c in {6.4/AVDD/black,5.6/VIN$+$/green!50!black,4.8/CLK/violet,4.0/VIN$-$/green!50!black,3.2/DVDD/violet,2.4/AGND/black} {
    \draw[mtwo] (2.05,\y-0.25) rectangle (2.55,\y+0.25);
    \draw[thick,\c] (2.3,\y) -- (0.3,\y);
    \fill[gray!40,draw=black!50] (-0.6,\y-0.22) rectangle (0.3,\y+0.22);
    \node[font=\scriptsize,anchor=west,\c] at (2.65,\y) {\t};
  }
  \foreach \x/\t in {4.4/DGND,5.4/DOUT,6.4/D0} {
    \draw[mtwo] (\x-0.25,1.45) rectangle (\x+0.25,1.95);
    \draw[thick,violet] (\x,1.7) -- (\x,0.0);
    \node[font=\scriptsize,anchor=south,violet] at (\x,2.0) {\t};
  }
  \draw[<->,red,thick] (0.9,5.6) -- (0.9,4.8); \draw[<->,red,thick] (0.9,4.8) -- (0.9,4.0);
  \node[font=\scriptsize,red,align=left,anchor=west] at (3.6,4.4) {$M$: CLK edge couples\\unequally into VIN$+$, VIN$-$\\(asymmetric, not common mode)};
  \node[font=\scriptsize,red,align=left,anchor=west] at (3.6,3.2) {DVDD $dI/dt$ next to VIN$-$};
  % ---------- good ----------
  \begin{scope}[xshift=8.8cm]
  \foreach \y/\t/\c in {6.4/AVDD/black,5.8/AGND/black,5.0/VIN$+$/green!50!black,4.4/AGND/black,3.8/VIN$-$/green!50!black,3.0/AGND/black,2.4/REF/green!50!black} {
    \draw[mtwo] (2.05,\y-0.22) rectangle (2.55,\y+0.22);
    \draw[thick,\c] (2.3,\y) -- (0.3,\y);
    \fill[gray!40,draw=black!50] (-0.6,\y-0.2) rectangle (0.3,\y+0.2);
    \node[font=\scriptsize,anchor=west,\c] at (2.65,\y) {\t};
  }
  \foreach \x/\t in {4.0/DVDD,4.9/DGND,5.8/CLK,6.7/DOUT} {
    \draw[mtwo] (\x-0.22,1.45) rectangle (\x+0.22,1.95);
    \draw[thick,violet] (\x,1.7) -- (\x,0.0);
    \node[font=\scriptsize,anchor=south,violet] at (\x,2.0) {\t};
  }
  \node[font=\scriptsize,align=left,anchor=west] at (3.6,5.6) {AVDD beside AGND:\\loop $L$ falls by $M$};
  \node[font=\scriptsize,align=left,anchor=west] at (3.6,4.3) {quiet AGND wires\\between and around\\the input pair};
  \node[font=\scriptsize,align=left,anchor=west] at (3.6,2.9) {digital wires $\perp$\\analog wires};
  \end{scope}
  \node[font=\scriptsize,anchor=west] at (-0.6,7.6) {package fingers $\leftarrow$ bond wires $\leftarrow$ pads};
\end{circuitikz}
\end{document}
```

Rules (Razavi §19.3–19.4, Hastings §15.2):

1. **Split the die into a quiet side and a noisy side.** Digital logic, output drivers, clock buffers and charge pumps together; references, ADC inputs, high-gain stages and low-current bias together. RF/VCO blocks get their own corner and ring.
2. **Pads follow their blocks.** Analog pins on one side, digital pins on another, preferably **perpendicular** sides: bond wires at 90° couple little magnetic flux.
3. **Separate supply and ground pins** for analog and digital (and a third, quieter supply for clock drivers that feed samplers, Razavi Fig. 19.64).
4. **Put a quiet ground wire between critical bond wires** (around a differential input pair) and pair each supply pad with its ground pad.
5. **Keep a differential input pair symmetric** with respect to every aggressor. Differential signalling only cancels coupling that is the same on both wires.

$$
\boxed{v_{victim}=M\frac{dI_{agg}}{dt}}\qquad
\boxed{L_{\parallel}=\frac{L_S+M}{2}}\qquad
\boxed{L_{loop}=2L_S-M\ \text{(Razavi)}}
$$

> [!tip] Remark
> Separate supply pins remove the conducted path but not the magnetic one; $M$ is what is left, so the pad frame must be designed, not just numbered. The substrate side of the same partition (guard rings, which ground the substrate contact goes to, how far is far enough) is in [[Substrate Noise#Floorplanning and Spacing]] and [[Substrate Noise#Separate Supplies, Grounds and Substrate Contacts]]. Bond-wire and package inductance values are in [[Packaging]].

> [!note]- Derivation: the three inductance results (Razavi §19.4, pp. 771–772)
> - **Victim voltage.** A victim wire carrying no current of its own links the aggressor's flux: $v = M\,dI_{agg}/dt$. Adjacent package wires can reach $M$ comparable to half of $L_S$, so splitting the supplies onto separate pins does not by itself make the analog supply quiet.
> - **Two wires in parallel.** Each carries $I/2$ and links its own flux plus its neighbour's (same direction): $v = (L_S+M)\,d(I/2)/dt$, so $L_{eq}=(L_S+M)/2$, not $L_S/2$. Parallel bond wires on adjacent pads buy less than a factor of two.
> - **Supply next to its ground.** The currents are equal and opposite, so the mutual term subtracts. Razavi writes the pair's total as $2L_S - M$. With $M$ read as the pairwise coefficient, two cross terms give $2(L_S - M)$; either way, pairing a supply with its own return lowers the loop inductance.
> - **Reducing $M$:** perpendicular wires (terminate on perpendicular die sides), or quiet ground wires interposed between the critical ones; even occasional ground wires among parallel lines make the coupling negligible (Razavi Fig. 19.74).

### Heat, stress and symmetry axes

```tikz title="Heat and stress placement. (a) Power device in a corner: isotherms cross a nearby pair diagonally, and the far corner has maximum shear stress. (b) Power at one end of a die axis, matched array on the same axis toward the far end: isotherms cross the axis at right angles. After Hastings Figs. 8.13, 8.21 and 15.10."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % ---------- (a) bad ----------
  \begin{scope}
  \draw[fill=white,draw=black!70] (0,0) rectangle (6,4);
  \begin{scope} \clip (0,0) rectangle (6,4); \foreach \r/\o in {0.5/50,1.0/35,1.6/22,2.3/12} \draw[red!\o!white,thick] (0.1,0.15) ++(0:\r) arc (0:90:\r); \end{scope}
  \node[pwr,minimum width=1.0cm,minimum height=0.8cm] at (0.6,0.5) {power};
  \node[ana,minimum width=1.0cm,minimum height=0.6cm] at (1.75,1.15) {A\,B};
  \node[ana,minimum width=0.9cm,minimum height=0.6cm] at (5.45,3.6) {C\,D};
  \draw[pattern=north east lines,pattern color=red!60] (6,4) -- (5.3,4) -- (6,3.3) -- cycle;
  \draw[->,red!70!black] (2.6,1.8) -- (2.0,1.35);
  \node[font=\scriptsize,align=left,anchor=west,red!70!black] at (2.4,2.1) {steep isotherms cross\\the pair diagonally};
  \node[font=\scriptsize,align=left,anchor=west,red!70!black] at (2.6,3.1) {corner: maximum\\shear stress};
  \draw[->,red!70!black] (4.6,3.35) -- (5.0,3.55);
  \node[font=\scriptsize] at (3,-0.4) {(a) bad: power in a corner; pairs beside it and in a corner};
  \end{scope}
  % ---------- (b) good ----------
  \begin{scope}[xshift=7cm]
  \draw[fill=white,draw=black!70] (0,0) rectangle (6,4);
  \draw[dash dot,thick,red!70!black] (0,2) -- (6,2);
  \begin{scope} \clip (0,0) rectangle (6,4); \foreach \r/\o in {0.5/50,1.0/35,1.6/22,2.3/12} \draw[red!\o!white,thick] (0.0,2) ++(-90:\r) arc (-90:90:\r); \end{scope}
  \node[pwr,minimum width=0.9cm,minimum height=1.2cm] at (0.5,2) {power};
  \node[ana,minimum width=1.0cm,minimum height=0.6cm] at (4.6,2) {A\,B\,B\,A};
  \draw[<->] (0.95,1.0) -- (4.1,1.0) node[midway,below,font=\scriptsize] {far end, on the axis};
  \node[font=\scriptsize,align=left,anchor=west] at (2.5,3.2) {isotherms cross the axis at $90^\circ$:\\each half of the pair sees the same $T$};
  \node[font=\scriptsize,red!70!black] at (5.2,1.7) {axis};
  \node[font=\scriptsize] at (3,-0.4) {(b) good: power and matched array on one axis};
  \end{scope}
\end{circuitikz}
\end{document}
```

1. **Power devices on a die axis, at one end.** Isotherms around a source on an axis cross that axis at right angles.
2. **Matched arrays on the same axis, toward the other end** (Hastings Rule: about three-quarters of the way from the centre to the far edge for exceptional matching on a power IC). Two power devices: either one behind the other at one end, or one at each end with the matched devices between them.
3. **Nothing precise near edges or in corners:** package stress gradients are largest there. The quiet zone for stress is near the die centre on an axis, so the thermal and stress optima compete; resolve it on the axis.
4. **Keep thick-metal edges (power copper, bump/pillar perimeters) off matched devices,** and avoid matched analog under bondpads unless the BOAC stack has thick top metal (then keep the pair well inside or well outside the thick-metal shape).
5. **Mirror symmetric blocks about a die axis** so both halves see the same gradient (the dual op amp's AMP1/AMP2).

> [!tip] Remark
> The numbers behind these rules (≈2 mV/°C for $V_{TH}$, piezo coefficients, the 1 µm-per-mW guide, die aspect ratio ≤ 1.5:1 in plastic) are in [[Device Matching#Temperature and Heat Sources]] and [[Device Matching#Mechanical Stress and Package Shift]]. The floorplan's only job is to give the matched array a place on the axis, far from heat and edges.

### Routing channels and choke points

```tikz title="Routing channels. (a) A jigsaw of blocks pinches the channels at two choke points. (b) Wide primary channels cross near the die centre and narrow feeders branch off them. After Hastings Fig. 15.8 and Sec. 15.4.3."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % ---------- (a) choke points ----------
  \begin{scope}
  \draw[fill=cyan!8,draw=black!70] (0,0) rectangle (6,5);
  \foreach \a/\b/\c/\d in {0.2/3.6/1.3/4.8, 1.5/3.2/2.3/4.8, 2.5/3.2/3.3/4.8, 3.5/3.6/5.8/4.8, 0.2/2.0/1.9/3.0, 2.15/1.9/2.95/2.95, 3.05/2.2/4.6/2.95, 4.75/1.8/5.8/3.4, 0.2/0.2/1.6/1.7, 1.85/0.2/3.3/1.6, 3.5/0.2/4.0/1.6, 4.2/0.2/5.8/1.55}
    \draw[fill=orange!30,draw=black!70] (\a,\b) rectangle (\c,\d);
  \draw[red,thick] (2.05,1.75) circle (0.28); \draw[red,thick] (3.0,3.08) circle (0.28);
  \node[font=\scriptsize,red,anchor=west] at (6.1,3.1) {choke points:};
  \node[font=\scriptsize,red,anchor=west,align=left] at (6.1,2.5) {a block corner pinches\\the channel to $\sim$1 track};
  \node[font=\scriptsize] at (3,-0.4) {(a) jigsaw floorplan (after Hastings Fig.\ 15.8)};
  \end{scope}
  % ---------- (b) watercourse ----------
  \begin{scope}[xshift=9.6cm]
  \draw[fill=cyan!8,draw=black!70] (0,0) rectangle (6,5);
  \foreach \a/\b/\c/\d in {0.2/3.0/2.4/4.8, 3.6/3.0/5.8/4.8, 0.2/0.2/2.4/2.0, 3.6/0.2/5.8/2.0}
    \draw[fill=orange!30,draw=black!70] (\a,\b) rectangle (\c,\d);
  \fill[cyan!35] (2.4,0) rectangle (3.6,5); \fill[cyan!35] (0,2.0) rectangle (6,3.0);
  \fill[cyan!20] (0.2,2.0) rectangle (2.4,2.0);
  \foreach \a/\b/\c/\d in {0.2/3.0/2.4/4.8, 3.6/3.0/5.8/4.8, 0.2/0.2/2.4/2.0, 3.6/0.2/5.8/2.0}
    \draw[fill=orange!30,draw=black!70] (\a,\b) rectangle (\c,\d);
  \draw[fill=cyan!20,draw=none] (1.2,3.0) rectangle (1.45,4.8); \draw[fill=cyan!20,draw=none] (4.6,0.2) rectangle (4.85,2.0);
  \node[font=\scriptsize,align=center] at (3.0,2.5) {primary channels\\10--20\,\% of signals each};
  \node[font=\tiny,rotate=90] at (1.33,3.9) {feeder $\geq$5};
  \node[font=\tiny,rotate=90] at (4.73,1.1) {feeder $\geq$5};
  \node[font=\scriptsize] at (3,-0.4) {(b) wide primary channels cross mid-die, feeders branch off};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Two or three **primary channels** carry most signals and cross near the die centre. Size each for **10–20 % of all top-level signals** (100 signals → room for about 20 per primary channel).
- Primary channels can narrow toward the die edges; **feeder channels** narrow away from the primaries, but never below **5 signals**: you cannot tell in advance what will need to pass, and channels **cannot be widened once routing has begun**.
- A careless block placement pinches a channel into a **choke point**. Find them on the floorplan, not during routing.

## Level 2: Constructing the Padring

### Assembly order

```tikz title="Assembly order: plan, build the padring from the outside in, drop in power devices, analog cells and logic, route the top level, verify, review, tape out. Dashed: revise the floorplan when a cell outgrows its slot. After Hastings Ch. 15 introduction."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  \tikzset{st/.style={draw,rounded corners,align=center,font=\scriptsize,minimum height=0.9cm,text width=2.3cm,fill=white},
           pl/.style={st,fill=yellow!15}, ly/.style={st,fill=blue!8}, vf/.style={st,fill=green!10}}
  \node[pl] (a) at (0,0) {die-area estimate\\(cells, power, $R_f$, $P_f$)};
  \node[pl] (b) at (3.0,0) {die size, leadframe,\\pad list \& order};
  \node[pl] (c) at (6.0,0) {floorplan\\(blocks, pads,\\power leads)};
  \node[ly] (d) at (9.0,0) {scribe seal +\\ground ring};
  \node[ly] (e) at (9.0,-1.6) {ESD devices,\\bondpads,\\guard rings};
  \node[ly] (f) at (6.0,-1.6) {power devices:\\place, route,\\review};
  \node[ly] (g) at (3.0,-1.6) {analog cells:\\lay out, verify,\\drop in};
  \node[ly] (h) at (0,-1.6) {autorouted logic\\(check pin\\alignment)};
  \node[ly] (i) at (0,-3.2) {top-level routing\\(hand or auto)};
  \node[vf] (j) at (3.0,-3.2) {final DRC, LVS,\\antenna, EM, ESD,\\latch-up checks};
  \node[vf] (k) at (6.0,-3.2) {final layout\\review (checklist)};
  \node[vf] (l) at (9.0,-3.2) {tape-out: PG,\\masks, archive};
  \foreach \u/\v in {a/b,b/c,c/d,d/e,e/f,f/g,g/h,h/i,i/j,j/k,k/l} \draw[->,thick] (\u) -- (\v);
  \draw[->,dashed] (g.north) to[bend left=20] (c.south);
  \node[font=\scriptsize,anchor=west] at (-1.2,0.9) {planning};
  \node[font=\scriptsize,anchor=west] at (-1.2,-0.8) {assembly};
  \node[font=\scriptsize,anchor=west] at (-1.2,-4.05) {sign-off};
\end{circuitikz}
\end{document}
```

A wire-bonded die is built from the outside in: scribe seal and ground ring first, then ESD devices, bondpads and their guard rings (reviewed), then power devices, then analog cells, then autorouted logic as successive versions arrive. Bumped dice start the same way (scribe, seal, ground ring), then under-bump metal and bumps or pillars, then ESD devices placed in the periphery or next to each bump.

### Scribe streets

- Wafers are thinned by **backgrind** (200 mm wafers start ≈725 µm, 300 mm ≈775 µm; traditionally ground to ≈250 µm, as thin as 50 µm) and then **singulated**.
- A diamond saw (blade 20–30 µm) cuts a kerf as wide as the blade, flanked by 15–25 µm of chipping margin: scribe streets much below **50 µm** are impossible, **75 µm** is reasonable. Stealth (laser) dicing leaves only a ≈6 µm damage zone, so streets can shrink to about 25 µm, worth it for small dice.
- Fab test structures live in the street. The mask shop builds a **composed reticle**: the main die (data from (0,0) to $(X_{die},Y_{die})$, the outside of the scribe seal) is arrayed into holes in a separately generated **scribe frame**. Load both into a mask viewer once to check they line up.

### Scribe seal, ground ring and corner exclusion

```tikz title="(a) Die corner, top view: scribe street, scribe seal (PSD with continuous contact and via rings), slotted M1 ground ring chamfered around the corner exclusion zone, pads kept clear of it. (b) Anti-delamination slots must run along the edge; slots across the lead resist delamination poorly and block current. After Hastings Figs. 15.10-15.11."
\usepackage{circuitikz}
\usetikzlibrary{patterns,calc}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % ---------- (a) die corner, top view ----------
  \begin{scope}
  \draw[scribe] (-0.6,-0.6) rectangle (6.4,0.0); \draw[scribe] (6.4,-0.6) rectangle (7.0,6.0);
  \node[font=\scriptsize] at (2.6,-0.3) {scribe street (saw kerf + margins)};
  \node[font=\scriptsize,rotate=90] at (6.7,3.0) {scribe street};
  % seal: PSD strip with continuous contact ring and via ring
  \draw[pdiff] (-0.6,0.0) -- (6.4,0.0) -- (6.4,6.0) -- (6.1,6.0) -- (6.1,0.3) -- (-0.6,0.3) -- cycle;
  \draw[cont] (-0.6,0.12) rectangle (6.25,0.2); \draw[cont] (6.2,0.12) rectangle (6.28,6.0);
  % ground ring M1 hugging the seal, chamfered round the exclusion zone
  \draw[mone] (-0.6,0.3) -- (3.8,0.3) -- (6.1,2.6) -- (6.1,6.0) -- (5.2,6.0) -- (5.2,2.97) -- (3.43,1.2) -- (-0.6,1.2) -- cycle;
  % exclusion triangle
  \draw[pattern=north east lines,pattern color=black!60,draw=black!60] (3.8,0.3) -- (6.1,0.3) -- (6.1,2.6) -- cycle;
  \node[font=\scriptsize,align=center,fill=white,inner sep=1pt] at (5.35,0.95) {corner\\exclusion};
  % slots: parallel to edge on straight runs, parallel to diagonal on the chamfer
  \foreach \x in {-0.3,0.6,1.5,2.4} { \fill[white,draw=black!50] (\x,0.6) rectangle (\x+0.6,0.72); \fill[white,draw=black!50] (\x+0.45,0.85) rectangle (\x+1.05,0.97); }
  \foreach \y in {3.4,4.3,5.2} { \fill[white,draw=black!50] (5.5,\y) rectangle (5.62,\y+0.6); \fill[white,draw=black!50] (5.75,\y-0.45) rectangle (5.87,\y+0.15); }
  \foreach \t in {0.25,0.5,0.75} { \fill[white,draw=black!50,rotate around={45:($(3.6,0.75)!\t!(5.65,2.8)$)}] ($(3.6,0.75)!\t!(5.65,2.8)$) ++(-0.3,-0.06) rectangle ++(0.6,0.12); }
  % pads near the corner keep out of the zone
  \draw[mtwo] (1.6,1.5) rectangle (2.4,2.3); \draw[por] (1.7,1.6) rectangle (2.3,2.2);
  \draw[mtwo] (4.4,3.6) rectangle (5.0,4.4); \draw[por] (4.48,3.68) rectangle (4.92,4.32);
  \draw[<->] (6.55,0.3) -- (6.55,2.6) node[midway,right,font=\scriptsize] {$d_c$};
  \node[font=\scriptsize,anchor=west] at (-0.6,2.75) {ground ring (M1, slotted)};
  \draw[->] (0.6,2.6) -- (0.6,1.05);
  \node[font=\scriptsize,anchor=west] at (-0.6,3.35) {scribe seal: PSD + contact/via rings};
  \draw[->] (-0.4,3.2) -- (-0.4,0.25);
  \node[font=\scriptsize] at (3,-1.0) {(a) die corner: slots run along the current and along the edge};
  \end{scope}
  % ---------- (b) good vs bad slot orientation ----------
  \begin{scope}[xshift=8.6cm,yshift=1.0cm]
  \draw[thick] (0,0) -- (4.4,0); \node[font=\scriptsize,anchor=west] at (4.45,0) {die edge};
  \draw[mone] (0,0.3) rectangle (4.4,1.3);
  \foreach \x in {0.2,1.2,2.2,3.2} { \fill[white,draw=black!50] (\x,0.55) rectangle (\x+0.7,0.67); \fill[white,draw=black!50] (\x+0.5,0.93) rectangle (\x+1.2,1.05); }
  \node[font=\scriptsize,green!40!black,anchor=west] at (0,1.55) {good: long side $\parallel$ edge ($\perp$ shear gradient)};
  \draw[mone] (0,2.3) rectangle (4.4,3.3);
  \foreach \x in {0.3,0.9,1.5,2.1,2.7,3.3,3.9} { \fill[white,draw=black!50] (\x,2.45) rectangle (\x+0.12,3.15); }
  \node[font=\scriptsize,red!70!black,anchor=west] at (0,3.55) {bad: slots across the lead};
  \node[font=\scriptsize,red!70!black,anchor=west,align=left] at (0,4.15) {(less delamination resistance;\\also blocks current: $R\uparrow$)};
  \draw[->,thick] (4.6,0.8) -- (5.2,0.8) node[right,font=\scriptsize] {$I$};
  \node[font=\scriptsize] at (2.2,-1.0) {(b) anti-delamination slots};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Scribe seal:** continuous strips of every metal joined by continuous contact and via rings, on a substrate diffusion (PSD in CMOS), with an overcoat flap-down. It keeps moisture and mobile ions out of the exposed oxide edges and stops cracks.
- **Ground ring:** widen the seal metal into a substrate ring that every ESD device returns to. Budget: total metal resistance through the ESD network between any two pads ≤ about **2 Ω**. Most dice merge the substrate supply (ground, or VEE on a dual-supply part) into it.
- **Corner exclusion zones:** plastic-packaged dice above a site-specific size (typically longest side > 2.5 mm) get triangular keep-outs, legs $d_c\geq 5\,\%$ of the longer die side (5 mm die → 250 µm). No circuitry, not even the ground ring. Some fabs want anti-delamination mesh, test structures or die ID there; some run the seal diagonally, some to the corner.
- **Anti-delamination slots** in wide metal near the edges: long side **parallel to the die edge** (or to the corner diagonal), i.e. perpendicular to the shear-stress gradient; stagger alternate columns and offset slots on adjacent layers. Drawn on a slot layer: `FINAL_MET1 = MET1 - MET1SLOT`.

$$
\boxed{\frac{R_{slot}}{R_{unslot}}\approx\frac{W L_S}{(S_L+L_S)(W-N_SW_S)}+\frac{S_L}{S_L+L_S}}
$$

($W$ lead width, $W_S$, $L_S$ slot width and length, $S_L$ slot spacing along the lead, $N_S$ average slots across it.) Slots along the current cost little resistance.

> [!tip] Remark
> Seal construction rule by rule is in [[Failure Mechanisms#Scribe Seals]]; the 2 Ω substrate-return budget and how to check it (worst case between diametrically opposite pads) is in [[Guard Rings, ESD and Interconnect#Rail Clamps and Whole-Chip Strategy]]. Slots for *stress migration and density* follow different reasons; see [[Guard Rings, ESD and Interconnect#Wide-Metal Slotting]].

### Bondpads

```tikz title="Ball-bond pad. (a) Cross-section: top metal and next metal joined by a via ring under a POR opening about 3 wire diameters wide; overcoat overlaps the metal so no interlevel oxide is exposed. (b) Top view with the metal exclusion circle and the widened lead. After Hastings Figs. 15.12, 15.14 and Razavi Fig. 19.49."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % ---------- (a) cross-section ----------
  \begin{scope}
  \fill[orange!12,draw=black!60] (0,0) rectangle (6.4,1.2); \node[font=\scriptsize] at (0.9,0.5) {silicon};
  \fill[gray!8,draw=black!40] (0,1.2) rectangle (6.4,2.4);
  \node[font=\tiny] at (0.55,1.8) {ILO};
  \draw[mone] (1.2,1.55) rectangle (5.2,1.8);
  \foreach \x in {1.4,1.75,4.45,4.8} \fill[black] (\x,1.8) rectangle (\x+0.15,2.4);
  \draw[mtwo] (1.0,2.4) rectangle (5.4,2.75);
  \fill[magenta!40,draw=black!60] (0,2.4) -- (1.0,2.4) -- (1.0,2.75) -- (1.6,2.75) -- (1.6,3.0) -- (0,3.0) -- cycle;
  \fill[magenta!40,draw=black!60] (6.4,2.4) -- (5.4,2.4) -- (5.4,2.75) -- (4.8,2.75) -- (4.8,3.0) -- (6.4,3.0) -- cycle;
  \draw[fill=orange!60!yellow,draw=black!70] (2.0,2.75) .. controls (1.9,3.3) and (2.3,3.5) .. (2.7,3.5) -- (2.7,4.2) -- (3.7,4.2) -- (3.7,3.5) .. controls (4.1,3.5) and (4.5,3.3) .. (4.4,2.75) -- cycle;
  \draw[thick,orange!60!black] (3.2,4.2) -- (3.2,4.9);
  \node[font=\scriptsize,anchor=west] at (3.35,4.6) {wire, diameter $D$};
  \node[font=\scriptsize] at (3.2,3.2) {ball};
  \node[font=\scriptsize,anchor=west] at (5.0,3.2) {PO (nitride)};
  \draw[<->] (1.6,5.25) -- (4.8,5.25) node[midway,above,font=\scriptsize] {POR opening $\approx 3D$};
  \draw[dashed] (1.6,3.0) -- (1.6,5.25); \draw[dashed] (4.8,3.0) -- (4.8,5.25);
  \node[font=\scriptsize,align=left,anchor=west] at (6.6,1.7) {top metal +\\next metal,\\via ring:\\resists lift-off};
  \node[font=\scriptsize] at (3.2,-0.4) {(a) cross-section (after Hastings Figs.\ 15.12, 15.14; Razavi Fig.\ 19.49)};
  \end{scope}
  % ---------- (b) top view ----------
  \begin{scope}[xshift=9.6cm,yshift=0.2cm]
  \draw[dashed,black!60] (2,2.2) circle (2.15);
  \draw[mtwo] (0.5,0.7) rectangle (3.5,3.7);
  \draw[por] (0.75,0.95) rectangle (3.25,3.45);
  \foreach \x in {0.58,3.32} \foreach \y in {0.85,1.25,...,3.5} \fill[black] (\x,\y) rectangle (\x+0.1,\y+0.1);
  \draw[mtwo] (1.7,-0.9) rectangle (2.3,0.7);
  \draw[mtwo] (1.85,-1.6) rectangle (2.15,-0.9);
  \node[font=\scriptsize,anchor=west] at (2.4,-0.4) {widened lead (e.g.\ $\geq 10\,\mu$m within $25\,\mu$m)};
  \node[font=\scriptsize,align=center] at (2,2.2) {POR\\(no ILO exposed)};
  \node[font=\scriptsize,anchor=west] at (4.2,3.9) {metal exclusion zone};
  \node[font=\scriptsize,anchor=west] at (4.2,3.45) {(dia.\ $\approx$ opening $+50\,\mu$m)};
  \node[font=\scriptsize] at (2,4.6) {next pad: pitch $\geq 5D$ centre to centre};
  \node[font=\scriptsize] at (2,-2.0) {(b) top view};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Bondpad rule (Hastings §15.3.3; examples, every site differs) | Value |
|---|---|
| POR opening | ≈ 3 × wire diameter (25 µm wire → 75 µm) |
| Centre-to-centre pitch | ≈ 5 × wire diameter (→ 125 µm) |
| Top metal overlaps the POR | enough that no ILO is exposed in the opening |
| Metal exclusion zone (unrelated metal) | circle ≈ 50 µm wider than the opening |
| Lead into the pad | widened, e.g. ≥ 10 µm within 25 µm of the pad |
| Pad #1 | often marked: notched, octagonal or circular opening |

- Typical analog ball bonding: **25 µm Cu or Pd-coated-Cu wire at 125 µm pitch**; fine-pitch bonders reach 60 µm with 20 µm wire.
- **Pad stack:** two top metals joined by vias resist lift-off but add capacitance. Razavi Example 19.6 (75 × 75 µm): **38 fF** for a single top-metal pad, **60 fF** for top + next metal. An **octagonal pad** (corners cut, $a=b$) cuts area and perimeter by about 20 % for high-frequency pins.
- **Bond over active circuitry (BOAC):** topmost metal for the pad, few top vias beneath it, sparse thin next-to-top metal, dense lower via arrays welcome. Keep matched analog out from under pads in thin-Al stacks.
- **Bond-wire resistance** $R_w = 4\rho L/(\pi D^2)$: 1 mm of 25 µm 4N gold ≈ **47 mΩ**, +37 % from 25 °C to 125 °C. One package pin takes two or three 25 µm wires.

> [!note]- Detail: probe pads, bumps and pillars (Hastings §15.3.3–15.3.4)
> - **Probe (trim) pads** are only used at wafer probe, so need no ESD. POR opening ≥ max(2× tip diameter, 75 % of the minimum pitch). Blade cards: ≤ ≈88 probes, pitch ≥ 100 µm. Epoxy-ring cards: up to 2000 probes, pitch down to 50 µm. Old 1.5 mil tips → 75 µm openings; 1.0 and 0.7 mil tips allow 65 µm, carefully 50 µm. Put them between bondpads around the edge; if that is not enough, two **offset ranks** separated by at least the minimum probe pitch; beyond that, trim in-package (EPROM/EEPROM) instead.
> - **Bumps and pillars** spread the I/O over the whole die face, so ESD devices can sit next to each bump instead of in a peripheral ring. Bump-on-I/O is limited to small arrays by thermal-mismatch stress; a polymer (BCB) layer under the redistribution copper adds compliance; copper pillars reach finer pitches, can be oval for current and conduct heat about 5× better than solder. Solder joints carry only about 2 % of aluminium's EM current density. Package-level detail belongs to [[Packaging]].

### Pad order, power pads and ESD in the ring

How many supply pads? Each bond wire plus package lead is an inductor $L$; $N$ pads in parallel carrying a current step $\Delta I$ in $\Delta t$ bounce by $L\Delta I/(N\Delta t)$ (ignoring mutual coupling, which makes it worse):

$$
\boxed{N_{pads}\ \geq\ \frac{L\,\Delta I}{\Delta t\,\Delta V_{max}}}
$$

> [!example] Worked example (Razavi Example 19.7)
> A 2 V processor's supply current changes by 25 A in about 5 ns. With 200 VDD and 200 ground bond wires at 5 nH each: $\Delta V = 5\ \text{nH}\cdot(25/200)/5\ \text{ns} = 125$ mV per rail, up to 250 mV if supply and ground bounce add (> 10 % of $V_{DD}$). The design added an external 1 µF capacitor bonded on top of the chip through 160 more supply/ground pairs.

Rules for the ring:

1. **Every pin gets its ESD device in the ring, right behind its pad,** returning to the ground ring (pad-based) or to both rails plus distributed rail clamps (rail-based). Substrate-ground pads need none of their own.
2. **Two pads on one package pin need two ESD devices** (each bond wire is ≈1 nH/mm, volts during a CDM event).
3. **Separate supply domains** meet only through ESD diodes (antiparallel pairs between grounds), never through metal.
4. **Gaps between pads** in a core-limited die are where ESD devices and non-critical circuitry go.
5. **Pad order** follows the partition: quiet analog pins together, shielded by their own grounds; noisy pins together on another side.

> [!tip] Remark
> Clamp types, sizing and the pad-based vs rail-based choice are in [[Guard Rings, ESD and Interconnect#Rail Clamps and Whole-Chip Strategy]]; how wide the ESD metal must be is in [[Guard Rings, ESD and Interconnect#ESD Metal and Layout]]. The padring only has to leave room for them next to every pad.

## Level 3: Manual Top-Level Interconnection

Small analog dice are still faster to wire by hand than to autoroute. Two strategies:

- **Channel routing:** signals run in reserved channels between blocks. Uses area, but easy, predictable and modifiable. The default.
- **Maze routing:** signals run over or through blocks. Saves about **5–10 %** of die area, but is slower, harder to change, and couples wires into whatever lies underneath.

Single-level metal needs hand-crafted devices and tunnels; above about 50 components double-level metal is cheaper overall.

### Vias

| Via technology (Hastings Table 15.3) | Stackable | Lower metal must enclose | Upper metal must enclose |
|---|---|---|---|
| Aluminium | no | yes | yes |
| Tungsten plug | yes | yes (2 sides) | optional |
| Single damascene | yes | optional | optional |
| Dual damascene | yes | optional | optional |

- All vias usually have **one fixed size**; carry current with **arrays of minimum vias**, not bigger vias (exceptions only for seals and pads).
- Many fabs demand **via pairs**: voids from thermal-cycling stress sever single vias at random, and neighbouring vias protect each other beyond simple redundancy.
- Where a **wide lead changes layer**, cross the two leads fully and fill the whole overlap with vias (D13). Do the same where a narrow lead branches off a wide one; the vias cost no extra area.

> [!tip] Remark
> Why the via in the inside corner of a bend carries most of the current, and why to put via arrays in straight segments, is [[Electromigration#Via arrays and redundancy]] and [[Electromigration#Corners and current crowding]].

### Routing pitch and grid

```tikz title="Three routing pitches: lead-to-lead (minimum leads that can take a via), via-to-via (leads widened for a via, the usual choice), via-to-lead (staggered vias, tightest but congests intersections). After Hastings Fig. 15.22 and Table 15.4."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % (A) lead-to-lead
  \begin{scope}
  \draw[mone] (0,0) rectangle (3,0.4); \draw[mone] (0,0.8) rectangle (3,1.2); \draw[mone] (0,1.6) rectangle (3,2.0);
  \draw[<->] (-0.3,0.2) -- (-0.3,1.0) node[midway,left,font=\scriptsize] {$P_{LTL}$};
  \draw[<->] (3.2,0.8) -- (3.2,1.2) node[midway,right,font=\scriptsize] {$W_m$};
  \draw[<->] (3.2,0.4) -- (3.2,0.8) node[midway,right,font=\scriptsize] {$S_m$};
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {(a) lead-to-lead\\$P_{LTL}=W_m+S_m$};
  \end{scope}
  % (B) via-to-via
  \begin{scope}[xshift=5.2cm]
  \foreach \y in {0,0.95,1.9} { \draw[mone] (0,\y) rectangle (3,\y+0.55); \fill[black] (1.3,\y+0.1) rectangle (1.65,\y+0.45); }
  \draw[<->] (-0.3,0.275) -- (-0.3,1.225) node[midway,left,font=\scriptsize] {$P_{VTV}$};
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {(b) via-to-via (usual)\\$P_{VTV}=W_v+2E_{mv}+S_m$};
  \end{scope}
  % (C) via-to-lead (staggered)
  \begin{scope}[xshift=11.6cm]
  \draw[mone] (0,0) rectangle (3,0.4); \draw[mone] (0.6,-0.075) rectangle (1.15,0.475); \fill[black] (0.7,0.025) rectangle (1.05,0.375);
  \draw[mone] (0,0.8) rectangle (3,1.2); \draw[mone] (1.8,0.725) rectangle (2.35,1.275); \fill[black] (1.9,0.825) rectangle (2.25,1.175);
  \draw[mone] (0,1.6) rectangle (3,2.0); \draw[mone] (0.6,1.525) rectangle (1.15,2.075); \fill[black] (0.7,1.625) rectangle (1.05,1.975);
  \draw[<->] (-0.3,0.2) -- (-0.3,1.0) node[midway,left,font=\scriptsize] {$P_{VTL}$};
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {(c) via-to-lead (staggered)\\$P_{VTL}=\tfrac{W_v+W_m}{2}+E_{mv}+S_m$};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (0,-1.6) {Hastings Table 15.4 rules ($W_m=S_m=0.3$, $W_v=0.25$, $E_{mv}=0.05\,\mu$m): $P_{LTL}=0.6$, $P_{VTV}=0.65$, $P_{VTL}=0.625\,\mu$m;\\a 0.35\,$\mu$m path is off a 0.05\,$\mu$m coding grid, so draw 0.4\,$\mu$m leads at a 0.7\,$\mu$m pitch.};
\end{circuitikz}
\end{document}
```

$$
\boxed{P_{LTL}=W_m+S_m}\qquad
\boxed{P_{VTV}=W_v+2E_{mv}+S_m}\qquad
\boxed{P_{VTL}=\tfrac{W_v+W_m}{2}+E_{mv}+S_m}\qquad
\boxed{W_C=N P_R+S_m}
$$

- Use **via-to-via pitch** (leads widened so a via fits without jogs). Staggering vias for via-to-lead pitch congests channel intersections.
- Every path edge must land on the **coding grid** (D12's 0.35 µm lead fails on a 0.05 µm grid). A routing grid must be an integer multiple of the coding grid: "consistent" if lead edges fall on it, "inconsistent" if only centrelines do (faster, but needs practice).
- If metal layers have slightly different rules, route all of them at the **largest** rule so tracks line up.
- Route **Manhattan**. 45° leads (e.g. along a corner exclusion zone) put outline vertices off grid; if the rules widen diagonal segments, compute the pitch with the diagonal width.

### Channel routing

```tikz title="A channel-routed layout: M1 drops vertically from block ports, M2 runs horizontally in the channel, the wide VDD lead takes the outside track and changes layer through a full via array. Inset: a jog steals a track and pushes congestion along the channel. After Hastings Figs. 15.24-15.25."
\usepackage{circuitikz}
\usetikzlibrary{patterns,decorations.pathreplacing}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  % blocks
  \node[blk,fill=yellow!25,minimum width=4.4cm,minimum height=2.0cm,anchor=south west] at (0,3.2) {};
  \node[blk,fill=yellow!25,minimum width=3.6cm,minimum height=2.0cm,anchor=south west] at (6.2,3.2) {};
  \node[font=\scriptsize] at (2.2,4.6) {circuit block};
  \node[font=\scriptsize] at (8.0,4.6) {circuit block};
  % channel tracks (M2 horizontal) y = 0.4 .. 2.8, pitch 0.4
  \draw[mtwo] (-0.5,2.55) rectangle (10.3,2.95); % wide power lead at the outside edge
  \node[font=\scriptsize,white] at (7.75,2.75) {VDD};
  \foreach \y/\a/\b in {2.1/0.6/7.0, 1.7/1.6/10.3, 1.3/-0.5/8.6, 0.9/3.2/10.3, 0.5/-0.5/2.5} \draw[mtwo] (\a,\y) rectangle (\b,\y+0.16);
  % M1 vertical drops from ports
  \foreach \x/\y in {0.7/2.1, 1.7/1.7, 3.3/0.9} { \draw[mone] (\x,\y) rectangle (\x+0.16,3.4); \fill[black] (\x+0.02,\y+0.02) rectangle (\x+0.14,\y+0.14); }
  \foreach \x/\y in {6.9/2.1, 8.5/1.3} { \draw[mone] (\x,\y) rectangle (\x+0.16,3.4); \fill[black] (\x+0.02,\y+0.02) rectangle (\x+0.14,\y+0.14); }
  % wide VDD drop with via array
  \draw[mone] (4.9,2.55) rectangle (5.5,3.6);
  \foreach \x in {4.98,5.18,5.36} \foreach \y in {2.62,2.8} \fill[black] (\x,\y) rectangle (\x+0.1,\y+0.1);
  \node[font=\scriptsize,anchor=south,align=center] at (5.3,5.4) {via array fills\\the whole overlap};
  \draw[->] (5.3,5.4) -- (5.2,3.0);
  % ports
  \foreach \x in {0.78,1.78,3.38,6.98,8.58} \draw (\x-0.12,3.28) rectangle (\x+0.12,3.52);
  \node[font=\scriptsize,anchor=east] at (-0.6,1.3) {channel};
  \draw[decorate,decoration={brace,amplitude=4pt}] (-0.55,0.4) -- (-0.55,2.95);
  % bad jog inset
  \begin{scope}[xshift=11.0cm,yshift=0.6cm]
    \draw[mtwo] (0,1.6) rectangle (1.2,1.76); \draw[mtwo] (1.04,1.2) rectangle (1.2,1.76); \draw[mtwo] (1.04,1.2) rectangle (2.6,1.36);
    \draw[mtwo] (0,1.2) rectangle (0.8,1.36); \draw[red,thick] (1.12,1.3) circle (0.4);
    \node[font=\scriptsize,red!70!black,align=left,anchor=west] at (0,0.2) {jog: blocks a track;\\congestion spreads\\along the channel};
    \node[font=\scriptsize,anchor=west] at (0,2.2) {bad};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (0,-0.2) {M1 vertical, M2 horizontal across the whole die; fill wide leads first at the outside edges, then work inward at one fixed pitch; $W_C=NP_R+S_m$.};
\end{circuitikz}
\end{document}
```

1. **One direction per layer, die-wide:** e.g. M1 vertical, M2 horizontal, each further layer perpendicular to the one below.
2. **Wide leads first** (power, ground), at the channel's outside edges; then fill inward at the chosen minimum spacing. Make wide leads an integer number of tracks so several minimum leads can take over where the wide one ends.
3. **No jogs.** A jog steals a track, and the loss propagates along the channel as it fills.
4. **Overflow:** reroute through another channel, run a few leads on the "wrong" layer down the middle, or drop **static** signals into poly (route must-be-metal nets first, poly-tolerant nets last). Unsilicided poly is 20–50 Ω/□, silicided < 5 Ω/□.
5. **Colour-code the schematic** (no air wires) so the layout designer can see each net's class:

| Signal class (Hastings Table 15.5) | Colour | Label |
|---|---|---|
| High voltage | red | voltage |
| High current | yellow | width |
| High voltage and high current | orange | voltage, width |
| Sensitive analog | green | |
| Noisy digital | purple | |
| Static digital (may use poly) | grey | |
| Other (must be metal) | light blue | |

> [!warning] Unverified: the wide-lead width formula
> Hastings Eq. 15.22 prints $W_N = NP_R + S_m$ (with $P_R = 0.7$, $S_m = 0.3$ µm: 1.0, 1.7, … µm). A lead that occupies exactly $N$ tracks of width $P_R - S_m$ at spacing $S_m$ spans $N(P_R - S_m)+(N-1)S_m = NP_R - S_m$ (0.4, 1.1, 1.8 µm). Check the intended convention against your channel before using either.

### Power distribution

```tikz title="Power distribution. (a) One supply lead daisy-chained through digital and driver blocks delivers their IR and L dI/dt to the analog blocks. (b) Separate pads and leads per domain; analog returns meet at a star point near their own pad. After Hastings Sec. 15.2, Razavi Sec. 19.4."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  por/.style={fill=white,draw=black!50},
  scribe/.style={fill=gray!12,draw=black!40},
  blk/.style={draw=black!70,thick,rounded corners=1pt,align=center,font=\scriptsize},
  ana/.style={blk,fill=yellow!25},
  dig/.style={blk,fill=gray!25},
  pwr/.style={blk,fill=red!18},
  rf/.style={blk,fill=green!12}]
  \foreach \xo/\ttl in {0/{(a) bad: one daisy-chained supply},8.2/{(b) good: separate domains, star from the pads}} {
    \begin{scope}[xshift=\xo cm]
    \draw[black!70] (0,0) rectangle (7,6);
    \node[font=\scriptsize] at (3.5,-0.4) {\ttl};
    \end{scope}}
  % ---------- bad ----------
  \node[dig,minimum width=2.4cm,minimum height=1.6cm] at (1.6,4.6) {digital\\(spiky $I$)};
  \node[pwr,minimum width=2.0cm,minimum height=1.4cm] at (5.3,4.6) {output\\driver};
  \node[ana,minimum width=2.2cm,minimum height=1.4cm] at (1.6,1.5) {bandgap};
  \node[ana,minimum width=2.2cm,minimum height=1.4cm] at (5.3,1.5) {ADC};
  \draw[mtwo] (3.3,5.6) rectangle (3.7,6.0); \node[font=\scriptsize,anchor=south] at (3.5,6.0) {VDD};
  \draw[mtwo,line width=0pt] (3.42,3.05) rectangle (3.58,5.6);
  \draw[mtwo] (2.8,4.52) rectangle (4.3,4.68);
  \draw[mtwo] (1.6,2.97) rectangle (5.3,3.13);
  \draw[mtwo] (1.52,2.2) rectangle (1.68,2.97); \draw[mtwo] (5.22,2.2) rectangle (5.38,2.97);
  \node[font=\scriptsize,red!70!black,align=left,anchor=west] at (0.2,3.6) {digital and driver $I\cdot R$, $L\,dI/dt$};
  \node[font=\scriptsize,red!70!black,align=left,anchor=west] at (0.2,0.35) {...appear on the bandgap and ADC supply};
  % ---------- good ----------
  \begin{scope}[xshift=8.2cm]
  \node[dig,minimum width=2.4cm,minimum height=1.6cm] at (1.6,4.6) {digital};
  \node[pwr,minimum width=2.0cm,minimum height=1.4cm] at (5.3,4.6) {output\\driver};
  \node[ana,minimum width=2.2cm,minimum height=1.4cm] at (1.6,1.5) {bandgap};
  \node[ana,minimum width=2.2cm,minimum height=1.4cm] at (5.3,1.5) {ADC};
  % digital pad top-left
  \draw[mtwo] (1.4,5.6) rectangle (1.8,6.0); \node[font=\scriptsize,anchor=south] at (1.6,6.0) {DVDD};
  \draw[mtwo] (1.52,5.4) rectangle (1.68,5.6);
  % driver pad top-right, wide
  \draw[mtwo] (5.1,5.6) rectangle (5.5,6.0); \node[font=\scriptsize,anchor=south] at (5.3,6.0) {PVDD};
  \draw[mtwo] (5.1,5.3) rectangle (5.5,5.6);
  % analog pad bottom-centre with star
  \draw[mtwo] (3.3,0.0) rectangle (3.7,0.4); \node[font=\scriptsize,anchor=north] at (3.5,-0.0) {};
  \node[font=\scriptsize,anchor=west] at (3.75,0.2) {AVDD};
  \draw[mtwo] (3.42,0.4) rectangle (3.58,1.5);
  \fill[black] (3.5,1.5) circle (0.09);
  \draw[mtwo] (2.7,1.42) rectangle (3.42,1.58); \draw[mtwo] (3.58,1.42) rectangle (4.2,1.58);
  \node[font=\scriptsize,anchor=west] at (2.7,2.05) {star point};
  \node[font=\scriptsize,align=left,anchor=west] at (2.0,3.3) {each domain has its own pad,\\bond wire and lead; joined only\\through ESD diodes};
  \end{scope}
\end{circuitikz}
\end{document}
```

1. **Each supply domain has its own pad(s), bond wire(s) and lead.** Never feed analog circuitry through a lead that also carries digital or driver current: that lead's $IR$ and $L\,dI/dt$ become analog supply noise.
2. **Bring the ground return to the ground ring/seal** where possible; the substrate ring is already a wide, low-resistance net.
3. **Star-connect sensitive returns** at one point near the pad; separate force and sense (Kelvin) where a drop must not reach a reference.
4. **Size each lead twice:** for electromigration at *every* point (no "just here" neck-downs) and for resistance *on average* (widen wherever there is room; a short narrow section barely matters).
5. In two-metal designs a supply lead may cross a block on M2 if the block's horizontal wiring is M1; otherwise move it into a channel (the dual op amp's VCC lead).

> [!tip] Remark
> Width-for-current, derating with temperature, strapping layers and tapering a bus are all in [[Electromigration]] (notably [[Electromigration#Bias lines, power nets and output stages]]). Star and Kelvin wiring rules are [[Guard Rings, ESD and Interconnect#Star Routing and Kelvin Connections]]. This section only places the leads.

### Routing priorities: noisy, sensitive, high-voltage

Route in this order: (1) power and other wide leads; (2) sensitive analog nets, short and away from aggressors; (3) noisy nets (clocks, digital buses) along their own channels; (4) must-be-metal nets; (5) static digital, which may use poly.

$$
\boxed{\Delta V = C R\,\frac{dV}{dt}}
$$

1 fF can matter: a logic edge faster than 1 GV/s through 10 fF into a 100 kΩ node is 1 V.

- **Never run noisy above, below or beside sensitive.** If they must cross, cross at 90° and check the coupling (by hand with the formula, or by extracting only the couplings into pre-selected critical nodes).
- **Shield** with a plate on the layer between (tied to the sensitive node's own reference, extended 2–3 µm past the crossing), or a quiet lead (static digital, power, ground) run between them. In two-metal designs one of the two signals goes in poly so M1 can be the plate.
- **Slow static control lines:** 100 kΩ in series with the driver of a 1 pF line limits its slew to about 10 MV/s.
- **High-voltage leads:** ILO breaks down near 2 MV/cm (200 V/µm), but a drawn 0.25 µm space may not hold more than about 25 V after proximity effects, and porous low-k is weaker. Flag `_hv` nets and space them by voltage *difference*, not voltage to ground.

> [!tip] Remark
> The shielding rules are owned by [[Guard Rings, ESD and Interconnect#Crossing, Coupling and Shielding]]. At the top level the only new decision is *where*: give sensitive nets their own channel segment so the rule never has to be invoked.

## Level 4: Final Layout Checklist and Tape-Out

The final review is the last chance before masks. Each item must have a confident yes (Hastings §15.5):

| # | Check | What to look at |
|---|---|---|
| 1 | DRC diagnostics reviewed and waived | Only false errors remain, each reviewed with process engineering |
| 2 | **Zero LVS topological errors** | Cannot be waived; one can hide others |
| 3 | LVS parametric errors reviewed | e.g. guard-ring diodes whose area differs between cell and top level; waive with the lead circuit designer |
| 4 | Power-wire widths meet EM | Net plots for pinch points and too few vias |
| 5 | High-current lead resistances verified | Against the circuit designer's limits |
| 6 | No antenna violations | Fix with jumpers or antenna diodes ([[Layout Fundamentals#Antenna rules]]) |
| 7 | Every pin has adequate ESD | Primary device per pin, $R$ between ESD devices within budget, CDM clamps next to every gate oxide tied to a pin and at every domain crossing |
| 8 | Pin-connected diffusions checked for latch-up | Anything tied to a vulnerable pin directly or through < ≈50 kΩ: minority-carrier guard ring or extra taps ([[Guard Rings, ESD and Interconnect#Latch-up Rules]]) |
| 9 | Dummy-metal block zones coded | Over matched devices not shielded by metal plates ([[Layout Fundamentals#Density (fill) rules]]) |
| 10 | Noisy lines separate from sensitive | Extraction to confirm couplings |
| 11 | Bondpads and probe pads present and placed | Assembly/test site approval, sizes, wire clearance, pad #1 mark |
| 12 | Kelvin connections and star nodes in the right place | A schematic resistor cannot prove the physical location |
| 13 | Corner exclusion zones and slotting present | Only approved structures in the zones |
| 14 | Scribe seal (and street) present | Seal joined to the ground metal; street width for the chosen site |
| 15 | On p+ substrate dice: empty area filled | Substrate contacts (or bypass capacitance in digital-heavy designs) |
| 16 | Die symbolization placed | Part number, logo, mask-work notice (Ⓜ + date) |
| 17 | Layout archived | Database, libraries, DRC/LVS/PG decks, GDSII + layer map, mask data, docs; checksummed, two copies in separate secure places, re-checked yearly |

> [!tip] Remark
> Items 1–3 and 6 are the verification flow in [[Layout Fundamentals#DRC, LVS, PEX]]; 4–5 are [[Electromigration#From mission profile to sign-off]]; 7–8 are [[Guard Rings, ESD and Interconnect]]; 13–14 are this note's padring. The checklist is the floorplan's decisions, audited.

## Design intuition / trade-offs

| Knob | What improves | What it costs |
|---|---|---|
| Larger $P_f$, $R_f$ in the estimate | Floorplan survives cell growth, easier routing | Die area, cost per die |
| Tight-pack layout ($P_f<1.05$) | Smallest die | Time; nearly impossible to modify |
| Channel routing | Fast, predictable, easy ECOs, no wires over sensitive cells | 5–10 % area vs maze routing |
| Maze routing | Area | Time, coupling into blocks, hard to change |
| More supply/ground pads | Lower bounce $L\Delta I/(N\Delta t)$, lower $IR$ | Pads, perimeter (may go pad-limited) |
| Analog and digital pads on perpendicular sides | Less mutual inductance | Pad-order freedom, longer internal routes |
| Matched array far from power, on the axis | Offset from gradients | Longer routing to the rest of the circuit |
| Wider primary channels | No choke points, room for late nets | Area |
| Thicker/double-metal pads, BOAC | Bond reliability; circuitry under pads | Pad capacitance (38 → 60 fF example); stress near matched devices |
| Laser dicing (narrow street) | Area on small dice | Process availability/cost |
| Corner exclusion + slots | Delamination and crack resistance | Corner area, ring resistance (small) |

## Cheat sheet

| Quantity | Result |
|---|---|
| Cell area | $A_{cell}\approx P_{f(cell)}\sum A$ |
| Resistor area | $A\approx1.2\,RW_r(W_r+S_r)/R_S$ |
| Capacitor area | $A\approx1.1\,C/C_a$, $C_a[\mathrm{pF}/\mu\mathrm{m}^2]=0.885\varepsilon_r/t[\text{Å}]$ |
| MOS area | $A\approx1.3\,W_g(L_g+S_{gg})$ |
| Power MOS area | $A\approx R_{SP}/(R_{DS(on)}-R_P)$ |
| Core area | $A_c\approx R_fP_{f(die)}\sum A_{cell}+P_{f(die)}\sum A_{pwr}$ |
| Die area (core-limited) | $A_{die}\approx(\sqrt{A_c}+2W_{pr}+W_s)^2$ |
| Minimum perimeter | $P_{min}\approx(N_p+4)(W_p+S_p)+4W_s$ |
| Perimeter utilization | $\mathcal P=P_{min}/(4\sqrt{A_{die}})$; pad-limited $A_{die}=P_{min}^2/16$ |
| Dice per wafer | $N_d=\eta\pi d^2/(4A_{die})$ |
| Die cost / total cost | $C_d=(C_m+C_p)/(N_dY_p)$, $C_f=(C_d+C_a)/Y_a$ |
| Gross margin | $GPM=(S-C_f)/S\cdot100\,\%$ |
| Slotted ring resistance | $R_{slot}/R_{unslot}\approx WL_S/[(S_L+L_S)(W-N_SW_S)]+S_L/(S_L+L_S)$ |
| Bond-wire resistance | $R_w=4\rho L/(\pi D^2)$ |
| Supply-pad count | $N_{pads}\geq L\Delta I/(\Delta t\,\Delta V_{max})$ |
| Bond-wire coupling | $v=M\,dI_{agg}/dt$, $L_\parallel=(L_S+M)/2$, $L_{loop}=2L_S-M$ |
| Routing pitches | $P_{LTL}=W_m+S_m$, $P_{VTV}=W_v+2E_{mv}+S_m$, $P_{VTL}=\tfrac{W_v+W_m}{2}+E_{mv}+S_m$ |
| Channel width | $W_C=NP_R+S_m$ |
| Capacitive coupling | $\Delta V=CR\,dV/dt$ |

## References

- **Hastings**, *The Art of Analog Layout*, 3rd ed. (2023), Ch. 15 "Assembling the Die", pp. 779–825: §15.1 die area estimation (±20 %, Eqs. 15.1–15.15, packing/routing factors, Table 15.1 bandgap, cost example); §15.2 floorplanning (Table 15.2 worksheet, Figs. 15.4–15.8 leadframe, dual op-amp floorplan, bondpad placement, high-current leads, choke points); §15.3 padring (scribe streets and composed reticles, scribe seal and ground ring, 2 Ω ESD budget, corner exclusion zones, anti-delamination slots Eq. 15.16, bondpad rules, BOAC, Eq. 15.17, probe pads, bumps and pillars); §15.4 manual top-level interconnection (Table 15.3 vias, Eqs. 15.18–15.22 pitches, Table 15.4, channel routing, Table 15.5 colour codes, primary/feeder channels, Eq. 15.23 coupling, shielding, high-voltage spacing; star/Kelvin and high-current material linked to owners); §15.5 final layout checklist. PDF pages 780–826.
- **Razavi**, *Design of Analog CMOS Integrated Circuits*, 2nd ed., Ch. 19: §19.2.8 pads and ESD (pp. 757–759, pad sizes, Fig. 19.49 pad stack, Example 19.6 pad capacitance, Fig. 19.51 octagonal pad); §19.3 substrate coupling (analog/digital grounds, linked to [[Substrate Noise]]); §19.4 packaging (pp. 766–772: separate analog/digital supplies, Fig. 19.64 third supply, Example 19.7 supply bounce, mutual inductance Figs. 19.72–19.75, pad-frame design).
- **Zettelkasten extensions:** `15t Mutual Inductance Couples Digital Bond Wires Into Analog Ones` (the $2(L_S-M)$ reading of Razavi's $2L_S-M$)..
