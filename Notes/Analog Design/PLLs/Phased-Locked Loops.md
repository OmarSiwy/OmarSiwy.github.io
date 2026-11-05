---
title: Phase-Locked Loops
description: A feedback loop whose variable is phase. Type I versus charge-pump type II loops, natural frequency, damping and jitter peaking, how the loop shapes reference, charge-pump, filter and VCO noise, charge-pump mismatch as static phase offset, DLLs, synthesizers, and how PLL specs become I_CP, R, C and charge-pump device sizes.
kind: topic
status: growing
aliases:
  - Phase-Locked Loops
  - Phased-Locked Loops
  - PLL
  - PLLs
---

A PLL is negative feedback where the quantity being compared is **phase**. Its actuator, the VCO, controls frequency, so it enters the loop as an integrator that cannot be removed, and every unusual property of PLLs follows from that. The sections go coarse to fine: the loop as a black box, then the linear model, the simple type I loop and its trade-offs, the charge-pump type II loop that everyone builds, what the loop does to jitter, the circuit nonidealities, DLLs, and applications. Stop after any section and the picture is still correct, just coarser.

## The big picture

```tikz title="Charge-pump PLL (integer-N synthesizer). Gray labels are the linear model of each block. After Razavi Figs. 16.38, 16.55 and Carusone Figs. 19.1, 19.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,thick,minimum height=1.1cm,minimum width=1.4cm,align=center}]
  \node[blk] (pfd) at (1.4,0) {PFD};
  \node[blk] (cp) at (3.9,0) {CP\\[-2pt]{\scriptsize $\pm I_{CP}$}};
  \node[blk] (vco) at (9.6,0) {VCO};
  \node[blk] (div) at (5.5,-3.7) {$\div N$};
  \draw[->] (-0.8,0) node[left] {$f_{ref}$} -- (pfd.west);
  \draw[->] ([yshift=0.25cm]pfd.east) -- node[above,font=\scriptsize] {UP} ([yshift=0.25cm]cp.west);
  \draw[->] ([yshift=-0.25cm]pfd.east) -- node[below,font=\scriptsize] {DN} ([yshift=-0.25cm]cp.west);
  \draw (cp.east) -- (5.5,0) node[circ] {} -- (7.0,0) node[circ] {} -- (vco.west);
  \draw (5.5,0) to[R, l_=$R$] (5.5,-1.0) to[C, l_=$C_1$] (5.5,-2.1) node[ground] {};
  \draw (7.0,0) to[C, l=$C_2$] (7.0,-1.4) node[ground] {};
  \node[above,font=\scriptsize] at (7.85,0) {$V_{ctrl}$};
  \draw[->] (vco.east) -- (12.4,0) node[right] {$f_{out}=Nf_{ref}$};
  \draw[->] (11.3,0) node[circ] {} |- (div.east);
  \draw[->] (div.west) -| node[pos=0.75,left,font=\scriptsize] {$f_{fb}$} (pfd.south);
  \node[gray,font=\scriptsize] at (2.65,1.0) {$K_{PD}=I_{CP}/2\pi$ (A/rad)};
  \node[gray,font=\scriptsize] at (6.25,1.0) {$F(s)=V_{ctrl}/I$};
  \node[gray,font=\scriptsize] at (9.6,1.0) {$K_{VCO}/s$};
  \node[gray,font=\scriptsize] at (5.5,-4.55) {$1/N$};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Locked means equal frequency, small phase error.** $\omega_{out}=N\omega_{ref}$ exactly; only the phase error can be nonzero. That exactness is why a PLL exists ([[#What locking means]]).
> 2. **The charge-pump PLL is type II, second order:** $\omega_n=\sqrt{\dfrac{I_{CP}K_{VCO}}{2\pi NC_1}}$, $\zeta=\dfrac{R}{2}\sqrt{\dfrac{I_{CP}C_1K_{VCO}}{2\pi N}}$. Two integrators make it unstable; the zero from $R$ stabilizes it, and more loop gain makes it *more* stable.
> 3. **Jitter transfer:** the loop **low-passes** reference (and divider, charge-pump) noise, multiplied by $N$, and **high-passes** VCO noise. The loop bandwidth is the knob between them, and it must stay below about $f_{ref}/10$.
> 4. **Peaking never fully vanishes** in a type II loop: $\zeta=1$ still peaks 1.25 dB; $<0.1$ dB needs $\zeta\approx5$, with large components.
> 5. **Charge-pump mismatch becomes static phase offset:** $\phi_{os}\approx2\pi\dfrac{\Delta I}{I_{CP}}\dfrac{T_{rst}}{T_{ref}}$, plus ripple that becomes reference spurs. The charge pump's matching, output impedance and noise are what the gm/ID sizing has to deliver.

**Map:** [[#Spec translation]] → [[#Level 0 Phase as the Loop Variable|phase, detectors, linear model]] → [[#Level 1 The Type I PLL|type I and its trade-offs]] → [[#Level 2 The Charge-Pump Type II PLL|PFD, charge pump, $\omega_n$, $\zeta$, design]] → [[#Level 3 Jitter Transfer and Noise|jitter transfer, noise, loop bandwidth]] → [[#Level 4 Circuit Nonidealities|dead zone, mismatch, charge sharing, spurs, divider]] → [[#Level 5 Delay-Locked Loops|DLLs]] → [[#Level 6 Applications|synthesis, skew, clock recovery]].

## Spec translation

A PLL is not an amplifier, but it contains three things gm/ID sizes: the **charge-pump current sources** (a current mirror with two switches), the **bootstrap buffer** of the charge pump (the op-amp a passive-filter PLL contains, if any), and the **VCO** (owned by [[Oscillators#Spec translation]]). The translation has three steps: PLL specs → loop parameters ($N$, $\omega_n$, $\zeta$, bandwidth) → component values ($I_{CP}$, $R$, $C_1$, $C_2$, $K_{VCO}$) and circuit specs → device sizes.

### The block's specs

| Spec | What it is | Typical (source) |
|---|---|---|
| Output frequency, range | $f_{out}=\frac{N}{M}f_{ref}$, over all required $N$ and PVT | 1.4–1.6 GHz from 40 MHz (Carusone Ex. 19.8); 14 GHz from 156.25 MHz (Palermo L11) |
| Resolution (channel step) | Smallest change of $f_{out}$: $f_{ref}/M$ | 20 MHz (Carusone Ex. 19.8); 30 kHz steps from 900 to 925 MHz (Razavi §16.5.1) |
| Frequency accuracy | Equal to the reference's (crystal) | $<10$ ppm (Razavi §16.5.1) |
| Acquisition / lock range | Input range over which the loop locks | $\approx\omega_{LPF}$ for type I; the whole VCO tuning range with a PFD (Razavi §16.2.1) |
| Settling (lock) time | Time to reach and stay within $\delta f$ after a step | 100 Hz of a 200 kHz step in 0.12 ms (Razavi Ex. 16.5) |
| Jitter / integrated phase noise | rms jitter over a band, or $\mathcal L(\Delta f)$ | 365 fs rms over 10 kHz–10 MHz at 14 GHz (Palermo L11); about 500 fs at 28 GHz (Lee et al.) |
| Jitter peaking | $\max_f\lvert H(f)\rvert/N$ in dB | $<0.1$ dB class in link standards ([[Link Noise and Jitter#Jitter Transfer and Its Mask]]) |
| Reference spurs | Sidebands at $f_{out}\pm f_{ref}$ | set by ripple on $V_{ctrl}$ |
| Static phase offset | Fixed skew between $f_{ref}$ and $f_{fb}$ | zero ideally; the whole spec in skew-cancelling PLLs |
| Power, area | Area is mostly $C_1$ | $C_1=74$ pF in Palermo's 14 GHz PLL |

### PLL specs → loop parameters

$$
\boxed{N=\frac{f_{out}}{f_{ref}/M}}\qquad
\boxed{f_{BW}\lesssim\frac{f_{ref}}{10}}\qquad
\boxed{\zeta\ge1\ (\text{peaking}\le1.25\text{ dB}),\quad \zeta\approx5\ (<0.1\text{ dB})}
$$

$$
\boxed{t_s\approx\frac{\ln(\Delta\omega/\delta\omega)}{\zeta\omega_n},\qquad \zeta\omega_n=\frac{R\,I_{CP}K_{VCO}}{4\pi N}}\qquad
\boxed{K_{VCO}\ge\frac{\omega_{max}-\omega_{min}}{V_{ctrl,max}-V_{ctrl,min}}}
$$

- **Resolution sets $f_{ref}/M$, which caps the bandwidth**, which caps settling speed and how much VCO noise the loop can suppress. Fine steps and fast, clean loops fight in an integer-N synthesizer.
- **The bandwidth is chosen from noise**, near where the reference's in-band noise ($N^2S_{\phi,ref}$) crosses the free-running VCO's ([[#Choosing the loop bandwidth]]).
- **$\zeta$ comes from the peaking and settling specs** ([[#Bandwidth, phase margin and peaking]]).

Then, with $K_{VCO}$ and $N$ fixed, the loop parameters fix the components:

$$
\boxed{\frac{I_{CP}}{C_1}=\frac{2\pi N\omega_n^2}{K_{VCO}},\qquad R=\frac{2\zeta}{\omega_nC_1},\qquad C_2\approx\frac{C_1}{10}\ (\zeta=1)\ \text{to}\ \frac{C_1}{250}\ (\zeta=5)}
$$

> [!note]- Derivation: components from $\omega_n$ and $\zeta$
> From $\omega_n^2=I_{CP}K_{VCO}/(2\pi NC_1)$ the ratio $I_{CP}/C_1$ is fixed. From $\zeta=\frac R2\sqrt{I_{CP}C_1K_{VCO}/(2\pi N)}=\frac R2\,\omega_nC_1$, $R=2\zeta/(\omega_nC_1)$. One degree of freedom is left: the absolute size of $I_{CP}$ (and with it $C_1\propto I_{CP}$, $R\propto1/I_{CP}$). Larger $I_{CP}$: larger $C_1$ (area), smaller $R$ (less resistor noise), less charge-pump noise referred to phase, more power. Palermo L11 slide 38: "smaller resistor results in larger capacitors (higher area) and larger charge pump current". $C_2$ comes from the third-pole rule ([[#The third pole C2]]). The settling expression is Razavi Ex. 16.5's worst case $e^{-\zeta\omega_nt_s}=\delta\omega/\Delta\omega$; for the type II loop $1/(\zeta\omega_n)=4\pi N/(RI_{CP}K_{VCO})$ (Razavi Eq. 16.54).

### Loop parameters → circuit and amplifier specs

| PLL spec | Circuit inside | Spec it sets | Condition |
|---|---|---|---|
| Static phase offset $\phi_{os}$ | CP UP/DN current sources | Current matching $\Delta I/I_{CP}$ | $\dfrac{\Delta I}{I_{CP}}\le\dfrac{\phi_{os}}{2\pi}\dfrac{T_{ref}}{T_{rst}}$ |
| Offset and spurs constant over the tuning range | CP current sources | **Output impedance** $R_{out}$ of each source | $(g_{o,UP}+g_{o,DN})\frac{\Delta V_{ctrl}}{2}\le\Delta I_{max}$ |
| Tuning range | CP output stack | **Output swing** (= $V_{ctrl}$ range) | $V_{ctrl}\in[V_{D,sat,N}+V_{sw},\ V_{DD}-V_{D,sat,P}-V_{sw}]$ per device in the stack |
| No dead zone, PFD speed | PFD reset path, CP switches | Reset pulse $T_{rst}$ | $t_{on,switch}<T_{rst}\le T_{ref}/2$ |
| In-band phase noise | CP current sources | **Output noise current** $S_{i}$ | $S_{\phi,out}\approx\left(\frac{2\pi N}{I_{CP}}\right)^2\frac{T_{rst}}{T_{ref}}S_i$ in band |
| Spurs from charge sharing | Bootstrap buffer (unity gain) | **Input CM range** = **output swing** = $V_{ctrl}$ range; offset; settles within $T_{ref}-T_{rst}$ | holds $X$, $Y$ at $V_{ctrl}$ |
| Spurs from switching | CP switches | Skew, charge-injection matching | equal UP/DN delay and edge rates |
| Loop-filter noise / area | $R$, $C_1$ | $4kTR$, cap density | [[#Loop-filter, charge-pump and divider noise]] |
| High-pass part of jitter | VCO | Phase noise, $K_{VCO}$ | [[Oscillators#Spec translation]] |
| Maximum $f_{out}$ | First divider stage | Toggle rate $\ge f_{VCO,max}$ plus margin | [[High-Speed Circuit Techniques]] (CML ÷2) |

> [!note]- Derivation: why each condition holds
> **Matching.** In lock the net charge per cycle is zero. With $I_{UP}=I_{CP}-\Delta I/2$, $I_{DN}=I_{CP}+\Delta I/2$ and both on for $T_{rst}$, UP must turn on $T_{os}$ earlier: $I_{UP}T_{os}=\Delta I\,T_{rst}$, so $T_{os}\approx(\Delta I/I_{CP})T_{rst}$ and $\phi_{os}=2\pi T_{os}/T_{ref}$ ([[#Current mismatch becomes static phase offset]]). Invert for the allowed $\Delta I/I_{CP}$.
>
> **Output impedance.** Each source's current moves with its drain voltage by $g_o\,\Delta V$. As $V_{ctrl}$ moves (the VCO tunes), the UP source loses current while the DN source gains it, so the mismatch changes by $(g_{o,UP}+g_{o,DN})\Delta V_{ctrl}$ (Razavi §16.3.1, point 2). Matching them at mid-range, the worst case at either end is half the span. That ΔI must fit in the offset/spur budget. (Derived here from Razavi's qualitative statement.)
>
> **Swing.** Every device between $V_{ctrl}$ and a rail must stay saturated (sources) or nearly so (switches, drop $V_{sw}$), so the stack's $V_{D,sat}$s come straight out of the tuning range. A cascoded source costs two $V_{D,sat}$ per side.
>
> **$T_{rst}$ window.** Lower bound: the coincident UP/DN pulses must be wide enough to switch the pump fully on, or a dead zone appears (Razavi §16.3.1). Upper bound: the PFD ignores edges during reset, so frequency detection fails if $T_{rst}$ approaches $T_{ref}/2$; $f_{PFD,max}=1/(2T_{rst})$ (Palermo L11 slide 75).
>
> **Noise.** The pump's device noise reaches the filter only while the sources are switched on, a fraction $T_{rst}/T_{ref}$ of the time in lock; white noise scales by $T_{rst}/T_{ref}$, flicker by $(T_{rst}/T_{ref})^2$ (Lacaita, via Palermo L11 slide 36). Inside the loop bandwidth, a current $i_n$ is indistinguishable from a phase error $2\pi i_n/I_{CP}$ at the PFD, which reaches the output multiplied by $N$ ([[#Four noise sources, four shapes]]).
>
> **Bootstrap buffer.** It copies $V_{ctrl}$ onto the idle current-source drains $X$, $Y$ (Razavi Fig. 16.47), so it must follow $V_{ctrl}$ across its whole range (input CM range and output swing both equal to the tuning span), its offset is a residual voltage step on $X$, $Y$ that is charge-shared onto the filter each cycle, and it has the whole off-time $T_{ref}-T_{rst}$ to settle. It supplies little current since $I_1\approx I_2$ (Razavi p. 680).

### Where it lands in sizing

$$
\boxed{\sigma\!\left(\frac{\Delta I}{I}\right)^2\approx\left(\frac{g_m}{I_D}\right)^2\sigma_{V_{TH}}^2+\sigma_{\beta}^2}\qquad
\boxed{S_{i}=4kT\gamma\,g_m=4kT\gamma\left(\frac{g_m}{I_D}\right)I_{CP}}\qquad
\boxed{V_{D,sat}\approx\frac{2}{g_m/I_D}}
$$

| CP spec | Fixes | How |
|---|---|---|
| Random $\Delta I/I_{CP}$ | Low $g_m/I_D$, large $WL$ | mismatch in $V_{TH}$ is multiplied by $g_m/I_D$; area from Pelgrom |
| $R_{out}$ | $L$, cascode | $r_o=(g_mr_o)/g_m$; cascode gives $\approx g_mr_o\cdot r_o$ |
| Output swing | High $g_m/I_D$, fewer stacked devices | each saturated device costs $\approx2/(g_m/I_D)$ |
| In-band noise | Low $g_m/I_D$, large $I_{CP}$ | $S_{\phi,out}\propto S_i/I_{CP}^2\propto(g_m/I_D)/I_{CP}$ |
| $T_{rst}$ lower bound | Switch $W$ at $L_{min}$ | switch on-time and charge injection |

> [!tip] Remark
> The charge-pump source is a current mirror, and every row above is a mirror result: matching is [[Current Mirrors]] plus [[Nonlinearity and Mismatch]] (Pelgrom), $r_o$ and the cascode are [[MosFETs#Output Resistance and Intrinsic Gain]] and [[Single-Stage#Cascode]], the noise is [[Noise#MOSFET Channel Thermal Noise]]. The method that turns $g_m/I_D$ and $L$ into $W$ is [[gm-ID Design Methodology]].

> [!important] The charge-pump trade in one line
> Matching and noise want **low** $g_m/I_D$ (large overdrive) and cascodes; the tuning range wants **high** $g_m/I_D$ and no cascodes. A low-supply charge pump resolves it with an amplifier that holds the drains steady (Young 1992, Palermo L11 slide 81) instead of a cascode.

### Worked example: a 14 GHz SerDes PLL (Palermo L11 slides 29, 36–42, 59–61)

Given: $f_{ref}=156.25$ MHz ($T_{ref}=6.4$ ns), $N=90$, $f_{VCO}=14$ GHz, LC VCO with $K_{VCO}=2\pi\cdot1$ GHz/V, specs $f_u=2$ MHz loop crossover and $\Phi_m=60^\circ$.

1. **Loop filter** (maximum-phase-margin procedure, [[#Design procedure]]): $C_1/C_2=12.9$, $\omega_z=2\pi\cdot536$ kHz, $\omega_{p3}=2\pi\cdot7.45$ MHz. $R=4$ kΩ chosen for low noise, so $C_1=74$ pF, $C_2=5.8$ pF.
2. **Pump current:** $I_{CP}=310$ µA. Closed-loop bandwidth 3.1 MHz $=f_{ref}/50$.
3. **Noise budget (10 kHz–10 MHz):** reference 217 fs, charge pump 61 fs, $R$ 128 fs, VCO 257 fs; total $\sqrt{217^2+61^2+128^2+257^2}=365$ fs rms. VCO 50%, reference 35%, filter 12%, pump 3% of the variance.

Continuing into the charge pump (illustrative numbers chosen here, not Palermo's; $T_{rst}=40$ ps from slide 36):

4. **Matching.** Target 1 ps static offset at the PFD: $\Delta I/I_{CP}\le1\text{ ps}/40\text{ ps}=2.5\%$. Give half to random mismatch, half to output impedance: $\Delta I_{max}=1.25\%\cdot310\ \mu\text{A}=3.9$ µA each.
5. **Output impedance.** For a 0.5 V control span, $(g_{o,UP}+g_{o,DN})\cdot0.25\text{ V}\le3.9$ µA, so each source needs $R_{out}\ge129$ kΩ. At $g_m/I_D=10$ S/A, $g_m=3.1$ mS, so $g_mR_{out}\ge400$: no single short device gives that; a cascode with $g_mr_o\approx20$ per device does.
6. **Swing.** That cascode at $g_m/I_D=10$ costs $2\times0.2$ V per side, 0.8 V of the supply before the switches. On a sub-1 V supply, raise $g_m/I_D$ (shrinks $V_{D,sat}$, hurts matching) or replace the cascode by an amplifier-regulated drain.
7. **Random matching.** $\sigma(\Delta V_{TH})\le1.25\%/(g_m/I_D)=1.25$ mV, which with the process's Pelgrom coefficient sets $WL$.
8. **Pump noise check** ($\gamma=2/3$, two sources): $S_i=2\cdot4kT\gamma g_m\approx6.9\times10^{-23}$ A²/Hz, times $T_{rst}/T_{ref}=1/160$, times $(2\pi N/I_{CP})^2=3.3\times10^{12}$: about $1.4\times10^{-12}$ rad²/Hz, i.e. $\mathcal L\approx-121$ dBc/Hz in band. Halving $g_m/I_D$ buys 3 dB.

## Level 0: Phase as the Loop Variable

### What locking means

$$
\boxed{\text{locked}\iff\phi_{out}-\phi_{in}\ \text{constant}\ \Rightarrow\ \omega_{out}=\omega_{in}\ \text{exactly}}
$$

- Phase error may be nonzero; frequency error is **exactly zero**. A loop that compared *frequencies* would keep a finite frequency error from any offset, like an op amp's input offset in a unity-gain buffer (Razavi Fig. 16.10). Phase locking is what makes $f_{out}=Nf_{ref}$ exact.
- A PLL only reacts to the **excess** phase. Two perfectly periodic signals at the same frequency produce no transient (Razavi p. 660).
- **Why not a wire?** Because the output can be at $N$ times the input, can sit at a different phase than a buffered copy, and can have less (fast) jitter than the input (Razavi §16.5).

### Phase moves only through frequency

$$
\boxed{\phi_{out}(t)=\int K_{VCO}V_{ctrl}\,dt\quad\Longleftrightarrow\quad\frac{\Phi_{out}}{V_{ctrl}}(s)=\frac{K_{VCO}}{s}}
$$

To remove a phase error the VCO must be briefly at the **wrong** frequency; the area under the frequency transient is the phase gained (Razavi Eq. 16.8). After a phase step the loop returns $V_{ctrl}$ and $\omega_{out}$ to their old values; after a frequency step both move permanently (Razavi Figs. 16.11, 16.12). For the loop to settle, phase **and** frequency must both settle (Razavi Fig. 16.13).

> [!tip] Remark
> The $1/s$ is [[Oscillators#Level 4 The VCO as a Phase Integrator]]: frequency is the derivative of phase. It is a pole at the origin that every PLL has, which is why every PLL is at least type I.

### Phase detectors

```tikz title="Average output versus phase difference of three detectors: XOR (periodic triangle, slope V0/pi, locks at pi/2), three-state PFD (linear over +-2pi, slope I_CP/2pi), D flip-flop bang-bang (sign only). After Razavi Figs. 16.3, 16.26, 16.23(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (-0.2,0) -- (3.6,0) node[right] {$\Delta\phi$};
    \draw[->] (0,-0.2) -- (0,1.9) node[above] {$\overline{V}_{out}$};
    \draw[thick] (0,0) -- (1.5,1.4) -- (3.0,0);
    \draw (1.5,0.08) -- (1.5,-0.08) node[below,font=\scriptsize] {$\pi$};
    \draw (3.0,0.08) -- (3.0,-0.08) node[below,font=\scriptsize] {$2\pi$};
    \draw[dashed] (0,1.4) node[left,font=\scriptsize] {$V_0$} -- (1.5,1.4);
    \node[font=\scriptsize] at (1.6,-0.85) {XOR: $K_{PD}=V_0/\pi$};
  \end{scope}
  \begin{scope}[xshift=7.2cm]
    \draw[->] (-2.7,0) -- (2.9,0) node[right] {$\Delta\phi$};
    \draw[->] (0,-1.4) -- (0,1.9) node[above] {$\overline{I}_{CP}$};
    \draw[thick] (-2.0,-1.1) -- (2.0,1.1);
    \draw[thick] (2.0,1.1) -- (2.0,-1.1) -- (2.5,-0.82);
    \draw[thick] (-2.0,-1.1) -- (-2.0,1.1) -- (-2.5,0.82);
    \node[below,font=\scriptsize] at (1.75,0) {$2\pi$};
    \node[above,font=\scriptsize] at (-1.65,0) {$-2\pi$};
    \node[font=\scriptsize] at (0,-1.75) {PFD + CP: $K_{PD}=I_{CP}/2\pi$};
  \end{scope}
  \begin{scope}[xshift=12.9cm]
    \draw[->] (-1.7,0) -- (1.9,0) node[right] {$\Delta\phi$};
    \draw[->] (0,-1.4) -- (0,1.9) node[above] {$\overline{V}_{out}$};
    \draw[thick] (-1.5,-0.9) -- (0,-0.9) -- (0,0.9) -- (1.5,0.9);
    \node[right,font=\scriptsize] at (0.05,1.2) {$+V_1$};
    \node[left,font=\scriptsize] at (-0.05,-1.2) {$-V_1$};
    \node[font=\scriptsize] at (0,-1.75) {D flip-flop: bang-bang};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Detector | $K_{PD}$ | Linear range | Frequency detection | Notes (source) |
|---|---|---|---|---|
| Analog multiplier (mixer) | $K_M\frac{E_{in}E_{div}}{2}$ (V/rad) | around $90^\circ$, $\propto\sin\phi_d$ | no | gain depends on both amplitudes (Carusone Ex. 19.1); output at $2\omega$ must be filtered |
| XOR | $V_0/\pi$ (V/rad) | $0$ to $\pi$, locks at $\pi/2$ | no | frequency-independent gain; duty-cycle sensitive (Razavi Ex. 16.1, Palermo L11) |
| D flip-flop | $\infty$ at $0$, else $0$ | none (sign only) | no: averages to zero (Razavi Ex. 16.7) | "bang-bang"; the CDR workhorse |
| Three-state PFD + charge pump | $I_{CP}/2\pi$ (A/rad) | $\pm2\pi$ | **yes** | rising-edge only, so duty-cycle insensitive (Carusone Ex. 19.2) |

> [!note]- Derivation: XOR and multiplier gains
> **XOR (Razavi Ex. 16.1).** Output swing $V_0$. A phase difference $\Delta\phi$ makes each of the two pulses per period wider by $\Delta\phi$ in phase, so the average rises by $2V_0\Delta\phi/(2\pi)$: $K_{PD}=V_0/\pi$. It peaks at $\Delta\phi=\pi$ and falls back, so the characteristic is a periodic triangle with both signs of slope. A loop with large $K_{PD}K_{VCO}$ locks near $90^\circ$ (Razavi Problem 16.4).
>
> **Multiplier (Carusone Eqs. 19.15–19.20).** $V_{in}=E_{in}\sin\omega t$, $V_{div}=E_{div}\cos(\omega t-\phi_d)$ (the $90^\circ$ offset makes $\phi_d=0$ give zero average). $\sin A\cos B=\frac12[\sin(A+B)+\sin(A-B)]$ gives $\frac{K_ME_{in}E_{div}}2[\sin\phi_d+\sin(2\omega t-\phi_d)]$. Filtering the $2\omega$ term and linearizing $\sin\phi_d\approx\phi_d$: $K_{PD}=K_ME_{in}E_{div}/2$. The Gilbert cell is an XOR with large inputs and a multiplier with small ones (Razavi Problem 16.1).

> [!tip] Remark
> The mixer detector is the root of the linear (mixer-based) CDR phase detector, and the bang-bang flip-flop is the Alexander detector. Both are developed for data (not clocks) in [[Clocking and CDR]].

### The linear model

```tikz title="Linear (small-signal) model of a locked PLL with every noise injection point. After Carusone Figs. 19.8, 19.33 and Palermo L11 slide 30."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,thick,minimum height=0.9cm,minimum width=1.2cm,align=center},sum/.style={draw,circle,inner sep=0pt,minimum size=0.45cm}]
  \node[sum] (s1) at (0.6,0) {};
  \node[font=\scriptsize] at (0.6,0) {$\Sigma$};
  \node[blk] (kpd) at (2.3,0) {$\frac{I_{CP}}{2\pi}$};
  \node[sum] (s2) at (3.9,0) {$+$};
  \node[blk] (f) at (5.4,0) {$F(s)$};
  \node[sum] (s3) at (7.0,0) {$+$};
  \node[blk] (vco) at (8.6,0) {$\frac{K_{VCO}}{s}$};
  \node[sum] (s4) at (10.2,0) {$+$};
  \node[blk] (div) at (5.4,-1.9) {$\frac1N$};
  \draw[->] (-0.9,0) node[left] {$\phi_{in}$} -- (s1);
  \draw[->] (s1) -- node[above,font=\scriptsize] {$\phi_e$} (kpd);
  \draw[->] (kpd) -- (s2);
  \draw[->] (s2) -- (f);
  \draw[->] (f) -- node[above,font=\scriptsize] {$V_{ctrl}$} (s3);
  \draw[->] (s3) -- (vco);
  \draw[->] (vco) -- (s4);
  \draw[->] (s4) -- (11.8,0) node[right] {$\phi_{out}$};
  \draw[->] (11.2,0) node[circ] {} |- (div.east);
  \draw[->] (div.west) -| node[pos=0.8,left,font=\scriptsize] {$-$} (s1.south);
  \draw[->] (3.9,1.2) node[above,font=\scriptsize] {$i_{n,CP}$} -- (s2);
  \draw[->] (7.0,1.2) node[above,font=\scriptsize] {$v_{n}$ (filter $R$)} -- (s3);
  \draw[->] (10.2,1.2) node[above,font=\scriptsize] {$\phi_{n,VCO}$} -- (s4);
  \draw[->] (-0.5,1.2) node[above,font=\scriptsize] {$\phi_{n,div}$} -- (s1);
\end{circuitikz}
\end{document}
```

$$
\boxed{LG(s)=\frac{I_{CP}}{2\pi}\,F(s)\,\frac{K_{VCO}}{Ns}}\qquad
\boxed{H(s)=\frac{\Phi_{out}}{\Phi_{in}}=\frac{N\,LG(s)}{1+LG(s)}}\qquad
\boxed{\frac{\Phi_{e}}{\Phi_{in}}=\frac{1}{1+LG(s)}}
$$

- **The divider divides phase by $N$**, not just frequency: a time shift $\Delta t$ is $2\pi\Delta t/T_0$ rad at the VCO but $2\pi\Delta t/(NT_0)$ rad after the divider (Carusone Eqs. 19.8–19.10).
- Valid only **in lock**, for slow and small phase changes (Carusone §19.2). Acquisition, cycle slipping and the discrete-time behavior need a time-domain model (Simulink, CppSim, Verilog-A; Palermo L11 slides 51–55).
- $H(0)=N$: slow input phase moves are copied (times $N$); the error goes to zero.

> [!tip] Remark
> This is the loop of [[Feedback#Closed-loop gain and loop gain]] with phase as the signal: $1/N$ is the feedback factor, and the closed-loop gain at dc is $1/\beta=N$ because the loop gain is infinite there.

## Level 1: The Type I PLL

PD, a first-order low-pass $1/(1+s/\omega_{LPF})$, and the VCO. One pole at the origin (the VCO), so **type I**.

$$
\boxed{H(s)=\frac{\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2},\qquad \omega_n=\sqrt{\omega_{LPF}K_{PD}K_{VCO}},\qquad \zeta=\frac12\sqrt{\frac{\omega_{LPF}}{K_{PD}K_{VCO}}}}
$$

$$
\boxed{\phi_0=\frac{\omega_{in}-\omega_0}{K_{PD}K_{VCO}}}\qquad\boxed{\zeta\omega_n=\frac{\omega_{LPF}}2}\qquad\boxed{\text{acquisition range}\approx\omega_{LPF}}
$$

- **Static phase error.** The VCO needs $V_{ctrl}=(\omega_{in}-\omega_0)/K_{VCO}$, and only a phase error can produce it. It grows with the input frequency and runs out when the PD reaches the end of its range: that is the type I lock (tracking) range (Razavi Ex. 16.3).
- **$K_{PD}K_{VCO}$ is the "loop gain"** (in rad/s, not dimensionless). Raising it shrinks $\phi_0$ but lowers $\zeta$.
- **Settling** goes as $e^{-\zeta\omega_nt}$, and $\zeta\omega_n=\omega_{LPF}/2$ does not depend on the gain.

| Want | Do | Costs |
|---|---|---|
| Less ripple on $V_{ctrl}$ (cleaner output) | ↓ $\omega_{LPF}$ | lower $\zeta$, slower settling, smaller acquisition range |
| Less phase error | ↑ $K_{PD}K_{VCO}$ | lower $\zeta$ (crossover moves up, phase margin falls) |
| Faster settling | ↑ $\omega_{LPF}$ | more ripple |
| Wide capture | ↑ $\omega_{LPF}$ | more ripple |

All four specs (settling, ripple, phase error, stability) fight through two knobs, and the acquisition range is only about $\omega_{LPF}$ while the VCO may drift far more over PVT (Razavi §16.2.1). That is why integrated PLLs are type II.

> [!note]- Derivation: type I closed loop, error, and settling (Razavi §16.1.3)
> Open loop: $H_{open}=K_{PD}\cdot\frac{1}{1+s/\omega_{LPF}}\cdot\frac{K_{VCO}}{s}$. Closed loop: $H=\frac{K_{PD}K_{VCO}}{s^2/\omega_{LPF}+s+K_{PD}K_{VCO}}$; multiply through by $\omega_{LPF}$ and match $s^2+2\zeta\omega_ns+\omega_n^2$ to get $\omega_n$, $\zeta$ above. Since $\omega=d\phi/dt$ is linear, the same $H$ relates $\omega_{out}$ to $\omega_{in}$ (Eq. 16.14).
>
> **Error.** $H_e=1-H=\frac{s^2+2\zeta\omega_ns}{s^2+2\zeta\omega_ns+\omega_n^2}$. A frequency step $\Delta\omega$ is $\Phi_{in}=\Delta\omega/s^2$; final value $\lim_{s\to0}sH_e\Phi_{in}=2\zeta\Delta\omega/\omega_n=\Delta\omega/(K_{PD}K_{VCO})$, which is $\phi_0$ again (Ex. 16.6).
>
> **Settling (Ex. 16.5).** Underdamped step: $\Delta\omega_{out}=[1-\frac{1}{\sqrt{1-\zeta^2}}e^{-\zeta\omega_nt}\sin(\omega_n\sqrt{1-\zeta^2}t+\theta)]\Delta\omega$. Worst case (Razavi takes the sinusoid as 1): $e^{-\zeta\omega_nt_s}=\delta\omega/\Delta\omega$. A 900 MHz phone synthesizer with $\omega_{LPF}=2\pi\cdot20$ kHz stepping 200 kHz, settling to 100 Hz: $t_s=\ln(2000)/(\zeta\omega_n)=7.6/(\zeta\omega_n)=15.2/\omega_{LPF}=0.12$ ms.
>
> **Root locus (Fig. 16.20).** At $K_{PD}K_{VCO}=0$ the poles are at $0$ and $-\omega_{LPF}$; they meet at $-\omega_{LPF}/2$ when $K_{PD}K_{VCO}=\omega_{LPF}/4$ ($\zeta=1$), then move vertically with real part $-\omega_{LPF}/2$. $\cos\psi=\zeta$. On the Bode plot (Fig. 16.19) the loop gain falls at $-20$ dB/dec then $-40$ dB/dec past $\omega_{LPF}$; raising the gain pushes crossover into the $-180^\circ$ region.

> [!tip] Remark
> Type I behaves exactly like the two-pole amplifier of [[Stability#Two poles]]: more loop gain, less phase margin. The type II loop below behaves the opposite way.

## Level 2: The Charge-Pump Type II PLL

### The phase/frequency detector

```tikz title="Three-state PFD: two resettable D flip-flops with D tied high, reset by AND of both outputs through a delay. A leading B gives UP pulses as wide as the lead, plus a short coincident reset pulse T_rst on both. After Razavi Figs. 16.24(a), 16.39 and Palermo L11 slide 73."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick] (0,1.0) rectangle (1.6,2.6);
  \draw[thick] (0,-1.6) rectangle (1.6,0);
  \node[font=\scriptsize] at (0.3,2.3) {D};
  \node[font=\scriptsize] at (1.3,2.3) {Q};
  \node[font=\scriptsize] at (0.35,1.3) {CK};
  \node[font=\scriptsize] at (0.8,1.15) {R};
  \node[font=\scriptsize] at (0.3,-0.3) {D};
  \node[font=\scriptsize] at (1.3,-0.3) {Q};
  \node[font=\scriptsize] at (0.35,-1.3) {CK};
  \node[font=\scriptsize] at (0.8,-0.15) {R};
  \draw (-0.5,2.3) node[left,font=\scriptsize] {$1$} -- (0,2.3);
  \draw (-0.5,-0.3) node[left,font=\scriptsize] {$1$} -- (0,-0.3);
  \draw[->] (-1.0,1.3) node[left] {$A=f_{ref}$} -- (0,1.3);
  \draw[->] (-1.0,-1.3) node[left] {$B=f_{fb}$} -- (0,-1.3);
  \draw (1.6,2.3) -- (3.6,2.3) node[right] {UP};
  \draw (1.6,-0.3) -- (3.6,-0.3) node[right] {DN};
  \draw[thick] (2.4,0.55) -- (2.75,0.55) arc (-90:90:0.25) -- (2.4,1.05) -- cycle;
  \draw (2.2,2.3) node[circ] {} |- (2.4,0.95);
  \draw (2.2,-0.3) node[circ] {} |- (2.4,0.65);
  \draw (3.0,0.8) -- (3.3,0.8);
  \draw[fill=gray!15] (3.3,0.6) rectangle (3.9,1.0);
  \node[font=\scriptsize] at (3.6,0.8) {$\tau$};
  \draw (3.9,0.8) -- (4.1,0.8) -- (4.1,0.4) -| (0.8,0.95) ;
  \draw (0.8,0.4) -- (0.8,0.0);
  \begin{scope}[xshift=6.3cm,yshift=-1.4cm]
    \foreach \y/\n in {3.4/A,2.5/B,1.6/UP,0.7/DN} { \node[left,font=\scriptsize] at (0,\y+0.2) {\n}; }
    \draw (0,3.4) -- (0.6,3.4) -- (0.6,3.85) -- (2.0,3.85) -- (2.0,3.4) -- (3.6,3.4) -- (3.6,3.85) -- (5.0,3.85) -- (5.0,3.4) -- (5.6,3.4);
    \draw (0,2.5) -- (1.2,2.5) -- (1.2,2.95) -- (2.6,2.95) -- (2.6,2.5) -- (4.2,2.5) -- (4.2,2.95) -- (5.6,2.95);
    \draw (0,1.6) -- (0.6,1.6) -- (0.6,2.05) -- (1.4,2.05) -- (1.4,1.6) -- (3.6,1.6) -- (3.6,2.05) -- (4.4,2.05) -- (4.4,1.6) -- (5.6,1.6);
    \draw (0,0.7) -- (1.2,0.7) -- (1.2,1.15) -- (1.4,1.15) -- (1.4,0.7) -- (4.2,0.7) -- (4.2,1.15) -- (4.4,1.15) -- (4.4,0.7) -- (5.6,0.7);
    \draw[dotted] (0.6,3.4) -- (0.6,0.4);
    \draw[dotted] (1.2,2.5) -- (1.2,0.4);
    \draw[<->] (0.6,0.35) -- (1.2,0.35) node[midway,below,font=\scriptsize] {$\Delta\phi\frac{T_{ref}}{2\pi}$};
    \draw[<->] (4.2,0.45) -- (4.4,0.45);
    \node[below,font=\scriptsize] at (4.6,0.45) {$T_{rst}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Three states:** UP, DN, or neither. The earlier rising edge sets its output; the later one sets the other, and both reset after the AND gate and delay. Only rising edges matter.
- **Phase:** equal frequencies, $A$ leading → UP pulses proportional to $\phi_A-\phi_B$. **Frequency:** $A$ faster → UP pulses only, so the average says which way to go (Razavi Fig. 16.22). That is why a PFD's **acquisition range is the VCO tuning range**.
- The reset pulse is about **five gate delays** wide in the plain gate-level PFD (Razavi Ex. 16.8). Deliberately widening it with $\tau$ removes the [[#Dead zone and the reset pulse|dead zone]].

### The charge pump: an integrator in phase

$$
\boxed{\frac{\overline{I}_{CP}}{\Delta\phi}=\frac{I_{CP}}{2\pi}}\qquad
\boxed{\frac{V_{ctrl}}{\Delta\phi}(s)=\frac{I_{CP}}{2\pi}\cdot\frac{1}{C_1s}\quad(\text{capacitor only})}
$$

A constant phase error makes the pump inject charge every cycle, so $V_{ctrl}$ ramps without bound: **infinite dc gain**. In lock $V_{ctrl}$ is finite, so the input phase error must be **exactly zero** (up to mismatch, [[#Current mismatch becomes static phase offset]]).

> [!note]- Derivation: the ramp approximation (Razavi §16.2.4, Eqs. 16.37–16.40)
> The PFD/CP/C cascade is not strictly linear: doubling $\Delta\phi$ doubles the flat parts of $V_{out}$ but not the ramps, whose slope is $I_{CP}/C$ (like slewing). Approximate the staircase by a ramp. A phase step $\phi_0u(t)$ gives pulses $\phi_0T_{in}/(2\pi)$ wide every $T_{in}$, raising $V_{out}$ by $(I_{CP}/C)\phi_0T_{in}/2\pi$ per period: slope $\frac{I_{CP}}{2\pi C}\phi_0$. The step response is $\frac{I_{CP}}{2\pi C}t\,\phi_0u(t)$, the impulse response $\frac{I_{CP}}{2\pi C}u(t)$, the transfer function $\frac{I_{CP}}{2\pi C}\frac1s$. Taking the current as output instead, $I/\Delta\phi=I_{CP}/2\pi$: the pump is a transconductance from phase, and whatever impedance it drives becomes $F(s)$. Carusone gets the same $K_{pd}=I_{ch}/2\pi$ by averaging the current over one reference period (Eq. 19.22).

### Two integrators need a zero

```tikz title="Type II loop gain with the full filter (R, C1, C2). Two poles at the origin (-40 dB/dec, -180 deg), the zero at 1/RC1 lifts the phase, the third pole from C2 pulls it back. Peak phase margin sits at the geometric mean of omega_z and omega_p3. Drawn exactly for C1/C2 = 12.9 (60 deg). After Carusone Fig. 19.10 and Palermo L11 slide 58."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,declare function={lg(\y)=20*log10(max(\y,1))+10*log10(1+min(\y,1/\y)^2);}]
  \draw[->] (-0.2,0) -- (6.6,0) node[right] {$\log\omega$};
  \draw[->] (0,-1.9) -- (0,2.0) node[above] {$|LG|$ (dB)};
  \node[left,font=\scriptsize] at (0,0) {0};
  \draw[thick,domain=-2:2,samples=81] plot ({1.5*\x+3},{0.025*(lg(3.73*exp(2.302585*\x))-40*\x-lg(exp(2.302585*\x)/3.73)-11.43)});
  \foreach \x/\n in {-0.572/{\omega_z},0/{\omega_u},0.572/{\omega_{p3}}} { \draw[dotted] ({1.5*\x+3},2.0) -- ({1.5*\x+3},-5.6); \node[font=\scriptsize,fill=white,inner sep=1pt] at ({1.5*\x+3},-2.15) {$\n$}; }
  \node[font=\scriptsize] at (1.6,1.75) {$-40$ dB/dec};
  \node[font=\scriptsize,anchor=west] at (3.15,0.35) {$-20$};
  \node[font=\scriptsize] at (5.6,-1.3) {$-40$};
  \begin{scope}[yshift=-4.4cm]
    \draw[->] (-0.2,0) -- (6.6,0) node[right] {$\log\omega$};
    \draw[->] (0,-1.2) -- (0,1.6) node[above] {$\angle LG$};
    \draw[dashed] (0,-1.0) node[left,font=\scriptsize] {$-180^\circ$} -- (6.2,-1.0);
    \draw[dashed] (0,0) node[left,font=\scriptsize] {$-120^\circ$} -- (6.2,0);
    \draw[thick,domain=-2:2,samples=81] plot ({1.5*\x+3},{(-180+atan(3.73*exp(2.302585*\x))-atan(exp(2.302585*\x)/3.73))/60+2});
    \draw[<->] (3,-1.0) -- (3,0) node[midway,left,font=\scriptsize] {$\Phi_m=60^\circ$};
  \end{scope}
\end{circuitikz}
\end{document}
```

With $F(s)=1/(C_1s)$ the loop gain is $\frac{I_{CP}K_{VCO}}{2\pi NC_1s^2}$: two ideal integrators, $-180^\circ$ everywhere, closed-loop poles on the $j\omega$ axis. **Unstable** (Razavi Eq. 16.42). A resistor in series with $C_1$ adds a zero:

$$
\boxed{F(s)=R+\frac{1}{C_1s}=\frac{1+sRC_1}{C_1s},\qquad \omega_z=\frac{1}{RC_1}}
$$

$$
\boxed{H(s)=N\,\frac{2\zeta\omega_ns+\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2},\qquad \omega_n=\sqrt{\frac{I_{CP}K_{VCO}}{2\pi NC_1}},\qquad \zeta=\frac{R}{2}\sqrt{\frac{I_{CP}C_1K_{VCO}}{2\pi N}}=\frac{\omega_nRC_1}{2}}
$$

- **$R$ is the only source of damping**: $R=0$ gives $\zeta=0$. In a PI-controller reading, $R$ is the proportional path and $C_1$ the integral path (Carusone Eq. 19.24): $C_1$ remembers the frequency, $R$ corrects the phase.
- **More loop gain is more stable**: $\zeta\propto\sqrt{I_{CP}K_{VCO}}$. Lower $I_{CP}K_{VCO}$ pushes crossover below $\omega_z$, into the $-180^\circ$ region (Razavi Fig. 16.36). The root locus is a circle of radius $1/RC_1$ centered at $-1/RC_1$; the poles reach the real axis at $-2/RC_1$ when $\zeta=1$ (Razavi Fig. 16.37).
- **The zero is also in the closed-loop numerator**, so a type II loop overshoots and peaks even at $\zeta\ge1$ (Carusone footnote 5, p. 750).
- **The divider divides $K_{VCO}$ by $N$**: as far as the poles are concerned, VCO plus $\div N$ is a VCO with gain $K_{VCO}/N$. A larger $N$ needs a proportionally larger $I_{CP}$ to keep $\omega_n$, $\zeta$ (Razavi Eqs. 16.51–16.54).

> [!tip] Remark
> The stability argument is [[Stability#Level 2 Phase Margin]] with two integrators: the zero is lead compensation, the same move as the nulling resistor in [[Stability#The nulling resistor (lead compensation)]]. Razavi Ex. 16.11's "the phase is $-180^\circ$ where the gain exceeds 1, so it oscillates" is a misreading of the asymptotic plot; Nyquist says two integrators plus a zero do not oscillate.

> [!note]- Detail: the same loop in Carusone's notation
> Carusone writes $L(s)=\frac{\omega_{pll}^2}{s^2}\left(1+\frac{s}{\omega_z}\right)$ with $\omega_{pll}^2=\frac{K_{pd}K_{lp}K_{osc}}{N}$, $K_{pd}=I_{ch}/2\pi$, $K_{lp}=1/C_1$, $\omega_z=1/RC_1$ (Eqs. 19.27–19.33), and a closed-loop $Q=\omega_z/\omega_{pll}$ (Eq. 19.36). Dictionary: $\omega_{pll}=\omega_n$, $Q=1/(2\zeta)$, $I_{ch}=I_{CP}$, $K_{osc}=K_{VCO}$. Razavi's $I_P$, $C_P$, $R_P$, $M$ are $I_{CP}$, $C_1$, $R$, $N$ here. Check: $\zeta=\frac1{2Q}=\frac{\omega_{pll}}{2\omega_z}=\frac{\omega_nRC_1}{2}$, the same as Razavi Eq. 16.54.

### Bandwidth, phase margin and peaking

Computed here from the exact second-order $H(s)$ and $LG(s)=\frac{\omega_n^2}{s^2}(1+\frac{2\zeta s}{\omega_n})$ (matches Carusone's 76° and $2.5\omega_{pll}$ at $Q=0.5$, and $<0.1$ dB at $Q=0.1$):

| $\zeta$ | $Q$ | Peaking of $\lvert H\rvert/N$ | $\omega_{3dB}/\omega_n$ | Crossover $\omega_u/\omega_n$ | Phase margin |
|---|---|---|---|---|---|
| 0.5 | 1 | 3.3 dB | 1.8 | 1.27 | 52° |
| 0.707 | 0.71 | 2.1 dB | 2.1 | 1.55 | 66° |
| 1 | 0.5 | 1.25 dB | 2.5 | 2.06 | 76° |
| 2 | 0.25 | 0.40 dB | 4.2 | 4.0 | 86° |
| 5 | 0.1 | 0.08 dB | 10 | 10 | 89° |

$$
\boxed{\zeta=1:\ \omega_{3dB}\approx2.5\,\omega_n}\qquad
\boxed{\zeta\gg1:\ \omega_{3dB}\approx2\zeta\omega_n=\frac{\omega_n^2}{\omega_z}=\frac{R\,I_{CP}K_{VCO}}{2\pi N},\quad \tau\approx\frac{1}{2\zeta\omega_n}}
$$

- **$\zeta=1$ ($Q=0.5$)** is the popular compromise: coincident poles at $-\omega_n$, reasonable components (Carusone Key Point p. 750). Razavi: choose $\zeta>\sqrt2/2$ or 1 for PVT margin; $\zeta=5$ to 10 where peaking matters (footnote 4, p. 663).
- **Large $\zeta$ is a first-order loop** set by the proportional path alone: crossover at $R\,I_{CP}K_{VCO}/(2\pi N)$, the slow pole near $\omega_z$ cancelled by the zero. It tracks best, but $\omega_z$ is about 20× lower than at $\zeta=1$ for the same bandwidth, often forcing off-chip capacitors (Carusone p. 751).

> [!tip] Remark
> Compare [[Stability#Definition and peaking]]: for an all-pole loop, 76° of phase margin means $\zeta=1$ and **no** peaking. Here 76° still peaks 1.25 dB, because the closed-loop zero $2\zeta\omega_ns$ adds gain near $\omega_n$. Phase margin alone does not predict PLL peaking.

> [!note]- Derivation: phase margin of the second-order type II loop (Carusone Ex. 19.4)
> $\angle L=-180^\circ+\tan^{-1}(\omega/\omega_z)$, so $\Phi_m=\tan^{-1}(\omega_u/\omega_z)$. Solving $|L(j\omega_u)|=1$: $\omega_u=\frac{\omega_{pll}}{\sqrt2}\sqrt{\frac1{Q^2}+\sqrt{\frac1{Q^4}+4}}$ and $\Phi_m=\tan^{-1}\!\left(\frac1{\sqrt2Q}\sqrt{\frac1{Q^2}+\sqrt{\frac1{Q^4}+4}}\right)$; 76° at $Q=0.5$. For $Q\ll1$: $\omega_u\approx\omega_{pll}/Q$, $\Phi_m\approx\tan^{-1}(1/Q^2)\to90^\circ$. In the first-order limit $H\approx N/(1+s\omega_z/\omega_{pll}^2)$, so $\omega_{3dB}=\omega_{pll}^2/\omega_z=\omega_{pll}/Q$ and $\tau=Q/\omega_{pll}$ (Eqs. 19.39–19.41). Extra poles ($C_2$, loop delay) take phase margin off these numbers.

### The third pole C2

Each pump pulse through $R$ steps $V_{ctrl}$ by $I_{CP}R$ (6.28 V in Carusone Ex. 19.5!), and mismatch, charge injection and feedthrough make steps even in lock. A small $C_2$ across the filter absorbs them (Razavi Fig. 16.38):

$$
\boxed{F(s)=\frac{1}{s(C_1+C_2)}\cdot\frac{1+sRC_1}{1+sR\frac{C_1C_2}{C_1+C_2}},\qquad \omega_{p3}=\frac{C_1+C_2}{RC_1C_2}}
$$

| Rule | Source |
|---|---|
| $C_2\approx C_1/10$ to $C_1/8$ for $\zeta=1$; $C_1/250$ for $\zeta=5$ (puts $\omega_{p3}\approx2\omega_{3dB}$) | Carusone p. 753 |
| $C_2$ = $C_1/5$ to $C_1/10$ leaves the responses nearly unchanged | Razavi p. 677 |
| $C_1/50<C_2<C_1/10$: too big unstable, too small ripple | Palermo L11 slide 88 |
| Maximum phase margin at $\omega_u=\sqrt{\omega_z\omega_{p3}}$ | Palermo L11 slide 58 (Hanumolu) |

The loop is now third order. Razavi adds that a very large $R$ eventually degrades stability again, which the continuous-time model cannot see (p. 677).

### The discrete-time limit

$$
\boxed{f_{BW}\lesssim\frac{f_{ref}}{10}\ \text{to}\ \frac{f_{ref}}{20}}
$$

The PFD samples the phase error once per reference period, so it is a discrete-time block. Phase cannot be tracked faster than it is sampled, and the loop filter needs several cycles to average (Carusone §19.2.2). Sampling delay acts as extra phase lag, which is what the continuous-time model misses.

> [!note]- Detail: the rule bends when the loop is designed for it (Mansuri and Yang 2002)
> Modelling the sampled loop as a delay, Mansuri's adaptive-bandwidth PLL finds minimum jitter at loop bandwidths of 26% of $f_{ref}$ (loop delay $T_{ref}/3$) falling to 12% (delay $T_{ref}/2$), Fig. 13(c). The usable bandwidth shrinks as the loop delay or the third pole move closer, because both eat phase margin (their Eq. 8). The 1/10 rule is a safe default, not a law.

### Design procedure

Carusone's recipe (§19.2.3), second-order view:

1. $N=f_{out}/f_{ref}$ (with an input $\div M$ if the step must be finer than $f_{ref}$).
2. $K_{VCO}$ from the VCO: just large enough to cover PVT and the output range over the control span.
3. Pick $\zeta$: 1 for realizable components, about 5 for minimal peaking and fastest tracking.
4. Pick the bandwidth: high if the reference is clean, but $\le f_{ref}/10$. Then $\omega_n=0.4\,\omega_{3dB}$ ($\zeta=1$) or $\omega_n=\omega_{3dB}/(2\zeta)$ ($\zeta\gg1$).
5. $I_{CP}/C_1=2\pi N\omega_n^2/K_{VCO}$; pick $I_{CP}$ (the free choice: area, pump power, filter noise).
6. $R=1/(\omega_zC_1)$ with $\omega_z=\omega_n/(2\zeta)$.
7. $C_2$ from the table above.

Palermo's (after Hanumolu 2004) instead targets crossover $\omega_u$ and phase margin $\Phi_m$ with the third pole included:

$$
\boxed{\frac{C_1}{C_2}=2\left(\tan^2\Phi_m+\tan\Phi_m\sqrt{\tan^2\Phi_m+1}\right),\quad \omega_z=\frac{\omega_u}{\sqrt{1+C_1/C_2}},\quad \omega_{p3}=\omega_u\sqrt{1+C_1/C_2}}
$$

$$
\boxed{C_1=\frac{1}{\omega_zR},\qquad I_{CP}=\frac{2\pi NC_2\,\omega_u^2}{K_{VCO}}\sqrt{\frac{\omega_{p3}^2+\omega_u^2}{\omega_z^2+\omega_u^2}}}
$$

$R$ is chosen first, for noise. ($K_{VCO}$ in rad/s/V; the slide writes the last formula without the $2\pi$, which is right if $K_{VCO}$ is in Hz/V: its own numbers give 310 µA only with the $2\pi$.)

> [!note]- Worked example: Carusone Ex. 19.5–19.8
> **Ex. 19.5** ($f_{ref}=10$ MHz, $f_{out}=200$ MHz so $N=20$, $K_{osc}=2\pi\cdot10^7$ rad/s/V, $I_{ch}=20$ µA, bandwidth $f_{ref}/20$, $Q=0.1$): $C_1=\frac{I_{ch}K_{osc}}{2\pi Q^2\omega_{3dB}^2N}\approx100$ pF, $R=\frac{1}{C_1\omega_{3dB}Q^2}=314$ kΩ, and $C_2=C_1/250\approx0.4$ pF (Ex. 19.6). Without $C_2$, 20 µA through 314 kΩ is a 6.28 V spike.
>
> **Ex. 19.7** (same, $Q=0.5$): $C_1=\frac{2.5^2I_{ch}K_{osc}}{2\pi\omega_{3dB}^2N}=6.25$ pF, $R=\frac{2.5}{C_1\omega_{3dB}Q}=255$ kΩ, $C_2=C_1/10=0.625$ pF (the book prints "fF"; pF is meant). Far more integrable than $Q=0.1$, at the cost of peaking.
>
> **Ex. 19.8** (40 MHz reference, 1.4–1.6 GHz in 20 MHz steps, $K_{osc}=2\pi\cdot10^8$ rad/s/V so 2 V covers the range): $M=2$, $N=70$ to 80. $Q=0.5$, bandwidth $\frac1{10}\cdot20$ MHz $=2$ MHz, $\omega_{pll}=0.4\omega_{3dB}=2\pi\cdot800$ kHz. $I_{ch}/C_1=\omega_{pll}^2\cdot2\pi N/K_{osc}\approx20\times10^6$ V/s (at $N=80$): $I_{ch}=100$ µA, $C_1=5$ pF. $\omega_z=Q\omega_{pll}=2\pi\cdot400$ kHz, so $R\approx80$ kΩ; $C_2=0.5$ pF. Check: $\zeta\omega_n=RI_{CP}K_{VCO}/(4\pi N)=5.0\times10^6$ s⁻¹ $=\omega_{pll}$ at $\zeta=1$.

> [!note]- Detail: what the linear model hides during acquisition
> While the PFD is still detecting frequency (one output only), the pump is effectively always pushing one way, and the loop order drops by one (Razavi Problem 16.16). With a large initial frequency difference a simulation shows cycle slipping and voltage spikes from the pump current through $R$ (Palermo L11 slide 53, $K_{VCO}=2\pi\cdot1$ GHz/V LC vs $2\pi\cdot10$ GHz/V ring). $K_{VCO}$ itself varies across a wide tuning range, so $\zeta$ and $\omega_n$ computed at mid-band can be far off at the edges.

## Level 3: Jitter Transfer and Noise

### Jitter transfer and peaking

```tikz title="Jitter transfer |H|/N of a type II loop (low-pass, with peaking that falls as zeta rises) and VCO-noise transfer |H_VCO| (high-pass), both against omega/omega_n. Computed from the exact second-order expressions. After Razavi Fig. 16.51 and Carusone Figs. 19.9(b), 19.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,declare function={q(\u)=exp(4.60517*\u); a(\u)=q(\u)/(1+q(\u)); b(\u)=1/(1+q(\u)); dp(\u,\z)=1+4*(\z*\z-1)*a(\u)*b(\u); hdb(\u,\z)=10*log10((b(\u)+4*\z*\z*a(\u))*b(\u))-10*log10(dp(\u,\z)); vdb(\u,\z)=20*log10(a(\u))-10*log10(dp(\u,\z));}]
  \draw[->] (0,0) -- (8.4,0) node[right] {$\omega/\omega_n$};
  \draw[->] (0,-4.2) -- (0,1.2) node[above] {dB};
  \foreach \y in {0,-10,-20} { \draw (0.08,{0.18*\y}) -- (-0.08,{0.18*\y}) node[left,font=\scriptsize] {\y}; }
  \foreach \u/\l in {-1/0.1,0/1,1/10} { \draw ({2.6*\u+4},0.08) -- ({2.6*\u+4},-0.08); \node[font=\scriptsize] at ({2.6*\u+4},-4.45) {\l}; \draw[dotted] ({2.6*\u+4},0) -- ({2.6*\u+4},-4.2); }
  \draw[thick,domain=-1.5:1.1,samples=90] plot ({2.6*\x+4},{0.18*hdb(\x,0.5)});
  \draw[thick,dashed,domain=-1.5:1.4,samples=90] plot ({2.6*\x+4},{0.18*hdb(\x,1)});
  \draw[thick,dotted,domain=-1.5:1.5,samples=90] plot ({2.6*\x+4},{0.18*hdb(\x,5)});
  \draw[thick,gray,domain=-0.55:1.5,samples=90] plot ({2.6*\x+4},{0.18*vdb(\x,1)});
  \node[font=\scriptsize,anchor=west] at (0.3,1.0) {$|H|/N$: solid $\zeta=0.5$, dashed $\zeta=1$, dotted $\zeta=5$};
  \node[font=\scriptsize,gray,anchor=west] at (5.3,0.45) {$|H_{VCO}|$, $\zeta=1$};
  \node[font=\scriptsize,anchor=west] at (6.3,-2.9) {low-pass};
  \node[font=\scriptsize,gray,anchor=west] at (0.3,-3.6) {high-pass};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\Phi_{out}}{\Phi_{in}}=N\frac{2\zeta\omega_ns+\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2}\ (\text{low-pass})}\qquad
\boxed{\frac{\Phi_{out}}{\Phi_{VCO}}=\frac{s^2}{s^2+2\zeta\omega_ns+\omega_n^2}\ (\text{high-pass})}
$$

- **Input jitter:** slow input jitter passes (times $N$), fast jitter is filtered. A PLL is a narrowband filter around the carrier: 1 GHz in, 10 MHz bandwidth, jitter faster than 10 MHz attenuated (Razavi §16.5.3).
- **VCO jitter:** slow drift (temperature, flicker) is measured against the clean reference and corrected; fast noise is beyond the loop's reach and passes (Razavi §16.3.2).
- **Jitter peaking** is any band where $|H|/N>1$: input (and in-band) noise is **amplified** there. It also shows as overshoot and ringing in the step response (Carusone Fig. 19.9).

> [!tip] Remark
> What "jitter transfer" means at the link level (measured on recovered clocks, standards masks, why a golden PLL is needed to define jitter) is owned by [[Link Noise and Jitter#Jitter Transfer and Its Mask]]; the CDR's own transfer and tolerance by [[Clocking and CDR]]. This note owns the loop that produces $H(s)$.

### Four noise sources, four shapes

| Source | Enters at | Transfer to $\phi_{out}$ | Shape | In band (low $f$) |
|---|---|---|---|---|
| Reference $\phi_{n,ref}$, divider $\phi_{n,div}$ | PFD input | $\dfrac{N\,LG}{1+LG}$ | low-pass | $\times N$ |
| Charge-pump current $i_{n,CP}$ | pump output | $\dfrac{2\pi N}{I_{CP}}\cdot\dfrac{LG}{1+LG}$ | low-pass | $\times2\pi N/I_{CP}$ |
| Filter / VCO-input voltage $v_n$ | $V_{ctrl}$ | $\dfrac{K_{VCO}/s}{1+LG}$ | band-pass | $\to0$ (pump has a pole at dc) |
| VCO phase $\phi_{n,VCO}$ (and output buffers) | VCO output | $\dfrac{1}{1+LG}$ | high-pass | $\to0$ |

$$
\boxed{S_{\phi,out}(f)=\sum_i S_i(f)\,\lvert NTF_i(f)\rvert^2,\qquad \sigma_\tau^2=\left(\frac{T_0}{2\pi}\right)^2\int S_{\phi,out}(f)\,df}
$$

(Carusone Eq. 19.100, Palermo L11 slides 30–32.) Each contribution is integrated separately, and their variances add.

> [!tip] Remark
> The integral from phase noise to rms jitter, and which limits to use (CDR bandwidth to Nyquist in a link), is owned by [[Link Noise and Jitter#Bridge Phase Noise to rms Jitter]]; jitter definitions (absolute, period, $P$-cycle) by [[Link Noise and Jitter#Level 2 Jitter Definitions]]. The VCO's own $S_\phi$ ($1/f^2$, $1/f^3$, Leeson) is in [[Oscillators#Level 5 Phase Noise]].

> [!note]- Derivation: the four transfer functions
> All four come from Mason's rule on the [[#The linear model|linear model]] with $LG=\frac{I_{CP}}{2\pi}F\frac{K_{VCO}}{Ns}$. **Reference**: forward path $\frac{I_{CP}}{2\pi}F\frac{K_{VCO}}s=N\,LG$, over $1+LG$. **Pump current**: $i_n$ adds to $\frac{I_{CP}}{2\pi}\phi_e$, so it equals a phase error $2\pi i_n/I_{CP}$: multiply the reference NTF by $2\pi/I_{CP}$. **$V_{ctrl}$ noise**: forward path $K_{VCO}/s$ only. **VCO**: forward path 1. At low $f$, $LG\to\infty$: the first two tend to $N$ and $2\pi N/I_{CP}$, the last two to 0. At high $f$, $LG\to0$: the first two vanish, $K_{VCO}/s\to0$ slowly, and the VCO term tends to 1. For the second-order loop the VCO NTF is $s^2/(s^2+2\zeta\omega_ns+\omega_n^2)$ (Razavi Eq. 16.48, Carusone Eq. 19.94).

### Choosing the loop bandwidth

```tikz title="Output phase noise of a PLL: below the loop bandwidth it follows the reference times N^2 (low-passed), above it the free-running VCO (high-passed). Setting f_BW near the crossing of N^2 S_ref and S_VCO minimizes the integrated jitter; a narrower loop lets VCO noise through, a wider one lets reference noise through. After Carusone Fig. 19.36 and Palermo L11 slide 42."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.4,0) node[right] {$\log f$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$S_\phi$ (dB)};
  \draw[dashed] (0.2,2.4) -- (8.0,1.9);
  \node[font=\scriptsize,anchor=south west] at (0.3,2.45) {$N^2S_{\phi,ref}$ (+20 log $N$)};
  \draw[dashed] (0.6,4.4) -- (7.6,0.35);
  \node[font=\scriptsize,anchor=west] at (1.25,4.25) {free-running VCO $S_{\phi,VCO}$ ($1/f^2$)};
  \draw[ultra thick,gray!60] (0.2,2.4) -- (4.2,2.144) .. controls (4.5,2.12) and (4.6,2.08) .. (4.9,1.912) -- (7.6,0.35);
  \draw[dotted] (4.54,0) -- (4.54,2.4);
  \node[below,font=\scriptsize] at (4.54,0) {$f_{BW}$ (optimum)};
  \node[font=\scriptsize,gray,anchor=west] at (6.0,1.0) {output $S_{\phi,out}$};
  \draw[<-] (2.2,3.35) -- (2.9,3.6) node[right,font=\scriptsize,align=left] {narrower loop: more\\ VCO noise passes};
  \node[font=\scriptsize,align=left,anchor=west] at (5.0,2.75) {wider loop: more\\ reference noise passes};
\end{circuitikz}
\end{document}
```

$$
\boxed{f_{BW,opt}\approx f\ \text{where}\ N^2S_{\phi,ref}(f)=S_{\phi,VCO}(f),\qquad f_{BW}\le f_{ref}/10}
$$

- Below $f_{BW}$ the output copies the reference (times $N^2$); above, the free-running VCO. Each region shows the larger of the two "wrong" choices if the bandwidth is misplaced, so the integral is smallest near the crossing (Carusone Key Point p. 779; the crossing rule is read off the two shapes here, not stated as a formula in the sources).
- **In practice it is simulated.** Peaking, the third pole, pump and filter noise move the optimum. Lee et al. put measured $S_{\phi,ref}$ and $S_{\phi,VCO}$ into simulation and chose $\zeta=1$, 2.7 MHz for a 28 GHz PLL, expecting about 370 fs rms (JSSC 2015, p. 2064).
- **What is downstream matters.** In a link, the RX CDR high-passes the clock's jitter again (modelled as a 4 MHz first-order response in IEEE 802.3/OIF): Palermo's 14 GHz PLL has 365 fs over 10 kHz–10 MHz but 157 fs once the CDR is included, and then the VCO's share rises from 50% to 63% (L11 slides 33, 42). A 2 MHz CDR (ADC-based RX) left 407 fs, a 12.7 MHz one 161 fs, from the same PLL (Turker ISSCC 2019, slide 24).
- **Loop-filter noise is usually minor** (Carusone Ex. 19.20: "insignificant, a typical result"); Palermo's budget has it at 12%.

### VCO-limited jitter

$$
\boxed{\sigma_\tau^2\approx\frac{h_2T_0^2}{4\zeta\omega_n}\quad\Rightarrow\quad\sigma_\tau\propto\frac{1}{\sqrt{\text{loop bandwidth}}}}
$$

(Carusone Eq. 19.96 with $Q=1/2\zeta$, for a VCO with $S_\phi=h_2/f^2$ in an ideal second-order loop.) Free-running, the VCO's jitter grows without bound ($\propto\sqrt{\Delta T}$); the loop stops the growth after about $1/(2\pi f_{BW})$ (Palermo L11 slide 48, McNeill).

> [!note]- Detail: Mansuri's version and what it says about $\zeta$
> Mansuri and Yang (JSSC 2002) write open-loop VCO jitter as $\sigma_{\Delta T}=\kappa\sqrt{\Delta T}$ ($\kappa$ a VCO figure of merit) and find, for the second-order loop, long-term jitter $\kappa\sqrt{1/(2\zeta\omega_n)}$; the tracking jitter against a clean reference is that over $\sqrt2$. With $\kappa^2=h_2T_0^2$ (Carusone Eq. 19.89) the tracking jitter squared is $h_2T_0^2/(4\zeta\omega_n)$, the same as Carusone. Their findings:
> - Long-term jitter falls as $1/\sqrt{f_{3dB}}$ (Fig. 4a). At fixed bandwidth it is roughly independent of $\zeta$ above 2; below 1 the peaking costs (Fig. 4b).
> - For short-term jitter, $\zeta\ge1$ avoids ringing (Fig. 3).
> - With the third pole and loop delay included, minimum jitter occurs at **30–45° phase margin**, not at the large margins and $\zeta>1$ of common practice, and the minimum is flat: ±20% bandwidth costs under 5% jitter (Sec. III, IV).
> - To make a PLL **filter** a noisy input by 10×, they need $\zeta>2$ and a bandwidth below 0.002% of the operating frequency (Sec. III).

### Loop-filter, charge-pump and divider noise

$$
\boxed{\overline{v_n^2}=4kTR\left(\frac{C_1}{C_1+C_2}\right)^2\frac{1}{1+(2\pi fRC_{eq})^2},\quad C_{eq}=\frac{C_1C_2}{C_1+C_2}}\qquad
\boxed{S_{i,CP}\approx\frac{T_{rst}}{T_{ref}}S_{white}+\left(\frac{T_{rst}}{T_{ref}}\right)^2S_{1/f}}
$$

- **Filter $R$** (Carusone Eq. 19.98): its $4kTR$ is divided onto $V_{ctrl}$ by the $C_1$/$C_2$ network and band-passed by the loop. Smaller $R$ means larger $C_1$ and $I_{CP}$ ([[#PLL specs → loop parameters]]).
- **Charge pump** (Lacaita 2007 via Palermo L11 slide 36): the sources' noise reaches the filter only during the reset overlap. With $T_{rst}=40$ ps and $T_{ref}=6.4$ ns, white noise is cut by 22 dB and flicker by 44 dB. A short $T_{rst}$ is good for noise (and offset), bounded below by the dead zone.
- **Divider**: an asynchronous (ripple) divider accumulates the clock-to-Q jitter of every stage and adds delay (phase margin); a synchronous divider re-times with the VCO clock, so its jitter is close to the VCO's, at the cost of power (Palermo L11 slides 109–110).

> [!tip] Remark
> The device sources are [[Noise#Resistor Thermal Noise]] and [[Noise#MOSFET Channel Thermal Noise]], [[Noise#Flicker (1/f) Noise]]. The $(T_{rst}/T_{ref})$ duty-cycle scaling is the only PLL-specific step.

## Level 4: Circuit Nonidealities

```tikz title="MOS charge pump driving the loop filter: M1, M2 current sources, M3, M4 switches. Skew between UP-bar and DN, mismatch between the sources, charge sharing at X and Y, and switch charge injection all disturb V_ctrl. After Razavi Fig. 16.44 and Palermo L11 slide 78."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,6.2) node[vdd] {$V_{DD}$} -- (0,5.9);
  \draw (0,5.2) node[pmos,emptycircle] (M2) {};
  \draw (0,3.8) node[pmos,emptycircle] (M4) {};
  \draw (0,1.8) node[nmos] (M3) {};
  \draw (0,0.4) node[nmos] (M1) {};
  \draw (M2.S) -- (0,5.9);
  \draw (M2.D) -- (M4.S);
  \draw (M3.D) -- (M4.D);
  \draw (M3.S) -- (M1.D);
  \draw (M1.S) node[ground] {};
  \node[left] at (M2.G) {$V_{b2}$};
  \node[left] at (M4.G) {$\overline{UP}$};
  \node[left] at (M3.G) {$DN$};
  \node[left] at (M1.G) {$V_{b1}$};
  \node[right,font=\scriptsize] at (M2.east) {M2};
  \node[right,font=\scriptsize] at (M4.east) {M4};
  \node[right,font=\scriptsize] at (M3.east) {M3};
  \node[right,font=\scriptsize] at (M1.east) {M1};
  \node[circ] at (0,4.53) {};
  \node[left,font=\scriptsize] at (-0.05,4.53) {$Y$};
  \node[circ] at (0,1.07) {};
  \node[left,font=\scriptsize] at (-0.05,1.07) {$X$};
  \draw (0,2.8) node[circ] {} -- (2.4,2.8) node[circ] {} -- (3.8,2.8) node[circ] {} -- (4.8,2.8) node[right] {$V_{ctrl}$};
  \draw (2.4,2.8) to[R, l=$R$] (2.4,1.6) to[C, l=$C_1$] (2.4,0.4) node[ground] {};
  \draw (3.8,2.8) to[C, l=$C_2$] (3.8,1.4) node[ground] {};
\end{circuitikz}
\end{document}
```

### Dead zone and the reset pulse

```tikz title="Dead zone. If the PFD makes no pulse at zero phase error, very small errors give pulses too narrow to switch the pump on: no current for |dphi| < phi0, so the loop gain is zero and the VCO wanders (jitter). Coincident reset pulses of width T_rst keep the pump switching, restoring a linear characteristic through zero. After Razavi Figs. 16.41, 16.43."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (-2.6,0) -- (2.8,0) node[right] {$\Delta\phi$};
    \draw[->] (0,-1.5) -- (0,1.7) node[above] {$\overline{I}_{CP}$};
    \draw[thick] (-2.3,-1.2) -- (-0.6,0) -- (0.6,0) -- (2.3,1.2);
    \draw (0.6,0.08) -- (0.6,-0.08) node[below,font=\scriptsize] {$\phi_0$};
    \draw (-0.6,0.08) -- (-0.6,-0.08) node[below,font=\scriptsize] {$-\phi_0$};
    \node[font=\scriptsize] at (0,-1.9) {no reset overlap: dead zone};
  \end{scope}
  \begin{scope}[xshift=6.6cm]
    \draw[->] (-2.6,0) -- (2.8,0) node[right] {$\Delta\phi$};
    \draw[->] (0,-1.5) -- (0,1.7) node[above] {$\overline{I}_{CP}$};
    \draw[thick] (-2.3,-1.2) -- (2.3,1.2);
    \node[font=\scriptsize] at (0,-1.9) {reset pulse $T_{rst}$ wide enough: linear};
  \end{scope}
\end{circuitikz}
\end{document}
```

Inside the dead zone the VCO accumulates up to $\phi_0$ of random phase with no correction (Razavi Fig. 16.42). The fix is the PFD's coincident pulses, made wide enough (delay $\tau$ in the reset path) to drive the switches to a full logic level. The price: both sources are on for $T_{rst}$ every cycle, so their **mismatch, noise and switching errors** now reach the filter every cycle. A long reset also blinds the PFD to edges, so it can push the wrong way near $2\pi$ (Palermo L11 slides 74–75):

$$
\boxed{t_{on,switch}<T_{rst}\le\frac{T_{ref}}{2}\qquad f_{PFD,max}=\frac{1}{2T_{rst}}}
$$

### UP/DN skew

$\overline{UP}$ passes through one more inverter than $DN$, so the two sources turn on at different times and the pump delivers $+I_{CP}$ then $-I_{CP}$ spikes every cycle even in lock (Razavi Fig. 16.44b). Fixes: a transmission gate in the DN path matching the inverter delay (Razavi Fig. 16.44c), or a 3-inverter UP path and 2-inverter DN path with higher fan-out, matching both delay and edge rate (Palermo L11 slide 79).

### Current mismatch becomes static phase offset

```tikz title="UP/DN current mismatch. With I_DN > I_UP, equal pulses would leave net negative charge each cycle, so the loop settles with UP starting T_os early: the extra UP charge I_UP T_os cancels Delta I T_rst. The phase error is static and V_ctrl still ripples every cycle. After Palermo L11 slide 80 and Razavi Fig. 16.45."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \y/\n in {3.2/UP,2.2/DN,1.0/$i_{CP}$,-0.4/$V_{ctrl}$} { \node[left,font=\scriptsize] at (0,\y+0.2) {\n}; }
  \draw (0,3.2) -- (1.0,3.2) -- (1.0,3.65) -- (3.4,3.65) -- (3.4,3.2) -- (6.0,3.2) -- (6.0,3.65) -- (8.4,3.65) -- (8.4,3.2) -- (9.2,3.2);
  \draw (0,2.2) -- (1.8,2.2) -- (1.8,2.65) -- (3.4,2.65) -- (3.4,2.2) -- (6.8,2.2) -- (6.8,2.65) -- (8.4,2.65) -- (8.4,2.2) -- (9.2,2.2);
  \draw[dashed,gray] (0,1.0) -- (9.2,1.0);
  \draw[fill=gray!35] (1.0,1.0) rectangle (1.8,1.6);
  \draw[fill=gray!10] (1.8,1.0) rectangle (3.4,0.7);
  \draw[fill=gray!35] (6.0,1.0) rectangle (6.8,1.6);
  \draw[fill=gray!10] (6.8,1.0) rectangle (8.4,0.7);
  \node[font=\scriptsize,anchor=west] at (3.5,1.45) {$+I_{UP}$ for $T_{os}$};
  \node[font=\scriptsize,anchor=west] at (3.5,0.65) {$-\Delta I$ for $T_{rst}$};
  \draw[thick] (0,-0.4) -- (1.0,-0.4) -- (1.8,0.05) -- (3.4,-0.4) -- (6.0,-0.4) -- (6.8,0.05) -- (8.4,-0.4) -- (9.2,-0.4);
  \draw[<->] (1.0,4.0) -- (1.8,4.0) node[midway,above,font=\scriptsize] {$T_{os}$};
  \draw[<->] (1.8,1.95) -- (3.4,1.95) node[midway,below,font=\scriptsize] {$T_{rst}$};
  \draw[<->] (1.0,-0.9) -- (6.0,-0.9) node[midway,below,font=\scriptsize] {$T_{ref}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{T_{os}=\frac{\Delta I\,T_{rst}}{I_{CP}-\Delta I/2}\approx\frac{\Delta I}{I_{CP}}T_{rst},\qquad \phi_{os}=2\pi\frac{T_{os}}{T_{ref}}\approx2\pi\frac{\Delta I}{I_{CP}}\frac{T_{rst}}{T_{ref}}}
$$

(Palermo L11 slide 80; it answers Razavi Problem 16.12.) With $I_{UP}=I_{CP}-\Delta I/2$ and $I_{DN}=I_{CP}+\Delta I/2$, zero net charge per cycle needs $I_{UP}T_{os}=\Delta I\,T_{rst}$.

- **The type II "zero phase error" is zero only for perfect matching.** The offset is proportional to $T_{rst}$: the overlap is when mismatch acts.
- **Ripple remains**: the charge cancels per cycle but not instant by instant, so $V_{ctrl}$ has a periodic disturbance at $f_{ref}$ → [[#Reference spurs]].
- **It moves with frequency.** Short-channel sources have low $r_o$, so $\Delta I$ depends on $V_{ctrl}$, i.e., on where the VCO is tuned (Razavi p. 679). That is the output-impedance spec in [[#Loop parameters → circuit and amplifier specs]].
- **Leakage does the same.** A leaky (thin-oxide MOS) loop-filter capacitor or a pump off-state leakage is a dc current the loop must cancel with a phase error; metal or thick-oxide caps avoid it at under 1/10 the density (Palermo L11 slides 82, 89). Fan (ISSCC 2019) cancels pump leakage with digitally controlled extra pulses steered by a TDC.

> [!tip] Remark
> Turned around, a **deliberate** mismatch is a phase knob: Wong et al. set their shared TX/RX PLL's sampling phase with a 7-bit charge-pump $I_{UP}/I_{DN}$ imbalance (6 ps LSB, 350 ps range), steered by a bang-bang detector ([[Clocking and CDR#Wong 2004 a CDR with no phase interpolator]], Wong 2004 Figs. 18–22). The CDR side is in [[Clocking and CDR]].

### Charge sharing and bootstrapping

```tikz title="Bootstrapped charge pump. While S1, S2 are off, S3, S4 tie the source drains X and Y to a unity-gain copy of V_ctrl, so when S1, S2 close no charge is shared between C_X, C_Y and the loop filter. After Razavi Figs. 16.46-16.47 (Johnson and Hudson 1988)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,5.4) node[vdd] {$V_{DD}$} to[I, l=$I_2$] (0,4.0) node[circ] {} coordinate (Y);
  \node[left] at (Y) {$Y$};
  \draw (Y) to[nos, l_=$S_2$] (0,2.6) node[circ] {} coordinate (V);
  \draw (V) to[nos, l_=$S_1$] (0,1.2) node[circ] {} coordinate (X);
  \node[left] at (X) {$X$};
  \draw (X) to[I, l=$I_1$] (0,-0.2) node[ground] {};
  \draw (V) -- (5.2,2.6) node[right] {$V_{ctrl}$};
  \draw (4.4,2.6) node[circ] {} to[C, l=$C_P$] (4.4,1.2) node[ground] {};
  \draw (Y) to[nos, l=$S_4$] (2.4,4.0) -- (2.4,3.4) coordinate (B);
  \draw (X) to[nos, l_=$S_3$] (2.4,1.2) -- (2.4,1.8);
  \draw (2.4,1.8) -- (2.4,3.4);
  \draw[thick] (3.6,3.75) -- (3.6,4.65) -- (2.9,4.2) -- cycle;
  \node[font=\scriptsize] at (3.4,4.2) {$+1$};
  \draw (3.6,4.2) -- (3.9,4.2) -- (3.9,2.6) node[circ] {};
  \draw (2.9,4.2) -- (2.6,4.2) -- (2.6,3.0) -- (2.4,3.0) node[circ] {};
\end{circuitikz}
\end{document}
```

With the switches off, M1 pulls $X$ to ground and M2 pulls $Y$ to $V_{DD}$. When the switches close, $X$ and $Y$ jump to $V_{ctrl}$, and since their swings differ (unless $V_{ctrl}=V_{DD}/2$) the difference in charge comes from the loop filter: a step in $V_{ctrl}$ every cycle (Razavi Fig. 16.46). The bootstrap amplifier pins $X$ and $Y$ to $V_{ctrl}$ between comparisons. Young (1992) keeps the sources always on through a parallel path with an amplifier holding their $V_{DS}$ constant; Ingino (2001) reverses the switches (toward the output) with MOS-cap feedthrough cancellation and a dummy branch (Palermo L11 slides 81, 83).

> [!tip] Remark
> Charge injection and clock feedthrough of the pump switches are the sampling-switch errors of [[Sampling Circuits]], dumped onto $C_1$, $C_2$ instead of a hold capacitor.

### Reference spurs

$$
\boxed{\text{spur at } f_{out}\pm f_{ref}:\quad \frac{P_{spur}}{P_{carrier}}\approx\left(\frac{K_{VCO}V_m}{2\,\omega_{ref}}\right)^2}
$$

$V_m$ is the $f_{ref}$ component of the periodic ripple on $V_{ctrl}$ left by mismatch, skew, charge sharing, injection and leakage. Every cycle repeats the same disturbance, so the VCO is frequency-modulated at $f_{ref}$. $C_2$ (and a higher-order filter) attenuate $V_m$; a lower $K_{VCO}$ helps directly.

> [!tip] Remark
> The sideband formula is the narrowband FM result of [[Oscillators#Level 4 The VCO as a Phase Integrator]] (Razavi Ex. 15.17) with $\omega_m=\omega_{ref}$. Spurs are discrete tones in $S_\phi$, i.e. periodic jitter (Carusone Key Point p. 762); in a link they are PJ in [[Link Noise and Jitter]].

### The divider

- Divide phase and frequency by $N$; the first stage runs at $f_{VCO,max}$ plus margin (Palermo L11 slide 106).
- **TSPC ÷2:** compact, no static power, but needs full-swing inputs and fails at low frequency from leakage on floating nodes. **CML ÷2:** accepts CML levels, faster (two gates per cycle, shunt peaking gives >50% more), but static power and a tail (slides 107–108). Circuit detail in [[High-Speed Circuit Techniques]].
- **Dual-modulus prescalers** (÷2/3, ÷15/16) make programmable $N$ (slide 111). **Injection-locked dividers** are faster and lower power but have a limited locking range (slide 112; [[Oscillators#Injection locking]]).
- Divider delay adds loop delay and costs phase margin (slide 110).

## Level 5: Delay-Locked Loops

```tikz title="Delay-locked loop: a voltage-controlled delay line (VCDL) is servoed until its total delay equals one input period, so the taps are evenly spaced phases. After Razavi Figs. 16.53(b), 16.54."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,dl/.style={draw,thick,minimum width=1.0cm,minimum height=0.8cm}]
  \foreach \i in {1,2,3,4} { \node[dl] (d\i) at ({1.7*\i},0) {$\tau_d$}; }
  \draw[->] (-0.6,0) node[left] {$CK_{in}$} -- (d1.west);
  \foreach \i/\j in {1/2,2/3,3/4} { \draw[->] (d\i.east) -- (d\j.west); \node[above,font=\scriptsize] at ({1.7*\i+0.85},0.0) {}; }
  \foreach \i in {1,2,3,4} { \draw[->] ({1.7*\i+0.5},0) -- ({1.7*\i+0.5},0.9) node[above,font=\scriptsize] {$CK_\i$}; }
  \draw[->] (d4.east) -- (8.6,0) -- (8.6,-1.8) -- (6.6,-1.8);
  \node[draw,thick,minimum width=2.6cm,minimum height=0.8cm] (pd) at (5.2,-1.8) {PD + CP + $C$};
  \draw[->] (0.2,0) node[circ] {} |- (pd.west);
  \draw (pd.south) -- (5.2,-2.7) -| (1.0,-0.8) -- (6.8,-0.8);
  \foreach \i in {1,2,3,4} { \draw[->] ({1.7*\i},-0.8) -- (d\i.south); }
  \node[font=\scriptsize,anchor=west] at (5.6,-2.55) {$V_{ctrl}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\Phi_{out}}{V_{ctrl}}=K_{VCDL}\ (\text{no }1/s)\qquad \text{lock: }4\tau_d=T_{in}}
$$

| | DLL | PLL |
|---|---|---|
| Actuator | delay line, $K_{VCDL}$ | VCO, $K_{VCO}/s$ |
| Loop order | that of the filter: first order with CP + $C$, easy to stabilize | filter order + 1 |
| Own jitter | corrupted edges leave the line; no accumulation | recirculated in the ring; accumulates |
| Input-jitter transfer | ≈ all-pass (slow: tracked; fast: passes straight through), with a dip or peak in between | low-pass |
| Frequency synthesis | **no** | yes ($\times N$) |
| Failure modes | false lock at $2T_{in}$ if the delay range spans $T_{in}$ to $2T_{in}$; stage and load mismatch skews the phases | — |

(Razavi §16.4, Ex. 16.12.) Use a DLL when the frequency is already right and only phases or skew are needed: multiphase clocks, de-skew, forwarded-clock receivers.

> [!tip] Remark
> A DLL passes a forwarded clock's high-frequency jitter while a PLL filters it; why that matters for a forwarded-clock link is in [[Link Noise and Jitter#Architecture Consequence What the RX Clock Can Track]]. Quadrature DLLs with quadrature error correction (Won 2024) are in [[Clocking and CDR]].

## Level 6: Applications

### Frequency multiplication and synthesis

$$
\boxed{f_{out}=\frac{N}{M}f_{ref},\qquad \text{step}=\frac{f_{ref}}{M}}\qquad
\boxed{S_{\phi,out}=N^2S_{\phi,ref}\ \text{in band}\ (+20\log_{10}N\ \text{dB})}
$$

- Exactly $N$ by phase locking, like a voltage amplifier with feedback divider $1/N$ but with no gain error (Razavi Fig. 16.55). Changing $N$ changes channel (Razavi Fig. 16.57, Carusone Fig. 19.11).
- Accuracy is the reference's, so $f_{ref}$ comes from a crystal (Razavi p. 687).
- **Every factor of 10 in $N$ costs 20 dB** of in-band phase noise: phase deviations are multiplied along with frequency ($H(0)=N$, Carusone p. 777). Here $N=90$: +39 dB over the 156 MHz reference.
- Integer-N's dilemma: a fine step needs a low $f_{ref}$, which forces a narrow loop. Production SerDes PLLs use fractional-N (e.g. Xilinx 16 nm transceiver, Palermo L11 slide 18), not covered by these sources.

### Skew cancellation

Put the clock buffer **inside** the loop: the PLL forces the buffered clock $CK_B$ into phase with $CK_{in}$, so the buffer's delay is divided by the infinite loop gain (Razavi Fig. 16.59). In voltage terms $V_{out}=\frac{AV_{in}+V_M}{1+A}\to V_{in}$ (Ex. 16.13). The VCO output itself is not aligned and is not used. Without multiplication a DLL does this better (less noise; Razavi p. 688), and the static phase offset of [[#Current mismatch becomes static phase offset]] is the residual skew.

### Jitter reduction and clock recovery

A jittery data stream is retimed by a flip-flop clocked from a clean clock; when no clock is sent, a **clock recovery circuit** extracts it with a narrow phase-locked loop (Razavi Fig. 16.61). Phase detectors for random data, CDR architectures and jitter tolerance belong to [[Clocking and CDR]].

### PLLs in a SerDes

| Design | PLL | Loop choices (source) |
|---|---|---|
| Palermo L11 example | 14 GHz LC, $f_{ref}=156.25$ MHz, $N=90$ | $f_u=2$ MHz, 60°, $I_{CP}=310$ µA, 365 fs rms |
| Lee et al. JSSC 2015, PAM4 TX | 28 GHz, 500 MHz ref, ÷56, SSB-mixer PFD, sub-harmonic injection locking | $\zeta=1$, 2.7 MHz from measured noise; about 500 fs rms |
| Wong et al. 2004 | shared TX/RX, ×4, 1.8 GHz, 4 phases | phase set by CP mismatch; SC loop filter notches the 450 MHz ripple ([[Clocking and CDR#Wong 2004 a CDR with no phase interpolator]]) |
| Xilinx 16 nm (Upadhyaya 2016) | two frac-N LC PLLs (8–16.4 GHz) + ring PLL (2–6.25 GHz) | LC for high rates, ring for low (Palermo L11 slide 18) |

Board reference clocks rarely scale (156 MHz is common), so the PLL bandwidth stays under about 10 MHz both for stability and to filter the reference, and the VCO's flicker-dominated close-in noise has to be suppressed by the loop (Palermo L11 slide 24).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ Loop bandwidth | VCO noise suppression, settling, tracking | passes more reference/pump/divider noise; limited to $\lesssim f_{ref}/10$; less spur filtering |
| ↑ $\zeta$ (↑ $R$ at fixed $\omega_n$) | Peaking, overshoot | lower $\omega_z$ → huge $C_1$ or off-chip parts; more $R$ noise |
| ↑ $I_{CP}$ (with $C_1\propto I_{CP}$, $R\propto1/I_{CP}$) | Pump noise referred to phase ($\propto1/I_{CP}$), $R$ noise | Area ($C_1$), pump power |
| ↑ $C_2/C_1$ | Ripple, spurs | phase margin (third pole moves in) |
| ↑ $K_{VCO}$ | Tuning range per volt | spurs and noise on $V_{ctrl}$ hit harder; $\zeta$, $\omega_n$ vary over the range |
| ↑ $N$ (lower $f_{ref}$) | Finer channel step | $+20\log N$ in-band noise, narrower loop, larger $I_{CP}$ needed |
| ↑ $T_{rst}$ | No dead zone | static offset and pump noise $\propto T_{rst}$; PFD max frequency $1/(2T_{rst})$ |
| ↓ CP $g_m/I_D$, cascode | Matching, $R_{out}$, noise | headroom → tuning range |
| PFD instead of XOR/mixer | Acquisition = whole tuning range, no static error (type II) | dead zone, reset-overlap errors |
| DLL instead of PLL | No jitter accumulation, first-order and easy to stabilize | no synthesis, false lock, passes input jitter |

## Cheat sheet

| Quantity | Equation |
|---|---|
| VCO in phase | $\Phi_{out}/V_{ctrl}=K_{VCO}/s$ |
| Lock | $\omega_{out}=\omega_{in}$ exactly; $\phi_{out}-\phi_{in}$ constant |
| Detector gains | XOR $V_0/\pi$; mixer $K_ME_{in}E_{div}/2$; PFD + CP $I_{CP}/2\pi$ |
| Loop gain | $LG=\frac{I_{CP}}{2\pi}F(s)\frac{K_{VCO}}{Ns}$; $H=N\,LG/(1+LG)$ |
| Type I | $\omega_n=\sqrt{\omega_{LPF}K_{PD}K_{VCO}}$, $\zeta=\frac12\sqrt{\omega_{LPF}/(K_{PD}K_{VCO})}$, $\zeta\omega_n=\omega_{LPF}/2$ |
| Type I phase error | $\phi_0=(\omega_{in}-\omega_0)/(K_{PD}K_{VCO})$ |
| Type II filter | $F=R+1/(C_1s)$, $\omega_z=1/RC_1$ |
| Type II $\omega_n$, $\zeta$ | $\omega_n=\sqrt{\frac{I_{CP}K_{VCO}}{2\pi NC_1}}$, $\zeta=\frac R2\sqrt{\frac{I_{CP}C_1K_{VCO}}{2\pi N}}=\frac{\omega_nRC_1}{2}$ |
| Type II closed loop | $H=N\frac{2\zeta\omega_ns+\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2}$ |
| VCO noise transfer | $\frac{s^2}{s^2+2\zeta\omega_ns+\omega_n^2}$ |
| Carusone notation | $\omega_{pll}=\omega_n$, $Q=\omega_z/\omega_{pll}=1/(2\zeta)$ |
| Bandwidth | $\zeta=1$: $2.5\omega_n$, 76°, 1.25 dB peak; $\zeta\gg1$: $2\zeta\omega_n=RI_{CP}K_{VCO}/(2\pi N)$ |
| Settling | $t_s\approx\ln(\Delta\omega/\delta\omega)/(\zeta\omega_n)$, $1/(\zeta\omega_n)=4\pi N/(RI_{CP}K_{VCO})$ |
| Components | $I_{CP}/C_1=2\pi N\omega_n^2/K_{VCO}$, $R=2\zeta/(\omega_nC_1)$ |
| Third pole | $\omega_{p3}=(C_1+C_2)/(RC_1C_2)$; $C_2\approx C_1/10$ ($\zeta=1$), $C_1/250$ ($\zeta=5$) |
| Max-PM design | $C_1/C_2=2(\tan^2\Phi_m+\tan\Phi_m\sqrt{\tan^2\Phi_m+1})$, $\omega_{z,p3}=\omega_u(1+C_1/C_2)^{\mp1/2}$ |
| Max-PM pump current | $I_{CP}=\frac{2\pi NC_2\omega_u^2}{K_{VCO}}\sqrt{\frac{\omega_{p3}^2+\omega_u^2}{\omega_z^2+\omega_u^2}}$ |
| Bandwidth limit | $f_{BW}\lesssim f_{ref}/10$ to $f_{ref}/20$ |
| Optimum bandwidth | near $N^2S_{\phi,ref}=S_{\phi,VCO}$ |
| VCO-limited jitter | $\sigma_\tau^2\approx h_2T_0^2/(4\zeta\omega_n)$ |
| Filter-$R$ noise | $4kTR\,(C_1/(C_1+C_2))^2/(1+(2\pi fRC_{eq})^2)$ |
| Pump noise | $S_{i,CP}\approx\frac{T_{rst}}{T_{ref}}S_{white}+\left(\frac{T_{rst}}{T_{ref}}\right)^2S_{1/f}$; in band $\times(2\pi N/I_{CP})^2$ |
| Static phase offset | $\phi_{os}\approx2\pi\frac{\Delta I}{I_{CP}}\frac{T_{rst}}{T_{ref}}$ |
| PFD reset window | $t_{on}<T_{rst}\le T_{ref}/2$ |
| Reference spur | $\left(K_{VCO}V_m/2\omega_{ref}\right)^2$ |
| Multiplication | $f_{out}=\frac NMf_{ref}$; in-band $S_\phi\times N^2$ |
| DLL | $\Phi_{out}/V_{ctrl}=K_{VCDL}$; lock at total delay $=T_{in}$ |
| CP sizing | $\sigma(\Delta I/I)^2\approx(g_m/I_D)^2\sigma_{V_{TH}}^2+\sigma_\beta^2$; $S_i=4kT\gamma(g_m/I_D)I_{CP}$; $V_{D,sat}\approx2/(g_m/I_D)$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 16, pp. 651–690: §16.1 simple PLL (PD, XOR Ex. 16.1, locking, type I dynamics, Ex. 16.5 settling, root locus); §16.2 lock acquisition, PFD (Ex. 16.7–16.8), charge pump, CPPLL dynamics, stability, $C_2$; §16.3.1 PFD/CP nonidealities (dead zone, skew, mismatch, charge sharing, bootstrapping); §16.3.2 jitter in PLLs; §16.4 DLLs; §16.5 frequency multiplication and synthesis, skew reduction, jitter reduction and clock recovery; Problems 16.1, 16.4, 16.12, 16.16.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24), Ch. 19, pp. 738–781: §19.1 architecture, divider, phase detectors (Ex. 19.1–19.2), loop filter (Ex. 19.3); §19.2 linear model, second-order model, jitter peaking, phase margin (Ex. 19.4), discrete-time limit, Ex. 19.5–19.8 and design procedure; §19.3 jitter and phase noise (definitions linked out, spurs Key Point p. 762); §19.5 noise in PLLs (Eqs. 19.92–19.100, Ex. 19.19–19.20). §19.4 oscillators only via [[Oscillators]].
- **Palermo, ECEN 720 Lecture 11 "Clocking Architectures & PLLs"** (`ref/SerDes/lecture11_ee720_clocking_arch_plls.pdf`): slides 18 (Xilinx transceiver), 24 (design challenges, Turker), 25–32 (CP-PLL model, noise transfer functions), 33–43 (14 GHz noise budget, Lacaita pump noise), 48 (McNeill), 57–61 (Hanumolu max-PM design), 63–83 (detectors, PFD dead zone and reset, CP gain, skew, mismatch, Young, Fan, Ingino), 85–89 (loop filter, $C_2$, capacitors), 105–112 (dividers).
- **Mansuri and Yang, "Jitter Optimization Based on Phase-Locked Loop Design Parameters," JSSC 37(11), 2002** (`ref/SerDes/jitter_optimization_pll_mansuri_jssc_2002.pdf`): Sec. II–IV, Eqs. 1–8, Figs. 3–8, 13.
- **Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," JSSC 50(9), 2015** (`ref/SerDes/56G_NRZPAM4_J.pdf`): Sec. III-A, pp. 2063–2064 (28 GHz PLL, loop-bandwidth choice).
- **Wong et al. 2004** via [[SerDes Learning Path]] (charge-pump mismatch as phase control).
- **Zettelkasten extensions** (`AnalogTheory/Phase-Locked Loops/`, `S14 Phase-Locked Loops`): 14i1 (closed-loop zero causes overshoot at any $\zeta$; $K_{VCO}$ variation moves $\zeta$ across the tuning range), 14j1–14j2 and the S14 links (pump switch errors as sampling-switch errors; spurs as a layout result). All other atomic notes restate Razavi Ch. 16 and were used only as a reading order.
