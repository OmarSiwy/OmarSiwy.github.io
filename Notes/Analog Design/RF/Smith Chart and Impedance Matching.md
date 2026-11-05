---
title: Smith Chart and Impedance Matching
description: The Smith chart as a map of every lossless move (series, shunt, line), then every way to match a load (conjugate, L-section, single and double stub, quarter-wave, multisection, taper) and the Bode-Fano limit on how well it can be done.
kind: topic
status: growing
aliases:
  - Smith Chart and Impedance Matching
  - Smith Chart
  - Admittance Smith Chart
  - Impedance Matching
  - Conjugate Impedance Matching
  - Quarter-Wave Transformer
  - L-Network Matching
  - Single-Stub Tuning
  - Double-Stub Tuning
---

This note owns the Smith chart and every matching network. It opens with the chart as a black box (a map where each component is one kind of slide), then reads it, then uses it to design narrowband matches, then broadband ones, and ends at the theoretical limit on any match. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="The Smith chart on one screen: every lossless matching move is a slide along one family of circles. Grey solid = constant r and x (impedance grid); red dashed = constant g and b (admittance grid). After binder pp. 70-71 and Pozar Fig. 2.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.4,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[red!45,thin,dashed] (-0.3333,0) circle (0.6667);
\draw[red!45,thin,dashed] (-0.5000,0) circle (0.5000);
\draw[red!45,thin,dashed] (-0.6667,0) circle (0.3333);
\draw[red!30,thin,dashed] (-1,2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,-2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,-1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,0.5000) circle (0.5000);
\draw[red!30,thin,dashed] (-1,-0.5000) circle (0.5000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\draw[->,very thick,blue] (0.0000,0.0000) arc[start angle=180.00, end angle=118.07, radius=0.5000];
\draw[->,very thick,blue!60!cyan] (0.0000,0.0000) arc[start angle=180.00, end angle=241.93, radius=0.5000];
\draw[->,very thick,red] (0.0000,0.0000) arc[start angle=0.00, end angle=-61.93, radius=0.5000];
\draw[->,very thick,orange!90!black] (0.0000,0.0000) arc[start angle=0.00, end angle=61.93, radius=0.5000];
\draw[->,very thick,green!50!black] (0.3900,0.6755) arc[start angle=60.00, end angle=-48.00, radius=0.7800];
\fill[black] (0.0000,0.0000) circle (0.022); \node[font=\scriptsize,below=12pt,text=black,fill opacity=0.55] at (0.0000,0.0000) {match};
\fill[black] (-1.0000,0.0000) circle (0.022); \node[font=\scriptsize,left,text=black,fill opacity=0.55] at (-1.0000,0.0000) {short};
\fill[black] (1.0000,0.0000) circle (0.022); \node[font=\scriptsize,right,text=black,fill opacity=0.55] at (1.0000,0.0000) {open};
\node[text=blue,font=\scriptsize,align=left] at (0.5,0.68) {series $L$\\(up, on $r$ circle)};
\node[text=blue!60!cyan,font=\scriptsize,align=left] at (0.5,-0.68) {series $C$\\(down, on $r$ circle)};
\node[text=orange!90!black,font=\scriptsize,align=right] at (-0.5,0.68) {shunt $L$\\(up, on $g$ circle)};
\node[text=red,font=\scriptsize,align=right] at (-0.5,-0.68) {shunt $C$\\(down, on $g$ circle)};
\node[text=green!40!black,font=\scriptsize,align=left,anchor=west] at (1.08,0.55) {line of $Z_0$: rotate\\clockwise toward\\generator, $2\beta\ell$};
\node[font=\scriptsize] at (0,1.15) {upper half: inductive ($x>0$, $b<0$)};
\node[font=\scriptsize] at (0,-1.15) {lower half: capacitive ($x<0$, $b>0$)};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **The chart is the $\Gamma$ plane:** a point is both $\Gamma = \frac{z-1}{z+1}$ (polar) and $z$ (read off the grid). Centre = matched, left = short, right = open, top half inductive, bottom half capacitive.
> 2. **Every lossless move is a slide on one circle:** series $L$/$C$ along constant $r$, shunt $L$/$C$ along constant $g$, a line of $Z_0$ around the centre (clockwise toward the generator, $2\beta\ell$, one full turn per $\lambda/2$). Inductors move up, capacitors move down.
> 3. **Matching needs two knobs** (real and imaginary part): L-section = two reactances, single stub = position + length, double stub = two lengths, quarter-wave = $Z_1 = \sqrt{Z_0Z_L}$ + length.
> 4. **Max power is the conjugate match** $Z_{in} = Z_g^*$, giving $P = |V_g|^2/(8R_g)$; with a $Z_0$ source it is the same as $\Gamma = 0$.
> 5. **Bandwidth costs:** short paths near the centre are broadband; more sections buy bandwidth; Bode–Fano caps it for any network: $\Delta\omega\ln(1/\Gamma_m) \le \pi/RC$.

**Map:** [[#Physics background|why circles, why rotation]] → [[#Smith Chart|reading and moving]] → [[#Admittance Smith Chart|admittance and the ZY chart]] → [[#Conjugate Impedance Matching|what "matched" means]] → [[#L-Network Matching|lumped L-section]] → [[#Single-Stub Tuning|single stub]] → [[#Double-Stub Tuning|double stub]] → [[#Quarter-Wave Transformer|quarter-wave]] → [[#Multisection Transformers|binomial and Chebyshev]] → [[#Tapered Lines|tapers]] → [[#Bode–Fano Limit|Bode–Fano]] → [[#Termination Matching (SerDes and on-chip)|on-chip termination]] → [[#Choosing a Matching Network|which one to use]].

## Physics background

The chart rests on two transmission-line facts. Both are derived in [[Transmission Lines]]; here is what the chart does with them.

> [!tip] Remark
> $\Gamma_L = \frac{Z_L - Z_0}{Z_L + Z_0}$, $Z_{in} = Z_0\frac{Z_L + jZ_0\tan\beta\ell}{Z_0 + jZ_L\tan\beta\ell}$, $\text{SWR} = \frac{1+|\Gamma|}{1-|\Gamma|}$ and the standing-wave picture all live in [[Transmission Lines]]. The field physics under $Z_0$ and $\beta$ is in [[EM Foundations]].

**1. Impedance and reflection are one number in two coordinates.**

$$
\boxed{\Gamma = \frac{z-1}{z+1}, \qquad z = \frac{Z}{Z_0} = \frac{1+\Gamma}{1-\Gamma}, \qquad y = \frac{1}{z} = \frac{1-\Gamma}{1+\Gamma}}
$$

The map $z \mapsto \Gamma$ is a bilinear (Möbius) transform: it sends circles and lines to circles, and keeps right angles. So the lines $r$ = const and $x$ = const of the $z$ plane become two families of mutually orthogonal circles in the $\Gamma$ plane, and the whole passive half-plane $r \ge 0$ folds into the unit disk $|\Gamma| \le 1$.

**2. A lossless line only turns $\Gamma$.**

$$
\boxed{\Gamma(\ell) = \Gamma_L\,e^{-j2\beta\ell}}
$$

Walking a length $\ell$ toward the generator keeps $|\Gamma|$ and subtracts $2\beta\ell$ from its angle: a clockwise rotation. $\beta\ell = \pi$ ($\ell = \lambda/2$) is a full turn, so everything repeats every $\lambda/2$. $\ell = \lambda/4$ is a half turn, $\Gamma \to -\Gamma$, which is $z \to 1/z$: the [[#Quarter-Wave Transformer|quarter-wave transformer]] and the [[#Admittance Smith Chart|z-to-y flip]] are the same fact.

> [!tip] Remark
> Since $2\beta\ell = 2\omega\tau$ for a line of delay $\tau$, the rotation angle grows with frequency. Every point you reached through a line sweeps clockwise as $f$ rises, and a longer line sweeps faster. That is why short stubs and short lines give the wider bandwidth all through this note.

> [!note]- Derivation: the circle equations
> Write $\Gamma = u + jv$ and $z = r + jx$. Multiply $z = (1+\Gamma)/(1-\Gamma)$ by the conjugate of the denominator and split:
> $$r = \frac{1-u^2-v^2}{(1-u)^2+v^2}, \qquad x = \frac{2v}{(1-u)^2+v^2}$$
> Rearranging each:
> $$\left(u - \frac{r}{1+r}\right)^2 + v^2 = \left(\frac{1}{1+r}\right)^2, \qquad (u-1)^2 + \left(v - \frac1x\right)^2 = \left(\frac1x\right)^2$$
> Resistance circles: centre $(r/(1+r), 0)$, radius $1/(1+r)$. Reactance circles: centre $(1, 1/x)$, radius $1/|x|$. Every one passes through $\Gamma = 1$ (the open). The $r = 1$ circle has centre $0.5$ and radius $0.5$, so it passes through the centre of the chart.
> For admittance, $y = (1-\Gamma)/(1+\Gamma)$ is the same map with $\Gamma \to -\Gamma$:
> $$\left(u + \frac{g}{1+g}\right)^2 + v^2 = \left(\frac{1}{1+g}\right)^2, \qquad (u+1)^2 + \left(v + \frac1b\right)^2 = \left(\frac1b\right)^2$$
> Conductance and susceptance circles are the $r$ and $x$ circles rotated $180^\circ$ about the centre; all pass through $\Gamma = -1$ (the short).

> [!note]- Detail: lossy lines spiral inward
> With loss, $\Gamma(\ell) = \Gamma_L e^{-2\alpha\ell}e^{-j2\beta\ell}$: the point spirals toward the centre as you walk toward the generator. A long lossy cable "looks matched" from the input even with an open at the far end. That is a measurement trap (the load is hidden) and occasionally a tool (a lossy line as a broadband termination).

**3. Why a match needs two knobs and some loss of bandwidth.** A complex $Z_L$ has two unknowns, so a lossless network needs two independent elements to bring both $r \to 1$ and $x \to 0$. Any reactive element stores energy, so it is frequency-dependent: the match is perfect at one frequency and degrades away from it. The [[#Bode–Fano Limit|Bode–Fano limit]] turns this into a hard bound.

## Smith Chart

### Reading the chart

```tikz title="Reading the chart: a point is a reflection coefficient (polar) and an impedance (grid) at once. Resistance circles all touch the open-circuit point; reactance arcs too. After binder pp. 55-58 and Pozar Eq. (2.56)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.6,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[->,gray] (-1.15,0) -- (1.3,0) node[right,font=\scriptsize,text=black] {$\mathrm{Re}\,\Gamma$};
\draw[->,gray] (0,-1.15) -- (0,1.2) node[above,font=\scriptsize,text=black] {$\mathrm{Im}\,\Gamma$};
\draw[->,thick,purple] (0,0) -- (0.2000,0.4000);
\fill[purple] (0.2000,0.4000) circle (0.022); \node[font=\scriptsize,right=2pt,text=purple,fill opacity=0.55] at (0.2000,0.4000) {$z=1+j1$, $\Gamma=0.447\angle 63.4^\circ$};
\draw[dashed,purple] (0,0) circle (0.4472);
\node[font=\scriptsize,text=purple,anchor=north west] at (-0.95,-0.42) {constant $|\Gamma|$ = SWR circle};
\fill[black] (-1.0000,0.0000) circle (0.022); \node[font=\scriptsize,above left,text=black,fill opacity=0.55] at (-1.0000,0.0000) {$z=0$};
\fill[black] (1.0000,0.0000) circle (0.022); \node[font=\scriptsize,above right,text=black,fill opacity=0.55] at (1.0000,0.0000) {$z=\infty$};
\node[font=\scriptsize,anchor=west] at (-0.05,-0.12) {$\Gamma=0$};
\node[font=\scriptsize,align=left,anchor=west] at (1.2,-0.5) {$r$ circles: centre $\left(\frac{r}{1+r},0\right)$\\radius $\frac{1}{1+r}$\\[3pt]$x$ circles: centre $\left(1,\frac1x\right)$\\radius $\frac{1}{|x|}$};
\end{scope}
\end{circuitikz}
\end{document}
```

| Where | Meaning |
|---|---|
| Centre ($\Gamma = 0$) | $z = 1$: matched, SWR = 1 |
| Left edge ($\Gamma = -1$) | $z = 0$: short |
| Right edge ($\Gamma = +1$) | $z = \infty$: open |
| Outer circle ($\vert{}\Gamma\vert{} = 1$) | $r = 0$: pure reactance (stubs live here) |
| Upper / lower half | $x > 0$ inductive / $x < 0$ capacitive |
| Distance from centre | $\vert{}\Gamma\vert{}$; a circle about the centre is constant SWR |
| Real axis right of centre | $r = \text{SWR}$ (voltage maximum) |
| Real axis left of centre | $r = 1/\text{SWR}$ (voltage minimum) |

Read three numbers with one compass setting: $|\Gamma|$, SWR $= \frac{1+|\Gamma|}{1-|\Gamma|}$, and return loss $= -20\log|\Gamma|$. Paper charts carry scales for all three below the chart, plus angle and wavelength scales around the rim.

**Worked (binder p. 61, Example 1):** $\Gamma_L = 0.5\angle45^\circ$ on 50 Ω. Plot the vector, read the grid: $z_L = 1.35 + j1.35$, so $Z_L = 67.5 + j67.5$ Ω. **Reverse (binder p. 62):** $Z_L = 15 - j25$ Ω gives $z_L = 0.3 - j0.5$ and $\Gamma_L = 0.618\angle-124^\circ$.

### Moving along a line

$$
\boxed{\text{toward generator: clockwise by } 2\beta\ell = 720^\circ\,\ell/\lambda, \qquad \text{toward load: counter-clockwise}}
$$

```tikz title="Pozar Example 2.2: Z_L = 40 + j70 on a 100-ohm line, 0.3 lambda long. Plot z_L, then rotate 2 beta l = 216 degrees clockwise on the SWR circle. After Pozar Fig. 2.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.4,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[dashed,green!50!black] (0,0) circle (0.5890);
\draw[->,very thick,green!50!black] (-0.1429,0.5714) arc[start angle=104.04, end angle=-111.96, radius=0.5890];
\draw[->,thick] (0,0) -- (-0.1429,0.5714);
\fill[black] (-0.1429,0.5714) circle (0.022); \node[font=\scriptsize,above left,text=black,fill opacity=0.55] at (-0.1429,0.5714) {$z_L=0.4+j0.7$};
\fill[black] (-0.2203,-0.5463) circle (0.022); \node[font=\scriptsize,below left=1pt,text=black,fill opacity=0.55] at (-0.2203,-0.5463) {$z_{in}=0.365-j0.611$};
\node[font=\scriptsize,text=green!40!black,anchor=west] at (-1.0,-1.12) {$0.3\lambda$ toward generator $=216^\circ$ clockwise};
\node[font=\scriptsize,anchor=west] at (1.1,0.6) {$|\Gamma|=0.59$};
\node[font=\scriptsize,anchor=west] at (1.1,0.35) {SWR $=3.87$};
\end{scope}
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 2.2):** $Z_L = 40 + j70$ Ω on 100 Ω, $\ell = 0.3\lambda$.
1. $z_L = 0.4 + j0.7$; compass gives $|\Gamma| = 0.59$, SWR = 3.87, RL = 4.6 dB; angle $104^\circ$.
2. WTG scale at the load reads $0.106\lambda$. Add $0.3\lambda$: $0.406\lambda$.
3. Radial line at $0.406\lambda$ meets the SWR circle at $z_{in} = 0.365 - j0.611$, so $Z_{in} = 36.5 - j61.1$ Ω, $\Gamma_{in} = 0.59\angle248^\circ$.

**Worked by delay (binder p. 63):** $Z_L = 50 + j50$ Ω through a line of delay $\tau = 6.78$ ns at 50 MHz. Rotation $= 2\omega\tau = 244^\circ$, so $\Gamma_{in} = 0.445\angle(64^\circ - 244^\circ) = 0.445\angle180^\circ$ and $Z_{in} = 50(0.38) = 19$ Ω.

**Worked with a lumped load (binder p. 71):** 50 Ω in series with 8.6 nH at 880 MHz, behind 7.33 cm of 50 Ω line with $\epsilon_r = 2.5$. $x_L = \omega L/50 = 0.95$; $\lambda = c/(f\sqrt{\epsilon_r}) = 21.56$ cm (the slide prints 21.65), so $\ell = 0.34\lambda$. $z_L = 1 + j0.95$ sits at $0.161\lambda$ WTG; adding $0.34\lambda$ lands at $0.5\lambda$, on the real axis left of centre: $Z_{in} \approx 20$ Ω, purely resistive (my calculation; the slide stops at the chart point).

> [!tip] Remark
> Points on the real axis are where the line voltage is extreme: right of centre is a $V_{max}$ ($r = \text{SWR}$), left is a $V_{min}$ ($r = 1/\text{SWR}$). Rotating a complex load onto the real axis is how a [[#Quarter-Wave Transformer|quarter-wave]] can match a complex load.

### Admittance Smith Chart

Series elements add impedances; shunt elements add admittances. So a matching problem switches between the two. Two equivalent tools (binder pp. 64–69):

1. **One Z chart, flip:** $y$ is the point diametrically opposite $z$ (a $\lambda/4$ rotation). Then read the same grid as $g + jb$ and keep going.
2. **ZY chart:** the Z grid plus the same grid rotated $180^\circ$ (the $g$, $b$ circles), overlaid. One physical point; read $z$ on one grid, $y$ on the other. No flipping.

```tikz title="Impedance to admittance on a plain Z chart (Pozar Example 2.3): reflect through the centre (a lambda/4 line inverts z), then keep rotating with the grid read as y. After Pozar Fig. 2.12 and binder pp. 68-69."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.4,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[dashed,gray] (0,0) circle (0.4472);
\draw[->,thick,purple] (0.4000,0.2000) -- (-0.4000,-0.2000);
\draw[->,very thick,green!50!black] (-0.4000,-0.2000) arc[start angle=-153.43, end angle=-261.43, radius=0.4472];
\fill[black] (0.4000,0.2000) circle (0.022); \node[font=\scriptsize,above right,text=black,fill opacity=0.55] at (0.4000,0.2000) {$z_L=2+j1$};
\fill[black] (-0.4000,-0.2000) circle (0.022); \node[font=\scriptsize,below left,text=black,fill opacity=0.55] at (-0.4000,-0.2000) {$y_L=0.4-j0.2$};
\fill[black] (-0.0666,0.4422) circle (0.022); \node[font=\scriptsize,above left,text=black,fill opacity=0.55] at (-0.0666,0.4422) {$y_{in}=0.61+j0.66$};
\node[font=\scriptsize,text=purple] at (0.3,-0.1) {$\lambda/4$ flip};
\node[font=\scriptsize,text=green!40!black,anchor=west] at (-1.0,-1.12) {then $0.15\lambda$ clockwise, reading the grid as $y$};
\end{scope}
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 2.3):** $Z_L = 100 + j50$ Ω on 50 Ω, line $0.15\lambda$. $z_L = 2 + j1 \Rightarrow y_L = 0.4 - j0.2$ (opposite point; WTG $0.214\lambda$). Rotate $0.15\lambda$ to $0.364\lambda$: $y_{in} = 0.61 + j0.66$, $Y_{in} = 0.0122 + j0.0132$ S.

> [!important] Convention used in every matching diagram below
> All the matching charts in this note use the **ZY convention**: one point per physical state, the grey solid grid is $z$, the red dashed grid is $y$. Pozar's figures use the flip convention instead (admittances plotted as if they were impedances), so his "rotated $1+jx$ circle" is our plain $r = 1$ circle. Same design, mirrored picture.

### Element moves

| Add | Grid | Moves along | Direction |
|---|---|---|---|
| Series $L$ ($+jx$) | $z$ | constant $r$ | clockwise (up) |
| Series $C$ ($-jx$) | $z$ | constant $r$ | counter-clockwise (down) |
| Shunt $C$ ($+jb$) | $y$ | constant $g$ | clockwise (down) |
| Shunt $L$ ($-jb$) | $y$ | constant $g$ | counter-clockwise (up) |
| Series $R$ | $z$ | constant $x$ | toward the open |
| Shunt $R$ | $y$ | constant $b$ | toward the short |
| Line of $Z_0$, length $\ell$ | either | constant $\vert{}\Gamma\vert{}$ | clockwise by $2\beta\ell$ |

The one-line memory aid from the course *Smith Charts Guide*: **a capacitor moves you down through the middle of the chart, an inductor up, on both grids.** Positive $x$ is the top half; positive $b$ is the bottom half.

$$
\boxed{X>0:\ L = \frac{X}{\omega}, \quad X<0:\ C = \frac{-1}{\omega X}, \qquad B>0:\ C = \frac{B}{\omega}, \quad B<0:\ L = \frac{-1}{\omega B}}
$$

### Stubs on the chart

A stub is a line ending in a short or an open: its input sits on the rim.

$$
\boxed{\text{short: } Z_{in} = jZ_0\tan\beta\ell, \qquad \text{open: } Z_{in} = -jZ_0\cot\beta\ell}
$$

On the chart: start at the short ($z = 0$, left) or the open ($z = \infty$, right) and rotate clockwise along the rim to the reactance you need. An open and a short stub giving the same reactance differ by exactly $\lambda/4$. A short stub shorter than $\lambda/4$ is an inductor; an open stub shorter than $\lambda/4$ is a capacitor.

> [!warning] Sign warning: the course *Smith Charts Guide* convention
> The professor's guide writes $\Gamma(\ell) = \Gamma(0)e^{+j2k\ell}$, $Z_{in} = Z_0\frac{Z_L - jZ_0\tan k\ell}{Z_0 - jZ_L\tan k\ell}$, open stub $jZ_0\cot k\ell$ and short stub $-jZ_0\tan k\ell$. Its $\ell$ is a **signed coordinate** along $+z$ (negative on the generator side of the load), not a positive length. Use the Pozar / formula-sheet forms in this note ($e^{-j2\beta\ell}$, open $= -jZ_0\cot\beta\ell$, short $= jZ_0\tan\beta\ell$, toward generator = clockwise) and every answer comes out the same. The guide's own double-stub example ($Z_L = 100 + j50$ Ω, $\lambda/8$, open stubs: $\ell_1 = 0.0606\lambda$, $\ell_2 = 0.375\lambda$) checks out with the method below.

### Measuring an impedance

**Slotted line (Pozar Ex. 2.4).** Two measurements fix the two unknowns of $Z_L$: SWR and the distance $\ell_{min}$ from the load to the first voltage minimum.

$$
\boxed{|\Gamma| = \frac{\text{SWR}-1}{\text{SWR}+1}, \qquad \theta = \pi + 2\beta\ell_{min}}
$$

```tikz title="Measuring a load from its standing wave (Pozar Example 2.4): the voltage minimum is the real point left of centre at r = 1/SWR; walk back to the load counter-clockwise. After Pozar Fig. 2.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.4,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[dashed,gray] (0,0) circle (0.2000);
\draw[->,very thick,orange!80!black] (-0.2000,0.0000) arc[start angle=180.00, end angle=446.40, radius=0.2000];
\fill[black] (-0.2000,0.0000) circle (0.022); \node[font=\scriptsize,below left=1pt,text=black,fill opacity=0.55] at (-0.2000,0.0000) {$V_{min}$: $r=1/\mathrm{SWR}=0.67$};
\fill[black] (0.0126,0.1996) circle (0.022); \node[font=\scriptsize,right=3pt,text=black,fill opacity=0.55] at (0.0126,0.1996) {$z_L=0.95+j0.4$};
\node[font=\scriptsize,text=orange!70!black,anchor=west] at (-1.0,-1.12) {$\ell_{min}=0.37\lambda$ toward load (counter-clockwise)};
\end{scope}
\end{circuitikz}
\end{document}
```

A short at the load plane gives sharp minima 2 cm apart, so $\lambda = 4$ cm and the load can be referred to any short-circuit minimum. With the load: SWR = 1.5 and $\ell_{min} = 1.48$ cm $= 0.37\lambda$. On the chart, start at $r = 1/1.5$ on the left axis and rotate $0.37\lambda$ toward the load: $z_L = 0.95 + j0.4$, $Z_L = 47.5 + j20$ Ω. Minima beat maxima because they are sharper.

**VNA.** Today the slotted line is replaced by a vector network analyzer, which displays $S_{11}$ directly on a Smith chart. Shifting the reference plane by a line length is exactly a chart rotation (de-embedding a feed line = rotate counter-clockwise by its $2\beta\ell$).

> [!tip] Remark
> VNA calibration (SOL, TRL) and reference-plane shifts of S-parameters are owned by [[Microwave Network Analysis]]; on the chart they are the rotations of this section.

> [!example]- More Smith-chart drills (solved)
> In [[Exam Prep - Problems through Stability]]: 2.20 (SWR, $\Gamma_L$, $Y_L$, $Z_{in}$, $V_{min}$/$V_{max}$ positions for $60 + j50$ Ω), 2.21/2.22 (stub lengths for given reactances), 2.23 (slotted line), Midterm 2018 P3 (stub + line to hit a target $Z_{in}$).

## Impedance Matching

A lossless network between the line and the load so that the line sees $Z_0$ (Pozar Fig. 5.1, binder p. 73). Why bother:

- **Power:** maximum power reaches the load, and the feed line carries no standing wave (less loss, no voltage peaks).
- **Noise:** matching the antenna and LNA can improve the system SNR (noise matching is owned by [[RF Noise and Distortion]]).
- **Accuracy:** in a feed network (antenna array), matching cuts amplitude and phase errors.

Any $Z_L$ with $\mathrm{Re}\{Z_L\} > 0$ can be matched. Choose among networks by **complexity, bandwidth, implementation** (lumped, microstrip, coax, waveguide) and **adjustability**.

### Conjugate Impedance Matching

```tikz title="Generator and load both mismatched: the setting of Pozar Sec. 2.6. Conjugate matching sets Z_in = Z_g*, whatever the line does in between. After Pozar Fig. 2.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[sV, l=$V_g$] (0,2) to[generic, l=$Z_g$] (2.4,2) -- (3.2,2);
  \draw (0,0) -- (3.2,0);
  \draw[thick] (3.2,2) -- (7.2,2);
  \draw[thick] (3.2,0) -- (7.2,0);
  \node at (5.2,1) {$Z_0,\ \beta,\ \ell$};
  \draw (7.2,2) -- (8,2) to[generic, l=$Z_L$] (8,0) -- (7.2,0);
  \draw[->] (3.4,1.35) -- (4.3,1.35) node[right,font=\scriptsize] {$Z_{in}$};
  \draw[<-] (2.0,0.65) -- (2.9,0.65) node[right,font=\scriptsize] {$Z_g$};
  \node[font=\scriptsize,align=center] at (4,-0.75) {conjugate match: $Z_{in}=Z_g^*\ \Rightarrow\ P_L=\dfrac{|V_g|^2}{8R_g}$ (max available)};
\end{circuitikz}
\end{document}
```

With a fixed generator $Z_g = R_g + jX_g$ driving any line plus load that presents $Z_{in} = R_{in} + jX_{in}$:

$$
P_L = \frac12|V_g|^2\frac{R_{in}}{(R_{in}+R_g)^2 + (X_{in}+X_g)^2}
$$

| Case | Condition | Power to load |
|---|---|---|
| Load matched to line | $Z_L = Z_0$, $\Gamma = 0$ | $\frac12\vert{}V_g\vert{}^2\frac{Z_0}{(Z_0+R_g)^2+X_g^2}$ |
| Generator matched to loaded line | $Z_{in} = Z_g$ | $\frac12\vert{}V_g\vert{}^2\frac{R_g}{4(R_g^2+X_g^2)}$ |
| **Conjugate match** | $Z_{in} = Z_g^*$ | $\frac12\vert{}V_g\vert{}^2\frac{1}{4R_g}$ (the maximum) |

$$
\boxed{Z_{in} = Z_g^* \ \Rightarrow\ P_{max} = P_{avs} = \frac{|V_g|^2}{8R_g}\ \text{(peak phasor)} = \frac{V_{rms}^2}{4R_g}}
$$

- A conjugate match can leave **standing waves on the line** ($\Gamma \ne 0$): the multiple reflections add in phase at the load.
- If $X_g = 0$, the last two cases coincide: match to $R_g$.
- Neither matching gives good **efficiency**: with $Z_g = Z_L = Z_0$ only half the generated power reaches the load. Efficiency only improves by making $Z_g$ small, which is what power amplifiers do (they are load-pulled, not conjugate-matched; see [[RF Amplifier Design]]).

> [!note]- Derivation: why the conjugate
> Set $\partial P_L/\partial R_{in} = 0$ and $\partial P_L/\partial X_{in} = 0$:
> $$R_g^2 - R_{in}^2 + (X_{in}+X_g)^2 = 0, \qquad X_{in}(X_{in}+X_g) = 0$$
> The second gives $X_{in} = -X_g$ (the reactances resonate out). The first then gives $R_{in} = R_g$. So $Z_{in} = Z_g^*$, and substituting back gives $P = \frac12|V_g|^2/(4R_g)$, which is the available power of the source.

> [!tip] Remark
> In an amplifier both ports want a conjugate match at once (simultaneous conjugate match $\Gamma_{MS}$, $\Gamma_{ML}$), and the matching networks are designed with exactly the L-sections and stubs below. The gain bookkeeping ($G_T$, $G_A$, $G_P$) is owned by [[RF Amplifier Design]].

**Worked (binder, ECE 373 Stability–Cascading P1):** a device with $Z_{in} = 14.5 - j19.2$ Ω must see a source $Z_s = 35 + j10$ Ω conjugately, i.e. the network must turn $Z_{in}$ into $Y = 1/Z_s^* = 0.0264 + j0.0076$ S. $R_s > R_{in}$, so series element next to the device, shunt on the source side: **series 2.99 nH** ($Z_{in} \to 14.5 + j18.4$), then **shunt 3.27 pF** at 2 GHz. Full solution in [[Exam Prep - Problems through Stability]].

### L-Network Matching

Two reactive elements, eight possible circuits.

```tikz title="The two L-section topologies. (a) z_L inside the r = 1 circle (R_L > Z_0): shunt element at the load. (b) z_L outside it: series element at the load. Each box is an L or a C, so there are eight circuits in all. After Pozar Fig. 5.2 and binder p. 74."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw (0,2) node[ocirc]{} node[left]{$Z_0$} to[generic, l=$jX$] (2.2,2) -- (3.6,2) to[generic, l=$Z_L$] (3.6,0) -- (0,0) node[ocirc]{};
    \draw (2.2,2) to[generic, l_=$jB$] (2.2,0);
    \node at (1.8,-0.6) {(a) $R_L>Z_0$};
  \end{scope}
  \begin{scope}[xshift=5.6cm]
    \draw (0,2) node[ocirc]{} node[left]{$Z_0$} -- (1,2) to[generic, l=$jX$] (3.6,2) to[generic, l=$Z_L$] (3.6,0) -- (0,0) node[ocirc]{};
    \draw (1,2) to[generic, l_=$jB$] (1,0);
    \node at (1.8,-0.6) {(b) $R_L<Z_0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Which topology:**
- $z_L$ **inside** the $r = 1$ circle ($R_L > Z_0$): shunt element next to the load (a). A series element first would only slide along a circle that never meets $r = 1$.
- $z_L$ **outside** the $r = 1$ circle ($R_L < Z_0$): series element next to the load (b). (If also $g_L \le 1$, the shunt-first form works too.)

**Design procedure (Smith chart, ZY convention):**
1. Normalise $z_L = Z_L/Z_0$ and plot it.
2. If shunt-first: slide along the constant-$g$ circle through the load until you hit the $r = 1$ circle. Two hits (above and below) = two solutions. Read the $b$ change.
3. Then slide along $r = 1$ to the centre. Read the $x$ change.
4. (Series-first: slide along constant $r$ to the $g = 1$ circle, then along $g = 1$ to the centre.)
5. Convert $B$, $X$ to $L$, $C$ at $f_0$ with the boxed formulas above.

```tikz title="Pozar Example 5.1 on a ZY chart: Z_L = 200 - j100 to 100 ohm. z_L sits inside the r = 1 circle, so the shunt element goes next to the load: slide on g = 0.4 until you hit r = 1, then slide on r = 1 to the centre. After Pozar Fig. 5.3a and binder p. 75."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.5,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[red!45,thin,dashed] (-0.3333,0) circle (0.6667);
\draw[red!45,thin,dashed] (-0.5000,0) circle (0.5000);
\draw[red!45,thin,dashed] (-0.6667,0) circle (0.3333);
\draw[red!30,thin,dashed] (-1,2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,-2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,-1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,0.5000) circle (0.5000);
\draw[red!30,thin,dashed] (-1,-0.5000) circle (0.5000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[->,very thick,red] (0.4000,-0.2000) arc[start angle=-16.26, end angle=-38.58, radius=0.7143];
\draw[->,very thick,blue] (0.2727,-0.4454) arc[start angle=-117.04, end angle=-180.00, radius=0.5000];
\draw[->,very thick,orange!90!black,dashed] (0.4000,-0.2000) arc[start angle=-16.26, end angle=38.58, radius=0.7143];
\draw[->,very thick,blue!60!cyan,dashed] (0.2727,0.4454) arc[start angle=117.04, end angle=180.00, radius=0.5000];
\fill[black] (0.4000,-0.2000) circle (0.022); \node[font=\scriptsize,below right,text=black,fill opacity=0.55] at (0.4000,-0.2000) {$z_L=2-j1$ ($y_L=0.4+j0.2$)};
\fill[black] (0.2727,-0.4454) circle (0.022); \node[font=\scriptsize,below left,text=black,fill opacity=0.55] at (0.2727,-0.4454) {$z=1-j1.22$};
\fill[black] (0.2727,0.4454) circle (0.022); \node[font=\scriptsize,above left,text=black,fill opacity=0.55] at (0.2727,0.4454) {$z=1+j1.22$};
\node[font=\scriptsize,align=left,anchor=west] at (1.1,0.75) {Sol.\ 1 (solid):\\ \textcolor{red}{shunt $C$, $b=+0.29$}\\ \textcolor{blue}{series $L$, $x=+1.22$}};
\node[font=\scriptsize,align=left,anchor=west] at (1.1,-0.55) {Sol.\ 2 (dashed):\\ \textcolor{orange!90!black}{shunt $L$, $b=-0.69$}\\ \textcolor{blue!60!cyan}{series $C$, $x=-1.22$}};
\end{scope}
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 5.1, binder pp. 75–76):** $Z_L = 200 - j100$ Ω (series RC) to 100 Ω at 500 MHz. $z_L = 2 - j1$ is inside $r = 1$; $y_L = 0.4 + j0.2$.

| | Shunt (at load) | Series (at line) | Shape |
|---|---|---|---|
| Sol. 1 | $b = +0.29$: **C = 0.92 pF** | $x = +1.22$: **L = 38.8 nH** | low-pass |
| Sol. 2 | $b = -0.69$: **L = 46.1 nH** | $x = -1.22$: **C = 2.61 pF** | high-pass |

Both give $\Gamma = 0$ at 500 MHz and, for this load, a similar bandwidth (Pozar Fig. 5.3c).

**Real-to-real L-section, and its Q.** Matching a resistor $R_{lo}$ to $R_{hi}$ with no load reactance, (5.6) with $X_L = 0$ gives

$$
\boxed{Q = \frac{|X_{series}|}{R_{lo}} = R_{hi}|B_{shunt}| = \sqrt{\frac{R_{hi}}{R_{lo}} - 1}}
$$

The transformation ratio fixes the Q, and Q fixes the bandwidth (roughly $f_0/Q$). A big ratio in one L-section is narrowband; split it into several L-sections through intermediate resistances for more bandwidth.

**Worked (ECE 373 practice midterm Q1(c)):** match 100 Ω to 50 Ω at 1 GHz. $Q = \sqrt{2 - 1} = 1$, so $|X| = 50$ Ω on the 50 Ω side and $|B| = 1/100$ S on the 100 Ω side: series 7.96 nH + shunt 1.59 pF, or series 3.18 pF + shunt 15.9 nH.

> [!note]- Derivation: L-section element values (Pozar Eqs. 5.1–5.6)
> **Case (a), $R_L > Z_0$.** Require $Z_0 = jX + \frac{1}{jB + 1/(R_L+jX_L)}$. Real and imaginary parts:
> $$B(XR_L - X_LZ_0) = R_L - Z_0, \qquad X(1 - BX_L) = BZ_0R_L - X_L$$
> Eliminating $X$ gives a quadratic in $B$:
> $$B = \frac{X_L \pm \sqrt{R_L/Z_0}\sqrt{R_L^2 + X_L^2 - Z_0R_L}}{R_L^2+X_L^2}, \qquad X = \frac1B + \frac{X_LZ_0}{R_L} - \frac{Z_0}{BR_L}$$
> $R_L > Z_0$ keeps the square root real.
> **Case (b), $R_L < Z_0$.** Require $\frac{1}{Z_0} = jB + \frac{1}{R_L + j(X+X_L)}$:
> $$BZ_0(X+X_L) = Z_0 - R_L, \qquad X + X_L = BZ_0R_L$$
> $$X = \pm\sqrt{R_L(Z_0-R_L)} - X_L, \qquad B = \pm\frac{\sqrt{(Z_0-R_L)/R_L}}{Z_0}$$
> Two signs, two solutions in each case. Positive $X$ is an inductor, negative a capacitor; positive $B$ a capacitor, negative an inductor.

> [!note]- Detail: when lumped elements are real (Pozar Sec. 5.1 Point of Interest)
> Lumped L and C work when the part is shorter than about $\lambda/10$: discrete parts up to roughly 1 GHz, MMIC parts up to 60 GHz or more. Ranges quoted by Pozar: spiral inductors up to about 10 nH (bigger ones bring loss and shunt capacitance, so self-resonance caps the frequency); a short stub gives 0–0.1 pF shunt; a gap or interdigital gap up to about 0.5 pF series; MIM capacitors up to about 25 pF. Parasitics, loss and self-resonance must come from a CAD model.

> [!tip] Remark
> The Q, self-resonance and layout of on-chip spirals and MIM/MOM capacitors are owned by [[Inductor]] and [[Capacitor]]. An L-section element's own Q adds loss in series with the match.

> [!example]- More L-section problems (solved)
> In [[Exam Prep - Problems through Stability]]: 5.1 (two loads at 3 GHz, all four solutions), 5.25 (series RL load at 2 GHz, low-pass vs high-pass), PS3 Q1 (L-section vs stubs bandwidth).

### Single-Stub Tuning

Two knobs: the distance $d$ from the load and the stub length $\ell$. No lumped parts, so it is printed with the line.

```tikz title="Single-stub tuners. (a) Shunt stub: pick d so that Re{y} = 1 at the stub, then the stub cancels b. (b) Series stub: pick d so that Re{z} = 1, then the stub cancels x. After Pozar Fig. 5.4 and binder p. 77."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[thick] (0,2) -- (5,2); \draw[thick] (0,1.4) -- (5,1.4);
    \draw (5,2) -- (5.6,2) to[generic, l=$Y_L$] (5.6,1.4) -- (5,1.4);
    \draw[thick] (1.6,1.4) -- (1.6,-0.6); \draw[thick] (2.2,1.4) -- (2.2,-0.6);
    \draw[dashed] (1.6,-0.6) -- (2.2,-0.6);
    \node[font=\scriptsize,align=center] at (1.9,-1.05) {open or\\ short};
    \draw[<->] (2.5,1.3) -- (2.5,-0.6) node[midway,right,font=\scriptsize] {$\ell$};
    \draw[<->] (2.2,2.35) -- (5,2.35) node[midway,above,font=\scriptsize] {$d$};
    \draw[->] (2.3,1.7) -- (3.1,1.7) node[right,font=\scriptsize] {$y=1+jb$};
    \node[font=\scriptsize] at (0.7,1.7) {$Y_0$};
    \node at (2.6,-1.6) {(a) shunt stub};
  \end{scope}
  \begin{scope}[xshift=7.2cm]
    \draw[thick] (0,2) -- (5,2); \draw[thick] (0,1.4) -- (1.6,1.4); \draw[thick] (2.2,1.4) -- (5,1.4);
    \draw (5,2) -- (5.6,2) to[generic, l=$Z_L$] (5.6,1.4) -- (5,1.4);
    \draw[thick] (1.6,1.4) -- (1.6,-0.6); \draw[thick] (2.2,1.4) -- (2.2,-0.6);
    \draw[dashed] (1.6,-0.6) -- (2.2,-0.6);
    \node[font=\scriptsize,align=center] at (1.9,-1.05) {open or\\ short};
    \draw[<->] (2.5,1.3) -- (2.5,-0.6) node[midway,right,font=\scriptsize] {$\ell$};
    \draw[<->] (2.2,2.35) -- (5,2.35) node[midway,above,font=\scriptsize] {$d$};
    \draw[->] (2.3,1.7) -- (3.1,1.7) node[right,font=\scriptsize] {$z=1+jx$};
    \node[font=\scriptsize] at (0.7,1.7) {$Z_0$};
    \node at (2.6,-1.6) {(b) series stub};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Procedure (shunt stub):**
1. Plot $z_L$ (or $y_L$ on the ZY chart) and draw its SWR circle.
2. Rotate **toward the generator** until the circle crosses $g = 1$. Two crossings: $y = 1 \pm jb$. The rotation is $d$ (read the WTG scale).
3. The stub must add $\mp jb$. From the short ($y = \infty$, left edge) or the open ($y = 0$, right edge), rotate clockwise along the rim to $\mp jb$: that is $\ell$.
4. Series stub: same on the $z$ grid, crossing $r = 1$ and cancelling $x$.

```tikz title="Pozar Example 5.2, solution 1 (shunt short-circuited stub): Z_L = 60 - j80 to 50 ohm at 2 GHz. Rotate toward the generator to the g = 1 circle, then cancel b with the stub. After Pozar Fig. 5.5a and binder p. 78."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.5,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[red!45,thin,dashed] (-0.3333,0) circle (0.6667);
\draw[red!45,thin,dashed] (-0.5000,0) circle (0.5000);
\draw[red!45,thin,dashed] (-0.6667,0) circle (0.3333);
\draw[red!30,thin,dashed] (-1,2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,-2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,-1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,0.5000) circle (0.5000);
\draw[red!30,thin,dashed] (-1,-0.5000) circle (0.5000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[dashed,gray] (0,0) circle (0.5927);
\draw[->,very thick,green!50!black] (0.4054,-0.4324) arc[start angle=-46.85, end angle=-126.05, radius=0.5927];
\draw[->,very thick,orange!90!black] (-0.3488,-0.4793) arc[start angle=-72.49, end angle=0.00, radius=0.5000];
\draw[->,thick,violet] (-1.0000,0.0000) arc[start angle=180.00, end angle=111.60, radius=1.0000];
\fill[black] (0.4054,-0.4324) circle (0.022); \node[font=\scriptsize,below right,text=black,fill opacity=0.55] at (0.4054,-0.4324) {$z_L=1.2-j1.6$};
\fill[black] (-0.3488,-0.4793) circle (0.022); \node[font=\scriptsize,below left,text=black,fill opacity=0.55] at (-0.3488,-0.4793) {$y_1=1+j1.47$};
\fill[black] (-0.3681,0.9298) circle (0.022); \node[font=\scriptsize,above left,text=black,fill opacity=0.55] at (-0.3681,0.9298) {stub: $b=-1.47$};
\node[font=\scriptsize,align=left,anchor=west] at (1.1,0.75) {\textcolor{green!40!black}{1. line $d=0.110\lambda$}\\ \textcolor{green!40!black}{\ \ \ to the $g=1$ circle}\\ \textcolor{orange!90!black}{2. shunt stub $-j1.47$}\\ \textcolor{orange!90!black}{\ \ \ along $g=1$ to centre}\\ \textcolor{violet}{stub length: from short}\\ \textcolor{violet}{\ \ \ ($y=\infty$) $0.095\lambda$ clockwise}};
\end{scope}
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 5.2, binder pp. 78–79):** $Z_L = 60 - j80$ Ω (60 Ω + 0.995 pF) to 50 Ω at 2 GHz, shorted shunt stubs. $z_L = 1.2 - j1.6$, $y_L = 0.3 + j0.4$ (WTG $0.065\lambda$).

| | $d$ | $y$ at stub | stub needs | short $\ell$ |
|---|---|---|---|---|
| Sol. 1 | $0.176 - 0.065 = 0.110\lambda$ | $1 + j1.47$ | $-j1.47$ | **0.095λ** |
| Sol. 2 | $0.325 - 0.065 = 0.260\lambda$ | $1 - j1.47$ | $+j1.47$ | **0.405λ** |

Sol. 1 has the much wider bandwidth because both $d$ and $\ell$ are shorter (Pozar Fig. 5.5c). In my sweep of the two circuits, $|\Gamma| \le 0.2$ holds over about 20 % for Sol. 1 against 6 % for Sol. 2.

```tikz title="Pozar Example 5.3, solution 1 (series open stub): Z_L = 100 + j80 to 50 ohm. Same idea on the Z grid: rotate to r = 1, cancel x in series. After Pozar Fig. 5.6a."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.5,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[dashed,gray] (0,0) circle (0.5549);
\draw[->,very thick,green!50!black] (0.4810,0.2768) arc[start angle=29.92, end angle=-56.48, radius=0.5549];
\draw[->,very thick,blue] (0.3065,-0.4626) arc[start angle=-112.70, end angle=-180.00, radius=0.5000];
\draw[->,thick,violet] (1.0000,0.0000) arc[start angle=0.00, end angle=-285.84, radius=1.0000];
\fill[black] (0.4810,0.2768) circle (0.022); \node[font=\scriptsize,above right,text=black,fill opacity=0.55] at (0.4810,0.2768) {$z_L=2+j1.6$};
\fill[black] (0.3065,-0.4626) circle (0.022); \node[font=\scriptsize,below left,text=black,fill opacity=0.55] at (0.3065,-0.4626) {$z_1=1-j1.33$};
\fill[black] (0.2730,0.9620) circle (0.022); \node[font=\scriptsize,above left,text=black,fill opacity=0.55] at (0.2730,0.9620) {stub: $x=+1.33$};
\node[font=\scriptsize,align=left,anchor=west] at (1.1,-0.4) {\textcolor{green!40!black}{1. line $d=0.120\lambda$}\\ \textcolor{blue}{2. series stub $+j1.33$}\\ \textcolor{violet}{open stub: from $z=\infty$}\\ \textcolor{violet}{\ \ \ $0.397\lambda$ clockwise}};
\end{scope}
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 5.3):** $Z_L = 100 + j80$ Ω (100 Ω + 6.37 nH) to 50 Ω, series open stub. $z_L = 2 + j1.6$ (WTG $0.208\lambda$). Sol. 1: $d = 0.120\lambda$, $z = 1 - j1.33$, open stub for $+j1.33$: $\ell = 0.397\lambda$. Sol. 2: $d = 0.463\lambda$, $z = 1 + j1.33$, $\ell = 0.103\lambda$.

**Practical rules:**
- Keep the stub as close to the load as possible: better bandwidth and less loss from the high SWR on the stretch between them.
- **Microstrip / stripline:** shunt stubs, and open ones (no via to ground). **Slotline / CPW:** series stubs. **Coax / waveguide:** short stubs, because an open end can radiate and stop being purely reactive.
- Lengths beyond $\lambda/2$ add nothing; subtract $n\lambda/2$.

> [!note]- Derivation: closed-form $d$ and $\ell$ (Pozar Eqs. 5.7–5.16)
> **Shunt stub.** With $t = \tan\beta d$, the admittance $Y = G + jB$ at distance $d$ has
> $$G = \frac{R_L(1+t^2)}{R_L^2 + (X_L + Z_0t)^2}, \qquad B = \frac{R_L^2t - (Z_0 - X_Lt)(X_L + Z_0t)}{Z_0\left[R_L^2 + (X_L+Z_0t)^2\right]}$$
> Setting $G = 1/Z_0$:
> $$t = \frac{X_L \pm \sqrt{R_L\left[(Z_0-R_L)^2 + X_L^2\right]/Z_0}}{R_L - Z_0}\quad (R_L \ne Z_0), \qquad t = -\frac{X_L}{2Z_0}\quad(R_L = Z_0)$$
> $$\frac d\lambda = \frac{1}{2\pi}\tan^{-1}t\ (t \ge 0), \qquad \frac{1}{2\pi}(\pi + \tan^{-1}t)\ (t < 0)$$
> Stub susceptance $B_s = -B$:
> $$\frac{\ell_{open}}{\lambda} = \frac{1}{2\pi}\tan^{-1}\frac{B_s}{Y_0}, \qquad \frac{\ell_{short}}{\lambda} = \frac{-1}{2\pi}\tan^{-1}\frac{Y_0}{B_s}$$
> (add $\lambda/2$ if negative).
> **Series stub.** The dual: swap $R_L, X_L, Z_0 \to G_L, B_L, Y_0$ to find $t$, set $R = Z_0$, and the stub reactance $X_s = -X$:
> $$\frac{\ell_{short}}{\lambda} = \frac{1}{2\pi}\tan^{-1}\frac{X_s}{Z_0}, \qquad \frac{\ell_{open}}{\lambda} = \frac{-1}{2\pi}\tan^{-1}\frac{Z_0}{X_s}$$

> [!example]- More stub problems (solved)
> In [[Exam Prep - Problems through Stability]]: 5.3/5.4 (shunt stubs, open and short), 5.5/5.6 (series stubs; Pozar's key lists the open-stub lengths under 5.6), 5.7 (match with a line section alone), practice midterm Q1(b) (source $50 - j50$ Ω to a 100 Ω device), PS3 Q2 (three line/stub architectures).

### Double-Stub Tuning

Two stubs at **fixed** positions, only their lengths vary. This is what an adjustable coaxial tuner is. The price: some loads cannot be matched.

**Procedure (load at stub 1, spacing $d$):**
1. Draw the $g = 1$ circle **rotated by $d$ toward the load** (counter-clockwise by $2\beta d$).
2. Stub 1 slides $y_L$ along its constant-$g$ circle onto that rotated circle ($b_1$; two solutions).
3. The line $d$ rotates that point clockwise onto the true $g = 1$ circle.
4. Stub 2 cancels the leftover $b$ ($b_2$).

```tikz title="Pozar Example 5.4 (wider-band solution): double open-stub tuner, lambda/8 spacing, Z_L = 60 - j80 to 50 ohm. Stub 1 slides y_L on g = 0.3 to the g = 1 circle rotated back by lambda/8; the line rotates it onto g = 1; stub 2 cancels b. ZY convention (one point, two grids). After Pozar Figs. 5.8, 5.9a and binder pp. 80-81."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.5,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[red!45,thin,dashed] (-0.3333,0) circle (0.6667);
\draw[red!45,thin,dashed] (-0.5000,0) circle (0.5000);
\draw[red!45,thin,dashed] (-0.6667,0) circle (0.3333);
\draw[red!30,thin,dashed] (-1,2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,-2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,-1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,0.5000) circle (0.5000);
\draw[red!30,thin,dashed] (-1,-0.5000) circle (0.5000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\fill[gray!35,opacity=0.8] (-0.6667,0) circle (0.3333);
\node[font=\tiny,align=center] at (-0.6667,0) {forbidden\\$g>2$};
\draw[very thick,dashed,teal] (0,-0.5) circle (0.5);
\node[font=\scriptsize,text=teal,anchor=west] at (0.45,-0.85) {$g=1$ circle rotated $\lambda/8$ toward load};
\draw[->,very thick,red] (0.4054,-0.4324) arc[start angle=-34.21, end angle=-24.81, radius=0.7692];
\draw[->,very thick,green!50!black] (0.4674,-0.3228) arc[start angle=-34.63, end angle=-124.63, radius=0.5681];
\draw[->,very thick,orange!90!black] (-0.3228,-0.4674) arc[start angle=-69.24, end angle=0.00, radius=0.5000];
\fill[black] (0.4054,-0.4324) circle (0.022); \node[font=\scriptsize,below right=2pt,text=black,fill opacity=0.55] at (0.4054,-0.4324) {$y_L=0.3+j0.4$};
\fill[black] (0.4674,-0.3228) circle (0.022); \node[font=\scriptsize,right=2pt,text=black,fill opacity=0.55] at (0.4674,-0.3228) {$y_1=0.3+j0.286$};
\fill[black] (-0.3228,-0.4674) circle (0.022); \node[font=\scriptsize,below left=2pt,text=black,fill opacity=0.55] at (-0.3228,-0.4674) {$y_2=1+j1.38$};
\node[font=\scriptsize,align=left,anchor=west] at (1.1,0.75) {\textcolor{red}{1. stub 1: $b_1=-0.114$}\\ \textcolor{green!40!black}{2. $\lambda/8$ line}\\ \textcolor{orange!90!black}{3. stub 2: $b_2=-1.38$}};
\end{scope}
\end{circuitikz}
\end{document}
```

**Forbidden region.** If $y_L$ lies inside the constant-$g$ circle tangent to the rotated circle, no $b_1$ reaches it:

$$
\boxed{0 \le G_L \le \frac{Y_0}{\sin^2\beta d}} \qquad (\lambda/8 \text{ spacing: } g_L \le 2)
$$

Smaller $d$ shrinks the forbidden region, but the stubs must be physically separate and spacings near 0 or $\lambda/2$ are very frequency-sensitive. Use $d = \lambda/8$ or $3\lambda/8$. If the load can be moved along the line, it can always be rotated out of the forbidden region.

**Worked (Pozar Ex. 5.4, binder pp. 80–82):** $Z_L = 60 - j80$ Ω to 50 Ω, open stubs, $\lambda/8$ spacing, 2 GHz. $y_L = 0.3 + j0.4$ (allowed: $0.3 < 2$).

| | $b_1$ | $y$ at stub 2 | $b_2$ | $\ell_1$ | $\ell_2$ | $\vert{}\Gamma\vert{} \le 0.2$ band (my sweep) |
|---|---|---|---|---|---|---|
| Sol. 1 | $+1.314$ | $1 - j3.38$ | $+3.38$ | 0.146λ | 0.204λ | ≈ 2.4 % |
| Sol. 2 (drawn) | $-0.114$ | $1 + j1.38$ | $-1.38$ | 0.482λ | 0.350λ | ≈ 4.6 % |

> [!warning] Correction to Pozar's explanation
> Pozar says Sol. 1 is narrower "because both stubs ... are somewhat longer (and closer to $\lambda/2$)". Its stubs are in fact the *shorter* pair. The real cause is the path: Sol. 1 passes through $y = 1 - j3.38$, far out near the rim (a high-Q, high-SWR detour), and that point spins fastest with frequency. My sweep of both circuits confirms Sol. 1 is the narrower one, as his Fig. 5.9c shows.

> [!note]- Derivation: double-stub formulas (Pozar Eqs. 5.17–5.24)
> After stub 1, $Y_1 = G_L + j(B_L + B_1)$. Through the line ($t = \tan\beta d$):
> $$Y_2 = Y_0\frac{G_L + j(B_L + B_1 + Y_0t)}{Y_0 + jt(G_L + jB_L + jB_1)}$$
> $\mathrm{Re}\{Y_2\} = Y_0$ gives
> $$G_L^2 - G_LY_0\frac{1+t^2}{t^2} + \frac{(Y_0 - B_Lt - B_1t)^2}{t^2} = 0$$
> Real $G_L$ needs a non-negative discriminant, which is the forbidden-region bound $G_L \le Y_0(1+t^2)/t^2 = Y_0/\sin^2\beta d$. Then
> $$B_1 = -B_L + \frac{Y_0 \pm \sqrt{(1+t^2)G_LY_0 - G_L^2t^2}}{t}, \qquad B_2 = \frac{\pm Y_0\sqrt{Y_0G_L(1+t^2) - G_L^2t^2} + G_LY_0}{G_Lt}$$
> (matching signs), and the lengths follow from the stub formulas: $\ell_{open}/\lambda = \frac{1}{2\pi}\tan^{-1}(B/Y_0)$, $\ell_{short}/\lambda = \frac{-1}{2\pi}\tan^{-1}(Y_0/B)$.

> [!example]- More double-stub problems (solved)
> In [[Exam Prep - Problems through Stability]]: 5.9 (open, $\lambda/8$, $y_L = 0.4 + j1.2$), 5.10 (short, $3\lambda/8$), PS3 Q1 (double stub has the worst bandwidth of the three tuners there).

## Broadband Matching

Everything above is perfect at one frequency. This section trades length or complexity for bandwidth.

### Quarter-Wave Transformer

A $\lambda/4$ line of impedance $Z_1$ inverts the load about $Z_1$: $Z_{in} = Z_1^2/Z_L$.

$$
\boxed{Z_1 = \sqrt{Z_0Z_L}, \qquad \ell = \frac{\lambda_0}{4}\ (\text{or odd multiples})}
$$

```tikz title="Quarter-wave transformer on a chart normalised to the section impedance Z_1 = sqrt(Z_0 Z_L) (Pozar Example 5.5: 10 ohm to 50 ohm, Z_1 = 22.36 ohm). A lambda/4 line maps z to 1/z, so 0.447 lands on 2.236 = Z_0/Z_1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[->,very thick,green!50!black] (-0.3820,0.0000) arc[start angle=180.00, end angle=0.00, radius=0.3820];
\fill[black] (-0.3820,0.0000) circle (0.022); \node[font=\scriptsize,below left=3pt,text=black,fill opacity=0.55] at (-0.3820,0.0000) {$Z_L/Z_1=0.447$};
\fill[black] (0.3820,0.0000) circle (0.022); \node[font=\scriptsize,below right=3pt,text=black,fill opacity=0.55] at (0.3820,0.0000) {$Z_0/Z_1=2.236$};
\node[font=\scriptsize,text=green!40!black] at (0,0.55) {$\lambda/4$ = half turn};
\end{scope}
\end{circuitikz}
\end{document}
```

- Works for **real** loads only. A complex load is first made real by a length of line (rotate it to the real axis: $r = \text{SWR}$ or $1/$SWR) or by a series/shunt reactance. Both narrow the band.
- The feed line is flat (SWR = 1); the $\lambda/4$ section itself carries a standing wave.

**Bandwidth.** Exactly, with $\theta = \beta\ell = \frac{\pi}{2}\frac{f}{f_0}$ (TEM line):

$$
|\Gamma| = \frac{1}{\sqrt{1 + \left[4Z_0Z_L/(Z_L-Z_0)^2\right]\sec^2\theta}} \approx \frac{|Z_L - Z_0|}{2\sqrt{Z_0Z_L}}|\cos\theta| \ \ (\theta \approx \pi/2)
$$

$$
\boxed{\frac{\Delta f}{f_0} = 2 - \frac4\pi\cos^{-1}\left[\frac{\Gamma_m}{\sqrt{1-\Gamma_m^2}}\,\frac{2\sqrt{Z_0Z_L}}{|Z_L - Z_0|}\right]}
$$

```tikz title="Single quarter-wave section: |Gamma| versus f/f_0 for three load mismatches (exact Pozar Eq. 5.29). The null at f_0 repeats every 2f_0; a bigger mismatch gives a narrower band below any Gamma_m. After Pozar Fig. 5.12 and binder p. 86."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=3.2,yscale=3.6]
  \draw[->] (0,0) -- (2.15,0) node[right] {$f/f_0$};
  \draw[->] (0,0) -- (0,1.08) node[above] {$|\Gamma|$};
  \foreach \x in {0,0.5,1,1.5,2} \draw (\x,0) -- (\x,-0.03) node[below,font=\scriptsize] {\x};
  \foreach \y in {0.25,0.5,0.75,1} \draw (0,\y) -- (-0.03,\y) node[left,font=\scriptsize] {\y};
  \draw[thick,red,domain=0:2,samples=161] plot (\x,{abs(cos(90*\x))/sqrt(cos(90*\x)^2+0.4938)});
  \draw[thick,blue,domain=0:2,samples=161] plot (\x,{abs(cos(90*\x))/sqrt(cos(90*\x)^2+1.7778)});
  \draw[thick,green!50!black,domain=0:2,samples=161] plot (\x,{abs(cos(90*\x))/sqrt(cos(90*\x)^2+8)});
  \node[red,font=\scriptsize,anchor=west] at (0.05,0.88) {$Z_L/Z_0=10$ or $0.1$};
  \node[blue,font=\scriptsize,anchor=west] at (0.05,0.66) {$4$ or $0.25$};
  \node[green!40!black,font=\scriptsize,anchor=west] at (0.05,0.39) {$2$ or $0.5$};
  \draw[dashed] (0,0.2) -- (2.05,0.2) node[right,font=\scriptsize] {$\Gamma_m$};
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 5.5):** 10 Ω load to 50 Ω at 3 GHz, SWR ≤ 1.5. $Z_1 = \sqrt{500} = 22.36$ Ω. $\Gamma_m = (1.5-1)/(1.5+1) = 0.2$. $\Delta f/f_0 = 2 - \frac4\pi\cos^{-1}\left[\frac{0.2}{\sqrt{0.96}}\cdot\frac{2\sqrt{500}}{40}\right] = 0.29$ (**29 %**).

**Worked (Pozar Prob. 2.24, PS1):** 40 Ω to 75 Ω: $Z_1 = 54.8$ Ω. SWR is 1.28 at $0.75f_0$ and $1.25f_0$, 1.57 at $0.5f_0$ and $1.5f_0$, and $75/40 = 1.875$ at $2f_0$ (the section is $\lambda/2$ there and vanishes).

> [!note]- Derivation: the multiple-reflection view (Pozar Sec. 2.5)
> A wave hitting the $Z_0$–$Z_1$ junction first sees only $Z_1$: it reflects $\Gamma_1 = \frac{Z_1 - Z_0}{Z_1+Z_0}$ and transmits $T_1 = 1 + \Gamma_1$. The transmitted part travels $\lambda/4$, reflects off $R_L$ with $\Gamma_3 = \frac{R_L - Z_1}{R_L + Z_1}$, returns ($180^\circ$ round trip), and leaks out with $T_2 = 1 + \Gamma_2$, $\Gamma_2 = -\Gamma_1$. Summing the infinite bounce series:
> $$\Gamma = \Gamma_1 + T_1T_2\Gamma_3\sum_{n=0}^{\infty}(-1)^{n+1}\Gamma_2^n\Gamma_3^n = \frac{\Gamma_1 - \Gamma_3}{1 - \Gamma_1\Gamma_3}\ \text{(after simplifying)}$$
> whose numerator vanishes for $Z_1^2 = Z_0R_L$. The match is the bounces cancelling, not the absence of bounces.

> [!note]- Derivation: the bandwidth formula
> From $Z_{in} = Z_1\frac{Z_L + jZ_1t}{Z_1 + jZ_Lt}$ with $Z_1^2 = Z_0Z_L$:
> $$\Gamma = \frac{Z_L - Z_0}{Z_L + Z_0 + j2t\sqrt{Z_0Z_L}}$$
> Taking the magnitude and using $1 + t^2 = \sec^2\theta$ gives the exact $|\Gamma|$ above. Set $|\Gamma| = \Gamma_m$ and solve for the band edge $\theta_m$:
> $$\cos\theta_m = \frac{\Gamma_m}{\sqrt{1-\Gamma_m^2}}\frac{2\sqrt{Z_0Z_L}}{|Z_L - Z_0|}$$
> The response is symmetric about $\pi/2$, and $\theta \propto f$, so $\Delta f/f_0 = 2 - 4\theta_m/\pi$. This holds for TEM lines; in waveguide $\beta$ is not linear in $f$, and the step discontinuities add reactance (fix by trimming the length).

### Multisection Transformers

More $\lambda/4$ sections, each a small step, give a broader band. The design tool is the **theory of small reflections**: keep only the first reflection from each step.

$$
\boxed{\Gamma(\theta) \approx \Gamma_0 + \Gamma_1e^{-2j\theta} + \Gamma_2e^{-4j\theta} + \dots + \Gamma_Ne^{-2jN\theta}, \qquad \Gamma_n = \frac{Z_{n+1}-Z_n}{Z_{n+1}+Z_n}}
$$

With symmetric $\Gamma_n$ this is a finite Fourier cosine series in $\theta$: choose the $\Gamma_n$ to synthesise any passband shape. Two shapes matter.

```tikz title="Matching 100 ohm to 50 ohm three ways (Pozar Examples 5.6 and 5.7, small-reflection model): one lambda/4 section, a 3-section binomial (maximally flat) and a 3-section Chebyshev with Gamma_m = 0.05 (equal ripple). theta = beta l = 90 degrees at f_0. After Pozar Figs. 5.15 and 5.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=0.042,yscale=11]
  \draw[->] (0,0) -- (195,0) node[right] {$\theta$ (deg)};
  \draw[->] (0,0) -- (0,0.4) node[above] {$|\Gamma|$};
  \foreach \x in {0,45,90,135,180} \draw (\x,0) -- (\x,-0.008) node[below,font=\scriptsize] {\x};
  \foreach \y in {0.1,0.2,0.3} \draw (0,\y) -- (-3,\y) node[left,font=\scriptsize] {\y};
  \draw[thick,green!50!black,domain=0:180,samples=181] plot (\x,{abs(cos(\x))/sqrt(cos(\x)^2+8)});
  \draw[thick,blue,domain=0:180,samples=181] plot (\x,{0.3466*abs(cos(\x))^3});
  \draw[thick,red,domain=0:180,samples=361] plot (\x,{0.05*abs(4*(1.408*cos(\x))^3-3*1.408*cos(\x))});
  \draw[dashed] (0,0.05) -- (185,0.05) node[right,font=\scriptsize] {$\Gamma_m=0.05$};
  \draw[dotted] (44.7,0) -- (44.7,0.12); \draw[dotted] (135.3,0) -- (135.3,0.12);
  \node[font=\scriptsize,above] at (44.7,0.12) {$\theta_m$};
  \node[green!40!black,font=\scriptsize,anchor=west] at (185,0.33) {$N=1$};
  \node[blue,font=\scriptsize,anchor=west] at (185,0.25) {binomial $N=3$};
  \node[red,font=\scriptsize,anchor=west] at (185,0.29) {Chebyshev $N=3$};
\end{circuitikz}
\end{document}
```

| | Binomial (maximally flat) | Chebyshev (equal ripple) |
|---|---|---|
| Response | $\vert{}\Gamma\vert{} = 2^N\vert{}A\vert{}\vert{}\cos\theta\vert{}^N$ | $\vert{}\Gamma\vert{} = \Gamma_m\vert{}T_N(\sec\theta_m\cos\theta)\vert{}$ |
| Constant | $A = 2^{-N}\frac{Z_L - Z_0}{Z_L+Z_0} \approx 2^{-(N+1)}\ln\frac{Z_L}{Z_0}$ | $\sec\theta_m = \cosh\left[\frac1N\cosh^{-1}\left(\frac{\vert{}\ln(Z_L/Z_0)\vert{}}{2\Gamma_m}\right)\right]$ |
| Sections | $\ln\frac{Z_{n+1}}{Z_n} \approx 2^{-N}C_n^N\ln\frac{Z_L}{Z_0}$ | $\ln\frac{Z_{n+1}}{Z_n} \approx 2\Gamma_n$, $\Gamma_n$ from expanding $T_N$ |
| Bandwidth | $2 - \frac4\pi\cos^{-1}\left[\frac12\left(\frac{\Gamma_m}{\vert{}A\vert{}}\right)^{1/N}\right]$ | $2 - \frac{4\theta_m}{\pi}$ |
| Use when | flat, ripple-free passband | maximum bandwidth for $N$ |

**Worked (Pozar Ex. 5.6, binomial):** 50 Ω load, 100 Ω line, $N = 3$, $\Gamma_m = 0.05$. $A = -0.0433$; coefficients 1, 3, 3. $Z_1 = 91.7$, $Z_2 = 70.7$, $Z_3 = 54.5$ Ω (each $\lambda/4$, agreeing with the exact table to three digits). Bandwidth **70 %**.

**Worked (Pozar Ex. 5.7, Chebyshev):** 100 Ω load, 50 Ω line, $N = 3$, $\Gamma_m = 0.05$. $\sec\theta_m = 1.408$, $\theta_m = 44.7^\circ$. $\Gamma_0 = \Gamma_3 = 0.0698$, $\Gamma_1 = \Gamma_2 = 0.1037$. $Z_1 = 57.5$, $Z_2 = 70.7$, $Z_3 = 87.0$ Ω (exact: 57.37, 70.71, 87.15). Bandwidth **101 %**, against 70 % for the binomial with the same mismatch. The price is ripple up to $\Gamma_m$ in the band.

> [!tip] Remark
> These are the same two responses as Butterworth (maximally flat) and Chebyshev (equal ripple) filters in [[Filters]]: a multisection transformer is a bandpass filter in disguise, which is how [[Microwave Filters]] uses them.

> [!note]- Derivation: small reflections and the binomial design
> For one section between $Z_1$ (feed) and $Z_L$ through $Z_2$, summing bounces exactly gives $\Gamma = \frac{\Gamma_1 + \Gamma_3e^{-2j\theta}}{1 + \Gamma_1\Gamma_3e^{-2j\theta}}$. If the steps are small, $|\Gamma_1\Gamma_3| \ll 1$ and $\Gamma \approx \Gamma_1 + \Gamma_3e^{-2j\theta}$: first reflection from each step, delayed by the round trip. (Pozar Prob. 5.14: the error is 4 % in a worst case with $\Gamma_1 = \Gamma_3 = 0.2$.)
> Chaining $N$ sections with monotonic $Z_n$ and real $Z_L$ gives the boxed sum. If $\Gamma_0 = \Gamma_N$, $\Gamma_1 = \Gamma_{N-1}$, ..., pair the terms:
> $$\Gamma(\theta) = 2e^{-jN\theta}\left[\Gamma_0\cos N\theta + \Gamma_1\cos(N-2)\theta + \dots\right]$$
> **Binomial:** demand $N-1$ zero derivatives of $|\Gamma|$ at $\theta = \pi/2$ with $\Gamma(\theta) = A(1 + e^{-2j\theta})^N$, so $|\Gamma| = 2^N|A||\cos\theta|^N$. At $f = 0$ all sections vanish, $\Gamma(0) = 2^NA = \frac{Z_L - Z_0}{Z_L+Z_0}$, fixing $A$. Expanding binomially, $\Gamma_n = AC_n^N$ with $C_n^N = \frac{N!}{(N-n)!\,n!}$. Using $\Gamma_n \approx \frac12\ln\frac{Z_{n+1}}{Z_n}$ (valid for small steps) gives the section formula, and it lands exactly on $Z_L$ at the end. Band edge: $\Gamma_m = 2^N|A|\cos^N\theta_m$.
> **Chebyshev:** set $\Gamma(\theta) = Ae^{-jN\theta}T_N(\sec\theta_m\cos\theta)$, where $T_N(x) = \cos(N\cos^{-1}x)$ ripples between $\pm1$ for $|x| \le 1$ (mapped to the passband $\theta_m < \theta < \pi - \theta_m$) and grows as $\cosh(N\cosh^{-1}x)$ outside. $T_1 = x$, $T_2 = 2x^2-1$, $T_3 = 4x^3 - 3x$, $T_4 = 8x^4 - 8x^2 + 1$, $T_n = 2xT_{n-1} - T_{n-2}$. At $\theta = 0$: $\frac{Z_L - Z_0}{Z_L + Z_0} = AT_N(\sec\theta_m)$ and $\Gamma_m = |A|$, which gives $\sec\theta_m$. Expand $T_N(\sec\theta_m\cos\theta)$ in $\cos n\theta$ and match coefficients for $\Gamma_n$.

> [!tip] Remark
> Pozar's Tables 5.1 and 5.2 give exact section impedances (multiple reflections included) for $N$ up to 6 (binomial) and 4 (Chebyshev). For $Z_L < Z_0$ use the table for $Z_0/Z_L$ and start $Z_1$ at the load end: the transformer works in either direction.

### Tapered Lines

Let $N \to \infty$: a continuous taper $Z(z)$ of length $L$. Each slice reflects $d\Gamma = \frac12\frac{d}{dz}\ln\frac{Z}{Z_0}dz$, and the slices add with their phase delay:

$$
\boxed{\Gamma(\theta) = \frac12\int_0^L e^{-2j\beta z}\frac{d}{dz}\ln\frac{Z}{Z_0}\,dz}
$$

$\Gamma$ is the Fourier transform of the taper's log-slope. Pick a slope, get a response:

| Taper | $Z(z)$ | $\vert{}\Gamma\vert{}$ | First null |
|---|---|---|---|
| Exponential | $Z_0e^{az}$, $a = \frac1L\ln\frac{Z_L}{Z_0}$ | $\frac12\ln\frac{Z_L}{Z_0}\left\vert{}\frac{\sin\beta L}{\beta L}\right\vert{}$ | $\beta L = \pi$ |
| Triangular (in $d\ln Z/dz$) | piecewise exponential-quadratic | $\frac12\ln\frac{Z_L}{Z_0}\left(\frac{\sin(\beta L/2)}{\beta L/2}\right)^2$ | $\beta L = 2\pi$, lower sidelobes |
| Klopfenstein | from Chebyshev in the limit | $\Gamma_0\frac{\cos\sqrt{(\beta L)^2 - A^2}}{\cosh A}$ | passband $\beta L \ge A$ |

$$
\boxed{\text{Klopfenstein: } \Gamma_m = \frac{\Gamma_0}{\cosh A}, \qquad \Gamma_0 = \frac{Z_L - Z_0}{Z_L+Z_0} \approx \frac12\ln\frac{Z_L}{Z_0}}
$$

```tikz title="Tapered lines from 100 ohm to 50 ohm (Pozar Example 5.8): |Gamma| versus electrical length beta L. Exponential (sinc), triangular (sinc squared) and Klopfenstein (Gamma_m = 0.02, equal ripple for beta L > A = 3.54). All high-pass: long enough is matched at every frequency above. After Pozar Fig. 5.21b and binder p. 88."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=0.42,yscale=11]
  \draw[->] (0,0) -- (19.6,0) node[right] {$\beta L$};
  \draw[->] (0,0) -- (0,0.4) node[above] {$|\Gamma|$};
  \foreach \k/\l in {3.1416/\pi,6.2832/2\pi,9.4248/3\pi,12.566/4\pi,15.708/5\pi,18.850/6\pi} \draw (\k,0) -- (\k,-0.008) node[below,font=\scriptsize] {$\l$};
  \foreach \y in {0.1,0.2,0.3} \draw (0,\y) -- (-0.3,\y) node[left,font=\scriptsize] {\y};
  \draw[thick,blue,domain=0.01:18.85,samples=300] plot (\x,{0.3466*abs(sin(\x r)/\x)});
  \draw[thick,green!50!black,domain=0.01:18.85,samples=300] plot (\x,{0.3466*(sin(\x/2 r)/(\x/2))^2});
  \draw[thick,red,domain=0:3.54,samples=60] plot (\x,{0.3466/17.29*cosh(sqrt(max(3.543^2-\x^2,0)))});
  \draw[thick,red,domain=3.545:18.85,samples=300] plot (\x,{0.3466/17.29*abs(cos(sqrt(\x^2-3.543^2) r))});
  \draw[dashed] (0,0.02) -- (19,0.02);
  \node[blue,font=\scriptsize,anchor=west] at (5,0.3) {exponential};
  \node[green!40!black,font=\scriptsize,anchor=west] at (5,0.26) {triangular};
  \node[red,font=\scriptsize,anchor=west] at (5,0.22) {Klopfenstein};
  \draw[dotted] (3.543,0) -- (3.543,0.12) node[above,font=\scriptsize] {$A$};
\end{circuitikz}
\end{document}
```

**Worked (Pozar Ex. 5.8):** 50 Ω load, 100 Ω line, $\Gamma_m = 0.02$. $\Gamma_0 = 0.346$, $A = \cosh^{-1}(0.346/0.02) = 3.543$, so the Klopfenstein taper is matched for $\beta L \ge 3.543 = 1.13\pi$: shorter than either the exponential or triangular taper for the same ripple. It is the optimum taper (shortest for a given $\Gamma_m$) and, like Chebyshev, has equal-ripple lobes. Its $Z(z)$ has small steps at both ends.

- A taper is a **high-pass** match: long enough ($\beta L > \pi$ or so) and it works at every higher frequency. Its cost is length.
- **Worked (Pozar Prob. 5.23):** exponential 100 Ω → 50 Ω, $|\Gamma| \le 0.05$ over 100 % bandwidth needs $L \approx 1.72\lambda_0$.

> [!note]- Detail: the Klopfenstein impedance profile
> $$\ln Z(z) = \frac12\ln Z_0Z_L + \frac{\Gamma_0}{\cosh A}A^2\phi\left(\frac{2z}{L}-1, A\right), \qquad \phi(x, A) = \int_0^x\frac{I_1\left(A\sqrt{1-y^2}\right)}{A\sqrt{1-y^2}}dy$$
> with $I_1$ the modified Bessel function; $\phi(0,A) = 0$, $\phi(x,0) = x/2$, $\phi(1,A) = (\cosh A - 1)/A^2$. Evaluate numerically. Below the passband ($\beta L < A$), the $\cos$ becomes $\cosh\sqrt{A^2 - (\beta L)^2}$.

## Limits

### Bode–Fano Limit

How good can **any** lossless match be over a band? For a load with stored energy, not perfect.

```tikz title="Bode-Fano for a parallel RC load: the area under ln(1/|Gamma|) is capped at pi/RC. The best use of that area is a brick: |Gamma| = Gamma_m inside the band, 1 outside, so Delta-omega ln(1/Gamma_m) <= pi/RC. After Pozar Figs. 5.22a and 5.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw (0,0) node[ocirc]{} -- (0.4,0); \draw (0,2) node[ocirc]{} -- (0.4,2);
    \draw (0.4,-0.3) rectangle (2.2,2.3); \node[align=center,font=\scriptsize] at (1.3,1) {lossless\\ matching\\ network};
    \draw (2.2,2) -- (3.4,2) to[C, l_=$C$] (3.4,0) -- (2.2,0);
    \draw (3.4,2) -- (4.4,2) to[R, l=$R$] (4.4,0) -- (3.4,0);
    \draw[->] (-0.1,1) -- (-0.8,1) node[left] {$\Gamma(\omega)$};
  \end{scope}
  \begin{scope}[xshift=7cm]
    \draw[->] (0,0) -- (5.2,0) node[right] {$\omega$};
    \draw[->] (0,0) -- (0,2.4) node[above] {$|\Gamma|$};
    \draw[very thick,blue] (0,2) -- (1.5,2) -- (1.5,0.5) -- (3.5,0.5) -- (3.5,2) -- (5,2);
    \fill[blue!15] (1.5,0.5) rectangle (3.5,2);
    \node[left,font=\scriptsize] at (0,2) {$1$};
    \node[left,font=\scriptsize] at (0,0.5) {$\Gamma_m$};
    \draw[<->] (1.5,-0.3) -- (3.5,-0.3) node[midway,below,font=\scriptsize] {$\Delta\omega$};
    \node[font=\scriptsize,align=center] at (2.5,1.25) {area $\propto$\\ $\Delta\omega\ln\frac{1}{\Gamma_m}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Load | Bode–Fano limit |
|---|---|
| Parallel RC | $\displaystyle\int_0^\infty\ln\frac{1}{\vert{}\Gamma(\omega)\vert{}}d\omega \le \frac{\pi}{RC}$ |
| Series RC | $\displaystyle\int_0^\infty\frac{1}{\omega^2}\ln\frac{1}{\vert{}\Gamma(\omega)\vert{}}d\omega \le \pi RC$ |
| Parallel RL | $\displaystyle\int_0^\infty\frac{1}{\omega^2}\ln\frac{1}{\vert{}\Gamma(\omega)\vert{}}d\omega \le \frac{\pi L}{R}$ |
| Series RL | $\displaystyle\int_0^\infty\ln\frac{1}{\vert{}\Gamma(\omega)\vert{}}d\omega \le \frac{\pi R}{L}$ |

For the ideal brick response ($\Gamma_m$ in band, 1 outside):

$$
\boxed{\Delta\omega\,\ln\frac{1}{\Gamma_m} \le \frac{\pi}{RC}\qquad\text{(parallel RC)}}
$$

- **Bandwidth and match trade:** for a fixed $RC$, wider $\Delta\omega$ forces a larger $\Gamma_m$.
- **No perfect broadband match:** $\Gamma_m = 0$ only at isolated frequencies ($\Delta\omega \to 0$).
- **High-Q loads are harder:** larger $R$ or $C$ shrinks the area.
- $\ln(1/|\Gamma|)$ is return loss in nepers, so the limit is a fixed area under the return-loss curve. Don't spend it out of band or below $\Gamma_m$ in band. The Chebyshev transformer is a good approximation of the brick.

> [!tip] Remark
> This is the matching version of a gain–bandwidth limit: the reactance is an energy store the network cannot remove, only resonate. The same parallel-RC limit sets how wide an LNA input or a SerDes receiver input can be matched; see [[RF Amplifier Design]] and below.

### Termination Matching (SerDes and on-chip)

A wireline transmitter or receiver terminates the channel in a resistor $R = Z_0$ (50 Ω single-ended, 100 Ω differential). Ideally $\Gamma = 0$ at all frequencies. The pad, ESD diodes and device capacitance put $C$ in parallel, so the termination is the **parallel-RC load** of Bode–Fano.

```tikz title="An on-chip 50-ohm termination with pad capacitance: the shunt C drags y along the g = 1 circle, so return loss falls with frequency. Illustrative numbers (C = 200 fF): |Gamma| = 0.1 at 3.2 GHz, 0.30 at 10 GHz."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,5.0000) circle (5.0000);
\draw[gray!55,thin] (1,-5.0000) circle (5.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[red!45,thin,dashed] (-0.3333,0) circle (0.6667);
\draw[red!45,thin,dashed] (-0.5000,0) circle (0.5000);
\draw[red!45,thin,dashed] (-0.6667,0) circle (0.3333);
\draw[red!30,thin,dashed] (-1,2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,-2.0000) circle (2.0000);
\draw[red!30,thin,dashed] (-1,1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,-1.0000) circle (1.0000);
\draw[red!30,thin,dashed] (-1,0.5000) circle (0.5000);
\draw[red!30,thin,dashed] (-1,-0.5000) circle (0.5000);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.6667,0) {0.2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (-0.3333,0) {0.5};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.0000,0) {1};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.3333,0) {2};
\node[font=\tiny,text=gray!80!black,above left,inner sep=1pt] at (0.6667,0) {5};
\node[font=\tiny,text=gray!80!black,above] at (-0.6000,0.8000) {$+j0.5$};
\node[font=\tiny,text=gray!80!black,below] at (-0.6000,-0.8000) {$-j0.5$};
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\node[font=\tiny,text=gray!80!black,above] at (0.6000,0.8000) {$+j2$};
\node[font=\tiny,text=gray!80!black,below] at (0.6000,-0.8000) {$-j2$};
\draw[thick,purple,dashed] (0,0) circle (0.1);
\node[font=\scriptsize,text=purple,anchor=west] at (1.08,-0.15) {$|\Gamma|=0.1$ (RL 20 dB) circle};
\draw[purple] (0.07,-0.07) -- (1.08,-0.15);
\draw[->,very thick,red] (0.0000,0.0000) arc[start angle=0.00, end angle=-64.28, radius=0.5000];
\fill[red] (-0.0241,-0.1533) circle (0.022); \node[font=\scriptsize,left,text=red,fill opacity=0.55] at (-0.0241,-0.1533) {5 GHz};
\fill[red] (-0.0898,-0.2859) circle (0.022); \node[font=\scriptsize,left,text=red,fill opacity=0.55] at (-0.0898,-0.2859) {10 GHz};
\fill[red] (-0.2830,-0.4505) circle (0.022); \node[font=\scriptsize,below left,text=red,fill opacity=0.55] at (-0.2830,-0.4505) {20 GHz};
\node[font=\scriptsize,align=left,anchor=west] at (1.08,0.6) {$50\ \Omega$ termination $\parallel$ 200 fF:\\ $y=1+j\omega CZ_0$ slides down\\ the $g=1$ circle as $f$ rises};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{y = 1 + j\omega CZ_0, \qquad |\Gamma| = \frac{\omega CZ_0}{\sqrt{4 + (\omega CZ_0)^2}}, \qquad \Delta f\,\ln\frac{1}{\Gamma_m} \le \frac{1}{2RC}}
$$

**Illustrative numbers** (my calculation, $Z_0 = R = 50$ Ω, $C = 200$ fF):
- Bare resistor: $|\Gamma| = 0.1$ (RL 20 dB) at 3.2 GHz; 0.30 (10.5 dB) at 10 GHz; 0.53 (5.5 dB) at 20 GHz.
- Bode–Fano ceiling: $1/(2RC) = 50$ GHz, so RL 20 dB ($\ln 10 = 2.30$) could in principle hold to about 21.7 GHz.
- The gap between 3.2 GHz and 21.7 GHz is what a lossless network (a series inductor, or the T-coil used in SerDes front ends) can recover. Halving $C$ doubles both numbers.

**The pin-capacitance budget.** Solving $|\Gamma|$ for $C$ at the Nyquist frequency $f_N$ gives the most total shunt capacitance (pad + ESD + driver or first-stage $C_{gg}$) a bare $Z_0$ termination tolerates. The common wireline spec $|S_{11}|,|S_{22}|<-7$ dB at $f_N$ is the special case $x=\omega_NCZ_0=1$:

$$
\boxed{C_{tot,max}=\frac{2|\Gamma|_{max}}{\omega_N Z_0\sqrt{1-|\Gamma|_{max}^2}},\qquad |S_{11}(f_N)|<-7\ \text{dB}\iff C_{tot}<\frac{1}{2\pi f_NZ_0}}
$$

| $f_N$ (NRZ rate / PAM4 rate) | 5 GHz (10 Gb/s / 20 Gb/s) | 14 GHz (28 / 56 Gb/s) | 28 GHz (56 / 112 Gb/s) |
|---|---|---|---|
| $C_{tot,max}$ per side, −7 dB, $Z_0=50$ Ω | 637 fF | 227 fF | 114 fF |

(Table: my calculation from the boxed condition. A −8 dB spec, $|\Gamma|=0.398$, tightens it to $\omega_NCZ_0\le0.87$.)

> [!note]- Derivation: why −7 dB is exactly $\omega_N CZ_0 = 1$
> Invert $|\Gamma|^2=x^2/(4+x^2)$: $x=2|\Gamma|/\sqrt{1-|\Gamma|^2}$, which is the general bound above. $-7$ dB is $|\Gamma|=10^{-7/20}=0.447$, $|\Gamma|^2=1/5$, so $x^2/(4+x^2)=1/5\Rightarrow x=1$. With 50 Ω, $C<1/(2\pi f_N\cdot50\ \Omega)$.

> [!tip] Remark
> Reflections from an imperfect termination become ISI and are seen on a TDR. That channel-side view is owned by [[Channels]]; the termination circuits by [[Transmitters]], [[Receivers]] and [[High-Speed Circuit Techniques]]. They link here for the match itself.

## Choosing a Matching Network

| Network | Knobs | Bandwidth | Build | Use when |
|---|---|---|---|---|
| L-section | $X$, $B$ | Set by $Q = \sqrt{R_{hi}/R_{lo}-1}$; widest of the narrowband ones | Lumped L, C | Below ~1 GHz discrete; on-chip / MMIC higher |
| Single stub | $d$, $\ell$ | Moderate; best with the shortest $d$, $\ell$ | Printed line | Microstrip (open shunt), CPW (series), coax (short) |
| Double stub | $\ell_1$, $\ell_2$ | Narrow, forbidden region | Fixed-position stubs | Adjustable tuners, load unknown in advance |
| Quarter-wave | $Z_1$ | 29 % for 10→50 Ω at SWR 1.5 | One line section | Real loads, moderate ratio |
| Multisection | $Z_1..Z_N$ | 70 % (binomial) to 101 % (Chebyshev), $N = 3$, 2:1 | $N\lambda/4$ of line | Wideband, room for length |
| Taper | $Z(z)$ | High-pass, unlimited above cutoff | $\gtrsim\lambda/2$ continuous | Widest band, length available |

**Rules of thumb:**
- **Stay near the centre.** The path's distance from the centre is its Q; detours near the rim (high SWR) are narrowband. Of two solutions, pick the one whose path is shorter and closer to the centre.
- **Short lines, short stubs** (the rotation is $2\omega\tau$).
- **Low-pass vs high-pass:** series L + shunt C passes DC and rolls off harmonics; series C + shunt L blocks DC and passes high frequencies. Pick by what must reach the device (bias, harmonics). A series C doubles as a DC block; a shunt L to ground shorts the DC bias.
- **ECE 373 PS3 Q1** (100 Ω to 50 Ω at 1 GHz, $|\Gamma| \le 0.1$): LC networks ≈ 29–30 %, single stubs ≈ 9–11 %, double stubs 1.6–8.8 %. Lumped wins because it has no electrical length to rotate.
- **Practice midterm Q1(d):** a stub needs no parts (no tolerance, self-resonance, ESR), is cheap and repeatable at high frequency; an LC network is far smaller at low frequency ($\lambda = 30$ cm at 1 GHz) and easy to retune.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| More sections $N$ (multisection) | Bandwidth at fixed $\Gamma_m$ | Length ($N\lambda/4$), loss, layout area |
| Chebyshev instead of binomial | Bandwidth (101 % vs 70 % for $N=3$, 2:1) | In-band ripple up to $\Gamma_m$ |
| Allow larger $\Gamma_m$ | Bandwidth (Bode–Fano: $\Delta\omega\propto 1/\ln(1/\Gamma_m)$) | Mismatch loss, worse return loss |
| Smaller transformation ratio $R_{hi}/R_{lo}$ | Lower Q, wider band | Needs an intermediate impedance (more stages) |
| Stub closer to load (smaller $d$, $\ell$) | Bandwidth, less loss on the high-SWR stretch | Fixed by geometry; one of the two solutions |
| Double-stub spacing toward 0 | Smaller forbidden region | Frequency sensitivity, stubs collide |
| Lumped instead of distributed | Bandwidth, size at low $f$ | Parasitics, self-resonance, element Q, tolerance |
| Longer taper | Lower cutoff, lower ripple | Length |
| Smaller load C (pads, ESD) | Termination bandwidth $\propto 1/RC$ | ESD robustness, device size |

## Cheat sheet

| Quantity | Equation |
|---|---|
| $\Gamma$ and $z$ | $\Gamma = \frac{z-1}{z+1}$, $z = \frac{1+\Gamma}{1-\Gamma}$, $y = \frac{1-\Gamma}{1+\Gamma}$ |
| $r$ circle | centre $\left(\frac{r}{1+r},0\right)$, radius $\frac{1}{1+r}$ |
| $x$ circle | centre $\left(1,\frac1x\right)$, radius $\frac{1}{\vert{}x\vert{}}$ |
| Line rotation | $\Gamma(\ell) = \Gamma_Le^{-j2\beta\ell}$: clockwise toward generator, $720^\circ$ per $\lambda$ of $\ell$ |
| SWR, RL | $\text{SWR} = \frac{1+\vert{}\Gamma\vert{}}{1-\vert{}\Gamma\vert{}}$, $RL = -20\log\vert{}\Gamma\vert{}$ |
| Slotted line | $\vert{}\Gamma\vert{} = \frac{\text{SWR}-1}{\text{SWR}+1}$, $\theta = \pi + 2\beta\ell_{min}$ |
| Element values | $X>0$: $L = X/\omega$; $X<0$: $C = -1/(\omega X)$; $B>0$: $C = B/\omega$; $B<0$: $L = -1/(\omega B)$ |
| Stubs | short $jZ_0\tan\beta\ell$, open $-jZ_0\cot\beta\ell$ |
| Conjugate match | $Z_{in} = Z_g^*$, $P_{max} = \frac{\vert{}V_g\vert{}^2}{8R_g}$ |
| L-section (a), $R_L > Z_0$ | $B = \frac{X_L\pm\sqrt{R_L/Z_0}\sqrt{R_L^2+X_L^2-Z_0R_L}}{R_L^2+X_L^2}$, $X = \frac1B + \frac{X_LZ_0}{R_L} - \frac{Z_0}{BR_L}$ |
| L-section (b), $R_L < Z_0$ | $X = \pm\sqrt{R_L(Z_0-R_L)} - X_L$, $B = \pm\frac{\sqrt{(Z_0-R_L)/R_L}}{Z_0}$ |
| L-section Q (real loads) | $Q = \sqrt{R_{hi}/R_{lo} - 1}$ |
| Double-stub range | $G_L \le Y_0/\sin^2\beta d$ |
| Quarter-wave | $Z_1 = \sqrt{Z_0Z_L}$ |
| Quarter-wave bandwidth | $\frac{\Delta f}{f_0} = 2 - \frac4\pi\cos^{-1}\left[\frac{\Gamma_m}{\sqrt{1-\Gamma_m^2}}\frac{2\sqrt{Z_0Z_L}}{\vert{}Z_L-Z_0\vert{}}\right]$ |
| Small reflections | $\Gamma(\theta) \approx \sum_n\Gamma_ne^{-2jn\theta}$ |
| Binomial | $A = 2^{-N}\frac{Z_L-Z_0}{Z_L+Z_0}$, $\ln\frac{Z_{n+1}}{Z_n} \approx 2^{-N}C_n^N\ln\frac{Z_L}{Z_0}$, $\frac{\Delta f}{f_0} = 2 - \frac4\pi\cos^{-1}\left[\frac12\left(\frac{\Gamma_m}{\vert{}A\vert{}}\right)^{1/N}\right]$ |
| Chebyshev | $\sec\theta_m = \cosh\left[\frac1N\cosh^{-1}\frac{\vert{}\ln(Z_L/Z_0)\vert{}}{2\Gamma_m}\right]$, $\frac{\Delta f}{f_0} = 2 - \frac{4\theta_m}{\pi}$ |
| Taper | $\Gamma = \frac12\int_0^Le^{-2j\beta z}\frac{d}{dz}\ln\frac{Z}{Z_0}dz$; exponential $\frac12\ln\frac{Z_L}{Z_0}\left\vert{}\frac{\sin\beta L}{\beta L}\right\vert{}$ |
| Klopfenstein | $\Gamma_m = \Gamma_0/\cosh A$, passband $\beta L \ge A$ |
| Bode–Fano (parallel RC) | $\Delta\omega\ln\frac{1}{\Gamma_m} \le \frac{\pi}{RC}$ |
| Termination with pad C | $\vert{}\Gamma\vert{} = \frac{\omega CZ_0}{\sqrt{4+(\omega CZ_0)^2}}$ |
| Pin-capacitance budget | $C_{tot,max}=\frac{2\vert{}\Gamma\vert{}_{max}}{\omega_NZ_0\sqrt{1-\vert{}\Gamma\vert{}_{max}^2}}$; −7 dB at $f_N$ $\iff C_{tot}<\frac{1}{2\pi f_NZ_0}$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20)
  - §2.4 The Smith Chart, pp. 63–71: circle equations (2.54–2.57), combined ZY chart (Fig. 2.12), Examples 2.2 and 2.3, slotted line and Example 2.4.
  - §2.5 The Quarter-Wave Transformer, pp. 72–75: impedance view, Example 2.5, multiple-reflection view.
  - §2.6 Generator and Load Mismatches, pp. 76–78: three cases, conjugate matching, efficiency.
  - §2.7, p. 81: lossy terminated line ($e^{-2\alpha\ell}$ spiral).
  - Ch. 5 Impedance Matching and Tuning, pp. 228–269: §5.1 L networks (Eqs. 5.1–5.6, Example 5.1, Point of Interest on lumped elements), §5.2 single-stub (Examples 5.2, 5.3, Eqs. 5.7–5.16), §5.3 double-stub (Example 5.4, Eqs. 5.17–5.24), §5.4 quarter-wave bandwidth (Example 5.5), §5.5 small reflections, §5.6 binomial (Example 5.6), §5.7 Chebyshev (Example 5.7), §5.8 tapered lines (Example 5.8, Klopfenstein), §5.9 Bode–Fano (Fig. 5.22).
  - Problems 2.24, 5.13, 5.14, 5.23 as solved in the exam-prep note.
- **ECE 373 lecture binder** (Waterloo, Boumaiza; PDF pages): pp. 55–71 Smith chart (circle derivation, impedance and admittance charts, Examples 1–3, element moves on Z and Y charts, 880 MHz example); pp. 72–88 matching networks (L-sections, single and double stub, quarter-wave and its bandwidth, triangular/exponential/Klopfenstein tapers).
- **ECE 373 *Smith Charts Guide*** (course zip): sign convention, stub formulas, ZY reading rule ("capacitors move down"), double-stub check example.
- **[[Exam Prep - Problems through Stability]]:** practice midterm Q1, Stability–Cascading P1, PS3 Q1–Q2, Midterm 2018 P3, Pozar 2.20–2.24, 5.1–5.25 solutions and their sweeps.
- **My calculations** (flagged in text): binder 880 MHz $Z_{in}$, bandwidth sweeps of Pozar Examples 5.2 and 5.4, on-chip termination numbers.
