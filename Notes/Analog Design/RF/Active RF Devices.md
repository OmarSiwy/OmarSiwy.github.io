---
title: Active RF Devices
description: Choosing and reading RF devices. Schottky detectors, PIN switches and varactors on the diode side; BJT/HBT, MESFET, HEMT, GaN and CMOS on the transistor side, compared by f_T, f_max, NF_min, power and cost; extrinsic equivalent circuits, Mason's U, reading S-parameter datasheets, and MMICs.
kind: topic
status: growing
aliases:
  - Active RF Devices
  - RF Transistors
  - Microwave Diodes
  - HEMT
  - GaN
---

This note covers only what is RF-specific about devices. Device physics, the low-frequency small-signal models, $f_T$ and junction $C(V)$ live in [[MosFETs]], [[BJTs]] and [[Diodes]]. An RF designer seldom works from physics: a device is a **terminal model** (an equivalent circuit, or measured S-parameters at one bias point) plus a few figures of merit that tell you whether it can do the job at your frequency.

## The big picture

```tikz title="Pozar's technology map: usable frequency vs noise figure for six transistor families. Label = power capacity / cost. After Pozar Table 11.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x: log10(f/GHz) from 0.7 (5 GHz) to 2.1 (125 GHz) mapped to 0..9 ; y: NF 0..2.2 dB mapped to 0..5
  \draw[->] (0,0) -- (9.4,0) node[right] {max. frequency (GHz)};
  \draw[->] (0,0) -- (0,5.4) node[above] {NF (dB)};
  \foreach \f/\x in {10/1.93,20/3.86,30/4.99,60/6.92,100/8.35} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {\f}; }
  \foreach \n in {0.5,1.0,1.5,2.0} { \draw (0.08,{\n*2.27}) -- (-0.08,{\n*2.27}) node[left,font=\scriptsize] {\n}; }
  \fill (1.93,4.54) circle (2.5pt) node[right,font=\scriptsize,align=left] {Si BJT\\high / low};
  \fill (1.93,3.63) circle (2.5pt) node[right,font=\scriptsize,align=left] {GaN HEMT\\high / medium};
  \fill (3.86,2.27) circle (2.5pt) node[above,font=\scriptsize,align=center] {Si CMOS\\low / low};
  \fill (4.99,1.36) circle (2.5pt) node[below right,font=\scriptsize,align=left] {SiGe HBT\\medium / medium};
  \fill (6.92,2.27) circle (2.5pt) node[above,font=\scriptsize,align=center] {GaAs MESFET\\medium / medium};
  \fill (8.35,1.14) circle (2.5pt) node[above,font=\scriptsize,align=center] {GaAs HEMT\\medium / high};
  \node[font=\scriptsize,align=left,anchor=west] at (5.6,4.6) {NF quoted at 2, 6, 4, 8, 10, 12 GHz\\(BJT, GaN, CMOS, HBT, MESFET, HEMT)};
\end{circuitikz}
\end{document}
```

> [!important] The results to remember
> 1. **Diodes do the nonlinear and control jobs.** A Schottky diode is a square-law power detector ($I_{dc}\propto P_{in}$ over a limited range); a PIN diode is a bias-controlled switch ($R_f$ when on, $C_j$ when off); a varactor is a bias-controlled capacitor for tuning.
> 2. **Two speed limits.** $f_T$ is where the short-circuit *current* gain hits 1: $f_T = g_m/2\pi C_{in}$. $f_{max}$ is where the best possible *power* gain (Mason's $U$) hits 1, and it is set by the parasitic resistances $R_g$/$r_b$ that $f_T$ ignores. Above both, a device cannot amplify.
> 3. **Gain at $f$ is bounded by $U\approx(f_{max}/f)^2$**, falling 6 dB/octave. A 10 dB amplifier needs $f_{max}$ well above $3f$.
> 4. **Technology follows the spec:** lowest NF → GaAs HEMT / SiGe HBT; highest power → GaN HEMT, LDMOS (high breakdown voltage); lowest cost and most integration → Si CMOS / SiGe BiCMOS.
> 5. **Design from measured S-parameters at your bias**, not from a hybrid-π model. Datasheet tables tell you gain, match, unilaterality, $f_T$ and $f_{max}$ at a glance.

**Map:** [[#Physics background|physics]] → [[#Spec translation|spec → device]] → [[#Level 0 The Device Menu|device menu]] → [[#Level 1 RF Diodes|diodes: detector, switch, phase shifter, varactor, others]] → [[#Level 2 RF Transistor Families|transistors: BJT/HBT, MESFET, HEMT, GaN, CMOS]] → [[#Level 3 Equivalent Circuit and Figures of Merit|extrinsic model, $f_T$, $f_{max}$, $U$, datasheets]] → [[#Level 4 Microwave Integrated Circuits|hybrid MIC vs MMIC]] → [[#Level 5 Microwave Tubes|tubes]].

## Physics background

Only the RF-specific physics. Junction, Schottky barrier and transistor physics are in the device notes.

### Why Schottky Diodes at RF

> [!tip] Remark
> The Schottky barrier, its exponential law and its lack of minority-carrier storage are derived in [[Diodes#Level 4 Schottky Diodes]]. The RF consequence: no diffusion capacitance and a small $C_j$, so the diode can still rectify at GHz. Microwave Schottkies use n-type GaAs; lower-frequency ones use n-Si (Pozar §11.1).

The RF model is the same exponential $I = I_s(e^{\alpha V}-1)$, $\alpha = q/nkT\approx 1/(25\text{ mV})$, with ideality $n\approx1.05$ for Schottkies and up to 2.0 for point-contact silicon (Pozar Eq. 11.1). What makes it a detector is the *curvature*: expand around the bias point $V_0$:

$$
\boxed{i = vG_d + \frac{v^2}{2}G_d' + \cdots,\qquad G_d = \frac1{R_j} = \alpha(I_0+I_s),\qquad G_d' = \alpha G_d}
$$

The $v^2$ term turns RF power into DC and baseband current. That's all detection and mixing are.

> [!tip] Remark
> $G_d = 1/R_j$ is the diode's small-signal conductance $g_d = I_D/V_T$ from [[Diodes#Small-Signal Model]]. The new thing here is keeping the second-order term $G_d'$, which a linear small-signal model throws away.

### Why a PIN Diode Is a Switch

A PIN diode puts a lightly doped **intrinsic** layer between p and n.

- **Reverse bias:** the I-layer is depleted, so the diode is a small, nearly fixed series capacitance $C_j$: high impedance.
- **Forward bias** (typically 10–30 mA): the I-layer fills with stored carriers and becomes a small resistance $R_f$ that the bias current sets. The junction capacitance drops out of the model (Pozar Fig. 11.6).

> [!tip] Remark
> The stored charge that makes a pn diode slow to turn off ([[Diodes#Diffusion Capacitance and Reverse Recovery]]) is what the PIN diode uses. As long as the RF period is short compared with the carrier lifetime, the charge can't follow the RF swing, so the I-layer acts as a linear resistor. The same stored charge limits switching speed: typically 1–10 µs, down to 20 ns with a careful driver (Pozar).

### Why Compound Semiconductors and Heterojunctions

- **Electron mobility.** GaAs has higher electron mobility than Si, and a GaAs MESFET's gate junction is a Schottky barrier with no junction current, so it has no shot noise. Together these give the MESFET's gain and noise advantage (Pozar §11.3). RF bipolars are npn for the same reason: electrons are faster.
- **HEMT (modulation doping).** Electrons from a doped wide-gap layer (n-GaAlAs) drop into an undoped narrow-gap layer (GaAs) and form a sheet of charge, the 2-D electron gas, physically separated from the dopants that supplied it. Mobility is about **twice the MESFET's** (Pozar), hence the names MODFET (modulation-doped FET), TEGFET (2-D electron gas FET) and SDFET (selectively doped FET). In a **pHEMT** (pseudomorphic) the layers are deliberately lattice-mismatched.
- **GaN.** Wide bandgap means high breakdown field, so AlGaN/GaN HEMTs run at **20–40 V drain** and deliver up to 100 W at low microwave frequencies (Pozar). Power scales with voltage × current, so breakdown voltage *is* power capacity.
- **HBT.** A heterojunction base-emitter (GaAs, InP or SiGe) lets the base be doped heavily and made thin: low $r_b$ and short transit time. Some HBTs exceed 100 GHz; SiGe reaches 60 GHz and above at low cost (Pozar §11.2).

> [!tip] Remark
> Why the SiGe base raises $\beta$, lowers $r_b$ and builds in a drift field is in [[BJTs#Device Types]]. Why $f_T\propto1/L^2$ (MOS) or $1/W_B^2$ (BJT) is in [[MosFETs#Full Small-Signal Model and $f_T$]] and [[BJTs#Unity-Gain Frequency f_T]].

### What Sets the Speed Limit

- **FETs:** gate length. Pozar: gate lengths of 0.2–0.6 µm give upper frequency limits of about 100 down to 50 GHz.
- **BJTs:** base width, typically about 0.1 µm (Pozar Fig. 11.17). The emitter and base are **interdigitated fingers** to cut base resistance, which sets both $f_{max}$ and the $r_b$ thermal noise (binder p. 164).

## Spec translation

A device is not a block, but choosing it is the first spec translation in every RF design. The system asks for NF, gain, $P_{out}$, efficiency, bandwidth and cost at a carrier $f$. Each becomes a device figure of merit, and that picks the **technology**, then the **size** (gate periphery, emitter fingers) and **bias**.

### Device-level specs

| Device role | Its own specs | Source |
|---|---|---|
| Detector (Schottky) | voltage sensitivity $\beta_v$ (mV/mW), square-law range, video resistance $R_j$ | Pozar §11.1 |
| Switch / attenuator (PIN, FET, MEMS) | ON insertion loss, OFF isolation, switching speed, bias power | Pozar §11.1, §11.4 |
| Tuning element (varactor) | $C_{max}/C_{min}$, $Q$ at $f$ | Pozar §11.1 |
| Transistor (LNA, PA, oscillator, mixer) | $f_T$, $f_{max}$, $NF_{min}$ at $f$, power capacity, supply polarity, cost | Pozar Table 11.6 |

### System spec → device spec

| System spec | Device spec it lands on | What sets it |
|---|---|---|
| Noise figure at $f$ | $NF_{min}(f)$, plus $\Gamma_{opt}$, $R_n$ | technology (Table 11.6), bias (low $I_C$; $\approx15\%\,I_{DSS}$ for a MESFET) |
| Gain at $f$ | $U(f)$, MSG/MAG$(f)$ | $f_{max}/f$: $G\lesssim U\approx(f_{max}/f)^2$ |
| Frequency of operation | $f_T$, $f_{max}$ well above $f$ | gate length / base width (process), bias current density |
| Output power $P_{out}$ | $V_{max}$ (breakdown) × $I_{max}$ | technology (voltage), periphery (current) |
| Efficiency (PAE) | gain at $f$, knee voltage | $f_{max}/f$; PAE $=\eta(1-1/G)$ |
| Bandwidth | parasitic $L$, $C$ at the terminals | packaged vs monolithic (MMIC parasitics are smaller) |
| Cost / integration | process cost, single supply | Table 11.6 cost and polarity rows; CMOS/SiGe integrate with logic |
| Switch IL / isolation | $R_f$ (ON), $C_j$ (OFF) | diode area: a bigger diode has lower $R_f$ but higher $C_j$ |
| Detector sensitivity | $I_s$, $R_s$, $C_j$, bias $I_0$ | $\beta_v$ formula below |

$$
\boxed{G_{max}(f)\le U(f)\approx\left(\frac{f_{max}}{f}\right)^2}\qquad\boxed{f_{max}\ \ge\ f\sqrt{G_{target}}\ \text{(bare minimum)}}
$$

$$
\boxed{\text{PAE} = \frac{P_{out}-P_{in}}{P_{DC}} = \eta\left(1-\frac1G\right)}
$$

> [!note]- Derivation: why $f_{max}$ caps gain, and PAE vs gain
> **Gain.** Mason's $U$ is the highest gain any lossless reciprocal embedding of the device can reach while staying unilateral, and it rolls off at 20 dB/decade above the device's internal poles ([[#f_max and Mason's Unilateral Gain U]]). So $U(f)\approx U(f_1)(f_1/f)^2$, which reaches 1 at $f_{max}$: $U(f)\approx(f_{max}/f)^2$. Requiring $U(f)\ge G_{target}$ gives $f_{max}\ge f\sqrt{G_{target}}$. Real amplifiers reach MAG, which sits below $U$, and matching networks lose some more, so treat this as a floor.
>
> **PAE.** $\eta = P_{out}/P_{DC}$ and $P_{in} = P_{out}/G$, so $\text{PAE} = (P_{out}-P_{out}/G)/P_{DC} = \eta(1-1/G)$. With 10 dB of gain PAE is 90% of $\eta$; with 3 dB it is half. A device run close to its $f_{max}$ wastes its drain efficiency on drive power.

> [!warning] Unverified
> The PA load-line rule $R_{opt}\approx(V_{DD}-V_{knee})^2/(2P_{out})$ is standard PA theory but is not in Pozar Ch. 11 or the binder; it is owned by [[RF Amplifier Design]]. Its device-level meaning: at 10 W a 28 V GaN device wants about $28^2/20\approx39\ \Omega$, almost 50 Ω already, while a 3.3 V CMOS device wants about $0.5\ \Omega$, a 100:1 impedance transformation with the loss and bandwidth penalty that brings. **High breakdown voltage buys easy matching as well as power.**

### Where each device spec lands in sizing

| Device spec | Knob | Notes |
|---|---|---|
| $f_T$ | gate length / base width (process), current density ($I_D/W$, $I_C/A_E$) | fixed by the process and the bias density, not by device size |
| $f_{max}$ | $f_T$, plus gate/base resistance (finger width, number of fingers, gate metal) | layout: many short fingers cut $R_g$, $r_b$ |
| $NF_{min}$ | technology, bias density | lowest-noise bias sits below the peak-$f_T$ bias |
| $P_{out}$ | periphery (total gate width / emitter area) × breakdown voltage | $I_{max}\propto W$; $V_{max}$ is fixed by the technology |
| Input/output impedance | periphery | bigger device → lower impedances, larger $C$ |

> [!tip] Remark
> For a CMOS device the $f_T$ and noise trade is exactly the $g_m/I_D$ trade: a lower $g_m/I_D$ (higher current density) means higher $f_T$ and more current. Use [[gm-ID Design Methodology]] lookup tables of $f_T$ vs $g_m/I_D$; don't re-derive it here.

### Worked example: pick a device for a 4 GHz LNA

**Spec:** NF < 1 dB, gain ≥ 10 dB at 4 GHz. All data from Pozar Tables 11.4–11.7; the $U$ and MSG values are computed from them.

1. **NF → technology.** Table 11.6: Si BJT 2.0 dB at 2 GHz fails. CMOS 1.0 dB at 4 GHz is marginal. SiGe HBT (0.6 dB at 8 GHz), GaAs MESFET (1.0 at 10) and GaAs HEMT (0.5 at 12) all pass with margin at 4 GHz.
2. **Gain → $f_{max}$.** 10 dB needs $f_{max}\ge 4\sqrt{10}\approx12.6$ GHz at the very least.
3. **Check candidates' data at 4 GHz:**

| Device (Pozar table, bias) | $\lvert S_{21}\rvert^2$ | MSG $=\lvert S_{21}/S_{12}\rvert$ | $U$ | $f_{max}\approx f\sqrt U$ |
|---|---|---|---|---|
| Si BJT NE58219 (Table 11.4, 5 V, 5 mA) | 0.8 dB | 4.6 dB | 10.5 dB | ≈13 GHz |
| SiGe HBT BFP640F (Table 11.5, 2 V, 1.2 mA) | 6.8 dB | 13.0 dB | 18.1 dB | ≈32 GHz |
| GaAs FET NE76184A (Table 11.7, 3 V, 10 mA) | 9.3 dB | 13.8 dB | 24.4 dB | ≈50–65 GHz |

4. **Decision.** The Si BJT fails both NF and gain (MSG 4.6 dB). The SiGe HBT and GaAs FET both pass. The SiGe HBT wins on cost and single supply; the GaAs FET has more gain headroom. Size and bias come next, from the noise parameters ([[RF Noise and Distortion]]) and the gain/stability design ([[RF Amplifier Design]]).

## Level 0: The Device Menu

| Device | Semiconductor | Freq. range (GHz) | Typical gain (dB) | NF (dB) at (GHz) | Power | Cost | Single-polarity supply |
|---|---|---|---|---|---|---|---|
| BJT | Si | 10 | 10–15 | 2.0 (2) | High | Low | Yes |
| HBT | SiGe | 30 | 10–15 | 0.6 (8) | Medium | Medium | Yes |
| CMOS | Si | 20 | 10–20 | 1.0 (4) | Low | Low | Yes |
| MESFET | GaAs | 60 | 5–20 | 1.0 (10) | Medium | Medium | No |
| HEMT | GaAs | 100 | 10–20 | 0.5 (12) | Medium | High | No |
| HEMT | GaN | 10 | 10–15 | 1.6 (6) | High | Medium | No |

*Pozar Table 11.6.* Read the last row as "needs a negative gate supply": depletion-mode FETs are on at $V_{GS}=0$ (Pozar Fig. 11.22) and need $V_G<0$, $V_D>0$ (binder p. 162).

The binder's one-line roles (p. 164): **BJT**: low noise, linear power amplification, power applications. **GaAs FET**: very low noise, low power. **HEMT**: very high frequency ($f>20$ GHz).

| Job | Device | Why |
|---|---|---|
| Power detector, AGC, RSSI, SWR indicator | Schottky diode | square law, fast, small $C_j$ |
| Mixer | Schottky diode, FET | $v^2$ term; see [[Mixers and Microwave Oscillators]] |
| Switch, attenuator, limiter, phase shifter | PIN diode, FET, MEMS | bias-controlled $R$ / $C$ |
| Electronic tuning, frequency multiplier | varactor | bias-controlled $C$, nonlinear $C(V)$ |
| mm-wave source | Gunn, IMPATT | negative resistance |
| LNA | GaAs HEMT/MESFET, SiGe HBT, CMOS | lowest $NF_{min}$ |
| PA | GaN HEMT, LDMOS, Si BJT, GaAs HBT | breakdown × current |
| Low-phase-noise oscillator | Si BJT | very low $1/f$ noise (Pozar) |

## Level 1: RF Diodes

### Schottky Detectors

```tikz title="Left: RF Schottky equivalent circuit, with package L_s, C_p, spreading resistance R_s, and bias-dependent R_j, C_j. Right: detector output vs input power, square law between the noise floor and saturation. After Pozar Figs. 11.3 and 11.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} node[left] {$+$} to[L,l=$L_s$] (2,2) to[R,l=$R_s$] (4,2) -- (5.4,2);
  \draw (0,0) node[ocirc]{} node[left] {$-$} -- (5.4,0);
  \draw (1.4,2) to[C,l_=$C_p$,*-*] (1.4,0);
  \draw (4,2) to[R,l_=$R_j(V)$,*-*] (4,0);
  \draw (5.4,2) to[C,l=$C_j(V)$] (5.4,0);
  \begin{scope}[xshift=8cm,yshift=-0.6cm]
    \draw[->] (0,0) -- (6.2,0) node[right] {$P_{in}$ (dBm)};
    \draw[->] (0,0) -- (0,4.2) node[above] {$\log v_{out}$};
    \draw[dashed] (0,0.5) -- (5.8,0.5) node[above left,font=\scriptsize] {noise level};
    \draw[very thick] plot[smooth] coordinates {(0,0.52) (0.6,0.6) (1.0,0.8) (1.5,1.25)};
    \draw[very thick] (1.5,1.25) -- (3.6,3.05);
    \draw[very thick] plot[smooth] coordinates {(3.6,3.05) (4.2,3.4) (5.0,3.6) (5.8,3.68)};
    \draw[<->] (1.5,-0.35) -- (3.6,-0.35) node[midway,below,font=\scriptsize] {square law: $v_{out}\propto v_0^2\propto P_{in}$};
    \node[font=\scriptsize,anchor=west] at (2.6,1.9) {slope 1 dB/dB};
    \node[font=\scriptsize] at (5.0,4.0) {saturation};
    \foreach \p/\x in {-40/0.3,-20/1.95,0/3.6,20/5.25} { \draw (\x,0.08) -- (\x,-0.08); }
    \node[font=\scriptsize,below] at (0.3,-0.05) {$-40$};
    \node[font=\scriptsize,below] at (5.25,-0.05) {$20$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\beta_i = \frac{\Delta I_{dc}}{P_{in}} = \frac{G_d'}{2G_d} = \frac{\alpha}{2}\ \ \text{A/W},\qquad \beta_v = \beta_i R_j}
$$

- **Current sensitivity** $\beta_i$: DC current change per watt of RF input. Ideally $\alpha/2\approx 20$ A/W at 290 K, independent of bias. **Open-circuit voltage sensitivity** $\beta_v$: the DC voltage across $R_j$. Typical values: **400–1500 mV/mW** (Pozar Eqs. 11.9–11.10).
- **Square-law region.** For an AM input $v_0(1+m\cos\omega_mt)\cos\omega_0t$ the baseband output at $\omega_m$ has amplitude $mv_0^2G_d'/2$: proportional to *power*. This is what lets SWR meters, power monitors and signal-strength indicators read power from a voltage. Too high an input and the output saturates (linear, then constant); too low and the signal is lost in the noise (Pozar Fig. 11.5).
- **Bias** is optional: zero-bias diodes exist; a small DC bias moves the operating point "to the one that provides the best sensitivity" (Pozar).

| Diode (Pozar Table 11.1) | $I_s$ (A) | $R_s$ (Ω) | $C_j$ (pF) | $L_s$ (nH) | $C_p$ (pF) |
|---|---|---|---|---|---|
| Skyworks SMS1546 | $3\times10^{-7}$ | 4 | 0.38 | 1.0 | 0.07 |
| Skyworks SMS7630 | $5\times10^{-6}$ | 20 | 0.14 | 0.05 | 0.005 |
| Avago HSMS2800 | $3\times10^{-8}$ | 30 | 1.6 | — | — |
| Macom MA4E2054 | $3\times10^{-8}$ | 11 | 0.1 | — | 0.11 |

At GHz the junction parasitics steal RF voltage from $R_j$:

$$
\boxed{\beta_v(\omega) = \frac{(\alpha/2)\,R_j}{1+R_s/R_j+\omega^2C_j^2R_sR_j}},\qquad R_j = \frac{1}{\alpha(I_0+I_s)}
$$

> [!note]- Derivation: sensitivity with $R_s$ and $C_j$ (from Pozar Fig. 11.3, ignoring $L_s$, $C_p$)
> Drive the diode with RF current $I$. With $x = \omega C_jR_j$, the junction voltage is $v_j = IR_j/(1+jx)$, so $|v_j|^2 = |I|^2R_j^2/(1+x^2)$.
>
> The input power goes into $R_s$ and into the real part of $R_j\parallel C_j$:
> $$P_{in} = \tfrac12|I|^2\left[R_s + \frac{R_j}{1+x^2}\right]$$
> The rectified current is $|v_j|^2G_d'/4 = |v_j|^2\alpha/(4R_j)$. Divide:
> $$\beta_i = \frac{\alpha R_j/(4(1+x^2))}{\tfrac12\left[R_s+R_j/(1+x^2)\right]} = \frac{\alpha/2}{1+R_s/R_j+\omega^2C_j^2R_sR_j}$$
> At low frequency and $R_s\to0$ this is Pozar's $\alpha/2$. This derivation is ours, not Pozar's, and it neglects the package elements.

**Worked example (Pozar Prob. 11.1, our solution).** SMS1546 at 10 GHz: $C_j=0.38$ pF, $R_s=4\ \Omega$, $I_s=0.3$ µA, $\alpha=1/25$ mV.

| $I_0$ | $R_j$ | $\beta_v$ at DC | $\beta_v$ at 10 GHz |
|---|---|---|---|
| 0 | 83 kΩ | 1.7 MV/W | 8.7 mV/µW (8700 mV/mW) |
| 20 µA | 1.23 kΩ | 24.6 kV/W | 6.5 mV/µW |
| 50 µA | 497 Ω | 9.9 kV/W | 4.6 mV/µW |

- At 10 GHz the $\omega^2C_j^2R_sR_j$ term dominates, so the sensitivity saturates near $\alpha/(2\omega^2C_j^2R_s)$: **$R_sC_j^2$ is the detector's figure of merit**.
- Bias costs sensitivity in this model but drops the video resistance from 83 kΩ to about 1 kΩ, so the output can drive a real load. Into a video load $R_L$ the output is $\beta_i(R_j\parallel R_L)$, which is why biased detectors exist. These numbers are open-circuit and ignore $L_s$/$C_p$, so they sit above Pozar's typical 400–1500 mV/mW.

> [!tip] Remark
> The same $v^2G_d'/2$ term, driven by two tones (RF and LO), is a mixer. Diode mixers belong to [[Mixers and Microwave Oscillators]]. Unwanted, the same curvature is the second-order distortion of [[Nonlinearity and Mismatch]].

> [!note]- Detail: the full spectrum of a detected AM signal (Pozar Eq. 11.12, Table 11.2)
> The linear term $v_0G_d$ gives $\omega_0$ and $\omega_0\pm\omega_m$. The square term $v_0^2G_d'/2$ gives, with relative amplitudes:
>
> | Frequency | Relative amplitude |
> |---|---|
> | 0 | $1+m^2/2$ |
> | $\omega_m$ | $2m$ |
> | $2\omega_m$ | $m^2/2$ |
> | $2\omega_0$ | $1+m^2/2$ |
> | $2\omega_0\pm\omega_m$ | $m$ |
> | $2(\omega_0\pm\omega_m)$ | $m^2/4$ |
>
> A low-pass filter keeps the $\omega_m$ term. The $2\omega_m$ term is the detector's own distortion of the envelope: relative to the wanted term it is $m/4$.

> [!note]- Detail: the spectrum analyzer is a swept detector (Pozar Point of Interest, §11.1)
> YIG-tuned preselector → mixer with a swept YIG LO → IF filter (the resolution bandwidth, about 100 Hz to 1 MHz) → log IF amplifier → detector → video amp → display. The YIG filter tracks the LO and rejects spurious mixing products; the log amplifier gives the wide display dynamic range.

### PIN Diodes as Switches and Attenuators

```tikz title="PIN diode states (left) and the two single-pole switches (right). In the series switch the diode is ON when forward biased; in the shunt switch the line is ON when the diode is reverse biased. Bias goes in through RF chokes and is kept off the RF path by DC blocks. After Pozar Figs. 11.6 and 11.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3.2) node[ocirc]{} to[L,l=$L_i$] (2,3.2) to[C,l=$C_j$] (2,1.6) to[R,l_=$R_r$] (0,1.6) node[ocirc]{};
  \node[font=\scriptsize] at (1,0.9) {reverse: $Z_r$};
  \draw (0,0.2) node[ocirc]{} to[L,l=$L_i$] (2,0.2) -- (2,-1.4) to[R,l_=$R_f$] (0,-1.4) node[ocirc]{};
  \node[font=\scriptsize] at (1,-2.1) {forward: $Z_f$};
  \begin{scope}[xshift=4cm,yshift=0.6cm]
    \draw (0,1.2) node[ocirc]{} node[left] {$Z_0$} to[C,l=DC blk] (1.6,1.2) to[D,*-*] (3.2,1.2) to[C,l=DC blk] (4.8,1.2) node[ocirc]{} node[right] {$Z_0$};
    \draw (1.6,1.2) -- (1.6,2.0) to[L,l_=RFC] (1.6,3.0) node[above] {bias};
    \draw (3.2,1.2) to[L,l=RFC] (3.2,-0.2) node[ground]{};
    \node[font=\scriptsize] at (2.4,-0.9) {series};
  \end{scope}
  \begin{scope}[xshift=10.2cm,yshift=0.6cm]
    \draw (0,1.2) node[ocirc]{} node[left] {$Z_0$} to[C,l=DC blk] (1.6,1.2) -- (2.4,1.2) to[C,l=DC blk] (4.0,1.2) node[ocirc]{} node[right] {$Z_0$};
    \draw (2.4,1.2) to[D,*-] (2.4,-0.2) node[ground]{};
    \draw (1.6,1.2) to[L,l_=RFC,*-] (1.6,3.0) node[above] {bias};
    \node[font=\scriptsize] at (2.4,-0.9) {shunt};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_d = \begin{cases} Z_r = R_r + j(\omega L_i - 1/\omega C_j) & \text{reverse}\\ Z_f = R_f + j\omega L_i & \text{forward}\end{cases}}
$$

$$
\boxed{\text{IL}_{series} = -20\log\left|\frac{2Z_0}{2Z_0+Z_d}\right|,\qquad \text{IL}_{shunt} = -20\log\left|\frac{2Z_d}{2Z_d+Z_0}\right|}
$$

- IL compares the load voltage with what it would be with the switch absent (Pozar Eq. 11.13). Typical values: $L_i<1$ nH, forward bias 10–30 mA, reverse bias 10–60 V. $R_r$ is usually negligible next to $1/\omega C_j$.
- **The diode's figure of merit is $R_f$ and $C_j$**: $R_f$ sets the ON loss (series) or the OFF isolation (shunt); $C_j$ sets the OFF isolation (series) or the ON loss (shunt).
- **Shunt usually wins:** a shunt diode is easier to heat-sink, and in Pozar's example it gives both lower ON loss and more isolation.
- **Tune out the parasitic.** A series or parallel reactance (for example an open stub across the diode) resonates $C_j$ or $L_i$ away and improves IL, at the cost of bandwidth.
- Bias goes through RF chokes (or high-impedance $\lambda/4$ lines) and is kept out of the RF path by DC blocks.

| PIN diode (Pozar Table 11.3) | $R_f$ (Ω) | $C_j$ (pF) |
|---|---|---|
| ASI 8001 | 3.0 | 0.03 |
| Skyworks DSG9500 | 4.0 | 0.025 |
| Infineon BA592 | 0.36 | 1.4 |
| Microsemi UM9605 | 1.5 | 0.5 |

**Worked example (Pozar Ex. 11.1).** UM9605 at 1.8 GHz, $C_j=0.5$ pF, $R_f=1.5\ \Omega$, $L_i=0.5$ nH, $R_r=2\ \Omega$, $Z_0=50\ \Omega$:
$Z_r = 2.0-j171.2\ \Omega$, $Z_f = 1.5+j5.6\ \Omega$.

| | ON IL | OFF IL |
|---|---|---|
| Series | 0.14 dB | 6.0 dB |
| Shunt | 0.11 dB | **13.3 dB** |

Shunt gives more ON/OFF contrast and lower ON loss. The series switch's poor isolation comes from $|Z_r| = 171\ \Omega$ being only about $3.4Z_0$ at 1.8 GHz.

More from Pozar's problems (answers in the back): Prob. 11.2, a BA592 shunt switch at 4 GHz with an open stub resonating the diode: ON 0.42 dB, OFF 11.4 dB. Prob. 11.3, a series + shunt pair at 6 GHz: ON 0.044 dB, OFF 18.6 dB.

- **Multi-throw.** An SPDT uses two diodes, one ON and one OFF. The shunt version needs $\lambda/4$ lines so that the shorted (OFF) arm looks open at the junction, which limits bandwidth (Pozar Fig. 11.9).
- **Other uses** of the same bias-controlled impedance: power limiters, modulators, and variable attenuators (Pozar).

> [!tip] Remark
> The ON-state shunt diode is a short on the line; a $\lambda/4$ line turns it into an open at the junction. That is the quarter-wave transformer from [[Transmission Lines]].

> [!note]- Derivation: series and shunt IL (Pozar Fig. 11.8)
> Source $2V_0$ with $Z_0$, load $Z_0$; without the switch $V_L = V_0$.
>
> **Series:** $V_L = 2V_0Z_0/(2Z_0+Z_d)$, so $V_L/V_0 = 2Z_0/(2Z_0+Z_d)$.
>
> **Shunt:** the load sees $Z_d\parallel Z_0$; $V_L = 2V_0\,\frac{Z_dZ_0/(Z_d+Z_0)}{Z_0+Z_dZ_0/(Z_d+Z_0)} = 2V_0\frac{Z_d}{2Z_d+Z_0}$.

### PIN Phase Shifters

```tikz title="Switched-line (left): two SPDTs pick one of two line lengths. Loaded-line (right): two switched shunt susceptances jB spaced by lambda/4 so their reflections cancel. After Pozar Figs. 11.11 and 11.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1) node[left] {In} -- (0.8,1);
  \draw[fill=gray!15] (0.8,0.6) rectangle (1.6,1.4) node[midway,font=\scriptsize] {SPDT};
  \draw[fill=gray!15] (4.4,0.6) rectangle (5.2,1.4) node[midway,font=\scriptsize] {SPDT};
  \draw (5.2,1) -- (6,1) node[right] {Out};
  \draw (1.6,1.25) -- (1.9,1.25) -- (1.9,2.0) -- (4.1,2.0) node[midway,above,font=\scriptsize] {$\ell_2$} -- (4.1,1.25) -- (4.4,1.25);
  \draw (1.6,0.75) -- (2.2,0.75) -- (3.8,0.75) node[midway,below,font=\scriptsize] {$\ell_1$} -- (4.4,0.75);
  \node[font=\scriptsize] at (3,-0.2) {$\Delta\phi = \beta(\ell_2-\ell_1)$: true time delay};
  \begin{scope}[xshift=8.4cm]
    \draw (0,1.6) node[left] {$Z_0$} -- (1,1.6) to[TL,l={$Z_0$, $\lambda/4$}] (4,1.6) -- (5,1.6) node[right] {$Z_0$};
    \draw (0,0) -- (5,0);
    \draw (1,1.6) to[generic, l_=$jB$,*-*] (1,0);
    \draw (4,1.6) to[generic, l=$jB$,*-*] (4,0);
    \node[font=\scriptsize] at (2.5,-0.6) {$\equiv$ line of $\theta_e$, $Z_e$};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Type | Phase shift | Notes |
|---|---|---|
| **Switched-line** | $\Delta\phi = \beta(\ell_2-\ell_1)$ | linear in $f$ for TEM lines: true time delay, wideband, reciprocal. Watch for resonance of the OFF line near $\ell = n\lambda/2$ (shifted by the diode $C_j$). |
| **Loaded-line** | $\Delta\phi = \tan^{-1}(b/2)$ for one shunt load | for small shifts (≤45°). Two loads $\lambda/4$ apart cancel reflections: $\cos\theta_e = -b$, $Z_e = Z_0/\sqrt{1-b^2}$; for small $b$, $\theta_e\approx\pi/2+b$, $Z_e\approx Z_0(1+b^2/2)$. |
| **Reflection** | path length of the reflected wave changes by $\Delta\phi$ | quadrature hybrid with two identical diode terminations. Best bandwidth when the two states' reflection coefficients are conjugates (for 90°, use $\phi=45°$). |

$b = BZ_0$. Bits are binary: 180°, 90°, 45°, … Diode phase shifters are small, fast and planar but need continuous bias current, whereas a latching ferrite needs only a pulse (Pozar).

> [!tip] Remark
> The reflection type is the quadrature hybrid from [[Power Dividers and Couplers#Branch-Line Coupler]] with two equal reflective loads: their reflections recombine at the isolated port. The loaded-line equivalence comes from multiplying ABCD matrices ([[Microwave Network Analysis#ABCD Parameters]]).

> [!note]- Derivation: loaded-line phase shift (Pozar Eqs. 11.17–11.21)
> **One shunt load** $jB$ on a matched line: $\Gamma = -jb/(2+jb)$, $T = 1+\Gamma = 2/(2+jb)$, so $\angle T = -\tan^{-1}(b/2)$. Larger $b$ means more phase but also more reflection, so more insertion loss.
>
> **Two loads $\lambda/4$ apart:**
> $$\begin{bmatrix}1&0\\jB&1\end{bmatrix}\begin{bmatrix}0&jZ_0\\j/Z_0&0\end{bmatrix}\begin{bmatrix}1&0\\jB&1\end{bmatrix} = \begin{bmatrix}-BZ_0 & jZ_0\\ j(1/Z_0-B^2Z_0) & -BZ_0\end{bmatrix}$$
> Match it to a line $\begin{bmatrix}\cos\theta_e & jZ_e\sin\theta_e\\ j\sin\theta_e/Z_e & \cos\theta_e\end{bmatrix}$: $\cos\theta_e = -b$ and $Z_e = Z_0/\sqrt{1-b^2}$. Switching $B$ between two values switches $\theta_e$, so the phase changes while the match stays close to $Z_0$.

### Varactors at Microwave

```tikz title="Reverse-biased varactor: bias-dependent C_j in series with R_s; Q = 1/(omega R_s C_j). After Pozar Fig. 11.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,1.5) node[ocirc]{} node[left] {$+$} to[R,l=$R_s$] (2.4,1.5) to[C,l=$C_j(V)$] (2.4,0) -- (0,0) node[ocirc]{} node[left] {$-$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.4,0.75) {$R_s$: a few $\Omega$\\GaAs: $C_j\approx0.1$--$2.0$ pF\\for $V=-20$ to $0$ V};
\end{circuitikz}
\end{document}
```

$$
\boxed{C_j(V) = \frac{C_0}{(1-V/V_0)^\gamma},\qquad Q = \frac{1}{\omega R_sC_j}}
$$

- $V<0$ (reverse bias). $V_0 = 0.5$ V for Si, 1.3 V for GaAs. Si for RF, **GaAs for microwave** (Pozar).
- $\gamma$ depends on the doping profile; many practical diodes have $\gamma\approx0.47$, some reach 1.5–2.0. A typical GaAs varactor has $C_0 = 0.5$–2.0 pF.
- **Uses:** electronic tuning of a receiver LO (cellular, WLAN, TV) by sitting in an oscillator's resonator; frequency multipliers, because $C(V)$ is nonlinear (Pozar).
- **$Q$ falls with frequency and with $C_j$**: the series $R_s$ limits tank $Q$ at microwave, so the varactor, not the inductor, often sets the oscillator's phase noise.
- Include the package parasitics in any real design (Pozar).

> [!warning] Correction to Pozar
> Pozar writes that "an ideal hyperabrupt varactor diode has $\gamma = 0.5$". $\gamma = 1/2$ is the **abrupt** junction; hyperabrupt profiles give $\gamma>1/2$, up to 2 for linear tuning ([[Diodes#Varactors C_j(V) as a Tuning Element]], Neamen Eqs. 7.62–7.66). His $\gamma\approx1.5$–2.0 diodes are the hyperabrupt ones.

> [!tip] Remark
> Tuning range, $K_{VCO}$ and the $C_{max}/C_{min}$ formula are in [[Diodes#Varactors C_j(V) as a Tuning Element]]; CMOS accumulation-mode varactors are in [[Capacitor#MOS Varactors and Junction Varactors]]. Only the microwave numbers are new here.

### Other Microwave Diodes

```tikz title="Gunn diode DC I-V: the negative-slope region is the operating point, a negative resistance that can turn DC into RF. IMPATT and tunnel diodes have similar curves. After Pozar Fig. 11.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6,0) node[right] {$V$};
  \draw[->] (0,0) -- (0,3.2) node[above] {$I$};
  \draw[very thick] plot[smooth] coordinates {(0,0) (1,1.9) (1.6,2.6) (2.1,2.7) (2.7,2.2) (3.6,1.6) (4.4,1.5) (5.6,1.9)};
  \draw[->] (3.9,2.7) -- (3.0,2.05);
  \node[font=\scriptsize,anchor=west] at (3.9,2.8) {negative differential resistance};
\end{circuitikz}
\end{document}
```

| Diode | Mechanism | Frequency | Power / efficiency | Notes |
|---|---|---|---|---|
| **Gunn** | transferred-electron effect in bulk GaAs or InP (no pn junction) | 1–200 GHz | up to several hundred mW CW, 5–15% | needs a high-$Q$ cavity; bias tuning ≤1%, add a varactor for more. Cheap traffic radar, door openers, alarms. |
| **IMPATT** | avalanche breakdown + transit time, PIN-like at 70–100 V | 10–300 GHz | Si: 10 W at 10 GHz to 1 W at 94 GHz (<10%); GaAs: 20 W at 10 GHz to 5 mW at 130 GHz; up to 15% | noisier than Gunn (high AM noise), more power and efficiency, better temperature stability; one of the few fundamental sources above 100 GHz. Heat limits it. |
| **Tunnel** | band-to-band tunnelling (Esaki, 1957) | high | low | reflection amplifier with $\lvert\Gamma\rvert>1$; obsolete for amplifiers, still used in some places |
| **BARITT** | barrier injection + transit time (a transistor with no base contact) | up to 94 GHz | below IMPATT | low AM noise: LOs, detectors, mixers |

All values Pozar §11.1. These matter mainly at mm-wave now; at RF and microwave, transistors do the job better.

> [!tip] Remark
> Turning a negative resistance into an oscillator (pick $R_L$, $X_L$ so that $Z_L = -Z_{in}$, and $R_L = R_0/3$ for maximum power) is owned by [[Mixers and Microwave Oscillators]] (binder pp. 375–401).

**Power combining.** When one device isn't enough, combine $N$ coherent, in-phase sources: at the device level (junctions paralleled over an electrically small area; only a few), the circuit level ($N$-way Wilkinson or resonant cavity, which can also lock the oscillators' phases), or spatially (an antenna array). In practice high-order modes and combiner loss cap the gain at about **10–20 dB** (Pozar). Combiners: [[Power Dividers and Couplers#PA Combining and LO Distribution]].

## Level 2: RF Transistor Families

### BJT and HBT

```tikz title="Simplified hybrid-pi model for a microwave BJT, common emitter. Dropping C_c makes S12 = 0 (unilateral). After Pozar Fig. 11.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,2.4) node[ocirc]{} node[left] {B} to[R,l=$R_b$] (2,2.4) -- (2.8,2.4);
  \draw (2.8,2.4) to[C,l=$C_c$] (6.4,2.4) -- (8,2.4) node[ocirc]{} node[right] {C};
  \draw (2.0,2.4) to[R,l_=$R_\pi$,*-*] (2.0,0);
  \draw (3.6,2.4) to[C,l=$C_\pi$,*-*] (3.6,0);
  \draw (6.4,2.4) to[cI,l=$g_mV_\pi$,*-*] (6.4,0);
  \draw (0,0) node[ocirc]{} -- (8,0) node[ocirc]{} node[right] {E};
  \node[font=\scriptsize] at (5.0,2.0) {$+$};
  \node[font=\scriptsize] at (5.0,1.2) {$V_\pi$};
  \node[font=\scriptsize] at (5.0,0.4) {$-$};
\end{circuitikz}
\end{document}
```

$$
\boxed{f_T = \frac{g_m}{2\pi C_\pi}\quad(\text{Pozar, with }C_c,\ R_b\text{ neglected})}
$$

- **Si BJT:** the oldest popular RF device: low cost, good frequency range, power and noise. Amplifiers to **2–10 GHz**, oscillators to about **20 GHz**. Very low $1/f$ noise suits **low-phase-noise oscillators**. Below about **2–4 GHz** it is often preferred to FETs for higher gain, lower cost and a single supply. It has **shot noise** as well as thermal noise, so its NF is worse than a FET's (Pozar §11.2).
- **Bias:** low $I_C$ for best noise figure, higher $I_C$ for best power gain (Pozar). Bias and decoupling: base divider and collector through RF chokes, emitter resistor bypassed (Pozar Fig. 11.19b; binder p. 163).
- **HBT** (GaAs, InP, SiGe base-emitter): same model and same use of measured S-parameters. Some HBTs exceed 100 GHz; **SiGe** gives low-cost monolithic integration at 60 GHz and above.
- **Noise sources** (binder p. 164): shot noise in the emitter-base junction and in the collector, and thermal noise in the base resistance. Reduce them by minimizing current across the pn junction and minimizing resistance, which in layout means **finger structures** for base and emitter.

> [!tip] Remark
> This is the same $f_T$ as [[BJTs#Unity-Gain Frequency f_T]] with $C_\mu$ dropped. That note owns why $f_T$ rises then falls with $I_C$ (Kirk effect) and the $4kT(r_b + 1/2g_m)$ noise model ([[BJTs#Noise]]). The finger layout cuts $r_b$ by the mechanism in [[BJTs#Base Resistance and Current Crowding]].

### MESFET

```tikz title="Cross sections. Left: n-channel GaAs MESFET, a Schottky gate on a thin n layer over semi-insulating GaAs. Right: HEMT, a doped n-GaAlAs layer feeding a 2-D electron gas at the undoped GaAs interface. After Pozar Figs. 11.20 and 11.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \fill[gray!15] (0,0) rectangle (6,1.6);
  \fill[cyan!20] (0,1.6) rectangle (6,2.1);
  \fill[green!35] (0.3,1.6) rectangle (1.6,2.1);
  \fill[green!35] (4.4,1.6) rectangle (5.7,2.1);
  \draw (0,0) rectangle (6,2.1);
  \fill[yellow!60!black] (0.5,2.1) rectangle (1.4,2.35);
  \fill[yellow!60!black] (4.6,2.1) rectangle (5.5,2.35);
  \fill[violet!60] (2.75,2.1) rectangle (3.25,2.45);
  \node[above] at (0.95,2.35) {S};
  \node[above] at (3,2.45) {G};
  \node[above] at (5.05,2.35) {D};
  \node[font=\scriptsize] at (0.95,1.85) {$n^+$};
  \node[font=\scriptsize] at (5.05,1.85) {$n^+$};
  \node[font=\scriptsize] at (3,1.85) {$n$ channel};
  \node[font=\scriptsize] at (3,0.8) {semi-insulating GaAs};
  \node[font=\scriptsize] at (3,-0.4) {MESFET};
  \begin{scope}[xshift=7.2cm]
    \fill[gray!15] (0,0) rectangle (6,0.9);
    \fill[gray!30] (0,0.9) rectangle (6,1.5);
    \fill[orange!25] (0,1.5) rectangle (6,1.7);
    \fill[orange!45] (0,1.7) rectangle (6,2.2);
    \fill[green!35] (0.3,1.5) rectangle (1.6,2.2);
    \fill[green!35] (4.4,1.5) rectangle (5.7,2.2);
    \draw (0,0) rectangle (6,2.2);
    \draw[very thick,dashed,blue] (1.6,1.5) -- (4.4,1.5);
    \fill[yellow!60!black] (0.5,2.2) rectangle (1.4,2.45);
    \fill[yellow!60!black] (4.6,2.2) rectangle (5.5,2.45);
    \fill[violet!60] (2.75,2.2) rectangle (3.25,2.55);
    \node[above] at (0.95,2.45) {S};
    \node[above] at (3,2.55) {G};
    \node[above] at (5.05,2.45) {D};
    \node[font=\scriptsize] at (3,1.95) {n-GaAlAs};
    \node[font=\scriptsize,anchor=west] at (6.1,1.75) {undoped GaAlAs};
    \draw[->] (6.1,1.75) -- (5.85,1.6);
    \node[font=\scriptsize] at (3,1.2) {undoped GaAs};
    \node[font=\scriptsize,blue,anchor=west] at (6.1,1.2) {2-DEG};
    \draw[blue,->] (6.1,1.2) -- (4.5,1.48);
    \node[font=\scriptsize] at (3,0.45) {GaAs substrate};
    \node[font=\scriptsize] at (0.95,1.85) {$n^+$};
    \node[font=\scriptsize] at (5.05,1.85) {$n^+$};
    \node[font=\scriptsize] at (3,-0.4) {HEMT};
  \end{scope}
\end{circuitikz}
\end{document}
```

- The GaAs MESFET made solid-state microwave amplifiers, oscillators and mixers practical, and it is often the device of choice for hybrid and monolithic circuits **above 10 GHz**: into mm-wave, up to 60 GHz or more (Pozar).
- **Depletion mode:** $V_{gs}$ runs from 0 down to about $-3$ V (Pozar Fig. 11.22), so it needs a **dual-polarity supply** ($V_G<0$, $V_D>0$) or a self-bias source resistor (binder p. 162: unipolar versions with $R_S$ or a source choke).
- **Low-noise bias: $I_D\approx15\%$ of $I_{DSS}$**; high-power circuits use more current (Pozar).

**Typical element values** (Pozar Fig. 11.21): $R_i = 7\ \Omega$, $R_{ds} = 400\ \Omega$, $C_{gs} = 0.3$ pF, $C_{ds} = 0.12$ pF, $C_{gd} = 0.01$ pF, $g_m = 40$ mS. So $f_T = g_m/2\pi C_{gs} = 21$ GHz.

### HEMT, pHEMT and GaN HEMT

- **GaAs HEMT:** above 100 GHz; **lowest noise figure of any active device** (0.5 dB at 12 GHz in Table 11.6). The layered structure is lattice-matched to cut thermal and mechanical stress. It is hard to make, so it is **expensive**. Same equivalent circuit and DC curves as the MESFET (Pozar).
- **pHEMT:** pseudomorphic, uses a deliberate lattice mismatch between layers (Pozar names it; no numbers).
- **GaN HEMT** (AlGaN/GaN on Si or SiC): **20–40 V drain**, up to **100 W** in the low microwave range. The high-power transmitter device (Pozar).

> [!warning] Unverified
> Pozar Table 11.8 (Cree CGH21120 GaN HEMT) prints "$V_{DD} = 328$ V". That is almost certainly a typo for 28 V, which is consistent with his 20–40 V range in the text. Treat the bias as 28 V.

> [!note]- Detail: what the GaN S-parameters say (Pozar Table 11.8, computed)
> $|S_{12}|$ is tiny (0.007–0.014), so MSG $=|S_{21}/S_{12}|$ is huge: 27 dB at 0.5 GHz, 21.7 dB at 2 GHz. $|S_{11}|\approx0.95$ at 180° means a very small input resistance: a large-periphery power device has a large $C_{gs}$, so its input is nearly a short. $U$ extrapolates to $f_{max}\approx 20$ GHz. This is a power device built for 2 GHz: plenty of gain at the carrier, and a hard input match.

### Si CMOS, LDMOS, RF-SOI and SiGe BiCMOS

- **Si MOSFET:** usable into UHF and up to several hundred watts when packaged in parallel. The insulated gate draws no DC bias current. Same equivalent circuit as the MESFET (Pozar §11.3).
- **LDMOS** (laterally diffused MOS): source grounded directly, high power at low microwave; **cellular base-station transmitters at 900 and 1900 MHz** (Pozar).
- **CMOS:** mature, low power, lowest unit cost, highest integration (Pozar). It is the only option that puts the radio on the same die as the digital baseband, which is why it wins consumer radios despite Table 11.6.
- **SiGe BiCMOS:** SiGe HBTs next to CMOS; low-cost mm-wave (Pozar §11.2).

> [!warning] Unverified
> RF-SOI is not in Pozar or the binder. In outline: CMOS built on a buried oxide over a high-resistivity handle wafer. Removing the conductive substrate cuts junction capacitance and substrate loss and lets FETs be stacked to share a large RF voltage, which makes it the usual technology for antenna switches. Check against a device reference before relying on details.

## Level 3: Equivalent Circuit and Figures of Merit

### Intrinsic and Extrinsic Equivalent Circuit

```tikz title="Microwave FET model, common source. The dashed box is the intrinsic device of Pozar Fig. 11.21 (also used for HEMTs and MOSFETs); outside it are the extrinsic contact/bond resistances and inductances that Pozar notes the package adds at each terminal."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (-2.6,3) node[ocirc]{} node[left] {G} to[L,l=$L_g$] (-1.2,3) to[R,l=$R_g$] (0.2,3) -- (1,3);
  \draw (1,3) to[C,l=$C_{gd}$] (4.6,3);
  \draw (1,3) to[R,l=$R_i$,*-] (1,1.6) to[C,l={$C_{gs}$, $V_c$}] (1,0.4);
  \draw (4.6,3) to[cI,l_=$g_mV_c$,*-*] (4.6,0.4);
  \draw (6.0,3) to[R,l=$R_{ds}$,*-*] (6.0,0.4);
  \draw (7.2,3) to[C,l=$C_{ds}$] (7.2,0.4);
  \draw (4.6,3) -- (7.2,3) to[R,l=$R_d$] (8.6,3) to[L,l=$L_d$] (10,3) node[ocirc]{} node[right] {D};
  \draw (1,0.4) -- (7.2,0.4);
  \draw (4.1,0.4) to[R,l=$R_s$,*-] (4.1,-1.0) to[L,l=$L_s$] (4.1,-2.2) node[ocirc]{} node[below] {S};
  \draw[dashed] (0.5,-0.1) rectangle (7.7,3.6);
  \node[font=\scriptsize,anchor=south west] at (0.5,3.6) {intrinsic};
\end{circuitikz}
\end{document}
```

- **Intrinsic:** $g_m$ is controlled by the voltage *across $C_{gs}$* ($V_c$), not by the gate terminal voltage, which is why $|S_{21}|>1$. The only reverse path is $C_{gd}$; if it is small enough to ignore, $S_{12}=0$ and the device is unilateral (Pozar).
- **Extrinsic:** ohmic contacts and bond wires add a series $R$ and $L$ at every terminal (Pozar). Each matters for something different:
  - $R_g$ sets $f_{max}$ and adds gate thermal noise.
  - $R_s$ degenerates $g_m$.
  - $L_s$ feeds output current back to the input. It is the source-degeneration inductor of the inductively degenerated LNA, and an unwanted common lead in a PA.
- **When to stop using the model.** If the element values change with bias, load or frequency, the equivalent circuit stops being useful. Then treat the device as a two-port and use **measured S-parameters at your bias**, which the manufacturer supplies (Pozar §11.2).

> [!tip] Remark
> Common-source and common-emitter S-parameters are just a two-port; converting to $Y$ or $h$ to read device quantities uses [[Microwave Network Analysis#Two-Port Parameter Conversions]]. Stripping the package or the probe pads off measured data is [[Microwave Network Analysis#De-embedding]].

> [!note]- Derivation: S-parameters of the unilateral FET model (Pozar Prob. 11.6)
> With $C_{gd} = 0$: $Z_{11} = R_i - j/\omega C_{gs}$ and $Z_{22} = (1/R_{ds}+j\omega C_{ds})^{-1}$.
>
> Port 1 with incident wave $V_1^+$ sees open-circuit drive $2V_1^+$ through $Z_0$, so $I_g = 2V_1^+/(Z_{11}+Z_0)$ and $V_c = I_g/j\omega C_{gs}$. The current $g_mV_c$ flows into $Z_{22}\parallel Z_0$:
> $$S_{11} = \frac{Z_{11}-Z_0}{Z_{11}+Z_0},\quad S_{22} = \frac{Z_{22}-Z_0}{Z_{22}+Z_0},\quad S_{12}=0,\quad S_{21} = \frac{2jZ_0Z_{22}\,g_m/\omega C_{gs}}{(Z_{11}+Z_0)(Z_{22}+Z_0)}$$
> (Pozar prints $S_{21}$ without the $Z_{22}$ factor; it is needed for the units, and the numerical answer to Prob. 11.7 only comes out with it.)

### f_T

$$
\boxed{f_T = \frac{g_m}{2\pi C_{gs}}\ \ (\text{FET}),\qquad f_T = \frac{g_m}{2\pi C_\pi}\ \ (\text{BJT}),\qquad |h_{21}(f)|\approx\frac{f_T}{f}}
$$

The short-circuit current gain $|h_{21}|$ falls at 20 dB/decade and crosses 1 at $f_T$. To **read $f_T$ off data**, compute $|h_{21}|$ from the S-parameters at a frequency on the 20 dB/dec slope and multiply by $f$.

$f_T$ is a *current*-gain limit with the output shorted. It ignores $R_g$/$r_b$, and an RF amplifier is driven and loaded with matched impedances, not current sources and shorts. Power gain needs $f_{max}$.

### f_max and Mason's Unilateral Gain U

```tikz title="Two gain roll-offs of one device: |h21|^2 hits 0 dB at f_T, Mason's U hits 0 dB at f_max; both fall 20 dB/decade. MSG/MAG sits under U. The dots are U computed from Pozar's NE76184A data (Table 11.7)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x = 3*log10(f/1GHz); 1 GHz->0, 10->3, 100->6. y = dB/8
  \draw[->] (0,0) -- (7,0) node[right] {$f$ (GHz, log)};
  \draw[->] (0,0) -- (0,4.6) node[above] {gain (dB)};
  \foreach \f/\x in {1/0,10/3,100/6} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {\f}; }
  \foreach \g in {10,20,30} { \draw (0.08,{\g/8}) -- (-0.08,{\g/8}) node[left,font=\scriptsize] {\g}; }
  \node[left,font=\scriptsize] at (0,0) {0};
  % U line through fmax=60 GHz: x=3*1.778=5.33 ; slope 20 dB/dec = 2.5 units/3 x-units
  \draw[very thick] (0.5,{(5.33-0.5)*20/(3*8)}) -- (5.33,0) node[below,font=\scriptsize] {$f_{max}$};
  \node[font=\scriptsize,anchor=west] at (2.0,3.4) {$U$};
  % h21^2 through fT=12 GHz: x=3*1.079=3.24
  \draw[very thick,dashed] (0.5,{(3.24-0.5)*20/(3*8)}) -- (3.24,0) node[above right,font=\scriptsize] {$f_T$};
  \node[font=\scriptsize,anchor=east] at (1.2,1.2) {$|h_{21}|^2$};
  \foreach \f/\u in {4/24.4,8/18.3,12/12.5} { \fill ({3*log10(\f)},{\u/8}) circle (2pt); }
  \draw[thin] plot[smooth] coordinates {(0.9,{16.5/8}) (1.81,{13.8/8}) (2.71,{10.6/8}) (3.24,{7.2/8})};
  \node[font=\scriptsize,anchor=west] at (0.7,2.4) {MSG/MAG};
  \node[font=\scriptsize,align=left,anchor=west] at (4.2,3.8) {$-20$ dB/dec:\\$U\approx(f_{max}/f)^2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{U = \frac{\left|S_{21}/S_{12}-1\right|^2}{2K\left|S_{21}/S_{12}\right| - 2\,\mathrm{Re}\left(S_{21}/S_{12}\right)} = \frac{|y_{21}-y_{12}|^2}{4\left(g_{11}g_{22}-g_{12}g_{21}\right)},\qquad U(f_{max}) = 1}
$$

$$
\boxed{f_{max}\approx\frac{f_T}{2}\sqrt{\frac{R_{ds}}{R_g+R_i+R_s}}\ \ (\text{FET}, C_{gd}\to0),\qquad f_{max}\approx\frac{f_T}{2\sqrt{(R_g+R_i+R_s)/R_{ds}+2\pi f_TR_gC_{gd}}}}
$$

$$
\boxed{f_{max}\approx\sqrt{\frac{f_T}{8\pi r_bC_\mu}}\ \ (\text{BJT})}
$$

($K$ is the Rollett stability factor, $g_{ij} = \mathrm{Re}\,y_{ij}$.)

- **$U$ is the device's own power-gain figure of merit**: the gain after neutralizing the feedback ($S_{12}$) with a lossless reciprocal network and conjugate-matching both ports. It doesn't change under any lossless reciprocal embedding (Mason), so it is a property of the device, not of the circuit.
- **$f_{max}$ is the highest frequency at which the device can have power gain**, so it is the upper limit for an oscillator.
- **$f_{max}$ depends on $R_g$/$r_b$ and $C_{gd}$/$C_\mu$** where $f_T$ does not. That is why layout (gate fingers, emitter stripes) and gate metal show up in $f_{max}$. A device can have $f_{max}>f_T$ (low $R_g$, high $R_{ds}$) or $f_{max}<f_T$ (high $R_g$).

> [!warning] Unverified
> Mason's $U$ and the $f_{max}$ formulas are **not in Pozar Ch. 11 or the ECE 373 binder**. They are standard results (S. J. Mason, 1954; the FET and BJT $f_{max}$ forms are textbook approximations). I checked them numerically. On Pozar's typical MESFET values ($R_i = 7\ \Omega$, $R_{ds} = 400\ \Omega$, $C_{gs} = 0.3$ pF, $g_m = 40$ mS), sweeping $U$ from the $y$-parameters gives $f_{max} = 80.2$ GHz, against 80.2 GHz from the first formula. Adding $R_g = 2/5/10\ \Omega$ with $C_{gd} = 0.01$ pF gives 66.0/54.3/43.9 GHz against the second formula's 66.9/55.4/44.9. A hybrid-π with $r_b = 20\ \Omega$, $C_\mu = 0.05$ pF and $f_T = 5.26$ GHz gives 14.0 GHz against the BJT formula's 14.5. Confirm them against an RF device text before quoting them as sourced.

> [!important] Don't confuse the two U's
> This $U$ is Mason's unilateral **gain**: you want it large. Pozar's **unilateral figure of merit** $U$ (Eq. 12.46) is an error bound on assuming $S_{12}=0$ that you want small. Same letter, unrelated quantities; that one is owned by [[RF Amplifier Design#Unilateral Figure of Merit]].

> [!note]- Derivation: why $f_{max}\approx\frac{f_T}{2}\sqrt{R_{ds}/R_{in}}$ (intrinsic FET, $C_{gd}=0$)
> Conjugate-match both ports of the unilateral model. At $f\ll$ the $R_iC_{gs}$ corner, the input is $R_{in} = R_g+R_i+R_s$ in series with $C_{gs}$. With an input current $I$, the available input power is $\frac12|I|^2R_{in}$. The controlled current is $g_mV_c = g_mI/(j\omega C_{gs})$, so $|g_mV_c| = |I|\,\omega_T/\omega$. Into a conjugate-matched output ($R_{ds}$ in parallel with an equal load) the power is $\frac18|g_mV_c|^2R_{ds}$. The ratio is
> $$U = \frac{(\omega_T/\omega)^2R_{ds}}{4R_{in}}\;\Rightarrow\;U = 1\text{ at } f_{max} = \frac{f_T}{2}\sqrt{\frac{R_{ds}}{R_{in}}}$$
> This also shows the $1/f^2$ roll-off of $U$. A $C_{gd}$ seen through $R_g$ adds feedback that loads the input, giving the second term under the root.

### Reading S-Parameter Device Data

Pozar's tables are the format of every datasheet: common-emitter/source S-parameters, magnitude∠angle, at **one stated bias**, from 0.1 GHz up.

**Pozar Table 11.7: NEC NE76184A GaAs FET, $V_{DS}=3$ V, $I_D=10$ mA, common source**

| $f$ (GHz) | $S_{11}$ | $S_{12}$ | $S_{21}$ | $S_{22}$ |
|---|---|---|---|---|
| 1.0 | 0.97∠−28° | 0.04∠72° | 3.82∠154° | 0.70∠−19° |
| 2.0 | 0.90∠−55° | 0.08∠54° | 3.56∠129° | 0.65∠−37° |
| 4.0 | 0.72∠−103° | 0.12∠28° | 2.91∠86° | 0.53∠−68° |
| 8.0 | 0.52∠179° | 0.14∠−1° | 2.0∠20° | 0.42∠−129° |
| 12.0 | 0.49∠103° | 0.17∠−19° | 1.5∠−38° | 0.44∠170° |

**Checklist: what to read off a device table**

1. **Bias and configuration.** The data hold only at that $V$, $I$ and in that configuration. Redesign means new data.
2. **$|S_{21}|^2$** is the gain in a 50 Ω system with no matching. Here 11.6 dB at 1 GHz falling to 3.5 dB at 12 GHz. The BJT of Table 11.4 falls much faster (12.7 → 1.1 from 0.1 to 4 GHz) than the SiGe HBT of Table 11.5 (Pozar).
3. **$|S_{12}|$** small (≤0.17 here) → roughly unilateral. Check with the unilateral figure of merit before dropping it ([[RF Amplifier Design#Unilateral Figure of Merit]]).
4. **$|S_{11}|$, $|S_{22}|$** large → **large mismatch at both ports**: matching networks are where the gain comes from. $S_{11}$ circling *clockwise* from near $1\angle0°$ is a capacitive input ($C_{gs}$) plus series resistance ($R_i$).
5. **MSG $=|S_{21}/S_{12}|$** is a quick gain ceiling, and $K$ tells you whether MAG exists ($K>1$). Here $K<1$ up to about 8 GHz: **potentially unstable** where the gain is largest, the usual situation ([[RF Amplifier Design]]).
6. **Extract $f_T$ and $f_{max}$** from $|h_{21}|\cdot f$ and $f\sqrt{U}$, using frequencies on the 20 dB/dec slope.
7. **Noise parameters** $F_{min}$, $\Gamma_{opt}$, $R_n$ are a separate table (binder p. 241: "given by manufacturer or can be measured"). They are owned by [[RF Noise and Distortion]].

**Worked example 1: equivalent circuit from S-parameters (Pozar Prob. 11.7).** Fit the unilateral model of Fig. 11.21 to Table 11.7 at 2 GHz, ignoring $S_{12}$:
1. $Z_{11} = Z_0\frac{1+S_{11}}{1-S_{11}}$ → $R_i = \mathrm{Re}\,Z_{11} = 12.2\ \Omega$, $C_{gs} = -1/(\omega\,\mathrm{Im}Z_{11}) = 0.84$ pF.
2. $Y_{22} = \frac1{Z_0}\frac{1-S_{22}}{1+S_{22}}$ → $R_{ds} = 1/\mathrm{Re}\,Y_{22} = 213\ \Omega$, $C_{ds} = \mathrm{Im}\,Y_{22}/\omega = 0.51$ pF.
3. Invert the $S_{21}$ expression above → $g_m = 54$ mS.
4. $f_T = g_m/2\pi C_{gs} = 10.3$ GHz.

(Pozar's answers: 12.2 Ω, 0.84 pF, 213 Ω, 0.51 pF, 54 mS. Our recomputation matches.)

**Worked example 2: $f_T$, $f_{max}$, MSG from Pozar's four device tables** (computed here; not printed in Pozar):

| Device, bias | MSG at low $f$ | $f_T\approx f\lvert h_{21}\rvert$ | $f_{max}\approx f\sqrt U$ |
|---|---|---|---|
| Si BJT NE58219, 5 V, 5 mA | 26.3 dB (0.1 GHz) | ≈4.5–5 GHz | ≈13 GHz (2 and 4 GHz agree) |
| SiGe HBT BFP640F, 2 V, 1.2 mA | 18.2 dB (1 GHz) | ≈7–8 GHz | ≈32–34 GHz |
| GaAs FET NE76184A, 3 V, 10 mA | 19.8 dB (1 GHz) | ≈12 GHz (2–4 GHz) | ≈50–65 GHz |
| GaN HEMT CGH21120, 28 V, 0.5 A | 27.2 dB (0.5 GHz) | (package-dominated) | ≈20 GHz |

- The HBT is biased for low noise (1.2 mA), far below its peak-$f_T$ current, so its $f_T$ here is not its datasheet maximum.
- **Mason's $U$ is ill-conditioned when $S_{12}$ is tiny**: at low frequency it divides by a small difference of measured numbers and can come out absurd or negative (the BFP640F at 1 GHz gives $U<0$). Extract $f_{max}$ only where $U$ is clearly on its 20 dB/dec line.
- $f_T$ from packaged data drifts upward at high $f$ (the NE76184A gives 40 GHz at 12 GHz): package parasitics, not the device. De-embed first.
- Pozar titles Table 11.7 a MESFET and calls the same part a HEMT in Prob. 11.7; the analysis is identical either way.

> [!tip] Remark
> $h_{21}$ from S-parameters: $h_{21} = \frac{-2S_{21}}{(1-S_{11})(1+S_{22})+S_{12}S_{21}}$ ([[Microwave Network Analysis#Two-Port Parameter Conversions]]).

## Level 4: Microwave Integrated Circuits

```tikz title="MMIC cross-section: everything (FET, MIM capacitor, thin-film and implanted resistors, spiral inductor, microstrip) is made on the semi-insulating GaAs substrate; via holes ground the top side and sink heat. After Pozar Fig. 11.26 and binder p. 157."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \fill[gray!15] (0,0.25) rectangle (13,2.2);
  \fill[yellow!60!black] (0,0) rectangle (13,0.25);
  \draw (0,0) rectangle (13,2.2);
  % via
  \fill[white] (1.2,0.25) rectangle (2.0,2.2);
  \fill[yellow!60!black] (1.1,0.25) rectangle (1.25,2.2);
  \fill[yellow!60!black] (1.95,0.25) rectangle (2.1,2.2);
  \fill[yellow!60!black] (0.8,2.2) rectangle (2.4,2.4);
  \node[font=\scriptsize] at (1.6,-0.35) {via hole};
  % microstrip
  \fill[yellow!60!black] (2.8,2.2) rectangle (4.0,2.4);
  \node[font=\scriptsize] at (3.4,2.75) {microstrip};
  % MIM cap
  \fill[yellow!60!black] (4.4,2.2) rectangle (5.6,2.35);
  \fill[cyan!40] (4.4,2.35) rectangle (5.6,2.45);
  \fill[yellow!60!black] (4.5,2.45) rectangle (5.5,2.6);
  \node[font=\scriptsize] at (5.0,2.95) {MIM cap};
  % thin film resistor
  \fill[red!50] (6.0,2.2) rectangle (7.0,2.32);
  \node[font=\scriptsize] at (6.5,2.75) {thin-film R};
  % FET
  \fill[green!35] (7.5,1.9) rectangle (9.5,2.2);
  \fill[yellow!60!black] (7.5,2.2) rectangle (8.1,2.4);
  \fill[violet!60] (8.35,2.2) rectangle (8.65,2.45);
  \fill[yellow!60!black] (8.9,2.2) rectangle (9.5,2.4);
  \node[font=\scriptsize] at (8.5,2.85) {GaAs FET (S G D)};
  % implanted resistor
  \fill[orange!50] (10.0,1.95) rectangle (11.2,2.2);
  \node[font=\scriptsize] at (10.6,2.75) {implanted R};
  % air bridge
  \draw[very thick,yellow!60!black] (11.5,2.2) -- (11.5,2.7) -- (12.7,2.7) -- (12.7,2.2);
  \fill[yellow!60!black] (11.9,2.2) rectangle (12.3,2.3);
  \node[font=\scriptsize] at (12.1,3.0) {air bridge};
  \node[font=\scriptsize] at (6.5,1.1) {semi-insulating GaAs substrate (lapped thin)};
  \node[font=\scriptsize,anchor=west] at (13.1,0.12) {ground plane};
\end{circuitikz}
\end{document}
```

| | Hybrid MIC | MMIC |
|---|---|---|
| What's on the substrate | one metal layer (lines); discrete R, C, transistors, diodes, chips soldered or wire-bonded on | all active and passive parts grown or implanted in a semiconductor substrate |
| Substrate | alumina ($\epsilon_r\approx9$–10), quartz ($\approx4$, for >20 GHz), Teflon-type soft boards ($\epsilon_r$ 2–10) | GaAs most common; also Si, SoS, SiC, InP |
| Tuning | trim stubs per board: higher yield, skilled labor | essentially none after fab |
| Cost | flexible and cheap in low volume | cheap only in volume (expensive below several hundred units); low yield from tight tolerances |
| Parasitics / bandwidth | packaged parts, more parasitics | much smaller parasitics → **broader bandwidth**; very reproducible within a wafer |
| Limits | size | wastes expensive substrate on lines and hybrids; small size limits heat → only moderate power; lossy materials → **high-$Q$ resonators and filters are hard** |
| Extra devices | each one costs | extra FETs are nearly free → use them for flexibility |

(Pozar §11.4.)

**MMIC process** (Pozar):
1. Active layer by ion implantation or epitaxy.
2. Isolate mesas.
3. Au or Au/Ge ohmic contacts.
4. Ti/Pt/Au gates. Test the wafer here.
5. First metal: lines and inductors.
6. Resistive films (NiCr, Ta, Ti, doped GaAs).
7. Dielectrics (SiO, SiO₂, Si₃N₄, Ta₂O₅).
8. Second metal completes the capacitors.
9. Lap the back side thin, etch and plate the via holes, which give **ground and a heat path**.

Conductors are gold over a thin Cr or Ti adhesion layer, made **several skin depths thick** to keep loss down.

> [!tip] Remark
> "Several skin depths" is [[EM Foundations#Skin Depth]]. MIM capacitors, spirals and thin-film resistors are [[Capacitor#Metal-Insulator-Metal (MIM)]], [[Inductor#Planar Spirals]] and [[Resistor]]; microstrip on the substrate is [[Transmission Lines]].

> [!note]- Detail: RF MEMS switches vs PIN and FET (Pozar Point of Interest, 10–20 GHz)
> A MEMS switch moves a membrane with a DC voltage, switching the signal path between a low-capacitance (open) and a high-capacitance (closed) state.
>
> | Switch | IL (dB) | Isolation (dB) | Switching power | DC voltage (V) | Speed |
> |---|---|---|---|---|---|
> | PIN diode | 0.1–0.8 | 25–45 | 1–5 mW | 1–10 | 1–5 ns |
> | FET | 0.5–1.0 | 20–50 | 1–5 mW | 1–10 | 2–10 ns |
> | MEMS | 0.1–1.0 | 25–60 | 1 µW | 10–20 | >30 µs |
>
> MEMS: low loss, almost no power, wide band, and **virtually no intermodulation** (it isn't a semiconductor junction). Drawbacks: slow, and mechanical lifetime. The target application is cheap switched-line phase shifters for phased arrays.

## Level 5: Microwave Tubes

Solid state wins on size, ruggedness, cost and integration wherever it can meet the power and frequency (Pozar Fig. 11.28: solid state for low-to-moderate power at low-to-moderate frequency, tubes above). Tubes remain for **very high power (≥10 kW) and mm-wave (≥100 GHz)**: radar transmitters (1–10 kW, pulsed), electronic warfare (100 W–1 kW, broadband), microwave ovens (≈700 W). A low-power solid-state driver plus a tube amplifier is a **microwave power module**.

| Tube | Type | Power | Efficiency | Bandwidth / tuning | Notes |
|---|---|---|---|---|---|
| Klystron amplifier | linear beam, cavities | MW peak | 30–50% | narrow (high-$Q$ cavities) | 2 cavities ≈20 dB gain, 4 cavities 80–90 dB; very low AM/FM noise |
| Reflex klystron | linear beam, one cavity | low | — | mechanical tuning | oscillator; being replaced |
| TWT | linear beam, helix slow wave | several 100 W; kW with coupled cavities | 20–40% | **30–120%** (widest) | EW; radar PA after a solid-state source |
| BWO | linear beam, backward wave | <1 W | — | octave+ by voltage | being replaced by solid state |
| EIO | linear beam, coupled cavities | high, to several 100 GHz | moderate | narrow | only the gyrotron gives more |
| Magnetron | crossed field | kW | ≥80% | — | noisy, incoherent pulses; microwave ovens |
| CFA | crossed field | — | up to 80% | up to 40% | 10–15 dB gain, noisier than klystron/TWT |
| Gyrotron | crossed field, relativistic | 10–100 kW at mm-wave | high for mm-wave | frequency set by $B$ field, not size | mm-wave power source |

(Pozar §11.5.)

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| GaAs/InP HEMT instead of Si | $NF_{min}$, $f_T$, $f_{max}$ | cost, negative gate supply, no integration with logic |
| GaN instead of GaAs/Si for a PA | breakdown → $P_{out}$ and $R_{opt}$ (easy match), power density | cost, negative gate bias, noise (1.6 dB) |
| SiGe HBT / CMOS | cost, integration, single supply | breakdown (power), NF (CMOS), substrate loss |
| ↓ Gate length / base width (process) | $f_T$, $f_{max}$ | breakdown voltage, cost |
| More, shorter gate fingers | $R_g$ ↓ → $f_{max}$ ↑, gate noise ↓ | layout parasitic $C$, area |
| ↑ Periphery (total $W$, emitter area) | $P_{out}$ ($I_{max}$) | lower $Z_{in}$, $Z_{out}$ → harder matching, more $C$ |
| ↑ Bias current density | gain, $f_T$ (to its peak), $P_{out}$ | $NF$ (low-noise bias ≈15% $I_{DSS}$, low $I_C$), power |
| Schottky bias $I_0$ ↑ | lower video resistance, drive a load, less temperature drift | open-circuit sensitivity |
| PIN area ↑ | $R_f$ ↓ (ON loss for series, isolation for shunt) | $C_j$ ↑ (OFF isolation for series, ON loss for shunt) |
| Resonating the PIN/varactor parasitic | IL, isolation | bandwidth |
| Hyperabrupt varactor ($\gamma$ ↑) | tuning range, linear tuning | $Q$, linearity of $C$ vs signal |
| MMIC instead of hybrid MIC | bandwidth (fewer parasitics), size, repeatability, cost in volume | no trimming, low-volume cost, heat, high-$Q$ filters |
| Shunt instead of series PIN | isolation, heat sinking | needs $\lambda/4$ lines in an SPDT → bandwidth |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Diode law | $I = I_s(e^{\alpha V}-1)$, $\alpha = q/nkT\approx1/25$ mV |
| Small-signal expansion | $i = vG_d + \frac{v^2}2G_d'$, $G_d = 1/R_j = \alpha(I_0+I_s)$, $G_d' = \alpha G_d$ |
| Current sensitivity | $\beta_i = G_d'/2G_d = \alpha/2$ A/W |
| Voltage sensitivity | $\beta_v = \beta_iR_j$ (typ. 400–1500 mV/mW) |
| Sensitivity at RF | $\beta_v(\omega) = \frac{(\alpha/2)R_j}{1+R_s/R_j+\omega^2C_j^2R_sR_j}$ |
| PIN impedance | $Z_r = R_r+j(\omega L_i-1/\omega C_j)$, $Z_f = R_f+j\omega L_i$ |
| Series switch IL | $-20\log\lvert 2Z_0/(2Z_0+Z_d)\rvert$ |
| Shunt switch IL | $-20\log\lvert 2Z_d/(2Z_d+Z_0)\rvert$ |
| Switched-line phase | $\Delta\phi = \beta(\ell_2-\ell_1)$ |
| Loaded line (one load) | $\Delta\phi = \tan^{-1}(b/2)$, $b = BZ_0$ |
| Loaded line (pair, $\lambda/4$) | $\cos\theta_e = -b$, $Z_e = Z_0/\sqrt{1-b^2}$ |
| Varactor | $C_j = C_0/(1-V/V_0)^\gamma$, $V_0$ = 0.5 V (Si), 1.3 V (GaAs); $Q = 1/\omega R_sC_j$ |
| Transit frequency | $f_T = g_m/2\pi C_{gs}$ (FET), $g_m/2\pi C_\pi$ (BJT); $\lvert h_{21}\rvert\approx f_T/f$ |
| Mason's $U$ | $\frac{\lvert S_{21}/S_{12}-1\rvert^2}{2K\lvert S_{21}/S_{12}\rvert-2\mathrm{Re}(S_{21}/S_{12})} = \frac{\lvert y_{21}-y_{12}\rvert^2}{4(g_{11}g_{22}-g_{12}g_{21})}$ |
| Gain ceiling | $G\le U\approx(f_{max}/f)^2$; $f_{max}\ge f\sqrt{G}$ |
| FET $f_{max}$ | $\frac{f_T}{2}\sqrt{R_{ds}/(R_g+R_i+R_s)}$; with $C_{gd}$: $\frac{f_T}{2\sqrt{(R_g+R_i+R_s)/R_{ds}+2\pi f_TR_gC_{gd}}}$ |
| BJT $f_{max}$ | $\sqrt{f_T/(8\pi r_bC_\mu)}$ |
| MSG | $\lvert S_{21}/S_{12}\rvert$ |
| PAE | $\eta(1-1/G)$ |
| Unilateral FET S-params | $S_{11,22} = \frac{Z_{11,22}-Z_0}{Z_{11,22}+Z_0}$, $S_{21} = \frac{2jZ_0Z_{22}g_m/\omega C_{gs}}{(Z_{11}+Z_0)(Z_{22}+Z_0)}$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20)
  - Ch. 11 intro, pp. 524–525.
  - §11.1 Diodes and Diode Circuits, pp. 525–540: Schottky model (Eqs. 11.1–11.6, Fig. 11.3, Table 11.1), rectifier/detector sensitivity (Eqs. 11.7–11.12, Table 11.2, Fig. 11.5), spectrum analyzer box; PIN diodes (Fig. 11.6, Table 11.3), SPST/SPDT switches (Figs. 11.7–11.9, Eqs. 11.13–11.15), Example 11.1; switched-line, loaded-line and reflection phase shifters (Eqs. 11.16–11.21); varactors (Eq. 11.22, Fig. 11.14); Gunn, IMPATT, tunnel, BARITT (Fig. 11.15); power combining.
  - §11.2 Bipolar Junction Transistors, pp. 540–543: hybrid-π (Fig. 11.18), $f_T$ (Eq. 11.23), Tables 11.4–11.5, bias (Fig. 11.19).
  - §11.3 Field Effect Transistors, pp. 543–547: Table 11.6, MESFET (Figs. 11.20–11.22, Eq. 11.24, Table 11.7), MOSFET/LDMOS, HEMT and GaN (Fig. 11.24, Table 11.8).
  - §11.4 Microwave Integrated Circuits, pp. 547–552: hybrid MIC, MMIC (Fig. 11.26), RF MEMS box.
  - §11.5 Microwave Tubes, pp. 552–556 (Figs. 11.28–11.30).
  - Problems 11.1, 11.2, 11.3, 11.6, 11.7 and their answers (p. 557 and back matter).
- **ECE 373 binder (Boumaiza), scanned**: p. 156 (hybrid MIC layout), p. 157 (MMIC layout), pp. 160–163 (biasing networks, GaAs FET and BJT DC curves and bias circuits, bipolar vs unipolar FET supply), p. 164 (RF transistors: roles and noise sources), p. 199 (unilateral figure of merit, for contrast only), p. 241 (noise parameters supplied by the manufacturer). The binder has no other device lectures.
- **Computed for this note** (not printed in the sources): detector sensitivity vs bias for Prob. 11.1; MSG, $K$, Mason's $U$, $|h_{21}|$, $f_T$ and $f_{max}$ extracted from Pozar Tables 11.4, 11.5, 11.7, 11.8; numerical check of the $f_{max}$ formulas on Pozar's typical MESFET values; Prob. 11.7 extraction (matches Pozar's answers).
- **Not in the sources** (flagged in the note): Mason's $U$ and the $f_{max}$ formulas; the PA load-line $R_{opt}$; RF-SOI.
