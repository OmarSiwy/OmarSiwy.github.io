---
title: Mixers and Microwave Oscillators
description: Microwave signal generation and frequency conversion - negative-resistance and S-parameter transistor oscillator design on the Smith chart, Kurokawa stability, dielectric-resonator oscillators, frequency multipliers, and mixers from the single diode to the Gilbert cell and the image-reject mixer.
kind: topic
status: growing
aliases:
  - Mixers and Microwave Oscillators
  - Mixers
  - Mixer
  - Microwave Oscillators
  - Negative-Resistance Oscillators
  - Frequency Multipliers
---

This note covers the two jobs a microwave front end needs besides amplifying and filtering: making a carrier (an oscillator, sometimes followed by a multiplier) and moving a signal from one frequency to another (a mixer). Circuit-level oscillator theory (Barkhausen, ring/LC/Colpitts, VCOs, Leeson phase noise, injection locking) lives in [[Oscillators]]. Here the oscillator is designed the microwave way: as a reflection amplifier with $|\Gamma|>1$, on the Smith chart. Mixers are owned here completely. As in [[MosFETs]], each section opens the box one level further.

## The big picture

```tikz title="Left: every microwave oscillator is a device with negative input resistance terminated by a passive load; it oscillates when Z_L = -Z_in, i.e. Gamma_L Gamma_in = 1. Right: a mixer multiplies RF by LO; the IF filter keeps f_RF - f_LO, but the image at f_LO - f_IF lands on the same IF. After Pozar Figs. 13.6 and 13.24(b), binder p. 407."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,dashed,rounded corners=4pt] (-1.5,-0.4) rectangle (1.3,2.6);
  \draw (0.6,2.2) to[generic,l_=$jX_{in}$] (0.6,1.1) to[R,l_=$R_{in}<0$] (0.6,-0.1);
  \node[font=\scriptsize,align=center] at (-0.1,-1.0) {active device (diode,\\or transistor + term.\ net)};
  \draw (0.6,2.2) -- (4.0,2.2) to[generic,l=$jX_L$] (4.0,1.1) to[R,l=$R_L>0$] (4.0,-0.1) -- (0.6,-0.1);
  \draw[->] (2.2,0.9) -- (1.6,0.9) node[above,font=\scriptsize] {$\Gamma_{in}$};
  \draw[->] (2.6,0.9) -- (3.2,0.9) node[above,font=\scriptsize] {$\Gamma_L$};
  \node[font=\scriptsize,align=center] at (3.0,-1.0) {oscillates if $Z_L=-Z_{in}$\\$\Leftrightarrow\ \Gamma_L\Gamma_{in}=1$};
  \begin{scope}[xshift=8.6cm,yshift=1.3cm]
    \draw[thick] (0,0) circle (0.45);
    \draw[thick] (-0.32,-0.32) -- (0.32,0.32) (-0.32,0.32) -- (0.32,-0.32);
    \draw[->] (-2.0,0) node[left] {RF $f_{RF}$} -- (-0.45,0);
    \draw[->] (0,-1.3) node[below] {LO $f_{LO}$} -- (0,-0.45);
    \draw[->] (0.45,0) -- (1.5,0);
    \draw (1.5,-0.35) rectangle (2.4,0.35); \node[font=\scriptsize] at (1.95,0) {LPF};
    \draw[->] (2.4,0) -- (3.1,0) node[right] {IF};
  \end{scope}
  \begin{scope}[xshift=6.6cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (6.4,0) node[right] {$f$};
    \draw[very thick,->] (0.6,0) -- (0.6,0.9) node[above,font=\scriptsize] {$f_{IF}$};
    \draw[very thick,->,red!70!black] (2.9,0) -- (2.9,0.7) node[above,font=\scriptsize] {image};
    \draw[very thick,->,blue!70!black] (4.0,0) -- (4.0,1.3) node[above,font=\scriptsize] {LO};
    \draw[very thick,->] (5.1,0) -- (5.1,0.7) node[above,font=\scriptsize] {RF};
    \draw[<->] (2.9,-0.3) -- (5.1,-0.3) node[midway,below,font=\scriptsize] {$2f_{IF}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Oscillation = negative resistance cancelling the load:** $R_{in}+R_L=0$ and $X_{in}+X_L=0$, equivalently $\Gamma_L\Gamma_{in}=1$. For start-up the small-signal $R_{in}$ must be *more* negative than $-R_L$: design $R_L=-R_{in}/3$, which for a linearly limiting device is also the maximum-power point.
> 2. **Kurokawa:** the steady state is stable if $\frac{\partial R_{in}}{\partial I}\frac{\partial(X_L+X_{in})}{\partial\omega}>0$. The device supplies $\partial R_{in}/\partial I>0$; a steep reactance slope, i.e. a **high-$Q$ resonator**, does the rest. That is why DROs exist.
> 3. **Two-port oscillator:** use an *unstable* transistor (common gate/base plus series feedback), pick $\Gamma_L$ in its unstable region to make $|\Gamma_{in}|\gg1$, then terminate the input with $Z_S=-R_{in}/3-jX_{in}$. Oscillation at the input forces oscillation at the output ($\Gamma_S\Gamma_{in}=1\Rightarrow\Gamma_L\Gamma_{out}=1$).
> 4. **Multipliers** raise phase noise by $20\log n$. Lossless reactive (varactor) multipliers can reach 100% efficiency; resistive (Schottky) ones at most $1/m^2$.
> 5. **Mixer:** $f_{IF}=|f_{RF}-f_{LO}|$; the **image** $f_{LO}\mp f_{IF}$ sits $2f_{IF}$ from the wanted RF and must be removed *before* the mixer. Diode conversion loss 4-7 dB, best at 0-10 dBm LO; $F_{SSB}=2F_{DSB}$ (3 dB).
> 6. **Balance buys isolation:** a 90° hybrid gives a matched RF port, a 180° hybrid RF-LO isolation, a double-balanced mixer (diode ring, Gilbert cell) isolation at all three ports, even-order rejection and the best IIP3. An image-reject mixer separates the two sidebands with two hybrids.

**Map:** [[#Physics background|negative resistance, mixing as multiplication, Manley-Rowe]] → [[#Spec translation|$f_0$, $P_{out}$, $\mathcal L$, $G_c$, NF, IIP3 → device and topology]] → [[#Level 0 The One-Port Negative-Resistance Oscillator|one-port, Kurokawa, $R_0/3$]] → [[#Level 1 The Two-Port Transistor Oscillator|two-port, stability circle, Smith chart]] → [[#Level 2 Dielectric Resonator Oscillators|DRO]] → [[#Level 3 Phase Noise What Pozar Adds|phase noise extras]] → [[#Level 4 Frequency Multipliers|multipliers]] → [[#Level 5 Mixer Characteristics|image, $L_c$, SSB/DSB NF, isolation, LO feedthrough]] → [[#Level 6 Single-Ended Mixers|diode and FET mixers]] → [[#Level 7 Balanced, Double-Balanced and Image-Reject Mixers|balanced, Gilbert, image reject]].

## Physics background

### Negative Resistance Is a Power Source

A positive resistance absorbs power; a negative one delivers it (Pozar §13.2). No passive part has $R<0$, so it always comes from a biased active device that converts DC into RF:

- **Diodes with a negative-slope I-V** (Gunn, IMPATT, tunnel): the one-port oscillators of mm-wave.
- **A transistor with positive feedback** whose input reflection exceeds one: $|\Gamma_{in}|>1\Leftrightarrow R_{in}<0$ (for $Z_0>0$).

> [!tip] Remark
> The diode physics (transferred-electron effect, avalanche transit time) is in [[Active RF Devices#Other Microwave Diodes]]. How positive feedback makes $-2/g_m$ in a CMOS LC tank is [[Oscillators#Negative resistance the one-port view]]: same idea, lumped instead of on the Smith chart.

$$
\boxed{|\Gamma|=\left|\frac{Z-Z_0}{Z+Z_0}\right|>1\iff \operatorname{Re}Z<0}
$$

A reflection coefficient larger than one is a **reflection amplifier**: more power comes back than went in. Close the loop with a load whose reflection is exactly $1/\Gamma_{in}$ and the wave sustains itself.

> [!note]- Detail: reading negative resistances on a standard Smith chart (Pozar Prob. 13.4)
> $|\Gamma_{in}|>1$ lies outside the chart. Plot $1/\Gamma_{in}^*$ instead (it is inside), read $r+jx$ there, and take the resistance as **negative** and the reactance as is. Example 13.2's $\Gamma_{in}=1.25\angle40^\circ$ gives $1/\Gamma_{in}^*=0.8\angle40^\circ$, which reads $0.88+j2.47$, i.e. $Z_{in}\approx-44+j123\ \Omega$. Problem 13.4 asks you to prove this; the proof is one line: $z(1/\Gamma^*)=\frac{1+1/\Gamma^*}{1-1/\Gamma^*}=\frac{\Gamma^*+1}{\Gamma^*-1}=-z(\Gamma)^*$.

### Mixing Is Multiplication

A mixer needs a term proportional to $v_{RF}\cdot v_{LO}$. Two ways to get one:

$$
\boxed{\text{square law: } i=I_0+G_dv+\tfrac{G_d'}{2}v^2+\dots,\ v=v_{RF}+v_{LO}\ \Rightarrow\ i\ni G_d'V_{RF}V_{LO}\cos\omega_{RF}t\cos\omega_{LO}t}
$$

$$
\boxed{\text{switching: } g(t)=\tfrac12+\tfrac{2}{\pi}\cos\omega_{LO}t-\tfrac{2}{3\pi}\cos3\omega_{LO}t+\dots}
$$

- **Square-law (small-signal) view:** the $v^2$ term of a diode or FET makes $2v_{RF}v_{LO}$, which is the sum and difference. Every other term ($2\omega_{RF}$, $2\omega_{LO}$, DC) is filtered or blocked (Pozar Eqs. 13.100-13.101).
- **Switching (large-LO) view:** the LO turns a device fully on and off; the RF current is multiplied by a square wave whose fundamental is $2/\pi$ (Pozar Eq. 13.124). Real mixers sit closer to this view, since the LO is large (0-10 dBm).

> [!tip] Remark
> The power series is the same one used for distortion in [[Nonlinearity and Mismatch#The Polynomial Model]]: in an amplifier $a_2$ is a nuisance (IM2), in a mixer it is the wanted product, and $a_3$ is still the enemy (IM3). The Schottky diode's $G_d'=\alpha G_d$ is the detector curvature of [[Active RF Devices#Schottky Detectors]].

### Power Conservation in Nonlinear Elements

$$
\boxed{\text{Manley-Rowe (lossless reactance): }\sum_{n=0}^{\infty}\sum_{m=-\infty}^{\infty}\frac{nP_{nm}}{n\omega_1+m\omega_2}=0,\qquad \sum_{n=-\infty}^{\infty}\sum_{m=0}^{\infty}\frac{mP_{nm}}{n\omega_1+m\omega_2}=0}
$$

$$
\boxed{\text{multiplier, reactive: }\left|\frac{P_{n0}}{P_{10}}\right|=1\ \text{possible}\qquad\text{resistive: }\left|\frac{P_m}{P_1}\right|\le\frac{1}{m^2}}
$$

- A nonlinear **capacitor** dissipates nothing, so all the input power can, in principle, land in one harmonic (Pozar Eq. 13.61). Losses and matching make the real number 50-80%.
- A nonlinear **resistor** with positive slope everywhere dissipates, and the best it can do at the $m$th harmonic is $1/m^2$: 25% for a doubler, 11% for a tripler (Pozar Eq. 13.69).

> [!note]- Derivation: Manley-Rowe (Pozar §13.4, Eqs. 13.51-13.61)
> Drive a lossless nonlinear capacitor $Q=a_0+a_1v+a_2v^2+\dots$ at $\omega_1$ and $\omega_2$ (incommensurate), with ideal filters routing each product $n\omega_1+m\omega_2$ to its own resistor. Expand $v=\sum V_{nm}e^{j(n\omega_1+m\omega_2)t}$, $Q$ likewise, $I_{nm}=j(n\omega_1+m\omega_2)Q_{nm}$. Power at each product (dropping a factor 4) is $P_{nm}=V_{nm}I^*_{nm}+V^*_{nm}I_{nm}=P_{-n,-m}$.
>
> Lossless: $\sum_{n,m}P_{nm}=0$. Multiply each term by $(n\omega_1+m\omega_2)/(n\omega_1+m\omega_2)$ and split:
> $$\omega_1\sum\frac{nP_{nm}}{n\omega_1+m\omega_2}+\omega_2\sum\frac{mP_{nm}}{n\omega_1+m\omega_2}=0.$$
> Each double sum is $\sum n(-jV_{nm}Q^*_{nm}-jV_{-n,-m}Q^*_{-n,-m})$ and depends only on the $V$'s and $Q$'s, which the external circuit can hold fixed while $\omega_1,\omega_2$ vary. So each sum vanishes separately; folding negative indices with $P_{-n,-m}=P_{nm}$ gives the boxed pair.
>
> **Multiplier:** one source, $m=0$: $\sum_{n\ge1}P_{n0}=0$, i.e. $\sum_{n\ge2}P_{n0}=-P_{10}$. Terminate every harmonic but the $n$th in a reactance and $|P_{n0}/P_{10}|=1$.

> [!note]- Derivation: the $1/m^2$ limit for a nonlinear resistor (Pozar Eqs. 13.62-13.69)
> Single source at $\omega$; $v=\sum V_me^{jm\omega t}$, $i=\sum I_me^{jm\omega t}$, $P_m=V_mI_m^*+V_m^*I_m$. Multiply $V_m$ by $-m^2I_m^*$ and sum; use $\partial^2i/\partial t^2=-\sum m^2\omega^2I_m^*e^{-jm\omega t}$ and integrate by parts over one period (the boundary term vanishes by periodicity):
> $$\sum_{m=0}^\infty m^2P_m=\frac{1}{2\pi\omega}\int_0^T\frac{\partial i}{\partial v}\left(\frac{\partial v}{\partial t}\right)^2dt\ \ge 0$$
> for a resistor whose slope $\partial i/\partial v$ is always positive. With only the fundamental and the $m$th harmonic loaded: $P_1+m^2P_m\ge0$. $P_1>0$ (delivered by the source), $P_m<0$ (delivered by the device), so $|P_m/P_1|\le1/m^2$.

## Spec translation

### The block's specs

| Block | Spec | What it is | Typical (Pozar Ch. 13) |
|---|---|---|---|
| Oscillator | $f_0$ | Steady-state frequency, set by $X_L+X_{in}=0$ at the *large-signal* $Z_{in}$ | microwave to lower mm-wave (DROs) |
| | $P_{out}$ | Power into the load at steady state | Gunn: up to several hundred mW CW ([[Active RF Devices#Other Microwave Diodes]]) |
| | Phase noise $\mathcal L(f_m)$ | SSB noise / carrier in 1 Hz at offset $f_m$ | cellular: $-110$ dBc/Hz at 25 kHz |
| | Stability (pulling, drift) | How fast $\Gamma_{out}$ or $X$ changes with $\omega$ | DR $Q_0$ up to several thousand |
| Multiplier | Conversion gain / efficiency, harmonic $n$ | $P_n/P_{avail}$ | varactor 50-80% at 50 GHz; FET doubler a few dB gain |
| Mixer | Conversion loss $L_c$ / gain $G_c$ | available RF in / available IF out | diode 4-7 dB loss (1-10 GHz); transistor a few dB gain |
| | Noise figure (SSB/DSB) | | 1-5 dB, diodes lower than transistors |
| | IIP3 | input third-order intercept | 15-30 dBm |
| | RF-LO isolation | LO power leaking out of the RF port | 20-40 dB |
| | LO drive | LO power for minimum $L_c$ | 0-10 dBm |
| | Image rejection, port match | | topology dependent (Table 13.1) |

### Mapping block specs to device and amplifier specs

The "amplifier" inside an oscillator is the active device run as a **reflection amplifier**: its specs are how negative $R_{in}$ is (instability, set by $|S_{11}'|$, $K<1$), how fast $R_{in}$ rises with amplitude (sets $P_{out}$), $f_{max}$, and noise ($F$, flicker corner). Inside a CMOS mixer there is a **transconductor** (the RF pair of the Gilbert cell, an amplifier in the [[Single-Stage#Amplifier Specifications]] sense) and **switches** (the LO quad).

| Block spec | Device / amplifier inside | Amplifier / device spec that sets it | Condition |
|---|---|---|---|
| Oscillator start-up | Device + terminating network | Small-signal $R_{in}$ (from $\lvert\Gamma_{in}\rvert>1$), stability factor $K<1$ | $R_L=-R_{in}/3$ (one-port) or $Z_S=-R_{in}/3-jX_{in}$ |
| Oscillator $P_{out}$ | Device large-signal $R_D(I)=-R_0+aI$ | Small-signal $R_0$ and saturation slope $a$ | $P_{max}=\frac{4R_0^3}{27a^2}$ at $R_L=R_0/3$ |
| Oscillator $f_0$ | Device reactance + resonator | $f_{max}$ above $f_0$; $X_{in}$ at large signal | $X_L=-X_{in}$ |
| Oscillator stability, phase noise | Resonator + device | Resonator $Q_0$; device $F$, flicker corner $f_\alpha$; signal power $P_0$ | $S_\phi\propto\frac{F}{P_0}\frac{1}{Q_0^2}$ near carrier |
| LO phase noise requirement | Whole receiver | Blocker level $I$, selectivity $S$, IF bandwidth $B$ | $\mathcal L(f_m)=C-S-I-10\log B$ |
| Mixer conversion gain | Transconductor + switches (Gilbert) or LO-pumped $g_m$ (FET) | Transconductance $g_m$ (or $g_1$), load $R_D$ | $\frac{2}{\pi}g_mR_D$ (switching); $G_c=\frac{g_1^2R_d}{4\omega^2C_{gs}^2R_i}$ (FET) |
| Mixer NF | Transconductor, preceding LNA gain | Input-referred noise; conversion gain | Friis with $F_{SSB}=2F_{DSB}$ |
| Mixer IIP3 | Transconductor | Linearity (degeneration, $V_{OV}$) | double-balanced best |
| Mixer isolation, LO feedthrough | Balance of quad / hybrids | Matching of the devices | 180° hybrid or double balance |
| LO drive | Switches | Swing that fully steers each pair | $V_{LO}\ge\sqrt2\,V_{OV,sw}$ |

> [!note]- Derivation: $P_{max}=4R_0^3/(27a^2)$ (from binder pp. 383-385; the closed form is ours)
> With $X_L=-X_D$ the loop is resistive. The binder models the diode's negative resistance as falling linearly with current, $R_D=-R_0+aI$. Steady state needs $R_L=-R_D=R_0-aI$, so the load sets the current: $I=(R_0-R_L)/a$. Power into the load:
> $$P_L=I^2R_L=I^2(R_0-aI)\quad\Rightarrow\quad\frac{dP_L}{dI}=2IR_0-3aI^2=0\ \Rightarrow\ I=\frac{2R_0}{3a},\ R_L=\frac{R_0}{3}.$$
> Substituting, $P_{max}=\frac{4R_0^2}{9a^2}\cdot\frac{R_0}{3}=\frac{4R_0^3}{27a^2}$. The binder's 10 GHz example ($R_0=120\ \Omega$, $a=1200\ \Omega/\text{A}$) gives $4\cdot120^3/(27\cdot1200^2)=177.8$ mW, matching its $I_L^2R_L=(66.7\text{ mA})^2(40\ \Omega)$.

> [!note]- Derivation: LO swing for full switching (ours, from the pair's steering range)
> A differential pair steers all of its tail current to one side once $|\Delta V_{in}|\ge\sqrt2\,V_{OV}$ ([[Differential Amplifiers#Large-Signal Characteristic]]). For the LO quad to act as the ideal switch that gives the $2/\pi$ factor, the differential LO amplitude must exceed $\sqrt2\,V_{OV,sw}$ for most of the cycle. With $V_{OV}=2/(g_m/I_D)$ (square law), $(g_m/I_D)_{sw}\ge 2\sqrt2/V_{LO}$. A small LO therefore needs switches near weak inversion (wide, low $V_{OV}$); a large LO lets them be small and fast. This is the CMOS counterpart of Pozar's "minimum conversion loss at 0-10 dBm of LO".

$$
\boxed{\text{osc: }R_L=\frac{R_0}{3},\ P_{max}=\frac{4R_0^3}{27a^2}}\qquad
\boxed{\text{LO: }\mathcal L(f_m)\le C-S-I-10\log B}\qquad
\boxed{\text{Gilbert: }A_c=\frac{2}{\pi}g_mR_D,\ \ V_{LO}\ge\sqrt2\,V_{OV,sw}}
$$

### Where it lands in sizing

| Mixer / oscillator spec | Fixes | How |
|---|---|---|
| Conversion gain $A_c$, load $R_D$ (headroom) | $g_m$ of the RF transconductor | $g_m=\frac{\pi A_c}{2R_D}$ |
| IIP3 (vs NF) | $g_m/I_D$ of the transconductor, degeneration | lower $g_m/I_D$ (higher $V_{OV}$) or source degeneration for IIP3; higher $g_m$ for NF |
| Transconductor current | $I_D$ | $I_D=g_m/(g_m/I_D)$ |
| LO amplitude available | $g_m/I_D$ of the switches | $(g_m/I_D)_{sw}\ge2\sqrt2/V_{LO}$; $L=L_{min}$ so the switches toggle fast |
| Oscillator frequency | device $f_T$, $f_{max}$ | device must keep $\lvert S_{11}'\rvert>1$ (or $K<1$) at $f_0$ with feedback |
| Oscillator phase noise | device type, resonator | low flicker corner (Si BJT 5-50 kHz beats GaAs MESFET 2-10 MHz), DR for $Q_0$ |

> [!tip] Remark
> Turning $g_m/I_D$ and $I_D$ into $W$ and $L$ is [[gm-ID Design Methodology]]; device background in [[MosFETs#gm/ID and ID/W Simulation-Aided Design]]. Why degeneration and lower $g_m/I_D$ buy IIP3 is [[Nonlinearity and Mismatch#Resistive Degeneration]].

### Worked examples

> [!example] Receiver spec → LO phase noise (Pozar Ex. 13.5, GSM)
> Carrier $C=-99$ dBm, selectivity $S=9$ dB, channel $B=200$ kHz, so $10\log B=53$ dB. $\mathcal L(f_m)=-99-9-I-53$:
>
> | Offset $f_m$ | Interferer $I$ | Required $\mathcal L(f_m)$ |
> |---|---|---|
> | 3.0 MHz | $-23$ dBm | $-138$ dBc/Hz |
> | 1.6 MHz | $-33$ dBm | $-128$ dBc/Hz |
> | 0.6 MHz | $-43$ dBm | $-118$ dBc/Hz |
>
> No free-running microwave oscillator does this: the spec translates to "phase-locked synthesizer" ([[Phased-Locked Loops]]), and in GSM reciprocal mixing, not thermal noise, dominates the bit errors.

> [!example] Choosing the mixer by noise (Pozar Prob. 13.18, our solution)
> Diode mixer: $L_c=5$ dB, $F=4$ dB. FET mixer: $G_c=+3$ dB, $F=8$ dB. Each is followed by an IF amplifier with 30 dB gain and noise figure $F_A$. Friis: $F=F_m+(F_A-1)/G_m$.
>
> | $F_A$ (dB) | 0 | 2 | 5 | 10 |
> |---|---|---|---|---|
> | diode + IF amp (dB) | 4.0 | 6.4 | 9.7 | 14.9 |
> | FET + IF amp (dB) | 8.0 | 8.2 | 8.7 | 10.3 |
>
> The curves cross at $F_A\approx3.9$ dB. Below that the quiet diode wins; above it the FET's conversion *gain* hides the IF amplifier. Conversion gain is a noise spec.

## Level 0: The One-Port Negative-Resistance Oscillator

### The Oscillation Condition

$$
\boxed{(Z_L+Z_{in})I=0\ \Rightarrow\ R_L+R_{in}=0,\quad X_L+X_{in}=0}\qquad
\boxed{\Gamma_L=\frac{1}{\Gamma_{in}}}
$$

- $R_L>0$ forces $R_{in}<0$. The reactance condition sets the frequency (Pozar Eqs. 13.24-13.26).
- $Z_{in}=Z_{in}(I,j\omega)$ depends on amplitude. The equations hold at the **steady-state** current $I_0$; the start-up frequency generally differs from $\omega_0$ because $X_{in}$ moves with $I$.

> [!tip] Remark
> $\Gamma_L\Gamma_{in}=1$ is the loop condition of the two-node signal-flow graph (binder p. 377): $a_L=a_n\Gamma_{in}/(1-\Gamma_L\Gamma_{in})$ blows up when the denominator vanishes. It is Barkhausen ([[Oscillators#Barkhausen's criteria]]) written in waves, and the same denominator that [[Microwave Network Analysis#Signal Flow Graphs]] uses for mismatch loops.

**Worked (Pozar Ex. 13.2):** a diode has $\Gamma_{in}=1.25\angle40^\circ$ at 6 GHz ($Z_0=50\ \Omega$). Match it to 50 Ω.
1. $Z_{in}=Z_0\frac{1+\Gamma_{in}}{1-\Gamma_{in}}=-44+j123\ \Omega$.
2. $Z_L=-Z_{in}=44-j123\ \Omega$, i.e. $\Gamma_L=1/\Gamma_{in}=0.8\angle-40^\circ$.
3. From the 50 Ω load: an open shunt stub $0.308\lambda$ moves the centre along the $g=1$ circle to $y=1-j2.62$; a $0.254\lambda$ line rotates it $183^\circ$ clockwise to $\Gamma_L$ (Pozar Fig. 13.7; we checked: the network gives $44.0-j122.8\ \Omega$).

```tikz title="Pozar Example 13.2 on the Smith chart. The diode's Gamma_in = 1.25 at 40 degrees is off the chart; its required load Gamma_L = 1/Gamma_in = 0.8 at -40 degrees. From 50 ohms, an open stub moves along g = 1 (blue), then 0.254 lambda of line rotates toward the generator (green). The open dot is 1/Gamma_in*, where the negative resistance can be read (Prob. 13.4)."
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
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[blue!25,thin,dashed] (-0.5,0) circle (0.5);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\node[font=\tiny,text=gray!80!black,above] at (0.0000,1.0000) {$+j1$};
\node[font=\tiny,text=gray!80!black,below] at (0.0000,-1.0000) {$-j1$};
\draw[dashed,green!50!black] (0,0) circle (0.795);
\draw[->,very thick,blue!70!black] (0,0) arc[start angle=0, end angle=105.3, radius=0.5];
\draw[->,very thick,green!50!black] (-0.632,0.482) arc[start angle=142.66, end angle=-40.22, radius=0.795];
\fill (0,0) circle (0.022); \node[font=\scriptsize,below right] at (0,0) {50 $\Omega$};
\fill (-0.632,0.482) circle (0.022); \node[font=\scriptsize,above left] at (-0.632,0.482) {$y=1-j2.62$};
\fill (0.607,-0.513) circle (0.022); \node[font=\scriptsize,below right] at (0.607,-0.513) {$\Gamma_L=0.8\angle-40^\circ$};
\draw[thick,fill=white] (0.613,0.514) circle (0.026); \node[font=\scriptsize,above right] at (0.613,0.514) {$1/\Gamma_{in}^*$: read $-0.88+j2.47$};
\node[font=\scriptsize,text=blue!70!black,anchor=west] at (-1.0,-1.12) {open stub $0.308\lambda$};
\node[font=\scriptsize,text=green!40!black,anchor=west] at (0.1,-1.12) {line $0.254\lambda$ = $183^\circ$ cw};
\end{scope}
\end{circuitikz}
\end{document}
```

### Start-Up and Steady State: Kurokawa

```tikz title="Start-up and steady state for a linearly limiting device, R_D = -R_0 + aI (binder pp. 383-384). Small signal |R_D| = R_0 exceeds R_L, so the current grows until |R_D| falls to R_L. The load power I^2 R_L peaks when R_L = R_0/3, at I = 2R_0/(3a). Numbers from the binder's 10 GHz example: R_0 = 120 ohm, a = 1200 ohm/A."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.07cm,y=0.03cm]
  \draw[->] (0,0) -- (108,0) node[right] {$I$ (mA)};
  \draw[->] (0,0) -- (0,135) node[above] {$-R_D$ ($\Omega$)};
  \foreach \x in {0,20,40,60,80,100} { \draw (\x,1.5) -- (\x,-1.5) node[below,font=\scriptsize] {\x}; }
  \foreach \y in {40,80,120} { \draw (1,\y) -- (-1,\y) node[left,font=\scriptsize] {\y}; }
  \draw[very thick,blue!70!black] (0,120) -- (100,0);
  \node[font=\scriptsize,text=blue!70!black,anchor=west] at (8,118) {$-R_D=R_0-aI$};
  \draw[dashed] (0,40) -- (104,40) node[right,font=\scriptsize] {$R_L=R_0/3$};
  \draw[dashed] (66.7,0) -- (66.7,130);
  \node[font=\scriptsize,anchor=west] at (67,8) {$I_0=66.7$ mA};
  \draw[very thick,red!70!black,domain=0:100,samples=60] plot (\x,{0.7*(\x/10)*(\x/10)*(120-1.2*\x)/10});
  \node[font=\scriptsize,text=red!70!black,anchor=west] at (82,128) {$P_L=I^2(R_0-aI)$};
  \node[font=\scriptsize,text=red!70!black,anchor=west] at (82,119) {max 177.8 mW};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{start-up: } R_{in}(I\to0)+R_L<0}\qquad
\boxed{\text{Kurokawa: } \frac{\partial R_T}{\partial I}\frac{\partial X_T}{\partial\omega}-\frac{\partial X_T}{\partial I}\frac{\partial R_T}{\partial\omega}>0}
$$

$$
\boxed{\text{passive load: } \frac{\partial R_{in}}{\partial I}\frac{\partial(X_L+X_{in})}{\partial\omega}-\frac{\partial X_{in}}{\partial I}\frac{\partial R_{in}}{\partial\omega}>0}
$$

- **Build-up:** any noise grows while $R_{in}(I)+R_L<0$. As $I$ grows, $R_{in}$ becomes less negative until $R_{in}(I_0)+R_L=0$: the steady state.
- **Not every steady state is stable.** Kurokawa's condition asks that a small kick in current or frequency decays. Since usually $\partial R_{in}/\partial I>0$, it holds when $\partial(X_L+X_{in})/\partial\omega\gg0$: a steep reactance slope, i.e. **high $Q$**. Cavities and dielectric resonators are used for exactly this (Pozar Eqs. 13.27-13.30).
- Left open by Pozar (to Vendelin and Maas): choosing the operating point for maximum power, frequency pulling, large-signal effects and noise.

> [!note]- Derivation: Kurokawa's condition (Pozar Eqs. 13.27-13.29)
> Let $Z_T(I,s)=Z_{in}(I,s)+Z_L(s)$ with $s=\alpha+j\omega$. Perturb the steady state $(I_0,s_0=j\omega_0)$ by $\delta I$, $\delta s$ while keeping $Z_T=0$:
> $$Z_T(I_0,s_0)+\frac{\partial Z_T}{\partial s}\delta s+\frac{\partial Z_T}{\partial I}\delta I=0.$$
> With $Z_T(I_0,s_0)=0$ and $\partial Z_T/\partial s=-j\,\partial Z_T/\partial\omega$:
> $$\delta s=\delta\alpha+j\delta\omega=\frac{-j\,(\partial Z_T/\partial I)(\partial Z_T^*/\partial\omega)}{|\partial Z_T/\partial\omega|^2}\delta I.$$
> A transient decays if $\delta\alpha<0$ whenever $\delta I>0$ (an amplitude increase must create damping). That is $\operatorname{Im}\{\frac{\partial Z_T}{\partial I}\frac{\partial Z_T^*}{\partial\omega}\}<0$, which expands to the boxed form. A passive load has no $I$ dependence and $\partial R_L/\partial\omega=0$, leaving the second box.

### Maximum Power: Load at $R_0/3$

$$
\boxed{\text{start: } Z_L=-Z_D\quad(R_L\le R_0)\qquad\text{max power: } Z_L=\frac{R_0}{3}-jX_D}
$$

(Binder pp. 380-385.) The reactance tunes the frequency; the resistance is a third of the small-signal $|R_D|$, which leaves margin for start-up (as with $R_S=-R_{in}/3$ in the two-port case) and, for a linearly limiting device, maximizes $P_L$.

> [!example] One-port diode oscillator at 10 GHz (binder pp. 386-388)
> A diode is $R_{in}=-120\ \Omega$ in series with $C_{in}=2$ pF at small signal, and $R_{in}=-60\ \Omega$ (same $C$) at 50 mA. Assume $R_{in}$ linear in current. Design for maximum power into 50 Ω.
> 1. Linear model: $-R_D=120-1200I$. Max power at $R_L=120/3=40\ \Omega$, reached at $I_0=(120-40)/1200=66.7$ mA.
> 2. Reactance: $X_{in}=-1/(\omega C_{in})=-j7.96\ \Omega$, so $Z_{in}=-40-j7.96$ and $Z_L=40+j7.96\ \Omega$.
> 3. Network: $0.127$ nH in series tunes out $C_{in}$; a $\lambda/4$ line of $\sqrt{40\cdot50}=44.7\ \Omega$ turns 50 Ω into 40 Ω. A 20 pF DC block is $0.8\ \Omega$ at 10 GHz, small against 50 Ω.
> 4. $P_L=I_0^2R_L=(66.7\text{ mA})^2(40)=177.8$ mW.
>
> ```tikz title="Binder p. 387: 10 GHz diode oscillator. A series inductor tunes out the diode capacitance; a 44.7-ohm quarter-wave line makes the 50-ohm load look like 40 ohm = R_0/3."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[>=stealth,font=\small]
>   \draw (0,0) node[ground]{} to[D*,l=diode,invert] (0,1.6) to[L,l=$0.127$ nH] (2.4,1.6) node[circ]{} -- (3.0,1.6);
>   \draw (2.4,1.6) to[L,l_=RFC] (2.4,3.2) node[above]{$V_{dd}$};
>   \draw (3.0,1.35) rectangle (5.2,1.85); \node[font=\scriptsize] at (4.1,1.6) {$Z_0=44.7\ \Omega$};
>   \draw[<->] (3.0,2.1) -- (5.2,2.1) node[midway,above,font=\scriptsize] {$\lambda/4$};
>   \draw (5.2,1.6) to[C,l=DC block] (6.6,1.6) to[R,l=$50\ \Omega$] (6.6,0) node[ground]{};
>   \draw[->] (0.5,0.7) -- (1.2,0.7) node[right,font=\scriptsize] {$Z_L=40+j7.96\ \Omega$};
> \end{circuitikz}
> \end{document}
> ```

## Level 1: The Two-Port Transistor Oscillator

```tikz title="Two-port oscillator model. The terminating network makes the transistor unstable; the oscillation then appears at both ports, and the load network delivers it. After Pozar Fig. 13.8 and binder p. 393."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=gray!8] (0,0) rectangle (2.2,1.6); \node[align=center] at (1.1,0.8) {terminating\\network $N_T$};
  \draw[fill=gray!8] (4.2,0) rectangle (6.4,1.6); \node[align=center] at (5.3,0.8) {transistor\\$[S]$ + feedback};
  \draw[fill=gray!8] (8.4,0) rectangle (10.6,1.6); \node[align=center] at (9.5,0.8) {load\\network $N_L$};
  \draw (2.2,1.3) -- (4.2,1.3) (2.2,0.3) -- (4.2,0.3);
  \draw (6.4,1.3) -- (8.4,1.3) (6.4,0.3) -- (8.4,0.3);
  \draw (10.6,0.8) -- (11.2,0.8) to[R,l=$Z_0$] (11.2,-1.0) node[ground]{};
  \draw[->] (3.0,0.8) -- (2.4,0.8) node[below right=-1pt,font=\scriptsize] {};
  \node[font=\scriptsize] at (2.7,-0.35) {$\Gamma_S$};
  \draw[->] (3.4,0.8) -- (4.0,0.8);
  \node[font=\scriptsize] at (3.7,-0.35) {$\Gamma_{in}$};
  \draw[->] (7.2,0.8) -- (6.6,0.8);
  \node[font=\scriptsize] at (6.9,-0.35) {$\Gamma_{out}$};
  \draw[->] (7.6,0.8) -- (8.2,0.8);
  \node[font=\scriptsize] at (7.9,-0.35) {$\Gamma_L$};
  \node[font=\scriptsize,align=center] at (3.2,2.2) {$\Gamma_S\Gamma_{in}=1$};
  \node[font=\scriptsize,align=center] at (7.4,2.2) {$\Rightarrow\ \Gamma_L\Gamma_{out}=1$};
\end{circuitikz}
\end{document}
```

### Design Procedure

1. **Pick an unstable device.** An amplifier wants unconditional stability; an oscillator wants the opposite. Common source/gate (emitter/base), often with **series feedback** (an inductor in the gate or base lead) to increase $|S_{11}'|$ and push $K$ further below 1 (binder p. 394).
2. **Draw the stability circle** at the port you will load, and choose $\Gamma_L$ in the unstable region, on the far side of the chart from the circle, so that $|\Gamma_{in}|$ is large.
3. **Compute** $\Gamma_{in}=S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L}$ and $Z_{in}=R_{in}+jX_{in}$.
4. **Terminate** with $Z_S=-R_{in}/3-jX_{in}$: enough excess negative resistance that the oscillation survives as $R_{in}$ shrinks with power.
5. **Build** the matching (single stub) and terminating networks; expect the steady-state frequency to move, because the small-signal S-parameters are not the large-signal ones.

$$
\boxed{R_S=\frac{-R_{in}}{3},\quad X_S=-X_{in}}\qquad
\boxed{\Gamma_S\Gamma_{in}=1\ \Rightarrow\ \Gamma_L=\frac{1-S_{11}\Gamma_S}{S_{22}-\Delta\Gamma_S}\ \Rightarrow\ \Gamma_L\Gamma_{out}=1}
$$

> [!tip] Remark
> The stability circle and $K$-$\Delta$ test are owned by [[RF Amplifier Design]]: there you keep $\Gamma_L$ *out* of the unstable region, here you put it *in*. The circle formulas used below are $C_L=\frac{(S_{22}-\Delta S_{11}^*)^*}{|S_{22}|^2-|\Delta|^2}$, $R_L=\left|\frac{S_{12}S_{21}}{|S_{22}|^2-|\Delta|^2}\right|$. The $\Gamma_{in}$ expression is the one from [[Microwave Network Analysis#Signal Flow Graphs]].

> [!note]- Derivation: oscillation at one port implies the other (Pozar Eqs. 13.32-13.34)
> Steady state at the input: $\Gamma_S\Gamma_{in}=1$. With $\Delta=S_{11}S_{22}-S_{12}S_{21}$,
> $$\frac{1}{\Gamma_S}=\Gamma_{in}=\frac{S_{11}-\Delta\Gamma_L}{1-S_{22}\Gamma_L}\ \Rightarrow\ \Gamma_L=\frac{1-S_{11}\Gamma_S}{S_{22}-\Delta\Gamma_S}.$$
> The output reflection is $\Gamma_{out}=\frac{S_{22}-\Delta\Gamma_S}{1-S_{11}\Gamma_S}$, which is exactly $1/\Gamma_L$. So $Z_L=-Z_{out}$: the load network sees the oscillation too. Which port is "the output" is a free choice (binder p. 393 draws both).

### Worked: 4 GHz GaAs MESFET Oscillator (Pozar Ex. 13.3)

Common-source S-parameters ($Z_0=50\ \Omega$): $S_{11}=0.72\angle-116^\circ$, $S_{12}=0.03\angle57^\circ$, $S_{21}=2.60\angle76^\circ$, $S_{22}=0.73\angle-54^\circ$.

1. **Make it unstable.** Common gate with 5 nH in series with the gate (converted with CAD): $S_{11}'=2.18\angle-35^\circ$, $S_{12}'=1.26\angle18^\circ$, $S_{21}'=2.75\angle96^\circ$, $S_{22}'=0.52\angle155^\circ$. $|S_{11}'|=2.18$: far more unstable (we get $K=0.21$).
2. **Output stability circle:** $C_L=1.08\angle33^\circ$, $R_L=0.665$. Because $|S_{11}'|>1$, $\Gamma_L=0$ already gives $|\Gamma_{in}|>1$, so the **stable** region is *inside* the circle.
3. **Choose** $\Gamma_L=0.59\angle-104^\circ$, opposite the circle ($Z_L=20-j35\ \Omega$). Then $\Gamma_{in}=3.96\angle-2.4^\circ$, $Z_{in}=-84-j1.9\ \Omega$.
4. **Terminate:** $Z_S=-R_{in}/3-jX_{in}=28+j1.9\ \Omega$, realized as a 90 Ω resistor behind $0.262\lambda$ of 50 Ω line (we get $27.9+j2.6\ \Omega$).
5. **Load network:** from 50 Ω, an open stub of $0.346\lambda$ then $0.319\lambda$ of line gives $Z_L$ (we check $20.2-j35.2\ \Omega$).

```tikz title="Pozar Example 13.3, Gamma_L plane. Red: output stability circle C_L = 1.08 at 33 degrees, R_L = 0.665; since |S11'| > 1 the stable region is inside it (shaded). Gamma_L is picked on the opposite side for large |Gamma_in|. Load-network path from 50 ohm: open stub 0.346 lambda along g = 1 (blue), then 0.319 lambda of line clockwise (green). After Pozar Fig. 13.9(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.4,every node/.append style={fill=white,fill opacity=0.85,text opacity=1,inner sep=1.5pt}]
\begin{scope}\clip (0,0) circle (1);
\fill[red!12] (0.903,0.589) circle (0.665);
\draw[gray!55,thin] (0.1667,0) circle (0.8333);
\draw[gray!55,thin] (0.3333,0) circle (0.6667);
\draw[gray!55,thin] (0.5000,0) circle (0.5000);
\draw[gray!55,thin] (0.6667,0) circle (0.3333);
\draw[gray!55,thin] (0.8333,0) circle (0.1667);
\draw[gray!55,thin] (1,0.2000) circle (0.2000);
\draw[gray!55,thin] (1,-0.2000) circle (0.2000);
\draw[gray!55,thin] (1,0.5000) circle (0.5000);
\draw[gray!55,thin] (1,-0.5000) circle (0.5000);
\draw[gray!55,thin] (1,1.0000) circle (1.0000);
\draw[gray!55,thin] (1,-1.0000) circle (1.0000);
\draw[gray!55,thin] (1,2.0000) circle (2.0000);
\draw[gray!55,thin] (1,-2.0000) circle (2.0000);
\draw[blue!25,thin,dashed] (-0.5,0) circle (0.5);
\end{scope}
\draw[gray!70,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\draw[red!70!black,thick] (0.903,0.589) circle (0.665);
\fill[red!70!black] (0.903,0.589) circle (0.02);
\node[font=\scriptsize,text=red!60!black,anchor=west] at (1.05,1.0) {$C_L=1.08\angle33^\circ$};
\node[font=\scriptsize,text=red!60!black] at (0.55,0.62) {stable};
\node[font=\scriptsize] at (-0.55,-0.25) {unstable: $|\Gamma_{in}|>1$};
\draw[dashed,green!50!black] (0,0) circle (0.587);
\draw[->,very thick,blue!70!black] (0,0) arc[start angle=0, end angle=71.9, radius=0.5];
\draw[->,very thick,green!50!black] (-0.345,0.475) arc[start angle=125.96, end angle=-103.72, radius=0.587];
\fill (0,0) circle (0.022);
\fill (-0.345,0.475) circle (0.022); \node[font=\scriptsize,above left] at (-0.345,0.475) {after stub};
\fill (-0.139,-0.570) circle (0.025); \node[font=\scriptsize,below left] at (-0.139,-0.570) {$\Gamma_L=0.59\angle-104^\circ$};
\node[font=\scriptsize,anchor=west] at (1.05,-0.55) {$\Gamma_{in}=3.96\angle-2.4^\circ$};
\node[font=\scriptsize,anchor=west] at (1.05,-0.75) {$Z_{in}=-84-j1.9\ \Omega$};
\end{scope}
\end{circuitikz}
\end{document}
```

```tikz title="Pozar Fig. 13.9(a): the 4 GHz oscillator. Common-gate MESFET with a 5 nH gate inductor for instability; the 90-ohm termination behind 0.262 lambda is Z_S = -R_in/3 - jX_in; the stub-plus-line network presents Z_L = 20 - j35 ohm."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ground]{} to[R,l=$90\ \Omega$] (0,1.8) -- (0.6,1.8);
  \draw (0.6,1.55) rectangle (2.4,2.05); \node[font=\scriptsize] at (1.5,1.8) {$0.262\lambda$, 50 $\Omega$};
  \draw (2.4,1.8) -- (3.4,1.8);
  \draw[fill=gray!10] (3.4,1.4) rectangle (5.0,2.2); \node[font=\scriptsize,align=center] at (4.2,1.8) {MESFET\\common gate};
  \node[font=\scriptsize,anchor=south east] at (3.4,1.85) {S};
  \node[font=\scriptsize,anchor=south west] at (5.0,1.85) {D};
  \node[font=\scriptsize,anchor=north west] at (4.25,1.4) {G};
  \draw (4.2,1.4) to[L,l=5 nH] (4.2,0) node[ground]{};
  \draw (5.0,1.8) -- (5.4,1.8);
  \draw (5.4,1.55) rectangle (7.2,2.05); \node[font=\scriptsize] at (6.3,1.8) {$0.319\lambda$, 50 $\Omega$};
  \draw (7.2,1.8) -- (10.0,1.8);
  \draw (8.0,1.8) -- (8.0,1.5);
  \draw (7.8,0.2) rectangle (8.2,1.5);
  \node[font=\scriptsize,align=left,anchor=west] at (8.25,0.8) {open stub\\$0.346\lambda$};
  \draw (10.0,1.8) to[R,l=$50\ \Omega$] (10.0,0) node[ground]{};
  \draw[->] (2.9,1.2) -- (2.4,1.2) node[left,font=\scriptsize] {$\Gamma_S$};
  \draw[->] (2.9,0.9) -- (3.4,0.9) node[right,font=\scriptsize] {$\Gamma_{in}$};
  \draw[->] (5.2,1.2) -- (5.7,1.2) node[right,font=\scriptsize] {$\Gamma_L$};
\end{circuitikz}
\end{document}
```

> [!warning] Unverified: binder Example (4) numbers do not reproduce
> The binder's two-port example (pp. 395-401; after Gonzalez) designs "a 2 GHz oscillator" from S-parameters "measured at 10 GHz" (likely a typo for 2 GHz): common-base BJT, $S_{11}=0.94\angle174^\circ$, $S_{12}=0.013\angle98^\circ$, $S_{21}=1.90\angle-28^\circ$, $S_{22}=1.01\angle-17^\circ$, $K=-0.084$ (we agree). A 0.5 nH base inductor gives $S_{11}=1.04\angle173^\circ$, $S_{12}=0.043\angle153^\circ$, $S_{21}=2.0\angle-30^\circ$, $S_{22}=1.05\angle-1^\circ$; the binder then quotes $K=-0.834$, source circle $C_S=1.38\angle-51^\circ$, $r_S=2.1$, picks a 10 pF terminating capacitor ($-j0.159$), gets $Z_{out}=-477+j58\ \Omega$ and $Z_L=159-j58\ \Omega$ ($3.18-j1.16$), matched by a shorted stub $0.099\lambda$ and line $0.309\lambda$.
>
> From the printed S-parameters we get $K=-0.62$, $C_S=16.7\angle-48^\circ$, $r_S=17.3$ and $Z_{out}=-194+j173\ \Omega$. Here $|\Delta|=1.038\approx|S_{11}|$, so the circle denominator $|S_{11}|^2-|\Delta|^2$ is nearly zero and rounding of the S-parameters swings the result wildly. The printed stub lengths also give $22.8-j38.4\ \Omega$, not $159-j58$; a shorted stub of $0.0995\lambda$ needs a $0.191\lambda$ line to reach $159-j58\ \Omega$. Use this example for the **procedure** (pick $K<1$, add feedback, terminate in the unstable region, $Z_L=-R_{out}/3-jX_{out}$) and Pozar Ex. 13.3 for numbers.

> [!note]- Detail: feedback topologies (binder pp. 389-392)
> Three networks surround the device: **$N_F$** (feedback) makes it conditionally stable, **$N_T$** (termination) drives it unstable, **$N_L$** (load) matches to $R_L$. Feedback is **series** (an element in the common lead, as in Ex. 13.3) or **parallel** (an element from output back to input). In the general admittance model (binder p. 392, Pozar Eq. 13.3) one grounds $V_2$, $V_1$ or $V_4$ for common emitter/source, base/gate or collector/drain, and connects $V_3$ to $V_4$ for feedback; that is the lumped route to Colpitts, Hartley and Clapp ([[Oscillators#Colpitts one transistor, gain of four]]). High-$Q$ series or parallel resonators in place of the termination lower phase noise.

## Level 2: Dielectric Resonator Oscillators

```tikz title="Left: a DR beside a microstrip line couples through the magnetic field, so it appears as a series impedance on the line: a parallel RLC behind an N:1 transformer. Right: series-feedback DRO, with the DR a quarter wave from the open end of the base line (Pozar Example 13.4). After Pozar Figs. 13.10 and 13.12(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) -- (1.2,0); \draw (2.8,0) -- (4.0,0);
  \draw (0,-1.0) -- (4.0,-1.0);
  \draw (1.2,0) to[R,l_=$R'$] (2.8,0);
  \draw (1.2,0) -- (1.2,1.9) (2.8,0) -- (2.8,1.9);
  \draw (1.2,0.95) to[L,l=$L'$] (2.8,0.95);
  \draw (1.2,1.9) to[C,l=$C'$] (2.8,1.9);
  \node[font=\scriptsize] at (0.2,-0.5) {$Z_0$};
  \node[font=\scriptsize] at (3.8,-0.5) {$Z_0$};
  \node[font=\scriptsize,align=center] at (2.0,-1.8) {DR = parallel RLC in series with the line\\(seen through $N$:1, $R'=N^2R$):\\$Z=\dfrac{N^2R}{1+j2Q_0\Delta\omega/\omega_0}$};
  \begin{scope}[xshift=5.6cm]
    \draw[fill=gray!20] (0,0.55) rectangle (3.4,0.85);
    \draw[fill=blue!15] (1.9,1.45) circle (0.4); \node[font=\scriptsize] at (1.9,2.05) {DR};
    \draw[<->] (0,0.25) -- (0.9,0.25) node[midway,below,font=\scriptsize] {$\lambda/4$};
    \draw[<->] (1.9,0.25) -- (3.4,0.25) node[midway,below,font=\scriptsize] {$\ell_r$};
    \draw[dashed] (1.9,0.25) -- (1.9,1.05);
    \node[font=\scriptsize,anchor=east] at (-0.05,0.7) {open};
    \draw (3.4,0.7) -- (4.0,0.7) node[npn,anchor=B](Q){};
    \draw (Q.E) node[ground]{};
    \draw (Q.C) -- ++(0,0.3) coordinate(a) -- ++(0.4,0) coordinate(b);
    \draw (b) ++(0,-0.25) rectangle ++(1.4,0.5);
    \path (b) ++(0.7,0) node[font=\scriptsize] {$\ell_t$};
    \path (b) ++(1.4,0) coordinate(c);
    \draw (c) -- ++(1.6,0) coordinate(d);
    \path (c) ++(0.5,0) coordinate(e);
    \draw (e) -- ++(0,-0.3);
    \draw (e) ++(-0.2,-0.3) rectangle ++(0.4,-1.0);
    \path (e) ++(0.25,-0.8) node[anchor=west,font=\scriptsize] {$\ell_s$};
    \draw (d) to[R,l=$Z_0$] ++(0,-1.6) node[ground]{};
    \draw[->] (3.9,1.2) -- (3.4,1.2) node[left,font=\scriptsize] {$\Gamma_S$};
    \draw[->] ([yshift=0.25cm]b) -- ++(-0.45,0) node[above,font=\scriptsize] {$\Gamma_{out}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Coupling a DR to a Line

$$
\boxed{Z=\frac{N^2R}{1+j2Q_0\Delta\omega/\omega_0},\qquad g=\frac{Q_0}{Q_e}=\frac{N^2R}{2Z_0},\qquad \Gamma=\frac{g}{1+g}}
$$

- Coupling through the line's fringing **magnetic** field makes the DR a **series** element. The spacing $d$ sets $N$, hence $g$ (Pozar Eqs. 13.35-13.37).
- $R_L=2Z_0$ for a matched line (source and load $Z_0$). If the line ends in an **open $\lambda/4$ beyond the DR**, the field there is maximum, $R_L=Z_0$, and $g$ doubles: $g=N^2R/Z_0$.
- Measure $\Gamma$ at resonance and $g=\Gamma/(1-\Gamma)$; $f_0$ and $Q$ also come from measurement (or Kajfez/Komatsu-type approximate formulas). Only $N^2R$ is determined, never $N$ and $R$ separately.

> [!tip] Remark
> The DR itself ($\text{TE}_{01\delta}$, $\epsilon_r$ 10-100, $Q_0\approx1/\tan\delta$, tuning plate) is [[Microwave Resonators#Dielectric Resonators]]; coupling factor $g$ and critical coupling are [[Microwave Resonators#Coupling Coefficient and Critical Coupling]].

**Why a DRO:** Kurokawa wants a steep reactance slope. Lumped or microstrip resonators reach $Q_0$ of a few hundred; metal cavities reach $10^4$ but don't integrate and drift with thermal expansion. A DR gives $Q_0$ up to several thousand, is compact, couples to microstrip by placement, and is made of temperature-stable ceramic. DROs cover the whole microwave and lower mm-wave range (Pozar §13.2).

| Feedback | Layout | Trade |
|---|---|---|
| **Parallel** | DR couples two lines, acting as a high-$Q$ bandpass from output back to input; spacing sets coupling, line lengths set phase | wider tuning; design in CAD |
| **Series** | one line on the input, DR near its end | simpler, less tuning range; designed with the two-port procedure above |

### Worked: 2.4 GHz Series-Feedback DRO (Pozar Ex. 13.4)

BJT ($Z_0=50\ \Omega$): $S_{11}=1.8\angle130^\circ$, $S_{12}=0.4\angle45^\circ$, $S_{21}=3.8\angle36^\circ$, $S_{22}=0.7\angle-63^\circ$; $Q_0=1000$. The output (collector) is the load port.

1. **Maximize $|\Gamma_{out}|$** by making $1-S_{11}\Gamma_S\to0$: choose $\Gamma_S=0.6\angle-130^\circ$, giving $\Gamma_{out}=10.7\angle132^\circ$, $Z_{out}=-43.7+j6.1\ \Omega$.
2. **Load:** $Z_L=-R_{out}/3-jX_{out}$ (see the warning), matched with a line $\ell_t$ and open stub $\ell_s$.
3. **Resonator phase:** at resonance the DR is real; undercoupled means $N^2R<Z_0$, so $\Gamma_S'$ at the DR must be at $180^\circ$. Rotate: $0.6\angle-130^\circ\cdot e^{2j\beta\ell_r}=0.6\angle180^\circ$ gives $\ell_r=0.431\lambda$.
4. **Coupling:** $Z_S'=Z_0\frac{1+\Gamma_S'}{1-\Gamma_S'}=12.5\ \Omega$; with the open $\lambda/4$ termination, $g=N^2R/Z_0=12.5/50=0.25$.
5. **Check selectivity:** $|\Gamma_{out}|$ versus frequency (below) falls from 10.7 to about 2 within $\pm0.05\%$: the DR makes the oscillator refuse to run anywhere else.

```tikz title="Pozar Example 13.4: |Gamma_out| vs frequency offset. Our recomputation from Eqs. 13.34-13.35 (Q_0 = 1000, Z_S' = 12.5 ohm at resonance, l_r = 0.431 lambda held fixed); it reproduces Pozar Fig. 13.12(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.6cm,y=0.33cm]
  \draw[->] (-5.4,0) -- (5.6,0) node[right] {$\Delta f/f_0$ (\%)};
  \draw[->] (0,0) -- (0,12.5) node[above] {$|\Gamma_{out}|$};
  \foreach \x/\l in {-5/{-0.05},-2.5/{-0.025},2.5/{0.025},5/{0.05}} { \draw (\x,0.2) -- (\x,-0.2) node[below,font=\scriptsize] {\l}; }
  \foreach \y in {2,4,6,8,10} { \draw (0.1,\y) -- (-0.1,\y) node[left,font=\scriptsize] {\y}; }
  \draw[very thick,blue!70!black] plot[smooth] coordinates {(-5.000,1.913) (-4.600,2.001) (-4.200,2.108) (-3.800,2.241) (-3.400,2.408) (-3.000,2.623) (-2.600,2.906) (-2.200,3.292) (-1.800,3.837) (-1.400,4.644) (-1.000,5.902) (-0.800,6.788) (-0.600,7.884) (-0.400,9.135) (-0.200,10.264) (0.000,10.722) (0.200,10.173) (0.400,8.975) (0.600,7.678) (0.800,6.554) (1.000,5.652) (1.400,4.379) (1.800,3.568) (2.200,3.024) (2.600,2.643) (3.000,2.366) (3.400,2.158) (3.800,1.998) (4.200,1.873) (4.600,1.774) (5.000,1.694)};
  \node[font=\scriptsize,anchor=west] at (0.4,10.9) {10.7 at $f_0$};
\end{circuitikz}
\end{document}
```

> [!warning] Unverified: Pozar's $Z_L$ in Example 13.4
> Pozar prints $Z_L=-R_{out}/3-jX_{out}=5.5-j6.1\ \Omega$ with $\ell_t=0.481\lambda$, $\ell_s=0.307\lambda$. By his own Eq. (13.31) and $Z_{out}=-43.7+j6.1\ \Omega$, $Z_L=43.7/3-j6.1=14.6-j6.1\ \Omega$. The printed lengths also don't reproduce 5.5-$j$6.1 exactly (an open stub of $0.307\lambda$ needs $\ell_t\approx0.430\lambda$ for that). For $14.6-j6.1\ \Omega$ we get open stub $0.147\lambda$ with $\ell_t=0.057\lambda$ (or $0.353\lambda$ with $0.401\lambda$). Either load keeps $R_L<|R_{out}|$, so the oscillator starts; only the margin differs.

## Level 3: Phase Noise: What Pozar Adds

> [!tip] Remark
> Phase-noise definitions, the $1/f^2$-$1/f^3$ skirt and Leeson's model are owned by [[Oscillators#Level 5 Phase Noise]]. Only the microwave-specific extras from Pozar §13.3 are here.

$$
\boxed{S_\phi(\Delta\omega)=\frac{kT_0F}{P_0}\left(\frac{K\omega_\alpha\omega_h^2}{\Delta\omega^3}+\frac{\omega_h^2}{\Delta\omega^2}+\frac{K\omega_\alpha}{\Delta\omega}+1\right),\qquad \omega_h=\frac{\omega_0}{2Q_0},\qquad \mathcal L=\tfrac12S_\phi}
$$

- **Two shapes, set by which corner comes first.** Low $Q$ ($f_h>f_\alpha$): $1/f^3$, then $1/f^2$ between $f_\alpha$ and $f_h$, then flat. High $Q$ ($f_h<f_\alpha$, typical of DROs on GaAs): $1/f^3$, then **$1/f$** ($-6$ dB/octave) between $f_h$ and $f_\alpha$, then flat (Pozar Fig. 13.17; its caption labels both cases "$f_h>f_\alpha$", the second should read $f_h<f_\alpha$).
- **Floor:** $kT_0F/P_0$; a noiseless amplifier gives $kT_0=-174$ dBm/Hz. Any noisy two-port carrying a carrier $P_c$ adds a phase-noise PSD $S_\theta=kT_0F/P_c$ (Pozar Eq. 13.44; $\mathcal L$ is half of it), independent of its gain.
- **Device flicker corners** decide which shape you get:

| Device | Flicker corner $f_\alpha$ |
|---|---|
| Si JFET | 50-100 Hz |
| Si BJT | 5-50 kHz |
| GaAs MESFET | 2-10 MHz or higher |

So for low close-in noise a microwave oscillator wants a Si BJT (or SiGe HBT) and a high-$Q$ resonator; a GaAs FET's corner can sit above the resonator bandwidth. Measurement (spectrum analyzer, phase-noise test sets) is not covered in Pozar Ch. 13; LO phase noise as a receiver problem is [[#Reciprocal Mixing]].

## Level 4: Frequency Multipliers

When a fundamental oscillator can't give enough power, stability or low noise at mm-wave, multiply a lower-frequency one.

$$
\boxed{\Delta\mathcal L=20\log n\ \ \text{dB}}\qquad\text{(doubler } +6\text{ dB, tripler } +9.5\text{ dB at least)}
$$

Multiplying frequency multiplies phase deviation, so noise power rises by $n^2$. Reactive multipliers add little of their own; resistive ones add noticeably.

```tikz title="Diode frequency multiplier: low-pass at the input, the nonlinear diode, a bandpass at n f_0; all other harmonics see reactive terminations (and idler currents may need short circuits). After Pozar Fig. 13.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[sV,l=$f_0$] (0,1.6) to[R] (1.6,1.6);
  \draw (1.6,1.0) rectangle (2.8,2.2); \node[font=\scriptsize,align=center] at (2.2,1.6) {LPF\\$f_0$};
  \draw (2.8,1.6) -- (4.0,1.6) to[D] (4.0,0);
  \draw (4.0,1.6) -- (5.0,1.6);
  \draw (5.0,1.0) rectangle (6.2,2.2); \node[font=\scriptsize,align=center] at (5.6,1.6) {BPF\\$nf_0$};
  \draw (6.2,1.6) -- (7.2,1.6) node[right] {$nf_0$ out};
  \draw (0,0) -- (7.2,0);
\end{circuitikz}
\end{document}
```

| Type | Element | Efficiency limit | Use |
|---|---|---|---|
| **Reactive** | varactor or step-recovery diode (nonlinear $C_j$) | 100% (Manley-Rowe); varactor doublers/triplers 50-80% at 50 GHz | varactor for $n=2$-4, SRD for higher $n$; needs $nf_0\ll f_c$ (cutoff can exceed 1000 GHz) |
| **Resistive** | forward-biased Schottky | $\le1/m^2$ | better bandwidth and stability than reactive; even the best varactors turn resistive at high mm-wave |
| **Transistor** | FET (class-B rectification), BJT ($C_{cb}$) | conversion **gain** possible | less input and DC power; output under ~10 dBm, up to 60-100 GHz; limited by $f_T$ |

- A varactor tripler needs an **idler** at $2f_0$: higher harmonic voltages can't appear unless lower harmonic currents are allowed to flow (short-circuited idler terminations).
- **Balanced** diode multipliers (quadrature hybrid feed, or an **antiparallel pair**) add power, improve input match and reject all even or all odd harmonics; the antiparallel pair rejects all even ones.
- Today one often generates low power at the final frequency and amplifies, rather than multiplying high power (Pozar).

### Class-B FET Doubler

```tikz title="Class-B FET doubler waveforms: the gate is biased below threshold V_t, so drain current flows in pulses of width tau; a drain tank tuned to 2f_0 turns them into a sinusoid at twice the frequency. After Pozar Fig. 13.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.1cm,y=1cm]
  \draw[->] (-0.3,0) -- (6.6,0) node[right] {$t$};
  \draw[thick,domain=-0.25:6.3,samples=120] plot (\x,{0.9*cos(deg(2*pi*\x/3))-0.45});
  \draw[dashed] (-0.3,-0.15) -- (6.4,-0.15);
  \node[font=\scriptsize,anchor=east] at (-0.35,-0.15) {$V_t$};
  \draw[dashed] (-0.3,-0.6) -- (6.4,-0.6);
  \node[font=\scriptsize,anchor=east] at (-0.35,-0.6) {$V_{gg}$};
  \node[font=\scriptsize,anchor=east] at (-0.35,0.1) {0};
  \node[font=\scriptsize,anchor=east] at (-0.35,0.7) {$v_g$};
  \begin{scope}[yshift=-1.7cm]
    \draw[->] (-0.3,0) -- (6.6,0) node[right] {$t$};
    \foreach \c in {0,3,6} { \draw[very thick,domain={\c-0.6}:{\c+0.6},samples=30] plot (\x,{0.9*cos(deg(pi*(\x-\c)/1.2))}); }
    \draw[very thick] (0.6,0) -- (2.4,0) (3.6,0) -- (5.4,0);
    \draw[<->] (2.4,1.05) -- (3.6,1.05) node[midway,above,font=\scriptsize] {$\tau$};
    \node[font=\scriptsize,anchor=east] at (-0.5,0.5) {$i_d$};
  \end{scope}
  \begin{scope}[yshift=-3.4cm]
    \draw[->] (-0.3,0) -- (6.6,0) node[right] {$t$};
    \draw[thick,domain=-0.25:6.3,samples=160] plot (\x,{0.6*cos(deg(4*pi*\x/3))});
    \node[font=\scriptsize,anchor=east] at (-0.35,0.5) {$v_d$};
    \node[font=\scriptsize,anchor=west] at (6.0,0.65) {at $2f_0$};
  \end{scope}
  \draw[<->] (0,-4.2) -- (3,-4.2) node[midway,below,font=\scriptsize] {$T=1/f_0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_n=I_{max}\frac{4\tau}{\pi T}\frac{\cos(n\pi\tau/T)}{1-(2n\tau/T)^2},\qquad \cos\frac{\pi\tau}{T}=\frac{2V_t-V_{g,max}-V_{g,min}}{V_{g,max}-V_{g,min}}}
$$

$$
\boxed{R_L=\frac{V_{d,max}-V_{d,min}}{2I_n},\quad P_n=\tfrac12|I_n|^2R_L,\quad P_{in}=\frac{|V_g|^2R_i}{2|R_i-j/\omega_0C_{gs}|^2},\quad G_c=\frac{P_n}{P_{avail}}}
$$

- $I_n$ falls with $n$: doublers and triplers only. The best pulse width is $\tau/T=0.35$ for $n=2$ and $0.22$ for $n=3$; bias limits usually force it wider (Pozar Eqs. 13.70-13.80).
- The drain load $R_L+jX_L$ resonates $C_{ds}$ at $n\omega_0$ and shorts everything else.

> [!example] 12-24 GHz MESFET doubler (Pozar Ex. 13.6)
> $V_t=-2$ V, $R_i=10\ \Omega$, $C_{gs}=0.2$ pF, $C_{ds}=0.15$ pF; $V_{g}$ from $-6.0$ to $+0.2$ V, $V_d$ from 1 to 5 V, $I_{max}=80$ mA.
> 1. $V_{gg}=(0.2-6.0)/2=-2.9$ V, $V_g=3.1$ V peak; $P_{in}=10.7$ mW.
> 2. $\cos(\pi\tau/T)=\frac{-4-0.2+6}{6.2}=0.29\Rightarrow\tau/T=0.406$.
> 3. $I_2=0.262\,I_{max}=21.0$ mA; $R_L=\frac{5-1}{2(0.021)}=95.2\ \Omega$; $P_2=\frac12(0.021)^2(95.2)=21.0$ mW.
> 4. $G_c=21.0/10.7=2.9$ dB. Tank: $X_L=1/(2\omega_0C_{ds})=44.2\ \Omega$, i.e. 0.293 nH.

## Level 5: Mixer Characteristics

### Frequency Conversion

$$
\boxed{\text{up: } f_{RF}=f_{LO}\pm f_{IF}\qquad\text{down: } f_{IF}=f_{RF}-f_{LO}}
$$

- An ideal mixer multiplies: $K\cos\omega_1t\cos\omega_2t=\frac K2[\cos(\omega_1-\omega_2)t+\cos(\omega_1+\omega_2)t]$. Up-conversion makes an upper sideband (USB, $f_{LO}+f_{IF}$) and a lower one (LSB); a DSB signal has both, an SSB signal one (by filtering or an SSB mixer).
- In a receiver $f_{RF}$ and $f_{LO}$ are close, so the sum is near $2f_{RF}$ and the low-pass IF filter keeps the difference.
- **Heterodyne / low-IF:** $f_{IF}\neq0$. **Homodyne (zero-IF, direct conversion):** $f_{IF}=0$ (binder p. 404).

### Image Frequency

```tikz title="The image problem. With the LO at f_0, the wanted channel at f_0 + Delta f and an interferer at f_0 - Delta f both land at |Delta f| after mixing, on top of each other; no IF filter can separate them. An image-reject filter before the mixer must, which needs a high IF. After binder pp. 408-409."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.4,0) node[right] {$f$};
  \draw[very thick,blue!70!black,->] (4.5,0) -- (4.5,1.3) node[above,font=\scriptsize] {LO $f_0$};
  \draw[thick,fill=gray!25] (5.3,0) .. controls (5.4,0.9) and (6.0,0.9) .. (6.1,0) -- cycle;
  \node[font=\scriptsize] at (5.7,1.05) {wanted};
  \draw[thick,red!70!black,fill=red!15] (2.9,0) -- (3.3,0.8) -- (3.7,0) -- cycle;
  \node[font=\scriptsize,text=red!70!black] at (3.3,1.05) {image};
  \draw[<->] (4.5,-0.3) -- (5.7,-0.3) node[midway,below,font=\scriptsize] {$\Delta f$};
  \draw[<->] (3.3,-0.3) -- (4.5,-0.3) node[midway,below,font=\scriptsize] {$\Delta f$};
  \draw[blue!50!black,dashed,thick] (4.9,0) -- (5.1,1.6) -- (6.3,1.6) -- (6.5,0);
  \node[font=\scriptsize,text=blue!50!black,align=center] at (5.7,2.05) {image-reject (RF) filter\\passes only the wanted band};
  \begin{scope}[xshift=8.6cm]
    \draw[->] (0,0) -- (3.0,0) node[right] {$f$};
    \draw[thick,fill=gray!25] (0.8,0) .. controls (0.9,0.9) and (1.5,0.9) .. (1.6,0) -- cycle;
    \draw[thick,red!70!black,fill=red!15,opacity=0.8] (0.8,0) -- (1.2,0.8) -- (1.6,0) -- cycle;
    \node[font=\scriptsize,align=center] at (1.2,1.4) {without it:\\both at $\Delta f$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{f_{RF}=f_{LO}+f_{IF},\quad f_{IM}=f_{LO}-f_{IF}\quad(|f_{RF}-f_{IM}|=2f_{IF})}\qquad\boxed{f_{LO}=f_{RF}\pm f_{IF}}
$$

- Which one is the image depends on which side the LO sits; treat $f_{IF}$ as signed (Pozar Eqs. 13.88-13.89). Most receivers use **high-side LO** ($f_{LO}=f_{RF}+f_{IF}$): a smaller LO tuning ratio for a given RF band.
- The image cannot be removed after the mixer. Remove it before, with an **image-reject filter**, which needs a high IF (the filter must pass all channels, and its $Q$ can't be arbitrarily high), or cancel it with an [[#Image-Reject Mixer|image-reject mixer]].

> [!example] Image frequency, IS-54 (Pozar Ex. 13.7)
> Receive band 869-894 MHz, IF 87 MHz. LO options: $f_{RF}\pm f_{IF}=956$-$981$ MHz or $782$-$807$ MHz. With the upper LO, $f_{IF}=-87$ MHz and the image is $f_{LO}+87=1043$-$1068$ MHz: well outside the receive band, so a modest front-end filter rejects it.

### Conversion Loss and Gain

$$
\boxed{L_c=10\log\frac{\text{available RF input power}}{\text{available IF output power}}\ \ge0\ \text{dB (diode)}}
$$

- Includes resistive loss and the power wasted in unwanted products. Matching must work at three ports and several frequencies; resistive terminations of unwanted products add loss, reactive ones are frequency-sensitive.
- **Diode mixers:** 4-7 dB at 1-10 GHz. **Transistor mixers:** less loss, even a few dB of conversion gain.
- **LO power** strongly sets $L_c$; minimum loss usually at **0-10 dBm**, large enough that accurate prediction needs nonlinear (harmonic-balance) analysis.
- Matters most in receivers: conversion loss before the IF amplifier adds directly to noise figure ([[#Worked examples|Prob. 13.18]]).

### Mixer Noise Figure: SSB vs DSB

$$
\boxed{F_{DSB}=\frac{2}{K^2L_c}\left(1+\frac{N_{added}}{kT_0B}\right),\qquad F_{SSB}=\frac{4}{K^2L_c}\left(1+\frac{N_{added}}{kT_0B}\right)=2F_{DSB}}
$$

- The mixer down-converts noise from **both** sidebands onto the same IF, whatever the signal does. A DSB signal (radiometers, zero-IF) also brings power in both sidebands; an SSB signal (heterodyne radio) brings half. Same noise, half the signal: $F_{SSB}$ is 3 dB worse (Pozar Eqs. 13.91-13.97).
- Practical mixer NF: 1-5 dB, with diode mixers usually lower than transistor mixers. Always ask which one a datasheet quotes.

> [!note]- Derivation: $F_{SSB}=2F_{DSB}$ (Pozar Eqs. 13.91-13.97)
> **DSB input** $A[\cos(\omega_{LO}-\omega_{IF})t+\cos(\omega_{LO}+\omega_{IF})t]$. Mixing with $\cos\omega_{LO}t$ and low-pass filtering gives $\frac{AK}{2}\cos\omega_{IF}t+\frac{AK}{2}\cos(-\omega_{IF}t)=AK\cos\omega_{IF}t$. So $S_i=A^2$, $S_o=A^2K^2/2$.
>
> **Noise:** $N_i=kT_0B$ ($B$ the IF bandwidth); referred to the input, the mixer adds $N_{added}$; $N_o=(kT_0B+N_{added})/L_c$. Then
> $$F_{DSB}=\frac{S_iN_o}{S_oN_i}=\frac{2}{K^2L_c}\left(1+\frac{N_{added}}{kT_0B}\right).$$
> **SSB input** $A\cos(\omega_{LO}-\omega_{IF})t$ gives $\frac{AK}{2}\cos\omega_{IF}t$: $S_i=A^2/2$, $S_o=A^2K^2/8$. Same noise, so $F_{SSB}=\frac{4}{K^2L_c}(\dots)=2F_{DSB}$. In noise temperature, $T_{SSB}=2T_{DSB}$ (Prob. 13.19).

> [!tip] Remark
> The mixer's NF enters the receiver through Friis, and its IIP3 through the cascaded-IIP3 formula; both are owned by [[RF Noise and Distortion#Friis Formula]] and [[RF Noise and Distortion#Cascaded IIP3]], with Pozar's LNA + mixer examples. Noise figure itself is defined in [[RF Noise and Distortion#Noise Figure]].

### Intermodulation and Isolation

- **IIP3:** mixers are nonlinear by design, so they make IM products; typical IIP3 15-30 dBm. Quoted at the input for mixers (output for amplifiers).
- **RF-LO isolation:** typical 20-40 dB, set mainly by the coupler that diplexes RF and LO.

```tikz title="Leakage paths around a mixer. LO-to-IF feedthrough eats IF dynamic range; LO-to-RF (reverse) feedthrough radiates from the antenna and, re-entering the mixer, self-mixes to DC and 2f_0, which ruins a zero-IF receiver. After binder pp. 409-410."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick] (0,0) circle (0.45);
  \draw[thick] (-0.32,-0.32) -- (0.32,0.32) (-0.32,0.32) -- (0.32,-0.32);
  \draw (-3.4,-0.3) rectangle (-2.2,0.3); \node[font=\scriptsize] at (-2.8,0) {LNA};
  \draw[->] (-4.4,0) node[left] {antenna} -- (-3.4,0);
  \draw[->] (-2.2,0) -- (-0.45,0) node[above left,font=\scriptsize] {RF};
  \draw[->] (0.45,0) -- (2.4,0) node[right] {IF};
  \draw[->] (0,-1.6) node[below] {LO $f_0$} -- (0,-0.45);
  \draw[->,thick,blue!70!black,dashed] (0.2,-1.2) .. controls (1.2,-1.1) and (1.6,-0.6) .. (1.8,-0.1);
  \node[font=\scriptsize,text=blue!60!black,align=left,anchor=west] at (1.6,-1.0) {LO $\to$ IF feedthrough\\(parasitic $C$, supply)};
  \draw[->,thick,red!70!black,dashed] (-0.2,-1.2) .. controls (-1.2,-1.1) and (-1.5,-0.6) .. (-1.6,-0.1);
  \draw[->,thick,red!70!black,dashed] (-2.2,-0.25) .. controls (-3.0,-0.9) and (-3.8,-0.9) .. (-4.2,-0.2);
  \node[font=\scriptsize,text=red!60!black,align=right,anchor=east] at (-1.4,-1.35) {reverse LO feedthrough:\\radiated; self-mixes to DC};
\end{circuitikz}
\end{document}
```

| Leak | Path | Consequence | Fix |
|---|---|---|---|
| LO → IF | parasitic capacitance, supply coupling | big tone at the IF uses up dynamic range, can desensitize | IF filter if small; balance |
| LO → RF (reverse) | parasitic capacitance, diplexer | radiated through the antenna (regulatory limits); re-enters and self-mixes to DC and $2f_0$, harmless for heterodyne, a DC offset for homodyne | RF bandpass, LNA reverse isolation, 180° hybrid / double balance |

### Reciprocal Mixing

A noisy LO is a spread of LOs. A strong interferer one IF away from the wanted signal mixes with the LO's phase-noise skirt and lands on the IF (Pozar Fig. 13.18). To keep selectivity $S$ (dB):

$$
\boxed{\mathcal L(f_m)=C-S-I-10\log B\quad\text{(dBc/Hz)}}
$$

$C$ = wanted level (dBm), $I$ = interferer level (dBm), $B$ = IF bandwidth (Hz), $f_m$ = interferer offset. Worked numbers: [[#Worked examples|GSM, Ex. 13.5]]. This, not thermal noise, usually limits receiver selectivity.

## Level 6: Single-Ended Mixers

### Diode Mixer

```tikz title="Single-ended diode mixer: a diplexing coupler sums RF and LO onto one diode; blocking capacitors and an RF choke route the DC bias; a low-pass filter keeps the IF. After Pozar Fig. 13.25(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0.8) rectangle (1.4,1.8); \node[font=\scriptsize,align=center] at (0.7,1.3) {diplexing\\coupler};
  \draw[->] (-1.2,1.5) node[left] {RF} -- (0,1.5);
  \draw[->] (0.7,-0.2) node[below] {LO} -- (0.7,0.8);
  \draw (1.4,1.3) to[C,l_=DC block] (3.2,1.3) -- (3.8,1.3);
  \draw (3.8,1.3) to[L,l_=RFC] (3.8,3.0) node[above] {$+$DC bias};
  \draw (3.8,1.3) to[D] (3.8,-0.2) node[ground]{};
  \draw (3.8,1.3) -- (4.4,1.3) to[C,l_=DC block] (6.0,1.3);
  \draw (6.0,0.8) rectangle (7.2,1.8); \node[font=\scriptsize] at (6.6,1.3) {LPF};
  \draw[->] (7.2,1.3) -- (8.2,1.3) node[right] {IF};
\end{circuitikz}
\end{document}
```

$$
\boxed{i_{IF}(t)=\frac{G_d'}{2}V_{RF}V_{LO}\cos\omega_{IF}t}
$$

- The diode sees $v_{RF}+v_{LO}$; the square term gives the product (Pozar Eq. 13.101). Bias moves the operating point, as in a detector. Each port works both ways, so the same circuit up-converts.
- Weakness: everything couples to everything (Table 13.1: poor RF match, fair isolation).

> [!note]- Derivation: which terms survive (Pozar Eq. 13.100)
> $i=I_0+G_d(v_{RF}+v_{LO})+\frac{G_d'}{2}(v_{RF}+v_{LO})^2+\dots$ With $v_{RF}=V_{RF}\cos\omega_{RF}t$, $v_{LO}=V_{LO}\cos\omega_{LO}t$ the square term is
> $$\frac{G_d'}{4}\left[V_{RF}^2(1+\cos2\omega_{RF}t)+V_{LO}^2(1+\cos2\omega_{LO}t)+2V_{RF}V_{LO}\cos(\omega_{RF}-\omega_{LO})t+2V_{RF}V_{LO}\cos(\omega_{RF}+\omega_{LO})t\right].$$
> DC terms are blocked by the capacitors; $2\omega_{RF}$, $2\omega_{LO}$ and the sum by the LPF. The linear term just replicates RF and LO, also filtered. What's left is the boxed IF current.

### FET Mixer

$$
\boxed{g(t)=g_0+2\sum_{n\ge1}g_n\cos n\omega_{LO}t,\qquad G_c=\frac{g_1^2R_d}{4\omega_{RF}^2C_{gs}^2R_i}\ \ \text{(conjugate matched)}}
$$

- Bias the gate near **pinch-off**, where $g_m$ rises steeply with $V_{GS}$ (Pozar Fig. 13.26: ~0 at $-3.5$ V to ~30 mS at 0 V). The LO then switches $g_m$ between high and low: the LO **pumps** the transconductance. Only the fundamental Fourier coefficient $g_1$ matters for down-conversion; it is measured, typically ~10 mS.
- Circuit (Pozar Fig. 13.27): diplexer + matching into the gate (very low input impedance), RF chokes for negative gate bias and positive drain bias, a drain bypass capacitor to return the LO, LPF at the IF.

> [!example] Single-ended FET mixer at 2.4 GHz (Pozar Ex. 13.8)
> $R_d=300\ \Omega$, $R_i=10\ \Omega$, $C_{gs}=0.3$ pF, $g_1=10$ mS.
> $$G_c=\frac{(10^{-2})^2(300)}{4(2\pi)^2(2.4\times10^9)^2(0.3\times10^{-12})^2(10)}=36.6=15.6\text{ dB}.$$
> An upper bound: matching-network loss is not included. Note $G_c\propto g_1^2$ (LO drive) and $\propto1/(\omega C_{gs})^2$, so it falls 6 dB per octave of RF.

> [!note]- Derivation: FET mixer conversion gain (Pozar Eqs. 13.102-13.108)
> Unilateral FET model: source $Z_g=R_g+jX_g$ at RF, $R_i$ and $C_{gs}$ at the gate, $g(t)v_c$ into $R_d\parallel Z_L$.
> 1. Gate-capacitor voltage at RF: $V_c^{RF}=\frac{V_{RF}}{1+j\omega_{RF}C_{gs}(R_i+Z_g)}$.
> 2. $g(t)v_c(t)\ni2g_1V_c^{RF}\cos\omega_{RF}t\cos\omega_{LO}t$, whose difference term is $g_1V_c^{RF}\cos\omega_{IF}t$.
> 3. IF drain voltage: $V_D^{IF}=-g_1V_c^{RF}\frac{R_dZ_L}{R_d+Z_L}$.
> 4. $G_c=\frac{P_{IF,avail}}{P_{RF,avail}}=\frac{4R_gR_L}{|Z_L|^2}\left|\frac{V_D^{IF}}{V_{RF}}\right|^2$. Conjugate match $R_g=R_i$, $X_g=1/\omega_{RF}C_{gs}$, $R_L=R_d$, $X_L=0$: the boxed result.

## Level 7: Balanced, Double-Balanced and Image-Reject Mixers

### Balanced Mixer (Hybrid-Fed)

```tikz title="Balanced mixers: two diodes fed through a 3 dB hybrid, outputs summed into the IF filter. A 90-degree hybrid cancels the diodes' RF reflections at the RF port (wideband match); a 180-degree hybrid isolates RF from LO. After Pozar Fig. 13.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (1.8,1.8);
  \draw (0,0) -- (1.8,1.8) (0,1.8) -- (1.8,0);
  \node[font=\scriptsize,align=center] at (0.9,-0.4) {3 dB hybrid\\90$^\circ$ or 180$^\circ$};
  \draw[->] (-1.2,1.5) node[left] {RF} -- (0,1.5);
  \draw[->] (-1.2,0.3) node[left] {LO} -- (0,0.3);
  \draw (1.8,1.5) -- (2.6,1.5) to[D] (4.2,1.5) -- (4.6,1.5);
  \draw (1.8,0.3) -- (2.6,0.3) to[D,invert] (4.2,0.3) -- (4.6,0.3);
  \node[font=\scriptsize] at (3.4,1.95) {$v_1$};
  \node[font=\scriptsize] at (3.4,-0.15) {$v_2$ (reversed)};
  \draw (4.6,0.3) -- (4.6,1.5);
  \draw (4.6,0.9) -- (5.2,0.9);
  \draw (5.2,0.4) rectangle (6.4,1.4); \node[font=\scriptsize] at (5.8,0.9) {LPF};
  \draw[->] (6.4,0.9) -- (7.2,0.9) node[right] {IF};
\end{circuitikz}
\end{document}
```

| Hybrid | Gives (ideally, over a wide band) | Depends on diode matching |
|---|---|---|
| 90° | perfect **RF input match**: diode reflections cancel at the RF port | RF-LO isolation |
| 180° | perfect **RF-LO isolation** ($\Sigma$/$\Delta$ ports) | RF match (fair) |

Both reject all **even-order** intermodulation products, and the DC parts of the two diode currents cancel. The 90° balanced mixer's IF is $i_{IF}=-KV_{RF}V_{LO}\sin\omega_{IF}t$ (Pozar Eq. 13.114).

> [!tip] Remark
> The hybrids (branch-line, rat-race) and the same reflection-cancelling trick in the balanced amplifier are [[Power Dividers and Couplers#Balanced and Image-Reject Mixers]] and [[Power Dividers and Couplers#Balanced Amplifier]].

> [!note]- Derivation: RF match of the 90° balanced mixer (Pozar Eqs. 13.111-13.116)
> 90° hybrid: $[S]=\frac{-1}{\sqrt2}\begin{bmatrix}0&j&1&0\\j&0&0&1\\1&0&0&j\\0&1&j&0\end{bmatrix}$, RF into port 1, LO into port 4. Diode voltages:
> $v_1=\frac{1}{\sqrt2}(V_{RF}\sin\omega_{RF}t-V_{LO}\cos\omega_{LO}t)$, $v_2=\frac{1}{\sqrt2}(-V_{RF}\cos\omega_{RF}t+V_{LO}\sin\omega_{LO}t)$.
> Square law with the second diode reversed: $i_1=Kv_1^2$, $i_2=-Kv_2^2$. Sum:
> $$i_1+i_2=-\frac K2\left(V_{RF}^2\cos2\omega_{RF}t+2V_{RF}V_{LO}\sin\omega_{IF}t-V_{LO}^2\cos2\omega_{LO}t\right)$$
> (DC cancels); after the LPF, $i_{IF}=-KV_{RF}V_{LO}\sin\omega_{IF}t$.
>
> **Reflections:** with identical diode reflection $\Gamma$, $V_{\Gamma1}=-j\Gamma V_{RF}/\sqrt2$, $V_{\Gamma2}=-\Gamma V_{RF}/\sqrt2$. Back through the hybrid: $V_\Gamma^{RF}=-\frac12\Gamma V_{RF}+\frac12\Gamma V_{RF}=0$ and $V_\Gamma^{LO}=j\Gamma V_{RF}$. Perfect RF match; the RF reflection goes to the LO port, so isolation needs $\Gamma\to0$ or matched diodes. The 180° case is Pozar Prob. 13.22.

### Double-Balanced Diode Ring

```tikz title="Double-balanced mixer: a diode ring between a 180-degree hybrid (RF) and a center-tapped LO transformer; the IF comes from the transformer center tap through a low-pass filter. Isolation at all three ports and rejection of even harmonics of RF and LO. After Pozar Fig. 13.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (1.6,1.6); \draw (0,0) -- (1.6,1.6) (0,1.6) -- (1.6,0);
  \node[font=\scriptsize] at (0.8,-0.3) {180$^\circ$};
  \draw[->] (-1.0,1.3) node[left] {RF ($\Delta$)} -- (0,1.3);
  \draw (0,0.3) -- (-0.6,0.3) to[R,l_=$Z_0$] (-0.6,-1.0) node[ground]{};
  \node[font=\scriptsize] at (-0.25,0.55) {$\Sigma$};
  \coordinate (A) at (3.0,2.6); \coordinate (B) at (5.0,2.6); \coordinate (C) at (5.0,0.6); \coordinate (D) at (3.0,0.6);
  \draw (A) to[D] (B) to[D] (C) to[D] (D) to[D] (A);
  \draw (1.6,1.3) -- (2.2,1.3) |- (A);
  \draw (1.6,0.3) -- (2.2,0.3) |- (2.2,-0.2) -| (C);
  \draw (B) -- (6.4,2.6);
  \draw (D) -- (3.0,-0.7) -- (6.4,-0.7);
  \draw (6.4,2.6) to[L] (6.4,0.95) to[L] (6.4,-0.7);
  \draw (7.6,2.4) to[L] (7.6,-0.5);
  \draw (7.6,2.4) -- (8.2,2.4) node[right] {LO};
  \draw (7.6,-0.5) -- (8.2,-0.5) node[ground]{};
  \node[font=\scriptsize] at (7.0,2.9) {LO transformer};
  \draw (6.4,0.95) node[circ]{} -- (7.0,0.95) -- (7.0,-1.5) -- (7.4,-1.5);
  \draw (7.4,-1.9) rectangle (8.4,-1.1); \node[font=\scriptsize] at (7.9,-1.5) {LPF};
  \draw[->] (8.4,-1.5) -- (9.2,-1.5) node[right] {IF};
\end{circuitikz}
\end{document}
```

- Four diodes: good isolation between **all three** ports, rejection of all even harmonics of RF and LO, very good conversion loss, and a **higher IIP3** than single-ended or balanced. Cost: RF input match is poor (Pozar).

### Differential FET Mixer and Gilbert Cell

```tikz title="Single-balanced differential FET mixer: the bottom FET converts RF to current g_m V_RF; the LO-driven top pair commutes it between the two loads. Modelled as an ideal switch with conduction waveform g(t), a square wave at f_LO. After Pozar Fig. 13.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$v_{LO}^+$};
  \node[right] at (M2.G) {$v_{LO}^-$};
  \draw (M1.S) |- (1.3,-0.9) -| (M2.S);
  \draw (1.3,-0.9) -- (1.3,-1.2) coordinate(t);
  \draw (t) node[nmos,anchor=D](M3){};
  \node[left] at (M3.G) {$v_{RF}$};
  \draw (M3.S) node[ground]{};
  \draw (M1.D) to[R,l=$R_D$] (0,2.4); \draw (M2.D) to[R,l_=$R_D$] (2.6,2.4);
  \draw (0,2.4) -- (2.6,2.4); \draw (1.3,2.4) -- (1.3,2.7) node[above]{$V_{dd}$};
  \draw (M1.D) node[circ]{} -- ++(0.5,0) node[right,font=\scriptsize] {$v_{IF}^+$};
  \draw (M2.D) node[circ]{} -- ++(-0.5,0) node[left,font=\scriptsize] {$v_{IF}^-$};
  \draw[->] (1.6,-1.7) -- (1.6,-2.2) node[right,font=\scriptsize] {$I_{RF}=g_mV_{RF}$};
  \begin{scope}[xshift=5.4cm,yshift=-0.6cm,x=0.9cm]
    \draw[->] (-0.2,0) -- (5.4,0) node[right] {$t$};
    \draw[thick,domain=-0.2:5,samples=120] plot (\x,{0.9*cos(deg(2*pi*\x/2))});
    \draw[very thick,blue!70!black] (-0.2,0.6) -- (0.5,0.6) -- (0.5,0) -- (1.5,0) -- (1.5,0.6) -- (2.5,0.6) -- (2.5,0) -- (3.5,0) -- (3.5,0.6) -- (4.5,0.6) -- (4.5,0) -- (5,0);
    \node[font=\scriptsize,anchor=west] at (5.1,0.9) {$v_{LO}^+$};
    \node[font=\scriptsize,text=blue!60!black,anchor=east] at (-0.3,0.6) {$g(t)$};
    \node[font=\scriptsize,anchor=north west] at (-0.2,-1.1) {$g(t)=\frac12+\frac2\pi\cos\omega_{LO}t-\dots$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{v_{IF}=v_{IF}^+-v_{IF}^-=-\frac{4}{\pi}g_mV_{RF}R_D\cos\omega_{LO}t\cos\omega_{RF}t\ \xrightarrow{\text{LPF}}\ -\frac{2}{\pi}g_mV_{RF}R_D\cos\omega_{IF}t}
$$

- **How it works:** the top FETs, biased slightly above pinch-off, each conduct a bit more than half the LO cycle, so one is always on. Their common source is a virtual ground for the LO. The bottom FET is an ordinary RF amplifier (saturated, often with a current source or inductive degeneration).
- **Single balanced:** the differential output cancels the RF and LO terms *without filtering*; only $\omega_{LO}\pm\omega_{RF}$ remain. The conversion voltage gain is $\frac2\pi g_mR_D$.
- **Gilbert cell = two single-balanced mixers** sharing the IF loads with cross-coupled outputs: differential LO, RF and IF ports, and RF *and* LO cancel at the IF by symmetry. Four switches, two RF transconductors, one tail current source. "Frequently used in CMOS RFICs" (Pozar).

> [!tip] Remark
> The Gilbert cell as a variable-gain multiplier, its headroom ($V_{CM,cont}\le V_{CM,in}-V_{GS1}+V_{TH5,6}$) and the swap of signal and control pairs are in [[Differential Amplifiers#Level 6 The Gilbert Cell]]. In a mixer the LO drives the top quad hard (switching) and the RF drives the bottom pair (linear $V\to I$, degenerate it for IIP3). Mismatch in the quad converts LO into IF (feedthrough) and gives DC offset: [[Nonlinearity and Mismatch#Level 3 Mismatch and Offset]].

> [!note]- Derivation: single-balanced output (Pozar Eqs. 13.124-13.127)
> Ideal switch conduction waveform for the left FET: $g(t)=\frac12+\frac2\pi\cos\omega_{LO}t-\frac{2}{3\pi}\cos3\omega_{LO}t+\dots$; the right FET conducts $1-g(t)$. Keeping two terms:
> $$v_{IF}^+=-g(t)I_{RF}R_D=-g_mV_{RF}R_D\left(\tfrac12+\tfrac2\pi\cos\omega_{LO}t\right)\cos\omega_{RF}t,$$
> $$v_{IF}^-=-[1-g(t)]I_{RF}R_D=-g_mV_{RF}R_D\left(\tfrac12-\tfrac2\pi\cos\omega_{LO}t\right)\cos\omega_{RF}t.$$
> Subtract: the $\frac12\cos\omega_{RF}t$ terms cancel, leaving $-\frac4\pi g_mV_{RF}R_D\cos\omega_{LO}t\cos\omega_{RF}t$, whose difference-frequency half is the boxed IF.

### Subharmonically Pumped Mixer

An **antiparallel diode pair** has a symmetric I-V, so it acts as a resistive frequency doubler on the LO: the LO runs at **half** the usual frequency, $\omega_0=\frac12(\omega_r-\omega_i)$, and the fundamental RF×LO product is suppressed, improving conversion loss. Used for mm-wave down-converters, e.g. a SiGe 43.5-45.5 GHz MMIC with NF below 6 dB (Pozar Figs. 13.35-13.36).

### Image-Reject Mixer

```tikz title="Image-reject mixer: a 90-degree RF hybrid splits the RF, an in-phase LO drives two mixers, and a 90-degree IF hybrid recombines the IFs so the lower sideband exits port 1 and the upper sideband port 2. After Pozar Fig. 13.31."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (1.6,1.6); \draw (0,0) -- (1.6,1.6) (0,1.6) -- (1.6,0);
  \node[font=\scriptsize] at (0.8,-0.35) {90$^\circ$ RF hybrid};
  \draw[->] (-1.0,1.3) node[left] {RF} -- (0,1.3);
  \draw (0,0.3) -- (-0.5,0.3) to[R,l_=$Z_0$] (-0.5,-1.0) node[ground]{};
  \foreach \y/\n in {2.4/A,-0.8/B} {
    \draw[thick] (3.4,\y) circle (0.35);
    \draw[thick] (3.15,\y-0.25) -- (3.65,\y+0.25) (3.15,\y+0.25) -- (3.65,\y-0.25);
    \draw (4.4,\y-0.35) rectangle (5.4,\y+0.35); \node[font=\scriptsize] at (4.9,\y) {LPF};
    \draw[->] (3.75,\y) -- (4.4,\y);
    \node[font=\scriptsize] at (6.0,\y+0.3) {$v_{IF}^{\n}$};
  }
  \draw[->] (1.6,1.3) -- (2.2,1.3) |- (3.05,2.4); \node[font=\scriptsize] at (2.6,2.65) {$v_{RF}^A$};
  \draw[->] (1.6,0.3) -- (2.2,0.3) |- (3.05,-0.8); \node[font=\scriptsize] at (2.6,-0.55) {$v_{RF}^B$};
  \draw[->] (3.4,0.8) -- (3.4,2.05); \draw[->] (3.4,0.8) -- (3.4,-0.45);
  \draw (3.4,0.8) -- (4.2,0.8) node[right] {LO (in phase)};
  \draw (7.2,0) rectangle (8.8,1.6); \draw (7.2,0) -- (8.8,1.6) (7.2,1.6) -- (8.8,0);
  \node[font=\scriptsize] at (8.0,-0.35) {90$^\circ$ IF hybrid};
  \draw[->] (5.4,2.4) -- (6.6,2.4) |- (7.2,1.3);
  \draw[->] (5.4,-0.8) -- (6.6,-0.8) |- (7.2,0.3);
  \draw[->] (8.8,1.3) -- (9.6,1.3) node[right] {LSB};
  \draw[->] (8.8,0.3) -- (9.6,0.3) node[right] {USB};
\end{circuitikz}
\end{document}
```

$$
\boxed{v_1(t)=\frac{KV_{LO}V_L}{2}\cos\omega_{IF}t\ \text{(LSB)},\qquad v_2(t)=\frac{KV_{LO}V_U}{2}\sin\omega_{IF}t\ \text{(USB)}}
$$

- RF input $V_U\cos(\omega_{LO}+\omega_{IF})t+V_L\cos(\omega_{LO}-\omega_{IF})t$: after the mixers, $V_{IF}^A\propto -j(V_U-V_L)$ and $V_{IF}^B\propto-(V_U+V_L)$; the IF hybrid adds them with the 90° that makes one sideband cancel at each port (Pozar Eqs. 13.117-13.122).
- **No extra loss** beyond the two mixers' conversion loss (ideal hybrids). Run backwards, it is a **single-sideband modulator**.
- The hard part: a good 90° hybrid at the low IF. Hybrid loss raises NF; with dissipative RF and IF hybrid losses $L_R$, $L_I$ the overall loss and NF grow (Pozar Prob. 13.23). Image rejection is limited by the hybrids' amplitude and phase balance.

### Choosing a Mixer (Pozar Table 13.1)

| Mixer | Diodes | RF match | RF-LO isolation | Conversion loss | IIP3 |
|---|---|---|---|---|---|
| Single-ended | 1 | Poor | Fair | Good | Fair |
| Balanced (90°) | 2 | Good | Poor | Good | Fair |
| Balanced (180°) | 2 | Fair | Excellent | Good | Fair |
| Double balanced | 4 | Poor | Excellent | Excellent | Excellent |
| Image reject | 2 or 4 | Good | Good | Good | Good |

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| More negative small-signal $R_{in}$ (feedback inductor, CG/CB) | Start-up margin, $\lvert\Gamma_{in}\rvert$ | Risk of oscillating at unwanted frequencies; large-signal $f_0$ shift |
| $R_L=R_0/3$ (vs closer to $R_0$) | Output power (linear limiting), start-up margin | Less margin if $R_{in}$ falls faster than linear |
| Higher-$Q$ resonator (DR, cavity) | Kurokawa stability, close-in phase noise ($\propto1/Q_0^2$), pulling | Tuning range, size, cost; DR placement tolerance |
| Parallel instead of series DR feedback | Tuning range | CAD-heavy design |
| Si BJT instead of GaAs FET | Close-in phase noise (flicker corner kHz vs MHz) | Lower $f_{max}$ |
| Multiply instead of oscillating at $nf_0$ | Power, stability at mm-wave | $+20\log n$ phase noise; harmonics to filter |
| Higher IF | Image-reject filter becomes feasible | IF filter and ADC harder; more LO tuning |
| High-side LO | Smaller LO tuning ratio | Image above the band |
| More LO power (to ~10 dBm) | Conversion loss, switching, IIP3 | LO power, LO feedthrough and radiation |
| Transistor instead of diode mixer | Conversion gain (hides IF-amp noise) | Higher own NF; DC power |
| Balance (90°, 180°, double, Gilbert) | Match / isolation / even-order rejection / IIP3 | Hybrids, baluns, more devices; relies on matching |
| Degenerate the Gilbert RF pair | IIP3 | Conversion gain, NF |
| Image-reject mixer | Image rejection without RF filter | Two mixers + low-frequency 90° hybrid; NF; balance-limited |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Negative resistance | $\lvert\Gamma\rvert>1\iff\operatorname{Re}Z<0$; read on chart at $1/\Gamma^*$ |
| Oscillation condition | $R_L+R_{in}=0$, $X_L+X_{in}=0$; $\Gamma_L\Gamma_{in}=1$ |
| Kurokawa (passive load) | $\frac{\partial R_{in}}{\partial I}\frac{\partial(X_L+X_{in})}{\partial\omega}-\frac{\partial X_{in}}{\partial I}\frac{\partial R_{in}}{\partial\omega}>0$ |
| Max-power load (linear $R_D$) | $Z_L=R_0/3-jX_D$, $P_{max}=4R_0^3/(27a^2)$ |
| Two-port termination | $Z_S=-R_{in}/3-jX_{in}$ |
| Both ports oscillate | $\Gamma_S\Gamma_{in}=1\Rightarrow\Gamma_L\Gamma_{out}=1$ |
| DR on a line | $Z=\frac{N^2R}{1+j2Q_0\Delta\omega/\omega_0}$, $g=\frac{N^2R}{2Z_0}$ ($\times2$ with open $\lambda/4$), $\Gamma=\frac{g}{1+g}$ |
| Phase-noise PSD (Pozar) | $S_\phi=\frac{kT_0F}{P_0}\left(\frac{K\omega_\alpha\omega_h^2}{\Delta\omega^3}+\frac{\omega_h^2}{\Delta\omega^2}+\frac{K\omega_\alpha}{\Delta\omega}+1\right)$, $\omega_h=\omega_0/2Q_0$ |
| Reciprocal mixing spec | $\mathcal L(f_m)=C-S-I-10\log B$ |
| Multiplier noise | $+20\log n$ dB |
| Manley-Rowe multiplier | $\sum_{n\ge2}P_{n0}=-P_{10}$; 100% possible |
| Resistive multiplier | $\lvert P_m/P_1\rvert\le1/m^2$ |
| Class-B doubler | $I_n=I_{max}\frac{4\tau}{\pi T}\frac{\cos(n\pi\tau/T)}{1-(2n\tau/T)^2}$, $R_L=\frac{V_{d,max}-V_{d,min}}{2I_n}$, $P_n=\frac12I_n^2R_L$ |
| Conversion | $f_{IF}=f_{RF}-f_{LO}$, $f_{RF}=f_{LO}\pm f_{IF}$ |
| Image | $f_{IM}=f_{LO}-f_{IF}$, $2f_{IF}$ from RF |
| Conversion loss | $L_c=10\log(P_{RF,avail}/P_{IF,avail})$ |
| Mixer NF | $F_{DSB}=\frac{2}{K^2L_c}(1+\frac{N_{added}}{kT_0B})$, $F_{SSB}=2F_{DSB}$ |
| Diode mixer IF | $i_{IF}=\frac{G_d'}{2}V_{RF}V_{LO}\cos\omega_{IF}t$ |
| FET mixer gain | $G_c=\frac{g_1^2R_d}{4\omega_{RF}^2C_{gs}^2R_i}$ |
| Switching waveform | $g(t)=\frac12+\frac2\pi\cos\omega_{LO}t-\frac{2}{3\pi}\cos3\omega_{LO}t$ |
| Single-balanced IF | $v_{IF}=-\frac2\pi g_mV_{RF}R_D\cos\omega_{IF}t$ |
| LO swing for switching | $V_{LO}\ge\sqrt2V_{OV,sw}$, $(g_m/I_D)_{sw}\ge2\sqrt2/V_{LO}$ |
| Image-reject outputs | $v_1=\frac{KV_{LO}V_L}{2}\cos\omega_{IF}t$, $v_2=\frac{KV_{LO}V_U}{2}\sin\omega_{IF}t$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20), Ch. 13 Oscillators and Mixers:
  - §13.2 Microwave Oscillators, pp. 613-622: one-port negative-resistance oscillator (Eqs. 13.24-13.26), Kurokawa (13.27-13.30), Ex. 13.2; transistor oscillators (13.31-13.34), Ex. 13.3, Fig. 13.9; DROs (13.35-13.37), Figs. 13.10-13.12, Ex. 13.4.
  - §13.3 Oscillator Phase Noise, pp. 622-627: only the Leeson low/high-$Q$ cases (13.48-13.49), device flicker corners, Fig. 13.17, reciprocal mixing (13.50), Ex. 13.5. The rest is owned by [[Oscillators]].
  - §13.4 Frequency Multipliers, pp. 627-636: Manley-Rowe (13.51-13.61), resistive limit (13.62-13.69), FET doubler (13.70-13.80), Ex. 13.6.
  - §13.5 Mixers, pp. 637-653: characteristics (13.81-13.97), Ex. 13.7, single-ended diode (13.98-13.101) and FET (13.102-13.108) mixers, Ex. 13.8, balanced mixer (13.109-13.116), image-reject mixer (13.117-13.122), differential FET and Gilbert cell (13.123-13.127), double-balanced and subharmonic mixers, Table 13.1.
  - Problems 13.4, 13.18 (our solution), 13.19, 13.22, 13.23.
  - Not used: §13.1 RF oscillators (Colpitts, Hartley, crystal; owned by [[Oscillators]]).
- **ECE 373 binder (Boumaiza), "RF Oscillators and Mixers"** (PDF page = binder page): pp. 375-381 (negative-resistance vs feedback oscillators, flow-graph condition, one-port oscillator), pp. 382-388 (linear $R_D(I)$, $R_0/3$ maximum power, 10 GHz diode example), pp. 389-394 (two-port oscillator networks $N_F$, $N_T$, $N_L$, general transistor model, design steps), pp. 395-401 (Example 4, flagged), pp. 402-410 (mixer in the heterodyne receiver, spectra, simple diode/FET mixers, design issues, image problem, LO feedthrough, reverse LO feedthrough and self-mixing).
- No Zettelkasten extensions: `AnalogTheory/` has no mixer or microwave-oscillator material beyond what [[Oscillators]] already uses.
