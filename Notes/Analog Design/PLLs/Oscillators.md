---
title: Oscillators
description: Feedback made deliberately unstable, from Barkhausen to ring and LC oscillators, VCO tuning and the integrator model, phase noise, and the quadrature and injection-locked clocks a SerDes needs.
kind: topic
status: growing
aliases:
  - Oscillators
  - Oscillator
  - VCO
  - VCOs
  - Voltage-Controlled Oscillator
  - Ring Oscillator
  - LC Oscillator
  - Phase Noise
  - Injection Locking
---

An oscillator is a feedback loop designed to fail the stability test on purpose: it has no input and sustains its own output. This note starts with the condition for oscillation, then builds the two families every CMOS chip uses (ring and LC), makes them tunable (the VCO), models the VCO as the phase integrator a PLL needs, and ends with phase noise and the clocking tricks a SerDes leans on (quadrature from $\div2$, injection locking). Stop after any section and the picture is still correct, just coarser.

## The big picture

```tikz title="The two CMOS oscillator families. A ring gets its phase shift from N delaying, inverting stages (left); an LC oscillator gets it from a resonant tank whose loss R_P is cancelled by an active negative resistance (right). After Razavi Figs. 15.13, 15.32(c) and Carusone Fig. 19.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \x/\n in {0/X,2/Y,4/Z} {
    \draw[thick] (\x,0) -- (\x,1) -- ({\x+1},0.5) -- cycle;
    \draw[thick] ({\x+1.1},0.5) circle (0.1);
    \node[font=\scriptsize,above] at ({\x+1.6},0.5) {$\n$};
  }
  \draw (1.2,0.5) -- (2,0.5);
  \draw (3.2,0.5) -- (4,0.5);
  \draw (5.2,0.5) -- (5.7,0.5) -- (5.7,-0.5) -- (-0.5,-0.5) -- (-0.5,0.5) -- (0,0.5);
  \node[align=center,font=\scriptsize] at (2.6,-1.4) {ring: $N$ inverting stages ($N$ odd if single-ended)\\$f_{osc}=1/(2NT_D)$, start-up needs $A_0\ge 2$ per stage ($N=3$)\\wide tuning, many phases, noisy};
  \begin{scope}[xshift=7.0cm,yshift=-0.6cm]
    \draw (0,0) -- (4.6,0);
    \draw (0,2) -- (4.6,2);
    \draw (0,0) to[L, l=$L$] (0,2);
    \draw (1.3,0) to[C, l=$C$] (1.3,2);
    \draw (2.6,0) to[R, l=$R_P$] (2.6,2);
    \draw[fill=gray!15] (3.6,0.55) rectangle (4.6,1.45);
    \node[font=\scriptsize,align=center] at (4.1,1) {active\\$-R$};
    \draw (4.1,0) -- (4.1,0.55);
    \draw (4.1,1.45) -- (4.1,2);
    \node[align=center,font=\scriptsize] at (2.3,-0.8) {LC: $f_{osc}=1/(2\pi\sqrt{LC})$, oscillates if $R\le R_P$\\narrow tuning, low phase noise, big};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Barkhausen:** a loop oscillates at $\omega_0$ if $|H(j\omega_0)|\ge1$ and $H$ adds $180^\circ$ on top of the dc inversion (total $360^\circ$). Necessary, not sufficient; design for 2 to 3 times the minimum loop gain.
> 2. **Ring:** $N$ identical stages $-A_0/(1+s/\omega_0)$ need $A_0\ge 1/\cos(\pi/N)$ and start at $\omega_0\tan(\pi/N)$ ($N=3$: $A_0\ge2$ at $\sqrt3\,\omega_0$). Switching rings run at $f_{osc}=1/(2NT_D)$.
> 3. **LC:** $f_{osc}=1/(2\pi\sqrt{LC})$. Inductor loss becomes $R_P\approx Q^2R_S$. A cross-coupled pair gives $-2/g_m$ and needs $g_mR_P\ge1$; a Colpitts needs $g_mR_P\ge4$. Amplitude is current-limited: $(2/\pi)I_{SS}R_P$ per node.
> 4. **VCO:** $\omega_{out}=\omega_0+K_{VCO}V_{cont}$, with $K_{VCO}\ge(\omega_2-\omega_1)/(V_2-V_1)$. A big $K_{VCO}$ turns control-line noise into frequency noise.
> 5. **VCO as an integrator:** $\phi_{ex}=K_{VCO}\int V_{cont}\,dt$, i.e. $\Phi_{ex}/V_{cont}=K_{VCO}/s$. Ripple on $V_{cont}$ makes sidebands.
> 6. **Phase noise:** $S_\phi=h_0+h_2/f^2+h_3/f^3$ and $\mathcal L\approx S_\phi/2$. Leeson: $\mathcal L(\Delta f)\approx\frac{2FkT}{P_{sig}}\left(\frac{f_0}{2Q\Delta f}\right)^2$. Higher $Q$ and more signal power buy lower noise: that is why LC beats ring.

**Map:** [[#Spec translation|specs → $g_m$, $Q$, $g_m/I_D$]] → [[#Level 0 Oscillation as Feedback|Barkhausen, poles]] → [[#Level 1 Ring Oscillators|ring]] → [[#Level 2 LC Oscillators|tank, cross-coupled, Colpitts, negative resistance]] → [[#Level 3 Voltage-Controlled Oscillators|VCO tuning]] → [[#Level 4 The VCO as a Phase Integrator|$K_{VCO}/s$, sidebands]] → [[#Level 5 Phase Noise|phase noise, Leeson, jitter accumulation]] → [[#Level 6 Oscillators for SerDes Clocking|tens-of-GHz LC VCOs, $\div2$ quadrature, injection locking]].

## Spec translation

### The block's specs

Razavi §15.4 lists what an oscillator is judged on:

| Spec | What it is | Typical (source) |
|---|---|---|
| Center frequency $f_0$ | Set by the application (clock rate, or twice it) | up to hundreds of GHz in CMOS (Razavi) |
| Tuning range $\omega_1\ldots\omega_2$ | Must cover PVT spread plus the application's range | $\ge2\times$ for a ring that drifts $2\times$ over PVT; LC 15–30% with a switched-capacitor bank (Casper) |
| $K_{VCO}$ and its linearity | Slope of $\omega_{out}(V_{cont})$, rad/s/V | as small as the tuning range allows |
| Output amplitude | Larger is less sensitive to added noise | trades with power, supply, tuning range |
| Power | | 1–10 mW typical (Razavi) |
| Supply / CM rejection | Frequency shift per volt of supply | even a symmetric LC pair tunes with $V_{DD}$ (Ex. 15.9) |
| Phase noise / jitter | Output purity with constant $V_{cont}$ | e.g. $-98.5$ dBc/Hz at 1 MHz on a 14 GHz SerDes clock (Lee) |

### Mapping block specs to device and amplifier specs

An oscillator's "amplifier" is the active device that cancels loss: the cross-coupled pair in an LC VCO, the differential pair in each ring stage. Its specs are **gain** (start-up), **bandwidth / GBW** (ring frequency), **output swing** (amplitude), **capacitance** (eats the tank's tuning budget), **noise** and **power**.

| Block spec | Device / amplifier inside | Amplifier spec that sets it | Condition |
|---|---|---|---|
| LC start-up | Cross-coupled pair | Small-signal gain $g_mR_P$ at equilibrium | $g_mR_P\ge\alpha$, $\alpha\approx$ 1.4–1.7 margin |
| LC amplitude | Tail current + tank | Output swing (current-limited) | $A=\frac2\pi I_{SS}R_P\le$ headroom |
| LC $f_0$, tuning range | Pair + varactor + inductor parasitics | Device capacitance per node: $C_{GS}+C_{DB}+4C_{GD}$ (two Miller-doubled $C_{GD}$ between $X$ and $Y$) | $C_{fix}+C_{var,\max}\le 1/(\omega_{\min}^2L)$ |
| LC phase noise | Tank, pair, tail | Tank $Q$ ($R_P$), swing, pair/tail noise | Leeson $\propto 1/(Q^2P_{sig})$ |
| LC supply sensitivity | Pair drain junctions | $\partial C_{DB}/\partial V_{DD}$ | $K_{V_{DD}}=\frac{m\,\omega_{out}}{2(\phi_B+V_{DD})}$ |
| Ring start-up | Each stage | DC gain $A_0=g_mR$ | $A_0\ge1/\cos(\pi/N)$ |
| Ring frequency | Each stage | Stage bandwidth $\omega_0=1/(RC_L)$, i.e. $g_m/C_L$ | $\omega_{osc}=\tan(\pi/N)\,\frac{g_m}{A_0C_L}$ |
| Ring swing, supply | Each stage | Swing $I_{SS}R\le V_{TH}$; headroom | $V_{DD}\ge V_{I_{SS}}+V_{TH}+V_{OV}+\tfrac12 I_{SS}R$ |
| $K_{VCO}$ / control noise | Tuning element | Control span $V_2-V_1$ | $K_{VCO}\ge\frac{\omega_2-\omega_1}{V_2-V_1}$ |
| Power | Tail(s) | $I_{SS}V_{DD}$ | set by swing (LC) or by $N\cdot g_m/C_L$ (ring) |

> [!note]- Derivation: LC start-up $g_mR_P\ge1$ and the margin $\alpha$
> Merge the two half-tanks across $X$–$Y$: $2L_P\parallel 2R_P\parallel C_P/2$. The cross-coupled pair looks like $-2/g_m$ between $X$ and $Y$ (see [[#Negative resistance the one-port view]]). The tank's loss is cancelled if $2/g_m\le 2R_P$, i.e. $g_mR_P\ge1$; equivalently the loop gain of the two tuned stages, $(g_mR_P)^2$, is at least 1 (Razavi §15.3.2, Ex. 15.6).
>
> Razavi (§15.1) designs the loop gain to be "at least twice or three times the required value" to cover PVT. For the cross-coupled pair the loop gain is $(g_mR_P)^2$, so a loop-gain margin of 2–3 is $g_mR_P\approx$ 1.4–1.7. That is $\alpha$.

> [!note]- Derivation: LC amplitude $A=\frac{2}{\pi}I_{SS}R_P$ (Zettelkasten 13h1)
> With enough gain the swing grows until $|V_X-V_Y|$ steers all of $I_{SS}$ to one side each half-cycle (Razavi Ex. 15.6, Fig. 15.28): each drain current is a square wave between $0$ and $I_{SS}$. The tank passes only the fundamental. A $0$-to-$I_{SS}$ square wave has fundamental amplitude $\frac{2}{\pi}I_{SS}$, and at resonance the tank is just $R_P$, so each node swings sinusoidally about $V_{DD}$ with peak
> $$A=\frac2\pi I_{SS}R_P,\qquad V_{XY,\text{peak}}=\frac4\pi I_{SS}R_P.$$
> The harmonics of the current are shorted by the tank's $C$, which is why $V_X$, $V_Y$ are cleaner sinusoids than $I_{D1}$, $I_{D2}$ (Razavi Problem 15.7). The formula holds until the swing hits the voltage limit (a device enters triode), after which more current buys no more amplitude.

> [!note]- Derivation: ring start-up for $N$ stages
> Each stage is $-A_0/(1+s/\omega_0)$, so the loop gain is $H(s)=-A_0^N/(1+s/\omega_0)^N$ (Razavi Eq. 15.6, Carusone Eq. 19.81). The $N$ inversions (odd $N$) supply $180^\circ$ at dc; the poles must supply the other $180^\circ$, i.e. $180^\circ/N$ each:
> $$\tan^{-1}\frac{\omega_{osc}}{\omega_0}=\frac{\pi}{N}\Rightarrow\omega_{osc}=\omega_0\tan\frac\pi N.$$
> Unity gain there: $A_0^N/\left[1+\tan^2(\pi/N)\right]^{N/2}=1$, and $1+\tan^2=1/\cos^2$, so
> $$A_0\ge\frac{1}{\cos(\pi/N)}.$$
> $N=3$: $A_0\ge2$, $\omega_{osc}=\sqrt3\,\omega_0$ (Razavi Eqs. 15.8, 15.10). $N=4$ (differential, one crossed stage): $A_0\ge\sqrt2$, $\omega_{osc}=\omega_0$ (Razavi Ex. 15.3). With $A_0=g_mR$ and $\omega_0=1/(RC_L)$, $\omega_{osc}=\tan(\pi/N)\,g_m/(A_0C_L)$: the stage's $g_m/C_L$ (its GBW) sets the frequency.

$$
\boxed{\text{LC: }g_mR_P\ge\alpha,\quad A=\tfrac{2}{\pi}I_{SS}R_P}\qquad
\boxed{\text{Ring: }A_0=g_mR\ge\frac{1}{\cos(\pi/N)},\quad \omega_{osc}=\tan\frac{\pi}{N}\,\frac{g_m}{A_0C_L}}
$$

### Where it lands in sizing

Divide the start-up requirement by the bias current and the swing appears. At equilibrium each device of the pair carries $I_{SS}/2$:

$$
\boxed{\text{LC pair: }\frac{g_m}{I_D}\ge\frac{2\alpha}{I_{SS}R_P}=\frac{4\alpha}{\pi A}}\qquad
\boxed{\text{Ring stage: }\frac{g_m}{I_D}\ge\frac{2A_0}{I_{SS}R}=\frac{2A_0}{V_{sw}}}
$$

> [!tip] Remark
> The required $g_m/I_D$ depends only on the swing you want, not on $Q$ or frequency. A small swing (low $Q$, little current) pushes the pair toward weak inversion; a large swing lets it sit in strong inversion. The method that turns $g_m/I_D$ into $W$ is [[gm-ID Design Methodology]]; device background in [[MosFETs#gm/ID and ID/W Simulation-Aided Design]].

| Oscillator spec | Fixes | How |
|---|---|---|
| Amplitude $A$ + tank $R_P$ (LC) | $I_{SS}$ | $I_{SS}=\pi A/(2R_P)$: low $Q$ costs current |
| Start-up margin + $A$ (LC) | $g_m/I_D$ | $4\alpha/(\pi A)$ |
| Capacitance budget (LC tuning range) | $W$ (hence $L=L_{min}$) | $W=I_D/(I_D/W)$; its $C_{GS},C_{GD},C_{DB}$ must fit inside $1/(\omega^2L)-C_{var}$ |
| Stage gain + swing (ring) | $g_m/I_D$ | $2A_0/V_{sw}$, $V_{sw}\le V_{TH}$ |
| Frequency (ring) | $I_D$ and $f_T$ | $g_m/C_L=A_0\omega_{osc}/\tan(\pi/N)$; with $C_L\ge C_{gg}$ of the next stage, $\omega_{osc}<\tan(\pi/N)\,\omega_T/A_0$ |
| Flicker up-conversion | Tail device $W L$, PMOS core | Long tail, PMOS pair (less $1/f$) |

### Worked example: a 1 GHz LC VCO (Razavi Problem 15.15)

Given: $f=1$ GHz, $L_P=5$ nH per side, fixed parasitic 500 fF per node, $Q=4$, $I_{SS}=1$ mA.

1. **Capacitance budget.** $C_{tot}=1/(\omega^2L_P)=1/\left[(2\pi\cdot10^9)^2\cdot5\,\text{nH}\right]=5.07$ pF per node. The varactor (and the pair) may add at most $5.07-0.5=4.57$ pF.
2. **Tank resistance.** $R_P=Q L_P\omega=4\cdot5\,\text{nH}\cdot2\pi\cdot10^9=126\ \Omega$.
3. **Swing.** $A=\frac2\pi(1\,\text{mA})(126\ \Omega)=80$ mV per node. Small: a $Q$ of 4 at 1 mA gives a weak oscillator.
4. **Device.** With $\alpha=1.7$: $g_m\ge1.7/126=13.5$ mS per device at $I_D=0.5$ mA, i.e. $g_m/I_D\ge27$ S/A. That is the weak-inversion limit: a very wide pair whose capacitance eats the budget of step 1.
5. **Fix (illustrative choice, not from Razavi).** Ask for $A=0.5$ V instead: $I_{SS}=\pi(0.5)/(2\cdot126)=6.2$ mA, and $g_m/I_D\ge4(1.7)/(\pi\cdot0.5)=4.3$ S/A, comfortably strong inversion with a small device. The price is power, which is why tank $Q$ is the first thing an LC designer fights for.

Ring check (Razavi Problem 15.2a): three CS stages with $g_m=1/(200\ \Omega)$ need $g_mR_D\ge2$, so $R_D\ge400\ \Omega$.

## Level 0: Oscillation as Feedback

### Barkhausen's criteria

```tikz title="An oscillator is a feedback loop with no input: noise at ω0 goes around, comes back with unity gain and in phase, and regenerates. The 180° 'extra' phase can come from the frequency response alone (a), from stages that add 360° (b), or from none at all if the dc path is already non-inverting (c). After Razavi Figs. 15.1-15.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) node[left] {$V_{in}$} -- (0.9,0);
  \draw (1.2,0) circle (0.3);
  \node at (1.2,0) {$\Sigma$};
  \node[font=\scriptsize] at (0.75,0.3) {$+$};
  \node[font=\scriptsize] at (1.55,-0.5) {$-$};
  \draw[->] (1.5,0) -- (2.4,0);
  \draw (2.4,-0.5) rectangle (4.0,0.5);
  \node at (3.2,0) {$H(s)$};
  \draw[->] (4.0,0) -- (5.6,0) node[right] {$V_{out}$};
  \draw (4.8,0) node[circ]{} -- (4.8,-1.2) -- (1.2,-1.2);
  \draw[->] (1.2,-1.2) -- (1.2,-0.3);
  \node[font=\scriptsize,anchor=west,align=left] at (6.6,0) {$\dfrac{V_{out}}{V_{in}}=\dfrac{H}{1+H}\to\infty$ when $H(j\omega_0)=-1$:\\$|H(j\omega_0)|\ge1$ and $\angle H(j\omega_0)=180^\circ$};
  \foreach \x/\ph/\lab in {0.6/180/{(a) dc inversion + $180^\circ$},4.6/360/{(b) stages give $360^\circ$},8.6/0/{(c) no inversion, $0^\circ$}} {
    \draw (\x,-3.0) rectangle ({\x+1.6},-2.2);
    \node at ({\x+0.8},-2.6) {$H(j\omega)$};
    \draw[->] ({\x+0.8},-2.05) -- ({\x+0.8},-1.75) node[above,font=\scriptsize] {$\ph^\circ$};
    \node[font=\scriptsize] at ({\x+0.8},-3.35) {\lab};
  }
\end{circuitikz}
\end{document}
```

$$
\boxed{|H(j\omega_0)|\ge1,\qquad \angle H(j\omega_0)=180^\circ\ \text{(plus the dc inversion: }360^\circ\text{ total)}}
$$

- **Growth needs loop gain $\ge1$:** following the signal around the loop gives the geometric series $V_X=V_0(1+|H|+|H|^2+\dots)$, which diverges only for $|H|\ge1$ (Razavi Eq. 15.2).
- **Necessary, not sufficient** (Razavi footnote: we only know that gain crossover below phase crossover means stable). Design the small-signal loop gain to 2–3 times the minimum to survive PVT.
- "Amplifiers oscillate and oscillators don't" (Razavi): the margin exists because the criterion is fragile.

> [!tip] Remark
> These are the conditions [[Stability#Barkhausen's criteria]] tells you to avoid, with the same loop gain of [[Feedback#Closed-loop gain and loop gain]]. [[Stability]] writes the phase condition as $\angle\beta H=-180^\circ$; Razavi's Ch. 15 writes $+180^\circ$. Same thing: an extra half-turn on top of the inversion.

### Poles, growth, and amplitude limiting

```tikz title="Closed-loop poles of a three-stage ring as the stage gain A0 rises. The complex pair leaves -ω0 along a 60° line and crosses the jω axis at A0 = 2 (at j√3 ω0); the real pole -(A0+1)ω0 just decays. After Razavi Fig. 15.11, Eqs. (15.14)-(15.15)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,scale=0.62]
  \foreach \ox/\a/\lab in {0/1/{$0<A_0<2$: decays},7.5/2/{$A_0=2$: sustained},15/3/{$A_0>2$: grows}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (-4.8,0) -- (1.6,0) node[right] {$\sigma$};
      \draw[->] (0,-3.2) -- (0,3.4) node[above] {$j\omega$};
      \draw[dashed,gray] (-1,0) -- ({-1+3.4*cos(60)},{3.4*sin(60)});
      \draw[dashed,gray] (-1,0) -- ({-1+3.4*cos(60)},{-3.4*sin(60)});
      \node[font=\large] at ({\a/2-1},{\a*0.866}) {$\times$};
      \node[font=\large] at ({\a/2-1},{-\a*0.866}) {$\times$};
      \node[font=\large] at ({-\a-1},0) {$\times$};
      \node[font=\scriptsize,below] at (-1,-0.05) {$-\omega_0$};
      \node[font=\scriptsize] at (-1.6,-3.9) {\lab};
    \end{scope}
  }
  \node[font=\scriptsize,anchor=west] at (7.6,1.73) {$j\sqrt3\,\omega_0$};
\end{circuitikz}
\end{document}
```

With $A_0>2$ the output is $V_{out}(t)\approx a\,e^{\frac{A_0-2}{2}\omega_0t}\cos\!\left(\frac{\sqrt3A_0}{2}\omega_0t\right)$ (Razavi Eq. 15.16): an exponentially growing sinusoid. It stops growing because the stages saturate: the poles start in the right half plane and are pulled back to the $j\omega$ axis, the circuit spending just enough of each cycle in saturation that the **average** loop gain is one (Razavi §15.2; Carusone Fig. 19.27).

> [!note]- Derivation: the three closed-loop poles of the ring
> The ring is a positive-feedback loop around $H(s)=-A_0^3/(1+s/\omega_0)^3$ (the minus sign already holds the three inversions), so
> $$\frac{V_{out}}{V_{in}}=\frac{-A_0^3}{(1+s/\omega_0)^3+A_0^3}.$$
> Factor the sum of cubes: $(1+s/\omega_0)^3+A_0^3=\left(1+\frac s{\omega_0}+A_0\right)\left[\left(1+\frac s{\omega_0}\right)^2-\left(1+\frac s{\omega_0}\right)A_0+A_0^2\right]$, giving
> $$s_1=-(A_0+1)\omega_0,\qquad s_{2,3}=\left[\frac{A_0(1\pm j\sqrt3)}{2}-1\right]\omega_0.$$
> $\mathrm{Re}\,s_{2,3}=(A_0/2-1)\omega_0$ crosses zero at $A_0=2$, where $\mathrm{Im}\,s_{2,3}=\sqrt3\,\omega_0$: the same answer as Barkhausen. These statements are intuitive rather than rigorous: transfer functions and poles do not strictly apply to a circuit that is saturating (Razavi footnote 3).

> [!tip] Remark
> Pole positions and their time response are [[Stability#Poles and the time response]]. In an amplifier you keep them in the left half plane; here you put them in the right half plane and let nonlinearity hold them on the axis.

## Level 1: Ring Oscillators

### Why it takes three stages

| Loop | Phase available | Result |
|---|---|---|
| 1 CS stage | dc inversion + at most $90^\circ$ (at $\omega=\infty$) $=270^\circ$ | stable (settles to the trip point: a bias generator, Carusone Ex. 19.16) |
| 2 CS stages | dc is **positive** feedback | latches up (an SRAM cell, Carusone Ex. 19.17) |
| 2 stages + ideal inverter | $180^\circ$ only at $\omega=\infty$, where gain is 0 | stable |
| **3 stages** | $180^\circ$ at finite $\omega$ with gain left | **oscillates** |

```tikz title="Three-stage ring oscillator from common-source stages. Each node lags its neighbour by 120° (60° from the pole plus 180° inversion = 240°, i.e. -120°). After Razavi Figs. 15.8 and 15.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (-0.6,3) -- (8.2,3) node[right] {$V_{DD}$};
  \foreach \i/\x/\n in {1/0/E,2/2.8/F,3/5.6/G} {
    \draw (\x,0) node[nmos](M\i){};
    \node[anchor=west,font=\scriptsize] at ($(M\i.center)+(0.25,0)$) {$M_\i$};
    \draw (M\i.S) node[ground]{};
    \draw (M\i.D) -- (\x,1.4) node[circ]{} coordinate (N\i);
    \draw (N\i) to[R, l_=$R_D$] (\x,3);
    \draw (N\i) -- ({\x+1.0},1.4) to[C, l=$C_L$] ({\x+1.0},0) node[ground]{};
    \node[font=\scriptsize,anchor=south east] at (N\i) {$\n$};
  }
  \draw (N1) -- ++(0,0) ; 
  \draw (1.0,1.4) -- (1.6,1.4) |- (M2.G);
  \draw (3.8,1.4) -- (4.4,1.4) |- (M3.G);
  \draw (6.6,1.4) -- (7.6,1.4) -- (7.6,-1.0) -- (-1.4,-1.0) |- (M1.G);
  \begin{scope}[xshift=9.4cm,yshift=1.4cm,x=0.55cm,y=0.5cm]
    \draw[->] (0,0) -- (7.2,0) node[right,font=\scriptsize] {$t$};
    \draw[thick,domain=0:6.6,samples=60] plot (\x,{sin(deg(\x))});
    \draw[thick,dashed,domain=0:6.6,samples=60] plot (\x,{sin(deg(\x)-120)});
    \draw[thick,dotted,domain=0:6.6,samples=60] plot (\x,{sin(deg(\x)-240)});
    \node[font=\scriptsize,anchor=west] at (0,1.9) {$V_E$ solid, $V_F$ dashed, $V_G$ dotted};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{N=3:\ A_0\ge2,\ \ \omega_{osc}=\sqrt3\,\omega_0}\qquad
\boxed{N=4\ (\text{differential}):\ A_0\ge\sqrt2,\ \ \omega_{osc}=\omega_0}
$$

More stages need less gain per stage and give more phases; most differential designs use 3 to 5 stages (Razavi §15.2).

### Large-signal frequency: $2N$ delays

A ring of inverters started with one node at $V_{DD}$ ripples a transition around the loop; one lap ($NT_D$) inverts every node, two laps restore them (Razavi Fig. 15.14; Carusone Eq. 19.79):

$$
\boxed{f_{osc}=\frac{1}{2NT_D},\qquad \text{adjacent phase step}=\frac{180^\circ}{N}}
$$

The ring starts at the small-signal $\sqrt3A_0\omega_0/2$ and slides down to $1/(6T_D)$ as it saturates: $\omega_0$ is a small-signal pole at the trip point, $T_D$ a large-signal slewing delay (Razavi p. 614). In SPICE a perfectly symmetric ring sits at the trip point forever; kick one node with an initial condition.

### Differential rings, even N and quadrature

```tikz title="A differential ring can use an even number of stages: crossing one pair of wires supplies the inversion. With four stages each adds 45°, so the outputs of stages 1 and 3 are in quadrature (I and Q). After Razavi Fig. 15.15(b), Ex. 15.3 and Carusone Fig. 19.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i in {1,2,3,4} {
    \pgfmathsetmacro{\x}{2.4*(\i-1)}
    \draw[thick] (\x,0.3) rectangle ({\x+1.2},1.3);
    \node[font=\scriptsize] at ({\x+0.6},0.8) {$\i$};
  }
  \foreach \i in {1,2,3} {
    \pgfmathsetmacro{\x}{2.4*(\i-1)+1.2}
    \draw (\x,1.0) -- ({\x+1.2},1.0);
    \draw (\x,0.6) -- ({\x+1.2},0.6);
  }
  \node[font=\scriptsize,above] at (1.55,1.0) {$X_1$};
  \node[font=\scriptsize,above] at (6.35,1.0) {$X_3$};
  \draw[->] (1.8,1.0) node[circ]{} -- (1.8,2.1) node[above,font=\scriptsize] {I};
  \draw[->] (6.6,1.0) node[circ]{} -- (6.6,2.1) node[above,font=\scriptsize] {Q};
  \draw (8.4,1.0) -- (8.7,1.0) -- (9.1,0.6) -- (9.4,0.6) -- (9.4,-0.4) -- (-0.5,-0.4) -- (-0.5,0.6) -- (0,0.6);
  \draw (8.4,0.6) -- (8.7,0.6) -- (9.1,1.0) -- (9.8,1.0) -- (9.8,-0.8) -- (-0.9,-0.8) -- (-0.9,1.0) -- (0,1.0);
  \node[font=\scriptsize,align=center] at (8.9,1.75) {crossed:\\the inversion};
  \node[font=\scriptsize] at (4.5,-1.3) {$45^\circ$ per stage $\Rightarrow$ 4 phases and their complements: $0^\circ,45^\circ,\dots,315^\circ$};
\end{circuitikz}
\end{document}
```

- Single-ended rings need an **odd** number of inversions or they latch (Carusone Ex. 19.17).
- Differential rings give better supply rejection and allow any $N$; the middle stage of a 4-stage ring is in **quadrature** with the last (Carusone §19.4.1). This is one of the ways a SerDes gets I/Q clocks ([[#Quadrature clocks]]).
- A ring of $N$ differential stages offers $2N$ evenly spaced phases: the reason rings feed multiphase samplers and interpolators.

### Differential stage: swing and minimum supply

For a resistively loaded differential ring stage with complete switching (Razavi Ex. 15.2, 15.4):

$$
\boxed{V_{sw}=I_{SS}R_P\le V_{TH}}\qquad
\boxed{V_{DD}\ge V_{I_{SS}}+V_{TH}+\sqrt{\frac{I_{SS}}{\mu_nC_{ox}(W/L)}}+\frac{R_PI_{SS}}{2}}
$$

The four terms are the tail headroom, one threshold, the equilibrium overdrive and half the swing.

> [!note]- Derivation: swing limit and minimum supply (Razavi Ex. 15.4)
> **Swing.** When $M_1$ is fully on, its gate sits at $V_{DD}$ (the previous stage's high level) and its drain at $V_{DD}-I_{SS}R_P$. Staying in saturation needs $V_D\ge V_G-V_{TH}$, so $I_{SS}R_P\le V_{TH}$.
>
> **Tail node.** With $V_1=V_{CM}+\Delta V$, $V_2=V_{CM}-\Delta V$ and $V_{CM}=V_{DD}-I_{SS}R_P/2$, solving $I_{D1}+I_{D2}=I_{SS}$ with square-law devices gives
> $$V_P=V_{CM}-V_{TH}-\frac12\sqrt{-(2\Delta V)^2+\frac{4I_{SS}}{\mu_nC_{ox}(W/L)}}.$$
> The square root is largest at $\Delta V=0$, so the lowest $V_P$ is at the zero crossing: $V_{P,\min}=V_{CM}-V_{TH}-\sqrt{I_{SS}/(\mu_nC_{ox}W/L)}$, the equilibrium overdrive. $V_P$ dips twice per cycle, which is why the tail node carries $2f_{osc}$ (used in frequency doublers). Requiring $V_{P,\min}\ge V_{I_{SS}}$ gives the boxed supply bound.

> [!tip] Remark
> This is the large-signal steering of [[Differential Amplifiers#Large-Signal Characteristic]]: complete switching happens once $|\Delta V_{in}|\ge\sqrt2\,V_{OV}$, and the swing is then $I_{SS}R$ regardless of gain.

Loads without good resistors (Razavi Fig. 15.18): a triode PMOS (needs its gate set to define $R_{on}$), a diode-connected PMOS (costs a $V_{TH}$ of headroom), or a PMOS whose gate is driven by an NMOS source follower from its own drain, which costs only $|V_{DS}|$, presents $\approx1/g_m$, has a smaller time constant than a diode load, and can even look inductive.

## Level 2: LC Oscillators

### The tank in two lines

```tikz title="A lossy inductor (series R_S) is, near resonance, a parallel L_P || R_P with R_P = Q^2 R_S. The parallel tank is a pure resistor R_P at ω1, inductive below and capacitive above. After Razavi Figs. 15.20-15.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) to[L, l_=$L_1$] (0,1.6) to[R, l_=$R_S$] (0,0);
  \node at (1.0,1.5) {$\approx$};
  \draw (1.8,3) -- (3.2,3);
  \draw (1.8,0) -- (3.2,0);
  \draw (1.8,3) to[L, l_=$L_P$] (1.8,0);
  \draw (3.2,3) to[R, l=$R_P$] (3.2,0);
  \node[font=\scriptsize,align=center] at (2.5,-0.7) {$L_P\approx L_1$, $R_P\approx Q^2R_S$};
  \begin{scope}[xshift=4.6cm,x=1.1cm,y=1.2cm]
    \draw[->] (0,0) -- (3.3,0) node[right] {$\omega/\omega_1$};
    \draw[->] (0,0) -- (0,2.4) node[above] {$|Z|$};
    \draw[thick,domain=0.25:3.1,samples=120] plot (\x,{2/sqrt(1+9*(\x-1/\x)^2)});
    \draw[dotted] (1,0) -- (1,2) node[above,font=\scriptsize] {$R_P$};
    \node[below,font=\scriptsize] at (1,0) {1};
    \node[font=\scriptsize] at (0.45,1.0) {inductive};
    \node[font=\scriptsize] at (2.2,1.0) {capacitive};
  \end{scope}
  \begin{scope}[xshift=9.6cm,yshift=1.3cm,x=1.1cm,y=0.012cm]
    \draw[->] (0,0) -- (3.3,0) node[right] {$\omega/\omega_1$};
    \draw[->] (0,-105) -- (0,110) node[above] {$\angle Z$};
    \draw[thick,domain=0.25:3.1,samples=120] plot (\x,{-atan(3*(\x-1/\x))});
    \draw[dotted] (0,90) node[left,font=\scriptsize] {$+90^\circ$} -- (3.1,90);
    \draw[dotted] (0,-90) node[left,font=\scriptsize] {$-90^\circ$} -- (3.1,-90);
    \node[below left,font=\scriptsize] at (1,0) {1};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_1=\frac1{\sqrt{L_PC_P}},\qquad R_P\approx Q^2R_S=Q\,L\omega,\qquad Q=\frac{L\omega}{R_S}}
$$

> [!tip] Remark
> Resonance, resonator $Q$, loaded vs unloaded $Q$ and the series-parallel transformation in full belong to [[Microwave Resonators]]; the spiral inductor's own $Q$, $R_S$ and parasitic capacitance to [[Inductor]]. An oscillator only needs the two facts above: at $\omega_1$ the tank is a resistor $R_P$, and it supplies $\pm90^\circ$ either side of $\omega_1$.

> [!note]- Derivation: series-to-parallel conversion (Razavi Eqs. 15.29-15.36)
> Equate $L_1s+R_S=\dfrac{R_PL_Ps}{R_P+L_Ps}$ at $s=j\omega$ and match real and imaginary parts: $L_1R_P+L_PR_S=R_PL_P$ and $R_SR_P=L_1L_P\omega^2$. Then $L_P=L_1(1+R_S^2/(L_1^2\omega^2))=L_1(1+1/Q^2)\approx L_1$ and $R_P\approx L_1^2\omega^2/R_S=Q^2R_S$. Valid only in a narrow band around $\omega$; Razavi notes monolithic $Q$ is "typically greater than 3", so the $1/Q^2$ correction is small. The same trick converts a series $RC$ with $Q=1/(C\omega R_S)$.

**A tuned stage swings above $V_{DD}$.** The inductor cannot hold a dc drop, so a CS stage with a tank load has its output centred on $V_{DD}$ and peaks above it; the peak-to-peak swing can exceed $V_{DD}$ (Razavi Fig. 15.24). One tuned stage fed back to itself does not oscillate: at resonance it gives $180^\circ$, not $360^\circ$, and the tank never adds another $180^\circ$ (Razavi Fig. 15.23).

### The cross-coupled (negative-$G_m$) oscillator

```tikz title="The workhorse: a cross-coupled NMOS pair with a tail current, inductor loads and back-to-back varactors (left). Between X and Y the pair is a negative resistance -2/g_m across the merged tank (right). After Razavi Figs. 15.27(c), 15.36 and 15.53."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (3,0) node[nmos](M2){};
  \node[font=\scriptsize] at (-0.55,0) {$M_1$};
  \node[font=\scriptsize] at (3.55,0) {$M_2$};
  \draw (M1.D) -- (0,1.7) coordinate (X);
  \draw (M2.D) -- (3,1.7) coordinate (Y);
  \draw (X) to[L, l=$L_P$] (0,3.6);
  \draw (Y) to[L, l_=$L_P$] (3,3.6);
  \draw (0,3.6) -- (3,3.6);
  \draw (1.5,3.6) -- (1.5,3.9) node[above] {$V_{DD}$};
  \draw (X) to[vC, l=$C_{var}$] (1.5,1.7) to[vC, l=$C_{var}$] (Y);
  \draw (1.5,1.7) node[circ]{} -- (1.5,2.5) node[above,font=\scriptsize] {$V_{cont}$};
  \node[circ] at (X) {}; \node[circ] at (Y) {};
  \node[font=\scriptsize,anchor=east] at (X) {$X$};
  \node[font=\scriptsize,anchor=west] at (Y) {$Y$};
  \draw (M1.G) -- ++(0.15,0) -- (1.8,1.1) -- (3,1.1) node[circ]{};
  \draw (M2.G) -- ++(-0.15,0) -- (1.2,1.1) -- (0,1.1) node[circ]{};
  \draw (M1.S) -- (0,-1.1) -- (3,-1.1) -- (M2.S);
  \draw (1.5,-1.1) node[circ]{} to[I, l=$I_{SS}$] (1.5,-2.8) node[ground]{};
  \begin{scope}[xshift=5.6cm,yshift=-0.6cm]
    \draw (0,3.2) -- (4.8,3.2);
    \draw (0,0) -- (4.8,0);
    \node[circ] at (2.8,3.2) {}; \node[above,font=\scriptsize] at (2.8,3.2) {$X$};
    \node[circ] at (2.8,0) {}; \node[below,font=\scriptsize] at (2.8,0) {$Y$};
    \draw (0,3.2) to[L, l=$2L_P$] (0,0);
    \draw (1.4,3.2) to[C, l=$C/2$] (1.4,0);
    \draw (2.8,3.2) to[R, l=$2R_P$] (2.8,0);
    \draw (4.3,3.2) -- (4.3,2.1);
    \draw[fill=gray!15] (3.7,1.1) rectangle (4.8,2.1);
    \node[font=\scriptsize] at (4.25,1.6) {$-2/g_m$};
    \draw (4.3,1.1) -- (4.3,0);
    \node[font=\scriptsize,align=center] at (2.4,-1.0) {oscillates if $2/g_m\le 2R_P$, i.e. $g_mR_P\ge1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_{osc}=\frac1{\sqrt{L_PC_P}},\qquad g_mR_P\ge1,\qquad A=\frac{2}{\pi}I_{SS}R_P\ \text{per node}}
$$

- **Two tuned stages in a ring.** Each contributes $0^\circ$ at resonance and two inversions make $360^\circ$; it cannot latch because the inductors short out dc gain (Razavi §15.3.2). The open-loop phase goes $+180^\circ\to-180^\circ$ through resonance, so it can only oscillate there (Ex. 15.5).
- **Why the tail.** Without it the drain currents and swing follow $V_{DD}$; the tail $I_{SS}$ fixes the current, and the steady state steers all of $I_{SS}$ side to side (Razavi Fig. 15.28).
- **Still supply-sensitive:** the drain junction capacitances are reverse-biased by $\approx V_{DD}$, so $V_{DD}$ tunes the tank ([[#Supply pushing through junction capacitance]]).
- **PMOS cross-coupled pair** (Razavi Fig. 15.58): swings around ground, lets the varactor anodes sit on the tank (removing the n-well capacitance) and has less flicker noise to up-convert.

> [!tip] Remark
> The cross-coupled pair is a [[Differential Amplifiers]] pair whose outputs drive its own inputs; the same latch is the regenerative core of a [[Comparators|comparator]]. In a comparator the load is resistive and the loop latches; here the load is a tank with zero dc gain, so the loop oscillates.

### Colpitts: one transistor, gain of four

```tikz title="Colpitts oscillator: the drain is fed back to the source through the capacitive divider C2-C1 (a CG stage has 0° from source to drain). After Razavi Fig. 15.31(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \node[font=\scriptsize,anchor=west] at (0.25,0) {$M_1$};
  \draw (M1.G) -- ++(-0.4,0) node[left] {$V_b$};
  \draw (M1.D) -- (0,1.4) node[circ]{} coordinate (O);
  \draw (O) to[L, l=$L_P$] (0,3.2);
  \draw (O) -- (1.3,1.4) to[R, l_=$R_P$] (1.3,3.2);
  \draw (-0.2,3.2) -- (1.5,3.2);
  \draw (0.6,3.2) -- (0.6,3.5) node[above] {$V_{DD}$};
  \draw (1.3,1.4) -- (2.8,1.4) node[right,font=\scriptsize] {$V_{out}$};
  \draw (2.4,1.4) node[circ]{} to[C, l=$C_2$] (2.4,-1.3) -- (0,-1.3);
  \draw (M1.S) -- (0,-1.3) node[circ]{};
  \draw (0,-1.3) to[I, l=$I_b$] (0,-3.1) node[ground]{};
  \draw (0,-1.3) -- (-1.4,-1.3) to[C, l_=$C_1$] (-1.4,-3.1) node[ground]{};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_R^2=\frac{1}{L_P\left(C_P+\dfrac{C_1C_2}{C_1+C_2}\right)},\qquad g_mR_P\ge\frac{(C_1+C_2)^2}{C_1C_2}\ \ge4\ \ (\text{min at }C_1=C_2)}
$$

The Colpitts needs a voltage gain of 4 at resonance where the cross-coupled pair needs 1. With the low $Q$ (small $R_P$) of on-chip inductors that difference decides it: CMOS uses the cross-coupled topology (Razavi §15.3.3).

> [!note]- Derivation: Colpitts oscillation conditions (Razavi Eqs. 15.37-15.46)
> **Why $C_1$ is needed.** Without $C_1$ (source node to ground is an ideal current source), a current injected at the source flows straight through $M_1$ and $C_2$ into the tank: $V_{out}/I_{in}=L_Ps\parallel R_P\parallel 1/(C_Ps)$, which never goes infinite. No oscillation.
>
> **With $C_1$.** Model $M_1$ as $g_mV_1$ ($V_1=V_{GS}$) and inject $I_{in}$ at the source. Current balance gives
> $$\frac{V_{out}}{I_{in}}=\frac{R_PL_Ps(g_m+C_2s)}{R_PC_1C_2L_Ps^3+(C_1+C_2)L_Ps^2+[g_mL_P+R_P(C_1+C_2)]s+g_mR_P}.$$
> For an oscillation at $s=j\omega_R$ both the real and imaginary parts of the denominator vanish:
> $$-R_PC_1C_2L_P\omega_R^3+[g_mL_P+R_P(C_1+C_2)]\omega_R=0,\qquad -(C_1+C_2)L_P\omega_R^2+g_mR_P=0.$$
> With $g_mL_P\ll R_P(C_1+C_2)$ the first gives $\omega_R^2=1/[L_PC_1C_2/(C_1+C_2)]$; substituting into the second, $g_mR_P=(C_1+C_2)^2/(C_1C_2)=\frac{C_1}{C_2}\left(1+\frac{C_2}{C_1}\right)^2$, minimized at $C_1/C_2=1$ where it equals 4. Adding $C_P$ across $L_P$ just adds to the series combination (Razavi Problem 15.10).
>
> **The stimulus can go anywhere** that keeps the circuit's topology when it is zeroed (a current source into a node, a voltage source in series): the natural frequencies of a linear system do not depend on where you excite it (Razavi Ex. 15.7, footnote 6). That is also why any device's noise can start the oscillator.

### Negative resistance: the one-port view

```tikz title="One-port view. A tank rings down because R_P burns energy each cycle (a); a parallel -R_P cancels it and the ringing persists (b). The negative resistance can come from a source follower whose output is fed back to its gate through a common-gate device: -2/g_m seen at Z_in (c). After Razavi Figs. 15.32, 15.33 and 15.37."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}[x=0.5cm,y=0.5cm]
    \draw[->] (0,0) -- (7,0) node[right,font=\scriptsize] {$t$};
    \draw[thick,domain=0:6.5,samples=150] plot (\x,{1.6*exp(-0.45*\x)*cos(deg(4*\x))});
    \node[font=\scriptsize] at (3.5,-2.4) {(a) $R_P$ alone: decays};
  \end{scope}
  \begin{scope}[xshift=4.4cm,x=0.5cm,y=0.5cm]
    \draw[->] (0,0) -- (7,0) node[right,font=\scriptsize] {$t$};
    \draw[thick,domain=0:6.5,samples=150] plot (\x,{1.6*cos(deg(4*\x))});
    \node[font=\scriptsize] at (3.5,-2.4) {(b) $R_P\parallel(-R_P)=\infty$: sustained};
  \end{scope}
  \begin{scope}[xshift=10.2cm,yshift=-0.4cm]
    \draw (0,0) node[nmos](Ma){};
    \draw (2.2,0) node[nmos,xscale=-1](Mb){};
    \node[font=\scriptsize,anchor=west] at (0.2,0.1) {$M_1$};
    \node[font=\scriptsize,anchor=east] at (2.0,0.1) {$M_2$};
    \draw (Ma.D) -- ++(0,0.25) node[above,font=\scriptsize] {$V_{DD}$};
    \draw (Ma.S) -- (0,-1.0) -- (2.2,-1.0) -- (Mb.S);
    \draw (Mb.G) -- ++(0.3,0) node[right,font=\scriptsize] {$V_b$};
    \draw (Mb.D) -- (2.2,1.5) -- (-1.2,1.5) |- (Ma.G);
    \draw (-1.2,2.9) node[above,font=\scriptsize] {$V_{DD}$} to[I, l_=$I_b$] (-1.2,1.5) node[circ]{};
    \draw[<-] (-1.25,1.5) -- (-2.0,1.5) node[left,font=\scriptsize] {$Z_{in}$};
    \node[font=\scriptsize,align=center] at (0.6,-1.7) {(c) follower $M_1$ + CG $M_2$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Follower + positive feedback: }Z_{in}=-\left(\frac1{g_{m1}}+\frac1{g_{m2}}\right)=-\frac2{g_m},\qquad
\text{three-node: }Z=-\frac{g_m}{C_1C_2\omega^2}+\frac{1}{j\omega}\left(\frac1{C_1}+\frac1{C_2}\right)}
$$

- Feedback multiplies or divides an impedance by $1+$loop gain; make the loop gain negative enough (positive feedback) and the resistance turns negative (Razavi §15.3.4). "Negative" is incremental: raise the voltage and the current falls.
- A tank in parallel with $-R$ is a **one-port oscillator**; start-up needs $|{-R}|\le R_P$ (e.g. $R_P\ge2/g_m$). In steady state the devices spend part of each cycle nearly off, so the **average** resistance is exactly $-R_P$.
- Feedback and negative-resistance views are the same circuit: the source-follower oscillator redrawn differentially *is* the cross-coupled pair (Razavi Figs. 15.34-15.36), and grounding each of the three nodes of the two-capacitor circuit gives the three classic one-transistor oscillators, one of which is the Colpitts (Fig. 15.38).

> [!tip] Remark
> Microwave oscillator design by negative resistance in S-parameter form ($|\Gamma_{in}|>1$, start-up from $\Gamma_{in}\Gamma_L$), and dielectric-resonator oscillators, live in [[Mixers and Microwave Oscillators]]. The circuit idea is the one above.

> [!note]- Derivation: the two negative resistances (Razavi Eqs. 15.48-15.54)
> **Follower with positive feedback** (Fig. 15.33, $\lambda=\gamma=0$). The test current $I_X$ flows through both devices: $I_X=g_{m2}V_2=-g_{m1}V_1$, and $V_X=V_1-V_2=-I_X/g_{m1}-I_X/g_{m2}$. So $V_X/I_X=-(1/g_{m1}+1/g_{m2})=-2/g_m$ for equal $g_m$. In the oscillator (Fig. 15.34) the inductor also supplies $M_2$'s bias, and start-up needs $R_P-2/g_m\ge0$.
>
> **Two capacitors around one device** (Fig. 15.37, no node grounded). $M_1$'s drain current is $g_m(-I_X/C_1s)$, so $V_X=\frac{I_X}{C_2s}+\frac{g_mI_X}{C_1C_2s^2}+\frac{I_X}{C_1s}$. At $s=j\omega$ the middle term is $-g_m/(C_1C_2\omega^2)$: a negative resistance in series with $C_1C_2/(C_1+C_2)$. An inductor across it makes an oscillator.

## Level 3: Voltage-Controlled Oscillators

### Definition, $K_{VCO}$ and the tuning-range trade

```tikz title="VCO characteristic. Ideal: a straight line of slope K_VCO (dashed). Real: steep in the middle and flat at the ends, so its peak slope exceeds the minimum (ω2-ω1)/(V2-V1). After Razavi Figs. 15.40 and 15.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.4cm,y=1.4cm]
  \draw[->] (0,0) -- (4.4,0) node[right] {$V_{cont}$};
  \draw[->] (0,0) -- (0,3.4) node[above] {$\omega_{out}$};
  \draw[dashed] (0,0.9) -- (4,2.9);
  \draw[thick,domain=0.5:3.5,samples=80] plot (\x,{1.9+1.2*tanh(1.3*(\x-2))});
  \draw[dotted] (0.5,0) node[below] {$V_1$} -- (0.5,0.82);
  \draw[dotted] (3.5,0) node[below] {$V_2$} -- (3.5,2.98);
  \draw[dotted] (0,0.82) node[left] {$\omega_1$} -- (0.5,0.82);
  \draw[dotted] (0,2.98) node[left] {$\omega_2$} -- (3.5,2.98);
  \node[left] at (0,0.9) {};
  \node[font=\scriptsize,anchor=west] at (2.2,1.55) {peak slope $>$ chord};
  \node[font=\scriptsize,anchor=north west] at (3.3,2.4) {slope $K_{VCO}$};
  \node[font=\scriptsize] at (0.35,1.15) {$\omega_0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_{out}=\omega_0+K_{VCO}V_{cont}},\qquad
\boxed{K_{VCO}\ge\frac{\omega_2-\omega_1}{V_2-V_1}}
$$

- $K_{VCO}$ is in rad/s/V; Hz/V is common in datasheets but watch the $2\pi$ in a PLL (Razavi footnote 8).
- **Noise vs range.** Control-line noise $v_n$ becomes frequency noise $K_{VCO}v_n$, so you want a small $K_{VCO}$; the tuning range over a limited control span forces a large one. A lower supply (smaller $V_2-V_1$) makes it worse.
- **Linearity.** A nonlinear curve has a peak slope above the chord: for a given range, some part of the curve is more noise-sensitive than (15.61) suggests, and the PLL's bandwidth moves with $K_{VCO}$ (Razavi Fig. 15.41; Carusone §19.4.1).
- **Required range.** At least the PVT spread (a ring's center frequency can vary $2\times$) plus the application's range, which for clock generators may be one to two orders of magnitude.

### Tuning a ring

The ring period is $2NT_D$, so tune the stage delay. Each scheme below trades range, linearity, swing and headroom (Razavi §15.4.1, Carusone §19.4.1):

```tikz title="Simplest ring tuning: triode PMOS loads M3-M4 are voltage-controlled resistors, so V_cont sets the output time constant R_on C_L. After Razavi Fig. 15.42."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (3,0) node[nmos,xscale=-1](M2){};
  \node[font=\scriptsize,anchor=west] at (0.25,0) {$M_1$};
  \node[font=\scriptsize,anchor=east] at (2.75,0) {$M_2$};
  \draw (0,2.6) node[pmos,xscale=-1](M3){};
  \draw (3,2.6) node[pmos](M4){};
  \node[font=\scriptsize,anchor=east] at (-0.4,2.6) {$M_3$};
  \node[font=\scriptsize,anchor=west] at (3.4,2.6) {$M_4$};
  \draw (M3.S) -- (0,3.6) -- (3,3.6) -- (M4.S);
  \draw (1.5,3.6) -- (1.5,3.9) node[above] {$V_{DD}$};
  \draw (M3.G) -- (1.5,2.6) -- (M4.G);
  \draw (1.5,2.6) node[circ]{} -- (1.5,1.9) node[below,font=\scriptsize] {$V_{cont}$};
  \draw (M3.D) -- (M1.D);
  \draw (M4.D) -- (M2.D);
  \draw (0,1.3) node[circ]{} -- (-1.8,1.3) to[C, l_=$C_L$] (-1.8,0) node[ground]{};
  \draw (3,1.3) node[circ]{} -- (4.8,1.3) to[C, l=$C_L$] (4.8,0) node[ground]{};
  \draw (M1.S) -- (0,-1.0) -- (3,-1.0) -- (M2.S);
  \draw (1.5,-1.0) to[I, l=$I_{SS}$] (1.5,-2.5) node[ground]{};
  \draw (M1.G) -- ++(-0.3,0) node[below,font=\scriptsize] {$V_{in}^+$};
  \draw (M2.G) -- ++(0.3,0) node[below,font=\scriptsize] {$V_{in}^-$};
\end{circuitikz}
\end{document}
```

| Scheme | Frequency law | Range | Catch |
|---|---|---|---|
| Triode PMOS load (Fig. 15.42) | $f\propto\mu_pC_{ox}\frac WL(V_{DD}-V_{cont}-|V_{THP}|)/C_L$: **linear** | — | swing $2I_{SS}R_{on}$ varies with $f$; loads leave triode if $V_{cont}$ too high (Ex. 15.10) |
| Replica bias (Fig. 15.43; Carusone Fig. 19.23, Young 1992) | op amp servos $R_{on}I_{SS}=V_{DD}-V_{REF}$, so $f\propto\frac{I_{SS}}{(V_{DD}-V_{REF})C_L}$ | wide (Young 1992: a 5-110 MHz PLL) | op-amp bandwidth slows the PLL's response |
| Current-starved / tail-tuned (Carusone Fig. 19.22) | $\tau\propto C_L/g_m$, $g_m\propto\sqrt{I_B}$: nonlinear | — | swing grows with $f$, so $K_{VCO}$ varies |
| Cross-coupled load (Fig. 15.44-15.45) | $R_P\parallel(-1/g_{m3})=R_P/(1-g_{m3}R_P)$ grows with $I_1$, slows the stage | ~2:1 | needs keep-alive $I_H$ so gain $\ge2$ when all current goes to the cross pair (Ex. 15.12); steering pair costs headroom |
| Current folding (Fig. 15.47) | same, without the stacked steering pair | — | control-path devices add frequency noise |
| Interpolation (Figs. 15.48-15.50) | weighted sum of a fast and a slow (one extra stage) path, constant total current | ~2:1 | |
| Interpolation + cross-coupled (Ex. 15.13) | both effects | wider | |
| PMOS pull-ups (Fig. 15.52) | swing held by $M_5$-$M_6$ | **> 4 decades**, < 2× amplitude change | |
| Supply-tuned inverter ring (Palermo L11; Casper) | regulated $V_{DD}$ is the control | ≥ 10:1 | $\approx$1% delay per 1% supply (more at low $V_{DD}$): needs a clean regulator |

Except for replica bias and the PMOS pull-up stage, ring tuning gives at most about 3:1 (Razavi p. 640).

> [!note]- Detail: the cross-coupled-load stage and its keep-alive current (Razavi Ex. 15.12)
> The half circuit has load $R_P\parallel(-1/g_{m3,4})$, so the stage gain is $\frac{g_{m1,2}R_P}{1-g_{m3,4}R_P}$. If the steering pair $M_5$-$M_6$ sends all of $I_T$ to the cross-coupled pair, $M_1$-$M_2$ get only $I_H$, and a three-stage ring still needs gain 2:
> $$\frac{\sqrt{\mu_nC_{ox}(W/L)_{1,2}I_H}\,R_P}{1-\sqrt{\mu_nC_{ox}(W/L)_{3,4}I_T}\,R_P}\ge2\Rightarrow I_H\ge\frac{4\left[1-\sqrt{\mu_nC_{ox}(W/L)_{3,4}I_T}R_P\right]^2}{\mu_nC_{ox}(W/L)_{1,2}R_P^2}.$$
> Driving $V_{cont1}-V_{cont2}$ differentially gives the control line common-mode rejection. Making $M_5$-$M_6$ weak (large overdrive) lowers $K_{VCO}$ but raises the minimum supply by that overdrive: headroom against sensitivity.

### Tuning an LC oscillator: varactors

$f_{osc}=1/(2\pi\sqrt{LC})$ barely depends on bias, and on-chip inductors are hard to vary, so tune $C$ with a **varactor** (Razavi §15.4.2):

$$
\boxed{C_{var}=\frac{C_0}{(1+V_R/\phi_B)^m}\ \ (m\approx0.3\text{-}0.4\text{ in CMOS}),\qquad
\frac{f_{\max}}{f_{\min}}=\sqrt{\frac{C_{var,\max}+C_{fix}}{C_{var,\min}+C_{fix}}}}
$$

- **pn varactor range is small:** $\phi_B=0.7$ V, $m=0.35$, $V_R=0\ldots2$ V gives $C_j\to0.62C_0$, so $f_{\max}/f_{\min}=1.27$: 27% before parasitics (Razavi Ex. 15.14).
- **Fixed capacitance dilutes it:** with $C_{fix}=C_{var,\max}$ the same varactor gives $\sqrt{2/1.62}=1.11$, only 11% (Zettelkasten 13p1). $C_{fix}$ is the n-well-to-substrate capacitance of the varactor, the pair's $C_{GS}$ and $C_{DB}$, the two gate-drain capacitances between $X$ and $Y$ (each counted twice: Miller factor exactly 2 for equal and opposite swings), and the spiral's own parasitic (Razavi p. 643).
- **Swing vs range:** a junction varactor must not forward-bias, so $0<V_{cont}<V_{DD}-A+300$ mV. Every volt of amplitude (bought for phase noise) is a volt of control range lost (Razavi Fig. 15.53).
- **Coarse + fine:** a switched capacitor bank sets the band and the varactor fine-tunes between codes: 15-30% total range (Casper; Carusone §19.4.2).

```tikz title="MOS varactors. A plain MOSFET's gate capacitance is non-monotonic in V_GS (high in accumulation, dip in depletion, high again in inversion), so the VCO gain would change sign. An NMOS in an n-well (accumulation-mode varactor) is monotonic. After Razavi Fig. 15.59."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.0cm,y=1.0cm]
  \draw[->] (-2.6,0) -- (2.8,0) node[right] {$V_{GS}$};
  \draw[->] (0,0) -- (0,2.6) node[above] {$C_{GS}$};
  \draw[thick,domain=-2.4:2.5,samples=100] plot (\x,{0.6+1.4/(1+exp(2.5*(\x+1.0)))+1.4/(1+exp(-2.5*(\x-0.9)))});
  \node[font=\scriptsize] at (-1.8,2.3) {accumulation};
  \node[font=\scriptsize] at (1.9,2.3) {inversion};
  \node[below,font=\scriptsize] at (0.9,0) {$V_{TH}$};
  \node[font=\scriptsize] at (0.1,-0.8) {(a) MOSFET: non-monotonic};
  \begin{scope}[xshift=7cm]
    \draw[->] (-2.6,0) -- (2.8,0) node[right] {$V_{GS}$};
    \draw[->] (0,0) -- (0,2.6) node[above] {$C_{GS}$};
    \draw[thick,domain=-2.4:2.5,samples=100] plot (\x,{0.6+1.4/(1+exp(-3*\x))});
    \draw[dotted] (-2.4,0.6) node[left,font=\scriptsize] {$C_{\min}$} -- (2.5,0.6);
    \draw[dotted] (-2.4,2.0) node[left,font=\scriptsize] {$C_{\max}$} -- (2.5,2.0);
    \node[font=\scriptsize] at (0.1,-0.8) {(b) accumulation-mode varactor: monotonic};
  \end{scope}
\end{circuitikz}
\end{document}
```

The accumulation-mode MOS varactor (source, drain and n-well tied together as one terminal, gate as the other) never forward-biases, tolerates either polarity and has better $Q$ than an inversion-mode device: it is what modern LC VCOs use (Razavi §15.4.2; Palermo L11 slide 103).

> [!note]- Detail: pn-junction varactors in CMOS (Razavi Figs. 15.54-15.56)
> Only a floating diode ($p^+$ in an n-well) can sit across the tank of Fig. 15.53; a $p^+$-in-substrate diode has its anode grounded. The floating diode has two problems: the resistive n-well in series lowers its $Q$, and the n-well's own capacitance to substrate is a fixed $C_{fix}$. Surrounding each small $p^+$ island with an $n^+$ ring cuts the series resistance (current leaves in four directions); many islands in parallel raise the capacitance, but the shared well's substrate capacitance grows too. In simulation model $C_n$ as a diode. Connecting the anodes to the tank (PMOS core, Fig. 15.58) removes the well capacitance from the tank.

### Supply pushing through junction capacitance

Even a perfectly symmetric cross-coupled oscillator tunes with $V_{DD}$, because each drain junction is reverse-biased by about $V_{DD}$ (Razavi Ex. 15.9):

$$
\boxed{K_{V_{DD}}=\frac{\partial\omega_{out}}{\partial V_{DD}}=\frac{m}{2\phi_B\left(1+V_{DD}/\phi_B\right)}\,\omega_{out}}
$$

Differential symmetry rejects supply noise in **amplitude**, not in **frequency**. Ring VCOs are worse: every stage delay depends on the supply (Casper: about 1% delay per 1% supply), which is why rings in links sit behind regulators.

> [!note]- Derivation: supply sensitivity (Razavi Eqs. 15.56-15.60)
> Take $C_P=0$ so the tank capacitance is $C_{DB}=C_{DB0}/(1+V_{DD}/\phi_B)^m$. With $\omega_{out}=1/\sqrt{L_PC_{DB}}$,
> $$K=\frac{\partial\omega_{out}}{\partial C_{DB}}\frac{\partial C_{DB}}{\partial V_{DD}}=\frac{-1}{2\sqrt{L_PC_{DB}}\,C_{DB}}\cdot\frac{-mC_{DB}}{\phi_B(1+V_{DD}/\phi_B)}=\frac{m\,\omega_{out}}{2\phi_B(1+V_{DD}/\phi_B)}.$$
> It is nonlinear: it depends on both $V_{DD}$ and $\omega_{out}$.

## Level 4: The VCO as a Phase Integrator

Frequency is the derivative of phase, so a VCO's output phase is the integral of its control voltage (Razavi §15.5; Carusone Eqs. 19.1-19.7):

```tikz title="A step on V_cont steps the frequency and ramps the excess phase: the VCO integrates. A small sinusoid on V_cont puts sidebands at ω0 ± ωm. After Razavi Figs. 15.63 and 15.64."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,4.2) -- (5.2,4.2) node[right,font=\scriptsize] {$t$};
  \draw[thick] (0,4.4) -- (2,4.4) -- (2,5.0) -- (5,5.0);
  \node[left,font=\scriptsize] at (0,4.7) {$V_{cont}$};
  \draw[->] (0,2.4) -- (5.2,2.4) node[right,font=\scriptsize] {$t$};
  \draw[thick] (0,2.6) -- (2,2.6) -- (2,3.3) -- (5,3.3);
  \node[left,font=\scriptsize] at (0,2.9) {$\omega_{out}$};
  \node[font=\scriptsize,anchor=west] at (3.3,3.55) {$\omega_0+K_{VCO}V$};
  \draw[->] (0,0) -- (5.2,0) node[right,font=\scriptsize] {$t$};
  \draw[thick] (0,0.1) -- (2,0.1) -- (5,1.9);
  \node[left,font=\scriptsize] at (0,1.0) {$\phi_{ex}$};
  \node[font=\scriptsize,anchor=west] at (3.2,0.7) {slope $K_{VCO}V$};
  \begin{scope}[xshift=7.6cm,yshift=0.6cm]
    \draw[->] (0,0) -- (5,0) node[right] {$\omega$};
    \draw[very thick] (2.4,0) -- (2.4,3);
    \draw[very thick] (1.4,0) -- (1.4,0.7);
    \draw[very thick] (3.4,0) -- (3.4,0.7);
    \node[below,font=\scriptsize] at (2.4,0) {$\omega_0$};
    \node[below,font=\scriptsize] at (1.3,0) {$\omega_0-\omega_m$};
    \node[below,font=\scriptsize] at (3.5,0) {$\omega_0+\omega_m$};
    \node[font=\scriptsize,align=center] at (2.4,3.6) {sidebands $\frac{K_{VCO}V_m}{2\omega_m}V_0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out}(t)=V_m\cos\!\left(\omega_0t+K_{VCO}\!\int V_{cont}\,dt\right),\qquad \phi_{ex}=K_{VCO}\!\int V_{cont}\,dt,\qquad \frac{\Phi_{ex}}{V_{cont}}(s)=\frac{K_{VCO}}{s}}
$$

- **The common mistake:** $V_m\cos[(\omega_0+K_{VCO}V_{cont})t]$ is wrong; differentiating it gives an extra $K_{VCO}t\,dV_{cont}/dt$ term. Phase is a product of frequency and time only when frequency is constant (Razavi Eqs. 15.84-15.85).
- **Ripple makes sidebands:** $V_{cont}=V_m\cos\omega_mt$ with $K_{VCO}V_m/\omega_m\ll1$ rad gives $V_0\cos\omega_0t-\frac{K_{VCO}V_mV_0}{2\omega_m}[\cos(\omega_0-\omega_m)t-\cos(\omega_0+\omega_m)t]$ (Razavi Ex. 15.17). In a PLL, ripple at the reference frequency becomes **reference spurs**. A VCO is also a frequency modulator (FSK, Ex. 15.15-15.16).
- **Harmonics follow:** the $k$-th harmonic carries $k$ times the excess phase, so first-harmonic analysis covers square-wave outputs too (Razavi Eq. 15.87). That is why a $\div N$ divides phase by $N$.
- With a nonlinear characteristic $K_{VCO}$ stays inside the integral.

> [!tip] Remark
> The $1/s$ is the PLL's pole at the origin: a PLL with any loop filter is at least type I because of it. The loop that wraps around $K_{VCO}/s$ is [[Phased-Locked Loops]].

## Level 5: Phase Noise

### What is measured

A real VCO with constant $V_{cont}$ still drifts: its edges carry **jitter**, and its spectrum has skirts. Two spectra describe it (Carusone §19.3.4):

$$
\boxed{\mathcal L(\Delta f)=\frac{S_v(f_0+\Delta f)}{A^2/2}\ \ [\text{dBc/Hz}],\qquad \mathcal L(\Delta f)\approx\frac{S_\phi(\Delta f)}{2}\ \ (S_\phi\ll1)}
$$

- $S_\phi(f)$ is the PSD of the phase deviation (rad²/Hz); $\mathcal L$ is the single-sideband power at offset $\Delta f$ relative to the carrier. The factor 2 is because $\mathcal L$ counts one sideband. The approximation fails close to the carrier, where $S_\phi$ is large.
- Amplitude noise is mostly removed by the oscillator's own limiting, so near the carrier the skirt is phase noise (Casper).

> [!tip] Remark
> Integrating $S_\phi$ between the CDR bandwidth and Nyquist to get rms jitter, the period and $P$-cycle jitter filters, and why those limits matter for a link are owned by [[Link Noise and Jitter#Bridge: Phase Noise to rms Jitter]]. Voltage noise on a slope becoming timing noise ($\sigma_\tau=\sigma_n/A\omega_0$) is in [[Link Noise and Jitter#Voltage Noise Becomes Timing Noise]]. This section owns where $\mathcal L(\Delta f)$ comes from.

### Why the skirt goes as $1/\Delta f^2$

An oscillator in steady state behaves like a linear system with poles **on** the $j\omega$ axis at $\pm j2\pi f_0$. Noise injected inside the loop sees that pole, whose gain near the carrier is
$$G\big(j2\pi(f_0+\Delta f)\big)\propto\frac{f_0}{\Delta f},$$
so noise power is shaped by $1/\Delta f^2$ (Carusone Eq. 19.87, Fig. 19.27). The oscillator is an infinitely high-$Q$ filter for its own noise: every disturbance persists forever, circulating around the loop.

### Three regions and the flicker corner

```tikz title="Typical oscillator phase noise. Up-converted flicker noise gives -30 dB/dec, white noise inside the loop -20 dB/dec, and white noise added after the core (buffers) a flat floor. f_c is the 1/f^3 corner. After Carusone Figs. 19.29-19.30 and Casper Fig. 17(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.5cm,y=0.07cm]
  \draw[->] (0,-160) -- (6.6,-160) node[right] {$\log\Delta f$};
  \draw[->] (0,-160) -- (0,-45) node[above] {$\mathcal L(\Delta f)$ [dBc/Hz]};
  \draw[very thick] (0.3,-55) -- (2,-106) -- (4.2,-150) -- (6.3,-150);
  \draw[dotted] (2,-160) node[below] {$f_c=h_3/h_2$} -- (2,-106);
  \node[font=\scriptsize,anchor=west] at (1.1,-75) {$h_3/f^3$: $-30$ dB/dec};
  \node[font=\scriptsize,anchor=west] at (3.3,-118) {$h_2/f^2$: $-20$ dB/dec};
  \node[font=\scriptsize,anchor=south] at (5.4,-150) {$h_0$ floor};
  \node[font=\scriptsize,align=left,anchor=west] at (3.3,-75) {up-converted flicker (tail, pair)\\white noise in the loop (tank, pair)\\white noise after the core (buffer)};
\end{circuitikz}
\end{document}
```

$$
\boxed{S_{\phi,osc}(f)=h_0+\frac{h_2}{f^2}+\frac{h_3}{f^3},\qquad f_c=\frac{h_3}{h_2}}
$$

| Term | Slope | Origin (Carusone §19.4.3) |
|---|---|---|
| $h_3/f^3$ | $-30$ dB/dec | flicker noise **up-converted** to the carrier by switching (e.g. the tail transistor of a pair with oscillating inputs), then shaped by the $1/f^2$ loop response |
| $h_2/f^2$ | $-20$ dB/dec | white noise inside the loop: tank loss, the cross-coupled pair |
| $h_0$ | flat | white noise added after the core (buffers): a sinusoid plus additive white noise has white phase noise |

The three LC-VCO noise sources are the tank's finite $Q$, the cross-coupled pair and the tail current source (Palermo L11 slide 40). PMOS cores up-convert less flicker (Razavi p. 643).

> [!tip] Remark
> The device sources are those of [[Noise#MOSFET Channel Thermal Noise]] and [[Noise#Flicker (1/f) Noise]]. Flicker noise that is harmless in a wideband amplifier ([[Noise#Flicker Noise Only Matters in Narrow Bands]]) matters here because the oscillator moves it next to the carrier.

### Leeson's model

$$
\boxed{\mathcal L(\Delta f)=10\log\left[\frac{2FkT}{P_{sig}}\left(1+\left(\frac{f_0}{2Q\Delta f}\right)^2\right)\left(1+\frac{\Delta f_{1/f^3}}{|\Delta f|}\right)\right]}
$$

(Leeson, as given in Palermo L11 slide 45 after Perrott; for a better model Palermo points to Hajimiri's time-varying analysis.) $F$ is an empirical noise factor of the active device, $P_{sig}$ the signal power in the tank, $Q$ the loaded tank $Q$.

- **In the $1/f^2$ region** $\mathcal L\approx\frac{2FkT}{P_{sig}}\left(\frac{f_0}{2Q\Delta f}\right)^2$: doubling $Q$ buys 6 dB, doubling the signal power 3 dB, doubling $f_0$ at fixed $Q$ costs 6 dB.
- The bracket's corners: $f_0/2Q$ is the tank half-bandwidth (beyond it the floor), $\Delta f_{1/f^3}$ the flicker corner.
- **Ring vs LC in one line:** a ring's effective $Q$ is about 1-1.5 (Casper), an integrated LC's several times that. At equal power the LC is quieter; the ring wins area and tuning range.

> [!tip] Remark
> This is the $\left(f_0/2Q\Delta f\right)^2$ of a resonator's half-power bandwidth: [[Microwave Resonators]] owns that $Q$. The same $Q$ appears again, with the opposite effect, in the [[#Injection locking|injection lock range]].

### Jitter accumulates

```tikz title="P-cycle jitter of a free-running oscillator grows as sqrt(P) while white (1/f^2) noise dominates, then as P once flicker (1/f^3) noise below f_c takes over. A PLL stops the growth after about 1/(loop bandwidth). After Carusone Figs. 19.31-19.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right] {$\log P$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$\log\sigma_{J(P)}$};
  \draw[very thick] (0.3,0.4) -- (3.5,2.0) -- (6.0,4.0);
  \draw[thick,dashed] (2.6,1.55) -- (6.5,1.55);
  \draw[dotted] (3.5,0) node[below] {$P_c\approx\frac1{25T_0f_c}$} -- (3.5,2.0);
  \node[font=\scriptsize,anchor=west] at (1.0,1.35) {slope $\tfrac12$};
  \node[font=\scriptsize,anchor=west] at (4.9,3.0) {slope 1};
  \node[font=\scriptsize,anchor=west] at (4.4,1.25) {inside a PLL: flat beyond $\sim1/f_L$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\sigma_{J(P)}=\sqrt{h_2T_0^3\,P}\ \ (1/f^2\text{ region}),\qquad P_c\approx\frac{1}{25\,T_0f_c}}
$$

Absolute jitter of a free-running oscillator diverges: noise disturbances persist, so edge time is a random walk (Carusone §19.4.3). Measured $P$-cycle jitter is finite, and its $\sqrt P$ then $P$ growth lets you back out $h_2$, $h_3$ and $f_c$ from a scope.

> [!note]- Worked example: phase-noise model from a $P$-cycle measurement (Carusone Ex. 19.18)
> A 1.5 GHz VCO has $\sigma_{J(10)}=2.0$ ps rms and $P_c=30$. From $\sigma_{J(P)}=\sqrt{h_2T_0^3P}$ with $T_0=0.667$ ns: $h_2\approx1350$ rad²·Hz. From $P_c\approx1/(25T_0f_c)$: $f_c\approx2$ MHz. Then $h_3=h_2f_c\approx2.7\times10^9$ rad²·Hz². So
> $$S_{\phi,osc}(f)=\frac{1350}{f^2}+\frac{2.7\times10^9}{f^3}.$$
> At 1 MHz offset (computed here, not in Carusone): $S_\phi=1.35\times10^{-9}+2.7\times10^{-9}=4.05\times10^{-9}$ rad²/Hz, so $\mathcal L\approx S_\phi/2=2.0\times10^{-9}\to-87$ dBc/Hz, with flicker dominating because 1 MHz $<f_c$.

> [!warning] Unverified: a factor of 2 in Carusone Eq. 19.89
> Substituting $S_\phi=h_2/f^2$ into Carusone's own $P$-cycle jitter integral (Eq. 19.66), $\sigma^2=(T_0/\pi)^2\int_0^\infty\sin^2(\pi fPT_0)\,h_2/f^2\,df$, with $\int_0^\infty\sin^2(af)/f^2\,df=\pi a/2$, gives $\sigma_{J(P)}^2=h_2T_0^3P/2$, half of Eq. 19.89's $h_2T_0^3P$. Example 19.18's numbers follow Eq. 19.89 as printed. The $\sqrt P$ law is unaffected; treat the prefactor as uncertain to $\sqrt2$.

> [!tip] Remark
> Inside a PLL the VCO's phase noise reaches the output through a **high-pass**: the loop corrects slow drift (where $1/f^2$ and $1/f^3$ are large) and passes fast noise. Choosing the loop bandwidth against reference and VCO noise is [[Phased-Locked Loops]]; the open-loop $\sqrt{\Delta T}$ growth stopping near $1/f_L$ is also in [[Link Noise and Jitter#Jitter Generation]].

## Level 6: Oscillators for SerDes Clocking

### Ring or LC at tens of GHz

| | Ring VCO | LC VCO |
|---|---|---|
| Tuning range | wide: ~5× (Palermo L11), a decade or more (Casper; Carusone) | narrow: 20-30% (Palermo L11); 15-30% with a coarse bank (Casper) |
| Phase noise | higher ($Q\approx$ 1-1.5) | lower |
| Supply sensitivity | high (≈1%/1%) | lower, through $C_{DB}$ |
| Area | small | large (spiral several hundred µm per side) |
| Power vs $f$ | scales with $f$; very high within a decade of $f_T$ | set by tank loss; can rise at low $f$ as $Q$ drops |
| Phases | $2N$ for free | 2 (differential), quadrature needs extra circuitry |
| Use | multiphase, wide-range, low-cost clocks, local ILOs | the link's main PLL: high $f$, low jitter |

Carusone's rule: LC when high frequency or spectral purity is required, ring otherwise; LC is rarely worth its area around 1 GHz and below (§19.4.2).

**Real numbers from a 56 Gb/s design (Lee et al. 2015):** the PAM4 TX PLL runs at 28 GHz with a 26.9-28.5 GHz range (about 6%), sub-harmonic injection locking and an SSB-mixer PFD, about 500 fs rms. Its $\div2$ 14 GHz clock measured $-98.5$ dBc/Hz at 1 MHz and 508 fs (100 Hz-1 GHz). The NRZ TX's 56 GHz PLL landed at 58.4-61.2 GHz "because of the inaccurate device model": a narrow LC range leaves little room for model error, which is exactly why the coarse capacitor bank exists. 112 Gb/s links mostly use **quarter-rate 14 GHz** clocks because the distribution chain amplifies jitter near 28 GHz (Palermo L14 slide 11).

> [!tip] Remark
> At these frequencies the "lumped" tank is a piece of transmission line and the inductor's self-resonance limits $L$: [[Inductor]] and [[Transmission Lines]]. Clock distribution, CML buffers and dividers belong to [[High-Speed Circuit Techniques]].

### Quadrature clocks

Half-rate and quarter-rate links need clocks at $0^\circ, 90^\circ, 180^\circ, 270^\circ$ (I and Q). Ways to get them:

```tikz title="Quadrature by ÷2. A master-slave pair of latches with inverted feedback toggles once per input period. Latch 1 updates on the rising edge, latch 2 on the falling edge, half an input period later: a quarter of the output period, i.e. 90°. After Palermo L11 slide 106 and Lee 2015 Sec. III-B."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (1.4,1.6); \node at (0.7,0.8) {L1};
  \node[font=\scriptsize,anchor=west] at (0,1.3) {D}; \node[font=\scriptsize,anchor=east] at (1.4,1.3) {Q};
  \node[font=\scriptsize,anchor=south] at (0.7,0) {CK};
  \draw (2.6,0) rectangle (4.0,1.6); \node at (3.3,0.8) {L2};
  \node[font=\scriptsize,anchor=west] at (2.6,1.3) {D}; \node[font=\scriptsize,anchor=east] at (4.0,1.3) {Q};
  \node[font=\scriptsize,anchor=south] at (3.3,0) {$\overline{\mathrm{CK}}$};
  \draw[->] (1.4,1.3) -- (2.6,1.3);
  \draw (2.0,1.3) node[circ]{} -- (2.0,2.2) node[above,font=\scriptsize] {I};
  \draw (4.0,1.3) -- (4.6,1.3) node[circ]{} -- (4.6,2.2) node[above,font=\scriptsize] {Q};
  \draw (4.6,1.3) -- (4.6,-0.6) -- (-0.6,-0.6) -- (-0.6,1.3);
  \draw[->] (-0.6,1.3) -- (0,1.3);
  \node[font=\scriptsize,fill=white] at (2.0,-0.6) {invert};
  \draw (0.7,-0.25) -- (0.7,0); \draw (3.3,-0.25) -- (3.3,0);
  \begin{scope}[xshift=6.0cm,yshift=-0.6cm,x=0.45cm,y=0.5cm]
    \foreach \t in {0,2,4,6,8,10,12,14} { \draw[thick] (\t,4.4) -- (\t,5.2) -- ({\t+1},5.2) -- ({\t+1},4.4) -- ({\t+2},4.4); }
    \node[left,font=\scriptsize] at (0,4.8) {CK};
    \draw[thick] (0,3.6) -- (0,2.8) -- (2,2.8) -- (2,3.6) -- (4,3.6) -- (4,2.8) -- (6,2.8) -- (6,3.6) -- (8,3.6) -- (8,2.8) -- (10,2.8) -- (10,3.6) -- (12,3.6) -- (12,2.8) -- (14,2.8) -- (14,3.6) -- (16,3.6);
    \node[left,font=\scriptsize] at (0,3.2) {I};
    \draw[thick] (0,1.2) -- (3,1.2) -- (3,2.0) -- (5,2.0) -- (5,1.2) -- (7,1.2) -- (7,2.0) -- (9,2.0) -- (9,1.2) -- (11,1.2) -- (11,2.0) -- (13,2.0) -- (13,1.2) -- (15,1.2) -- (15,2.0) -- (16,2.0);
    \node[left,font=\scriptsize] at (0,1.6) {Q};
    \draw[<->] (2,0.6) -- (3,0.6) node[midway,below,font=\scriptsize] {$T_{in}/2=T_{out}/4$};
    \draw[dotted] (2,0.6) -- (2,3.6); \draw[dotted] (3,0.6) -- (3,2.0);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\div2:\ f_{out}=\frac{f_{in}}2,\quad \Delta\phi_{IQ}=180^\circ\cdot D_{in},\quad S_{\phi,out}=\frac{S_{\phi,in}}{4}\ (-6\text{ dB})}
$$

- **$\div2$ of a $2f$ VCO** (the usual SerDes choice: Lee divides "by two to generate quadrature clocks at 28 GHz"; Kim ISSCC 2019 builds IQ from a 14 GHz LC-PLL). The I-Q spacing equals the input's high time, so **input duty-cycle error is quadrature error**: $D_{in}=50\%$ gives $90^\circ$. Hence the duty-cycle correctors (DCC) and quadrature error correctors (QEC) after it, e.g. QEC by a differential offset inside the half-rate CML divider (Toprak-Deniz ISSCC 2018, in Palermo L14). The divider also divides phase by 2, so its output phase noise is 6 dB below the VCO's (plus the divider's own noise).
- **Four-stage differential ring** ([[#Differential rings even N and quadrature]]): quadrature for free, ring phase noise.
- **Quadrature LC-VCO:** two LC cores coupled so they lock $90^\circ$ apart (Casper Fig. 29b).
- **Injection-locked ring** generating 8 phases from an injected differential clock, with a frequency-tracking loop and a quadrature-locked loop trimming the phase error (Chen ISSCC 2018, Palermo L14 slide 22).

> [!note]- Derivation: why the I-Q spacing is the input's high time
> Latch 1 is transparent while CK is high and latch 2 while CK is low, with inverted feedback from L2 to L1. L1's output (I) changes at each rising edge of CK; L2 copies it at the next falling edge. Each output toggles once per input period, so $T_{out}=2T_{in}$. Q lags I by the time from a rising to the next falling edge, $D_{in}T_{in}=D_{in}T_{out}/2$, i.e. a phase of $360^\circ\cdot D_{in}/2=180^\circ D_{in}$. **Phase noise:** the output phase is the input phase divided by 2 ($\phi_{out}=\phi_{in}/N$ for any $\div N$, see [[#Level 4 The VCO as a Phase Integrator|harmonics]]), so $S_\phi$ drops by $N^2$.

### Injection locking

Inject a current $I_{inj}$ near the free-running frequency into an LC oscillator and, if it is strong enough, the oscillator abandons its own frequency and follows the injection. It is used as a jitter filter for a forwarded clock, as a de-skew phase shifter, for multiphase generation, and as a fast low-power frequency divider (Palermo L11 slide 112, L13 slides 21-31).

```tikz title="Locked to an injection at ω_inj ≠ ω0, the tank (driven by I_T) has phase φ0. The oscillator's own current I_osc is in phase with the tank voltage, so I_inj must add to I_osc to make I_T. Lock is lost when no angle θ can close the triangle: at the edge I_inj ⟂ I_T and sin φ0,max = I_inj/I_osc. After Palermo L13 slides 23-25 (from Razavi)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->,very thick] (0,0) -- (5,0) node[midway,below] {$I_{osc}$ (in phase with $V_{tank}$)};
  \draw[->,very thick,blue!70!black] (5,0) -- (5.8,1.6) node[midway,right] {$I_{inj}$};
  \draw[->,very thick,red!70!black] (0,0) -- (5.8,1.6) node[midway,above left] {$I_T$ (tank current)};
  \draw (1.6,0) arc (0:15.4:1.6);
  \node[font=\scriptsize] at (2.0,0.25) {$\phi_0$};
  \draw (5.5,0) arc (0:63.4:0.5);
  \node[font=\scriptsize] at (5.8,0.3) {$\theta$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.0,1.1) {$\tan\phi_0=\dfrac{2Q}{\omega_0}(\omega_0-\omega_{inj})$\\[3pt] tank phase grows with detuning};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_L=|\omega_0-\omega_{inj}|_{\max}=\frac{\omega_0}{2Q}\,\frac{I_{inj}}{I_{osc}}\,\frac{1}{\sqrt{1-I_{inj}^2/I_{osc}^2}}\approx\frac{\omega_0}{2Q}\frac{I_{inj}}{I_{osc}}}
$$

- **Lock range is inversely proportional to $Q$:** the high $Q$ that lowers phase noise makes the oscillator harder to pull. Example (Palermo L13 slide 26): $\omega_0=10$ GHz, $Q=5$, $I_{inj}/I_{osc}=0.1$ gives $\omega_L\approx100$ MHz.
- **Phase shift is a knob:** locked off-center, the output sits at $\phi_{ss}=\sin^{-1}\!\left(\frac{2Q}{\omega_0}\frac{\Delta\omega}{I_{inj}/I_{osc}}\right)$ from the injection, so tuning the free-running frequency (e.g. a capacitor DAC in a DCO) rotates the clock phase: ILO de-skew (Palermo L13 slides 27-30, Shekhar JSSC 2009, Hossain JSSC 2009).
- **Jitter transfer:** first-order **low-pass** from the injected clock, first-order **high-pass** from the oscillator's own noise. The tracking bandwidth rises with injection strength and falls as the lock moves away from $\omega_0$ (Palermo L13 slides 30-32). A PLL with a first-order loop, built from one oscillator.
- **Superharmonic injection** (inject at $2f_0$, lock at $f_0$) makes an injection-locked $\div2$: faster and lower power than flip-flop dividers, with a limited locking range (Palermo L11 slide 112). **Sub-harmonic injection** (inject a low-frequency pulse train) lets the reference realign the VCO edge every reference cycle, which is how Lee's 28 GHz PLL cleans its jitter.

> [!note]- Derivation: the lock range from the phasor triangle (Palermo L13 slides 23-26, after Razavi)
> A parallel tank driven off resonance has phase $\phi_0=\tan^{-1}\frac{L\omega\omega_0^2}{R_P(\omega_0^2-\omega^2)}$; near resonance $\omega_0^2-\omega^2\approx2\omega_0(\omega_0-\omega)$ and $L\omega_0/R_P=1/Q$, so $\tan\phi_0\approx\frac{2Q}{\omega_0}(\omega_0-\omega)$. The device current $I_{osc}$ follows the tank voltage, which leads the tank current $I_T$ by $\phi_0$; the triangle $I_T=I_{osc}+I_{inj}$ gives
> $$\sin\phi_0=\frac{I_{inj}\sin\theta}{I_T},\qquad I_T=\sqrt{I_{osc}^2+I_{inj}^2+2I_{osc}I_{inj}\cos\theta}.$$
> $\phi_0$ is largest when $I_{inj}\perp I_T$ ($\cos\theta=-I_{inj}/I_{osc}$), where $\sin\phi_{0,\max}=I_{inj}/I_{osc}$ and $\tan\phi_{0,\max}=\frac{I_{inj}/I_{osc}}{\sqrt{1-I_{inj}^2/I_{osc}^2}}$. Equating to $\frac{2Q}{\omega_0}\omega_L$ gives the boxed lock range.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ tank $Q$ (bigger, thicker-metal inductor) | Phase noise ($\propto1/Q^2$), lower $I_{SS}$ for a given swing, easier start-up | Area, injection lock range ($\propto1/Q$) |
| ↑ $I_{SS}$ (LC) | Swing $\frac2\pi I_{SS}R_P$, phase noise ($\propto1/P_{sig}$), start-up margin | Power; past the voltage limit no more swing |
| ↑ pair $W$ at fixed $I_{SS}$ (↑ $g_m/I_D$) | Start-up margin | Fixed capacitance: tuning range, max frequency |
| Bigger varactor / ↑ $K_{VCO}$ | Tuning range | Control-line noise $\times K_{VCO}$, varactor $Q$, PLL-bandwidth variation |
| Coarse capacitor bank | Range with small $K_{VCO}$ | Switch parasitics and their $Q$, band-select logic |
| Larger swing (LC) | Phase noise | Varactor control window $V_{DD}-A+0.3$ V |
| PMOS (or CMOS) cross-coupled core | Less flicker up-conversion, varactor wells out of the tank | Lower $g_m$ per amp |
| More ring stages $N$ | Lower gain per stage ($1/\cos(\pi/N)$), more phases | Lower $f_{osc}=1/(2NT_D)$, more power per frequency |
| Differential ring | Supply rejection, even $N$, quadrature | Tail headroom, CML static power |
| Replica-biased ring stage | Constant swing, linear $f\propto I_{SS}$ | Op-amp bandwidth slows the PLL |
| Supply regulator for a ring | Supply-pushing (≈1%/1%) | Headroom, its own noise into $V_{cont}$ |
| Ring instead of LC | Area, tuning range, phases, fast start-up | Phase noise, power near $f_T$ |
| $2f$ VCO + $\div2$ | Quadrature, 6 dB lower phase noise | VCO at twice the frequency; duty cycle sets I-Q error |
| Injection locking | Filters jitter, sets phase, divides at low power | Narrow lock range; needs frequency tracking |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Barkhausen | $|H(j\omega_0)|\ge1$, $\angle H(j\omega_0)=180^\circ$ (+ dc inversion) |
| Ring start-up, $N$ stages | $A_0\ge1/\cos(\pi/N)$, $\omega_{osc}=\omega_0\tan(\pi/N)$ |
| Three-stage ring | $A_0\ge2$, $\omega_{osc}=\sqrt3\,\omega_0$ |
| Four-stage differential ring | $A_0\ge\sqrt2$, $\omega_{osc}=\omega_0$ |
| Three-stage poles | $s_1=-(A_0+1)\omega_0$, $s_{2,3}=\left[\frac{A_0(1\pm j\sqrt3)}2-1\right]\omega_0$ |
| Switching ring frequency | $f_{osc}=1/(2NT_D)$ |
| Ring frequency from $g_m$ | $\omega_{osc}=\tan(\pi/N)\,g_m/(A_0C_L)$ |
| Diff ring swing | $I_{SS}R_P\le V_{TH}$ |
| Diff ring supply | $V_{DD}\ge V_{I_{SS}}+V_{TH}+\sqrt{I_{SS}/(\mu_nC_{ox}W/L)}+R_PI_{SS}/2$ |
| Series to parallel | $L_P\approx L_1$, $R_P\approx Q^2R_S=QL\omega$ |
| LC frequency | $\omega_{osc}=1/\sqrt{L_PC_P}$ |
| Cross-coupled start-up | $g_mR_P\ge1$ (design $g_mR_P\ge\alpha\approx$ 1.4-1.7) |
| LC amplitude | $A=\frac2\pi I_{SS}R_P$ per node |
| Colpitts | $\omega_R^2=1/[L_P(C_P+C_1C_2/(C_1+C_2))]$, $g_mR_P\ge(C_1+C_2)^2/(C_1C_2)\ge4$ |
| Negative resistances | follower + feedback $-2/g_m$; three-node $-g_m/(C_1C_2\omega^2)$ |
| $g_m/I_D$ of LC pair | $\ge4\alpha/(\pi A)$ |
| $g_m/I_D$ of ring stage | $\ge2A_0/V_{sw}$ |
| VCO | $\omega_{out}=\omega_0+K_{VCO}V_{cont}$, $K_{VCO}\ge(\omega_2-\omega_1)/(V_2-V_1)$ |
| Triode-load ring | $f\propto\mu_pC_{ox}\frac WL(V_{DD}-V_{cont}-|V_{THP}|)/C_L$ |
| Replica-biased ring | $f\propto I_{SS}/[(V_{DD}-V_{REF})C_L]$ |
| Junction varactor | $C_{var}=C_0/(1+V_R/\phi_B)^m$ |
| Tuning ratio | $f_{\max}/f_{\min}=\sqrt{(C_{var,\max}+C_{fix})/(C_{var,\min}+C_{fix})}$ |
| Varactor control window | $0<V_{cont}<V_{DD}-A+0.3$ V |
| Supply pushing | $K_{V_{DD}}=m\,\omega_{out}/[2\phi_B(1+V_{DD}/\phi_B)]$ |
| Excess phase | $\phi_{ex}=K_{VCO}\int V_{cont}dt$, $\Phi_{ex}/V_{cont}=K_{VCO}/s$ |
| Sidebands | amplitude $\frac{K_{VCO}V_m}{2\omega_m}V_0$ at $\omega_0\pm\omega_m$ |
| SSB phase noise | $\mathcal L(\Delta f)=S_v(f_0+\Delta f)/(A^2/2)\approx S_\phi(\Delta f)/2$ |
| Phase-noise model | $S_\phi=h_0+h_2/f^2+h_3/f^3$, $f_c=h_3/h_2$ |
| Leeson | $\mathcal L=10\log\left[\frac{2FkT}{P_{sig}}\left(1+\left(\frac{f_0}{2Q\Delta f}\right)^2\right)\left(1+\frac{\Delta f_{1/f^3}}{|\Delta f|}\right)\right]$ |
| $P$-cycle jitter | $\sigma_{J(P)}=\sqrt{h_2T_0^3P}$, $P_c\approx1/(25T_0f_c)$ |
| $\div2$ quadrature | $\Delta\phi_{IQ}=180^\circ D_{in}$, $S_{\phi,out}=S_{\phi,in}/4$ |
| Injection lock range | $\omega_L=\frac{\omega_0}{2Q}\frac{I_{inj}}{I_{osc}}\big/\sqrt{1-I_{inj}^2/I_{osc}^2}$ |
| ILO phase offset | $\phi_{ss}=\sin^{-1}\!\left(\frac{2Q\,\Delta\omega/\omega_0}{I_{inj}/I_{osc}}\right)$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 15 Oscillators, pp. 607-650:
  - §15.1 General considerations, pp. 607-609: Barkhausen, Figs. 15.1-15.3.
  - §15.2 Ring oscillators, pp. 609-618: Ex. 15.1-15.4, Eqs. 15.6-15.26, Figs. 15.8-15.18.
  - §15.3 LC oscillators, pp. 618-630: tank conversion Eqs. 15.27-15.36, cross-coupled Figs. 15.25-15.28, Colpitts Eqs. 15.37-15.47, one-port Eqs. 15.48-15.54, Figs. 15.32-15.39.
  - §15.4 VCOs, pp. 630-644: Eq. 15.55, Ex. 15.9, specs pp. 632-633, ring tuning Figs. 15.42-15.52 and Ex. 15.10-15.13, LC tuning Eq. 15.72, Ex. 15.14, Figs. 15.53-15.59.
  - §15.5 Mathematical model of VCOs, pp. 644-649: Eqs. 15.73-15.87, Ex. 15.15-15.17.
  - Problems 15.2, 15.7, 15.10, 15.15 (worked numbers above).
  - Razavi Ch. 15 has no phase-noise section; phase noise is from Carusone and the lectures below.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §19.1.1 VCO pp. 739-740 (Eqs. 19.1-19.7); §19.3 jitter and phase noise pp. 756-764 (Eqs. 19.53-19.61, 19.75-19.76, used for definitions only); §19.4 electronic oscillators pp. 765-776: classification Fig. 19.17, ring Eqs. 19.79-19.83 and Ex. 19.16-19.17, quadrature Fig. 19.21, replica-biased cell Fig. 19.23, LC Eqs. 19.84-19.85 and ring-vs-LC comparison, phase noise Eqs. 19.86-19.90, Figs. 19.27-19.32, Ex. 19.18.
- **Palermo, ECEN 720 (Texas A&M, 2025):** Lecture 11 (clocking architectures, PLLs): slide 40 (LC-VCO noise sources), 45 (Leeson's model), 92 (ring 5× vs LC 20-30%), 93-97 (Barkhausen and LC examples), 98-103 (supply-tuned, current-starved, symmetric-load rings, varactors), 106 (divide-by-2), 112 (injection-locked dividers). Lecture 13 (forwarded clocking): slides 21-32 (injection locking, lock range, ILO jitter transfer). Lecture 14 (clock distribution): slides 11-12 (quarter-rate 14 GHz clocking, IQ generation), 22 (ILO multiphase), 25-28 (DCC/QEC).
- **Casper & O'Mahony, "Clocking Analysis, Implementation and Measurement Techniques for High-Speed Data Links—A Tutorial," TCAS-I 2009:** phase-noise regions (Fig. 17), ring vs LC VCOs (Figs. 24-29): ring tuning range and $Q\approx$ 1-1.5, 1%/1% supply sensitivity, LC 15-30% with coarse bank.
- **Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," JSSC 2015:** Sec. II-III and measurements: 28 GHz PLL (26.9-28.5 GHz, sub-harmonic injection locking), $\div2$ quadrature, 14 GHz clock phase noise, 56 GHz PLL frequency offset.
- **Zettelkasten extensions** (`AnalogTheory/Oscillators/`, structure note `S13 Oscillators`): 13h1 (LC amplitude $\frac2\pi I_{SS}R_P$ from complete steering), 13p1 (tuning-ratio dilution by fixed capacitance, 11% example), 13d (large-signal $2NT_D$ and phase step $180^\circ/N$), 13k1 (peak $K_{VCO}$ exceeds the chord). The general-$N$ ring condition $A_0\ge1/\cos(\pi/N)$ and the $g_m/I_D$ sizing bounds are derived here from Razavi's equations.
