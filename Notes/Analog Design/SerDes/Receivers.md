---
title: Receivers
description: The wireline receiver as a circuit chain, from the pad (termination, ESD, T-coil, AC coupling) through CTLE and VGA, DFE summers and tap DACs, slicers, offset trim and demultiplexing, to PAM4 and ADC-based receivers, with RX specs translated to gm/ID sizing.
kind: topic
status: growing
aliases:
  - Receivers
  - SerDes Receiver
  - RX Front End
---

This note is the receiver as a chain of circuits. [[Equalization]] decides *what* the CTLE and DFE must do; [[Comparators]] owns the latch inside every slicer; [[High-Speed Circuit Techniques]] owns the CML stage, peaking and the RC-degenerated pair. Here they are wired together into a receiver, and the receiver's specs (sensitivity, return loss, peaking range, DFE timing, power) are pushed down to transistor sizes.

## The big picture

```tikz title="A mixed-signal wireline receiver (half-rate, one data path shown). The input network presents 50 ohm to the channel; the analog front end (CTLE + VGA) shapes and scales the signal; the DFE summer subtracts post-cursor ISI; clocked slicers decide; the demux slows the bits down. Offset DACs, CDR and adaptation close loops around it. After Palermo ECEN720 L6 slides 6, 11, 69 and L8 slide 23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=1.1cm,align=center,fill=white},
  s/.style={font=\scriptsize\itshape,text=blue!60!black,align=center}]
  \node[b,minimum width=1.9cm] (in) at (0,0) {pad, ESD,\\T-coil, $R_T$,\\AC coupling};
  \node[b,minimum width=1.6cm] (ctle) at (2.7,0) {CTLE\\1--2 stages};
  \node[b,minimum width=1.1cm] (vga) at (4.75,0) {VGA};
  \node[draw,thick,circle,inner sep=1.5pt] (sum) at (6.3,0) {$\Sigma$};
  \node[b,minimum width=1.5cm,minimum height=0.7cm] (s0) at (8.3,0.75) {slicer $\phi_0$};
  \node[b,minimum width=1.5cm,minimum height=0.7cm] (s1) at (8.3,-0.35) {slicer $\phi_{180}$};
  \node[b,minimum width=1.5cm,minimum height=0.7cm] (se) at (8.3,-1.45) {edge / error};
  \node[b,minimum width=1.3cm,minimum height=2.8cm] (dmx) at (10.7,-0.35) {DEMUX\\$1{:}N$};
  \node[b,minimum width=1.3cm,minimum height=2.8cm] (dec) at (12.6,-0.35) {decoder\\(PAM4)\\+ logic};
  \draw[->,thick] (-1.6,0) node[left,align=right] {from\\channel} -- (in);
  \draw[->,thick] (in) -- (ctle);
  \draw[->,thick] (ctle) -- (vga);
  \draw[->,thick] (vga) -- (sum);
  \draw[->,thick] (sum.east) -- ++(0.3,0) |- (s0.west);
  \draw[->,thick] (sum.east) ++(0.3,0) |- (s1.west);
  \draw[->,thick] (sum.east) ++(0.3,0) |- (se.west);
  \foreach \s in {s0,s1,se} \draw[->,thick] (\s.east) -- (\s.east-|dmx.west);
  \draw[->,thick] (dmx) -- (dec);
  \draw[->,thick] (dec.east) -- ++(0.6,0) node[right] {$N$ bits};
  % DFE feedback
  \node[b,minimum width=1.6cm,minimum height=0.7cm] (tap) at (6.3,-2.4) {tap DACs $w_i$};
  \draw[->,thick,red!70!black] (9.3,-0.35) -- (9.3,-2.4) -- (tap.east) node[pos=0.75,above] {$\hat d_{k-1}$};
  \draw[->,thick,red!70!black] (tap.north) -- (sum.south) node[pos=0.5,left] {$-$};
  % offset, CDR, adaptation
  \node[b,minimum width=1.6cm,minimum height=0.6cm] (os) at (8.3,2.1) {offset DACs};
  \draw[->] (os) -- (s0.north);
  \node[b,minimum width=2.6cm,minimum height=0.7cm] (cdr) at (10.7,-3.0) {CDR: clock phases};
  \draw[->] (cdr.west) -| (8.3,-1.8);
  \node[b,minimum width=2.4cm,minimum height=0.6cm] (ad) at (12.6,2.1) {adaptation (LMS)};
  \draw[->] (dec.north) -- (ad.south);
  \draw[->] (ad.west) -- (os.east);
  \draw[->,dashed] (ad.north) -- ++(0,0.4) -| (ctle.north);
  % spec labels
  \node[s,below=2pt] at (in.south) {$|S_{11}|$, $C_{pad}$};
  \node[s,below=2pt] at (ctle.south) {peaking\\$1+g_mR_S/2$};
  \node[s,below=2pt] at (vga.south) {gain, linearity};
  \node[s,anchor=north] at (6.3,-2.85) {settle in $<1$ UI};
\end{circuitikz}
\end{document}
```

> [!important] The results the rest of the note refines
> 1. **Sensitivity** is a voltage budget at the slicer: $v_S^{pp}=2\,\sigma_n\sqrt{SNR}+v_{min}+v_{offset}$. With $\sigma_n\approx1$ mV rms, $\sqrt{SNR}=7$ ($10^{-12}$) and $v_{min}+v_{offset}<6$ mV, a receiver resolves about **20 mVpp**. Uncorrected offset (tens of mV) dominates, so every slicer is trimmed.
> 2. **Input match is a capacitance budget.** A 50 Ω termination with shunt $C$ meets $|S_{11}|<-7$ dB at Nyquist only if $\omega_N C Z_0<1$, i.e. $C<1/(2\pi f_N\cdot50\,\Omega)$: 227 fF per side at $f_N=14$ GHz. Pad + ESD + CTLE input usually exceed it, which is why RX pads carry T-coils.
> 3. **The CTLE buys peaking $1+g_mR_S/2$ with DC gain**, and its peak is capped by $g_m/C_p$. The front-end bandwidth that maximizes margin sits near or slightly above $f_N$: more bandwidth lowers ISI but raises integrated noise.
> 4. **The DFE first tap is a timing closure:** $t_{clk\to Q}+t_{mux}+t_{sum}\le1$ UI with the summer settled to ≥95 % ($\approx3\tau$). An integrating summer (swing $I\Delta T/C$) needs about $3\times$ less current than a resistive one (swing $IR$, $\tau=RC$). Unrolling takes the summer out of the loop at the cost of $2^N$ ($4^N$ for PAM4) slicers.
> 5. **Demultiplexing by $N$** gives each slicer $N$ UI to sample, regenerate and reset, at the cost of $N\times$ the input load and a phase-accuracy requirement $N\times$ tighter in degrees.
> 6. **PAM4 = three slicers at $0,\pm\tfrac23$ of the peak** (a 2-bit flash), each sub-eye a third of the NRZ eye, with thresholds set by offset knobs and kept centred by an error-sampler loop.

**Map:** [[#Spec translation|RX specs → CTLE, summer, slicer sizing]] → [[#Level 0 The Receiver as a Black Box|black box, eye mask, sensitivity]] → [[#Level 1 The Input Network|termination, ESD, T-coil, coupling, CM]] → [[#Level 2 The Analog Front End|CTLE circuits, VGA, noise vs bandwidth]] → [[#Level 3 Slicers in the Receiver|aperture, ISF, slicer choice]] → [[#Level 4 Offset Correction|offset DACs and loops]] → [[#Level 5 DFE Circuits|summers, tap DACs, speculation]] → [[#Level 6 Demultiplexing|half/quarter-rate, demux trees]] → [[#Level 7 PAM4 Receivers|PAM4]] → [[#Level 8 ADC-Based Receivers|ADC-based]] → [[#How These Receivers Work|the papers' receivers]].

## Spec translation

A receiver contains three kinds of amplifiers: **linear stages** (CTLE, VGA, the DFE summer's input pair), sized with $g_m/I_D$ like any amplifier; **switched current pairs** (DFE taps, offset DACs), sized as current DACs; and **regenerative latches** (slicers), whose figure of merit is $g_m/C$ ([[Comparators#Spec translation]]). The RX specs land on them as follows.

### The receiver's specs

| RX spec | Meaning | Typical number (source) |
|---|---|---|
| Data rate, UI, $f_N$ | Symbol rate sets every time budget | 56 Gb/s PAM4 = 28 GBd, UI = 35.7 ps, $f_N=14$ GHz |
| BER | Sets $\sqrt{SNR}$ (the $Q$ multiple) | $10^{-12}$: $\sqrt{SNR}=7$ (Palermo L6 slide 52); PAM4: $V_{pp}/6\sigma>7.1$ (Lee Eq. 1) |
| Sensitivity $v_S^{pp}$ | Smallest eye the RX resolves at the target BER | 20 mVpp typical (Palermo L6 slide 57); Wong 33 mV (Table II); Lee PAM4 23 mV level spacing, NRZ 47 mVpp (Figs. 19d, 21d) |
| Input return loss | Match to the channel, set by pad capacitance | $\vert S_{11}\vert <-7$ dB at Nyquist (Palermo L5 slide 42, quoted for the TX pad; the RX pad faces the same class of spec) |
| CTLE peaking range and step | Loss the CTLE must cover after TX FFE and DFE | Lee 4.5 dB max (Fig. 9b); Hanumolu 8 dB ([[Equalization#CTLE]]) |
| DC gain / VGA range, linear range | Scale the eye to the slicer (or ADC) full scale without compressing PAM4 outer levels | Lee: input levels about 100 mV diff. (Fig. 9c) |
| DFE taps: count, range, resolution | Post-cursors to cancel; $w_i$ range $\ge\vert h_i\vert $ | Payne: tap 1 5 b, tap 2 4 b + sign, taps 3–4 3 b + sign (L8 slide 23) |
| DFE timing | First tap closes inside 1 UI (½ UI if edges need it) | Payne closes in ½ UI |
| Slicer offset (after trim), aperture, metastability | Pieces of the sensitivity and timing budgets | residual ≈1 mV; $v_{min}<5$ mV (L6 slide 52) |
| Power / energy per bit | | Wong 6.4 mW at 3.6 Gb/s; Toifl 10.4 mW/Gb/s; Lee PAM4 RX 420 mW at 56 Gb/s; Roshan Zamir 4.6 pJ/b |

### Mapping receiver specs to amplifier specs

| RX spec | Block / device | Amplifier spec that sets it | Result |
|---|---|---|---|
| Sensitivity (noise part) | Termination, CTLE input pair, slicer | **Input-referred noise** integrated through $\vert H\vert ^2$ | $\sigma_n=\sqrt{\int\vert H\vert ^2S_{in}\,df+\sigma_{slicer}^2}\le\dfrac{v_S^{pp}-v_{min}-v_{off}}{2\sqrt{SNR}}$ |
| Sensitivity (offset part) | Slicer / preamp input pair + trim DAC | **Input offset** after trim: range $\pm3\sigma$, LSB | $\text{LSB}=\dfrac{6\sigma_{V_{OS}}}{2^{N_b}-1}$ |
| Return loss | Pad, ESD, termination, CTLE input | **Input capacitance** $C_{gg}$ of the first stage | $C_{pad}+C_{ESD}+C_{gg}<\dfrac1{2\pi f_NZ_0}$ (or add a T-coil) |
| Peaking | CTLE degeneration | **DC gain vs peak gain** | $1+g_mR_S/2$ = peaking; $A_{DC}=g_mR_D/(1+g_mR_S/2)$ |
| Front-end bandwidth | CTLE load | **GBW** $g_m/(2\pi C_p)$ | $A_{pk}\,f_{p2}=g_m/(2\pi C_p)$, $f_{p2}\gtrsim f_N$ |
| PAM4 linearity | CTLE, VGA | **Linear input range** (degeneration) | outer levels inside the pair's linear range |
| DFE timing | Summer + slicer + mux | **Settling time** (resistive) or integration window | $3RC\le1\,\text{UI}-t_{clk\to Q}-t_{mux}$ |
| DFE tap range | Tap current DAC, summer load | **Output swing** per tap | $w_i=I_{H_i}R$ (resistive) or $I_{H_i}\Delta T/C$ (integrating) |
| Metastability | Slicer + following latches | **$\tau_{reg}=C/g_m$**, gain before the latch $A_0$ | $T_{res}/\tau_{reg}\ge\ln\dfrac{V_{logic}}{A_0\,\Delta V\,P_{meta}}$ |
| Power | Every CML stage | **Bias current** | $P=V_{DD}\sum I_{SS}$ + $f_{CK}CV_{DD}^2$ for latches |

$$
\boxed{v_S^{pp}=2\,\sigma_n\sqrt{SNR}+v_{min}+v_{offset},\qquad C_{in,tot}<\frac{1}{2\pi f_NZ_0},\qquad 3RC_{sum}\le1\,\text{UI}-t_{clk\to Q}-t_{mux}}
$$

> [!note]- Derivation: where each row comes from
> **Sensitivity.** The slicer sees signal $\pm v_S/2$ plus Gaussian noise $\sigma_n$, a bounded offset and a dead zone $v_{min}$ (hysteresis, metastability window, bounded noise). A wrong decision needs the noise to cancel what is left after the bounded terms: $v_S/2-(v_{min}+v_{off})/2 > \sqrt{SNR}\,\sigma_n$, with $\sqrt{SNR}=Q^{-1}(\text{BER})\approx7$ at $10^{-12}$ (Palermo L6 slide 52, Palermo 2011 Eq. 9.5). Multiply by 2. The noise is the output noise of the front end, $\int|H|^2S_{in}df$ (L6 slide 53), plus the slicer's own input-referred noise, added in power.
>
> **Return loss.** $|S_{11}|<-7$ dB at $f_N$ is exactly $2\pi f_NCZ_0<1$; derived in [[Smith Chart and Impedance Matching#Termination Matching (SerDes and on-chip)]].
>
> **Summer settling.** A resistive summer is one pole: its output reaches $1-e^{-t/\tau}$ of final value, and 95 % needs $t=\ln20\,\tau\approx3\tau$ (Palermo L8 slide 26 asks for >95 %). The time left for it is what the slicer and mux don't use of the 1-UI loop (L8 slide 24).
>
> **Integrating summer.** With the same window $t_w=3RC$, an integrator reaches $V=It_w/C=I\cdot3R$: three times the resistive swing $IR$ for the same current, which is Palermo's "typically 3×" (L8 slide 27).
>
> **Metastability.** The latch must grow $A_0\Delta V$ to $V_{logic}$ within the resolution time ([[Comparators#Spec translation]]).

### Where it lands in sizing

| Amplifier spec | Lands on | Rule |
|---|---|---|
| CTLE GBW $g_m/C_p$ | **Low** $g_m/I_D$ (high $f_T$), $L_{min}$; $I_D=g_m/(g_m/I_D)$ | Same $f_T$-limited stage as a CML buffer ([[High-Speed Circuit Techniques#Spec translation]]) |
| CTLE input capacitance (return loss) | $W$ of the CTLE pair: $C_{gg}=g_m/\omega_T$ | Higher $g_m/I_D$ raises $C_{gg}$ for the same $g_m$; T-coil if the budget breaks |
| CTLE noise | $g_m$ of the pair (input-referred $\propto1/g_m$) and $R_D$ | $\overline{v_n^2}\approx 8kT\gamma/g_m+8kT/(g_m^2R_D)$ per Hz |
| Peaking | $R_S$ (times the $g_m$ already chosen), $C_S$ | $R_S=2(\text{pk}-1)/g_m$, $C_S=1/(2\pi f_zR_S)$ |
| PAM4 linear range | $V_{OV}$ of the pair (low $g_m/I_D$) and degeneration | Linear range of a pair $\sim\sqrt2V_{OV}$, widened by $R_S$ ([[Differential Amplifiers#Large-Signal Characteristic]]) |
| Summer $R$, $C$ | Load resistor; slicer input + wire capacitance | $R\le t_{sum}/(3C)$ |
| Tap / offset current DACs | Switching pairs fully steered; tail as a binary-weighted current source | Pairs: switch, not linear: small $W$, any $g_m/I_D$; tails: long $L$ for matching |
| Slicer offset | Input-pair $WL$ (Pelgrom), **high** $g_m/I_D$ | $\sigma_{V_{OS}}=A_{V_t}/\sqrt{WL}$; trim the rest |
| Slicer $\tau_{reg}$ | Cross-coupled pair: short $L$, **low** $g_m/I_D$ | $\tau_{reg}\approx C/g_m$ |

> [!tip] Remark
> The lookup-table procedure ($f_T$, $J_D$ and $g_m/g_{ds}$ against $g_m/I_D$ and $L$) is [[gm-ID Design Methodology]]. The rules for the latch are in [[Comparators#Spec translation]]; for CML stages in [[High-Speed Circuit Techniques#Where it lands in sizing]]. Only the receiver-level glue is here.

### Worked example: 56 Gb/s PAM4 receiver front end

Targets: 28 GBd PAM4 (UI = 35.7 ps, $f_N=14$ GHz), BER $10^{-12}$, 65 nm devices (Jespers & Murmann Table 1.1: $L=60$ nm; $g_m/I_D=10$ S/A gives $f_T=64.2$ GHz, $J_D=38.4$ µA/µm). Channel: Roshan Zamir's 20.8 dB at 14 GHz (Palermo L6 slide 72), with a TX FFE and a 1-tap DFE taking part of it. All circuit numbers below are my calculation.

1. **Return loss → input capacitance budget.** $C<1/(2\pi\cdot14\text{ GHz}\cdot50\ \Omega)=227$ fF per side, for pad + ESD + CTLE input together. Kossel's ESD alone was about 300 fF ([[High-Speed Circuit Techniques#T-coils at the pad]]), so this receiver needs a T-coil from the start (step 3 shows the CTLE adds another 87 fF).
2. **Peaking and bandwidth → CTLE.** Give the CTLE 10 dB of peaking (the rest of the 20.8 dB goes to the TX FFE and DFE, [[Equalization#Level 4 Partitioning FFE, CTLE and DFE]]): $1+g_mR_S/2=3.16$, $g_mR_S=4.3$. Choose $A_{pk}=g_mR_D=2$, so $A_{DC}=0.63$ ($-4$ dB: a VGA must follow). Put the load pole at $f_{p2}=2f_N=28$ GHz with $C_p=100$ fF (slicer inputs + wire + own drain, assumed): $g_m=2\pi A_{pk}f_{p2}C_p=35$ mS.
3. **$g_m/I_D$ → current and width.** At 10 S/A: $I_D=3.5$ mA per side, $W=3.5\text{ mA}/38.4\ \mu\text{A}/\mu\text{m}=92$ µm, $C_{gg}=g_m/(2\pi f_T)=87$ fF. Then $R_D=57\ \Omega$ (0.2 V drop), $R_S=123\ \Omega$; for $f_{p1}=f_N$, $f_z=4.4$ GHz and $C_S=292$ fF.
4. **Noise.** Input-referred: pair $8kT\gamma/g_m$ ($\gamma=1$ assumed) plus $R_D$ plus the two 25 Ω (source ∥ termination) halves: $1.5$ nV/√Hz differential. $\int|H|^2df=120$ GHz for this $H$, so the CTLE output noise is **0.52 mV rms**. Add a slicer with Razavi's 0.31 mV ([[Comparators#Level 8 Design Study 5 GHz StrongARM in 28 nm]]): $\sigma_n=0.60$ mV.
5. **Sub-eye needed at the slicer.** PAM4 at $10^{-12}$ needs half a sub-eye $>7.1\sigma$ (Lee Eq. 1). With $v_{min}+v_{off}=6$ mV: sub-eye $\ge2\cdot7.1\cdot0.60+6=14.5$ mV, full eye $\ge3\times14.5=44$ mVpp at the slicer. (Lee measured 23 mV of level spacing at his RX input, Fig. 19d: the same order.)
6. **Offset trim.** Palermo's slicer pair ($W/L=4\ \mu\text{m}/150$ nm, $A_{V_t}=2.8$ mV·µm): $\sigma=3.6$ mV, range $\pm3\sigma\approx\pm11$ mV, 5 bits: LSB $=22/31=0.71$ mV, residual $\pm0.35$ mV.
7. **DFE timing.** If the slicer is Razavi's 28 nm StrongARM (22 ps clock-to-output, [[Comparators#Level 8 Design Study 5 GHz StrongARM in 28 nm]]) and the tap is fed directly ($t_{mux}\approx0$), the summer gets $35.7-22=13.7$ ps: $\tau\le4.6$ ps. With $C_{sum}=50$ fF (assumed), $R\le91\ \Omega$; a 50 mV tap needs $I_{H1}=0.55$ mA, or $0.18$ mA in an integrating summer with the same window. Too tight for comfort, so this design would **unroll the first tap**.
8. **Metastability.** $A_0=3.15$, $V_{logic}=0.95$ V, a 7 mV half sub-eye and $P_{meta}=10^{-13}$: $T/\tau_{reg}\ge\ln(0.95/(3.15\cdot0.007\cdot10^{-13}))=33.7$. With $\tau_{reg}=2.5$ ps that is 84 ps, about 2.4 UI: more than the slicer's own phase, so the decision must keep regenerating in the latches after it (the demux), which half- or quarter-rate clocking provides.
9. **Power** (CTLE alone): $2\times3.5$ mA at a 1.2 V supply (assumed) is 8.4 mW, 0.15 pJ/b.

> [!warning] Unverified
> The example mixes 65 nm device data (Jespers & Murmann) with a 28 nm slicer (Razavi) and assumes $C_p$, $C_{sum}$, $\gamma$ and the supply. Treat the numbers as a first pass that shows which spec binds (return loss, then DFE timing), not as a design.

## Level 0: The Receiver as a Black Box

### What the Receiver Does

```tikz title="The minimal receiver: a preamplifier, a clocked sampler/comparator and a decoder. After Palermo L6 slide 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[left]{$V_{in}$} -- (0.5,0);
  \draw[thick] (0.5,0.8) -- (0.5,-0.8) -- (2.0,0) -- cycle;
  \node[font=\scriptsize] at (1.1,1.1) {pre-amplifier};
  \draw[->] (2.0,0) -- (2.8,0);
  \draw[thick] (2.8,0.8) -- (2.8,-0.8) -- (4.3,0) -- cycle;
  \draw (3.15,-0.25) -- (3.35,-0.25) -- (3.35,0.25) -- (3.55,0.25);
  \draw[->] (3.4,-1.2) node[below]{clk} -- (3.4,-0.5);
  \node[font=\scriptsize] at (3.5,1.1) {sampler / comparator};
  \draw[->] (4.3,0) -- (5.0,0);
  \node[draw,thick,minimum width=1.4cm,minimum height=0.9cm] (d) at (5.75,0) {decoder};
  \draw[->] (d.east) -- ++(0.6,0) node[right]{bits};
  \node[font=\scriptsize,align=left,anchor=north west] at (0,-1.7) {pre-amp: gain at full data rate, lower input-referred noise,\\ \quad equalization, offset correction, sets the sampler's common mode\\ comparator: clocked regeneration (power-efficient gain)\\ decoder: PAM4 / duobinary only};
\end{circuitikz}
\end{document}
```

- The receiver must **sample with timing precision** and **resolve to logic levels with high sensitivity** (Palermo L6 slide 6).
- **Gain is cheapest in a latch.** A regenerative latch dissipates no DC current, so it is more power-efficient than a cascade of linear stages; linear pre-amplification is kept to the few stages that equalize (Palermo 2011 §9.2.1).
- With differential signaling the threshold is free (zero); a single-ended receiver must generate one that tracks amplitude, loss and noise (Palermo 2011 §9.2.1). Wong's pseudo-differential comparator compares against a $V_{ref}$ for exactly this reason.

### The Eye Mask: Sensitivity, Offset, Aperture

```tikz title="The receiver's eye mask: the eye must contain a box whose height is sensitivity plus offset and whose width is aperture plus timing offset (skew + jitter). After Palermo L6 slide 5 (Dally)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick] (0,0) .. controls (1.2,1.9) and (4.8,1.9) .. (6,0);
  \draw[thick] (0,0) .. controls (1.2,-1.9) and (4.8,-1.9) .. (6,0);
  \draw[thick] (-0.6,0.9) -- (0.6,-0.9); \draw[thick] (-0.6,-0.9) -- (0.6,0.9);
  \draw[thick] (5.4,0.9) -- (6.6,-0.9); \draw[thick] (5.4,-0.9) -- (6.6,0.9);
  \fill[gray!25] (2.0,-0.65) rectangle (4.0,0.65);
  \fill[black] (2.85,-0.25) rectangle (3.55,0.45);
  \draw[dashed,red!70!black] (2.0,-0.65) rectangle (4.0,0.65);
  % sensitivity
  \draw[<->] (7.3,-0.25) -- (7.3,0.45) node[midway,right,font=\scriptsize]{sensitivity};
  \draw[dotted] (3.55,0.45) -- (7.4,0.45); \draw[dotted] (3.55,-0.25) -- (7.4,-0.25);
  \draw[<->] (8.9,-0.25) -- (8.9,-0.05) node[midway,right,font=\scriptsize]{offset};
  \draw[dotted] (3.0,-0.05) -- (9.0,-0.05); \draw[dotted] (3.0,0) -- (3.0,-0.05);
  % aperture
  \draw[<->] (2.85,2.0) -- (3.55,2.0) node[midway,above,font=\scriptsize]{aperture};
  \draw[dotted] (2.85,0.45) -- (2.85,2.1); \draw[dotted] (3.55,0.45) -- (3.55,2.1);
  \draw[<->] (2.0,-2.0) -- (2.85,-2.0) node[midway,below,font=\scriptsize]{skew + jitter};
  \draw[dotted] (2.0,-0.65) -- (2.0,-2.1); \draw[dotted] (2.85,-0.25) -- (2.85,-2.1);
  \node[font=\scriptsize,align=left,anchor=west] at (-0.8,-2.9) {minimum eye height = sensitivity + peak-to-peak offset\\ minimum eye width = aperture + peak-to-peak timing jitter};
\end{circuitikz}
\end{document}
```

$$
\boxed{H_{eye,min}=v_S+V_{OS,pp},\qquad W_{eye,min}=t_{ap}+t_{jitter,pp}}
$$

- **Sensitivity**: the smallest input the slicer resolves at the target BER (noise + latch dead zone).
- **Offset**: voltage (threshold error) and time (sampling-phase error). Bounded, so it adds linearly.
- **Aperture**: how long the slicer "looks" at the input; it adds to the jitter on the time axis ([[#Sampling Function and Aperture]]).

> [!tip] Remark
> These are the receiver's entries in the link budget of [[Signaling and BER#Link Budget]] and the timing bathtub of [[Link Noise and Jitter#The Timing Bathtub]]. The offset and noise sources themselves are listed in [[Link Noise and Jitter#Receiver Offset]].

### Sensitivity

$$
\boxed{v_S^{pp}=2\,v_n^{rms}\sqrt{SNR}+v_{min}+v_{offset}\quad\xrightarrow{\ v_n=1\text{ mV},\ \sqrt{SNR}=7,\ v_{min}+v_{off}<6\text{ mV}\ }\quad v_S^{pp}\approx20\text{ mVpp}}
$$

| Term | Source | Typical |
|---|---|---|
| $v_n^{rms}$ (Gaussian, unbounded) | Termination, CTLE/VGA, slicer, all integrated through the front end | $\lesssim1$ mV rms with proper biasing |
| $\sqrt{SNR}$ | BER target | 7 at $10^{-12}$ |
| $v_{min}$ | Hysteresis, finite regeneration gain (metastability window), bounded noise | $<5$ mV |
| $v_{offset}$ | Mismatch, mostly $V_{th}$; the largest term if uncorrected ($>50$ mV possible) | ~1 mV after trim |

(Palermo L6 slides 52, 56–57; Palermo 2011 Eq. 9.5.) Sensitivity propagates to the transmitter: a receiver that resolves 20 mV lets a low-swing voltage-mode driver replace a current-mode one, a 4× current saving at the same received swing (Palermo 2011 §9.4).

> [!tip] Remark
> $\sqrt{SNR}=7$ is $Q^{-1}(10^{-12})=7.03$ from [[Signaling and BER#One Slicer and One Gaussian]]; the latch's $v_{min}$ from metastability is [[Comparators#Sensitivity]]; Pelgrom offset is [[Nonlinearity and Mismatch#Input-Referred Offset]].

### Two Receiver Architectures

| | Mixed-signal (analog) RX | ADC-based RX |
|---|---|---|
| Chain | AFE (CTLE, VGA) → DFE summer → slicers → demux | AFE (CTLE, VGA) → time-interleaved ADC → DSP (FFE, DFE, CDR) |
| What the AFE optimizes for | Symbol detection | Quantization (ADC full scale, linearity) |
| Strength | Lower power; decades of NRZ circuit experience | Flexible, long FFEs, strong DSP on long-reach PAM4 |
| Cost | Every block hand-tuned as margin shrinks | ADC and DSP power, complexity |

(Palermo L6 slide 11; Zhang slide 55.) Levels 1–7 build the mixed-signal receiver; [[#Level 8 ADC-Based Receivers]] swaps its back half for an ADC.

## Level 1: The Input Network

Everything between the package ball and the first transistor gate: the termination that ends the line, the ESD devices that protect the gate, the inductors that hide their capacitance, and the coupling that sets the common mode.

### Termination

- **On-chip, at both ends.** Off-chip termination leaves the package as an unterminated stub; on-chip termination makes the package inductance part of the line. Double termination (TX and RX) gives the best signal and is what most high-performance links do (Palermo L5 slides 6–7).
- **Resistors:** unsalicided poly, diffusion or n-well. Poly is usual (linear, tighter), but still varies about **±30 %** over process and temperature. Where a process lacks good resistors, a **triode FET** terminates low swings (<500 mV); a diode-connected FET in parallel extends its linear range (L5 slides 9–10).
- **So the termination is calibrated.** Toifl's receiver has programmable termination resistors (Fig. 1) and switches every CML load between two ranges at start-up, cutting a 30 % tolerance to 19.9 %. Wong reuses the transmitter's impedance-controlled driver as a 100 Ω ∥ 100 Ω receive termination, i.e. 50 Ω to $V_S/2$ (Fig. 13).

> [!tip] Remark
> Impedance-calibration loops (replica, external reference resistor) are shared with the driver and owned by [[Transmitters]]. Resistor types and their tolerances are in [[Resistor]].

### Input Match: a Capacitance Budget

$|S_{11}(f_N)|<-7$ dB needs $C<1/(2\pi f_NZ_0)$: 637 / 227 / 114 fF per side at $f_N=$ 5 / 14 / 28 GHz. $C$ is everything on the pad: bump/pad, ESD, termination resistor parasitics and the first stage's $C_{gg}$. A reflected wave becomes ISI ([[Channels#Level 2 Discontinuities]]), so return loss is a signal-integrity spec, not just a compliance one.

> [!tip] Remark
> The $|\Gamma(f)|$ formula, the derivation of the −7 dB rule, the per-data-rate $C_{max}$ table, the Smith-chart picture (a 50 Ω resistor with shunt $C$ sliding along the $g=1$ circle) and the Bode–Fano ceiling on what any lossless network can recover are owned by [[Smith Chart and Impedance Matching#Termination Matching (SerDes and on-chip)]].

### ESD and T-Coils at the Receiver

```tikz title="RX input network of Loi et al. (ISSCC 2019, 100 Gb/s PAM4): a bridged T-coil hides the ESD capacitance behind the 50-ohm termination, and a series inductor L2 hides the input stage's gate capacitance. The input pair M1/M2 is gain-controlled by a triode device M0 and its load common mode is servoed by an OTA and charge pump. After Palermo L6 slide 9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % T-coil
  \draw (-0.6,0) node[ocirc]{} node[left,align=right]{RX\\input} -- (1.5,0) coordinate(A);
  \draw (A) to[L,l_=$L_1$] (1.5,1.6) coordinate(T);
  \draw (T) to[L,l_=$L_1$] (1.5,3.2) coordinate(B);
  \draw (B) to[R,l_=$50\,\Omega$] (1.5,4.6) node[above]{$V_{TT}$};
  \draw (0.4,0) node[circ]{} -- (0.4,0.9) to[C,l=$C_b$] (0.4,2.3) -- (0.4,3.2) -- (B);
  \node[red!70!black] at (1.0,1.6) {$k$};
  \draw (T) node[circ]{} -- (2.7,1.6) node[circ]{} coordinate(E);
  \node[draw,thick,minimum width=0.8cm,minimum height=0.5cm] (esd) at (2.7,0.4) {ESD};
  \draw (E) -- (esd.north);
  \draw (esd.south) -- (2.7,-0.3) node[ground]{};
  \draw[dashed,gray] (-0.1,-0.8) rectangle (3.3,4.2);
  \node at (1.6,-1.1) {bridged T-coil};
  \draw (E) to[L,l=$L_2$] (4.6,1.6);
  % input pair
  \draw (5.8,1.6) node[nmos,anchor=G](M1){};
  \draw (4.6,1.6) -- (M1.G);
  \draw (9.6,1.6) node[nmos,xscale=-1](M2){};
  \node[right] at (M2.G) {$V_{in}^-$ (via the other T-coil)};
  \draw (M1.S) -- (M1.S|-0,0.4) coordinate(S1);
  \draw (M2.S) -- (M2.S|-0,0.4) coordinate(S2);
  \draw (S1) to[R] (S2);
  \node[align=center] at ($(S1)!0.5!(S2)+(0,0.45)$) {$M_0$ (triode), gate $V_{gain}$};
  \draw (S1) to[I] (S1|-0,-1.2) node[ground]{};
  \draw (S2) to[I] (S2|-0,-1.2) node[ground]{};
  \draw (M1.D) -- (M1.D|-0,3.0) node[circ]{} coordinate(O1);
  \draw (M2.D) -- (M2.D|-0,3.0) node[circ]{} coordinate(O2);
  \draw (O1) to[R] ($(O1)!0.5!(O2)$) coordinate(mid) to[R] (O2);
  \draw (O1) to[R,l=$M_3$] (O1|-0,4.6);
  \draw (O2) to[R,l_=$M_4$] (O2|-0,4.6);
  \draw (O1|-0,4.6) -- (O2|-0,4.6) node[right]{$V_{DD}$};
  \node[left] at (O1) {$V_{on}$}; \node[right] at (O2) {$V_{op}$};
  \draw (mid) node[circ]{} -- ++(0,0.35) node[above]{$V_{CM}$};
  \node[draw,thick,minimum width=1.9cm,minimum height=0.8cm,align=center] (cp) at (13.8,3.4) {OTA + charge\\pump (CM loop)};
  \draw[<-] (cp.west) ++(0,0.2) -- ++(-0.7,0) node[left]{$V_{CM}$};
  \draw[<-] (cp.west) ++(0,-0.2) -- ++(-0.7,0) node[left]{$V_{ref}$};
  \draw[->] (cp.east) -- ++(0.6,0) node[right,align=left]{$V_{pump}$ to gates\\of PMOS loads $M_3$, $M_4$};
\end{circuitikz}
\end{document}
```

- **The problem:** ESD diodes and the first stage's gate sit on the same node as the termination, and their capacitances add (Kossel's transmitter had about 1 pF in total). Against a 227 fF budget at 14 GHz, that is hopeless with a plain resistor.
- **Pisati (ISSCC 2019, 56 Gb/s PAM4):** a T-coil isolates the ESD and input-stage capacitance, and **shunt peaking in the termination network** extends the bandwidth further (L6 slide 8).
- **Loi (ISSCC 2019, 100 Gb/s PAM4):** a **bridged T-coil** isolates the ESD and extends the bandwidth; a **series inductor** $L_2$ isolates the input stage's capacitance (L6 slide 9, figure above).
- The ESD itself is sized for the HBM/CDM target; its capacitance is then a given that the coil has to absorb.

> [!tip] Remark
> How a T-coil splits the capacitances, Kossel's asymmetric design numbers, and the double-T and π-coil follow-ups are owned by [[High-Speed Circuit Techniques#T-coils at the pad]]. ESD clamp types and primary/secondary protection are in [[Guard Rings, ESD and Interconnect#Level 4 ESD Protection]].

### AC or DC Coupling, and the Input Common Mode

```tikz title="DC coupling: the receiver's common mode is whatever the transmitter and termination make it. AC coupling: a series capacitor lets the receiver choose its own common mode V_TT, but adds a low-frequency cut-off, so data must be DC-balanced. After Palermo L5 slide 8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % DC coupled
  \node[draw,thick,minimum width=1.0cm,minimum height=1.2cm] (tx) at (0,0) {TX};
  \draw (tx.east) ++(0,0.3) -- (2.6,0.3) coordinate(p);
  \draw (tx.east) ++(0,-0.3) -- (2.6,-0.3) coordinate(n);
  \draw (p) to[R,l=$R_T$] (3.6,0.3) -- (3.6,-0.3) to[R,l=$R_T$] (n);
  \node[draw,thick,minimum width=1.0cm,minimum height=1.2cm] (rx) at (5.0,0) {RX};
  \draw (2.6,0.3) -- (2.6,0.9) -| (rx.north);
  \draw (2.6,-0.3) -- (2.6,-0.9) -| (rx.south);
  \node[align=center] at (2.5,-1.6) {DC coupled: RX CM $=IR/2$ (current-mode TX)\\any data, but CM set by the TX};
  % AC coupled
  \begin{scope}[xshift=8.0cm]
    \node[draw,thick,minimum width=1.0cm,minimum height=1.2cm] (tx2) at (0,0) {TX};
    \draw (tx2.east) ++(0,0.3) to[C,l=$C_{AC}$] (2.4,0.3) coordinate(p2);
    \draw (tx2.east) ++(0,-0.3) to[C,l_=$C_{AC}$] (2.4,-0.3) coordinate(n2);
    \draw (p2) to[R,l=$R_T$] (3.6,0.3);
    \draw (n2) to[R,l_=$R_T$] (3.6,-0.3);
    \draw (3.6,0.3) -- (3.6,-0.3);
    \draw (3.6,0) node[circ]{} -- (4.0,0) node[right]{$V_{TT}$};
    \node[draw,thick,minimum width=1.0cm,minimum height=1.2cm] (rx2) at (5.6,0) {RX};
    \draw (2.4,0.3) -- (2.4,0.9) -| (rx2.north);
    \draw (2.4,-0.3) -- (2.4,-0.9) -| (rx2.south);
    \node[align=center] at (2.6,-1.6) {AC coupled: RX CM $=V_{TT}$, independent\\low-frequency cut-off: data must be coded};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **DC coupling** passes uncoded data, but the receiver's common mode is set by the transmitter and termination (for a current-mode driver, $IR/2$ below the termination rail). **AC coupling** frees the receiver to choose its common mode $V_{TT}$, but the channel now has a low-frequency cut-off, so the data must be DC-balanced (8B10B and similar) (Palermo L5 slide 8).
- **The termination scheme picks the input pair type** (L6 slide 12): termination to $V_{DD}$ puts the common mode high, so an NMOS pair; termination to ground or a low $V_{TT}$ needs a PMOS pair. Wong terminates to $V_S/2=0.25$ V, so his comparator uses a **PMOS pair** (input CM range 0–0.9 V with good rejection; Wong §IV-A). Toifl terminates to the supply (NMOS CML).
- **Pisati AC-couples on chip** so the input CM can be placed where *both* NMOS and PMOS transconductors work (L6 slide 14).
- **Baseline wander.** Behind an AC-coupling corner $f_c=1/(2\pi RC)$, a run of $N$ identical bits droops by about $NT_b/(RC)$ of its amplitude (my first-order estimate, $NT_b\ll RC$). Long runs therefore move the slicer's effective threshold. Pisati's AFE adds a **BLW DAC** that injects a correction at the ADC input (L6 slide 8 figure).

> [!tip] Remark
> Which patterns stress baseline wander (longest run of identical bits) is in [[Signaling and BER#PRBS Patterns]]. The droop is the low-frequency corner of [[Frequency Response]] applied to a step.

## Level 2: The Analog Front End

The analog front end (AFE) is every linear stage between the pad and the slicers. It equalizes (CTLE) and scales (VGA) the signal "to optimize it for symbol detection (mixed-signal RX) or quantization (ADC-based RX)", and shrinking supplies make that gain hard to get efficiently (Palermo L6 slide 11).

### Input Stages

```tikz title="Two static input stages: an NMOS pair with resistive loads (A = g_m1 R_L) for high-CM termination, and a PMOS pair whose loads are a diode-connected NMOS in parallel with an nbias current source (A ~ g_m1/g_m3) for low-CM termination. After Palermo L6 slide 12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw (0,0) node[nmos](M1){};
  \draw (2.4,0) node[nmos,xscale=-1](M2){};
  \draw (M1.D) to[R,l=$R_L$] (0,2.3) -- (2.4,2.3) to[R,l_=$R_L$] (M2.D);
  \draw (M1.S) |- (1.2,-1.0) -| (M2.S);
  \draw (1.2,-1.0) to[I,l=$I_{SS}$] (1.2,-2.4) node[ground]{};
  \node[left] at (M1.G) {$in_p$}; \node[right] at (M2.G) {$in_n$};
  \draw (M1.D) node[circ]{} -- ++(-0.5,0) node[left]{$out_n$};
  \draw (M2.D) node[circ]{} -- ++(0.5,0) node[right]{$out_p$};
  \node at (1.2,-3.5) {$A_v=g_{m1}(R_L\parallel r_{o1})\approx g_{m1}R_L$};
  \begin{scope}[xshift=6.2cm]
    \draw (0,0) node[pmos](P1){};
    \draw (2.4,0) node[pmos,xscale=-1](P2){};
    \draw (P1.S) |- (1.2,1.0) -| (P2.S);
    \draw (1.2,1.0) to[I,l_=$I_{SS}$] (1.2,2.4) node[above]{$V_{DD}$};
    \node[left] at (P1.G) {$in_p$}; \node[right] at (P2.G) {$in_n$};
    \draw (P1.D) node[circ]{} -- ++(-0.5,0) node[left]{$out_p$};
    \draw (P2.D) node[circ]{} -- ++(0.5,0) node[right]{$out_n$};
    \node[draw,minimum width=0.9cm,minimum height=0.7cm,align=center,font=\tiny] (L1) at (0,-1.9) {$M_3$ diode\\$\parallel M_4$ ($nbias$)};
    \node[draw,minimum width=0.9cm,minimum height=0.7cm,align=center,font=\tiny] (L2) at (2.4,-1.9) {$M_6$ diode\\$\parallel M_5$ ($nbias$)};
    \draw (P1.D) -- (L1.north); \draw (P2.D) -- (L2.north);
    \draw (L1.south) -- (0,-2.6) node[ground]{}; \draw (L2.south) -- (2.4,-2.6) node[ground]{};
    \node at (1.2,-3.9) {$A_v=\dfrac{g_{m1}}{g_{m3}+g_{o3}+g_{o4}+g_{o1}}\approx\dfrac{g_{m1}}{g_{m3}}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- A differential input stage rejects common-mode noise and sets the common mode for the comparator after it. It needs a **high gain-bandwidth product** to amplify the full-rate signal, and offset correction and equalization can be **merged into it** (Palermo L6 slide 12).

### CTLE Circuits

The CTLE in silicon is almost always the **RC-degenerated differential pair**: $R_S\parallel C_S$ between the sources gives a zero at $1/(R_SC_S)$ and a pole at $(1+g_mR_S/2)/(R_SC_S)$, peaking $1+g_mR_S/2$, and a peak capped by $g_m/C_p$.

> [!tip] Remark
> The transfer function and its half-circuit derivation are owned by [[High-Speed Circuit Techniques#Level 4 The RC-Degenerated Stage]]; zero placement against the channel, the peaking range, noise enhancement and CTLE adaptation by [[Equalization#CTLE]]. What follows is only how receivers *build* it: the tuning elements, how many stages, and what replaces the resistive load at low supply.

```tikz title="A tunable CTLE as built: the degeneration resistor is a bank of switched (or triode) resistors and the capacitor a bank of switched capacitors or varactors, so the zero and the peaking are set by code; the tail currents set the gain. After Palermo L8 slides 16-17 and Lee Fig. 9(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw (0,0) node[nmos](M1){};
  \draw (4.0,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in}^+$}; \node[right] at (M2.G) {$V_{in}^-$};
  \draw (M1.D) to[R,l=$R_D$] (0,2.4) -- (4.0,2.4) to[R,l_=$R_D$] (M2.D);
  \draw (M1.D) node[circ]{} -- ++(-0.4,0) node[left]{$V_{out}^-$};
  \draw (M2.D) node[circ]{} -- ++(0.4,0) node[right]{$V_{out}^+$};
  \draw (M1.S) -- (0,-1.0) node[circ]{} coordinate(a);
  \draw (M2.S) -- (4.0,-1.0) node[circ]{} coordinate(b);
  % R bank
  \draw (a) -- (0.4,-1.0) to[R,l=$R_u$] (1.6,-1.0) to[nos,l=$b_0$] (2.4,-1.0) -- (b);
  \draw (a) -- (0,-2.1) -- (0.4,-2.1) to[R,l=$2R_u$] (1.6,-2.1) to[nos,l=$b_1$] (2.4,-2.1) -- (4.0,-2.1) -- (b);
  % C bank
  \draw (0,-2.1) -- (0,-3.2) -- (0.4,-3.2) to[C,l=$C_u$] (1.6,-3.2) to[nos,l=$c_0$] (2.4,-3.2) -- (4.0,-3.2) -- (4.0,-2.1);
  \draw (0,-3.2) -- (0,-4.3) -- (0.4,-4.3) to[C,l=$2C_u$] (1.6,-4.3) to[nos,l=$c_1$] (2.4,-4.3) -- (4.0,-4.3) -- (4.0,-3.2);
  \draw (0,-4.3) to[I,l_=$I_{SS}/2$] (0,-5.7) node[ground]{};
  \draw (4.0,-4.3) to[I,l=$I_{SS}/2$] (4.0,-5.7) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (5.6,-0.6) {$R_S$ code: zero $\downarrow$ and peaking $\uparrow$ (DC gain $\downarrow$)\\ \quad $\omega_{p1}\approx g_m/2C_S$ barely moves};
  \node[font=\scriptsize,align=left,anchor=west] at (5.6,-2.0) {$C_S$ code: zero and $\omega_{p1}$ move together,\\ \quad peaking unchanged};
  \node[font=\scriptsize,align=left,anchor=west] at (5.6,-3.4) {$I_{SS}$ (or $R_D$): overall gain (VGA)};
\end{circuitikz}
\end{document}
```

- **Tuning elements** (Palermo L8 slides 16–17): raising $C_S$ lowers the zero and $\omega_{p1}$ together with the peaking unchanged; raising $R_S$ lowers the zero and increases the peaking by lowering DC gain. In practice $R_S$ is a switched-resistor bank or a triode MOSFET with a control voltage, and $C_S$ a switched-capacitor bank or varactor. The switches' own capacitance adds to $C_S$, which sets the highest reachable zero.
- **Weaknesses** (L8 slide 15): limited by the amplifier's gain-bandwidth; must be designed for its **input linear range**; sensitive to PVT and hard to tune; generally only **first-order** compensation. Each of these is answered by one of the variants below.

| Variant | What it adds | Example |
|---|---|---|
| Degeneration with variable R *and* C in a switching quad | Three outputs at different thresholds from one stage; up to 4.5 dB boost; $V_{ctrl}$ trades DC gain (about 6.5 to 11 dB) against a fixed peak | Lee Fig. 9 (56 Gb/s PAM4) |
| Switchable capacitive degeneration in a voltage-shifting amplifier | Equalization on/off per channel; the zero does not move with the programmed PAM4 offset | Toifl Fig. 4–5 |
| Two cascaded Gm–TIA stages | Higher-order shaping, gain at low supply; stage 1 TIA feedback has $R_F$ + $L_F$ | Pisati (56 Gb/s PAM4, L6 slides 8, 13) |
| Extra tunable bias resistor at the NMOS input (with AC coupling) | A **second, low-frequency zero** for the channel's long tail | Pisati (L6 slide 14) |
| Inverter-based stages | NMOS + PMOS $g_m$ from one current; inverters as resistive ($1/2g_m$) and active-inductor loads | Zheng (CICC 2018, 56 Gb/s, L6 slides 16–17) |

#### Gm–TIA stages

```tikz title="Low-voltage Gm-TIA amplification: an input transconductor (here with NMOS and PMOS RC-degenerated, both biased from an AC-coupled input) drives a transimpedance stage, an inverter with feedback resistor R_F. Gain ~ G_m R_F; mostly signal current flows in R_F, so it stays linear at large swing. After Palermo L6 slides 13-15 (Pisati ISSCC 2019)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw (0,0) node[left]{$v_{in}$} -- (0.4,0);
  \draw[thick] (0.4,0.9) -- (0.4,-0.9) -- (2.0,0) -- cycle;
  \node at (0.95,0) {$G_m$};
  \node[font=\tiny,align=center] at (1.1,-1.35) {RC-degenerated\\N+P pairs};
  \draw[->] (2.0,0) -- (3.0,0) node[midway,below]{$i=G_mv_{in}$};
  \draw (3.0,0) node[circ]{} coordinate(X) -- (3.4,0);
  \draw[thick] (3.4,0.7) -- (3.4,-0.7) -- (4.6,0) -- cycle;
  \node at (3.8,0) {$-A$};
  \draw (4.6,0) -- (5.4,0) node[circ]{} coordinate(Y) -- (6.2,0) node[right]{$v_{out}\approx -G_mR_F\,v_{in}$};
  \draw (X) -- (3.0,1.3) to[R,l=$R_F$] (5.4,1.3) -- (Y);
  \node[font=\scriptsize,align=left,anchor=north west] at (0,-1.9) {TIA $=$ inverter on a replica-biased regulated supply (supply rejection)\\ $R_{in,TIA}\approx R_F/(1+A)$: low, so the $G_m$ output barely swings (low-voltage headroom)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{v_{out}}{v_{in}}\approx-G_mR_F\cdot\frac{A}{1+A}\approx -G_mR_F}
$$

- **Why two stages at low supply:** the $G_m$ stage only has to deliver current into a low-impedance node, so it needs little headroom; the TIA turns current into voltage with a resistor that carries mostly *signal* current, so it stays linear at high swing (Palermo L6 slide 13).
- **Pisati's Gm stage** (L6 slide 14): input AC-coupled so both NMOS and PMOS transconductors are used; RC degeneration ($R_{deg}$, $C_{deg}$ tunable) at both input pairs' sources gives the high-frequency peaking; the tunable bias resistor $R_N$ adds the low-frequency zero; **gain control by bias programmability**.
- **Pisati's TIA** (slide 15): an inverter with feedback $R_F$, on a replica-biased regulated supply for supply-noise rejection.
- **Zheng's inverter CTLE** (slides 16–17): every cell is a CMOS inverter, used as a transconductor ($2g_m$), a resistive load ($1/2g_m$, diode-connected) or an active-inductor load. A replica-bias loop uses a ring oscillator as a **process monitor**: a counter compares its frequency (nominally 740 MHz, a 5 ps inverter delay) with a target and steps a 5-bit LDO code, so the CTLE core's supply tracks the process. Output CM about 0.85 V into about 30 fF of slicer load.

> [!note]- Derivation: the Gm–TIA gain (my derivation)
> At the TIA input node, KCL with an inverting amplifier of gain $A$ and feedback $R_F$: $i=(v_X-v_{out})/R_F$ and $v_{out}=-Av_X$. So $v_X=-v_{out}/A$ and $i=-v_{out}(1+1/A)/R_F$, giving $v_{out}=-iR_F\,A/(1+A)$. With $i=G_mv_{in}$ the gain is $-G_mR_FA/(1+A)$. The input resistance $v_X/i=R_F/(1+A)$ is what keeps the $G_m$ stage's output swing small. The TIA's own bandwidth (the $R_F$, $C_{in}$ loop) is the shunt-feedback TIA of [[Feedback]]; Pisati adds $L_F$ in series with $R_F$ in stage 1 for peaking.

> [!tip] Remark
> The Gm–TIA is Cherry–Hooper by another name ([[High-Speed Circuit Techniques#Cherry-Hooper (Gm-TIA)]]), and the inverter-as-load and active-inductor cells are in [[High-Speed Circuit Techniques#Active inductors]].

### VGA and Gain Control

A CTLE trades DC gain for peaking, so its DC gain is often **below one** ($-4$ dB in the [[#Worked example 56 Gb/s PAM4 receiver front end|worked example]]). The VGA restores a fixed amplitude at the slicer (or ADC full scale), which matters most for PAM4 where the thresholds sit at fixed fractions of the levels.

| How gain is varied | Mechanism | Example |
|---|---|---|
| Degeneration resistance | A triode MOSFET between the sources, $V_{gain}$ on its gate: $A=g_mR_D/(1+g_mR_{deg}/2)$ | Loi, $M_0$ (L6 slide 9, figure in [[#ESD and T-Coils at the Receiver]]) |
| Bias current | $g_m$ scales with $I_{SS}$ | Pisati Gm stage (L6 slide 14) |
| DC gain only, peak fixed | The CTLE's own $R_S$ control | Lee $V_{ctrl}$, Fig. 9(b) |
| Feedback resistor | $G_mR_F$ | Gm–TIA (any) |

- **Gain control moves the common mode.** Changing $I_{SS}$ or the degeneration shifts the output CM, which shifts the slicer's input CM and its offset (capacitive offset trim is CM-sensitive, [[#Where to Inject the Correction]]). Loi closes a **CM loop** around the stage: an OTA compares the output CM (resistor midpoint) with $V_{ref}$ and drives a charge pump that sets the PMOS load gates (L6 slide 9).
- **Linearity:** for PAM4, every stage before the slicers must stay linear over the full 4-level swing; a limiting stage harmless for NRZ compresses the outer eyes ([[Equalization#Level 6 PAM4 Equalization]]). The degeneration that makes the peaking also widens the linear range.

> [!tip] Remark
> The degenerated-pair gain $g_mR_D/(1+g_mR_S/2)$ is [[Differential Amplifiers#Degenerated Pair]]; how degeneration linearizes is [[Nonlinearity and Mismatch#Resistive Degeneration]].

### Front-End Noise and the Optimum Bandwidth

```tikz title="56 Gb/s front end compensating a 37 dB channel (TX 3-tap, RX 14-tap FFE + 1-tap DFE, input noise 8.2 nV^2/Hz): as the front-end bandwidth rises, ISI falls but integrated noise rises, so the voltage margin at BER 1e-4 peaks near 14-16 GHz, i.e. near or slightly above Nyquist (14 GHz). Points read from Palermo L6 slide 54."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % x: 10..20 GHz -> 0..8 ; y noise 0..2.5 mV -> 0..4 ; margin 0..30 mV -> 0..4
  \draw[->] (0,0) -- (8.6,0) node[right]{front-end BW (GHz)};
  \draw[->] (0,0) -- (0,4.4) node[above,blue!70!black]{noise (mV rms)};
  \draw[->] (8,0) -- (8,4.4) node[above,red!70!black]{margin (mV)};
  \foreach \x/\l in {0/10,1.6/12,3.2/14,4.8/16,6.4/18,8/20} {\draw (\x,0.08) -- (\x,-0.08) node[below]{\l};}
  \foreach \y/\l in {0/0,1.6/1,3.2/2} {\draw (0.08,\y) -- (-0.08,\y) node[left,blue!70!black]{\l};}
  \foreach \y/\l in {1.333/10,2.667/20,4/30} {\draw (7.92,\y) -- (8.08,\y) node[right,red!70!black]{\l};}
  \draw[thick,blue!70!black] (0,1.84) -- (0.8,2.08) -- (3.2,2.64) -- (4.8,2.88) -- (7.0,3.2);
  \draw[thick,red!70!black] (0,1.27) -- (0.8,2.13) -- (3.44,3.53) -- (4.96,3.57) -- (7.0,3.33);
  \foreach \x/\y in {0/1.84,0.8/2.08,3.2/2.64,4.8/2.88,7.0/3.2} \fill[blue!70!black] (\x,\y) circle (1.5pt);
  \foreach \x/\y in {0/1.27,0.8/2.13,3.44/3.53,4.96/3.57,7.0/3.33} \fill[red!70!black] (\x,\y) circle (1.5pt);
  \draw[dashed] (3.2,0) -- (3.2,4.2) node[above]{$f_N$};
  \node[red!70!black,anchor=west] at (4.6,3.95) {margin (BER $10^{-4}$)};
  \node[blue!70!black,anchor=north west] at (5.3,2.85) {output noise};
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{v^2_{n,FE}}=\int_0^{BW_D}|H(f)|^2\,V^2_{n,in}(f)\,df,\qquad BW_{opt}\approx f_N\ \text{to slightly above}}
$$

- Integrate the output noise over the **decision circuit's** bandwidth $BW_D$; because $H$ falls fast, the upper limit hardly matters (Palermo L6 slide 53).
- Palermo's 56 Gb/s sweep (slide 54): as the front end is re-optimized (DC gain, peaking, bandwidth) for each bandwidth from 10 to 19 GHz, the output noise grows from about 1.1 to 2.0 mV rms while the margin rises from about 10 mV, saturates near 27 mV at 14–16 GHz, and falls again. **The optimum bandwidth is near or slightly above Nyquist.**
- **The opposite case: limit the bandwidth on purpose.** Wong's 3.6 Gb/s comparator has no equalizer and a pseudo-differential input that turns CM noise into differential noise, so it puts a **2 GHz RC low-pass** after the preamp, 10 % above the highest signal frequency (§IV-A). The R is a scaled (≈2 kΩ) copy of the termination-calibrated device, so the corner tracks PVT.

> [!tip] Remark
> The noise-enhancement argument (a CTLE lifts input noise and crosstalk along with the signal) is owned by [[Equalization#Noise enhancement]]; noise bandwidth and integrated noise by [[Noise#Noise Bandwidth]].

## Level 3: Slicers in the Receiver

A slicer is a clocked comparator used as a **sampler**: it must pick one instant of a waveform that changes every UI, then resolve it to a logic level. [[Comparators]] owns how the latch works (StrongARM, regeneration, metastability, noise). This level is what the receiver needs from it: how sharply it samples in time, how much gain it has at the instant it samples, and which latch to use.

> [!tip] Remark
> Also called regenerative amplifier, sense amplifier, flip-flop or latch (Palermo L6 slide 19). The StrongARM's four phases (reset, sampling, regeneration, decision) are [[Comparators#The Four Modes]]; the SR latch that holds its output, including Nikolić's symmetric version that nearly halves the flip-flop delay, is [[Comparators#The SR Latch After It]].

### Sampling Function and Aperture

```tikz title="A real sampler takes a weighted average of the input around the clock edge: the sampling function h(tau) (area 1). Its aperture is the width containing the central 80 % of the area; its Fourier transform is the sampler's frequency response. An ideal sampler is a delta. After Palermo L6 slides 29-33 (Johansson JSSC 1998)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw[->] (-0.3,0) -- (6.5,0) node[right]{$\tau$};
  \draw[->] (0,-0.2) -- (0,3.0) node[above]{$h(\tau)$};
  \fill[gray!25,domain=2.15:3.75,samples=40] (2.15,0) -- plot (\x,{2.6*exp(-((\x-2.9)^2)/0.35)}) -- (3.75,0) -- cycle;
  \draw[thick,blue!70!black,domain=0.6:5.4,samples=80] plot (\x,{2.6*exp(-((\x-2.9)^2)/0.35)});
  \draw[dashed] (2.15,0) -- (2.15,2.4); \draw[dashed] (3.75,0) -- (3.75,2.4);
  \draw[<->] (2.15,2.4) -- (3.75,2.4); \node[left] at (2.1,2.4) {$w_{80}=t_{90}-t_{10}$};
  \node[below] at (2.15,0) {$t_{10}$}; \node[below] at (3.75,0) {$t_{90}$};
  \node[align=left,anchor=west] at (4.0,1.5) {80 \% of\\the area};
  \draw[->] (4.0,1.4) -- (3.2,0.9);
  \draw[very thick,red!70!black,->] (2.9,0) -- (2.9,2.9) node[above right]{ideal: $\delta(\tau-t_s)$};
  \begin{scope}[xshift=7.6cm]
    \draw[->] (0,0) -- (4.2,0) node[right]{$f$};
    \draw[->] (0,0) -- (0,3.0) node[above]{$|H(f)|$};
    \draw[thick,blue!70!black,domain=0:4,samples=60] plot (\x,{2.5*exp(-(\x*\x)/4.5)});
    \draw[thick,red!70!black] (0,2.5) -- (4,2.5) node[right]{ideal};
    \node[align=left,anchor=west] at (0.5,0.6) {slower clock edges $\Rightarrow$\\ wider $h$ $\Rightarrow$ lower BW};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{v_{sample}=\int_{-\infty}^{\infty}v_{in}(\tau)\,h(\tau)\,d\tau,\quad \int h\,d\tau=1,\quad w_{80}=t_{90}-t_{10}\ \ \text{with}\ \int_{-\infty}^{t_{10}}h=0.1,\ \int_{-\infty}^{t_{90}}h=0.9,\quad H(f)=\mathcal F\{h\}}
$$

- A switch-based sampler is modelled as a weighted average of the input in time, weighted by the **sampling function** $h(\tau)$; the ideal one is a delta (Palermo L6 slides 29–31).
- **Aperture time** $w_{80}$: the width in which 80 % of the sensitivity is confined (slide 33). It eats eye width like jitter does ([[#The Eye Mask Sensitivity, Offset, Aperture]]).
- **Sampler bandwidth** is the Fourier transform of $h$, and depends on the **clock transition time** (slide 32). A slow clock edge widens $h$ and low-passes the data before it is decided.

### The ISF: Gain at the Instant of Sampling

$$
\boxed{v_o(t_{obs})=\int v_i(\tau)\,\Gamma(\tau)\,d\tau,\qquad D_k=\operatorname{sgn}\!\left(\int v_i(\tau)\,\Gamma(\tau-kT)\,d\tau\right)}
$$

- Treat the comparator as a **noisy nonlinear filter followed by an ideal sampler and slicer**. Its small-signal response is a linear time-varying impulse response $h(t,\tau)$; the **impulse sensitivity function** is that response observed at a time $t_{obs}$ just before the decision, $\Gamma(\tau)=h(t_{obs},\tau)$ (Palermo L6 slides 34–35, J. Kim TCAS-I 2009).
- In time, $\Gamma$ shows the **aperture** (timing resolution); in frequency, the sampling **gain and bandwidth** (slide 37). The comparator gives most of its gain during the **sampling phase**, so the ISF is concentrated there.
- Toifl's equivalent model: a linear front end with a **latch sensitivity function**, an ideal sampler, and a slicer whose threshold is shifted by a fed-back voltage equal to the latch's **DC sensitivity** $V_s$ (Fig. 10). Both are extracted by injecting a short probe pulse at a swept time offset and binary-searching the smallest amplitude that flips the latch (Toifl Appendix).

> [!tip] Remark
> The ISF is the same object as the oscillator's ISF in [[Oscillators]]: the sensitivity of a time-varying circuit to an impulse injected at time $\tau$. Simulating comparator noise by sweeping the input with transient noise on and fitting a Gaussian CDF (Palermo L6 slide 55) is owned by [[Comparators#Measuring Comparator Noise in Simulation]].

### Which Latch

| Latch | Aperture, bandwidth | Gain / sensitivity | Power, supply | Used where |
|---|---|---|---|---|
| **StrongARM** (+ SR latch) | Higher sampling bandwidth; narrower sensitivity window: Toifl 14 GHz at 5 mV target | Lower: Toifl DC sensitivity 8.2 mV | No static power, full CMOS output; sampling time varies with $V_{DD}$ | Most slicers; Toifl's second (CMOS) rank |
| **CML latch** (+ another CML latch) | Toifl 10 GHz at 5 mV target | Higher: DC sensitivity 2.6 mV ($\approx10$ dB more gain) | $\sim2$ mA static vs $\sim200$ µA; better supply immunity | Toifl's first sampling rank |
| **Double-tail** (Schinkel ISSCC 2007), Goll (TCAS-II 2009) | — | — | Low-voltage; needs $clk$ and $\overline{clk}$ (skew-sensitive) | Low-$V_{DD}$ receivers |
| **Charge-steering** (Bai ISSCC 2014) | ~17 ps aperture (65 nm, post-layout) | Gain >2 (limited); add a small regeneration stage for full swing | One clock phase, one transistor stack: low $V_{DD}$ | 32 Gb/s PAM4 DFE RX (Elhadidy VLSI 2015) |

(Palermo L6 slides 21, 39–50; Toifl §III-B.)

- **Input-pair size acts oppositely** in the two classic latches (Jeeradit VLSI 2008, L6 slide 40): in a CML latch a bigger input pair adds output capacitance directly, so gain–bandwidth does not improve; in a StrongARM its $g_m$ grows faster than its capacitance.
- **Toifl's choice:** CML latches in the first rank for their sensitivity and supply immunity, then StrongARM ("SenseAmp") latches at half rate to reach CMOS levels, then standard library flip-flops for the 2:4 demux. Accurate timing is only needed at the first rank (§III-C).

### Sensitivity: Putting the Slicer in the Budget

```tikz title="The slicer's resolution time grows as ln(1/V_in): below some input it cannot finish in the time it has. That metastability window is a major part of v_min. After Palermo L6 slide 56."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % x: log10(Vin/VDD) from -10 to 0 -> 0..7 ; y: t/tau 0..25 -> 0..3.5
  \draw[->] (0,0) -- (7.4,0) node[right]{$V_{in}/V_{DD}$ (log)};
  \draw[->] (0,0) -- (0,3.8) node[above]{$t_{comp}/\tau$};
  \foreach \x/\l in {0/{10^{-10}},2.8/{10^{-6}},5.6/{10^{-2}},7/{1}} {\draw (\x,0.08) -- (\x,-0.08) node[below]{$\l$};}
  \foreach \y/\l in {0/0,1.4/10,2.8/20} {\draw (0.08,\y) -- (-0.08,\y) node[left]{\l};}
  \draw[thick,blue!70!black] (0,3.36) -- (7,0.14);
  \draw[dashed,red!70!black] (0,2.0) -- (7.2,2.0) node[right,align=left]{time\\available};
  \fill[red!15] (0,0) rectangle (2.96,0.06);
  \draw[dashed] (2.96,0) -- (2.96,2.0);
  \node[red!70!black,align=center] at (1.5,0.6) {metastable:\\too slow};
  \node[align=left,anchor=west] at (3.4,2.9) {$t_{samp}\sim C_{out}V_{THP}/I_D$\\ $t_{reg}\sim\tau\ln(V_{DD}/V_{in})$};
\end{circuitikz}
\end{document}
```

- The slicer's delay is a sampling part $t_{samp}\sim C_{out}V_{THP}/I_D$ plus a regeneration part $t_{reg}\sim\tau\ln(V_{DD}/V_{in})$. An input too small to finish in the available time is metastable; that window is a **major component of $v_{min}$** (Palermo L6 slide 56).
- So $v_{min}$ shrinks if the slicer gets **more time** (demultiplexing, [[#Level 6 Demultiplexing]]) or a **smaller $\tau$** (short $L$, low $g_m/I_D$ cross pair), or **more gain in front** (a preamp or CTLE gain).

## Level 4: Offset Correction

### Why Trim Instead of Size

$$
\boxed{\sigma_{V_t}=\frac{A_{V_t}}{\sqrt{WL}},\qquad \sigma_{\Delta\beta/\beta}=\frac{A_\beta}{\sqrt{WL}}}
$$

- Input-referred offset is mostly $V_{th}$ mismatch, more weakly $\beta$ mismatch. Halving it costs **4× area**, which costs input capacitance (return loss, CTLE load) and power; so receivers **correct** offset (Palermo L6 slide 58).
- Uncorrected offset can exceed 50 mV, against a 20 mV sensitivity target: correction must reach about 1 mV (slide 57).

### Range and Resolution

$$
\boxed{\text{range}=\pm3\sigma_{V_{OS}}\ (99.7\,\%),\qquad 1\,\text{LSB}=\frac{\text{range}}{2^{N_b}-1},\qquad |V_{OS,res}|\le\tfrac12\text{LSB}}
$$

**Palermo's example** (L6 slide 59; 90 nm, $W/L=4\ \mu\text{m}/150$ nm, $A_{V_t}=2.8$ mV·µm, $A_\beta=2$ %·µm): $\sigma_{V_t}=3.6$ mV, $\sigma_{\Delta\beta/\beta}=2.6$ %. Counting the input pair's $V_t$ mismatch only (optimistic), the range must be about $\pm11$ mV; to cancel within 1 mV takes **5 bits**.

> [!warning] Arithmetic in the source
> Slide 59 writes $1\,\text{LSB}=22\text{ mV}/(2^5-1)=0.65$ mV. $22/31=0.71$ mV (0.65 mV would need a 20 mV range). The conclusion (5 bits gets within 1 mV) holds either way: the residual is $\pm0.35$ mV.

The range must also cover any **intentional** threshold (PAM4 outer slicers, unrolled-DFE slicers, margining), so offset DACs in those slicers are wider ([[#Level 7 PAM4 Receivers]]).

### Where to Inject the Correction

```tikz title="Two ways to move a slicer's threshold digitally. Left: a binary-weighted current DAC steers a differential current into the preamp's loads (input-referred shift dI/g_m); keeping the total DAC current constant keeps the output common mode fixed. Right: binary-weighted capacitors on one internal node of a StrongARM unbalance the two integration rates. After Palermo L6 slides 57, 60-61 (Balamurugan JSSC 2008) and Wong Fig. 14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % current-mode
  \draw (0,0) node[nmos](M1){};
  \draw (2.4,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$D_{in}^+$}; \node[right] at (M2.G) {$D_{in}^-$};
  \draw (M1.D) to[R,l=$R_L$] (0,2.4) -- (2.4,2.4) to[R,l_=$R_L$] (M2.D);
  \draw (M1.S) |- (1.2,-1.0) -| (M2.S);
  \draw (1.2,-1.0) to[I] (1.2,-2.2) node[ground]{};
  \draw (M1.D) node[circ]{} -- (-2.4,0.77) to[I,l_=$I_{os,n}$] (-2.4,-1.2) node[ground]{};
  \draw (M2.D) node[circ]{} -- (4.8,0.77) to[I,l=$I_{os,p}$] (4.8,-1.2) node[ground]{};
  \node[align=center] at (1.2,-3.0) {$I_{os,n}+I_{os,p}=$ const (CM fixed)\\ $\Delta V_{in}=\Delta I/g_m$};
  % capacitive
  \begin{scope}[xshift=9.2cm]
    \node[draw,thick,minimum width=2.6cm,minimum height=1.4cm,align=center] (sa) at (1.3,1.0) {StrongARM\\(nodes $A$, $B$)};
    \draw (sa.south) ++(-0.8,0) -- ++(0,-0.6) node[below]{$V_{in}^-$};
    \draw (sa.south) ++(0.8,0) -- ++(0,-0.6) node[below]{$V_{in}^+$};
    \foreach \i/\w in {0/1,1/2,2/4,3/8,4/16} {
      \draw (-0.5-0.45*\i,1.0) -- (-0.5-0.45*\i,0.6);
      \draw (-0.65-0.45*\i,0.6) -- (-0.35-0.45*\i,0.6); \draw (-0.65-0.45*\i,0.5) -- (-0.35-0.45*\i,0.5);
      \draw (-0.5-0.45*\i,0.5) -- (-0.5-0.45*\i,0.2) node[ground,scale=0.5]{};
      \node[font=\tiny] at (-0.5-0.45*\i,1.2) {$\times$\w};
    }
    \draw (-2.3,1.0) -- (sa.west);
    \foreach \i/\w in {0/1,1/2,2/4,3/8,4/16} {
      \draw (3.1+0.45*\i,1.0) -- (3.1+0.45*\i,0.6);
      \draw (2.95+0.45*\i,0.6) -- (3.25+0.45*\i,0.6); \draw (2.95+0.45*\i,0.5) -- (3.25+0.45*\i,0.5);
      \draw (3.1+0.45*\i,0.5) -- (3.1+0.45*\i,0.2) node[ground,scale=0.5]{};
      \node[font=\tiny] at (3.1+0.45*\i,1.2) {$\times$\w};
    }
    \draw (sa.east) -- (4.9,1.0);
    \node[align=center] at (1.3,-1.6) {$C_{Offset}[4{:}0]$ on $A$, $C_{Offset}[9{:}5]$ on $B$\\ (switched in by code)};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Injection point | Mechanism | Pros | Cons | Example |
|---|---|---|---|---|
| **Current DAC into preamp loads** | Differential current $\Delta I$ into $R_L$: input-referred $\Delta I/g_m$ | Linear, wide range (enough for **link margining**); constant total current keeps CM fixed | Adds load capacitance and static current to a fast node | Balamurugan JSSC 2008 (L6 slide 60), both at the input amplifier and in each interleaved segment |
| **Current DAC by a steering pair** | Binary-segmented tail $M_{10}$ steered by a fully switched pair $M_8$/$M_9$ | Switching pair in saturation: preamp gain and RC corner undisturbed | Static current | Wong Fig. 14: 75 mV → 5 mV |
| **Capacitive imbalance in the latch** | Binary caps on one StrongARM internal node change its discharge rate | No static power; internal nodes precharged to allow more integration time for more range | **Adds aperture**; correction depends on **input CM** (code 31: about 40 → 87 mV from 0.5 → 1.1 V CM) | Palermo L6 slide 61 (90 nm, 4 µm/0.15 µm) |
| **Small currents into a second amplifier per latch** | Per-latch trim after a shared first stage | Each of 12 latches trimmed independently | One more stage | Toifl Fig. 9: 3 b + sign over 25 mV |

> [!tip] Remark
> The input-referred shift of each knob ($\Delta I/g_m$, $\frac{1}{g_m/I_D}\frac{\Delta C}{C}$, unequal widths) is derived in [[Comparators#Every Trim Knob Is a Threshold Knob]] and [[Comparators#Trimming a StrongARM Unequal Load Capacitors]]. The analog (storage-capacitor) alternatives are [[Nonlinearity and Mismatch#Level 4 Offset Cancellation]].

### The Calibration Loop

```tikz title="Foreground offset calibration: short the slicer inputs to the common mode, count ones and zeros, and step the offset code toward a 50/50 split until it dithers. Background versions replace the short with an error or spare sampler. After Palermo L6 slide 61, Wong section IV-A and Toifl section IV."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.9cm,align=center,fill=white}]
  \node[b,minimum width=1.6cm] (sh) at (0,0) {inputs\\shorted to $V_{CM}$};
  \node[b,minimum width=1.7cm] (sl) at (3.0,0) {slicer\\+ offset DAC};
  \node[b,minimum width=1.9cm] (cnt) at (6.2,0) {count 1s vs 0s\\over $M$ clocks};
  \node[b,minimum width=1.8cm] (ud) at (6.2,-2.0) {up/down\\counter (code)};
  \draw[->,thick] (sh) -- (sl);
  \draw[->,thick] (sl) -- (cnt);
  \draw[->,thick] (cnt) -- node[right,align=left]{more 1s $\to$ down\\more 0s $\to$ up} (ud);
  \draw[->,thick] (ud) -| node[pos=0.25,below]{$N_b$-bit code} (sl);
  \node[align=left,anchor=west] at (8.0,0) {stop when the output\\dithers 1010\dots{}: the\\residual is $\le\frac12$ LSB};
\end{circuitikz}
\end{document}
```

- **Foreground (at start-up):** short the inputs to a common-mode voltage, adjust the code until the output is an even mix of 1s and 0s (Palermo L6 slide 61). Wong shorts the differential inputs and controls the code externally until the output dithers. Toifl turns the pattern generator off and, for each of the 12 latches in turn, steps the code until the latch flips, reading the latch through an on-chip test mux.
- **Calibrate at the operating common mode.** The capacitive trim's correction changes with input CM (slide 61), so trim with the same CM, gain setting and supply as in operation.
- **Background:** an error sampler with a programmable threshold measures where the eye's levels really are while data runs, and the data slicers' thresholds follow (Roshan Zamir, [[#PAM4 Threshold Adaptation]]); Stojanovic's single spare sampler stands in for each data sampler while that sampler's 6-bit offset DAC is calibrated offline ([[Equalization#CTLE and DFE adaptation, eye monitors]]).

## Level 5: DFE Circuits

> [!tip] Remark
> What the DFE does (subtract $\sum w_i\hat d_{k-i}$, taps equal to the post-cursors at its input), error propagation, the 1-UI loop, loop unrolling, IIR taps, and tap adaptation are owned by [[Equalization#Level 3 Decision-Feedback Equalization]]. Here: the summer, the tap DACs, and how the timing actually closes.

### The Loop, as Built

```tikz title="Payne's half-rate direct-feedback DFE (TI, 6.25 Gb/s, 4 taps). The input amplifier A1 drives the summing node RXEQ; each tap is a current-steering pair whose sign is the past decision and whose weight is a current DAC. The odd and even paths cross: the 0/180-degree slicer's decision feeds the summing node in time for the 90/270 slicer and vice versa. The first tap closes in half a UI so the edge samplers also see equalized data. After Palermo L8 slides 23-24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.7cm,align=center,fill=white}]
  \draw[thick] (0,0.6) -- (0,-0.6) -- (1.1,0) -- cycle; \node at (0.35,0) {$A_1$};
  \draw (-0.8,0) node[left]{RXIN} -- (0,0);
  \draw (1.1,0) -- (2.2,0) node[circ]{} coordinate(sum);
  \node[above] at (2.2,0.1) {RXEQ};
  \draw (2.2,0) -- (2.2,0.9) to[R,l_=$R$] (2.2,2.0) node[above]{$V_{DD}$};
  \node[b] (e) at (4.4,1.3) {$A_2$ + slicer\\CLK0/180};
  \node[b] (o) at (4.4,-1.3) {$A_2$ + slicer\\CLK90/270};
  \draw (sum) -- (2.9,0); \draw[->] (2.9,0) |- (e.west); \draw[->] (2.9,0) |- (o.west);
  \node[b] (le) at (6.9,1.3) {latch $\to$ latch $\to$ latch};
  \node[b] (lo) at (6.9,-1.3) {latch $\to$ latch $\to$ latch};
  \draw[->] (e) -- (le); \draw[->] (o) -- (lo);
  \node[b,minimum width=3.6cm,minimum height=0.8cm] (mux) at (6.9,0) {tap muxes: pick odd/even $\hat d_{k-i}$\\$\times$ TAP$_i$ current DAC};
  \draw[->] (le.south) -- ([xshift=0.9cm]mux.north);
  \draw[->] (lo.north) -- ([xshift=0.9cm]mux.south);
  \draw[->] (e.east) ++(0.15,0) |- ([xshift=-1.2cm,yshift=0.1cm]mux.north) -- ([xshift=-1.2cm]mux.north);
  \draw[->] (o.east) ++(0.15,0) |- ([xshift=-1.2cm,yshift=-0.1cm]mux.south) -- ([xshift=-1.2cm]mux.south);
  \draw[->,thick,red!70!black] (mux.west) -- (sum) node[midway,above]{$\sum I_{TAP}$};
  \draw[->] (le.east) -- ++(0.5,0) node[right]{to demux};
  \draw[->] (lo.east) -- ++(0.5,0) node[right]{to demux};
  \node[align=left,anchor=north west] at (0,-2.2) {TAP1: 5 b \quad TAP2: 4 b + sign \quad TAP3, 4: 3 b + sign\\ loop: $t_{CLK\to Q,SA}+t_{PROP,MUX}+t_{PROP,A2}\le1$ UI (Payne: $\tfrac12$ UI)};
\end{circuitikz}
\end{document}
```

$$
\boxed{t_{CLK\to Q,SA}+t_{PROP,MUX}+t_{PROP,A2}\le1\ \text{UI}}
$$

- **Half-rate does not relax the first-tap loop.** The decision $\hat d_{k-1}$ comes from the *other* phase's slicer, which decided one UI earlier; the loop is still one UI long. Half-rate only gives each slicer two UI to regenerate and reset.
- **The tap is a current-steering pair.** Its inputs are the previous decision (full-swing, so the pair is a switch), its tail is a current DAC, and its drains sum onto the same load as the signal. Sign is free: the decision picks which side gets the current. Payne's feedback tap mux selects between the 90° and 270° decisions with a clocked pair (DFECLK) above the decision pairs (L8 slide 23).
- **Taps after the first** come from later latch stages in the demux chain and have more time; only $h_1$ is critical (and $h_2$ once $h_1$ is unrolled, [[Equalization#The 1-UI critical path and loop unrolling]]).

### Resistive-Load (Current-Mode) Summer

```tikz title="Current-mode summers. Left: resistive load; every pair (input, taps H1..HN, offset) dumps current into one pair of resistors, so swing = I R and settling tau = R(C_wire + C_L). Right: the resistors replaced by resettable capacitors; currents integrate for Delta T, so swing = I Delta T / C, with no RC settling. After Palermo L8 slides 26-27 (Park ISSCC 2007)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \foreach \ox/\lab in {0/{resistive load},8.4/{integrating load}} {
  \begin{scope}[xshift=\ox cm]
    \draw (-0.9,3.4) -- (5.6,3.4) node[right]{$V_{DD}$};
    \draw (-0.3,2.2) -- (5.6,2.2) node[right]{$OUT$};
    \draw (-0.9,1.8) -- (5.6,1.8) node[right]{$\overline{OUT}$};
    \foreach \x/\n/\i in {0.6/{IN}/{I_{bias}},2.0/{H_1}/{I_{H1}},3.4/{H_N}/{I_{HN}},4.8/{os}/{I_{os}}} {
      \draw (\x-0.3,2.2) node[circ,scale=0.6]{} -- (\x-0.3,1.0);
      \draw (\x+0.3,1.8) node[circ,scale=0.6]{} -- (\x+0.3,1.0);
      \draw (\x-0.3,1.0) -- (\x+0.3,1.0);
      \node[font=\tiny,fill=white,inner sep=1pt] at (\x,1.3) {$\n$};
      \draw (\x,1.0) to[I] (\x,-0.3) node[ground]{};
      \node at (\x,-1.25) {$\i$};
    }
    \node[font=\small] at (2.4,3.9) {\lab};
  \end{scope}}
  \draw (-0.3,3.4) to[R] (-0.3,2.2);
  \draw (-0.9,3.4) to[R,l=$R$] (-0.9,1.8);
  \node[align=left,anchor=north west] at (-0.9,-1.6) {each output also carries $C=C_{wire}+C_L$\\ swing $=IR$, \ $\tau=RC$, \ settle $\ge95\,\%$: $3RC\le t_{sum}$};
  \draw (8.1,3.4) to[nos,l_=$\overline{CLK}$] (8.1,2.2);
  \draw (7.5,3.4) to[nos] (7.5,1.8);
  \node[align=left,anchor=north west] at (7.5,-1.6) {reset to $V_{DD}$, then integrate onto $C$ for $\Delta T$:\\ swing $=I\,\Delta T/C$, no $RC$ settling};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{resistive: } V_{sw}=IR,\ \ \tau=R(C_{wire}+C_L),\ \ 3\tau\le t_{sum}\qquad\text{integrating: } V_{sw}=\frac{I\,\Delta T}{C}\ \Rightarrow\ \frac{I_{res}}{I_{int}}=\frac{\Delta T}{RC}\approx3}
$$

- **Summer performance is critical**: it must settle to better than about 95 % for the ISI cancellation to be accurate. Swing ($IR$) and settling ($RC$) trade against each other, which can mean **large bias currents** for the input and every tap (Palermo L8 slide 26).
- **Integrating summer** (Park ISSCC 2007): replace the resistors with resettable capacitors; currents integrate onto $C_{wire}+C_L$, which removes the RC settling. Since $\Delta T/C>R$, the same swing needs less current, **typically 3×** (L8 slide 27). The derivation below shows the 3 is the same 3 as the 95 % settling.
- **Every tap is a pair on the same node:** the summer's capacitance grows with the number of taps and offset pairs, so tap count is also a bandwidth cost. Liu (ISSCC 2009) merges the integrating summer with **regeneration PMOS devices**, so the summer itself starts the slicer's decision ("partial slicer"), and adds an input pair, a discrete $H_1$ pair, a continuous IIR pair and an offset-compensation pair on one summing node (L8 slide 33).

> [!note]- Derivation: why an integrating summer saves about 3× (my derivation)
> Both summers get the same window $t_w$ inside the 1-UI loop and the same load $C$. **Resistive:** 95 % settling needs $t_w=\ln20\cdot RC\approx3RC$, so the largest usable $R$ is $t_w/(3C)$ and the swing is $V=I_{res}R=I_{res}t_w/(3C)$. **Integrating:** the swing after $t_w$ is $V=I_{int}t_w/C$. Equal swings give $I_{res}=3I_{int}$. Palermo's "typically 3×" is this ratio. The integrator pays in other ways: it needs a reset phase (so it is clocked, usually per half-rate path), its output is a ramp whose final value depends on exactly when the slicer fires, and the current-to-voltage gain $\Delta T/C$ varies with clock duty cycle.

### Tap-Weight DACs

| Spec | What sets it | Rule |
|---|---|---|
| Range | Largest post-cursor at the DFE input, after CTLE/FFE | $I_{H,max}R\ge\vert h_1\vert $ (resistive) or $I_{H,max}\Delta T/C\ge\vert h_1\vert $ |
| Resolution | Residual ISI allowed | LSB $\ll$ eye; Payne: tap 1 5 b, tap 2 4 b + sign, taps 3–4 3 b + sign |
| Sign | Free: the decision steers the current to either side | Store magnitude only, plus a sign bit for taps whose sign can flip (reflections) |
| Common mode | Total current into the summer changes with the code | Constant total current (dummy branch), as in the offset DACs |
| Speed | The tap pair switches every UI | Small switching pair, full-swing gate drive; the DAC current source is static |

- An **IIR tap** is a tap whose current passes through a low-pass: Liu builds it as a clocked mux of the even/odd decisions into a load $R_D\parallel C_D$; $R_DC_D$ sets the time constant, $R_D$ and $I_D$ the amplitude, and the mux timing a 2-UI delay so cancellation starts at the 2nd post-cursor (L8 slide 34; algorithm in [[Equalization#IIR feedback for long tails]]).
- **Offset correction lives on the summer too:** Park's and Liu's summers carry an offset pair (L8 slides 26, 33), so one trim covers summer and slicer.

### Unrolled (Speculative) DFE: Where the Timing Goes

```tikz title="Half-rate, 1-tap unrolled DFE: each phase has two slicers with thresholds +h1 and -h1 (set by their offset DACs). A mux picks the right one using the other phase's latest decision. The loop now holds only t_clk-to-Q + t_mux, but the mux select must arrive within one UI. After Palermo L8 slide 25 and Stojanovic Fig. 3(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.6cm,minimum width=1.5cm,align=center,fill=white}]
  \draw (-0.6,0) node[left]{$y$} -- (0,0);
  \draw (0,1.95) -- (0,-1.95);
  \node[b] (a1) at (1.6,2.4) {$+h_1$, $\phi_0$};
  \node[b] (a2) at (1.6,1.5) {$-h_1$, $\phi_0$};
  \node[b] (b1) at (1.6,-1.5) {$+h_1$, $\phi_{180}$};
  \node[b] (b2) at (1.6,-2.4) {$-h_1$, $\phi_{180}$};
  \foreach \n in {a1,a2,b1,b2} \draw[->] (0,0|-\n.west) -- (\n.west);
  \draw (0,2.4) -- (0,1.95); \draw (0,-2.4) -- (0,-1.95);
  \draw[thick] (3.4,2.7) -- (4.0,2.3) -- (4.0,1.6) -- (3.4,1.2) -- cycle;
  \draw[thick] (3.4,-1.2) -- (4.0,-1.6) -- (4.0,-2.3) -- (3.4,-2.7) -- cycle;
  \draw[->] (a1) -- (3.4,2.4); \draw[->] (a2) -- (3.4,1.5);
  \draw[->] (b1) -- (3.4,-1.5); \draw[->] (b2) -- (3.4,-2.4);
  \node[b,minimum width=0.9cm] (fa) at (5.4,1.95) {latch};
  \node[b,minimum width=0.9cm] (fb) at (5.4,-1.95) {latch};
  \draw[->] (4.0,1.95) -- (fa) node[midway,above]{$\hat d_{even}$};
  \draw[->] (4.0,-1.95) -- (fb) node[midway,below]{$\hat d_{odd}$};
  \draw[->,red!70!black,thick] (fa.east) -- ++(0.4,0) |- (3.7,-0.6) -- (3.7,-1.4);
  \draw[->,red!70!black,thick] (fb.east) -- ++(0.7,0) |- (3.7,0.6) -- (3.7,1.4);
  \draw[->] (fa.east) ++(0.4,0) -- ++(1.2,0) node[right]{to demux};
  \draw[->] (fb.east) ++(0.7,0) -- ++(0.9,0) node[right]{to demux};
  \node[red!70!black,align=left,anchor=west] at (6.9,0) {select path:\\$t_{clk\to Q}+t_{mux}\le1$ UI};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{direct: } t_{clk\to Q}+t_{mux}+t_{sum}\le1\text{ UI}\qquad\text{unrolled: } t_{clk\to Q}+t_{mux,sel\to out}+t_{setup}\le1\text{ UI}}
$$

- The two slicers per phase are ordinary slicers with **offset DACs widened** to reach $\pm h_1$: the speculation is implemented entirely with the offset knob of [[#Where to Inject the Correction]], so $h_1$'s range and resolution become offset-DAC specs.
- **The summer leaves the loop** but the mux select still crosses between phases each UI; at high rates the mux and the latch after it are CML ([[High-Speed Circuit Techniques#MUX and XOR]]).
- **Cost** (owned by [[Equalization#The 1-UI critical path and loop unrolling]]): $2^N$ slicers per phase for $N$ unrolled NRZ taps, $4^N$ for PAM4; each extra slicer loads the CTLE output ($C_p$ in the [[#Worked example 56 Gb/s PAM4 receiver front end|worked example]]) and needs its own offset trim.
- **Hybrid:** unroll $h_1$, feed $h_2\dots h_N$ back through a summer, which now has nearly 2 UI.

## Level 6: Demultiplexing

```tikz title="Input demultiplexing. A 1:2 (half-rate) receiver samples 10 Gb/s data with two 5 GHz clocks 180 degrees apart; a 1:4 (quarter-rate) receiver uses four 2.5 GHz phases 90 degrees apart, then a synchronizer realigns the four bits. After Palermo L6 slides 63-64."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  % data
  \foreach \i in {0,...,7} {
    \draw[thick,violet] (0.9*\i,0.25) -- (0.9*\i+0.15,0) -- (0.9*\i+0.75,0) -- (0.9*\i+0.9,0.25);
    \draw[thick,violet] (0.9*\i,-0.0) -- (0.9*\i+0.15,0.25) -- (0.9*\i+0.75,0.25) -- (0.9*\i+0.9,0);
  }
  \node[left] at (0,0.12) {10 Gb/s data};
  % half-rate clocks
  \node[left] at (0,-0.8) {5 GHz $\phi_0$};
  \draw[thick,red!70!black] (0,-1.0) -- (0.45,-1.0) -- (0.45,-0.6) -- (1.35,-0.6) -- (1.35,-1.0) -- (2.25,-1.0) -- (2.25,-0.6) -- (3.15,-0.6) -- (3.15,-1.0) -- (4.05,-1.0) -- (4.05,-0.6) -- (4.95,-0.6) -- (4.95,-1.0) -- (5.85,-1.0) -- (5.85,-0.6) -- (6.75,-0.6) -- (6.75,-1.0) -- (7.2,-1.0);
  \node[left] at (0,-1.5) {5 GHz $\phi_{180}$};
  \draw[thick,blue!70!black] (0,-1.3) -- (0.45,-1.3) -- (0.45,-1.7) -- (1.35,-1.7) -- (1.35,-1.3) -- (2.25,-1.3) -- (2.25,-1.7) -- (3.15,-1.7) -- (3.15,-1.3) -- (4.05,-1.3) -- (4.05,-1.7) -- (4.95,-1.7) -- (4.95,-1.3) -- (5.85,-1.3) -- (5.85,-1.7) -- (6.75,-1.7) -- (6.75,-1.3) -- (7.2,-1.3);
  \foreach \x in {0.45,2.25,4.05,5.85} \draw[->,red!70!black,dashed] (\x,-0.6) -- (\x,0.0);
  \foreach \x in {1.35,3.15,4.95,6.75} \draw[->,blue!70!black,dashed] (\x,-1.3) -- (\x,0.0);
  % quarter-rate
  \foreach \k/\c/\ph in {0/red!70!black/0,1/blue!70!black/90,2/green!50!black/180,3/violet/270} {
    \node[left] at (0,-2.3-0.55*\k) {2.5 GHz $\phi_{\ph}$};
    \draw[thick,\c] (0,-2.45-0.55*\k) -- ({0.45+0.9*\k},-2.45-0.55*\k) -- ({0.45+0.9*\k},-2.15-0.55*\k) -- ({2.25+0.9*\k},-2.15-0.55*\k) -- ({2.25+0.9*\k},-2.45-0.55*\k) -- ({4.05+0.9*\k},-2.45-0.55*\k) -- ({4.05+0.9*\k},-2.15-0.55*\k) -- (7.2,-2.15-0.55*\k);
  }
  \node[align=left,anchor=west] at (7.6,-0.6) {1:2: each slicer\\has 2 UI};
  \node[align=left,anchor=west] at (7.6,-2.9) {1:4: each slicer has 4 UI;\\phase error in degrees\\costs $4\times$ more UI};
\end{circuitikz}
\end{document}
```

$$
\boxed{T_{slicer}=N\cdot\text{UI},\qquad \Delta t=\frac{\Delta\phi}{360^\circ}\,N\cdot\text{UI},\qquad C_{load}\approx N\cdot C_{in,slicer}}
$$

- **What demultiplexing buys** (Palermo L6 slide 63): a clock $N\times$ slower than the bit rate, and $N$ UI per slicer for sampling, **regeneration and precharge**. That is the extra regeneration time that metastability needs ([[#Worked example 56 Gb/s PAM4 receiver front end|worked example]], step 8).
- **What it costs** (slide 64): $N\times$ the input (or pre-amp) load capacitance, and phase spacing must be accurate: a phase error of $\Delta\phi$ in degrees is $N$ times more UI at $1{:}N$. RX demux needs precise **phase spacing**, but is less sensitive to **duty cycle** than TX multiplexing (slide 63).
- **The extreme:** Song et al. (JSSC 2013, 65 nm, 4.8–8 Gb/s) use **1:8** input demultiplexing so the slicers run at low supply; an injection-locked ring oscillator generates the eight phases and de-skews them; 0.47 pJ/b at 6.4 Gb/s (L6 slides 65–67).
- **Why it works at all:** a CMOS clock buffer chain cannot efficiently carry a period below 6–8 FO4, so multiple phases a bit apart are how a receiver exceeds the gate speed (Palermo 2011 §9.2.1).

> [!tip] Remark
> The 6–8 FO4 clock limit is [[High-Speed Circuit Techniques#FO4 limits of CMOS]]. Generating and correcting the $N$ phases (DLLs, ILOs, phase interpolators, QEC) is [[Clocking and CDR]]. The same "M channels take turns" trade appears in [[Interleaved ADCs#M Channels Take Turns]], with the same timing-skew problem.

### Demux Trees After the Slicers

| Receiver | First rank | Tree after it |
|---|---|---|
| Wong 2004 (3.6 Gb/s) | 4 samplers on 1.8 GHz quadrature phases (2 data, 2 edge), each comparator → SR latch → TSPC retiming latch | Synchronizer aligns all four, then a **2:16 tree** of 1:2 cells; each 1:2 has an extra latch on one path so both outputs share one clock edge (Fig. 17) |
| Toifl 2006 (22 Gb/s PAM4) | CML latches on 5.5 GHz I/Q (half rate), 3 slices × (2 data + 2 edge) | SenseAmp latches at half rate → standard flip-flops for **2:4** → **4:8**; logic at 1/8 rate (1.38 GHz) (Fig. 14) |
| Lee 2015 (56 Gb/s NRZ) | Static ÷2 on the data itself, then a **1:8 tree** | Three phase interpolators (switching quads) re-time each tree level (Figs. 13–14) |

- Once a bit is past the first rank it is a digital problem: the tree is a chain of 1:2 latches ([[Digital CMOS Circuits]]), CML where the rate demands it, CMOS (TSPC, library flip-flops) as soon as possible to save power (Toifl §III-C; [[High-Speed Circuit Techniques#Level 5 TSPC and CMOS Flip-Flops and Dividers]]).

## Level 7: PAM4 Receivers

> [!tip] Remark
> PAM4 levels, Gray code, the ⅓ sub-eye and $P_e=1.5Q(\cdot)$ are owned by [[Signaling and BER#PAM4]]; three thresholds as three trimmed comparators by [[Comparators#PAM4 Needs Three Thresholds]]; the thermometer-to-2-bit decoder and Lee's flattened LSB XOR by [[Flash ADCs#In a SerDes the PAM4 Slicer Is a 2-Bit Flash]]; PAM4 DFE slicer counts by [[Equalization#Level 6 PAM4 Equalization]]. This level is how a receiver arranges them.

### Three Slicers, Three Thresholds

$$
\boxed{V_{TH}\in\{-\tfrac23,\,0,\,+\tfrac23\}\cdot V_{peak},\qquad \text{sub-eye}=\tfrac13\,\text{NRZ eye},\qquad \text{MSB}=V_B,\ \ \text{LSB}=V_A\oplus V_B\oplus V_C}
$$

- **Each threshold is an offset.** The outer slicers need a *programmed* offset of $\pm\frac23$ of the peak on top of their random offset, so their offset DACs need a much wider range (and the same fine LSB). The receiver's sensitivity budget applies **per sub-eye**: a third of the swing, the same noise ([[#Worked example 56 Gb/s PAM4 receiver front end|worked example]], step 5).
- **Where to put the shift:** once per threshold, shared by every slicer at that threshold (data, edge, error), so the shift amplifier sits **before** the demux. Toifl's receiver is built this way, as three identical "bit slices" ([[#Toifl 2006 22 Gb/s PAM4 receiver]]).
- **Everything before the slicers is linear**; the AFE's gain must put the PAM4 levels where the thresholds are, which ties the VGA to the threshold loop below.

### The Voltage-Shifting Amplifier

```tikz title="Toifl's voltage-shifting amplifier (one side shown expanded): the left input device is split into binary-weighted sub-transistors x1...x128 whose sources are switched in by w<0:7>, so its effective width w_x is programmable; the right device is always at w_max. The width mismatch is a programmed offset. Capacitive source degeneration gives the equalizing zero, which does not move with the offset. After Toifl Figs. 3-5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \draw (0,0) node[nmos](M1){};
  \draw (3.0,0) node[nmos,xscale=-1](M2){};
  \node[left,align=right] at (M1.G) {$v_{in}$\\$w_x=\sum w_i\,2^i$};
  \node[right] at (M2.G) {$v_{inb}$, $w_{max}$};
  \draw (M1.D) to[R] (0,2.3) -- (3.0,2.3) to[R] (M2.D);
  \draw (M1.D) node[circ]{} -- ++(-0.5,0) node[left]{$v_{outb}$};
  \draw (M2.D) node[circ]{} -- ++(0.5,0) node[right]{$v_{out}$};
  \draw (M1.S) -- (0,-1.0) node[circ]{}; \draw (M2.S) -- (3.0,-1.0) node[circ]{};
  \draw (0,-1.0) to[R] (3.0,-1.0);
  \draw (0,-1.0) -- (0,-1.6) to[C] (3.0,-1.6) -- (3.0,-1.0);
  \node[font=\tiny,anchor=east,align=right] at (-0.4,-1.3) {switchable $C_S$\\(EQ on/off)};
  \draw (0,-1.6) to[I] (0,-3.0) node[ground]{};
  \draw (3.0,-1.6) to[I] (3.0,-3.0) node[ground]{};
  % expansion
  \begin{scope}[xshift=6.6cm,yshift=0.6cm]
    \foreach \i/\w/\b in {0/1/0,1/2/1,2/{128}/7} {
      \draw ({1.6*\i},0) node[nmos](a\i){};
      \draw (a\i.S) -- ({1.6*\i},-0.9) node[nmos,anchor=D](b\i){};
      \node[font=\tiny,right] at ({1.6*\i+0.1},0.6) {$\times\w$};
      \node[font=\tiny,left] at (b\i.G) {$w\langle\b\rangle$};
      \draw (a\i.D) -- ({1.6*\i},1.0);
    }
    \node at (2.4,0) {$\cdots$};
    \draw (0,1.0) -- (3.2,1.0);
    \draw (a0.G) -- ++(-0.2,0) |- (-0.5,1.4) -- (2.8,1.4) node[right]{$v_{in}$};
    \draw (a1.G) -- ++(-0.2,0) -- ++(0,0.95);
    \draw (a2.G) -- ++(-0.2,0) -- ++(0,0.95);
    \draw (b0.S) -- (0,-2.2) -- (3.2,-2.2); \draw (b1.S) -- (1.6,-2.2); \draw (b2.S) -- (3.2,-2.2);
    \node[align=center] at (1.6,-2.75) {to source node};
  \end{scope}
  \draw[dashed,gray] (0.3,0.0) -- (5.6,0.6);
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V\approx\left(V_{GS}-V_t\right)\left[\sqrt{\frac{w_{max}}{w_x}}-1\right]}
$$

with $V_{GS}-V_t$ the overdrive of the full-width device (Toifl Eq. 1, neglecting the degeneration resistors).

> [!note]- Derivation: the programmed offset (my derivation, square law)
> Both sides carry $I_{SS}/2$ at balance. With $I=\frac12\mu C_{ox}\frac wL V_{OV}^2$, equal currents need $w_xV_{OV,x}^2=w_{max}V_{OV,max}^2$, so $V_{OV,x}=V_{OV,max}\sqrt{w_{max}/w_x}$. The input difference that balances the pair is $V_{OV,x}-V_{OV,max}=V_{OV,max}\left(\sqrt{w_{max}/w_x}-1\right)$: Toifl's Eq. (1). It is the "Mismatched / programmable-width input pair" row of [[Comparators#Every Trim Knob Is a Threshold Knob]], used deliberately and large.

| Shifter topology | Gain, bandwidth | CM / supply rejection | Cost |
|---|---|---|---|
| Double pair summing $v_{in}$ with a DAC voltage (Fig. 3a) | Half the current in the input devices (less gain); second pair loads the output (less bandwidth) | Excellent | Large voltage DAC |
| Pair mismatched by bias-current ratio (Fig. 3b) | Good | Moderate | — |
| **Programmable-width pair** (Fig. 4, Toifl's choice) | Like (b) | Like (b): PSRR to ground 20 dB, CMRR 14 dB at 200 mV shift; +10 dB CMRR by matching the switches' on-resistance (Fig. 8) | Combines cleanly with capacitive degeneration: the zero is independent of the shift |

- **Measured:** about 4 mV per code at a 200 mV shift; the shift was set to 215 mV for the BER test (Toifl §IV). A second stage per latch adds small currents for per-latch offset trim, 3 b + sign over 25 mV.
- **Lee's alternative** makes the three thresholds inside the CTLE: one switching quad whose load resistors $R_{1,2}$ and tail currents $I_{1,2}$ give **three outputs with different thresholds**, at the price of different output common modes, which the following differential buffers absorb (Lee §III-B, Fig. 9).

### PAM4 Threshold Adaptation

```tikz title="Roshan Zamir's PAM4 threshold adaptation: a fourth (error) sampler with its own threshold TH_ER is walked onto the edges of the top and bottom eyes; the data thresholds are set halfway between the two edges it finds. After Palermo L6 slides 70-71."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize]
  \foreach \yc in {-1.2,0,1.2} {
    \draw[thick,gray] (0.4,\yc) .. controls (1.0,\yc+0.5) and (2.6,\yc+0.5) .. (3.2,\yc);
    \draw[thick,gray] (0.4,\yc) .. controls (1.0,\yc-0.5) and (2.6,\yc-0.5) .. (3.2,\yc);
  }
  \foreach \y in {-1.8,-0.6,0.6,1.8} \draw[gray!60] (0,\y) -- (3.6,\y);
  \draw[green!50!black,thick] (-0.2,1.2) -- (3.8,1.2) node[right]{$TH_3$};
  \draw[black,thick] (-0.2,0) -- (3.8,0) node[right]{$TH_2$};
  \draw[cyan!70!black,thick] (-0.2,-1.2) -- (3.8,-1.2) node[right]{$TH_1$};
  \draw[red!70!black,dashed] (-0.2,1.55) -- (3.8,1.55) node[right]{$TH_{ER,5}$ (top of top eye)};
  \draw[red!70!black,dashed] (-0.2,0.85) -- (3.8,0.85) node[right]{$TH_{ER,4}$ (bottom of top eye)};
  \draw[red!70!black,dashed] (-0.2,-0.85) -- (3.8,-0.85) node[right]{$TH_{ER,3}$ (top of bottom eye)};
  \draw[red!70!black,dashed] (-0.2,-1.55) -- (3.8,-1.55) node[right]{$TH_{ER,6}$ (bottom of bottom eye)};
  \node[align=left,anchor=west] at (8.4,0.6) {States 1-2: coarse, by statistics\\ \quad (\% of 1s above the error threshold)\\States 3-6: random data, find\\ \quad each eye edge, then};
  \node[anchor=west] at (8.4,-0.6) {$TH_3=\tfrac12(TH_{ER,4}+TH_{ER,5})$};
  \node[anchor=west] at (8.4,-1.2) {$TH_1=\tfrac12(TH_{ER,3}+TH_{ER,6})$};
\end{circuitikz}
\end{document}
```

$$
\boxed{TH_1=\frac{TH_{ER,3}+TH_{ER,6}}{2},\qquad TH_3=\frac{TH_{ER,4}+TH_{ER,5}}{2}}
$$

- **Why adapt:** the outer thresholds must sit in the middle of eyes whose position moves with channel loss, CTLE/VGA gain and transmitter level mismatch ($R_{LM}$). A fixed code is wrong somewhere.
- **How** (Roshan Zamir JSSC 2019; Palermo L6 slides 69–71): a fourth **error sampler** with a swept threshold $TH_{ER}$. States 1–2 place it coarsely from statistics (for example the fraction of 1s above it); states 3–6 run on random data and step it onto the top and bottom edges of the top and bottom eyes, comparing its decision with the data slicer's ($D_n[1]$, $D_n[3]$). The data thresholds are the midpoints. The loop runs in the background and repeats states 3–6.
- **The same error sampler serves** adaptation of the CTLE and DFE taps and eye monitoring ([[Equalization#CTLE and DFE adaptation, eye monitors]]); edge samplers feed the CDR. Measured: 56 Gb/s over a 20.8 dB channel at 4.6 pJ/b, 65 nm; thresholds converge in tens of µs (slides 72–73).

### PAM4 and the DFE

- Lee's PAM4 receiver puts a **1-tap DFE behind each of the three slicers** (from Wang & Lee, 21 Gb/s), giving 3–5 dB of compensation; more taps "could be used in future designs" (Lee §III-B).
- Roshan Zamir's: CTLE + 1-tap FIR DFE + 1-tap IIR DFE in front of a 2-bit flash of three comparators, with error and edge samplers (L6 slide 69). The measured timing bathtub at $10^{-12}$ opens only with all three equalizers (slide 73).
- Lee's outlook (§VI): PAM4 forces the CTLE to stay linear, and three digitizations per symbol make a DFE-heavy design costly, which points to **ADC-based** receivers.

## Level 8: ADC-Based Receivers

```tikz title="An ADC-based receiver: the AFE (CTLE + VGA, here Pisati's two Gm-TIA stages) conditions the signal for quantization, a baseline-wander DAC corrects the AC-coupled level, and a time-interleaved ADC hands samples to DSP that equalizes (FFE, DFE), recovers the clock and decides. After Palermo L6 slides 8, 11 and L8 slides 9-10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=1.0cm,align=center,fill=white}]
  \node[b,minimum width=1.7cm] (in) at (0,0) {T-coil, ESD,\\termination};
  \node[b,minimum width=1.9cm] (s1) at (2.6,0) {stage 1: $G_{m1}$\\TIA ($R_F$, $L_F$)};
  \node[b,minimum width=1.9cm] (s2) at (5.1,0) {stage 2: $G_{m2}$\\TIA ($R_F$)};
  \node[draw,thick,circle,inner sep=1pt] (sm) at (6.8,0) {$+$};
  \node[b,minimum width=1.0cm] (blw) at (6.8,1.5) {BLW\\DAC};
  \node[b,minimum width=2.0cm] (adc) at (8.9,0) {TI-ADC\\4--8 b, $f_s=$ baud};
  \node[b,minimum width=2.4cm] (dsp) at (12.0,0) {DSP: FFE, DFE,\\CDR, decision};
  \draw[->,thick] (-1.4,0) -- (in); \draw[->,thick] (in) -- (s1); \draw[->,thick] (s1) -- (s2);
  \draw[->,thick] (s2) -- (sm); \draw[->,thick] (blw) -- (sm);
  \draw[->,thick] (sm) -- (adc); \draw[->,thick] (adc) -- (dsp);
  \draw[->,thick] (dsp.east) -- ++(0.5,0) node[right]{bits};
  \draw[->,dashed] (dsp.north) |- (blw.east) node[pos=0.75,above]{correction};
  \draw[->,dashed] ([xshift=-0.5cm]dsp.south) |- (8.9,-1.1) node[pos=0.75,above]{sampling phase} -- (adc.south);
  \draw[->,dashed] ([xshift=0.5cm]dsp.south) |- (2.6,-1.7) node[pos=0.6,below]{gain, peaking codes} -- (s1.south);
\end{circuitikz}
\end{document}
```

- **What changes in the AFE:** it now optimizes for **quantization**: hold a fixed amplitude at the ADC full scale (the VGA's job becomes AGC), stay linear (every level, not just the threshold crossings), and add less noise than the ADC's quantization noise (Palermo L6 slide 11).
- **What the ADC must do:** sample at the baud rate with 4–6 effective bits; Harwood (ISSCC 2007) used a 12.5 GS/s, 4.5-bit flash ADC in 65 nm with a 2-tap FFE and 5-tap DFE in DSP, 330 mW for the transceiver (245 mW analog, 85 mW digital) (Palermo L8 slides 9–10). Newer ones interleave SAR ADCs, with the offset, gain and skew calibration that brings.
- **When it wins** (Zhang slide 55): flexibility and long DSP equalizers (Zhang's 20-tap FFE + 1-tap DFE) on high-loss PAM4 channels; the analog receiver still wins on power where the channel allows it.

> [!tip] Remark
> The ADC itself is owned elsewhere: flash and its decoders in [[Flash ADCs]], interleaving and its calibration in [[Interleaved ADCs]], the front-end sampler in [[Sampling Circuits]]. The DSP equalizers are digital FIRs on samples ([[Equalization#RX FFE]]).

## How These Receivers Work

### Wong 2004: 3.6 Gb/s low-power receiver

```tikz title="Wong et al. 2004 receiver, redrawn from Figs. 13-14. Termination 100 ohm to 0.5 V and 100 ohm to ground (50 ohm to 0.25 V). Four comparators on quadrature 1.8 GHz phases (2 data, 2 edge); each comparator = PMOS preamp with constant-RC bandwidth limit + digitally steered offset current + positive-feedback latch with booster, then SR latch and TSPC retiming."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.6cm,align=center,fill=white}]
  \draw (0,0) node[ocirc]{} node[left]{I/O} -- (1.0,0) node[circ]{} coordinate(n);
  \draw (n) to[R,l=$100\,\Omega$] (1.0,1.6) node[above]{0.5 V};
  \draw (n) to[R,l_=$100\,\Omega$] (1.0,-1.6) node[ground]{};
  \foreach \i/\y/\p in {1/1.5/\phi_1,2/0.5/\phi_2,3/-0.5/\phi_3,4/-1.5/\phi_4} {
    \node[b,minimum width=1.6cm] (r\i) at (3.4,\y) {Rcvr ($\p$)};
    \draw[->] (n) ++(0,0) -- (2.0,0) |- (r\i.west);
  }
  \node[b,minimum width=0.9cm,minimum height=3.6cm] (sy) at (5.4,0) {SYNC};
  \foreach \i in {1,2,3,4} \draw[->] (r\i.east) -- (r\i.east-|sy.west);
  \node[b,minimum width=1.2cm,minimum height=3.6cm] (dm) at (7.2,0) {2:16\\DEMUX\\(1:2 tree)};
  \draw[->] (sy.east|-0,0.9) -- (dm.west|-0,0.9) node[midway,below]{$D_0,D_1$};
  \draw[->] (sy.east|-0,-0.9) -- ++(0.4,0) |- (5.9,-2.4) node[below,pos=0.9]{} -- (5.4,-2.4) node[left]{$E_0,E_1$ $\to$ data recovery};
  \draw[->] (dm.east) -- ++(0.6,0) node[right,align=left]{16 $\times$\\225 Mb/s};
  % comparator detail
  \begin{scope}[yshift=-4.6cm]
    \node[b,minimum width=2.4cm,minimum height=1.1cm] (pa) at (0.4,0) {PMOS preamp\\$M_1$/$M_2$: IN vs $V_{ref}$\\gain $<2$};
    \node[b,minimum width=2.3cm,minimum height=1.1cm] (bw) at (3.7,0) {constant-$RC$ filter\\$\approx2$ k$\Omega$ triode ($PV_{DD}$,\\$V_G$ from TX cal.): 2 GHz};
    \node[b,minimum width=2.2cm,minimum height=1.1cm] (pf) at (7.0,0) {positive feedback\\$M_{11}$--$M_{17}$\\+ booster $M_{18,19}$};
    \node[b,minimum width=1.0cm,minimum height=1.1cm] (sr) at (8.9,0) {SR};
    \node[b,minimum width=1.0cm,minimum height=1.1cm] (ts) at (10.3,0) {TSPC};
    \node[b,minimum width=2.3cm,minimum height=0.8cm] (oc) at (3.7,1.5) {offset: binary $M_{10}$\\steered by $M_8$/$M_9$};
    \draw[->] (pa) -- (bw); \draw[->] (bw) -- (pf); \draw[->] (pf) -- (sr); \draw[->] (sr) -- (ts);
    \draw[->] (oc.east) -| (pf.north);
    \draw[->] (-1.6,0) -- (pa.west);
    \node[align=left,anchor=north west] at (-1.2,-0.9) {reset half of every cycle (clears ISI memory); offset $\pm75\to\pm5$ mV; thermal $\pm8$ mV ($3\sigma$);\\ supply-induced $\pm8$ mV for $\pm10\,\%$ $V_{DD}$; minimum input swing 33 mV; receiver 6.4 mW (Table II)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Architecture:** no equalizer in the receiver (2-tap pre-emphasis at the TX handles a 12 dB channel). The line is terminated in 100 Ω to 0.5 V ∥ 100 Ω to ground, i.e. 50 Ω to 0.25 V, so the input common mode is low and the preamp uses a **PMOS pair** comparing IN against $V_{ref}$ (pseudo-differential). Four comparators on the four quadrature phases of a 1.8 GHz clock take 2 data and 2 edge samples per 2 UI (§IV, Fig. 13).
- **Sensitivity target <35 mV** at 0.25 V input CM, resolved at 1.8 GHz (a 6-FO4 cycle). Small sampler devices save switching power, so offsets are large and are **digitally compensated**: a binary-segmented tail $M_{10}$ steered by the fully switched pair $M_8$/$M_9$, which leaves the preamp's gain and RC corner undisturbed. Calibrated by shorting the inputs until the output dithers.
- **Noise:** bandwidth is limited to 2 GHz on purpose (10 % above the highest signal frequency), with a constant-RC filter whose resistor reuses the transmitter's impedance-calibration bias. Pseudo-differential inputs turn CM noise and crosstalk into differential noise, which the filter then cuts. Supply noise appears as input noise through mismatch: ±10 % supply gives ±8 mV.
- **Regeneration:** the preamp current feeds a folded-cascode-like positive-feedback stage; a **booster** fires one inverter delay after regeneration starts and pulls the internal nodes low (+10 % regeneration speed, +15 % reset speed, less data-dependent kickback). An SR latch with cross-coupled PMOS holds data from 10 MHz to 2 GHz.
- **Back end:** TSPC retiming → synchronizer → 2:16 tree; the edge samples go to a bang-bang phase detector that steers the clock through charge-pump mismatch ([[Clocking and CDR]]).

### Toifl 2006: 22 Gb/s PAM4 receiver

```tikz title="Toifl et al. 2006, redrawn from Figs. 1, 2, 14: programmable termination + ESD, then three identical bit slices, one per PAM4 threshold (+dV, 0, -dV). Each slice = voltage-shifting amplifier (with switchable capacitive degeneration) -> four second-stage amplifiers with per-latch offset trim -> CML sampling latches at 5.5 GHz I/Q (2 data + 2 edge) -> SenseAmp latches -> 1:8 demux. A single 11 GHz phase rotator + I/Q divider clocks all slices; CDR logic at 1.38 GHz."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.7cm,align=center,fill=white}]
  \node[b,minimum width=1.9cm,minimum height=1.2cm] (term) at (0,0) {programmable\\termination\\+ ESD};
  \draw[->,thick] (-1.8,0) node[left,align=right]{22 Gb/s\\PAM4} -- (term);
  \foreach \k/\y/\dv/\nm in {1/1.6/{+\Delta V}/h,2/0/{0}/m,3/-1.6/{-\Delta V}/l} {
    \node[b,minimum width=1.5cm] (vs\k) at (2.9,\y) {V-shift $\dv$\\+ EQ};
    \node[b,minimum width=1.6cm] (sa\k) at (5.3,\y) {$4\times$ 2nd amp\\offset trim};
    \node[b,minimum width=1.9cm] (cl\k) at (7.8,\y) {CML latches\\$+$ SAL $\to$ 1:8};
    \draw[->] (vs\k) -- (sa\k); \draw[->] (sa\k) -- (cl\k);
    \draw[->] (term.east) -- (1.5,0) |- (vs\k.west);
    \draw[->] (cl\k.east) -- ++(0.6,0) node[right]{$d\nm_{0\text{-}7}$, $e\nm_{0\text{-}7}$};
  }
  \node[b,minimum width=2.4cm] (pr) at (5.3,-3.1) {11 GHz phase rotator\\(48 steps, 1.9 ps)};
  \node[b,minimum width=1.6cm] (iq) at (7.8,-3.1) {$\div2$ I/Q\\5.5 GHz};
  \draw[->] (pr) -- (iq);
  \draw[->] (iq.north) -- (cl3.south);
  \draw[<-] (pr.west) -- ++(-0.8,0) node[left,align=right]{6 phases\\from DLL};
  \node[b,minimum width=2.3cm] (cdr) at (11.4,-3.1) {CDR logic, decode,\\PRBS check (1.38 GHz)};
  \draw[->] (cdr.west) -- (iq.east);
\end{circuitikz}
\end{document}
```

- **Bit-slice architecture:** the three PAM4 thresholds are three identical slices, each with its own voltage-shifting amplifier, so one shift serves both the data and the edge samplers at that threshold (§II). The edge information comes from all minor transitions (0–1, 1–2, 2–3) and the major 0–3, whose crossings coincide with the data-sample midpoints.
- **Front end:** voltage-shifting amplifier ([[#The Voltage-Shifting Amplifier]]) with switchable capacitive degeneration; then a second stage per latch (12 in all) for gain, equalization and **per-latch offset** (3 b + sign over 25 mV).
- **Sampling:** CML latches at half rate (5.5 GHz I/Q) for sensitivity (2.6 mV vs 8.2 mV) and supply immunity; SenseAmp latches convert to CMOS; library flip-flops demultiplex 2:4, then 4:8 (§III-B, C). A capacitively coupled differential-to-CMOS converter keeps timing within 12 ps under 100 mV of supply noise.
- **Biasing:** every CML resistor is an adjustable unit cell switched between two ranges at start-up, cutting a 30 % tolerance to 19.9 % (§III-D).
- **Results:** BER $<10^{-12}$ at 22 Gb/s with a 350 ppm frequency offset; the input eye was 650 mVpp overall but only about 95 mV × 35 ps open. 207 mA from 1.1 V (10.4 mW/Gb/s), 0.12 mm², 90 nm SOI (§IV).

### Lee 2015: 56 Gb/s PAM4 and NRZ receivers

```tikz title="Lee et al. 2015 receivers, redrawn from Figs. 7, 9, 13. Top: PAM4 RX (40 nm): one pre-amplifier/equalizer (switching quad, variable R and C in the common-source nodes, three offset outputs) -> three slicers with 1-tap DFE -> thermometer decoder -> retiming at 28 GHz; a linear CDR mixes transitions of the mid-threshold signal V_H with the VCO. Bottom: NRZ RX (65 nm): CTLE -> static divide-by-2 interleaves the data -> XOR transition pulses -> mixer PD; a 1:8 DEMUX tree is clocked through three phase interpolators."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.7cm,align=center,fill=white}]
  \node[font=\small\bfseries,anchor=west] at (-1.4,2.2) {PAM4 RX};
  \node[b,minimum width=1.7cm,minimum height=2.0cm] (pre) at (0.6,0.6) {pre-amp /\\equalizer\\4.5 dB max\\3 outputs};
  \draw[->,thick] (-1.4,0.6) node[left,align=right]{56 Gb/s\\PAM4} -- (pre);
  \foreach \k/\y/\l in {1/1.4/A,2/0.6/B,3/-0.2/C} {
    \node[b,minimum width=1.6cm,minimum height=0.6cm] (s\k) at (3.2,\y) {slicer + 1-tap DFE};
    \draw[->] (pre.east|-s\k) -- (s\k);
    \draw[->] (s\k.east) -- ++(0.97,0) node[pos=0.45,above]{$V_\l$};
  }
  \node[b,minimum width=1.4cm,minimum height=2.0cm] (dec) at (6.2,0.6) {PAM4\\decoder\\(flat CML)};
  \node[b,minimum width=1.2cm,minimum height=2.0cm] (rt) at (8.2,0.6) {D-FF\\retime\\28 GHz};
  \draw[->] (dec) -- (rt);
  \draw[->] (rt.east|-0,1.1) -- ++(0.5,0) node[right]{MSB 28 Gb/s};
  \draw[->] (rt.east|-0,0.1) -- ++(0.5,0) node[right]{LSB 28 Gb/s};
  \node[b,minimum width=4.6cm] (cdr) at (4.0,-1.4) {$V_H$ $\to\Delta T$, XOR $\to$ mixer with 28 GHz VCO $\to$ V/I};
  \draw[->] (pre.south) |- (cdr.west);
  \draw[->] (cdr.east) -| (rt.south);
  % NRZ
  \node[font=\small\bfseries,anchor=west] at (-1.4,-2.6) {NRZ RX};
  \node[b,minimum width=1.0cm] (ct) at (0.0,-3.6) {CTLE};
  \node[b,minimum width=1.3cm] (dv) at (1.8,-3.6) {static $\div2$};
  \node[b,minimum width=1.8cm] (xo) at (4.0,-3.6) {$\Delta T_1,\Delta T_2$, XORs};
  \node[b,minimum width=1.5cm] (mx) at (6.4,-3.6) {3-input mixer};
  \node[b,minimum width=1.6cm] (vco) at (9.1,-3.6) {CP, 56 GHz VCO};
  \draw[->,thick] (-1.4,-3.6) node[left]{56 Gb/s} -- (ct);
  \draw[->] (ct) -- (dv); \draw[->] (dv) -- (xo); \draw[->] (xo) -- (mx); \draw[->] (mx) -- (vco);
  \node[b,minimum width=2.6cm] (dm) at (1.8,-5.0) {1:8 DEMUX tree};
  \node[b,minimum width=2.6cm] (pi) at (6.3,-5.0) {$\div2$ chain + PI$_{1,2,3}$};
  \draw[->] (ct.south) |- (dm.west);
  \draw[->] (vco.south) |- (pi.east);
  \draw[->] (pi) -- (dm);
  \draw[->] (dm.south) -- ++(0,-0.4) node[below]{$8\times7$ Gb/s};
\end{circuitikz}
\end{document}
```

- **PAM4 RX** (§III-B): one single-stage pre-amplifier/equalizer whose switching quad $M_1$–$M_4$, load resistors $R_{1,2}$ and tails $I_{1,2}$ give three outputs at different thresholds; variable resistors and capacitors in the quad's common-source nodes give up to **4.5 dB** of boost. It was designed for input levels about 100 mV apart; the three outputs sit at different common modes, absorbed by the differential buffers after them (Fig. 9).
- Three slicers each carry a **1-tap DFE** (3–5 dB); the thermometer code $V_AV_BV_C$ goes to a flattened CML decoder (three pairs of alternating polarity into shared loads, so $|V_{out}|=I_{SS}R$ for every code; full swing for inputs above about 300 mV at $I_{SS}=2.5$ mA, Fig. 8), then retiming at 28 GHz.
- **Linear CDR:** the mid-threshold output, limited ($V_H$), produces transition pulses that are mixed with the VCO; central crossovers occur with probability ¼ and each side crossover ⅛ ([[Clocking and CDR]]).
- **Measured** (40 nm): sensitivity **23 mV** (level spacing) at $10^{-12}$; recovered clock 281 fs rms; PAM4 RX 420 mW of the 710 mW transceiver (§V, Figs. 15, 19).
- **NRZ RX** (§IV-B, 65 nm): at 56 Gb/s no XOR produces a usable pulse in one bit, so after the CTLE a **static ÷2 interleaves the data** into two half-rate streams; a Vernier half-bit delay ($\Delta T_1-\Delta T_2$) and two XORs feed a 3-input mixer PD. A 1:8 DEMUX tree is re-timed by three phase interpolators. Bang-bang was rejected because a flip-flop "can hardly operate beyond 32 Gb/s". Measured sensitivity **47 mVpp**, NRZ RX 220 mW.

### Palermo's case studies

| Receiver | What to notice | Source |
|---|---|---|
| Roshan Zamir JSSC 2019, 56 Gb/s PAM4, 65 nm | CTLE → 1-tap FIR + 1-tap IIR DFE → 2-bit flash (3 comparators) + error + edge samplers, 4:8 and 8:32 demux, 14 GHz LC-VCO with BBPD CDR; background threshold adaptation; 20.8 dB channel, 4.6 pJ/b | L6 slides 69–73 |
| Song JSSC 2013, 4.8–8 Gb/s, 65 nm | 1:8 input demux so slicers run at 0.6–0.75 V; ILRO multiphase from a forwarded clock; 0.47 pJ/b at 6.4 Gb/s | L6 slides 65–67 |
| Payne JSSC 2005, 6.25 Gb/s | Half-rate 4-tap direct-feedback DFE closing tap 1 in ½ UI | L8 slides 23–24 |
| Liu ISSCC 2009 | Integrating summer merged with partial slicer; 1 FIR + 1 IIR tap for smooth on-chip channels | L8 slides 29–34 |
| Balamurugan JSSC 2008 | 2-way interleaved front end; current-mode offset at the CTLE (margining) and per segment | L6 slide 60 |

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| CTLE peaking ($R_S\uparrow$) | Loss compensated, ISI | DC gain (needs VGA), high-frequency noise and crosstalk gain |
| CTLE bandwidth ($g_m\uparrow$ or $C_p\downarrow$) | ISI, rise time | Integrated noise, power; optimum ≈ $f_N$ |
| CTLE $W$ (for $g_m$) | Gain-bandwidth | Input capacitance: return loss, T-coil needed |
| More CTLE stages / Gm–TIA | Higher-order shaping, gain at low $V_{DD}$, linearity | Power, more noise sources, more tuning codes |
| Bandwidth-limiting the slicer front end (Wong) | Noise | ISI if the limit is below the signal bandwidth |
| Slicer input pair $WL\uparrow$ | Random offset, trim range | Input capacitance, kickback, aperture |
| Offset-DAC bits | Residual offset | Area, capacitance on a fast node, calibration time |
| Capacitive vs current trim | No static power | Aperture, CM-dependent correction |
| CML vs StrongARM first rank | Sensitivity (≈10 dB more gain), supply immunity | ~10× static power |
| Direct-feedback DFE | Slicer count | 1-UI loop through the summer: current or speed |
| Integrating summer | ~3× less current | Clocked reset, duty-cycle-dependent gain |
| Unrolling $h_1$ | Removes the summer from the loop | $2\times$ ($4\times$ PAM4) slicers, input load, more trims |
| Demux factor $N\uparrow$ | Slicer time per bit, lower clock rate, low $V_{DD}$ | Input load $\propto N$, phase accuracy $N\times$ tighter, more clock phases |
| ADC-based RX | Flexible DSP equalization, long FFE | ADC + DSP power; AFE must be linear |

Three rules that fall out of the note:

1. **Budget at the slicer, in one currency.** Noise (×2√SNR), offset, latch dead zone and ISI all subtract from the same eye height at the slicer input. Spend gain early (it divides everything after it) but not so much peaking that integrated noise eats the gain.
2. **The pad and the first-tap loop are the two hard walls.** Capacitance on the pad is fixed by ESD and the CTLE's $W$; the DFE loop is fixed by the slicer's speed. Both get worse with every slicer you add, which is the real price of unrolling and PAM4.
3. **Leave knobs, and a way to read them.** Termination, CTLE codes, VGA gain, offsets and thresholds all drift with PVT and channel. Every one needs a DAC, and the receiver needs a spare sampler that can tell the adaptation loop where the eye really is.

## Cheat sheet

| Quantity | Result |
|---|---|
| Sensitivity | $v_S^{pp}=2v_n^{rms}\sqrt{SNR}+v_{min}+v_{offset}$; ≈20 mVpp for 1 mV, $\sqrt{SNR}=7$, 6 mV |
| Eye mask | $H_{eye,min}=v_S+V_{OS,pp}$, $W_{eye,min}=t_{ap}+t_{jitter,pp}$ |
| Return loss with pad $C$ | $\lvert S_{11}(f_N)\rvert<-7$ dB $\iff C<1/(2\pi f_NZ_0)$ (owned by Smith Chart and Impedance Matching) |
| CTLE (degenerated pair) | peaking $1+g_mR_S/2$, $A_{DC}=g_mR_D/(1+g_mR_S/2)$, $A_{pk}\omega_{p2}=g_m/C_p$ |
| Gm–TIA gain | $v_{out}/v_{in}\approx-G_mR_F\,A/(1+A)$ |
| Front-end noise | $\overline{v^2_{n,FE}}=\int_0^{BW_D}\lvert H\rvert^2V^2_{n,in}df$; $BW_{opt}\approx f_N$ to slightly above |
| Sampling function | $v_{sample}=\int v_{in}h\,d\tau$, $\int h=1$, $w_{80}=t_{90}-t_{10}$ |
| ISF | $v_o(t_{obs})=\int v_i\Gamma\,d\tau$ |
| Offset | $\sigma_{V_t}=A_{V_t}/\sqrt{WL}$; range $\pm3\sigma$; LSB $=$ range$/(2^{N_b}-1)$ |
| DFE loop (direct) | $t_{CLK\to Q}+t_{mux}+t_{sum}\le1$ UI; $3RC\le t_{sum}$ |
| DFE loop (unrolled) | $t_{clk\to Q}+t_{mux,sel}+t_{setup}\le1$ UI |
| Summer swing | resistive $IR$; integrating $I\Delta T/C$; $I_{res}/I_{int}\approx3$ |
| Demux by $N$ | $T_{slicer}=N$ UI; $\Delta t=(\Delta\phi/360^\circ)N$ UI; $C_{load}\approx NC_{in}$ |
| PAM4 thresholds | $0,\pm\frac23V_{peak}$; MSB $=V_B$, LSB $=V_A\oplus V_B\oplus V_C$ |
| Voltage-shifting pair | $\Delta V\approx V_{OV}\left(\sqrt{w_{max}/w_x}-1\right)$ |
| Threshold adaptation | $TH_1=\frac12(TH_{ER,3}+TH_{ER,6})$, $TH_3=\frac12(TH_{ER,4}+TH_{ER,5})$ |

## References

- **S. Palermo, ECEN720 Lecture 6, "RX Circuits"** (`ref/SerDes/lecture6_ee720_rx_circuits.pdf`): slides 5–6 (RX parameters, block diagram), 8–9 (Pisati and Loi input networks), 11–17 (AFE, input stages, Gm–TIA, Pisati Gm and TIA stages, Zheng inverter CTLE and replica bias), 19–50 (comparators: StrongARM, Nikolić RS latch, sampling function and aperture, ISF, SA vs CML, low-voltage and charge-steering latches), 52–61 (sensitivity, front-end noise, 56G noise example, comparator noise, metastability, offset, correction range, current-mode and capacitive correction), 63–67 (demultiplexing, Song 1:8), 69–73 (Roshan Zamir PAM4 RX and threshold adaptation).
- **S. Palermo, ECEN720 Lecture 8, "RX FIR, CTLE, DFE, & Adaptive Eq."** (`lecture8_ee720_rx_adaptive_eq.pdf`): slides 9–10 (Harwood ADC RX), 13–17 (passive/active CTLE, tuning), 20–27 (DFE, Payne direct feedback and critical path, unrolling, resistive and integrating summers), 29–34 (Liu IIR DFE, merged summer/slicer, merged mux/IIR).
- **S. Palermo, ECEN720 Lecture 5** (`lecture5_ee720_termination_txdriver.pdf`): slides 6–10 (on-chip, double, AC/DC termination, resistor options, active termination), 42 (pad network, $S_{11}<-7$ dB at Nyquist).
- **S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems,"** in *High-Speed Circuits* (Iniewski, ed.), 2011 (`serial_links_chapter_palermo_2011.pdf`): §9.2.1 (receiver, regenerative latch, time-division demultiplexing, 6–8 FO4 limit), §9.4 (Eq. 9.5 sensitivity, offset-correction DACs, Fig. 9.22).
- **K.-L. J. Wong et al., "A 27-mW 3.6-Gb/s I/O Transceiver," IEEE JSSC, vol. 39, no. 4, Apr. 2004** (`voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`): §IV (receiver, comparator, SR latch, 2:16 demux), Figs. 13–17, Table II.
- **T. Toifl et al., "A 22-Gb/s PAM-4 Receiver in 90-nm CMOS SOI Technology," IEEE JSSC, vol. 41, no. 4, Apr. 2006** (`22Gbps_PAM4_rx_toifl_jssc_2006.pdf`): §II (bit-slice architecture), §III-A (voltage-shifting amplifier, Eq. 1, CMRR/PSRR), §III-B (latch sensitivity model, CML vs SenseAmp), §III-C (demux), §III-D (CML biasing), §IV (measurements), Appendix.
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," IEEE JSSC, vol. 50, no. 9, Sept. 2015** (`56G_NRZPAM4_J.pdf`): §III-B (PAM4 RX, Figs. 7–9), §IV-B (NRZ RX, Figs. 12–14), §V (Figs. 15, 19, 21: power, sensitivities).
- **B. Nikolić et al., "Improved Sense-Amplifier-Based Flip-Flop: Design and Measurements," IEEE JSSC, vol. 35, no. 6, June 2000** (`sa_ff_optimized_latch_nikolic_jssc_2000.pdf`): §II–IV, used only via [[Comparators#The SR Latch After It]].
- **D. Zhang, "PAM4 Signaling for 56G Serial Link Applications," DesignCon 2016** (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`): slide 55 (analog vs DSP receivers), 56, 60.
- **P. Jespers and B. Murmann, *Systematic Design of Analog CMOS Circuits*, 2017**: Table 1.1 (65 nm device data for the worked example).
- Razavi, *Analysis and Design of Data Converters*, Ch. 5–7: used only through [[Comparators]] (28 nm StrongARM numbers in the worked example).
