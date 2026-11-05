---
title: Diodes
description: The pn junction from ideal switch to exponential law to junction physics (built-in potential, depletion, C_j(V)), breakdown, Schottky barriers, and the diodes a CMOS process actually gives you, with their layout.
kind: topic
status: growing
aliases:
  - Diodes
  - Diode
  - pn Junction
  - PN Junctions
---

This note treats the diode as a black box first, and each section after that opens it one level further: ideal switch, constant drop, exponential law, small-signal model, junction physics, breakdown, Schottky barriers, and finally the diodes a CMOS process actually gives you and how to lay them out. The pn junction is also the part of every [[MosFETs|MOSFET]] and [[BJTs|BJT]] that the other device notes borrow (junction capacitance, body diodes, $V_{BE}$), so this note owns the junction itself.

## The big picture

```tikz title="The pn diode on one screen: exponential in forward bias, a tiny leakage in reverse, and a steep breakdown at -V_BR. The scales are distorted (forward in mA, reverse in nA) to show all three regions. After Sedra Figs. 4.7-4.8 and Hastings Fig. 1.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-6.4,0) -- (3.6,0) node[right] {$V_D$};
  \draw[->] (0,-3.0) -- (0,4.2) node[above] {$I_D$};
  \draw[very thick,domain=-4.6:2.05,samples=80] plot (\x,{0.0035*(exp(3.5*\x)-1)});
  \draw[very thick] (-4.6,-0.0) -- (-4.6,-0.02);
  \draw[very thick] (-4.6,-0.02) .. controls (-4.75,-0.1) and (-4.8,-0.8) .. (-4.85,-2.8);
  \draw[dashed] (1.75,0) -- (1.75,1.6);
  \node[below,font=\scriptsize] at (1.75,0) {$\approx 0.7$ V};
  \node[anchor=north west,font=\scriptsize] at (-4.55,-0.05) {$-V_{BR}$};
  \node[font=\scriptsize,align=center] at (3.3,2.6) {forward\\ $I_S e^{V_D/nV_T}$\\ 60 mV/dec};
  \node[font=\scriptsize,align=center] at (-2.3,0.75) {reverse: $\approx -I_S$ plus\\ generation leakage (nA)};
  \node[font=\scriptsize,align=center] at (-3.6,-2.0) {breakdown\\ (Zener / avalanche)};
  \draw (-5.6,3.4) to[D, l=$I_D$] (-3.6,3.4);
  \node[font=\scriptsize,anchor=east] at (-5.65,3.4) {anode ($p$)};
  \node[font=\scriptsize,anchor=west] at (-3.55,3.4) {cathode ($n$)};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Exponential law:** $I_D = I_S\left(e^{V_D/nV_T}-1\right)$. $V_D$ moves 60 mV per decade of current ($n=1$), so a conducting silicon diode sits at about 0.6–0.8 V almost regardless of current.
> 2. **Small signal:** $r_d = nV_T/I_D$ (26 Ω at 1 mA), in parallel with $C_j + C_d$, $C_d = \tau_T I_D/V_T$.
> 3. **Junction capacitance:** $C_j = C_{j0}/(1+V_R/\Phi_0)^{m}$, $m = 1/2$ abrupt, $1/3$ graded. It is set by the **lightly doped** side, and shrinks with reverse bias. Every MOSFET drain, every well, and every varactor uses this formula.
> 4. **Temperature:** at constant current $V_D$ falls about 2 mV/°C (CTAT). Reverse leakage roughly doubles every 8–10 °C.
> 5. **Breakdown:** below about 5 V it is Zener tunnelling (soft knee, negative TC), above about 6 V avalanche (sharp knee, positive TC); around 5–6 V the TCs cancel.
> 6. **Schottky:** a metal–semiconductor barrier with no minority-carrier storage: about 0.3–0.4 V lower forward drop, no diffusion capacitance, fast turn-off, more leakage.

**Map:** [[#Level 0 Ideal and Constant-Drop Diodes|ideal / 0.7 V]] → [[#Level 1 The Exponential Model|exponential law, $r_d$, temperature]] → [[#Level 2 Junction Physics|$\Phi_0$, depletion, $C_j(V)$, varactors, $C_d$]] → [[#Level 3 Reverse Breakdown|Zener and avalanche]] → [[#Level 4 Schottky Diodes|Schottky]] → [[#Diodes in a CMOS Process|what CMOS gives you, layout, matching]].

## Level 0: Ideal and Constant-Drop Diodes

```tikz title="The two piecewise-linear diode models. Left: the ideal diode is a short when forward biased and an open when reverse biased. Right: the constant-voltage-drop model adds a 0.7 V battery in the forward direction. After Sedra Figs. 4.1 and 4.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-2,0) -- (2.4,0) node[right] {$v$};
  \draw[->] (0,-0.4) -- (0,3) node[above] {$i$};
  \draw[very thick] (-2,0) -- (0,0) -- (0,2.7);
  \node[font=\scriptsize] at (-1.0,0.3) {off: open};
  \node[font=\scriptsize,anchor=west] at (0.1,2.2) {on: short};
  \node[font=\scriptsize] at (0.2,-0.8) {ideal diode};
  \begin{scope}[xshift=6.2cm]
    \draw[->] (-2,0) -- (2.4,0) node[right] {$v$};
    \draw[->] (0,-0.4) -- (0,3) node[above] {$i$};
    \draw[very thick] (-2,0) -- (0.9,0) -- (0.9,2.7);
    \draw[dashed,domain=0:1.05,samples=40] plot (\x,{0.02*(exp(4.4*\x)-1)});
    \node[below,font=\scriptsize] at (0.9,0) {0.7 V};
    \node[font=\scriptsize] at (0.2,-0.8) {constant-voltage drop};
    \draw (3.0,2.6) to[D] (3.0,1.3) to[battery1,l=$0.7$ V] (3.0,0.2);
    \node[font=\scriptsize] at (3.0,2.95) {when on};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Ideal diode:** forward → short, reverse → open. The external circuit must limit the forward current and the reverse voltage. Analysis: guess each diode's state, solve, check the guess (forward current > 0, reverse voltage < 0).
- **Constant-voltage drop (CVD):** a conducting diode is a 0.7 V battery; below 0.7 V it carries nothing. This is the model for first-pass hand analysis (Sedra §4.3.5).

> [!tip] Remark
> This is the diode's equivalent of the [[MosFETs#Level 0 The Switch Model|MOSFET switch model]]: correct about *which way* current flows, silent about *how much* voltage it costs. The next level answers that.

> [!note]- Detail: rectifiers and peak detectors (Sedra §4.6, short version)
> - **Half-wave rectifier** (diode in series with a load): $v_O = v_S - V_D$ when $v_S > V_D$, else 0. Peak inverse voltage (PIV) across the diode $= V_s$; pick a diode rated about 50 % above the PIV. Useless for inputs of order 100 mV (use a precision rectifier: diode inside an op-amp loop).
> - **Full-wave (bridge) rectifier:** both half-cycles conduct through two diodes, so the output loses $2V_D$.
> - **Peak rectifier** (a capacitor $C$ across the load $R$, $CR \gg T$): the diode conducts only for a short interval near each peak and the capacitor holds $V_p$ in between. Ripple $V_r \approx V_p/(fCR)$ for half-wave and $V_p/(2fCR)$ for full-wave; conduction angle $\omega\Delta t \approx \sqrt{2V_r/V_p}$. The diode's peak current is many times the load current because all the charge goes in during $\Delta t$.
>
> On a chip the same peak-detector idea appears in amplitude detectors and envelope detectors, usually with a transistor in place of the diode.

## Level 1: The Exponential Model

### Current–Voltage Law and Ideality

$$
\boxed{I_D = I_S\left(e^{V_D/nV_T}-1\right),\qquad V_D = nV_T\ln\frac{I_D}{I_S},\qquad V_T = \frac{kT}{q}\approx 26\ \mathrm{mV}}
$$

$$
\boxed{\Delta V_D = 2.3\,nV_T \approx 60\ \mathrm{mV\ per\ decade\ of\ } I_D\ (n=1)}
$$

```tikz title="log I versus V. At low current recombination in the depletion region dominates (slope 1/2V_T, n = 2); at moderate current diffusion dominates (slope 1/V_T, n = 1); at high current the series resistance of the neutral regions bends the curve over. After Neamen Fig. 8.21 and Hastings Sec. 1.2.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right] {$V_D$};
  \draw[->] (0,0) -- (0,5.2) node[above] {$\ln I_D$};
  \draw[dashed] (0,1.4) -- (6.0,4.4);
  \draw[dashed] (0,0.2) -- (5.2,5.0);
  \draw[very thick] plot[smooth] coordinates {(0,1.45) (1,1.95) (1.6,2.3) (2.2,2.75) (3,3.45) (3.8,4.15) (4.6,4.6) (5.6,4.9) (7.2,5.1)};
  \node[font=\scriptsize,anchor=west] at (0.1,4.75) {recombination: slope $\frac{1}{2V_T}$ ($n=2$)};
  \draw[->] (1.0,4.5) -- (1.0,2.0);
  \node[font=\scriptsize,anchor=west] at (3.3,1.0) {diffusion: slope $\frac{1}{V_T}$ ($n=1$)};
  \draw[->] (3.5,1.25) -- (2.65,2.55);
  \node[font=\scriptsize,anchor=west] at (7.3,5.1) {series $R$ / high injection};
  \node[left,font=\scriptsize] at (0,1.4) {$\ln I_{R0}$};
  \node[left,font=\scriptsize] at (0,0.2) {$\ln I_S$};
\end{circuitikz}
\end{document}
```

- **$I_S$ (saturation or scale current)** is proportional to junction **area** and to $1/N_A + 1/N_D$: the *lightly* doped side supplies it. A small-signal discrete diode has $I_S\sim10^{-15}$–$10^{-14}$ A (Sedra).
- **"0.7 V" is not a threshold.** It is the exponential seen on a linear axis: a 1 mA device reads 0.7 V at 1 mA, a 1 A device reads 0.7 V at 1 A (Sedra). IC junctions at µA levels typically sit at **0.6–0.65 V** (Hastings); a base-emitter junction gives about 0.65 V at 1 µA/µm² and 25 °C, and doubling the current adds only 18 mV.
- **Ideality factor $n$:** 1 when diffusion dominates (moderate current), up to 2 at low current where depletion-region recombination dominates, and again above 1 at high current (series resistance, high injection). Some Schottky diodes also exceed 1.
- **Series resistance** of the neutral regions and contacts adds a linear term once the drop across it is tens of mV (Carusone: 50–100 mV of bulk drop is typical at moderate current; contacts 20–40 Ω).

> [!tip] Remark
> This is the same exponential as the BJT's $I_C = I_Se^{V_{BE}/V_T}$ ([[BJTs#Collector Current]]) and the MOSFET's [[MosFETs#Subthreshold Conduction|subthreshold law]]: all three are carriers *diffusing* over a barrier that the terminal voltage lowers. The 60 mV/dec is the same number as the ideal subthreshold swing.

> [!note]- Derivation: the diode law from the law of the junction (Neamen §8.1, Carusone §1.1.5)
> 1. **Equilibrium.** Holes diffuse from p to n and electrons from n to p; the uncovered dopant ions build a field whose drift current exactly cancels the diffusion current. That field's integral is $\Phi_0$ ([[#Built-in Potential]]).
> 2. **Forward bias $V_a$** lowers the barrier to $\Phi_0 - V_a$. Boltzmann statistics then raise the minority densities at the depletion edges by $e^{V_a/V_T}$ (the *law of the junction*):
> $$p_n(x_n) = p_{n0}\,e^{V_a/V_T},\qquad n_p(-x_p) = n_{p0}\,e^{V_a/V_T},\qquad p_{n0} = n_i^2/N_D$$
> 3. **Diffusion.** The excess minority carriers diffuse away and recombine within a diffusion length $L_p = \sqrt{D_p\tau_{p0}}$. The current is the diffusion current at each edge:
> $$J = \underbrace{\left(\frac{qD_pp_{n0}}{L_p} + \frac{qD_nn_{p0}}{L_n}\right)}_{J_s}\left(e^{V_a/V_T}-1\right)$$
> $J_s \propto n_i^2$, so it is a very steep function of temperature, and $p_{n0} = n_i^2/N_D$ is why the lightly doped side dominates.
> 4. **Recombination current.** In the depletion region itself, at its centre $n = p = n_ie^{V_a/2V_T}$, so recombination there gives $J_{rec} = \frac{qWn_i}{2\tau_0}e^{V_a/2V_T}$: an exponential with **half** the slope. It wins at low current because its prefactor is larger; diffusion wins at higher current (Neamen Eqs. 8.94–8.98). Fitting both with one exponential gives $1 \le n \le 2$.
> 5. **Short diode.** If a neutral region is shorter than $L_p$ (most IC junctions), replace $L_p$ by the region width $W_n$: same exponential, larger $I_S$ (Neamen §8.1.8).
>
> Neamen Ex. 8.4: at $V_a = 0.65$ V the total current density is 3.29 A/cm², which needs only a 1.5 V/cm field to carry as majority drift in the neutral n region: the zero-field assumption in the neutral regions is excellent.

### Small-Signal Model

```tikz title="Small-signal model of a forward-biased diode: incremental resistance r_d in parallel with the depletion capacitance C_j and the diffusion capacitance C_d, plus the series resistance r_s of the neutral regions and contacts. After Carusone Fig. 1.4 and Neamen Fig. 8.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,3.2) node[ocirc]{} node[above] {anode} -- (0,2.6) to[R,l=$r_s$] (0,1.4) -- (0,1.2);
  \draw (-2.4,1.2) -- (2.4,1.2);
  \draw (-2.4,1.2) to[R,l_={$r_d=nV_T/I_D$}] (-2.4,-1.2);
  \draw (0,1.2) to[C,l_=$C_j$] (0,-1.2);
  \draw (2.4,1.2) to[C,l={$C_d=\tau_TI_D/V_T$}] (2.4,-1.2);
  \draw (-2.4,-1.2) -- (2.4,-1.2);
  \draw (0,-1.2) -- (0,-1.8) node[ocirc]{} node[below] {cathode};
\end{circuitikz}
\end{document}
```

$$
\boxed{r_d = \left(\frac{\partial I_D}{\partial V_D}\right)^{-1} = \frac{nV_T}{I_D}},\qquad \boxed{C_d = \frac{\tau_T I_D}{V_T} = \frac{\tau_T}{r_d}}\qquad (n=1)
$$

- Valid while the signal across the junction stays well below $2V_T$: in practice $|v_d| \lesssim 5$ mV (Sedra Eq. 4.14).
- At 1 mA: $r_d = 26$ Ω. With $\tau_T = 100$ ps, $C_d = 3.8$ pF, over 100× the depletion capacitance of a 10 µm × 10 µm junction (Carusone Ex. 1.7).
- Since $C_d\gg C_j$ at moderate current, $r_dC_T \approx \tau_T$: a forward diode driven from a high impedance responds with time constant $\approx \tau_T$, **independent of current**. At low current $C_j$ matters and it gets slower.
- **Diode regulator:** a forward diode fed through a resistor $R$ from a noisy supply attenuates supply ripple by $r_d/(R+r_d)$. Sedra Ex. 4.5: 10 V ± 1 V through 10 kΩ gives only about ±2.7 mV of ripple across the diode. Stack $k$ diodes for $\approx 0.7k$ V; the TC and current sensitivity stack too.

> [!tip] Remark
> $1/r_d = I_D/V_T$ is exactly a BJT's $g_m = I_C/V_T$ ([[BJTs#Transconductance]]): a **diode-connected** BJT *is* a diode whose incremental resistance is $1/g_m$. A diode-connected MOSFET is a $1/g_m$ too, but with the square-law $g_m$ ([[#Diode-Connected Devices]]).

### Temperature Behaviour

```tikz title="The forward characteristic shifts left as temperature rises: at constant current V_D falls about 2 mV/degC. After Sedra Fig. 4.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right] {$V_D$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$I_D$};
  \draw[very thick,domain=0:4.25,samples=60] plot (\x,{0.004*(exp(1.65*\x)-1)});
  \draw[very thick,domain=0:3.75,samples=60] plot (\x,{0.0088*(exp(1.65*\x)-1)});
  \draw[dashed] (0,2.0) -- (5.6,2.0);
  \draw[->] (3.77,2.0) -- (3.3,2.0);
  \node[font=\scriptsize,anchor=west] at (4.0,2.35) {$\approx-2$ mV/°C at fixed $I_D$};
  \node[font=\scriptsize] at (2.8,3.9) {$T_2>T_1$};
  \node[font=\scriptsize] at (4.6,3.9) {$T_1$};
  \node[left,font=\scriptsize] at (0,2.0) {$I_D$ held};
\end{circuitikz}
\end{document}
```

$$
\boxed{\left.\frac{dV_D}{dT}\right|_{I_D} \approx -2\ \mathrm{mV/^\circ C}\ \ (\text{pn}),\qquad \approx -1\ \mathrm{mV/^\circ C}\ \ (\text{Schottky})}
$$

- $I_S\propto n_i^2$ grows so fast with $T$ (roughly doubling every 5 °C, Sedra; ×4 per 10 °C, Neamen) that it beats the growth of $V_T$: the TC of $V_D$ is negative.
- Hastings' numbers: a diode at 0.65 V at 25 °C reads 0.78 V at −40 °C and 0.45 V at 125 °C. Neamen Ex. 8.5: holding the current constant from 300 K to 310 K drops $V_a$ from 0.600 V to 0.5827 V (−17.3 mV).
- **Reverse leakage** is thermal generation in the depletion region, a *different* mechanism from $I_S$, and doubles about every 8 °C (Hastings) to 10 °C (Sedra). That is why ICs are rated to 125–150 °C junction temperature.
- The predictability of $dV_D/dT$ makes a forward junction a temperature sensor and the CTAT half of a bandgap.
- **Contact potentials** (metal–silicon interfaces) also shift with temperature, 0.1–1.0 mV/°C each (Seebeck effect). They cancel only if every contact sits at the same temperature; a self-heated circuit sees a few mV of thermoelectric offset (Hastings §1.2.5).

> [!tip] Remark
> The derivation of $dV_{BE}/dT$, its $V_{G0}$ extrapolation, and the PTAT $\Delta V_{BE} = V_T\ln n$ live in [[BJTs#V_BE vs Temperature]] and [[BJTs#Delta V_BE Is PTAT]]. A diode is the same junction, so the same results apply with $V_D$ for $V_{BE}$.

## Level 2: Junction Physics

### Built-in Potential

```tikz title="An abrupt p+n junction at equilibrium. The depletion region (no free carriers) holds uncovered acceptors on the p side and donors on the n side; equal charges mean it reaches much further into the lightly doped n side. The field is triangular, peaking at the metallurgical junction, and its integral is the built-in potential. After Carusone Fig. 1.2 and Neamen Figs. 7.3-7.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[magenta!25] (0,4.2) rectangle (3,5.6);
  \fill[yellow!25] (3.6,4.2) rectangle (10,5.6);
  \fill[white] (2.7,4.2) rectangle (6.2,5.6);
  \draw (0,4.2) rectangle (10,5.6);
  \draw[dashed] (2.7,4.2) -- (2.7,5.6); \draw[dashed] (6.2,4.2) -- (6.2,5.6);
  \draw[thick] (3,4.2) -- (3,5.6);
  \node at (1.3,4.9) {$p^+$ ($N_A$)};
  \node at (8.2,4.9) {$n$ ($N_D\ll N_A$)};
  \foreach \y in {4.45,4.9,5.35} { \node[font=\scriptsize] at (2.85,\y) {$-$}; }
  \foreach \x in {3.4,4.1,4.8,5.5} { \foreach \y in {4.6,5.2} { \node[font=\scriptsize] at (\x,\y) {$+$}; } }
  \node[font=\scriptsize,above] at (2.6,5.6) {$x_p$};
  \node[font=\scriptsize,above] at (4.6,5.6) {$x_n$};
  \draw[<->] (2.7,5.95) -- (6.2,5.95); \node[font=\scriptsize,above] at (4.45,6.0) {$W = x_n + x_p$};
  \draw[->] (0,1.6) -- (10.2,1.6) node[right] {$x$};
  \node[font=\scriptsize,anchor=east] at (0,1.6) {$\rho$};
  \draw[thick] (0.3,1.6) -- (2.7,1.6) -- (2.7,0.4) -- (3,0.4) -- (3,2.0) -- (6.2,2.0) -- (6.2,1.6) -- (9.8,1.6);
  \node[font=\scriptsize,anchor=west] at (3.1,2.25) {$+qN_D$};
  \node[font=\scriptsize,anchor=east] at (2.65,0.55) {$-qN_A$};
  \draw[->] (0,-1.6) -- (10.2,-1.6) node[right] {$x$};
  \node[font=\scriptsize,anchor=east] at (0,-1.6) {$-E$};
  \draw[thick] (0.3,-1.6) -- (2.7,-1.6) -- (3,-0.4) -- (6.2,-1.6) -- (9.8,-1.6);
  \node[font=\scriptsize,anchor=west] at (3.1,-0.35) {$|E_{max}| = qN_Dx_n/\varepsilon_{si}$};
  \node[font=\scriptsize,anchor=west] at (6.5,-1.1) {area under $E$ $=\Phi_0+V_R$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Phi_0 = V_T\ln\frac{N_AN_D}{n_i^2}}\qquad (\approx 0.9\ \text{V one side heavily doped};\ \approx 0.7\ \text{V moderately doped})
$$

- Carusone Ex. 1.2: $N_A = 10^{25}$, $N_D = 10^{22}\ \mathrm{m^{-3}}$, $n_i = 1.1\times10^{16}\ \mathrm{m^{-3}}$ gives $\Phi_0 = 0.89$ V. Use **0.9 V** for one-sided junctions (Carusone), about **0.7 V** for moderately doped ones (Hastings).
- It is logarithmic in doping, so it barely moves with process; it falls with temperature (through $n_i$).
- **You cannot measure it with a voltmeter:** the two metal–silicon contact potentials cancel it exactly at uniform temperature, which is why a zero-biased diode carries zero current (Hastings Fig. 1.12).

> [!note]- Detail: why a field must form (Hastings §1.2, Neamen §7.2)
> The instant p and n silicon touch, holes diffuse into the n side and electrons into the p side, and both recombine. That leaves fixed acceptor ions (negative) on the p side and donor ions (positive) on the n side, which set up a field from n to p. The field drives drift currents opposite to the diffusion currents, and grows until, for holes and electrons separately, drift exactly cancels diffusion. A few fast carriers keep crossing (excess minority carriers), but at any instant almost none are in transit: the region is **depleted**. In energy-band language: the Fermi level must be flat at equilibrium, so the bands bend by $q\Phi_0$, the difference between the two sides' Fermi levels, $\Phi_0 = \phi_{Fn}+|\phi_{Fp}| = V_T\ln(N_D/n_i)+V_T\ln(N_A/n_i)$.

### Depletion Width

$$
\boxed{x_n = \sqrt{\frac{2\varepsilon_{si}(\Phi_0+V_R)}{q}\cdot\frac{N_A}{N_D(N_A+N_D)}},\qquad x_p = \sqrt{\frac{2\varepsilon_{si}(\Phi_0+V_R)}{q}\cdot\frac{N_D}{N_A(N_A+N_D)}}}
$$

$$
\boxed{\text{One-sided } (N_A\gg N_D):\quad W\approx x_n\approx\sqrt{\frac{2\varepsilon_{si}(\Phi_0+V_R)}{qN_D}},\qquad \frac{x_n}{x_p} = \frac{N_A}{N_D}}
$$

- **Charge neutrality** ($N_Ax_p = N_Dx_n$) pushes the depletion region into the **lightly doped side**. Almost every IC junction is one-sided: heavy $n^+$/$p^+$ diffusion into a light substrate or well.
- Width grows as $\sqrt{\Phi_0+V_R}$: doubling the reverse bias widens it by only $\sqrt2$.
- Carusone Ex. 1.3: $N_A = 10^{25}$, $N_D = 10^{22}\ \mathrm{m^{-3}}$, $V_R = 1$ V gives $x_n = 0.50$ µm, $x_p = 0.50$ nm (1000× less).
- The peak field $E_{max} = qN_Dx_n/\varepsilon_{si}$ sets [[#Level 3 Reverse Breakdown|breakdown]].

> [!tip] Remark
> Depletion width is what makes [[MosFETs#Threshold Voltage|$Q_{dep}$]] grow with $V_{SB}$ (body effect), what lets a drain depletion region reach the source (punchthrough), and what [[MosFETs#Channel-Length Modulation|CLM]] modulates: all of them are this equation applied to a MOSFET's junctions.

### Junction Capacitance C_j(V)

```tikz title="Small-signal junction capacitance versus junction voltage, normalised to C_j0, for an abrupt (m = 1/2) and a linearly graded (m = 1/3) junction, with Phi_0 = 0.9 V. Reverse bias (right) shrinks it; toward forward bias the formula blows up near V = Phi_0 and C_j is roughly 2 C_j0 in practice. After Carusone Sec. 1.1.2-1.1.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-2.6,0) -- (8.4,0) node[right] {$V_R$ (V)};
  \draw[->] (0,0) -- (0,4.6) node[above] {$C_j/C_{j0}$};
  \foreach \v in {1,2,3,4,5} { \draw ({1.5*\v},0.08) -- ({1.5*\v},-0.08) node[below,font=\scriptsize] {\v}; }
  \draw (-1.5,0.08) -- (-1.5,-0.08) node[below,font=\scriptsize] {$-1$};
  \foreach \y in {0.5,1,1.5,2} { \draw (0.08,{2*\y}) -- (-0.08,{2*\y}) node[left,font=\scriptsize] {\y}; }
  \draw[very thick,domain=-0.75:5.2,samples=60] plot ({1.5*\x},{2/sqrt(1+\x/0.9)});
  \draw[very thick,dashed,domain=-0.8:5.2,samples=60] plot ({1.5*\x},{2/pow(1+\x/0.9,1/3)});
  \node[font=\scriptsize,anchor=west] at (6.0,0.45) {$m=\tfrac12$ abrupt};
  \node[font=\scriptsize,anchor=west] at (6.2,1.75) {$m=\tfrac13$ graded};
  \node[font=\scriptsize,align=center,anchor=east] at (-1.25,3.0) {forward bias:\\ formula fails\\ near $-\Phi_0$};
  \node[font=\scriptsize,anchor=west] at (1.6,3.6) {reverse bias: $C_j$ falls as $(1+V_R/\Phi_0)^{-m}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{C_j = \frac{dQ}{dV_R} = \frac{C_{j0}}{\left(1+V_R/\Phi_0\right)^{m}},\qquad m = \tfrac12\ \text{(abrupt)},\ \tfrac13\ \text{(linearly graded)}}
$$

$$
\boxed{C_{j0} = \sqrt{\frac{q\varepsilon_{si}}{2\Phi_0}\cdot\frac{N_AN_D}{N_A+N_D}}\ \xrightarrow{N_A\gg N_D}\ \sqrt{\frac{q\varepsilon_{si}N_D}{2\Phi_0}}\quad\text{(per unit area)}}
$$

$$
\boxed{C_{total} = A\,C_j + P\,C_{jsw}\qquad\text{(area plus sidewall perimeter)}}
$$

- It is a **parallel-plate capacitor** whose plate spacing is the depletion width: $C_j = \varepsilon_{si}/W$. More reverse bias, wider gap, less capacitance.
- **One-sided junctions depend only on the light side**, as $\sqrt{N_{light}}$: lightly doped substrates and wells give smaller parasitics (Carusone).
- **Real IC junctions** have $m$ between 1/3 and 1/2 (the MOSFET model cards use about 0.3–0.45 for the bottom, 0.2–0.3 for the sidewall: [[MosFETs#Capacitances]]).
- Carusone Exs. 1.4–1.5, 10 µm × 10 µm, $N_D = 10^{22}\ \mathrm{m^{-3}}$: abrupt $C_{j0} = 30.5$ fF falling to 14.7 fF at 3 V; graded ($m = 0.4$) 8.1 fF falling to 4.5 fF. Graded junctions are smaller *and* more linear.
- **Forward bias:** the formula diverges as $V\to\Phi_0$; use $C_j\approx 2C_{j0}$ and note that $C_d$ dominates anyway (Carusone §1.1.6).
- Process tolerance on $C_{j0}$ is rarely better than 20 % (Carusone), so hand estimates need no more precision than that.

> [!tip] Remark
> This is the $C_{SB}$, $C_{DB}$ of every MOSFET ([[MosFETs#Capacitances]]), the $C_\mu$, $C_{je}$, $C_{cs}$ of every BJT ([[BJTs#Charge Storage]]), and the bottom-plate parasitic of every well-based capacitor. How junctions are *used* as fixed capacitors (comb vs plate layouts, measured $c_a$, $c_p$, TC) is in [[Capacitor#Junction Capacitors]].

> [!note]- Derivation: $C_j$ from the stored charge (Carusone Eqs. 1.15–1.29)
> Charge per unit area on the n side is the depletion width times the ion density:
> $$Q = qN_Dx_n = \sqrt{2q\varepsilon_{si}(\Phi_0+V_R)\frac{N_AN_D}{N_A+N_D}} = 2C_{j0}\Phi_0\sqrt{1+\frac{V_R}{\Phi_0}}$$
> $Q\propto(\Phi_0+V_R)^{1/2}$ is nonlinear, so only the incremental capacitance is meaningful: differentiate to get $C_j = C_{j0}/\sqrt{1+V_R/\Phi_0}$.
>
> For a graded junction $Q\propto(\Phi_0+V_R)^{1-m}$ with $m = 1/3$ for a linear grade, giving the general form. Neamen's linearly graded result (§7.4.1) is $C' = \left[\frac{qa\varepsilon_{si}^2}{12(V_{bi}+V_R)}\right]^{1/3}$ with $a$ the doping gradient.
>
> **Reading doping off a C–V plot.** For a one-sided junction, $\left(\frac{1}{C'}\right)^2 = \frac{2(\Phi_0+V_R)}{q\varepsilon_{si}N_D}$ is a straight line in $V_R$: its intercept on the $V_R$ axis is $-\Phi_0$ and its slope gives $N_D$ (Neamen §7.3.3, Eq. 9.9). This is how process engineers extract both.

> [!note]- Detail: large-signal (average) junction capacitance (Carusone §1.1.4, Ex. 1.6)
> For a step from $V_1$ to $V_2$, use charge, not the small-signal $C_j$ (which blows up near forward bias):
> $$C_{j,av} = \frac{Q(V_2)-Q(V_1)}{V_2-V_1} = 2C_{j0}\Phi_0\,\frac{\sqrt{1+V_2/\Phi_0}-\sqrt{1+V_1/\Phi_0}}{V_2-V_1}$$
> From 0 to 1 V with $\Phi_0 = 0.9$ V: $C_{j,av} = 0.815\,C_{j0}\approx 0.8\,C_{j0}$. Example: 20 µm × 5 µm at 0.2 fF/µm² ($C_{j0} = 20$ fF) charged through 10 kΩ: $\tau = 0.16$ ns, 0 → 0.7 V in $1.2\tau = 0.20$ ns. SPICE gave 0.21 ns rise and 0.19 ns fall; rise and fall differ because $C_j$ is larger at low reverse bias.

### Varactors: C_j(V) as a Tuning Element

```tikz title="A reverse-biased junction as a voltage-controlled capacitor across an LC tank (left), and normalised C versus V_R for three grading exponents (right). Hyperabrupt doping (exponent 2) makes C proportional to 1/V^2, so the LC resonance becomes linear in V. After Neamen Sec. 7.4.2 and Sedra Sec. 4.7.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[L,l=$L$] (0,2.6) -- (2,2.6) to[C,l=$C_c$] (2,1.4);
  \draw (2,0) to[D] (2,1.4);
  \draw (0,0) -- (2,0);
  \draw (2,1.4) -- (3.4,1.4) to[R,l_=$R_{big}$] (3.4,3.2) node[above] {$V_{tune}>0$};
  \draw (2,0) -- (2,-0.3) node[ground]{};
  \node[font=\scriptsize,anchor=east] at (1.75,0.7) {$C_j(V_R)$};
  \node[font=\scriptsize,align=center] at (1.0,-1.3) {$\omega_0 = 1/\sqrt{LC_j(V_R)}$};
  \begin{scope}[xshift=6.2cm,yshift=-0.8cm]
    \draw[->] (0,0) -- (5.4,0) node[right] {$V_R$};
    \draw[->] (0,0) -- (0,4.4) node[above] {$C/C_{j0}$};
    \draw[very thick,domain=0:5,samples=50] plot (\x,{4/pow(1+\x/0.9,1/3)});
    \draw[very thick,dashed,domain=0:5,samples=50] plot (\x,{4/pow(1+\x/0.9,1/2)});
    \draw[very thick,dotted,domain=0:5,samples=50] plot (\x,{4/pow(1+\x/0.9,2)});
    \node[font=\scriptsize,anchor=west] at (5.05,2.14) {$m=\tfrac13$};
    \node[font=\scriptsize,anchor=west] at (5.05,1.56) {$m=\tfrac12$};
    \node[font=\scriptsize,anchor=west] at (2.0,0.55) {$m=2$ (hyperabrupt)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{1}{C_j}\frac{\partial C_j}{\partial V_R} = -\frac{m}{\Phi_0+V_R}},\qquad \boxed{\frac{C_{max}}{C_{min}} = \left(\frac{1+V_{R,max}/\Phi_0}{1+V_{R,min}/\Phi_0}\right)^{m}}
$$

This is the model [[Oscillators]] links to. The fractional sensitivity is largest at small reverse bias and falls as $1/(\Phi_0+V_R)$; the tuning range is set by the exponent $m$ and the usable reverse-bias span.

- **Doping profile sets $m$.** For one-sided doping $N(x)\propto x^{m'}$, $C\propto(\Phi_0+V_R)^{-1/(m'+2)}$ (Neamen Eq. 7.62): $m' = 0$ gives 1/2, $m' = 1$ gives 1/3. A **hyperabrupt** profile ($m' <0$, doping *decreasing* away from the junction) raises the exponent; $m' = -3/2$ gives $C\propto V_R^{-2}$ and therefore $\omega_0\propto V_R$, linear tuning (Neamen Eqs. 7.64–7.66). Sedra quotes discrete varactors with exponents of 3 to 4.
- **In CMOS** a varactor is a $p^+$/n-well junction or, more often, an accumulation-mode MOS capacitor. The junction version suffers n-well series resistance (low Q) and a fixed well-to-substrate capacitance that limits range; the accumulation MOS gives a monotonic and steeper $C(V)$ ([[Capacitor#MOS Varactors and Junction Varactors]]).
- A junction varactor must stay reverse-biased across the whole swing; near zero bias it starts to conduct and its $C$ explodes.

> [!tip] Remark
> Any *unintended* junction across a tank is also a varactor. In a cross-coupled LC VCO, each drain–bulk junction is reverse-biased by $V_{DD}$ itself, so the supply tunes the frequency with gain $m\,\omega_0/[2(\Phi_0+V_{DD})]$: this sensitivity times $\partial\omega/\partial C = -\omega/2C$ (Razavi §15.4). Owned by [[Oscillators]], along with $K_{VCO}$ and tuning range.

### Diffusion Capacitance and Reverse Recovery

```tikz title="Switching a pn diode from forward to reverse. During the storage time t_s the stored minority charge holds the junction forward biased and a reverse current -I_R ~ -V_R/R_R flows; then the current decays over t_2 as the depletion capacitance charges. A Schottky diode has no storage phase. After Neamen Figs. 8.26-8.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9,0) node[right] {$t$};
  \draw[->] (0,-2.2) -- (0,2.2) node[above] {$I_D$};
  \draw[very thick] (0,1.4) -- (2,1.4) -- (2,-1.5) -- (4.6,-1.5);
  \draw[very thick,domain=0:3.8,samples=40] plot ({4.6+\x},{-1.5*exp(-1.2*\x)});
  \node[font=\scriptsize,anchor=south] at (1.0,1.45) {$I_F$};
  \node[font=\scriptsize,anchor=east] at (1.9,-1.5) {$-I_R$};
  \draw[<->] (2,-1.85) -- (4.6,-1.85) node[midway,below,font=\scriptsize] {$t_s$ (storage)};
  \draw[<->] (4.6,0.3) -- (6.6,0.3) node[midway,above,font=\scriptsize] {$t_2$ (decay)};
  \node[font=\scriptsize,anchor=west] at (2.1,1.0) {switch to reverse at $t=0$};
  \draw[dashed] (2,1.4) -- (2,0) -- (8.4,0);
  \node[font=\scriptsize,anchor=west] at (5.0,-1.4) {Schottky: no $t_s$, only $C_j$ discharge};
\end{circuitikz}
\end{document}
```

- **Diffusion capacitance** $C_d = \tau_TI_D/V_T$ models the excess minority charge $Q = \tau_TI_D$ stored next to the junction: to double the current, the minority-carrier gradient, and so the stored charge, must double (Carusone §1.1.6). For a long $p^+n$ diode Neamen's derivation gives $C_d = \frac{1}{2V_T}\left(I_{p0}\tau_{p0}+I_{n0}\tau_{n0}\right)$ (Neamen §8.2.2; at 1 mA and $\tau_{p0} = 10^{-7}$ s that is 1.93 nF, 3–4 orders above typical $C_j$).
- **Reverse recovery.** A forward diode cannot turn off until its stored charge is removed: for the **storage time** $t_s$ it conducts a *reverse* current limited only by the external circuit, then the current decays as $C_j$ charges.
- More reverse drive ($I_R/I_F$ larger) shortens $t_s$. Charge-storage delay is what limits pn diodes (and saturated BJTs) as fast switches and what Schottky clamps remove.

> [!note]- Detail: the storage-time formula (Neamen §8.5.1)
> For a one-sided $p^+n$ diode switched from $I_F$ to $-I_R$:
> $$\operatorname{erf}\sqrt{\frac{t_s}{\tau_{p0}}} = \frac{I_F}{I_F+I_R}$$
> During $t_s$ the junction voltage stays near its forward value because the minority carriers at the depletion edges cannot vanish instantly; the reverse current is the flow of that stored charge back across the junction. Turn-on has the opposite transient: the forward voltage rises as the stored charge builds up.

### Leakage and Generation Current

- In reverse bias the ideal diode carries $-I_S$. Real reverse current is much larger, and comes from **thermal generation** of electron–hole pairs inside the depletion region: each pair is swept apart by the field and sends one electron round the external circuit (Hastings §1.2.2).
- It scales with **depletion volume** (area × width), so it grows slowly with $V_R$; it scales with temperature more slowly than $I_S$ (doubling per 8–10 °C versus per 5 °C). Sedra: a small-signal diode with $I_S\approx10^{-14}$–$10^{-15}$ A shows about 1 nA of reverse current. Neamen gives about $10^{-7}$ A/cm² as a typical generation current density.
- Light and radiation generate pairs too: a reverse-biased junction is a **photodiode** (photocurrent proportional to light intensity, plus the dark leakage, Sedra §4.7.4).
- Leakage matters wherever a junction holds charge on a high-impedance node: sample-and-hold capacitors, dynamic nodes, floating gates, the leakage-clamp diode-connected MOSFETs of Hastings Fig. 11.14.

## Level 3: Reverse Breakdown

### Avalanche and Zener Breakdown

```tikz title="Reverse breakdown, drawn on the reverse-voltage axis. Zener (tunnelling) diodes break down softly over a wide knee; avalanche diodes break down sharply. Both end on a series-resistance asymptote. After Hastings Fig. 11.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9,0) node[right] {$V_R$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$I_R$};
  \draw[very thick,red!70!black,domain=0:3.9,samples=60] plot (\x,{0.05*(exp(1.15*\x)-1)});
  \draw[very thick,red!70!black] (3.9,4.4) -- (3.9,4.42);
  \draw[very thick,green!50!black] (0,0.02) -- (6.6,0.06);
  \draw[very thick,green!50!black,domain=6.6:7.25,samples=40] plot (\x,{0.06+0.0004*(exp(13*(\x-6.6))-1)});
  \draw[dashed] (3.15,0) -- (3.95,4.2);
  \draw[dashed] (6.95,0) -- (7.35,4.2);
  \node[font=\scriptsize,red!70!black,align=center] at (2.2,3.0) {Zener ($<5$ V)\\ soft knee, TC $<0$};
  \node[font=\scriptsize,green!50!black,align=center] at (5.6,2.5) {avalanche ($>6$ V)\\ sharp knee, TC $>0$};
  \node[font=\scriptsize,anchor=west] at (7.5,3.8) {ohmic asymptote};
  \node[below,font=\scriptsize] at (3.15,0) {$V_Z$};
  \node[below,font=\scriptsize] at (6.95,0) {$V_{BR}$};
\end{circuitikz}
\end{document}
```

| | Zener (tunnelling) | Avalanche (impact ionization) |
|---|---|---|
| Where | Very heavy doping on both sides, light side above about $10^{18}\ \mathrm{cm^{-3}}$, depletion width below about 4 nm | Lighter doping, wider depletion region |
| Breakdown voltage | Below about 5 V | Above about 5–6 V (to hundreds of volts) |
| Knee | **Soft** (probabilistic tunnelling looks like "leakage") | **Sharp** |
| TC of $V_{BR}$ | **Negative**, −2 to −3 mV/°C | **Positive**: about +3.5 mV/°C at 7 V, approaching +0.1 %/°C above 50 V |
| Noise | Low | Microplasmas: burst / random-telegraph noise at low current |

$$
\boxed{V_B \approx \frac{\varepsilon_{si}E_{crit}^2}{2qN_B}\qquad\text{(one-sided abrupt junction, } N_B = \text{light-side doping)}}
$$

- **Lighter doping, higher breakdown:** $E_{crit}$ itself rises only slowly with doping (about 200 kV/cm at $10^{15}$ to about 2 MV/cm at $10^{18}\ \mathrm{cm^{-3}}$, Hastings §1.2.3), while the depletion region gets much wider. Neamen Ex. 8.8: $V_B = 100$ V needs $N_B\approx4\times10^{15}\ \mathrm{cm^{-3}}$ ($E_{crit}\approx3.7\times10^5$ V/cm gives 110 V).
- **Curvature lowers it.** Graded and curved (diffused) junctions break down below the planar value; corners intensify the field. Surface breakdown under thin oxide drifts with time (Zener **walkout**, up to about 250 mV upward; in BiCMOS also **walkback**, downward), so references use **buried (subsurface) Zeners**.
- **Around 5–6 V the two TCs cancel:** a 5.0–5.4 V buried Zener can be targeted for zero TC (Hastings §11.1.2), but its soft knee demands a tightly regulated current.
- **Never let a transistor junction avalanche** unless it is designed to: an avalanched BJT emitter-base junction permanently loses $\beta$ ([[BJTs#Breakdown]]).
- The name: designers call every breakdown diode a "Zener", including the 7 V ones that are really avalanche diodes.

> [!note]- Derivation: avalanche multiplication (Neamen Eqs. 8.99–8.111)
> An electron current $I_{n0}$ entering the depletion region gains pairs at rate $\alpha_n$ per unit length (holes at $\alpha_p$). With $\alpha_n = \alpha_p = \alpha$ and $I = I_n + I_p$ constant,
> $$1 - \frac{1}{M_n} = \int_0^W\alpha\,dx$$
> and breakdown is the voltage at which the multiplication $M_n\to\infty$: $\int_0^W\alpha\,dx = 1$. Since $\alpha$ is a steep function of field, define breakdown by the peak field reaching $E_{crit}$. For a one-sided junction $E_{max} = qN_Bx_n/\varepsilon_{si}$ and $x_n\approx\sqrt{2\varepsilon_{si}V_R/(qN_B)}$ (neglecting $\Phi_0$); setting $E_{max} = E_{crit}$ at $V_R = V_B$ gives the boxed result.
>
> Tunnelling instead needs the bands on the two sides to overlap across a barrier only a few nm thick: electrons in the p-side valence band tunnel straight into the n-side conduction band. More valence electrons are available at higher temperature, hence the negative TC; avalanche needs carriers to gain energy between lattice collisions, and collisions increase with temperature, hence the positive TC.

### The Zener Model and Shunt Regulator

```tikz title="Zener model in breakdown: a battery V_Z0 in series with the incremental resistance r_z (left), and the shunt regulator it builds (right). After Sedra Figs. 4.13 and 4.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[above] {cathode} to[R,l_=$r_z$] (0,1.5) to[battery1,l_=$V_{Z0}$] (0,0) node[below] {anode};
  \draw[->] (0.9,2.8) -- (0.9,0.4) node[midway,right,font=\scriptsize] {$I_Z$};
  \node[font=\scriptsize] at (0,-0.9) {$V_Z = V_{Z0}+r_zI_Z$};
  \begin{scope}[xshift=4.2cm]
    \draw (0,3) node[above] {$V^+$} to[R,l=$R$] (2,3) -- (3.6,3) to[R,l=$R_L$] (3.6,0);
    \draw (2,3) to[zD*,invert,l=$V_Z$] (2,0);
    \draw (0,0) -- (3.6,0);
    \draw (2,0) node[ground]{};
    \draw (3.6,3) node[circ]{} node[above] {$V_O$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_Z = V_{Z0} + r_zI_Z},\qquad \boxed{\frac{\Delta V_O}{\Delta V^+} = \frac{r_z}{R+r_z}\ \text{(line regulation)},\quad \frac{\Delta V_O}{\Delta I_L} = -(r_z\parallel R)\ \text{(load regulation)}}
$$

- Datasheet terms: $V_{ZT}$ at test current $I_{ZT}$, knee current $I_{ZK}$ (keep $I_Z$ above it at maximum load), $r_z$, power rating, TC.
- Shunt regulators waste the Zener current on top of the load current and give only the voltages diodes come in; ICs replace them with regulators, but Zener and forward-diode clamps survive in protection and gate-clamp circuits.
- On-chip, an emitter-base junction is the classic Zener: $BV_{EBO}\approx 6.8$ V (6–12 V by process), TC +3 to +4 mV/°C, at most about 10 µA per µm of emitter periphery for a reference (Hastings §11.1.2). Stacks of Zeners plus forward diodes trade breakdown voltage against TC.
- **Soft breakdown below 5 V** makes low-voltage gate-clamp Zeners nearly impossible; no fully satisfactory low-voltage substitute exists (Hastings).

## Level 4: Schottky Diodes

```tikz title="Schottky barrier: metal (or silicide) on lightly doped n-type silicon forms a rectifying barrier with its depletion region on the silicon side; on heavily doped n+ the depletion region is thin enough to tunnel through and the same metal makes an ohmic contact. Right: forward I-V of a Schottky and a pn diode at the same current density, from Neamen Ex. 9.6. After Carusone Fig. 1.5, Hastings Fig. 1.15 and Neamen Fig. 9.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (0,0) rectangle (6,1.2);
  \fill[yellow!25] (0.4,1.2) rectangle (5.6,3);
  \draw[dashed] (0.4,3) -- (0.4,1.2) -- (5.6,1.2) -- (5.6,3);
  \fill[green!50] (4.3,2.6) rectangle (5.2,3);
  \fill[white] (1.0,2.3) rectangle (3.0,3);
  \draw[dashed] (1.0,3) -- (1.0,2.3) -- (3.0,2.3) -- (3.0,3);
  \fill[violet!50] (1.0,3) rectangle (3.0,3.25);
  \fill[blue!30] (4.4,3) rectangle (5.1,3.25);
  \draw (0,0) rectangle (6,3);
  \draw (2.0,3.25) -- (2.0,3.7) node[above,font=\scriptsize] {anode (metal/silicide)};
  \draw (4.75,3.25) -- (4.75,3.7) node[above,font=\scriptsize] {cathode};
  \node[font=\scriptsize] at (2.0,2.6) {depletion};
  \node[font=\scriptsize] at (4.75,2.25) {$n^+$: ohmic};
  \node[font=\scriptsize] at (3.0,1.65) {$n^-$ (n-well), $<10^{17}\ \mathrm{cm^{-3}}$};
  \node[font=\scriptsize] at (3.0,0.5) {p-substrate};
  \begin{scope}[xshift=8cm]
    \draw[->] (0,0) -- (4.6,0) node[right] {$V_D$ (V)};
    \draw[->] (0,0) -- (0,3.4) node[above] {$I_D$};
    \foreach \v in {0.2,0.4,0.6} { \draw ({5*\v},0.08) -- ({5*\v},-0.08) node[below,font=\scriptsize] {\v}; }
    \draw[very thick,dashed,domain=0:1.62,samples=50] plot (\x,{0.002*(exp(4.6*\x)-1)});
    \draw[very thick,domain=1.6:3.47,samples=50] plot (\x,{0.002*(exp(4.6*(\x-1.85))-1)});
    \node[font=\scriptsize] at (0.9,3.0) {Schottky};
    \node[font=\scriptsize] at (2.8,3.0) {pn};
    \node[font=\scriptsize,align=center] at (2.4,-1.1) {at 10 A/cm$^2$: 0.31 V vs 0.68 V};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{I_S = A\,K\,T^2e^{-\phi_B/V_T},\qquad V_F = \phi_B + V_T\ln\frac{I_F}{AKT^2}}
$$

- Same exponential law as a pn diode, but $I_S$ comes from **thermionic emission of majority carriers** over the barrier $\phi_B$, not from minority-carrier diffusion. $K$ (Neamen's $A^*$) is the effective Richardson constant: about 110 A/cm²K² for n-type silicon, 30 for p-type (Hastings).
- **Lower drop:** Schottky $I_S$ is orders of magnitude larger. Neamen Ex. 9.5–9.6: W–Si barrier (0.67 V) gives $J_{sT} = 5.98\times10^{-5}$ A/cm² versus $3.66\times10^{-11}$ for a comparable pn junction, so 10 A/cm² needs 0.312 V versus 0.682 V: **0.37 V lower**.
- **No minority-carrier storage:** $C_d = 0$, no storage time, only $C_j$ to discharge (through about 0.2 V, Carusone). Hence antisaturation clamps (Schottky transistors), fast rectifiers, RF mixers and detectors.
- **Costs:** more leakage (barrier heights below about 0.6 V leak too much when hot), softer breakdown at the contact edge (fix with a $p^+$ **field-relief guard ring** or a field plate), smaller TC (about −1 mV/°C, Hastings), and they match worse than pn junctions.
- **Rectifying vs ohmic** is set by doping: below about $10^{17}\ \mathrm{cm^{-3}}$ the barrier rectifies; above about $10^{19}\ \mathrm{cm^{-3}}$ carriers tunnel through and it is an ohmic contact. That is why every contact sits on $n^+$ or $p^+$ (Carusone Fig. 1.1).

Typical barrier heights to n-type silicon (Hastings Table 11.1): Al 0.72 V, CoSi₂ 0.65, Au 0.80, Mo 0.68, NiSi 0.67, Pd₂Si 0.75, PtSi 0.87, TiSi₂ 0.61. To p-type silicon they are all too low to make useful diodes. Hastings' example: a PtSi Schottky at 1 µA/µm² and 25 °C sits about 300 mV below its barrier, $V_F\approx0.47$ V. The best barrier for practical n-type Schottkies is about 0.75–0.80 V; an antisaturation clamp needs a forward voltage at least 150 mV below the base-collector junction's.

> [!note]- Derivation: the ideal barrier and why reality differs (Neamen §9.1)
> Before contact, the metal Fermi level is $\phi_m$ below vacuum and the semiconductor's is $\chi+\phi_n$ below vacuum ($\chi$ = electron affinity). Electrons flow from the semiconductor into the metal until the Fermi levels align, leaving a donor depletion region exactly like the light side of a $p^+n$ junction. Ideally
> $$\phi_{B0} = \phi_m-\chi,\qquad V_{bi} = \phi_{B0}-\phi_n,\qquad W = \sqrt{\frac{2\varepsilon_{si}(V_{bi}+V_R)}{qN_d}}$$
> Neamen Ex. 9.1: tungsten ($\phi_m = 4.55$ V) on n-Si ($\chi = 4.01$ V), $N_d = 10^{16}$: $\phi_{B0} = 0.54$ V, $V_{bi} = 0.33$ V, $W = 0.207$ µm, $|E_{max}| = 3.2\times10^4$ V/cm. Measured C–V on W–Si gives 0.52 V (Ex. 9.2), close; for other metals the gap is larger because **surface states pin the Fermi level** and the image force lowers the barrier with field (Schottky effect, which also makes the reverse current grow with $V_R$). In practice $\phi_B$ is a measured parameter. The current is thermionic emission over the barrier: $J = A^*T^2e^{-\phi_{Bn}/V_T}\left(e^{V_a/V_T}-1\right)$ (Neamen Eqs. 9.23–9.26).

## Diodes in a CMOS Process

Same colour legend as [[BJTs#Layout]], extended with metal, silicide and poly:

```tikz title="Legend for every layout drawing in this note, and the junctions a plain n-well CMOS process provides for free: NSD/p-substrate, PSD/n-well, and n-well/p-substrate. The p-substrate is always at the lowest potential, which pins one terminal of two of the three. After Hastings Sec. 11.2.1 and Carusone Fig. 1.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\c/\t in {0/gray!20/{p-substrate / p-epi},1/yellow!25/{n-well},2/green!50/{NSD ($n^+$)},3/magenta!40/{PSD ($p^+$)},4/red!55/{poly},5/blue!30/{metal},6/violet!50/{silicide (Schottky)}} {
    \pgfmathsetmacro{\lx}{3.4*mod(\i,4)}
    \pgfmathsetmacro{\ly}{\i<4 ? 6.4 : 5.9}
    \fill[\c] (\lx,\ly) rectangle ({\lx+0.4},{\ly+0.3});
    \node[font=\scriptsize,anchor=west] at ({\lx+0.45},{\ly+0.15}) {\t};
  }
  \fill[black] (10.2,5.9) rectangle (10.5,6.2); \node[font=\scriptsize,anchor=west] at (10.6,6.05) {contact};
  \draw[dashed,thick] (0,5.4) rectangle (0.4,5.7); \node[font=\scriptsize,anchor=west] at (0.45,5.55) {well outline (top views)};
  \fill[gray!20] (0,0) rectangle (13,3.2);
  \fill[yellow!25] (6.0,1.0) rectangle (12.4,3.2);
  \draw[dashed] (6.0,3.2) -- (6.0,1.0) -- (12.4,1.0) -- (12.4,3.2);
  \fill[green!50] (1.6,2.75) rectangle (3.4,3.2);
  \fill[magenta!40] (0.3,2.75) rectangle (1.0,3.2);
  \fill[magenta!40] (7.6,2.75) rectangle (9.4,3.2);
  \fill[green!50] (10.6,2.75) rectangle (11.4,3.2);
  \draw (0,0) rectangle (13,3.2);
  \foreach \x/\l in {0.65/{sub},2.5/{K$_1$},8.5/{A$_2$},11.0/{K$_2$, K$_3$}} { \fill[black] ({\x-0.15},3.2) rectangle ({\x+0.15},3.4); \node[above,font=\scriptsize] at (\x,3.4) {\l}; }
  \node[font=\scriptsize,align=center] at (2.5,1.9) {(1) NSD/p-sub\\ anode = substrate};
  \node[font=\scriptsize,align=center,anchor=west] at (6.1,2.0) {(2) PSD/n-well\\ = E-B of substrate pnp};
  \draw[->] (9.15,2.7) -- (9.15,0.4);
  \node[font=\scriptsize,anchor=west] at (9.2,0.7) {holes to substrate};
  \node[font=\scriptsize,align=center] at (3.2,1.0) {(3) n-well/p-sub: large area};
  \draw[->] (4.6,1.0) -- (6.0,1.4);
  \node[font=\scriptsize] at (3.2,0.35) {p-substrate $=$ lowest supply};
\end{circuitikz}
\end{document}
```

| Junction | Anode / cathode | Good for | Catch |
|---|---|---|---|
| NSD / p-substrate (or NSD/p-well) | substrate / $n^+$ | ESD diode to ground, **antenna diode**, junction cap | Anode is the substrate: it can only forward-bias if the cathode goes **below ground**, and then it injects electrons into the substrate (latch-up, substrate noise) |
| PSD / n-well | $p^+$ / well | ESD diode to $V_{DD}$, avalanche "Zener" (≥ about 7 V), varactor | Forward bias = the emitter-base junction of the [[BJTs#Substrate PNP in CMOS\|substrate pnp]]: most of the current goes to substrate |
| n-well / p-substrate | substrate / well | Well capacitor bottom plate, large-area photodiode | Large area and perimeter; anode again the substrate |
| Poly diode ($p$ and $n$ regions in poly) | either | Isolated from substrate: ESD for RF, rectifier, Zener (≥ about 6 V) | Grain boundaries: orders of magnitude more leakage; thermally fragile; never matches |
| Schottky (silicide on n-well) | silicide / well | Fast clamp, mixer | Needs a suitable silicide (CoSi₂, NiSi, PtSi; not TiSi₂) and a guard ring; no hole-blocking ring in plain CMOS |

- **Rule of thumb:** MOS junctions are meant to stay reverse-biased, so a CMOS process does nothing to contain minority carriers. Every forward-biased CMOS junction injects into the substrate.
- In dual-, triple-, and quad-well processes NSD/p-well diodes replace NSD/p-epi, and deep n-wells give isolated variants (Hastings §11.2.1).

> [!tip] Remark
> Every MOSFET is already two of these diodes: the source–bulk and drain–bulk junctions. Keeping them reverse-biased is why the NMOS bulk goes to the most negative supply and the PMOS well to the most positive ([[MosFETs#Structure]]); their reverse-biased capacitance is the [[#Junction Capacitance C_j(V)|$C_j$]] above.

### Diode-Connected Devices

```tikz title="Diode-connected devices. A BJT with collector tied to base (left) obeys the diode law with the BJT's I_S. A MOSFET with gate tied to drain (middle and right) is always saturated: a 'diode' with a square law, the reference side of every current mirror. The body diodes D_DB and D_SB ride along. After Hastings Figs. 11.1 and 11.14(A, E)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[npn](Q){};
  \draw (Q.B) -- ++(-0.3,0) |- ($(Q.C)+(0,0.4)$) -- (Q.C);
  \draw (Q.C) -- ++(0,0.8) node[above] {anode};
  \draw (Q.E) -- ++(0,-0.4) node[below] {cathode};
  \node[font=\scriptsize,align=center] at (0,-2.0) {diode-connected BJT\\ $R_S = R_B/\beta_F + R_E$};
  \begin{scope}[xshift=4.6cm]
    \draw (0,0) node[nmos](M){};
    \draw (M.G) -- ++(-0.3,0) |- ($(M.D)+(0,0.4)$) -- (M.D);
    \draw (M.D) -- ++(0,0.8) node[above] {D/G (anode)};
    \draw (M.S) -- ++(0,-1.0) node[below] {S (cathode)};
    \draw ($(M.D)+(0,0.4)$) -- ++(1.2,0) to[D,invert] ++(0,-1.4) coordinate(bg) node[circ]{} to[D] ++(0,-1.4) coordinate(b2);
    \draw (b2) -- (b2 -| M.S);
    \draw (bg) -- ++(0.5,0) node[right,font=\scriptsize] {BG};
    \node[font=\scriptsize,anchor=west] at ($(bg)+(0.1,0.75)$) {$D_{DB}$};
    \node[font=\scriptsize,anchor=west] at ($(bg)+(0.1,-0.75)$) {$D_{SB}$};
    \node[font=\scriptsize,align=center] at (0.3,-2.9) {NMOS, separate backgate\\ $D_{DB}$, $D_{SB}$ reverse-biased};
  \end{scope}
  \begin{scope}[xshift=9.4cm]
    \draw (0,0) node[pmos](P){};
    \draw (P.G) -- ++(-0.3,0) |- ($(P.D)+(0,-0.4)$) -- (P.D);
    \draw (P.S) -- ++(0,0.4) node[above] {S (anode)};
    \draw (P.D) -- ++(0,-0.8) node[below] {D/G (cathode)};
    \draw (P.S) ++(0,0.2) -- ++(1.1,0) -- ++(0,-1.0) node[circ]{};
    \draw (P.D) ++(0,-0.4) -- ++(1.1,0) to[D] ++(0,1.2);
    \node[font=\scriptsize,anchor=west] at ($(P.D)+(1.3,0.3)$) {$D_{DB}$};
    \node[font=\scriptsize,align=center] at (0.4,-2.9) {PMOS, well to source\\ $D_{DB}$ antiparallel};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Diode-connected BJT** (collector to base): the best on-chip pn diode. Diode law with the BJT's $I_S$, series resistance $R_S = R_B/\beta_F + R_E$, about 10–20 Ω for a minimum standard-bipolar device; reverse voltage limited by $BV_{EBO}$ (keep below about 2/3 of it, Hastings §11.1.1). The CMOS substrate pnp is used the same way and is the bandgap's diode.
- **Diode-connected MOSFET** (gate to drain): $V_{DS} = V_{GS} > V_{GS}-V_{TH}$, so it is **always saturated**, and $I_D = \frac12\mu C_{ox}\frac WL(V_{GS}-V_{TH})^2$: not an exponential. Its small-signal resistance is $1/g_m$ (in parallel with $r_o$, and $1/(g_m+g_{mb})$ if the source is not at the bulk potential). It is the input of every current mirror and the "leakage clamp" of Hastings Fig. 11.14.
- A diode-connected PMOS in a p-substrate process can always see its body diode forward-biased into the substrate; a mirror reference normally ties well to source (Fig. 11.14E) and biases so the body diode never conducts.
- Lateral pnps make poor diodes (0.1–1 % of the current lost to substrate) but have high breakdown, so they are sometimes used as high-voltage clamps (Hastings).

> [!tip] Remark
> The diode-connected MOSFET's $1/g_m$, its role in mirrors and its body-effect correction belong to [[Current Mirrors]] and [[Single-Stage]] (diode-connected load). Here it matters only as the CMOS designer's substitute for a diode when no good junction is available.

### ESD and Antenna Diodes

```tikz title="Top view of an NSD/p-epi ESD diode: interdigitated strips of NMoat (cathode, NSD) and PMoat (substrate contact, anode), as many contacts as fit. The PSD/n-well version is the same array enclosed in an n-well. After Hastings Fig. 11.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (-0.4,-0.6) rectangle (9.2,4.4);
  \foreach \i in {0,...,8} {
    \pgfmathsetmacro{\x}{\i*1.0}
    \ifodd\i
      \fill[green!50] (\x,0) rectangle ({\x+0.5},3.8);
    \else
      \fill[magenta!40] (\x,0) rectangle ({\x+0.5},3.8);
    \fi
    \foreach \y in {0.3,0.9,1.5,2.1,2.7,3.3} { \fill[black] ({\x+0.12},\y) rectangle ({\x+0.38},{\y+0.26}); }
  }
  \node[font=\scriptsize,anchor=west] at (9.4,3.5) {PMoat (PSD): anode = substrate};
  \node[font=\scriptsize,anchor=west] at (9.4,2.9) {NMoat (NSD): cathode, to pad};
  \node[font=\scriptsize,anchor=west] at (9.4,2.0) {electrons injected into p-epi};
  \node[font=\scriptsize,anchor=west] at (9.4,1.5) {spread down and sideways:};
  \node[font=\scriptsize,anchor=west] at (9.4,1.0) {built-in ballasting, heat away};
  \node[font=\scriptsize,anchor=west] at (9.4,0.5) {from metal and surface};
  \node[font=\scriptsize] at (4.4,-0.95) {2 kV HBM: about 1000 $\mu$m$^2$, $R_S\le 3\ \Omega$};
\end{circuitikz}
\end{document}
```

- **ESD diodes** shunt a strike to a supply: NSD/p-epi to ground for negative strikes, PSD/n-well to $V_{DD}$ for positive ones, as antiparallel clamps.
- Sizing (Hastings §11.2.1): a 2 kV HBM strike peaks at about 1.3 A with a 220 ns time constant. Holding the forward drop to about 5 V needs $R_S\le 3$ Ω, which takes about 1000 µm² of interdigitated strips.
- **Why so robust:** the current is electrons injected from heavy NSD into light p-epi; they diffuse tens of µm before recombining, ballasting the device and moving the heat into the bulk. So **don't** add silicide block here; silicide everything, maximize contacts and metal.
- PSD/N-well diodes on pins can forward-bias during latch-up testing; every pin diode needs latch-up guard rings.
- **Antenna diodes:** a minimum NSD/p-sub diode on a long gate-connected wire bleeds plasma-etch charge to substrate before it can break down the gate oxide.

> [!tip] Remark
> The full ESD network (rail clamps, current paths, CDM, guard rings, latch-up) is owned by [[Guard Rings, ESD and Interconnect]]. This note owns only the diode itself.

### PSD/N-Well Zener

```tikz title="PSD/n-well avalanche diode with a poly field plate. Top view (left): PMoat anode, poly ring over the junction, NMoat cathode ring, all inside an n-well. Cross-section (right): the poly ring, tied to the anode, widens the surface depletion and pushes breakdown below the surface. After Hastings Fig. 11.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (-0.4,-0.4) rectangle (5.0,5.0);
  \fill[yellow!25] (0,0) rectangle (4.6,4.6);
  \draw[dashed,thick] (0,0) rectangle (4.6,4.6);
  \fill[green!50] (0.4,0.4) rectangle (4.2,4.2);
  \fill[yellow!25] (0.9,0.9) rectangle (3.7,3.7);
  \fill[red!55] (1.2,1.2) rectangle (3.4,3.4);
  \fill[magenta!40] (1.6,1.6) rectangle (3.0,3.0);
  \foreach \x/\y in {2.0/2.0,2.4/2.0,2.0/2.4,2.4/2.4} { \fill[black] (\x,\y) rectangle ({\x+0.25},{\y+0.25}); }
  \foreach \x in {1.0,1.8,2.6,3.4} { \fill[black] (\x,3.8) rectangle ({\x+0.25},4.05); }
  \node[font=\scriptsize] at (2.3,-0.7) {top view};
  \begin{scope}[xshift=6.6cm,yshift=0.4cm]
    \fill[gray!20] (0,0) rectangle (7.6,3.2);
    \fill[yellow!25] (0.6,1.0) rectangle (7.0,3.2);
    \draw[dashed] (0.6,3.2) -- (0.6,1.0) -- (7.0,1.0) -- (7.0,3.2);
    \fill[green!50] (1.0,2.8) rectangle (1.8,3.2); \fill[green!50] (5.8,2.8) rectangle (6.6,3.2);
    \fill[magenta!40] (3.2,2.75) rectangle (4.4,3.2);
    \fill[red!55] (2.5,3.3) rectangle (3.4,3.5); \fill[red!55] (4.2,3.3) rectangle (5.1,3.5);
    \draw (0,0) rectangle (7.6,3.2);
    \draw (1.4,3.2) -- (1.4,3.9) node[above,font=\scriptsize] {C};
    \draw (3.8,3.2) -- (3.8,3.9) node[above,font=\scriptsize] {A};
    \draw (2.95,3.5) -- (2.95,3.9) node[above,font=\scriptsize] {FP = A};
    \draw[thick,dotted] (3.1,2.75) arc (180:360:0.7 and 0.45);
    \node[font=\scriptsize] at (3.8,1.95) {subsurface breakdown};
    \node[font=\scriptsize] at (1.8,1.4) {n-well};
    \node[font=\scriptsize] at (3.8,0.4) {p-substrate};
    \node[font=\scriptsize] at (3.8,-0.6) {cross-section};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Breakdown was above 20 V in old, lightly doped wells; modern wells are heavier but never go much below 7 V (a softer, tunnelling junction would leak into every PMOS). So every PSD/n-well "Zener" is an **avalanche** diode (Hastings §11.2.1; example process: 16 V).
- **Poly field plate** over the junction, tied to the anode, forces subsurface breakdown and suppresses walkout; metal is too far above the silicon to work.
- At most 1–2 µA continuous per µm of cathode periphery; for more current interdigitate PSD/NSD strips with PSD on the outside.
- Fragile under pulses: energy goes into the small depletion volume. Add ballast: silicide block leaving 1–2 µm of unsilicided PSD between contact and moat edge (or, unsilicided processes, 1–2 µm extra moat overlap of contact).

### CMOS Schottky Diode

```tikz title="Schottky diode in CMOS: a silicided moat region over n-well forms the anode, a PSD ring around its edge is the field-relief guard ring, NMoat strips on both sides contact the n-well cathode. Top view (left) and cross-section (right). After Hastings Fig. 11.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (-0.4,-0.4) rectangle (4.4,5.4);
  \fill[yellow!25] (0,0) rectangle (4.0,5.0);
  \draw[dashed,thick] (0,0) rectangle (4.0,5.0);
  \fill[green!50] (0.5,4.1) rectangle (3.5,4.6);
  \fill[green!50] (0.5,0.4) rectangle (3.5,0.9);
  \foreach \x in {0.8,1.6,2.4,3.0} { \fill[black] (\x,4.22) rectangle ({\x+0.25},4.47); \fill[black] (\x,0.52) rectangle ({\x+0.25},0.77); }
  \fill[magenta!40] (0.7,1.4) rectangle (3.3,3.6);
  \fill[violet!50] (1.0,1.7) rectangle (3.0,3.3);
  \fill[black] (1.3,2.0) rectangle (2.7,3.0);
  \node[font=\scriptsize,anchor=west] at (4.6,4.35) {NMoat: cathode};
  \node[font=\scriptsize,anchor=west] at (4.6,3.45) {PSD guard ring};
  \node[font=\scriptsize,anchor=west] at (4.6,2.5) {silicide on n-well: anode};
  \node[font=\scriptsize,anchor=west] at (4.6,0.65) {NMoat: cathode};
  \begin{scope}[xshift=8.2cm,yshift=0.6cm]
    \fill[gray!20] (0,0) rectangle (7.2,3.0);
    \fill[yellow!25] (0.5,0.9) rectangle (6.7,3.0);
    \draw[dashed] (0.5,3.0) -- (0.5,0.9) -- (6.7,0.9) -- (6.7,3.0);
    \fill[green!50] (0.9,2.6) rectangle (1.7,3.0); \fill[green!50] (5.5,2.6) rectangle (6.3,3.0);
    \fill[magenta!40] (2.4,2.65) rectangle (2.9,3.0); \fill[magenta!40] (4.3,2.65) rectangle (4.8,3.0);
    \fill[violet!50] (2.6,3.0) rectangle (4.6,3.15);
    \fill[blue!30] (2.4,3.15) rectangle (4.8,3.4);
    \draw (0,0) rectangle (7.2,3.0);
    \draw (1.3,3.0) -- (1.3,3.7) node[above,font=\scriptsize] {C};
    \draw (3.6,3.4) -- (3.6,3.7) node[above,font=\scriptsize] {A};
    \draw (5.9,3.0) -- (5.9,3.7) node[above,font=\scriptsize] {C};
    \node[font=\scriptsize] at (3.6,1.6) {n-well};
    \node[font=\scriptsize] at (3.6,0.4) {p-substrate};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Possible only with a suitable silicide: noble (PtSi, Pd₂Si) or the modern refractory CoSi₂ / NiSi. TiSi₂ processes (late 1980s–1990s) could not build low-leakage Schottkies (Hastings §11.2.3).
- The PSD guard ring sets the breakdown at the PSD/n-well avalanche voltage; replacing it with a field plate is smaller but leakier and breaks down lower.
- No NBL or sinker in plain CMOS, so series resistance is high: elongate the anode and surround it with cathode contacts; a few mA is easy, hundreds of mA is not. At high current the guard-ring junction itself forward-biases and injects holes into the substrate.
- Processes that require arrays of small contacts can only make Schottkies with fully silicided moat: the silicided bare moat is the anode, the contacts just reach it.

### Matching Diodes

```tikz title="Good vs bad for a matched PSD/n-well diode pair. Bad (left): one compact PSD square per diode, centred in its well; the base current crosses a long, resistive stretch of well, and random beta mismatch becomes voltage mismatch. Good (right): long thin PSD strips flanked by NMoat contacts, in a 2x2 cross-coupled (common-centroid) arrangement. After Hastings Fig. 11.23 and Sec. 11.3.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \x/\l in {0/A,2.8/B} {
    \fill[yellow!25] (\x,0) rectangle ({\x+2.4},2.4);
    \draw[dashed,thick] (\x,0) rectangle ({\x+2.4},2.4);
    \fill[green!50] ({\x+0.2},0.2) rectangle ({\x+2.2},0.5);
    \fill[magenta!40] ({\x+0.8},0.9) rectangle ({\x+1.6},1.7);
    \fill[black] ({\x+1.07},1.17) rectangle ({\x+1.33},1.43);
    \node[font=\scriptsize] at ({\x+1.2},2.65) {\l};
    \draw[->,red,thick] ({\x+1.2},0.9) -- ({\x+1.2},0.52);
  }
  \node[font=\scriptsize,red,align=center] at (2.6,-0.65) {BAD: long well path,\\ $\Delta\beta \to \Delta V$};
  \begin{scope}[xshift=7.2cm]
    \foreach \x/\y/\l in {0/2.0/A,2.6/2.0/B,0/0/B,2.6/0/A} {
      \fill[yellow!25] (\x,\y) rectangle ({\x+2.4},{\y+1.8});
      \draw[dashed,thick] (\x,\y) rectangle ({\x+2.4},{\y+1.8});
      \fill[green!50] ({\x+0.2},{\y+0.2}) rectangle ({\x+2.2},{\y+0.45});
      \fill[magenta!40] ({\x+0.2},{\y+0.75}) rectangle ({\x+2.2},{\y+1.05});
      \fill[green!50] ({\x+0.2},{\y+1.35}) rectangle ({\x+2.2},{\y+1.6});
      \foreach \k in {0.35,0.75,1.15,1.55,1.95} {
        \fill[black] ({\x+\k-0.08},{\y+0.25}) rectangle ({\x+\k+0.08},{\y+0.41});
        \fill[black] ({\x+\k-0.08},{\y+0.82}) rectangle ({\x+\k+0.08},{\y+0.98});
        \fill[black] ({\x+\k-0.08},{\y+1.4}) rectangle ({\x+\k+0.08},{\y+1.56});
      }
      \node[font=\scriptsize,fill=white,inner sep=1pt] at ({\x+1.2},{\y+1.2}) {\l};
    }
    \node[font=\scriptsize,green!40!black,align=center] at (2.5,-0.65) {GOOD: thin strips between cathode\\ contacts, cross-coupled (common centroid)};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Grade (Hastings §11.3.4) | Offset at equal current | Current mismatch at equal voltage | Enough for |
|---|---|---|---|
| Minimal | ±2 mV | ±8 % | General-purpose op-amps, comparators |
| Moderate | ±0.5 mV | ±2 % | ±1 % bandgaps; 1–2 mV untrimmed offsets |
| Exceptional | ±0.1 mV | ±0.5 % | Only diode-connected vertical bipolars with a $\beta$ plateau, often with trim |

(Six-sigma, 10-year life, −40 to 125 °C, plastic package.)

**Rules** (Hastings §11.3.4; diodes built from bipolar transistors follow [[BJTs#Rules for Matching Vertical Transistors]]):
1. **Poly diodes and surface Zeners do not match.** Grain-dependent leakage; walkout. Surface Zeners: expect 50–100 mV, possibly 1 V. Buried Zeners are better but still "winner takes all" (the weakest spot sets $V_{BR}$), so Pelgrom's law doesn't apply.
2. **High ideality factors are unsuited to ratioed pairs:** $n\le1.1$ for minimal, $<1.05$ (preferably $<1.03$) for moderate matching. It is the *variation* of $n$ that hurts.
3. **Diode-connected transistors without a $\beta$ plateau are unsuited to ratioed pairs** (CMOS PSD/n-well diodes almost never have one: avoid ratioed pairs of them if you can, or run near peak $\beta$).
4. **Identical junction (or Schottky contact) geometries.** The surrounding well matters far less.
5. **Width of the area-defining geometry 2–10× minimum;** moderately matched diode-connected transistors take 10–50 µm². Prefer arrays of moderate units to one huge device (nonlinear gradients).
6. **Circles or squares** (high area/perimeter), except high-current devices, where long thin geometries cut series drops (the PSD/n-well strip above).
7. **Close together; common centroid** mandatory for moderate and exceptional.
8. **Compact array** (clusters, cross-coupled pairs) rather than a line.
9. **Away from power devices:** at least 250 µm from anything dissipating ≥ 250 mW for minimal matching; 100–250 µm from anything above 50 mW and on the far side of the die for moderate.
10. **Low stress gradients:** near the die centre, not within about 250 µm of an edge, never in a corner (piezojunction effect).
11. **On a die axis of symmetry** for moderate and exceptional pairs.
12. **Keep the NBL shadow off the active area** (especially Schottkies, whose barrier is at the surface).
13. **Merged PN diodes 1–2 µm further apart than the rules require** (laterally injected minority carriers interact); use the unconnected-diffusion spacing rule.
14. **Generous diffusion overlaps** (e.g. base over emitter) for moderate and exceptional matching.

> [!note]- Detail: why Zeners and Schottkies match badly (Hastings §11.3.2–11.3.3)
> - **Zeners:** the exponential avalanche current means the point that breaks down first carries everything. Resistive ballast could spread it, but even the base sheet resistance is too small. For an annular base contact around a circular emitter the ballast voltage is $V = JR_Sr_1\ln(r_2/r_1)$ (Eq. 11.9); with $J = 10$ µA/µm, $R_S = 160$ Ω/□, $r_1 = 4$ µm, $r_2 = 8$ µm it is only 4 mV, against about 50 mV needed. Matched Zeners use large circular geometries and a quatrefoil cross-coupled layout, and still rarely beat 50–100 mV.
> - **Schottkies:** the barrier depends on metal, doping, edges, asperities and anneal. Aluminium Schottkies match worst (Al dissolves and redeposits at the contact edge during sintering). Noble silicides with field-relief guard rings match reasonably: a guard-ringed PtSi diode of 250 µm² measured $n = 1.02$. Small diodes are inhomogeneous: Au/p-Si diodes had $n = 1.006$ at 100 µm diameter, rising steeply below about 20 µm to $n = 1.41$ at 5 µm, with the barrier falling from 0.791 to 0.623 V over the same range. A non-unity $n$ often follows $n = 1 + T_0/T$ (excess temperature $T_0$, about 30 K for $n = 1.1$), which puts a constant offset into a ratioed pair's $\Delta V$. Avoid ratioed Schottky pairs; keep matched ones above about 10–15 µm wide.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ Junction area | $I_S$ (lower $V_D$ at a given $I_D$), current capacity, matching ($\propto1/\sqrt{A}$) | $C_j$, leakage, sensitivity to gradients if very large |
| ↑ Forward current $I_D$ | $r_d = V_T/I_D$ smaller, faster ($C_j$ less important) | Power, $C_d\propto I_D$, series-resistance error, high-injection $n>1$ |
| ↑ Reverse bias $V_R$ | Smaller $C_j$ (as $(1+V_R/\Phi_0)^{-m}$), less varactor sensitivity | Approaches breakdown; leakage grows slowly with depletion volume |
| Lighter doping on the light side | Lower $C_j$, higher breakdown | Larger series resistance, wider depletion (punchthrough risk) |
| Abrupt → graded → hyperabrupt profile | Graded: more linear, smaller $C_j$. Hyperabrupt: larger tuning range, linear $f(V)$ | Process control; hyperabrupt needs a special implant |
| pn → Schottky | ~0.3–0.4 V lower drop, no storage time ($C_d=0$) | Leakage, softer breakdown, needs silicide and guard ring, worse matching |
| Zener around 5–6 V | Near-zero TC reference | Soft knee: needs well-regulated current; surface Zeners drift |
| Buried vs surface Zener | No walkout/walkback, much better stability | Extra mask or special implant |
| Diode-connected BJT vs PSD/n-well vs MOS | BJT: true exponential, best matching. PSD/n-well: free in CMOS. MOS: no substrate injection | PSD/n-well: substrate current, low $\beta$, well resistance. MOS: square law, $V_{TH}$ spread |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Diode law | $I_D = I_S\left(e^{V_D/nV_T}-1\right)$, $V_T = kT/q\approx26$ mV |
| Forward voltage | $V_D = nV_T\ln(I_D/I_S)$; 60 mV/dec ($n=1$) |
| Small-signal resistance | $r_d = nV_T/I_D$ |
| Diffusion capacitance | $C_d = \tau_TI_D/V_T = \tau_T/r_d$ |
| Temperature | $dV_D/dT\approx-2$ mV/°C (pn), $\approx-1$ mV/°C (Schottky) |
| Built-in potential | $\Phi_0 = V_T\ln\left(N_AN_D/n_i^2\right)$ |
| Depletion widths | $x_n = \sqrt{\frac{2\varepsilon_{si}(\Phi_0+V_R)}{q}\frac{N_A}{N_D(N_A+N_D)}}$, $x_p = \sqrt{\frac{2\varepsilon_{si}(\Phi_0+V_R)}{q}\frac{N_D}{N_A(N_A+N_D)}}$ |
| One-sided | $W\approx\sqrt{2\varepsilon_{si}(\Phi_0+V_R)/(qN_D)}$, $x_n/x_p = N_A/N_D$ |
| Junction capacitance | $C_j = C_{j0}/(1+V_R/\Phi_0)^m$, $m = 1/2$ abrupt, $1/3$ graded |
| Zero-bias $C_j$ | $C_{j0} = \sqrt{\frac{q\varepsilon_{si}}{2\Phi_0}\frac{N_AN_D}{N_A+N_D}}\to\sqrt{\frac{q\varepsilon_{si}N_D}{2\Phi_0}}$ |
| Area + perimeter | $C = AC_j + PC_{jsw}$ |
| Varactor sensitivity | $\frac{1}{C_j}\frac{\partial C_j}{\partial V_R} = -\frac{m}{\Phi_0+V_R}$ |
| Varactor range | $C_{max}/C_{min} = \left(\frac{1+V_{R,max}/\Phi_0}{1+V_{R,min}/\Phi_0}\right)^m$ |
| Breakdown (one-sided) | $V_B\approx\varepsilon_{si}E_{crit}^2/(2qN_B)$ |
| Zener model | $V_Z = V_{Z0}+r_zI_Z$; line reg. $r_z/(R+r_z)$; load reg. $-(r_z\parallel R)$ |
| Schottky | $I_S = AKT^2e^{-\phi_B/V_T}$, $V_F = \phi_B+V_T\ln\frac{I_F}{AKT^2}$ |

## References

- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §1.1 Semiconductors and pn Junctions, pp. 1–13: doping (Eqs. 1.1–1.4), diode structure (Fig. 1.1), built-in voltage (Eq. 1.6, Ex. 1.2), depletion widths (Eqs. 1.9–1.12, Ex. 1.3), depletion charge and $C_j$ (Eqs. 1.15–1.21, Ex. 1.4), graded junctions (Eqs. 1.25–1.29, Ex. 1.5), large-signal $C_j$ (Eqs. 1.34–1.38, Ex. 1.6), forward bias and $I_S$ (Eqs. 1.43–1.44), diffusion capacitance (Eqs. 1.45–1.46), small-signal model (Fig. 1.4, Eqs. 1.47–1.49, Ex. 1.7), Schottky diodes (Fig. 1.5). Skipped: the chapter Appendix derivations (covered by Neamen).
- **Neamen, *Semiconductor Physics and Devices*** (PDF page = printed + 20 in Chs. 8–9): Ch. 7 The pn Junction, pp. 238–262: built-in potential, field, space-charge width, junction capacitance, one-sided junctions and $1/C^2$, linearly graded and hyperabrupt junctions with the varactor condition $m = -3/2$ (Eqs. 7.61–7.66). Ch. 8 The pn Junction Diode, pp. 269–318: law of the junction, ideal current (§8.1.5, Ex. 8.4), temperature (§8.1.7, Ex. 8.5), short diode (§8.1.8), diffusion resistance and capacitance (§8.2, Ex. 8.7), generation–recombination and ideality factor (§8.3, Eqs. 8.84–8.98, Fig. 8.21), breakdown (§8.4, Eqs. 8.99–8.111, Figs. 8.24–8.25, Ex. 8.8), charge storage and transients (§8.5, Figs. 8.26–8.28). Ch. 9 §9.1 The Schottky Barrier Diode, pp. 326–343: barrier and band diagrams (Eqs. 9.1–9.9, Exs. 9.1–9.2), image-force lowering, thermionic emission (Eqs. 9.23–9.27, Ex. 9.4), comparison with the pn diode (Exs. 9.5–9.6, Fig. 9.10). Skipped: tunnel diode (§8.6), heterojunctions (§9.3).
- **Sedra & Smith, *Microelectronic Circuits*** Ch. 4 Diodes: §4.1 ideal diode; §4.2 terminal characteristics (Eqs. 4.1–4.5, 2 mV/°C, $I_S$ doubling per 5 °C, leakage doubling per 10 °C, Fig. 4.9); §4.3 exponential and constant-voltage-drop models, breakdown, Zener model (Eq. 4.8, Fig. 4.13); §4.4 small-signal model (Eqs. 4.14–4.19, Ex. 4.5, Table 4.1); §4.5 shunt regulators (Exs. 4.6–4.7); §4.6 rectifiers, peak rectifier (short fold only); §4.7.3 varactors, §4.7.4 photodiodes. Skipped: precision rectifier, clamped capacitor, voltage doubler, LEDs.
- **Hastings, *The Art of Analog Layout*, 3rd ed.** (printed = PDF − 1): §1.2 PN Junctions, pp. 36–45: junction formation (Figs. 1.8–1.10), contact potentials and the Seebeck effect (Fig. 1.12), leakage (doubles per 8 °C), forward voltages and −2 mV/°C, avalanche and Zener mechanisms and their TCs, Schottky barriers (Fig. 1.15), ohmic contacts. Ch. 11 Diodes, pp. 533–570: diode equation and TCs (Eqs. 11.1–11.3); diode-connected transistors (Eq. 11.4, Figs. 11.1–11.2); Zener diodes, walkout, buried Zeners (Figs. 11.3–11.8); Schottky diodes (Eqs. 11.5–11.6, Table 11.1, field plates and guard rings); diode-connected MOS (Fig. 11.14); CMOS junction diodes (NSD/P-epi, PSD/N-well, poly diodes, Figs. 11.15–11.17); CMOS Schottky (Fig. 11.21); matching PN, Zener and Schottky diodes (Eqs. 11.9–11.10, Fig. 11.23) and the 14 matching rules. Skipped: standard-bipolar power diodes (§11.1.4), isolation-NBL and DMOS buried Zeners, BiCMOS power diodes (§11.2.2) beyond the one-line mentions.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** §15.4 (via the Zettelkasten note below): junction capacitance as a varactor, supply sensitivity of an LC VCO.
- **Zettelkasten extension** (`AnalogTheory/Oscillators/`): 13h2 "Drain Junction Capacitance Makes a Differential LC Oscillator Supply Sensitive" (Razavi §15.4, pp. 631–632): the $-m/(\Phi_0+V_R)$ sensitivity and $K = m\omega/[2(\Phi_0+V_{DD})]$, used for the varactor Remark.
