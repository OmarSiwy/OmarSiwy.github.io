---
title: Substrate Noise
description: How switching circuits inject current into the shared silicon substrate, how it spreads through lightly and heavily doped substrates, how analog devices pick it up, and how guard rings, buried shields, differential circuits, grounding, floorplanning and timing buy back isolation, with the spec-to-isolation budget and the extraction and optimisation tools.
kind: topic
status: growing
aliases:
  - Substrate Noise
  - Substrate Coupling
  - Mixed-Signal Isolation
---

Every device on a die sits in one piece of silicon. When digital gates switch, part of their current goes into that silicon, spreads through it, and comes back up under the analog circuits as a voltage on their bodies and junctions. This note follows that path in the order it happens: **injection** (how current gets in), **propagation** (where it goes, which depends almost entirely on the substrate type), **reception** (how a circuit feels it), then **mitigation** (what layout and circuit design can do), and finally how it is **simulated, extracted and optimised**. Guard-ring *structures* are drawn in [[Guard Rings, ESD and Interconnect]]; here they appear only as isolation devices with measured dB.

## The big picture

```tikz title="Substrate noise on one screen: a digital injector and an analog receiver share one substrate. Injection (1 junction C dV/dt, 2 impact ionization, 3 well capacitance, 4 L di/dt bounce on ties), propagation through a resistive network to the backplate and into guard rings, reception through body effect and junction pickup. After Charbon Figs. 2.1, 2.4, 8.12 and Razavi Fig. 19.53."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sres/.style={blue!60!black}]
  \draw[psub] (0,0) rectangle (16,3.2);
  \draw[very thick] (0,0) -- (16,0);
  \node[font=\scriptsize,anchor=north] at (8,-0.05) {backplate (die attach, $L_{gnd}$ to ground)};
  % digital
  \draw[nwell] (0.3,3.2) -- (0.3,2.2) -- (3.0,2.2) -- (3.0,3.2);
  \draw[pdiff] (0.6,3.2) rectangle (1.2,2.95); \draw[pdiff] (1.9,3.2) rectangle (2.5,2.95);
  \draw[poly] (1.25,3.22) rectangle (1.85,3.45);
  \draw[ndiff] (3.6,3.2) rectangle (4.2,2.95); \draw[ndiff] (4.9,3.2) rectangle (5.5,2.95);
  \draw[poly] (4.25,3.22) rectangle (4.85,3.45);
  \draw[pdiff] (6.0,3.2) rectangle (6.6,2.95);
  \node[font=\scriptsize] at (1.55,3.7) {PMOS};
  \node[font=\scriptsize] at (4.55,3.7) {NMOS};
  \node[font=\bfseries] at (3.0,5.0) {digital (injector)};
  \node[font=\scriptsize] at (6.3,3.45) {tie};
  \draw[->,thick,red!70!black] (5.2,4.3) -- (5.2,3.25) node[pos=0,above,font=\scriptsize] {$V_{DD}$ swing};
  % analog
  \draw[ndiff] (11.3,3.2) rectangle (11.9,2.95); \draw[ndiff] (12.6,3.2) rectangle (13.2,2.95);
  \draw[poly] (11.95,3.22) rectangle (12.55,3.45);
  \draw[pdiff] (13.7,3.2) rectangle (14.3,2.95);
  \node[font=\scriptsize] at (12.25,3.7) {analog NMOS};
  \node[font=\scriptsize] at (14.0,3.45) {tie};
  \node[font=\bfseries] at (13.0,5.0) {analog (receiver)};
  % guard ring
  \draw[pdiff] (8.6,3.2) rectangle (9.2,2.95);
  \node[font=\scriptsize] at (8.9,3.45) {ring};
  % injection
  \draw[->,thick,red!70!black] (5.3,2.9) -- (5.7,2.2);
  \node[font=\scriptsize,red!70!black,anchor=north east] at (6.15,2.2) {\textcircled{\tiny 1} $C_{jd}\,dV/dt$};
  \draw[->,thick,red!70!black] (4.55,2.9) -- (4.0,1.4);
  \node[font=\scriptsize,red!70!black,anchor=north] at (3.8,1.4) {\textcircled{\tiny 2} $I_{ii}$ (holes)};
  \draw[->,thick,red!70!black] (1.65,2.15) -- (1.65,1.65);
  \node[font=\scriptsize,red!70!black,anchor=north] at (1.65,1.65) {\textcircled{\tiny 3} well-sub $C$};
  % mesh
  \coordinate (A) at (6.3,2.6); \coordinate (G) at (8.9,2.6); \coordinate (B) at (12.25,2.6);
  \draw[sres] (A) to[R,l=\scriptsize$R_{1gr}$] (G) to[R,l=\scriptsize$R_{2gr}$] (B);
  \draw[sres] (A) -- (6.3,2.95);
  \draw[sres] (G) -- (8.9,2.95);
  \draw[sres] (B) -- (12.25,2.95);
  \draw[sres] (A) -- (6.3,1.7) to[R,l_=\scriptsize$R_{10}$] (6.3,0);
  \draw[sres] (B) -- (12.25,1.7) to[R,l=\scriptsize$R_{20}$] (12.25,0);
  \draw[sres] (6.3,1.7) to[R,l=\scriptsize$R_{12}$ (deep path)] (12.25,1.7);
  \fill[sres] (A) circle (1.5pt) (G) circle (1.5pt) (B) circle (1.5pt) (6.3,1.7) circle (1.5pt) (12.25,1.7) circle (1.5pt);
  % bond wires
  \draw (6.3,3.2) -- (6.3,4.1) to[L,l=\scriptsize$L_D$] (7.9,4.1) -- (7.9,3.85) node[ground]{};
  \draw (8.9,3.65) -- (8.9,4.1) to[L,l=\scriptsize$L_{gr}$] (10.5,4.1) -- (10.5,3.85) node[ground]{};
  \node[font=\scriptsize,red!70!black,anchor=west] at (6.4,4.75) {\textcircled{\tiny 4} $L\,di/dt$ ground bounce on ties};
  % reception
  \draw[->,thick,green!40!black] (12.25,2.6) -- (12.25,2.95);
  \node[font=\scriptsize,green!40!black,anchor=west,align=left] at (13.0,2.3) {body effect $g_{mb}v_{bs}$\\ + junction $C_j$ pickup};
  \node[font=\scriptsize,fill=white,inner sep=1pt] at (2.7,0.6) {INJECTION};
  \node[font=\scriptsize,fill=white,inner sep=1pt] at (9.25,0.45) {PROPAGATION};
  \node[font=\scriptsize,fill=white,inner sep=1pt] at (14.2,0.6) {RECEPTION};
  % legend
  \begin{scope}[yshift=-1.1cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-sub / p-epi};
    \draw[nwell] (2.6,0) rectangle (3.0,0.25); \node[anchor=west] at (3.05,0.12) {n-well};
    \draw[ndiff] (4.4,0) rectangle (4.8,0.25); \node[anchor=west] at (4.85,0.12) {n+ diffusion};
    \draw[pdiff] (6.6,0) rectangle (7.0,0.25); \node[anchor=west] at (7.05,0.12) {p+ diffusion (tie, ring)};
    \draw[poly] (10.3,0) rectangle (10.7,0.25); \node[anchor=west] at (10.75,0.12) {poly};
    \draw[sres] (11.8,0.12) -- (12.2,0.12); \node[anchor=west] at (12.25,0.12) {substrate resistance};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Three stages, three handles.** Injection (junction $C\,dV/dt$, impact ionization, bounce on substrate ties), propagation (a resistive network up to about 2–5 GHz), reception (body effect at all frequencies, capacitive pickup above about 1 MHz). Cut any one of them.
> 2. **Body effect is the dangerous receptor:** $g_{mb}/g_m = 0.1$–$0.3$, so the bulk-to-drain gain is only 14–20 dB below the gate-to-drain gain.
> 3. **The substrate type decides which fixes work.** Heavily doped (epi on p+): the bulk is one node, distance stops helping beyond about 2.5–5 epi thicknesses, guard rings buy only 7–10 dB, and the backplate ground impedance is everything. Lightly doped: current flows near the surface, so distance and guard rings work.
> 4. **Isolation is a budget:** $I = 20\log_{10}(V_{rcv}/V_{inj})$. Allowed input-referred error $\div\ \eta \div V_{inj}$ gives the dB you must buy.
> 5. **A guard ring is only as good as its ground:** thin rings, their own low-inductance bond wire, placed around the injector if the ground wire is noisy. With several nH of ground inductance a ring barely helps at 1 GHz, and one grounded to the internal ground can be worse than no ring.

> [!tip] Remark
> This is the *environmental* noise that [[Noise]] sets aside: it is deterministic interference from other circuits, not the thermal/flicker device noise analysed there, so it is budgeted as an error (dB of isolation), not integrated as a PSD. The one exception is the substrate's own resistive thermal noise ([[#What Substrate Coupling Does to a Circuit]]).

**Map:** [[#Spec translation|spec → isolation budget]] → [[#Level 0 The Coupling Two-Port|two-port and substrate types]] → [[#Level 1 Injection|injection]] → [[#Level 2 Propagation|propagation]] → [[#Level 3 Reception|reception and its effects]] → [[#Level 4 Mitigation|mitigation]] → [[#Level 5 Simulation, Extraction and Optimisation|extraction and optimisation]].

## Spec translation

Substrate noise is not a block; it is an error source that every sensitive block budgets for. The translation runs: block sensitivity → allowed disturbance at the receptor → required isolation from each injector → the cheapest structure that delivers it.

```tikz title="The spec-translation chain: a block's error budget becomes an allowed substrate voltage at the receptor, then the isolation each injector must be held to, then the cheapest structure; extraction closes the loop. After Charbon Ch. 5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=1.3cm,text width=2.5cm,font=\scriptsize}]
  \node[blk,fill=yellow!15] (a) at (0,0) {\textbf{block spec}\\ ½ LSB, $J_{pp}$, spur dBc, NF};
  \node[blk,fill=green!12] (b) at (3.4,0) {\textbf{allowed error}\\ $\varepsilon$ at the receptor\\ (split per injector)};
  \node[blk,fill=green!12] (c) at (6.8,0) {\textbf{allowed $v_{sub}$}\\ $\varepsilon/\eta$ (body)\\ or $\varepsilon/$divider (cap.)};
  \node[blk,fill=red!10] (d) at (10.2,0) {\textbf{required isolation}\\ $I_{dB}\le 20\log\frac{v_{sub}}{V_{inj}}$};
  \node[blk,fill=blue!10] (e) at (13.6,0) {\textbf{cheapest fix}\\ spacing, ring, shield,\\ differential, ground};
  \draw[->,thick] (a) -- (b); \draw[->,thick] (b) -- (c); \draw[->,thick] (c) -- (d); \draw[->,thick] (d) -- (e);
  \draw[->,thick,dashed] (e.south) -- ++(0,-0.6) -| node[pos=0.25,below,font=\scriptsize] {extract substrate network + SPICE with the injector's noise signature; iterate} (b.south);
  \node[font=\scriptsize,anchor=north] at (6.8,-0.75) {$\eta=g_{mb}/g_m=0.1$--$0.3$};
  \node[font=\scriptsize,anchor=north] at (10.2,-0.75) {$V_{inj}$: injector swing};
\end{circuitikz}
\end{document}
```

### 1. What each block can tolerate

| Block | Spec that substrate noise eats | Receptor inside it | How the disturbance enters |
|---|---|---|---|
| ADC / S&H / SC integrator | error $\le$ ½ LSB at the sampling instant; DC offset from clock leakage | input pair, sampling switch body, capacitor bottom plates | $g_{mb}v_{sub}$ on the input device; $C_{bp}$ coupling; clock leakage into the sampler appears as DC offset (Charbon §7.4.3) |
| VCO / PLL | peak-to-peak and rms jitter, spur level (dBc) | delay-cell devices, varactor/tuning node, bias | $V_{TH}$ modulation of the delay cell → period jitter; a tone on the tuning node → FM spurs ([[Oscillators]], [[Phased-Locked Loops]]) |
| LNA / RF front end | NF, gain, desensitisation, IIP2 | input device, input pad | substrate thermal noise, pad loss, digital harmonics in band, second-order mixing of low-frequency noise with a jammer (Charbon §7.3, §7.4.3) |
| Amplifier (any) | gain, bandwidth, stability margin | every junction to substrate | Miller feedback through $C_{js}$; $\Delta C_j$ and $\Delta I_D = g_{mb}\Delta V$ from local potential shifts (Charbon §7.1–7.2) |
| Digital datapath | timing slack | every gate | $V_{TH}$ rise → longer delay ("delay effect", Charbon §2.4) |

### 2. From tolerated error to required isolation

A body-coupled receptor turns substrate voltage into an input-referred error $\eta\, v_{sub}$; the substrate voltage is the injector swing times the isolation:

$$
\boxed{v_{err,in} = \eta\,|I|\,V_{inj}\ \le\ \varepsilon \quad\Longrightarrow\quad I_{dB} \le 20\log_{10}\frac{\varepsilon}{\eta\,V_{inj}}}
$$

with $\eta = g_{mb}/g_m$ (0.1–0.3), $V_{inj}$ the swing on the injecting node (a rail-to-rail digital node), and $\varepsilon$ the allowed input-referred error (e.g. ½ LSB). A capacitive receptor replaces $\eta$ by its own divider ratio ([[#Capacitive Pickup and the Load]]). Several injectors add (in phase in the worst case), so split $\varepsilon$ among them.

> [!note]- Illustration: a 10-bit and a 12-bit ADC input pair
> Inputs chosen for illustration (not from a source): 1 V full scale, injector swing $V_{inj} = 1$ V, $\eta = 0.2$ (mid-range of Charbon's 0.1–0.3).
> - 10 bit: ½ LSB $= 1/2^{11} = 0.49$ mV. $I \le 20\log(0.49\text{ mV}/0.2\text{ V}) = -52$ dB.
> - 12 bit: ½ LSB $= 0.12$ mV. $I \le -64$ dB.
>
> Compare with the [[#4. What each mitigation buys|menu below]]: on a lightly doped substrate, 400 µm of spacing between 50 µm contacts gives only about −43 dB at 1 GHz but about −80 dB at 100 MHz (Charbon Fig. 8.8a). So the 10-bit converter is safe against 100 MHz content from spacing alone but needs a guard ring with a low-inductance ground, a buried shield or a differential input against the 1 GHz harmonics.

### 3. Where it lands on amplifier specs

| Amplifier spec | Why substrate noise cares | Lever |
|---|---|---|
| $\eta = g_{mb}/g_m$ of the input device | sets the body-effect path gain | PMOS input pair with its well tied to the common source (Razavi §19.3) or a deep-n-well NMOS: $v_{bs}=0$ |
| CMRR (and its roll-off frequency) | a well-placed differential pair sees substrate noise as common mode | differential signal path; matched layout, because 5 % mismatch costs about 40 dB of isolation at 1 GHz ([[#Differential Circuits]]) |
| PSRR | substrate ties and $V_{SS}$ bounce together | separate, low-inductance supply and substrate pins ([[#Separate Supplies, Grounds and Substrate Contacts]]) |
| Load impedance at the receiving node | a capacitive receptor divides against its load | low-impedance sensitive nodes; isolation scales with $R_{load}$ below the load pole (Charbon Fig. 8.11) |
| Device area | junction area sets $C_{js}$ (pickup and injection) | larger devices match better but carry more junction area; a parasitic-aware VCO sizing grew $W_p$ from 25 to 36 µm to cut sensitivity to layout parasitics (Charbon Table 5.4) |

> [!tip] Remark
> $\eta$ comes from [[MosFETs#Body Effect]]: $\eta = \gamma/(2\sqrt{2\phi_F+V_{SB}})$, so it falls as $V_{SB}$ grows. Sizing the input pair itself is [[gm-ID Design Methodology]]; substrate noise only adds the constraint "keep the body quiet or make the pair differential".

### 4. What each mitigation buys

Numbers read from Charbon's simulations (two 50 µm contacts, 50 Ω receiver load, 0.3–0.8 pF contact capacitance, 1 mm die; "≈" means read off a plot).

| Mitigation | Low-resistivity (epi on p+) | High-resistivity (lightly doped) | Source |
|---|---|---|---|
| Spacing 0 → 400 µm | flat beyond ≈ 2.5–5 × epi thickness; plateau ≈ −47 dB (5 nH backplate) to −62 dB (1 nH) at 1 GHz | keeps improving: ≈ −30 → −43 dB at 1 GHz, ≈ −67 → −80 dB at 100 MHz | Figs. 8.6, 8.8a |
| Ideal backplate ground ($L_{gnd} = 0$) | the big lever: ≈ −110 dB at 1 GHz, ≈ −147 dB at 100 MHz (400 µm) | 5–10 dB | Figs. 8.6, 8.22 vs 8.21 |
| Single guard ring | 7–10 dB | ≈ 40 dB with an ideal ring ground; ≈ 10–20 dB at 1 GHz with 3–5 nH | Figs. 8.13b vs 8.8b |
| Two guard rings (separate 5 nH grounds) | — | −62 → −130 dB at 100 MHz; −34 → −57 dB at 1 GHz | Table 8.1 |
| Differential receiver (ideal match) | ≈ −35 dB at 20 µm → ≈ −120 dB at 400 µm (1 GHz) | ≈ −38 → −58 dB (1 GHz) | Figs. 8.9, 8.10a |
| Differential, 5 % mismatch | floor ≈ −80 dB at 1 GHz | — | Fig. 8.10b |
| Guard rings around both devices (measured on-wafer, MOSFET to p+ contact) | about 40 dB improvement, up to nearly 10 GHz (both rows of [81]) | | App. D |
| Buried n+ well (deep n-well) vs SOI (measured) | buried n+ well isolates better than SOI | | App. D |

### 5. Worked example: PLL jitter budget → substrate voltage → distance

Charbon et al. designed a ring-VCO PLL top-down (Ch. 5) and then placed a RAMDAC's PLL with a substrate-aware placer (Ch. 6).

| Step | Number (source) |
|---|---|
| System spec | peak-to-peak jitter ≤ 100 ps, period 6–20 ns ± 10 % (Table 5.2) |
| VCO behavioural constraints | $K_0 = 40 \pm 4$ MHz/V, $F_0 = 100 \pm 10$ MHz, $J_{rms} \le 0.05\,\%$, $J_{pp} \le 1\,\%$ (Table 5.1) |
| Receptor sensitivity | local noise generators at each delay cell; worst case when generators switch in sync with the cell; with 300 mV of substrate noise, jitter reaches 450 ps peak (Fig. 5.3) |
| Allowed substrate voltage at the VCO | $V_0\vert_{VCO} \le 110$ mV (Table 5.3) |
| Isolation → spacing | extract $\alpha \approx R_3/R_2$ between each injecting cluster (8 clusters, dividers dominant) and the VCO contact; place the dividers far enough away (Fig. 5.7) |
| Verified | extracted 108 mV at the VCO (Table 5.3) |
| Second design (RAMDAC PLL, Ch. 6) | jitter spec $\Delta T/T \le 0.007$; placement with only interconnect parasitics: 0.1 (fails); substrate-aware placement: 0.005 (passes), area 7322 × 7716 λ² vs 6765 × 6528 λ² (Tables 6.1, 6.2) |

> [!tip] Remark
> The divider that runs fastest (÷n at 35–140 MHz) is the worst injector and ended up farthest from the VCO, charge pump and loop filter; the slow ÷k could stay close. Rank injectors by their spectral energy near the receptor's sensitive band, not by size alone.

## Level 0: The Coupling Two-Port

### Injector, Substrate, Receiver

```tikz title="The coupling two-port: injector and receiver couple through C_sub into the three-element substrate model (R10, R20 to the backplate, R12 between them), backplate grounded through L_gnd. Isolation is V_rcv/V_inj. After Charbon Figs. 3.3 and 8.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,0) node[ground]{} to[sV,l=$V_{inj}$] (0,3) -- (1.5,3) to[C,l=$C_{sub1}$] (1.5,1.6) coordinate (n1);
  \draw (n1) to[R,l=$R_{12}$] (5,1.6) coordinate (n2);
  \draw (n1) to[R,l_=$R_{10}$] (1.5,-0.4) coordinate (b1);
  \draw (n2) to[R,l=$R_{20}$] (5,-0.4) coordinate (b2);
  \draw[line width=1.6pt] (b1) -- (b2);
  \draw (3.25,-0.4) to[L,l=$L_{gnd}$] (3.25,-2.0) node[ground]{};
  \draw (n2) to[C,l_=$C_{sub2}$] (5,3) -- (6.6,3) node[circ]{} node[above]{$V_{rcv}$} to[R,l=$R_{load}$] (6.6,0.2) node[ground]{};
  \node[circ] at (n1){}; \node[circ] at (n2){};
  \node[font=\scriptsize,anchor=south west] at (n1) {1};
  \node[font=\scriptsize,anchor=south east] at (n2) {2};
  \node[font=\scriptsize] at (3.25,-0.15) {backplate};
  \draw[dashed,gray] (0.9,-0.75) rectangle (5.7,2.0);
  \node[font=\scriptsize,gray,anchor=north west] at (0.9,-0.75) {substrate model};
  % top view
  \begin{scope}[xshift=8.6cm,yshift=-0.6cm]
    \draw[fill=orange!12,draw=black!60] (0,0) rectangle (3.2,3.2);
    \draw[fill=orange!65,draw=black!60] (0.9,1.35) rectangle (1.4,1.85);
    \draw[fill=orange!65,draw=black!60] (2.0,1.35) rectangle (2.5,1.85);
    \node[font=\scriptsize] at (1.15,2.1) {1};
    \node[font=\scriptsize] at (2.25,2.1) {2};
    \draw[<->] (1.4,1.15) -- (2.0,1.15) node[midway,below,font=\scriptsize] {$\delta$};
    \draw[<->] (2.65,1.35) -- (2.65,1.85) node[midway,right,font=\scriptsize] {50 µm};
    \draw[<->] (0,-0.25) -- (3.2,-0.25) node[midway,below,font=\scriptsize] {1000 µm die};
    \node[font=\scriptsize,align=center] at (1.6,3.55) {top view: injector 1 fixed,\\ receiver 2 slides};
  \end{scope}
  \node[font=\scriptsize,anchor=west] at (0,-2.9) {$I = 20\log_{10}(V_{rcv}/V_{inj})$, $R_{load}=50\ \Omega$, $C_{sub}=0.3$ or $0.8$ pF};
\end{circuitikz}
\end{document}
```

$$
\boxed{I = 20\log_{10}\frac{V_{rcv}}{V_{inj}}\ \text{(dB, negative)}}
$$

Each contact couples to the substrate through its junction capacitance $C_{sub}$; inside, the substrate is a **three-element model**: $R_{10}$ and $R_{20}$ from each contact to the backplate, $R_{12}$ directly between them, and $L_{gnd}$ for the backplate connection (die attach, bond wire, pin). Isolation depends on the substrate elements and also on $C_{sub}$, the backplate impedance, the frequency and the receiver's load.

> [!note]- Detail: why the backplate inductance can dominate (Charbon Eq. 8.1)
> With small $C_{sub}$ reactances and a small load, the impedance between contacts 1 and 2 looking into the substrate is
> $$Z'_{12}(j\omega) = R_{10} + R_{20} - j\,\frac{R_{10}R_{20}}{\omega L_{gnd}}$$
> (the parallel combination of $R_{12}$ with this path). On a low-resistivity substrate $R_{10}$, $R_{20}$ fall almost inversely with contact area, so at high frequency $Z'_{12}$ falls with area too: **isolation between large contacts gets worse almost linearly with area**, and the reactance of $C_{sub}$ falls with area as well.

### Two Kinds of Substrate

```tikz title="The two substrate families and where injected current goes. Lightly doped: it spreads along the surface, so spacing and rings work. Epi on p+: it drops into the p+ bulk, which is one node, so beyond a few epi thicknesses distance stops helping. Profiles from Charbon Figs. 2.2 and 8.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  % ---------- high resistivity ----------
  \node[font=\bfseries] at (3.5,4.6) {High-resistivity (lightly doped)};
  \draw[psub] (0,0) rectangle (7,3.6);
  \draw[fill=orange!30,draw=black!40] (0,3.6) rectangle (7,3.35);
  \draw[pdiff] (1.0,3.6) rectangle (1.6,3.75); \draw[pdiff] (5.4,3.6) rectangle (6.0,3.75);
  \node[font=\scriptsize] at (1.3,4.0) {injector}; \node[font=\scriptsize] at (5.7,4.0) {receiver};
  \draw[very thick] (0,0) -- (7,0);
  \foreach \h in {0.2,0.6,1.1,1.7} {
    \draw[->,red!70!black,thick] (1.3,3.4) .. controls (2.2,{3.4-\h}) and (4.8,{3.4-\h}) .. (5.7,3.4);
  }
  \draw[->,red!70!black,thick] (1.3,3.4) .. controls (1.2,2) .. (1.1,0.05);
  \draw[->,red!70!black,thick] (5.7,3.4) .. controls (5.8,2) .. (5.9,0.05);
  \node[font=\scriptsize,anchor=west] at (7.1,3.47) {$\sim$1 µm, 0.1 $\Omega\cdot$cm};
  \node[font=\scriptsize,anchor=west] at (7.1,1.8) {$\sim$400 µm, 20--50 $\Omega\cdot$cm};
  \node[font=\scriptsize,align=center,fill=white,inner sep=1pt] at (3.5,0.8) {current spreads near the surface:\\ distance and rings help};
  % ---------- low resistivity ----------
  \begin{scope}[xshift=10.2cm]
    \node[font=\bfseries] at (3.5,4.6) {Low-resistivity (epi on p+)};
    \draw[fill=orange!35,draw=black!60] (0,0) rectangle (7,2.4);
    \draw[psub] (0,2.4) rectangle (7,3.35);
    \draw[fill=orange!20,draw=black!40] (0,3.35) rectangle (7,3.6);
    \draw[pdiff] (1.0,3.6) rectangle (1.6,3.75); \draw[pdiff] (5.4,3.6) rectangle (6.0,3.75);
    \node[font=\scriptsize] at (1.3,4.0) {injector}; \node[font=\scriptsize] at (5.7,4.0) {receiver};
    \draw[very thick] (0,0) -- (7,0);
    \draw[->,red!70!black,thick] (1.3,3.45) -- (1.3,2.4);
    \draw[->,red!70!black,thick] (5.7,2.4) -- (5.7,3.45);
    \draw[->,red!70!black,thick] (1.3,2.2) -- (5.7,2.2);
    \draw[->,red!70!black,thick] (3.5,2.1) -- (3.5,0.05) node[pos=0.55,right,font=\scriptsize,black] {to backplate ($L_{gnd}$)};
    \draw[->,red!70!black,thin,dashed] (1.3,3.45) .. controls (2.5,3.0) and (4.5,3.0) .. (5.7,3.45);
    \node[font=\scriptsize,anchor=west] at (7.1,3.47) {$\sim$1 µm, 1 $\Omega\cdot$cm};
    \node[font=\scriptsize,anchor=west] at (7.1,2.9) {$\sim$10 µm epi, 10--15 $\Omega\cdot$cm};
    \node[font=\scriptsize,anchor=west] at (7.1,1.2) {$\sim$300 µm p+, $\sim$1 m$\Omega\cdot$cm};
    \node[font=\scriptsize,fill=white,inner sep=1pt] at (1.8,1.0) {bulk = one node};
    \node[font=\scriptsize,anchor=north] at (3.5,-0.1) {critical distance $\approx$ 2.5--5 $\times$ epi thickness};
  \end{scope}
  \node[font=\scriptsize,anchor=north] at (3.5,-0.1) {backplate};
  \node[font=\scriptsize,anchor=west] at (0,-0.7) {Layer thicknesses not to scale. Darker peach = more heavily doped.};
\end{circuitikz}
\end{document}
```

| | High-resistivity (lightly doped) | Low-resistivity (epi on p+) |
|---|---|---|
| Profile (Charbon Fig. 2.2) | ~1 µm p at 0.1 Ω·cm (surface) on ~400 µm p at 20–50 Ω·cm | ~1 µm p at 1 Ω·cm, ~10 µm p-epi at 10–15 Ω·cm, ~300 µm p+ bulk at ~1 mΩ·cm |
| Where current flows | along the surface, spreading wide | straight down into the bulk, which is one equipotential node |
| Contact resistance vs size | weak (logarithmic): ≈ 650 Ω at 10 µm → ≈ 100 Ω at 1 mm (Fig. 8.2) | nearly inverse with area: kΩ at 10 µm → a few Ω at 1 mm (Fig. 8.3) |
| Isolation vs distance | keeps improving | flat beyond a critical distance of 2.5–5 × epi thickness (for $L_{gnd}$ = 1–5 nH at 1 GHz); Su et al. found 4 × |
| Backplate inductance | weak effect | dominant |
| Guard rings | very effective | 7–10 dB |
| Why chosen | isolation by rings and distance | latch-up suppression |

> [!important] Rule
> **Know your substrate before you draw a single guard ring.** On epi-on-p+ the fixes are a low-impedance backplate/substrate ground and circuit techniques; on lightly doped silicon they are distance and well-grounded rings.

> [!tip] Remark
> Why heavily doped substrates exist at all: the p+ bulk shorts the lateral resistance that lets a parasitic thyristor turn on ([[Guard Rings, ESD and Interconnect#Latch-up]]), and the epi layer is how [[CMOS Processing#Starting Wafer]] gets a lightly doped surface on top of it. Razavi (§19.3) quotes about 0.1 Ω·cm for such substrates and notes they spread a nearly uniform potential across the chip.

## Level 1: Injection

### Capacitive Coupling from Switching Nodes

```tikz title="Capacitive injection paths and impact ionization in cross-section: a swinging NMOS drain (C_jd) and the holes from its pinch-off region, an n-well that is not AC-grounded, and a diffused vs a poly resistor. After Charbon Fig. 2.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70}]
  \draw[psub] (0,0) rectangle (15,3);
  % NMOS
  \draw[ndiff] (0.6,3) rectangle (1.6,2.6); \draw[ndiff] (2.6,3) rectangle (3.6,2.6);
  \draw[poly] (1.65,3.05) rectangle (2.55,3.35);
  \node[font=\scriptsize] at (1.1,3.25) {S}; \node[font=\scriptsize] at (3.1,3.25) {D};
  \draw[->,red!70!black] (3.1,4.1) -- (3.1,3.3) node[pos=0,above,font=\scriptsize] {$V_D$ swings};
  \draw[red!70!black] (3.1,2.6) to[C,l=\scriptsize$C_{jd}$] (3.1,1.3);
  \draw[->,red!70!black,thick] (3.1,1.3) -- (3.1,0.6);
  \foreach \x in {2.3,2.45} \node[font=\scriptsize,red!70!black] at (\x,2.5) {$+$};
  \draw[->,red!70!black,thick] (2.4,2.35) .. controls (2.2,1.6) .. (1.7,0.7);
  \node[font=\scriptsize,red!70!black,align=center] at (1.2,1.5) {holes from\\ impact\\ ionization};
  \node[font=\scriptsize] at (2.1,0.3) {NMOS};
  % n-well
  \draw[nwell] (5.0,3) -- (5.0,1.7) -- (8.0,1.7) -- (8.0,3);
  \draw[pdiff] (5.5,3) rectangle (6.2,2.7); \draw[pdiff] (6.8,3) rectangle (7.5,2.7);
  \draw[poly] (6.25,3.05) rectangle (6.75,3.35);
  \draw[red!70!black] (6.5,1.7) to[C,l=\scriptsize$C_{well}$] (6.5,0.6);
  \node[font=\scriptsize,align=center] at (6.5,4.0) {PMOS in n-well:\\ AC-ground the well};
  \node[font=\scriptsize] at (6.5,0.3) {well = large injector if it moves};
  % diffused resistor
  \draw[ndiff] (9.0,3) rectangle (11.4,2.7);
  \foreach \x in {9.5,10.9} \draw[red!70!black] (\x,2.7) to[C] (\x,1.6);
  \node[font=\scriptsize,align=center] at (10.2,3.6) {n+ diffused\\ resistor};
  \node[font=\scriptsize] at (10.2,1.2) {large $C$/length};
  % poly resistor on STI
  \draw[sti] (12.2,3) rectangle (14.6,2.5);
  \draw[poly] (12.4,3.05) rectangle (14.4,3.25);
  \draw[red!70!black] (13.4,2.5) to[C] (13.4,1.6);
  \node[font=\scriptsize,align=center] at (13.4,3.85) {poly resistor\\ over STI};
  \node[font=\scriptsize] at (13.4,1.2) {small $C$/length};
  % legend
  \begin{scope}[yshift=-0.75cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-sub};
    \draw[nwell] (1.7,0) rectangle (2.1,0.25); \node[anchor=west] at (2.15,0.12) {n-well};
    \draw[ndiff] (3.5,0) rectangle (3.9,0.25); \node[anchor=west] at (3.95,0.12) {n+};
    \draw[pdiff] (4.7,0) rectangle (5.1,0.25); \node[anchor=west] at (5.15,0.12) {p+};
    \draw[poly] (5.9,0) rectangle (6.3,0.25); \node[anchor=west] at (6.35,0.12) {poly};
    \draw[sti] (7.3,0) rectangle (7.7,0.25); \node[anchor=west] at (7.75,0.12) {STI};
  \end{scope}
\end{circuitikz}
\end{document}
```

Every reverse-biased junction to the substrate is a capacitor; a node that swings drives a displacement current $C_{js}\,dV/dt$ into the substrate.

$$
\boxed{C_{js} = \sqrt{\frac{q\varepsilon}{2(\psi_0 + V_{cs})}\cdot\frac{N_C N_S}{N_C + N_S}}\quad\text{(per unit area, abrupt junction)}}
$$

- **MOS:** source/drain-to-substrate junctions. A PMOS sits in an n-well that must be **AC-grounded well**: if the well potential moves, the whole well–substrate capacitance becomes one large injector (Charbon §2.2).
- **Passives:** diffused resistors couple more than poly resistors; a resistor with one end at AC ground and $V_{in}$ on the other injects a distributed-RC current (fold). Interconnect and bond pads couple through their oxide capacitance (0.5–1 pF for a pad, Charbon §7.1).
- **Bipolar:** vertical npn through $C_{js}$ (collector–substrate); lateral pnp through its base; a **vertical (substrate) pnp** uses the substrate as its collector and injects its full collector current unless drained right next to it.

> [!tip] Remark
> Not drawn here: a junction that gets **forward biased** (a node pulled below ground, a saturating npn whose parasitic pnp turns on, an inductive load) injects *minority* carriers, a far larger and slower current that can trigger latch-up. That mechanism and its minority-carrier guard rings are [[Failure Mechanisms]]'s (Hastings §5.4); this note deals with the small-signal majority-carrier coupling.

> [!note]- Detail: injection from a resistor (Charbon Eq. 2.5)
> For a resistor of length $\ell$, unit resistance $R$ and unit capacitance to substrate $C$, one end at AC ground:
> $$I = \sqrt{\frac{j\omega C}{R}}\ \tanh\!\left(\frac{\sqrt{j\omega RC}\,\ell}{2}\right) V_{in}$$
> At low frequency ($\sqrt{\omega RC}\,\ell \ll 1$) $\tanh x \approx x$ and this reduces to $I \approx j\omega (C\ell/2) V_{in}$: half the total capacitance sees the full swing.

### Impact Ionization

In saturation the field near the drain pinch-off generates electron–hole pairs. In an NMOS the electrons join the channel current; the **holes go into the substrate** and are carried across the chip.

$$
\boxed{I_{sub} \simeq C_1\,(V_{DS} - V_{Dsat})\,I_D\,e^{-C_2/(V_{DS}-V_{Dsat})},\qquad g_{db} = \frac{\partial I_{sub}}{\partial V_D} \approx \frac{C_2\,I_{sub}}{(V_{DS}-V_{Dsat})^2}}
$$

- Dominant cause of substrate noise in NMOS up to at least 100 MHz (measured, Charbon [20]); worse with shorter channels.
- One polarity only, so it has a **large DC/low-frequency component**.
- $g_{db}$ sits in parallel with $r_o$ and lowers the output resistance.
- PMOS: much smaller (lower hole ionization coefficient) and the well shields it.

> [!tip] Remark
> This is the hot-carrier current of [[MosFETs#Hot-Carrier Effects]] seen from the substrate side; $C_1, C_2$ are the fitting constants most compact models use for the substrate current.

> [!note]- Derivation: from the ionization integral to Eq. 2.3
> The generated current is $I_{impact} = \int_{E_s}^{E_m} I_d\,A\,e^{-B/E(x)}\,dx$ over the field from source ($E_s$) to its maximum ($E_m$), with material constants $A$, $B$. Because $E_m \gg E_s$ the integral is dominated near the drain, giving $I_{impact} \approx (A/B)\,l\,E_m I_d e^{-B/E_m}$; with $E_m \propto (V_{DS}-V_{Dsat})/l$ this becomes the boxed form (Charbon Eqs. 2.2–2.3).

### Supply and Ground Bounce into Substrate Contacts

```tikz title="Every clock edge on M2's drain pushes current through C_DB2 into a substrate held to ground only by bond wire L_b; the analog stage M1 sees the substrate through its body and its drain current twitches on every edge. After Razavi Fig. 19.53."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % inverter
  \draw (0,3) node[pmos,anchor=S](M3){} ;
  \draw (M3.S) -- ++(0,0.3) node[vdd]{$V_{DD}$};
  \draw (M3.D) -- (0,1.2) coordinate (X);
  \draw (X) -- (0,1.0) node[nmos,anchor=D](M2){};
  \draw (M2.S) -- ++(0,-0.2) node[ground]{};
  \draw (M3.G) -- ++(-0.5,0) coordinate (g3);
  \draw (M2.G) -- ++(-0.5,0) coordinate (g2);
  \draw (g3) -- (g2); \draw (g3|-X) -- ++(-0.6,0) node[left]{CK};
  \node[circ] at (X){};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]M3.east) {$M_3$};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]M2.east) {$M_2$};
  \draw (X) -- (1.4,1.2) to[C,l=$C_{DB2}$] (1.4,-0.6) coordinate (s1);
  % substrate
  \draw[line width=1.6pt,orange!60!black] (1.4,-0.6) -- (7.4,-0.6) node[right,black]{$V_{sub}$};
  \draw (4.2,-0.6) to[L,l=$L_b$] (4.2,-2.2) node[ground]{};
  \node[font=\scriptsize,orange!60!black] at (2.8,-0.35) {substrate (heavily doped: one node)};
  % CS amp
  \draw (6.4,1.0) node[nmos](M1){};
  \draw (M1.D) to[R,l=$R_D$] ++(0,1.6) node[vdd]{$V_{DD}$};
  \draw (M1.D) -- ++(0.7,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (M1.G) -- ++(-0.4,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (M1.S) -- ++(0,-0.2) node[ground]{};
  \draw[dashed] (M1.bulk) -- ++(0.35,0) |- (6.75,-0.6);
  \node[font=\scriptsize,anchor=west] at (6.8,0.35) {body};
  \node[font=\scriptsize] at (5.95,0.35) {$M_1$};
  % waveforms
  \begin{scope}[xshift=9.4cm,yshift=1.6cm]
    \draw[->] (0,0) -- (4.2,0) node[right,font=\scriptsize]{$t$};
    \draw[thick] (0,0.1) -- (0.9,0.1) -- (1.0,0.8) -- (2.4,0.8) -- (2.5,0.1) -- (3.9,0.1);
    \node[font=\scriptsize,anchor=east] at (0,0.45) {CK};
    \begin{scope}[yshift=-1.4cm]
      \draw[->] (0,0) -- (4.2,0);
      \draw[thick,red!70!black] (0,0) -- (0.95,0) -- (1.0,0.6) -- (1.15,-0.35) -- (1.3,0.2) -- (1.45,-0.08) -- (1.6,0) -- (2.45,0) -- (2.5,-0.6) -- (2.65,0.35) -- (2.8,-0.2) -- (2.95,0.08) -- (3.1,0) -- (3.9,0);
      \node[font=\scriptsize,anchor=east] at (0,0) {$V_{sub}$};
    \end{scope}
    \begin{scope}[yshift=-2.8cm]
      \draw[->] (0,0) -- (4.2,0);
      \draw[thick,blue!60!black] (0,0.2) -- (0.95,0.2) -- (1.0,-0.2) -- (1.15,0.45) -- (1.3,0.1) -- (1.45,0.25) -- (1.6,0.2) -- (2.45,0.2) -- (2.5,0.55) -- (2.65,-0.05) -- (2.8,0.3) -- (2.95,0.15) -- (3.1,0.2) -- (3.9,0.2);
      \node[font=\scriptsize,anchor=east] at (0,0.2) {$I_{D1}$};
    \end{scope}
    \node[font=\scriptsize,align=center] at (2.0,-3.6) {every CK edge disturbs\\ the analog output};
  \end{scope}
\end{circuitikz}
\end{document}
```

Substrate ties are low-impedance connections *into* the substrate. Whatever bounce their supply line carries ($L\,di/dt$ from the switching current of the gates they serve) is spread "throughout their extent on the chip through a very low impedance path" (Charbon §2.2). On a heavily doped substrate the bounce sets the potential of the whole bulk (Razavi Fig. 19.53): "thousands of digital gates ... introducing hundreds of millivolts of disturbance", proportional to the size of the switching devices, so large output buffers are the worst.

> [!tip] Remark
> The bond-wire inductance and $L\,di/dt$ itself are [[Packaging]]'s; here it matters only because the ties hand that voltage to every body on the die.

### The Spectrum of Switching Noise

```tikz title="Spectrum of an ideal 3 V, 10 MHz clock: harmonics fall only as 1/n, so the one near 1 GHz is just 40 dB down (19.1 mV). Real switching noise adds a hump near 1/(gate delay), glitches, and a low-frequency part from impact ionization. Numbers from Charbon Sec. 7.4.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % x = 3*log10(n), y = (dB+50)/10
  \draw[->] (0,0) -- (7.2,0) node[right,font=\scriptsize]{$f$ (log)};
  \draw[->] (0,0) -- (0,5.6) node[above,font=\scriptsize]{amplitude (dB rel. fundamental)};
  \foreach \d in {0,-20,-40} { \draw ({-0.08},{(\d+50)/10}) -- (0.08,{(\d+50)/10}); \node[font=\scriptsize,anchor=east] at (-0.1,{(\d+50)/10}) {\d}; }
  \foreach \n in {1,3,5,7,9,11,13,15,21,27,35,45,55,71,85,99} {
    \draw[thick,blue!60!black] ({3*log10(\n)},0) -- ({3*log10(\n)},{(-20*log10(\n)+50)/10});
    \fill[blue!60!black] ({3*log10(\n)},{(-20*log10(\n)+50)/10}) circle (1.3pt);
  }
  \draw[dashed,red!70!black,domain=0:6.1,samples=20] plot (\x,{(-20*\x/3+50)/10});
  \node[font=\scriptsize,red!70!black,anchor=west] at (2.4,3.6) {envelope $\propto 1/n$ ($-20$ dB/decade)};
  \node[font=\scriptsize,anchor=south west] at (0.1,5.05) {10 MHz: 1.91 V};
  \node[font=\scriptsize,anchor=west,align=left] at (6.4,1.55) {$\approx$1 GHz ($n\approx100$):\\ 19.1 mV, $-40$ dB};
  \draw[->] (6.4,1.35) -- (6.08,1.05);
  \node[font=\scriptsize,anchor=north] at (0,-0.05) {$f_{clk}$};
  \node[font=\scriptsize,anchor=north] at (6.0,-0.05) {$100f_{clk}$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,4.4) {ideal 3 V, 10 MHz clock\\ (odd harmonics only)};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,2.8) {real switching noise adds:\\ $\bullet$ a hump near 1/(gate delay)\\ $\bullet$ glitch content above it\\ $\bullet$ a DC/low-$f$ part from\\ \quad impact ionization (one polarity)};
\end{circuitikz}
\end{document}
```

- Energy is spread widely, concentrated near **1/(average gate delay)**, plus glitch content at higher frequency and a large near-DC part from impact ionization (Charbon §2.1).
- An ideal 3 V, 10 MHz clock has a 1.91 V fundamental and, at ~1 GHz (100th harmonic), a 19.1 mV component, only 40 dB down. If an RF receiver listens there, it is in band (Charbon §7.4.3).
- Junction and wiring capacitance in the digital block does **not** filter these harmonics: it dumps them into the substrate. Decoupling capacitors isolated from the substrate return them to circuit ground instead.

> [!note]- Detail: noise signatures and digital "delay effect"
> Each gate injects a characteristic current pulse (its *substrate injection pattern*); convolving each node's switching trace with its pattern and summing gives the block's **substrate noise signature** (and likewise a supply noise signature). SUBWAVE characterises a cell library once and then computes signatures from event-driven simulation (Charbon Ch. 4). The signature depends on the input vectors: a fast random stimulus puts energy at much higher frequencies than a slow one (Figs. 4.4–4.5).
>
> Digital circuits are receptors too: gate delay $t_{50\%} = R_{EFF}C_G$ with $R_{tr} \propto 1/(V_{DD}-V_T)$, and $V_T$ rises with substrate-to-source voltage, so substrate noise lengthens critical paths and causes local skew (Charbon §2.4). Capacitive substrate coupling under a line behaves like interconnect crosstalk with the substrate as the aggressor.

## Level 2: Propagation

### Resistive up to a Few GHz

$$
\boxed{\nabla\cdot(\sigma\nabla\Phi) + \frac{\partial}{\partial t}\nabla\cdot(\varepsilon\nabla\Phi) = 0\ \xrightarrow{\ \tau=\varepsilon/\sigma\ \ll\ t\ }\ \nabla\cdot(\sigma\nabla\Phi)=0}
$$

If the dielectric relaxation time $\varepsilon/\sigma$ is far below every time scale of interest, the substrate is purely resistive: true up to about 2–5 GHz except in very low-resistivity material (Charbon §3.2), and confirmed by two-port measurements to several GHz (App. D). Above that the substrate becomes an RC network: a lossy dielectric.

> [!tip] Remark
> So below a few GHz the whole substrate collapses to a **resistor network between contacts** plus the junction capacitors that connect devices to it. Frequency enters through the $C_{sub}$ and $L_{gnd}$ reactances, not through the silicon.

### Distance, Backplate and Contact Size

```tikz title="Isolation vs spacing for two 50 um contacts (approximate, read from Charbon Figs. 8.6(b) and 8.8(a)). Epi on p+: flat beyond the critical distance unless the backplate is ideally grounded. Lightly doped: keeps improving with distance."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,x=0.018cm,y=0.05cm]
  % x in um (0..400), y = dB + 120 (0..100)
  \draw[->] (0,0) -- (430,0) node[right,font=\scriptsize]{spacing (µm)};
  \draw[->] (0,0) -- (0,108) node[above left,font=\scriptsize]{isolation (dB)};
  \foreach \x in {0,100,200,300,400} { \draw (\x,0) -- (\x,-2) node[below,font=\scriptsize]{\x}; }
  \foreach \d in {-20,-40,-60,-80,-100,-120} { \draw (0,{\d+120}) -- (-5,{\d+120}) node[left,font=\scriptsize]{\d}; }
  \fill[gray!15] (25,0) rectangle (50,100);
  \node[font=\scriptsize,anchor=west,fill=white,inner sep=1pt] at (55,92) {critical distance (10 µm epi)};
  % low resistivity, 1 GHz
  \draw[thick,blue!70!black] (0,98) -- (400,98);
  \node[font=\scriptsize,blue!70!black,anchor=south west] at (250,98) {low-$\rho$, floating backplate};
  \draw[thick,blue!70!black] (0,80) -- (20,74) -- (40,73) -- (400,73);
  \node[font=\scriptsize,blue!70!black,anchor=north west] at (290,72.5) {low-$\rho$, $L_{gnd}$ = 5 nH};
  \draw[thick,blue!70!black] (0,80) -- (25,65) -- (50,59) -- (400,58);
  \node[font=\scriptsize,blue!70!black,anchor=north west] at (290,57.5) {low-$\rho$, 1 nH};
  \draw[thick,blue!70!black] (0,80) -- (50,50) -- (100,27) -- (200,16) -- (400,10);
  \node[font=\scriptsize,blue!70!black,anchor=south west] at (300,13) {low-$\rho$, 0 nH};
  % high resistivity
  \draw[thick,red!70!black,dashed] (0,90) -- (100,84) -- (200,81) -- (300,79) -- (400,77);
  \node[font=\scriptsize,red!70!black,anchor=south] at (330,80) {high-$\rho$, 1 GHz};
  \draw[thick,red!70!black,dashed] (0,53) -- (100,48) -- (200,44) -- (300,42) -- (400,40);
  \node[font=\scriptsize,red!70!black,anchor=north east] at (240,43) {high-$\rho$, 100 MHz};
  \node[font=\scriptsize,align=left,anchor=north west] at (440,90) {solid: low-$\rho$ at 1 GHz\\ (flat past the critical distance\\ unless $L_{gnd}\to0$)\\[3pt] dashed: high-$\rho$, grounded\\ backplate (keeps improving)\\[3pt] $C_{sub}=0.3$ pF, 50 µm contacts,\\ 50 $\Omega$ load};
\end{circuitikz}
\end{document}
```

- **Low-resistivity:** beyond the critical distance the coupling goes through the bulk, which is one node; isolation is set by $L_{gnd}$ and $C_{sub}$, not by distance. Bigger contacts couple *more* (inverse-area $R_{10}$).
- **High-resistivity:** a large share of the current flows at the surface, so isolation keeps improving with distance even with a finite backplate impedance, and depends only weakly on contact area. The resistance to the backplate is *not* monotonic in spacing: high when contacts are close (surface flow), falling as current goes down, rising again near the die edge (Fig. 8.5).
- **Floating backplate** (no back contact): on a low-resistivity substrate isolation is almost independent of distance, because $R_{12}$ is far below the $C_{sub}$ reactance; a poor environment for isolation.

> [!tip] Remark
> Hastings reaches the same picture from contact spreading-resistance formulas (§5.4.3): on epi-on-p+ disperse many small contacts, on thick lightly doped silicon keep a contact within half the die thickness of every device. Those formulas, numbers and tap rules are owned by [[Guard Rings, ESD and Interconnect#Debiasing and Tap Placement]].

## Level 3: Reception

### Body Effect: the Bulk Is a Second Gate

```tikz title="Body-effect reception: with gate and source at AC ground the bulk is a second input, only g_mb/g_m = 0.1-0.3 weaker than the gate. After Charbon Fig. 2.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,0) node[ground]{} to[sV,l=$v_{sub}$] (0,2.4) to[R,l=$Z_{sub}$] (2.4,2.4) coordinate (B);
  \node[circ] at (B){}; \node[above] at (B) {B};
  \draw (B) to[C,l=$C_{sb}$] (2.4,0) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (2.9,2.55) {$v_{bs}=v_B$\\ (source at ground)};
  \draw (5.6,0) node[ground]{} to[cI,l_=$g_{mb}v_{bs}$,invert] (5.6,3.6);
  \draw (5.6,3.6) -- (7.4,3.6) to[R,l=$r_o\Vert R_D$] (7.4,0) node[ground]{};
  \draw (7.4,3.6) -- (8.2,3.6) node[ocirc]{} node[right]{$v_{out}$};
  \node[circ] at (5.6,3.6){}; \node[above] at (5.6,3.6) {D};
  \node[font=\scriptsize,align=left,anchor=west] at (9.2,2.6) {gate and source at AC ground:\\ the substrate is a second input};
  \node[font=\scriptsize,align=left,anchor=west] at (9.2,1.5) {$\dfrac{v_{out}}{v_{sub}} = \dfrac{g_{mb}}{g_m}\times$ (gate gain)};
  \node[font=\scriptsize,align=left,anchor=west] at (9.2,0.4) {$g_{mb}/g_m = 0.1$--$0.3$: only 14--20 dB\\ below the gate path, down to DC};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_t = V_{t0} + \frac{\sqrt{2q\varepsilon N_A}}{C_{ox}}\left(\sqrt{2\phi_f+V_{sb}}-\sqrt{2\phi_f}\right),\qquad \frac{g_{mb}}{g_m} = \frac{\sqrt{2q\varepsilon N_A}}{2C_{ox}\sqrt{2\phi_f+V_{sb}}} = 0.1\text{–}0.3}
$$

$$
\boxed{\Delta I_D = g_{mb}\,\Delta V_{sub},\qquad v_{in,eq} = \frac{g_{mb}}{g_m}\,v_{sub}}
$$

The bulk-to-drain gain is only 14–20 dB below the gate-to-drain gain, at **all** frequencies down to DC. Since $I_D$ depends on $V_{in}-V_{TH}$, a substrate wiggle is indistinguishable from an input signal (Razavi §19.3).

> [!tip] Remark
> Same $\eta$ as [[MosFETs#Body Effect]]. The cure is to make $v_{bs}=0$: a PMOS in its own n-well tied to its source, or an NMOS in a deep n-well ([[CMOS Processing#Twin Well and Deep N-Well]]), or tie the substrate to the circuit's own ground so both bounce together ([[#Separate Supplies, Grounds and Substrate Contacts]]).

### Capacitive Pickup and the Load

The second receptor: junctions, capacitor bottom plates, resistors, interconnect and pads. It matters above about 1 MHz. A lateral pnp's base *is* its junction to the substrate: in a gain stage, shield it or drive it from a low impedance, or the circuit amplifies substrate noise (Charbon §2.3).

- The noise at the internal substrate node is set by the substrate; what the circuit sees is that voltage divided by $C_{sub}$ against the load $R_{load}$.
- Below the load pole $1/(2\pi R_{load}C_{sub})$ the received voltage, and so the isolation, **scales linearly with $R_{load}$** (Charbon Fig. 8.11: with 0.8 pF the pole is ≈ 200 MHz at 1 kΩ and 1 GHz at 200 Ω).

$$
\boxed{V_{rcv} \approx j\omega R_{load}C_{sub}\,V_{sub}\quad(\omega R_{load}C_{sub}\ll 1)}
$$

> [!tip] Remark
> Low-impedance sensitive nodes are also quiet nodes. This is the reason for the [[Capacitor#Top Plate, Bottom Plate and the Metal Cage]] rule: put the bottom plate (the one with substrate capacitance) on the node driven by the low impedance.

### What Substrate Coupling Does to a Circuit

```tikz title="Substrate feedback between two stages: the junction capacitances of both stages meet in the substrate, and stage 2's gain Miller-multiplies them onto node X. After Charbon Fig. 7.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,3) node[ocirc]{} node[left]{$v_{in}$} to[amp,l=stage 1] (2.6,3) -- (3.6,3) coordinate (X);
  \draw (X) to[amp,l=stage 2: $-A$] (6.2,3) -- (7.6,3) coordinate (Y) node[ocirc]{} node[right]{$v_{out}$};
  \node[circ] at (X){}; \node[above left] at (X){X};
  \draw (X) to[C,l_=$C_{s1}$] (3.6,1.3) coordinate (S1);
  \draw (7.0,3) to[C,l=$C_{s2}$] (7.0,1.3) coordinate (S2);
  \node[circ] at (7.0,3){};
  \draw (S1) to[R,l=$R_{s12}$] (S2);
  \draw (S1) to[R,l_=$R_{s1}$] (3.6,-0.3) node[ground]{};
  \draw (S2) to[R,l=$R_{s2}$] (7.0,-0.3) node[ground]{};
  \node[circ] at (S1){}; \node[circ] at (S2){};
  \node[font=\scriptsize,orange!60!black] at (5.3,0.85) {through the substrate};
    \node[font=\scriptsize,align=left,anchor=west] at (8.6,2.6) {if $R_{s1},R_{s2}\gg 1/\omega C$ and $R_{s12}$ small:\\ $C_{s1}$ in series with $C_{s2}$ appears at X\\ multiplied by $(1+A)$ (Miller)};
  \node[font=\scriptsize,align=left,anchor=west] at (8.6,1.0) {0.2 pF each, $A=10$: $\approx$1 pF at X\\ (Charbon \S7.1); a loop gain $>1$\\ through this path oscillates};
\end{circuitikz}
\end{document}
```

| Effect | Mechanism | Number / consequence (Charbon Ch. 7) |
|---|---|---|
| Feedback | junction capacitances of two stages connected through the substrate: Miller-multiplied | $C_{s1}=C_{s2}=0.2$ pF and a stage gain of 10 add 1 pF at the first collector; a series-feedback amplifier lost over 5 % bandwidth (1.9 → 1.8 GHz); can satisfy Barkhausen and oscillate |
| Lower maximum stable gain | substrate raises $\lvert S_{12}\rvert$ | $G = g_m / \omega[C_\mu + (C_{s1}\Vert C_{sbp})/\{1+\omega R_{s1bp}(C_{s1}\Vert C_{sbp})\}]$; cascodes most sensitive |
| Local potential shifts | $\Delta V_{bias}$ moves junction C and bias current | $\Delta C_j = -\frac{C_j}{n}\frac{\Delta V_{bias}/\psi_0}{(1+V_{bias}/\psi_0)}$, $\Delta I_D = g_{mb}\Delta V_{bias}$: poles and gain move |
| Thermal noise | substrate resistance is a noise source ($4kTR$, [[Noise#Resistor Thermal Noise]]) | raises LNA NF ([[RF Noise and Distortion]]); worst when pad resistance ≈ pad reactance; shield the pad with an n+ buried well or lower metal tied to a supply |
| Losses | lossy junction/pad capacitance | lowers inductor/capacitor Q and LNA matching gain; differential AC-coupling caps whose bottom plates couple ($r = 0.2$) lose 1.6 dB versus a single-ended model |
| Spurs and desensitisation | uncorrelated aggressors | PA-to-LNA ratio can exceed 100 dB; digital harmonics in band; low-frequency noise × jammer via second-order distortion; DC offsets in samplers and mixers; oscillator pulling; oscillation loops through high-gain direct-conversion chains (80–100 dB at one frequency) |

> [!tip] Remark
> The single-ended-model pitfall generalises: a "brittle" extracted model of one capacitor or device assumes its own surroundings. Two closely placed devices share substrate impedance ($R_{12}$) that neither single-device model contains.

## Level 4: Mitigation

### Guard Rings at the Rule Level

```tikz title="The same guard ring on the two substrate types. Epi on p+: most current passes under the ring through the p+ bulk. Lightly doped: the ring sinks the surface current. After Charbon Figs. 8.12-8.14 and Sec. 8.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  % ---------- low-res ----------
  \node[font=\bfseries,align=center] at (3.5,5.0) {Epi on p+: ring sees little};
  \draw[fill=orange!35,draw=black!60] (0,0) rectangle (7,2.0);
  \draw[psub] (0,2.0) rectangle (7,3.5);
  \draw[pdiff] (0.8,3.5) rectangle (1.6,3.68); \draw[pdiff] (5.4,3.5) rectangle (6.2,3.68);
  \draw[pdiff] (3.1,3.5) rectangle (3.9,3.68);
  \node[font=\scriptsize] at (1.2,3.95) {injector}; \node[font=\scriptsize] at (5.8,3.95) {receiver};
  \draw (3.5,3.68) -- (3.5,4.0) to[L,l=\scriptsize$L_{gr}$] (4.7,4.0) -- (4.7,3.85) node[ground]{};
  \draw[->,thick,red!70!black] (1.2,3.45) -- (1.2,2.05);
  \draw[->,thick,red!70!black] (1.2,1.9) -- (5.8,1.9);
  \draw[->,thick,red!70!black] (5.8,2.05) -- (5.8,3.45);
  \draw[->,red!70!black] (1.5,3.4) .. controls (2.3,3.0) .. (3.3,3.45);
  \node[font=\scriptsize,fill=white,inner sep=1pt] at (3.5,1.0) {most current goes under the ring};
  \node[font=\scriptsize,align=center,anchor=north] at (3.5,-0.1) {ring: 7--10 dB;\\ fix the backplate ground instead};
  % ---------- high-res ----------
  \begin{scope}[xshift=8.6cm]
    \node[font=\bfseries,align=center] at (3.5,5.0) {Lightly doped: ring catches it};
    \draw[psub] (0,0) rectangle (7,3.5);
    \draw[fill=orange!30,draw=black!40] (0,3.5) rectangle (7,3.3);
    \draw[pdiff] (0.8,3.5) rectangle (1.6,3.68); \draw[pdiff] (5.4,3.5) rectangle (6.2,3.68);
    \draw[pdiff] (3.1,3.5) rectangle (3.9,3.68);
    \node[font=\scriptsize] at (1.2,3.95) {injector}; \node[font=\scriptsize] at (5.8,3.95) {receiver};
    \draw (3.5,3.68) -- (3.5,4.0) to[L,l=\scriptsize$L_{gr}$] (4.7,4.0) -- (4.7,3.85) node[ground]{};
    \foreach \h in {0.15,0.45,0.8} \draw[->,thick,red!70!black] (1.4,3.3) .. controls (2.0,{3.3-\h}) and (2.9,{3.3-\h}) .. (3.4,3.35);
    \draw[->,red!70!black,dashed] (1.4,3.2) .. controls (2.5,1.0) and (4.5,1.0) .. (5.7,3.3);
    \node[font=\scriptsize,fill=white,inner sep=1pt] at (3.5,0.6) {small residue reaches the receiver};
    \node[font=\scriptsize,align=center,anchor=north] at (3.5,-0.1) {ring: $\approx$40 dB with an ideal ground,\\ $\approx$10--20 dB at 1 GHz with 3--5 nH};
  \end{scope}
  \begin{scope}[yshift=-1.55cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-sub / p-epi (darker = heavier doping)};
    \draw[pdiff] (5.6,0) rectangle (6.0,0.25); \node[anchor=west] at (6.05,0.12) {p+ diffusion (contact, guard ring)};
    \draw[->,thick,red!70!black] (11.0,0.12) -- (11.6,0.12); \node[anchor=west] at (11.65,0.12) {noise current};
  \end{scope}
\end{circuitikz}
\end{document}
```

A guard ring is a heavily doped majority-carrier diffusion (p+ in p-substrate) around a device, tied to ground: a **current sink** between injector and receiver that raises the effective $R_{12}$. It sinks only the *surface* current.

```tikz title="Where to put the ring when its own ground bond wire picks up noise: substrate isolation is the same either way, but ring-wire noise reaches the receiver 20 dB less with the ring around the injector. Numbers from Charbon Sec. 8.6.2 and Fig. 8.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  \foreach \xs/\title/\ringx/\res in {0/{Ring around the receiver}/4.6/{ring-wire noise at receiver: 1.41 mV},8.4/{Ring around the injector}/1.4/{ring-wire noise at receiver: 0.14 mV}} {
    \begin{scope}[xshift=\xs cm]
      \node[font=\bfseries] at (3.0,5.55) {\title};
      \draw[psub] (0,0) rectangle (6,4);
      % ring
      \draw[pdiff] (\ringx-0.9,1.1) rectangle (\ringx+0.9,2.9);
      \draw[psub] (\ringx-0.7,1.3) rectangle (\ringx+0.7,2.7);
      % devices
      \draw[ndiff] (1.0,1.6) rectangle (1.8,2.4); \node[font=\scriptsize] at (1.4,2.0) {inj};
      \draw[ndiff] (4.2,1.6) rectangle (5.0,2.4); \node[font=\scriptsize] at (4.6,2.0) {rcv};
      % ring bond wire
      \draw[thick] (\ringx,2.9) -- (\ringx,4.8) node[above,font=\scriptsize] {to ring pad ($L_{gr}$)};
      \node[font=\scriptsize,align=center,anchor=north] at (3.0,-0.1) {\res};
    \end{scope}
  }
  \draw[thick,dashed,red!70!black] (2.6,4.2) -- (4.0,4.2);
  \node[font=\scriptsize,red!70!black,anchor=east,align=right] at (2.6,4.35) {neighbour bond wire\\ 1 mA @ 1 GHz};
  \draw[<->,red!70!black] (4.1,4.2) -- (4.5,4.2);
  \node[font=\scriptsize,red!70!black] at (4.3,4.45) {$M$};
  \draw[thick,dashed,red!70!black] (8.4+3.0,4.2) -- (8.4+1.6,4.2);
  \draw[<->,red!70!black] (8.4+1.55,4.2) -- (8.4+1.45,4.2);
  \node[font=\scriptsize,align=left,anchor=west] at (0,-1.0) {Same substrate isolation either way (a 1 V, 1 GHz injector gives 5.6 mV at the receiver with the ring, 22 mV without).};
  \node[font=\scriptsize,align=left,anchor=west] at (0,-1.45) {Noise picked up by the ring's own bond wire ($M$ = 1 nH: 6.3 mV) reaches the receiver 20 dB less when the ring encloses the injector.};
  \begin{scope}[yshift=-2.15cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-sub};
    \draw[ndiff] (1.6,0) rectangle (2.0,0.25); \node[anchor=west] at (2.05,0.12) {n+ (injecting / receiving junction)};
    \draw[pdiff] (6.6,0) rectangle (7.0,0.25); \node[anchor=west] at (7.05,0.12) {p+ guard ring (thin)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] Guard-ring rules (Charbon Ch. 8, high-resistivity substrates)
> 1. **Thin rings.** Widening a ring raises $R_{12}$ but lowers $R_{1gr}, R_{2gr}$; above about 1 GHz thin rings isolate better, and a shallow optimum appears at 100 MHz (15 µm for 2 nH in Fig. 8.21a). Use minimum-width rings with a very good ground.
> 2. **Ground impedance is the whole game.** Isolation without rings: −55 dB at 100 MHz, −27 dB at 1 GHz (Fig. 8.17a). With a ring: about −100 / −70 dB for an ideal ground, but about −87 / −31 dB with 8 nH: at 1 GHz barely better than no ring.
> 3. **Ground the ring on its own bond wire** if the signal is referenced off chip; an internally grounded ring with large bond-wire inductance can be *worse than no ring*. Ground it to the internal ground only if the signal is measured against that internal ground (then it is excellent and insensitive to $L_{gr}$).
> 4. **Ring the injector when the ring's ground wire is noisy.** Substrate isolation is the same either way, but noise coupled onto the ring's own bond wire reaches the receiver about 20 dB less when the ring encloses the injector. Ideal: ring the noisy circuit and put its ground bond wire among the analog bond wires.
> 5. **Two rings, two pins.** Separately grounded rings around injector and receiver: −62 → −130 dB at 100 MHz, −34 → −57 dB at 1 GHz (Table 8.1). Rings joined to one ground act as one big ring.
> 6. **Differential receivers inside a ring:** differential isolation improves and becomes independent of $L_{gr}$; common-mode isolation worsens with ring width when $L_{gr}\neq0$. Still use thin rings.

> [!note]- Derivation: the guard-ring trade-off (Charbon Eq. 8.2)
> With small injector/receiver reactances, a floating backplate and a small load $R_l$, the receiver voltage from the injector $V_{inj}$ and from noise $V_{inj1}$ coupled into the ring's bond wire (inductance $L$) is
> $$V_2 = R_l\left\{\left(\frac{1}{R_{12}} + \frac{j\omega L}{R_{1gr}R_{2gr} + j\omega L(R_{1gr}+R_{2gr})}\right)V_{inj} + \frac{R_{1gr}}{R_{1gr}R_{2gr}+j\omega L(R_{1gr}+R_{2gr})}\,V_{inj1}\right\}$$
> - $V_{inj1}=0$: at low frequency isolation is set by $R_{12}$, so wider is better. Above $\omega \approx R_{1gr}R_{2gr}/[L(R_{1gr}+R_{2gr})]$ the ring's path to ground is inductive and isolation is governed by $R_{1gr}+R_{2gr}$; if that sum is small the ring can make things worse.
> - $V_{inj1}\neq0$: at low frequency ring noise reaches the output scaled by $R_l/R_{2gr}$, large if the ring is wide (small $R_{2gr}$). The $V_{inj}$ term is symmetric in $R_{1gr}, R_{2gr}$, so moving the ring to the injector (large $R_{2gr}$, small $R_{1gr}$) leaves substrate isolation unchanged but suppresses ring noise.
>
> **Worked numbers (Charbon §8.6.2):** a neighbouring bond wire carrying 1 mA at 1 GHz with 1 nH mutual inductance puts $V_{inj1} = 6.3$ mV on the ring. Ring around the receiver: 1.41 mV at the receiver; ring around the injector: 0.14 mV. A 1 V, 1 GHz injector gives 5.623 mV with the ring (22 mV without). Ring noise dominates above 3.5 mA of neighbouring current (ring at receiver) or 35 mA (ring at injector).

> [!tip] Remark
> The ring *structures* (majority- vs minority-carrier rings, n-well noise-blocking rings, contact pitch, latch-up spacing) are drawn in [[Guard Rings, ESD and Interconnect]]. Hastings (§14.1) reaches the same conclusions independently: rings around the injector attenuate more, widening helps only modestly, and injector-ring and victim-ring grounds should run separately to the board ground.

### Buried Shields: p+ Layer, SOI, Deep N-Well

```tikz title="Three buried shields side by side: (a) p+ buried layer contacted by p+ taps (Faraday shield), (b) SOI buried oxide with trench (series capacitance), (c) buried n+ / deep n-well tied to V_DD around an isolated p-well (both). After Charbon Fig. 8.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60}]
  % (a) p+ buried
  \node[font=\bfseries,align=center] at (2.5,4.5) {(a) p+ buried layer};
  \draw[psub] (0,0) rectangle (5,3);
  \draw[pdiff] (0.4,3) rectangle (0.9,2.8); \node[font=\scriptsize] at (0.65,3.25) {inj};
  \draw[fill=orange!45,draw=black!60] (1.8,1.4) rectangle (4.7,1.8);
  \draw[pdiff] (1.8,3) rectangle (2.2,1.8); \draw[pdiff] (4.3,3) rectangle (4.7,1.8);
  \draw[ndiff] (2.9,3) rectangle (3.6,2.8); \node[font=\scriptsize] at (3.25,3.25) {rcv};
  \draw (2.0,3) -- (2.0,3.6) -- (4.5,3.6) -- (4.5,3);
  \draw (4.5,3.6) -- (5.35,3.6) -- (5.35,3.2) node[ground]{};
  \node[font=\scriptsize,align=center,anchor=north] at (2.5,-0.1) {low-$Z$ path to ground;\\ floats if the ground wire is inductive};
  % (b) SOI
  \begin{scope}[xshift=5.8cm]
    \node[font=\bfseries,align=center] at (2.5,4.5) {(b) SOI + trench};
    \draw[psub] (0,0) rectangle (5,3);
    \draw[fill=gray!20,draw=black!60] (0,2.2) rectangle (5,2.45);
    \draw[psub] (0,2.45) rectangle (5,3);
    \draw[sti] (1.7,3) rectangle (1.95,2.45); \draw[sti] (4.45,3) rectangle (4.7,2.45);
    \draw[pdiff] (0.4,3) rectangle (0.9,2.8); \node[font=\scriptsize] at (0.65,3.25) {inj};
    \draw[ndiff] (2.9,3) rectangle (3.6,2.8); \node[font=\scriptsize] at (3.25,3.25) {rcv};
    \node[font=\scriptsize] at (2.5,2.05) {buried oxide};
    \node[font=\scriptsize,align=center,anchor=north] at (2.5,-0.1) {series $C_{sh}$: excellent at low $f$,\\ degrades with frequency};
  \end{scope}
  % (c) deep n-well
  \begin{scope}[xshift=11.6cm]
    \node[font=\bfseries,align=center] at (2.5,4.5) {(c) buried n+ / deep n-well};
    \draw[psub] (0,0) rectangle (5,3);
    \draw[fill=cyan!30,draw=cyan!50!black] (1.6,1.3) rectangle (4.9,1.7);
    \draw[nwell] (1.6,3) rectangle (2.0,1.5); \draw[nwell] (4.5,3) rectangle (4.9,1.5);
    \draw[fill=orange!25,draw=black!50] (2.0,3) rectangle (4.5,1.7);
    \draw[pdiff] (0.4,3) rectangle (0.9,2.8); \node[font=\scriptsize] at (0.65,3.25) {inj};
    \draw[ndiff] (2.9,3) rectangle (3.6,2.8); \node[font=\scriptsize] at (3.25,3.25) {rcv};
    \draw[ndiff] (1.65,3) rectangle (1.95,2.85); \draw[ndiff] (4.55,3) rectangle (4.85,2.85);
    \draw (1.8,3) -- (1.8,3.6) -- (4.7,3.6) -- (4.7,3); \node[font=\scriptsize,anchor=south] at (3.25,3.6) {$V_{DD}$};
    \node[font=\scriptsize] at (3.25,2.2) {isolated p-well};
    \node[font=\scriptsize,align=center,anchor=north] at (2.5,-0.1) {two junction $C$s in series + a supply\\ node between: robust; beat SOI (measured)};
  \end{scope}
  \begin{scope}[yshift=-1.55cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-sub};
    \draw[nwell] (1.6,0) rectangle (2.0,0.25); \node[anchor=west] at (2.05,0.12) {n-well};
    \draw[fill=cyan!30,draw=cyan!50!black] (3.3,0) rectangle (3.7,0.25); \node[anchor=west] at (3.75,0.12) {deep n-well / n+ buried};
    \draw[ndiff] (7.2,0) rectangle (7.6,0.25); \node[anchor=west] at (7.65,0.12) {n+};
    \draw[pdiff] (8.4,0) rectangle (8.8,0.25); \node[anchor=west] at (8.85,0.12) {p+};
    \draw[fill=orange!45,draw=black!60] (9.6,0) rectangle (10.0,0.25); \node[anchor=west] at (10.05,0.12) {p+ buried};
    \draw[sti] (11.8,0) rectangle (12.2,0.25); \node[anchor=west] at (12.25,0.12) {trench / STI};
    \draw[fill=gray!20,draw=black!60] (14.1,0) rectangle (14.5,0.25); \node[anchor=west] at (14.55,0.12) {buried oxide};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Shield | How it isolates | Weak point |
|---|---|---|
| p+ buried layer under the receiver, contacted by taps (Faraday shield) | alternate low-impedance path to ground; ideal with an ideal ground | very sensitive to ground-path impedance: floats with bond-wire inductance at high frequency |
| Buried oxide (SOI) + trench | series capacitance $C_{sh}$ between injector and receiver | excellent at low frequency, degrades with frequency; thicker oxide helps; costly wafers |
| Buried n+ / deep n-well tied to $V_{DD}$ (junction isolation) | both: junction capacitances in series *and* a low-impedance supply node in between | hard to put under PMOS n-wells or npn buried collectors; measured better than SOI |

- With a dedicated ground, put the shield around the **smaller** circuit (smaller junction capacitance, larger reactance relative to the ground impedance). Digital is usually larger, so shield the analog.
- A highly conductive n shield acts as a T-attenuator (excellent at low frequency, degrading with frequency); a lightly doped one gives only the series junction capacitances, which are smaller, so high-frequency isolation can be better.

> [!tip] Remark
> The deep n-well cross-section and its n-well ring are drawn in [[CMOS Processing#Twin Well and Deep N-Well]]. Hastings reports an NBL/deep-sinker isolated microphone preamp next to a ~1 A switching converter with no audible noise, using separate package pins (Hastings §14.1).

### Differential Circuits

```tikz title="Differential receivers, bad vs good placement. In line with the injector the near half shields the far half, so the pickup is unequal (differential); on the symmetry axis the pickup is common mode and only mismatch leaks through. After Charbon Figs. 8.9-8.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  % bad
  \node[font=\bfseries] at (3,4.4) {Bad: injector in line with the pair};
  \draw[psub] (0,0) rectangle (6,4);
  \draw[ndiff] (1.6,1.3) rectangle (1.9,2.7); \node[font=\scriptsize] at (1.75,3.0) {$+$};
  \draw[ndiff] (2.3,1.3) rectangle (2.6,2.7); \node[font=\scriptsize] at (2.45,3.0) {$-$};
  \draw[ndiff] (4.4,1.8) rectangle (4.8,2.2); \node[font=\scriptsize] at (4.6,2.45) {inj};
  \draw[->,red!70!black,thick] (4.35,2.0) -- (2.65,2.0);
  \draw[->,red!70!black] (4.35,1.9) .. controls (3.4,1.0) and (2.4,1.0) .. (1.85,1.25);
  \node[font=\scriptsize,align=center] at (3,0.45) {near receiver shields the far one:\\ unequal pickup = differential error};
  % good
  \begin{scope}[xshift=7.2cm]
    \node[font=\bfseries] at (3,4.4) {Good: injector on the symmetry axis};
    \draw[psub] (0,0) rectangle (6,4);
    \draw[ndiff] (2.45,1.3) rectangle (2.75,2.7); \node[font=\scriptsize] at (2.6,3.0) {$+$};
    \draw[ndiff] (3.25,1.3) rectangle (3.55,2.7); \node[font=\scriptsize] at (3.4,3.0) {$-$};
    \draw[dashed,gray] (3.0,1.15) -- (3.0,3.9);
    \draw[ndiff] (2.8,3.35) rectangle (3.2,3.75); \node[font=\scriptsize,anchor=west] at (3.25,3.55) {inj};
    \draw[->,red!70!black,thick] (2.9,3.3) -- (2.65,2.75);
    \draw[->,red!70!black,thick] (3.1,3.3) -- (3.35,2.75);
    \node[font=\scriptsize,align=center] at (3,0.55) {equal pickup = common mode;\\ residue set by mismatch\\ (5\,\%: $\approx-80$ dB at 1 GHz)};
  \end{scope}
  \node[font=\scriptsize,anchor=west] at (0,-0.45) {Top view; receivers are the two halves of a differential pair (n+ junctions), injector a switching junction. After Charbon Figs. 8.9--8.10.};
\end{circuitikz}
\end{document}
```

- A well-matched differential receiver sees substrate noise as common mode. On a **low-resistivity** substrate this works extremely well: the bulk is equipotential, so both contacts get the same voltage (≈ −120 dB at 400 µm, 1 GHz, ideal match).
- On a **high-resistivity** substrate the improvement is smaller: the near contact shields the far one, so the two see different voltages.
- **Place the pair symmetric about the injector axis.** An injector on the pair's axis of symmetry gives (ideally) infinite differential isolation; one off to the side is the worst case.
- **Mismatch sets the floor:** 5 % mismatch of the receivers' substrate capacitance limits isolation to about −80 dB at 1 GHz (Fig. 8.10b). Mismatch turns common-mode injection and reception into single-ended behaviour.
- Distribute **clocks and digital signals in complementary form** so the injected currents cancel (Razavi §19.3); a fully differential VCO delay cell laid out in mirror symmetry turns most coupled noise into common mode (Charbon §5.3.3).

> [!tip] Remark
> Matching the pair is [[Device Matching]]; how much common mode leaks to the output is the CMRR of [[Differential Amplifiers]].

### Separate Supplies, Grounds and Substrate Contacts

```tikz title="Which ground the substrate joins. GND_A: substrate and analog ground bounce together. GND_D: the digital bounce lands under the analog circuits. Both: the grounds are shorted through the substrate. After Razavi Figs. 19.56-19.59."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  \foreach \xs/\title/\verdict in {0/{Substrate tied to GND$_A$ (usually preferred)}/{substrate and analog ground bounce together:\\ small $v_{bs}$ in the analog devices},10.0/{Substrate tied to GND$_D$}/{the full digital ground bounce lands\\ on the substrate under the analog}} {
    \begin{scope}[xshift=\xs cm]
      \node[font=\bfseries] at (3.5,3.7) {\title};
      \draw[psub] (0,0) rectangle (7,1.0);
      \draw[thick,fill=white] (0.8,1.8) rectangle (2.9,3.0) node[pos=0.5,align=center,font=\scriptsize] {analog\\ section};
      \draw[thick,fill=white] (4.1,1.8) rectangle (6.2,3.0) node[pos=0.5,align=center,font=\scriptsize] {digital\\ section};
      \draw (0.8,2.4) -- (-0.5,2.4) to[L,l_=$L_A$] (-0.5,0.5) node[ground]{};
      \draw (6.2,2.4) -- (7.5,2.4) to[L,l=$L_D$] (7.5,0.5) node[ground]{};
      \node[font=\scriptsize,anchor=south] at (0.15,2.4) {GND$_A$};
      \node[font=\scriptsize,anchor=south] at (6.85,2.4) {GND$_D$};
      \node[font=\scriptsize,align=center,anchor=north] at (3.5,-0.1) {\verdict};
    \end{scope}
  }
  \draw[pdiff] (1.6,1.0) rectangle (2.1,1.15);
  \draw (1.85,1.15) -- (1.85,1.45) -- (0.3,1.45) -- (0.3,2.4); \fill (0.3,2.4) circle (1.5pt);
  \draw[->,thick,red!70!black] (5.6,0.5) -- (2.0,0.5) node[pos=0.5,below,font=\scriptsize] {substrate current exits via $L_A$};
  \begin{scope}[xshift=10.0cm]
    \draw[pdiff] (4.9,1.0) rectangle (5.4,1.15);
    \draw (5.15,1.15) -- (5.15,1.45) -- (6.7,1.45) -- (6.7,2.4); \fill (6.7,2.4) circle (1.5pt);
    \draw[->,thick,red!70!black] (5.15,0.6) -- (1.4,0.6) node[pos=0.5,below,font=\scriptsize] {GND$_D$ bounce spreads};
  \end{scope}
  \node[font=\scriptsize,anchor=west,align=left] at (-0.5,-1.3) {Tying to both grounds shorts GND$_A$ to GND$_D$ through the substrate. Which choice wins depends on the digital transients and on $L_A$, $L_D$:\\ simulate with the package. After Razavi Figs. 19.56--19.59.};
  \begin{scope}[xshift=-0.5cm,yshift=-2.15cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-substrate};
    \draw[pdiff] (2.4,0) rectangle (2.8,0.25); \node[anchor=west] at (2.85,0.12) {p+ substrate tie};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Separate **analog and digital supplies and grounds**, each on its own pins (Razavi Fig. 19.57).
- If the chip ground bounces **in unison** with the substrate, transistors see no $v_{bs}$: connect the substrate to the chip ground on chip and bring both out on one wire (Razavi Fig. 19.56).
- To which ground? Tying the substrate to **GND_A** makes analog ground and substrate move together (usually preferred); tying it to **GND_D** puts the full digital bounce on the substrate; tying it to **both** shorts the two grounds through the substrate. Which wins depends on the digital transient currents and $L_A$, $L_D$: simulate with the package (Razavi Figs. 19.58–19.59).
- Minimise the inductance of the substrate bond wire; on epi-on-p+ make the backplate connection as low impedance as possible (the biggest single lever, [[#4. What each mitigation buys]]). Hastings notes silver epoxy die attach is not low-resistance enough; solder, gold eutectic or silver sintering are used.
- Keep every n-well AC-grounded (a moving well is a large injector).

> [!tip] Remark
> Pin assignment, multiple bond wires and supply bounce $L\,di/dt$ are [[Packaging]]'s; this note only decides which ground the substrate joins.

### Floorplanning and Spacing

```tikz title="A substrate-aware floorplan: noisy core and output buffers ringed and placed away from the analog block, analog block in deep n-well inside its own ring, every ring on its own pad, ring and substrate pads grouped with the analog bond wires. Synthesised from Charbon Secs. 4.2, 8.6 and Razavi Sec. 19.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  pdiff/.style={fill=orange!65,draw=black!60},
  pad/.style={fill=gray!35,draw=black!70}]
  \draw[psub,thick] (0,0) rectangle (10,8);
  % pads
  \foreach \y/\l in {1.2/{A},2.2/{A},3.2/{GR$_A$},4.2/{SUB}} { \draw[pad] (0.15,\y-0.3) rectangle (0.75,\y+0.3); \node[font=\tiny] at (0.45,\y) {\l}; }
  \foreach \x/\l in {1.6/{A},2.6/{A},3.6/{A},4.6/{GR$_D$}} { \draw[pad] (\x-0.3,0.15) rectangle (\x+0.3,0.75); \node[font=\tiny] at (\x,0.45) {\l}; }
  \foreach \y/\l in {4.6/{D},5.6/{D},6.6/{D},7.4/{D}} { \draw[pad] (9.25,\y-0.3) rectangle (9.85,\y+0.3); \node[font=\tiny] at (9.55,\y) {\l}; }
  \foreach \x/\l in {6.0/{D},7.0/{D},8.0/{D}} { \draw[pad] (\x-0.3,7.25) rectangle (\x+0.3,7.85); \node[font=\tiny] at (\x,7.55) {\l}; }
  % analog block with deep n-well and ring
  \draw[pdiff] (1.0,1.0) rectangle (4.4,4.4);
  \draw[psub] (1.15,1.15) rectangle (4.25,4.25);
  \draw[fill=cyan!30,draw=cyan!50!black] (1.4,1.4) rectangle (4.0,4.0);
  \draw[fill=white,draw=black] (1.7,1.7) rectangle (3.7,3.7) node[pos=0.5,align=center,font=\scriptsize] {analog\\ (VCO, ADC,\\ LNA)};
  \node[font=\tiny,anchor=south west] at (1.4,4.0) {deep n-well};
  % digital block with ring
  \draw[pdiff] (5.3,3.9) rectangle (8.9,7.0);
  \draw[psub] (5.45,4.05) rectangle (8.75,6.85);
  \draw[fill=white] (5.7,4.3) rectangle (8.5,6.6) node[pos=0.5,align=center,font=\scriptsize] {digital core\\ dividers, clock drivers};
  % output buffers far corner
  \draw[fill=white] (6.0,1.2) rectangle (8.6,2.2) node[pos=0.5,font=\scriptsize] {output buffers};
  \draw[pdiff] (5.85,1.05) rectangle (8.75,2.35); \draw[fill=white] (6.0,1.2) rectangle (8.6,2.2) node[pos=0.5,font=\scriptsize] {output buffers};
  % spacing arrow
  \draw[<->,thick] (4.45,4.45) -- (5.25,3.85);
  \node[font=\scriptsize,anchor=west,align=left] at (0.9,5.3) {spacing: useful on lightly\\ doped substrate only};
  \draw[->] (3.4,5.0) -- (4.8,4.2);
  % ring ground wires
  \draw[thick,orange!60!black] (1.0,3.2) -- (0.75,3.2);
  \draw[thick,orange!60!black] (5.6,3.9) -- (5.6,0.95) -- (4.6,0.95) -- (4.6,0.75);
  \node[font=\scriptsize,anchor=west,align=left] at (10.2,7.4) {digital supply pads grouped on\\ the digital side; ring around the\\ injector (digital core)};
  \node[font=\scriptsize,anchor=west,align=left] at (10.2,4.2) {rings: thin, each on its own\\ low-$L$ bond wire};
  \node[font=\scriptsize,anchor=west,align=left] at (10.2,1.6) {fast, large injectors (buffers, fast\\ divider) farthest from the analog};
  \node[font=\scriptsize,anchor=north west,align=left] at (0,-0.15) {Analog pads, both ring grounds (GR$_A$, GR$_D$) and the substrate pin SUB sit with the analog bond wires, away from digital bond-wire noise (Charbon \S8.6.2).};
  \begin{scope}[yshift=-1.25cm,font=\scriptsize]
    \draw[psub] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p-sub};
    \draw[pdiff] (1.7,0) rectangle (2.1,0.25); \node[anchor=west] at (2.15,0.12) {p+ guard ring};
    \draw[fill=cyan!30,draw=cyan!50!black] (4.4,0) rectangle (4.8,0.25); \node[anchor=west] at (4.85,0.12) {deep n-well};
    \draw[pad] (6.6,0) rectangle (7.0,0.25); \node[anchor=west] at (7.05,0.12) {bond pad};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Spacing works only on lightly doped substrates** (or within the first few epi thicknesses on epi). On epi-on-p+, "increasing the physical spacing ... may not be effective" (Razavi §19.3) and costs interconnect length.
- Allocate **well-isolated areas to noisy circuits**; minimum distances follow from each injector's noise signature and each receptor's tolerance (Charbon Ch. 4 §2). Rank injectors by spectral energy in the receptor's band (the fast divider, output buffers, clock drivers).
- Put **analog and digital pads and bond wires in separate sections** of the package, with the analog guard-ring ground wire among the analog wires.
- When space is short, design rings or shields for the offending part of the spectrum instead of distance.

> [!tip] Remark
> Die-level block placement, pad rings and power routing are [[Floorplanning and Top-Level Assembly]]; this note supplies the substrate constraint that floorplan must satisfy.

### Timing Digital Edges and Decoupling

```tikz title="Timing: the substrate rings after each clock edge and decays, so sample just before the next edge, not right after one, and move other noisy bursts (output buffers) away from the sampling instant. After Razavi Sec. 19.3 and Charbon Sec. 7.4.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % CK
  \draw[->] (0,4) -- (10.5,4) node[right,font=\scriptsize]{$t$};
  \draw[thick] (0,4.1) -- (1.0,4.1) -- (1.1,4.8) -- (5.0,4.8) -- (5.1,4.1) -- (9.0,4.1) -- (9.1,4.8) -- (10.2,4.8);
  \node[font=\scriptsize,anchor=east] at (0,4.45) {CK};
  % vsub
  \draw[->] (0,2.2) -- (10.5,2.2);
  \draw[thick,red!70!black,domain=1.05:4.9,samples=120] plot (\x,{2.2+0.9*exp(-(\x-1.05)*1.6)*sin(deg(9*(\x-1.05)))});
  \draw[thick,red!70!black,domain=5.05:8.9,samples=120] plot (\x,{2.2-0.9*exp(-(\x-5.05)*1.6)*sin(deg(9*(\x-5.05)))});
  \draw[thick,red!70!black] (0,2.2) -- (1.05,2.2);
  \node[font=\scriptsize,anchor=east] at (0,2.2) {$v_{sub}$};
  \node[font=\scriptsize,red!70!black,align=left,anchor=west] at (1.6,3.25) {rings and decays ($L_{gnd}$ with\\ substrate and decap capacitance)};
  % sample
  \draw[->] (0,0.6) -- (10.5,0.6);
  \node[font=\scriptsize,anchor=east] at (0,0.75) {sample};
  \draw[thick,green!40!black] (0,0.65) -- (3.6,0.65) -- (3.6,1.2) -- (4.4,1.2) -- (4.4,0.65) -- (10.2,0.65);
  \draw[dashed,green!40!black] (4.4,0.6) -- (4.4,2.6);
  \node[font=\scriptsize,green!40!black,anchor=north,align=center] at (4.4,0.5) {sampling edge: just\\ before the next CK edge};
  \draw[dashed,gray] (1.4,0.6) -- (1.4,4.0);
  \node[font=\scriptsize,gray,anchor=north,align=center] at (1.4,0.5) {bad: right\\ after CK};
  \draw[thick,blue!60!black] (6.6,0.65) -- (6.6,1.0) -- (7.6,1.0) -- (7.6,0.65);
  \node[font=\scriptsize,blue!60!black,anchor=north,align=center] at (7.4,0.5) {output-buffer burst,\\ kept away from the sample};
\end{circuitikz}
\end{document}
```

- Perform **critical analog operations well after clock edges**, when the substrate has settled: sampling, charge transfer (Razavi §19.3).
- Stagger noisy events away from the sampling instant: e.g. enable an ADC's output buffers at a different time than the sample-and-hold (Charbon §7.4.3).
- **Frequency-plan** around the digital clock and its harmonics; include substrate-coupled spurs in the plan (Charbon §7.4.3).
- **Decoupling capacitors isolated from the substrate** (e.g. MIM/MOM, or MOS caps in their own well) return high-frequency switching current to circuit ground; junction and wiring capacitance in the digital block instead pushes it into the substrate.

> [!tip] Remark
> Moving a sampling instant away from the edge is the same timing freedom used against charge injection in [[Sampling Circuits]]; the settling time of the substrate is set by $L_{gnd}$ and the substrate/decap capacitance, which can ring.

## Level 5: Simulation, Extraction and Optimisation

### The Field Problem

Contacts are equipotential (Dirichlet), die edges and top surface carry no normal current (Neumann), the backplate is grounded (or floating), and current is continuous across layer interfaces ($\sigma_1\partial\Phi/\partial n_1 = \sigma_2\partial\Phi/\partial n_2$). To extract one column of the contact admittance matrix, set one contact to 1 V, ground the rest, solve, and integrate the normal current into each contact.

> [!tip] Remark
> The resistance and capacitance problems are the same Laplace equation, so a capacitance extractor solves the resistive one: $R_{ij} = -\frac{1}{\sigma\varepsilon}\frac{\Phi_i}{Q_j}$ (Charbon Eqs. 3.7–3.8).

### Mesh Methods vs Boundary-Element (Green's Function) Methods

```tikz title="Two ways to extract the substrate. A 3-D resistor mesh handles any resistivity map but has unknowns everywhere; a boundary-element method with a layered Green's function only discretises the contacts. After Charbon Ch. 3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  \ctikzset{resistors/scale=0.35}
  % mesh
  \node[font=\bfseries] at (3,4.3) {Mesh (FD/FEM): unknowns everywhere};
  \draw[psub] (0,0) rectangle (6,3.6);
  \draw[pdiff] (0.6,3.6) rectangle (1.4,3.75); \draw[pdiff] (4.6,3.6) rectangle (5.4,3.75);
  \foreach \i in {0,...,5} { \foreach \j in {0,...,3} {
    \pgfmathsetmacro{\x}{0.5+\i}\pgfmathsetmacro{\y}{0.4+0.9*\j}
    \ifnum\i<5 \draw[blue!60!black] (\x,\y) to[R] (\x+1,\y); \fi
    \ifnum\j<3 \draw[blue!60!black] (\x,\y) to[R] (\x,\y+0.9); \fi
    \fill[blue!60!black] (\x,\y) circle (1.2pt);
  } }
  \node[font=\scriptsize,align=center,anchor=north] at (3,-0.1) {sparse but huge (7 nonzeros/row in 3-D);\\ any resistivity map; Krylov + preconditioner};
  % BEM
  \begin{scope}[xshift=7.4cm]
    \node[font=\bfseries] at (3,4.3) {BEM: unknowns on contacts only};
    \draw[psub] (0,2.7) rectangle (6,3.6);
    \draw[fill=orange!22,draw=black!50] (0,1.6) rectangle (6,2.7);
    \draw[fill=orange!35,draw=black!60] (0,0) rectangle (6,1.6);
    \foreach \x in {0.6,0.8,1.0,1.2} \draw[pdiff] (\x,3.6) rectangle (\x+0.2,3.75);
    \foreach \x in {4.6,4.8,5.0,5.2} \draw[pdiff] (\x,3.6) rectangle (\x+0.2,3.75);
    \node[font=\scriptsize] at (1.0,4.0) {panels}; \node[font=\scriptsize] at (5.0,4.0) {panels};
    \draw[<->,red!70!black,thick] (1.3,3.5) .. controls (2.5,2.6) and (3.5,2.6) .. (4.7,3.5);
    \node[font=\scriptsize,red!70!black,fill=white,inner sep=1pt] at (3,2.55) {$G(\mathbf r,\mathbf r')$};
    \node[font=\scriptsize,anchor=west] at (6.1,3.15) {$\sigma_1$};
    \node[font=\scriptsize,anchor=west] at (6.1,2.15) {$\sigma_2$};
    \node[font=\scriptsize,anchor=west] at (6.1,0.8) {$\sigma_3$};
    \node[font=\scriptsize,align=center,anchor=north] at (3,-0.1) {dense $N\times N$, $N$ = contact panels;\\ layered $G$ via DCT once per technology};
  \end{scope}
\end{circuitikz}
\end{document}
```

| | Finite difference / finite element mesh | Boundary element with layered Green's function |
|---|---|---|
| Unknowns | potential at every 3-D grid node (7 nonzeros per row for FD) | current on panels of the contacts only |
| Handles | arbitrary lateral and vertical resistivity, any geometry | vertically layered substrate, few regions; non-abrupt profiles by finer z-layers |
| Matrix | sparse but huge; direct LU fills in, so Krylov (CG, GMRES) with preconditioning (incomplete LU, multigrid) | dense $N\times N$ ($N$ = 50–5000 typical) |
| Speed-ups | non-uniform grid (fine near contacts), AWE | Green's function via DCT/FCT in $O(N\log N)$ once per substrate; fast matrix-vector products, multigrid / wavelet bases |
| Good for | one-off verification | incremental changes (ECO, placement loops) |

> [!note]- Detail: Green's function and the coefficient-of-potential matrix (Charbon §3.3–3.4)
> With a grounded backplate the potential is $\Phi(\mathbf r) = \int_V \rho(\mathbf r')G(\mathbf r,\mathbf r')d^3r'$. Averaging over contacts gives $\bar\Phi = \mathbf P\mathbf Q$ and $\mathbf Q = \mathbf c\bar\Phi$ with $\mathbf c = \mathbf P^{-1}$ (coefficient-of-induction matrix); $C_i = \sum_j c_{ij}$, $C_{ij} = -c_{ij}$, and resistances follow by the R–C duality. In free space $G = 1/(4\pi\sigma|\mathbf r-\mathbf r'|)$; for a layered, bounded substrate $G$ is a cosine series whose dependence on contact position reduces to a 2-D DCT, and the vertical part depends only on the doping profile, so it is computed once per technology (the SUBRES approach).

### Macromodels, Signatures and Measurement

- **Macromodels:** fit a small resistor (or RC) network to measured or simulated contact-to-contact currents; fast, but accuracy under small layout changes is unclear (Charbon §3.1).
- **Multi-port models with sensitivities** $\partial Y_{ij}/\partial T$ to doping, contact depth, epi thickness allow technology selection and trend analysis without re-extraction (Charbon §4.3, §6.3.2).
- **Noise signatures** (SUBWAVE) give the injector waveform; a SPICE run of signature + extracted network gives the receiver voltage (Charbon Ch. 4).
- **Calibrate on test structures:** DC voltage-ratio measurements on p+ contact arrays matched the simulator within 15 % for ratios above 0.5, degrading below 0.1 (Charbon App. D). On-wafer S-parameter two-ports confirm the quasi-static model to several GHz, but probe-to-probe coupling limits the measurable isolation to about −40 to −45 dB after calibration, and on-wafer probing cannot see package inductance.

### Design Optimisation: Constraints, Sensitivities, Placement

```tikz title="The top-down substrate-aware loop of Charbon Chs. 5-6: system spec, constraints on each receptor from sensitivities, placement scored against those bounds using injector signatures and an incremental substrate model, then extraction and verification."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=1.2cm,text width=2.7cm,font=\scriptsize}]
  \node[blk,fill=yellow!15] (s) at (0,0) {\textbf{system spec}\\ e.g. $J_{pp}\le100$ ps};
  \node[blk,fill=green!12] (c) at (3.6,0) {\textbf{constraint generation}\\ local noise generators,\\ sensitivities $\partial K/\partial V_0$};
  \node[blk,fill=green!12] (b) at (7.2,0) {\textbf{bounds}\\ $V_0\le110$ mV at each\\ VCO receptor};
  \node[blk,fill=blue!10] (p) at (10.8,0) {\textbf{placement (SA)}\\ cost += violations;\\ rank-1 updates of $\mathbf c$};
  \node[blk,fill=red!10] (n) at (7.2,-2.2) {\textbf{injector models}\\ noise signatures\\ (SUBWAVE)};
  \node[blk,fill=red!10] (x) at (10.8,-2.2) {\textbf{substrate model}\\ layered $G$ + DCT\\ (SUBRES)};
  \node[blk,fill=gray!12] (v) at (14.4,0) {\textbf{verify}\\ extract + SPICE\\ (Ch.\ 5: 108 mV)};
  \draw[->,thick] (s) -- (c); \draw[->,thick] (c) -- (b); \draw[->,thick] (b) -- (p); \draw[->,thick] (p) -- (v);
  \draw[->,thick] (n) -- (p); \draw[->,thick] (x) -- (p);
  \draw[->,thick,dashed] (v.north) -- ++(0,0.6) -| node[pos=0.25,above,font=\scriptsize] {violation: re-place, add ring/shield, or resize (bigger, less sensitive devices)} (c.north);
\end{circuitikz}
\end{document}
```

1. **Constraint generation (Ch. 5).** Put a local noise generator at each receptor node, compute performance sensitivities $\partial K/\partial V_0$, and solve for the largest noise each node may see such that the system spec holds. Worst case: impulsive generators switching in sync with the sensitive event.
2. **Isolation factor.** From the extracted substrate, the ratio of receptor to injector potential gives the minimum distance (or the need for a ring).
3. **Substrate-aware placement (Ch. 6).** Simulated annealing with the substrate network in the cost function; Sherman–Morrison rank-one updates of $\mathbf c$ when one contact moves, gradient estimates (1 % accurate within five grid steps, 10 % for moves of a tenth of the chip), full re-solve only when a constraint is near violation.
4. **Template-based extraction.** Reuse a pre-extracted template and update only contacts whose displacement matters to the performance; drop conductances whose sensitivity-weighted effect is below threshold.

> [!tip] Remark
> This is the same top-down "spec → constraint → layout" loop as [[Layout Automation]]; substrate noise is the one parasitic that is global (every contact couples to every other), which is why incremental Green's-function methods are needed inside the loop.

## Design intuition / trade-offs

| Knob | Improves | Costs / caveat |
|---|---|---|
| Lightly doped substrate | distance and guard rings work | latch-up susceptibility; more debiasing |
| Epi on p+ | latch-up; uniform potential | distance and rings nearly useless; need a very low-impedance backplate/substrate ground |
| Distance | isolation on lightly doped silicon | area and interconnect length; no gain beyond 2.5–5 epi thicknesses on epi-on-p+ |
| Thin guard ring with dedicated low-L ground | 40 dB-class isolation on lightly doped silicon | one pin; worthless (or harmful) with several nH at 1 GHz |
| Wide guard ring | low-frequency isolation | worse at ≥ 1 GHz; collects bond-wire noise |
| Ring around injector vs receiver | same substrate isolation; ring-ground noise 20 dB lower around injector | |
| Second guard ring | tens of dB (Table 8.1) | a second pin |
| Deep n-well / buried n+ | junction + Faraday isolation, body free of substrate | process option; not under PMOS wells; area |
| SOI | excellent at low frequency | degrades with frequency; wafer cost |
| Differential path, complementary clocks | rejects common-mode substrate noise | 2× devices/power; limited by mismatch |
| PMOS input in source-tied well | removes body-effect reception | well capacitance loads the tail node |
| Substrate tied to GND_A | substrate and analog ground bounce together | analog ground carries substrate current |
| Sampling after edges, staggered buffers | avoids the peak disturbance | timing budget |
| Low receiver impedance | less capacitive pickup | power |
| Smaller injecting/receiving junctions | less $C_{js}$ | device size vs matching |

## Cheat sheet

| Quantity | Result |
|---|---|
| Isolation | $I = 20\log_{10}(V_{rcv}/V_{inj})$ |
| Isolation budget | $I_{dB} \le 20\log_{10}\big(\varepsilon/(\eta V_{inj})\big)$ |
| Junction capacitance (abrupt) | $C_{js} = \sqrt{\frac{q\varepsilon}{2(\psi_0+V_{cs})}\frac{N_CN_S}{N_C+N_S}}$ |
| Impact ionization | $I_{sub} \simeq C_1(V_{DS}-V_{Dsat})I_De^{-C_2/(V_{DS}-V_{Dsat})}$ |
| Drain-to-body conductance | $g_{db} \approx C_2 I_{sub}/(V_{DS}-V_{Dsat})^2$ |
| Body-effect reception | $g_{mb}/g_m = \sqrt{2q\varepsilon N_A}/(2C_{ox}\sqrt{2\phi_f+V_{sb}}) = 0.1$–$0.3$; $\Delta I_D = g_{mb}\Delta V_{sub}$ |
| Capacitive reception | $V_{rcv} \approx j\omega R_{load}C_{sub}V_{sub}$ below the load pole |
| Quasi-static substrate | $\nabla\cdot(\sigma\nabla\Phi)=0$ if $\varepsilon/\sigma \ll$ time scale (≈ up to 2–5 GHz) |
| Backplate path (low-ρ) | $Z'_{12} = R_{10}+R_{20} - jR_{10}R_{20}/(\omega L_{gnd})$ |
| Critical distance (low-ρ) | 2.5–5 × epi thickness |

## References

- **Charbon, Gharpurey, Miliozzi, Meyer, Sangiovanni-Vincentelli, *Substrate Noise: Analysis and Optimization for IC Design*** (Kluwer 2001; PDF page = printed + 23).
  - Ch. 1 (pp. 1–9): intrinsic vs switching noise, analysis approaches.
  - Ch. 2 (pp. 11–19): substrate types Fig. 2.2, injection Eqs. 2.1–2.5, Fig. 2.4, reception Eqs. 2.6–2.7, delay effect Eqs. 2.8–2.12.
  - Ch. 3 (pp. 21–31): continuity/Laplace formulation, BEM Eqs. 3.7–3.12, Green's function and DCT, FD/Krylov/multigrid.
  - Ch. 4 (pp. 33–44): noise signatures, SUBWAVE, multi-port sensitivities.
  - Ch. 5 (pp. 47–60): local noise generators, worst-case sensitivities, PLL case study (Tables 5.1–5.4, Figs. 5.3, 5.7, 5.9).
  - Ch. 6 (pp. 61–83): substrate-aware placement, Sherman–Morrison updates, template extraction, RAMDAC case study (Tables 6.1–6.4).
  - Ch. 7 (pp. 85–97): feedback, MSG Eq. 7.1, local shifts Eqs. 7.2–7.3, thermal noise, losses Eq. 7.4, spurious coupling list, ESD.
  - Ch. 8 (pp. 99–133): conduction Figs. 8.2–8.5, isolation Figs. 8.6–8.8 and Eq. 8.1, differential Figs. 8.9–8.10, load Fig. 8.11, guard rings Figs. 8.12–8.25 and Eq. 8.2, dual rings Table 8.1, buried shields Figs. 8.27–8.30.
  - App. D (pp. 147–159): DC and on-wafer measurements.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.**, §19.3 Substrate Coupling, pp. 760–763 (Figs. 19.53–19.59).
- **Hastings, *The Art of Analog Layout*, 3rd ed.** (PDF page = printed + 1): §5.4.3 Debiasing, pp. 258–261 (Eqs. 5.22–5.27, contact rules); §12 backgate contacts and backgate pinning, p. 618; §14.1 substrate coupling and noise-blocking guard rings, pp. 723–724.
