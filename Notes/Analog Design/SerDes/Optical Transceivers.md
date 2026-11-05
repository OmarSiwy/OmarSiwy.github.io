---
title: Optical Transceivers
description: The optical link as circuits, from laser/VCSEL and modulator drivers through fiber, photodiode, TIA and limiting amplifier, with optical specs (OMA, ER, sensitivity in dBm) translated into transimpedance, bandwidth, noise current and gm/ID.
kind: topic
status: growing
aliases:
  - Optical Transceivers
  - Optical Links
  - TIA
  - Transimpedance Amplifier
  - Laser Driver
  - VCSEL Driver
---

An optical link is an electrical link whose channel is nearly lossless and flat, bracketed by two converters: a **driver** that turns bits into light (current into a laser, or voltage onto a modulator) and a **photodiode + TIA** that turns light back into a voltage. The channel problems of [[Channels]] mostly vanish; the hard parts move into the converters, and the receiver's **noise current** sets how far the light can go. This note owns those converters. Equalization, CDR, signaling and jitter are the electrical notes' job and are only linked.

## The big picture

```tikz title="An intensity-modulation direct-detection (IMDD) link with the spec each block owns. Bits become a current (laser) or a voltage (modulator), light crosses fiber or a silicon waveguide, a photodiode turns power into current, and a TIA + limiting amplifier turn that current into a slicer-ready voltage. After Palermo ECEN720 L16 slides 40, 44, 66 and Palermo 2011 Figs. 9.28-9.31."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=1.0cm,align=center,fill=white},
  o/.style={->,very thick,red!70!black},
  s/.style={font=\scriptsize\itshape,text=blue!60!black,align=center}]
  \node[b,minimum width=1.5cm] (ser) at (0,0) {serializer\\+ TX FIR};
  \node[b,minimum width=1.7cm] (drv) at (2.5,0) {laser /\\modulator\\driver};
  \node[b,minimum width=2.2cm,fill=red!5] (src) at (5.7,0) {VCSEL, DFB\\or CW laser +\\MZM / EAM / ring};
  \node[b,minimum width=1.9cm,fill=gray!10] (fib) at (8.7,0) {fiber or\\Si waveguide};
  \node[b,minimum width=1.2cm,fill=red!5] (pd) at (11.0,0) {PD};
  \node[b,minimum width=1.1cm] (tia) at (12.6,0) {TIA};
  \node[b,minimum width=1.1cm] (la) at (14.2,0) {LA};
  \node[b,minimum width=1.3cm] (cdr) at (15.9,0) {CDR +\\DEMUX};
  \draw[->] (-1.1,0) -- (ser); \draw[->] (ser) -- (drv); \draw[->] (drv) -- node[above] {$I$ or $V$} (src);
  \draw[o] (src) -- node[above,text=red!70!black] {$P$} (fib); \draw[o] (fib) -- (pd);
  \draw[->] (pd) -- node[above] {$i$} (tia); \draw[->] (tia) -- node[above] {$v$} (la); \draw[->] (la) -- (cdr);
  \node[s,below=3pt] at (drv.south) {$I_{bias}$, $I_{mod}$\\or $V_{swing}$, edges};
  \node[s,below=3pt] at (src.south) {$P_{avg}$, ER, OMA\\$\eta$, $V_\pi$, chirp};
  \node[s,below=3pt] at (fib.south) {dB/km, coupler dB\\dispersion};
  \node[s,below=3pt] at (pd.south) {$\rho$ (A/W)\\$C_{PD}$};
  \node[s,below=3pt] at (tia.south) {$R_T$, $f_{3dB}$\\$i_{n,rms}$};
  \node[s,below=3pt] at (la.south) {gain, BW\\offset};
  \draw[|<->|,gray] (2.5,1.2) -- node[above,text=black] {transmitter: bits $\to$ light} (6.8,1.2);
  \draw[|<->|,gray] (10.4,1.2) -- node[above,text=black] {receiver: light $\to$ volts} (14.8,1.2);
\end{circuitikz}
\end{document}
```

> [!important] The results the rest of the note refines
> 1. **The optical signal is the swing, not the average.** $\text{OMA}=P_1-P_0$, $\text{ER}=P_1/P_0$, $P_{avg}=(P_1+P_0)/2$, so $\text{OMA}=2P_{avg}\frac{\text{ER}-1}{\text{ER}+1}$. A finite ER costs $\text{PP}=\frac{\text{ER}+1}{\text{ER}-1}$ of average power (1.76 dB at ER = 5).
> 2. **Sensitivity is a noise current.** A photodiode gives $i=\rho P$; at BER $10^{-12}$ ($Q=7.03$) the receiver needs $i^{pp}_{sens}=2Q\,i_{n,rms}$, i.e. $\overline P_{sens}=Q\,i_{n,rms}/\rho$ (high ER). 380 nA rms and 0.8 A/W give $-24.8$ dBm.
> 3. **The shunt-feedback TIA** has $R_T=R_F\frac{A}{A+1}$, $R_{in}=\frac{R_F}{A+1}$, so the photodiode pole moves out by $A+1$. A finite-bandwidth amplifier makes it second order, and the **transimpedance limit** $R_T\le\frac{A\,\omega_A}{C_T\,\omega_{3dB}^2}$ says: double the bandwidth, quarter the transimpedance.
> 4. **TIA noise** is $\frac{4kT}{R_F}$ flat plus a channel-noise term that rises as $f^2$ with $\left(2\pi C_T\right)^2/g_m$: the input capacitance, photodiode included, is the noise. Best sensitivity with the amplifier's input capacitance near $C_{PD}$.
> 5. **Optimum receiver bandwidth is about $\tfrac23 B$**: less adds ISI, more adds noise. A limiting amplifier gets its gain from about $2\ln G$ stages of gain near $\sqrt e\approx1.65$, and its offset must be under about 1 % of the swing for a 0.1 dB penalty, so it needs an offset loop.
> 6. **A laser driver is a current DAC**: $I_{bias}$ keeps the laser above threshold (bandwidth $\propto\sqrt{I_{avg}-I_{TH}}$, no turn-on delay) and $I_{mod}=\text{OMA}/\eta$ steers the swing. **Modulator drivers are voltage drivers**: a lumped capacitor (ring, short EAM, $CV^2f$) or a terminated travelling-wave line (MZM, several volts into 50 Ω).

**Map:** [[#Spec translation|optical specs → TIA, LA, driver sizing]] → [[#Level 0 The Optical Link as a Black Box|black box, OMA and ER]] → [[#Level 1 The Optical Channel|fiber, dispersion, waveguides, link budget]] → [[#Level 2 Photodetectors|p-i-n, waveguide PD, APD]] → [[#Level 3 Receiver Sensitivity|sensitivity, penalties, bandwidth]] → [[#Level 4 Transimpedance Amplifiers|TIAs]] → [[#Level 5 Limiting Amplifiers|limiting amplifiers]] → [[#Level 6 Laser and VCSEL Drivers|laser drivers]] → [[#Level 7 Modulator Drivers|modulator drivers]] → [[#Level 8 Silicon Photonics and Integration|silicon photonics]].

## Spec translation

An optical transceiver has two amplifier chains with very different specs: the **receive chain** (TIA, LA) is a small-signal, noise-limited, wideband amplifier, sized like any amplifier with $g_m/I_D$; the **transmit chain** (laser or modulator driver) is a large-signal current or voltage switch, whose specs are current, swing, edge rate and headroom, sized like the CML output stage of [[Transmitters]].

### The block's specs

| Link spec | Meaning | Typical number (source) |
|---|---|---|
| Data rate $B$ | Bits per second; NRZ or PAM4 | 10 Gb/s (Palermo HW3), 16 Gb/s VCSEL link (Palermo 2008), 200 Gb/s PAM4 per lane (L16 slides 8, 51) |
| BER | Sets $Q$ | $10^{-12}$: $Q=7.03$; $10^{-10}$: 6.36; $10^{-15}$: 7.94 (L4 slides 16, 29) |
| RX sensitivity $\overline P_{sens}$ or $\text{OMA}_{sens}$ | Smallest average power (or OMA) giving the BER | $-24.8$ dBm with 380 nA rms, 0.8 A/W (L4 slide 24); integrating RX $-9.8$ dBm at 10 Gb/s (Palermo 2008) |
| RX overload $\overline P_{ovl}$, dynamic range | Largest power still meeting the BER | dynamic range $=\overline P_{ovl}/\overline P_{sens}$ (L4 slide 28) |
| TX average power, ER, OMA | What the laser or modulator launches | VCSEL 6.2 mA avg, ER 3 dB (Palermo 2008); EML 5.1 dB ER at 2 Vppd (L16 slide 59) |
| TDECQ (PAM4) | TX penalty measured with a reference RX | $<2.4$ dB typical (L16 slide 48) |
| Channel loss and dispersion | Fiber dB/km, couplers, $D$, linewidth | SMF 0.25 dB/km at 1550 nm (L16 slide 12); grating coupler 1–1.5 dB (slide 37) |
| Photodiode $\rho$, $C_{PD}$ | Conversion gain and the TIA's input load | 0.6–0.9 A/W p-i-n (L3 slide 34); 100 fF at 28 Gb/s (L16 slide 67); 35 fF class model (HW3) |
| Power / energy per bit | | 8.1 mW/(Gb/s) full 16 Gb/s VCSEL transceiver (Palermo 2008); MZM TX 2.7–12.6 pJ/b (L9 slide 16) |

### From optical specs to electrical specs

The optical numbers become currents and volts at the two converters:

$$
\boxed{i^{pp}_{sens}=2Q\,i_{n,rms}=\rho\,\text{OMA}_{sens},\qquad \overline P_{sens}=\frac{Q\,i_{n,rms}}{\rho}\ (\text{high ER}),\qquad v^{pp}_{TIA}=R_T\,i^{pp}}
$$

$$
\boxed{I_{mod}=\frac{\text{OMA}}{\eta}=\frac{2\overline P}{\eta}\cdot\frac{\text{ER}-1}{\text{ER}+1},\qquad I_{L,0}=I_{TH}+\frac{P_0}{\eta},\qquad f_{3dB,RX}\approx\tfrac23 B}
$$

> [!note]- Derivation: sensitivity from noise current, and the drive currents from OMA
> **Receiver.** The slicer sees $v_S^{pp}=H_0\,i^{pp}$ plus Gaussian noise of rms $v_{n,rms}=H_0\,i_{n,rms}$. With the threshold midway and equal noise on 0s and 1s, BER $=Q(v_S^{pp}/2v_{n,rms})$, so $v_S^{pp}=2Qv_{n,rms}$ and $i^{pp}_{sens}=2Q\,i_{n,rms}$ (L4 slides 15, 21). With a high ER, $P_0\approx0$, the average photocurrent is $i^{pp}/2$ and $\overline P=i^{pp}/2\rho$, so $\overline P_{sens}=Q\,i_{n,rms}/\rho$ (slide 23). The OMA form needs no ER assumption: $\text{OMA}_{sens}=i^{pp}_{sens}/\rho$.
>
> **Transmitter.** A laser above threshold is linear, $P=\eta(I-I_{TH})$ (L16 slide 50), so $\text{OMA}=\eta(I_1-I_0)=\eta I_{mod}$. Combine with $\text{OMA}=2\overline P(\text{ER}-1)/(\text{ER}+1)$ (L16 slide 47). The 0-level current must sit above $I_{TH}$ by $P_0/\eta$.
>
> **Bandwidth.** The noise-versus-ISI optimum of an NRZ receiver is near $(2/3)B$ (L4 slides 58, 66): see [[#Optimum Bandwidth and Its Allocation]].

### Mapping link specs to amplifier specs

| Link spec | Block / device | Amplifier spec that sets it ([[Single-Stage#Amplifier Specifications]]) | Result |
|---|---|---|---|
| Sensitivity | TIA (with $C_{PD}$) | **Input-referred noise** (current) | $i_{n,rms}\le\rho\,\overline P_{sens}/Q$; $\overline{i_n^2}=\frac{4kT}{R_F}BW_n+\frac{4kT\Gamma}{g_mR_F^2}BW_n+\frac{4kT\Gamma(2\pi C_T)^2}{g_m}\frac{BW_{n2}^3}{3}$ |
| Data rate | TIA | **Closed-loop bandwidth** and **Q** (phase margin) | $\omega_0=\sqrt{\frac{(A+1)\omega_A}{R_FC_T}}\approx\tfrac23B\cdot2\pi$, $Q=\tfrac1{\sqrt2}$ (Butterworth) or $\tfrac1{\sqrt3}$ (Bessel) |
| Swing into the LA | TIA | **DC gain** $A$ and $R_F$ | $R_T=R_F\frac{A}{A+1}$ |
| Transimpedance at that bandwidth | TIA core amplifier | **GBW** $A\,f_A$ | $A\,\omega_A\ge R_TC_T\,\omega_{3dB}^2$ |
| $C_{PD}$ + amp. input | TIA input device | **Input capacitance** | $C_I\lesssim C_{PD}$ for best noise; $C_T=C_{PD}+C_I$ inside the bandwidth budget |
| Overload | TIA + LA first stage | **Linear range / output swing** | $i^{pp}_{ovl}=2\rho\overline P_{ovl}$ without pulse-width distortion |
| Gain to the slicer | LA | **DC gain** and **bandwidth** of $n$ stages | $n_{opt}\approx2\ln G$, $A_s\approx\sqrt e$; $f_{tot}=f_s\sqrt{2^{1/n}-1}$ |
| Offset penalty | LA + offset loop | **Offset** (input-referred) | $V_{os}\le\delta\,v^{pp}_{TIA}$, $\delta=(\text{PP}-1)/2$ |
| Low-frequency content | LA offset loop | Loop **unity-gain frequency** | $f_{LF}=\frac{1+AA_1/2}{2\pi R_1C_1}\ll$ lowest data frequency |
| TX OMA, ER | Laser driver output pair + bias DAC | **Output current** (tail), full switching | $I_{mod}=\text{OMA}/\eta$, $I_{bias}$ from ER and $I_{TH}$ |
| TX edge rate / laser bandwidth | Driver output stage + FIR taps | **Output capacitance**, predriver **GBW** | FIR taps in current: $I_{-1},I_0,I_1,\dots$ |
| Modulator ER | MZM / EAM / ring driver | **Output swing** and headroom | $V_{swing}$ from $V_\pi$ or $V_{SW}$; may exceed $V_{DD}$: cascodes |
| Power | All | **Bias current** | TIA $I_D\propto(R_TC_{IN})^2f_{3dB}^4$, LA $I_D\propto f_{3dB}^2$ (L5 slide 39) |

$$
\boxed{R_T\le\frac{A\,\omega_A}{C_T\,\omega_{3dB}^2},\qquad i_{n,rms}\le\frac{\rho\,\overline P_{sens}}{Q},\qquad V_{os}\le\frac{10^{\text{PP}_{dB}/10}-1}{2}\,R_T\,i^{pp}_{sens}}
$$

> [!note]- Derivation: where each row comes from
> **Closed-loop bandwidth and Q.** The TIA with a one-pole amplifier $A/(1+s/\omega_A)$ is a second-order low-pass with $\omega_0^2=(A+1)\omega_A/(R_FC_T)$ and $Q=\frac{\sqrt{(A+1)R_FC_TT_A}}{R_FC_T+T_A}$, $T_A=1/\omega_A$ (L5 slide 16). Q is the loop's phase margin in disguise: [[Feedback#Second-order loop]].
>
> **Transimpedance limit.** For Butterworth, $Q=1/\sqrt2$ gives $\omega_A\approx2A/(R_FC_T)$ and $\omega_{3dB}=\omega_0$. Substituting $R_F=R_T(A+1)/A$ into $\omega_0^2=(A+1)\omega_A/(R_FC_T)$ gives $\omega_{3dB}^2=A\omega_A/(R_TC_T)$, hence $R_T\le A\omega_A/(C_T\omega_{3dB}^2)$ (L5 slide 18, after Mohan 2000).
>
> **Noise.** Feedback resistor $4kT/R_F$ appears directly at the input. The FET channel noise $4kT\Gamma g_m$ is referred to the input by grounding the output: $i_{n,D}=g_m\,i_{n,TIA}R_F/(1+sR_FC_T)$, so $|i_{n,TIA}/i_{n,D}|^2=\frac{1+(2\pi fR_FC_T)^2}{(g_mR_F)^2}$ (L5 slide 27). Integrate against the noise bandwidths of [[#Noise Bandwidths and Personick Integrals]].
>
> **Offset.** An offset $\delta\,v^{pp}$ forces the signal up by $1+2\delta$ to keep the same distance on the bad side, so $\text{PP}=1+2\delta$ (L4 slides 50–52).
>
> **Offset loop corner.** L6 slide 35; the $AA_1/2$ assumes a 50 Ω driver source.
>
> **Power scaling.** Stated without derivation in L5 slide 39: $I_D\propto(R_TC_{IN})^2f_{3dB}^4$ for the TIA and $I_D\propto f_{3dB}^2$ for the LA. The direction follows from the transimpedance limit: at fixed $R_T$ the amplifier GBW must grow as $f_{3dB}^2$.

### Where it lands in sizing

| Amplifier spec | Lands on | Rule |
|---|---|---|
| TIA input $g_m$ (noise) | $I_D=g_m/(g_m/I_D)$ of the input device | The $f^2$ noise term falls as $1/g_m$; the white FET term as $1/(g_mR_F^2)$ |
| TIA input capacitance $C_I\lesssim C_{PD}$ | $W$ and $g_m/I_D$: $C_{gg}=g_m/(2\pi f_T)$ | **Low** $g_m/I_D$ (high $f_T$) to get the $g_m$ without the capacitance; Miller $C_{gd}(1+A)$ on top |
| TIA core gain $A$, pole $f_A$ | $g_{m1}R_D$ and the drain-node $C$; or an inverter's $g_m/g_{ds}$ | $A\approx\alpha(V_{DD}-V_A)/V_{OD}$ with $V_A=V_{GS1}+V_{GS2}$: only 2–3 at 1 V (L5 slide 39) |
| $R_F$ | A resistor, not a transistor | $R_F=R_T(A+1)/A$; sets both gain and the $4kT/R_F$ floor |
| LA stage GBW | CML pair at **low** $g_m/I_D$, $L_{min}$ | GBW per stage $\approx f_T/3$ (L6 slide 5): [[High-Speed Circuit Techniques#Level 2 The Gain-Bandwidth Limit of a CML Stage]] |
| LA offset | Offset-loop error amplifier (its offset is *not* divided by the loop gain) | Large $WL$ in the error amp ([[Nonlinearity and Mismatch]]), or trim |
| Laser driver $I_{mod}$ | Output pair, fully switched; tail as a current DAC | Switch fully: $\Delta V_{in}\ge\sqrt2V_{OV}$ ([[Differential Amplifiers#Large-Signal Characteristic]]); thick-oxide devices for the laser's headroom |
| Modulator swing beyond $V_{DD}$ | Cascoded or pulsed-cascode output stage | Keep every $V_{GS},V_{GD},V_{DS}$ within the core-device limit (L10, Palermo & Horowitz 2006) |

> [!tip] Remark
> The lookup-table procedure ($f_T$, $J_D$, $g_m/g_{ds}$ against $g_m/I_D$ and $L$) is [[gm-ID Design Methodology]]. CML stage sizing (LA stages, predrivers) is [[High-Speed Circuit Techniques#Spec translation]]. Only the optical glue is here.

### Worked example: a 10 Gb/s TIA + LA receiver

Targets from Palermo's optical-interconnects HW3 (`ref/SerDes/hw3_ee689_optical.pdf`, Problems 3–4): 10 Gb/s, feedback TIA with $R_T=1$ kΩ and 7 GHz bandwidth, photodiode $\rho=0.8$ A/W and $C_{PD}=35$ fF; LA with 30 dB gain and 10 GHz bandwidth. BER $10^{-12}$ ($Q=7.03$). Devices: Jespers & Murmann Table 1.1 ($L=60$ nm: at $g_m/I_D=5$ S/A, $f_T=122$ GHz, $J_D=162$ µA/µm, $g_m/g_{ds}=9.9$; at 10 S/A, $f_T=64.2$ GHz). All circuit numbers below are my calculation.

1. **Bandwidth check.** TIA 7 GHz and LA 10 GHz combine as $1/\sqrt{1/7^2+1/10^2}=5.7$ GHz $=0.57B$: close to the $\tfrac23B$ optimum (L4 slide 68's $1/BW^2=\sum1/BW_i^2$ rule).
2. **Core gain → $R_F$.** At about 1 V, $A\approx3$ is what a resistively loaded stage can give (L5 slide 39). $R_F=R_T(A+1)/A=1.33$ kΩ.
3. **Bandwidth and Q → capacitance budget.** Butterworth with $\omega_A=2A/(R_FC_T)$ gives $\omega_{3dB}=\sqrt{2A(A+1)}/(R_FC_T)$. For 7 GHz: $R_FC_T=111$ ps, so $C_T\le83.5$ fF. With $C_{PD}=35$ fF the amplifier may load the input with at most $C_I=48$ fF (gate, Miller, pad and wiring together).
4. **Amplifier pole and GBW.** $f_A=2A/(2\pi R_FC_T)=8.6$ GHz, GBW $=Af_A=25.7$ GHz. Check against the limit: $A\omega_A/(C_T\omega_{3dB}^2)=1.00$ kΩ. Exact Q with these values: 0.70.
5. **Noise → input $g_m$.** With $\Gamma=1$ (assumed) and Butterworth noise bandwidths $BW_n=1.11f_{3dB}$, $BW_{n2}^3/3=1.11f_{3dB}^3$ (from L4 slide 45): $R_F$ gives 311 nA rms; with $g_m=20$ mS the FET white term is 60 nA and the $f^2$ term 295 nA. Total **$i_{n,rms}=433$ nA**, i.e. $i^{pp}_{sens}=6.1$ µA, $\overline P_{sens}=3.8$ µW $=-24.2$ dBm, $\text{OMA}_{sens}=-21.2$ dBm. The $f^2$ term crosses the $R_F$ floor at 7.4 GHz, right at the band edge, as L5 slide 28 sketches.
6. **$g_m/I_D$ → current and width.** At 10 S/A, $C_{gg}=g_m/(2\pi f_T)=50$ fF: over the 48 fF budget before Miller. At 5 S/A, $C_{gg}=26$ fF, leaving 22 fF for Miller, pad and wiring: take it. $I_D=4$ mA, $W=4\text{ mA}/162\ \mu\text{A}/\mu\text{m}=25$ µm. Intrinsic gain 9.9 covers $A=3$.
7. **Headroom.** $R_D=A/g_m=150\ \Omega$ drops 0.6 V; the drain then needs $V_{DD}-0.6\text{ V}\ge V_{GS1}+V_{GS2}$. At a 1.2 V supply that fails for any realistic $V_{GS}$, which is exactly why low-voltage TIAs use an inverter core (both devices give $g_m$, no $R_D$) (L5 slides 20, 39). The drain-node pole needs $C_A\le1/(2\pi R_Df_A)=124$ fF: easy.
8. **LA stages.** Palermo's own case (L6 slide 5): 30 dB and 10 GHz from a 200 GHz $f_T$ needs 7 stages of 1.64 at 31 GHz each. With this example's 122 GHz device (per-stage GBW $f_T/3=41$ GHz) the best any stage count reaches is 8.0 GHz (at 6–7 stages): short of 10 GHz. Shunt peaking (about 1.7× with a flat response, L6 slide 14) fixes it, e.g. 4 peaked stages of 2.37 reach about 12.7 GHz.
9. **LA offset.** At sensitivity the TIA output is $R_Ti^{pp}=6.1$ mVpp. For a 0.1 dB penalty, $\delta=0.012$: **$V_{os}\le71$ µV** input-referred. No sized pair gets there; an offset loop does, and then its error amplifier's own offset (which the loop does not divide down, L6 slide 34) must be under 71 µV.
10. **Power** (TIA input stage only): 4 mA from 1.2 V is 4.8 mW, 0.48 pJ/b.

> [!warning] Unverified
> $\Gamma=1$, a 1.2 V supply, and using the 60 nm J&M table for a 90 nm homework are my assumptions. The Butterworth noise-bandwidth factors are inferred from L4 slide 45 (integrating to $f_{3dB}$ underestimates the white term by 1.11× and the $f^2$ term by 3.33×). Treat the result as a first pass that shows which spec binds (the input capacitance budget, then the LA bandwidth, then offset), not as a design.

### Worked example: VCSEL bias and modulation current

The L16 slide 50 VCSEL: $I_{TH}=0.7$ mA, $\eta=0.37$ mW/mA. Target Palermo's 16 Gb/s operating point: $I_{avg}=6.2$ mA and ER = 3 dB (Palermo 2008; L8 slide 28). My calculation:

1. $\overline P=\eta(I_{avg}-I_{TH})=2.04$ mW (3.1 dBm).
2. $\text{OMA}=2\overline P\frac{\text{ER}-1}{\text{ER}+1}=1.35$ mW, so $I_{mod}=\text{OMA}/\eta=3.66$ mA.
3. $I_{L,0}=I_{avg}-I_{mod}/2=4.37$ mA, $I_{L,1}=8.03$ mA; check $(I_1-I_{TH})/(I_0-I_{TH})=2.0$ (3 dB).
4. Palermo's measured unequalized setting was $I_{DC}=4.37$ mA, $I_{MOD}=3.66$ mA: the same numbers, so the slide-50 parameters describe a device of that class.
5. **Driver specs.** A DC-coupled driver ([[#The Current-Mode Driver]]) needs a 4.37 mA bias DAC and a pair that fully steers 3.66 mA. The VCSEL's 1.5 V knee does not fit under a 1 V core supply, so Palermo ran the output pair and dummy load from 2.8 V with thick-oxide devices (Palermo 2008 §III).
6. **The cost of a low ER.** ER = 3 dB means a power penalty $(\text{ER}+1)/(\text{ER}-1)=3.0$ (4.8 dB) against an ideal-ER link of the same average power. The VCSEL buys bandwidth (bias well above threshold) with link budget.

## Level 0: The Optical Link as a Black Box

### Why Optics

- **Loss in dB per km, not dB per metre.** Single-mode fiber: about 0.25 dB/km at 1550 nm; coax: about 100 dB/km at 10 GHz (L16 slide 12). Frequency-dependent loss under 0.5 dB/km across more than 10 THz.
- **No equalization for short reach**: at chip-to-chip distances the dispersion is small, so the link looks like a non-channel-limited electrical link (Palermo 2011 §9.5.1). Effort moves into the converters.
- **WDM**: many wavelengths, each modulated at 10–200 Gb/s, share one fiber (L16 slide 9).
- **Reach scales inversely with data rate**, so data centers use electrical for chip-to-module and intra-rack and optics beyond (L16 slides 4–5). Pluggable modules keep a DSP (retimed); **linear-drive** optics remove it to save power but then need very linear, wideband drivers and TIAs (slide 7). **Co-packaged optics** put the photonics next to the switch: NVIDIA's example drives microring modulators from 200 Gb/s PAM4 SerDes with an external laser (slide 8).

> [!tip] Remark
> "No channel equalization" is what [[Channels]] and [[Equalization]] make expensive in copper. In optics, the equalizers that remain compensate the *converters* (VCSEL bandwidth, low-bandwidth TIA), not the channel.

### IMDD and Coherent

- **IMDD** (intensity modulation, direct detection): data in the optical power $|E|^2$; the photodiode is a square-law detector producing current proportional to power (L16 slides 39–40). 100 GBd occupies about 100 GHz around a 194 THz carrier, 0.8 nm at 1550 nm.
- **Coherent**: data in amplitude *and* phase, on two polarizations: four streams (XI, XQ, YI, YQ) per wavelength, four modulators, an optical hybrid and balanced photodetectors, with phase tracked in DSP or an optical PLL (slides 41–42). Long-haul; this note is IMDD.

### Optical Power, OMA and Extinction Ratio

```tikz title="Left: a laser's L-I curve. Below threshold it barely emits; above it P = eta(I - I_TH). The driver holds the 0-level current I_0 above threshold and adds I_mod for a 1. Right: the optical waveform it produces, with P_1, P_0, P_avg and OMA. After Palermo L16 slides 47 and 50 and L8 slide 21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % L-I curve
  \draw[->] (0,0) -- (6.2,0) node[right] {$I$};
  \draw[->] (0,0) -- (0,4.3) node[above] {$P$};
  \draw[very thick,red!70!black] (0,0) -- (1,0.05) -- (5.6,3.75);
  \node[below] at (1,0) {$I_{TH}$};
  \node[red!70!black,font=\scriptsize,anchor=west] at (4.2,3.3) {slope $\eta$ (W/A)};
  \draw[dashed] (2,0) -- (2,0.86) -- (0,0.86) node[left] {$P_0$};
  \draw[dashed] (4.5,0) -- (4.5,2.88) -- (0,2.88) node[left] {$P_1$};
  \node[below] at (2,0) {$I_0$};
  \node[below] at (4.5,0) {$I_1$};
  % current waveform below
  \draw[->] (3.25,-0.6) -- (3.25,-3.0) node[right,font=\scriptsize] {$t$};
  \draw[thick,blue!70!black] (2,-0.7) -- (2,-1.2) -- (4.5,-1.2) -- (4.5,-1.8) -- (2,-1.8) -- (2,-2.4) -- (4.5,-2.4) -- (4.5,-2.8);
  \draw[|<->|] (2,-3.4) -- node[below,font=\scriptsize] {$I_{mod}$} (4.5,-3.4);
  % optical waveform at right
  \begin{scope}[xshift=7.2cm]
    \draw[->] (0,0) -- (5.4,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,4.3) node[above] {$P$};
    \draw[very thick,red!70!black] (0,0.86) -- (0.8,0.86) -- (0.8,2.88) -- (2.2,2.88) -- (2.2,0.86) -- (3.0,0.86) -- (3.0,2.88) -- (4.4,2.88) -- (4.4,0.86) -- (5.0,0.86);
    \draw[dashed] (0,1.87) -- (5.0,1.87) node[right,font=\scriptsize] {$P_{avg}$};
    \draw[<->] (1.5,0.86) -- (1.5,2.88);
    \node[right,font=\scriptsize] at (1.5,2.4) {OMA};
    \node[left,font=\scriptsize] at (0,0.86) {$P_0$};
    \node[left,font=\scriptsize] at (0,2.88) {$P_1$};
    \node[font=\scriptsize,align=left,anchor=west] at (0.2,3.8) {ER $=P_1/P_0$, OMA $=P_1-P_0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{P_{avg}=\frac{P_1+P_0}{2},\quad \text{OMA}=P_1-P_0=2P_{avg}\frac{\text{ER}-1}{\text{ER}+1},\quad \text{ER}=\frac{P_1}{P_0}}
$$

- A "0" is never dark: a laser is kept above threshold (turn-on delay), and a modulator has finite contrast and limited drive swing (L7 slide 6).
- The receiver's BER depends on the **swing** (OMA). At a fixed average power, a lower ER means less swing. Specifying sensitivity in **OMA** removes the ER penalty for constant noise, which is why modern standards do so (L7 slide 10).
- For an external modulator, the swing also pays the insertion loss: the **modulator OMA penalty** is $\text{TP}_{OMA}=P_{CW}/\text{OMA}=\text{ER}/[T(\text{ER}-1)]$, $T=P_1/P_{CW}$ (L16 slide 47, where $T$ is written IL).

### Square-Law Detection: Optical dB Are Not Electrical dB

$$
\boxed{i_{PD}=\rho P\ \Rightarrow\ P_{elec}\propto i^2\propto P^2:\quad +3\text{ dB optical}=+6\text{ dB electrical}}
$$

Optical power goes into dB as $10\log_{10}P$ (dBm); current as $20\log_{10}i$. A laser's current-to-light conversion is linear, so the same square-root relation holds at the transmitter (L3 slide 10).

## Level 1: The Optical Channel

### Fiber

```tikz title="Step-index fiber cross-section: light stays in the core by total internal reflection, which needs n1 > n2. Multi-mode fiber has a 50 or 62.5 um core; single-mode fiber 8-10 um. After Palermo L16 slides 12-16 and Palermo 2011 Fig. 9.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[blue!8] (0,-1.2) rectangle (8,1.2);
  \fill[blue!25] (0,-0.5) rectangle (8,0.5);
  \draw (0,1.2) -- (8,1.2); \draw (0,-1.2) -- (8,-1.2);
  \draw[dashed] (0,0.5) -- (8,0.5); \draw[dashed] (0,-0.5) -- (8,-0.5);
  \draw[thick,red!70!black,->] (0,0) -- (1.2,0.5) -- (2.4,-0.5) -- (3.6,0.5) -- (4.8,-0.5) -- (6.0,0.5) -- (7.2,-0.5) -- (7.9,-0.05);
  \draw[thick,orange!80!black,->] (0,0.1) -- (2.6,0.5) -- (5.2,-0.5) -- (7.9,0.4);
  \node[anchor=west] at (8.2,0) {core $n_1$};
  \node[anchor=west] at (8.2,0.9) {cladding $n_2$};
  \node[font=\scriptsize,align=center] at (4,-1.6) {steep and shallow rays (modes) travel different path lengths: modal dispersion in MMF};
\end{circuitikz}
\end{document}
```

| | Multi-mode (MMF) | Single-mode (SMF) |
|---|---|---|
| Core | 50 or 62.5 µm: easy to couple | 8–10 µm: careful alignment (cost) |
| Typical source | 850 nm VCSEL | 1310 nm (near-zero dispersion) or 1550 nm (lowest loss) lasers |
| Loss | about 3 dB/km at 850 nm (Palermo 2011) | 0.2–0.25 dB/km at 1550 nm |
| Limit | Modal dispersion: bandwidth-distance product, 200 MHz·km legacy, over 4 GHz·km optimized (L16 slide 15) | Loss at long reach; chromatic dispersion and PMD, negligible under 10 km |

Transmission windows (L16 slide 18): **850 nm** (800–900 nm, cheap sources and detectors, short reach), **O-band** 1260–1360 nm (chromatic dispersion near zero), **C-band** 1530–1565 nm and **L-band** 1565–1625 nm (the loss minimum, 11 THz of bandwidth).

### Dispersion

Dispersion spreads each bit in time, so it is ISI in the optical domain (L16 slide 20):

$$
\boxed{\Delta T_{modal}=\frac{(n_{cor}-n_{clad})^2}{8c\,n_{cor}}L\ (\text{GRIN MMF}),\qquad \Delta T_{CD}=D\,\Delta\lambda\,L,\qquad \Delta T_{PMD}=D_{PMD}\sqrt L}
$$

| Mechanism | Where | Example |
|---|---|---|
| Modal | MMF: modes travel at different speeds | $n_{cor}=1.48$, $\Delta n=0.02$, 1 km: 113 ps, so at 10 % of a bit, under 1 Gb/s at 1 km (L16 slide 22) |
| Chromatic | SMF: spectral components travel at different speeds, $D=\frac1L\frac{\partial\tau}{\partial\lambda}$ | Standard SMF $D=17$ ps/(nm·km) at 1550 nm: a 1 nm source spreads 17 ps per km (slides 23–24) |
| Polarization-mode | SMF: two polarizations at different speeds in an elliptical or stressed core; random, time-varying | $D_{PMD}=2$ ps/√km legacy, 0.1 ps/√km new; negligible under 10 km (slides 25–27) |

The spectral width $\Delta\lambda$ that chromatic dispersion acts on comes from the transmitter, which is where circuits come back in:

| Source | Linewidth | Reach for a 1 dB penalty at 1550 nm |
|---|---|---|
| Transform-limited (ideal external modulator) | $\Delta\lambda=\frac{\lambda^2}{c}B$: 80 pm at 10 Gb/s | $L<\frac{17\text{ ps/(nm·km)}}{D}\cdot\frac{(6000\text{ Gb/s})^2}{B^2}$ km: falls as $1/B^2$ |
| Chirped (directly modulated laser, chirp $\alpha$) | $\frac{\lambda^2}{c}B\sqrt{1+\alpha^2}$: 330 pm at 10 Gb/s, $\alpha=4$ | the above divided by $\sqrt{1+\alpha^2}$ |
| Source-limited (multi-mode laser) | the source's own $\Delta\lambda_S$ (over 1 nm) | $L<\frac{1}{2D\Delta\lambda_SB}$: falls as $1/B$ |

(L7 slides 11–17.)

> [!tip] Remark
> Chirp is why long-haul links modulate externally: a directly modulated laser blue-shifts on rising edges and red-shifts on falling edges ($\alpha>0$), widening the spectrum that $D$ then spreads (L8 slide 14). An MZM driven push-pull is ideally chirp-free ([[#Mach-Zehnder Modulator]]).

### Silicon Photonic Waveguides and Couplers

- Si core (index about 3.5) in SiO₂ (about 1.5): the high contrast allows sub-µm cross-sections (e.g. 320 × 220 nm), mode tails that decay within 300 nm, and bend radii under 5 µm (L16 slides 28–29).
- On-chip waveguides are single-transverse-mode but carry TE and TM; TE sees the rough sidewalls more and has higher loss (slide 30).

| Platform / coupler | Loss | Source |
|---|---|---|
| SOI waveguide (thick BOX confines the mode) | about 1 dB/cm | L16 slide 31 |
| Bulk-CMOS poly waveguide, as is | about 1000 dB/cm (leaks into the substrate) | slide 32 |
| Bulk CMOS with post-processing or deep-trench oxide | about 10 dB/cm | slides 32–33 |
| Butt (edge) coupling to fiber, no converter | about 20 dB | slide 34 |
| Vertically tapered waveguide | near 3 dB | slide 35 |
| Inverted taper | better than 1 dB | slide 36 |
| Surface grating coupler | 1–1.5 dB over 20 nm | slide 37 |

### Link Budget

```tikz title="Optical power budget for Palermo optical-interconnects HW2 Problem 2 (10 Gb/s, 1310 nm SMF, 0.4 dB/km, 0 dBm launched, -15 dBm sensitivity, D = 0.5 ps/(nm km), 3 nm linewidth). Loss allows 37.5 km, but dispersion stops the link at 33 km. My solution."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.18cm,y=0.22cm]
  \draw[->] (0,0) -- (45,0) node[right] {$L$ (km)};
  \draw[->] (0,-18) -- (0,2) node[above] {$P$ (dBm)};
  \foreach \y in {0,-5,-10,-15} \draw (0,\y) -- (-0.6,\y) node[left,font=\scriptsize] {\y};
  \foreach \x in {10,20,30,40} \draw (\x,0) -- (\x,-0.5) node[above,font=\scriptsize] {\x};
  \draw[very thick,red!70!black] (0,0) -- (40,-16) node[right,font=\scriptsize] {$0-0.4L$};
  \draw[dashed,blue!70!black] (0,-15) -- (44,-15);
  \node[blue!70!black,font=\scriptsize,anchor=south west] at (1,-15) {$\overline P_{sens}=-15$ dBm};
  \draw[dotted,thick] (37.5,-15) -- (37.5,-18) node[below right,font=\scriptsize] {37.5: loss limit};
  \draw[dotted,thick] (33.3,-13.3) -- (33.3,-18);
  \node[below left,font=\scriptsize] at (33.3,-18) {dispersion limit: 33.3};
  \fill[green!50!black] (33.3,-13.3) circle (0.35);
  \draw[<->] (31.5,-13.3) -- (31.5,-15);
  \node[font=\scriptsize,anchor=east] at (31.3,-16.2) {1.7 dB margin left};
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline P_{TX}\,[\text{dBm}]-\sum\text{losses}\,[\text{dB}]-\sum\text{PP}\,[\text{dB}]\ \ge\ \overline P_{sens}\,[\text{dBm}]+\text{margin}}
$$

- Losses: couplers, fiber (dB/km × L), connectors, modulator insertion loss. Penalties (PP, Level 3): ER, dispersion, RIN, offset, ISI, dark current.
- **Worked (HW2 P2, my solution):** loss alone allows $(0-(-15))/0.4=37.5$ km. Chromatic spreading $\Delta T=D\Delta\lambda L\le T_b/2=50$ ps allows $50/(0.5\cdot3)=33.3$ km: **dispersion-limited**. At 5 km the dispersion limit moves the maximum rate to $1/(2\cdot0.5\cdot3\cdot5\text{ ps})=67$ Gb/s.

> [!tip] Remark
> This is the optical version of the voltage budget in [[Signaling and BER#Link Budget]]: there, millivolts of eye are subtracted; here, decibels of light. The receiver term is the same idea: a sensitivity set by noise at a target $Q$.

## Level 2: Photodetectors

### p-i-n Photodiode

$$
\boxed{\rho=\frac{I}{P}=\frac{\eta\,\lambda q}{hc}=8\times10^5\,\eta\,\lambda\ \ \text{(A/W, }\lambda\text{ in m)},\qquad \eta=1-e^{-\alpha W}}
$$

$$
\boxed{f_{3dB,PD}=\frac{2.4}{2\pi\tau_{tr}}=\frac{0.45\,v_{sat}}{W}\quad(\text{transit}),\qquad BW\approx\frac{1}{2\pi\left(W/v_n+R_{PD}C_{PD}\right)}}
$$

- Photons absorbed in the reverse-biased intrinsic layer make electron-hole pairs that the field sweeps out (L3 slide 5). The physics of the junction and its reverse bias is [[Diodes]].
- $\eta=0.6$ at 1310 nm gives 0.63 A/W; $\eta=1$ at 1550 nm gives 1.24 A/W, so $\rho>1$ is possible (L3 slide 9). An 850 nm detector with a long intrinsic region: 0.68 A/W (Palermo 2011 Eq. 9.8).
- **The trade-off is $W$**: a wide intrinsic region absorbs more light (higher $\eta$) but takes longer to cross (lower bandwidth). Detectors designed above 10 GHz generally can't reach full responsivity (Palermo 2011 p. 321).
- **Capacitance** is the TIA's problem: about 100 fF for a 28 Gb/s p-i-n (L16 slide 67); 100–500 fF in general (L5 slide 10). Packaged devices add bond-wire $L$ and pad $C$ (L3 slide 11).
- Materials: Si absorbs visible and 850 nm but nothing above 1060 nm; InGaAs for 1310/1550 nm; Ge for silicon-photonic waveguide detectors (L3 slide 8).

> [!tip] Remark
> The photodiode is a reverse-biased junction whose current source is the light ([[Diodes#Leakage and Generation Current]] notes it in passing). Its $C_{PD}$ is the junction capacitance of [[Diodes#Junction Capacitance C_j(V)]], which is why more reverse bias lowers it.

### Waveguide Photodetector

Light travels *along* the intrinsic region while the field is *across* it, so the region can be thin (fast) and long (absorbing) at once (L16 slide 68). Example: a 15 µm Ge waveguide detector with 42 GHz at 4 V and 1 A/W at 0.5 V (L3 slide 17). CMOS-compatible Ge waveguide detectors under 5 µm² and **under 1 fF** exist (Palermo 2011 p. 325), at which point the circuit, not the detector, dominates $C_T$.

### Detector Noise

$$
\boxed{\overline{i^2_{n,PIN}}=2qI_{PIN}BW_n,\qquad \overline{i^2_{n,APD}}=F\,M^2\,2qI_{PIN}BW_n,\qquad F=k_AM+(1-k_A)\left(2-\frac1M\right)}
$$

- **Shot noise** is signal-dependent: roughly zero on a 0 (high ER), largest on a 1. Example: 1 mW, 0.8 A/W, 10 GHz → 1.6 µA rms, SNR 54 dB (L3 slide 13).
- **Dark current** is a few nA; fine while under 10 % of the signal current (L3 slide 15). **Saturation** above about 10 mA compresses responsivity and bandwidth (slide 16).
- **APD**: avalanche gain $M$ (5–20 A/W effective) at the cost of excess noise $F$ and a roughly constant gain-bandwidth product of 100–150 GHz; needs over 10 V and temperature-compensated bias (L3 slides 19–25).

> [!note]- Detail: optical preamplifier + p-i-n, and the quantum limit
> An EDFA ahead of a p-i-n gives power gain $G$ (typically 100, 20 dB) and $I=G\rho P$. Its ASE noise beats with the signal: $\overline{i^2_{n,ASE}}=\rho^2(2P_SS_{ASE}+S_{ASE}^2BW_O)BW_n$, and electrical SNR $\approx\text{OSNR}\cdot BW_O/(2BW_n)$ (L3 slides 28–33). Effective responsivities 6–900 A/W (slide 34).
>
> With no amplifier or detector noise at all, a 1 is still lost if no photon arrives. Poisson statistics give $\text{BER}=\tfrac12e^{-M}$, so $M=-\ln(2\,\text{BER})$ photons per 1 and $\overline P_{sens,quant}=\frac{-\ln(2\text{BER})}{2}\frac{hc}{\lambda}B$ (L4 slides 38–39). At 10 Gb/s, 1550 nm, $10^{-12}$: 27 photons per 1, $-47.6$ dBm (my calculation).
>
> APD optimum gain: $M_{opt}=\sqrt{\frac{i^{rms}_{n,amp}}{Qk_AqBW_n}-\frac{1-k_A}{k_A}}$, rising with amplifier noise (L4 slide 36). An optical preamp's noise figure falls with $G$, so more $G$ always helps.

## Level 3: Receiver Sensitivity

### Electrical and Optical Sensitivity

$$
\boxed{i^{pp}_{sens}=2Q\,i_{n,rms}\ \ (\text{or }Q(i^{rms}_{n,0}+i^{rms}_{n,1})),\qquad \overline P_{sens}=\frac{Q\,i_{n,rms}}{\rho},\qquad \text{OMA}_{sens}=\frac{2Q\,i_{n,rms}}{\rho}}
$$

- Electrical sensitivity is peak-to-peak current; optical sensitivity is **average** power (L4 slides 21–24). Example: 380 nA rms → 5.35 µApp; with 0.8 A/W, 3.34 µW $=-24.8$ dBm at $10^{-12}$; $-25.2$ dBm at $10^{-10}$; $-24.2$ dBm at $10^{-15}$ (slides 22–29).
- **Normalize the detector out** to compare receivers: $\overline P_{sens}=\frac{hc}{\lambda q}Q\,i_{n,rms}$ (ideal $\eta=1$): 380 nA at 1550 nm gives 2.16 µW, $-26.7$ dBm (L4 slides 25–26).
- With detector noise: $\overline P_{sens,PIN}=\frac{Q\,i^{rms}_{n,amp}}{\rho}+\frac{Q^2qBW_n}{\rho}$; for an APD, $\frac1M\frac{Q\,i^{rms}_{n,amp}}{\rho}+F\frac{Q^2qBW_n}{\rho}$ (L4 slides 31–32). For a p-i-n at 10 Gb/s, shot noise barely moves the sensitivity; for an APD it costs about 1 dB, for an optical preamp over 3 dB (slide 33).

> [!tip] Remark
> This is [[Signaling and BER#One Slicer and One Gaussian]] with the noise expressed as an input current: $Q=7.03$ at $10^{-12}$, eye $=14.1\,\sigma$. The SNR convention differs, though: optical texts use mean-free signal power over noise power, so $10^{-12}$ is 16.9 dB when amplifier noise dominates but 13.9 dB when detector noise does (L4 slides 18–19).

```tikz title="BER against received average power. At low power the TIA noise sets a straight line in 10 log Q; shot noise eventually floors it; at high power the TIA overloads (pulse-width distortion, data-dependent jitter). The window between the two limits at the target BER is the dynamic range. After Palermo L4 slide 35 and L5 slide 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9,0) node[right] {$\overline P$ (dBm)};
  \draw[->] (0,0) -- (0,4.6) node[above] {$-\log\text{BER}$};
  \draw[very thick,blue!70!black] (0.3,0.4) .. controls (2.5,1.6) and (4,3.6) .. (5.2,3.9) .. controls (6,4.0) and (6.6,4.0) .. (7.1,3.6) .. controls (7.6,3.0) and (8.0,1.6) .. (8.4,0.5);
  \draw[dashed] (0,2.6) -- (8.8,2.6) node[right,font=\scriptsize] {target};
  \fill (3.4,2.6) circle (2pt); \fill (7.62,2.6) circle (2pt);
  \draw[dotted] (3.4,2.6) -- (3.4,0) node[below,font=\scriptsize] {$\overline P_{sens}$};
  \draw[dotted] (7.62,2.6) -- (7.62,0) node[below,font=\scriptsize] {$\overline P_{ovl}$};
  \draw[<->] (3.4,3.0) -- node[above,font=\scriptsize] {dynamic range} (7.62,3.0);
  \node[font=\scriptsize,align=center] at (1.6,2.6) {TIA-noise\\limited};
  \node[font=\scriptsize,anchor=south] at (6.1,4.05) {shot-noise floor};
  \node[font=\scriptsize,align=left,anchor=west] at (8.3,1.4) {overload};
\end{circuitikz}
\end{document}
```

- **Overload**: the largest peak-to-peak input current that still meets the BER, $i^{pp}_{ovl}=2\rho\overline P_{ovl}$ (high ER); the 1 dB compression current $i^{pp}_{lin}$ is lower and matters for PAM4 and linear-drive links (L5 slide 6).

### Noise Bandwidths and Personick Integrals

$$
\boxed{\overline{i_n^2}=\alpha_0BW_n+\alpha_2\frac{BW_{n2}^3}{3},\qquad BW_n=\frac1{H_0^2}\int_0^\infty|H|^2df,\qquad BW_{n2}^3=\frac3{H_0^2}\int_0^\infty|H|^2f^2df}
$$

- Amplifier noise has a white part $\alpha_0$ and an $f^2$ part $\alpha_2f^2$ (L4 slide 7). Integrate the **output** noise and divide by the midband gain; integrating the input spectrum only to $f_{3dB}$ is right only for a brick wall. For 2nd-order Butterworth it underestimates the white term 1.11× and the $f^2$ term 3.33× (L4 slides 41–45).
- Optical texts write the same thing with **Personick integrals** $I_2=BW_n/B$, $I_3=BW_{n2}^3/(3B^3)$ (slide 46).
- Comparing TIAs by an "average noise density" $i^{avg}_{n}=i_{n,rms}/\sqrt{BW_{3dB}}$ (pA/√Hz) is common; it is not the average of the spectrum (L5 slide 24).

> [!tip] Remark
> This is [[Noise#Noise Bandwidth]] and [[Noise#Integrate at the Output, Not the Input]] with one extra term: the $f^2$ part, which needs its own (larger) bandwidth.

### Power Penalties

The **power penalty** is the extra average power needed to keep the BER against an ideal reference (L4 slide 48). They add in dB in the [[#Link Budget]].

| Impairment | Power penalty | Example |
|---|---|---|
| Extinction ratio (p-i-n, amplifier noise) | $\frac{\text{ER}+1}{\text{ER}-1}$ | ER = 5 → 1.76 dB (L7 slides 7–8) |
| Extinction ratio (detector noise dominates: APD, OA) | $\frac{\text{ER}+1}{\text{ER}-1}\cdot\frac{\sqrt{\text{ER}}+1}{\sqrt{\text{ER}}-1}$ | much worse (L7 slide 9) |
| Decision-threshold offset $\delta=V_{os}/v^{pp}$ | $1+2\delta$ | 1 mV on a 14.07 mV eye → 0.58 dB; 0.1 dB needs $\delta\le1.2$ % (L4 slides 50–52) |
| Dark current | $\sqrt{1+\frac{2qI_{DK}BW_n}{\overline{i^2_{n,amp}}}}$ | 5 nA at 2.5 Gb/s: $4.6\times10^{-5}$ dB; with an APD ($F=6$, $M=10$) 0.027 dB (L4 slides 53–56) |
| Laser RIN | $\frac1{1-Q^2\cdot\text{RIN}\cdot BW_n}$ | $-135$ dB/Hz, 10 GHz: SNR 35 dB, 0.069 dB (L8 slides 15–16) |
| ISI (peak distortion) | $V_E/V_E'$ (open eye over closed eye) | grows fast below $\tfrac23B$ (L4 slide 65) |
| TX nonidealities (PAM4) | TDECQ $=10\log(\sigma_{ideal}/\sigma_R)$ | 3 dB TDECQ needs a 3 dB better RX (L16 slide 48) |

> [!note]- Derivation: the ER and offset penalties
> **ER.** BER depends on the swing $P_1-P_0$. For the same swing as an infinite-ER signal of average $\overline P$ (swing $2\overline P$), a finite-ER signal needs $\overline P'=\frac12\text{OMA}\frac{\text{ER}+1}{\text{ER}-1}$ with $\text{OMA}=2\overline P$, so $\overline P'/\overline P=(\text{ER}+1)/(\text{ER}-1)$ (L7 slide 7). It ignores the extra noise on the brighter 0, which is fine for p-i-n receivers.
>
> **Offset.** With the threshold shifted by $\delta v^{pp}$, the level on the near side is only $v^{pp}/2-\delta v^{pp}$ away. Restoring $v^{pp}/2$ there needs $v'^{pp}=v^{pp}(1+2\delta)$ (L4 slide 50), slightly conservative because the far level improved.
>
> **RIN.** The laser's own intensity noise is proportional to the signal: $\overline{i^2_{n,RIN}}=\text{RIN}\cdot I^2_{PIN}BW_n$, so $\text{SNR}=1/(\text{RIN}\cdot BW_n)$ cannot be improved by more power (L8 slide 15).

### Optimum Bandwidth and Its Allocation

$$
\boxed{f_{3dB,RX}\approx(0.6\text{ to }0.7)\,B,\qquad \frac1{BW^2}\approx\frac1{BW_1^2}+\frac1{BW_2^2}+\cdots}
$$

- White noise falls as $\sqrt{BW}$, so a narrower receiver is more sensitive until ISI takes over near $\tfrac23B$ (L4 slides 58, 66). A $B/3$ receiver costs about 1.5 dB and becomes very jitter-sensitive (slide 67).
- Allocation (L4 slide 69): a wide chain plus a precise Bessel-Thomson filter (below 2.5 Gb/s); the **TIA sets the bandwidth** (more TIA gain, less noise; the LA must be much wider); or **all blocks similar** (above 10 Gb/s, no room to over-design).
- With little input ISI, the **matched filter** for NRZ is a one-bit integrator ($BW_n=B/2$, $f_{3dB}=0.443B$): the [[#Integrating Receiver]] (L4 slides 71–72).

> [!tip] Remark
> The same noise-versus-ISI optimum appears for the electrical receiver in [[Receivers#Front-End Noise and the Optimum Bandwidth]]; with significant ISI the answer there is equalization ([[Equalization]]), which optical receivers now use too ([[#Low-Bandwidth TIA with Equalization]]).

## Level 4: Transimpedance Amplifiers

$$
\boxed{Z_T=\frac{v_{out}}{i_{in}}\quad(\Omega,\ \text{or dB}\Omega=20\log Z_T)}
$$

The goal: **high transimpedance and low input resistance** at once, without compressing on large inputs (L5 slide 5).

### The Resistive Front End: Why a TIA

$$
\boxed{R_T=R_{in}=R_L,\qquad BW_{3dB}=\frac1{2\pi R_LC_D},\qquad i_{n,in,rms}=\frac{\sqrt{kT/C_D}}{R_L}}
$$

One resistor sets gain, bandwidth and noise together: raise $R_L$ for gain and less noise, lose bandwidth (L5 slide 7). Everything below decouples them. (With a sub-fF waveguide detector, though, a resistive front end can be the optimum: [[#Level 8 Silicon Photonics and Integration]].)

> [!tip] Remark
> $\sqrt{kT/C}$ is the [[Noise#kT/C Noise]] result: the total noise of an RC is independent of $R$. Dividing by $R_L$ refers it to the input, so the larger $R_L$, the lower the input noise current.

### Shunt-Feedback TIA

```tikz title="Shunt-feedback TIA. The photodiode current flows into the summing node; R_F around an inverting gain -A sets v_out = -R_T i_in and divides the input resistance by A+1. C_T = C_D + C_I is the total input capacitance. After Palermo ECEN689 L5 slides 15-16 (Sackinger)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3.2) node[vcc]{$V_{PD}$} -- (0,2.8);
  \draw (0,2.8) to[empty photodiode,invert] (0,1.2);
  \draw (0,2.8) -- (1.1,2.8) to[C,l=$C_D$] (1.1,1.2) -- (0,1.2);
  \draw[->,thick] (-0.5,2.1) -- (-0.5,1.5) node[left] {$i_{in}$};
  \draw (0,1.2) -- (0,0) -- (3.2,0) coordinate (X);
  \draw (2.2,0) to[C,l_=$C_I$] (2.2,-1.6) node[ground]{};
  \draw (X) -- (3.4,0);
  \draw[thick] (3.4,0.8) -- (3.4,-0.8) -- (4.9,0) -- cycle;
  \node at (3.95,0) {$-A$};
  \draw (4.9,0) -- (6.4,0) node[right] {$v_{out}$};
  \draw (3.0,0) -- (3.0,1.6) to[R,l=$R_F$] (5.8,1.6) -- (5.8,0);
  \fill (3.0,0) circle (1.5pt); \fill (5.8,0) circle (1.5pt); \fill (2.2,0) circle (1.5pt);
  \draw[->] (2.55,0.6) -- (2.92,0.1);
  \node[font=\scriptsize] at (2.45,0.8) {$R_{in}$};
\end{circuitikz}
\end{document}
```

With an infinite-bandwidth amplifier (L5 slide 15):

$$
\boxed{Z_T(s)=-\frac{R_T}{1+s/\omega_p},\qquad R_T=\frac{A}{A+1}R_F,\qquad R_{in}=\frac{R_F}{A+1},\qquad \omega_p=\frac{A+1}{R_F(C_D+C_I)}}
$$

- The input pole moves out by $A+1$ while the gain stays about $R_F$.
- $R_F$ can be large without a headroom cost: it carries only signal current.

> [!tip] Remark
> This is shunt-shunt (voltage-current) feedback, [[Feedback#Voltage–current (shunt–shunt)]], where the photodiode TIA is already the example: $R_{in}$ and $R_{out}$ divide by $1+T$. What that note doesn't cover, and this one does, is the finite-bandwidth amplifier, the transimpedance limit and the noise.

### Finite Amplifier Bandwidth: Second Order, and Stability with $C_{PD}$

With $A(s)=A/(1+sT_A)$ (L5 slide 16):

$$
\boxed{Z_T(s)=-\frac{R_T}{1+\frac{s}{\omega_0Q}+\frac{s^2}{\omega_0^2}},\qquad \omega_0=\sqrt{\frac{A+1}{R_FC_TT_A}},\qquad Q=\frac{\sqrt{(A+1)R_FC_TT_A}}{R_FC_T+T_A}}
$$

```tikz title="Transimpedance against frequency as the amplifier time constant T_A grows (A = 3, R_F C_T fixed): exact second-order magnitudes for T_A = 0, R_F C_T/(3A+1) (Bessel), R_F C_T/2A (Butterworth), R_F C_T/A and 2R_F C_T/A. A slower amplifier first extends the bandwidth, then peaks. Same T_A values as Palermo L5 slide 17 (Sackinger)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.62cm,y=0.42cm]
  \draw[->] (0,-6.5) -- (10.6,-6.5) node[right] {$\omega R_FC_T$};
  \draw[->] (0,-6.5) -- (0,3.0) node[above] {$|Z_T|/R_T$ (dB)};
  \foreach \y in {-6,-3,0,2} \draw (0,\y) -- (-0.15,\y) node[left,font=\scriptsize] {\y};
  \foreach \x in {2,4,6,8,10} \draw (\x,-6.5) -- (\x,-6.7) node[below,font=\scriptsize] {\x};
  \begin{scope}
  \clip (0,-6.5) rectangle (10.4,3);
  \draw[thick,gray,domain=0:10,samples=60] plot (\x,{-10*log10(1+(\x/4)^2)});
  \foreach \t/\c in {0.1/blue!70!black,0.1667/green!50!black,0.3333/orange!80!black,0.6667/red!70!black} {
    \draw[thick,\c,domain=0:10,samples=120] plot (\x,{-10*log10((1-\x*\x*\t/4)^2+(\x*(1+\t)/4)^2)});
  }
  \end{scope}
  \draw[dashed] (0,-3) -- (10.2,-3);
  \node[font=\scriptsize,anchor=west,align=left] at (6.3,1.2) {\textcolor{gray}{$T_A=0$: one pole}\\\textcolor{blue!70!black}{$T_A=\frac{R_FC_T}{3A+1}$: Bessel, $Q=0.58$}\\\textcolor{green!50!black}{$T_A=\frac{R_FC_T}{2A}$: Butterworth, $Q=0.71$}\\\textcolor{orange!80!black}{$T_A=\frac{R_FC_T}{A}$: $Q=0.87$}\\\textcolor{red!70!black}{$T_A=\frac{2R_FC_T}{A}$: $Q=0.98$, peaking}};
\end{circuitikz}
\end{document}
```

- A non-zero $T_A$ **raises** the bandwidth (by $\sqrt2$ at Butterworth) but too much of it peaks in frequency and rings in time. Pick **Butterworth** ($Q=1/\sqrt2$, flat magnitude) or **Bessel** ($Q=1/\sqrt3$, flat group delay, least data-dependent jitter) (L5 slide 17).
- **$C_{PD}$ is in the loop.** The two poles are the input node ($R_FC_T$) and the amplifier ($T_A$); their ratio sets $Q$. A larger photodiode moves the input pole down and *raises* $Q$: a TIA tuned for one detector rings with a bigger one. The common-gate front end ([[#Common-Gate and Regulated-Cascode Front Ends]]) and series inductors exist to isolate $C_{PD}$ from the loop (L5 slides 30–31).

> [!tip] Remark
> This is [[Feedback#Second-order loop]] exactly: loop gain $A$, dominant pole $1/(R_FC_T)$, second pole $\omega_A$. $Q=0.71$ is a phase margin of about 65°, $Q=0.58$ about 70° ([[Stability#Definition and peaking]]).

### The Transimpedance Limit

$$
\boxed{R_T\le\frac{A\,\omega_A}{C_T\,\omega_{3dB}^2}=\frac{\text{GBW}_{amp}}{2\pi\,C_T\,f_{3dB}^2}}
$$

- Maximum transimpedance is proportional to the amplifier's **gain-bandwidth**. If that GBW is pinned by $f_T$, then **doubling the data rate quarters $R_T$** (L5 slide 18; Mohan 2000). This is why TIA efficiency degrades with scaling, and why LAs need more stages behind a TIA (Palermo 2008 §IV).
- The derivation is in [[#Mapping link specs to amplifier specs]].

### Input-Referred Noise Current

$$
\boxed{\overline{I^2_{n,TIA}}(f)=\frac{4kT}{R_F}+2qI_G+\frac{4kT\Gamma}{g_mR_F^2}+\frac{4kT\Gamma\,(2\pi C_T)^2}{g_m}f^2}
$$

```tikz title="Input-referred noise current density of a FET feedback TIA. R_F gives a flat floor; the FET channel noise is flat at low frequency and rises as f^2 above 1/(R_F C_T); the TIA's own response then cuts it off near sqrt(2) A/(R_F C_T). The f^2 rise begins below the TIA bandwidth. After Palermo L5 slide 28 (Sackinger)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.5,0) node[right] {$\log f$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$\log\overline{I^2_{n,TIA}}$};
  \draw[thick,blue!70!black] (0,1.6) -- (7.8,1.6);
  \node[blue!70!black,font=\scriptsize,anchor=south west] at (0.2,1.85) {$4kT/R_F$};
  \draw[thick,orange!80!black] (0,0.7) -- (2.4,0.7) -- (6.4,4.0) node[above,font=\scriptsize] {FET channel, $\propto C_T^2f^2/g_m$};
  \draw[very thick,red!70!black] (0,1.75) -- (3.2,1.75) .. controls (3.8,1.8) and (4.1,2.1) .. (4.6,2.6) -- (5.6,3.4);
  \draw[dashed,thick] (0,3.6) -- (5.6,3.6) -- (7.4,0.4) node[right,font=\scriptsize] {TIA response};
  \draw[dotted] (2.4,0.7) -- (2.4,0) node[below,font=\scriptsize] {$\frac{1}{R_FC_T}$};
  \draw[dotted] (5.6,3.6) -- (5.6,0) node[below,font=\scriptsize] {$\frac{\sqrt2A}{R_FC_T}$};
  \node[font=\scriptsize,red!70!black,anchor=north west] at (4.3,2.2) {total};
\end{circuitikz}
\end{document}
```

- **Feedback resistor**: white, $4kT/R_F$. A bigger $R_F$ is quieter (and slower).
- **Gate shot noise** $2qI_G$: negligible in CMOS (BJT TIAs have base shot noise here).
- **FET channel noise** $4kT\Gamma g_m$ ($\Gamma$ 0.7–3 by process) referred to the input through $\frac{1+j2\pi fR_FC_T}{g_mR_F}$: a white part and an **$f^2$ part with weight $C_T^2/g_m$** (L5 slides 25–28).
- So **the input capacitance is the noise**: $C_T=C_{PD}+C_I$ multiplies $f^2$, while $g_m$ divides it. Raising $g_m$ by widening the device also raises $C_I$; the optimum is $C_I$ near the lumped capacitance $C_{PD}$ + pad + wiring (Palermo 2011 p. 323).

> [!note]- Derivation: input-referring the FET channel noise (L5 slide 27)
> Ground the output (equivalent to dividing the output noise by $Z_T$, and easier). A noise current $i_{n,TIA}$ at the input develops $v_{gs}=i_{n,TIA}/(sC_T+1/R_F)$ across $C_T\parallel R_F$; the device turns it into $g_mv_{gs}$. Setting that equal to the channel noise $i_{n,D}$:
> $$\frac{i_{n,D}}{i_{n,TIA}}=\frac{g_mR_F}{1+sR_FC_T}\ \Rightarrow\ \overline{I^2_{n,front,D}}=\frac{1+(2\pi fR_FC_T)^2}{(g_mR_F)^2}4kT\Gamma g_m=\frac{4kT\Gamma}{g_mR_F^2}+\frac{4kT\Gamma(2\pi C_T)^2}{g_m}f^2.$$

> [!tip] Remark
> The $4kT\Gamma g_m$ source is [[Noise#MOSFET Channel Thermal Noise]] ($\Gamma=\gamma$); the "ground the output" trick is the input-referral procedure of [[Noise#Input-Referred Voltage and Current]]. An open-input TIA must be described by a noise *current*, and a capacitive source makes that current grow with frequency.

### The Transistor-Level Feedback TIA and the Headroom Problem

```tikz title="Classic CMOS feedback TIA: M1 is a common-source gain stage (A = g_m1 R_D), M2 a source follower that buffers the output and isolates R_F from R_D. Inputs and outputs sit at the DC level V_GS1 because R_F carries no DC current. After Palermo L5 slides 19 and 39 (Razavi)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (3,1) node[nmos](M1){};
  \node[anchor=west] at ([xshift=2pt]M1.east) {$M_1$};
  \draw (M1.S) node[ground]{};
  \draw (M1.D) -- ++(0,0.5) coordinate (VA) to[R,l_=$R_D$] ++(0,1.6) coordinate (TOP);
  \draw (TOP) node[vcc]{$V_{DD}$};
  \node[anchor=east] at ([xshift=-2pt]VA) {$V_A$};
  \draw (VA) -- ++(1.2,0) coordinate (G2);
  \draw (G2) node[nmos,anchor=G](M2){};
  \node[anchor=west] at ([xshift=2pt]M2.east) {$M_2$};
  \draw (M2.D) |- (TOP);
  \draw (M2.S) -- (M2.S |- 0,-0.9) coordinate (O);
  \draw (O) to[I] ++(0,-1.5) node[ground]{};
  \draw (O) -- ++(1.2,0) node[right] {$v_{out}$};
  \draw (M1.G) -- ++(-0.8,0) coordinate (IN);
  \draw (IN) |- (1.6,-0.9) to[R,l_=$R_F$] (O);
  \draw (IN) ++(0,2.0) coordinate (PDT) to[empty photodiode,invert] (IN);
  \draw (PDT) node[above] {$V_{PD}$};
  \draw (PDT) -- ++(-1.1,0) to[C,l_=$C_D$] ++(0,-2.0) -- (IN);
  \fill (VA) circle (1.5pt); \fill (IN) circle (1.5pt); \fill (O) circle (1.5pt);
  \node[font=\scriptsize,align=left,anchor=west] at (7.4,2.6) {$A=g_{m1}R_D$\\[2pt]$R_T=\frac{g_{m1}R_D}{1+g_{m1}R_D}R_F$\\[2pt]$R_{in}=\frac{R_F}{1+g_{m1}R_D}$\\[2pt]$R_{out}=\frac{1}{g_{m2}(1+g_{m1}R_D)}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_A=V_{GS1}+V_{GS2}\approx0.8V_{DD},\qquad A\approx g_{m1}R_D=\frac{\alpha(V_{DD}-V_A)}{V_{OD}}\approx\frac{\alpha\cdot0.2V_{DD}}{V_{OD}}}
$$

- The drain must sit two $V_{GS}$ up, leaving about $0.2V_{DD}$ across $R_D$: at 1 V, $A\approx2$–3 (L5 slide 39). Low $A$ hurts every result above: $R_T$ falls below $R_F$, $R_{in}$ rises, the transimpedance limit tightens.
- **Inverter-based TIA**: an NMOS/PMOS inverter with $R_F$ needs no $R_D$ headroom and both devices add $g_m$; cascaded inverter $g_m$ + TIA stages add gain, and a slow loop sets the output common mode (L5 slide 20, Li 2014).

> [!note]- Derivation: $V_A$ and the gain (L5 slide 39)
> No DC current flows in $R_F$, so input and output sit at the same DC voltage. The input is at $V_{GS1}$ (M1's gate), so the output is too; M2's gate, $V_A$, is one $V_{GS2}$ above it. Then $V_{DD}-V_A$ is what remains for $R_D$, and with $g_{m1}=\alpha I_D/V_{OD}$-type square-law scaling ($\alpha\approx2$), $A=g_{m1}R_D=\alpha I_DR_D/V_{OD}=\alpha(V_{DD}-V_A)/V_{OD}$.

### Common-Gate and Regulated-Cascode Front Ends

```tikz title="Left: common-gate TIA, R_in about 1/g_m and R_T = R_D, decoupled. Right: regulated cascode (RGC): the common-source booster M_B drives M1's gate, multiplying its g_m and dividing R_in by (1 + g_mB R_B). After Palermo L5 slides 9-12 (Razavi; Park 2000)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % CG TIA
  \draw (1.5,1.9) node[nmos,xscale=-1](M){};
  \node[anchor=west] at ([xshift=2pt]M.G) {$V_B$};
  \draw (M.D) -- ++(0,0.4) coordinate (D) to[R,l_=$R_D$] ++(0,1.4) node[vcc]{$V_{DD}$};
  \draw (D) -- ++(1.0,0) node[right] {$v_{out}$};
  \draw (M.S) -- ++(0,-0.5) coordinate (S);
  \draw (S) to[I,l=$I_B$] ++(0,-1.6) node[ground]{};
  \draw (S) -- ++(-1.5,0) coordinate (SI) to[I,l_=$i_{in}$,invert] ++(0,-1.6) node[ground]{};
  \draw[->] ([shift={(-0.9,0.5)}]S) -- ([shift={(-0.12,0.08)}]S);
  \node[font=\scriptsize] at ([shift={(-1.05,0.65)}]S) {$R_{in}$};
  \fill (S) circle (1.5pt);
  \node[font=\scriptsize,align=center] at (1.0,-2.6) {$R_T=R_D$, $R_{in}\approx\frac{1}{g_m+g_{mb}}$};
  % RGC
  \begin{scope}[xshift=6.0cm]
  \draw (1.5,1.9) node[nmos,xscale=-1](M1){};
  \node[anchor=east] at ([xshift=-2pt]M1.east) {$M_1$};
  \draw (M1.D) -- ++(0,0.4) coordinate (D2) to[R,l_=$R_1$] ++(0,1.4) node[vcc]{$V_{DD}$};
  \draw (D2) -- ++(-1.0,0) node[left] {$v_{out}$};
  \draw (M1.S) -- ++(0,-0.5) coordinate (S1);
  \draw (S1) to[R,l_=$R_S$] ++(0,-1.6) node[ground]{};
  \draw (S1) -- ++(-1.3,0) to[I,l_=$i_{in}$,invert] ++(0,-1.6) node[ground]{};
  \draw (4.0,0.0) node[nmos](MB){};
  \node[anchor=west] at ([xshift=2pt]MB.east) {$M_B$};
  \draw (MB.S) node[ground]{};
  \draw (MB.D) -- (MB.D |- 0,1.9) coordinate (DB) to[R,l_=$R_B$] ++(0,1.4) node[vcc]{$V_{DD}$};
  \draw (M1.G) -- (DB);
  \draw (S1) -- (2.6,0 |- S1) |- (MB.G);
  \fill (S1) circle (1.5pt); \fill (DB) circle (1.5pt);
  \node[font=\scriptsize,align=center] at (2.4,-2.6) {$Z_{in}(0)\approx\frac{1}{g_{m1}(1+g_{mB}R_B)}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{CG: }R_T=R_D,\ R_{in}=\frac{r_o+R_D}{1+(g_m+g_{mb})r_o}\approx\frac1{g_m},\qquad \frac{v_{out}}{i_{in}}=\frac{R_D}{\left(1+s\frac{C_{in}}{g_m+g_{mb}}\right)(1+sR_DC_{out})}}
$$

- **Common gate** decouples input resistance (bandwidth) from transimpedance, and is stable for any $C_{PD}$ (no loop) (L5 slides 9–10). But the bias source and $R_D$ inject noise straight into the input: $\overline{I^2_{n,in}}=4kT\left(\tfrac23g_{m2}+\tfrac1{R_D}\right)$, and $R_D$ is headroom-limited. Not for low noise (slide 11).
- **Regulated cascode (RGC)** boosts the effective $g_m$ by a local CS amplifier: lower $R_{in}$, at the cost of headroom and that amplifier's noise (slide 12, Park 2000). Kromer 2004 adds a further gain stage in the boost loop ($Z_i\approx1/[g_{m1}(1+|A_2A_3|)]$) and shunt-peaking loads: 20 GHz in 80 nm CMOS (slide 13).
- **CG + feedback** (Mohan 2000): a CG stage isolates $C_{PD}$ from the feedback TIA, so one TIA is stable over many detectors; $R_T$ is still about $R_FA/(1+A)$ (slide 30). **BJT common-base + feedback** (Li 2013): a transformer-coupled RGC input and a series input inductor that isolates $C_{PD}$; 26 GHz with under 19 ps group-delay variation (slide 31).

> [!tip] Remark
> The CG input resistance and noise are [[Single-Stage]]'s common-gate stage and [[Noise#Common Gate]]: a CG stage passes its load's noise current to the input unattenuated. The RGC is the gain-boosted ("regulated") cascode idea applied to the input instead of the output.

### Differential TIAs

| | Balanced ($C_X\approx C_D$) | Pseudo-differential ($C_X\to\infty$) |
|---|---|---|
| $Z_T=\frac{v_{OP}-v_{ON}}{i_i}$ | $\frac{\frac{A}{A+1}R_F}{1+\frac{sC_TR_F}{A+1}}$, same as single-ended | $\frac{\frac{2A}{A+2}R_F}{1+\frac{sC_TR_F}{A/2+1}}$, about double |
| Supply / substrate rejection | Best (matched transfer functions) | Poor |
| Noise | $\sqrt2\times$ the input-referred rms current (double circuitry) | Filters the dummy $R_F'$ noise |

(L5 slides 33–35.) A single-ended photocurrent swings the differential output from 0 to $V_{ppd}$; an **offset-control loop** (a slow error amplifier subtracting $I_{OS}$ from the input) centres it to $\pm V_{ppd}/2$ (slide 36).

> [!tip] Remark
> Why differential at all: [[Differential Amplifiers#What It Buys]] (supply and substrate rejection, and the LA, slicers and CML downstream are all differential).

### Low-Bandwidth TIA with Equalization

- Raise $R_F$ until the TIA is too slow for the data rate: $4kT/R_F$ falls, low-frequency input and post-amplifier noise falls too, and the main cursor grows. Then cancel the ISI with a **CTLE** (Li 2014, 25 Gb/s) or a **1-tap loop-unrolled DFE** (Ozkaya 2017, 64 Gb/s, which also needed a 2-tap TX FFE for a pre-cursor) (L5 slides 48–55).
- The DFE does not amplify noise, so as $R_F$ grows the SNR keeps improving as long as the DFE cancels the post-cursor (slide 54).

> [!tip] Remark
> The CTLE and DFE themselves are [[Equalization#CTLE]] and [[Equalization#Level 3 Decision-Feedback Equalization]]; their circuits are [[Receivers#CTLE Circuits]] and [[Receivers#Level 5 DFE Circuits]].

### Integrating Receiver

No linear high-gain element at all: the photocurrent and a feedback current $I_{avg}$ (an LPF loop tracks the average photocurrent) charge the input capacitance, and the voltage *change* over one bit is double-sampled and resolved by a sense amplifier. Five demultiplexed segments let each sense amplifier resolve at $B/5$ (L5 slides 40–42; Emami 2002; Palermo 2008).

$$
\boxed{\overline P_{avg}=\frac{\Delta V_b\,(C_{PD}+C_{in})}{\rho\,T_b}}
$$

- Palermo 2008 budget: sampler $\sqrt{2kT/C}=0.92$ mV, buffer 1.03 mV, sense-amp 0.45 mV, clock-jitter 0.65 mV at 16 Gb/s → $\sigma_{tot}=1.59$ mV; $\Delta V_b=6.4\sigma_{tot}+1.15$ mV offset $=11.9$ mV for $10^{-10}$. With 440 fF and 0.5 A/W: $-9.8$ dBm at 10 Gb/s, $-7.8$ dBm at 16 Gb/s (L5 slide 43).
- Sensitivity scales with $C_{PD}+C_{in}$ and $1/T_b$: excellent with a small integrated detector, poor with a 400 fF hybrid one. Dynamic range is set by the 0.6–1.1 V input window.

> [!tip] Remark
> The integrator is the matched filter for NRZ ([[#Optimum Bandwidth and Its Allocation]]). Its samplers and sense amplifier are [[Sampling Circuits]] and [[Comparators]]; the residual offset after capacitive trim is the same story as [[Receivers#Level 4 Offset Correction]].

## Level 5: Limiting Amplifiers

```tikz title="Limiting amplifier: n low-gain wideband stages raise the TIA output to slicer level; a slow loop (R_1 C_1 low-pass and error amplifier A_1) senses the output DC and cancels the input offset. After Palermo L6 slides 4, 11 and 34-35."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-1.2,0) node[left] {from TIA} -- (-0.2,0);
  \node[draw,circle,inner sep=1pt] (sum) at (0,0) {$+$};
  \foreach \i/\x in {1/1.2,2/2.8,3/4.4} {
    \draw[thick] (\x,0.6) -- (\x,-0.6) -- ({\x+1.0},0) -- cycle;
    \node[font=\scriptsize] at ({\x+0.33},0) {$A_s$};
  }
  \draw[->] (sum) -- (1.2,0); \draw (2.2,0) -- (2.8,0); \draw (3.8,0) -- (4.4,0);
  \node at (6.1,0) {$\cdots$};
  \draw (5.4,0) -- (5.75,0);
  \draw[thick] (6.5,0.6) -- (6.5,-0.6) -- (7.5,0) -- cycle;
  \draw (6.4,0) -- (6.5,0);
  \draw[->] (7.5,0) -- (8.8,0) node[right] {to slicer};
  \draw[|<->|] (1.2,1.0) -- node[above,font=\scriptsize] {$n\approx2\ln G$ stages, $A_s\approx\sqrt e$} (7.5,1.0);
  % offset loop
  \draw (8.2,0) |- (7.2,-1.6);
  \draw (7.2,-1.6) to[R,l_=$R_1$] (5.6,-1.6) coordinate (F);
  \draw (F) to[C,l=$C_1$] (5.6,-3.0) node[ground]{};
  \draw (F) -- (4.6,-1.6);
  \draw[thick] (4.6,-1.0) -- (4.6,-2.2) -- (3.4,-1.6) -- cycle;
  \node[font=\scriptsize] at (4.2,-1.6) {$A_1$};
  \draw[->] (3.4,-1.6) -| (sum.south);
  \node[font=\scriptsize,align=left,anchor=north west] at (-1.3,-2.2) {$f_{LF}=\frac{1+AA_1/2}{2\pi R_1C_1}$\\must sit below the data's\\lowest frequency};
\end{circuitikz}
\end{document}
```

### Gain from Many Stages

$$
\boxed{f_{tot}=f_s\sqrt{2^{1/n}-1},\qquad n_{opt}=2\ln G_{tot},\qquad A_{s,opt}=\sqrt e\approx1.65}
$$

- The LA raises the TIA output to a level the slicer resolves at the BER, with a bandwidth of 1–1.2× the data rate and group-delay variation under 10 % to limit data-dependent jitter (L6 slide 4).
- One stage's GBW is pinned near $f_T/3$, so a 30 dB, 10 GHz amplifier from a 200 GHz $f_T$ can't be one stage (2.1 GHz); 7 stages of 1.64 at 31 GHz each do it (L6 slide 5).
- The optimum is flat: fewer stages lose little bandwidth and save power and noise, so practical LAs use **3–7 stages** (slide 11). For $G=100$: $n_{opt}=9.2$, and 9 stages compress the bandwidth to 0.28 of one stage.

> [!note]- Derivation: the optimum stage count (L6 slides 8–10)
> With $A_s=G^{1/n}$ and $\omega_s=\text{GBW}_s/A_s$, $\omega_{tot}=\frac{\text{GBW}_s}{G^{1/n}}\sqrt{2^{1/n}-1}\approx\frac{\text{GBW}_s}{G^{1/n}}\sqrt{\frac{\ln2}{n}}$ (using $2^{1/n}-1\approx\ln2/n$). Minimize $\ln(1/\omega_{tot})=\tfrac12\ln n+\tfrac1n\ln G+\text{const}$: $\frac1{2n}-\frac{\ln G}{n^2}=0\Rightarrow n=2\ln G$, and then $\ln A_s=\ln G/n=\tfrac12$, $A_s=\sqrt e$.

> [!tip] Remark
> The bandwidth shrink factor is [[Frequency Response#Many Poles Cascading]]; each stage is a CML gain stage with the GBW limit of [[High-Speed Circuit Techniques#Level 2 The Gain-Bandwidth Limit of a CML Stage]].

### Bandwidth Extension

Each stage is widened by shunt, series, bridged and T-coil peaking (up to about 1.7× flat for shunt, 2.5× series, near 4× shunt-series or T-coil), or active tricks: negative Miller capacitance, a TIA load (Cherry-Hooper), active negative feedback (L6 slides 12–30). Galal 2003's 10 Gb/s LA stacks four of them; Proesel 2012 uses T-coils in every stage (slides 31–32).

> [!tip] Remark
> All of these are owned by [[High-Speed Circuit Techniques#Level 3 Bandwidth Extension]] ([[High-Speed Circuit Techniques#Shunt peaking]], [[High-Speed Circuit Techniques#T-coils at the pad]], [[High-Speed Circuit Techniques#Cherry-Hooper (Gm-TIA)]], [[High-Speed Circuit Techniques#Neutralization and negative capacitance]]).

### Offset Compensation

$$
\boxed{V_{os}'\approx\sqrt{\left(\frac{V_{os}}{AA_1}\right)^2+V_{os1}^2},\qquad f_{LF}=\frac{1+AA_1/2}{2\pi R_1C_1}}
$$

- A DC loop around the LA divides its own offset by the loop gain, but the **error amplifier's offset $V_{os1}$ passes straight through** (L6 slide 34). Size or trim the error amplifier, not the LA.
- The loop is a high-pass on the data: $f_{LF}$ must be far below the data's lowest frequency (long runs), which needs large $R_1C_1$; designs use Miller multiplication around the error amplifier to shrink it (slide 35).

> [!tip] Remark
> The required offset comes from the penalty table: $\delta=(\text{PP}-1)/2$ of the swing at sensitivity, about 70 µV in the [[#Worked example a 10 Gb/s TIA + LA receiver|worked example]]. Mismatch-limited offset and why one trims instead of sizing: [[Nonlinearity and Mismatch]] and [[Receivers#Why Trim Instead of Size]].

## Level 6: Laser and VCSEL Drivers

### Semiconductor Lasers

A laser is an optical oscillator: a gain medium, a pump (here a forward current through a direct-bandgap junction, GaAs or InP, never Si) and a cavity for feedback (L8 slides 3–4).

| | Edge emitter (FP, DFB) | VCSEL |
|---|---|---|
| Emission | From the cleaved edge, elliptical beam | From the top surface, circular beam |
| Arrays, test | Hard; tested after dicing | 2-D arrays; wafer-scale test |
| Current | Higher | Low threshold (small cavity) |
| Typical use | 1310/1550 nm SMF; DFB is single-longitudinal-mode | 850 nm MMF, short reach |

(L8 slide 5; Palermo 2011 §9.5.2.) A DFB can be monolithically integrated with an EAM (EML) or an MZM on InP (L16 slides 56, 59).

$$
\boxed{P_o=\eta\,(I-I_{TH}),\qquad BW\propto\sqrt{I_{avg}-I_{TH}},\qquad \text{MTTF}\propto\frac{1}{J^2}e^{\frac{E_A}{k}\left(\frac1{T_j}-\frac1{373}\right)}\Rightarrow\text{MTTF}\propto\frac1{BW^4}}
$$

- **Threshold and slope efficiency**: e.g. $I_{TH}=700$ µA, $\eta=0.37$ mW/mA (L16 slide 50).
- **Bandwidth rises with bias** because the relaxation-oscillation frequency of the carrier-photon rate equations goes as $\sqrt{I-I_{TH}}$; low bias is underdamped and slow (L16 slide 51; Palermo 2008 Eq. 1). State of the art: 39 GHz at 9 mA; 200 Gb/s PAM4 with a 7-tap TX FIR, 2.2 dB ER (L16 slide 51).
- **Reliability** falls as current density squared, so bandwidth costs lifetime to the fourth power (Palermo 2008 Eqs. 2–3). Biasing far above threshold also **lowers ER** (L16 slide 51).
- **Turn-on delay** below threshold, $t_d=\tau_{sp}\ln\frac{I_1-I_0}{I_1-I_{TH}}$, is data-dependent jitter: always keep $I_0>I_{TH}$ (L8 slide 13).
- **Electrical model**: pad capacitance, DBR mirror series resistance (50–150 Ω) and a bias-dependent junction RC (0.5–1 pF for a 10 Gb/s 850 nm VCSEL) (Palermo 2008 §III); about 6.5 GHz above 3 mA for a 10 Gb/s part (L8 slide 9).
- **Chirp** ($\alpha>0$) and **RIN** come with direct modulation (L8 slides 14–16); temperature shifts the L-I-V curve and the bandwidth (slide 17).

> [!note]- Detail: the rate equations (L8 slides 9–11)
> $\frac{dN}{dt}=\frac{I}{qV}-\frac{N}{\tau_{sp}}-GNN_p$ (injection, spontaneous/non-radiative loss, stimulated emission) and $\frac{dN_p}{dt}=GNN_p+\beta\frac{N}{\tau_{sp}}-\frac{N_p}{\tau_p}$ (stimulated and spontaneous gain, photon loss). Linearizing about a DC photon density $N_{p,dc}$ gives a second-order response with resonance $\omega_R^2\approx GN_{p,dc}/\tau_p\propto I_{avg}-I_{TH}$: the source of $BW\propto\sqrt{I_{avg}-I_{TH}}$ and of the ringing on a step.

### The Current-Mode Driver

```tikz title="Current-mode VCSEL driver: a differential pair steers I_mod between the VCSEL and a dummy load, and a static source I_bias keeps the VCSEL above threshold. The laser and dummy sit on a separate higher supply (LV_DD) for the VCSEL's knee voltage. After Palermo 2011 Fig. 9.28(b) and Palermo 2008 Fig. 4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,4.6) node[vcc]{$LV_{DD}$} -- (0,4.4) -- (3.2,4.4);
  \draw (3.2,4.6) node[vcc]{$LV_{DD}$} -- (3.2,4.4);
  \draw (0,4.4) to[empty led,l_=VCSEL] (0,2.6) coordinate (A);
  \draw (3.2,4.4) to[R,l=dummy] (3.2,2.6) coordinate (B);
  \draw (0,1.6) node[nmos,anchor=D](M1){};
  \draw (3.2,1.6) node[nmos,anchor=D,xscale=-1](M2){};
  \draw (M1.D) -- (A); \draw (M2.D) -- (B);
  \node[anchor=east] at (M1.G) {$D^+$};
  \node[anchor=west] at (M2.G) {$D^-$};
  \draw (M1.S) -- (0,0.4) -- (3.2,0.4) -- (M2.S);
  \draw (1.6,0.4) to[I,l=$I_{mod}$] (1.6,-1.1) node[ground]{};
  \draw (A) -- (-1.6,2.6) to[I,l_=$I_{bias}$] (-1.6,0.4) node[ground]{};
  \fill (A) circle (1.5pt);
  \node[red!70!black,font=\scriptsize] at (1.2,3.1) {$P_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.6,3.4) {DC-coupled:\\$I_{L,0}=I_B$, $I_{L,1}=I_B+I_M$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.6,2.0) {AC-coupled:\\$I_{L,0}=I_B-\frac{I_M}{2}$, $I_{L,1}=I_B+\frac{I_M}{2}$};
\end{circuitikz}
\end{document}
```

- **Current mode** because the L-I relation is linear: the driver sets current, the laser converts it (L8 slide 20).
- **DC coupled**: $I_B$ is the 0-level current; **AC coupled**: $I_B$ is the average (L8 slide 21).
- **Termination**: bond wires and laser/line mismatch reflect; on-die (back) termination fixes it at a power cost, so high-power lasers use **active back-termination**, where the terminating resistor sees an AC voltage from a replica stage and ideally carries no current (L8 slides 22–23).
- **Headroom**: the VCSEL knee (about 1.5 V) exceeds a 1 V core supply, so the output pair and dummy (diode-connected thick-oxide NMOS) run from 2.8 V; $I_{bias}$ and leakage keep enough drop across them to avoid stressing the output devices (Palermo 2008 §III).

> [!tip] Remark
> This is the CML driver of [[Transmitters#Current mode (CML)]] with a laser as the load and an extra DC source. The pair must switch fully ([[Differential Amplifiers#Large-Signal Characteristic]]), and the output's speed is set by the laser's RC as much as by the driver.

### Pre-Emphasis and Nonlinear Equalization

- A current-summing **FIR** in the driver equalizes the VCSEL's own response: Palermo's 4-tap (1 pre, main, 2 post) tap muxes are a quarter of the main tap's size (Palermo 2008 Fig. 4).
- At 16 Gb/s, 6.2 mA average, ER 3 dB: no EQ $I_{DC}=4.37$ mA, $I_{MOD}=3.66$ mA; with EQ $I_{DC}=3.48$ mA and taps $I_{-1}=-0.70$, $I_0=4.36$, $I_1=-0.19$, $I_2=0.19$ mA. The vertical eye opens 45 % at the **same average current**, so the same lifetime (L8 slide 28).
- At 14 Gb/s the FIR runs the VCSEL at 35 % less average current for a potential 138 % MTTF increase, and extends the maximum rate from 14 to 18 Gb/s (Palermo 2008 Fig. 6).
- The VCSEL's bias-dependent response makes rising and falling pulses differ, so a **linear** FIR saturates in benefit. **Nonlinear FFEs** use different taps for high and low pulses (Raj 2015); for PAM4, a 2.5-tap version with the pre-cursor depending only on the MSB, from a 32×3 LUT driving a 5-bit current DAC (Tyagi 2018, 50 Gb/s) (L8 slides 30–33).
- **PAM4 laser pre-distortion**: an EML's transfer curve is nonlinear, so equally spaced electrical levels give unequal optical ones. Lee 2015 squeezes the middle levels by moving the MSB:LSB current ratio off 2:1 with two iDACs, with 100 % adjustable range (Lee Fig. 6; Sec. III-A).

> [!tip] Remark
> The FIR itself (taps, peak-power constraint) is [[Equalization#Level 1 TX FFE]]; the segmented current-DAC driver that implements it is [[Transmitters#Level 3 FFE Drivers]]; the MSB:LSB ratio knob is [[Transmitters#Pre-distortion]]. What is optical here is the reason: the "channel" being equalized is the laser.

## Level 7: Modulator Drivers

External modulation: a CW laser at constant power and a separate device that changes absorption (EAM) or phase (MZM, ring). No chirp from the laser, wider bandwidth, but an extra component, coupling loss, and the modulator OMA penalty (L16 slides 44–47; Palermo 2011 §9.5.2).

### Mach-Zehnder Modulator

```tikz title="Left: MZM intensity transfer P_out/P_in = (1 + cos(pi V_M / V_pi))/2. Biased at quadrature, a swing of plus or minus Delta V gives P_1 and P_0. Right: travelling-wave driver: a CML stage on a separate high supply MV_DD drives terminated electrode lines; thick-oxide cascodes protect the core devices. After Palermo L16 slide 52 and Palermo 2011 Fig. 9.30."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.6,0) node[right] {$V_M$};
  \draw[->] (0,0) -- (0,3.2) node[above] {$P_{out}/P_{in}$};
  \draw[thick,blue!70!black,domain=0:5.2,samples=80] plot (\x,{1.25*(1+cos(deg(pi*\x/2.6)))});
  \draw (0,2.5) -- (-0.1,2.5) node[left,font=\scriptsize] {1};
  \draw (2.6,0) -- (2.6,-0.1) node[below,font=\scriptsize] {$V_\pi$};
  \draw (5.2,0) -- (5.2,-0.1) node[below,font=\scriptsize] {$2V_\pi$};
  \draw (1.3,0) -- (1.3,-0.1) node[below,font=\scriptsize] {$\frac{V_\pi}2$};
  \fill (1.3,1.25) circle (2pt);
  \draw[dashed] (0.75,0) -- (0.75,2.0); \draw[dashed] (1.85,0) -- (1.85,0.5);
  \draw[dashed] (0,2.0) node[left,font=\scriptsize] {$P_1$} -- (0.75,2.0);
  \draw[dashed] (0,0.5) node[left,font=\scriptsize] {$P_0$} -- (1.85,0.5);
  \draw[<->] (0.75,-0.75) -- node[below,font=\scriptsize] {$2\Delta V$} (1.85,-0.75);
  \node[font=\scriptsize,anchor=west] at (1.45,1.45) {quadrature bias};
  % driver
  \begin{scope}[xshift=8.0cm,yshift=-0.4cm]
  \draw (0,0.6) node[nmos](M1){}; \draw (2.0,0.6) node[nmos,xscale=-1](M2){};
  \node[anchor=east] at (M1.G) {$D^+$}; \node[anchor=west] at (M2.G) {$D^-$};
  \draw (M1.D) -- ++(0,0.3) coordinate (a1); \draw (M2.D) -- ++(0,0.3) coordinate (a2);
  \draw (a1) node[nmos,anchor=S](C1){}; \draw (a2) node[nmos,anchor=S,xscale=-1](C2){};
  \node[anchor=east,font=\scriptsize] at (C1.G) {$V_{CAS}$}; \node[anchor=west,font=\scriptsize] at (C2.G) {$V_{CAS}$};
  \draw (C1.D) -- ++(0,0.3) coordinate (L) to[R,l=$R_L$] ++(0,1.3) node[vcc]{$MV_{DD}$};
  \draw (C2.D) -- ++(0,0.3) coordinate (R) to[R,l_=$R_L$] ++(0,1.3) node[vcc]{$MV_{DD}$};
  \draw (L) -- ++(0.6,0) node[right,font=\scriptsize] {$v_o^-$};
  \draw (R) -- ++(0.6,0) node[right,font=\scriptsize] {$v_o^+$};
  \draw (M1.S) -- (M1.S |- 0,-0.5) -- (M2.S |- 0,-0.5) -- (M2.S);
  \draw (1.0,-0.5) to[I,l=$I_{mod}$] ++(0,-1.3) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.0,-3.0) {thick-oxide cascodes\\on a separate $MV_{DD}$};
  % electrode
  \draw (4.0,3.5) node[left,font=\scriptsize] {$v_o^+$} to[TL] (6.4,3.5) to[R,l=$R_L$] (6.4,5.1) node[vcc]{$MV_{DD}$};
  \draw (4.0,1.8) node[left,font=\scriptsize] {$v_o^-$} to[TL] (6.4,1.8) -- (7.3,1.8) to[R,l_=$R_L$] (7.3,4.6) -- (7.3,5.1) -- (6.4,5.1);
  \fill[orange!30] (4.3,2.35) rectangle (6.1,2.95);
  \node[font=\scriptsize] at (5.2,2.65) {MZM arms};
  \node[font=\scriptsize,align=center] at (5.4,1.0) {electrode lines,\\far-end terminated};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{P_{out}}{P_{in}}=\frac12\left[1+\cos\left(\pi\frac{V_M}{V_\pi}\right)\right],\qquad \alpha=\frac{v_1+v_2}{v_1-v_2}}
$$

- The light is split, phase-shifted in each arm, and recombined; 0° relative phase is a 1, 180° a 0 (L9 slides 3–5). Biased at quadrature ($V_\pi/2$), Palermo 2011 writes the same curve as $0.5[1+\sin(\pi V_{swing}/V_\pi)]$ (Eq. 9.7).
- **Single drive** needs the full $V_\pi$ on one arm and chirps; **dual (push-pull) drive** needs only $\pm V_\pi/2$ per arm and with equal swings is ideally chirp-free (L9 slides 6, 8).
- **$V_\pi L$ is the figure of merit**: lithium niobate 14 V·cm, depletion-mode Si 4 V·cm (L9 slide 7); recent SiP 1.5–2 V·cm with $V_\pi=6$–7 V and 30–35 GHz (L16 slide 53); InP 0.55 V·cm, $V_\pi=2$ V (slide 56); TFLN 3.1 V·cm at 110 GHz (slide 57). Silicon uses the **plasma-dispersion effect** in a reverse-biased p-n junction, which also changes loss (L9 slides 9–10).
- **mm-long devices are transmission lines**: the driver launches onto terminated electrodes and must match the electrical velocity to the optical one (**travelling-wave** drive, L9 slides 7, 12). Analui 2006 drove a depletion MZM with 5 Vppd. A **distributed** driver segments the electrode and drives each piece with a CMOS-style stage (Cignoli 2015), natural in a monolithic process (slide 13).
- **PAM4**: an electrical DAC (one driver, multi-level swing) or an **optical DAC** (segmented MSB/LSB electrodes, velocity mismatch between segments); a 56 Gb/s 16 nm prototype reached 9.5 dB ER at 12.6 pJ/b including clocking (L9 slides 14–16). Automatic bias control holds quadrature (slide 18).

> [!note]- Worked: swing → ER and OMA penalty for a SiP MZM (my calculation)
> $V_\pi=6.5$ V (middle of L16's 6–7 V). Push-pull, quadrature bias, $V_M=\pm1$ V (2 Vppd): $P_{1,0}/P_{in}=\tfrac12[1\pm\sin(\pi/6.5)]=0.732,\ 0.268$, so ER $=2.7$ (4.4 dB) and $\text{OMA}=0.46P_{in}$: a 3.3 dB OMA penalty before insertion loss. At 4 Vppd: ER 10.3 dB, OMA $0.82P_{in}$, 0.85 dB. With a 50 Ω back-termination and a 50 Ω far-end termination, each side sees 25 Ω, so a 1 V swing per side costs $I_{mod}=40$ mA from $MV_{DD}$: why MZM transmitters spend hundreds of mW (275–708 mW in L9 slide 16).

### Electro-Absorption Modulator

- A reverse-biased p-i-n whose absorption edge moves with field: **Franz-Keldysh** (bulk, weak) or **quantum-confined Stark effect** in multiple quantum wells (stronger) (L10 slide 4). Chirp is small ($|\alpha|<1$) and a 0–1 V on-state bias minimizes it at more insertion loss (slide 8).
- **Switching voltage** $V_{SW}$ for a given ER: 1.5–4 V; swing 0.2–3 V; bias 0–1 V (L10 slides 7, 9). Electrically a diode capacitance plus a voltage-dependent photocurrent (slide 10).
- **Waveguide EAMs** give higher ER (longer absorption) but need controlled-impedance (terminated, power-hungry) drivers; **surface-normal** and short (50 µm GeSi) devices are **lumped capacitors** driven by CMOS buffers, with $CV^2f$ power (L10 slides 5, 12–13; Palermo 2011 p. 318). Examples: 67 GHz hybrid InP EAM, 15 dB ER at 2 V drive and $-4$ V bias; 28 Gb/s GeSi, 3–6 dB ER at 3 V; Dupuis 2015, 8 dB ER at 2 Vpp with 5.4 V bias and about 7 dB insertion loss (L10 slides 11–12, 25).
- **Swing above $V_{DD}$**: core devices must keep $V_{GS}$, $V_{GD}$, $V_{DS}$ under $V_{DD}$ in steady state and within 20–30 % over it in transients. A static cascode overstresses $V_{DS}$ in transients; a double cascode is slow; Palermo & Horowitz's **pulsed cascode** pulses the cascode gates during transitions to give $2V_{DD}$ swing from a two-device stack (L10 slides 14–17; Palermo 2011 p. 319).

### Ring Resonator Modulator

```tikz title="Ring modulator through-port transmission. The ring's high-Q notch repeats every free spectral range (FSR); a drive voltage shifts the notch by Delta lambda, so a laser line parked on the notch's slope sees a large intensity change. After Palermo L16 slides 60-61."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.2cm,y=1.4cm]
  \draw[->] (0,0) -- (6.4,0) node[right] {$\lambda$};
  \draw[->] (0,0) -- (0,2.4) node[above] {$T_{through}$};
  \draw[thick,blue!70!black,domain=0:6.2,samples=200] plot (\x,{2-1.8/(1+((\x-3)/0.18)^2)});
  \draw[thick,red!70!black,dashed,domain=0:6.2,samples=200] plot (\x,{2-1.8/(1+((\x-3.35)/0.18)^2)});
  \draw[thick,orange!80!black] (3.05,0) -- (3.05,2.2) node[above,font=\scriptsize] {laser $\lambda_0$};
  \fill (3.05,{2-1.8/(1+(0.05/0.18)^2)}) circle (2pt) node[left,font=\scriptsize] {``0''};
  \fill (3.05,{2-1.8/(1+((3.05-3.35)/0.18)^2)}) circle (2pt) node[left=5pt,font=\scriptsize] {``1''};
  \draw[<->] (3,-0.2) -- (3.35,-0.2);
  \node[below,font=\scriptsize] at (3.2,-0.22) {$\Delta\lambda(V)$};
  \node[font=\scriptsize,blue!70!black,anchor=east] at (2.6,0.6) {$V=0$};
  \node[font=\scriptsize,red!70!black,anchor=west] at (3.6,0.6) {$V=V_1$};
  \node[font=\scriptsize,align=center] at (1.3,1.45) {the notch repeats\\every FSR};
\end{circuitikz}
\end{document}
```

- A high-Q notch at the through port (band-pass at the drop port), repeating every FSR (L16 slide 60). Small: rings under 20 µm diameter, **lumped capacitance under 10 fF**, so non-impedance-controlled voltage drivers like the EAM's and excellent power efficiency (Palermo 2011 pp. 319–320).
- **Carrier injection** (forward-biased p-i-n): high efficiency (350 pm/V, Q 8000, under 2 Vpp for 7 dB ER) but slow minority carriers: pre-emphasis pulses are mandatory (L16 slide 61; L11). **Carrier depletion** (reverse-biased lateral p-n): fast (25 Gb/s and up) but weak (25 pm/V, over 4 Vpp for 7 dB ER) (L16 slide 61). Sakib 2022: Q = 4000, 100 GHz intrinsic RC bandwidth, 240 Gb/s PAM4 (slide 62). The ring's nonlinearity gives unequal rise and fall: asymmetric (nonlinear) FFE (L11).
- **Thermal sensitivity**: the resonance moves with temperature (thermo-optic) and with fabrication, so every ring needs a **closed-loop heater** or bias tuning (L16 slide 64): e.g. 340 µW for a 0.28 nm tuning range (L11). Rings double as WDM add/drop filters, so one waveguide carries many channels (slide 63).
- Driver example: 25 Gb/s, 4.4 V differential swing through a 3 pF AC-coupling capacitor, source impedance under 30 Ω, high-pass corner under 10 MHz (L11).

### Comparing the Sources

| Source | Drive | Load seen by the driver | Strength | Cost |
|---|---|---|---|---|
| VCSEL (direct) | Current: $I_{bias}+I_{mod}$ | Diode, 0.5–1 pF + 50–150 Ω | One device, cheap, arrays | BW vs lifetime, chirp, temperature |
| MZM | Voltage, several V | Terminated travelling-wave line | Wide optical bandwidth (over 100 nm), low chirp | mm-long, high swing, high power |
| EAM | Voltage, 1.5–4 V | Lumped C (short) or line (long) | Small, low chirp, EML integration | Limited ER at CMOS swings, insertion loss |
| Ring | Voltage, 2–4+ V | Under 10 fF | Tiny, WDM-native, very low energy | Under 1 nm optical bandwidth: thermal tuning loop |

(Palermo 2011 §9.5.2 and Fig. 9.33; L16 slide 49.)

## Level 8: Silicon Photonics and Integration

- **Hybrid**: optics on a separate substrate, joined by wire bonds (simple, but inductance and crosstalk), flip-chip (minimal parasitics; VCSEL heat couples into the CMOS chip), or short in-package traces (Palermo 2011 §9.5.4).
- **Integrated CMOS photonics**: waveguides, modulators and Ge photodetectors next to the circuits (monolithic SOI, bulk CMOS with substrate removal, or a photonic layer above the metal stack). Parasitics vanish and I/O rates can scale with CMOS (Palermo 2011 p. 325). Recent links bond an EIC to a PIC in 3-D (NVIDIA CPO, L16 slide 8).
- **The receiver changes with the detector**: a waveguide Ge detector under 10 fF (under 1 fF in some) makes the **circuit** input capacitance dominant, and then a **simple resistive front end** achieves optimum sensitivity (Palermo 2011 p. 324). The TIA's whole reason (isolating a big $C_{PD}$) goes away.
- **The laser stays off-chip** (silicon can't lase): an external laser source feeds the photonic engine, 36 laser fibers per 28.8 Tb/s in NVIDIA's example (L16 slide 8).

> [!tip] Remark
> Which front end wins is a capacitance question: TIA when $C_{PD}$ is large, integrating or resistive when it is small. Both are the same trade between $C_T$, noise and bandwidth seen in [[#The Resistive Front End Why a TIA]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Larger $R_F$ | Lower $4kT/R_F$, higher $R_T$ | Bandwidth ($\omega_0\propto1/\sqrt{R_F}$), or needs more amplifier GBW; overload sooner |
| Higher amplifier gain $A$ | $R_T\to R_F$, lower $R_{in}$, more bandwidth | Headroom at low $V_{DD}$; more poles, stability |
| Slower amplifier ($T_A$ up) | Bandwidth up to $\sqrt2$ (Butterworth) | Peaking and ringing past $Q=0.71$ |
| Larger input $g_m$ | Lower $f^2$ and white FET noise | More $C_I$ (more $f^2$ noise, less bandwidth) and current; optimum $C_I\approx C_{PD}$ |
| Larger $C_{PD}$ (bigger, easier-to-align detector) | Coupling tolerance, responsivity | Noise ($\propto C_T^2$), bandwidth, TIA stability |
| Lower RX bandwidth (below $\tfrac23B$) | White noise ($\propto\sqrt{BW}$) | ISI; jitter sensitivity; needs CTLE or DFE |
| Low-BW TIA + DFE | SNR (larger $R_F$, main cursor) | DFE timing, pre-cursor needs TX FFE |
| More LA stages | Gain-bandwidth | Power, noise, offset; optimum $2\ln G$ is flat |
| VCSEL bias up | Bandwidth $\propto\sqrt{I-I_{TH}}$ | Lifetime ($\propto1/BW^4$), lower ER (penalty) |
| TX FIR in the driver | Data rate at fixed average current (lifetime) | Driver complexity; linear FIR limited by laser nonlinearity |
| Higher ER | Less ER penalty | Laser near threshold (turn-on delay, slow); modulator swing |
| External vs direct modulation | No chirp, more bandwidth, reach | Extra device, coupling loss, OMA penalty, drive swing |
| MZM swing up | ER and OMA | Driver power (terminated line), above-$V_{DD}$ stages |
| Integrated waveguide PD | Sub-10 fF: resistive front end suffices | Process (Ge, SOI) and the off-chip laser |

## Cheat sheet

| Result | Equation |
|---|---|
| OMA, ER, average | $\text{OMA}=P_1-P_0=2P_{avg}\frac{\text{ER}-1}{\text{ER}+1}$, $\text{ER}=P_1/P_0$ |
| Modulator OMA penalty | $\text{TP}_{OMA}=P_{CW}/\text{OMA}=\text{ER}/[T(\text{ER}-1)]$ |
| Square law | $+3$ dB optical $=+6$ dB electrical |
| Dispersion | $\Delta T_{modal}=\frac{(n_{cor}-n_{clad})^2}{8cn_{cor}}L$, $\Delta T_{CD}=D\Delta\lambda L$, $\Delta T_{PMD}=D_{PMD}\sqrt L$ |
| Link budget | $\overline P_{TX}-\sum\text{loss}-\sum\text{PP}\ge\overline P_{sens}+\text{margin}$ (dB) |
| Responsivity | $\rho=\eta\lambda q/(hc)=8\times10^5\eta\lambda$ A/W, $\eta=1-e^{-\alpha W}$ |
| PD bandwidth | $f_{3dB}=0.45v_{sat}/W$; $BW\approx1/[2\pi(W/v_n+R_{PD}C_{PD})]$ |
| Detector noise | $2qI_{PIN}BW_n$; APD $FM^22qI_{PIN}BW_n$, $F=k_AM+(1-k_A)(2-1/M)$ |
| Sensitivity | $i^{pp}_{sens}=2Qi_{n,rms}$, $\overline P_{sens}=Qi_{n,rms}/\rho$, $\text{OMA}_{sens}=2Qi_{n,rms}/\rho$ |
| Noise bandwidths | $\overline{i_n^2}=\alpha_0BW_n+\alpha_2BW_{n2}^3/3$ |
| ER penalty | $\frac{\text{ER}+1}{\text{ER}-1}$ |
| Offset penalty | $1+2\delta$, $\delta=V_{os}/v^{pp}$ |
| RX bandwidth | $\approx\tfrac23B$; $1/BW^2=\sum1/BW_i^2$ |
| Resistive front end | $R_T=R_L$, $BW=1/(2\pi R_LC_D)$, $i_{n,rms}=\sqrt{kT/C_D}/R_L$ |
| Feedback TIA | $R_T=\frac{A}{A+1}R_F$, $R_{in}=\frac{R_F}{A+1}$, $\omega_p=\frac{A+1}{R_FC_T}$ |
| Second-order TIA | $\omega_0=\sqrt{\frac{A+1}{R_FC_TT_A}}$, $Q=\frac{\sqrt{(A+1)R_FC_TT_A}}{R_FC_T+T_A}$ |
| Transimpedance limit | $R_T\le\frac{A\omega_A}{C_T\omega_{3dB}^2}$ |
| TIA noise | $\frac{4kT}{R_F}+2qI_G+\frac{4kT\Gamma}{g_mR_F^2}+\frac{4kT\Gamma(2\pi C_T)^2}{g_m}f^2$ |
| CMOS feedback TIA headroom | $V_A=V_{GS1}+V_{GS2}$, $A\approx\alpha(V_{DD}-V_A)/V_{OD}$ |
| CG TIA | $R_T=R_D$, $R_{in}\approx1/g_m$, $\overline{I^2_{n,in}}=4kT(\tfrac23g_{m2}+\tfrac1{R_D})$ |
| RGC input | $Z_{in}(0)\approx1/[g_{m1}(1+g_{mB}R_B)]$ |
| Integrating RX | $\overline P_{avg}=\Delta V_b(C_{PD}+C_{in})/(\rho T_b)$ |
| LA stages | $f_{tot}=f_s\sqrt{2^{1/n}-1}$, $n_{opt}=2\ln G$, $A_s=\sqrt e$ |
| LA offset loop | $V_{os}'\approx\sqrt{(V_{os}/AA_1)^2+V_{os1}^2}$, $f_{LF}=\frac{1+AA_1/2}{2\pi R_1C_1}$ |
| Laser | $P_o=\eta(I-I_{TH})$, $BW\propto\sqrt{I_{avg}-I_{TH}}$, MTTF $\propto1/BW^4$ |
| Laser driver | $I_{mod}=\text{OMA}/\eta$, $I_{L,0}=I_{TH}+P_0/\eta$ |
| MZM | $\frac{P_{out}}{P_{in}}=\frac12[1+\cos(\pi V_M/V_\pi)]$, chirp $\alpha=\frac{v_1+v_2}{v_1-v_2}$ |
| Quantum limit | $\overline P=\frac{-\ln(2\text{BER})}{2}\frac{hc}{\lambda}B$ |

## References

- **S. Palermo, ECEN720 Lecture 16, "Optical Transceivers,"** Texas A&M, Spring 2025 (`ref/SerDes/lecture16_ee720_optical_xcvrs.pdf`): slides 4–9 (data-center links, reach, AI demands, retimed vs linear optics, NVIDIA CPO, WDM), 11–27 (fiber, MMF/SMF, windows, modal/chromatic/PMD dispersion with the 113 ps example), 28–37 (Si waveguides, SOI vs bulk, couplers), 39–42 (IMDD, coherent), 44–48 (direct vs external, definitions, OMA penalty, TDECQ), 49–64 (VCSEL, MZM incl. SiP/InP/TFLN examples, EAM, EML, rings, 240 Gb/s RRM, WDM, thermal), 66–68 (PD, responsivity, transit time, 100 fF, waveguide PD). All slides used.
- **S. Palermo, ECEN689 Optical Interconnects lectures,** Texas A&M, Spring 2022, downloaded from https://people.engr.tamu.edu/spalermo/ecen689_oi.html into `ref/SerDes/`:
  - L3 Photodetectors (`lecture3_ee689_photodetectors.pdf`): slides 4–34 (p-i-n, $\eta$, materials, responsivity, square law, AC model, bandwidth, shot noise, dark current, saturation, waveguide PD, APD gain/noise/dark/bandwidth, EDFA, ASE, OSNR, noise figure, summary).
  - L4 Receiver Analysis (`lecture4_ee689_rx_analysis.pdf`): slides 4–39 (RX model, BER, Q, SNR extremes, electrical/optical sensitivity, BER references, detector noise, APD optimum, quantum limit), 41–46 (noise bandwidths, Personick), 48–56 (power penalties: offset, dark current), 58–72 (bandwidth optimum, ISI penalty, allocation, matched filter). Equalization, jitter and FEC slides (75+) left to [[Equalization]], [[Link Noise and Jitter]], [[Signaling and BER]].
  - L5 TIAs (`lecture5_ee689_tias.pdf`): slides 5–55 (all: overload, resistive front end, CG, RGC, Kromer, feedback TIA ideal/finite/limit, CMOS feedback and inverter TIAs, noise, CG+feedback, BJT, differential, offset control, scaling, integrating RX and its budget, low-BW TIA with CTLE and DFE).
  - L6 Limiting Amplifiers (`lecture6_ee689_limiting_amps.pdf`): slides 4–11 (multistage GBW, optimum stage count), 12–32 (bandwidth extension, used only as a summary and link), 33–35 (offset compensation).
  - L7 TX Analysis (`lecture7_ee689_tx_analysis.pdf`): slides 3–17 (direct vs external, ER, ER penalty, OMA, linewidth, chirp, dispersion limits).
  - L8 VCSEL TX (`lecture8_ee689_vcsel_tx.pdf`): slides 3–33 (lasers, VCSEL model and rate equations, reliability, turn-on delay, chirp, RIN, temperature, drivers, termination, FIR and nonlinear FFE, PAM4).
  - L9 MZM TX (`lecture9_ee689_mzm_tx.pdf`): slides 3–18. L10 EAM TX (`lecture10_ee689_eam_tx.pdf`): slides 4–25. L11 RRM TX (`lecture11_ee689_rrm_tx.pdf`): skimmed (carrier injection vs depletion, pre-emphasis, nonlinear FFE, AC-coupled 4.4 V driver, tuning loops); the device-modeling slides were left out.
  - HW2 Problem 2 and HW3 Problems 3–4 (`hw2_ee689_optical.pdf`, `hw3_ee689_optical.pdf`; link budget and the 10 Gb/s TIA/LA targets), used for the worked examples; solutions are mine.
- **S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems,"** ch. 9 in *High-Speed Circuits*, 2011 (`ref/SerDes/serial_links_chapter_palermo_2011.pdf`): §9.5 pp. 313–326 (optical channels, VCSEL and driver Fig. 9.28 and Eq. 9.6, EAM, ring, MZM Eq. 9.7 and Fig. 9.30, PD Eqs. 9.8–9.10, TIA Fig. 9.31, integrating receiver Fig. 9.32, integration approaches, Fig. 9.33).
- **S. Palermo, A. Emami-Neyestanak, M. Horowitz, "A 90 nm CMOS 16 Gb/s Transceiver for Optical Interconnects,"** JSSC 2008 (`ref/SerDes/16G_vcsel_xcvr_palermo_jssc_2008.pdf`): §III (VCSEL parasitics, Eqs. 1–3, 4-tap FIR driver Fig. 4, Figs. 5–6), §IV (integrating receiver, Eqs. 4–11, −9.8 dBm). The CDR section is left to [[Clocking and CDR]].
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies,"** JSSC 2015 (`ref/SerDes/56G_NRZPAM4_J.pdf`): Sec. I and III-A, Fig. 6 (EML transfer curve and MSB:LSB pre-distortion).
- **P. Jespers, B. Murmann, *Systematic Design of Analog CMOS Circuits*,** 2017: Table 1.1 (60 nm device data for the worked example).
