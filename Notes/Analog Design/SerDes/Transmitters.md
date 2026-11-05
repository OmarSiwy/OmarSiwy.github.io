---
title: "Transmitters"
description: "The SerDes transmitter from serializer to pad: CML vs voltage-mode (SST) drivers, swing and power, impedance calibration, FFE tap implementation, half/quarter-rate serializers and their clocks, PAM4 weighting and RLM, and the pad capacitance budget."
kind: topic
status: growing
aliases:
  - Transmitters
  - SerDes Transmitter
  - TX Driver
---

A transmitter does four jobs: turn $N$ slow parallel bits into one fast stream, pre-distort it against the channel (FFE), launch it with a known swing from a source impedance equal to $Z_0$, and do all of that with as little power and jitter as possible. Each section below opens one of those boxes one level further.

## The big picture

```tikz title="The SerDes transmitter on one screen. The serializer runs on sub-rate clocks from the PLL; the last MUX sits at or inside the driver; FFE taps are segments of the driver; the pad network (driver, ESD and pad capacitance) sets return loss. Labels L1 to L6 point to the sections below. After Palermo L5 slide 55 and L7 slide 15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=1.0cm,align=center,fill=white}]
  \node[b,minimum width=1.7cm] (ser) at (0,0) {serializer\\$N{:}1$ tree\\(L4)};
  \node[b,minimum width=1.6cm] (ffe) at (2.5,0) {FFE taps\\$w_{-1},w_0,w_1$\\(L3)};
  \node[b,minimum width=1.5cm] (pre) at (4.8,0) {pre-driver\\(slew,\\level shift)};
  \node[b,minimum width=2.2cm,minimum height=1.6cm] (drv) at (7.4,0) {driver slices\\CML or SST\\$R_{out}=Z_0$\\(L1--L2)};
  \draw[->] (-1.6,0) node[left,align=right] {$N$ parallel\\bits} -- (ser);
  \draw[->] (ser) -- (ffe); \draw[->] (ffe) -- (pre); \draw[->] (pre) -- (drv);
  \draw[thick] (drv.east) -- (9.1,0) coordinate (pad);
  \draw (pad) to[L,l=T-coil] (10.7,0) coordinate (o);
  \draw (9.1,0) node[circ]{} -- (9.1,-0.4) to[C,l_=$C_{drv}$] (9.1,-1.5) node[ground]{};
  \draw (10.7,0) node[circ]{} -- (10.7,-0.4) to[C,l=$C_{ESD}{+}C_{pad}$] (10.7,-1.5) node[ground]{};
  \draw[thick] (o) -- (11.6,0);
  \draw[thick,fill=gray!10] (11.6,-0.3) rectangle (13.0,0.3);
  \node[align=center] at (12.3,0) {channel\\$Z_0$};
  \draw (13.0,0) -- (13.6,0) to[R,l=$Z_0$] (13.6,-1.5) node[ground]{};
  \node[align=center] at (13.6,0.55) {RX term.};
  \node[b,minimum width=1.6cm] (pll) at (1.3,-2.4) {PLL};
  \node[b,minimum width=2.8cm] (ck) at (4.6,-2.4) {clock distribution,\\DCC / QEC, $\div2$};
  \draw[->] (pll) -- (ck);
  \draw[->] ([xshift=-0.9cm]ck.north) |- (0,-1.2) -- (ser.south);
  \draw[->] (ck.north) -- (pre.south);
  \node[align=left,anchor=west] at (6.3,-3.0) {final MUX / driver sees the\\half- or quarter-rate clock:\\duty cycle and phase spacing\\land directly in the output eye};
  \node[align=center] at (9.9,1.0) {pad network (L6)};
  \node[align=center] at (3.6,1.0) {PAM4: MSB path $\times2$ + LSB path $\times1$ summed at the pad (L5)};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **The driver is a $Z_0$ source with a set swing.** Current mode (CML): $I = V_{d,pp}/Z_0$. Voltage mode (SST) into a differential termination: $I = V_{d,pp}/(4Z_0)$, a **4× lower signaling current** for the same swing. Voltage mode pays for it in impedance control, pre-driver power and harder FFE.
> 2. **$R_{out}$ must equal $Z_0$ at every corner and every FFE setting.** Build the driver from **parallel slices**: the number of enabled slices sets $R_{out}$, the assignment of slices (or binary sub-slices) to taps sets the FFE. Calibrate against an off-chip precision resistor.
> 3. **An FFE driver is a DAC.** Tap weights are segment counts (SST) or tail IDACs (CML), limited to $\sum|w_k|\le1$ by the swing, with 4 to 6 bits of resolution.
> 4. **The last MUX and its clock set the top speed.** Half rate halves the clock but makes the eye depend on the **clock duty cycle**; quarter rate depends on the **90° phase spacing**. At the top end the last MUX moves into the driver (current summing at the pad).
> 5. **PAM4 = MSB slice ×2 + LSB slice ×1 summed at the pad.** A weighting error $\varepsilon$ costs $R_{LM}$: $R_{LM}\ge0.95$ needs the 2:1 ratio good to a few percent. MSB/LSB skew and edge mismatch close the eye horizontally.
> 6. **The pad is the bottleneck.** Driver + ESD + pad capacitance (about 1 pF in Kossel's 65 nm SST) caps return loss; T-coils split it.

**Map:** [[#Spec translation|specs → $R_{out}$, swing, tap DAC, pre-driver, serializer timing → device sizing]] → [[#Level 0 Termination|termination]] → [[#Level 1 Current-Mode and Voltage-Mode Drivers|CML vs SST]] → [[#Level 2 Output Impedance Control|impedance control]] → [[#Level 3 FFE Drivers|FFE drivers]] → [[#Level 4 Serializers and TX Clocking|serializers, clocks]] → [[#Level 5 PAM4 Transmitters|PAM4]] → [[#Level 6 The Pad|pad, ESD]] → [[#How These Transmitters Work|five TX papers]].

## Spec translation

A transmitter has no feedback amplifier in its signal path. Its "amplifier" specs are the output resistance and swing of a switch array, the bandwidth of a pre-driver, and the timing of a MUX. The table below maps each TX spec to those, then to device sizing.

### The block's specs

| TX spec | Meaning | Numbers from the sources |
|---|---|---|
| Data rate $R_b$, UI, Nyquist $f_N$ | Symbol rate the last MUX and driver must pass | Wong 3.6 Gb/s; Kossel 8.5 Gb/s; Lee 56 Gb/s; Won 28 GBd |
| Differential swing $V_{d,pp}$ | Launch amplitude | Wong 250 mV (single-ended); Kossel >1.0 V eye; Lee PAM4 250 mV; ≥1 V$_{ppd}$ for high-loss channels (L5 slide 26) |
| $R_{out}$, return loss $S_{22}$ | Source match | 50 Ω ±10% (Wong); $S_{22}<-7$ dB at Nyquist (L5 slide 42); Kossel <−16 dB to 10 GHz |
| De-emphasis range and step | FFE taps the channel needs | 2 taps, 4 b (Wong), 5 b (Kossel); 3 taps up to 9 dB (Lee); 5 taps (Fukuda) |
| $R_{LM}$ (PAM4) | Level spacing linearity | ≥0.95 (CEI-56G); Won 97 %, Steffan 94 %, Bassi >94 % |
| Rise time | Edge speed; too fast rings and crosstalks | Wong: ⅓ bit; Lee PAM4: 6.8 ps (20–80 %) |
| Output jitter, DCD | Clock-path jitter at the pad | Fukuda 1.63 ps rms; Kossel DCD <2 % p-p at 10 % input DCD |
| Power, pJ/bit | Driver + pre-driver + serializer + clocks | Wong 9.66 mW TX at 3.6 Gb/s; Kossel 96 mW at 8.5 Gb/s; Won 1.4 pJ/b PAM4 |

### Mapping TX specs to the circuit specs inside

| TX spec | Sub-circuit | Circuit spec that sets it | Result |
|---|---|---|---|
| Swing, CML | Tail current, $R_T$ | Output swing | $V_{d,pp}=IZ_0$ |
| Swing, CML headroom | Switch pair + tail | Tail and switch stay saturated at the low output | $V_{d,pp}\le2(V_{DD}-V_{D,sat,tail}-V_{OV,sw})$ |
| Swing, SST | $V_S$ supply / regulator | Supply level | $V_{d,pp}=V_S$; NMOS pull-up: $V_S<\tfrac43(V_{DD}-V_t-V_{OD})$ |
| $R_{out}$ | Switch $R_{on}$ + poly $R$ per slice | Output impedance, its tolerance | $K\cdot$slices: $R_{slice}/K = Z_0$; $\lvert\Gamma\rvert=\lvert R_{out}-Z_0\rvert/(R_{out}+Z_0)$ |
| $R_{out}$ linear over the swing | Switch FET | Stay in deep triode | $R_{on}\ll R_{poly}$ |
| Return loss at $f_N$ | $C_{drv}+C_{ESD}+C_{pad}$ | Output capacitance | $C_{tot}\le 1/(2\pi f_NZ_0)$ for −7 dB |
| De-emphasis step / range | Segment count or IDAC | DAC resolution | step $=1/N_{seg}$ of full swing; $\sum\lvert w\rvert\le1$ |
| $R_{LM}$ | MSB:LSB current or conductance ratio | Matching, compression | $R_{LM}\ge0.95$: ratio error $+7.9\,\%$ / $-3.7\,\%$ |
| Rise time, ISI | Pre-driver driving the switch gates | Pre-driver bandwidth / slew | $t_r\approx\tfrac13$ UI (6 % ISI) |
| Max data rate | Last MUX + its clock | Clock period, MUX bit time | half rate: $T_b\ge4$ FO4; quarter: $2$ FO4 |
| Eye width at half/quarter rate | Clock distribution | Duty cycle, phase spacing | loss $=(2D-1)$ UI per duty error |
| Power | Driver, pre-driver, clocks | Bias current, $CV^2f$ | CML $V_{DD}V_{d,pp}/Z_0$; SST $V_{d,pp}^2/(4Z_0)$ |

> [!note]- Derivation: the CML headroom bound
> DC-coupled, double-terminated CML (RX terminated to $V_{TT}=V_{DD}$): each output node sees $Z_0\parallel Z_0 = Z_0/2$ to $V_{DD}$. With all of $I$ on one side, that side sits at $V_{low}=V_{DD}-IZ_0/2$.
> - The "on" switch is saturated while $V_{low}\ge V_{G,high}-V_{TH}$.
> - The tail is saturated while the common source $V_{G,high}-V_{GS,sw}\ge V_{D,sat,tail}$.
> Adding them: $V_{DD}-IZ_0/2\ge V_{D,sat,tail}+V_{OV,sw}$, and $V_{d,pp}=IZ_0$, so $V_{d,pp}\le2(V_{DD}-V_{D,sat,tail}-V_{OV,sw})$. With $V_{DD}=1$ V and 0.2 V each, about 1.2 V. In practice the switch is often let into triode for a little more swing, at the cost of output resistance (it no longer looks like a pure current source behind $R_T$). Palermo states only the qualitative rule: "high output common-mode keeps current source saturated" (L5 slide 20). The inequality is my derivation.

> [!note]- Derivation: the NMOS pull-up limit of a low-swing SST driver (Palermo L5 slide 24)
> With a differential termination the output common mode is $V_S/2$ and each side swings $\pm V_S/4$, so the high output is $\tfrac34V_S$. The NMOS pull-up has its gate at $V_{DD}$ and its source at the output, so it conducts in triode only while $V_{DD}-\tfrac34V_S>V_{t1}+V_{OD1}$:
> $$V_S<\tfrac43(V_{DD}-V_{t1}-V_{OD1})\quad\text{(diff.\ term.)},\qquad V_S<2(V_{DD}-V_{t1}-V_{OD1})\quad\text{(SE term., high level }V_S/2)$$
> Past about 400–500 mV$_{pp}$ the NMOS runs out of overdrive and a PMOS pull-up is used instead, which needs $V_S>|V_{t1}|+V_{OD1}$. The pull-up NMOS sees less overdrive than the pull-down, so it is drawn wider: 36 µm vs 15 µm in Palermo's 10 Gb/s example (slide 53), and Poulton sizes "top and bottom output stage transistors … differently, as they see a different $V_{OD}$" (slide 35).

> [!note]- Derivation: power of the two drivers
> CML: the tail current $I=V_{d,pp}/Z_0$ flows from $V_{DD}$ all the time: $P=V_{DD}V_{d,pp}/Z_0$.
> SST into a differential termination: the loop is pull-up $Z_0$, line, $2Z_0$ RX, line, pull-down $Z_0$: $4Z_0$ in series across $V_S=V_{d,pp}$, so $I=V_{d,pp}/(4Z_0)$ and $P=V_{d,pp}^2/(4Z_0)$ if $V_S$ is generated efficiently.
> Example (my numbers): $V_{d,pp}=0.8$ V, $Z_0=50$ Ω, $V_{DD}=1$ V. CML: 16 mA, 16 mW. SST: 4 mA from 0.8 V, 3.2 mW, or 4 mW if an LDO drops it from 1 V. Wong's simulation (Table I, $V_{sw}=250$ mV, 3.6 Gb/s) shows the same ordering: high-CM (saturated, resistor-terminated) 8.17 mW single-ended vs low-CM voltage mode 1.49 mW, *including* the driver-gate power.

$$
\boxed{\text{CML: } I=\frac{V_{d,pp}}{Z_0}\qquad\text{SST (diff.\ RX): } I=\frac{V_{d,pp}}{4Z_0}\qquad \lvert\Gamma\rvert=\frac{\lvert R_{out}-Z_0\rvert}{R_{out}+Z_0}}
$$

### Where it lands in sizing

| Device | What it must do | Sizing knob | What fixes it |
|---|---|---|---|
| CML switch pair | Steer all of $I$ with the pre-driver's swing; be fast | Low $g_m/I_D$ (high $f_T$), $W$ from $I_D/W$ at that $g_m/I_D$ | Full switching needs $\Delta V_{in}\gtrsim\sqrt2V_{OV}$; bandwidth from $f_T$ |
| CML tail | Constant $I$ at low $V_{DS}$ | Long $L$, $V_{D,sat}$ small | Headroom bound above |
| SST switch FET | A small, linear part of $Z_0$ | $W$ from $R_{on}=1/(\mu C_{ox}\tfrac WL V_{OV})$, $L_{min}$ | $R_{on}$ vs pre-driver load and $C_{drv}$ |
| Series poly $R$ | Most of $Z_0$ | Squares, ±30 % → trim range | Linearity, $C_{par}$ |
| Tap IDAC (CML FFE) | Tap weight with $N$ bits | Unit current source (cascoded mirror) | Matching for $R_{LM}$ and tap accuracy |
| Pre-driver | Drive the switch gates in about ⅓ UI | Inverter fan-out, supply (level shift) | $C_{gate}$ of all slices, slew target |

> [!tip] Remark
> The method that turns "low $g_m/I_D$, this $I_D$" into $W$ and $L$ is [[gm-ID Design Methodology]]; don't size the switch pair from the square law. The CML pair as a logic gate (gain at the crossing, swing, bandwidth $\propto f_T$) is sized in [[High-Speed Circuit Techniques#Spec translation]]. The SST switch is the triode resistor of [[MosFETs#Regions of Operation]]. Amplifier spec names follow [[Single-Stage#Amplifier Specifications]].

### Worked example: Palermo's 10 Gb/s CML and SST drivers (L5 slides 52–53)

**CML (slide 52).** $R_T=50$ Ω loads, a 9 mA tail (mirror of 128 µm / 300 nm devices, $m=4$), switch pair 72 µm / 100 nm with $m=2$, 200 fF of pad capacitance per side, 1 ns lines, 100 Ω differential RX termination.
- Swing: $V_{d,pp}=IZ_0=9\ \text{mA}\times50\ \Omega=450$ mV ($\pm225$ mV differential). The simulated 10 Gb/s eye at the RX is visibly smaller, roughly ±150 mV read off the plot: pad capacitance and pair bandwidth.
- Return loss: 200 fF crosses −7 dB at $1/(2\pi\cdot50\cdot200\text{f})=15.9$ GHz, well above the 5 GHz Nyquist.
- Sizing handle: $I_D/W$ of the "on" switch $=9\ \text{mA}/144\ \mu\text{m}=62.5\ \mu$A/µm. That density, at $L=100$ nm, *is* the $g_m/I_D$ choice; read $g_m/I_D$ and $f_T$ off the lookup table at that density.
- Power: $9$ mA from $V_{DD}$, all the time.

**SST (slide 53).** Low-swing NMOS driver from a regulated $V_S$: pull-up NMOS 36 µm / 100 nm, pull-down NMOS 15 µm / 100 nm, both deep in triode; a $V_S$ regulator and an $R$-replica "current regulator" loop set the levels. Same eye class at 10 Gb/s.

### Worked example: Kossel's SST slicing (65 nm, 1.5 V output stage)

- 22 slices, **18 enabled** give 50 Ω (measured, Fig. 17), so one slice is about $18\times50=900$ Ω per branch.
- Each slice is 5 binary sub-slices 16:8:4:2:1. The 16-weight sub-slice is $900\times31/16\approx1.74$ kΩ, the 1-weight $900\times31=27.9$ kΩ (my arithmetic).
- Amplitude step: the single-ended swing is $V_{DD}/2=0.75$ V split into 31 steps: **24.2 mV** (Kossel states this).
- 6.3 dB de-emphasis: weights 16+4+2+1 = 23 on the main tap, 8 on the post tap: $-20\log_{10}\frac{23-8}{31}=6.3$ dB.

## Level 0: Termination

```tikz title="Series, parallel and double termination. A voltage-mode driver is series-terminated, a current-mode driver parallel-terminated; double termination absorbs reflections at both ends and is used in most high-performance links. After Palermo L5 slide 7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{tl/.pic={\draw[thick,fill=gray!10] (0,-0.2) rectangle (2.0,0.2); \node[font=\scriptsize] at (1,0) {$Z_0$};}}
  % series
  \draw (0,0) to[V,l=$V$] (0,1.5) to[R,l=$Z_0$] (1.6,1.5);
  \draw (0,0) node[ground]{};
  \pic at (1.6,1.5) {tl};
  \draw (3.6,1.5) -- (4.2,1.5) node[right,font=\scriptsize] {RX (open)};
  \node[font=\scriptsize,align=center] at (2,-0.9) {series: voltage-mode TX\\reflection absorbed at the source};
  % parallel
  \begin{scope}[xshift=6.6cm]
    \draw (0,0) node[ground]{} to[I,l=$I$] (0,1.5) -- (1.6,1.5);
    \draw (1.1,1.5) node[circ]{} to[R,l=$Z_0$] (1.1,0) node[ground]{};
    \pic at (1.6,1.5) {tl};
    \draw (3.6,1.5) -- (4.2,1.5) node[right,font=\scriptsize] {RX (open)};
    \node[font=\scriptsize,align=center] at (2,-0.9) {parallel: current-mode TX};
  \end{scope}
  % double
  \begin{scope}[yshift=-4cm]
    \draw (0,0) to[V,l=$V$] (0,1.5) to[R,l=$Z_0$] (1.6,1.5);
    \draw (0,0) node[ground]{};
    \pic at (1.6,1.5) {tl};
    \draw (3.6,1.5) -- (4.0,1.5) node[circ]{} to[R,l=$Z_0$] (4.0,0) node[ground]{};
    \node[font=\scriptsize,align=center] at (2,-0.9) {double, voltage mode: $V_{RX}=V/2$};
  \end{scope}
  \begin{scope}[xshift=6.6cm,yshift=-4cm]
    \draw (0,0) node[ground]{} to[I,l=$I$] (0,1.5) -- (1.6,1.5);
    \draw (1.1,1.5) node[circ]{} to[R,l=$Z_0$] (1.1,0) node[ground]{};
    \pic at (1.6,1.5) {tl};
    \draw (3.6,1.5) -- (4.0,1.5) node[circ]{} to[R,l=$Z_0$] (4.0,0) node[ground]{};
    \node[font=\scriptsize,align=center] at (2,-0.9) {double, current mode: $V_{RX}=IZ_0/2$};
  \end{scope}
  \node[font=\scriptsize,align=center] at (5.3,-5.9) {double termination: reflections absorbed at both ends (most high-performance links)};
\end{circuitikz}
\end{document}
```

- **On-chip, not off-chip.** With an external terminator the package parasitics are an unterminated stub that reflects back onto the line; an on-chip termination makes the package inductance part of the line (L5 slide 6).
- **DC vs AC coupling.** DC coupling passes uncoded data, but the TX sets the RX common mode ($IR/2$ for CML into a floating differential termination). AC coupling frees the RX common mode ($V_{TT}$) but adds a low-frequency cutoff, so data must be DC-balanced (coded) (L5 slide 8).
- **Integrated resistors.** Unsalicided poly is the usual choice: linear and the tightest, but still about **±30 %** over process and temperature, hence calibration (L5 slide 9).

| Resistor (90 nm, L5 slide 9) | Poly | N-diffusion | N-well |
|---|---|---|---|
| Sheet R (Ω/□) | 90 ± 10 | 300 ± 50 | 450 ± 200 |
| Voltage coefficient (V⁻¹) | 0 | $10^{-3}$ | $8\times10^{-3}$ |
| Parasitic C | 2–3 fF/µm² (min-L poly) | 0.9 fF/µm² area, 0.04 fF/µm perimeter | 0.2 fF/µm² area, 0.7 fF/µm perimeter |

- **Active termination** (processes without resistors): a triode FET works for swings below about 500 mV; adding a diode-connected FET in parallel extends the linear range; a pass gate gives a differential termination. $R_{FET}=1/(\mu C_{ox}\tfrac WL(V_{GS}-V_t))$ varies with $V_t$, so it must be adjustable: analog gate control (costs $V_{GS}$ and linear range) or, preferred, digital trimming of parallel legs (L5 slides 10–11).

> [!tip] Remark
> Why a mismatched or capacitive termination reflects, $\Gamma$, return loss and the Bode–Fano limit are owned by [[Smith Chart and Impedance Matching#Termination Matching (SerDes and on-chip)]] and [[Transmission Lines#Return Loss and VSWR]]. This note owns the termination *circuits*. Resistor physics is in [[Resistor]].

## Level 1: Current-Mode and Voltage-Mode Drivers

```tikz title="The two drivers. Left: CML, a differential pair steering a tail current into Z0 loads (Norton, parallel termination). Right: one side of an SST (source-series-terminated) driver, a CMOS inverter whose two branches each present Z0 = R_on + R_T (Thévenin, series termination). After Palermo L5 slides 18, 20, 24 and Kossel Fig. 1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % CML driver
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$D^+$};
  \node[right] at (M2.G) {$D^-$};
  \draw (M1.S) -- (M2.S);
  \draw (1.3,-0.77) node[circ]{} to[I,l=$I$] (1.3,-2.4) node[ground]{};
  \draw (M1.D) to[R,l=$Z_0$] ++(0,2) coordinate (t1);
  \draw (M2.D) to[R,l_=$Z_0$] ++(0,2) coordinate (t2);
  \draw (t1) -- (t2); \node[above] at (1.3,2.8) {$V_{DD}$};
  \draw (M1.D) node[circ]{} -- ++(-0.7,0);
  \draw (M2.D) node[circ]{} -- ++(0.7,0) node[right,align=left,font=\scriptsize] {to line $Z_0$;\\RX: $Z_0$ to $V_{TT}$};
  \node[align=center,font=\scriptsize] at (1.3,-3.7) {current mode (CML):\\parallel (Norton) termination\\$V_{d,pp}=IZ_0$};
  % VM / SST driver, one side
  \begin{scope}[xshift=8.4cm]
    \draw (0,2.4) node[pmos](MP){};
    \draw (0,-2.4) node[nmos](MN){};
    \draw (MP.S) -- ++(0,0.3) node[above] {$V_S$};
    \draw (MN.S) node[ground]{};
    \coordinate (o) at (MP.D |- 0,0);
    \draw (MP.D) to[R,l=$R_T$] (o);
    \draw (MN.D) to[R,l_=$R_T$] (o);
    \draw (MP.G) -- (-1.2,2.4) -- (-1.2,-2.4) -- (MN.G);
    \draw (-1.2,0) node[circ]{} -- (-1.7,0) node[left] {$\overline{D}$};
    \draw (o) node[circ]{} -- ++(1.0,0) node[right,font=\scriptsize] {to line $Z_0$};
    \node[align=left,font=\scriptsize] at (2.3,-1.2) {each branch:\\$R_{on}+R_T=Z_0$};
    \node[align=center,font=\scriptsize] at (0.4,-4.6) {voltage mode (SST):\\series (Th\'evenin) termination\\diff.\ RX: $V_{d,pp}=V_S$, $I=V_{d,pp}/(4Z_0)$};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Current mode (CML)

$$
\boxed{V_{d,pp}=IZ_0\ \ (\text{double terminated}),\qquad I=\frac{V_{d,pp}}{Z_0}}
$$

- **Used in most high-performance links** (L5 slide 20). The output impedance is just $R_T$, easy to control; the tail current is constant, so supply current barely changes with data (low $dI/dt$, low SSO), and the pair rejects supply noise well (Kossel §I).
- **The cost** is static current $I$ from $V_{DD}$ whether or not data toggles, and an output that always refers to one rail, so the RX termination voltage is not free (Kossel §I).
- **Push-pull (LVDS) variant:** a PMOS source and an NMOS sink with an H-bridge and a CM feedback loop give $\pm IR$ at the RX for the same current, but the two stacked sources need headroom that low-voltage processes don't have (L5 slide 19).

### Voltage mode (SST)

$$
\boxed{V_{d,pp}=V_S\ \ (\text{diff.\ RX term.}),\qquad I=\frac{V_{d,pp}}{4Z_0},\qquad R_{on}+R_T=Z_0\ \text{per branch}}
$$

- **Each branch is impedance-matched** to $Z_0$, so the driver is "self-terminated": it absorbs reflections whatever the RX does, and the swing is $V_S/2$ for *any* RX termination voltage (high, mid or low common mode) (Kossel Fig. 1).
- **Low swing** (below about 400–500 mV$_{pp}$): all-NMOS driver from a regulated $V_S$ (Wong, Poulton, Song). **High swing:** CMOS driver (PMOS pull-up) with series poly resistors (Kossel, Fukuda) (L5 slide 24).
- **The switch resistance is the problem:** it is nonlinear and process-dependent, so it should be a small part of $Z_0$. That needs wide switches, which load the pre-driver and the pad (Kossel §II). The trade between switch width and series resistor is the central SST sizing decision.

### Current mode vs voltage mode

| Driver / termination | Current | Normalized (L5 slide 23) |
|---|---|---|
| Current mode, SE or diff. RX | $V_{d,pp}/Z_0$ | 1× |
| Voltage mode, SE RX | $V_{d,pp}/(2Z_0)$ | 0.5× |
| Voltage mode, diff. RX | $V_{d,pp}/(4Z_0)$ | 0.25× |

| | CML | SST / voltage mode |
|---|---|---|
| Signaling current | 1× | 0.25× (potential) |
| Output impedance | $R_T$: easy | $R_{on}+R_T$: needs a loop or slicing |
| Supply noise, $dI/dt$ | Constant current, good PSRR | Current varies with data and FFE |
| RX common mode | Tied to the TX rail | Any (self-terminated) |
| FFE | Easy: add tail IDACs at one node | Hard: series impedance; needs segment logic |
| Pre-driver | Small swing, CML | Full-swing CMOS into wide switches |
| Swing limit | Tail headroom | $V_S$, overdrive of the pull-up |

> [!important] The 4× is potential, not guaranteed
> "Actual driver power levels also depend on output impedance control, pre-driver power, equalization implementation" (L5 slide 23). Wong's measured TX spends **0.75 mW on signaling but 5.91 mW on the 2:1 MUX and pre-driver** (Table III, 9.66 mW total). Once the swing is low, the switch-gate $CV^2f$ is the power.

### Swing enhancement

Lower supplies make ≥1 V$_{ppd}$ hard, and PAM4 needs it linear (L5 slide 26). The published fixes:

| Technique | How it buys swing | Result (L5 slides 27–32) |
|---|---|---|
| Parallel bleeder current (Upadhyaya, VLSI 2016) | Thick-oxide source from 1.8 V lifts the output CM | >1.2 V$_{ppd}$, 16 nm FinFET |
| Higher output-stage supply (Kim, ISSCC 2018) | $V_{CC,HV}$ on the output; PMOS switch sources held near 1 V for reliability | >1 V$_{ppd}$, 10 nm |
| Tail-less CML (Steffan, ISSCC 2017) | Data device at the bottom replaces the tail; cascode gate set by replica bias | 1.2 V$_{ppd}$, 94 % RLM |
| Level-shifting pre-driver (Ali, ISSCC 2019) | NMOS driven from 0.85 V, PMOS from a level-shifted 0.15 V ground | 1 V$_{ppd}$, 7 nm |
| Hybrid VM + parallel CM segments (Joy, ISSCC 2011) | Current-mode segments add swing to a voltage-mode main driver | 1.2 V$_{ppd}$, 40 nm |
| Hybrid VM + push-pull CM, PAM4 (Bassi, JSSC 2016) | Push-pull current sources driven by MSB and LSB | 1.3 V$_{ppd}$ in 1 V 28 nm, >94 % RLM, 45 Gb/s |
| Thick-oxide SST (Kossel, JSSC 2008) | 1.0 V thin-oxide pre-driver, level shifters, 1.5 V thick-oxide output | >1.0 V eye at 8.5 Gb/s |

> [!tip] Remark
> The tail-less driver and Won's auxiliary pull-up edge trick are owned at circuit level by [[High-Speed Circuit Techniques#Tail-less CML]]. Here they are just one row of the swing menu.

### Slew-rate control

- **Too slow** limits the data rate; **too fast** rings the package resonances (ISI) and raises crosstalk (L5 slide 50).
- **Segmented turn-on:** split the driver into $n$ segments whose turn-on is spaced by $t_r/n$, current mode (Dally) or voltage mode with a DLL-controlled delay line (Wilson, JSSC 2001). The pre-driver's own transition time must be controlled too (L5 slide 51).
- **Wong's rule:** a transition of about **⅓ bit** limits high-frequency noise to about twice the maximum signal frequency at only **6 % ISI** (Fig. 11). He sets the pre-driver's falling slew by its NMOS size (the driver gate capacitance is nearly process-independent, and the NMOS resistance is held constant by the impedance loop), and the rising slew with a series PMOS whose gate $V_{SR}$ comes from a replica loop. Measured rise/fall 112/107 ps at 3.6 Gb/s (278 ps UI), which with extra pre-driver parasitics meant up to 10 % ISI.

## Level 2: Output Impedance Control

### The calibration loop

```tikz title="Digital termination control: the same current flows through an off-chip precision resistor and an on-chip replica; a comparator and counter step the replica's code until the two voltages agree within an LSB, and the code is copied to every driver. After Palermo L5 slides 12 and 34 (Dally; Chan ASSCC 2016)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,4) -- (4,4) node[right] {$V_{DD}$ (common)};
  \draw (0,4) to[R,l_=$R_{ext}$ (off-chip{,} precise)] (0,1.5) coordinate (a);
  \draw (2.6,4) -- (2.6,3.7) node[draw,thick,anchor=north,minimum width=1.6cm,minimum height=1.0cm,align=center,font=\scriptsize] (rep) {replica\\termination\\code $r$};
  \draw (rep.south) -- (2.6,1.5) coordinate (b);
  \draw (a) node[circ]{} to[I,l_=$I$] (0,-0.3) node[ground]{};
  \draw (b) node[circ]{} to[I,l=$I$] (2.6,-0.3) node[ground]{};
  \node[op amp,scale=0.7] (cmp) at (5.0,1.5) {};
  \draw (a) -- (0.6,1.5) |- (cmp.-);
  \draw (b) -- (3.6,1.5) |- (cmp.+);
  \node[draw,thick,align=center,font=\scriptsize] (cnt) at (7.6,1.5) {dither filter +\\up/down counter};
  \draw[->] (cmp.out) -- (cnt);
  \draw[->] (cnt.north) |- (rep.east) node[pos=0.75,above,font=\scriptsize] {$r[N{:}0]$};
  \draw[->] (cnt.east) -- ++(1.0,0) node[right,align=left,font=\scriptsize] {same code to every\\driver / terminator\\(global or per lane)};
\end{circuitikz}
\end{document}
```

- A **dither filter** stops the code from toggling on noise (L5 slide 12).
- **Shared or per lane:** one loop can serve many links, but with nanometer variation per-channel calibration may be needed (L5 slide 12). Wong shares the impedance and slew-rate control voltages among all ports to amortize their power (§III).
- In a **current-mode** driver this global code just sets the load resistor (L5 slide 34). In a **voltage-mode** driver the switch is part of $Z_0$, so the loop must track the FET too.

> [!warning] Why ±30 % matters more for swing than for return loss
> My arithmetic: an $R_{out}$ off by ±10 % still gives a DC return loss of 25.6–26.4 dB; even ±30 % gives 15–18 dB, above typical masks. What untrimmed resistors really break is the **swing** (CML: $IR_T$; SST: the divider) and, in PAM4 and FFE drivers, the **level spacing**. Palermo: process variation in $R_{term}$ "causes reflection and level mismatch" (slide 38, a ±3σ $R_{term}$ spread moves $R_{out}$ from about 42 to 58 Ω).

### Voltage-mode impedance control

| Scheme | What the loop adjusts | Source |
|---|---|---|
| Regulated pre-driver supply | $V_{GS}$ of NMOS switches via $PV_{DD}$ (pull-up), separate $V_G$ on a bottom NMOS (pull-down); replica vs external 50 Ω | Wong Figs. 7(b), 8 |
| Regulated $V_S$ + pre-drive supply loop | Output supply $V_S$ from a linear regulator; pre-drive supply tracks PVT and swing | Poulton JSSC 2007 (L5 slide 35) |
| Analog series NMOS | Extra up/down NMOS with gates $V_{ZUP}$, $V_{ZDN}$ from a replica regulated to ¾ and ¼ $V_{REF}$ across 100 Ω; independent of pre-driver supply | Song JSSC 2013 (L5 slides 36–37) |
| Footer/header FET banks | Binary FETs in series at top and bottom; fine steps but cost headroom | Kossel Fig. 2(a) |
| Parallel slices | Enable $K$ of $N$ impedance-scaled slices; no headroom penalty | Kossel Fig. 2(b), Palermo slide 39 |
| Hybrid | Slice count for coarse (resistor) variation + analog loop for fine (FET) variation | Chan ASSCC 2016: 75–85 slices, 10 programmable; meets RL mask at 0.9 V$_{pp}$ (L5 slide 40) |

The cost of slicing (L5 slide 39): transistor stacking in the full-rate path, redundant slices (area), a pre-driver sized for the maximum load (power), and sensitivity to P/N skew.

> [!tip] Remark
> A replica loop that sets a gate voltage so a triode FET equals a reference resistor is a feedback amplifier; its accuracy is loop gain, its speed is irrelevant (it tracks temperature). See [[Feedback]]. The replica-bias idea is the same one that sets a CML swing in [[High-Speed Circuit Techniques#Buffer swing, tail and load]].

## Level 3: FFE Drivers

> [!tip] Remark
> What the taps should be, the peak constraint $\sum|w_k|\le1$, de-emphasis in dB and least-squares tap choice are owned by [[Equalization#Level 1 TX FFE]]. Segmented DAC theory (binary vs thermometer, DNL, glitches) is owned by [[DACs]]; Wong's divider DAC is derived in [[DACs#Level 6 DACs in SerDes Transmitters]]. This level is only how the taps become hardware.

### Direct FIR vs segmented DAC

```tikz title="Two ways to build the taps. Direct FIR: one parallel driver per tap, each sized for its own maximum current, summed at the pad (Rylyakov, 10 Gb/s 90 nm: IDAC weights 1/4, 1, 1/2, 1/4). Segmented DAC: a lookup table maps the last few bits to one N-bit code that drives one driver's worth of binary segments (Casper ISSCC 2006: 4 taps, 6 bits, 16×6 LUT). After Palermo L7 slides 24–26 (Zerbe)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.7cm,minimum width=0.8cm,align=center,fill=white}]
  % direct FIR
  \node[font=\small\bfseries] at (2.4,4.2) {direct FIR};
  \draw[->] (-0.6,3.3) node[left] {$d_{k+1}$} -- (0,3.3);
  \node[b] (z1) at (1.4,3.3) {$z^{-1}$};
  \node[b] (z2) at (2.8,3.3) {$z^{-1}$};
  \node[b] (z3) at (4.2,3.3) {$z^{-1}$};
  \draw[->] (0,3.3) -- (z1); \draw[->] (z1) -- (z2); \draw[->] (z2) -- (z3);
  \foreach \x/\w/\s in {0.4/I_{-1}/{1/4},1.8/I_0/1,3.2/I_1/{1/2},4.6/I_2/{1/4}} {
    \draw (\x,3.3) node[circ]{} -- (\x,2.6);
    \draw[thick] (\x-0.35,2.6) -- (\x+0.35,2.6) -- (\x,1.9) -- cycle;
    \node[anchor=west] at (\x+0.2,2.45) {$\s$};
    \draw (\x,1.9) -- (\x,1.4);
    \node[below] at (\x,1.4) {$\w$};
  }
  \draw (z3.east) -- (4.6,3.3);
  \draw[thick] (0.4,1.4) -- (4.6,1.4);
  \draw (2.5,1.4) node[circ]{} -- (2.5,0.8) node[below,align=center] {pad: $V_{out}=\big[\sum_k I_kD_k\big]\,R_T/2$\\each tap sized for its own max current};
  % segmented DAC
  \begin{scope}[xshift=7.6cm]
    \node[font=\small\bfseries] at (2.4,4.2) {segmented DAC};
    \node[b,minimum width=1.4cm,minimum height=1.6cm] (sr) at (0,2.6) {shift reg.\\4 bits\\of pattern};
    \node[b,minimum width=1.5cm,minimum height=1.6cm] (lut) at (2.1,2.6) {LUT\\16$\times$6\\(RAM)};
    \draw[->] (sr) -- node[above] {4} (lut);
    \foreach \y/\w in {3.5/32,2.9/16,2.3/8,1.7/4} {
      \draw[thick] (3.6,\y+0.25) -- (3.6,\y-0.25) -- (4.1,\y) -- cycle;
      \node[anchor=west] at (4.15,\y+0.12) {$\w$};
      \draw (4.1,\y) -- (5.0,\y);
    }
    \node at (3.85,1.25) {$\vdots$};
    \draw[->] (lut.east) -- node[above] {6} (3.6,2.6);
    \draw[thick] (5.0,3.5) -- (5.0,1.4);
    \draw (5.0,1.4) -- (5.0,0.8) node[below,align=center] {pad: one driver's worth of width\\taps combined digitally, not at the pad};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out}(0)=\Big[I_{-1}D(1)+I_0D(0)+I_1D(-1)+I_2D(-2)\Big]\frac{R_T}{2}}
$$

| | Direct FIR | Segmented DAC |
|---|---|---|
| Output transistors | Each tap sized for its own max current | Minimum: sized for the peak *total* current |
| Output capacitance | Higher | Lowest |
| Power, complexity | Lower | Highest: needs a mapping table (RAM) |
| Flexibility | Fixed tap structure | Any filter (and any PAM mapping) |

(Palermo L7 slide 24.) In a direct CML FIR the tap signs come from XORs in front of each pair and the magnitudes from per-tap IDACs (Rylyakov, slide 25).

> [!note]- Detail: why the taps can't add swing
> Every tap draws from the same headroom: the largest output, when all taps agree, is $(\sum_k|I_k|)R_T/2$, and that must fit the driver's linear range. So the main tap shrinks as the others grow. The "boost" is really low-frequency attenuation. This is the circuit origin of [[Equalization#Peak-power constraint and de-emphasis]].

### Voltage-mode FFE

FFE is harder in a voltage-mode driver "due to the series impedance": a tap can't just add current at a node (L7 slide 27). Four ways around it:

1. **Divider with a ground shunt** (Wong; Sredojevic JSSC 2011): each segment pulls up or down, so the output is a resistive divider with constant total conductance. Costs significant pre-drive logic that grows with tap resolution and a **time-varying current from $V_{REF}$** (slide 27).
2. **Channel shunt** (Dettloff ISSCC 2010): a switched resistor across the pair produces the de-emphasized levels at **constant $V_{REF}$ current**, with even more complex segmentation logic (slide 28).
3. **Hybrid** (Song TCAS-II 2012): voltage-mode main tap (low current) plus parallel current-mode equalization taps (high resolution, minimal pre-drive). Some dynamic current, less than (1). At 4.8 Gb/s over 6 dB loss, the eye grew from 87 mV to 146 mV (slide 29).
4. **Impedance-modulated** (ISSCC 2014, 8–16 Gb/s, 0.65–1.05 pJ/b, 65 nm): transition bits are driven at 50 Ω, longer run lengths at a higher impedance, so **signaling power falls as de-emphasis rises**. On reflective channels it leaves >20 % extra residual ISI; on well-matched channels it equals a matched FFE (L7 ISSCC slides 9–11).

```tikz title="Kossel's decoupling of impedance and equalization. K of N identical slices are enabled to set Z_out; inside every slice, binary-weighted sub-slices are assigned to the main or post tap, so the de-emphasis setting survives any change in K. After Kossel Figs. 2(b) and 3(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % stack of slices
  \foreach \k in {4,3,2,1} {
    \draw[thick,fill=white] ({0.25*\k},{0.25*\k}) rectangle ({7.2+0.25*\k},{3.6+0.25*\k});
  }
  \draw[thick,fill=white] (0,0) rectangle (7.2,3.6);
  \node[anchor=north west] at (0,3.6) {one SST slice ($N$ identical slices, $K$ enabled)};
  \foreach \x/\w in {0.4/4,2.6/2,4.8/1} {
    \draw[fill=gray!8] (\x,0.4) rectangle (\x+2.0,2.9);
    \node at (\x+1.0,2.6) {weight $\w/7$};
    \node[align=center] at (\x+1.0,1.5) {SST stage\\FET$+R$ up\\FET$+R$ down\\$G\propto\w$};
  }
  \draw (7.2,1.5) -- (8.6,1.5) node[right] {output (all slices in parallel)};
  \draw[->] (-1.6,1.0) node[left] {main tap $d[k]$} -- (0.4,1.0);
  \draw[->] (-1.6,2.1) node[left] {post tap $\overline{d}[k{-}1]$} -- (0.4,2.1);
  \node[align=left,anchor=north west] at (0,-0.2) {impedance: $Z_{out}=Z_{slice}/K$ (enable or tri-state whole slices)\\equalization: inside every slice, pick which weights take the main tap\\and which take the post tap (e.g.\ 4+1 main, 2 post: $-20\log_{10}\frac{5-2}{7}=7.4$ dB)\\the two controls are independent};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{DE}=-20\log_{10}\frac{w_{main}-w_{post}}{w_{main}+w_{post}}\ \text{dB},\qquad \text{step}=\frac{V_{pp}}{2^{b}-1}}
$$

- If whole slices are assigned to taps (Kossel Fig. 3(a)), changing the slice count for impedance also changes the tap ratio: with $K=8$ slices, 6 main + 2 post gives $-20\log_{10}\frac{6-2}{8}=6$ dB, but a new $K$ that isn't a multiple of 4 can't keep exactly 6 dB.
- Binary sub-slices inside each slice fix that: the ratio is set *within* a slice, so $K$ only scales the impedance. Kossel uses 5 bits and implements it with $2\times5$ 2:1 MUXes in the pre-driver that pick main or post data for each weight; the post tap is automatically the complement of the main-tap weights.
- Wong's 2-tap version, $Y[n]=X[n]-\alpha X[n-1]$, uses 4 binary segments (16 levels): with $\alpha=3/15$ the 12 "main" units pull up and the 3 "post" units pull down on a repeated 1, $V_{out}=(1-\alpha)V_S$, while the parallel conductance stays $1/(50\ \Omega)$. Measured $R_{out}$ stays within 10 % over $\alpha$; peak DNL 0.8 LSB, so more segments would not improve the pre-emphasis accuracy (Wong Figs. 9, 10, 26).

> [!note]- Detail: Fukuda's 5-tap SST FFE (ISSCC 2008)
> 25 CMOS inverters in parallel form the driver. A 5-bit shift register supplies $d_{-1}\ldots d_3$, and each inverter is driven by one of them: **a tap's weight is the number of inverters it drives** (a 25-level segmented driver with 5 taps). Pass-transistor variable resistors in series set 50 Ω. With an RX VGA, 12 dB analog equalizer and 2-tap DFE it ran 8 Gb/s at BER < $10^{-12}$ over a 160 cm backplane with −36.8 dB loss at 4 GHz. See [[#Fukuda 2008 5-Tap SST FFE over a 37 dB Backplane]].

## Level 4: Serializers and TX Clocking

```tikz title="Half-rate tree serializer. Two clk/4 stages produce D02 and D13, each held 2 UI and offset by 1 UI; the final 2:1 MUX, selected by clk/2, picks each in its stable half. The last stage has no flip-flop, so the 1-UI critical path has no setup time, but the output UI widths are the high and low times of clk/2. After Palermo L5 slides 56 and 58."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.6cm,minimum width=0.6cm,align=center,fill=white}]
  % first stage muxes
  \foreach \y/\a/\c/\n in {3.2/D0/D2/A,1.2/D1/D3/B} {
    \node[b] (fa\n) at (0,\y+0.4) {FF};
    \node[b] (fb\n) at (0,\y-0.4) {FF};
    \node[b] (l\n) at (1.0,\y-0.4) {L};
    \draw (-0.8,\y+0.4) node[left] {\a} -- (fa\n);
    \draw (-0.8,\y-0.4) node[left] {\c} -- (fb\n);
    \draw (fb\n) -- (l\n);
    \draw[thick] (1.8,\y+0.7) -- (2.3,\y+0.45) -- (2.3,\y-0.45) -- (1.8,\y-0.7) -- cycle;
    \draw (fa\n.east) -- (1.8,\y+0.4); \draw (l\n.east) -- (1.8,\y-0.4);
    \draw (2.05,\y-0.6) -- (2.05,\y-0.95) node[below] {clk/4};
  }
  \draw (2.3,3.2) -- (3.3,3.2) node[above,pos=0.5] {$D_{02}$};
  \draw (2.3,1.2) -- (3.3,1.2) node[above,pos=0.5] {$D_{13}$};
  \node[b] (fc) at (3.7,3.2) {FF};
  \node[b] (fd) at (3.7,1.2) {FF};
  \node[b] (ld) at (4.7,1.2) {L};
  \draw (fd) -- (ld);
  \draw[thick] (5.6,2.9) -- (6.2,2.5) -- (6.2,1.9) -- (5.6,1.5) -- cycle;
  \draw (fc.east) -- (5.1,3.2) |- (5.6,2.6);
  \draw (ld.east) -- (5.1,1.2) |- (5.6,1.8);
  \draw[->] (6.2,2.2) -- (7.0,2.2) node[right] {$D_{out}$ (full rate)};
  \draw (5.9,1.7) -- (5.9,0.4) node[below,align=center] {clk/2: select\\(swapped, no glitch)};
  \draw[red,->] (3.9,3.55) to[bend left=20] node[above] {1 UI critical path} (5.8,2.75);
  % timing
  \begin{scope}[yshift=-1.6cm]
    \def\u{0.55}
    \node[left] at (0,0) {clk/2};
    \draw[thick] (0,-0.2) \foreach \i in {0,...,5} { -- ({2*\i*\u},-0.2) -- ({2*\i*\u},0.2) -- ({(2*\i+1)*\u},0.2) -- ({(2*\i+1)*\u},-0.2) } -- (12*\u,-0.2);
    \node[left] at (0,-0.8) {$D_{02}$};
    \foreach \i/\t in {0/{0_0},1/{2_0},2/{0_1},3/{2_1},4/{0_2},5/{2_2}} {
      \draw ({2*\i*\u+0.05},-0.6) -- ({(2*\i+2)*\u-0.05},-0.6) -- ({(2*\i+2)*\u-0.05},-1.0) -- ({2*\i*\u+0.05},-1.0) -- cycle;
      \node at ({(2*\i+1)*\u},-0.8) {$\t$};
    }
    \node[left] at (0,-1.5) {$D_{13}$};
    \foreach \i/\t in {0/{1_0},1/{3_0},2/{1_1},3/{3_1},4/{1_2}} {
      \draw ({(2*\i+1)*\u+0.05},-1.3) -- ({(2*\i+3)*\u-0.05},-1.3) -- ({(2*\i+3)*\u-0.05},-1.7) -- ({(2*\i+1)*\u+0.05},-1.7) -- cycle;
      \node at ({(2*\i+2)*\u},-1.5) {$\t$};
    }
    \node[left] at (0,-2.2) {$D_{out}$};
    \foreach \i/\t in {1/{0_0},2/{1_0},3/{2_0},4/{3_0},5/{0_1},6/{1_1},7/{2_1},8/{3_1},9/{0_2},10/{1_2}} {
      \draw ({\i*\u+0.03},-2.0) -- ({(\i+1)*\u-0.03},-2.0) -- ({(\i+1)*\u-0.03},-2.4) -- ({\i*\u+0.03},-2.4) -- cycle;
      \node[font=\tiny] at ({(\i+0.5)*\u},-2.2) {$\t$};
    }
    \node[right,align=left] at (12*\u+0.2,-1.2) {each stream is held 2 UI;\\the clk/2 level picks one:\\high-time and low-time of clk/2\\become the even and odd UI widths};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Full, half and quarter rate

- **Tree MUX** of cascaded 2:1 stages is the common structure. **Full rate** retimes the output with a full-rate flip-flop: relaxes the clock duty cycle but needs a full-rate clock and a flip-flop that works at it (L5 slide 56). Cao's 10 Gb/s full-rate TX in 0.18 µm (16:8 in static CMOS, the rest CML) burned 130 mW (slide 57).
- **Half rate** drops the last flip-flop: the final 2:1 MUX's select *is* the half-rate clock. No full-rate clock, no setup time in the critical path, but **the output eye depends on the clock duty cycle**. The final MUX's select is swapped so each input is passed only in its stable half, which prevents output glitches; the same can be done in earlier stages for timing margin (slide 58).
- **Quarter rate** uses four phases 90° apart and a 4:1 final MUX: a 2 FO4 bit in CMOS, about 16 Gb/s in 90 nm, but now the **90° spacing and duty cycle** set the uniformity of the four UIs. Eighth rate (1 FO4) is beyond any CMOS MUX (slides 63–64).

$$
\boxed{T_{clk,min}\approx8\ \text{FO4}\ \Rightarrow\ T_{b,min}\approx\frac{8\ \text{FO4}}{M}\quad(M=1,2,4:\ \text{full, half, quarter rate}),\qquad T_{b}\ge2\ \text{FO4 (CMOS MUX)}}
$$

> [!tip] Remark
> The FO4 numbers behind this (8 FO4 clock, 2 FO4 MUX, 30 ps FO4 in 90 nm) and the CML vs CMOS gate trade are owned by [[High-Speed Circuit Techniques#FO4 limits of CMOS]]; the 2:1 CML MUX circuit is [[High-Speed Circuit Techniques#MUX and XOR]]. Wong designed his I/O for a 3 FO4 bit time, which is 3.6 Gb/s in 0.18 µm (§II).

### Duty cycle and phase spacing land in the eye

$$
\boxed{\text{half rate, clock duty } D:\ \ \text{UI}_{even}=2D\cdot\text{UI},\ \ \text{UI}_{odd}=2(1-D)\cdot\text{UI},\ \ \text{eye-width loss}\approx(2D-1)\,\text{UI}}
$$

- A 52 % clock gives bits of 1.04 and 0.96 UI: 0.04 UI of the eye gone before the channel (my arithmetic). At quarter rate a phase error $\Delta\phi$ in a 4-phase clock moves one edge by $\Delta\phi/360°\times4$ UI: about 0.011 UI per degree.
- That is **duty-cycle distortion** delivered straight to the pad, a deterministic jitter component: [[Link Noise and Jitter#Data-Dependent Jitter ISI, DCD, BUJ]].
- **Fixes at the TX:** a duty-cycle corrector in the clock path (Casper ISSCC 2006 has a DCC before its ÷2, L7 slide 26); Kossel's **capacitively source-degenerated CML buffer** (a band-pass, so input DC offset can't become duty error) restores duty cycle by **5×**: <2 % p-p output DCD at 10 % input DCD (Figs. 6, 23); Won's foreground **QEC** with cap-DAC delay cells trims the four phases of a DLL (§2).

### Clock–data alignment at the last stage

- The final MUX samples its inputs with the fastest clock; if the data arrive at an arbitrary phase relative to it, the last stage needs **retiming**, and at high rates even that needs a known phase.
- **Lee 56 Gb/s:** the acceptable sampling window at the last stage is 8–10 ps but PVT drifts the phase by 15–20 ps, so "a static delay can hardly work". A **dynamic phase aligner** (mixer M1 as XOR on the 28 Gb/s data, PI, mixer M2, V/I) locks the 28 GHz clock to the data transitions; it is purely linear and unconditionally stable (§IV-A, Fig. 10).
- **Kossel's alternative:** no retiming in the 22 output slices; instead the clock buffer's delay is **matched** to the data distribution delay. Saves power, but the inserted delay doesn't scale with data rate, which caps the maximum rate (§IV-A).
- **Supply noise → jitter:** CMOS clocking is supply sensitive; Kossel has no regulator and measures about **70 mUI p-p** of supply-induced jitter at 8.5 Gb/s (§VI). The mechanism is in [[Link Noise and Jitter#Power-Supply Noise and SSO]].

### Where the last MUX sits

| Architecture | Idea | Trade (L5 slides 65–66) |
|---|---|---|
| Output-multiplexed (current-mode MUX at the pad) | $M$ driver slices, each enabled for 1 UI by phase-shifted clocks, summed in current at the pad | Works if the pad time constant $25\ \Omega\cdot C_{out}$ beats the on-chip one; very sensitive to clock phase spacing. Yang: 8:1 at 6 Gb/s in 0.35 µm (≈33 Gb/s in 90 nm). Won: 4:1 current-domain MUX of tail-less slices |
| Input-multiplexed | MUX before one driver (Lee JSSC 2000) | Lower output capacitance, easier TX FFE, insensitive to output-stage current mismatch, MUX stages don't carry full output current |
| MUX inside the SST switch | Two stacked FETs per branch: clock FET and data FET | The 2:1 MUX costs no extra stage; symmetric to P/N slew mismatch because clock and data always drive identical pairs (Kossel §II, §IV-B) |
| Distributed selector | Final 2:1 as a 3-stage distributed amplifier on 50 Ω lines | Bandwidth to 60 Gb/s; no room for ESD (Lee Fig. 11) |

> [!tip] Remark
> The TX PLL itself (loop bandwidth chosen from measured reference and VCO noise, as Lee does) is in [[Phased-Locked Loops#PLLs in a SerDes]]; DLLs and QEC in [[Phased-Locked Loops#Level 5 Delay-Locked Loops]] and [[Clocking and CDR]].

## Level 5: PAM4 Transmitters

```tikz title="PAM4 by current summing. An MSB slice with twice the current and an LSB slice share the output; levels are ±(2w_M) ± 1. If the MSB weight is off by (1+ε), the middle eye becomes 2+4ε while the outer two stay 2. After Zhang slide 51, Lee Fig. 6(b), Won Fig. 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % summing: two pairs sharing loads
  \draw (0,0) node[nmos](A1){};
  \draw (2.4,0) node[nmos,xscale=-1](A2){};
  \draw (6.4,0) node[nmos](B1){};
  \draw (8.8,0) node[nmos,xscale=-1](B2){};
  \draw (A1.S) -- (A2.S); \draw (B1.S) -- (B2.S);
  \draw (1.2,-0.77) node[circ]{} to[I,l=$2I(1{+}\varepsilon)$] (1.2,-2.3) node[ground]{};
  \draw (7.6,-0.77) node[circ]{} to[I,l=$I$] (7.6,-2.3) node[ground]{};
  \node[left] at (A1.G) {MSB}; \node[right] at (A2.G) {$\overline{\rm MSB}$};
  \node[left] at (B1.G) {LSB}; \node[right] at (B2.G) {$\overline{\rm LSB}$};
  \draw (A1.D) -- (A1.D|-0,1.2) coordinate (p);
  \draw (B1.D) -- (B1.D|-0,1.2);
  \draw (A2.D) -- (A2.D|-0,1.6);
  \draw (B2.D) -- (B2.D|-0,1.6);
  \draw (A1.D|-0,1.2) -- (B1.D|-0,1.2);
  \draw (A2.D|-0,1.6) -- (B2.D|-0,1.6);
  \draw (-0.6,1.2) node[left] {out$^-$} -- (A1.D|-0,1.2);
  \draw (B2.D|-0,1.6) -- (9.6,1.6) node[right,align=left] {out$^+$\\($R_T$ loads\\not drawn)};
  \node[align=center] at (4.4,-3.4) {currents add at the pad: weights $2(1{+}\varepsilon):1$};
  % levels
  \begin{scope}[xshift=12.8cm,yshift=-1.6cm]
    \draw[->] (0,-0.2) -- (0,4.4) node[above] {level};
    \foreach \y/\l in {0.3/{-3},1.5/{-1},2.7/{+1},3.9/{+3}} { \draw[thick,blue!70!black] (0.3,\y) -- (1.6,\y); \node[left] at (0,\y) {$\l$}; }
    \node at (0.95,-0.5) {ideal};
    \foreach \y/\l in {0.0/{-3{-}2\varepsilon},1.3/{-1{-}2\varepsilon},2.9/{+1{+}2\varepsilon},4.2/{+3{+}2\varepsilon}} { \draw[thick,red!70!black] (2.4,\y) -- (3.7,\y); \node[right] at (3.7,\y) {$\l$}; }
    \node at (3.05,-0.5) {MSB too strong};
    \draw[<->] (3.0,0.0) -- (3.0,1.3) node[midway,left] {2};
    \draw[<->] (3.0,1.3) -- (3.0,2.9) node[midway,left] {$2{+}4\varepsilon$};
    \draw[<->] (3.0,2.9) -- (3.0,4.2) node[midway,left] {2};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> PAM4 levels, the ⅓ eye, Gray coding and the $R_{LM}$ definition are owned by [[Signaling and BER#PAM4]] and [[Signaling and BER#Level 5 Test Patterns and Transmitter Linearity]]. PAM4 FFE (64 TX levels for 3 taps) is in [[Equalization#Level 6 PAM4 Equalization]].

### The 2:1 sum

- Two serializers (or two halves of one) produce MSB and LSB at the symbol rate; the driver sums them with **2:1 weighting** (Lee §II, Fig. 1). This also relaxes timing: no signal runs at the bit rate, only the symbol rate.
- **FFE:** filter MSB and LSB separately with the same taps, then sum (two current-steering DACs, 2× and 1×), or map to PAM4 levels first and filter in DSP, then drive one $N$-bit DAC (Zhang slide 51). Linear, so equivalent if the weighting is exact.
- **Dual mode:** an NRZ/PAM4 TX can turn the LSB path fully off in NRZ mode. Won resets the LSB flip-flops and gates everything downstream, so NRZ costs only 31 % worse energy per bit than PAM4 instead of the 100 % of designs that keep all slices on (§3–4).

### Weighting error and $R_{LM}$

$$
\boxed{\text{levels } \pm(2+2\varepsilon)\pm1:\qquad R_{LM}=\frac{1}{1+2\varepsilon/3}\ (\varepsilon>0),\qquad R_{LM}=\frac{3-6|\varepsilon|}{3-2|\varepsilon|}\ (\varepsilon<0)}
$$

- **$R_{LM}\ge0.95$ needs** $\varepsilon\le+7.9\,\%$ (MSB too strong: outer eyes set the minimum) or $|\varepsilon|\le3.7\,\%$ (MSB too weak: the middle eye shrinks twice as fast). These bounds are my derivation from Zhang's $R_{LM}$ definition.
- **Causes** (Zhang slide 83): bit-weighting error in the DAC (the 2:1 ratio is off) and compression in the output stage. A CML tail leaving saturation or an SST switch leaving triode at the extreme levels compresses the outer eyes; this is why the swing-enhancement table above quotes RLM next to $V_{ppd}$.
- **Measured:** Won 97 %, Steffan 94 %, Bassi >94 %; Won's comparison table lists 94–99 % for recent 28 to 10 nm PAM4 TXs.

> [!note]- Derivation: $R_{LM}$ vs MSB weighting error
> MSB weight $2(1+\varepsilon)$, LSB weight 1. Levels: $\pm(2+2\varepsilon)\pm1$, i.e. $-3-2\varepsilon,\,-1-2\varepsilon,\,1+2\varepsilon,\,3+2\varepsilon$. Eyes: outer $2$, middle $2+4\varepsilon$; total $6+4\varepsilon$.
> With $R_{LM}=6S_{min}/(V_D-V_A)$ and $S_{min}=\tfrac12\min(\text{eye})$:
> - $\varepsilon>0$: $S_{min}=1$, $R_{LM}=6/(6+4\varepsilon)$. Set $=0.95$: $\varepsilon=0.079$.
> - $\varepsilon<0$: $S_{min}=1-2|\varepsilon|$, $R_{LM}=6(1-2|\varepsilon|)/(6-4|\varepsilon|)$. Set $=0.95$: $|\varepsilon|=0.0366$.
> The asymmetry is the point: an undersized MSB shrinks the middle eye at $4\varepsilon$ while the total only shrinks at $4\varepsilon$ too, so the ratio falls about twice as fast. Trim the MSB:LSB ratio from the high side if anything.

### Skew and edge mismatch

- **MSB/LSB clock skew** of ⅛ UI (MSB early or late) misaligns the PAM4 eyes horizontally, and the channel makes it worse (Zhang slide 36).
- **Driver strength mismatch**: an MSB driver with faster or slower edges than the LSB misaligns the eyes vertically during transitions (Zhang slide 37).
- So the two paths must match in **delay and edge rate**, not just in DC current: same slice design, same pre-driver loading, shared clock. In a segmented driver the cleanest way is to make MSB literally two copies of the LSB slice.
- **PAM4 horizontal eye** suffers from transitions between non-adjacent levels. Won adds a 1-UI-early inverted pulse to an auxiliary pull-up so the two output edges cross while both are steep: minimum PAM4 eye width 0.42 → 0.55 UI (+30 %), NRZ 0.87 → 0.90 UI. The minimum eye *height* fell from 114.2 to 93.6 mV at the same time (Fig. 8). Circuit details: [[High-Speed Circuit Techniques#Tail-less CML]].

### Pre-distortion

- An EML laser's transfer curve is nonlinear, so 4 equally spaced *electrical* levels give unequal *optical* levels. Lee **pre-distorts** by moving the MSB:LSB current ratio away from 2:1 with two iDACs, squeezing or stretching the middle levels; a temperature sensor and FPGA set the iDACs (Fig. 6(b)).
- Range: 100 %, from collapsing the two middle levels into one to stretching them onto the outer levels; measured at ±20 % (Fig. 17).
- This is the same knob as $\varepsilon$ above, used on purpose. The optical side is in [[Optical Transceivers]].

## Level 6: The Pad

- **Capacitance budget.** Kossel's 65 nm SST: output stages about 600 fF (mostly the poly resistors' sheet capacitance and wiring), SCR + diode ESD about 300 fF for 2 kV HBM, pad about 70 fF: **about 1 pF**, which limits a plain design to below 5 Gb/s under a "−8 dB at half the maximum data rate" return-loss spec (§V).
- **Return-loss rule:** with $R_{out}=Z_0$, $|S_{22}|\le-7$ dB at $f_N$ needs $C_{tot}\le1/(2\pi f_NZ_0)$: 227 fF at a 14 GHz Nyquist (56 Gb/s PAM4, 28 Gb/s NRZ).
- **SST slices cost pad capacitance.** Every slice's switch and resistor hang on the pad, enabled or not. Kossel's 22 slices with bulk poly resistors had far worse return loss than an earlier 44-slice SOI design with *larger* ESD, because SOI poly has much less parasitic capacitance; "SST transmitters with a large number of slice units should preferably be implemented in SOI" (§VI).
- **T-coils** split driver, ESD and pad capacitance: Kossel's asymmetric 40 × 40 µm coil gives <−16 dB to 10 GHz. Owned by [[High-Speed Circuit Techniques#T-coils at the pad]].
- **ESD:** SCR + N+/P-well diode (Kossel); at 56 Gb/s Lee omits ESD on the output altogether and relies on the 50 Ω on-chip load (§IV-A). Devices, clamps and the I/O trade are owned by [[Guard Rings, ESD and Interconnect#ESD for High-Speed I/O]].
- **Single-ended vs differential:** single-ended signaling's supply impedance turns switching current into SSO noise and needs large decoupling (decap can limit I/O area more than the circuits). Differential signaling uses 2 lines per bit but fewer return pins, is self-referenced, gives twice the swing, rejects common-mode noise, and ideally returns only DC current (L5 slides 15–16). Kossel's on-chip decoupling: 16 pF; CM noise <10 mV rms.

> [!tip] Remark
> The capacitance math ($|\Gamma|=x/\sqrt{4+x^2}$, the −7 dB rule, $C_{tot,max}$ per data rate and the Bode–Fano ceiling) is owned by [[Smith Chart and Impedance Matching#Termination Matching (SerDes and on-chip)]]. ESD structures and their capacitance cost: [[Guard Rings, ESD and Interconnect#ESD for High-Speed I/O]]. Package effects: [[Packaging]].

## How These Transmitters Work

### Wong 2004: 3.6 Gb/s Voltage-Mode TX with 2-Tap Pre-Emphasis

```tikz title="Wong et al. 2004 transmitter, redrawn from Figs. 6, 7, 8 and 12. A 16:1 tree serializes 225 Mb/s inputs; the voltage-mode driver is four binary segments, each pulling up or down, fed by X[n] or the inverted, half-cycle-delayed X[n-1]; replica loops set the impedance and the pre-driver slew."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[b,minimum width=1.3cm] (m1) at (0,0.8) {8:1 MUX};
  \node[b,minimum width=1.3cm] (m2) at (0,-0.8) {8:1 MUX};
  \node[b,minimum width=1.0cm] (m3) at (2.0,0) {2:1\\MUX};
  \draw[->] (-1.4,0.8) node[left] {8} -- (m1); \draw[->] (-1.4,-0.8) node[left] {8} -- (m2);
  \node at (-0.4,1.6) {16$\times$225 Mb/s in};
  \draw[->] (m1.east) -- ++(0.2,0) |- ([yshift=0.2cm]m3.west);
  \draw[->] (m2.east) -- ++(0.2,0) |- ([yshift=-0.2cm]m3.west);
  \node[b,minimum width=1.5cm,minimum height=3.6cm] (sel) at (4.7,0) {segment\\select:\\$X[n]$ or\\$\overline{X}[n{-}1]$\\per segment\\($\tfrac12$-cycle\\delay of the\\1.8 GHz clk)};
  \draw[->] (m3) -- node[above] {3.6 Gb/s} (sel);
  \foreach \y/\w in {1.35/8,0.45/4,-0.45/2,-1.35/1} {
    \draw[thick] (6.0,\y+0.3) -- (6.0,\y-0.3) -- (6.6,\y) -- cycle;
    \node at (6.22,\y) {\tiny$\w$};
    \draw (5.45,\y) -- (6.0,\y);
    \draw (6.6,\y) -- (7.2,\y);
  }
  \draw[thick] (7.2,1.35) -- (7.2,-1.35);
  \draw (7.2,0) -- (8.2,0) node[circ]{};
  \draw[thick,fill=gray!10] (8.2,-0.3) rectangle (9.6,0.3); \node at (8.9,0) {channel};
  \draw (9.6,0) -- (10.2,0) to[R,l=$50\,\Omega$] (10.2,1.8) node[above] {$V_S/2$};
  \node[align=left,anchor=west] at (7.4,-1.3) {4 binary segments, each pulls\\up or down: 16 levels,\\$R_{out}=50\,\Omega$ for every $\alpha$};
  \node[b,minimum width=2.4cm] (zc) at (6.6,-3.0) {impedance control\\(replica, ext.\ 50 $\Omega$)\\sets $PV_{DD}$ and $V_G$};
  \node[b,minimum width=2.2cm] (sr) at (3.6,-3.0) {slew-rate control\\(replica pre-driver)\\sets $V_{SR}$};
  \draw[->] (zc.north) -- (6.3,-1.65);
  \draw[->] (sr.north) |- (5.8,-2.1) -- (5.8,-1.65);
  \node[b,minimum width=1.7cm] (div) at (0,-2.4) {$\div2\,\div2\,\div2$};
  \draw[->] (-2.0,-2.4) node[left] {1.8 GHz PLL} -- (div);
  \draw[->] (div.north) -- (m2.south);
  \draw[->] (-1.7,-2.4) |- (2.0,-1.5) -- (m3.south);
\end{circuitikz}
\end{document}
```

- **Signaling:** low common mode, $V_S=0.5$ V, NMOS pull-up and pull-down in triode, single-ended, 250 mV$_{pp}$, channel terminated to $V_S/2$. Simulated driver power 1.49 mW vs 8.17 mW for a high-CM resistor-terminated driver (Table I).
- **Serializer:** 16:1 binary tree of 2:1 MUXes at 1.8 GHz, 900, 450, 225 MHz from one PLL; the last 2:1 runs on the half-rate 1.8 GHz clock.
- **Impedance:** pull-up set by the pre-driver supply $PV_{DD}$ (an LDO per I/O, reference from a replica against an external 50 Ω); pull-down matched by a bottom NMOS whose gate $V_G$ has its own loop. The same bias sets the RX comparator's RC bandwidth, so it tracks PVT too. In RX mode the driver becomes a 100 Ω ∥ 100 Ω termination.
- **Pre-emphasis:** $Y[n]=X[n]-\alpha X[n-1]$, 16 levels, $R_{out}$ within 10 %, DNL 0.8 LSB.
- **Power:** TX 9.66 mW, of which signaling 0.75, impedance control 1.1, slew control 0.1, 8:1 MUXes 0.4, **2:1 MUX + pre-driver 5.91**, dividers + PRBS 1.4 (Table III). Over 8 cm FR4 + 6.5 m RG58 (12 dB), equalization opens a closed eye to 37 mV × 189 ps.

### Fukuda 2008: 5-Tap SST FFE over a 37 dB Backplane

```tikz title="Fukuda et al. 2008 transmitter, redrawn from Fig. 5.1.1. A 16:2 MUX feeds even/odd latch shift registers clocked at 4 GHz (half rate); the five taps d-1 to d3 each drive a chosen number of the 25 parallel CMOS inverters; series pass-transistor resistors set 50 Ω."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.6cm,minimum width=0.6cm,align=center,fill=white}]
  \node[b,minimum width=1.0cm,minimum height=2.2cm] (mux) at (0,0) {16:2\\MUX};
  \draw[->] (-1.2,0) node[left] {16} -- (mux);
  \foreach \i in {0,...,4} {
    \node[b] (le\i) at ({1.6+1.2*\i},0.6) {L};
    \node[b] (lo\i) at ({1.6+1.2*\i},-0.6) {L};
  }
  \draw (mux.east|-0,0.6) -- (le0); \draw (mux.east|-0,-0.6) -- (lo0);
  \foreach \i/\j in {0/1,1/2,2/3,3/4} { \draw[->] (le\i) -- (le\j); \draw[->] (lo\i) -- (lo\j); }
  \foreach \i/\t in {0/{d_{-1}},1/{d_0},2/{d_1},3/{d_2},4/{d_3}} {
    \draw (le\i.north) -- ++(0,0.5) node[above] {$\t$};
  }
  \node at (4.0,-1.4) {half-rate latch shift register (even / odd), 4 GHz clock};
  \node[b,minimum width=3.4cm,minimum height=1.9cm] (sel) at (9.6,0.2) {tap select:\\each of 25 CMOS\\inverters is driven\\by one of $d_{-1}\ldots d_3$\\(count = tap weight)};
  \draw[->] (le4.east) -- (sel.west|-0,0.6);
  \draw[->] (lo4.east) -- (sel.west|-0,-0.6);
  \node[b,minimum width=2.0cm,minimum height=1.6cm] (inv) at (13.0,0.2) {25 inverters\\in parallel\\(SST driver)};
  \draw[->] (sel) -- (inv);
  \node[b,minimum width=1.6cm] (zc) at (13.0,-1.7) {pass-transistor\\$R$ (impedance\\control)};
  \draw (inv) -- (zc);
  \draw[->] (zc.east) -- ++(0.8,0) node[right,align=left] {out-p / out-n\\(8 Gb/s, 50 $\Omega$)};
\end{circuitikz}
\end{document}
```

- 90 nm, 1.2 V, half rate (4 GHz clock, 8 Gb/s). TX 101 mW and 0.138 mm²; RX 131 mW. Four TX/RX pairs share one PLL.
- The FFE *is* the slicing: 25 identical inverters, tap weights = inverter counts. Output jitter 1.63 ps rms with a 1.57 ps rms reference.
- Link: 160 cm FR4 backplane, −36.8 dB at 4 GHz, BER < $10^{-12}$; post-DFE horizontal eye 13 ps (0.11 UI) at $10^{-12}$.

> [!warning] File name vs content
> The local file is named `high_voltage_vm_driver_fukuda_isscc_2008.pdf`, but the paper (ISSCC 2008 paper 5.1) is the 8 Gb/s transceiver with a 5-tap inverter-based FFE described above. It contains no high-voltage driver. The high-voltage voltage-mode material in this note comes from Kossel and from Palermo L5's swing-enhancement slides.

### Kossel 2008: T-Coil-Enhanced High-Swing SST

```tikz title="Kossel et al. 2008, redrawn from Figs. 4–7. A 1.0 V thin-oxide pre-driver does 4:2 multiplexing, the 2-tap FIR and per-weight main/post selection; level shifters cross to 1.5 V thick-oxide output slices whose stacked clock/data FETs form the final 2:1 MUX; a T-coil and SCR ESD sit at the pad. The clock path restores duty cycle and is delay-matched to the data instead of retiming each slice."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.9cm,align=center,fill=white}]
  \draw[dashed,gray] (-0.9,-2.9) rectangle (6.9,2.1);
  \node[gray!70!black,anchor=north west] at (-0.9,2.1) {thin oxide, 1.0 V pre-driver};
  \draw[dashed,gray] (7.2,-2.9) rectangle (12.5,2.1);
  \node[gray!70!black,anchor=north west] at (7.2,2.1) {thick oxide, 1.5 V};
  \node[b,minimum width=1.1cm] (m42) at (0,0) {4:2\\MUX};
  \draw[->] (-1.6,0) node[left] {$d\langle1{:}4\rangle$} -- (m42);
  \node[b,minimum width=1.3cm] (fir) at (1.8,0) {FIR shift\\reg.\ (2 taps)};
  \node[b,minimum width=1.6cm] (tw) at (3.9,0) {$2\times5$ 2:1 MUX\\main or post\\per weight};
  \node[b,minimum width=1.2cm] (rt) at (5.9,0) {retime +\\buffers};
  \draw[->] (m42) -- (fir); \draw[->] (fir) -- (tw); \draw[->] (tw) -- (rt);
  \draw[->] (3.9,1.25) node[above] {5 b tap-weight code} -- (tw.north);
  \node[b,minimum width=1.0cm] (ls) at (8.0,0) {level\\shift};
  \draw[->] (rt) -- node[above] {$2{\times}5$} (ls);
  \node[b,minimum width=2.6cm,minimum height=1.5cm] (sl) at (10.3,0) {22 tri-statable slices\\each: 5 binary SST\\subslices 16,8,4,2,1\\(stacked clk/data FETs\\= final 2:1 MUX)};
  \draw[->] (ls) -- (sl);
  \draw[->] (11.0,-1.6) node[below,align=center] {slice enable: 18 of 22\\give 50 $\Omega$} -- (11.0,-0.75);
  \node[b,minimum width=1.3cm] (tc) at (13.6,0) {T-coil\\+ SCR ESD};
  \draw[->] (sl) -- (tc);
  \draw[->] (tc) -- ++(1.2,0) node[right,align=left] {8.5 Gb/s\\$>1$ V eye};
  % clock path
  \node[b,minimum width=2.0cm] (dcc) at (0.4,-2.0) {cap.-degenerated\\CML buffer (DCC)};
  \node[b,minimum width=1.2cm] (c2c) at (2.8,-2.0) {CML to\\CMOS};
  \node[b,minimum width=1.4cm] (db) at (5.3,-2.0) {d-buf (delay\\matched to data)};
  \draw[->] (-1.6,-2.0) node[left] {ck2 (CML)} -- (dcc); \draw[->] (dcc) -- (c2c); \draw[->] (c2c) -- (db);
  \draw[->] (db.east) -- (9.0,-2.0) |- ([yshift=-0.45cm]sl.west);
  \node[b] (dv) at (2.8,-0.95) {$\div2$};
  \draw[->] (c2c) -- (dv); \draw[->] (dv.west) -| node[pos=0.7,left] {ck4} (m42.south);
\end{circuitikz}
\end{document}
```

- **Half-bit-rate SST:** each branch has a clock FET and a data FET in series, so the last 2:1 MUX lives inside the termination, symmetric to P/N slew mismatch.
- **Impedance and FFE decoupled:** 22 tri-statable slices (18 enabled for 50 Ω), each with 5 binary sub-slices assigned to main or post tap ([[#Voltage-mode FFE]]). 5-bit 2-tap de-emphasis, 24.2 mV steps. Slices can also be set static high or low for **amplitude margining** without changing the impedance.
- **Level shifter** 1.0 → 1.5 V: cross-coupled PMOS plus inverter-like feed-forward devices that pre-bias the output so the small PMOS switch fast; P1/P2 thresholds must exceed the level-shift amount to avoid leakage.
- **Results:** >1.0 V eye at up to 8.5 Gb/s, 96 mW (linear in data rate), return loss <−16 dB to 10 GHz, DCD restoration 5×, CM noise <10 mV rms, 180 × 360 µm. At 7.5 Gb/s total jitter was 16.6 ps, 80 % of it deterministic (mostly ISI), with RJ about 1.8 mUI rms. Running both channels raised ISI jitter by 33 % (crosstalk).

### Lee 2015: 56 Gb/s PAM4 and NRZ Transmitters

```tikz title="Lee et al. 2015 PAM4 TX, redrawn from Figs. 3 and 4. Two 28 Gb/s streams each run through a 3-tap half-rate FFE (DFF delay line, taps as tail currents α_k I_SS); combiner II carries twice the current of combiner I; both sum on distributed peaking lines at D_out. An EML linearizer moves the 2:1 ratio for optical pre-distortion."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.6cm,minimum width=0.6cm,align=center,fill=white}]
  \node[b,minimum width=4.8cm] (cA) at (3.2,0.55) {combiner II (2X): CML pairs, tails $\alpha_kI_{SS}$};
  \node[b,minimum width=4.8cm] (cB) at (3.2,-0.55) {combiner I (1X): CML pairs, tails $\alpha_kI_{SS}$};
  \foreach \y/\n/\d/\s/\c in {1.9/A/{D_{inA}}/1/cA,-1.9/B/{D_{inB}}/-1/cB} {
    \foreach \i in {0,1,2} { \node[b] (f\n\i) at ({1.2+1.6*\i},\y) {DFF}; }
    \draw[->] (-0.2,\y) node[left] {$\d$, 28 Gb/s} -- (f\n0);
    \draw[->] (f\n0) -- (f\n1); \draw[->] (f\n1) -- (f\n2);
    \foreach \i/\a in {0/{-1},1/{0},2/{1}} {
      \coordinate (t) at ($(f\n\i.east)+(0.2,0)$);
      \draw (f\n\i.east) -- (t) node[circ]{};
      \draw[->] (t) -- (t|-\c.\ifnum\s>0 north\else south\fi) node[pos=0.5,right] {$\alpha_{\a}$};
    }
  }
  \draw[thick] (cA.east) -- (6.3,0.55) -- (6.3,-0.55) -- (cB.east);
  \draw[->,thick] (6.3,0) -- (7.6,0) node[right,align=left] {$D_{out}$, 56 Gb/s PAM4\\currents add on distributed\\$L_D$/$L_G$ lines + $L_{1,2}$ peaking};
  \node[b,minimum width=2.2cm] (eml) at (7.6,2.4) {EML linearizer: iDACs\\set $I_{MSB}{:}I_{LSB}\neq2{:}1$};
  \node[b] (ts) at (10.4,2.4) {temp.\\sensor};
  \draw[->] (ts) -- (eml);
  \draw[->] (eml.south) |- (6.0,1.15) -- (6.0,0.85);
  \draw[->] (eml.south) ++(0.4,0) -- ++(0,-0.5) -| (6.75,-1.2) -| (6.0,-0.85);
  \node[b,minimum width=3.4cm] (pll) at (3.2,-3.4) {28 GHz PLL: SSB-mixer PFD, CP,\\sub-harmonic injection, $\div56$};
  \draw[->] (-0.2,-3.4) node[left] {500 MHz ref} -- (pll);
  \draw[->] (pll.east) -- ++(0.5,0) node[right] {CK 28 GHz to all DFFs (half rate)};
  \node[align=left,anchor=west] at (7.2,-2.2) {taps $[\alpha_{-1},\alpha_0,\alpha_1]$ up to\\$[-0.215,0.6,-0.185]$: 9 dB boost};
\end{circuitikz}
\end{document}
```

- **PAM4 TX:** 28 GHz PLL (SSB-mixer PFD, sub-harmonic injection locking; 500 fs rms; 26.9–28.5 GHz; loop bandwidth 2.7 MHz with $\zeta=1$ chosen from measured noise). All high-speed paths longer than 100 µm are transmission lines.
- **Combiner:** CML pairs $M_1$–$M_3$ = 4, 48, 4 µm / 0.06 µm, $R=60$ Ω, $I_{SS}=12$ mA, $L_D$ and $L_G$ between taps absorb $C_{gs}$ and $C_{db}$, $L_{1,2}=130$ pH load peaking. The peaking must be exact: an overshoot (under-damped) or long tail (over-damped) is deterministic ISI the RX can't fully undo (a DFE only removes post-cursors). Fig. 5(b) shows 220 pH flat vs 400 pH overshooting.
- **Measured:** 20–80 % rise/fall 6.8 ps, swing 250 mV, vertical rms ISI 3.4 mV, eye SNR 19.8 dB, <1 to >62 Gb/s. PAM4 TRX 710 mW (TX 290 mW).
- **FFE:** "tunable up to 9 dB" with $[\alpha_{-1},\alpha_0,\alpha_1]=[-0.215,0.6,-0.185]$, about 9 dB measured.

> [!warning] Unverified: the 9 dB figure
> These taps give $\sum w_k=0.2$, a DC-to-Nyquist ratio of 14 dB by [[Equalization#The FIR and its frequency response]]. The paper quotes "up to 9 dB" for this setting and about 9 dB measured. The gap may be the driver's finite bandwidth or a different definition of "boost"; the paper doesn't say. The combiner table lists $L_{1,2}=130$ pH while Fig. 5(b) labels the flat case 220 pH; I could not reconcile these from the text.

```tikz title="Lee et al. 2015 NRZ TX, redrawn from Fig. 10. Two 4:2 stages produce D28,I and D28,II; a dynamic phase aligner (M1 as XOR on delayed data, phase interpolator, M2, V/I) locks the 28 GHz clock to the data so the retiming latches and the distributed 2:1 selector sample in the 8–10 ps window despite 15–20 ps PVT drift."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.7cm,align=center,fill=white}]
  \node[b,minimum width=1.4cm] (a) at (0,1.0) {latches +\\2:1 (14 GHz)};
  \node[b,minimum width=1.4cm] (bb) at (0,-1.0) {latches +\\2:1 (14 GHz)};
  \draw[->] (-1.7,1.25) node[left] {$D_{in0}$} -- ([yshift=0.25cm]a.west);
  \draw[->] (-1.7,0.75) node[left] {$D_{in1}$} -- ([yshift=-0.25cm]a.west);
  \draw[->] (-1.7,-0.75) node[left] {$D_{in2}$} -- ([yshift=0.25cm]bb.west);
  \draw[->] (-1.7,-1.25) node[left] {$D_{in3}$} -- ([yshift=-0.25cm]bb.west);
  \node at (-2.6,0) {4$\times$14 Gb/s};
  \node[b,minimum width=1.3cm] (ra) at (3.6,1.0) {retiming\\latches};
  \node[b,minimum width=1.3cm] (rb) at (3.6,-1.0) {retiming\\latches};
  \draw[->] (a) -- node[above] {$D_{28,I}$} (ra); \draw[->] (bb) -- node[below] {$D_{28,II}$} (rb);
  \node[b,minimum width=2.2cm,minimum height=1.5cm] (sel) at (6.6,0) {distributed\\2:1 selector\\(3 stages, 50 $\Omega$\\M9-over-M1 lines)};
  \draw[->] (ra.east) -- ++(0.3,0) |- ([yshift=0.4cm]sel.west);
  \draw[->] (rb.east) -- ++(0.3,0) |- ([yshift=-0.4cm]sel.west);
  \draw[->] (sel) -- ++(1.6,0) node[right,align=left] {56 Gb/s NRZ\\(no ESD: on-chip\\50 $\Omega$ load only)};
  \draw[dashed,thick,fill=gray!8] (1.6,-4.6) rectangle (5.7,-2.5);
  \node[anchor=north west] at (1.6,-4.65) {dynamic phase aligner (linear, unconditionally stable)};
  \node[draw,circle,inner sep=1pt,fill=white] (m1) at (2.3,-3.8) {$\times$};
  \node[above] at (m1.north) {M1};
  \node[draw,circle,inner sep=1pt,fill=white] (m2) at (3.6,-3.8) {$\times$};
  \node[above left] at (m2.north) {M2};
  \node[b] (pi) at (4.9,-3.0) {PI};
  \node[b] (vi) at (4.9,-3.95) {V/I};
  \draw[->] (m1) -- (m2); \draw[->] (m2) -- (vi);
  \draw[->] (vi) -- (pi);
  \draw[->] (pi.west) -| (m2.north);
  \draw[->] (bb.south) |- node[pos=0.3,left] {$+\Delta T_3$} (m1.west);
  \draw (pi.north) -- (4.9,-1.9) node[circ]{};
  \draw[->] (4.9,-1.9) -| (sel.south);
  \draw[->] (4.9,-1.9) -| (rb.south);
  \draw[->] (4.9,-1.9) -- (2.7,-1.9) -- (2.7,0.3) -| (ra.south);
  \node[above] at (5.7,-1.9) {$CK_{28}$};
  \node[b,minimum width=1.6cm] (pll) at (7.6,-3.0) {56 GHz PLL\\$\div2$: 28 GHz};
  \draw[->] (pll.west) -- (pi.east);
\end{circuitikz}
\end{document}
```

- **NRZ TX (56 GHz PLL):** 4:1 tree, quarter-rate PRBS $2^7-1$, phase aligner before the last stage, final 2:1 selector as a 3-stage distributed amplifier with 50 Ω M9-over-M1 microstrips of equal group velocity; $S_{11},S_{22}<-10$ dB to 70 GHz; three stages optimal given line loss and $f_T$. No ESD at the output. NRZ TRX 670 mW (TX 450 mW).

### Won 2024: 28/56 Gb/s NRZ/PAM4 Dual-Mode TX

```tikz title="Won and Kim 2024, redrawn from Figs. 1, 2 and 6. The mode selector splits 8 PRBS bits into MSB and LSB; the LSB flip-flops are held in reset in NRZ mode, so the whole LSB path is idle. Four MSB slices (2×) and four LSB slices (1×) of tail-less CML are each active for 1 UI and summed in current at the pad: a 4:1 current-domain MUX."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[b,minimum width=1.6cm,minimum height=2.6cm] (prbs) at (0,0) {4-way\\QPRBS13\\@ 7 GHz\\(4 UI wide)};
  \node[b,minimum width=1.0cm] (dfm) at (2.4,0.8) {DFM\\(never\\reset)};
  \node[b,minimum width=1.0cm] (dfl) at (2.4,-0.8) {DFL\\(reset\\if NRZ)};
  \draw[->] (prbs.east|-0,0.8) -- node[above] {4} (dfm);
  \draw[->] (prbs.east|-0,-0.8) -- node[below] {4} (dfl);
  \draw[->] (2.4,-2.0) node[below] {SEL} -- (dfl.south);
  \node[b,minimum width=2.4cm] (pm) at (5.2,0.8) {$\times4$ 1-UI data +\\eye-boost pulse gen.};
  \node[b,minimum width=2.4cm] (pl) at (5.2,-0.8) {$\times4$ 1-UI data +\\eye-boost pulse gen.};
  \draw[->] (dfm) -- node[above] {MSB} (pm); \draw[->] (dfl) -- node[below] {LSB} (pl);
  \node[b,minimum width=1.9cm,fill=orange!10] (dm) at (8.4,0.8) {$4\times$ MSB slice\\tail-less CML, 2$\times$};
  \node[b,minimum width=1.9cm,fill=orange!10] (dl) at (8.4,-0.8) {$4\times$ LSB slice\\tail-less CML, 1$\times$};
  \draw[->] (pm) -- (dm); \draw[->] (pl) -- (dl);
  \draw (dm.east) -- (10.0,0.8) -- (10.0,-0.8) -- (dl.east);
  \draw (10.0,0) -- (10.6,0) node[circ]{};
  \draw (10.6,0) to[R,l_=$R_T$] (10.6,1.9) node[above,align=center] {$VDD_{High}$: 1.4 V PAM4,\\1.2 V NRZ};
  \draw[->] (10.6,0) -- (11.4,0) node[right,align=left] {$TX_{OUT}$, 28 GBd:\\56 Gb/s PAM4 or\\28 Gb/s NRZ};
  \node[b,minimum width=2.6cm] (dll) at (5.2,-2.6) {quad-phase DLL + QEC\\(foreground, cap-DAC delay)};
  \draw[->] (1.5,-2.6) node[left] {ext.\ 7 GHz} -- (dll);
  \draw[->] (dll.north) -- node[left,align=right] {3 adjacent of\\4 phases per slice} (pl.south);
  \node[align=left,anchor=north west] at (8.0,-1.6) {4:1 current-domain MUX:\\the 4 slices per path are\\summed at the pad, each\\active for 1 UI};
\end{circuitikz}
\end{document}
```

- 28 nm, 28 GBd, $VDD_{High}$ = 1.4 V (PAM4) or 1.2 V (NRZ) on the termination; 0.0344 mm².
- **Clocks:** external 7 GHz → quad-phase DLL with foreground QEC; each pulse generator uses three adjacent phases ($CK_R$, $CK_D$, $CK_P$) to make a 1-UI data pulse and a 1-UI-early eye-boost pulse.
- **Energy:** PAM4 78.29 mW = 1.4 pJ/b (drivers 60 %, pulse generators 21 %, DLL + QEC 17 %, PRBS + mode select 2 %); NRZ 51.74 mW = 1.84 pJ/b; without clocking 1.1 and 1.3 pJ/b. RLM 97 %.
- **Lesson for the architecture:** at 28 GBd the driver and the clocking split the power roughly 60/40; turning off a path in the lower-rate mode is worth more than shaving the driver.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| CML → SST driver | Signaling current up to 4× lower; any RX common mode | Impedance control loop, pre-driver $CV^2f$, harder FFE, supply-dependent current |
| Wider SST switch (smaller $R_{on}$ share) | $R_{out}$ linearity and PVT stability, $R_{LM}$ | Pre-driver load and power, pad capacitance |
| More slices (finer impedance trim) | Calibration range and step | Area, pad capacitance, pre-driver sized for the maximum |
| More tap bits | FFE accuracy | Segment logic (VM), IDAC area (CM); DNL eventually limits (Wong: 4 b was enough) |
| More taps | Longer ISI cancelled | Output capacitance (direct FIR), more DAC levels; usually ≤4 taps (Lee) |
| Segmented DAC instead of direct FIR | Smallest output devices and $C_{out}$, any filter | LUT, highest power and complexity |
| Higher swing (HV supply, thick oxide, bleeder) | Reach over lossy channels | Reliability limits, level shifters, linearity for PAM4 |
| Half → quarter rate | Lower clock frequency (2 FO4 bit possible) | Four phases to match (QEC), wider final MUX |
| MUX at the pad (current-domain) | Each slice runs at sub-rate; less on-chip bandwidth needed | Phase-spacing sensitivity, more slices on the pad |
| Retiming before the last MUX | Timing robust to PVT | Power per slice; at 56 Gb/s needs a dynamic aligner |
| Delay-matched clock (no retiming) | Power | Max rate capped by fixed delay (Kossel) |
| Slew-rate control (⅓ UI) | Less ringing, crosstalk, SSO | ~6 % ISI |
| T-coil at the pad | Return loss and bandwidth | Area (40 × 40 µm), series R, ESD current through $L_b$ |
| PAM4 instead of NRZ | Half the Nyquist | ⅓ eye, $R_{LM}$ and MSB/LSB skew must be controlled |
| Dual-mode with LSB path off | NRZ energy only 31 % worse than PAM4 (Won) | Mode-select logic |

## Cheat sheet

| Quantity | Equation |
|---|---|
| CML swing, current | $V_{d,pp}=IZ_0$, $I=V_{d,pp}/Z_0$ |
| SST swing, current (diff. RX) | $V_{d,pp}=V_S$, $I=V_{d,pp}/(4Z_0)$ |
| SST branch | $R_{on}+R_T=Z_0$ |
| Driver power | CML $V_{DD}V_{d,pp}/Z_0$; SST $V_{d,pp}^2/(4Z_0)$ |
| CML headroom | $V_{d,pp}\le2(V_{DD}-V_{D,sat,tail}-V_{OV,sw})$ |
| NMOS pull-up SST limit | $V_S<\tfrac43(V_{DD}-V_t-V_{OD})$ diff.; $V_S<2(V_{DD}-V_t-V_{OD})$ SE |
| CMOS pull-up SST | $V_S>\lvert V_{t}\rvert +V_{OD}$ |
| FET termination | $R_{FET}=1/(\mu C_{ox}\tfrac WL(V_{GS}-V_t))$ |
| Mismatch reflection | $\lvert \Gamma\rvert =\lvert R_{out}-Z_0\rvert /(R_{out}+Z_0)$ |
| Slice impedance | $Z_{out}=R_{slice}/K$ ($K$ enabled slices) |
| Direct FIR output | $V_{out}(0)=[\sum_kI_kD(-k)]\,R_T/2$ |
| De-emphasis from weights | $\text{DE}=-20\log_{10}\frac{w_{main}-w_{post}}{w_{main}+w_{post}}$ |
| Amplitude step | $V_{pp}/(2^b-1)$ |
| Wong 2-tap | $Y[n]=X[n]-\alpha X[n-1]$, repeated bit $(1-\alpha)V_S$ |
| Serializer speed | $T_{b,min}\approx8\,\text{FO4}/M$, $T_b\ge2$ FO4 |
| Half-rate duty error | $\text{UI}_{e,o}=2D,\ 2(1-D)$ UI; loss $(2D-1)$ UI |
| PAM4 weighting | levels $\pm(2+2\varepsilon)\pm1$ |
| $R_{LM}$ vs $\varepsilon$ | $1/(1+2\varepsilon/3)$ for $\varepsilon>0$; $(3-6\lvert \varepsilon\rvert )/(3-2\lvert \varepsilon\rvert )$ for $\varepsilon<0$ |
| Pad capacitance for −7 dB | $C_{tot}\le1/(2\pi f_NZ_0)$ (owned by Smith Chart and Impedance Matching) |
| Slew target | $t_r\approx\tfrac13$ UI → 6 % ISI |

## References

- **Palermo, ECEN720 Lecture 5** (`lecture5_ee720_termination_txdriver.pdf`), Spring 2025: slides 6–12 (termination: on/off chip, series/parallel/double, AC/DC, resistor table, active and adjustable termination, digital control loop), 15–24 (single-ended vs differential, controlled-impedance drivers, push-pull, CML, current levels, CM vs VM summary, VM low/high swing), 26–32 (swing enhancement: Upadhyaya, Kim, Steffan, Ali, Joy, Bassi), 34–40 (impedance control: Chan, Poulton, Song, segmented, hybrid), 42–48 (pad network, T-coil, π-coil), 50–53 (slew-rate control, CML and VM driver examples), 55–66 (speed limits, full/half/quarter-rate MUX, clock distribution, CMOS/CML MUX, output- vs input-multiplexed).
- **Palermo, ECEN720 Lecture 7** (`lecture7_ee720_eq_intro_txeq.pdf`): slides 23–29 (tap resolution, direct FIR vs segmented DAC, Rylyakov, Casper, VM FIR #1 and #2, hybrid VM/CM) and the ISSCC 2014 26.5 impedance-modulated slides 9–15.
- **K.-L. J. Wong et al., "A 27-mW 3.6-Gb/s I/O Transceiver," JSSC 39(4), 2004** (`voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`): §II (Figs. 3–5, Table I), §III (Figs. 6–12, Eq. 1, worked example $\alpha=3/15$), §VI (Table III, Figs. 24–26).
- **J. Won, J. Kim, "A 28/56 Gb/s NRZ/PAM-4 Dual-Mode Transmitter …," Electronics 13, 3774, 2024** (`electronics-13-03774.pdf`): §2–4, Figs. 1–8, Table 1.
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," JSSC 50(9), 2015** (`56G_NRZPAM4_J.pdf`): §II (Fig. 1), §III-A (Figs. 3–6, Eq. 1), §IV-A (Figs. 10–11), §V (Figs. 16–17, 20; power).
- **Zhang et al., "PAM4 Signaling for 56G Serial Link Applications," DesignCon 2016** (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`): slides 36–37 (MSB/LSB skew and driver mismatch), 51–52 (PAM4 TX FIR implementations, 64 levels), 82–83 ($R_{LM}$ definition and causes).
- **K. Fukuda et al., "An 8Gb/s Transceiver with 3×-Oversampling 2-Threshold Eye-Tracking CDR Circuit for −36.8dB-loss Backplane," ISSCC 2008, paper 5.1** (`high_voltage_vm_driver_fukuda_isscc_2008.pdf`): TX description and Fig. 5.1.1, measurements and power.
- **M. Kossel et al., "A T-Coil-Enhanced 8.5 Gb/s High-Swing SST Transmitter in 65 nm Bulk CMOS …," JSSC 43(12), 2008** (`tcoil_sst_tx_kossel_jssc_2008.pdf`): §II–IV (Figs. 1–9), §V (ESD, capacitance budget), §VI (Figs. 17–24, Table II).
- Not used: Palmer et al., "A 14 mW 6.25 Gb/s transceiver" (JSSC 2007), listed in the learning path, is not in `ref/SerDes/`; Poulton JSSC 2007 appears here only through Palermo L5 slide 35.
