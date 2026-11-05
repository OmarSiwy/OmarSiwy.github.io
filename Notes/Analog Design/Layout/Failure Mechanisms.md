---
title: Failure Mechanisms
description: How a correctly drawn chip still dies or drifts in the field (oxide wear-out and antenna damage, corrosion and mobile ions, hot carriers, BTI, parasitic channels and charge spreading, minority-carrier injection) and the layout rule that stops each one.
kind: topic
status: growing
aliases:
  - Failure Mechanisms
  - Reliability
---

A chip that passes DRC, LVS and every simulation can still short its gate oxide after three years, drift 20 mV in offset after a month in a hot car, or leak microamps between two wells that nothing connects. This note goes through those failures one at a time: where on the die it happens (cross-section), why, and the layout rule that prevents it. First the whole map on one screen, then temperature (which speeds up all of them), then oxides, contamination, surface effects and minority-carrier injection.

## The big picture

```tikz title="Where a CMOS die fails. Numbered sites match the table below. Layer legend as in CMOS Processing. After Hastings Ch. 5 (Figs. 5.10, 5.12, 5.17, 5.27)."
\usepackage{circuitikz}
\usetikzlibrary{decorations.pathreplacing}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},
  mk/.style={circle,fill=red!75!black,text=white,inner sep=0.8pt,font=\scriptsize\bfseries}]
  \node[anchor=west,font=\bfseries] at (13.9,5.6) {Layer legend (whole Layout series)};
  \foreach \y/\s/\t in {5.1/psub/{p-substrate / p-epi},4.65/nwell/{n-well (top view: dashed outline)},4.2/ndiff/{n+ diffusion (NSD, active)},3.75/pdiff/{p+ diffusion (PSD, active)},3.3/sti/{STI / field oxide},2.85/poly/{polysilicon (gate)},2.4/sil/{silicide},1.95/cont/{contact / via (W plug)},1.5/mone/{metal 1},1.05/mtwo/{metal 2},0.6/diel/{deposited dielectric (PMD, IMD)},0.15/nit/{nitride (mask, overcoat, Cu cap)},-0.3/pr/{photoresist}} {
    \draw[\s] (14.0,\y-0.15) rectangle (14.5,\y+0.15);
    \node[anchor=west,font=\scriptsize] at (14.6,\y) {\t};
  }
  \draw[->,thick] (14.25,-0.55) -- (14.25,-0.85);
  \node[anchor=west,font=\scriptsize] at (14.6,-0.7) {implant / exposure};
  \node[mk] at (14.25,-1.25) {1};
  \node[anchor=west,font=\scriptsize] at (14.6,-1.25) {failure site (see table)};
  % silicon
  \draw[psub] (0,0.6) rectangle (12.2,2.6);
  \draw[diel] (0,2.6) rectangle (12.2,4.65);
  \draw[nwell] (6.6,2.6) -- (6.6,1.2) to[out=-90,in=180] (7.0,0.9) -- (11.8,0.9) to[out=0,in=-90] (12.2,1.3) -- (12.2,2.6);
  \foreach \a/\b in {0/0.4,3.6/4.2,5.4/7.4,10.2/10.8} {\draw[sti] (\a,2.6) -- (\a+0.05,2.1) -- (\b-0.05,2.1) -- (\b,2.6) -- cycle;}
  % NMOS
  \draw[ndiff] (0.4,2.6) rectangle (1.4,2.3);
  \draw[ndiff] (2.2,2.6) rectangle (3.6,2.3);
  \draw[poly] (1.45,2.63) rectangle (2.15,2.95);
  % pin diffusion
  \draw[ndiff] (4.2,2.6) rectangle (5.4,2.3);
  % PMOS
  \draw[pdiff] (7.4,2.6) rectangle (8.3,2.3);
  \draw[pdiff] (9.1,2.6) rectangle (10.2,2.3);
  \draw[poly] (8.35,2.63) rectangle (9.05,2.95);
  \draw[ndiff] (10.8,2.6) rectangle (11.8,2.3);
  % poly lead over field crossing the well edge
  \draw[poly] (5.6,2.63) rectangle (7.3,2.85);
  \draw[red,very thick,dashed] (6.5,2.05) -- (7.4,2.05);
  % contacts and metal
  \draw[cont] (1.7,2.95) rectangle (1.9,3.7);
  \draw[mone] (0.2,3.7) rectangle (3.4,3.95);
  \foreach \x in {4.7,7.75,9.55,11.2} {\draw[cont] (\x,2.6) rectangle (\x+0.2,3.7);}
  \draw[mone] (4.2,3.7) rectangle (5.5,3.95);
  \foreach \a/\b in {7.5/8.1,9.3/9.9,10.95/11.65} {\draw[mone] (\a,3.7) rectangle (\b,3.95);}
  \draw[cont] (4.75,3.95) rectangle (4.95,4.65);
  \draw[mtwo] (4.0,4.65) rectangle (5.8,4.92);
  \draw[nit] (0,4.65) -- (4.0,4.65) -- (4.0,4.92) -- (4.3,4.92) -- (4.3,5.2) -- (0,5.2) -- cycle;
  \draw[nit] (12.2,4.65) -- (5.8,4.65) -- (5.8,4.92) -- (5.5,4.92) -- (5.5,5.2) -- (12.2,5.2) -- cycle;
  % mobile ions
  \foreach \p in {(6.3,3.35),(7.1,3.2),(9.9,3.35),(10.9,3.25)} {\node[circle,draw,inner sep=0.2pt,font=\tiny] at \p {$+$};}
  % moisture into pad opening
  \draw[->,blue!70!black,thick] (4.5,5.75) -- (4.4,5.0);
  \node[font=\scriptsize,blue!70!black] at (4.5,5.95) {H$_2$O, Cl$^-$};
  % minority carriers from pin
  \draw[->,red!80!black,thick] (5.0,2.2) to[out=-90,in=180] (6.0,1.4) to[out=0,in=-135] (6.75,1.75);
  \foreach \p in {(5.2,1.75),(5.8,1.42)} {\node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at \p {$-$};}
  % hot spot at NMOS drain
  \node[star,star points=6,fill=yellow,draw=red,inner sep=1pt] at (2.2,2.45) {};
  % markers
  \node[mk] at (1.8,3.25) {1};
  \node[mk] at (3.85,5.5) {2};
  \node[mk] at (6.9,3.55) {3};
  \node[mk] at (2.55,2.0) {4};
  \node[mk] at (8.7,3.25) {5};
  \node[mk] at (6.95,1.75) {6};
  \node[mk] at (5.55,1.15) {7};
  % labels
  \node[font=\scriptsize] at (1.8,0.3) {NMOS};
  \node[font=\scriptsize] at (4.8,0.3) {pin diffusion};
  \node[font=\scriptsize] at (8.7,0.3) {PMOS in n-well};
  \node[font=\scriptsize] at (3.0,1.4) {p-substrate};
  \node[font=\scriptsize] at (9.6,1.4) {n-well};
  \node[font=\scriptsize,anchor=west] at (5.9,5.45) {bond pad (pin)};
  \node[font=\scriptsize] at (1.8,4.1) {large M1 on gate};
  \node[font=\scriptsize] at (10.4,5.45) {nitride overcoat};
\end{circuitikz}
\end{document}
```

| # | Site | Mechanism | What you see | Layout lever |
|---|---|---|---|---|
| 1 | gate oxide | TDDB, antenna (plasma) damage | short, or $V_{TH}$ shift from trapped charge | field limit, area derating, antenna ratios |
| 2 | pad / probe / fuse openings | dry corrosion | open metal | metal overlaps every opening, no extra openings |
| 3 | oxides | mobile ions (Na⁺) | $V_{TH}$ drifts under bias | closed test pads, scribe seal, fuses far away |
| 4 | NMOS drain edge | hot-carrier injection | $g_m$ and $V_{TH}$ drift | longer $L$, cascode, LDD/drain-extended |
| 5 | PMOS gate oxide | NBTI (PBTI in NMOS) | $\lvert V_{TH}\rvert$ grows | matched PMOS at equal $V_{GS}$ |
| 6 | field under a wire or static charge | parasitic channel, charge spreading | leakage between unconnected regions | field plate, channel stop, reroute, poly inside well |
| 7 | diffusion tied to a pin | minority-carrier injection | glitches, latch-up | series $R$, distance, then guard rings |

> [!important] The five results the rest of the note refines
> 1. **Temperature accelerates everything (Arrhenius).** $t_2 = t_1\exp\!\left[\frac{E_a}{k}\left(\frac1{T_2}-\frac1{T_1}\right)\right]$ with $E_a$ = 0.5 to 1.5 eV. Ratings assume 100,000 h at the maximum junction temperature (125 or 150 °C).
> 2. **Oxides wear out; they do not just snap.** Charge through the oxide creates traps until a percolation path shorts it (TDDB). Design to about 3.5 to 4.5 MV/cm, not the 11 MV/cm dielectric strength, and derate large areas. Plasma charge on conductors tied to a gate does the same damage during fabrication (antenna effect).
> 3. **Surface effects are slow, bias-driven parametric drifts** (hot carriers, NBTI, mobile ions, charge spreading). They stop when bias is removed and partly reverse in an unbiased bake. They hurt matched pairs most when the two devices see different bias.
> 4. **Any conductor or static charge over lightly doped silicon is a gate.** If its voltage exceeds the thick-field threshold, a parasitic MOSFET connects regions that the schematic never connected. Field plates, channel stops and rerouting break it.
> 5. **Diffusions connected to pins inject minority carriers.** Fix it at the source first: series resistance (≥10 kΩ, preferably 50 to 100 kΩ for low-current analog), distance, no merged Schottkys. Collecting what escapes (guard rings) and latch-up belong to [[Guard Rings, ESD and Interconnect]].

**Map:** [[#Level 0 How Chips Fail|catastrophic vs parametric, Arrhenius]] → [[#Level 1 Electrical Overstress of Dielectrics|tunnelling, TDDB, antenna damage]] → [[#Level 2 Contamination|corrosion, mobile ions, scribe seals]] → [[#Level 3 Surface Effects|hot carriers, BTI, parasitic channels, charge spreading, field plates]] → [[#Level 4 Minority-Carrier Injection|injection from pins and internal nodes, stopping it at the cause]].

> [!tip] Remark: what lives elsewhere
> Latch-up, majority/minority-carrier guard rings, debiasing and ESD protection are in [[Guard Rings, ESD and Interconnect]] (latch-up: [[Guard Rings, ESD and Interconnect#Latch-up]]). Electromigration is in [[Electromigration]]. Device-level hot-carrier physics is in [[MosFETs#Hot-Carrier Effects]]. Substrate noise coupling is in [[Substrate Noise]]. Package stress shifts are in [[Device Matching#Mechanical Stress and Package Shift]].

## Level 0: How Chips Fail

### Catastrophic vs Parametric

```tikz title="Two kinds of failure. Catastrophic: a parameter is fine until it isn't (oxide short, open line). Parametric: a parameter drifts under bias, stops when bias is removed, and partly recovers in an unbiased bake. After Hastings Secs. 5.1 and 5.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \begin{scope}
    \draw[->] (0,0) -- (5.6,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,3.2) node[above] {leakage};
    \draw[thick,blue!70!black] (0,0.3) .. controls (2.5,0.35) and (3.6,0.6) .. (4.2,1.1);
    \draw[thick,red!80!black] (4.2,1.1) -- (4.25,2.9);
    \node[font=\scriptsize,align=center] at (2.0,1.0) {traps build up\\(invisible)};
    \node[font=\scriptsize,anchor=west,red!80!black] at (4.3,2.7) {breakdown};
    \node[font=\scriptsize] at (2.8,-0.5) {(a) catastrophic: TDDB, corrosion, EM};
  \end{scope}
  \begin{scope}[xshift=7.6cm]
    \draw[->] (0,0) -- (6.2,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,3.2) node[above] {$|\Delta V_{TH}|$};
    \draw[thick,blue!70!black] (0,0) .. controls (0.6,1.4) and (1.6,1.9) .. (3.0,2.2);
    \draw[thick,blue!70!black] (3.0,2.2) -- (4.0,2.2);
    \draw[thick,green!50!black] (4.0,2.2) .. controls (4.3,1.2) and (4.8,0.9) .. (5.6,0.8);
    \draw[dashed] (3.0,0) -- (3.0,2.9); \draw[dashed] (4.0,0) -- (4.0,2.9);
    \node[font=\scriptsize] at (1.5,2.8) {under bias};
    \node[font=\scriptsize,align=center] at (3.5,2.75) {bias\\off};
    \node[font=\scriptsize,align=center] at (5.1,2.0) {unbiased\\bake};
    \node[font=\scriptsize] at (3.1,-0.5) {(b) parametric: HCI, BTI, mobile ions, charge spreading};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Catastrophic** failures leave a physical defect (pinhole, open, filament). Nothing warns the user.
- **Parametric** failures shift $V_{TH}$, $g_m$, $\beta$ or leakage. An unbiased bake (150 to 300 °C, minutes to hours) partly reverses them: the low end of that range undoes charge spreading, the high end partly undoes trap-induced shifts. The shift comes back as soon as bias does (Hastings §5.3).
- Electrostatic discharge, electromigration and latch-up are also failures of this kind but live in their own notes (see the Remark above).

### Temperature: Arrhenius and Junction Temperature

```tikz title="Arrhenius plot: log time-to-failure against 1/T is a straight line whose slope is E_a/k. A higher activation energy means a steeper line, so the same temperature step costs more life. After Hastings Eqs. 5.3-5.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw[->] (0,0) -- (7,0) node[right] {$1/T$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$\ln t_{50}$};
  \draw[thick,blue!70!black] (0.6,0.6) -- (6.4,3.0) node[right,font=\scriptsize] {$E_a=0.7$ eV};
  \draw[thick,red!80!black] (0.6,0.2) -- (6.4,4.1) node[right,font=\scriptsize] {$E_a=1.0$ eV};
  \draw[dashed] (3.2,0) -- (3.2,3.5); \draw[dashed] (4.4,0) -- (4.4,3.5);
  \node[font=\scriptsize,below] at (3.2,0) {150 °C};
  \node[font=\scriptsize,below] at (4.4,0) {125 °C};
  \node[font=\scriptsize,align=left,anchor=west] at (0.3,3.9) {hotter $\leftarrow$\quad slope $=E_a/k$};
\end{circuitikz}
\end{document}
```

$$
\boxed{t_{50} = A_{50}\,e^{E_a/kT},\qquad t_2 = t_1\exp\!\left[\frac{E_a}{k}\left(\frac1{T_2}-\frac1{T_1}\right)\right]},\qquad k = 8.62\times10^{-5}\ \text{eV/K}
$$

$$
\boxed{T_J = T_A + \theta_{JA}P_D}
$$

- $t_{50}$ is the median time to failure (half the sample dead). Each mechanism has its own $A_{50}$ and $E_a$; most have $E_a$ between 0.5 and 1.5 eV.
- **Example:** going from 125 °C to 150 °C shortens life by $e^{(0.7/8.62\times10^{-5})(1/398-1/423)} \approx 3.3\times$ at $E_a$ = 0.7 eV and about 5.6× at 1.0 eV.
- Ratings: a device runs at its maximum $T_J$ (125 or 150 °C) for its whole life, taken as 100,000 h (11.4 years). Thermal shutdown sits about 25 °C higher and is survivable only for perhaps 1,000 h.
- Small surface-mount packages without heatsinking have $\theta_{JA}$ over 150 °C/W, so they cannot dissipate more than a fraction of a watt.

> [!note]- Detail: leakage, going intrinsic, self-heating and filamentation (Hastings §§5.1.1-5.1.2)
> - **Leakage doubles about every 8 °C.** 1 nA at 125 °C becomes 1 µA at about 205 °C. Microamp-level analog circuits see parametric shifts above about 175 °C and functional failures above about 200 °C.
> - **Intrinsic temperature:** when thermal carriers outnumber dopant carriers, resistance collapses and current runs away. About 325 °C at $10^{15}$ cm⁻³, about 450 °C at $10^{16}$ cm⁻³. Heating an operating IC to 450 °C will probably destroy it.
> - **Local self-heating of a power device** ($L > W$, both much smaller than the ≈250 µm die thickness): $\Delta T = \dfrac{\ln(4L/W)}{\pi\kappa L}P_D$ with $\kappa_{Si}\approx 1.3$ W/(cm·°C). A 25 µm square dissipating 100 mW rises 14 °C.
> - **Deposited resistors and metal** sit on oxide, a poor heat conductor, and heat far more; their width is set by allowed $\Delta T$ (rules in [[Resistor]]). Pulses shorter than about 1 µs are adiabatic: only the resistor's own volume absorbs the energy.
> - **Filamentation:** a hot spot conducts more, heats more, and current contracts into a filament that melts. Two triggers: *thermal runaway* (the falling bipolar $V_{BE}$ lets a hot spot hog current; the MOS version is the Spirito effect, via the negative tempco of $V_{TH}$), tens to hundreds of µs; and *avalanche runaway* (velocity saturation, then avalanche injection at the anode), a few ns, fast enough for ESD. The cure for both is **ballasting**: series resistance that gives negative feedback. Silicided MOS drains lose their built-in ballast, which is why ESD devices need silicide block ([[Guard Rings, ESD and Interconnect]]).

## Level 1: Electrical Overstress of Dielectrics

### Tunnelling and Trap Formation

```tikz title="Three ways an electron crosses gate oxide. (a) Direct tunnelling: thin oxide (15-20 Å), no damage. (b) Trap-assisted: hops via a trap, about 30 Å. (c) Fowler-Nordheim: tunnels part way into a high field, then drifts and ionizes, creating new traps. After Hastings Fig. 5.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40}]
  \foreach \i/\w/\t in {0/1.2/{(a) direct},1/2.2/{(b) trap-assisted},2/3.2/{(c) Fowler-Nordheim}} {
    \begin{scope}[xshift=\i*5.0cm]
      \draw[psub] (0,0) rectangle (0.8,2);
      \draw[diel] (0.8,0) rectangle (0.8+\w,2);
      \draw[poly] (0.8+\w,0) rectangle (1.6+\w,2);
      \node[font=\scriptsize] at (0.4,-0.3) {Si};
      \node[font=\scriptsize] at (0.8+\w/2,-0.3) {oxide};
      \node[font=\scriptsize] at (1.2+\w,-0.3) {gate};
      \node[font=\scriptsize] at (1.2,-0.8) {\t};
      \node[circle,draw,fill=white,inner sep=0.3pt,font=\tiny] at (0.4,1) {$-$};
    \end{scope}
  }
  \draw[->,dashed] (0.6,1) -- (2.3,1);
  \draw[->,dashed] (5.6,1) -- (6.85,1);
  \fill (6.9,1) circle (0.08) node[above,font=\scriptsize] {trap};
  \draw[->,dashed] (6.95,1) -- (8.3,1);
  \draw[->,dashed] (10.6,1) -- (11.6,1);
  \node[star,star points=7,fill=yellow,draw=red,inner sep=1.2pt] at (11.7,1) {};
  \draw[->,thick,decorate,decoration={zigzag,amplitude=1pt,segment length=4pt}] (11.85,1) -- (13.95,1.1);
  \node[font=\scriptsize,align=center] at (12.4,1.65) {drift,\\ionize};
  \draw[<-,thick] (10.9,2.35) -- (13.0,2.35) node[right,font=\scriptsize] {$E$};
\end{circuitikz}
\end{document}
```

- **Direct tunnelling** through 15 to 20 Å oxide carries currents comparable to logic switching currents, but does no damage: the electron never localizes inside the oxide.
- **Trap-assisted tunnelling** needs traps. Dry (thermal) oxides have few; deposited and wet oxides have many. Enough aligned traps form a **percolation path** across the oxide.
- **Fowler-Nordheim** tunnelling in a high field generates new traps (anode hole injection: a hole steals an electron from a strained Si-O bond). Traps align, leakage appears and grows exponentially with injected charge, current localizes, and a pinhole melts through. That is **time-dependent dielectric breakdown (TDDB)**.
- Oxide breakdown needs a *charge to breakdown* $Q_{BD}$ (∝ gate area), not just a field. Damage accumulates, which is why an ESD strike can leave a "walking wounded" part that fails months later.

### TDDB: Field, Area and Lifetime

```tikz title="Median life against oxide field for the two competing models (schematic). Both are fitted to the same high-field data; they disagree most at the low fields you actually operate at. Design stays in the shaded band, far below the ~11 MV/cm dielectric strength. After Hastings Eqs. 5.14-5.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \fill[green!15] (2.6,0) rectangle (3.4,4.2);
  \draw[->] (0,0) -- (8,0) node[right] {$E_{ox}$ (MV/cm)};
  \draw[->] (0,0) -- (0,4.6) node[above] {$\ln t_{50}$};
  \draw[thick,red!80!black,domain=1.5:7.3,samples=40] plot (\x,{4.2*(1.5/\x)^1.2 - 0.1});
  \draw[thick,blue!70!black] (1.5,3.6) -- (7.3,0.5);
  \node[font=\scriptsize,red!80!black,anchor=west] at (1.6,4.1) {AHI, $1/E$ model};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (5.0,1.9) {McPherson, $E$ model};
  \fill (7.3,0.5) circle (0.06);
  \node[font=\scriptsize,align=center] at (7.3,0.95) {stress data};
  \node[font=\scriptsize,align=center] at (3.0,-0.45) {3.5--4.5};
  \node[font=\scriptsize] at (7.3,-0.45) {$\approx$11};
\end{circuitikz}
\end{document}
```

$$
\boxed{t_{50} = \tau e^{G/E}\ \ (\text{AHI},\ G\approx350\ \text{MV/cm}),\qquad t_{50}=\tau e^{-\gamma E}\ \ (\text{McPherson},\ \gamma\approx2.5\text{--}3.5\ \text{cm/MV}),\qquad V = E\,t_{ox}}
$$

$$
\boxed{t_2 = t_1\left(\frac{A_1}{A_2}\right)^{1/\beta}},\qquad \beta\approx 2\ \text{(Weibull slope)}
$$

- **Usual maximum stress** for 100,000 h at 125 °C: 3.5 to 4 MV/cm for 300 to 500 Å dry oxide, 4 to 4.5 MV/cm for thinner oxides. Thicker dielectrics are, surprisingly, somewhat *more* fragile.
- **Area costs life:** 100× the oxide area at the same field has $1/\sqrt{100} = 1/10$ the life. A large capacitor must run at a lower field than a small transistor.
- The two models disagree wildly at low field: raising $E$ from 4 to 5 MV/cm cuts life by $e^{350(1/5-1/4)} \approx 2.5\times10^{-8}$ under AHI but only $e^{-3}\approx 0.05$ under McPherson (γ = 3). Use the model your fab qualified.

**Layout rules for dielectrics**
1. Keep every gate and capacitor dielectric below the process's rated field, with margin; derate large-area capacitors by the area formula.
2. Do not use oxide grown over deep-N+ as a capacitor dielectric.
3. Do not put high voltage on poly over STI; LOCOS field oxide under poly withstands much more.
4. Where the process asks for it, place deep-N+ or NBL getter strips within about 100 µm of gate oxides.
5. Fix every antenna violation (next section).

> [!note]- Why: the reasoning behind each dielectric rule (Hastings §5.1.4)
> 1. Fields crowd at conductor edges and oxides have thin spots; the 3.5 to 4.5 MV/cm limit already includes that margin. Scaling to another area or field at constant life: AHI $E_2 = 1/\left[1/E_1 + \ln(A_2/A_1)/(\beta G)\right]$, McPherson $E_2 = E_1 + \ln(A_1/A_2)/(\beta\gamma)$. Example, 100× area from 4 MV/cm: AHI allows 3.90 MV/cm, McPherson only 3.23. Shorter duty lets a dielectric run higher: $t_2 = t_1e^{G(1/E_2-1/E_1)}$ (AHI) or $t_2=t_1e^{\gamma(E_1-E_2)}$.
> 2. Deep-N+ getters heavy metals, so oxide grown over it collects them, and the heavy doping strains the lattice into dislocations: poorer oxide integrity.
> 3. A particle in an STI trench etch masks the silicon and leaves a **cone defect** of silicon protruding from the trench bottom. Field oxide under poly is then much weaker than its thickness suggests (metal is less exposed because of the extra multilevel oxide). LOCOS has no cone defects.
> 4. Oxygen precipitates in Czochralski wafers and heavily doped N+ regions **getter** heavy metal atoms that would otherwise make weak spots; maximum effective distance about 100 µm. Some dielectric-isolated processes add deep-N+ strips for this alone.
> 5. Fabs screen gate-oxide integrity with **overvoltage stress testing** (OVST): up to twice the operating voltage for about 100 ms; one failing die scraps the wafer, several scrap the lot. It works even if many gates are inaccessible, as long as a good fraction see the stress.

### Antenna Damage

```tikz title="Plasma-induced damage in cross-section. (a) Late in the metal-1 etch the plate is an island tied to a gate; plasma charge lands on its exposed edges (perimeter) and must leave through the thin gate oxide. (b) During resist ashing the whole top surface collects charge (area). Either way the injected charge leaves traps and a V_TH shift, or breaks the oxide. After Hastings Sec. 5.1.6 and Razavi Fig. 19.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) metal-1 etch: charge on the perimeter},1/{(b) ashing: charge on the whole area}} {
    \begin{scope}[xshift=\i*8.2cm]
      \draw[psub] (0,0) rectangle (7.4,1.6);
      \draw[sti] (0,1.6) -- (0.05,1.1) -- (0.75,1.1) -- (0.8,1.6) -- cycle;
      \draw[ndiff] (0.8,1.6) rectangle (1.5,1.3);
      \draw[ndiff] (2.3,1.6) rectangle (3.0,1.3);
      \draw[sti] (3.0,1.6) -- (3.05,1.1) -- (7.35,1.1) -- (7.4,1.6) -- cycle;
      \draw[diel] (0,1.6) rectangle (7.4,2.7);
      \draw[fill=gray!35,draw=black!60] (1.55,1.6) rectangle (2.25,1.74);
      \draw[poly] (1.55,1.74) rectangle (2.25,2.04);
      \draw[cont] (1.8,2.04) rectangle (2.0,2.7);
      \draw[mone] (1.4,2.7) rectangle (6.8,3.0);
      \node[font=\scriptsize] at (3.7,-0.35) {\t};
      \node[font=\scriptsize] at (1.9,1.0) {thin gate oxide};
      \node[font=\scriptsize] at (5.2,1.35) {field (no gate oxide)};
      \draw[->,red!80!black,thick] (2.12,2.65) -- (2.12,2.1);
      \draw[->,red!80!black,thick] (1.9,1.58) -- (1.9,1.38);
      \foreach \x in {1.65,1.8,2.0,2.15} {\node[red!80!black,font=\tiny] at (\x,1.67) {$\times$};}
    \end{scope}
  }
  % (a) resist still on top, charge on edges
  \draw[pr] (1.4,3.0) rectangle (6.8,3.3);
  \foreach \y in {2.75,2.95,3.15} {\node[red!80!black,font=\scriptsize] at (1.25,\y) {$+$}; \node[red!80!black,font=\scriptsize] at (6.95,\y) {$+$};}
  \foreach \x in {1.8,3.0,4.2,5.4,6.6} {\draw[->,gray] (\x,4.1) -- (\x,3.4);}
  \node[font=\scriptsize,gray] at (4.1,4.3) {plasma};
  \node[font=\scriptsize] at (4.1,3.15) {resist};
  % (b) whole top surface
  \foreach \x in {9.8,10.4,11.0,11.6,12.2,12.8,13.4,14.0,14.6} {\node[red!80!black,font=\scriptsize] at (\x,3.15) {$+$};}
  \foreach \x in {10.0,11.4,12.8,14.2} {\draw[->,gray] (\x,4.1) -- (\x,3.35);}
  \node[font=\scriptsize,gray] at (12.3,4.3) {O$_2$ plasma (resist strip)};
  \node[font=\scriptsize,red!80!black,align=left,anchor=west] at (2.4,2.3) {charge through\\gate oxide: traps};
\end{circuitikz}
\end{document}
```

- Early in an etch the layer is one continuous sheet and local charge fluctuations cancel. Damage happens **late**, when the layer has separated into islands: each island collects charge in proportion to its exposed perimeter (etch) or area (ashing) and dumps it into whatever thin oxide sits under the gates on its node.
- Below breakdown the injected charge still raises fixed oxide charge, so it shifts $V_{TH}$: a matching problem, not just a yield one.

> [!tip] Remark
> The rule that stops it is a ratio per node per layer, $AR_{\text{periph}} = P_X/A_{gate}$ (poly ≈ 100 µm⁻¹) and $AR_{\text{area}} = A_X/A_{gate}$ (poly ≈ 500), fixed by a jumper up a layer or an antenna diode. The ratios, the drawn fixes, why the PSD diode relies on plasma UV light, and how DRC decks check them are owned by [[Layout Fundamentals#Antenna rules]]. This section only owns the damage mechanism.

> [!note]- Detail: what is still argued about (Hastings §5.1.6)
> - The source of the charge is debated: the plasma is neutral on average, but local fluctuations, AC excitation separating light and heavy particles, and **electron shading** (dense geometry blocks the isotropic electron flux more than the directional ion flux) all deposit charge.
> - **Latent antenna effect:** minimum-spaced geometries clear last, so a group of them stays connected after wider spacings have opened, and acts as one big antenna even though they end up on different nodes. Decks model this with oversize/undersize operations.
> - P+ poly gates appear more susceptible, perhaps from boron-generated oxide defects; PMOS and NMOS oxides differ.

## Level 2: Contamination

### Dry Corrosion and Overcoat Openings

```tikz title="Bond pad in cross-section. Bad: the protective-overcoat (PO) opening runs past the pad edge, exposing interlevel oxide; moisture and chloride reach metal-1 and the oxide. Good: metal overlaps the opening on every side by more than the misalignment, so only the pad metal is exposed. After Hastings Sec. 5.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) bad: opening overhangs the pad},1/{(b) good: metal overlaps the opening}} {
    \begin{scope}[xshift=\i*7.8cm]
      \draw[psub] (0,0) rectangle (7,0.8);
      \draw[sti] (0,0.8) rectangle (7,1.2);
      \draw[diel] (0,1.2) rectangle (7,2.6);
      \draw[mone] (0.4,1.6) rectangle (2.0,1.85);
      \node[font=\scriptsize] at (3.5,-0.35) {\t};
    \end{scope}
  }
  % bad: pad 2.0-5.0, opening 1.6-5.4
  \draw[mtwo] (2.0,2.6) rectangle (5.0,2.9);
  \draw[nit] (0,2.6) -- (1.6,2.6) -- (1.6,3.2) -- (0,3.2) -- cycle;
  \draw[nit] (5.4,2.6) rectangle (7,3.2);
  \fill[white] (1.6,2.45) rectangle (2.0,2.6);
  \draw[black!40] (1.6,2.45) -- (2.0,2.45);
  \foreach \x in {1.45,5.55} {\draw[->,blue!70!black,thick] (\x+0.2,4.0) -- (\x+0.2,2.55);}
  \draw[->,blue!70!black,thick] (1.8,2.5) -- (1.4,1.9);
  \node[font=\scriptsize,blue!70!black] at (1.8,4.25) {H$_2$O, Cl$^-$, Na$^+$};
  \node[font=\scriptsize,red!80!black,align=center] at (0.9,1.0) {};
  \node[font=\scriptsize,red!80!black,anchor=west] at (2.2,2.0) {exposed oxide};
  \node[font=\scriptsize] at (3.5,3.1) {M2 pad};
  % good: pad 1.6-5.4 (+7.8), opening 2.2-4.8
  \begin{scope}[xshift=7.8cm]
    \draw[mtwo] (1.4,2.6) rectangle (5.6,2.9);
    \draw[nit] (0,2.6) -- (1.4,2.6) -- (1.4,2.9) -- (2.2,2.9) -- (2.2,3.2) -- (0,3.2) -- cycle;
    \draw[nit] (7,2.6) -- (5.6,2.6) -- (5.6,2.9) -- (4.8,2.9) -- (4.8,3.2) -- (7,3.2) -- cycle;
    \draw[<->] (1.4,3.45) -- (2.2,3.45) node[midway,above,font=\scriptsize] {overlap};
    \node[font=\scriptsize] at (3.5,3.1) {M2 pad};
    \node[font=\scriptsize] at (6.2,3.45) {overcoat};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Aluminium is protected by its own dense oxide; **dry corrosion** starts when something removes it: phosphoric acid from moist phosphosilicate glass (> about 5% P), chloride (salt), or bromide from old flame-retardant mold compounds. Copper corrodes with moisture and oxygen.
- Every opening in the protective overcoat (PO) (bond pads, probe pads, fuses, the die edge) is a path in for moisture and ions. Mold compound slows them but no plastic stops them.

**Layout rules for corrosion**
1. Make no PO opening that the product does not need.
2. Overlap metal past every pad opening on all sides by more than the PO-to-metal misalignment.
3. Put test pads on a separate test PO layer, and close them with a production PO mask when the part is released.
4. Keep fuse openings as small as possible, with nothing but the fuse in or next to them.
5. With copper bond wire, prefer palladium-coated copper (fine wires lose a larger fraction of their section to the same corrosion depth).

### Mobile Ions

```tikz title="Mobile sodium in a gate oxide. (a) No bias: Na+ and immobile negative counter-charges spread through the oxide; net zero. (b) Positive gate bias drifts the Na+ to the silicon interface, leaving the negatives behind; positive charge near the channel lowers an NMOS threshold. The shift reverses in an unbiased bake and returns with bias. After Hastings Fig. 5.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40}]
  \foreach \i/\v/\t in {0/{0 V}/{(a) unbiased},1/{+V}/{(b) gate positive}} {
    \begin{scope}[xshift=\i*6.4cm]
      \draw[poly] (0,2.6) rectangle (4,2.9);
      \draw[diel] (0,0.8) rectangle (4,2.6);
      \draw[psub] (0,0) rectangle (4,0.8);
      \node[font=\scriptsize] at (2,3.15) {gate $=\v$};
      \node[font=\scriptsize] at (2,0.35) {p-silicon (backgate)};
      \node[font=\scriptsize] at (2,-0.35) {\t};
    \end{scope}
  }
  \foreach \p in {(0.6,2.2),(1.6,1.3),(2.6,2.0),(3.4,1.1),(1.1,1.0)} {\node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at \p {$+$};}
  \foreach \p in {(1.0,1.8),(2.1,2.3),(2.2,1.2),(3.2,2.2),(3.6,1.7)} {\node[circle,draw,fill=gray!40,inner sep=0.2pt,font=\tiny] at \p {$-$};}
  \begin{scope}[xshift=6.4cm]
    \foreach \x in {0.5,1.2,1.9,2.6,3.3} {\node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at (\x,0.97) {$+$};}
    \foreach \p in {(1.0,1.8),(2.1,2.3),(2.2,1.6),(3.2,2.2),(3.6,1.7)} {\node[circle,draw,fill=gray!40,inner sep=0.2pt,font=\tiny] at \p {$-$};}
    \draw[->,thick,red!80!black] (4.3,2.3) -- (4.3,1.0);
    \node[font=\scriptsize,anchor=west,red!80!black,align=left] at (4.4,1.6) {Na$^+$ drifts\\$\Delta V_{TH}<0$};
  \end{scope}
  \node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at (4.6,2.6) {$+$};
  \node[font=\scriptsize,anchor=west] at (4.8,2.6) {mobile Na$^+$};
  \node[circle,draw,fill=gray!40,inner sep=0.2pt,font=\tiny] at (4.6,2.15) {$-$};
  \node[font=\scriptsize,anchor=west] at (4.8,2.15) {immobile};
\end{circuitikz}
\end{document}
```

- Lithium, sodium and potassium (and hydrogen) are mobile in oxide at room temperature; sodium is the one found everywhere. The shift can be complete in under a second when hot or take hours at room temperature.
- Fabs now hold mobile-ion shifts under about 1 mV (phosphorus-doped poly gates and chlorine oxidation getter the sodium). What remains is sodium that **seeps in later** through the package, which only the overcoat and the layout of its openings can stop. Nitride overcoat blocks ions; phosphorus glass immobilizes them.

**Layout rules for mobile ions**
1. Every PO opening is an entry point: same opening rules as for corrosion (metal overlap, close test pads in production).
2. Place fuses and their PO openings well away from sensitive analog circuitry, above all matched MOS transistors.
3. Surround the die with a continuous **scribe seal** (next section).

### Scribe Seals

```tikz title="Scribe seal for a two-metal CMOS die, cut through the die edge. Three barriers stop ions and moisture moving sideways through the oxides: the overcoat flapped down onto bare silicon, a continuous contact ring, and a continuous via ring. The PSD under the contact ring makes it a substrate contact as well. After Hastings Fig. 5.11B."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (10,1.6);
  \draw[sti] (3.0,1.6) -- (3.05,1.2) -- (4.15,1.2) -- (4.2,1.6) -- cycle;
  \draw[sti] (5.6,1.6) -- (5.65,1.2) -- (9.95,1.2) -- (10,1.6) -- cycle;
  \draw[pdiff] (4.2,1.6) rectangle (5.6,1.3);
  \draw[diel] (3.0,1.6) rectangle (10,3.4);
  \draw[cont] (4.8,1.6) rectangle (5.0,2.4);
  \draw[mone] (4.3,2.4) rectangle (7.5,2.65);
  \draw[cont] (4.8,2.65) rectangle (5.0,3.15);
  \draw[mtwo] (4.3,3.15) rectangle (6.0,3.4);
  \draw[nit] (2.2,1.6) -- (3.0,1.6) -- (3.0,3.4) -- (4.3,3.4) -- (4.3,3.4) -- (10,3.4) -- (10,3.7) -- (2.8,3.7) -- (2.2,1.9) -- cycle;
  \draw[dashed] (2.2,0) -- (2.2,4.6); \draw[dashed] (6.2,0) -- (6.2,4.6);
  \node[font=\scriptsize] at (1.1,4.3) {scribe street};
  \node[font=\scriptsize] at (4.2,4.3) {scribe seal};
  \node[font=\scriptsize] at (8.1,4.3) {active die $\rightarrow$};
  \node[font=\scriptsize] at (1.1,0.8) {p-epi};
  \draw[->,blue!70!black,thick] (0.6,2.4) -- (2.3,2.4);
  \node[font=\scriptsize,blue!70!black] at (1.1,2.7) {ions, H$_2$O};
  \draw[->,blue!70!black,thick] (3.1,2.9) -- (4.6,2.9);
  \node[font=\scriptsize,red!80!black] at (4.5,2.0) {$\times$};
  \node[font=\scriptsize,anchor=west] at (7.6,2.5) {metal-1 ring};
  \node[font=\scriptsize,anchor=west] at (6.1,3.1) {via ring + M2};
  \node[font=\scriptsize] at (4.3,0.95) {PSD: substrate contact};
  \node[font=\scriptsize,anchor=west] at (2.5,4.0) {overcoat flap};
\end{circuitikz}
\end{document}
```

**Layout rules for scribe seals**
1. A continuous contact ring around the die, with no gaps (it blocks lateral diffusion of ions through the field oxide).
2. A continuous via ring between every pair of adjacent metal layers (it blocks the interlevel oxides); stack contacts and vias if the rules allow.
3. Extend the protective overcoat into the scribe street over bare silicon (flap-down).
4. Put the substrate diffusion (PSD in CMOS) and metal on the contact ring so it doubles as the die's substrate-ground ring.
5. Round the corners of isolation seal rings in dielectric-isolated processes (they stop delamination, which starts at stressed corners).

> [!note]- Why: scribe-street details (Hastings §5.2.2)
> - Older processes left bare silicon in the scribe street because metal fouled the saw and oxides cracked. Modern ones omit contact and via openings over the street but usually keep a PO opening there, because thick overcoat cracks and delaminates when sawn.
> - Nitride or oxynitride overcoat normally must not touch bare silicon (stress spawns defects); the scribe-seal flap-down is an explicit exception because it is far from active devices.
> - In dielectric-isolated processes the deep-trench rings in the seal are there to stop the buried oxide from delaminating from the top silicon (wafer bonding is not a perfect bond), not to stop ions.

### Package Stress Shifts

Plastic packages squeeze the die and shift resistor values, $\beta$ and MOS mobility; the shift drifts with time, temperature and moisture.

> [!tip] Remark
> This belongs to matching: where to put devices on the die, orientation, piezo coefficients and the drift mechanisms are in [[Device Matching#Mechanical Stress and Package Shift]]; package construction is in [[Packaging]].

## Level 3: Surface Effects

Every mechanism here lives at an interface (silicon/oxide, oxide/overcoat, overcoat/plastic) and moves charge or creates traps there. All are slow, bias-driven and partly reversible.

### Hot-Carrier Injection

```tikz title="Channel hot-carrier injection in a saturated NMOS. The pinched-off region near the drain holds most of V_DS; electrons there gain enough energy to impact-ionize. Holes leave through the backgate (I_sub, easy to measure); a few 'lucky' electrons reach the gate oxide, break Si-H bonds and get trapped near the drain: V_TH and g_m drift. After Hastings Fig. 5.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (10,3);
  \draw[dashed,thick] (6.0,3) -- (6.0,2.2) to[out=-90,in=180] (7.4,1.3) -- (9.0,1.3) to[out=0,in=-90] (9.4,1.8) -- (9.4,3);
  \draw[ndiff] (0.6,3) -- (0.6,2.5) to[out=-90,in=180] (1.0,2.2) -- (2.6,2.2) to[out=0,in=-90] (3.0,2.6) -- (3.0,3) -- cycle;
  \draw[ndiff] (6.6,3) -- (6.6,2.6) to[out=-90,in=180] (7.0,2.2) -- (8.6,2.2) to[out=0,in=-90] (9.0,2.5) -- (9.0,3) -- cycle;
  \fill[green!25] (3.0,3) -- (3.0,2.88) -- (6.6,2.97) -- (6.6,3) -- cycle;
  \draw[diel] (2.9,3) rectangle (6.7,3.12);
  \draw[poly] (2.9,3.12) rectangle (6.7,3.5);
  \node[font=\scriptsize] at (4.8,3.75) {gate};
  \node[font=\scriptsize] at (1.8,2.6) {source};
  \node[font=\scriptsize] at (7.8,2.6) {drain};
  \node[font=\scriptsize] at (4.2,2.6) {channel};
  \node[font=\scriptsize] at (7.9,1.6) {depletion};
  \node[font=\scriptsize] at (2.0,0.4) {p-substrate (backgate)};
  \draw[->,thick] (3.4,2.95) -- (6.2,2.85);
  \node[star,star points=7,fill=yellow,draw=red,inner sep=1.4pt] at (6.35,2.8) {};
  \draw[->,thick,red!80!black] (6.35,2.7) to[out=-100,in=60] (5.7,0.5);
  \node[font=\scriptsize,red!80!black,anchor=east] at (5.6,0.6) {holes $\to I_{sub}$};
  \draw[->,thick,blue!70!black] (6.45,2.9) to[out=70,in=-90] (6.5,3.06);
  \foreach \x in {6.2,6.38,6.55} {\node[blue!70!black,font=\tiny] at (\x,3.06) {$\times$};}
  \draw[->] (8.0,4.1) node[right,font=\scriptsize,align=left] {lucky electrons trapped\\in oxide at the drain end} -- (6.5,3.15);
  \node[font=\scriptsize,anchor=west,align=left] at (2.2,1.75) {impact ionization\\at peak field};
  \draw[->] (4.1,1.9) -- (6.2,2.72);
\end{circuitikz}
\end{document}
```

- An electron needs about 3.1 eV to cross the Si/SiO₂ barrier (a hole about 4.8 eV); thermal carriers average only $\tfrac32kT\approx$ 39 meV at 25 °C. Only field-heated (hot) carriers get in.
- Gate current is 3 to 5 orders of magnitude below the substrate current, so $I_{sub}$ is the usual monitor. Gate current peaks near $V_{GS}\approx 0.4V_{DS}$.
- **NMOS is worse than PMOS** (electrons are more mobile). Damage is mostly *dehydrogenation*: hot carriers break the Si-H bonds that passivate dangling bonds at the interface. $V_{TH}$ often first moves down, then up by tens to hundreds of mV; NMOS $g_m$ drops, most visibly in triode.
- Hot carriers only appear above a critical $V_{DS}$; below about 1 V supply they largely vanish ([[MosFETs#Hot-Carrier Effects]]).

**Layout and circuit rules for hot carriers**
1. Keep $V_{DS}$ inside the process's hot-carrier rating (the "operating" voltage, below the breakdown or "blocking" voltage).
2. Matched pairs (comparator inputs especially) must see the same $V_{DS}$ and $V_{GS}$ history: cascode them so drain voltages stay equal.
3. Lengthen high-$V_{DS}$ devices: 0.5 to 2 µm extra $L$ buys a few volts of margin.
4. Above the rating use drain-engineered devices: LDD/DDD or drain-extended MOS.

> [!tip] Remark
> LDD and the drain-extended MOS are built in [[CMOS Processing#Spacers and Lightly Doped Drain]] and [[CMOS Processing#High Voltage from Standard Masks Drain-Extended MOS]]. Both lower the peak field by letting the depletion region spread into a lightly doped drain instead of the channel.

> [!note]- Why: each hot-carrier rule (Hastings §5.3.1)
> 1. Fabs measure degradation (e.g. time to 10% loss of triode $g_m$, or a 10 mV $V_{TH}$ shift) over a grid of $V_{DS}$ and $V_{GS}$ and publish contours of allowed duty cycle for a 100 kh life (Hastings Fig. 5.13: 100% allowed below roughly 15 V in that process, shrinking to 10%, 1%, 0.1% islands at high $V_{DS}$, mid $V_{GS}$).
> 2. Unequal bias means unequal shift, which is a growing input offset.
> 3. Damage is confined near the drain, so its share of the whole channel falls as $L$ grows. Lower backgate doping near the drain also helps but worsens channel-length modulation unless it is local (RESURF).
> 4. Lighter drain doping moves the depletion into the drain without touching the channel doping. Annealing in deuterium instead of hydrogen cuts the degradation rate by 10× or more (giant isotope effect), a process option, not a layout one.
> - Another form, drain-avalanche hot-carrier (DAHC) injection, appears when the drain is in avalanche (EPROMs use it), and adds to channel hot carriers.

> [!note]- Detail: the bipolar cousins, Zener walkout and beta degradation (Hastings §§5.3.2-5.3.3)
> - **Zener walkout:** a surface base-emitter Zener (≈6.8 V in standard bipolar) avalanches near the surface; hot holes are trapped in the oxide, the positive charge widens the depletion region at the surface, and the breakdown voltage rises by several hundred mV and saturates. BiCMOS NSD/DWell Zeners walk *out* 200 to 300 mV and then *back* 300 to 500 mV (hydrogen released by the hot carriers compensates boron). Cure: **buried Zeners** that break down a micron or more below the surface; an emitter field plate (metal-1 tied to the emitter, extended several µm past the junction) is still recommended against charge spreading.
> - **Avalanche-induced β degradation:** avalanching a base-emitter junction creates interface traps over the emitter-base depletion region that act as recombination centres; low-current β suffers most (a discrete NPN lost about 80% at low current, 12% at high). Poly-emitter devices are more susceptible. Rule: never run a base-emitter junction beyond about 75% of $V_{EBO}$, and do not connect base-emitter junctions to pins without ESD clamps ([[BJTs]]).

### Bias-Temperature Instability (NBTI, PBTI)

```tikz title="NBTI in a PMOS. With the gate negative relative to source and well, holes are pulled to the interface and, helped by heat, break Si-H bonds. The broken bonds hold positive charge, so V_TH moves more negative and g_m falls. Part of the shift recovers within seconds of removing bias (right, schematic). After Hastings Sec. 5.3.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[nwell,solid] (0,0) rectangle (7,2.6);
  \draw[pdiff] (0.5,2.6) rectangle (2.0,2.2);
  \draw[pdiff] (5.0,2.6) rectangle (6.5,2.2);
  \draw[diel] (1.9,2.6) rectangle (5.1,2.75);
  \draw[poly] (1.9,2.75) rectangle (5.1,3.1);
  \node[font=\scriptsize] at (3.5,3.35) {gate: $V_G < V_S$, hot};
  \node[font=\scriptsize] at (1.25,1.9) {S};
  \node[font=\scriptsize] at (5.75,1.9) {D};
  \node[font=\scriptsize] at (3.5,0.4) {n-well (backgate, at $V_S$)};
  \foreach \x in {2.3,2.9,3.5,4.1,4.7} {\node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at (\x,2.42) {$+$}; \node[red!80!black,font=\scriptsize] at (\x,2.68) {$+$};}
  \node[font=\scriptsize,anchor=west] at (7.2,2.68) {broken Si--H: positive interface charge};
  \node[font=\scriptsize,anchor=west] at (7.2,2.35) {holes drawn to the surface};
  \draw[->] (7.15,2.68) -- (5.0,2.68);
  \begin{scope}[xshift=7.8cm,yshift=-1.4cm]
    \draw[->] (0,0) -- (5,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,1.9) node[above] {$|\Delta V_{TH}|$};
    \draw[thick,blue!70!black] (0,0) .. controls (0.5,1.0) and (1.5,1.4) .. (2.6,1.5);
    \draw[thick,green!50!black] (2.6,1.5) -- (2.7,0.9) .. controls (3.2,0.75) and (4,0.7) .. (4.7,0.68);
    \draw[dashed] (2.6,0) -- (2.6,1.8);
    \node[font=\scriptsize] at (1.3,-0.3) {stress};
    \node[font=\scriptsize] at (3.7,-0.3) {bias removed};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **NBTI**: PMOS, gate negative with respect to source and backgate, accelerated by temperature. $V_{TH}$ goes more negative, $g_m$ falls. NMOS also shows a smaller BTI shift.
- **PBTI**: mainly NMOS with high-k dielectrics at positive gate bias (electron trapping); small shifts also in poly-gate PMOS with positive gate bias.
- Thin oxides, higher oxide fields, surface-channel PMOS (dual-doped poly) and oxynitride dielectrics all made NBTI worse in modern processes.
- **Recovery:** part of the shift vanishes within seconds of removing bias, even at 25 °C, so AC stress causes less shift than DC.

**Layout and circuit rules for BTI**
1. Find matched PMOS pairs that sit at **different** $V_{GS}$ for long periods (comparator inputs, offset-sensitive pairs that idle unbalanced); the larger the $V_{GS}$ difference, temperature and time, the larger the induced mismatch.
2. Re-bias them so both see the same stress, or change the circuit to remove the condition; simulate with BTI-aware models where available.
3. Layout cannot fix BTI; the process can (fluorine in the gate oxide helps; deuterium anneal helps only slightly).

### Parasitic Channels

```tikz title="A poly gate lead leaving the n-well is the gate of a parasitic thick-field PMOS: source = the PSD, backgate = the n-well under the field, drain = the p-epi outside. (a) Bad: the gate contact head sits outside the well. (b) Good: pull the poly and its contact inside the well; the channel then has no drain. (c) Cross-section along the lead in (a). After Hastings Figs. 5.17C and 5.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  % (a) bad top view
  \fill[orange!12] (-0.3,-0.3) rectangle (4.6,6.0);
  \draw[nwell] (0,0) rectangle (4.3,4.6);
  \draw[pdiff] (0.8,0.8) rectangle (3.0,3.4);
  \draw[ndiff] (3.3,0.8) rectangle (3.8,3.4);
  \draw[poly] (1.7,0.5) rectangle (2.1,5.3);
  \draw[poly] (1.5,5.0) rectangle (2.3,5.7);
  \draw[cont] (1.8,5.25) rectangle (2.0,5.45);
  \foreach \y in {3.65,3.95,4.25,4.55} {\node[red!80!black,font=\scriptsize] at (1.9,\y) {$+$};}
  \draw[->] (3.6,5.4) node[right,font=\scriptsize,align=left] {parasitic\\PMOS channel} -- (2.15,4.3);
  \node[font=\scriptsize] at (0.4,5.6) {p-epi};
  \node[font=\scriptsize] at (3.4,4.25) {n-well};
  \node[font=\scriptsize] at (2.0,-0.65) {(a) bad};
  % (b) good top view
  \begin{scope}[xshift=6.2cm]
    \fill[orange!12] (-0.3,-0.3) rectangle (4.6,6.0);
    \draw[nwell] (0,0) rectangle (4.3,5.2);
    \draw[pdiff] (0.8,0.8) rectangle (3.0,3.4);
    \draw[ndiff] (3.3,0.8) rectangle (3.8,3.4);
    \draw[poly] (1.7,0.5) rectangle (2.1,3.9);
    \draw[poly] (1.5,3.7) rectangle (2.3,4.4);
    \draw[cont] (1.8,3.95) rectangle (2.0,4.15);
    \draw[<->] (2.5,4.4) -- (2.5,5.2);
    \draw (2.5,4.8) -- (4.75,4.8) node[right,font=\scriptsize,align=left] {well overlap of poly\\= well overlap of PSD\\+ 1--2 µm};
    \node[font=\scriptsize] at (2.0,-0.65) {(b) good};
  \end{scope}
  % (c) cross-section along the lead
  \begin{scope}[xshift=14.2cm,yshift=1.0cm]
    \draw[psub] (0,0) rectangle (6,2);
    \draw[nwell,solid] (0,2) -- (0,0.6) -- (3.6,0.6) to[out=0,in=-90] (4.0,1.0) -- (4.0,2);
    \draw[pdiff] (0.3,2) rectangle (1.4,1.7);
    \draw[sti] (1.4,2) -- (1.45,1.55) -- (5.55,1.55) -- (5.6,2) -- cycle;
    \draw[poly] (1.2,2.03) rectangle (5.4,2.3);
    \draw[red!80!black,very thick,dashed] (1.4,1.5) -- (4.05,1.5);
    \node[font=\scriptsize] at (0.85,2.25) {PSD};
    \node[font=\scriptsize] at (3.3,2.55) {poly lead, low $V$};
    \node[font=\scriptsize] at (1.8,0.95) {n-well};
    \node[font=\scriptsize] at (5.0,0.55) {p-epi};
    \node[font=\scriptsize,red!80!black] at (2.7,1.25) {inversion};
    \node[font=\scriptsize] at (3.0,-0.65) {(c) cut along the lead in (a)};
  \end{scope}
\end{circuitikz}
\end{document}
```

A parasitic channel needs **all six**: (1) a lightly doped backgate, (2) a source and (3) a drain of opposite type, (4) a conductor or static charge between them as gate, (5) $|V_{GS}|$ at or above the **thick-field threshold** $V_{TF}$ of that conductor/dielectric stack, (6) nonzero $V_{DS}$. Remove any one and it cannot conduct.

| Thick-field threshold (20 V double-metal n-well CMOS, Hastings Table 5.2) | Gate | Dielectric | Backgate | Typical |
|---|---|---|---|---|
| Poly NMOS | poly | field oxide | p-epi | $V_{TF} > 15$ V |
| Poly PMOS | poly | field oxide | n-well | $V_{TF} < -15$ V |
| Metal-1 NMOS / PMOS | M1 | field + multilevel oxide | p-epi / n-well | $>30$ V / $<-30$ V |
| Metal-2 NMOS / PMOS | M2 | field + MLO + ILO | p-epi / n-well | $>50$ V / $<-50$ V |

> [!warning] Unverified
> Hastings's table lists the backgate of the "NMOS" rows as N-well and of the "PMOS" rows as P-epi, which is the reverse of the device types; the table above uses the physically consistent pairing (NMOS channel inverts p-type, PMOS channel inverts n-type).

- Poly has the lowest threshold (only field oxide under it); each higher metal adds dielectric and raises $V_{TF}$. So the **danger is poly and metal-1 near high-voltage regions**.
- In CMOS, channel-stop implants put $V_{TF}$ above the supply for normal wiring; the risk returns wherever a voltage above the process rating appears (drain-extended devices, high-voltage pins, charge pumps).

> [!tip] Remark
> The parasitic field transistor and the channel-stop implant are built in [[CMOS Processing#The Parasitic Field Transistor and Channel Stop]]. Here we deal with what layout must do when a voltage exceeds them.

### Charge Spreading

```tikz title="Charge spreading over a high-voltage p-region. (a) Fresh part: stray negative charge (moisture-related ions) is scattered on the overcoat/oxide or overcoat/plastic interface. (b) After long operation under bias, the HV p-region has pulled the negative charge over itself and the surrounding n-well; with no gate at all, the n-well surface inverts and a channel bridges the PSD to the p-epi. An unbiased bake removes it. After Hastings Figs. 5.18-5.19, redrawn for n-well CMOS."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) fresh},1/{(b) after long bias}} {
    \begin{scope}[xshift=\i*7.6cm]
      \draw[psub] (0,0) rectangle (7,2);
      \draw[nwell,solid] (1.2,2) -- (1.2,0.9) to[out=-90,in=180] (1.6,0.6) -- (5.4,0.6) to[out=0,in=-90] (5.8,0.9) -- (5.8,2);
      \draw[pdiff] (2.8,2) rectangle (4.2,1.65);
      \draw[diel] (0,2) rectangle (7,2.8);
      \draw[nit] (0,2.8) rectangle (7,3.1);
      \node[font=\scriptsize] at (3.5,1.3) {n-well};
      \node[font=\scriptsize] at (0.6,0.4) {p-epi};
      \node[font=\scriptsize] at (3.5,1.83) {HV PSD};
      \node[font=\scriptsize] at (3.5,-0.35) {\t};
    \end{scope}
  }
  \foreach \x in {0.4,1.5,2.7,3.8,4.6,5.9,6.6} {\node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at (\x,3.3) {$-$};}
  \begin{scope}[xshift=7.6cm]
    \foreach \x in {1.3,1.65,2.0,2.35,2.7,3.05,3.4,3.75,4.1,4.45,4.8,5.15,5.5,5.85} {\node[circle,draw,fill=white,inner sep=0.2pt,font=\tiny] at (\x,3.3) {$-$};}
    \foreach \x in {1.4,1.8,2.2,2.6,4.4,4.8,5.2,5.6} {\node[red!80!black,font=\scriptsize] at (\x,1.88) {$+$};}
    \draw[red!80!black,very thick,dashed] (1.1,1.75) -- (2.8,1.75);
    \draw[red!80!black,very thick,dashed] (4.2,1.75) -- (5.9,1.75);
    \node[font=\scriptsize,red!80!black,align=center] at (3.5,0.3) {surface channel to p-epi};
    \draw[->,red!80!black] (2.6,0.45) -- (1.8,1.65);
    \draw[->,red!80!black] (4.4,0.45) -- (5.2,1.65);
  \end{scope}
  \node[font=\scriptsize,anchor=west] at (14.7,3.3) {stray charge};
  \node[font=\scriptsize,anchor=west] at (14.7,2.95) {overcoat};
\end{circuitikz}
\end{document}
```

- Symptoms: the part works, then after long operation under bias (faster when hot) microamps flow between nodes that no conductor bridges. Channels from charge spreading **always bridge p-type regions**. Nitride overcoats appear more susceptible than oxide overcoats.
- The charge is thought to be a negatively charged, moisture-related species moving along the oxide/nitride or overcoat/plastic interface. Mobile ions amplify it (**sodium amplification**: Na⁺ drifts up toward the negative surface charge, leaving immobile negative charges closer to the silicon).
- In modern CMOS it is rare unless part of the die runs above the top metal's thick-field threshold (modern CMOS/BiCMOS top-metal thresholds exceed 50 V). In high-voltage parts the ionic charge in the mold compound gathers over high-voltage regions and slowly lowers drain breakdown, at far lower charge than inversion needs.

> [!note]- Detail: evidence and high-voltage cures (Hastings §5.3.5)
> - Charge spreading was seen in single-metal bipolar circuits at under 10 V although the metal thick-field threshold was 42 V; in a modern voltage regulator below 40 V it vanished on decapsulation, pointing at the mold compound.
> - Unbiased bake removes it; decapsulation removes it too, when the charge is in the plastic.
> - High-voltage cures: field-plate the device with the highest metal whose underlying oxide withstands the voltage; a thick power-copper layer above the overcoat can act as a plate over very large voltage differences; otherwise the process may need a semi-insulating overcoat to bleed the surface charge off.

### Field Plates and Channel Stops

```tikz title="Three versions of a high-voltage p-type resistor in an n-well crossed by a low-voltage lead. (a) Bad: the LV metal-1 lead gates a parasitic PMOS from the resistor to the p-epi outside the well. (b) Channel stop: an NSD strip under the lead interrupts the channel; it overhangs the lead by misalignment + 2 t_ox. (c) Field plate: metal-1 tied to the high-voltage end covers the resistor; the LV lead moves to metal-2 and crosses above the plate. After Hastings Figs. 5.20-5.21 and 5.25, redrawn for CMOS."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) bad},1/{(b) channel stop},2/{(c) field plate}} {
    \begin{scope}[xshift=\i*5.6cm]
      \fill[orange!12] (-0.3,-0.3) rectangle (4.9,4.9);
      \draw[nwell] (0,0) rectangle (4.6,4.0);
      \draw[pdiff] (0.6,1.6) rectangle (4.0,2.2);
      \draw[cont] (0.75,1.8) rectangle (0.95,2.0);
      \draw[cont] (3.65,1.8) rectangle (3.85,2.0);
      \draw[ndiff] (3.9,0.3) rectangle (4.3,0.7);
      \node[font=\scriptsize] at (0.8,1.35) {HV};
      \node[font=\scriptsize] at (3.75,1.35) {};
      \node[font=\scriptsize] at (2.3,-0.65) {\t};
      \node[font=\scriptsize] at (0.6,4.5) {p-epi};
    \end{scope}
  }
  % (a) lead in M1 crossing resistor and well edge
  \draw[mone] (2.1,0.9) rectangle (2.5,5.0);
  \foreach \y in {2.45,2.8,3.15,3.5,3.85} {\node[red!80!black,font=\scriptsize] at (2.75,\y) {$+$};}
  \node[font=\scriptsize,anchor=west,red!80!black,align=left] at (2.9,3.2) {channel\\to p-epi};
  \node[font=\scriptsize,anchor=west] at (2.6,4.65) {LV M1};
  % (b) channel stop
  \begin{scope}[xshift=5.6cm]
    \draw[ndiff] (1.6,2.7) rectangle (3.0,3.1);
    \draw[mone] (2.1,0.9) rectangle (2.5,5.0);
    \draw[<->] (2.5,3.25) -- (3.0,3.25);
    \node[font=\scriptsize,anchor=west,align=left] at (3.05,3.5) {misalign\\+ $2t_{ox}$};
    \node[font=\scriptsize,anchor=east] at (1.55,2.9) {NSD stop};
  \end{scope}
  % (c) field plate
  \begin{scope}[xshift=11.2cm]
    \draw[mone,fill opacity=0.55] (0.35,1.35) rectangle (3.75,2.45);
    \draw[mtwo] (2.1,0.9) rectangle (2.5,5.0);
    \node[font=\scriptsize,anchor=west] at (2.6,4.65) {LV M2};
    \node[font=\scriptsize,align=left,anchor=west] at (0.1,3.2) {M1 plate tied\\to HV end};
    \draw[->] (1.0,2.95) -- (1.0,2.4);
  \end{scope}
\end{circuitikz}
\end{document}
```

**Layout rules for parasitic channels and charge spreading**
1. Inspect every poly and metal lead that passes near a p-region biased above the thick-field threshold of that layer (and n-regions for parasitic NMOS); reroute it away, or move it to a higher metal with a larger $V_{TF}$.
2. Keep poly gate leads of PMOS in high-voltage wells inside the well: well overlap of poly = well overlap of PSD + 1 to 2 µm.
3. Where a lead must cross, put a **field plate** under it (a minimum-width strip of poly or lower metal tied to a voltage ≥ the well, wide enough for misalignment and fringing) or a **channel stop** under it (a minimum-width strip of NSD bisecting the lead in an n-well, PSD for parasitic NMOS in p-epi).
4. Size every field plate and channel stop to overhang by misalignment + 2× the oxide thickness under the conductor (fringing fields); channel stops overhang misalignment only when they bridge field-plate gaps.
5. Field-plate p-regions whose voltage above the n-well exceeds about 2/3 of the top-metal thick-field threshold (bipolar rule: derate $V_{TF}$ by ≥25%). Tie the plate to the **highest** voltage of the device and cover as much of it as possible; on a resistor with one HV end, a partial plate is enough if it extends well past where the voltage drops below $V_{TF}$.
6. Close plate gaps: flange the plates (long, narrow gaps), bridge gaps with short channel stops, or use overlapping metal-2 plates.
7. Always field-plate the exposed base of a lateral PNP (plate tied to the emitter, overlapping the collector).

> [!note]- Why: the reasoning behind each rule (Hastings §5.3.5)
> 1. The parasitic channel needs all six conditions; rerouting removes the gate, a higher metal raises $V_{TF}$ (Table above).
> 2. Retracting the poly into the well leaves the channel with no p-type drain (condition 3). The overlap must cover depletion into the well, well outdiffusion, poly-to-well misalignment and fringing (≈2 $t_{ox}$); the PSD overlap rule already contains all of those except the extra.
> 3. A field plate is a gate that holds the parasitic $V_{GS}$ below threshold, and it is an electrostatic shield: charge or leads above it cannot reach the silicon, so low-voltage metal-2 can cross freely. It also blocks capacitive noise from overlying leads when tied to a quiet node. A channel stop instead raises the surface doping so the channel cannot form at all, but cannot stop charge spreading by itself (channels still bridge between serpentine turns), so plates are usually preferred: no extra area, no bigger wells, full protection.
> 4. Fringing fields from the conductor edge reach about twice the oxide thickness sideways; misalignment between the two layers adds to it. In gaps bridged by channel stops, outdiffusion of the stop moves it further under the plates, so fringing can be ignored there.
> 5. The higher the plate voltage over an n-region, the harder it suppresses PMOS channels. Charge spreading has been seen well below the thick-field threshold, hence the 2/3 and 25% derating. Matched resistors may need split plates to equalize conductivity modulation ([[Resistor#Layout]]).
> 6. The lateral field across a long narrow gap sweeps static charge away.
> 7. Lateral PNP β is changed by surface charge far below inversion: depletion of the base surface changes its Gummel number. PNP β increases of more than 30% were seen in parts below 5 V with a 40 V metal-1 threshold.

## Level 4: Minority-Carrier Injection

### Pins That Inject

```tikz title="Pins that leave the supply range forward-bias a junction and inject minority carriers. (a) A PSD on a pin pulled above V_DD injects holes into the n-well; holes reaching the well/substrate junction are collected by the p-epi: a vertical parasitic PNP dumping current into the substrate. (b) An NSD on a pin pulled below ground injects electrons into the p-epi; electrons reaching a neighbouring n-well are collected there: a lateral parasitic NPN pulling current out of that well. After Hastings Fig. 5.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},
  hole/.style={circle,draw,fill=white,inner sep=0.2pt,font=\tiny},]
  % (a)
  \draw[psub] (0,0) rectangle (7,2.4);
  \draw[nwell,solid] (0,2.4) -- (0,0.9) -- (4.4,0.9) to[out=0,in=-90] (4.8,1.3) -- (4.8,2.4);
  \draw[ndiff] (0.3,2.4) rectangle (1.1,2.1);
  \draw[poly] (2.0,2.43) rectangle (2.6,2.65);
  \draw[pdiff] (1.4,2.4) rectangle (2.0,2.1);
  \draw[pdiff] (2.6,2.4) rectangle (3.4,2.1);
  \draw[pdiff] (5.6,2.4) rectangle (6.4,2.1);
  \node[font=\scriptsize,above] at (0.7,2.45) {$V_{DD}$};
  \node[font=\scriptsize,above,align=center] at (3.0,2.45) {pin $>V_{DD}$};
  \node[font=\scriptsize,above] at (6.0,2.45) {GND};
  \node[hole] at (3.0,1.8) {$+$}; \node[hole] at (3.4,1.3) {$+$}; \node[hole] at (3.9,0.6) {$+$};
  \draw[->,red!80!black,thick] (3.0,2.05) to[out=-90,in=150] (3.9,0.75) to[out=-30,in=-120] (5.9,2.05);
  \node[font=\scriptsize] at (1.5,1.4) {n-well};
  \node[font=\scriptsize] at (6.2,0.4) {p-epi};
  \node[font=\scriptsize,align=center] at (3.5,-0.5) {(a) PSD above supply: PNP into substrate};
  % (b)
  \begin{scope}[xshift=7.8cm]
    \draw[psub] (0,0) rectangle (7,2.4);
    \draw[nwell,solid] (4.6,2.4) -- (4.6,1.3) to[out=-90,in=180] (5.0,0.9) -- (7,0.9) -- (7,2.4);
    \draw[pdiff] (0.3,2.4) rectangle (1.1,2.1);
    \draw[ndiff] (1.4,2.4) rectangle (2.0,2.1);
    \draw[poly] (2.0,2.43) rectangle (2.6,2.65);
    \draw[ndiff] (2.6,2.4) rectangle (3.4,2.1);
    \draw[ndiff] (5.8,2.4) rectangle (6.6,2.1);
    \node[font=\scriptsize,above] at (0.7,2.45) {GND};
    \node[font=\scriptsize,above,align=center] at (3.0,2.45) {pin $<$ GND};
    \node[font=\scriptsize,above] at (6.2,2.45) {$V_{DD}$};
    \node[hole] at (3.2,1.7) {$-$}; \node[hole] at (3.8,1.1) {$-$}; \node[hole] at (4.3,1.5) {$-$};
    \draw[->,red!80!black,thick] (3.0,2.05) to[out=-90,in=-150] (4.7,1.3);
    \node[font=\scriptsize] at (1.5,1.0) {p-epi};
    \node[font=\scriptsize,align=center] at (5.8,1.4) {n-well\\(any neighbour)};
    \node[font=\scriptsize,align=center] at (3.5,-0.5) {(b) NSD below ground: NPN into a neighbouring well};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Any diffusion tied to a pin is the emitter of a parasitic bipolar whose base is the region around it and whose collector is the nearest reverse-biased junction. Pins leave the rails in normal use: hot-plugging (USB lines), supply sequencing, inductive kicks from solenoids and relays, lightning and shorts, capacitive coupling from fast edges.
- Injected minority carriers cause glitches and offsets in sensitive circuits nearby (and noise, [[Substrate Noise]]); if the collected current debiases a well or the substrate, they trigger **latch-up**.

$$
\boxed{\text{a diffusion connected to a pin through } R < 10\ \text{k}\Omega \text{ may trigger latch-up}}
$$

- Why 10 kΩ: ESD devices clamp a pin to about −1 V, and latch-up is usually triggered by negative transients sinking at least 100 µA from a diffusion; 1 V / 100 µA = 10 kΩ. Low-current analog circuitry has latched with 100 kΩ, so many designers use 50 or 100 kΩ.

### Internal Nodes That Inject

```tikz title="An internal node can leave the rails too. When Q1 resets the timing node V1, the Schmitt trigger S1 switches and C1 couples its falling output edge back onto V1, briefly driving it below ground; the N-type collector of Q1 then injects electrons. Under 1 pF has latched a neighbouring gate that lacked guard rings and substrate contacts. After Hastings Fig. 5.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw (0,4) node[above] {$V_{CC}$} to[I,l=$I_1$] (0,2.2) node[circ]{} coordinate(v1);
  \draw (v1) -- (0,1.6) node[npn,anchor=C](Q){};
  \draw (Q.E) node[ground]{};
  \draw (Q.B) -- ++(-0.6,0) node[left] {reset};
  \node[left] at (-0.1,2.2) {$V_1$};
  \draw (v1) -- (1.4,2.2);
  \draw (1.4,1.6) -- (1.4,2.8) -- (2.9,2.2) -- cycle;
  \node[font=\scriptsize] at (1.85,2.2) {$S_1$};
  \draw (2.9,2.2) -- (3.6,2.2) node[circ]{} -- (4.3,2.2) node[right] {out};
  \draw (0.7,2.2) node[circ]{} -- (0.7,3.3) to[C,l=$C_1$] (3.6,3.3) -- (3.6,2.2);
  \draw[red!80!black,thick] (5.8,1.4) -- (7.2,3.0) -- (7.2,0.8) .. controls (7.35,1.3) and (7.5,1.4) .. (7.8,1.4) -- (9.0,2.6);
  \draw[dashed] (5.6,1.4) -- (9.2,1.4) node[right,font=\scriptsize] {0 V};
  \draw[->,red!80!black] (7.9,0.4) node[below,font=\scriptsize] {reset edge + $C_1$ kick: below ground} -- (7.27,0.8);
  \node[font=\scriptsize] at (6.2,2.6) {$V_1$ ramps};
\end{circuitikz}
\end{document}
```

- Capacitors driven by switching nodes can push internal nodes above supply or below ground, exactly like a pin.
- Schottky diodes inject minority carriers into their cathode, especially ones with PN guard rings; even field-plated Schottkys do at high forward current. Merging a Schottky with other components invites malfunctions.

### Stopping Injection at the Cause

```tikz title="The injection chain and where each countermeasure cuts it. This note owns the first cut (prevent injection); collection, recombination distance and debiasing are guard-ring and substrate-contact work, owned by Guard Rings, ESD and Interconnect. After Hastings Secs. 5.4.1-5.4.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,box/.style={draw,rounded corners,align=center,minimum height=1.0cm,minimum width=2.4cm,inner sep=3pt}]
  \node[box] (a) at (0,0) {junction\\forward-biased};
  \node[box] (b) at (3.4,0) {minority carriers\\diffuse};
  \node[box] (c) at (6.8,0) {collected at a\\reverse-biased junction};
  \node[box] (d) at (10.4,0) {debias well/\\substrate ($IR$)};
  \node[box,fill=red!15] (e) at (13.6,0) {glitch or\\latch-up};
  \draw[->] (a) -- (b); \draw[->] (b) -- (c); \draw[->] (c) -- (d); \draw[->] (d) -- (e);
  \node[box,fill=green!15,font=\scriptsize] at (0,-2.0) {prevent\\series $R$, clamps,\\no merged Schottky\\\textbf{this note}};
  \node[box,fill=gray!10,font=\scriptsize] at (3.4,-2.0) {recombine\\distance, heavily\\doped regions};
  \node[box,fill=gray!10,font=\scriptsize] at (6.8,-2.0) {collect first\\minority-carrier\\guard rings};
  \node[box,fill=gray!10,font=\scriptsize] at (10.4,-2.0) {reduce debiasing\\substrate/well\\contacts};
  \foreach \x in {0,3.4,6.8,10.4} {\draw[->,thick,green!40!black] (\x,-1.2) -- (\x,-0.55);}
\end{circuitikz}
\end{document}
```

**Layout rules for minority-carrier injection (at the cause)**
1. List every diffusion that connects to a pin, directly or through less than 10 kΩ (50 to 100 kΩ for low-current analog). Those are injectors.
2. Where possible add series resistance (a poly or well resistor) between the pin and the diffusion, so injected current stays harmless.
3. Keep injectors away from sensitive analog circuits and from logic; put them near the pad, inside the guard structures the ESD/latch-up rules require.
4. Look for internal nodes that capacitors or inductors can drive past a rail (bootstrap, timing and switching nodes) and treat their diffusions as injectors too.
5. Do not merge Schottky diodes with other components.
6. Then collect what escapes and keep wells and substrate stiff: guard rings and contacts in [[Guard Rings, ESD and Interconnect]].

> [!tip] Remark
> Latch-up itself (the PNPN loop, $\beta_N\beta_P > 1$, the JEDEC current-injection test), well and substrate debiasing and the guard-ring rules are in [[Guard Rings, ESD and Interconnect#Latch-up]]. The trigger chain above is the bridge: injection here, collection and debiasing there.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Lower junction temperature (θ_JA, layout spreading heat) | every mechanism, exponentially (Arrhenius) | package, area, power budget |
| Lower oxide field / thicker oxide | TDDB life | $g_m$ per area, higher $V_{TH}$; very thick oxides are more fragile |
| Smaller dielectric area at a given field | TDDB life ($\propto A^{-1/\beta}$) | less capacitance |
| Antenna jumpers / diodes | gate-oxide integrity, $V_{TH}$ stability | vias; diode junction capacitance and leakage |
| Fewer and fully overlapped PO openings, closed test pads | corrosion, mobile-ion drift | extra PO mask; no probing in production |
| Longer $L$ on high-$V_{DS}$ devices | hot-carrier drift | area, speed |
| Cascoding matched pairs | equal HCI/BTI stress, offset drift | headroom |
| Field plates | parasitic channels, charge spreading, shields noise | a metal layer over the device; conductivity modulation of resistors |
| Channel stops | parasitic channels | area, junction capacitance; no charge-spreading protection |
| Series $R$ on pin-connected diffusions | minority injection, latch-up trigger | noise, bandwidth, drive |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Arrhenius rate | $R = k_r e^{-E_a/kT}$, $k = 8.62\times10^{-5}$ eV/K |
| Median life | $t_{50} = A_{50}e^{E_a/kT}$, $E_a$ = 0.5 to 1.5 eV |
| Temperature acceleration | $t_2 = t_1\exp\left[\frac{E_a}{k}\left(\frac1{T_2}-\frac1{T_1}\right)\right]$ |
| Junction temperature | $T_J = T_A+\theta_{JA}P_D$, $T_J = T_C + \theta_{JC}P_D$ |
| Power-device self-heating | $\Delta T = \frac{\ln(4L/W)}{\pi\kappa L}P_D$ |
| TDDB, AHI ($1/E$) model | $t_{50} = \tau e^{G/E}$, $G\approx350$ MV/cm |
| TDDB, McPherson ($E$) model | $t_{50} = \tau e^{-\gamma E}$, $\gamma\approx2.5$–3.5 cm/MV |
| Oxide field | $V = E\,t_{ox}$; design 3.5–4.5 MV/cm |
| Area scaling (Weibull) | $t_2 = t_1(A_1/A_2)^{1/\beta}$, $\beta\approx2$ |
| Field at equal life, larger area | AHI $E_2 = \left[1/E_1+\ln(A_2/A_1)/(\beta G)\right]^{-1}$; McPherson $E_2 = E_1+\ln(A_1/A_2)/(\beta\gamma)$ |
| Field-plate / channel-stop overhang | misalignment + $2t_{ox}$ |
| Field-plate trigger | p-region more than ≈ 2/3 $\lvert V_{TF}\rvert$ (top metal) above the n-well |
| Latch-up-safe pin resistance | $R \ge 10$ kΩ (50–100 kΩ conservative) |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (PDF page = printed + 1), Ch. 5 Failure Mechanisms:
  - §5.1 intro and §5.1.1 Self-Heating (pp. 210–213): Eqs. 5.1–5.6, leakage and intrinsic temperatures, 100,000 h life. Eqs. 5.7–5.9 and Table 5.1 (resistor widths, bondwire currents) left to [[Resistor]] and [[Packaging]].
  - §5.1.2 Filamentation (pp. 213–215): thermal and avalanche runaway, ballasting (fold only).
  - §5.1.3 Electromigration: not used; see [[Electromigration]].
  - §5.1.4 TDDB (pp. 219–223): Fig. 5.4, Eqs. 5.14–5.21, field limits, GOI, OVST, gettering, deep-N+, STI cone defects.
  - §5.1.5 ESD (pp. 223–227): only the "walking wounded" and silicide-ballast points; rest in [[Guard Rings, ESD and Interconnect]].
  - §5.1.6 Antenna Effect (pp. 227–229): peripheral/areal ratios, latent antenna effect, Figs. 5.8–5.9 (fixes drawn in [[Layout Fundamentals#Antenna rules]]).
  - §5.2.1 Dry Corrosion and §5.2.2 Mobile Ion Contamination (pp. 230–234): Figs. 5.10–5.11, PO openings, test pads, fuses, scribe seals.
  - §5.3 intro, §5.3.1 Hot-Carrier Injection (pp. 235–238): Figs. 5.12–5.13. §5.3.2 Zener Walkout and §5.3.3 Avalanche-Induced Beta Degradation (pp. 238–242, fold). §5.3.4 NBTI/PBTI (pp. 242–244).
  - §5.3.5 Parasitic Channels and Charge Spreading (pp. 244–253): Table 5.2, Figs. 5.17–5.25. §5.3.6 Substrate Influence (dielectric isolation, handle contact) not covered.
  - §5.4 intro and §5.4.1 Minority Carrier Injection (pp. 255–256): Figs. 5.27–5.28, the 10 kΩ rule. §5.4.2 Latchup (four countermeasures only), §5.4.3 Debiasing and §5.4.4 Guard Rings left to [[Guard Rings, ESD and Interconnect]].
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19): §19.1.2 Antenna Effect, p. 736, Fig. 19.8. §18.8 latch-up is linked only.
