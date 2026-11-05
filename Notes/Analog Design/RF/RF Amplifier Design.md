---
title: RF Amplifier Design
description: Designing a microwave transistor amplifier from its S-parameters, with gains, K-Δ and μ stability, stability, gain and noise circles, conjugate and LNA matching, broadband (balanced, distributed) and power amplifiers (classes, PAE, load-pull).
kind: topic
status: growing
aliases:
  - RF Amplifier Design
  - Microwave Amplifier Design
  - LNA Design
  - Power Amplifiers
  - Stability Circles
  - Rollett Stability Factor
---

Treat the transistor as a box of four S-parameters. The design is then a matter of choosing two reflection coefficients, $\Gamma_S$ and $\Gamma_L$, and building lossless networks that present them. The note starts with what the box does with those choices (gain), then what it must never do (oscillate), then how to choose for maximum gain, specified gain, low noise and, at the end, large-signal power. Stop after any level and you still have a correct, coarser picture.

## The big picture

```tikz title="The single-stage amplifier on one screen. Two lossless matching networks turn 50 Ω into the Γ_S and Γ_L the transistor should see; every design question is a choice of those two points. After Pozar Fig. 12.2 and binder p. 188."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \tikzset{blk/.style={draw,thick,fill=blue!5,minimum width=2.0cm,minimum height=1.3cm,align=center,font=\scriptsize}}
  \draw (0,0) to[sV] (0,2);
  \draw (0,2) to[R,l=$Z_0$] (1.8,2);
  \draw (0,0) -- (1.8,0);
  \node[blk] (IM) at (2.9,1) {input\\matching\\network};
  \node[blk,fill=orange!10] (T) at (6.2,1) {transistor\\$[S]$};
  \node[blk] (OM) at (9.5,1) {output\\matching\\network};
  \draw (1.8,2) -- (1.9,2) |- ([yshift=0.4cm]IM.west); \draw (1.8,0) -- (1.9,0) |- ([yshift=-0.4cm]IM.west);
  \draw ([yshift=0.4cm]IM.east) -- ([yshift=0.4cm]T.west); \draw ([yshift=-0.4cm]IM.east) -- ([yshift=-0.4cm]T.west);
  \draw ([yshift=0.4cm]T.east) -- ([yshift=0.4cm]OM.west); \draw ([yshift=-0.4cm]T.east) -- ([yshift=-0.4cm]OM.west);
  \draw ([yshift=0.4cm]OM.east) -- (11.2,1.4) to[R,l=$Z_0$] (11.2,0.6) -- ([yshift=-0.4cm]OM.east);
  \draw[->,thick,blue] (4.35,-0.2) -- (4.35,0.3); \node[blue,below,font=\scriptsize] at (4.25,-0.2) {$\Gamma_S$};
  \draw[->,thick,red] (4.75,-0.2) -- (4.75,0.3); \node[red,below,font=\scriptsize] at (4.85,-0.2) {$\Gamma_{in}$};
  \draw[->,thick,red] (7.65,-0.2) -- (7.65,0.3); \node[red,below,font=\scriptsize] at (7.55,-0.2) {$\Gamma_{out}$};
  \draw[->,thick,blue] (8.05,-0.2) -- (8.05,0.3); \node[blue,below,font=\scriptsize] at (8.15,-0.2) {$\Gamma_L$};
  \node[font=\scriptsize] at (2.9,2.15) {$G_S$};
  \node[font=\scriptsize] at (6.2,2.15) {$G_0=|S_{21}|^2$};
  \node[font=\scriptsize] at (9.5,2.15) {$G_L$};
  \node[font=\scriptsize,align=center] at (6.2,-1.35) {you choose $\Gamma_S,\Gamma_L$ (blue); the device answers with $\Gamma_{in},\Gamma_{out}$ (red)\\
    stable: $|\Gamma_{in}|<1,\ |\Gamma_{out}|<1$ \quad max gain: $\Gamma_S=\Gamma_{in}^*,\ \Gamma_L=\Gamma_{out}^*$ \quad low noise: $\Gamma_S=\Gamma_{opt}$};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Transducer gain splits into three factors:** $G_T = G_S\,G_0\,G_L$ with $G_0 = |S_{21}|^2$. The matching networks have "gain" $G_S, G_L > 1$ because they recover the mismatch loss of a badly matched device.
> 2. **Stability is a property of the terminations.** The amplifier oscillates if $|\Gamma_{in}|>1$ or $|\Gamma_{out}|>1$ (negative resistance). **Unconditionally stable** for every passive termination iff $K>1$ and $|\Delta|<1$, or in one number, $\mu>1$.
> 3. **Stability circles** in the $\Gamma_L$ and $\Gamma_S$ planes fence off the terminations that oscillate. Keep $\Gamma_S$ and $\Gamma_L$ well away from them, at every frequency the device has gain.
> 4. **Maximum gain = simultaneous conjugate match** $\Gamma_S = \Gamma_{in}^*$, $\Gamma_L = \Gamma_{out}^*$. It exists only if $K>1$ and gives $G_{T,max} = \left|\frac{S_{21}}{S_{12}}\right|\left(K-\sqrt{K^2-1}\right)$. At $K=1$ this is the **maximum stable gain** $|S_{21}/S_{12}|$.
> 5. **Less gain buys bandwidth or noise.** Constant-gain circles and noise circles are drawn on the same $\Gamma_S$ plane. The LNA picks the point that trades $G$ against $F$: $\Gamma_S = \Gamma_{opt}$ gives $F_{min}$ but usually not the most gain or a good input match.
> 6. **Power amplifiers are designed for output power and efficiency, not gain.** The load comes from load-pull (large-signal $\Gamma_{LP}$), and the figure of merit is $\text{PAE} = \eta(1-1/G)$. Class A tops out at 50%, class B at 78.5%.

**Map:** [[#Physics background|why it oscillates, why matching is gain]] → [[#Spec translation|specs to Γ_S, Γ_L]] → [[#Power Gain Definitions|G, G_A, G_T]] → [[#Stability Circles|stability circles]] → [[#Rollett Stability Factor|K-Δ and μ]] → [[#Stabilising a Device|stabilising]] → [[#Unilateral Figure of Merit|unilateral design]] → [[#Constant-Gain Circles|gain circles]] → [[#Simultaneous Conjugate Match|bilateral max gain]] → [[#Operating and Available Gain Circles|G_P, G_A circles]] → [[#Noise Circles|noise circles]] → [[#Worked LNA Design|LNA example]] → [[#Inductively Degenerated CMOS LNA|CMOS LNA]] → [[#Distributed Amplifier|broadband]] → [[#Power Amplifiers|PAs]].

## Physics background

### Why an amplifier can oscillate

```tikz title="A port with negative resistance. If the source resistance cannot cancel it, any noise at the frequency where the reactances cancel grows: the amplifier has become an oscillator. After binder pp. 175, 182 (Eq. 18)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \draw (0,0) to[sV,l=$V_S$] (0,2) to[R,l=$R_S+jX_S$] (3,2) -- (3.6,2);
  \draw (0,0) -- (3.6,0);
  \draw[thick,fill=orange!10] (3.6,-0.3) rectangle (5.8,2.3);
  \node[align=center,font=\scriptsize] at (4.7,1.0) {$Z_{in}$\\$R_{in}<0$\\(feedback\\through $S_{12}$)};
  \draw[->,red] (1.8,1.0) arc (200:-140:0.45);
  \node[font=\scriptsize,anchor=west,align=left] at (6.1,1.0) {loop current $\propto \dfrac{V_S}{(R_S+R_{in})+j(X_S+X_{in})}$\\[2pt]
    $R_S+R_{in}\le0$ and $X_S+X_{in}=0$ $\Rightarrow$ it grows from noise:\\an oscillator. Same as $|\Gamma_{in}|>1$.};
\end{circuitikz}
\end{document}
```

$$
\boxed{|\Gamma| = \left|\frac{Z-Z_0}{Z+Z_0}\right| > 1 \iff \mathrm{Re}\,Z < 0}
$$

- A transistor feeds part of its output back to its input through $S_{12}$ (in a FET, mostly $C_{gd}$). With the wrong load, that feedback shows up at the input as a **negative resistance**, $|\Gamma_{in}|>1$. Same at the output with the wrong source.
- The loop "source + input port" oscillates if its total resistance $\mathrm{Re}(Z_S+Z_{in})\le 0$ where its reactance is zero. So the binder's practical rule: **the circuit is stable if $\mathrm{Re}(Z_S+Z_{in})>0$ and $\mathrm{Re}(Z_L+Z_{out})>0$**.
- $S_{12}=0$ (unilateral) removes the feedback: then only $|S_{11}|<1$ and $|S_{22}|<1$ matter.

> [!note]- Derivation: $|\Gamma|>1$ is the same as negative resistance
> With $Z = R+jX$: $|\Gamma|^2 = \frac{(R-Z_0)^2+X^2}{(R+Z_0)^2+X^2}$. Numerator minus denominator is $-4RZ_0$, so $|\Gamma|>1 \iff R<0$. A passive termination has $R\ge0$, so passive $\Gamma_S$, $\Gamma_L$ live inside the unit circle of the Smith chart. A negative-resistance port maps outside it.

> [!tip] Remark: this is not the stability of [[Stability]]
> [[Stability#Level 2: Phase Margin|Loop-gain stability]] asks whether a feedback loop's poles are in the left half-plane, judged from $\beta A$ with phase margin. Two-port (K-Δ) stability asks a different question: given a device whose S-parameters are already known to be pole-free (it could be measured without oscillating), is there any **passive termination** that creates a negative-resistance port? It is a test on the terminations, not on a designed loop. Both are the same physics (a loop with gain ≥ 1 and the right phase) seen from opposite ends; Pozar notes the rigorous version needs both no right-half-plane poles and $|\Gamma_{in}|,|\Gamma_{out}|<1$.

### Why matching is gain

$$
\boxed{G_S = \frac{1-|\Gamma_S|^2}{|1-\Gamma_{in}\Gamma_S|^2}, \qquad G_{S,max} = \frac{1}{1-|S_{11}|^2}\ \ (\text{unilateral})}
$$

- A raw transistor in 50 Ω reflects part of the available power at its input ($|S_{11}|$ large) and at its output. That reflected power is lost.
- A lossless matching network cannot create power, but it can stop that reflection. Relative to the unmatched device, it "gains" up to $1/(1-|S_{11}|^2)$. With $|S_{11}|=0.9$ that is 7.2 dB, often more than $|S_{21}|^2$ itself.
- Matching is narrowband: a conjugate match of a high-$|\Gamma|$ port is a high-Q resonance, so the more gain you take from matching, the less bandwidth you keep ([[Smith Chart and Impedance Matching#Bode–Fano Limit|Bode–Fano]]).

> [!tip] Remark
> "Conjugate match maximises power transfer" is [[Smith Chart and Impedance Matching#Conjugate Impedance Matching]]: $Z_{in} = Z_S^*$, $P = |V_S|^2/(8R_S)$. Here it is applied twice, once per port, and the two ports interact through $S_{12}$.

### Why the gain falls 6 dB per octave

$$
\boxed{G_{TU,max}\big|_{\text{FET}} = \frac{g_m^2R_{ds}}{4\omega^2R_iC_{gs}^2} = \frac{R_{ds}}{4R_i}\left(\frac{f_T}{f}\right)^2}
$$

The conjugately matched unilateral FET loses gain as $1/f^2$. Broadband amplifiers must fight this slope, and it is why the device's $f_T$ and $f_{max}$ have to sit well above the operating frequency.

> [!note]- Derivation: matched FET gain (Pozar Eq. 12.18)
> Unilateral FET model ($C_{gd}=0$): input $R_i$ in series with $C_{gs}$; output $g_mV_c$ in parallel with $R_{ds}$, $C_{ds}$. Conjugate-match the input with a series $X = 1/\omega C_{gs}$ and source resistance $R_i$, and the output with a shunt $B=-\omega C_{ds}$ and load $R_{ds}$. Then $V_c = V_S/(2j\omega R_iC_{gs})$, $P_L = \frac18|g_mV_c|^2R_{ds}$, $P_{avs} = |V_S|^2/(8R_i)$, so $G_{TU} = \frac{g_m^2R_{ds}}{4\omega^2R_iC_{gs}^2}$. With $\omega_T = g_m/C_{gs}$ this is $\frac{R_{ds}}{4R_i}(\omega_T/\omega)^2$.

> [!tip] Remark
> Setting this gain to 1 is how [[Active RF Devices#f_max and Mason's Unilateral Gain U|$f_{max}$]] is defined: $f_{max} = \frac{f_T}{2}\sqrt{R_{ds}/R_i}$. Device physics and the $f_T$, $f_{max}$ trade live there.

## Spec translation

An RF amplifier is itself an amplifier, but its specs are written in powers and reflection coefficients, not in DC gain and phase margin. The translation runs **amplifier spec → device and bias → $\Gamma_S$, $\Gamma_L$ → matching networks**.

### The block's specs

| Spec | Definition | Typical source of the number |
|---|---|---|
| Gain | transducer gain $G_T = P_L/P_{avs}$ in a 50 Ω system ($=|S_{21}|^2$ of the finished amp) | Pozar §12.1 |
| Gain flatness / bandwidth | $\pm1$ dB band of $G_T$ | Pozar Ex. 12.3–12.4 |
| Noise figure | $F$ at the chosen $\Gamma_S$ | Pozar §12.3, [[RF Noise and Distortion]] |
| Input / output VSWR | $\frac{1+|\Gamma_a|}{1-|\Gamma_a|}$, $\Gamma_a$ the mismatch seen at the amp port | binder pp. 253–256 |
| Stability margin | $K>1$, $|\Delta|<1$ (or $\mu>1$) over **all** frequencies with gain; distance of $\Gamma_S$, $\Gamma_L$ from the stability circles | Pozar §12.2, binder p. 226 |
| $OP_{1dB}$, IIP3 | output power at 1 dB compression; third-order intercept | Pozar §12.5, [[Nonlinearity and Mismatch]] |
| Efficiency | drain efficiency $\eta = P_{out}/P_{DC}$, PAE | Pozar §12.5 |

### Spec → device, bias, $\Gamma_S$, $\Gamma_L$

| Amplifier spec | What it lands on | How |
|---|---|---|
| Gain $G_T$ | device MSG / $G_{T,max}$ at $f$; then $\Gamma_S$, $\Gamma_L$ on gain circles | need $G_T \le G_{T,max}$ (or $\le$ MSG if $K<1$) with margin for matching loss |
| Bandwidth / flatness | how far $\Gamma_S$, $\Gamma_L$ sit from the chart centre | pick points on the gain circle closest to the centre; balanced/distributed/feedback for octaves |
| Noise figure | device $F_{min}$ at $f$ and bias; $\Gamma_S$ near $\Gamma_{opt}$ | $F\ge F_{min}$; the noise circle for the spec bounds $\Gamma_S$ |
| Input VSWR | $\Gamma_S$ vs $\Gamma_{in}^*$ | a low-noise $\Gamma_S\ne\Gamma_{in}^*$ costs input match: trade along $\Gamma_{opt}\to\Gamma_{MS}$, or use a balanced amp |
| Output VSWR | $\Gamma_L = \Gamma_{out}^*$ | then $G_T = G_A$ and output VSWR = 1 |
| Stability margin | $K$, $\mu$ of the device across the band; circle clearance | resistive loading or feedback if $K<1$; check every frequency, especially low |
| $OP_{1dB}$, IIP3 | bias point (class), device periphery, large-signal $\Gamma_{LP}$ | load-pull, not small-signal conjugate match; ≈20% power headroom in the device (Pozar) |
| PAE | class, gain $G$, output-network loss | $\text{PAE} = \eta(1-1/G)$; low-loss output match |

$$
\boxed{G_T \le G_{T,max} = \left|\tfrac{S_{21}}{S_{12}}\right|\left(K-\sqrt{K^2-1}\right)}\qquad
\boxed{F \ge F_{min}}\qquad
\boxed{\text{VSWR}_{in} = \frac{1+|\Gamma_a|}{1-|\Gamma_a|},\ \ |\Gamma_a| = \left|\frac{\Gamma_{in}-\Gamma_S^*}{1-\Gamma_{in}\Gamma_S}\right|}
$$

$$
\boxed{\text{PAE} = \frac{P_{out}-P_{in}}{P_{DC}} = \eta\left(1-\frac1G\right)}
$$

> [!note]- Derivation: input VSWR of a deliberately mismatched input
> The power delivered into the device input is $P_{in} = P_{avs}\,\frac{(1-|\Gamma_S|^2)(1-|\Gamma_{in}|^2)}{|1-\Gamma_S\Gamma_{in}|^2}$ (divide Pozar Eq. 12.5 by Eq. 12.9). A lossless input network passes that same power, so at its 50 Ω side the fraction reflected is $|\Gamma_a|^2 = 1-\frac{(1-|\Gamma_S|^2)(1-|\Gamma_{in}|^2)}{|1-\Gamma_S\Gamma_{in}|^2}$, and the identity $|1-\Gamma_S\Gamma_{in}|^2-(1-|\Gamma_S|^2)(1-|\Gamma_{in}|^2) = |\Gamma_{in}-\Gamma_S^*|^2$ gives the boxed form. $\Gamma_S = \Gamma_{in}^*$ gives $\Gamma_a = 0$. This reproduces every VSWR in the binder's trade-off table (pp. 254–256; checked numerically).

> [!note]- Derivation: why gain margin is needed above the spec
> Lossy matching elements and line loss sit between the 50 Ω ports and the device, so the realised $G_T$ is below the lossless-network prediction. Input loss also adds directly to the noise figure ([[RF Noise and Distortion]]: loss before the first gain stage counts dB for dB). Leave a few tenths of a dB to a dB of margin in $G_{T,max}$ over the target, and put nothing lossy before an LNA.

### Where it lands in sizing

| Spec | Knob |
|---|---|
| Gain at $f$ | $f_T$, $f_{max}$ of the device: technology, gate length, current density (bias) |
| $F_{min}$ | bias current: NF has a minimum vs $I_C$ / $I_D$ (binder p. 242: a BJT datasheet curve at 900 MHz, $V_{CE}=10$ V, bottoms out near 2.3 dB around 6–7 mA) |
| Input match (CMOS) | $L_s = Z_0/\omega_T$ (degeneration), $L_g$ resonates $C_{gs}$ ([[#Inductively Degenerated CMOS LNA]]) |
| $OP_{1dB}$ | supply voltage × current capacity: periphery (gate width) and bias class |
| Stability | $S_{12}$ (gate–drain feedback; a cascode reduces it), resistive loading |

> [!tip] Remark
> Device selection (which technology has the $F_{min}$ and $f_{max}$ for the job) is worked in [[Active RF Devices#Worked example: pick a device for a 4 GHz LNA]]. For a CMOS device, $f_T$ and $F_{min}$ against current density is the $g_m/I_D$ trade: read it from lookup tables with [[gm-ID Design Methodology]] instead of re-deriving it here.

**Worked translation** (Pozar Ex. 12.5, carried through in [[#Worked LNA Design]]): spec $F \le 2.0$ dB at 4 GHz, maximum gain compatible with it. Device: GaAs MESFET biased for minimum noise, $F_{min}=1.6$ dB, so the spec leaves 0.4 dB to spend on gain. $K = 2.78$: no stabilising needed. $U = 0.059$: unilateral design is within ±0.5 dB. The $F = 2$ dB noise circle bounds $\Gamma_S$; the highest gain circle touching it gives $\Gamma_S = 0.53\angle75^\circ$; the output takes $\Gamma_L = S_{22}^*$. Result: $F = 2.0$ dB, $G_T = 8.4$ dB.

## Level 0: Two-Port Power Gains

### Power Gain Definitions

```tikz title="Where each power is measured. P_avs and P_avn are what the source and the two-port could deliver into a conjugate match; P_in and P_L are what actually flows. After binder p. 186 and Pozar Fig. 12.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \draw (0,0) to[sV,l=$V_S$] (0,2) to[R,l=$Z_S$] (2.2,2) -- (3.2,2);
  \draw (0,0) -- (3.2,0);
  \draw[thick,fill=orange!10] (3.2,-0.3) rectangle (5.6,2.3); \node at (4.4,1.0) {$[S]$};
  \draw (5.6,2) -- (7.2,2) to[R,l=$Z_L$] (7.2,0) -- (5.6,0);
  \draw[->,thick] (2.3,2.6) -- (3.1,2.6) node[midway,above,font=\scriptsize] {$P_{in}$};
  \draw[->,thick,dashed,gray] (1.2,3.4) -- (2.6,3.4) node[midway,above,font=\scriptsize,text=black] {$P_{avs}=P_{in}|_{\Gamma_{in}=\Gamma_S^*}$};
  \draw[->,thick] (5.8,2.6) -- (6.8,2.6) node[midway,above,font=\scriptsize] {$P_L$};
  \draw[->,thick,dashed,gray] (5.8,3.4) -- (7.2,3.4) node[midway,above,font=\scriptsize,text=black] {$P_{avn}=P_L|_{\Gamma_L=\Gamma_{out}^*}$};
  \node[font=\scriptsize,align=left,anchor=west] at (8.0,1.0) {$G_P=P_L/P_{in}$\ \ (no $\Gamma_S$)\\[3pt]$G_A=P_{avn}/P_{avs}$\ \ (no $\Gamma_L$)\\[3pt]$G_T=P_L/P_{avs}$\ \ (both)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Gamma_{in} = S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L},\qquad \Gamma_{out} = S_{22}+\frac{S_{12}S_{21}\Gamma_S}{1-S_{11}\Gamma_S}}
$$

$$
\boxed{G = G_P = \frac{P_L}{P_{in}} = \frac{|S_{21}|^2(1-|\Gamma_L|^2)}{(1-|\Gamma_{in}|^2)\,|1-S_{22}\Gamma_L|^2}}
$$

$$
\boxed{G_A = \frac{P_{avn}}{P_{avs}} = \frac{|S_{21}|^2(1-|\Gamma_S|^2)}{|1-S_{11}\Gamma_S|^2\,(1-|\Gamma_{out}|^2)}}
$$

$$
\boxed{G_T = \frac{P_L}{P_{avs}} = \frac{(1-|\Gamma_S|^2)\,|S_{21}|^2\,(1-|\Gamma_L|^2)}{|1-\Gamma_S\Gamma_{in}|^2\,|1-S_{22}\Gamma_L|^2} = \frac{(1-|\Gamma_S|^2)\,|S_{21}|^2\,(1-|\Gamma_L|^2)}{|1-S_{11}\Gamma_S|^2\,|1-\Gamma_{out}\Gamma_L|^2}}
$$

| Gain | Ratio | Depends on | Equals $G_T$ when |
|---|---|---|---|
| Operating (power) gain $G_P$ | $P_L/P_{in}$ | $\Gamma_L$ only (not $\Gamma_S$) | input conjugate-matched, $\Gamma_S=\Gamma_{in}^*$ |
| Available gain $G_A$ | $P_{avn}/P_{avs}$ | $\Gamma_S$ only (not $\Gamma_L$) | output conjugate-matched, $\Gamma_L=\Gamma_{out}^*$ |
| Transducer gain $G_T$ | $P_L/P_{avs}$ | both | always the one you measure |

$$
\boxed{G_T \le G_P,\quad G_T\le G_A,\qquad G_T = G_P = G_A \text{ at a simultaneous conjugate match};\qquad G_T = |S_{21}|^2 \text{ for } \Gamma_S=\Gamma_L=0}
$$

- **$G_T$ is the design gain.** It is what a VNA reads as $|S_{21}|^2$ of the finished amplifier.
- **$G_P$ is the design tool when $\Gamma_L$ is chosen first** (gain, stability on the output side); then $\Gamma_S = \Gamma_{in}^*$ makes $G_T = G_P$.
- **$G_A$ is the design tool when $\Gamma_S$ is chosen first** (noise: $\Gamma_S$ near $\Gamma_{opt}$); then $\Gamma_L=\Gamma_{out}^*$ makes $G_T = G_A$. Datasheet "available gain circles" are $G_A$ (binder p. 247).

> [!tip] Remark
> $\Gamma_{in}$ and $\Gamma_{out}$ come from the signal-flow graph in [[Microwave Network Analysis#Signal Flow Graphs]], and $\Delta = S_{11}S_{22}-S_{12}S_{21}$ is the S-matrix determinant used all through this note. If $S_{12}=0$: $\Gamma_{in}=S_{11}$, $\Gamma_{out}=S_{22}$.

> [!note]- Derivation: the three gains from the source voltage (Pozar §12.1)
> Use peak phasors and $V_2^+ = \Gamma_LV_2^-$. Voltage division at the input gives $V_1^+ = \frac{V_S(1-\Gamma_S)}{2(1-\Gamma_S\Gamma_{in})}$. Then
> $$P_{in} = \frac{|V_1^+|^2}{2Z_0}(1-|\Gamma_{in}|^2) = \frac{|V_S|^2}{8Z_0}\frac{|1-\Gamma_S|^2}{|1-\Gamma_S\Gamma_{in}|^2}(1-|\Gamma_{in}|^2)$$
> $$P_L = \frac{|V_2^-|^2}{2Z_0}(1-|\Gamma_L|^2),\quad V_2^- = \frac{S_{21}V_1^+}{1-S_{22}\Gamma_L}$$
> $$P_{avs} = P_{in}\big|_{\Gamma_{in}=\Gamma_S^*} = \frac{|V_S|^2}{8Z_0}\frac{|1-\Gamma_S|^2}{1-|\Gamma_S|^2},\qquad P_{avn} = P_L\big|_{\Gamma_L=\Gamma_{out}^*} = \frac{|V_S|^2}{8Z_0}\frac{|S_{21}|^2|1-\Gamma_S|^2}{|1-S_{11}\Gamma_S|^2(1-|\Gamma_{out}|^2)}$$
> Ratios give $G$, $G_A$, $G_T$. Expressing every power through the source voltage $V_S$ (not $V_1^+$, which changes from case to case) is what keeps the bookkeeping straight. The two forms of $G_T$ are equal; the second is the first with the roles of input and output swapped.

> [!example] Pozar Ex. 12.1: three gains of one BJT (1 GHz)
> $S_{11}=0.38\angle-158^\circ$, $S_{12}=0.11\angle54^\circ$, $S_{21}=3.50\angle80^\circ$, $S_{22}=0.40\angle-43^\circ$; $Z_S = 25\ \Omega$, $Z_L=40\ \Omega$.
> 1. $\Gamma_S = -0.333$, $\Gamma_L = -0.111$.
> 2. $\Gamma_{in} = 0.365\angle-152^\circ$, $\Gamma_{out} = 0.545\angle-43^\circ$.
> 3. $G = 13.1$, $G_A = 19.8$, $G_T = 12.6$: $G_T$ is the smallest, as it must be. (Recomputed here: 13.09, 19.84, 12.60.)
>
> Drills: [[Exam Prep - Problems through Stability#12.1 ★ Gains of an attenuator|12.1]] (attenuator: $G$ ignores $Z_S$, $G_A$ ignores $Z_L$), [[Exam Prep - Problems through Stability#12.2 Gains of a real transistor (BFP640F, 1 GHz)|12.2]] (BFP640F, and why the unilateral answer would oscillate), [[Exam Prep - Problems through Stability#12.3 ★ Gains + powers with given terminations|12.3]] (gains and powers with given terminations).

### Transducer Gain as Three Blocks

$$
\boxed{G_T = G_S\,G_0\,G_L,\quad G_S = \frac{1-|\Gamma_S|^2}{|1-\Gamma_{in}\Gamma_S|^2},\quad G_0 = |S_{21}|^2,\quad G_L = \frac{1-|\Gamma_L|^2}{|1-S_{22}\Gamma_L|^2}}
$$

In dB: $G_T = G_S + G_0 + G_L$. The device fixes $G_0$; the designer moves $G_S$ and $G_L$. In the unilateral case $\Gamma_{in}\to S_{11}$ and the three factors are independent.

## Level 1: Stability

### Unconditional and Conditional Stability

- **Unconditionally stable:** $|\Gamma_{in}|<1$ and $|\Gamma_{out}|<1$ for **every** passive $\Gamma_S$, $\Gamma_L$ ($|\Gamma_S|,|\Gamma_L|<1$). No termination makes it oscillate.
- **Conditionally (potentially) unstable:** some passive terminations give $|\Gamma_{in}|>1$ or $|\Gamma_{out}|>1$. Usable, but only with $\Gamma_S$, $\Gamma_L$ in the stable regions.
- **Frequency-dependent.** Matching networks present different $\Gamma$'s at every frequency, so an amplifier stable at $f_0$ can oscillate out of band. Devices are usually least stable at low frequency, where their gain is highest ([[Exam Prep - Problems through Stability#12.5 K–Δ over frequency (GaN HEMT, Table 11.8)|Exam Prep 12.5]]: a GaN HEMT is potentially unstable at 0.5 and 1 GHz, unconditionally stable at 2 and 4 GHz).
- **Bias-dependent:** S-parameters, and so stability, change with bias.
- $|S_{11}|>1$ or $|S_{22}|>1$ can never be unconditionally stable: a 50 Ω termination ($\Gamma=0$) already gives $|\Gamma_{in}| = |S_{11}|>1$.

### Stability Circles

$$
\boxed{\text{Output } (\Gamma_L\text{ plane}, |\Gamma_{in}|=1):\quad C_L = \frac{(S_{22}-\Delta S_{11}^*)^*}{|S_{22}|^2-|\Delta|^2},\qquad R_L = \left|\frac{S_{12}S_{21}}{|S_{22}|^2-|\Delta|^2}\right|}
$$

$$
\boxed{\text{Input } (\Gamma_S\text{ plane}, |\Gamma_{out}|=1):\quad C_S = \frac{(S_{11}-\Delta S_{22}^*)^*}{|S_{11}|^2-|\Delta|^2},\qquad R_S = \left|\frac{S_{12}S_{21}}{|S_{11}|^2-|\Delta|^2}\right|}
$$

The **output** stability circle lives in the $\Gamma_L$ plane but marks where the **input** goes unstable, and vice versa. The name is "where you choose", not "where it fails".

```tikz title="Which side is stable. The centre of the chart (a 50 Ω termination) gives |Γ_in| = |S11|, so its verdict decides the side. After Pozar Fig. 12.5 and binder pp. 179–180."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \begin{scope}[scale=1.5]
    \begin{scope}\clip (0,0) circle (1); \fill[red!25] (0.95,0.55) circle (0.6); \end{scope}
    \draw[thick] (0,0) circle (1); \draw[dashed,red] (0.95,0.55) circle (0.6);
    \fill (0,0) circle (0.03); \node[below,font=\scriptsize] at (0,0) {$\Gamma_L=0$};
    \node[font=\scriptsize,align=center] at (-0.3,0.45) {stable};
    \node[font=\scriptsize,red] at (0.68,0.3) {unst.};
    \node[font=\scriptsize,align=center] at (0,-1.4) {(a) $|S_{11}|<1$: centre stable,\\inside of circle unstable};
  \end{scope}
  \begin{scope}[xshift=5.2cm,scale=1.5]
    \fill[red!25] (0,0) circle (1);
    \begin{scope}\clip (0,0) circle (1); \fill[green!20] (0.95,0.55) circle (0.6); \end{scope}
    \draw[thick] (0,0) circle (1); \draw[dashed,red] (0.95,0.55) circle (0.6);
    \fill (0,0) circle (0.03); \node[below,font=\scriptsize] at (0,0) {$\Gamma_L=0$};
    \node[font=\scriptsize,red] at (-0.3,0.45) {unstable};
    \node[font=\scriptsize] at (0.68,0.3) {stable};
    \node[font=\scriptsize,align=center] at (0,-1.4) {(b) $|S_{11}|>1$: centre unstable,\\inside of circle stable};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (7.7,0.4) {Test point: $\Gamma_L=0$ gives\\$|\Gamma_{in}|=|S_{11}|$.\\Whichever side holds the\\centre inherits its verdict.\\Input circle: same with $S_{22}$.};
\end{circuitikz}
\end{document}
```

**Which side?** Test the chart centre: with $\Gamma_L=0$, $|\Gamma_{in}| = |S_{11}|$.

1. $|S_{11}|<1$: the centre is stable. If the centre is outside the circle ($|C_L|>R_L$), the outside is stable; if inside, the inside is stable.
2. $|S_{11}|>1$: the centre is unstable, so the region that excludes it is the stable one.
3. Input circle: the same with $|S_{22}|$ and $\Gamma_S=0$.

$$
\boxed{\text{Unconditional (circles miss the chart):}\ \big||C_L|-R_L\big|>1,\ \big||C_S|-R_S\big|>1,\ \text{with } |S_{11}|,|S_{22}|<1}
$$

```tikz title="Pozar Ex. 12.2: a GaN HEMT at 1.9 GHz is potentially unstable. Shaded caps are the terminations that oscillate: Γ_L inside the red cap gives |Γ_in| > 1; Γ_S inside the blue cap gives |Γ_out| > 1. Circle data computed from the S-parameters; after Pozar Fig. 12.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\begin{scope}\clip (0,0) circle (1);\fill[red!20] (-1.0726,1.1773) circle (0.9147);\end{scope}
\begin{scope}\clip (0,0) circle (1);\fill[blue!20] (-1.0408,0.3405) circle (0.2052);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[red,thick,dashed] (-1.0726,1.1773) circle (0.9147);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[blue,thick,dashed] (-1.0408,0.3405) circle (0.2052);\end{scope}
\node[red,font=\scriptsize,align=left,anchor=west] at (0.45,1.12) {output stability circle ($\Gamma_L$ plane)\\$C_L=1.59\angle132^\circ$, $R_L=0.915$};
\node[blue,font=\scriptsize,align=right,anchor=east] at (-1.05,-0.35) {input stability circle\\($\Gamma_S$ plane)\\$C_S=1.09\angle162^\circ$\\$R_S=0.205$};
\node[font=\scriptsize,align=center] at (0.25,-0.45) {centre stable\\($|S_{11}|,|S_{22}|<1$)};
\node[red,font=\scriptsize] at (-0.47,0.6) {$|\Gamma_{in}|>1$};
\node[blue,font=\scriptsize,anchor=east] at (-1.3,0.45) {$|\Gamma_{out}|>1$};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: why $|\Gamma_{in}|=1$ is a circle in the $\Gamma_L$ plane
> Set $|\Gamma_{in}|=1$: $|S_{11}(1-S_{22}\Gamma_L)+S_{12}S_{21}\Gamma_L| = |1-S_{22}\Gamma_L|$, i.e. $|S_{11}-\Delta\Gamma_L| = |1-S_{22}\Gamma_L|$. Square, collect $|\Gamma_L|^2$ terms, divide by $|S_{22}|^2-|\Delta|^2$, and complete the square:
> $$\left|\Gamma_L-\frac{(S_{22}-\Delta S_{11}^*)^*}{|S_{22}|^2-|\Delta|^2}\right| = \left|\frac{S_{12}S_{21}}{|S_{22}|^2-|\Delta|^2}\right|$$
> which is $|\Gamma_L-C_L| = R_L$. Underneath: $\Gamma_{in}(\Gamma_L)$ is a bilinear (Möbius) map, and Möbius maps send circles to circles, so the unit circle $|\Gamma_{in}|=1$ pulls back to a circle. Swap $1\leftrightarrow2$ for the input circle.

> [!example] Pozar Ex. 12.2: GaN HEMT, 1.9 GHz
> $S_{11}=0.869\angle-159^\circ$, $S_{12}=0.031\angle-9^\circ$, $S_{21}=4.250\angle61^\circ$, $S_{22}=0.507\angle-117^\circ$.
> 1. $|\Delta| = 0.336<1$ but $K = 0.383<1$: potentially unstable. $\mu = 0.678$ agrees.
> 2. $C_L = 1.59\angle132^\circ$, $R_L = 0.915$; $C_S = 1.09\angle162^\circ$, $R_S = 0.205$.
> 3. $|S_{11}|,|S_{22}|<1$ and the centre lies outside both circles, so the insides (the shaded caps near the upper-left edge) are unstable.
>
> More: [[Exam Prep - Problems through Stability#12.4 📝PS4 Q1 ★ K–Δ test + stability circles|12.4]] (SiGe HBT, both circles cut the chart), [[Exam Prep - Problems through Stability#Stability–Cascading P1 ★ (professor's worked set) Potentially unstable stage + conjugate LC match|Stability–Cascading P1]] ($|S_{22}|>1$: unstable output with a 50 Ω source, stable with the designed source).

### Rollett Stability Factor

$$
\boxed{K = \frac{1-|S_{11}|^2-|S_{22}|^2+|\Delta|^2}{2|S_{12}S_{21}|} > 1\quad\text{and}\quad|\Delta| = |S_{11}S_{22}-S_{12}S_{21}|<1}
$$

$$
\boxed{\mu = \frac{1-|S_{11}|^2}{|S_{22}-\Delta S_{11}^*|+|S_{12}S_{21}|}>1,\qquad \mu' = \frac{1-|S_{22}|^2}{|S_{11}-\Delta S_{22}^*|+|S_{12}S_{21}|}>1}
$$

- **K-Δ test:** both conditions are necessary and sufficient for unconditional stability. Equivalent auxiliary forms: $B_1 = 1+|S_{11}|^2-|S_{22}|^2-|\Delta|^2>0$, or $1-|S_{ii}|^2>|S_{12}S_{21}|$ (binder p. 181–182).
- **$K>1$ alone is not enough.** [[Exam Prep - Problems through Stability#12.6 ★ μ‑test ranking|Exam Prep 12.6]] device B has $K = 1.02$ but $|\Delta| = 1.37$: unstable.
- **μ test:** one number, necessary and sufficient, and **larger μ means more stable**, so it ranks devices (K-Δ cannot). μ′ is the same test with the ports swapped; either one alone suffices.
- **Unilateral:** $K\to\infty$; stability reduces to $|S_{11}|<1$, $|S_{22}|<1$ ([[Exam Prep - Problems through Stability#12.7 📝PS4 Q2 ★ μ for a unilateral device|Exam Prep 12.7]] shows μ reduces to $1/|S_{22}|$).
- **Stability margin in practice:** $K$ and μ a little above 1 at the design frequency are not a margin. Check them over the whole band where $|S_{21}|>1$, and keep $\Gamma_S$, $\Gamma_L$ physically away from the circles so tolerances and tuning cannot push them in (binder p. 226).

> [!note]- Derivation: the μ test and K from it (Pozar §12.2)
> Unconditional stability means $|\Gamma_{out}|<1$ for every $|\Gamma_S|\le1$. Write $\Gamma_{out} = \frac{S_{22}-\Delta\Gamma_S}{1-S_{11}\Gamma_S}$, a Möbius map. It sends the unit circle $\Gamma_S = e^{j\phi}$ to a circle in the $\Gamma_{out}$ plane with
> $$C = \frac{S_{22}-\Delta S_{11}^*}{1-|S_{11}|^2},\qquad R = \frac{|S_{12}S_{21}|}{1-|S_{11}|^2}$$
> (solve for $e^{j\phi}$, take magnitudes, complete the square). The whole disc maps inside the unit circle iff $|C|+R<1$, i.e. $|S_{22}-\Delta S_{11}^*|+|S_{12}S_{21}|<1-|S_{11}|^2$: that is μ > 1.
> **K from μ:** square both sides and use the identity $|S_{22}-\Delta S_{11}^*|^2 = |S_{12}S_{21}|^2+(1-|S_{11}|^2)(|S_{22}|^2-|\Delta|^2)$. After cancelling, $|S_{22}|^2-|\Delta|^2<1-|S_{11}|^2-2|S_{12}S_{21}|$, which is $K>1$. Squaring threw away the sign of $1-|S_{11}|^2-|S_{12}S_{21}|$; requiring it positive (and the mirror at port 2), adding, and using the triangle inequality on $\Delta$ gives $|\Delta|<1$. That is why K needs its auxiliary condition and μ does not.
> **Link to matching:** the discriminant of the conjugate-match quadratic is $B_1^2-4|C_1|^2 = 4|S_{12}S_{21}|^2(K^2-1)$ (proved in [[Exam Prep - Problems through Stability|Exam Prep]] Prob. 12.8), so a simultaneous conjugate match exists only for $|K|>1$.

### Stabilising a Device

```tikz title="Resistive loading (binder 800 MHz example, pp. 183–185). A series R at the input forces the device to see r ≥ R/Z0, so Γ_S is confined to the disc of the r = 0.188 circle, which just clears the unstable cap. A shunt R at the output does the same with a g circle. Circle data recomputed; after binder Fig. 3.3.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\begin{scope}\clip (0,0) circle (1);\fill[blue!20] (-0.9388,1.5270) circle (1.0381);\end{scope}
\begin{scope}\clip (0,0) circle (1);\fill[red!20] (0.8795,0.9632) circle (0.4533);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[blue,thick,dashed] (-0.9388,1.5270) circle (1.0381);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[red,thick,dashed] (0.8795,0.9632) circle (0.4533);\end{scope}
\draw[blue!70!black,very thick] (0.1582,0) circle (0.8418);
\draw[red!70!black,very thick] (-0.0880,0) circle (0.9120);
\node[blue,font=\scriptsize,align=right,anchor=east] at (-0.62,1.0) {input circle\\$1.79\angle122^\circ$, $1.04$\\($\Gamma_S$: $|\Gamma_{out}|>1$)};
\node[red,font=\scriptsize,align=left,anchor=west] at (1.05,0.3) {output circle\\$1.30\angle48^\circ$, $0.45$\\($\Gamma_L$: $|\Gamma_{in}|>1$)};
\node[blue!70!black,font=\scriptsize,align=center,fill=white,fill opacity=0.8,text opacity=1] at (0.45,-0.55) {$r=0.188$ circle:\\series $9.4\ \Omega$ at input};
\node[red!70!black,font=\scriptsize,align=center,fill=white,fill opacity=0.8,text opacity=1] at (-0.45,-0.25) {$g=0.0965$:\\shunt $518\ \Omega$\\at output};
\end{scope}

  \begin{scope}[xshift=5.6cm,yshift=1.6cm]
    \draw (0,0) node[left,font=\scriptsize]{in} to[R,l=$R_s$] (1.6,0) node[npn,anchor=B](Q1){};
    \draw (Q1.E) node[ground]{};
    \draw (Q1.C) -- ++(0,0.2) node[above,font=\scriptsize]{out};
    \node[font=\scriptsize,align=left,anchor=west] at (2.6,0) {series $R$ at input:\\device sees $r\ge R/Z_0$};
    \draw (0,-2.6) node[left,font=\scriptsize]{in} -- (1.6,-2.6) node[npn,anchor=B](Q2){};
    \draw (Q2.E) node[ground]{};
    \draw (Q2.C) -- ++(0,0.2) -- ++(0.9,0) node[right,font=\scriptsize]{out};
    \draw (Q2.C) ++(0,0.2) ++(0.6,0) to[R,l=$R_p$] ++(0,-1.3) node[ground]{};
    \node[font=\scriptsize,align=left,anchor=west] at (3.2,-2.9) {shunt $R$ at output:\\device sees $g\ge Z_0/R$};
    \node[font=\scriptsize,align=left,anchor=west] at (-0.6,-5.0) {Each confines $\Gamma$ to the disc of one\\$r$ (or $g$) circle; pick the smallest\\loading whose circle just clears\\the unstable cap. (The chart overlays\\the $\Gamma_S$ and $\Gamma_L$ planes.)};
  \end{scope}
\end{circuitikz}
\end{document}
```

Three ways, in the binder's order of preference for narrowband work:

1. **Choose $\Gamma_S$, $\Gamma_L$ inside the stable regions** (narrowband amps): no added parts, no added noise. Then check out of band in CAD.
2. **Resistive loading** (series or shunt R at the input or output): it moves the circles off the chart at the cost of gain, noise (at the input) and power. Absorb the resistor into the device's S-matrix (convert to ABCD, multiply, convert back) and recompute $K$.
3. **Negative feedback:** it can flatten gain and in principle neutralise $S_{12}$. It is rarely done for narrowband stages, but it is the standard broadband method.

Loading and feedback are both popular for broadband amplifiers, where you cannot pick a stable $\Gamma$ at every frequency.

**Procedure: minimum stabilising resistor**

1. Compute both stability circles and find which cap of the chart is unstable.
2. A series $R$ at a port confines $\Gamma$ to the inside of the $r = R/Z_0$ circle (centre $\frac{r}{1+r}$, radius $\frac{1}{1+r}$); a shunt $R$ to the $g = Z_0/R$ circle (centre $-\frac{g}{1+g}$, radius $\frac{1}{1+g}$).
3. Choose the smallest loading whose circle is externally tangent to the stability circle: solve $|C-c| = R_{stab}+\rho$.
4. Load the port nearest the problem. Loading the input adds noise, so for an LNA load the output.
5. Absorb the resistor, recompute $K$, μ, and check the whole band.

> [!example] Binder 800 MHz BJT (pp. 183–185): minimum loading
> $S_{11}=0.65\angle-95^\circ$, $S_{12}=0.035\angle40^\circ$, $S_{21}=5\angle115^\circ$, $S_{22}=0.8\angle-35^\circ$: $K=0.547$, $\Delta = 0.504\angle249.6^\circ$, potentially unstable. $C_S = 1.79\angle122^\circ$, $R_S = 1.04$; $C_L = 1.30\angle48^\circ$, $R_L = 0.45$.
>
> | Port | Series R | Shunt R |
> |---|---|---|
> | Input | **9.4 Ω** (binder chart: 9 Ω) | 67 Ω (binder chart: 71.5 Ω) |
> | Output | 28 Ω (binder: 29 Ω) | **518 Ω** (binder: 500 Ω) |
>
> Tangency values are computed (Exam Prep); the binder's are read off its Smith chart. Absorbing a series 10 Ω at the input gives $K = 1.03$ and $|S_{21}|^2$ 13.1 dB (from 14.0 dB): about 1 dB of gain buys unconditional stability.
>
> Drills: [[Exam Prep - Problems through Stability#PS4 Q3 ★ Stability circles + minimum series gate resistor|PS4 Q3]] (minimum series gate resistor ≈ 2.8 Ω), [[Exam Prep - Problems through Stability#Stability–Cascading P2 ★ (professor's worked set) Shunt resistor on the output|Stability–Cascading P2]] (100 Ω shunt at the output: $K$ from −0.20 to 2.72, $|S_{21}|^2$ from 7.96 to 4.29 dB), [[Exam Prep - Problems through Stability#PS4 Q4 ★ Source capacitor → deliberately unstable (oscillator idea)|PS4 Q4]] (the reverse: a source capacitor makes the device deliberately unstable, the start of an oscillator, see [[Mixers and Microwave Oscillators]]).

## Level 2: Unilateral Design

### Unilateral Figure of Merit

$$
\boxed{U = \frac{|S_{12}||S_{21}||S_{11}||S_{22}|}{(1-|S_{11}|^2)(1-|S_{22}|^2)},\qquad \frac{1}{(1+U)^2}<\frac{G_T}{G_{TU}}<\frac{1}{(1-U)^2}}
$$

- Bounds the error in $G_T$ from setting $S_{12}=0$, at the maximum-gain terminations ($\Gamma_S = S_{11}^*$, $\Gamma_L = S_{22}^*$) where it is largest.
- **Rule:** an error of a few tenths of a dB or less justifies unilateral design (Pozar).
- Pozar Ex. 12.5: $U = 0.059$ → $-0.50 < G_T-G_{TU} < 0.53$ dB, fine. Binder 6 GHz FET: $U = 0.1085$ → about ±1 dB, use bilateral design. [[Exam Prep - Problems through Stability#12.13 ★ Unilateral figure of merit|Exam Prep 12.13]]: $U = 0.391$, −2.9 to +4.3 dB, far too large.

> [!warning] Not Mason's $U$
> This $U$ is an error bound you want **small**. Mason's unilateral gain $U$ (the one that defines $f_{max}$) is a **gain** you want large. Same letter, unrelated quantities; see [[Active RF Devices#f_max and Mason's Unilateral Gain U]].

> [!note]- Derivation: where the bound comes from (binder p. 199)
> Exactly, $\frac{G_T}{G_{TU}} = \frac{1}{|1-X|^2}$ with $X = \frac{S_{12}S_{21}\Gamma_S\Gamma_L}{(1-S_{11}\Gamma_S)(1-S_{22}\Gamma_L)}$, so $\frac{1}{(1+|X|)^2}<\frac{G_T}{G_{TU}}<\frac{1}{(1-|X|)^2}$. At $\Gamma_S=S_{11}^*$, $\Gamma_L=S_{22}^*$, $|X| = U$.

### Maximum Unilateral Gain

$$
\boxed{\Gamma_S = S_{11}^*,\ \Gamma_L = S_{22}^*:\qquad G_{TU,max} = \frac{1}{1-|S_{11}|^2}\,|S_{21}|^2\,\frac{1}{1-|S_{22}|^2}}
$$

Each port is matched independently. If $|S_{22}|$ is small, $G_{L,max}\approx1$ and the output match can be skipped (binder 800 MHz example: $G_{L,max} = 0.19$ dB). Drill: [[Exam Prep - Problems through Stability#12.11 ★ Max G_TU (unilateral design)|Exam Prep 12.11]].

### Constant-Gain Circles

$$
\boxed{g_i = \frac{G_i}{G_{i,max}} = G_i(1-|S_{ii}|^2),\quad C_i = \frac{g_iS_{ii}^*}{1-(1-g_i)|S_{ii}|^2},\quad R_i = \frac{\sqrt{1-g_i}\,(1-|S_{ii}|^2)}{1-(1-g_i)|S_{ii}|^2}}
$$

($i = S$ with $S_{11}$, or $i = L$ with $S_{22}$.)

- Centres lie on the line from the origin to $S_{ii}^*$; at $g_i = 1$ the circle shrinks to the point $S_{ii}^*$.
- **The 0 dB circle ($G_i=1$) passes through the chart centre**, since $\Gamma_i = 0$ means no matching ([[Exam Prep - Problems through Stability#12.14 0 dB circle passes through the centre|Exam Prep 12.14]]). Inside it the network adds gain; outside it loses.
- **Pick the point on the circle closest to the chart centre**: least mismatch, widest bandwidth.

```tikz title="Pozar Ex. 12.4: unilateral gain circles at 4 GHz. G_S = 2 dB and G_L = 1 dB give 11 dB total; the chosen points (black) are the ones closest to the centre, on the lines to S11* and S22*. Circle data computed; after Pozar Fig. 12.8a."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.6]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\draw[blue,thick] (-0.3525,0.6106) circle (0.1680);
\node[blue,font=\scriptsize,anchor=west,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.1947,0.6681) {3 dB};
\draw[blue,thick] (-0.3142,0.5442) circle (0.2927);
\node[blue,font=\scriptsize,anchor=west,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.0314,0.4685) {2 dB};
\draw[gray,dashed] (0,0) -- (-0.3750,0.6495);
\fill[blue] (-0.3750,0.6495) circle (0.022);\node[above left=2pt,font=\scriptsize,text=blue,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.3750,0.6495) {$S_{11}^*$ (3.6 dB)};
\fill[black] (-0.1650,0.2858) circle (0.022);\node[below=2pt,font=\scriptsize,text=black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.1650,0.2858) {$\Gamma_S=0.33\angle120^\circ$};
\node[font=\scriptsize] at (0,-1.18) {$\Gamma_S$ plane: $G_S$ circles};
\end{scope}
\begin{scope}[xshift=5.8cm,scale=2.6]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\draw[red,thick] (0.1778,0.4884) circle (0.3033);
\node[red,font=\scriptsize,anchor=east,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.1209,0.5411) {1 dB};
\draw[red,thick] (0.1509,0.4146) circle (0.4412);
\node[red,font=\scriptsize,anchor=west,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.5770,0.3004) {0 dB};
\draw[gray,dashed] (0,0) -- (0.2052,0.5638);
\fill[red] (0.2052,0.5638) circle (0.022);\node[above left=2pt,font=\scriptsize,text=red,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.2052,0.5638) {$S_{22}^*$ (1.9 dB)};
\fill[black] (0.0752,0.2067) circle (0.022);\node[below=2pt,font=\scriptsize,text=black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.0752,0.2067) {$\Gamma_L=0.22\angle70^\circ$};
\node[font=\scriptsize] at (0,-1.18) {$\Gamma_L$ plane: $G_L$ circles};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: why constant $G_S$ is a circle
> $g_S|1-S_{11}\Gamma_S|^2 = (1-|\Gamma_S|^2)(1-|S_{11}|^2)$. Expand, collect $|\Gamma_S|^2$ terms (coefficient $1-(1-g_S)|S_{11}|^2$), divide, and add $g_S^2|S_{11}|^2/[1-(1-g_S)|S_{11}|^2]^2$ to complete the square. The result is $|\Gamma_S-C_S| = R_S$ with the boxed centre and radius (Pozar Eqs. 12.49–12.51).
> **Potentially unstable unilateral port** ($|S_{ii}|>1$, binder p. 197–198): $G_i\to\infty$ at $\Gamma_i = 1/S_{ii}$, where the termination's resistance exactly cancels the device's negative resistance. $g_i$ can then be negative; the same circle formulas hold with centres on the line to $1/S_{ii}$, and the termination must satisfy $\mathrm{Re}\,Z_S>|\mathrm{Re}\,Z_{in}|$.

**Procedure: unilateral design for a specified gain** (Pozar §12.3, binder p. 194)

1. Check stability ($K$, $|\Delta|$ or μ) at every frequency in the data.
2. Check $U$; if the error bound is more than a few tenths of a dB, go bilateral.
3. $G_{TU,max}$ from $G_{S,max}$, $G_0$, $G_{L,max}$; the excess over the spec is what you can trade.
4. Split the excess between the ports (take gain from the port with the larger $G_{i,max}$ for flatness), compute $g_i$, $C_i$, $R_i$.
5. On each circle pick the $\Gamma_i$ closest to the centre (on the line to $S_{ii}^*$).
6. Design each matching network to present that $\Gamma_i$ ([[#Realising the Matching Networks]]).
7. Simulate gain, return loss and stability over the band.

> [!example] Pozar Ex. 12.4: 11 dB at 4 GHz (unilateral)
> $S_{11}=0.75\angle-120^\circ$, $S_{21}=2.5\angle80^\circ$, $S_{22}=0.6\angle-70^\circ$, $S_{12}=0$ (unconditionally stable at 3, 4, 5 GHz).
> 1. $G_{S,max} = 2.29 = 3.6$ dB, $G_0 = 6.25 = 8.0$ dB, $G_{L,max} = 1.56 = 1.9$ dB → $G_{TU,max} = 13.5$ dB, 2.5 dB more than needed.
> 2. Circles: $G_S = 3$ dB: $g_S = 0.875$, $C_S = 0.706\angle120^\circ$, $R_S = 0.166$. $G_S = 2$ dB: $g_S = 0.691$, $C_S = 0.627\angle120^\circ$, $R_S = 0.294$. $G_L = 1$ dB: $g_L = 0.806$, $C_L = 0.520\angle70^\circ$, $R_L = 0.303$. $G_L = 0$ dB: $g_L = 0.640$, $C_L = 0.440\angle70^\circ$, $R_L = 0.440$.
> 3. Choose $G_S = 2$ dB, $G_L = 1$ dB (2 + 8 + 1 = 11 dB): $\Gamma_S = 0.33\angle120^\circ$, $\Gamma_L = 0.22\angle70^\circ$.
> 4. Open shunt stubs: input stub 0.100λ, line 0.179λ; output line 0.045λ, stub 0.432λ.
> 5. Result: 11 dB at 4 GHz, **±1 dB over about 25%** (against 2.5% for the max-gain design of Ex. 12.3), but input return loss only about 5 dB. The deliberate mismatch that buys flatness also spoils the match; [[Power Dividers and Couplers#Balanced Amplifier|a balanced pair]] of these amplifiers fixes it (Pozar Ex. 12.7).
>
> Also: binder 800 MHz ($G_S = 2$ dB circle, $\Gamma_S = 0.351\angle-175^\circ$, output match skipped, $G_{TU} = 15.16$ dB) in [[Exam Prep - Problems through Stability|Exam Prep §6b]]; [[Exam Prep - Problems through Stability#12.12 ★ Specified gain with unilateral gain circles|Exam Prep 12.12]] (10 dB at 6 GHz with stub matching).

## Level 3: Bilateral Design

### Simultaneous Conjugate Match

$$
\boxed{\Gamma_{MS} = \frac{B_1-\sqrt{B_1^2-4|C_1|^2}}{2C_1},\qquad \Gamma_{ML} = \frac{B_2-\sqrt{B_2^2-4|C_2|^2}}{2C_2}}
$$

$$
B_1 = 1+|S_{11}|^2-|S_{22}|^2-|\Delta|^2,\quad B_2 = 1+|S_{22}|^2-|S_{11}|^2-|\Delta|^2,\quad C_1 = S_{11}-\Delta S_{22}^*,\quad C_2 = S_{22}-\Delta S_{11}^*
$$

$$
\boxed{G_{T,max} = \frac{|S_{21}|}{|S_{12}|}\left(K-\sqrt{K^2-1}\right)\ (K>1),\qquad G_{msg} = \frac{|S_{21}|}{|S_{12}|}\ (K=1)}
$$

- With $S_{12}\ne0$, the input match changes $\Gamma_{out}$ and vice versa, so both must satisfy $\Gamma_S = \Gamma_{in}^*$ and $\Gamma_L = \Gamma_{out}^*$ **at once**: two equations, two unknowns.
- Use the **minus** root for an unconditionally stable device (it gives $|\Gamma|<1$).
- A solution with $|\Gamma_{MS}|,|\Gamma_{ML}|<1$ exists only for $K>1$ (and $|\Delta|<1$). For $K<1$ there is **no** simultaneous match; design with $G_P$ circles instead.
- **MSG** is $G_{T,max}$ pushed to $K=1$, the gain a potentially unstable device could reach if stabilised (by loading or feedback) just to the edge. It is the quick figure for comparing devices. When $K>1$ the achievable figure is $G_{T,max}$, also called the **maximum available gain** (MAG; binder p. 248: $G_{A,max} = \text{MAG} = G_{T,max}$).
- Unilateral limit: $\Gamma_{MS}\to S_{11}^*$, $\Gamma_{ML}\to S_{22}^*$.

```tikz title="Pozar Ex. 12.3 at 4 GHz: the simultaneous-match points sit near the chart edge (high-Q, narrowband), close to but not equal to S11* and S22* because S12 ≠ 0. Dashed: the 3 GHz stability circles, where the device is only conditionally stable (K = 0.77). Recomputed from Pozar's data."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\begin{scope}\clip (0,0) circle (1);\fill[red!15] (0.7751,1.0598) circle (0.3770);\end{scope}
\begin{scope}\clip (0,0) circle (1);\fill[blue!15] (-0.1958,1.2271) circle (0.2959);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[red,dashed] (0.7751,1.0598) circle (0.3770);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[blue,dashed] (-0.1958,1.2271) circle (0.2959);\end{scope}
\fill[blue] (-0.4749,0.7313) circle (0.022);\node[left,font=\scriptsize,text=blue,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.4749,0.7313) {$\Gamma_S=0.872\angle123^\circ$};
\fill[red] (0.4247,0.7662) circle (0.022);\node[right,font=\scriptsize,text=red,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.4247,0.7662) {$\Gamma_L=0.876\angle61^\circ$};
\fill[blue!60!black] (-0.3156,0.6471) circle (0.022);\node[below,font=\scriptsize,text=blue!60!black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.3156,0.6471) {$S_{11}^*$};
\fill[red!60!black] (0.4291,0.5906) circle (0.022);\node[below,font=\scriptsize,text=red!60!black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.4291,0.5906) {$S_{22}^*$};
\node[font=\scriptsize,align=center] at (0,-0.5) {at 4 GHz: $K=1.19$, $|\Delta|=0.49$};
\node[font=\scriptsize,align=left,red,anchor=west] at (1.25,1.32) {3 GHz output\\stability circle};
\node[font=\scriptsize,align=right,blue,anchor=east] at (-0.6,1.3) {3 GHz input\\stability circle};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: the conjugate-match quadratic
> The two conditions are $\Gamma_S^* = \frac{S_{11}-\Delta\Gamma_L}{1-S_{22}\Gamma_L}$ and $\Gamma_L^* = \frac{S_{22}-\Delta\Gamma_S}{1-S_{11}\Gamma_S}$ (the $\Gamma_{in}$, $\Gamma_{out}$ formulas over a common denominator). Conjugate the first, substitute the second for $\Gamma_L^*$, clear denominators and use $\Delta\Delta^* = |\Delta|^2$ to reach
> $$C_1\Gamma_S^2-B_1\Gamma_S+C_1^* = 0$$
> (Pozar Eq. 12.39). Its discriminant is $B_1^2-4|C_1|^2 = 4|S_{12}S_{21}|^2(K^2-1)$, so real-magnitude solutions need $K>1$. Substituting $\Gamma_{MS}$, $\Gamma_{ML}$ into $G_T$ and simplifying gives $|S_{21}/S_{12}|(K-\sqrt{K^2-1})$, which falls monotonically from its $K=1$ value: the most stable device is not the highest-gain one.

> [!example] Pozar Ex. 12.3: maximum gain at 4 GHz (GaAs MESFET)
> | $f$ (GHz) | $S_{11}$ | $S_{12}$ | $S_{21}$ | $S_{22}$ | $K$ | $\lvert\Delta\rvert$ |
> |---|---|---|---|---|---|---|
> | 3 | 0.80∠−89° | 0.03∠56° | 2.86∠99° | 0.76∠−41° | 0.77 | 0.592 |
> | 4 | 0.72∠−116° | 0.03∠57° | 2.60∠76° | 0.73∠−54° | 1.19 | 0.487 |
> | 5 | 0.66∠−142° | 0.03∠62° | 2.39∠54° | 0.72∠−68° | 1.53 | 0.418 |
>
> 1. Unconditionally stable at 4 and 5 GHz, only conditionally at 3 GHz: design at 4, check 3 later.
> 2. $\Gamma_S = \Gamma_{MS} = 0.872\angle123^\circ$, $\Gamma_L = \Gamma_{ML} = 0.876\angle61^\circ$.
> 3. $G_S = 6.20$ dB, $G_0 = 8.30$ dB, $G_L = 2.22$ dB → $G_{T,max} = 16.7$ dB (the closed form gives the same; MSG is 19.4 dB).
> 4. Open shunt stub + series line: input line 0.120λ, stub 0.206λ; output line 0.206λ, stub 0.206λ.
> 5. Result: 16.7 dB with very good return loss at 4 GHz, but the **1 dB bandwidth is only about 2.5%**. Check that the networks present stable $\Gamma$'s at 3 GHz (CAD showed no instability from 3 to 5 GHz).
>
> Also: binder 6 GHz GaAs FET ($K = 1.504$, $\Gamma_{MS} = 0.76\angle177^\circ$, $\Gamma_{ML} = 0.71\angle103^\circ$, $G_{T,max} = 11.3$ dB; stubs 0.185λ/0.0615λ in, 0.176λ/0.169λ out) and [[Exam Prep - Problems through Stability#12.9 ★ Design for maximum gain (bilateral, Table 11.7 @ 8 GHz)|Exam Prep 12.9]] (Table 11.7 at 8 GHz: $K = 1.026$, $G_{T,max} = 10.6$ dB).

### Operating and Available Gain Circles

Bilateral $G_T$ circles need iteration ($\Gamma_{in}$ depends on the $\Gamma_L$ you just picked, binder pp. 208–212). Circles of $G_P$ (a function of $\Gamma_L$ only) or $G_A$ (of $\Gamma_S$ only) avoid that, and they work for potentially unstable devices too.

$$
\boxed{g_p = \frac{G_P}{|S_{21}|^2},\quad C_P = \frac{g_pC_2^*}{1+g_p(|S_{22}|^2-|\Delta|^2)},\quad R_P = \frac{\sqrt{1-2K|S_{12}S_{21}|g_p+|S_{12}S_{21}|^2g_p^2}}{\left|1+g_p(|S_{22}|^2-|\Delta|^2)\right|}}
$$

$$
\boxed{g_a = \frac{G_A}{|S_{21}|^2},\quad C_A = \frac{g_aC_1^*}{1+g_a(|S_{11}|^2-|\Delta|^2)},\quad R_A = \frac{\sqrt{1-2K|S_{12}S_{21}|g_a+|S_{12}S_{21}|^2g_a^2}}{\left|1+g_a(|S_{11}|^2-|\Delta|^2)\right|}}
$$

- $G_P$ circles live in the $\Gamma_L$ plane, centres on the line to $C_2^*$. Pick $\Gamma_L$, then set $\Gamma_S = \Gamma_{in}^*$ so that $G_T = G_P$ (input VSWR = 1).
- $G_A$ circles live in the $\Gamma_S$ plane, centres on the line to $C_1^*$. Pick $\Gamma_S$, then set $\Gamma_L = \Gamma_{out}^*$ so that $G_T = G_A$ (output VSWR = 1). This is the LNA's circle.
- $R_P = 0$ at $g_{p,max} = \frac{K-\sqrt{K^2-1}}{|S_{12}S_{21}|}$, i.e. $G_{P,max} = G_{T,max}$, at $\Gamma_L = \Gamma_{ML}$: the conjugate match is the top of this family.

**Procedure: potentially unstable bilateral design with $G_P$ circles** (binder p. 225)

1. Check MSG ≥ target gain.
2. Draw the $G_P$ circle for the target and the **output** stability circle ($\Gamma_L$ plane).
3. Choose $\Gamma_L$ on the $G_P$ circle, in the stable region and away from the stability circle.
4. Compute $\Gamma_S = \Gamma_{in}^*$ and draw the **input** stability circle.
5. If $\Gamma_S$ is unstable or too close: pick another $\Gamma_L$, a lower $G_P$, or an arbitrary stable $\Gamma_S$ (accepting $G_T<G_P$).

```tikz title="Binder 8 GHz GaAs FET (pp. 220–222), potentially unstable. The 10 dB G_P circle passes through the output stability circle's unstable cap; Γ_L = 0.1∠97° is chosen far from it, and Γ_S = Γ_in* lands well outside the input stability circle. Circles recomputed from the S-matrix."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\begin{scope}\clip (0,0) circle (1);\fill[red!20] (-0.3214,1.1646) circle (0.3555);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[red,thick,dashed] (-0.3214,1.1646) circle (0.3555);\end{scope}
\begin{scope}\clip (0,0) circle (1);\fill[blue!15] (-1.7533,-0.5960) circle (1.1590);\end{scope}
\begin{scope}\clip (-1.6,-1.6) rectangle (1.6,1.6);\draw[blue,thick,dashed] (-1.7533,-0.5960) circle (1.1590);\end{scope}
\draw[green!50!black,thick] (-0.1480,0.5525) circle (0.471);
\fill[black] (-0.0122,0.0993) circle (0.022);\node[right,font=\scriptsize,text=black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.0122,0.0993) {$\Gamma_L=0.1\angle97^\circ$};
\fill[blue] (-0.5158,-0.0144) circle (0.022);\node[below right,font=\scriptsize,text=blue,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.5158,-0.0144) {$\Gamma_S=\Gamma_{in}^*$};
\node[green!40!black,font=\scriptsize,fill=white,fill opacity=0.8,text opacity=1] at (0.55,0.72) {$G_P=10$ dB};
\node[red,font=\scriptsize,align=left,anchor=west] at (0.25,1.3) {output stability circle:\\inside unstable};
\node[blue,font=\scriptsize,align=right,anchor=east] at (-1.05,-0.75) {input stability\\circle: inside\\unstable};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!example] Binder 8 GHz GaAs FET, $G_P = 10$ dB
> $S_{11} = 0.5\angle-180^\circ$, $S_{12} = 0.08\angle-30^\circ$, $S_{21} = 2.5\angle70^\circ$, $S_{22} = 0.8\angle-100^\circ$.
> 1. $K = 0.469$, $\Delta = 0.278\angle107.5^\circ$: potentially unstable. MSG $= 2.5/0.08 = 14.9$ dB ≥ 10 dB.
> 2. $g_p = 10/6.25 = 1.6$ → $C_P = 0.572\angle105^\circ$, $R_P = 0.471$. Output circle $C_L = 1.21\angle105^\circ$, $R_L = 0.356$ (inside unstable).
> 3. $\Gamma_L = 0.1\angle97^\circ$ ($Z_L = 47.9+j9.6\ \Omega$), on the circle and far from instability.
> 4. $\Gamma_S = \Gamma_{in}^* = 0.516\angle-178.4^\circ$. Input circle $C_S = 1.85\angle-161^\circ$, $R_S = 1.16$: $\Gamma_S$ is 1.37 from its centre, outside, stable. $G_T = G_P = 10.0$ dB.
>
> > [!warning] The slide's numbers
> > The binder slide quotes $K = 0.4$, $\Delta = 0.223\angle62.12^\circ$, circle angles 97.2° and $C_S = 1.67\angle171^\circ$, $r_s = 1.0$. Those do not follow from its own S-matrix; the values above are recomputed (Exam Prep checked the same). The method and conclusions are unchanged.
>
> Same device family, unconditionally stable case: binder 6 GHz FET with $G_P = 9$ dB → $C_P = 0.508\angle103.9^\circ$, $R_P = 0.431$; $\Gamma_L = 0.36\angle47.5^\circ$ → $\Gamma_S = 0.629\angle175.5^\circ$, output VSWR 4.3. With a $G_A = 9$ dB circle instead: $C_A = 0.561\angle177.3^\circ$, $R_A = 0.389$, $\Gamma_S = 0.172\angle177.3^\circ$, $\Gamma_L = \Gamma_{out}^* = 0.589\angle97.2^\circ$ (Exam Prep §6b).

### Realising the Matching Networks

$$
\boxed{\text{To present }\Gamma\text{ to the device, design a lossless network that matches a load }\Gamma^*\text{ to }Z_0.}
$$

A lossless network that matches $Z_X$ to $Z_0$ presents $Z_X^*$ at its other port when that port's far side is terminated in $Z_0$ ([[Exam Prep - Problems through Stability#12.10 ★ Why "match Γ*" works|Exam Prep 12.10]] proves it from unitarity). So every amplifier match is an ordinary [[Smith Chart and Impedance Matching#L-Network Matching|L-section]] or [[Smith Chart and Impedance Matching#Single-Stub Tuning|single-stub]] problem with the load $\Gamma^*$.

**Procedure** (open shunt stub at the 50 Ω end, series line to the device, Pozar's standard form)

1. Plot $\Gamma$ (what the device must see). The network, viewed from the device, must turn $Z_0$ into $Z(\Gamma)$.
2. Work in admittance. At the 50 Ω end the stub makes $y = 1+jb$, so the point there has $|\Gamma|$ equal to $|\Gamma|$ at the device and lies on the $g = 1$ circle: $b = \pm\frac{2|\Gamma|}{\sqrt{1-|\Gamma|^2}}$. Rotating from $\Gamma$ counter-clockwise (toward the load) to that point gives the line length $d$ ($2\beta d$ is the angle turned).
3. The open stub supplies the $+jb$: length $\ell = \frac{1}{2\pi}\tan^{-1}b$ wavelengths (add $\lambda/2$ if negative). Two solutions ($\pm b$); take the shorter lines.
4. Lumped alternative at low GHz: two reactances, L-section formulas.
5. Verify by cascading the networks with the device S-matrix: the amplifier's $|S_{21}|^2$ must equal the predicted $G_T$.

## Level 4: Low-Noise Amplifier Design

### Noise Circles

The constant-$F$ circles (centre $C_F=\Gamma_{opt}/(N+1)$, radius $R_F$, with $N$ set by $F$, $F_{min}$, $R_N$, $\Gamma_{opt}$) are drawn on the $\Gamma_S$ plane next to the gain circles. What matters for the design:

- $F$ depends only on $\Gamma_S$ (and the device's noise parameters $F_{min}$, $\Gamma_{opt}$, $R_N$), not on $\Gamma_L$.
- $\Gamma_{opt}\ne\Gamma_{MS}$ in general: **minimum noise and maximum gain want different source impedances.**

> [!tip] Remark
> The noise parameters, the $F(\Gamma_S)$ formula, the circle equations ($N$, $C_F$, $R_F$) with their derivation and Pozar Ex. 12.5 are owned by [[RF Noise and Distortion#Noise Circles]]; Friis and why the first stage dominates by [[RF Noise and Distortion#Friis Formula]]; device noise sources by [[Noise]]. This section uses them only to place $\Gamma_S$.

### Gain–Noise Trade-off

```tikz title="Binder Example 2 (AT-41470 BJT, 4 GHz, from Gonzalez Ex. 4.3.2): moving Γ_S along the line from Γ_opt to Γ_MS trades noise for gain and input match. Each point uses Γ_L = Γ_out*, so G_T = G_A and output VSWR = 1. All values recomputed and match the binder table."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.4]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\draw[thick,gray] (-0.3897,-0.2250) -- (-0.6971,-0.4386);
\fill[black] (-0.3897,-0.2250) circle (0.02);
\draw[gray!60,thin] (-0.3897,-0.2250) -- (0.35,-0.150);
\node[anchor=west,font=\scriptsize,text=black] at (0.35,-0.150) {9.76 / 3.00 / 2.69};
\fill[black] (-0.4543,-0.2730) circle (0.02);
\draw[gray!60,thin] (-0.4543,-0.2730) -- (0.35,-0.320);
\node[anchor=west,font=\scriptsize,text=black] at (0.35,-0.320) {10.15 / 3.04 / 2.28};
\fill[red] (-0.5439,-0.3373) circle (0.02);
\draw[gray!60,thin] (-0.5439,-0.3373) -- (0.35,-0.490);
\node[anchor=west,font=\scriptsize,text=red] at (0.35,-0.490) {10.64 / 3.25 / 1.78};
\fill[black] (-0.6276,-0.3921) circle (0.02);
\draw[gray!60,thin] (-0.6276,-0.3921) -- (0.35,-0.660);
\node[anchor=west,font=\scriptsize,text=black] at (0.35,-0.660) {11.00 / 3.71 / 1.35};
\fill[black] (-0.6971,-0.4386) circle (0.02);
\draw[gray!60,thin] (-0.6971,-0.4386) -- (0.35,-0.830);
\node[anchor=west,font=\scriptsize,text=black] at (0.35,-0.830) {11.15 / 4.51 / 1.00};
\node[anchor=west,font=\scriptsize] at (0.35,0.05) {$G_A$ (dB) / $F$ (dB) / VSWR$_{in}$};
\fill[violet] (-0.3897,-0.2250) circle (0.022);\node[above left,font=\scriptsize,text=violet,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.3897,-0.2250) {$\Gamma_{opt}$};
\fill[blue] (-0.6971,-0.4386) circle (0.022);\node[below left,font=\scriptsize,text=blue,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.6971,-0.4386) {$\Gamma_{MS}$};
\end{scope}
\end{circuitikz}
\end{document}
```

- On a straight line from $\Gamma_{opt}$ to $\Gamma_{MS}$, $F$ rises from $F_{min}$ while $G_A$ and the input match improve. Pick the point that just meets the VSWR (or gain) spec.
- **Binder Example 2** (AT-41470, $F_{min} = 3$ dB, $\Gamma_{opt} = 0.45\angle-150^\circ$, $r_n = 0.2$, $K = 1.172$; spec VSWR$_{in}<1.8$): $\Gamma_S = 0.64\angle-148.2^\circ$ gives VSWR 1.78, $F = 3.25$ dB (0.25 dB above $F_{min}$), $G_A = 10.64$ dB (0.51 dB below $G_{A,max} = 11.15$ dB). At $\Gamma_{opt}$ the input VSWR would be 2.69.
- **Binder Example 1** (BJT, 4 GHz, HP AN 967: $K = 1.012$, $F_{min} = 2.5$ dB, $\Gamma_{opt} = 0.475\angle166^\circ$, $R_n = 3.5\ \Omega$): $\Gamma_S = \Gamma_{opt}$ costs gain: $G_A = 11$ dB against $G_{A,max} = 14.7$ dB, input VSWR 4.26. That is the price of $F_{min}$ with a device whose $\Gamma_{opt}$ is far from $\Gamma_{MS} = 0.941\angle-154^\circ$.
- **When the input VSWR is unacceptable,** use a [[Power Dividers and Couplers#Balanced Amplifier|balanced amplifier]]: each half is designed at $\Gamma_{opt}$, the hybrids absorb the reflections, and $F = (F_A+F_B)/2$.

**Procedure: LNA design** (Pozar §12.3, binder pp. 245–256)

1. **Bias for low noise** (datasheet $F_{min}$ vs current) and take S-parameters and noise parameters at that bias.
2. **Stability:** $K$, $|\Delta|$ or μ over the band. Do not stabilise with an input resistor (it adds noise); use output loading or choose stable $\Gamma$'s.
3. **Unilateral?** Compute $U$. If small, use $G_S$ circles; if not, use $G_A$ circles.
4. **Draw the noise circle for the NF spec** and the gain circles on the $\Gamma_S$ plane.
5. **Choose $\Gamma_S$:** the highest-gain circle that touches the noise circle (max gain for the NF), or the point on $\Gamma_{opt}\to\Gamma_{MS}$ that meets the input VSWR.
6. **Choose $\Gamma_L = \Gamma_{out}^*$** (unilateral: $S_{22}^*$): maximum gain for that $\Gamma_S$, output VSWR = 1. $\Gamma_L$ does not affect $F$.
7. **Check stability** of the chosen pair, compute $G_T$, $F$, VSWR$_{in}$.
8. **Design the networks** ([[#Realising the Matching Networks]]) with low-loss elements on the input; verify by cascade.

### Worked LNA Design

Pozar Ex. 12.5, carried end to end: GaAs MESFET biased for minimum noise at 4 GHz, $Z_0 = 50\ \Omega$.

| $S_{11}$ | $S_{12}$ | $S_{21}$ | $S_{22}$ | $F_{min}$ | $\Gamma_{opt}$ | $R_N$ |
|---|---|---|---|---|---|---|
| 0.6∠−60° | 0.05∠26° | 1.9∠81° | 0.5∠−60° | 1.6 dB | 0.62∠100° | 20 Ω |

**Spec:** $F = 2.0$ dB with the maximum gain compatible with it.

1. **Stability.** $K = 2.78$, $|\Delta| = 0.37$: unconditionally stable even with $S_{12}$ kept. (μ = 1.69.)
2. **Unilateral check.** $U = 0.059$ → $0.891 < G_T/G_{TU} < 1.130$, i.e. −0.50 to +0.53 dB. Design unilaterally.
3. **Noise circle, $F = 2.0$ dB:** $C_F = 0.56\angle100^\circ$, $R_F = 0.24$ ($N = 0.0986$; computed in [[RF Noise and Distortion#Noise Circles]]). (Exact dB conversions give $N = 0.102$, $R_F = 0.245$; Pozar rounds $F$ to 1.58.)
4. **Gain circles** ($G_{S,max} = 1/(1-0.36) = 1.94$ dB, centres on the 60° line to $S_{11}^*$):

   | $G_S$ | $g_S$ | $C_S$ | $R_S$ |
   |---|---|---|---|
   | 1.0 dB | 0.805 | 0.52∠60° | 0.300 |
   | 1.5 dB | 0.904 | 0.56∠60° | 0.205 |
   | 1.7 dB | 0.946 | 0.58∠60° | 0.150 |

5. **Choose $\Gamma_S$.** The 1.7 dB circle just touches the 2 dB noise circle; any higher gain gives a worse $F$. $\Gamma_S = 0.53\angle75^\circ$: $F = 1.98$ dB, $G_S = 1.69$ dB (recomputed; a fine search along the noise circle gives 1.71 dB at $0.54\angle74^\circ$).
6. **Choose $\Gamma_L = S_{22}^* = 0.5\angle60^\circ$:** $G_L = 1/(1-0.25) = 1.25$ dB.
7. **Gain.** $G_0 = 1.9^2 = 5.58$ dB → $G_{TU} = 1.7+5.58+1.25 = 8.53$ dB. With the real $S_{12}$ the bilateral $G_T$ is 8.36 dB (Pozar's CAD: 8.36 dB), inside the ±0.5 dB bound.

```tikz title="Pozar Ex. 12.5: the F = 2.0 dB noise circle and three G_S gain circles on the Γ_S plane. The chosen Γ_S is where the 1.7 dB circle touches the noise circle: the most gain this noise figure allows. Circle data computed; after Pozar Fig. 12.9a."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=3.0]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\draw[violet,thick] (-0.0972,0.5515) circle (0.24);
\draw[violet,thin,opacity=0.6] (-0.3228,0.4694) -- (-1.05,0.25);\node[anchor=east,font=\scriptsize,text=violet,inner sep=1pt] at (-1.05,0.25) {$F=2.0$ dB circle};
\draw[blue,thick] (0.2896,0.5015) circle (0.1507);
\draw[blue,thin,opacity=0.6] (0.4262,0.4378) -- (1.08,0.35);\node[anchor=west,font=\scriptsize,text=blue,inner sep=1pt] at (1.08,0.35) {$G_S=1.7$ dB};
\draw[blue,thick] (0.2809,0.4866) circle (0.2054);
\draw[blue,thin,opacity=0.6] (0.4449,0.3630) -- (1.08,0.16999999999999998);\node[anchor=west,font=\scriptsize,text=blue,inner sep=1pt] at (1.08,0.16999999999999998) {$G_S=1.5$ dB};
\draw[blue,thick] (0.2599,0.4501) circle (0.3033);
\draw[blue,thin,opacity=0.6] (0.4589,0.2212) -- (1.08,-0.010000000000000009);\node[anchor=west,font=\scriptsize,text=blue,inner sep=1pt] at (1.08,-0.010000000000000009) {$G_S=1.0$ dB};
\fill[violet] (-0.1077,0.6106) circle (0.018);\draw[violet,thin,opacity=0.6] (-0.1077,0.6106) -- (-1.05,0.95);\node[anchor=east,font=\scriptsize,text=violet,inner sep=1pt] at (-1.05,0.95) {$\Gamma_{opt}$: $F_{min}=1.6$ dB};
\fill[blue] (0.3000,0.5196) circle (0.018);\draw[blue,thin,opacity=0.6] (0.3000,0.5196) -- (1.0,0.95);\node[anchor=west,font=\scriptsize,text=blue,inner sep=1pt] at (1.0,0.95) {$S_{11}^*$: $G_{S,max}=1.94$ dB};
\fill[black] (0.1372,0.5119) circle (0.018);\draw[black,thin,opacity=0.6] (0.1372,0.5119) -- (0.15,-0.45);\node[anchor=north,font=\scriptsize,text=black,inner sep=1pt] at (0.15,-0.45) {chosen $\Gamma_S=0.53\angle75^\circ$: $F=2.0$ dB, $G_S=1.7$ dB};
\end{scope}
\end{circuitikz}
\end{document}
```

8. **Input network** (present $\Gamma_S = 0.53\angle75^\circ$, $z_S = 0.714+j1.017$, $Z_S = 35.7+j50.9\ \Omega$). Match the load $Z_S^* = 35.7-j50.9\ \Omega$ to 50 Ω:
   - **Stubs:** from the device, series 50 Ω line **0.226λ**, then open shunt stub **0.143λ** at the 50 Ω end (Pozar: 0.226λ and 0.144λ).
   - **Lumped at 4 GHz:** shunt $C = 0.50$ pF at the 50 Ω end, series $L = 2.92$ nH to the gate. On the chart: 50 Ω → down the $g=1$ circle with the shunt C to $z = 0.71-j0.45$ → up the $r = 0.71$ circle with the series L to $z_S$.

```tikz title="Input match of the worked LNA on the Smith chart: shunt C moves down the g = 1 circle, series L moves up the constant-r circle to z_S. Computed here."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\begin{scope}\clip (0,0) circle (1);\draw[red!40,thin,dashed] (-0.5,0) circle (0.5);\end{scope}
\draw[->,very thick,red] (0.0000,0.0000) -- (-0.0001,-0.0105) -- (-0.0004,-0.0211) -- (-0.0010,-0.0316) -- (-0.0018,-0.0421) -- (-0.0028,-0.0525) -- (-0.0040,-0.0629) -- (-0.0054,-0.0733) -- (-0.0071,-0.0837) -- (-0.0089,-0.0940) -- (-0.0110,-0.1042) -- (-0.0132,-0.1143) -- (-0.0157,-0.1244) -- (-0.0184,-0.1344) -- (-0.0213,-0.1443) -- (-0.0244,-0.1542) -- (-0.0276,-0.1639) -- (-0.0311,-0.1735) -- (-0.0347,-0.1830) -- (-0.0385,-0.1924) -- (-0.0425,-0.2017) -- (-0.0466,-0.2109) -- (-0.0510,-0.2199) -- (-0.0554,-0.2288) -- (-0.0601,-0.2376) -- (-0.0648,-0.2463) -- (-0.0698,-0.2548) -- (-0.0748,-0.2631) -- (-0.0800,-0.2713) -- (-0.0853,-0.2794) -- (-0.0908,-0.2873);
\draw[->,very thick,blue] (-0.0908,-0.2873) -- (-0.1055,-0.2596) -- (-0.1189,-0.2308) -- (-0.1308,-0.2010) -- (-0.1411,-0.1702) -- (-0.1497,-0.1387) -- (-0.1567,-0.1065) -- (-0.1618,-0.0738) -- (-0.1650,-0.0407) -- (-0.1664,-0.0074) -- (-0.1659,0.0259) -- (-0.1635,0.0590) -- (-0.1592,0.0919) -- (-0.1530,0.1244) -- (-0.1452,0.1562) -- (-0.1356,0.1874) -- (-0.1243,0.2176) -- (-0.1116,0.2469) -- (-0.0975,0.2751) -- (-0.0821,0.3021) -- (-0.0655,0.3280) -- (-0.0479,0.3525) -- (-0.0294,0.3756) -- (-0.0101,0.3974) -- (0.0099,0.4179) -- (0.0304,0.4369) -- (0.0513,0.4545) -- (0.0726,0.4708) -- (0.0941,0.4858) -- (0.1157,0.4995) -- (0.1373,0.5119);
\fill[black] (0.0000,0.0000) circle (0.022);\node[above right,font=\scriptsize,text=black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.0000,0.0000) {50 $\Omega$};
\fill[black] (-0.0908,-0.2873) circle (0.022);\node[below right,font=\scriptsize,text=black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (-0.0908,-0.2873) {$z=0.71-j0.45$};
\fill[black] (0.1373,0.5119) circle (0.022);\node[right,font=\scriptsize,text=black,fill=white,fill opacity=0.8,text opacity=1,inner sep=1pt] at (0.1373,0.5119) {$z_S=0.71+j1.02$};
\node[red,font=\scriptsize,align=center,fill=white,fill opacity=0.8,text opacity=1] at (0.05,-0.6) {shunt $C=0.50$ pF\\(down the $g=1$ circle)};
\node[blue,font=\scriptsize,align=center,fill=white,fill opacity=0.8,text opacity=1] at (-0.35,0.25) {series $L=2.92$ nH\\(up the $r=0.71$ circle)};
\end{scope}
\end{circuitikz}
\end{document}
```

9. **Output network** (present $\Gamma_L = 0.5\angle60^\circ$, $Z_L = 50+j57.7\ \Omega$). Its real part is already 50 Ω, so one series element does it:
   - **Lumped:** series $L = 2.30$ nH ($X = 57.7\ \Omega$) between drain and the 50 Ω load.
   - **Stubs:** series line **0.25λ**, open shunt stub **0.136λ** (Pozar: the same).
10. **Verify** by cascading ABCD matrices of the networks and the device: both versions give $|S_{21}|^2 = 8.36$ dB, input return loss 16.9 dB ($|S_{11}| = 0.14$: the low-noise $\Gamma_S$ is not $\Gamma_{in}^*$, so the input is not perfectly matched) and $|S_{22}| = 0.09$.

```tikz title="The finished LNA two ways: lumped elements at 4 GHz (computed here) and Pozar's open-stub version (Fig. 12.9b). DC bias networks omitted."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \node[font=\scriptsize,anchor=west] at (-0.3,3.1) {(a) lumped, 4 GHz};
  \draw (0,0) to[sV] (0,2) to[R,l=$50\ \Omega$] (2.2,2);
  \draw (0,0) -- (2.2,0) node[ground]{};
  \draw (2.2,2) to[C,l_=$0.50$ pF] (2.2,0);
  \draw (2.2,2) to[L,l=$2.92$ nH] (4.6,2) -- (5.0,2);
  \draw (5.0,2) node[nmos,anchor=G](M){};
  \draw (M.S) node[ground]{};
  \draw (M.D) |- (6.4,2.9) to[L,l=$2.30$ nH] (8.6,2.9) to[R,l=$50\ \Omega$] (8.6,0.6) node[ground]{};
  \draw[->,blue,thick] (4.8,1.6) -- (3.9,1.6); \node[blue,font=\scriptsize] at (4.2,1.25) {$\Gamma_S=0.53\angle75^\circ$};
  \draw[->,red,thick] (6.0,2.55) -- (6.9,2.55); \node[red,font=\scriptsize,anchor=north west] at (5.9,2.45) {$\Gamma_L=0.5\angle60^\circ$};
  \begin{scope}[yshift=-5.4cm]
    \node[font=\scriptsize,anchor=west] at (-0.3,3.9) {(b) open stubs, all lines $Z_0=50\ \Omega$ (Pozar Fig. 12.9b)};
    \draw (0,0) to[sV] (0,2) to[R,l=$50\ \Omega$] (2.2,2);
    \draw (0,0) -- (2.2,0) node[ground]{};
    \draw (2.2,2) -- (2.2,1.5); \draw[fill=white] (1.95,1.5) rectangle (2.45,0.5);
    \node[font=\scriptsize,anchor=west] at (2.5,1.0) {$0.143\lambda$ open};
    \draw (2.2,2) -- (2.8,2); \draw[fill=white] (2.8,1.8) rectangle (4.4,2.2); \node[font=\scriptsize] at (3.6,2.45) {$0.226\lambda$};
    \draw (4.4,2) -- (5.0,2);
    \draw (5.0,2) node[nmos,anchor=G](M2){};
    \draw (M2.S) node[ground]{};
    \draw (M2.D) |- (6.2,2.9); \draw[fill=white] (6.2,2.7) rectangle (7.8,3.1); \node[font=\scriptsize] at (7.0,3.35) {$0.25\lambda$};
    \draw (7.8,2.9) -- (8.6,2.9) -- (8.6,2.4); \draw[fill=white] (8.35,2.4) rectangle (8.85,1.4);
    \node[font=\scriptsize,anchor=east] at (8.3,1.9) {$0.136\lambda$ open};
    \draw (8.6,2.9) -- (9.8,2.9) to[R,l=$50\ \Omega$] (9.8,0.6) node[ground]{};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> The lumped values are the [[Smith Chart and Impedance Matching#L-Network Matching|L-section formulas]] for the load $Z_S^*$, and the stub lengths the [[Smith Chart and Impedance Matching#Single-Stub Tuning|single-stub]] solution; nothing new, only the "match $\Gamma^*$" trick from [[#Realising the Matching Networks]]. At 4 GHz a 0.5 pF capacitor and 2–3 nH inductors are at the edge of what discrete parts do well; that is why Pozar uses stubs.

> [!note]- Exercises that extend this example
> Pozar Prob. 12.15 (GaAs FET at 8 GHz, design for minimum $F$ and maximum gain), 12.16 (6 GHz, $G = 6$ dB with the lowest $F$: now gain is fixed and noise is minimised, the dual of this example), 12.17 (same device, $F = 2.5$ dB with maximum gain).

### Inductively Degenerated CMOS LNA

```tikz title="Inductive source degeneration. (a) AC circuit; (b) the simplified unilateral model (R_i, R_ds, C_ds ignored) that gives a real input resistance without a noisy resistor. After Pozar Fig. 12.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \draw (0,2) node[left,font=\scriptsize]{RF in} to[L,l=$L_g$] (1.8,2) -- (2.2,2) node[nmos,anchor=G](M){};
  \draw (M.S) to[L,l=$L_s$] ++(0,-1.5) node[ground]{};
  \draw (M.D) -- ++(0,0.3) to[R,l=$R_D$] ++(0,1.4) node[vcc]{};
  \draw (M.D) ++(0,0.3) -- ++(0.8,0) node[right,font=\scriptsize]{out};
  \node[font=\scriptsize] at (1.2,-0.4) {(a)};
  \begin{scope}[xshift=5.6cm]
    \draw (0,2.4) node[left,font=\scriptsize]{$I\rightarrow$} to[L,l=$L_g$] (1.8,2.4) node[above,font=\scriptsize]{G};
    \draw (1.8,2.4) to[C,l_=$C_{gs}$] (1.8,0.6) node[left,font=\scriptsize]{S};
    \node[font=\scriptsize] at (2.25,1.5) {$V_c$};
    \draw (1.8,0.6) to[L,l=$L_s$] (1.8,-1.0) node[ground]{};
    \draw (3.8,2.6) node[above,font=\scriptsize]{D} to[cI,l=$g_mV_c$] (3.8,0.6) -- (1.8,0.6);
    \node[font=\scriptsize,align=left,anchor=north west] at (-0.6,-1.4) {$Z_{in}=\dfrac{g_mL_s}{C_{gs}}+j\left(\omega L_s-\dfrac{1}{\omega C_{gs}}\right)$ at the gate; real part $=\omega_TL_s$ from a noiseless $L$};
    \node[font=\scriptsize] at (1.8,-2.6) {(b)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_{in} = \frac{g_mL_s}{C_{gs}}+j\left(\omega L_s-\frac{1}{\omega C_{gs}}\right) = \omega_TL_s + j\left(\omega L_s-\frac{1}{\omega C_{gs}}\right)}
$$

$$
\boxed{L_s = \frac{Z_0C_{gs}}{g_m} = \frac{Z_0}{\omega_T},\qquad \omega L_g = \frac{1}{\omega C_{gs}}-\omega L_s,\qquad Q = \frac{\omega L_gC_{gs}}{g_mL_s}}
$$

- A MOSFET gate is almost purely capacitive: no real part to match to 50 Ω. A series gate resistor would supply one but adds noise.
- **The source inductor makes a real input resistance $g_mL_s/C_{gs} = \omega_TL_s$ out of a noiseless element**: the current $g_mV_c$ through $L_s$ raises the source voltage in phase with the gate current. Set it to $Z_0$.
- $L_g$ resonates out the remaining capacitive reactance. $L_g$, $C_{gs}$ and the input resistance form a series RLC; its $Q$ sets the bandwidth (≈ $1/Q$).
- The same trick works with MESFETs and other devices (Pozar).

> [!note]- Derivation: input impedance (Pozar Eqs. 12.61–12.62)
> Gate current $I$ flows into $C_{gs}$: $V_c = I/(j\omega C_{gs})$. The source node carries $I+g_mV_c$ through $L_s$. So $V = \frac{I}{j\omega C_{gs}}+j\omega L_s\left(I+\frac{g_mI}{j\omega C_{gs}}\right) = I\left(\frac{1}{j\omega C_{gs}}+j\omega L_s+\frac{g_mL_s}{C_{gs}}\right)$. Divide by $I$.

> [!example] Pozar Ex. 12.6: 900 MHz CMOS LNA (Infineon BF1005, $C_{gs} = 2.1$ pF, $g_m = 24$ mS)
> 1. $L_s = \frac{50\times2.1\text{ pF}}{0.024} = 4.37$ nH (here $f_T = g_m/2\pi C_{gs} = 1.82$ GHz).
> 2. Remaining reactance $\omega L_s-\frac{1}{\omega C_{gs}} = -59.5\ \Omega$ → $L_g = \frac{59.5}{2\pi\cdot900\text{ MHz}} = 10.5$ nH.
> 3. $Q = \omega L_gC_{gs}/(g_mL_s) = 1.2$ → bandwidth "as high as 80%", optimistic given the simplified model (Pozar).
>
> Pozar's $Q$ is $\omega L_g/R_{in}$. Counting the loop as a whole (both inductors, the 50 Ω source in series with the 50 Ω input) gives $\omega(L_g+L_s)/100\ \Omega = 0.84$ (computed here): the same message, a low-Q, broadband match at this low $f_T$.

> [!tip] Remark
> $\omega_TL_s = 50\ \Omega$ ties the match to the device's $f_T$, which for a MOSFET is set by $g_m/I_D$ and $L$ ([[MosFETs#Capacitances]], [[gm-ID Design Methodology]]). The degeneration also lowers the stage's effective $G_m$ exactly as [[Single-Stage#Source Degeneration|resistive degeneration]] does, but without the resistor's noise. Pozar treats only the matching; the noise optimisation of this topology (choosing device width for $\Gamma_{opt}\approx\Gamma_{MS}$) is not in Pozar or the binder.

## Level 5: Broadband Amplifiers

Transistors are badly matched to 50 Ω and $|S_{21}|$ falls 6 dB/octave, so a conjugate match is narrowband ([[Smith Chart and Impedance Matching#Bode–Fano Limit|Bode–Fano]]). Every broadband method buys bandwidth with gain, complexity, power or noise:

| Method | What it does | Cost |
|---|---|---|
| Compensated matching | mismatch at low $f$ to flatten the $|S_{21}|$ roll-off | input/output match |
| Resistive matching | resistors give good match | gain, noise figure |
| Negative feedback | flattens gain, improves match and stability; > a decade possible | gain, noise figure |
| Balanced amplifier | two amps between 90° hybrids: good match over an octave or more | two devices, two hybrids, 2× DC power; gain of one amp |
| Distributed amplifier | FETs along gate and drain lines: gain, match, NF over > a decade | large; less gain than a cascade with the same number of devices |
| Differential amplifier | device capacitances in series ($\approx2\times f_T$), double swing, CM rejection | 2× devices and bias power; needs baluns |

### Balanced Amplifier

Two identical amplifiers between 90° hybrids: reflections cancel at the input and are dumped in the hybrid terminations, so each half can be designed for flat gain or minimum noise and still present a match. $S_{21} = -\tfrac{j}{2}(G_A+G_B)$, $S_{11} = \tfrac12(\Gamma_A-\Gamma_B)$, $F = \tfrac12(F_A+F_B)$, −6 dB if one half dies.

> [!tip] Remark
> The full derivation and diagram are in [[Power Dividers and Couplers#Balanced Amplifier]]. Pozar Ex. 12.7 puts two of the Ex. 12.4 amplifiers in a balanced pair: the 5 dB return loss becomes a good match across 3–5 GHz at the same 11 dB gain; re-optimising the four stub lengths flattens 10 dB across the band. By the same argument, $S_{22} = \tfrac12(\Gamma_A-\Gamma_B)$ at the output (Pozar Prob. 12.19).

### Distributed Amplifier

```tikz title="An N-stage distributed (traveling-wave) amplifier. The FET capacitances become part of two artificial transmission lines; matched terminations absorb the backward waves. After Pozar Fig. 12.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

  \draw (0,-0.4) node[left,font=\scriptsize]{in} -- (0.4,-0.4);
  \draw (-0.4,3.0) to[R,l_=$Z_d$] (-0.4,1.4) node[ground]{};
  \draw (-0.4,3.0) -- (0.4,3.0);
  \foreach \i in {1,2,3,4} {
    \pgfmathsetmacro{\x}{2.4*\i}
    \draw[fill=white] ({\x-1.9},-0.6) rectangle ({\x-0.7},-0.2);
    \draw[fill=white] ({\x-1.9+0.8},2.8) rectangle ({\x-0.7+0.8},3.2);
    \draw ({\x-0.7},-0.4) -- ({\x},-0.4) -- ({\x},1.2);
    \draw ({\x},1.2) node[nmos,anchor=G](M\i){};
    \draw (M\i.S) node[ground]{};
    \draw (M\i.D) -- (M\i.D |- 0,3.0);
  }
  \draw (0.4,-0.4) -- (0.5,-0.4); \draw (0.4,3.0) -- (1.3,3.0); \draw (9.7,3.0) -- (9.8,3.0);
  \foreach \i in {1,2,3} { \pgfmathsetmacro{\x}{2.4*\i} \draw (\x,-0.4) -- ({\x+0.5},-0.4); \draw ({\x+0.1},3.0) -- ({\x+1.3},3.0); }
  \draw (9.6,-0.4) -- (10.4,-0.4) to[R,l=$Z_g$] (10.4,-2.0) node[ground]{};
  \draw (9.7,3.0) -- (10.9,3.0) node[right,font=\scriptsize]{out};
  \node[font=\scriptsize] at (1.1,-0.9) {$Z_g,\ \ell_g$};
  \node[font=\scriptsize] at (1.9,3.45) {$Z_d,\ \ell_d$};
  \node[font=\scriptsize,align=center] at (4.6,-2.6) {gate line: each FET taps the input wave and adds $C_{gs}$ to the line\\
    drain line: outputs add in phase when $\beta_g\ell_g=\beta_d\ell_d$; reverse waves die in the terminations};
\end{circuitikz}
\end{document}
```

$$
\boxed{G = \frac{g_m^2Z_dZ_g}{4}\,\frac{\left(e^{-N\alpha_g\ell_g}-e^{-N\alpha_d\ell_d}\right)^2}{\left(e^{-\alpha_g\ell_g}-e^{-\alpha_d\ell_d}\right)^2}\ \ \xrightarrow{\ \text{lossless}\ }\ \ \frac{g_m^2Z_dZ_gN^2}{4}}
$$

$$
\boxed{\alpha_g\ell_g = \frac{\omega^2R_iC_{gs}^2Z_g}{2},\qquad \alpha_d\ell_d = \frac{Z_d}{2R_{ds}},\qquad N_{opt} = \frac{\ln(\alpha_g\ell_g/\alpha_d\ell_d)}{\alpha_g\ell_g-\alpha_d\ell_d}}
$$

$$
\boxed{Z_g = \sqrt{\frac{L_g}{C_g+C_{gs}/\ell_g}},\qquad Z_d = \sqrt{\frac{L_d}{C_d+C_{ds}/\ell_d}},\qquad \text{synchronism: }\beta_g\ell_g = \beta_d\ell_d}
$$

- The input wave travels down the gate line; each FET taps it. The drain currents launch waves that add **in phase** in the forward direction only when the two lines have equal phase delay per section.
- The device capacitances are absorbed into the lines, so they set the line impedance instead of shunting the signal: the bandwidth limit becomes the artificial line's cutoff and its loss, not an $RC$ pole.
- **Gain grows as $N^2$, not $G_0^N$**, and with loss it has a maximum: the gate wave decays before it reaches the last FETs, and the first FETs' outputs decay along the drain line. Past $N_{opt}$, adding stages lowers the gain.
- Loss comes from $R_i$ (gate line, grows as $\omega^2$) and $R_{ds}$ (drain line, flat), so high-frequency gain drops faster for large $N$.

```tikz title="Pozar Ex. 12.8 recomputed from Eq. 12.79: gain vs frequency for N = 2, 4, 8, 16. Large N wins at low frequency and loses at high frequency, where gate-line loss (∝ ω²) dominates."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

\draw[->] (0,0) -- (7.6,0) node[right] {$f$ (GHz)};
\draw[->] (0,0) -- (0,4.2) node[above] {gain (dB)};
\draw (0.00,0.06) -- (0.00,-0.06) node[below,font=\scriptsize] {0};
\draw (2.40,0.06) -- (2.40,-0.06) node[below,font=\scriptsize] {6};
\draw (4.80,0.06) -- (4.80,-0.06) node[below,font=\scriptsize] {12};
\draw (7.20,0.06) -- (7.20,-0.06) node[below,font=\scriptsize] {18};
\draw (0.06,1.25) -- (-0.06,1.25) node[left,font=\scriptsize] {5};
\draw (0.06,2.50) -- (-0.06,2.50) node[left,font=\scriptsize] {10};
\draw (0.06,3.75) -- (-0.06,3.75) node[left,font=\scriptsize] {15};
\draw[gray,thick] plot[smooth] coordinates {(0.400,0.774) (0.600,0.773) (0.800,0.773) (1.000,0.771) (1.200,0.770) (1.400,0.768) (1.600,0.767) (1.800,0.764) (2.000,0.762) (2.200,0.759) (2.400,0.756) (2.600,0.753) (2.800,0.750) (3.000,0.746) (3.200,0.742) (3.400,0.738) (3.600,0.734) (3.800,0.729) (4.000,0.725) (4.200,0.719) (4.400,0.714) (4.600,0.709) (4.800,0.703) (5.000,0.697) (5.200,0.691) (5.400,0.684) (5.600,0.677) (5.800,0.671) (6.000,0.663) (6.200,0.656) (6.400,0.648) (6.600,0.641) (6.800,0.633) (7.000,0.625) (7.200,0.616)};
\node[gray,font=\scriptsize,anchor=west] at (7.20,0.616) {$N=2$};
\draw[blue,thick] plot[smooth] coordinates {(0.400,2.072) (0.600,2.070) (0.800,2.067) (1.000,2.064) (1.200,2.059) (1.400,2.054) (1.600,2.048) (1.800,2.042) (2.000,2.034) (2.200,2.026) (2.400,2.017) (2.600,2.008) (2.800,1.997) (3.000,1.986) (3.200,1.974) (3.400,1.962) (3.600,1.948) (3.800,1.934) (4.000,1.919) (4.200,1.904) (4.400,1.888) (4.600,1.871) (4.800,1.853) (5.000,1.835) (5.200,1.816) (5.400,1.797) (5.600,1.777) (5.800,1.756) (6.000,1.734) (6.200,1.712) (6.400,1.690) (6.600,1.667) (6.800,1.643) (7.000,1.619) (7.200,1.594)};
\node[blue,font=\scriptsize,anchor=west] at (7.20,1.714) {$N=4$};
\draw[red,thick] plot[smooth] coordinates {(0.400,3.184) (0.600,3.179) (0.800,3.172) (1.000,3.163) (1.200,3.153) (1.400,3.140) (1.600,3.126) (1.800,3.109) (2.000,3.091) (2.200,3.071) (2.400,3.049) (2.600,3.026) (2.800,3.000) (3.000,2.973) (3.200,2.944) (3.400,2.913) (3.600,2.881) (3.800,2.847) (4.000,2.811) (4.200,2.773) (4.400,2.734) (4.600,2.694) (4.800,2.652) (5.000,2.609) (5.200,2.564) (5.400,2.518) (5.600,2.470) (5.800,2.421) (6.000,2.371) (6.200,2.320) (6.400,2.268) (6.600,2.214) (6.800,2.160) (7.000,2.104) (7.200,2.048)};
\node[red,font=\scriptsize,anchor=west] at (7.20,2.048) {$N=8$};
\draw[green!50!black,thick] plot[smooth] coordinates {(0.400,3.984) (0.600,3.973) (0.800,3.957) (1.000,3.936) (1.200,3.911) (1.400,3.881) (1.600,3.847) (1.800,3.809) (2.000,3.766) (2.200,3.719) (2.400,3.667) (2.600,3.612) (2.800,3.552) (3.000,3.489) (3.200,3.421) (3.400,3.350) (3.600,3.275) (3.800,3.197) (4.000,3.115) (4.200,3.030) (4.400,2.941) (4.600,2.850) (4.800,2.756) (5.000,2.659) (5.200,2.559) (5.400,2.457) (5.600,2.353) (5.800,2.248) (6.000,2.140) (6.200,2.031) (6.400,1.920) (6.600,1.808) (6.800,1.695) (7.000,1.582) (7.200,1.468)};
\node[green!50!black,font=\scriptsize,anchor=west] at (7.20,1.318) {$N=16$};
\node[font=\scriptsize,align=left,anchor=west] at (1.2,4.75) {$R_i=5\ \Omega$, $R_{ds}=250\ \Omega$, $C_{gs}=0.3$ pF, $g_m=30$ mS, $Z_g=Z_d=50\ \Omega$};
\end{circuitikz}
\end{document}
```

> [!example] Pozar Ex. 12.8: optimum size at 16 GHz
> $R_i = 5\ \Omega$, $R_{ds} = 250\ \Omega$, $C_{gs} = 0.30$ pF, $g_m = 30$ mS, $Z_d = Z_g = 50\ \Omega$. At 16 GHz the two loss products are 0.114 and 0.100 → $N_{opt} = \frac{\ln(0.100/0.114)}{0.100-0.114} = 9.4$: about nine stages. $\omega R_iC_{gs} = 0.17$ at 18 GHz, so the gate voltage divider ≈ 1.
>
> Recomputed: $\alpha_g\ell_g = 0.114$ (gate, $R_i$) and $\alpha_d\ell_d = 0.100$ (drain, $50/500$). Pozar's text assigns the two numbers the other way round; $N_{opt}$ is symmetric in them, so 9.4 stands.

> [!note]- Derivation: gain and $N_{opt}$ (Pozar Eqs. 12.69–12.80)
> Smear each FET's $R_i$, $C_{gs}$ over its gate section and $R_{ds}$, $C_{ds}$ over its drain section. For small loss the gate line has $\alpha_g\approx\frac{\omega^2R_iC_{gs}^2Z_g}{2\ell_g}$ and the drain line $\alpha_d\approx\frac{Z_d}{2R_{ds}\ell_d}$. The $n$-th FET sees $V_{cn} = V_ie^{-(n-1)\gamma_g\ell_g}$ (unity divider) and injects $\mp\tfrac12g_mV_{cn}$ each way on the drain line. The forward output current is a geometric sum, $I_o = -\tfrac12g_mV_i\sum_n e^{-(n-1)\gamma_g\ell_g}e^{-(N-n)\gamma_d\ell_d}$, which adds coherently only if $\beta_g\ell_g = \beta_d\ell_d$. Summing and using $G = \frac{\frac12|I_o|^2Z_d}{|V_i|^2/2Z_g}$ gives the boxed $G$. Differentiate $e^{-Na}-e^{-Nb}$ with respect to $N$ and set to zero: $ae^{-Na} = be^{-Nb}$ → $N_{opt} = \frac{\ln(a/b)}{a-b}$.

### Feedback and Differential Amplifiers

- **Negative feedback** trades gain for flat response, match and stability, for bandwidths beyond a decade (Pozar's list; the binder notes it can in principle neutralise $S_{12}$). The loop analysis is [[Feedback]].
- **Differential RF amplifiers** (Pozar §12.4): the device capacitances appear in series, so the effective $f_T$ roughly doubles; output swing doubles; common-mode interference is rejected, which is why most RFICs are differential. CMRR → ∞ only as the tail impedance → ∞ (with $R_s = 0$, CMRR = 1). A single-ended interface needs a balun (transformer, 180° hybrid, Marchand). Half-circuit analysis and CMRR: [[Differential Amplifiers#CMRR]]; baluns: [[Power Dividers and Couplers#Balun]].

## Level 6: Power Amplifiers

Small-signal S-parameters do not depend on drive level or termination; at power levels near $IP_{1dB}$ they do. A PA is designed for output power, efficiency and linearity, with the load chosen from large-signal data.

### Efficiency and Compression

$$
\boxed{\eta = \frac{P_{out}}{P_{DC}},\qquad \text{PAE} = \frac{P_{out}-P_{in}}{P_{DC}} = \left(1-\frac1G\right)\eta,\qquad G_1(\text{dB}) = G_0(\text{dB})-1}
$$

```tikz title="Output power vs input power. Gain compresses as the device saturates; the 1 dB compression point defines OP1dB and the compressed gain G1. Illustrative curve (soft-limiter model), not device data."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]

\draw[->] (0,0) -- (6.4,0) node[right] {$P_{in}$};
\draw[->] (0,0) -- (0,4.6) node[above] {$P_{out}$};
\draw[thick,blue] (0.000,0.360) -- (0.050,0.405) -- (0.100,0.450) -- (0.150,0.495) -- (0.200,0.540) -- (0.250,0.585) -- (0.300,0.630) -- (0.350,0.675) -- (0.400,0.720) -- (0.450,0.765) -- (0.500,0.810) -- (0.550,0.855) -- (0.600,0.900) -- (0.650,0.945) -- (0.700,0.990) -- (0.750,1.035) -- (0.800,1.080) -- (0.850,1.125) -- (0.900,1.170) -- (0.950,1.215) -- (1.000,1.260) -- (1.050,1.305) -- (1.100,1.350) -- (1.150,1.394) -- (1.200,1.439) -- (1.250,1.484) -- (1.300,1.529) -- (1.350,1.574) -- (1.400,1.619) -- (1.450,1.664) -- (1.500,1.709) -- (1.550,1.754) -- (1.600,1.798) -- (1.650,1.843) -- (1.700,1.888) -- (1.750,1.933) -- (1.800,1.978) -- (1.850,2.022) -- (1.900,2.067) -- (1.950,2.112) -- (2.000,2.156) -- (2.050,2.201) -- (2.100,2.245) -- (2.150,2.290) -- (2.200,2.334) -- (2.250,2.378) -- (2.300,2.422) -- (2.350,2.466) -- (2.400,2.510) -- (2.450,2.554) -- (2.500,2.598) -- (2.550,2.641) -- (2.600,2.685) -- (2.650,2.728) -- (2.700,2.771) -- (2.750,2.814) -- (2.800,2.856) -- (2.850,2.898) -- (2.900,2.940) -- (2.950,2.982) -- (3.000,3.023) -- (3.050,3.063) -- (3.100,3.104) -- (3.150,3.143) -- (3.200,3.182) -- (3.250,3.221) -- (3.300,3.259) -- (3.350,3.296) -- (3.400,3.332) -- (3.450,3.368) -- (3.500,3.403) -- (3.550,3.436) -- (3.600,3.469) -- (3.650,3.501) -- (3.700,3.531) -- (3.750,3.561) -- (3.800,3.589) -- (3.850,3.616) -- (3.900,3.641) -- (3.950,3.666) -- (4.000,3.689) -- (4.050,3.711) -- (4.100,3.731) -- (4.150,3.751) -- (4.200,3.769) -- (4.250,3.786) -- (4.300,3.801) -- (4.350,3.816) -- (4.400,3.829) -- (4.450,3.841) -- (4.500,3.853) -- (4.550,3.863) -- (4.600,3.872) -- (4.650,3.881) -- (4.700,3.889) -- (4.750,3.896) -- (4.800,3.902) -- (4.850,3.908) -- (4.900,3.914) -- (4.950,3.918) -- (5.000,3.923) -- (5.050,3.927) -- (5.100,3.930) -- (5.150,3.933) -- (5.200,3.936) -- (5.250,3.939) -- (5.300,3.941) -- (5.350,3.943) -- (5.400,3.945) -- (5.450,3.946) -- (5.500,3.948) -- (5.550,3.949) -- (5.600,3.950) -- (5.650,3.951) -- (5.700,3.952) -- (5.750,3.953) -- (5.800,3.954) -- (5.850,3.955) -- (5.900,3.955) -- (5.950,3.956) -- (6.000,3.956);
\draw[dashed,gray] (0.000,0.360) -- (4.600,4.500) node[above,font=\scriptsize] {small-signal slope $G_0$};
\fill[red] (3.768,3.571) circle (0.05);
\draw[red,dashed] (3.768,3.571) -- (3.768,0) node[below,font=\scriptsize] {$IP_{1dB}$};
\draw[red,dashed] (3.768,3.571) -- (0,3.571) node[left,font=\scriptsize] {$OP_{1dB}$};
\draw[<->,red] (3.768,3.571) -- (3.768,3.751) node[midway,left,font=\scriptsize] {1 dB};
\draw[blue,dotted] (0,3.960) -- (6.2,3.960) node[right,font=\scriptsize] {$P_{sat}$};
\node[font=\scriptsize,align=left,anchor=west] at (3.3,1.2) {compressed gain\\$G_1=G_0-1$ dB (Pozar 12.90);\\class A PAs are specified\\near $OP_{1dB}$};
\end{circuitikz}
\end{document}
```

- **Drain (collector) efficiency η** ignores the drive power, so it flatters a low-gain PA. **PAE** charges the drive: at 10 dB gain PAE = 0.9η, at 3 dB only 0.5η.
- **The PA dominates the DC budget** of a handset; Pozar quotes Si BJT PAs at 800–900 MHz with PAE around 80%, dropping quickly with frequency.
- Typical powers: 100–500 mW (mobile), 1–100 W (radar, fixed links). Single transistors give 10–100 W at UHF, usually < 10 W at higher frequencies; beyond that, combine devices ([[Power Dividers and Couplers#PA Combining and LO Distribution]]).
- **Linearity:** spurious products and IMD land in adjacent channels; non-constant-envelope modulation (ASK, higher-order QAM) needs a linear PA. $P_{1dB}$, IP3 and their relations live in [[Nonlinearity and Mismatch]]; cascade effects in [[RF Noise and Distortion]].
- **Thermal:** most parameters drift with temperature, which rises with power. Above a few tenths of a watt, the package's thermal contact to a heat sink matters.

### Amplifier Classes

```tikz title="Drain current for the classes Pozar describes, for a sinusoidal drive. Smaller conduction angle means less DC current per unit of fundamental, so higher efficiency, at the price of linearity. Efficiency limits: Pozar §12.5 (A, B, C); waveforms drawn here."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\draw[thick,blue] (0.000,4.100) -- (0.021,4.099) -- (0.042,4.098) -- (0.062,4.095) -- (0.083,4.091) -- (0.104,4.086) -- (0.125,4.080) -- (0.146,4.073) -- (0.167,4.065) -- (0.188,4.056) -- (0.208,4.046) -- (0.229,4.035) -- (0.250,4.024) -- (0.271,4.011) -- (0.292,3.997) -- (0.312,3.983) -- (0.333,3.968) -- (0.354,3.952) -- (0.375,3.935) -- (0.396,3.918) -- (0.417,3.900) -- (0.438,3.882) -- (0.458,3.863) -- (0.479,3.843) -- (0.500,3.824) -- (0.521,3.804) -- (0.542,3.783) -- (0.562,3.763) -- (0.583,3.742) -- (0.604,3.721) -- (0.625,3.700) -- (0.646,3.679) -- (0.667,3.658) -- (0.688,3.637) -- (0.708,3.617) -- (0.729,3.596) -- (0.750,3.576) -- (0.771,3.557) -- (0.792,3.537) -- (0.812,3.518) -- (0.833,3.500) -- (0.854,3.482) -- (0.875,3.465) -- (0.896,3.448) -- (0.917,3.432) -- (0.938,3.417) -- (0.958,3.403) -- (0.979,3.389) -- (1.000,3.376) -- (1.021,3.365) -- (1.042,3.354) -- (1.062,3.344) -- (1.083,3.335) -- (1.104,3.327) -- (1.125,3.320) -- (1.146,3.314) -- (1.167,3.309) -- (1.188,3.305) -- (1.208,3.302) -- (1.229,3.301) -- (1.250,3.300) -- (1.271,3.301) -- (1.292,3.302) -- (1.312,3.305) -- (1.333,3.309) -- (1.354,3.314) -- (1.375,3.320) -- (1.396,3.327) -- (1.417,3.335) -- (1.438,3.344) -- (1.458,3.354) -- (1.479,3.365) -- (1.500,3.376) -- (1.521,3.389) -- (1.542,3.403) -- (1.562,3.417) -- (1.583,3.432) -- (1.604,3.448) -- (1.625,3.465) -- (1.646,3.482) -- (1.667,3.500) -- (1.688,3.518) -- (1.708,3.537) -- (1.729,3.557) -- (1.750,3.576) -- (1.771,3.596) -- (1.792,3.617) -- (1.812,3.637) -- (1.833,3.658) -- (1.854,3.679) -- (1.875,3.700) -- (1.896,3.721) -- (1.917,3.742) -- (1.938,3.763) -- (1.958,3.783) -- (1.979,3.804) -- (2.000,3.824) -- (2.021,3.843) -- (2.042,3.863) -- (2.062,3.882) -- (2.083,3.900) -- (2.104,3.918) -- (2.125,3.935) -- (2.146,3.952) -- (2.167,3.968) -- (2.188,3.983) -- (2.208,3.997) -- (2.229,4.011) -- (2.250,4.024) -- (2.271,4.035) -- (2.292,4.046) -- (2.312,4.056) -- (2.333,4.065) -- (2.354,4.073) -- (2.375,4.080) -- (2.396,4.086) -- (2.417,4.091) -- (2.438,4.095) -- (2.458,4.098) -- (2.479,4.099) -- (2.500,4.100) -- (2.521,4.099) -- (2.542,4.098) -- (2.562,4.095) -- (2.583,4.091) -- (2.604,4.086) -- (2.625,4.080) -- (2.646,4.073) -- (2.667,4.065) -- (2.688,4.056) -- (2.708,4.046) -- (2.729,4.035) -- (2.750,4.024) -- (2.771,4.011) -- (2.792,3.997) -- (2.812,3.983) -- (2.833,3.968) -- (2.854,3.952) -- (2.875,3.935) -- (2.896,3.918) -- (2.917,3.900) -- (2.938,3.882) -- (2.958,3.863) -- (2.979,3.843) -- (3.000,3.824) -- (3.021,3.804) -- (3.042,3.783) -- (3.062,3.763) -- (3.083,3.742) -- (3.104,3.721) -- (3.125,3.700) -- (3.146,3.679) -- (3.167,3.658) -- (3.188,3.637) -- (3.208,3.617) -- (3.229,3.596) -- (3.250,3.576) -- (3.271,3.557) -- (3.292,3.537) -- (3.313,3.518) -- (3.333,3.500) -- (3.354,3.482) -- (3.375,3.465) -- (3.396,3.448) -- (3.417,3.432) -- (3.437,3.417) -- (3.458,3.403) -- (3.479,3.389) -- (3.500,3.376) -- (3.521,3.365) -- (3.542,3.354) -- (3.562,3.344) -- (3.583,3.335) -- (3.604,3.327) -- (3.625,3.320) -- (3.646,3.314) -- (3.667,3.309) -- (3.688,3.305) -- (3.708,3.302) -- (3.729,3.301) -- (3.750,3.300) -- (3.771,3.301) -- (3.792,3.302) -- (3.812,3.305) -- (3.833,3.309) -- (3.854,3.314) -- (3.875,3.320) -- (3.896,3.327) -- (3.917,3.335) -- (3.938,3.344) -- (3.958,3.354) -- (3.979,3.365) -- (4.000,3.376) -- (4.021,3.389) -- (4.042,3.403) -- (4.062,3.417) -- (4.083,3.432) -- (4.104,3.448) -- (4.125,3.465) -- (4.146,3.482) -- (4.167,3.500) -- (4.188,3.518) -- (4.208,3.537) -- (4.229,3.557) -- (4.250,3.576) -- (4.271,3.596) -- (4.292,3.617) -- (4.312,3.637) -- (4.333,3.658) -- (4.354,3.679) -- (4.375,3.700) -- (4.396,3.721) -- (4.417,3.742) -- (4.438,3.763) -- (4.458,3.783) -- (4.479,3.804) -- (4.500,3.824) -- (4.521,3.843) -- (4.542,3.863) -- (4.562,3.882) -- (4.583,3.900) -- (4.604,3.918) -- (4.625,3.935) -- (4.646,3.952) -- (4.667,3.968) -- (4.688,3.983) -- (4.708,3.997) -- (4.729,4.011) -- (4.750,4.024) -- (4.771,4.035) -- (4.792,4.046) -- (4.812,4.056) -- (4.833,4.065) -- (4.854,4.073) -- (4.875,4.080) -- (4.896,4.086) -- (4.917,4.091) -- (4.938,4.095) -- (4.958,4.098) -- (4.979,4.099) -- (5.000,4.100);\draw[gray] (0,3.3) -- (5.2,3.3);\node[anchor=east,font=\scriptsize,align=right] at (-0.1,3.6999999999999997) {A: $360^\circ$};
\draw[thick,blue] (0.000,3.000) -- (0.021,2.999) -- (0.042,2.997) -- (0.062,2.994) -- (0.083,2.990) -- (0.104,2.984) -- (0.125,2.977) -- (0.146,2.969) -- (0.167,2.959) -- (0.188,2.949) -- (0.208,2.937) -- (0.229,2.924) -- (0.250,2.910) -- (0.271,2.896) -- (0.292,2.880) -- (0.312,2.863) -- (0.333,2.845) -- (0.354,2.826) -- (0.375,2.807) -- (0.396,2.787) -- (0.417,2.766) -- (0.438,2.744) -- (0.458,2.722) -- (0.479,2.699) -- (0.500,2.676) -- (0.521,2.653) -- (0.542,2.629) -- (0.562,2.605) -- (0.583,2.580) -- (0.604,2.556) -- (0.625,2.531) -- (0.646,2.507) -- (0.667,2.482) -- (0.688,2.458) -- (0.708,2.434) -- (0.729,2.410) -- (0.750,2.387) -- (0.771,2.363) -- (0.792,2.341) -- (0.812,2.319) -- (0.833,2.297) -- (0.854,2.276) -- (0.875,2.256) -- (0.896,2.236) -- (0.917,2.218) -- (0.938,2.200) -- (0.958,2.200) -- (0.979,2.200) -- (1.000,2.200) -- (1.021,2.200) -- (1.042,2.200) -- (1.062,2.200) -- (1.083,2.200) -- (1.104,2.200) -- (1.125,2.200) -- (1.146,2.200) -- (1.167,2.200) -- (1.188,2.200) -- (1.208,2.200) -- (1.229,2.200) -- (1.250,2.200) -- (1.271,2.200) -- (1.292,2.200) -- (1.312,2.200) -- (1.333,2.200) -- (1.354,2.200) -- (1.375,2.200) -- (1.396,2.200) -- (1.417,2.200) -- (1.438,2.200) -- (1.458,2.200) -- (1.479,2.200) -- (1.500,2.200) -- (1.521,2.200) -- (1.542,2.200) -- (1.562,2.200) -- (1.583,2.218) -- (1.604,2.236) -- (1.625,2.256) -- (1.646,2.276) -- (1.667,2.297) -- (1.688,2.319) -- (1.708,2.341) -- (1.729,2.363) -- (1.750,2.387) -- (1.771,2.410) -- (1.792,2.434) -- (1.812,2.458) -- (1.833,2.482) -- (1.854,2.507) -- (1.875,2.531) -- (1.896,2.556) -- (1.917,2.580) -- (1.938,2.605) -- (1.958,2.629) -- (1.979,2.653) -- (2.000,2.676) -- (2.021,2.699) -- (2.042,2.722) -- (2.062,2.744) -- (2.083,2.766) -- (2.104,2.787) -- (2.125,2.807) -- (2.146,2.826) -- (2.167,2.845) -- (2.188,2.863) -- (2.208,2.880) -- (2.229,2.896) -- (2.250,2.910) -- (2.271,2.924) -- (2.292,2.937) -- (2.312,2.949) -- (2.333,2.959) -- (2.354,2.969) -- (2.375,2.977) -- (2.396,2.984) -- (2.417,2.990) -- (2.438,2.994) -- (2.458,2.997) -- (2.479,2.999) -- (2.500,3.000) -- (2.521,2.999) -- (2.542,2.997) -- (2.562,2.994) -- (2.583,2.990) -- (2.604,2.984) -- (2.625,2.977) -- (2.646,2.969) -- (2.667,2.959) -- (2.688,2.949) -- (2.708,2.937) -- (2.729,2.924) -- (2.750,2.910) -- (2.771,2.896) -- (2.792,2.880) -- (2.812,2.863) -- (2.833,2.845) -- (2.854,2.826) -- (2.875,2.807) -- (2.896,2.787) -- (2.917,2.766) -- (2.938,2.744) -- (2.958,2.722) -- (2.979,2.699) -- (3.000,2.676) -- (3.021,2.653) -- (3.042,2.629) -- (3.062,2.605) -- (3.083,2.580) -- (3.104,2.556) -- (3.125,2.531) -- (3.146,2.507) -- (3.167,2.482) -- (3.188,2.458) -- (3.208,2.434) -- (3.229,2.410) -- (3.250,2.387) -- (3.271,2.363) -- (3.292,2.341) -- (3.313,2.319) -- (3.333,2.297) -- (3.354,2.276) -- (3.375,2.256) -- (3.396,2.236) -- (3.417,2.218) -- (3.437,2.200) -- (3.458,2.200) -- (3.479,2.200) -- (3.500,2.200) -- (3.521,2.200) -- (3.542,2.200) -- (3.562,2.200) -- (3.583,2.200) -- (3.604,2.200) -- (3.625,2.200) -- (3.646,2.200) -- (3.667,2.200) -- (3.688,2.200) -- (3.708,2.200) -- (3.729,2.200) -- (3.750,2.200) -- (3.771,2.200) -- (3.792,2.200) -- (3.812,2.200) -- (3.833,2.200) -- (3.854,2.200) -- (3.875,2.200) -- (3.896,2.200) -- (3.917,2.200) -- (3.938,2.200) -- (3.958,2.200) -- (3.979,2.200) -- (4.000,2.200) -- (4.021,2.200) -- (4.042,2.200) -- (4.062,2.200) -- (4.083,2.218) -- (4.104,2.236) -- (4.125,2.256) -- (4.146,2.276) -- (4.167,2.297) -- (4.188,2.319) -- (4.208,2.341) -- (4.229,2.363) -- (4.250,2.387) -- (4.271,2.410) -- (4.292,2.434) -- (4.312,2.458) -- (4.333,2.482) -- (4.354,2.507) -- (4.375,2.531) -- (4.396,2.556) -- (4.417,2.580) -- (4.438,2.605) -- (4.458,2.629) -- (4.479,2.653) -- (4.500,2.676) -- (4.521,2.699) -- (4.542,2.722) -- (4.562,2.744) -- (4.583,2.766) -- (4.604,2.787) -- (4.625,2.807) -- (4.646,2.826) -- (4.667,2.845) -- (4.688,2.863) -- (4.708,2.880) -- (4.729,2.896) -- (4.750,2.910) -- (4.771,2.924) -- (4.792,2.937) -- (4.812,2.949) -- (4.833,2.959) -- (4.854,2.969) -- (4.875,2.977) -- (4.896,2.984) -- (4.917,2.990) -- (4.938,2.994) -- (4.958,2.997) -- (4.979,2.999) -- (5.000,3.000);\draw[gray] (0,2.2) -- (5.2,2.2);\node[anchor=east,font=\scriptsize,align=right] at (-0.1,2.6) {AB: $180$–$360^\circ$};
\draw[thick,blue] (0.000,1.900) -- (0.021,1.899) -- (0.042,1.896) -- (0.062,1.890) -- (0.083,1.883) -- (0.104,1.873) -- (0.125,1.861) -- (0.146,1.847) -- (0.167,1.831) -- (0.188,1.813) -- (0.208,1.793) -- (0.229,1.771) -- (0.250,1.747) -- (0.271,1.722) -- (0.292,1.695) -- (0.312,1.666) -- (0.333,1.635) -- (0.354,1.603) -- (0.375,1.570) -- (0.396,1.536) -- (0.417,1.500) -- (0.438,1.463) -- (0.458,1.425) -- (0.479,1.387) -- (0.500,1.347) -- (0.521,1.307) -- (0.542,1.266) -- (0.562,1.225) -- (0.583,1.184) -- (0.604,1.142) -- (0.625,1.100) -- (0.646,1.100) -- (0.667,1.100) -- (0.688,1.100) -- (0.708,1.100) -- (0.729,1.100) -- (0.750,1.100) -- (0.771,1.100) -- (0.792,1.100) -- (0.812,1.100) -- (0.833,1.100) -- (0.854,1.100) -- (0.875,1.100) -- (0.896,1.100) -- (0.917,1.100) -- (0.938,1.100) -- (0.958,1.100) -- (0.979,1.100) -- (1.000,1.100) -- (1.021,1.100) -- (1.042,1.100) -- (1.062,1.100) -- (1.083,1.100) -- (1.104,1.100) -- (1.125,1.100) -- (1.146,1.100) -- (1.167,1.100) -- (1.188,1.100) -- (1.208,1.100) -- (1.229,1.100) -- (1.250,1.100) -- (1.271,1.100) -- (1.292,1.100) -- (1.312,1.100) -- (1.333,1.100) -- (1.354,1.100) -- (1.375,1.100) -- (1.396,1.100) -- (1.417,1.100) -- (1.438,1.100) -- (1.458,1.100) -- (1.479,1.100) -- (1.500,1.100) -- (1.521,1.100) -- (1.542,1.100) -- (1.562,1.100) -- (1.583,1.100) -- (1.604,1.100) -- (1.625,1.100) -- (1.646,1.100) -- (1.667,1.100) -- (1.688,1.100) -- (1.708,1.100) -- (1.729,1.100) -- (1.750,1.100) -- (1.771,1.100) -- (1.792,1.100) -- (1.812,1.100) -- (1.833,1.100) -- (1.854,1.100) -- (1.875,1.100) -- (1.896,1.142) -- (1.917,1.184) -- (1.938,1.225) -- (1.958,1.266) -- (1.979,1.307) -- (2.000,1.347) -- (2.021,1.387) -- (2.042,1.425) -- (2.062,1.463) -- (2.083,1.500) -- (2.104,1.536) -- (2.125,1.570) -- (2.146,1.603) -- (2.167,1.635) -- (2.188,1.666) -- (2.208,1.695) -- (2.229,1.722) -- (2.250,1.747) -- (2.271,1.771) -- (2.292,1.793) -- (2.312,1.813) -- (2.333,1.831) -- (2.354,1.847) -- (2.375,1.861) -- (2.396,1.873) -- (2.417,1.883) -- (2.438,1.890) -- (2.458,1.896) -- (2.479,1.899) -- (2.500,1.900) -- (2.521,1.899) -- (2.542,1.896) -- (2.562,1.890) -- (2.583,1.883) -- (2.604,1.873) -- (2.625,1.861) -- (2.646,1.847) -- (2.667,1.831) -- (2.688,1.813) -- (2.708,1.793) -- (2.729,1.771) -- (2.750,1.747) -- (2.771,1.722) -- (2.792,1.695) -- (2.812,1.666) -- (2.833,1.635) -- (2.854,1.603) -- (2.875,1.570) -- (2.896,1.536) -- (2.917,1.500) -- (2.938,1.463) -- (2.958,1.425) -- (2.979,1.387) -- (3.000,1.347) -- (3.021,1.307) -- (3.042,1.266) -- (3.062,1.225) -- (3.083,1.184) -- (3.104,1.142) -- (3.125,1.100) -- (3.146,1.100) -- (3.167,1.100) -- (3.188,1.100) -- (3.208,1.100) -- (3.229,1.100) -- (3.250,1.100) -- (3.271,1.100) -- (3.292,1.100) -- (3.313,1.100) -- (3.333,1.100) -- (3.354,1.100) -- (3.375,1.100) -- (3.396,1.100) -- (3.417,1.100) -- (3.437,1.100) -- (3.458,1.100) -- (3.479,1.100) -- (3.500,1.100) -- (3.521,1.100) -- (3.542,1.100) -- (3.562,1.100) -- (3.583,1.100) -- (3.604,1.100) -- (3.625,1.100) -- (3.646,1.100) -- (3.667,1.100) -- (3.688,1.100) -- (3.708,1.100) -- (3.729,1.100) -- (3.750,1.100) -- (3.771,1.100) -- (3.792,1.100) -- (3.812,1.100) -- (3.833,1.100) -- (3.854,1.100) -- (3.875,1.100) -- (3.896,1.100) -- (3.917,1.100) -- (3.938,1.100) -- (3.958,1.100) -- (3.979,1.100) -- (4.000,1.100) -- (4.021,1.100) -- (4.042,1.100) -- (4.062,1.100) -- (4.083,1.100) -- (4.104,1.100) -- (4.125,1.100) -- (4.146,1.100) -- (4.167,1.100) -- (4.188,1.100) -- (4.208,1.100) -- (4.229,1.100) -- (4.250,1.100) -- (4.271,1.100) -- (4.292,1.100) -- (4.312,1.100) -- (4.333,1.100) -- (4.354,1.100) -- (4.375,1.100) -- (4.396,1.142) -- (4.417,1.184) -- (4.438,1.225) -- (4.458,1.266) -- (4.479,1.307) -- (4.500,1.347) -- (4.521,1.387) -- (4.542,1.425) -- (4.562,1.463) -- (4.583,1.500) -- (4.604,1.536) -- (4.625,1.570) -- (4.646,1.603) -- (4.667,1.635) -- (4.688,1.666) -- (4.708,1.695) -- (4.729,1.722) -- (4.750,1.747) -- (4.771,1.771) -- (4.792,1.793) -- (4.812,1.813) -- (4.833,1.831) -- (4.854,1.847) -- (4.875,1.861) -- (4.896,1.873) -- (4.917,1.883) -- (4.938,1.890) -- (4.958,1.896) -- (4.979,1.899) -- (5.000,1.900);\draw[gray] (0,1.1) -- (5.2,1.1);\node[anchor=east,font=\scriptsize,align=right] at (-0.1,1.5) {B: $180^\circ$};
\draw[thick,blue] (0.000,0.800) -- (0.021,0.798) -- (0.042,0.791) -- (0.062,0.780) -- (0.083,0.765) -- (0.104,0.745) -- (0.125,0.722) -- (0.146,0.694) -- (0.167,0.662) -- (0.188,0.626) -- (0.208,0.586) -- (0.229,0.542) -- (0.250,0.494) -- (0.271,0.443) -- (0.292,0.389) -- (0.312,0.331) -- (0.333,0.271) -- (0.354,0.207) -- (0.375,0.140) -- (0.396,0.071) -- (0.417,0.000) -- (0.438,0.000) -- (0.458,0.000) -- (0.479,0.000) -- (0.500,0.000) -- (0.521,0.000) -- (0.542,0.000) -- (0.562,0.000) -- (0.583,0.000) -- (0.604,0.000) -- (0.625,0.000) -- (0.646,0.000) -- (0.667,0.000) -- (0.688,0.000) -- (0.708,0.000) -- (0.729,0.000) -- (0.750,0.000) -- (0.771,0.000) -- (0.792,0.000) -- (0.812,0.000) -- (0.833,0.000) -- (0.854,0.000) -- (0.875,0.000) -- (0.896,0.000) -- (0.917,0.000) -- (0.938,0.000) -- (0.958,0.000) -- (0.979,0.000) -- (1.000,0.000) -- (1.021,0.000) -- (1.042,0.000) -- (1.062,0.000) -- (1.083,0.000) -- (1.104,0.000) -- (1.125,0.000) -- (1.146,0.000) -- (1.167,0.000) -- (1.188,0.000) -- (1.208,0.000) -- (1.229,0.000) -- (1.250,0.000) -- (1.271,0.000) -- (1.292,0.000) -- (1.312,0.000) -- (1.333,0.000) -- (1.354,0.000) -- (1.375,0.000) -- (1.396,0.000) -- (1.417,0.000) -- (1.438,0.000) -- (1.458,0.000) -- (1.479,0.000) -- (1.500,0.000) -- (1.521,0.000) -- (1.542,0.000) -- (1.562,0.000) -- (1.583,0.000) -- (1.604,0.000) -- (1.625,0.000) -- (1.646,0.000) -- (1.667,0.000) -- (1.688,0.000) -- (1.708,0.000) -- (1.729,0.000) -- (1.750,0.000) -- (1.771,0.000) -- (1.792,0.000) -- (1.812,0.000) -- (1.833,0.000) -- (1.854,0.000) -- (1.875,0.000) -- (1.896,0.000) -- (1.917,0.000) -- (1.938,0.000) -- (1.958,0.000) -- (1.979,0.000) -- (2.000,0.000) -- (2.021,0.000) -- (2.042,0.000) -- (2.062,0.000) -- (2.083,0.000) -- (2.104,0.071) -- (2.125,0.140) -- (2.146,0.207) -- (2.167,0.271) -- (2.188,0.331) -- (2.208,0.389) -- (2.229,0.443) -- (2.250,0.494) -- (2.271,0.542) -- (2.292,0.586) -- (2.312,0.626) -- (2.333,0.662) -- (2.354,0.694) -- (2.375,0.722) -- (2.396,0.745) -- (2.417,0.765) -- (2.438,0.780) -- (2.458,0.791) -- (2.479,0.798) -- (2.500,0.800) -- (2.521,0.798) -- (2.542,0.791) -- (2.562,0.780) -- (2.583,0.765) -- (2.604,0.745) -- (2.625,0.722) -- (2.646,0.694) -- (2.667,0.662) -- (2.688,0.626) -- (2.708,0.586) -- (2.729,0.542) -- (2.750,0.494) -- (2.771,0.443) -- (2.792,0.389) -- (2.812,0.331) -- (2.833,0.271) -- (2.854,0.207) -- (2.875,0.140) -- (2.896,0.071) -- (2.917,0.000) -- (2.938,0.000) -- (2.958,0.000) -- (2.979,0.000) -- (3.000,0.000) -- (3.021,0.000) -- (3.042,0.000) -- (3.062,0.000) -- (3.083,0.000) -- (3.104,0.000) -- (3.125,0.000) -- (3.146,0.000) -- (3.167,0.000) -- (3.188,0.000) -- (3.208,0.000) -- (3.229,0.000) -- (3.250,0.000) -- (3.271,0.000) -- (3.292,0.000) -- (3.313,0.000) -- (3.333,0.000) -- (3.354,0.000) -- (3.375,0.000) -- (3.396,0.000) -- (3.417,0.000) -- (3.437,0.000) -- (3.458,0.000) -- (3.479,0.000) -- (3.500,0.000) -- (3.521,0.000) -- (3.542,0.000) -- (3.562,0.000) -- (3.583,0.000) -- (3.604,0.000) -- (3.625,0.000) -- (3.646,0.000) -- (3.667,0.000) -- (3.688,0.000) -- (3.708,0.000) -- (3.729,0.000) -- (3.750,0.000) -- (3.771,0.000) -- (3.792,0.000) -- (3.812,0.000) -- (3.833,0.000) -- (3.854,0.000) -- (3.875,0.000) -- (3.896,0.000) -- (3.917,0.000) -- (3.938,0.000) -- (3.958,0.000) -- (3.979,0.000) -- (4.000,0.000) -- (4.021,0.000) -- (4.042,0.000) -- (4.062,0.000) -- (4.083,0.000) -- (4.104,0.000) -- (4.125,0.000) -- (4.146,0.000) -- (4.167,0.000) -- (4.188,0.000) -- (4.208,0.000) -- (4.229,0.000) -- (4.250,0.000) -- (4.271,0.000) -- (4.292,0.000) -- (4.312,0.000) -- (4.333,0.000) -- (4.354,0.000) -- (4.375,0.000) -- (4.396,0.000) -- (4.417,0.000) -- (4.438,0.000) -- (4.458,0.000) -- (4.479,0.000) -- (4.500,0.000) -- (4.521,0.000) -- (4.542,0.000) -- (4.562,0.000) -- (4.583,0.000) -- (4.604,0.071) -- (4.625,0.140) -- (4.646,0.207) -- (4.667,0.271) -- (4.688,0.331) -- (4.708,0.389) -- (4.729,0.443) -- (4.750,0.494) -- (4.771,0.542) -- (4.792,0.586) -- (4.812,0.626) -- (4.833,0.662) -- (4.854,0.694) -- (4.875,0.722) -- (4.896,0.745) -- (4.917,0.765) -- (4.938,0.780) -- (4.958,0.791) -- (4.979,0.798) -- (5.000,0.800);\draw[gray] (0,0.0) -- (5.2,0.0);\node[anchor=east,font=\scriptsize,align=right] at (-0.1,0.4) {C: $<180^\circ$};
\node[font=\scriptsize] at (2.5,4.4) {drain current over two RF cycles};
\node[font=\scriptsize,anchor=west,align=left] at (5.6,3.7) {$\eta_{max}=50\%$, linear};
\node[font=\scriptsize,anchor=west,align=left] at (5.6,2.6) {between A and B};
\node[font=\scriptsize,anchor=west,align=left] at (5.6,1.5) {$\eta_{max}=\pi/4=78.5\%$};
\node[font=\scriptsize,anchor=west,align=left] at (5.6,0.4) {$\eta\to100\%$ as angle $\to0$;\\constant envelope only};
\end{circuitikz}
\end{document}
```

| Class | Conduction | Max efficiency | Linearity, use |
|---|---|---|---|
| A | full cycle (360°) | 50% | linear; most small-signal and low-noise amps are class A |
| AB | between 180° and 360° | between A and B | the usual compromise for linear transmitters |
| B | half cycle (180°); push-pull pair covers the whole cycle | 78.5% ($\pi/4$; Pozar quotes 78%) | linear in push-pull |
| C | less than half cycle, resonant output recovers the fundamental | approaches 100% | constant-envelope modulation only |
| D, E, F, S | transistor as a switch pumping a resonant tank | very high | switching; constant envelope |

Most UHF-and-above communication transmitters use class A, AB or B because they need low distortion (Pozar).

> [!note]- Derivation: 50% for class A, $\pi/4$ for class B (ideal device, zero knee voltage)
> Let the drain swing $\pm V_{DD}$ about $V_{DD}$ into a resistive fundamental load, peak current $I_{max}$.
> **Class A:** $I_D = \frac{I_{max}}2(1+\cos\omega t)$. DC current $I_{max}/2$, fundamental amplitude $I_{max}/2$. $P_{out} = \tfrac12V_{DD}\frac{I_{max}}{2}$, $P_{DC} = V_{DD}\frac{I_{max}}{2}$ → $\eta = 1/2$.
> **Class B:** half-sine pulses of peak $I_{max}$. DC (average) current $I_{max}/\pi$; fundamental amplitude $I_{max}/2$ (Fourier). $P_{out} = \tfrac12V_{DD}\frac{I_{max}}2$, $P_{DC} = V_{DD}\frac{I_{max}}{\pi}$ → $\eta = \pi/4 = 78.5\%$.
> **Class C:** shrinking the conduction angle cuts the DC current faster than the fundamental, so $\eta\to100\%$ as the angle → 0, while the output power for a given $I_{max}$ also → 0.
> Real devices lose some swing to the knee (saturation) voltage, so real efficiencies sit below these limits.

> [!warning] Unverified: load-line resistance
> For a class A stage the optimum intrinsic load for maximum power is $R_{opt}\approx\frac{(V_{DD}-V_{knee})^2}{2P_{out}}$ (the voltage swing $V_{DD}-V_{knee}$ is the amplitude, $P = V^2/2R$). It follows from the class A derivation above, but it is not in Pozar Ch. 12 or the binder. It holds at the intrinsic drain, not the package pins: Pozar's large-signal $Z_{LP}$ (below) includes package parasitics, so it cannot be checked against this formula directly. The design-level point stands: low supply voltage at high power means a very low $R_{opt}$ and a large impedance transformation to 50 Ω.

### Load-Pull and Large-Signal Characterization

- Near and above $P_{1dB}$, measured S-parameters depend on drive level, output termination, frequency, bias and temperature. **Large-signal S-parameters are not uniquely defined and cannot replace small-signal ones** in the gain formulas.
- **Stability is still checked with small-signal S-parameters**: oscillation starts at small signal (Pozar).
- **Large-signal source/load reflection coefficients** $\Gamma_{SP}$, $\Gamma_{LP}$: the terminations that maximise power gain at a given output power (often $OP_{1dB}$), listed vs frequency (Pozar Table 12.1).
- **Load-pull contours:** contours of constant $P_{out}$ on the $\Gamma_L$ Smith chart, with the input conjugate-matched, measured with computer-controlled tuners. They play the role of gain circles but are not circles, because the device is nonlinear.
- **Nonlinear device models** (dominant FET nonlinearities: $C_{gs}$, $g_m$, $C_{gd}$, $R_{ds}$) with CAD are the alternative.

### Class A PA Design

**Procedure** (Pozar §12.5)

1. **Pick the device** for frequency and power, with about **20% more power capacity** than required. Si BJTs give more power than GaAs FETs up to a few GHz and cost less; GaN is popular for high power at RF and low microwave frequencies.
2. **Check stability** with small-signal S-parameters ($K$, $|\Delta|$). High-power oscillations destroy devices.
3. **Input network:** conjugate match for maximum power transfer, using $\Gamma_{SP}$.
4. **Output network:** match to the large-signal $\Gamma_{LP}$ for maximum output power, **not** the small-signal $\Gamma_{ML}$.
5. **Use low-loss output elements** (highest currents there); internally matched transistors reduce package parasitics and help efficiency and bandwidth.
6. **Compute** drive power, DC current and PAE.

```tikz title="Pozar Ex. 12.9 on the Smith chart: the large-signal Γ_SP, Γ_LP lie near, but not on, the small-signal conjugate-match points. All four sit near the short-circuit edge: a 2.5 Ω load must be transformed to 50 Ω. Values from Pozar; Γ_MS, Γ_ML recomputed."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.3]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!40,very thin] (0.1667,0) circle (0.8333);
\draw[gray!40,very thin] (0.3333,0) circle (0.6667);
\draw[gray!40,very thin] (0.5000,0) circle (0.5000);
\draw[gray!40,very thin] (0.6667,0) circle (0.3333);
\draw[gray!40,very thin] (0.8333,0) circle (0.1667);
\draw[gray!40,very thin] (1,5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,-5.0000) circle (5.0000);
\draw[gray!40,very thin] (1,2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,-2.0000) circle (2.0000);
\draw[gray!40,very thin] (1,1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,-1.0000) circle (1.0000);
\draw[gray!40,very thin] (1,0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,-0.5000) circle (0.5000);
\draw[gray!40,very thin] (1,0.2000) circle (0.2000);
\draw[gray!40,very thin] (1,-0.2000) circle (0.2000);
\end{scope}
\draw[gray!50,very thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\fill (0,0) circle (0.012);
\fill[blue] (-0.6630,-0.0814) circle (0.018);\draw[blue,thin,opacity=0.6] (-0.6630,-0.0814) -- (-0.2,-0.55);\node[anchor=north,font=\scriptsize,text=blue,inner sep=1pt] at (-0.2,-0.55) {$\Gamma_{SP}=0.668\angle{-173}^\circ$ (large-signal source)};
\fill[cyan!60!blue] (-0.4929,0.1229) circle (0.018);\draw[cyan!60!blue,thin,opacity=0.6] (-0.4929,0.1229) -- (-0.2,0.55);\node[anchor=south,font=\scriptsize,text=cyan!60!blue,inner sep=1pt] at (-0.2,0.55) {$\Gamma_{MS}=0.508\angle166^\circ$ (small-signal)};
\fill[red] (-0.9016,-0.0789) circle (0.018);\draw[red,thin,opacity=0.6] (-0.9016,-0.0789) -- (-1.15,-0.45);\node[anchor=east,font=\scriptsize,text=red,inner sep=1pt] at (-1.15,-0.45) {$\Gamma_{LP}=0.905\angle{-175}^\circ$};
\fill[magenta] (-0.9517,-0.0665) circle (0.018);\draw[magenta,thin,opacity=0.6] (-0.9517,-0.0665) -- (-1.15,0.35);\node[anchor=east,font=\scriptsize,text=magenta,inner sep=1pt] at (-1.15,0.35) {$\Gamma_{ML}=0.954\angle{-176}^\circ$};
\node[font=\scriptsize,align=center] at (0.5,0.22) {$Z_{SP}=10-j3\ \Omega$\\$Z_{LP}=2.5-j2.3\ \Omega$};
\end{scope}
\end{circuitikz}
\end{document}
```

> [!example] Pozar Ex. 12.9: 10 W GaN HEMT PA at 2.3 GHz
> Nitronex NPT25100, $V_{DS} = 28$ V, $I_D = 600$ mA: $S_{11} = 0.593\angle178^\circ$, $S_{12} = 0.009\angle-127^\circ$, $S_{21} = 1.77\angle-106^\circ$, $S_{22} = 0.958\angle175^\circ$. Large signal: $Z_{SP} = 10-j3\ \Omega$, $Z_{LP} = 2.5-j2.3\ \Omega$; at 10 W, $G = 16.4$ dB, $\eta = 26\%$.
> 1. **Stability:** $|\Delta| = 0.579$, $K = 2.08$: unconditionally stable.
> 2. **Terminations:** $\Gamma_{SP} = 0.668\angle187^\circ$, $\Gamma_{LP} = 0.905\angle-175^\circ$. For comparison, small-signal $\Gamma_{MS} = 0.508\angle166^\circ$, $\Gamma_{ML} = 0.954\angle-176^\circ$: close, not equal. Design with $\Gamma_{SP}$, $\Gamma_{LP}$.
> 3. **Drive:** $P_{in} = 40\text{ dBm}-16.4\text{ dB} = 23.6$ dBm = 229 mW.
> 4. **DC:** $P_{DC} = 10/0.26 = 38.5$ W, $I_D = 38.5/28 = 1.37$ A.
> 5. **PAE** $= (10-0.229)/38.5 = 25\%$, barely below η because the gain is high.
>
> Exercise: Pozar Prob. 12.22 (1 W at 1 GHz from the Table 12.1 BJT data).

## How It Is Measured

- **S-parameters and stability:** a calibrated VNA at the device's bias, over a band wider than the amplifier's (out-of-band $K$ matters). [[Microwave Network Analysis#Level 5: Measurement: VNA, Calibration, De-embedding]].
- **Noise parameters** (binder p. 243): tune $\Gamma_S$ with a tuner until the NF meter shows the minimum, read $F_{min}$, and measure $\Gamma_{opt}$ = that $\Gamma_S$ with the network analyser. Then set $\Gamma_S = 0$ and measure $F$ to get $r_n = (F_{\Gamma_S=0}-F_{min})\frac{|1+\Gamma_{opt}|^2}{4|\Gamma_{opt}|^2}$ (the noise formula at $\Gamma_S = 0$). Noise-figure measurement itself: [[RF Noise and Distortion]].
- **Large-signal:** load-pull with electromechanical tuners and a power meter gives $\Gamma_{LP}$ and constant-$P_{out}$ contours; a spectrum analyser gives $P_{1dB}$ and two-tone IM3.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| $\Gamma_S\to\Gamma_{MS}$, $\Gamma_L\to\Gamma_{ML}$ (conjugate match) | gain up to $G_{T,max}$, both ports matched | bandwidth (Ex. 12.3: 2.5%), needs $K>1$ |
| $\Gamma$'s toward the chart centre (less gain) | bandwidth, flatness (Ex. 12.4: 25%), tolerance | gain, input/output match |
| $\Gamma_S\to\Gamma_{opt}$ | noise figure | gain (binder Ex. 1: 3.7 dB), input VSWR |
| Series R at input / shunt R at output | unconditional stability | gain (≈1 dB in the binder example); input R adds noise |
| Negative feedback | flatness, match, stability, > decade bandwidth | gain, noise figure |
| Balanced pair | match and stability over an octave, graceful failure | 2× devices and DC power, hybrid loss |
| Distributed, more sections $N$ | gain ($\propto N^2$) at low $f$ | high-$f$ gain past $N_{opt}$, size |
| Inductive degeneration $L_s$ | real input resistance with no noise | sets $Z_{in}$ via $f_T$; narrowband if $Q$ is high |
| Lower conduction angle (A→B→C) | efficiency (50% → 78.5% → ~100%) | linearity, output power per device |
| Higher device $f_{max}$ / gain | PAE ($1-1/G$), gain margin | cost, breakdown voltage, stability (more gain → lower $K$) |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Port reflections | $\Gamma_{in} = S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L}$, $\Gamma_{out} = S_{22}+\frac{S_{12}S_{21}\Gamma_S}{1-S_{11}\Gamma_S}$, $\Delta = S_{11}S_{22}-S_{12}S_{21}$ |
| Negative resistance | $\lvert\Gamma\rvert>1\iff\mathrm{Re}\,Z<0$ |
| Operating gain | $G_P = \frac{\lvert S_{21}\rvert^2(1-\lvert\Gamma_L\rvert^2)}{(1-\lvert\Gamma_{in}\rvert^2)\lvert1-S_{22}\Gamma_L\rvert^2}$ |
| Available gain | $G_A = \frac{\lvert S_{21}\rvert^2(1-\lvert\Gamma_S\rvert^2)}{\lvert1-S_{11}\Gamma_S\rvert^2(1-\lvert\Gamma_{out}\rvert^2)}$ |
| Transducer gain | $G_T = \frac{(1-\lvert\Gamma_S\rvert^2)\lvert S_{21}\rvert^2(1-\lvert\Gamma_L\rvert^2)}{\lvert1-\Gamma_S\Gamma_{in}\rvert^2\lvert1-S_{22}\Gamma_L\rvert^2} = G_SG_0G_L$; $G_T\le G_P, G_A$ |
| Matched FET gain | $G_{TU} = \frac{R_{ds}}{4R_i}(f_T/f)^2$ |
| Stability circles | $C_L = \frac{(S_{22}-\Delta S_{11}^*)^*}{\lvert S_{22}\rvert^2-\lvert\Delta\rvert^2}$, $R_L = \left\lvert\frac{S_{12}S_{21}}{\lvert S_{22}\rvert^2-\lvert\Delta\rvert^2}\right\rvert$; $C_S$, $R_S$: swap 1↔2 |
| Rollett | $K = \frac{1-\lvert S_{11}\rvert^2-\lvert S_{22}\rvert^2+\lvert\Delta\rvert^2}{2\lvert S_{12}S_{21}\rvert}>1$ and $\lvert\Delta\rvert<1$ |
| μ test | $\mu = \frac{1-\lvert S_{11}\rvert^2}{\lvert S_{22}-\Delta S_{11}^*\rvert+\lvert S_{12}S_{21}\rvert}>1$ |
| Unilateral FoM | $U = \frac{\lvert S_{12}S_{21}S_{11}S_{22}\rvert}{(1-\lvert S_{11}\rvert^2)(1-\lvert S_{22}\rvert^2)}$, $\frac1{(1+U)^2}<\frac{G_T}{G_{TU}}<\frac1{(1-U)^2}$ |
| Max unilateral gain | $G_{TU,max} = \frac{\lvert S_{21}\rvert^2}{(1-\lvert S_{11}\rvert^2)(1-\lvert S_{22}\rvert^2)}$ at $\Gamma_S = S_{11}^*$, $\Gamma_L = S_{22}^*$ |
| Unilateral gain circles | $g_i = G_i(1-\lvert S_{ii}\rvert^2)$, $C_i = \frac{g_iS_{ii}^*}{1-(1-g_i)\lvert S_{ii}\rvert^2}$, $R_i = \frac{\sqrt{1-g_i}(1-\lvert S_{ii}\rvert^2)}{1-(1-g_i)\lvert S_{ii}\rvert^2}$ |
| Simultaneous match | $\Gamma_{MS} = \frac{B_1-\sqrt{B_1^2-4\lvert C_1\rvert^2}}{2C_1}$, $B_1 = 1+\lvert S_{11}\rvert^2-\lvert S_{22}\rvert^2-\lvert\Delta\rvert^2$, $C_1 = S_{11}-\Delta S_{22}^*$ (port 2: swap) |
| Max gain, MSG | $G_{T,max} = \lvert S_{21}/S_{12}\rvert(K-\sqrt{K^2-1})$, $G_{msg} = \lvert S_{21}/S_{12}\rvert$ |
| $G_P$ circles | $g_p = G_P/\lvert S_{21}\rvert^2$, $C_P = \frac{g_pC_2^*}{1+g_p(\lvert S_{22}\rvert^2-\lvert\Delta\rvert^2)}$, $R_P = \frac{\sqrt{1-2K\lvert S_{12}S_{21}\rvert g_p+\lvert S_{12}S_{21}\rvert^2g_p^2}}{\lvert1+g_p(\lvert S_{22}\rvert^2-\lvert\Delta\rvert^2)\rvert}$ |
| $G_A$ circles | same with $C_1$, $\lvert S_{11}\rvert^2$ |
| Noise figure, noise circles | owned by RF Noise and Distortion (Noise Parameters, Noise Circles) |
| Input mismatch | $\lvert\Gamma_a\rvert = \left\lvert\frac{\Gamma_{in}-\Gamma_S^*}{1-\Gamma_{in}\Gamma_S}\right\rvert$, VSWR $= \frac{1+\lvert\Gamma_a\rvert}{1-\lvert\Gamma_a\rvert}$ |
| Inductive degeneration | $Z_{in} = \omega_TL_s+j(\omega L_s-\frac1{\omega C_{gs}})$, $L_s = Z_0/\omega_T$, $Q = \frac{\omega L_gC_{gs}}{g_mL_s}$ |
| Distributed amp | $G = \frac{g_m^2Z_dZ_g}{4}\frac{(e^{-Na}-e^{-Nb})^2}{(e^{-a}-e^{-b})^2}$, $a = \frac{\omega^2R_iC_{gs}^2Z_g}{2}$, $b = \frac{Z_d}{2R_{ds}}$, $N_{opt} = \frac{\ln(a/b)}{a-b}$ |
| Efficiency | $\eta = P_{out}/P_{DC}$, PAE $= \eta(1-1/G)$, $G_1 = G_0-1$ dB |
| Class limits | A: 50%; B: $\pi/4 = 78.5\%$; C: → 100% |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20). Ch. 12 Microwave Amplifier Design, pp. 558–605: §12.1 two-port power gains (Eqs. 12.1–12.18, Ex. 12.1); §12.2 stability (stability circles, K-Δ and μ tests, Ex. 12.2); §12.3 single-stage design (conjugate match Ex. 12.3; constant-gain circles and unilateral figure of merit, Ex. 12.4; noise circles and LNA, Ex. 12.5; inductively degenerated MOSFET LNA, Ex. 12.6); §12.4 broadband (balanced Ex. 12.7, distributed Ex. 12.8, differential); §12.5 power amplifiers (efficiency, PAE, classes, large-signal characterisation and load-pull, Table 12.1, class A design Ex. 12.9); Problems 12.1–12.22.
- **ECE 373 lecture binder** (Waterloo, Boumaiza; scanned): stability pp. 175–185 (definitions, circles, K, $B_1$, loop-resistance rule, resistive-loading example at 800 MHz); power gains pp. 186–189; unilateral gain circles pp. 190–198 (800 MHz example, potentially unstable unilateral case); unilateral figure of merit p. 199; simultaneous conjugate match pp. 200–207 (6 GHz GaAs FET); bilateral gain circles pp. 208–212; $G_P$/$G_A$ circles pp. 213–226 (6 GHz $G_P = 9$ dB, 8 GHz potentially unstable $G_P = 10$ dB); noise and LNA pp. 227–256 (noise figure review, bias dependence p. 242, noise-parameter measurement p. 243, noise circles pp. 244–248, Example 1 HP AN 967 pp. 249–252, Example 2 AT-41470 pp. 253–256). The binder has no power-amplifier lectures.
- **Worked problems:** `Notes/ElectroMagnetisim/Exam Prep - Problems through Stability.md` §P (PS4 Q3–Q4, Stability–Cascading P1–P2) and §6–6b (Pozar 12.1–12.14, binder 800 MHz, 6 GHz and 8 GHz examples).
- **Computed here** (not printed in the sources): Ex. 12.2 μ′; Ex. 12.5 lumped matching networks, ABCD cascade check and input return loss; Ex. 12.8 gain curves; Ex. 12.9 $\Gamma_{MS}$, $\Gamma_{ML}$ angles; the $|\Gamma_a|$ identity; class A/B efficiency derivations.
