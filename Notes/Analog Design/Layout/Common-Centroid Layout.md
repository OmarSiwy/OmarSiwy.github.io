---
title: Common-Centroid Layout
description: Building matched arrays whose devices share one centroid, from ABBA and the cross-coupled pair through Nth-order central-symmetric patterns, MOS orientation, capacitor DAC arrays with their routing parasitics, to how a tool generates them.
kind: topic
status: growing
aliases:
  - Common-Centroid Layout
  - Common Centroid
  - Interdigitation
  - Cross-Coupled Layout
---

A matched device is cut into identical units and the units of all devices are shuffled into one array. Where each unit sits decides which gradients cancel. This note is the geometry of that shuffle: first the patterns at a glance, then the condition that makes a pattern common-centroid, then which polynomial orders a pattern cancels and how to build one that cancels more, then the practical arrays (dummies, MOS fingers, capacitor DACs and their wiring), and last how a layout generator builds and routes them.

## The big picture

```tikz title="The pattern ladder. Each step adds symmetry and cancels one more order of the gradient polynomial: clustered and ABAB leave a linear error, ABBA and AB/BA cancel the linear term, Dai's central-symmetric patterns cancel up to order n with 2^n units per device. After Hastings Figs. 8.15-8.16 and Dai et al. Figs. 1-3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  dpoly/.style={fill=red!25,draw=black!50},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70,fill opacity=0.85},
  mtwo/.style={fill=violet!55,draw=black!70,fill opacity=0.85},]
\node[font=\bfseries\small,anchor=west] at (-0.2,6.55) {One dimension};
\draw[fill=white] (0.030,5.630) rectangle (0.520,6.120);
\node[font=\scriptsize] at (0.275,5.875) {A};
\draw[fill=white] (0.580,5.630) rectangle (1.070,6.120);
\node[font=\scriptsize] at (0.825,5.875) {A};
\draw[fill=gray!35] (1.130,5.630) rectangle (1.620,6.120);
\node[font=\scriptsize] at (1.375,5.875) {B};
\draw[fill=gray!35] (1.680,5.630) rectangle (2.170,6.120);
\node[font=\scriptsize] at (1.925,5.875) {B};
\node[font=\scriptsize,anchor=west,red!70!black] at (2.35,5.87) {clustered: linear error $2g_1p$};
\draw[fill=white] (0.030,4.730) rectangle (0.520,5.220);
\node[font=\scriptsize] at (0.275,4.975) {A};
\draw[fill=gray!35] (0.580,4.730) rectangle (1.070,5.220);
\node[font=\scriptsize] at (0.825,4.975) {B};
\draw[fill=white] (1.130,4.730) rectangle (1.620,5.220);
\node[font=\scriptsize] at (1.375,4.975) {A};
\draw[fill=gray!35] (1.680,4.730) rectangle (2.170,5.220);
\node[font=\scriptsize] at (1.925,4.975) {B};
\node[font=\scriptsize,anchor=west,red!70!black] at (2.35,4.97) {interdigitated: centroids 1 pitch apart, error $g_1p$};
\draw[fill=white] (0.030,3.830) rectangle (0.520,4.320);
\node[font=\scriptsize] at (0.275,4.075) {A};
\draw[fill=gray!35] (0.580,3.830) rectangle (1.070,4.320);
\node[font=\scriptsize] at (0.825,4.075) {B};
\draw[fill=gray!35] (1.130,3.830) rectangle (1.620,4.320);
\node[font=\scriptsize] at (1.375,4.075) {B};
\draw[fill=white] (1.680,3.830) rectangle (2.170,4.320);
\node[font=\scriptsize] at (1.925,4.075) {A};
\node[font=\scriptsize,anchor=west,green!40!black] at (2.35,4.07) {common centroid: cancels order 1 (and 3, 5, ...)};
\draw[fill=white] (0.030,2.930) rectangle (0.520,3.420);
\node[font=\scriptsize] at (0.275,3.175) {A};
\draw[fill=gray!35] (0.580,2.930) rectangle (1.070,3.420);
\node[font=\scriptsize] at (0.825,3.175) {B};
\draw[fill=gray!35] (1.130,2.930) rectangle (1.620,3.420);
\node[font=\scriptsize] at (1.375,3.175) {B};
\draw[fill=white] (1.680,2.930) rectangle (2.170,3.420);
\node[font=\scriptsize] at (1.925,3.175) {A};
\draw[fill=gray!35] (2.230,2.930) rectangle (2.720,3.420);
\node[font=\scriptsize] at (2.475,3.175) {B};
\draw[fill=white] (2.780,2.930) rectangle (3.270,3.420);
\node[font=\scriptsize] at (3.025,3.175) {A};
\draw[fill=white] (3.330,2.930) rectangle (3.820,3.420);
\node[font=\scriptsize] at (3.575,3.175) {A};
\draw[fill=gray!35] (3.880,2.930) rectangle (4.370,3.420);
\node[font=\scriptsize] at (4.125,3.175) {B};
\node[font=\scriptsize,anchor=west,green!40!black] at (4.55,3.17) {2nd-order: cancels orders 1, 2};
\draw[->,thick,red!70!black] (0,2.05) -- (4.4,2.05) node[right,font=\scriptsize] {gradient $g_1x+g_2x^2+\dots$};
\begin{scope}[xshift=9.6cm]
\node[font=\bfseries\small,anchor=west] at (-0.2,6.55) {Two dimensions};
\draw[fill=white] (0.030,5.580) rectangle (0.520,6.070);
\node[font=\scriptsize] at (0.275,5.825) {A};
\draw[fill=gray!35] (0.580,5.580) rectangle (1.070,6.070);
\node[font=\scriptsize] at (0.825,5.825) {B};
\draw[fill=gray!35] (0.030,5.030) rectangle (0.520,5.520);
\node[font=\scriptsize] at (0.275,5.275) {B};
\draw[fill=white] (0.580,5.030) rectangle (1.070,5.520);
\node[font=\scriptsize] at (0.825,5.275) {A};
\node[font=\scriptsize,align=center,anchor=north,green!40!black] at (0.55,4.92) {cross-coupled\\ order 1 (+$x^2,y^2$)};
\draw[fill=white] (1.780,5.580) rectangle (2.270,6.070);
\node[font=\scriptsize] at (2.025,5.825) {A};
\draw[fill=gray!35] (2.330,5.580) rectangle (2.820,6.070);
\node[font=\scriptsize] at (2.575,5.825) {B};
\draw[fill=gray!35] (2.880,5.580) rectangle (3.370,6.070);
\node[font=\scriptsize] at (3.125,5.825) {B};
\draw[fill=white] (3.430,5.580) rectangle (3.920,6.070);
\node[font=\scriptsize] at (3.675,5.825) {A};
\draw[fill=gray!35] (1.780,5.030) rectangle (2.270,5.520);
\node[font=\scriptsize] at (2.025,5.275) {B};
\draw[fill=white] (2.330,5.030) rectangle (2.820,5.520);
\node[font=\scriptsize] at (2.575,5.275) {A};
\draw[fill=white] (2.880,5.030) rectangle (3.370,5.520);
\node[font=\scriptsize] at (3.125,5.275) {A};
\draw[fill=gray!35] (3.430,5.030) rectangle (3.920,5.520);
\node[font=\scriptsize] at (3.675,5.275) {B};
\node[font=\scriptsize,align=center,anchor=north,green!40!black] at (2.85,4.92) {order 2};
\draw[fill=white] (4.630,5.580) rectangle (5.120,6.070);
\node[font=\scriptsize] at (4.875,5.825) {A};
\draw[fill=gray!35] (5.180,5.580) rectangle (5.670,6.070);
\node[font=\scriptsize] at (5.425,5.825) {B};
\draw[fill=gray!35] (5.730,5.580) rectangle (6.220,6.070);
\node[font=\scriptsize] at (5.975,5.825) {B};
\draw[fill=white] (6.280,5.580) rectangle (6.770,6.070);
\node[font=\scriptsize] at (6.525,5.825) {A};
\draw[fill=gray!35] (4.630,5.030) rectangle (5.120,5.520);
\node[font=\scriptsize] at (4.875,5.275) {B};
\draw[fill=white] (5.180,5.030) rectangle (5.670,5.520);
\node[font=\scriptsize] at (5.425,5.275) {A};
\draw[fill=white] (5.730,5.030) rectangle (6.220,5.520);
\node[font=\scriptsize] at (5.975,5.275) {A};
\draw[fill=gray!35] (6.280,5.030) rectangle (6.770,5.520);
\node[font=\scriptsize] at (6.525,5.275) {B};
\draw[fill=gray!35] (4.630,4.480) rectangle (5.120,4.970);
\node[font=\scriptsize] at (4.875,4.725) {B};
\draw[fill=white] (5.180,4.480) rectangle (5.670,4.970);
\node[font=\scriptsize] at (5.425,4.725) {A};
\draw[fill=white] (5.730,4.480) rectangle (6.220,4.970);
\node[font=\scriptsize] at (5.975,4.725) {A};
\draw[fill=gray!35] (6.280,4.480) rectangle (6.770,4.970);
\node[font=\scriptsize] at (6.525,4.725) {B};
\draw[fill=white] (4.630,3.930) rectangle (5.120,4.420);
\node[font=\scriptsize] at (4.875,4.175) {A};
\draw[fill=gray!35] (5.180,3.930) rectangle (5.670,4.420);
\node[font=\scriptsize] at (5.425,4.175) {B};
\draw[fill=gray!35] (5.730,3.930) rectangle (6.220,4.420);
\node[font=\scriptsize] at (5.975,4.175) {B};
\draw[fill=white] (6.280,3.930) rectangle (6.770,4.420);
\node[font=\scriptsize] at (6.525,4.175) {A};
\node[font=\scriptsize,align=center,anchor=north,green!40!black] at (5.70,3.82) {order 3};
\draw[very thick,orange!80!black] (0.460,5.460) -- (0.640,5.640) (0.460,5.640) -- (0.640,5.460);
\draw[very thick,orange!80!black] (2.760,5.460) -- (2.940,5.640) (2.760,5.640) -- (2.940,5.460);
\draw[very thick,orange!80!black] (5.610,4.910) -- (5.790,5.090) (5.610,5.090) -- (5.790,4.910);
\draw[->,thick,red!70!black] (0,2.3) -- (1.2,2.3) node[right,font=\scriptsize] {$x$};
\draw[->,thick,red!70!black] (0,2.3) -- (0,3.1) node[above,font=\scriptsize] {$y$};
\end{scope}
\begin{scope}[yshift=0.2cm,font=\scriptsize]
\node[font=\bfseries\scriptsize,anchor=west] at (-0.2,1.15) {Legend (tiles and layers, whole note)};
\draw[fill=white] (0.00,0.55) rectangle (0.40,0.83); \node[anchor=west] at (0.45,0.69) {unit of device A};
\draw[fill=gray!35] (2.75,0.55) rectangle (3.15,0.83); \node[anchor=west] at (3.20,0.69) {unit of device B};
\draw[fill=gray!8,dashed] (5.50,0.55) rectangle (5.90,0.83); \node[anchor=west] at (5.95,0.69) {dummy D};
\draw[ndiff] (8.25,0.55) rectangle (8.65,0.83); \node[anchor=west] at (8.70,0.69) {n+ diffusion};
\draw[pdiff] (11.00,0.55) rectangle (11.40,0.83); \node[anchor=west] at (11.45,0.69) {p+ diffusion};
\draw[poly] (13.75,0.55) rectangle (14.15,0.83); \node[anchor=west] at (14.20,0.69) {poly gate};
\draw[dpoly] (0.00,0.05) rectangle (0.40,0.33); \node[anchor=west] at (0.45,0.19) {dummy poly};
\draw[cont] (2.75,0.05) rectangle (3.15,0.33); \node[anchor=west] at (3.20,0.19) {contact / via};
\draw[mone] (5.50,0.05) rectangle (5.90,0.33); \node[anchor=west] at (5.95,0.19) {metal 1};
\draw[mtwo] (8.25,0.05) rectangle (8.65,0.33); \node[anchor=west] at (8.70,0.19) {metal 2};
\draw[nwell] (11.00,0.05) rectangle (11.40,0.33); \node[anchor=west] at (11.45,0.19) {n-well};
\draw[very thick,orange!80!black] (13.75,0.12) -- (13.95,0.32) (13.75,0.32) -- (13.95,0.12); \node[anchor=west] at (14.0,0.2) {common centroid};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **A gradient sees each device at its centroid.** Two devices whose unit centroids coincide have **zero linear-gradient mismatch**, in any direction. Equal centroids along $x$ and along $y$ is the whole definition.
> 2. **Symmetry decides which orders cancel.** If each device is point-symmetric about the centre by itself, every **odd** order cancels; if A's units are the point reflection of B's, every **even** order cancels. Dai's $n$-th order pattern, built by doubling, cancels orders $1\dots n$ with $2^n$ units per device.
> 3. **What is left grows with the span of each common-centroid group**: the quadratic residue goes as span$^2$. Many small common-centroid sub-arrays (dispersion) in a compact, near-square array beat one big group.
> 4. **Wires are part of the device.** Lead capacitance, top-plate-to-bottom-plate coupling, source-line resistance and length-of-diffusion stress do not care about centroids. A badly routed common-centroid array can match worse than an interdigitated or clustered one.
> 5. **Dispersion costs wiring.** In a capacitor DAC, scattering units (chessboard) gives the best INL/DNL but the most wire and vias; clustering (spiral) gives the fastest settling. In a 12 nm 8-bit array the two differ by about 100× in $f_{3dB}$ (Karmokar 2023).

**Map:** [[#Spec translation|spec → order → array]] → [[#Level 0 The Centroid Condition|centroid condition, 1-D and 2-D patterns]] → [[#Level 1 Beyond Linear Moments and Nth-Order Patterns|moments, Nth-order patterns, dispersion]] → [[#Level 2 Dummies and Array Edges|dummies]] → [[#Level 3 Active Arrays MOS Transistors|MOS arrays]] → [[#Level 4 Passive Arrays Capacitor DACs|capacitor DAC arrays and routing]] → [[#Level 5 Generating Arrays Automatically|automation]].

> [!tip] Remark
> Why gradients exist, what sets their size (heat, stress, oxide, packaging), the four rules of common-centroid layout and the plain ABBA/ABAB/AABB arithmetic are in [[Device Matching#Level 1 Gradients and the Centroid]]. This note assumes them and builds arrays. Random mismatch ($\sigma\propto1/\sqrt{\text{area}}$) is [[Device Matching#Random Variation Area and Periphery]].

## Spec translation

A common-centroid array is a layout, not an amplifier; its "spec" is the systematic part of an accuracy budget. The translation runs: block accuracy → systematic share → gradient model → required cancellation order $n$ → units per device and array shape → routing budget.

```tikz title="From an accuracy spec to a pattern. The random share sets the unit size (owned by Device Matching); the systematic share and the gradient model pick the cancellation order n, hence the unit count 2^n and array; routing must then keep its own mismatch inside the same budget."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\tikzset{box/.style={draw,rounded corners,align=center,minimum height=1.0cm,text width=2.75cm,font=\scriptsize}}
  \node[box,fill=gray!10] (s) at (0,0) {block accuracy $\varepsilon$\\ ($\tfrac12$ LSB, offset,\\ ratio error)};
  \node[box,fill=blue!10] (r) at (3.6,-1.1) {random share $k\sigma$\\ $\to$ unit area\\ (Device Matching)};
  \node[box,fill=orange!15] (e) at (3.6,1.1) {systematic share\\ $\varepsilon_{sys}$};
  \node[box,fill=orange!15] (g) at (3.6,3.0) {gradient model\\ $g_1, g_2, \dots$ (heat, stress,\\ oxide, $C\propto1/t$)};
  \node[box,fill=orange!25] (n) at (7.3,1.1) {smallest order $n$ with\\ $|g_{n+1}\Delta m_{n+1}|\,p^{n+1}\le\varepsilon_{sys}$};
  \node[box,fill=green!15] (a) at (11.0,1.1) {pattern: $\ge 2^n$ units\\ per device, near-square,\\ dummy ring};
  \node[box,fill=green!15] (w) at (11.0,-1.1) {routing: matched lead $C$,\\ few vias on the\\ critical (largest) net};
  \draw[->] (s) -- (e); \draw[->] (s) -- (r); \draw[->] (e) -- (n); \draw[->] (g) -- (n); \draw[->] (n) -- (a); \draw[->] (a) -- (w);
  \draw[->] (r.east) -- (9.15,-1.1) node[pos=0.4,below,font=\scriptsize] {sets unit and pitch $p$} |- ([yshift=-0.3cm]a.west);
\end{circuitikz}
\end{document}
```

**1. The block's own spec**, as a fractional ratio error the array must hold:

| Block | Accuracy spec | Ratio error the array must hold |
|---|---|---|
| Binary CDAC, $N$ bits, DNL $<\tfrac12$ LSB at midscale | $\mathrm{DNL}_{mid}=2^{N-1}(\varepsilon_{MSB}-\varepsilon_{rest})$ | $\lvert\varepsilon_{MSB}-\varepsilon_{rest}\rvert<2^{-N}$ |
| SC gain stage $C_1/C_2$, gain error $\delta$ | $C_1/C_2$ | $\lvert\varepsilon_1-\varepsilon_2\rvert<\delta$ |
| Differential pair offset $V_{OS}$ | $\Delta V_{TH}$, $\Delta\beta/\beta$ | systematic share of $V_{OS}$ |
| Current mirror / IDAC ratio | $\Delta I/I$ | systematic share of $\Delta I/I$ |

**2. Map each spec to the array property and the layout knob:**

| Array property | Sets | Layout knob |
|---|---|---|
| Linear-gradient error $g_1 d_{cc}$ | everything above, if $d_{cc}\neq0$ | common centroid ($d_{cc}=0$) |
| Order-$(n+1)$ residue $\lvert g_{n+1}\Delta m_{n+1}\rvert p^{n+1}$ | high-resolution DACs, exceptional matching | pattern order $n$, sub-array span (dispersion), compactness |
| Random $\sigma$ | the rest of the budget | unit area (sets pitch $p$) |
| Lead capacitance mismatch, $C^{TB}$ | CDAC INL/DNL, SC gain | matched leads, top/bottom wires never overlap |
| Wire and via $R$ on the largest net | CDAC $f_{3dB}$, pair $G_m$ | clustering, parallel wires, few bends |

$$
\boxed{\varepsilon_{sys}\approx\sum_{k>n}\lvert g_k\,\Delta m_k\rvert\,p^k\ \le\ \varepsilon-k\sigma,\qquad \text{units per device}\ \ge 2^n}
$$

$g_k$ is the order-$k$ gradient coefficient (fractional change per µm$^k$), $\Delta m_k$ the pattern's order-$k$ moment difference in pitches (tables below), $p$ the unit pitch. Pick the smallest $n$ that satisfies it.

> [!note]- Derivation: the midscale DNL of a binary CDAC
> With $C_0$ a permanently grounded unit, the MSB is $2^{N-1}C_u(1+\varepsilon_{MSB})$ and all lower bits together are $(2^{N-1}-1)C_u(1+\varepsilon_{rest})$ switched, plus $C_0$. The midscale step (rest on → MSB on) is nominally one unit, and the excess is $2^{N-1}C_u(\varepsilon_{MSB}-\varepsilon_{rest})$ to first order, i.e. $2^{N-1}(\varepsilon_{MSB}-\varepsilon_{rest})$ LSB. Requiring $\lvert\mathrm{DNL}\rvert<\tfrac12$ gives $\lvert\varepsilon_{MSB}-\varepsilon_{rest}\rvert<2^{-N}$. The DAC-level INL/DNL definitions are in [[DACs]].

> [!tip] Remark
> There is no $g_m/I_D$ step here: the random share sets the unit *area* (Pelgrom, [[Device Matching#Spec translation]]), and for a MOS pair the circuit sets $g_m/I_D$ through [[gm-ID Design Methodology]]. This note only decides how the units are arranged and wired.

> [!example] Worked example: when does a CDAC need common centroid, and when more?
> **Gradient.** Hastings' measured oxide gradient: 5% radial over a 200 mm wafer, i.e. $g_1 = 0.5$ ppm/µm (Hastings p. 704). Units of 20 µm pitch (the low end of Hastings' optimum unit-capacitor size, 20–50 µm square, Rule 8.3.2-3).
>
> **10 bits, MSB as one block.** 1024 units in $32\times32$; put the MSB in the left half and the rest in the right: centroid spacing 16 pitches = 320 µm, so $\varepsilon_{MSB}-\varepsilon_{rest}=0.5\times320 = 160$ ppm. Midscale DNL $=2^{9}\times160\times10^{-6}=0.08$ LSB. **Passes without common centroid.**
>
> **14 bits, same layout.** $128\times128$, spacing 64 pitches = 1280 µm, 640 ppm; DNL $=2^{13}\times640\times10^{-6}\approx5.2$ LSB. **Fails by 10×; common centroid ($d_{cc}=0$) removes it exactly.**
>
> **Does the quadratic residue then matter?** A capacitor is $C_u t_0/t$, so even a perfectly linear thickness gradient makes a quadratic capacitance term with $g_2 = g_1^2$ ([[#Even a Linear Process Gradient Has a Quadratic Part]]). The spiral array of [[#Three Placements of One Binary Array|the 8×8 example]] leaves the MSB a bowl moment $\Delta\overline{r^2}=4.9\,p^2$; scaled self-similarly to $128\times128$ that is $4.9\times16^2\approx1250\,p^2$, and $\varepsilon\approx(0.5\times10^{-6})^2\times1250\times(20)^2\approx10^{-7}$: negligible. With Hastings' oxide number, **order 1 is enough**; the order-2 and higher terms that do bite come from thermal and stress curvature, which must be estimated from the die's thermal and stress map ([[Device Matching#Level 2 Die-Level Gradients]]).
>
> **When the gradient is large.** Karmokar et al. sweep the gradient coefficient for a 10-bit binary CDAC ($C_u=5$ fF, 12 nm): at $\gamma=10$ ppm the spiral gives $\{|\mathrm{DNL}|,|\mathrm{INL}|\}=\{0.22, 0.31\}$ LSB, at $\gamma=100$ ppm it collapses to $\{4.93, 2.56\}$, while the chessboard stays at $\{0.06, 0.34\}$ (Table III). Same centroids, different dispersion: a tenfold gradient is a hundredfold quadratic term, and only the dispersed array cancels it.

> [!warning] Unverified: the size of real capacitor gradients
> Karmokar et al. state that their $\gamma = 10$ ppm and correlation $\rho_u = 0.9$ are inherited from older papers and that no measured correlation data for capacitive structures exist (TCAD 2023, Sec. V). The paper also does not give the length unit of $\gamma$. Use the sweep as a trend, not as a design number.

## Level 0: The Centroid Condition

### Centroid of a Segmented Device

$$
\boxed{\bar x_j = \frac{1}{s_j}\sum_{i=1}^{s_j}x_i^{(j)}\ \text{ equal for all devices } j,\quad \text{and likewise } \bar y_j}
$$

- Device $j$ has $s_j$ units at $(x_i^{(j)},y_i^{(j)})$. One dimension needs only the $x$ condition; a 2-D array needs both (Karmokar review, Eqs. 1–3).
- **Building by pairs** (Hastings §8.2.7): place units in pairs about the axis of symmetry; each pair must (1) belong to the same device, (2) have the same weight in that device, (3) sit the same distance from the axis. An odd unit goes on the axis.
- When the network mixes series and parallel segments, the weight is $\partial R/\partial R_i$, not the area:

$$
\boxed{X_R = \frac{\sum_i \frac{\partial R}{\partial R_i}X_i}{\sum_i\frac{\partial R}{\partial R_i}}}
$$

```tikz title="A segment's pull on the centroid is its weight dR/dR_i, not its area. Series and parallel segments of the same resistor must each be mirrored with their own kind: SPPS has its centroid on the axis, SSPP does not. After Hastings Eqs. 8.24-8.25 and his SPPS example."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\node[font=\scriptsize\bfseries,anchor=west] at (-0.1,1.55) {25 k$\Omega$ = two 10 k$\Omega$ in series (S) + two 10 k$\Omega$ in parallel (P)};
\draw[fill=orange!45] (0.00,0.40) rectangle (0.95,1.15); \node at (0.47,0.82) {S};
\node[font=\scriptsize] at (0.47,0.52) {$w=1$};
\draw[fill=orange!20] (1.10,0.40) rectangle (2.05,1.15); \node at (1.57,0.82) {P};
\node[font=\scriptsize] at (1.57,0.52) {$w=\tfrac14$};
\draw[fill=orange!20] (2.20,0.40) rectangle (3.15,1.15); \node at (2.67,0.82) {P};
\node[font=\scriptsize] at (2.67,0.52) {$w=\tfrac14$};
\draw[fill=orange!45] (3.30,0.40) rectangle (4.25,1.15); \node at (3.77,0.82) {S};
\node[font=\scriptsize] at (3.77,0.52) {$w=1$};
\draw[very thick,orange!80!black] (2.070,0.140) -- (2.230,0.300) (2.070,0.300) -- (2.230,0.140);
\node[font=\scriptsize,anchor=west,green!40!black] at (4.6,0.78) {$X=\frac{0+3+\tfrac14(1+2)}{2.5}=1.5$: on the axis};
\draw[fill=orange!45] (0.00,-1.20) rectangle (0.95,-0.45); \node at (0.47,-0.78) {S};
\node[font=\scriptsize] at (0.47,-1.08) {$w=1$};
\draw[fill=orange!45] (1.10,-1.20) rectangle (2.05,-0.45); \node at (1.57,-0.78) {S};
\node[font=\scriptsize] at (1.57,-1.08) {$w=1$};
\draw[fill=orange!20] (2.20,-1.20) rectangle (3.15,-0.45); \node at (2.67,-0.78) {P};
\node[font=\scriptsize] at (2.67,-1.08) {$w=\tfrac14$};
\draw[fill=orange!20] (3.30,-1.20) rectangle (4.25,-0.45); \node at (3.77,-0.78) {P};
\node[font=\scriptsize] at (3.77,-1.08) {$w=\tfrac14$};
\draw[very thick,red!70!black] (1.380,-1.460) -- (1.540,-1.300) (1.380,-1.300) -- (1.540,-1.460);
\node[font=\scriptsize,anchor=west,red!70!black] at (4.6,-0.82) {$X=\frac{0+1+\tfrac14(2+3)}{2.5}=0.9$: 0.6 pitch off};
\draw[dashed,gray] (2.15,-1.6) -- (2.15,1.35);
\node[font=\scriptsize,anchor=west,align=left] at (4.6,-2.0) {weight of segment $i$: $w_i = \partial R/\partial R_i$ (series 1, each of a parallel pair $\tfrac14$)};
\end{circuitikz}
\end{document}
```

> [!note]- Detail: where the 1/4 comes from
> Two equal segments $R_1 = R_2 = R_P$ in parallel give $R_\parallel = R_1R_2/(R_1+R_2)$, so $\partial R_\parallel/\partial R_1 = R_2^2/(R_1+R_2)^2 = 1/4$. A series segment adds directly: weight 1. Hastings' combined example $SPRQRQRPS$ interleaves two such resistors so that each obeys the pair rule by itself. When two centroids cannot coincide exactly, bring them as close as possible (Hastings §8.2.7).

### One Dimension: Interdigitation and Integer Ratios

```tikz title="Optimum one-axis patterns for integer ratios (Hastings Table 8.5). Every pattern is mirror-symmetric, so the A and B centroids (crosses) land on the same axis."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=white] (0.030,0.030) rectangle (0.520,0.520);
\node[font=\scriptsize] at (0.275,0.275) {A};
\draw[fill=gray!35] (0.580,0.030) rectangle (1.070,0.520);
\node[font=\scriptsize] at (0.825,0.275) {B};
\draw[fill=gray!35] (1.130,0.030) rectangle (1.620,0.520);
\node[font=\scriptsize] at (1.375,0.275) {B};
\draw[fill=white] (1.680,0.030) rectangle (2.170,0.520);
\node[font=\scriptsize] at (1.925,0.275) {A};
\draw[dashed,gray] (1.100,-0.30) -- (1.100,0.75);
\draw[very thick,black] (1.030,-0.220) -- (1.170,-0.080) (1.030,-0.080) -- (1.170,-0.220);
\draw[very thick,black] (1.030,-0.220) -- (1.170,-0.080) (1.030,-0.080) -- (1.170,-0.220);
\node[font=\scriptsize,anchor=west] at (2.40,0.27) {1:1:\ \texttt{ABBA}};
\draw[fill=white] (0.030,-0.970) rectangle (0.520,-0.480);
\node[font=\scriptsize] at (0.275,-0.725) {A};
\draw[fill=gray!35] (0.580,-0.970) rectangle (1.070,-0.480);
\node[font=\scriptsize] at (0.825,-0.725) {B};
\draw[fill=white] (1.130,-0.970) rectangle (1.620,-0.480);
\node[font=\scriptsize] at (1.375,-0.725) {A};
\draw[dashed,gray] (0.825,-1.30) -- (0.825,-0.25);
\draw[very thick,black] (0.755,-1.220) -- (0.895,-1.080) (0.755,-1.080) -- (0.895,-1.220);
\draw[very thick,black] (0.755,-1.220) -- (0.895,-1.080) (0.755,-1.080) -- (0.895,-1.220);
\node[font=\scriptsize,anchor=west] at (1.85,-0.73) {2:1:\ \texttt{ABA}};
\draw[fill=white] (0.030,-1.970) rectangle (0.520,-1.480);
\node[font=\scriptsize] at (0.275,-1.725) {A};
\draw[fill=gray!35] (0.580,-1.970) rectangle (1.070,-1.480);
\node[font=\scriptsize] at (0.825,-1.725) {B};
\draw[fill=white] (1.130,-1.970) rectangle (1.620,-1.480);
\node[font=\scriptsize] at (1.375,-1.725) {A};
\draw[fill=gray!35] (1.680,-1.970) rectangle (2.170,-1.480);
\node[font=\scriptsize] at (1.925,-1.725) {B};
\draw[fill=white] (2.230,-1.970) rectangle (2.720,-1.480);
\node[font=\scriptsize] at (2.475,-1.725) {A};
\draw[dashed,gray] (1.375,-2.30) -- (1.375,-1.25);
\draw[very thick,black] (1.305,-2.220) -- (1.445,-2.080) (1.305,-2.080) -- (1.445,-2.220);
\draw[very thick,black] (1.305,-2.220) -- (1.445,-2.080) (1.305,-2.080) -- (1.445,-2.220);
\node[font=\scriptsize,anchor=west] at (2.95,-1.73) {3:2:\ \texttt{ABABA}};
\draw[fill=white] (0.030,-2.970) rectangle (0.520,-2.480);
\node[font=\scriptsize] at (0.275,-2.725) {A};
\draw[fill=white] (0.580,-2.970) rectangle (1.070,-2.480);
\node[font=\scriptsize] at (0.825,-2.725) {A};
\draw[fill=gray!35] (1.130,-2.970) rectangle (1.620,-2.480);
\node[font=\scriptsize] at (1.375,-2.725) {B};
\draw[fill=white] (1.680,-2.970) rectangle (2.170,-2.480);
\node[font=\scriptsize] at (1.925,-2.725) {A};
\draw[fill=white] (2.230,-2.970) rectangle (2.720,-2.480);
\node[font=\scriptsize] at (2.475,-2.725) {A};
\draw[fill=gray!35] (2.780,-2.970) rectangle (3.270,-2.480);
\node[font=\scriptsize] at (3.025,-2.725) {B};
\draw[fill=white] (3.330,-2.970) rectangle (3.820,-2.480);
\node[font=\scriptsize] at (3.575,-2.725) {A};
\draw[fill=white] (3.880,-2.970) rectangle (4.370,-2.480);
\node[font=\scriptsize] at (4.125,-2.725) {A};
\draw[dashed,gray] (2.200,-3.30) -- (2.200,-2.25);
\draw[very thick,black] (2.130,-3.220) -- (2.270,-3.080) (2.130,-3.080) -- (2.270,-3.220);
\draw[very thick,black] (2.130,-3.220) -- (2.270,-3.080) (2.130,-3.080) -- (2.270,-3.220);
\node[font=\scriptsize,anchor=west] at (4.60,-2.73) {3:1:\ \texttt{AABAABAA}};
\draw[fill=white] (0.030,-3.970) rectangle (0.520,-3.480);
\node[font=\scriptsize] at (0.275,-3.725) {A};
\draw[fill=white] (0.580,-3.970) rectangle (1.070,-3.480);
\node[font=\scriptsize] at (0.825,-3.725) {A};
\draw[fill=gray!35] (1.130,-3.970) rectangle (1.620,-3.480);
\node[font=\scriptsize] at (1.375,-3.725) {B};
\draw[fill=white] (1.680,-3.970) rectangle (2.170,-3.480);
\node[font=\scriptsize] at (1.925,-3.725) {A};
\draw[fill=white] (2.230,-3.970) rectangle (2.720,-3.480);
\node[font=\scriptsize] at (2.475,-3.725) {A};
\draw[dashed,gray] (1.375,-4.30) -- (1.375,-3.25);
\draw[very thick,black] (1.305,-4.220) -- (1.445,-4.080) (1.305,-4.080) -- (1.445,-4.220);
\draw[very thick,black] (1.305,-4.220) -- (1.445,-4.080) (1.305,-4.080) -- (1.445,-4.220);
\node[font=\scriptsize,anchor=west] at (2.95,-3.73) {4:1:\ \texttt{AABAA}};
\draw[fill=white] (0.030,-4.970) rectangle (0.520,-4.480);
\node[font=\scriptsize] at (0.275,-4.725) {A};
\draw[fill=white] (0.580,-4.970) rectangle (1.070,-4.480);
\node[font=\scriptsize] at (0.825,-4.725) {A};
\draw[fill=gray!35] (1.130,-4.970) rectangle (1.620,-4.480);
\node[font=\scriptsize] at (1.375,-4.725) {B};
\draw[fill=white] (1.680,-4.970) rectangle (2.170,-4.480);
\node[font=\scriptsize] at (1.925,-4.725) {A};
\draw[fill=gray!35] (2.230,-4.970) rectangle (2.720,-4.480);
\node[font=\scriptsize] at (2.475,-4.725) {B};
\draw[fill=white] (2.780,-4.970) rectangle (3.270,-4.480);
\node[font=\scriptsize] at (3.025,-4.725) {A};
\draw[fill=white] (3.330,-4.970) rectangle (3.820,-4.480);
\node[font=\scriptsize] at (3.575,-4.725) {A};
\draw[dashed,gray] (1.925,-5.30) -- (1.925,-4.25);
\draw[very thick,black] (1.855,-5.220) -- (1.995,-5.080) (1.855,-5.080) -- (1.995,-5.220);
\draw[very thick,black] (1.855,-5.220) -- (1.995,-5.080) (1.855,-5.080) -- (1.995,-5.220);
\node[font=\scriptsize,anchor=west] at (4.05,-4.73) {5:2:\ \texttt{AABABAA}};
\node[font=\scriptsize,anchor=west,align=left] at (6.3,-1.0) {pair rule (Hastings \S8.2.7): every pair of\\ segments placed about the axis must\\ (1) belong to the same device,\\ (2) have the same weight in it,\\ (3) sit the same distance from the axis.\\ An odd count puts one segment on the axis.};
\node[font=\scriptsize,anchor=west,gray] at (6.3,-4.1) {dashed: axis of symmetry of each row};
\node[font=\scriptsize,anchor=west] at (6.3,-3.6) {$\times$ under a row: centroid of A and of B (they coincide)};
\end{circuitikz}
\end{document}
```

- **Interdigitation** means the units of the devices interpenetrate like the fingers of two hands; it is common-centroid only if the pattern is mirror-symmetric. ABAB is interdigitated but its centroids are one pitch apart.
- Ratios use more units of one device: the smaller device in the middle (ABA for 2:1). Hastings' Table 8.2 extends each pattern by repetition (ABBA → ABABBABA → ABABABBABABA; ABCCBA for three devices).
- **Non-standard ratios:** start from $n_A$ A's and $n_B$ B's and scatter until it looks symmetric (9:5 → ABAABAABABAABA); the centroids then differ by much less than the array width. To give a lone small device more area, make it series-parallel: a 9:1 divider becomes 9:4 (AABAABABAABAA) with the "1" built from four segments (two parallel pairs in series), halving its random mismatch (Hastings §8.2.7).
- **Several matched pairs in one array:** put the pair that matters most in its own common-centroid subgroup. ABBACCABBA is best for A–B; BBACAACABB is best for A–C (Hastings).

> [!tip] Remark
> Razavi's version of the same comparison (1-D cross-coupling, Fig. 19.20: near/far vs. every-other connection) is worked as numbers in [[Device Matching#Cancelling a Linear Gradient the Arithmetic]].

### Two Dimensions: Cross-Coupled Pair and Checkerboard

```tikz title="Two-dimensional common-centroid arrays: the cross-coupled pair and its extensions (Hastings Table 8.3 and Fig. 8.16). C, the third device, is shaded blue."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=white] (0.030,2.530) rectangle (0.470,2.970);
\node[font=\scriptsize] at (0.250,2.750) {A};
\draw[fill=gray!35] (0.530,2.530) rectangle (0.970,2.970);
\node[font=\scriptsize] at (0.750,2.750) {B};
\draw[fill=gray!35] (0.030,2.030) rectangle (0.470,2.470);
\node[font=\scriptsize] at (0.250,2.250) {B};
\draw[fill=white] (0.530,2.030) rectangle (0.970,2.470);
\node[font=\scriptsize] at (0.750,2.250) {A};
\node[font=\scriptsize,anchor=north] at (0.50,1.90) {AB/BA};
\draw[fill=white] (1.830,2.530) rectangle (2.270,2.970);
\node[font=\scriptsize] at (2.050,2.750) {A};
\draw[fill=gray!35] (2.330,2.530) rectangle (2.770,2.970);
\node[font=\scriptsize] at (2.550,2.750) {B};
\draw[fill=white] (2.830,2.530) rectangle (3.270,2.970);
\node[font=\scriptsize] at (3.050,2.750) {A};
\draw[fill=gray!35] (1.830,2.030) rectangle (2.270,2.470);
\node[font=\scriptsize] at (2.050,2.250) {B};
\draw[fill=white] (2.330,2.030) rectangle (2.770,2.470);
\node[font=\scriptsize] at (2.550,2.250) {A};
\draw[fill=gray!35] (2.830,2.030) rectangle (3.270,2.470);
\node[font=\scriptsize] at (3.050,2.250) {B};
\node[font=\scriptsize,anchor=north] at (2.55,1.90) {2-D, 1:1, odd};
\draw[fill=white] (4.130,2.530) rectangle (4.570,2.970);
\node[font=\scriptsize] at (4.350,2.750) {A};
\draw[fill=white] (4.630,2.530) rectangle (5.070,2.970);
\node[font=\scriptsize] at (4.850,2.750) {A};
\draw[fill=gray!35] (5.130,2.530) rectangle (5.570,2.970);
\node[font=\scriptsize] at (5.350,2.750) {B};
\draw[fill=gray!35] (4.130,2.030) rectangle (4.570,2.470);
\node[font=\scriptsize] at (4.350,2.250) {B};
\draw[fill=white] (4.630,2.030) rectangle (5.070,2.470);
\node[font=\scriptsize] at (4.850,2.250) {A};
\draw[fill=white] (5.130,2.030) rectangle (5.570,2.470);
\node[font=\scriptsize] at (5.350,2.250) {A};
\node[font=\scriptsize,anchor=north] at (4.85,1.90) {2:1};
\draw[fill=white] (6.430,2.530) rectangle (6.870,2.970);
\node[font=\scriptsize] at (6.650,2.750) {A};
\draw[fill=gray!35] (6.930,2.530) rectangle (7.370,2.970);
\node[font=\scriptsize] at (7.150,2.750) {B};
\draw[fill=blue!20] (7.430,2.530) rectangle (7.870,2.970);
\node[font=\scriptsize] at (7.650,2.750) {C};
\draw[fill=blue!20] (7.930,2.530) rectangle (8.370,2.970);
\node[font=\scriptsize] at (8.150,2.750) {C};
\draw[fill=gray!35] (8.430,2.530) rectangle (8.870,2.970);
\node[font=\scriptsize] at (8.650,2.750) {B};
\draw[fill=white] (8.930,2.530) rectangle (9.370,2.970);
\node[font=\scriptsize] at (9.150,2.750) {A};
\draw[fill=blue!20] (6.430,2.030) rectangle (6.870,2.470);
\node[font=\scriptsize] at (6.650,2.250) {C};
\draw[fill=gray!35] (6.930,2.030) rectangle (7.370,2.470);
\node[font=\scriptsize] at (7.150,2.250) {B};
\draw[fill=white] (7.430,2.030) rectangle (7.870,2.470);
\node[font=\scriptsize] at (7.650,2.250) {A};
\draw[fill=white] (7.930,2.030) rectangle (8.370,2.470);
\node[font=\scriptsize] at (8.150,2.250) {A};
\draw[fill=gray!35] (8.430,2.030) rectangle (8.870,2.470);
\node[font=\scriptsize] at (8.650,2.250) {B};
\draw[fill=blue!20] (8.930,2.030) rectangle (9.370,2.470);
\node[font=\scriptsize] at (9.150,2.250) {C};
\node[font=\scriptsize,anchor=north] at (7.90,1.90) {three devices};
\draw[fill=white] (10.230,2.530) rectangle (10.670,2.970);
\node[font=\scriptsize] at (10.450,2.750) {A};
\draw[fill=gray!35] (10.730,2.530) rectangle (11.170,2.970);
\node[font=\scriptsize] at (10.950,2.750) {B};
\draw[fill=white] (11.230,2.530) rectangle (11.670,2.970);
\node[font=\scriptsize] at (11.450,2.750) {A};
\draw[fill=gray!35] (11.730,2.530) rectangle (12.170,2.970);
\node[font=\scriptsize] at (11.950,2.750) {B};
\draw[fill=gray!35] (10.230,2.030) rectangle (10.670,2.470);
\node[font=\scriptsize] at (10.450,2.250) {B};
\draw[fill=white] (10.730,2.030) rectangle (11.170,2.470);
\node[font=\scriptsize] at (10.950,2.250) {A};
\draw[fill=gray!35] (11.230,2.030) rectangle (11.670,2.470);
\node[font=\scriptsize] at (11.450,2.250) {B};
\draw[fill=white] (11.730,2.030) rectangle (12.170,2.470);
\node[font=\scriptsize] at (11.950,2.250) {A};
\draw[fill=white] (10.230,1.530) rectangle (10.670,1.970);
\node[font=\scriptsize] at (10.450,1.750) {A};
\draw[fill=gray!35] (10.730,1.530) rectangle (11.170,1.970);
\node[font=\scriptsize] at (10.950,1.750) {B};
\draw[fill=white] (11.230,1.530) rectangle (11.670,1.970);
\node[font=\scriptsize] at (11.450,1.750) {A};
\draw[fill=gray!35] (11.730,1.530) rectangle (12.170,1.970);
\node[font=\scriptsize] at (11.950,1.750) {B};
\draw[fill=gray!35] (10.230,1.030) rectangle (10.670,1.470);
\node[font=\scriptsize] at (10.450,1.250) {B};
\draw[fill=white] (10.730,1.030) rectangle (11.170,1.470);
\node[font=\scriptsize] at (10.950,1.250) {A};
\draw[fill=gray!35] (11.230,1.030) rectangle (11.670,1.470);
\node[font=\scriptsize] at (11.450,1.250) {B};
\draw[fill=white] (11.730,1.030) rectangle (12.170,1.470);
\node[font=\scriptsize] at (11.950,1.250) {A};
\node[font=\scriptsize,anchor=north] at (11.20,0.90) {checkerboard};
\end{circuitikz}
\end{document}
```

- **Cross-coupled pair** (AB/BA; invented by George Erdi for the µA725 op amp around 1970, Hastings fn. 30): each device on one diagonal, so a plane gradient $g_xx+g_yy$ in any direction cancels. It also cancels $x^2$ and $y^2$, which a 1-D ABBA cannot; it leaves only the saddle $xy$ ([[#The Moment Table]]).
- Capacitors and square MOS sections make compact cross-coupled arrays; long, thin resistors make spindly ones, so resistors usually stay 1-D (Hastings).
- Every entry of Hastings' Table 8.3 is a cross-coupled pair or an extension of it, including ratio arrays (AAB/BAA for 2:1) and three devices (ABCCBA/CBAABC).
- **Routing is the price.** Razavi notes the diagonal connections are hard to route without creating the very asymmetries the pattern removes (wire over one device only, unequal wire capacitance), and prefers 1-D cross-coupling for whole op amps (§19.2.2).

## Level 1: Beyond Linear: Moments and Nth-Order Patterns

### The Moment Table

Write the gradient as a 2-D polynomial about the array centre (Dai et al. Eqs. 3–5); a unit at $(x_i,y_i)$ shifts by $p(x_i,y_i)$, and a device by the **average** over its units. The mismatch from term $g_{jk}x^jy^k$ is then $g_{jk}$ times a pure number of the pattern:

$$
\boxed{\varepsilon_{A-B}=\sum_{j,k}g_{jk}\,\Delta m_{jk}\,p^{\,j+k},\qquad \Delta m_{jk}=\overline{x^jy^k}\big|_A-\overline{x^jy^k}\big|_B\ \ (\text{positions in pitches})}
$$

A pattern cancels order $q$ when every $\Delta m_{jk}$ with $j+k=q$ is zero. Exact values (fractions computed over the tiles, pitch 1, origin at the array centre):

| Pattern | $x$ | $x^2$ | $xy$ | $x^3$ | $x^2y$ | $x^4$ | $x^2y^2$ | $x^3y$ | cancels orders |
|---|---|---|---|---|---|---|---|---|---|
| AABB | −2 | 0 | – | −3.5 | – | 0 | – | – | none |
| ABAB | −1 | 0 | – | −3.25 | – | 0 | – | – | none |
| ABBA | 0 | **2** | – | 0 | – | 0 | – | – | 1, 3, 5 (odd) |
| ABBABAAB | 0 | 0 | – | **−12** | – | 0 | – | – | 1, 2, 4 |
| AB/BA | 0 | 0 | **−½** | 0 | 0 | 0 | 0 | −⅛ | 1 (+ $x^2$, $y^2$) |
| ABAB/BABA ×2 (4×4 checkerboard) | 0 | 0 | **−½** | 0 | 0 | 0 | 0 | −13/8 | 1 (+ $x^2$, $y^2$) |
| ABBA/BAAB | 0 | 0 | 0 | 0 | **1** | 0 | 0 | 0 | 1, 2 |
| ABBA/BAAB/BAAB/ABBA | 0 | 0 | 0 | 0 | 0 | 0 | **2** | 0 | 1, 2, 3 |
| ABBABAAB/BAABABBA | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **−6** | 1, 2, 3 |

(Bold: the first term that survives. "–": a 1-D pattern has no $y$. The $y$-only columns behave like their $x$ partners and are omitted.)

```tikz title="A gradient term is a map of numbers over the array; a device sees the average over its tiles. The 4x4 checkerboard cancels x and x^2 but not the saddle xy (A sits on the -xy diagonals): residue -1/2 per unit of g_xy p^2. Values in pitches from the array centre; red positive, blue negative."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=blue!60] (0.00,-0.00) rectangle (0.70,0.70);
\node[font=\scriptsize] at (0.35,0.46) {\textbf{A}};
\node[font=\tiny] at (0.35,0.17) {-1.5};
\draw[fill=blue!26] (0.70,-0.00) rectangle (1.40,0.70);
\node[font=\scriptsize] at (1.05,0.46) {\textbf{B}};
\node[font=\tiny] at (1.05,0.17) {-0.5};
\draw[fill=red!26] (1.40,-0.00) rectangle (2.10,0.70);
\node[font=\scriptsize] at (1.75,0.46) {\textbf{A}};
\node[font=\tiny] at (1.75,0.17) {0.5};
\draw[fill=red!60] (2.10,-0.00) rectangle (2.80,0.70);
\node[font=\scriptsize] at (2.45,0.46) {\textbf{B}};
\node[font=\tiny] at (2.45,0.17) {1.5};
\draw[fill=blue!60] (0.00,-0.70) rectangle (0.70,0.00);
\node[font=\scriptsize] at (0.35,-0.24) {\textbf{B}};
\node[font=\tiny] at (0.35,-0.52) {-1.5};
\draw[fill=blue!26] (0.70,-0.70) rectangle (1.40,0.00);
\node[font=\scriptsize] at (1.05,-0.24) {\textbf{A}};
\node[font=\tiny] at (1.05,-0.52) {-0.5};
\draw[fill=red!26] (1.40,-0.70) rectangle (2.10,0.00);
\node[font=\scriptsize] at (1.75,-0.24) {\textbf{B}};
\node[font=\tiny] at (1.75,-0.52) {0.5};
\draw[fill=red!60] (2.10,-0.70) rectangle (2.80,0.00);
\node[font=\scriptsize] at (2.45,-0.24) {\textbf{A}};
\node[font=\tiny] at (2.45,-0.52) {1.5};
\draw[fill=blue!60] (0.00,-1.40) rectangle (0.70,-0.70);
\node[font=\scriptsize] at (0.35,-0.94) {\textbf{A}};
\node[font=\tiny] at (0.35,-1.22) {-1.5};
\draw[fill=blue!26] (0.70,-1.40) rectangle (1.40,-0.70);
\node[font=\scriptsize] at (1.05,-0.94) {\textbf{B}};
\node[font=\tiny] at (1.05,-1.22) {-0.5};
\draw[fill=red!26] (1.40,-1.40) rectangle (2.10,-0.70);
\node[font=\scriptsize] at (1.75,-0.94) {\textbf{A}};
\node[font=\tiny] at (1.75,-1.22) {0.5};
\draw[fill=red!60] (2.10,-1.40) rectangle (2.80,-0.70);
\node[font=\scriptsize] at (2.45,-0.94) {\textbf{B}};
\node[font=\tiny] at (2.45,-1.22) {1.5};
\draw[fill=blue!60] (0.00,-2.10) rectangle (0.70,-1.40);
\node[font=\scriptsize] at (0.35,-1.64) {\textbf{B}};
\node[font=\tiny] at (0.35,-1.92) {-1.5};
\draw[fill=blue!26] (0.70,-2.10) rectangle (1.40,-1.40);
\node[font=\scriptsize] at (1.05,-1.64) {\textbf{A}};
\node[font=\tiny] at (1.05,-1.92) {-0.5};
\draw[fill=red!26] (1.40,-2.10) rectangle (2.10,-1.40);
\node[font=\scriptsize] at (1.75,-1.64) {\textbf{B}};
\node[font=\tiny] at (1.75,-1.92) {0.5};
\draw[fill=red!60] (2.10,-2.10) rectangle (2.80,-1.40);
\node[font=\scriptsize] at (2.45,-1.64) {\textbf{A}};
\node[font=\tiny] at (2.45,-1.92) {1.5};
\node at (1.40,1.0) {gradient $x$};
\draw[fill=red!60] (3.60,-0.00) rectangle (4.30,0.70);
\node[font=\scriptsize] at (3.95,0.46) {\textbf{A}};
\node[font=\tiny] at (3.95,0.17) {2.25};
\draw[fill=red!15] (4.30,-0.00) rectangle (5.00,0.70);
\node[font=\scriptsize] at (4.65,0.46) {\textbf{B}};
\node[font=\tiny] at (4.65,0.17) {0.25};
\draw[fill=red!15] (5.00,-0.00) rectangle (5.70,0.70);
\node[font=\scriptsize] at (5.35,0.46) {\textbf{A}};
\node[font=\tiny] at (5.35,0.17) {0.25};
\draw[fill=red!60] (5.70,-0.00) rectangle (6.40,0.70);
\node[font=\scriptsize] at (6.05,0.46) {\textbf{B}};
\node[font=\tiny] at (6.05,0.17) {2.25};
\draw[fill=red!60] (3.60,-0.70) rectangle (4.30,0.00);
\node[font=\scriptsize] at (3.95,-0.24) {\textbf{B}};
\node[font=\tiny] at (3.95,-0.52) {2.25};
\draw[fill=red!15] (4.30,-0.70) rectangle (5.00,0.00);
\node[font=\scriptsize] at (4.65,-0.24) {\textbf{A}};
\node[font=\tiny] at (4.65,-0.52) {0.25};
\draw[fill=red!15] (5.00,-0.70) rectangle (5.70,0.00);
\node[font=\scriptsize] at (5.35,-0.24) {\textbf{B}};
\node[font=\tiny] at (5.35,-0.52) {0.25};
\draw[fill=red!60] (5.70,-0.70) rectangle (6.40,0.00);
\node[font=\scriptsize] at (6.05,-0.24) {\textbf{A}};
\node[font=\tiny] at (6.05,-0.52) {2.25};
\draw[fill=red!60] (3.60,-1.40) rectangle (4.30,-0.70);
\node[font=\scriptsize] at (3.95,-0.94) {\textbf{A}};
\node[font=\tiny] at (3.95,-1.22) {2.25};
\draw[fill=red!15] (4.30,-1.40) rectangle (5.00,-0.70);
\node[font=\scriptsize] at (4.65,-0.94) {\textbf{B}};
\node[font=\tiny] at (4.65,-1.22) {0.25};
\draw[fill=red!15] (5.00,-1.40) rectangle (5.70,-0.70);
\node[font=\scriptsize] at (5.35,-0.94) {\textbf{A}};
\node[font=\tiny] at (5.35,-1.22) {0.25};
\draw[fill=red!60] (5.70,-1.40) rectangle (6.40,-0.70);
\node[font=\scriptsize] at (6.05,-0.94) {\textbf{B}};
\node[font=\tiny] at (6.05,-1.22) {2.25};
\draw[fill=red!60] (3.60,-2.10) rectangle (4.30,-1.40);
\node[font=\scriptsize] at (3.95,-1.64) {\textbf{B}};
\node[font=\tiny] at (3.95,-1.92) {2.25};
\draw[fill=red!15] (4.30,-2.10) rectangle (5.00,-1.40);
\node[font=\scriptsize] at (4.65,-1.64) {\textbf{A}};
\node[font=\tiny] at (4.65,-1.92) {0.25};
\draw[fill=red!15] (5.00,-2.10) rectangle (5.70,-1.40);
\node[font=\scriptsize] at (5.35,-1.64) {\textbf{B}};
\node[font=\tiny] at (5.35,-1.92) {0.25};
\draw[fill=red!60] (5.70,-2.10) rectangle (6.40,-1.40);
\node[font=\scriptsize] at (6.05,-1.64) {\textbf{A}};
\node[font=\tiny] at (6.05,-1.92) {2.25};
\node at (5.00,1.0) {gradient $x^2$};
\draw[fill=blue!60] (7.20,-0.00) rectangle (7.90,0.70);
\node[font=\scriptsize] at (7.55,0.46) {\textbf{A}};
\node[font=\tiny] at (7.55,0.17) {-2.25};
\draw[fill=blue!26] (7.90,-0.00) rectangle (8.60,0.70);
\node[font=\scriptsize] at (8.25,0.46) {\textbf{B}};
\node[font=\tiny] at (8.25,0.17) {-0.75};
\draw[fill=red!26] (8.60,-0.00) rectangle (9.30,0.70);
\node[font=\scriptsize] at (8.95,0.46) {\textbf{A}};
\node[font=\tiny] at (8.95,0.17) {0.75};
\draw[fill=red!60] (9.30,-0.00) rectangle (10.00,0.70);
\node[font=\scriptsize] at (9.65,0.46) {\textbf{B}};
\node[font=\tiny] at (9.65,0.17) {2.25};
\draw[fill=blue!26] (7.20,-0.70) rectangle (7.90,0.00);
\node[font=\scriptsize] at (7.55,-0.24) {\textbf{B}};
\node[font=\tiny] at (7.55,-0.52) {-0.75};
\draw[fill=blue!15] (7.90,-0.70) rectangle (8.60,0.00);
\node[font=\scriptsize] at (8.25,-0.24) {\textbf{A}};
\node[font=\tiny] at (8.25,-0.52) {-0.25};
\draw[fill=red!15] (8.60,-0.70) rectangle (9.30,0.00);
\node[font=\scriptsize] at (8.95,-0.24) {\textbf{B}};
\node[font=\tiny] at (8.95,-0.52) {0.25};
\draw[fill=red!26] (9.30,-0.70) rectangle (10.00,0.00);
\node[font=\scriptsize] at (9.65,-0.24) {\textbf{A}};
\node[font=\tiny] at (9.65,-0.52) {0.75};
\draw[fill=red!26] (7.20,-1.40) rectangle (7.90,-0.70);
\node[font=\scriptsize] at (7.55,-0.94) {\textbf{A}};
\node[font=\tiny] at (7.55,-1.22) {0.75};
\draw[fill=red!15] (7.90,-1.40) rectangle (8.60,-0.70);
\node[font=\scriptsize] at (8.25,-0.94) {\textbf{B}};
\node[font=\tiny] at (8.25,-1.22) {0.25};
\draw[fill=blue!15] (8.60,-1.40) rectangle (9.30,-0.70);
\node[font=\scriptsize] at (8.95,-0.94) {\textbf{A}};
\node[font=\tiny] at (8.95,-1.22) {-0.25};
\draw[fill=blue!26] (9.30,-1.40) rectangle (10.00,-0.70);
\node[font=\scriptsize] at (9.65,-0.94) {\textbf{B}};
\node[font=\tiny] at (9.65,-1.22) {-0.75};
\draw[fill=red!60] (7.20,-2.10) rectangle (7.90,-1.40);
\node[font=\scriptsize] at (7.55,-1.64) {\textbf{B}};
\node[font=\tiny] at (7.55,-1.92) {2.25};
\draw[fill=red!26] (7.90,-2.10) rectangle (8.60,-1.40);
\node[font=\scriptsize] at (8.25,-1.64) {\textbf{A}};
\node[font=\tiny] at (8.25,-1.92) {0.75};
\draw[fill=blue!26] (8.60,-2.10) rectangle (9.30,-1.40);
\node[font=\scriptsize] at (8.95,-1.64) {\textbf{B}};
\node[font=\tiny] at (8.95,-1.92) {-0.75};
\draw[fill=blue!60] (9.30,-2.10) rectangle (10.00,-1.40);
\node[font=\scriptsize] at (9.65,-1.64) {\textbf{A}};
\node[font=\tiny] at (9.65,-1.92) {-2.25};
\node at (8.60,1.0) {gradient $xy$};
\node[font=\scriptsize,align=center] at (1.4,-2.75) {$\bar{x}_A-\bar{x}_B = 0$\\ cancelled};
\node[font=\scriptsize,align=center] at (5.0,-2.75) {$\overline{x^2}_A-\overline{x^2}_B = 0$\\ cancelled};
\node[font=\scriptsize,align=center,red!70!black] at (8.6,-2.75) {$\overline{xy}_A-\overline{xy}_B = -\tfrac12$\\ \textbf{left over}};
\end{circuitikz}
\end{document}
```

> [!note]- Detail: why averaging, and how the table was computed
> Dai et al. take each unit's parameter as the polynomial evaluated at its centre (the gradient inside one small unit is negligible) and a device's parameter as the sum over its units (their Eq. 5). For two devices with equal unit counts, sum and average differ only by a common factor. Each table entry is $\frac{1}{s_A}\sum_A x^jy^k-\frac{1}{s_B}\sum_B x^jy^k$ with unit centres at half-integer coordinates, e.g. ABBA: A at $\pm1.5$, B at $\pm0.5$, so $\Delta m_{2}=2.25-0.25=2$. The numbers are exact rational arithmetic, not a simulation.

### Even a Linear Process Gradient Has a Quadratic Part

$$
\boxed{C=C_u\frac{t_0}{t_0+\gamma x}\approx C_u\left[1-\frac{\gamma x}{t_0}+\left(\frac{\gamma x}{t_0}\right)^2-\dots\right]\ \Rightarrow\ g_2 = g_1^2}
$$

- The gradient is linear in the **dielectric thickness** (Karmokar's model $t_j=t_0+\gamma(x_j\cos\theta+y_j\sin\theta)$), but capacitance is $\propto1/t$, so the capacitance gradient has every order. Common centroid kills the linear part; the quadratic part grows as the **square** of the gradient.
- This is why Karmokar et al. see CC arrays lose accuracy as $\gamma$ grows (Table III): "the linear approximation to $C$ becomes increasingly inaccurate". The same holds for any parameter that depends nonlinearly on the graded quantity; Hastings adds that a nonlinear temperature coefficient does it too (§8.2.7).

### Self-Symmetry Kills Odd Orders, Mutual Symmetry Kills Even

```tikz title="The two kinds of central symmetry (Dai et al. Sec. III). Self-symmetry of each device kills odd orders; A-to-B symmetry kills even orders. ABBAABBA is self-symmetric only (leaves x^2); ABBABAAB is A-B symmetric and also first-order CC (leaves x^3)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\node[font=\scriptsize\bfseries,anchor=west] at (0,1.75) {self-symmetric: each A has an A mirror, each B a B};
\draw[fill=white] (0.030,0.330) rectangle (0.570,0.870);
\node[font=\scriptsize] at (0.300,0.600) {A};
\draw[fill=gray!35] (0.630,0.330) rectangle (1.170,0.870);
\node[font=\scriptsize] at (0.900,0.600) {B};
\draw[fill=gray!35] (1.230,0.330) rectangle (1.770,0.870);
\node[font=\scriptsize] at (1.500,0.600) {B};
\draw[fill=white] (1.830,0.330) rectangle (2.370,0.870);
\node[font=\scriptsize] at (2.100,0.600) {A};
\draw[fill=white] (2.430,0.330) rectangle (2.970,0.870);
\node[font=\scriptsize] at (2.700,0.600) {A};
\draw[fill=gray!35] (3.030,0.330) rectangle (3.570,0.870);
\node[font=\scriptsize] at (3.300,0.600) {B};
\draw[fill=gray!35] (3.630,0.330) rectangle (4.170,0.870);
\node[font=\scriptsize] at (3.900,0.600) {B};
\draw[fill=white] (4.230,0.330) rectangle (4.770,0.870);
\node[font=\scriptsize] at (4.500,0.600) {A};
\draw[<->,black] (0.30,0.25) to[bend right=25] (4.50,0.25);
\draw[<->,black] (2.10,0.25) to[bend right=25] (2.70,0.25);
\draw[<->,gray] (0.90,0.95) to[bend left=25] (3.90,0.95);
\draw[<->,gray] (1.50,0.95) to[bend left=25] (3.30,0.95);
\node[font=\scriptsize,anchor=west,align=left] at (5.2,0.6) {$x^k$ with $k$ odd: $(+d)^k+(-d)^k=0$ inside A and inside B\\ $\Rightarrow$ every \textbf{odd} order cancels};
\begin{scope}[yshift=-2.6cm]
\node[font=\scriptsize\bfseries,anchor=west] at (0,1.75) {mutually symmetric: each A has a B mirror};
\draw[fill=white] (0.030,0.330) rectangle (0.570,0.870);
\node[font=\scriptsize] at (0.300,0.600) {A};
\draw[fill=gray!35] (0.630,0.330) rectangle (1.170,0.870);
\node[font=\scriptsize] at (0.900,0.600) {B};
\draw[fill=gray!35] (1.230,0.330) rectangle (1.770,0.870);
\node[font=\scriptsize] at (1.500,0.600) {B};
\draw[fill=white] (1.830,0.330) rectangle (2.370,0.870);
\node[font=\scriptsize] at (2.100,0.600) {A};
\draw[fill=gray!35] (2.430,0.330) rectangle (2.970,0.870);
\node[font=\scriptsize] at (2.700,0.600) {B};
\draw[fill=white] (3.030,0.330) rectangle (3.570,0.870);
\node[font=\scriptsize] at (3.300,0.600) {A};
\draw[fill=white] (3.630,0.330) rectangle (4.170,0.870);
\node[font=\scriptsize] at (3.900,0.600) {A};
\draw[fill=gray!35] (4.230,0.330) rectangle (4.770,0.870);
\node[font=\scriptsize] at (4.500,0.600) {B};
\draw[<->] (0.30,0.25) to[bend right=25] (4.50,0.25);
\draw[<->] (2.10,0.25) to[bend right=25] (2.70,0.25);
\draw[<->,gray] (0.90,0.95) to[bend left=25] (3.90,0.95);
\draw[<->,gray] (1.50,0.95) to[bend left=25] (3.30,0.95);
\node[font=\scriptsize,anchor=west,align=left] at (5.2,0.6) {$x^k$ with $k$ even: $(+d)^k=(-d)^k$, one in A, one in B\\ $\Rightarrow$ every \textbf{even} order cancels};
\end{scope}
\draw[dashed,gray] (2.4,-0.25) -- (2.4,1.45); \draw[dashed,gray] (2.4,-2.85) -- (2.4,-1.15); \node[font=\scriptsize,gray,anchor=west] at (2.45,-3.0) {centre $C_n$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{each device point-symmetric about }C_n \Rightarrow \text{odd orders cancel};\qquad A \leftrightarrow B \text{ point-symmetric about } C_n \Rightarrow \text{even orders cancel}}
$$

- A point reflection sends $(x,y)\to(-x,-y)$, so $x^jy^k\to(-1)^{j+k}x^jy^k$. Paired units of the **same** device cancel every odd-order term inside that device (both devices then have zero, so they match). Paired units of **different** devices see the same even-order value, so the even terms are equal for A and B.
- Any pattern that has both properties about the same centre cancels **every** order; that needs each device to be self-symmetric *and* the two devices to be reflections of each other, which is impossible about one centre for a single pair of units. Dai's construction gets both by using **different centres** for different levels.

> [!note]- Derivation: why moving the centre only adds lower orders (Dai et al. Eqs. 7–12)
> Expand the order-$n$ term $g_{j,n-j}x^jy^{n-j}$ about any point $(x_0,y_0)$: substituting $x = (x-x_0)+x_0$ and $y=(y-y_0)+y_0$ and using the binomial theorem gives $g_{j,n-j}(x-x_0)^j(y-y_0)^{n-j}$ plus terms of order $\le n-1$ in $(x-x_0),(y-y_0)$. So the top order looks the same about every centre; only lower orders change, and those are cancelled by the $(n-1)$-th order sub-patterns, which are themselves centred on their own centres. Induction on $n$ gives cancellation of all orders $1\dots n$.

### The Nth-Order Central-Symmetric Pattern

```tikz title="Building the n-th order pattern: two copies of the (n-1)-th order pattern placed symmetrically about a new centre, with A and B swapped in one copy when n is even. Units per device double each step: 2^n. After Dai et al. Figs. 1-4(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=white] (0.030,-0.420) rectangle (0.420,-0.030);
\node[font=\tiny] at (0.225,-0.225) {A};
\draw[fill=gray!35] (0.480,-0.420) rectangle (0.870,-0.030);
\node[font=\tiny] at (0.675,-0.225) {B};
\draw[fill=gray!35] (0.930,-0.420) rectangle (1.320,-0.030);
\node[font=\tiny] at (1.125,-0.225) {B};
\draw[fill=white] (1.380,-0.420) rectangle (1.770,-0.030);
\node[font=\tiny] at (1.575,-0.225) {A};
\node[font=\scriptsize,align=center,anchor=north] at (0.90,-0.55) {$n=1$: 2 units each};
\draw[->,thick] (2.05,-0.5) -- (2.75,-0.5);
\draw[fill=white] (3.030,-0.420) rectangle (3.420,-0.030);
\node[font=\tiny] at (3.225,-0.225) {A};
\draw[fill=gray!35] (3.480,-0.420) rectangle (3.870,-0.030);
\node[font=\tiny] at (3.675,-0.225) {B};
\draw[fill=gray!35] (3.930,-0.420) rectangle (4.320,-0.030);
\node[font=\tiny] at (4.125,-0.225) {B};
\draw[fill=white] (4.380,-0.420) rectangle (4.770,-0.030);
\node[font=\tiny] at (4.575,-0.225) {A};
\draw[fill=gray!35] (3.030,-0.870) rectangle (3.420,-0.480);
\node[font=\tiny] at (3.225,-0.675) {B};
\draw[fill=white] (3.480,-0.870) rectangle (3.870,-0.480);
\node[font=\tiny] at (3.675,-0.675) {A};
\draw[fill=white] (3.930,-0.870) rectangle (4.320,-0.480);
\node[font=\tiny] at (4.125,-0.675) {A};
\draw[fill=gray!35] (4.380,-0.870) rectangle (4.770,-0.480);
\node[font=\tiny] at (4.575,-0.675) {B};
\node[font=\scriptsize,align=center,anchor=north] at (3.90,-1.00) {$n=2$: copy, swap A$\leftrightarrow$B\\ (even $n$: A$\to$B mirror)};
\draw[->,thick] (5.05,-0.5) -- (5.75,-0.5);
\draw[fill=white] (6.030,-0.420) rectangle (6.420,-0.030);
\node[font=\tiny] at (6.225,-0.225) {A};
\draw[fill=gray!35] (6.480,-0.420) rectangle (6.870,-0.030);
\node[font=\tiny] at (6.675,-0.225) {B};
\draw[fill=gray!35] (6.930,-0.420) rectangle (7.320,-0.030);
\node[font=\tiny] at (7.125,-0.225) {B};
\draw[fill=white] (7.380,-0.420) rectangle (7.770,-0.030);
\node[font=\tiny] at (7.575,-0.225) {A};
\draw[fill=gray!35] (6.030,-0.870) rectangle (6.420,-0.480);
\node[font=\tiny] at (6.225,-0.675) {B};
\draw[fill=white] (6.480,-0.870) rectangle (6.870,-0.480);
\node[font=\tiny] at (6.675,-0.675) {A};
\draw[fill=white] (6.930,-0.870) rectangle (7.320,-0.480);
\node[font=\tiny] at (7.125,-0.675) {A};
\draw[fill=gray!35] (7.380,-0.870) rectangle (7.770,-0.480);
\node[font=\tiny] at (7.575,-0.675) {B};
\draw[fill=gray!35] (6.030,-1.320) rectangle (6.420,-0.930);
\node[font=\tiny] at (6.225,-1.125) {B};
\draw[fill=white] (6.480,-1.320) rectangle (6.870,-0.930);
\node[font=\tiny] at (6.675,-1.125) {A};
\draw[fill=white] (6.930,-1.320) rectangle (7.320,-0.930);
\node[font=\tiny] at (7.125,-1.125) {A};
\draw[fill=gray!35] (7.380,-1.320) rectangle (7.770,-0.930);
\node[font=\tiny] at (7.575,-1.125) {B};
\draw[fill=white] (6.030,-1.770) rectangle (6.420,-1.380);
\node[font=\tiny] at (6.225,-1.575) {A};
\draw[fill=gray!35] (6.480,-1.770) rectangle (6.870,-1.380);
\node[font=\tiny] at (6.675,-1.575) {B};
\draw[fill=gray!35] (6.930,-1.770) rectangle (7.320,-1.380);
\node[font=\tiny] at (7.125,-1.575) {B};
\draw[fill=white] (7.380,-1.770) rectangle (7.770,-1.380);
\node[font=\tiny] at (7.575,-1.575) {A};
\node[font=\scriptsize,align=center,anchor=north] at (6.90,-1.90) {$n=3$: copy, mirror\\ (odd $n$: A$\to$A mirror)};
\draw[->,thick] (8.05,-0.5) -- (8.75,-0.5);
\draw[fill=gray!35] (9.030,-0.420) rectangle (9.420,-0.030);
\node[font=\tiny] at (9.225,-0.225) {B};
\draw[fill=white] (9.480,-0.420) rectangle (9.870,-0.030);
\node[font=\tiny] at (9.675,-0.225) {A};
\draw[fill=white] (9.930,-0.420) rectangle (10.320,-0.030);
\node[font=\tiny] at (10.125,-0.225) {A};
\draw[fill=gray!35] (10.380,-0.420) rectangle (10.770,-0.030);
\node[font=\tiny] at (10.575,-0.225) {B};
\draw[fill=white] (9.030,-0.870) rectangle (9.420,-0.480);
\node[font=\tiny] at (9.225,-0.675) {A};
\draw[fill=gray!35] (9.480,-0.870) rectangle (9.870,-0.480);
\node[font=\tiny] at (9.675,-0.675) {B};
\draw[fill=gray!35] (9.930,-0.870) rectangle (10.320,-0.480);
\node[font=\tiny] at (10.125,-0.675) {B};
\draw[fill=white] (10.380,-0.870) rectangle (10.770,-0.480);
\node[font=\tiny] at (10.575,-0.675) {A};
\draw[fill=white] (9.030,-1.320) rectangle (9.420,-0.930);
\node[font=\tiny] at (9.225,-1.125) {A};
\draw[fill=gray!35] (9.480,-1.320) rectangle (9.870,-0.930);
\node[font=\tiny] at (9.675,-1.125) {B};
\draw[fill=gray!35] (9.930,-1.320) rectangle (10.320,-0.930);
\node[font=\tiny] at (10.125,-1.125) {B};
\draw[fill=white] (10.380,-1.320) rectangle (10.770,-0.930);
\node[font=\tiny] at (10.575,-1.125) {A};
\draw[fill=gray!35] (9.030,-1.770) rectangle (9.420,-1.380);
\node[font=\tiny] at (9.225,-1.575) {B};
\draw[fill=white] (9.480,-1.770) rectangle (9.870,-1.380);
\node[font=\tiny] at (9.675,-1.575) {A};
\draw[fill=white] (9.930,-1.770) rectangle (10.320,-1.380);
\node[font=\tiny] at (10.125,-1.575) {A};
\draw[fill=gray!35] (10.380,-1.770) rectangle (10.770,-1.380);
\node[font=\tiny] at (10.575,-1.575) {B};
\draw[fill=white] (9.030,-2.220) rectangle (9.420,-1.830);
\node[font=\tiny] at (9.225,-2.025) {A};
\draw[fill=gray!35] (9.480,-2.220) rectangle (9.870,-1.830);
\node[font=\tiny] at (9.675,-2.025) {B};
\draw[fill=gray!35] (9.930,-2.220) rectangle (10.320,-1.830);
\node[font=\tiny] at (10.125,-2.025) {B};
\draw[fill=white] (10.380,-2.220) rectangle (10.770,-1.830);
\node[font=\tiny] at (10.575,-2.025) {A};
\draw[fill=gray!35] (9.030,-2.670) rectangle (9.420,-2.280);
\node[font=\tiny] at (9.225,-2.475) {B};
\draw[fill=white] (9.480,-2.670) rectangle (9.870,-2.280);
\node[font=\tiny] at (9.675,-2.475) {A};
\draw[fill=white] (9.930,-2.670) rectangle (10.320,-2.280);
\node[font=\tiny] at (10.125,-2.475) {A};
\draw[fill=gray!35] (10.380,-2.670) rectangle (10.770,-2.280);
\node[font=\tiny] at (10.575,-2.475) {B};
\draw[fill=gray!35] (9.030,-3.120) rectangle (9.420,-2.730);
\node[font=\tiny] at (9.225,-2.925) {B};
\draw[fill=white] (9.480,-3.120) rectangle (9.870,-2.730);
\node[font=\tiny] at (9.675,-2.925) {A};
\draw[fill=white] (9.930,-3.120) rectangle (10.320,-2.730);
\node[font=\tiny] at (10.125,-2.925) {A};
\draw[fill=gray!35] (10.380,-3.120) rectangle (10.770,-2.730);
\node[font=\tiny] at (10.575,-2.925) {B};
\draw[fill=white] (9.030,-3.570) rectangle (9.420,-3.180);
\node[font=\tiny] at (9.225,-3.375) {A};
\draw[fill=gray!35] (9.480,-3.570) rectangle (9.870,-3.180);
\node[font=\tiny] at (9.675,-3.375) {B};
\draw[fill=gray!35] (9.930,-3.570) rectangle (10.320,-3.180);
\node[font=\tiny] at (10.125,-3.375) {B};
\draw[fill=white] (10.380,-3.570) rectangle (10.770,-3.180);
\node[font=\tiny] at (10.575,-3.375) {A};
\node[font=\scriptsize,align=center,anchor=north] at (9.90,-3.70) {$n=4$: 16 each};
\end{circuitikz}
\end{document}
```

**Construction** (Dai, He, Xing, Chen, Geiger):

1. Order 1: any common-centroid pattern (ABBA, AB/BA).
2. Order $n$: two copies of the order-$(n-1)$ pattern, placed point-symmetrically about a new centre $C_n$.
   - $n$ **odd**: copy as is: every A unit at $P$ has an **A** unit at $P'$ (self-symmetric, kills order $n$).
   - $n$ **even**: swap A↔B in one copy: every A unit at $P$ has a **B** unit at $P'$ (mutually symmetric, kills order $n$).
3. Units per device double each step: $2^n$. The copies may sit side by side (1-D, $2^n\times1$ per device pair) or stacked (2-D, nearly square), so placement is flexible.

$$
\boxed{\text{order-}n\text{ pattern: cancels gradient orders }1,\dots,n\ \text{with }2^n\text{ units per device}}
$$

Simulated mismatch (%) from Dai et al. Table I, equal total area, gradients containing terms up to the column's order (gradient magnitudes not given, so compare down a column):

| Pattern | 1st | 2nd | 3rd | 4th | 5th |
|---|---|---|---|---|---|
| (a) 1st order, AB/BA | 0 | 2.77 | 5.22 | 7.43 | 10.39 |
| (b) 2nd order, 2×4 | 0 | 0 | 0.24 | 0.87 | 1.70 |
| (c) 3rd order, 4×4 | 0 | 0 | 0 | 0.01 | 0.068 |
| (d) 4th order, 8×4 | 0 | 0 | 0 | 0 | 0.0023 |
| (e) 5th order, 8×8 | 0 | 0 | 0 | 0 | 0 |
| (f) 2nd-order circular symmetry | 0 | 0 | 0 | 0.026 | 0.18 |
| (g) hexagonal tessellation | 0 | 0 | 0.26 | 0.50 | 2.24 |

- The circular-symmetry pattern (Hastings Fig. 8.17B, the octagonal array) actually cancels to order **3**, one more than claimed for it, because each device is point-symmetric about the circle centre: the odd-order rule above. Hastings notes these rotated arrays need non-Manhattan geometry and much area; "two-dimensional common-centroid arrays will probably suffice for almost all practical applications."
- Dai's patterns are Manhattan and dense, which is their whole point.

### Dispersion and Compactness

```tikz title="Left: with the pitch fixed, one big common-centroid group leaves a quadratic residue that grows as k^2, while k repeated ABBA sub-arrays leave the residue of one (in units of g_2 p^2). Right: counting sub-arrays is only a heuristic; the moment test says the checkerboard keeps an xy residue that the ABBA/BAAB/BAAB/ABBA array cancels."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\node[font=\scriptsize\bfseries] at (2.2,1.55) {one-dimensional: residue $\overline{x^2}_A-\overline{x^2}_B$};
\draw[fill=white] (0.030,0.480) rectangle (0.290,0.740);
\node[font=\tiny] at (0.160,0.610) {A};
\draw[fill=gray!35] (0.350,0.480) rectangle (0.610,0.740);
\node[font=\tiny] at (0.480,0.610) {B};
\draw[fill=gray!35] (0.670,0.480) rectangle (0.930,0.740);
\node[font=\tiny] at (0.800,0.610) {B};
\draw[fill=white] (0.990,0.480) rectangle (1.250,0.740);
\node[font=\tiny] at (1.120,0.610) {A};
\node[font=\scriptsize,anchor=west,red!70!black] at (1.38,0.61) {2};
\draw[fill=white] (0.030,0.030) rectangle (0.290,0.290);
\node[font=\tiny] at (0.160,0.160) {A};
\draw[fill=white] (0.350,0.030) rectangle (0.610,0.290);
\node[font=\tiny] at (0.480,0.160) {A};
\draw[fill=gray!35] (0.670,0.030) rectangle (0.930,0.290);
\node[font=\tiny] at (0.800,0.160) {B};
\draw[fill=gray!35] (0.990,0.030) rectangle (1.250,0.290);
\node[font=\tiny] at (1.120,0.160) {B};
\draw[fill=gray!35] (1.310,0.030) rectangle (1.570,0.290);
\node[font=\tiny] at (1.440,0.160) {B};
\draw[fill=gray!35] (1.630,0.030) rectangle (1.890,0.290);
\node[font=\tiny] at (1.760,0.160) {B};
\draw[fill=white] (1.950,0.030) rectangle (2.210,0.290);
\node[font=\tiny] at (2.080,0.160) {A};
\draw[fill=white] (2.270,0.030) rectangle (2.530,0.290);
\node[font=\tiny] at (2.400,0.160) {A};
\node[font=\scriptsize,anchor=west,red!70!black] at (2.66,0.16) {8};
\draw[fill=white] (0.030,-0.420) rectangle (0.290,-0.160);
\node[font=\tiny] at (0.160,-0.290) {A};
\draw[fill=white] (0.350,-0.420) rectangle (0.610,-0.160);
\node[font=\tiny] at (0.480,-0.290) {A};
\draw[fill=white] (0.670,-0.420) rectangle (0.930,-0.160);
\node[font=\tiny] at (0.800,-0.290) {A};
\draw[fill=gray!35] (0.990,-0.420) rectangle (1.250,-0.160);
\node[font=\tiny] at (1.120,-0.290) {B};
\draw[fill=gray!35] (1.310,-0.420) rectangle (1.570,-0.160);
\node[font=\tiny] at (1.440,-0.290) {B};
\draw[fill=gray!35] (1.630,-0.420) rectangle (1.890,-0.160);
\node[font=\tiny] at (1.760,-0.290) {B};
\draw[fill=gray!35] (1.950,-0.420) rectangle (2.210,-0.160);
\node[font=\tiny] at (2.080,-0.290) {B};
\draw[fill=gray!35] (2.270,-0.420) rectangle (2.530,-0.160);
\node[font=\tiny] at (2.400,-0.290) {B};
\draw[fill=gray!35] (2.590,-0.420) rectangle (2.850,-0.160);
\node[font=\tiny] at (2.720,-0.290) {B};
\draw[fill=white] (2.910,-0.420) rectangle (3.170,-0.160);
\node[font=\tiny] at (3.040,-0.290) {A};
\draw[fill=white] (3.230,-0.420) rectangle (3.490,-0.160);
\node[font=\tiny] at (3.360,-0.290) {A};
\draw[fill=white] (3.550,-0.420) rectangle (3.810,-0.160);
\node[font=\tiny] at (3.680,-0.290) {A};
\node[font=\scriptsize,anchor=west,red!70!black] at (3.94,-0.29) {18};
\draw[fill=white] (0.030,-0.870) rectangle (0.290,-0.610);
\node[font=\tiny] at (0.160,-0.740) {A};
\draw[fill=white] (0.350,-0.870) rectangle (0.610,-0.610);
\node[font=\tiny] at (0.480,-0.740) {A};
\draw[fill=white] (0.670,-0.870) rectangle (0.930,-0.610);
\node[font=\tiny] at (0.800,-0.740) {A};
\draw[fill=white] (0.990,-0.870) rectangle (1.250,-0.610);
\node[font=\tiny] at (1.120,-0.740) {A};
\draw[fill=gray!35] (1.310,-0.870) rectangle (1.570,-0.610);
\node[font=\tiny] at (1.440,-0.740) {B};
\draw[fill=gray!35] (1.630,-0.870) rectangle (1.890,-0.610);
\node[font=\tiny] at (1.760,-0.740) {B};
\draw[fill=gray!35] (1.950,-0.870) rectangle (2.210,-0.610);
\node[font=\tiny] at (2.080,-0.740) {B};
\draw[fill=gray!35] (2.270,-0.870) rectangle (2.530,-0.610);
\node[font=\tiny] at (2.400,-0.740) {B};
\draw[fill=gray!35] (2.590,-0.870) rectangle (2.850,-0.610);
\node[font=\tiny] at (2.720,-0.740) {B};
\draw[fill=gray!35] (2.910,-0.870) rectangle (3.170,-0.610);
\node[font=\tiny] at (3.040,-0.740) {B};
\draw[fill=gray!35] (3.230,-0.870) rectangle (3.490,-0.610);
\node[font=\tiny] at (3.360,-0.740) {B};
\draw[fill=gray!35] (3.550,-0.870) rectangle (3.810,-0.610);
\node[font=\tiny] at (3.680,-0.740) {B};
\draw[fill=white] (3.870,-0.870) rectangle (4.130,-0.610);
\node[font=\tiny] at (4.000,-0.740) {A};
\draw[fill=white] (4.190,-0.870) rectangle (4.450,-0.610);
\node[font=\tiny] at (4.320,-0.740) {A};
\draw[fill=white] (4.510,-0.870) rectangle (4.770,-0.610);
\node[font=\tiny] at (4.640,-0.740) {A};
\draw[fill=white] (4.830,-0.870) rectangle (5.090,-0.610);
\node[font=\tiny] at (4.960,-0.740) {A};
\node[font=\scriptsize,anchor=west,red!70!black] at (5.22,-0.74) {32};
\draw[fill=white] (0.030,-1.820) rectangle (0.290,-1.560);
\node[font=\tiny] at (0.160,-1.690) {A};
\draw[fill=gray!35] (0.350,-1.820) rectangle (0.610,-1.560);
\node[font=\tiny] at (0.480,-1.690) {B};
\draw[fill=gray!35] (0.670,-1.820) rectangle (0.930,-1.560);
\node[font=\tiny] at (0.800,-1.690) {B};
\draw[fill=white] (0.990,-1.820) rectangle (1.250,-1.560);
\node[font=\tiny] at (1.120,-1.690) {A};
\node[font=\scriptsize,anchor=west,green!40!black] at (1.38,-1.69) {2};
\draw[fill=white] (0.030,-2.270) rectangle (0.290,-2.010);
\node[font=\tiny] at (0.160,-2.140) {A};
\draw[fill=gray!35] (0.350,-2.270) rectangle (0.610,-2.010);
\node[font=\tiny] at (0.480,-2.140) {B};
\draw[fill=gray!35] (0.670,-2.270) rectangle (0.930,-2.010);
\node[font=\tiny] at (0.800,-2.140) {B};
\draw[fill=white] (0.990,-2.270) rectangle (1.250,-2.010);
\node[font=\tiny] at (1.120,-2.140) {A};
\draw[fill=white] (1.310,-2.270) rectangle (1.570,-2.010);
\node[font=\tiny] at (1.440,-2.140) {A};
\draw[fill=gray!35] (1.630,-2.270) rectangle (1.890,-2.010);
\node[font=\tiny] at (1.760,-2.140) {B};
\draw[fill=gray!35] (1.950,-2.270) rectangle (2.210,-2.010);
\node[font=\tiny] at (2.080,-2.140) {B};
\draw[fill=white] (2.270,-2.270) rectangle (2.530,-2.010);
\node[font=\tiny] at (2.400,-2.140) {A};
\node[font=\scriptsize,anchor=west,green!40!black] at (2.66,-2.14) {2};
\draw[fill=white] (0.030,-2.720) rectangle (0.290,-2.460);
\node[font=\tiny] at (0.160,-2.590) {A};
\draw[fill=gray!35] (0.350,-2.720) rectangle (0.610,-2.460);
\node[font=\tiny] at (0.480,-2.590) {B};
\draw[fill=gray!35] (0.670,-2.720) rectangle (0.930,-2.460);
\node[font=\tiny] at (0.800,-2.590) {B};
\draw[fill=white] (0.990,-2.720) rectangle (1.250,-2.460);
\node[font=\tiny] at (1.120,-2.590) {A};
\draw[fill=white] (1.310,-2.720) rectangle (1.570,-2.460);
\node[font=\tiny] at (1.440,-2.590) {A};
\draw[fill=gray!35] (1.630,-2.720) rectangle (1.890,-2.460);
\node[font=\tiny] at (1.760,-2.590) {B};
\draw[fill=gray!35] (1.950,-2.720) rectangle (2.210,-2.460);
\node[font=\tiny] at (2.080,-2.590) {B};
\draw[fill=white] (2.270,-2.720) rectangle (2.530,-2.460);
\node[font=\tiny] at (2.400,-2.590) {A};
\draw[fill=white] (2.590,-2.720) rectangle (2.850,-2.460);
\node[font=\tiny] at (2.720,-2.590) {A};
\draw[fill=gray!35] (2.910,-2.720) rectangle (3.170,-2.460);
\node[font=\tiny] at (3.040,-2.590) {B};
\draw[fill=gray!35] (3.230,-2.720) rectangle (3.490,-2.460);
\node[font=\tiny] at (3.360,-2.590) {B};
\draw[fill=white] (3.550,-2.720) rectangle (3.810,-2.460);
\node[font=\tiny] at (3.680,-2.590) {A};
\node[font=\scriptsize,anchor=west,green!40!black] at (3.94,-2.59) {2};
\draw[fill=white] (0.030,-3.170) rectangle (0.290,-2.910);
\node[font=\tiny] at (0.160,-3.040) {A};
\draw[fill=gray!35] (0.350,-3.170) rectangle (0.610,-2.910);
\node[font=\tiny] at (0.480,-3.040) {B};
\draw[fill=gray!35] (0.670,-3.170) rectangle (0.930,-2.910);
\node[font=\tiny] at (0.800,-3.040) {B};
\draw[fill=white] (0.990,-3.170) rectangle (1.250,-2.910);
\node[font=\tiny] at (1.120,-3.040) {A};
\draw[fill=white] (1.310,-3.170) rectangle (1.570,-2.910);
\node[font=\tiny] at (1.440,-3.040) {A};
\draw[fill=gray!35] (1.630,-3.170) rectangle (1.890,-2.910);
\node[font=\tiny] at (1.760,-3.040) {B};
\draw[fill=gray!35] (1.950,-3.170) rectangle (2.210,-2.910);
\node[font=\tiny] at (2.080,-3.040) {B};
\draw[fill=white] (2.270,-3.170) rectangle (2.530,-2.910);
\node[font=\tiny] at (2.400,-3.040) {A};
\draw[fill=white] (2.590,-3.170) rectangle (2.850,-2.910);
\node[font=\tiny] at (2.720,-3.040) {A};
\draw[fill=gray!35] (2.910,-3.170) rectangle (3.170,-2.910);
\node[font=\tiny] at (3.040,-3.040) {B};
\draw[fill=gray!35] (3.230,-3.170) rectangle (3.490,-2.910);
\node[font=\tiny] at (3.360,-3.040) {B};
\draw[fill=white] (3.550,-3.170) rectangle (3.810,-2.910);
\node[font=\tiny] at (3.680,-3.040) {A};
\draw[fill=white] (3.870,-3.170) rectangle (4.130,-2.910);
\node[font=\tiny] at (4.000,-3.040) {A};
\draw[fill=gray!35] (4.190,-3.170) rectangle (4.450,-2.910);
\node[font=\tiny] at (4.320,-3.040) {B};
\draw[fill=gray!35] (4.510,-3.170) rectangle (4.770,-2.910);
\node[font=\tiny] at (4.640,-3.040) {B};
\draw[fill=white] (4.830,-3.170) rectangle (5.090,-2.910);
\node[font=\tiny] at (4.960,-3.040) {A};
\node[font=\scriptsize,anchor=west,green!40!black] at (5.22,-3.04) {2};
\node[font=\scriptsize,anchor=west,red!70!black] at (5.6,0.2) {one big group: $2k^2$};
\node[font=\scriptsize,anchor=west,green!40!black] at (5.6,-2.4) {$k$ ABBA sub-arrays: 2};
\begin{scope}[xshift=9.4cm,yshift=-1.6cm]
\node[font=\scriptsize\bfseries,align=center] at (2.6,2.45) {Hastings' two 4$\times$4 arrays};
\draw[fill=white] (0.030,1.530) rectangle (0.470,1.970);
\node[font=\scriptsize] at (0.250,1.750) {A};
\draw[fill=gray!35] (0.530,1.530) rectangle (0.970,1.970);
\node[font=\scriptsize] at (0.750,1.750) {B};
\draw[fill=white] (1.030,1.530) rectangle (1.470,1.970);
\node[font=\scriptsize] at (1.250,1.750) {A};
\draw[fill=gray!35] (1.530,1.530) rectangle (1.970,1.970);
\node[font=\scriptsize] at (1.750,1.750) {B};
\draw[fill=gray!35] (0.030,1.030) rectangle (0.470,1.470);
\node[font=\scriptsize] at (0.250,1.250) {B};
\draw[fill=white] (0.530,1.030) rectangle (0.970,1.470);
\node[font=\scriptsize] at (0.750,1.250) {A};
\draw[fill=gray!35] (1.030,1.030) rectangle (1.470,1.470);
\node[font=\scriptsize] at (1.250,1.250) {B};
\draw[fill=white] (1.530,1.030) rectangle (1.970,1.470);
\node[font=\scriptsize] at (1.750,1.250) {A};
\draw[fill=white] (0.030,0.530) rectangle (0.470,0.970);
\node[font=\scriptsize] at (0.250,0.750) {A};
\draw[fill=gray!35] (0.530,0.530) rectangle (0.970,0.970);
\node[font=\scriptsize] at (0.750,0.750) {B};
\draw[fill=white] (1.030,0.530) rectangle (1.470,0.970);
\node[font=\scriptsize] at (1.250,0.750) {A};
\draw[fill=gray!35] (1.530,0.530) rectangle (1.970,0.970);
\node[font=\scriptsize] at (1.750,0.750) {B};
\draw[fill=gray!35] (0.030,0.030) rectangle (0.470,0.470);
\node[font=\scriptsize] at (0.250,0.250) {B};
\draw[fill=white] (0.530,0.030) rectangle (0.970,0.470);
\node[font=\scriptsize] at (0.750,0.250) {A};
\draw[fill=gray!35] (1.030,0.030) rectangle (1.470,0.470);
\node[font=\scriptsize] at (1.250,0.250) {B};
\draw[fill=white] (1.530,0.030) rectangle (1.970,0.470);
\node[font=\scriptsize] at (1.750,0.250) {A};
\draw[fill=white] (3.230,1.530) rectangle (3.670,1.970);
\node[font=\scriptsize] at (3.450,1.750) {A};
\draw[fill=gray!35] (3.730,1.530) rectangle (4.170,1.970);
\node[font=\scriptsize] at (3.950,1.750) {B};
\draw[fill=gray!35] (4.230,1.530) rectangle (4.670,1.970);
\node[font=\scriptsize] at (4.450,1.750) {B};
\draw[fill=white] (4.730,1.530) rectangle (5.170,1.970);
\node[font=\scriptsize] at (4.950,1.750) {A};
\draw[fill=gray!35] (3.230,1.030) rectangle (3.670,1.470);
\node[font=\scriptsize] at (3.450,1.250) {B};
\draw[fill=white] (3.730,1.030) rectangle (4.170,1.470);
\node[font=\scriptsize] at (3.950,1.250) {A};
\draw[fill=white] (4.230,1.030) rectangle (4.670,1.470);
\node[font=\scriptsize] at (4.450,1.250) {A};
\draw[fill=gray!35] (4.730,1.030) rectangle (5.170,1.470);
\node[font=\scriptsize] at (4.950,1.250) {B};
\draw[fill=gray!35] (3.230,0.530) rectangle (3.670,0.970);
\node[font=\scriptsize] at (3.450,0.750) {B};
\draw[fill=white] (3.730,0.530) rectangle (4.170,0.970);
\node[font=\scriptsize] at (3.950,0.750) {A};
\draw[fill=white] (4.230,0.530) rectangle (4.670,0.970);
\node[font=\scriptsize] at (4.450,0.750) {A};
\draw[fill=gray!35] (4.730,0.530) rectangle (5.170,0.970);
\node[font=\scriptsize] at (4.950,0.750) {B};
\draw[fill=white] (3.230,0.030) rectangle (3.670,0.470);
\node[font=\scriptsize] at (3.450,0.250) {A};
\draw[fill=gray!35] (3.730,0.030) rectangle (4.170,0.470);
\node[font=\scriptsize] at (3.950,0.250) {B};
\draw[fill=gray!35] (4.230,0.030) rectangle (4.670,0.470);
\node[font=\scriptsize] at (4.450,0.250) {B};
\draw[fill=white] (4.730,0.030) rectangle (5.170,0.470);
\node[font=\scriptsize] at (4.950,0.250) {A};
\node[font=\scriptsize,align=center,anchor=north] at (1.0,-0.05) {9 cross-coupled pairs\\ (``more dispersed'')\\ leaves $xy$: $-\tfrac12$};
\node[font=\scriptsize,align=center,anchor=north] at (4.2,-0.05) {4 cross-coupled pairs\\ = Dai 3rd order\\ cancels to order 3};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{1-D, pitch }p:\quad A^kB^{2k}A^k\ \to\ 2k^2\,g_2p^2,\qquad (ABBA)^k\ \to\ 2\,g_2p^2}
$$

- **Dispersion** (Hastings rule 3): split a large array into as many sub-arrays as possible that are each common-centroid; then only each sub-array's span sets the quadratic residue. With the pitch fixed, $k$ repeated ABBAs leave the residue of one ABBA; one big $A^kB^{2k}A^k$ group leaves $k^2$ times more.
- **Compactness** (rule 4): residue ∝ span², so square beats long. 2-D AB/BA already cancels $x^2$ and $y^2$, which is why Hastings recommends 2-D arrays when units are about as long as they are wide.
- **Counting sub-arrays is a heuristic; the moment table is the test.** Hastings calls the 4×4 checkerboard (nine overlapping cross-coupled pairs) more dispersed than ABBA/BAAB/BAAB/ABBA (four), but the checkerboard keeps an $xy$ residue of $-\tfrac12$ while the other is Dai's 3rd-order pattern and cancels through order 3. The checkerboard's real advantage is against short-range *random* (spatially correlated) variation, not polynomial gradients ([[#Correlation Distance and When Not to Use Common Centroid]]).
- **Cost:** every gap between units is area that is not device; at fixed area, more units means less active area and more random mismatch. With no gradient, a common-centroid array matches no better than a simple one (Hastings §8.2.7).

> [!note]- Detail: the residue of one big group, exactly
> Positions $x=\pm\tfrac12,\pm\tfrac32,\dots$. In $A^kB^{2k}A^k$ the A's occupy $|x|\in\{k+\tfrac12,\dots,2k-\tfrac12\}$ and the B's $|x|\in\{\tfrac12,\dots,k-\tfrac12\}$; the difference of the mean squares is $2k^2$ (2, 8, 18, 32 for $k=1..4$). For $(ABBA)^k$, each ABBA is common-centroid about its own centre $c$, so a global $g_2x^2 = g_2(x-c)^2+2g_2c(x-c)+g_2c^2$ leaves only its local $g_2(x-c)^2$ residue, 2 per sub-array, the same for all of them. Device Matching quotes the same comparison as sums ($32h$ vs $8h$) and discusses Hastings' "half" statement.

## Level 2: Dummies and Array Edges

```tikz title="A 1:1 capacitor pair as a 4x8 array of 2-D ABBA sub-arrays (each 4x4 half is Dai's 3rd-order pattern) inside a dummy ring. After Hastings Fig. 8.5 and Rules 8.3.2-4 and -7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=gray!8,dashed] (0.030,2.530) rectangle (0.470,2.970);
\node[font=\scriptsize] at (0.250,2.750) {D};
\draw[fill=gray!8,dashed] (0.530,2.530) rectangle (0.970,2.970);
\node[font=\scriptsize] at (0.750,2.750) {D};
\draw[fill=gray!8,dashed] (1.030,2.530) rectangle (1.470,2.970);
\node[font=\scriptsize] at (1.250,2.750) {D};
\draw[fill=gray!8,dashed] (1.530,2.530) rectangle (1.970,2.970);
\node[font=\scriptsize] at (1.750,2.750) {D};
\draw[fill=gray!8,dashed] (2.030,2.530) rectangle (2.470,2.970);
\node[font=\scriptsize] at (2.250,2.750) {D};
\draw[fill=gray!8,dashed] (2.530,2.530) rectangle (2.970,2.970);
\node[font=\scriptsize] at (2.750,2.750) {D};
\draw[fill=gray!8,dashed] (3.030,2.530) rectangle (3.470,2.970);
\node[font=\scriptsize] at (3.250,2.750) {D};
\draw[fill=gray!8,dashed] (3.530,2.530) rectangle (3.970,2.970);
\node[font=\scriptsize] at (3.750,2.750) {D};
\draw[fill=gray!8,dashed] (4.030,2.530) rectangle (4.470,2.970);
\node[font=\scriptsize] at (4.250,2.750) {D};
\draw[fill=gray!8,dashed] (4.530,2.530) rectangle (4.970,2.970);
\node[font=\scriptsize] at (4.750,2.750) {D};
\draw[fill=gray!8,dashed] (0.030,2.030) rectangle (0.470,2.470);
\node[font=\scriptsize] at (0.250,2.250) {D};
\draw[fill=white] (0.530,2.030) rectangle (0.970,2.470);
\node[font=\scriptsize] at (0.750,2.250) {A};
\draw[fill=gray!35] (1.030,2.030) rectangle (1.470,2.470);
\node[font=\scriptsize] at (1.250,2.250) {B};
\draw[fill=gray!35] (1.530,2.030) rectangle (1.970,2.470);
\node[font=\scriptsize] at (1.750,2.250) {B};
\draw[fill=white] (2.030,2.030) rectangle (2.470,2.470);
\node[font=\scriptsize] at (2.250,2.250) {A};
\draw[fill=white] (2.530,2.030) rectangle (2.970,2.470);
\node[font=\scriptsize] at (2.750,2.250) {A};
\draw[fill=gray!35] (3.030,2.030) rectangle (3.470,2.470);
\node[font=\scriptsize] at (3.250,2.250) {B};
\draw[fill=gray!35] (3.530,2.030) rectangle (3.970,2.470);
\node[font=\scriptsize] at (3.750,2.250) {B};
\draw[fill=white] (4.030,2.030) rectangle (4.470,2.470);
\node[font=\scriptsize] at (4.250,2.250) {A};
\draw[fill=gray!8,dashed] (4.530,2.030) rectangle (4.970,2.470);
\node[font=\scriptsize] at (4.750,2.250) {D};
\draw[fill=gray!8,dashed] (0.030,1.530) rectangle (0.470,1.970);
\node[font=\scriptsize] at (0.250,1.750) {D};
\draw[fill=gray!35] (0.530,1.530) rectangle (0.970,1.970);
\node[font=\scriptsize] at (0.750,1.750) {B};
\draw[fill=white] (1.030,1.530) rectangle (1.470,1.970);
\node[font=\scriptsize] at (1.250,1.750) {A};
\draw[fill=white] (1.530,1.530) rectangle (1.970,1.970);
\node[font=\scriptsize] at (1.750,1.750) {A};
\draw[fill=gray!35] (2.030,1.530) rectangle (2.470,1.970);
\node[font=\scriptsize] at (2.250,1.750) {B};
\draw[fill=gray!35] (2.530,1.530) rectangle (2.970,1.970);
\node[font=\scriptsize] at (2.750,1.750) {B};
\draw[fill=white] (3.030,1.530) rectangle (3.470,1.970);
\node[font=\scriptsize] at (3.250,1.750) {A};
\draw[fill=white] (3.530,1.530) rectangle (3.970,1.970);
\node[font=\scriptsize] at (3.750,1.750) {A};
\draw[fill=gray!35] (4.030,1.530) rectangle (4.470,1.970);
\node[font=\scriptsize] at (4.250,1.750) {B};
\draw[fill=gray!8,dashed] (4.530,1.530) rectangle (4.970,1.970);
\node[font=\scriptsize] at (4.750,1.750) {D};
\draw[fill=gray!8,dashed] (0.030,1.030) rectangle (0.470,1.470);
\node[font=\scriptsize] at (0.250,1.250) {D};
\draw[fill=gray!35] (0.530,1.030) rectangle (0.970,1.470);
\node[font=\scriptsize] at (0.750,1.250) {B};
\draw[fill=white] (1.030,1.030) rectangle (1.470,1.470);
\node[font=\scriptsize] at (1.250,1.250) {A};
\draw[fill=white] (1.530,1.030) rectangle (1.970,1.470);
\node[font=\scriptsize] at (1.750,1.250) {A};
\draw[fill=gray!35] (2.030,1.030) rectangle (2.470,1.470);
\node[font=\scriptsize] at (2.250,1.250) {B};
\draw[fill=gray!35] (2.530,1.030) rectangle (2.970,1.470);
\node[font=\scriptsize] at (2.750,1.250) {B};
\draw[fill=white] (3.030,1.030) rectangle (3.470,1.470);
\node[font=\scriptsize] at (3.250,1.250) {A};
\draw[fill=white] (3.530,1.030) rectangle (3.970,1.470);
\node[font=\scriptsize] at (3.750,1.250) {A};
\draw[fill=gray!35] (4.030,1.030) rectangle (4.470,1.470);
\node[font=\scriptsize] at (4.250,1.250) {B};
\draw[fill=gray!8,dashed] (4.530,1.030) rectangle (4.970,1.470);
\node[font=\scriptsize] at (4.750,1.250) {D};
\draw[fill=gray!8,dashed] (0.030,0.530) rectangle (0.470,0.970);
\node[font=\scriptsize] at (0.250,0.750) {D};
\draw[fill=white] (0.530,0.530) rectangle (0.970,0.970);
\node[font=\scriptsize] at (0.750,0.750) {A};
\draw[fill=gray!35] (1.030,0.530) rectangle (1.470,0.970);
\node[font=\scriptsize] at (1.250,0.750) {B};
\draw[fill=gray!35] (1.530,0.530) rectangle (1.970,0.970);
\node[font=\scriptsize] at (1.750,0.750) {B};
\draw[fill=white] (2.030,0.530) rectangle (2.470,0.970);
\node[font=\scriptsize] at (2.250,0.750) {A};
\draw[fill=white] (2.530,0.530) rectangle (2.970,0.970);
\node[font=\scriptsize] at (2.750,0.750) {A};
\draw[fill=gray!35] (3.030,0.530) rectangle (3.470,0.970);
\node[font=\scriptsize] at (3.250,0.750) {B};
\draw[fill=gray!35] (3.530,0.530) rectangle (3.970,0.970);
\node[font=\scriptsize] at (3.750,0.750) {B};
\draw[fill=white] (4.030,0.530) rectangle (4.470,0.970);
\node[font=\scriptsize] at (4.250,0.750) {A};
\draw[fill=gray!8,dashed] (4.530,0.530) rectangle (4.970,0.970);
\node[font=\scriptsize] at (4.750,0.750) {D};
\draw[fill=gray!8,dashed] (0.030,0.030) rectangle (0.470,0.470);
\node[font=\scriptsize] at (0.250,0.250) {D};
\draw[fill=gray!8,dashed] (0.530,0.030) rectangle (0.970,0.470);
\node[font=\scriptsize] at (0.750,0.250) {D};
\draw[fill=gray!8,dashed] (1.030,0.030) rectangle (1.470,0.470);
\node[font=\scriptsize] at (1.250,0.250) {D};
\draw[fill=gray!8,dashed] (1.530,0.030) rectangle (1.970,0.470);
\node[font=\scriptsize] at (1.750,0.250) {D};
\draw[fill=gray!8,dashed] (2.030,0.030) rectangle (2.470,0.470);
\node[font=\scriptsize] at (2.250,0.250) {D};
\draw[fill=gray!8,dashed] (2.530,0.030) rectangle (2.970,0.470);
\node[font=\scriptsize] at (2.750,0.250) {D};
\draw[fill=gray!8,dashed] (3.030,0.030) rectangle (3.470,0.470);
\node[font=\scriptsize] at (3.250,0.250) {D};
\draw[fill=gray!8,dashed] (3.530,0.030) rectangle (3.970,0.470);
\node[font=\scriptsize] at (3.750,0.250) {D};
\draw[fill=gray!8,dashed] (4.030,0.030) rectangle (4.470,0.470);
\node[font=\scriptsize] at (4.250,0.250) {D};
\draw[fill=gray!8,dashed] (4.530,0.030) rectangle (4.970,0.470);
\node[font=\scriptsize] at (4.750,0.250) {D};
\draw[thick,blue!60!black,dashed] (0.5,0.5) rectangle (4.5,2.5);
\node[font=\scriptsize,anchor=west,align=left] at (5.3,1.5) {32 active units as $4\times8$ (Hastings Rule 8.3.2-4;\\ or $5\times7$ with 3 left unused)\\ + one ring of dummies on all four sides\\ \quad same spacing as inside the array\\ \quad electrodes tied to a quiet node\\ \quad width: $\le3\times$ min. (shielded, moderate),\\ \quad 10--30 \textmu m (unshielded), exact unit copies (exceptional)};
\node[font=\scriptsize,anchor=west,align=left] at (5.3,-0.3) {fill-to-rectangle dummies: $D_C = r\,s-\sum n_i$};
\end{circuitikz}
\end{document}
```

- **Every array gets dummies on all four sides** (Hastings Rule 8.3.2-7; resistor arrays at both ends, Rule 8.3.1-9; MOS dummy gates, [[Device Matching#Etch, Lithography and Dummies]]). An edge unit otherwise sees different etch loading, fringing and neighbours than an interior one, which is a gradient no pattern can cancel because it is not polynomial.
- **ABBA needs them more than ABAB looks like it does**: ABBA puts both A's at the ends. ABAB still needs them because its two ends face different geometry (Hastings).
- **Dummy rules for capacitor arrays:** same spacing as between active units; width ≤ 3× minimum under an electrostatic shield (moderate matching), 10–30 µm without a shield (fringing reaches that far), exact unit copies for exceptional matching; tie both electrodes to a quiet node, often the shared bottom plate (Rule 8.3.2-7).
- **Fill-to-rectangle dummies:** a near-square $r\times s$ array rarely holds exactly $\sum n_i$ units; the spare slots become dummies, $D_C = rs-\sum n_i$ (Karmokar review §III-C). Hastings' example: 32 units as $4\times8$, or $5\times7$ with 3 left unused (Rule 8.3.2-4).
- **Shield** matched capacitor arrays (Rule 8.3.2-8): it contains fringing (so dummies can be narrow), lets leads cross without mismatch, and keeps neighbours out. Never route digital lines across, shield or not.

> [!tip] Remark
> Why edges differ (microloading, iso-dense bias, STI stress, well proximity) is owned by [[Device Matching#Level 3 The Device's Neighbours]]; Razavi's capacitor example (an 8:1 ratio with the single unit in the centre of a dummy-ringed $3\times3$) is drawn in [[Capacitor#Layout]].

## Level 3: Active Arrays: MOS Transistors

### Orientation-Aware Interdigitation

```tikz title="Orientation-aware interdigitation of a common-source pair (top view, NMOS). Subscripts mark the source/drain finger on each side of a gate; arrows show drain-to-source current. Good: Hastings Table 13.3 pattern 1, both devices have zero net orientation and one centroid; dummy gates D at both ends. Bad: plain ABAB with separate drains, every A flows left and every B right. After Hastings Fig. 13.57, Eq. 13.61 and Table 13.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  dpoly/.style={fill=red!25,draw=black!50},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70,fill opacity=0.85},
  mtwo/.style={fill=violet!55,draw=black!70,fill opacity=0.85},]
\node[font=\scriptsize\bfseries,anchor=west] at (-0.6,4.1) {Good: $(_D A\,_S B\,_D B\,_S A)\,_D$ with dummies, common source};
\draw[ndiff] (-0.6,0) rectangle (10.6,2);
\draw[dpoly] (-0.15,-0.35) rectangle (0.15,2.35);
\node[font=\scriptsize] at (0.00,-0.6) {D};
\draw[dpoly] (9.85,-0.35) rectangle (10.15,2.35);
\node[font=\scriptsize] at (10.00,-0.6) {D};
\draw[poly] (1.85,-0.35) rectangle (2.15,2.35);
\node[font=\scriptsize\bfseries] at (2.00,-0.6) {A};
\draw[poly] (3.85,-0.35) rectangle (4.15,2.35);
\node[font=\scriptsize\bfseries] at (4.00,-0.6) {B};
\draw[poly] (5.85,-0.35) rectangle (6.15,2.35);
\node[font=\scriptsize\bfseries] at (6.00,-0.6) {B};
\draw[poly] (7.85,-0.35) rectangle (8.15,2.35);
\node[font=\scriptsize\bfseries] at (8.00,-0.6) {A};
\fill (0.90,0.35) rectangle (1.10,0.55);
\fill (0.90,0.85) rectangle (1.10,1.05);
\fill (0.90,1.35) rectangle (1.10,1.55);
\fill (2.90,0.35) rectangle (3.10,0.55);
\fill (2.90,0.85) rectangle (3.10,1.05);
\fill (2.90,1.35) rectangle (3.10,1.55);
\fill (4.90,0.35) rectangle (5.10,0.55);
\fill (4.90,0.85) rectangle (5.10,1.05);
\fill (4.90,1.35) rectangle (5.10,1.55);
\fill (6.90,0.35) rectangle (7.10,0.55);
\fill (6.90,0.85) rectangle (7.10,1.05);
\fill (6.90,1.35) rectangle (7.10,1.55);
\fill (8.90,0.35) rectangle (9.10,0.55);
\fill (8.90,0.85) rectangle (9.10,1.05);
\fill (8.90,1.35) rectangle (9.10,1.55);
\draw[mone] (2.8,2.0) rectangle (3.2,2.75); \draw[mone] (6.8,2.0) rectangle (7.2,2.75); \draw[mone] (2.8,2.55) rectangle (7.2,2.95);
\node[font=\scriptsize,anchor=west] at (7.3,2.75) {S};
\draw[mone] (0.8,2.0) rectangle (1.2,3.35); \draw[mone] (8.8,2.0) rectangle (9.2,3.35); \draw[mone] (0.8,3.15) rectangle (9.2,3.55);
\node[font=\scriptsize,anchor=west] at (9.3,3.35) {$D_A$};
\draw[mone] (4.8,0) rectangle (5.2,-0.95); \draw[mone] (4.2,-0.95) rectangle (5.8,-1.3); \node[font=\scriptsize,anchor=west] at (5.9,-1.12) {$D_B$};
\node[font=\tiny,fill=white,inner sep=1pt] at (1.00,1.75) {$D_A$};
\node[font=\tiny,fill=white,inner sep=1pt] at (3.00,1.75) {S};
\node[font=\tiny,fill=white,inner sep=1pt] at (5.00,1.75) {$D_B$};
\node[font=\tiny,fill=white,inner sep=1pt] at (7.00,1.75) {S};
\node[font=\tiny,fill=white,inner sep=1pt] at (9.00,1.75) {$D_A$};
\draw[->,very thick,blue!70!black] (1.30,0.15) -- (2.70,0.15);
\draw[->,very thick,blue!70!black] (4.70,0.15) -- (3.30,0.15);
\draw[->,very thick,blue!70!black] (5.30,0.15) -- (6.70,0.15);
\draw[->,very thick,blue!70!black] (8.70,0.15) -- (7.30,0.15);
\node[font=\scriptsize,anchor=west,align=left] at (11.0,1.0) {current $D\to S$:\\ A: $+1,-1\Rightarrow\Phi_A=0$\\ B: $-1,+1\Rightarrow\Phi_B=0$};
\begin{scope}[yshift=-3.3cm]
\node[font=\scriptsize\bfseries,anchor=west,red!70!black] at (-0.6,1.35) {Bad: $_S A\,_D B\,_S A\,_D B\,_S$ (ABAB, separate drains)};
\node[font=\scriptsize] at (0.00,0.2) {S};
\draw[poly] (0.88,-0.2) rectangle (1.12,0.6); \node[font=\scriptsize\bfseries] at (1.00,-0.45) {A};
\node[font=\scriptsize] at (2.00,0.2) {D};
\draw[poly] (2.88,-0.2) rectangle (3.12,0.6); \node[font=\scriptsize\bfseries] at (3.00,-0.45) {B};
\node[font=\scriptsize] at (4.00,0.2) {S};
\draw[poly] (4.88,-0.2) rectangle (5.12,0.6); \node[font=\scriptsize\bfseries] at (5.00,-0.45) {A};
\node[font=\scriptsize] at (6.00,0.2) {D};
\draw[poly] (6.88,-0.2) rectangle (7.12,0.6); \node[font=\scriptsize\bfseries] at (7.00,-0.45) {B};
\node[font=\scriptsize] at (8.00,0.2) {S};
\draw[->,very thick,red!70!black] (1.35,0.75) -- (0.65,0.75);
\draw[->,very thick,red!70!black] (2.65,0.75) -- (3.35,0.75);
\draw[->,very thick,red!70!black] (5.35,0.75) -- (4.65,0.75);
\draw[->,very thick,red!70!black] (6.65,0.75) -- (7.35,0.75);
\node[font=\scriptsize,anchor=west,align=left,red!70!black] at (8.6,0.25) {$\Phi_A=-1$, $\Phi_B=+1$: orientation mismatch (tilted implant)\\ and centroids one pitch apart (not common-centroid)};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Phi = \frac{1}{N}\sum_{i=1}^{N}\Phi_i,\quad \Phi_i=\pm1\ (\text{current right/left}),\qquad \Phi_A = \Phi_B}
$$

- A MOS unit has a direction: the tilted source/drain implant (about 7°) shadows one side of every gate, and drain-extended devices define their two ends with different masks. A section with its drain on the left is not the same device as one with its drain on the right. Hastings adds **orientation** as the fifth rule of common-centroid layout for MOS (Table 13.2); the physics is in [[Device Matching#Orientation and Implant Shadowing]].
- Equal orientation, not zero, is the requirement: 3 right + 1 left ($\Phi=\tfrac12$) matches 9 right + 3 left ($\Phi=\tfrac12$). Most designers use $\Phi=0$. 2-D arrays need $\Phi_H$ and $\Phi_V$ equal separately.
- Notation: subscripts mark the S/D fingers, e.g. $_DA_SB_DB_SA_D$, and a superscript repeats a group. Hastings' Table 13.3 lists common-source patterns that obey coincidence, symmetry and orientation:
  1. $(_DA_SB_DB_SA)^i{}_D$
  2. $(_SA_DA)^i(_SB_DB)^j(_SA_DA)^i{}_S$
  3. $(_SA_DA_SB_DB_SA_DA)^i{}_S$
  4. $(_SA_DA_SB_D\!-_S\!A_DA_S\!-_D\!B_SA_DA)^i{}_S$ (dashes: S/D fingers that cannot merge)
  5. $(_SA_DA_SB_DB_SC_DC)^i{}_S(C_DC_SB_DB_SA_DA_S)^i$
- **Devices without a common source** need a gap wherever units of different devices abut, or interdigitation along the **width** instead, which frees all S/D connections. Current mirrors (long, narrow, shared gate) usually interdigitate along the width under one poly plate.

### The Cross-Coupled MOS Pair

```tikz title="Cross-coupled MOS pair: the simplest 2-D common-centroid MOS array, with orientation balanced and half dummies. Gate and drain cross-connections (A to A, B to B diagonally) run in metal 2, not shown. After Hastings Fig. 13.59."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  dpoly/.style={fill=red!25,draw=black!50},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70,fill opacity=0.85},
  mtwo/.style={fill=violet!55,draw=black!70,fill opacity=0.85},]
\draw[ndiff] (0.4,2.00) rectangle (5.6,3.30);
\draw[dpoly] (0.05,1.85) rectangle (0.45,3.45);
\draw[dpoly] (5.55,1.85) rectangle (5.95,3.45);
\draw[poly] (1.80,1.85) rectangle (2.20,3.45); \node[font=\scriptsize\bfseries,fill=white,inner sep=1pt] at (2.00,2.65) {A};
\draw[poly] (3.80,1.85) rectangle (4.20,3.45); \node[font=\scriptsize\bfseries,fill=white,inner sep=1pt] at (4.00,2.65) {B};
\fill (0.90,2.25) rectangle (1.10,2.45);
\fill (0.90,2.75) rectangle (1.10,2.95);
\fill (2.90,2.25) rectangle (3.10,2.45);
\fill (2.90,2.75) rectangle (3.10,2.95);
\fill (4.90,2.25) rectangle (5.10,2.45);
\fill (4.90,2.75) rectangle (5.10,2.95);
\node[font=\tiny] at (1,3.15) {$D_A$}; \node[font=\tiny] at (3,3.15) {S}; \node[font=\tiny] at (5,3.15) {$D_B$};
\draw[->,very thick,blue!70!black] (1.3,2.10) -- (2.7,2.10);
\draw[->,very thick,blue!70!black] (4.7,2.10) -- (3.3,2.10);
\draw[ndiff] (0.4,0.00) rectangle (5.6,1.30);
\draw[dpoly] (0.05,-0.15) rectangle (0.45,1.45);
\draw[dpoly] (5.55,-0.15) rectangle (5.95,1.45);
\draw[poly] (1.80,-0.15) rectangle (2.20,1.45); \node[font=\scriptsize\bfseries,fill=white,inner sep=1pt] at (2.00,0.65) {B};
\draw[poly] (3.80,-0.15) rectangle (4.20,1.45); \node[font=\scriptsize\bfseries,fill=white,inner sep=1pt] at (4.00,0.65) {A};
\fill (0.90,0.25) rectangle (1.10,0.45);
\fill (0.90,0.75) rectangle (1.10,0.95);
\fill (2.90,0.25) rectangle (3.10,0.45);
\fill (2.90,0.75) rectangle (3.10,0.95);
\fill (4.90,0.25) rectangle (5.10,0.45);
\fill (4.90,0.75) rectangle (5.10,0.95);
\node[font=\tiny] at (1,1.15) {$D_B$}; \node[font=\tiny] at (3,1.15) {S}; \node[font=\tiny] at (5,1.15) {$D_A$};
\draw[->,very thick,blue!70!black] (1.3,0.10) -- (2.7,0.10);
\draw[->,very thick,blue!70!black] (4.7,0.10) -- (3.3,0.10);
\draw[very thick,orange!80!black] (2.900,1.550) -- (3.100,1.750) (2.900,1.750) -- (3.100,1.550);
\node[font=\scriptsize,anchor=west,align=left] at (6.3,1.65) {$_D A\,_S B\,_D\ /\ _D B\,_S A\,_D$\\ A: one segment $\to$, one $\leftarrow$ ($\Phi_A=0$)\\ B: one $\leftarrow$, one $\to$ ($\Phi_B=0$)\\ A on one diagonal, B on the other:\\ linear gradient in any direction cancels\\ half dummies (pale) at both ends of each row};
\end{circuitikz}
\end{document}
```

- The simplest 2-D MOS array, $_DA_SB_D/_DB_SA_D$: compact, both devices orientation-balanced, half dummies at the row ends. Best for small, roughly square devices.
- Larger devices: split each device's units into two groups and cross-couple the groups ($_SA_DA_SB_DB_S/_SB_DB_SA_DA_S$ for four units each). If that becomes elongated, tile several smaller cross-coupled sub-arrays (Hastings shows two-, three- and six-row elaborations). The more elaborate ones are hard to wire, especially when the gates are separate; "the simpler patterns generally serve for all but the largest devices" (Hastings §13.2.6).
- Hastings (via Lan, Tammineedi & Geiger) puts AB/BA at about 60% of the residual gradient mismatch of ABBA built from the same square units. Test chips often show no difference between cross-coupled and interdigitated layouts, because they have no heat source and gentle packaging.

### When Common Centroid Costs More Than It Saves

```tikz title="Why common centroid is not automatically best for small devices. A differential pair, 4 units each, sharing one source bus. Karmokar et al. rank effective G_m: interdigitated > common centroid > clustered; CC also carries inherent LOD and wiring-resistance mismatch. After Karmokar et al. (review) Fig. 9 and Eq. 25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  dpoly/.style={fill=red!25,draw=black!50},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70,fill opacity=0.85},
  mtwo/.style={fill=violet!55,draw=black!70,fill opacity=0.85},]
\draw[fill=white] (0.030,0.030) rectangle (0.520,0.520);
\node[font=\scriptsize] at (0.275,0.275) {A};
\draw[fill=white] (0.580,0.030) rectangle (1.070,0.520);
\node[font=\scriptsize] at (0.825,0.275) {A};
\draw[fill=white] (1.130,0.030) rectangle (1.620,0.520);
\node[font=\scriptsize] at (1.375,0.275) {A};
\draw[fill=white] (1.680,0.030) rectangle (2.170,0.520);
\node[font=\scriptsize] at (1.925,0.275) {A};
\draw[fill=gray!35] (2.230,0.030) rectangle (2.720,0.520);
\node[font=\scriptsize] at (2.475,0.275) {B};
\draw[fill=gray!35] (2.780,0.030) rectangle (3.270,0.520);
\node[font=\scriptsize] at (3.025,0.275) {B};
\draw[fill=gray!35] (3.330,0.030) rectangle (3.820,0.520);
\node[font=\scriptsize] at (3.575,0.275) {B};
\draw[fill=gray!35] (3.880,0.030) rectangle (4.370,0.520);
\node[font=\scriptsize] at (4.125,0.275) {B};
\draw[mone] (0.1,-0.35) rectangle (4.3,-0.20);
\draw[blue!60!black,thick] (0.28,-0.00) -- (0.28,-0.20);
\draw[blue!60!black,thick] (0.83,-0.00) -- (0.83,-0.20);
\draw[blue!60!black,thick] (1.38,-0.00) -- (1.38,-0.20);
\draw[blue!60!black,thick] (1.93,-0.00) -- (1.93,-0.20);
\draw[blue!60!black,thick] (2.48,-0.00) -- (2.48,-0.20);
\draw[blue!60!black,thick] (3.02,-0.00) -- (3.02,-0.20);
\draw[blue!60!black,thick] (3.58,-0.00) -- (3.58,-0.20);
\draw[blue!60!black,thick] (4.13,-0.00) -- (4.13,-0.20);
\draw (2.20,-0.35) -- (2.20,-0.55) node[ground,scale=0.6]{};
\node[font=\scriptsize\bfseries,anchor=west,red!70!black] at (4.6,0.45) {clustered};
\node[font=\scriptsize,anchor=west] at (4.6,0.00) {A and B each far from AC ground: largest $i_{ac}R_s$, lowest $G_m$; centroids apart};
\draw[fill=white] (0.030,-1.470) rectangle (0.520,-0.980);
\node[font=\scriptsize] at (0.275,-1.225) {A};
\draw[fill=white] (0.580,-1.470) rectangle (1.070,-0.980);
\node[font=\scriptsize] at (0.825,-1.225) {A};
\draw[fill=gray!35] (1.130,-1.470) rectangle (1.620,-0.980);
\node[font=\scriptsize] at (1.375,-1.225) {B};
\draw[fill=gray!35] (1.680,-1.470) rectangle (2.170,-0.980);
\node[font=\scriptsize] at (1.925,-1.225) {B};
\draw[fill=gray!35] (2.230,-1.470) rectangle (2.720,-0.980);
\node[font=\scriptsize] at (2.475,-1.225) {B};
\draw[fill=gray!35] (2.780,-1.470) rectangle (3.270,-0.980);
\node[font=\scriptsize] at (3.025,-1.225) {B};
\draw[fill=white] (3.330,-1.470) rectangle (3.820,-0.980);
\node[font=\scriptsize] at (3.575,-1.225) {A};
\draw[fill=white] (3.880,-1.470) rectangle (4.370,-0.980);
\node[font=\scriptsize] at (4.125,-1.225) {A};
\draw[mone] (0.1,-1.85) rectangle (4.3,-1.70);
\draw[blue!60!black,thick] (0.28,-1.50) -- (0.28,-1.70);
\draw[blue!60!black,thick] (0.83,-1.50) -- (0.83,-1.70);
\draw[blue!60!black,thick] (1.38,-1.50) -- (1.38,-1.70);
\draw[blue!60!black,thick] (1.93,-1.50) -- (1.93,-1.70);
\draw[blue!60!black,thick] (2.48,-1.50) -- (2.48,-1.70);
\draw[blue!60!black,thick] (3.02,-1.50) -- (3.02,-1.70);
\draw[blue!60!black,thick] (3.58,-1.50) -- (3.58,-1.70);
\draw[blue!60!black,thick] (4.13,-1.50) -- (4.13,-1.70);
\draw (2.20,-1.85) -- (2.20,-2.05) node[ground,scale=0.6]{};
\node[font=\scriptsize\bfseries,anchor=west,orange!80!black] at (4.6,-1.05) {common centroid};
\node[font=\scriptsize,anchor=west] at (4.6,-1.50) {$R_{s}$ to A (ends) $\ne$ $R_s$ to B (middle): wiring mismatch; LOD differs (A outside, B inside)};
\draw[fill=white] (0.030,-2.970) rectangle (0.520,-2.480);
\node[font=\scriptsize] at (0.275,-2.725) {A};
\draw[fill=gray!35] (0.580,-2.970) rectangle (1.070,-2.480);
\node[font=\scriptsize] at (0.825,-2.725) {B};
\draw[fill=white] (1.130,-2.970) rectangle (1.620,-2.480);
\node[font=\scriptsize] at (1.375,-2.725) {A};
\draw[fill=gray!35] (1.680,-2.970) rectangle (2.170,-2.480);
\node[font=\scriptsize] at (1.925,-2.725) {B};
\draw[fill=white] (2.230,-2.970) rectangle (2.720,-2.480);
\node[font=\scriptsize] at (2.475,-2.725) {A};
\draw[fill=gray!35] (2.780,-2.970) rectangle (3.270,-2.480);
\node[font=\scriptsize] at (3.025,-2.725) {B};
\draw[fill=white] (3.330,-2.970) rectangle (3.820,-2.480);
\node[font=\scriptsize] at (3.575,-2.725) {A};
\draw[fill=gray!35] (3.880,-2.970) rectangle (4.370,-2.480);
\node[font=\scriptsize] at (4.125,-2.725) {B};
\draw[mone] (0.1,-3.35) rectangle (4.3,-3.20);
\draw[blue!60!black,thick] (0.28,-3.00) -- (0.28,-3.20);
\draw[blue!60!black,thick] (0.83,-3.00) -- (0.83,-3.20);
\draw[blue!60!black,thick] (1.38,-3.00) -- (1.38,-3.20);
\draw[blue!60!black,thick] (1.93,-3.00) -- (1.93,-3.20);
\draw[blue!60!black,thick] (2.48,-3.00) -- (2.48,-3.20);
\draw[blue!60!black,thick] (3.02,-3.00) -- (3.02,-3.20);
\draw[blue!60!black,thick] (3.58,-3.00) -- (3.58,-3.20);
\draw[blue!60!black,thick] (4.13,-3.00) -- (4.13,-3.20);
\draw (2.20,-3.35) -- (2.20,-3.55) node[ground,scale=0.6]{};
\node[font=\scriptsize\bfseries,anchor=west,green!40!black] at (4.6,-2.55) {interdigitated};
\node[font=\scriptsize,anchor=west] at (4.6,-3.00) {$R_s$ matched, best $G_m$; centroids one pitch apart};
\node[font=\scriptsize,anchor=west,align=left] at (0,-4.6) {M1 source bus with AC ground at the middle (where the A and B small-signal currents cancel): $G_m = g_m(v_{in}-i_{ac}R_s)/v_{in}$.\\ Fix for CC in one row: use two rows with A and B swapped in the second, which matches both LOD and $R_s$.};
\end{circuitikz}
\end{document}
```

- **Layout-dependent effects.** Identical unit cells cancel gate-pitch, OD-width and OD-spacing effects by construction; what remains is **length of diffusion (LOD)** and **well proximity (WPE)** (Karmokar review §II-A). A 1-D CC row puts A at the ends and B inside, so their $SA/SB$ distances differ and so do their $V_{TH}$ shifts: $\Delta V_{TH}\propto\sum_i\left[\frac{1}{SA_i+0.5L}+\frac{1}{SB_i+0.5L}\right]$. Clustered and interdigitated rows do not have this asymmetry.
- **Wiring.** In CC the A units sit farther from the source tap than the B units, so their source resistances differ; FinFET rules (unidirectional, on-grid wires, resistive vias) forbid the detours that would equalise them. Effective transconductance ranks interdigitated > CC > clustered:

$$
\boxed{G_m=\frac{g_m(v_{in}-i_{ac}R_s)}{v_{in}}}
$$

- **Fix for big devices:** two (or four) rows with A and B swapped between rows match both LOD and $R_s$ while staying common-centroid.
- **Measured trade** (Karmokar review §V, 14 nm-class FinFET simulation): in a 5T OTA the best layout used CC (four rows) for the input pair (80 units per device) and the NMOS mirror (40), but **clustered** for the tiny PMOS mirror, whose single-row CC version created parasitic and LOD mismatch. In a StrongARM comparator, where every device is small, the **clustered** layout was best; CC created capacitance mismatch between the regenerative nodes.

> [!tip] Remark
> LOD, WPE and their layout cures are owned by [[Device Matching#STI Stress and the Length-of-Diffusion Effect]] and [[Device Matching#Well Proximity Effect]]; source-line IR drop referred through $g_m/I_D$ is [[Device Matching#Wiring Resistance and Reference Distribution]].

## Level 4: Passive Arrays: Capacitor DACs

### Three Placements of One Binary Array

```tikz title="Three placements of a 6-bit binary CDAC (C0..C6 = 1,1,2,4,8,16,32 units) on an 8x8 grid, generated by the rules of Karmokar et al. Sec. IV-A (pair every unit with its point reflection). All are common-centroid for C2..C6. Spiral keeps each capacitor in few connected groups (few wires and vias) but leaves the MSB a quadratic error; the chessboard scatters every unit (zero MSB bowl error, 64 separate groups to wire)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=white] (0.00,2.94) rectangle (0.42,3.36); \node[font=\tiny] at (0.21,3.15) {6};
\draw[fill=white] (0.42,2.94) rectangle (0.84,3.36); \node[font=\tiny] at (0.63,3.15) {6};
\draw[fill=white] (0.84,2.94) rectangle (1.26,3.36); \node[font=\tiny] at (1.05,3.15) {6};
\draw[fill=white] (1.26,2.94) rectangle (1.68,3.36); \node[font=\tiny] at (1.47,3.15) {6};
\draw[fill=white] (1.68,2.94) rectangle (2.10,3.36); \node[font=\tiny] at (1.89,3.15) {6};
\draw[fill=white] (2.10,2.94) rectangle (2.52,3.36); \node[font=\tiny] at (2.31,3.15) {6};
\draw[fill=white] (2.52,2.94) rectangle (2.94,3.36); \node[font=\tiny] at (2.73,3.15) {6};
\draw[fill=white] (2.94,2.94) rectangle (3.36,3.36); \node[font=\tiny] at (3.15,3.15) {6};
\draw[fill=white] (0.00,2.52) rectangle (0.42,2.94); \node[font=\tiny] at (0.21,2.73) {6};
\draw[fill=cyan!35] (0.42,2.52) rectangle (0.84,2.94); \node[font=\tiny] at (0.63,2.73) {5};
\draw[fill=cyan!35] (0.84,2.52) rectangle (1.26,2.94); \node[font=\tiny] at (1.05,2.73) {5};
\draw[fill=cyan!35] (1.26,2.52) rectangle (1.68,2.94); \node[font=\tiny] at (1.47,2.73) {5};
\draw[fill=white] (1.68,2.52) rectangle (2.10,2.94); \node[font=\tiny] at (1.89,2.73) {6};
\draw[fill=white] (2.10,2.52) rectangle (2.52,2.94); \node[font=\tiny] at (2.31,2.73) {6};
\draw[fill=cyan!35] (2.52,2.52) rectangle (2.94,2.94); \node[font=\tiny] at (2.73,2.73) {5};
\draw[fill=white] (2.94,2.52) rectangle (3.36,2.94); \node[font=\tiny] at (3.15,2.73) {6};
\draw[fill=white] (0.00,2.10) rectangle (0.42,2.52); \node[font=\tiny] at (0.21,2.31) {6};
\draw[fill=cyan!35] (0.42,2.10) rectangle (0.84,2.52); \node[font=\tiny] at (0.63,2.31) {5};
\draw[fill=magenta!35] (0.84,2.10) rectangle (1.26,2.52); \node[font=\tiny] at (1.05,2.31) {3};
\draw[fill=magenta!35] (1.26,2.10) rectangle (1.68,2.52); \node[font=\tiny] at (1.47,2.31) {3};
\draw[fill=red!50] (1.68,2.10) rectangle (2.10,2.52); \node[font=\tiny] at (1.89,2.31) {4};
\draw[fill=red!50] (2.10,2.10) rectangle (2.52,2.52); \node[font=\tiny] at (2.31,2.31) {4};
\draw[fill=cyan!35] (2.52,2.10) rectangle (2.94,2.52); \node[font=\tiny] at (2.73,2.31) {5};
\draw[fill=white] (2.94,2.10) rectangle (3.36,2.52); \node[font=\tiny] at (3.15,2.31) {6};
\draw[fill=white] (0.00,1.68) rectangle (0.42,2.10); \node[font=\tiny] at (0.21,1.89) {6};
\draw[fill=cyan!35] (0.42,1.68) rectangle (0.84,2.10); \node[font=\tiny] at (0.63,1.89) {5};
\draw[fill=red!50] (0.84,1.68) rectangle (1.26,2.10); \node[font=\tiny] at (1.05,1.89) {4};
\draw[fill=gray!60] (1.26,1.68) rectangle (1.68,2.10); \node[font=\tiny] at (1.47,1.89) {0};
\draw[fill=green!55] (1.68,1.68) rectangle (2.10,2.10); \node[font=\tiny] at (1.89,1.89) {2};
\draw[fill=red!50] (2.10,1.68) rectangle (2.52,2.10); \node[font=\tiny] at (2.31,1.89) {4};
\draw[fill=cyan!35] (2.52,1.68) rectangle (2.94,2.10); \node[font=\tiny] at (2.73,1.89) {5};
\draw[fill=white] (2.94,1.68) rectangle (3.36,2.10); \node[font=\tiny] at (3.15,1.89) {6};
\draw[fill=white] (0.00,1.26) rectangle (0.42,1.68); \node[font=\tiny] at (0.21,1.47) {6};
\draw[fill=cyan!35] (0.42,1.26) rectangle (0.84,1.68); \node[font=\tiny] at (0.63,1.47) {5};
\draw[fill=red!50] (0.84,1.26) rectangle (1.26,1.68); \node[font=\tiny] at (1.05,1.47) {4};
\draw[fill=green!55] (1.26,1.26) rectangle (1.68,1.68); \node[font=\tiny] at (1.47,1.47) {2};
\draw[fill=yellow!60] (1.68,1.26) rectangle (2.10,1.68); \node[font=\tiny] at (1.89,1.47) {1};
\draw[fill=red!50] (2.10,1.26) rectangle (2.52,1.68); \node[font=\tiny] at (2.31,1.47) {4};
\draw[fill=cyan!35] (2.52,1.26) rectangle (2.94,1.68); \node[font=\tiny] at (2.73,1.47) {5};
\draw[fill=white] (2.94,1.26) rectangle (3.36,1.68); \node[font=\tiny] at (3.15,1.47) {6};
\draw[fill=white] (0.00,0.84) rectangle (0.42,1.26); \node[font=\tiny] at (0.21,1.05) {6};
\draw[fill=cyan!35] (0.42,0.84) rectangle (0.84,1.26); \node[font=\tiny] at (0.63,1.05) {5};
\draw[fill=red!50] (0.84,0.84) rectangle (1.26,1.26); \node[font=\tiny] at (1.05,1.05) {4};
\draw[fill=red!50] (1.26,0.84) rectangle (1.68,1.26); \node[font=\tiny] at (1.47,1.05) {4};
\draw[fill=magenta!35] (1.68,0.84) rectangle (2.10,1.26); \node[font=\tiny] at (1.89,1.05) {3};
\draw[fill=magenta!35] (2.10,0.84) rectangle (2.52,1.26); \node[font=\tiny] at (2.31,1.05) {3};
\draw[fill=cyan!35] (2.52,0.84) rectangle (2.94,1.26); \node[font=\tiny] at (2.73,1.05) {5};
\draw[fill=white] (2.94,0.84) rectangle (3.36,1.26); \node[font=\tiny] at (3.15,1.05) {6};
\draw[fill=white] (0.00,0.42) rectangle (0.42,0.84); \node[font=\tiny] at (0.21,0.63) {6};
\draw[fill=cyan!35] (0.42,0.42) rectangle (0.84,0.84); \node[font=\tiny] at (0.63,0.63) {5};
\draw[fill=white] (0.84,0.42) rectangle (1.26,0.84); \node[font=\tiny] at (1.05,0.63) {6};
\draw[fill=white] (1.26,0.42) rectangle (1.68,0.84); \node[font=\tiny] at (1.47,0.63) {6};
\draw[fill=cyan!35] (1.68,0.42) rectangle (2.10,0.84); \node[font=\tiny] at (1.89,0.63) {5};
\draw[fill=cyan!35] (2.10,0.42) rectangle (2.52,0.84); \node[font=\tiny] at (2.31,0.63) {5};
\draw[fill=cyan!35] (2.52,0.42) rectangle (2.94,0.84); \node[font=\tiny] at (2.73,0.63) {5};
\draw[fill=white] (2.94,0.42) rectangle (3.36,0.84); \node[font=\tiny] at (3.15,0.63) {6};
\draw[fill=white] (0.00,0.00) rectangle (0.42,0.42); \node[font=\tiny] at (0.21,0.21) {6};
\draw[fill=white] (0.42,0.00) rectangle (0.84,0.42); \node[font=\tiny] at (0.63,0.21) {6};
\draw[fill=white] (0.84,0.00) rectangle (1.26,0.42); \node[font=\tiny] at (1.05,0.21) {6};
\draw[fill=white] (1.26,0.00) rectangle (1.68,0.42); \node[font=\tiny] at (1.47,0.21) {6};
\draw[fill=white] (1.68,0.00) rectangle (2.10,0.42); \node[font=\tiny] at (1.89,0.21) {6};
\draw[fill=white] (2.10,0.00) rectangle (2.52,0.42); \node[font=\tiny] at (2.31,0.21) {6};
\draw[fill=white] (2.52,0.00) rectangle (2.94,0.42); \node[font=\tiny] at (2.73,0.21) {6};
\draw[fill=white] (2.94,0.00) rectangle (3.36,0.42); \node[font=\tiny] at (3.15,0.21) {6};
\node[font=\scriptsize\bfseries] at (1.68,3.61) {spiral (Karmokar)};
\node[font=\scriptsize,align=center,anchor=north] at (1.68,-0.08) {11 groups, few bends\\ MSB: $\Delta\overline{r^2}=+4.9$};
\draw[very thick,orange!80!black] (1.600,1.600) -- (1.760,1.760) (1.600,1.760) -- (1.760,1.600);
\draw[fill=white] (4.36,2.94) rectangle (4.78,3.36); \node[font=\tiny] at (4.57,3.15) {6};
\draw[fill=white] (4.78,2.94) rectangle (5.20,3.36); \node[font=\tiny] at (4.99,3.15) {6};
\draw[fill=cyan!35] (5.20,2.94) rectangle (5.62,3.36); \node[font=\tiny] at (5.41,3.15) {5};
\draw[fill=cyan!35] (5.62,2.94) rectangle (6.04,3.36); \node[font=\tiny] at (5.83,3.15) {5};
\draw[fill=white] (6.04,2.94) rectangle (6.46,3.36); \node[font=\tiny] at (6.25,3.15) {6};
\draw[fill=white] (6.46,2.94) rectangle (6.88,3.36); \node[font=\tiny] at (6.67,3.15) {6};
\draw[fill=white] (6.88,2.94) rectangle (7.30,3.36); \node[font=\tiny] at (7.09,3.15) {6};
\draw[fill=white] (7.30,2.94) rectangle (7.72,3.36); \node[font=\tiny] at (7.51,3.15) {6};
\draw[fill=white] (4.36,2.52) rectangle (4.78,2.94); \node[font=\tiny] at (4.57,2.73) {6};
\draw[fill=white] (4.78,2.52) rectangle (5.20,2.94); \node[font=\tiny] at (4.99,2.73) {6};
\draw[fill=cyan!35] (5.20,2.52) rectangle (5.62,2.94); \node[font=\tiny] at (5.41,2.73) {5};
\draw[fill=cyan!35] (5.62,2.52) rectangle (6.04,2.94); \node[font=\tiny] at (5.83,2.73) {5};
\draw[fill=white] (6.04,2.52) rectangle (6.46,2.94); \node[font=\tiny] at (6.25,2.73) {6};
\draw[fill=white] (6.46,2.52) rectangle (6.88,2.94); \node[font=\tiny] at (6.67,2.73) {6};
\draw[fill=white] (6.88,2.52) rectangle (7.30,2.94); \node[font=\tiny] at (7.09,2.73) {6};
\draw[fill=white] (7.30,2.52) rectangle (7.72,2.94); \node[font=\tiny] at (7.51,2.73) {6};
\draw[fill=cyan!35] (4.36,2.10) rectangle (4.78,2.52); \node[font=\tiny] at (4.57,2.31) {5};
\draw[fill=cyan!35] (4.78,2.10) rectangle (5.20,2.52); \node[font=\tiny] at (4.99,2.31) {5};
\draw[fill=red!50] (5.20,2.10) rectangle (5.62,2.52); \node[font=\tiny] at (5.41,2.31) {4};
\draw[fill=magenta!35] (5.62,2.10) rectangle (6.04,2.52); \node[font=\tiny] at (5.83,2.31) {3};
\draw[fill=red!50] (6.04,2.10) rectangle (6.46,2.52); \node[font=\tiny] at (6.25,2.31) {4};
\draw[fill=magenta!35] (6.46,2.10) rectangle (6.88,2.52); \node[font=\tiny] at (6.67,2.31) {3};
\draw[fill=white] (6.88,2.10) rectangle (7.30,2.52); \node[font=\tiny] at (7.09,2.31) {6};
\draw[fill=white] (7.30,2.10) rectangle (7.72,2.52); \node[font=\tiny] at (7.51,2.31) {6};
\draw[fill=cyan!35] (4.36,1.68) rectangle (4.78,2.10); \node[font=\tiny] at (4.57,1.89) {5};
\draw[fill=cyan!35] (4.78,1.68) rectangle (5.20,2.10); \node[font=\tiny] at (4.99,1.89) {5};
\draw[fill=green!55] (5.20,1.68) rectangle (5.62,2.10); \node[font=\tiny] at (5.41,1.89) {2};
\draw[fill=red!50] (5.62,1.68) rectangle (6.04,2.10); \node[font=\tiny] at (5.83,1.89) {4};
\draw[fill=yellow!60] (6.04,1.68) rectangle (6.46,2.10); \node[font=\tiny] at (6.25,1.89) {1};
\draw[fill=red!50] (6.46,1.68) rectangle (6.88,2.10); \node[font=\tiny] at (6.67,1.89) {4};
\draw[fill=white] (6.88,1.68) rectangle (7.30,2.10); \node[font=\tiny] at (7.09,1.89) {6};
\draw[fill=white] (7.30,1.68) rectangle (7.72,2.10); \node[font=\tiny] at (7.51,1.89) {6};
\draw[fill=white] (4.36,1.26) rectangle (4.78,1.68); \node[font=\tiny] at (4.57,1.47) {6};
\draw[fill=white] (4.78,1.26) rectangle (5.20,1.68); \node[font=\tiny] at (4.99,1.47) {6};
\draw[fill=red!50] (5.20,1.26) rectangle (5.62,1.68); \node[font=\tiny] at (5.41,1.47) {4};
\draw[fill=magenta!35] (5.62,1.26) rectangle (6.04,1.68); \node[font=\tiny] at (5.83,1.47) {3};
\draw[fill=red!50] (6.04,1.26) rectangle (6.46,1.68); \node[font=\tiny] at (6.25,1.47) {4};
\draw[fill=magenta!35] (6.46,1.26) rectangle (6.88,1.68); \node[font=\tiny] at (6.67,1.47) {3};
\draw[fill=cyan!35] (6.88,1.26) rectangle (7.30,1.68); \node[font=\tiny] at (7.09,1.47) {5};
\draw[fill=cyan!35] (7.30,1.26) rectangle (7.72,1.68); \node[font=\tiny] at (7.51,1.47) {5};
\draw[fill=white] (4.36,0.84) rectangle (4.78,1.26); \node[font=\tiny] at (4.57,1.05) {6};
\draw[fill=white] (4.78,0.84) rectangle (5.20,1.26); \node[font=\tiny] at (4.99,1.05) {6};
\draw[fill=gray!60] (5.20,0.84) rectangle (5.62,1.26); \node[font=\tiny] at (5.41,1.05) {0};
\draw[fill=red!50] (5.62,0.84) rectangle (6.04,1.26); \node[font=\tiny] at (5.83,1.05) {4};
\draw[fill=green!55] (6.04,0.84) rectangle (6.46,1.26); \node[font=\tiny] at (6.25,1.05) {2};
\draw[fill=red!50] (6.46,0.84) rectangle (6.88,1.26); \node[font=\tiny] at (6.67,1.05) {4};
\draw[fill=cyan!35] (6.88,0.84) rectangle (7.30,1.26); \node[font=\tiny] at (7.09,1.05) {5};
\draw[fill=cyan!35] (7.30,0.84) rectangle (7.72,1.26); \node[font=\tiny] at (7.51,1.05) {5};
\draw[fill=white] (4.36,0.42) rectangle (4.78,0.84); \node[font=\tiny] at (4.57,0.63) {6};
\draw[fill=white] (4.78,0.42) rectangle (5.20,0.84); \node[font=\tiny] at (4.99,0.63) {6};
\draw[fill=white] (5.20,0.42) rectangle (5.62,0.84); \node[font=\tiny] at (5.41,0.63) {6};
\draw[fill=white] (5.62,0.42) rectangle (6.04,0.84); \node[font=\tiny] at (5.83,0.63) {6};
\draw[fill=cyan!35] (6.04,0.42) rectangle (6.46,0.84); \node[font=\tiny] at (6.25,0.63) {5};
\draw[fill=cyan!35] (6.46,0.42) rectangle (6.88,0.84); \node[font=\tiny] at (6.67,0.63) {5};
\draw[fill=white] (6.88,0.42) rectangle (7.30,0.84); \node[font=\tiny] at (7.09,0.63) {6};
\draw[fill=white] (7.30,0.42) rectangle (7.72,0.84); \node[font=\tiny] at (7.51,0.63) {6};
\draw[fill=white] (4.36,0.00) rectangle (4.78,0.42); \node[font=\tiny] at (4.57,0.21) {6};
\draw[fill=white] (4.78,0.00) rectangle (5.20,0.42); \node[font=\tiny] at (4.99,0.21) {6};
\draw[fill=white] (5.20,0.00) rectangle (5.62,0.42); \node[font=\tiny] at (5.41,0.21) {6};
\draw[fill=white] (5.62,0.00) rectangle (6.04,0.42); \node[font=\tiny] at (5.83,0.21) {6};
\draw[fill=cyan!35] (6.04,0.00) rectangle (6.46,0.42); \node[font=\tiny] at (6.25,0.21) {5};
\draw[fill=cyan!35] (6.46,0.00) rectangle (6.88,0.42); \node[font=\tiny] at (6.67,0.21) {5};
\draw[fill=white] (6.88,0.00) rectangle (7.30,0.42); \node[font=\tiny] at (7.09,0.21) {6};
\draw[fill=white] (7.30,0.00) rectangle (7.72,0.42); \node[font=\tiny] at (7.51,0.21) {6};
\node[font=\scriptsize\bfseries] at (6.04,3.61) {block chessboard};
\node[font=\scriptsize,align=center,anchor=north] at (6.04,-0.08) {24 groups\\ MSB: $+4.0$};
\draw[very thick,orange!80!black] (5.960,1.600) -- (6.120,1.760) (5.960,1.760) -- (6.120,1.600);
\draw[fill=white] (8.72,2.94) rectangle (9.14,3.36); \node[font=\tiny] at (8.93,3.15) {6};
\draw[fill=cyan!35] (9.14,2.94) rectangle (9.56,3.36); \node[font=\tiny] at (9.35,3.15) {5};
\draw[fill=white] (9.56,2.94) rectangle (9.98,3.36); \node[font=\tiny] at (9.77,3.15) {6};
\draw[fill=cyan!35] (9.98,2.94) rectangle (10.40,3.36); \node[font=\tiny] at (10.19,3.15) {5};
\draw[fill=white] (10.40,2.94) rectangle (10.82,3.36); \node[font=\tiny] at (10.61,3.15) {6};
\draw[fill=cyan!35] (10.82,2.94) rectangle (11.24,3.36); \node[font=\tiny] at (11.03,3.15) {5};
\draw[fill=white] (11.24,2.94) rectangle (11.66,3.36); \node[font=\tiny] at (11.45,3.15) {6};
\draw[fill=cyan!35] (11.66,2.94) rectangle (12.08,3.36); \node[font=\tiny] at (11.87,3.15) {5};
\draw[fill=red!50] (8.72,2.52) rectangle (9.14,2.94); \node[font=\tiny] at (8.93,2.73) {4};
\draw[fill=white] (9.14,2.52) rectangle (9.56,2.94); \node[font=\tiny] at (9.35,2.73) {6};
\draw[fill=red!50] (9.56,2.52) rectangle (9.98,2.94); \node[font=\tiny] at (9.77,2.73) {4};
\draw[fill=white] (9.98,2.52) rectangle (10.40,2.94); \node[font=\tiny] at (10.19,2.73) {6};
\draw[fill=red!50] (10.40,2.52) rectangle (10.82,2.94); \node[font=\tiny] at (10.61,2.73) {4};
\draw[fill=white] (10.82,2.52) rectangle (11.24,2.94); \node[font=\tiny] at (11.03,2.73) {6};
\draw[fill=red!50] (11.24,2.52) rectangle (11.66,2.94); \node[font=\tiny] at (11.45,2.73) {4};
\draw[fill=white] (11.66,2.52) rectangle (12.08,2.94); \node[font=\tiny] at (11.87,2.73) {6};
\draw[fill=white] (8.72,2.10) rectangle (9.14,2.52); \node[font=\tiny] at (8.93,2.31) {6};
\draw[fill=magenta!35] (9.14,2.10) rectangle (9.56,2.52); \node[font=\tiny] at (9.35,2.31) {3};
\draw[fill=white] (9.56,2.10) rectangle (9.98,2.52); \node[font=\tiny] at (9.77,2.31) {6};
\draw[fill=cyan!35] (9.98,2.10) rectangle (10.40,2.52); \node[font=\tiny] at (10.19,2.31) {5};
\draw[fill=white] (10.40,2.10) rectangle (10.82,2.52); \node[font=\tiny] at (10.61,2.31) {6};
\draw[fill=cyan!35] (10.82,2.10) rectangle (11.24,2.52); \node[font=\tiny] at (11.03,2.31) {5};
\draw[fill=white] (11.24,2.10) rectangle (11.66,2.52); \node[font=\tiny] at (11.45,2.31) {6};
\draw[fill=cyan!35] (11.66,2.10) rectangle (12.08,2.52); \node[font=\tiny] at (11.87,2.31) {5};
\draw[fill=cyan!35] (8.72,1.68) rectangle (9.14,2.10); \node[font=\tiny] at (8.93,1.89) {5};
\draw[fill=white] (9.14,1.68) rectangle (9.56,2.10); \node[font=\tiny] at (9.35,1.89) {6};
\draw[fill=green!55] (9.56,1.68) rectangle (9.98,2.10); \node[font=\tiny] at (9.77,1.89) {2};
\draw[fill=white] (9.98,1.68) rectangle (10.40,2.10); \node[font=\tiny] at (10.19,1.89) {6};
\draw[fill=gray!60] (10.40,1.68) rectangle (10.82,2.10); \node[font=\tiny] at (10.61,1.89) {0};
\draw[fill=white] (10.82,1.68) rectangle (11.24,2.10); \node[font=\tiny] at (11.03,1.89) {6};
\draw[fill=magenta!35] (11.24,1.68) rectangle (11.66,2.10); \node[font=\tiny] at (11.45,1.89) {3};
\draw[fill=white] (11.66,1.68) rectangle (12.08,2.10); \node[font=\tiny] at (11.87,1.89) {6};
\draw[fill=white] (8.72,1.26) rectangle (9.14,1.68); \node[font=\tiny] at (8.93,1.47) {6};
\draw[fill=magenta!35] (9.14,1.26) rectangle (9.56,1.68); \node[font=\tiny] at (9.35,1.47) {3};
\draw[fill=white] (9.56,1.26) rectangle (9.98,1.68); \node[font=\tiny] at (9.77,1.47) {6};
\draw[fill=yellow!60] (9.98,1.26) rectangle (10.40,1.68); \node[font=\tiny] at (10.19,1.47) {1};
\draw[fill=white] (10.40,1.26) rectangle (10.82,1.68); \node[font=\tiny] at (10.61,1.47) {6};
\draw[fill=green!55] (10.82,1.26) rectangle (11.24,1.68); \node[font=\tiny] at (11.03,1.47) {2};
\draw[fill=white] (11.24,1.26) rectangle (11.66,1.68); \node[font=\tiny] at (11.45,1.47) {6};
\draw[fill=cyan!35] (11.66,1.26) rectangle (12.08,1.68); \node[font=\tiny] at (11.87,1.47) {5};
\draw[fill=cyan!35] (8.72,0.84) rectangle (9.14,1.26); \node[font=\tiny] at (8.93,1.05) {5};
\draw[fill=white] (9.14,0.84) rectangle (9.56,1.26); \node[font=\tiny] at (9.35,1.05) {6};
\draw[fill=cyan!35] (9.56,0.84) rectangle (9.98,1.26); \node[font=\tiny] at (9.77,1.05) {5};
\draw[fill=white] (9.98,0.84) rectangle (10.40,1.26); \node[font=\tiny] at (10.19,1.05) {6};
\draw[fill=cyan!35] (10.40,0.84) rectangle (10.82,1.26); \node[font=\tiny] at (10.61,1.05) {5};
\draw[fill=white] (10.82,0.84) rectangle (11.24,1.26); \node[font=\tiny] at (11.03,1.05) {6};
\draw[fill=magenta!35] (11.24,0.84) rectangle (11.66,1.26); \node[font=\tiny] at (11.45,1.05) {3};
\draw[fill=white] (11.66,0.84) rectangle (12.08,1.26); \node[font=\tiny] at (11.87,1.05) {6};
\draw[fill=white] (8.72,0.42) rectangle (9.14,0.84); \node[font=\tiny] at (8.93,0.63) {6};
\draw[fill=red!50] (9.14,0.42) rectangle (9.56,0.84); \node[font=\tiny] at (9.35,0.63) {4};
\draw[fill=white] (9.56,0.42) rectangle (9.98,0.84); \node[font=\tiny] at (9.77,0.63) {6};
\draw[fill=red!50] (9.98,0.42) rectangle (10.40,0.84); \node[font=\tiny] at (10.19,0.63) {4};
\draw[fill=white] (10.40,0.42) rectangle (10.82,0.84); \node[font=\tiny] at (10.61,0.63) {6};
\draw[fill=red!50] (10.82,0.42) rectangle (11.24,0.84); \node[font=\tiny] at (11.03,0.63) {4};
\draw[fill=white] (11.24,0.42) rectangle (11.66,0.84); \node[font=\tiny] at (11.45,0.63) {6};
\draw[fill=red!50] (11.66,0.42) rectangle (12.08,0.84); \node[font=\tiny] at (11.87,0.63) {4};
\draw[fill=cyan!35] (8.72,0.00) rectangle (9.14,0.42); \node[font=\tiny] at (8.93,0.21) {5};
\draw[fill=white] (9.14,0.00) rectangle (9.56,0.42); \node[font=\tiny] at (9.35,0.21) {6};
\draw[fill=cyan!35] (9.56,0.00) rectangle (9.98,0.42); \node[font=\tiny] at (9.77,0.21) {5};
\draw[fill=white] (9.98,0.00) rectangle (10.40,0.42); \node[font=\tiny] at (10.19,0.21) {6};
\draw[fill=cyan!35] (10.40,0.00) rectangle (10.82,0.42); \node[font=\tiny] at (10.61,0.21) {5};
\draw[fill=white] (10.82,0.00) rectangle (11.24,0.42); \node[font=\tiny] at (11.03,0.21) {6};
\draw[fill=cyan!35] (11.24,0.00) rectangle (11.66,0.42); \node[font=\tiny] at (11.45,0.21) {5};
\draw[fill=white] (11.66,0.00) rectangle (12.08,0.42); \node[font=\tiny] at (11.87,0.21) {6};
\node[font=\scriptsize\bfseries] at (10.40,3.61) {chessboard};
\node[font=\scriptsize,align=center,anchor=north] at (10.40,-0.08) {64 groups (every unit alone)\\ MSB: $0$};
\draw[very thick,orange!80!black] (10.320,1.600) -- (10.480,1.760) (10.320,1.760) -- (10.480,1.600);
\node[font=\scriptsize,anchor=west] at (0,-1.25) {$C_k$ has $2^{k-1}$ units ($C_0$: 1, dummy-free 64-unit array); $\Delta\overline{r^2}$ = MSB's mean $r^2$ minus the array's (10.5 pitch$^2$): the quadratic (bowl) error of the MSB weight.};
\end{circuitikz}
\end{document}
```

| 6-bit array, 8×8 | MSB bowl error $\Delta\overline{r^2}$ (pitch²) | connected groups (all $C_k$) | wiring and vias |
|---|---|---|---|
| Spiral | +4.9 | 11 | fewest: neighbours share one metal, vias only at the input |
| Block chessboard | +4.0 | 24 | moderate |
| Chessboard | 0 | 64 | most: every unit wired separately |

- **Chessboard** (Karmokar ref. [8]): MSB on all black squares, the next bit on the white squares in a chessboard of its own, and so on. Maximum dispersion; best INL/DNL; the most bends, hence vias.
- **Spiral** (Karmokar 2023): $C_0$ and $C_1$ (one unit each, so they cannot be common-centroid) diagonally opposite at the centre; then $C_2, C_3,\dots$ along a spiral from the centre, every unit placed together with its point reflection $(d_1,d_2)\to(-d_1,-d_2)$. Units of one capacitor line up in rows and columns, so wires rarely bend. Fastest; worst INL/DNL.
- **Block chessboard**: a chessboard core for the small capacitors ($C_0\dots C_k$, which are sensitive to variation but have small RC) and blocks of $b_s\times b_s$ units for the large ones in the outer corridors (which set $f_{3dB}$ but average their own variation). The block size tunes the trade.
- The LSB capacitors matter most: an MSB averages $2^{N-1}$ units, so its relative random variation is smaller ($\sigma/\mu\propto1/\sqrt n$), while $C_k/C_0$ depends on the single-unit $C_0$ (Karmokar 2023, fn. 2).

> [!note]- Detail: the placements above were generated, not traced
> The three maps are produced by the stated rules on an 8×8 grid (spiral: ring by ring, clockwise from the top, each free cell paired with its reflection; chessboard: MSB on black squares, each smaller capacitor on the remaining cells farthest from the centre without touching diagonally, reflected; block chessboard: Bayer-ordered 4×4 core for $C_0$–$C_4$, 2×2 blocks for $C_5$, $C_6$). They match the style of Karmokar Fig. 6, not cell for cell. The numbers in the table are computed from these maps: $\Delta\overline{r^2}$ is the MSB's mean $x^2+y^2$ minus the array's (10.5), and groups are 4-connected components per capacitor.

### Routing Parasitics That Break the Ratio

```tikz title="Routing parasitics in a charge-scaling CDAC array. Only parasitics that touch the top-plate node change the transfer; C^TB is the routing-induced one that a layout can create or avoid (keep top-plate and bottom-plate wires from overlapping). After Karmokar et al. (TCAD) Fig. 2 and (review) Fig. 4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw (0,4) node[left]{$V_{out}$ (top plates)} -- (8,4);
  \draw (1.5,4) to[C,l_=$C_k$] (1.5,2) node[circ]{} -- (1.5,1.6) node[below,font=\scriptsize]{bottom plate $k$};
  \draw (5.5,4) to[C,l_=$C_j$] (5.5,2) node[circ]{} -- (5.5,1.6) node[below,font=\scriptsize]{bottom plate $j$};
  \draw (1.5,0.9) node[font=\scriptsize]{to $V_{REF}$ or GND};
  \draw (5.5,0.9) node[font=\scriptsize]{to $V_{REF}$ or GND};
  \draw[red!70!black] (7.6,4) to[C,l=$C^{TS}$] (7.6,2.4) node[ground]{};
  \draw[blue!70!black] (3.0,4) to[C,l_=$C^{TB}_{k}$, color=blue!70!black] (3.0,2.6) -- (5.5,2.6) ;
  \draw[gray] (1.5,2) to[C,l_=$C^{BB}_{kj}$] (5.5,2);
  \draw[gray] (1.5,2) -- (-0.6,2) to[C,l_=$C^{BS}$] (-0.6,0.4) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (9.0,3.6) {\textcolor{red!70!black}{$C^{TS}$}: top plate to substrate $\to$ gain error};
  \node[font=\scriptsize,align=left,anchor=west] at (9.0,2.9) {\textcolor{blue!70!black}{$C^{TB}$}: top plate to \emph{another} capacitor's\\ bottom plate (routing overlap) $\to$ ratio error, INL/DNL};
  \node[font=\scriptsize,align=left,anchor=west] at (9.0,1.9) {$C^{BS}$, $C^{BB}$: bottom-plate loads $\to$ switching\\ energy and $f_{3dB}$, not linearity};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{OUT}(i)=V_{REF}\,\frac{C_{ON}(i)+\Delta C_{ON}(i)}{C_T+\Delta C_T},\quad \Delta C_{ON}=\sum_k D_k\Delta C_k+C^{TB}_{ON},\quad \Delta C_T=\sum_k\Delta C_k+C^{TB}_{ON}+C^{TB}_{OFF}+C^{TS}}
$$

- **$C^{TS}$** (top plate to substrate) adds to $C_T$ only: a gain error. Keep it small with a short top-plate tree (minimum spanning tree) and enclosed-top-plate MOM structures (sandwich, pillar, mortise-tenon), at some cost in density.
- **$C^{TB}$** (a top-plate wire over another capacitor's bottom plate, or vice versa) adds to $C_{ON}$ or $C_{OFF}$ depending on the code: a code-dependent ratio error, i.e. INL and DNL. **Route top-plate and bottom-plate wires so they never overlap**; then $C^{TB}$ is negligible (Karmokar 2023, Table I).
- **$C^{BS}$, $C^{BB}$** load the bottom-plate drivers: switching energy and $f_{3dB}$, not linearity. ($C^{BB}$ between two bottom plates vanishes when both are switched the same way.)
- **Lead capacitance must be matched per unit**, not just made small. Hastings' number: a 1 µm-wide metal lead over 10 kÅ field oxide has about 0.13 fF/µm, so 100 µm of lead is 13 fF, **1.3% of a 1 pF** capacitor (§8.2.4).

> [!tip] Remark
> Top versus bottom plate at the DAC level (top plate to the output, digital lines over bottom plates, the caged unit cell, the $C_X$ periodic DNL of a split array) is owned by [[DACs#Capacitor Parasitics Top Plate Costs Gain, Bottom Plate Costs Speed]] and [[DACs#Matrix CDACs and Routing]]. This section is only about what the *array wiring* adds.

### Wiring the Array: Branches, Trunks, Bridges

```tikz title="Left: bottom-plate routing of one capacitor (C4 = 8 units) in a 4x4 array: branch wires to trunks in the vertical channels, a bridge at the array edge. After Karmokar et al. (TCAD) Fig. 8. Right: equalising lead capacitance per unit by jogs or dead-end branches (Hastings Fig. 8.9)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  dpoly/.style={fill=red!25,draw=black!50},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70,fill opacity=0.85},
  mtwo/.style={fill=violet!55,draw=black!70,fill opacity=0.85},]
\draw[fill=red!50] (0.00,3.00) rectangle (0.70,3.70); \node[font=\scriptsize] at (0.35,3.35) {4};
\draw[fill=magenta!35] (1.30,3.00) rectangle (2.00,3.70); \node[font=\scriptsize] at (1.65,3.35) {3};
\draw[fill=magenta!35] (2.60,3.00) rectangle (3.30,3.70); \node[font=\scriptsize] at (2.95,3.35) {3};
\draw[fill=red!50] (3.90,3.00) rectangle (4.60,3.70); \node[font=\scriptsize] at (4.25,3.35) {4};
\draw[fill=red!50] (0.00,2.00) rectangle (0.70,2.70); \node[font=\scriptsize] at (0.35,2.35) {4};
\draw[fill=gray!60] (1.30,2.00) rectangle (2.00,2.70); \node[font=\scriptsize] at (1.65,2.35) {0};
\draw[fill=green!55] (2.60,2.00) rectangle (3.30,2.70); \node[font=\scriptsize] at (2.95,2.35) {2};
\draw[fill=red!50] (3.90,2.00) rectangle (4.60,2.70); \node[font=\scriptsize] at (4.25,2.35) {4};
\draw[fill=red!50] (0.00,1.00) rectangle (0.70,1.70); \node[font=\scriptsize] at (0.35,1.35) {4};
\draw[fill=green!55] (1.30,1.00) rectangle (2.00,1.70); \node[font=\scriptsize] at (1.65,1.35) {2};
\draw[fill=yellow!60] (2.60,1.00) rectangle (3.30,1.70); \node[font=\scriptsize] at (2.95,1.35) {1};
\draw[fill=red!50] (3.90,1.00) rectangle (4.60,1.70); \node[font=\scriptsize] at (4.25,1.35) {4};
\draw[fill=red!50] (0.00,0.00) rectangle (0.70,0.70); \node[font=\scriptsize] at (0.35,0.35) {4};
\draw[fill=magenta!35] (1.30,0.00) rectangle (2.00,0.70); \node[font=\scriptsize] at (1.65,0.35) {3};
\draw[fill=magenta!35] (2.60,0.00) rectangle (3.30,0.70); \node[font=\scriptsize] at (2.95,0.35) {3};
\draw[fill=red!50] (3.90,0.00) rectangle (4.60,0.70); \node[font=\scriptsize] at (4.25,0.35) {4};
\draw[blue!70!black,line width=1.6pt] (-0.3,-0.4) -- (-0.3,3.7); \draw[blue!70!black,line width=1.6pt] (4.9,-0.4) -- (4.9,3.7);
\draw[red!80!black,line width=1.2pt] (-0.3,3.35) -- (0,3.35); \draw[red!80!black,line width=1.2pt] (4.9,3.35) -- (4.6,3.35);
\draw[red!80!black,line width=1.2pt] (-0.3,2.35) -- (0,2.35); \draw[red!80!black,line width=1.2pt] (4.9,2.35) -- (4.6,2.35);
\draw[red!80!black,line width=1.2pt] (-0.3,1.35) -- (0,1.35); \draw[red!80!black,line width=1.2pt] (4.9,1.35) -- (4.6,1.35);
\draw[red!80!black,line width=1.2pt] (-0.3,0.35) -- (0,0.35); \draw[red!80!black,line width=1.2pt] (4.9,0.35) -- (4.6,0.35);
\draw[green!50!black,line width=1.6pt] (-0.3,-0.4) -- (4.9,-0.4); \draw[green!50!black,line width=1.6pt] (2.3,-0.4) -- (2.3,-0.9) node[below,font=\scriptsize,black] {to switch $S_4$};
\node[font=\scriptsize,anchor=west,align=left] at (5.3,2.8) {\textcolor{red!80!black}{branch}: unit $\to$ neighbour or trunk\\ \textcolor{blue!70!black}{trunk}: vertical channel track\\ \textcolor{green!50!black}{bridge}: joins trunks at the\\ array edge, mirrored about the centre};
\node[font=\scriptsize,anchor=west,align=left] at (5.3,0.7) {bottom plates leave at the bottom edge\\ (switches and drivers are outside);\\ top plates: minimum spanning tree};
\begin{scope}[xshift=11.0cm,yshift=0.8cm]
\draw[fill=green!20] (0.90,0) rectangle (2.10,1.2); \node[font=\scriptsize] at (1.50,0.6) {$C_u$};
\node[font=\scriptsize\bfseries] at (1.40,2.25) {jog};
\draw[fill=green!20] (3.90,0) rectangle (5.10,1.2); \node[font=\scriptsize] at (4.50,0.6) {$C_u$};
\node[font=\scriptsize\bfseries] at (4.40,2.25) {dead-end branch};
\draw[mone] (-0.3,0.55) rectangle (0.15,0.7); \draw[mone] (0.0,0.55) rectangle (0.15,1.6); \draw[mone] (0.0,1.45) rectangle (0.55,1.6); \draw[mone] (0.4,0.55) rectangle (0.55,1.6); \draw[mone] (0.4,0.55) rectangle (0.9,0.7);
\draw[mone] (2.7,0.55) rectangle (3.9,0.7); \draw[mone] (3.3,0.55) rectangle (3.45,1.8);
\node[font=\scriptsize,align=center] at (2.6,-0.6) {lengthen the short leads until every unit\\ sees the same lead capacitance};
\end{scope}
\end{circuitikz}
\end{document}
```

1. **Group** each capacitor's adjacent units (BFS over the 4-neighbour graph); connect neighbours with branch wires, mirrored to the reflected unit to keep routing symmetric.
2. **Trunks** run in the vertical channels between columns; channel selection and track assignment try to need one track per channel.
3. **Bridges** join the trunks at the array edge, where the bottom plates leave for the switches (switches and drivers are noisy and sit outside the array).
4. **Top plates:** one minimum spanning tree over all units (column branches plus one cross-link per column pair, since vertical spacing is the smaller one), minimising $C^{TS}$.
5. **FinFET nodes:** use $k$ parallel wires on the critical (largest) bits, which also gives $k$ parallel vias at each bend. Two wires gave more than 2× in $f_{3dB}$ (the 2×2 mesh at each trunk-branch junction has four vias; the gain lies between 2× wire-dominated and 4× via-dominated), with diminishing returns beyond (Karmokar 2023, Fig. 15).
6. **Equalise** lead capacitance where a unit's lead is short: insert jogs or dead-end branches (Hastings Fig. 8.9), with equal widths and ≥ 2 µm spacing to other metal; if a lead must cross something, all matched leads cross it (Hastings §8.2.4).

### Dispersion Against Speed

```tikz title="Dispersion against speed in a 12-nm FinFET binary CDAC (C_u = 5 fF): spreading units (chessboard) buys DNL but its wiring and vias cut the 3-dB switching frequency by about 100x against the spiral. All points have |INL| between 0.06 and 0.31 LSB. Data from Karmokar et al. (TCAD) Table II; [1] = an earlier routed placement, not reported at 10 bits."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[->] (0,0) -- (10.00,0) node[right,font=\scriptsize] {$|\mathrm{DNL}|_{max}$ (LSB)};
\draw[->] (0,0) -- (0,6.97) node[above,font=\scriptsize] {$f_{3dB}$ (MHz, log)};
\draw (0,0.70) -- (-0.1,0.70) node[left,font=\scriptsize] {1};
\draw (0,2.10) -- (-0.1,2.10) node[left,font=\scriptsize] {10};
\draw (0,3.50) -- (-0.1,3.50) node[left,font=\scriptsize] {100};
\draw (0,4.90) -- (-0.1,4.90) node[left,font=\scriptsize] {1000};
\draw (0,6.30) -- (-0.1,6.30) node[left,font=\scriptsize] {10000};
\draw (2.00,0) -- (2.00,-0.1) node[below,font=\scriptsize] {0.05};
\draw (4.00,0) -- (4.00,-0.1) node[below,font=\scriptsize] {0.1};
\draw (6.00,0) -- (6.00,-0.1) node[below,font=\scriptsize] {0.15};
\draw (8.00,0) -- (8.00,-0.1) node[below,font=\scriptsize] {0.2};
\fill[blue!70!black] (0.00,3.15) circle (2.5pt); \node[font=\scriptsize,anchor=west,blue!70!black] at (0.12,3.27) {[1]};
\fill[blue!70!black] (0.40,2.39) circle (2.5pt); \node[font=\scriptsize,anchor=west,blue!70!black] at (0.52,2.51) {chessboard [8]};
\fill[blue!70!black] (2.00,5.11) circle (2.5pt); \node[font=\scriptsize,anchor=west,blue!70!black] at (2.12,5.23) {spiral};
\fill[blue!70!black] (0.80,4.24) circle (2.5pt); \node[font=\scriptsize,anchor=west,blue!70!black] at (0.92,4.36) {block chess.};
\fill[red!70!black] (1.92,0.48) rectangle (2.08,0.64); \node[font=\scriptsize,anchor=west,red!70!black] at (2.12,0.51) {chessboard [8]};
\fill[red!70!black] (8.72,3.29) rectangle (8.88,3.45); \node[font=\scriptsize,anchor=west,red!70!black] at (8.92,3.32) {spiral};
\fill[red!70!black] (4.32,2.67) rectangle (4.48,2.83); \node[font=\scriptsize,anchor=west,red!70!black] at (4.52,2.70) {block chess.};
\draw[blue!70!black,dashed] (0.40,2.39) -- (0.80,4.24) -- (2.00,5.11);
\draw[red!70!black,dashed] (2.00,0.56) -- (4.40,2.75) -- (8.80,3.37);
\node[font=\scriptsize,anchor=west,blue!70!black] at (6.00,5.57) {$\bullet$ 8-bit};
\node[font=\scriptsize,anchor=west,red!70!black] at (6.00,5.15) {$\blacksquare$ 10-bit};
\end{circuitikz}
\end{document}
```

$$
\boxed{f_{3dB}=\frac{1}{2(N+2)\ln2\cdot\tau},\qquad \tau=\max_k\ (\text{Elmore delay of the RC mesh feeding } C_k)}
$$

| Binary CDAC, $C_u=5$ fF, 12 nm (Table II) | chessboard [8] | block chessboard | spiral |
|---|---|---|---|
| 8 bit: $\{\lvert\mathrm{DNL}\rvert,\lvert\mathrm{INL}\rvert\}$ (LSB) | {0.01, 0.06} | {0.02, 0.07} | {0.05, 0.08} |
| 8 bit: $f_{3dB}$ | 16 MHz | 339 MHz | 1411 MHz |
| 10 bit: $\{\lvert\mathrm{DNL}\rvert,\lvert\mathrm{INL}\rvert\}$ | {0.05, 0.30} | {0.11, 0.30} | {0.22, 0.31} |
| 10 bit: $f_{3dB}$ | 0.8 MHz | 29 MHz | 81 MHz |

- $\tau$ is set by the slowest bit, almost always an MSB, so dispersing **small** capacitors costs little speed; dispersing large ones costs a lot. That is the logic of the block chessboard.
- Every bend in a FinFET's unidirectional lower metal is a via; vias, not wire length, dominate. In the 8-bit example the chessboard needed five tracks per vertical channel against two for the spiral (Karmokar 2023, Fig. 14).
- All entries meet $\tfrac12$ LSB at $\gamma=10$ ppm; the gradient sweep in the [[#Spec translation|worked example]] shows where the spiral stops meeting it.

### Split (Bridge) CDAC Arrays

```tikz title="8-bit split CDAC (L = 4) on a 6x6 spiral common-centroid array. After Karmokar et al. Fig. 10(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[fill=red!50] (0.00,2.75) rectangle (0.55,3.30); \node[font=\scriptsize] at (0.28,3.02) {4};
\draw[fill=red!50] (0.55,2.75) rectangle (1.10,3.30); \node[font=\scriptsize] at (0.83,3.02) {4};
\draw[fill=red!50] (1.10,2.75) rectangle (1.65,3.30); \node[font=\scriptsize] at (1.38,3.02) {4};
\draw[fill=red!50] (1.65,2.75) rectangle (2.20,3.30); \node[font=\scriptsize] at (1.93,3.02) {4};
\draw[fill=magenta!15] (2.20,2.75) rectangle (2.75,3.30); \node[font=\scriptsize] at (2.48,3.02) {8};
\draw[fill=gray!8,dashed] (2.75,2.75) rectangle (3.30,3.30); \node[font=\scriptsize] at (3.02,3.02) {D};
\draw[fill=cyan!35] (0.00,2.20) rectangle (0.55,2.75); \node[font=\scriptsize] at (0.28,2.48) {9};
\draw[fill=green!25] (0.55,2.20) rectangle (1.10,2.75); \node[font=\scriptsize] at (0.83,2.48) {7};
\draw[fill=green!55] (1.10,2.20) rectangle (1.65,2.75); \node[font=\scriptsize] at (1.38,2.48) {2};
\draw[fill=yellow!60] (1.65,2.20) rectangle (2.20,2.75); \node[font=\scriptsize] at (1.93,2.48) {1};
\draw[fill=magenta!15] (2.20,2.20) rectangle (2.75,2.75); \node[font=\scriptsize] at (2.48,2.48) {8};
\draw[fill=cyan!35] (2.75,2.20) rectangle (3.30,2.75); \node[font=\scriptsize] at (3.02,2.48) {9};
\draw[fill=cyan!35] (0.00,1.65) rectangle (0.55,2.20); \node[font=\scriptsize] at (0.28,1.93) {9};
\draw[fill=magenta!35] (0.55,1.65) rectangle (1.10,2.20); \node[font=\scriptsize] at (0.83,1.93) {3};
\draw[fill=orange!50] (1.10,1.65) rectangle (1.65,2.20); \node[font=\scriptsize] at (1.38,1.93) {5};
\draw[fill=gray!8,dashed] (1.65,1.65) rectangle (2.20,2.20); \node[font=\scriptsize] at (1.93,1.93) {D};
\draw[fill=magenta!35] (2.20,1.65) rectangle (2.75,2.20); \node[font=\scriptsize] at (2.48,1.93) {3};
\draw[fill=cyan!35] (2.75,1.65) rectangle (3.30,2.20); \node[font=\scriptsize] at (3.02,1.93) {9};
\draw[fill=cyan!35] (0.00,1.10) rectangle (0.55,1.65); \node[font=\scriptsize] at (0.28,1.38) {9};
\draw[fill=magenta!35] (0.55,1.10) rectangle (1.10,1.65); \node[font=\scriptsize] at (0.83,1.38) {3};
\draw[fill=gray!60] (1.10,1.10) rectangle (1.65,1.65); \node[font=\scriptsize] at (1.38,1.38) {0};
\draw[fill=orange!50] (1.65,1.10) rectangle (2.20,1.65); \node[font=\scriptsize] at (1.93,1.38) {5};
\draw[fill=magenta!35] (2.20,1.10) rectangle (2.75,1.65); \node[font=\scriptsize] at (2.48,1.38) {3};
\draw[fill=cyan!35] (2.75,1.10) rectangle (3.30,1.65); \node[font=\scriptsize] at (3.02,1.38) {9};
\draw[fill=cyan!35] (0.00,0.55) rectangle (0.55,1.10); \node[font=\scriptsize] at (0.28,0.83) {9};
\draw[fill=magenta!15] (0.55,0.55) rectangle (1.10,1.10); \node[font=\scriptsize] at (0.83,0.83) {8};
\draw[fill=yellow!30] (1.10,0.55) rectangle (1.65,1.10); \node[font=\scriptsize] at (1.38,0.83) {6};
\draw[fill=green!55] (1.65,0.55) rectangle (2.20,1.10); \node[font=\scriptsize] at (1.93,0.83) {2};
\draw[fill=green!25] (2.20,0.55) rectangle (2.75,1.10); \node[font=\scriptsize] at (2.48,0.83) {7};
\draw[fill=cyan!35] (2.75,0.55) rectangle (3.30,1.10); \node[font=\scriptsize] at (3.02,0.83) {9};
\draw[fill=gray!8,dashed] (0.00,0.00) rectangle (0.55,0.55); \node[font=\scriptsize] at (0.28,0.28) {D};
\draw[fill=magenta!15] (0.55,0.00) rectangle (1.10,0.55); \node[font=\scriptsize] at (0.83,0.28) {8};
\draw[fill=red!50] (1.10,0.00) rectangle (1.65,0.55); \node[font=\scriptsize] at (1.38,0.28) {4};
\draw[fill=red!50] (1.65,0.00) rectangle (2.20,0.55); \node[font=\scriptsize] at (1.93,0.28) {4};
\draw[fill=red!50] (2.20,0.00) rectangle (2.75,0.55); \node[font=\scriptsize] at (2.48,0.28) {4};
\draw[fill=red!50] (2.75,0.00) rectangle (3.30,0.55); \node[font=\scriptsize] at (3.02,0.28) {4};
\draw[very thick,orange!80!black] (1.570,1.570) -- (1.730,1.730) (1.570,1.730) -- (1.730,1.570);
\begin{scope}[xshift=4.6cm,yshift=0.2cm]
\node[font=\scriptsize,anchor=west,align=left] at (0,2.9) {LSB array: 0 ($C$, grounded), 1 ($C$), 2 ($2C$), 3 ($4C$), 4 ($8C$)};
\node[font=\scriptsize,anchor=west,align=left] at (0,2.4) {bridge: 5 = $C_A = \frac{16}{15}C$, built as two slots};
\node[font=\scriptsize,anchor=west,align=left] at (0,1.9) {MSB array: 6 ($C$), 7 ($2C$), 8 ($4C$), 9 ($8C$)};
\node[font=\scriptsize,anchor=west,align=left] at (0,0.95) {placement order: 5 at the centre (smallest, most\\ sensitive to wiring); odd singles 0, 1, 6 + one dummy\\ near the centre; then 2, 7, 3, 8, 4, 9 alternating\\ LSB/MSB along the spiral, each unit with its reflection};
\node[font=\scriptsize,anchor=west] at (0,-0.35) {$D_C = r s - (\sum n_i + 2) = 36-33 = 3$ dummies};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{C_A=\frac{C_T^{LSB}}{C_T^{MSB}}\,C_u\ \ \left(=\tfrac{16}{15}C_u\ \text{for }L=4\right),\qquad D_C=rs-\Big(\sum n_i+2\Big)}
$$

- The bridge capacitor is not an integer number of units. Build it as **two slots** at the **centre** of the array: it is the smallest element, so routing capacitance perturbs it most, and it connects the two halves.
- **Odd singles** ($C_0$, $C_1$, MSB-side $C_{L+1}$ here) cannot be common-centroid. Put them, plus one dummy if their count is odd, diagonally around the centre. Then place LSB and MSB capacitors of equal weight alternately ($C_2, C_7, C_3, C_8,\dots$) along the spiral, each unit with its reflection.
- **Non-unit capacitor sizing.** For a MOM finger capacitor of height $H$, width $w$, end gap $c$ and coupling length $l = w-c$, a uniform edge shift $\delta$ gives a relative error proportional to perimeter over area, as for MIM (Karmokar 2023, Eqs. 37–45):

$$
\boxed{\frac{\Delta C}{C}=2\delta\,\frac{H+l}{H\,l}=2\delta\,\frac{H+w-c}{H(w-c)}}
$$

  so size $C_A$ (and any non-unit capacitor) to the **same perimeter-to-area ratio** as the unit, and an overall size of 1–2 units.
- Top plates of the two halves are routed separately (BFS between adjacent groups, then an MST per half); $C_A$ connects to the adjacent units of each half. Non-adjacent $C_A$ slots need one extra vertical track.

> [!tip] Remark
> Why the split array works, its weighting, and the periodic DNL from the parasitic at the bridge node are derived in [[DACs#Split (Bridge) CDACs]]. Here only its placement is new.

## Level 5: Generating Arrays Automatically

### The Pipeline

```tikz title="The common-centroid generator pipeline shared by the methods in Karmokar et al. (review, Secs. III-IV) and the constructive TCAD flow."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\tikzset{box/.style={draw,rounded corners,align=center,minimum height=1.25cm,text width=2.45cm,font=\scriptsize}}
  \node[box,fill=gray!10] (i) at (0,0) {devices + ratios\\ $n_1:n_2:\dots$, unit cell,\\ matched groups};
  \node[box,fill=blue!10] (s) at (3.1,0) {array size\\ $r\times s$ near square,\\ dummies $D_C = rs-\sum n_i$};
  \node[box,fill=orange!15] (p) at (6.2,0) {placement\\ constructive / ILP /\\ annealing / genetic};
  \node[box,fill=green!15] (r) at (9.3,0) {routing\\ groups (BFS), trunks,\\ bridges, MST, widths};
  \node[box,fill=violet!12] (e) at (12.4,0) {extract + evaluate\\ $R$, $C^{TS}$, $C^{TB}$, LDE\\ $\to$ INL/DNL, $f_{3dB}$, $V_{OS}$};
  \draw[->] (i) -- (s); \draw[->] (s) -- (p); \draw[->] (p) -- (r); \draw[->] (r) -- (e);
  \draw[->,dashed] (e.south) -- ++(0,-0.6) -| node[pos=0.25,below,font=\scriptsize] {stochastic methods iterate; constructive methods run once} (p.south);
\end{circuitikz}
\end{document}
```

- **Array size first:** as close to square as possible, spare slots become dummies, plus an outer dummy ring against edge effects (Karmokar review §III-C).
- **Four families of capacitor placers** (Karmokar review §III-C):
  1. *Heuristic / constructive:* rectangles and circles (Sayed & Dessouky); dispersion-driven placement for correlation; chessboard, generalized to non-binary ratios and to block chessboards; spiral.
  2. *Integer linear programming:* exclusivity (one unit per slot), exact unit counts per capacitor, and a routing constraint (each unit picks one track in one of its four adjacent channels).
  3. *Stochastic search:* simulated annealing over a **pair sequence** (pairs of units placed symmetrically about the centre, listed by distance from it), moved by perturbations that keep the adjacency feasible; a center-based corner block list for grid placement; SA with simultaneous global routing.
  4. *Genetic:* a "CP-sequence" encoding unit size, routing topology and pattern, with fitness $\Phi=\left(\alpha\frac{C_{unit}}{C_{unit,max}}+\beta\frac{\mathrm{DNL}_{max}}{0.5}+\gamma\frac{\mathrm{INL}_{max}}{0.5}\right)^{-1}$, infinite penalty above 0.5 LSB, followed by a small ILP that adds shields.
- **Transistor arrays need more than capacitor placers:** diffusion sharing, LDEs, and EM/IR on wide source lines. Constructive MOS methods (Sharma et al., in the open-source ALIGN flow):
  1. Build the **half diffusion graph** (nodes are S/D nets, edges are units, halved); an Euler path through it gives half a row with maximal diffusion sharing; reflect it about the centre for the other half. With an odd unit count, one unit goes at the row edge.
  2. Fill the matrix by repeatedly placing the device with the **largest fraction of unplaced units**, alternating left and right of the centre (dispersion), and deprioritising a device already placed in that column (LOD).
  3. Route with a **fishbone** whose wire widths are sized for electromigration and IR drop.
  4. For FinFET current mirrors, choose unit orientations so that gate misalignment shifts every device's current equally (Karmokar review §IV).
- **Constructive beats stochastic on runtime** with comparable quality for the structured DAC case (Karmokar 2023, §V and Table VI).

> [!tip] Remark
> Placement and routing algorithms in general (sequence pairs, B*-trees, symmetry constraints, analog routers) belong to [[Layout Automation]]; this section keeps only what is specific to common-centroid arrays.

### Correlation Distance and When Not to Use Common Centroid

$$
\boxed{\text{capacitors: }\rho(r)=\rho_u^{\,r/L_c};\qquad \text{transistors: }\rho(r)=\frac{\sigma_g^2+e^{-(r/R_L)^2}\sigma_s^2}{\sigma_P^2},\quad \sigma_P^2=\sigma_g^2+\sigma_u^2+\sigma_s^2}
$$

- Variation splits into global ($g$: all devices alike, no mismatch), uncorrelated local ($u$: only area helps) and spatially correlated local ($s$: nearby devices alike). Common centroid targets the systematic gradient; **dispersion** additionally raises the correlation between capacitors and so cuts the correlated random part (Karmokar review §II-B, §III-C).
- **Long correlation distance** ($R_L=1000$ µm): every pattern behaves like the uncorrelated case; pick by parasitics and LDE. **Short** ($R_L=10$ µm): clustering suffers; CC and dispersed patterns win (review §V-B).
- Rule from the review: CC for **large** matched devices (with multi-row patterns that also match LOD and wiring), clustered or interdigitated for **small** ones, and decide with extracted simulation, not by habit.

> [!note]- Detail: ratio variance of two capacitors built from correlated units (Karmokar review Eqs. 13–16)
> For $C_p=pC_u$ and $C_q=qC_u$ with pairwise unit correlations $\rho_{ab}$: $\sigma_p^2=\sigma_u^2(p+2S_p)$, $\sigma_q^2=\sigma_u^2(q+2S_q)$, $\mathrm{Cov}(p,q)=\sigma_u^2S_{pq}$, where $S_p$ sums $\rho_{ab}$ over unit pairs inside $C_p$, and $S_{pq}$ over pairs across. Then
> $$\mathrm{var}\!\left(\frac{C_p}{C_q}\right)=\frac{A_f^2}{C_u^2q^4WL}\left[q^2(p+2S_p)+p^2(q+2S_q)-2pqS_{pq}\right],\qquad \sigma_u^2=\frac{A_f^2}{WL}.$$
> Raising the cross-correlation $S_{pq}$ (units of $C_p$ and $C_q$ interleaved, close together) lowers the ratio variance: the quantitative case for dispersion against random variation. The systematic metric is the worst ratio error over all pairs, $M_{sys}=\max_{p\ne q}\left|\frac{C_p^*/C_q^*-C_p/C_q}{C_p/C_q}\right|$.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Common centroid (ABBA, AB/BA) | linear gradient error → 0, any direction (2-D) | routing symmetry; nothing gained without a gradient |
| 2-D instead of 1-D | also cancels $x^2$, $y^2$ (~60% of ABBA residue) | diagonal wiring |
| Higher order $n$ (Dai) | cancels orders $1..n$ | $2^n$ units per device: smaller units, more gaps, more wiring |
| More dispersion (more, smaller sub-arrays) | quadratic residue, correlated random variation | wire length, vias, $f_{3dB}$; area in gaps |
| Compact, near-square array | residue ∝ span² | floorplan shape |
| Dummy ring | edge etch, fringing, neighbour coupling | area (shrinks as fraction for big arrays) |
| Orientation-balanced MOS fingers | tilted-implant and mask-shift mismatch | pattern choices, S/D merging |
| Multi-row MOS CC (A/B swapped by row) | LOD and $R_s$ match as well as centroid | rows, wiring |
| Clustered / interdigitated small devices | parasitics, LOD, node capacitance | linear gradient error (small at small size) |
| Spiral CDAC | $f_{3dB}$, area, few vias | INL/DNL, fails at large gradients |
| Chessboard CDAC | INL/DNL, robust to large gradients | $f_{3dB}$ (~100× lower at 8 bits in 12 nm), wire $C$ |
| Parallel wires on MSB nets | $f_{3dB}$ (>2× for two wires) | channel tracks |
| Matched leads (jogs, dead ends), no top/bottom overlap | ratio error from lead and $C^{TB}$ | wire length, $C^{TS}$ |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Common-centroid condition | $\frac1{s_j}\sum_i x_i^{(j)}$ and $\frac1{s_j}\sum_i y_i^{(j)}$ equal for every device $j$ |
| Weighted centroid | $X_R=\sum_i\frac{\partial R}{\partial R_i}X_i\big/\sum_i\frac{\partial R}{\partial R_i}$ |
| Gradient mismatch | $\varepsilon_{A-B}=\sum g_{jk}\Delta m_{jk}p^{j+k}$, $\Delta m_{jk}=\overline{x^jy^k}_A-\overline{x^jy^k}_B$ |
| Symmetry rules | self point-symmetric → odd orders cancel; A↔B point-symmetric → even orders cancel |
| Nth-order pattern | cancels orders $1..n$ with $2^n$ units per device |
| Spec | $\sum_{k>n}\lvert g_k\Delta m_k\rvert p^k\le\varepsilon-k\sigma$ |
| Binary CDAC midscale | $\mathrm{DNL}_{mid}=2^{N-1}(\varepsilon_{MSB}-\varepsilon_{rest})$, need $<2^{-N}$ ratio error |
| Quadratic residue, 1-D | $A^kB^{2k}A^k$: $2k^2g_2p^2$; $(ABBA)^k$: $2g_2p^2$ |
| Linear thickness → capacitance | $C\approx C_u[1-\gamma x/t_0+(\gamma x/t_0)^2]$, $g_2=g_1^2$ |
| MOS orientation | $\Phi=\frac1N\sum\Phi_i$, $\Phi_A=\Phi_B$ |
| Dummies to fill | $D_C=rs-\sum n_i$ (split DAC: $-(\sum n_i+2)$) |
| Lead capacitance | ≈ 0.13 fF/µm: 100 µm ≈ 13 fF ≈ 1.3% of 1 pF |
| CDAC output with parasitics | $V_{OUT}=V_{REF}\frac{C_{ON}+\Delta C_{ON}}{C_T+\Delta C_T}$ |
| CDAC switching | $f_{3dB}=1/[2(N+2)\ln2\,\tau]$, $\tau$ = worst-bit Elmore delay |
| Split-DAC bridge | $C_A=(C_T^{LSB}/C_T^{MSB})C_u$ |
| Non-unit MOM cap | $\Delta C/C=2\delta(H+l)/(Hl)$: match perimeter/area to the unit |
| Pair with source wiring | $G_m=g_m(v_{in}-i_{ac}R_s)/v_{in}$ |
| Correlation | caps $\rho=\rho_u^{r/L_c}$; MOS $\rho=(\sigma_g^2+e^{-(r/R_L)^2}\sigma_s^2)/\sigma_P^2$ |

## References

- **Karmokar, Madhusudan, Sharma, Harjani, Lin, Sapatnekar, "Common-Centroid Layout for Active and Passive Devices: A Review and the Road Ahead,"** ASP-DAC 2022, pp. 114–121: CC criterion (Eqs. 1–5), variation taxonomy and correlation models (Eqs. 6–21, Fig. 3), LDEs (Eq. 11, Fig. 2), CDAC parasitics (Fig. 4), MOM unit structures (Fig. 5), the four placer families and chessboard (Fig. 6), routing topology (Fig. 7), GA fitness (Eq. 24), MOS CC with Euler paths and ALIGN (Fig. 8), clustered vs CC vs ID (Fig. 9, Eq. 25), OTA and StrongARM case studies (Fig. 10, §V).
- **Karmokar, Sharma, Poojary, Madhusudan, Harjani, Sapatnekar, "Constructive Placement and Routing for Common-Centroid Capacitor Arrays in Binary-Weighted and Split DACs,"** IEEE TCAD 42(9), 2023, pp. 2782–2795: binary and split DAC models (Eqs. 1–10, Figs. 1–3), gradient and correlation models (Eqs. 11–16), nonideal output (Eqs. 17–31), $f_{3dB}$ (Eq. 32, Fig. 4), non-unit MOM capacitor (Eqs. 37–45, Fig. 5), spiral / chessboard / block chessboard (Fig. 6, Algorithm 1), routing (Figs. 7–9), split-DAC layout (Figs. 10–12), Tables I–IV, Figs. 13–15.
- **Dai, He, Xing, Chen, Geiger, "An Nth Order Central Symmetrical Layout Pattern for Nonlinear Gradients Cancellation,"** ISCAS 2005, pp. 4835–4838: polynomial gradient model (Eqs. 1–12), construction and proofs (Sec. III, Figs. 1–3), Table I and Fig. 4.
- **Hastings, *The Art of Analog Layout*, 3rd ed.** (Pearson 2023; PDF page = printed + 1): §8.2.4 interconnection parasitics (Figs. 8.8–8.9, lead-capacitance example), §8.2.7 centroids and common-centroid layout pp. 386–393 (Eqs. 8.23–8.26, Figs. 8.14–8.17, Tables 8.2–8.5), §8.2.2–8.2.3 dummy capacitor arrays (Fig. 8.5), §8.3.2 capacitor matching rules 1, 3, 4, 7, 8, 9, 10 pp. 421–424; §13.2.5 oxide gradient p. 704; §13.2.6 common-centroid layout of MOS transistors pp. 706–710 (Figs. 13.57–13.59, Eq. 13.61, Tables 13.2–13.3).
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §19.2.2 pp. 741–743 (Fig. 19.18 gradient across a pair, Fig. 19.19 common-centroid and its routing difficulty, Fig. 19.20 and Eqs. 19.6–19.9 one-dimensional cross-coupling), §19.2.6 Example 19.4 p. 752 (8:1 capacitor ratio with dummies).
- **Zettelkasten** (`AnalogTheory/Process Layout and Packaging/`): `15k3`, `15k3a`, `15n1` checked for coverage; nothing beyond Razavi §19.2 used.
