---
title: Differential Amplifiers
description: The differential pair from why-differential to large-signal steering, the half circuit, common-mode rejection, MOS and active-mirror loads, and the Gilbert cell.
kind: topic
status: growing
aliases:
  - Differential Amplifiers
  - Differential Pair
---

Two matched transistors sharing one tail current. The note starts with the pair as a black box (what a differential signal buys you), then opens it one level per section: large-signal steering, the half circuit, common-mode response with mismatch, MOS loads, the active-mirror (five-transistor) OTA, and finally the Gilbert cell. Stop after any section and the picture is still correct, just coarser.

## The big picture

```tikz title="The differential pair on one screen: the tail fixes I_D1 + I_D2 = I_SS, so the input difference only steers current from one side to the other. Gain is the slope at balance; the output saturates at plus or minus R_D I_SS once one side takes all of I_SS. After Razavi Figs. 4.7 and 4.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \node at (0.55,-0.25) {\scriptsize $M_1$};
  \node at (2.05,-0.25) {\scriptsize $M_2$};
  \draw (M1.S) |- (1.3,-1.1) -| (M2.S);
  \draw (1.3,-1.1) node[circ]{} node[above]{$P$} to[I, l=$I_{SS}$] (1.3,-2.9) node[ground]{};
  \draw (M1.D) to[R, l=$R_D$, -*] (0,2.5) -- (M2.D |- 0,2.5) to[R, l_=$R_D$] (M2.D);
  \draw (1.3,2.5) -- (1.3,2.8) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} -- (-0.7,0.77) node[left]{$V_{out1}$};
  \draw (M2.D) node[circ]{} -- (3.3,0.77) node[right]{$V_{out2}$};
  \begin{scope}[xshift=7.4cm,yshift=-0.4cm]
    \draw[->] (-2.6,0) -- (2.8,0) node[right] {$V_{in1}-V_{in2}$};
    \draw[->] (0,-2.1) -- (0,2.3) node[above] {$V_{out1}-V_{out2}$};
    \draw[thick,domain=-1:1,samples=50] plot (\x,{-1.6*\x*sqrt(2-\x*\x)});
    \draw[thick] (1,-1.6) -- (2.5,-1.6);
    \draw[thick] (-1,1.6) -- (-2.5,1.6);
    \draw[dashed] (-0.55,1.24) -- (0.55,-1.24);
    \node[font=\scriptsize,anchor=east] at (-0.15,-0.5) {slope $-g_mR_D$};
    \node[font=\scriptsize,anchor=west] at (0.08,1.6) {$+R_DI_{SS}$};
    \node[font=\scriptsize,anchor=east] at (-0.08,-1.6) {$-R_DI_{SS}$};
    \draw[dotted] (1,0) -- (1,-1.6);
    \draw[dotted] (-1,0) -- (-1,1.6);
    \node[font=\scriptsize,above] at (1,0) {$\Delta V_{in1}$};
    \node[font=\scriptsize,below] at (-1,0) {$-\Delta V_{in1}$};
    \node[font=\scriptsize,align=center] at (1.9,-2.1) {$M_1$ takes all $I_{SS}$};
    \node[font=\scriptsize,align=center] at (-1.9,2.0) {$M_2$ takes all};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The results the rest of the note refines
> 1. **The tail sets the bias:** $I_{D1}+I_{D2}=I_{SS}$ whatever the input CM level, so $V_{out,CM} = V_{DD}-R_DI_{SS}/2$ and the output limits ($V_{DD}$, $V_{DD}-R_DI_{SS}$) don't depend on the input CM.
> 2. **Differential gain = half-circuit gain:** $|A_v| = g_mR_D$, where the half circuit is a [[Single-Stage#Common-Source Stage|common-source stage]]. Taking the output single-ended halves it.
> 3. **Linear range:** one side turns off at $\Delta V_{in1} = \sqrt2\,V_{OV}$ (equilibrium overdrive). More linearity means more overdrive, which means less $g_m$ for the same current.
> 4. **Common-mode rejection is only as good as the tail impedance and the matching:** $\text{CMRR}\approx \dfrac{g_m}{\Delta g_m}(1+2g_mR_{SS})$, and tail capacitance erodes it at high frequency.
> 5. **Active (current-mirror) load:** the five-transistor OTA gives a single-ended output with $|A_v|\approx g_m(r_{o2}\|r_{o4})$ and CMRR on the order of $(g_mr_o)^2$.
> 6. **Gilbert cell:** steer one tail current between two pairs of opposite gain and you get a gain that is continuously variable through zero: a VGA, multiplier, mixer.

**Map:** [[#Level 0 Why Differential|why differential]] → [[#Level 1 The Basic Pair, Qualitatively|tail current, CM range, swing]] → [[#Level 2 Quantitative Analysis|large-signal curve, half circuit, degeneration]] → [[#Level 3 Common-Mode Response|CM gain, mismatch, CMRR]] → [[#Level 4 MOS Loads|diode, current-source, cascode loads]] → [[#Level 5 The Active-Load Pair (Five-Transistor OTA)|five-transistor OTA]] → [[#Level 6 The Gilbert Cell|Gilbert cell]].

## Level 0: Why Differential

### Single-Ended vs Differential Signals

```tikz title="A differential signal is two nodes swinging equal and opposite around a common-mode (CM) level. Each side swings V_0 peak, so the difference swings 4V_0 peak-to-peak. After Razavi Fig. 4.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right] {$t$};
  \draw[->] (0,0) -- (0,3.4) node[above] {$V$};
  \draw[dashed] (0,1.6) -- (6.2,1.6); \node[left,font=\scriptsize] at (0,1.6) {$V_{CM}$};
  \draw[thick,domain=0:6,samples=80] plot (\x,{1.6+1*sin(\x*120)});
  \draw[thick,gray,domain=0:6,samples=80] plot (\x,{1.6-1*sin(\x*120)});
  \node[font=\scriptsize] at (0.9,2.85) {$V_X$};
  \node[font=\scriptsize,gray] at (0.9,0.35) {$V_Y$};
  \draw[<->] (6.4,1.6) -- (6.4,2.6) node[midway,right,font=\scriptsize] {$V_0$};
  \begin{scope}[xshift=8.6cm]
    \draw[->] (0,0) -- (5.2,0) node[right] {$t$};
    \draw[->] (0,-1.8) -- (0,2.4) node[above] {$V_X-V_Y$};
    \draw[thick,domain=0:4.8,samples=80] plot (\x,{2*sin(\x*150)});
    \draw[dashed] (0,2) -- (0.6,2);
    \draw[dashed] (0,-2) -- (1.8,-2);
    \node[left,font=\scriptsize] at (0,2) {$+2V_0$};
    \node[left,font=\scriptsize] at (0,-2) {$-2V_0$};
    \node[font=\scriptsize] at (2.6,-2.45) {$4V_0$ peak-to-peak};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{v_{DM} = v_1 - v_2,\qquad v_{CM} = \frac{v_1+v_2}{2}}
$$

- **Single-ended:** measured against a fixed potential (ground). **Differential:** measured between two nodes; strictly, both nodes should also see equal impedance to that potential.
- The CM level is the **bias** of the two nodes, the value with no signal.
- Swing bookkeeping: each side $V_0$ peak ⇒ $2V_0$ pp single-ended, **$4V_0$ pp differential**. A 1 V supply can deliver 1.6 V pp differential.

### What It Buys

| Advantage | Why |
|---|---|
| Rejects coupled noise | A clock line midway between the two signal lines kicks both phases equally; the difference is untouched |
| Rejects supply noise | A $V_{DD}$ step moves $V_X$ and $V_Y$ together; $V_X-V_Y$ doesn't move (a single CS stage passes it straight to the output) |
| Quieter aggressors | A differential clock's two phases couple equal and opposite charge into a victim and cancel |
| Twice the swing | Each output swings $V_{DD}-V_{OV}$; the difference swings $2(V_{DD}-V_{OV})$ |
| Simpler biasing, better linearity | Even-order terms cancel ([[#Large-Signal Characteristic]]) |

Cost: roughly twice the area, and a single-ended CS stage reaches the same gain with half the bias current (Razavi Ex. 5.12). Razavi's verdict: the advantages far outweigh it.

> [!note]- Detail: differential victims *and* differential aggressors (Razavi Ex. 4.1)
> Putting a differential victim pair between $CK$ and $\overline{CK}$ makes it worse: $V_{out}^+$ and $V_{out}^-$ see opposite jumps, so the difference is corrupted. Fix: swap which clock phase each line runs next to halfway along the route. The couplings from $CK$ and $\overline{CK}$ then cancel on each line separately. This is the **twisted pair**.

## Level 1: The Basic Pair, Qualitatively

### Why a Tail Current Source

Two independent CS stages [Razavi Fig. 4.6(a)] already process both phases, but their bias currents follow the input CM level. A CM shift moves $g_m$ (gain) and the output CM (swing); a low CM can even turn both devices off and clip. Tying the sources to one current source $I_{SS}$ pins the total:

$$
\boxed{I_{D1}+I_{D2} = I_{SS},\qquad V_{out,CM} = V_{DD}-R_D\frac{I_{SS}}{2}}
$$

The pair is also called a *source-coupled* or *long-tailed* pair. Reading the [[#The big picture|transfer curve]]:

- For $V_{in1}\ll V_{in2}$, $M_1$ is off: $V_{out1}=V_{DD}$, $V_{out2}=V_{DD}-R_DI_{SS}$. Mirror image for $V_{in1}\gg V_{in2}$ (one side "hogs" $I_{SS}$).
- At $V_{in1}=V_{in2}$ (**equilibrium**) both outputs sit at the CM level and the slope (gain) is largest. It falls to zero as $|V_{in1}-V_{in2}|$ grows.
- Three differential quantities: $V_{in1}-V_{in2}$, $V_{out1}-V_{out2}$, $I_{D1}-I_{D2}$.

### Input Common-Mode Range

```tikz title="Differential gain versus input CM level, with the tail realized by NMOS M_3 at gate bias V_b. Below V_1 the tail is in triode (current not yet fixed); above V_2 the input pair enters triode. After Razavi Figs. 4.9(c) and 4.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.4,0) node[right] {$V_{in,CM}$};
  \draw[->] (0,0) -- (0,3.2) node[above] {$|A_v|$};
  \draw[thick] (0,0) -- (1.2,0);
  \draw[thick] plot[smooth] coordinates {(1.2,0) (1.8,0.6) (2.6,1.7) (3.2,2.35) (3.6,2.5)};
  \draw[thick] (3.6,2.5) -- (5.8,2.55);
  \draw[thick] plot[smooth] coordinates {(5.8,2.55) (6.4,2.2) (7.0,1.3) (7.8,0.6)};
  \foreach \x/\l in {1.2/{$V_{TH}$},3.6/{$V_1$},5.8/{$V_2$}} { \draw[dotted] (\x,0) -- (\x,2.9); \node[below] at (\x,0) {\l}; }
  \node[font=\scriptsize,align=center] at (2.35,2.75) {tail in\\ triode};
  \node[font=\scriptsize,align=center] at (4.7,2.95) {usable\\ window};
  \node[font=\scriptsize,align=center] at (7.1,2.75) {$M_{1,2}$ in\\ triode};
  \node[font=\scriptsize,anchor=west] at (0.2,-0.95) {$V_1 = V_{GS1}+V_{OV3}$ \quad $V_2 = V_{DD}-R_DI_{SS}/2+V_{TH}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{GS1} + (V_{GS3}-V_{TH3}) \;\le\; V_{in,CM} \;\le\; \min\!\left[V_{DD}-R_D\frac{I_{SS}}{2}+V_{TH},\; V_{DD}\right]}
$$

- **Lower bound:** the tail needs $V_{DS3}\ge V_{OV3}$ to be a current source. Below that, $M_1$/$M_2$ act as a source follower dragging $V_P$ up with $V_{in,CM}$ and the tail current grows.
- **Upper bound:** the input devices stay saturated only while $V_{in,CM} \le V_{out,CM}+V_{TH}$. Above it the CM characteristic doesn't change but the differential gain drops.

> [!tip] Remark
> Both bounds are the saturation test from [[MosFETs#Regions of Operation]]: an NFET is saturated while $V_D \ge V_G - V_{TH}$, applied to the tail and to the input pair.

### Output Swing

For high gain (input swing ≪ output swing), $M_{1,2}$ stay saturated while each output stays above about $V_{in,CM}-V_{TH}$. **The lower the input CM, the more output swing**, but no lower than the bound above. With that choice:

$$
\boxed{\text{single-ended pp swing} \approx V_{DD} - V_{OV1} - V_{OV3},\qquad \text{differential} \approx 2V_{DD} - 4V_{OV}}
$$

> [!note]- Detail: compared with a CS stage, and the nanometer catch (Razavi Ex. 4.3, p. 106)
> A resistively loaded CS stage swings $V_{DD}$ minus one overdrive. The pair swings $V_{DD}$ minus two overdrives per side, but $2V_{DD}-4V_{OV}$ differentially, which is usually much larger.
>
> In nanometer processes the gain of such a pair "hardly exceeds 5" (Razavi), so the input swing is no longer negligible: with peak input $V_0$, the minimum allowable output is $V_{in,CM}+V_0-V_{TH}$. This applies to any stage with negative gain.

## Level 2: Quantitative Analysis

### Large-Signal Characteristic

```tikz title="Left: drain currents steer from I_SS/2 each to all-or-nothing at plus or minus Delta V_in1. Right: the pair's transconductance peaks at balance and reaches zero where one side turns off. After Razavi Fig. 4.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-3,0) -- (3.2,0) node[right] {$\Delta V_{in}$};
  \draw[->] (0,0) -- (0,3.1) node[above] {$I_D$};
  \draw[thick,domain=-1:1,samples=60] plot ({1.6*\x},{1.25*(1+\x*sqrt(2-\x*\x))});
  \draw[thick,gray,domain=-1:1,samples=60] plot ({1.6*\x},{1.25*(1-\x*sqrt(2-\x*\x))});
  \draw[thick] (1.6,2.5) -- (3,2.5); \draw[thick] (-3,0) -- (-1.6,0);
  \draw[thick,gray] (-1.6,2.5) -- (-3,2.5); \draw[thick,gray] (1.6,0.03) -- (3,0.03);
  \node[font=\scriptsize,anchor=west] at (2.0,2.75) {$I_{D1}\to I_{SS}$};
  \node[font=\scriptsize,gray,anchor=east] at (-2.0,2.75) {$I_{D2}$};
  \draw[dashed] (-3,1.25) -- (3,1.25) node[right,font=\scriptsize] {$I_{SS}/2$};
  \draw[dotted] (1.6,0) -- (1.6,2.5); \draw[dotted] (-1.6,0) -- (-1.6,2.5);
  \node[below,font=\scriptsize] at (1.6,0) {$+\Delta V_{in1}$};
  \node[below,font=\scriptsize] at (-1.6,0) {$-\Delta V_{in1}$};
  \begin{scope}[xshift=7.6cm]
    \draw[->] (-3,0) -- (3.2,0) node[right] {$\Delta V_{in}$};
    \draw[->] (0,0) -- (0,3.1) node[above] {$G_m$};
    \draw[thick,domain=-1:1,samples=60] plot ({1.6*\x},{2.4*(1-\x*\x)/sqrt(1-\x*\x/2)});
    \draw[thick] (1.6,0) -- (3,0); \draw[thick] (-1.6,0) -- (-3,0);
    \node[font=\scriptsize,anchor=south west] at (0.05,2.4) {$g_m=\sqrt{\mu_nC_{ox}\frac WL I_{SS}}$};
    \node[below,font=\scriptsize] at (1.6,0) {$+\Delta V_{in1}$};
    \node[below,font=\scriptsize] at (-1.6,0) {$-\Delta V_{in1}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{I_{D1}-I_{D2} = \tfrac12\mu_nC_{ox}\frac WL\,\Delta V_{in}\sqrt{\frac{4I_{SS}}{\mu_nC_{ox}W/L}-\Delta V_{in}^2}}
\qquad (\Delta V_{in} = V_{in1}-V_{in2})
$$

$$
\boxed{G_m\big|_{\Delta V_{in}=0} = \sqrt{\mu_nC_{ox}\frac WL I_{SS}} = g_m\ \text{of one device at } I_{SS}/2}
$$

$$
\boxed{\Delta V_{in1} = \sqrt{\frac{2I_{SS}}{\mu_nC_{ox}W/L}} = \sqrt2\,(V_{GS}-V_{TH})_{eq}}
$$

- $I_{D1}-I_{D2}$ is an **odd** function of $\Delta V_{in}$ even though each $I_D$ is a square law: even-order distortion cancels ([[Nonlinearity and Mismatch]]).
- $\Delta V_{in1}$ is the largest input difference the pair can "handle". The formula only holds for $|\Delta V_{in}|<\Delta V_{in1}$; past it one device is off and the current is flat at $\pm I_{SS}$. (Taken literally, the square root would wrongly bring the current back to zero at $\sqrt2\,\Delta V_{in1}$.)
- **Linearity costs gain or power.** Widening $\Delta V_{in1}$ means raising $V_{OV}$: either shrink $W/L$ (less $g_m$) or raise $I_{SS}$ (more power). Larger $W/L$ narrows the range; larger $I_{SS}$ widens both the input range and the output current swing (Razavi Ex. 4.4).

> [!tip] Remark
> This is the $g_m = \sqrt{2\mu_nC_{ox}\frac WL I_D}$ from [[MosFETs#Transconductance]] with $I_D = I_{SS}/2$. The pair's $G_m$ *is* one device's $g_m$.

> [!note]- Derivation: the large-signal curve (Razavi Eqs. 4.2–4.14)
> Sources share node $P$, so $V_{in1}-V_{in2} = V_{GS1}-V_{GS2}$ (thresholds cancel; $\lambda = 0$). Invert the square law, $V_{GS} = \sqrt{2I_D/(\mu_nC_{ox}W/L)}+V_{TH}$:
> $$\Delta V_{in} = \sqrt{\frac{2I_{D1}}{\mu_nC_{ox}W/L}}-\sqrt{\frac{2I_{D2}}{\mu_nC_{ox}W/L}}$$
> Square, use $I_{D1}+I_{D2}=I_{SS}$:
> $$\tfrac12\mu_nC_{ox}\tfrac WL\Delta V_{in}^2 - I_{SS} = -2\sqrt{I_{D1}I_{D2}}$$
> Square again with $4I_{D1}I_{D2} = I_{SS}^2-(I_{D1}-I_{D2})^2$ and take the root to get the boxed result. Differentiating:
> $$G_m = \frac{\partial \Delta I_D}{\partial \Delta V_{in}} = \tfrac12\mu_nC_{ox}\tfrac WL\,\frac{\frac{4I_{SS}}{\mu_nC_{ox}W/L}-2\Delta V_{in}^2}{\sqrt{\frac{4I_{SS}}{\mu_nC_{ox}W/L}-\Delta V_{in}^2}}$$
> which is $\sqrt{\mu_nC_{ox}(W/L)I_{SS}}$ at $\Delta V_{in}=0$ and zero at $\Delta V_{in}^2 = 2I_{SS}/(\mu_nC_{ox}W/L)$.
>
> **Turn-off point.** When $M_2$ just turns off, $I_{D1}=I_{SS}$ and $V_{GS2}=V_{TH}$, so $\Delta V_{in1} = V_{GS1}-V_{TH} = \sqrt{2I_{SS}/(\mu_nC_{ox}W/L)}$. In equilibrium $(V_{GS}-V_{TH})_{eq} = \sqrt{I_{SS}/(\mu_nC_{ox}W/L)}$, a factor $\sqrt2$ smaller.

> [!note]- Detail: a dc offset costs gain (Razavi Ex. 4.5)
> If the two inputs carry a dc imbalance $V_{OS} = \Delta V_{in1}/2$, the pair sits off its peak: $I_{D1}-I_{D2} = (\sqrt7/4)I_{SS}$ ($I_{D1}\approx0.83I_{SS}$), and $G_m = \frac{3}{\sqrt{14}}\sqrt{\mu_nC_{ox}\frac WL I_{SS}}$, about 20% below the equilibrium value. The output waveforms are offset by $(\sqrt7/4)I_{SS}R_D$ and smaller.

> [!note]- Detail: nanometer devices keep the $\sqrt2$ (Razavi p. 109 margin note)
> Simulating $W/L = 5\,\mu\text{m}/40$ nm with $I_{SS}=0.25$ mA, and calling "off" the point where one side carries 90% of $I_{SS}$, the cut-off voltage is still about $\sqrt2$ times the equilibrium overdrive.

### Small-Signal Gain and the Half Circuit

```tikz title="For a fully differential input, node P does not move (virtual ground), so each side is a common-source stage driven by plus or minus v_in/2. After Razavi Figs. 4.20 and 4.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$+\frac{v_{in}}{2}$};
  \node[right] at (M2.G) {$-\frac{v_{in}}{2}$};
  \draw (M1.S) |- (1.3,-1.1) -| (M2.S);
  \draw (1.3,-1.1) node[circ]{} node[above]{$P$} to[I, l=$I_{SS}$] (1.3,-2.7) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.3,-3.4) {$v_P=0$ (virtual ground)};
  \draw (M1.D) to[R, l=$R_D$] (0,2.3) -- (M2.D |- 0,2.3) to[R, l_=$R_D$] (M2.D);
  \draw (1.3,2.3) -- (1.3,2.6) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} -- (0.6,0.77) node[right]{$X$};
  \draw (M2.D) node[circ]{} -- (2.0,0.77) node[left]{$Y$};
  \node at (5.0,0.4) {$\Longrightarrow$};
  \begin{scope}[xshift=7.4cm]
    \draw (0,0) node[nmos](H){};
    \node[left] at (H.G) {$+\frac{v_{in}}{2}$};
    \draw (H.S) -- ++(0,-0.4) node[ground]{};
    \draw (H.D) to[R, l=$R_D$] (0,2.3) node[above]{$V_{DD}$};
    \draw (H.D) node[circ]{} -- (0.9,0.77) node[right]{$v_X = -g_mR_D\frac{v_{in}}{2}$};
    \node[font=\scriptsize,align=center] at (0.6,-2.1) {half circuit = common-source stage};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{v_X - v_Y}{v_{in1}-v_{in2}} = -g_mR_D \qquad\text{with } \lambda\ne0:\ -g_m(R_D\|r_o)}
$$

**Lemma (virtual ground).** If the pair is symmetric and the inputs move by $+\Delta V$ and $-\Delta V$ (small enough to stay linear), $V_P$ does not move. Each side seen from $P$ is a Thevenin source with equal resistance ($1/g_m$) and opposite voltage; they cancel. This holds even with a non-ideal tail.

> [!tip] Remark
> The half circuit is the [[Single-Stage#Common-Source Stage|common-source stage]], $A_v = -g_mR_D$ (or $-g_m(R_D\|r_o)$ with [[MosFETs#Channel-Length Modulation|CLM]]). Every CS result (degeneration, loads, cascoding) carries over to the pair unchanged. Only the *differential* gain uses it; CM analysis needs the [[#Level 3 Common-Mode Response|other half]] of the superposition.

- The gain is $g_mR_D$ **however the input is applied**: one gate driven, or both. A single-ended output (just $X$ or $Y$) gets half.
- **Pair vs one transistor at equal power:** each device carries $I_{SS}/2$, so its $g_m$ is $1/\sqrt2$ that of one device of the same size biased at $I_{SS}$. The pair's $G_m$ is that much lower.

> [!note]- Derivation: Method I, superposition without the lemma (Razavi Eqs. 4.18–4.23)
> Ground $V_{in2}$ and drive $V_{in1}$ only.
> - **At $X$:** $M_1$ is a [[Single-Stage#Source Degeneration|degenerated CS stage]], degenerated by the resistance looking into $M_2$'s source, $1/g_{m2}$: $v_X/v_{in1} = -R_D/(1/g_{m1}+1/g_{m2})$.
> - **At $Y$:** replace $M_1$ by its Thevenin equivalent at $P$ ($v_T = v_{in1}$, $R_T = 1/g_{m1}$, a [[Single-Stage#Source Follower|source follower]]); $M_2$ is then a [[Single-Stage#Common-Gate Stage|common-gate stage]]: $v_Y/v_{in1} = +R_D/(1/g_{m1}+1/g_{m2})$.
>
> So $(v_X-v_Y)|_{v_{in1}} = -2R_D v_{in1}/(1/g_{m1}+1/g_{m2}) = -g_mR_Dv_{in1}$ for $g_{m1}=g_{m2}$. By symmetry $v_{in2}$ gives $+g_mR_Dv_{in2}$; add them.
>
> Carusone (§3.8) reaches the same point with the T model: $i_{d1} = v_{in}/(1/g_{m1}+1/g_{m2}) = g_{m1}v_{in}/2$, $i_{d2} = -i_{d1}$, so $i_{d1}-i_{d2} = g_{m1}v_{in}$.

> [!note]- Derivation: why $V_P$ stays still (Razavi Lemma, Fig. 4.20)
> Let $V_1$, $V_2$ (the gate-source voltages) move by $\Delta V_1$, $\Delta V_2$. With an ideal tail, $g_m\Delta V_1 + g_m\Delta V_2 = 0$, so $\Delta V_1 = -\Delta V_2$. Also $V_{in1}-V_1 = V_{in2}-V_2 = V_P$, which with inputs $V_0\pm\Delta V_{in}$ gives $2\Delta V_{in} = \Delta V_1-\Delta V_2 = 2\Delta V_1$. The input change is absorbed entirely by $V_{GS}$, so $V_P = V_{in1}-V_1$ doesn't move.

> [!note]- Detail: a mismatched pair (Razavi Ex. 4.6)
> If $M_2$ is twice as wide as $M_1$ with equal gate dc levels, $I_{D2} = 2I_{D1} = 2I_{SS}/3$, $g_{m2}=2g_{m1}$, and Method I gives $|A_v| = 2R_D/(1/g_{m1}+1/(2g_{m1})) = \tfrac43 g_{m1}R_D$: lower than a symmetric pair at the same $I_{SS}$, and the curve of [[#Large-Signal Characteristic]] shifts sideways (an offset).

### Arbitrary Inputs: Split into DM and CM

$$
\boxed{V_{in1} = \frac{V_{in1}-V_{in2}}{2} + \frac{V_{in1}+V_{in2}}{2},\qquad V_{in2} = \frac{V_{in2}-V_{in1}}{2}+\frac{V_{in1}+V_{in2}}{2}}
$$

Any pair of inputs is a differential part (use the half circuit) plus a common part (next level). Superpose. In the ideal symmetric pair with an ideal tail, the CM part does nothing: the currents stay at $I_{SS}/2$ and $V_X$, $V_Y$ stay at $V_{DD}-R_DI_{SS}/2$ (Razavi Ex. 4.8).

### Degenerated Pair

```tikz title="Degeneration with a split tail: in equilibrium no current flows through 2R_S, so no headroom is lost. After Razavi Fig. 4.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (3.2,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \draw (M1.S) node[circ]{} to[R, l_=$2R_S$] (M2.S) node[circ]{};
  \draw (M1.S) to[I, l_=$\frac{I_{SS}}{2}$] ++(0,-1.9) node[ground]{};
  \draw (M2.S) to[I, l=$\frac{I_{SS}}{2}$] ++(0,-1.9) node[ground]{};
  \draw (M1.D) to[R, l=$R_D$] (0,2.3) -- (M2.D |- 0,2.3) to[R, l_=$R_D$] (M2.D);
  \draw (1.6,2.3) -- (1.6,2.6) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} node[right]{$X$};
  \draw (M2.D) node[circ]{} node[left]{$Y$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V_{in2} - \Delta V_{in1} = R_SI_{SS}}\qquad
\boxed{|A_v| = \frac{R_D}{1/g_m + R_S}}
$$

- Degeneration widens the linear input range by about $\pm R_SI_{SS}$ and lowers the gain, which now depends less on $g_m$.
- With one resistor $R_S$ in each source and a single tail, each $R_S$ drops $R_SI_{SS}/2$, as if the tail needed that much more headroom: the input CM and the minimum output both rise, and the differential swing falls by $R_SI_{SS}$.
- **Split the tail** (two $I_{SS}/2$ sources, $2R_S$ between the sources) and no dc current flows through the resistor. The catch: the two tail sources now add differential noise and offset.

> [!tip] Remark
> The half circuit of a degenerated pair is the [[Single-Stage#Source Degeneration|degenerated CS stage]], $R_D/(1/g_m+R_S)$. With the split tail, the half circuit sees $R_S$ because the midpoint of $2R_S$ is the virtual ground.

> [!note]- Derivation: the wider turn-off point (Razavi Eqs. 4.31–4.34)
> At turn-off, $I_{D1}=I_{SS}$, $V_{GS2}=V_{TH}$: $V_{in1}-V_{GS1}-R_SI_{SS} = V_{in2}-V_{TH}$, so $\Delta V_{in2} = (V_{GS1}-V_{TH})+R_SI_{SS} = \Delta V_{in1}+R_SI_{SS}$.

## Level 3: Common-Mode Response

Real pairs have a finite tail impedance $R_{SS}$ and mismatched halves. Both let some input CM reach the output.

### Symmetric Pair, Finite Tail Resistance

```tikz title="With a pure CM input, symmetry makes v_X = v_Y, so the drains can be shorted and M_1, M_2 merged into one device with twice the g_m. After Razavi Fig. 4.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \draw (M1.G) -- ++(-0.3,0) coordinate(g1);
  \draw (M2.G) -- ++(0.3,0) coordinate(g2);
  \draw (g1) -- (g1 |- 0,-2.9) -- (g2 |- 0,-2.9) -- (g2);
  \draw (-1.6,-2.9) node[left]{$v_{in,CM}$} -- (g1 |- 0,-2.9);
  \draw (M1.S) |- (1.3,-1.0) -| (M2.S);
  \draw (1.3,-1.0) node[circ]{} node[above]{$P$} to[R, l=$R_{SS}$] (1.3,-2.1) -- (1.3,-2.1) node[ground]{};
  \draw (M1.D) to[R, l=$R_D$] (0,2.3) -- (M2.D |- 0,2.3) to[R, l_=$R_D$] (M2.D);
  \draw (1.3,2.3) -- (1.3,2.6) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} node[left]{$X$};
  \draw (M2.D) node[circ]{} node[right]{$Y$};
  \draw[dashed] (M1.D) -- (M2.D);
  \node[font=\scriptsize] at (1.3,0.45) {$v_X=v_Y$: short};
  \node at (4.8,0.3) {$\Longrightarrow$};
  \begin{scope}[xshift=7.0cm]
    \draw (0,0) node[nmos](H){};
    \node[left] at (H.G) {$v_{in,CM}$};
    \node[font=\scriptsize,anchor=west] at (0.15,-0.3) {$M_1{+}M_2$: $2g_m$};
    \draw (H.S) to[R, l=$R_{SS}$] ++(0,-1.4) node[ground]{};
    \draw (H.D) to[R, l=$R_D/2$] (0,2.3) node[above]{$V_{DD}$};
    \draw (H.D) node[circ]{} -- (0.8,0.77) node[right]{$v_{out}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{A_{v,CM} = \frac{v_{out}}{v_{in,CM}} = -\frac{R_D/2}{1/(2g_m)+R_{SS}}}
$$

- This moves the output **CM level** only; the differential output is untouched. It eats swing and shifts bias, but it is usually the minor problem.
- It can still bite. Razavi Ex. 4.9 (resistor tail, $R_{SS}=500\ \Omega$, $g_m = 1/632\ \Omega$, $R_D = 3.16$ kΩ for a differential gain of 5): a 50 mV CM rise drops the outputs by 96.8 mV, shrinking the margin to triode from 290 mV to 143 mV.

> [!tip] Remark
> This is a [[Single-Stage#Source Degeneration|degenerated CS stage]] again, with device $M_1{+}M_2$ ($2g_m$), load $R_D/2$, degeneration $R_{SS}$.

> [!note]- Detail: CM shifts propagate in nanometer chains (Razavi p. 119 margin note)
> Nanometer tail sources have low output impedance, so in two cascaded pairs a rising input CM lowers the first stage's output CM, which in turn raises the second stage's output CM.

### Mismatch Converts CM to DM

The serious problem: with any asymmetry, an input CM change produces a **differential** output, which looks exactly like signal.

**Load mismatch** ($R_D$ and $R_D+\Delta R_D$): both currents change by $\frac{g_m}{1+2g_mR_{SS}}\Delta V_{in,CM}$, but the drops differ:

$$
\boxed{\Delta V_X - \Delta V_Y = \frac{g_m\,\Delta R_D}{1+2g_mR_{SS}}\,\Delta V_{in,CM}}
$$

**Transconductance mismatch** ($g_{m1}\ne g_{m2}$, from $W/L$ and $V_{TH}$ mismatch; typically the larger effect):

$$
\boxed{A_{CM\text{-}DM} = -\frac{\Delta g_m\,R_D}{(g_{m1}+g_{m2})R_{SS}+1}}
$$

> [!note]- Derivation: $A_{CM\text{-}DM}$ from $g_m$ mismatch (Razavi Eqs. 4.46–4.53)
> With both gates at $v_{in,CM}$: $i_{D1} = g_{m1}(v_{in,CM}-v_P)$, $i_{D2} = g_{m2}(v_{in,CM}-v_P)$ and $(i_{D1}+i_{D2})R_{SS} = v_P$. So
> $$v_P = \frac{(g_{m1}+g_{m2})R_{SS}}{(g_{m1}+g_{m2})R_{SS}+1}v_{in,CM},\qquad v_{in,CM}-v_P = \frac{v_{in,CM}}{(g_{m1}+g_{m2})R_{SS}+1}$$
> Then $v_X = -g_{m1}R_D(v_{in,CM}-v_P)$, $v_Y = -g_{m2}R_D(v_{in,CM}-v_P)$, and their difference is the boxed result with $\Delta g_m = g_{m1}-g_{m2}$.

### CMRR

$$
\boxed{\text{CMRR} = \left|\frac{A_{DM}}{A_{CM\text{-}DM}}\right| \approx \frac{g_m}{\Delta g_m}\left(1+2g_mR_{SS}\right)\approx \frac{2g_m^2R_{SS}}{\Delta g_m}}
$$

($g_m$ = mean of $g_{m1}$, $g_{m2}$.) Two levers: better **matching** ($\Delta g_m/g_m$, see [[MosFETs#Layout]]) and a higher-impedance **tail** ($R_{SS}$, e.g. a cascode tail; see [[Current Mirrors]]). In practice every mismatch must be included, not just $g_m$.

> [!warning] An ideal tail is not enough (Razavi Ex. 4.11)
> If $g_{mb1}\ne g_{mb2}$, a CM change moves $V_P$, hence $V_{BS}$ of both devices, and the [[MosFETs#Body Effect|body-effect]] currents differ. CM converts to DM even with $R_{SS}\to\infty$.

> [!note]- Derivation: exact CMRR with $g_m$ mismatch only (Razavi Eqs. 4.56–4.58)
> From Method I with unequal $g_m$:
> $$|A_{DM}| = \frac{R_D}{2}\,\frac{g_{m1}+g_{m2}+4g_{m1}g_{m2}R_{SS}}{1+(g_{m1}+g_{m2})R_{SS}}$$
> Dividing by $|A_{CM\text{-}DM}|$: $\text{CMRR} = \dfrac{g_{m1}+g_{m2}+4g_{m1}g_{m2}R_{SS}}{2\Delta g_m}\approx\dfrac{g_m}{\Delta g_m}(1+2g_mR_{SS})$.

### Tail Capacitance: CMRR Falls with Frequency

```tikz title="With tail capacitance C_P, CM-to-DM conversion rises from its dc floor by the full factor 1 + 2 g_m R_SS, between a zero at 1/(R_SS C_P) and a pole near 2 g_m / C_P. Asymptotes only; output-node capacitance (neglected) eventually rolls it off again."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.2,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$|A_{CM-DM}|$ (log)};
  \draw[thick] (0,0.6) -- (2,0.6) -- (5.2,2.9) -- (7.8,2.9);
  \draw[dotted] (2,0) -- (2,0.6); \draw[dotted] (5.2,0) -- (5.2,2.9);
  \node[below,font=\scriptsize] at (2,0) {$\omega_z=\frac{1}{R_{SS}C_P}$};
  \node[below,font=\scriptsize] at (5.2,0) {$\omega_p\approx\frac{2g_m}{C_P}$};
  \node[font=\scriptsize,anchor=south west] at (0.1,0.65) {$\frac{\Delta g_mR_D}{1+2g_mR_{SS}}$};
  \node[font=\scriptsize,anchor=south] at (6.5,2.95) {$\Delta g_mR_D$ (tail shorted)};
  \node[font=\scriptsize,anchor=west,align=left] at (5.4,1.3) {rejection bought by $R_{SS}$\\ lost to $C_P$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_{CM\text{-}DM}(s) = -\Delta g_mR_D\,\frac{1+sR_{SS}C_P}{1+2g_mR_{SS}+sR_{SS}C_P}}
$$

$C_P$ is the parasitic capacitance at $P$: the tail device's own capacitance plus the source-bulk junctions of $M_1$, $M_2$. At high frequency it shunts $R_{SS}$, so even a very high-impedance tail stops helping. Supply noise that reaches a pair's inputs as CM (e.g. through the loads of a previous stage) gets converted more and more as its frequency rises (Razavi Ex. 4.10).

> [!tip] Remark
> This is the $A_{CM\text{-}DM}$ above with $R_{SS}\to R_{SS}\|\frac{1}{sC_P}$. The capacitances come from [[MosFETs#Capacitances]]; the frequency-domain view continues in [[Frequency Response]].

> [!note]- Derivation: the zero and the pole
> Substitute $Z_{SS} = R_{SS}/(1+sR_{SS}C_P)$ for $R_{SS}$ in $A_{CM\text{-}DM} = -\Delta g_mR_D/(2g_mZ_{SS}+1)$ and clear fractions. Zero at $1/(R_{SS}C_P)$, pole at $(1+2g_mR_{SS})/(R_{SS}C_P)\approx 2g_m/C_P$. For $R_{SS}\to\infty$ (Razavi Eq. 4.54): $|A_{CM\text{-}DM}| = \Delta g_mR_D/\sqrt{1+(2g_m/(C_P\omega))^2}$, zero at dc and climbing to $\Delta g_mR_D$.

## Level 4: MOS Loads

```tikz title="The pair with (a) diode-connected PMOS loads and (b) PMOS current-source loads. Gains from the half circuit. After Razavi Fig. 4.37."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\cap/\p in {0/{(a) diode-connected load: $|A_v|\approx g_{mN}/g_{mP}$}/A,6.8/{(b) current-source load: $|A_v|=g_{mN}(r_{oN}\|r_{oP})$}/B} {
  \begin{scope}[xshift=\ox cm]
    \draw (0,0) node[nmos](\p1){};
    \draw (2.6,0) node[nmos,xscale=-1](\p2){};
    \draw (0,2.2) node[pmos](\p3){};
    \draw (2.6,2.2) node[pmos,xscale=-1](\p4){};
    \draw (\p1.D) -- (\p3.D); \draw (\p2.D) -- (\p4.D);
    \draw (\p3.S) -- ++(0,0.3) -| (\p4.S);
    \node[above] at (1.3,3.27) {$V_{DD}$};
    \draw (1.3,3.27) -- (1.3,2.97);
    \draw (\p1.S) |- (1.3,-1.1) -| (\p2.S);
    \draw (1.3,-1.1) node[circ]{} to[I, l=$I_{SS}$] (1.3,-2.6) node[ground]{};
    \node[left] at (\p1.G) {$V_{in1}$};
    \node[right] at (\p2.G) {$V_{in2}$};
    \node[font=\scriptsize] at (0.55,-0.3) {$M_1$};
    \node[font=\scriptsize] at (2.05,-0.3) {$M_2$};
    \node[font=\scriptsize] at (0.55,2.5) {$M_3$};
    \node[font=\scriptsize] at (2.05,2.5) {$M_4$};
    \draw (0,1.1) node[circ]{} node[right]{$X$};
    \draw (2.6,1.1) node[circ]{} node[left]{$Y$};
    \node[font=\small] at (1.3,-3.4) {\cap};
  \end{scope}
  }
  \draw (A3.G) -- ++(-0.35,0) |- (0,1.1);
  \draw (A4.G) -- ++(0.35,0) |- (2.6,1.1);
  \draw (B3.G) -- ++(-0.3,0) node[left]{$V_b$};
  \draw (B4.G) -- ++(0.3,0) node[right]{$V_b$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Diode load: } A_v = -g_{mN}\left(\tfrac{1}{g_{mP}}\|r_{oN}\|r_{oP}\right)\approx -\frac{g_{mN}}{g_{mP}} = -\sqrt{\frac{\mu_n(W/L)_N}{\mu_p(W/L)_P}}}
$$

$$
\boxed{\text{Current-source load: } A_v = -g_{mN}\left(r_{oN}\|r_{oP}\right)}
$$

> [!tip] Remark
> Each half circuit is a CS stage with the matching load from [[Single-Stage]]: a diode-connected load (gain set by a $g_m$ ratio, i.e. by geometry) or a current-source load (gain set by the intrinsic gain, [[MosFETs#Output Resistance and Intrinsic Gain]]).

**Diode loads trade gain against headroom.** At fixed current, more gain needs a smaller $(W/L)_P$, which raises $|V_{GS,P}-V_{TH,P}|$ and pulls the output CM down, squeezing swing and input CM range.

- **Fix: starve the loads.** Add PMOS current sources $M_5$, $M_6$ that carry part of the input devices' current (Razavi Fig. 4.39(a)). If they carry 80%, the diodes carry 1/5 of the current; at the same overdrive their $W/L$, and so their $g_m$, drops 5×, so the gain rises about 5×.
- Diodes still eat at least $V_{TH}$ of headroom, so Razavi prefers resistive loads plus the current sources [Fig. 4.39(b)]: the output can rise to $V_{DD}-|V_{GS3,4}-V_{TH3,4}|$ and $R_D$ can be 5× larger:

$$
\boxed{|A_v| = g_{mN}\left(R_D\|r_{oN}\|r_{oP}\right)}
$$

**Current-source loads give the most gain but no defined output CM.** In Fig. (b) nothing sets the output CM level (the diode load sets it to $V_{DD}-|V_{GS,P}|$), so a high-gain fully differential stage needs common-mode feedback ([[Operational Amplifiers]]). In nanometer processes the gain is still only about 5 to 10.

> [!note]- Detail: self-biased current-source loads (Razavi Ex. 4.12)
> Replace $V_b$ with two large equal resistors $R_1$ from $X$ and $Y$ to the shared PMOS gate node $N$. With no signal, $V_X=V_Y=V_N=V_{DD}-|V_{GS3,4}|$. For differential outputs, $N$ is the midpoint of a symmetric divider, so it is an ac ground, and the half circuit gives $|A_v| = g_{m1}(r_{o1}\|R_1\|r_{o3})$. If $R_1 \gg r_{o1}\|r_{o3}$, the gain barely drops.

### Cascode Pair

$$
\boxed{|A_v| \approx g_{m1}\left[(g_{m3}r_{o3}r_{o1})\,\|\,(g_{m5}r_{o5}r_{o7})\right]}
$$

Cascode both the NMOS input devices ($M_3$ on $M_1$) and the PMOS loads ($M_5$ on $M_7$): the half circuit is the [[Single-Stage#Cascode|cascode stage]]. Gain goes up by roughly another $g_mr_o$, at the cost of two more overdrives of headroom. This is the core of the telescopic op amp ([[Operational Amplifiers]]).

## Level 5: The Active-Load Pair (Five-Transistor OTA)

```tikz title="Left: the five-transistor OTA. M_3 and M_4 form a current mirror, so M_1's signal current is copied to the output instead of being thrown away. Right: the output is single-ended, in phase with V_in1, and swings rail to rail in the large-signal limit. After Razavi Figs. 5.26(b) and 5.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \draw (0,2.2) node[pmos,xscale=-1](M3){};
  \draw (2.6,2.2) node[pmos](M4){};
  \draw (M1.D) -- (M3.D); \draw (M2.D) -- (M4.D);
  \draw (M3.S) -- ++(0,0.3) -| (M4.S);
  \draw (1.3,2.97) -- (1.3,3.27) node[above]{$V_{DD}$};
  \draw (M3.G) -- (M4.G);
  \draw (1.3,2.2) node[circ]{} -- (1.3,1.4) -| (0,1.1);
  \draw (M1.S) |- (1.3,-1.1) -| (M2.S);
  \draw (1.3,-1.85) node[nmos,anchor=D](M5){};
  \draw (1.3,-1.1) node[circ]{} node[above]{$P$} -- (M5.D);
  \draw (M5.S) node[ground]{};
  \node[left] at (M5.G) {$V_b$};
  \node[font=\scriptsize,anchor=west] at (1.55,-2.25) {$M_5$};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \node[font=\scriptsize] at (0.55,-0.3) {$M_1$};
  \node[font=\scriptsize] at (2.05,-0.3) {$M_2$};
  \node[font=\scriptsize] at (-0.55,2.5) {$M_3$};
  \node[font=\scriptsize] at (3.15,2.5) {$M_4$};
  \draw (0,1.1) node[circ]{} node[left]{$F$};
  \draw (2.6,1.1) node[circ]{} -- (3.4,1.1) node[right]{$V_{out}$};
  \begin{scope}[xshift=8.4cm,yshift=-1.4cm]
    \draw[->] (-2.4,0) -- (2.6,0) node[right] {$V_{in1}-V_{in2}$};
    \draw[->] (0,-0.2) -- (0,3.6) node[above] {$V_{out}$};
    \draw[thick] (-2.3,0.05) -- (-0.5,0.05);
    \draw[thick] plot[smooth] coordinates {(-0.5,0.05) (-0.25,0.35) (0,1.5) (0.25,2.65) (0.5,2.95)};
    \draw[thick] (0.5,2.95) -- (2.3,2.95);
    \draw[dashed] (-2.3,3.0) -- (2.3,3.0);
    \node[font=\scriptsize,anchor=south west] at (0.6,3.0) {$V_{DD}$};
    \node[font=\scriptsize,anchor=west] at (0.3,1.5) {high-gain region};
    \node[font=\scriptsize,align=center] at (-1.3,0.5) {$M_2$ hogs $I_{SS}$};
    \node[font=\scriptsize,align=center] at (1.4,2.5) {$M_1$ hogs $I_{SS}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{|A_v| \approx g_{m1}\left(r_{o2}\|r_{o4}\right),\qquad G_m = g_{m1},\qquad R_{out}\approx r_{o2}\|r_{o4}}
$$

Same gain as a CS stage with a current-source load, but with a differential input and a single-ended output. It is the classic first stage of a two-stage op amp (Carusone §3.8). Carusone Ex. 3.11: $I_{bias}=200\ \mu$A, $g_{m1} = 1.64$ mA/V, $r_{ds2}=r_{ds4}=50$ kΩ, gain 41 V/V.

**How the mirror doubles $G_m$.** Raise $V_{in1}$, lower $V_{in2}$: $I_{D1}$ rises, $V_F$ falls, and $M_4$ pushes *more* current into the output while $M_2$ pulls *less*. Both changes raise $V_{out}$. With a passive (fixed-gate) PMOS load, $M_4$ does nothing and $M_1$'s signal current is wasted: $G_m = g_{m1}/2$.

> [!tip] Remark
> The half-circuit trick does **not** apply: the diode at $F$ has low impedance ($\approx 1/g_{m3}$) while $X$ has high impedance, so the two drains swing very differently and $P$ is not a virtual ground. Use $|A_v| = G_mR_{out}$ instead. The mirror itself is in [[Current Mirrors]].

**Large-signal behaviour.**
- At $V_{in1}=V_{in2}$ with perfect symmetry, $V_{out}=V_F=V_{DD}-|V_{GS3}|$.
- A small mismatch (e.g. a slightly lower $V_{TH2}$) moves $V_{out}$ a long way, possibly into triode. So it is rarely used open-loop for small signals. It is used inside feedback loops, or as a differential to single-ended (rail-to-rail) converter for large swings, usually followed by an inverter (Razavi Ex. 5.8).
- **CM range limits swing:** $V_{out}\ge V_{in,CM}-V_{TH}$ for $M_2$ to stay saturated, so the input CM should be as low as possible: $V_{GS1,2}+V_{DS5,min}$. Razavi calls this a critical drawback.
- **Unity-gain buffer** (output tied to $V_{in2}$): $V_{out}\approx V_{in}$ from about $V_{TH}$ up to about $V_{DD}-|V_{GS4}-V_{TH4}|$, where $M_1$/$M_4$ enter triode (Razavi Ex. 5.10).

> [!note]- Derivation: $G_m$ and $R_{out}$, approximate (Razavi §5.3.2)
> **$G_m$.** Short the output. The swing at $F$ is small, so little current returns through $r_{o1}$ and $P$ is close to ac ground. Then $i_{D1} = |i_{D3}| = |i_{D4}| = g_mv_{in}/2$ and $i_{D2} = -g_mv_{in}/2$; the output current is the sum, $g_mv_{in}$.
>
> **$R_{out}$.** Apply $v_X$ at the output. With the tail open for small signals, $M_1$ and $M_2$ act like one resistor $R_{XY} = 2r_{o1,2}$ from $X$ to $F$. The current through it, $v_X/(2r_{o1,2}+\frac{1}{g_{m3}}\|r_{o3})$, is mirrored by $M_3$/$M_4$ back into $X$ with unity gain, which doubles it. So $X$ sees $2r_{o1,2}/2 = r_{o2}$ (from the pair plus mirror) in parallel with $r_{o4}$:
> $$R_{out}\approx r_{o2}\|r_{o4}$$
> Carusone (§3.8, T model) gets the same: the current into $r_{ds2}$ splits equally into $M_1$ and $M_2$, and the mirror copy cancels the $M_2$ half.

> [!note]- Derivation: exact gain (Razavi Eqs. 5.29–5.38)
> Solving the full small-signal circuit with $r_d = \frac{1}{g_{m3}}\|r_{o3}$:
> $$G_m = -g_{m1}r_{o1}\frac{g_{m4}r_d+1}{r_d+2r_{o1}},\qquad |A_v| = g_{m1}(r_{o1}\|r_{o4})\,\frac{2g_{m4}r_{o4}+1}{2(g_{m4}r_{o4}+1)}$$
> The correction factor is below 1: at $g_{m4}r_{o4}=5$ it is 0.92. The tail's finite impedance changes this only slightly.

> [!note]- Detail: passive (current-source) load with one output discarded (Razavi Eqs. 5.20–5.26)
> Take only $V_Y$ from a pair with a fixed-gate PMOS load. $G_m = g_{m1}/2$ (short the output; the pair is then symmetric). $R_{out}$: $M_2$ is degenerated by $M_1$'s source, $\approx 1/g_{m1}$, giving $\approx 2r_{o2}$, in parallel with $r_{o4}$:
> $$|A_v| = \frac{g_{m1}}{2}\left[(2r_{o2})\|r_{o4}\right]$$
> If $r_{o4}\to\infty$ this approaches $g_{m1}r_{o2}$. The active mirror gets $g_m(r_o\|r_o)$ without wasting half the signal current.

### Common-Mode Rejection of the OTA

$$
\boxed{A_{CM} = \frac{v_{out}}{v_{in,CM}} \approx -\frac{1}{1+2g_{m1,2}R_{SS}}\cdot\frac{g_{m1,2}}{g_{m3,4}}}
\qquad
\boxed{\text{CMRR} = (1+2g_{m1,2}R_{SS})\,g_{m3,4}\left(r_{o1,2}\|r_{o3,4}\right)}
$$

- Here CM gain is defined at the **single-ended** output, because that is where the signal is.
- With perfect symmetry $V_{out}=V_F$ for any input CM, so $F$ and $X$ can be shorted: $M_1\|M_2$ ($2g_m$) degenerated by $R_{SS}$, loaded by the diode pair $\frac{1}{2g_{m3,4}}$.
- Unlike the resistively loaded pair, **CM corrupts the output even with no mismatch**. If $R_{SS}\approx r_o$, CMRR is on the order of $(g_mr_o)^2$. Tail capacitance degrades it at high frequency just as [[#Tail Capacitance CMRR Falls with Frequency|above]].

> [!note]- Detail: the flawed "zero CM gain" argument (Razavi Ex. 5.13)
> Claim: a CM step adds $\Delta I$ to both input devices; the mirror copies $\Delta I$ from $M_3$ to $M_4$, which supplies exactly what $M_2$ needs, so $V_{out}$ doesn't move. Flaw: $M_3$ is a diode with finite $r_{o3}$. $\Delta V_F = \Delta I\,(\frac{1}{g_{m3}}\|r_{o3})$, so $|\Delta I_{D4}| = g_{m4}\Delta V_F = \Delta I\,\frac{g_{m4}r_{o3}}{1+g_{m3}r_{o3}}$, slightly less than $\Delta I$. The shortfall has to come from $r_{o4}$, so the output moves.

> [!note]- Detail: buying headroom with a level shift (Razavi Fig. 5.36)
> The diode-connected $M_3$ eats a lot of headroom. The gate of $M_3$/$M_4$ need not sit at $V_F$: insert $R_1$ between $F$ and the gate node $G$ and pull a small current $I_1$ from $G$, so $V_G = V_F - R_1I_1$ (keep $R_1I_1\le V_{TH3}$). The input CM can then be higher. $I_1\ll I_{SS}/2$, or it creates an offset.

## Level 6: The Gilbert Cell

Two facts from above combine: the pair's gain depends on the tail current ($g_mR_D = \sqrt{\mu_nC_{ox}\frac WL I_{SS}}\,R_D$), and a pair steers its tail current between two destinations.

- **VGA:** set the tail current with a control voltage; gain runs from 0 up to a maximum set by headroom and device size.
- **Gain through zero:** two pairs with opposite gains ($-g_mR_D$, $+g_mR_D$) and tails $I_1$, $I_2$ that move in opposite directions. Sum the outputs by **shorting drains** (summing currents): $V_{out} = R_D(I_{D1}+I_{D4})-R_D(I_{D2}+I_{D3})$. $I_1=0$ gives $+g_mR_D$, $I_2=0$ gives $-g_mR_D$, $I_1=I_2$ gives zero.
- **What moves two currents in opposite directions?** A third differential pair. That's the Gilbert cell.

```tikz title="The Gilbert cell: M_5/M_6 steer I_SS between pair M_1/M_2 and the cross-coupled pair M_3/M_4. Large V_cont gives gain of one sign, large -V_cont the other, V_cont = 0 gives zero. After Razavi Fig. 4.42(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.2,0) node[nmos](M2){};
  \draw (4.6,0) node[nmos](M3){};
  \draw (6.8,0) node[nmos](M4){};
  \foreach \m/\v in {M1/+,M2/-,M3/-,M4/+} { \node[left,font=\scriptsize] at (\m.G) {$V_{in}^{\v}$}; }
  \foreach \m/\i/\x in {M1/1/0,M2/2/2.2,M3/3/4.6,M4/4/6.8} { \node[font=\scriptsize,anchor=west] at (\x+0.05,-0.75) {$M_\i$}; }
  \draw (M1.S) |- (1.1,-1.1) -| (M2.S);
  \draw (M3.S) |- (5.7,-1.1) -| (M4.S);
  \draw (1.1,-1.1) node[circ]{} node[above]{$A$} -- (1.1,-1.5) coordinate(a);
  \draw (5.7,-1.1) node[circ]{} node[above]{$B$} -- (5.7,-1.5) coordinate(b);
  \draw (a) node[nmos,anchor=D](M5){};
  \draw (b) node[nmos,anchor=D,xscale=-1](M6){};
  \node[left] at (M5.G) {$V_{cont}^{+}$};
  \node[right] at (M6.G) {$V_{cont}^{-}$};
  \node[font=\scriptsize] at (1.65,-2.25) {$M_5$};
  \node[font=\scriptsize] at (5.15,-2.25) {$M_6$};
  \draw (M5.S) |- (3.4,-3.0) -| (M6.S);
  \draw (3.4,-3.0) node[circ]{} to[I, l=$I_{SS}$] (3.4,-4.3) node[ground]{};
  % output buses: X = M1 + M3 drains, Y = M2 + M4 drains
  \draw (M1.D) -- (0,1.7) -- (4.6,1.7) -- (M3.D);
  \draw (M2.D) -- (2.2,1.1) -- (6.8,1.1) -- (M4.D);
  \draw (0,1.7) node[circ]{} -- (-0.8,1.7) to[R, l=$R_D$] (-0.8,3.4);
  \draw (6.8,1.1) node[circ]{} -- (7.6,1.1) to[R, l_=$R_D$] (7.6,3.4);
  \draw (-0.8,3.4) -- (7.6,3.4);
  \draw (3.4,3.4) -- (3.4,3.7) node[above]{$V_{DD}$};
  \node[left] at (-0.8,1.7) {$X$};
  \node[right] at (7.6,1.1) {$Y$};
  \node[font=\scriptsize,align=left,anchor=west] at (8.0,-1.6) {$V_{out}=V_X-V_Y$\\ $\approx \alpha\,V_{in}\,V_{cont}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = V_{in}\cdot f(V_{cont}) \approx \alpha\,V_{in}\,V_{cont}}
\qquad
\boxed{V_{CM,cont} \le V_{CM,in} - V_{GS1} + V_{TH5,6}}
$$

- **Multiplier/mixer:** keep the first Taylor term of $f$ and the output is proportional to the product. Any voltage-controlled VGA is a multiplier in this sense (Razavi Ex. 4.13).
- **Headroom:** the input pairs are stacked on the control pair, so the control CM must sit about one overdrive below the input CM. Like a cascode, it needs more supply than a single pair.
- **Ports can be swapped:** put the signal on the bottom pair ($M_5$/$M_6$, converting $V_{in}$ to current) and the control on the top quad, which routes that current to one output or the other. Very positive $V_{cont}$ gives $+g_{m5,6}R_DV_{in}$, very negative gives $-g_{m5,6}R_DV_{in}$, zero gives zero. Degenerating the bottom pair makes the V-to-I conversion linear (Razavi Fig. 4.43).

> [!tip] Remark
> Both orientations rely on the same [[#Large-Signal Characteristic|large-signal steering]]: a pair driven well past $\Delta V_{in1}$ is a current switch. That is how a mixer drives the top quad.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $I_{SS}$ | $g_m$ ($\propto\sqrt{I_{SS}}$), linear range ($\Delta V_{in1}$) | Power; at fixed $I_{SS}R_D$ (headroom) the gain falls |
| ↑ $W/L$ of the input pair | $g_m$, headroom ($V_{OV}$↓) | Linear range ($\Delta V_{in1}\propto V_{OV}$), capacitance |
| ↓ input CM level | Output swing (resistive and OTA) | Must stay above $V_{GS1}+V_{OV,tail}$ |
| Source degeneration $R_S$ | Linear range ($+R_SI_{SS}$), gain less sensitive to $g_m$ | Gain; headroom unless the tail is split; split tail adds noise and offset |
| ↑ tail impedance $R_{SS}$ (cascode tail) | CM gain, CMRR ($\propto 1+2g_mR_{SS}$) | Headroom; gone at high frequency because of $C_P$ |
| Matching (layout, larger devices) | CMRR ($\propto g_m/\Delta g_m$), offset | Area, capacitance |
| Diode load | Gain set by a ratio (tracks process), defines output CM | Low gain, eats ≥ $V_{TH}$ headroom |
| Current-source load | Gain $g_m(r_{oN}\|r_{oP})$ | Output CM undefined → needs CMFB |
| Cascoding the pair | Gain × another $g_mr_o$ | Two more overdrives of headroom |
| Active mirror load (5T OTA) | Single-ended output with full $G_m=g_m$; CMRR ~ $(g_mr_o)^2$ | Swing limited by input CM; offset-sensitive open loop; CM corrupts output even when matched |
| Gilbert stacking | Gain variable through zero, multiplication | One more overdrive of headroom |

## Cheat sheet

| Quantity | Equation |
|---|---|
| DM / CM components | $v_{DM}=v_1-v_2$, $v_{CM}=(v_1+v_2)/2$ |
| Tail constraint | $I_{D1}+I_{D2}=I_{SS}$, $V_{out,CM}=V_{DD}-R_DI_{SS}/2$ |
| Input CM range | $V_{GS1}+V_{OV3}\le V_{in,CM}\le\min[V_{DD}-R_DI_{SS}/2+V_{TH},\,V_{DD}]$ |
| Output swing | single-ended $\approx V_{DD}-V_{OV1}-V_{OV3}$; differential $\approx2V_{DD}-4V_{OV}$ |
| Large-signal current | $I_{D1}-I_{D2}=\frac12\mu_nC_{ox}\frac WL\Delta V_{in}\sqrt{\frac{4I_{SS}}{\mu_nC_{ox}W/L}-\Delta V_{in}^2}$ |
| Peak $G_m$ | $\sqrt{\mu_nC_{ox}\frac WL I_{SS}}=g_m$ (each device at $I_{SS}/2$) |
| Turn-off input | $\Delta V_{in1}=\sqrt{2I_{SS}/(\mu_nC_{ox}W/L)}=\sqrt2\,V_{OV,eq}$ |
| Differential gain | $-g_mR_D$; with CLM $-g_m(R_D\|r_o)$ |
| Degenerated pair | $\Delta V_{in2}-\Delta V_{in1}=R_SI_{SS}$; $\lvert A_v\rvert=R_D/(1/g_m+R_S)$ |
| CM gain (symmetric) | $A_{v,CM}=-\frac{R_D/2}{1/(2g_m)+R_{SS}}$ |
| CM→DM, load mismatch | $\Delta V_X-\Delta V_Y=\frac{g_m\Delta R_D}{1+2g_mR_{SS}}\Delta V_{in,CM}$ |
| CM→DM, $g_m$ mismatch | $A_{CM\text{-}DM}=-\frac{\Delta g_mR_D}{(g_{m1}+g_{m2})R_{SS}+1}$ |
| CMRR (resistive load) | $\approx\frac{g_m}{\Delta g_m}(1+2g_mR_{SS})\approx\frac{2g_m^2R_{SS}}{\Delta g_m}$ |
| CM→DM with tail cap | $-\Delta g_mR_D\frac{1+sR_{SS}C_P}{1+2g_mR_{SS}+sR_{SS}C_P}$ |
| Diode load | $A_v\approx-g_{mN}/g_{mP}=-\sqrt{\mu_n(W/L)_N/(\mu_p(W/L)_P)}$ |
| Current-source load | $A_v=-g_{mN}(r_{oN}\|r_{oP})$ |
| Resistor + aux sources | $\lvert A_v\rvert=g_{mN}(R_D\|r_{oN}\|r_{oP})$ |
| Cascode pair | $\lvert A_v\rvert\approx g_{m1}[(g_{m3}r_{o3}r_{o1})\|(g_{m5}r_{o5}r_{o7})]$ |
| 5T OTA gain | $\lvert A_v\rvert\approx g_{m1}(r_{o2}\|r_{o4})$; $G_m=g_{m1}$, $R_{out}\approx r_{o2}\|r_{o4}$ |
| 5T OTA CM gain | $A_{CM}\approx-\frac{1}{1+2g_{m1,2}R_{SS}}\frac{g_{m1,2}}{g_{m3,4}}$ |
| 5T OTA CMRR | $(1+2g_{m1,2}R_{SS})\,g_{m3,4}(r_{o1,2}\|r_{o3,4})$ |
| Gilbert cell | $V_{out}\approx\alpha V_{in}V_{cont}$; $V_{CM,cont}\le V_{CM,in}-V_{GS1}+V_{TH5,6}$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 4 Differential Amplifiers, §4.1–4.5, pp. 100–128: single-ended vs differential, basic pair (qualitative, large-signal, small-signal Methods I and II, half-circuit lemma), degenerated pair and split tail, CM response (finite $R_{SS}$, resistor and $g_m$ mismatch, tail capacitance, CMRR, body-effect mismatch), diode/current-source/cascode loads with auxiliary sources and self-biasing, Gilbert cell. Examples 4.1–4.13; nanometer margin notes pp. 106, 109, 119.
  - Ch. 5 §5.3 Active Current Mirrors, pp. 146–158: passive-load pair, five-transistor OTA large-signal behaviour, approximate and exact small-signal analysis, level-shift headroom fix, CM properties and CMRR. Examples 5.8–5.13.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §3.8 MOS Differential Pair and Gain Stage, pp. 135–138 (T-model analysis, $r_{out}=r_{ds2}\|r_{ds4}$ derivation, Example 3.11).
- **Zettelkasten extensions** (`AnalogTheory/Differential Amplifiers/`, structure note `S3 Differential Amplifiers`): 3g3 (CM-to-DM conversion with tail impedance $R_{SS}\|1/(sC_P)$: zero, pole, and plateau); the remaining atomic notes (3a–3j1c) follow Razavi Ch. 4 and were used as a cross-check.
