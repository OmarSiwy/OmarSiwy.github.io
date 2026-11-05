---
title: Operational Amplifiers
description: The op amp as a high-gain differential amplifier built for feedback, from closed-loop specs through one-stage, two-stage and gain-boosted topologies to common-mode feedback, slewing, supply rejection and noise.
kind: topic
status: growing
aliases:
  - Operational Amplifiers
  - Op Amps
  - Op Amp
  - OTA
---

An op amp is a "high-gain differential amplifier" that only exists to sit inside a feedback loop. Every spec it has comes from what the closed loop needs. The note opens with the op amp as a black box (gain, bandwidth, swing, the closed-loop numbers they set), then goes up the topology ladder: one stage, cascode, folded cascode, two stages, gain boosting. Then it covers what a fully differential op amp can't work without (common-mode feedback), and finally the large-signal and second-order effects: input range, slewing, supply rejection, noise. Stop after any section and the picture is still correct, just coarser.

## The big picture

```tikz title="An op amp in feedback: the loop trades the huge, poorly controlled open-loop gain A_0 for an accurate closed-loop gain 1/beta, and the bandwidth grows by the same factor (gain x bandwidth = omega_u). After Razavi Figs. 9.2, 9.4 and Ex. 9.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[op amp](A){};
  \draw (A.+) -- ++(-2.2,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (A.out) -- ++(0.6,0) coordinate(O) -- ++(0.6,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (A.-) -- ++(-0.4,0) coordinate(N) -- ++(0,1.3) coordinate(T) to[R,l=$R_1$] (T -| O) -- (O);
  \draw (N) to[R,l_=$R_2$] ++(-1.8,0) node[ground,rotate=-90]{};
  \node[font=\scriptsize,align=left,anchor=north west] at (-1.9,-2.3) {$\beta=\dfrac{R_2}{R_1+R_2}$, loop gain $\beta A$};
  \begin{scope}[xshift=4.6cm,yshift=-2cm]
    \draw[->] (0,0) -- (6.6,0) node[right]{$\omega$ (log)};
    \draw[->] (0,0) -- (0,4.3) node[above]{$|A|$ (dB)};
    \draw[thick] (0,3.6) -- (1.4,3.6) -- (5,0);
    \draw[dashed] (0,1.6) -- (3.4,1.6);
    \draw[thick,red] (0,1.6) -- (3.4,1.6) -- (5,0);
    \node[left,font=\scriptsize] at (0,3.6) {$A_0$};
    \node[left,font=\scriptsize] at (0,1.6) {$1/\beta$};
    \draw[dotted] (1.4,3.6) -- (1.4,0) node[below,font=\scriptsize]{$\omega_0$};
    \draw[dotted] (3.4,1.6) -- (3.4,0) node[below,font=\scriptsize]{$\beta\omega_u$};
    \node[below,font=\scriptsize] at (5,0) {$\omega_u=A_0\omega_0$};
    \node[font=\scriptsize,anchor=west] at (3.0,2.6) {open loop, $-20$ dB/dec};
    \node[font=\scriptsize,red,anchor=west] at (0.2,1.25) {closed loop};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The results the rest of the note refines
> 1. **Gain buys precision, not amplification:** the closed-loop gain error is $\approx 1/(\beta A_0)$. A 1% error at a closed-loop gain of 10 needs $A_0 > 1000$.
> 2. **Bandwidth buys settling:** with one pole the closed loop settles with $\tau = 1/(\beta\omega_u)$. Settling to error $\epsilon$ takes $\tau\ln(1/\epsilon)$ ($4.6\tau$ for 1%).
> 3. **One-stage gain $= G_mR_{out}$.** Cascoding multiplies $R_{out}$ by $g_mr_o$, but every stacked device costs one overdrive of output swing. Gain and swing fight.
> 4. **Two stages split the fight:** stage 1 makes gain, stage 2 (common source) makes swing. The price is a second pole, so it needs compensation ([[Stability]]).
> 5. **Fully differential = twice the swing, no mirror pole, no even harmonics**, but differential feedback cannot set the output common-mode level, so it **needs common-mode feedback (CMFB)**.
> 6. **Slewing:** the output can't move faster than $SR = I_{max}/C$. A step of size $V$ slews if $V/\tau > SR$; slew rate costs current.

**Map:** [[#Level 0 The Op Amp as a Black Box|black box: gain, bandwidth, swing]] → [[#Level 1 One-Stage Op Amps|one stage: simple, telescopic, folded, current-mirror]] → [[#Level 2 Two-Stage Op Amps|two stages]] → [[#Level 3 Gain Boosting|gain boosting]] → [[#Choosing a Topology|comparison]] → [[#Level 4 Fully Differential Op Amps and Common-Mode Feedback|fully differential, CMFB]] → [[#Level 5 Large-Signal and Second-Order Behaviour|input range, slew rate, PSRR, noise]] → [[#Level 6 Nanometer Reality|nanometer reality]].

## Level 0: The Op Amp as a Black Box

### Gain Sets the Gain Error

$$
\boxed{\frac{V_{out}}{V_{in}} = \frac{A_0}{1+\beta A_0} \approx \frac{1}{\beta}\left(1-\frac{1}{\beta A_0}\right), \qquad \beta = \frac{R_2}{R_1+R_2}}
$$

- The relative gain error is $1/(\beta A_0)$. For $1+R_1/R_2 = 10$ and 1% error: $A_0 > 1000$ (Razavi Ex. 9.1).
- Compare an open-loop CS stage with $g_mR_D = 10$: mobility, $t_{ox}$ and resistor spread give >20% error. Feedback makes the gain a **ratio** of matched parts.
- "High gain" means whatever the application needs, roughly $10^1$ to $10^5$. In many feedback circuits the *linearity* target, not the gain-error target, sets $A_0$.

> [!tip] Remark
> This is the closed-loop gain of [[Feedback#Closed-loop gain and loop gain]] with loop gain $\beta A_0$. Everything feedback buys (desensitization, impedance change, linearity) is divided out by $1+\beta A_0$.

> [!note]- Detail: swapping the inputs gives a right-half-plane pole (Razavi Ex. 9.3)
> With positive feedback the one-pole closed loop becomes
> $$\frac{V_{out}}{V_{in}} = \frac{-A_0}{1-\beta A_0 + s/\omega_0}, \qquad \text{pole at } s = +(\beta A_0-1)\,\omega_0$$
> a pole in the right half plane. The step response grows as $e^{t/\tau}$ until the output saturates. It looks like a ramp to a rail, not an oscillation.

> [!note]- Detail: capacitive feedback adds no pole (Razavi §11.6.1, via Zettelkasten 8a3)
> With resistors $R_1, R_2$ and op-amp input capacitance $C_{in}$, the feedback factor has a pole: $\beta(s) = \frac{R_1}{R_1+R_2}\cdot\frac{1}{1+s(R_1\|R_2)C_{in}}$. Razavi's example ($R_1 = 50$ kΩ, $R_2 = 100$ kΩ, $C_{in}=50$ fF) puts it at 95 MHz, next to the crossover. Shrinking the resistors moves it up but loads the output and cuts $A_0$.
> With capacitors $C_1$ (input) and $C_2$ (feedback) every branch has the same $1/s$, so
> $$\beta = \frac{C_2}{C_1+C_2+C_{in}}$$
> is frequency-independent. This is why switched-capacitor circuits use OTAs with purely capacitive feedback.

### Bandwidth Sets the Settling Time

For a one-pole op amp $A(s) = A_0/(1+s/\omega_0)$, unity-gain bandwidth $\omega_u = A_0\omega_0$:

$$
\boxed{\tau = \frac{1}{(1+\beta A_0)\,\omega_0} \approx \frac{1}{\beta\,\omega_u}, \qquad t_{\epsilon} = \tau\ln\frac{1}{\epsilon}}
$$

- The closed loop is still one-pole; both its gain and its time constant drop by $1+\beta A_0$.
- Example (Razavi Ex. 9.2): closed-loop gain 10, 1% settling in 5 ns → $\tau = 1.09$ ns → $\omega_u = 9.21$ Grad/s (1.47 GHz).
- The required bandwidth scales with **both** the settling accuracy and the closed-loop gain $1/\beta$.

> [!tip] Remark
> Same result as [[Frequency Response#Level 3 Gain-Bandwidth Trade-Offs|one-pole GBW]]: gain × bandwidth is fixed, so a closed-loop gain of $1/\beta$ leaves a bandwidth of $\beta\omega_u$.

### The Other Parameters

> [!tip] Remark
> Output swing, linearity, noise and offset, supply rejection and large-signal speed are defined once, with what sets each and which $g_m/I_D$ knob it fixes, in [[Single-Stage#Amplifier Specifications]]. What is op-amp-specific about them (measured swing, input CM range, slewing per topology, PSRR of the 5T OTA, noise per topology) is in [[#Level 5 Large-Signal and Second-Order Behaviour]].

> [!tip] Remark
> Swing and noise trade directly: lowering the overdrive of a current-source load frees headroom, but $g_m = 2I_D/V_{OV}$ rises and so does its drain noise current (see [[MosFETs#Transconductance]]).

## Level 1: One-Stage Op Amps

A one-stage op amp converts voltage to current **once**: the input pair's small-signal current flows straight into the output impedance.

$$
\boxed{|A_v| = G_m R_{out}}
$$

Every topology below either raises $R_{out}$ (cascoding, gain boosting) or rearranges where the headroom goes (folding). The load capacitance $C_L$ sets the dominant pole, so these are **OTAs**: high output impedance, compensated by the load.

### The Simple Op Amp

```tikz title="The two simplest op amps. Both have gain g_mN(r_oN || r_oP); the single-ended one carries a mirror pole at X, the differential one doesn't but needs CMFB. After Razavi Fig. 9.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\on in {0/{$V_{out}$},7.2/{$V_{out2}$}} {
  \begin{scope}[xshift=\ox cm]
  \draw (0,0) node[nmos](M1){} (3,0) node[nmos,xscale=-1](M2){};
  \draw (0,2.2) node[pmos,xscale=-1](M3){} (3,2.2) node[pmos](M4){};
  \node[font=\scriptsize,left] at ([yshift=0.3cm]M3.D) {$M_3$};
  \node[font=\scriptsize,right] at ([yshift=0.3cm]M4.D) {$M_4$};
  \node[font=\scriptsize,right] at ([yshift=-0.3cm]M1.D) {$M_1$};
  \node[font=\scriptsize,left] at ([yshift=-0.3cm]M2.D) {$M_2$};
  \draw (M1.D) -- (M3.D) (M2.D) -- (M4.D);
  \draw (M3.S) -- (M4.S);
  \node[above] at (1.5,{2.97}) {$V_{DD}$};
  \draw (M3.G) -- (M4.G);
  \draw (M1.S) -- (M2.S);
  \draw (1.5,{-0.77}) node[circ]{} to[I,l=$I_{SS}$] (1.5,-2.3) node[ground]{};
  \draw (M1.G) node[left]{$V_{in1}$} (M2.G) node[right]{$V_{in2}$};
  \draw (M2.D) ++(0,0.4) node[circ]{} -- ++(1.0,0) node[ocirc]{} node[right]{\on};
  \end{scope}
  }
  % (a) diode connection
  \draw (1.5,2.2) |- (0,1.2) node[circ]{};
  \node[font=\scriptsize,anchor=west] at (-0.2,1.0) {$X$};
  \node[font=\scriptsize] at (1.5,-3.1) {(a) single-ended: mirror pole at $X$};
  % (b) bias + second output
  \draw (8.7,2.2) -- ++(0,-0.5) node[below]{$V_b$};
  \draw (7.2,0.8) node[circ]{} -- ++(-1.0,0) node[ocirc]{} node[left]{$V_{out1}$};
  \node[font=\scriptsize] at (8.7,-3.1) {(b) differential: no mirror pole, needs CMFB};
  \node[font=\small] at (5.1,-3.8) {both: $A_v = g_{mN}(r_{oN}\parallel r_{oP})$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = g_{mN}(r_{oN}\|r_{oP})}
$$

- This hardly exceeds 10 in nanometer processes.
- The mirror pole at $X$ in (a) matters for stability in feedback ([[Stability]]); (b) avoids it.

> [!tip] Remark
> These are the active-load pairs of [[Differential Amplifiers#Level 5 The Active-Load Pair (Five-Transistor OTA)|the five-transistor OTA]] and [[Differential Amplifiers#Level 4 MOS Loads|the current-source-loaded pair]]. Nothing new in the circuit, only in how it is used.

**As a unity-gain buffer** (Razavi Ex. 9.4, (a) with output tied to the inverting input):

$$
\boxed{V_{ISS}+V_{GS1} \le V_{in} \le V_{DD}-|V_{GS3}|+V_{TH1}, \qquad R_{out,cl} = \frac{r_{oP}\|r_{oN}}{1+g_{mN}(r_{oP}\|r_{oN})} \approx \frac{1}{g_{mN}}}
$$

- With $V_{TH} = 0.3$ V and every overdrive 0.1 V on a 1-V supply: input range 0.5 to 0.9 V, only 0.4 V.
- The closed-loop output impedance barely depends on the open-loop one. So you can design for very high $R_{out}$ (gain) and feedback still delivers a low $R_{out}$. Driving $C_L$, the closed-loop output pole is $\approx g_{mN}/C_L$.

### Telescopic Cascode

```tikz title="Fully differential telescopic cascode. Five overdrives (tail, input, two cascodes, load) are stacked between the rails; what is left is the swing. After Razavi Figs. 9.8(b) and 9.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){} (3,0) node[nmos,xscale=-1](M2){};
  \draw (0,1.8) node[nmos,xscale=-1](M3){} (3,1.8) node[nmos](M4){};
  \draw (0,3.6) node[pmos,xscale=-1](M5){} (3,3.6) node[pmos](M6){};
  \draw (0,5.4) node[pmos,xscale=-1](M7){} (3,5.4) node[pmos](M8){};
  \foreach \m/\n in {M1/M3,M3/M5,M5/M7,M2/M4,M4/M6,M6/M8} {}
  \draw (M1.D) -- (M3.S) (M3.D) -- (M5.D) (M5.S) -- (M7.D);
  \draw (M2.D) -- (M4.S) (M4.D) -- (M6.D) (M6.S) -- (M8.D);
  \draw (M7.S) -- (M8.S); \node[above] at (1.5,6.17) {$V_{DD}$};
  \draw (M1.S) -- (M2.S);
  \draw (1.5,-0.77) node[circ]{} to[I,l=$I_{SS}$] (1.5,-2.3) node[ground]{};
  \node[font=\scriptsize,right] at (M1.center) {$M_1$};
  \node[font=\scriptsize,left] at (M2.center) {$M_2$};
  \foreach \m/\l in {M3/3,M5/5,M7/7} \node[font=\scriptsize,left] at ([xshift=-0.05cm]\m.D |- \m.center) {$M_\l$};
  \foreach \m/\l in {M4/4,M6/6,M8/8} \node[font=\scriptsize,right] at ([xshift=0.05cm]\m.D |- \m.center) {$M_\l$};
  \draw (M3.G) -- (M4.G); \node[above,font=\scriptsize] at (1.5,1.8) {$V_{b1}$};
  \draw (M5.G) -- (M6.G); \node[above,font=\scriptsize] at (1.5,3.6) {$V_{b2}$};
  \draw (M7.G) -- (M8.G); \node[above,font=\scriptsize] at (1.5,5.4) {$V_{b3}$};
  \draw (M1.G) node[left]{$V_{in1}$} (M2.G) node[right]{$V_{in2}$};
  \draw (0,2.7) node[circ]{} -- (-1.6,2.7) node[ocirc]{} node[left]{$V_{out1}$};
  \draw (3,2.7) node[circ]{} -- (4.6,2.7) node[ocirc]{} node[right]{$V_{out2}$};
  % headroom stack
  \begin{scope}[xshift=6.3cm]
    \draw[<->] (0,-0.77) -- (0,0.77) node[midway,right,font=\scriptsize] {$V_{OD1}$};
    \draw[<->] (0,-2.3) -- (0,-0.77) node[midway,right,font=\scriptsize] {$V_{ISS}$};
    \draw[<->] (0,1.03) -- (0,2.57) node[midway,right,font=\scriptsize] {$V_{OD3}$};
    \draw[<->] (0,2.83) -- (0,4.37) node[midway,right,font=\scriptsize] {$|V_{OD5}|$};
    \draw[<->] (0,4.63) -- (0,6.17) node[midway,right,font=\scriptsize] {$|V_{OD7}|$};
    \node[font=\scriptsize,align=left,anchor=west] at (1.2,2.0) {minimum $|V_{DS}|$ of each\\ device; what is left of\\ $V_{DD}$ is the swing};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{|A_v| \approx g_{m1}\big[(g_{m3}r_{o3}r_{o1})\,\|\,(g_{m5}r_{o5}r_{o7})\big]}
$$

$$
\boxed{\text{Differential swing} = 2\big[V_{DD} - (V_{OD1}+V_{OD3}+V_{ISS}+|V_{OD5}|+|V_{OD7}|)\big]}
$$

- Gain is on the order of $(g_mr_o)^2$: the highest-speed, lowest-power, lowest-noise topology (only the input pair and the two loads add noise; cascodes contribute little).
- Getting that full swing needs three biases held tightly: $V_{in,CM} = V_{GS1}+V_{ISS}$, $V_{b1} = V_{GS3} + (V_{in,CM}-V_{TH1})$, $V_{b2} = V_{DD}-|V_{OD7}|-|V_{GS5}|$.
- The single-ended version (Razavi Fig. 9.21) has half the swing and a mirror pole; a cascode PMOS mirror also wastes one $|V_{TH}|$ of swing unless it is a low-voltage cascode.

> [!warning] Telescopic cascodes make poor unity-gain buffers
> Short output to input (Razavi Fig. 9.9). $M_4$ saturated needs $V_{out} \ge V_b - V_{TH4}$; $M_2$ saturated needs $V_{out} \le V_b - V_{GS4} + V_{TH2}$. So
> $$\boxed{V_{max}-V_{min} = V_{TH4} - (V_{GS4}-V_{TH2})}$$
> one threshold minus one overdrive, always less than $V_{TH}$. Below the range $M_4$ goes triode; above it $M_1, M_2$ do. Switched-capacitor circuits hit this configuration for part of each cycle.

> [!note]- Detail: best swing in closed loop is ±(one threshold − one overdrive) around the CM level (Razavi Ex. 9.6)
> With input and output CM equal (capacitively coupled feedback), the drains of $M_3$/$M_4$ must stay between $V_b - V_{TH3,4}$ (cascodes saturated) and $V_b - (V_{GS3,4}-V_{TH1,2})$ (input pair saturated). Setting $V_{CM}$ at the upper bound puts $M_1$, $M_2$ at the edge. Because the loop gain keeps the gates of $M_1$, $M_2$ nearly still, the drains can then rise freely and fall to $V_b - V_{TH3,4}$. The symmetric excursion is ±$(V_{TH} - V_{OV})$.

> [!note]- Detail: making $V_{b1}$ track the input CM (Razavi Fig. 9.12)
> If $V_{b1}$ is fixed and $V_{in,CM}$ drifts up, $M_1$/$M_2$ go triode. Generate $V_{b1}$ from the tail node: a small current $I_1$ through a diode-connected $M_{b1}$ from node $P$ gives $V_{b1} = V_{in,CM}-V_{GS1,2}+V_{GS,b1}$. For $M_1$, $M_2$ to sit at the edge of saturation, $V_{GS,b1} = (V_{GS1,2}-V_{TH1,2}) + V_{GS3,4}$: one overdrive plus a $V_{GS}$, so $M_{b1}$ is a narrow, long device.

### Folded Cascode

```tikz title="Folded cascode: the PMOS input pair's current folds down into the NMOS cascodes at X and Y. The input pair no longer sits under the cascodes, so the input CM level is free. After Razavi Figs. 9.14(b) and 9.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\R{8}
  \draw (0,0) node[nmos](M5){} (\R,0) node[nmos,xscale=-1](M6){};
  \draw (0,1.8) node[nmos](M3){} (\R,1.8) node[nmos,xscale=-1](M4){};
  \draw (0,3.6) node[pmos](M7){} (\R,3.6) node[pmos,xscale=-1](M8){};
  \draw (0,5.4) node[pmos](M9){} (\R,5.4) node[pmos,xscale=-1](M10){};
  \draw (M5.D) -- (M3.S) (M3.D) -- (M7.D) (M7.S) -- (M9.D);
  \draw (M6.D) -- (M4.S) (M4.D) -- (M8.D) (M8.S) -- (M10.D);
  \draw (M5.S) node[ground]{} (M6.S) node[ground]{};
  \draw (M9.S) -- (M10.S); \node[above] at (4,6.17) {$V_{DD}$};
  \foreach \m/\l in {M5/5,M3/3,M7/7,M9/9} \node[font=\scriptsize,right] at (\m.center) {$M_{\l}$};
  \foreach \m/\l in {M6/6,M4/4,M8/8,M10/10} \node[font=\scriptsize,left] at (\m.center) {$M_{\l}$};
  \draw (M5.G) node[left]{$V_{b4}$} (M3.G) node[left]{$V_{b1}$} (M7.G) node[left]{$V_{b2}$} (M9.G) node[left]{$V_{b3}$};
  \draw (M6.G) node[right]{$V_{b4}$} (M4.G) node[right]{$V_{b1}$} (M8.G) node[right]{$V_{b2}$} (M10.G) node[right]{$V_{b3}$};
  % PMOS input pair
  \draw (3,2.9) node[pmos](M1){} (5,2.9) node[pmos,xscale=-1](M2){};
  \node[font=\scriptsize,right] at (M1.center) {$M_1$};
  \node[font=\scriptsize,left] at (M2.center) {$M_2$};
  \draw (M1.S) -- (M2.S);
  \draw (4,6.17) node[circ]{} to[I,l=$I_{SS}$] (4,3.67) node[circ]{};
  \draw (M1.D) |- (0,1.0) node[circ]{} node[left,font=\scriptsize]{$X$};
  \draw (M2.D) |- (\R,1.0) node[circ]{} node[right,font=\scriptsize]{$Y$};
  \draw (M1.G) node[left]{$V_{in1}$} (M2.G) node[right]{$V_{in2}$};
  \draw (0,2.7) node[circ]{} -- (-1.3,2.7) node[ocirc]{} node[left]{$V_{out1}$};
  \draw (\R,2.7) node[circ]{} -- (\R+1.3,2.7) node[ocirc]{} node[right]{$V_{out2}$};
  \node[font=\scriptsize,align=center] at (4,-1.8) {input pair PMOS, cascodes NMOS: the signal current ``folds'' down into $X,Y$ and back up};
\end{circuitikz}
\end{document}
```

$$
\boxed{|A_v| \approx g_{m1}\Big\{\big[(g_{m3}+g_{mb3})r_{o3}(r_{o1}\|r_{o5})\big]\,\|\,\big[(g_{m7}+g_{mb7})r_{o7}r_{o9}\big]\Big\}}
$$

$$
\boxed{\text{Swing per side} = V_{DD} - (V_{OD3}+V_{OD5}+|V_{OD7}|+|V_{OD9}|)}
$$

- $G_m \approx g_{m1}$ because the source of $M_3$ ($\approx 1/g_{m3}$) is much lower than $r_{o1}\|r_{o5}$.
- **Gain is 2–3× lower** than a comparable telescopic: PMOS input has lower $g_m$, and $r_{o1}\|r_{o5}$ is small because $M_5$ carries input *and* cascode current.
- **Power is higher:** $I_{SS1} = I_{SS}/2 + I_{D3}$; the input pair needs its own current.
- **Folding-point pole is lower:** node $X$ adds $C_{GD5}+C_{DB5}$ of a wide $M_5$.
- **Noise is higher:** $M_1$–$M_2$, the NMOS folding sources $M_5$–$M_6$ and the PMOS sources $M_9$–$M_{10}$ all contribute (see [[#Noise]]).
- Swing is only one tail overdrive better than telescopic.

So why is it used more? Two reasons:

1. **Input and output CM can be equal** without limiting swing. With high loop gain, the folding nodes swing to within two overdrives of either rail (compare the ±$(V_{TH}-V_{OV})$ of the telescopic).
2. **Wider input CM range.** NMOS-input version (Razavi Fig. 9.18): $V_{in,CM} \ge V_{GS1,2}+V_{OD11}$ and $\le V_{b2}+|V_{GS3}|+V_{TH1,2}$, which can exceed $V_{DD}$. A PMOS-input version can take inputs down to 0 V.

> [!tip] Remark
> Folding is the cascode trick of [[Single-Stage]]: the input device and the cascode are opposite types, so the cascode no longer stacks on the input device. The small-signal current still passes through the cascode into the load.

- **NMOS input** (Razavi Fig. 9.18, labels flipped: $M_3$/$M_4$ PMOS cascodes, $M_5$/$M_6$ PMOS folding sources, $M_7$/$M_8$ NMOS cascodes, $M_9$/$M_{10}$ NMOS sinks, $M_{11}$ tail): more gain (mobility), but the folding pole drops ($M_3$ is a weak PMOS; $M_5$ must be wide to carry both currents). **PMOS input**: less flicker noise.
- Single-ended output: replace the bottom sources with a wide-swing cascode mirror (Tony Fig. 6.20). Tony's folded cascode adds diode clamps $Q_{12}$, $Q_{13}$ that keep the input-pair drains from collapsing during slewing (see [[#Slew Rate]]).

> [!note]- Detail: Tony's sizing rules and the second pole (Tony §6.4.1)
> - Unity-gain frequency $\omega_{ta} = g_{m1}/C_L$; with feedback $\omega_t = \beta g_{m1}/C_L$. Large $C_L$ keeps the phase margin near 90°.
> - Maximize bandwidth by maximizing $g_{m1}$: wide NMOS inputs, and bias the input pair well above the cascode branches. A practical ratio is about 4:1; higher, and the cascode current (a difference of two currents) can't be set accurately. This also raises $r_{out}$, since the output devices carry less current, and lowers thermal noise.
> - The second pole sits at the cascode sources ($\approx 1/g_m$ of a PMOS cascode times the node capacitance). It is bounded by the cascode's $f_T$: $f_{p2} < \frac{3\mu_pV_{eff5}}{4\pi L_5^2}$.
> - Not enough phase margin? Either add capacitance at the output (costs bandwidth) or burn more current in the cascodes (raises $\omega_{p2}$, costs gain and power). A resistor in series with $C_L$ gives a lead zero; place it at $1.7\,\omega_t$.

> [!note]- Detail: telescopic and folded design examples (Razavi Exs. 9.7, 9.9)
> **Telescopic** ($V_{DD}=3$ V, 3 V$_{pp}$ differential swing, 10 mW, gain 2000; $\mu_nC_{ox} = 60$, $\mu_pC_{ox} = 30$ µA/V², $\lambda_n = 0.1$, $\lambda_p = 0.2$ V⁻¹ at $L=0.5$ µm, $V_{TH}=0.7$ V):
> 1. Power first: 3 mA in the tail $M_9$, 330 µA in the bias branches, so 1.5 mA per branch.
> 2. Swing: each output swings 1.5 V$_{pp}$, leaving 1.5 V for $|V_{OD7}|+|V_{OD5}|+V_{OD3}+V_{OD1}+V_{OD9}$. Give $M_9$ 0.5 V, PMOS 0.3 V each, $V_{OD1}=V_{OD3}=0.2$ V.
> 3. Sizes from the square law at minimum $L$; gain comes out 1416, too low.
> 4. Fix: $g_mr_o \propto \sqrt{WL/I_D}$. Lengthen the PMOS loads (they hurt the signal path least): doubling $W$ and $L$ of $M_5$–$M_8$ gives $A_v \approx 4000$.
> 5. Check biases: $V_{in,CM,min} = 1.4$ V, $V_{b1,min} = 1.6$ V, $V_{b2,max} = 1.7$ V, plus margin. It needs CMFB.
>
> **Folded cascode** (same specs, NMOS input, Razavi Fig. 9.18 labels as above): overdrive 0.5 V on $M_5$, $M_6$ (they carry 1.5 mA), 0.4 V on $M_3$, $M_4$, 0.3 V on $M_7$–$M_{10}$. Output range 0.6 to 2.1 V, so the best output CM is 1.35 V. The gain comes out only about 400 because the PMOS cascode $M_3$'s limited intrinsic gain caps the impedance looking up into it at 66.5 kΩ (looking down into $M_7$ gives 8.8 MΩ). Fix by lengthening $M_5$, $M_6$, widening $M_1$, $M_2$, and doubling $M_3$, $M_4$.
>
> Each overdrive has only a small usable range: change it by a few tens of mV and the device sizes become disproportionate.

### Current-Mirror Op Amp

```tikz title="Current-mirror op amp: the input pair's currents are mirrored to the output with gain K. Every internal node is a diode (low impedance), so only the output sets the dominant pole. After Tony Figs. 6.21 and 6.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](Q1){};
  \draw (3,0) node[nmos,xscale=-1](Q2){};
  \node[left] at (Q1.G) {$v_{in}^+$};
  \node[right] at (Q2.G) {$v_{in}^-$};
  \node[font=\scriptsize] at (0.55,-0.3) {$Q_1$};
  \node[font=\scriptsize] at (2.45,-0.3) {$Q_2$};
  \draw (Q1.S) |- (1.5,-1.1) -| (Q2.S);
  \draw (1.5,-1.1) node[circ]{} to[I,l=$I_b$] (1.5,-2.6) node[ground]{};
  \draw (-0.8,1.6) rectangle (0.8,2.6) node[pos=0.5,font=\scriptsize,align=center]{PMOS\\ mirror $1{:}K$};
  \draw (2.2,1.6) rectangle (3.8,2.6) node[pos=0.5,font=\scriptsize,align=center]{PMOS\\ mirror $1{:}1$};
  \draw (Q1.D) -- (0,1.6);
  \draw (Q2.D) -- (3,1.6);
  \draw[->] (0,2.6) -- (0,3.2) -- (6.6,3.2) node[pos=0.6,above,font=\scriptsize]{$KI_{D1}$} -- (6.6,1.2);
  \draw[->] (3.8,2.1) -- (4.6,2.1) node[above,font=\scriptsize]{$I_{D2}$} -- (4.6,-0.7);
  \draw (4.0,-1.7) rectangle (5.6,-0.7) node[pos=0.5,font=\scriptsize,align=center]{NMOS\\ mirror $1{:}K$};
  \draw[<-] (5.3,-0.7) -- (5.3,0.2) -- (6.6,0.2) node[pos=0.5,below,font=\scriptsize]{$KI_{D2}$} -- (6.6,1.2);
  \draw (6.6,1.2) node[circ]{} -- (8.2,1.2) node[ocirc]{} node[right]{$v_{out}$};
  \draw (7.5,1.2) to[C,l=$C_L$] (7.5,-0.6) node[ground]{};
  \node[font=\scriptsize,align=center] at (3.6,-3.4) {only $v_{out}$ is high-impedance; every mirror input is a diode ($\approx 1/g_m$)\\ $G_{ma}=Kg_{m1}$,\quad $SR=KI_b/C_L$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_V = Kg_{m1}Z_L(s) \approx \frac{Kg_{m1}}{sC_L}, \qquad \omega_{ta} = \frac{Kg_{m1}}{C_L}, \qquad SR = \frac{KI_b}{C_L}}
$$

- Total current $I_{total} = (3+K)I_{D1}$, so $\omega_{ta} = \frac{K}{3+K}\cdot\frac{2I_{total}}{V_{eff,1}C_L}$. Larger $K$ means more gain, bandwidth and slew rate for the same power.
- But larger $K$ means smaller, slower mirror-input devices, so the second pole (mostly the drain of $Q_1$) falls toward $\omega_{ta}$. Tony suggests $K \le 5$, $K=2$ as a general-purpose compromise, $K=1$ for maximum speed.
- With $K = 4$, 4/5 of the total current can slew the load. That beats a folded cascode, with no internal node collapsing during slewing.
- Cost: higher thermal noise, since the input pair gets a smaller share of the current.

> [!note]- Detail: worked comparison with the folded cascode (Tony Exs. 6.9 and 6.11)
> Same 0.4 mA, 1.8 V, $C_L = 2.5$ pF in a 0.18-µm process:
> - Folded cascode (input:cascode current 4:1, 160 µA per input device): $g_{m1} \approx 4$ mA/V (subthreshold limit), $f_{ta} = 255$ MHz, $SR = 80$ V/µs, 124 V/µs with the clamps.
> - Current mirror, $K = 2$ ($I_b = 160$ µA): $Kg_{m1} = 4$ mA/V, same 255 MHz, $SR = 128$ V/µs. Second pole from summing the internal time constants: $\tau_1+\tau_2+\tau_3 = 0.34$ ns, $\approx 468$ MHz.

## Level 2: Two-Stage Op Amps

```tikz title="Fully differential two-stage op amp: a differential pair with current-source loads (gain), then common-source stages (swing). The outputs reach within one overdrive of each rail. After Razavi Fig. 9.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % first stage
  \draw (2.5,0) node[nmos](M1){} (5.5,0) node[nmos,xscale=-1](M2){};
  \draw (2.5,2.2) node[pmos,xscale=-1](M3){} (5.5,2.2) node[pmos](M4){};
  \draw (M1.D) -- (M3.D) (M2.D) -- (M4.D) (M1.S) -- (M2.S);
  \draw (M3.G) -- (M4.G); \node[above,font=\scriptsize] at (4,2.2) {$V_{b1}$};
  \draw (4,-0.77) node[circ]{} to[I,l=$I_{SS}$] (4,-2.3) node[ground]{};
  \draw (M1.G) node[left]{$V_{in1}$} (M2.G) node[right]{$V_{in2}$};
  \node[font=\scriptsize,right] at (M1.D |- M1.center) {$M_1$};
  \node[font=\scriptsize,left] at (M2.D |- M2.center) {$M_2$};
  \node[font=\scriptsize,left] at (M3.D |- M3.center) {$M_3$};
  \node[font=\scriptsize,right] at (M4.D |- M4.center) {$M_4$};
  % second stage
  \draw (-1,2.2) node[pmos,xscale=-1](M5){} (9,2.2) node[pmos](M6){};
  \draw (-1,0) node[nmos,xscale=-1](M7){} (9,0) node[nmos](M8){};
  \draw (M5.D) -- (M7.D) (M6.D) -- (M8.D);
  \draw (M7.S) node[ground]{} (M8.S) node[ground]{};
  \draw (M5.S) -- (M6.S); \node[above] at (4,2.97) {$V_{DD}$};
  \draw (M7.G) node[right]{$V_{b2}$} (M8.G) node[left]{$V_{b2}$};
  \node[font=\scriptsize,left] at (M5.D |- M5.center) {$M_5$};
  \node[font=\scriptsize,right] at (M6.D |- M6.center) {$M_6$};
  \node[font=\scriptsize,left] at (M7.D |- M7.center) {$M_7$};
  \node[font=\scriptsize,right] at (M8.D |- M8.center) {$M_8$};
  % X, Y to second-stage gates
  \draw (2.5,1.1) node[circ]{} node[right,font=\scriptsize]{$X$} -| (M5.G);
  \draw (5.5,1.1) node[circ]{} node[left,font=\scriptsize]{$Y$} -| (M6.G);
  \draw (-1,1.1) node[circ]{} -- (-2,1.1) node[ocirc]{} node[left]{$V_{out1}$};
  \draw (9,1.1) node[circ]{} -- (10,1.1) node[ocirc]{} node[right]{$V_{out2}$};
  \node[font=\scriptsize] at (4,-3.3) {stage 1: $g_{m1}(r_{o1}\parallel r_{o3})$ \quad stage 2: $g_{m5}(r_{o5}\parallel r_{o7})$; outputs swing to within one $V_{OD}$ of each rail};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = g_{m1}(r_{o1}\|r_{o3})\cdot g_{m5}(r_{o5}\|r_{o7}), \qquad \text{swing per side} = V_{DD}-|V_{OD5}|-V_{OD7}}
$$

- Overall gain is about that of a cascode op amp, but the swing is the **highest possible** for a transistor output.
- Stage 2 gain (say 10) means the stage-1 nodes $X$, $Y$ barely move, so stage 1 can be cascoded for more gain at no swing cost (Razavi Fig. 9.24): $A_v \approx g_{m1}[(g_{m3}r_{o3}r_{o1})\|(g_{m5}r_{o5}r_{o7})]\cdot g_{m9}(r_{o9}\|r_{o11})$.
- Single-ended output: keep stage 1 differential and use a mirror in stage 2 (Razavi Fig. 9.25).
- More than two stages are rare: each stage adds at least one pole, making the loop hard to stabilize.

> [!important] Two stages decouple gain from swing
> One-stage cascodes raise gain only by stacking devices, which eats swing. A two-stage op amp gets gain from stage 1 and swing from stage 2. It is the default at low supply voltages (Razavi's target: 0.9 V supply with 0.8 V single-ended swing).

### Single-Ended Two-Stage (Miller) Op Amp

```tikz title="The classic two-stage op amp: PMOS input pair with NMOS mirror load, NMOS common-source second stage, Miller capacitor C_C with lead resistor R_C. After Tony Fig. 6.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (1,2.2) node[pmos](Q1){} (4,2.2) node[pmos,xscale=-1](Q2){};
  \draw (2.5,4.4) node[pmos,xscale=-1](Q5){};
  \draw (1,0) node[nmos,xscale=-1](Q3){} (4,0) node[nmos](Q4){};
  \draw (Q1.S) -- (Q2.S); \draw (Q5.D) -- (2.5,2.97) node[circ]{};
  \draw (Q1.D) -- (Q3.D) (Q2.D) -- (Q4.D);
  \draw (Q3.S) node[ground]{} (Q4.S) node[ground]{};
  \draw (Q3.G) -- (Q4.G); \draw (2.5,0) |- (1,0.95) node[circ]{};
  \draw (Q1.G) node[left]{$v_{in}^-$} (Q2.G) node[right]{$v_{in}^+$};
  \draw (9,4.4) node[pmos](Q6){} (9,0) node[nmos](Q7){};
  \draw (Q6.D) -- (Q7.D) (Q7.S) node[ground]{};
  \draw (Q5.S) -- (2.5,5.4) -- (9,5.4) node[above]{$V_{DD}$} -- (Q6.S);
  \draw (Q5.G) -- ++(0.6,0) coordinate(B) node[above,font=\scriptsize]{$V_{bias}$} -- (Q6.G);
  \draw (4,0.95) node[circ]{} node[above right,font=\scriptsize]{$v_1$} -- (5.8,0.95) node[circ]{} |- (Q7.G);
  \draw (5.8,0.95) -- (5.8,2.2) to[R,l=$R_C$] (7.4,2.2) to[C,l=$C_C$] (9,2.2) node[circ]{};
  \draw (9,2.2) -- (10.2,2.2) node[ocirc]{} node[right]{$v_{out}$};
  \foreach \q/\l/\s in {Q1/1/right,Q3/3/left,Q5/5/left} \node[font=\scriptsize,\s] at (\q.D |- \q.center) {$Q_\l$};
  \foreach \q/\l/\s in {Q2/2/left,Q4/4/right,Q6/6/right,Q7/7/right} \node[font=\scriptsize,\s] at (\q.D |- \q.center) {$Q_\l$};
  \node[font=\scriptsize,align=center] at (2.5,-1.9) {stage 1: PMOS pair, NMOS mirror};
  \node[font=\scriptsize,align=center] at (9,-1.9) {stage 2: common source};
\end{circuitikz}
\end{document}
```

> [!info] Device labels switch here
> This subsection uses **Tony's** numbering (Fig. 6.3), not Razavi's from the fully differential figure above:
>
> | Role | Razavi Fig. 9.23 (above, Ex. 9.10, noise) | Tony Fig. 6.3 (here, slew table) |
> |---|---|---|
> | Input pair / stage-1 loads | $M_1,M_2$ / $M_3,M_4$ | $Q_1,Q_2$ / $Q_3,Q_4$ |
> | Stage-2 driver | $M_5$ ($g_{m5}$) | $Q_7$ ($g_{m7}$) |
> | Stage-2 current source | $M_7$ | $Q_6$ |
> | Tail | $I_{SS}$ | $Q_5$ |
>
> So Tony's $g_{m7}$ is Razavi's $g_{m5}$, and Tony's $I_{D5}$ is the tail current $I_{SS}$.

The compensation itself belongs to [[Stability]]. Here are only the results the topology needs:

$$
\boxed{A_v = g_{m1}(r_{ds2}\|r_{ds4})\cdot g_{m7}(r_{ds6}\|r_{ds7}), \qquad \omega_{ta} = \frac{g_{m1}}{C_C}}
$$

$$
\boxed{\omega_{p1} \approx \frac{1}{g_{m7}R_1R_2C_C}, \qquad \omega_{p2} \approx \frac{g_{m7}}{C_1+C_2}, \qquad \omega_z = -\frac{g_{m7}}{C_C}\ \text{(RHP, with } R_C=0)}
$$

with $R_1 = r_{ds2}\|r_{ds4}$, $C_1 = C_{db2}+C_{db4}+C_{gs7}$, $R_2 = r_{ds6}\|r_{ds7}$, $C_2 = C_{db6}+C_{db7}+C_L$.

- Each stage gives about $g_mr_{ds}/2$ (Tony Ex. 6.1: $-24.4\times -19.5 \approx 1043$, 60 dB).
- $C_C$ looks like $C_C(1+A_{v2})$ at node $v_1$ (Miller), which is why $\omega_{ta}$ depends only on $g_{m1}/C_C$.
- **Pole splitting:** raising $g_{m7}$ pushes $\omega_{p2}$ up; raising $C_C$ pulls $\omega_{p1}$ down. $\omega_{ta}$ must stay below about $\omega_{p2}/2$.
- The RHP zero comes from the feedforward path through $C_C$. $R_C$ moves it (lead compensation).

> [!tip] Remark
> $\omega_{ta} = g_{m1}/C_C$ is the same "$g_m$ over the capacitor" GBW as the one-stage OTA's $g_{m1}/C_L$; the capacitor is just internal. Pole splitting and the zero are [[Frequency Response#Miller's Theorem|Miller's theorem]] at work.

**Use a PMOS input pair** (Tony §6.1.4): the second stage then gets an NMOS driver (higher $g_{m7}$, so higher $\omega_{p2}$ and $\omega_{ta}$), and PMOS has lower $1/f$ noise. The cost is more wideband thermal noise.

**Zero systematic offset** (Tony §6.1.5): with zero input, $V_{DS3} = V_{GS4}$ must equal the $V_{GS7}$ that makes $I_{D7} = I_{D6}$. Equal current densities give

$$
\boxed{\frac{(W/L)_7}{(W/L)_4} = 2\,\frac{(W/L)_6}{(W/L)_5}}
$$

Otherwise the high-gain second stage clips, and feedback forces a nonzero input to hold it in range.

> [!note]- Detail: two-stage design proceeds backwards from the output (Razavi Ex. 9.10, Razavi labels of Fig. 9.23)
> $V_{DD} = 1$ V, 1 mW, 1 V$_{pp}$ differential, gain 100; $V_{THN} = 0.3$ V, $V_{THP} = -0.35$ V.
> 1. 960 µA to $M_1$–$M_8$ (120 µA each), 40 µA to bias.
> 2. If stage 2 has gain 5 and swings 0.5 V$_{pp}$, stage 1 only swings 0.1 V$_{pp}$. Its overdrive budget is relaxed: $|V_{OD3}|+V_{OD1}+V_{ISS} = 0.9$ V.
> 3. Design the **output stage first**, because $V_{DS3,4} = |V_{GS5,6}|$ sets how much overdrive $M_3$/$M_4$ may have. Swap the obvious allocation: 300 mV to the NMOS sources $M_7$/$M_8$ (low noise current), 200 mV to the PMOS drivers $M_5$/$M_6$ (high $g_m$). Stage-2 gain ≈ 33.
> 4. Then stage 1: $|V_{GS5,6}| = 550$ mV allows up to 500 mV of overdrive on $M_3$/$M_4$, but that would need $V_{b1} = 150$ mV; choose 400 mV. Give $M_1$/$M_2$ only 100 mV so that $g_{m1,2} \gg g_{m3,4}$ (the loads' noise is divided by $(g_{m1}/g_{m3})^2$). Stage-1 gain ≈ 66, total > 2000.
>
> Large load overdrive → low load noise; small input overdrive → high $g_m$ (often subthreshold, $g_m \le I_D/(\xi V_T)$).

> [!note]- Detail: Tony's compensation recipe (Tony §6.2.2; theory in [[Stability]])
> 1. Start with $C_C' \approx (\beta g_{m1}/g_{m7})C_L$.
> 2. Simulate; find the frequency $\omega_t$ where the phase is −125° and the gain $A'$ there.
> 3. Set $C_C = C_C'A'$ so $\omega_t$ becomes the unity-gain frequency (55° margin).
> 4. $R_C = 1/(1.7\,\omega_tC_C)$ adds about 30°, about 85° total.
> 5. Still short? Raise $C_C$, keep $R_C$.
> 6. Replace $R_C$ by a triode transistor: $R_C = 1/[\mu_nC_{ox}(W/L)_9V_{eff9}]$.

## Level 3: Gain Boosting

```tikz title="Regulated cascode: the auxiliary amplifier A_1 holds node P at V_b, which multiplies the cascode's effective g_m by A_1+1. Right: the booster's own pole adds a second pole about A_0*omega_0 above the original bandwidth, plus a zero near (A_0+1)*omega_0. After Razavi Figs. 9.29, 9.37 and 9.38."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){} (0,1.8) node[nmos](M2){};
  \draw (M1.D) -- (M2.S); \draw (M1.S) node[ground]{};
  \draw (M1.G) node[left]{$V_{in}$};
  \node[font=\scriptsize,right] at (M1.center) {$M_1$};
  \node[font=\scriptsize,right] at (M2.center) {$M_2$};
  \draw (M2.D) -- (0,3.0) node[circ]{} coordinate(O);
  \draw (O) to[I,l_=$I$] (0,4.6) node[above]{$V_{DD}$};
  \draw (O) -- (1.2,3.0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (0,0.9) node[circ]{} node[right,font=\scriptsize]{$P$};
  \draw (-2.4,1.8) node[op amp,scale=0.6,yscale=-1](A){};
  \node[font=\scriptsize] at (-2.6,1.8) {$A_1$};
  \draw (A.out) -- (M2.G);
  \draw (A.-) -- ++(-0.3,0) |- (0,0.9);
  \draw (A.+) -- ++(-0.5,0) node[left]{$V_b$};
  \node[font=\scriptsize,align=center] at (-1.3,-1.7) {$R_{out}\approx(A_1+1)\,g_{m2}r_{o2}r_{o1}$};
  \begin{scope}[xshift=4.3cm,yshift=-1cm]
    \draw[->] (0,0) -- (7,0) node[right]{$\omega$ (log)};
    \draw[->] (0,0) -- (0,5) node[above]{$|V_{out}/V_{in}|$ (log)};
    \draw[thick,dashed] (0,2.4) -- (2.6,2.4) -- (5,0);
    \draw[thick] (0,4.2) -- (0.8,4.2) -- (4.0,1.0) -- (4.6,0);
    \node[left,font=\scriptsize] at (0,4.2) {$A_0g_{m1}r_{o1}g_{m2}r_{o2}$};
    \node[left,font=\scriptsize] at (0,2.4) {$g_{m1}r_{o1}g_{m2}r_{o2}$};
    \draw[dotted] (0.8,4.2) -- (0.8,0) node[below,font=\scriptsize]{$\omega_{p1}$};
    \draw[dotted] (2.6,2.4) -- (2.6,0) node[below,font=\scriptsize]{$\omega_{p,\mathrm{orig}}$};
    \draw[dotted] (4.0,1.0) -- (4.0,0) node[below,font=\scriptsize]{$\omega_{p2}$};
    \node[font=\scriptsize,anchor=west] at (2.2,3.6) {regulated cascode};
    \node[font=\scriptsize,anchor=west] at (3.2,1.9) {original};
    \node[font=\scriptsize,align=left,anchor=north west] at (0,-0.7) {$\omega_{p1}\approx 1/(A_0g_{m2}r_{o2}r_{o1}C_L)$,\quad $\omega_{p,\mathrm{orig}}=1/(g_{m2}r_{o2}r_{o1}C_L)$\\ $\omega_{p2}\approx\omega_{p,\mathrm{orig}}+A_0\omega_0$ (booster bandwidth), zero near $(A_0+1)\omega_0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Idea:** raise $R_{out}$ without stacking another device (no extra headroom). Put an amplifier $A_1$ between node $P$ and the cascode gate.

$$
\boxed{R_{out} = r_{o2} + (A_1+1)g_{m2}r_{o2}r_{o1} + r_{o1}, \qquad |A_v| \approx (A_1+1)\,g_{m1}r_{o1}\,g_{m2}r_{o2}}
$$

Two ways to see it:

1. **Supertransistor:** $A_1$ in front of $M_2$ makes a device with transconductance $\approx (A_1+1)g_{m2}$ and the same $r_o$.
2. **Regulation:** $A_1$ pins $V_P$ to $V_b$, so the current through $r_{o1}$ (and so the drain current) can't change when the output moves. With $A_1 \to \infty$, $I_D = V_b/R_S$ exactly. The intrinsic current change $I_0$ cancels the current through $r_{o2}$: the signal current circulates through $r_{o2}$ (Razavi Ex. 9.12).

> [!tip] Remark
> Without $A_1$ this is the cascode of [[Single-Stage]] with $R_{out} = r_{o2}+g_{m2}r_{o2}r_{o1}+r_{o1}$. Gain boosting is that cascode with its $g_m$ multiplied by $A_1+1$, which is also local [[Feedback]] sensing $V_P$.

**Frequency response** (booster with one pole, $A_1 = A_0/(1+s/\omega_0)$):

$$
\boxed{|\omega_{p1}| \approx \frac{1}{A_0g_{m2}r_{o2}r_{o1}C_L}, \qquad |\omega_{p2}| \approx (A_0+1)\omega_0 + \frac{1}{g_{m2}r_{o2}r_{o1}C_L}, \qquad |\omega_z| \approx (A_0+1)\omega_0}
$$

- Most of the signal goes straight through the cascode; only the small "error" goes through $A_1$ and gets slowed. So it behaves like a one-stage op amp.
- The booster's unity-gain bandwidth sets a pole-zero **doublet**. A doublet leaves a slow settling tail ([[Stability]]).

> [!note]- Derivation: $R_{out}$ and $G_m$ of the boosted stage (Razavi Eqs. 9.19–9.25)
> Degenerated stage with resistor $R_S$, test current $I_X$ into the drain. $V_{R_S} = I_XR_S$, gate at $-A_1I_XR_S$, so $I_0 = -(A_1+1)g_mR_SI_X$. KCL with $r_o$ carrying $(V_X - R_SI_X)/r_o$:
> $$I_X = -(A_1+1)g_mR_SI_X + \frac{V_X - R_SI_X}{r_o} \Rightarrow R_{out} = r_o + (A_1+1)g_mr_oR_S + R_S$$
> Transconductance: $\frac{I_{out}}{V_{in}} = \frac{A_1g_m}{1+(A_1+1)g_mR_S}$. The numerator gains $A_1$ and the denominator $A_1+1$, so the supertransistor model is only approximately right; fine when $A_1 \gg 1$.
> Replace $R_S$ by an input device $M_1$ ($R_S \to r_{o1}$). The source of $M_2$ looks like $r_{o2}/[1+(A_1+1)g_{m2}r_{o2}] \ll r_{o1}$, so $G_m \approx g_{m1}$ and $|A_v| \approx g_{m1}R_{out}$.

> [!note]- Detail: building the booster without losing headroom (Razavi §9.4.2)
> - **NMOS CS booster** (Fig. 9.32a): $|A_1| = g_{m3}r_{o3}$, gain like a triple cascode, but $V_P \ge V_{GS3}$ and $V_{out} \ge V_{GS3}+V_{OD2}$. Swing lost.
> - **PMOS CS booster** (Fig. 9.32b): $V_P$ can drop to $V_{OD1}$, but $V_G = V_{GS2}+V_{OD1}$ puts $M_3$'s drain $V_{GS2}$ above its gate, so it goes triode if $V_{GS2} > |V_{TH3}|$.
> - **Folded-cascode booster** (Fig. 9.32c): an NMOS common-gate $M_4$ level-shifts up. $V_b$ has a wide range, from $V_{GS4}+V_{I1}$ to $V_{GS2}+V_P+V_{TH4}$.
> - **Differential:** one differential booster serves both $X$ and $Y$. Sense them with a **PMOS**-input folded cascode (Fig. 9.34) so the booster doesn't limit $V_{X,Y}$: minimum is $V_{OD1,2}+V_{ISS1}$. Output impedance ≈ $g_{m3}r_{o3}r_{o1}\cdot g_{m5}R_{out1}$, like a **quadruple cascode**.
> - Boost the PMOS loads too (Fig. 9.36), with an NMOS-input folded-cascode booster for them.

### Choosing a Topology

| Topology | Gain | Output swing | Speed | Power | Noise |
|---|---|---|---|---|---|
| Telescopic | Medium | Medium | Highest | Low | Low |
| Folded cascode | Medium | Medium | High | Medium | Medium |
| Two-stage | High | Highest | Low | Medium | Low |
| Gain-boosted | High | Medium | Medium | High | Medium |

*Razavi Table 9.1.* Tony adds the current-mirror OTA: like a folded cascode in power, better bandwidth and slew rate at large $K$, worse thermal noise.

**Linear scaling** (open, because it is how every design gets resized): scale all widths and currents by $k$ at fixed $L$. Then $V_{OV}$ and swings stay fixed, $g_m \times k$, $r_o \div k$, so **gain and swing are unchanged**, power $\times k$, speed into a fixed $C_L$ $\times k$, input-referred noise power $\div k$.

> [!note]- Detail: scaling down for low power (Razavi Ex. 9.8)
> Shrink all widths (and currents) by 10: $g_m$ drops 10×, so the speed driving a capacitive load drops 10× and the input-referred noise *voltage* rises by $\sqrt{10}$.

## Level 4: Fully Differential Op Amps and Common-Mode Feedback

### Why Fully Differential

Compared with a single-ended op amp of the same power (Tony Fig. 6.24):

| | Single-ended | Fully differential |
|---|---|---|
| Swing | $V_{pp,max}$ | $2V_{pp,max}$ |
| Slew rate | $I/C_L$ | $I/(2C_L)$ per side, so $I/C_L$ differential |
| Small-signal gain, $\omega_{-3dB}$, $\omega_{ta}$ | $G_{ma}r_{out}$, $1/(r_{out}C_L)$, $G_{ma}/C_L$ | same |
| Random noise power | $N_o^2$ | $2N_o^2$ |
| Max SNR | | **+3 dB** (signal power ×4, noise ×2) |
| Distortion | all orders | even orders cancel (if symmetric about the CM) |
| Mirror pole | yes (5T OTA) | no |
| Common-mode noise (supply, substrate, clock feedthrough) | passes | rejected (partly, since the coupling is nonlinear) |

The drawback: it needs **CMFB**, and the CMFB loop costs swing, capacitance, sometimes power, and design effort.

### Why CMFB Is Needed

```tikz title="Left: a high-gain output is a node where a PMOS current source fights an NMOS one, so any mismatch I_P - I_N times the huge R_P || R_N drives the output to a rail. Right: CMFB senses the output CM level, compares it with V_REF, and corrects a bias current. After Razavi Figs. 9.42 and 9.44."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,4) node[above]{$V_{DD}$} to[I,l=$I_P$] (0,2) node[circ]{} to[I,l=$I_N$] (0,0) node[ground]{};
  \draw (0,4) -- (2,4) to[R,l=$R_P$] (2,2) to[R,l=$R_N$] (2,0) node[ground]{};
  \draw (0,2) -- (2,2) node[circ]{} -- (2.8,2) node[ocirc]{} node[right]{$V_{out}$};
  \draw[->,red] (0.5,1.75) -- (1.6,1.75) node[midway,below,font=\scriptsize]{$I_P-I_N$};
  \node[font=\scriptsize,align=center] at (1,-1.3) {$\Delta V_{out}=(I_P-I_N)(R_P\parallel R_N)$\\ tiny mismatch $\times$ huge $R$ = rail};
  \begin{scope}[xshift=5.4cm]
    \draw (0,1.2) rectangle (2.2,2.8) node[pos=0.5,align=center,font=\scriptsize]{diff.\ op amp\\ $V_{out1},V_{out2}$};
    \draw[->] (2.2,2.0) -- (3.2,2.0);
    \draw (3.2,1.3) rectangle (5.6,2.7) node[pos=0.5,align=center,font=\scriptsize]{CM sense\\[2pt] $(V_{out1}+V_{out2})/2$};
    \draw[->] (5.6,2.0) -- (5.8,2.0);
    \draw (6.1,2.0) circle (0.3); \node at (6.1,2.0) {$-$};
    \draw[<-] (6.1,2.3) -- (6.1,3.2) node[above,font=\scriptsize]{$V_{REF}$};
    \draw[->] (6.1,1.7) -- (6.1,0.4) -- (1.1,0.4) node[midway,below,font=\scriptsize]{error $\to$ tail or load current} -- (1.1,1.2);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V_{out,CM} = (I_P - I_N)(R_P\|R_N)}
$$

- Razavi Ex. 9.16: a 1% mismatch in the tail mirror (2.97 mA instead of 3 mA) puts 15 µA per side into 266 kΩ: a 3.99 V "error" the circuit can't produce, so the PMOS devices go triode instead.
- Tony: even a 0.0001% tail-current error slowly drives every node to a rail.
- **Rule:** if you can't find the output CM level by inspection (for example $V_{DD}-I_{SS}R_D/2$ with resistor loads) but need device parameters to compute it, it is undefined.

> [!warning] Two classic mistakes (Razavi §9.7.1)
> 1. Thinking differential feedback sets the CM level. It doesn't: it only sees $V_{out1}-V_{out2}$.
> 2. Tuning $V_b$ in simulation until the outputs sit at $V_{DD}/2$ and concluding no CMFB is needed. Random mismatch on silicon moves it to a rail.

CMFB is a feedback loop like any other: **sense** $(V_{out1}+V_{out2})/2$, **compare** with $V_{REF}$, **return** the error to a bias current.

### Sensing the CM Level

| Sensor | How | Problem |
|---|---|---|
| Resistive divider | $R_1 = R_2$ between the outputs | Must be ≫ $R_{out}$ (MΩ): area, parasitic capacitance |
| Source followers + resistors | Buffer each output first (Razavi Fig. 9.46) | Costs about one $V_{TH}$ of swing per side ($V_{out,min} = V_{GS7}+V_{I1}$); followers starve for large swings unless $I_1$ or $R_1+R_2$ is large |
| Triode devices | $R_{on7}\|R_{on8} = 1/[\mu_nC_{ox}\frac WL(V_{out1}+V_{out2}-2V_{TH})]$ | Exact only while both stay deep triode; one saturates on large swings |
| Differential pairs vs. $V_{REF}$ | $I_{CM} \propto V_{out1}+V_{out2}$ (Razavi Fig. 9.50) | Pair nonlinearity: the sum depends on each output, so it misreads large swings |
| Cross-coupled pairs (Tony Fig. 6.34) | Each pair sees one output vs. $V_{ref,CM}$; drains summed so $I_{D5} = I_B$ exactly when outputs are opposite | Fine until a pair turns off; enlarge $V_{eff}$ or degenerate (Fig. 6.35) |
| Switched capacitor (Tony Fig. 6.38) | $C_C$ averages; $C_S$ (1/4 to 1/10 of $C_C$) refreshes the dc offset | Sampled systems only; charge injection if $C_S$ too small |

> [!important] A CM sensor must ignore the differential signal
> If the sensor is nonlinear, a large differential swing shows up as a CM shift. Razavi Ex. 9.17: the two outputs step asymmetrically because a triode sensing device left deep triode.

> [!note]- Detail: complementary followers sense across full swing (Razavi §11.5.1, via Zettelkasten 8t)
> An NMOS follower on each output gives $V_{CM}-V_{GS,N}$; a PMOS follower gives $V_{CM}+|V_{GS,P}|$. Sum them through $R_N$ (NMOS side) and $R_P$ (PMOS side) into one node:
> $$V_{tot}(R_P+R_N) = R_P(V_{CM}-V_{GS,N}) + R_N(V_{CM}+|V_{GS,P}|)$$
> Choose $R_PV_{GS,N} = R_N|V_{GS,P}|$ and $V_{tot} = V_{CM}$. When an output swings low and kills its NMOS follower, the PMOS one still tracks.

### Returning the Error

- **To the load or bottom current sources** (Razavi Fig. 9.51), or **to the tail** (Fig. 9.52, folded cascode: more tail current lowers the cascode-branch current and the output CM). The correction may control only part of a current source (split each device into a fixed part and a controlled part).
- Tony: control the **output-stage** current sources. The CM loop then has fewer nodes and is easier to compensate.
- **Triode CMFB** (Razavi Figs. 9.53, 9.54): the output CM is set by device parameters, costs swing (drop across $R_{on}$), and the wide triode devices load the outputs. The sensitivity to the bias $V_b$ is
$$\boxed{\left.\frac{dV_{out,CM}}{dV_b}\right|_{closed} \approx \frac{V_{GS7,8}-V_{TH7,8}}{V_{DS7,8}}}$$
so $V_{DS7,8}$ must be large, which lowers loop gain. Defining $V_b$ by a replica mirror tied to $V_{REF}$ (Razavi Figs. 9.56, 9.57) makes the CM level equal $V_{REF}$ and removes the parameter dependence.
- **Resistor + diode load** (Razavi Fig. 9.58b): $R_F$ from each output to the PMOS gates. For CM the loads are diodes (CM well defined, $V_{DD}-|V_{GS3,4}|$); for differential signals node $P$ is a virtual ground and the gain is $g_{m1,2}(r_{o1,2}\|r_{o3,4}\|R_F)$. Upper swing limit $V_{DD}-|V_{GS3,4}-V_{TH3,4}|$. Low-gain use.

> [!warning] Don't sense CM with the tail devices (Razavi Ex. 9.20)
> Replacing the tail with two triode devices driven by the outputs gives $V_{out,CM}/V_{in,CM} \approx -1/[2R_{tail}/r_{o3,4} + g_{m,tail}R_{tail} + (g_{m1,2}r_{o3,4})^{-1}]$, where each term is < 1. Input CM errors pass to the output unattenuated: no CMRR.

> [!warning] The CM loop must be stable too
> It is a feedback loop with its own poles: the error-amp input (with a large sensing $R$), the error amp, the controlled node, the output. Check its phase margin and CM step response in simulation (Tony §6.8). Grounded output (load) capacitors compensate the CM loop and the differential loop together; one capacitor *between* the outputs compensates only the differential loop. A few mV of CM error is acceptable, so don't chase high CM loop gain.

> [!note]- Detail: CM loop compensation and measurement (Razavi §11.5.1, via Zettelkasten 8t1, 8t2, 8t2a)
> - The error amplifier only needs to steer the fraction of the tail current that mismatch can produce, for example 20% of $I_{SS}$.
> - Measure the CM loop transmission with the differential feedback network ($R_1$, $R_2$) connected. It loads the output and adds an input-node pole.
> - The CM error amplifier is non-inverting in the loop, so a Miller capacitor around it would look like a negative capacitance. Compensate with a capacitor from the error-amp output to ground, scaled with $C_L$.

### CMFB in Two-Stage Op Amps

```tikz title="One simple CMFB loop per stage: R_1, R_2 set the first-stage CM through the diode-like M_3, M_4 (invisible to differential signals); R_3, R_4 do the same for the second stage. Every current copies I_SS. After Razavi Fig. 9.62."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % first stage
  \draw (2,0) node[nmos](M1){} (6,0) node[nmos,xscale=-1](M2){};
  \draw (2,2.2) node[pmos,xscale=-1](M3){} (6,2.2) node[pmos](M4){};
  \draw (M1.D) -- (M3.D) (M2.D) -- (M4.D) (M1.S) -- (M2.S);
  \draw (M3.G) -- (M4.G); \draw (2,1.5) node[circ]{} to[R,l_=$R_1$] (4,1.5) to[R,l_=$R_2$] (6,1.5) node[circ]{}; \draw (4,1.5) -- (4,2.2);
  \draw (4,-0.77) node[circ]{} to[I,l=$I_{SS}$] (4,-2.1) node[ground]{};
  \draw (M1.G) node[left]{$V_{in1}$} (M2.G) node[right]{$V_{in2}$};
  \node[font=\scriptsize,right] at (M1.D |- M1.center) {$M_1$};
  \node[font=\scriptsize,left] at (M2.D |- M2.center) {$M_2$};
  \node[font=\scriptsize,left] at (M3.D |- M3.center) {$M_3$};
  \node[font=\scriptsize,right] at (M4.D |- M4.center) {$M_4$};
  % second stage
  \draw (-1,2.2) node[pmos,xscale=-1](M5){} (9,2.2) node[pmos](M6){};
  \draw (-1,0) node[nmos,xscale=-1](M7){} (9,0) node[nmos](M8){};
  \draw (M5.D) -- (M7.D) (M6.D) -- (M8.D);
  \draw (M7.S) node[ground]{} (M8.S) node[ground]{};
  \draw (M5.S) -- (M6.S); \node[above] at (4,2.97) {$V_{DD}$};
  \draw (M7.G) -- ++(0,-2.9) -| (M8.G); \draw (-2,1.1) -- (-2,-3.4) to[R,l_=$R_3$] (4,-3.4) node[circ]{} node[below]{$Q$} to[R,l_=$R_4$] (10,-3.4) -- (10,1.1); \draw (4,-3.4) -- (4,-2.9) node[circ]{};
  \node[font=\scriptsize,left] at (M5.D |- M5.center) {$M_5$};
  \node[font=\scriptsize,right] at (M6.D |- M6.center) {$M_6$};
  \node[font=\scriptsize,left] at (M7.D |- M7.center) {$M_7$};
  \node[font=\scriptsize,right] at (M8.D |- M8.center) {$M_8$};
  % X, Y to second-stage gates
  \draw (2,0.95) node[circ]{} node[right,font=\scriptsize]{$X$} -| (M5.G);
  \draw (6,0.95) node[circ]{} node[left,font=\scriptsize]{$Y$} -| (M6.G);
  \draw (-1,1.1) node[circ]{} -- (-2,1.1) node[circ]{} -- (-2.6,1.1) node[ocirc]{} node[left]{$V_{out1}$};
  \draw (9,1.1) node[circ]{} -- (10,1.1) node[circ]{} -- (10.6,1.1) node[ocirc]{} node[right]{$V_{out2}$};
  \node[font=\scriptsize,align=center] at (4,-4.6) {$R_1,R_2$ set the stage-1 CM (diode-like for CM, invisible for differential); $R_3,R_4$ set the stage-2 CM\\ $A_v=g_{m1}(r_{o1}\parallel r_{o3}\parallel R_1)\,g_{m5}(r_{o5}\parallel r_{o7}\parallel R_3)$};
\end{circuitikz}
\end{document}
```

- **CMFB on stage 2 only:** nothing sets the CM of $X$, $Y$; $M_3$/$M_4$ go triode and the output current drops. Don't.
- **Sense the output, correct stage 1** (e.g. $I_{SS}$): works ($M_5$/$M_6$ sense $X$, $Y$), but the loop has three or four poles (X/Y, output, error amp, the large $R_{CM}$ with the error-amp input). Hard to stabilize.
- **One loop per stage** (figure). Gain:
$$\boxed{A_v = g_{m1}(r_{o1}\|r_{o3}\|R_1)\cdot g_{m5}(r_{o5}\|r_{o7}\|R_3)}$$
- Catch (Razavi Ex. 9.21): the output CM equals $V_{GS7,8}$, about one $V_{TH}$, far below $V_{DD}/2$. Fix: draw a small $I_Q$ from node $Q$ to shift the output CM up by $R_3I_Q/2$.
- With a cascoded first stage, sense $X$, $Y$ without loading those high-impedance nodes (Razavi Fig. 9.64).

## Level 5: Large-Signal and Second-Order Behaviour

### Output Swing, Measured

At the swing limits, devices near the rails lose $V_{DS}$, enter triode, and the gain drops. Define the maximum swing by simulation: sweep a sinusoid's amplitude and find where $|V_{out}/V_{in}|$ has dropped by an acceptable amount (say 10%, about 1 dB), or where closed-loop distortion becomes unacceptable (Razavi §9.6). In nanometer devices the saturation/triode border is blurred, so you can't decide by hand.

### Input Common-Mode Range

In a unity-gain buffer the input swings as much as the output, and the **input pair** limits it: $V_{in,min} = V_{GS1,2}+V_{ISS}$, about a threshold above what the output stage could reach. Below it the tail goes triode and $G_m$ collapses.

```tikz title="Complementary input pairs (NMOS and PMOS folded cascodes in parallel): one pair is always alive, so the input range is rail to rail, but the total G_m (and so gain, bandwidth, noise) changes with V_in,CM. After Razavi Figs. 9.66 and 9.67."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right]{$V_{in,CM}$};
  \draw[->] (0,0) -- (0,3.4) node[above]{$G_m$};
  \draw[thick,dashed] (0,1.5) -- (3.8,1.5) -- (4.6,0);
  \draw[thick,dashed] (1.6,0) -- (2.4,1.5) -- (6.2,1.5);
  \draw[thick,red] (0,1.5) -- (1.6,1.5) -- (2.4,3.0) -- (3.8,3.0) -- (4.6,1.5) -- (6.2,1.5);
  \draw (6.2,0.06) -- (6.2,-0.06) node[below,font=\scriptsize]{$V_{DD}$};
  \node[below,font=\scriptsize] at (0,0) {$0$};
  \node[font=\scriptsize] at (0.8,1.25) {$g_{mp}$ only};
  \node[font=\scriptsize] at (5.4,1.25) {$g_{mn}$ only};
  \node[font=\scriptsize,red] at (3.1,3.25) {both: $g_{mn}+g_{mp}$};
  \node[font=\scriptsize,align=center] at (3.1,-0.9) {complementary input pairs: always one alive, but $G_m$ (gain, bandwidth, noise) moves with $V_{in,CM}$};
\end{circuitikz}
\end{document}
```

- Tony Fig. 6.32 (Coban): when one pair turns off, its current is steered into the surviving pair to hold $G_m$ roughly constant; within 15% over the full supply range has been reported.
- Low supplies make this matter. With an NMOS tail and $V_{eff} \approx 0.2$ V, $V_{tn} \approx 0.45$ V and 50 mV margin, the input CM must be ≥ 0.95 V on a 1.2-V supply. A folded-cascode output on 1.2 V swings only 0.45 to 0.75 V, which is why low-voltage designs use a folded-cascode first stage plus CS second stage (Tony Fig. 6.33).

### Slew Rate

**Linear settling:** the slope of the step response is proportional to its final value; double the input, double the slope. **Slewing:** a large step momentarily turns one input device off, the loop is broken, and a fixed current charges the capacitor. The output ramps at a slope that does not depend on the input size. Slewing is nonlinear and distorts.

```tikz title="Slewing in the five-transistor OTA: a large step turns M_2 off, M_1 takes all of I_SS, the mirror pushes I_SS into C_L. The loop is broken until V_out catches up. After Razavi Fig. 9.72(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){} (3,0) node[nmos,xscale=-1](M2){};
  \draw (0,2.2) node[pmos,xscale=-1](M3){} (3,2.2) node[pmos](M4){};
  \node[font=\scriptsize,left] at ([yshift=0.3cm]M3.D) {$M_3$};
  \node[font=\scriptsize,right] at ([yshift=0.3cm]M4.D) {$M_4$};
  \node[font=\scriptsize,right] at ([yshift=-0.3cm]M1.D) {$M_1$};
  \node[font=\scriptsize,left] at ([yshift=-0.3cm]M2.D) {$M_2$ off};
  \draw (M1.D) -- (M3.D) (M2.D) -- (M4.D) (M3.S) -- (M4.S);
  \node[above] at (1.5,2.97) {$V_{DD}$};
  \draw (M3.G) -- (M4.G); \draw (1.5,2.2) |- (0,1.2) node[circ]{};
  \draw (M1.S) -- (M2.S);
  \draw (1.5,-0.77) node[circ]{} to[I,l=$I_{SS}$] (1.5,-2.3) node[ground]{};
  \draw (M1.G) node[left]{$V_{in}$ (large step up)};
  \draw (3,1.0) node[circ]{} -- (5,1.0) node[circ]{} coordinate(O) -- (6,1.0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C,l_=$C_L$] (5,-1.3) node[ground]{};
  \draw (M2.G) -- (4.2,0) |- (5,1.0);
  \draw[->,red,thick] (-0.35,1.6) -- (-0.35,0.6) node[midway,left,font=\scriptsize]{$I_{SS}$};
  \draw[->,red,thick] (3.4,1.6) -- (3.4,1.15) node[midway,right,font=\scriptsize]{$I_{SS}$};
  \draw[->,red,thick] (5.5,0.8) -- (5.5,-0.3) node[midway,right,font=\scriptsize]{$I_{SS}$};
  \node[font=\scriptsize,align=center] at (2.5,-3.1) {loop broken while $M_2$ is off: $dV_{out}/dt = I_{SS}/C_L$, independent of the input size};
\end{circuitikz}
\end{document}
```

$$
\boxed{SR = \frac{I_{max}}{C}}
$$

| Topology | Slew rate | Notes |
|---|---|---|
| 5T OTA | $I_{SS}/C_L$ (both directions) | Razavi Fig. 9.72 |
| 5T OTA with capacitive feedback $C_1$, $C_2$ | $I_{SS}/[C_1C_2/(C_1+C_2)]$ | Razavi Ex. 9.22 (no extra load) |
| Telescopic, fully differential | $\pm I_{SS}/(2C_L)$ per side, $I_{SS}/C_L$ differential | Razavi Fig. 9.74 |
| Folded cascode | $I_{SS}/C_L$ if $I_P \ge I_{SS}$ | Choose $I_P \approx I_{SS}$ |
| Two-stage (Miller) | $I_{D5}/C_C = V_{eff1}\,\omega_{ta}$ | Tony labels: $Q_5$ tail, $Q_6$ stage-2 source; needs $I_{D6} > I_{D5}$ |
| Current-mirror OTA | $KI_b/C_L$ | |

- **Two-stage:** $SR = I_{D5}/C_C$ and $\omega_{ta} = g_{m1}/C_C$ give $SR = V_{eff1}\omega_{ta}$. With $\omega_{ta}$ capped by $\omega_{p2}$, the only ways up are a larger input overdrive $V_{eff1}$ (costs gain and noise) or a higher $\omega_{p2}$ (Tony Ex. 6.5: 200 µA / 1 pF = 200 V/µs).
- **Raising SR** at fixed $C_L$ means more current, so proportionally wider devices for the same swing. Power and input capacitance go up; gain stays fixed (linear scaling).

> [!warning] Folded cascode: slewing can wreck recovery (Razavi Figs. 9.75–9.77, Tony §6.4.2)
> If $I_{SS} > I_P$, during slewing $M_3$ turns off and $V_X$ crashes until $M_1$ and the tail go triode. Afterwards $X$ must swing all the way back before linear settling starts. **Clamp transistors** (to a diode, or straight to $V_{DD}$) limit the excursion. In Tony's version the clamp current also raises $I_{D3}$, $I_{D4}$ temporarily, which increases the slew rate (80 → 124 V/µs in Ex. 6.9).

#### When Does a Closed Loop Slew? (ECE 636)

```tikz title="Same closed-loop amp (tau = 0.2 us, 1-V step, 0.01% settling): with SR = 1 V/us it slews for 0.8 us, then settles linearly from 0.2 V away; total 2.32 us instead of 1.84 us. After ECE 636 slides 12-16 and Tony Ex. 6.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.6,0) node[right]{$t$ ($\mu$s)};
  \draw[->] (0,0) -- (0,3.8) node[above]{$v_o$ (V)};
  \draw[thick,domain=0:2.4,samples=60] plot ({3*\x},{3*(1-exp(-\x/0.2))});
  \draw[thick,red] (0,0) -- (2.4,2.4);
  \draw[thick,red,domain=0.8:2.4,samples=60] plot ({3*\x},{3*(0.8+0.2*(1-exp(-(\x-0.8)/0.2)))});
  \draw[dashed] (0,3) -- (7.3,3);
  \node[left,font=\scriptsize] at (0,3) {$K_i=1$};
  \draw[dotted] (2.4,0) -- (2.4,2.4) -- (0,2.4) node[left,font=\scriptsize]{$K_i-SR\,\tau=0.8$};
  \node[below left,font=\scriptsize] at (2.5,0) {$t_{slew}=0.8$};
  \foreach \t in {1,2} { \draw ({3*\t},0.06) -- ({3*\t},-0.06) node[below,font=\scriptsize]{\t}; }
  \node[font=\scriptsize,anchor=west] at (0.5,3.35) {linear: $K_i(1-e^{-t/\tau})$, initial slope $K_i/\tau=5$ V/$\mu$s};
  \node[font=\scriptsize,anchor=west,red] at (1.5,1.2) {slew at $SR=1$ V/$\mu$s, then linear settling};
  \node[font=\scriptsize,align=left,anchor=west] at (4.2,2.1) {$\tau=0.2\ \mu$s, $\epsilon=10^{-4}$:\\ no slewing: $9.21\tau=1.84\ \mu$s\\ \textcolor{red}{slewing: $0.8+7.6\tau=2.32\ \mu$s}};
\end{circuitikz}
\end{document}
```

Unity-gain follower, $v_i = K_iu(t)$, one pole with $\tau = 1/(\beta\cdot GBW)$. Linear response $v_o = K_i(1-e^{-t/\tau})$ has its maximum slope at $t=0$:

$$
\boxed{\text{slews if } \frac{K_i}{\tau} > SR \quad\Longleftrightarrow\quad K_i > SR\cdot\tau}
$$

$$
\boxed{t_{slew} = \frac{K_i}{SR}-\tau, \qquad v_o(t) = \begin{cases} SR\cdot t & t<t_{slew}\\ SR\,t_{slew} + (K_i - SR\,t_{slew})\big[1-e^{-(t-t_{slew})/\tau}\big] & t\ge t_{slew}\end{cases}}
$$

- Slewing ends where the linear exponential's slope equals SR, i.e. when the output is $SR\cdot\tau$ from its final value.
- The linear tail then needs $\tau\ln\big(SR\,\tau/(\epsilon K_i)\big)$ more.
- Example: $\tau = 0.2$ µs, $K_i = 1$ V, $\epsilon = 10^{-4}$. $SR = 10$ V/µs: $K_i/\tau = 5$ V/µs < SR, no slewing, $t = 9.21\tau = 1.84$ µs. $SR = 1$ V/µs: $t_{slew} = 0.8$ µs, then $7.6\tau$, total **2.32 µs (25% longer)**.

**Large-signal (full-power) bandwidth:** a sinusoid $K_{o,max}\sin\omega t$ has peak slope $K_{o,max}\omega$, so

$$
\boxed{\omega_{LS} = \frac{SR}{K_{o,max}} \approx \frac{I_D}{C_L}\cdot\frac{\beta}{K_{i,max}}, \qquad \omega_{SS} = \beta\cdot GBW}
$$

Both must exceed the highest signal frequency: $\omega_{SS}$ to avoid attenuation, $\omega_{LS}$ to avoid slew distortion. Razavi says the same thing: to pass $V_0\sin\omega_0t$, $SR > V_0\omega_0$.

> [!tip] Remark
> $SR\cdot\tau$ is the largest step that settles linearly. It is the same "$I/C$ vs. $g_m/C$" ratio again: for a 5T OTA in unity gain, $SR\cdot\tau = (I_{SS}/C_L)(C_L/g_m) = I_{SS}/g_m = V_{OV}$ (square law, $I_D = I_{SS}/2$): exactly the input pair's overdrive. Bigger overdrive, bigger linear range ([[Differential Amplifiers#Large-Signal Characteristic]]).

> [!note]- Detail: the exit from slewing is gradual (Razavi Ex. 9.23)
> Call the pair "linear" once $|I_{D1}-I_{D2}| < \alpha I_{SS}$. That needs $|V_{in1}-V_{in2}| \approx \alpha\sqrt{I_{SS}/(\mu_nC_{ox}W/L)}$ (α times the equilibrium overdrive). For the capacitive-feedback OTA the slewing time is then $t \approx \frac{C_2}{I_{SS}}\big(V_0 - \alpha\sqrt{I_{SS}/(\mu_nC_{ox}W/L)}\big)$. The boundary depends on α, i.e. on the linearity you need: 1% allows a much larger α than 0.1%.

> [!note]- Detail: high-slew-rate (class-AB) op amps (Razavi §9.10)
> Slew rate normally costs quiescent current. **Push-pull** stages make the load current source active, so the current available rises only during slewing.
> - Inject the signal into the load mirror with the right polarity, plus tail currents for CM rejection (Razavi Fig. 9.79d). Differential slew rate:
> $$SR = \frac{I_{SS1} + I_{SS2}(W_4/W_8)}{C_L}$$
> With $W_4/W_8 = 5$ and $I_{SS2} = I_{SS1}$: 6× the slew rate for 2× the power.
> - The mirror path adds gain, $|A_v| \approx [g_{m1}+(W_4/W_8)g_{m5}](r_{o3}\|r_{o4})$, and a zero at $\big(\frac{W_4g_{m5}}{W_8g_{m1}}+1\big)\omega_{p,X}$. A large $W_4/W_8$ also lowers the mirror pole $\omega_{p,X} \approx g_{m8}/C_Y$, which falls as $1/W_4$.
> - Put a differential pair in front (Razavi Fig. 9.80): during a large step node $P$ or $Q$ swings near $V_{DD}$ and overdrives the output devices, so the available current is no longer a fixed multiple of a tail. Gain $g_{m9}(r_{o9}\|r_{o11})[g_{m1}+(W_4/W_8)g_{m5}](r_{o1}\|r_{o2})$.
> - Tony Fig. 6.30: double-output mirrors give $KI_{bias}$ both into one output and out of the other.

### Power Supply Rejection

$$
\boxed{\text{5T OTA: } \text{PSRR} \approx g_{mN}(r_{oP}\|r_{oN})}
$$

PSRR $= A_{in\to out}/A_{V_{DD}\to out}$, as defined in [[Single-Stage#Amplifier Specifications]].

- In the 5T OTA the diode-connected $M_3$ clamps $X$ to $V_{DD}$, and by symmetry $V_{out} = V_X$, so supply noise reaches the output with gain ≈ 1.
- With capacitive feedback $C_1$, $C_2$ (Razavi Ex. 9.25), $V_{out}/V_{DD} = 1/[g_{m2}r_{o4}\frac{C_1}{C_1+C_2}+1]$. Feedback divides the supply gain and the input gain by the same $1+$ loop gain, so **PSRR stays ≈ $g_{m2}r_{o4}$**: feedback doesn't improve PSRR.
- Fully differential topologies reject supply noise as a CM signal; that's why they are preferred on noisy supplies.

### Noise

Rule for spotting noise sources: wiggle each gate by a small amount and see if the output moves. **Cascode devices contribute little at low frequency**; the input pair and the current-source loads dominate. At least four devices always contribute.

$$
\boxed{\text{Telescopic: } \overline{V_n^2} = 4kT\left(\frac{2\gamma}{g_{m1,2}} + \frac{2\gamma g_{m7,8}}{g_{m1,2}^2}\right) + \frac{2K_N}{(WL)_{1,2}C_{ox}f} + \frac{2K_P}{(WL)_{7,8}C_{ox}f}\frac{g_{m7,8}^2}{g_{m1,2}^2}}
$$

$$
\boxed{\text{Folded cascode (thermal): } \overline{V_n^2} = 8kT\left(\frac{\gamma}{g_{m1,2}} + \gamma\frac{g_{m5,6}}{g_{m1,2}^2} + \gamma\frac{g_{m9,10}}{g_{m1,2}^2}\right)}
$$

Labels follow the [[#Folded Cascode]] figure: $M_5$–$M_6$ are the NMOS folding sources, $M_9$–$M_{10}$ the PMOS sources; the cascodes $M_3,M_4,M_7,M_8$ drop out. Razavi Eq. 9.91 is the same result for his NMOS-input Fig. 9.85, where the two current-source pairs are called $M_7$–$M_8$ (PMOS) and $M_9$–$M_{10}$ (NMOS).

$$
\boxed{\text{Two-stage (thermal): } \overline{V_n^2} = \frac{8kT\gamma}{g_{m1}^2}\left[g_{m1}+g_{m3}+\frac{g_{m5}+g_{m7}}{g_{m5}^2(r_{o1}\|r_{o3})^2}\right]}
$$

- Folded cascode: **both** the top and bottom current sources add noise (three pairs vs. two), so it is noisier than the telescopic.
- Two-stage: the second stage's noise is divided by the first stage's gain squared, so it is usually negligible.
- Every load term goes as $g_{m,load}/g_{m,in}^2$: give loads a **large** overdrive (small $g_m$) and the input pair a **small** one. That fights swing, since large load overdrive eats headroom.
- $1/f$-critical: use a PMOS input pair.
- **Noise vs. power:** halve all widths and currents and the power halves, $\overline{V_n^2}$ doubles, gain and swing stay put (Razavi §9.12, end).

> [!tip] Remark
> Each term is a drain noise current $4kT\gamma g_m$ referred to the input through $g_{m,in}^2$, as in [[Noise]]. The two-stage result is the cascade (Friis) idea: later stages are divided by the gain before them.

> [!note]- Detail: worked noise number (Razavi Ex. 9.26)
> Two-stage with **diode** first-stage loads: $(W/L)_{1,2} = 50/0.6$, $(W/L)_{3,4} = 10/0.6$, $(W/L)_{5,6} = 20/0.6$, $(W/L)_{7,8} = 56/0.6$, $\mu_nC_{ox} = 75$, $\mu_pC_{ox} = 30$ µA/V², $\gamma = 2/3$. Stage-1 gain is only $g_{m1}/g_{m3} = \sqrt{(50\cdot75)/(10\cdot30)} \approx 3.54$, so stage 2 is not negligible: $M_5$/$M_7$ give $2.29\times10^{-18}$ V²/Hz at the input, $M_1$/$M_3$ give $1.10\times10^{-17}$. Total $2\times(\ldots) = 2.66\times10^{-17}$ V²/Hz, **5.16 nV/√Hz**.

## Level 6: Nanometer Reality

Razavi Ch. 9 uses square-law hand design; in nanometer processes the numbers shift. These come from Razavi Ch. 11 via the Zettelkasten and are only previews here.

- **Intrinsic gain is low:** $g_mr_o$ of about 7–10 at minimum length in 40 nm, so even a telescopic cascode tops out near 100 (Zettelkasten 8r1). This pushes designs to two stages or gain boosting. Length is the remaining knob: intrinsic gain rises with $L$ at constant overdrive.
- **Gain droops at full swing:** devices near the rails lose $V_{DS}$ margin. In Razavi's two-stage example the stage gains fall from 46.3 × 11.2 = 518 to 39.5 × 10.2 = 403 across a ±0.5-V output, which eats the gain-error budget (Zettelkasten 8z). Recover by lengthening the devices that set $R_{out}$.
- **Size from simulated curves**, not the square law ([[MosFETs#gm/ID and ID/W Simulation-Aided Design]]).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $A_0$ (cascode, boost, 2nd stage) | Gain error $1/(\beta A_0)$, linearity | Swing (cascode), poles (2nd stage, booster doublet), power (boost) |
| ↑ $g_{m1}$ (input $W$, current) | GBW ($g_{m1}/C$), gain, thermal noise | Input capacitance; more current = power |
| ↓ input overdrive $V_{eff1}$ | $g_m$ per current, noise | Slew rate ($SR = V_{eff1}\omega_{ta}$ two-stage), linear input range |
| ↑ load overdrive | Load noise ($g_{m,load}/g_{m1}^2$) | Output swing |
| Cascoding | Gain × $g_mr_o$ | One overdrive of swing per device; another pole |
| Folding | Free input CM, equal in/out CM, wider CM range | Power (extra branch), gain (2–3×), lower folding pole, more noise |
| Second stage | Rail-to-rail-ish output swing; stage 1 can be cascoded | Compensation ($C_C$, RHP zero), lower speed, CMFB per stage |
| Gain boosting | Gain without headroom (≈ quadruple cascode) | Booster power, pole-zero doublet → slow settling |
| ↑ $K$ (current-mirror OTA) | $G_m = Kg_{m1}$, SR $= KI_b/C_L$ | Second pole drops toward $\omega_{ta}$; thermal noise |
| Fully differential | 2× swing, +3 dB SNR, even-order cancel, CM noise rejection, no mirror pole | CMFB: sensing costs swing/capacitance; another loop to stabilize |
| ↑ tail / bias current (linear scaling) | SR, speed into $C_L$, noise | Power, area, input capacitance; gain and swing unchanged |
| PMOS input pair | Lower $1/f$; in a two-stage, NMOS 2nd stage → higher $\omega_{p2}$ | Lower $g_m$ (gain, thermal noise) |
| Complementary input pairs | Rail-to-rail input CM | $G_m$ varies with CM (gain, bandwidth, noise move) |
| Clamps (folded cascode) | Slew recovery, higher SR | Two more devices |
| Push-pull / class AB | SR beyond quiescent current | Extra signal path → zero, lower mirror pole |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Closed-loop gain / error | $\frac{A_0}{1+\beta A_0}\approx\frac1\beta\left(1-\frac{1}{\beta A_0}\right)$; error $1/(\beta A_0)$ |
| Closed-loop time constant | $\tau = 1/[(1+\beta A_0)\omega_0]\approx 1/(\beta\omega_u)$; $t_\epsilon=\tau\ln(1/\epsilon)$ |
| Capacitive feedback factor | $\beta = C_2/(C_1+C_2+C_{in})$ |
| One-stage gain | $\lvert A_v\rvert = G_mR_{out}$ |
| Simple op amp | $g_{mN}(r_{oN}\|r_{oP})$; unity-gain buffer $R_{out}\approx 1/g_{mN}$ |
| Simple buffer input range | $V_{ISS}+V_{GS1}\le V_{in}\le V_{DD}-\lvert V_{GS3}\rvert+V_{TH1}$ |
| Telescopic gain | $g_{m1}[(g_{m3}r_{o3}r_{o1})\|(g_{m5}r_{o5}r_{o7})]$ |
| Telescopic swing | $2[V_{DD}-(V_{OD1}+V_{OD3}+V_{ISS}+\lvert V_{OD5}\rvert+\lvert V_{OD7}\rvert)]$ |
| Telescopic buffer range | $V_{TH4}-(V_{GS4}-V_{TH2})$ |
| Folded-cascode gain | $g_{m1}\{[(g_{m3}+g_{mb3})r_{o3}(r_{o1}\|r_{o5})]\|[(g_{m7}+g_{mb7})r_{o7}r_{o9}]\}$ |
| Folded-cascode swing | $V_{DD}-(V_{OD3}+V_{OD5}+\lvert V_{OD7}\rvert+\lvert V_{OD9}\rvert)$ per side |
| Current-mirror OTA | $\omega_{ta}=Kg_{m1}/C_L$, $SR=KI_b/C_L$, $I_{total}=(3+K)I_{D1}$ |
| Two-stage gain (Razavi labels: $M_5$ driver, $M_7$ source) | $g_{m1}(r_{o1}\|r_{o3})\,g_{m5}(r_{o5}\|r_{o7})$; swing $V_{DD}-\lvert V_{OD5}\rvert-V_{OD7}$ |
| Miller two-stage (Tony labels: $Q_7$ driver = Razavi $M_5$) | $\omega_{ta}=g_{m1}/C_C$, $\omega_{p1}\approx 1/(g_{m7}R_1R_2C_C)$, $\omega_{p2}\approx g_{m7}/(C_1+C_2)$, $\omega_z=-g_{m7}/C_C$ |
| Zero systematic offset (Tony labels) | $(W/L)_7/(W/L)_4 = 2(W/L)_6/(W/L)_5$ |
| Gain-boosted $R_{out}$, gain | $r_{o2}+(A_1+1)g_{m2}r_{o2}r_{o1}+r_{o1}$; $(A_1+1)g_{m1}r_{o1}g_{m2}r_{o2}$ |
| Gain-boost poles/zero | $\omega_{p1}\approx 1/(A_0g_{m2}r_{o2}r_{o1}C_L)$, $\omega_{p2}\approx(A_0+1)\omega_0+1/(g_{m2}r_{o2}r_{o1}C_L)$, $\omega_z\approx(A_0+1)\omega_0$ |
| CM error without CMFB | $\Delta V_{out,CM}=(I_P-I_N)(R_P\|R_N)$ |
| Triode CMFB sensitivity | $dV_{out,CM}/dV_b \approx (V_{GS7,8}-V_{TH7,8})/V_{DS7,8}$ |
| Two-stage, CMFB per stage | $g_{m1}(r_{o1}\|r_{o3}\|R_1)\,g_{m5}(r_{o5}\|r_{o7}\|R_3)$ |
| Slew rate | $SR=I_{max}/C$; two-stage (Tony labels, $I_{D5}$ = tail) $I_{D5}/C_C=V_{eff1}\omega_{ta}$ |
| Slew condition / time | slews if $K_i>SR\,\tau$; $t_{slew}=K_i/SR-\tau$ |
| Large-signal bandwidth | $\omega_{LS}=SR/K_{o,max}$; need $SR>V_0\omega_0$ |
| PSRR (5T OTA) | $\approx g_{mN}(r_{oP}\|r_{oN})$ |
| Telescopic noise | $4kT(\frac{2\gamma}{g_{m1}}+\frac{2\gamma g_{m7}}{g_{m1}^2})+\frac{2K_N}{(WL)_1C_{ox}f}+\frac{2K_P}{(WL)_7C_{ox}f}\frac{g_{m7}^2}{g_{m1}^2}$ |
| Folded-cascode noise | $8kT(\frac{\gamma}{g_{m1}}+\gamma\frac{g_{m5}}{g_{m1}^2}+\gamma\frac{g_{m9}}{g_{m1}^2})$ ($M_5$: NMOS folding source, $M_9$: PMOS source) |
| Two-stage noise (Razavi labels) | $\frac{8kT\gamma}{g_{m1}^2}[g_{m1}+g_{m3}+\frac{g_{m5}+g_{m7}}{g_{m5}^2(r_{o1}\|r_{o3})^2}]$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 9 Operational Amplifiers, pp. 344–405 (all of it): §9.1 performance parameters (Exs. 9.1–9.3); §9.2 one-stage op amps: basic, telescopic, buffer range, design procedure, linear scaling, folded cascode and its properties (Exs. 9.4–9.9, Figs. 9.6–9.21); §9.3 two-stage (Ex. 9.10, Figs. 9.22–9.25); §9.4 gain boosting (Exs. 9.11–9.15, Figs. 9.26–9.38); §9.5 comparison (Table 9.1); §9.6 output swing; §9.7 CMFB (Exs. 9.16–9.21, Figs. 9.40–9.64); §9.8 input range (Figs. 9.65–9.67); §9.9 slew rate (Exs. 9.22–9.23); §9.10 high-slew-rate op amps (Ex. 9.24); §9.11 PSRR (Ex. 9.25); §9.12 noise (Ex. 9.26).
  - Ch. 11 §11.5–11.6 (via the Zettelkasten only): complementary-follower CM sensing, CM-loop compensation, capacitive feedback, gain droop at full swing, nanometer intrinsic gain.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): Ch. 6 §6.1 two-stage opamp (gain, frequency response, slew rate, n- vs p-channel input, systematic offset; Exs. 6.1–6.6), pp. 242–254; §6.2.2 compensation procedure only, pp. 256–258; §6.4 folded cascode (Exs. 6.9–6.10), pp. 268–274; §6.5 current-mirror opamp (Ex. 6.11), pp. 275–279; §6.6 linear settling revisited, pp. 279–280; §6.7 fully differential opamps and low-supply opamps, pp. 281–288; §6.8 CMFB circuits, pp. 288–292.
- **ECE 636 (Fall 2026), "Effect of Slew-Rate Limiting on Amplifier Response"** (P. M. Levine), slides 3–16: large-signal bandwidth, slew condition, slew time, piecewise output, worked settling example.
- **Zettelkasten extensions** (`AnalogTheory/Op-Amps and OTAs/`, structure note `S8 Op-Amps and OTAs`): 8a3 (capacitive feedback adds no pole), 8t (complementary source followers), 8t1, 8t2, 8t2a (CM loop sizing, measurement, compensation), 8r1 (40-nm intrinsic gain caps telescopic gain), 8z (gain droop at full swing). The rest of the S8 folder follows Razavi Ch. 9 and was used as a cross-check.
