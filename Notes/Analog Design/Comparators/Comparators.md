---
title: Comparators
description: The clocked comparator from black box to StrongARM latch, with offset, noise-to-error-probability, metastability, kickback, offset trim and programmable thresholds, translated into preamp and latch amplifier specs.
kind: topic
status: growing
aliases:
  - Comparators
  - Comparator
  - Latched Comparator
  - Clocked Comparator
  - StrongARM
  - StrongArm
  - StrongARM Latch
  - StrongArm Latch
  - Sense Amplifier
  - Slicer
  - Metastability
---

A comparator answers one question per clock edge: is $V_{in1}$ above or below $V_{in2}$? This note treats it as a black box first, then builds it from positive feedback, then turns that into the two practical topologies (preamp + latch, and the StrongARM), and only then looks at the statistics that limit it: offset, noise, metastability. It ends with offset trim, programmable thresholds for PAM4 slicers, and a complete 5 GHz design. Every ADC note and [[Receivers]] link here for these topics.

## The big picture

```tikz title="A clocked comparator: an optional preamp, a regenerative latch that grows the input difference exponentially, and an SR latch that holds the bit while the latch resets. Small inputs grow too slowly and are still undecided at the end of the phase (metastable). After Carusone Fig. 10.14 and Razavi DC Figs. 5.19, 6.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,rounded corners=2pt,minimum height=1.3cm,align=center,fill=gray!8}]
  \node[blk,minimum width=2.3cm] (pre) at (0,0) {preamp\\ gain $A_1\approx2$--$10$};
  \node[blk,minimum width=2.6cm] (lat) at (3.9,0) {regenerative\\ latch, $\tau_{reg}\approx C/g_m$};
  \node[blk,minimum width=1.9cm] (sr) at (7.5,0) {SR latch\\ (holds bit)};
  \draw[->] (-2.4,0.25) node[left]{$V_{in}$} -- (pre.west|-0,0.25);
  \draw[->] (-2.4,-0.25) node[left]{$V_{ref}$} -- (pre.west|-0,-0.25);
  \draw[->] (pre) -- (lat);
  \draw[->] (lat) -- (sr);
  \draw[->] (sr) -- ++(1.5,0) node[right]{$D_{out}$};
  \draw[->] (3.9,-1.6) node[below]{$CK$} -- (lat.south);
  \node[font=\scriptsize,align=center] at (-2.2,1.3) {offset $V_{OS}$, noise $\sigma_n$\\ referred here};
  \draw[->,dashed] (-2.2,0.95) -- (-2.0,0.4);
  \node[font=\scriptsize,align=center] at (1.9,-1.2) {blocks kickback,\\ divides latch $V_{OS}$, $\sigma_n$ by $A_1$};
  \begin{scope}[xshift=1.0cm,yshift=-5.6cm]
    \draw[->] (0,0) -- (8.2,0) node[right]{$t$};
    \draw[->] (0,-1.6) -- (0,1.9) node[above]{$V_X-V_Y$};
    \draw (0,-2.2) -- (1.2,-2.2) -- (1.2,-1.85) -- (4.6,-1.85) -- (4.6,-2.2) -- (5.8,-2.2) -- (5.8,-1.85) -- (8,-1.85);
    \node[left,font=\scriptsize] at (0,-2.0) {$CK$};
    \node[font=\scriptsize] at (0.6,-2.45) {reset};
    \node[font=\scriptsize] at (2.9,-2.45) {sense + regenerate};
    \node[font=\scriptsize] at (5.2,-2.45) {reset};
    \draw[thick] (0,0) -- (1.2,0);
    \draw[thick,domain=1.2:3.6,samples=40] plot (\x,{min(1.5,0.02*exp(1.8*(\x-1.2)))});
    \draw[thick] (3.6,1.5) -- (4.6,1.5) -- (5.0,0) -- (5.8,0);
    \draw[thick,dashed,domain=1.2:4.6,samples=40] plot (\x,{-min(1.5,0.0015*exp(1.8*(\x-1.2)))});
    \draw[dotted] (4.6,-1.6) -- (4.6,1.8);
    \node[font=\scriptsize,anchor=west] at (5.1,1.1) {large $|V_{in}|$: valid in time};
    \node[font=\scriptsize,anchor=west] at (4.7,-1.1) {small $|V_{in}|$: still};
    \node[font=\scriptsize,anchor=west] at (4.7,-1.4) {undecided = metastable};
    \node[font=\scriptsize] at (2.2,0.55) {$e^{t/\tau_{reg}}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Gain comes from positive feedback, not from an amplifier.** A cross-coupled pair grows any imbalance as $V_{XY}=V_{XY0}\,e^{t/\tau_{reg}}$ with $\tau_{reg}=\frac{R_DC_L}{g_mR_D-1}\approx C_L/g_m$. Infinite gain, given infinite time.
> 2. **Offset** is the input that makes the output 50/50. Contributions add in quadrature, and each stage's offset is divided by the gain in front of it. Target about 0.1 to 0.2 LSB.
> 3. **Noise turns into an error probability:** with rms input noise $\sigma_n$, an input $V_{in}$ is called wrong with probability $Q\!\left(|V_{in}-V_{OS}|/\sigma_n\right)$; $10^{-12}$ needs $|V_{in}-V_{OS}| > 7.03\,\sigma_n$.
> 4. **Metastability is unavoidable, but exponentially rare.** Halving the input delays the decision by $0.69\,\tau_{reg}$, so $P_{meta}\propto \frac{V_{logic}}{A_0\,\Delta V}\,e^{-T/\tau_{reg}}$. $T/\tau_{reg}$ is the knob.
> 5. **The StrongARM** gives rail-to-rail outputs, zero static power, one clock phase, and an offset set mostly by the input pair. Its costs are kickback and an output that is meaningless during precharge (hence the SR latch).
> 6. **Reset every cycle.** Precharge/equalize clears the previous decision (hysteresis, dynamic offset, ISI in a link); an unswitched preamp in front absorbs kickback; offset below ~10 mV needs trimming, and digital trim is the modern choice. The same trim knob moves the threshold, which is how PAM4 slicers get their three levels.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 The Black Box|black box and specs]] → [[#Level 1 Where the Gain Comes From|op amps, cascades, regeneration]] → [[#Level 2 Clocked Comparators|preamp + latch, offset budget, kickback]] → [[#Level 3 The StrongARM Latch|StrongARM]] → [[#Level 4 Metastability|metastability]] → [[#Level 5 Noise and Error Probability|noise]] → [[#Level 6 Offset Cancellation and Trim|offset trim]] → [[#Level 7 Thresholds and Slicers|thresholds, PAM4, SerDes slicers]] → [[#Level 8 Design Study 5 GHz StrongARM in 28 nm|a full design]].

## Spec translation

A comparator contains up to two amplifiers: a **preamp** (a resistively loaded or capacitively loaded differential pair, sized with gm/ID like any amplifier) and the **latch** (a pair whose only figure of merit is $g_m/C$). The comparator's specs land on them as follows.

**Comparator specs** (Razavi DC §5.7, §7.1; Carusone §10.1): input offset $V_{OS}$ (σ, at the target yield), input-referred noise $\sigma_n$ (or the error rate it implies), clock rate and resolution time, metastability error rate (typically $10^{-14}$ to $10^{-10}$ in ADCs, below $10^{-14}$ in communication systems), kickback onto the input, hysteresis (memory), input common-mode range, and power.

| Comparator spec | Element that sets it | Amplifier spec it imposes |
|---|---|---|
| Offset $V_{OS}$ | Input pair (preamp, or StrongARM $M_1$/$M_2$) | **Input offset** of the preamp: $\sigma(\Delta V_{TH}) = A_{VT}/\sqrt{WL}$ plus $\tfrac{V_{OV}}{2}\frac{\Delta\beta}{\beta}$ |
| Offset of later stages | Latch pair | Preamp **DC gain** $A_1$ (or StrongARM initial gain $A_0$) so that $V_{OS,latch}/A_1$ fits the budget |
| Noise $\sigma_n$ / error rate | Preamp, StrongARM input pair + load cap | **Input-referred noise** $\le$ budget; noise **bandwidth** no wider than the signal needs |
| Resolution time, metastability rate | Latch | **$\tau_{reg}=C/g_m$** (a unity-gain-frequency spec) and gain before the latch $A_0$ |
| Sense-phase accuracy | Preamp | **Settling** within the sense phase: $\tau_{pre}=R_DC_L$, so **GBW** $=A_1/(2\pi\tau_{pre})$ |
| Kickback | Preamp (unswitched), StrongARM tail and input pair | Preamp **reverse isolation** ($C_{GD}$ path only); small input devices |
| Input CM range | Input pair type (NMOS/PMOS) | **Input CM range** of the preamp; StrongARM speed needs high CM (tail current) |
| Power | StrongARM nodes; preamp bias | Latch: $P\approx f_{CK}C_{tot}V_{DD}^2$; preamp: **static current** |

$$
\boxed{V_{OS,in}^2 = V_{OS,1}^2+\frac{V_{OS,2}^2}{A_1^2}}\qquad
\boxed{\sigma_n \le \frac{|V_{in}|_{min}}{Q^{-1}(P_e)}}\qquad
\boxed{\frac{T_{latch}}{\tau_{reg}} \ge \ln\!\frac{V_{logic}}{A_0\,\Delta V\,P_{meta}}}
$$

$$
\boxed{\text{StrongARM: } A_0 = \frac{2g_m}{I_{SS}}V_{THN} = \left(\frac{g_m}{I_D}\right)_{1,2}V_{THN},\qquad \overline{v_{n,in}^2}\approx\frac{4kT\gamma}{(g_m/I_D)_{1,2}\,C_P\,V_{THN}}}
$$

> [!note]- Derivation: where each inequality comes from
> **Offset.** Refer every source to the input by dividing by the gain in front of it ([[#Offset Budget of a Preamp and Latch]]); uncorrelated sources add in power. With a preamp of gain $A_1$ the latch term is divided by $A_1$ (its variance by $A_1^2$).
>
> **Noise → error rate.** The input-referred noise is Gaussian with rms $\sigma_n$ ([[#Noise Turns Into an Error Probability]]). An input $V_{in}$ above the offset is called low when the noise sample is below $-V_{in}$, probability $Q(V_{in}/\sigma_n)$. For a target error probability $P_e$ the smallest resolvable input is $Q^{-1}(P_e)\,\sigma_n$; invert for $\sigma_n$.
>
> **Metastability.** The latch must grow its initial imbalance $A_0\Delta V_{in}$ to $V_{logic}$ in $T_{latch}$: $A_0\Delta V_{in}e^{T_{latch}/\tau}\ge V_{logic}$. The inputs that fail are those below $\epsilon = (V_{logic}/A_0)e^{-T_{latch}/\tau}$; for an input spread uniformly over $\pm\Delta V$ the probability is $\epsilon/\Delta V$ ([[#Error Rate]]). Set it below $P_{meta}$ and take logs.
>
> **StrongARM gain and noise.** $A_0 = 2g_mV_{THN}/I_{SS}$ is Razavi Eq. (5.40). With $I_{SS} = 2I_D$, $2g_m/I_{SS} = g_m/I_D$. The noise is Eq. (6.55), $2kT\gamma I_{SS}/(g_mC_1V_{THN})$, with $I_{SS}/g_m = 2/(g_m/I_D)$; the reset $kT/C$ term is a few times smaller ([[#StrongARM Noise Is Integrated White Noise]]).

| Amplifier spec | Lands on | Why |
|---|---|---|
| Preamp / StrongARM input offset | $WL$ of the input pair (Pelgrom); **high** $g_m/I_D$ (low $V_{OV}$) to shrink the $\Delta\beta$ term | $V_{OS}^2 = \Delta V_{TH}^2+\tfrac14(\Delta\beta/\beta)^2V_{OV}^2$ |
| StrongARM initial gain $A_0$ | $(g_m/I_D)_{1,2}$ directly, times $V_{THN}$ | $A_0 = (g_m/I_D)V_{THN}$: about 3 at $V_{OV}=200$ mV |
| Preamp gain $A_1=g_mR_D$ | $g_m/I_D$ and the $I_DR_D$ drop (headroom) | $A_1 = (g_m/I_D)(I_DR_D)$; keep $A_1\lesssim10$ for speed |
| Preamp bandwidth / settling | $g_m$ for the load: $GBW = g_m/(2\pi C_L)$, then $I_D = g_m/(g_m/I_D)$ | A single-pole stage settles with $\tau=R_DC_L = A_1/(g_m/C_L)$ |
| Input-referred noise | $g_m$ of the input pair (preamp) or $(g_m/I_D)\cdot C_P$ (StrongARM) | Thermal noise $\propto 1/g_m$ over its bandwidth; StrongARM integrates on $C_P$ |
| Latch $\tau_{reg}$ | **Short $L$, low $g_m/I_D$ (high $f_T$)** for the cross-coupled devices | $\tau_{reg}\approx C/g_m \approx K_3L^2/(\mu V_{OV})$; width cancels when self-loaded |
| Kickback, input CM | Input device size (vs offset), PMOS vs NMOS input, tail width | Bigger input pair: less offset, more $C_{GS}$, $C_{GD}$ kickback |

> [!tip] Remark
> The spec names come from [[Single-Stage#Amplifier Specifications]]. The procedure that turns $g_m/I_D$, $L$ and $I_D$ into a width is [[gm-ID Design Methodology]]; the offset formula and Pelgrom constants are owned by [[Nonlinearity and Mismatch#Input-Referred Offset]].

**Worked example** (Razavi DC Ch. 7: StrongARM, 28 nm, SS corner, 0.95 V, 75 °C; targets $V_{OS}<5$ mV, $f_{CK}=5$ GHz, $P<1$ mW). Full walk-through in [[#Level 8 Design Study 5 GHz StrongARM in 28 nm]].
1. **Offset → input-pair area.** $A_{VT}\approx2.2$ mV·µm. $W/L = 10\ \mu\text{m}/25$ nm gives $\sigma(\Delta V_{TH}) = 2.2/\sqrt{0.25} = 4.4$ mV.
2. **Offset of later pairs → initial gain.** The NMOS cross pair's 6.2 mV mismatch refers to 1.5 mV at the input, the PMOS pair's 8.8 mV to 0.9 mV. Total $\sqrt{4.4^2+1.5^2+0.9^2} = 4.7$ mV. The simulated pre-regeneration gain is 3.15.
3. **Speed → $\tau_{reg}$.** Measured $\tau_{reg}=2.5$ ps. With 78 ps of the 100 ps half-period left after the 22 ps nominal delay, inputs down to $1\ \text{mV}/10^{13.5}$ resolve.
4. **Noise.** Transient-noise counting gives $\sigma_n\approx0.31$ mV, well under the offset.
5. **Power** about 0.2 mW at 5 GHz, set by $f_{CK}C V_{DD}^2$, not by a bias current.

## Level 0: The Black Box

### What It Does

```tikz title="Clocked comparator (left), ideal and offset characteristics (middle), and two comparators against a ladder making a thermometer code (right). After Razavi DC Figs. 5.5, 5.7, 5.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[op amp](A){};
  \draw (A.+) -- ++(-0.6,0) node[left]{$V_{in1}$};
  \draw (A.-) -- ++(-0.6,0) node[left]{$V_{in2}$};
  \draw (A.out) -- ++(0.5,0) node[right]{$V_{out}$};
  \draw[->] (0,-1.4) node[below]{$CK$} -- (0,-0.55);
  \begin{scope}[xshift=4.0cm,yshift=-1.0cm]
    \draw[->] (-0.3,0) -- (3.4,0) node[right]{$V_{in1}-V_{in2}$};
    \draw[->] (0.9,-0.2) -- (0.9,2.2) node[above]{$V_{out}$};
    \draw[thick,gray] (-0.2,0.2) -- (0.9,0.2) -- (0.9,1.8) -- (3.2,1.8);
    \draw[thick] (-0.2,0.2) -- (1.7,0.2) -- (1.7,1.8) -- (3.2,1.8);
    \draw[<->] (0.9,1.0) -- (1.7,1.0) node[midway,above,font=\scriptsize]{$V_{OS}$};
    \node[font=\scriptsize,gray] at (0.5,2.0) {ideal};
    \node[font=\scriptsize] at (2.5,1.5) {with offset};
  \end{scope}
  \begin{scope}[xshift=9.6cm,yshift=0cm]
    \draw (0,1.6) node[left]{$V_{DD}$} to[R] (0,0.6) to[R] (0,-0.4) to[R] (0,-1.4) node[ground]{};
    \node[font=\scriptsize,above] at (0.9,0.6) {$V_{r2}$};
    \node[font=\scriptsize,above] at (0.9,-0.4) {$V_{r1}$};
    \node[draw,minimum width=0.9cm,minimum height=0.6cm] (c2) at (1.9,0.6) {\scriptsize cmp};
    \node[draw,minimum width=0.9cm,minimum height=0.6cm] (c1) at (1.9,-0.4) {\scriptsize cmp};
    \draw (0,0.6) -- (c2.west); \draw (0,-0.4) -- (c1.west);
    \draw (c2.east) -- ++(0.3,0) node[right,font=\scriptsize]{$A_2$};
    \draw (c1.east) -- ++(0.3,0) node[right,font=\scriptsize]{$A_1$};
    \node[font=\scriptsize,align=left,anchor=west] at (0.4,-1.6) {other input of each: $V_{in}$\\ $A_1A_2$: 00, 10, 11\\ as $V_{in}$ crosses $V_{r1}$, $V_{r2}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- On each clock edge the output goes high if $V_{in1}>V_{in2}$, low otherwise. A bank of them against a resistor ladder gives a **thermometer code**: the core of every flash ADC ([[Flash ADCs]]) and of a PAM4 slicer ([[#PAM4 Needs Three Thresholds]]).
- **Offset** shifts the characteristic sideways; a decision is wrong for $0<V_{in1}-V_{in2}<V_{OS}$. Since its sign is random, the source can sit in series with either input.
- The modes: **reset** (memory cleared), **sense** (input difference amplified or stored), **regenerate/latch** (positive feedback to logic levels). The output is only valid at the end of the regeneration phase.

### The Specifications

| Spec | Definition | Typical target |
|---|---|---|
| Input offset $V_{OS}$ | Input at which the output is high or low with equal probability (Carusone §10.1.1) | 0.1–0.2 LSB in an ADC (Razavi) |
| Input-referred noise $\sigma_n$ | Spread of that 50 % point: how the output statistics vary with input | ≈0.25 LSB (Razavi §5.7.3) |
| Hysteresis | Threshold that depends on the previous decision; charge left on internal nodes | Remove by resetting every cycle |
| Speed | Clock rate at which a ½-LSB input (or a worst-case swing, see below) still resolves | |
| Metastability rate | Probability that the output is not a valid logic level in time | $10^{-14}$ to $10^{-10}$ (Razavi §6.2) |
| Kickback | Charge the comparator injects back into its inputs when it switches | Below what disturbs the reference / track-and-hold |
| Power | Mostly $fCV^2$ for dynamic latches, bias current for preamps | |

> [!tip] Remark
> The offset is the input-referred offset of [[Nonlinearity and Mismatch#Input-Referred Offset]], and the noise is input-referred noise in the sense of [[Noise#Why Refer Noise to the Input]]. They are referred the same way: output error divided by the gain in front of it, $V_{OS} = V_0/A_0$ (Razavi DC Eq. 5.1).

> [!note]- Detail: the dynamic speed test (Razavi DC §5.7.2)
> A **static** test holds the input fixed and checks that the outputs reach their rails within half a period. In an ADC the input changes every cycle, so the harder **dynamic** test flips the input between a small positive value in one cycle and a large negative value in the next. The sense phase must first *undo* the previous rail-to-rail state before amplifying the new difference; if it cannot, the latch starts with the wrong polarity and decides wrongly (Razavi Fig. 5.24). Use ½ LSB for a general assessment, and the small/large alternation for a severe one. A comparator that resets its internal nodes between decisions (StrongARM) is immune to most of this, which is one reason reset matters.

## Level 1: Where the Gain Comes From

### An Op Amp Is Too Slow

A comparator must turn a millivolt into a volt: a gain of 1000 or more. Carusone §10.2 shows why an open-loop op amp is the wrong way to get it.

> [!example] Carusone Ex. 10.2
> Resolve 0.2 mV to a 2 V output: $A_0\ge10^4$. A dominant-pole op amp with $f_t = 10$ MHz then has $f_{-3dB}=f_t/A_0 = 1$ kHz, $\tau\approx0.16$ ms. Six time constants for comparison and the same for reset give a **500 Hz** clock.

Disconnecting the compensation capacitor during comparison buys 10 to 50×, still far too slow. What survives from this circuit is its **offset storage**: during reset the op amp in unity feedback stores its own offset (and low-frequency $1/f$ noise) on the input capacitor, which then subtracts it ([[Nonlinearity and Mismatch#Input Offset Storage]]).

### A Cascade of Open-Loop Stages

$$
\boxed{\tau_{total}\approx 2nA_0\frac{C_{gs}}{g_m} = 2nA_0\tau_T\approx\frac43\,\frac{nA_0L^2}{\mu_nV_{eff}}}
$$

$n$ uncompensated single-pole stages of gain $A_0$ each give total gain $A_0^n$ but a time constant only $n$ times one stage's ($2A_0\tau_T$ each, since each stage drives a load near $2C_{gs}$). A single op amp of the same gain would be about $A_0^{n-1}$ times slower.

- **Speed is set by $L^2/(\mu V_{eff})$, not by width.** Raise $V_{eff}$ for speed; widen only for matching and noise.

> [!example] Carusone Ex. 10.5
> 0.2 µm, $A_0=20$, $n=3$, $V_{eff}=0.5$ V, $\mu_n=0.03$ m²/V·s: $\tau_{total}=0.21$ ns. With $3\tau$ per half-period the clock is 781 MHz; resolution about $2\ \text{V}/A_0^3 = 0.25$ mV.

> [!note]- Derivation: first-order cascade (Carusone Eqs. 10.10–10.20)
> Stage $i$ drives $C_{pi}\approx C_{0,i}+C_{gs,i+1}<2C_{gs}$, so its unity-gain frequency is $\omega_t\approx g_m/(2C_{gs})$ and its pole $\omega_p = \omega_t/A_0$. The product of $n$ identical first-order stages, keeping only the first-order term of the denominator, is
> $$A_{total}(s)\approx\frac{A_0^n}{1+ns/\omega_p},\qquad \tau_{total} = \frac{n}{\omega_p} = \frac{2nA_0C_{gs}}{g_m}.$$
> Substituting $C_{gs}=\tfrac23C_{ox}WL$ and $g_m = \mu_nC_{ox}(W/L)V_{eff}$ cancels $W$ and gives the $\tfrac43 nA_0L^2/(\mu_nV_{eff})$ form.

### Positive Feedback: Regeneration

```tikz title="Cross-coupled pair (left) and its regeneration on a log scale (right). The imbalance grows as exp(t/tau_reg); starting alpha times smaller shifts the curve right by tau_reg ln(alpha) without changing its slope. After Razavi DC Figs. 5.12, 5.15, 6.5, 7.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (3,0) node[nmos](M2){};
  \node[font=\scriptsize,anchor=east] at ([xshift=-2pt]M1.east) {$M_1$};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]M2.east) {$M_2$};
  \draw (M1.S) |- (1.5,-1.2) -| (M2.S);
  \draw (1.5,-1.2) to[I,l=$I_{SS}$] (1.5,-3.0) node[ground]{};
  \draw (M1.D) -- (0,1.4) coordinate(X) to[R,l=$R_D$] (0,3.2);
  \draw (M2.D) -- (3,1.4) coordinate(Y) to[R,l_=$R_D$] (3,3.2);
  \draw (-1.6,3.2) -- (4.6,3.2) node[right]{$V_{DD}$};
  \draw (M1.G) -- (1.15,0|-M1.G) -- (1.85,1.1) -- (3,1.1);
  \draw (M2.G) -- (1.85,0|-M2.G) -- (1.15,1.1) -- (0,1.1);
  \node[circ] at (0,1.1){}; \node[circ] at (3,1.1){};
  \node[circ] at (X){}; \node[circ] at (Y){};
  \node[above left] at (X) {$X$};
  \node[above right] at (Y) {$Y$};
  \draw (X) -- (-1.3,1.4) to[C,l_=$C_L$] (-1.3,-0.2) node[ground]{};
  \draw (Y) -- (4.3,1.4) to[C,l=$C_L$] (4.3,-0.2) node[ground]{};
  \begin{scope}[xshift=6.6cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (5.6,0) node[right]{$t$};
    \draw[->] (0,0) -- (0,4.4) node[above]{$\log|V_{XY}|$};
    \draw[thick] (0,1.3) -- (4.2,4.3);
    \draw[thick,dashed] (0,0.6) -- (5.0,4.17);
    \draw[dotted] (0,3.0) -- (5.4,3.0) node[right,font=\scriptsize]{$V_1$ (valid logic)};
    \node[font=\scriptsize,anchor=east] at (0,1.3) {$V_{XY0}$};
    \node[font=\scriptsize,anchor=east] at (0,0.6) {$V_{XY0}/\alpha$};
    \draw[<->] (2.38,3.0) -- (3.36,3.0);
    \node[font=\scriptsize,anchor=east] at (2.3,3.3) {$\tau_{reg}\ln\alpha$};
    \node[font=\scriptsize,anchor=west] at (0.2,4.1) {slope $=1/\tau_{reg}$};
    \node[font=\scriptsize] at (2.6,-0.45) {$\alpha=2$: shift $=0.69\,\tau_{reg}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{XY}(t) = V_{XY0}\exp\frac{t}{\tau_{reg}},\qquad \tau_{reg} = \frac{R_DC_L}{g_mR_D-1}\;\xrightarrow{g_mR_D\gg1}\;\frac{C_L}{g_m}}
$$

$$
\boxed{C_L = C_{GS}+C_{DB}+4C_{GD}}\qquad\boxed{\text{complementary (two cross-coupled inverters): } \tau_{reg}=\frac{r_{ON}\|r_{OP}}{(g_{mN}+g_{mP})(r_{ON}\|r_{OP})-1}C_L}
$$

- Regeneration needs **loop gain $g_mR_D>1$**; below 1 the imbalance decays.
- $\tau_{reg}$ is $g_mR_D-1$ times **shorter** than the node's own $R_DC_L$. Example (Razavi): $R_D=1$ kΩ, $C_L=5$ fF, $g_m=10$ mS gives $\tau_{reg}=0.56$ ps.
- The output stops growing when one device turns off: swing $R_DI_{SS}$ (resistive load) or rail to rail (inverter pair).
- **Widening the pair does not help** when it is self-loaded: $g_m\propto\sqrt W$ at fixed current but $C_L\propto W$, so $\tau_{reg}$ actually rises. More current helps only until headroom runs out.
- Carusone's version: $\tau_{ltch}\approx C_L/G_m$ is the inverse unity-gain frequency of each inverter, about $K_3L^2/(\mu_nV_{eff})$ with $K_3\approx2$–4. It depends mainly on the technology.

> [!tip] Remark
> $g_m/C_L$ is the unity-gain bandwidth $\omega_u$ of a single stage ([[Single-Stage#Amplifier Specifications]]) and, for a self-loaded device, a fraction of $\omega_T$ ([[MosFETs#Capacitances]]). A latch is fast exactly when an amplifier built from the same device would have a high GBW. And regeneration is the [[Oscillators]] start-up condition with a **real** loop gain above one: the same instability grows a sinusoid when the loop gain crosses one at $\omega\ne0$, and an exponential when it crosses at dc.

> [!note]- Derivation: frequency and time domain (Razavi DC §5.3)
> **Frequency domain.** A loop with forward gain $H(s)$ and positive feedback has $Y/X = H/(1-H)$. If $H(s_1)=1$ a signal $e^{s_1t}$ circulates unchanged. For $H = A_0/(1+s/\omega_0)$, $s_1 = (A_0-1)\omega_0$; with $A_0=g_mR_D$ and $\omega_0=1/(R_DC_L)$, $s_1 = (g_mR_D-1)/(R_DC_L)$, a growing exponential if $g_mR_D>1$.
>
> **Time domain.** KCL at $X$ and $Y$ of the small-signal model: $C_L\dot V_X+V_X/R_D+g_mV_Y=0$ and the same with $X\leftrightarrow Y$. Subtract: $C_L\dot V_{XY}+V_{XY}/R_D-g_mV_{XY}=0$, so $\dot V_{XY} = \frac{g_mR_D-1}{R_DC_L}V_{XY}$ and $V_{XY}=V_{XY0}e^{t/\tau_{reg}}$.
>
> **Load capacitance.** Each device puts $C_{GS}$ on one node and $C_{DB}$ on the other; $C_{GD1}+C_{GD2}$ sits between $X$ and $Y$, which swing oppositely, so by Miller it is worth $2\times2C_{GD}=4C_{GD}$ to ground at each node.
>
> **Carusone's inverter form (Eqs. 10.22–10.31).** Each inverter is $G_m=A_V/R_L$ into $R_L\|C_L$; the same subtraction gives $\Delta V=\Delta V_0e^{(A_V-1)t/\tau}$, $\tau_{ltch}=R_LC_L/(A_V-1)\approx C_L/G_m$. With $C_L=K_1WLC_{ox}$ ($K_1\approx1$–2) and $G_m=K_2\mu_nC_{ox}(W/L)V_{eff}$ ($K_2\approx0.5$–1), $\tau_{ltch} = (K_1/K_2)L^2/(\mu_nV_{eff})$.

> [!example] Carusone Ex. 10.6
> 0.2 µm, $K_3=2.5$, $V_{eff}=0.5$ V, $\mu_n=0.03$ m²/V·s: $\tau_{ltch}=6.7$ ps. Growing 1 mV to 1 V takes $T_{ltch}=\tau\ln(1000)=46$ ps, so a 92 ps period (11 GHz) at best. In practice the preamp and the track phase, not the latch, set the clock.

### Uncontrolled Feedback Amplifies Its Own Offset

A cross-coupled pair with threshold mismatch $\Delta V_{TH}$, started balanced, does not stay balanced: the mismatched currents start the regeneration and it decides on its own offset. Before regeneration starts it already shows

$$
\boxed{V_X-V_Y = \frac{g_mR_D}{g_mR_D-1}\,\Delta V_{TH}}
$$

and the longer it runs, the larger the external imbalance needed to overcome it. So positive feedback must be **controlled**: keep the latch off while the input imbalance is put on $X$, $Y$, then turn it on.

## Level 2: Clocked Comparators

### Simple and Current-Steering Comparators

```tikz title="Current-steering comparator: in the sense phase (CK high) the input pair M4-M5 amplifies onto R_D; in the latch phase the cross-coupled pair M1-M2 regenerates what is on X and Y. The two pairs share the loads. After Razavi DC Fig. 5.21(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (-1.0,4.0) -- (7.0,4.0) node[right]{$V_{DD}$};
  \draw (1.5,4.0) to[R,l_=$R_D$] (1.5,2.4) coordinate(X);
  \draw (4.5,4.0) to[R,l=$R_D$] (4.5,2.4) coordinate(Y);
  \node[circ] at (X){}; \node[circ] at (Y){};
  \node[above left] at (X) {$X$}; \node[above right] at (Y) {$Y$};
  % latch pair, centre
  \draw (1.5,0.6) node[nmos,xscale=-1](M1){};
  \draw (4.5,0.6) node[nmos](M2){};
  \node[font=\scriptsize,anchor=east] at ([xshift=-1pt]M1.east) {$M_1$};
  \node[font=\scriptsize,anchor=west] at ([xshift=1pt]M2.east) {$M_2$};
  \draw (M1.D) -- (X); \draw (M2.D) -- (Y);
  \draw (M1.G) -- (2.65,0|-M1.G) -- (3.35,1.9) -- (4.5,1.9);
  \draw (M2.G) -- (3.35,0|-M2.G) -- (2.65,1.9) -- (1.5,1.9);
  \node[circ] at (1.5,1.9){}; \node[circ] at (4.5,1.9){};
  \draw (M1.S) |- (3,-0.4) -| (M2.S);
  \draw (3,-0.4) -- (3,-0.6) node[nmos,anchor=D](M3){};
  \node[left] at (M3.G) {$\overline{CK}$};
  \node[font=\scriptsize,anchor=west] at ([xshift=1pt]M3.east) {$M_3$};
  \draw (M3.S) node[ground]{};
  % input pair, outside
  \draw (-0.2,0.6) node[nmos](M4){};
  \draw (6.2,0.6) node[nmos,xscale=-1](M5){};
  \node[left] at (M4.G) {$V_{in1}$};
  \node[right] at (M5.G) {$V_{in2}$};
  \node[font=\scriptsize,anchor=west] at ([xshift=1pt]M4.east) {$M_4$};
  \node[font=\scriptsize,anchor=east] at ([xshift=-1pt]M5.east) {$M_5$};
  \draw (M4.D) |- (1.5,2.2);
  \draw (M5.D) |- (4.5,2.2);
  \node[circ] at (1.5,2.2){}; \node[circ] at (4.5,2.2){};
  \draw (M4.S) |- (3,-3.1) -| (M5.S);
  \draw (3,-3.1) -- (3,-3.3) node[nmos,anchor=D](M6){};
  \node[left] at (M6.G) {$CK$};
  \node[font=\scriptsize,anchor=west] at ([xshift=1pt]M6.east) {$M_6$};
  \draw (M6.S) node[ground]{};
\end{circuitikz}
\end{document}
```

- **Simplest version** (Razavi Fig. 5.19): input switches load $V_{in}$ onto $X$, $Y$, then open while a clocked tail turns the latch on. The input must be **disconnected during regeneration**, otherwise a changing input fights the decision. Its drawbacks: tail current depends on PVT, the tail enters triode at large swing, and there is no gain before the latch.
- **Current-steering version** (above): a switched input pair gives sense-mode gain $g_{m4,5}R_D$, then the latch takes over the same loads. Fast, but it burns static current, has limited swing (needs a level shifter to CMOS), and its capacitively coupled clocked tails take area. Used only at the highest speeds.
- **Preamp + track-and-latch** (Carusone Fig. 10.14): one or two simple, continuously biased preamps (gain 2 to 10) followed by a latch. This is the "preamp + latch" topology referred to throughout the vault.

> [!note]- Detail: biasing the clocked tails (Razavi DC §5.6)
> To make the tail currents PVT-independent, mirror them from reference currents, and apply the clock through coupling capacitors onto the mirror gates (a high-pass; put large resistors in series with the diode devices to lower its corner). The coupling capacitors should be 5 to 10 times the tail gate capacitance, which is why the topology is big. Keep clock and output swings moderate (e.g. 0.6 V$_{pp}$) so the tails stay saturated.

### Offset Budget of a Preamp and Latch

$$
\boxed{V_{OS,tot}^2 = \Delta V_{TH4}^2+\left(\frac{I_{SS}\,\Delta R_D}{2g_{m4,5}R_D}\right)^2+\left(\frac{g_{m1,2}\,\Delta V_{TH1}}{g_{m4,5}(g_{m1,2}R_D-1)}\right)^2}
$$

- Input-pair mismatch goes straight to the input. Load mismatch is the output offset $\Delta R_DI_{SS}/2$ divided by the gain. The latch mismatch is its Level 1 output offset divided by the sense-mode gain.
- Sense and latch offsets add even though they happen at different times: the latch inherits a difference already corrupted by the sense-mode offset.
- Load mismatch does **not** add a second latch-mode term if the sense and latch tail currents are equal (Razavi Ex. 5.11).
- A separate unswitched preamp of gain $A_1$ divides the whole expression's variance by $A_1^2$, but adds its own pair and load mismatch. In low-voltage design $A_1$ is only 2 to 3 (Razavi Ex. 5.14).

> [!tip] Remark
> This is the cascade rule for input-referred offset, the same as for noise in [[Noise#Cascaded Stages]]: the first stage dominates once it has gain. The single-pair formula with its $\tfrac{V_{OV}}{2}\Delta\beta/\beta$ term is in [[Nonlinearity and Mismatch#Input-Referred Offset]]; Pelgrom's area law is in [[Nonlinearity and Mismatch#Where Mismatch Comes From Averaging]].

### Kickback

- Every switching event in the comparator moves charge through the input devices' $C_{GS}$ and $C_{GD}$: when the tail turns on, its current is first supplied by $C_{GS4,5}$ from the inputs; clock edges couple through the tail's $C_{GD}$.
- Kickback flows into **unequal source impedances** (signal on one side, a reference ladder on the other), so even equal currents become a differential error. In a flash ADC, all comparators kick the shared ladder while one of them is making a critical decision.
- **Fix: an unswitched stage in front.** A continuously biased preamp passes kickback back to its input only through its $C_{GD}$. Carusone: removing the preamp altogether gives very limited accuracy; when only moderate resolution is needed it can shrink to a unity-gain buffer, but it should stay.

> [!tip] Remark
> Kickback is the comparator's version of charge injection: charge from switching devices dumped onto a node with finite impedance. The switch-level mechanism and its trade-off are owned by [[Sampling Circuits#Channel Charge Injection]].

### Reset Clears Memory

- Charge left on internal nodes from the last decision makes the comparator favour that decision: **hysteresis** (Carusone §10.1.2). In a link it is ISI added by the receiver itself.
- **Reset every stage before tracking**: tie internal nodes to a supply or short the differential nodes together. This also parks the latch at its trip point, which speeds up small decisions (Carusone §10.4).
- Too much track-mode gain makes the time constants long; keep it moderate.
- In the StrongARM, precharge does this job, and incomplete precharge shows up as **dynamic offset** ([[#Dynamic Offset and the Equalizing Switch]]).

> [!note]- Detail: charge trapping, a slower memory (Carusone §10.5.1)
> NMOS input devices stressed with large positive gate voltage trap electrons in the oxide; the traps release over milliseconds and raise $V_{TH}$ meanwhile, giving 0.1 to 1 mV of hysteresis that no reset removes. It correlates with $1/f$ noise and is much smaller in PMOS. Fixes: PMOS inputs kept always on (small bias currents), periodically flushing the input devices, or separate coarse and fine input stages so the fine one never sees overloads.

## Level 3: The StrongARM Latch

```tikz title="StrongARM comparator with the four precharge switches. M1-M2 sense, M5-M6 (NMOS) and M3-M4 (PMOS) form two cross-coupled inverters, M_T is the clocked tail. After Razavi DC Fig. 5.37(c)."
\usepackage{circuitikz}
\usetikzlibrary{calc}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (4,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]M1.east) {$M_1$};
  \node[font=\scriptsize,anchor=east] at ([xshift=-2pt]M2.east) {$M_2$};
  \draw (2,-2.0) node[nmos](MT){};
  \node[left] at (MT.G) {$CK$};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]MT.east) {$M_T$};
  \draw (M1.S) |- (2,-1.0) -| (M2.S);
  \draw (2,-1.0) -- (MT.D);
  \draw (MT.S) node[ground]{};
  \draw (0,2.0) node[nmos,xscale=-1](M5){};
  \draw (4,2.0) node[nmos](M6){};
  \node[font=\scriptsize,anchor=east] at ([xshift=-2pt]M5.east) {$M_5$};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]M6.east) {$M_6$};
  \draw (M1.D) -- (M5.S) coordinate[pos=0.5](P);
  \draw (M2.D) -- (M6.S) coordinate[pos=0.5](Q);
  \node[circ] at (P){}; \node[below left] at (P) {$P$};
  \node[circ] at (Q){}; \node[below right] at (Q) {$Q$};
  \draw (0,4.4) node[pmos,xscale=-1](M3){};
  \draw (4,4.4) node[pmos](M4){};
  \node[font=\scriptsize,anchor=east] at ([xshift=-2pt]M3.east) {$M_3$};
  \node[font=\scriptsize,anchor=west] at ([xshift=2pt]M4.east) {$M_4$};
  \draw (M5.D) -- (M3.D);
  \draw (M6.D) -- (M4.D);
  \coordinate (X) at ($(M5.D)!0.5!(M3.D)$);
  \coordinate (Y) at ($(M6.D)!0.5!(M4.D)$);
  \coordinate (Xa) at ($(M5.D)!0.25!(M3.D)$);
  \coordinate (Xb) at ($(M5.D)!0.75!(M3.D)$);
  \coordinate (Ya) at ($(M6.D)!0.25!(M4.D)$);
  \coordinate (Yb) at ($(M6.D)!0.75!(M4.D)$);
  \draw (-2.2,5.6) -- (6.2,5.6) node[right]{$V_{DD}$};
  \draw (M3.S) -- (0,5.6); \draw (M4.S) -- (4,5.6);
  \draw (M5.G) -- ($(M5.G)+(0.35,0)$) -- ($(Ya)+(-1.3,0)$) -- (Ya);
  \draw (M6.G) -- ($(M6.G)+(-0.35,0)$) -- ($(Xa)+(1.3,0)$) -- (Xa);
  \draw (M3.G) -- ($(M3.G)+(0.35,0)$) -- ($(Yb)+(-1.3,0)$) -- (Yb);
  \draw (M4.G) -- ($(M4.G)+(-0.35,0)$) -- ($(Xb)+(1.3,0)$) -- (Xb);
  \foreach \n in {Xa,Xb,Ya,Yb} \node[circ] at (\n){};
  \draw (X) -- ++(-1.0,0) coordinate(XS) node[circ]{} node[above left]{$X$};
  \draw (Y) -- ++(1.0,0) coordinate(YS) node[circ]{} node[above right]{$Y$};
  \draw (XS|-0,5.6) to[nos,l_={$S_1$}] (XS);
  \draw (YS|-0,5.6) to[nos,l={$S_2$}] (YS);
  \coordinate (L3) at (-1.8,0); \coordinate (R4) at (5.8,0);
  \draw (-1.8,5.6) to[nos,l_={$S_3$}] (P-|L3) -- (P);
  \draw (5.8,5.6) to[nos,l={$S_4$}] (Q-|R4) -- (Q);
  \node[font=\scriptsize,align=center] at (2,6.2) {$S_1$--$S_4$: PMOS, gate $=CK$ (on when $CK$ low)};
\end{circuitikz}
\end{document}
```

The most used comparator in ADCs today, originally a memory sense amplifier. Build it in three steps; each step fixes the previous one's flaw.

### Step 1: A Pair with Capacitive Loads Integrates

$$
\boxed{V_X-V_Y = -\frac{g_m}{C_D}(V_{in1}-V_{in2})\,t}\qquad\boxed{A(t_a) = 2\,\frac{V_{DD}-(V_{CM}-V_{TH})}{V_{OV}}}
$$

- Replace $R_D$ with capacitors precharged to $V_{DD}$. The drain-current difference $g_m\Delta V_{in}$ integrates onto them: gain grows linearly with time.
- The common mode falls too. Count it as an amplifier only while both devices are saturated: until $V_X$ or $V_Y$ reaches $V_{CM}-V_{TH}$. The gain then is independent of $C_D$. Example: $V_{DD}=1$ V, $V_{CM}=0.6$ V, $V_{TH}=0.3$ V, $V_{OV}=0.2$ V: gain 7.
- Left alone, both nodes discharge to 0 and the circuit is dead. Hence a **precharge** phase (tail off, nodes to $V_{DD}$) before each amplification phase.

### Step 2: Add Cross-Coupled PMOS

- A PMOS cross pair on $X$, $Y$ turns on only when a node falls to $V_{DD}-|V_{THP}|$: positive feedback that **controls itself**. Until then the input pair provides gain
$$\boxed{\frac{V_X-V_Y}{V_{in1}-V_{in2}}\bigg|_{t_1} = \frac{2g_{mN}}{I_{SS}}|V_{THP}|}$$
- That gain divides the PMOS pair's mismatch when referred to the input:
$$\boxed{V_{OS}^2 = \Delta V_{TH1,2}^2+\Delta V_{TH3,4}^2\,\frac{I_{SS}^2}{4g_{mN}^2|V_{THP}|^2}}$$
- Flaw: after the decision, $I_{SS}$ still flows through the winning PMOS and its input device. Static power, and the high output does not reach $V_{DD}$.

### Step 3: Stack NMOS to Cut the Current: the StrongARM

Insert $M_5$, $M_6$ (gates cross-coupled) between the PMOS pair and the input pair. When $X$ falls, $M_6$ turns off and the right branch carries no current; the same on the left. Precharge $P$ and $Q$ as well as $X$ and $Y$ to $V_{DD}$ so the input pair starts in saturation and provides gain. (The original StrongARM shorted $P$ to $Q$ instead; Razavi prefers precharging, [[#Dynamic Offset and the Equalizing Switch]].)

### The Four Modes

```tikz title="StrongARM waveforms for a small positive input. Mode 1 precharge; mode 2 P, Q fall with a growing difference; mode 3 M5-M6 on, X and Y fall; mode 4 the PMOS pair turns on and regenerates, X goes to 0 and Y back to V_DD. After Razavi DC Figs. 5.38 and 6.8(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.15cm,y=1.6cm]
  \draw[->] (0,0) -- (9.2,0) node[right]{$t$};
  \draw[->] (0,0) -- (0,3.4) node[above]{$V$};
  \draw[dashed,gray] (0,3) -- (9,3); \node[left,font=\scriptsize] at (0,3) {$V_{DD}$};
  \draw[dotted] (0,2.45) -- (9,2.45); \node[left,font=\scriptsize] at (0,2.45) {$V_{DD}-V_{THN}$};
  \draw[dotted] (0,2.2) -- (9,2.2); \node[left,font=\scriptsize] at (0,2.05) {$V_{DD}-|V_{THP}|$};
  % P and Q
  \draw[thick,blue!70!black] (0,3) -- (1,3) -- (2.5,2.45) -- (3.5,1.2) -- (5,0.15) -- (6,0.05) -- (9,0.05);
  \draw[thick,blue!70!black,dashed] (0,3) -- (1,3) -- (2.5,2.5) -- (3.5,1.5) -- (4.6,1.0) -- (5.3,0.6) -- (6.4,0.25) -- (7.2,0.04) -- (9,0.03);
  \node[blue!70!black,font=\scriptsize] at (3.0,1.15) {$V_P$};
  \node[blue!70!black,font=\scriptsize] at (4.1,1.55) {$V_Q$};
  % X and Y
  \draw[thick] (0,3) -- (2.5,3) -- (4.2,2.2) -- (5.2,1.0) -- (6,0.1) -- (9,0.02);
  \draw[thick,dashed] (0,3) -- (2.5,3) -- (4.2,2.25) -- (5.0,2.0) -- (5.8,2.8) -- (6.4,3) -- (9,3);
  \node[font=\scriptsize] at (5.45,0.75) {$V_X$};
  \node[font=\scriptsize] at (6.2,2.6) {$V_Y$};
  % mode markers
  \foreach \x in {1,2.5,4.2} \draw[gray] (\x,-0.1) -- (\x,3.25);
  \node[font=\scriptsize] at (0.5,-0.25) {1};
  \node[font=\scriptsize] at (1.75,-0.25) {2};
  \node[font=\scriptsize] at (3.35,-0.25) {3};
  \node[font=\scriptsize] at (6.5,-0.25) {4: regenerate};
  \node[font=\scriptsize,align=center] at (1,3.4) {$CK\uparrow$};
  \node[font=\scriptsize,anchor=west,align=left] at (6.5,1.6) {$Q$ also discharges:\\ three of four nodes\\ end at 0 every cycle};
\end{circuitikz}
\end{document}
```

1. **Precharge** ($CK$ low): $P$, $Q$, $X$, $Y$ at $V_{DD}$, tail off.
2. **Amplify** ($CK$ high, $M_3$–$M_6$ off): $M_1$, $M_2$ integrate onto $C_P$, $C_Q$ until they fall to $V_{DD}-V_{THN}$:
$$\boxed{A_0 = \frac{V_P-V_Q}{V_{in1}-V_{in2}}\bigg|_{t_1} = \frac{2g_{m1,2}}{I_{SS}}V_{THN} = \left(\frac{g_m}{I_D}\right)_{1,2}V_{THN}}$$
3. **$M_5$, $M_6$ on, PMOS still off.** $X$, $Y$ fall and develop a difference: part of $I_{D1,2}$ flows into $C_X$, $C_Y$, and $M_5$/$M_6$ regenerate weakly.
4. **Regenerate** once $X$, $Y$ reach $V_{DD}-|V_{THP}|$: both inverters act, and $V_{XY}$ grows with $\tau_{reg}=\frac{r_{O}C_{X,Y}}{g_mr_O-1}$ of the inverter pair. $X\to0$, $Y\to V_{DD}$; $M_6$ cuts off, so $Q$ discharges to 0 through $M_2$.

> [!tip] Remark
> Mode 2 is [[#Step 1 A Pair with Capacitive Loads Integrates]] with $|V_{THP}|$ replaced by $V_{THN}$, and its gain $(g_m/I_D)V_{THN}$ is why the input pair's $g_m/I_D$ is the StrongARM's main sizing knob. Mode 4 is the cross-coupled inverter pair of [[#Positive Feedback Regeneration]].

> [!note]- Why: $M_5$, $M_6$ regenerate only through $C_P$, $C_Q$ (Razavi Ex. 5.18)
> If $C_P=C_Q=0$, $I_{D6}$ is forced equal to $I_{D2}$: $M_6$ is degenerated by an ideal current source. A drop in $V_X$ cannot change $I_{D6}$, so the loop gain through $M_5$–$M_6$ is zero. Mode-3 regeneration exists only because the tail-side nodes have capacitance to absorb a current change. This is also why the NMOS cross pair's offset is strongly suppressed: with $M_{1,2}$ saturated and no capacitance at $P$, $Q$, the input currents flow through $M_{5,6}$ as if they were absent (Razavi §7.2).

### Properties

| Property | Why |
|---|---|
| Rail-to-rail output | $X$, $Y$ end at 0 and $V_{DD}$; drives logic directly |
| Zero static power | $M_3$+$M_6$ or $M_4$+$M_5$ cut each branch after the decision |
| Offset ≈ input pair only | Gain $A_0$ before the cross pairs act; typically $M_5$/$M_6$ give about 25 % and $M_3$/$M_4$ about 10 % of $V_{OS}^2$ |
| One clock phase | No complementary clocks |
| Slower than current steering | Rail-to-rail swing |
| Heavy kickback | See below |
| Speed depends on input CM | Tail current, and so the fall rate of $P$, $Q$, needs a high enough CM |

$$
\boxed{P\approx f_{CK}\,(C_X+C_P+C_Q)\,V_{DD}^2}
$$

Three of the four nodes swing rail to rail every cycle. Power does not depend on a bias current.

> [!example] Razavi DC Ex. 5.20: the precharge current spike
> At the start of precharge three PMOS switches see $|V_{DS}|=|V_{GS}|=V_{DD}$ at once, so even narrow devices draw a large transient. A 4-bit flash with 16 StrongARMs, 5 fF per node, $V_{DD}=1$ V, behind a slow regulator: the bypass capacitor supplies $3\times5\ \text{fF}\times16\times1\ \text{V} = 240$ fC. For under 10 mV of droop, $C_b = 240\ \text{fC}/10\ \text{mV} = 24$ pF.

### StrongARM Kickback

- $P$ and $Q$ fall at **different rates** (because $V_{in1}\ne V_{in2}$) and couple to the inputs through $C_{GD1}$, $C_{GD2}$, worse once $M_1$, $M_2$ enter triode and $C_{GD}$ grows. On top of that, the tail switching kicks through $C_{GS}$.
- The input currents have both CM and differential parts (Razavi Fig. 7.16). The CM part matters through unequal source impedances; the DM part matters always.
- Kickback trades with input-pair size, and so with offset. A wider tail (faster) also kicks harder. Its **timing** matters: kickback that lands during the decision is the harmful part.

### Dynamic Offset and the Equalizing Switch

- If precharge is too short to bring $X$ and $Y$ (or $P$ and $Q$) exactly back to $V_{DD}$, the next decision starts with a stored $\Delta V$: **dynamic offset**, a memory of the last bit. Size the reset switches to settle in half a period (Razavi Ch. 7: $\Delta V_{PQ}<100$ µV before the next edge).
- An **equalizing switch** between $X$ and $Y$ (or $P$ and $Q$) removes dynamic offset and is slightly faster (nodes sit near $V_{DD}-|V_{THP}|$, ready to regenerate), but loses the initial gain, so the cross-pair offsets grow. Razavi prefers full precharge.
- Offset depends on tail current, so a moving input CM gives a moving offset.

### The SR Latch After It

```tikz title="During precharge both StrongARM outputs are high, which a NAND SR latch reads as 'hold'. When CK rises, X or Y falls and sets or resets the latch, so Q_out is valid for the whole cycle. After Razavi DC Fig. 5.43 and Nikolic Fig. 2."
\usepackage{circuitikz}
\usetikzlibrary{calc}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[draw,thick,minimum width=2.0cm,minimum height=2.2cm,align=center] (sa) at (0,0) {StrongARM};
  \draw (-1.0,0.3) -- ++(-0.7,0) node[left]{$V_{in1}$};
  \draw (-1.0,-0.3) -- ++(-0.7,0) node[left]{$V_{in2}$};
  \draw (0,-1.1) -- ++(0,-0.5) node[below]{$CK$};
  \draw (3.6,0.9) node[nand port](N1){};
  \draw (3.6,-0.9) node[nand port](N2){};
  \draw (1.0,0.5) -- ++(0.6,0) |- (N1.in 1); \node[above,font=\scriptsize] at (1.25,0.5) {$X=\overline{S}$};
  \draw (1.0,-0.5) -- ++(0.6,0) |- (N2.in 2); \node[below,font=\scriptsize] at (1.25,-0.5) {$Y=\overline{R}$};
  \draw (N1.out) -- ++(0.6,0) coordinate(o1) node[right]{$Q_{out}$};
  \draw (N2.out) -- ++(0.6,0) coordinate(o2) node[right]{$\overline{Q}_{out}$};
  \draw ($(N1.out)+(0.3,0)$) -- ++(0,-0.6) -- ($(N2.in 1)+(-0.2,0.4)$) -- ($(N2.in 1)+(-0.2,0)$) -- (N2.in 1);
  \draw ($(N2.out)+(0.3,0)$) -- ++(0,0.6) -- ($(N1.in 2)+(-0.2,-0.4)$) -- ($(N1.in 2)+(-0.2,0)$) -- (N1.in 2);
  \node[font=\scriptsize,align=left,anchor=west] at (-1.6,-2.9) {precharge: $X=Y=1$ $\Rightarrow$ hold previous bit\\ decide: one of $X,Y$ falls $\Rightarrow$ set or reset\\ never both low (the StrongARM guarantees it)};
\end{circuitikz}
\end{document}
```

- Both outputs are high in precharge, a meaningless state. A set-reset latch that **holds on (1,1)** keeps the last decision valid for the whole cycle. Razavi uses inverters driving NMOS pull-downs on a cross-coupled inverter pair (ratioed: the pull-downs must beat the PMOS); the classic sense-amp flip-flop drives a NAND SR latch directly.
- **The SR latch is often the speed bottleneck.** In the NAND latch one output always lags the other by a gate delay, and each output's delay depends on the other's load. Nikolić et al. replace it with a symmetric latch in which only one transistor per branch switches, giving equal rise and fall delays, more drive and no crowbar current (0.18 µm, sampling window under 100 ps).

> [!note]- Detail: the sense-amplifier flip-flop view (Nikolić et al., JSSC 2000)
> The StrongARM is the **pulse generator** of a flip-flop and the SR latch its **slave**. On the leading clock edge one SA output falls; afterwards the inputs no longer affect the SA nodes, which is what makes the pair edge-triggered rather than transparent. The original SAFF adds a small always-on NMOS between the two tail-side nodes so the low output stays actively held (not floating) if the data changes while the clock is high; leakage would otherwise charge it. The cost is that the whole differential tree discharges every cycle regardless of data. These are digital-flip-flop concerns (setup + clock-to-Q), but in a SerDes the data slicer *is* this flip-flop.

## Level 4: Metastability

### Why It Is Inevitable

The input is random, so it is sometimes arbitrarily close to the threshold. The latch then cannot grow it to a logic level in the time available. The output is not wrong so much as **undecided**, and an undecided level can be read differently by different downstream gates, causing gross errors (sparkle codes in a flash ADC, burst errors in a link).

$$
\boxed{\Delta t_{shift} = \tau_{reg}\ln\alpha\quad(\alpha=2:\ 0.69\,\tau_{reg};\ \alpha=10:\ 2.3\,\tau_{reg})}
$$

Each halving of the input delays the decision by $0.69\,\tau_{reg}$; the growth rate does not change.

### Sensitivity

Define metastable as "output below 90 % of its final value at the end of the allotted time $T_m$". The smallest input that still resolves is the **sensitivity**:

$$
\boxed{V_{sen} = \frac{V_{final}}{A_0}\,e^{-T_m/\tau_{reg}}}
$$

$A_0$ is the gain before regeneration ($g_mR_D$ for current steering, the mode-2 gain for the StrongARM).

> [!example] Razavi DC Ex. 6.6
> $I_{SS}R_D=300$ mV, $T_m = 50$ ps, $\tau_{reg}=5$ ps: the latch resolves an initial $V_{XY0}$ of $0.9\times300\ \text{mV}\times e^{-10}=0.012$ mV. The exponential dependence on $T_m/\tau_{reg}$ is the whole story.

### Error Rate

$$
\boxed{\text{uniform input over }\pm\Delta V:\quad P_{meta} = \frac{V_{sen}}{\Delta V}=\frac{0.9\,V_{final}}{A_0\,\Delta V}\,e^{-T_m/\tau_{reg}}}
$$

$$
\boxed{\text{Gaussian input, rms }\sigma:\quad P_{meta}\approx\frac{2V_{sen}}{\sqrt{2\pi}\,\sigma}}
$$

- The uniform estimate is optimistic by about 60 % compared with a Gaussian of $\Delta V = 3\sigma$ (ratio 0.41), because a Gaussian puts more of its samples near the threshold.
- Targets: $10^{-14}$ to $10^{-10}$ for ADCs; a link may not tolerate one error in $10^{10}$.
- Metastability and SNR are nearly **independent** specs: errors this rare cost no measurable SNR, but each one is a gross error.

> [!example] Razavi DC Ex. 6.7
> Current-steering comparator with $V_{OV}=100$ mV, the numbers of Ex. 6.6, and a Gaussian input of $\sigma = 200$ mV: $P_{meta} = 0.72\frac{V_{OV}}{\sigma}e^{-T_m/\tau_{reg}} = 0.72\times0.5\times e^{-10} = 1.6\times10^{-5}$. Far from $10^{-12}$: either more time or a smaller $\tau_{reg}$.

> [!note]- Derivation: from sensitivity to probability (Razavi DC §6.2.1–6.2.2)
> **Current steering.** Sensitivity is $V_{XY0}$ divided by the input-pair gain $g_mR_D$: $V_{sen} = (0.9I_{SS}/g_m)e^{-T_m/\tau}$. A uniform PDF of height $1/(2\Delta V)$ over a window $2V_{sen}$ gives $P = V_{sen}/\Delta V$, Razavi Eq. (6.38). For a Gaussian centred on the threshold the window is narrow, so approximate the area by a rectangle of height $1/(\sqrt{2\pi}\sigma)$ and width $2V_{sen}$: Eq. (6.40), $P=\frac{1}{\sqrt{2\pi}\sigma}\frac{1.8I_{SS}}{g_m}e^{-T_m/\tau}$. With $g_m = I_{SS}/V_{OV}$ this is $0.72(V_{OV}/\sigma)e^{-T_m/\tau}$.
>
> **StrongARM.** For small inputs, $P$/$Q$ and then $X$/$Y$ fall at a rate set by the tail current and node capacitances, nearly independent of the input, so the PMOS pair turns on at a fixed time $t_2$. From there $V_{XY}$ regenerates with the inverter pair's $\tau_{reg}$. With the pre-regeneration gain $A_0$ (input pair and $M_5$/$M_6$) and "metastable" meaning $V_{XY}<0.9V_{DD}$: Eq. (6.45),
> $$P_{meta} = \frac{0.9V_{DD}}{A_0\,\Delta V}e^{-T_m/\tau_{reg}}.$$
> A preamp of gain $A_1$ in front divides this by $A_1$ (Razavi Prob. 6.8). The StrongARM + SR-latch cascade has more complex metastability behaviour that Razavi leaves out.

### Measuring $\tau_{reg}$ in Simulation

- **Time shift:** simulate with input $\Delta V$ and $\Delta V/\alpha$; the curves are shifted by $\tau_{reg}\ln\alpha$. Razavi Ch. 7: 1 mV, 100 µV, 10 µV give 5.7 ps per decade, so $\tau_{reg}=5.7/\ln10=2.5$ ps.
- **Slope on a log axis:** $\tau_{reg}$ is the inverse slope of $\ln|V_{XY}|$ versus $t$.
- **Evans et al.:** near-zero input, pick $v_1$ on the regenerating output at $t_1$, find $t_2$ where it reaches $e\cdot v_1$: $\tau_{reg}=t_2-t_1$.
- Budget by decades: at a nominal delay $t_d$ for 1 mV, each decade less input costs $\tau_{reg}\ln10$, so an allotted $T$ resolves inputs down to $1\ \text{mV}/10^{n}$ with $n = (T-t_d)/(\tau_{reg}\ln10)$.

> [!warning] Simulation discipline (Razavi DC §7.6)
> Femtovolt inputs need perfect symmetry: the SR latch's stored state loads the two sides differently and biases the decision, so disconnect it (or tie its outputs to $V_{DD}$). Tighten the simulator: Razavi uses reltol $=10^{-6}$, vabstol $=10^{-6}$, iabstol $=10^{-12}$.

### Evans' Error-Rate Formula and Cascaded Latches

$$
\boxed{P_{error} = \frac{2V_L}{A_{UL}\,Q}\,e^{-T/\tau},\qquad\text{master-slave: }P_{error} = \frac{2V_L}{A_{UL1}A_{UL2}\,Q}\,e^{-T_1/\tau}e^{-T_2/\tau}}
$$

$Q$ = one LSB at the comparator input (assumes the input is uniform over a code), $V_L$ = the level the latch must reach, $A_{UL}$ = unlatched (pre-regeneration) gain, $T$ = time allowed. A second (slave) latch multiplies in a second exponential, which is why a latch stage usually follows the comparator before the bit is used.

> [!example] Evans et al. (Designer's Guide, 1997)
> $\tau = 65$ ps from simulation; ADC LSB 16 mV behind an autozero stage of gain 2.5, so $Q=40$ mV; $A_{UL}=4$; a slave of gain 4 needs 200 mV, so the master must reach $V_L=50$ mV; 320 MHz with half a cycle for logic, $T=1.56$ ns. $P = \frac{2(0.05)}{4(0.04)}e^{-24} = 2.4\times10^{-11}$ errors per sample.

> [!tip] Remark
> In a link the comparator's metastability rate is part of the BER budget, alongside the noise term ([[Signaling and BER#One Slicer and One Gaussian]]) and jitter ([[Link Noise and Jitter]]). Each extra latch stage multiplies in another $e^{-T/\tau}$, so the metastability term can be pushed far below the noise term, but only by spending latency.

## Level 5: Noise and Error Probability

### Noise Turns Into an Error Probability

```tikz title="Probability that the output is high versus input. The 50 % point is the offset; the slope is set by the input-referred noise. Carusone Ex. 10.1: 50 % at 3 mV, 90 % at 4.28 mV, so sigma = 1 mV. Curve drawn with a logistic approximation of the Gaussian CDF."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.42cm,y=4cm]
  \draw[->] (-10.5,0) -- (11,0) node[right]{$V_{in}$ (mV)};
  \draw[->] (-10,0) -- (-10,1.15) node[above]{$P(\text{high})$};
  \foreach \x in {-10,-5,0,5,10} \draw (\x,0) -- (\x,-0.02) node[below,font=\scriptsize]{\x};
  \foreach \y in {0.5,0.9,1} \draw (-10,\y) -- (-10.2,\y) node[left,font=\scriptsize]{\y};
  \draw[thick] (-10,0) -- (-2.5,0.0);
  \draw[thick,domain=-2.5:10,samples=100] plot (\x,{1/(1+exp(-1.702*(\x-3)))});
  \draw[dashed] (-10,0.5) -- (3,0.5) -- (3,0);
  \draw[dashed] (-10,0.9) -- (4.28,0.9) -- (4.28,0);
  \node[font=\scriptsize,anchor=west] at (3.3,0.42) {$V_{OS}=3$ mV};
  \node[font=\scriptsize,anchor=west] at (4.6,0.8) {$V_{OS}+1.28\sigma_n$};
  \draw[<->] (3,0.15) -- (10,0.15) node[midway,below,font=\scriptsize]{$7.03\sigma_n$ for $10^{-12}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{P(\text{wrong}\mid V_{in}) = Q\!\left(\frac{|V_{in}-V_{OS}|}{\sigma_n}\right)}
$$

- **Offset** = the 50 % point; **noise** = the spread around it. Measure them the same way in silicon: sweep the input slowly and record the fraction of highs.
- For an error rate $P_e$ the input must exceed the offset by $Q^{-1}(P_e)\,\sigma_n$: $7.03\sigma_n$ at $10^{-12}$.

> [!example] Carusone Ex. 10.1
> 50 % highs at 3 mV, 90 % at 4.28 mV. The 90 % point of a Gaussian is $1.2816\sigma$, so $\sigma_n=(4.28-3)/1.2816=1$ mV rms. At $10^{-12}$ the comparator reliably reports high above $3+7.03 = 10$ mV and low below $3-7.03 = -4$ mV.

> [!tip] Remark
> This is the slicer BER of [[Signaling and BER#One Slicer and One Gaussian]] seen from the comparator: there the noise is the channel's and the comparator's together, and "$V_{in}$" is half the eye height. The comparator's $\sigma_n$ adds in power to the front end's noise, and its offset is subtracted from the eye. The Gaussian amplitude PDF of thermal noise is in [[Noise#Average Power and rms]].

### Noise of a Resistively Loaded Sense Stage

$$
\boxed{\overline{V_{n,out}^2} = 2\left(4kTR_D+4kT\gamma g_mR_D^2\right)\ \text{per Hz},\qquad\text{total} = \frac{2(1+\gamma g_mR_D)\,kT}{C_L}}
$$

Integrate the white spectrum through the $R_DC_L$ pole, then divide by $(g_mR_D)^2$ for the input. When the stage switches off, its noise is **sampled** onto $X$, $Y$ with the signal; the latch pair then adds its own gate noise $4kT\gamma/g_{m1,2}$, referred through the same factor as its offset in [[#Uncontrolled Feedback Amplifies Its Own Offset]]. Design so the input-referred total is about 0.25 LSB.

> [!tip] Remark
> The integral is the $kT/C$ result with the transistor's excess term: see [[Noise#kT/C Noise]] and [[Noise#Noise Bandwidth]]. The same reasoning is why Wong et al. *limit* their link comparator's preamp bandwidth to about 1.1× the signal bandwidth ([[#Comparators in a SerDes Receiver]]).

### StrongARM Noise Is Integrated White Noise

The StrongARM has no steady state and no transfer function, so it is analysed in the time domain: in mode 2 each input device's noise current is **integrated** on $C_P$, and integrated white noise has a variance that grows linearly with time.

$$
\boxed{E\!\left[(V_P-V_Q)^2\right] = \frac{8kT\gamma g_m}{C_1I_{SS}}V_{THN}+\frac{2kT}{C_1}}\qquad
\boxed{\overline{v_{n,in}^2} = \frac{2kT}{C_1}\frac{V_{OV}}{V_{THN}}\left(\gamma+\frac{V_{OV}}{4V_{THN}}\right)}
$$

- The first term is the input pair, integrated until $P$/$Q$ reach $V_{DD}-V_{THN}$ (when $M_5$/$M_6$ turn on). The second is the precharge switches' $kT/C$.
- Referred to the input by the mode-2 gain $2g_mV_{THN}/I_{SS}$. Since $4\gamma V_{THN}$ is several times $V_{OV}$, the $kT/C$ term is small.
- **Knobs:** more $C_P$ (slower, more power), lower $V_{OV}$ (higher $g_m/I_D$), higher $V_{THN}$ (longer integration). Scaling $I_{SS}$, the widths and $C_1$ together by $k$ divides $\overline{v_n^2}$ by $k$: noise costs power, as in any thermal-noise-limited circuit.

> [!example] Razavi DC Ex. 6.10
> $C_1 = 5$ fF, $I_{SS}=200$ µA, $V_{OV}=200$ mV ($g_m = 1$ mS), $V_{THN}=300$ mV, $\gamma=1$: $V_{PQ,rms}=3.15$ mV, gain 3, so $v_{n,in}=1.05$ mV rms from the input pair alone.

> [!note]- Derivation: integrating white noise (Razavi DC §6.3)
> **Unit white noise.** If a spectrum is multiplied by $k$, the time waveform is multiplied by $\sqrt k$. A MOSFET's two-sided drain-noise density is $2kT\gamma g_m$, so $I_n(t) = \sqrt{2kT\gamma g_m}\,a(t)$ with $a(t)$ unit white noise.
>
> **Integrated white noise** (Itô): $E[(\int_0^t a\,dt')^2]=t$. A current $I_n$ into $C_1$ gives $V = \frac1{C_1}\int I_n$, variance $\frac{2kT\gamma g_m}{C_1^2}t$, growing linearly with time.
>
> **Mode 2.** $V_P$ and $V_Q$ each get this variance; the difference twice it. Integrate until $V_{P,Q}=V_{DD}-V_{THN}$, at $t = 2C_1V_{THN}/I_{SS}$:
> $$E[(V_P-V_Q)^2] = 2\cdot\frac{2kT\gamma g_m}{C_1^2}\cdot\frac{2C_1V_{THN}}{I_{SS}} = \frac{8kT\gamma g_m V_{THN}}{C_1I_{SS}}.$$
> Divide the rms by $2g_mV_{THN}/I_{SS}$: $v_{n,in} = \sqrt{2kT\gamma I_{SS}/(g_mC_1V_{THN})}$. Add $2kT/C_1$ (precharge of $P$ and $Q$) before referring, and substitute $I_{SS}/g_m = V_{OV}$ to get the boxed form. Stopping the integration when $M_5$/$M_6$ turn on is an approximation (Nuzzo et al. 2008 carry the later modes).

### Measuring Comparator Noise in Simulation

A comparator has no output noise and no gain to divide by. Use transient noise and count:
1. **Zero input**, many clock cycles: the outputs must split 50/50. This checks that the simulator adds no bias.
2. **Small constant input $V_S$**: count ZEROs $n_0$ and ONEs $n_1$; $n_0/(n_0+n_1) = \Phi(-V_S/\sigma_n)$.
3. Choose $V_S\approx\sigma_n$ (too small: the ratio is near 0.5 and needs many cycles; too large: almost no ZEROs). Adjust $V_S$ until **15.9 %** of the outputs are ZERO; then $V_S=\sigma_n$.

> [!warning] Correction to Razavi DC Ex. 6.12
> Razavi's Ch. 6 example takes the area of a Gaussian within $\pm\sigma$ as 0.63 and arrives at 18.5 % ZEROs. The area within $\pm\sigma$ is 0.683, so the correct fraction is $(1-0.683)/2 = 15.9$ %. His own Ch. 7 design uses 68 % and 16 %, which is right. Razavi's design: 16 ZEROs in 100 cycles at $V_S = 0.31$ mV, so $\sigma_n\approx0.31$ mV.

## Level 6: Offset Cancellation and Trim

**Rule of thumb** (Razavi §6.5): if an offset above about 10 mV is acceptable, size the devices (Pelgrom); below that, cancel it. Bigger devices cost input capacitance, kickback and power.

### Analog Storage Before a Comparator

$$
\boxed{\text{output storage: } V_{OS,in}=\frac{V_{OS2}}{A_0}\left(1+\frac{2C_{in}}{C_1}\right)}\qquad
\boxed{\text{input storage: } V_{OS,in}=\left(\frac{V_{OS1}}{1+A_0}+\frac{V_{OS2}}{A_0}\right)\left(1+\frac{2C_{in}}{C_1}\right)}
$$

- A preamp with offset storage cancels its own offset ($V_{OS1}$) and divides the comparator's ($V_{OS2}$) by its gain, reduced by the divider formed by the coupling cap $C_1$ and the comparator input $C_{in}$. So $C_1\gg C_{in}$.
- Costs: three phases per decision (store, amplify, latch), coupling-cap bottom-plate parasitics (≈5 %) load the preamp, and the storage circuit can be bigger than the comparator.
- **It must be repeated every cycle**: junction leakage of the reset switches drains the stored CM level (Razavi Ex. 6.14).
- One-stage preamps give $A_0$ of only 3 or 4, so the reduction is modest. **Digital trim is generally preferred.**

> [!tip] Remark
> The storage mechanics (switch networks, residuals, the auxiliary-amplifier variant, CDS) are owned by [[Nonlinearity and Mismatch#Level 4 Offset Cancellation]]. Only the $C_{in}$ attenuation and the every-cycle refresh are specific to comparators.

> [!note]- Detail: charge injection in switched comparators (Carusone §10.3)
> The reset switch on the amplifier input injects half its channel charge onto the storage capacitor: Carusone Ex. 10.3 finds −53 mV from channel charge plus −2.8 mV from overlap, against a ±2.5 mV resolution target. Fixes, all comparator-specific uses of [[Sampling Circuits#Channel Charge Injection]]:
> - **Advanced clock:** open the switch at the virtual-ground side ($\phi_{1a}$) slightly before the input-side switch, so only one switch's charge is signal-dependent.
> - **Fully differential:** the two reset switches' charges cancel to their mismatch, about 10× smaller.
> - **Multi-stage with staggered reset:** each stage's injection is stored on the next stage's coupling capacitor while that stage is still in reset. Only the last stage's injection remains, divided by the gains in front: Ex. 10.4, 56 mV$/(20\times20)$ = 140 µV.

### Digital Offset Trim

```tikz title="Digital offset cancellation: with the input shorted, a counter steps a binary-weighted current DAC into the preamp loads until the comparator output flips; the AND gate then freezes the code. After Razavi DC Figs. 6.22(f) and 6.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[draw,thick,minimum width=2.2cm,minimum height=2.0cm,align=center] (pre) at (0,1.0) {preamp\\ $A_0$, loads $R_D$};
  \draw (pre.west|-0,1.4) -- ++(-0.5,0) coordinate(i1);
  \draw (pre.west|-0,0.6) -- ++(-0.5,0) coordinate(i2);
  \draw (i1) -- (i2); \draw (-1.6,1.0) -- (-1.85,1.0) node[left]{$V_{CM}$};
  \node[font=\scriptsize,align=center] at (-1.6,2.2) {inputs\\ shorted};
  \draw (pre.east|-0,1.5) -- (1.8,1.5) coordinate(X) node[circ]{} node[above]{$X$} -- (5.0,1.5);
  \draw (pre.east|-0,0.5) -- (3.4,0.5) coordinate(Y) node[circ]{} node[above]{$Y$} -- (5.0,0.5);
  \draw (X) to[I,l_=$I_1$] (1.8,-1.2) node[ground]{};
  \draw (Y) to[I,l_=$I_2$] (3.4,-1.2) node[ground]{};
  \node[draw,minimum width=1.2cm,minimum height=1.4cm] (cmp) at (5.6,1.0) {cmp};
  \node[draw,minimum width=0.9cm,minimum height=0.7cm] (and) at (7.5,1.0) {\scriptsize AND};
  \draw[->] (cmp.east) -- (and.west);
  \draw[->] (7.5,2.4) node[above]{clock} -- (and.north);
  \node[draw,minimum width=2.0cm,minimum height=0.8cm,align=center] (cnt) at (5.6,-1.9) {counter\\ \scriptsize binary code};
  \draw[->] (and.south) |- (cnt.east);
  \draw[->,dashed] (cnt.west) -- (2.15,-0.2);
  \draw[->,dashed] (cnt.west) -- (3.75,-0.2);
  \node[font=\scriptsize] at (4.4,-0.6) {code};
  \node[font=\scriptsize,align=left,anchor=west] at (-1.8,-2.9) {code steps until cmp flips, then AND freezes it;\\ $I_1$, $I_2$ start at half scale and move differentially};
\end{circuitikz}
\end{document}
```

- Short the inputs, step a current DAC into one load (or differentially into both) until the comparator just flips, freeze the code. No capacitor in the signal path, so **calibrate once at power-up**, not every cycle, and it takes less area than analog storage in modern CMOS.
- The loop trims the **preamp + comparator cascade together**: it stops when the cascade is balanced, so the comparator's own offset is cancelled too (the preamp's alone is not exactly zero, but nobody needs it to be).
- **Range and LSB:**
$$\boxed{I_{FS}\ge\frac{V_{OS,out,max}}{R_D},\qquad I_u\le\frac{V_{res,out}}{R_D}}$$
Razavi Ex. 6.16: up to 30 mV at the output, $R_D=1$ kΩ, 5 mV residual: $I_{FS}\approx30$ µA, $I_u\le5$ µA, six or seven steps. Enlarge $I_{FS}$ if the comparator has its own offset.
- Two-sided trim ($I_1$ and $I_2$ moving differentially from mid-scale) handles either offset sign; the logic first decides the direction.

> [!example] Wong et al. (JSSC 2004): a link comparator
> 0.18 µm, 3.6 Gb/s receiver, 1.8 GHz quarter-rate samplers, 35 mV target sensitivity at 0.25 V input CM. Small devices (to save switching power) give **75 mV** of estimated mismatch offset; a binary-segmented current source steered by a fully switched pair (so the preamp's gain and RC are undisturbed) trims it to **5 mV**. Calibration: short the inputs and adjust the code until the output dithers between 0 and 1.

### Trimming a StrongARM: Unequal Load Capacitors

The StrongARM has no load resistor to inject a current into, but its gain comes from integrating onto $C_P$, $C_Q$, and a deliberate mismatch between them shifts the threshold:

$$
\boxed{V_{OS,in} = \frac{I_{SS}}{2g_{m1,2}}\left(\frac{C_P}{C_Q}-1\right) = \frac{1}{(g_m/I_D)_{1,2}}\,\frac{\Delta C}{C}}
$$

- Implement $C_P$, $C_Q$ (and optionally $C_X$, $C_Y$) as binary-weighted switched capacitors driven by counters. The gain from the input to $X$/$Y$ is larger than to $P$/$Q$, so an imbalance created at $X$/$Y$ is divided by more gain when referred to the input: a unit cap there is the finer step (the hint of Razavi Prob. 6.19).
- Costs: extra node capacitance slows the latch and raises $fCV^2$ power; the arrays take area when there are many comparators.

> [!note]- Derivation: Razavi DC Eqs. (6.73)–(6.79)
> With $V_{in1}=V_{in2}$, $V_P = V_{DD}-\frac{I_{SS}}{2}\frac{t}{C_P}$ and $V_Q = V_{DD}-\frac{I_{SS}}{2}\frac{t}{C_Q}$, so $V_{PQ}(t) = \frac{I_{SS}}{2}\frac{C_P-C_Q}{C_PC_Q}t$. Mode 2 lasts $t_1\approx 2C_PV_{THN}/I_{SS}$, giving $V_{PQ}(t_1)\approx(C_P/C_Q-1)V_{THN}$. Divide by the mode-2 gain $2g_mV_{THN}/I_{SS}$.

### A Latch with a Built-In Offset Knob

Carusone Fig. 10.19 (Cho and Gray): the cross-coupled pair is source-degenerated by triode devices whose gates are driven by $V_{in}^\pm$ and $V_{ref}^\pm$. The latch is balanced when

$$
\boxed{\Delta V_{in} = \frac{W_{3,6}}{W_{4,5}}\,\Delta V_{ref}}
$$

so $\Delta V_{ref}$ sets the threshold, and can be adjusted to cancel the latch's random offset. A rigorous model of all latch-offset sources is complex; Carusone also lists unequal $i_o$, $G_m$ and $R_LC_L$ between the half circuits (Fig. 10.17).

## Level 7: Thresholds and Slicers

### Every Trim Knob Is a Threshold Knob

Offset and threshold are the same thing: a comparator with offset $V_{OS}$ compares against $V_{ref}+V_{OS}$. So every mechanism above that *cancels* an offset can also *program* one:

| Mechanism | Threshold shift | Source |
|---|---|---|
| Reference input (ladder tap, DAC) | $V_{ref}$ directly | Razavi Ex. 5.4; flash ladders |
| Current DAC into preamp loads | $\Delta I\,R_D/(g_mR_D) = \Delta I/g_m$ | Razavi §6.5.2; Wong 2004 |
| Unequal StrongARM load caps | $\frac{1}{g_m/I_D}\frac{\Delta C}{C}$ | Razavi §6.5.3 |
| Degenerated latch with $V_{ref}$ inputs | $\frac{W_{3,6}}{W_{4,5}}\Delta V_{ref}$ | Carusone §10.4.2 |
| Mismatched / programmable-width input pair | Set by the bias or width ratio | Toifl et al. 2006 |

The trim range must then cover the **threshold plus** the random offset, and the trim LSB is the threshold resolution.

### PAM4 Needs Three Thresholds

```tikz title="A PAM4 eye has three sub-eyes; three slicers at the upper, middle and lower thresholds produce a thermometer code that decodes to two bits. After Toifl et al. Fig. 2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \y in {-1.5,-0.5,0.5,1.5} \draw[gray] (0,\y) -- (4,\y);
  \foreach \yc in {-1,0,1} {
    \draw[thick] (0.6,\yc) .. controls (1.2,\yc+0.6) and (2.8,\yc+0.6) .. (3.4,\yc);
    \draw[thick] (0.6,\yc) .. controls (1.2,\yc-0.6) and (2.8,\yc-0.6) .. (3.4,\yc);
  }
  \draw[dashed,red!70!black] (-0.3,1) -- (4.3,1) node[right]{$V_{TH,H}$};
  \draw[dashed,red!70!black] (-0.3,0) -- (4.3,0) node[right]{$V_{TH,M}$};
  \draw[dashed,red!70!black] (-0.3,-1) -- (4.3,-1) node[right]{$V_{TH,L}$};
  \node[font=\scriptsize,left] at (0,1.5) {$+3$};
  \node[font=\scriptsize,left] at (0,0.5) {$+1$};
  \node[font=\scriptsize,left] at (0,-0.5) {$-1$};
  \node[font=\scriptsize,left] at (0,-1.5) {$-3$};
  \node[draw,minimum width=1.2cm] (c1) at (7.6,1) {\scriptsize cmp $H$};
  \node[draw,minimum width=1.2cm] (c2) at (7.6,0) {\scriptsize cmp $M$};
  \node[draw,minimum width=1.2cm] (c3) at (7.6,-1) {\scriptsize cmp $L$};
  \draw (6.2,1.6) node[above]{$V_{in}$} -- (6.2,-1) -- (c3.west);
  \draw (6.2,1) -- (c1.west); \draw (6.2,0) -- (c2.west);
  \node[draw,minimum width=1.3cm,minimum height=2.4cm,align=center] (dec) at (10.0,0) {\scriptsize thermo\\ \scriptsize to\\ \scriptsize binary};
  \draw[->] (c1.east) -- (dec.west|-c1.east);
  \draw[->] (c2.east) -- (dec.west|-c2.east);
  \draw[->] (c3.east) -- (dec.west|-c3.east);
  \draw[->] (dec.east) -- ++(0.6,0) node[right]{2 bits};
\end{circuitikz}
\end{document}
```

- Each slicer's threshold sits in the middle of one sub-eye. With levels $\pm1$, $\pm3$ the thresholds are $0$ and $\pm2$: the middle one is the NRZ case, the outer two need a programmed shift of $\pm\tfrac23$ of the peak amplitude, plus their own offset trim. This is a 2-bit flash ADC ([[Flash ADCs]]).
- Each sub-eye is $\tfrac13$ of the NRZ eye ([[Signaling and BER#PAM4 SER and BER]]), so the comparator's offset and noise budgets shrink by 3× too.
- Toifl et al. (22 Gb/s PAM4, 90 nm SOI) use one **voltage-shifting amplifier** per slice (a differential pair with digitally programmable effective width on one side, so the equalization zero does not move with the shift), then a second stage per latch that adds small currents for per-latch offset trim (3 bits + sign over 25 mV).

> [!note]- Detail: the voltage-shift options in Toifl et al.
> (a) A double differential pair summing the input with a DAC voltage: good CM and supply rejection, but half the current in the input devices (less gain), extra output capacitance (less bandwidth), and a large voltage DAC. (b) A pair deliberately mismatched by its bias-current ratio. (c) Their choice: switched parallel input devices that program the effective $W$ on one side; it keeps (b)'s gain and CMRR and combines cleanly with capacitive source degeneration. They also compare a CML sampling latch with a sense-amp latch: the sense-amp latch has a narrower sensitivity window (better time resolution), but a DC sensitivity of 8.2 mV versus 2.6 mV for the CML path, i.e. the CML path has more gain in front of the decision.

### Comparators in a SerDes Receiver

The receiver-level design lives in [[Receivers]]; these are the comparator-level points it relies on.

- **Reset removes ISI memory.** Wong et al. reset their preamp for half of every cycle, which "essentially eliminates any ISI from the previous bits", and add a booster that pulls the regeneration nodes low one inverter delay after the latch fires, speeding regeneration by 10 % and reset by 15 % and reducing data-dependent kickback.
- **Limit the bandwidth for noise.** The preamp is followed by an RC low-pass set to 2 GHz (about 10 % above the maximum signal frequency); the R is a scaled copy of the termination-calibrated resistor so the corner tracks PVT. Pseudo-differential inputs turn CM noise into differential noise, which the filter then cuts.
- **Supply noise becomes input noise** when mismatch unbalances the comparator: a 10 % supply change gave 8 mV input-referred (Wong).
- **The slicer is a flip-flop.** It must also meet setup/hold and clock-to-Q; the SR latch is often the slowest part ([[#The SR Latch After It]]).

## Level 8: Design Study: 5 GHz StrongARM in 28 nm

Razavi DC Ch. 7. Targets: $V_{OS}<5$ mV, $f_{CK}=5$ GHz, $P\le1$ mW; then check metastability, noise and kickback. Simulate at the slow-slow corner, $V_{DD}=0.95$ V, 75 °C, 50 % duty, 10 ps clock edges. (Razavi's Ch. 7 numbers the NMOS cross pair $M_3$/$M_4$, the PMOS pair $M_5$/$M_6$ and the tail $M_7$; below they are converted to this note's Ch. 5 labels.)

1. **Input pair from offset.** $A_{VT}\approx2.2$ mV·µm: $W_{1,2}=10$ µm, $L_{eff}=25$ nm gives 4.4 mV (1σ: only 68 % of parts are inside it; a real yield needs more area or trim).
2. **Tail as a switch.** With $V_{in,CM}=0.5$ V and $V_{GS1,2}\approx0.35$ V, $V_{DS,T}\approx0.15$ V: deep triode. $W_T=2$ µm for about 0.5 mA. It is a switch, not a current source.
3. **Cross pairs.** NMOS pair 10 µm at first (its offset is divided by 3 to 5), PMOS pair 2.5 µm (it turns on last, so its offset is divided by the most gain). Precharge switches 0.5 µm to settle in 100 ps.
4. **Read the waveforms** with a 1 mV input ("slow motion"): $X$, $Y$ drop about 400 mV in common mode before they diverge; the tail current peaks near 800 µA and collapses as the input pair enters triode; $V_P-V_Q$ peaks at 3.15 mV (gain 3.15) before the NMOS pair turns on and is below 100 µV by the next edge (no dynamic offset). Speed metric: time from the clock's 50 % point to $|V_X-V_Y|=200$ mV: 36 ps.
5. **Optimize.** Inject each pair's $\Delta V_{TH}$ as a gate source and find the input that rebalances it. NMOS pair at 10 µm: 4.4 mV → 1.15 mV at the input (÷3.8). Halving it to 5 µm: 28 ps, offset 4.6 mV total, a free win. PMOS pair: 8.8 mV → 0.9 mV; doubling it does **not** help (its capacitance lowers the gain before it). Total **4.7 mV**. Doubling the tail: 22 ps, same signal-path power ($2f_{CK}C_PV_{DD}^2+f_{CK}C_XV_{DD}^2$) but more clock power and kickback.
6. **SR latch.** Pull-downs and inverter PMOS widened to 800 nm: 6 ps less delay. Whole comparator about **0.2 mW** at 5 GHz.
7. **Metastability.** 1 mV, 100 µV, 10 µV inputs shift by 5.7 ps per decade: $\tau_{reg}=2.5$ ps. Widening the PMOS pair to 5 µm raises $\tau_{reg}$ slightly: its capacitance grows faster than its $g_m$. With 22 ps nominal delay and 100 ps half-period, $n = 78/(2.5\ln10)\approx13.5$ decades: inputs above about $1\ \text{mV}/10^{13.5}$ resolve.
8. **Noise.** Transient noise, 100 cycles: zero input gives 50 ZEROs; $V_S = 0.31$ mV gives 16, so $\sigma_n\approx0.31$ mV.
9. **Kickback.** Simulated input currents show CM and DM parts; the burst right at the clock edge is the harmful one because it coincides with the decision.

> [!warning] Typo in Razavi DC §7.6
> The text gives the regeneration time constant as "$g_{m5,6}/C_X$". It is $C_X/g_{m5,6}$ (a time), consistent with Eq. (5.19) for $g_mr_O\gg1$.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ Input-pair area $WL$ | Offset ($\propto1/\sqrt{WL}$) | Input capacitance, kickback, $C_P$ (slower, more $fCV^2$) |
| ↑ Input-pair $g_m/I_D$ (lower $V_{OV}$) | StrongARM gain $(g_m/I_D)V_{THN}$, noise, $\Delta\beta$ offset | Width and capacitance; less current per area (slower integration) |
| ↑ $C_P$, $C_Q$ | StrongARM noise ($\propto1/C$) | Speed, power, kickback window |
| ↑ Tail width / current | Speed (faster mode 2) | Clock power, kickback; offset varies with CM |
| Preamp in front ($A_1$) | Latch offset and noise ÷ $A_1$, kickback isolation, metastability ÷ $A_1$ | Static power, its own offset, bandwidth ($A_1\lesssim10$) |
| Short $L$, low $g_m/I_D$ in the latch | $\tau_{reg}\propto L^2/(\mu V_{OV})$ | Mismatch of the latch pair (divided by gain in front) |
| Widen latch pair | Only if external load dominates $C_X$ | If self-loaded, $\tau_{reg}$ rises |
| More latch time / extra latch stage | $P_{meta}\propto e^{-T/\tau}$, each stage multiplies | Latency |
| Precharge vs equalize | Precharge: initial gain, low offset | Equalize: faster, no dynamic offset, but more offset |
| Analog offset storage | Cancels preamp offset | Three phases, caps in signal path, refresh every cycle |
| Digital trim | Once at power-up, no caps in path, small | Needs calibration logic; drifts with temperature |
| Bandwidth limit before the latch | Integrated noise | Must still pass the signal (ISI) |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Offset referral | $V_{OS} = V_0/A_0$; $V_{OS,in}^2 = V_{OS,1}^2+V_{OS,2}^2/A_1^2$ |
| Op-amp-cascade time constant | $\tau_{total}\approx2nA_0C_{gs}/g_m\approx\tfrac43nA_0L^2/(\mu_nV_{eff})$ |
| Regeneration | $V_{XY}=V_{XY0}e^{t/\tau_{reg}}$, $\tau_{reg}=\frac{R_DC_L}{g_mR_D-1}\approx C_L/g_m$ |
| Latch load | $C_L = C_{GS}+C_{DB}+4C_{GD}$ |
| Complementary latch | $\tau_{reg}=\frac{r_{ON}\|r_{OP}}{(g_{mN}+g_{mP})(r_{ON}\|r_{OP})-1}C_L$ |
| Technology form | $\tau_{ltch}\approx K_3L^2/(\mu_nV_{eff})$, $K_3\approx2$–4; $T = \tau\ln(\Delta V_{logic}/\Delta V_0)$ |
| Latch self-offset | $V_X-V_Y = \frac{g_mR_D}{g_mR_D-1}\Delta V_{TH}$ |
| Preamp + latch offset | $\Delta V_{TH4}^2+\left(\frac{I_{SS}\Delta R_D}{2g_{m4}R_D}\right)^2+\left(\frac{g_{m1}\Delta V_{TH1}}{g_{m4}(g_{m1}R_D-1)}\right)^2$ |
| Capacitive-load pair gain | $-\frac{g_m}{C_D}t$; at saturation edge $2\frac{V_{DD}-(V_{CM}-V_{TH})}{V_{OV}}$ |
| StrongARM initial gain | $A_0=\frac{2g_m}{I_{SS}}V_{THN}=(g_m/I_D)V_{THN}$ |
| PMOS-pair offset (step 2) | $V_{OS}^2=\Delta V_{TH1,2}^2+\Delta V_{TH3,4}^2\frac{I_{SS}^2}{4g_{mN}^2V_{THP}^2}$ |
| StrongARM power | $P\approx f_{CK}(C_X+C_P+C_Q)V_{DD}^2$ |
| Metastability shift | $\Delta t = \tau_{reg}\ln\alpha$ ($0.69\tau$ per halving) |
| Sensitivity | $V_{sen}=\frac{V_{final}}{A_0}e^{-T_m/\tau}$ |
| Metastability rate | uniform: $V_{sen}/\Delta V$; Gaussian: $2V_{sen}/(\sqrt{2\pi}\sigma)$ |
| Evans | $P=\frac{2V_L}{A_{UL}Q}e^{-T/\tau}$; master-slave $\frac{2V_L}{A_{UL1}A_{UL2}Q}e^{-T_1/\tau}e^{-T_2/\tau}$ |
| Noise → error | $P=Q(\lvert V_{in}-V_{OS}\rvert/\sigma_n)$; $7.03\sigma_n$ at $10^{-12}$ |
| Resistive sense noise | $2(1+\gamma g_mR_D)kT/C_L$ at the output |
| StrongARM noise | $\overline{v_{n,in}^2}=\frac{2kT}{C_1}\frac{V_{OV}}{V_{THN}}\left(\gamma+\frac{V_{OV}}{4V_{THN}}\right)\approx\frac{4kT\gamma}{(g_m/I_D)C_1V_{THN}}$ |
| Noise simulation | $V_S=\sigma_n$ when 15.9 % of outputs are wrong |
| Output / input offset storage | $\frac{V_{OS2}}{A_0}(1+\frac{2C_{in}}{C_1})$; $\left(\frac{V_{OS1}}{1+A_0}+\frac{V_{OS2}}{A_0}\right)(1+\frac{2C_{in}}{C_1})$ |
| Trim DAC | $I_{FS}\ge V_{OS,out,max}/R_D$, $I_u\le V_{res,out}/R_D$ |
| StrongARM cap trim | $V_{OS,in}=\frac{I_{SS}}{2g_m}\left(\frac{C_P}{C_Q}-1\right)$ |
| Degenerated-latch threshold | $\Delta V_{in}=\frac{W_{3,6}}{W_{4,5}}\Delta V_{ref}$ |

## References

- **Razavi, *Analysis and Design of Data Converters*, 2025** (PDF page = printed + 19)
  - Ch. 5 Comparator Design Principles, pp. 70–101: offsets (§5.1), basic concepts and thermometer code (§5.2), positive feedback in frequency and time domain, $\tau_{reg}$, complementary pair (§5.3), controlled positive feedback (§5.4), simple and current-steering comparators (§5.5–5.6), offset, speed, noise and kickback parameters (§5.7), StrongARM build-up, modes, properties, power, Ex. 5.20, kickback, RS latch (§5.8).
  - Ch. 6 Advanced Comparator Concepts, pp. 102–128: mismatch and Pelgrom (§6.1, used only for links), metastability in current-steering and StrongARM comparators, Ex. 6.6–6.8 (§6.2), StrongARM noise in the time domain, Ex. 6.10–6.11 (§6.3), noise simulation (§6.4), analog, digital and StrongARM offset cancellation (§6.5), problems 6.8, 6.19.
  - Ch. 7 Design Study of a Comparator, pp. 129–141: device sizing, waveforms, offset and speed optimization, RS latch, metastability, noise and kickback simulations.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): Ch. 10 Comparators, pp. 413–439: specs, offset and noise, hysteresis (§10.1), op-amp comparators and offset storage, Ex. 10.2 (§10.2), charge injection, advanced clocks, multi-stage storage, Ex. 10.3–10.5 (§10.3), latched comparators, latch time constant, metastability, latch offset and the Cho–Gray latch, Ex. 10.6 (§10.4), CMOS/BiCMOS examples and charge trapping (§10.5). Bipolar examples (§10.6) skimmed only.
- **W. Evans et al., "Comparator Metastability Analysis," Designer's Guide Community, 1997**: latch model, $\tau$ from the $e$-fold time, error rate Eq. (15), worked example Eq. (16), master-slave Eq. (17).
- **B. Nikolić et al., "Improved Sense-Amplifier-Based Flip-Flop: Design and Measurements," IEEE JSSC, vol. 35, no. 6, pp. 876–884, June 2000**: SAFF operation (§II–III), the SR latch as the bottleneck and the symmetric slave latch (§IV).
- **K.-L. J. Wong et al., "A 27-mW 3.6-Gb/s I/O Transceiver," IEEE JSSC, vol. 39, no. 4, April 2004** (`ref/SerDes/voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`), §IV-A–B: bandwidth-limited preamp, digital offset trim 75 → 5 mV, reset against ISI, booster, supply noise, SR latch.
- **T. Toifl et al., "A 22-Gb/s PAM-4 Receiver in 90-nm CMOS SOI Technology," IEEE JSSC, vol. 41, no. 4, April 2006** (`ref/SerDes/22Gbps_PAM4_rx_toifl_jssc_2006.pdf`), §II–III-B: three slicers per threshold, voltage-shifting amplifier, per-latch offset trim, CML vs sense-amp latch sensitivity.
- **Zettelkasten** (`AnalogTheory/S19 Comparators.md` and `Comparators/`): used as a reading-order check (it follows Razavi DC Ch. 5–7); extensions taken from 19j2 (mode-3 regeneration exists only through the tail-node capacitance) and from its link note to S13 (regeneration as the oscillator start-up condition with a real loop gain).
