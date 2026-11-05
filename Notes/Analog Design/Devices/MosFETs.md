---
title: MosFETs
description: The MOSFET from switch to square law to small-signal model to short-channel reality, ending in gm/ID lookup-table sizing and layout.
kind: topic
status: growing
aliases:
  - MosFETs
  - MOSFET
---

The following section treats the MosFET as a black box first, and every section after that opens the box one level further, until we reach semiconductor physics and the simulation models that give the highest-accuracy picture of the device. Stop after any section and you still have a correct (just coarser) model.

## The big picture

```tikz title="The MOSFET on one screen: a voltage-controlled current. Below V_TH it is (nearly) off; with small V_DS it is a resistor (triode); past V_DS = V_GS - V_TH it is a current source (saturation). After Razavi Figs. 2.11, 2.15, 2.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (-2.6,2.2) node[nmos](M){};
  \node[left] at (M.G) {$G$};
  \node[above] at (M.D) {$D$};
  \node[below] at (M.S) {$S$};
  \draw[->] ([xshift=0.35cm]M.D) -- ++(0,-0.5) node[right] {$I_D$};
  \draw[->] (0,0) -- (7.6,0) node[right] {$V_{DS}$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$I_D$};
  \foreach \v/\n in {1/1,1.5/2,2/3} {
    \draw[thick,domain=0:\v,samples=30] plot (\x,{0.8*(2*\v*\x-\x*\x)});
    \draw[thick] (\v,{0.8*\v*\v}) -- (7,{0.8*\v*\v*(1+0.04*(7-\v))}) node[right] {\scriptsize $V_{OV\n}$};
  }
  \draw[dashed,domain=0:2.3,samples=30] plot (\x,{0.8*\x*\x});
  \node[anchor=west,font=\scriptsize] at (2.3,4.25) {$V_{DS}=V_{GS}-V_{TH}$};
  \node[font=\scriptsize] at (0.75,4.25) {triode};
  \node[font=\scriptsize] at (6.4,4.25) {saturation};
  \node[font=\scriptsize,anchor=west] at (2.4,0.3) {cutoff ($V_{GS}<V_{TH}$): $I_D\approx 0$ on this axis};
  \node[font=\scriptsize,anchor=west] at (3.2,2.6) {slope $=1/r_o$};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **On/off:** a channel forms when $V_{GS} > V_{TH}$. Saturation needs $V_{DS} \ge V_{OV} = V_{GS}-V_{TH}$.
> 2. **Square law (saturation):** $I_D = \tfrac12 \mu_n C_{ox}\tfrac{W}{L}V_{OV}^2(1+\lambda V_{DS})$.
> 3. **Small signal:** $g_m = 2I_D/V_{OV}$, $r_o = 1/(\lambda I_D)$, intrinsic gain $g_m r_o = 2/(\lambda V_{OV})$.
> 4. **Speed vs gain:** $f_T \propto \mu V_{OV}/L^2$ but $g_m r_o \propto L/V_{OV}$. Short and hot is fast; long and cool has gain.
> 5. **Real (short-channel) devices** break the square law. Design with $g_m/I_D$ (3 to 30 S/A in any process) and $I_D/W$ from simulated lookup tables.

**Map:** [[#Level 0 The Switch Model|switch]] → [[#Level 1 The Square-Law Model|square law]] → [[#MosFET Properties / Important Variables|$g_m$, $r_o$, small-signal model]] → [[#Second-Order Effects|body effect, CLM, subthreshold]] → [[#Deep-Submicron Effects|velocity saturation, mobility]] → [[#Short-Channel Effects|$V_{TH}$ roll-off, DIBL]] → [[#Scaling Theory|scaling]] → [[#Capacitances|capacitances, $f_T$]] → [[#gm/ID and ID/W Simulation-Aided Design|models, corners, $g_m/I_D$]] → [[#Layout|layout]].

## Level 0: The Switch Model

![|640](assets/Pasted%20image%2020261102083436.png)

```tikz title="Switch model: the gate picks between two resistances. After Razavi Sec. 2.1.1 and Eq. (2.11)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,0) node[nmos](M){};
  \node[left] at (M.G) {$V_G$};
  \node[above] at (M.D) {$D$};
  \node[below] at (M.S) {$S$};
  \node at (1.4,0) {$\Longrightarrow$};
  \draw (3,1) node[above] {$D$} to[R, l=$R_{on}$] (3,-1) node[below] {$S$};
  \node[align=center,font=\scriptsize] at (3,-1.9) {$V_G=V_{DD}$\\ closed (conducting)};
  \draw (6,1) node[above] {$D$} to[nos] (6,-1) node[below] {$S$};
  \node[align=center,font=\scriptsize] at (6,-1.9) {$V_G=0$\\ open ($R\to\infty$)};
\end{circuitikz}
\end{document}
```

The gate only ever sits at two values: $V_{DD}$ (drain–source resistance as small as possible) or $0$ (as large as possible).

> [!tip] Remark
> An NMOS is **active-high**: $V_G = V_{DD}$ closes it (conducts). A PMOS is **active-low**: $V_G = 0$ closes it.

**This model is used often by Digital Designers and PCB Designers.** It leaves open exactly the questions the rest of the note answers: at what $V_G$ does it turn on, what is $R_{on}$, is $R_{on}$ linear, and what limits the speed?

## Level 1: The Square-Law Model

This is the model that is most used academically. It is not the most accurate (it holds for channel lengths of several microns), but it explains almost every property of the device you need for intuition.

### Structure

![](assets/Pasted%20image%2020261102083728.png)

$$
\boxed{L_{eff} = L_{drawn} - 2L_D}
$$

> [!tip] Remark
> The source/drain dopants **side-diffuse** under the gate by $L_D$ during fabrication, so the real channel ($L_{eff}$) is shorter than the gate you drew. Everywhere below, $L$ means $L_{eff}$.

![](assets/Pasted%20image%2020261102084118.png)

PMOS is NMOS with every doping type flipped (including the substrate). On one wafer the PMOS sits in its own **n-well**. Keep every S/D junction reverse-biased:

- NMOS bulk (the shared p-substrate) → most negative supply.
- PMOS n-well → most positive supply. Each PFET can have its own well; NFETs all share one substrate.

![](assets/Pasted%20image%2020261102084101.png)

Device fabrication properties:

| Symbol | Meaning |
|---|---|
| $C_{ox} = \varepsilon_{ox}/t_{ox}$ | Gate-oxide capacitance **per unit area** ($\approx 17.25\ \mathrm{fF/\mu m^2}$ at $t_{ox}\approx 20\ \text{Å}$, scale inversely with $t_{ox}$) |
| $t_{ox}$ | Oxide thickness |
| $L_{eff}$ | Effective length, used in all calculations |
| $W$ | Width of the device |
| $\mu$ | Carrier mobility ($\mu_n$ NMOS, $\mu_p$ PMOS; $\mu_pC_{ox}\approx 0.5\,\mu_nC_{ox}$) |

### Threshold Voltage

$$
\boxed{V_{TH} = \Phi_{MS} + 2\phi_F + \frac{Q_{dep}}{C_{ox}}}
$$

Below $V_{TH}$ the gate only pushes holes away (a depletion region, no carriers, no current). Above it, electrons flood the surface and form a **channel** (inversion layer) from source to drain. Your minimum takeaway: **there is a minimum voltage $V_{TH}$ that turns the MosFET on; below it, it is (to first order) off.** Most academic work gives you $V_{TH}$ as a number.

> [!note]- Derivation: where the three terms of $V_{TH}$ come from (optional)
> The whole point of how a MosFET works is creating a channel between source and drain:
> ![](assets/Pasted%20image%2020261102084407.png)
> Does any gate voltage create that channel? No. Gate, oxide, and substrate form a capacitor; raising $V_G$ first uncovers negative ions (depletion), and the surface potential rises like the middle node of a capacitive divider:
>
> ```tikz title="Gate-to-surface divider: C_ox in series with the depletion capacitance. After Razavi Fig. 2.6(c)."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[font=\small]
>   \draw (0,3) node[ocirc]{} node[left] {$V_G$} to[C, l=$C_{ox}$] (0,1.5) node[circ]{} to[C, l=$C_{dep}$] (0,0) node[ground]{};
>   \draw (0,1.5) -- (1.4,1.5) node[right] {surface potential $\psi_s$};
> \end{circuitikz}
> \end{document}
> ```
>
> Threshold is *defined* as the gate voltage at which the surface is as n-type as the bulk is p-type. Each term is one voltage drop on the way there:
> - $\Phi_{MS}$: the work-function difference between the gate and the substrate. Here the gate is polysilicon, so it is the poly-gate-to-silicon-substrate difference, the voltage you must apply just to flatten the bands.
> - $2\phi_F$: the band bending the surface needs. $\phi_F = \frac{kT}{q}\ln\frac{N_{sub}}{n_i}$ is the **Fermi potential**, the distance (in volts) between the bulk Fermi level and the intrinsic level. Bending the surface by $\phi_F$ makes it intrinsic; by $2\phi_F$ makes it as n-type as the bulk is p-type.
> - $\frac{Q_{dep}}{C_{ox}}$: the voltage across the oxide needed to hold the charge that mirrors the depletion region, $Q_{dep} = \sqrt{4q\varepsilon_{si}|\phi_F|N_{sub}}$.
>
> Constants: $k = 1.38\times10^{-23}\ \mathrm{J/K}$, $q = 1.602\times10^{-19}\ \mathrm{C}$ (the electron charge; $4\pi\times10^{-7}$ is the permeability $\mu_0$, a different constant), $\varepsilon_{si} = 11.8\times 8.85\times10^{-14}\ \mathrm{F/cm}$, $n_i$ = electron density of undoped silicon.
>
> **Neamen's fuller form** adds trapped oxide charge $Q'_{ss}$ (Razavi neglects it): $V_{TN} = \frac{|Q'_{SD}(\max)|}{C_{ox}} + V_{FB} + 2\phi_{fp}$ with $V_{FB} = \phi_{ms} - Q'_{ss}/C_{ox}$.
>
> In practice the "native" $V_{TH}$ is not what you want, so the fab sets it by implanting dopants into the channel area (a thin $p^+$ sheet raises an NFET's $V_{TH}$). PMOS: same story with every polarity reversed; its $V_{TH}$ is negative.

### Regions of Operation

```tikz title="Region map on the V_GS-V_DS plane. After Razavi Fig. 2.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.4,0) node[right] {$V_{GS}$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$V_{DS}$};
  \draw[thick] (1,0) -- (1,3.9);
  \draw[thick] (1,0) -- (4.6,3.6);
  \node[anchor=south,font=\scriptsize] at (4.6,3.65) {$V_{DS}=V_{GS}-V_{TH}$};
  \node[below] at (1,0) {$V_{TH}$};
  \node at (0.5,2.2) {off};
  \node at (2.0,3.0) {saturation};
  \node at (3.7,1.1) {triode};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Triode } (V_{DS} < V_{OV}):\quad I_D = \mu_nC_{ox}\frac{W}{L}\left[V_{OV}V_{DS} - \tfrac12 V_{DS}^2\right]}
$$

$$
\boxed{\text{Saturation } (V_{DS} \ge V_{OV}):\quad I_D = \tfrac12\mu_nC_{ox}\frac{W}{L}V_{OV}^2, \qquad V_{D,sat} = V_{GS}-V_{TH}}
$$

$$
\boxed{\text{Deep triode } (V_{DS} \ll 2V_{OV}):\quad R_{on} = \frac{1}{\mu_nC_{ox}\frac{W}{L}V_{OV}}}
$$

> [!tip] Remark
> $R_{on}$ is the resistor in the [[#Level 0 The Switch Model|switch model]]: a deep-triode MOSFET is a resistor whose value the overdrive sets. Unlike a BJT, a MOSFET can be fully on while carrying zero current.

- $V_{OV} = V_{GS}-V_{TH}$ is the **overdrive**; $W/L$ is the **aspect ratio**.
- Every volt of $V_{OV}$ is a volt of headroom the drain cannot swing into ($V_{D,sat}$).
- Quick region test without knowing the source: an NFET is saturated when $V_G - V_D < V_{TH}$ (the gate can't invert the drain end).
- **PMOS:** same equations with $\mu_p$, a minus sign on $I_D$, and $V_{GS}, V_{DS}, V_{TH}, V_{OV}$ all negative.
- A saturated MOSFET is a current source with one grounded end: NMOS sinks into ground, PMOS sources from $V_{DD}$.

> [!note]- Derivation: the square law from charge × velocity
> **Lemma.** A bar carrying mobile charge $Q_d$ (C/m) moving at $v$ (m/s) carries $I = Q_d\,v$: everything within $v$ meters crosses a cross-section each second.
>
> ```tikz title="Channel charge thins toward the drain (left); past V_DS = V_OV it pinches off before the drain (right). After Razavi Figs. 2.10 and 2.16."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[>=stealth,font=\small]
>   \foreach \ox/\pin/\lab in {0/3.8/{$V_{DS}<V_{OV}$: triode},6.2/3.1/{$V_{DS}>V_{OV}$: saturation}} {
>     \begin{scope}[xshift=\ox cm]
>       \draw (0,0) rectangle (5,2);
>       \draw[fill=gray!25] (0,2) -- (0,1.3) -- (1.2,1.3) -- (1.2,2);
>       \draw[fill=gray!25] (3.8,2) -- (3.8,1.3) -- (5,1.3) -- (5,2);
>       \node[font=\scriptsize] at (0.6,1.6) {$n^+$};
>       \node[font=\scriptsize] at (4.4,1.6) {$n^+$};
>       \draw[fill=gray!10] (1.2,2) rectangle (3.8,2.12);
>       \draw[fill=gray!60] (1.2,2.12) rectangle (3.8,2.4);
>       \fill[black!75] (1.2,2) -- (\pin,2) -- (\pin,1.97) -- (1.2,1.8) -- cycle;
>       \node[font=\scriptsize] at (0.6,2.25) {$S$};
>       \node[font=\scriptsize] at (4.4,2.25) {$D$};
>       \node[font=\scriptsize] at (2.5,2.6) {$G$};
>       \draw[->] (1.2,0.75) -- (4.2,0.75) node[right,font=\scriptsize] {$x$};
>       \node[below,font=\scriptsize] at (1.2,0.75) {$0$};
>       \node[font=\scriptsize] at (4.4,0.3) {p-sub};
>       \node[font=\scriptsize] at (2.5,-0.4) {\lab};
>     \end{scope}
>   }
>   \node[below,font=\scriptsize] at (3.8,0.75) {$L$};
>   \node[below,font=\scriptsize] at (9.3,0.75) {$L'$};
>   \draw[->] (9.3,1.2) -- (9.3,1.9);
>   \node[font=\scriptsize] at (9.3,1.05) {pinch-off};
> \end{circuitikz}
> \end{document}
> ```
>
> **Charge.** Above threshold the gate charge is mirrored in the channel. With source and drain both grounded, $Q_d = WC_{ox}(V_{GS}-V_{TH})$. With $V_{DS}>0$ the channel potential rises from $0$ to $V_{DS}$, so the local gate-to-channel voltage shrinks toward the drain:
> $$Q_d(x) = WC_{ox}\left[V_{GS} - V(x) - V_{TH}\right]$$
> **Velocity.** $v = \mu_n E = \mu_n\,dV/dx$. So
> $$I_D = WC_{ox}\left[V_{GS}-V(x)-V_{TH}\right]\mu_n\frac{dV}{dx}$$
> **Integrate** with $I_D$ constant along the channel, $V(0)=0$, $V(L)=V_{DS}$:
> $$\int_0^L I_D\,dx = \int_0^{V_{DS}} WC_{ox}\mu_n\left[V_{GS}-V-V_{TH}\right]dV \;\Rightarrow\; I_D = \mu_nC_{ox}\frac{W}{L}\left[(V_{GS}-V_{TH})V_{DS}-\tfrac12V_{DS}^2\right]$$
> **Saturation.** $\partial I_D/\partial V_{DS} = 0$ at $V_{DS} = V_{OV}$: that is where $Q_d(L)$ hits zero, the channel **pinches off**. Past it, carriers reach the pinch-off point at $L'$ (where $V = V_{OV}$) and shoot through the drain depletion region. Integrating only up to $L'$ and $V_{OV}$ gives $I_D = \frac12\mu_nC_{ox}\frac{W}{L'}V_{OV}^2$, flat in $V_{DS}$ as long as $L'\approx L$.
>
> Assumptions to remember (they all fail later): $\mu_n$ and $V_{TH}$ constant along the channel and independent of the terminal voltages, $v = \mu E$ (no velocity limit), current by drift only.

## MosFET Properties / Important Variables

### Transconductance

$$
\boxed{g_m = \left.\frac{\partial I_D}{\partial V_{GS}}\right|_{V_{DS}} = \mu_nC_{ox}\frac{W}{L}V_{OV} = \sqrt{2\mu_nC_{ox}\frac{W}{L}I_D} = \frac{2I_D}{V_{OV}}}
$$

```tikz title="Which g_m formula to read depends on what is held fixed. After Razavi Fig. 2.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\xl/\fix/\form in {0/{$V_{OV}$}/{$W/L$ fixed}/{$\mu C_{ox}\tfrac WL V_{OV}$},4.2/{$I_D$}/{$W/L$ fixed}/{$\sqrt{2\mu C_{ox}\tfrac WL I_D}$},8.4/{$V_{OV}$}/{$I_D$ fixed}/{$2I_D/V_{OV}$}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (0,0) -- (3.1,0) node[right] {\xl};
      \draw[->] (0,0) -- (0,2.5) node[above] {$g_m$};
      \node[font=\scriptsize] at (1.5,-0.45) {\fix};
      \node[font=\scriptsize] at (1.7,2.75) {\form};
    \end{scope}
  }
  \draw[thick] (0,0) -- (2.7,2.2);
  \draw[thick,domain=0:2.7,samples=40] plot ({4.2+\x},{1.3*sqrt(\x)});
  \draw[thick,domain=0.33:2.7,samples=40] plot ({8.4+\x},{0.72/\x});
\end{circuitikz}
\end{document}
```

$g_m$ is how well the device turns a voltage change into a current change (units S, i.e. 1/Ω).

> [!tip] Remark
> $g_m$ in saturation, $\mu_nC_{ox}\frac WL V_{OV}$, is exactly $1/R_{on}$ from [[#Regions of Operation|deep triode]]. Same device, same overdrive.

- The $I_D$ and $V_{OV}$ in these formulas are **bias** values; small-signal analysis assumes the signal doesn't move them.
- $\sqrt{2\mu C_{ox}(W/L)I_D}$ suggests infinite $g_m$ by widening at fixed $I_D$. Wrong: the device slides into [[#Subthreshold Conduction|weak inversion]] where $g_m$ caps at $I_D/(\xi V_T)$.
- PMOS: $g_m = 2\mu_pC_{ox}(W/L)|I_D|$ under the root, same shapes.

> [!note]- Detail: $g_m$ in triode
> Differentiate the triode equation: $g_m = \mu_nC_{ox}\frac{W}{L}V_{DS}$. It collapses as $V_{DS}$ falls below $V_{OV}$, which is why amplifiers keep their devices saturated (Razavi Ex. 2.3).

### Output Resistance and Intrinsic Gain

$$
\boxed{r_o = \frac{\partial V_{DS}}{\partial I_D} \approx \frac{1}{\lambda I_D}}
\qquad
\boxed{g_m r_o = \frac{2I_D}{V_{OV}}\cdot\frac{1}{\lambda I_D} = \frac{2}{\lambda V_{OV}}}
$$

> [!tip] Remark
> $r_o$ comes from [[#Channel-Length Modulation]] (the $1+\lambda V_{DS}$ tilt), and $\lambda \propto 1/L$.

- $g_m r_o$ is the **intrinsic gain**: the largest voltage gain one transistor can give (common source, ideal current-source load). It caps the gain of most amplifiers ([[Single-Stage]]).
- Two levers: small $V_{OV}$ and long $L$.
- Real short-channel $r_o$ is much lower than $1/(\lambda I_D)$ predicts and varies with $V_{DS}$ (see [[#Output Impedance vs. V_DS]]).

### Small-Signal Models

```tikz title="Low-frequency small-signal model of a saturated MOSFET (NMOS and PMOS alike). After Razavi Fig. 2.37(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,3) node[ocirc]{} node[left] {$G$};
  \node at (0,2.1) {$+$};
  \node at (0,1.5) {$v_{gs}$};
  \node at (0,0.9) {$-$};
  \draw (0,0) node[ocirc]{} node[left] {$S$} -- (7,0);
  \draw (1.5,3) to[cI, l=$g_m v_{gs}$] (1.5,0);
  \draw (4,3) to[cI, l=$g_{mb} v_{bs}$] (4,0);
  \draw (6.5,3) to[R, l=$r_o$] (6.5,0);
  \draw (1.5,3) -- (7.5,3) node[ocirc]{} node[right] {$D$};
  \node[font=\scriptsize,anchor=west] at (7.2,0.5) {$v_{bs}=v_B-v_S$};
\end{circuitikz}
\end{document}
```

Build it by perturbing one terminal voltage at a time and recording the current change:

1. $\Delta V_{GS}$ → current source $g_m v_{gs}$ (gate current ≈ 0, so nothing on the gate side).
2. $\Delta V_{DS}$ through CLM → a current that is linear in its own voltage = resistor $r_o$.
3. $\Delta V_{BS}$ through the body effect → second current source $g_{mb}v_{bs}$ ([[#Body Effect]]). The bulk is a **second gate**; raising $V_B$ acts like raising $V_G$.

> [!tip] Remark
> The PMOS small-signal model is **identical** to the NMOS one. Drawing PMOS upside-down (source on top) makes the arrow *look* reversed; it isn't.

- First pass in any circuit: $g_m$ alone. Add $r_o$ for gain, $g_{mb}$ when the source isn't at AC ground, and the [[#Capacitances]] for frequency response ([[Frequency Response]]).
- A switch (deep triode) is modeled by $R_{on}$ plus its capacitances.
- Each terminal also has series resistance; layout ([[#Layout|folding]]) keeps it small.

## Second-Order Effects

### Body Effect

```tikz title="Threshold rises with source-bulk voltage. Numbers from Razavi Ex. 2.4: V_TH0 = 0.3 V, gamma = 0.4 V^1/2, 2 phi_F = 0.7 V."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.2,0) node[right] {$V_{SB}$ (V)};
  \draw[->] (0,0) -- (0,4.2) node[above] {$V_{TH}$ (V)};
  \foreach \v in {1,2,3} { \draw ({1.5*\v},0.08) -- ({1.5*\v},-0.08) node[below,font=\scriptsize] {\v}; }
  \foreach \y in {0.3,0.5,0.7} { \draw (0.08,{5*\y}) -- (-0.08,{5*\y}) node[left,font=\scriptsize] {\y}; }
  \draw[thick,domain=0:3,samples=40] plot ({1.5*\x},{5*(0.3+0.4*(sqrt(0.7+\x)-sqrt(0.7)))});
  \draw[dashed] (0,1.5) -- (3.3,{5*(0.3+0.239*2.2)});
  \node[font=\scriptsize,anchor=west] at (3.4,4.1) {dashed: tangent, slope $\eta$};
  \node[font=\scriptsize,anchor=west] at (2.6,2.4) {$V_{TH0}+\gamma(\sqrt{2\phi_F+V_{SB}}-\sqrt{2\phi_F})$};
  \node[font=\scriptsize,anchor=west] at (0.1,1.25) {$V_{TH0}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{TH} = V_{TH0} + \gamma\left(\sqrt{2\phi_F + V_{SB}} - \sqrt{2\phi_F}\right),\qquad \gamma = \frac{\sqrt{2q\varepsilon_{si}N_{sub}}}{C_{ox}}}
$$

$$
\boxed{g_{mb} = \eta\, g_m,\qquad \eta = \frac{\gamma}{2\sqrt{2\phi_F + V_{SB}}}\ (\approx 0.25)}
$$

> [!tip] Remark
> This is the $Q_{dep}/C_{ox}$ term of [[#Threshold Voltage|$V_{TH}$]] growing: pulling the bulk below the source widens the depletion region, so the gate must mirror more charge before a channel forms.

- $\gamma$ is typically $0.3$–$0.4\ \mathrm{V^{1/2}}$.
- The bulk needn't move: if the **source** rises above a fixed substrate (source follower, cascode), $V_{TH}$ rises too. A follower's $V_{in}-V_{out}$ grows with $V_{in}$ ([[Single-Stage]]).
- $V_{SB} < 0$ (forward body bias) **lowers** $V_{TH}$, useful at low supply. Practical only for PFETs in their own well (or a deep n-well NFET), and $|V_{SB}|$ is limited to about 300 mV before the junctions conduct (ECE 636).
- $\eta$ shrinks as $V_{SB}$ grows: the incremental body effect weakens.

### Channel-Length Modulation

```tikz title="Saturated characteristics tilt; extrapolated back they meet the V_DS axis near -1/lambda. After Razavi Fig. 2.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-3.6,0) -- (6.0,0) node[right] {$V_{DS}$};
  \draw[->] (0,0) -- (0,3.8) node[above] {$I_D$};
  \foreach \i/\v/\k in {1/0.8/1.979,1.8/1.1/2.033} {
    \draw[thick,domain=0:\v,samples=30] plot (\x,{0.7*\k*(2*\v*\x-\x*\x)});
    \draw[thick] (\v,{0.7*\i*(1+\v/3)}) -- (5.3,{0.7*\i*(1+5.3/3)});
    \draw[dashed] (-3,0) -- (\v,{0.7*\i*(1+\v/3)});
  }
  \node[below,font=\scriptsize] at (-3,0) {$-1/\lambda=-V_A$};
  \draw (-3,0.08) -- (-3,-0.08);
  \node[font=\scriptsize,anchor=west] at (0.2,3.1) {slope $=1/r_o\approx\lambda I_D$};
  \node[font=\scriptsize,anchor=west] at (5.35,{0.7*1.8*(1+5.3/3)}) {$V_{GS2}$};
  \node[font=\scriptsize,anchor=west] at (5.35,{0.7*(1+5.3/3)}) {$V_{GS1}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_D = \tfrac12\mu_nC_{ox}\frac{W}{L}V_{OV}^2\left(1+\lambda V_{DS}\right)}
$$

Past pinch-off, raising $V_{DS}$ pushes the pinch-off point toward the source, so the effective length $L' = L-\Delta L$ shrinks and the current creeps up. Model $\Delta L/L = \lambda V_{DS}$.

- $\lambda \propto 1/L$: long devices are better current sources.
- No CLM in triode (no pinch-off).
- $V_{OV}$ sets the current; $V_{DS}$ is never used to set it. Its effect is an error you budget for ([[Current Mirrors]]).

> [!note]- Detail: what doubling $L$ buys (Razavi Ex. 2.7)
> At fixed $V_{OV}$ and $W$: $\partial I_D/\partial V_{DS} \propto \lambda/L \propto 1/L^2$, so doubling $L$ quarters the slope, but halves the current. Restore the current by doubling $W$ (which doubles the slope back): **for a required $I_D$ and $V_{OV}$, doubling $L$ halves the slope** (doubles $r_o$), at the cost of $4\times$ gate area.

> [!note]- Detail: the triode/saturation discontinuity
> At the region edge the triode equation gives $\frac12\mu_nC_{ox}\frac WL V_{OV}^2$ and the saturation one gives that times $(1+\lambda V_{DS})$. The jump is an artifact of bolting $\lambda$ on; simulator models remove it (Level 1 multiplies both regions by $1+\lambda V_{DS}$).

### Subthreshold Conduction

```tikz title="Below V_TH the current does not vanish: it falls exponentially, one decade per S of gate voltage. After Razavi Fig. 2.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.6,0) node[right] {$V_{GS}$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$\log I_D$};
  \draw[thick] (0,0.4) -- (2.5,2.9);
  \draw[thick] plot[smooth] coordinates {(2.5,2.9) (3,3.27) (3.5,3.52) (4,3.72) (4.5,3.87) (5.2,4.02)};
  \draw[dashed] plot[smooth] coordinates {(2.62,0.6) (2.75,1.6) (3,2.45) (3.5,3.2) (4,3.6) (4.5,3.85)};
  \draw[dashed] (2.5,0) -- (2.5,2.9);
  \node[below] at (2.5,0) {$V_{TH}$};
  \draw (0.9,1.3) -- (1.9,1.3) -- (1.9,2.3);
  \node[below,font=\scriptsize] at (1.4,1.3) {$S$};
  \node[right,font=\scriptsize] at (1.9,1.8) {1 dec};
  \node[font=\scriptsize,align=center] at (1.0,3.4) {weak inversion\\ exponential (diffusion)};
  \node[font=\scriptsize,anchor=west] at (3.3,1.4) {square law (dashed)};
  \node[font=\scriptsize,anchor=west] at (3.2,4.3) {strong inversion (drift)};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_D = I_0\exp\frac{V_{GS}}{\xi V_T},\qquad g_m = \frac{I_D}{\xi V_T}}\qquad (V_{DS}\gtrsim 100\ \mathrm{mV},\ V_T = kT/q,\ I_0\propto W/L)
$$

$$
\boxed{S = 2.3\,V_T\left(1+\frac{C_d}{C_{ox}}\right)\ \mathrm{V/dec}\ \ \ge\ 2.3\,V_T \approx 60\ \mathrm{mV/dec}}
$$

$$
\boxed{\text{weak/strong boundary: } V_{OV} \approx 2\xi V_T \approx 80\ \mathrm{mV}}
$$

> [!tip] Remark
> Three books, one number. Razavi's $\xi$ (Ch. 2), Razavi's $\zeta = 1+C_d/C_{ox}$ (Ch. 17), and Jespers & Murmann's slope factor $n$ are the same thing: the [[#Threshold Voltage|$C_{ox}$–$C_{dep}$ divider]] that lets the gate move the surface by only $1/n$ of its own swing. Typical $n$: 1.2 to 1.5.

- Below threshold the carriers move by **diffusion**, like a BJT, hence the exponential.
- Typical slope: about 80 mV/dec at room temperature (Razavi), 80–100 mV/dec in practice (ECE 636). 60 mV/dec is the ideal floor ($n=1$).
- $g_m/I_D = 1/(\xi V_T)$ is the **highest** $g_m$ per amp a MOSFET can reach, still below a BJT's $1/V_T$. This is the ceiling of the [[#Why gm/ID, why ID/W|$g_m/I_D$]] curve.
- The boundary comes from equating the two $g_m/I_D$ expressions: $I_D/(\xi V_T) = 2I_D/V_{OV}$.
- Weak inversion is high-gain but slow: it needs a huge $W$ or tiny $I_D$.
- Which region? Compute $V_{GS}$ from both laws and take the **lower** one. At fixed $I_D$, widening the device drops it from strong into weak inversion (Razavi Ex. 2.8).

> [!note]- Detail: why subthreshold leakage matters (Razavi p. 24)
> With $V_{TH} = 0.3$ V and 80 mV/dec, pulling $V_{GS}$ from $V_{TH}$ to 0 cuts the current only by $10^{0.3/0.08} \approx 5.6\times10^3$. If each device carries 1 µA at $V_{GS}=V_{TH}$, 100 million "off" devices still draw about 18 mA. The same exponential sets a floor on $V_{TH}$ (see [[#Threshold-Voltage Variation]]).

> [!note]- Detail: voltage limits
> Too much $V_{GS}$ breaks the gate oxide down irreversibly. Too much $V_{DS}$ on a short device lets the drain depletion region reach the source (**punchthrough**), and the current runs away. Below breakdown, overstress can still shift the characteristics permanently ([[#Hot-Carrier Effects]]).

## Deep-Submicron Effects

Both effects below attack the same assumption from the [[#Regions of Operation|square-law derivation]]: $v = \mu E$ with constant $\mu$.

### Velocity Saturation

```tikz title="Left: carrier velocity stops tracking the field above E_crit (about 1 V/um). Right: the drain current saturates early, at V_D0 < V_GS - V_TH, and lower. After Razavi Figs. 11.3 and 11.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (4.4,0) node[right] {$E$};
  \draw[->] (0,0) -- (0,3.3) node[above] {$v$};
  \draw[thick,domain=0:4,samples=40] plot (\x,{2.6*\x/(1+\x)});
  \draw[dashed] (0,0) -- (1.1,2.86);
  \draw[dashed] (0,2.6) -- (4.2,2.6);
  \node[left,font=\scriptsize] at (0,2.6) {$v_{sat}\approx10^7$ cm/s};
  \draw (1,0.08) -- (1,-0.08) node[below,font=\scriptsize] {$E_{crit}$};
  \node[font=\scriptsize,anchor=west] at (1.15,2.95) {slope $\mu$};
  \begin{scope}[xshift=6.8cm]
    \draw[->] (0,0) -- (4.8,0) node[right] {$V_{DS}$};
    \draw[->] (0,0) -- (0,3.6) node[above] {$I_D$};
    \draw[thick,dashed,domain=0:2.5,samples=30] plot (\x,{0.5*(5*\x-\x*\x)});
    \draw[thick,dashed] (2.5,3.125) -- (4.5,3.125);
    \draw[thick,domain=0:1.2,samples=30] plot (\x,{0.5*(5*\x-\x*\x)});
    \draw[thick] (1.2,2.28) -- (4.5,2.28);
    \draw[dotted] (1.2,0) -- (1.2,2.28);
    \draw[dotted] (2.5,0) -- (2.5,3.125);
    \node[below,font=\scriptsize] at (1.2,0) {$V_{D0}$};
    \node[below,font=\scriptsize] at (2.5,0) {$V_{GS}-V_{TH}$};
    \node[above,font=\scriptsize] at (3.6,3.15) {without};
    \node[below,font=\scriptsize] at (3.6,2.25) {with velocity saturation};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Fully velocity-saturated: } I_D = WC_{ox}v_{sat}V_{OV},\qquad g_m = WC_{ox}v_{sat}}
$$

> [!tip] Remark
> Same lemma as the [[#Regions of Operation|square-law derivation]], $I = Q_d\,v$, with $v$ frozen at $v_{sat}$ instead of $\mu\,dV/dx$.

L shrank about 25× (1 µm to 40 nm) while $V_{DD}$ fell only about 5× (5 V to 1 V), so the lateral field crossed $E_{crit}$. Three departures from the square law:
1. $I_D$ becomes **linear** in $V_{OV}$ and independent of $L$.
2. $I_D$ saturates **before** pinch-off ($V_{D0} < V_{OV}$).
3. $g_m$ becomes a constant, independent of $I_D$ and $V_{GS}$, and lower than the square law predicts.

Real devices sit between the square law and full velocity saturation.

> [!note]- Derivation: one formula from square law to velocity saturation (Razavi Eqs. 17.26–17.30)
> A compact model for saturation:
> $$I_D = WC_{ox}v_{sat}\frac{V_{OV}^2}{V_{OV} + 2v_{sat}L/\mu_{eff}},\qquad V_{DS,sat} = \frac{2\mu_{eff}L\,V_{OV}}{2\mu_{eff}L + V_{OV}}$$
> If $L$ or $v_{sat}$ is large, the $V_{OV}$ in the denominator is negligible and it collapses to the square law. If $V_{OV}\gg 2v_{sat}L/\mu$, it collapses to $WC_{ox}v_{sat}V_{OV}$.
>
> **How short is short?** With $v_{sat}\approx10^7$ cm/s, $L = 0.25$ µm, $\mu_0\approx350\ \mathrm{cm^2/Vs}$: $2v_{sat}L/\mu_0 \approx 1.43$ V. Overdrives of a few hundred mV are well below that, so even a 0.25 µm device is roughly square-law. That's why Chapter-2 intuition still works.
>
> Substituting $\mu_{eff} = \mu_0/(1+\theta V_{OV})$ from [[#Mobility Degradation with Vertical Field|below]]:
> $$I_D = \frac12\mu_0C_{ox}\frac WL\frac{V_{OV}^2}{1+\left(\dfrac{\mu_0}{2v_{sat}L}+\theta\right)V_{OV}}$$
> Lateral and vertical field degradation **add**: both are one effective $\theta$.

### Mobility Degradation with Vertical Field

```tikz title="Mobility falls with overdrive (left), so g_m bends over instead of rising linearly (right). After Razavi Figs. 11.5 and 11.6, theta = 1/V."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (3.8,0) node[right] {$V_{OV}$};
  \draw[->] (0,0) -- (0,2.9) node[above] {$\mu$};
  \draw[thick,domain=0:3.2,samples=40] plot (\x,{2.4/(1+\x)});
  \node[left,font=\scriptsize] at (0,2.4) {$\mu_0$};
  \node[font=\scriptsize,anchor=west] at (1.1,1.7) {$\mu_0/(1+\theta V_{OV})$};
  \begin{scope}[xshift=6cm]
    \draw[->] (0,0) -- (3.8,0) node[right] {$V_{OV}$};
    \draw[->] (0,0) -- (0,2.9) node[above] {$g_m$};
    \draw[dashed] (0,0) -- (2.6,2.6);
    \draw[thick,domain=0:3.2,samples=40] plot (\x,{4*(0.5*\x*\x+\x)/((1+\x)*(1+\x))});
    \node[font=\scriptsize,anchor=east] at (2.3,2.65) {square law};
    \node[font=\scriptsize,anchor=west] at (2.0,1.55) {real};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\mu_{eff} = \frac{\mu_0}{1+\theta V_{OV}}}
$$

A strong gate field squeezes carriers against the oxide interface; more scattering, lower mobility. $\theta$ grows as $t_{ox}$ shrinks (about 1 V⁻¹ for $t_{ox} = 100$ Å, Razavi).

- Lowers current and $g_m$; $g_m$ tends to a constant $\frac12\mu_0C_{ox}\frac WL/\theta$ at large $V_{OV}$.
- Adds **odd** harmonics: a pure square law only makes even ones ([[Nonlinearity and Mismatch]]).

> [!note]- Derivation: $g_m$ and the cubic term (Razavi Ex. 11.1, Eq. 17.23)
> $I_D = \frac12\frac{\mu_0C_{ox}}{1+\theta V_{OV}}\frac WL V_{OV}^2$ gives
> $$g_m = \mu_0C_{ox}\frac WL\frac{\frac\theta2V_{OV}^2+V_{OV}}{(1+\theta V_{OV})^2}$$
> which is $\mu_0C_{ox}\frac WL V_{OV}$ for $\theta V_{OV}\ll1$ and $\frac12\mu_0C_{ox}\frac WL/\theta$ for $V_{OV}\gg 2/\theta$.
> For $\theta V_{OV}\ll 1$: $I_D \approx \frac12\mu_0C_{ox}\frac WL\left[V_{OV}^2 - \theta V_{OV}^3\right]$. The cubic term is the odd-order distortion.

### Hot-Carrier Effects

At high lateral field the *average* velocity saturates but individual carriers keep gaining energy ("hot"). Near the drain they ionize silicon atoms: the new holes leave through the substrate (a drain-to-bulk current), and the most energetic carriers tunnel into the oxide (gate current, slow damage).

- Below about 1 V supply this has largely faded: making an electron-hole pair takes $E_g \approx 1.12$ eV, which a carrier can't gain falling through 1 V.
- Avoiding it is one reason supply voltages had to scale down.

### Output Impedance vs. V_DS

```tikz title="r_o is not constant in saturation. After Razavi Fig. 17.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.2,0) node[right] {$V_{DS}$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$r_o$};
  \draw[thick] plot[smooth] coordinates {(0.5,0.4) (1,1.5) (1.5,2.2) (2,2.6) (2.8,2.8) (3.6,2.85) (4.2,2.7) (4.8,2.0) (5.3,0.9)};
  \draw[dotted] (1.9,0) -- (1.9,3.3);
  \draw[dotted] (4.2,0) -- (4.2,3.3);
  \node[font=\scriptsize] at (1.0,3.3) {CLM};
  \node[font=\scriptsize] at (3.05,3.3) {CLM + DIBL};
  \node[font=\scriptsize,align=center] at (5.1,3.3) {impact\\ ionization};
\end{circuitikz}
\end{document}
```

1. **CLM alone:** as $V_{DS}$ grows, the depletion region near the drain widens more slowly (like a reverse-biased junction), so $r_o$ **rises**.
2. **DIBL** (next section) adds current with $V_{DS}$, roughly cancelling the rise: flat $r_o$.
3. **Impact ionization** at high $V_{DS}$ sends a drain-to-substrate current: $r_o$ **falls**.

- A varying $r_o$ makes gain depend on output level: distortion in op amps.
- Impact ionization puts a resistance from drain to *substrate*, not source, which caps cascode gain ([[Single-Stage#Cascode]]).

> [!note]- Detail: the CLM-only formula (Razavi Eq. 17.31)
> $$r_o = \frac{2L}{I_D}\left(1-\frac{\Delta L}{L}\right)\sqrt{\frac{qN_B}{2\varepsilon_{si}}(V_{DS}-V_{DS,sat})}$$
> It grows like $\sqrt{V_{DS}-V_{DS,sat}}$: region 1 of the plot.

## Short-Channel Effects

Root cause: the source and drain depletion regions reach far enough into the channel to share control of it with the gate.

### Threshold-Voltage Variation

```tikz title="V_TH versus channel length. Without halo implants V_TH rolls off at short L (charge sharing). With halo implants it does the reverse (reverse short-channel effect). After Razavi Figs. 17.5 and 17.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.6,0) node[right] {$L$};
  \draw[->] (0,0) -- (0,4) node[above] {$V_{TH}$};
  \draw[dashed] (0,2.3) -- (6.3,2.3);
  \node[font=\scriptsize,anchor=south east] at (6.3,2.3) {long-channel $V_{TH}$};
  \draw[thick,domain=0.5:6.2,samples=50] plot (\x,{2.3-1.6*exp(-(\x-0.5)/0.8)});
  \draw[thick,domain=0.5:6.2,samples=50] plot (\x,{2.3+1.2*exp(-(\x-0.5)/1.1)});
  \draw (0.5,0.08) -- (0.5,-0.08) node[below,font=\scriptsize] {$L_{min}$};
  \node[font=\scriptsize,anchor=west] at (0.7,0.55) {no halo: charge sharing, roll-off};
  \node[font=\scriptsize,anchor=west] at (1.0,3.55) {halo implant: reverse short-channel effect};
\end{circuitikz}
\end{document}
```

**Roll-off (charge sharing).** Part of the depletion charge under the gate is now imaged by the source and drain, not the gate. Less for the gate to mirror, lower $V_{TH}$. Since $L$ itself varies in fabrication, so does $V_{TH}$.

**Reverse short-channel effect.** Modern devices put a heavily doped **halo** around the S/D junctions to stop the drain depletion from penetrating. Shorter channel → larger fraction is halo → higher average $N_{sub}$ → **higher** $V_{TH}$. So $V_{TH}$ *falls* as $L$ grows from $L_{min}$.

> [!tip] Remark
> Both effects run through the [[#Threshold Voltage|$V_{TH}$ formula]]: $\phi_F$ and $Q_{dep}$ both grow with $N_{sub}$, and charge sharing shrinks the $Q_{dep}$ the gate must cover.

> [!warning] Design consequence
> Lengthening a device for more $r_o$ can shift its $V_{TH}$ by 100 to 200 mV (Razavi). Don't assume two lengths share a threshold, and don't mirror between different $L$.

**Why $V_{TH}$ can't scale down:**
- $V_{TH} \lesssim V_{DD}/4$ to keep digital gates fast.
- The subthreshold slope doesn't scale: at 80 mV/dec, five decades of on/off ratio needs $V_{TH}\gtrsim 400$ mV.
- $V_{TH}$ drifts about $-1$ mV/K (≈50 mV over 0–50 °C) and about 50 mV with process, so add about 100 mV of margin. (The slope $S$ also worsens as temperature rises.)

### Drain-Induced Barrier Lowering (DIBL)

```tikz title="DIBL: the drain helps the gate invert the channel, so the same V_GS gives more current at large V_DS (lower effective V_TH, more leakage). After Razavi Fig. 17.7(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.6,0) node[right] {$V_{GS}$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$\log I_D$};
  \draw[thick] (0.4,0.3) -- (2.6,2.7) -- plot[smooth] coordinates {(2.6,2.7) (3.3,3.25) (4.2,3.6) (5.2,3.8)};
  \draw[thick,dashed] (1.0,0.3) -- (3.2,2.7) -- plot[smooth] coordinates {(3.2,2.7) (3.8,3.15) (4.5,3.45) (5.3,3.62)};
  \draw[dotted] (2.6,0) -- (2.6,2.7);
  \draw[dotted] (3.2,0) -- (3.2,2.7);
  \node[below,font=\scriptsize] at (2.5,0) {$V_{TH2}$};
  \node[below,font=\scriptsize] at (3.3,0) {$V_{TH1}$};
  \node[font=\scriptsize,anchor=east] at (2.2,2.6) {large $V_{DS}$};
  \node[font=\scriptsize,anchor=west] at (3.0,1.5) {small $V_{DS}$};
\end{circuitikz}
\end{document}
```

In weak inversion the gate raises the surface potential to pull carriers over the source barrier. In a short device the drain does it too, through its own capacitance to the channel. The barrier drops, $V_{TH}$ drops with rising $V_{DS}$.

> [!tip] Remark
> DIBL is why short-channel $r_o$ is low: $I_D$ rises with $V_{DS}$ through $V_{TH}$, not just through CLM. It is region 2 of [[#Output Impedance vs. V_DS|the $r_o$ curve]].

> [!note]- Extension: $g_{ds}$ = a DIBL term + a CLM term (Jespers & Murmann §2.3.5–2.3.7)
> Treat $V_{TH}$ and the specific current $I_S$ as functions of $V_{DS}$, with sensitivities $S_{VT} = \partial V_{TH}/\partial V_{DS}$ (negative: DIBL) and $S_{IS} = \partial\ln I_S/\partial V_{DS}$ (CLM). Then
> $$g_{ds} = -g_m S_{VT} + I_D S_{IS} \quad\Rightarrow\quad g_m r_o = \frac{g_m/I_D}{-S_{VT}(g_m/I_D) + S_{IS}}$$
> At high $g_m/I_D$ (weak inversion) on a very short channel, the DIBL term dominates and $g_m r_o \to 1/(-S_{VT})$: **bias can't buy more gain, only length can.** For their 60 nm device $S_{VT}\approx -0.080$, so $g_m r_o\approx 12.5$ (about 22 dB) nearly independent of $g_m/I_D$.

## Scaling Theory

```tikz title="Constant-field (Dennard) scaling: shrink every dimension and voltage by alpha, raise doping by alpha. After Razavi Fig. 17.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (5,2);
  \draw[fill=gray!25] (0,2) -- (0,1.2) -- (1.3,1.2) -- (1.3,2);
  \draw[fill=gray!25] (3.7,2) -- (3.7,1.2) -- (5,1.2) -- (5,2);
  \draw[fill=gray!60] (1.3,2.15) rectangle (3.7,2.5);
  \draw[<->] (1.3,2.75) -- (3.7,2.75) node[midway,above,font=\scriptsize] {$L$};
  \node[font=\scriptsize] at (2.5,0.6) {$N_{sub}$, $V_{DD}$, $t_{ox}$};
  \node at (6.1,1.2) {$\xrightarrow{\ \div\alpha\ }$};
  \begin{scope}[xshift=7.2cm]
    \draw (0,1) rectangle (2.5,2);
    \draw[fill=gray!45] (0,2) -- (0,1.6) -- (0.65,1.6) -- (0.65,2);
    \draw[fill=gray!45] (1.85,2) -- (1.85,1.6) -- (2.5,1.6) -- (2.5,2);
    \draw[fill=gray!60] (0.65,2.075) rectangle (1.85,2.25);
    \draw[<->] (0.65,2.5) -- (1.85,2.5) node[midway,above,font=\scriptsize] {$L/\alpha$};
    \node[font=\scriptsize,align=left,anchor=west] at (-0.2,0.4) {$\alpha N_{sub}$, $V_{DD}/\alpha$, $t_{ox}/\alpha$};
  \end{scope}
\end{circuitikz}
\end{document}
```

Dennard (1974): scale all lateral and vertical dimensions, $V_{TH}$ and $V_{DD}$ by $1/\alpha$, doping by $\alpha$. Every internal field stays the same ("constant-field").

| Quantity | Ideal scaling |
|---|---|
| $W, L, t_{ox}, V_{DD}, V_{TH}$, junction depth | $1/\alpha$ |
| Doping, $C_{ox}$, $\lambda$ | $\alpha$ |
| $I_D$ (per device), every capacitance | $1/\alpha$ |
| Gate delay $CV_{DD}/I$ | $1/\alpha$ |
| Power per gate at fixed $f$ ($fCV_{DD}^2$) | $1/\alpha^3$ |
| Density | $\alpha^2$ |
| $g_m$, $r_o$, $g_mr_o$ | constant |
| Signal swing (dynamic range, thermal-noise-limited) | $1/\alpha$ |

> [!important] Scaling is good for digital, not analog
> Digital gets speed, power, density. Analog gets a smaller swing at the same noise. Restoring the dynamic range takes $\alpha\times$ more $I_D$, $\alpha\times$ wider devices, so **constant power** and **$\alpha\times$ more device capacitance**.

> [!tip] Remark
> Ideal scaling keeps $g_mr_o$ constant. Real $g_mr_o$ has dropped a lot, because of the [[#Short-Channel Effects]] (DIBL above all) that ideal scaling ignores.

> [!note]- Detail: why reality deviated
> Five things refuse to scale (Razavi §17.2): $V_{DD}$ fell slower than dimensions (fields grew); the junction built-in potential neither scales nor is negligible; S/D junction depth is hard to reduce; mobility falls as doping rises; and the subthreshold slope is fixed. Example: from 1 µm to 0.25 µm, $V_{DD}$ went 5 V → 2.5 V and $V_{TH}$ 0.8 V → 0.4 V, not $4\times$ each. The opposite extreme, **constant-voltage scaling** (dimensions $1/\alpha$, voltages fixed), raises fields by $\alpha$ and worsens breakdown and short-channel effects. Real nodes followed a mixture of the two.
>
> If the noise floor is $kT/C$ instead (switched-capacitor circuits), keeping the slew rate constant makes the bias current scale **up** by $\alpha^2$: power goes up (Razavi §17.1).

## Capacitances

```tikz title="Where the capacitances live (left) and the terminal-pair capacitances they lump into (right). After Razavi Figs. 2.31 and 2.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (8,3);
  \draw[fill=gray!25] (0.4,3) -- (0.4,2.2) -- (2.6,2.2) -- (2.6,3);
  \draw[fill=gray!25] (5.4,3) -- (5.4,2.2) -- (7.6,2.2) -- (7.6,3);
  \node[font=\scriptsize] at (1.5,2.6) {$n^+$ S};
  \node[font=\scriptsize] at (6.5,2.6) {$n^+$ D};
  \draw[fill=gray!10] (2.3,3) rectangle (5.7,3.12);
  \draw[fill=gray!60] (2.3,3.12) rectangle (5.7,3.6);
  \node[font=\scriptsize] at (4,3.36) {gate};
  \fill[black!75] (2.6,2.93) rectangle (5.4,3);
  \draw[dashed] (0.2,3) -- (0.2,1.8) -- (7.8,1.8) -- (7.8,3);
  \node[font=\scriptsize] at (4,0.4) {p-substrate};
  \draw[<-] (2.45,3.15) -- (1.6,4.2) node[above,font=\scriptsize] {$C_{ov}$ overlap};
  \draw[<-] (5.55,3.15) -- (6.4,4.2) node[above,font=\scriptsize] {$C_{ov}$ overlap};
  \draw[<-] (4,2.96) -- (4,4.2) node[above,font=\scriptsize] {$C_{ox}$: gate--channel};
  \draw[<-] (4,2.3) -- (4,1.2) node[below,font=\scriptsize] {$C_{dep}$: channel--bulk};
  \draw[<-] (6.5,1.85) -- (6.9,1.0) node[below,font=\scriptsize] {$C_j$ (area)};
  \draw[<-] (7.75,2.5) -- (8.6,2.0) node[right,font=\scriptsize] {$C_{jsw}$ (perimeter)};
  \begin{scope}[xshift=10.6cm,yshift=-0.2cm]
    \draw (0,1.8) node[ocirc]{} node[left] {$G$} to[C, l=$C_{GD}$] (0,3.6) -- (2.6,3.6) node[ocirc]{} node[above] {$D$};
    \draw (0,1.8) to[C, l_=$C_{GS}$] (0,0) -- (2.6,0) node[ocirc]{} node[below] {$S$};
    \draw (0,1.8) to[C, l=$C_{GB}$] (2.6,1.8) node[ocirc]{} node[right] {$B$};
    \draw (2.6,3.6) -- (3.8,3.6) to[C, l=$C_{DB}$] (3.8,1.8) -- (2.6,1.8);
    \draw (2.6,0) -- (3.8,0) to[C, l_=$C_{SB}$] (3.8,1.8);
  \end{scope}
\end{circuitikz}
\end{document}
```

```tikz title="C_GS and C_GD as V_GS sweeps through off, saturation, triode (V_D fixed). After Razavi Fig. 2.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.4,0) node[right] {$V_{GS}$};
  \draw[->] (0,0) -- (0,3.3) node[above] {$C$};
  \draw[thick] (0,0.4) -- (1.9,0.4) -- (2.3,2.4) -- (4.4,2.4) -- (4.8,1.9) -- (7,1.9);
  \draw[thick,dashed] (0,0.42) -- (4.4,0.42) -- (4.8,1.88) -- (7,1.88);
  \draw[dotted] (2,0) -- (2,3);
  \draw[dotted] (4.5,0) -- (4.5,3);
  \node[below,font=\scriptsize] at (2,0) {$V_{TH}$};
  \node[below,font=\scriptsize] at (4.5,0) {$V_D+V_{TH}$};
  \node[font=\scriptsize] at (1,3) {off};
  \node[font=\scriptsize] at (3.25,3) {saturation};
  \node[font=\scriptsize] at (5.8,3) {triode};
  \node[font=\scriptsize,anchor=south] at (3.3,2.4) {$C_{GS}$};
  \node[font=\scriptsize,anchor=south] at (3.3,0.42) {$C_{GD}$ (dashed)};
  \node[font=\scriptsize,anchor=east] at (-0.1,0.4) {$WC_{ov}$};
  \node[font=\scriptsize,anchor=east] at (-0.1,2.4) {$\frac23WLC_{ox}{+}WC_{ov}$};
  \node[font=\scriptsize,anchor=east] at (-0.1,1.9) {$\frac12WLC_{ox}{+}WC_{ov}$};
\end{circuitikz}
\end{document}
```

| Region | $C_{GS}$ | $C_{GD}$ | $C_{GB}$ |
|---|---|---|---|
| Off | $WC_{ov}$ | $WC_{ov}$ | $WLC_{ox}$ in series with $C_{dep}$ |
| Triode | $\tfrac12WLC_{ox} + WC_{ov}$ | $\tfrac12WLC_{ox} + WC_{ov}$ | ≈ 0 (channel shields) |
| **Saturation** | $\boxed{\tfrac23WLC_{ox} + WC_{ov}}$ | $\boxed{WC_{ov}}$ | ≈ 0 |

- **Triode:** S and D sit at nearly the same voltage, so a gate step pulls equal charge from each: split the channel cap in half.
- **Saturation:** the drain end is pinched off, so the drain loses its share; the nonuniform channel gives $\frac23$ to the source.
- **Overlap** $C_{ov}$ (per unit width) includes fringing fields, so it is larger than $L_DC_{ox}$. $C_{GD}$ is the Miller capacitance ([[Frequency Response]]).
- **Junctions** $C_{SB}, C_{DB}$: area part $C_j$ plus perimeter part $C_{jsw}$, both shrinking with reverse bias:

$$
\boxed{C_j = \frac{C_{j0}}{\left(1+V_R/\phi_B\right)^m},\quad m\approx 0.3\text{–}0.4}\qquad C_{DB} = (\text{area})\,C_j + (\text{perimeter})\,C_{jsw}
$$

> [!tip] Remark
> $C_{dep}$ here is the same capacitor as in the [[#Threshold Voltage|threshold divider]] and in the subthreshold slope $S = 2.3V_T(1+C_d/C_{ox})$. One capacitor, three effects.

### Full Small-Signal Model and $f_T$

```tikz title="Complete small-signal model. After Razavi Fig. 2.39 and Carusone Fig. 1.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (-0.8,3) node[ocirc]{} node[left] {$G$} -- (1,3);
  \draw (1,3) to[C, l=$C_{GD}$] (3,3) -- (9.4,3) node[ocirc]{} node[right] {$D$};
  \draw (1,3) to[C, l_=$C_{GS}$] (1,0);
  \draw (3,3) to[cI, l=$g_m v_{gs}$] (3,0);
  \draw (5.4,3) to[R, l=$r_o$] (5.4,0);
  \draw (7.6,3) to[cI, l=$g_{mb}v_{bs}$] (7.6,0);
  \draw (1,0) -- (7.6,0);
  \node[below left] at (1,0) {$S$};
  \draw (-0.8,3) to[C, l_=$C_{GB}$] (-0.8,-2) -- (9.4,-2);
  \draw (4.2,0) to[C, l=$C_{SB}$] (4.2,-2);
  \draw (9.4,3) to[C, l=$C_{DB}$] (9.4,-2);
  \draw (6.5,-2) node[ocirc]{} node[below] {$B$};
\end{circuitikz}
\end{document}
```

$$
\boxed{f_T = \frac{g_m}{2\pi(C_{GS}+C_{GD})} \approx \frac{3\mu_n V_{OV}}{4\pi L^2}}
$$

$f_T$: the frequency where the current gain $|i_d/i_g|$ (source and drain at AC ground) falls to 1. A proxy for the fastest a device is useful; circuits run well below it.

> [!tip] Remark
> Put this next to [[#Output Resistance and Intrinsic Gain|$g_mr_o = 2/(\lambda V_{OV})$]]: **speed wants short $L$ and large $V_{OV}$; gain wants long $L$ and small $V_{OV}$.** This is the trade the [[#gm/ID and ID/W Simulation-Aided Design|$g_m/I_D$ method]] makes explicit.

> [!note]- Derivation: $f_T$ from the square law (Carusone Eq. 1.117)
> Drive the gate with $i_{in}$, short the drain: $i_{in} = j\omega(C_{GS}+C_{GD})v_{gs}$, $i_{out} = g_mv_{gs}$ (ignoring the small feedforward through $C_{GD}$). Unity at $\omega_T = g_m/(C_{GS}+C_{GD})$. With $C_{GS}\approx\frac23WLC_{ox}\gg C_{GD}$ and $g_m = \mu_nC_{ox}\frac WL V_{OV}$:
> $$f_T \approx \frac{\mu_nC_{ox}(W/L)V_{OV}}{2\pi\cdot\frac23WLC_{ox}} = \frac{3\mu_nV_{OV}}{4\pi L^2}$$
> $W$ cancels: $f_T$ is set by bias ($V_{OV}$, or $g_m/I_D$) and $L$ alone. It ignores the junction caps. Distributed gate resistance does not change it (Razavi Prob. 2.13).

> [!note]- Detail: junction capacitance of a folded device (Razavi Ex. 2.10)
> Straight device, S/D extension $E$: $C_{DB} = C_{SB} = WEC_j + 2(W+E)C_{jsw}$.
> Folded into two fingers sharing one drain: $C_{DB} = \frac W2EC_j + 2\left(\frac W2+E\right)C_{jsw}$, about half. See [[#Layout]].

> [!note]- Detail: the MOS capacitor C–V curve (Razavi App. B)
> ```tikz title="Gate capacitance of a MOSFET with S, D, B tied. After Razavi Fig. 2.46."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[>=stealth,font=\small]
>   \draw[->] (-3,0) -- (3.4,0) node[right] {$V_{GS}$};
>   \draw[->] (0,0) -- (0,3) node[above] {$C$};
>   \draw[dashed] (-3,2.4) -- (3.2,2.4);
>   \node[font=\scriptsize,anchor=south] at (2.6,2.4) {$C_{ox}$};
>   \draw[thick] plot[smooth] coordinates {(-2.9,2.38) (-1.4,2.36) (-0.6,1.9) (0.1,1.2) (0.7,0.95) (1.2,1.4) (1.6,2.2) (2.2,2.38) (3.1,2.39)};
>   \draw (1.3,0.08) -- (1.3,-0.08) node[below,font=\scriptsize] {$V_{TH}$};
>   \node[font=\scriptsize] at (-2.1,1.7) {accumulation};
>   \node[font=\scriptsize,align=center] at (0.95,0.45) {depletion /\\ weak inv.};
>   \node[font=\scriptsize] at (2.4,1.7) {strong inv.};
> \end{circuitikz}
> \end{document}
> ```
> Very negative $V_{GS}$ pulls holes to the surface (accumulation): one plate gap, $C_{ox}$. Near threshold a depletion region forms: $C_{ox}$ in series with $C_{dep}$, a dip. Above $V_{TH}$ the channel is the bottom plate again: back to $C_{ox}$. This is why a MOSFET used as a capacitor must be biased well into inversion (or accumulation).

> [!note]- Detail: simulator capacitance models
> The region-by-region model above (the **Meyer** model) jumps between regions and breaks simulator convergence; Level 1 smooths it:
> $C_{GS} = \frac23WLC_{ox}\left[1-\frac{(V_{GS}-V_{DS}-V_{TH})^2}{(2V_{OV}-V_{DS})^2}\right]+WC_{ov}$, $C_{GD} = \frac23WLC_{ox}\left[1-\frac{V_{OV}^2}{(2V_{OV}-V_{DS})^2}\right]+WC_{ov}$.
> Worse, Meyer does not conserve charge: a square wave through a capacitor into a MOSFET droops in transient simulation. Charge-based models compute the channel and depletion charge first, then partition it. BSIM/BSIM3 offer 40/60, 50/50 and 0/100 drain/source partitions.

## gm/ID and ID/W Simulation-Aided Design

Everything above is for intuition. A real nanometer device departs from the square law badly: $g_m$ from the square law is off by 20–60 % in strong inversion and by 2× or more in moderate inversion (Jespers & Murmann §1.1). So you **simulate the device once**, tabulate it, and size from the tables.

### Different Device Models

| Model | What it adds | Usable down to |
|---|---|---|
| **Level 1** (Shichman–Hodges) | Square law + $\lambda$ + body effect, smoothed capacitances. No subthreshold, no short-channel effects | ≈ 4 µm (poor $r_o$) |
| **Level 2** | $V_{TH}$ varying along the channel (bulk charge), $\lambda$ from depletion width, vertical-field mobility, subthreshold (with a slope **kink** at the transition) | ≈ 0.7 µm wide/short; poor $r_o$ |
| **Level 3** | Empirical fitting constants, DIBL term, $L$- and $W$-dependent $V_{TH}$, lateral + vertical mobility | ≈ 1 µm; **kink in $r_o$** at the triode edge |
| **BSIM / BSIM2** | Gives up physics for fitting: $P = P_0 + \alpha_P/L_{eff} + \beta_P/W_{eff}$ for every parameter. Continuous weak/strong inversion. ≈ 50 / 70 parameters | ≈ 0.8 µm; can predict *negative* $r_o$ |
| **BSIM3** | Back to physics-based equations, ≈ 180 parameters | ≈ 0.25 µm; $r_o$ still poor |
| **BSIM4** | Fixes most of BSIM3's $r_o$ issues, gate leakage | 40 nm, 28 nm planar |
| **EKV** | Bulk-referenced, one equation valid from weak to strong inversion | basis of the $g_m/I_D$ theory |
| **BSIM-CMG / BSIM-IMG** | Multi-gate devices: FinFET (common gate) / FD-SOI (independent front and back gate) | FinFET and FD-SOI nodes |

> [!warning] Unverified
> BSIM-CMG is not described in the listed sources. That it is the industry FinFET model is from general knowledge. The ECE 636 slides confirm BSIM-IMG (independent double-gate) for the GF 22FDX FD-SOI kit.

> [!tip] Remark
> Level 1 **is** the square-law section of this note: $I_D = \frac{K_P}{2}\frac{W}{L-2L_D}V_{OV}^2(1+\lambda V_{DS})$ with $K_P = \mu C_{ox}$. Your hand analysis is a Level 1 simulation.

> [!note]- Detail: Level 1 SPICE parameters (Razavi Table 2.1, 0.5 µm process)
> | NMOS | PMOS | Meaning |
> |---|---|---|
> | VTO = 0.7 | −0.8 | $V_{TH0}$ (V) |
> | GAMMA = 0.45 | 0.4 | $\gamma$ (V^1/2) |
> | PHI = 0.9 | 0.8 | $2\phi_F$ (V) |
> | TOX = 9e−9 | 9e−9 | $t_{ox}$ (m) |
> | NSUB = 9e14 | 5e14 | $N_{sub}$ (cm⁻³) |
> | LD = 0.08e−6 | 0.09e−6 | $L_D$ (m) |
> | UO = 350 | 100 | $\mu$ (cm²/V/s) |
> | LAMBDA = 0.1 | 0.2 | $\lambda$ (V⁻¹) |
> | CJ = 0.56e−3 | 0.94e−3 | $C_j$ (F/m²) |
> | CJSW = 0.35e−11 | 0.32e−11 | $C_{jsw}$ (F/m) |
> | PB = 0.9 | 0.9 | $\phi_B$ (V) |
> | MJ = 0.45, MJSW = 0.2 | 0.5, 0.3 | junction exponents |
> | CGDO = 0.4e−9 | 0.3e−9 | $C_{ov}$ (F/m) |
> | JS = 1e−8 | 0.5e−8 | S/D leakage (A/m²) |
>
> $g_mr_o$ computed from these is far higher than real short-channel devices give.

> [!note]- Detail: temperature in the models (Razavi §17.3.7)
> $V_{TH}$, the junction built-in potential, $n_i$, $E_g$ and $\mu$ all vary with $T$, through empirical fits such as $\mu = \mu_0(T/300)^{-3/2}$ and $E_g = 1.16 - \frac{7.02\times10^{-4}T^2}{T+1108}$. Always simulate temperature extremes together with corners.

### Process Corners

![](assets/Pasted%20image%2020261102085948.png)
![](assets/Pasted%20image%2020261102085951.png)

MOSFET parameters vary from wafer to wafer and lot to lot. The fab promises an envelope and scraps wafers outside it. The envelope is expressed as four corners of NFET and PFET **speed**: **FF, SS, FS, SF** (plus nominal **TT**). Fast means thinner oxide, lower $V_{TH}$.

- Simulate every corner at temperature extremes to estimate yield.
- Gate delay commonly varies 2:1 over process and temperature (Razavi).
- $V_{TH}$ alone moves ±100 to 200 mV over process and temperature (Jespers & Murmann). So **never bias with a chosen $V_{GS}$**: generate gate voltages with replica circuits or feedback ([[Biasing]], [[Current Mirrors]]).

> [!tip] Remark
> The corner spread is the [[#Threshold-Voltage Variation|$V_{TH}$ variation]] (process ≈ 50 mV, temperature ≈ −1 mV/K) plus mobility and oxide spread.

### Why gm/ID, why ID/W

```tikz title="Transconductance efficiency versus normalized current density (basic EKV, n = 1.3, U_T = 26 mV). Weak inversion plateaus at 1/(n U_T); strong inversion follows the square law 2/V_OV. After Jespers and Murmann Figs. 1.6 and 2.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!15] (1.66,0) rectangle (4.17,5.6);
  \draw[->] (0,0) -- (7.7,0) node[right] {$I_D/I_S\ \propto I_D/W$};
  \draw[->] (0,0) -- (0,6.1) node[above] {$g_m/I_D$ (S/A)};
  \foreach \e/\x in {-2/0,-1/1.2,0/2.4,1/3.6,2/4.8,3/6.0,4/7.2} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {$10^{\e}$}; }
  \foreach \s in {10,20,30} { \draw (0.08,{0.18*\s}) -- (-0.08,{0.18*\s}) node[left,font=\scriptsize] {\s}; }
  \draw[dashed] (0,5.33) -- (7.4,5.33);
  \draw[dashed,domain=0:4,samples=40] plot ({1.2*(\x+2)},{0.18*29.6/pow(10,\x/2)});
  \draw[very thick,domain=-2:2,samples=100] plot ({1.2*(log10(pow(10,2*\x)+pow(10,\x))+2)},{0.18*29.6/(1+pow(10,\x))});
  \node[font=\scriptsize] at (0.8,5.85) {weak};
  \node[font=\scriptsize] at (2.9,5.85) {moderate};
  \node[font=\scriptsize] at (5.7,5.85) {strong};
  \node[font=\scriptsize,anchor=north] at (6.2,5.25) {$1/(nU_T)\approx 30$};
  \node[font=\scriptsize,anchor=west] at (4.6,2.0) {$\approx 2/V_{OV}$ (square law)};
  \node[font=\scriptsize,anchor=west] at (4.6,1.5) {$V_{D,sat}\approx 2/(g_m/I_D)$};
\end{circuitikz}
\end{document}
```

> [!important] $g_m/I_D$ replaces $V_{OV}$ as the design knob
> $$\boxed{\frac{g_m}{I_D}\Big|_{SI} = \frac{2}{V_{OV}},\qquad \frac{g_m}{I_D}\Big|_{WI} = \frac{1}{nU_T},\qquad \frac{g_m}{I_D}\Big|_{EKV} = \frac{1}{nU_T(1+q)}}$$
> $$\boxed{V_{D,sat}\approx\frac{2}{g_m/I_D}}\qquad\boxed{I_D = \frac{g_m}{g_m/I_D},\quad W = \frac{I_D}{I_D/W}}$$
> $g_m/I_D$ runs 3 to 30 S/A in **every** modern process: low = strong inversion, about 12–18 = moderate, the peak = weak.

> [!tip] Remark
> Nothing new here. $g_m/I_D = 2/V_{OV}$ is [[#Transconductance|$g_m = 2I_D/V_{OV}$]] rearranged; the plateau $1/(nU_T)$ is the [[#Subthreshold Conduction|subthreshold $g_m = I_D/(\xi V_T)$]]. $g_m/I_D$ is just the overdrive knob, measured instead of computed.

**Why $g_m/I_D$:**
- It is $g_m$ **per unit of current**: directly the power efficiency.
- It names the inversion level without trusting any model (it's the slope of $\ln I_D$ vs $V_{GS}$, which you can simulate).
- It fixes, for a given $L$, every width-independent figure of merit at once: $g_m/W$, $I_D/W$, $f_T$, $g_mr_o$, $V_{D,sat}$.
- It works where $V_{OV}$ means nothing (moderate and weak inversion).

**Why $I_D/W$:** put $K$ identical devices in parallel and both $I_D$ and $g_m$ scale by $K$ while $V_{OV}$ and $g_m/I_D$ stay put (Razavi Ex. 11.2). So **at fixed $L$ and $g_m/I_D$, the current density $I_D/W$ is fixed**, and one simulated reference width de-normalizes to any width. $I_D/W$ also matters for electromigration.

**Example trade-off** (Jespers & Murmann Table 1.1, 65 nm NMOS, $L = 60$ nm, $V_{DS} = 1$ V):

| $g_m/I_D$ (S/A) | $g_m/W$ (mS/µm) | $I_D/W$ (µA/µm) | $g_m/g_{ds}$ | $f_T$ (GHz) |
|---|---|---|---|---|
| 5 (strong) | 0.811 | 162 | 9.9 | 122 |
| 10 | 0.384 | 38.4 | 10.9 | 64.2 |
| 20 (moderate) | 0.064 | 3.20 | 11.9 | 12.7 |

Large $g_m/I_D$: less current, more swing (small $V_{D,sat}$), a bit more gain, but a wide device and low $f_T$. Small $g_m/I_D$: fast and small, but power-hungry. Most high-performance designs land in **moderate inversion**; going deep into weak inversion buys almost no $g_m$, only capacitance.

```tikz title="The gm/ID sizing flow. The lookup table is generated once per device type by sweeping L, V_GS, V_DS, V_SB at a fixed reference width. After Jespers and Murmann Sec. 1.2.3 and Fig. 1.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\t in {0/{1. $g_m$ from the spec (gain, bandwidth, noise)},1/{2. Pick $L$: short = fast, small; long = gain, matching},2/{3. Pick $g_m/I_D$: large = low power, swing; small = fast, small},3/{4. $I_D = g_m\,/\,(g_m/I_D)$},4/{5. $W = I_D\,/\,(I_D/W)$}} {
    \draw[fill=black!4,rounded corners=2pt] (0,{-1.2*\i}) rectangle (9.6,{-1.2*\i+0.8});
    \node at (4.8,{-1.2*\i+0.4}) {\t};
  }
  \foreach \i in {0,1,2,3} { \draw[->] (4.8,{-1.2*\i}) -- (4.8,{-1.2*\i-0.4}); }
  \draw[fill=gray!15,rounded corners=2pt] (10.6,-4.0) rectangle (13.8,-1.2);
  \node[align=center,font=\scriptsize] at (12.2,-2.6) {lookup table\\ SPICE sweep of\\ $L, V_{GS}, V_{DS}, V_{SB}$\\ at reference $W$:\\ $g_m/I_D$, $I_D/W$,\\ $f_T$, $g_m/g_{ds}$, $C$'s};
  \draw[->] (10.6,-2.0) -- (9.6,-2.0);
  \draw[->] (10.6,-3.2) -- (9.6,-4.4);
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: the EKV curve behind the plot (Jespers & Murmann §2.2)
> Normalize the mobile charge at the source, $q = |Q_i|/(2nC_{ox}U_T)$, and the current to the specific current $I_S$. In saturation the basic EKV model gives
> $$\frac{I_D}{I_S} = q^2 + q$$
> The $q^2$ term is drift (the square law), the $q$ term diffusion (the exponential); they are equal at $q = 1$, which is a model-free definition of threshold. Then
> $$\frac{g_m}{I_D} = \frac{1}{nU_T}\cdot\frac{1}{1+q},\qquad V_{D,sat} = \frac{2}{g_m/I_D} = 2nU_T(1+q)$$
> $q\ll1$: $g_m/I_D\to 1/(nU_T)$, $V_{D,sat}\to 2nU_T\approx 50$–$100$ mV. $q\gg1$: $q\approx\sqrt{I_D/I_S}$ and $g_m/I_D\to 2/V_{OV}$, $V_{D,sat}\to V_{OV}$. Moderate inversion is $q\approx 0.2$ to $5$, the steepest part of the curve. The normalized efficiency $\rho = nU_T\,g_m/I_D = 1/(1+q)$ runs from 1 (weak) through 0.5 (threshold) to 0 (strong).
>
> Three parameters ($n$, $V_T$, $I_S$) fit a real device: $n$ from the peak of $g_m/I_D$, then $V_T$ and $I_S$ from one reference point in moderate inversion. The fit holds only at the $V_{DS}$, $V_{SB}$ and $L$ it was extracted at.

> [!note]- Detail: Razavi's reference-transistor method (§11.4.1)
> Given $I_D = 0.5$ mA and $V_{DS,min} = 200$ mV in 40 nm:
> 1. Simulate a reference device, $W_{REF}/L_{min} = 5\ \mu\text{m}/40$ nm, $I_D$–$V_{DS}$ for $V_{OV} = 50$…350 mV.
> 2. At $V_{DS} = 200$ mV pick the $V_{OV} = 200$ mV curve: $I_{D,REF}\approx 100\ \mu$A, and from a simulated $g_m$–$V_{OV}$ plot, $g_m\approx 1.5$ mS.
> 3. Scale $W$ by $500/100$: $W = 25\ \mu$m, $g_m = 7.5$ mS (same current density, same $g_m/I_D$).
>
> Choosing $V_{OV} = 250$ mV instead needs only 12.5 µm but gives 5.75 mS. Lower overdrive, more $g_m$ per amp. Rule: pick $V_{OV}\approx V_{DS,min}$. Short-channel $r_o$ comes from a simulated $r_o$–$I_D$ plot and scales as $1/K$ when $W$ and $I_D$ scale by $K$. The maximum $g_m$ for a current budget is $I_D/(\xi V_T)$: 26 mS at 1 mA.

> [!note]- Detail: generating the curves yourself (ECE 636 "Characterizing Transistor Performance")
> - **$I_D$–$V_{GS}$:** $W = 1$ µm, $L = L_{min}$, sweep $V_{GS}$ at $V_{DS}\gg V_{DS,sat}$. Read $V_{TH}$ off $\sqrt{I_D}$ vs $V_{GS}$, $\mu C_{ox}$ from its slope, and the subthreshold swing on a log axis.
> - **Intrinsic gain vs $I_D/W$:** DC sweep for $I_D$, AC analysis at 1 Hz with a 1 V AC gate source; $|v_o|$ is $g_mr_o$.
> - **$f_T$ vs $I_D/W$:** AC current gain $|i_d/i_g|$ with drain at AC ground; find the 0 dB crossing; parametric sweep of $V_{GS}$.
> - **Capacitances per width:** sweep $W$ and $I_D$ together (constant $I_D/W$) with a feedback loop setting $V_{GS}$; read cgg, cgs, cgd, cdb from the operating point.

What about designs involving [[BJTs]] or other devices? A BJT's $g_m/I_C = 1/V_T$ is fixed by physics, so it has no inversion-level knob: the components around it dictate the trade-offs. A MosFET lets you slide along the whole curve above, trading power for speed for area in one device. (Its best $g_m/I_D$, $1/(nU_T)$, is still below the BJT's $1/U_T$.)

## Layout

```tikz title="Top view of a single-finger MOSFET (left) and the same W folded into two fingers sharing one drain (right). After Razavi Figs. 2.29 and 2.33."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=gray!15] (0,0) rectangle (3,2.4);
  \draw[fill=gray!55] (1.3,-0.4) rectangle (1.7,2.8);
  \foreach \y in {0.4,1.0,1.6,2.0} { \draw[fill=black] (0.45,\y) rectangle (0.75,{\y+0.25}); \draw[fill=black] (2.25,\y) rectangle (2.55,{\y+0.25}); }
  \node[font=\scriptsize] at (0.6,-0.3) {S};
  \node[font=\scriptsize] at (2.4,-0.3) {D};
  \draw[<->] (-0.3,0) -- (-0.3,2.4) node[midway,left,font=\scriptsize] {$W$};
  \draw[<->] (1.3,3.05) -- (1.7,3.05) node[midway,above,font=\scriptsize] {$L$};
  \draw[<->] (0,-0.75) -- (1.3,-0.75) node[midway,below,font=\scriptsize] {$E$};
  \node[font=\scriptsize] at (1.5,-1.4) {one finger};
  \begin{scope}[xshift=5cm,yshift=0.6cm]
    \draw[fill=gray!15] (0,0) rectangle (5,1.2);
    \draw[fill=gray!55] (1.3,-0.4) rectangle (1.7,1.6);
    \draw[fill=gray!55] (3.3,-0.4) rectangle (3.7,1.6);
    \foreach \x in {0.45,2.35,4.25} { \draw[fill=black] (\x,0.25) rectangle ({\x+0.3},0.5); \draw[fill=black] (\x,0.7) rectangle ({\x+0.3},0.95); }
    \node[font=\scriptsize] at (0.6,-0.6) {S};
    \node[font=\scriptsize] at (2.5,-0.6) {D};
    \node[font=\scriptsize] at (4.4,-0.6) {S};
    \draw[<->] (5.3,0) -- (5.3,1.2) node[midway,right,font=\scriptsize] {$W/2$};
    \node[font=\scriptsize] at (2.5,-2.0) {two fingers: half the drain area, $1/4$ the gate resistance};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Draw** $L$ and $W$; the S/D extension $E$ is set by contact design rules (typically 3–4× $L_{min}$). Minimize S/D area to minimize $C_{SB}, C_{DB}$.
- **Fold / multi-finger** wide devices: less drain capacitance, much less gate resistance. Size each finger so its gate resistance is below its $1/g_m$; for low noise, 1/5 to 1/10 of $1/g_m$ ([[Noise]]). Too many fingers grows the S/D perimeter cap: $C_P = \left[(N+1)E + \frac{N+1}{N}W\right]C_{jsw}$ for odd $N$.
- **Share diffusions** between series devices (e.g. a cascode with equal widths): the shared node needs no contact, so its junction can be tiny.

> [!tip] Remark
> The folding savings are the [[#Capacitances|junction-capacitance formulas]] applied to a smaller drain area and perimeter.

> [!tip] Remark
> Matching layout (cross-coupling, common centroid, dummies) and the layout-dependent effects (orientation, gate shadowing, gradients, metal coverage, STI stress, well proximity) are owned by [[Device Matching]] (rules summary: [[Device Matching#Level 5 Rules for MOS Transistor Matching]]) and [[Common-Centroid Layout]]; mismatch statistics by [[Nonlinearity and Mismatch]].

```tikz title="FinFET cross-section: the gate wraps three sides of the fin, so width is quantized. After Razavi Fig. 2.42."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=gray!15] (0,0) rectangle (5,0.8);
  \node[font=\scriptsize] at (4.2,0.4) {substrate};
  \draw[fill=gray!55] (1.5,0.8) -- (1.5,3.8) -- (3.5,3.8) -- (3.5,0.8) -- (3.0,0.8) -- (3.0,3.3) -- (2.0,3.3) -- (2.0,0.8) -- cycle;
  \draw[fill=gray!20] (2.15,0.8) rectangle (2.85,3.15);
  \draw[fill=gray!5] (2.0,0.8) -- (2.0,3.3) -- (3.0,3.3) -- (3.0,0.8) -- (2.85,0.8) -- (2.85,3.15) -- (2.15,3.15) -- (2.15,0.8) -- cycle;
  \node[font=\scriptsize] at (2.5,2.0) {fin};
  \node[font=\scriptsize] at (1.0,3.0) {gate};
  \draw[<-] (2.07,2.6) -- (0.7,2.2) node[left,font=\scriptsize] {oxide};
  \draw[<->] (2.15,4.1) -- (2.85,4.1) node[midway,above,font=\scriptsize] {$W_F$};
  \draw[<->] (3.8,0.8) -- (3.8,3.15) node[midway,right,font=\scriptsize] {$H_F$};
\end{circuitikz}
\end{document}
```

$$
\boxed{W = N_{fins}\,(W_F + 2H_F)}
$$

Current flows on the fin's top and both sides. $W_F$ and $H_F$ are fixed by the process (typically $W_F\approx 6$ nm, $H_F\approx 50$ nm), so width comes only in whole fins. FinFETs have less CLM and subthreshold leakage (the gate grips the channel from three sides) and behave closer to the square law again below about 20 nm. Contacts must sit away from the fin core.

Layout depth lives in the layout notes: design rules and antenna in [[Layout Fundamentals]], passives in [[Resistor]] / [[Capacitor]] / [[Inductor]], ESD in [[Guard Rings, ESD and Interconnect]], substrate coupling in [[Substrate Noise]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $W$ at fixed $I_D$ (↑ $g_m/I_D$) | $g_m$, headroom ($V_{OV}$↓), $g_mr_o$ slightly | Capacitance, $f_T$; past the weak-inversion knee only capacitance grows |
| ↑ $I_D$ at fixed $W/L$ | $g_m$ (∝ $\sqrt{I_D}$), $f_T$ | Power, $V_{OV}$ (headroom), $r_o$, $g_mr_o$ |
| ↑ $W$ and $I_D$ together (fixed $I_D/W$) | $g_m \propto I_D$; $g_m/I_D$, $f_T$, $V_{D,sat}$ unchanged | Power, area, capacitance; $r_o \propto 1/I_D$ |
| ↑ $L$ (with $W$ to hold $I_D$, $V_{OV}$) | $r_o$, $g_mr_o$, matching, fewer short-channel effects | $f_T\propto1/L^2$, area, capacitance; $V_{TH}$ shifts (halo) |
| ↑ $V_{OV}$ (↓ $g_m/I_D$) | $f_T$, smaller device | $g_mr_o$, headroom, $g_m$ per amp |
| Folding / fingers | $C_{DB}$, gate resistance | Perimeter cap if overdone |
| Forward body bias ($V_{SB}<0$) | Lower $V_{TH}$, headroom | Junction forward-bias risk, ≈300 mV limit |
| NMOS instead of PMOS | ≈2× $\mu C_{ox}$, higher $r_o$ | PMOS has its own well and lower flicker noise |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Effective length | $L_{eff} = L_{drawn}-2L_D$ |
| Threshold | $V_{TH} = \Phi_{MS}+2\phi_F+Q_{dep}/C_{ox}$, $\phi_F = \frac{kT}{q}\ln\frac{N_{sub}}{n_i}$ |
| Triode | $I_D = \mu_nC_{ox}\frac WL\left[V_{OV}V_{DS}-\frac12V_{DS}^2\right]$ |
| Deep triode | $R_{on} = 1/\left(\mu_nC_{ox}\frac WL V_{OV}\right)$ |
| Saturation | $I_D = \frac12\mu_nC_{ox}\frac WL V_{OV}^2(1+\lambda V_{DS})$, $V_{D,sat} = V_{OV}$ |
| Transconductance | $g_m = \mu_nC_{ox}\frac WL V_{OV} = \sqrt{2\mu_nC_{ox}\frac WL I_D} = 2I_D/V_{OV}$ |
| Output resistance | $r_o\approx 1/(\lambda I_D)$ |
| Intrinsic gain | $g_mr_o = 2/(\lambda V_{OV})$ |
| Body effect | $V_{TH} = V_{TH0}+\gamma\left(\sqrt{2\phi_F+V_{SB}}-\sqrt{2\phi_F}\right)$, $\gamma = \sqrt{2q\varepsilon_{si}N_{sub}}/C_{ox}$ |
| Body transconductance | $g_{mb} = \eta g_m$, $\eta = \gamma/\left(2\sqrt{2\phi_F+V_{SB}}\right)$ |
| Subthreshold | $I_D = I_0\exp\frac{V_{GS}}{\xi V_T}$, $g_m = I_D/(\xi V_T)$ |
| Subthreshold slope | $S = 2.3V_T(1+C_d/C_{ox}) \ge 60$ mV/dec |
| Weak/strong boundary | $V_{OV}\approx 2\xi V_T\approx 80$ mV |
| Velocity saturation | $I_D = WC_{ox}v_{sat}V_{OV}$, $g_m = WC_{ox}v_{sat}$ |
| Mobility degradation | $\mu_{eff} = \mu_0/(1+\theta V_{OV})$ |
| Saturation caps | $C_{GS} = \frac23WLC_{ox}+WC_{ov}$, $C_{GD} = WC_{ov}$ |
| Junction cap | $C_j = C_{j0}/(1+V_R/\phi_B)^m$ |
| Transit frequency | $f_T = \frac{g_m}{2\pi(C_{GS}+C_{GD})}\approx\frac{3\mu_nV_{OV}}{4\pi L^2}$ |
| $g_m/I_D$ | SI: $2/V_{OV}$; WI: $1/(nU_T)$; EKV: $\frac{1}{nU_T(1+q)}$ |
| Saturation voltage | $V_{D,sat}\approx 2/(g_m/I_D)$ |
| De-normalization | $I_D = g_m/(g_m/I_D)$, $W = I_D/(I_D/W)$ |
| FinFET width | $W = N_{fins}(W_F+2H_F)$ |
| Ideal scaling | $I_D, C, T_d \to 1/\alpha$; $P_{gate}\to1/\alpha^3$; $g_m, r_o, g_mr_o$ constant |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 2 Basic MOS Device Physics, §2.1–2.6, pp. 7–38: structure, threshold, I/V derivation, $g_m$, body effect, CLM, subthreshold, layout, capacitances, small-signal model, Level 1 parameters, FinFET and MOS-capacitor appendices. Problem 2.13 ($f_T$).
  - Ch. 11 Nanometer Design Studies, §11.1–11.4.2, pp. 459–470: deep-submicron effects, transconductance scaling, reference-transistor design.
  - Ch. 17 Short-Channel Effects and Device Models, pp. 691–709: scaling, $V_{TH}$ variation, DIBL, RSCE, mobility, velocity saturation, hot carriers, $r_o$ vs $V_{DS}$, Level 1–3, BSIM series, EKV, Meyer model, temperature, process corners.
  - Ch. 19 Layout and Packaging, §19.2.1–19.2.4, pp. 737–744: multifinger devices, symmetry, common centroid, STI, well proximity.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §1.2.7 pp. 30–33 (capacitances, small-signal model), §1.2.9 pp. 36–38 (intrinsic gain $2/(\lambda V_{eff})$, $f_T\approx3\mu V_{eff}/(4\pi L^2)$).
- **Jespers & Murmann, *Systematic Design of Analog CMOS Circuits***: §1.1–1.2.5 (square-law failure, lookup tables, $g_m/I_D$ as knob, Table 1.1, sizing flow, $V_{GS}$-agnostic design, weak inversion), §2.2.4 (EKV $g_m/I_D$), §2.3.2 ($V_{D,sat} = 2/(g_m/I_D)$), §2.3.5–2.3.7 (output conductance, intrinsic gain, DIBL ceiling), §2.3.8 (capacitances, $f_T$).
- **Neamen, *Semiconductor Physics and Devices***: §11.1.5 Threshold Voltage, p. 465 (flat-band and oxide-charge form).
- **ECE 636 (Fall 2026) slides:** "MOSFET Structure and Operation" (9/16: substrate factor $n$ = 1.2–1.5, subthreshold swing, velocity saturation, DIBL); "MOSFET Small-Signal Modelling" (9/23: WI/SI boundary); "Introduction to Circuit Simulation and Transistor Models" (9/28: BSIM features, BSIM-IMG, body biasing limits); "Characterizing Transistor Performance for Design" (10/06: test benches for $I_D$, intrinsic gain, $f_T$, capacitances).
- **Zettelkasten extensions** (`AnalogTheory/MOS Device Physics and Models/`): 1f3 (60 mV/dec floor), 1s1 (drift = diffusion at threshold), 1u1, 1w1, 1w2 (EKV $i = q^2+q$, $\rho = 1/(1+q)$, $V_{D,sat}$), 1z, 1z3 ($g_{ds}$ decomposition, DIBL gain ceiling); `S16 gm-ID Sizing Methodology` §1–4, 7.
