---
title: Packaging
description: What happens to the die after the fab and what the package does to the circuit. Assembly (dicing, die attach, wire bonding, bumps, molding), package families from SOIC to flip-chip BGA and 2.5D/3D, the bondwire/lead-frame R-L-C model, supply and ground bounce with N switching outputs, decoupling vs package resonance, mutual inductance and pin assignment, thermal resistance, package stress, and high-speed packaging for SerDes.
kind: topic
status: growing
aliases:
  - Packaging
  - IC Packaging
  - Package Parasitics
  - Bondwires
---

The die never meets the board directly. Between them sit a bondwire or bump, a lead frame or laminate trace, and a pin or ball, and every one of those is an inductor, a resistor and a capacitor that did not scale when the transistors did. This note goes from the factory floor (how a die gets into a package) to the package as a circuit element (what $L$, $M$ and $C$ do to supplies, inputs and high-speed pins) to the rules that fall out for the padring and pin-out. ESD clamps are owned by [[Guard Rings, ESD and Interconnect]], the padring layout by [[Floorplanning and Top-Level Assembly]], package stress on matching by [[Device Matching]] and the package as part of a link channel by [[Channels]].

## The big picture

```tikz title="A wirebonded QFN on a board, the most common analog package. The die sits on an exposed paddle on a die-attach layer; bondwires run from bondpads to lead fingers; a downbond ties a ground pad to the paddle; mold compound encapsulates everything. Every conductor in the signal path is an L, R and C. Layer legend continues the Layout series (die colours from CMOS Processing). After Razavi Figs. 19.61, 19.68 and Hastings Figs. 2.43, 15.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mtwo/.style={fill=violet!55,draw=black!70},
  nit/.style={fill=magenta!40,draw=black!60},
  diel/.style={fill=gray!8,draw=black!40},
  mold/.style={fill=gray!35,draw=black!60},
  lf/.style={fill=brown!45,draw=black!70},
  attach/.style={fill=gray!65,draw=black!60},
  pcb/.style={fill=green!25!gray!30,draw=black!60},
  sold/.style={fill=yellow!40!gray!60,draw=black!60},
  bw/.style={draw=blue!50!black,line width=1.1pt}]
  % legend
  \node[anchor=west,font=\bfseries] at (13.0,4.6) {Legend};
  \foreach \y/\s/\t in {4.15/psub/{die (p-substrate)},3.7/mtwo/{top metal / bondpad},3.25/nit/{passivation (nitride)},2.8/mold/{mold compound},2.35/lf/{lead frame / paddle (Cu)},1.9/attach/{die attach (Ag epoxy, solder)},1.45/sold/{solder},1.0/pcb/{PCB laminate}} {
    \draw[\s] (13.1,\y-0.15) rectangle (13.6,\y+0.15);
    \node[anchor=west,font=\scriptsize] at (13.7,\y) {\t};
  }
  \draw[bw] (13.1,0.55) -- (13.6,0.55); \node[anchor=west,font=\scriptsize] at (13.7,0.55) {bondwire (Au, Cu, PCC)};
  % PCB
  \draw[pcb] (-0.4,-0.75) rectangle (12.4,-0.15);
  \foreach \a/\b in {0.1/1.5,10.5/11.9,2.8/9.2} \draw[sold] (\a,-0.15) rectangle (\b,0);
  % package
  \draw[mold] (0,0) rectangle (12,3.3);
  \draw[lf] (2.6,0) rectangle (9.4,0.45);
  \draw[lf] (0,0) rectangle (1.7,0.45);
  \draw[lf] (10.3,0) rectangle (12,0.45);
  \draw[attach] (3.4,0.45) rectangle (8.6,0.6);
  \draw[psub] (3.5,0.6) rectangle (8.5,1.45);
  \draw[diel] (3.5,1.45) rectangle (8.5,1.62);
  \draw[nit] (3.5,1.62) rectangle (8.5,1.7);
  \foreach \x in {3.7,4.6,7.6} \draw[mtwo] (\x,1.62) rectangle (\x+0.6,1.74);
  % bondwires
  \draw[bw] (4.9,1.74) .. controls (4.6,3.1) and (1.6,2.8) .. (1.1,0.45);
  \draw[bw] (7.9,1.74) .. controls (8.3,3.0) and (10.4,2.6) .. (10.9,0.45);
  \draw[bw] (4.0,1.74) .. controls (3.8,2.2) and (3.2,1.6) .. (3.0,0.45);
  % thermal vias
  \foreach \x in {4,5,6,7,8} \draw[sold] (\x-0.08,-0.75) rectangle (\x+0.08,-0.15);
  % labels
  \draw[<-] (2.3,2.55) -- (1.2,3.75) node[above,font=\scriptsize,align=center] {bondwire\\$\approx$1 nH/mm};
  \draw[<-] (3.12,0.9) -- (2.3,1.3) node[left,font=\scriptsize] {downbond};
  \draw[<-] (6.0,1.0) -- (6.0,2.5) node[above,font=\scriptsize] {die};
  \draw[<-] (6.6,0.52) -- (7.6,2.5) node[above,font=\scriptsize,align=center] {die attach};
  \draw[<-] (0.6,0.25) -- (-0.6,1.3) node[above,font=\scriptsize,align=center] {lead\\(land)};
  \draw[<-] (9.0,0.2) -- (11.2,1.6) node[above,font=\scriptsize,align=center] {exposed\\paddle};
  \draw[<-] (11.4,2.9) -- (11.9,3.7) node[above,font=\scriptsize] {mold};
  \draw[<-] (5.5,-0.45) -- (5.5,-1.15) node[below,font=\scriptsize] {thermal vias to ground plane};
  % equivalent circuit
  \begin{scope}[yshift=-4.2cm,xshift=0.3cm]
    \draw (0,1) node[left,font=\scriptsize]{on-chip node} -- (0.4,1) node[circ](p){} to[L,l=\scriptsize$L_{bw}$] ++(2.0,0) to[R,l=\scriptsize$R_{bw}$] ++(1.6,0) node[circ](ld){} to[L,l=\scriptsize$L_{lead}$] ++(2.0,0) -- ++(0.6,0) node[right,font=\scriptsize]{board};
    \draw (p) to[C,l_=\scriptsize$C_{pad}$] ++(0,-1.2) node[ground]{};
    \draw (ld) to[C,l_=\scriptsize$C_{lead}$] ++(0,-1.2) node[ground]{};
    \draw[<->,dashed] (1.4,1.5) -- (1.4,2.1) node[above,font=\scriptsize]{$M$, $C_c$ to the neighbour pin};
    \node[anchor=west,font=\scriptsize,align=left] at (7.6,0.6) {per pin, total $L\approx$ 2--20 nH (Razavi)\\flip-chip bump: $\approx$0.01--0.02 nH (Palermo L2)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Every pin is an inductor:** bondwire $\approx 1$ nH/mm; bondwire plus package trace $\approx$ 2–20 nH; a flip-chip bump $\approx$ 0.01–0.02 nH. Package dimensions barely scale while circuit speed does, so **the package limits fast and precise circuits**.
> 2. **Bounce:** $\Delta V = L\,\Delta I/\Delta t$. $N$ outputs switching through $n$ shared pins: $\Delta V \approx \dfrac{N}{n}\,L\,\dfrac{C_L V_{DD}}{t_r^2}$.
> 3. **Mutual inductance:** two wires in parallel give $(L+M)/2$, not $L/2$. A supply wire next to its own ground wire (opposite currents) gives $L_1+L_2-2M$. So interleave $V_{DD}$/GND pins and keep quiet pins away from noisy ones.
> 4. **On-chip decap** makes $V_{DD}$ and GND bounce together, but it resonates with the package at $f_0 = 1/(2\pi\sqrt{LC})$. **Damp it** ($R\approx\sqrt{L/C}$) and keep $f_0$ off the clock and its harmonics.
> 5. **Heat:** $T_J = T_A + \theta_{JA}P_D$. A small surface-mount package with no thermal pad has $\theta_{JA} > 150$ °C/W, so it can dissipate only a fraction of a watt.
> 6. **Above a few Gb/s, use flip-chip:** bump $L$ is about 100× smaller than a bondwire's, and an area array gives more supply and signal pins.

**Map:** [[#Spec translation|spec → L, C, pins, decap]] → [[#Level 0 Assembly|assembly]] → [[#Level 1 Package Types|package families]] → [[#Level 2 The Package as a Circuit|R-L-C model]] → [[#Level 3 Supply and Ground Bounce|bounce, SSN, decap]] → [[#Level 4 Coupling and Pin Assignment|mutual coupling, pin-out]] → [[#Level 5 Thermal Resistance and Package Stress|heat and stress]] → [[#Level 6 High-Speed Packaging|flip-chip, SerDes, 2.5D/3D]] → [[#Pad and Package Co-Design Rules|rules]].

## Spec translation

A package isn't sized with $g_m/I_D$. It is chosen. The chain goes from what a circuit can tolerate, to how much $L$ and $C$ each pin may have, to the package, bonding style, pin count and decap that deliver it.

### 1. Circuit sensitivities that the package attacks

| Circuit spec | Package mechanism | What it limits |
|---|---|---|
| Supply/ground noise budget $\Delta V_{max}$ (Razavi Ex. 19.7 treats >10% of $V_{DD}$ as too much; analog budgets are far tighter) | $L\,di/dt$ on supply and ground pins | $L$ per supply path, number of supply pins |
| Edge rate $t_r$ of outputs and clock buffers | $di/dt = C_L V_{DD}/t_r^2$ | Bounce grows as $1/t_r^2$ |
| Input bandwidth / settling | $L_{bw}$ with $C_{pad}+C_{in}$ is a 2nd-order low-pass | $L_{bw}$, $C_{pad}$ |
| High-speed return loss $|S_{11}|$ | Shunt $C$ at the pad, series $L$ of the wire | $C_{tot}$, $L_{bw}$, so wirebond vs flip-chip |
| Crosstalk into analog inputs and references | Mutual $M$ and $C_c$ between neighbouring wires | Pin order, spacing, guard pins |
| Junction temperature $T_{J,max}$ at power $P_D$ | $\theta_{JA}$ | Package, thermal pad, board copper |
| Offset/drift of matched devices | Mold and attach stress | Die placement, attach material ([[Device Matching#Mechanical Stress and Package Shift]]) |

### 2. From tolerated error to allowed L, C, pins and decap

$$
\boxed{L_{max} = \frac{\Delta V_{max}\,t_r}{\Delta I}}
\qquad
\boxed{n_{pins} \ge \frac{L_{pin}}{L_{max}}\ \ (\text{more if }M>0)}
$$

$$
\boxed{C_{dec} \ge \frac{\Delta I\,\Delta t}{\Delta V_{max}}}
\qquad
\boxed{f_0 = \frac{1}{2\pi\sqrt{L_{loop}C_{dec}}}\ \notin\ \{f_{clk}, 2f_{clk},\dots\},\quad R_{damp}\approx\sqrt{L_{loop}/C_{dec}}}
$$

$$
\boxed{\frac{1}{2\pi\sqrt{L_{bw}(C_{pad}+C_{in})}} \gg f_{signal}}
\qquad
\boxed{\theta_{JA} \le \frac{T_{J,max}-T_{A,max}}{P_D}}
$$

For a high-speed pad, the capacitance limit set by return loss is derived in [[Guard Rings, ESD and Interconnect#ESD for High-Speed I/O]]: $C_{tot,max} = 2|\Gamma|/(\omega_N R\sqrt{1-|\Gamma|^2})$, about 0.55 pF at 10 Gb/s.

> [!note]- Derivation: each mapping
> - **$L_{max}$:** the pin drops $L\,di/dt \approx L\,\Delta I/t_r$. Set it equal to $\Delta V_{max}$.
> - **Pins:** $n$ identical, uncoupled pins in parallel give $L_{pin}/n$. Coupling between same-direction neighbours raises the effective value (two wires: $(L+M)/2$), so the count is a lower bound.
> - **$C_{dec}$:** for the duration $\Delta t$ of a current step the package can't respond (its $L$ blocks the step). The decap alone supplies charge $\Delta I\,\Delta t$ and droops by $\Delta Q/C$.
> - **$f_0$ and $R_{damp}$:** the decap and the loop inductance form a parallel tank seen by the on-chip current. Its peak impedance is $Q\sqrt{L/C}$ with $Q=\sqrt{L/C}/R$, so $R\approx\sqrt{L/C}$ gives $Q\approx1$ ([[#Decoupling vs Package Resonance]]).
> - **Input LC:** a series $L$ into a shunt $C$ resonates at $1/(2\pi\sqrt{LC})$. Below it the input sees a flat response; near it, a peak and ringing.
> - **$\theta_{JA}$:** Hastings Eq. 5.1 rearranged.

### 3. Where it lands on amplifier specs

The package turns into noise at the inputs of the analog blocks. Those blocks must reject it:

| Package disturbance | Amplifier spec that rejects it | Requirement |
|---|---|---|
| Supply bounce $\Delta V_{DD}$ | PSRR | $\text{PSRR} \ge \Delta V_{DD}/\Delta V_{out,allowed}$ |
| Ground/substrate bounce common to both inputs | CMRR, fully differential topology | Differential signal path; single-ended inputs see the full bounce (Razavi Fig. 19.60) |
| Bounce at the reference or bias pin | Settling time, output impedance of the reference buffer | On-chip $C$ large enough, or the node left agile (Razavi Ex. 19.8) |
| Input $L_{bw}C$ low-pass and ringing | GBW, phase margin of the driven stage, settling | Include the package model in the closed-loop simulation |

> [!tip] Remark
> These amplifier specs are defined in [[Single-Stage#Amplifier Specifications]] and sized with [[gm-ID Design Methodology]]. The package only sets the size of the disturbance they must reject.

### 4. What each package choice buys

| Choice | Effect on $L$, $C$, $\theta$ | Cost |
|---|---|---|
| More supply/ground pins | $L_{eff}\approx L/n$ | Pins, pad-limited die area |
| Interleave $V_{DD}$ and GND | $L_{loop}=L_1+L_2-2M$ | Pin-out freedom |
| Shorter bondwires (smaller cavity, die close to fingers) | $L\approx1$ nH/mm | Package/die size match |
| Downbond or exposed paddle for ground/substrate | Removes a wire and a lead from the ground path | Cost, assembly rules |
| Flip-chip (bumps) | $L$ from nH to ~0.02 nH; area array of supply bumps | Cost, bump stress, solder electromigration |
| On-chip decap | Supply–ground bounce falls | Area comparable to all gate area (Razavi), yield |
| Thermal pad + board vias | $\theta_{JA}$ falls | Board layout |

### 5. Worked example: N switching outputs

See [[#Worked Example Ground Bounce with N Outputs]] for the full numbers. Summary: 16 outputs × 5 pF × 1.8 V in 1 ns through one 5 nH ground pin bounce **0.72 V**. A 100 mV budget needs **8 ground pins**, or an interleaved arrangement with fewer, or slower edges.

## Level 0: Assembly

```tikz title="From finished wafer to shipped part. Probing happens before packaging because packaging costs money; final test happens after because assembly can break things. After Hastings §2.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  b/.style={draw,rounded corners=2pt,fill=gray!8,minimum height=1.05cm,text width=2.2cm,align=center,font=\scriptsize}]
  \node[b] (a) at (0,0) {wafer probe\\(probe card, ATE)};
  \node[b] (b) at (2.9,0) {backgrind\\250--750 µm $\to$\\50--100 µm};
  \node[b] (c) at (5.8,0) {saw on release tape\\(scribe streets\\50--75 µm)};
  \node[b] (d) at (8.7,0) {die attach\\(epoxy, solder,\\eutectic, sinter)};
  \node[b] (e) at (8.7,-1.8) {wire bond\\(ball/stitch)\\or bump reflow};
  \node[b] (f) at (5.8,-1.8) {transfer mold\\($\approx$90\% silica,\\175 °C, 90 s)};
  \node[b] (g) at (2.9,-1.8) {trim and form,\\plate (lead-free),\\mark};
  \node[b] (h) at (0,-1.8) {final test\\(handler + ATE)};
  \draw[->] (a) -- (b); \draw[->] (b) -- (c); \draw[->] (c) -- (d); \draw[->] (d) -- (e);
  \draw[->] (e) -- (f); \draw[->] (f) -- (g); \draw[->] (g) -- (h);
\end{circuitikz}
\end{document}
```

- Fabrication ends with the passivation overcoat. Everything after it happens at a separate, less clean **assembly/test site**.
- Wafer yields exceed 90%, but customers expect part-per-million defect rates, so **every die is tested**: once on the wafer (cheap), once after packaging.

### Dicing

- **Backgrind** thins the wafer from 250–750 µm (thick enough to survive handling) to the package's target, typically 50–100 µm.
- A diamond saw cuts through the wafer into, but not through, a plastic **release tape** on a steel ring. It runs down **scribe streets** about 50–75 µm wide. Metal and oxide in the streets (test structures) must be limited so they don't foul the saw. **Laser scribing** makes narrower streets possible: the laser makes defect zones inside the silicon and a gentle flex cracks the wafer along them.

> [!tip] Remark
> The scribe seal, scribe street rules and test structures in the streets are layout. They belong to [[Floorplanning and Top-Level Assembly]].

### Die Attach

```tikz title="Die attach options and what each buys. Silver-filled epoxy is the default: low stress, good heat path, but not a trustworthy ohmic contact. Solder, gold eutectic and silver sinter make a low-resistance electrical path to the paddle at the cost of more stress. Legend as in the first diagram. After Hastings §2.8.1 and §5.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  lf/.style={fill=brown!45,draw=black!70},
  attach/.style={fill=gray!65,draw=black!60}]
  \foreach \x/\t/\c/\r in {0/{Ag-filled epoxy}/gray!65/{default; heat: good\\electrical: unreliable\\stress: lowest},4.6/{solder (plated backside)}/yellow!40!gray!60/{low $R$ to paddle\\heat: better\\stress: higher},9.2/{Au eutectic / Ag sinter}/yellow!70!orange/{low $R$ to paddle\\heat: best\\stress: highest, cost}} {
    \draw[lf] (\x,0) rectangle (\x+3.6,0.4);
    \draw[fill=\c,draw=black!60] (\x+0.4,0.4) rectangle (\x+3.2,0.6);
    \draw[psub] (\x+0.5,0.6) rectangle (\x+3.1,1.5);
    \node[font=\scriptsize] at (\x+1.8,1.05) {die};
    \node[font=\scriptsize\bfseries] at (\x+1.8,1.9) {\t};
    \node[font=\scriptsize,align=center,anchor=north] at (\x+1.8,-0.15) {\r};
  }
  \node[font=\scriptsize,anchor=west] at (13.0,0.2) {paddle (Cu)};
  \draw[->] (12.95,0.2) -- (12.75,0.2);
\end{circuitikz}
\end{document}
```

- **Lead frames** are stamped or etched copper (or copper alloy), plated against corrosion. Copper expands much more than silicon, so heating and cooling stress the die. **Alloy 42** (nickel-iron) matches silicon better and is used for low-stress specialty parts, but it is a worse conductor.
- If the substrate must connect to a pin through the paddle, you need two things: a conductive attach (solder, eutectic or sinter if you need it reliable; epoxy only keeps the backside from floating far) and a **downbond** or **fused lead frame** ([[#Substrate and Ground Through the Paddle]]).

### Wire Bonding

```tikz title="Thermosonic ball bonding in four frames: (1) the electric flame-off has made a ball on the wire in the capillary; (2) the capillary presses the ball onto the bondpad, welding it; (3) the capillary moves to the lead finger, paying out a loop; (4) it smashes the wire into a stitch bond and tears the wire off. Wedge bonding makes a stitch at both ends. Legend as in the first diagram. After Hastings Fig. 2.44."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mtwo/.style={fill=violet!55,draw=black!70},
  lf/.style={fill=brown!45,draw=black!70},
  bw/.style={draw=blue!50!black,line width=1.3pt},
  capl/.style={fill=orange!60!brown!50,draw=black!70}]
  \foreach \i in {0,1,2,3} {
    \begin{scope}[xshift=\i*4.2cm]
      \draw[psub] (0,0) rectangle (1.6,0.6);
      \draw[mtwo] (0.5,0.6) rectangle (1.1,0.7);
      \draw[lf] (2.3,0) rectangle (3.6,0.35);
      \node[font=\scriptsize] at (1.8,-0.35) {(\the\numexpr\i+1\relax)};
    \end{scope}
  }
  % frame 1
  \draw[capl] (0.6,1.6) rectangle (0.72,2.6); \draw[capl] (0.88,1.6) rectangle (1.0,2.6);
  \draw[bw] (0.8,2.6) -- (0.8,1.5); \fill[blue!50!black] (0.8,1.42) circle (0.12);
  \draw[->] (1.3,2.3) -- (1.3,1.6);
  \node[font=\scriptsize,anchor=south] at (0.8,2.6) {capillary};
  \node[font=\scriptsize,anchor=west] at (1.4,1.35) {ball};
  % frame 2
  \begin{scope}[xshift=4.2cm]
    \draw[capl] (0.6,0.85) rectangle (0.72,1.85); \draw[capl] (0.88,0.85) rectangle (1.0,1.85);
    \draw[bw] (0.8,1.85) -- (0.8,0.85); \fill[blue!50!black] (0.55,0.7) rectangle (1.05,0.85);
    \node[font=\scriptsize,align=center] at (0.8,2.3) {ball bond\\(weld)};
  \end{scope}
  % frame 3
  \begin{scope}[xshift=8.4cm]
    \fill[blue!50!black] (0.55,0.7) rectangle (1.05,0.85);
    \draw[bw] (0.8,0.85) .. controls (0.8,2.0) and (2.4,2.0) .. (2.9,1.7);
    \draw[capl] (2.84,1.7) rectangle (2.96,2.7); \draw[capl] (3.12,1.7) rectangle (3.24,2.7);
    \draw[->] (1.8,2.5) to[bend left=20] (2.6,2.3);
    \node[font=\scriptsize] at (1.4,2.55) {loop};
  \end{scope}
  % frame 4
  \begin{scope}[xshift=12.6cm]
    \fill[blue!50!black] (0.55,0.7) rectangle (1.05,0.85);
    \draw[bw] (0.8,0.85) .. controls (0.8,2.0) and (2.4,1.6) .. (2.8,0.4) -- (3.1,0.38);
    \draw[capl] (3.0,1.2) rectangle (3.12,2.2); \draw[capl] (3.28,1.2) rectangle (3.4,2.2);
    \draw[->] (3.2,2.35) -- (3.2,2.75);
    \node[font=\scriptsize,align=center] at (3.0,-0.8) {stitch bond};
    \draw[->] (3.0,-0.6) -- (2.95,0.3);
  \end{scope}
\end{circuitikz}
\end{document}
```

| Wire | Diameter | Notes (Hastings §2.8.1, §15.3.3) |
|---|---|---|
| Gold (4N, 2N) | 1 mil = 25 µm most common; 12.5–50 µm available | Soft, doesn't oxidize; $\rho$ = 2.2–2.4 (4N) or 3.0–3.3 µΩ·cm (2N) |
| Palladium-coated copper (PCC) | from 0.8 mil (20 µm) | Today most analog ICs are ball-bonded in Cu or PCC |
| Pure copper | up to 2 mil (50 µm) | Harder than gold: bigger stress under the pad |
| Aluminium (wedge) | up to 250 µm | Discrete power transistors |

$$
\boxed{R_{bw} = \frac{4\rho L}{\pi D^2}}
$$

- A 4N gold wire, 25 µm × 1 mm, is **47 mΩ**. Gold's TC is about 3700 ppm/°C (copper's about 4000), so $R$ rises **37%** from 25 °C to 125 °C. Wire lengths run from 0.1 mm to 5 mm or more.
- One pin takes **two or three** 25 µm wires. That is how you cut $R$ and $L$ on a supply pin, or make a Kelvin pair.
- **Bondpad sizing:** a ball needs a pad about 2–3× the wire diameter, so 50–75 µm for 1 mil wire. Razavi gives 70–100 µm pads with ≥ 25 µm spacing. Hastings' example rules: opening = 3× wire diameter, pitch = 5× wire diameter, so **75 µm opening, 125 µm pitch**. Fine-pitch bonders reach 60 µm pitch with 20 µm wire.

> [!note]- Detail: why ball bonding looks the way it does (Hastings §15.3.3)
> - Early gold thermocompression bonding needed so much heat that gold and aluminium formed brittle, poorly conducting intermetallics ("purple plague", AuAl₂). The cure was less heat plus ultrasonic energy: **ultrasonic** bonding with no heat, **thermosonic** with some.
> - The hydrogen flame-off made ball sizes hard to control. **Electric flame-off** (EFO) makes balls only slightly larger than the wire, which is what allows 60 µm pitch.
> - Copper became popular after gold prices rose in the 2000s. It is bonded under forming gas (N₂/H₂) because it oxidizes, and the finer wires are palladium-coated.
> - Automated bonders place ten or more wires per second using optical pad recognition. Software checks that wires can't short each other or the sawn die edge.

### Encapsulation and Finish

- **Transfer molding:** a heated mold is clamped around the bonded lead frame and epoxy filled with about **90% silica** is forced in from below, lifting the wires into loops. It is cured at about **175 °C for 90 s**. The silica is there to bring the compound's thermal expansion closer to silicon's, and the shrink that remains is what compresses the die ([[Device Matching#Mechanical Stress and Package Shift]]).
- After molding: trim and form the leads, plate them (lead-free high-tin solder or palladium, because of RoHS), mark them with the part number and date code, run final test, and pack into tubes, trays or reels.

## Level 1: Package Types

```tikz title="Package families in cross-section, from leaded to bumped. Leaded and QFN parts wirebond to a lead frame; BGAs use a laminate substrate (a small PCB) with balls underneath; flip-chip turns the die over onto bumps; wafer-level CSP is just a bumped die. Legend as in the first diagram. After Hastings Table 2.4 and Fig. 15.16, Palermo ECEN720 L2 slide 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mold/.style={fill=gray!35,draw=black!60},
  lf/.style={fill=brown!45,draw=black!70},
  lam/.style={fill=green!35!gray!40,draw=black!60},
  sold/.style={fill=yellow!40!gray!60,draw=black!60},
  bw/.style={draw=blue!50!black,line width=0.9pt}]
  % SOIC
  \begin{scope}
    \draw[mold] (0.5,0.3) rectangle (3.5,1.5);
    \draw[lf] (1.2,0.55) rectangle (2.8,0.7);
    \draw[psub] (1.4,0.7) rectangle (2.6,1.0);
    \draw[lf,line width=0.5pt] (0.5,0.75) -- (0.1,0.75) -- (-0.1,0.05) -- (-0.4,0.05) -- (-0.4,0.15) -- (-0.15,0.15) -- (0.05,0.85) -- (0.5,0.85);
    \draw[lf,line width=0.5pt] (3.5,0.75) -- (3.9,0.75) -- (4.1,0.05) -- (4.4,0.05) -- (4.4,0.15) -- (4.15,0.15) -- (3.95,0.85) -- (3.5,0.85);
    \draw[bw] (1.5,1.0) .. controls (1.3,1.35) and (0.8,1.2) .. (0.6,0.85);
    \draw[bw] (2.5,1.0) .. controls (2.7,1.35) and (3.2,1.2) .. (3.4,0.85);
    \node[font=\scriptsize\bfseries] at (2,1.9) {SOIC / TSSOP / QFP};
    \node[font=\scriptsize,align=center] at (2,-0.45) {gull-wing leads, 2 or 4 sides\\long leads: most $L$};
  \end{scope}
  % QFN
  \begin{scope}[xshift=5.4cm]
    \draw[mold] (0,0) rectangle (4,1.3);
    \draw[lf] (1.0,0) rectangle (3.0,0.3);
    \draw[lf] (0,0) rectangle (0.6,0.3); \draw[lf] (3.4,0) rectangle (4,0.3);
    \draw[psub] (1.2,0.35) rectangle (2.8,0.7);
    \draw[bw] (1.3,0.7) .. controls (1.1,1.1) and (0.6,1.0) .. (0.35,0.3);
    \draw[bw] (2.7,0.7) .. controls (2.9,1.1) and (3.4,1.0) .. (3.65,0.3);
    \node[font=\scriptsize\bfseries] at (2,1.9) {QFN};
    \node[font=\scriptsize,align=center] at (2,-0.45) {lands on 4 sides\\exposed paddle: heat + ground};
  \end{scope}
  % WB-BGA
  \begin{scope}[xshift=10.8cm]
    \draw[lam] (0,0.3) rectangle (4.4,0.6);
    \draw[mold] (0.5,0.6) rectangle (3.9,1.4);
    \draw[psub] (1.5,0.65) rectangle (2.9,0.95);
    \draw[bw] (1.6,0.95) .. controls (1.4,1.3) and (1.0,1.2) .. (0.8,0.6);
    \draw[bw] (2.8,0.95) .. controls (3.0,1.3) and (3.4,1.2) .. (3.6,0.6);
    \foreach \x in {0.35,0.95,1.55,2.15,2.75,3.35,3.95} \draw[sold] (\x+0.05,0.15) circle (0.15);
    \node[font=\scriptsize\bfseries] at (2.2,1.9) {wirebond BGA (PBGA)};
    \node[font=\scriptsize,align=center] at (2.2,-0.45) {laminate substrate,\\ball array underneath};
  \end{scope}
  % FC-BGA
  \begin{scope}[yshift=-3.6cm,xshift=1.5cm]
    \draw[lam] (0,0.3) rectangle (4.4,0.65);
    \draw[psub] (1.0,0.85) rectangle (3.4,1.3);
    \foreach \x in {1.2,1.6,2.0,2.4,2.8,3.2} \draw[sold] (\x,0.75) circle (0.1);
    \draw[fill=gray!20,draw=black!50] (0.95,0.65) rectangle (1.0,0.85); \draw[fill=gray!20,draw=black!50] (3.4,0.65) rectangle (3.45,0.85);
    \draw[fill=gray!55,draw=black!60] (0.6,1.3) rectangle (3.8,1.45);
    \foreach \x in {0.35,0.95,1.55,2.15,2.75,3.35,3.95} \draw[sold] (\x+0.05,0.15) circle (0.15);
    \node[font=\scriptsize\bfseries] at (2.2,1.9) {flip-chip BGA};
    \node[font=\scriptsize,align=center] at (2.2,-0.45) {die face-down on bumps + underfill,\\lid/heat spreader on the back};
    \node[font=\scriptsize,anchor=west] at (4.5,1.38) {lid};
  \end{scope}
  % WLCSP
  \begin{scope}[yshift=-3.6cm,xshift=7.6cm]
    \draw[psub] (0,0.55) rectangle (3,1.1);
    \foreach \x in {0.35,0.95,1.55,2.15,2.75} \draw[sold] (\x-0.05,0.4) circle (0.15);
    \node[font=\scriptsize] at (1.5,0.85) {die (face down)};
    \node[font=\scriptsize\bfseries] at (1.5,1.9) {WLCSP / CSP};
    \node[font=\scriptsize,align=center] at (1.5,-0.45) {bumps straight to the PCB:\\smallest, cheapest, most stress};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Family | Interconnect | Pin count (Palermo L2) | Parasitics and use |
|---|---|---|---|
| DIP (through-hole) | Wirebond, long leads | 6–64 historically | Obsolete. Razavi's model package |
| SOIC / TSSOP (SOP) | Wirebond, gull wings on 2 sides | 8–56 | Cheap analog parts. Long leads mean most $L$ |
| QFP / TQFP | Wirebond, gull wings on 4 sides | 64–304 | Mixed-signal. Corner pins have the longest wires |
| QFN | Wirebond, lands on 4 sides, exposed paddle | — | Short leads, paddle for heat and ground. The analog default |
| PBGA / EBGA | Wirebond on laminate, ball array | 256–420 / 352–896 | More pins. Laminate gives planes and controlled-impedance traces |
| FC-BGA | Bumps on laminate | 1089–2116 | Lowest $L$, area I/O, heat out the back. SerDes and processors |
| CSP / WLCSP | Bumps straight to the PCB | small arrays | Smallest and cheapest. CTE stress limits array size |
| MCM / SiP | Several dice on one laminate | — | Mixes processes, adds passives, inductors and baluns in the substrate |

> [!tip] Remark
> Pin count is the reason high-speed links exist. Packaging hasn't increased pin count as fast as on-chip bandwidth has grown, so designs end up I/O-limited and push the data rate per pin up (Palermo L2 slide 5; [[Channels]]).

## Level 2: The Package as a Circuit

### The Lumped Model

```tikz title="Lumped model of two neighbouring package pins, after Dally's model in Palermo ECEN720 L2 slide 7 and Razavi Fig. 19.61(b). Each section has self-inductance, capacitance to ground, mutual inductance (coupling K) and coupling capacitance to the neighbour. Values shown are Dally's example: 5 nH bondwires with K = 0.2-0.4, 5 nH package traces with K up to 0.5, about 1 pF at the via and ball."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \foreach \y/\n in {2.4/1,0/2} {
    \draw (0,\y) node[left,font=\scriptsize]{pad \n} -- (0.3,\y) node[circ](a\n){} to[L,l=\scriptsize 5 nH] (2.6,\y) node[circ](b\n){} -- (3.6,\y) node[circ](c\n){} to[L,l=\scriptsize 5 nH] (6.0,\y) node[circ](d\n){} -- (7.0,\y) to[L,l=\scriptsize$L_{via}$] (8.8,\y) node[circ](e\n){} -- (9.4,\y) node[right,font=\scriptsize]{PCB \n};
    \draw (a\n) to[C,l_=\scriptsize 50 fF] ++(0,-1.0) node[ground]{};
    \draw (c\n) to[C,l_=\scriptsize 80--150 fF] ++(0,-1.0) node[ground]{};
    \draw (d\n) to[C,l=\scriptsize 200 fF] ++(0,-1.0) node[ground]{};
    \draw (e\n) to[C,l_=\scriptsize 1 pF] ++(0,-1.0) node[ground]{};
  }
  \draw[<->,dashed,thick,blue!60!black] (1.45,2.0) -- (1.45,0.55) node[midway,right,font=\scriptsize]{$K\approx$0.2--0.4};
  \draw[<->,dashed,thick,blue!60!black] (4.4,2.0) -- (4.4,0.55) node[midway,right,font=\scriptsize]{$K\approx$0.2--0.5};
  \draw[decorate,decoration={brace,amplitude=4pt}] (0.3,3.2) -- (2.6,3.2) node[midway,above=4pt,font=\scriptsize]{bondwire};
  \draw[decorate,decoration={brace,amplitude=4pt}] (2.6,3.2) -- (3.6,3.2) node[midway,above=4pt,font=\scriptsize]{land};
  \draw[decorate,decoration={brace,amplitude=4pt}] (3.6,3.2) -- (6.0,3.2) node[midway,above=4pt,font=\scriptsize]{5 mm trace};
  \draw[decorate,decoration={brace,amplitude=4pt}] (6.0,3.2) -- (8.8,3.2) node[midway,above=4pt,font=\scriptsize]{via and ball};
\end{circuitikz}
\end{document}
```

Five parasitics per Razavi: **bondwire self-$L$, trace self-$L$, trace-to-ground $C$, trace-to-trace mutual $L$, trace-to-trace $C$**. Many package vendors don't supply models, so you build them from formulas and measurement (or EM simulation, because real wires aren't straight).

| Element | Rule of thumb | Source |
|---|---|---|
| Bondwire | $L\approx1$ nH/mm; $C_{couple}\approx20$ fF/mm | Razavi Eq. 19.19; Palermo L2 (Dally) |
| Package trace | $L\approx0.7$–1 nH/mm; $C_{layer}\approx80$–90 fF/mm; $C_{couple}\approx40$ fF/mm | Palermo L2 (Dally) |
| Bondwire + trace + pin, total | ≈ 2–20 nH | Razavi §19.4 |
| Bondwire / die bump (Intel) | wirebond 2.1–4.6 nH, 114–188 mΩ; flip-chip 0.013–0.02 nH, 0.06–2 mΩ | Palermo L2 slide 8 |
| Pin/land (Intel) | 4.0–4.5 nH wirebond PGAs; 0.75–2.9 nH flip-chip | Palermo L2 slide 8 |

> [!tip] Remark
> These are the same nH/mm numbers [[Inductor#Loops, Solenoids and Bondwires]] deferred here. The channel view of the same parasitics (a series-$L$ bump and a shunt-$C$ dip on a TDR, package crosstalk) is in [[Channels#Level 2 Discontinuities]].

### Inductance Formulas

```tikz title="The three geometries behind package inductance: (a) a round wire of radius r at height h over a ground plane, (b) a flat trace of width W at height d, (c) two round wires at spacing d, both at height h. The current returns in the plane as an image, so inductance grows with the loop area per unit length. After Razavi Fig. 19.62."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \foreach \x/\t in {0/(a),4.6/(b),9.2/(c)} {
    \fill[gray!35] (\x,0) rectangle (\x+3.6,0.2);
    \node[font=\scriptsize] at (\x+1.8,-0.3) {\t\ ground plane};
  }
  \draw[fill=brown!45] (1.8,1.8) circle (0.25);
  \draw[<->] (2.4,0.2) -- (2.4,1.8) node[midway,right,font=\scriptsize]{$h$};
  \draw[->] (1.8,1.8) -- (1.97,1.97); \node[font=\scriptsize] at (1.5,2.3) {$r$};
  \draw[fill=brown!45] (5.6,1.2) rectangle (7.2,1.4);
  \draw[<->] (7.5,0.2) -- (7.5,1.2) node[midway,right,font=\scriptsize]{$d$};
  \draw[<->] (5.6,1.65) -- (7.2,1.65) node[midway,above,font=\scriptsize]{$W$};
  \draw[fill=brown!45] (10.3,1.8) circle (0.22); \draw[fill=brown!45] (11.9,1.8) circle (0.22);
  \draw[<->] (10.3,2.3) -- (11.9,2.3) node[midway,above,font=\scriptsize]{$d$};
  \draw[<->] (12.5,0.2) -- (12.5,1.8) node[midway,right,font=\scriptsize]{$h$};
\end{circuitikz}
\end{document}
```

$$
\boxed{L \approx 0.2\ln\frac{2h}{r}\ \text{nH/mm}}
\qquad
L\approx\frac{1.6\,d}{K_f W}\ \text{nH/mm},\ K_f\approx0.72\frac{d}{W}+1
\qquad
\boxed{L_m \approx 0.1\ln\!\left[1+\left(\frac{2h}{d}\right)^2\right]\ \text{nH/mm}}
$$

- Inductance depends only **logarithmically** on height and radius. That's why every bondwire comes out near 1 nH/mm and the only real lever is **length**.
- Mutual inductance falls with spacing, but slowly. Doubling the distance between wires doesn't halve the coupling.

> [!note]- Worked: mutual coupling between two bondwires (Razavi Probs. 19.14–19.15)
> Two wires 4 mm long at $h = 5$ mm above ground, $d = 1$ mm apart:
> $$L_m = 0.1\ln(1+10^2)\times4 = 0.4615\times4 = 1.85\ \text{nH}$$
> A 1 mA peak, 100 MHz sine in one wire induces $\omega L_m I = 2\pi(10^8)(1.85\times10^{-9})(10^{-3}) = 1.16$ mV in the other. Cutting that by 4× needs $\ln(1+(10/d)^2) = \ln(101)/4 = 1.154$, so $(10/d)^2 = 2.17$ and $d = 6.8$ mm. Spacing alone is an expensive fix. Grounded wires in between, or perpendicular routing, are cheaper ([[#Mutual Inductance]]).
> Check of Eq. 19.19: 1 nH/mm needs $\ln(2h/r) = 5$, i.e. $2h/r \approx 148$. For a 25 µm wire ($r = 12.5$ µm) that is $h \approx 0.93$ mm, a typical loop height over the paddle.

### Pad Capacitance

```tikz title="A bondpad is a big plate over the substrate. Left: a pad built from the two top metals tied by a ring of vias resists lift-off during bonding, but its lower plate sits closer to the substrate, so C rises. Right: cutting the corners into an octagon keeps the bonding area and removes about 20% of area and perimeter. Metal colours from the Layout legend (M_top drawn as M2, M_top-1 as M1). After Razavi Figs. 19.49-19.51."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  nit/.style={fill=magenta!40,draw=black!60},
  diel/.style={fill=gray!8,draw=black!40},
  cont/.style={fill=black,draw=none}]
  \draw[psub] (0,0) rectangle (6.4,0.8);
  \draw[diel] (0,0.8) rectangle (6.4,2.4);
  \draw[mone] (1.0,1.5) rectangle (5.4,1.7);
  \draw[mtwo] (1.0,2.0) rectangle (5.4,2.25);
  \foreach \x in {1.1,1.35,1.6,4.6,4.85,5.1} \draw[cont] (\x,1.7) rectangle (\x+0.12,2.0);
  \draw[nit] (0,2.25) rectangle (1.3,2.45); \draw[nit] (5.1,2.25) rectangle (6.4,2.45);
  \draw[<->] (5.8,0.8) -- (5.8,1.5) node[midway,right,font=\scriptsize]{$C_a$ to sub};
  \draw[->] (1.0,1.55) .. controls (0.5,1.3) .. (0.6,0.82);
  \node[font=\scriptsize] at (0.35,1.45) {$C_f$};
  \node[font=\scriptsize,anchor=west] at (6.5,2.12) {$M_{top}$};
  \node[font=\scriptsize,anchor=west] at (6.5,1.6) {$M_{top-1}$};
  \node[font=\scriptsize] at (3.2,2.7) {passivation opening};
  \node[font=\scriptsize] at (3.2,0.4) {substrate};
  \node[font=\scriptsize] at (3.2,1.85) {via ring at the edge};
  % top views
  \begin{scope}[xshift=8.6cm,yshift=0.2cm]
    \draw[mtwo] (0,0) rectangle (2.2,2.2);
    \node[font=\scriptsize] at (1.1,-0.35) {square};
    \draw[mtwo] (3.4,0.7) -- (4.1,0) -- (4.9,0) -- (5.6,0.7) -- (5.6,1.5) -- (4.9,2.2) -- (4.1,2.2) -- (3.4,1.5) -- cycle;
    \draw[dashed] (3.4,0) rectangle (5.6,2.2);
    \node[font=\scriptsize] at (4.5,-0.35) {octagon, $a=b$};
    \draw[<->] (4.1,2.45) -- (4.9,2.45) node[midway,above,font=\scriptsize]{$b$};
    \draw[<->] (3.4,2.45) -- (4.1,2.45) node[midway,above,font=\scriptsize]{$a$};
    \fill[blue!50!black] (1.1,1.1) circle (0.45); \fill[blue!50!black] (4.5,1.1) circle (0.45);
    \node[font=\scriptsize,white] at (1.1,1.1) {ball}; \node[font=\scriptsize,white] at (4.5,1.1) {ball};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{C_{pad} = C_a A + C_f P}
$$

**Razavi Ex. 19.6** (75 µm pad): metal-4 only, $75^2\times6 + 300\times15$ aF = **38 fF**. Metal-4 over metal-3, $75^2\times9 + 300\times(17+15)$ aF = **60 fF**.

- The pad's size is set by bonding mechanics, not by the circuit. The circuit wants it as small as possible.
- Octagons are for high-frequency pads. The ball lands in the middle anyway, so the corners are pure capacitance.

> [!note]- Derivation: the octagon saves about 20%
> Cut each corner of a square of side $s$ back by $a$ along both edges, leaving flats of length $b$, so $s = 2a+b$. With $a=b$, $s = 3a$. The four corner triangles remove $4\cdot\tfrac12a^2 = 2a^2 = \tfrac29 s^2$, which is **22%** of the area. The perimeter goes from $4s$ to $4b + 4\sqrt2\,a = 4a(1+\sqrt2) = 3.22\,s$, which is **19.5%** less. Both terms of $C_{pad}$ fall by about a fifth (Razavi "about 20%"; numbers from the owner's Zettelkasten note 15q).

> [!tip] Remark
> The pad's ESD clamps add far more than the pad itself: several pF on a slow pin, and a hard femtofarad budget on a fast one. That budget is in [[Guard Rings, ESD and Interconnect#ESD for High-Speed I/O]]. Layout rules for the pad itself (POR overlap, exclusion zone, bond-over-active, pad #1 marking, probe pads) are in [[Floorplanning and Top-Level Assembly]].

## Level 3: Supply and Ground Bounce

### Self-Inductance and L di/dt

```tikz title="Supply and ground bounce. A clock buffer charging C_L pulls a current spike through L_D from the supply and, on the falling edge, dumps one through L_G into ground. The on-chip rails V_DD1 and GND1 dip and jump by L di/dt. After Razavi Fig. 19.63."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,4.2) node[vcc]{$V_{DD}$} to[L,l=$L_D$] (0,2.8) node[circ](vd){};
  \node[anchor=west,font=\scriptsize] at (0.1,2.9) {$V_{DD1}$};
  \draw (vd) -- (1.4,2.8) -- (1.4,2.5) node[pmos,anchor=S](mp){};
  \draw (mp.D) -- (1.4,1.45) node[nmos,anchor=D](mn){};
  \draw (mn.S) -- (1.4,0.0) -- (0,0) node[circ](gd){};
  \node[anchor=east,font=\scriptsize] at (-0.1,0.25) {GND1};
  \draw (gd) to[L,l=$L_G$] (0,-1.4) node[ground]{};
  \draw (mp.G) -- (mn.G); \draw (mp.G |- 1.75,1.7) -- (0.5,1.7) node[left]{$V_{in}$};
  \coordinate (cx) at (2.9,0);
  \draw (mp.D) -- (mp.D -| cx) node[circ]{} to[C,l=$C_L$] (cx) node[ground]{};
  \node[anchor=south,font=\scriptsize] at (mp.D -| cx) {$V_{out}$};
  \draw[->,red!70!black] (-0.35,3.9) -- (-0.35,3.1) node[midway,left,font=\scriptsize]{$I_{DD}$};
  \draw[->,red!70!black] (-0.35,-0.25) -- (-0.35,-1.05) node[midway,left,font=\scriptsize]{$I_{GND}$};
  % waveforms
  \begin{scope}[xshift=5.2cm,yshift=-1.2cm]
    \foreach \y/\t in {4.4/{$V_{in}$},3.2/{$I_{DD}$, $I_{GND}$},2.0/{$V_{DD1}$},0.8/{GND1}} \node[anchor=east,font=\scriptsize] at (0,\y) {\t};
    \draw (0,4.1) -- (1.5,4.1) -- (1.7,4.7) -- (4.0,4.7) -- (4.2,4.1) -- (6,4.1);
    \draw (0,2.9) -- (1.6,2.9) .. controls (1.75,3.7) .. (2.1,2.9) -- (4.1,2.9) .. controls (4.25,3.7) .. (4.6,2.9) -- (6,2.9);
    \node[font=\scriptsize] at (1.85,3.85) {$I_{GND}$};
    \node[font=\scriptsize] at (4.35,3.85) {$I_{DD}$};
    \draw (0,2.0) -- (4.0,2.0) .. controls (4.15,1.5) and (4.3,2.3) .. (4.6,2.0) -- (6,2.0);
    \draw (0,0.8) -- (1.5,0.8) .. controls (1.65,1.3) and (1.8,0.5) .. (2.1,0.8) -- (6,0.8);
    \node[font=\scriptsize,anchor=west] at (4.7,1.6) {dip $=L_D\,di/dt$};
    \node[font=\scriptsize,anchor=west] at (2.2,1.2) {bounce $=L_G\,di/dt$};
    \draw[->] (0,0.3) -- (6.2,0.3) node[right,font=\scriptsize]{$t$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V = L\frac{\Delta I}{\Delta t},\qquad \Delta I \approx \frac{C_L V_{DD}}{t_r}}
$$

**Razavi's numbers:** 0.5 pF switched in 0.5 ns from 3 V draws 3 mA, so through $L_D = L_G = 5$ nH each rail moves **30 mV**. This estimate is rough, because the real current isn't a constant during the edge.

- 30 mV is harmless to a differential analog block on its own. But **hundreds or thousands of gates switch on the same edge**, and their currents add in the shared wire. Hence separate **analog and digital supplies** at the pins.
- A **differential pair** draws an almost constant tail current, so it barely bounces its supply. That's another reason to use differential circuits.
- Some blocks don't fit either domain. A clock buffer driving a sampling switch couples digital-rail noise through $C_{GD}$ of the switch if it sits on the digital supply, and many such buffers pollute the analog supply if it sits there. That calls for a **third, quiet clock supply** (Razavi Fig. 19.64).
- **Measuring it:** a PMOS between on-chip $V_{DD}$ and GND driving a 50 Ω line to a scope shows the shape and size of the supply noise. Its $g_m$ is calibrated with a small static change of $V_{DD}$ (Razavi Fig. 19.65).

> [!tip] Remark
> The same $L\,di/dt$ drives the substrate through its ground ties, which is how bounce becomes substrate noise. The question of which ground the substrate joins belongs to [[Substrate Noise#Separate Supplies, Grounds and Substrate Contacts]].

### Simultaneous Switching Noise and Multiple Pins

```tikz title="Simultaneous switching noise (SSN): N output drivers fall together and return their load current through one shared ground wire L_G. A quiet output that is holding low is referenced to GND1, so it carries the whole bounce to the board as a glitch. Splitting ground over n pins divides it by about n. After Razavi Figs. 19.63 and 19.66."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,0) -- (8.6,0);
  \foreach \x/\l in {1.0/1,2.8/2,5.0/N} {
    \draw (\x,1.3) node[nmos,anchor=S](m\l){};
    \draw (m\l.S) -- (\x,0) node[circ]{};
    \draw (m\l.G) -- ++(-0.25,0) node[left,font=\scriptsize]{in};
    \draw (m\l.D) -- (\x,3.0) node[circ]{} -- ++(0.45,0) node[right,font=\scriptsize]{out \l};
    \draw[->,red!70!black] (\x+0.2,1.1) -- (\x+0.2,0.2);
  }
  \node at (3.9,1.6) {$\cdots$};
  \node[font=\scriptsize,align=center] at (3.0,3.6) {each falling output discharges its off-chip $C_L$: $\Delta I = C_LV_{DD}/t_r$};
  \draw (7.0,1.3) node[nmos,anchor=S](mq){}; \draw (mq.S) -- (7.0,0) node[circ]{};
  \draw (mq.G) -- ++(-0.25,0) node[left,font=\scriptsize]{on};
  \draw (mq.D) -- (7.0,3.0) node[circ]{} -- ++(0.4,0) node[right,font=\scriptsize,align=left]{quiet output (low):\\glitch $=\Delta V_{G}$};
  \draw (8.6,0) node[circ]{} to[L,l=$L_G/n$] (8.6,-1.6) node[ground]{};
  \node[font=\scriptsize,anchor=west] at (8.7,0.25) {GND1};
  \draw[->,red!70!black] (8.2,-0.2) -- (8.2,-1.3) node[midway,left,font=\scriptsize]{$N\Delta I$};
  \begin{scope}[xshift=12.0cm,yshift=0.2cm]
    \draw (0,0) to[L,l_=\scriptsize$L$] (0,-1.6);
    \draw (0.9,0) to[L,l=\scriptsize$L$] (0.9,-1.6);
    \draw (1.8,0) to[L,l=\scriptsize$L$] (1.8,-1.6);
    \draw (0,0) -- (1.8,0); \draw (0,-1.6) -- (1.8,-1.6);
    \node[font=\scriptsize,align=center] at (0.9,0.55) {$n$ pads, wires, pins};
    \node[font=\scriptsize] at (0.9,-2.0) {$\approx L/n$ if uncoupled};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V_{SSN} \approx \frac{L_{eff}}{n}\cdot\frac{N\,C_L V_{DD}}{t_r^2}}
$$

- Bounce scales with the **number of aggressors** $N$ and as $1/t_r^2$. The victim's tolerance stays fixed.
- Fixes in order of cost: slower edges (edge-rate control on outputs), more ground and supply pins (Razavi Fig. 19.66), interleaved supply/ground pins, a separate supply pair just for the output buffers (Carusone §2.4.4), flip-chip.
- Output buffers that deliver tens of mA with fast edges bounce their own rails enough to stretch their rise/fall times and corrupt timing. That's why they get their own pins.

### Worked Example: Ground Bounce with N Outputs

> [!example] Sixteen outputs, one budget
> **Assumed design:** $N=16$ outputs, each driving $C_L = 5$ pF off-chip, $V_{DD}=1.8$ V, $t_r = 1$ ns. Each pin path (wire + lead) is $L = 5$ nH, Razavi's per-pin value. The ground-bounce budget is 100 mV.
> 1. Per output: $\Delta I = C_L V_{DD}/t_r = 5\text{ pF}\times1.8\text{ V}/1\text{ ns} = 9$ mA. Total $N\Delta I = 144$ mA.
> 2. One ground pin: $\Delta V = 5\text{ nH}\times144\text{ mA}/1\text{ ns} = $ **0.72 V**, which is 40% of $V_{DD}$. The quiet outputs glitch by that much.
> 3. Allowed $L_{max} = \Delta V_{max}t_r/\Delta I = 0.1\times10^{-9}/0.144 = 0.69$ nH, so $n \ge 5/0.69 = 7.2$: **8 ground pins** if uncoupled. Same-direction mutual coupling pushes the count higher (next section).
> 4. Alternatives: interleave each ground with a supply wire so the loop sees $L_1+L_2-2M$. Or double $t_r$ to 2 ns, which divides the bounce by 4 (to 0.18 V on one pin) and leaves 2 pins. Or go flip-chip, where each bump is ~0.02 nH and the package planes dominate.

> [!example] Razavi Ex. 19.7: a 25 A microprocessor
> A 600 MHz, 2 V processor changes its supply current by **25 A in about 5 ns**, with 200 ground and 200 supply bondwires at 5 nH each (wire + trace + pin):
> $$\Delta V = \frac{5\text{ nH}}{200}\cdot\frac{25\text{ A}}{5\text{ ns}} = 125\text{ mV}$$
> on each rail. Supply and ground bounce can add in phase, giving about 250 mV, more than 10% of $V_{DD}$. The fix was an external **1 µF** MOS capacitor mounted on top of the die with 160 more supply/ground wire pairs.
> Check with [[#2. From tolerated error to allowed L, C, pins and decap|the decap rule]]: holding 200 mV over 5 ns at 25 A needs $C \ge 25\times5\times10^{-9}/0.2 = 0.63$ µF, so 1 µF fits.

### Decoupling vs Package Resonance

```tikz title="On-chip decoupling. Left: C1 across V_DD1 and GND1 makes the two rails bounce together; R_d damps it. Right: the impedance the on-chip noise current sees, normalised to Z0 = sqrt(L/C). It rises as omega L, peaks at f0 = 1/(2 pi sqrt(LC)) with height about Q Z0, then falls as 1/(omega C). With little series resistance (Q = 20) a clock harmonic at f0 is amplified; R = Z0 flattens the peak. After Razavi Fig. 19.67."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,3.6) node[vcc]{$V_{DD}$} to[L,l=$L_D$] (0,2.2) node[circ](a){} -- (2.6,2.2);
  \draw (0,-0.6) node[circ](b){} -- (2.6,-0.6);
  \draw (b) to[L,l=$L_G$] (0,-2.0) node[ground]{};
  \draw (1.3,2.2) to[R,l=$R_d$] (1.3,0.8) to[C,l=$C_1$] (1.3,-0.6);
  \draw (2.6,2.2) to[I,l=\scriptsize$i_n$ (core)] (2.6,-0.6);
  \node[anchor=east,font=\scriptsize] at (-0.1,2.3) {$V_{DD1}$};
  \node[anchor=east,font=\scriptsize] at (-0.1,-0.5) {GND1};
  \begin{scope}[xshift=5.2cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (7,0) node[right,font=\scriptsize]{$\log f$};
    \draw[->] (0,0) -- (0,5.3) node[above,font=\scriptsize]{$\log|Z|$};
    % y = 1.6*(log10|Z|+1) ; x = 3*(log10 u + 1)
    \draw[thick,red!70!black,domain=-1:1,samples=241] plot ({3*(\x+1)},{1.6*(1+ln(sqrt(1+(10^\x*0.05)^2)/sqrt(0.0025+(10^\x-10^(-\x))^2))/ln(10))});
    \draw[thick,blue!60!black,domain=-1:1,samples=101] plot ({3*(\x+1)},{1.6*(1+ln(sqrt(1+(10^\x)^2)/sqrt(1+(10^\x-10^(-\x))^2))/ln(10))});
    \draw[dashed] (3,0) -- (3,5.0) node[above,font=\scriptsize]{$f_0$};
    \node[font=\scriptsize,red!70!black,anchor=west] at (3.2,4.3) {$R_d\to0$: peak $\approx QZ_0$};
    \node[font=\scriptsize,blue!60!black,anchor=west] at (4.3,1.9) {$R_d=Z_0$};
    \node[font=\scriptsize] at (0.9,0.6) {$\omega L$};
    \node[font=\scriptsize] at (6.2,0.6) {$1/\omega C$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{f_0 = \frac{1}{2\pi\sqrt{L C_1}},\quad L = L_D+L_G,\qquad |Z(f_0)|\approx Q\sqrt{L/C_1},\quad Q=\frac{1}{R_d}\sqrt{\frac{L}{C_1}}}
$$

- **What it does:** if $C_1$ is large enough, $V_{DD1}$ and GND1 move **together**, so the circuit between them sees little noise. The common bounce left on GND1 doesn't matter if the signals are differential.
- **What can go wrong:** if $f_0$ lands on the clock, a harmonic or a subharmonic, the tank **amplifies** the noise by $Q$. Even off resonance, too small a $C_1$ just rings slowly. So add series $R$, or size a MOS capacitor so its own channel resistance does the damping.
- **What it costs:** to be effective the decap's area is typically **comparable to the total gate area of the circuit**, as if the transistor count doubled. That costs yield.

> [!note]- Derivation: impedance seen by the core current (owner's Zettelkasten 15s2)
> With the board as AC ground, the noise current $i_n$ sees $sL$ in parallel with $R_d + 1/(sC_1)$:
> $$Z(s) = \frac{sL\,(1+sR_dC_1)}{s^2LC_1 + sR_dC_1 + 1}$$
> The denominator gives $\omega_0 = 1/\sqrt{LC_1}$, $\zeta = \tfrac{R_d}{2}\sqrt{C_1/L}$, $Q = 1/(2\zeta) = \sqrt{L/C_1}/R_d$. At $\omega_0$, $|Z| \approx L/(R_dC_1) = Q\omega_0L = Q\sqrt{L/C_1}$. Choosing $R_d \approx \sqrt{L/C_1}$ makes $Q \approx 1$, so the peak is no larger than the characteristic impedance. The plotted curves are this formula with $R_d/Z_0 = 0.05$ and $1$.
> **Razavi Ex. 19.7 numbers:** 200 + 200 wires at 5 nH give a loop $L \approx 2\times5/200 = 50$ pH (ignoring mutual coupling). With 1 µF: $f_0 = 1/(2\pi\sqrt{50\text{ pH}\times1\ \mu\text{F}}) \approx 22.5$ MHz, far below the 600 MHz clock, and $Z_0 = \sqrt{L/C} \approx 7$ mΩ.

> [!tip] Remark
> This is the parallel LC tank of [[Microwave Resonators]]; $Q$ means the same thing. The MOS capacitor itself (accumulation vs inversion, its channel resistance) is in [[Capacitor]].

### Inputs, References and Bias Pins

- **Inputs:** the wire $L$ together with $C_{pad}$ and $C_{in}$ forms a 2nd-order low-pass. It cuts bandwidth and makes the input ring. It can limit settling, for example when a switched-capacitor stage connects its capacitors to the input (Razavi cites the multiply-by-two circuit of §13.3.3).
- **External references** (ADC/DAC references, bias voltages): if the circuit injects switching charge into the reference, the package inductance stops the external capacitor from absorbing it quickly. An **off-chip bypass capacitor sits in series with $L_b$** and can't clean a fast on-chip node.

> [!note]- Detail: should a shared bias node be bypassed? (Razavi Ex. 19.8)
> A differential pair used as a current switch: during switching its common source $P$ dips by $(1-\sqrt2/2)(V_{GS}-V_{TH})_{eq}$, and $C_{GD}$ of the tail device couples this onto the shared bias node $X$. With many pairs on $X$ the disturbance adds up.
> - An on-chip $C_X$ must be about **100 to 1000×** the total injecting $C_{GD}$ to swamp the disturbance, but $C_X$ together with $1/g_{m0}$ of the bias device then sets a long recovery time constant.
> - An off-chip $C_X$ is in series with the package $L_b$, so it doesn't bypass fast edges at all.
> - Often the fastest settling comes from **leaving $X$ agile** (small $C_X$). Simulate with the package model.

### Substrate and Ground Through the Paddle

```tikz title="Getting ground and substrate off the die without a long wire. (A) Downbond: a wire from the pad or lead finger down to the paddle (two downbonds in series detect delamination). (B) Fused lead frame: a lead finger is part of the paddle, so the pin is the paddle. (C) Exposed paddle soldered to the board ground plane removes even the pin. Legend as in the first diagram. After Hastings Fig. 5.26 and Razavi Fig. 19.68."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mtwo/.style={fill=violet!55,draw=black!70},
  lf/.style={fill=brown!45,draw=black!70},
  bw/.style={draw=blue!50!black,line width=1.0pt}]
  % (A) top view
  \begin{scope}
    \draw[lf] (0.6,0.6) rectangle (3.6,3.6);
    \draw[psub] (1.2,1.2) rectangle (3.0,3.0);
    \foreach \y in {1.4,2.0,2.6} \draw[mtwo] (1.3,\y) rectangle (1.55,\y+0.25);
    \foreach \y in {1.35,1.95,2.55} \draw[lf] (-0.6,\y) rectangle (0.35,\y+0.35);
    \draw[bw] (1.42,2.72) -- (0.3,2.72);
    \draw[bw] (1.42,2.12) -- (0.3,2.12);
    \draw[bw] (1.42,1.52) .. controls (1.0,1.45) .. (0.85,1.2);
    \draw[bw] (0.0,1.52) .. controls (0.4,1.1) .. (0.8,0.9);
    \node[font=\scriptsize,align=center] at (1.6,-0.1) {(A) downbonds: pad $\to$ paddle\\and finger $\to$ paddle};
  \end{scope}
  % (B)
  \begin{scope}[xshift=5.4cm]
    \draw[lf] (0.6,0.6) rectangle (3.6,3.6);
    \draw[lf] (-0.6,1.95) rectangle (0.6,2.3);
    \draw[psub] (1.2,1.2) rectangle (3.0,3.0);
    \foreach \y in {1.4,2.6} {\draw[mtwo] (1.3,\y) rectangle (1.55,\y+0.25); \draw[lf] (-0.6,\y-0.05) rectangle (0.35,\y+0.3);}
    \draw[bw] (1.42,2.72) -- (0.3,2.72);
    \draw[bw] (1.42,1.52) -- (0.3,1.52);
    \node[font=\scriptsize,align=center] at (1.6,-0.1) {(B) fused lead frame:\\ground finger joined to paddle};
  \end{scope}
  % (C) cross-section
  \begin{scope}[xshift=10.6cm,yshift=0.8cm]
    \fill[gray!35] (0,0.3) rectangle (4.6,2.0);
    \draw[lf] (1.0,0.3) rectangle (3.6,0.6);
    \draw[psub] (1.4,0.68) rectangle (3.2,1.2);
    \draw[fill=gray!65] (1.3,0.6) rectangle (3.3,0.68);
    \draw[lf] (0,0.3) rectangle (0.6,0.55); \draw[lf] (4.0,0.3) rectangle (4.6,0.55);
    \draw[bw] (1.6,1.2) .. controls (1.4,1.6) and (1.15,1.2) .. (1.1,0.6);
    \draw[fill=green!25!gray!30] (-0.2,-0.2) rectangle (4.8,0.2);
    \draw[fill=yellow!40!gray!60] (1.0,0.2) rectangle (3.6,0.3);
    \draw[fill=gray!60] (-0.2,-0.2) rectangle (4.8,-0.1);
    \node[font=\scriptsize,align=center] at (2.3,-0.9) {(C) exposed paddle soldered\\to the board ground plane};
    \draw[<-] (1.25,0.95) -- (0.3,1.6) node[above,font=\scriptsize]{downbond};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Downbond:** a wire from a lead finger (or a ground pad) to the paddle. It needs mount-pad room for the capillary and can be **sheared by mold-compound delamination**. Two downbonds in series (finger → paddle → pad) make a shear an obvious open at test, but delayed failures from thermal cycling still escape.
- **Fused lead frame:** a lead finger is part of the paddle. It is more reliable, so packaging engineers prefer it. It needs a custom frame, which etched frames have made cheap.
- **Exposed paddle (QFN, power packages):** soldered to the board plane, it gives the lowest-inductance ground/substrate path and the best heat path, with no extra assembly cost over a plain plane package (Razavi).
- The die-attach material decides whether the **backside** is really connected: epoxy only keeps it from floating far; solder, eutectic or sinter makes a real contact ([[#Die Attach]]).

## Level 4: Coupling and Pin Assignment

### Mutual Inductance

```tikz title="Mutual inductance works both ways. (a) Two parallel supply wires carrying the same direction of current: L_eq = (L+M)/2, worse than L/2. (b) A supply wire next to its own ground return carrying opposite current: loop L = L1 + L2 - 2M, better than L1 + L2. (c) A noisy wire induces M di/dt in a quiet neighbour. After Razavi Figs. 19.72, 19.73 and 19.75."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \begin{scope}
    \draw (0,0) to[L] (0,2); \draw (1.2,0) to[L] (1.2,2);
    \draw (0,2) -- (1.2,2); \draw (0,0) -- (1.2,0);
    \draw[->,red!70!black] (-0.35,1.4) -- (-0.35,0.6); \draw[->,red!70!black] (1.55,1.4) -- (1.55,0.6);
    \draw[<->,dashed] (0.2,2.25) -- (1.0,2.25) node[midway,above,font=\scriptsize]{$M$};
    \node[font=\scriptsize,align=center] at (0.6,-0.6) {(a) same direction\\$L_{eq}=(L+M)/2$};
  \end{scope}
  \begin{scope}[xshift=4.2cm]
    \draw (0,0) to[L] (0,2); \draw (1.2,0) to[L] (1.2,2);
    \draw (0,0) -- (1.2,0);
    \node[font=\scriptsize,above] at (0,2) {$V_{DD}$}; \node[font=\scriptsize,above] at (1.2,2) {GND};
    \draw[->,red!70!black] (-0.35,1.4) -- (-0.35,0.6); \draw[->,red!70!black] (1.55,0.6) -- (1.55,1.4);
    \draw[<->,dashed] (0.2,2.55) -- (1.0,2.55) node[midway,above,font=\scriptsize]{$M$};
    \node[font=\scriptsize,align=center] at (0.6,-0.6) {(b) opposite (supply + return)\\$L_{loop}=L_1+L_2-2M$};
  \end{scope}
  \begin{scope}[xshift=8.6cm]
    \draw (0,0) to[L] (0,2); \draw (1.4,0) to[L] (1.4,2);
    \node[font=\scriptsize,above] at (0,2) {CK / $V_{DD,D}$}; \node[font=\scriptsize,above] at (1.4,2) {$V_{in}$};
    \draw[->,red!70!black] (-0.35,1.4) -- (-0.35,0.6) node[midway,left,font=\scriptsize]{$di/dt$};
    \node[font=\scriptsize,anchor=west] at (1.75,1.0) {$v = M\,di/dt$};
    \draw[<->,dashed] (0.2,2.55) -- (1.2,2.55) node[midway,above,font=\scriptsize]{$M$};
    \node[font=\scriptsize,align=center] at (0.7,-0.6) {(c) aggressor $\to$ victim};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{L_{\parallel} = \frac{L+M}{2}}\qquad \boxed{L_{loop} = L_1+L_2-2M}\qquad \boxed{v_{victim} = M\frac{di_{aggr}}{dt}}
$$

- Separate analog/digital supplies stop **conductive** coupling. **Mutual inductance** still couples digital supply, clock and output wires into analog supply and input wires.
- With an arbitrary pad order, even a **differential** input doesn't cancel it, because the aggressor isn't symmetric about the two input wires.
- Two cures: run sensitive wires **perpendicular** to aggressors (they end on different sides of the die), or put **quiet ground or supply wires between** them. Even an occasional ground wire among a group of parallel lines makes the mutual coupling negligible (Razavi Fig. 19.74).

> [!note]- Detail: why $(L+M)/2$ and $L_1+L_2-2M$
> Two identical wires in parallel each carry $I/2$. The voltage across either is $L\frac{d(I/2)}{dt}+M\frac{d(I/2)}{dt}=\frac{L+M}{2}\frac{dI}{dt}$. With $M=L$ (perfect coupling) the second wire would buy nothing.
> A loop of two wires carrying $+I$ and $-I$: the drop around the loop is $(L_1-M)\,dI/dt + (L_2-M)\,dI/dt$. Razavi writes the supply/ground pair as "$2L_S-M$". The general loop formula above is the standard form, and it reduces to $2(L_S-M)$ for equal wires.
> **Numbers** (Razavi Prob. 19.16 values, $L=4$ nH, $M=2$ nH between neighbours): two supply wires side by side give 3 nH, not 2 nH. A supply wire beside its ground wire gives a loop of $2(4-2)=4$ nH instead of 8 nH.

> [!note]- Detail: self- and mutual capacitance of the package
> Each trace's capacitance to ground loads the input or the stage driving it, but the bigger effect is resonance: it combines with the wire and trace inductance into an LC with **high Q** (the series resistance is small), which transient currents can excite to a sharp peak that amplifies noise. Trace-to-trace capacitance adds coupling and belongs in simulation (Razavi §19.4).

### Pin Assignment: Good vs Bad

```tikz title="The same die edge bonded two ways. Bad: the analog input sits next to the clock and the digital supply, V_DD pins are grouped together and so are the GND pins (same-direction M adds), and the substrate/analog ground is far from the analog input. Good: the analog input is flanked by analog grounds, every V_DD wire is next to its GND return, digital pins are grouped at the other end, and the clock leaves on a perpendicular side. After Razavi Figs. 19.72-19.75 and Carusone Fig. 2.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mtwo/.style={fill=violet!55,draw=black!70},
  lf/.style={fill=brown!45,draw=black!70},
  bw/.style={draw=blue!50!black,line width=0.9pt}]
  \foreach \xs/\ttl/\lst in {0/{BAD}/{VDD,VDD,VDD,GND,GND,GND,CK,VIN,DVDD},8.0/{GOOD}/{GNDA,VIN+,VIN-,GNDA,VDDA,GNDA,VDDD,GNDD,VDDD}} {
    \begin{scope}[xshift=\xs cm]
      \draw[psub] (0,0) rectangle (6.6,1.6);
      \node[font=\scriptsize] at (3.3,0.4) {die (edge)};
      \foreach \n [count=\i] in \lst {
        \pgfmathsetmacro{\x}{0.1+0.72*(\i-1)}
        \draw[mtwo] (\x,1.15) rectangle (\x+0.4,1.5);
        \draw[lf] (\x-0.05,3.0) rectangle (\x+0.45,3.5);
        \draw[bw] (\x+0.2,1.5) -- (\x+0.2,3.0);
        \node[font=\tiny,rotate=90,anchor=west] at (\x+0.2,3.55) {\n};
      }
      \node[font=\bfseries] at (3.3,5.0) {\ttl};
    \end{scope}
  }
  % annotations bad
  \draw[red!70!black,thick] (4.98,2.2) ellipse (0.65 and 0.35);
  \node[font=\scriptsize,red!70!black,align=center] at (3.3,-0.55) {CK next to VIN: $M\,di/dt$ into the input};
  \draw[red!70!black,thick] (0.9,2.2) ellipse (1.0 and 0.35);
  \node[font=\scriptsize,red!70!black,align=center] at (3.3,-1.05) {grouped VDD: $(L+M)/2$ per pair};
  % good
  \draw[green!45!black,thick] (9.38,2.2) ellipse (1.35 and 0.35);
  \node[font=\scriptsize,green!45!black,align=center] at (11.3,-0.55) {differential input on adjacent pins, flanked by quiet grounds};
  \draw[green!45!black,thick] (12.98,2.2) ellipse (0.65 and 0.35);
  \node[font=\scriptsize,green!45!black,align=center] at (11.3,-1.05) {VDD beside its GND: $L_1+L_2-2M$; CK on another side};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> Which ground the substrate ties to, and why guard rings get their own bondwire among the analog wires, are in [[Substrate Noise#Separate Supplies, Grounds and Substrate Contacts]] and [[Substrate Noise#Floorplanning and Spacing]]. Each separate bondpad on one pin also needs its **own** ESD clamp, because at CDM speeds the bondwire inductance (≈1 nH/mm) puts volts between them ([[Guard Rings, ESD and Interconnect#Star Routing and Kelvin Connections]]).

## Level 5: Thermal Resistance and Package Stress

### Thermal Resistance

```tikz title="Heat path from junction to ambient as a resistor chain. theta_JC (junction to case) is a property of the package. theta_CA (case to ambient) depends on the board copper, heatsink and airflow, so theta_JA = theta_JC + theta_CA is a property of the package on a given board. An exposed paddle with thermal vias shortens the dominant path. After Hastings §5.1.1, Eqs. 5.1-5.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  lf/.style={fill=brown!45,draw=black!70},
  mold/.style={fill=gray!35,draw=black!60}]
  \draw[fill=green!25!gray!30,draw=black!60] (-0.3,-0.6) rectangle (5.3,-0.1);
  \draw[mold] (0,0) rectangle (5,1.8);
  \draw[lf] (1.2,0) rectangle (3.8,0.35);
  \draw[fill=gray!65] (1.4,0.35) rectangle (3.6,0.45);
  \draw[psub] (1.5,0.45) rectangle (3.5,1.0);
  \fill[red!60] (2.5,0.9) circle (0.1); \node[font=\scriptsize,anchor=south] at (2.5,1.0) {$T_J$};
  \draw[->,very thick,red!70!black] (2.5,0.8) -- (2.5,-0.9) node[below,font=\scriptsize]{to board (main path)};
  \draw[->,thick,red!40] (2.0,1.0) -- (1.2,2.3) node[above,font=\scriptsize]{through mold};
  % network
  \begin{scope}[xshift=7.4cm,yshift=-0.6cm]
    \draw (0,2.8) node[left,font=\scriptsize]{$T_J$} node[circ]{} to[R,l=$\theta_{JC}$] (2.4,2.8) node[circ]{} node[above,font=\scriptsize]{$T_C$} to[R,l=$\theta_{CA}$] (4.8,2.8) node[circ]{} node[right,font=\scriptsize]{$T_A$};
    \draw (0,0.4) node[left,font=\scriptsize]{$P_D$} node[circ]{} -- (0,0.6);
    \draw[->] (0,0.6) -- (0,2.6);
    \node[font=\scriptsize,align=left,anchor=west] at (0,1.4) {heat flow = $P_D$\\(like current)};
    \draw[decorate,decoration={brace,amplitude=4pt,mirror}] (0,2.2) -- (4.8,2.2) node[midway,below=5pt,font=\scriptsize]{$\theta_{JA}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{T_J = T_A + \theta_{JA}P_D}\qquad\boxed{T_J = T_C + \theta_{JC}P_D}
$$

| Item | Value (Hastings §5.1.1) |
|---|---|
| Ambient range | commercial 0–70 °C; industrial −40–85 °C; military −55–125 °C; automotive −40 to 85–150 °C |
| Max junction temperature | 125 or 150 °C typical |
| Small surface-mount package, no heatsink provision | $\theta_{JA}$ **> 150 °C/W**, so a fraction of a watt |
| Power package (exposed metal) | $\theta_{JC}$ **< 10 °C/W**, mounted on a heatsink |
| Board copper | a few cm² dissipate 1–2 W; beyond that, finned heatsinks and forced air |
| Leakage | doubles about every 8 °C: 1 nA at 125 °C is 1 µA at about 205 °C |

- $\theta_{JA}$ **depends strongly on board layout and airflow**, while $\theta_{JC}$ stays fixed. So datasheets quote $\theta_{JA}$ on a standard board.
- **Example:** a small SMD part with $\theta_{JA} = 150$ °C/W, $T_{A,max} = 70$ °C and $T_{J,max} = 125$ °C may dissipate at most $(125-70)/150 = 0.37$ W.
- Flip-chip moves heat differently: the die's back faces up toward a lid or heat spreader (Palermo L2 slide 6). Copper pillars conduct heat about 5× better than solder, so they can be placed over power devices to draw heat out (Hastings §15.3.4).

> [!tip] Remark
> Heat inside the die (gradients from a power device, and how to place matched pairs around them) is in [[Device Matching#Temperature and Heat Sources]]. Overheating as a failure mechanism (thermal runaway, silicon going intrinsic above ~325–450 °C) is in [[Failure Mechanisms]].

### Package-Induced Stress

- **Source:** mold compound cures hot and shrinks more than silicon as it cools, so it compresses the die. Copper lead frames (CTE mismatch), rigid die attach (solder, eutectic, sinter) and chip-scale bumps add more. Alloy 42 frames, epoxy attach, low-stress compound and polyimide overcoats reduce it.
- **Effect:** stress **gradients** are smallest at the die centre and largest at edges and corners; under bumps they peak at each bump's perimeter. They shift matched resistors and transistors (package shift), drift with time, moisture and temperature, and show hysteresis.
- **Bumps:** chip-scale bumps are torn off by die-to-PCB CTE mismatch. Bump-on-I/O is limited to about a **6×6** array, while bump-on-polymer (a compliant BCB layer under the RDL) reaches **12×12 at 0.5 mm** pitch (Hastings §15.3.4).

> [!tip] Remark
> Where to put matched devices given this stress map, the piezoresistive coefficients, and the rules for bumped dice are all in [[Device Matching#Mechanical Stress and Package Shift]]. This note only names the package as the source.

## Level 6: High-Speed Packaging

### Flip-Chip: Bumps and Pillars

```tikz title="Bumped die interconnect in cross-section, drawn face up (in use the die is flipped onto the substrate). Bump-on-I/O: solder ball on a copper under-bump metal (UBM) over the top-metal pad. Bump-on-polymer: a copper redistribution layer (RDL) on a compliant BCB polymer moves the bump anywhere over the die. Copper pillar: a tall Cu post with a solder cap allows much finer pitch. Die layer colours from the Layout legend. After Hastings Figs. 15.17-15.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  mtwo/.style={fill=violet!55,draw=black!70},
  nit/.style={fill=magenta!40,draw=black!60},
  diel/.style={fill=gray!8,draw=black!40},
  cu/.style={fill=orange!70!brown!60,draw=black!70},
  bcb/.style={fill=violet!25,draw=black!50},
  sold/.style={fill=yellow!40!gray!60,draw=black!60}]
  \foreach \xs/\t in {0/{bump-on-I/O},5.0/{bump-on-polymer (RDL)},10.0/{copper pillar}} {
    \begin{scope}[xshift=\xs cm]
      \draw[psub] (0,0) rectangle (4,0.7);
      \draw[diel] (0,0.7) rectangle (4,1.0);
      \node[font=\scriptsize] at (0.6,0.35) {die};
      \node[font=\scriptsize\bfseries] at (2,-0.4) {\t};
    \end{scope}
  }
  % bump on IO
  \draw[mtwo] (1.2,1.0) rectangle (2.8,1.12);
  \draw[nit] (0,1.0) rectangle (1.4,1.18); \draw[nit] (2.6,1.0) rectangle (4,1.18);
  \draw[cu] (1.35,1.12) rectangle (2.65,1.35);
  \draw[sold] (2.0,2.0) circle (0.7);
  \node[font=\scriptsize,anchor=west] at (2.75,1.3) {Cu UBM};
  \node[font=\scriptsize] at (2.0,2.0) {solder};
  \node[font=\scriptsize,anchor=west] at (2.9,2.7) {$\approx$100 µm ball};
  % bump on polymer
  \begin{scope}[xshift=5.0cm]
    \draw[mtwo] (0.3,1.0) rectangle (1.0,1.12);
    \draw[nit] (0,1.0) rectangle (0.4,1.18); \draw[nit] (0.9,1.0) rectangle (4,1.18);
    \draw[bcb] (0,1.18) rectangle (4,1.45);
    \draw[cu] (0.5,1.12) rectangle (0.8,1.45);
    \draw[cu] (0.5,1.45) rectangle (3.0,1.62);
    \draw[bcb] (0,1.62) rectangle (1.9,1.8); \draw[bcb] (2.9,1.62) rectangle (4,1.8);
    \draw[sold] (2.4,2.35) circle (0.6);
    \draw[<-] (1.2,1.55) -- (0.6,2.3) node[above,font=\scriptsize] {RDL (Cu)};
    \node[font=\scriptsize,anchor=west] at (3.1,1.35) {BCB};
  \end{scope}
  % pillar
  \begin{scope}[xshift=10.0cm]
    \draw[mtwo] (1.4,1.0) rectangle (2.6,1.12);
    \draw[nit] (0,1.0) rectangle (1.55,1.18); \draw[nit] (2.45,1.0) rectangle (4,1.18);
    \draw[cu] (1.55,1.12) rectangle (2.45,2.4);
    \draw[sold] (1.55,2.4) rectangle (2.45,2.75);
    \node[font=\scriptsize,anchor=west] at (2.55,1.75) {Cu pillar 25--75 µm tall};
    \node[font=\scriptsize,anchor=west] at (2.55,2.6) {solder cap};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Technology | Size / pitch (Hastings §15.3.4) | Note |
|---|---|---|
| Bump-on-I/O | ≈100 µm balls, ≥200 µm pitch, UBM 6–10 µm Cu | ≤ 6×6 array (stress). Used for wafer-level packaging |
| Bump-on-protective-overcoat | 6–10 µm Cu RDL | Routing freedom, same stress limit |
| Bump-on-polymer | up to 12×12 at 0.5 mm | Compliant BCB. Pitch below ~125 µm is hard |
| Copper pillar | ≈50 µm dia (down to 25 µm), 25–75 µm tall, pitch to 50 µm | Fine pitch, oval pillars for current, 5× solder's thermal conductivity |
| Standard 2D package bumps (Palermo L15) | 80 µm dia, 110–130 µm pitch | Chiplets over the laminate, > 50 mm and > 10 dB loss |
| Microbumps (3D) | ~50 µm pitch, scaling to ~5 µm | Die-on-die |
| Hybrid bonding | < 1 µm pitch | Oxide-oxide plus Cu-Cu, the densest |

- **Three ways to mount a bumped die** (Hastings Fig. 15.16): straight on the PCB (**CSP**, smallest and cheapest); on a laminate with its own ball array (**FC-BGA**, which allows finer die pitch than board pitch, multiple dice in one package (MCM), and SMD capacitors and air-core inductors/baluns in the substrate); or on a lead frame (bumped chip-on-lead, much lower resistance than wirebonds).
- **Solder is an electromigration weak spot:** lead-free solder handles only about **2%** of aluminium's current density ([[Electromigration]]).
- Pads stop being a perimeter ring. Bumps are **arrayed over the whole die**, and the ESD devices may sit next to each bump instead of in a padring.

### Why SerDes Uses Flip-Chip

| Parameter (Intel, Palermo L2 slide 8) | Wirebond (CPGA / PPGA / H-PBGA) | Flip-chip (OLGA / FC-PGA) |
|---|---|---|
| Bondwire / bump $L$ | 2.1–4.6 nH | **0.013–0.02 nH** |
| Bondwire / bump $R$ | 114–188 mΩ | **0.06–2 mΩ** |
| Trace $Z_0$ | 42–47 Ω | 38.5–43 Ω |
| Pin/land $L$ | 4.0–4.5 nH | 0.75–2.9 nH |

- **Series $L$ at the pad is a reflection.** A few nH at tens of GHz is tens to hundreds of ohms in series with a 50 Ω line. Flip-chip removes it; the remaining package trace is a **controlled-impedance** line on the laminate, with planes for the return path.
- **Area array:** more signal pins *and* more supply/ground bumps right above the circuits that draw the current, so supply bounce falls along with signal discontinuities.
- Package traces are still lossy lines with crosstalk. At connectors and packages, spacing is small compared with the distance to a shield, so they dominate NEXT/FEXT ([[Channels#Level 4 Crosstalk]]).
- **AC coupling** (off-chip series capacitors) lets the receiver set its own common mode at the cost of a low-frequency cut-off, so data must be DC-balanced. Its design is in [[Receivers#AC or DC Coupling, and the Input Common Mode]]. The pad behind the capacitor still needs full ESD protection.

> [!tip] Remark
> The pad-side half of the problem, the $C_{tot}$ budget from $|S_{11}|$ and the T-coil that hides ESD capacitance, is in [[Guard Rings, ESD and Interconnect#ESD for High-Speed I/O]] and [[High-Speed Circuit Techniques#T-coils at the pad]]. How the package sits inside the whole channel (pulse response, ISI, TDR of the package) is in [[Channels]]. Line theory itself is in [[Transmission Lines]].

### 2.5D and 3D: Chiplets

```tikz title="From one die to chiplets. Standard 2D: dice side by side on the laminate. 2.5D: a silicon interposer (or a small embedded silicon bridge) carries fine-pitch die-to-die wiring. 3D: dice stacked with microbumps or hybrid bonding and through-silicon vias. Pitch shrinks from ~100 um to below 1 um as you go down. After Palermo ECEN720 L15 slides 8-13 (Das Sharma 2024, Wu ISSCC 2025)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  lam/.style={fill=green!35!gray!40,draw=black!60},
  sold/.style={fill=yellow!40!gray!60,draw=black!60},
  die/.style={fill=orange!12,draw=black!60},
  ip/.style={fill=cyan!18,draw=black!60}]
  % 2D
  \begin{scope}
    \draw[lam] (0,0) rectangle (4.6,0.45);
    \draw[die] (0.3,0.65) rectangle (2.0,1.25); \draw[die] (2.6,0.65) rectangle (4.3,1.25);
    \foreach \x in {0.5,0.9,1.3,1.7,2.8,3.2,3.6,4.0} \draw[sold] (\x,0.55) circle (0.1);
    \draw[blue!60!black,thick] (1.7,0.45) -- (1.7,0.3) -- (2.8,0.3) -- (2.8,0.45);
    \node[font=\scriptsize\bfseries] at (2.3,1.65) {2D (standard)};
    \node[font=\scriptsize,align=center] at (2.3,-0.55) {bumps 110--130 µm pitch\\$\approx$25 µm traces};
  \end{scope}
  % 2.5D interposer
  \begin{scope}[xshift=5.4cm]
    \draw[lam] (0,0) rectangle (4.6,0.45);
    \foreach \x in {0.4,1.0,1.6,2.2,2.8,3.4,4.0} \draw[sold] (\x+0.1,0.53) circle (0.08);
    \draw[ip] (0.2,0.61) rectangle (4.4,0.9);
    \draw[die] (0.4,1.0) rectangle (2.0,1.5); \draw[die] (2.6,1.0) rectangle (4.2,1.5);
    \foreach \x in {0.6,0.85,1.1,1.35,1.6,1.85,2.75,3.0,3.25,3.5,3.75,4.0} \draw[sold] (\x,0.95) circle (0.05);
    \draw[blue!60!black,thick] (1.85,0.9) -- (1.85,0.75) -- (2.75,0.75) -- (2.75,0.9);
    \node[font=\scriptsize\bfseries] at (2.3,1.9) {2.5D (Si interposer / bridge)};
    \node[font=\scriptsize,align=center] at (2.3,-0.55) {BEOL wiring $\approx$0.4 µm L/S,\\up to 5 metals};
  \end{scope}
  % 3D
  \begin{scope}[xshift=10.8cm]
    \draw[lam] (0,0) rectangle (4.0,0.45);
    \foreach \x in {0.5,1.0,1.5,2.0,2.5,3.0,3.5} \draw[sold] (\x,0.55) circle (0.1);
    \draw[die] (0.3,0.65) rectangle (3.7,1.1); \draw[die] (0.3,1.18) rectangle (3.7,1.63);
    \foreach \x in {0.5,0.8,...,3.5} \fill[black] (\x-0.04,1.1) rectangle (\x+0.04,1.18);
    \foreach \x in {1.0,2.0,3.0} \fill[gray!70] (\x-0.04,0.65) rectangle (\x+0.04,1.1);
    \node[font=\scriptsize\bfseries] at (2.0,2.0) {3D (stacked)};
    \node[font=\scriptsize,align=center] at (2.0,-0.55) {microbumps $\sim$50$\to$5 µm,\\hybrid bond $<$1 µm; TSVs};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Why chiplets:** yield makes large dice in advanced nodes expensive, and each chiplet can use the process that suits it. The cost is that many dense, energy-efficient die-to-die links are needed.
- **Trade:** standard 2D packaging is cheap but limited in bandwidth density, with long lossy traces. A silicon interposer is dense but large and expensive. A silicon bridge (EMIB) puts fine-pitch silicon only where it's needed. A fan-out RDL interposer is cheaper with no reticle limit (~1 µm L/S, heading to 0.5 µm).
- **Circuit consequences:** single-ended links for density, simultaneous switching noise, crosstalk from scaled bump and trace pitch, and very tight energy-per-bit budgets.

## Pad and Package Co-Design Rules

Consider the package from the first floorplan, not after layout. Simulate with a package model ([[#The Lumped Model]]).

1. **Split supplies at the pins:** separate analog and digital supply/ground pins, and a separate pair for output buffers. Join the domains at one point on the board. If one pin must be shared, use separate bondwires to separate pads, or at least separate nets from the pad onward (Carusone Fig. 2.34).
2. **Count supply pins from $L\,di/dt$:** $n \ge L_{pin}\,\Delta I/(\Delta V_{max}t_r)$, then add margin for same-direction mutual coupling.
3. **Interleave $V_{DD}$ and GND** so each supply wire runs beside its return ($L_1+L_2-2M$).
4. **Guard sensitive pins:** flank analog inputs and references with quiet grounds, keep clocks and outputs away or on a perpendicular side, and route differential pairs on adjacent pins, symmetric about any aggressor.
5. **Short wires for critical pins:** put the analog inputs, supplies and substrate ground where the bondwires are shortest (mid-side of the die and package, not corners).
6. **Ground and substrate through the paddle:** downbond or a fused lead to an exposed paddle soldered to the board plane; solder, eutectic or sinter attach if the backside contact must be ohmic.
7. **Decap on chip, damped:** size it from $\Delta I\,\Delta t/\Delta V$, check $f_0$ against the clock and its harmonics and subharmonics, and add $R$ (or rely on MOS channel resistance) for $Q\approx1$.
8. **Keep fast pads small and lean:** octagonal pads, top-metal-only pads where the bonding rules allow, and the smallest qualified ESD. Count $C_{tot}$ against the $|S_{11}|$ budget.
9. **Above a few Gb/s or for big supply currents, use flip-chip:** bumps over the circuits, controlled-impedance package traces, AC coupling where common modes differ.
10. **Matched devices away from stress:** die centre and axes, not near edges, corners or bump perimeters. Use low-stress attach and frame for precision parts.
11. **One ESD clamp per bondpad**, even when several pads share a pin (bondwire $L$ isolates them during CDM).
12. **Check thermal:** $\theta_{JA}\le(T_{J,max}-T_{A,max})/P_D$. Use a thermal pad with vias if not.

## Design intuition / trade-offs

| Knob | What improves | What it costs |
|---|---|---|
| More supply/ground pins | Bounce $\propto 1/n$ | Pins, package size, pad-limited die |
| Interleave $V_{DD}$/GND | Loop $L$ falls by $2M$ | Freedom in the pin-out |
| Slower output edges | Bounce $\propto 1/t_r^2$ | Output timing margin |
| Differential circuits and signalling | Constant supply current, rejects common bounce | Pins (two per signal), power |
| On-chip decap | Supply–ground difference | Area ≈ gate area, yield, resonance risk |
| Damping resistor on the decap | Kills the resonance peak | Less effective decap at high frequency |
| Shorter bondwires / smaller cavity | $L\approx1$ nH/mm less | Package choice, die/package co-design |
| Exposed paddle + downbond / fused lead | Ground, substrate, heat | Cost, delamination risk (downbond) |
| Flip-chip | $L$ ~100× lower, area I/O, heat out the back | Cost, bump stress, solder EM, routing to bumps |
| Rigid die attach (solder, eutectic, sinter) | Ohmic backside, heat | More stress on matched devices |
| Octagonal / single-metal pad | $C_{pad}$ about 20% lower | Lift-off risk (single metal) |
| Copper wire instead of gold | Cost, conductivity | Harder: more stress under the pad |

## Cheat sheet

| Quantity | Formula / value |
|---|---|
| Bondwire inductance | $L\approx0.2\ln(2h/r)$ nH/mm $\approx1$ nH/mm |
| Flat trace over plane | $L\approx1.6d/(K_fW)$ nH/mm, $K_f\approx0.72d/W+1$ |
| Mutual inductance, two wires | $L_m\approx0.1\ln[1+(2h/d)^2]$ nH/mm |
| Total per pin | wirebond 2–20 nH; flip-chip bump ≈0.01–0.02 nH |
| Bondwire resistance | $R_{bw}=4\rho L/(\pi D^2)$; 25 µm × 1 mm Au ≈ 47 mΩ |
| Pad capacitance | $C_{pad}=C_aA+C_fP$; 75 µm pad ≈ 38 fF (1 metal), 60 fF (2 metals) |
| Bounce | $\Delta V=L\,\Delta I/\Delta t$, $\Delta I\approx C_LV_{DD}/t_r$ |
| SSN, $N$ outputs on $n$ pins | $\Delta V\approx (L/n)\,N C_LV_{DD}/t_r^2$ |
| Allowed inductance | $L_{max}=\Delta V_{max}t_r/\Delta I$ |
| Parallel wires | $(L+M)/2$ |
| Supply + return loop | $L_1+L_2-2M$ |
| Induced voltage | $v=M\,di/dt$ |
| Decap size | $C_{dec}\ge\Delta I\,\Delta t/\Delta V_{max}$ |
| Package resonance | $f_0=1/(2\pi\sqrt{LC})$, $|Z(f_0)|\approx Q\sqrt{L/C}$, $Q=\sqrt{L/C}/R$ |
| Damping | $R\approx\sqrt{L/C}$ for $Q\approx1$ |
| Input LC corner | $1/(2\pi\sqrt{L_{bw}(C_{pad}+C_{in})})\gg f_{signal}$ |
| Junction temperature | $T_J=T_A+\theta_{JA}P_D=T_C+\theta_{JC}P_D$ |
| Thermal budget | $\theta_{JA}\le(T_{J,max}-T_{A,max})/P_D$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19)
  - §19.2.8 Pads and ESD Protection, pp. 757–759: pad size and spacing (Fig. 19.48), two-metal pad (Fig. 19.49), Example 19.6 pad capacitance (Fig. 19.50), octagonal pad (Fig. 19.51). The ESD part is left to [[Guard Rings, ESD and Interconnect]].
  - §19.3 Substrate Coupling, pp. 760–764: used only for the bond-wire-to-substrate link (Figs. 19.53, 19.56–19.60); owned by [[Substrate Noise]].
  - §19.4 Packaging, pp. 764–772: DIP and its electrical model (Fig. 19.61), Eqs. 19.19–19.21 (Fig. 19.62), self-inductance and bounce (Fig. 19.63), clock-buffer supply (Fig. 19.64), supply-noise measurement (Fig. 19.65), multiple wires (Fig. 19.66), Example 19.7, on-chip decap (Fig. 19.67), ground-plane package and downbond (Fig. 19.68), inputs and references, Example 19.8 (Figs. 19.69–19.71), mutual inductance (Figs. 19.72–19.75), self- and mutual capacitance. Problems 19.14–19.17.
- **Hastings, *The Art of Analog Layout*, 3rd ed.** (printed page = PDF − 1)
  - §2.8 Assembly, pp. 110–114: probing, backgrind, sawing, laser scribing (Fig. 2.42); §2.8.1 Mount and Bond: lead frames, Alloy 42, die attach options, ball and wedge bonding, Cu/PCC wire (Figs. 2.43–2.44); §2.8.2 Packaging: Table 2.4, transfer molding, trim/form, marking, final test.
  - §5.1.1 Self-Heating, p. 211: Eqs. 5.1–5.2, $\theta_{JA}$, $\theta_{JC}$, ambient ranges, leakage vs temperature.
  - §5.3 (pp. 253–254): backside contact, downbonds and fused lead frames (Fig. 5.26).
  - §7.2 p. 357: bondwire inductance estimate (used via [[Inductor]]).
  - §15.3.3 Bondpads, pp. 801–804: thermosonic bonding, EFO, bondwire pitch, Eq. 15.17 bondwire resistance, wire materials. Bondpad layout rules (Figs. 15.12–15.15, BOAC, probe pads) are left to [[Floorplanning and Top-Level Assembly]].
  - §15.3.4 Solder Bumps and Copper Pillars, pp. 805–809: SLT/C4 history, CSP/laminate/lead-frame mounting (Fig. 15.16), bump-on-I/O, bump-on-PO, bump-on-polymer, copper pillars (Figs. 15.17–15.20), solder electromigration.
  - §8.2.8 and §13 Rule 13 (package stress, stress near bumps): used only via the [[Device Matching]] link.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.**, §2.4.4 Noise Considerations, pp. 109–110: separate analog/digital/output-buffer supply pins, two bondwires from one pin, separate nets from one pad (Fig. 2.34). No other packaging content in Ch. 2.
- **Palermo, ECEN720 (Texas A&M)**
  - Lecture 2 (Channels), slides 5–8: package types and pin counts, package examples (wirebond, FC/wirebond, FC/solder ball), Dally's package model (bondwire and trace L, C, K), Intel wirebond vs flip-chip parasitic table.
  - Lecture 15 (Die-to-Die Transceivers), slides 5–13: chiplet motivation, signalling challenges, 2D/2.5D/3D packaging, silicon interposer, silicon bridge, fan-out RDL, microbumps and hybrid bonding.
  - Lecture 5 slide 8 (AC vs DC coupling): only as a pointer to [[Receivers]].
- **Owner's Zettelkasten** (`AnalogTheory/Process Layout and Packaging/`): `15q` (octagon area/perimeter arithmetic), `15s1` (bounce linear in the number of aggressors; third clock supply), `15s2` (impedance $Z(s)$ of the decap tank, $|Z(f_0)|\approx Q\omega_0L$), `15s3` (off-chip bypass in series with $L_b$). Rewritten, not copied.
