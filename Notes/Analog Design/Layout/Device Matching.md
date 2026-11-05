---
title: Device Matching
description: Why two identically drawn devices come out different (random variation, gradients, proximity, stress, hydrogen, wiring) and the layout rules that cancel each cause, ending in Hastings' MOS matching rules and an offset-spec-to-layout worked example.
kind: topic
status: growing
aliases:
  - Device Matching
  - Matching
  - Layout Matching
  - Mismatch in Layout
---

Two devices drawn identically never come out identical. Part of the difference is **random** and only area shrinks it; the rest is **systematic**: something about where the devices sit, what surrounds them, or how they are wired treats one differently from the other. Layout can drive the systematic part to (nearly) zero. This note works from the outside in: the statistics, then die-wide gradients, then the device's immediate neighbours, then what sits on top of it, then the rules.

## The big picture

```tikz title="The same pair drawn badly and well. Bad: the two devices sit side by side (centroids apart), have no dummies, a well edge crowds B and a metal-2 line crosses B only. Good: one diffusion, fingers D-ABBA-D, extended moat, well edge far away, no metal over the gates; A and B share one centroid. After Hastings Figs. 13.45, 13.51, 13.57 and Razavi Figs. 19.16-19.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ---------- BAD ----------
  \node[font=\bfseries] at (1.7,3.55) {Bad: AABB, bare};
  \draw[dashed,thick,draw=cyan!50!black,fill=cyan!18] (-0.6,-0.6) rectangle (3.55,3.1);
  \node[font=\scriptsize,anchor=west] at (-0.55,2.9) {n-well};
  \foreach \x/\l in {0/A,1.9/B} {
    \draw[fill=orange!65,draw=black!60] (\x,0) rectangle ({\x+1.5},2);
    \foreach \g in {0.45,0.95} \draw[fill=red!65] ({\x+\g},-0.3) rectangle ({\x+\g+0.15},2.3);
    \foreach \c in {0.15,0.68,1.22} \foreach \y in {0.25,0.7,1.17,1.62} \fill ({\x+\c},\y) rectangle ({\x+\c+0.13},{\y+0.13});
    \node[font=\scriptsize] at ({\x+0.75},2.55) {\l\ \l};
  }
  \draw[fill=violet!55,opacity=0.85] (1.75,1.15) rectangle (4.3,1.45);
  \node[font=\scriptsize,anchor=west] at (4.35,1.3) {M2 over B only};
  \draw[very thick,orange!80!black] (0.65,0.9) -- (0.85,1.1) (0.65,1.1) -- (0.85,0.9);
  \draw[very thick,orange!80!black] (2.55,0.9) -- (2.75,1.1) (2.55,1.1) -- (2.75,0.9);
  \draw[<->] (0.75,-0.95) -- (2.65,-0.95) node[midway,below,font=\scriptsize] {$d_{cc}\neq0$: gradient error};
  \draw[<-,thick,orange] (3.55,0.2) -- (4.3,-0.3) node[right,font=\scriptsize,black,align=left] {well edge hugs B:\\ WPE};
  \node[font=\scriptsize,align=left,anchor=north west] at (-0.6,-1.4) {edge fingers see open field:\\ etch bias + STI stress (LOD)};
  % ---------- GOOD ----------
  \begin{scope}[xshift=9.2cm]
    \node[font=\bfseries] at (2.3,3.55) {Good: D ABBA D, guarded};
    \draw[dashed,thick,draw=cyan!50!black,fill=cyan!18] (-1.2,-0.6) rectangle (5.8,3.1);
    \node[font=\scriptsize,anchor=west] at (-1.15,2.9) {n-well $\geq$ 3--5 µm away};
    \draw[fill=orange!65,draw=black!60] (-0.5,0) rectangle (5.1,2);
    \foreach \g/\l/\f in {0.4/D/red!25,1.2/A/red!65,2.0/B/red!65,2.8/B/red!65,3.6/A/red!65,4.4/D/red!25} {
      \draw[fill=\f] (\g,-0.3) rectangle ({\g+0.15},2.3);
      \node[font=\scriptsize] at ({\g+0.075},2.55) {\l};
    }
    \foreach \c in {-0.2,0.73,1.53,2.33,3.13,3.93,4.73} \foreach \y in {0.25,0.7,1.17,1.62} \fill (\c,\y) rectangle ({\c+0.13},{\y+0.13});
    \draw[very thick,orange!80!black] (2.28,0.9) -- (2.48,1.1) (2.28,1.1) -- (2.48,0.9);
    \node[font=\scriptsize,fill=white,inner sep=1pt,anchor=west] at (2.5,1.0) {A, B};
    \draw[<->] (-0.5,-0.95) -- (0.4,-0.95) node[midway,below,font=\scriptsize] {moat ext.};
    \node[font=\scriptsize,anchor=north west,align=left] at (1.0,-0.75) {$d_{cc}=0$; dummies D tied off;\\ no metal over any gate};
  \end{scope}
  \draw[->,thick,orange] (0,-2.55) -- (15.0,-2.55) node[midway,below,font=\scriptsize,black] {linear gradient (temperature, stress, $t_{ox}$)};
  % ---------- legend ----------
  \begin{scope}[yshift=-3.55cm,font=\scriptsize]
    \draw[fill=orange!65,draw=black!60] (0,0) rectangle (0.4,0.25); \node[anchor=west] at (0.45,0.12) {p+ active (PMOS)};
    \draw[fill=red!65] (2.9,0) rectangle (3.3,0.25); \node[anchor=west] at (3.35,0.12) {poly gate};
    \draw[fill=red!25] (5.0,0) rectangle (5.4,0.25); \node[anchor=west] at (5.45,0.12) {dummy poly};
    \draw[fill=blue!55] (7.4,0) rectangle (7.8,0.25); \node[anchor=west] at (7.85,0.12) {metal 1};
    \draw[fill=violet!55] (9.3,0) rectangle (9.7,0.25); \node[anchor=west] at (9.75,0.12) {metal 2};
    \fill (11.2,0.06) rectangle (11.33,0.19); \node[anchor=west] at (11.4,0.12) {contact};
    \draw[dashed,thick,draw=cyan!50!black,fill=cyan!18] (12.8,0) rectangle (13.2,0.25); \node[anchor=west] at (13.25,0.12) {n-well};
    \draw[very thick,orange!80!black] (14.2,0.02) -- (14.4,0.22) (14.2,0.22) -- (14.4,0.02); \node[anchor=west] at (14.45,0.12) {centroid};
  \end{scope}
\end{circuitikz}
\end{document}
```

Colours follow the Layout-series legend of [[CMOS Processing]]: n+ active green, p+ active orange, poly red (dummy poly pale red), M1 blue, M2 purple, contacts black, n-well light cyan dashed, STI grey, p-substrate peach; the orange × marks a centroid. Generic tiles in the pattern diagrams are white (A) and grey (B).

> [!important] The five results the rest of the note refines
> 1. **Mismatch = systematic + random.** The systematic part is the mean $\mu$ of the mismatch; layout removes it. The random part is the spread $\sigma$; only area removes it: $\sigma = A/\sqrt{WL}$ (Pelgrom). Budget as $|\mu| + 6\sigma \le$ spec.
> 2. **Gradients cost $\Delta P = \alpha P\, d_{cc}\nabla$:** proportional to the distance between the devices' centroids. Make the centroids coincide (ABBA, AB/BA) and the linear term is exactly zero; what is left grows with the **square** of the array size, so keep arrays compact.
> 3. **Matched devices must see identical surroundings:** same unit geometry, same orientation, same neighbours (dummies), same distance to STI and well edges, same metal overhead, same temperature and stress.
> 4. **Voltage matching costs area, current matching costs length:** $\sigma_{V_{GS}}\approx\sigma_{V_{TH}}\propto1/\sqrt{WL}$, but $\sigma_{I}/I = (g_m/I_D)\,\sigma_{V_{TH}}\propto1/L$ at fixed current.
> 5. **Hastings' classes for MOS:** minimal ±10 mV or ±10%, moderate ±3 mV or ±3%, exceptional ±1 mV or ±1% (6σ, lifetime, −40 to 125 °C, plastic package). Each class adds layout rules.

**Map:** [[#Spec translation|spec → σ budget → area and pattern]] → [[#Level 0 Random vs Systematic|random vs systematic, distance]] → [[#Level 1 Gradients and the Centroid|gradients, centroids, why ABBA cancels]] → [[#Level 2 Die-Level Gradients|temperature, stress, oxide, placement on the die]] → [[#Level 3 The Device's Neighbours|etch, orientation, STI/LOD, well proximity]] → [[#Level 4 What Sits on Top and What Feeds It|hydrogen and metal, wiring IR drop, bias]] → [[#Level 5 Rules for MOS Transistor Matching|the MOS rules]].

> [!tip] Remark
> This note owns the *physical causes* and the layout rules. The statistics of random mismatch and how it turns into circuit offset ($\sigma_{\Delta V_{TH}} = A_{VT}/\sqrt{WL}$, $V_{OS}$ of a pair, current-mirror error, the $g_m/I_D$ view) live in [[Nonlinearity and Mismatch#Level 3 Mismatch and Offset]]. Array construction (which pattern for which ratio, routing a common-centroid array) lives in [[Common-Centroid Layout]]. Device-specific layout: [[Resistor#Layout]], [[Capacitor#Layout]], [[BJTs#Matching Bipolar Transistors]].

## Spec translation

A matched pair is not an amplifier, so it has no $g_m/I_D$ spec of its own. What it has is an **accuracy** spec inherited from the block: an input offset, a current ratio, a resistor or capacitor ratio. The translation runs: block accuracy → mismatch budget → device area → matching class → layout pattern and rules.

```tikz title="From a block accuracy spec to a layout. The systematic budget is spent by layout (it adds linearly, fixed sign); the random budget is spent by area (it adds in quadrature). The matching class then picks the rule set."
\usepackage{circuitikz}
\usetikzlibrary{positioning}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,box/.style={draw,rounded corners,align=center,minimum height=1.1cm,text width=2.6cm,font=\scriptsize}]
  \node[box,fill=gray!10] (s) at (0,0) {block spec\\ $V_{OS}$, $\Delta I/I$, $\Delta R/R$\\ at a yield ($k\sigma$)};
  \node[box,fill=orange!15] (sys) at (3.6,1.0) {systematic budget\\ $|\mu|$: gradients,\\ proximity, wiring};
  \node[box,fill=blue!10] (rnd) at (3.6,-1.0) {random budget\\ $k\sigma$ (RSS of\\ every device)};
  \node[box,fill=orange!15] (lay) at (7.4,1.0) {pattern + rules\\ (class: minimal /\\ moderate / exceptional)};
  \node[box,fill=blue!10] (area) at (7.4,-1.0) {area\\ $WL \ge (A_{VT}/\sigma)^2$\\ $L$ for current};
  \node[box,fill=green!15] (out) at (11.0,0) {layout:\\ fingers, dummies,\\ placement};
  \draw[->] (s) -- (sys); \draw[->] (s) -- (rnd);
  \draw[->] (sys) -- (lay); \draw[->] (rnd) -- (area);
  \draw[->] (lay) -- (out); \draw[->] (area) -- (out);
  \node[font=\scriptsize] at (3.6,0) {$|\mu| + k\sigma \le$ spec};
\end{circuitikz}
\end{document}
```

$$
\boxed{|\mu_{sys}| + k\,\sigma_{rand} \le \text{spec}}\qquad\boxed{WL \ge \left(\frac{A_{VT}}{\sigma_{\Delta V_{TH}}}\right)^2}\qquad\boxed{A_{VT}\approx 1\ \tfrac{\text{mV}\cdot\mu\text{m}}{\text{nm}}\times t_{ox}}
$$

- $k = 6$ in Hastings' convention (his "±X" classes are $\pm6\sigma$); use your product's yield target otherwise.
- **Systematic adds linearly with a fixed sign; random adds in quadrature.** Never RSS a gradient error with $\sigma$.
- **Leave room for the systematic part.** For resistors and capacitors Hastings lets random mismatch take 75% or more of a minimal spec, but no more than 50% of a moderate one and 25% of an exceptional one (Rules 8.3.1-3, 8.3.2-3), because the remaining causes get harder to suppress as the spec tightens. His MOS area table (below) gives the area for the *whole* spec, so carve the systematic share out yourself.

| Block spec | Matched devices | Mismatch quantity | Sets |
|---|---|---|---|
| Op-amp / comparator input offset | input pair; load mirror (referred by $g_{m,load}/g_{m,in}$) | $\sigma_{\Delta V_{TH}}$ (voltage matching) | pair area $WL$; load $g_m/I_D$ small |
| Current-mirror / DAC current ratio | mirror devices | $\sigma_{\Delta I}/I = (g_m/I_D)\sigma_{\Delta V_{TH}}$ | channel length $L$; low $g_m/I_D$ |
| Bandgap ratio, divider ratio | resistor units | $\sigma_{\Delta R/R} = k_A/\sqrt{A}$ | resistor width and area ([[Resistor#Layout]]) |
| SC gain, SAR/pipeline DAC | unit capacitors | $\sigma_{\Delta C/C} = k_C/\sqrt{C}$ | unit size ([[Capacitor#Layout]]) |
| Any of the above | the whole array | $|\mu|$ from gradients, LOD, WPE, metal | pattern, dummies, spacing, placement |

> [!tip] Remark
> How a device's $\sigma$ becomes a circuit offset (and why the load's contribution is scaled by $g_{m,P}/g_{m,N}$) is derived in [[Nonlinearity and Mismatch#Input-Referred Offset]] and [[Nonlinearity and Mismatch#Current Mismatch the Opposite Instruction]]. Choosing $g_m/I_D$ is [[gm-ID Design Methodology]]; this section only fixes area, $L$ and the pattern.

**Hastings' MOS area and length tables** (assume $A_{VT} = 1$ mV·µm per nm of gate oxide and a maximum oxide field per voltage class):

| Voltage matching (Table 13.4): active area per device | 12 V | 5 V | 3.3 V | 1.8 V |
|---|---|---|---|---|
| Minimal (±10 mV) | 423 µm² | 56 µm² | 19 µm² | 5.8 µm² |
| Moderate (±3 mV) | 4,700 µm² | 630 µm² | 220 µm² | 64 µm² |
| Exceptional (±1 mV) | 42,000 µm² | 5,600 µm² | 1,900 µm² | 580 µm² |

| Current matching at $I_D = 1$ µA (Table 13.5): channel length | 12 V | 5 V | 3.3 V | 1.8 V |
|---|---|---|---|---|
| NMOS minimal / moderate / exceptional (±10 / 3 / 1 %) | 24 / 79 / 240 µm | 15 / 48 / 140 µm | 11 / 37 / 110 µm | 8.1 / 27 / 81 µm |
| PMOS minimal / moderate / exceptional | 14 / 47 / 142 µm | 8.6 / 29 / 86 µm | 6.6 / 22 / 66 µm | 4.9 / 16 / 49 µm |

Thin oxide wins both tables: $A_{VT}$ scales with $t_{ox}$ (Hastings Rule 6: use the thinnest-oxide device the circuit allows, cascode it if it needs voltage).

> [!note]- Check: reproducing the 1.8 V row of Table 13.4
> At 1.8 V and 4.5 MV/cm, $t_{ox} = 1.8/(4.5\times10^6\ \text{V/cm}) = 4$ nm, so $A_{VT}\approx4$ mV·µm. Moderate is ±3 mV at 6σ, so $\sigma = 0.5$ mV and $WL = (4/0.5)^2 = 64$ µm². Minimal: $\sigma = 10/6 = 1.67$ mV, $WL = 5.8$ µm². Exceptional: $\sigma = 1/6$ mV, $WL = 576$ µm². The table spends the whole spec on random mismatch.

> [!example] Worked example: a ±3 mV input pair, 1.8 V devices (built on Hastings Tables 13.4 and §13.2)
> **Spec.** Op-amp input offset ≤ 3 mV over lifetime and temperature, 6σ: Hastings' *moderate* class.
>
> **1. Budget.** Reserve 0.5 mV for systematic residue (gradients, LOD, WPE, metal), so $6\sigma_{rand}\le2.5$ mV, $\sigma_{rand}\le0.42$ mV. Split it between the input pair and the load mirror referred to the input: $0.35^2 + 0.23^2 \approx 0.42^2$, so the pair gets $\sigma_{\Delta V_{TH}} = 0.35$ mV and the load (after scaling by $g_{m,P}/g_{m,N}$) gets 0.23 mV.
>
> **2. Area.** $A_{VT}\approx4$ mV·µm (4 nm oxide): $WL \ge (4/0.35)^2 = 131$ µm² per input device, about twice Hastings' 64 µm² because of the systematic reserve.
>
> **3. Shape.** Halo-implanted devices stop improving with $L$ past a micron or two (Hastings Eq. 13.50, Rule 5), so keep $L\approx1$ µm and take the area in width: $W\approx131$ µm, split into 8 fingers of about 16 µm per device ($g_m/I_D$ then follows from $I_D$; see [[gm-ID Design Methodology]]). Splitting into fingers does not change random mismatch: the variance per finger rises $n$-fold but each finger carries $1/n$ of the current (Drennan & McAndrew §III-C).
>
> **4. Why the pattern is not optional.** With $dV_{TH}/dT\approx-2$ mV/°C (Hastings p. 705), two devices placed side by side with centroids $d_{cc}=20$ µm apart eat the whole 0.5 mV systematic reserve at a thermal gradient of only $0.5/(2\times20) = 0.0125$ °C/µm. A common-centroid pattern makes $d_{cc}=0$.
>
> **5. Pattern and rules (moderate class).** Cross-coupled AB/BA of 4-finger groups (nearly square, Rule 9-10); one full dummy at each end because $L<3$ µm, moat extended ≥ 5 µm past the last active gate (Rule 12); well edge ≥ 3 µm from any active gate (Rule 19); no metal and no field plate over the gates, dummy fill blocked (Rules 17-18); gates strapped in metal, gate ends extended 1-2 µm (Rules 21-22); array in the low-stress interior of the die (Rule 13). Each rule is justified in Levels 1-4.

## Level 0: Random vs Systematic

### Mean and Spread

```tikz title="Measured mismatch of many units. The mean is the systematic part (the same on every unit), the standard deviation is the random part. Hastings quotes six-sigma limits. After Hastings Fig. 8.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-0.3,0) -- (10.3,0) node[right] {mismatch $\delta$};
  \draw[->] (0,0) -- (0,3.2) node[above] {units};
  \draw[dotted] (3,0) -- (3,3.0);
  \node[below,font=\scriptsize] at (3,0) {0};
  \draw[thick,domain=1.2:9.6,samples=80,blue!70!black] plot (\x,{2.6*exp(-((\x-5.4)^2)/(2*0.7^2))});
  \draw[dashed] (5.4,0) -- (5.4,2.8);
  \node[below,font=\scriptsize] at (5.4,0) {$\mu$};
  \draw[<->] (3,2.95) -- (5.4,2.95) node[midway,above,font=\scriptsize] {systematic: layout removes};
  \draw[<->] (5.4,1.58) -- (6.1,1.58) node[right,font=\scriptsize] {$\sigma$: area removes};
  \draw[dashed,red] (1.2,0) -- (1.2,1.2) node[above,font=\scriptsize] {LDL $=\mu-6\sigma$};
  \draw[dashed,red] (9.6,0) -- (9.6,1.2) node[above,font=\scriptsize] {UDL $=\mu+6\sigma$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\delta = \frac{x_1/x_2}{m_1/m_2}-1}\qquad\boxed{\text{UDL, LDL} = \mu\pm6\sigma}
$$

$x$ are measured values, $m$ intended values; $\delta$ is a ratio error, so it applies to unequal devices too. **Mismatch is an accuracy figure** (distance from the ideal 0%), not a precision figure.

> [!note]- Detail: measuring mismatch without fooling yourself (Hastings §8.1)
> - Take at least 30 units (a convention with little theory behind it), from several wafers spread through the lot, from random die positions but not the extreme wafer edge, and not from reworked wafers.
> - Keep the sign of every $\delta$: the mean is the systematic part.
> - Package the samples in production leadframe and mold compound, since packaging adds its own shift (see [[#Mechanical Stress and Package Shift]]).
> - Example of a systematic mismatch: two poly resistors with one contact at each end; the contact resistance is a fixed add-on, so the ratio of a 2:1 pair is off by a few percent on *every* unit. Building the larger one as two series copies of the smaller makes the error vanish.

### Random Variation: Area and Periphery

```tikz title="Random variation has an areal part (fluctuations everywhere inside the device) and a peripheral part (edge roughness). Big devices average more of both. After Hastings Eqs. 8.6-8.10 and Drennan & McAndrew Fig. 1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=green!25] plot[smooth,tension=0.6] coordinates {(0,0) (0.6,0.05) (1.2,-0.06) (1.8,0.04) (2.4,-0.03) (3,0)} -- plot[smooth,tension=0.6] coordinates {(3,0) (3.05,0.6) (2.95,1.2) (3.04,1.8) (3,2)} -- plot[smooth,tension=0.6] coordinates {(3,2) (2.4,2.06) (1.8,1.95) (1.2,2.05) (0.6,1.96) (0,2)} -- plot[smooth,tension=0.6] coordinates {(0,2) (-0.05,1.4) (0.04,0.8) (-0.03,0.3) (0,0)};
  \foreach \x/\y in {0.4/0.5,1.1/1.4,1.7/0.7,2.3/1.6,2.6/0.4,0.8/1.1,1.9/1.2,0.5/1.7,2.4/1.0,1.3/0.3} \fill[blue!60] (\x,\y) circle (0.05);
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {dots: dopant / oxide fluctuations (areal)\\ wiggles: edge roughness (peripheral)};
  \begin{scope}[xshift=5.2cm]
    \draw[->] (0,0) -- (5.2,0) node[right] {$1/\sqrt{A}$};
    \draw[->] (0,0) -- (0,2.6) node[above] {$s$};
    \draw[thick,blue!70!black] (0,0) -- (4.6,2.2) node[right,font=\scriptsize,yshift=-4pt] {areal only: $k_A/\sqrt A$};
    \draw[thick,dashed,red!70!black,domain=0:4.6,samples=40] plot (\x,{sqrt((0.478*\x)^2+0.12*\x*\x*\x/4)});
    \node[font=\scriptsize,red!70!black,anchor=west] at (4.75,2.8) {+ periphery: small devices worse};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{s_\delta = \sqrt{\frac{k_A^2}{A}+\frac{k_P^2}{P}}\ \xrightarrow{\ \text{large devices}\ }\ \frac{k_A}{\sqrt A}}\qquad\boxed{s_\delta = k\sqrt{\frac{1}{2A_1}+\frac{1}{2A_2}}}
$$

- Equal devices of active area $A$ and perimeter $P$ (Hastings 8.9-8.10). The areal form is Pelgrom's law.
- **The smaller of two unequal devices dominates.** For large ratios, build the small one from several units (resistors: parallel; capacitors: avoid series; MOS: series units on the small side, parallel on the large side, e.g. a 20:1 mirror as 4 series units against 5 parallel units, Hastings Fig. 13.41).
- MOS peripheral (edge) effects matter mostly below about 1 µm in $W$ or $L$: keep both dimensions above about 1 µm (Hastings Rule 11).

> [!tip] Remark
> For MOSFETs this is $\sigma_{\Delta V_{TH}} = A_{VT}/\sqrt{WL}$ and $\sigma_{\Delta\beta/\beta} = A_\beta/\sqrt{WL}$, with the measured constants, the pocket-implant break and Pelgrom's full model in [[Nonlinearity and Mismatch#Where Mismatch Comes From Averaging]]. Drennan & McAndrew's warning that $V_{TH}$ and $\beta$ are the wrong parameters to characterize is in [[Nonlinearity and Mismatch#Level 5 Mismatch Beyond the Square Law]].

> [!note]- Detail: what sets $A_{VT}$ and the MOS-specific breaks in Pelgrom's law (Hastings §13.2.1)
> - $V_{TH}$ variation is mostly the random count of backgate dopants; more total doping means more mismatch, which is why native (unadjusted) devices often match better.
> - Empirically $A_{VT}\approx1$ mV·µm per nm of gate oxide (e.g. 15 nm oxide → about 15 mV·µm); Schaper's three processes fit this: 19, 8.75, 6.7 mV·µm at 15, 7.5, 5.5 nm. Treat it as a rough guide.
> - **Backgate bias** adds its own variable term: 2 V of $V_{SB}$ on a 5 V device raises $A_{VT}$ about 30%. Keep matched devices at $V_{SB}=0$ where you can.
> - **Pocket (halo) implants:** $\sigma = c_{VT}/\sqrt{W\min(L,L_c)}$ with $L_c$ a micron or two: past $L_c$ only $W$ helps. Analog processes often offer a no-pocket "analog" device for current matching.
> - **PMOS vs NMOS:** several authors report 30-50% more $\beta$ mismatch in PMOS; others find the opposite in some processes. Under *current* bias PMOS often looks better because its lower mobility forces a larger $V_{GS}-V_{TH}$ (Drennan & McAndrew Table II). Check the process data in the application's bias.
> - **Polysilicon gate effects:** an incompletely annealed gate leaves partially depleted grains, and an over-annealed one lets dopant penetrate the oxide at grain boundaries; both raise random $V_{TH}$ mismatch (Hastings Fig. 13.48). Process-owned; nothing to draw.

### Distance: the Long-Range Term

```tikz title="Total mismatch of two identical devices versus their spacing x (130 nm data, Schaper & Linnenbank Table 1). The pair term is flat; the distance term grows linearly. Small devices have the larger slope, but the crossing distance is in millimetres for both, which is why adjacent matched devices only see the pair term."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.6,0) node[right] {$x$ [mm]};
  \draw[->] (0,0) -- (0,4.5) node[above] {$\sigma_{\Delta V_{GS}}$ [mV]};
  \foreach \x in {0,2,4,6,8,10} \draw ({0.8*\x},0) -- ({0.8*\x},-0.08) node[below,font=\scriptsize] {\x};
  \foreach \y in {0,5,10,15,20} \draw (0,{0.2*\y}) -- (-0.08,{0.2*\y}) node[left,font=\scriptsize] {\y};
  \draw[thick,red!70!black,domain=0:10,samples=50] plot ({0.8*\x},{0.2*sqrt(12.1*12.1+1.63*1.63*\x*\x)});
  \draw[dashed,red!70!black] (0,2.42) -- (8,2.42);
  \draw[thick,blue!70!black,domain=0:10,samples=50] plot ({0.8*\x},{0.2*sqrt(3.71*3.71+0.644*0.644*\x*\x)});
  \draw[dashed,blue!70!black] (0,0.742) -- (8,0.742);
  \fill[red!70!black] ({0.8*7.42},{0.2*12.1*1.414}) circle (0.06);
  \fill[blue!70!black] ({0.8*5.76},{0.2*3.71*1.414}) circle (0.06);
  \node[font=\scriptsize,red!70!black,anchor=west] at (0.2,3.9) {$W/L = 1.6/0.12$: $A$-term 12.1 mV, $S_D$ = 1.63 mV/mm};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (0.2,1.5) {$W/L = 3.2/0.48$: 3.71 mV, 0.644 mV/mm};
  \node[font=\scriptsize,align=left,anchor=west] at (4.6,0.35) {dots: distance term = pair term\\ (7.4 mm and 5.8 mm)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\sigma_{\Delta P}^2 = \frac{A_P^2}{WL}+S_P^2D^2}\qquad\boxed{D^* = \frac{A_P}{S_P\sqrt{WL}}}
$$

$D^*$ is the spacing at which the distance term equals the pair term. The pair (local) term is random dopant and edge statistics; the distance term is the sum of all gradients over the die and across the wafer (Pelgrom; Schaper & Linnenbank).

- **Adjacent devices see only the pair term.** Pelgrom measured $S_{VT0}\approx4$ µV/µm in his 2.5 µm process; it mattered only for large devices spaced far apart.
- **Distance matters for short-channel transistors and narrow resistors over millimetres:** Schaper et al. found the long-distance mismatch larger than the pair mismatch beyond about 1 mm for those devices, while long-channel transistors and wide resistors showed no significant distance effect.
- **It is not always linear and not always one-directional.** Some chips showed a quadratic dependence over a few mm (which no linear trick cancels), and narrow resistors oriented perpendicular to the wafer flat showed a dominant distance effect that the same resistors parallel to the flat did not.
- **Fix:** keep matched devices adjacent; where they must be far apart (resistor-string references, flash-ADC comparators, distributed current sources) use longer and wider devices than the pair spec alone needs, and distribute bias as a current ([[#Wiring Resistance and Reference Distribution]]).

> [!note]- Detail: the 130 nm numbers (Schaper & Linnenbank, Table 1)
> | Device | Dimensions | Pair $\sigma_{\Delta P}$ | Distance $S_D$ |
> |---|---|---|---|
> | Poly resistor | $W$ = 0.2 µm, $L$ = 6 µm | 1.55 % | 0.212 %/mm |
> | Poly resistor | 0.2 / 3.0 | 2.20 % | 0.205 %/mm |
> | Poly resistor | 0.5 / 6.0 | 0.982 % | 0.185 %/mm |
> | Poly resistor | 1.0 / 6.0 | 0.694 % | 0.163 %/mm |
> | Poly resistor | 1.0 / 12.0 | 0.491 % | 0.163 %/mm |
> | nMOS | $L$ = 0.12, $W$ = 1.6 | 12.1 mV | 1.63 mV/mm |
> | nMOS | 0.24 / 1.6 | 7.42 mV | 0.780 mV/mm |
> | nMOS | 0.24 / 12.8 | 2.62 mV | 0.941 mV/mm |
> | nMOS | 0.48 / 1.6 | 5.25 mV | 0.582 mV/mm |
> | nMOS | 0.48 / 3.2 | 3.71 mV | 0.644 mV/mm |
>
> $S_D^2$ rose roughly in proportion to $1/L_{eff}^2$ for the transistors and depended only weakly on width for the resistors. Note that widening a resistor shrinks the pair term much more than the distance term, so the *wide* resistor reaches $D^*$ sooner (1.0/12 µm: $0.491/0.163 = 3.0$ mm) even though its total mismatch is lower at every distance.
>
> **The same paper is a warning about wiring:** without force/sense compensation, the 90 mΩ/□ interconnect of the test chip dropped 8.3 mV/mm at 320 µA, enough to make the raw data misleading (Schaper et al. Fig. 5). Real circuits have the same problem.

## Level 1: Gradients and the Centroid

### Gradient Error Is Proportional to Centroid Spacing

```tikz title="A linear gradient across two devices. Each device behaves as if it sat at its centroid; the error is the gradient times the centroid spacing. After Hastings Eqs. 8.23 and 13.57, Figs. 8.13-8.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \shade[left color=blue!8,right color=red!30] (0,0) rectangle (9,3.2);
  \foreach \x in {1,2.5,4,5.5,7,8.5} \draw[gray,dashed] (\x,0) -- (\x,3.2);
  \node[font=\scriptsize,gray] at (8.5,3.4) {isotherms};
  \draw[fill=green!45,draw=black!60] (1.6,0.9) rectangle (3.2,2.3); \node at (2.4,1.6) {A};
  \draw[fill=green!45,draw=black!60] (5.4,0.9) rectangle (7.0,2.3); \node at (6.2,1.6) {B};
  \draw[very thick,orange!80!black] (2.3,1.2) -- (2.5,1.4) (2.3,1.4) -- (2.5,1.2);
  \draw[very thick,orange!80!black] (6.1,1.2) -- (6.3,1.4) (6.1,1.4) -- (6.3,1.2);
  \draw[<->] (2.4,0.5) -- (6.2,0.5) node[midway,below,font=\scriptsize] {$d_{cc}$};
  \draw[->,thick,red!70!black] (0.3,-0.45) -- (8.7,-0.45) node[midway,below,font=\scriptsize] {$\nabla T$ (or stress, $t_{ox}$): perpendicular to the isotherms};
  \node[font=\scriptsize,align=left,anchor=west] at (9.3,2.4) {four knobs:};
  \node[font=\scriptsize,align=left,anchor=west] at (9.3,1.5) {1. smaller $\alpha$ (material)\\ 2. smaller $\nabla$ (placement)\\ 3. $d_{cc}\perp\nabla$ (orientation)\\ 4. $d_{cc}\to0$ (common centroid)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta P = \alpha\,P\,d_{cc}\,\nabla T_{cc}}
$$

$\alpha$: linear temperature coefficient of parameter $P$; $P$: value at the midpoint; $d_{cc}$: centroid spacing; $\nabla T_{cc}$: gradient along the line joining the centroids. The same form holds for any gradient (stress, oxide thickness, doping).

> [!note]- Why: a device acts as if it sat at its centroid (Hastings §8.2.7)
> Assume (1) the device is a set of planar active regions, (2) every part of the active area contributes equally and nothing outside it contributes, (3) the parameter is linear in temperature and (4) temperature is linear in position. Then the device's average temperature is the temperature at the centroid of its active area. The centroid lies on every axis of symmetry (*centroidal symmetry*), so for rectangles, dogbones and symmetric multi-segment devices you find it by eye. For an arbitrary series-parallel resistor network, Hastings Eqs. 8.24-8.25 weight each segment's centroid by its share of the total.

### Cancelling a Linear Gradient: the Arithmetic

```tikz title="Four unit tiles in a linear gradient of 0, 1, 2, 3 (units of g). Sum the tiles of each device: side by side differs by 4g, alternating by 2g, mirror-symmetric ABBA by zero. After Razavi Fig. 19.20 and Hastings Fig. 8.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \row/\pat/\name/\res in {0/{A/white,A/white,B/gray!35,B/gray!35}/{AABB (side by side)}/{A = 0+1 = 1,\ B = 2+3 = 5:\ \ \textbf{4g}},-1.3/{A/white,B/gray!35,A/white,B/gray!35}/{ABAB (alternating)}/{A = 0+2 = 2,\ B = 1+3 = 4:\ \ \textbf{2g}},-2.6/{A/white,B/gray!35,B/gray!35,A/white}/{ABBA (common centroid)}/{A = 0+3 = 3,\ B = 1+2 = 3:\ \ \textbf{0}}} {
    \node[anchor=east,font=\scriptsize] at (-0.2,{\row+0.4}) {\name};
    \foreach \t/\col [count=\i from 0] in \pat {
      \draw[fill=\col] ({1.0*\i},\row) rectangle ({1.0*\i+0.9},{\row+0.8});
      \node at ({1.0*\i+0.45},{\row+0.4}) {\t};
      \node[font=\scriptsize,red!70!black] at ({1.0*\i+0.45},{\row-0.15}) {\i};
    }
    \node[anchor=west,font=\scriptsize] at (4.2,{\row+0.4}) {\res};
  }
  \draw[->,thick,red!70!black] (0,-3.35) -- (3.9,-3.35) node[right,font=\scriptsize] {gradient: tile value $= g\cdot$ position};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{common centroid} \Rightarrow c_1 = 0\ \text{in}\ F(x) = c_0 + c_1(x-a) + c_2(x-a)^2+\dots}
$$

- **ABBA beats ABAB beats AABB** (Hastings: "favor ABBA over ABAB, and ABAB over AABB"). ABAB is not common-centroid: its centroids are one pitch apart.
- ABBA puts both A's on the ends, so it **needs dummies** ([[#Etch, Lithography and Dummies]]); ABAB does too, since its two ends still face different neighbours.
- Cancellation needs both devices made of **identical units**; a segment that counts differently (series vs parallel) must be mirrored with its own kind.

### The Quadratic Residue: Why Compact and Dispersed

```tikz title="A pure quadratic gradient h*x^2 (x measured from the array centre, pitch 1). ABBA leaves 4h. Over eight tiles, one big ABBA-like group (AABBBBAA) leaves 32h, two small ABBA sub-arrays (ABBAABBA) leave 8h: the residue scales with the square of the span of each common-centroid sub-array."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,domain=-4:4,samples=50,red!70!black] plot ({\x},{0.08*\x*\x+0.5});
  \node[font=\scriptsize,red!70!black] at (4.6,1.8) {$h x^2$};
  \foreach \row/\pat/\name/\res in {-1.0/{A/white,A/white,B/gray!35,B/gray!35,B/gray!35,B/gray!35,A/white,A/white}/{AABBBBAA}/{A: 12.25+6.25+6.25+12.25 = 37; B: 2.25+0.25+0.25+2.25 = 5: \textbf{32h}},-2.3/{A/white,B/gray!35,B/gray!35,A/white,A/white,B/gray!35,B/gray!35,A/white}/{ABBAABBA}/{A: 12.25+0.25+0.25+12.25 = 25; B: 6.25+2.25+2.25+6.25 = 17: \textbf{8h}}} {
    \node[anchor=east,font=\scriptsize] at (-4.1,{\row+0.4}) {\name};
    \foreach \t/\col [count=\i from 0] in \pat {
      \draw[fill=\col] ({\i-4+0.05},\row) rectangle ({\i-4+0.95},{\row+0.8});
      \node at ({\i-3.5},{\row+0.4}) {\t};
    }
    \node[anchor=west,font=\scriptsize] at (-4.1,{\row-0.35}) {\res};
  }
  \foreach \i in {0,...,7} \pgfmathsetmacro{\v}{(\i-3.5)*(\i-3.5)} \node[font=\scriptsize,red!70!black] at ({\i-3.5},0.1) {\pgfmathprintnumber[fixed,precision=2]{\v}};
  \node[font=\scriptsize,anchor=west] at (4.3,0.1) {tile values};
\end{circuitikz}
\end{document}
```

**The four rules of common-centroid layout** (Hastings Table 8.4; the fifth, for MOS, is Table 13.2):

1. **Coincidence:** the centroids coincide (at least approximately). Non-negotiable: it kills the linear term.
2. **Symmetry:** the array is symmetric about both axes. The simplest reliable way to get coincidence.
3. **Dispersion:** split a big array into as many small sub-arrays as possible that each obey 1 and 2 (ABBAABBA over AABBBBAA).
4. **Compactness:** each array or sub-array as compact (square) as possible: the residue grows as its span squared.
5. **Orientation (MOS):** both devices have the same mix of left- and right-flowing sections ([[#Orientation and Implant Shadowing]]).

Dispersion costs area (every gap between sections is wasted), and less active area means more random mismatch. **With no gradient, a common-centroid array matches no better than a plain one**; test chips with no heat source and gentle packaging often show no benefit. Large thermal or stress gradients favour more dispersion; otherwise ABBA or AB/BA is the best trade.

> [!tip] Remark
> Building the arrays (patterns for ratios 2:1 to 5:4, $N^{th}$-order patterns that also cancel the quadratic term, routing, unit-capacitor DAC arrays) is the job of [[Common-Centroid Layout]].

> [!note]- Derivation: why the residue scales with span squared
> Expand the gradient about the common centroid $a$: $F(x) = c_0 + c_1(x-a) + c_2(x-a)^2+\dots$ Coincidence makes each device's sum of $(x_i-a)$ equal, so $c_1$ drops out of the difference. The $c_2$ term leaves $c_2\left[\sum_A(x_i-a)^2-\sum_B(x_i-a)^2\right]$, which scales with the square of the distances from the centroid, i.e. with the array span squared. If the array is made of sub-arrays that are each common-centroid, expand about each sub-centroid instead: the linear part of the *global* quadratic cancels inside each sub-array, and only each sub-array's own span enters.
>
> Exact numbers for the pure $hx^2$ in the figure: AABBBBAA leaves $32h$, ABBAABBA leaves $8h$, a factor of 4. Hastings states the dispersed array has "half" the residue, from the argument that each half-width sub-array has a quarter of the residue and there are two of them; summing the tiles exactly gives one quarter. Either way the direction is the same: more, smaller common-centroid groups.

### Two Dimensions: the Cross-Coupled Pair

```tikz title="A plane gradient g_x x + g_y y with g_x = 1, g_y = 2 over a 2x2 array. Rows AA/BB differ by 4; the cross-coupled AB/BA cancels both components. After Hastings Figs. 8.16, 13.59 and Razavi Fig. 19.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \xs/\ttl/\a/\ca/\b/\cb/\c/\cc/\d/\cd/\res in {0/{AA/BB (rows)}/A/white/A/white/B/gray!35/B/gray!35/{A = 2+3 = 5, B = 0+1 = 1: \textbf{4}},6.5/{AB/BA (cross-coupled)}/A/white/B/gray!35/B/gray!35/A/white/{A = 2+1 = 3, B = 3+0 = 3: \textbf{0}}} {
    \begin{scope}[xshift=\xs cm]
      \node[font=\scriptsize\bfseries] at (1.0,2.6) {\ttl};
      \foreach \t/\col/\x/\y/\v in {\a/\ca/0/1.1/2,\b/\cb/1.1/1.1/3,\c/\cc/0/0/0,\d/\cd/1.1/0/1} {
        \draw[fill=\col] (\x,\y) rectangle ({\x+1},{\y+1});
        \node at ({\x+0.5},{\y+0.55}) {\t};
        \node[font=\scriptsize,red!70!black] at ({\x+0.8},{\y+0.2}) {\v};
      }
      \node[font=\scriptsize,anchor=west] at (-0.2,-0.4) {\res};
    \end{scope}
  }
  \draw[->,thick,red!70!black] (2.6,0.2) -- (3.5,0.2) node[right,font=\scriptsize] {$x$};
  \draw[->,thick,red!70!black] (2.6,0.2) -- (2.6,1.1) node[above,font=\scriptsize] {$y$};
\end{circuitikz}
\end{document}
```

- The cross-coupled pair cancels a linear gradient in **any direction**. Finite-element work (Lan, Tammineedi & Geiger, via Hastings p. 709) puts the residue of AB/BA of square elements at about 60% of a linear ABBA of the same elements.
- What it leaves: the saddle term $xy$ (A sits on the $-xy$ diagonal, B on the $+xy$ one) and differences in $x^2$, $y^2$ curvature across larger arrays. Dispersion (AB/BA repeated: ABAB/BABA/...) and compactness shrink these.
- Use 2-D arrays when the sections are roughly square (wide, short voltage-matched pairs); long, thin current-matched devices usually interdigitate in one dimension along their width.

## Level 2: Die-Level Gradients

### Temperature and Heat Sources

```tikz title="One heat source on a heat-sunk die. Isotherms crowd near the source (large gradient) and spread out far away. Best placement: power device at one end on a die axis; matched array on the same axis, about halfway across the remaining die (a compromise with stress, which is worst at the edges). After Hastings Figs. 8.13 and 8.21(A)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=orange!8] (0,0) rectangle (9,5);
  \draw[dashed] (-0.3,2.5) -- (9.3,2.5) node[right,font=\scriptsize] {die axis};
  \begin{scope}
    \clip (0,0) rectangle (9,5);
    \foreach \r in {0.6,1.1,1.7,2.5,3.5,4.8,6.4} \draw[gray] (8.6,2.5) ellipse ({\r} and {0.9*\r});
  \end{scope}
  \draw[thick] (0,0) rectangle (9,5);
  \fill[black!30] (7.6,1.7) rectangle (8.9,3.3); \node[font=\scriptsize,align=center] at (8.25,2.5) {power\\ device};
  \draw[fill=green!45,draw=black!60] (2.2,2.15) rectangle (3.4,2.85); \node[font=\scriptsize] at (2.8,2.5) {ABBA};
  \node[font=\scriptsize,align=center,anchor=north] at (2.8,2.05) {good: on axis,\\ far, long side $\parallel$ isotherms};
  \draw[fill=green!45,draw=black!60] (6.0,3.6) rectangle (6.6,4.6); \node[font=\scriptsize,rotate=90] at (6.3,4.1) {A B};
  \node[font=\scriptsize,align=left,anchor=west] at (9.2,4.1) {bad: close, off axis,\\ $d_{cc}$ along $\nabla T$};
  \draw[->] (9.15,4.1) -- (6.7,4.1);
  \draw[->,red!70!black,thick] (5.8,1.2) -- (7.4,1.6) node[midway,below,font=\scriptsize] {large $\nabla T$};
  \draw[->,red!70!black] (0.8,0.6) -- (1.6,0.65) node[midway,below,font=\scriptsize] {small};
\end{circuitikz}
\end{document}
```

- **Packages with a thermal pad** extract heat vertically: regions far from the power device sit near board temperature, but **lateral gradients near the source are large**. Packages without one let the die run nearly isothermal at a high temperature, but **power steps send thermal transients across the die** as severe as static gradients.
- $V_{TH}$ falls about 2 mV/°C (the same as $V_{BE}$), nearly independent of bias, so voltage-matched MOS pairs need $d_{cc}=0$ near any heat source.
- **Placement (Hastings Rule 14, MOS; 13, resistors):** power devices on a die axis at one end; matched devices on the same axis at the other end, about three-quarters of the way from the centre to the far edge for exceptional matching on a power IC; consider a 2:1 (MOS: up to 3:1) die. As a guide keep about 1 µm of separation per mW of dissipation (half or a quarter of that usually suffices). Avoid the corners of a power device, where the gradient is neither horizontal nor vertical.
- Two power devices: one behind the other at one end, or one at each end with the matched devices in the middle (needs ≥ 0.5 mm separation; keeps a thermal axis of symmetry whatever the power split).

> [!note]- Detail: thermoelectric offsets and trimming over temperature
> **Seebeck voltage.** A resistor whose two contacts sit at different temperatures develops a contact-potential difference. Common centroid cannot cancel it (it is per segment); connect half the series segments in each direction so the voltages cancel, and keep a serpentine's two heads close together (Hastings Fig. 8.22-8.23, Rule 8.3.1-11). Hastings' example: 0.1 mV of thermoelectric offset is a 0.4% error in a bipolar mirror ($0.1/25.9$); MOS is less sensitive because of its lower $g_m$.
>
> **Trim works badly for MOS over temperature.** A bipolar pair's offset is all area mismatch, proportional to absolute temperature, so one trim nulls it at every temperature. A MOS pair's offset mixes $\Delta V_{TH}$ (roughly constant) with current-mismatch terms divided by a temperature-dependent $g_m$, so a room-temperature trim removes only about two-thirds of the over-temperature variation (Hastings Eqs. 13.59-13.60). The mitigation is a large input $g_m$ and small load $g_m$, so the offset is mostly $\Delta V_{TH}$; or autozero/chopping ([[Nonlinearity and Mismatch#Level 4 Offset Cancellation]]).

### Mechanical Stress and Package Shift

```tikz title="Where package stress gradients are small. The compressive stress is broad and flat in the middle and drops steeply toward the edges; gradients are worst along the edges and in the corners. Favoured spots for matched arrays lie on the die axes near the centre. After Hastings Figs. 8.26-8.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[red!14] (0,0) rectangle (6,6);
  \fill[white] (0.7,0.7) rectangle (5.3,5.3);
  \fill[green!15] (1.5,1.5) rectangle (4.5,4.5);
  \foreach \x/\y in {0/0,5/0,0/5,5/5} \fill[red!40] (\x,\y) rectangle ({\x+1},{\y+1});
  \draw[thick] (0,0) rectangle (6,6);
  \draw[dashed] (3,-0.3) -- (3,6.3); \draw[dashed] (-0.3,3) -- (6.3,3);
  \foreach \x/\y in {3/3,3/4.1,3/1.9,1.9/3,4.1/3} \draw[fill=green!45] ({\x-0.3},{\y-0.2}) rectangle ({\x+0.3},{\y+0.2});
  \node[font=\scriptsize,align=left,anchor=west] at (6.4,5.6) {corners: worst, never};
  \node[font=\scriptsize,align=left,anchor=west] at (6.4,4.7) {edge band: avoid; minimal \\ class $\geq$ 50--100 µm in,\\ moderate $\geq$ 100--250 µm};
  \node[font=\scriptsize,align=left,anchor=west] at (6.4,3.0) {middle of a long side:\\ acceptable for moderate};
  \node[font=\scriptsize,align=left,anchor=west] at (6.4,1.6) {centre out to about half\\ way: broad low-gradient region;\\ best on the axes};
  \begin{scope}[xshift=11.2cm,yshift=1.2cm]
    \draw[->] (0,0) -- (4,0) node[right,font=\scriptsize] {position A--A};
    \draw[->] (0,0) -- (0,3) node[above,font=\scriptsize] {$|\sigma_{min}|$};
    \draw[thick,domain=0:3.6,samples=60] plot (\x,{2.4-1.9*((\x-1.8)/1.8)^4});
    \node[font=\scriptsize,align=center] at (1.8,2.75) {flat: small gradient};
    \node[font=\scriptsize,align=center] at (0.35,0.25) {steep};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\Delta k}{k}\approx-\left(\pi_L\sigma_L+\pi_T\sigma_T+\pi_{LT}\tau_{LT}\right)}
$$

- **Where stress comes from:** the mold compound cures hot and shrinks more than silicon on cooling, so the die is compressed, most in the centre. Rigid die attach (solder, gold eutectic, silver sinter) and chip-scale bumps add more. Matching cares about stress **gradients**, which are smallest in the centre, larger toward the edges, largest in the corners.
- **MOS: stress moves mobility ($k$), not $V_{TH}$.** On (100) silicon, NMOS is least stress-sensitive with its channel along the layout x or y axes (⟨110⟩), PMOS along the diagonals (⟨100⟩, 45°). Diagonal PMOS is hard to draw and often illegal; consider it only for exceptional matching under heavy stress (Rule 24).
- **Rotated devices mismatch by several percent** in current; tilted (off-axis) wafers can make even "equivalent" rotations differ by up to 5% (Hastings p. 689). Same orientation always.
- **Filler particles** in the mold compound add *random* package shift; older compounds produced mismatch with σ up to 2%. Polyimide or silicone overcoats (thicker than the filler size) and low-stress compound help; layout can only spread a device over several sites far apart, or build spares and select after packaging.
- **Bumped dice:** stress gradients peak at the perimeters of bumps or pillars and dip at their centres and halfway between them; moderate-class devices can sit well inside a bump's footprint or on the axis between two bumps (Rule 13).

| MOS channel piezo coefficients, ×10⁻¹¹ Pa⁻¹ (Hastings Table 13.1) | PMOS $\pi_L$ | PMOS $\pi_T$ | NMOS $\pi_L$ | NMOS $\pi_T$ |
|---|---|---|---|---|
| ⟨100⟩ direction on (100) | −15 | 30 | −90 | 40 |
| ⟨110⟩ direction on (100) (layout x/y) | 65 | −50 | −30 | −20 |

> [!note]- Detail: package shift over time and temperature (Hastings §8.2.8)
> - Package shifts depend strongly on temperature, so a room-temperature trim leaves an over-temperature error comparable to the original. Two-temperature trim helps but not with long-term drift.
> - **Drift mechanisms:** viscoelastic stress relaxation in the mold compound (mostly in the first hour or two at high temperature), continued curing of under-cured epoxy, and moisture absorption (the compound swells and relaxes the compression; baking reverses it). **Thermal hysteresis:** after a hot excursion the shift does not fully return for hours.
> - **Die aspect ratio** (Table 8.8): prefer 1.5:1 or less in plastic or with solder attach; elongated dice see more stress. Larger dice see more stress than small ones.
> - **Capacitors** are much less stress-sensitive than resistors (dimensional and permittivity changes largely cancel), but still use common centroid. Poly and thin-film resistors are less piezoresistive than monocrystalline silicon; see [[Resistor#Layout]].

### Oxide Thickness and Doping Gradients

Process gradients used to matter; modern processing has made them minor. One measured case: a 25 nm dry oxide varied 5% from wafer edge to centre; as a linear radial gradient across 200 mm that is only 0.5 ppm/µm (Hastings p. 704). Poly thickness and oxide thickness gradients are handled by the same interdigitation and dispersion that handle temperature and stress; diffusion gradients appear to have little effect today (Hastings p. 399).

> [!tip] Remark
> The whole of Level 2 reduces to $\Delta P = \alpha P d_{cc}\nabla$ from [[#Gradient Error Is Proportional to Centroid Spacing]]: placement lowers $\nabla$, orientation and material lower $\alpha$, the pattern lowers $d_{cc}$. Bipolar specifics (piezojunction effect, which BJT to use on (100) silicon) are in [[BJTs#Placement on the Die]].

## Level 3: The Device's Neighbours

### Etch, Lithography and Dummies

```tikz title="Poly microloading: an edge gate faces open field on one side and is over-etched there, so it comes out shorter (exaggerated). Full dummies give every active gate an identical neighbour; half dummies save area when L is long. After Hastings Fig. 13.45."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \node[font=\scriptsize\bfseries] at (1.6,2.9) {(a) no dummies};
    \draw[fill=green!45,draw=black!60] (0,0) rectangle (3.2,2);
    \draw[fill=red!65] (0.75,-0.3) rectangle (0.83,2.3);
    \draw[fill=red!65] (1.52,-0.3) rectangle (1.68,2.3);
    \draw[fill=red!65] (2.37,-0.3) rectangle (2.45,2.3);
    \node[font=\scriptsize] at (0.79,2.55) {M1}; \node[font=\scriptsize] at (1.6,2.55) {M2}; \node[font=\scriptsize] at (2.41,2.55) {M3};
    \draw[<-,orange!80!black] (0.72,1.0) -- (-0.4,1.0);
    \draw[<-,orange!80!black] (2.48,1.0) -- (3.6,1.0);
    \node[font=\scriptsize,align=center] at (1.6,-0.75) {outer edges over-etched:\\ $L_1, L_3 < L_2$};
  \end{scope}
  \begin{scope}[xshift=4.8cm]
    \node[font=\scriptsize\bfseries] at (2.0,2.9) {(b) full dummies};
    \draw[fill=green!45,draw=black!60] (0,0) rectangle (4.0,2);
    \foreach \x/\f/\l in {0.4/red!25/D,1.2/red!65/M1,2.0/red!65/M2,2.8/red!65/M3,3.6/red!25/D} {\draw[fill=\f] ({\x-0.08},-0.3) rectangle ({\x+0.08},2.3); \node[font=\scriptsize] at (\x,2.55) {\l};}
    \node[font=\scriptsize,align=center] at (2.0,-0.75) {same gate spacing, width,\\ and end extension};
  \end{scope}
  \begin{scope}[xshift=10.4cm]
    \node[font=\scriptsize\bfseries] at (1.6,2.9) {(c) half dummies};
    \draw[fill=green!45,draw=black!60] (0.5,0) rectangle (2.7,2);
    \foreach \x/\l in {0.9/M1,1.6/M2,2.3/M3} {\draw[fill=red!65] ({\x-0.08},-0.3) rectangle ({\x+0.08},2.3); \node[font=\scriptsize] at (\x,2.55) {\l};}
    \draw[fill=red!25] (0.15,-0.3) rectangle (0.6,2.3); \draw[fill=red!25] (2.6,-0.3) rectangle (3.05,2.3);
    \node[font=\scriptsize] at (0.37,2.55) {D}; \node[font=\scriptsize] at (2.83,2.55) {D};
    \node[font=\scriptsize,align=center] at (1.6,-0.75) {one S/D only, field under\\ part of the poly; $L>$ 3--5 µm};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Microloading:** etch rate depends on the surrounding openings, so the edges facing open field recede further (iso-dense etch bias). Lithography adds iso-dense print bias below roughly twice the minimum feature. Both make the **outermost** element of any array different.
- **Dummy gates:** same spacing to the active gate as between active gates, same width (moat-defined), same extension past the moat. Their length need only cover the microloading range, about 3-5 µm (up to 10 µm for exceptional matching); if active $L$ is shorter than that, dummies must be the same $L$, and possibly several. Tie dummy gates off (to the backgate potential) to keep them in cutoff.
- **Corner rounding:** extend every gate (and dummy) 1-2 µm past the moat, all by the same amount (Rule 21). Join gate fingers with metal, not a poly comb, for moderate and exceptional matching (Rule 22; a comb is acceptable if its bar is 1-2 µm from the moat).
- **Keep foreign poly away:** block automatic dummy poly within 5-10 µm of exceptionally matched devices (3-5 µm for moderate; Rule 23).
- **Topography:** in double-poly processes, poly-0 capacitor plates disturb the resist spin and have caused up to 12% MOS mismatch at more than 30 µm; keep matched transistors at least 150 µm away (Hastings p. 693).

> [!tip] Remark
> Resistors and capacitors need the same dummy discipline for the same reason (a dummy resistor or dummy unit-capacitor ring); their versions and dimensions are in [[Resistor#Layout]] and [[Capacitor#Layout]]. The first-finger effect in multi-finger LDMOS (outer fingers differ by up to 10%) is the same mechanism in a power device: a sense-FET must never be an outermost finger.

### Orientation and Implant Shadowing

```tikz title="Top: same orientation matches; a rotated copy does not (stress anisotropy, H-V lithography bias); a mirrored drain-extended device does not either, because its channel length is set by two different masks. Bottom: the ~7 degree tilted S/D implant shadows one side of every gate, so source and drain differ; gate-aligned devices keep the shadow on the same terminal. After Hastings Figs. 13.43, 13.44, 13.58 and Razavi Figs. 19.13-19.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{mos/.pic={\draw[fill=green!45,draw=black!60] (-0.5,-0.35) rectangle (0.5,0.35); \draw[fill=red!65] (-0.07,-0.55) rectangle (0.07,0.55); \fill (-0.35,-0.06) rectangle (-0.23,0.06); \fill (0.23,-0.06) rectangle (0.35,0.06);}}
  \node[font=\scriptsize\bfseries] at (1.0,1.2) {same orientation};
  \pic at (0.4,0.2) {mos}; \pic at (1.7,0.2) {mos};
  \node[font=\scriptsize,green!50!black] at (1.0,-0.65) {matches};
  \node[font=\scriptsize\bfseries] at (4.5,1.2) {rotated 90°};
  \pic at (3.9,0.2) {mos}; \pic[rotate=90] at (5.2,0.2) {mos};
  \node[font=\scriptsize,red!70!black,align=center] at (4.5,-0.75) {mobility differs\\ under stress};
  \node[font=\scriptsize\bfseries] at (8.6,1.2) {drain-extended, mirrored};
  \begin{scope}[xshift=7.4cm]
    \draw[dashed,draw=cyan!50!black,fill=cyan!18] (0.15,-0.45) rectangle (0.95,0.45);
    \draw[fill=green!45,draw=black!60] (-0.6,-0.3) rectangle (0.9,0.3);
    \draw[fill=red!65] (-0.05,-0.55) rectangle (0.3,0.55);
    \draw[dashed,draw=cyan!50!black,fill=cyan!18] (2.05,-0.45) rectangle (2.85,0.45);
    \draw[fill=green!45,draw=black!60] (2.1,-0.3) rectangle (3.6,0.3);
    \draw[fill=red!65] (2.7,-0.55) rectangle (3.05,0.55);
    \draw[->,thick] (0.7,0.75) -- (1.3,0.75) node[right,font=\scriptsize] {mask shift};
    \node[font=\scriptsize,red!70!black,align=center] at (1.5,-0.85) {one $L$ grows, the other shrinks};
  \end{scope}
  % cross-section
  \begin{scope}[yshift=-3.6cm]
    \fill[orange!12] (0,0) rectangle (7,1.2);
    \draw (0,1.2) -- (7,1.2);
    \draw[fill=red!65] (3.0,1.2) rectangle (4.0,1.6);
    \fill[green!45] (0.8,1.2) -- (3.0,1.2) -- (3.0,0.8) .. controls (2.3,0.65) and (1.4,0.65) .. (0.8,0.8) -- cycle;
    \fill[green!45] (4.3,1.2) -- (6.2,1.2) -- (6.2,0.8) .. controls (5.6,0.65) and (4.9,0.65) .. (4.3,0.8) -- cycle;
    \foreach \x in {0.6,1.2,1.8,2.4,4.6,5.2,5.8,6.4} \draw[->,blue!70!black] ({\x+0.25},2.6) -- (\x,1.25);
    \draw[->,blue!70!black] (3.35,2.6) -- (3.1,1.65);
    \fill[gray!40,opacity=0.6] (4.0,1.2) -- (4.3,1.2) -- (4.3,1.18) -- (4.0,1.18);
    \draw[<-] (4.15,1.15) -- (5.0,0.35) node[right,font=\scriptsize] {shadowed strip};
    \node[font=\scriptsize] at (1.9,0.95) {n+};
    \node[font=\scriptsize] at (5.25,0.95) {n+};
    \node[font=\scriptsize,anchor=west] at (7.2,2.0) {implant tilted to avoid channeling};
    \node[font=\scriptsize,align=left,anchor=west] at (7.2,1.1) {source side $\neq$ drain side;\\ fix: give A and B the same\\ mix of left- and right-flowing\\ sections, $\Phi_A=\Phi_B$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Phi = \frac1N\sum_{i=1}^N\Phi_i,\qquad\Phi_i=\pm1\ \text{(current right / left)},\qquad\Phi_A = \Phi_B}
$$

- **Same orientation, always** (Rule 7). Rotating one cell that holds one device of a pair during top-level assembly silently breaks this: keep matched devices in the same cell.
- **Superimposable, not mirror-image,** for devices whose channel is not self-aligned (drain-extended): two mirror images shift in opposite directions under a mask misalignment.
- **Orientation $\Phi$:** equal orientations cancel source/drain asymmetry (tilted-implant shadowing, off-axis wafers). Zero is customary (ABBA with the drains inward does it), but any equal value works: 3 right + 1 left ($\Phi=1/2$) matches 9 right + 3 left ($\Phi=1/2$). 2-D arrays need equal $\Phi_H$ and $\Phi_V$.
- Razavi's version: **gate-aligned** devices (gates on one line) keep the shadowed terminal the same in both; **parallel-gate** devices side by side see different neighbours on their source and drain sides, which dummies only partly fix.

### STI Stress and the Length-of-Diffusion Effect

```tikz title="Left: the oxide-filled trench grows during densification (oxide is about 2.2x the silicon it replaces) and squeezes the active area. Right: in a bare 4-finger device the end fingers sit close to the trench (small SA or SB), the middle ones far; extending the moat or adding dummies gives every active finger the same, large distance to STI. After Hastings Figs. 13.52 and Razavi Fig. 19.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!12] (0,0) rectangle (5.6,1.6);
  \fill[gray!45] (0.2,1.6) -- (0.4,0.7) -- (1.2,0.7) -- (1.4,1.6) -- cycle;
  \fill[gray!45] (4.2,1.6) -- (4.4,0.7) -- (5.2,0.7) -- (5.4,1.6) -- cycle;
  \node[font=\scriptsize] at (0.8,1.3) {STI}; \node[font=\scriptsize] at (4.8,1.3) {STI};
  \draw[fill=red!65] (2.4,1.6) rectangle (3.2,1.9);
  \draw[->,very thick,red!70!black] (1.35,1.3) -- (2.0,1.3);
  \draw[->,very thick,red!70!black] (4.25,1.3) -- (3.6,1.3);
  \node[font=\scriptsize,align=center] at (2.8,0.35) {compressive stress decays\\ over a few µm};
  \node[font=\scriptsize,align=left,anchor=north west] at (0,-0.1) {NMOS: $k$ down, PMOS: $k$ up by 10\% or more;\\ $V_{TH}$ shifts of 10 mV or more};
  \begin{scope}[xshift=7.0cm,yshift=0.6cm]
    \node[font=\scriptsize\bfseries] at (1.4,2.6) {bare: SA differs per finger};
    \draw[fill=green!45,draw=black!60] (0,0) rectangle (2.8,1.6);
    \foreach \x in {0.45,1.05,1.65,2.25} \draw[fill=red!65] ({\x-0.07},-0.25) rectangle ({\x+0.07},1.85);
    \draw[<->,red!70!black] (0,-0.45) -- (0.38,-0.45);
    \node[font=\scriptsize,red!70!black] at (0.2,-0.7) {SA$_1$};
    \draw[<->,blue!70!black] (0,2.1) -- (0.98,2.1);
    \node[font=\scriptsize,blue!70!black,anchor=south] at (0.5,2.15) {SA$_2$};
    \node[font=\scriptsize,align=left,anchor=west] at (2.95,0.8) {SA$_1\ll$ SA$_2$:\\ end fingers\\ stressed more};
  \end{scope}
  \begin{scope}[xshift=12.6cm,yshift=0.6cm]
    \node[font=\scriptsize\bfseries] at (2.0,2.6) {fixed: moat ext. + dummies};
    \draw[fill=green!45,draw=black!60] (-0.5,0) rectangle (4.5,1.6);
        \foreach \x/\f in {0.25/red!25,0.95/red!65,1.65/red!65,2.35/red!65,3.05/red!65,3.75/red!25} \draw[fill=\f] ({\x-0.07},-0.25) rectangle ({\x+0.07},1.85);
    \draw[<->] (-0.5,-0.45) -- (0.88,-0.45) node[midway,below,font=\scriptsize] {$\geq$ 3--10 µm};
    \node[font=\scriptsize,align=center] at (2.0,-1.1) {all active fingers far from STI};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Mechanism:** the trench oxide is densified at high temperature and grows on the sidewalls; oxide occupies about 2.2× the volume of the silicon it consumes, so the trench pushes on the active area. The stress dies out within a few µm. Because source/drain regions are called "diffusions", the dependence on their length is the **length-of-diffusion (LOD)** effect. Trench width matters too (**OD-to-OD** stress).
- **Fix:** stretch the moat past the last active gate, typically 3-5 µm (≥ 5 µm for moderate matching with STI, ≥ 10 µm for exceptional; 2-3 µm suffices for less accurate matching), or add dummy devices on a continuous moat. One dummy is enough if $L\ge$ 3-5 µm, otherwise two or more. Dummies cost some S/D capacitance (Razavi).
- **Stringers:** in some STI processes the channel edge along the trench has a slightly lower $V_{TH}$. Harmless at $V_{GS}-V_{TH}\gtrsim100$ mV, but in subthreshold these tiny parallel devices dominate and mirrors mismatch badly. A "subthreshold hump" on a log $I_D$-$V_{GS}$ plot reveals them. Keep current-matched devices at ≥ 100 mV overdrive in all corners, or use annular devices or poly "fins" that block the edge (Rule 4).

### Well Proximity Effect

```tikz title="High-energy well implant ions scatter off the edge of the thick photoresist and land in the silicon next to it, so the well is more heavily doped near its edge. A PMOS close to the edge gets a different threshold. Keep active gates several microns inside the well (dummies help push the edge out). After Hastings Figs. 13.50-13.51 and Razavi Fig. 19.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!12] (0,0) rectangle (7,1.6);
  \fill[cyan!18] (2.2,1.6) -- (2.2,0.6) .. controls (2.4,0.3) .. (3.0,0.25) -- (7,0.25) -- (7,1.6) -- cycle;
  \fill[cyan!45] (2.2,1.6) rectangle (3.4,1.1);
  \node[font=\scriptsize] at (5.4,0.6) {n-well};
  \node[font=\scriptsize] at (2.8,1.35) {extra};
  \node[font=\scriptsize] at (0.6,0.4) {p-sub};
  \fill[yellow!55] (0,1.6) rectangle (2.2,2.6);
  \node[font=\scriptsize] at (1.1,2.1) {photoresist};
  \foreach \x in {0.6,1.4,2.6,3.6,4.6,5.6,6.4} \draw[->,blue!70!black] (\x,3.4) -- (\x,{\x<2.2?2.65:1.65});
  \draw[->,red!70!black,thick] (1.9,2.6) -- (2.3,2.4) -- (2.9,1.5);
  \draw[->,red!70!black,thick] (1.6,2.6) -- (2.0,2.3) -- (2.5,1.45);
  \node[font=\scriptsize,red!70!black,anchor=west] at (2.5,3.7) {ions scattered from the resist edge};
  \begin{scope}[xshift=8.4cm,yshift=-0.2cm]
    \draw[dashed,thick,draw=cyan!50!black,fill=cyan!18] (0,0) rectangle (5.2,3.2);
    \draw[fill=orange!65,draw=black!60] (1.5,1.0) rectangle (3.7,2.2);
    \foreach \x/\f in {1.8/red!25,2.3/red!65,2.9/red!65,3.4/red!25} \draw[fill=\f] ({\x-0.06},0.8) rectangle ({\x+0.06},2.4);
    \draw[<->] (0,1.6) -- (1.74,1.6);
    \node[font=\scriptsize,align=center,anchor=south] at (0.85,1.65) {$\geq$ 3--5 µm};
    \draw[<->] (2.6,2.4) -- (2.6,3.2);
    \node[font=\scriptsize,anchor=west] at (2.65,2.8) {also on the sides};
    \node[font=\scriptsize,align=center] at (2.6,0.4) {active gates far from every well edge};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Size of the effect:** observed up to 3-5 µm from the well edge, worst within a micron or two. One measured case: 5% current mismatch with the nearer device's gate 1.8 µm from the edge, 25% at 0.95 µm (Drennan et al., via Hastings p. 695).
- **Fix:** well edges ≥ 3-5 µm from active gates on all sides (Rule 19: ≥ 3 µm moderate, ≥ 2 µm minimal; exceptional ≥ 5-10 µm or twice the well depth, whichever is greater). End dummies remove the gross end-vs-middle difference; the edges along the sides still add random mismatch, which wider devices dilute.
- **Deep diffusions in general** (wells, sinkers, deep-N) have long dopant tails: keep n-well away from matched NMOS too, and keep all deep junctions several µm beyond the minimum rule from matched gates.
- **NBL shadow** (bipolar/BiCMOS processes without CMP): the buried-layer step migrates during epitaxy and can cross a matched device; overlap NBL by 150% of the epi thickness if the shift is unknown. STI/CMP processes have no NBL shadow.

## Level 4: What Sits on Top and What Feeds It

### Hydrogen and Metal Coverage

```tikz title="Hydrogen from the nitride overcoat diffuses down and passivates interface traps, lowering random V_TH variation. Metal blocks (and some barrier metals absorb) hydrogen, so a device under metal stays partly unpassivated. Up to 20% current mismatch has been measured between covered and uncovered MOSFETs. After Hastings section 13.2.4 and Tuinhout et al."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!12] (0,0) rectangle (8,1.0);
  \fill[gray!8] (0,1.0) rectangle (8,2.8);
  \fill[magenta!40] (0,2.8) rectangle (8,3.2);
  \node[font=\scriptsize] at (7.2,3.0) {nitride (H)};
  \draw[fill=red!65] (1.2,1.0) rectangle (2.4,1.25); \node[font=\scriptsize] at (1.8,0.6) {A};
  \draw[fill=red!65] (5.4,1.0) rectangle (6.6,1.25); \node[font=\scriptsize] at (6.0,0.6) {B};
  \draw[fill=blue!55] (4.9,2.0) rectangle (7.1,2.3); \node[font=\scriptsize] at (6.0,2.15) {metal};
  \foreach \x in {1.3,1.8,2.3} \draw[->,magenta!60!black,thick] (\x,2.75) -- (\x,1.35);
  \foreach \x in {5.6,6.0,6.4} \draw[->,magenta!60!black,thick] (\x,2.75) -- (\x,2.35);
  \draw[->,magenta!60!black,thick,dashed] (4.6,2.6) .. controls (4.8,1.6) .. (5.35,1.3);
  \node[font=\scriptsize,align=left,anchor=west] at (8.2,2.6) {A: traps passivated};
  \node[font=\scriptsize,align=left,anchor=west] at (8.2,1.9) {B: hydrogen blocked; only\\ some creeps in under the\\ metal edge $\Rightarrow$ $V_{TH}$ gradient};
  \node[font=\scriptsize,align=left,anchor=west] at (8.2,0.6) {fix: no metal over either gate,\\ identical metal around both};
\end{circuitikz}
\end{document}
```

- **Why metal matters:** hydrogen (from poly deposition and PECVD nitride) diffuses through oxide and passivates dangling bonds at the gate interface, which reduces random $V_{TH}$ variation. It does not pass through aluminium or copper, and some barrier materials (TiSi, TiW) getter it. Modern processes do not anneal long enough to fill in under metal. The stress that metal adds has little effect on $V_{TH}$; the culprit is incomplete hydrogenation.
- **Measured:** up to 20% drain-current mismatch between metal-covered and uncovered MOSFETs, whatever the metal layer; up to 1% between transistors merely *surrounded* by different metal fill (none over them); up to 10% between metallized and bare poly resistors.
- **Covering both devices with a plate is second-best:** hydrogen creeping under the plate edge sets up a $V_{TH}$ gradient, and the unpassivated traps raise random mismatch. It is the only way to let different routing pass over matched devices.

| Class (Hastings Rules 17-18) | Metal over active gates | Dummy metal fill |
|---|---|---|
| Minimal | identical pattern over every section, or a metal-1 field plate over all, with higher metal routed freely above | allowed above a field plate; otherwise block over the array |
| Moderate | none; no field plate; no crossing leads | block over the whole array |
| Exceptional | none; minimize metal within 5-10 µm; each section sees the same nearby metal | block 5-10 µm beyond the active gates on every metal layer below the overcoat |

> [!note]- Detail: living with dummy-fill density rules
> CMP needs a minimum metal density in every window (e.g. 25% in any 250 µm square), checked by a walking-window algorithm that samples windows at coarse steps, so identical cells can pass in one place and fail in another. If you block fill over matched devices you must hand-draw metal to meet density, so keep the blocked regions few and small: cover less critical matched pairs with a metal plate so that fill can sit on top of the plate. For critical devices, make each one see the same custom fill pattern out to several µm, and a similar pattern out to at least 10 µm (Hastings p. 702).

> [!tip] Remark
> Poly resistors have the same hydrogen problem with a different sign convention (hydrogen lowers high-sheet poly resistance by up to 30%), and the same fixes: fold jumpers *out* of the array or cover it with a metal shield. See [[Resistor#Layout]].

### Wiring Resistance and Reference Distribution

```tikz title="Left: N current sources on one resistive ground bus. The segment nearest ground carries all N currents, so the far source is lifted by I r N(N+1)/2 and its current falls by (g_m/I_D) times that drop. Right: distribute a current instead and mirror it locally; the bus resistance is then in series with a current source and does nothing. After Razavi Figs. 19.23-19.24 and section 18.7.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\x/\l in {1/0/1,2/2.4/2,3/5.6/N} {
    \draw (\x,0) node[nmos](M\i){};
    \draw (M\i.G) -- ++(-0.25,0) node[left,font=\scriptsize] {$V_b$};
    \draw (M\i.D) -- ++(0,0.3) node[above,font=\scriptsize] {$I_\l$};
    \draw (M\i.S) -- ++(0,-0.6) coordinate(s\i) node[circ]{};
  }
  \draw (-1.8,-1.37) node[ground]{};
  \draw (-1.8,-1.37) to[R,l=$r$] (s1) to[R,l=$r$] (s2) -- ++(0.9,0);
  \node at ($(s2)+(1.25,0)$) {$\cdots$};
  \draw ($(s3)+(-1.7,0)$) to[R,l=$r$] (s3);
  \draw[->,orange!80!black] ($(s1)+(-0.3,-0.3)$) -- ++(-1.0,0) node[midway,below,font=\scriptsize] {$N I$};
  \node[font=\scriptsize,align=center] at (2.4,-2.6) {first segment carries all $N$ currents:\\ $V_{S,N}\approx I r\,N(N+1)/2$, error grows as $N^2$};
  \begin{scope}[xshift=9.6cm]
    \draw (0,0) node[nmos](R1){};
    \draw (1.8,0) node[nmos](O1){};
    \draw (R1.G) -- (O1.G);
    \draw (R1.D) -- ++(0,0.3) coordinate(t);
    \draw (t) -| ($(R1.G)+(-0.3,0)$) -- (R1.G);
    \draw (t) -- ++(0,0.5) node[above,font=\scriptsize] {$I_{REF}$ routed in};
    \draw (O1.D) -- ++(0,0.8) node[above,font=\scriptsize] {$I_{out}$};
    \draw (R1.S) -- ++(0,-0.35) coordinate(b1) -- (b1 -| O1.S) -- (O1.S);
    \draw ($(b1)!0.5!(b1 -| O1.S)$) node[circ]{} -- ++(0,-0.3) node[ground]{};
    \node[font=\scriptsize,align=center] at (0.9,-2.6) {mirror next to its load:\\ both sources on one local node};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\Delta I}{I} = -\frac{g_m}{I_D}\,I_{wire}R_w}
$$

- A source lifted by $\Delta V = I_{wire}R_w$ looks exactly like a $\Delta V_{TH}$ and is referred to current through $g_m/I_D$. It is **systematic** (fixed sign, never RSS'd) and no amount of area touches it. Example: 2 Ω carrying 500 µA is 1 mV, a 2% error at $g_m/I_D = 20$ S/A and 0.5% at 5 S/A (Jespers & Murmann §4.3.2, via the Zettelkasten).
- **Fixes:** tie matched sources to one local node; star-connect; widen source straps; if a remote body tie leaves $V_{SB}=\Delta V$, the error grows by $1+\eta$, so tie the body locally. For far-apart blocks distribute **currents**, not a gate voltage (Razavi §19.2.5), with local bypass at the destination.
- Resistor arrays: make every jumper's resistance (metal and vias) proportional to its segment, add vias in every jumper if any has one, use multiple vias; Kelvin-connect where lead current flows (Hastings §8.2.4, Rule 8.3.1-23). Capacitor arrays: equalize lead capacitance with jogs or dead-end stubs ([[Capacitor#Layout]]).

### Bias-Dependent Mismatch

Two perfectly drawn devices still drift apart if they are **operated** differently:

- **Channel-length modulation:** different $V_{DS}$ gives a current ratio error proportional to $\lambda\Delta V_{DS}$. Fix: longer $L$, cascodes to equalize $V_{DS}$, fewer mirrors in series.
- **Hot carriers:** impact ionization adds drain current that depends on $V_{DS}$ (NMOS worse), and hot-carrier injection slowly shifts $V_{TH}$ by up to several tens of mV and degrades $k$. Fix: cascodes that keep the matched devices at low and equal $V_{DS}$ (cascode bodies to their sources, so impact-ionization current still reaches the drain).
- **Bias-temperature instability (NBTI/PBTI):** a negative $V_{GS}$ held at high temperature shifts $V_{TH}$, even with no drain current. A PMOS comparator pair with unbalanced inputs ages apart. Fixes: clamp diodes, or an NMOS pair, usually less BTI-prone.
- **Body bias** differences add $\Delta V_{TH}$ through the body effect and raise $A_{VT}$ (Level 0).

## Level 5: Rules for MOS Transistor Matching

**Voltage matching** (pairs, comparators) and **current matching** (mirrors, DAC sources) want different shapes; you cannot optimize both at once.

$$
\boxed{\sigma_{\Delta V_{GS}}\approx\sigma_{\Delta V_{TH}} = \frac{A_{VT}}{\sqrt{WL}}}\qquad\boxed{\frac{\sigma_{\Delta I}}{I}\approx\frac{g_m}{I_D}\,\sigma_{\Delta V_{TH}} = \frac{A_{VT}}{L}\sqrt{\frac{2k'}{I_D}}\ \ \text{(square law)}}
$$

"Voltage matching depends on area, current matching depends on length": at fixed current the $W$ in $g_m$ cancels the $W$ in Pelgrom's law. The full $V_{TH}$-plus-$\beta$ forms (Hastings Eqs. 13.40-13.43) and the $g_m/I_D$ reading of them are in [[Nonlinearity and Mismatch#Current Mismatch the Opposite Instruction]].

```tikz title="A large ratio from identical units: a 20:1 mirror as 4 unit devices in series on the reference side and 5 in parallel on the output side. Every unit has the same W/L, so etch bias and short/narrow-channel effects cancel; the small side is no longer one tiny device. After Hastings Fig. 13.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{u/.style={draw,fill=green!25,minimum width=0.9cm,minimum height=0.55cm,font=\scriptsize}}
  \draw (0,4.3) node[above,font=\scriptsize] {$I_{IN}$} -- (0,3.85);
  \foreach \k in {1,...,4} \node[u] (a\k) at (0,{4.2-0.9*\k}) {unit};
  \draw (0,3.85) -- (a1.north);
  \foreach \k/\n in {1/2,2/3,3/4} \draw (a\k.south) -- (a\n.north);
  \draw (a4.south) -- (0,0.0) coordinate(g0);
  \node[font=\scriptsize,align=center,anchor=east] at (-0.7,2.0) {4 units in series\\ (reference):\\ acts as $(W/L)/4$};
  \foreach \k in {0,...,4} {
    \node[u] (b\k) at ({2.2+1.2*\k},1.6) {unit};
    \draw (b\k.north) -- ({2.2+1.2*\k},2.4);
    \draw (b\k.south) -- ({2.2+1.2*\k},0.0);
  }
  \draw (2.2,2.4) -- (7.0,2.4) -- (7.4,2.4) node[right,font=\scriptsize] {$I_{OUT}=20\,I_{IN}$};
  \draw (g0) -- (7.0,0) node[pos=0.5,below,font=\scriptsize] {ground};
  \draw (0.9,-0.2) node[ground]{} -- (0.9,0);
  \node[font=\scriptsize,align=center] at (4.6,3.2) {5 units in parallel (output): $5\,W/L$};
  \node[font=\scriptsize,align=center] at (4.6,-1.3) {all nine gates on one node (reference side diode-connected);\\ every unit has the same $W$ and $L$};
\end{circuitikz}
\end{document}
```

**Matching classes** (Hastings §13.3; 6σ, 10-year life, −40 to 125 °C, plastic package):

| Class | Voltage | Current | Typical use |
|---|---|---|---|
| Minimal | ±10 mV | ±10% | mirrors biasing non-critical circuits, ≤ 3-4 mirrors from the reference resistor |
| Moderate | ±3 mV | ±3% | input pairs of general-purpose op amps and comparators |
| Exceptional | ±1 mV | ±1% | precision op-amp and comparator inputs; needs large common-centroid arrays or trimming (which removes only about 2/3 of the over-temperature variation) |

**The rules** (Hastings §13.3, condensed; numbers are the moderate / exceptional thresholds unless noted):

| # | Rule | Minimal | Moderate | Exceptional |
|---|---|---|---|---|
| 1 | Identical sections (same $W$ and $L$); voltage-matched: parallel sections; current-matched: series allowed (not for exceptional) | ✓ | ✓ | ✓ |
| 2-3 | Area for voltage matching, length for current matching (tables in [[#Spec translation]]) | ✓ | ✓ | ✓ |
| 4 | Current-matched devices out of subthreshold if stringers exist ($V_{GS}-V_{TH}\ge$ 100 mV) | | ✓ | ✓ |
| 5 | No pocket-implant devices for current matching; for voltage matching keep $L\le L_c$ | ✓ | ✓ | ✓ |
| 6 | Thinnest gate oxide the circuit allows | ✓ | ✓ | ✓ |
| 7 | Same orientation; equal $\Phi$ | same direction | nearly equal $\Phi$ | equal $\Phi$ (always, for non-self-aligned devices) |
| 8 | Proximity | as close as possible | adjacent, preferably interdigitated | careful common centroid |
| 9 | Compact array (aspect ratio of each common-centroid sub-array) | current 10:1, voltage 3:1 | current 3:1, voltage ~square | ~square |
| 10 | 2-D common centroid (cross-coupled) where practical | | ✓ | ✓ |
| 11 | Avoid sub-micron $W$ or $L$ | | ✓ | ✓ |
| 12 | Dummies at both ends; STI moat extension | optional | $L<3$ µm: one full dummy; else half dummies ≤ 3 µm wide; moat ≥ 5 µm | outer dummy edge ≥ 10 µm from active; moat ≥ 10 µm |
| 13 | Low-stress-gradient location | not in corners, ≥ 50-100 µm from edges | interior, or mid-side inset ≥ 100-250 µm | interior |
| 14 | Away from power devices (~1 µm per mW) | few hundred µm from multi-watt, interdigitated | opposite end of the die | on an axis, far end; maybe 2:1-3:1 die |
| 15 | On a die axis of symmetry | | helpful | yes |
| 16 | No contacts on active gate | ✓ | ✓ | ✓ |
| 17 | No metal across active gates | identical metal per section or M1 plate | none, no plate | none; little metal within 5-10 µm |
| 18 | Block dummy fill | unless field plate | over array | 5-10 µm beyond |
| 19 | Deep diffusions / well edge to active gate | ≥ 2 µm (WPE processes) | ≥ 3 µm | ≥ 5-10 µm or 2× well depth |
| 20 | NBL shadow off the active area | | ✓ | ✓ |
| 21 | Gate extension 1-2 µm beyond rule, all equal | | ✓ | ✓ |
| 22 | Gate fingers strapped in metal, not poly | | ✓ | ✓ |
| 23 | No stray poly nearby | 3-5 µm if no dummies | 3-5 µm | 5-10 µm, block dummy poly |
| 24 | Consider 45° PMOS under heavy stress (if the process allows) | | | consider |

> [!note]- Why: the general rules behind the MOS list (Hastings §8.3, resistors and capacitors)
> Hastings' resistor and capacitor rules are the same physics in another device: same material (different materials mismatch by ±20% or more and diverge over temperature); identical unit geometry (cancels width bias, end effects, contact resistance, fringing; non-integer ratios by matching area-to-perimeter ratio); large enough (random part may be 75% or more of a minimal spec, at most 50% of moderate and 25% of exceptional); same orientation; close together and interdigitated; dummies at the ends; low-stress location, away from power, on die axes; same field oxide underneath (poly over n-well and p-well differ), no oxide steps, a few µm from moat edges; no unconnected leads over the array; equal per-segment interconnect. Resistor- and capacitor-specific rules (thermoelectrics, tank modulation, field plates, split field plates, shields, dielectric absorption) are in [[Resistor#Layout]] and [[Capacitor#Layout]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $WL$ | random voltage mismatch $\propto1/\sqrt{WL}$ | area, gate capacitance (4× area for 2× better); a large device spans more of any gradient |
| ↑ $L$ (fixed $I_D$) | current matching $\propto1/L$; CLM mismatch | area, headroom; useless past $L_c$ with pocket implants |
| ↓ $t_{ox}$ (thin-oxide device) | $A_{VT}$, both voltage and current matching | voltage rating; cascode to recover it |
| Common centroid (ABBA, AB/BA) | linear gradient error → 0 | routing complexity, wiring asymmetry if careless; no gain if no gradient |
| More dispersion (more, smaller sub-arrays) | quadratic residue | gaps waste area → less active area → more random mismatch |
| Dummies, moat extension | etch bias, LOD, WPE end effects | area, S/D capacitance |
| Well edge further away | WPE | area |
| No metal over gates, blocked fill | hydrogen-induced mismatch | routing freedom, hand-drawn density fill |
| Metal field plate over the pair | lets routing pass over (minimal class) | worse random $V_{TH}$, edge gradient |
| Centre-of-die, on-axis placement | stress and thermal gradients | floorplan competition with other critical blocks |
| Current-mode bias distribution | IR-drop and long-distance errors | extra current, local mirrors and bypass caps |
| Trim | initial random and package shift | test cost; only ~2/3 of MOS over-temperature drift; not drift or thermal gradients |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Mismatch of a ratio | $\delta = \dfrac{x_1/x_2}{m_1/m_2}-1$ |
| Data limits | $\mu\pm6\sigma$ |
| Area + perimeter | $s = \sqrt{k_A^2/A+k_P^2/P}\to k_A/\sqrt A$ |
| Unequal devices | $s = k\sqrt{\tfrac{1}{2A_1}+\tfrac{1}{2A_2}}$ |
| MOS threshold | $\sigma_{\Delta V_{TH}} = A_{VT}/\sqrt{WL}$, $A_{VT}\approx1$ mV·µm per nm $t_{ox}$ |
| Pocket implants | $\sigma_{\Delta V_{TH}} = c_{VT}/\sqrt{W\min(L,L_c)}$ |
| With distance | $\sigma^2 = A_P^2/WL+S_P^2D^2$, $D^* = A_P/(S_P\sqrt{WL})$ |
| Gradient error | $\Delta P = \alpha P d_{cc}\nabla T_{cc}$ |
| Taylor about the centroid | $F = c_0+c_1(x-a)+c_2(x-a)^2+\dots$; common centroid kills $c_1$, residue $\propto$ span² |
| Stress on MOS | $\Delta k/k\approx-(\pi_L\sigma_L+\pi_T\sigma_T+\pi_{LT}\tau_{LT})$ |
| Orientation | $\Phi = \frac1N\sum\Phi_i$, need $\Phi_A=\Phi_B$ |
| Voltage matching | $\sigma_{\Delta V_{GS}}\approx\sigma_{\Delta V_{TH}}$ |
| Current matching | $\sigma_{\Delta I}/I\approx(g_m/I_D)\sigma_{\Delta V_{TH}} = (A_{VT}/L)\sqrt{2k'/I_D}$ |
| Source IR drop | $\Delta I/I = -(g_m/I_D)I_{wire}R_w$ |
| Spec budget | $|\mu_{sys}|+k\sigma_{rand}\le$ spec, $WL\ge(A_{VT}/\sigma)^2$ |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (Pearson 2023; PDF page = printed + 1)
  - Ch. 8 Matching of Resistors and Capacitors, pp. 366-425: §8.1 mismatch statistics (Eqs. 8.1-8.5, Fig. 8.1); §8.2.1 random variation (Eqs. 8.6-8.16); §8.2.2-8.2.3 process biases, proximity effects, dummies, WPE (Figs. 8.3-8.7); §8.2.4 interconnection parasitics; §8.2.5 NBL shadow; §8.2.6 hydrogenation; §8.2.7 temperature, centroids, common-centroid rules, Taylor residue, placement vs heat sources (Eqs. 8.23-8.26, Tables 8.2-8.4, Figs. 8.13-8.17, 8.21); §8.2.8 stress and package shift (Tables 8.6-8.8, Figs. 8.24-8.27); §8.3 rules for device matching (classes, resistor and capacitor rules).
  - Ch. 13.2-13.3 Matching MOS Transistors, pp. 685-716: voltage vs current matching (Eqs. 13.40-13.48), unequal devices and 20:1 mirror (Eq. 13.49, Fig. 13.41), pocket implants (Eq. 13.50), orientation (Figs. 13.43-13.44), etch and dummies (Figs. 13.45-13.47), deep diffusions and WPE (Figs. 13.49-13.51), LOD and stringers (Table 13.1, Figs. 13.52-13.53), bias-dependent mismatch, hydrogenation and dummy metal, gradients (Eqs. 13.57-13.60), common-centroid MOS and orientation rule (Eq. 13.61, Tables 13.2-13.3, Fig. 13.59), §13.3 rules 1-24 and Tables 13.4-13.5.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.**, §19.2.2-19.2.5, pp. 739-745 (symmetry, gate shadowing, dummies, metal over one device, common centroid, 1-D cross-coupling Eqs. 19.6-19.9, STI, well proximity, reference distribution); §18.7.3 p. 728 (ground-bus IR drop in current-source arrays).
- **Pelgrom & Duinmaijer, "Matching properties of MOS transistors"** (ESSCIRC 1988 version): distance term, $S_{VT0}\approx4$ µV/µm, rotated devices affect only $\beta$.
- **Drennan & McAndrew, "Understanding MOSFET mismatch for analog design,"** JSSC 38(3), 2003: local vs global variation, multiple-unit devices (§III-C), NMOS vs PMOS under current bias (§III-B).
- **Schaper, Linnenbank & Thewes, "Precise characterization of long-distance mismatch of CMOS devices,"** IEEE TSM 14(4), 2001: Table I ($A_{VT}$ vs $t_{ox}$), Figs. 5-11 (linear, nonlinear and orientation-dependent long-distance mismatch, interconnect drop).
- **Schaper & Linnenbank, "Comparison of distance mismatch and pair matching of CMOS devices"** (130 nm): Eq. (1) $\sigma_{\Delta T}^2 = A^2/WL+S_D^2x^2$, Table 1, Figs. 6-8.
- **Zettelkasten extensions** (`AnalogTheory/`): `Nonlinearity and Mismatch/12s4` (source-line IR drop referred through $g_m/I_D$, from Jespers & Murmann §4.3.2); `Process Layout and Packaging/15h1` (ground-bus $N^2$ error, from Razavi §18.7.3) and `15l` (current-domain bias distribution).
