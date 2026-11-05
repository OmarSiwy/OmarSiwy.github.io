---
title: High-Speed Circuit Techniques
description: The circuits every SerDes block is built from at tens of Gb/s. CML gates whose speed is set by f_T, swing and fan-out rather than current; inductive peaking, T-coils, distributed and Cherry-Hooper stages that stretch their bandwidth; the RC-degenerated pair that is the CTLE's core; and TSPC/CML latches, flip-flops and dividers.
kind: topic
status: growing
aliases:
  - High-Speed Circuit Techniques
  - CML
  - Current-Mode Logic
  - Bandwidth Extension
  - Inductive Peaking
  - Shunt Peaking
  - T-coil
  - Cherry-Hooper
  - TSPC
---

Note S5 of the [[SerDes Learning Path]]. [[Channels]], [[Signaling and BER]], [[Link Noise and Jitter]] and [[Equalization]] set what the link needs. This note owns the **circuit techniques shared by the TX, RX and clock path**: current-mode logic (CML) gates, latches, MUXes and dividers at the transistor level, how fast a CML stage can be and why, the bandwidth-extension tricks (inductive peaking, T-coils, distributed stages, active inductors, neutralization, Cherry-Hooper), the RC-degenerated pair that the CTLE is built on, and TSPC/CMOS flip-flops and dividers. Architectures (serializer trees, driver types, CTLE placement) belong to [[Transmitters]], [[Receivers]], [[Equalization]] and [[Clocking and CDR]].

## The big picture

```tikz title="A CML buffer with shunt-peaking inductors (left) and the normalized load transimpedance it produces (right, exact curves of Shekhar Eq. 2): the inductor buys up to 1.84 times the RC bandwidth. After Razavi Fig. 4.7 and Shekhar Figs. 3, 5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % CML buffer
  \draw (0,0) node[nmos](M1){};
  \draw (2.6,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in}^+$};
  \node[right] at (M2.G) {$V_{in}^-$};
  \draw (M1.S) |- (1.3,-1.1) -| (M2.S);
  \draw (1.3,-1.1) node[circ]{} to[I, l=$I_{SS}$] (1.3,-2.8) node[ground]{};
  \draw (M1.D) -- (0,1.4) to[R, l=$R$] (0,2.6) to[L, l=$L$] (0,3.8) -- (2.6,3.8) to[L, l_=$L$] (2.6,2.6) to[R, l_=$R$] (2.6,1.4) -- (M2.D);
  \draw (1.3,3.8) node[circ]{} -- (1.3,4.1) node[above]{$V_{DD}$};
  \draw (0,1.4) node[circ]{} -- (-2.3,1.4) node[left]{$V_{out}^-$};
  \draw (2.6,1.4) node[circ]{} -- (4.9,1.4) node[right]{$V_{out}^+$};
  \draw (-1.9,1.4) node[circ]{} to[C, l_=$C$] (-1.9,0) node[ground]{};
  \draw (4.5,1.4) node[circ]{} to[C, l=$C$] (4.5,0) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (-1.6,-3.9) {swing per side $V_{sw}=I_{SS}R$\\ gain $A=g_mR=(g_m/I_D)\,V_{sw}/2$\\ $\tau=RC$, $f_{-3\mathrm{dB}}=(1-k)f_T/(A\cdot\mathrm{FO})$};
  % Bode of shunt peaking
  \begin{scope}[xshift=7.4cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (6.4,0) node[right,font=\scriptsize] {$\omega/\omega_0$ (log)};
    \draw[->] (0,0) -- (0,4.6) node[above,font=\scriptsize] {$|Z|/R$ (dB)};
    % y: 0 dB at 3.6, 1 dB = 0.3
    \foreach \d in {0,-3,-6,-9} {\draw (0.08,{3.6+0.3*\d}) -- (-0.08,{3.6+0.3*\d}) node[left,font=\scriptsize] {\d};}
    \foreach \t/\l in {0/0.1,3/1,6/10} {\draw (\t,0.08) -- (\t,-0.08) node[below,font=\scriptsize] {\l};}
    \draw[dashed,gray] (0,{3.6-0.9}) -- (6,{3.6-0.9});
    \begin{scope}
      \clip (0,0) rectangle (6.2,4.5);
      \draw[thick,black,domain=0:6,samples=80] plot (\x,{3.6+0.3*10*log10(1/(1+exp(2*2.302585*(\x/3-1))))});
      \draw[thick,blue!70!black,domain=0:6,samples=120] plot (\x,{3.6+0.3*10*log10((1+exp(2*2.302585*(\x/3-1))/2)/((1-exp(2*2.302585*(\x/3-1))/1.41421)^2+exp(2*2.302585*(\x/3-1))))});
      \draw[thick,red!70!black,domain=0:6,samples=120] plot (\x,{3.6+0.3*10*log10((1+exp(2*2.302585*(\x/3-1))/5.8284)/((1-exp(2*2.302585*(\x/3-1))/2.41421)^2+exp(2*2.302585*(\x/3-1))))});
    \end{scope}
    \node[font=\scriptsize,anchor=west] at (0.1,1.25) {no $L$: $\omega_0=1/RC$};
    \node[font=\scriptsize,anchor=west,blue!70!black] at (0.1,0.85) {$m=\sqrt2$: $\times1.84$, +1.5 dB};
    \node[font=\scriptsize,anchor=west,red!70!black] at (0.1,0.45) {$m=1+\sqrt2$: $\times1.72$, flat};
    \node[font=\scriptsize] at (3.2,4.75) {$m=R^2C/L$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **A CML gate is a differential pair that fully steers its tail $I_{SS}$ into resistors.** Swing per side $V_{sw}=I_{SS}R$. Small-signal gain at the crossing $A=g_mR=(g_m/I_D)\,V_{sw}/2$, and the gate restores logic levels only if $A\gtrsim\sqrt2$. Keeping the "on" device saturated caps $V_{sw}\lesssim V_{TH}$.
> 2. **Its bandwidth does not depend on current.** $f_{-3\text{dB}}=(1-k)\,f_T/(A\cdot\text{FO})$: current only scales the gate to its load. Speed comes from $f_T$, so a CML pair runs at **low** $g_m/I_D$ (high $f_T$), as low as the swing allows. Maximizing $g_m/I_D$ is the wrong goal here.
> 3. **CML vs CMOS:** a CMOS clock buffer chain cannot carry a period much below 6–8 FO4, and a CMOS 2:1 MUX bottoms out near a 2 FO4 bit. CML is faster (low swing, little self-loading) but burns $V_{DD}I_{SS}$ whether or not data toggles.
> 4. **Inductive peaking:** shunt peaking with $L=R^2C/m$ gives $1.84\times$ the bandwidth ($m=\sqrt2$, 1.5 dB peak) or $1.72\times$ flat ($m=1+\sqrt2$). Splitting the capacitance with series inductors and T-coils reaches $3$–$5\times$ in theory, $3.0$–$4.1\times$ measured (Shekhar). Which one wins depends on $k_C=C_{drain}/C_{total}$.
> 5. **The RC-degenerated pair is the CTLE:** a zero at $1/(R_SC_S)$ and a pole at $(1+g_mR_S/2)/(R_SC_S)$ give peaking $1+g_mR_S/2$, bought by lowering DC gain. The peak is capped by the same $g_m/C$ that limits a CML buffer.
> 6. **Latches and dividers:** a CML latch is a tracking pair plus a cross-coupled pair that holds when $g_mR>1$. A CML $\div2$ passes through two gates per input cycle, a TSPC $\div2$ through three; TSPC burns no static power but needs full-swing clocks and fails at low frequency.

**Map:** [[#Spec translation|data rate → swing, $I_{SS}$, $R$, $C$, $L$, $g_m/I_D$]] → [[#Level 0 CML or CMOS|CML vs CMOS, FO4 limits]] → [[#Level 1 CML Circuits|buffer, latch, flip-flop, MUX, XOR, tail-less]] → [[#Level 2 The Gain-Bandwidth Limit of a CML Stage|$f_T$-limited GBW]] → [[#Level 3 Bandwidth Extension|peaking, T-coils, distributed, active $L$, neutralization, Cherry-Hooper]] → [[#Level 4 The RC-Degenerated Stage|RC degeneration (CTLE core)]] → [[#Level 5 TSPC and CMOS Flip-Flops and Dividers|TSPC, dividers, pulse generators]].

## Spec translation

These blocks are not amplifiers in the op-amp sense: a CML gate is a pair driven hard from one rail to the other. But every one of them is a differential pair with a resistive load, so its specs map one-to-one onto the amplifier specs of [[Single-Stage#Amplifier Specifications]] and from there onto $g_m/I_D$, $L$ and $I_D$.

### The block's specs

| Block spec | Meaning | Typical source of the number |
|---|---|---|
| Data rate $R_b$, UI $=1/R_b$, Nyquist $f_N=R_b/2$ | What the gate must pass (NRZ; for PAM4 use the symbol rate) | [[Channels]]: 56 Gb/s NRZ gives UI = 17.9 ps, $f_N=28$ GHz |
| Rise time $t_r$ (10–90 %) | Edge speed; too slow closes the eye horizontally, too much peaking rings | Won: 16.85 ps diff. rise time, 28 Gb/s NRZ mode (Fig. 5) |
| Swing $V_{sw}$ | Enough to fully switch the next gate, small enough for headroom | Lee: $|V_{out}|=I_{SS}R$, 2.5 mA needs >300 mV in (LSB decoder) |
| Logic restoration | The output reaches full swing from the previous gate's swing | Gain at the crossing, see below |
| Maximum toggle / clock rate | Latch, FF, divider and MUX select | FO4 rules, Palermo L5 |
| Power / energy per bit | $V_{DD}I_{SS}$ per CML gate, independent of rate | pJ/bit in [[Transmitters]] |
| Duty cycle, jitter added | Clock buffers and dividers | [[Link Noise and Jitter]] |

### Mapping block specs to amplifier specs

| Block spec | Device / sub-circuit | Amplifier spec that sets it | Result |
|---|---|---|---|
| $R_b$, $t_r$ | Each CML stage: pair + $R$ + $C$ | $-3$ dB bandwidth (one pole $1/RC$) | $f_{-3\text{dB}}\gtrsim f_N$; $t_r=0.35/f_{-3\text{dB}}$ |
| Logic restoration | Switching pair | DC (small-signal) gain at the crossing | $A=g_mR\ge\sqrt2$ (square law) |
| Swing | $R$, $I_{SS}$ | Output swing | $V_{sw}=I_{SS}R\le V_{TH}$ (on device saturated) |
| Bandwidth at given gain | Pair device | GBW $=A\,f_{-3\text{dB}}=(1-k)f_T/\text{FO}$ | sets $f_T$, hence $g_m/I_D$ and $L$ |
| Peaking for more bandwidth | Load network | Bandwidth extension ratio, ripple | $L=R^2C/m$ |
| Power | Tail | Bias current | $P=V_{DD}I_{SS}$ |
| Common-mode levels | $R$, $I_{SS}$ | Output CM $=V_{DD}-V_{sw}/2$; input CM range of the next pair | tail $V_{DS}\ge V_{D,sat}$ |

$$
\boxed{A=g_mR=\frac{g_m}{I_D}\cdot\frac{V_{sw}}{2}\ge\sqrt2,\qquad V_{sw}=I_{SS}R\le V_{TH},\qquad f_{-3\text{dB}}=\frac{(1-k)\,f_T}{A\cdot\text{FO}},\qquad t_r=\frac{0.35}{f_{-3\text{dB}}}}
$$

with $k$ the fraction of the node capacitance that is not the next gate's input (own drain, wiring), and FO the ratio of the next gate's $C_{gg}$ to this gate's.

> [!note]- Derivation: gain, swing, restoration and the saturation limit (my derivation from the pair's large-signal curve)
> **Gain from swing.** At the crossing each device carries $I_D=I_{SS}/2$, so $g_m=(g_m/I_D)\,I_{SS}/2$. With $R=V_{sw}/I_{SS}$:
> $$A=g_mR=\frac{g_m}{I_D}\frac{I_{SS}}{2}\frac{V_{sw}}{I_{SS}}=\frac{g_m}{I_D}\frac{V_{sw}}{2}$$
> This is an identity, not a square-law result: it holds for any device model.
>
> **Restoration.** A gate driven by an identical gate sees a differential input of $\pm V_{sw}$. It switches fully when that exceeds $\Delta V_{in1}=\sqrt2\,V_{OV,eq}$ ([[Differential Amplifiers#Large-Signal Characteristic]]). In square law $g_m/I_D=2/V_{OV}$, so $V_{OV,eq}=2/(g_m/I_D)$ and
> $$V_{sw}\ge\frac{2\sqrt2}{g_m/I_D}\iff A\ge\sqrt2$$
> Below that the swing shrinks from stage to stage and a chain of buffers loses the signal. Razavi's margin note says nanometer devices keep the $\sqrt2$ when "off" means 90 % steering, so the rule survives short-channel effects to first order.
>
> **Saturation of the on device.** The on device's gate sits at the driving gate's high level $V_{DD}$ (that side carries no current), and its drain at $V_{DD}-V_{sw}$. Saturation needs $V_D\ge V_G-V_{TH}$, so $V_{sw}\le V_{TH}$. Past that the device enters triode at the end of each transition: the gate still works, but with less gain and more capacitance.

> [!note]- Derivation: bandwidth is $f_T$-limited and current-independent (my derivation)
> The output node has $R$ to $V_{DD}$ and capacitance $C=C_{own}+C_{wire}+\text{FO}\cdot C_{gg}$, where $C_{gg}$ is this gate's own input capacitance. Write $C=\text{FO}\cdot C_{gg}/(1-k)$. With $R=A/g_m$ and $C_{gg}=g_m/\omega_T$:
> $$\tau=RC=\frac{A}{g_m}\cdot\frac{\text{FO}}{1-k}\cdot\frac{g_m}{\omega_T}=\frac{A\cdot\text{FO}}{(1-k)\,\omega_T}$$
> $g_m$ cancels. Doubling $I_{SS}$ at fixed $g_m/I_D$ doubles $W$ and $g_m$, halves $R$, and doubles every capacitance: $\tau$ is unchanged. **Current buys the ability to drive a fixed external load, not speed.** Speed comes only from $f_T$ (set by $g_m/I_D$ and $L$), from less gain $A$, from less fan-out, and from less parasitic $k$.
>
> **Rise time.** A one-pole step response $1-e^{-t/\tau}$ crosses 10 % at $0.105\tau$ and 90 % at $2.303\tau$, so $t_r=2.2\tau=2.2/(2\pi f_{-3\text{dB}})=0.35/f_{-3\text{dB}}$.
>
> **Bandwidth target.** Palermo (L6 slide 54) finds the optimum RX front-end bandwidth "near or slightly higher than the Nyquist frequency": less bandwidth leaves ISI, more lets in noise. A logic gate inside the chip has no noise argument, so treat $f_{-3\text{dB}}\ge f_N$ as the floor.

### Where it lands in sizing

| Amplifier spec | Lands on | Rule |
|---|---|---|
| Restoration $A\ge\sqrt2$ at swing $V_{sw}$ | **Lower** bound on $g_m/I_D$ of the pair | $g_m/I_D\ge2A/V_{sw}$ |
| Bandwidth $f_{-3\text{dB}}$ at gain $A$ | **Upper** bound on $g_m/I_D$; $L=L_{min}$ | $f_T(g_m/I_D,L)\ge A\cdot\text{FO}\cdot f_{-3\text{dB}}/(1-k)$ |
| Swing, saturation | $R\cdot I_{SS}$ | $V_{sw}\le V_{TH}$ and headroom for the tail |
| External load $C_{ext}$ (wire, pad, big next stage) | $I_{SS}$ and $W$ | $R=1/(2\pi f_{-3\text{dB}}C)$, $I_{SS}=V_{sw}/R$, $W=I_D/J_D$ |
| Peaking | Inductor | $L=R^2C/m$, SRF well above $f_N$ ([[Inductor]]) |
| Tail source | Its own $g_m/I_D$ (not speed-critical) | low $V_{D,sat}$, so moderate/high $g_m/I_D$, long-ish $L$ for $r_o$ |

The two bounds on $g_m/I_D$ pull opposite ways, and the swing is what reconciles them: **a larger swing lets the pair run at lower $g_m/I_D$, hence higher $f_T$, at the same gain**. That is why the swing is pushed up to the headroom and saturation limits, and the pair sits in strong inversion at minimum $L$.

> [!tip] Remark
> The method (lookup tables of $f_T$, $J_D$, $g_m/g_{ds}$ against $g_m/I_D$ and $L$) is in [[gm-ID Design Methodology]]; here only where CML specs land. In amplifier design $f_T$ only has to clear about $10f_u$ (fan-out of 10), so $g_m/I_D$ is free to go up for efficiency. In CML the gate *is* running near $f_T/(A\cdot\text{FO})$, so $f_T$ is the binding constraint.

### Worked example: a 56 Gb/s NRZ CML buffer in 65 nm

Device data: Jespers & Murmann Table 1.1, 65 nm NMOS, $L=60$ nm, $V_{DS}=1$ V. The circuit numbers are my calculation from it.

| $g_m/I_D$ (S/A) | $J_D$ (µA/µm) | $f_T$ (GHz) | $V_{sw}$ for $A=2$ | $f_{-3\text{dB}}$ ($A=2$, FO $=1$, $k=0.3$) |
|---|---|---|---|---|
| 5 | 162 | 122 | 0.8 V (above $V_{TH}$: too big) | 42.7 GHz |
| 10 | 38.4 | 64.2 | 0.4 V | 22.5 GHz |
| 20 | 3.2 | 12.7 | 0.2 V | 4.4 GHz |

1. **Targets.** UI = 17.9 ps, $f_N=28$ GHz. Gain $A=2$ (margin over $\sqrt2$). Self-loading $k=0.3$ (Shekhar quotes 0.2–0.5 for real stages). Buffer chain, FO = 1.
2. **Pick $g_m/I_D$.** Only 10 S/A gives a practical swing (0.4 V). Its unpeaked bandwidth, 22.5 GHz, misses $f_N$: **peaking is required**, which is the usual situation.
3. **Pick the size.** Choose $I_{SS}=2.8$ mA: $R=0.4/2.8\text{ mA}=143\ \Omega$, $g_m=10\times1.4\text{ mA}=14$ mS (check: $g_mR=2.0$). $W=1.4\text{ mA}/38.4\ \mu\text{A}/\mu\text{m}=36.5$ µm. $C_{gg}=g_m/(2\pi f_T)=34.7$ fF, so $C=34.7/0.7=49.6$ fF and $\tau=7.08$ ps: 22.5 GHz, $t_r=15.6$ ps, almost a full UI.
4. **Peak it.** $L=R^2C/m$: $m=\sqrt2$ gives $L=716$ pH and an ideal $41$ GHz; $m=1+\sqrt2$ gives $419$ pH and $38.7$ GHz flat. Both clear $f_N$; the inductor's own capacitance and $C_{gd}$ will eat part of the gain (Shekhar §V).
5. **Power.** $V_{DD}I_{SS}=3.4$ mW per stage at 1.2 V (supply assumed), 60 fJ/bit at 56 Gb/s, whether data toggles or not.

> [!warning] Unverified
> The table is at $V_{DS}=1$ V; a CML pair sits at a smaller $V_{DS}$, and $C_{gd}$ (Miller) and wiring are ignored, so the real $f_T$ and bandwidth are lower. Treat the numbers as an upper bound and re-run the lookup at the actual bias.

> [!example] Sanity check against Lee et al. (40/65 nm, 56 Gb/s)
> Lee's PAM4 combiner uses $R=60\ \Omega$ and $L_{1,2}=130$ pH with $I_{SS}=12$ mA (Fig. 4). If that is shunt peaking at $m=\sqrt2$, it implies $C=mL/R^2\approx51$ fF per side (my back-calculation). The output stage pushes $R$ down to drive the 50 Ω channel, so the same capacitance needs a much smaller $L$ than the 143 Ω internal buffer above.

## Level 0: CML or CMOS

### The CML gate as a current switch

A CML gate never leaves saturation-ish operation: the tail current flows all the time and the input only decides which resistor it flows through. Every CML cell (buffer, latch, MUX, XOR) is that switch with more pairs stacked or paralleled on the same tail.

- **Output levels:** high $=V_{DD}$, low $=V_{DD}-I_{SS}R$, CM $=V_{DD}-I_{SS}R/2$. The levels are set by $R$ and $I_{SS}$, not by the supply, and they are the next gate's input levels, so CML gates chain without level shifting.
- **Delay:** set by $RC$, to first order not by $V_{DD}$. That is why link clock buffers and VCOs are often CML with fixed resistor loads ([[Link Noise and Jitter]]), and why CML transmitters have "inherently low susceptibility to power supply noise" (Kossel §I).
- **Cost:** static current, differential wiring, a tail source that needs headroom.

> [!tip] Remark
> The large-signal curve, the $\sqrt2V_{OV}$ steering range and the half-circuit gain $g_mR_D$ are in [[Differential Amplifiers#Level 2 Quantitative Analysis]]. A CML gate is that pair used at the ends of its curve instead of the middle.

### FO4 limits of CMOS

| Quantity | Value | Source |
|---|---|---|
| FO4 inverter delay | ~30 ps in 90 nm; sub-20 ps in 45 nm (with nMOS $f_T$ near 400 GHz) | Palermo L5 slide 59; Palermo 2011 p. 300 |
| Shortest clock period a CMOS buffer chain carries | ~8 FO4 (L5); 6–8 FO4 (Palermo 2011). About 4 GHz in 90 nm | Yang 1998 via L5 slide 59 |
| Shortest bit a CMOS 2:1 MUX propagates | ~2 FO4 | L5 slide 61 |
| Half-rate CMOS link | 4 FO4 bit (clock-limited): ~8 Gb/s in 90 nm; >12 Gb/s in 45 nm | L5 slide 61; Palermo 2011 |
| Quarter-rate (4:1 CMOS MUX, low fan-out) | ~2 FO4 bit: ~16 Gb/s in 90 nm | L5 slide 64 |
| 1/8-rate | 1 FO4 bit: "no way a CMOS mux can achieve this" | L5 slide 64 |

$$
\boxed{T_{clk,min}\approx 8\ \text{FO4},\qquad T_{b,min}\approx\frac{8\ \text{FO4}}{M}\ \ (M\text{ clock phases}),\qquad T_{b,min}\ge 2\ \text{FO4 (CMOS MUX)}}
$$

- **The limit is pulse propagation.** A narrow clock pulse shrinks in amplitude as it passes through a chain of CMOS buffers (Yang's "clock amplitude reduction" plot, L5 slide 59): by about 3 FO4 period it is gone.
- **Use multiple phases of a slower clock** to beat it: half rate uses two phases 180° apart, quarter rate four at 90°. The phase spacing then sets the eye's uniformity, so duty-cycle and quadrature correction become mandatory ([[Clocking and CDR]]).
- **Or use CML**, which "can achieve higher speeds due to reduced self-loading factor" at a static current "independent of data rate" (L5 slide 62), and CML with inductive peaking for the fastest clocks (L5 slide 59).
- At the top end even CML flip-flops run out: Lee et al. note a flip-flop "can hardly operate beyond 32 Gb/s" in 40 nm, so their 56 Gb/s NRZ receiver is sub-rate. At 112 Gb/s, clock-buffer chains amplify jitter near a 28 GHz clock, which pushes designs to quarter-rate 14 GHz clocks (Kim ISSCC 2019 in L14 slide 11).

> [!tip] Remark
> FO4, flip-flop timing and MUX trees as logic are in [[Digital CMOS Circuits]]. The jitter amplification of a bandwidth-limited buffer chain is in [[Link Noise and Jitter]]; the architecture choice (half/quarter rate, where the last MUX sits) is in [[Transmitters]].

### CML vs CMOS

| | CML | CMOS (static or TSPC) |
|---|---|---|
| Swing | low, $I_{SS}R$ | rail to rail |
| Power | $V_{DD}I_{SS}$ always, independent of rate | $\alpha CV_{DD}^2f$, zero when idle |
| Speed limit | $RC$, i.e. $f_T/(A\cdot\text{FO})$; extended by peaking | FO4: ~8 FO4 clock, ~2 FO4 MUX bit |
| Supply sensitivity | low: delay set by $RC$, differential | delay tracks $V_{DD}$ |
| Inputs | differential, CML levels | full-swing, single-ended OK |
| Area | resistors, tails, inductors | compact |
| Where used | last MUX stages, high-rate clock buffers and dividers, RX front end | everything that runs slow enough: lower MUX/DEMUX stages, retimers, PRBS (Lee, Won, Kossel) |

"Minimize CML to save power" (L5 slide 57): a 10 Gb/s full-rate 0.18 µm TX using CML in its last stages burned 130 mW (Cao JSSC 2002). Modern links keep CML only where CMOS can't follow and convert everywhere else.

### CML-to-CMOS conversion

```tikz title="Two CML-to-CMOS converters: a differential stage into a high-swing stage (Balamurugan, left) and an AC-coupled inverter self-biased at its trip point by a feedback resistor (Kossel, right). After Palermo L14 slides 19-20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,thick,minimum width=1.9cm,minimum height=1.0cm,align=center,font=\scriptsize}]
  \node[blk] (a) at (0,0) {differential\\pair, $I_{bias}$};
  \node[blk] (b) at (2.6,0) {high-swing\\stage};
  \draw[->] (-1.9,0.2) node[left,font=\scriptsize]{CML $+$} -- (-0.95,0.2);
  \draw[->] (-1.9,-0.2) node[left,font=\scriptsize]{CML $-$} -- (-0.95,-0.2);
  \draw[->] (a) -- (b);
  \draw[->] (b) -- (4.3,0) node[right,font=\scriptsize]{CMOS};
  \node[font=\scriptsize] at (1.3,-1.1) {Balamurugan: supply-sensitive, needs DCC};
  \begin{scope}[xshift=8.2cm]
    \draw (-1.4,0) node[left,font=\scriptsize]{CML} to[C,l=$C_c$] (0,0) node[circ]{};
    \draw (0,0) -- (0.4,0) node[not port,anchor=in](inv){};
    \draw (inv.out) -- (2.3,0) node[circ]{} -- (2.8,0) node[right,font=\scriptsize]{CMOS};
    \draw (0,0) -- (0,0.9) to[R,l=$R_F$] (2.3,0.9) -- (2.3,0);
    \draw[->,blue!70!black] (0,-1.0) node[below,font=\scriptsize,align=center]{$I_{DC}$ injected:\\shifts trip point (DCC)} -- (0,-0.1);
    \node[font=\scriptsize] at (1.2,2.0) {Kossel: self-biased at trip point};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Differential stage + high-swing output stage** (Balamurugan JSSC 2008): simple, but supply-sensitive, which gives back the jitter benefit of low-swing distribution, and it usually needs duty-cycle control (L14 slide 19).
- **AC-coupled self-biased inverter** (Kossel JSSC 2008): the feedback resistor holds the inverter at its trip point, the coupling capacitor passes the CML swing; cross-coupled buffer stages after it restore the duty cycle (L14 slide 20; Kossel §IV-A).
- **Duty-cycle knob:** injecting a DC current at the self-biased inverter's input moves its trip point and so the output duty cycle (Menolfi ISSCC 2018, L14 slide 29). Leave this knob: real clocks drift.

## Level 1: CML Circuits

### Buffer: swing, tail and load

Design order, from the spec translation above:

1. $V_{sw}$ as large as $V_{sw}\le V_{TH}$ and headroom allow.
2. $g_m/I_D=2A/V_{sw}$ with $A\approx2$; $L=L_{min}$.
3. $f_{-3\text{dB}}=(1-k)f_T/(A\cdot\text{FO})$; if it misses $f_N$, add peaking (Level 3) or cut FO.
4. $I_{SS}$ from the absolute load, $R=V_{sw}/I_{SS}$, $W=I_{SS}/(2J_D)$.
5. **Headroom:** the tail needs $V_{DS}\ge V_{D,sat}$ at node $P=V_{CM,in}-V_{GS}$, where $V_{CM,in}=V_{DD}-V_{sw}/2$ comes from the previous gate.

$$
\boxed{V_{DD}-\frac{V_{sw}}{2}-V_{GS}(I_{SS}/2)\ge V_{D,sat,tail}}
$$

When the stack gets too tall (latches, MUXes, low $V_{DD}$), designers drop the tail entirely: see the [[#Tail-less CML|tail-less driver]] below.

### Latch

```tikz title="CML latch: in track (CK high) the input pair M1-M2 drives the loads like a buffer; in hold (CK low) the cross-coupled pair M3-M4 holds the state, which needs g_m3 R > 1. Two latches on opposite clocks make a flip-flop; feeding QB back to D makes a divide-by-2. After Palermo L6 slide 38 (Toifl) and L11 slide 108."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0.4,4.2) -- (7.6,4.2);
  \node[above] at (4.0,4.2) {$V_{DD}$};
  \draw (0.4,4.2) to[R, l_=$R$] (0.4,3.0);
  \draw (7.6,4.2) to[R, l=$R$] (7.6,2.6);
  \draw (1.0,1.6) node[nmos](M1){};
  \draw (2.2,1.6) node[nmos,xscale=-1](M2){};
  \draw (5.8,1.6) node[nmos](M3){};
  \draw (7.0,1.6) node[nmos,xscale=-1](M4){};
  \node[left] at (M1.G) {$D$};
  \node[right] at (M2.G) {$\overline{D}$};
  \node[left] at (M3.G) {$V_o^+$};
  \node[right] at (M4.G) {$V_o^-$};
  \node[font=\scriptsize] at (1.45,1.1) {$M_1$};
  \node[font=\scriptsize] at (1.75,1.1) {};
  \node[font=\scriptsize] at (2.6,1.1) {$M_2$};
  \node[font=\scriptsize] at (6.25,1.1) {$M_3$};
  \node[font=\scriptsize] at (7.4,1.1) {$M_4$};
  % buses
  \draw (0.4,3.0) -- (5.8,3.0);
  \draw (M1.D) -- (1.0,3.0) node[circ]{};
  \draw (M3.D) -- (5.8,3.0) node[circ]{};
  \draw (2.2,2.6) -- (7.6,2.6);
  \draw (M2.D) -- (2.2,2.6) node[circ]{};
  \draw (M4.D) -- (7.0,2.6) node[circ]{};
  \draw (0.4,3.0) node[circ]{} -- (-0.3,3.0) node[left] {$V_o^-$};
  \draw (7.6,2.6) node[circ]{} -- (8.3,2.6) node[right] {$V_o^+$};
  % clock pair
  \draw (M1.S) -- (M2.S);
  \draw (M3.S) -- (M4.S);
  \draw (1.6,-0.3) node[nmos](M5){};
  \draw (6.4,-0.3) node[nmos,xscale=-1](M6){};
  \draw (1.6,0.83) -- (M5.D);
  \draw (6.4,0.83) -- (M6.D);
  \node[left] at (M5.G) {$CK$};
  \node[right] at (M6.G) {$\overline{CK}$};
  \node[font=\scriptsize] at (2.05,-0.8) {$M_5$};
  \node[font=\scriptsize] at (6.8,-0.8) {$M_6$};
  \draw (M5.S) |- (4.0,-1.5) -| (M6.S);
  \draw (4.0,-1.5) node[circ]{} to[I, l=$I_{SS}$] (4.0,-3.0) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.2,-2.4) {track\\(sense)};
  \node[font=\scriptsize,align=center] at (6.9,-2.4) {hold: $g_{m3}R>1$\\(regenerate)};
  % divide by 2 block
  \begin{scope}[xshift=11.0cm,yshift=1.0cm]
    \draw[thick] (0,0) rectangle (1.6,1.6); \node at (0.8,1.1) {latch}; \node[font=\scriptsize] at (0.8,0.5) {$CK$};
    \draw[thick] (2.6,0) rectangle (4.2,1.6); \node at (3.4,1.1) {latch}; \node[font=\scriptsize] at (3.4,0.5) {$\overline{CK}$};
    \draw[->] (1.6,0.8) -- (2.6,0.8);
    \draw[->] (4.2,0.8) -- (4.7,0.8) -- (4.7,2.3) -- (-0.5,2.3) -- (-0.5,0.8) -- (0,0.8);
    \node[font=\scriptsize,above] at (2.1,2.3) {$\overline{Q}\to D$ (cross the differential wires)};
    \draw[->] (4.7,0.8) -- (5.4,0.8) node[right] {$f_{in}/2$};
    \node[font=\scriptsize,align=center] at (2.1,-0.7) {$\div2$: two CML latches per input cycle\\$f_{in,max}\approx 1/(2t_{d,latch})$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Track:** $I_{SS}$ flows through M5 into M1–M2; the output follows the input with the buffer's $RC$ response.
- **Hold:** $I_{SS}$ moves to M6 and the cross-coupled M3–M4. With $g_{m3}R>1$ the loop regenerates whatever imbalance the track phase left, at $\tau_{reg}=RC/(g_{m3}R-1)$, and holds it.
- **The sizing trade:** M3–M4 load the output in the track phase too. A bigger latch pair regenerates faster but slows tracking. Likewise the input pair: in a CML latch "increasing input pair also directly increases output capacitance", while a StrongARM's transconductance grows faster than its capacitance, so the CML latch has more sampling gain with a small pair and the StrongARM more sampling bandwidth (Jeeradit VLSI 2008, L6 slide 40).
- **CML latch vs StrongARM:** the CML latch's sampling time hardly changes with $V_{DD}$; the StrongARM's does (L6 slide 39). A CML latch is followed by another CML latch, a StrongARM by an SR latch (L6 slide 37).

> [!tip] Remark
> The regeneration loop ($g_mR>1$, $\tau_{reg}=RC/(g_mR-1)$, metastability) is owned by [[Comparators#Positive Feedback Regeneration]] and [[Comparators#Level 4 Metastability]]. A CML latch is the resistively loaded regenerative pair of that note with a clocked input pair added.

### Flip-flop and divide-by-2

- **Flip-flop:** master latch on $CK$, slave on $\overline{CK}$; the input is captured at the edge when the master stops tracking.
- **$\div2$:** a flip-flop with $\overline{Q}$ fed back to $D$ ("flip-flop in negative feedback", L11 slide 106). The signal passes through **two CML gates per input cycle**, so to first order $f_{in,max}\approx1/(2t_{d,latch})$. It accepts CML levels, but needs differential inputs, a tail, and static power (L11 slide 108).
- **Shunt peaking** on the latch loads speeds a CML $\div2$ by more than 50 % (L11 slide 108).
- **Divide by 2 for quadrature:** two latches of a $\div2$ give outputs 90° apart at half the input frequency; the IQ spacing equals the input's high time, so input duty-cycle error is quadrature error ([[Oscillators#Quadrature clocks]]). Toprak-Deniz trims it with a differential offset inside the half-rate CML divider (L14 slide 28).

$$
\boxed{\text{CML }\div2:\ f_{in,max}\approx\frac{1}{2\,t_{d,latch}}\qquad\text{TSPC }\div2:\ f_{in,max}\approx\frac{1}{3\,t_{d,gate}}}
$$

(The 2 and 3 are the gate counts per input cycle on L11 slides 107–108; the expressions are first-order.)

> [!tip] Remark
> Which divider goes where in a PLL (asynchronous vs synchronous, dual-modulus prescalers, injection-locked dividers) is owned by [[Phased-Locked Loops#The divider]].

### MUX and XOR

```tikz title="2:1 CML MUX: the select pair M5-M6 steers I_SS to the D1 pair or the D2 pair, and both share the loads. In a half-rate serializer the select is the half-rate clock. After Palermo L5 slide 62 (Razavi)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0.4,4.2) -- (7.6,4.2);
  \node[above] at (4.0,4.2) {$V_{DD}$};
  \draw (0.4,4.2) to[R, l_=$R_D$] (0.4,3.0);
  \draw (7.6,4.2) to[R, l=$R_D$] (7.6,2.6);
  \draw (1.0,1.6) node[nmos](M1){};
  \draw (2.2,1.6) node[nmos,xscale=-1](M2){};
  \draw (5.8,1.6) node[nmos](M3){};
  \draw (7.0,1.6) node[nmos,xscale=-1](M4){};
  \node[left] at (M1.G) {$D_1$};
  \node[right] at (M2.G) {$\overline{D_1}$};
  \node[left] at (M3.G) {$D_2$};
  \node[right] at (M4.G) {$\overline{D_2}$};
  \node[font=\scriptsize] at (1.45,1.1) {$M_1$};
  \node[font=\scriptsize] at (2.6,1.1) {$M_2$};
  \node[font=\scriptsize] at (6.25,1.1) {$M_3$};
  \node[font=\scriptsize] at (7.4,1.1) {$M_4$};
  \draw (0.4,3.0) -- (5.8,3.0);
  \draw (M1.D) -- (1.0,3.0) node[circ]{};
  \draw (M3.D) -- (5.8,3.0) node[circ]{};
  \draw (2.2,2.6) -- (7.6,2.6);
  \draw (M2.D) -- (2.2,2.6) node[circ]{};
  \draw (M4.D) -- (7.0,2.6) node[circ]{};
  \draw (0.4,3.0) node[circ]{} -- (-0.3,3.0) node[left] {$V_{out}^-$};
  \draw (7.6,2.6) node[circ]{} -- (8.3,2.6) node[right] {$V_{out}^+$};
  \draw (M1.S) -- (M2.S);
  \draw (M3.S) -- (M4.S);
  \draw (1.6,-0.3) node[nmos](M5){};
  \draw (6.4,-0.3) node[nmos,xscale=-1](M6){};
  \draw (1.6,0.83) -- (M5.D);
  \draw (6.4,0.83) -- (M6.D);
  \node[left] at (M5.G) {$Sel$};
  \node[right] at (M6.G) {$\overline{Sel}$};
  \node[font=\scriptsize] at (2.05,-0.8) {$M_5$};
  \node[font=\scriptsize] at (6.8,-0.8) {$M_6$};
  \draw (M5.S) |- (4.0,-1.5) -| (M6.S);
  \draw (4.0,-1.5) node[circ]{} to[I, l=$I_{SS}$] (4.0,-3.0) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (9.4,1.2) {three levels: data, select, tail\\$Sel=1$: $V_{out}$ follows $D_1$\\$Sel=0$: $V_{out}$ follows $D_2$\\half rate: $Sel$ = half-rate clock};
\end{circuitikz}
\end{document}
```

- **Three levels of stacking** (data pair on select pair on tail) cost headroom; that is the MUX's practical limit at low $V_{DD}$.
- **Half rate:** with the half-rate clock on the select, each half of the clock period passes one data stream. The output eye depends on the clock's duty cycle, and the final MUX's select is swapped so the output can't glitch while the inputs change (L5 slide 58).
- **Fan-in costs speed:** a higher fan-in MUX puts more capacitance on the output node (L5 slide 64). Yang's 8:1 current-mode MUX at the pad works only because the pad's $25\ \Omega\cdot C_{out}$ time constant is smaller than the on-chip one (L5 slide 65).
- **XOR:** the same two-level structure as a Gilbert cell, with the second input on the lower pair. At 56 Gb/s "no XOR gate can produce a pulse with reasonable shape", because rise and fall times eat the whole bit; Lee therefore halves the data rate first with a static $\div2$ ([[#Static divide-by-2 on data]]).

> [!tip] Remark
> The XOR/mixer is the [[Differential Amplifiers#Level 6 The Gilbert Cell|Gilbert cell]] driven hard. Its use as a phase detector is in [[Clocking and CDR]].

### Flatten, don't stack

Stacked CML logic fails at 56 Gb/s "due to the significant capacitance at internal nodes, insufficient voltage headroom, and limited bandwidth" (Lee §III-B). Lee's PAM4 LSB decoder instead **sums in current**: three identical pairs, driven by the thermometer outputs $V_A,V_B,V_C$ with alternating polarity, share one pair of load resistors (Fig. 8). Each has a $2I_{SS}$ tail; an extra $I_{SS}$ branch balances the DC level, and peaking extends the bandwidth. $|V_{out}|=I_{SS}R$ for every code; with $I_{SS}=2.5$ mA the output is full once the inputs exceed about 300 mV. The output CM still shifts with the code, and the following CML buffers absorb it.

### Tail-less CML

```tikz title="Tail-less current-mode driver (half circuit): the data device at the bottom replaces the tail, a biased cascode sets the swing, and an auxiliary pull-up MPX briefly holds node V_X high so both output edges cross while steep. After Won Fig. 4 and Palermo L5 slide 29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,5.2) node[above] {$V_{DD,High}$} to[R, l=$R_T$] (0,3.8) node[circ]{} coordinate (O);
  \draw (O) -- (-1.2,3.8) node[left] {$OUT$};
  \draw (0,2.9) node[nmos](MC){};
  \draw (O) -- (MC.D);
  \node[left] at (MC.G) {$V_{bias}$};
  \draw (0,1.0) node[nmos](MD){};
  \draw (MC.S) -- (MD.D);
  \node[left] at (MD.G) {$D_{OUT}$};
  \draw (MD.S) -- (0,-0.1) node[ground]{};
  \draw (MC.S) ++(0,-0.2) coordinate (X);
  \draw (0,2.03) node[circ]{} -- (2.4,2.03);
  \node[font=\scriptsize,anchor=south west] at (0.1,2.05) {$V_X$};
  \draw (2.4,3.0) node[pmos,xscale=-1](MP){};
  \draw (MP.D) -- (2.4,2.03);
  \draw (MP.S) -- (2.4,3.9) node[above] {$V_{DD}$};
  \node[right] at (MP.G) {$DP_{OUT}$};
  \node[font=\scriptsize] at (3.2,2.55) {$M_{PX}$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.4,1.0) {no tail: data device at the bottom\\$M_{PX}$ on for 1 UI as $D_{OUT}$ rises:\\holds $V_X$ high, edges cross steep\\$t_r$ 16.85 $\to$ 15.15 ps (TT)};
\end{circuitikz}
\end{document}
```

- **No tail:** the bottom device is driven by the full-rate serialized data, a replica bias sets the cascode's gate and so the swing. Steffan's version reaches 1.2 V$_{ppd}$ with 94 % RLM (L5 slide 29).
- **Won's edge trick:** a 1-UI-early, inverted copy of the data ($DP_{OUT}$) turns on $M_{PX}$ just as $D_{OUT}$ rises, keeping $V_X$ at $V_{DD}$ a moment longer. The falling half's edge is delayed slightly, so the two edges cross while both are steep. Differential 10–90 % rise time falls from 16.85 to 15.15 ps (TT; Fig. 5), and the worst-case PAM4 horizontal eye opens by 30 %, with no DC current and no pre-cursor ISI.

> [!tip] Remark
> The driver itself (swing, termination, RLM, segmentation) is owned by [[Transmitters]]. Here only the circuit trick.

## Level 2: The Gain-Bandwidth Limit of a CML Stage

$$
\boxed{\text{GBW}=A\,f_{-3\text{dB}}=\frac{g_m}{2\pi C}=\frac{(1-k)\,f_T}{\text{FO}}}
$$

- A CML stage is a one-pole amplifier, so its GBW is $g_m/C$ whatever $R$ is. For a gate driving a copy of itself, that is a fixed fraction of $f_T$. **Gain is traded one-for-one against bandwidth**; current doesn't enter.
- **Lowering FO** (a smaller next stage) helps, but the next stage then has less drive. A buffer chain that tapers up to a big load is the CML version of an inverter chain.
- **Cascading** $N$ stages to get gain shrinks the bandwidth to $\sqrt{2^{1/N}-1}$ of one stage, at $N\times$ the power ([[Frequency Response#Many Poles Cascading]]).
- **Fine-line CMOS makes it worse:** "the GBW product actually decreases with increased gain" because $g_{ds}$ and $C_{gd}$ grow as $W/L$ grows (Shekhar §V-A). So wideband amplifiers use several low-gain stages, and the value of bandwidth extension is that each stage can take more gain, so fewer stages are needed.

> [!tip] Remark
> This is the one-pole GBW of [[Frequency Response#One Pole GBW Is Fixed by $g_m/C_L$]] with the load written as a multiple of the device's own $C_{gg}$. Razavi's example there (a CS stage driving an identical stage in 40 nm: about 34 GHz of GBW against an $f_T$ above 300 GHz) is the same self-loading penalty.

## Level 3: Bandwidth Extension

Every technique below does one of three things to the same $RC$ node: **raise the load impedance with frequency** (inductors, active inductors), **hide part of the capacitance from the resistor for a while** (series inductors, T-coils, transmission lines), or **cancel capacitance** (neutralization, negative capacitance, low-impedance nodes in Cherry-Hooper).

### Shunt peaking

Shekhar Fig. 3: an inductor in series with $R$. Treating the transistor as a current source, only the transimpedance $Z(s)=V_{out}/I_{in}$ matters.

$$
\boxed{Z(s)=\frac{R+sL}{1+sRC+s^2LC},\qquad Z_N(s)=\frac{1+s/(m\omega_0)}{1+s/\omega_0+s^2/(m\omega_0^2)},\qquad m=\frac{R^2C}{L},\ \omega_0=\frac1{RC}}
$$

| $m$ | $L$ | BWER | Peaking |
|---|---|---|---|
| $\infty$ | 0 | 1 | none |
| $1+\sqrt2=2.41$ | $0.41R^2C$ | 1.72 | flat (maximally flat) |
| $2$ | $0.5R^2C$ | 1.80 | 0.25 dB |
| $\sqrt2=1.41$ | $0.71R^2C$ | 1.84 (maximum) | 1.5 dB |

(Rows 2 and 4 from Shekhar §II; row 3 is my evaluation of Eq. 2.)

- **Why it works:** the zero at $R/L$ raises $|Z|$ just as $C$ starts to short the node. In time: the inductor delays current into $R$, so more of the transistor's current charges $C$ at first, and the rise time drops.
- **No pure shunt peaking in silicon:** the inductor's own capacitance bridges it ($k_B=C_B/C>0$). Connect $L$ to the supply so that capacitance lands in $C_B$, not in $C$; a symmetric center-tapped inductor then serves both sides of the pair.
- **Bridged shunt** ($C_B$ across $L$, Fig. 4) can be turned into a feature: with $k_B=0.3$ and $m=2.4$ the BWER is 1.83 with a **flat** response, and the larger $m$ means a smaller inductor (higher SRF, less area).

> [!note]- Detail: bridged-shunt transimpedance (Shekhar Eq. 3)
> $$Z_N(s)=\frac{1+\frac1m\frac{s}{\omega_0}+\frac{k_B}{m}\frac{s^2}{\omega_0^2}}{1+\frac{s}{\omega_0}+\frac{k_B+1}{m}\frac{s^2}{\omega_0^2}+\frac{k_B}{m}\frac{s^3}{\omega_0^3}},\qquad k_B=\frac{C_B}{C}$$
> $C_B$ adds a pole and a zero. Fig. 5: $k_B=0,0.1,0.2,0.3$ with $m=1.4,1.8,2.2,2.4$ all give BWER 1.83, with the peaking falling from 1.5 dB to essentially none.

### Series, shunt-series and capacitive splitting

```tikz title="Splitting the load capacitance: series peaking puts L between the drain capacitance C1 and the load C2; bridged-shunt-series adds a bridged shunt inductor; the asymmetric T-coil couples the two with negative mutual inductance. k_C = C1/(C1+C2). After Shekhar Figs. 6, 8, 10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) series
  \begin{scope}
    \draw (0,3.4) node[above]{$V_{DD}$} to[R,l=$R$] (0,1.8) node[circ]{};
    \draw (0,1.8) to[I,l_=$i_{in}$] (0,0) node[ground]{};
    \draw (0,1.8) -- (0.9,1.8) to[C,l=$C_1$] (0.9,0) node[ground]{};
    \draw (0.9,1.8) to[L,l=$L$] (2.6,1.8) node[circ]{} -- (3.0,1.8) node[right]{$v_{out}$};
    \draw (2.6,1.8) to[C,l=$C_2$] (2.6,0) node[ground]{};
    \node at (1.3,-1.0) {(a) series};
  \end{scope}
  % (b) bridged shunt series
  \begin{scope}[xshift=5.0cm]
    \draw (0,4.6) node[above]{$V_{DD}$} to[L,l=$L_1$] (0,3.2) to[R,l=$R$] (0,1.8) node[circ]{};
    \draw (0,4.6) -- (-0.8,4.6) to[C,l_=$C_B$] (-0.8,3.2) -- (0,3.2);
    \draw (0,1.8) to[I,l_=$i_{in}$] (0,0) node[ground]{};
    \draw (0,1.8) -- (0.9,1.8) to[C,l=$C_1$] (0.9,0) node[ground]{};
    \draw (0.9,1.8) to[L,l=$L_2$] (2.6,1.8) node[circ]{} -- (3.0,1.8) node[right]{$v_{out}$};
    \draw (2.6,1.8) to[C,l=$C_2$] (2.6,0) node[ground]{};
    \node at (1.3,-1.0) {(b) bridged-shunt-series};
  \end{scope}
  % (c) asymmetric T-coil
  \begin{scope}[xshift=11.2cm]
    \draw (0,5.4) node[above]{$V_{DD}$} to[R,l=$R$] (0,4.2) to[L,l=$L_1$] (0,2.8) node[circ]{};
    \draw (0,2.8) to[L,l=$L_2$] (0,1.4) node[circ]{};
    \draw (0,1.4) to[I,l_=$i_{in}$] (0,-0.2) node[ground]{};
    \draw (0,1.4) -- (-1.3,1.4) to[C,l_=$C_1$] (-1.3,-0.2) node[ground]{};
    \draw (0,2.8) -- (1.4,2.8) node[circ]{} -- (1.9,2.8) node[right]{$v_{out}$};
    \draw (1.4,2.8) to[C,l=$C_2$] (1.4,1.2) node[ground]{};
    \draw[<->,thick,red!70!black] (-0.45,3.9) to[bend right=40] (-0.45,1.9);
    \node[red!70!black,font=\scriptsize,anchor=east] at (-0.75,2.9) {$k_m<0$};
    \node at (0.5,-1.0) {(c) asymmetric T-coil};
  \end{scope}
  \node[font=\scriptsize] at (7.4,-1.6) {transistor = current source $i_{in}=g_mv_{in}$;\quad $C=C_1+C_2$,\ $k_C=C_1/C$,\ $m_i=R^2C/L_i$};
\end{circuitikz}
\end{document}
```

The drain capacitance $C_1$ (the driver's own) and the load $C_2$ (next gate) are separated by an inductor. At first the transistor charges only $C_1$; $L$ delays the current into $C_2$. The drain rises faster and the bandwidth grows.

$$
\boxed{\text{series: } Z_N(s)=\frac{1}{1+\frac{s}{\omega_0}+\frac{1-k_C}{m}\frac{s^2}{\omega_0^2}+\frac{k_C(1-k_C)}{m}\frac{s^3}{\omega_0^3}},\qquad k_C=\frac{C_1}{C}=\frac{C_1}{C_1+C_2}}
$$

| Technique | $k_C$ | Ripple | Component values | BWER (ideal) |
|---|---|---|---|---|
| Series | 0 | 0 | $m=2$ | 1.41 |
| Series | 0.3 | 0 | $m=2.4$ | 2.52 |
| Series | 0.4 | 2 dB | $m=2.5$ | 3.17 |
| Bridged-shunt-series | 0.4 | 0 | $m_1=8$, $m_2=2.4$, $k_B=0.3$ | 3.92 |
| Bridged-shunt-series | 0.4 | 2 dB | $m_1=6$, $m_2=2.4$, $k_B=0.2$ | 4.00 |
| Shunt-series (Galal) | 0.5 | 1.8 dB | $k_B\approx0$ | 3.5 |
| Asymmetric T-coil | 0.1 | 0 | $m_1=4$, $m_2=1.6$, $k_m=-0.7$ | 4.63 |
| Asymmetric T-coil | 0.1 | 2 dB | $m_1=3.5$, $m_2=1.6$, $k_m=-0.6$ | 5.59 |
| Asymmetric T-coil | 0.3 | 2 dB | $m_1=4$, $m_2=2.8$, $k_m=-0.4$ | 4.54 |
| Symmetric bridged T-coil ($L_1=L_2$, drain $C$ ignored) | — | — | classic pole-zero cancellation | 2.83 |

(Shekhar Tables I–III; $m_i=R^2C/L_i$; $k_m=M/\sqrt{L_1L_2}$.)

- **Series peaking alone** is best near $k_C=0.3$ and useless at $k_C=0$ (no drain capacitance to split).
- **Bridged-shunt-series** combines both mechanisms and needs two inductors; the zero-ripple points rely on pole–zero cancellation, which PVT and distributed parasitics spoil.
- **Asymmetric T-coil:** the coils are wound for **negative** mutual inductance. In the T-model the load $C_2$ sits behind a $-M$ element, so it receives an initial current boost. It keeps a large BWER even when the load dominates ($k_C\le0.3$), where the splitting action of the others fades. Positive coupling is suboptimal (BWER 3.23).

> [!note]- Detail: the higher-order transimpedances (Shekhar Eqs. 5, 6)
> **Bridged-shunt-series** ($m_1=R^2C/L_1$, $m_2=R^2C/L_2$):
> $$Z_N=\frac{1+\frac1{m_1}\frac{s}{\omega_0}+\frac{k_B}{m_1}\frac{s^2}{\omega_0^2}}{1+\frac{s}{\omega_0}+\left(\frac{1+k_B}{m_1}+\frac{1-k_C}{m_2}\right)\frac{s^2}{\omega_0^2}+\left(\frac{k_B}{m_1}+\frac{k_C(1-k_C)}{m_2}\right)\frac{s^3}{\omega_0^3}+\frac{(k_C+k_B)(1-k_C)}{m_1m_2}\frac{s^4}{\omega_0^4}+\frac{k_Bk_C(1-k_C)}{m_1m_2}\frac{s^5}{\omega_0^5}}$$
> **Asymmetric T-coil** ($k_m=M/\sqrt{L_1L_2}$):
> $$Z_N=\frac{1+\left(\frac1{m_1}+\frac{k_m}{\sqrt{m_1m_2}}\right)\frac{s}{\omega_0}}{1+\frac{s}{\omega_0}+\left(\frac1{m_1}+\frac{k_C}{m_2}+\frac{2k_Ck_m}{\sqrt{m_1m_2}}\right)\frac{s^2}{\omega_0^2}+\frac{k_C(1-k_C)}{m_2}\frac{s^3}{\omega_0^3}+\frac{k_C(1-k_C)(1-k_m^2)}{m_1m_2}\frac{s^4}{\omega_0^4}}$$
> These are what the tables tabulate. In a real design, the transistor's $g_{ds}$ and $C_{gd}$ and the coils' parasitics move the poles and zeros, and the more so the higher the stage's gain. Shekhar therefore started from the tables and finished with parasitic-aware optimization.

#### Measured (Shekhar §VI, 0.18 µm, 2 V, 15 mA per differential stage)

| Amplifier | Gain | Bandwidth | BWER (theory / measured) |
|---|---|---|---|
| Bridged-shunt-series, $k_C=0.4$ | 14.1 dB | 8 GHz | 4.0 / 3.0 |
| Bridged-shunt-series, $k_C=0.5$ | 14.1 dB | 8 GHz | 3.5 / 3.0 |
| Asymmetric T-coil, $k_C=0.3$ | 12 dB | 10.4 GHz | 4.6 / 4.1 |

BWER falls short of theory more as the gain rises, because $g_{ds}$ and $C_{gd}$ grow with $W/L$. The custom T-coil: four primary and three secondary turns, concentric (tapped) winding because the needed coupling (0.3–0.7) is too low for interleaving; simulated SRF 19.2 GHz, Q of 9.

> [!tip] Remark
> The coil as a component (inductance formulas, Q, SRF, the compact model, why concentric vs interleaved windings set $k$) is owned by [[Inductor]]. Here only the values a peaking network asks for.

#### Which technique for which $k_C$

| $k_C=C_{drain}/C_{total}$ | Best choice (Shekhar) | Why |
|---|---|---|
| $<0.1$ (e.g. common-gate LNA, small devices) | Modified series peaking (load $R$ moved to the far side) + stagger compensation | Large peaking at $1/\sqrt{L_1C_1}$, flattened by the input network's roll-off |
| 0.1–0.3 (load-dominated) | Asymmetric T-coil | Magnetic coupling still boosts $C_2$ |
| 0.4–0.5 | Bridged-shunt-series | Capacitive splitting is effective |
| any, simplest | Shunt peaking (bridged) | One inductor, BWER ≤ 1.84 |

In a cascade, $k_C$ differs stage to stage, so **different stages may want different techniques** (Shekhar §I).

> [!warning] PAM4 punishes peaking errors
> Lee et al.: peaking inductors "must be made more precisely than those in NRZ applications", because both overshoot (under-damped) and a long tail (over-damped) are deterministic ISI, and the PAM4 eye is already a third of the NRZ eye. "Inaccurate modeling on peaking inductors may cause significant degradation", and it may not be repairable in the RX (the DFE handles only post-cursors).

### T-coils at the pad

```tikz title="T-coil at an SST transmitter output (one side): the driver's capacitance C_t and the ESD capacitance C_e are separated by an asymmetric T-coil; the pad C_p sits at the far end. Values from Kossel Fig. 10(b), Table I; right, the uncoupled equivalent of Fig. 10(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[circ]{} coordinate(A);
  \draw (A) -- (-1.3,2) to[R,l_=$R_{Tx}$] (-1.3,0) node[ground]{};
  \draw (A) to[C,l=$C_t$] (0,0) node[ground]{};
  \draw (A) to[R,l=$R_a$] (1.6,2) to[L,l=$L_a$] (3.4,2) node[circ]{} coordinate(T);
  \draw (T) to[L,l=$L_b$] (5.2,2) to[R,l=$R_b$] (6.8,2) node[circ]{} coordinate(B);
  \draw (T) to[C,l=$C_e$] (3.4,0) node[ground]{};
  \draw (B) to[C,l_=$C_p$] (6.8,0) node[ground]{};
  \draw (B) -- (8.1,2) to[R,l=$R_{Rx}$] (8.1,0) node[ground]{};
  \draw (A) -- (0,3.4) to[C,l=$C_b$] (6.8,3.4) -- (B);
  \node[font=\scriptsize,red!70!black] at (3.4,2.8) {coupled, $k=0.4$};
  \node[font=\scriptsize] at (-0.6,-0.9) {driver};
  \node[font=\scriptsize] at (3.4,-0.9) {ESD (SCR + diode)};
  \node[font=\scriptsize] at (7.4,-0.9) {pad + line};
  \node[font=\scriptsize,align=left,anchor=north west] at (-1.6,-1.4) {$C_t\approx600$ fF, $C_e\approx300$ fF, $C_p\approx70$ fF, $C_b\approx15$ fF (turn fringing, no capacitor)\\$L_a=360$ pH, $L_b=240$ pH, $M=118$ pH, $R_a=4\,\Omega$, $R_b=2\,\Omega$, $R_{Tx}=R_{Rx}=50\,\Omega$};
  \begin{scope}[xshift=10.6cm]
    \draw (0,2) node[circ]{} node[left]{in} to[L,l={$L_a{+}M$}] (2.0,2) node[circ]{} coordinate(T2);
    \draw (T2) to[L,l={$L_b{+}M$}] (4.0,2) node[circ]{} node[right]{out};
    \draw (T2) to[L,l={$-M$}] (2.0,0.6) to[C,l={$C_e$}] (2.0,-0.8) node[ground]{};
    \draw (0,2) -- (0,3.4) to[C,l={$C_b$}] (4.0,3.4) -- (4.0,2);
    \node[font=\scriptsize,align=center] at (2.0,-1.8) {uncoupled equivalent:\\$C_e$ sits behind $-M$};
  \end{scope}
\end{circuitikz}
\end{document}
```

The pad node has the worst capacitance in the link: driver, ESD and pad together. Kossel's SST transmitter had $C_t\approx600$ fF (output stages), $C_e\approx300$ fF (SCR + diode ESD for 2 kV HBM) and $C_p\approx70$ fF: about 1 pF, which limits a return loss better than $-8$ dB at half the data rate to below 5 Gb/s.

- **The T-coil separates the three capacitances.** $L_a=360$ pH, $L_b=240$ pH, $k=0.4$ ($M=118$ pH), bridging $C_b\approx15$ fF supplied by the turns' fringing capacitance (no explicit capacitor), $R_a=4\ \Omega$, $R_b=2\ \Omega$. Equivalent: $L_a+M$ and $L_b+M$ in series, $-M$ in series with $C_e$ in the shunt branch.
- **Asymmetric, because the driver dominates.** A symmetric T-coil only helps while $C_e/C_t$ is large; here $C_t>C_e$, so the classic design equations no longer apply and the coil was sized numerically. The more asymmetric, the smaller $L_b$, which helps because $L_b$ must carry the ESD current (wide trace).
- **Layout:** 40 × 40 µm, one turn on the top five metals, the bottom two thick metals paralleled; **helical rather than flat wiring** to cut the interlayer fringing capacitance and raise the SRF; about 6 Ω, absorbed by reducing the slices' series termination resistors.
- **Result:** return loss better than 16 dB up to 10 GHz, 8.5 Gb/s with >1.0 V eye height, 96 mW.
- **Since then:** a double T-coil separates the termination capacitance too, for 1.5× bandwidth (Steffan ISSCC 2017); a π-coil adds series-shunt peaking (Kim ISSCC 2019) (L5 slides 46–47). At the RX the T-coil isolates ESD and input-stage capacitance, combined with shunt peaking in the termination (Pisati ISSCC 2019) or a bridged T-coil plus series peaking into the input stage (Loi ISSCC 2019) (L6 slides 8–9). Typical spec: $S_{11}<-7$ dB at Nyquist (L5 slide 42).

> [!tip] Remark
> Why a shunt capacitance limits the match at all, and the Bode–Fano ceiling a T-coil works against, are in [[Smith Chart and Impedance Matching#Termination Matching (SerDes and on-chip)]] and [[Smith Chart and Impedance Matching#Bode–Fano Limit]]. How the driver and termination use it is in [[Transmitters]] and [[Receivers]].

### Distributed stages

```tikz title="Distributed 2:1 MUX (one of three identical stages shown): data, clock and output travel on 50-ohm lines whose inductance absorbs the gate and drain capacitances; the CML switching pair M1 sits under the data pairs M2. After Lee Fig. 11(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % output (drain) line
  \draw (0,3.4) to[R,l_=$R_D$] (-1.8,3.4) node[left]{$V_{DD}$};
  \draw (0,3.4) to[L,l=$L_D/2$] (1.6,3.4) node[circ]{} coordinate(d1) to[L,l=$L_D$] (4.2,3.4) node[circ]{} coordinate(d2) to[L,l=$L_D$] (6.8,3.4) node[circ]{} coordinate(d3) to[L,l=$L_D/2$] (8.4,3.4) -- (9.0,3.4) node[right]{$D_{out}$};
  % gate line
  \draw (-0.4,0) node[left]{$D_{in},\,CK$} to[L,l_=$L_G/2$] (1.6,0) node[circ]{} coordinate(g1) to[L,l_=$L_G$] (4.2,0) node[circ]{} coordinate(g2) to[L,l_=$L_G$] (6.8,0) node[circ]{} coordinate(g3) to[L,l_=$L_G/2$] (8.4,0) to[R,l=$R_G$] (8.4,-1.5) node[ground]{};
  \foreach \x/\n in {1.6/1,4.2/2,6.8/3} {
    \draw[thick,fill=gray!10] (\x-0.7,1.1) rectangle (\x+0.7,2.3);
    \node[font=\scriptsize,align=center] at (\x,1.7) {CML MUX\\cell \n};
    \draw (\x,0) -- (\x,1.1);
    \draw (\x,2.3) -- (\x,3.4);
  }
  \node[font=\scriptsize,align=left,anchor=west] at (9.2,1.6) {each cell: data pairs $M_2$ (24/0.06)\\on clock pair $M_1$ (30/0.06), $I_{SS}=7$ mA\\$L_G=L_C=75$ pH, $L_D=150$ pH\\all lines 50 $\Omega$, equal group velocity\\gate/drain $C$ absorbed into the lines};
\end{circuitikz}
\end{document}
```

"At tens of GHz, large elements such as inductors can no longer be considered lumped" (Lee §III-A). The capacitances are then absorbed into artificial transmission lines: each gate (or drain) is a shunt $C$ between series inductors, and the line's impedance $\sqrt{L/C}$ stays real until its cutoff.

- **Lee's 60 Gb/s MUX (Fig. 11):** three identical stages; M1 30/0.06 µm (clock), M2 24/0.06 µm (data), $R_D=R_G=R_C=50\ \Omega$, $I_{SS}=7$ mA per stage, $L_G=L_C=75$ pH, $L_D=150$ pH. Data and clock lines have the same 50 Ω impedance and group velocity. Output match $S_{22}<-10$ dB from DC to 70 GHz. No ESD at the output: "we can not afford ESDs".
- **How many stages:** each adds $g_m$ but also line loss. Output amplitude peaks near 220 mV$_{pp}$ at $N=3$ and then falls, while power keeps rising (Fig. 11b).
- **Lee's PAM4 combiner (Fig. 4)** uses the same idea between FFE taps: $L_D$ and $L_G$ absorb drain and gate capacitance and reduce skew; $L_{1,2}=130$ pH peak the output.
- Distributed amplifiers "consume large area and high power and are difficult to design owing to delay line losses" (Shekhar §I), which is why lumped peaking is the default and distribution is reserved for the last, fastest stage.

> [!tip] Remark
> The artificial line is the lumped $LC$ model of [[Transmission Lines]]: $Z_0=\sqrt{L/C}$ per section. Gate capacitance stops being a pole and becomes part of a delay.

### Active inductors

```tikz title="Active inductor: a source follower with a gate resistor R_S. Looking into the source, Z rises from 1/g_m at DC to R_S at high frequency, an inductive rise; as a CML load it peaks the response without a spiral. After Razavi Fig. 6.30 and Palermo L14 slide 17 (Upadhyaya)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1.5) node[nmos](M){};
  \draw (M.D) -- (0,3.0) node[above]{$V_{DD}$};
  \draw (M.G) -- (-1.4,1.5) to[R,l=$R_S$] (-1.4,3.0) -- (0,3.0);
  \draw (M.S) -- (0,0.4) node[circ]{} -- (0,-0.2) node[ocirc]{} node[below]{$Z$};
  \node[font=\scriptsize] at (0.45,1.0) {$M_2$}; \node[font=\scriptsize,align=left,anchor=west] at (0.4,2.2) {($C_{GS}$ intrinsic)};
  \begin{scope}[xshift=3.2cm]
    \draw[->] (0,0) -- (6,0) node[right,font=\scriptsize]{$\log\omega$};
    \draw[->] (0,0) -- (0,3) node[above,font=\scriptsize]{$|Z|$};
    \draw[very thick] (0,0.7) -- (1.8,0.7) -- (3.8,2.3) -- (5.6,2.3);
    \node[left,font=\scriptsize] at (0,0.7) {$1/g_m$};
    \node[left,font=\scriptsize] at (0,2.3) {$R_S$};
    \draw[dotted] (1.8,0) -- (1.8,0.7); \node[below,font=\scriptsize] at (1.8,0) {$\frac{1}{R_SC_{GS}}$};
    \draw[dotted] (3.8,0) -- (3.8,2.3); \node[below,font=\scriptsize] at (3.8,0) {$\frac{g_m}{C_{GS}}$};
    \node[font=\scriptsize] at (2.0,1.8) {inductive};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{L_{eq}=\frac{C_{GS}}{g_m}\left(R_S-\frac1{g_m}\right),\qquad Z:\ \frac1{g_m}\ (\text{DC})\ \to\ R_S\ (\text{high }f)}
$$

- It works only for $R_S>1/g_m$; it also carries a parallel resistance $R_S$ and a series $1/g_m$ (Razavi Ex. 6.14).
- **Costs:** the follower's $V_{GS}$ eats headroom, which limits the gain; $C_{GD}$ limits the enhancement; noise from $R_S$ and the device.
- **Use:** CML clock distribution with active-inductor loads for low jitter where spirals cost too much area (Upadhyaya ISSCC 2018 / VLSI 2016, L14 slide 17, L11 slide 18). Inverter-based cells can also serve as active-inductor loads (Zheng CICC 2018, L6 slide 16).

> [!tip] Remark
> This is the source follower's inductive output impedance from [[Frequency Response#Source Follower]], used on purpose. The same impedance rings with a capacitive load when you *don't* want it.

### Neutralization and negative capacitance

```tikz title="Left: cross-coupled neutralization capacitors C_N cancel the Miller multiplication of C_GD. Right: a cross-coupled pair with a capacitor C between its sources presents a negative capacitance across the outputs."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % neutralization
  \draw (0,0) node[nmos](M1){};
  \draw (3.4,0) node[nmos,xscale=-1](M2){};
  \draw (M1.S) |- (1.7,-1.1) -| (M2.S);
  \draw (1.7,-1.1) to[I,l=$I_{SS}$] (1.7,-2.6) node[ground]{};
  \draw (M1.D) to[R,l=$R$] (0,2.6) -- (3.4,2.6) to[R,l_=$R$] (M2.D); \draw (1.7,2.6) node[circ]{} -- (1.7,2.9) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} -- (-0.6,0.77) node[left]{$V_{out}^-$};
  \draw (M2.D) node[circ]{} -- (4.0,0.77) node[right]{$V_{out}^+$};
  \node[left] at (M1.G) {$V_{in}^+$};
  \node[right] at (M2.G) {$V_{in}^-$};
  \draw (M1.G) ++(0.0,0) coordinate(g1);
  \draw (M2.G) ++(0.0,0) coordinate(g2);
  \draw[blue!70!black] (g1) -- ++(0,-0.6) coordinate(a1);
  \draw[blue!70!black] (a1) to[C] (M2.D);
  \draw[blue!70!black] (g2) -- ++(0,-0.6) coordinate(a2);
  \draw[blue!70!black] (a2) to[C] (M1.D);
  \node[blue!70!black,font=\scriptsize] at (1.7,1.3) {$C_N$ (cross-coupled)};
  \node at (1.7,-3.4) {neutralization: $C_N=C_{GD}$};
  % negative capacitance pair
  \begin{scope}[xshift=8.4cm]
    \draw (0,0) node[nmos](M3){};
    \draw (2.6,0) node[nmos,xscale=-1](M4){};
    \draw (M3.D) -- (0,1.6) node[circ]{} node[above]{$x^-$};
    \draw (M4.D) -- (2.6,1.6) node[circ]{} node[above]{$x^+$};
    \draw (M3.G) -- ++(-0.3,0) |- (2.6,1.2) node[circ]{};
    \draw (M4.G) -- ++(0.3,0) |- (0,0.95) node[circ]{};
    \draw (M3.S) -- (0,-1.2) node[circ]{};
    \draw (M4.S) -- (2.6,-1.2) node[circ]{};
    \draw (0,-1.2) to[C,l=$C$] (2.6,-1.2);
    \draw (0,-1.2) to[I] (0,-2.8) node[ground]{};
    \draw (2.6,-1.2) to[I] (2.6,-2.8) node[ground]{};
    \node[align=center] at (1.3,-4.2) {$Z_{x^+x^-}=-\frac{2}{g_m}-\frac{1}{sC}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{C_{in}=C_{GS}+(1+A)C_{GD}+(1-A)C_N\ \xrightarrow{C_N=C_{GD}}\ C_{GS}+2C_{GD},\qquad Z_{x\text{-pair}}=-\frac{2}{g_m}-\frac{1}{sC}}
$$

- **Neutralization:** each input also sees $C_N$ to the *opposite* output, which moves in phase with it, so $C_N$ is Miller-multiplied by $(1-A)$, a negative number. With $C_N=C_{GD}$ the input capacitance no longer depends on the gain.
- **Negative capacitance:** a cross-coupled pair with a capacitor $C$ between its sources looks like $-2/g_m$ in series with $-C$. Placed across a CML output, it cancels part of the load capacitance at high frequency. The negative resistance must stay smaller in magnitude than what it is parallel with, or the stage becomes a latch.

> [!note]- Derivation: both results (mine, from Miller's theorem and a test source)
> **Neutralization.** With differential gain $-A$ from $V_{in}^+$ to $V_{out}^-$ (same side), $V_{out}^+=+AV_{in}^+$ in the differential mode. $C_{GD}$ connects $V_{in}^+$ to $V_{out}^-$: Miller factor $1-(-A)=1+A$. $C_N$ connects $V_{in}^+$ to $V_{out}^+$: Miller factor $1-A$. Sum: $C_{GD}(1+A)+C_N(1-A)$; equal values leave $2C_{GD}$. ([[Frequency Response#Miller's Theorem]].) Mismatch between $C_N$ and $C_{GD}$ leaves a residue $(C_{GD}-C_N)A$, and over-neutralizing makes the input capacitance negative, which can oscillate.
>
> **Negative capacitance.** Apply $V_x$ across the drains of a cross-coupled pair, with an impedance $Z_S$ between the sources (each source biased by its own tail). Each gate is driven by the other drain, so the pair's differential current is $I_x=-g_m V_x/(2+g_mZ_S)$ in the direction that *increases* $V_x$: $Z=V_x/I_x=-(2/g_m+Z_S)$. With $Z_S=1/(sC)$, $Z=-2/g_m-1/(sC)$: a negative resistor in series with a capacitor of value $-C$. Above $\omega=g_m/(2C)$ the capacitive term dominates.

### Cherry-Hooper (Gm-TIA)

```tikz title="Cherry-Hooper stage: a transconductor M1 feeds a shunt-feedback transimpedance stage M2-R_F. Both internal nodes have impedance near 1/g_m2, so their poles are high, while the gain is about g_m1 R_F. After Palermo L6 slide 13 (Pisati Gm-TIA)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \node[left] at (M1.G) {$v_{in}$};
  \node[font=\scriptsize] at (0.45,-0.5) {$M_1$};
  \draw (M1.S) -- (0,-1.2) node[ground]{};
  \draw (M1.D) -- (0,1.5) node[circ]{} coordinate(X);
  \draw (0,3.4) node[above]{$V_{DD}$} to[I,l=$I_1$] (X);
  \node[anchor=east] at (-0.1,1.5) {$X$};
  \draw (X) -- (1.6,1.5);
  \draw (3.4,0.73) node[nmos](M2){};
  \draw (1.6,1.5) |- (M2.G);
  \node[font=\scriptsize] at (3.85,0.2) {$M_2$};
  \draw (M2.S) -- (3.4,-1.2) node[ground]{};
  \draw (M2.D) -- (3.4,2.2) node[circ]{} coordinate(O);
  \draw (O) to[R,l_=$R_L$] (3.4,3.6) node[above]{$V_{DD}$};
  \draw (O) -- (4.4,2.2) node[right]{$v_{out}$};
  \draw (1.0,1.5) node[circ]{} -- (1.0,2.2) to[R,l=$R_F$] (O);
  \node[font=\scriptsize,align=left,anchor=west] at (5.6,0.6) {node $X$: $Z_X=\frac{R_F+R_L}{1+g_{m2}R_L}\approx\frac{1}{g_{m2}}$\\output: $Z_{out}=R_L\parallel\frac{1}{g_{m2}}$\\gain $\approx g_{m1}R_F$};
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_X=\frac{R_F+R_L}{1+g_{m2}R_L},\qquad Z_{out}=R_L\parallel\frac1{g_{m2}},\qquad A=g_{m1}R_L\frac{g_{m2}R_F-1}{1+g_{m2}R_L}\approx g_{m1}R_F}
$$

- **The idea:** a resistive load sets gain and pole with the same $R$. Here the gain is set by $R_F$, but the nodes carrying the parasitic capacitance see impedances of order $1/g_{m2}$, so the poles sit near $g_{m2}/C$ instead of $1/(RC)$.
- **SerDes form:** Pisati's 56 Gb/s CTLE is a Gm stage (with RC degeneration) followed by an inverter-based TIA with feedback resistor $R_F$. It runs at low supply, uses NMOS and PMOS transconductance, and is linear at high swing because "mostly signal current passes through $R_F$" (L6 slides 13–15).
- **Cost:** two stages of current, and the feedback loop has two poles of its own: too much loop gain rings.

> [!note]- Derivation: impedances and gain (mine)
> M2 is a CS stage with load $R_L$ and feedback $R_F$ from drain to gate (node $X$). Inject $i$ into $X$. At the output: $(v_o-v_x)/R_F+v_o/R_L+g_{m2}v_x=0$, so $v_o=v_x\frac{(1-g_{m2}R_F)R_L}{R_F+R_L}$. Then $i=(v_x-v_o)/R_F=v_x\frac{1+g_{m2}R_L}{R_F+R_L}$, which gives $Z_X$. The transimpedance is $v_o/i=\frac{(1-g_{m2}R_F)R_L}{1+g_{m2}R_L}\to-R_F$ for large $g_{m2}R_L$ and $g_{m2}R_F$. With $i=-g_{m1}v_{in}$ the voltage gain follows.
>
> **Output impedance.** With $X$ fed only by M1's high-impedance drain, no current flows in $R_F$ at DC, so $v_x=v_o$ and the test current is $v_o/R_L+g_{m2}v_o$: $Z_{out}=R_L\parallel1/g_{m2}$.

## Level 4: The RC-Degenerated Stage

```tikz title="RC-degenerated differential pair (the CTLE core): R_S and C_S between the sources, one tail per side so R_S carries no DC. Right: exact |H| for g_m R_S/2 = 1, 3 and 7 (peaking 6, 12, 18 dB) with fixed C_S and load pole. After Palermo L8 slide 15 and Lee Fig. 9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (3.0,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in}^+$};
  \node[right] at (M2.G) {$V_{in}^-$};
  \draw (M1.D) to[R,l=$R_D$] (0,2.6) -- (3.0,2.6) to[R,l_=$R_D$] (M2.D);
  \draw (1.5,2.6) node[circ]{} -- (1.5,2.9) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} -- (-0.5,0.77) node[left]{$V_{out}^-$};
  \draw (M2.D) node[circ]{} -- (3.5,0.77) node[right]{$V_{out}^+$};
  \draw (M1.S) -- (0,-1.2) node[circ]{};
  \draw (M2.S) -- (3.0,-1.2) node[circ]{};
  \draw (0,-1.2) to[R,l=$R_S$] (3.0,-1.2);
  \draw (0,-1.2) -- (0,-1.9) to[C,l_=$C_S$] (3.0,-1.9) -- (3.0,-1.2);
  \draw (0,-1.9) to[I,l_=$I_{SS}/2$] (0,-3.5) node[ground]{};
  \draw (3.0,-1.9) to[I,l=$I_{SS}/2$] (3.0,-3.5) node[ground]{};
  \node[font=\scriptsize] at (1.5,0.9) {$C_p$ at each output};
  \begin{scope}[xshift=6.6cm,yshift=-3.2cm]
    \draw[->] (0,0) -- (6.6,0) node[right,font=\scriptsize]{$\omega/(g_m/2C_S)$};
    \draw[->] (0,0) -- (0,5.6) node[above,font=\scriptsize]{$|H|/g_mR_D$ (dB)};
    \foreach \d in {0,-6,-12,-18} {\draw (0.08,{5+0.22*\d}) -- (-0.08,{5+0.22*\d}) node[left,font=\scriptsize]{\d};}
    \foreach \t/\l in {0/0.01,2/0.1,4/1,6/10} {\draw (\t,0.08) -- (\t,-0.08) node[below,font=\scriptsize]{\l};}
    \begin{scope}
      \clip (0,0) rectangle (6.4,5.6);
      \foreach \a/\c in {1/black,3/blue!70!black,7/red!70!black} {
        \draw[thick,\c,domain=0:6.4,samples=120] plot (\x,{5+0.22*( 20*log10(1/(1+\a)) + 10*log10(1+(exp(2.302585*(\x/2-2))*\a)^2) - 10*log10(1+(exp(2.302585*(\x/2-2))*\a/(1+\a))^2) - 10*log10(1+(exp(2.302585*(\x/2-2))/4)^2) )});
      }
    \end{scope}
    \node[font=\scriptsize,anchor=south west] at (0.2,3.72) {$g_mR_S/2=1$};
    \node[font=\scriptsize,anchor=south west,blue!70!black] at (0.2,2.4) {$g_mR_S/2=3$};
    \node[font=\scriptsize,anchor=south west,red!70!black] at (0.2,1.08) {$g_mR_S/2=7$};
    \node[font=\scriptsize,align=left,anchor=west] at (3.4,1.0) {$\omega_{p2}=4\,g_m/2C_S$\\peak capped by $g_m/C_p$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{H(s)=-\frac{g_mR_D}{1+g_mR_S/2}\cdot\frac{1+s/\omega_z}{(1+s/\omega_{p1})(1+s/\omega_{p2})},\quad \omega_z=\frac1{R_SC_S},\quad\omega_{p1}=\frac{1+g_mR_S/2}{R_SC_S},\quad\omega_{p2}=\frac1{R_DC_p}}
$$

$$
\boxed{\text{peaking}=\frac{\omega_{p1}}{\omega_z}=1+\frac{g_mR_S}{2},\qquad A_{pk}\,\omega_{p2}=\frac{g_m}{C_p}}
$$

- **At DC** $R_S$ degenerates the pair: gain $g_mR_D/(1+g_mR_S/2)$. **Above $\omega_{p1}$** $C_S$ shorts $R_S$ and the full $g_mR_D$ returns. Peaking is made by *losing* DC gain, never by gaining at the peak.
- **The peak is GBW-limited.** $A_{pk}=g_mR_D$ and $\omega_{p2}=1/(R_DC_p)$ multiply to $g_m/C_p$: the same one-pole GBW as a CML buffer (Level 2). To push $\omega_{p2}$ out without losing $A_{pk}$, use the Level 3 tricks on the load (inductive peaking or neutralization, as [[Equalization#CTLE]] notes from Hanumolu).
- **Two tails, no DC in $R_S$:** with $R_S$ between the sources and one tail per side, no headroom is lost to $R_S$. (Degenerating with $R_S/2$ in each source under a shared tail would drop $I_{SS}R_S/4$.)
- **Tuning:** $C_S$ moves $\omega_z$ and $\omega_{p1}$ together (peaking constant); $R_S$ moves $\omega_z$ and the peaking (Equalization §CTLE). Lee varies both, as variable resistors and capacitors in the common-source nodes of his switching quad, for up to 4.5 dB of boost at 56 Gb/s (Fig. 9). Pisati adds a tunable bias resistor that creates a second, low-frequency zero for the channel's long tail (L6 slide 14).
- **Parasitics set the floor:** the tails' and source junctions' capacitance adds to $C_S$, so the smallest $C_S$ (highest zero) is limited; $C_{GS}$ adds another high-frequency term.

> [!note]- Derivation: $H(s)$ from the half circuit (mine; same result as Palermo L8 slide 15)
> Total $R_S$ and $C_S$ between the sources split symmetrically, so the half circuit has $Z_S=\frac{R_S}{2}\parallel\frac{1}{2sC_S}=\frac{R_S/2}{1+sR_SC_S}$ in its source. A degenerated device has $G_m=g_m/(1+g_mZ_S)$ ($C_{GS}$, body effect and $r_o$ neglected):
> $$G_m=g_m\frac{1+sR_SC_S}{1+g_mR_S/2+sR_SC_S}=\frac{g_m}{1+g_mR_S/2}\cdot\frac{1+sR_SC_S}{1+s\frac{R_SC_S}{1+g_mR_S/2}}$$
> Multiply by the load $-R_D/(1+sR_DC_p)$. The zero is $1/(R_SC_S)$, the degeneration pole is $(1+g_mR_S/2)/(R_SC_S)$, and their ratio is the peaking.

> [!tip] Remark
> What the CTLE is for (zero placement against the channel's loss, peaking range, noise enhancement, adaptation) is owned by [[Equalization#CTLE]]. The circuit around it in a receiver (VGA, offset trim, input termination) is in [[Receivers]]. A zero below a pole is the "zeros below the poles" case of [[Frequency Response#Bode Rules]].

### The same circuit as a clock buffer

Kossel's half-rate clock path starts with a **capacitively** degenerated, replica-biased CML buffer: the "resistor" is the output resistance $R_{0,N1}$ of the current source, so the zero sits at very low frequency and the buffer is band-pass. It blocks the clock's DC component, so the DC offset between the differential inputs does not turn into duty-cycle error (Kossel §IV-A, Eqs. 1–2):

$$
\boxed{s_z=\frac1{R_{0,N1}C_s},\qquad s_{p1/p2}\approx\frac1{2R_LC_L}\left(1\pm\sqrt{1-4\frac{R_LC_L}{R_{0,N2}C_s}}\right)}
$$

($R_{0,N2}$: output resistance of the switch, $R_L$, $C_L$: load.)

## Level 5: TSPC and CMOS Flip-Flops and Dividers

### TSPC flip-flop

```tikz title="True single-phase-clock (TSPC) flip-flop: three clocked stages, nine transistors, one clock phase. With QB fed back to D (through the output inverter) it is a divide-by-2. After Palermo L11 slide 107 and Won Fig. 3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (-0.5,6.0) -- (6.0,6.0); \node[above] at (2.75,6.0) {$V_{DD}$};
  % column 1
  \draw (0,5.2) node[pmos](P1){};
  \draw (0,3.7) node[pmos](P2){};
  \draw (0,1.6) node[nmos](N1){};
  \draw (P1.S) -- (0,6.0); \draw (P1.D) -- (P2.S);
  \draw (P2.D) -- (N1.D);
  \draw (N1.S) -- (0,0.4) node[ground]{};
  \node[left] at (P2.G) {$\phi$};
  \draw (P1.G) -- (-1.3,5.2) -- (-1.3,1.6) -- (N1.G);
  \draw (-1.3,3.4) node[circ]{} -- (-1.7,3.4) node[left]{$D$};
  \coordinate (X) at (0,2.65); \draw (X) node[circ]{}; \node[font=\scriptsize,anchor=south west] at (0.05,2.65) {$X$};
  % column 2
  \draw (2.6,5.2) node[pmos](P3){};
  \draw (2.6,3.0) node[nmos](N2){};
  \draw (2.6,1.6) node[nmos](N3){};
  \draw (P3.S) -- (2.6,6.0); \draw (P3.D) -- (N2.D); \draw (N2.S) -- (N3.D);
  \draw (N3.S) -- (2.6,0.4) node[ground]{};
  \node[left] at (P3.G) {$\phi$};
  \node[left] at (N3.G) {$\phi$};
  \draw (X) -- (1.4,2.65) |- (N2.G);
  \coordinate (Y) at (2.6,4.1); \draw (Y) node[circ]{}; \node[font=\scriptsize,anchor=south west] at (2.65,4.1) {$Y$};
  % column 3
  \draw (5.2,5.2) node[pmos](P4){};
  \draw (5.2,3.0) node[nmos](N4){};
  \draw (5.2,1.6) node[nmos](N5){};
  \draw (P4.S) -- (5.2,6.0); \draw (P4.D) -- (N4.D); \draw (N4.S) -- (N5.D);
  \draw (N5.S) -- (5.2,0.4) node[ground]{};
  \node[left] at (N4.G) {$\phi$};
  \draw (Y) -- (3.6,4.1) -- (3.6,5.2) -- (P4.G);
  \draw (3.6,4.1) node[circ]{} -- (3.6,1.6) -- (N5.G);
  \coordinate (Q) at (5.2,4.1); \draw (Q) node[circ]{} -- (6.3,4.1) node[right]{$\overline{Q}$};
  \node[font=\scriptsize,align=center] at (0,-0.4) {stage 1};
  \node[font=\scriptsize,align=center] at (2.6,-0.4) {stage 2};
  \node[font=\scriptsize,align=center] at (5.2,-0.4) {stage 3};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,3.2) {$\phi$ low: $X=\overline D$, $Y$ precharged high, $\overline Q$ held\\$\phi$ rises: $Y=\overline X$, $\overline Q=\overline Y$ (so $\overline Q=\overline D$)\\$\div2$: $\overline Q$ (through an inverter) back to $D$\\no static current; one clock phase};
\end{circuitikz}
\end{document}
```

- **Operation (positive edge):** while $\phi$ is low, stage 1 is transparent ($X=\overline D$), stage 2 precharges $Y$ high, stage 3 holds. When $\phi$ rises, stage 1 can only pull $X$ down, stage 2 evaluates $Y=\overline X=D$, and stage 3 drives $\overline Q=\overline Y=\overline D$, sampled at the edge.
- **Pros:** reasonably fast, compact, **no static power**, one clock phase (no $\phi/\overline\phi$ skew).
- **Cons:** three gates per input cycle; needs full-swing CMOS clocks (so a CML-to-CMOS converter in front); **dynamic**: nodes float in some phases (e.g. $\overline Q$ while $\phi$ is low), so leakage makes it fail at low frequency, e.g. in test mode (L11 slide 107).

| | CML $\div2$ | TSPC $\div2$ |
|---|---|---|
| Gates per input cycle | 2 | 3 |
| Input | CML levels, differential | full swing, single phase |
| Static power | yes ($V_{DD}I_{SS}$ per latch) | none |
| Low-frequency limit | none (static) | leakage on floating nodes |
| Speed-up | shunt peaking, >50 % | sizing; lower $V_{TH}$ |
| Area | larger | compact |

### Programmable-reset TSPC and 1-UI pulse generators

Won's 28 GBd transmitter builds its 4:1 serialization out of **1-UI pulses** from quarter-rate clocks (Figs. 2–3):

- A negative-edge flip-flop (DF1) retimes the data with $CK_D$.
- DF3, a TSPC flip-flop clocked by $CK_D$, is **reset** by $CK_P$, which is 1 UI later: its output $D_{OUT}$ is high for exactly 1 UI of every 4.
- DF2, clocked by $CK_R$ (1 UI earlier), and an inverter make $DP_{OUT}$, a 1-UI-early inverted copy that drives the tail-less driver's pull-up ([[#Tail-less CML]]).
- **Dual-strength reset:** an extra reset path (M2, M3 in Fig. 3), enabled by $ENB$, discharges QB faster, so $D_{OUT}$'s falling edge is sharper. The reset speed is a knob, which is the point: it trades a little power for edge rate per corner.

### Static divide-by-2 on data

Lee's 56 Gb/s receiver halves the **data**, not the clock: a static $\div2$ toggles at every data transition, splitting the stream into two half-rate streams $D_{div,I}$, $D_{div,II}$ that together keep every transition (Fig. 12). Each XOR then has twice the time to form a transition pulse for the linear phase detector. Lee calls it a *static* divider. My reading of why: it must hold its state through long runs of identical bits, where a dynamic (TSPC) divider's floating nodes would leak.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ swing $V_{sw}$ | Lower $g_m/I_D$ allowed at the same gain → higher $f_T$, faster; noise margin | Headroom; past $V_{TH}$ the on device leaves saturation |
| ↓ $g_m/I_D$ of the pair | $f_T$, so bandwidth at fixed gain and FO | Needs more swing for restoration; more current per $g_m$ |
| ↓ gain $A$ per stage | Bandwidth ($\propto1/A$) | Below $\sqrt2$ the logic levels decay; more stages |
| ↑ $I_{SS}$ (same $g_m/I_D$) | Drive for a fixed external load | Power; **not** speed for a self-loaded chain |
| ↓ fan-out | Bandwidth | Next stage weaker; taper chains for big loads |
| Shunt peaking ($m=\sqrt2$…$1+\sqrt2$) | $1.72$–$1.84\times$ bandwidth | Area, SRF, 0–1.5 dB peaking (ISI in PAM4) |
| Series / T-coil (capacitive splitting) | Up to 3–4× measured | Custom coils, PVT-sensitive pole-zero placement, EM simulation |
| T-coil at pad | Return loss and bandwidth with ESD | Asymmetric design numerically; ESD current in $L_b$ |
| Distributed stage | Bandwidth to the line's cutoff (70 GHz match) | Area, power, line loss limits $N$ (~3) |
| Active inductor | Peaking without spirals | Headroom ($V_{GS}$), noise, $C_{GD}$ limits it |
| Neutralization / negative $C$ | Cancels Miller or load capacitance | Matching; over-cancellation oscillates |
| Cherry-Hooper / Gm-TIA | Gain set by $R_F$ with low-impedance nodes | Extra stage current; local loop can ring |
| ↑ $R_S$ (RC degeneration) | Peaking $1+g_mR_S/2$ | DC gain; noise |
| ↑ $C_S$ | Moves $\omega_z,\omega_{p1}$ down | Parasitic floor on the high end |
| CML instead of CMOS | Speed beyond ~8 FO4 clocks / 2 FO4 bits; supply rejection | Static power at any data rate |
| More MUX phases (half/quarter rate) | Each gate runs slower; CMOS becomes possible | Phase spacing and duty cycle errors become eye errors |
| TSPC instead of CML FF | Zero static power, compact | Full-swing clock, three gates/cycle, fails slow |

## Cheat sheet

| Quantity | Equation |
|---|---|
| CML swing, output CM | $V_{sw}=I_{SS}R$, $V_{CM}=V_{DD}-V_{sw}/2$ |
| Gain at the crossing | $A=g_mR=(g_m/I_D)\,V_{sw}/2$ |
| Restoration (square law) | $A\ge\sqrt2\iff V_{sw}\ge2\sqrt2/(g_m/I_D)$ |
| On device saturated | $V_{sw}\le V_{TH}$ |
| Tail headroom | $V_{DD}-V_{sw}/2-V_{GS}\ge V_{D,sat,tail}$ |
| Stage bandwidth | $f_{-3\text{dB}}=(1-k)f_T/(A\cdot\text{FO})$; $\tau=A\cdot\text{FO}/((1-k)\omega_T)$ |
| GBW | $A f_{-3\text{dB}}=g_m/(2\pi C)=(1-k)f_T/\text{FO}$ |
| Rise time | $t_r=2.2\tau=0.35/f_{-3\text{dB}}$ |
| CMOS limits | $T_{clk}\gtrsim8$ FO4; MUX bit $\gtrsim2$ FO4; $T_b\approx8\text{ FO4}/M$ |
| Shunt peaking | $Z_N=\frac{1+s/(m\omega_0)}{1+s/\omega_0+s^2/(m\omega_0^2)}$, $m=R^2C/L$; $m=\sqrt2$: 1.84×, 1.5 dB; $m=1+\sqrt2$: 1.72×, flat |
| Series peaking | $Z_N=1/[1+s/\omega_0+\frac{1-k_C}{m}s^2/\omega_0^2+\frac{k_C(1-k_C)}{m}s^3/\omega_0^3]$, max 2.52× at $k_C=0.3$ |
| Best ideal BWER | bridged-shunt-series 4.0 ($k_C=0.4$, 2 dB); asym. T-coil 5.59 ($k_C=0.1$, 2 dB) |
| Active inductor | $L=(C_{GS}/g_m)(R_S-1/g_m)$ |
| Neutralization | $C_{in}=C_{GS}+(1+A)C_{GD}+(1-A)C_N$ |
| Cross-coupled pair, $C$ between sources | $Z=-2/g_m-1/(sC)$ |
| Cherry-Hooper | $Z_X=(R_F+R_L)/(1+g_{m2}R_L)$, $Z_{out}=R_L\parallel1/g_{m2}$, $A\approx g_{m1}R_F$ |
| RC degeneration | $\omega_z=1/(R_SC_S)$, $\omega_{p1}=(1+g_mR_S/2)/(R_SC_S)$, $\omega_{p2}=1/(R_DC_p)$, peaking $1+g_mR_S/2$ |
| CTLE peak GBW | $A_{pk}\,\omega_{p2}=g_m/C_p$ |
| Capacitively degenerated buffer | $s_z=1/(R_{0}C_s)$, $s_{p1/p2}\approx\frac{1}{2R_LC_L}\big(1\pm\sqrt{1-4R_LC_L/(R_{0,N2}C_s)}\big)$ |
| Dividers | CML $\div2$: $f_{in,max}\approx1/(2t_d)$; TSPC: $\approx1/(3t_d)$ |

## References

- **S. Shekhar, J. S. Walling, D. J. Allstot, "Bandwidth Extension Techniques for CMOS Amplifiers," IEEE JSSC vol. 41, no. 11, Nov. 2006** (`ref/SerDes/2006_passive_bw_extension_techniques_shekhar_jssc.pdf`): §I ($k_C$ typically 0.2–0.5, Fig. 2); §II shunt and bridged-shunt peaking (Eqs. 1–3, Figs. 3–5); §III series and bridged-shunt-series (Eqs. 4–5, Tables I–II, Figs. 6–9); §IV asymmetric T-coil (Eq. 6, Table III, Figs. 10–11); §V-A GBW falling with gain in fine-line CMOS; §V-B T-coil winding; §VI measurements and Table IV; §VII modified series peaking for $k_C<0.1$ (Fig. 18).
- **M. Kossel et al., "A T-Coil-Enhanced 8.5 Gb/s High-Swing SST Transmitter in 65 nm Bulk CMOS," IEEE JSSC vol. 43, no. 12, Dec. 2008** (`ref/SerDes/tcoil_sst_tx_kossel_jssc_2008.pdf`): §I (CML vs SST); §IV-A pre-driver, capacitively degenerated clock buffer (Eqs. 1–2, Fig. 5), AC-coupled CML-to-CMOS converter; §V ESD and T-coil (Eqs. 3–11, Table I, Figs. 10–13).
- **S. Palermo, ECEN720 lecture slides** (`ref/SerDes/`): L5 termination and TX driver: slides 29 (tail-less driver), 42–47 (pad network, T-coil, double T-coil, π-coil), 55–66 (TX speed limits, FO4, CMOS and CML MUX, multiplexing factor). L6 RX circuits: slides 8–9 (RX T-coils), 12–17 (static amplifiers, Gm-TIA, RC-degenerated CTLE, inverter-based cells), 37–40 (CML vs StrongARM latch), 54 (optimum bandwidth). L11 clocking: slides 18, 106–108 (TSPC and CML $\div2$). L14 clock distribution: slides 11, 17, 19–20, 28–29 (jitter amplification, active-inductor distribution, CML2CMOS, QEC in a CML divider, DCC by trip-point shift). L8 slide 15 for the CTLE pole/zero expressions (via [[Equalization]]).
- **S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems," ch. 9 in *High-Speed Circuits* (2011)** (`ref/SerDes/serial_links_chapter_palermo_2011.pdf`): pp. 292, 300 (6–8 FO4 clock limit, sub-20 ps FO4 and ~400 GHz $f_T$ at 45 nm), p. 312 (CML power scaling), p. 313 (peaking inductors in TIAs).
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," IEEE JSSC vol. 50, no. 9, Sept. 2015** (`ref/SerDes/56G_NRZPAM4_J.pdf`): Fig. 4 and §III-A (PAM4 combiner, peaking accuracy), Fig. 8 (flattened LSB decoder), Fig. 9 (RC-degenerated quad pre-amp), Fig. 11 and §IV-A (distributed 60 Gb/s MUX), Fig. 12 and §IV-B (static $\div2$ on data, XOR limit, flip-flop limit).
- **J. Won, J. Kim, "A 28/56 Gb/s NRZ/PAM-4 Dual-Mode Transmitter with Eye-Opening Enhancement in 28 nm CMOS," *Electronics* 13, 3774, 2024** (`ref/SerDes/electronics-13-03774.pdf`): Figs. 2–5 (1-UI pulse generator, TSPC with dual-strength reset, tail-less CML with auxiliary pull-up, rise times by corner).
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §6.3 Ex. 6.14 and Fig. 6.30 (active inductor); §6.1 Miller's theorem; §4.2 large-signal pair (via [[Differential Amplifiers]]). Ch. 6 has no RC-degenerated stage; its $H(s)$ here is derived from the degenerated-$G_m$ result.
- **Jespers & Murmann, *Systematic Design of Analog CMOS Circuits*** : Table 1.1 (65 nm NMOS at $L=60$ nm: $g_m/I_D$ 5/10/20 S/A → $f_T$ 122/64.2/12.7 GHz, $J_D$ 162/38.4/3.2 µA/µm); Ch. 2 ($\omega_T/10$ rule, Fig. 2.30).
- **Not used (not local):** Mohan et al., JSSC 2000 (shunt-peaking design equations); the shunt-peaking results here come from Shekhar §II instead.
