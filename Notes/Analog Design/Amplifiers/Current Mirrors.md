---
title: Current Mirrors
description: Copying a reference current by device ratio, from the two-transistor mirror through cascode, low-voltage and feedback-regulated mirrors to the active mirror load, with the headroom and mismatch each one costs.
kind: topic
status: growing
aliases:
  - Current Mirrors
  - Current Mirror
---

Every amplifier note so far wrote "assume a current source". This note builds it. It starts with a black-box copier and adds one effect per level: channel-length modulation, then headroom, then feedback, then signal processing, then mismatch. Where the reference current itself comes from is [[Biasing]] and [[Bandgap References]].

## The big picture

```tikz title="The mirror on one screen. A diode-connected M_1 turns I_REF into a V_GS; M_2 turns that V_GS back into a current scaled by the size ratio. Right: the output current versus output voltage. The simple mirror is exact only at V_out = V_GS and has slope 1/r_o2; a cascode is flat but needs more voltage; a low-voltage cascode is flat from 2V_OV. After Razavi Figs. 5.5(b), 5.14, 5.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (2.4,0) node[nmos](M2){};
  \draw (M1.G) -- (M2.G);
  \draw (M1.D) -- ++(0,0.4) coordinate(X);
  \draw (X) -| (1.2,0) node[circ]{};
  \draw (X) node[circ]{} to[I, l_=$I_{REF}$] ++(0,2) node[above] {$V_{DD}$};
  \draw (M1.S) node[ground]{};
  \draw (M2.S) node[ground]{};
  \draw (M2.D) -- ++(0,1.0) node[ocirc]{} node[right] {$V_{out}$};
  \draw[->] ([xshift=0.35cm,yshift=0.8cm]M2.D) -- ++(0,-0.6);
  \node[right,font=\scriptsize] at ([xshift=0.35cm,yshift=0.5cm]M2.D) {$I_{out}$};
  \node[font=\scriptsize] at (-0.9,0) {$M_1$};
  \node[font=\scriptsize] at (3.3,0) {$M_2$};
  \node[left,font=\scriptsize] at (X) {$X$};
  \node[font=\scriptsize] at (1.2,-2.0) {$I_{out}=\dfrac{(W/L)_2}{(W/L)_1}I_{REF}$};
  \begin{scope}[xshift=5.4cm,yshift=-1.5cm]
    \draw[->] (0,0) -- (8,0) node[right] {$V_{out}$};
    \draw[->] (0,0) -- (0,4.2) node[above] {$I_{out}$};
    \draw[dashed] (0,2.6) -- (7.5,2.6);
    \node[left,font=\scriptsize] at (0,2.6) {$I_{REF}$};
    \draw[thick,domain=0:1,samples=20] plot (\x,{2.24*(2*\x-\x*\x)});
    \draw[thick] (1,2.24) -- (7.5,3.54) node[right,font=\scriptsize] {simple};
    \draw[thick,blue,domain=0:2,samples=20] plot (\x,{2.3*(\x-\x*\x/4)});
    \draw[thick,blue] (2,2.3) -- (3.8,2.6) -- (7.5,2.64) node[right,font=\scriptsize] {cascode};
    \draw[thick,red!70!black,dashed,domain=0:2,samples=20] plot (\x,{2.6*(\x-\x*\x/4)});
    \draw[thick,red!70!black,dashed] (2,2.6) -- (3.8,2.6);
    \foreach \x/\l/\d in {1/{V_{OV}}/0, 2/{2V_{OV}}/0.35, 2.8/{V_{GS}}/0, 3.8/{2V_{OV}{+}V_{TH}}/0.35} {
      \draw[dotted] (\x,0) -- (\x,2.6);
      \node[below,font=\scriptsize] at (\x,-\d) {$\l$};
    }
    \node[font=\scriptsize,anchor=west] at (4.2,3.45) {slope $1/r_{o2}$};
    \node[font=\scriptsize,red!70!black,anchor=west] at (4.2,1.6) {dashed: low-voltage cascode,};
    \node[font=\scriptsize,red!70!black,anchor=west] at (4.2,1.2) {flat from $2V_{OV}$};
    \node[font=\scriptsize,anchor=west] at (4.2,0.6) {simple mirror exact at $V_{out}=V_{GS}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Copy by ratio:** $I_{out} = \frac{(W/L)_2}{(W/L)_1}I_{REF}$. Process and temperature cancel; only geometry is left. The reference must *cause* the gate voltage (a diode-connected device).
> 2. **Simple mirror:** $r_{in}\approx 1/g_{m1}$, $r_{out} = r_{o2}$. The error is channel-length modulation: $\frac{I_{out}}{I_{REF}} = \frac{(W/L)_2}{(W/L)_1}\cdot\frac{1+\lambda V_{DS2}}{1+\lambda V_{DS1}}$.
> 3. **Cascode mirror:** $R_{out}\approx g_{m3}r_{o3}r_{o2}$, but the stacked-diode bias costs $V_{out,min} = 2V_{OV}+V_{TH}$.
> 4. **Low-voltage / wide-swing cascode** gets the same $R_{out}$ with $V_{out,min} = 2V_{OV}$: bias the bottom devices at the edge of saturation. A feedback amplifier on the cascode gate multiplies $R_{out}$ by $(1+A)$.
> 5. **Active mirror load:** a mirror on a differential pair gives a single-ended output with the *full* $G_m = g_{m1}$ and $|A_v|\approx g_{m1}(r_{o2}\|r_{o4})$. Derived in [[Differential Amplifiers#Level 5 The Active-Load Pair (Five-Transistor OTA)|Differential Amplifiers]].

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 Why Copy a Current|why copy]] → [[#Level 1 The Basic Mirror|basic mirror, ratios, $r_{in}$, $r_{out}$]] → [[#Level 2 Channel-Length Modulation and the Cascode|CLM error, degeneration, cascode]] → [[#Level 3 Low-Voltage Cascodes|low-voltage and wide-swing cascodes]] → [[#Level 4 Feedback Raises Output Impedance|regulated and gain-boosted mirrors]] → [[#Level 5 Active Current Mirrors|active mirrors]] → [[#Level 6 Mismatch|mismatch]].

## Spec translation

A plain mirror has no amplifier: its specs land straight on the mirror devices' $g_m/I_D$, $L$ and area. The feedback mirrors of [[#Level 4 Feedback Raises Output Impedance]] add one (the regulated-gate device $M_3$, or the booster $A$), and that amplifier carries amplifier specs.

**The block's own specs:**

| Spec | Definition | Numbers from the sources |
|---|---|---|
| Copy accuracy, systematic | $I_{out}/I_{REF}$ error from unequal $V_{DS}$ | $\frac{1+\lambda V_{DS2}}{1+\lambda V_{DS1}}$; zero with a cascode or low-voltage cascode |
| Copy accuracy, random | $\sigma(\Delta I)/I$ | $(g_m/I_D)\,A_{VT}/\sqrt{WL}$ |
| Output impedance | $r_{out}$ at the output node | Simple 25 kΩ, degenerated 73 kΩ (Carusone Ex. 3.6); cascode 753 kΩ (Ex. 3.7); boosted $\times(1+A)$ |
| Compliance (headroom) | Lowest $V_{out}$ with $r_{out}$ still high | $V_{D,sat}$; cascode $2V_{OV}+V_{TH}$ (0.98 V in Ex. 3.7); low-voltage cascode $2V_{OV}$ |
| Bandwidth | Pole of the mirror node | $\omega_{p}\approx g_{m3}/C_E$ (active load), zero at $2\omega_p$ |
| Large-signal settling | Recovery after a big output step | Gain boosting: about **50% longer** for up to **30 dB** more gain (Carusone §6.3.3) |
| Output noise | Noise current at the output | Reference device noise $\times N$; filtering it with $C_B$ alone needs **nF** (≈5 nF for 10× at 1 MHz, $N=5$; [[Noise#Current Mirrors]]) |

**What sets each one:**

| Mirror spec | Inside the block | Amplifier spec that sets it ([[Single-Stage#Amplifier Specifications]]) |
|---|---|---|
| Output impedance (boosted) | Booster $A$ | **DC gain** $A$: $R_{out}\approx g_{m1}r_{o1}r_{o2}(1+A)$ |
| Copy accuracy (boosted) | Booster holds $V_{DS2}$ at $V_{bias}$ | **Offset** (shifts $V_{DS2}$), **DC gain** (residual error) |
| Compliance (boosted) | Booster senses $V_{DS2}\approx V_{eff}$ and drives the cascode gate | **Input CM range** down to $\approx V_{eff}$ (PMOS-input or level-shifted booster); **output swing** up to $V_{DS2}+V_{GS1}$ |
| Small-signal settling (boosted) | Booster's pole-zero doublet | **GBW**: booster $\omega_u$ above the main op amp's $\omega_u$ |
| Stability of the local loop | Booster around the cascode | **Phase margin** (local compensation caps may be needed) |
| Large-signal settling (boosted) | Booster output slews away and must return | **Slew rate** of the booster |
| Output noise (boosted) | Booster noise moves $V_{DS2}$ | **Input-referred noise** of the booster, divided by $r_{o2}$ |
| Regulated gate (no cascode) | CS device $M_3$ | $g_{m3}$ such that $g_{m3}g_{m1}/g_{m2}\approx 1/r_{o1}$; compliance $V_{TH3}$ |

$$
\boxed{A\ge\frac{R_{out,target}}{g_{m1}r_{o1}r_{o2}}-1,\qquad \omega_{u,booster}>\omega_{u,main},\qquad \frac{\Delta I}{I}\approx\lambda\left(V_{OS}+\frac{\Delta V_{o,A}}{A}\right)}
$$

$$
\boxed{\frac{\sigma(\Delta I)}{I} = \frac{g_m}{I_D}\frac{A_{VT}}{\sqrt{WL}}\qquad V_{out,min}\approx n_{stack}\cdot\frac{2}{g_m/I_D}\ \text{(low-voltage cascode: } n_{stack}=2)}
$$

> [!note]- Derivation: the booster's specs (Carusone §6.3.2–6.3.3, Ex. 6.8; Razavi §9.4)
> - **Gain:** the cascode's $R_{out}$ is multiplied by $1+A$ ([[#Enhanced Output Impedance (Gain Boosting)]]); invert for $A$.
> - **Offset and gain error:** the booster holds $V_{DS2} = V_{bias}+V_{OS}+\Delta V_{o,A}/A$, where $\Delta V_{o,A}$ is how far its output must move. Any departure from the reference side's $V_{DS1}$ is a channel-length-modulation copy error, $\Delta I/I\approx\lambda\,\Delta V_{DS}$. (Small-signal reasoning on the circuit of Carusone Fig. 6.13.)
> - **Bandwidth:** near its unity-gain frequency the booster adds a zero at $A_0/\tau'_1$ and a pole at almost the same place; Carusone: "if the unity-gain frequency of the enhancement loop is greater than the unity-gain frequency of the opamp", the doublet does little harm. A doublet inside the main loop's bandwidth leaves a slow settling tail ([[Operational Amplifiers#Level 3 Gain Boosting]]).
> - **Noise:** booster input noise $v_n$ moves $V_{DS2}$ by $v_n$, so it reaches the output as $v_n/r_{o2}$, small for the same reason a cascode device contributes little.

**Where the specs land in sizing:**

| Spec | Knob |
|---|---|
| Random copy accuracy | **Low** $g_m/I_D$ and area $WL$ |
| Systematic copy accuracy | $L$ ($\lambda\propto1/L$), or a cascode |
| $R_{out}$ | $g_mr_o$ of each stacked device: $L$; booster gain: booster $L$ |
| Compliance | **High** $g_m/I_D$: $V_{D,sat}\approx 2/(g_m/I_D)$. Fights matching. |
| Mirror bandwidth | $f_T$ of the mirror devices: short $L$, low $g_m/I_D$ |
| Output noise current | Low $g_m/I_D$ ($\overline{i_n^2} = 4kT\gamma\,(g_m/I_D)\,I_D$) |
| Booster GBW, slew | Booster $I_D$ |

> [!tip] Remark
> Matching, noise and bandwidth all ask for low $g_m/I_D$; only compliance asks for high. The headroom you can spare sets the $g_m/I_D$, and the rest of [[gm-ID Design Methodology]] follows.

> [!example] Worked example: matching vs headroom
> With the 65 nm $A_{VT} = 3.5$ mV·µm (Jespers & Murmann Ex. 4.7) and a 1% $\sigma$ copy target:
> - at $g_m/I_D = 10$ S/A ($V_{D,sat}\approx 200$ mV): $\sqrt{WL} = 10\ \text{V}^{-1}\cdot3.5\ \text{mV}\cdot\mu\text{m}/0.01 = 3.5\ \mu\text{m}$, so $WL\approx 12\ \mu\text{m}^2$;
> - at 5 S/A ($V_{D,sat}\approx 400$ mV): $WL\approx 3\ \mu\text{m}^2$, four times less area for 200 mV more headroom per device.
> A low-voltage cascode at 10 S/A then needs $V_{out}\ge 2\times0.2 = 0.4$ V; Carusone's stacked-diode cascode in Ex. 3.7 (0.35 µm) needs 0.98 V.
> (Arithmetic on the sources' numbers.)

## Level 0: Why Copy a Current

### Setting a Current with a Voltage Fails

$$
\boxed{I_{out}\approx\tfrac12\mu_nC_{ox}\frac WL\left(\frac{R_2}{R_1+R_2}V_{DD}-V_{TH}\right)^2}
$$

Bias a MOSFET gate from a resistive divider and $I_{out}$ depends on $V_{DD}$, on $V_{TH}$ (which moves 50 to 100 mV wafer to wafer) and on $\mu_n$ and $V_{TH}$ over temperature. At a 200 mV overdrive, a 50 mV $V_{TH}$ error gives a **44%** current error (Razavi §5.1).

> [!tip] Remark
> This is the square law from [[MosFETs#Regions of Operation]] read the wrong way round: a precise $V_{GS}$ does **not** give a precise $I_D$, because $V_{TH}$ and $\mu_nC_{ox}$ are not precise. The smaller the overdrive, the worse it gets.

### The Ideal Mirror

```tikz title="One precise reference current, cloned many times. An ideal mirror is a two-port: zero input resistance (it senses a current), infinite output resistance (it delivers one), and a gain 1:K. After Razavi Fig. 5.3 and Carusone Figs. 3.1, 6.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (2.2,1.6);
  \node[align=center,font=\scriptsize] at (1.1,0.8) {reference\\ generator\\ (bandgap)};
  \draw[->] (2.2,0.8) -- (3.4,0.8) node[midway,above,font=\scriptsize] {$I_{REF}$};
  \draw (3.4,0) rectangle (5.4,1.6);
  \node[align=center,font=\scriptsize] at (4.4,0.8) {mirror\\ $1:K$};
  \node[font=\scriptsize,align=left,anchor=west] at (3.3,-0.55) {$r_{in}\to 0$,\ \ $r_{out}\to\infty$};
  \foreach \y/\l in {1.4/{$K_1I_{REF}$},0.8/{$K_2I_{REF}$},0.2/{$K_3I_{REF}$}} {
    \draw[->] (5.4,\y) -- (6.6,\y) node[right,font=\scriptsize] {\l};
  }
  \node[font=\scriptsize,anchor=west] at (8.3,0.8) {to tails, loads, DAC cells};
\end{circuitikz}
\end{document}
```

- One accurate (often trimmed) reference, made once ([[Bandgap References]]); every other current on the chip is a scaled copy.
- **Low input resistance** so the copier doesn't disturb the reference; **high output resistance** so the copy doesn't depend on the load's voltage.
- Carusone's mirror symbol: an arrow on the input (low-impedance, $\approx 1/g_m$) side, and a ratio $1:K$. It stands for *any* mirror in this note.

## Level 1: The Basic Mirror

### Copying Through an Inverse Function

$$
\boxed{I_{out} = \frac{(W/L)_2}{(W/L)_1}\,I_{REF}}\qquad(\lambda = 0,\ \text{both saturated})
$$

$M_1$, diode-connected, computes $V_{GS} = f^{-1}(I_{REF})$. $M_2$ sees the same $V_{GS}$ and computes $f(f^{-1}(I_{REF}))$. Everything process- and temperature-dependent ($\mu_nC_{ox}$, $V_{TH}$) appears in both and cancels; the ratio of drawn sizes is left.

> [!tip] Remark
> A diode-connected MOSFET ($V_{DS}=V_{GS}$) is always saturated, since $V_{DS} > V_{GS}-V_{TH}$. That is why it can be fed any current and still produce the matching $V_{GS}$.

> [!note]- Detail: cause and effect, and a circuit that doesn't copy (Razavi Fig. 5.6)
> $V_{GS} = f^{-1}(I_{REF})$ says $I_{REF}$ is the cause and $V_{GS}$ the effect. Only a device carrying $I_{REF}$ with its gate tied to its drain can do that. If both gates are instead tied to some unrelated $V_b$ (with $I_{REF}$ forced into $M_1$'s drain), $V_b$ was not caused by $I_{REF}$ and $I_{out}$ does not track it: $M_1$ just goes into triode or the node rails.

- **Chains multiply:** NMOS mirror ratio $\alpha$ feeding a PMOS mirror ratio $\beta$ gives $\alpha\beta I_{REF}$ (Razavi Ex. 5.1; $\alpha=\beta=5$ gives 25×). But each copy adds its own mismatch, so **avoid long chains**.
- A typical use: one NMOS reference biases a pair's tail ($5\times$) and a PMOS mirror supplies $0.4I_T$ to each side to raise gain (Razavi Fig. 5.8; the load-starving trick from [[Differential Amplifiers#Level 4 MOS Loads]]).

### Sizing: Same L, Unit Devices

```tikz title="Ratios from identical unit transistors (width W_0, length L). Two units in parallel give 2I_REF; two in series give I_REF/2. After Razavi Figs. 5.9(c), 5.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\by{-1.6}
  \draw (0,0) node[nmos,xscale=-1](R){};
  \draw (R.D) -- ++(0,0.4) coordinate(X);
  \draw (X) node[circ]{} to[I, l_=$I_{REF}$] ++(0,1.8) node[above] {$V_{DD}$};
  \draw (X) -| (1.0,0) -- (R.G);
  \draw (1.0,0) node[circ]{} -- (1.0,\by);
  \draw (R.S) node[ground]{};
  \node[font=\scriptsize] at (-0.95,0) {$W_0$};
  \draw (2.5,0) node[nmos](A1){};
  \draw (4.0,0) node[nmos](A2){};
  \draw (A1.S) node[ground]{};
  \draw (A2.S) node[ground]{};
  \draw (A1.D) -- ++(0,0.4) -| (A2.D);
  \draw ($(A1.D)!0.5!(A2.D)+(0,0.4)$) -- ++(0,0.8) node[ocirc]{} node[above] {$2I_{REF}$};
  \draw (A1.G) -- (A1.G |- 0,\by);
  \draw (A2.G) -- (A2.G |- 0,\by);
  \draw (6.3,0) node[nmos](B1){};
  \draw (B1.S) node[ground]{};
  \draw (6.3,1.55) node[nmos](B2){};
  \draw (B2.S) -- (B1.D);
  \draw (B1.G) -- (B1.G |- 0,\by);
  \draw (B2.G) -- ++(-0.45,0) coordinate(t) -- (t |- 0,\by);
  \draw (B2.D) -- ++(0,0.5) node[ocirc]{} node[above] {$I_{REF}/2$};
  \draw (1.0,\by) -- (B1.G |- 0,\by);
  \foreach \p in {A1,A2,B1} \node[circ] at (\p.G |- 0,\by) {};
  \node[circ] at (t |- 0,\by) {};
  \node[font=\scriptsize] at (3.25,-1.95) {two units in parallel};
  \node[font=\scriptsize] at (6.2,-1.95) {two units in series};
  \node[font=\scriptsize,align=left,anchor=west] at (6.9,0.4) {bottom unit in triode:\\ not a cascode, just\\ one device of length $2L$};
  \node[font=\scriptsize] at (3.5,-2.45) {every device is the same unit: width $W_0$, length $L$};
\end{circuitikz}
\end{document}
```

- **Keep $L$ equal** in every device of a mirror and scale only $W$: $L_{eff}=L_{drawn}-2L_D$ doesn't double when $L_{drawn}$ does, and short-channel $V_{TH}$ depends on $L$ ([[MosFETs#Threshold-Voltage Variation]]).
- **Don't scale $W$ either; repeat a unit.** Gate corners are poorly defined, so a drawn $2W$ isn't exactly $2\times$. $n$ identical fingers are.
- **Fractions:** make the *reference* out of several units, or put units in series. Two series units act as one device of length $2(L_{drawn}-2L_D)$, so the current halves exactly.

> [!note]- Why: the series stack is not a cascode
> The two gates are tied to the same voltage. The top device needs $V_{GS}>V_{TH}$ with its source at the bottom device's drain, so the bottom device has $V_{GS} - V_{DS} > V_{TH}$, i.e. $V_{DS} < V_{GS}-V_{TH}$: it is in triode. The pair behaves like one long transistor, not a cascode with high $R_{out}$.

### Small-Signal Model

$$
\boxed{r_{in} = \frac{1}{g_{m1}}\Big\|\,r_{o1}\approx\frac1{g_{m1}},\qquad r_{out} = r_{o2}}
$$

```tikz title="Small-signal mirror. The diode is a resistor 1/g_m1. No signal current flows into the gate, so with the input current source open v_gs2 = 0 and only r_o2 remains at the output. After Carusone Figs. 3.2, 3.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2.4) node[ocirc]{} node[above] {$i_{in}$} -- (0,2) to[R, l_=$\frac{1}{g_{m1}}$] (0,0) node[ground]{};
  \draw (0,2) -- (2,2) node[circ]{};
  \node[above,font=\scriptsize] at (2,2) {$v_{gs2}$};
  \draw (3.4,2) to[cI, l=$g_{m2}v_{gs2}$] (3.4,0) node[ground]{};
  \draw (6.0,2) to[R, l=$r_{o2}$] (6.0,0) node[ground]{};
  \draw (3.4,2) -- (7.2,2) node[ocirc]{} node[right] {$i_{out}$};
  \draw[dashed] (2,2) -- (2.7,2);
  \node[font=\scriptsize,align=center] at (1.5,1.0) {gate draws\\ no current};
\end{circuitikz}
\end{document}
```

- Carusone Ex. 3.1 (0.35 µm, $W/L=10/0.4$, 100 µA): $r_{out}=25$ kΩ, $g_{m1}=0.97$ mA/V, so $r_{in}\approx1.03$ kΩ. A 100 mV output step moves $I_{out}$ by $100\text{ mV}/25\text{ k}\Omega=4$ µA (4%).
- **Mirrors amplify signals too.** A change $\Delta I$ in $I_{REF}$ appears as $\Delta I\,(W/L)_2/(W/L)_1$ at the output. Razavi Ex. 5.2: a CS stage $M_1$ feeding a PMOS mirror of ratio $(W/L)_3/(W/L)_2$ into $R_L$ has gain $g_{m1}R_L(W/L)_3/(W/L)_2$. Current gain costs proportional bias current.

> [!tip] Remark
> $1/g_m$ at the diode is the same impedance as looking into the source of a common-gate stage ([[Single-Stage]]); $r_{o2}$ at the output is the CS stage's output resistance. A mirror is a diode driving a CS device.

## Level 2: Channel-Length Modulation and the Cascode

### The Error Term

$$
\boxed{\frac{I_{out}}{I_{REF}} = \frac{(W/L)_2}{(W/L)_1}\cdot\frac{1+\lambda V_{DS2}}{1+\lambda V_{DS1}}}
$$

$V_{DS1}=V_{GS}$ always (diode), but $V_{DS2}$ is set by whatever the mirror drives. The copy is exact only at $V_{DS2}=V_{GS}$.

> [!tip] Remark
> This is the $(1+\lambda V_{DS})$ factor from [[MosFETs#Channel-Length Modulation]]. The problem is worst with short devices, which are used precisely to keep $W$ and the output capacitance small.

Two cures, and every mirror below is one of them:
1. **Force $V_{DS2}=V_{DS1}$** (shield $M_2$ with a cascode biased to copy $V_{DS1}$). Accurate, costs a $V_{TH}$ of headroom.
2. **Force $V_{DS1}=V_{DS2}$** (pull the reference drain down to where $M_2$ sits). Accurate at minimum headroom, needs more bias circuitry.

### Source Degeneration

$$
\boxed{r_{out} = r_{ds2}\left[1+R_s(g_{m2}+g_{s2}+g_{ds2})\right]\approx r_{ds2}(1+g_{m2}R_s)}
$$

Put an equal $R_s$ under both mirror devices (Carusone Fig. 3.12). Any current change through $M_2$ develops a voltage on $R_s$ that pushes back on $v_{gs2}$. $g_{s2}$ is the body-effect transconductance, about $g_m/5$.

- Carusone Ex. 3.6 (0.18 µm, $10/0.2$, 100 µA, $R_s=1$ kΩ, $g_s=0.15g_m$): $r_{out}=73$ kΩ, about $3\times$ the 25 kΩ of the plain mirror, for 0.1 V of drop on $R_s$.
- The same formula gives the cascode next: replace $R_s$ by the $r_{o}$ of the device underneath.

> [!note]- Derivation: degenerated output resistance (Carusone Eqs. 3.27–3.31)
> The gate is at small-signal ground (no current through $1/g_{m1}$). Apply $v_x$, draw $i_x$. Then $v_s = i_xR_s$, $v_{gs}=-v_s$, and KCL at the drain:
> $$i_x = g_{m2}v_{gs}+\frac{v_x-v_s}{r_{ds2}} = -i_xg_{m2}R_s + \frac{v_x-i_xR_s}{r_{ds2}}\ \Rightarrow\ \frac{v_x}{i_x} = r_{ds2}\left[1+R_s(g_{m2}+g_{ds2})\right]$$
> Body effect: the source moves but the gate doesn't, so add $g_{s2}$ to $g_{m2}$.

### Cascode Mirror

```tikz title="Cascode current mirror. M_0 is a diode stacked on M_1, so V_N = V_GS0 + V_GS1. With V_GS0 = V_GS3, the cascode copies V_X onto Y, so M_1 and M_2 see equal V_DS. After Razavi Fig. 5.12(c) and Carusone Fig. 3.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (0,1.8) node[nmos,xscale=-1](M0){};
  \draw (2.6,0) node[nmos](M2){};
  \draw (2.6,1.8) node[nmos](M3){};
  \draw (M1.S) node[ground]{};
  \draw (M2.S) node[ground]{};
  \draw (M0.S) -- (M1.D);
  \draw (M3.S) -- (M2.D);
  \draw (M1.G) -- (M2.G);
  \draw (M0.G) -- (M3.G);
  \draw (M0.D) -- ++(0,0.4) coordinate(N);
  \draw (N) node[circ]{} to[I, l_=$I_{REF}$] ++(0,1.7) node[above] {$V_{DD}$};
  \draw (N) -| (1.3,1.8) node[circ]{};
  \draw (0,0.9) node[circ]{} -| (1.15,0) node[circ]{};
  \draw (M3.D) -- ++(0,1.1) node[ocirc]{} node[right] {$P$ (to load)};
  \draw[->] ([xshift=0.35cm,yshift=0.9cm]M3.D) -- ++(0,-0.6) node[right,midway,font=\scriptsize] {$I_{out}$};
  \node[left,font=\scriptsize] at (N) {$N$};
  \node[left,font=\scriptsize] at (0,0.9) {$X$};
  \node[right,font=\scriptsize] at (2.6,0.9) {$Y$};
  \node[font=\scriptsize] at (-0.9,0) {$M_1$};
  \node[font=\scriptsize] at (-0.9,1.8) {$M_0$};
  \node[font=\scriptsize] at (3.5,0) {$M_2$};
  \node[font=\scriptsize] at (3.5,1.8) {$M_3$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.4,1.6) {$V_N=V_{GS0}+V_{GS1}$\\[2pt] $V_{GS0}=V_{GS3}\Rightarrow V_Y=V_X$\\[2pt] $V_{P,min}=2V_{OV}+V_{TH}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{out}\approx g_{m3}r_{o3}r_{o2}}\qquad\boxed{V_{P,min} = V_{GS0}+V_{GS1}-V_{TH} = 2V_{OV}+V_{TH}}
$$

- **Accuracy:** $V_Y = V_N - V_{GS3} = V_{GS1} = V_X$, so $M_1$ and $M_2$ match exactly, even with body effect (the $M_0$/$M_3$ match carries it).
- **Sizing:** $L_2=L_1$ and $W_2/W_1$ set the ratio; $L_3=L_0$ and $W_3/W_0 = W_2/W_1$ so $V_{GS3}=V_{GS0}$. Often $L_0, L_3$ are minimum while $L_1, L_2$ are longer (less CLM, mismatch, flicker noise).
- Carusone Ex. 3.7 (0.35 µm, $10/0.4$, 100 µA, $g_s=0.2g_m$): $R_{out}=753$ kΩ, $30\times$ the simple mirror, but $V_{out,min}=2V_{eff}+V_{tn}=0.98$ V: 0.76 V of swing lost.

> [!tip] Remark
> $R_{out}$ is the [[#Source Degeneration|degeneration formula]] with $R_s = r_{o2}$: $r_{o3}(1+g_{m3}r_{o2})$. The cascode multiplies the bottom device's $r_o$ by the intrinsic gain $g_mr_o$ of the top one ([[MosFETs#Output Resistance and Intrinsic Gain]], [[Single-Stage#Cascode]]).

> [!note]- Detail: the largest reference current a cascode mirror allows (Razavi Ex. 5.3)
> If the $I_{REF}$ source needs 0.5 V across it, then $V_N = V_{GS0}+V_{GS1}\le V_{DD}-0.5$ V. With $V_{GS} = \sqrt{2I_{REF}/(\mu_nC_{ox}W/L)}+V_{TH}$:
> $$I_{REF,max} = \frac{\mu_nC_{ox}}{2}\,\frac{(V_{DD}-0.5\text{ V}-V_{TH0}-V_{TH1})^2}{\left(\sqrt{(L/W)_0}+\sqrt{(L/W)_1}\right)^2}$$
> And $V_X = V_Y = \sqrt{2I_{REF}/(\mu_nC_{ox}(W/L)_1)}+V_{TH1}$: both nodes start at $V_{TH1}$ and rise as $\sqrt{I_{REF}}$.

### Compliance: How a Cascode Source Fails

```tikz title="Output current of a cascode current source as V_P falls. The cascode M_3 leaves saturation first, at V_N - V_TH3; the current only sags but R_out collapses. Then M_2 enters triode and the current drops quickly. After Razavi Ex. 5.4, Fig. 5.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.4,0) node[right] {$V_P$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$I_{out}$};
  \draw[dashed] (0,2.8) -- (7,2.8);
  \node[left,font=\scriptsize] at (0,2.8) {$I_{REF}$};
  \draw[thick,domain=0:1.8,samples=30] plot (\x,{2.4*(2*\x/1.8-(\x/1.8)^2)});
  \draw[thick] (1.8,2.4) .. controls (2.6,2.62) and (3.3,2.76) .. (4.4,2.8) -- (7,2.82);
  \draw[dotted] (1.8,0) -- (1.8,2.4);
  \draw[dotted] (4.4,0) -- (4.4,2.8);
  \node[below,font=\scriptsize,align=center] at (1.8,0) {$M_2$ enters triode\\ (current drops fast)};
  \node[below,font=\scriptsize,align=center] at (4.4,0) {$V_N-V_{TH3}$\\ $M_3$ enters triode};
  \node[font=\scriptsize,anchor=west] at (4.3,3.15) {both saturated: $R_{out}\approx g_{m3}r_{o3}r_{o2}$};
  \node[font=\scriptsize,align=center] at (3.1,1.6) {$M_3$ triode:\\ current sags slightly,\\ $R_{out}$ collapses};
  \node[font=\scriptsize,align=center] at (0.85,0.75) {both\\ triode};
\end{circuitikz}
\end{document}
```

- **$M_3$ enters triode first**, at $V_P = V_N-V_{TH3}$. (If $M_2$ went first, $I_{D2}$ would drop while $V_{GS3}$ rose, which a saturated $M_3$ can't do.)
- Below that point $M_3$ needs more $V_{GS}$, so $V_Y$ falls, $I_{out}$ sags slightly, and $g_{m3}$ (hence $R_{out}$) collapses. Then $M_2$ goes into triode and $I_{out}$ falls fast, to zero at $V_P=0$.
- **The compliance voltage is the spec you check in simulation**: the lowest $V_P$ at which $R_{out}$ is still high, not where the current visibly drops.

## Level 3: Low-Voltage Cascodes

### The Threshold Penalty

$$
\boxed{\text{minimum possible: } V_{P,min}=2V_{OV}\ \text{ when } V_b = V_{GS3}+V_{OV2}}
$$

The stacked-diode bias puts $V_{DS2} = V_{GS1}$, a full $V_{TH}$ more than $M_2$ needs. A lower $V_b$ fixes the headroom but then $V_{DS2}\ne V_{DS1}$ and the copy is wrong again (Razavi Fig. 5.14). Accuracy needs $V_{DS1}$ brought **down** to one overdrive too: cure 2 from [[#The Error Term]].

### A Resistor in the Reference Drain

```tikz title="R_1 drops about V_TH between M_1's gate and drain, so V_DS1 is about one overdrive. A cascode biased at V_b = V_GS3 + V_OV1 then holds V_DS2 at the same value. After Razavi Fig. 5.16(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (3.4,0) node[nmos](M2){};
  \draw (3.4,1.8) node[nmos](M3){};
  \draw (M1.S) node[ground]{};
  \draw (M2.S) node[ground]{};
  \draw (M3.S) -- (M2.D);
  \draw (M1.G) -- (M2.G);
  \draw (M1.D) to[R, l_=$R_1$] ++(0,1.6) coordinate(G);
  \draw (G) node[circ]{} to[I, l_=$I_{REF}$] ++(0,1.6) node[above] {$V_{DD}$};
  \draw (G) -| (1.3,0) node[circ]{};
  \draw (M3.G) -- ++(-0.3,0) node[left] {$V_b$};
  \draw (M3.D) -- ++(0,0.6) node[ocirc]{} node[right] {$I_{out}$};
  \node[left,font=\scriptsize] at (0,0.8) {$V_{DS1}\approx V_{OV1}$};
  \node[font=\scriptsize] at (4.3,0) {$M_2$};
  \node[font=\scriptsize] at (4.3,1.8) {$M_3$};
  \node[font=\scriptsize] at (-0.9,-0.3) {$M_1$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.0,1.0) {$R_1I_{REF}\approx V_{TH1}$\\[2pt] $V_b=V_{GS3}+V_{OV1}$\\[2pt] $\Rightarrow V_{DS2}=V_{DS1}\approx V_{OV}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_1I_{REF}\approx V_{TH1},\quad V_b = V_{GS3}+(V_{GS1}-V_{TH1})\ \Rightarrow\ V_{DS2}=V_{DS1}\approx V_{OV}}
$$

- The $M_1$–$R_1$ combination is still a diode: its impedance is $\frac{R_1+r_o}{1+g_mr_o}\approx\frac1{g_m}$ (Razavi Ex. 5.5).
- **Weakness:** $R_1I_{REF}$ and $V_{TH1}$ drift differently over PVT, and generating $V_b$ = one $V_{GS}$ plus one overdrive needs a bias branch whose $IR$ products track $R_1I_{REF}$.

> [!tip] Remark
> $\frac{R_1+r_o}{1+g_mr_o}$ is the impedance looking into the source of a common-gate stage with load $R_1$ ([[Single-Stage]]). With $\lambda=0$ it is exactly $1/g_m$.

> [!note]- Detail: generating $V_b$ for the resistor-shifted mirror (Razavi Fig. 5.16(b), (c))
> **(b)** A diode $M_5$ plus a resistor $R_6$ carrying $I_6$: $V_b = V_{GS5}+R_6I_6$. Matching $V_{GS5}=V_{GS3}$ is easy, but $R_6I_6 = V_{GS1}-R_1I_{REF}$ is not, because $IR$ products don't track $V_{GS}$ (resistors may fall with temperature while $V_{GS}$ rises).
> **(c)** A diode $M_5$ sets $V_{GS}$; on top, a copy $M_6$ of $M_1$ with $R_6$ in its drain sets the overdrive: $V_{GS6}-R_6I_6 = V_{GS1}-R_1I_{REF}$. Choose $I_6=I_{REF}$, $R_6=R_1$, $(W/L)_6=(W/L)_1$ and both terms track. A small error remains from body effect ($M_6$ has it, $M_1$ doesn't).

> [!note]- Detail: a replica pair forces the real drain voltage on the reference (Razavi Ex. 5.6)
> When there is no headroom for any cascode, at least make $V_{DS1}$ equal $V_{DS2}$. For a tail source under a differential pair, $V_{DS2}$ is the pair's source node $P$, which moves with the input CM. Put a scaled replica of the pair (same $L$, $W_r/W_d = I_{REF}/I_{SS}$, gates on the same inputs $A$, $B$) on top of the reference diode: its source $P'$ tracks $P$, so $V_{DS1}=V_{DS2}$ at every CM level. If the CM rises too far the replica goes into triode and the error returns.

### Low-Voltage Cascode Mirror

```tikz title="Low-voltage cascode mirror. The reference branch is itself a cascode with its output tied to its input, so V_DS1 = V_b - V_GS0 can be set to one overdrive; M_3 copies it onto B. After Razavi Fig. 5.18(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (0,1.8) node[nmos,xscale=-1](M0){};
  \draw (3.6,0) node[nmos](M2){};
  \draw (3.6,1.8) node[nmos](M3){};
  \draw (M1.S) node[ground]{};
  \draw (M2.S) node[ground]{};
  \draw (M0.S) -- (M1.D);
  \draw (M3.S) -- (M2.D);
  \draw (M0.D) -- ++(0,0.4) coordinate(X);
  \draw (X) node[circ]{} to[I, l_=$I_{REF}$] ++(0,1.7) node[above] {$V_{DD}$};
  \draw (X) -| (1.5,0) node[circ]{};
  \draw (M1.G) -- (M2.G);
  \draw (M0.G) -- (1.2,1.8) to[crossing] (1.8,1.8) -- (M3.G);
  \draw (2.5,1.8) node[circ]{} -- (2.5,2.6) node[above] {$V_b$};
  \draw (M3.D) -- ++(0,1.1) node[ocirc]{} node[right] {$V_{out}$};
  \node[left,font=\scriptsize] at (X) {$X$};
  \node[left,font=\scriptsize] at (0,0.9) {$A$};
  \node[right,font=\scriptsize] at (3.6,0.9) {$B$};
  \node[font=\scriptsize] at (-0.9,0) {$M_1$};
  \node[font=\scriptsize] at (-0.9,1.8) {$M_0$};
  \node[font=\scriptsize] at (4.5,0) {$M_2$};
  \node[font=\scriptsize] at (4.5,1.8) {$M_3$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.1,1.4) {$V_A=V_B=V_b-V_{GS0}\approx V_{OV1}$\\[2pt] $V_{out,min}=2V_{OV}$\\[2pt] $V_{GS0}+V_{OV1}\le V_b\le V_{GS1}+V_{TH0}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{GS0}+(V_{GS1}-V_{TH1})\ \le\ V_b\ \le\ V_{GS1}+V_{TH0}},\qquad\boxed{V_{out,min} = 2V_{OV}}
$$

- Lower bound keeps $M_1$ saturated, upper bound keeps $M_0$ saturated. The window exists only if $V_{OV0} < V_{TH1}$: **size $M_0$ for a small overdrive.**
- Same accuracy and $R_{out}\approx g_{m3}r_{o3}r_{o2}$ as the stacked cascode, a $V_{TH}$ less headroom. Razavi: this "finds wider usage" than the regular cascode mirror.
- For minimum headroom set $V_b$ at (or slightly above) the lower bound, $V_{GS0}+V_{OV1}$.

> [!note]- Detail: generating $V_b$ for the low-voltage cascode (Razavi Fig. 5.19)
> **(a)** Diode $M_5$ gives $V_{GS5}\approx V_{GS0}$; $M_6$ with $R_b$ in its drain gives $V_{DS6} = V_{GS6}-R_bI_1\approx V_{OV1}$. Errors: $M_5$ has no body effect but $M_0$ does, and $R_bI_1$ isn't well controlled.
> **(b)** Simpler: a diode-connected $M_7$ supplies the $V_{GS}$ and $M_6$ creates a $V_{DS}$ equal to the required overdrive. Same idea as the wide-swing bias below.

### Wide-Swing Cascode Mirror (Carusone's Version)

```tikz title="Wide-swing cascode mirror. Q_5, sized (n+1)^2 times weaker, generates V_bias = (n+1)V_OV + V_TH; the cascodes Q_1, Q_4 are n^2 times weaker, so Q_2 and Q_3 sit at V_DS = V_OV. Q_4 lowers V_DS3 to match V_DS2. After Carusone Fig. 6.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % bias generator
  \draw (-3.2,0.6) node[nmos,xscale=-1](Q5){};
  \draw (Q5.S) node[ground]{};
  \draw (Q5.D) -- ++(0,0.4) coordinate(B);
  \draw (B) node[circ]{} to[I, l_=$I_{bias}$] ++(0,1.6) node[above] {$V_{DD}$};
  \draw (B) -| (-2.3,0.6) -- (Q5.G);
  \draw (-2.3,0.6) node[circ]{} -- (-1.9,0.6) node[right] {$V_{bias}$};
  \node[font=\scriptsize,align=center] at (-3.2,-1.5) {$Q_5$: $\frac{W/L}{(n+1)^2}$};
  % input column
  \draw (0,1.8) node[nmos](Q4){};
  \draw (0,0) node[nmos,xscale=-1](Q3){};
  \draw (Q3.S) node[ground]{};
  \draw (Q4.S) -- (Q3.D);
  \draw (Q4.D) -- ++(0,0.4) coordinate(X);
  \draw (X) node[circ]{} to[I, l_=$I_{in}$] ++(0,1.6) node[above] {$V_{DD}$};
  \draw (X) -| (0.95,0) node[circ]{};
  \draw (Q4.G) -- ++(-0.2,0) node[left] {$V_{bias}$};
  % output column
  \draw (3.8,0) node[nmos](Q2){};
  \draw (3.8,1.8) node[nmos](Q1){};
  \draw (Q2.S) node[ground]{};
  \draw (Q1.S) -- (Q2.D);
  \draw (Q3.G) -- (Q2.G);
  \draw (Q1.G) -- ++(-0.2,0) node[left] {$V_{bias}$};
  \draw (Q1.D) -- ++(0,0.9) node[ocirc]{} node[right] {$V_{out}$};
  \node[font=\scriptsize] at (-0.9,0) {$Q_3$};
  \node[font=\scriptsize] at (0.45,2.45) {$Q_4$};
  \node[font=\scriptsize] at (4.4,0) {$Q_2$};
  \node[font=\scriptsize] at (4.4,1.8) {$Q_1$};
  \node[font=\scriptsize,anchor=west] at (0.1,0.9) {};
  \node[font=\scriptsize,align=left,anchor=west] at (5.0,1.2) {$Q_2,Q_3$: $W/L$;\quad $Q_1,Q_4$: $\frac{W/L}{n^2}$\\[2pt] $V_{bias}=(n+1)V_{OV}+V_{TH}$\\[2pt] $V_{DS2}=V_{DS3}=V_{OV}$\\[2pt] $V_{out}>(n+1)V_{OV}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{bias}=(n+1)V_{eff}+V_{tn},\quad V_{DS2}=V_{DS3}=V_{eff},\quad V_{out}>(n+1)V_{eff}\ \overset{n=1}{=}\ 2V_{eff}}
$$

- Same current in every device: $Q_5$ at $(W/L)/(n+1)^2$ has $V_{eff5}=(n+1)V_{eff}$; $Q_1$, $Q_4$ at $(W/L)/n^2$ have $nV_{eff}$.
- $Q_3$–$Q_4$ act like one diode; $Q_4$ only lowers $V_{DS3}$ to $V_{eff}$ so it matches $V_{DS2}$. Without it, $I_{out}$ is a little low.
- Extra condition for $Q_4$: $V_{DS4} = V_{tn} > nV_{eff}$, easy.
- With $V_{eff}$ = 0.2 to 0.25 V, all devices stay saturated with only **0.4 to 0.5 V** across the mirror.

> [!tip] Remark
> Razavi's low-voltage cascode and Carusone's wide-swing mirror are the **same idea**: the reference cascode's output is tied back to the bottom gates, and the cascode gate is biased one overdrive above a $V_{GS}$. Carusone just gives a sizing recipe ($n$) for $V_b$.

> [!note]- Detail: practical sizing of the wide-swing mirror (Carusone §6.3.1)
> - Make $(W/L)_5$ a bit **smaller** than $(W/L)/(n+1)^2$ so $Q_2$, $Q_3$ get about 0.1 V more than the minimum $V_{DS}$: the triode/saturation edge is soft, and body effect raises $V_{TH}$ of $Q_1$, $Q_4$, pushing $Q_2$, $Q_3$ toward triode.
> - Scale the $Q_5$ branch down in current at the same current density to save power.
> - $L$ of $Q_2$, $Q_3$ near minimum (small $V_{DS}$, and their $C_{GS}$ sets the high-frequency poles); $Q_1$, $Q_4$ longer, about $2L_{min}$, since the output device sees large voltages (drain-substrate leakage).
> - **Choosing $I_{bias}$** when $I_{in}$ varies: set it to the maximum $I_{in}$ (always saturated, some swing wasted), or the nominal one (some devices enter triode at large $I_{in}$, e.g. while slewing; usually tolerable).

## Level 4: Feedback Raises Output Impedance

### Regulated Gate (No Cascode)

```tikz title="Regulated-gate mirror. M_3 senses V_X and pulls node N down when V_X rises, cancelling the r_o1 current change. After Razavi Ex. 5.7, Fig. 5.21(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](M2){};
  \draw (M2.S) node[ground]{};
  \draw (M2.D) -- ++(0,0.5) coordinate(N);
  \draw (N) node[circ]{} to[I, l_=$I_{REF}$] ++(0,1.6) node[above] {$V_{DD}$};
  \draw (N) -| (0.9,0) node[circ]{};
  \draw (3.4,0) node[nmos](M1){};
  \draw (M2.G) -- (M1.G);
  \draw (M1.S) node[ground]{};
  \draw (M1.D) -- ++(0,1.2) node[ocirc]{} node[right] {$X$ (output, $V_X$)};
  \draw (-2.0,0) node[nmos](M3){};
  \draw (M3.S) node[ground]{};
  \draw (M3.D) |- (N);
  \draw (M3.G) -- ++(-0.3,0) node[left] {$X$};
  \node[right,font=\scriptsize] at ([yshift=0.15cm]N) {$N$};
  \node[font=\scriptsize] at (1.3,-0.45) {$M_2$};
  \node[font=\scriptsize] at (-2.5,-0.5) {$M_3$};
  \node[font=\scriptsize] at (4.0,0) {$M_1$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{cancellation when } \frac{g_{m3}g_{m1}}{g_{m2}}\approx\frac1{r_{o1}}},\qquad\boxed{V_X > V_{TH3}}
$$

$V_X$ up by $\Delta V$ adds $\Delta V/r_{o1}$ to $I_{D1}$. $M_3$ draws $g_{m3}\Delta V$ from $N$, so $V_N$ falls by $g_{m3}\Delta V/g_{m2}$ and $I_{D1}$ falls by $g_{m1}g_{m3}\Delta V/g_{m2}$.

- **Large-signal:** below $V_{OV1}$, $M_1$ is in triode; from $V_{OV1}$ to $V_{TH3}$ it behaves like a simple mirror; above $V_{TH3}$ $M_3$ turns on and regulates; at large $V_X$ $M_3$ takes all of $I_{REF}$ and turns $M_1$ off.
- High $R_{out}$ with no stacked device, but the compliance is $V_{TH3}$, **above** $V_{DS,sat}$.

> [!note]- Detail: nanometer reality (Razavi §5.2, Nanometer Design Note)
> With $W/L = 5\ \mu\text{m}/40$ nm and $I_{REF}=0.25$ mA, even the cascode mirror's $I_X$ still varies noticeably with $V_X$ while every device is saturated (for $V_X>0.4$ V). Short-channel $r_o$ is that poor; this is what pushes designers toward the feedback mirrors below.

### Enhanced Output Impedance (Gain Boosting)

```tikz title="Enhanced output-impedance mirror. An amplifier A holds the drain of Q_2 at V_bias by driving the cascode gate, multiplying the cascode's R_out by (1 + A). After Carusone Fig. 6.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos,xscale=-1](Q3){};
  \draw (Q3.S) node[ground]{};
  \draw (Q3.D) -- ++(0,0.4) coordinate(X);
  \draw (X) node[circ]{} to[I, l_=$I_{in}$] ++(0,1.8) node[above] {$V_{DD}$};
  \draw (X) -| (0.9,0) node[circ]{};
  \draw (5.6,0) node[nmos](Q2){};
  \draw (Q3.G) -- (Q2.G);
  \draw (Q2.S) node[ground]{};
  \draw (5.6,2.2) node[nmos](Q1){};
  \draw (Q1.S) -- (Q2.D);
  \draw (Q1.D) -- ++(0,0.9) node[ocirc]{} node[right] {$V_{out}$};
  \draw (3.6,2.2) node[op amp,scale=0.6,yscale=-1](A){};
  \draw (A.out) -- (Q1.G);
  \draw (A.+) -- ++(-0.4,0) node[left] {$V_{bias}$};
  \draw (A.-) -- ++(-0.25,0) |- (4.4,1.1) -| (5.6,1.1) node[circ]{};
  \node at (3.5,2.2) {\scriptsize $A$};
  \node[font=\scriptsize] at (6.2,2.2) {$Q_1$};
  \node[font=\scriptsize] at (6.2,0) {$Q_2$};
  \node[font=\scriptsize] at (-0.9,0) {$Q_3$};
  \node[font=\scriptsize,anchor=west] at (6.8,1.1) {$R_{out}\approx g_{m1}r_{o1}r_{o2}(1+A)$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{out}\approx g_{m1}r_{ds1}r_{ds2}(1+A)}
$$

The loop holds $V_{DS2}$ fixed whatever $V_{out}$ does. The same amplifier on the cascode of a gain stage raises its gain by $(1+A)$: **gain boosting** ([[Operational Amplifiers]]), but only if the load mirror is boosted too.

- **Limit:** impact ionization puts a drain-to-substrate conductance at $Q_1$ that no loop can remove ([[MosFETs#Output Impedance vs. V_DS]]).
- **Säckinger's version** uses a single CS device $Q_3$ with current-source load as $A$: loop gain $\approx g_{m3}r_{ds3}/2$, so $r_{out}\approx g_{m1}g_{m3}r_{ds1}r_{ds2}r_{ds3}/2$. But $V_{DS2} = V_{eff3}+V_{tn}$: the $V_{TH}$ penalty is back.
- **Wide-swing + enhanced** (Carusone Fig. 6.16): a diode level shifter in front of each CS booster puts $V_{DS2}=V_{eff}$, so $V_{out}>2V_{eff}$ again. Roughly doubles power vs a plain cascode mirror at $I_{bias}=I_{in}/7$.
- **Costs:** the boost loop must be stable (local compensation caps may be needed to stop ringing), and large-signal settling slows (the booster output slews away and must return), typically about **50% longer**, for perhaps **30 dB** more gain (Carusone §6.3.3).

> [!tip] Remark
> This is feedback that senses the output current, which raises output impedance by $(1+\text{loop gain})$ ([[Feedback]]). The regulated-gate mirror above is the same loop with the sensing device acting on the mirror gate instead of a cascode gate.

> [!note]- Derivation: the booster adds a pole-zero doublet near its unity-gain frequency (Carusone Ex. 6.8)
> Let $A(s)\approx A_0/(s\tau'_1)$ near its unity-gain frequency, and $A_V(s) = -g_{m2}\left[R_{out}(s)\,\|\,\frac1{sC_L}\right]$ with $R_{out}(s) = g_{m1}r_{ds1}r_{ds2}(1+A(s))$. Working in conductances:
> $$A_V(s) = \frac{-g_{m2}(A_0+s\tau'_1)}{s\left(A_0C_L+\frac{g_{ds1}g_{ds2}\tau'_1}{g_{m1}}+sC_L\tau'_1\right)}$$
> Zero at $\omega_z = A_0/\tau'_1$, the booster's unity-gain frequency. Second pole at $p_2 = \frac{A_0}{\tau'_1}+\frac{1}{\tau'_1C_LR'}$, $R' = g_{m1}r_{ds1}r_{ds2}$, and the first term dominates, so $p_2\approx\omega_z$. They nearly cancel. Rule: make the booster's unity-gain frequency higher than the op amp's.

## Level 5: Active Current Mirrors

### The Active-Load Pair

```tikz title="The five-transistor OTA: the mirror M_3, M_4 copies M_1's signal current to the output, so both halves of the pair contribute. Right: large-signal transfer, with a narrow high-gain window. After Razavi Figs. 5.26(b), 5.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3.2) node[pmos,xscale=-1](M3){};
  \draw (2.6,3.2) node[pmos](M4){};
  \draw (0,1.2) node[nmos](M1){};
  \draw (2.6,1.2) node[nmos,xscale=-1](M2){};
  \draw (M3.S) -- ++(0,0.3) -| (M4.S);
  \node[above] at (1.3,{3.2+0.77+0.3}) {$V_{DD}$};
  \draw (M3.D) -- (M1.D);
  \draw (M4.D) -- (M2.D);
  \draw (M3.G) -- (M4.G);
  \draw (0,2.2) node[circ]{} -| (1.0,3.2) node[circ]{};
  \draw (M1.S) -- ++(0,-0.3) coordinate(a) -| (M2.S);
  \draw (1.3,-1.2) node[nmos](M5){};
  \draw (1.3,{1.2-0.77-0.3}) node[circ]{} -- (M5.D);
  \draw (M5.S) node[ground]{};
  \draw (M5.G) -- ++(-0.2,0) node[left] {$V_b$};
  \draw (2.6,2.2) node[circ]{} -- (3.6,2.2) node[ocirc]{} node[right] {$V_{out}$};
  \draw (M1.G) -- ++(-0.2,0) node[left] {$V_{in1}$};
  \draw (M2.G) -- ++(0.2,0) node[right] {$V_{in2}$};
  \node[left,font=\scriptsize] at (0,2.2) {$F$};
  \node[above,font=\scriptsize] at (2.9,2.2) {$X$};
  \node[right,font=\scriptsize] at (1.35,0.25) {$P$};
  \node[font=\scriptsize] at (-0.9,3.2) {$M_3$};
  \node[font=\scriptsize] at (3.5,3.2) {$M_4$};
  \node[font=\scriptsize] at (0.45,0.65) {$M_1$};
  \node[font=\scriptsize] at (2.15,0.65) {$M_2$};
  \node[font=\scriptsize] at (1.9,-1.2) {$M_5$};
  \begin{scope}[xshift=6.6cm,yshift=0.2cm]
    \draw[->] (-0.2,0) -- (4.8,0) node[right] {$V_{in1}-V_{in2}$};
    \draw[->] (2.2,-0.2) -- (2.2,3.6) node[above] {$V_{out}$};
    \draw[thick,domain=0:4.5,samples=80] plot (\x,{0.15+1.525*(1+tanh(3.5*(\x-2.2)))});
    \draw[dashed] (0,3.2) -- (2.2,3.2) node[left,font=\scriptsize,pos=0] {};
    \node[left,font=\scriptsize] at (2.2,3.35) {$V_{DD}$};
    \node[font=\scriptsize,anchor=west] at (2.6,1.6) {high-gain window:};
    \node[font=\scriptsize,anchor=west] at (2.6,1.2) {$M_2$, $M_4$ saturated};
    \node[font=\scriptsize,align=center] at (0.8,0.7) {$M_1$ off,\\ $V_{out}\approx 0$};
    \node[font=\scriptsize,align=center] at (3.6,2.6) {$M_2$ off};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{G_m = g_{m1,2},\qquad R_{out}\approx r_{o2}\|r_{o4},\qquad |A_v|\approx g_{m1,2}(r_{o2}\|r_{o4})}
$$

Here the mirror is in the **signal path**. Taking one output of a pair with a fixed-gate load wastes $M_1$'s signal current ($G_m = g_{m1}/2$); the mirror turns it around and adds it to $M_2$'s, doubling $G_m$.

> [!tip] Remark
> Everything about this circuit (approximate and exact gain, why the half circuit fails, CMRR, input CM vs output swing, the level-shift trick) is derived in [[Differential Amplifiers#Level 5 The Active-Load Pair (Five-Transistor OTA)]]. Below are only the properties that come from the **mirror**.

**What the mirror itself contributes:**

- **Asymmetry.** Node $F$ is a diode ($\approx 1/g_{m3}$) and barely moves; node $X$ is high-impedance and swings fully. The pair is no longer symmetric, so use $|A_v|=G_mR_{out}$, not the half circuit.
- **Balanced output at $V_F$:** with perfect symmetry, $V_{out}=V_F=V_{DD}-|V_{GS3}|$ at $V_{in1}=V_{in2}$. Any mismatch moves it far, so the OTA is used inside feedback or as a large-swing diff-to-single-ended converter.
- **Imperfect copy of CM changes.** $M_3$ has finite $r_{o3}$, so it passes on $\frac{g_{m4}r_{o3}}{1+g_{m3}r_{o3}}$ of a CM current change, not all of it: nonzero CM gain even with perfect matching (Razavi Ex. 5.13).
- **Supply rejection ≈ unity.** $M_1$ is a high-impedance current source, so $|V_{GS3}|$ stays fixed and $V_F$ follows $V_{DD}$; by symmetry $V_{out}$ does too. A fully differential pair with current-source loads moves both outputs equally and the difference survives (Razavi §5.3.4).
- **Mirror pole and zero.** The slow path through $M_3$/$M_4$ has a pole at node $E$ (= $F$): $\omega_{p2}\approx g_{m3}/C_E$, with a left-half-plane zero at $2\omega_{p2}$. Fully differential pairs without mirrors in the signal path don't have it ([[Frequency Response]]).

> [!note]- Derivation: the mirror pole and its zero (Razavi §6.6.2, Eqs. 6.90–6.96)
> Replace $V_{in}$, $M_1$, $M_2$ by a Thevenin source $V_X = g_{mN}r_{oN}V_{in}$ with $R_X = 2r_{oN}$ between $E$ and the output, keep $C_E$ at $E$ and $C_L$ at the output:
> $$\frac{V_{out}}{V_{in}} = \frac{g_{mN}r_{oN}(2g_{mP}+C_Es)r_{oP}}{2r_{oP}r_{oN}C_EC_Ls^2+\left[(2r_{oN}+r_{oP})C_E+r_{oP}(1+2g_{mP}r_{oN})C_L\right]s+2g_{mP}(r_{oN}+r_{oP})}$$
> With the mirror pole far above the output pole: $\omega_{p1}\approx\frac1{(r_{oN}\|r_{oP})C_L}$, $\omega_{p2}\approx\frac{g_{mP}}{C_E}$. Why a zero at $2\omega_{p2}$: a slow path $\frac{A_0}{(1+s/\omega_{p1})(1+s/\omega_{p2})}$ adds to a fast path $\frac{A_0}{1+s/\omega_{p1}}$, giving $\frac{A_0(2+s/\omega_{p2})}{(1+s/\omega_{p1})(1+s/\omega_{p2})}$.
> $C_E$ collects $C_{GS3}$, $C_{GS4}$, $C_{DB3}$, $C_{DB1}$ and the Miller-multiplied $C_{GD1}$, $C_{GD4}$; PMOS $g_m/C_{GS}$ is poor, so this pole matters.

## Level 6: Mismatch

With $V_{DS1}=V_{DS2}$ (everything above), what's left is random mismatch between the two devices.

$$
\boxed{\frac{\sigma(\Delta I)}{I}\approx\frac{g_m}{I_D}\,\sigma(\Delta V_T) = \frac{g_m}{I_D}\cdot\frac{A_{VT}}{\sqrt{WL}}}
$$

A $\Delta V_T$ in series with $M_2$'s gate reaches the output through $g_m$; divided by $I_D$, the gain from threshold error to *fractional* current error is $g_m/I_D$. The current-factor term $\Delta\beta/\beta$ adds in quadrature but is negligible at practical biases (Jespers & Murmann Ex. 4.7: comparable only near $g_m/I_D\approx2.5$ S/A).

> [!tip] Remark
> $g_m/I_D$ is the sizing variable from [[MosFETs#gm/ID and ID/W Simulation-Aided Design]] and [[gm-ID Design Methodology]]; $A_{VT}/\sqrt{WL}$ is Pelgrom's law ([[Nonlinearity and Mismatch]]). Note the opposite instruction from a differential pair, whose *voltage* offset wants high $g_m/I_D$.

- **Fixed area:** use the smallest $g_m/I_D$ (largest overdrive) headroom allows. The wall is $V_{D,sat}\approx2/(g_m/I_D)$: 10 S/A costs 200 mV, 5 S/A costs 400 mV.
- **Fixed current, free area:** in weak inversion widening helps ($\propto 1/\sqrt W$); in strong inversion $W$ cancels and only longer $L$ helps, and pocket implants weaken even that.
- **Systematic IR drop** in a shared source strap shifts $V_{GS2}$ like a $\Delta V_T$, also referred by $g_m/I_D$, and never averages out. Strong inversion and short, wide, star-connected source straps help.
- Layout (common centroid, dummies, same orientation) removes the systematic part: [[MosFETs#Layout]], [[Device Matching]], [[Common-Centroid Layout]].

> [!note]- Detail: the strong-inversion result (Jespers & Murmann §4.3.2, Eqs. 4.50–4.55)
> With the EKV form of $g_m/I_D$, the error at fixed $I_D$ is a closed form in $W$. In weak inversion $g_m/I_D\to1/(nU_T)$ and $\sigma(\Delta I)/I\to\frac{A_{VT}}{nU_T\sqrt{WL}}$. In strong inversion $g_m/I_D\propto\sqrt{W/(I_DL)}$ and the $\sqrt W$ cancels: $\sigma(\Delta I)/I\propto\frac{A_{VT}}{L\sqrt{I_D}}$. Real devices bend slightly better than this at small $W$ because of mobility degradation. Because of pocket implants, J&M conservatively use $L_{min}$ (the length $A_{VT}$ was measured at) in the area term.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Longer $L$ (all mirror devices equal) | $r_o$, CLM error, matching (weakened by pocket implants) | Area, capacitance (lower mirror pole) |
| Larger overdrive (smaller $g_m/I_D$) | Matching ($\sigma(\Delta I)/I\propto g_m/I_D$), IR-drop sensitivity | Headroom: $V_{D,sat}\approx 2/(g_m/I_D)$ |
| Source degeneration $R_s$ | $r_{out}\times(1+g_mR_s)$ | $IR_s$ of headroom |
| Stacked-diode cascode | $R_{out}\approx g_mr_o^2$, exact copy | $V_{TH}$ extra headroom: $2V_{OV}+V_{TH}$ |
| Low-voltage / wide-swing cascode | Same $R_{out}$ at $2V_{OV}$ | Extra bias branch, $V_b$ window to hold over PVT |
| Feedback (regulated / gain-boosted) | $R_{out}\times(1+A)$, ~30 dB gain | Power, loop stability, ~50% slower large-signal settling |
| Copy ratio $K>1$ | Fewer reference branches, current gain | Output current and power scale with $K$; mismatch of chains adds |
| Active mirror load | $G_m$ doubled, single-ended output | Mirror pole, PSRR ≈ 1, nonzero CM gain, input CM limits swing |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Divider-biased current | $I_{out}\approx\frac12\mu_nC_{ox}\frac WL\left(\frac{R_2V_{DD}}{R_1+R_2}-V_{TH}\right)^2$ |
| Mirror ratio | $I_{out} = \frac{(W/L)_2}{(W/L)_1}I_{REF}$ |
| CLM error | $\frac{I_{out}}{I_{REF}} = \frac{(W/L)_2}{(W/L)_1}\cdot\frac{1+\lambda V_{DS2}}{1+\lambda V_{DS1}}$ |
| Simple mirror | $r_{in}=\frac1{g_{m1}}\parallel r_{o1}\approx\frac1{g_{m1}}$, $r_{out}=r_{o2}$ |
| Degenerated mirror | $r_{out} = r_{ds2}[1+R_s(g_{m2}+g_{s2}+g_{ds2})]\approx r_{ds2}(1+g_{m2}R_s)$ |
| Cascode mirror | $R_{out}\approx g_{m3}r_{o3}r_{o2}$, $V_{P,min} = 2V_{OV}+V_{TH}$ |
| Minimum cascode headroom | $V_{P,min} = 2V_{OV}$ at $V_b = V_{GS3}+V_{OV2}$ |
| Resistor-shifted reference | $R_1I_{REF}\approx V_{TH1}$, $V_b = V_{GS3}+V_{OV1}$ |
| Low-voltage cascode window | $V_{GS0}+V_{OV1}\le V_b\le V_{GS1}+V_{TH0}$, $V_{out,min}=2V_{OV}$ |
| Wide-swing mirror | $V_{bias}=(n+1)V_{eff}+V_{tn}$, $V_{DS2}=V_{eff}$, $V_{out}>(n+1)V_{eff}$ |
| Regulated gate | $g_{m3}g_{m1}/g_{m2}\approx 1/r_{o1}$, $V_X>V_{TH3}$ |
| Enhanced output impedance | $R_{out}\approx g_{m1}r_{ds1}r_{ds2}(1+A)$ |
| Active-load pair | $G_m = g_{m1,2}$, $R_{out}\approx r_{o2}\parallel r_{o4}$, $\lvert A_v\rvert\approx g_{m1,2}(r_{o2}\parallel r_{o4})$ |
| Mirror pole / zero | $\omega_{p2}\approx g_{m3}/C_E$, $\omega_z = 2\omega_{p2}$ |
| Mirror mismatch | $\sigma(\Delta I)/I\approx (g_m/I_D)\,A_{VT}/\sqrt{WL}$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 5 §5.1 Basic Current Mirrors, pp. 134–139: resistive biasing, copying principle, Ex. 5.1, Fig. 5.8, sizing with unit devices, series stacking, Ex. 5.2.
  - §5.2 Cascode Current Mirrors, pp. 139–146: CLM error, cascode mirror and its bias, Ex. 5.3, headroom (Fig. 5.14), Ex. 5.4, resistor-shifted reference (Figs. 5.16, Ex. 5.5), low-voltage cascode (Figs. 5.18, 5.19), Ex. 5.6 (replica), Ex. 5.7 (regulated mirror) and the nanometer design note.
  - §5.3 Active Current Mirrors, pp. 146–160: passive vs active load, large-signal behaviour, Exs. 5.8–5.13, CM properties, §5.3.4 supply rejection. Derivations themselves are in [[Differential Amplifiers]].
  - §6.6.2 Differential Pair with Active Load, pp. 201–202: mirror pole and zero.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - §3.1 Simple CMOS Current Mirror, pp. 118–119, Ex. 3.1.
  - §3.5 Source-Degenerated Current Mirrors, pp. 127–129, Ex. 3.6.
  - §3.6 Cascode Current Mirrors, pp. 129–131, Ex. 3.7.
  - §6.3 Advanced Current Mirrors, pp. 261–267: wide-swing (6.3.1), enhanced output impedance and gain boosting with Ex. 6.8 (6.3.2), wide-swing with enhanced output impedance (6.3.3), mirror symbol (6.3.4).
- **Jespers & Murmann, *Systematic Design of Analog CMOS Circuits***: §4.3.2 Effect of Mismatch in a Current Mirror, pp. 221–225, Ex. 4.7.
- **Zettelkasten extensions:** `S4 Current Mirrors and Biasing` (reading order; 4a1a, 4b1b, 4b4 framing); `Frequency Response/5h` (mirror pole and zero); `Nonlinearity and Mismatch/12s`, `12s2`, `12s3`, `12s4` (mirror mismatch via $g_m/I_D$, fixed-area vs fixed-current rules, source-line IR drop; checked against J&M §4.3.2).
