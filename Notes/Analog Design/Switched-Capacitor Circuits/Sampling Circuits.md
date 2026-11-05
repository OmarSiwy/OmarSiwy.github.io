---
title: Sampling Circuits
description: The track-and-hold front end of every ADC, from the ideal sampler through the MOS switch's errors (on-resistance, charge injection, kT/C, jitter) to the bootstrapped sampler and a full 10-bit, 5 GS/s design.
kind: topic
status: growing
aliases:
  - Sampling Circuits
  - Sample-and-Hold
  - Track-and-Hold
---

A sampler is one switch and one capacitor. This note starts with the ideal sampler as a black box, then adds the RC time constant, then the MOS switch and the ways it corrupts the sample, then the circuit fixes (differential, bottom-plate, bootstrapping), and ends with clock jitter, measurement, and a complete design. Each section stands on its own: stop after any of them and your picture is still correct, just less detailed. The switched-capacitor *amplifiers* and *integrators* built on top of this front end are in [[Switched-Capacitor Circuits]].

## The big picture

```tikz title="A track-and-hold: while CK is high the switch is on and V_out follows V_in; when CK falls the switch opens and C_1 holds the last value. After Razavi (Data Converters) Figs. 3.4, 3.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (1.6,0) node[nmos,rotate=-90](M){};
  \draw (M.S) -- ++(-1.0,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (M.G) -- ++(0,0.35) node[above]{$CK$};
  \draw (M.D) -- ++(0.6,0) coordinate (O) node[circ]{} -- ++(0.7,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C, l_=$C_1$] ++(0,-1.5) node[ground]{};
  \node[font=\scriptsize] at (0.95,0.55) {$M_1$};
  \begin{scope}[xshift=5.4cm,yshift=-0.6cm]
    \draw[->] (0,0) -- (7.0,0) node[right]{$t$};
    \draw[->] (0,0) -- (0,2.7);
    \draw[gray,thick,domain=0:6.6,samples=80] plot (\x,{1.3+0.9*sin(60*\x)});
    \node[gray,font=\scriptsize] at (0.35,2.45) {$V_{in}$};
    \foreach \a/\b in {0/0.8,1.6/2.4,3.2/4.0,4.8/5.6} {
      \draw[very thick,domain=\a:\b,samples=20] plot (\x,{1.3+0.9*sin(60*\x)});
      \pgfmathsetmacro{\h}{1.3+0.9*sin(60*\b)}
      \draw[very thick] (\b,\h) -- (\b+0.8,\h);
    }
    \foreach \a in {0,1.6,3.2,4.8} {
      \draw (\a,-0.75) -- (\a,-0.35) -- (\a+0.8,-0.35) -- (\a+0.8,-0.75) -- (\a+1.6,-0.75);
    }
    \node[left,font=\scriptsize] at (0,-0.55) {$CK$};
    \node[font=\scriptsize] at (0.4,-1.0) {track};
    \node[font=\scriptsize] at (1.2,-1.0) {hold};
    \node[font=\scriptsize,anchor=west] at (1.6,2.6) {$V_{out}$ (black)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Sample, then quantize.** A track-and-hold followed by a quantizer acts like an ideal impulse sampler: the spectrum repeats at multiples of $f_S$, and any input above $f_S/2$ aliases.
> 2. **Speed:** settling to within ½ LSB takes $t_{acq} = (N+1)\ln 2\cdot R_{on}C_1 \approx 0.69(N+1)\tau$.
> 3. **Noise:** the sampled noise is $\overline{v_n^2} = kT/C_1$, whatever the switch resistance. $C_1$ is sized by noise, and $R_{on}$ is then sized by speed.
> 4. **The MOS switch** gives three input-dependent errors, all caused by $V_{GS} = V_{DD}-V_{in}$: an $R_{on}$ that varies with $V_{in}$ (distortion that grows with frequency), channel charge injection $\Delta V = WLC_{ox}(V_{GS}-V_{TH})/C_1$, and clock feedthrough. Charge injection obeys a hard trade-off: $\Delta V\cdot\tau = L^2/\mu_n$.
> 5. **The fixes:** differential sampling (removes even harmonics and offset, doubles SNR), bottom-plate sampling (makes the injected charge independent of the input), and bootstrapping (holds $V_{GS}$ constant, which fixes all three errors at once).
> 6. **Jitter:** $\mathrm{SNR} = 1/(\sigma_j\omega_{in})^2$. For a fixed SNR, a higher input frequency needs less jitter.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 The Ideal Sampler|ideal sampler]] → [[#Level 1 The RC Sampler|RC model: settling and kT/C]] → [[#Level 2 The MOS Switch|MOS switch, $R_{on}$ distortion]] → [[#Level 3 Turn-Off Errors|charge injection and feedthrough]] → [[#Level 4 Circuit-Level Fixes|differential, dummy, bottom-plate, closed-loop S/H]] → [[#Level 5 Bootstrapping|bootstrapping]] → [[#Level 6 Jitter, Specifications, and Testing|jitter, specs, testing]] → [[#Level 7 Design Study 10-bit, 5 GS/s Bootstrapped Sampler|a full design]].

## Spec translation

A sampler contains two kinds of device. The **switch** is a triode resistor, so it is sized for $R_{on}$ rather than with gm/ID. The **amplifiers** around it (the input buffer and, in a closed-loop S/H, the op amp) are sized with gm/ID. The ADC's specs flow down in that order: to the capacitor, then the switch, then the amplifiers.

**Sampler specs** (Razavi DC §3.9, Ch. 4; Carusone §11.1): resolution $N$ and SNR, the tracking bandwidth and attenuation at Nyquist, acquisition (settling to ½ LSB in the track time), THD at full scale and $f_{in}\approx f_{CK}/2$, aperture jitter, the $kT/C$ penalty on SNR, and the pedestal (a hold step that should be signal-independent).

| Sampler spec | Element that sets it | Spec it imposes |
|---|---|---|
| SNR / $kT/C$ penalty | $C_s$ | $C_s \ge$ value from $\frac{A^2/2}{\Delta^2/12+2kT/C_s}$ (differential) |
| Acquisition (½ LSB in $t_{tr}$) | Switch + $C_s$ | $R_{on}C_s \le \frac{t_{tr}}{(N+1)\ln 2}$ |
| Attenuation at Nyquist | Switch + $C_s$ | $R_{on}\le\frac{\sqrt{10^{x/10}-1}}{C_s\omega_{in}}$ for $x$ dB |
| THD (dynamic) | Switch, bootstrap path | Small *variation* of $R_{on}$: bootstrapped $V_{GS}$, $a_1C_s\le T_{CK}/2000$ (10 b) |
| Pedestal | Switch $W$, $L$ | $\Delta V\cdot\tau = L^2/\mu_n$: use $L_{min}$; bottom-plate timing |
| Aperture jitter | Clock generator | $\sigma_j \le 1/(\omega_{in}\sqrt{\mathrm{SNR}})$ |
| Driving $C_s$ | **Input buffer** | **Output impedance** $\ll R_{on}$; **slew / peak current** $\ge C_s\omega_{in}V_1$ and $\Delta V_{step}/R_{on}$; **linearity** better than the sampler's THD; **output swing** = full scale |
| Held-value accuracy (closed-loop S/H, MDAC) | **Op amp** | **DC gain** $A_0\ge 2^{N+1}/\beta$; **GBW** $\omega_u\ge\frac{(N+1)\ln2}{\beta t_s}$; **slew rate** for the full-scale step; **output swing** = full scale (×2 for the ×2 S/H) |

$$
\boxed{A_0 \ge \frac{2^{N+1}}{\beta}}\qquad\boxed{\omega_u \ge \frac{(N+1)\ln 2}{\beta\,t_s}}\qquad\boxed{R_{out,buf}\ll R_{on},\quad I_{buf,peak}\ge\max\!\left(C_s\omega_{in}V_1,\ \frac{\Delta V_{step}}{R_{on}}\right)}
$$

> [!note]- Derivation: op-amp gain and GBW for ½-LSB accuracy
> In hold the S/H is a feedback amplifier with $\beta = C_1/(C_1+C_2)$ ([[#Closed-Loop S/H The x2 Sample-and-Hold Amplifier]]). Finite gain leaves a static relative error $1/(1+A_0\beta)\approx 1/(A_0\beta)$. Single-pole settling leaves $e^{-\beta\omega_ut_s}$. Giving each the full ½-LSB budget $\epsilon = 2^{-(N+1)}$:
> $$\frac{1}{A_0\beta}\le 2^{-(N+1)}\Rightarrow A_0\ge\frac{2^{N+1}}{\beta};\qquad e^{-\beta\omega_ut_s}\le2^{-(N+1)}\Rightarrow\omega_u\ge\frac{(N+1)\ln2}{\beta t_s}$$
> In practice you split the budget between the two (ECE 636 picks $1.5$–$2\times A_{0,\min}$ and then solves the exact GBW expression in [[#Closed-Loop S/H The x2 Sample-and-Hold Amplifier|the x2 S/H section]]). Slewing eats into $t_s$ before linear settling starts ([[Operational Amplifiers#Slew Rate]]). The buffer's peak current is $C_s\,dV/dt$ for a tracked sine, but at the start of the track phase it is the jump between consecutive samples divided by $R_{on}$ ([[#The Driver]]).

| Amplifier spec | Lands on | Why |
|---|---|---|
| Op-amp $A_0$ | $g_mr_o$: long $L$, high $g_m/I_D$, cascoding | $A_0\sim(g_mr_o)^k$ |
| Op-amp GBW $=g_m/C_L$ | $g_m=\omega_uC_L$, then $I_D = g_m/(g_m/I_D)$ | $C_L$ includes $C_s$ (and $(1-\beta)$ of the feedback network) |
| Slew rate | $I_D$ (tail) directly | $SR = I_{tail}/C_L$; the larger of the GBW and SR currents wins |
| Output swing (op amp, buffer) | $V_{D,sat}\approx2/(g_m/I_D)$ of stacked output devices | Full scale must fit under $V_{DD}$ |
| Buffer $R_{out}\approx1/g_m$ | $g_m\gg1/R_{on}$, then $I_D$ | A follower's output resistance |
| Buffer linearity | Lower $g_m/I_D$ on the follower, bias $I_D\gg C_s\omega V_1$ | Slope-dependent $V_{GS}$ ([[#The Driver]]) |
| Switch $R_{on}$ (not gm/ID) | $W$ at $L_{min}$ and $V_{GS}=V_{DD}$ (bootstrapped) | Triode: $R_{on}\propto L/(WV_{OV})$; read $R_{on}\cdot W$ from simulation at the corner |

> [!tip] Remark
> The spec names and the "knob it fixes" column come from [[Single-Stage#Amplifier Specifications]]. The procedure that turns $g_m/I_D$, $L$ and $I_D$ into a $W$ is [[gm-ID Design Methodology]].

**Worked example** (Razavi DC Ch. 4: 10 bits, 5 GS/s, 28 nm, SS 75 °C, $V_{DD}=0.95$ V, differential full scale 1 V):
1. SNR ideal 62 dB. A 1 dB $kT/C$ penalty gives $C_s = 445$ fF, rounded to **0.5 pF**.
2. 0.5 dB attenuation at 2.5 GHz gives $R_{on}=$ **44.5 Ω**, so $W_1\approx10$ µm at $L=28$ nm. THD at Nyquist then needs $W_1 =$ **20 µm** ($R_{on}\approx23$ Ω).
3. Buffer: a full-swing step of 0.5 V at the start of the track phase means **≈22 mA** peak, and an output impedance **well below 23 Ω**. This is the hardest amplifier spec in the chain, and Razavi leaves it to the preceding stage.
4. Closed-loop alternative (ECE 636): a 16-bit ×2 S/H ($\beta=\tfrac{1}{2}$) with $t_s=100$ ns needs $A_0 > 131{,}072$ (designed at 262,144, ≈108 dB) and GBW > 236 Mrad/s (≈37.5 MHz). That gives $g_m = \mathrm{GBW}\cdot C_L$ once the load (sampling capacitors plus the next stage) is known.

## Level 0: The Ideal Sampler

### Impulse Sampling and Aliasing

```tikz title="Sampling copies the input spectrum to every multiple of f_S. If the input bandwidth f_1 exceeds f_S/2, the copies overlap (aliasing). A zero-order hold also multiplies the spectrum by a sinc (dashed), but a following quantizer removes it. After Razavi (Data Converters) Figs. 3.1-3.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-0.3,0) -- (9.6,0) node[right]{$f$};
  \foreach \c in {0,3,6,9} {
    \draw[thick] (\c-1,0) -- (\c,1.3) -- (\c+1,0);
  }
  \foreach \c/\l in {0/0,3/f_S,6/2f_S,9/3f_S} { \node[below,font=\scriptsize] at (\c,0) {$\l$}; }
  \draw[dashed,domain=0.05:8.95,samples=120] plot (\x,{1.9*abs(sin(60*\x)/(0.01745*60*\x))});
  \draw[dashed] (-0.3,1.9) -- (0.05,1.9);
  \node[font=\scriptsize,anchor=west] at (3.7,1.9) {ZOH envelope $\left|\frac{\sin \pi fT_S}{\pi fT_S}\right|$};
  \draw[dotted] (1.5,0) -- (1.5,2.1) node[above,font=\scriptsize]{$f_S/2$};
  \node[font=\scriptsize] at (1.0,-0.65) {$f_1<f_S/2$: copies separate};
  \begin{scope}[yshift=-3.4cm]
    \draw[->] (-0.3,0) -- (9.6,0) node[right]{$f$};
    \foreach \c in {0,3,6} {
      \draw[thick] (\c-1.9,0) -- (\c,1.3) -- (\c+1.9,0);
    }
    \fill[gray!40] (1.1,0) -- (1.5,0.26) -- (1.9,0) -- cycle;
    \fill[gray!40] (4.1,0) -- (4.5,0.26) -- (4.9,0) -- cycle;
    \foreach \c/\l in {0/0,3/f_S,6/2f_S} { \node[below,font=\scriptsize] at (\c,0) {$\l$}; }
    \draw[dotted] (1.5,0) -- (1.5,1.6) node[above,font=\scriptsize]{$f_S/2$};
    \node[font=\scriptsize,anchor=west] at (3.4,1.75) {$f_1>f_S/2$: overlap = aliasing (shaded)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{X_s(f) = \frac{1}{T_S}\sum_{k=-\infty}^{\infty}X(f-kf_S)}\qquad
\boxed{f_{in,\max} < \frac{f_S}{2}\quad(\text{Nyquist});\qquad 0\ldots f_S/2 = \text{first Nyquist zone}}
$$

An ideal sampler multiplies the input by an impulse train with period $T_S = 1/f_S$, which copies the spectrum to every $kf_S$ (all copies the same height). This note owns the sampler and its spectrum.

> [!tip] Remark
> What aliasing does at the converter level (folding into Nyquist zones, harmonics folding next to the signal, the anti-alias filter) is [[Data Converter Fundamentals#Aliasing and Nyquist Zones]]; the quantization-noise floor is [[Data Converter Fundamentals#Level 1 Quantization Noise]]. The discrete-time view of the samples ($z$-domain, normalized frequency) is [[Switched-Capacitor Circuits#Level 1 Discrete-Time Signals]].

### Zero-Order Hold and Track-and-Hold

$$
\boxed{\text{ZOH: } Y(f) = Y_{ideal}(f)\cdot\frac{\sin(\pi fT_S)}{\pi fT_S}\,e^{-j\pi fT_S}}
$$

- **Impulse sampler:** impossible to build, and its output does not last long enough for anything to read it.
- **Zero-order hold (ZOH):** the output jumps to each sample and holds it for $T_S$. On its own, this multiplies the spectrum by a sinc ("sinc droop").
- **Track-and-hold (T/H) = sample-and-hold (S/H):** the switch is on for part of the period (the *track* or *acquisition* phase, often ½ of $T_S$ or less) and off for the rest (the *hold* phase). This is the only one of the three you can build. It is the "sampler" in the rest of this note.
- **The sinc droop doesn't matter in an ADC.** The quantizer reads only one point per held interval, the same values an impulse sampler would produce. Together, the T/H and the quantizer act as an ideal impulse sampler.
- Lengthening the track phase relaxes settling but leaves less time for the quantizer. Designers usually give the quantizer more than half.

> [!note]- Detail: "sample-and-hold" vs "track-and-hold" (Carusone §11.1)
> The two names usually mean the same circuit. The exception is a switched-capacitor S/H whose output never tracks the input, e.g. [[#Closed-Loop S/H The x2 Sample-and-Hold Amplifier|the flip-around S/H]], whose output is reset during sampling. A S/H at the ADC front end also hides the small timing differences between the converter's internal comparators, because they all see the same held value.

## Level 1: The RC Sampler

### Acquisition Time

```tikz title="Acquisition: when the switch closes, V_out approaches V_in exponentially and must arrive within Delta V (0.5 LSB) before the switch opens at t_acq. After Razavi (Data Converters) Figs. 3.6, 3.7, 3.50."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} to[R, l=$R_{on}$] (2.2,0) coordinate (O);
  \draw (O) node[circ]{} -- (2.9,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C, l_=$C_1$] (2.2,-1.6) node[ground]{};
  \begin{scope}[xshift=4.8cm,yshift=-1.4cm]
    \draw[->] (0,0) -- (6.4,0) node[right]{$t$};
    \draw[->] (0,0) -- (0,3.0);
    \draw[gray,thick] (-0.3,0.02) -- (0,0.02) -- (0,2.5) -- (6,2.5);
    \node[gray,left,font=\scriptsize] at (0,2.5) {$V_{FS}$};
    \draw[very thick,domain=0:6,samples=60] plot (\x,{2.5*(1-exp(-\x/1.1))});
    \draw[dashed] (0,2.3) -- (6,2.3);
    \draw[dotted] (4.0,0) -- (4.0,2.5);
    \node[below,font=\scriptsize] at (4.0,0) {$t_{acq}$};
    \node[below,font=\scriptsize] at (0,0) {$0$};
    \draw[<->] (6.25,2.3) -- (6.25,2.5);
    \node[right,font=\scriptsize] at (6.3,2.4) {$\Delta V \le \tfrac12$ LSB};
    \node[font=\scriptsize] at (2.0,1.2) {$V_{out}$};
    \node[font=\scriptsize,anchor=west] at (1.2,0.45) {$\tau = R_{on}C_1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{t_{acq} = R_{on}C_1\ln 2^{N+1} = (N+1)\ln 2\cdot R_{on}C_1 \approx 0.69(N+1)\,R_{on}C_1}
$$

$$
\boxed{\text{With } t_{acq} = T_{CK}/2:\qquad R_{on}C_1 \le \frac{T_{CK}}{2(N+1)\ln 2}}
$$

- Worst case is a full-scale step: the previous sample was at one end of the range and the new input is at the other.
- 8 bits needs 6.2 time constants; 10 bits needs 7.6. Each extra bit adds $\ln 2 \approx 0.69\tau$.
- This settling requirement is much stricter than "the bandwidth must pass $f_{CK}/2$" ($R_1C_1\le T_{CK}/\pi$). If the circuit settles, its bandwidth is automatically more than enough.

> [!note]- Derivation: the ½-LSB settling condition (Razavi Ex. 3.3, 3.24)
> With $V_{out}(0)=0$ and a step to $V_{FS}$: $V_{FS}(1-e^{-t/\tau}) = V_{FS} - V_{FS}/2^{N+1}$, so $e^{-t/\tau} = 2^{-(N+1)}$ and $t = \tau\ln 2^{N+1}$. For $N=10$: $\ln 2048 = 7.62$, so with half a clock period available, $\tau \le T_{CK}/15.24$.

### kT/C Noise

```tikz title="The switch's thermal noise 4kTR_on is low-pass filtered by R_on C_1; the integrated noise left on C_1 is kT/C_1 regardless of R_on. After Razavi (Data Converters) Fig. 3.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ground]{} -- (0,0.2) to[vsource, l={$4kTR_{on}$}] (0,2) -- (0.4,2) to[R, l=$R_{on}$] (2.4,2) coordinate (O);
  \draw (O) node[circ]{} -- (3.0,2) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C, l_=$C_1$] (2.4,0.2) node[ground]{};
  \begin{scope}[xshift=5.4cm,yshift=0.2cm]
    \draw[->] (0,0) -- (5.2,0) node[right]{$f$};
    \draw[->] (0,0) -- (0,2.4) node[above]{$\overline{V^2_{n,out}}(f)$};
    \fill[gray!25,domain=0:4.9,samples=60] (0,0) -- plot (\x,{1.6/(1+(\x/1.4)*(\x/1.4))}) -- (4.9,0) -- cycle;
    \draw[thick,domain=0:4.9,samples=60] plot (\x,{1.6/(1+(\x/1.4)*(\x/1.4))});
    \node[left,font=\scriptsize] at (0,1.6) {$4kTR_{on}$};
    \draw[dotted] (1.4,0) -- (1.4,0.8);
    \node[below,font=\scriptsize] at (1.4,0) {$\frac{1}{2\pi R_{on}C_1}$};
    \node[font=\scriptsize] at (3.4,1.2) {area $=kT/C_1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{v^2_{n,out}} = \frac{kT}{C_1},\qquad v_{n,rms} = \sqrt{\frac{kT}{C_1}}\quad(64\ \mu V_{rms}\text{ for } 1\text{ pF at } 300\text{ K})}
$$

> [!tip] Remark
> This is the same kT/C result as in [[Noise#kT/C Noise]]. A larger $R_{on}$ produces more noise density but narrows the bandwidth by the same factor, so the two cancel. Once the switch opens, $C_1$ holds that noise as a fixed error in the sample.

- $C_1$ is chosen first, to keep $kT/C_1$ well below the quantization noise. Then $R_{on}$ follows from settling. A larger $C_1$ makes the stage that drives the sampler harder to design.
- Each bit of extra resolution halves the LSB, so $C_1$ must grow 4×.

> [!note]- Derivation: integrating the low-pass noise
> $\overline{V^2_{n,out}}(f) = 4kTR_{on}/\left[1+(2\pi fR_{on}C_1)^2\right]$. With $x = 2\pi R_{on}C_1 f$:
> $$\int_0^\infty \frac{4kTR_{on}\,df}{1+(2\pi fR_{on}C_1)^2} = \frac{4kTR_{on}}{2\pi R_{on}C_1}\int_0^\infty\frac{dx}{1+x^2} = \frac{4kT}{2\pi C_1}\cdot\frac{\pi}{2} = \frac{kT}{C_1}.$$
> This assumes the switch is in deep triode by the end of acquisition, which holds in any sampler that has settled ([[#A Single NMOS Switch]]).

### The Driver

$$
\boxed{I_{peak} = C_1\omega_{in}V_1}\qquad(\text{1 pF, 1 GHz, }V_1 = 0.3\text{ V} \Rightarrow 1.9\text{ mA})
$$

The buffer in front of the sampler must source and sink $C_1\,dV/dt$, or it slews and distorts the input before the switch even sees it ([[Operational Amplifiers#Slew Rate]]). Worse, at the start of each track phase the capacitor still holds the *previous* sample, so the initial current is (step)/$R_{on}$. In the [[#Level 7 Design Study 10-bit, 5 GS/s Bootstrapped Sampler|design study]], that is $0.5\text{ V}/23\ \Omega \approx 22$ mA, and the buffer's output impedance must be well below 23 Ω.

> [!note]- Detail: three ways a source-follower buffer distorts (Razavi Ex. 3.14)
> 1. **Slope-dependent $V_{GS}$:** on a rising input the follower must supply $I_1 + C_1\,dV_A/dt$; on a falling input it supplies less. The level shift therefore changes with the signal's slope.
> 2. **Body effect:** a higher output means a higher $V_{TH}$ and a larger level shift ([[MosFETs#Body Effect]]).
> 3. **$r_o$ varies with $V_{DS}$:** the gain $r_O/(r_O+1/g_m)$ then depends on the input level ([[MosFETs#Output Impedance vs. V_DS]]).

## Level 2: The MOS Switch

### A Single NMOS Switch

```tikz title="Left: NMOS on-resistance diverges as V_in approaches V_DD - V_THN; PMOS diverges as V_in falls to |V_THP|. Right: their conductances are linear in V_in with opposite slopes, so in parallel (equal strengths) the sum is flat between |V_THP| and V_DD - V_THN. After Razavi (Data Converters) Figs. 3.10, 3.17, 3.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.0,0) node[right]{$V_{in}$};
  \draw[->] (0,0) -- (0,3.2) node[above]{$R_{on}$};
  \draw[thick,domain=0:3.3,samples=80] plot (\x,{0.25/(3.4-\x)+0.15});
  \draw[thick,dashed,domain=0.6:4.6,samples=80] plot (\x,{0.25/(\x-0.5)+0.15});
  \draw[dotted] (3.4,0) -- (3.4,3.0);
  \draw[dotted] (0.5,0) -- (0.5,3.0);
  \node[below,font=\scriptsize] at (3.4,0) {$V_{DD}-V_{THN}$};
  \node[below,font=\scriptsize] at (0.5,0) {$|V_{THP}|$};
  \node[font=\scriptsize] at (2.0,1.4) {NMOS};
  \node[font=\scriptsize] at (4.3,0.95) {PMOS (dashed)};
  \begin{scope}[xshift=7.0cm]
    \draw[->] (0,0) -- (5.6,0) node[right]{$V_{in}$};
    \draw[->] (0,0) -- (0,3.2) node[above]{$1/R_{on}$};
    \draw[thick] (0,2.0) -- (3.4,0);
    \draw[thick,dashed] (0.5,0) -- (4.8,2.53);
    \draw[very thick] (0,2.0) -- (0.5,1.706) -- (3.4,1.706) -- (4.8,2.53);
    \draw[dotted] (0.5,0) -- (0.5,1.7);
    \draw[dotted] (3.4,0) -- (3.4,1.7);
    \node[below,font=\scriptsize] at (0.5,0) {$|V_{THP}|$};
    \node[below,font=\scriptsize] at (3.4,0) {$V_{DD}-V_{THN}$};
    \node[below,font=\scriptsize] at (4.95,0) {$V_{DD}$};
    \node[font=\scriptsize] at (1.95,2.05) {sum (flat)};
    \node[font=\scriptsize] at (0.9,0.6) {NMOS};
    \node[font=\scriptsize] at (3.9,0.9) {PMOS};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{on,N} = \frac{1}{\mu_nC_{ox}\frac WL(V_{DD}-V_{in}-V_{THN})}}
\qquad
\boxed{R_{on,P} = \frac{1}{\mu_pC_{ox}\left(\frac WL\right)_P(V_{in}-|V_{THP}|)}}
$$

> [!tip] Remark
> This is the deep-triode $R_{on}$ from [[MosFETs#Regions of Operation]], with $V_{GS} = V_{DD}-V_{in}$. The switch carries no current once it has settled, so it is on while $I_D = 0$, exactly like the [[MosFETs#Level 0 The Switch Model|switch model]].

- **An NMOS cannot pass a high input.** Charging toward $V_{in} = V_{DD}$, it turns off when $V_{out} = V_{DD}-V_{TH}$.
- Even below that limit, a small overdrive means a large $R_{on}$, so inputs near $V_{DD}-V_{TH}$ are attenuated and phase-shifted more than inputs near ground.
- During acquisition the device may start in saturation (large $V_{DS}$), but by the end it is in deep triode, because $V_{out}\approx V_{in}$.
- To measure $R_{on}$ vs $V_{in}$ in simulation, put a small fixed $V_{DS}$ (e.g. 10 mV) across the switch, sweep the common level, and plot $V/I$.

> [!note]- Derivation: why the NMOS stalls at $V_{DD}-V_{TH}$ (Razavi Eqs. 3.18–3.20)
> With $V_{in}=V_{DD}$ and $V_{out}(0)=0$, $M_1$ is saturated and works as a source follower charging $C_1$:
> $$\tfrac12\mu_nC_{ox}\tfrac WL(V_{DD}-V_{out}-V_{TH})^2 = C_1\frac{dV_{out}}{dt}\Rightarrow V_{out} = V_{DD}-V_{TH}-\frac{1}{\frac12\mu_n\frac{C_{ox}}{C_1}\frac WL t + \frac{1}{V_{DD}-V_{TH}}}$$
> which approaches $V_{DD}-V_{TH}$ only as $1/t$, and never passes it (ignoring subthreshold conduction). Doubling $W/L$ gets there faster but to the same limit. Discharging toward $V_{in}=0$ works: the device starts saturated, enters triode, and reaches 0.

### Distortion from On-Resistance Variation

$$
\boxed{V_{out}\approx V_0 + \frac{V_1}{\sqrt{1+R_{on}^2C_1^2\omega_1^2}}\cos\!\left[\omega_1t-\tan^{-1}(R_{on}C_1\omega_1)\right]}
$$

$$
\boxed{R_{on}(t) = R_{on0}+a_1\cos\omega_1t+a_2\cos2\omega_1t+\cdots\ \Rightarrow\ \mathrm{HD_2} = \frac{a_1C_1\omega_1}{2},\quad \mathrm{HD_3} = \frac{a_2C_1\omega_1}{2}}
$$

The RC filter delays the output by a phase $\approx R_{on}C_1\omega_1$. When $R_{on}$ changes with the input level, that delay changes too, and a signal-dependent phase shift is distortion. This happens **even when the attenuation is negligible.**

- **Dynamic:** HD rises in proportion to $\omega_1$. At low frequency every input level settles fully and the distortion disappears. Test at the Nyquist frequency.
- **Doubling $W$** halves every Fourier coefficient of $R_{on}$, which halves HD2 and HD3. But it also doubles the drain junction capacitance on $C_1$, and that capacitance is itself nonlinear (it varies with $V_{in}$).

> [!note]- Derivation: harmonics from a time-varying $R_{on}$ (Razavi Eqs. 3.27–3.33)
> Take $R_{on}C_1\omega_1\ll 1$, so $\tan^{-1}(R_{on}C_1\omega_1)\approx R_{on}C_1\omega_1$. Substitute the Fourier series:
> $$V_{out}\approx V_0+V_1\cos\left[\omega_1t - C_1\omega_1(R_{on0}+a_1\cos\omega_1t+a_2\cos2\omega_1t+\cdots)\right]$$
> Expand with $\cos\epsilon\approx1$, $\sin\epsilon\approx\epsilon$:
> $$V_{out}\approx V_0+V_1\cos\omega_1t+V_1R_{on0}C_1\omega_1\sin\omega_1t+\frac{V_1a_1C_1\omega_1}{2}\sin2\omega_1t+\frac{V_1a_2C_1\omega_1}{2}(\sin3\omega_1t-\sin\omega_1t)+\cdots$$
> Normalize to the fundamental ($\approx V_1$). If $R_{on}$ is a pure sinusoid between $R_1$ and $R_2$: $\mathrm{HD_2} = (R_2-R_1)C_1\omega_1/4$ and no higher harmonics appear.

### Complementary (Transmission-Gate) Switch

$$
\boxed{\mu_p\left(\tfrac WL\right)_P = \mu_n\left(\tfrac WL\right)_N\ \Rightarrow\ R_{on1}\|R_{on2} = \frac{1}{\mu_nC_{ox}(W/L)_N(V_{DD}-V_{THN}-|V_{THP}|)}\ \text{(flat)}}
$$

- Put an NMOS and a PMOS in parallel. Their conductances add, and with equal strengths the sum is flat, but **only for $|V_{THP}|<V_{in}<V_{DD}-V_{THN}$** (see the figure above). Outside that range only one device conducts. Short-channel effects give the real curve a hump: it rises from $R_1$ to $R_{max}$ and falls to $R_2$.
- For a rail-to-rail input with $R_1\approx R_2$, $R_{on}$ goes through **two cycles per input cycle**. That produces **only odd harmonics**: $\mathrm{HD_3} = a_1C_1\omega_1/2$, $\mathrm{HD_5} = a_2C_1\omega_1/2$ (with $a_1 \approx (R_{max}-R_1)/2$).
- **How flat must it be?** 10 bits means HD3 ≈ −62 dB ≈ $8\times10^{-4}$. At the Nyquist frequency that requires $a_1C_1 \le T_{CK}/2000$. Compare the settling requirement of $R_{on0}C_1\le T_{CK}/15$: the *variation* of the time constant must be about 130× smaller than the time constant itself. A complementary switch can't get there at high resolution, which is why [[#Level 5 Bootstrapping|bootstrapping]] exists.

## Level 3: Turn-Off Errors

### Switch Capacitances in Deep Triode

$$
\boxed{C_{GS} = C_{GD} = \frac{WLC_{ox}}{2} + WC_{ov}}
$$

> [!tip] Remark
> These are the triode capacitances from [[MosFETs#Capacitances]]: the channel charge splits half to each side, plus the overlap (and contact-fringe) capacitance $C_{ov}$ per unit width. Both scale with $W$, so a lower $R_{on}$ always costs more of every error below.

```tikz title="When the gate falls, the channel electrons leave through both terminals (charge injection), and the gate edge couples through C_GD (clock feedthrough). Both leave a pedestal Delta V on C_1. After Razavi (Data Converters) Figs. 3.25, 3.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) -- (1.1,0);
  \draw (1.1,0) -- (1.1,-0.6) -- (2.1,-0.6) -- (2.1,0) -- (3.4,0) -- (3.4,-0.6) -- (4.4,-0.6) -- (4.4,0) -- (5.0,0);
  \node[font=\scriptsize] at (1.6,-0.3) {$n^+$};
  \node[font=\scriptsize] at (3.9,-0.3) {$n^+$};
  \draw[fill=gray!60] (2.0,0.12) rectangle (3.5,0.45);
  \draw (2.0,0) rectangle (3.5,0.12);
  \foreach \x in {2.2,2.45,...,3.3} { \fill (\x,-0.07) circle (0.035); }
  \draw[->,thick] (2.5,-0.25) -- (1.75,-0.85);
  \draw[->,thick] (3.0,-0.25) -- (3.75,-0.85);
  \node[font=\scriptsize] at (2.75,-1.15) {channel charge $Q_{ch}$ splits};
  \draw (2.75,0.45) -- (2.75,0.9);
  \draw (2.35,1.6) -- (2.75,1.6) -- (3.0,0.9) -- (3.4,0.9);
  \node[font=\scriptsize,above] at (2.35,1.6) {$V_{DD}$};
  \node[font=\scriptsize,right] at (3.4,0.9) {$0$};
  \draw (1.6,0) -- (1.6,0.6) -- (0.4,0.6) node[ocirc]{} node[left]{$V_{in}$};
  \draw (3.9,0) -- (3.9,0.6) -- (6.2,0.6) coordinate (O) node[circ]{} -- (6.8,0.6) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C, l=$C_1$] (6.2,-1.0) node[ground]{};
  \node[font=\scriptsize] at (0.6,-0.4) {p-sub};
  \begin{scope}[xshift=8.6cm,yshift=-0.4cm]
    \draw[->] (0,0) -- (3.6,0) node[right]{$t$};
    \draw[thick] (0,1.3) -- (1.4,1.3) -- (1.8,0.75) -- (3.3,0.75);
    \draw[dotted] (1.8,1.3) -- (3.3,1.3);
    \draw[<->] (2.9,0.75) -- (2.9,1.3);
    \node[right,font=\scriptsize] at (2.95,1.02) {$\Delta V$};
    \node[font=\scriptsize] at (0.7,1.55) {$V_{out}$};
    \node[font=\scriptsize,align=center] at (1.7,-0.45) {pedestal (hold step)};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Clock Feedthrough

$$
\boxed{\Delta V_{CF} = -\frac{C_{GD}}{C_{GD}+C_1}V_{DD}}\qquad\left(\text{Carusone: } \Delta V \approx -\frac{C_{ox}WL_{ov}(V_{DD}-V_{SS})}{C_{hld}}\right)
$$

- The overlap capacitance $C_{GD}$ and $C_1$ form a capacitive divider for the falling clock edge.
- $C_{GD}$ barely depends on voltage, so the result is a **constant offset**, which is benign.
- But the clock's supply noise couples straight onto the sample, so a clock taken from a noisy digital inverter hurts PSRR.

### Channel Charge Injection

$$
\boxed{Q_{ch} = WLC_{ox}(V_{DD}-V_{in}-V_{TH}),\qquad \Delta V = \frac{Q_{ch}}{C_1}\ \ (\text{worst case: all of it lands on } C_1)}
$$

Read $\Delta V$ against the three error classes from [[Nonlinearity and Mismatch]]:

| Term in $\Delta V$ | Error type |
|---|---|
| $WLC_{ox}(V_{DD}-V_{TH0})/C_1$ | Offset |
| $-WLC_{ox}V_{in}/C_1$ | Gain error |
| $V_{TH}(V_{in})$ through the body effect: $V_{TH}=V_{TH0}+\gamma(\sqrt{V_{in}+2\phi_B}-\sqrt{2\phi_B})$ | **Nonlinearity** |

> [!tip] Remark
> The nonlinear term is the [[MosFETs#Body Effect]]: the switch's source follows $V_{in}$ while its bulk stays grounded, so its threshold depends on the signal. Even a perfectly bootstrapped switch keeps this term (see [[#Level 7 Design Study 10-bit, 5 GS/s Bootstrapped Sampler|step 2 of the design study]]).

- How the charge splits between source and drain depends on the impedances at the two ends and on the clock edge rate, and it is hard to model. Carusone assumes ½ for a fast edge; Razavi assumes 1 as a worst case.
- Carusone's numbers (Ex. 11.1): a 5/0.4 µm switch with $C_{ox} = 8.5$ fF/µm², 1 pF, $V_{DD}=2$ V, and half the charge on the capacitor gives a 4.7 mV step at $V_{in}=1$ V and 8.9 mV at 0.5 V.

$$
\boxed{\Delta V\cdot\tau = \frac{L^2}{\mu_n}}\qquad(\tau = R_{on}C_1)
$$

> [!important] Speed–precision trade-off
> The error times the time constant depends only on the technology. Neither $W$ nor $C_1$ appears, so resizing can't escape it: widening the switch or shrinking $C_1$ buys speed at the cost of precision, one for one. Only a shorter $L$ (a newer process) improves both. Razavi's *Analog CMOS* calls $F = (\tau\Delta V)^{-1} = \mu_n/L^2$ the figure of merit.

> [!note]- Derivation: $\Delta V\cdot\tau$
> $\tau = R_{on}C_1 = \dfrac{C_1}{\mu_nC_{ox}\frac WL V_{OV}}$ and $\Delta V = \dfrac{WLC_{ox}V_{OV}}{C_1}$. Multiply: $C_1$, $W$, $C_{ox}$ and $V_{OV}$ all cancel, leaving $L^2/\mu_n$.
>
> Carusone (§14.6) phrases the same result as a clock limit. Allow 5τ per half-period with two switches in series ($T/2 > 5\cdot 2R_{on}C$) and half the channel charge on $C$. The maximum $f_{clk}$ for a given $\Delta V_{max}$ is then independent of $C$ and the supply, and rises as $L$ shrinks. Carusone gets 14.8, 69 and 196 MHz for 0.8, 0.35 and 0.18 µm at $\Delta V_{max}=1$ mV.

> [!note]- Detail: a finite clock fall time makes the sampling instant depend on the input (Carusone §11.2, Ex. 11.2)
> The switch actually opens when the falling gate voltage crosses $V_{in}+V_{tn}$, not at some fixed point on the edge. A high input therefore samples *earlier* than a low one, a timing error that tracks the signal. Carusone's example: a ±2.5 V clock with a 1.5 ns fall, $V_{tn}=0.8$ V, and a ±1 V input gives turn-off times 0.21 ns and 0.81 ns into the edge, a 0.6 ns spread. The same mechanism makes a transmission gate's NMOS and PMOS turn off at different, input-dependent moments, so their injected charges don't cancel either (Carusone Fig. 11.4). Bottom-plate sampling and bootstrapping both remove this error.

### Error Summary

| Mechanism | Offset | Gain error | Nonlinear | Grows with $f_{in}$? |
|---|---|---|---|---|
| $R_{on}$ variation (phase) | | | ✓ | ✓ (dynamic) |
| Junction caps $C_{DB}(V_{in})$ | | | ✓ | ✓ (dynamic) |
| Clock feedthrough | ✓ | | | |
| Charge injection | ✓ | ✓ | ✓ (body effect) | (static) |
| Clock-edge timing (finite fall time) | | | ✓ | ✓ |
| $kT/C$, jitter | random | | | jitter ✓ |

**Static** errors (charge injection, clock feedthrough) appear even at low input frequency. **Dynamic** errors ($R_{on}$, bootstrap-path bandwidth) grow with frequency. The design approach: first size $C_1$ for static linearity using a low-frequency test, then widen the switch for dynamic linearity using a test at the Nyquist frequency, then iterate, since widening degrades the static result.

## Level 4: Circuit-Level Fixes

### Differential Sampling

$$
\boxed{\text{Differential: even harmonics cancel; } \mathrm{HD_3}=\frac{a_2C_1\omega_1}{2}\text{ unchanged; } \mathrm{SNR}\times 2\ (\text{signal power}\times4,\ \text{noise } 2kT/C_1)}
$$

- The two halves see opposite inputs, so $R_{on2}(t)$ is $R_{on1}(t)$ shifted by half a period. Odd Fourier terms flip sign and even ones don't. In $V_{out1}-V_{out2}$, the even harmonics therefore cancel and the odd ones add.
- Clock feedthrough and the constant part of charge injection appear on both sides equally. They become a **common-mode jump**, with no differential offset (apart from mismatch). The input-dependent part survives as $\Delta V_1-\Delta V_2 = \frac{WLC_{ox}}{C_1}(V_{in2}-V_{in1}+V_{TH2}-V_{TH1})$: gain error and nonlinearity remain.
- The common-mode jump is not free. If the sampler drives a differential pair, the jump lowers the tail node and can push the tail current source into triode, losing CMRR and bias current (Razavi Ex. 3.15).

> [!tip] Remark
> These are the general advantages of differential circuits ([[Differential Amplifiers]]): odd symmetry removes even-order terms, and the swing doubles while uncorrelated noise power only doubles.

### Dummy Switch

```tikz title="A half-width dummy M_3, source and drain shorted, driven by the complementary clock: its C_GS + C_GD = C_GD1 cancels feedthrough. After Razavi (Data Converters) Fig. 3.32, Carusone Fig. 11.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (1.5,0) node[nmos,rotate=-90](M1){};
  \draw (M1.S) -- ++(-0.9,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (M1.G) -- ++(0,0.3) node[above]{$CK$};
  \node[font=\scriptsize] at (1.5,-0.7) {$M_1\ (W)$};
  \draw (M1.D) -- ++(1.6,0) coordinate (O);
  \draw (4.6,0.9) node[nmos,rotate=-90](M3){};
  \draw (M3.G) -- ++(0,0.3) node[above]{$\overline{CK}$};
  \draw (M3.S) -- ++(-0.3,0) |- (O);
  \draw (M3.D) -- ++(0.3,0) |- (O);
  \node[font=\scriptsize] at (5.7,1.25) {$M_3\ (W/2)$};
  \draw (O) node[circ]{} -- ++(2.6,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw ($(O)+(1.6,0)$) node[circ]{} to[C, l=$C_1$] ++(0,-1.4) node[ground]{};
\end{circuitikz}
\end{document}
```

$$
\boxed{W_3 = \tfrac12W_1,\ L_3 = L_1}
$$

- **Feedthrough** cancels exactly: $C_{GD1} = C_{GS3}+C_{GD3} = 2C_{GD3}$.
- **Charge injection** cancels only if exactly half of $M_1$'s channel charge goes toward $C_1$. The split can't be predicted or reliably simulated, so you can't count on this.
- Carusone: with fast clocks a dummy cuts the pedestal to roughly ⅕. $\overline{CK}$ must rise slightly *after* $CK$ falls, so the dummy's charge can't escape back through a still-on $M_1$.

> [!note]- Detail: complementary switches for charge cancellation (Carusone Fig. 11.4)
> With equal NMOS and PMOS sizes, the two devices inject opposite charges, which ideally cancel at mid-range. Near $V_{DD}$ the PMOS has the larger overdrive and wins (positive step); near ground the NMOS wins. Finite clock edges also make the two devices turn off at different, input-dependent times. In practice the cancellation is partial.

### Bottom-Plate Sampling

```tikz title="Bottom-plate sampling: S_2 (at the fixed node X) opens first, freezing the charge on C_H; S_1 opens later and cannot change that charge because X is floating. The bottom plate, with its parasitic C_p, goes to the driven side. After Razavi (Analog CMOS) Figs. 13.31, 13.42; Carusone Fig. 14.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} to[nos, l=$S_1\ (\phi_1)$] (2.4,0) coordinate (B);
  \draw (B) node[circ]{} to[C, l=$C_H$] (4.6,0) coordinate (X);
  \draw (X) node[circ]{} node[above right]{$X$};
  \draw (X) to[nos, l=$S_2\ (\phi_{1e})$] (4.6,-2.0) node[ground]{};
  \draw (B) to[C, l_=$C_p$, dashed] (2.4,-2.0) node[ground]{};
  \node[font=\scriptsize,align=center] at (2.4,0.95) {bottom plate\\(driven side)};
  \node[font=\scriptsize] at (5.1,0.75) {top plate};
  \draw (X) -- (6.0,0) node[right,font=\scriptsize]{to op-amp input / next stage};
  \begin{scope}[xshift=0.6cm,yshift=-3.8cm]
    \node[left,font=\scriptsize] at (0,0.3) {$\phi_{1e}$};
    \draw[thick] (0,0) -- (0.4,0) -- (0.4,0.6) -- (3.6,0.6) -- (3.6,0) -- (7,0);
    \node[left,font=\scriptsize] at (0,-0.9) {$\phi_1$};
    \draw[thick] (0,-1.2) -- (0.4,-1.2) -- (0.4,-0.6) -- (4.2,-0.6) -- (4.2,-1.2) -- (7,-1.2);
    \draw[dotted] (3.6,0.8) -- (3.6,-1.4);
    \draw[dotted] (4.2,0.8) -- (4.2,-1.4);
    \node[font=\scriptsize,anchor=west] at (4.4,0.35) {$S_2$ opens first: sampling instant};
    \node[font=\scriptsize,anchor=west] at (4.4,-0.85) {then $S_1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{q_2 = WLC_{ox}(V_{CK}-V_{TH}-V_X)\ \text{with } V_X \text{ fixed}\ \Rightarrow\ \text{offset only}}
$$

1. **Advance the switch at the fixed node.** $S_2$ connects $X$ to ground or to a virtual ground, and it opens first. Its source sits at a constant voltage, so its $V_{GS}$ and $V_{TH}$ are the same every cycle. Its charge $q_2$ is a constant offset, and a differential circuit cancels it.
2. **Then $S_1$'s charge no longer matters.** After $S_2$ opens, node $X$ floats and the total charge on it is fixed. When $S_1$ opens and injects $q_1$, the charge at $X$ still can't change. Once $C_H$ is placed in feedback around the op amp, the output depends only on that frozen charge. Razavi (*Analog CMOS* §13.3.1) shows that the result is independent of $q_1$, the capacitor values, and the op-amp gain.
3. **Orient the plates.** The bottom plate's parasitic to substrate ($C_p$, 5–10% of $C_H$) goes on the side driven by a low impedance (the input or the op-amp output). The top plate goes to the sensitive node $X$. This keeps $C_p$ off $X$ and keeps substrate noise out of it.

> [!tip] Remark
> This is how every [[Switched-Capacitor Circuits|switched-capacitor stage]] is clocked. Carusone's rule (§14.6): make every switch that touches ground or virtual ground a single NMOS, and turn those off first. The finite clock edge then also stops modulating the sampling instant, because the instant is set by $S_2$, whose source never moves.

- The remaining mismatch between $S_2$ and $\bar S_2$ in a differential circuit can be removed with an equalizing switch $S_{eq}$, which opens after $S_2$ but before $S_1$ (Razavi *Analog CMOS* Fig. 13.35).

### Closed-Loop S/H: The x2 Sample-and-Hold Amplifier

```tikz title="The x2 S/H amplifier from a pipelined-ADC stage. Sample (phi_s): both capacitors charge to v_i, op amp in unity feedback, v_o = 0. Hold (phi_h): C_1 flips around the op amp, C_2 goes to ground, v_o = (1 + C_2/C_1) v_i. After ECE 636 slides (x2 S/H amp), Carusone Ch. 15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\ph in {0/s,7.4/h} {
  \begin{scope}[xshift=\ox cm]
    \draw (4,0) node[op amp](A\ph){};
    \draw (A\ph.+) -- ++(-0.4,0) -- ++(0,-0.4) node[ground]{};
    \coordinate (N\ph) at ($(A\ph.-)+(-0.7,0)$);
    \draw (A\ph.-) -- (N\ph) node[circ]{};
    \draw (N\ph) to[C, l=$C_2$] ++(-1.6,0) coordinate (L2\ph);
    \draw (N\ph) -- ++(0,1.4) to[C, l_=$C_1$] ++(-1.6,0) coordinate (L1\ph);
  \end{scope}
  }
  \draw (L1s) -- (L2s) node[circ]{} -- ++(-0.6,0) node[ocirc]{} node[left]{$v_i$};
  \draw (Ns) -- ++(0,2.3) -| ($(As.out)+(0.4,0)$) -- (As.out);
  \draw ($(As.out)+(0.4,0)$) node[circ]{} -- ++(0.4,0) node[right]{$v_o=0$};
  \node[font=\scriptsize] at (3.4,-2.0) {sample ($\phi_s$): $Q=(C_1+C_2)v_i$};
  \draw (L2h) -- ++(-0.3,0) -- ++(0,-0.3) node[ground]{};
  \draw (L1h) -- ++(0,0.9) -| ($(Ah.out)+(0.4,0)$) -- (Ah.out);
  \draw ($(Ah.out)+(0.4,0)$) node[circ]{} -- ++(0.4,0) node[right]{$v_o$};
  \node[font=\scriptsize] at (10.8,-2.0) {hold ($\phi_h$): $v_o=(1+C_2/C_1)\,v_i$};
\end{circuitikz}
\end{document}
```

$$
\boxed{v_o = \left(1+\frac{C_2}{C_1}\right)v_i\ (=2v_i \text{ for } C_1=C_2),\qquad \beta = \frac{C_1}{C_1+C_2}}
$$

$$
\boxed{v_o(t) = \frac{A_0}{1+A_0\beta}\left(1-e^{-t\,\mathrm{GBW}\,\beta}\right)V_i,\qquad A_0 > \frac{1}{\epsilon\beta},\qquad \mathrm{GBW} > -\frac{\ln\!\left[1-(1-\epsilon)\frac{1+A_0\beta}{A_0\beta}\right]}{t_s\,\beta}}
$$

> [!tip] Remark
> The gain error $1/(A_0\beta)$ and the settling time constant $1/(\mathrm{GBW}\cdot\beta)$ are the op-amp specs from [[Operational Amplifiers#Gain Sets the Gain Error]] and [[Operational Amplifiers#Bandwidth Sets the Settling Time]]. Here $\beta$ is set by capacitors. The same circuit with a DAC subtraction is the MDAC of a [[Pipelined ADCs|pipelined ADC]]; its switched-capacitor analysis is in [[Switched-Capacitor Circuits]].

- **Charge conservation does the math.** Sampling puts $(C_1+C_2)v_i$ on the virtual ground. In hold, all of that charge must end up on $C_1$, so $v_o = (C_1+C_2)v_i/C_1$.
- **Finite $A_0$ is a gain error**, $A_{0,f} = A_0/(1+A_0\beta) < 1/\beta$. For relative error $\epsilon$: $A_0 > 1/(\epsilon\beta)$. With $\beta=\tfrac{1}{2}$: 0.1% needs 2000 V/V (66 dB), 10-bit ($\epsilon = 2^{-10}$) needs 2048, and 16-bit needs 131,072 (102 dB).
- **Finite GBW is settling.** Closed-loop bandwidth $= \mathrm{GBW}\cdot\beta$. ECE 636 example: 16-bit, $t_s = 100$ ns, $A_0 = 2A_{0,\min} = 262{,}144$ gives GBW > 236 Mrad/s (≈37.5 MHz), $\tau < 8.5$ ns, about 12τ of settling. Choose $1.5A_{0,\min}\le A_0\le 2A_{0,\min}$.
- **The sample phase settles too.** The output must return from $2v_i$ to 0 with $\beta_{samp} = 1$. Whatever the op amp has to slew in either phase adds to the time budget.

> [!note]- Detail: other closed-loop and SC S/H architectures (Carusone §11.2–11.3)
> - **Op amp around the switch** (Fig. 11.7): high input impedance, and the output buffer's offset is divided by the op-amp gain. But the loop must be stable, and in hold the op amp runs open-loop and saturates, so it must slew back. An extra switch holds the first op amp's output near its track value (Fig. 11.8).
> - **Hold capacitor in the feedback of a second op amp** (Fig. 11.9): both sides of $Q_1$ sit at near-constant voltages, so its charge injection is a **signal-independent offset**, and the finite clock slope no longer moves the sampling time. $Q_2$ grounds the first op amp's output in hold, which speeds recovery and blocks feedthrough. The cost: two op amps plus $R_{on}$ inside one loop, which limits speed. Fig. 11.10 adds a matched $C'_{hld}$ on the + input so the injected charge appears as common mode.
> - **Miller hold capacitor** (Fig. 11.13): the hold capacitance is $C_{hld,eff} = (1+A)\frac{C_1C_2}{C_1+C_2}$, while sampling only has to charge $C_1+C_2$. That allows small capacitors and small switches.
> - **SC S/H with offset cancellation** (Fig. 11.15): during $\phi_1$ the op amp is in unity feedback and $C_H$ stores $V_{in}-V_{off}$. In $\phi_2$, $C_H$ is flipped into feedback and $V_{out} = V_{in}$ regardless of $V_{off}$. The output is invalid during $\phi_1$, which demands a high slew rate. Variants: the recycling S/H (Fig. 11.16), Gatti's always-valid output (Fig. 11.18), and an S/H combined with a low-pass filter for audio DACs, $f_{-3dB}\approx\frac{C_1}{2\pi C_2}f_{clk}$ (Fig. 11.19).
> - **Bipolar/BiCMOS:** diode-bridge T/H (Figs. 11.20–11.21) with $r_d = V_T/(I_B/2)$. In hold, clamp diodes $D_5$, $D_6$ reverse-bias the whole bridge, which makes the pedestal signal-independent and shields the hold node from the input. Schottky diodes turn off faster. Bipolar S/Hs droop because base current drains the hold capacitor; MOS input devices or a differential path fix that. The switched emitter follower (Fig. 11.23) cancels hold-mode feedthrough through $C_{be6}$ with $C_F\approx C_{be6}$.

## Level 5: Bootstrapping

### The Idea: A Battery from Gate to Source

```tikz title="Bootstrapping: a battery V_b from source to gate keeps V_GS = V_b while V_in swings, so R_on and Q_ch stop depending on the input. In practice the battery is a capacitor C_b precharged to V_DD. After Razavi (Data Converters) Fig. 3.33."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (2.0,0) node[nmos,rotate=-90](M){};
  \draw (M.S) -- ++(-0.8,0) coordinate (S) -- ++(-0.8,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (S) node[circ]{} to[battery1, l=$V_b$] ++(0,1.4) coordinate (T);
  \draw (T) -| (M.G);
  \node[above,font=\scriptsize] at (1.6,1.4) {$A$: $V_A = V_{in}+V_b$};
  \draw (M.D) -- ++(0.7,0) coordinate (O) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C, l_=$C_1$] ++(0,-1.5) node[ground]{};
  \node[font=\scriptsize] at (2.6,0.55) {$M_1$};
  \begin{scope}[xshift=6.2cm,yshift=-0.6cm]
    \draw[->] (0,0) -- (5,0) node[right]{$t$};
    \draw[thick,domain=0:4.6,samples=60] plot (\x,{0.8+0.5*sin(110*\x)});
    \draw[thick,dashed,domain=0:4.6,samples=60] plot (\x,{2.2+0.5*sin(110*\x)});
    \draw[<->] (4.75,0.8) -- (4.75,2.2) node[midway,right,font=\scriptsize]{$V_b$};
    \node[font=\scriptsize,anchor=west] at (0,1.55) {$V_{in}$};
    \node[font=\scriptsize,anchor=west] at (0,2.95) {$V_A$ (gate)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{GS} = V_b\ (\approx V_{DD}):\quad R_{on} = \frac{1}{\mu_nC_{ox}\frac WL(V_{DD}-V_{TH})}\ \text{const.},\quad Q_{ch} = WLC_{ox}(V_{DD}-V_{TH})\ \text{const.}}
$$

- All three switch errors came from $V_{GS} = V_{DD}-V_{in}$. Holding $V_{GS}$ constant removes the input dependence of $R_{on}$ (no phase distortion), of the channel charge (only an offset remains), and of the clock feedthrough.
- The gate rises **above the supply** (up to $V_{in}+V_{DD}$), which helps at low supply voltage. With a full $V_{DD}$ of overdrive, $M_1$ can also be narrower than an unbootstrapped switch.
- **What remains:** the source still moves with $V_{in}$, so $V_{TH}$ still varies through the [[MosFETs#Body Effect]]. $R_{on}$ and $Q_{ch}$ are not perfectly constant.

> [!note]- Detail: why a floating capacitor works as a battery (Razavi Ex. 3.16–3.18)
> If node $A$ connects only to $C_b$, no current can flow through $C_b$, so it keeps its charge and $V_A = V_{in}+V_b$ exactly. A parasitic $C_p$ from $A$ to ground spoils this. It forms a divider, $V_A = \frac{C_b}{C_b+C_p}V_{in}$, and when the precharged $C_b$ is first connected, the two share charge, $V_A(0^+) = \frac{C_b}{C_b+C_p}V_b$. By superposition:
> $$V_A = \frac{C_b}{C_b+C_p}(V_b+V_{in})$$
> Treat the initial condition on $C_b$ as a voltage step in series with it. Every switched-capacitor analysis uses this trick.

### The Complete Circuit

```tikz title="Complete bootstrapped switch (Dessouky-Kaiser). Track (CK high): M_3 and M_2 connect C_b across gate-source of M_1. Hold: M_4, M_5 recharge C_b to V_DD and M_6 (cascoded by M_7) grounds the gate. After Razavi (Data Converters) Figs. 3.37, 3.41(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[left]{$V_{DD}$} to[nos, l=$M_5$] (2.4,3) coordinate (P);
  \draw (P) node[circ]{} node[above]{$P$} to[nos, l=$M_3$] (5.0,3) coordinate (A);
  \draw (A) node[circ]{} node[above]{$A$} to[nos, l=$M_7$] (7.2,3) to[nos, l=$M_6$] (9.2,3) -- (9.2,2.6) node[ground]{};
  \draw (P) to[C, l_=$C_b$] (2.4,1.2) coordinate (Q);
  \draw (Q) node[circ]{} node[right]{$Q$};
  \draw (Q) to[nos, l_=$M_4$] (0.4,1.2) -- (0.4,0.8) node[ground]{};
  \draw (Q) to[nos, l=$M_2$] (2.4,-0.6) coordinate (I);
  \draw (I) node[circ]{} -- (0,-0.6) node[ocirc]{} node[left]{$V_{in}$};
  \draw (6.2,-0.6) node[nmos,rotate=-90](M1){};
  \draw (I) -- (M1.S);
  \draw (A) -- (5.0,0.5) -| (M1.G);
  \node[font=\scriptsize] at (6.2,-1.3) {$M_1$};
  \draw (M1.D) -- ++(0.8,0) coordinate (O) node[circ]{} -- ++(0.9,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C, l_=$C_1$] ++(0,-1.4) node[ground]{};
\end{circuitikz}
\end{document}
```

| Device | Type | Gate driven by | On during | Why |
|---|---|---|---|---|
| $M_1$ | N | $A$ | track | the sampling switch |
| $M_2$ | N | $A$ (tied to $M_1$'s gate) | track | connects $C_b$'s bottom to $V_{in}$; its own gate is bootstrapped so it stays on at high $V_{in}$ |
| $M_3$ | P | $\overline{CK}$ | track | connects $C_b$'s top ($P\ge V_{DD}$) to the gate; must be PMOS |
| $M_4$ | N | $\overline{CK}$ | hold | grounds $Q$ to recharge $C_b$ |
| $M_5$ | P | $A$ (bootstrapped) | hold | ties $P$ to $V_{DD}$. With its gate on $CK$ it would turn on in track once $V_P = V_{in}+V_{DD}$ exceeds $V_{DD}+|V_{TH5}|$ |
| $M_6$ | N | $\overline{CK}$ | hold | grounds $A$ to turn $M_1$ off |
| $M_7$ | N | $V_{DD}$ | always | cascode: $A$ reaches nearly $2V_{DD}$, so $M_7$ holds $M_6$'s drain near $V_{DD}-V_{TH7}$ |

- **Node ranges set the device types:** $V_A\in[0, 2V_{DD}]$, $V_P\ge V_{DD}$, $V_Q\le V_{DD}$. A switch to ground must be NMOS; a switch to $V_{DD}$ or to a node above it must be PMOS.
- **PMOS n-wells go to $P$**, the highest node, for both $M_3$ and $M_5$. A PMOS well may be tied to its "source" only if the "drain" never rises more than a few hundred mV above it. Otherwise the drain–well diode forward-biases, which disrupts the circuit and risks latch-up.
- **Turn-on order:** in track, $A$ leaves ground but stays at 0 until $M_3$ connects it to $P$. Then $M_1$ and $M_2$ turn on together.
- **Cost:** seven transistors and two capacitors per switch, and still the usual choice for high-speed, high-linearity samplers.

> [!note]- Detail: node waveforms (Razavi Ex. 3.19)
> In track: $V_A = V_P = V_{in}+V_{DD}$ and $V_Q = V_{in}$, so $A$ and $P$ follow the input shifted up by $V_{DD}$. In hold: $V_A = 0$, $V_P = V_{DD}$, $V_Q = 0$. For a rail-to-rail input, $V_A$ peaks near $2V_{DD}$, which is why $M_6$ needs the cascode $M_7$. In practice $V_A$ stays below $2V_{DD}$ because of [[#Bootstrapping Imperfections|charge sharing]].

### Bootstrapping Imperfections

```tikz title="Magnitude of (V_P - V_in)/V_in for the bootstrap path: small below the zero (V_GS tracks), but approaching C_p/(C_X + C_p) above the pole, so V_GS swings with the input at high frequency. After Razavi (Data Converters) Fig. 3.49."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right]{$\omega$ (log)};
  \draw[->] (0,0) -- (0,3.2) node[above]{$\left|\frac{V_P-V_{in}}{V_{in}}\right|$};
  \draw[very thick] (0,0.7) -- (2.6,0.7) -- (4.2,2.4) -- (6.6,2.4);
  \draw[dotted] (2.6,0) -- (2.6,0.7);
  \draw[dotted] (4.2,0) -- (4.2,2.4);
  \node[below] at (2.6,0) {$\omega_z$};
  \node[below] at (4.2,0) {$\omega_p$};
  \node[left,font=\scriptsize] at (0,0.7) {$\frac{C_p+C_{GD3}}{C_b+C_X+C_p+C_{GD3}}$};
  \node[above,font=\scriptsize] at (5.4,2.45) {$\frac{C_p+C_{GD3}}{C_X+C_p+C_{GD3}}\ (\sim0.5)$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Charge sharing: } V_b' = \frac{C_b}{C_b+C_{G1}+C_{G2}+C_p}V_{DD}\ \ (\text{aim } \ge 0.9V_{DD}),\qquad C_{Gn} = (WL)_nC_{ox}+2W_nC_{ov}}
$$

$$
\boxed{V_{GS1} = V_P-V_{in} = V_b' - \frac{C_p}{C_b+C_{G1}+C_{G2}+C_p}V_{in}}
$$

$$
\boxed{\omega_z = \frac{1}{C_b(R_{on2}+R_{on3})},\qquad \omega_p\approx\frac{1}{(C_X+C_p)(R_{on2}+R_{on3})},\qquad C_X\approx C_{GS1}+C_{GD1}}
$$

1. **Charge sharing with the gates.** When the precharged $C_b$ is connected, it shares charge with $M_1$'s and $M_2$'s gate capacitance and with $C_p$ at $P$ (the drain of $M_5$, all of $M_3$, the drain of $M_7$). The boost voltage drops below $V_{DD}$.
2. **$V_{GS}$ depends on $V_{in}$ again.** $C_p$ attenuates the input on its way to $P$, so the coefficient of $V_{in}$ in $V_{GS1}$ is not zero. This brings back the static distortion bootstrapping was supposed to remove. It requires $C_b+C_{G1}+C_{G2}+C_p\gg C_p$.
3. **Finite bootstrap-path bandwidth.** $R_{on2}+R_{on3}$ in series with $C_b$ must charge $C_X$. Above $\omega_p$, $P$ no longer follows the input, and up to about half of $V_{in}$ appears on $V_{GS}$. This **dynamic** error is what limits real bootstrapped samplers. Keep $R_{on2}+R_{on3}$ small, until the widened $M_2$, $M_3$ add too much capacitance.

> [!tip] Remark
> Items 1 and 2 are the floating-capacitor divider from [[#The Idea A Battery from Gate to Source|the battery fold]], applied to the real circuit's parasitics. Every bootstrap problem comes down to $C_b$ being too small compared with what hangs on its terminals.

- **$C_b$ is squeezed from both sides.** Too small, and charge sharing wins. Too large, and it costs area, its own bottom-plate parasitic loads $V_{in}$, and $M_5$, $M_4$ can't recharge it within a half-period. Razavi notes that $C_b$ is sized by charge sharing, not by its own $kT/C$.

> [!note]- Derivation: the bootstrap-path transfer function (Razavi Eqs. 3.76–3.80)
> Near the end of tracking, $V_{out}\approx V_{in}$, so $C_{GS1}$ and $C_{GD1}$ merge into $C_X$ (between $V_{in}$ and $P$) and $C_1$ drops out. Neglect $C_{GS2}$, $C_{GD2}$, $C_{GS3}$, so $R_{on2}$ and $R_{on3}$ are in series with $C_b$. KCL at $P$:
> $$\left[V_P(C_p+C_{GD3})s-(V_{in}-V_P)C_Xs\right]\left(R_{on2}+R_{on3}+\frac{1}{C_bs}\right) = V_{in}-V_P$$
> $$\frac{V_P-V_{in}}{V_{in}} = -\frac{(R_{on2}+R_{on3})(C_p+C_{GD3})C_bs+C_p+C_{GD3}}{(R_{on2}+R_{on3})(C_X+C_p+C_{GD3})C_bs+C_p+C_{GD3}+C_X+C_b}$$
> At low frequency, $C_b$ dominates and $V_P\approx V_{in}$. At high frequency, $C_X$ and $C_p+C_{GD3}$ form a divider, and because they are comparable, $V_P$ no longer follows $V_{in}$.

## Level 6: Jitter, Specifications, and Testing

### Aperture Jitter

```tikz title="A sampling edge displaced by Delta T samples the input at the wrong point; the error is the input slope times Delta T, largest at zero crossings. After Razavi (Data Converters) Fig. 3.53."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right]{$t$};
  \draw[thick,domain=0:6,samples=80] plot (\x,{1.4*sin(60*\x)});
  \draw[dashed] (0.5,0) -- (0.5,{1.4*sin(30)});
  \draw[dashed] (0.85,0) -- (0.85,{1.4*sin(51)});
  \draw[<->] (0.5,-0.3) -- (0.85,-0.3);
  \node[below,font=\scriptsize] at (0.68,-0.3) {$\Delta T$};
  \draw (0.5,{1.4*sin(30)}) -- (1.3,{1.4*sin(30)});
  \draw[<->] (1.2,{1.4*sin(30)}) -- (1.2,{1.4*sin(51)});
  \node[anchor=west,font=\scriptsize] at (3.6,1.0) {$\Delta V\approx\Delta T\,\frac{dV_{in}}{dt}$ (arrow)};
  \fill (0.5,{1.4*sin(30)}) circle (0.05);
  \draw (0.85,{1.4*sin(51)}) circle (0.06);
  \node[font=\scriptsize,anchor=west] at (3.6,1.6) {$\bullet$ ideal edge,\ $\circ$ jittered edge};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V\approx\Delta T\,\frac{dV_{in}}{dt},\qquad \mathrm{SNR_{jitter}} = \frac{1}{\sigma_j^2\omega_{in}^2}}
$$

- The SNR depends on $\omega_{in}$ and the rms jitter $\sigma_j$ only, not on the clock rate or the signal amplitude.
- Razavi Ex. 3.25: 60 dB at $f_{in} = 5$ GHz needs $\sigma_j = 1/(10^3\cdot 2\pi\cdot5\times10^9)\approx 32$ fs rms.
- Jitter noise and $kT/C$ add in power. With that jitter, a 0.5 Vpp single-ended input, and 1 pF at 300 K: jitter $\approx 3.1\times10^{-8}$ V², $kT/C\approx 4.1\times10^{-9}$ V², signal $0.03125$ V², so SNR ≈ 59.5 dB.
- Carusone calls it **aperture jitter** or **aperture uncertainty**. Besides clock-generator noise, an input-dependent turn-off instant (finite clock slope, [[#Channel Charge Injection|above]]) is a deterministic version of the same error.

> [!tip] Remark
> This is the only noise source here that scales with signal *slope*, not with resistance or temperature. Clock jitter itself is covered in [[Oscillators]] and [[Link Noise and Jitter]].

> [!note]- Derivation: jitter noise power
> With $V_{in} = V_1\sin\omega_1t$: $\Delta V = \Delta T\,V_1\omega_1\cos\omega_1t$. $\Delta T$ and the cosine are uncorrelated, so the powers multiply: $P_{Vn} = \sigma_j^2\,(V_1\omega_1)^2/2$. Dividing $P_{sig} = V_1^2/2$ by this gives $1/(\sigma_j\omega_1)^2$.

### Performance Parameters

| Parameter | What it is |
|---|---|
| Acquisition time $t_{acq}$ | Time for $\lvert V_{in}-V_{out}\rvert$ to fall below $\Delta V$ (≤ ½ LSB) |
| Pedestal / hold step | Jump at track→hold (charge injection + feedthrough). Should be small and above all **signal-independent** |
| Hold-mode feedthrough | Input coupling to the held value through parasitics while off |
| Tracking bandwidth, slew rate | Small- and large-signal speed in track |
| Droop rate | Drift in hold from leakage or base current. Usually negligible in CMOS |
| Aperture jitter | Random variation of the effective sampling instant |
| HD, THD | $\mathrm{THD} = (A_3^2+A_5^2+\cdots)/A_1^2$, measured on held samples |

### Testing a Sampler

```tikz title="With f_in just below f_CK/2, the odd harmonics land above Nyquist and fold back right next to the fundamental: 3f_in to f_in - 2 Delta f, 5f_in to f_in - 4 Delta f. After Razavi (Data Converters) Fig. 3.52(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right]{$f$};
  \draw[dotted] (6.4,0) -- (6.4,2.6) node[above,font=\scriptsize]{$f_{CK}/2$};
  \draw[thick,->] (6.0,0) -- (6.0,2.3) node[above,font=\scriptsize]{$A_1$};
  \draw[thick,->] (4.6,0) -- (4.6,1.0) node[above,font=\scriptsize]{$A_3$};
  \draw[thick,->] (3.0,0) -- (3.0,0.6) node[above,font=\scriptsize]{$A_5$};
  \node[below,font=\scriptsize] at (6.0,0) {$f_{in}$};
  \node[below,font=\scriptsize] at (4.6,0) {$f_{in}-2\Delta f$};
  \node[below,font=\scriptsize] at (3.0,0) {$f_{in}-4\Delta f$};
  \draw[<->] (6.0,-0.75) -- (6.4,-0.75) node[midway,below,font=\scriptsize]{$\Delta f$};
\end{circuitikz}
\end{document}
```

- **FFT only the held values.** The quantizer only ever reads the held level, so take one point per hold phase. Including the tracking portion gives a spectrum the ADC never sees.
- **Choose an incommensurate $f_{CK}/f_{in}$.** If $f_{CK}/f_{in} = P/Q$, only $Q$ distinct input points are ever sampled. Pick a ratio with a long period so the samples slide across the whole sine. Razavi's example: $5\text{ GHz}/570\text{ MHz} = 500/57$, which gives 500 distinct points.
- **Expect folding.** Any harmonic above $f_{CK}/2$ aliases into the first Nyquist zone. To identify a spur, work out which harmonic order it came from.
- **Beat test (Carusone §11.1).** Clock at full speed with $f_{in} = f_{smpl}+\Delta f$. The output is the input demodulated to $\Delta f$, a low frequency you can measure easily (re-sample a T/H output with a second T/H on the opposite phase). Fit a sine, subtract it, and analyze the residue for rms error and spurs. ADCs are tested the same way.

## Level 7: Design Study: 10-bit, 5 GS/s Bootstrapped Sampler

The following is from Razavi (*Data Converters*) Ch. 4: a differential sampler for a Nyquist ADC front end. Process: 28 nm, SS corner, 75 °C, $V_{DD} = 0.95$ V (1 V − 5%). $T_{CK} = 200$ ps, split half track and half hold. Single-ended input 0.5–0.75 V, which gives LSB ≈ 1 V/1024 ≈ 1 mV differential. All $L = 28$ nm. Target: HD ≈ −65 dB at full scale near 2.5 GHz (ideal SNR is 62 dB).

**Step 1: size $C_1$ and $M_1$ from the spec.**

$$
\boxed{\mathrm{SNR} = \frac{A^2/2}{\Delta^2/12 + 2kT/C_1}\ \ (\text{1 dB penalty} \Rightarrow C_1 = 445\text{ fF}\to 0.5\text{ pF})}
\qquad
\boxed{\frac{A}{\sqrt{1+R_{on1}^2C_1^2\omega_{in}^2}}:\ 0.5\text{ dB} \Rightarrow R_{on}\approx 44.5\ \Omega}
$$

The factor 2 is for differential operation. $R_{on} = 44.5$ Ω at $V_{GS}\approx 0.95$ V gives $W_1\approx 10$ µm.

**Step 2: replace ideal parts one at a time and check HD3 each time** (at 570 MHz and 2.47 GHz):

| Step | Change | HD3 @ 570 MHz | HD3 @ 2.47 GHz | Lesson |
|---|---|---|---|---|
| 1 | Ideal battery, track mode only, $W_1 = 10$ µm | −79 dB | −56 dB | $R_{on1}$ still varies (body effect) |
| 1′ | $W_1 = 20$ µm | | −66 dB | Widen until dynamic HD passes |
| 2 | Track/hold with ideal 50 Ω switches $M_2$, $M_4$ | −83 dB | −64.4 dB | Charge injection: $V_{TH1}$ still follows $V_{in}$ |
| 3 | $M_2$ = PMOS (well to $P$), $M_4$ = NMOS, 2.5 µm | −68 dB | −58 dB | $M_2$ never turns off: $V_P$ reaches 1.5 V |
| 4 | Add $M_3$, $M_6$ to disconnect the battery in hold ($M_3$ gate bootstrapped) | −84 dB | −60 dB | Battery must leave $V_{in}$ in hold |
| 5 | Battery → $C_B = 0.25$ pF, $W_5 = W_6 = 2.5$ µm ($M_5$ gate bootstrapped, well to $P$) | | −63 dB | $C_B$ charges to only 0.895 V, boost < 0.83 V, i.e. ≈20 fF at $X$ |
| 5′ | $C_B = 500$ fF, $W_5 = W_6 = 5$ µm, then $W_4 = 5$ µm | | −63 → −65 dB | Slow $M_4$ pull-down of $X$ was limiting turn-off |
| 6 | Stress fixes: cascode $M_8$ on $M_4$ (both 10 µm); $M_a$, $M_b$, $M_c$ make $M_2$'s gate track $V_{in}$; double $W_c$ | | −64.3 dB (HD5 ≈ 20 dB lower) | Final: ≈ 1 mW |

- **Why build it up step by step?** Each mechanism in this note produces a spur in the same place. Swapping one ideal element for a real one at a time shows which device caused which spur.
- **Device stress:** $M_4$ sees $V_{DS}\approx V_{in}+V_{DD}\approx 1.75$ V when off, and $M_2$ sees the same across gate and source. The cascode limits $M_8$ to about 1.05 V.
- **The final limit is track time.** After bootstrapping, the gate drive chain, and the 10 ps clock edges, the pulse at $X$ is only about 80 ps of the nominal 100 ps.
- **Input current:** $R_{on1}\approx 23$ Ω and a worst-case 0.5 V step between consecutive samples give about 22 mA peak from the buffer.

> [!note]- Detail: why the boosted gate needs a fast pull-down (Razavi §4.6, Prob. 4.9)
> $M_4$ discharges node $X$ (≈20 fF) at a finite slope. $M_1$ turns off when $V_X - V_{in}$ crosses $V_{TH1}(V_{in})$, so the turn-off instant depends on the input. This is the same input-dependent sampling time as with a finite clock fall time, now one level deeper in the circuit. Widening $M_4$ from 2.5 to 5 µm moved HD3 from −63 to −65 dB.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $C_1$ | $kT/C$ noise (4× per bit), charge-injection and feedthrough steps | Speed ($\tau$), driver current $C\omega V$, area |
| ↑ $W$ of the switch | $R_{on}$, settling, $R_{on}$-variation HD (dynamic) | Charge injection, feedthrough, nonlinear $C_{DB}$ (static HD); $\Delta V\cdot\tau$ fixed |
| Shorter $L$ (newer node) | $\Delta V\cdot\tau = L^2/\mu_n$ | Lower supply and headroom, device stress on boosted nodes |
| Complementary switch | Rail-to-rail swing, flat-ish $R_{on}$ | Residual hump in $R_{on}$ (odd HD), unequal injection, input-dependent turn-off |
| Differential | Even HD, offset, SNR ×2 | 2× area/power; common-mode jump remains |
| Dummy switch ($W/2$) | Clock feedthrough | Injection cancels only for a 50/50 split; needs clock skew |
| Bottom-plate timing | Input-independent injection; no slope-dependent sampling time | Extra clock phase; op-amp settling time |
| Bootstrapping | $R_{on}$ and $Q_{ch}$ constant; gate above $V_{DD}$ | 7 devices + $C_b$; stress; body effect remains; bootstrap-path bandwidth |
| ↑ $C_b$ | Charge sharing, $V_{GS}$ attenuation | Area, input parasitic, recharge time |
| ↑ $W_2$, $W_3$ (bootstrap path) | Bootstrap-path bandwidth ($\omega_p$) | Their capacitance adds to $C_X$, $C_p$ |
| Longer track phase | Settling and HD | Less time for the quantizer |
| ↓ $\sigma_j$ | Jitter SNR at high $f_{in}$ | Clock generator power |

## Cheat sheet

| Quantity | Result |
|---|---|
| Nyquist | $f_{in,\max} < f_S/2$ |
| ZOH | $Y = Y_{ideal}\cdot\frac{\sin\pi fT_S}{\pi fT_S}e^{-j\pi fT_S}$ (removed by the quantizer) |
| Acquisition time | $t_{acq} = (N+1)\ln2\cdot R_{on}C_1$; $R_{on}C_1\le\frac{T_{CK}}{2(N+1)\ln2}$ |
| Sampled noise | $\overline{v_n^2} = kT/C_1$ |
| Driver current | $I_{peak} = C_1\omega_{in}V_1$ |
| NMOS / PMOS $R_{on}$ | $\frac{1}{\mu_nC_{ox}\frac WL(V_{DD}-V_{in}-V_{THN})}$, $\frac{1}{\mu_pC_{ox}(\frac WL)_P(V_{in}-\lvert V_{THP}\rvert)}$ |
| RC output | $V_0+\frac{V_1}{\sqrt{1+R_{on}^2C_1^2\omega_1^2}}\cos[\omega_1t-\tan^{-1}(R_{on}C_1\omega_1)]$ |
| HD from $R_{on}(t)$ | $\mathrm{HD_2} = a_1C_1\omega_1/2$, $\mathrm{HD_3} = a_2C_1\omega_1/2$ |
| Complementary switch | flat if $\mu_p(W/L)_P = \mu_n(W/L)_N$; $\mathrm{HD_3} = a_1C_1\omega_1/2$ at $2\omega_1$ |
| Triode caps | $C_{GS} = C_{GD} = WLC_{ox}/2+WC_{ov}$ |
| Clock feedthrough | $\Delta V = -\frac{C_{GD}}{C_{GD}+C_1}V_{DD}$ |
| Charge injection | $\Delta V = \frac{WLC_{ox}(V_{DD}-V_{in}-V_{TH})}{C_1}$ |
| Speed–precision | $\Delta V\cdot\tau = L^2/\mu_n$ |
| Differential | even HD cancel; SNR ×2 |
| Dummy | $W_3 = W_1/2$ |
| Bottom-plate | $q_2 = WLC_{ox}(V_{CK}-V_{TH}-V_X)$, constant |
| x2 S/H | $v_o = (1+C_2/C_1)v_i$, $\beta = \frac{C_1}{C_1+C_2}$ |
| x2 S/H op-amp specs | $A_0>\frac{1}{\epsilon\beta}$; $\mathrm{GBW} > -\frac{\ln[1-(1-\epsilon)(1+A_0\beta)/(A_0\beta)]}{t_s\beta}$ |
| Bootstrapped switch | $V_{GS} = V_b$; $R_{on}$, $Q_{ch}$ constant |
| Boost after sharing | $V_b' = \frac{C_b}{C_b+C_{G1}+C_{G2}+C_p}V_{DD}$ |
| Residual $V_{GS}$ | $V_b' - \frac{C_p}{C_b+C_{G1}+C_{G2}+C_p}V_{in}$ |
| Bootstrap path | $\omega_z = \frac{1}{C_b(R_{on2}+R_{on3})}$, $\omega_p\approx\frac{1}{(C_X+C_p)(R_{on2}+R_{on3})}$ |
| Jitter | $\Delta V\approx\Delta T\,dV_{in}/dt$; $\mathrm{SNR} = 1/(\sigma_j\omega_{in})^2$ |
| Op amp for ½ LSB | $A_0\ge 2^{N+1}/\beta$, $\omega_u\ge\frac{(N+1)\ln2}{\beta t_s}$ |
| Buffer | $R_{out}\ll R_{on}$, $I_{peak}\ge\max(C_s\omega_{in}V_1,\ \Delta V_{step}/R_{on})$ |
| Sampler + ADC SNR | $\frac{A^2/2}{\Delta^2/12+2kT/C_1}$ (differential) |

## References

- **Razavi, *Analysis and Design of Data Converters*** (2025; PDF page = printed + 19)
  - Ch. 3 Sampling Circuits, pp. 20–58 (PDF 39–77): §3.1 sampling concepts (ideal, ZOH, T/H, time constant, Ex. 3.3); §3.2 NMOS switch (Eqs. 3.16–3.24); §3.3 $R_{on}$ distortion (Eqs. 3.26–3.34); §3.4 complementary switches (Eqs. 3.35–3.44); §3.5 MOS caps, clock feedthrough, charge injection, $\Delta V\tau = L^2/\mu_n$, kT/C, buffer (Ex. 3.13–3.14); §3.6 differential; §3.7 dummy switches; §3.8 bootstrapping (Figs. 3.33–3.49, Eqs. 3.63–3.80); §3.9 performance parameters, static/dynamic HD; §3.10 clock jitter (Ex. 3.25–3.26).
  - Ch. 4 Design Study of a Sampling Circuit, pp. 60–68 (PDF 79–87): specs, $C_1$ and $R_{on}$ sizing, simulation issues, incremental design, stress, input current.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §13.2.3 figure of merit $F = \mu_n/L^2$ (Eq. 13.34); §13.2.4 charge-injection cancellation; §13.3, §13.3.1 capacitor bottom plate, unity-gain sampler, bottom-plate sampling (Figs. 13.29–13.35, 13.42).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF = printed + 24): §11.1 S/H performance parameters, beat test (pp. 444–446); §11.2 MOS S/H basics: charge injection, transmission gate, dummy switch, clock-slope timing error, closed-loop S/Hs (pp. 446–451); §11.3 CMOS S/H examples (pp. 452–456); §11.4 bipolar and BiCMOS S/Hs (pp. 456–460). §14.6 charge injection and advanced clocks, $f_{clk}$ bound (pp. 585–588). Translinear sections (§11.5–11.6) skipped as instructed.
- **ECE 636 (Fall 2026) slides:** "Analysis of a Multiply-by-2 (×2) Sample-and-Hold (S/H) Amplifier" (9/10): operation, closed-loop $A_f$, $\beta$, step response, $A_0$ and GBW specifications with examples.
- **Zettelkasten** (`AnalogTheory/S18 Sampling Circuits.md` and `Sampling Circuits/`): used for structure and cross-checks. Extensions taken from it: 18c3/18c3b (bottom-plate parasitic orientation), 18y4 (fast pull-down of the boosted node), 18x2 (80 ps track window as the final limit), 18w2 (body effect under bootstrapping), 18t1 (jitter and $kT/C$ added in power).
