---
title: RF Systems
description: The RF track as one system - antennas as system blocks (gain, effective area, noise temperature, G/T), the Friis link and link budget, receiver and transmitter architectures, radar, radiometry and propagation - and how range, data rate, BER and blockers become specs for the PA, antenna, LNA, mixer, LO and filters.
kind: topic
status: growing
aliases:
  - RF Systems
  - Receiver Architectures
  - Transceiver Architectures
  - Link Budget
  - Antennas
---

This is the capstone of the RF track. Every other RF note designs one block; this one connects the blocks into a radio, a radar or a radiometer, and works out what each block must achieve. The antenna is treated as a system block (gain, capture area, noise temperature), not as an EM boundary-value problem. As in [[MosFETs]], the note starts with the whole system at low resolution and each level opens one more box. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="A full transceiver, each block labelled with the note that teaches it. The link between two such radios is the Friis formula; everything to the right of the antenna is the RF track. After binder pp. 2 and 258 and Pozar Figs. 14.9, 14.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,scale=0.85,transform shape]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.35cm,minimum height=0.8cm,align=center,font=\scriptsize},
           n/.style={font=\tiny,text=blue!60!black,align=center}}
  % antenna
  \draw[thick] (0,1.35) -- (0,0.35); \draw[thick] (-0.35,1.75) -- (0,1.35) -- (0.35,1.75); \draw[thick] (0,1.35) -- (0,1.8);
  \node[n,anchor=south] at (0,1.85) {\textbf{Antennas} (here)\\ $G$, $A_e$, $T_A$, $G/T$};
  % duplexer
  \node[b,minimum height=3.2cm,fill=orange!10] (dup) at (0,-1.3) {duplexer\\ or\\ circulator\\ or\\ T/R switch};
  \node[n,anchor=north] at (0,-2.95) {Microwave Filters;\\ circulator: here};
  % RX row
  \node[b] (pre) at (2.1,0) {preselect\\ BPF};
  \node[b] (lna) at (4.2,0) {LNA};
  \node[b] (img) at (6.3,0) {image\\ BPF};
  \node[b,circle,minimum width=0.8cm] (mx) at (8.4,0) {$\times$};
  \node[b] (iff) at (10.5,0) {IF / channel\\ filter};
  \node[b] (ifa) at (12.6,0) {IF / BB\\ amp};
  \node[b] (adc) at (14.7,0) {ADC};
  % TX row
  \node[b] (iso) at (2.1,-2.6) {isolator};
  \node[b] (pa) at (4.2,-2.6) {PA};
  \node[b] (tbp) at (6.3,-2.6) {BPF};
  \node[b,circle,minimum width=0.8cm] (tmx) at (8.4,-2.6) {$\times$};
  \node[b] (lpf) at (12.6,-2.6) {LPF};
  \node[b] (dac) at (14.7,-2.6) {DAC};
  % LO and DSP
  \node[b,fill=green!8] (lo) at (8.4,-1.3) {LO: PLL + VCO};
  \node[b,minimum height=3.4cm,fill=gray!10] (dsp) at (16.7,-1.3) {DSP\\ (mod/\\demod)};
  % wiring
  \draw[->] (0.68,0) -- (pre); \draw[->] (pre) -- (lna); \draw[->] (lna) -- (img); \draw[->] (img) -- (mx);
  \draw[->] (mx) -- (iff); \draw[->] (iff) -- (ifa); \draw[->] (ifa) -- (adc); \draw[->] (adc) -- (dsp.west |- adc);
  \draw[->] (dsp.west |- dac) -- (dac); \draw[->] (dac) -- (lpf); \draw[->] (lpf) -- (tmx); \draw[->] (tmx) -- (tbp);
  \draw[->] (tbp) -- (pa); \draw[->] (pa) -- (iso); \draw[->] (iso) -- (0.68,-2.6);
  \draw[->] (lo) -- (mx); \draw[->] (lo) -- (tmx);
  % note labels
  \node[n,anchor=south] at (2.1,0.45) {Microwave\\ Filters};
  \node[n,anchor=south] at (4.2,0.45) {RF Amplifier\\ Design; RF Noise\\ and Distortion};
  \node[n,anchor=south] at (6.3,0.45) {Microwave\\ Filters,\\ Resonators};
  \node[n,anchor=south] at (8.4,0.45) {Mixers and\\ Microwave\\ Oscillators};
  \node[n,anchor=south] at (10.5,0.45) {Filters};
  \node[n,anchor=south] at (12.6,0.45) {Single-Stage,\\ Op Amps};
  \node[n,anchor=south] at (14.7,0.45) {ADC notes};
  \node[n,anchor=north] at (2.1,-3.05) {Pozar Ch. 9\\ (here, folded)};
  \node[n,anchor=north] at (4.2,-3.05) {RF Amplifier\\ Design; Active\\ RF Devices};
  \node[n,anchor=north] at (6.3,-3.05) {Microwave\\ Filters};
  \node[n,anchor=north] at (8.4,-3.05) {Mixers; I/Q:\\ Power Dividers\\ and Couplers};
  \node[n,anchor=north] at (12.6,-3.05) {Filters};
  \node[n,anchor=north] at (14.7,-3.05) {DAC notes};
  \node[n,anchor=west] at (9.75,-1.3) {Phased-Locked Loops,\\ Oscillators};
  % footer
  \node[font=\tiny,align=left,anchor=north west,text=gray!40!black] at (-0.7,-4.25) {Every interface: Transmission Lines, Smith Chart and Impedance Matching. Every block's ports: Microwave Network Analysis (S-parameters).\\ Every tank and resonator: Microwave Resonators. Every transistor: Active RF Devices, MosFETs. Every field, wave and skin effect: EM Foundations.};
  % link
  \draw[<->,dashed,thick,red!60!black] (-0.5,1.5) -- (-3.0,1.5);
  \node[font=\scriptsize,text=red!60!black,align=center,anchor=north] at (-1.75,1.35) {path $R$\\ $L_0=20\log\frac{4\pi R}{\lambda}$};
  \node[font=\scriptsize,align=center] at (-3.3,0.4) {other\\ radio};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Friis link:** $P_r=P_tG_tG_r\left(\dfrac{\lambda}{4\pi R}\right)^2$. In dB: $P_r=\mathrm{EIRP}-L_0+G_r-\text{losses}$, with path loss $L_0=20\log(4\pi R/\lambda)$. Power falls as $1/R^2$, not exponentially.
> 2. **Antenna as a block:** $G=\eta_{rad}D$, capture area $A_e=G\lambda^2/4\pi$, aperture limit $D\le4\pi A/\lambda^2$. Gain is focusing, not amplification.
> 3. **System noise temperature:** $T_{SYS}=T_A+(L_T-1)T_p+L_TT_{REC}$ and $\mathrm{SNR}=P_r/(kBT_{SYS})$. The antenna brings its own noise $T_A$; quote $G/T$ for a receive station.
> 4. **The threshold:** $E_b/n_0=\dfrac{S}{kT_{SYS}R_b}$ sets the BER. So $S_{min}\,[\text{dBm}]=-198.6+10\log T_{SYS}+10\log R_b+(E_b/n_0)_{req}$, and the link margin $P_r-S_{min}$ is typically 3 to 20 dB.
> 5. **Architectures:** a superheterodyne also receives the **image** at $2f_{IF}$ from the wanted signal and must filter it before the mixer; zero-IF has no image but turns LO leakage into a DC offset. Both trade where the selectivity is built.
> 6. **Radar:** $P_r=\dfrac{P_tG^2\lambda^2\sigma}{(4\pi)^3R^4}$. A round trip costs $1/R^4$, so range grows only as $P_t^{1/4}$.

**Map:** [[#Spec translation|system spec → block specs]] → [[#Physics background|radiation, capture, sky noise]] → [[#Level 0 The Link Budget|Friis, EIRP, link budget, margin]] → [[#Level 1 Antennas|pattern, $D$, $G$, $A_e$]] → [[#Level 2 Antenna Noise Temperature|$T_b$, $T_A$, $G/T$]] → [[#Level 3 Receiver System Temperature and SNR|$T_{SYS}$, SNR]] → [[#Level 4 Modulation and the BER Threshold|$E_b/n_0$, BER]] → [[#Level 5 Receiver Architectures|superhet, zero-IF, low-IF]] → [[#Level 6 Transmitter and Transceiver Architectures|TX chains, duplexing, isolators]] → [[#Level 7 Radar Systems|radar equation, pulse, Doppler]] → [[#Level 8 Radiometry|radiometers]] → [[#Level 9 Microwave Propagation|atmosphere, ground, plasma]] → [[#Level 10 Other Applications|RFID, power transfer, heating, safety]].

## Spec translation

This is a system note. The full amplifier-spec table belongs to the block notes; this section does the step before them: it turns the **system spec** into a **link budget** and the link budget into one number per block, then hands each number to the note that owns that block.

```tikz title="Spec translation for a radio: the system spec fixes a received-power threshold; the Friis budget fixes EIRP and G/T; those split into one spec per block. After Pozar §14.2 and Eqs. 13.50, 14.24, 14.33, 14.36."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,rounded corners=2pt,fill=gray!8,align=center,font=\scriptsize,text width=3.0cm,minimum height=1.3cm},
           c/.style={draw,rounded corners=2pt,fill=red!6,align=left,font=\scriptsize,text width=3.6cm,minimum height=0.62cm}}
  \node[b] (s) at (0,0) {\textbf{system spec}\\ range $R$, $f$\\ data rate $R_b$ (or $B$)\\ BER $\to (E_b/n_0)_{req}$\\ blockers, image, mask};
  \node[b] (l) at (4.1,0) {\textbf{link budget}\\ $S_{min}=kT_{SYS}R_b\frac{E_b}{n_0}$\\ $P_r\ge S_{min}+\mathrm{LM}$\\ Friis: $P_r=\mathrm{EIRP}-L_0+G_r$};
  \node[b] (t) at (8.2,0) {\textbf{two knobs}\\ transmitter: EIRP $=P_tG_t$\\ receiver: $G_r/T_{SYS}$};
  \draw[->] (s) -- (l); \draw[->] (l) -- (t);
  \node[c] (c1) at (12.9,2.45) {antenna $G$ $\to$ aperture $A$};
  \node[c] (c2) at (12.9,1.65) {PA $P_{out}$, ACPR, EVM};
  \node[c] (c3) at (12.9,0.85) {LNA NF and gain (via $T_{REC}$)};
  \node[c] (c4) at (12.9,0.05) {mixer IIP3 (blockers)};
  \node[c] (c5) at (12.9,-0.75) {LO phase noise $\mathcal L(f_m)$};
  \node[c] (c6) at (12.9,-1.55) {filter rejection (image, blockers)};
  \node[c] (c7) at (12.9,-2.35) {duplexer / circulator isolation};
  \foreach \i in {1,...,7} \draw[->] (t.east) -- (c\i.west);
\end{circuitikz}
\end{document}
```

### The system's specs

From Pozar §14.2 and §13.3: carrier frequency $f$ and range $R$; data rate $R_b$ and channel bandwidth $B$; required BER, which a modulation turns into a required $E_b/n_0$ (or a minimum CNR); link margin for fading (3 to 20 dB; 20 dB or more for rain above 10 GHz); interferers: adjacent-channel blockers, image-band signals, the radio's own transmitter; and an emission limit (spectral mask, exposure limit).

### System spec → link budget

$$
\boxed{S_{min}\,[\text{dBm}]=-198.6+10\log T_{SYS}+10\log R_b+\left(\frac{E_b}{n_0}\right)_{req}}\qquad
\boxed{\mathrm{EIRP}-L_0-L_A+G_r-L_r\ \ge\ S_{min}+\mathrm{LM}}
$$

- Left: the weakest signal that meets the BER. $-198.6$ dBm/(K·Hz) is $10\log k$ in milliwatts. This is the system-temperature form of [[RF Noise and Distortion#Sensitivity]]; it stays right when the antenna does not look at 290 K.
- Right: the Friis budget. Everything on the left is set by the transmitter, the path and the receive antenna; everything on the right by the receiver and the modulation.
- The receiver enters only through $G_r/T_{SYS}$. Dividing both sides by $T_{SYS}$ shows why stations quote $G/T$.

> [!note]- Derivation: the threshold in dBm
> $E_b=S/R_b$ and the noise density is $n_0=kT_{SYS}$ (Pozar Eqs. 14.35, 14.36), so $E_b/n_0=S/(kT_{SYS}R_b)$. Solving for $S$ and taking $10\log$ in mW: $10\log(1.38\times10^{-23}\cdot10^3)=-198.6$. Adding the margin gives the power the link must deliver: $P_r\ge S_{min}+\mathrm{LM}$ (Eq. 14.29). For a receiver specified by bandwidth and CNR instead, replace $R_b\,(E_b/n_0)$ by $B\cdot\mathrm{CNR}_{min}$.

### Link budget → block specs

| Budget term | Block | Block spec it fixes | Owner note |
|---|---|---|---|
| EIRP $=P_tG_t$ | PA + TX antenna | $P_{out}=\mathrm{EIRP}-G_t+L_t$; linearity at that power (ACPR, EVM) | [[RF Amplifier Design]], [[RF Noise and Distortion#AM-AM and AM-PM]] |
| $G_t$, $G_r$ | antennas | aperture $A=G\lambda^2/(4\pi\eta_{ap})$, beamwidth | here, [[#Level 1 Antennas]] |
| $T_{SYS}$ | antenna, feed line, receiver | $T_{REC}\le\dfrac{T_{SYS}-T_A-(L_T-1)T_p}{L_T}$, i.e. a receiver NF | here, then [[RF Noise and Distortion#Spec translation]] |
| $T_{REC}$ | LNA, mixer, IF amp | LNA NF and the gain that buries the mixer (Friis) | [[RF Noise and Distortion#Friis Formula]], [[RF Amplifier Design]] |
| Two-tone blockers | LNA, mixer | chain IIP3 $\ge(3P_{int}-P_{IM,max})/2$ | [[RF Noise and Distortion#Intermodulation in a Receiver]] |
| Adjacent-channel blocker $I$ at offset $f_m$ | LO | $\mathcal L(f_m)\le C-S-I-10\log B$ | [[Oscillators#Level 5 Phase Noise]], [[Phased-Locked Loops]] |
| Image-band signal $I_{im}$ | preselect / image filter (or image-reject mixer) | rejection $\ge I_{im}-C+\mathrm{SNR}_{min}$ | [[Microwave Filters#Spec translation]], [[Mixers and Microwave Oscillators]] |
| Own transmitter $P_t$ | duplexer, circulator, T/R switch | isolation $\ge P_t-P_{allowed}$ at the LNA | [[Microwave Filters]], [[#Isolators and Circulators in a System]] |

$$
\boxed{T_{REC}\le\frac{T_{SYS}-T_A-(L_T-1)T_p}{L_T},\qquad \mathrm{NF}_{REC}=10\log\!\left(1+\frac{T_{REC}}{T_0}\right)}
$$
$$
\boxed{\mathcal L(f_m)\le C-S-I-10\log B\ \ [\text{dBc/Hz}]}\qquad\boxed{\mathrm{IR}\ge I_{im}-C+\mathrm{SNR}_{min}\ \ [\text{dB}]}
$$

- $T_{REC}$: what is left of the temperature budget after the sky, the antenna loss and the feed line have taken their share, referred to the receiver input (Pozar Eq. 14.33 solved for $T_{REC}$).
- Phase noise (Pozar Eq. 13.50): $C$ the wanted carrier (dBm), $I$ the interferer (dBm) at offset $f_m$, $S$ the selectivity required (dB), $B$ the IF bandwidth. Where it comes from is [[Mixers and Microwave Oscillators#Reciprocal Mixing]].
- Image rejection (computed here): an image-band signal at $I_{im}$ lands on the IF exactly on top of the wanted signal, so after the filter it must sit $\mathrm{SNR}_{min}$ below $C$.

> [!note]- Derivation: the image-rejection bound
> A signal at $f_{IM}=f_{LO}-f_{IF}$ converts to the same $|f_{IF}|$ as the wanted signal (Pozar Eq. 13.88), and no later filter can separate them. If the image-band signal arrives at $I_{im}$ dBm and the filter attenuates it by IR, it adds $I_{im}-\mathrm{IR}$ of co-channel interference; requiring $C-(I_{im}-\mathrm{IR})\ge\mathrm{SNR}_{min}$ gives the bound.

> [!tip] Remark
> Each block spec now goes to its owner note, which turns it into amplifier specs and then into $g_m/I_D$, $I_D$ and $L$ by [[gm-ID Design Methodology]]. The LNA gain window (noise floor vs IIP3 ceiling) is [[RF Noise and Distortion#Spec translation]]; device choice for a given $f$, NF and $P_{out}$ is [[Active RF Devices#System spec → device spec]].

### Worked example: DBS downlink, read backwards (Pozar Ex. 14.4, extended)

**Given** (Pozar Ex. 14.4): 12.45 GHz, satellite carrier power 120 W (50.8 dBm) into a 34 dB antenna, 39,000 km slant path, 18 in dish with $G_r=33.5$ dB looking at $T_b=50$ K, $B=20$ MHz, $\mathrm{CNR}_{min}=15$ dB.

1. **Link budget** (Pozar): $L_0=20\log\frac{4\pi(39\times10^6)}{0.0241}=206.2$ dB. $P_r=50.8+34.0-206.2+33.5=-87.9$ dBm.
2. **Temperature budget** (computed here): ask for $\mathrm{CNR}\ge15$ dB with 3 dB margin. $10\log(kT_{SYS}B)\le-87.9-18=-105.9$ dBm, so $10\log T_{SYS}\le-105.9+198.6-73.0=19.7$: $T_{SYS}\le93$ K.
3. **Receiver (LNB) spec:** $T_A=T_b=50$ K (dish taken lossless, LNB at the feed so $L_T=1$). $T_{LNB}\le43$ K, so $\mathrm{NF}_{LNB}\le10\log(1+43/290)=$ **0.60 dB**. Pozar's 0.7 dB LNB gives $T_{SYS}=100.8$ K, $G/T=13.5$ dB/K, CNR 17.7 dB and a 2.7 dB margin: just short of the 3 dB asked here.
4. **Split the LNB by Friis** (assumptions chosen here): an LNA with NF 0.5 dB uses $T_1=35.4$ K of the 43 K. If everything after it has the 7 dB NF of Pozar Ex. 14.5's mixer ($T_2=1163$ K), then $T_2/G_1\le7.6$ K, so $G_1\ge153$: **LNA gain $\ge$ 21.8 dB**. Check the IIP3 ceiling on that gain in [[RF Noise and Distortion#Spec translation]].
5. **Transmitter:** EIRP $=50.8+34=84.8$ dBm. Each dB of $G_r$ lost (a smaller dish) must be bought back by a dB of PA power or satellite antenna gain.

**LO and filter specs** come from interferers, not from noise:
- **Phase noise** (Pozar Ex. 13.5, GSM, worked in [[Mixers and Microwave Oscillators#Worked examples]]): the 3 MHz, $-23$ dBm blocker against a $-99$ dBm carrier sets $\mathcal L(3\,\text{MHz})\le-138$ dBc/Hz, which needs a phase-locked synthesizer ([[Phased-Locked Loops]]).
- **Image** (Pozar Ex. 13.7, in [[Mixers and Microwave Oscillators#Image Frequency]]; levels assumed here): IS-54 with an 87 MHz IF and high-side LO has its image at 1043–1068 MHz. If a $-23$ dBm signal could sit there with the wanted carrier at $-99$ dBm and $\mathrm{SNR}_{min}=9$ dB, the preselect and image filters together need $\mathrm{IR}\ge-23+99+9=$ **85 dB** at 174 MHz from the passband.

## Physics background

An antenna is the transition between a guided wave on a line and a spherical wave in space. Far enough away the spherical wave is locally a plane wave, carrying power density $S$; a receive antenna captures $S\cdot A_e$. Everything in the system half of this note follows from that, conservation of energy, and the fact that an antenna in thermal equilibrium is just a resistor.

```tikz title="Transmit and receive antennas: a Thevenin source delivers P_t; the wave spreads over 4 pi R^2; the receive antenna captures S times A_e into a matched load. After Pozar Figs. 14.2 and 14.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[sV,l=$V_g$] (0,2) to[R,l=$Z_g$] (2,2) -- (2.4,2);
  \draw (0,0) -- (2.4,0);
  \draw[thick] (2.4,2) -- (2.4,2.6); \draw[thick] (2.0,3.0) -- (2.4,2.6) -- (2.8,3.0); \draw[thick] (2.4,2.6) -- (2.4,3.1);
  \node[font=\scriptsize] at (1.8,2.55) {$P_t$};
  \foreach \r in {0.6,1.0,1.4} \draw[gray] ([shift={(2.4,2.8)}]-30:\r) arc (-30:30:\r);
  \foreach \x in {6.0,6.3,6.6} \draw[gray] (\x,2.1) -- (\x,3.5);
  \draw[->,thick,red!60!black] (3.9,2.8) -- (5.7,2.8) node[midway,above,font=\scriptsize] {$S=\dfrac{G_tP_t}{4\pi R^2}$};
  \draw[thick] (7.6,2.0) -- (7.6,2.6); \draw[thick] (7.2,3.0) -- (7.6,2.6) -- (8.0,3.0); \draw[thick] (7.6,2.6) -- (7.6,3.1);
  \draw (7.6,2.0) -- (9.0,2.0) to[R,l={$Z_L=Z_A^*$}] (9.0,0) -- (7.6,0);
  \node[font=\scriptsize,align=center] at (8.2,3.6) {$P_r=A_eS$};
  \draw[<->] (2.4,-0.5) -- (7.6,-0.5) node[midway,below,font=\scriptsize] {$R\ \ (>2D^2/\lambda$, far field$)$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\bar E=\left[\hat\theta F_\theta(\theta,\phi)+\hat\phi F_\phi(\theta,\phi)\right]\frac{e^{-jk_0r}}{r}}\qquad\boxed{R_{ff}=\frac{2D^2}{\lambda}\ \ (\ge2\lambda)}
$$

- Far field: a TEM wave moving radially, amplitude $\propto1/r$, so power density $\propto1/r^2$, with $H=E/\eta_0$ ($\eta_0=377\ \Omega$). $F_\theta$, $F_\phi$ are the **pattern functions**.
- **Far-field distance:** where the spherical front departs less than $\pi/8$ from a plane across the antenna's largest dimension $D$. Patterns and gains are defined there. Pozar Ex. 14.1: an 18 in (0.457 m) DBS dish at 12.4 GHz has $R_{ff}=2(0.457)^2/0.0242=17.3$ m; the satellite is 36,000 km away.
- **Spreading beats line loss at long range.** Free space costs $1/R^2$ (20 dB/decade); a line costs $e^{-2\alpha z}$, which always wins eventually. That is why long links are radio links unless repeaters can be inserted (Pozar p. 674).

> [!tip] Remark
> The plane wave, $\eta_0$ and the Poynting vector are [[EM Foundations#Plane Waves]] and [[EM Foundations#Poynting Vector]]. "An antenna's receive pattern equals its transmit pattern" is [[EM Foundations#Reciprocity]]; that is why every antenna parameter below is defined once and used both ways.

> [!note]- Derivation: radiation intensity and radiated power (Pozar Eqs. 14.3–14.7)
> Time-average Poynting vector $\bar S_{avg}=\tfrac12\mathrm{Re}\{\bar E\times\bar H^*\}$. With $H_\phi=E_\theta/\eta_0$, $H_\theta=-E_\phi/\eta_0$:
> $$U(\theta,\phi)=r^2\lvert\bar S_{avg}\rvert=\frac{r^2}{2\eta_0}\left(\lvert E_\theta\rvert^2+\lvert E_\phi\rvert^2\right)=\frac{1}{2\eta_0}\left(\lvert F_\theta\rvert^2+\lvert F_\phi\rvert^2\right)\ \text{W (per steradian)}.$$
> The $r^2$ cancels the $1/r^2$, so $U$ depends only on direction. Total power: integrate over a unit sphere,
> $$P_{rad}=\int_0^{2\pi}\!\!\int_0^{\pi}U(\theta,\phi)\sin\theta\,d\theta\,d\phi .$$
> **Far-field distance:** the path from the edge of an aperture of size $D$ to a point at $R$ is longer than the path from the centre by $\approx(D/2)^2/(2R)$. Setting the phase error $k_0(D/2)^2/(2R)\le\pi/8$ gives $R\ge2D^2/\lambda$.

**Sky noise.** An antenna inside an absorbing (anechoic) chamber at temperature $T$, in thermal equilibrium, cannot be told apart from a matched resistor at $T$: it delivers $kTB$ (Pozar Fig. 14.4). An antenna looking at a uniform sky at $T$ does the same, whatever its efficiency, provided the antenna itself is also at $T$. So the environment has a noise temperature, and the antenna passes it to the receiver.

> [!tip] Remark
> $kTB$ from a resistor and the equilibrium argument are [[RF Noise and Distortion#Thermal Noise Power]] and [[RF Noise and Distortion#Thermal Equilibrium]]. Radiometry ([[#Level 8 Radiometry]]) is this paragraph turned into an instrument.

## Level 0: The Link Budget

```tikz title="Pozar Ex. 14.4 (DBS) as a power staircase: 120 W becomes -87.9 dBm. The noise floor kT_SYS B and the required CNR leave a 2.7 dB link margin. Left scale: 1 cm = 40 dB; right: the bottom 30 dB zoomed."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\s{0.025}
  \draw[->] (0,{-130*\s}) -- (0,{100*\s}) node[above,font=\scriptsize] {dBm};
  \foreach \v in {-120,-80,-40,0,40,80} { \draw (-0.08,{\v*\s}) -- (0.08,{\v*\s}); \node[left,font=\tiny] at (-0.08,{\v*\s}) {$\v$}; }
  \draw[very thick,blue!70!black] (0.3,{50.8*\s}) -- (1.6,{50.8*\s});
  \draw[very thick,blue!70!black] (1.6,{50.8*\s}) -- (1.6,{84.8*\s}) -- (3.4,{84.8*\s});
  \draw[very thick,blue!70!black] (3.4,{84.8*\s}) -- (3.4,{-121.4*\s}) -- (5.2,{-121.4*\s});
  \draw[very thick,blue!70!black] (5.2,{-121.4*\s}) -- (5.2,{-87.9*\s}) -- (8.6,{-87.9*\s});
  \node[font=\scriptsize,align=center,anchor=south] at (0.95,{50.8*\s}) {$P_t$\\ 50.8};
  \node[font=\scriptsize,align=center,anchor=south] at (2.5,{84.8*\s}) {EIRP 84.8\\ ($+G_t=34$)};
  \node[font=\scriptsize,align=left,anchor=west] at (3.5,{-10*\s}) {$-L_0=-206.2$ dB\\ (39,000 km, 12.45 GHz)};
  \node[font=\scriptsize,anchor=north] at (4.3,{-121.4*\s}) {$-121.4$};
  \node[font=\scriptsize,align=center,anchor=south] at (6.3,{-87.9*\s}) {$P_r=-87.9$\\ ($+G_r=33.5$)};
  \draw[gray,dashed] (7.8,{-80*\s}) rectangle (8.6,{-110*\s});
  \draw[gray,dashed] (8.6,{-80*\s}) -- (9.6,1.0); \draw[gray,dashed] (8.6,{-110*\s}) -- (9.6,-3.2);
  \begin{scope}[xshift=9.6cm]
    \def\z{0.14}
    \node[font=\scriptsize,anchor=south west] at (0,1.0) {zoom: $-80$ to $-110$ dBm};
    \draw[very thick,blue!70!black] (0,{(-87.9+95)*\z}) -- (3.4,{(-87.9+95)*\z}) node[right,font=\scriptsize] {$P_r=-87.9$};
    \draw[thick,dotted,green!50!black] (0,{(-90.6+95)*\z}) -- (3.4,{(-90.6+95)*\z}) node[right,font=\scriptsize] {$S_{min}=-90.6$ (CNR 15 dB)};
    \draw[thick,dashed,red!70!black] (0,{(-105.6+95)*\z}) -- (3.4,{(-105.6+95)*\z}) node[right,font=\scriptsize] {$kT_{SYS}B=-105.6$};
    \draw[<->] (1.0,{(-105.6+95)*\z}) -- (1.0,{(-87.9+95)*\z}) node[midway,left,font=\scriptsize] {CNR 17.7};
    \draw[<->,green!50!black] (2.4,{(-90.6+95)*\z}) -- (2.4,{(-87.9+95)*\z}) node[midway,right,font=\scriptsize] {LM 2.7};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Friis Transmission Formula

$$
\boxed{S_{avg}=\frac{G_tP_t}{4\pi R^2}}\qquad\boxed{P_r=\frac{G_tG_r\lambda^2}{(4\pi R)^2}P_t}\qquad\boxed{\mathrm{EIRP}=P_tG_t}
$$

- Received power is the **maximum** possible: a matched load, aligned polarizations, no extra propagation loss.
- $P_tG_t$ always appears together: the **effective isotropic radiated power**. In the main beam the transmitter looks like an isotropic radiator fed with $P_tG_t$. Only EIRP can raise $P_r$ for fixed $f$, $R$, $G_r$.
- $\lambda^2$ appears because a receive antenna of fixed gain has a capture area $\propto\lambda^2$. For fixed antenna *sizes* the dependence flips: gains grow as $1/\lambda^2$ each ([[#Effective Area and Aperture Efficiency]]).

> [!note]- Derivation: Friis from capture area (Pozar Eqs. 14.22–14.24)
> An isotropic source spreads $P_t$ over a sphere $4\pi R^2$: $S=P_t/4\pi R^2$. Directivity is the ratio to isotropic intensity and efficiency turns directivity into gain, so $S=G_tP_t/4\pi R^2$. The receive antenna captures $P_r=A_eS$ with $A_e=G_r\lambda^2/4\pi$ (Eq. 14.15 with losses). Multiplying: $P_r=G_tG_rP_t\lambda^2/(4\pi R)^2$.

### Path Loss and the Link Budget

$$
\boxed{L_0\,[\text{dB}]=20\log\frac{4\pi R}{\lambda}}\qquad\boxed{P_r\,[\text{dBm}]=P_t-L_t+G_t-L_0-L_A+G_r-L_r}
$$

| Entry | Symbol | Sign |
|---|---|---|
| Transmit power | $P_t$ | + (dBm) |
| Transmit line loss | $L_t$ | − |
| Transmit antenna gain | $G_t$ | + |
| Free-space path loss | $L_0$ | − |
| Atmospheric attenuation | $L_A$ | − ([[#Atmospheric Effects]]) |
| Receive antenna gain | $G_r$ | + |
| Receive line loss | $L_r$ | − |
| Impedance mismatch | $L_{imp}=-10\log(1-\lvert\Gamma\rvert^2)$ | − |
| Polarization mismatch | e.g. 3 dB linear into circular, $\infty$ crossed linear | − |

- Path loss grows 20 dB per decade of distance **and** 20 dB per decade of frequency (for fixed antenna gains).
- Mismatch loss is [[Transmission Lines#Power Flow on a Mismatched Line]]: $1-\lvert\Gamma\rvert^2$ of the power gets through.

### Link Margin

$$
\boxed{\mathrm{LM}\,[\text{dB}]=P_r-P_{r,min}>0}
$$

- Typical 3 to 20 dB; the part reserved for fading is the **fade margin**. Satellite links above 10 GHz often need 20 dB or more for heavy rain.
- Raise it by raising $P_r$ (power, antenna gains) or lowering $P_{r,min}$ (better receiver, different modulation). Each costs money, so excess margin is avoided.

> [!example] LEO satellite downlink: what data rate fits? (Pozar Ex. 14.6)
> 940 km, $\lambda=1.875$ cm (16 GHz), QPSK. Satellite: 80 W (49 dBm), 20 dB antenna. Handset: 1 dB antenna, $T_{SYS}=750$ K. Atmosphere 2 dB, margin 10 dB, BER $10^{-2}$.
> - $L_0=20\log\frac{4\pi(940\times10^3)}{0.01875}=176.0$ dB. $P_r=49+20-176-2+1=-108$ dBm.
> - Threshold: $S_{min}=-108-10=-118$ dBm $=1.58\times10^{-15}$ W.
> - QPSK at BER $10^{-2}$ needs $E_b/n_0\approx5$ dB (Pozar Fig. 14.16). $R_b=\dfrac{S_{min}}{kT_{SYS}(E_b/n_0)}=\dfrac{1.58\times10^{-15}}{(1.38\times10^{-23})(750)(3.16)}=$ **48 kbps**.
>
> **Backwards** (computed here): to carry 1 Mbps at BER $10^{-5}$ (QPSK, 9.6 dB) with the same margin, $S_{min}=-169.9+60+9.6=-100.3$ dBm, so $P_r$ must reach $-90.3$ dBm: 17.7 dB more than the link delivers. The receiver cannot supply it ($T_{SYS}$ would have to fall to about 13 K in a handset that sees a 290 K ground), so it must come from EIRP or $G_r$.

## Level 1: Antennas

```tikz title="Left: the short dipole's power pattern sin^2(theta): omnidirectional in azimuth, nulls on the axis, 90 deg half-power beamwidth, D = 1.76 dB (Pozar Ex. 14.2). Right: a pencil beam in dB (idealised uniform aperture, sin(u)/u), with the -13 dB first sidelobe Pozar's horn of Fig. 14.3 also shows."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->,gray] (0,-2.2) -- (0,2.4) node[above,font=\scriptsize,text=black] {$z$ ($\theta=0$)};
    \draw[->,gray] (-2.3,0) -- (2.4,0) node[right,font=\scriptsize,text=black] {$\theta=90^\circ$};
    \draw[thick,blue!70!black,domain=0:360,samples=120] plot ({1.9*sin(\x)^2*sin(\x)},{1.9*sin(\x)^2*cos(\x)});
    \draw[dashed] (0,0) -- ({2.1*sin(45)},{2.1*cos(45)}); \draw[dashed] (0,0) -- ({2.1*sin(135)},{2.1*cos(135)});
    \draw[->] ({0.8*sin(45)},{0.8*cos(45)}) arc (45:-45:0.8);
    \node[font=\scriptsize,anchor=west] at (0.9,1.6) {$-3$ dB at $45^\circ$};
    \node[font=\scriptsize,anchor=west] at (-2.2,-1.5) {HPBW $90^\circ$ (arc)};
    \node[font=\scriptsize] at (0.45,2.05) {null};
    \draw[thick] (0,-0.3) -- (0,0.3);
  \end{scope}
  \begin{scope}[xshift=4.2cm,yshift=-1.9cm]
    \draw[->] (0,0) -- (8.2,0) node[right,font=\scriptsize] {angle};
    \draw[->] (4,0) -- (4,4.3) node[above,font=\scriptsize] {dB};
    \foreach \v/\l in {4/0,3/{-10},2/{-20},1/{-30}} { \draw (3.92,\v) -- (4.08,\v); \node[font=\tiny,anchor=east] at (3.9,\v) {\l}; }
    \draw[thick,blue!70!black,domain=-11.9:11.9,samples=241] plot ({4+\x/3},{max(0,4+0.1*20*ln(abs(sin((\x+0.0001) r)/(\x+0.0001))+0.00001)/ln(10))});
    \draw[dashed,red!60!black] (3.0,3.7) -- (5.0,3.7);
    \draw[<->,red!60!black] ({4-0.464},3.7) -- ({4+0.464},3.7);
    \node[font=\scriptsize,text=red!60!black,anchor=west] at (5.05,3.7) {3 dB beamwidth};
    \draw[->] (6.4,3.2) -- ({4+4.49/3},{4-1.32});
    \node[font=\scriptsize,anchor=south west] at (6.2,3.2) {first sidelobe $-13$ dB};
    \draw[->] (1.6,2.8) -- ({4-3.14/3},0.15);
    \node[font=\scriptsize,anchor=south] at (1.6,2.8) {null};
    \node[font=\scriptsize] at (6.8,-0.35) {sidelobes};
    \node[font=\scriptsize] at (4,-0.35) {main beam};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!note]- Detail: antenna families (Pozar §14.1)
> | Family | Examples | Gain | Typical band |
> |---|---|---|---|
> | Wire | dipole, monopole, loop, Yagi–Uda | low | HF to UHF; light, cheap, simple |
> | Aperture | open waveguide, horn, reflector, lens, reflectarray | moderate to high | microwave, mm-wave |
> | Printed | slot, printed dipole, microstrip patch | low per element | microwave, mm-wave; photolithographic, arrays easily |
> | Array | elements + feed network | set by size | any; amplitude/phase set beam angle and sidelobes; a **phased array** scans electronically with phase shifters |
>
> Typical directivities: wire dipole 2.2 dB, microstrip patch 7.0 dB, waveguide horn 23 dB, parabolic reflector 35 dB.

### Radiation Pattern and Directivity

$$
\boxed{D=\frac{U_{max}}{U_{avg}}=\frac{4\pi U_{max}}{P_{rad}}}\qquad\boxed{D\approx\frac{32{,}400}{\theta_1\theta_2}\ \ (\text{pencil beam, degrees})}
$$

- **Pattern:** $\lvert F\rvert$ (or $U$) vs angle at fixed $r$, plotted in dB normalized to the peak. Main beam, sidelobes, nulls; 3 dB (half-power) beamwidth.
- **Directivity** compares the peak with an isotropic radiator of the same total power; an isotropic radiator has $D=1$ (0 dBi), and no antenna has less.
- **Omnidirectional** (constant in azimuth): broadcasting and handsets. **Pencil beam** (narrow in both planes): radar, point-to-point links.
- Beamwidth and directivity are related only approximately: two patterns with the same main beam can have different $D$ because of sidelobes. The $32{,}400/(\theta_1\theta_2)$ rule fails for omnidirectional patterns.

> [!example] The short dipole (Pozar Ex. 14.2)
> $E_\theta=V_0\sin\theta\,e^{-jk_0r}/r$, so $U=C\sin^2\theta$ with $C=V_0^2/2\eta_0$. Beam maximum at $\theta=90^\circ$, nulls along $z$. Half power where $\sin^2\theta=0.5$: $\theta=45^\circ,135^\circ$, beamwidth $90^\circ$. $P_{rad}=2\pi C\int_0^\pi\sin^3\theta\,d\theta=8\pi C/3$, so $D=4\pi C/(8\pi C/3)=3/2=$ **1.76 dB**.

### Gain and Efficiency

$$
\boxed{\eta_{rad}=\frac{P_{rad}}{P_{in}}=1-\frac{P_{loss}}{P_{in}}}\qquad\boxed{G=\eta_{rad}D}
$$

- Directivity depends only on the pattern shape; **gain** also charges the antenna for its ohmic and dielectric loss. $G\le D$.
- Mismatch and polarization loss are *not* in $G$ (they are fixable outside the antenna). Gain that includes mismatch is called **realized gain**.

### Effective Area and Aperture Efficiency

$$
\boxed{P_r=A_eS_{avg}}\qquad\boxed{A_e=\frac{D\lambda^2}{4\pi}\ (\to G\ \text{with loss})}\qquad\boxed{D=\eta_{ap}\frac{4\pi A}{\lambda^2}\le\frac{4\pi A}{\lambda^2}}
$$

- $A_e$ is the **capture area**: received power over incident power density, into a conjugate-matched load.
- For an electrically large aperture of physical area $A$, $A_e$ approaches $A$; for dipoles and loops there is no simple relation.
- **Aperture efficiency** $\eta_{ap}\le1$ charges for non-uniform amplitude/phase, blockage and feed spillover. It reduces directivity but, unlike $\eta_{rad}$, adds no thermal noise.
- Designer reading: a gain spec is an **aperture size** spec, $A=G\lambda^2/(4\pi\eta_{ap}\eta_{rad})$. Double the frequency and the same dish gains 6 dB.

> [!example] Two apertures (Pozar §14.1; second computed here)
> - A $2\lambda\times3\lambda$ horn: $D_{max}=4\pi(6\lambda^2)/\lambda^2=24\pi$, about **19 dB**.
> - The 18 in DBS dish at 12.4 GHz: $A=\pi(0.2286)^2=0.164$ m², $4\pi A/\lambda^2=3525$ (35.5 dB). Pozar's 33.5 dB gain then implies $\eta_{ap}\eta_{rad}\approx0.63$.

## Level 2: Antenna Noise Temperature

```tikz title="Where the noise comes from: a background T_B(theta, phi) weighted by the pattern gives the brightness temperature T_b; antenna loss at T_p turns it into T_A; a lossy, mismatched line adds more before the receiver. After Pozar Figs. 14.5, 14.8, 14.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.9cm,minimum height=1.0cm,align=center,font=\scriptsize}}
  \draw[gray,fill=gray!8] (-1.0,-1.6) rectangle (2.2,1.6);
  \node[font=\scriptsize,align=center] at (0.7,1.15) {sky $T_B$: zenith 3--5 K};
  \node[font=\scriptsize,align=center] at (0.7,0.5) {horizon 50--100 K};
  \node[font=\scriptsize,align=center] at (0.7,-0.15) {ground 290--300 K};
  \node[font=\scriptsize,align=center] at (0.7,-0.95) {Sun, man-made,\\ via sidelobes};
  \node[b] (ant) at (3.6,0) {antenna\\ $\eta_{rad}$, $T_p$};
  \node[b] (tl) at (7.0,0) {lossy line\\ $L_T$, $T_p$, $\Gamma$};
  \node[b] (rx) at (10.4,0) {receiver\\ $T_{REC}$};
  \draw[->] (2.2,0) -- (ant) node[midway,above,font=\scriptsize] {$T_b$};
  \draw[->] (ant) -- (tl) node[midway,above,font=\scriptsize] {$T_A$};
  \draw[->] (tl) -- (rx) node[midway,above,font=\scriptsize] {$T_S$};
  \node[font=\scriptsize,align=center,text=blue!60!black] at (4.2,-1.15) {$T_A=\eta_{rad}T_b+(1-\eta_{rad})T_p$};
  \node[font=\scriptsize,align=center,text=blue!60!black] at (7.0,-1.85) {adds $(L_T-1)T_p$ at its input};
  \node[font=\scriptsize,align=center,text=blue!60!black] at (10.4,-1.15) {multiplied by $L_T$\\ when referred to the antenna};
\end{circuitikz}
\end{document}
```

### Brightness Temperature

$$
\boxed{T_b=\frac{\displaystyle\int_0^{2\pi}\!\!\int_0^\pi T_B(\theta,\phi)D(\theta,\phi)\sin\theta\,d\theta\,d\phi}{\displaystyle\int_0^{2\pi}\!\!\int_0^\pi D(\theta,\phi)\sin\theta\,d\theta\,d\phi}}
$$

- $T_B(\theta,\phi)$ is the **background temperature**: the resistor temperature that gives the same noise as what the antenna looks at. $T_b$ is that background averaged with the pattern as the weight. A uniform background gives $T_b=T_B$.
- Typical $T_B$ at low microwave frequencies (Pozar p. 667): sky at zenith 3–5 K (cosmic background), sky at horizon 50–100 K, ground 290–300 K. The sky gets hotter toward the horizon (more atmosphere) and has peaks at **22 GHz** (water) and **60 GHz** (oxygen), where a high-gain antenna through the atmosphere sees almost a 290 K load.
- **Sidelobes matter.** In Pozar Ex. 14.3 most of the noise enters through the sidelobes.

> [!example]- Pattern-weighted brightness (Pozar Ex. 14.3)
> Idealised hemispherical pattern, rotationally symmetric (normalised): $D=1$ for $\theta<1^\circ$, $D=0.01$ ($-20$ dB) for $1^\circ<\theta<90^\circ$. Background: $T_B=10$ K for $\theta<30^\circ$, $100$ K for $30^\circ<\theta<90^\circ$ (Pozar Fig. 14.7).
> $$T_b=\frac{\int_0^{1^\circ}10\sin\theta\,d\theta+\int_{1^\circ}^{30^\circ}0.1\sin\theta\,d\theta+\int_{30^\circ}^{90^\circ}1\cdot\sin\theta\,d\theta}{\int_0^{1^\circ}\sin\theta\,d\theta+\int_{1^\circ}^{90^\circ}0.01\sin\theta\,d\theta}=\frac{0.00152+0.0134+0.866}{0.0102}=86.4\ \text{K}.$$
> With $\eta_{rad}=1$, $T_A=T_b=86.4$ K. The main beam looks at 10 K, yet 98% of the noise arrives through the $-20$ dB sidelobes looking at the 100 K region, because they cover far more solid angle.

### Antenna Noise Temperature

$$
\boxed{T_A=\eta_{rad}T_b+(1-\eta_{rad})T_p}
$$

- Model a lossy antenna as a lossless one followed by an attenuator $L=1/\eta_{rad}$ at the antenna's physical temperature $T_p$. The attenuator scales the sky down and adds its own $(L-1)T_p$ (referred to its input), which at the output is the formula above.
- Limits: $\eta_{rad}=1$ gives $T_A=T_b$; $\eta_{rad}=0$ gives $T_A=T_p$ (a matched load). Pointed at a known background $\ne T_0$, this measures $\eta_{rad}$.
- $T_A$ is defined at the antenna's **output terminals**; an antenna is not a two-port, so it has no "input-referred" temperature.

> [!tip] Remark
> The attenuator step is [[RF Noise and Distortion#Noise Figure of a Lossy Network]]: a matched loss $L$ at $T$ has $T_e=(L-1)T$, and at $T_0$ its noise figure is $L$. That is why the feed line goes before the LNA only reluctantly.

### Antenna, Lossy Line and Mismatch

$$
\boxed{T_S=\frac{1-\lvert\Gamma\rvert^2}{L}\left[\eta_{rad}T_b+(1-\eta_{rad})T_p\right]+\frac{L-1}{L}\left(1+\frac{\lvert\Gamma\rvert^2}{L}\right)T_p}
$$

- At the receiver end of a line of loss $L$ at $T_p$, with an antenna mismatch $\Gamma$. Three terms: the antenna's noise attenuated by the line and the mismatch; the line's forward noise; the line's backward noise reflected off the antenna.
- Matched ($\Gamma=0$): $T_S=T_A/L+(L-1)T_p/L$, the plain cascade. Lossless line: a mismatch lowers $T_S$ by $1-\lvert\Gamma\rvert^2$, but lowers the signal by exactly as much.
- **$\eta_{rad}$ vs $\eta_{ap}$:** radiation efficiency is ohmic loss and so makes noise; aperture efficiency only reshapes the pattern and adds no noise of its own.

### G/T Figure of Merit

$$
\boxed{G/T\,[\text{dB/K}]=10\log\frac{G}{T}}
$$

- The receive station's figure of merit: $\mathrm{SNR}\propto P_r/T\propto G_r/T$. $T$ is $T_A$ for the antenna alone, or the system temperature when the receiver is included (Pozar Ex. 14.4 uses antenna + LNB).
- More gain usually helps twice: a bigger numerator and a narrower beam that sees less of the hot horizon. The cost is size, and coverage: handsets need omnidirectional antennas, so their $G/T$ is low by design.
- "dB/K" is the conventional name; the quantity is $10\log$ of a ratio with units 1/K.

## Level 3: Receiver System Temperature and SNR

$$
\boxed{T_{REC}=T_{RF}+\frac{T_M}{G_{RF}}+\frac{T_{IF}L_M}{G_{RF}}}\qquad\boxed{T_{TL}=(L_T-1)T_p}
$$
$$
\boxed{T_{SYS}=T_A+(L_T-1)T_p+L_TT_{REC}}\qquad\boxed{\frac{S_o}{N_o}=\frac{S_i}{kBT_{SYS}}}
$$

- Every temperature is referred to the **antenna terminals**. The receiver term is multiplied by $L_T$: a lossy feed line ahead of the receiver multiplies the receiver's noise by its loss.
- $G_{SYS}=G_{RF}G_{IF}/(L_TL_M)$ multiplies signal and noise alike, so it drops out of the SNR.
- **Use temperatures, not a system noise figure,** whenever the antenna does not see 290 K: noise figure is defined only for $N_i=kT_0B$ (Pozar p. 680).

> [!tip] Remark
> $T_{REC}$ is Friis in temperature form, [[RF Noise and Distortion#Friis Formula]], with the mixer's conversion loss $L_M$ acting as a gain $1/L_M$. That note owns the cascade; this one only adds the antenna and line in front of it.

```tikz title="Pozar Ex. 14.5: where the 762 K of system temperature comes from. The receiver's 304 K becomes 429 K after the 1.5 dB feed line; the line itself adds 123 K; the antenna brings 210 K."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\s{0.014}
  \fill[green!25] (0,0) rectangle ({210*\s},0.9);
  \fill[orange!35] ({210*\s},0) rectangle ({333*\s},0.9);
  \fill[blue!25] ({333*\s},0) rectangle ({762*\s},0.9);
  \draw (0,0) rectangle ({762*\s},0.9);
  \node[font=\scriptsize,align=center] at ({105*\s},0.45) {$T_A$\\ 210 K};
  \node[font=\scriptsize,align=center] at ({271*\s},0.45) {$T_{TL}$\\ 123 K};
  \node[font=\scriptsize,align=center] at ({548*\s},0.45) {$L_TT_{REC}=1.41\times304$\\ 429 K};
  \draw[->] (0,-0.2) -- ({800*\s},-0.2) node[right,font=\scriptsize] {K};
  \foreach \v in {0,200,400,600,762} { \draw ({\v*\s},-0.27) -- ({\v*\s},-0.13); \node[below,font=\tiny] at ({\v*\s},-0.27) {\v}; }
  \node[font=\scriptsize,align=left,anchor=west] at (0,1.5) {$T_{REC}=289+1163/100+84(4.0)/100=304$ K: the LNA's own 289 K dominates the receiver};
\end{circuitikz}
\end{document}
```

> [!example] SNR of a microwave receiver (Pozar Ex. 14.5)
> 4 GHz, $B=1$ MHz. Antenna $G_A=26$ dB, $\eta_{rad}=0.9$, $T_b=200$ K, $T_p=300$ K; line $L_T=1.5$ dB (1.41). RF amp 20 dB, NF 3 dB; mixer $L_M=6$ dB, NF 7 dB; IF amp 30 dB, NF 1.1 dB. $S_i=-80$ dBm at the antenna terminals.
> - Temperatures: $T_{RF}=289$ K, $T_M=1163$ K, $T_{IF}=84$ K; $T_{REC}=304$ K; $T_{TL}=(1.41-1)300=123$ K; $T_A=0.9(200)+0.1(300)=210$ K.
> - Input: $N_i=kBT_A=2.9\times10^{-15}$ W $=-115$ dBm, so $S_i/N_i=$ **35 dB**.
> - $T_{SYS}=210+123+1.41(304)=762$ K; $kBT_{SYS}=-110$ dBm, so $S_o/N_o=$ **30 dB**.
>
> Five dB is lost, and the bar above shows how to win it back: the feed line costs its own 123 K *and* inflates the receiver by 41%. Putting the LNA at the antenna (as a DBS LNB does) removes both.

## Level 4: Modulation and the BER Threshold

$$
\boxed{E_b=ST_b=\frac{S}{R_b}}\qquad\boxed{\frac{E_b}{n_0}=\frac{S}{n_0R_b}=\frac{S}{N}\cdot\frac{B}{R_b}}
$$

- Binary keying switches amplitude (**ASK**), frequency (**FSK**) or phase by 180° (**PSK/BPSK**). **QPSK** sends 2 bits per symbol (four phases), $m$-ary PSK sends $m$; **QAM** keys amplitude and phase together.
- BER depends on $E_b/n_0$. For a fixed SNR, raising the data rate lowers $E_b/n_0$ and raises the BER. The receiver bandwidth is one to several times the bit rate.

| Modulation | $E_b/n_0$ for BER $10^{-5}$ | Bandwidth efficiency (bps/Hz) |
|---|---|---|
| Binary ASK | 15.6 dB | 1 |
| Binary FSK | 12.6 dB | 1 |
| BPSK | 9.6 dB | 1 |
| QPSK | 9.6 dB | 2 |
| 8-PSK | 13.0 dB | 3 |
| 16-PSK | 18.7 dB | 4 |
| 16-QAM | 13.4 dB | 4 |
| 64-QAM | 17.8 dB | 6 |

- QPSK has BPSK's BER at the same $E_b/n_0$ but carries twice the bits per hertz (coherent detection, Gray coding; Pozar Fig. 14.16, Table 14.1).
- Higher-order modulation buys bandwidth efficiency with $E_b/n_0$ (link budget) and with linearity: the same constellation needs a lower EVM, which is [[RF Noise and Distortion#AM-AM and AM-PM]] for the PA and phase noise for the LO.

```tikz title="Pozar Table 14.1 plotted: each step up in bits per hertz costs E_b/n_0 at BER 1e-5, i.e. link budget. QAM uses the plane better than PSK of the same efficiency."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\xs{0.45} \def\ys{0.6}
  \draw[->] (0,0) -- ({20*\xs},0) node[right,font=\scriptsize] {$E_b/n_0$ (dB)};
  \draw[->] (0,0) -- (0,{6.8*\ys}) node[above,font=\scriptsize] {bps/Hz};
  \foreach \v in {8,10,12,14,16,18} { \draw ({(\v-6)*\xs},-0.07) -- ({(\v-6)*\xs},0.07); \node[below,font=\tiny] at ({(\v-6)*\xs},-0.07) {\v}; }
  \foreach \v in {1,...,6} { \draw (-0.07,{\v*\ys}) -- (0.07,{\v*\ys}); \node[left,font=\tiny] at (-0.07,{\v*\ys}) {\v}; }
  \foreach \e/\b/\l/\p in {15.6/1/ASK/below, 12.6/1/FSK/below, 9.6/1/BPSK/below, 9.6/2/QPSK/left, 13.0/3/8-PSK/left, 18.7/4/16-PSK/left, 13.4/4/16-QAM/left, 17.8/6/64-QAM/left} {
    \fill[blue!70!black] ({(\e-6)*\xs},{\b*\ys}) circle (2.2pt);
    \node[font=\tiny,\p] at ({(\e-6)*\xs},{\b*\ys}) {\l};
  }
\end{circuitikz}
\end{document}
```

> [!note]- Detail: the wireless systems Pozar surveys (§14.2)
> - **By users:** point-to-point (one TX, one RX, high-gain fixed antennas: satellite links, utility data, cellular backhaul in the 18, 24, 38 GHz bands); point-to-multipoint (broadcast AM/FM/TV); multipoint-to-multipoint (cellular, WLAN, through base stations).
> - **By direction:** simplex (broadcast, paging), half-duplex (push-to-talk), full-duplex (cellular, point-to-point). Full duplex needs **frequency-division duplexing** (separate TX and RX bands, a duplex filter) or **time-division duplexing** (a switch).
> - **Satellites:** GEO at about 36,000 km, 24 h period, fixed in the sky, but the path loss makes handset links hard and adds conversational delay. LEO at 500–2000 km, visible for minutes, so many satellites are needed (Iridium: 66 satellites).
> - **GPS:** 24 satellites at 20,200 km; L1 1575.42 MHz, L2 1227.60 MHz; BPSK spread spectrum; received level about $-130$ dBm into a 0 dB antenna, *below* the noise, recovered by despreading. Ranging by timing the delay to at least four satellites.
> - **WLAN:** IEEE 802.11 at 2.4 / 5.7 GHz ISM bands, 54 Mbps (a/b/g), 150 Mbps (n, multiple antennas). **Bluetooth:** 2.4 GHz, 1–100 mW, 1–100 m. **DBS:** 10–12 GHz, QPSK with multiplexing and error correction delivering about 40 Mbps into an 18 in dish; opposite circular polarizations on neighbouring satellites (polarization duplexing).
> - **Bands** (Pozar Table 14.2): GSM 900 U 890–915 / D 935–960 MHz; GSM 1800 U 1710–1785 / D 1805–1880 MHz; UMTS band 1 U 1920–1980 / D 2110–2170 MHz; ISM 902–928 MHz, 2.400–2.484 GHz, 5.725–5.850 GHz; DBS (Americas) 12.2–12.7 GHz.

## Level 5: Receiver Architectures

A receiver must deliver (Pozar p. 677): **gain** of about 100 to 120 dB (antenna levels are $-100$ to $-120$ dBm); **selectivity** against adjacent channels, the image and interference; **down-conversion** to an IF; **detection**; and **isolation** from its own transmitter. Two rules shape every architecture:

- Spread the gain over RF, IF and baseband, **no more than about 50–60 dB at any one frequency**, to avoid feedback and oscillation. RF gain also costs more than IF gain.
- Build selectivity at a **fixed, lower IF**, where sharp filters are realizable, and tune with the LO. A narrow, electronically tunable RF filter is not practical.

```tikz title="Three receivers. (a) Superheterodyne: the image filter must act before the mixer, the channel filter after it. (b) Zero-IF / low-IF: quadrature mixing to baseband (or a low IF); the image is removed by I/Q phase, not by an RF filter. After Pozar Figs. 14.12, 14.13 and binder pp. 403, 408."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.25cm,minimum height=0.75cm,align=center,font=\scriptsize}}
  \node[font=\scriptsize,anchor=west] at (-0.6,1.0) {(a) superheterodyne};
  \node[b] (a1) at (0.6,0) {preselect\\ BPF};
  \node[b] (a2) at (2.3,0) {LNA};
  \node[b] (a3) at (4.0,0) {image\\ BPF};
  \node[b,circle,minimum width=0.7cm] (a4) at (5.6,0) {$\times$};
  \node[b] (a5) at (7.2,0) {channel BPF\\ at $f_{IF}$};
  \node[b] (a6) at (8.9,0) {IF amp\\ (AGC)};
  \node[b] (a7) at (10.6,0) {detector\\ / ADC};
  \node[b,fill=green!8] (lo) at (5.6,-1.2) {LO $f_{RF}\pm f_{IF}$};
  \draw[->] (-0.4,0) -- (a1); \draw[->] (a1) -- (a2); \draw[->] (a2) -- (a3); \draw[->] (a3) -- (a4); \draw[->] (a4) -- (a5); \draw[->] (a5) -- (a6); \draw[->] (a6) -- (a7);
  \draw[->] (lo) -- (a4);
  \node[font=\tiny,text=red!60!black,align=center] at (4.0,-0.85) {kills $f_{IM}$\\ ($2f_{IF}$ away)};
  \node[font=\tiny,text=red!60!black,align=center] at (7.2,-0.85) {selects the\\ channel};
  \begin{scope}[yshift=-4.0cm]
    \node[font=\scriptsize,anchor=west] at (-0.6,1.6) {(b) zero-IF ($f_{LO}=f_{RF}$) or low-IF ($f_{LO}=f_{RF}\pm$ small $f_{IF}$)};
    \node[b] (b1) at (0.6,0) {BPF};
    \node[b] (b2) at (2.3,0) {LNA};
    \node[b,circle,minimum width=0.7cm] (bi) at (4.3,0.85) {$\times$};
    \node[b,circle,minimum width=0.7cm] (bq) at (4.3,-0.85) {$\times$};
    \node[b] (li) at (6.0,0.85) {LPF};
    \node[b] (lq) at (6.0,-0.85) {LPF};
    \node[b] (di) at (7.6,0.85) {ADC};
    \node[b] (dq) at (7.6,-0.85) {ADC};
    \node[b,minimum height=2.4cm] (dsp) at (9.4,0) {DSP\\ (image\\ rejection,\\ demod)};
    \node[b,fill=green!8] (lo2) at (4.3,0) {LO\\ $0^\circ/90^\circ$};
    \draw[->] (-0.4,0) -- (b1); \draw[->] (b1) -- (b2); \draw (b2.east) -- (3.2,0);
    \draw[->] (3.2,0) |- (bi); \draw[->] (3.2,0) |- (bq);
    \draw[->] (bi) -- (li); \draw[->] (bq) -- (lq); \draw[->] (li) -- (di); \draw[->] (lq) -- (dq);
    \draw[->] (di) -- (dsp.west |- di); \draw[->] (dq) -- (dsp.west |- dq);
    \draw[->] (lo2) -- (bq); \draw[->] (lo2) -- (bi);
    \node[font=\scriptsize] at (3.6,1.15) {I}; \node[font=\scriptsize] at (3.6,-0.55) {Q};
    \node[font=\tiny,text=red!60!black,align=left,anchor=west] at (10.4,0.5) {zero-IF: LO leak\\ self-mixes to DC;\\ $1/f$ noise in band};
    \node[font=\tiny,text=red!60!black,align=left,anchor=west] at (10.4,-0.7) {low-IF: image is a\\ neighbouring channel,\\ removed by I/Q phase};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Tuned RF Receiver

Several tunable RF amplifier and filter stages, then a detector (Pozar Fig. 14.11). Every stage must be tuned together, the filters are broad, and all the gain is at one frequency, so it oscillates before it gets enough gain. Seldom used today; a bad choice at microwave frequencies.

### Superheterodyne Receiver

- Mix to a fixed, intermediate IF; select the channel with a sharp IF filter; tune with the LO. IF gain is cheap and stable. Used in most broadcast radios, TVs, radars, cellular and data systems (Pozar p. 678).
- **Image:** the frequency on the other side of the LO, $2f_{IF}$ from the wanted signal, converts to the same IF and cannot be separated after the mixer. The system must remove it **before** the mixer (preselect / image filter, rejection from [[#Spec translation]]) or cancel it by phase.
- **The IF choice is a trade** (binder p. 408). A high IF puts the image far away, so an RF filter wide enough to pass all channels can still reject it; but channel selection at a high IF needs a higher-Q filter. A low IF makes the channel filter easy and the image filter impossible ("low IF requires high Q").
- **Dual conversion** splits the problem: a first high IF for image rejection, a second low IF for channel selection. Used at microwave and mm-wave, also to relax LO stability (Pozar p. 678).

> [!tip] Remark
> The image frequency $f_{IM}=f_{LO}-f_{IF}$ (for $f_{RF}=f_{LO}+f_{IF}$), the LO-side choice and the spectrum picture are owned by [[Mixers and Microwave Oscillators#Image Frequency]]. This note only budgets how much rejection the system needs.

### Direct-Conversion (Zero-IF) Receiver

- LO at the RF carrier: the signal goes straight to baseband (a **homodyne**). Selectivity is a simple low-pass filter; no IF filter, IF amplifier or second LO. Cheaper and simpler (Pozar p. 678).
- **No image:** the difference frequency is zero and the sum ($2f_{LO}$) is easily filtered. For phase or frequency modulation the two sidebands must be kept apart, hence the I/Q pair of mixers in diagram (b).
- **Costs:**
  - The LO must be very precise and stable, especially at high RF, or the baseband signal drifts.
  - **LO feedthrough** (binder pp. 409–410): LO leaks to the RF port through parasitic capacitance and the supply; it mixes with itself (**self-mixing**) and gives DC (and $2f_0$) at the output, right on top of the signal. A heterodyne does not care (DC is out of its band); a homodyne does. (Mixer-level isolation: [[Mixers and Microwave Oscillators#Intermodulation and Isolation]].) LO leaking further back out of the antenna can violate emission limits, so the LNA's reverse isolation matters.
  - Stable high gain at very low frequencies is hard, and $1/f$ noise sits in band.
- Classic use: Doppler radar, where the exact LO is the transmitter itself ([[#Doppler Radar]]).

### Low-IF Receiver and Image Rejection at the System Level

- **Low-IF** (binder p. 403): a nonzero but small IF. It keeps the DC offset and $1/f$ noise out of the band like a heterodyne, but its image is only $2f_{IF}$ away, often an adjacent channel, which no RF filter can remove (binder p. 408).
- So a low-IF receiver rejects its image by **phase**, not by filtering: an **image-reject mixer** (two quadrature paths recombined through a 90° hybrid) sends the two sidebands to different ports (Pozar Fig. 13.31). Run backwards it is the transmitter's **single-sideband modulator**.
- System consequence: image rejection is now set by gain and phase **matching** of two paths, not by a filter's $Q$; Pozar notes a good hybrid is hard at a low IF and costs some loss and NF.

> [!tip] Remark
> The image-reject mixer circuit and its analysis are [[Mixers and Microwave Oscillators#Image-Reject Mixer]], its hybrids [[Power Dividers and Couplers#Balanced and Image-Reject Mixers]]; conversion loss, SSB vs DSB noise figure and LO isolation are [[Mixers and Microwave Oscillators#Level 5 Mixer Characteristics]]. Here only the system consequence matters: low-IF and zero-IF move the image problem from the RF filter to I/Q matching.

> [!warning] Unverified
> **Digital IF** is not covered by Pozar Ch. 14 or the binder. As commonly described: the ADC samples the (first) IF directly, and the final down-conversion, channel filtering and I/Q separation are done digitally, which removes I/Q mismatch and the analog channel filter at the price of a faster, higher-dynamic-range ADC (the ADC must take every unfiltered blocker). Treat this paragraph as orientation only.

### Choosing a Receiver Architecture

| Architecture | Image | Channel selection | Main problems | Typical use (sources) |
|---|---|---|---|---|
| Tuned RF | n/a | tuned RF filters (broad) | ganged tuning, all gain at RF | obsolete |
| Superheterodyne | RF / image filter before the mixer | sharp fixed IF filter | image filter vs IF choice, many parts | broadcast, radar, cellular, data |
| Dual-conversion superhet | first (high) IF | second (low) IF | two LOs, two sets of spurs | microwave, mm-wave |
| Zero-IF | none | baseband LPF | LO precision, LO leakage → DC, $1/f$, LO re-radiation | Doppler radar, newer wireless |
| Low-IF | I/Q phase (image-reject mixer) | low-IF filter | image rejection set by I/Q match; hybrid at low IF | binder p. 403 |

## Level 6: Transmitter and Transceiver Architectures

### Transceiver Architectures

```tikz title="Transmitters. (a) Direct up-conversion with an I/Q (single-sideband) modulator. (b) Two-step: modulate at an IF, then up-convert; the RF BPF removes the unwanted sideband and LO leakage. Both end in PA, isolator and duplexer. After binder p. 258, Pozar Fig. 14.21 and §13.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.2cm,minimum height=0.75cm,align=center,font=\scriptsize}}
  \node[font=\scriptsize,anchor=west] at (-0.4,1.3) {(a) direct (I/Q) up-conversion};
  \node[b] (d1) at (0.4,0.45) {DAC I}; \node[b] (d2) at (0.4,-0.45) {DAC Q};
  \node[b] (f1) at (2.0,0.45) {LPF}; \node[b] (f2) at (2.0,-0.45) {LPF};
  \node[b,circle,minimum width=0.6cm] (m1) at (3.6,0.45) {$\times$}; \node[b,circle,minimum width=0.6cm] (m2) at (3.6,-0.45) {$\times$};
  \node[b,circle,minimum width=0.6cm] (sum) at (4.9,0) {$+$};
  \node[b] (bp) at (6.3,0) {BPF};
  \node[b] (dr) at (7.8,0) {driver};
  \node[b] (pa) at (9.3,0) {PA};
  \node[b] (is) at (10.8,0) {isolator};
  \node[b,fill=orange!10] (dx) at (12.4,0) {duplexer};
  \draw[->] (d1) -- (f1); \draw[->] (d2) -- (f2); \draw[->] (f1) -- (m1); \draw[->] (f2) -- (m2);
  \draw[->] (m1) -- (sum); \draw[->] (m2) -- (sum); \draw[->] (sum) -- (bp); \draw[->] (bp) -- (dr); \draw[->] (dr) -- (pa); \draw[->] (pa) -- (is); \draw[->] (is) -- (dx);
  \draw[thick] (12.4,0.38) -- (12.4,0.9); \draw[thick] (12.1,1.2) -- (12.4,0.9) -- (12.7,1.2);
  \node[font=\tiny] at (3.6,-1.15) {LO $0^\circ/90^\circ$ at $f_{RF}$};
  \draw[->] (3.6,-0.95) -- (m2);
  \node[font=\tiny,text=red!60!black,align=center] at (8.8,-0.95) {EIRP $=P_{out}G_t/L_t$;\\ ACPR, EVM};
  \node[font=\tiny,text=red!60!black,align=center] at (11.3,-0.95) {absorbs reflected\\ power};
  \begin{scope}[yshift=-3.0cm]
    \node[font=\scriptsize,anchor=west] at (-0.4,0.9) {(b) two-step (heterodyne) transmitter};
    \node[b] (e1) at (0.4,0) {DAC};
    \node[b,circle,minimum width=0.6cm] (e2) at (2.0,0) {$\times$};
    \node[b] (e3) at (3.4,0) {IF BPF};
    \node[b,circle,minimum width=0.6cm] (e4) at (4.9,0) {$\times$};
    \node[b] (e5) at (6.3,0) {RF BPF};
    \node[font=\scriptsize,anchor=west] at (7.3,0) {driver $\to$ PA $\to$ isolator $\to$ duplexer};
    \draw[->] (e1) -- (e2); \draw[->] (e2) -- (e3); \draw[->] (e3) -- (e4); \draw[->] (e4) -- (e5); \draw[->] (e5) -- (7.3,0);
    \node[font=\tiny] at (2.0,-0.75) {LO$_1$ ($f_{IF}$)}; \node[font=\tiny] at (4.9,-0.75) {LO$_2$};
    \node[font=\tiny,text=red!60!black,align=center] at (7.0,-0.95) {passes $f_{LO2}+f_{IF}$, kills\\ $f_{LO2}-f_{IF}$ and LO leak};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **The TX chain** (binder pp. 2, 258): DSP → DAC → LPF → up-converting mixer → BPF → pre-amp (driver) → PA → duplexer → antenna. It mirrors the receiver, and in a transceiver the two share the LO.
- **Why the BPF after the mixer:** a mixer driven at $f_{LO}$ makes both sidebands $f_{LO}\pm f_{IF}$ (Pozar Eq. 13.89) plus LO leakage. The filter keeps one; an I/Q (SSB) modulator suppresses the other by phase, the transmit twin of the image-reject mixer.
- **The PA sets EIRP:** $P_{out}=\mathrm{EIRP}-G_t+L_t$. For linear modulations the PA runs backed off, and its AM-AM / AM-PM distortion regrows the spectrum (ACPR, the emission mask) and spreads the constellation (EVM). Those system metrics are defined in [[RF Noise and Distortion#AM-AM and AM-PM]] and designed against in [[RF Amplifier Design]].
- **Sharing the LO** between up- and down-conversion keeps TX and RX frequencies locked together and avoids drift (Pozar's pulse radar does exactly this).

### Duplexing

| Method | How | Isolation (Pozar) | Used when |
|---|---|---|---|
| Frequency division (FDD) | duplex filter: TX and RX bands on separate filters | set by filter rejection at the other band | cellular full duplex |
| Time division (TDD) | T/R switch | switch isolation; radars need **80–100 dB** | half-duplex, pulse radar |
| Circulator | ferrite three-port, $1\to2\to3$ | **20–30 dB** | CW / Doppler radar (leakage at $f_0$ is filtered at DC) |
| Polarization | opposite circular polarizations | | DBS neighbouring satellites |

- Transmit leakage must stay below what the LNA can take: $\text{isolation}\ge P_t-P_{allowed}$. In a pulse radar the leakage would drown the echo or damage the receiver, so a circulator alone is not enough (Pozar p. 693).
- The duplex filter's rejection at the TX band is the filter spec; designing it is [[Microwave Filters]] (Pozar Problem 8.24 asks for 30 dB at the TX band edge of a PCS receiver).

### Isolators and Circulators in a System

$$
\boxed{[S]_{isolator}=\begin{bmatrix}0&0\\1&0\end{bmatrix}}\qquad\boxed{[S]_{circulator}=\begin{bmatrix}0&0&1\\1&0&0\\0&1&0\end{bmatrix}}
$$

- **Isolator:** matched, passes $1\to2$, absorbs $2\to1$. Placed after a PA (or an oscillator) so that load reflections cannot reach and damage or pull it. It can replace a matching network at the output, but reflected power is then absorbed, not returned to the load.
- **Circulator:** $1\to2\to3\to1$. With one port terminated it *is* an isolator; as an antenna duplexer it sends TX to the antenna and the antenna to RX.

> [!note]- Detail: what Pozar Ch. 9 says about them (ferrites, nonreciprocity, mismatch)
> - **Why ferrite.** A passive device made of isotropic materials is reciprocal ($S_{ij}=S_{ji}$). A DC-biased ferrite (YIG and other iron-oxide compounds) has a tensor permeability: its magnetic dipoles precess about the bias, and a circularly polarized wave rotating with the precession interacts strongly while the opposite rotation does not. Since the sense of rotation flips with the direction of travel, propagation becomes direction-dependent.
> - **Isolator** (Eq. 9.85): $[S]$ is not unitary, so an isolator must be **lossy**; not symmetric, so nonreciprocal. Waveguide versions: resonance isolators (operate near gyromagnetic resonance; narrow band) and field-displacement isolators (smaller bias field, compact, high isolation).
> - **Circulator** (Eq. 9.91): a matched, lossless three-port must be nonreciprocal ([[Power Dividers and Couplers#Why a Three-Port Can't Do It All]]). Reversing the bias field reverses the circulation; with an electromagnet the remanent (latching) state makes it an **SPDT switch**. The stripline junction circulator is a ferrite-disk resonator whose bias splits one mode into two that add at the output port and cancel at the isolated port.
> - **Mismatch costs isolation** (Eqs. 9.92–9.94): for a lossless, symmetric but slightly mismatched circulator, $\lvert\beta\rvert\approx\lvert\Gamma\rvert$ and $\lvert\alpha\rvert\approx1-\lvert\Gamma\rvert^2$. **Isolation in dB is about the port return loss**: 20 dB return loss gives about 20 dB isolation, which is the 20–30 dB Pozar quotes for duplexing.
> - **Gyrator + hybrids** (Fig. 9.21): an isolator can also be built from a $180^\circ$ differential phase shifter (gyrator) between two quadrature hybrids.
>
> ```tikz title="Circulator as a duplexer, and as an isolator with port 3 terminated. After binder p. 320 and Pozar Fig. 9.22."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[>=stealth,font=\small]
>   \draw[thick] (0,0) circle (0.6); \draw[->,thick] (0.35,0.25) arc (35:-235:0.43);
>   \draw (-0.6,0) -- (-1.8,0) node[left,font=\scriptsize] {TX (port 1)};
>   \draw (0.3,0.52) -- (0.9,1.5) node[above,font=\scriptsize] {antenna (port 2)};
>   \draw (0.3,-0.52) -- (0.9,-1.5) node[below,font=\scriptsize] {RX (port 3)};
>   \node[font=\scriptsize,align=left,anchor=west] at (1.4,0) {TX$\to$ant, ant$\to$RX;\\ TX$\to$RX only by leakage\\ ($\approx$ return loss, 20--30 dB)};
>   \begin{scope}[xshift=7.6cm]
>     \draw[thick] (0,0) circle (0.6); \draw[->,thick] (0.35,0.25) arc (35:-235:0.43);
>     \draw (-0.6,0) -- (-1.6,0) node[left,font=\scriptsize] {PA};
>     \draw (0.3,0.52) -- (0.9,1.5) node[above,font=\scriptsize] {load};
>     \draw (0.3,-0.52) -- (0.6,-1.0) to[R,l_=$Z_0$] (0.6,-2.0) node[ground]{};
>     \node[font=\scriptsize,align=left,anchor=west] at (1.3,0) {reflections from the load\\ end in the termination:\\ an isolator};
>   \end{scope}
> \end{circuitikz}
> \end{document}
> ```

## Level 7: Radar Systems

Radar is the oldest microwave application: transmit, catch the echo, take direction from the antenna, range from the delay and radial speed from the Doppler shift. Uses span air and marine navigation, weather, altimetry, police speed radar, mapping, tracking and guidance, and remote sensing. A **monostatic** radar uses one antenna for both directions; a **bistatic** one uses two.

### The Radar Equation

$$
\boxed{\sigma=\frac{P_s}{S_t}\ [\text{m}^2]}\qquad\boxed{P_r=\frac{P_tG^2\lambda^2\sigma}{(4\pi)^3R^4}}\qquad\boxed{R_{max}=\left[\frac{P_tG^2\sigma\lambda^2}{(4\pi)^3P_{min}}\right]^{1/4}}
$$

- The target scatters $P_s=\sigma S_t$ like a source of its own, so the echo spreads over another $4\pi R^2$: **$1/R^4$**. Doubling range needs 16 times (12 dB) more power, which is why radars pair high-power transmitters with low-noise receivers.
- **Pulse integration** of $N$ returns improves the SNR by about $N$ (noise has zero mean; the echo does not).
- Real ranges are shorter: propagation, the statistics of detection and interference (Pozar p. 692).

> [!example] Radar range (Pozar Ex. 14.7)
> 10 GHz ($\lambda=0.03$ m), $G=28$ dB (631), 2 kW pulse power, $\sigma=12$ m², $P_{min}=-90$ dBm $=10^{-12}$ W:
> $R_{max}=\left[\frac{(2\times10^3)(631)^2(12)(0.03)^2}{(4\pi)^3(10^{-12})}\right]^{1/4}=$ **8114 m**.

> [!note]- Derivation: the radar equation (Pozar Eqs. 14.38–14.42)
> Incident density at the target: $S_t=P_tG/4\pi R^2$ (Friis numerator). Scattered power $P_s=\sigma S_t$ re-radiates and arrives back as $S_r=P_tG\sigma/(4\pi R^2)^2$. The antenna captures $P_r=A_eS_r$ with $A_e=G\lambda^2/4\pi$, giving $P_r=P_tG^2\lambda^2\sigma/[(4\pi)^3R^4]$. Setting $P_r=P_{min}$ and solving for $R$ gives $R_{max}$. The bistatic case replaces $G^2$ by $G_tG_r$ and $R^4$ by $R_t^2R_r^2$ (Pozar Problem 14.15).

### Pulse Radar

```tikz title="Pulse radar: one LO serves the SSB up-converter (f0 + f_IF) and the receive mixer; the T/R switch forms the pulses and duplexes. Timing: pulse width tau, period T_r; the echo returns after 2R/c. After Pozar Fig. 14.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.2cm,minimum height=0.7cm,align=center,font=\scriptsize}}
  \draw[thick] (0,0.9) -- (0,0.35); \draw[thick] (-0.3,1.2) -- (0,0.9) -- (0.3,1.2);
  \node[b,fill=orange!10] (sw) at (0,0) {T/R};
  \node[b] (pa) at (2.0,0.8) {PA}; \node[b] (ssb) at (4.0,0.8) {USB mixer};
  \node[b] (lna) at (2.0,-0.8) {LNA}; \node[b,circle,minimum width=0.6cm] (mx) at (4.0,-0.8) {$\times$};
  \node[b] (lo) at (5.9,0) {LO $f_0$};
  \node[b] (ifo) at (7.6,0.8) {$f_{IF}$ osc};
  \node[b] (ifa) at (6.0,-1.8) {IF amp}; \node[b] (det) at (7.8,-1.8) {detector}; \node[b] (vid) at (9.6,-1.8) {video /\\ display};
  \draw[->] (ssb) -- (pa) node[midway,below,font=\tiny] {$f_0+f_{IF}$}; \draw[->] (pa) -| (sw);
  \draw[->] (sw) |- (lna); \draw[->] (lna) -- (mx); \draw[->] (lo) |- (ssb); \draw[->] (lo) |- (mx);
  \draw[->] (ifo) -- (ssb); \draw[->] (mx) |- (ifa); \draw[->] (ifa) -- (det); \draw[->] (det) -- (vid);
  \node[b] (pg) at (-1.6,-1.4) {pulse\\ gen.}; \draw[->] (pg) |- (sw);
  \begin{scope}[yshift=-4.4cm]
    \draw[->] (0,0) -- (10.5,0) node[right,font=\scriptsize] {$t$};
    \foreach \x in {0.4,5.4} { \draw[thick,blue!70!black] (\x,0) -- (\x,0.9) -- (\x+0.5,0.9) -- (\x+0.5,0); }
    \node[font=\scriptsize,anchor=east] at (0.3,0.6) {TX};
    \draw[<->] (0.4,1.1) -- (0.9,1.1) node[midway,above,font=\scriptsize] {$\tau$};
    \draw[<->] (0.4,1.6) -- (5.4,1.6) node[midway,above,font=\scriptsize] {$T_r=1/f_r$};
    \draw[thick,red!60!black] (3.0,0) -- (3.0,0.45) -- (3.5,0.45) -- (3.5,0);
    \node[font=\scriptsize,text=red!60!black,anchor=south] at (3.25,0.5) {echo};
    \draw[<->] (0.4,-0.35) -- (3.0,-0.35) node[midway,below,font=\scriptsize] {$t_d=2R/c$};
    \node[font=\scriptsize,anchor=west] at (6.2,0.6) {TX leakage, clutter and noise};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R=\frac{ct_d}{2}}\qquad\boxed{R_{unamb}=\frac{cT_r}{2}=\frac{c}{2f_r}}
$$

- Pulse width $\tau$ from 100 ms down to 50 ns: **shorter** pulses resolve range better, **longer** pulses carry more energy and give better SNR after processing.
- PRF $f_r$ from 100 Hz to 100 kHz: **higher** PRF returns more pulses per second, **lower** PRF avoids range ambiguity (an echo from beyond $cT_r/2$ arrives after the next pulse). Computed here: $f_r=1$ kHz gives $R_{unamb}=150$ km.
- The T/R switch both forms the pulse train and duplexes, with 80–100 dB isolation; a circulator (20–30 dB) is not enough here.

### Doppler Radar

$$
\boxed{f_d=\frac{2vf_0}{c}}\qquad\text{received at }f_0\pm f_d\ \ (+\ \text{approaching})
$$

```tikz title="CW Doppler radar: the transmit oscillator is the LO (a zero-IF receiver); the filter passes only the expected Doppler band and rejects DC, where clutter, TX leakage and 1/f noise land. After Pozar Fig. 14.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.2cm,minimum height=0.7cm,align=center,font=\scriptsize}}
  \node[b] (osc) at (0,0) {osc. $f_0$};
  \draw[thick] (2.2,0) circle (0.4); \draw[->] (2.42,0.18) arc (40:-220:0.28);
  \draw[->] (osc) -- (1.8,0);
  \draw (2.2,0.4) -- (2.2,1.0); \draw[thick] (1.9,1.3) -- (2.2,1.0) -- (2.5,1.3);
  \node[font=\scriptsize,anchor=west] at (2.6,1.25) {$f_0$ out, $f_0\pm f_d$ back};
  \node[b,circle,minimum width=0.6cm] (mx) at (4.0,-1.2) {$\times$};
  \draw[->] (2.2,-0.4) |- (mx); \draw[->] (osc) |- (4.0,-2.2) -- (mx);
  \node[b] (f) at (5.8,-1.2) {BPF\\ $f_{d,min}$--$f_{d,max}$};
  \node[b] (a) at (7.7,-1.2) {amp};
  \node[b] (d) at (9.3,-1.2) {display};
  \draw[->] (mx) -- (f) node[midway,above,font=\tiny] {$f_d$}; \draw[->] (f) -- (a); \draw[->] (a) -- (d);
  \node[font=\tiny,text=red!60!black] at (5.8,-2.0) {high rejection at DC};
\end{circuitikz}
\end{document}
```

- The transmitter doubles as the LO, so the receiver is a direct-conversion receiver with an exact LO. Leakage and stationary clutter come out at DC and are filtered, so a **circulator** is enough here.
- A single mixer loses the sign of $f_d$ (approaching vs receding); a mixer giving the two sidebands separately recovers it (the I/Q idea again).
- Computed here: a 10 GHz radar sees a car at 30 m/s as $f_d=2(30)(10^{10})/(3\times10^8)=2$ kHz.
- **Pulse-Doppler** radar gets range from the delay and velocity from the Doppler shift in one system, and uses the Doppler shift to separate a moving target from stationary clutter (including clutter entering through sidelobes).

> [!warning] Unverified
> **FMCW radar** is not covered in Pozar Ch. 14 or the binder. As commonly described: the carrier is swept linearly over a bandwidth $B$ in time $T_c$ (slope $B/T_c$); mixing the echo with the current transmit signal gives a beat frequency $f_b=(B/T_c)(2R/c)$ proportional to range, and range resolution is $c/2B$. Like the CW Doppler radar it is a zero-IF receiver with the transmitter as LO. Check against a radar text before relying on it.

### Radar Cross Section

| Target | $\sigma$ (m²) |
|---|---|
| Bird | 0.01 |
| Missile | 0.5 |
| Person | 1 |
| Small plane | 1–2 |
| Bicycle, small boat | 2 |
| Fighter plane | 3–8 |
| Bomber | 30–40 |
| Large airliner | 100 |
| Truck | 200 |

- $\sigma$ depends on frequency, polarizations and angles: **monostatic** (same angle in and out) vs **bistatic**.
- A conducting sphere of radius $a$ (Pozar Fig. 14.23): **Rayleigh region** ($a\ll\lambda$), $\sigma\propto(a/\lambda)^4$, which is also why the sky is blue; **resonance region** ($a\sim\lambda$), $\sigma$ oscillates and can peak high; **optical region** ($a\gg\lambda$), $\sigma\to\pi a^2$, the physical cross section. Flat plates at normal incidence behave similarly.
- Stealth: lossy dielectrics (radar-absorbing materials) reduce $\sigma$.

## Level 8: Radiometry

A radiometer is a passive radar: a very sensitive receiver that measures the thermal noise a scene emits or reflects. The radiometric signal is usually *smaller than the receiver's own noise*, so the design problem is telling the two apart.

$$
\boxed{e=\frac{P}{kTB}\ (0\le e\le1)}\qquad\boxed{T_B=eT}
$$

- A **blackbody** absorbs everything and radiates $kTB$ (the microwave limit of Planck's law). A real body reflects part of the incident energy and radiates less: its **emissivity** $e$. Radiometrically a body never looks hotter than it is.
- The antenna sees the scene's $T_B$, atmospheric emission straight to the antenna ($T_{AD}$) and reflected off the ground ($T_{AR}$), plus sidelobe sources such as the Sun. Retrieval algorithms invert these (e.g. snow thickness from multi-frequency $T_B$, modelled as reflection from a layered dielectric).
- Applications: soil moisture, flood, snow and ice mapping, ocean wind speed, atmospheric temperature and humidity profiles (around 20 and 55 GHz, on the absorption lines), military detection and mapping, radio astronomy and the cosmic background.

### Total-Power Radiometer

$$
\boxed{V_o=GkB(T_B+T_R)}\qquad\boxed{\Delta T_N=\frac{T_B+T_R}{\sqrt{B\tau}}}\qquad\boxed{\Delta T_G=(T_B+T_R)\frac{\Delta G}{G}}
$$

- A superheterodyne front end, an IF filter of bandwidth $B$, a **square-law detector** ($v\propto P$) and an integrator with time constant $\tau$. Calibrate by replacing the antenna with two known noise sources (the Y-factor idea), then solve for $T_B$.
- $\Delta T_N$: noise fluctuation left after integration; it shrinks with a longer $\tau$.
- $\Delta T_G$: gain drift (in the RF amp, mixer or IF amp, over 1 s or longer). It does not average away.
- Pozar's numbers (10 GHz, $B=100$ MHz, $T_R=500$ K, $\tau=0.01$ s, $\Delta G/G=0.01$, $T_B=300$ K): $\Delta T_N=0.8$ K but $\Delta T_G=$ **8 K**. Gain drift dominates.

> [!tip] Remark
> Calibrating with two known noise temperatures is the same algebra as the [[RF Noise and Distortion#Y-Factor Method]]; here the unknown is the source temperature instead of the receiver's.

### Dicke Radiometer

```tikz title="Balanced Dicke radiometer: the Dicke switch alternates between the antenna and a reference noise source at f_s; a synchronous demodulator takes the difference and a feedback loop adjusts T_REF until the output nulls, so T_B = T_REF independently of the gain. After Pozar Fig. 14.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,thick,fill=blue!6,minimum width=1.15cm,minimum height=0.7cm,align=center,font=\scriptsize}}
  \draw[thick] (0,0.9) -- (0,0.5); \draw[thick] (-0.3,1.2) -- (0,0.9) -- (0.3,1.2);
  \node[font=\scriptsize,anchor=south] at (0,1.25) {antenna, $T_B$};
  \node[b] (ref) at (0,-1.3) {variable\\ $T_{REF}$};
  \node[b,fill=orange!10] (sw) at (1.6,0) {Dicke\\ switch};
  \draw[->] (0,0.5) |- ([yshift=0.15cm]sw.west); \draw[->] (ref) -| (1.0,-0.15) -- ([yshift=-0.15cm]sw.west);
  \node[b] (rf) at (3.2,0) {RF amp}; \node[b,circle,minimum width=0.6cm] (mx) at (4.6,0) {$\times$};
  \node[b] (iff) at (6.0,0) {IF filter\\ $B$}; \node[b] (ifa) at (7.5,0) {IF amp}; \node[b] (det) at (9.0,0) {square-law\\ detector};
  \node[b] (dem) at (10.8,0) {sync.\\ demod. $-$};
  \draw[->] (sw) -- (rf); \draw[->] (rf) -- (mx); \draw[->] (mx) -- (iff); \draw[->] (iff) -- (ifa); \draw[->] (ifa) -- (det); \draw[->] (det) -- (dem);
  \node[b] (sq) at (6.0,-1.5) {square wave $f_s$};
  \draw[->] (sq) -| (sw); \draw[->] (sq) -| (dem);
  \node[b] (fb) at (6.0,-2.7) {feedback control};
  \draw[->] (dem) |- (fb); \draw[->] (fb) -| (ref) node[pos=0.25,above,font=\scriptsize] {$V_c$ (reads $T_B$)};
\end{circuitikz}
\end{document}
```

- The input is switched between the antenna and a reference noise source at $f_s=10$ to 1000 Hz, much faster than the gain drifts. The difference is nulled by feedback; at balance $T_B=T_{REF}$, read from the control voltage $V_c$. Gain variation drops out.
- A reference that spans 50–300 K is hard to build, so variants use a fixed hot reference with a variable duty cycle, or a fixed reference with IF gain switched during the reference half.

## Level 9: Microwave Propagation

Real paths are not free space. Propagation effects can only be described statistically, and they enter the link budget as $L_A$ and as fade margin.

### Atmospheric Effects

```tikz title="Refraction bends rays toward the Earth and extends the radio horizon: model it with an effective Earth radius kR, k = 4/3. After Pozar Fig. 14.28 and Eq. 14.50."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=green!10] (-5,-1.2) arc (110:70:14.6);
  \draw[thick] (-4.3,-0.97) -- (-4.3,0.23); \node[font=\scriptsize,anchor=east] at (-4.35,-0.35) {$h$};
  \draw[dashed] (-4.3,0.23) -- (1.575,-0.405);
  \fill (1.575,-0.405) circle (1.5pt);
  \node[font=\scriptsize,anchor=north] at (1.4,-0.6) {geometric horizon, $d=\sqrt{2Rh}$};
  \draw[thick,red!60!black] (-4.3,0.23) .. controls (-0.5,0.15) and (2.6,-0.35) .. (4.51,-1.03);
  \fill[red!60!black] (4.51,-1.03) circle (1.5pt);
  \node[font=\scriptsize,text=red!60!black,anchor=south west] at (1.6,0.0) {refracted path: $d=\sqrt{2kRh}$, $k\approx4/3$};
  \node[font=\scriptsize] at (-1.2,1.2) {$\varepsilon_r$ of air falls with height: rays bend down};
\end{circuitikz}
\end{document}
```

$$
\boxed{d=\sqrt{2Rh}\ \to\ \sqrt{2kRh},\quad k\approx4/3}
$$

- Air's permittivity falls with altitude (pressure and humidity fall faster than temperature), so rays bend down and the horizon moves out. Computed here with $R=6371$ km and a 30 m mast: 19.6 km geometric, 22.6 km with $k=4/3$. $k$ is an average that changes with weather; it also causes elevation errors for radar targets near the horizon.
- A **temperature inversion** makes $\varepsilon_r$ fall much faster and can **duct** the wave along the Earth, like a dielectric waveguide, in layers 50 to 500 ft thick.
- **Attenuation:** little below 10 GHz. Peaks at 22.2 and 183.3 GHz (water vapour) and 60 and 120 GHz (oxygen); windows near 35, 94 and 135 GHz. Rain, snow and fog add more at higher frequencies.
- Absorption as a feature: radiometers sit on the lines (20, 55 GHz) to sense the atmosphere, and 60 GHz suits spacecraft-to-spacecraft links because the atmosphere hides them from interference, jamming and eavesdropping from the ground.

> [!note]- Detail: the empirical permittivity of air (Pozar Eq. 14.49)
> $$\varepsilon_r=\left[1+10^{-6}\left(\frac{79P}{T}-\frac{11V}{T}+\frac{3.8\times10^5V}{T^2}\right)\right]^2$$
> $P$: barometric pressure (mbar); $T$: temperature (K); $V$: water vapour pressure (mbar). All three fall with height, the pressure and humidity terms fastest, so $\varepsilon_r\to1$ with altitude.

### Ground Effects

- **Ground reflection:** the receiver (or target) sees a direct and a ground-reflected wave; the reflected one is weaker (longer path, sidelobe illumination, imperfect ground), but the two add as vectors. Small changes in the air's permittivity shift their relative phase over long paths: slow **fading** and fast **scintillation**.
- **Diversity:** two channels at different frequencies, polarizations or locations fade almost independently; combining them reduces fading.
- **Diffraction:** scatters energy just past the horizon; small at microwave frequencies, larger around hills and buildings.
- **Clutter:** radar returns from terrain, vegetation, buildings and sea mask targets or appear as false ones; in mapping they *are* the signal.

### Plasma Effects

$$
\boxed{\varepsilon_e=\varepsilon_0\left(1-\frac{\omega_p^2}{\omega^2}\right)}\qquad\boxed{\omega_p=\sqrt{\frac{Nq^2}{m\varepsilon_0}}}
$$

- A wave propagates through a plasma only for $\omega>\omega_p$; below it is totally reflected. A magnetic field (even the Earth's) makes the plasma anisotropic.
- The ionosphere (layers D, E, F1, F2) has an average plasma frequency of about 8 MHz: short-wave signals below it bounce beyond the horizon; higher frequencies pass through to satellites.
- Re-entry plasma has a very high $\omega_p$: communications **blackout**, plus a large antenna mismatch.

> [!tip] Remark
> In the plasma $\beta=\omega\sqrt{\mu_0\varepsilon_e}=\sqrt{\omega^2-\omega_p^2}/c$: exactly the form of a waveguide's $\beta=\sqrt{k^2-k_c^2}$ ([[Transmission Lines#Waveguides and Other Lines]]). Below $\omega_p$ (or $\omega_c$) $\beta$ turns imaginary and the wave is evanescent.

## Level 10: Other Applications

Pozar covers these briefly, and so does this note.

- **RFID:** cheap tags answer an interrogating signal with stored data. Passive tags rectify the interrogating signal, charge a small capacitor and run very-low-power CMOS from it.
- **Wireless power transfer:** proposed solar power satellites (a 5 × 10 km solar array feeding a 1 km phased array, about 5 GW on the ground; cost, safety and politics make it doubtful); powering small drones from the ground (demonstrated); powering RFID tags. Harvesting ambient RF to charge devices is possible in principle but probably not feasible in most situations.
- **Microwave heating:** a magnetron at 2.45 GHz (915 MHz for deeper penetration), 500–1500 W, waveguide feed, a large metal cavity with a mode stirrer and a rotating plate. Heats inside first through the food's loss tangent, which falls with temperature (partly self-regulating). Efficiency below 50%, still better than a conventional oven. Leakage is the critical issue: door chokes ($\lambda/4$) and absorbers.
- **Safety:** proven hazards are thermal. IEEE C95.1-2005 limits power density from 100 MHz to 100 GHz (lower limits at lower frequency, where fields penetrate deeper), averaged over 6 min (occupational) or 30 min (public). Handsets are limited by specific absorption rate:

$$
\boxed{\mathrm{SAR}=\frac{\sigma}{2\rho}\lvert\bar E\rvert^2\ \ [\text{W/kg}]}
$$

- FCC: 1.6 W/kg averaged over 1 g of tissue; EU: 2 W/kg over 10 g. Microwave ovens: at most 1 mW/cm² at 5 cm.

> [!example] Power density near a radio link (Pozar Ex. 14.8)
> 18 GHz, 10 W into a 36 dB (4000) antenna, 20 m away: main beam $S=\frac{(10)(4000)}{4\pi(20)^2}=$ **8 W/m²**; a worst-case $-10$ dB sidelobe gives 0.8 W/m². The main-beam value is below the U.S. general-population limit, and it falls as $1/R^2$. EIRP is limited by exposure as well as by regulation.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ PA power $P_t$ | EIRP, margin dB for dB | DC power, heat, PA linearity (ACPR/EVM), exposure limits |
| ↑ antenna gain (bigger aperture) | EIRP or $G/T$; narrower beam sees less hot horizon and less interference | size, cost, pointing; no omnidirectional coverage |
| ↑ carrier frequency, fixed apertures | antenna gains (+6 dB per octave each), more bandwidth | path loss for fixed gains, atmospheric loss above 10 GHz, device $f_{max}$ |
| ↓ $T_{SYS}$ (LNA at the antenna, low-NF LNA) | SNR, $G/T$, margin | LNA must handle blockers unfiltered; cost |
| ↓ feed-line loss before the LNA | $T_{SYS}$ twice: its own $(L-1)T_p$ and $L_TT_{REC}$ | mounting electronics at the antenna |
| Preselect filter before the LNA | image, blockers, TX leakage | its loss adds to NF dB for dB |
| ↑ IF (superhet) | image far away, easy image filter | channel filter needs higher Q; dual conversion adds parts |
| Zero-IF | no image, no IF filter, simple | LO precision, DC offset from LO self-mixing, $1/f$, LO re-radiation |
| Low-IF | no DC problem, simple channel filter | image rejection only as good as I/Q match |
| Higher-order modulation | bps/Hz | $E_b/n_0$ (link budget), EVM: PA back-off, LO phase noise |
| ↑ data rate $R_b$ | throughput | $S_{min}$ rises 10 dB per decade |
| ↑ link margin | robustness to fading, rain | cost everywhere else |
| Radar: ↑ $\tau$ / ↓ PRF | SNR / unambiguous range | range resolution / pulses per second |
| Radiometer: ↑ $B\tau$ | $\Delta T_N$ | does nothing for gain drift: use a Dicke switch |
| Circulator vs T/R switch | CW operation, simplicity | 20–30 dB isolation vs the 80–100 dB a pulse radar needs |

## Cheat sheet

| Quantity | Formula |
|---|---|
| Far field | $\bar E=(\hat\theta F_\theta+\hat\phi F_\phi)e^{-jk_0r}/r$; $R_{ff}=2D^2/\lambda$ ($\ge2\lambda$) |
| Radiation intensity | $U=(\lvert F_\theta\rvert^2+\lvert F_\phi\rvert^2)/2\eta_0$; $P_{rad}=\iint U\sin\theta\,d\theta\,d\phi$ |
| Directivity | $D=4\pi U_{max}/P_{rad}$; $D\approx32{,}400/(\theta_1\theta_2)$ |
| Gain, efficiency | $\eta_{rad}=P_{rad}/P_{in}$; $G=\eta_{rad}D$ |
| Aperture | $D=\eta_{ap}4\pi A/\lambda^2$; $A_e=D\lambda^2/4\pi$ ($G$ with loss); $P_r=A_eS$ |
| Brightness temperature | $T_b=\iint T_BD\sin\theta/\iint D\sin\theta$ |
| Antenna noise temperature | $T_A=\eta_{rad}T_b+(1-\eta_{rad})T_p$ |
| Antenna + mismatched line | $T_S=\frac{1-\lvert\Gamma\rvert^2}{L}T_A+\frac{L-1}{L}\left(1+\frac{\lvert\Gamma\rvert^2}{L}\right)T_p$ |
| $G/T$ | $10\log(G/T)$ dB/K |
| Power density | $S=G_tP_t/4\pi R^2$ |
| Friis | $P_r=G_tG_r\lambda^2P_t/(4\pi R)^2$; EIRP $=P_tG_t$ |
| Path loss | $L_0=20\log(4\pi R/\lambda)$ |
| Link budget | $P_r=P_t-L_t+G_t-L_0-L_A+G_r-L_r$ (dB); $L_{imp}=-10\log(1-\lvert\Gamma\rvert^2)$ |
| Link margin | $\mathrm{LM}=P_r-P_{r,min}$ |
| Receiver temperature | $T_{REC}=T_{RF}+T_M/G_{RF}+T_{IF}L_M/G_{RF}$ |
| System temperature | $T_{SYS}=T_A+(L_T-1)T_p+L_TT_{REC}$; $S_o/N_o=S_i/(kBT_{SYS})$ |
| Bit energy | $E_b/n_0=S/(n_0R_b)=(S/N)(B/R_b)$ |
| Threshold | $S_{min}=-198.6+10\log T_{SYS}+10\log R_b+(E_b/n_0)_{req}$ dBm |
| Receiver budget | $T_{REC}\le[T_{SYS}-T_A-(L_T-1)T_p]/L_T$; $\mathrm{NF}=10\log(1+T_{REC}/T_0)$ |
| LO phase noise | $\mathcal L(f_m)\le C-S-I-10\log B$ dBc/Hz |
| Image rejection | $\mathrm{IR}\ge I_{im}-C+\mathrm{SNR}_{min}$ (image $2f_{IF}$ away) |
| Isolator, circulator | $\begin{bmatrix}0&0\\1&0\end{bmatrix}$; $\begin{bmatrix}0&0&1\\1&0&0\\0&1&0\end{bmatrix}$; isolation $\approx\lvert\Gamma\rvert$ |
| Radar cross section | $\sigma=P_s/S_t$ |
| Radar equation | $P_r=P_tG^2\lambda^2\sigma/[(4\pi)^3R^4]$; $R_{max}=[P_tG^2\sigma\lambda^2/((4\pi)^3P_{min})]^{1/4}$ |
| Pulse radar | $R=ct_d/2$; $R_{unamb}=cT_r/2$ |
| Doppler | $f_d=2vf_0/c$ |
| Emissivity | $e=P/kTB$; $T_B=eT$ |
| Total-power radiometer | $V_o=GkB(T_B+T_R)$; $\Delta T_N=(T_B+T_R)/\sqrt{B\tau}$; $\Delta T_G=(T_B+T_R)\Delta G/G$ |
| Radio horizon | $d=\sqrt{2kRh}$, $k\approx4/3$ |
| Plasma | $\varepsilon_e=\varepsilon_0(1-\omega_p^2/\omega^2)$; $\omega_p=\sqrt{Nq^2/m\varepsilon_0}$ |
| SAR | $\sigma\lvert\bar E\rvert^2/2\rho$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20).
  - Ch. 14 Introduction to Microwave Systems, pp. 658–708, all sections: §14.1 system aspects of antennas (Figs. 14.1–14.8, Eqs. 14.1–14.21, Exs. 14.1–14.3); §14.2 wireless communications: system types, Friis formula, EIRP, link budget and margin (Eqs. 14.22–14.29, Ex. 14.4), receiver requirements and TRF / direct-conversion / superheterodyne architectures (Figs. 14.11–14.13), receiver noise characterization (Fig. 14.14, Eqs. 14.27–14.34, Ex. 14.5), digital modulation and BER (Eqs. 14.35–14.37, Fig. 14.16, Table 14.1, Ex. 14.6), wireless systems and bands (Table 14.2); §14.3 radar equation (Eqs. 14.38–14.42, Ex. 14.7), pulse radar (Fig. 14.21), Doppler radar (Eq. 14.43, Fig. 14.22), radar cross section (Fig. 14.23, Table 14.3); §14.4 radiometry (Eqs. 14.44–14.48), total-power and Dicke radiometers (Figs. 14.26–14.27); §14.5 propagation (Eqs. 14.49–14.52, Figs. 14.28–14.30); §14.6 heating, power transfer, safety (Eq. 14.53, Fig. 14.32, Ex. 14.8).
  - Ch. 13 §13.3 pp. 626–627 (Eq. 13.50, Ex. 13.5) and §13.5 pp. 638–642 (Eqs. 13.88–13.89, Ex. 13.7, Fig. 13.31), used only as system-level specs; the derivations are owned by [[Mixers and Microwave Oscillators]].
  - Ch. 9 Ferrimagnetic components: chapter introduction p. 451, §9.4 isolator S-matrix p. 475–476, §9.6 circulator S-matrix, latching, mismatched-circulator Eqs. 9.91–9.94, junction circulator, Fig. 9.21 gyrator isolator; for the folded system-level detail only. Ferrite physics, phase shifters and the isolator design examples left out.
  - Ch. 8 Problem 8.24 (PCS duplex-filter spec), cited only.
- **ECE 373 binder (Boumaiza, Waterloo), scanned:** p. 2 (radio systems: TX and RX building blocks); p. 227 (receiver RF front end); p. 258 (typical transceiver RF front end); p. 320 (circulator S-matrices); pp. 402–410 (mixer in wireless systems: heterodyne / low-IF / homodyne, design issues, image problem and image-reject filter vs IF, LO feed-through, reverse LO feed-through and self-mixing). ACPR/EVM slides (pp. 170–172) left to [[RF Noise and Distortion]].
- **Computed here** (marked in the text): the DBS backward budget and LNB Friis split; the LEO 1 Mbps backward budget; the image-rejection bound and its numeric example; the DBS dish aperture efficiency; radio horizon for a 30 m mast; the Doppler and unambiguous-range numbers.
- **Not in the sources, flagged:** digital-IF receivers and FMCW radar (two `[!warning]` callouts).
- Left out: Pozar's problem set (except as cited), cellular-standard history, the Iridium/GPS narratives beyond the folded summary, biological-effects discussion beyond the limits.
