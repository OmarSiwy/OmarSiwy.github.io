---
title: Link Noise and Jitter
description: Where the noise at a link's slicer comes from, how timing noise is defined and split into RJ and DJ, how the dual-Dirac model turns that into TJ(BER) and a timing bathtub, how jitter is budgeted, tracked, tolerated and amplified, and what that asks of the PLL, CDR, driver and sampler.
kind: topic
status: growing
aliases:
  - Link Noise and Jitter
  - Jitter
  - Dual-Dirac
  - RJ and DJ
  - Jitter Tolerance
  - Jitter Transfer
---

Note S3 of the [[SerDes Learning Path]]. [[Signaling and BER]] (S2) worked the **voltage** axis of the eye: Gaussian noise, the $Q$-function, the vertical bathtub and the voltage budget. This note owns the **timing** axis and the noise sources themselves: what disturbs the slicer, how jitter is defined and decomposed, the dual-Dirac model, the timing bathtub, jitter budgets, jitter transfer and tolerance, and how the channel and clock path *amplify* jitter. Phase noise of oscillators belongs to [[Oscillators]] and PLL jitter transfer to [[Phased-Locked Loops]]; here they get one bridge section each.

## The big picture

```tikz title="The chapter on one screen. Left: the crossing-point jitter PDF, modelled as two Gaussians of width sigma (RJ) separated by DJ(dd). Right: the timing bathtub it produces; total jitter TJ(BER) is the eye closure at the target BER. After Palermo L10 slides 19-20 and Agilent dual-Dirac note Figs. 1 and 4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ---- left: dual-Dirac PDF
  \begin{scope}[x=7cm,y=3cm]
    \draw[->] (-0.42,0) -- (0.45,0) node[right] {$t$};
    \draw[thick,blue!70!black,domain=-0.4:0.4,samples=120] plot (\x,{exp(-((\x+0.15)^2)/0.0018)+exp(-((\x-0.15)^2)/0.0018)});
    \draw[dashed,gray] (-0.15,0) -- (-0.15,1.15);
    \draw[dashed,gray] (0.15,0) -- (0.15,1.15);
    \draw[<->] (-0.15,1.12) -- (0.15,1.12) node[midway,above,font=\scriptsize] {$DJ(\delta\delta)$};
    \draw[<->] (0.15,0.6) -- (0.18,0.6) node[right,font=\scriptsize] {$\sigma$ (RJ)};
    \node[font=\scriptsize,align=center] at (0,-0.22) {crossing-point histogram\\$=$ RJ (Gaussian) $*$ DJ (two Diracs)};
  \end{scope}
  % ---- right: timing bathtub
  \begin{scope}[xshift=7.2cm,yshift=3.6cm,x=8cm,y=0.22cm]
    \draw[->] (0,-16.5) -- (1.08,-16.5) node[right,font=\scriptsize] {sampling phase $x$};
    \draw[->] (0,-16.5) -- (0,1.5) node[above,font=\scriptsize] {$\log_{10}\mathrm{BER}$};
    \foreach \d in {0,-4,-8,-12,-16} \draw (0,\d) -- (-0.015,\d) node[left,font=\scriptsize] {$10^{\d}$};
    \draw (0,-16.5) -- (0,-17.2) node[below,font=\scriptsize] {0};
    \draw (1,-16.5) -- (1,-17.2) node[below,font=\scriptsize] {1 UI};
    \draw[thick,blue!70!black] (0,-0.6) -- (0.15,-0.6);
    \draw[thick,blue!70!black,domain=0.15:0.402,samples=60] plot (\x,{-0.602-((\x-0.15)/0.03)^2/4.605});
    \draw[thick,blue!70!black] (1,-0.6) -- (0.85,-0.6);
    \draw[thick,blue!70!black,domain=0.598:0.85,samples=60] plot (\x,{-0.602-((0.85-\x)/0.03)^2/4.605});
    \draw[dashed,red!75!black] (0,-12) -- (1.02,-12);
    \draw[<->,red!75!black,thick] (0.361,-12) -- (0.639,-12) node[midway,below,font=\scriptsize] {opening};
    \draw[|<->|,red!75!black] (0,-14.3) -- (0.361,-14.3) node[midway,below,font=\scriptsize] {$\tfrac12 TJ$};
    \draw[|<->|,red!75!black] (0.639,-14.3) -- (1,-14.3) node[midway,below,font=\scriptsize] {$\tfrac12 TJ$};
    \node[font=\scriptsize,anchor=west] at (1.02,-12) {$10^{-12}$};
    \node[font=\scriptsize,align=center] at (0.5,1.2) {at the crossing: BER $=\rho_T/2$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Every link "noise" is either bounded or Gaussian, and either proportional to the swing or not.** Supply/SSO noise, crosstalk and ISI are bounded and proportional (a bigger swing does not help). Offset is bounded and independent. Thermal noise is Gaussian and independent.
> 2. **Jitter = edge timing error.** Absolute jitter (TIE) is the one a link cares about; period and cycle-to-cycle jitter are first and second differences of it. Voltage noise becomes jitter through the edge slope: $\sigma_t = \sigma_v/\text{slope}$.
> 3. **Jitter splits into RJ and DJ.** RJ is Gaussian, unbounded, quoted as an rms $\sigma$. DJ is bounded, quoted peak-to-peak: periodic (PJ), data-dependent (ISI, DCD) and bounded-uncorrelated (BUJ, mostly crosstalk). The total PDF is their **convolution**.
> 4. **Dual-Dirac: $TJ(\mathrm{BER}) = DJ(\delta\delta) + 2Q_{\mathrm{BER}}\,\sigma$**, with $Q_{\mathrm{BER}} = 7.03$ at $10^{-12}$. Budgets add $DJ(\delta\delta)$ linearly and $\sigma$ in RSS, and need $TJ \le 1$ UI. $DJ(\delta\delta)$ is a model parameter, smaller than the true $DJ_{pp}$.
> 5. **Only jitter the receiver clock does not track costs margin.** The CDR is a low-pass jitter filter, so the sampling error is $(1-H)$ times the input jitter: low-frequency jitter (SSC, wander) is free, high-frequency jitter is not. A lossy channel or slow clock buffer **amplifies** exactly that high-frequency jitter (DCD most of all).

**Map:** [[#Level 0 Noise and Jitter as a Black Box|sources, classes, slope]] → [[#Level 1 The Link Noise Sources|supply, offset, crosstalk, ISI, random]] → [[#Level 2 Jitter Definitions|TIE, period, cycle-to-cycle, N-UI]] → [[#Level 3 RJ and DJ|RJ, PJ, ISI, DCD, BUJ]] → [[#Level 4 Dual-Dirac and the Timing Bathtub|bathtub, dual-Dirac, Q-scale, StatEye]] → [[#Level 5 Jitter Budgets|budgets, PCIe example]] → [[#Level 6 Jitter in Frequency Transfer, Tolerance, Generation|transfer, tolerance, generation, phase noise]] → [[#Level 7 Jitter Amplification by the Channel and Clock Path|jitter amplification]] → [[#What this implies for the circuit blocks|circuit blocks]].

## Level 0: Noise and Jitter as a Black Box

### Where the Noise Comes From

```tikz title="Noise and jitter sources around a link. Every one of them takes margin from the eye at the RX sampler, in voltage or in time. After Palermo L9 slide 3 (from Dally)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  b/.style={draw,thick,minimum height=0.9cm,minimum width=1.5cm,align=center,fill=white},
  s/.style={draw,red!70!black,font=\scriptsize,align=center,fill=red!5}]
  \node[b] (ff1) at (0,0) {D\ Q};
  \node[b] (tx) at (2.6,0) {TX};
  \node[b,minimum width=3cm,fill=green!10] (ch) at (6.2,0) {interconnect};
  \node[b] (rx) at (9.8,0) {RX};
  \node[b] (ff2) at (12.4,0) {D\ Q};
  \draw[->] (ff1) -- (tx); \draw[->] (tx) -- (ch); \draw[->] (ch) -- (rx); \draw[->] (rx) -- (ff2);
  \node[b,minimum width=3cm,fill=red!10] (ps) at (6.2,-2.2) {power system};
  \draw (tx.south) |- (ps.west); \draw (rx.south) |- (ps.east);
  \draw[->] (0,-1.6) node[below] {CLKa} -- (ff1.south);
  \draw[->] (12.4,-1.6) node[below] {CLKb} -- (ff2.south);
  \node[s] at (2.6,1.2) {TX offset, DCD,\\driver jitter};
  \node[s] at (6.2,1.2) {crosstalk, ISI,\\reflections};
  \node[s] at (9.8,1.2) {RX offset,\\thermal noise};
  \node[s] at (0,-2.9) {TX clock jitter\\(PLL, distribution)};
  \node[s] at (12.4,-2.9) {RX clock jitter\\(CDR, PLL, PI)};
  \node[s] at (6.2,-3.4) {supply noise, SSO};
\end{circuitikz}
\end{document}
```

Palermo's list of common link "noise" sources (L9 slide 4): **power-supply noise, receiver offset, crosstalk, inter-symbol interference, random noise**, plus clock jitter. Only the last two are noise in the [[Noise]] sense; the rest are deterministic interference that behaves like noise at the slicer.

### Bounded or Statistical, Proportional or Independent

```tikz title="The two questions to ask of every link noise source. Bounded sources are budgeted at their worst case; Gaussian ones at x sigma for the target BER. Proportional sources cannot be beaten by more swing. After Palermo L9 slides 5-6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw[thick] (0,0) rectangle (10,5);
  \draw[thick] (5,0) -- (5,5); \draw[thick] (0,2.5) -- (10,2.5);
  \node[font=\bfseries] at (2.5,5.4) {bounded (worst case)};
  \node[font=\bfseries] at (7.5,5.4) {statistical (Gaussian, rms)};
  \node[font=\bfseries,rotate=90] at (-0.4,3.75) {proportional};
  \node[font=\bfseries,rotate=90] at (-0.4,1.25) {independent};
  \node[align=center] at (2.5,3.75) {ISI, crosstalk (few aggressors),\\SSO / I/O supply noise\\[2pt]\scriptsize more swing does not help};
  \node[align=center] at (7.5,3.75) {crosstalk from many aggressors\\(tends to Gaussian)};
  \node[align=center] at (2.5,1.25) {RX offset,\\non-I/O supply noise\\[2pt]\scriptsize overpowered by swing};
  \node[align=center] at (7.5,1.25) {thermal and shot noise,\\random clock jitter};
\end{circuitikz}
\end{document}
```

- **Bounded** sources have a predictable worst case. Adding them at their worst is simple but pessimistic (all at once is rare).
- **Statistical** sources are unbounded; they only have a size at a BER ($\approx 7\sigma$ each side at $10^{-12}$).
- **Proportional** sources scale with the signal swing $V_S$; **independent** ones do not. That is the $V_N = K_N V_S + V_{NI}$ model.

> [!tip] Remark
> The budget that adds these up (Palermo's 400 mV example, $V_N = K_NV_S + V_{NI}$, RX sensitivity $V_b$) is in [[Signaling and BER#Link Budget]]. This note says what each term *is*; that one says how they add on the voltage axis. [[#Level 5 Jitter Budgets|Level 5]] does the same on the time axis.

### Voltage Noise Becomes Timing Noise

```tikz title="Amplitude noise on a finite-slope edge moves the threshold crossing: the jitter is the voltage error divided by the slope. Slower edges turn the same noise into more jitter. After Agilent clock-jitter note Fig. 5 and Carusone Eq. (19.56)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right] {$t$};
  \draw[dashed,gray] (0,1.5) -- (6.8,1.5) node[right,font=\scriptsize,text=black] {threshold};
  \draw[thick,blue!70!black] (0.5,0.2) -- (1.5,0.2) -- (3.5,2.8) -- (6.5,2.8);
  \draw[thick,red!70!black,dashed] (0.5,0.6) -- (1.5,0.6) -- (3.5,3.2) -- (6.5,3.2);
  \draw[<->] (5.6,2.8) -- (5.6,3.2) node[midway,right,font=\scriptsize] {$\Delta v$};
  \draw[dotted] (2.5,1.5) -- (2.5,-0.1); \draw[dotted] (2.19,1.5) -- (2.19,-0.1);
  \draw[<->] (2.19,-0.35) -- (2.5,-0.35) node[midway,below,font=\scriptsize] {$\Delta t = \Delta v/\text{slope}$};
  \node[font=\scriptsize,blue!70!black] at (4.6,2.4) {slope $dv/dt$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\sigma_t \approx \frac{\sigma_v}{|dv/dt|_{\text{crossing}}},\qquad \text{sinusoid } A\sin\omega_0 t:\ \ \sigma_t = \frac{\sigma_v}{A\omega_0}}
$$

- Valid while the noise is small compared with the swing ($\sigma_v \ll A$). Carusone Ex. 19.10: $kT/C$ noise of 64.4 µV on a 1 V, 1 MHz sinusoid gives 10.2 ps rms; at 1 GHz the RC-filtered amplitude is 0.157 V and the jitter 0.065 ps.
- "Noise is noise": amplitude noise and jitter are correlated, and a slow edge (a bandwidth-limited receiver, a lossy channel) converts one into the other (Agilent dual-Dirac note §5).

> [!tip] Remark
> This is the same slope argument as [[Sampling Circuits#Aperture Jitter]], run backwards: there, timing error times slope gives voltage error. The thermal noise $\sigma_v$ itself comes from [[Noise#Average Power and rms]].

## Level 1: The Link Noise Sources

### Power-Supply Noise and SSO

Circuits draw switching current through a supply network of finite impedance, so $V_{DD}$ and ground move in time and with location on the die (Palermo L9 slide 8). Two consequences:

- **Delay modulation → DJ on clocks and data.** A velocity-saturated gate has $t_{PHL} \approx \dfrac{C_L V_{DD}}{2W v_{sat}C_{ox}(V_{DD}-V_{TN})}$, so delay depends on $V_{DD}$ (L9 slide 10).
- **Simultaneous switching output (SSO) noise.** $n$ drivers switching together through the package inductance $L$:

$$
\boxed{V_N = L\frac{di}{dt} \approx L\frac{i}{t_r} = n\,\frac{L\,V_s}{Z_0\,t_r}}
$$

SSO grows with the number of outputs switching and with edge rate, and it is **proportional** to the swing (L9 slides 6, 11).

**Rule of thumb (Casper §V-B):** an unregulated CMOS buffer's delay changes about **1 % per 1 % of supply**. With 5 to 10 % on-chip supply noise and 20 ps per buffer, each buffer adds 1 to 2 ps of jitter. If that jitter's spectrum lies inside the clock-recovery bandwidth it is tracked and costs nothing; otherwise it comes straight out of timing margin.

> [!warning] Source erratum (Palermo L9 slide 10)
> The slide writes "Delay $\propto \frac{V_{DD}}{V_{DD}-V_{TN}} \approx\propto V_{DD}$" and "CMOS delay is approximately directly proportional to VDD". That is backwards: $V_{DD}/(V_{DD}-V_{TN})$ **falls** as $V_{DD}$ rises (higher supply, faster gate). Its log-sensitivity is $\partial\ln t/\partial\ln V_{DD} = -V_{TN}/(V_{DD}-V_{TN})$, about $-0.4$ for $V_{TN}/V_{DD} = 0.3$. The magnitude, not the sign, is what makes supply noise into jitter, and Casper's empirical figure for real buffers is about $-1$ (%/%).

> [!note]- Detail: routing the supply (Palermo L9 slide 9, after Hodges)
> A block at the end of a long shared supply rail sees the IR and $L\,di/dt$ drops of every block upstream. Feeding two blocks from separate branches halves the noise one sees at the cost of twice the routing; giving each sensitive block its own supply path (or its own regulator, as for VCOs and clock buffers) isolates them. The same "who shares my return current" question is the signal-return crosstalk below.

> [!tip] Remark
> This is the reason link VCOs and clock buffers are regulated or built from CML with fixed resistor loads (delay set by $RC$, to first order not by $V_{DD}$). The supply rejection of the regulator is an amplifier PSRR spec: [[Single-Stage#Amplifier Specifications]].

### Receiver Offset

The comparator's input-referred offset is set by threshold mismatch (and more weakly by $\beta$ mismatch) of its input pair (Palermo L9 slides 13–14):

$$
\boxed{\sigma(\Delta V_t) = \frac{A_{V_t}}{\sqrt{WL}},\qquad \sigma\!\left(\frac{\Delta\beta}{\beta}\right) = \frac{A_\beta}{\sqrt{WL}}}
$$

- Typical coefficients when the PDK gives none: $A_{V_t}\approx 1$ mV·µm per nm of $t_{ox}$ (90 nm, $t_{ox}=2.8$ nm: $A_{V_t}\approx 2.8$ mV·µm); $A_\beta \approx 2\,\%$·µm.
- **Halving offset costs 4× area** (and the extra capacitance costs power and bandwidth), so links **calibrate** offset instead of sizing it away.
- Offset is **bounded and independent** of swing: it subtracts directly from the half-eye on the voltage axis.

> [!tip] Remark
> Pelgrom's law and where the $\sqrt{WL}$ comes from are in [[Nonlinearity and Mismatch#Where Mismatch Comes From Averaging]]; the input-referred offset of a pair in [[Nonlinearity and Mismatch#Input-Referred Offset]]. Offset-cancellation circuits are [[Nonlinearity and Mismatch#Level 4 Offset Cancellation]] and [[Comparators]].

### Crosstalk

One signal (the aggressor) couples into another (the victim) through on-chip wire capacitance, off-chip coupled lines (package, connector, board), or a shared return path (L9 slide 16). Crosstalk is **proportional**: scaling the swing scales it too. Off-chip NEXT and FEXT are owned by [[Channels#Level 4 Crosstalk]]; the on-chip and return-path forms are here:

| Form | Result | Note |
|---|---|---|
| Floating victim (sample node, dynamic logic) | $V_B = k_c V_A$, $k_c = \dfrac{C_C}{C_C + C_0}$ | Not restored: stays until the node is reset |
| Driven victim | decays with $\tau_{xc} = R_O(C_C + C_0)$ | Peak falls with slower aggressor edges and stronger victim drivers ($1/R_O$) |
| Return-path (shared return impedance $Z_R$) | $V_{xr} = \dfrac{Z_R}{Z_0}V = k_{xr}V$ | Every signal sharing the return sees it |
| Coupled lines (package, connector, board): NEXT, FEXT | owned by [[Channels#Level 4 Crosstalk]] | |

**Crosstalk is also jitter.** An aggressor switching at the same time as the victim changes the victim's effective load: aggressor static $C_L = C_{gnd}+C_C$; switching the same way $C_L = C_{gnd}$; switching the opposite way $C_L = C_{gnd}+2C_C$ (Miller). The victim's delay, and so its edge, then depends on the aggressor's data: deterministic jitter, classed as **BUJ** below (L9 slide 19).

> [!note]- Detail: driven-victim waveform and on-chip mitigation (Palermo L9 slides 18, 20)
> For an ideal aggressor step, $V_B(t) = k_c\,e^{-t/\tau_{xc}}$. With a finite rise time $t_r$:
> $V_B(t) = k_c\frac{\tau_{xc}}{t_r}\left(1-e^{-t/\tau_{xc}}\right)$ for $t<t_r$, and $k_c\frac{\tau_{xc}}{t_r}\left(e^{-(t-t_r)/\tau_{xc}}-e^{-t/\tau_{xc}}\right)$ for $t\ge t_r$. So the peak scales as $\tau_{xc}/t_r$ once $t_r \gg \tau_{xc}$.
>
> Mitigation: route adjacent metal layers perpendicular; limit parallel run length; avoid floating nodes (keepers on dynamic logic); slow the aggressor edges (at the cost of more noise-to-jitter conversion, as in [[#Voltage Noise Becomes Timing Noise|Level 0]]); twist differential pairs periodically so crosstalk becomes common-mode; separate and shield sensitive lines; tie DC lines to the right supply.

### ISI as a Noise Source

Residual ISI from the previous symbols adds a bounded, data-dependent term to every sample. On the voltage axis it is handled by peak-distortion analysis and the statistical eye in [[Signaling and BER#Statistical Eye]] (convolving the two-point PDF of every pulse-response tap). On the time axis the same ISI moves the threshold crossings with the data pattern: that is **ISI jitter** (DDJ), [[#Data-Dependent Jitter ISI, DCD, BUJ|below]].

> [!tip] Remark
> The cursors $y_k$ that set both come from the pulse response in [[Channels#Cursors and the Channel as an FIR Filter]]. Equalization removes ISI, and with it ISI jitter (Palermo L10 slide 15: a 2-tap TX FIR collapses a ±25 ps ISI jitter spread to about ±5 ps).

### Random Noise

Thermal and shot noise of the front end, and the random part of clock jitter, are unbounded and modeled as Gaussian with rms $\sigma$ (L9 slides 39–40). They enter the voltage budget as $2x\sigma$ ($x = 7.03$ at $10^{-12}$; [[Signaling and BER#One Slicer and One Gaussian]]) and the timing budget as RJ ([[#Random Jitter RJ|Level 3]]).

## Level 2: Jitter Definitions

**Jitter** is the short-term variation of a signal's significant instants (its threshold crossings) from their ideal positions in time. Variations slower than 10 Hz are called **wander** and are usually ignored in serial data, since the receiver recovers its clock from the data (Agilent clock-jitter note p. 3, NIST definition).

```tikz title="Absolute (accumulated) jitter J_AC, period jitter J_PER and cycle-to-cycle jitter J_CC on a 1 ns clock. The numbers are Palermo's example. After Palermo L10 slide 7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=3cm]
  % ideal clock
  \foreach \k in {0,1,2,3,4} {
    \draw[thick,gray] (\k,0) -- (\k,0.8) -- (\k+0.5,0.8) -- (\k+0.5,0) -- (\k+1,0);
    \node[below,font=\scriptsize] at (\k,0) {$\k$ ns};
  }
  \node[left] at (-0.1,0.4) {ideal};
  % jittered clock edges
  \def\ea{-0.01} \def\eb{0.93} \def\ec{1.95} \def\ed{2.89} \def\ee{4.01}
  \foreach \e/\f in {-0.01/0.93,0.93/1.95,1.95/2.89,2.89/4.01} {
    \draw[thick,blue!70!black] (\e,1.6) -- (\e,2.4) -- ({(\e+\f)/2},2.4) -- ({(\e+\f)/2},1.6) -- (\f,1.6);
  }
  \draw[thick,blue!70!black] (4.01,1.6) -- (4.01,2.4) -- (4.3,2.4);
  \node[left] at (-0.1,2) {clock};
  \foreach \e/\k/\v in {0.93/1/-0.07,1.95/2/-0.05,2.89/3/-0.11,4.01/4/+0.01} {
    \draw[dotted] (\e,1.6) -- (\e,0.8);
    \node[font=\scriptsize,above,blue!70!black] at (\e,2.4) {\e};
    \node[font=\scriptsize,red!70!black,fill=white,inner sep=1pt] at (\e,1.2) {$J_{AC}\!=\!\v$};
  }
  \node[font=\scriptsize,above,blue!70!black] at (-0.01,2.4) {$-0.01$};
  \foreach \a/\b/\v in {-0.01/0.93/-0.06,0.93/1.95/+0.02,1.95/2.89/-0.06,2.89/4.01/+0.12} {
    \draw[<->] (\a,3.05) -- (\b,3.05) node[midway,above,font=\scriptsize] {$J_{PER}=\v$};
  }
\end{circuitikz}
\end{document}
```

With $t_k$ the measured crossing times and $T$ the ideal period:

$$
\boxed{\tau_k = t_k - kT\ \ \text{(absolute, TIE)},\qquad J_{PER,k} = \tau_{k+1}-\tau_k,\qquad J_{CC,k} = J_{PER,k+1}-J_{PER,k} = \tau_{k+2}-2\tau_{k+1}+\tau_k}
$$

| Measure | Also called | What it is | Matters for |
|---|---|---|---|
| **Absolute** $\tau_k$ | TIE, phase jitter, accumulated ($J_{AC}$), long-term, cumulative | Edge vs an ideal clock | **High-speed links**: the sampler compares data edges with the recovered clock (Palermo L10 slide 5) |
| **Period** $J_{PER}$ | cycle jitter, 1-cycle jitter | First difference of $\tau_k$: a $(z-1)$ filter | Digital cycle-time budgets |
| **Cycle-to-cycle** $J_{CC}$ | | Second difference: $(z-1)^2$ | Digital timing; easy to measure, no reference needed |
| **$N$-UI** / $P$-cycle | | $\tau_{k+N}-\tau_k$ | Accumulation vs time; shows where a PLL/CDR stops it (Casper Fig. 9) |
| **Differential** | | $\tau_{a,i}-\tau_{b,i+M}$ between two signals | Forwarded-clock matching, additive jitter of one buffer |

Palermo's example (L10 slide 7), edges at $-0.01, 0.93, 1.95, 2.89, 4.01$ ns vs ideal $0,1,2,3,4$:

| | $n=1$ | 2 | 3 | 4 | mean | rms | pp |
|---|---|---|---|---|---|---|---|
| $J_{PER}$ (ns) | −0.06 | 0.02 | −0.06 | 0.12 | 0.005 | 0.085 | 0.18 |
| $J_{CC}$ (ns) | 0.08 | −0.08 | 0.18 | – | 0.06 | 0.131 | 0.26 |
| $J_{AC}$ (ns) | −0.07 | −0.05 | −0.11 | 0.01 | −0.055 | 0.05 | 0.12 |

(The rms column is the sample standard deviation about the mean, with $n-1$ in the denominator.)

Which statistic to quote (Palermo L10 slide 6):
- **Mean** is a fixed skew. It is usually calibrated out.
- **rms** describes the random part.
- **Peak-to-peak** includes bounded and unbounded parts, so it **must be quoted at a BER** (or with a sample count). A pp number on a datasheet without that is not well defined (Agilent clock note p. 25).

> [!note]- Detail: Casper's unified definitions, in UI
> Casper and O'Mahony (Table I) write everything in terms of the duration $\mu_i$ of each UI (for a clock, each half cycle), so one set of definitions serves clock and data:
> - Jitter sequence (absolute): $\sum_1^k \mu_i$ relative to ideal
> - **Duty-cycle error**: $\left|\dfrac{\bar\mu_{even}-\bar\mu_{odd}}{2\bar\mu}\right|$
> - UI jitter: $\mu_i - \bar\mu$; UI-UI jitter: $\mu_{i+1}-\mu_i$
> - Period (2-UI) jitter: $\mu_{2i-1}+\mu_{2i}-2\bar\mu$
> - $N$-UI jitter: $\sum_{k}^{k+N-1}(\mu_i - \bar\mu)$
> - Differential jitter: $\mu_{a_i}-\mu_{b_{i+M}}$
>
> UI jitter is the metric most links are designed and specified with, for historical and measurement reasons.

## Level 3: RJ and DJ

```tikz title="The jitter family tree with the PDF shape of each member. RJ is unbounded; everything under DJ is bounded. After Palermo L10 slide 9 (from Hall) and Agilent clock-jitter note Fig. 12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  n/.style={draw,thick,fill=white,align=center,minimum width=2.1cm,minimum height=0.8cm}]
  \node[n,fill=black!80,text=white] (tj) at (6,6) {Total jitter TJ};
  \node[n] (rj) at (2,4.4) {Random RJ\\\scriptsize Gaussian, $\sigma$};
  \node[n] (dj) at (9,4.4) {Deterministic DJ\\\scriptsize bounded, pp};
  \node[n] (pj) at (6,2.6) {Periodic PJ / SJ};
  \node[n] (ddj) at (11.2,2.6) {Data-dependent DDJ};
  \node[n] (isi) at (9.3,0.8) {ISI};
  \node[n] (dcd) at (12.9,0.8) {DCD};
  \node[n] (buj) at (15.4,2.6) {BUJ\\\scriptsize (crosstalk)};
  \draw[->] (tj) -- (rj); \draw[->] (tj) -- (dj);
  \draw[->] (dj) -- (pj); \draw[->] (dj) -- (ddj); \draw[->] (dj) -- (buj);
  \draw[->] (ddj) -- (isi); \draw[->] (ddj) -- (dcd);
  % mini PDFs
  \begin{scope}[shift={(2,2.6)},x=1cm,y=1cm]
    \draw (-1,0) -- (1,0); \draw[thick,blue!70!black,domain=-1:1,samples=40] plot (\x,{0.9*exp(-(\x*\x)/0.08)});
    \node[font=\scriptsize] at (0,-0.3) {thermal, shot, flicker};
  \end{scope}
  \begin{scope}[shift={(6,0.8)},x=1cm,y=1cm]
    \draw (-1,0) -- (1,0); \draw[thick,blue!70!black,domain=-0.85:0.85,samples=40] plot (\x,{0.15/sqrt(0.81-\x*\x)});
    \draw[thick,blue!70!black] (-0.85,0) -- (-0.85,0.9); \draw[thick,blue!70!black] (0.85,0) -- (0.85,0.9);
    \node[font=\scriptsize] at (0,-0.3) {SSC, ref feedthrough};
  \end{scope}
  \begin{scope}[shift={(9.3,-1.0)},x=1cm,y=1cm]
    \draw (-1,0) -- (1,0);
    \foreach \p/\h in {-0.7/0.3,-0.45/0.5,-0.2/0.4,0/0.8,0.15/0.45,0.4/0.6,0.65/0.25} \draw[thick,blue!70!black] (\p,0) -- (\p,\h);
    \node[font=\scriptsize] at (0,-0.3) {channel loss, reflections};
  \end{scope}
  \begin{scope}[shift={(12.9,-1.0)},x=1cm,y=1cm]
    \draw (-1,0) -- (1,0); \draw[thick,blue!70!black] (-0.3,0) -- (-0.3,0.8); \draw[thick,blue!70!black] (0.3,0) -- (0.3,0.8);
    \node[font=\scriptsize] at (0,-0.3) {clock duty cycle, $t_r\ne t_f$};
  \end{scope}
  \begin{scope}[shift={(15.4,0.8)},x=1cm,y=1cm]
    \draw (-1,0) -- (1,0); \draw[thick,blue!70!black] (-0.7,0) -- (-0.7,0.5) -- (0.7,0.5) -- (0.7,0);
    \node[font=\scriptsize] at (0,-0.3) {aggressor data};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Component | Bounded? | PDF | Typical cause |
|---|---|---|---|
| **RJ** | No | $\dfrac{1}{\sqrt{2\pi}\sigma_{RJ}}e^{-t^2/2\sigma_{RJ}^2}$ | Device noise: thermal, shot, flicker (oscillators, buffers, sampler) |
| **PJ / SJ** | Yes | $\dfrac{1}{\pi\sqrt{A^2-t^2}}$ for $|t|<A$ | Spread-spectrum clocking, PLL reference feedthrough, EMI pickup |
| **ISI** (DDJ) | Yes | Discrete, pattern-dependent | Channel loss, dispersion, reflections |
| **DCD** (DDJ) | Yes | $\tfrac12\left[\delta\!\left(t-\tfrac{\alpha_{DCD}}2\right)+\delta\!\left(t+\tfrac{\alpha_{DCD}}2\right)\right]$ | TX serializer clock duty error, rise/fall delay mismatch |
| **BUJ** | Yes | Shape varies | Crosstalk: correlated with the *aggressor*, not the victim's data |

Palermo L10 slides 10–16; Agilent clock-jitter note pp. 6–9.

### Random Jitter RJ

RJ is the sum of very many small independent processes, so by the central-limit theorem it is Gaussian, zero-mean, and fully described by $\sigma_{RJ}$. Because it is **unbounded**, its peak-to-peak value grows the longer you measure; only $\sigma$ is a well-defined number (Agilent clock note p. 7).

> [!note]- Detail: is RJ really Gaussian? (Agilent dual-Dirac note §5.1)
> The Gaussian-RJ assumption rests on thermal noise. The debate is that thermal processes usually account for only 1 or 2 ps rms, while measured RJ is often 3 or 4 ps. The central-limit theorem also lets many small DJ sources convolve into something that looks Gaussian near its centre but is truncated: it can be mistaken for RJ. The other model assumption, that jitter is stationary, is almost impossible to verify, since every instrument samples the data rather than watching a continuous stream.

### Deterministic Jitter DJ

DJ is bounded: if you knew everything about the system you could predict each edge. It has a true peak-to-peak value, $DJ_{pp}$.

#### Periodic Jitter PJ

Jitter that repeats at fixed frequencies: $SJ(t) = \sum_i A_i\cos(\omega_i t+\theta_i)$. A single tone of amplitude $A$ (so $2A$ peak-to-peak) gives the "bathtub-shaped" arcsine PDF with peaks at $\pm A$, because a sinusoid spends most of its time near its extremes. Sources: **spread-spectrum clocking (SSC)**, PLL reference feedthrough (spurs), EMI.

> [!tip] Remark
> SSC is low-frequency PJ on purpose: a 2.5 Gb/s signal with 33 kHz triangle modulation has a smeared crossing on a scope, but the receiver's clock recovery tracks it and the eye is open (Agilent clock note Fig. 36). Whether PJ hurts depends on its frequency relative to the CDR bandwidth: [[#Level 6 Jitter in Frequency Transfer, Tolerance, Generation|Level 6]].

#### Data-Dependent Jitter: ISI, DCD, BUJ

- **ISI jitter:** the crossing time depends on the preceding bits, because a long run charges the channel further and the next edge starts from a different level. Equalization removes it (Palermo L10 slide 15).
- **DCD:** the high and low bits have different widths, from a serializer clock with duty-cycle error or unequal rise and fall delays after serialization. The PDF is two Diracs $\alpha_{DCD}$ apart.
- **Even-odd jitter (EOJ):** the same thing seen at the half-rate (F/2) clock of a half-rate transmitter. Measured with the JP03B pattern; Zhang's example gives 0.78 ps, 2.18 % UI (Zhang slides 79–80; patterns in [[Signaling and BER#PRBS Patterns]]).
- **BUJ:** bounded but not aligned with the victim's data, mostly crosstalk. Strictly, crosstalk is *amplitude* noise that moves the crossing; it causes errors the same way jitter does, which is why jitter instruments cannot cleanly separate it (Agilent dual-Dirac note §5.1).

> [!important] DDJ = DCD ∗ ISI
> DCD and ISI are correlated: a signal with DCD has even harmonics that a clean NRZ signal does not, so the channel filters it differently and produces different ISI. Change one and the other changes (Agilent clock note p. 11). This is the first hint of [[#Level 7 Jitter Amplification by the Channel and Clock Path|jitter amplification]].

### Total Jitter Is a Convolution

Independent jitter components add as random variables, so their PDFs **convolve** (Palermo L10 slide 17):

$$
\boxed{PDF_{TJ} = PDF_{RJ} * PDF_{DJ},\qquad PDF_{DJ} = PDF_{SJ}*PDF_{DCD}*PDF_{ISI}*PDF_{BUJ}}
$$

The Gaussian smooths the sharp DJ edges and **pulls them inward**, and gives the total its Gaussian tails. That is why the dual-Dirac fit below lands *inside* the true DJ edges.

Which block makes which jitter (Agilent clock note Fig. 13):

| Block | Jitter it generates |
|---|---|
| Reference clock | RJ (oscillator thermal noise), PJ (spurs), DCD (oscillator nonlinearity) |
| TX (PLL + serializer + driver) | RJ (thermal), ISI (internal lines, driver bandwidth), PJ (EMI pickup); plus DCD from the serializer clock (Palermo L10 slide 14) |
| Channel | ISI; DDJ when the incoming signal has DCD. Being passive, negligible RJ |
| RX | RJ (shot/thermal), DDJ from internal circuits |
| Neighbouring circuits (EMI) | PJ, BUJ |

## Level 4: Dual-Dirac and the Timing Bathtub

### The Timing Bathtub

Sweep the sampling phase $x$ across the eye and measure BER: the **timing bathtub** (BERT scan). Near a crossing an error needs (a) a transition, probability $\rho_T$ (the transition density, $\tfrac12$ for random data), and (b) the edge to land on the far side of $x$:

$$
\boxed{\mathrm{BER}_L(x) = \rho_T\!\int_x^{\infty}\! J(x')\,dx',\quad \mathrm{BER}_R(x) = \rho_T\!\int_{-\infty}^{x}\! J(x'-T_B)\,dx',\quad TJ(\mathrm{BER}) = T_B - \big[x_R(\mathrm{BER}) - x_L(\mathrm{BER})\big]}
$$

where $J$ is the crossing-point jitter PDF and $x_{L,R}$ are where each wall crosses the target BER (Agilent dual-Dirac note Eqs. 9–12). **TJ is the eye closure at that BER**; the opening is what is left for the sampler's setup/hold and the CDR's phase error.

> [!warning] Source erratum (Agilent, "Using Clock Jitter Analysis to Reduce BER in Serial Data Applications", p. 8)
> The text says BER$(x)$ near the crossing points is large, "peaking at $1/\rho^2$ where $\rho$ is the signal transition density". That is impossible: $\rho_T \le 1$ makes $1/\rho^2 \ge 1$, and a BER cannot exceed 1. Sampling exactly at the mean crossing, a transition occurs with probability $\rho_T$ and then lands on either side with probability $\tfrac12$, so the bathtub peaks at $\boxed{\mathrm{BER}_{crossing} = \rho_T/2}$, which is $\tfrac14$ for random data. (The same $\tfrac14$ appears at a level on the voltage bathtub, [[Signaling and BER#Bathtub Curves]].)

> [!tip] Remark
> The vertical (voltage) bathtub and the $Q$-function are owned by [[Signaling and BER#Bathtub Curves]]. The timing bathtub is the same Gaussian-tail picture with time on the x-axis and $\rho_T$ in front.

### The Dual-Dirac Model

The true DJ shape is unknown and cannot be deconvolved from the measurement. The dual-Dirac model replaces it with the simplest bounded shape that reproduces the **tails** (Agilent dual-Dirac note Table 1):

1. Jitter separates into RJ and DJ.
2. RJ is Gaussian with one parameter $\sigma$.
3. DJ is bounded,
4. and is modeled as **two Diracs** separated by $DJ(\delta\delta) = |\mu_R-\mu_L|$.
5. Jitter is stationary.

$$
\boxed{J(x) = \frac{1}{2\sqrt{2\pi}\,\sigma}\left[e^{-\frac{(x-\mu_L)^2}{2\sigma^2}} + e^{-\frac{(x-\mu_R)^2}{2\sigma^2}}\right],\qquad TJ(\mathrm{BER}) \cong DJ(\delta\delta) + 2\,Q_{\mathrm{BER}}\,\sigma}
$$

| BER | $10^{-6}$ | $10^{-9}$ | $10^{-10}$ | $10^{-11}$ | $10^{-12}$ | $10^{-13}$ | $10^{-14}$ | $10^{-15}$ |
|---|---|---|---|---|---|---|---|---|
| $Q_{\mathrm{BER}}$ | 4.75 | 6.00 | 6.36 | 6.71 | **7.03** | 7.35 | 7.65 | 7.94 |
| $2Q_{\mathrm{BER}}$ (Hall's $Q_{BER}$) | 9.51 | 12.00 | 12.72 | 13.41 | **14.07** | 14.70 | 15.30 | 15.88 |

The Agilent table rounds these to 6.4, 6.7, 7.0, 7.3, 7.6 for $10^{-10}$ to $10^{-14}$; Hall (Palermo L10 slide 25) tabulates the two-sided $2Q$ directly and writes $UI \ge DJ_{\delta\delta} + Q_{BER}\sigma$ with $Q_{BER} = 14.069$ at $10^{-12}$. Same thing, different factor of 2 in the name: **always check which convention a spec uses.**

Read it as: **DJ closes the eye by a fixed amount; RJ closes it by an amount that grows with how low a BER you ask for** (about $14\sigma$ at $10^{-12}$).

> [!note]- Derivation: TJ from the dual-Dirac PDF, and where the factors of 2 and $\rho_T$ go
> Far from the crossing only the near Gaussian matters. For the left wall with $x>\mu_L$, from the bathtub definition:
> $\mathrm{BER}_L(x) \approx \rho_T\cdot\tfrac12\,Q\!\left(\frac{x-\mu_L}{\sigma}\right)$ (the $\tfrac12$ is that Dirac's weight). Setting $\mathrm{BER}_L(x_L) = \mathrm{BER}$ gives $x_L = \mu_L + Q^{-1}\!\left(\tfrac{2\,\mathrm{BER}}{\rho_T}\right)\sigma$, and symmetrically for $x_R$. Then $TJ = T_B - (x_R - x_L) = DJ(\delta\delta) + 2Q^{-1}(\cdot)\,\sigma$.
>
> The industry convention (Agilent Eq. 17) defines $Q(\mathrm{BER}) = \sqrt2\,\mathrm{erf}^{-1}\!\left(1-\frac{\mathrm{BER}}{\rho_T}\right) = Q^{-1}\!\left(\frac{\mathrm{BER}}{2\rho_T}\right)$, which for $\rho_T=\tfrac12$ is exactly $Q^{-1}(\mathrm{BER})$: 7.03 at $10^{-12}$. Keeping the Dirac weight and $\rho_T = \tfrac12$ literally would give $Q^{-1}(4\,\mathrm{BER}) \approx 6.84$ instead. The difference is about $0.2$ in $Q$, $0.4\sigma$ in TJ: small, and on the optimistic side, so the convention is the one budgets use. Palermo L10 slide 20 writes $\mathrm{BER}_{lead} = 0.5\left[\mathrm{erfc}\frac{t-DJ/2}{\sqrt2\sigma}+\mathrm{erfc}\frac{t+DJ/2}{\sqrt2\sigma}\right]$, which drops both the Dirac weights and $\rho_T$; it has the right shape and walls but sits a factor of 4 high in BER.
>
> Also in the Agilent dual-Dirac note: Eq. (16) prints $\mathrm{BER}_L(Q) = \rho_T\,\mathrm{erf}(Q/\sqrt2)$ in its first line, which should be $\mathrm{erfc}$ (its second line, $\rho_T[1-\mathrm{erf}(Q/\sqrt2)]$, is the corrected form), and Eq. (15) defines $\mathrm{erfc}$ with a $1/\sqrt{2\pi}\sigma$ Gaussian prefactor instead of $2/\sqrt\pi$. Neither changes Eq. (17) or the $Q_{\mathrm{BER}}$ table.

### The Q-Scale, and Why DJ(δδ) < DJpp

Replace $\log\mathrm{BER}$ on the bathtub's vertical axis by $Q(x) = \sqrt2\,\mathrm{erf}^{-1}\!\left(1-\mathrm{BER}(x)/\rho_T\right)$. A Gaussian tail becomes a **straight line of slope $1/\sigma$**, so the model can be read with a ruler (Agilent dual-Dirac note §3.1; Palermo L10 slide 21):

```tikz title="Q-scale bathtub, left wall. The real curve (solid) becomes a straight line of slope 1/sigma in its tail; extrapolating that line to Q = 0 gives mu_L, which sits inside the true DJ edge. Hence DJ(dd) < DJ(pp). After Agilent dual-Dirac note Fig. 6(a) and Palermo L10 slide 21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=11cm,y=-0.7cm]
  \draw[->] (0,0) -- (1.05,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,8.2) node[below] {$Q(x)$};
  \foreach \q in {1,...,7} \draw (0,\q) -- (-0.01,\q) node[left,font=\scriptsize] {\q};
  \node[left,font=\scriptsize] at (-0.01,0) {0};
  % dual-Dirac asymptotes
  \draw[dashed,red!70!black,thick] (0.16,0) -- (0.405,7);
  \draw[dashed,red!70!black,thick] (0.84,0) -- (0.595,7);
  % real curves
  \draw[thick,blue!70!black] (0.02,0.15) .. controls (0.10,0.6) and (0.16,1.4) .. (0.23,2.6) -- (0.405,7);
  \draw[thick,blue!70!black] (0.98,0.15) .. controls (0.90,0.6) and (0.84,1.4) .. (0.77,2.6) -- (0.595,7);
  \draw[dotted] (0.10,0) -- (0.10,-0.9) node[above,font=\scriptsize] {$DJ_L$};
  \draw[dotted] (0.16,0) -- (0.16,-0.9) node[above,font=\scriptsize] {$\mu_L$};
  \draw[dotted] (0.90,0) -- (0.90,-0.9) node[above,font=\scriptsize] {$DJ_R$};
  \draw[dotted] (0.84,0) -- (0.84,-0.9) node[above,font=\scriptsize] {$\mu_R$};
  \node[font=\scriptsize,red!70!black,anchor=west] at (0.30,3.6) {slope $1/\sigma$};
  \draw[dashed,gray] (0,7) -- (1,7);
  \draw[<->,thick] (0.405,7.6) -- (0.595,7.6) node[midway,below,font=\scriptsize] {opening at $10^{-12}$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.70,5.3) {fit only where the tail is straight\\($Q>5$); fitting at $2<Q<4$\\overestimates $\sigma$};
\end{circuitikz}
\end{document}
```

- $\sigma$ is the inverse slope of the straight tails; $\mu_L$, $\mu_R$ are where those lines hit $Q=0$; $DJ(\delta\delta) = |\mu_R - \mu_L|$.
- The convolution pulls DJ edges inward, so **$DJ(\delta\delta) < DJ_{pp}$** always (equal only for pure DCD-like two-point DJ). They are different quantities. Substituting $DJ_{pp}$ for $DJ(\delta\delta)$ in the TJ formula overestimates TJ (Agilent dual-Dirac note §3).
- When standards say "DJ" they mean $DJ(\delta\delta)$: it is well-defined and measurable. $DJ_{pp}$ is measurable only in special cases (pure DDJ on a repeating pattern).
- Palermo's example (L10 slide 21): $DJ_{\delta\delta} = 57.2$ ps against $DJ_{pp} = 62$ ps, and the dual-Dirac fit tracks the measured PDF tail down to $10^{-21}$ (slide 22).

> [!note]- Detail: measuring RJ and DJ, and the traps (Agilent dual-Dirac note §§2, 4)
> - **A direct TJ(BER) measurement needs a BERT and about $10/\mathrm{BER}$ bits**: TJ$(10^{-12})$ takes about 70 minutes. Scopes capture around $10^6$ bits, so dual-Dirac on a scope is an extrapolation of six or more decades.
> - **Fitting techniques** fit Gaussians to the left and right tails (of $J(x)$ or BER$(x)$), get $\sigma_L$, $\sigma_R$, $\mu_L$, $\mu_R$, and average $\sigma = \tfrac12(\sigma_L+\sigma_R)$. If the fit region is too close to the DJ region ($2<Q<4$) the slope is too shallow, $\sigma$ is overestimated, and the eye can look closed at $10^{-12}$ when it is not. Repeat the fit at growing sample sizes: $\sigma$ and $DJ(\delta\delta)$ should converge. Convergence is necessary, not sufficient.
> - In a simulated backplane (ISI-dominated, PRBS7 at 2.5 Gb/s) a fitting technique overestimated RJ by about 5 % and TJ$(10^{-12})$ by up to about 4 %, depending on $\sigma/DJ_{pp}$ (Agilent Fig. 8).
> - **Independent-$\sigma$ techniques** measure $\sigma$ from the timing-noise spectrum after removing pattern-correlated jitter, then fit only $\mu_{L,R}$. They fail if DDJ is mistaken for RJ.
> - Both errors push the same way: $\sigma$ has more leverage on TJ than $DJ(\delta\delta)$ does (it is multiplied by 14), so a slightly high $\sigma$ gives a substantially high TJ.

### Example: How Far Can the BER Go?

Palermo L10 slide 18 (from Hall): UI = 1875 ps, $DJ = 1000$ ps, $\sigma_{RJ} = 50$ ps.
- At $10^{-12}$: $TJ = 1000 + 14.07\times50 \approx 1700$ ps, leaving an opening of about 170 ps (the slide reads "≈ 1675 ps and ≈ 200 ps" off its plot).
- The two walls meet in the middle when $2Q\sigma = 1875-1000$, i.e. $Q = 8.75$: the link reaches about $10^{-18}$ before it becomes jitter-limited (the bathtub floor).

### The Statistical Eye with Jitter

[[Signaling and BER#Statistical Eye]] builds the voltage PDF at each sampling phase by convolving the ISI tap PDFs and the noise. **StatEye-style tools add timing the same way**: the sampling instant itself is random with the jitter PDF, so the voltage PDF at nominal phase $t$ is the phase-weighted average

$$
\boxed{p(v;\,t) = \int p_{\text{ISI+noise}}(v;\,t+\tau)\;PDF_J(\tau)\,d\tau}
$$

and the BER contours of $p(v;t)$ over $(t, v)$ give the 2-D statistical BER eye: its vertical opening at a target BER is the eye height, its horizontal opening the eye width (Palermo 2011 p. 300, Fig. 9.14; Palermo L9 slide 37). These tools combine **deterministic** sources (ISI, bounded supply noise and jitter), **random** sources (Gaussian noise and jitter) and the receiver's **aperture** (Palermo 2011 p. 300).

> [!note]- Detail: what the integral assumes
> It treats the sampling-time error $\tau$ as independent of the data pattern and the voltage noise. Data-dependent jitter that is correlated with the ISI (the same channel causes both) is already inside $p_{\text{ISI}}(v;t)$ when the pulse response is evaluated at every phase; only the clock's own RJ and PJ should go into $PDF_J$, or ISI gets counted twice. Measured eyes and on-die eye monitors sweep the same $(t,v)$ plane: Casper Figs. 20–21.

## Level 5: Jitter Budgets

### Combining Components

For uncorrelated elements (Palermo L10 slide 23; Agilent dual-Dirac note Eq. 3):

$$
\boxed{\sigma_{sys} = \sqrt{\textstyle\sum_i \sigma_i^2},\qquad DJ_{\delta\delta}(sys) \approx \textstyle\sum_i DJ_{\delta\delta}(i),\qquad UI \ \ge\ DJ_{\delta\delta}(sys) + 2Q_{\mathrm{BER}}\,\sigma_{sys}}
$$

- **RJ adds in RSS** because the convolution of Gaussians is a Gaussian with the RSS width. Exact.
- **DJ adds linearly**, an approximation. True peak-to-peak DJs of uncorrelated sources add exactly; but DJ sources in a link are often correlated (a TX with ISI drives a channel that makes more ISI), so $DJ_{pp}(total) \le \sum DJ_{pp}$, and the sum of $DJ(\delta\delta)$ usually **overestimates** the total because convolving many DJ sources rounds the edges. The linear sum is the conservative interoperability rule; a measurement of DDJ per bit tells you how the DJs actually interfere.
- **Never add TJs linearly.** That adds every element's $14\sigma$ of RJ at full strength, as if their worst cases coincided.

### Worked Example: PCI Express 2.5 Gb/s at $10^{-12}$

```tikz title="PCIe jitter model: the reference clock drives TX and RX PLLs; the CDR sees TX jitter, channel ISI and crosstalk, and RX jitter, each filtered by its transfer function. After Palermo L10 slide 24 (from Hall)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  b/.style={draw,thick,minimum height=0.8cm,minimum width=1.4cm,align=center,fill=white}]
  \node[b] (ref) at (0,0) {ref.\\clock};
  \node[b] (htx) at (3,1.4) {$h_{Tx}$};
  \node[b] (hrx) at (3,-1.4) {$h_{Rx}$};
  \node[draw,circle,inner sep=1pt] (stx) at (4.6,1.4) {$+$};
  \node[draw,circle,inner sep=1pt] (srx) at (4.6,-1.4) {$+$};
  \node[draw,circle,inner sep=1pt] (sch) at (6.2,1.4) {$+$};
  \node[draw,circle,inner sep=1pt] (diff) at (7.8,0) {$-$};
  \node[b] (hcdr) at (9.6,0) {$h_{CDR}$};
  \draw[->] (ref.east) -- ++(0.5,0) node[above,font=\scriptsize] {$TJ_{refclk}$} |- (htx.west);
  \draw[->] (ref.east) -- ++(0.5,0) |- (hrx.west);
  \draw[->] (htx) -- (stx); \draw[->] (hrx) -- (srx);
  \draw[->] (4.6,2.4) node[above,font=\scriptsize] {$TJ_{Txgen}$} -- (stx);
  \draw[->] (4.6,-2.4) node[below,font=\scriptsize] {$TJ_{Rxgen}$} -- (srx);
  \draw[->] (stx) -- (sch);
  \draw[->] (6.2,2.4) node[above,font=\scriptsize] {$TJ_{ISI+xtalk}$} -- (sch);
  \draw[->] (sch) -| (diff);
  \draw[->] (srx) -| (diff);
  \draw[->] (diff) -- (hcdr);
  \draw[->] (hcdr) -- ++(1.5,0) node[right,font=\scriptsize] {$TJ_{system}$};
\end{circuitikz}
\end{document}
```

Hall's Table 13-2 (Palermo L10 slide 25), each row $TJ = DJ_{\delta\delta} + 14.069\,\sigma$:

| Component | $\sigma_{RJ}$ (ps) | $DJ_{\delta\delta}$ (ps) | $TJ$ (ps) |
|---|---|---|---|
| Reference clock | 4.7 | 41.9 | 108 |
| Transmitter | 2.8 | 60.6 | 100 |
| Channel | 0 | 90 | 90 |
| Receiver | 2.8 | 120.6 | **160** |
| Linear sum of TJ | | | 458 |
| **RSS / linear** | $\sqrt{4.7^2+2.8^2+0+2.8^2} = 6.15$ → $6.15\times14.069 = 86.5$ | **313.1** | **399.6** |

- UI = 400 ps at 2.5 Gb/s, so the properly combined TJ of 399.6 ps uses the whole eye. Adding TJs linearly (458 ps) would have declared the link broken.
- **Correction:** Hall's printed receiver TJ is 147 ps; $120.6 + 2.8\times14.069 = 160$ ps, and Palermo's slide corrects it to 160. The 458 ps linear total only adds up with 160.
- The RSS line shows why RJ is precious: 6.15 ps rms costs 86.5 ps of a 400 ps eye.

> [!tip] Remark
> Each block's row is that block's **jitter budget**: the PLL owns the clock rows, the TX driver and serializer the TX row, the CDR and sampler the RX row. [[#What this implies for the circuit blocks|The last section]] turns those rows into circuit specs.

### How Sensitive Is the Data Rate to Jitter?

Casper's link simulation (Fig. 1: 15 dB loss at 5 GHz, BER $10^{-12}$, 1 mV rms RX noise) plots the maximum data rate against TX jitter in UI rms. Adding a 16-tap DFE to 3-tap TX pre-emphasis raises the zero-jitter rate from about 12 to about 19 Gb/s, but as TX jitter rises to 0.03 UI rms the DFE link falls to about 13 Gb/s, giving back most of the gain (values read off the plot). **The maximum data rate is as sensitive to high-frequency TX jitter as to the choice of equalizer** (Casper §I); jitter deserves a proportional share of the design effort and power.

## Level 6: Jitter in Frequency: Transfer, Tolerance, Generation

### What Jitter Matters: the CDR Tracks Low Frequencies

The receiver recovers its sampling clock from the data, so the sampling point **moves with** the data edges at low jitter frequencies. The timing error at the sampler is the input jitter **minus** what the clock followed:

```tikz title="Clock recovery as a jitter filter. The recovered clock follows input jitter below the CDR bandwidth (H, low-pass); the sampler sees the error 1 - H (high-pass). Peaking in H amplifies jitter. After Agilent clock-jitter note Figs. 19-20 and Palermo L12 slides 44, 49."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.6cm,y=0.07cm]
  \draw[->] (0,-62) -- (6.3,-62) node[right] {$\log f$};
  \draw[->] (0,-62) -- (0,12) node[above] {dB};
  \foreach \d in {0,-20,-40,-60} \draw (0,\d) -- (-0.07,\d) node[left,font=\scriptsize] {\d};
  \draw[dashed,gray] (0,0) -- (6.2,0);
  % H: flat with peaking at f=3, then -20 dB/dec
  \draw[thick,blue!70!black] (0,0) -- (2.2,0) .. controls (2.7,0.2) and (2.85,3) .. (3.05,2.5) .. controls (3.3,1.5) and (3.4,-2) .. (3.7,-6) -- (6.2,-56);
  \node[blue!70!black,font=\scriptsize,anchor=east] at (4.6,-42) {$H$ ($-20$ dB/dec)};
  \node[blue!70!black,font=\scriptsize] at (3.1,6.5) {peaking};
  % 1-H: +40 dB/dec rising to 0
  \draw[thick,red!70!black] (0.15,-60) -- (2.65,-6) .. controls (2.85,-1) and (3.0,1.5) .. (3.3,1.2) .. controls (3.6,0.6) .. (4.0,0) -- (6.2,0);
  \node[red!70!black,font=\scriptsize,anchor=east] at (1.95,-10) {$1-H$ ($+40$ dB/dec)};
  \draw[dotted] (3,-62) -- (3,0); \node[below,font=\scriptsize] at (3,-62) {CDR BW};
  \node[font=\scriptsize,align=center] at (1.2,6) {tracked: SSC,\\wander, low PJ};
  \node[font=\scriptsize,align=center] at (5.2,6) {not tracked:\\full cost};
\end{circuitikz}
\end{document}
```

$$
\boxed{\phi_e(s) = \big(1 - H(s)\big)\,\phi_{in}(s),\qquad H(s) = \frac{\phi_{out}}{\phi_{in}} = \frac{2\zeta\omega_n s + \omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}}
$$

- An infinitely fast CDR would follow every edge and never err; a zero-bandwidth one would leave all jitter in the error. Real CDRs pass more low-frequency jitter to the sampling clock than high (Agilent clock note pp. 12–14).
- So the **"ideal position in time" of an edge is wherever the recovered clock puts it**, not $nT$; jitter specs only make sense together with a reference CDR/PLL transfer function (a "golden PLL"). Applying that $H$ to a TIE record is how an oscilloscope decides which clock jitter counts (Agilent clock note pp. 14, 26).
- In practice, **RJ is integrated only from the CDR bandwidth up to Nyquist** ([[#Bridge Phase Noise to rms Jitter|below]]).

> [!warning] Source erratum (Agilent clock-jitter note p. 13)
> "The peaking is determined by the damping factor; the greater the damping factor the greater the peaking." It is the other way round: for this $H(s)$, peaking **falls** as $\zeta$ rises (the zero keeps it from ever reaching exactly 0 dB). That is why the jitter-transfer peaking limit below forces an over-damped loop. The bandwidth formula on the same page is correct: $\omega_{3dB} = \omega_n\sqrt{1+2\zeta^2+\sqrt{(1+2\zeta^2)^2+1}}$.

> [!tip] Remark
> $H(s)$ is the closed-loop phase transfer of a type-II, second-order loop, with $\omega_n = \sqrt{K_iK_{PD}K_{VCO}}$ and $\zeta = \frac{K_P}{K_i}\frac{\omega_n}{2}$ for a PI loop filter (Palermo L12 slide 43). Its derivation, stability and design are owned by [[Phased-Locked Loops]]; the CDR-specific phase detectors by [[Clocking and CDR]].

### Jitter Transfer and Its Mask

**Jitter transfer** is how much input jitter appears on the recovered (output) clock, vs frequency: $JTF(f) = 20\log\frac{\text{output jitter}(f)}{\text{input jitter}(f)}$, measured by phase-modulating the data with a sine and comparing the recovered clock with a clean one (Palermo L12 slides 44–45).

- **Why it is specified:** in a chain of repeaters (each a CDR that retimes and retransmits), any peaking compounds. SONET limits peaking to **$P \le 0.1$ dB**, with corner $f_c$ = 130 kHz (155 Mb/s), 500 kHz (622 Mb/s), 2 MHz (2.488 Gb/s) and $-20$ dB/dec beyond (Palermo L12 slide 46; Casper §III).
- Casper's general form: the system is assumed linear, so jitter transfer can equally be written as a **jitter impulse response** $h_i$ and applied to a jitter sequence by convolution ([[#Level 7 Jitter Amplification by the Channel and Clock Path|Level 7]]).

### Jitter Tolerance and Its Mask

**Jitter tolerance (JTOL)** is the largest sinusoidal jitter, in UI peak-to-peak, the receiver can take at each frequency while still meeting the BER. With timing margin $TM$ (the opening left after all the other jitter):

$$
\boxed{JTOL(f) = \frac{TM}{\left|1 - H(j2\pi f)\right|}\quad\text{(UI}_{pp}\text{)}}
$$

(Palermo L12 slide 49; from $|\phi_e| \le TM/2$ with $\phi_e = (1-H)\phi_{in}$ and JTOL $= 2|\phi_{in}|$.)

```tikz title="Jitter tolerance: the CDR tracks large low-frequency jitter (many UI) and tolerates only the timing margin above its bandwidth. The spec mask (stair line) must lie below the measured curve. Corners after Casper Fig. 10 (OTU1) and the shape of Palermo L12 slide 51 (Lee measurement)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.7cm,y=1.6cm]
  \draw[->] (0,0) -- (5.4,0) node[right] {$\log f$};
  \draw[->] (0,0) -- (0,3.4) node[above] {SJ amplitude (UI$_{pp}$, log)};
  \foreach \y/\l in {0.4/0.15,1.4/1.5,2.4/15} \draw (0,\y) -- (-0.06,\y) node[left,font=\scriptsize] {\l};
  % mask
  \draw[thick,red!70!black] (0.2,2.4) -- (0.7,2.4) -- (1.7,1.4) -- (2.9,1.4) -- (3.9,0.4) -- (5.2,0.4);
  \node[red!70!black,font=\scriptsize,anchor=west] at (4.0,0.18) {spec mask};
  % measured JTOL: falling 40dB/dec (2 decades/decade) then flat at TM
  \draw[thick,blue!70!black] (1.2,3.3) -- (2.7,1.2) .. controls (3.0,0.85) and (3.3,0.8) .. (3.7,0.78) -- (5.2,0.78);
  \node[blue!70!black,font=\scriptsize,anchor=west] at (3.9,1.0) {flat $\approx TM$ beyond CDR BW};
  \node[blue!70!black,font=\scriptsize,anchor=west] at (2.0,2.6) {tracking region};
  \node[font=\scriptsize] at (1.4,0.6) {FAIL below};
  \node[font=\scriptsize] at (3.3,2.4) {PASS above};
  \foreach \x/\l in {0.7/500\,Hz,1.7/5\,kHz,2.9/100\,kHz,3.9/1\,MHz} \draw (\x,0) -- (\x,-0.06) node[below,font=\scriptsize] {\l};
\end{circuitikz}
\end{document}
```

- **Low frequencies:** $|1-H|\to 0$, the CDR tracks, and many UI of jitter are tolerated. **High frequencies:** $|1-H|\to 1$, and the tolerance flattens at the timing margin. In Lee's measurement (Palermo L12 slide 51) the flat region sits near 0.4 to 0.5 UI$_{pp}$, above a 0.1 UI$_{pp}$ mask.
- **Measurement:** a BERT's clock is modulated with RJ and SJ, DJ comes from passing the data through a real backplane, and at each frequency the SJ amplitude is raised until the BER reaches $10^{-12}$ (Palermo L12 slide 50).
- **Wider CDR bandwidth improves JTOL**, but widens jitter transfer and passes more of the CDR's own and the reference's jitter: the CDR bandwidth is usually *dictated* by the transfer and tolerance masks, which is one reason for dual-loop CDRs that set the CDR and PLL bandwidths separately (Palermo 2011 pp. 294–295; L12 slide 52).

> [!note]- Derivation: why the JTOL curve falls at 40 dB/dec but masks at 20 dB/dec
> For the type-II $H(s)$ above, $1-H(s) = \dfrac{s^2}{s^2+2\zeta\omega_n s+\omega_n^2}$. Well below $\omega_n$, $|1-H| \approx (\omega/\omega_n)^2$, so $JTOL \approx TM\,(\omega_n/\omega)^2$: 40 dB per decade. Masks slope at 20 dB/dec (Casper's OTU1 example: 15 → 1.5 UI$_{pp}$ over 500 Hz–5 kHz, flat to 100 kHz, 1.5 → 0.15 UI$_{pp}$ over 100 kHz–1 MHz, flat to 20 MHz), so a linear type-II CDR clears them with room at low frequency, and the binding point is near the corner where the mask meets the flat TM. A bang-bang CDR is slew-rate limited instead: its phase can move at most one step per update, which bounds how fast it can follow large SJ ([[Clocking and CDR]]).

### Jitter Generation

**Jitter generation** is the jitter a block adds with a clean input: a PLL, a TX, a CDR (Casper §III). For a CDR or PLL it is dominated by the VCO, whose phase noise reaches the output through the **high-pass** $H_n(s) = \dfrac{s^2}{s^2+2\zeta\omega_ns+\omega_n^2}$: the loop corrects slow VCO drift and passes fast VCO noise (Palermo L12 slide 47). The open-loop accumulation of jitter ($\propto\sqrt{\Delta T}$) is stopped after about $1/$(loop bandwidth) (slide 48). SONET: rms jitter generation $\le 0.01$ UI.

Specs either limit $N$-UI jitter at several $N$, or (more often) filter the jitter sequence with band-pass masks and limit each band; for a TX the **frequency content** matters as much as the size, since high-frequency TX jitter is the kind the channel amplifies and the CDR cannot track (Casper §III).

### Bridge: Phase Noise to rms Jitter

Phase noise $S_\phi(f)$ is the power spectral density of the absolute-jitter sequence in radians, $\phi_k = 2\pi\tau_k/T_0$. Integrating it gives the rms jitter (Carusone Eqs. 19.54, 19.60–19.61; Agilent clock note p. 24):

$$
\boxed{\sigma_\tau = \frac{T_0}{2\pi}\sqrt{\int_{f_1}^{f_2} S_\phi(f)\,df} = \frac{1}{2\pi f_0}\sqrt{2\int_{f_1}^{f_2}\mathcal{L}(f)\,df}}
$$

- $\mathcal{L}(f) \approx \tfrac12 S_\phi(f)$ (the single-sideband spectrum in dBc/Hz) holds only when amplitude noise is negligible (Agilent clock note p. 23).
- **The limits are the point.** For a link, $f_1$ is the CDR (or reference-PLL) bandwidth, below which jitter is tracked, and $f_2$ is Nyquist; RJ is "specified up to the Nyquist frequency of the system" (Agilent p. 24). Integrating from 0 counts wander the CDR removes.
- **Period jitter** is the absolute jitter through a $(z-1)$ filter: $\sigma_J^2 = \left(\frac{T_0}{\pi}\right)^2\int_0^{1/2T_0}\sin^2(\pi fT_0)\,S_\phi(f)\,df$ (Carusone Eq. 19.64), which suppresses the low frequencies that dominate $\sigma_\tau$. That is why a clock can have a small period jitter and still be useless for a link.
- **Multiplication:** a PLL multiplying by $N$ multiplies the phase-noise-to-carrier ratio by $N^2$ (+20 dB per decade of $N$) inside its bandwidth (Agilent clock note pp. 10, 17).
- **Accumulation:** a free-running oscillator limited by white noise has $\sigma \propto\sqrt N$ after $N$ cycles; Casper's Eq. 7 gives $N$-UI jitter (rms) $= \dfrac{\Delta f}{f_0^{3/2}}\,10^{\mathcal{L}(\Delta f)/20}\sqrt N$ for that case.

Illustrative arithmetic (numbers chosen for the example, not from a source): a 10 GHz clock with flat $\mathcal{L} = -110$ dBc/Hz from 1 MHz to 100 MHz gives $2\int\mathcal{L}\,df = 2\times10^{-11}\times 9.9\times10^7 \approx 2\times10^{-3}$ rad², $\sigma_\phi \approx 0.045$ rad, $\sigma_\tau = 0.045/(2\pi\times10^{10}) \approx 0.7$ ps rms, or 0.007 UI at 10 Gb/s.

```tikz title="Which phase noise becomes link jitter: integrate only between the CDR bandwidth (below it the RX clock tracks) and Nyquist. After Agilent clock-jitter note Fig. 34 and Casper Section III."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.4cm,y=0.06cm]
  \draw[->] (0,-150) -- (6.6,-150) node[right] {$\log f$ (offset)};
  \draw[->] (0,-150) -- (0,-55) node[above] {$\mathcal{L}(f)$ (dBc/Hz)};
  \fill[blue!15] (2,-150) -- (2,-99) -- (3,-110) -- (5.5,-135) -- (5.5,-150) -- cycle;
  \draw[thick,blue!70!black] (0.3,-70) -- (1,-80) -- (2,-99) -- (3,-110) -- (5.5,-135) -- (6.3,-137);
  \draw[dotted] (2,-150) -- (2,-60) node[above,font=\scriptsize,align=center] {CDR\\bandwidth};
  \draw[dotted] (5.5,-150) -- (5.5,-60) node[above,font=\scriptsize] {Nyquist};
  \node[font=\scriptsize,align=center] at (3.6,-142) {$\sigma_\tau^2 = \frac{2}{(2\pi f_0)^2}\int \mathcal{L}\,df$};
  \node[font=\scriptsize,align=center] at (0.9,-95) {tracked:\\costs nothing};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> Where $\mathcal{L}(f)$ comes from (Leeson, the $1/f^2$ and $1/f^3$ regions, ring vs LC) is owned by [[Oscillators]]; how a PLL shapes it (low-pass for the reference, high-pass for the VCO, multiplication by $N^2$) by [[Phased-Locked Loops]]. This note only needs the integral and its limits. The same integral with $f_1\to0$ is the sampling-clock jitter of an ADC: [[Sampling Circuits#Aperture Jitter]].

## Level 7: Jitter Amplification by the Channel and Clock Path

### The Jitter Impulse Response

Treat a clock path (buffer chain, distribution wire, channel) as linear in its **phase**: displace one input edge by a small amount and record how much each subsequent output edge moves, normalized to the input displacement. That sequence $h_i$ is the **jitter impulse response**, and any input jitter sequence is mapped to the output by convolving with it (Casper §III, Fig. 11).

```tikz title="A bandwidth-limited element (left) turns one displaced edge into an alternating jitter impulse response (middle), whose transfer function rises toward the clock's Nyquist rate (right): a low-pass circuit is a high-pass jitter amplifier. After Casper Figs. 11 and 12(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % panel 1: lowpass freq response
  \begin{scope}
    \draw[->] (0,0) -- (3.2,0) node[below left,font=\scriptsize] {$f$};
    \draw[->] (0,0) -- (0,2.2) node[above,font=\scriptsize] {$|H_v|$};
    \draw[thick,blue!70!black] (0,1.6) -- (1.2,1.6) .. controls (1.8,1.6) and (2.2,0.6) .. (3,0.3);
    \node[font=\scriptsize] at (1.6,-0.5) {frequency response: low-pass};
  \end{scope}
  % panel 2: jitter impulse response
  \begin{scope}[xshift=4.6cm]
    \draw (0,1) -- (3.4,1);
    \foreach \x/\h in {0.3/2.1,0.8/0.35,1.3/1.4,1.8/0.75,2.3/1.18,2.8/0.92} {
      \draw[thick,red!70!black] (\x,1) -- (\x,\h); \fill[red!70!black] (\x,\h) circle (0.06);
    }
    \node[font=\scriptsize,anchor=west] at (0.4,2.1) {$h_1$};
    \node[font=\scriptsize,anchor=west] at (0.9,0.3) {$h_2<0$};
    \node[font=\scriptsize] at (1.7,-0.5) {jitter impulse response $h_i$ (edge \#)};
  \end{scope}
  % panel 3: jitter transfer
  \begin{scope}[xshift=9.6cm]
    \draw[->] (0,0) -- (3.2,0) node[below left,font=\scriptsize] {$f_{jitter}$};
    \draw[->] (0,0) -- (0,2.2) node[above,font=\scriptsize] {jitter gain};
    \draw[dashed,gray] (0,0.8) -- (3,0.8) node[right,font=\scriptsize,text=black] {1};
    \draw[thick,red!70!black] (0,0.8) -- (1,0.8) .. controls (1.8,0.85) and (2.3,1.4) .. (2.9,2.0);
    \draw[dotted] (2.9,0) -- (2.9,2.0) node[above,font=\scriptsize] {$f_{clk}/2$};
    \node[font=\scriptsize] at (1.6,-0.5) {jitter transfer: high-pass};
  \end{scope}
\end{circuitikz}
\end{document}
```

Two numbers distill $h_i$ (Casper Eqs. 9–10), $k$ = length of the response:

$$
\boxed{\mathrm{DCA} = \left|\sum_{i=1}^{k/2}\big(h_{2i-1}-h_{2i}\big)\right|,\qquad \mathrm{RJA} = \sqrt{\sum_{i=1}^{k} h_i^2}}
$$

- **DCA (duty-cycle amplification)**: the gain for alternating, Nyquist-rate jitter, which is exactly duty-cycle error. Alternate signs in $h_i$ add up.
- **RJA (random jitter amplification)**: the gain for white, uncorrelated jitter: an rms through an FIR filter.

> [!note]- Why: a low-pass path amplifies high-frequency jitter
> Push one edge late. The half cycle before it is longer than nominal and the one after it shorter. Through a low-pass element the longer half cycle swings further toward the rail and the shorter one does not reach as far, so the *next* edge starts from a different voltage and crosses the threshold at a shifted time, in the direction that continues the alternation: the impulse response alternates in sign. A duty-cycle error is the pattern long-short-long-short, which lines up with that alternation and grows. Casper puts it in frequency terms for a delay line: buffers whose bandwidth equals the clock frequency attenuate signals near the clock by 12 dB relative to DC (4 stages per 180°), and that gain difference between low- and high-frequency content is what amplifies jitter. In the same terms, a TX clock with duty-cycle error puts even harmonics on the data, which the channel filters differently: DDJ = DCD ∗ ISI.

### The Numbers

- **Clock tree (Casper Figs. 30–31):** an inverter-driven tree whose far-end swing visibly shrinks at 7.5 and 10 GHz. Above 7.5 GHz it amplifies random jitter by more than **1.6×** and duty-cycle error by more than **2.3×**, and both grow very fast beyond the network's bandwidth. "Looks fine on a scope" is not the test; the jitter impulse response is.
- **DLL delay lines (Casper §V-C):** 4 stages per 180° (each buffer's bandwidth equal to the clock frequency) amplify duty-cycle error by about 1.1–1.2× **per stage**; 6-stage lines show 5–10× less amplification per stage. Saturating the clock reduces it.
- **TX jitter and the data channel:** duty-cycle error at the transmitter amplifies channel ISI and reduces equalizer effectiveness (Casper §III); this is why the maximum data rate is so sensitive to high-frequency TX jitter (Fig. 1).
- **Forwarded clocks:** the forwarded clock's own lossy channel amplifies its high-frequency jitter, which is then *not* correlated with the data's jitter. A PLL at the RX rejects it (low-pass), a DLL passes it (all-pass); a band-pass filter in the RX clock buffer reverses the channel's jitter amplification (Casper §II-A, Table II: +3 ps of eye width).

### Architecture Consequence: What the RX Clock Can Track

Casper's 10 Gb/s, 30 cm FR4 comparison (Table II; Fig. 41) puts numbers on Level 6:

| | Forwarded clock (DLL) | Embedded clock (PI-based CDR) |
|---|---|---|
| Baseline eye width (of 100 ps) | **55 ps** | **18 ps** |
| Why | Clock and data share TX jitter; tracking bandwidth is the FC channel itself | CDR bandwidth only a few MHz |
| Sensitivity to ref-clock jitter, PLL jitter and bandwidth, distribution jitter | 1× | **3 to 4×** |
| TX PLL 1-UI jitter 0.5 → 0.75 ps rms | −4 ps | −12 ps |
| TX buffer SJ at 200 MHz ±15 → ±18 ps | −3 ps | −10 ps |
| RX buffer latency 1 → 3 UI | −7 ps | n/a |

> [!tip] Remark
> Same rule as the CDR plot: jitter **correlated** between clock and data and slower than the tracking bandwidth is free; everything else is paid in full. A forwarded clock buys enormous tracking bandwidth as long as the clock and data paths stay matched in delay. The architectures themselves are owned by [[Clocking and CDR]].

## What this implies for the circuit blocks

A jitter budget (Level 5) gives each block a $\sigma$ and a $DJ(\delta\delta)$, *at the frequencies the CDR does not track*. Each row below says which circuit property sets that number and which note owns its translation into transistor-level specs.

| Block | Budget item it owns | Set by | Owner note |
|---|---|---|---|
| **Reference + TX PLL** | Clock RJ (integrated $\mathcal{L}(f)$ from CDR BW to Nyquist), PJ/spurs, jitter-transfer peaking ($\le 0.1$ dB-class) | VCO phase noise, loop bandwidth vs VCO/ref noise, $N^2$ multiplication, damping $\zeta$ | [[Phased-Locked Loops]], [[Oscillators]] |
| **Clock distribution / buffers** | Added RJ, DCD, and their **amplification** (RJA, DCA) | Buffer bandwidth relative to clock frequency, supply sensitivity (≈1 %/%), regulation, CML vs CMOS | [[Clocking and CDR]], [[High-Speed Circuit Techniques]] |
| **TX serializer + driver** | DCD/EOJ, ISI jitter, supply-induced DJ, edge rate | Duty-cycle correction of the half-rate clock, driver bandwidth and $t_r = t_f$ matching, supply isolation, FFE | [[Transmitters]], [[Equalization]] |
| **Channel** | ISI jitter, BUJ from crosstalk | Loss, reflections, NEXT/FEXT | [[Channels]] |
| **CDR** | Tracking bandwidth (JTOL), jitter transfer, its own generation and dither | Loop gains $K_P$, $K_i$, latency, PI resolution, phase-detector type | [[Clocking and CDR]] |
| **RX front end + sampler** | Input noise → jitter via slope, offset, aperture, metastability | Input-referred noise and bandwidth (slope at the crossing), offset calibration, sampler regeneration | [[Receivers]], [[Comparators]] |

Three rules that fall out of the note:

1. **Spend effort where the CDR is blind.** Jitter below the CDR bandwidth is cheap; a PLL with low integrated jitter *above* that bandwidth is what matters. Specify clock jitter as integrated phase noise over that band, not as an unbounded pp number.
2. **Every clock path is a potential jitter amplifier.** Give buffers bandwidth well above the clock frequency (or saturate them), correct duty cycle close to where it is used, and check DCA and RJA from a jitter impulse response, not from waveform amplitude.
3. **Noise becomes jitter through slope.** Wherever a voltage noise $\sigma_v$ meets an edge (sampler input, clock buffer input, a slow channel), the timing cost is $\sigma_v/\text{slope}$. Bandwidth that keeps edges sharp is a jitter spec as much as a gain spec.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Wider CDR bandwidth | Tracks more jitter: better JTOL, SSC tolerance | Passes more input jitter (transfer), more of its own dither, harder to meet peaking spec |
| Narrower TX/ref PLL bandwidth | Filters reference-clock jitter | Passes more VCO noise (high-pass), slower lock |
| Over-damped loop (larger $\zeta$) | Less jitter-transfer peaking: cascades of repeaters behave | Slower settling, larger loop-filter capacitor |
| Forwarded clock | Tracks correlated high-frequency TX jitter: 55 vs 18 ps eye in Casper | Extra lane, clock-channel jitter amplification, needs clock/data delay matching |
| More swing | Beats offset and thermal noise; sharper edges reduce noise-to-jitter conversion | Power; nothing against crosstalk, ISI, SSO (proportional) |
| Faster edges | Less amplitude-to-timing conversion | More SSO ($\propto 1/t_r$) and crosstalk, more EMI |
| Equalization (FFE, CTLE, DFE) | Removes ISI jitter | Boosts noise and crosstalk (CTLE), power |
| Duty-cycle correction | Removes DCD before the channel amplifies it | Loop, area |
| Regulated or CML clock buffers | Supply-noise rejection | Power, headroom |
| More delay stages per 180° in a DLL | Less DCA per stage | Power, more total delay (more supply-induced jitter) |
| Offset calibration instead of bigger devices | Lower offset without 4× area per halving | Calibration DAC and loop |
| Specify $DJ(\delta\delta)$ + $\sigma$ (dual-Dirac) | Well-defined, budgetable, measurable | Model-dependent; extrapolation from short captures can overestimate $\sigma$ |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Noise to jitter | $\sigma_t \approx \sigma_v/\lvert dv/dt\rvert$; sinusoid $\sigma_t = \sigma_v/(A\omega_0)$ |
| SSO noise | $V_N = L\,di/dt \approx nLV_s/(Z_0t_r)$ |
| Offset (Pelgrom) | $\sigma(\Delta V_t) = A_{V_t}/\sqrt{WL}$, $\sigma(\Delta\beta/\beta) = A_\beta/\sqrt{WL}$ |
| Capacitive crosstalk | $k_c = C_C/(C_C+C_0)$, $\tau_{xc} = R_O(C_C+C_0)$; return $k_{xr} = Z_R/Z_0$ |
| Jitter measures | $\tau_k = t_k-kT$; $J_{PER} = \tau_{k+1}-\tau_k$; $J_{CC} = \tau_{k+2}-2\tau_{k+1}+\tau_k$ |
| RJ PDF | $\frac{1}{\sqrt{2\pi}\sigma}e^{-t^2/2\sigma^2}$ |
| SJ PDF | $\frac{1}{\pi\sqrt{A^2-t^2}}$, $\lvert t\rvert<A$ |
| DCD PDF | $\tfrac12[\delta(t-\alpha/2)+\delta(t+\alpha/2)]$ |
| Total jitter PDF | $PDF_{RJ}*PDF_{SJ}*PDF_{DCD}*PDF_{ISI}*PDF_{BUJ}$ |
| Timing bathtub | $\mathrm{BER}_L(x) = \rho_T\int_x^\infty J$; $TJ = T_B - (x_R-x_L)$; peak $\rho_T/2$ |
| Dual-Dirac | $TJ(\mathrm{BER}) = DJ(\delta\delta)+2Q_{\mathrm{BER}}\sigma$; $Q_{\mathrm{BER}}(10^{-12}) = 7.03$ |
| Q-scale | $Q(x) = \sqrt2\,\mathrm{erf}^{-1}(1-\mathrm{BER}(x)/\rho_T)$, tails of slope $1/\sigma$ |
| Statistical eye with jitter | $p(v;t) = \int p_{\text{ISI+n}}(v;t+\tau)PDF_J(\tau)d\tau$ |
| Budget | $\sigma_{sys} = \sqrt{\sum\sigma_i^2}$, $DJ_{sys}\approx\sum DJ_i$, $UI\ge DJ_{sys}+2Q_{\mathrm{BER}}\sigma_{sys}$ |
| CDR error | $\phi_e = (1-H)\phi_{in}$, $H = \frac{2\zeta\omega_ns+\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2}$ |
| Jitter tolerance | $JTOL = TM/\lvert1-H\rvert$ (UI$_{pp}$) |
| Phase noise to jitter | $\sigma_\tau = \frac{1}{2\pi f_0}\sqrt{2\int_{f_1}^{f_2}\mathcal{L}(f)df}$ |
| Period jitter | $\sigma_J^2 = (T_0/\pi)^2\int\sin^2(\pi fT_0)S_\phi df$ |
| Jitter amplification | $\mathrm{DCA} = \lvert\sum(h_{2i-1}-h_{2i})\rvert$, $\mathrm{RJA} = \sqrt{\sum h_i^2}$ |

## References

- **S. Palermo, ECEN720 Lecture 9, "Noise Sources"** (`lecture9_ee720_noise_sources.pdf`): slides 3–6 (sources, bounded/statistical, proportional/independent), 8–11 (supply noise, routing, delay variation, SSO), 13–14 (offset), 16–26 (crosstalk: capacitive, driven, delay impact, mitigation, coupled lines, return), 28 and 37 (ISI, statistical eye), 39–40 (random noise).
- **S. Palermo, ECEN720 Lecture 10, "Jitter"** (`lecture10_ee720_jitter.pdf`): slides 4–8 (definitions, statistics, example, histogram), 9–17 (RJ, DJ, SJ, DDJ, DCD, ISI, BUJ, TJ convolution), 18 (jitter vs BER example), 19–22 (dual-Dirac, BER of leading/trailing edges, Q-scale example), 23–25 (budget rules, PCIe example from Hall, with the 147 → 160 ps correction).
- **S. Palermo, ECEN720 Lecture 12, "CDRs"** (`lecture12_ee720_cdrs.pdf`): slides 43–51 (CDR jitter model, jitter transfer and its measurement and SONET mask, jitter generation, jitter tolerance formula, measurement, measured curve), 52.
- **R. Stephens, "Jitter Analysis: The dual-Dirac Model, RJ/DJ, and Q-Scale,"** Agilent white paper, 2004 (`jitter_dual_dirac_agilent.pdf`): §1 (Table 1 assumptions, Eq. 1, Table 2, $DJ(\delta\delta)<DJ_{pp}$, Eq. 3), §2 (Eqs. 4–12, bathtub, TJ definition), §3 (Figs. 5–6, Q-scale Eqs. 13–18; typos in Eqs. 15–16 noted), §3.3 (combining), §4 (fitting vs independent-$\sigma$, Figs. 7–9), §5 (assumptions, BUJ, amplitude noise).
- **Agilent, "Using Clock Jitter Analysis to Reduce BER in Serial Data Applications,"** application note (`jitter_analysis_ber_serial_data_agilent.pdf`): pp. 3–5 (NIST definition, phase jitter, amplitude-to-timing conversion), pp. 6–9 (RJ, DJ, TJ(BER), Fig. 11, family tree; **p. 8 erratum $1/\rho^2 \to \rho_T/2$**), pp. 10–14 (PLL multiplication, DDJ = DCD ∗ ISI, CDR as jitter filter, unit interval; **p. 13 erratum on peaking vs $\zeta$**), pp. 20–25 (phase noise, $\mathcal{L}$ vs $S_\phi$, RJ from phase noise, clock datasheet quantities), pp. 26–28 (TIE, SSC example).
- **B. Casper and F. O'Mahony, "Clocking Analysis, Implementation and Measurement Techniques for High-Speed Data Links—A Tutorial,"** IEEE TCAS-I 56(1), 2009 (`clocking_analysis_hs_links_casper_tcas1_2009.pdf`): §I Fig. 1 (data rate vs jitter), §II (FC vs EC, jitter amplification of forwarded clocks), §III Table I, Figs. 8–12, Eqs. 1–10 (definitions, N-UI, generation/tolerance/transfer, OTU1 mask, jitter impulse response, DCA, RJA), §V-B (1 %/1 % rule, clock-tree RJA/DCA, Figs. 30–31), §V-C (DLL stage count), §VI Table II and Fig. 41 (FC vs EC sensitivities).
- **S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems,"** Ch. 9 in *High-Speed Circuits* (Iniewski ed.), 2011 (`serial_links_chapter_palermo_2011.pdf`): pp. 293–295 (PLL jitter, CDR bandwidth set by transfer and tolerance specs, dual-loop CDR), p. 300 (statistical link analysis, Fig. 9.14), pp. 310–311 (clock distribution and jitter amplification).
- **T. Chan Carusone, D. Johns, K. Martin, *Analog Integrated Circuit Design*, 2nd ed.**: §19.3 pp. 756–761 (absolute jitter Eq. 19.53–19.54, Ex. 19.9–19.10, phase noise and rms jitter Eqs. 19.60–19.61, period and P-cycle jitter Eqs. 19.62–19.65). Used only for the bridge; phase noise itself is in [[Oscillators]].
- **H. Zhang et al., "PAM4 Signaling for 56G Serial Link Applications – A Tutorial,"** DesignCon 2016 (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`): slides 77–80 (JP03A/B, even-odd jitter definition and example).
