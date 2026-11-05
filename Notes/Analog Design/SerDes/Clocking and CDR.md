---
title: Clocking and CDR
description: How a link gets a sampling clock to the right place at the right time. Forwarded vs embedded clocking, phase detectors that work on random data (Hogge, Alexander, Mueller-Muller, PAM4), PLL-based and dual-loop phase-interpolator CDRs, bang-bang loop dynamics, phase interpolators, forwarded-clock deskew, and multi-GHz clock distribution with duty-cycle and quadrature correction.
kind: topic
status: growing
aliases:
  - Clocking and CDR
  - CDR
  - Clock and Data Recovery
  - Clocking
---

A CDR is a PLL whose reference is random data. The first sections treat it as that black box, and each later one opens it further: the detectors that can read phase off random data, the loops built around them, the dynamics of the bang-bang loop that most links actually use, the interpolator that turns a digital code into a clock phase, and finally how the clock is carried, cleaned and corrected on the way to the samplers.

## The big picture

```tikz title="An embedded-clock link's timing path. The TX PLL multiplies a crystal reference; the clock is distributed (and duty-cycle/quadrature corrected) to the serializer. At the RX, data and edge samplers feed a phase detector whose filtered output steers either a per-lane VCO (PLL-based CDR) or a phase interpolator fed by a shared PLL (dual-loop CDR). A forwarded-clock link sends the TX clock on an extra lane instead (dashed). After Palermo L11 slides 5, 14-17 and L12 slide 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.85cm,align=center,fill=white}]
  \node[b,minimum width=1.3cm] (ref) at (0,2.2) {ref clk\\(crystal)};
  \node[b,minimum width=1.4cm] (pll) at (2.1,2.2) {TX PLL\\$\times N$};
  \node[b,minimum width=1.9cm] (dist) at (4.5,2.2) {clock distr.\\+ DCC/QEC};
  \node[b,minimum width=1.6cm] (ser) at (4.5,0.4) {serializer\\+ driver};
  \draw[->] (ref) -- (pll); \draw[->] (pll) -- (dist); \draw[->] (dist) -- (ser);
  \draw[->] (2.2,0.4) node[left] {data} -- (ser);
  \node[b,minimum width=1.6cm,fill=gray!10] (ch) at (7.4,0.4) {channel};
  \draw[->] (ser) -- (ch);
  \node[b,minimum width=1.8cm] (smp) at (10.2,0.4) {data + edge\\samplers};
  \draw[->] (ch) -- (smp);
  \draw[->] (smp) -- (12.6,0.4) node[right] {retimed data};
  \node[b,minimum width=1.5cm] (pd) at (10.8,-1.5) {phase\\detector};
  \node[b,minimum width=1.5cm] (lf) at (13.2,-1.5) {loop filter\\(analog/digital)};
  \node[b,minimum width=2.2cm,fill=orange!10] (vco) at (13.2,-3.3) {VCO (PLL CDR)\\or PI (dual loop)};
  \draw[->] (10.8,-0.03) -- (pd); \draw[->] (pd) -- (lf); \draw[->] (lf) -- (vco);
  \draw[->] (vco.west) -- (9.6,-3.3) -- node[pos=0.5,left,align=right] {sampling\\clocks} (9.6,-0.03);
  \node[b,minimum width=1.6cm] (rxpll) at (16.6,-3.3) {RX PLL\\(shared)};
  \draw[->] (rxpll) -- node[above] {phases} (vco);
  \draw[dashed,->,blue!60!black] (dist.east) -- (7.4,2.2) -- (7.4,1.6) node[right,align=left] {forwarded clock\\(extra lane)} -- (10.2,1.6) -- (smp.north);
  \node[font=\scriptsize,align=center] at (11.4,-4.4) {CDR: tracks jitter below its bandwidth};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **A CDR is a PLL locked to data.** It must pick the frequency (the data rate) and the phase (mid-eye) and add little jitter. The sampler sees the input jitter through $1-H$: tracked below the CDR bandwidth, paid in full above it ([[Link Noise and Jitter#What Jitter Matters the CDR Tracks Low Frequencies]]).
> 2. **The phase detector must survive missing transitions.** Linear detectors (Hogge, mixer) give $K_{PD}=TD/\pi$; bang-bang (Alexander) detectors give only the sign, and their effective gain $K_{PD}\approx 2\,TD/J_{pp}$ depends on the jitter itself. Baud-rate (Mueller-Muller) detectors use one sample per UI and lock where $h_{-1}=h_{+1}$, not at the eye center. $TD$ (transition density) is 0.5 for random NRZ, 0.75 for PAM4.
> 3. **Most links are dual-loop:** a shared PLL makes the frequency, and a per-lane digital loop picks the phase with a phase interpolator (PI). Its frequency tolerance is a slew rate: $\left|\Delta f/f\right|_{max}=\alpha_d\,\Delta T/(DF\cdot T_{SCK})$, traded against quantization and dither jitter $\approx(2D+1)\Delta T$ peak-to-peak.
> 4. **A bang-bang CDR's jitter tolerance falls at 20 dB/dec** (slew limited), not 40 dB/dec like a linear type-II loop: $JTOL_{pp}\approx(s_{max}-|\Delta f/f|)/(\pi f T_b)$ plus the timing margin.
> 5. **Every clock path is a jitter amplifier and a supply sensor.** A low-pass buffer chain amplifies high-frequency jitter and duty-cycle error; an inverter's delay moves 1% per 1% of supply. Hence quarter-rate clocks, regulated or CML distribution, and duty-cycle (DCC) and quadrature (QEC) correction near the samplers. In a forwarded-clock link the clock-to-data skew decorrelates jitter: $|J_{diff}|=2J\,|\sin(\pi f_j t_{skew})|$.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 Link Clocking as a Black Box|clocking architectures]] → [[#Level 1 Phase Detectors for Random Data|phase detectors]] → [[#Level 2 CDR Architectures|CDR architectures]] → [[#Level 3 Bang-Bang CDR Dynamics|bang-bang dynamics]] → [[#Level 4 Phase Interpolators|phase interpolators]] → [[#Level 5 Forwarded-Clock Deskew|forwarded-clock deskew]] → [[#Level 6 Clock Distribution|clock distribution]] → [[#How the Papers Do It|the papers]].

## Spec translation

A CDR contains no amplifier in the op-amp sense, but every spec ends in one of four circuits gm/ID sizes: the **charge pump** (analog CDR), the **phase-interpolator current DAC and its load**, the **CML clock buffers**, and the **samplers**. The VCO is owned by [[Oscillators#Spec translation]] and the PLL loop by [[Phased-Locked Loops#Spec translation]]; this section covers what is CDR-specific.

### The block's specs

| Spec | What it is | Typical (source) |
|---|---|---|
| Jitter tolerance (JTOL) mask | Sinusoidal jitter (UI$_{pp}$ vs $f$) the RX must take at the target BER | 0.45 UI at 30 MHz, 0.6 UI at 100 MHz (Xilinx 32.75 Gb/s, Palermo L11 slide 18); masks in [[Link Noise and Jitter#Jitter Tolerance and Its Mask]] |
| Jitter transfer | Bandwidth and peaking of input → recovered clock | SONET: 2 MHz at 2.488 Gb/s, peaking $\le$ 0.1 dB ([[Link Noise and Jitter#Jitter Transfer and Its Mask]]) |
| Jitter generation | Jitter on the recovered clock with clean input | SONET: $\le$ 0.01 UI rms (Palermo L12 slide 48); Lee's PAM4 CDR: 281 fs rms at 28 GHz |
| CDR bandwidth | Corner of the tracking ($H$) response | modelled as 4 MHz first-order (IEEE 802.3, OIF-CEI); 2–4 MHz typical for PAM4/ADC receivers (Palermo L11 slides 24, 33) |
| Frequency offset | TX vs RX reference error the loop must absorb | each crystal 5–10 ppm off (Razavi 2002) |
| Lock (capture) range | Initial frequency error from which it locks | $\approx$ CDR bandwidth without a frequency detector (Casper §V-C); 54.1–56.8 Gb/s operating range (Lee PAM4) |
| Acquisition / lock time | Time to frequency- and phase-lock | burst-mode: a few preamble bytes (Hsieh §III) |
| Static phase offset | Mean sampling point vs eye center | Hogge: $\Delta T$ = flip-flop clock-to-Q (Razavi 2002) |
| Transition density, run length | What the PD needs from the data | encoded (8B/10B, 64B/66B, scrambling) to guarantee edges (Casper §II-B) |

> [!warning] Unverified
> Spread-spectrum clocking (SSC) must be tracked by SATA/PCIe-class CDRs (Hsieh §II-A names SATA), but none of the sources gives the SSC deviation or modulation frequency. Treat it as a frequency offset that varies slowly, which uses up slew budget in [[#Slew-rate limiting, frequency tolerance and JTOL]].

### CDR specs → loop parameters

**Linear (analog PLL) CDR** (Palermo L12 slide 21):

$$
\boxed{K_P=I_CR,\quad K_i=\frac{I_C}{C},\quad \omega_n=\sqrt{K_iK_{PD}K_{VCO}},\quad \zeta=\frac{K_P}{K_i}\frac{\omega_n}{2}}
\qquad
\boxed{C=\frac{I_CK_{PD}K_{VCO}}{\omega_n^2},\quad R=\frac{2\zeta}{\omega_nC}}
$$

**Digital (bang-bang + PI) CDR** (Casper Fig. 38, and [[#Level 3 Bang-Bang CDR Dynamics|Level 3]]):

$$
\boxed{s_{max}=\left|\frac{\Delta f}{f}\right|_{max}=\alpha_d\frac{\Delta T}{DF\cdot T_{SCK}}}\qquad
\boxed{J_{dither,pp}\approx(2D+1)\,\Delta T}\qquad
\boxed{JTOL_{pp}(f)\approx\frac{s_{max}-|\Delta f/f|}{\pi f\,T_b}+TM}
$$

($\alpha_d$: transitions per update clock, $\Delta T$: PI step, $DF$: decimation factor, $T_{SCK}$: update period, $D$: loop latency in updates, $TM$: timing margin.)

- **Bandwidth comes from the masks**, not from noise: jitter transfer caps it, jitter tolerance floors it ([[Link Noise and Jitter#Jitter Tolerance and Its Mask]]). That is why the frequency-synthesis PLL is split off into its own loop, whose bandwidth *can* be chosen for noise ([[Phased-Locked Loops#Choosing the loop bandwidth]]).
- **Frequency offset is a phase ramp.** A dual-loop CDR has no VCO to retune, so it must rotate the PI at $\Delta f/f$ UI per UI forever. That costs slew budget and requires an integral path.
- **PI step size sets three things at once:** frequency tolerance and slew (bigger is better), quantization and dither jitter (smaller is better).

> [!note]- Derivation: inverting the linear-loop formulas
> From $\omega_n^2=K_iK_{PD}K_{VCO}=\frac{I_C}{C}K_{PD}K_{VCO}$, $C=I_CK_{PD}K_{VCO}/\omega_n^2$. From $\zeta=\frac{I_CR}{I_C/C}\frac{\omega_n}{2}=\frac{RC\omega_n}{2}$, $R=2\zeta/(\omega_nC)$. Here $K_{PD}$ is dimensionless (average fraction of full CP current per radian): $TD/\pi$ for Hogge, $\approx2TD/J_{pp}$ for a bang-bang PD linearized by jitter ([[#Linearizing a bang-bang detector]]). The bandwidth and peaking of the resulting $H(s)$ are those of [[Phased-Locked Loops#Bandwidth, phase margin and peaking]].

### Loop parameters → circuit specs

| CDR spec | Circuit inside | Circuit spec it sets | Condition |
|---|---|---|---|
| Frequency tolerance, JTOL slope | PI + digital loop | Step $\Delta T$, update rate $1/T_{SCK}$ | $\alpha_d\Delta T/(DF\,T_{SCK})\ge|\Delta f/f|$ + SJ slope |
| Quantization/dither jitter | PI, loop pipeline | Step $\Delta T$, latency $D$ | $(2D+1)\Delta T\le$ its share of the jitter budget |
| Phase linearity (DNL/INL) | PI | Input phase spacing $\Delta t$ vs output time constant $RC$; DAC matching | $\Delta t/RC\lesssim1$; current-DAC $\sigma(\Delta I/I)$ |
| Uniform eyes (half/quarter rate) | DCC, QEC | Duty-cycle and quadrature error, correction range | residual error $\ll$ one PI step |
| Jitter generation | VCO, clock buffers, PI | Phase noise; buffer bandwidth vs $f_{clk}$; supply sensitivity | [[Oscillators#Spec translation]]; [[#Level 6 Clock Distribution]] |
| Static phase offset | Samplers, PD flip-flops | Clock-to-Q matching, sampler offset, data/edge clock skew | $\Delta T_{CK\to Q}$ appears directly as offset (Hogge) |
| PD works at the rate | XOR, CP (linear) / samplers (bang-bang) | Gate bandwidth, CP speed; sampler toggle rate and regeneration | Hogge needs a "relatively high-speed charge pump" (L12 slide 12); flip-flops stop near 32 Gb/s in 40 nm (Lee) |
| Edge-sampler decisions | Edge samplers | Metastability (they sample *on* the crossing) | [[Comparators#Level 4 Metastability]] |

> [!note]- Why: three of the less obvious rows
> **$\Delta t/RC$.** A PI sums two edges $\Delta t$ apart. If its output settles much faster than $\Delta t$, the output just shows two separate steps and the "interpolated" crossing jumps toward whichever input is stronger; if it is slow compared with $\Delta t$, the two steps blur into one ramp whose crossing moves linearly with the weight (Weinlader via Palermo L12 slides 35–36). [[#Level 4 Phase Interpolators]] has the curves.
>
> **DCC/QEC.** A quarter-rate RX samples on four phases; a phase that is off by $\epsilon$ puts that lane's sampler $\epsilon$ away from the others, so one of the four eyes is always mis-centered by $\epsilon$ no matter what the CDR does (L14 slide 11: "quadrature phase spacing and duty cycle correction is necessary for uniform output eyes").
>
> **Edge-sampler metastability.** At lock the edge sampler sits on the data crossing by design, so its input is near zero often; the regenerative latch then resolves slowly or randomly. Random resolutions are harmless (that randomness *is* what linearizes the BB detector), but late resolutions must not corrupt the loop logic.

### Where it lands in sizing

$$
\boxed{\tau_{PI}=R_LC_L\gtrsim\Delta t,\qquad I_{tail}=\frac{V_{sw}}{R_L}}\qquad
\boxed{\sigma\!\left(\frac{\Delta I}{I}\right)_{unit}^2\approx\left(\frac{g_m}{I_D}\right)^2\sigma_{V_{TH}}^2+\sigma_\beta^2}
$$

| Circuit spec | Fixes | How |
|---|---|---|
| PI output time constant $\tau_{PI}$ | $C_L$ (often deliberate), $R_L$ | slow enough to blend the two phases, fast enough to pass $f_{clk}$ with swing |
| PI swing, power | Tail current $I_{tail}=V_{sw}/R_L$ | CML level rule ([[High-Speed Circuit Techniques#Buffer swing, tail and load]]) |
| PI step matching (DNL) | Unit current-source $WL$, low $g_m/I_D$ | Pelgrom, exactly as a charge-pump source |
| DAC headroom under the steering pairs | High $g_m/I_D$ in the tail units | $V_{D,sat}\approx2/(g_m/I_D)$ |
| Clock-buffer bandwidth $\gg f_{clk}$ | $f_T$ of the pair: moderate $g_m/I_D$, $L_{min}$ | [[High-Speed Circuit Techniques#Spec translation]] |
| Charge-pump matching / offset (analog CDR) | Same as a PLL charge pump | [[Phased-Locked Loops#Where it lands in sizing]] |

> [!tip] Remark
> The PI current DAC is the same object as a segmented current-steering DAC (unit cells, thermometer code, Pelgrom matching): [[DACs]]. The method that turns a $g_m/I_D$ and $L$ into $W$ is [[gm-ID Design Methodology]].

### Worked example: a 10 Gb/s quarter-rate dual-loop CDR

Architecture from Palermo L12 slide 28 (also Palermo 2011 Fig. 9.10): a 2.5 GHz ring PLL gives 8 phases 45° apart; four mux/interpolator pairs with an 8-bit mux select and 15 interpolation weights per pair. Numbers after step 1 are illustrative (chosen here, not from the source).

1. **PI step.** 45° at 2.5 GHz is $\Delta t=50$ ps $=0.5$ UI. Reading the 15 weights as a thermometer code gives 16 steps per 45° (an inference), so $\Delta T=3.125$ ps $=1/32$ UI.
2. **Weighting error.** With linear weights ($a_1+a_2=1$) on sinusoid-like inputs 45° apart the phase error is at most 0.46° ([[#Sinusoidal vs linear weighting]]), i.e. 0.5 ps, a sixth of a step: linear weighting is fine at 45°. With only quadrature inputs (90°) it would be 4.1°, 4.5 ps, more than a step.
3. **Frequency tolerance.** Update at 625 MHz ($T_{SCK}=1.6$ ns), $DF=1$, $\alpha_d=0.5$: $s_{max}=0.5\cdot3.125/1600\approx980$ ppm. Two crystals 5–10 ppm off use at most 20 ppm of it.
4. **JTOL in the slew region.** At 10 MHz SJ: $(980-20)\times10^{-6}/(\pi\cdot10^7\cdot10^{-10})\approx0.31$ UI$_{pp}$ tracked, plus the timing margin. At 1 MHz, ten times that.
5. **Dither.** With $D=1$ update of latency, $3\Delta T=9.4$ ps $\approx0.09$ UI$_{pp}$; with $D=3$, $7\Delta T=0.22$ UI$_{pp}$. Latency is the expensive knob: pipeline the loop so $D$ is 1–2.
6. **PI load.** $\Delta t/RC\le1$ asks for $RC\ge50$ ps; that is also a 3.2 GHz pole, just above the 2.5 GHz clock. With $R_L=300\ \Omega$, $C_L\approx170$ fF and, for 300 mV swing, $I_{tail}=1$ mA.
7. **DAC matching.** A 16-unit thermometer DAC of 62.5 µA cells: holding DNL to 0.5 LSB at $3\sigma$ needs only $\sigma(\Delta I/I)_{unit}\lesssim17\%$. The DAC is **not** matching-limited; size the units for headroom (e.g. $g_m/I_D\approx15$ S/A, $V_{D,sat}\approx0.13$ V) and spend the effort on $\Delta t/RC$ and on the input phase spacing (QEC).

## Level 0: Link Clocking as a Black Box

### What the recovered clock must do

Razavi's three conditions (2002, after his optical-IC book):

1. **Frequency** equal to the data rate (10 GHz for 10 Gb/s), *or* several clocks whose phases are spaced one UI apart (four 2.5 GHz phases 100 ps apart).
2. **Phase**: edges in the middle of the eye, farthest from the transitions.
3. **Low jitter**, since it is the main contributor to the retimed data's jitter.

The flip-flop it clocks **retimes** the data: it samples the noisy data and regenerates it with less jitter, which is why it is also called the decision circuit.

### Synchronous to plesiochronous

| Term | TX vs RX clocks | Needs | Used in (Poulton via Palermo L11 slide 6) |
|---|---|---|---|
| Synchronous | same frequency and phase | nothing | low-speed busses |
| Mesochronous | same frequency, unknown phase | phase recovery (with or without a full CDR) | memory, internal system and MAC/packet interfaces |
| Plesiochronous | almost the same frequency: slowly drifting phase | a CDR | most high-speed links |
| Asynchronous | no clocks | handshakes | — |

### Three I/O clocking architectures

```tikz title="Common-clock, forwarded-clock and embedded-clock I/O. Common clock is limited by absolute skew (~100 Mb/s); forwarded clock sends the TX clock on an extra lane (mesochronous); embedded clock recovers frequency and phase from the data (plesiochronous). After Palermo L11 slides 8, 11, 15 and Casper Figs. 2, 4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.7cm,minimum width=1.0cm,align=center,fill=white}]
  % common clock
  \node[font=\small\bfseries] at (1.6,2.3) {common clock};
  \node[b] (t1) at (0,1.2) {TX}; \node[b] (r1) at (3.2,1.2) {RX};
  \draw[->] (t1) -- node[above] {data} (r1);
  \node[b] (c1) at (1.6,-0.2) {bus clk};
  \draw[->] (c1) -| (t1); \draw[->] (c1) -| (r1);
  \node[align=center] at (1.6,-1.2) {equal-length routes;\\limited by skew};
  % forwarded
  \begin{scope}[xshift=5.4cm]
    \node[font=\small\bfseries] at (1.6,2.3) {forwarded clock};
    \node[b] (t2) at (0,1.2) {TX}; \node[b,minimum height=1.6cm] (r2) at (3.2,0.75) {RX\\+\\deskew};
    \node[b] (p2) at (0,-0.2) {PLL};
    \draw[->] (p2) -- (t2);
    \draw[->] (t2.east) -- node[above] {data} (r2.west|-t2.east);
    \draw[->] (p2.east) -- node[above] {clock lane} (r2.west|-p2.east);
    \node[align=center] at (1.6,-1.2) {jitter tracked if clock\\and data paths match};
  \end{scope}
  % embedded
  \begin{scope}[xshift=12.4cm]
    \node[font=\small\bfseries] at (1.6,2.3) {embedded clock};
    \node[b] (t3) at (0,1.2) {TX}; \node[b] (r3) at (3.2,1.2) {RX};
    \node[b] (p3) at (0,-0.2) {PLL}; \node[b] (q3) at (3.2,-0.2) {CDR};
    \draw[->] (p3) -- (t3); \draw[->] (t3) -- node[above] {coded data} (r3);
    \draw[->] (q3) -- (r3); \draw[->] (r3.east) -- ++(0.3,0) |- (q3.east);
    \node[b,minimum width=0.8cm] (x1) at (-1.2,-0.2) {ref}; \node[b,minimum width=0.8cm] (x2) at (4.6,-0.2) {ref};
    \draw[->] (x1) -- (p3); \draw[->] (x2) -- (q3);
    \node[align=center] at (1.6,-1.2) {two crystals: ppm offset;\\tracking only below CDR BW};
  \end{scope}
\end{circuitikz}
\end{document}
```

| | Common clock | Forwarded (source-synchronous) | Embedded (CDR) |
|---|---|---|---|
| Timing relation | synchronous | mesochronous | mesochronous or plesiochronous |
| Rate | ~100 Mb/s (L11 slide 8) | multi-Gb/s; Intel QPI, HyperTransport | multi-Gb/s; most serial standards |
| Extra hardware | equal-length routes | one clock lane, clock RX amplifier, per-lane deskew | edge samplers, CDR per lane |
| Jitter tracking | none | correlated TX jitter tracked up to hundreds of MHz if delays match (Casper §II-A) | only below the CDR bandwidth (a few MHz) |
| Limits | skew, absolute delay | clock-data skew, FC channel's jitter amplification, FC duty cycle (L11 slide 12) | CDR bandwidth; more hardware (L11 slide 16) |
| Data coding | none | none for periodic deskew; transition coding for continuous | transitions required (8B/10B, 64B/66B, scrambling) |

> [!tip] Remark
> The numbers behind "forwarded clock tracks more" (55 ps vs 18 ps of eye width in Casper's 10 Gb/s comparison, and 3–4× more sensitivity to PLL jitter for the embedded link) are in [[Link Noise and Jitter#Architecture Consequence What the RX Clock Can Track]]. Why scaling erodes the advantage: faster CMOS allows wider CDR bandwidths (L11 slide 16).

### Sharing PLLs between TX and RX

- **Shared TX/RX PLL:** in a half-duplex or mesochronous link one PLL clocks both directions. Wong 2004's ×4 PLL generates the 1.8 GHz TX clock and, in receive mode, is the inner loop of the CDR ([[#Wong 2004 a CDR with no phase interpolator]]).
- **Global RX PLL, local phase loop:** a dual-loop CDR shares one frequency-synthesis PLL among lanes and keeps only the phase loop per lane (Casper §II-B: "a higher proportion of power, area and design resources may be allocated for the central clock source"). It costs clock distribution to every lane.
- **Per-lane VCO (PLL-based CDR):** fully modular, but a large loop-filter capacitor per lane, and adjacent VCOs can injection-lock to each other (Casper §II-B).
- **Same crystal for TX and RX** removes the ppm offset, but the PI still has to follow the phase wander between the two PLLs (Casper §II-B).

## Level 1: Phase Detectors for Random Data

### Why a PLL detector fails on data

A PFD sees a missing data edge as a missing reference cycle and pumps the VCO toward a lower frequency. A CDR detector must do two things: **detect that a transition happened, and measure the phase only then** (Razavi 2002; Palermo L12 slide 8). No transitions, no information: every detector's gain is proportional to the transition density $TD$ (0.5 for random NRZ).

> [!note]- Detail: the naive detector and its three flaws (Razavi 2002, Fig. 1b)
> Clock the PD flip-flop with the *data* and sample the VCO: the edge-detected data multiplies the VCO output, a beat pulls the frequency in, and the bang-bang characteristic locks the data edges to the clock zero crossings. Three flaws:
> 1. **Ripple:** for run lengths longer than one bit the flip-flop holds a full digital level, ramping the control voltage the whole time.
> 2. **Skew of $2\Delta T$:** the PD samples the clock by the data, but the retimer samples the data by the clock. If clock-to-Q exceeds D-to-Q by $\Delta T$, the PD locks with the data leading by $\Delta T$, and the clock then travels through the decision flip-flop too, so the retimer samples $2\Delta T$ off center.
> 3. **Feedthrough:** data transitions disturb the VCO through both flip-flops; the VCO needs a buffer with strong reverse isolation.
>
> The fix that every later detector adopts: **sample the data with the clock inside the PD**, so the PD's flip-flops *are* the decision circuit and their delays cancel.

### Hogge: linear, with a reference pulse

```tikz title="Hogge phase detector. FF1 retimes the data on the clock's rising edge (B); FF2 delays B by half a clock on the falling edge (A). Din XOR B gives a 'late' pulse whose width is the phase error plus half a period; B XOR A gives a fixed Tb/2 reference pulse. Their difference drives a charge pump. Right: average output vs phase error. After Razavi 2002 Fig. 2b and Palermo L12 slides 10-12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \node[draw,thick,minimum width=1.0cm,minimum height=1.0cm] (f1) at (1.5,0) {FF$_1$};
  \node[draw,thick,minimum width=1.0cm,minimum height=1.0cm] (f2) at (3.8,0) {FF$_2$};
  \draw[->] (-0.6,0) node[left] {$D_{in}$} -- (f1.west);
  \draw[->] (f1.east) -- node[above] {$B$} (f2.west);
  \draw (f2.east) -- (4.8,0) node[right] {$A$ ($D_{out}$)};
  \draw (-0.6,-1.3) node[left] {CK} -- (3.8,-1.3);
  \draw[->] (1.5,-1.3) -- (f1.south); \draw[->] (3.8,-1.3) -- (f2.south) node[pos=0.5,right] {$\overline{\text{CK}}$};
  \node[xor port] (x1) at (6.6,2.0) {};
  \node[xor port] (x2) at (6.6,0.9) {};
  \draw (-0.2,0) node[circ]{} |- (x1.in 1);
  \draw (2.65,0) node[circ]{} |- (x1.in 2);
  \draw (2.65,0) |- (x2.in 1);
  \draw (4.6,0) node[circ]{} |- (x2.in 2);
  \draw (x1.out) -- ++(0.2,0) node[right] {late ($+1$)};
  \draw (x2.out) -- ++(0.2,0) node[right] {$T_b/2$ ref ($-1$)};
  % characteristic
  \begin{scope}[xshift=10.6cm,yshift=0.5cm]
    \draw[->] (-1.8,0) -- (2.0,0) node[right] {$\phi_e$};
    \draw[->] (0,-1.5) -- (0,1.7) node[above] {avg.\ out};
    \draw[thick] (-1.3,-1.1) -- (1.3,1.1);
    \draw[dashed] (1.3,1.1) -- (1.3,-1.1) -- (1.7,-0.75);
    \draw[dashed] (-1.3,-1.1) -- (-1.3,1.1) -- (-1.7,0.75);
    \node[below,font=\scriptsize] at (1.3,-0.05) {$\pi$};
    \node[below left,font=\scriptsize] at (-1.3,0) {$-\pi$};
    \node[font=\scriptsize] at (0.2,-1.85) {$K_{PD}=TD/\pi$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{K_{PD,Hogge}=\frac{TD}{\pi},\qquad \phi_e=\phi_{in}-\phi_{clk}-\pi}
$$

- The **proportional pulse** ($D_{in}\oplus B$) is wider than $T_b/2$ when the clock is late, narrower when early. Its average alone depends on transition density: halving $TD$ and doubling the error gives the same DC, so the loop could false-lock. The **reference pulse** ($B\oplus A$, always $T_b/2$ per transition) removes that ambiguity; the charge pump takes the difference (Razavi 2002).
- Zero phase error is defined against the optimal $T_b/2$ (π) spacing between clock and data edges, hence the $-\pi$ (L12 slide 11).
- **No transition, no pulses**: a linear PD leaves the charge pump nearly idle in lock, unlike the bang-bang PD (Razavi 2002).
- XOR outputs drive the charge pump directly, so the CP must switch at the pulse rate (L12 slide 12).

> [!note]- Detail: Hogge's two built-in errors (Razavi 2002)
> **Static offset $\Delta T$.** FF1's clock-to-Q delay $\Delta T$ makes $B$ change $\Delta T$ after the clock edge, so the proportional pulse is $\Delta T$ wider than the true phase error; FF2's delay only shifts the reference pulse. In lock the loop equalizes the pulse widths by shifting the clock $\Delta T$ away from the eye center: several tens of degrees at high speed. Fix: narrow the proportional pulse or widen the reference by $\Delta T$.
>
> **Half-cycle ripple.** In lock the reference pulse comes $T_{CK}/2$ after the proportional pulse, so the control voltage gets an up-then-down kick on every transition that disturbs the VCO phase; modified detectors spread the kicks (DeVito).

### Half-rate linear detector

At very high rates a full-rate VCO with enough tuning range and low jitter is hard, so the VCO runs at half the bit rate and **both clock edges** sample (Razavi 2002, Fig. 4; Savoj and Razavi 2001):

- Two latches on opposite clock phases: $L_1$ gives a pulse of width $T_{CK}/2+\Delta T$, $L_2$ one of $T_{CK}/2-\Delta T$, and $A_1\oplus A_2$ is a pulse of width $\Delta T$ per transition: a linear proportional output.
- Two more latches make each path a master-slave flip-flop; XORing their outputs gives a $T_{CK}/2$ reference pulse per edge.
- In lock the proportional pulses are $T_{CK}/4$ wide and the reference pulses $T_{CK}/2$, so the reference **charge-pump current is halved**.
- The same circuit retimes and **demultiplexes** 1:2.

### Mixer-based linear detector

Instead of comparing pulse widths, extract a transition pulse with an XOR and **multiply it by the clock**: the mixer's DC output is proportional to the phase error and no sharp pulse is needed (Lee 2015, via their [15]). This is the [[Phased-Locked Loops#Phase detectors|multiplier phase detector]] applied to a data-derived pulse train.

- At 56 Gb/s NRZ no XOR can make a full-height 18 ps pulse. Lee's fix: a static ÷2 on the *data* splits the transitions into two interleaved streams, each XOR gets twice the time, and a three-input mixer recombines them with the full-rate clock ([[#Lee 2015 linear CDRs at 56 Gb/s]]).
- Lee notes that a Hogge PD "fails to operate at such a high data rate as pulses need to be created", while the mixer's pulses "could be round and incomplete as we do not need to compare pulsewidths".

### Alexander: bang-bang from three samples

```tikz title="Alexander (early-late) detection. Two data samples D_n, D_n+1 and one edge sample E_n half a UI later. If a transition happened (D_n differs from D_n+1), the edge sample equals the later bit when the clock is late and the earlier bit when it is early. After Razavi 2002 Fig. 3 and Palermo L12 slide 13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \foreach \yy/\lab/\e/\side in {0/{clock late}/2.4/{later},-2.6/{clock early}/1.6/{earlier}} {
    \begin{scope}[yshift=\yy cm]
      \draw[thick] (0,0.6) -- (1.85,0.6) -- (2.15,-0.6) -- (4.0,-0.6);
      \draw[thick] (0,-0.6) -- (1.85,-0.6) -- (2.15,0.6) -- (4.0,0.6);
      \node[left] at (0,0) {$D_{in}$};
      \fill (\e-0.8,0.6) circle (2pt) node[above] {$D_n$};
      \fill (\e,0) circle (2pt) node[below] {$E_n$};
      \fill (\e+0.8,0.6) circle (2pt) node[above] {$D_{n+1}$};
      \draw[dashed,gray] (2.0,-0.9) -- (2.0,0.9);
      \node[right,align=left] at (4.3,0) {\lab: $E_n$ falls on the \side{} side\\of the crossing, so it equals the \side{} bit};
    \end{scope}
  }
\end{circuitikz}
\end{document}
```

| $D_n\oplus D_{n+1}$ | $E_n\oplus D_n$ | $E_n\oplus D_{n+1}$ | Decision |
|---|---|---|---|
| 0 | — | — | no transition: hold |
| 1 | 1 | 0 | **late** (edge sample equals the second bit) |
| 1 | 0 | 1 | **early** (edge sample equals the first bit) |

(Palermo L12 slide 13.) Razavi's circuit (2002, Fig. 3b) uses four flip-flops: FF1 and FF3 set the two sampling instants (rising and falling clock edges); FF2 and FF4 only delay so that $S_1$, $S_2$, $S_3$ are valid at the same time for one full period, and two XORs compare them.

- **Most commonly used CDR detector** (L12 slide 13). It needs 2× oversampling: data *and* edge samplers, so twice the samplers and clock phases of a baud-rate RX.
- Unlike the naive flip-flop PD it **retimes the data** and gives **zero output with no transition**, so long runs leave the VCO undisturbed (it drifts only by its own noise).
- **Half-rate version:** sample with $CK_I$ and $CK_Q$; $A_1, A_2, A_3$ play the role of three consecutive samples, and in lock $CK_Q$'s rising edge sits on the data crossings (Razavi 2002, Fig. 5).
- Its output is a fixed-width early or late pulse (or a ±1 digital word): only the **sign** of the error.

### Linearizing a bang-bang detector

```tikz title="A bang-bang PD has infinite gain at zero error (left). Jitter and noise smear the edge: the average output is the ideal sign characteristic convolved with the jitter PDF, linear over a range equal to the peak-to-peak jitter (right). After Palermo L12 slides 14-15 (from Lee)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw[->] (-2,0) -- (2.2,0) node[right] {$\phi_e$};
  \draw[->] (0,-1.4) -- (0,1.6) node[above] {avg.\ out};
  \draw[thick] (-1.8,-1) -- (0,-1) -- (0,1) -- (1.8,1);
  \node at (0,-1.8) {no noise: sign only};
  \node at (3.6,0.5) {$\ast$ PDF $=$};
  \begin{scope}[xshift=7.0cm]
    \draw[->] (-2,0) -- (2.2,0) node[right] {$\phi_e$};
    \draw[->] (0,-1.4) -- (0,1.6) node[above] {avg.\ out};
    \draw[thick] (-1.8,-1) -- (-0.6,-1) -- (0.6,1) -- (1.8,1);
    \draw[<->] (-0.6,-1.25) -- (0.6,-1.25) node[midway,below] {$J_{pp}$};
    \node[anchor=west] at (0.7,0.4) {slope $2\,TD/J_{pp}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{K_{PD,BB}\approx\frac{2\,TD}{J_{pp}}\ \ (\text{uniform jitter}),\qquad K_{PD,BB}\approx\sqrt{\frac2\pi}\frac{TD}{\sigma_\phi}\approx\frac{0.8\,TD}{\sigma_\phi}\ \ (\text{Gaussian})}
$$

- **The gain depends on the jitter**, so the loop bandwidth of a bang-bang CDR changes with the input jitter amplitude: bigger jitter, lower gain, narrower loop (L12 slide 22). Use the linear model for intuition only; verify with a time-domain nonlinear model.
- Finite gain also comes from sampler metastability and ISI (L12 slide 14).

> [!note]- Derivation: the Gaussian slope (derived here)
> With error $\phi_e$ and Gaussian jitter $\sigma_\phi$, a transition reads "late" with probability $\Phi(\phi_e/\sigma_\phi)$ and "early" otherwise, so the average output per bit is $TD\,[2\Phi(\phi_e/\sigma_\phi)-1]$. Its slope at zero is $2TD\cdot\frac{1}{\sqrt{2\pi}\sigma_\phi}=\sqrt{2/\pi}\,TD/\sigma_\phi$. For a uniform PDF of width $J_{pp}$ the average is linear across the PDF and saturates outside it, slope $2TD/J_{pp}$ (Palermo L12 slide 15).

### Baud-rate: Mueller-Muller

```tikz title="Mueller-Muller timing: sample the single-bit pulse response once per UI and lock where the precursor equals the postcursor, h(t_k - T) = h(t_k + T). Early clock: h(-1) < h(+1). Late clock: h(-1) > h(+1). The lock point is not the pulse peak if the pulse is asymmetric. After Palermo L12 slides 16-17 (Musa) and Zhang slide 48."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,x=1cm,y=1cm]
  \draw[->] (-0.3,0) -- (7.4,0) node[right] {$t$};
  \draw[->] (0,-0.3) -- (0,3.2) node[above] {$h(t)$};
  \draw[thick,domain=0.4:7,samples=80] plot (\x,{2.8*exp(-((\x-3.2)/1.2)^2)*(1+0.25*(\x-3.2))+0.0});
  \foreach \t/\lab/\pos in {1.8/{$h_{-1}$}/left,3.2/{$h_0$}/above,4.6/{$h_{+1}$}/right} {
    \draw[->,thick,red!70!black] (\t,0) -- (\t,{2.8*exp(-((\t-3.2)/1.2)^2)*(1+0.25*(\t-3.2))});
    \node[\pos] at (\t,{2.8*exp(-((\t-3.2)/1.2)^2)*(1+0.25*(\t-3.2))}) {\lab};
  }
  \draw[<->] (1.8,-0.45) -- (3.2,-0.45) node[midway,below] {$T_b$};
  \draw[<->] (3.2,-0.45) -- (4.6,-0.45) node[midway,below] {$T_b$};
  \node[align=left,anchor=west] at (5.2,2.4) {lock: $h_{-1}=h_{+1}$\\phase error $\propto h_{+1}-h_{-1}$\\$=E[y_kd_{k-1}]-E[y_kd_{k+1}]$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\hat e_{MM}=E[y_k\,d_{k-1}]-E[y_k\,d_{k+1}]\propto h_{+1}-h_{-1}\qquad \text{lock: }h_{-1}=h_{+1}}
$$

- **One sample per UI** (one clock phase), so less power than 2× oversampling (Zhang slide 43). It is the natural detector for an ADC-based receiver.
- It **does not guarantee the eye center**: it balances precursor and postcursor ISI (Zhang slide 43). Positive output means too much postcursor, sampling too early (L12 slide 17).
- **Circuit (Spagna ISSCC 2010):** error samplers with thresholds $\pm V_{REF}$ compare each sample to the expected level; correlating $e_n$ with $d_{n-1}$ gives $h_1$, $e_{n-1}$ with $d_n$ gives $h_{-1}$. The simplified PD uses only transition patterns: $\Delta T_n=D_nD_{n-1}(ERR_n-ERR_{n-1})$, and if consecutive error samples differ the polarity is given by $e_j$ (L12 slides 18–19).
- **Sign-sign MMSE** is the alternative baud-rate rule: minimize $E[e^2]$ using only the signs of error and slope (Zhang slide 47).
- Because it locks to the cursors, MM interacts with the DFE and FFE that shape them ([[Equalization]]; [[Channels]] for cursors).

> [!note]- Detail: the simplified Mueller-Muller truth table (Spagna, via Palermo L12 slide 19)
> | $d_j$ | $d_{j-1}$ | $e_j$ | $e_{j-1}$ | phase |
> |---|---|---|---|---|
> | 1 | −1 | 1 | −1 | late |
> | −1 | 1 | 1 | −1 | late |
> | 1 | −1 | −1 | 1 | early |
> | −1 | 1 | −1 | 1 | early |
> | all other cases | | | | hold |

### PAM4 detectors

| Issue | What changes | Source |
|---|---|---|
| Transition density | 12 of 16 symbol pairs change level: $TD=75\%$ (NRZ: 50%) | Zhang slide 44 |
| Crossings | three crossing clusters; the major ($\pm3\leftrightarrow\mp3$ through zero) has the tightest distribution; $+3\leftrightarrow+1$ and $-3\leftrightarrow-1$ depend on slicer placement | Zhang slide 45 |
| Transition selection | use only selected (symmetric) transitions in a 2× oversampled BBPD; lower effective $TD$ lowers the CDR bandwidth | Zhang slides 45–46; Roshan-Zamir JSSC 2019 (L12 slide 24) |
| Linear PD | limit the PAM4 input at the middle threshold; a central crossover occurs with probability 1/4, each side crossover 1/8; the mixer averages them, leaving the clock in the eye center | Lee 2015 §III-B |
| Baud-rate | Mueller-Muller tracks SJ in quarter-rate 40 Gb/s simulations (64 PI codes per symbol) | Zhang slides 48–50 |

> [!tip] Remark
> Why the PAM4 eye is narrower and its crossings spread: [[Signaling and BER#The PAM4 Eye]]. The slicers that produce data, edge and error samples: [[Comparators#PAM4 Needs Three Thresholds]].

### Comparing the detectors

| Detector | Output | Samples / UI | Gain | Strength | Weakness |
|---|---|---|---|---|---|
| Hogge | linear pulse widths | 1 (full rate) | $TD/\pi$ | analyzable, quiet in lock | static offset $\Delta T$; needs narrow pulses and fast CP |
| Half-rate linear | linear | 2 edges of half-rate clock | linear | half-rate VCO, built-in 1:2 DEMUX | still pulse-based |
| Mixer (Lee) | DC level | 1 | linear | no pulse-width compare; works at 56 Gb/s | analog sensitivity |
| Alexander / BB | sign (tri-state) | 2 (data + edge) | $\approx2TD/J_{pp}$ | simple, digital, robust, most common | nonlinear, dithers; double samplers |
| Oversampling (>2) | sign/digital | 3+ | — | feed-forward, burst mode | samplers, FIFO |
| Mueller-Muller | sign of $h_{+1}-h_{-1}$ | 1 | — | one clock phase; ADC RX | not eye center; interacts with EQ |

(Palermo L12 slide 9 for the linear/nonlinear split; Palermo 2011 p. 294: linear PDs "are easier to analyze" but "harder to implement at high data rates due to the difficulty of generating narrow error pulse widths, resulting in effective dead zones"; binary PDs avoid this "by providing equal delay for both data and phase information".)

## Level 2: CDR Architectures

### Single-loop PLL-based CDR

```tikz title="PLL-based CDR: the PD replaces the PFD and the loop locks a per-lane VCO to the data. Linear model: proportional path K_P = I_C R and integral path K_i = I_C/C in parallel, VCO K_VCO/s. After Palermo L12 slides 6, 21 and Palermo 2011 Fig. 9.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.8cm,minimum width=1.1cm,align=center}]
  \node[draw,circle,thick,inner sep=1.5pt] (s) at (0,0) {$\Sigma$};
  \draw[->] (-1.2,0) node[left] {$\phi_{in}$} -- (s);
  \node[b] (kpd) at (1.5,0) {$K_{PD}$};
  \node[b] (kp) at (3.6,0.9) {$K_P$};
  \node[b] (ki) at (3.6,-0.9) {$K_i/s$};
  \node[draw,circle,thick,inner sep=1.5pt] (s2) at (5.2,0) {$\Sigma$};
  \node[b] (vco) at (6.8,0) {$K_{VCO}/s$};
  \draw[->] (s) -- (kpd); \draw (kpd) -- (2.6,0); \draw[->] (2.6,0) |- (kp); \draw[->] (2.6,0) |- (ki);
  \draw[->] (kp) -| (s2); \draw[->] (ki) -| (s2); \draw[->] (s2) -- (vco);
  \draw[->] (vco) -- (8.6,0) node[right] {$\phi_{out}$};
  \draw[->] (8.0,0) -- (8.0,-1.9) -| (s) node[pos=0.95,left] {$-$};
  \node[align=left,anchor=west] at (-1.2,-2.7) {$\dfrac{\phi_{out}}{\phi_{in}}=\dfrac{(sK_P+K_i)K_{PD}K_{VCO}}{s^2+(sK_P+K_i)K_{PD}K_{VCO}}$};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> This is the type-II charge-pump PLL of [[Phased-Locked Loops#Level 2 The Charge-Pump Type II PLL]] with $N=1$; its closed-loop $H(s)$, jitter transfer and JTOL $=TM/|1-H|$ are in [[Link Noise and Jitter#Level 6 Jitter in Frequency Transfer, Tolerance, Generation]]. VCO noise reaches the recovered clock high-passed ([[Link Noise and Jitter#Jitter Generation]]).

**The single loop's problems** (Palermo L12 slide 27; Palermo 2011 p. 294):

- **Acquisition.** Random-data PDs have a small frequency acquisition range: long lock times, no lock, or lock to a harmonic. Without a frequency detector, the capture range is about the CDR bandwidth, while VCO PVT spread is many percent (Casper §V-C).
- **One bandwidth for two jobs.** The bandwidth is fixed by jitter transfer and tolerance, leaving no freedom to set it for VCO noise.
- **Cost:** a PLL (loop-filter capacitor, VCO) per lane.
- **Low supply:** $K_{VCO}$ must rise as $V_{DD}$ falls to keep the same percentage tuning range, so control-line ripple becomes more jitter. Fix: coarse and fine control inputs, with the coarse one quiet after lock (Razavi 2002).

### Frequency acquisition

| Scheme | How | Issues | Source |
|---|---|---|---|
| Referenceless FD + PD | a data-based frequency detector pulls the VCO, then the PD takes over | loops can "fight"; spectral lines in real data confuse the FD; so FLL bandwidth $\ll$ PLL bandwidth | Razavi Fig. 6a; Hsieh Fig. 4a (Pottbäcker) |
| FD on coarse, PD on fine control | each loop has its own CP and filter | two loop filters (area) | Razavi Fig. 6b; Hsieh Fig. 4b |
| Replica VCO locked to $Nf_{REF}$ | VCO$_2$ in a PLL drives the coarse input of VCO$_1$ | VCO mismatch of a few % exceeds the PD capture range; 5–10 ppm TX/RX offset makes the two VCOs pull each other; two LC VCOs cost area | Razavi Fig. 7a; Hsieh Fig. 5a |
| Sequential locking | lock detector runs the PFD loop until $|f_B-f_{REF}|$ is small (e.g. 0.1%), then hands over to the PD | the switch-over glitch can kick the VCO out of the PD's capture range | Razavi Fig. 7b; Hsieh Fig. 5b |
| Frequency loop that shuts off | FD with a local reference turns itself off after lock | — | Lee 2015 |

The diagrams are in [[#Razavi 2002 phase detectors and acquisition]].

### Digital PLL CDR

Replace the charge pump and filter with a digital loop filter (DLF) driving a DAC-controlled or digitally controlled oscillator (Hsieh Fig. 6). Gains: area, programmable gains, no PVT drift of the filter, portability. Costs: **loop latency** from the DLF and DAC (worse tracking and jitter tolerance, especially with SSC) and **finite DAC resolution**, which makes the VCO wander between adjacent frequency steps. A common hybrid digitizes only the integral path, clocked at a sub-rate, and keeps a fast proportional path (Casper §V-C).

### Dual-loop CDR with phase interpolators

```tikz title="Quarter-rate dual-loop CDR. A shared frequency-synthesis PLL makes 8 phases at 2.5 GHz; per lane, 4:1 muxes pick two adjacent phases and interpolators blend them under a digital FSM driven by a bang-bang PD. The two loops are independent. After Palermo L12 slide 28 and Palermo 2011 Fig. 9.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.75cm,align=center,fill=white}]
  \draw[dashed,blue!60!black] (-0.4,1.0) rectangle (8.2,3.4);
  \node[blue!60!black,anchor=north west] at (-0.3,3.35) {frequency-synthesis PLL (shared)};
  \node[b,minimum width=1.0cm] (pfd) at (6.9,2.6) {PFD};
  \node[b,minimum width=0.8cm] (cp) at (5.4,2.6) {CP};
  \node[b,minimum width=1.0cm] (lf) at (3.9,2.6) {LF};
  \node[b,minimum width=2.4cm] (vco) at (1.9,1.65) {4-stage diff.\ ring};
  \node[b,minimum width=0.9cm] (div) at (6.9,1.65) {$\div25$};
  \draw[<-] (pfd.east) -- ++(0.9,0) node[right] {100 MHz ref};
  \draw[->] (pfd) -- (cp); \draw[->] (cp) -- (lf); \draw[->] (lf.west) -| (vco.north);
  \draw[->] (vco.east) -- (div.west); \draw[->] (div) -- (pfd);
  \draw[->,thick] (1.9,1.27) -- (1.9,0.2) node[pos=0.4,right] {8 phases, 45$^\circ$, 2.5 GHz};
  \draw[dashed,red!60!black] (-0.4,-3.5) rectangle (8.2,0.6);
  \node[red!60!black,anchor=south west] at (-0.3,-3.45) {phase-recovery loop (per lane)};
  \node[b,minimum width=2.8cm] (mux) at (1.9,-0.4) {4:1 muxes (pick 2 phases)};
  \node[b,minimum width=2.8cm] (pi) at (1.9,-1.45) {4 interpolator pairs};
  \node[b,minimum width=1.1cm] (pd) at (1.9,-2.6) {RX + BB PD};
  \node[b,minimum width=1.0cm] (fsm) at (5.0,-2.6) {FSM};
  \draw[->] (mux) -- (pi); \draw[->] (pi) -- node[right] {$\Psi[3{:}0]$, $\overline{\Psi}[3{:}0]$} (pd);
  \draw[->] (pd) -- node[above] {early/late} (fsm);
  \draw[->] (fsm.east) -- (6.6,-2.6) -- (6.6,-0.4) -- node[above] {sel (8)} (mux.east);
  \draw[->] (6.6,-1.45) -- node[below] {weights (15)} (pi.east);
  \draw[<-] (pd.west) -- ++(-1.7,0) node[left] {10 Gb/s};
\end{circuitikz}
\end{document}
```

- **Two degrees of freedom:** the CDR (phase) bandwidth is set for the jitter specs, the PLL bandwidth for best synthesis noise, and the PLL is shared among lanes and with the TX (Palermo 2011 p. 295).
- **Unlimited phase range:** the PI rotates through 360° forever, so a ppm offset is tracked as a constant rotation rate (Hsieh §II-D).
- **Costs:** multiphase distribution must preserve phase spacing and its power grows with the number of phases; PIs cost power and area; PI resolution, linearity and loop latency all become jitter (Hsieh §II-D).

Variants:

| Variant | What moves | Trade | Source |
|---|---|---|---|
| **Local DLL phase generation** | only a differential clock is distributed; a per-lane (or per-4-lane) DLL makes the 8 phases | DLL per lane, but distribution of one phase only; with the PLL replaced by a forwarded clock it is a forwarded-clock RX | L12 slide 29; Palermo 2011 p. 296 |
| **Phase-rotator PLL** | one interpolator inside the PLL feedback shifts *all* VCO phases at once | loops coupled: PLL bandwidth must exceed the phase loop's (also filters PI glitches and VCO noise); one PI regardless of the demux ratio | L12 slide 30; Palermo 2011 Fig. 9.23 |
| **Phase selector** (no PI) | the DLF picks one of $M$ VCO phases | all-digital, PVT-robust, but discrete steps: cycle-to-cycle jitter; more phases cost power | Hsieh Fig. 10a |
| **Selector in the PLL feedback** | the discrete step is smoothed by the PLL filter | separate bandwidths, but one PLL per lane | Hsieh Fig. 10b |
| **CP-mismatch phase shift** | a digitally set CP current mismatch shifts the PLL's static phase | no PI at all; ripple needs an SC notch | Wong 2004 |
| **Injection-locked slave oscillator** | a phase selector injects into a slave oscillator that smooths the steps | smoother phase, duty-cycle correction; lock-range limits | Hsieh Fig. 11 (Ng 2003) |

> [!note]- Detail: jitter peaking in PI-based CDRs (Hsieh §II-D)
> DLL- and PI-based CDRs are first-order in phase and have no jitter peaking, *provided* the loop latency is not much longer than the PI update period. Otherwise fast-changing jitter has already reversed direction by the time the phase correction reaches the PI, which is a phase lag and produces peaking.

### DLL-based and combined PLL/DLL CDRs

- **DLL-based CDR** (Hsieh Fig. 7): a shared PLL makes a clock at the data rate; a per-lane VCDL delays it into phase with the data. No jitter accumulation, unconditionally stable (no VCO pole), fast lock, no VCO pulling between lanes. But the **phase capture range is limited** to the delay range, so it cannot follow a frequency offset: source-synchronous links only.
- **Combined PLL/DLL** (Hsieh Fig. 8, Dalton 2005, Rhee 2003): a DLL inside the PLL supplies the stabilizing zero, so the PLL filter can be a pure capacitor and jitter peaking disappears while the bandwidth stays small. It goes unstable if the VCDL hits the end of its range, so the VCO range must be a subset of the VCDL's; separate charge pumps and filters remove the coupling.

> [!tip] Remark
> The DLL loop itself (first order, $\omega_N=I_{CH}K_{DL}F_{REF}/C_1$, stable while $\omega_N<\omega_{ref}/10$, false lock at $2T$) is in [[Phased-Locked Loops#Level 5 Delay-Locked Loops]].

### Oversampling (blind) CDR

```tikz title="3x blind oversampling: each bit is sampled three times by multiphase clocks with no feedback to the clock phase; a bit-boundary detector finds where transitions occur and a selector keeps the sample farthest from them. After Hsieh Fig. 12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw[thick] (0,0.6) -- (2.2,0.6) -- (2.4,-0.6) -- (4.6,-0.6) -- (4.8,0.6) -- (7.2,0.6);
  \draw[thick] (0,-0.6) -- (2.2,-0.6) -- (2.4,0.6) -- (4.6,0.6) -- (4.8,-0.6) -- (7.2,-0.6);
  \node[left] at (0,0) {$D_{in}$};
  \foreach \x/\c in {0.5/gray,1.3/blue,2.1/gray,2.9/gray,3.7/blue,4.5/gray,5.3/gray,6.1/blue,6.9/gray} {
    \draw[\c,thick] (\x,-1.0) -- (\x,1.0);
  }
  \node[below] at (3.6,-1.1) {blue: selected samples; grey: discarded (near transitions)};
  \node[draw,thick,align=center] at (10,0.3) {multiphase samplers\\$\to$ FIFO $\to$ bit-boundary\\detect $\to$ data selector};
\end{circuitikz}
\end{document}
```

- At least **3 samples per bit**; data are recovered without moving the clock (Hsieh §II-F).
- Fast acquisition, inherently stable, all-digital and portable, good for **burst-mode** links (PON, FTTH) where data must be recovered within a few preamble bytes.
- Costs: many samplers and phases; a large FIFO, especially with a frequency offset; long data latency. High-frequency jitter rejection needs frequent transitions.
- **Open-loop relatives:** the **gated oscillator** (restarted by each data edge, frequency set by a replica in a PLL) and the **high-Q band-pass filter** (SAW, LC, dielectric resonator) recover a clock instantly but have **no jitter rejection** and their clock-data alignment drifts with PVT (Hsieh §II-G, H).

### Choosing an architecture

| Architecture | Strengths | Weaknesses | Typical use (Hsieh Table 1) |
|---|---|---|---|
| PLL (single loop) | input jitter rejection; tracks frequency, SSC | jitter peaking; large analog filter; VCO pulling between lanes; long acquisition | SONET/SDH, GbE, serial links |
| DLL | first order, no peaking; lanes share input clocks | source-synchronous only; limited phase range | chip-to-chip |
| PLL/DLL | no peaking, small BW with fast acquisition, SSC | two loops to analyze; pulling | SONET, Ethernet, Fibre Channel |
| Phase interpolator | lanes share clocks; unlimited phase range; digital | quantization error; multiphase routing; cycle-to-cycle jitter | SONET, OIF CEI, SATA |
| Injection-locked | good JTOL, duty-cycle correction | quantization; multiphase routing; oscillator range vs jitter | crosspoint switches, serial I/O |
| Oversampling | no feedback, fast, portable | digital complexity, FIFO, latency, multiphase | SATA, backplane, PON |
| Gated VCO / high-Q filter | instant lock, small/low power | no jitter rejection; PVT-sensitive alignment | burst mode, PON, LAN |

(Hsieh §III.) In current multi-lane SerDes the default is the dual-loop PI CDR with a bang-bang PD (Casper §V-C: "the most common EC CDR architecture"), with PLL-based analog CDRs where power matters (Roshan-Zamir 56 Gb/s PAM4, L12 slides 23–25) and baud-rate CDRs in ADC-based receivers.

## Level 3: Bang-Bang CDR Dynamics

### The digital loop

```tikz title="A digital bang-bang CDR: the PD emits +1/0/-1 per transition; a decimator (factor DF) and a proportional + integral filter produce a phase code; the PI moves the clock one step dT per update period T_SCK. The integral path learns the frequency offset. Loop latency D counts update periods from sample to phase change. After Casper Figs. 36-38 and Palermo L12 slide 28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[b,minimum width=1.2cm] (pd) at (0,0) {BB PD\\$\{+1,0,-1\}$};
  \node[b,minimum width=1.3cm] (dec) at (2.4,0) {decimate\\$\div DF$};
  \node[b,minimum width=1.0cm] (kp) at (4.7,0.75) {$K_P$};
  \node[b,minimum width=1.4cm] (ki) at (4.7,-0.75) {$K_I\sum$};
  \node[draw,circle,thick,inner sep=1pt] (s) at (6.4,0) {$\Sigma$};
  \node[b,minimum width=1.6cm] (acc) at (8.2,0) {phase\\accumulator};
  \node[b,minimum width=1.4cm] (pi) at (10.6,0) {PI\\step $\Delta T$};
  \draw[->] (pd) -- (dec); \draw (dec) -- (3.5,0); \draw[->] (3.5,0) |- (kp); \draw[->] (3.5,0) |- (ki);
  \draw[->] (kp) -| (s); \draw[->] (ki) -| (s); \draw[->] (s) -- (acc); \draw[->] (acc) -- (pi);
  \draw[->] (pi.south) -- (10.6,-1.8) -| (pd.south) node[pos=0.25,below] {sampling clock (latency $D$ updates)};
  \draw[<-] (pd.west) -- ++(-0.8,0) node[left] {data};
  \node[blue!60!black,align=left,anchor=west] at (5.6,-1.05) {integral path $\to$ frequency offset};
\end{circuitikz}
\end{document}
```

The PI can change phase by at most one step per update. That one fact gives the three behaviors below: **dither** in lock, a **slew-rate limit** on how fast phase can move, and a **frequency tolerance**.

### Dither: the limit cycle in lock

```tikz title="Bang-bang limit cycle with one update of latency (D = 1). The decision uses the phase from one update earlier, so the loop overshoots: the phase cycles over 3 steps peak-to-peak with a period of 6 updates. In general (2D+1) steps pp, period 2(2D+1). Derived here; Wong 2004 measured 22 ps pp = 3 LSB."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,x=0.55cm,y=0.6cm]
  \draw[->] (0,-1.8) -- (19,-1.8) node[right] {update $n$};
  \draw[->] (0,-1.8) -- (0,3.0) node[above] {phase (steps)};
  \foreach \y in {-1,0,1,2} \draw (0,\y) -- (-0.2,\y) node[left] {\y};
  \draw[dashed,red!70!black] (0,0.5) -- (18.6,0.5) node[right] {eye center};
  \draw[thick,blue!70!black] (0,0) -- (1,0) -- (1,1) -- (2,1) -- (2,2) -- (3,2) -- (3,1) -- (4,1) -- (4,0) -- (5,0) -- (5,-1) -- (6,-1) -- (6,0) -- (7,0) -- (7,1) -- (8,1) -- (8,2) -- (9,2) -- (9,1) -- (10,1) -- (10,0) -- (11,0) -- (11,-1) -- (12,-1) -- (12,0) -- (13,0) -- (13,1) -- (14,1) -- (14,2) -- (15,2) -- (15,1) -- (16,1) -- (16,0) -- (17,0) -- (17,-1) -- (18,-1);
  \draw[<->] (18.3,-1) -- (18.3,2); \node[anchor=west] at (18.4,1.7) {$3\Delta T$ pp};
\end{circuitikz}
\end{document}
```

$$
\boxed{J_{dither,pp}=(2D+1)\,\Delta T,\qquad T_{cycle}=2(2D+1)\,T_{update}}
$$

- With no latency the loop toggles between the two codes straddling the eye center ($1\Delta T$ pp). Every update of latency adds two steps.
- Wong 2004 measured **22 ps pp** of dither in lock, "corresponding to 3-LSB steps", alongside 6.8 ps rms PLL jitter.
- Dither is deterministic and periodic; it adds to the jitter budget like PJ ([[Link Noise and Jitter#Periodic Jitter PJ]]). With input jitter larger than a step the PD output is randomized and the limit cycle breaks up into a random walk of similar size.
- Ways to cut it: smaller $\Delta T$, less latency (pipeline, digital pre-filtering; Casper §V-C), or an analog proportional path.

> [!note]- Derivation: why $(2D+1)$ steps (derived here, checked by simulating $\phi_{n+1}=\phi_n+\mathrm{sgn}(\phi_c-\phi_{n-D})$)
> Put the eye center between codes 0 and 1. With $D=0$: at 0 the PD says "late side is right", step to 1; at 1 step back: period 2, 1 step pp. With latency $D$ the decision at update $n$ uses $\phi_{n-D}$, so after the phase crosses the center the loop keeps stepping the same way for $D$ more updates before the reversed decisions arrive: it overshoots by $D$ steps on each side. The excursion is from $-D$ to $1+D$: $2D+1$ steps, and a full cycle takes $2(2D+1)$ updates. (Simulated for $D=0\ldots4$: 1, 3, 5, 7, 9 steps pp.)

### Slew-rate limiting, frequency tolerance and JTOL

```tikz title="Left: a frequency offset is a phase ramp; the PI must step at least as often as the ramp accumulates one step: max slope = alpha_d dT / (DF T_SCK). Right: bang-bang JTOL. Above the CDR bandwidth it is flat at the timing margin; below it the loop is slew limited and tolerance rises only 20 dB/dec, versus 40 dB/dec for a linear type-II loop. After Casper Fig. 38; slew curve derived here."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw[->] (0,0) -- (4.6,0) node[right] {time};
  \draw[->] (0,0) -- (0,3.2) node[above] {phase};
  \draw[thick,red!70!black] (0,0) -- (4.2,2.9) node[right] {$\Delta\phi=\int\Delta f$};
  \draw[thick,blue!70!black] (0,0) -- (0.7,0) -- (0.7,0.5) -- (1.4,0.5) -- (1.4,1.0) -- (2.1,1.0) -- (2.1,1.5) -- (2.8,1.5) -- (2.8,2.0) -- (3.5,2.0) -- (3.5,2.5) -- (4.2,2.5);
  \draw[<->] (2.8,1.5) -- (3.5,1.5) node[midway,below] {$DF\,T_{SCK}/\alpha_d$};
  \draw[<->] (3.7,2.0) -- (3.7,2.5) node[midway,right] {$\Delta T$};
  \begin{scope}[xshift=7.2cm,x=1.4cm,y=0.75cm]
    \draw[->] (0,0) -- (4.6,0) node[right] {$\log f_{SJ}$};
    \draw[->] (0,0) -- (0,4.4) node[above] {JTOL (UI$_{pp}$, log)};
    \draw[thick,blue!70!black] (0.3,4.1) -- (2.6,0.9) .. controls (2.8,0.7) and (3.0,0.6) .. (3.3,0.6) -- (4.4,0.6);
    \node[blue!70!black,anchor=west] at (2.0,3.3) {bang-bang: $-20$ dB/dec};
    \draw[thick,dashed,gray] (1.35,4.1) -- (2.6,0.75);
    \node[gray,anchor=west] at (1.45,4.3) {linear: $-40$ dB/dec};
    \node[anchor=west] at (3.3,0.95) {$\approx TM$};
    \draw[dotted] (2.7,0) -- (2.7,1.6) node[above] {slew corner};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{s_{max}=\alpha_d\frac{\Delta T}{DF\cdot T_{SCK}}\ \ (\text{UI per UI}),\qquad \left|\frac{\Delta f}{f}\right|\le s_{max},\qquad JTOL_{pp}(f)\approx\frac{s_{max}-|\Delta f/f|}{\pi f\,T_b}+TM}
$$

- **Frequency tolerance = phase step / update interval** (Casper Fig. 38). Raising it means bigger steps (more quantization and dither jitter) or faster updates (more power): "a fundamental tradeoff in this architecture between quantization jitter and frequency tolerance" (Casper §V-C).
- **The integral path holds the offset.** Without it, a static offset keeps the proportional path pinned at its slew limit on one side, with a standing phase error. A PI-based CDR therefore needs an integral controller, which makes the loop more complex (Casper §II-B).
- **JTOL falls 20 dB/dec in the slew region** because the CDR can match a sinusoid's peak slope $\pi fA_{pp}T_b$ (in UI/UI) only up to $s_{max}$. Masks also fall at 20 dB/dec, so the slew corner, not the low-frequency end, is what must clear the mask.
- **The linearized loop and the slew model are two views** of the same loop: small jitter sees a high-gain linear loop (bandwidth $\propto1/J_{pp}$), large low-frequency SJ sees a slew-limited one.
- **Lock time without frequency acquisition:** a PI-based CDR starts at a random phase and needs at most $\approx0.5\,\mathrm{UI}/s_{max}$ UIs to reach the eye center (about 500 UI for $s_{max}=1000$ ppm).

> [!note]- Derivation: the slew-limited JTOL (derived here from Casper's slope)
> In UI units, the input phase is $\phi_{in}(t)=\frac{A_{pp}}{2}\sin(2\pi ft)$ plus a ramp $(\Delta f/f)\,t/T_b$. The loop's phase moves at most $s_{max}$ UI per UI. Its peak required slope is $\frac{A_{pp}}2\cdot2\pi f\cdot T_b+|\Delta f/f|$ UI per UI. Tracking without the error growing requires $\pi fA_{pp}T_b+|\Delta f/f|\le s_{max}$, so the tracked amplitude is $A_{pp}\le(s_{max}-|\Delta f/f|)/(\pi fT_b)$, falling as $1/f$. On top of what is tracked, the sampler can absorb the timing margin $TM$, hence the $+TM$. At high $f$ the first term drops below the step size and the curve flattens at $TM$, as for any CDR ([[Link Noise and Jitter#Jitter Tolerance and Its Mask]]). Casper's $\alpha_d$ is the expected number of transitions per update clock, since only transitions produce decisions.

### Analog bang-bang loops

A bang-bang PD driving a charge pump and VCO (Roshan-Zamir's 56 Gb/s PAM4 CDR, Palermo L12 slides 23–25) behaves the same way with continuous quantities: the proportional path $I_{CP}R$ makes a fixed frequency step $\pm K_{VCO}I_{CP}R$ that reverses with each decision (the analog dither), and the integral capacitor holds the frequency. Parallel charge pumps cut logic and loop delay (L12 slide 24), which is the analog version of keeping $D$ small. Lee 2015 rejects a bang-bang CDR at 56 Gb/s for its "large external capacitor in the loop filter and non-linear characteristic".

## Level 4: Phase Interpolators

A PI is a **digital-to-phase converter**: its output is a weighted sum of two input clock phases, so a code picks a phase between them (Palermo L12 slide 32).

### Sinusoidal vs linear weighting

```tikz title="Left: summing I and Q with weights (cos phi, sin phi) rotates the output phasor on a circle; linear weights (a1 + a2 = 1) move it along a chord, so the phase steps are uneven and the amplitude dips mid-way. Right: output phase vs code for 16 linear steps over 90 degrees, bowed by up to 4.1 degrees. After Palermo L12 slides 33-34 (Kreienkamp); curve computed here."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw[->] (-0.3,0) -- (3.3,0) node[right] {$X_I$};
  \draw[->] (0,-0.3) -- (0,3.3) node[above] {$X_Q$};
  \draw[dashed] (2.8,0) arc (0:90:2.8);
  \draw[thick,red!70!black] (2.8,0) -- (0,2.8);
  \foreach \a in {0.25,0.5,0.75} { \draw[->,red!70!black] (0,0) -- ({2.8*(1-\a)},{2.8*\a}); }
  \draw[->,thick,blue!70!black] (0,0) -- ({2.8*cos(30)},{2.8*sin(30)}) node[right] {$Y$};
  \node[blue!70!black] at (1.0,0.25) {$\phi$};
  \node[red!70!black,anchor=west] at (1.6,2.0) {linear: chord};
  \node[anchor=north] at (1.5,-0.5) {$Y=a_1X_I+a_2X_Q$};
  \begin{scope}[xshift=5.6cm,x=0.25cm,y=0.035cm]
    \draw[->] (0,0) -- (17.5,0) node[right] {code};
    \draw[->] (0,0) -- (0,98) node[above] {phase ($^\circ$)};
    \foreach \y in {0,45,90} \draw (0,\y) -- (-0.4,\y) node[left] {\y};
    \foreach \x in {0,8,16} \draw (\x,0) -- (\x,-2) node[below] {\x};
    \draw[thick,blue!70!black] (0,0) -- (16,90) node[right] {ideal};
    \draw[thick,red!70!black,domain=0:16,samples=40] plot (\x,{atan2(\x/16,1-\x/16)});
    \node[red!70!black,anchor=west] at (9,40) {linear weights};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Y=A\sin(\omega t-\phi)=\cos\phi\,X_I+\sin\phi\,X_Q:\quad a_1^2+a_2^2=1}\qquad
\boxed{\text{linear: }a_1+a_2=1,\quad \phi(a)=\tan^{-1}\frac{a\sin\theta}{(1-a)+a\cos\theta}}
$$

- Sinusoidal weighting is exact for sinusoidal inputs but hard to build; **linear weighting** is used in practice (L12 slide 34).
- The error of linear weighting depends on the input spacing $\theta$: **4.1° over a 90° span, 0.46° over 45°** (computed here), and the amplitude dips to $\cos(\theta/2)$ mid-span (0.71 and 0.92). Mixing closer phases (8 rather than 4 inputs) shrinks both.
- Bulzacchelli's code space is a **diamond**: $|I|+|Q|$ constant, with quadrant set by polarity bits (L12 slide 32), the linear rule in all four quadrants.

### The time-constant condition

$$
\boxed{\frac{\Delta t}{RC}\lesssim1\quad(\Delta t:\ \text{input phase spacing},\ RC:\ \text{PI output time constant})}
$$

Weinlader's model (L12 slides 35–36): two current-steering halves with weights $(1-\alpha)I$ and $\alpha I$ into one $R_S\|C_L$ load, driven by edges $\Delta t$ apart. With **ideal step inputs** (worst case) the output phase vs weight bows strongly at $\Delta t/RC=2$ and is nearly linear at 0.5. **Finite input transition time** helps a lot. Rule: the interpolator output must not be too fast compared with the spacing of what it mixes (L12 slide 35; Palermo 2011 p. 295).

> [!note]- Detail: Weinlader's output waveforms (Palermo L12 slide 36)
> Ideal steps: $V_o(t)=V_{cc}+RI\left[(1-\alpha)u(t)\left(e^{-t/RC}-1\right)+\alpha\,u(t-\Delta t)\left(e^{-(t-\Delta t)/RC}-1\right)\right]$. The crossing time of $V_o$ through mid-swing is the output phase; for $RC\ll\Delta t$ the first term has nearly settled before the second starts, so the crossing snaps to whichever half carries more than half the current. Finite input rise time $\tau_r$ replaces each step by a ramp ($I_{max}t/\tau_r$), which spreads both contributions over time and linearizes the mix. The PI is often built as a replica of the VCO or VCDL delay cell so its edge rate tracks the clock frequency over PVT, but the exponential slew of single-pole buffers leaves residual nonlinearity (Casper §V-C).

### PI circuits

```tikz title="Tail-current-summation (CML) phase interpolator: two differential pairs driven by adjacent phases share one resistive load; current DACs set their tails to (1-a)I and aI. Polarity switches on the inputs extend it to 360 degrees. After Palermo L12 slides 35, 37 (Weinlader, Bulzacchelli) and Casper Fig. 35b."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\scriptsize]
  \draw (0,1.6) node[nmos](a1){}; \draw (2.0,1.6) node[nmos,xscale=-1](a2){};
  \draw (5.0,1.6) node[nmos](b1){}; \draw (7.0,1.6) node[nmos,xscale=-1](b2){};
  \node[left] at (a1.G) {$\Phi_j^+$}; \node[above right] at (a2.G) {$\Phi_j^-$};
  \node[below left] at (b1.G) {$\Phi_{j+1}^+$}; \node[right] at (b2.G) {$\Phi_{j+1}^-$};
  \draw (a1.D) |- (b1.D|-0,3.0) -- (b1.D);
  \draw (a2.D) |- (b2.D|-0,3.4) -- (b2.D);
  \draw (a1.D|-0,3.0) to[R,l=$R_L$] (a1.D|-0,4.6);
  \draw (b2.D|-0,3.4) to[R,l_=$R_L$] (b2.D|-0,4.6);
  \draw (a1.D|-0,4.6) node[above left] {$V_{DD}$} -- (b2.D|-0,4.6);
  \node[circ] at (b2.D|-0,3.4) {}; \node[circ] at (a1.D|-0,3.0) {};
  \draw (b2.D|-0,3.4) -- ++(2.4,0) node[above] {$\Phi_{out}$} to[C,l=$C_L$] ++(0,-1.5) node[ground]{};
  \draw (a1.S) -- (a2.S); \draw (b1.S) -- (b2.S);
  \draw (1.0,0.85) to[I,l=$(1-a)I$] (1.0,-0.6) node[ground]{};
  \draw (6.0,0.85) to[I,l=$aI$] (6.0,-0.6) node[ground]{};
  \draw (1.0,0.85) -- (1.0,1.1); \draw (6.0,0.85) -- (6.0,1.1);
  \node[align=left,anchor=west] at (7.6,-0.2) {tails: thermometer\\current DAC (e.g. 15 cells\\+ 1 fixed, Bulzacchelli)};
\end{circuitikz}
\end{document}
```

| Circuit | How it sums | Notes | Source |
|---|---|---|---|
| **Tail-current summation (CML)** | DAC-weighted tails of pairs sharing a load | polarity control of I/Q gives 360°; step = DAC resolution; a slew-rate DAC on the input buffers keeps linearity across frequency | Bulzacchelli JSSC 2006 (L12 slide 37); Lee 2015 ("two switching quads steering tail currents") |
| **Voltage-mode (inverter)** | parallel tri-state inverters with weighted strengths into one node | a cap on the output node sets the time constant; 64 codes over 360° tracked the ideal line (Joshi) | Joshi VLSI 2009 (L12 slide 38); Casper Fig. 35a |
| **Mixer only, many inputs** | all $N$ phases weighted at once | no glitches (every input always feeds through) but many input devices, lower bandwidth, typically more nonlinear | Casper Fig. 34a |
| **Mux + 2-input mixer** | coarse mux picks adjacent phases, mixer blends | fewer devices, higher bandwidth; **overlap-capacitance feedthrough** makes discrete phase jumps when the de-selected phase switches | Casper Fig. 34b |

For both CML and inverter PIs: "for linearity over a wide frequency range, important to control either input or output time constant (slew rate)" (L12 slides 37–38).

### Codes and monotonicity

- **Thermometer** weights for the mixer (one unit cell changes per step): monotonic, and a step never depends on many cells matching.
- **Quadrant / polarity bits** for 360° (Bulzacchelli's diamond); a coarse mux code on top in mux-based PIs.
- **No binary carries in the phase path.** Wong's binary-weighted CP-mismatch control has its DNL of 1 LSB at the MSB transition, and at counter overflow the loop reverses direction rather than jumping from MSB to LSB (Wong §V).
- **Metrics:** step size and INL (ps) vs code, measured at the operating frequency: the same PI's INL in picoseconds changes with clock frequency (Bulzacchelli's 6 GHz and 2 GHz plots, L12 slide 37).

## Level 5: Forwarded-Clock Deskew

### Skew decorrelates jitter

```tikz title="Data and clock carry the same TX jitter J sin(2 pi f_j t); a clock-to-data skew t_skew shifts one copy, and the sampler sees the difference. The differential jitter grows with f_j t_skew, reaches J at t_skew = 1/(6 f_j) and 2J at half a jitter period. After Palermo L13 slides 8-12; curve computed here."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,x=8cm,y=1.4cm]
  \draw[->] (0,0) -- (0.6,0) node[right] {$f_j\,t_{skew}$};
  \draw[->] (0,0) -- (0,2.4) node[above] {$|J_{diff}|/J$};
  \foreach \y in {1,2} \draw (0,\y) -- (-0.01,\y) node[left] {\y};
  \foreach \x/\l in {0.1667/{1/6},0.5/{1/2}} \draw (\x,0) -- (\x,-0.06) node[below] {\l};
  \draw[thick,blue!70!black,domain=0:0.55,samples=60] plot (\x,{2*abs(sin(180*\x))});
  \draw[dashed] (0,1) -- (0.1667,1) -- (0.1667,0);
  \node[anchor=west,align=left] at (0.2,0.5) {$|J_{diff}|=2J\,|\sin(\pi f_jt_{skew})|$};
\end{circuitikz}
\end{document}
```

$$
\boxed{J_D=J\sin(2\pi f_jt),\quad J_C=J\sin\!\big(2\pi f_j(t-t_{skew})\big)\ \Rightarrow\ |J_{diff}|=2J\,|\sin(\pi f_jt_{skew})|}
$$

- A forwarded clock tracks TX jitter only while $f_jt_{skew}$ is small: with 5 UI of skew at 10 Gb/s, 100 MHz jitter is mostly cancelled, 400 MHz is not (L13 slides 9–11). At $t_{skew}=1/(6f_j)$ the "tracked" jitter is as large as the input.
- So **unlimited tracking bandwidth is not optimal**: low-pass the clock's jitter at a jitter-tracking bandwidth (JTB) matched to the skew. For 10 Gb/s, a controllable JTB of 70–800 MHz is desired (L13 slide 13).
- Other FC limits: driver and loading mismatch, length mismatch, the FC channel's **jitter amplification** of high-frequency jitter (owned by [[Link Noise and Jitter#Level 7 Jitter Amplification by the Channel and Clock Path]]), and the forwarded clock's duty cycle (L13 slide 5).

> [!note]- Derivation: the differential jitter
> $J_D-J_C=J[\sin x-\sin(x-y)]$ with $x=2\pi f_jt$, $y=2\pi f_jt_{skew}$. By $\sin a-\sin b=2\cos\frac{a+b}2\sin\frac{a-b}2$, this is $2J\cos(x-y/2)\sin(y/2)$: a sinusoid of amplitude $2J|\sin(\pi f_jt_{skew})|$. It equals $J$ when $\pi f_jt_{skew}=\pi/6$. Filtering the clock's jitter with a first-order low-pass at the JTB multiplies $J_C$ by $|1/(1+jf_j/JTB)|$ and adds its phase lag, which is how L13 slide 13 picks the JTB that minimizes $|J_{diff}|$ for a given skew.

### Deskew circuits

```tikz title="Forwarded-clock receiver: the forwarded clock is amplified, distributed, turned into multiple phases (DLL, PLL or ILO), and a per-lane PI or ILO phase shift centers the samplers. The CDR controller sets the phase from a phase detector or a BER/margin sweep. After Casper Figs. 3, 32 and Palermo L13 slides 17, 27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[b,minimum width=1.3cm] (amp) at (0,0) {FC amp\\(band-pass?)};
  \node[b,minimum width=1.4cm] (dist) at (2.3,0) {RX clock\\distribution};
  \node[b,minimum width=2.0cm] (gen) at (4.9,0) {phase generator:\\DLL / PLL / ILO};
  \node[b,minimum width=1.2cm] (pi) at (7.4,0) {PI};
  \node[b,minimum width=1.3cm] (smp) at (9.6,0) {samplers};
  \node[b,minimum width=1.6cm] (ctl) at (9.6,-1.7) {CDR controller\\(PD or BER)};
  \draw[<-] (amp.west) -- ++(-0.8,0) node[left] {fwd clk};
  \draw[->] (amp) -- (dist); \draw[->] (dist) -- (gen); \draw[->] (gen) -- node[above] {$\Phi_{1..N}$} (pi);
  \draw[->] (pi) -- node[above] {$\Phi_{out}$} (smp);
  \draw[<-] (smp.north) -- ++(0,0.6) node[above] {data};
  \draw[->] (smp.south) -- (ctl.north);
  \draw[->] (ctl.west) -| node[pos=0.3,below] {sel$\Phi$} (pi.south);
\end{circuitikz}
\end{document}
```

| Phase generator | Jitter transfer from the FC | Pros | Cons | Example |
|---|---|---|---|---|
| **PLL + PI** | low-pass | rejects uncorrelated high-frequency FC jitter; can multiply a sub-rate FC | also rejects *correlated* jitter; VCO accumulation, stability, area | Prete ISSCC 2006 (FB-DIMM) |
| **DLL + PI** | all-pass | passes correlated jitter, no accumulation, inherently stable, simple | passes uncorrelated jitter; delay-line bandwidth amplifies jitter | Balamurugan JSSC 2008 |
| **ILO** | first-order low-pass, bandwidth set by injection strength | no PI: phases come from the oscillator; tunable JTB; very low power | phase drifts with PVT; lock range | Hossain JSSC 2009, Hu JSSC 2010 |
| **Band-pass filter** at the FC input | low-pass with corner $\approx BW/2$ | cuts high-frequency jitter the FC channel amplified | needs high $Q$ for a low JTB | Hollis 2008 |

(L13 slides 17–20; Casper §II-A.) **Phase acquisition** can be BER-based (no extra samplers) or PD-based with extra samplers that are powered on periodically; if the TX clock and data are matched and stable, training at start-up or periodically is enough (L11 slide 13; Casper §II-A).

### Injection-locked deskew

$$
\boxed{\theta_{ss}\approx\sin^{-1}\!\left(\frac{A\,\Delta\omega}{K}\right),\quad A=\frac{2Q}{\omega_0},\quad \omega_P=\sqrt{\frac{K^2}{A^2}-\Delta\omega^2}=\frac{K}{A}\cos\theta_{ss}}\qquad
\boxed{JTF_{in}=\frac{1}{1+s/\omega_P},\quad JTF_{VCO}=\frac{s/\omega_P}{1+s/\omega_P}}
$$

($K$: injection strength, $\Delta\omega$: detuning of the free-running frequency from the injection, $\theta_{ss}$: de-skew phase; Hossain JSSC 2009, L13 slides 30–34.)

- **Phase shift by detuning.** Moving the ILO's free-running frequency (a switched-capacitor bank in a DCO, Shekhar JSSC 2009) rotates its output phase relative to the injected clock, up to ±90° at the edge of lock. That is the PI, for free.
- **The bandwidth shrinks as the phase shift grows** ($\omega_P\propto\cos\theta_{ss}$) and rises with injection strength; a high-$Q$ tank (large $A$) narrows it. Within $\omega_P$ the output phase noise follows the (cleaner) injected clock; above it the ILO's own (L13 slides 31–34).
- **Super-harmonic** injection ($f_{osc}=mf_{inj}$, e.g. a ½-rate TX clock into a ¼-rate RX ILO): low-frequency phase noise better than the injected clock by $m^2$ (L13 slides 35–36).
- **Sub-harmonic** injection lets a low-rate clock be forwarded (less channel jitter amplification), but a clock waveform causes amplitude variation and spurs; a **pulse train** fixes that, and its width and spacing tune the effective injection strength, hence the JTB (Hossain ISSCC 2010, L13 slides 37–40).
- **Drift:** TX and RX ILO free-running frequencies wander with V and T, so the phase drifts; a **low-overhead CDR** on top tracks low-frequency drift while the ILO keeps correlated tracking. Li et al. (VLSI 2014) add a periodically rotating edge sampler (5/4× sub-rate) to center all four eyes: 14 Gb/s at 560 fJ/bit (L13 slides 41–45).

> [!tip] Remark
> Lock range $\omega_L\approx\frac{\omega_0}{2Q}\frac{I_{inj}}{I_{osc}}$ and the phasor picture behind $\theta_{ss}$ are owned by [[Oscillators#Injection locking]].

### Band-pass filtering the forwarded clock

A band-pass filter centered on $f_{clk}$ is a low-pass filter for jitter, with corner at half its bandwidth (L13 slides 47–50):

$$
\boxed{JTF(j2\pi f)=\frac{1}{1+jf/f_c},\qquad f_c=\frac{BW}{2}=\frac{f_{clk}}{2Q}}
$$

For a 5 GHz clock, tuning $Q$ from 3 to 30 sets the JTB from 790 down to 97 MHz; the 70 MHz JTB that 10 UI of skew wants needs even higher $Q$. A passive-inductor filter (Hollis 2008) reached only $Q=2.6$ (L13 slides 52–54).

> [!note]- Derivation: why a band-pass is a jitter low-pass (L13 slides 47–49)
> A clock with small sinusoidal phase modulation, $A\cos(2\pi f_0t+\beta\sin2\pi f_jt)$, has a carrier at $f_0$ and two sidebands of relative size $\beta/2$ at $f_0\pm f_j$. A filter with gains $\alpha_0$, $\alpha_\pm$ at the carrier and sidebands leaves $\beta'=\beta(\alpha_++\alpha_-)/(2\alpha_0)$. For a symmetric band-pass, the gain vs offset from $f_0$ is a low-pass $H(j2\pi\Delta f)=1/(1+j\Delta f/f_c)$ with $f_c=BW/2$, so $\beta'/\beta=1/(1+jf_j/f_c)$.

## Level 6: Clock Distribution

### Why distribution is hard

- **Wires got worse.** Scaling by 0.7× doubles wire resistance; global RC delay grows to 100+ gate delays for a lumped driver, and on-chip global wires have far less bandwidth than chip-to-chip channels (RC vs LC dominated) (L14 slides 5–8).
- **Multi-GHz clocks travel millimeters** when one PLL serves many lanes (Casper §V-B). Lane-to-lane skew is removed by per-bit deskew; **jitter and duty-cycle error** added on the way are not.
- **Each stage filters and adds noise** (Kim ISSCC 2019, L14 slide 10):

$$
\boxed{T_{j,o}=\Big(\big((T_{j,i}\ast JTF_1+PN_1)\ast JTF_2+PN_2\big)\ast\cdots\Big)\ast JTF_N+PN_N}
$$

- **Jitter peaking near $f_{clk}$:** cascaded buffers at 28 GHz amplify jitter strongly, which is why most 112 Gb/s systems use **quarter-rate 14 GHz** clocks (L14 slide 11). Duty-cycle and random-jitter amplification (DCA, RJA) are owned by [[Link Noise and Jitter#The Jitter Impulse Response]].

### Buffer choices

| Option | Jitter mechanism | Power | Notes (Casper §V-B; L14) |
|---|---|---|---|
| **Unregulated CMOS inverters** | delay moves ~1% per 1% of supply | only on transitions | 20 ps buffer, 5–10% supply noise → 1–2 ps per buffer; simple, portable |
| **Regulated inverters / CML on the PLL bias** | delay tracks the timing loop's control | bias generator supports extra buffers | *more* sensitive to the control voltage than an unregulated inverter is to supply; shielding and bandwidth of the control line matter |
| **CML, fixed resistor loads** | $RC$ delay, first-order supply-independent | static current | needs well-controlled resistors |
| **LDO-powered CMOS** | regulator sets the rejection | — | Huawei 60 Gb/s PAM4: ½-rate single-ended 2–16 GHz, shielded wires (LaCroix ISSCC 2019) |
| **Repeaterless on-chip T-line** | almost no buffer delay | reuses the driver's power | 10 GHz sent ~3 mm with an open-drain driver; low swing needs a careful clock receiver |
| **Inductive / active-inductor CML** | narrow-band, peaked | moderate | 28 GHz minimal-length path (Shibasaki 2016); active-inductor loads (Upadhyaya 2016, 2018) |
| **Standing-wave / resonant** | tuned line, shunt inductors set equal amplitude at the taps | recycles energy | MediaTek 56 Gb/s (Ali ISSCC 2019) |

$$
\boxed{\sigma_{t,supply}\approx\sum_i t_{d,i}\cdot\frac{\Delta V_{DD}}{V_{DD}}\quad(\text{CMOS, the 1\%/1\% rule; valid while the chain delay}\ll\text{the noise period})}
$$

- If that supply-induced jitter is **below the CDR bandwidth** it costs nothing; otherwise it comes straight out of timing margin (Casper §V-B).
- **Regulation recipe** (Turker ISSCC 2019, L14 slide 13): a low-bandwidth op amp sets the DC level and low-frequency PSRR, a source follower gives mid-frequency PSRR, and decoupling suppresses high-frequency ripple. The op-amp loop is a linear regulator: its PSRR spec is a jitter spec ([[Operational Amplifiers]], [[Stability]]).
- **Check the network with a jitter impulse response**, not with waveform amplitude: Casper's inverter tree looked fine at 10 GHz on the scope but amplified duty-cycle error by more than 2.3× above 7.5 GHz.

> [!tip] Remark
> CML vs CMOS gate trade-offs, the FO4 limit, CML-to-CMOS converters and the capacitively degenerated CML clock buffer are owned by [[High-Speed Circuit Techniques#Level 0 CML or CMOS]]; this note only uses them.

### Multiphase generation

| Method | Phases from | Correction | Source |
|---|---|---|---|
| ÷2 of a 2× VCO | master-slave latches | input duty cycle = quadrature error | [[Oscillators#Quadrature clocks]] |
| Local DLL | delay line locked to one period (or ½, then duty-cycle sensitive) | stage matching; 4 vs 6 stages per 180° sets jitter amplification | L12 slide 39; Casper §V-C |
| Low-complexity inverter QDLL | ¼-rate phases from a differential clock | — | IBM 100 Gb/s PAM4 (Cevrero ISSCC 2019) |
| Injection-locked ring | 8 phases from an injected differential clock | coarse frequency-tracking loop guarantees lock; fine quadrature-locked loop trims phase error | Chen ISSCC 2018 (L14 slide 22) |
| Quadrature DLL + QEC | 4 phases, capacitor-DAC delay cells, foreground calibrated | QEC | Won 2024 ([[SerDes Learning Path#Won 2024 Dual-Mode Transmitter]]) |

### Duty-cycle and quadrature correction

```tikz title="Clock error calibration loop for a quarter-rate TX: a 2-stage duty-cycle corrector (current injection) and a 4-stage quadrature error corrector (capacitor DAC) with cross-coupled buffers, both trimmed by an FSM that reads duty-cycle (DCD) and quadrature (QED) error detectors at the final clock. After Kim ISSCC 2019, Palermo L14 slides 25-26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.85cm,align=center,fill=white}]
  \node[b,minimum width=1.3cm] (iq) at (0,0) {IQ gen\\($\div2$)};
  \node[b,minimum width=1.6cm] (dcc) at (2.3,0) {DCC\\(current inj.)};
  \node[b,minimum width=1.6cm] (qec) at (4.7,0) {QEC\\(C-DAC)};
  \node[b,minimum width=1.4cm] (buf) at (7.0,0) {buffers\\fan-out};
  \node[b,minimum width=1.6cm] (mux) at (9.4,0) {4:1 MUX /\\pulse gen};
  \node[b,minimum width=1.5cm] (det) at (9.4,-1.9) {DCD / QED\\detector};
  \node[b,minimum width=1.1cm] (fsm) at (5.9,-1.9) {FSM};
  \draw[<-] (iq.west) -- ++(-0.8,0) node[left,align=right] {14 GHz\\LC-PLL};
  \draw[->] (iq) -- node[above] {4} (dcc); \draw[->] (dcc) -- node[above] {4} (qec);
  \draw[->] (qec) -- node[above] {4} (buf); \draw[->] (buf) -- (mux);
  \draw[->] (mux) -- (det); \draw[->] (det) -- (fsm);
  \draw[->] (fsm.west) -| node[pos=0.25,below] {coarse/fine} (dcc.south);
  \draw[->] (fsm.north) -- ++(0,0.4) -| (qec.south);
\end{circuitikz}
\end{document}
```

**Detecting the error:**

- **Asynchronous sampling** (Kim ISSCC 2019, L14 slide 26): an unrelated VCO samples the final ¼-rate clocks. Duty cycle is correct when a clock is sampled high as often as low (equal P/N counts); quadrature is correct when the counts of $IP\cdot QP$ and $QP\cdot IN$ are equal. No precise timing reference is needed, only counters.
- **Low-pass filtering** a clock gives its duty cycle; **IQ mismatch** shows up as the duty cycle of a replica MUX output, which then trims independent I/Q VCDLs (background calibration, L14 slide 27).

**Correcting it:**

| Knob | How | Source |
|---|---|---|
| Current injection into buffers | shifts edges of one polarity | Toprak-Deniz ISSCC 2018; Kim ISSCC 2019 |
| Differential offset in the half-rate CML divider | moves the ÷2 switching points, i.e. IQ spacing | Toprak-Deniz ISSCC 2018 (L14 slide 28) |
| Capacitor DAC on a buffer node | adds delay to one phase | Kim ISSCC 2019; Won 2024 |
| Inverter trip-point shift | AC-coupled inverter self-biased by $R_{DC}$; injected $I_{DC}$ moves the trip point; diodes make it monotonic; $R_{DC}$ sets the range | Menolfi ISSCC 2018 (L14 slide 29) |
| Injection-locked slave oscillator | low-pass action evens out duty cycle | Hsieh Fig. 11 (Ng 2003) |

- Correct **close to the samplers**, after the last stages that can add error, and detect at the final clock (Kim detects after the 4:1 MUX).
- Residual DCC/QEC error is a static phase offset per sub-rate lane; it should be well below one PI step.

### The effect at the end of the chain

Kim's 14 GHz quadrature distribution (L14 slide 12): PLL output phase noise is multiplied by the distribution's JTF; the untracked TX jitter is that spectrum high-passed by the CDR: **208 fs rms with a 3 MHz CDR, 185 fs with 10 MHz**. The same logic gives Palermo's 365 fs → 157 fs for his 14 GHz PLL ([[Phased-Locked Loops#Choosing the loop bandwidth]]).

## How the Papers Do It

### Razavi 2002 phase detectors and acquisition

```tikz title="Razavi 2002 CDR architectures. (a) Referenceless: a frequency detector loop (II) pulls the VCO, then the phase-detector loop (I) locks; FLL bandwidth << PLL bandwidth. (b) Sequential locking: a PFD loop locks the VCO to N f_REF, then a lock detector hands control to the data PD. Redrawn from Figs. 6a and 7b."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.7cm,minimum width=0.9cm,align=center,fill=white}]
  \node[font=\small\bfseries] at (2.2,2.2) {(a) referenceless};
  \node[b] (pd) at (0,1.2) {PD}; \node[b] (fd) at (0,0) {FD};
  \node[b] (lpf) at (2.0,0.6) {LPF}; \node[b] (vco) at (3.8,0.6) {VCO};
  \draw[<-] (pd.west) -- ++(-0.6,0) node[left] {$D_{in}$}; \draw[<-] (fd.west) -- ++(-0.6,0) node[left] {$D_{in}$};
  \draw[->] (pd.east) -- node[above] {I} (lpf.west); \draw[->] (fd.east) -- node[below] {II} (lpf.west);
  \draw[->] (lpf) -- (vco);
  \draw[->] (vco.east) -- ++(0.4,0) |- (0,-0.9) -- (fd.south);
  \draw[->] (vco.east) -- ++(0.4,0) |- (0,2.0) -- (pd.north);
  \begin{scope}[xshift=7.8cm]
    \node[font=\small\bfseries] at (2.2,2.2) {(b) sequential locking};
    \node[b] (pd2) at (0,1.2) {PD}; \node[b] (pfd) at (0,0) {PFD};
    \node[b] (cp) at (1.8,0.6) {CP}; \node[b] (lf2) at (3.2,0.6) {LPF}; \node[b] (v2) at (4.6,0.6) {VCO};
    \node[b] (ld) at (1.8,-0.9) {lock\\det.}; \node[b] (dv) at (4.6,-0.9) {$\div N$};
    \draw[<-] (pd2.west) -- ++(-0.6,0) node[left] {$D_{in}$}; \draw[<-] (pfd.west) -- ++(-0.6,0) node[left] {$f_{REF}$};
    \draw[->] (pd2.east) -- node[above] {I} (cp.west); \draw[->] (pfd.east) -- node[below] {II} (cp.west);
    \draw[->] (cp) -- (lf2); \draw[->] (lf2) -- (v2); \draw[->] (v2) -- (dv); \draw[->] (dv) -- node[above] {$f_B$} (ld);
    \draw[->] (ld.west) -| (pfd.south);
    \draw[->] (v2.east) -- ++(0.3,0) |- (0,2.0) -- (pd2.north);
  \end{scope}
\end{circuitikz}
\end{document}
```

**How it works:** the article builds a CDR from requirements. A retimer needs a clock at the data rate, centered, with low jitter. A flip-flop PD clocked by the data fails (ripple, $2\Delta T$ skew, feedthrough), so the PD must sample the data with the clock and retime internally. That requires edge detection (flip-flop + XOR) and a reference pulse (Hogge), or three-point sampling (Alexander). Half-rate versions use both clock edges or I/Q clocks. The architectures then add frequency acquisition: an FD loop with a much narrower bandwidth than the PD loop, coarse/fine VCO control because low-voltage VCOs have high gain, a replica VCO locked to $Nf_{REF}$ (mismatch and 5–10 ppm pulling issues), or sequential locking with a lock detector (switch-over glitch issue).

Used in: [[#Why a PLL detector fails on data]], [[#Hogge linear, with a reference pulse]], [[#Half-rate linear detector]], [[#Alexander bang-bang from three samples]], [[#Frequency acquisition]].

### Hsieh 2008 a map of CDR architectures

```tikz title="Hsieh and Sobelman's classification of CDR architectures by how the clock phase follows the data. Redrawn from Sec. II and Table 1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.7cm,align=center,fill=white,rounded corners=2pt}]
  \node[b,minimum width=2.2cm] (root) at (6.2,2.4) {CDR architectures};
  \node[b,minimum width=3.2cm,fill=blue!8] (fb) at (1.4,1.0) {feedback phase tracking\\(continuous mode)};
  \node[b,minimum width=2.4cm,fill=green!8] (os) at (7.2,1.0) {oversampling\\(no feedback)};
  \node[b,minimum width=3.2cm,fill=orange!10] (pa) at (11.4,1.0) {phase alignment, no feedback\\(burst mode)};
  \draw[->] (root) -- (fb); \draw[->] (root) -- (os); \draw[->] (root) -- (pa);
  \foreach \n/\x in {{PLL (analog,\\digital)}/-1.5,{DLL,\\PLL/DLL}/0.4,{phase\\interp.}/2.3,{injection-\\locked}/4.2} {
    \node[b,minimum width=1.6cm] at (\x,-0.5) {\n};
    \draw[->] (fb.south) -- (\x,-0.0);
  }
  \node[b,minimum width=1.8cm] at (7.2,-0.5) {$\ge3\times$ blind,\\FIFO + select};
  \draw[->] (os) -- (7.2,-0.0);
  \node[b,minimum width=1.6cm] at (10.4,-0.5) {gated\\VCO};
  \node[b,minimum width=1.6cm] at (12.4,-0.5) {high-Q\\BPF};
  \draw[->] (pa.south) -- (10.4,-0.0); \draw[->] (pa.south) -- (12.4,-0.0);
\end{circuitikz}
\end{document}
```

**How it works:** a survey, not a chip. It sorts CDRs by whether and how the clock phase is fed back, walks through each structure (PLL without/with reference, DPLL, DLL, PLL/DLL, PI, injection-locked, oversampling, gated oscillator, high-Q filter), and ends with Table 1 of advantages, disadvantages and applications. Its rules of thumb: PLL-based CDRs reject input jitter but peak; DLL-based ones cannot follow a frequency offset; PI-based ones have no peaking if latency is small but quantize; burst-mode systems use feed-forward recovery.

Used in: [[#Frequency acquisition]], [[#Digital PLL CDR]], [[#Dual-loop CDR with phase interpolators]], [[#DLL-based and combined PLL/DLL CDRs]], [[#Oversampling (blind) CDR]], [[#Choosing an architecture]].

### Mansuri 2002 PLL jitter vs loop parameters

```tikz title="Mansuri and Yang's PLL noise model: input-clock noise is low-passed, VCO noise is high-passed, and clock-buffer noise (inside the feedback, after the VCO) is high-passed too. Redrawn from Figs. 1-2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[b,minimum width=1.3cm] (in) at (0,0) {input clock};
  \node[b,minimum width=1.1cm] (pd) at (2.2,0) {PD\\$K_{PD}$};
  \node[b,minimum width=1.4cm] (cp) at (4.3,0) {CP + $R$, $C$};
  \node[b,minimum width=1.4cm] (vco) at (6.6,0) {VCO\\$K_{VCO}/s$};
  \node[b,minimum width=1.4cm] (buf) at (8.9,0) {clock\\buffer};
  \draw[->] (in) -- (pd); \draw[->] (pd) -- (cp); \draw[->] (cp) -- (vco); \draw[->] (vco) -- (buf);
  \draw[->] (buf) -- (10.6,0) node[right] {$\phi_{out}$};
  \draw[->] (10.1,0) -- (10.1,-1.2) -| node[pos=0.25,below] {$\div N$ ($N=1$ for a CDR)} (pd.south);
  \node[red!70!black,align=center] at (0,1.05) {$\phi_{n,in}$:\\low-pass};
  \node[red!70!black,align=center] at (6.6,1.05) {$\phi_{n,VCO}$:\\high-pass};
  \node[red!70!black,align=center] at (8.9,1.05) {$\phi_{n,buf}$:\\high-pass};
\end{circuitikz}
\end{document}
```

**How it works:** it computes the rms jitter at the PLL output from each source's phase-noise PSD times its noise transfer function, for second- and third-order loops with loop delay, and checks it on a 0.25 µm PLL whose charge-pump currents (hence $\omega_n$ and $\zeta$) are digitally adjustable. Results relevant to link clocking:

- VCO-limited long-term jitter is $\kappa\sqrt{1/(2\zeta\omega_n)}$: it falls as $1/\sqrt{f_{-3dB}}$, and for $\zeta>2$ it no longer depends on $\zeta$ (Figs. 3–4).
- With the third pole and loop delay, **minimum jitter is at 30–45° phase margin**, and the minimum is flat (Fig. 5, Eq. 8).
- **Buffer noise inside the loop counts like VCO noise**: with $\omega_n=0.2f_{osc}$ and $\zeta=1$, an $m$-stage buffer adds less than an $n$-stage ring VCO of the same cells only if $m<5n$ (Eq. 10). Clock distribution inside a PLL's feedback is therefore part of the VCO noise budget.
- To pass under 0.1 of a noisy input clock's jitter at $\Delta T>100$ cycles, use $\zeta>2$ and bandwidth below 0.002% of the operating frequency (Fig. 8).

The loop-design consequences are owned by [[Phased-Locked Loops#VCO-limited jitter]] and [[Phased-Locked Loops#Design procedure]].

### Casper 2009 forwarded vs embedded clock circuits

```tikz title="Casper and O'Mahony's three receiver clocking circuits. (a) Forwarded clock: phase generator + PI under a CDR controller. (b) PI-based embedded clock: the same with a reference clock and a bang-bang PD. (c) VCO-based embedded clock: the RX samplers are the PD of a per-lane PLL. Redrawn from Figs. 32, 36, 39."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.65cm,minimum width=1.0cm,align=center,fill=white}]
  \foreach \xo/\t/\src/\pd in {0/{(a) forwarded}/{fwclk}/{CDR ctl},5.0/{(b) PI-based EC}/{refclk}/{!!PD, filt.}} {
    \begin{scope}[xshift=\xo cm]
      \node[font=\small\bfseries] at (1.6,2.6) {\t};
      \node[b] (s) at (0.6,1.6) {DQ}; \node[b] (c) at (2.8,1.6) {\pd};
      \node[b] (p) at (0.6,0.5) {PI}; \node[b] (g) at (0.6,-0.6) {$\Phi$ gen};
      \draw[<-] (s.west) -- ++(-0.5,0) node[left] {$D_{in}$};
      \draw[->] (s) -- (c); \draw[->] (c.south) |- node[pos=0.7,above] {sel$\Phi$} (p.east);
      \draw[->] (p) -- (s); \draw[->] (g) -- node[right] {$\Phi_{1..N}$} (p);
      \draw[<-] (g.west) -- ++(-0.5,0) node[left] {\src};
    \end{scope}
  }
  \begin{scope}[xshift=10.2cm]
    \node[font=\small\bfseries] at (1.6,2.6) {(c) VCO-based EC};
    \node[b] (s) at (0.6,1.6) {DQ}; \node[b] (c) at (2.8,1.6) {PD, filt.};
    \node[b] (v) at (0.6,0.2) {VCO};
    \draw[<-] (s.west) -- ++(-0.5,0) node[left] {$D_{in}$};
    \draw[->] (s) -- (c); \draw[->] (c.south) |- (v.east); \draw[->] (v) -- (s);
    \node[align=left,anchor=west] at (1.4,-0.6) {no reference:\\needs FD for capture};
  \end{scope}
\end{circuitikz}
\end{document}
```

**How it works:** a tutorial from Intel's link group that treats clocking as a system. Forwarded-clock RXs use a DLL (all-pass, may amplify FC jitter) or a PLL (low-pass, may reject correlated jitter) to make phases, and a PI to place them, trained periodically or continuously. PI-based embedded RXs share the PLL/DLL across lanes and run a bang-bang PD with a digital filter; their frequency tolerance is $\alpha_d\Delta T/(DF\,T_{SCK})$. VCO-based RXs avoid PI artifacts but cost a loop filter per lane and risk inter-lane injection locking. It also gives the clock-distribution rules (1%/1% supply sensitivity, jitter impulse response, DCA/RJA, DLL stage count) and the PI circuit trade-offs (mux vs mixer, edge-rate sensitivity).

Used in: [[#Three I/O clocking architectures]], [[#Sharing PLLs between TX and RX]], [[#Slew-rate limiting, frequency tolerance and JTOL]], [[#PI circuits]], [[#Buffer choices]]; the jitter analysis is in [[Link Noise and Jitter]].

### Wong 2004 a CDR with no phase interpolator

```tikz title="Wong et al. 2004 data-recovery circuit: a x4 charge-pump PLL (shared with the TX) whose charge pump has a 7-bit digitally controlled current mismatch. The mismatch is a static phase offset, used on purpose to place the clock; a bang-bang PD with downsampling and an up/down counter sets it. A switched-capacitor filter notches the 450 MHz ripple. Redrawn from Figs. 18-20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[b,minimum width=1.0cm] (pfd) at (0,0) {PFD};
  \node[b,minimum width=1.9cm,fill=orange!10] (cp) at (2.2,0) {CP with 7-bit\\$\Delta I$ (mismatch)};
  \node[b,minimum width=1.4cm] (sc) at (4.6,0) {SC loop filter\\(450 MHz notch)};
  \node[b,minimum width=1.2cm] (vco) at (6.8,0) {VCO\\1.8 GHz};
  \node[b,minimum width=1.0cm] (div) at (4.6,-1.5) {$\div4$};
  \draw[<-] (pfd.west) -- ++(-0.7,0) node[left,align=right] {450 MHz\\ref};
  \draw[->] (pfd) -- (cp); \draw[->] (cp) -- (sc); \draw[->] (sc) -- (vco);
  \draw[->] (vco.south) |- (div.east); \draw[->] (div.west) -| (pfd.south);
  \draw[->] (vco.east) -- ++(0.9,0) node[right,align=left] {4 phases to TX\\or RX samplers};
  \node[b,minimum width=1.8cm] (smp) at (6.8,1.7) {2 data + 2 edge\\samplers};
  \node[b,minimum width=1.6cm] (bb) at (4.3,1.7) {BB PD,\\downsample};
  \node[b,minimum width=1.2cm] (cnt) at (2.2,1.7) {up/down\\counter};
  \draw[->] (vco.north) -- (smp.south);
  \draw[->] (smp) -- (bb); \draw[->] (bb) -- (cnt); \draw[->] (cnt) -- (cp);
  \draw[<-] (smp.north) -- ++(0,0.5) node[above] {3.6 Gb/s data};
\end{circuitikz}
\end{document}
```

**How it works:** the primary loop is a ×4 PLL from a 450 MHz reference; in receive mode a secondary bang-bang loop adds a controlled current mismatch to the charge pump, and the PLL settles with a static phase offset equal to the desired clock shift ([[Phased-Locked Loops#Current mismatch becomes static phase offset]], used on purpose). About ¼ of the pull-down source is replaced by binary-weighted sources: a 25% mismatch shifts one bit time (278 ps) at 450 MHz, so slightly more than 25% gives full range. Seven bits give a 6 ps LSB and 350 ps range, constant across corners because it is a ratio. The PD's up/down signals are downsampled before a low-power counter, which sets the loop "bandwidth" (nominally 1/16 of the data rate). Measured: DNL of 1 LSB at the MSB transition, 22 ps pp dither (3 LSB), under 3 ps extra pp jitter across the range thanks to the SC notch. No PI, low power and area.

Used in: [[#Sharing PLLs between TX and RX]], [[#Dither the limit cycle in lock]], [[#Codes and monotonicity]].

### Lee 2015 linear CDRs at 56 Gb/s

```tikz title="Lee et al. 2015. Top: PAM4 RX CDR: the PAM4 input limited at the middle threshold gives transitions, which are mixed with the 28 GHz VCO into a DC phase error (V/I, loop filter); a frequency loop shuts off on lock. Bottom: NRZ RX: a static divide-by-2 on the data splits transitions into two slower streams, two XORs make pulses, and a 3-input mixer with the full-rate clock is the PD. Redrawn from Figs. 7, 12, 13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,b/.style={draw,thick,minimum height=0.75cm,align=center,fill=white}]
  \node[font=\small\bfseries,anchor=west] at (-1.2,2.1) {PAM4 (28 GBd, half-rate 28 GHz clock)};
  \node[b,minimum width=1.3cm] (lim) at (0,1.2) {limit at\\mid level};
  \node[b,minimum width=1.3cm] (xo) at (2.1,1.2) {transition\\pulses};
  \node[b,minimum width=1.0cm] (mx) at (4.1,1.2) {mixer};
  \node[b,minimum width=1.2cm] (vi) at (6.0,1.2) {V/I + LF};
  \node[b,minimum width=1.1cm] (vco) at (8.0,1.2) {28 GHz\\VCO};
  \draw[<-] (lim.west) -- ++(-0.6,0) node[left] {$V_H$};
  \draw[->] (lim) -- (xo); \draw[->] (xo) -- (mx); \draw[->] (mx) -- (vi); \draw[->] (vi) -- (vco);
  \draw[->] (vco.south) -- ++(0,-0.35) -| (mx.south);
  \node[anchor=west] at (9.0,1.2) {central 1/4, side 1/8 each};
  \node[font=\small\bfseries,anchor=west] at (-1.2,-0.2) {NRZ (56 Gb/s, full-rate 56 GHz clock)};
  \node[b,minimum width=1.3cm] (d2) at (0,-1.2) {static $\div2$\\on data};
  \node[b,minimum width=1.0cm] (x1) at (2.1,-0.75) {XOR};
  \node[b,minimum width=1.0cm] (x2) at (2.1,-1.65) {XOR};
  \node[b,minimum width=1.4cm] (m3) at (4.1,-1.2) {3-input\\mixer};
  \node[b,minimum width=1.2cm] (lf2) at (6.0,-1.2) {V/I + LF};
  \node[b,minimum width=1.1cm] (v2) at (8.0,-1.2) {56 GHz\\VCO};
  \draw[<-] (d2.west) -- ++(-0.6,0) node[left] {data};
  \draw[->] (d2.east) -- (x1.west); \draw[->] (d2.east) -- (x2.west);
  \draw[->] (x1) -- (m3); \draw[->] (x2) -- (m3); \draw[->] (m3) -- (lf2); \draw[->] (lf2) -- (v2);
  \draw[->] (v2.south) -- ++(0,-0.35) -| (m3.south);
  \node[anchor=west,align=left] at (9.0,-1.2) {1:8 DEMUX with\\3 PIs to align sub-rate clocks};
\end{circuitikz}
\end{document}
```

**How it works:** both receivers use **purely linear, mixer-based CDRs** because pulse-based detectors (Hogge) and flip-flop-based bang-bang detectors cannot run at 56 Gb/s in 40–65 nm CMOS. For PAM4, limiting at the middle threshold reduces the three crossings to a binary transition stream whose central and side crossovers average out in the loop; the clock lands in the eye center. For NRZ, a ÷2 on the data gives each XOR two UIs to make a pulse and a vernier half-bit delay replaces the explicit delay line. Both include a frequency-acquisition loop that switches off after lock. The NRZ TX uses a linear phase aligner (mixer + 28 GHz PI + mixer) to retime the two 28 Gb/s streams before the final 2:1 selector, because PVT drift (15–20 ps) exceeds the 8–10 ps sampling window. Measured: PAM4 recovered clock 281 fs rms (532 fs from 100 Hz to 1 GHz in phase noise), range 54.1–56.8 Gb/s; NRZ 55–56.5 Gb/s. No jitter tolerance could be measured.

Used in: [[#Mixer-based linear detector]], [[#PAM4 detectors]], [[#Analog bang-bang loops]], [[#PI circuits]].

### Zhang 2016 PAM4 timing recovery

```tikz title="Zhang et al. (DesignCon 2016): a 2x-oversampled bang-bang CDR samples data at the eye center (in-phase clock) and at the crossing (quadrature clock); a baud-rate CDR uses only the in-phase samples plus error slicers and locks where h(-1) = h(+1). Redrawn from slides 43, 48."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \foreach \xo/\t in {0/{2$\times$ oversampled (BB)},6.4/{baud rate (MM)}} {
    \begin{scope}[xshift=\xo cm]
      \node[font=\small\bfseries] at (2.2,2.0) {\t};
      \draw[thick] (0,1.2) .. controls (1.0,1.2) and (1.2,-1.2) .. (2.2,-1.2) .. controls (3.2,-1.2) and (3.4,1.2) .. (4.4,1.2);
      \draw[thick] (0,-1.2) .. controls (1.0,-1.2) and (1.2,1.2) .. (2.2,1.2) .. controls (3.2,1.2) and (3.4,-1.2) .. (4.4,-1.2);
      \draw[dashed] (0,0) -- (4.4,0);
    \end{scope}
  }
  \foreach \x in {0,2.2,4.4} \draw[blue!70!black,thick,->] (\x,-1.7) -- (\x,-1.3);
  \foreach \x in {1.1,3.3} \draw[red!70!black,thick,->] (\x,-1.7) -- (\x,-1.3);
  \node[align=center] at (2.2,-2.3) {{\color{blue!70!black}I: data}\quad {\color{red!70!black}Q: edge}};
  \foreach \x in {6.4,8.6,10.8} \draw[blue!70!black,thick,->] (\x,-1.7) -- (\x,-1.3);
  \node[align=center] at (8.6,-2.3) {one phase: data + error samplers};
\end{circuitikz}
\end{document}
```

**How it works:** a system tutorial. It contrasts the 2× oversampled bang-bang CDR (eye-centered, two clock phases) with baud-rate CDRs (one phase, lower power, but no guarantee of the eye center). For PAM4 it counts transition density (75%), shows that the three crossings have different spreads, and gives the selected-transition logic for a 2× BB CDR (use, e.g., only $+3\leftrightarrow$ middle transitions, comparing the edge sample with $2h_0$). For baud-rate it defines SS-MMSE (minimize squared error with sign-only error and slope) and Mueller-Muller, and simulates an MM CDR in a quarter-rate 40 Gb/s system with 64 PI codes per symbol tracking SJ from 0.1 UI at 10 MHz up to 6 UI at 50 kHz.

Used in: [[#Baud-rate Mueller-Muller]], [[#PAM4 detectors]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Forwarded instead of embedded clock | tracks correlated TX jitter up to hundreds of MHz; no edge samplers needed for periodic deskew | extra lane, clock RX amp; skew turns tracked jitter into differential jitter; FC channel amplifies jitter |
| Wider CDR bandwidth | JTOL, tracks more PLL/ref jitter | jitter transfer mask, passes more input noise; limited by latency (digital) |
| Bang-bang instead of linear PD | simple, digital, high speed, self-retiming | nonlinear (gain set by jitter), dither, double samplers |
| Baud-rate (MM) PD | one clock phase, lower power, suits ADC RX | lock point $h_{-1}=h_{+1}$ not eye center; couples to EQ |
| Dual loop instead of single loop | separate CDR and PLL bandwidths, shared PLL, unlimited phase range | PI power/area, quantization, multiphase distribution |
| Smaller PI step $\Delta T$ | less quantization and dither | less frequency tolerance and slew (or faster updates) |
| Faster updates / less latency | slew, frequency tolerance, dither, no peaking | digital power, pipelining effort |
| Decimation $DF$ | lower-rate, cheaper logic | slew and frequency tolerance fall by $DF$ |
| Integral path | holds ppm offset and SSC without standing error | second-order loop, possible peaking |
| More interpolator input phases (45° vs 90°) | linear weighting accurate (0.46° vs 4.1°), small amplitude dip | more phases to generate and distribute |
| Slower PI output ($RC\gtrsim\Delta t$) | linear mixing | needs slew control vs frequency; must still pass $f_{clk}$ |
| DLL vs PLL phase generator (FC) | DLL: all-pass, stable, no accumulation | DLL passes uncorrelated jitter; PLL filters correlated jitter too |
| ILO deskew | no PI, tunable JTB, low power | bandwidth falls with phase shift; drift needs a slow CDR |
| CML or regulated distribution | supply-insensitive delay | static power, regulator design |
| Quarter-rate clocks | avoid jitter peaking of buffers near 28 GHz; CMOS-friendly | 4 phases to generate, DCC + QEC mandatory |

## Cheat sheet

| Result | Equation |
|---|---|
| Linear CDR loop | $K_P=I_CR,\ K_i=I_C/C,\ \omega_n=\sqrt{K_iK_{PD}K_{VCO}},\ \zeta=\frac{K_P}{K_i}\frac{\omega_n}{2}$ |
| Components from $\omega_n$, $\zeta$ | $C=I_CK_{PD}K_{VCO}/\omega_n^2,\ R=2\zeta/(\omega_nC)$ |
| Hogge gain | $K_{PD}=TD/\pi$, $\phi_e=\phi_{in}-\phi_{clk}-\pi$ |
| Bang-bang linearized gain | $K_{PD}\approx2TD/J_{pp}$ (uniform), $\approx0.8\,TD/\sigma_\phi$ (Gaussian) |
| Mueller-Muller | $\hat e=E[y_kd_{k-1}]-E[y_kd_{k+1}]\propto h_{+1}-h_{-1}$; lock at $h_{-1}=h_{+1}$ |
| PAM4 transition density | $TD=12/16=75\%$ (NRZ 50%) |
| BB frequency tolerance / slew | $s_{max}=|\Delta f/f|_{max}=\alpha_d\Delta T/(DF\cdot T_{SCK})$ |
| BB dither | $J_{dither,pp}=(2D+1)\Delta T$, period $2(2D+1)$ updates |
| BB jitter tolerance | $JTOL_{pp}\approx(s_{max}-|\Delta f/f|)/(\pi fT_b)+TM$ |
| Sinusoidal PI | $Y=\cos\phi X_I+\sin\phi X_Q$, $a_1^2+a_2^2=1$ |
| Linear PI | $a_1+a_2=1$, $\phi(a)=\tan^{-1}\frac{a\sin\theta}{(1-a)+a\cos\theta}$; error 4.1° ($\theta=90°$), 0.46° ($45°$) |
| PI time constant | $\Delta t/RC\lesssim1$ |
| PI sizing | $\tau_{PI}=R_LC_L\gtrsim\Delta t$, $I_{tail}=V_{sw}/R_L$ |
| Forwarded-clock skew | $|J_{diff}|=2J|\sin(\pi f_jt_{skew})|$; $=J$ at $t_{skew}=1/(6f_j)$ |
| ILO deskew | $\theta_{ss}\approx\sin^{-1}(A\Delta\omega/K)$, $A=2Q/\omega_0$, $\omega_P=\sqrt{K^2/A^2-\Delta\omega^2}$ |
| ILO jitter transfer | $JTF_{in}=1/(1+s/\omega_P)$, $JTF_{VCO}=(s/\omega_P)/(1+s/\omega_P)$ |
| Band-pass FC filter | $JTF=1/(1+jf/f_c)$, $f_c=BW/2=f_{clk}/(2Q)$ |
| Cascaded clock buffers | $T_{j,o}=(\cdots(T_{j,i}\ast JTF_1+PN_1)\ast\cdots)\ast JTF_N+PN_N$ |
| Supply-induced buffer jitter | $\sigma_t\approx\sum t_{d,i}\,\Delta V_{DD}/V_{DD}$ (1%/1% rule) |
| PI current-cell matching | $\sigma(\Delta I/I)^2\approx(g_m/I_D)^2\sigma_{V_{TH}}^2+\sigma_\beta^2$ |

## References

- **Palermo, ECEN 720 Lecture 11, "Clocking Architectures & PLLs"** (`ref/SerDes/lecture11_ee720_clocking_arch_plls.pdf`): slides 6–18 (terminology, common/forwarded/embedded architectures, Xilinx transceiver), 24 (PLL design challenges, Turker table), 33 (CDR high-pass model). PLL slides 25–112 used only via [[Phased-Locked Loops]].
- **Palermo, ECEN 720 Lecture 12, "CDRs"** (`lecture12_ee720_cdrs.pdf`): slides 5–6 (overview), 8–19 (Hogge, Alexander, linearized BB, Mueller-Muller, Spagna), 21–25 (linear model, Roshan-Zamir PAM4 CDR), 27–30 (single-loop issues, dual-loop, local DLL, phase-rotator PLL), 32–41 (PIs, Weinlader model, Bulzacchelli, Joshi, DLL), 43–51 (jitter properties, used only via [[Link Noise and Jitter]]).
- **Palermo, ECEN 720 Lecture 13, "Forwarded Clock Deskew Circuits"** (`lecture13_ee720_fwd_clk_deskew.pdf`): slides 4–13 (FC limits, skew vs differential jitter, JTB), 14–16 (JIR/JTF, via [[Link Noise and Jitter]]), 17–20 (PLL/PI vs DLL/PI), 21–26 (ILO lock range, via [[Oscillators]]), 27–45 (ILO deskew, jitter transfer, super/sub-harmonic, drift, Li 2014), 46–54 (band-pass jitter filtering).
- **Palermo, ECEN 720 Lecture 14, "Clock Distribution Techniques"** (`lecture14_ee720_clk_distribution.pdf`): slides 4–17 (wire scaling, cascaded JTF, Kim 14 GHz distribution, regulation, distribution examples), 19–20 (CML2CMOS, via [[High-Speed Circuit Techniques]]), 22–23 (multiphase generation), 25–29 (DCC/QEC detection and correction).
- **Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems," 2011 chapter** (`serial_links_chapter_palermo_2011.pdf`): pp. 292–296 (PLL-based and dual-loop CDRs, Figs. 9.8–9.10), pp. 309–310 (feedback interpolation, ILO receivers, Fig. 9.23).
- **B. Razavi, "Challenges in the Design of High-Speed Clock and Data Recovery Circuits," IEEE Commun. Mag., Aug. 2002** (`cdr_challenges_Razavi_comm_2002.pdf`): all sections, Figs. 1–7.
- **M.-t. Hsieh and G. E. Sobelman, "Architectures for Multi-Gigabit Wire-Linked Clock and Data Recovery," IEEE CAS Mag., 2008** (`cdr_comparisons_hsieh_cas_2008.pdf`): §II A–H (Figs. 2–14), §III and Table 1.
- **M. Mansuri and C.-K. K. Yang, "Jitter Optimization Based on Phase-Locked Loop Design Parameters," JSSC 37(11), 2002** (`jitter_optimization_pll_mansuri_jssc_2002.pdf`): §II–III, Eqs. 3–10, Figs. 1–8.
- **B. Casper and F. O'Mahony, "Clocking Analysis, Implementation and Measurement Techniques for High-Speed Data Links—A Tutorial," TCAS-I 56(1), 2009** (`clocking_analysis_hs_links_casper_tcas1_2009.pdf`): §II (Figs. 2–6), §V-B (clock distribution, Figs. 30–31), §V-C (clock recovery, Figs. 32–40). §III–IV used only via [[Link Noise and Jitter]].
- **K.-L. J. Wong et al., "A 27-mW 3.6-Gb/s I/O Transceiver," JSSC 39(4), 2004** (`voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`): §V (Figs. 18–22) and §VI measurements.
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," JSSC 50(9), 2015** (`56G_NRZPAM4_J.pdf`): §III-B (PAM4 linear CDR), §IV-A (phase aligner), §IV-B (NRZ RX, ÷2 PD, PIs, why not bang-bang), §V (measurements).
- **G. Zhang et al., "PAM4 Signaling for 56G Serial Link Applications—A Tutorial," DesignCon 2016** (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`): slides 43–50.
- Owner notes linked instead of re-derived: [[Phased-Locked Loops]] (loop theory, DLL, CP mismatch, Mansuri's loop results), [[Oscillators]] (VCOs, ÷2 quadrature, injection locking), [[Link Noise and Jitter]] (JTOL/JTF masks, jitter amplification, FC vs EC numbers), [[High-Speed Circuit Techniques]] (CML vs CMOS, CML2CMOS), [[Comparators]] (samplers, metastability), [[Equalization]], [[Signaling and BER]].
