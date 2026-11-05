---
title: BJTs
description: The bipolar transistor from modes to the exponential law, hybrid-π and T models, V_BE(T), second-order effects and f_T, compared with the MOSFET, and laid out (vertical NPN, lateral and substrate PNP, matching rules).
kind: topic
status: growing
aliases:
  - BJTs
  - BJT
  - Bipolar Junction Transistor
  - Bipolar Transistors
---

This note follows the same arc as [[MosFETs]]: the bipolar transistor as a black box first, then each section opens it one level further (exponential law, small-signal model, temperature, second-order physics, capacitances and $f_T$, models), and it ends with the comparison to the MOSFET and the layout. Stop after any section and you still have a correct, coarser model.

## The big picture

```tikz title="The BJT on one screen: an exponential voltage-controlled current. Below V_CE,sat it saturates; in the active region the collector is a current source tilted by the Early effect; at high V_CE it breaks down. After Sedra Figs. 6.18, 6.33 and Carusone Fig. 8.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (-2.6,2.2) node[npn](Q){};
  \node[left] at (Q.B) {$B$};
  \node[above] at (Q.C) {$C$};
  \node[below] at (Q.E) {$E$};
  \draw[->] ([xshift=0.35cm]Q.C) -- ++(0,-0.5) node[right] {$I_C$};
  \draw[->] (0,0) -- (8.2,0) node[right] {$V_{CE}$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$I_C$};
  \foreach \k/\n in {1/1,1.9/2,2.8/3} {
    \draw[thick,domain=0:7.0,samples=80] plot (\x,{\k*(1-exp(-\x/0.12))*(1+0.035*\x)+0.25*exp((\x-7.0)/0.12)});
    \node[right,font=\scriptsize] at (7.05,{\k*(1+0.035*7)+0.3}) {$V_{BE\n}$};
  }
  \draw[dashed] (0.35,0) -- (0.35,3.9);
  \node[font=\scriptsize,anchor=north west] at (0.1,-0.05) {$V_{CE,sat}\approx0.2$--$0.3$ V};
  \node[font=\scriptsize,align=center] at (4.0,4.3) {active: $I_C = I_S e^{V_{BE}/V_T}(1+V_{CE}/V_A)$};
  \node[font=\scriptsize,anchor=east] at (1.6,0.35) {sat.};
  \draw[dotted] (7.0,0) -- (7.0,4.0);
  \node[below,font=\scriptsize] at (7.0,0) {$BV_{CEO}$};
  \node[font=\scriptsize,anchor=west] at (2.4,1.55) {slope $=1/r_o = I_C/V_A$};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Active mode** (base–emitter forward, base–collector reverse): $I_C = I_S e^{V_{BE}/V_T}$, $I_B = I_C/\beta$, $V_{BE}\approx0.7$ V, $\beta\approx50$–$200$.
> 2. **Small signal:** $g_m = I_C/V_T$ (38.5 mS at 1 mA), $r_\pi = \beta/g_m$, $r_o = V_A/I_C$, intrinsic gain $g_mr_o = V_A/V_T$ (thousands, independent of bias).
> 3. **$g_m/I_C = 1/V_T$ is fixed by physics.** No inversion-level knob, and higher than any MOSFET's $g_m/I_D$.
> 4. **Temperature:** $V_{BE}$ falls about 1.5–2 mV/K at constant $I_C$ (CTAT); two junctions at an $n{:}1$ current-density ratio give $\Delta V_{BE}=V_T\ln n$ (PTAT). Both feed every [[Bandgap References|bandgap]].
> 5. **Speed:** $f_T = g_m/[2\pi(C_\pi+C_\mu)]$ rises with $I_C$ to a ceiling set by the base transit time $\tau_F\approx W^2/2D_n$, then falls at high current (Kirk effect). The price of all of it is a **base current**.

**Map:** [[#Level 0 Modes of Operation|modes]] → [[#Level 1 The Exponential Model|exponential law, $\beta$, saturation]] → [[#BJT Properties / Small-Signal Model|$g_m$, $r_\pi$, $r_o$, hybrid-π and T]] → [[#Temperature Behaviour|$V_{BE}(T)$, $\Delta V_{BE}$]] → [[#Second-Order Effects|$\beta(I_C)$, high injection, Kirk, $r_b$, breakdown]] → [[#Capacitances and f_T|charge storage, $f_T$]] → [[#Models and Device Types|Gummel–Poon, device types]] → [[#BJT vs MOSFET|BJT vs MOSFET]] → [[#Layout|layout and matching]].

## Level 0: Modes of Operation

```tikz title="Mode map on the V_BE-V_BC plane (npn). The CBJ does not really conduct until about 0.4 V, so the active region extends a little above V_BC = 0. After Sedra Table 6.1 and Hastings Table 9.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[green!10] (0,-2.6) rectangle (3.6,0.6);
  \draw[->] (-3.6,0) -- (3.9,0) node[right] {$V_{BE}$};
  \draw[->] (0,-2.8) -- (0,2.9) node[above] {$V_{BC}$};
  \draw[dashed] (0,0.6) -- (3.6,0.6);
  \node[font=\scriptsize,anchor=west] at (3.65,0.6) {$\approx0.4$ V};
  \node[align=center] at (1.8,-1.3) {\textbf{forward active}\\ \scriptsize EBJ fwd, CBJ rev\\ \scriptsize amplifier};
  \node[align=center] at (1.8,1.8) {saturation\\ \scriptsize both fwd, $V_{CE}\approx0.2$ V\\ \scriptsize switch on};
  \node[align=center] at (-1.8,-1.3) {cutoff\\ \scriptsize both rev, $I\approx0$\\ \scriptsize switch off};
  \node[align=center] at (-1.8,1.8) {reverse active\\ \scriptsize $\beta_R\approx1$, rarely used};
\end{circuitikz}
\end{document}
```

| Mode | EBJ | CBJ | Use |
|---|---|---|---|
| Cutoff | reverse | reverse | switch off |
| **Forward active** | **forward** | **reverse** | **amplifier** (everything in this note unless stated) |
| Saturation | forward | forward | switch on, $V_{CE,sat}\approx0.2$ V |
| Reverse active | reverse | forward | almost never (low $\beta_R$) |

The black-box picture: a forward-biased base–emitter **diode** whose current is copied, about $\beta$ times larger, into the collector. "Bipolar" because both electrons and holes carry current (a MOSFET uses one carrier type).

> [!tip] Remark
> Compare [[MosFETs#Level 0 The Switch Model]]. A saturated BJT is a poor switch for analog signals: even at zero current its intrinsic $V_{CE,sat}$ bottoms out near $V_T\ln(1+1/\beta_R)\approx18$ mV (Hastings §9.1.3, $\beta_R\approx1$), and turning it off is slow ([[#Saturation]]). A MOSFET in deep triode is a true zero-offset resistor.

## Level 1: The Exponential Model

### Structure

```tikz title="Simplified npn structure biased in the active mode, and where the terminal currents come from. After Sedra Figs. 6.1, 6.3 and Carusone Fig. 8.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[green!35] (0,0) rectangle (3,2);
  \fill[orange!40] (3,0) rectangle (4.6,2);
  \fill[yellow!25] (4.6,0) rectangle (9,2);
  \draw (0,0) rectangle (9,2);
  \draw (3,0) -- (3,2); \draw (4.6,0) -- (4.6,2);
  \node at (1.5,1.75) {$n^+$ emitter};
  \node at (3.8,1.75) {$p$ base};
  \node at (6.8,1.75) {$n$ collector};
  \draw[<->] (3,-0.25) -- (4.6,-0.25) node[midway,below,font=\scriptsize] {$W$ (thin)};
  \draw[->,thick,blue] (0.6,1.05) -- (8.4,1.05) node[right,font=\scriptsize,align=left] {};
  \node[blue,font=\scriptsize] at (6.8,1.25) {electrons $\to$ $I_C$};
  \draw[->,thick,red] (3.6,0.6) -- (1.2,0.6);
  \node[red,font=\scriptsize] at (1.6,0.35) {holes: $i_{B1}$};
  \draw[->,thick,red] (4.2,0.85) -- (4.2,0.2);
  \node[red,font=\scriptsize,anchor=west] at (4.7,0.35) {recombination in base: $i_{B2}$};
  \draw (0,2) -- (0,2.6) node[above] {$E$};
  \draw (3.8,2) -- (3.8,2.6) node[above] {$B$};
  \draw (9,2) -- (9,2.6) node[above] {$C$};
  \node[font=\scriptsize] at (1.9,2.85) {$V_{BE}>0$ (fwd)};
  \node[font=\scriptsize] at (6.4,2.85) {$V_{CB}>0$ (rev)};
\end{circuitikz}
\end{document}
```

- The forward-biased EBJ injects electrons into the base (wanted) and holes into the emitter (unwanted). A **heavily doped emitter, lightly doped base** makes the electron part dominate.
- The base is **thin**, so almost no injected electrons recombine before the CBJ depletion field sweeps them into the collector.
- $I_C$ does not depend on $V_{CB}$ (to first order): any electron reaching the CBJ is collected. This is the current-source behaviour.
- The real device is asymmetric (the collector surrounds the emitter, the CBJ area is 10–100× the EBJ area), so E and C are not interchangeable. See [[#Layout]].

### Collector Current

```tikz title="Minority-carrier profiles in the active mode. The excess electron density in the base falls almost linearly from n_p(0) to zero at the CBJ; its slope is the collector current. After Sedra Fig. 6.4 and Carusone Fig. 8.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[green!12] (0,0) rectangle (3,3.3);
  \fill[orange!15] (3,0) rectangle (6,3.3);
  \fill[yellow!15] (6,0) rectangle (8.4,3.3);
  \draw[->] (0,0) -- (8.7,0) node[right] {$x$};
  \draw[->] (0,0) -- (0,3.6) node[above] {concentration};
  \draw[dotted] (3,0) -- (3,3.3); \draw[dotted] (6,0) -- (6,3.3);
  \node[font=\scriptsize] at (1.5,3.1) {emitter ($n^+$)};
  \node[font=\scriptsize] at (4.5,3.1) {base ($p$)};
  \node[font=\scriptsize] at (7.2,3.1) {collector};
  \draw[thick,blue] (3,2.6) -- (6,0);
  \draw[thick,blue,dashed] plot[smooth] coordinates {(3,2.6) (4,1.68) (5,0.8) (6,0)};
  \node[blue,font=\scriptsize,anchor=west] at (3.05,2.75) {$n_p(0)=n_{p0}e^{V_{BE}/V_T}$};
  \draw[thick,red,domain=0:3,samples=40] plot (\x,{0.12+0.55*exp(-(3-\x)/0.7)});
  \node[red,font=\scriptsize,anchor=east] at (2.9,1.0) {$p_n(0)\ll n_p(0)$};
  \node[font=\scriptsize,anchor=west] at (4.5,1.9) {slope $\propto I_C$};
  \node[below,font=\scriptsize] at (3,0) {$0$};
  \node[below,font=\scriptsize] at (6,0) {$W$};
  \node[font=\scriptsize,align=center] at (7.2,1.2) {$n_p(W)=0$\\ (swept away)};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_C = I_S\,e^{V_{BE}/V_T},\qquad I_S = \frac{A_E\,q\,D_n\,n_i^2}{W\,N_A},\qquad V_T=\frac{kT}{q}\approx 26\ \text{mV at 300 K}}
$$

- $I_S$ (the **scale current**) is proportional to emitter area $A_E$: two identical devices in parallel have twice the $I_S$. Ratios of $I_S$ are made by unit emitters ([[#Matching Bipolar Transistors]]).
- Typical $I_S$: $10^{-12}$ to $10^{-18}$ A (Sedra). It contains $n_i^2$, so it roughly **doubles every 5 °C** (Sedra).
- One decade of $I_C$ costs $V_T\ln10\approx60$ mV of $V_{BE}$; a doubling costs 18 mV. Over normal currents $V_{BE}$ sits between 0.6 and 0.8 V; hand analysis uses 0.7 V.

> [!note]- Derivation: $I_C$ from the base diffusion current (Carusone App. 8.6.1, Sedra §6.1.2)
> At the emitter edge of the base the forward bias raises the minority electron density to $n_b(0) = \frac{n_i^2}{N_A}e^{V_{BE}/V_T}$. At the collector edge the reverse-biased CBJ holds it at $n_b(W)=0$. If $W\ll L_n$ (diffusion length), almost nothing recombines, so the profile is a straight line and the diffusion current is
> $$I_C = A_EqD_n\frac{n_b(0)}{W} = \frac{A_EqD_nn_i^2}{WN_A}e^{V_{BE}/V_T}$$
> The quantity $\int_0^W N_A\,dx$ (here $N_AW$) is the **Gummel number**: the base charge per unit area. Every $I_S$, $\beta$ and $V_A$ trade-off below is a trade on it.

### Base Current and Current Gain

$$
\boxed{I_B = \frac{I_C}{\beta},\qquad I_E = I_C + I_B = \frac{I_C}{\alpha},\qquad \alpha = \frac{\beta}{\beta+1},\qquad \beta = \frac{\alpha}{1-\alpha}}
$$

$$
\boxed{\beta \approx \frac{D_n}{D_p}\cdot\frac{N_D}{N_A}\cdot\frac{L_p}{W}\approx 2.5\,\frac{N_DL_p}{N_AW}}
$$

- Two base-current components, both $\propto e^{V_{BE}/V_T}$: holes back-injected into the emitter ($i_{B1}$) and holes replacing those lost to recombination in the base ($i_{B2}$). Since both scale with $I_C$, their ratio $\beta$ is (to first order) a constant.
- **High $\beta$ wants:** heavy emitter doping ($N_D\gg N_A$), light and thin base (small $N_AW$).
- $\beta$ = 50–200 for an IC npn (Sedra, Carusone); 10–20 for a lateral pnp (Carusone); up to about 1000 for special (super-beta) devices.
- $\alpha$ is just below 1 ($\beta = 100$ gives $\alpha = 0.99$). Since $\beta = \alpha/(1-\alpha)$, a tiny spread in $\alpha$ is a huge spread in $\beta$: **never design for a precise $\beta$**, only a minimum one.

> [!tip] Remark
> This is the one structural difference from [[MosFETs]]: the gate draws no DC current, the base does. Everything below that has no MOS twin ($r_\pi$, the $(\beta+1)$ impedance reflection, mirror errors of $2/\beta$) comes from $I_B$.

> [!note]- Detail: $\beta = \gamma\,\alpha_T\,\delta$ as three efficiencies (Neamen §10.3)
> Neamen splits $\alpha$ into the **emitter injection efficiency** $\gamma$ (fraction of emitter current that is electrons, set by $N_D/N_A$), the **base transport factor** $\alpha_T$ (fraction of injected electrons that survive the base, set by $W/L_n$), and the **recombination factor** $\delta$ (losses in the EB depletion region, important at low current). $\alpha = \gamma\alpha_T\delta$. In his worked example ($\gamma = 0.9944$, $\alpha_T = 0.9998$, $\delta = 0.99986$) $\alpha = 0.99406$, $\beta\approx167$, and the emitter injection efficiency is the limiting factor.

### Large-Signal Models

```tikz title="Active-mode large-signal model (left): a base-emitter diode with scale current I_S/beta and a collector current source. Saturation model for hand analysis (right). After Sedra Figs. 6.5(c), 6.21 and Carusone Figs. 8.6, 8.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} node[left] {$B$} -- (1,2) to[D, l=$I_S/\beta$] (1,0) -- (3,0);
  \draw (3,3.4) node[ocirc]{} node[above] {$C$} to[cI, l={$\beta I_B = I_Se^{V_{BE}/V_T}$}] (3,0);
  \draw (2,0) -- (2,-0.5) node[ocirc]{} node[below] {$E$};
  \draw[->] (0.2,2.25) -- (0.8,2.25) node[midway,above,font=\scriptsize] {$I_B$};
  \node[font=\scriptsize] at (1.8,-1.4) {active};
  \begin{scope}[xshift=8.6cm]
    \draw (-0.6,2) node[ocirc]{} node[left] {$B$} -- (1,2) to[battery1, l_={$0.7$ V}] (1,0) -- (3,0);
    \draw (3,3.4) node[ocirc]{} node[above] {$C$} to[battery1, l={$V_{CE,sat}\approx0.2$ V}] (3,0);
    \draw (2,0) -- (2,-0.5) node[ocirc]{} node[below] {$E$};
    \node[font=\scriptsize,align=center] at (1.8,-1.5) {saturated: $I_C/I_B = \beta_{forced}<\beta$};
  \end{scope}
\end{circuitikz}
\end{document}
```

These models hold for any $V_{BE}$ (they are nonlinear). Add $r_o$ from C to E for the Early effect ([[#Output Resistance and Intrinsic Gain]]). The pnp is identical with $V_{EB}$ in place of $V_{BE}$ and every current reversed.

> [!note]- Detail: the Ebers–Moll model (Hastings §9.1, Sedra §6.1.4)
> The first complete model (1954) treats the transistor as two back-to-back diodes, each with a controlled source copying its current to the other terminal. It covers all four modes, which is why simulators use it (and its descendant, Gummel–Poon, [[#Models and Device Types]]). For hand work in saturation, add the forward-biased CB diode (scale current $I_{SC}$, 10–100× $I_S$ because the CBJ is larger) to the active model: $i_C = I_Se^{v_{BE}/V_T} - I_{SC}e^{v_{BC}/V_T}$. The second term grows past $v_{BC}\approx0.4$ V and pulls $i_C$ down, so $i_C/i_B$ can be forced to any value below $\beta$.

### Saturation

- Saturation starts when $V_{CE}$ falls below about 0.3 V (CBJ forward by ~0.4 V); deep saturation $V_{CE,sat}\approx0.2$ V.
- Test for it: CBJ forward by more than 0.4 V, or $I_C/I_B<\beta$ (forced $\beta$).
- In saturation the base, and even more the lightly doped collector epi, fill with stored minority charge $Q_s\approx\tau_sI_B$, with $\tau_s$ up to 100× the base transit time.

$$
\boxed{t_s\approx\tau_s\frac{I_B}{I_{BR}}\quad\text{(time to remove the saturation charge with reverse base current } I_{BR})}
$$

> [!important] Never saturate a bipolar in a fast circuit
> Carusone Ex. 8.1 ($\tau_b = 0.2$ ns, $\tau_s = 100$ ns, $I_B = 0.2$ mA, $I_C = 1$ mA, $I_{BR} = 1$ mA): removing the saturation charge takes **17–20 ns**; turning off an active-mode device takes $\tau_bI_C/I_{BR} = $ **0.2 ns**, 100× faster.

> [!note]- Detail: what else saturation does in an IC (Hastings §9.1.3–9.1.4)
> - **Substrate injection:** a junction-isolated npn's forward-biased CBJ injects holes into the collector epi; some reach the p-isolation. That is a **parasitic pnp** to substrate, stealing base drive and possibly debiasing the substrate or triggering latch-up.
> - **Base-current hogging:** a saturating device draws extra base current through its CBJ, pulling down the shared $V_{BE}$ of every other transistor on the same base node (e.g. all outputs of a multi-output mirror drop). Fixes: base ballast resistors sized inversely to emitter area, or Schottky clamps across the CBJ.
> - **Lateral pnp** in saturation keeps its emitter current, but its collector current drops and the missing part flows to the isolation (low collector efficiency).
> - **Quasi-saturation:** with a lightly doped collector drift region, the device saturates internally while the terminals still look active; the $I_C$–$V_{CE}$ knee rounds off.

## BJT Properties / Small-Signal Model

### Transconductance

$$
\boxed{g_m = \frac{\partial I_C}{\partial V_{BE}} = \frac{I_C}{V_T}}\qquad(38.5\ \text{mS at 1 mA})
$$

- $g_m$ depends **only on $I_C$**, not on device size. A stable $g_m$ needs a stable $I_C$; making $I_C$ **PTAT** keeps $g_m$ constant over temperature (Carusone §8.1.1, [[Bandgap References]]).
- Small-signal holds only for $|v_{be}|\lesssim5$–10 mV (Sedra): the exponential bends fast. Compare a MOSFET's square law, linear over a fraction of $V_{OV}$.

> [!tip] Remark
> $g_m/I_C = 1/V_T\approx38.5$ S/A is a constant. The MOSFET's best, $1/(nU_T)$ in [[MosFETs#Subthreshold Conduction|weak inversion]], is 1.2–1.5× lower. This is why the [[MosFETs#Why gm/ID, why ID/W|$g_m/I_D$ method]] has nothing to size in a BJT. See [[#BJT vs MOSFET]].

### Input Resistance and Emitter Resistance

$$
\boxed{r_\pi = \frac{\partial V_{BE}}{\partial I_B} = \frac{\beta}{g_m} = \frac{V_T}{I_B}}\qquad\boxed{r_e = \frac{\partial V_{BE}}{\partial I_E} = \frac{\alpha}{g_m}\approx\frac1{g_m}},\qquad r_\pi = (\beta+1)r_e
$$

- $r_\pi$ is the price of $I_B$: a finite resistance looking into the base (2.6 kΩ at 1 mA, $\beta=100$). A MOSFET has no counterpart.
- $r_e$ is the resistance looking into the emitter (25.7 Ω at 1 mA): the bipolar version of a MOSFET's $1/g_m$ at the source.

> [!important] The two impedance-reflection rules (Carusone §8.5.2)
> **Looking into the base,** any resistance in series with the emitter appears $(\beta+1)$ times larger: $R_b = r_\pi + (\beta+1)R_E$.
> **Looking into the emitter,** any resistance in series with the base appears $(\beta+1)$ times smaller: $R_e = r_e + R_S/(\beta+1)$.
> Both are the same fact: base and emitter carry the same signal voltage, but currents that differ by $\beta+1$.

### Output Resistance and Intrinsic Gain

```tikz title="Early effect: the active-region lines extrapolate back to one point at V_CE = -V_A. After Sedra Fig. 6.18(b) and Neamen Fig. 10.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-4.4,0) -- (6.0,0) node[right] {$V_{CE}$};
  \draw[->] (0,0) -- (0,4.0) node[above] {$I_C$};
  \foreach \i in {0.6,1.0,1.4} {
    \draw[thick,domain=0:0.4,samples=20] plot (\x,{\i*(1+\x/3.8)*(1-exp(-\x/0.06))});
    \draw[thick] (0.4,{\i*(1+0.4/3.8)}) -- (5.4,{\i*(1+5.4/3.8)});
    \draw[dashed] (-3.8,0) -- (0.4,{\i*(1+0.4/3.8)});
  }
  \draw (-3.8,0.08) -- (-3.8,-0.08);
  \node[below,font=\scriptsize] at (-3.8,0) {$-V_A$};
  \node[font=\scriptsize,anchor=west] at (2.6,3.7) {slope $=1/r_o = I_C/V_A$};
  \node[font=\scriptsize,anchor=west] at (-3.4,2.6) {$V_A$: 10 to a few 100 V};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_C = I_Se^{V_{BE}/V_T}\left(1+\frac{V_{CE}}{V_A}\right),\qquad r_o = \frac{V_A}{I_C},\qquad g_mr_o = \frac{V_A}{V_T}}
$$

**Early effect (base-width modulation):** raising $V_{CB}$ widens the CB depletion region into the base, the neutral base $W$ shrinks, the minority-carrier slope (and $I_S\propto1/W$) grows, so $I_C$ creeps up.

- $V_A$: 10–100 V (Sedra), 50–100 V (Carusone), 100–300 V (Neamen); about 150 V for a standard-bipolar npn (Hastings).
- **Intrinsic gain $V_A/V_T$ does not depend on bias.** Carusone Ex. 8.2/8.3 ($I_C = 1$ mA, $\beta = 100$, $V_A = 100$ V): $g_m = 38.5$ mS, $r_\pi = 2.6$ kΩ, $r_e = 25.7$ Ω, $r_o = 100$ kΩ, $g_mr_o = 3846$. An npn typically gives 2000 to 8000 (Carusone), against tens for a short MOSFET.

> [!tip] Remark
> Same role as [[MosFETs#Channel-Length Modulation]]: $r_o = 1/(\lambda I_D)$ there, $V_A/I_C$ here, with $V_A\leftrightarrow1/\lambda$. The difference is in $g_m$: the MOSFET's $g_mr_o = 2/(\lambda V_{OV})$ falls as you push current, the BJT's stays at $V_A/V_T$.

> [!note]- Detail: the $\beta$–$V_A$ trade (Hastings §9.1.1, Neamen Ex. 10.5)
> A wider or more heavily doped base (larger Gummel number) resists modulation, so $V_A$ rises, but $\beta$ falls by the same lever. Device designers therefore quote the product $\beta V_A$; a standard bipolar npn reaches about 20 kV ($\beta = 200$, $V_A = 100$ V). Neamen's example: a 0.70 µm metallurgical base loses about 8 % of its neutral width as $V_{CB}$ goes from 2 to 10 V. Since $\beta$ also rises with $V_{CE}$ for the same reason, base width variations from processing show up as $\beta$ and $V_A$ spread together.

### Small-Signal Models

```tikz title="Low-frequency hybrid-pi model (left) and T model (right), both with r_o. Identical for npn and pnp. After Sedra Figs. 7.26(a), 7.28(a) and Carusone Figs. 8.8, 8.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,3) node[ocirc]{} node[left] {$B$} -- (1,3) to[R, l_=$r_\pi$, v^>=$v_\pi$] (1,0);
  \draw (0,0) node[ocirc]{} node[left] {$E$} -- (5.2,0);
  \draw (3,3) to[cI, l=$g_m v_\pi$] (3,0);
  \draw (4.8,3) to[R, l=$r_o$] (4.8,0);
  \draw (3,3) -- (5.6,3) node[ocirc]{} node[right] {$C$};
  \node[font=\scriptsize] at (2.6,-0.6) {hybrid-$\pi$: use when the emitter is grounded};
  \begin{scope}[xshift=8.8cm]
    \draw (1.5,4.2) node[ocirc]{} node[above] {$C$} to[cI, l=$g_m v_{be}$] (1.5,1.6) to[R, l=$r_e$] (1.5,-0.4) node[ocirc]{} node[below] {$E$};
    \draw (-0.5,1.6) node[ocirc]{} node[left] {$B$} -- (1.5,1.6);
    \draw (1.5,4.2) -- (3.3,4.2) to[R, l=$r_o$] (3.3,-0.4) -- (1.5,-0.4);
    \node[font=\scriptsize] at (1.4,-1.35) {T: use when the emitter is not at ground};
  \end{scope}
\end{circuitikz}
\end{document}
```

Build it like the MOS one: perturb $V_{BE}$ → $g_mv_\pi$ and (new) $r_\pi$ for the base current; perturb $V_{CE}$ → $r_o$. There is no body terminal and no $g_{mb}$: the base is the only control input.

> [!tip] Remark
> The hybrid-π is [[MosFETs#Small-Signal Models|the MOS model]] with $r_\pi$ added and $g_{mb}$ removed. The T model puts $r_e = \alpha/g_m$ in the emitter explicitly; the base current $v_{be}/r_\pi$ comes out automatically. They are the same two-port.

## Temperature Behaviour

### V_BE vs Temperature

```tikz title="V_BE versus T at constant current for two current densities J and J/8 (to first order: straight lines through V_G0 at T = 0). Each falls about 2 mV/K (CTAT); their difference grows in proportion to T (PTAT). After Sedra Fig. 6.17 and Razavi Sec. 12.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.0,0) node[right] {$T$ (K)};
  \draw[->] (0,0) -- (0,5.0) node[above] {$V_{BE}$ (V)};
  \foreach \t in {100,200,300,400} { \draw ({\t/57},0.08) -- ({\t/57},-0.08) node[below,font=\scriptsize] {\t}; }
  \foreach \v in {0.4,0.8,1.2} { \draw (0.08,{\v*3.6}) -- (-0.08,{\v*3.6}) node[left,font=\scriptsize] {\v}; }
  \draw[thick,domain=0:420,samples=2] plot ({\x/57},{3.6*(1.2-(1.2-0.65)*\x/300)});
  \draw[thick,dashed,domain=0:420,samples=2] plot ({\x/57},{3.6*(1.2-(1.2-0.596)*\x/300)});
  \fill (0,4.32) circle (1.5pt);
  \node[font=\scriptsize,anchor=west] at (0.15,4.6) {$V_{G0}\approx E_g/q\approx1.2$ V at $T=0$};
  \node[font=\scriptsize,anchor=west] at (7.4,{3.6*(1.2-0.55*420/300)+0.2}) {$J$};
  \node[font=\scriptsize,anchor=west] at (7.4,{3.6*(1.2-0.604*420/300)-0.2}) {$J/8$};
  \draw[<->,red] ({300/57},{3.6*0.65}) -- ({300/57},{3.6*0.596});
  \node[red,font=\scriptsize,anchor=west] at ({300/57+0.1},{3.6*0.66+0.25}) {$\Delta V_{BE}=V_T\ln8\approx54$ mV};
  \draw[<->,red] ({150/57},{3.6*(1.2-0.55*0.5)}) -- ({150/57},{3.6*(1.2-0.604*0.5)});
  \node[red,font=\scriptsize,anchor=north west] at (0.3,3.0) {half as large at 150 K};
  \node[font=\scriptsize,anchor=west] at (3.0,1.0) {slope $\approx-1.8$ mV/K (CTAT)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\partial V_{BE}}{\partial T}\Big|_{I_C} = \frac{V_{BE}-(4+m)V_T-E_g/q}{T}\approx-1.5\ \text{mV/K}\quad(V_{BE}\approx750\ \text{mV},\ T = 300\ \text{K})}
$$

- Sedra and Hastings use about **−2 mV/°C**; Razavi's −1.5 mV/K is for a modern dense device with $V_{BE}\approx750$ mV. The TC depends on $V_{BE}$ itself.
- Why negative: $I_S\propto T^{4+m}e^{-E_g/kT}$ climbs very steeply with $T$ (it contains $n_i^2$), so less $V_{BE}$ is needed for the same $I_C$.
- Read it the other way (Hastings §9.1): at fixed $V_{BE}$, a **1 °C** difference between two transistors is an **8 % collector-current mismatch** (≈80,000 ppm/°C). That one number drives all of bipolar matching layout ([[#Matching Bipolar Transistors]]).
- Extrapolated to $T = 0$, $V_{BE}$ lands near the silicon bandgap voltage $V_{G0}\approx1.2$ V. That is where a "bandgap" reference gets its name and its ~1.2 V output.

> [!note]- Derivation: the $V_{BE}$ TC (Razavi Eqs. 12.8–12.13)
> $I_S\propto\mu kTn_i^2$ with $\mu\propto T^m$ ($m\approx-3/2$) and $n_i^2\propto T^3e^{-E_g/kT}$, so $I_S = bT^{4+m}e^{-E_g/kT}$ ($E_g\approx1.12$ eV). With $I_C$ held constant, $V_{BE} = V_T\ln(I_C/I_S)$ gives
> $$\frac{\partial V_{BE}}{\partial T} = \frac{\partial V_T}{\partial T}\ln\frac{I_C}{I_S} - \frac{V_T}{I_S}\frac{\partial I_S}{\partial T},\qquad \frac{V_T}{I_S}\frac{\partial I_S}{\partial T} = (4+m)\frac{V_T}{T}+\frac{E_g}{kT^2}V_T$$
> and $\frac{\partial V_T}{\partial T}\ln\frac{I_C}{I_S} = \frac{V_{BE}}{T}$. Collecting terms gives the boxed result. If $I_C$ is itself PTAT the $(4+m)$ becomes $(3+m)$: the TC gets slightly less negative ([[Bandgap References]]).

### Delta V_BE Is PTAT

$$
\boxed{\Delta V_{BE} = V_{BE1}-V_{BE2} = V_T\ln\frac{J_1}{J_2} = \frac{kT}{q}\ln n,\qquad \frac{\partial\,\Delta V_{BE}}{\partial T} = \frac kq\ln n\ \ (0.087\ \text{mV/K}\times\ln n)}
$$

Two junctions at current densities differing by $n$ (equal currents into emitter areas $1{:}n$, or a current ratio, or both). $I_S$, and with it every process and temperature dependence, cancels; only $k/q$ is left.

- Hastings: an 8:1 ratioed pair gives **54 mV at 25 °C**; a 4:1:1:4 ratioed quad (areas multiply) gives 72 mV.
- Holds over up to eight decades of current in a standard-bipolar npn, **as long as both devices stay below high-level injection** ([[#High-Level Injection]]). No other device law is this bias-independent.
- It is the ratio of **collector** currents that matters. Ratioing **emitter** currents (diode-connected devices) brings the low-current $\beta$ roll-off back in (Hastings §10.2.3).

> [!tip] Remark
> These two lines, CTAT $V_{BE}$ and PTAT $\Delta V_{BE}$, are the whole input to [[Bandgap References]]: $V_{REF} = V_{BE} + K\,\Delta V_{BE}\approx1.25$ V. That note owns the circuits; this one owns why the device behaves this way.

### Beta and gm vs Temperature

- $\beta$ **rises** with temperature (emitter injection efficiency improves): for a heavily doped standard-bipolar npn by up to about 3× over −40 to 125 °C (Hastings §9.1.1). Lateral pnps (lighter emitters) vary much less. Rising $\beta$ helps thermal runaway in power devices.
- $g_m = I_C/V_T$ falls as $1/T$ at constant $I_C$. A PTAT bias holds $g_m$ (and so bandwidth) constant, at the cost of more current hot (Carusone §8.1.1, §7.3.2).

## Second-Order Effects

### Beta vs Collector Current

```tikz title="Gummel plot (left): I_C stays ideal (slope 1/V_T) over many decades; I_B gains a recombination component at low current. Both bend at high current (high injection, series resistance). Their ratio is the beta curve (right). After Neamen Figs. 10.24-10.25 and Hastings Fig. 9.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.2,0) node[right] {$V_{BE}$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$\log I$};
  \draw[thick] plot[smooth] coordinates {(0.3,1.2) (2.5,3.2) (3.5,3.95) (4.6,4.3)};
  \node[font=\scriptsize,anchor=east] at (2.3,3.3) {$I_C$};
  \draw[thick,dashed] plot[smooth] coordinates {(0.3,0.75) (1.2,0.95) (2.0,1.3) (3.0,2.1) (3.8,2.6) (4.6,2.85)};
  \node[font=\scriptsize,anchor=west] at (3.0,1.75) {$I_B$};
  \draw[->] (2.6,0.55) -- (1.2,0.9);
  \node[font=\scriptsize,anchor=west] at (2.6,0.55) {recombination: slope $1/2V_T$};
  \node[font=\scriptsize,align=center] at (3.6,4.45) {high injection};
  \draw[<->] (2.5,1.75) -- (2.5,3.2) node[midway,right,font=\scriptsize] {$\log\beta$};
  \begin{scope}[xshift=7cm]
    \draw[->] (0,0) -- (5.6,0) node[right] {$\log I_C$};
    \draw[->] (0,0) -- (0,4.0) node[above] {$\beta$};
    \draw[thick] plot[smooth] coordinates {(0.2,1.0) (1.0,2.3) (2.0,3.1) (3.2,3.2) (4.2,2.9) (5.0,1.4)};
    \node[font=\scriptsize,align=center] at (0.9,3.5) {low-current\\ roll-off};
    \node[font=\scriptsize] at (2.6,3.55) {plateau};
    \node[font=\scriptsize,align=left,anchor=west] at (4.9,2.6) {high-current\\ roll-off};
    \draw[thick,dotted] plot[smooth] coordinates {(0.2,0.9) (1.4,1.7) (2.6,2.0) (3.4,1.6) (3.9,0.6)};
    \node[font=\scriptsize,anchor=west] at (3.5,0.4) {lateral pnp};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Low current:** recombination in the EB depletion region (and at the oxide interface) adds a base current that grows only as $e^{V_{BE}/2V_T}$, so $\beta$ drops. Avalanching the EB junction even once permanently worsens it (new surface traps).
- **High current:** high-level injection lowers emitter efficiency and bends $I_C$ (next). The **lateral pnp** has a lower and narrower peak; it can sit in high injection already at its peak $\beta$ (Hastings).
- Bias matched and ratioed devices on the flat part, and at no more than 1/3 to 1/2 of the high-injection onset (Hastings rule 13).

### High-Level Injection

$$
\boxed{\text{low injection: } I_C\propto e^{V_{BE}/V_T}\qquad\text{high injection: } I_C\propto e^{V_{BE}/2V_T}}
$$

When the injected electron density $n_p(0)$ approaches the base doping, the hole density must rise with it (charge neutrality): more holes are back-injected into the emitter (lower $\beta$), and $n_p(0)$ only grows as $n_i e^{V_{BE}/2V_T}$. It looks like a series resistance on the Gummel plot (Neamen §10.4.2). Find the onset by laying a ruler on the measured $\log I_C$ vs $V_{BE}$ plot (Hastings).

### Kirk Effect

At high current density so many electrons cross the CB depletion region that their charge cancels the collector-side donors; the depletion region jumps to the buried layer and the **neutral base pushes out into the collector**. Effective $W$ grows, so $\beta$ and $f_T$ drop (Carusone §8.1.2, Hastings §9.2.1). The onset is the practical upper limit of collector current density, and it comes earlier for lightly doped (high-voltage) collectors.

### Base Resistance and Current Crowding

```tikz title="Base current flows laterally under the emitter, so the edge of the emitter sees more forward bias than the centre and injects most of the current. After Neamen Figs. 10.27-10.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[yellow!25] (0,0) rectangle (9,1.2);
  \fill[orange!40] (0.6,1.2) rectangle (8.4,2.4);
  \fill[green!40] (2.6,1.75) rectangle (6.4,2.4);
  \draw (0,0) rectangle (9,2.4);
  \node[font=\scriptsize] at (4.5,2.1) {$n^+$ emitter};
  \node[font=\scriptsize] at (7.6,0.5) {$n$ collector};
  \node[font=\scriptsize] at (1.4,1.5) {$p$ base};
  \draw[fill=black] (1.0,2.4) rectangle (1.6,2.55); \draw[fill=black] (7.4,2.4) rectangle (8.0,2.55);
  \node[above,font=\scriptsize] at (1.3,2.55) {$B$};
  \node[above,font=\scriptsize] at (7.7,2.55) {$B$};
  \draw[->,red,thick] (1.3,1.45) -- (2.5,1.45); \draw[->,red,thick] (7.7,1.45) -- (6.5,1.45);
  \node[red,font=\scriptsize,align=center] at (4.5,-0.45) {lateral $I_B$ through the pinched base resistance $r_{bb'}$:\\ $V_{BE}$ is highest at the emitter edges};
  \foreach \x/\w in {2.8/1.4,3.3/0.9,4.0/0.5,4.5/0.4,5.0/0.5,5.7/0.9,6.2/1.4} { \draw[->,blue,line width=\w pt] (\x,1.7) -- (\x,0.3); }
  \node[blue,font=\scriptsize,anchor=west] at (9.1,1.0) {$I_C$ crowds to edges};
\end{circuitikz}
\end{document}
```

- $r_b$ (a few hundred Ω or less, Carusone; SPICE RB 200–500 Ω) is the lightly doped base between contact and active region. It limits speed in low-gain RF stages and its thermal noise is usually the dominant BJT noise source.
- **18 mV of debiasing doubles the local current** (Hastings), so a wide emitter conducts mostly at its edges: lower effective area, lower $\beta$, local heating, worse matching. Fix in layout: narrow emitter stripes with base contacts on both sides ([[#Emitter Geometry Compact vs Narrow]]).

> [!note]- Detail: emitter bandgap narrowing and graded bases (Neamen §10.4.3, §10.4.5)
> Doping the emitter harder should keep raising emitter efficiency, but above about $10^{18}$ cm⁻³ the donor level merges with the conduction band and the bandgap shrinks by $\Delta E_g$. That raises $n_{iE}^2 = n_i^2e^{\Delta E_g/kT}$, so the emitter's minority hole density goes **up**: Neamen's example, $N_E$ from $10^{18}$ to $10^{19}$ cm⁻³ raises $p_{E0}$ by 1.5× instead of lowering it 10×. Past a point more emitter doping lowers $\beta$.
> A diffused base is doped more heavily near the emitter than the collector. The gradient builds in an electric field that **accelerates** electrons toward the collector (drift adds to diffusion), cutting the base transit time. SiGe HBTs do the same with a graded Ge fraction ([[#Models and Device Types]]).

### Breakdown

```tikz title="Idealized breakdown characteristics: open base (snapback, lowest), base tied to emitter through R or shorted, and open emitter (highest). After Hastings Fig. 9.4 and Neamen Fig. 10.35."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.2,0) node[right] {$V_{CE}$ or $V_{CB}$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$I_C$};
  \draw[thick] plot[smooth] coordinates {(0,0.05) (2.6,0.12) (3.4,0.5) (3.6,1.2)} -- (3.1,1.6) -- (3.15,3.2);
  \node[font=\scriptsize,anchor=east] at (3.0,2.6) {$BV_{CEO}$};
  \draw[thick,dashed] plot[smooth] coordinates {(0,0.05) (4.2,0.12) (4.9,0.6) (5.0,1.4)} -- (4.5,1.8) -- (4.55,3.2);
  \node[font=\scriptsize,anchor=west] at (4.6,3.0) {$BV_{CER}$, $BV_{CES}$};
  \draw[thick] plot[smooth] coordinates {(0,0.03) (6.6,0.08) (7.0,0.6) (7.1,3.2)};
  \node[font=\scriptsize,anchor=west] at (7.15,2.6) {$BV_{CBO}$};
  \node[font=\scriptsize,anchor=west] at (3.6,1.2) {snapback};
\end{circuitikz}
\end{document}
```

$$
\boxed{BV_{CEO} \approx \frac{BV_{CBO}}{\sqrt[n]{\beta}},\quad n\approx3\text{–}6}\qquad BV_{EBO}\approx6\text{–}8\ \text{V}
$$

- **Open base is the weakest case.** Avalanche current from the CBJ flows into the base, gets multiplied by $\beta$, and feeds back. Sedra's rule of thumb: $BV_{CEO}\approx BV_{CBO}/2$. A resistor or short from base to emitter lets that current escape, so $BV_{CEO}<BV_{CER}<BV_{CES}<BV_{CBO}$.
- **EB breakdown** (about 7 V in standard bipolar) is stable enough to make a Zener reference, but it is surface avalanche and **permanently degrades $\beta$**. Keep matched devices' reverse $V_{EB}$ below half of $BV_{EBO}$ (Hastings rule 17); poly-emitter devices are especially fragile.
- **Punch-through:** at high $V_{CB}$ the CB depletion region can cross the whole base and reach the EB depletion region. The EB barrier collapses and current runs away.

> [!note]- Derivation: $BV_{CEO}$ from the multiplication factor (Neamen §10.4.6)
> With the base open, $I_{CEO} = \alpha I_{CEO} + I_{CBO}$, so $I_{CEO} = I_{CBO}/(1-\alpha)\approx\beta I_{CBO}$. Under avalanche each current is multiplied by $M = 1/[1-(V_{CB}/BV_{CBO})^n]$, and breakdown occurs where $\alpha M = 1$. With $\alpha\approx1-1/\beta$: $(BV_{CEO}/BV_{CBO})^n = 1-\alpha\approx1/\beta$, i.e. the boxed result. Example: $\beta = 100$, $n = 3$ gives $BV_{CEO}\approx BV_{CBO}/4.6$.

## Capacitances and f_T

### Charge Storage

```tikz title="High-frequency hybrid-pi model with base resistance and the collector-substrate capacitance of an IC device; v_pi is the voltage across B prime and E. After Carusone Fig. 8.8 and Sedra Fig. 10.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (-1.6,3) node[ocirc]{} node[left] {$B$} to[R, l=$r_b$] (0.6,3) node[circ]{} node[above left] {$B'$};
  \draw (0.6,3) to[R, l_=$r_\pi$] (0.6,0);
  \draw (0.6,3) -- (2.2,3) to[C, l_=$C_\pi$] (2.2,0);
  \draw (2.2,3) -- (2.2,4.2) to[C, l=$C_\mu$] (5,4.2) -- (5,3);
  \draw (5,3) to[cI, l=$g_m v_\pi$] (5,0);
  \draw (5,3) -- (7,3) to[R, l=$r_o$] (7,0);
  \draw (7,3) -- (8.8,3) node[ocirc]{} node[right] {$C$};
  \draw (8.2,3) to[C, l=$C_{cs}$] (8.2,0.9) -- (8.2,0.6) node[ground]{};
  \node[font=\scriptsize,anchor=west] at (8.45,0.45) {substrate};
  \draw (0.6,0) -- (7,0);
  \draw (3.6,0) -- (3.6,-0.4) node[ocirc]{} node[below] {$E$};
\end{circuitikz}
\end{document}
```

$$
\boxed{C_\pi = C_{de}+C_{je},\qquad C_{de} = \tau_F\,g_m = \tau_F\frac{I_C}{V_T},\qquad C_{je}\approx2A_EC_{je0}}
$$

$$
\boxed{C_\mu = \frac{A_CC_{jc0}}{(1+V_{CB}/\Phi_{c0})^{1/3}},\qquad C_{cs} = \frac{A_TC_{js0}}{(1+V_{CS}/\Phi_{s0})^{1/2}}}
$$

- **Diffusion capacitance $C_{de}$:** the minority charge stored in the base, $Q_n = \tau_FI_C$, must change whenever $I_C$ does. $\tau_F$ (forward transit time) is 1 to 100 ps (Sedra). $C_{de}\propto I_C$; it dominates $C_\pi$ except at low current.
- **$C_{je}$:** EB depletion capacitance, forward biased, so roughly twice its zero-bias value (Carusone's rough rule).
- **$C_\mu$:** CB depletion capacitance (graded junction, exponent about 1/3). The CB junction is much larger than the EB junction, so $C_\mu$ is not negligible despite the lighter doping. It is the Miller capacitance ([[Frequency Response]]).
- **$C_{cs}$:** collector to substrate, the largest junction (whole device footprint), in IC devices only.
- No MOS-style $C_{GS}$ split by region: the BJT's capacitances are set by bias current and junction voltages.

> [!note]- Derivation: $\tau_F = W^2/2D_n$ (Carusone App. 8.6.2)
> The base holds a triangle of excess electrons: $Q_b = A_Eq\,n_b(0)W/2$. Dividing by $I_C = A_EqD_nn_b(0)/W$:
> $$Q_b = \frac{W^2}{2D_n}I_C = \tau_bI_C,\qquad C_d = \frac{dQ_b}{dV_{BE}} = \tau_b\frac{I_C}{V_T}$$
> The same form as a diode's diffusion capacitance ([[Diodes]]). In practice $\tau_F$ is specified per process and lumps in the other storage terms too.

### Unity-Gain Frequency f_T

```tikz title="Short-circuit current gain beta(f): one pole at f_beta, then -20 dB/dec, crossing 1 at f_T = beta_0 f_beta. After Sedra Fig. 10.8 and Neamen Fig. 10.42."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.2,0) node[right] {$\log f$};
  \draw[->] (0,-0.6) -- (0,3.6) node[above] {$|\beta|$ (dB)};
  \draw[thick] (0,2.8) -- (2.4,2.8) -- (6.6,0) -- (7.6,-0.67);
  \draw[dashed] (2.4,0) -- (2.4,2.8);
  \node[below,font=\scriptsize] at (2.4,0) {$f_\beta$};
  \node[below,font=\scriptsize] at (6.6,0) {$f_T$};
  \fill (6.6,0) circle (1.5pt);
  \node[left,font=\scriptsize] at (0,2.8) {$\beta_0$};
  \node[left,font=\scriptsize] at (0,0) {$0$ dB};
  \node[font=\scriptsize,anchor=west] at (4.6,1.9) {$-20$ dB/dec};
  \node[font=\scriptsize,anchor=west] at (2.6,3.2) {$f_\beta = f_T/\beta_0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{f_T = \frac{g_m}{2\pi(C_\pi+C_\mu)} = \left[2\pi\left(\tau_F + \frac{(C_{je}+C_\mu)V_T}{I_C}\right)\right]^{-1},\qquad f_{T,max}\approx\frac1{2\pi\tau_F} = \frac{1}{2\pi}\cdot\frac{2D_n}{W^2}}
$$

```tikz title="f_T versus collector current: rises as the junction-capacitance term shrinks, flattens at the transit-time limit, falls at high current (high injection, Kirk effect). After Carusone Fig. 8.11 and Sedra Fig. 10.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.4,0) node[right] {$\log I_C$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$f_T$};
  \draw[thick] plot[smooth] coordinates {(0.3,0.3) (1.5,1.2) (2.8,2.5) (3.8,2.9) (4.6,2.95) (5.4,2.6) (6.4,1.2)};
  \draw[dashed] (0,3.0) -- (7.0,3.0);
  \node[left,font=\scriptsize] at (0,3.0) {$f_{T,max}$};
  \node[font=\scriptsize,align=center] at (1.1,2.6) {$\propto I_C$\\ ($C_{je}$, $C_\mu$ dominate)};
  \node[font=\scriptsize,align=center] at (4.2,3.4) {$\tau_F$-limited};
  \node[font=\scriptsize,align=center] at (6.3,2.3) {Kirk /\\ high injection};
\end{circuitikz}
\end{document}
```

- $f_T$ is the frequency where the short-circuit current gain $|i_c/i_b|$ reaches 1: the same definition, and the same formula with $C_\pi\leftrightarrow C_{GS}$, $C_\mu\leftrightarrow C_{GD}$, as [[MosFETs#Full Small-Signal Model and $f_T$|the MOSFET's]].
- Typical $f_T$: hundreds of MHz to hundreds of GHz (Sedra). The hybrid-π model is good to about $0.2f_T$ (Sedra).
- **Base width $W$ is the BJT's channel length:** $f_{T,max}\propto1/W^2$, just as MOS $f_T\propto1/L^2$. But $W$ is a vertical, process-set dimension; the circuit designer controls only $I_C$.

> [!tip] Remark
> Raising $I_C$ raises $f_T$ without costing $g_mr_o$ (still $V_A/V_T$), up to the peak. In a MOSFET the same move (higher $V_{OV}$) buys $f_T$ by spending intrinsic gain ([[MosFETs#Full Small-Signal Model and $f_T$]]).

> [!note]- Detail: the four delays in $f_T$ (Neamen §10.6, Ex. 10.12)
> $\tau_{ec} = \tau_e + \tau_b + \tau_d + \tau_c$ and $f_T = 1/(2\pi\tau_{ec})$:
> - $\tau_e = r'_eC_{je}$: charging the EB junction through the emitter's diffusion resistance $r'_e = V_T/I_E$.
> - $\tau_b = W^2/2D_n$: base transit.
> - $\tau_d = x_{dc}/v_s$: crossing the CB depletion region at saturation velocity.
> - $\tau_c = r_c(C_\mu + C_s)$: charging the collector through the collector series resistance.
>
> Neamen's example ($I_E = 1$ mA, $C_{je} = 1$ pF, $W = 0.5$ µm, $D_n = 25$ cm²/s, $x_{dc} = 2.4$ µm, $r_c = 20$ Ω, $C_\mu = C_s = 0.1$ pF): $\tau_e = 25.9$ ps, $\tau_b = 50$ ps, $\tau_d = 24$ ps, $\tau_c = 4$ ps; total 103.9 ps, $f_T = 1.53$ GHz, and with $\beta = 100$, $f_\beta\approx15$ MHz. The first term is Carusone's $(C_{je}+C_\mu)V_T/I_C$, which is why $f_T$ grows with current.

## Models and Device Types

### Gummel–Poon SPICE Parameters

| SPICE | Symbol | Meaning | Typical (Carusone Table 8.1) |
|---|---|---|---|
| BF / BR | $\beta$ / $\beta_R$ | forward / reverse current gain | 100 / 1 |
| IS | $I_S$ | transport saturation current | $2\times10^{-18}$ A |
| VAF | $V_A$ | forward Early voltage | 50 V |
| RB, RE, RC | $r_b$, $R_E$, $R_C$ | series resistances | 500 Ω, 30 Ω, 90 Ω |
| CJE, CJC, CJS | $C_{je0}$, $C_{jc0}$, $C_{js0}$ | zero-bias junction caps | 0.015, 0.018, 0.040 pF |
| MJE, MJC, MJS | grading exponents | | 0.30, 0.35, 0.29 |
| VJE, VJC, VJS | built-in potentials | | 0.9, 0.7, 0.64 V |
| TF / TR | $\tau_F$ / $\tau_R$ | forward / reverse transit time | 12 ps / 4 ns |

- Most BJT parameters are given **absolutely** per unit device, not per µm²; a larger device is $M$ units in parallel. Specify RB in particular (Carusone).
- Gummel–Poon adds high- and low-current $\beta$ roll-off and high injection to Ebers–Moll. **HiCuM** is the usual model for high-frequency (high-current-density) SiGe devices.

> [!tip] Remark
> Like [[MosFETs#Different Device Models|MOS Level 1]], the hand equations in this note are the core of the simulator model. Unlike MOS, the hand model stays accurate in modern devices: the exponential law does not break down with scaling the way the square law does.

### Device Types

| Device | Process | Typical $\beta$ | Notes |
|---|---|---|---|
| **Vertical npn** | standard bipolar, BiCMOS | 50–200 | the optimized device; best matching; $V_A\approx100$–300 V |
| **Lateral pnp** | standard bipolar, BiCMOS | 10–100 | emitter, base, collector side by side at the surface; low $\beta$, low $f_T$, pronounced $\beta$ peaking |
| **Substrate (vertical) pnp** | any bipolar, **any n-well CMOS** | ~100 (old) to ~1 (deep-submicron CMOS) | collector is the grounded substrate; the bandgap device in CMOS ([[#Substrate PNP in CMOS]]) |
| **Poly-emitter npn** | fast BiCMOS | high | self-aligned poly base and emitter contacts, small $r_b$, high $f_T$ (Carusone §8.4.1) |
| **SiGe HBT** | SiGe BiCMOS | high | epitaxial SiGe base; tens to hundreds of GHz |

> [!note]- Detail: why a SiGe base helps everything at once (Carusone §8.4.2)
> An implanted base has a Gaussian profile that spreads with every anneal, so it can't be made very thin. Growing the base epitaxially makes it thin and abrupt, and lets it be **SiGe**: a heterojunction bipolar transistor (HBT). The smaller SiGe bandgap lowers the barrier for electrons, so at fixed $V_{BE}$ the electron current (and $\beta$) rises. That surplus $\beta$ is spent on heavier base doping, which lowers $r_b$. Grading the Ge fraction across the base builds in an accelerating field (lower $\tau_b$, higher $f_T$) and raises $V_A$.

### Noise

Base-resistance thermal noise and collector shot noise give an input voltage noise $4kT(r_b+1/2g_m)$; base shot noise gives an input current noise $2qI_B$. Flicker noise matters much less than in MOSFETs. Large emitters and emitter degeneration (which reduces the mirror's output noise) are the device-level levers.

> [!tip] Remark
> Noise models and analysis live in [[Noise]] (shot noise, BJT and diode models). Only the device knobs are here.

## BJT vs MOSFET

```tikz title="Transconductance efficiency versus current density (qualitative, log axis). The BJT sits at 1/V_T about 38.5 S/A until high injection; the MOSFET (EKV curve, n = 1.3) only approaches 1/(n U_T) in weak inversion and falls as 2/V_OV in strong inversion. After Jespers and Murmann Fig. 2.8 and Carusone Sec. 8.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.7,0) node[right] {current density (log)};
  \draw[->] (0,0) -- (0,6.4) node[above] {$g_m/I$ (S/A)};
  \foreach \s in {10,20,30,40} { \draw (0.08,{0.14*\s}) -- (-0.08,{0.14*\s}) node[left,font=\scriptsize] {\s}; }
  \draw[very thick,blue] (0,5.39) -- (5.0,5.39);
  \draw[very thick,blue] plot[smooth] coordinates {(5.0,5.39) (5.8,5.1) (6.6,4.0) (7.2,3.0)};
  \node[blue,font=\scriptsize,anchor=south west] at (0.2,5.42) {BJT: $1/V_T\approx38.5$ S/A, no knob};
  \node[blue,font=\scriptsize,anchor=west] at (5.3,5.6) {high injection};
  \draw[dashed] (0,4.14) -- (7.4,4.14);
  \draw[very thick,domain=-2:2,samples=100] plot ({1.2*(log10(pow(10,2*\x)+pow(10,\x))+2)},{0.14*29.6/(1+pow(10,\x))});
  \node[font=\scriptsize,anchor=south west] at (2.0,4.16) {MOS ceiling $1/(nU_T)\approx30$};
  \node[font=\scriptsize,anchor=west] at (4.3,1.6) {MOS: slide from weak to strong inversion};
\end{circuitikz}
\end{document}
```

| Property | BJT | MOSFET |
|---|---|---|
| Control law | $I_C = I_Se^{V_{BE}/V_T}$ (exact over decades) | square law → velocity saturation; simulate |
| $g_m$ per amp | $1/V_T\approx38.5$ S/A, **fixed** | $g_m/I_D$ = 3–30 S/A, **the design knob** ([[MosFETs#Why gm/ID, why ID/W]]) |
| Size dependence of $g_m$ | none (size sets current density only) | $W/L$ sets $V_{OV}$ at a given $I_D$ |
| Intrinsic gain | $V_A/V_T$, 2000–8000, bias-independent | $2/(\lambda V_{OV})$, tens in short channels, falls with current |
| Input current | $I_B = I_C/\beta$; $r_\pi = \beta/g_m$ | none at DC |
| Speed | $f_T\propto I_C$ up to $1/2\pi\tau_F$; $W$ set by process | $f_T\propto V_{OV}/L^2$; $L$ drawn by designer |
| Offset (same area) | small: $\sigma_{\Delta V_{BE}}$ = 86 µV for 6×6 µm (Hastings) | mV-level ($V_{TH}$ mismatch) |
| Voltage reference | $V_{BE}$ and $\Delta V_{BE}$ are physics-set → bandgaps | $V_{TH}$ spreads ±100–200 mV |
| Breakdown | can combine high $f_T$ with high $BV$ | thin oxide limits fast devices to 1–2 V |
| Switch | saturation is slow, $V_{CE,sat}$ offset | ideal analog switch |

> [!important] Design with BJTs: pick the current, not the inversion level
> In a BJT, $I_C$ alone sets $g_m$, $r_\pi$, $r_o$ and (up to the peak) $f_T$. Emitter area only sets the **current density**: keep it in the flat part of the $\beta$ curve, below high injection, near the $f_T$ peak for speed, and large enough to match. The trade-offs move into the components around the transistor (degeneration, loads), which is why the MOS note says the BJT has "no inversion-level knob".

> [!note]- Detail: where BJT circuits differ from their MOS twins (Carusone §8.5)
> Everything else carries over from the MOS circuits; these differences come from $I_B$ and the exponential.
> - **Simple mirror:** $I_{out} = I_{in}/(1+2/\beta)$, a $2/\beta$ error. A **beta-helper** follower supplying the bases cuts it to about $2/\beta^2$ (almost mandatory with lateral pnps, $\beta\approx$ 10–20).
> - **Degenerated mirror:** $r_{out}\approx r_o(1+g_mR_e) = r_o(1+V_{Re}/V_T)\approx11r_o$ for $V_{Re} = 0.25$ V; it also helps matching ([[#Matching Bipolar Transistors]]) and output noise.
> - **Cascode vs Wilson:** a bipolar cascode mirror loses about $4/\beta$ because $I_{in}$ feeds all four bases, so the **Wilson** (error ≈ $2/\beta^2$) is preferred. Either one's output resistance is capped near $\beta r_o/2$ (the output device's base current sets the limit), whereas a MOS cascode keeps multiplying by $g_mr_o$.
> - **Emitter follower:** gain closer to 1 than a source follower (higher $g_m$, no body effect), but finite input resistance $r_\pi+(\beta+1)R_E$, and more prone to ringing.
> - **Differential pair:** $I_{C2}-I_{C1} = \alpha I_{EE}\tanh(V_{id}/2V_T)$. It is fully switched by about $\pm4V_T\approx\pm100$ mV, a much narrower linear range than a MOS pair at moderate $V_{OV}$. Input resistance $(\beta+1)(r_{e1}+r_{e2})$.
> - Current mirrors, gain stages and differential pairs are owned by [[Current Mirrors]], [[Single-Stage]] and [[Differential Amplifiers]].

## Layout

Bipolar layout is dominated by two facts from above: **current flows vertically under the emitter, so the emitter is the device**, and **$I_C$ changes 8 % per °C**, so matching is a thermal problem first. Colour legend for every drawing below:

```tikz title="Legend, and the standard-bipolar vertical npn in cross-section. Electrons go down from the emitter, cross the thin base, travel laterally through the NBL and come up the deep-n+ sinker. The p base, n-epi and p isolation form a parasitic substrate pnp. After Hastings Figs. 9.5, 9.11 and Carusone Fig. 8.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\c/\t in {0/gray!20/{p-substrate},1/red!25/{p+ isolation},2/yellow!25/{n-epi / n-well},3/blue!35/{NBL (n+ buried)},4/cyan!45/{deep n+ sinker},5/orange!45/{p base},6/green!50/{n+ emitter / NSD},7/magenta!40/{p+ / PSD}} {
    \pgfmathsetmacro{\lx}{3.25*mod(\i,4)}
    \pgfmathsetmacro{\ly}{\i<4 ? 6.0 : 5.5}
    \fill[\c] (\lx,\ly) rectangle ({\lx+0.4},{\ly+0.3});
    \node[font=\scriptsize,anchor=west] at ({\lx+0.45},{\ly+0.15}) {\t};
  }
  \fill[black] (0,5.0) rectangle (0.3,5.3); \node[font=\scriptsize,anchor=west] at (0.45,5.15) {contact};
  \draw[dashed,thick] (3.25,5.0) rectangle (3.65,5.3); \node[font=\scriptsize,anchor=west] at (3.7,5.15) {well / NBL outline (top views)};
  \fill[gray!20] (0,0) rectangle (13,1.4);
  \fill[red!25] (0,1.4) rectangle (0.9,4);
  \fill[red!25] (12.1,1.4) rectangle (13,4);
  \fill[yellow!25] (0.9,1.4) rectangle (12.1,4);
  \fill[blue!35] (1.4,1.1) rectangle (11.6,1.9);
  \fill[orange!45] (1.8,2.8) rectangle (7.2,4);
  \fill[green!50] (3.8,3.35) rectangle (5.6,4);
  \fill[green!50] (2.2,3.35) rectangle (2.9,4);
  \fill[cyan!45] (9.4,1.9) rectangle (10.8,4);
  \fill[green!50] (9.6,3.4) rectangle (10.6,4);
  \fill[orange!45] (2.2,3.35) rectangle (2.9,4); 
  \draw (0,0) rectangle (13,4);
  \foreach \x/\l in {2.55/B,4.7/E,10.1/C} { \fill[black] ({\x-0.2},4) rectangle ({\x+0.2},4.25); \node[above] at (\x,4.25) {$\l$}; }
  \node[font=\scriptsize] at (4.7,3.68) {$n^+$};
  \node[font=\scriptsize] at (6.4,3.3) {$p$ base};
  \node[font=\scriptsize] at (7.9,2.4) {$n$-epi collector};
  \node[font=\scriptsize] at (6.5,1.5) {NBL};
  \node[font=\scriptsize] at (6.5,0.5) {$p$-substrate (lowest potential)};
  \node[font=\scriptsize,rotate=90] at (10.1,2.6) {sinker};
  \draw[->,thick,blue!70!black] (4.7,3.3) -- (4.7,2.0) -- (9.9,2.0) -- (9.9,3.3);
  \node[blue!70!black,font=\scriptsize,anchor=west] at (4.8,2.55) {$I_C$};
  \draw[->,thick,red] (1.9,2.85) -- (1.0,2.0);
  \node[red,font=\scriptsize,anchor=west] at (-0.1,-0.35) {parasitic pnp: base (E) $\to$ epi (B) $\to$ isolation/substrate (C), active only if the npn saturates};
\end{circuitikz}
\end{document}
```

### Vertical NPN in Standard Bipolar

- **Emitter:** heavy $n^+$ (high injection efficiency). **Base:** a precisely tailored p diffusion; it sets both $\beta$ and $V_A$. **Collector:** lightly doped n-epi drift region (sets $BV_{CBO}$, 20–120 V in standard processes), an NBL under the whole device and a deep-$n^+$ sinker under the collector contact (both cut collector resistance; the NBL also stops punch-through to substrate and blocks the parasitic pnp).
- Everything is placed relative to the **emitter**: emitter contact centred with equal overlap on all sides; base overlaps emitter enough to stop lateral punch-through; base contact elongated along one side; sinker at the far end of the tank, as long as the tank allows; NBL filling the tank and touching the sinker.
- Omitting the sinker saves area but raises collector resistance to thousands of ohms (Hastings).

```tikz title="Top views of the two standard small-signal npn layouts: collector-emitter-base (CEB) and collector-base-emitter (CBE). After Hastings Fig. 9.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\lab/\ex/\bx in {0/CEB/2.2/4.0,7/CBE/4.0/2.2} {
    \begin{scope}[xshift=\ox cm]
      \fill[red!25] (-0.4,-0.4) rectangle (6.0,3.0);
      \fill[yellow!25] (0,0) rectangle (5.6,2.6);
      \draw[dashed,blue!70!black,thick] (0.2,0.2) rectangle (5.4,2.4);
      \fill[cyan!45] (0.3,0.4) rectangle (1.3,2.2);
      \fill[green!50] (0.5,0.6) rectangle (1.1,2.0);
      \fill[orange!45] (1.9,0.4) rectangle (5.0,2.2);
      \fill[green!50] ({\ex-0.5},0.8) rectangle ({\ex+0.5},1.8);
      \fill[black] ({\ex-0.2},1.1) rectangle ({\ex+0.2},1.5);
      \fill[black] ({\bx-0.15},0.6) rectangle ({\bx+0.15},2.0);
      \fill[black] (0.65,0.8) rectangle (0.95,1.8);
      \node[font=\scriptsize] at (0.8,-0.75) {C};
      \node[font=\scriptsize] at (\ex,-0.75) {E};
      \node[font=\scriptsize] at (\bx,-0.75) {B};
      \node at (2.8,3.4) {\lab};
    \end{scope}
  }
  \node[font=\scriptsize,align=center] at (2.8,-1.4) {E between C and B: slightly lower $r_c$};
  \node[font=\scriptsize,align=center] at (9.8,-1.4) {B between C and E: preferred in matched arrays};
\end{circuitikz}
\end{document}
```

### Emitter Geometry: Compact vs Narrow

```tikz title="Good vs bad for a large npn. A compact (wide) emitter (left) has high beta at low speed, but its pinched base resistance crowds the current to the edge nearest the base contact. A narrow emitter stripe with base contacts on both sides (double-base, right) has about a quarter of the base resistance and uniform injection, at lower beta. After Hastings Figs. 9.15-9.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!45] (0,0) rectangle (5,3.4);
  \fill[green!50] (1.4,0.4) rectangle (4.6,3.0);
  \fill[black] (0.3,0.5) rectangle (0.6,2.9);
  \fill[black] (2.6,1.4) rectangle (3.4,2.0);
  \fill[red!40,opacity=0.6] (1.4,0.4) rectangle (1.9,3.0);
  \node[font=\scriptsize,align=center] at (3.0,-0.5) {compact emitter: current crowds\\ to the edge facing the base contact};
  \draw[<-,red] (1.65,1.7) -- (0.9,-0.1);
  \node[font=\scriptsize] at (0.45,3.65) {B};
  \node[font=\scriptsize] at (3.0,3.65) {E};
  \begin{scope}[xshift=7.5cm]
    \fill[orange!45] (0,0) rectangle (3.4,3.4);
    \fill[green!50] (1.3,0.3) rectangle (2.1,3.1);
    \fill[black] (1.55,0.5) rectangle (1.85,2.9);
    \fill[black] (0.4,0.5) rectangle (0.7,2.9);
    \fill[black] (2.7,0.5) rectangle (3.0,2.9);
    \node[font=\scriptsize] at (0.55,3.65) {B};
    \node[font=\scriptsize] at (1.7,3.65) {E};
    \node[font=\scriptsize] at (2.85,3.65) {B};
    \node[font=\scriptsize,align=center] at (1.7,-0.5) {narrow stripe, two base contacts:\\ $r_b\approx\frac14$, uniform, faster};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Compact emitter:** high $\beta$ (large area-to-periphery ratio; Hastings measured peak $\beta$ 290 for a small vs 520 for a large emitter), but the pinched base under it (sheet resistance in the kΩ/□ range) slows switching and crowds current. Use for high $\beta$ at moderate speed.
- **Narrow emitter / double base:** lower $r_b$ and higher speed, lower $\beta$; at high current density vulnerable to thermal runaway (power layouts are a separate topic, Hastings §10.1).
- **Effective ≠ drawn emitter area:** sidewalls and outdiffusion make $I_S$ grow less than linearly with drawn area, and small emitters have lower $\beta$. **Ratios therefore come only from copies of one unit emitter.**

> [!tip] Remark
> This is [[MosFETs#Layout|MOS finger folding]] for the BJT: there, gate resistance per finger; here, base resistance under the emitter, plus the crowding of [[#Base Resistance and Current Crowding]].

### Lateral PNP

```tikz title="Lateral pnp in standard bipolar: a p plug emitter inside an annular p collector, n-epi tank as base. Holes from the emitter sidewall reach the collector (wanted); holes from its bottom are repelled by the NBL high-low junction (otherwise they reach the substrate: parasitic substrate pnp). After Hastings Fig. 9.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (0,0) rectangle (10,1.2);
  \fill[red!25] (0,1.2) rectangle (0.7,3.6); \fill[red!25] (9.3,1.2) rectangle (10,3.6);
  \fill[yellow!25] (0.7,1.2) rectangle (9.3,3.6);
  \fill[blue!35] (1.0,0.9) rectangle (9.0,1.6);
  \fill[orange!45] (2.0,2.7) rectangle (3.6,3.6);
  \fill[orange!45] (4.4,2.7) rectangle (5.6,3.6);
  \fill[orange!45] (6.4,2.7) rectangle (8.0,3.6);
  \fill[green!50] (8.3,3.1) rectangle (9.0,3.6);
  \draw (0,0) rectangle (10,3.6);
  \foreach \x/\l in {2.8/C,5.0/E,7.2/C,8.65/B} { \fill[black] ({\x-0.18},3.6) rectangle ({\x+0.18},3.82); \node[above] at (\x,3.82) {$\l$}; }
  \draw[->,thick,blue!70!black] (4.35,3.1) -- (3.65,3.1);
  \draw[->,thick,blue!70!black] (5.65,3.1) -- (6.35,3.1);
  \draw[->,thick,red] (5.0,2.65) -- (5.0,1.75);
  \node[red,font=\scriptsize,anchor=west] at (5.1,2.15) {repelled by NBL};
  \node[font=\scriptsize] at (1.5,2.3) {n-epi (base)};
  \node[font=\scriptsize] at (5.0,1.25) {NBL};
  \node[font=\scriptsize] at (5.0,0.4) {p-substrate};
  \begin{scope}[xshift=11.3cm,yshift=0.4cm]
    \fill[yellow!25] (0,0) rectangle (3.2,3.2);
    \draw[dashed,blue!70!black,thick] (0.15,0.15) rectangle (3.05,3.05);
    \fill[orange!45] (0.5,0.5) rectangle (2.7,2.7);
    \fill[yellow!25] (0.95,0.95) rectangle (2.25,2.25);
    \fill[orange!45] (1.3,1.3) rectangle (1.9,1.9);
    \fill[black] (1.45,1.45) rectangle (1.75,1.75);
    \fill[black] (0.6,0.6) rectangle (0.85,2.6);
    \fill[green!50] (2.78,0.4) rectangle (3.0,2.8);
    \fill[black] (2.83,1.3) rectangle (2.95,1.9);
    \node[font=\scriptsize] at (1.6,-0.3) {top view (B contact at right)};
    \node[font=\scriptsize,align=center] at (1.6,3.6) {annular C, plug E};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Costs nothing extra in a bipolar or BiCMOS process (the npn's base diffusion serves as both emitter and collector), but $\beta$ is low and peaks narrowly, $f_T$ is low, and current flows near the surface (more recombination, more variation).
- **Collector efficiency** $I_C/(I_C+I_B)$ above 95 % (often 99 %) needs the NBL; without it, below 0.5 (Hastings §9.1.4).
- Matched laterals use **minimum** emitters (larger emitters lower $\beta$, which hurts more than area helps), each emitter in its own identical collector opening, a field plate (tied to the emitter) over the neutral base, and usually emitter degeneration.

### Substrate PNP in CMOS

```tikz title="The CMOS substrate pnp, the bandgap device: p+ (PSD) emitter with one central contact in an n-well base, an n+ (NSD) base-contact ring, and the p-substrate as collector, contacted by a p+ ring. Top view (left) and cross-section (right). After Hastings Fig. 9.29 and Razavi Fig. 12.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (-0.6,-0.6) rectangle (5.2,5.2);
  \fill[magenta!40] (-0.4,-0.4) rectangle (5.0,5.0);
  \fill[gray!20] (0.0,0.0) rectangle (4.6,4.6);
  \fill[yellow!25] (0.4,0.4) rectangle (4.2,4.2);
  \draw[dashed,thick] (0.4,0.4) rectangle (4.2,4.2);
  \fill[green!50] (0.8,0.8) rectangle (3.8,3.8);
  \fill[yellow!25] (1.3,1.3) rectangle (3.3,3.3);
  \fill[magenta!40] (1.8,1.8) rectangle (2.8,2.8);
  \fill[black] (2.15,2.15) rectangle (2.45,2.45);
  \foreach \y in {1.2,1.8,2.4,3.0} { \fill[black] (0.9,\y) rectangle (1.15,{\y+0.25}); }
  \foreach \y in {0.6,1.6,2.6,3.6} { \fill[black] (-0.3,\y) rectangle (-0.08,{\y+0.22}); }
  \draw[densely dotted,thick] (2.0,2.0) rectangle (2.6,2.6);
  \node[font=\scriptsize,anchor=west] at (5.3,4.6) {p+ ring: substrate (C)};
  \node[font=\scriptsize,anchor=west] at (5.3,3.9) {n+ ring: base (B)};
  \node[font=\scriptsize,anchor=west] at (5.3,3.2) {p+ emitter (E), one contact};
  \node[font=\scriptsize,anchor=west] at (5.3,2.5) {silicide only inside dotted box};
  \begin{scope}[xshift=9.2cm,yshift=0.6cm]
    \fill[gray!20] (0,0) rectangle (7,3.2);
    \fill[yellow!25] (1.2,1.4) rectangle (5.8,3.2);
    \draw[dashed] (1.2,3.2) -- (1.2,1.4) -- (5.8,1.4) -- (5.8,3.2);
    \fill[magenta!40] (0.2,2.8) rectangle (0.9,3.2); \fill[magenta!40] (6.1,2.8) rectangle (6.8,3.2);
    \fill[green!50] (1.5,2.8) rectangle (2.2,3.2); \fill[green!50] (4.8,2.8) rectangle (5.5,3.2);
    \fill[magenta!40] (3.0,2.8) rectangle (4.0,3.2);
    \draw (0,0) rectangle (7,3.2);
    \foreach \x/\l in {0.55/C,1.85/B,3.5/E,5.15/B,6.45/C} { \draw (\x,3.2) -- (\x,3.6) node[above,font=\scriptsize] {$\l$}; }
    \draw[->,thick] (3.5,2.75) -- (3.5,0.4);
    \node[font=\scriptsize,anchor=west] at (3.6,0.9) {holes to substrate};
    \node[font=\scriptsize] at (4.6,1.75) {n-well};
    \node[font=\scriptsize] at (1.3,0.4) {p-sub $=$ gnd};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **The only bipolar in a plain n-well CMOS process,** and free (no extra masks). The collector is the substrate, so it is **always at ground**: it can only be used diode-connected or as an emitter follower to ground, which is why CMOS bandgap cores hang each junction from ground ([[Bandgap References]]).
- **$\beta$ degrades with scaling:** an old 10 V CMOS gives $\beta>100$; deep-submicron processes, with heavily doped shallow wells, give $\beta$ "scarcely in excess of one" (Hastings §9.3.1). Base current is then a first-order error, not a correction.
- **High base resistance** (the pinched well under the emitter): keep $I_C$ low, about 0.1 mA or less (Carusone, via [[Bandgap References]]).
- **Short-emitter effect:** a shallow emitter lets injected minority carriers reach the contact/silicide and recombine there, which lowers $\beta$. Use **one contact** centred in the emitter and **silicide block** everywhere else in the emitter. For more area, use minimum-width emitter strips rather than one large square.
- **Annular base ring** (n+) around the emitter minimizes base resistance; contacts along one side of the ring suffice.
- **Substrate contacts** (p+ ring) close to every substrate pnp: its collector current flows through the substrate and can debias neighbours (Hastings: keep under about 1 mA per device and 10 mA total in standard bipolar).
- **Retrograde wells** (newer processes) make a high-low junction that blocks this vertical device; such processes instead offer a **lateral pnp** defined by a poly ring (gains of 50–100 reported, collector efficiency above 0.9; Hastings Fig. 9.30).
- Unit emitters, identical, separated by several µm of undepleted well; the $1{:}n$ device is $n$ copies, laid out common-centroid ([[#Ratioed Pairs and Quads]]).

> [!note]- Detail: BiCMOS npn options (Hastings §9.3.2–9.3.5)
> - **Analog BiCMOS** adds an NBL and builds a collector-diffused-isolation (CDI) npn from the n-well plus NBL, and lateral pnps.
> - **Shallow-well npn** (triple-well CMOS): n+ emitter in a shallow p-well base inside a deep n-well collector. $\beta>100$ has been reached, but without NBL or sinker its collector resistance is several kΩ, and it needs a p+ channel-stop ring and an emitter-connected metal field plate to suppress surface channels.
> - **Fast BiCMOS** uses poly emitters, oxide (trench) isolation and SiGe bases ([[#Device Types]]).

### Matching Bipolar Transistors

$$
\boxed{\Delta V_{BE} = V_T\ln\frac{A_{E2}}{A_{E1}}\ \ (\text{1 \% area mismatch} \to 0.25\ \text{mV})}
$$

$$
\boxed{\sigma\!\left(\frac{I_{C2}}{I_{C1}}\right) = \frac{k_A}{\sqrt{A_E}},\qquad \sigma(\Delta V_{BE}) = \frac{k_AV_T}{\sqrt{A_E}},\qquad k_A\approx2\,\%\cdot\mu\text{m}}
$$

- **Random part:** fluctuations in base doping and emitter area/periphery, all lumped into effective emitter area. Hastings: two $6\times6$ µm emitters give $\sigma(I_{C2}/I_{C1}) = 0.33$ % and $\sigma(\Delta V_{BE})\approx86$ µV. Carusone writes the same law as $\sigma^2(\Delta I_C/I_C) = A_{Ic}^2/A_E$ with $A_{Ic} = 0.01$–0.04 µm (1–4 %·µm), consistent.
- **Systematic part dominates in practice:** thermal gradients (−2 mV/°C: a 1 mV offset is only **0.5 °C**), package stress, the NBL shadow, unequal $V_{CE}$. Layout cancels these; area can't.

> [!tip] Remark
> Why BJT offsets beat MOS offsets at equal area: the high $g_m/I_C$ turns a current mismatch into a small voltage, $\sigma_{V}=V_T\,\sigma_I$. The mismatch statistics framework itself (Pelgrom, area scaling) belongs to [[Nonlinearity and Mismatch]].

**Matching grades** (Hastings §10.3, six-sigma, −40 to 125 °C, plastic package):

| Grade | $\Delta V_{BE}$ | $\Delta I_C$ | Good enough for |
|---|---|---|---|
| Minimal | ±2 mV | ±8 % | general op-amp/comparator inputs, non-critical mirrors |
| Moderate | ±0.5 mV | ±2 % | ±1 % bandgaps, untrimmed few-mV offsets; hard in plastic (package shift) |
| Exceptional | ±0.1 mV | ±0.5 % | needs post-package trim or matched degeneration resistors |

#### Cross-Coupled Pairs

```tikz title="Cross-coupled quad for a matched pair: A and B each split in two, placed diagonally, so both share one centroid. Emitters AND base contacts must be common-centroid; collector contacts sit outside. A linear thermal gradient cancels; the quadratic part does not, so keep it compact. After Hastings Fig. 10.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \cx/\cy/\l/\c in {0/2.4/A/white,2.6/2.4/B/gray!25,0/0/B/gray!25,2.6/0/A/white} {
    \fill[orange!45] (\cx,\cy) rectangle ({\cx+2.3},{\cy+2.1});
    \fill[green!50] ({\cx+0.9},{\cy+0.6}) rectangle ({\cx+1.7},{\cy+1.5});
    \fill[black] ({\cx+1.15},{\cy+0.85}) rectangle ({\cx+1.45},{\cy+1.25});
    \node[font=\bfseries] at ({\cx+1.3},{\cy+1.8}) {\l};
  }
  \foreach \cx/\cy in {0/2.4,0/0} { \fill[black] ({\cx+1.95},{\cy+0.5}) rectangle ({\cx+2.15},{\cy+1.6}); }
  \foreach \cx/\cy in {2.6/2.4,2.6/0} { \fill[black] ({\cx+0.15},{\cy+0.5}) rectangle ({\cx+0.35},{\cy+1.6}); }
  \foreach \y in {0.3,2.7} { \fill[cyan!45] (-0.9,\y) rectangle (-0.3,{\y+1.5}); \fill[cyan!45] (5.2,\y) rectangle (5.8,{\y+1.5}); }
  \node[font=\scriptsize] at (-0.6,-0.3) {C};
  \node[font=\scriptsize] at (5.5,-0.3) {C};
  \fill (2.45,2.25) circle (2pt);
  \node[font=\scriptsize,anchor=north] at (2.45,-0.35) {both centroids at $\bullet$};
  \draw[->,red,thick] (6.6,0) -- (8.6,1.6) node[right,font=\scriptsize] {$\nabla T$};
  \node[font=\scriptsize,align=left,anchor=west] at (6.5,3.8) {$T = T_0 + g_xx + g_yy$:\\ A at $(\pm d,\mp d)$, B at $(\pm d,\pm d)$\\ $\Rightarrow \bar T_A = \bar T_B = T_0$};
\end{circuitikz}
\end{document}
```

- The orientation shown (collector contacts outward, CBE order) brings emitters and base contacts as close together as possible. The **base contacts** must be common-centroid too: their thermoelectric potentials would otherwise add an offset.
- Since $I_C$ is exponential in $V_{BE}$, even a linear gradient has a nonlinear effect: common centroid removes the linear part only. **Compactness** removes the rest.

#### Ratioed Pairs and Quads

```tikz title="Good vs bad for an 8:1 ratioed pair. One-dimensional 4-1-4 (left) cancels a linear gradient but spans 9 pitches; 3x3 eight-around-one (right) also cancels it and spans 3. For a quadratic gradient T = c x^2 the residue is the mean x^2 of the 8X device: 7.5 pitch^2 vs 0.75 pitch^2, ten times smaller. After Hastings Figs. 10.24, 10.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i in {-4,...,4} {
    \ifnum\i=0 \fill[gray!35] ({0.75*\i+3},0) rectangle ({0.75*\i+3.65},0.65); \else \fill[green!30] ({0.75*\i+3},0) rectangle ({0.75*\i+3.65},0.65); \fi
    \draw ({0.75*\i+3},0) rectangle ({0.75*\i+3.65},0.65);
    \node[font=\scriptsize] at ({0.75*\i+3.325},0.325) {\ifnum\i=0 1X\else A\fi};
    \node[font=\tiny] at ({0.75*\i+3.325},-0.25) {\i};
  }
  \node[font=\scriptsize,align=center] at (3.3,-1.1) {1-D 4-1-4: $\langle x^2\rangle_A = (1+4+9+16)/4 = 7.5$};
  \node[red,font=\scriptsize] at (3.3,1.1) {bad: long, residue $7.5c$};
  \begin{scope}[xshift=8.5cm,yshift=-0.9cm]
    \foreach \x in {-1,0,1} { \foreach \y in {-1,0,1} {
      \ifnum\x=0 \ifnum\y=0 \fill[gray!35] ({0.8*\x+1.2},{0.8*\y+1.2}) rectangle ({0.8*\x+1.9},{0.8*\y+1.9}); \else \fill[green!30] ({0.8*\x+1.2},{0.8*\y+1.2}) rectangle ({0.8*\x+1.9},{0.8*\y+1.9}); \fi \else \fill[green!30] ({0.8*\x+1.2},{0.8*\y+1.2}) rectangle ({0.8*\x+1.9},{0.8*\y+1.9}); \fi
      \draw ({0.8*\x+1.2},{0.8*\y+1.2}) rectangle ({0.8*\x+1.9},{0.8*\y+1.9});
    } }
    \node[font=\scriptsize] at (1.55,1.55) {1X};
    \node[font=\scriptsize,align=center] at (1.55,-0.15) {3$\times$3: $\langle x^2\rangle_A = 6/8 = 0.75$};
    \node[blue!70!black,font=\scriptsize] at (1.55,3.15) {good: compact, residue $0.75c$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- $\Delta V_{BE}$ grows only as $\ln n$, while the gradient error grows roughly linearly with the array size. The best ratio is somewhere between **6:1 and 16:1**; **8:1** (3×3, eight around one) is the most popular pair and **4:1:1:4** the most popular quad (Hastings).
- An 8:1 pair gives 54 mV, so a 1 mV mismatch is a **2 %** error in the PTAT voltage, caused by only 0.5 °C.
- A 1-D (ABA) array must have its long axis **along the isotherms** (perpendicular to the direction toward the heat source).
- Several emitters may share one base region (more compact), but then space them by the rule for **unconnected** emitters plus margin: merged depletion regions shrink effective area.

> [!note]- Detail: the NBL shadow and pattern shift (Hastings §10.2.5)
> The NBL anneal leaves a surface step that the epi reproduces, displaced sideways by up to about twice the epi thickness. If it crosses one emitter of a 2X device and the single emitter of a 1X device, a 1 % area loss on each gives 1.99:0.99 ≈ 2.01:1, a 0.5 % (0.13 mV) mismatch. Fix: oversize the NBL around matched emitters (assume a shift of 150 % of the epi thickness if unknown), or lay out CEB arrays with the symmetry axis along the shift so it lands on contacts. STI processes have no NBL shadow.

#### Placement on the Die

```tikz title="Where to put matched bipolars: far from heat sources, on an axis of die symmetry, away from edges and especially corners (stress gradients). After Hastings Figs. 10.28-10.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[red!12] (0,0) rectangle (7,7);
  \fill[white] (0.8,0.8) rectangle (6.2,6.2);
  \foreach \x/\y in {0/0,6/0,0/6,6/6} { \fill[red!35] (\x,\y) rectangle ({\x+1},{\y+1}); }
  \draw[thick] (0,0) rectangle (7,7);
  \draw[dashed] (3.5,0) -- (3.5,7); \draw[dashed] (0,3.5) -- (7,3.5);
  \fill[orange!60] (2.6,5.6) rectangle (4.4,6.6);
  \node[font=\scriptsize] at (3.5,6.1) {power device};
  \draw[blue!70!black,thick,fill=green!30] (2.9,1.0) rectangle (4.1,1.7);
  \node[font=\scriptsize] at (3.5,1.35) {ABA};
  \draw[->,red] (3.5,5.5) -- (3.5,2.0) node[midway,right,font=\scriptsize] {$\nabla T$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.3,6.2) {heat source on one side,\\ matched array on the far side,\\ on the die axis};
  \node[font=\scriptsize,align=left,anchor=west] at (7.3,4.0) {array's long axis along\\ the isotherms (perpendicular\\ to $\nabla T$)};
  \node[font=\scriptsize,align=left,anchor=west] at (7.3,1.6) {shaded: edge band and corners\\ have the largest stress gradients};
\end{circuitikz}
\end{document}
```

- **Stress (piezojunction effect):** package stress shifts $I_S$. 100 MPa in-plane shifts $V_{BE}$ by 0.4 mV (vertical npn, (111) Si) to 0.9 mV ((100) Si). Gradients are smallest at the die centre and largest at edges and corners; on (100) silicon the **vertical pnp** is about 3× less stress-sensitive than the vertical npn, a reason to build bandgaps on substrate pnps there (Hastings §10.2.4, rule 18).
- **Package shift** of a bandgap's $V_{BE}$ in plastic is millivolts (one SOT-23 family: σ = 2.3 mV), from filler particles pressing on the die. Layout can't cancel it (too local); polyimide overcoats, thick copper or low-stress mold compound help.

#### Rules for Matching Vertical Transistors

1. **Identical emitter geometries** (size and shape); ratios only as integer counts of a unit emitter.
2. **Emitter width at least 2× minimum** (typically 8–40 µm wide); for exceptional matching use arrays of moderate emitters, not one huge one.
3. **Circular (32- or 64-segment) or square emitters,** with a contact of the same shape, concentric.
4. **Close proximity;** common centroid recommended for minimal, mandatory for moderate and exceptional.
5. **Compact** arrays: cross-coupled quads, 2-D common centroid.
6. **Ratioed pairs/quads at even ratios 4:1 to 16:1** (8:1, 4:1:1:4 for moderate matching).
7. **Far from power devices** (opposite side of the die; heat sinks help only far away).
8. **Low-stress location:** near the centre unless there is a heat source; never near corners.
9. **On an axis of die symmetry** (moderate and exceptional).
10. **NBL shadow must not touch matched emitters.**
11. **Emitters in a common base spaced apart** (unconnected-emitter rule plus a base junction depth).
12. **Extra base overlap of emitter** (1–2 µm beyond the rule) for moderate/exceptional.
13. **Stay below high-level injection** (at most 1/3 to 1/2 of its onset current).
14. **Contact geometry matches emitter geometry** (and silicide, if silicide-blocked).
15. **Emitter degeneration** for moderate/exceptional in large thermal gradients: ≥ 50 mV (moderate), ≥ 100 mV (exceptional). Not applicable to ratioed pairs.
16. **Equal $V_{CE}$** for moderate/exceptional (cascode them).
17. **Never avalanche the EB junction;** reverse $V_{EB}$ < 50 % of $BV_{EBO}$, clamp pins.
18. **On (100) silicon, consider vertical-pnp-based circuits** (lower stress sensitivity).

Lateral pnps add: identical emitter **and** collector geometries, **minimum** emitters, concentric collector inner edge, field-plated base, split collectors only for moderate matching and never saturated (Hastings §10.3.2).

> [!note]- Why: emitter degeneration and the Early mismatch (Hastings Eqs. 10.10–10.11, 10.21)
> A resistor that drops $V_d$ in each emitter shrinks the effect of any $V_{BE}$ (i.e. $I_S$) error on the collector current by
> $$\frac{\mathfrak{R}_d}{\mathfrak{R}} = \frac{V_T}{V_T+V_d}$$
> so the matching burden moves to the resistors, which can be interdigitated. $V_d = 50$ mV gives about 3×; $V_d = 100$ mV about 5× by this formula (Hastings rounds to "about six"). With 250–500 mV, transistor size barely matters, and non-integer ratios become possible (e.g. 3.4:1 from a 3X device with 10 kΩ against a 1X device with 34 kΩ). The same factor improves output resistance.
> Unequal $V_{CE}$ gives $I_{C1}/I_{C2}\approx1+(V_{CE1}-V_{CE2})/V_A$ (times $V_T/(V_T+V_d)$ if degenerated): 1 V difference on $V_A = 150$ V is about 0.7 %.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $I_C$ | $g_m$ (∝ $I_C$), $f_T$ up to its peak, lower $r_\pi$ noise term $1/2g_m$ | power, lower $r_\pi$ and $r_o$ (same $g_mr_o$), base current; past the peak $f_T$ and $\beta$ fall (Kirk, high injection) |
| ↑ Emitter area at fixed $I_C$ | matching ($\propto1/\sqrt{A_E}$), $\beta$ (vertical), lower $r_b$ noise, further from high injection | capacitance ($C_{je}$, $C_\mu$, $C_{cs}$), lower $f_T$ at that current, sensitivity to gradients |
| Narrow emitter, double base | lower $r_b$, uniform injection, speed | lower $\beta$, area |
| Emitter degeneration ($V_d$) | matching and $r_{out}$ by $1+V_d/V_T$, linearity | headroom, lower effective $g_m$, resistor noise |
| PTAT bias current | constant $g_m$ and bandwidth over temperature | more current when hot |
| Larger ratio $n$ in a ratioed pair | larger $\Delta V_{BE} = V_T\ln n$ | larger array, more gradient error (best 6–16) |
| npn instead of pnp | higher $\beta$, $f_T$, better matching | pnp (substrate) may be all you have in CMOS; vertical pnp less stress-sensitive on (100) |
| Allow saturation | low $V_{CE}$ | 100× slower turn-off, substrate injection, current hogging |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Collector current | $I_C = I_Se^{V_{BE}/V_T}(1+V_{CE}/V_A)$ |
| Scale current | $I_S = A_EqD_nn_i^2/(WN_A)$ |
| Thermal voltage | $V_T = kT/q\approx26$ mV at 300 K |
| Current gains | $I_B = I_C/\beta$, $I_E = I_C/\alpha$, $\alpha = \beta/(\beta+1)$ |
| $\beta$ from doping | $\beta\approx\frac{D_nN_DL_p}{D_pN_AW}$ |
| Saturation-charge removal | $t_s\approx\tau_sI_B/I_{BR}$ |
| Transconductance | $g_m = I_C/V_T$ |
| Input / emitter resistance | $r_\pi = \beta/g_m$, $r_e = \alpha/g_m$, $r_\pi = (\beta+1)r_e$ |
| Reflection rules | $R_b = r_\pi+(\beta+1)R_E$; $R_e = r_e + R_S/(\beta+1)$ |
| Output resistance | $r_o = V_A/I_C$ |
| Intrinsic gain | $g_mr_o = V_A/V_T$ |
| $V_{BE}$ TC | $\partial V_{BE}/\partial T = [V_{BE}-(4+m)V_T-E_g/q]/T\approx-1.5$ to $-2$ mV/K |
| PTAT | $\Delta V_{BE} = V_T\ln n$, TC $(k/q)\ln n$ |
| High injection | $I_C\propto e^{V_{BE}/2V_T}$ |
| Breakdown | $BV_{CEO}\approx BV_{CBO}/\beta^{1/n}$, $n = 3$–6 |
| Capacitances | $C_\pi = \tau_Fg_m + C_{je}$, $C_\mu = A_CC_{jc0}/(1+V_{CB}/\Phi_{c0})^{1/3}$, $C_{cs} = A_TC_{js0}/(1+V_{CS}/\Phi_{s0})^{1/2}$ |
| Transit time | $\tau_F\approx W^2/2D_n$ |
| Unity-gain frequency | $f_T = g_m/[2\pi(C_\pi+C_\mu)] = [2\pi(\tau_F+(C_{je}+C_\mu)V_T/I_C)]^{-1}$, $f_\beta = f_T/\beta_0$ |
| Random mismatch | $\sigma(I_{C2}/I_{C1}) = k_A/\sqrt{A_E}$, $\sigma(\Delta V_{BE}) = k_AV_T/\sqrt{A_E}$, $k_A\approx2$ %·µm |
| Area mismatch to offset | $\Delta V_{BE} = V_T\ln(A_{E2}/A_{E1})$ |
| Degeneration | error × $V_T/(V_T+V_d)$; $r_{out}\approx r_o(1+g_mR_e)$ |
| Diff pair | $I_{C2}-I_{C1} = \alpha I_{EE}\tanh(V_{id}/2V_T)$ |
| Simple mirror | $I_{out} = I_{in}/(1+2/\beta)$ |

## References

- **Sedra & Smith, *Microelectronic Circuits*** (`Sedra.pdf`, no printed page numbers; PDF pages given)
  - Ch. 6 Bipolar Junction Transistors, PDF pp. 417–470: §6.1 structure, modes (Table 6.1), active-mode operation, minority-carrier profile (Fig. 6.4), $I_S$ (Eq. 6.13), large-signal models (Fig. 6.5), saturation and forced $\beta$, pnp; §6.2 symbols, $i_C$–$v_{BE}$ and −2 mV/°C (Fig. 6.17), Early effect (Fig. 6.18, Eqs. 6.18–6.22), common-emitter characteristics, $V_{CE,sat}$; §6.4 breakdown ($BV_{CBO}$, $BV_{CEO}\approx BV_{CBO}/2$, $BV_{EBO}$ 6–8 V), $\beta$ vs $I_C$ and $T$. Skipped §6.3 (DC circuit examples).
  - Ch. 7 §7.2.2 The BJT Case, PDF pp. 525–543: $g_m$, $r_\pi$, $r_e$, hybrid-π and T models (Figs. 7.25–7.28), small-signal limit 5–10 mV.
  - Ch. 10 §10.1.2 The BJT, PDF pp. 891–896: $C_{de} = \tau_Fg_m$, $C_{je}$, $C_\mu$, high-frequency hybrid-π (Fig. 10.6), $\beta(s)$, $f_T$ (Eqs. 10.19–10.22, Figs. 10.8–10.9).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF = printed + 24): Ch. 8 Bipolar Devices and Circuits, pp. 331–360: §8.1.1 operation, large-signal and saturation models, base-charge storage and Ex. 8.1, small-signal model (Fig. 8.8), T model, Ex. 8.2; capacitances (Eqs. 8.39–8.43); §8.1.2 intrinsic gain and Ex. 8.3, $f_T$ (Eqs. 8.46–8.54), Kirk effect (Fig. 8.11); §8.2 model summary; §8.3 SPICE (Table 8.1), HiCuM; §8.4.1–8.4.2 bipolar and SiGe BiCMOS processing; §8.4.3 mismatch (Eqs. 8.55–8.56); §8.5 mirrors, emitter follower, differential pair (summarized only where they differ from MOS); §8.6 appendix ($I_C$, $\beta$, $\tau_b$ derivations). Skipped: §8.5.3 high-frequency diff-pair analysis (belongs to [[Frequency Response]]).
- **Neamen, *Semiconductor Physics and Devices*** (PDF = printed + 20): Ch. 10 The Bipolar Transistor, §10.3 current gain factors ($\gamma$, $\alpha_T$, $\delta$) and Ex. 10.4, p. 395; §10.4.1 base-width modulation, Exs. 10.5–10.6, pp. 397–400; §10.4.2 high injection, pp. 401–402; §10.4.3 emitter bandgap narrowing, pp. 403–405; §10.4.4 current crowding, pp. 405–406; §10.4.5 nonuniform base doping, p. 406; §10.4.6 breakdown (punch-through, $BV_{CEO}$), pp. 408–412; §10.6 time-delay factors, cutoff frequency, Ex. 10.12, pp. 422–426. Skipped: Ebers–Moll derivation §10.5.2, switching §10.7.
- **Hastings, *The Art of Analog Layout*, 3rd ed.** (printed = PDF − 1): Ch. 9 Bipolar Transistors, pp. 430–483: §9.1 operation, −2 mV/°C and 8 %/°C, $\beta$ variation (Fig. 9.2), $\beta V_A$ product, breakdown and snapback (Fig. 9.4), saturation, substrate injection, current hogging, quasi-saturation, Kirk effect; §9.2.1 standard-bipolar vertical npn and its layout (Figs. 9.11–9.16); §9.2.2 substrate pnp; §9.1.4/§9.2.3 lateral pnp (Fig. 9.10); §9.3.1–9.3.3 CMOS substrate pnp (Fig. 9.29), short-emitter effect, retrograde-well lateral pnp (Fig. 9.30), shallow-well npn. Ch. 10 §10.2 Matching Bipolar Transistors and §10.3 Rules, pp. 505–529: Eqs. 10.5–10.21, $k_A$, emitter degeneration, thermal gradients, cross-coupled quads, ratioed pairs and quads (Figs. 10.23–10.26), piezojunction effect and package shift, die placement (Figs. 10.28–10.29), NBL shadow, matching grades and the 18 vertical + lateral rules. Skipped: §9.2.4–9.2.5 high-voltage and super-beta, §9.3.5 fast-bipolar construction details, §10.1 power transistors.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §12.3.1 Negative-TC voltage, Eqs. 12.8–12.13, pp. 511–512 ($V_{BE}$ TC derivation).
- **Jespers & Murmann**: Fig. 2.8 EKV $g_m/I_D$ curve, used only for the BJT-vs-MOS comparison plot.
