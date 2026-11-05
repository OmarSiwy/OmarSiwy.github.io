---
title: SerDes Learning Path
description: What to learn, in what order, before reading the six SerDes papers in ref/SerDes, with every concept mapped to the note that teaches it and nine new SerDes notes proposed.
kind: topic
status: growing
aliases:
  - SerDes Learning Path
  - SerDes Prerequisites
---

This note is the reading plan for the papers in `ref/SerDes/`. It names every idea those papers use, says which note teaches it (written, planned in [[Learning]], elsewhere in the vault, or **NEW**), and orders the reading. The coarse picture is first, then the dependency graph, then the full table, then one section per paper.

## The big picture

```tikz title="A complete serial link (after Palermo ECEN720 Lecture 1, slide 11, and Lee et al. Fig. 1). Blue italics name the note that teaches each block."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,scale=0.82,transform shape,
  blk/.style={draw,thick,minimum width=2.2cm,minimum height=1.1cm,align=center,fill=white},
  lbl/.style={font=\scriptsize\itshape,text=blue!60!black,align=center}]
  % data path
  \node[blk] (ser) at (1.5,0) {Serializer\\(MUX)};
  \node[blk] (ffe) at (4.4,0) {FFE\\driver};
  \node[blk,minimum width=3.2cm,fill=gray!10] (ch) at (8.4,0) {Channel\\pkg, PCB, via, conn.};
  \node[blk] (ctle) at (12.4,0) {CTLE\\+ VGA};
  \node[blk] (dfe) at (15.3,0) {DFE\\+ slicer};
  \node[blk] (des) at (18.2,0) {Deserializer\\(DEMUX)};
  \draw[->] (-0.6,0) node[left,align=right,font=\scriptsize] {$N$ parallel\\TX bits} -- (ser.west);
  \draw[->] (ser) -- (ffe);
  \draw[->] (ffe) -- node[above,font=\scriptsize] {$R_T$} (ch);
  \draw[->] (ch) -- node[above,font=\scriptsize] {$R_T$} (ctle);
  \draw[->] (ctle) -- (dfe);
  \draw[->] (dfe) -- (des);
  \draw[->] (des.east) -- (20.1,0) node[right,align=left,font=\scriptsize] {$N$ parallel\\RX bits};
  % clocks
  \node[blk] (pll) at (2.95,-2.4) {PLL\\(TX clock)};
  \node[blk] (cdr) at (15.3,-2.4) {CDR\\(RX clock)};
  \draw[->] (-0.6,-2.4) node[left,font=\scriptsize] {ref clk} -- (pll.west);
  \draw[->] (pll.north) ++(-0.5,0) -- ++(0,0) |- ++(0,0.4) -| (ser.south);
  \draw[->] (pll.north) ++(0.5,0) -- ++(0,0.4) -| (ffe.south);
  \draw[->] ([xshift=0.45cm]dfe.south) -- node[right,font=\scriptsize,align=left] {data +\\edge samples} ([xshift=0.45cm]cdr.north);
  \draw[->] ([xshift=-0.45cm]cdr.north) -- node[left,font=\scriptsize] {RX clk} ([xshift=-0.45cm]dfe.south);
  \draw[->] (cdr.east) -| (des.south);
  \node[font=\scriptsize] at (8.4,-1.25) {eye, ISI, BER at the slicer};
  % note labels
  \node[lbl,above=2pt] at (ser.north) {Transmitters\\Digital CMOS Circuits};
  \node[lbl,above=2pt] at (ffe.north) {Transmitters\\Equalization};
  \node[lbl,above=2pt] at (ch.north) {Channels\\(EM: TL, S-params)};
  \node[lbl,above=2pt] at (ctle.north) {Equalization\\Receivers};
  \node[lbl,above=2pt] at (dfe.north) {Receivers, Equalization\\Comparators};
  \node[lbl,above=2pt] at (des.north) {Receivers};
  \node[lbl,below=2pt] at (pll.south) {Phased-Locked Loops, Oscillators\\Clocking and CDR};
  \node[lbl,below=2pt] at (cdr.south) {Clocking and CDR};
  \node[lbl] at (9.4,-4.3) {whole link: Signaling and BER $\cdot$ Link Noise and Jitter $\cdot$ High-Speed Circuit Techniques (CML, peaking)};
\end{circuitikz}
\end{document}
```

> [!important] Five things to know before opening any of the papers
> 1. **The channel sets the problem.** What matters is its loss at the **Nyquist frequency**: $R_b/2$ for NRZ, $R_b/4$ for PAM4. Loss, reflections and crosstalk spread each bit into its neighbours (**ISI**) and close the eye.
> 2. **Every block exists to keep the eye open at the slicer.** The FFE (TX), the CTLE and the DFE (RX) undo ISI. The PLL and CDR put the sampling edge in the middle of the eye. BER is set by what is left: noise, residual ISI, and jitter.
> 3. **PAM4 halves the Nyquist frequency but shrinks each eye to $\tfrac13$**, a $20\log_{10}3 \approx 9.5$ dB SNR penalty. First-order rule: use PAM4 when the channel loses more than 9.5 dB extra between $R_b/4$ and $R_b/2$ (Lee Fig. 2).
> 4. **None of the analog textbooks in `ref/` teach the link-level material** (channels, eyes, BER, jitter decomposition, equalization, CDR). The circuit material builds on [[Differential Amplifiers]], [[Comparators]], [[Oscillators]] and [[Phased-Locked Loops]].
> 5. **Reading order:** [[#Palermo Lecture 1 Introduction to Links|Palermo L1]] → [[#Wong 2004 Voltage-Mode Transceiver|Wong 2004]] → [[#Zhang 2016 PAM4 Tutorial|Zhang]] → [[#Won 2024 Dual-Mode Transmitter|Won 2024]] → [[#Lee 2015 56G NRZ and PAM4 SerDes|Lee 2015]] → [[#Palermo Lecture 16 Optical Transceivers|Palermo L16]]. The speed and difficulty both go up along that order.

**Map:** [[#The prerequisite graph|graph]] → [[#Topic table|table]] → [[#Per-Paper Reading Lists|per paper]] → [[#Proposed new SerDes notes|new notes]] → [[#Gaps in the existing and planned notes|gaps]] → [[#References|references]].

## The prerequisite graph

```tikz title="Prerequisite DAG. An arrow A → B means learn A before B. Green: notes in Learning.md. Yellow: other folders of the vault. Orange: proposed NEW SerDes notes, numbered in writing order. Blue: the papers."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,scale=0.8,transform shape,
  old/.style={draw,rounded corners=2pt,minimum width=2.55cm,minimum height=0.9cm,align=center,fill=green!12},
  ext/.style={draw,rounded corners=2pt,minimum width=2.55cm,minimum height=0.9cm,align=center,fill=yellow!20},
  new/.style={draw,thick,rounded corners=2pt,minimum width=2.55cm,minimum height=0.9cm,align=center,fill=orange!25},
  pap/.style={draw,double,minimum width=2.55cm,minimum height=0.9cm,align=center,fill=blue!10},
  e/.style={->,gray!70!black,thin}]
  % level labels
  \foreach \y/\t in {11/{L0\\foundations},8.2/{L1\\analog blocks},5.4/{L2\\link system},2.6/{L3\\link circuits},-0.2/{L4\\papers}}
    \node[align=right,font=\small\bfseries,anchor=east] at (-0.2,\y) {\t};
\def\allnodes{%
  % L0
  \node[old] (mos) at (1.5,11) {MosFETs};
  \node[old] (dif) at (4.4,11) {Differential\\Amplifiers};
  \node[old] (frq) at (7.3,11) {Frequency\\Response};
  \node[old] (noi) at (10.2,11) {Noise};
  \node[old] (ind) at (13.1,11) {Inductor};
  \node[old] (dig) at (16,11) {Digital CMOS\\Circuits};
  \node[ext] (tl) at (18.9,11) {EM: TL, $Z_0$, $\Gamma$,\\S-parameters};
  \node[ext] (dsp) at (21.8,11) {DSP: convolution,\\FIR, $z$-transform};
  % L1
  \node[old] (fb) at (1.5,8.2) {Feedback\\Stability};
  \node[old] (nlm) at (4.4,8.2) {Nonlinearity\\and Mismatch};
  \node[old] (cmp) at (7.3,8.2) {Comparators};
  \node[old] (osc) at (10.2,8.2) {Oscillators};
  \node[old] (pll) at (13.1,8.2) {Phased-Locked\\Loops};
  \node[old] (dac) at (16,8.2) {DACs};
  \node[old] (fla) at (18.9,8.2) {Flash ADCs\\(2-bit PAM4 slicer)};
  % L2
  \node[new] (chn) at (4.4,5.4) {1 Channels};
  \node[new] (sig) at (8.7,5.4) {2 Signaling\\and BER};
  \node[new] (jit) at (13.1,5.4) {3 Link Noise\\and Jitter};
  \node[new] (eq) at (17.5,5.4) {4 Equalization};
  % L3
  \node[new] (hsc) at (1.5,2.6) {5 High-Speed\\Circuit Techniques};
  \node[new] (tx) at (5.8,2.6) {6 Transmitters};
  \node[new] (rx) at (10.2,2.6) {7 Receivers};
  \node[new] (cdr) at (14.6,2.6) {8 Clocking\\and CDR};
  \node[new] (opt) at (19.6,2.6) {9 Optical\\Transceivers};
  % L4
  \node[pap] (p1) at (1.5,-0.2) {Palermo L1\\intro to links};
  \node[pap] (zh) at (5.6,-0.2) {Zhang 2016\\PAM4 tutorial};
  \node[pap] (wo) at (9.7,-0.2) {Wong 2004\\3.6 Gb/s VM TX};
  \node[pap] (wn) at (13.8,-0.2) {Won 2024\\28/56G dual-mode TX};
  \node[pap] (le) at (17.9,-0.2) {Lee 2015\\56G NRZ/PAM4};
  \node[pap] (p16) at (21.8,-0.2) {Palermo L16\\optical XCVRs};
}
\allnodes
  % L0 -> L1
  \draw[e] (dif) -- (cmp); \draw[e] (dif) -- (nlm); \draw[e] (osc) -- (pll);
  \draw[e] (noi) -- (osc); \draw[e] (fb.south) to[bend right=14] (pll.south);  \draw[e] (mos) -- (nlm);
  \draw[e] (cmp.south) to[bend right=18] (fla.south); \draw[e] (dig) -- (dac); \draw[e] (ind) -- (osc);
  % -> L2
  \draw[e] (tl) -- (chn); \draw[e] (dsp) -- (chn); \draw[e] (dsp) -- (eq);
  \draw[e] (chn) -- (sig); \draw[e] (sig) -- (jit); \draw[e] (noi) -- (sig);
  \draw[e] (pll) -- (jit); \draw[e] (frq) -- (eq); \draw[e] (sig) to[bend right=12] (eq);
  % -> L3
  \draw[e] (dif) -- (hsc); \draw[e] (frq) -- (hsc); \draw[e] (ind) -- (hsc); \draw[e] (dig) -- (hsc);
  \draw[e] (hsc) -- (tx); \draw[e] (eq) -- (tx); \draw[e] (dac) -- (tx); \draw[e] (chn) -- (tx);
  \draw[e] (hsc) to[bend right=10] (rx); \draw[e] (eq) -- (rx); \draw[e] (cmp) -- (rx); \draw[e] (fla) -- (rx); \draw[e] (nlm) -- (rx);
  \draw[e] (jit) -- (cdr); \draw[e] (pll) -- (cdr); \draw[e] (rx) -- (cdr);
  \draw[e] (sig) -- (opt); \draw[e] (rx) to[bend right=8] (opt);
  % -> L4
  \draw[e] (chn) -- (p1); \draw[e] (sig) -- (p1);
  \draw[e] (sig) -- (zh); \draw[e] (eq) -- (zh); \draw[e] (cdr) -- (zh); \draw[e] (jit) -- (zh);
  \draw[e] (tx) -- (wo); \draw[e] (rx) -- (wo); \draw[e] (cdr) -- (wo);
  \draw[e] (tx) -- (wn); \draw[e] (hsc) -- (wn);
  \draw[e] (tx) -- (le); \draw[e] (rx) -- (le); \draw[e] (cdr) -- (le); \draw[e] (opt) -- (le);
  \draw[e] (opt) -- (p16);
  \allnodes
  % legend
  \node[old,minimum width=1.6cm] at (3,-2) {written/planned};
  \node[ext,minimum width=1.6cm] at (6.3,-2) {other vault notes};
  \node[new,minimum width=1.6cm] at (9.6,-2) {NEW SerDes note};
  \node[pap,minimum width=1.6cm] at (12.9,-2) {paper};
  \node[anchor=west] at (14.6,-2) {arrow $A\to B$: learn $A$ before $B$};
\end{circuitikz}
\end{document}
```

- **L0, foundations.** Device, small-signal, frequency response, noise, transmission lines, DSP. [[MosFETs]], [[Differential Amplifiers]], [[Frequency Response]] and [[Feedback]] are written. The rest are planned in [[Learning]] or sit in other folders.
- **L1, analog blocks.** Comparators, oscillators, PLLs, DACs, flash decoding. All of these are planned in [[Learning]], none written yet.
- **L2, link system.** Pure link theory. It needs math (convolution, Gaussian tails) more than circuits, and nothing in the vault covers it.
- **L3, link circuits.** Drivers, samplers, CDRs. These are L1 blocks pushed to tens of GHz with the L2 theory in hand.

> [!tip] Remark
> L2 needs only L0 math, so the four system notes (1–4) can be written and read **before** the planned L1 circuit notes exist. The circuit notes (5–9) are the ones that wait on [[Comparators]], [[Oscillators]] and [[Phased-Locked Loops]].

## Topic table

Paper keys: **P1** = Palermo ECEN720 L1, **W04** = Wong 2004, **Z16** = Zhang DesignCon 2016, **W24** = Won & Kim 2024, **L15** = Lee et al. 2015, **P16** = Palermo ECEN720 L16. Status: *written* = note has content now, *planned* = listed in [[Learning]] but empty.

| Level | Topic | Where it's taught | Needed by |
|---|---|---|---|
| L0 | MOSFET switch / triode resistance, velocity saturation | [[MosFETs]] (written) | W04 (triode NMOS driver segments; DNL worsens with velocity saturation, Sec. III) |
| L0 | Differential pair, large-signal current steering, tail | [[Differential Amplifiers]] §Level 2 (written) | every CML block: L15, W24, W04 preamp |
| L0 | Gilbert cell / switching quad as mixer, XOR, interpolator | [[Differential Amplifiers]] §Level 6 (written) | L15 (mixer phase detectors, phase interpolator Fig. 14, switching-quad preamp Fig. 9) |
| L0 | Poles, Bode, second-order $Q$ and ringing | [[Frequency Response]] §Level 0 (written) | L15 (peaking-$L$ over/under-damping, Fig. 5b), W24 rise time |
| L0 | Zero from degeneration $R_S\parallel C_S$ (the CTLE) | **gap**: not in [[Frequency Response]]; NEW 4 / 7 | L15 Fig. 9, Z16 slide 17 |
| L0 | Thermal noise, input-referred noise, noise vs bandwidth | [[Noise]] (planned, Razavi Ch7 + Tony Ch9) | W04 (BW-limited comparator, Sec. IV-A), L15 ($\sigma_n$ in Eq. 1) |
| L0 | On-chip spiral inductors, $Q$, self-resonance | [[Inductor]] (planned) | L15 (peaking $L_1,L_2,L_D,L_G$, Fig. 4) |
| L0 | Negative feedback, loop stability | [[Feedback]] (written), [[Stability]] (planned) | W04 impedance and slew-rate control loops (Figs. 8, 12); all PLL/CDR loops |
| L0 | Latches, flip-flops, TSPC, FO4, LFSR/PRBS, MUX trees | [[Digital CMOS Circuits]] (planned) | W24 (TSPC DFF Fig. 3, QPRBS13), W04 (FO4 bit time, 16:1 tree), L15 (PRBS $2^7-1$) |
| L0 | Transmission lines: $Z_0$, $\gamma$ from RLGC, $\Gamma$, termination, microstrip | [[Exam Prep - Problems through Stability]] §1–2 (Pozar Ch2–3) | P1, all; L15 (50 Ω microstrip TLs, Sec. IV-A) |
| L0 | S-parameters, insertion/return loss | [[Exam Prep - Problems through Stability]] §4 (Pozar Ch4) | L15 Fig. 11(c) ($S_{11},S_{22}$), Z16 slide 14, P1 slide 16 |
| L0 | Convolution, impulse response, FIR | [[Discrete Signals and Systems]] §5, §8 | Z16 (ISI = data ∗ pulse, slide 15), W04 Eq. 1 |
| L0 | $z$-transform, $z^{-1}$ delays | [[Z-Transform]] | DFE feedback filter (Z16 slide 18), FFE |
| L0 | FIR frequency response | [[Discrete-Time Fourier Transform]] | FFE boost at Nyquist (L15: 9 dB) |
| L0 | Gaussian PDF, $Q$-function, tail probabilities | **NEW 2** (no vault note) | L15 Eq. 1, Z16 slides 67–68, W04 BER estimate (Sec. VI) |
| L0 | PSD of random NRZ/PAM4 data ($\mathrm{sinc}^2$) | **NEW 2** | Z16 slides 13, 26 |
| L1 | Clocked comparator: preamp + regenerative latch, StrongARM, SR latch | [[Comparators]] (planned, Razavi DC Ch5–7, Tony Ch10) | W04 (Figs. 14, 16), L15 slicers, Z16 data/error latches (slide 32) |
| L1 | Offset, Pelgrom mismatch, offset calibration | [[Nonlinearity and Mismatch]], [[Comparators]] (Razavi DC §6.5) | W04 (75 → 5 mV), L15 (CM offsets of 3-output preamp, Fig. 9d) |
| L1 | Linearity / compression of a multi-level signal | [[Nonlinearity and Mismatch]] (planned) | L15 (linear RX front end), Z16 (RLM, slides 42, 82), W24 (RLM in Table 1) |
| L1 | Ring and LC VCOs, phase noise, injection locking | [[Oscillators]] (planned, Razavi Ch15 + Tony §19.4) | L15 (28 and 56 GHz VCOs, sub-harmonic injection locking), W04 |
| L1 | PLL: PFD, charge pump, loop filter, type-II dynamics, DLL | [[Phased-Locked Loops]] (planned, Razavi Ch16 + Tony Ch19) | L15, W04 (Fig. 18), W24 (DLL) |
| L1 | Jitter, phase noise, integrated rms jitter, jitter transfer | [[Phased-Locked Loops]] (Tony §19.2–19.5, Razavi §16.3.2) | L15 (fs rms jitter, loop-BW choice), W04 (6.8 ps rms) |
| L1 | Segmented / binary-weighted DAC, DNL | [[DACs]] (planned, Razavi DC Ch9–10) | W04 (16-level VM driver, Figs. 7, 9, 26), L15 iDACs, Z16 slide 51 |
| L1 | Thermometer → binary decoding | [[Flash ADCs]] (planned) | L15 PAM4 decoder (Figs. 7, 8), Z16 ADC-based RX |
| L1 | Switched-capacitor filtering | [[Switched-Capacitor Circuits]] (planned) | W04 (SC loop filter notch, Sec. V-B) |
| L1 | Regulators (LDO), replica bias | [[Biasing]] (planned, Tony Ch7) | W04 (LDO per I/O, Fig. 8), W24 ($VDD_{High}$) |
| L2 | Channel parts, loss (skin, dielectric), reflections, crosstalk, ILD, mode conversion | **NEW 1** [[Channels]] | P1, Z16 (slides 12, 20–21, 38–41), L15 (5 cm PCB) |
| L2 | Pulse response, cursors, ISI, eye diagram, peak-distortion analysis | **NEW 1** [[Channels]] | all |
| L2 | NRZ vs PAM4, Gray coding, Nyquist, eye height/width penalty | **NEW 2** [[Signaling and BER]] | L15 Sec. II, Z16 slides 22–35, W24 |
| L2 | BER/SER, bathtub, FEC, precoding, COM, test patterns | **NEW 2** [[Signaling and BER]] | Z16 slides 67–84, L15, W04 |
| L2 | Link noise budget; jitter RJ/DJ/PJ/DDJ/EOJ, dual-Dirac, jitter tolerance | **NEW 3** [[Link Noise and Jitter]] | Z16 (slides 77–79), L15 (rms/p-p jitter), W04 (timing margin, Fig. 27), W24 (eye width) |
| L2 | FFE / CTLE / DFE theory, tap unrolling, IIR DFE, adaptation (LMS) | **NEW 4** [[Equalization]] | all |
| L3 | CML buffer/latch/MUX/XOR, tail-less CML, CML↔CMOS | **NEW 5** [[High-Speed Circuit Techniques]] | L15 (Figs. 4, 8, 11), W24 (Fig. 4) |
| L3 | Shunt peaking, T-coils, distributed amplifiers, on-chip TLs | **NEW 5** [[High-Speed Circuit Techniques]] | L15 (Figs. 4, 11) |
| L3 | Frequency dividers, pulse generators | **NEW 5** [[High-Speed Circuit Techniques]] | L15 (static ÷2 front end, Fig. 12), W24 (1 UI pulse gen, Fig. 2) |
| L3 | Termination; CML vs voltage-mode/SST drivers; impedance calibration | **NEW 6** [[Transmitters]] | W04 (Figs. 4, 7, 8), W24, L15 |
| L3 | Serializers: tree, half/quarter rate, current-domain MUX, clock–data alignment | **NEW 6** [[Transmitters]] | W04, W24 (4:1 at pad), L15 (phase aligner, Fig. 10) |
| L3 | TX FFE circuits; PAM4 TX (2:1 weighting, pre-distortion, dual mode) | **NEW 6** [[Transmitters]] | L15 (Figs. 3, 6), W24 (Fig. 6), W04 (Eq. 1), Z16 (slides 16, 51–52) |
| L3 | RX front end: CTLE circuit, VGA/AGC, sampler, DEMUX, PAM4 slicers | **NEW 7** [[Receivers]] | L15 (Figs. 7, 9), W04 (Figs. 13–17), Z16 (slides 32, 55–60) |
| L3 | Clocking architectures, multiphase, DLL + QEC, phase interpolators | **NEW 8** [[Clocking and CDR]] | W24 (Fig. 1), L15 (Figs. 10, 14), W04 |
| L3 | CDR: Hogge, Alexander (bang-bang), mixer-based linear PD, Mueller–Müller, dual loop, freq. acquisition | **NEW 8** [[Clocking and CDR]] | L15 (Secs. III-B, IV-B), W04 (Sec. V), Z16 (slides 43–50) |
| L3 | Optical channel, VCSEL/EAM/MZM/ring, ER/OMA, photodiode, TIA, LA | **NEW 9** [[Optical Transceivers]] | P16, L15 (EML pre-distortion, Fig. 6) |

## Per-Paper Reading Lists

### Palermo Lecture 1 Introduction to Links

**What it does:** frames the course. Shows the generic link (the [[#The big picture|big picture]] diagram above), the backplane channel and its impairments, and an IBM 10 Gb/s SerDes with a 4-tap TX FFE and a 5-tap adaptive DFE (Meghelli, ISSCC 2006).

**Minimal reading list:** [[Exam Prep - Problems through Stability]] §1 (transmission lines) → [[Discrete Signals and Systems]] §5 (convolution) → NEW [[Channels]] → NEW [[Signaling and BER]] (eye diagrams only). At this level the lecture is readable after [[Channels]] alone.

> [!note]- Concept list: Palermo Lecture 1
> - Link anatomy: serializer, TX, channel, RX, deserializer, PLL, CDR; TX vs RX clock timing (slide 11).
> - Applications and reach: DDR, PCIe, USB, SATA, MIPI; electrical vs optical in data centers (slides 8–10). PAM4 above ~50 Gb/s (slide 10).
> - Backplane channel: package, line-card trace, vias, connectors; dispersion, reflections, NEXT/FEXT crosstalk (slide 12).
> - Channel frequency response vs pulse response; eye closure with and without equalization (slides 13–14).
> - Meghelli IBM 10 Gb/s: $|SDD21|$ of −24.6 dB at 5 GHz (slide 16), half-rate CML TX with a 4-tap FFE and IDAC tap weights (slide 18), T-coil RX input, VGA, a half-rate 5-tap DFE with H1 speculation (slide 21), a digital CDR with phase rotators and jitter tolerance (slide 22), FFE-vs-DFE horizontal eye opening (slide 24).
> - Prerequisites the course states: CMOS gates and flops, s- and z-transforms, basic digital communications (slide 6).
> - Course outline: channels → communication techniques → equalizers → TX/RX circuits → equalizer circuits → clocking circuits → clocking systems → link modeling (slide 25). The proposed NEW notes follow the same order.

### Wong 2004 Voltage-Mode Transceiver

**What it does:** a low-power chip-to-chip transceiver in 0.18 µm CMOS (7.5 mW/Gb/s). It has a source-terminated voltage-mode driver that does 2-tap pre-emphasis while staying at 50 Ω, a bandwidth-limited comparator with digital offset trim, and a CDR that shifts phase by deliberately mismatching charge-pump currents.

```tikz title="Wong et al. 2004 transceiver, redrawn from Figs. 3, 6, 7, 13 and 18. TX and RX share one PLL (half-duplex I/O)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.9cm,align=center,fill=white}]
  \node[b,minimum width=1.7cm] (mux) at (0.6,0) {$16{:}1$ MUX\\(2:1 tree)};
  \node[b,minimum width=3.0cm,minimum height=1.5cm] (drv) at (4.1,0) {voltage-mode driver\\4 binary segments\\$Y[n]=X[n]-\alpha X[n{-}1]$\\$R_{out}=50\,\Omega$ for every $\alpha$};
  \draw[->] (-1.1,0) node[left] {$16\times$225 Mb/s} -- (mux);
  \draw[->] (mux) -- (drv);
  \node[b,minimum width=2.8cm] (ctl) at (4.1,2.1) {impedance + slew-rate\\control loops (replica,\\ext.\ 50 $\Omega$ ref, LDO)};
  \draw[->] (ctl) -- (drv);
  \node[b,minimum width=1.8cm,fill=gray!10] (ch) at (8.1,0) {channel\\$\le$12 dB\\term.\ to $V_S/2$};
  \draw[->] (drv) -- node[above] {3.6 Gb/s} node[below] {$V_S{=}0.5$ V} (ch);
  \node[b,minimum width=2.6cm,minimum height=1.5cm] (cmp) at (11.3,0) {4 comparators\\(2 data, 2 edge)\\BW-limited preamp,\\digital offset trim};
  \draw[->] (ch) -- (cmp);
  \node[b,minimum width=1.6cm] (dm) at (14.4,0) {$2{:}16$\\DEMUX};
  \draw[->] (cmp) -- (dm); \draw[->] (dm) -- ++(1.3,0) node[right,align=left] {$16\times$\\225 Mb/s};
  \node[b,minimum width=5.6cm,minimum height=1.2cm] (pll) at (11.3,-2.2) {shared PLL ($\times4$, 1.8 GHz, 4 phases) + bang-bang PD;\\phase set by deliberate charge-pump $I_{UP}/I_{DN}$ mismatch\\(7 b, 6 ps LSB), SC filter notches ripple};
  \draw[->] ([xshift=-0.6cm]pll.north) -- node[left] {clk} ([xshift=-0.6cm]cmp.south);
  \draw[->] ([xshift=0.6cm]cmp.south) -- node[right] {samples} ([xshift=0.6cm]pll.north);
  \draw[->] (pll.west) -| node[pos=0.25,below] {TX clk} (mux.south);
  \draw[<-] (pll.east) -- ++(0.6,0) node[right] {450 MHz ref};
\end{circuitikz}
\end{document}
```

**Minimal reading list:**
1. [[MosFETs]] §Level 1 (triode resistance) and [[Differential Amplifiers]]
2. [[Exam Prep - Problems through Stability]] §1 (termination, reflections)
3. NEW [[Channels]] → NEW [[Signaling and BER]] → NEW [[Equalization]] (TX FIR only)
4. [[DACs]] (segmented, DNL) → NEW [[Transmitters]] (voltage-mode drivers, impedance control)
5. [[Noise]] → [[Comparators]] (preamp + latch, offset trim) → NEW [[Receivers]]
6. [[Phased-Locked Loops]] (charge pump, mismatch → static phase offset) → NEW [[Clocking and CDR]] (bang-bang PD)

> [!note]- Concept list: Wong 2004, with locations
> - **Power metric** mW/Gb/s; ITRS I/O bandwidth trend (Sec. I, Figs. 1–2).
> - **Half-duplex, mesochronous** I/O; FO4-based bit time (3 FO4 = 3.6 Gb/s) (Sec. II).
> - **Signaling:** high-CM vs low-CM; LCM with $V_S=0.5$ V, NMOS pull-up in triode; driver power table (Fig. 4, Table I). Termination to $V_S/2$, 250 mV p-p swing, 35 mV RX sensitivity, a 12 dB channel tolerated with pre-emphasis.
> - **Source termination** and impedance matching to suppress reflections; RX mode reuses the driver as a 100 Ω‖100 Ω termination (Fig. 5).
> - **Supplies:** separate $AV_{DD}$ and $PV_{DD}$; PVT-tracking logic supply; LDO per I/O; switching regulator efficiency (Sec. II).
> - **Serializer:** 16:1 binary tree of 2:1 MUXes clocked at 1.8 GHz, 900, 450, 225 MHz (Fig. 6).
> - **Impedance control loops** with replica and an external 50 Ω reference; separate pull-up and pull-down loops (Figs. 7b, 8, 10).
> - **2-tap pre-emphasis** $Y[n]=X[n]-\alpha X[n-1]$ (Eq. 1) built from 4 binary-weighted segments (a 16-level DAC whose parallel conductance stays 50 Ω for every $\alpha$; worked example $\alpha=3/15$). DNL across corners, and velocity saturation (Figs. 7a, 9, 26).
> - **Slew-rate control** to 1/3 bit time (6% ISI vs transition time, Fig. 11) via pre-driver resistance and a replica control loop (Fig. 12); simultaneous switching noise.
> - **RX:** 4 samplers on quadrature clocks (2 data, 2 edge), SR latch, TSPC retiming, synchronizer, 2:16 DEMUX tree (Figs. 13, 16, 17).
> - **Comparator:** PMOS preamp for low input CM; pseudo-differential input with a reference, so CM noise becomes differential; 2 GHz RC bandwidth limit to cut noise; reset phase removes ISI memory; digital offset compensation (75 → 5 mV); regenerative latch with a booster; supply noise as input-referred noise (Fig. 14, Table II).
> - **CDR:** dual-loop: a PLL ($\times4$; PFD, CP, SC loop filter, VCO, divider) plus a **bang-bang PD** loop that steers phase through **charge-pump current mismatch** (7 bits, 6 ps LSB, 350 ps range). Downsampled up/down counter sets the loop "bandwidth" (1/16 of data rate). SC filter notch at 450 MHz kills CP ripple (Figs. 18–22).
> - **Measurement:** eye diagrams through 8 cm FR4 and RG58 (Figs. 24–25), voltage/timing margin shmoo (Fig. 27), a BER *estimated* from the noise, offset and jitter budget (Sec. VI).

### Zhang 2016 PAM4 Tutorial

**What it does:** a system-level DesignCon tutorial (Xilinx). It reviews NRZ links and equalization, then covers PAM4 levels, coding, eye penalties, impairments, CDR options, TX FIR, analog vs ADC-based receivers, adaptation, BER/FEC/COM, and the 56G test methods (CEI-56G, IEEE 802.3bs).

```tikz title="The PAM4 link as Zhang et al. present it (slides 15–19, 51–56, 69–74). This is a composite of the options the tutorial discusses, not one chip."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.9cm,align=center,fill=white}]
  \node[b,minimum width=1.5cm] (fec) at (0,0) {KP4 FEC\\RS(544,514)};
  \node[b,minimum width=1.6cm] (map) at (2.2,0) {Gray map,\\$1/(1{+}D)$\\precode};
  \node[b,minimum width=1.8cm] (fir) at (4.6,0) {3-tap TX FIR\\$c_{-1},c_0,c_1$};
  \node[b,minimum width=1.8cm,fill=gray!10] (ch) at (7.2,0) {channel: IL,\\reflections,\\crosstalk, skew};
  \node[b,minimum width=1.5cm] (ctle) at (9.7,0) {CTLE\\+ AGC};
  \node[b,minimum width=2.4cm] (eq) at (12.4,0.75) {analog: FFE, DFE\\data + error slicers};
  \node[b,minimum width=2.4cm] (adc) at (12.4,-0.75) {or: ADC + DSP\\FFE / DFE};
  \node[b,minimum width=1.5cm] (dfec) at (15.3,0) {decode,\\FEC};
  \draw[->] (-1.4,0) node[left] {bits} -- (fec);
  \draw[->] (fec) -- (map); \draw[->] (map) -- (fir); \draw[->] (fir) -- node[above]{} (ch); \draw[->] (ch) -- (ctle);
  \draw[->] (ctle.east) -- ++(0.25,0) |- (eq.west); \draw[->] (ctle.east) -- ++(0.25,0) |- (adc.west);
  \draw[->] (eq.east) -- ++(0.25,0) |- (dfec.west); \draw[->] (adc.east) -- ++(0.25,0) |- (dfec.west);
  \draw[->] (dfec) -- ++(1.3,0) node[right] {bits};
  \node[b,minimum width=5cm] (cdr) at (12.4,-2.4) {CDR: $2\times$ oversampled bang-bang\\or baud-rate Mueller--M\"uller / SS-MMSE};
  \draw[->] ([xshift=0.8cm]adc.south) -- node[right] {samples, errors} ([xshift=0.8cm]cdr.north);
  \draw[->] ([xshift=-0.8cm]cdr.north) -- node[left] {clock} ([xshift=-0.8cm]adc.south);
  \node[b,minimum width=3.2cm] (ad) at (7.2,-2.4) {adaptation (e.g. sign-sign LMS):\\CTLE, AGC, FFE, DFE taps};
  \draw[->] (cdr) -- (ad);
  \draw[->] (ad.north) -- ++(0,0.5) -| (ctle.south);
  \node[align=left,anchor=north west] at (-1.4,-1.4) {PAM4 levels $\{-3,-1,+1,+3\}$\\eye height $\tfrac13$ of NRZ: $-9.5$ dB\\Nyquist $= R_b/4$ (14 GHz at 56 Gb/s)};
\end{circuitikz}
\end{document}
```

**Minimal reading list:**
1. [[Exam Prep - Problems through Stability]] §1, §4 (TL, S-parameters)
2. [[Discrete Signals and Systems]] → [[Z-Transform]] (FIR, $z^{-1}$)
3. NEW [[Channels]] → NEW [[Signaling and BER]] → NEW [[Link Noise and Jitter]] → NEW [[Equalization]]
4. NEW [[Clocking and CDR]] (bang-bang vs baud-rate Mueller–Müller only)

The tutorial has almost no transistor-level content, so the circuit notes are optional for it.

> [!note]- Concept list: Zhang 2016, with slide numbers
> - **Standards:** 802.3bj KR4 (NRZ) and KP4 (PAM4); OIF CEI-56G-PAM4 VSR/MR/LR at up to 10/21/31 dB; 802.3bs CDAUI-8 at 53.125 Gb/s from 257/256 PCS and 544/514 FEC overhead (slides 7–10).
> - **Link impairments:** jitter, noise, intra-pair skew, frequency-dependent loss, reflections, crosstalk (slide 12).
> - **NRZ:** UI, Nyquist $=R_s/2$, PSD $\propto\mathrm{sinc}^2(fT_b)$ (slide 13).
> - **Time ↔ frequency:** $S_{21}(f)\leftrightarrow h_{21}(t)$, plus the mismatch-corrected transfer function using $\Gamma_S$, $\Gamma_L$, $S_{11}$, $S_{22}$ (slide 14).
> - **ISI and equalization taxonomy:** TX FIR; RX analog CTLE/FFE/DFE; RX digital FFE/DFE (slide 15).
> - **TX FIR de-emphasis:** 3 taps with tap magnitudes summing to 1 (peak swing fixed) and the main tap larger than the other two combined (slide 16, with a 6 dB example).
> - **CTLE:** zeros offset the loss and also boost noise; AGC (slide 17). **DFE:** subtract post-cursors, $h_1\ldots h_N$ feedback FIR (slide 18). Equalization goals in f and t (slide 19).
> - **Reflections, ILD, crosstalk** (PSXT, ICR, ICN, COM) (slides 20–21).
> - **PAM4:** linear vs Gray mapping, level naming (slides 23–25); half-bandwidth PSD (slide 26); eye height 1/3 → 9.5 dB, >11 dB in practice (slide 27); eye width only 1/2–2/3 UI from non-adjacent transitions (slides 28–29); when PAM4 wins (slides 30–31).
> - **Slicer naming:** data latches DH/DZ/DL, error latches, crossing latches (slide 32).
> - **Eye anatomy:** 64 trace combinations (slide 33); ISI closes PAM4 at about 4.5 dB vs 10 dB for NRZ (slides 34–35).
> - **PAM4-specific impairments:** MSB/LSB clock skew and driver mismatch (slides 36–37); reflections and crosstalk about 3× worse (slides 38–39); intra-pair skew and mode conversion $SDC21$ (slides 40–41); nonlinearity (slide 42).
> - **Timing recovery:** 2× oversampled bang-bang vs baud-rate (slide 43); PAM4 transition density 75% vs 50% (slide 44); selected crossings (slides 45–46); SS-MMSE (slide 47); **Mueller–Müller** aligns so that $h(-1)=h(+1)$ (slides 48–50).
> - **TX FIR for PAM4:** filter MSB/LSB separately then sum, or map then filter; current-steering DACs (slide 51); a 3-tap example with 64 levels (slide 52).
> - **RX:** CTLE for PAM4 (slide 53); EH6/EW6 at BER $10^{-6}$ (slide 54); analog vs ADC/DSP RX (slide 55); tap-unrolled DFE needs 4 slicers per tap at full rate (slide 56); analog FFE with S/H or delay lines (slides 57–60); IIR DFE (slides 61–62).
> - **Adaptation** of CTLE/AGC/FFE/DFE (slides 63–64); on-die eye monitors and sampled eyes (slides 65–66).
> - **SER/BER** formulas with Hamming distance (slide 67); bathtub and MSE-based BER (slide 68); $1/(1+D)$ precoding against DFE burst errors (slides 69–71).
> - **FEC:** RS(528,514) and RS(544,514), coding gain 5–6 / 7–8 dB (slides 72–73). **COM** (slide 74). **IBIS-AMI** (slides 75–76).
> - **Test:** JP03A/B, even-odd jitter (slides 77–79); QPRBS13 and PRQS10 (slides 80–81); RLM ≥ 0.95 (slides 82–84).

### Won 2024 Dual-Mode Transmitter

**What it does:** a 28 nm TX at 28 GBd that sums MSB (2×) and LSB (1×) tail-less CML slices in current at the pad. It widens the PAM4 eye by 30% by briefly pulling node $V_X$ high with an auxiliary PMOS, so the two output edges cross while both are steep. It also turns the LSB path fully off in NRZ mode (1.4 pJ/bit PAM4, 1.84 pJ/bit NRZ).

```tikz title="Won and Kim 2024 transmitter, redrawn from Figs. 1, 2, 4 and 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.9cm,align=center,fill=white}]
  \node[b,minimum width=1.8cm,minimum height=3.6cm] (prbs) at (0,0) {4-way\\parallel\\QPRBS13\\(7 GHz)};
  \node[b,minimum width=1.8cm,minimum height=3.6cm] (sel) at (2.5,0) {PAM4/NRZ\\mode\\selector\\(SEL: NRZ\\resets LSB)};
  \draw[->] (prbs) -- node[above] {8} (sel);
  \foreach \i/\y in {0/1.35,1/0.45,2/-0.45,3/-1.35} {
    \node[b,minimum width=2.4cm,minimum height=0.7cm] (pg\i) at (5.6,\y) {1 UI data + eye-\\boost pulse gen $\langle\i\rangle$};
    \draw[->] (sel.east|-pg\i.west) -- (pg\i.west);
    \node[b,minimum width=2.0cm,minimum height=0.7cm,fill=orange!10] (dr\i) at (9.0,\y) {tail-less CML\\MSB 2$\times$, LSB 1$\times$};
    \draw[->] (pg\i) -- (dr\i);
    \draw (dr\i.east) -- (10.4,\y);
  }
  \draw[thick] (10.4,1.35) -- (10.4,-1.35);
  \draw (10.4,0) -- (11.0,0);
  \draw (11.0,0) to[R,l_=$R_T$] (11.0,1.9) node[above] {$VDD_{High}$};
  \draw[->] (11.0,0) -- (11.8,0) node[right,align=left] {$OUT_{P/N}$, 28 GBd:\\56 Gb/s PAM4\\or 28 Gb/s NRZ};
  \node[align=left,anchor=west] at (10.6,-1.0) {slices summed in\\current at the pad:\\4:1 current-domain MUX};
  \node[b,minimum width=3.6cm] (dll) at (5.6,-2.9) {quad-phase DLL + QEC\\(cap-DAC delay cells)};
  \draw[->] (dll.north) -- node[left,align=right] {$CK_R,CK_D,CK_P$\\(3 adjacent of 4 phases)} (pg3.south);
  \draw[->] (2.5,-2.9) node[left] {ext.\ CLK 7 GHz} -- (dll.west);
  \node[draw,dashed,align=left,anchor=north west,text width=6.3cm] at (8.0,-2.3) {eye boost: $DP_{OUT}$ (1 UI-early, inverted copy of $D_{OUT}$) turns on aux.\ pull-up $M_{PX}$ on node $V_X$, delaying one edge so $OUT_P$/$OUT_N$ cross while both are steep. Min.\ PAM4 eye width $0.42\to0.55$ UI.};
\end{circuitikz}
\end{document}
```

**Minimal reading list:**
1. [[Differential Amplifiers]] (current steering) → [[Frequency Response]] (rise time vs pole)
2. [[Digital CMOS Circuits]] (DFF, TSPC, PRBS)
3. NEW [[Signaling and BER]] (PAM4, eye width, RLM)
4. NEW [[High-Speed Circuit Techniques]] (CML, tail-less CML, pulse generators)
5. [[Phased-Locked Loops]] §DLL → NEW [[Clocking and CDR]] (quadrature clocks, QEC)
6. NEW [[Transmitters]] (current-mode driver, 4:1 output MUX, dual mode)

> [!note]- Concept list: Won 2024, with locations
> - **Why PAM4** and why its horizontal eye shrinks: transitions between non-adjacent levels (Sec. 1).
> - **Dual-mode backward compatibility**, and energy efficiency vs data rate (Sec. 1).
> - **Architecture:** 4-way parallel QPRBS13 generator at 7 GHz; PAM4/NRZ mode selector; 1 UI data and eye-boost pulse generators; **quad-phase DLL + QEC** (capacitor-DAC delay cells, foreground calibrated); 8 segmented **tail-less current-mode drivers** (4 MSB at 2×, 4 LSB at 1×) in a **4:1 current-domain MUX** at the output (Fig. 1).
> - **Pulse generator:** negative-edge DFF retimer; TSPC flip-flops with programmable (dual-strength) reset; 1 UI pulse $D_{OUT}$ and a 1 UI-early inverted $DP_{OUT}$ built from three adjacent clock phases $CK_R,CK_D,CK_P$ (Figs. 2–3).
> - **Eye-opening enhancement:** aux. pull-up $M_{PX}$ holds $V_X$ at $V_{DD}$ to delay one edge so the differential crossing is steep. 10–90% rise time drops from 16.85 to 15.15 ps (TT) (Figs. 4–5). Comparison with pre-charge pulse generators that cost DC current or add precursor ISI (Sec. 2).
> - **Low-power dual mode:** active-low-reset DFFs force the LSB path to 0 in NRZ; $VDD_{High}$ 1.2 V (NRZ) vs 1.4 V (PAM4); on-chip termination $R_T$ (Fig. 6).
> - **Measurement:** bias-T and balun setup (Fig. 7c); power breakdown; PAM4 min eye width 0.42 → 0.55 UI, eye height ~114 → ~94 mV; NRZ eye width 0.87 → 0.9 UI (Fig. 8); comparison table with RLM, pJ/bit, driver type (CML, SST, tail-less CML) (Table 1).

### Lee 2015 56G NRZ and PAM4 SerDes

**What it does:** two complete 56 Gb/s transceivers in 65/40 nm CMOS. The PAM4 one has a dual-path half-rate 3-tap FFE with a peaked, pre-distorting combiner, a CTLE plus 1-tap DFE RX, a fast LSB decoder, and a mixer-based linear CDR. The NRZ one has a tree MUX with a PLL-driven phase aligner, a distributed-amplifier 2:1 selector, and a full-rate linear CDR made possible by a ÷2 front end.

```tikz title="Lee et al. 2015, PAM4 transceiver, redrawn from Figs. 3, 4, 7 and 9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  % TX
  \node[b,minimum width=1.9cm] (fa) at (1.6,1) {3-tap FFE\\MSB path};
  \node[b,minimum width=1.9cm] (fb) at (1.6,-0.4) {3-tap FFE\\LSB path};
  \node[b,minimum width=2.1cm,minimum height=2.2cm] (cmb) at (4.4,0.3) {combiner\\$2{:}1$ current\\weighting\\$L$-peaked\\+ iDAC\\pre-distortion};
  \draw[->] (-0.6,1) node[left] {$D_{inA}$ 28 Gb/s} -- (fa);
  \draw[->] (-0.6,-0.4) node[left] {$D_{inB}$ 28 Gb/s} -- (fb);
  \draw[->] (fa) -- (fa-|cmb.west); \draw[->] (fb) -- (fb-|cmb.west);
  \node[b,minimum width=1.9cm] (pll) at (1.6,-2.2) {28 GHz PLL\\SSB-mixer PFD\\inj.\ locked};
  \draw[->] (pll) -- node[right] {28 GHz} (fb);
  % channel
  \node[b,minimum width=1.6cm,fill=gray!10] (ch) at (7.6,0.3) {channel\\(5 cm PCB\\in test)};
  \draw[->] (cmb) -- node[above] {56 Gb/s} node[below] {PAM4} (ch);
  % RX
  \node[b,minimum width=1.7cm,minimum height=2.2cm] (pre) at (10,0.3) {preamp /\\CTLE\\(3 offset\\outputs)};
  \draw[->] (ch) -- (pre);
  \node[b,minimum width=1.7cm] (sa) at (12.6,1.3) {slicer +\\1-tap DFE};
  \node[b,minimum width=1.7cm] (sb) at (12.6,0.3) {slicer +\\1-tap DFE};
  \node[b,minimum width=1.7cm] (sc) at (12.6,-0.7) {slicer +\\1-tap DFE};
  \foreach \s in {sa,sb,sc} \draw[->] (\s-|pre.east) -- (\s);
  \node[b,minimum width=1.5cm,minimum height=2.8cm] (dec) at (15.1,0.3) {PAM4\\decoder\\(therm.\\$\to$ 2 b)\\+ retime};
  \draw[->] (sa) -- node[above] {$V_A$} (sa-|dec.west);
  \draw[->] (sb) -- node[above] {$V_B$} (sb-|dec.west);
  \draw[->] (sc) -- node[above] {$V_C$} (sc-|dec.west);
  \draw[->] ([yshift=0.4cm]dec.east) -- ++(0.6,0) node[right] {MSB 28 Gb/s};
  \draw[->] ([yshift=-0.4cm]dec.east) -- ++(0.6,0) node[right] {LSB 28 Gb/s};
  % CDR
  \node[b,minimum width=6.2cm,minimum height=1.2cm,fill=gray!5] (cdr) at (12.6,-2.6) {linear full-rate CDR: $V_H$ (input limited at mid threshold) $\to\Delta T$, XOR $\to$ mixer with\\28 GHz VCO $\to$ V/I $\to$ loop filter; PFD frequency loop shuts off on lock};
  \draw[->] (pre.south) -- node[right] {$V_H$} (pre.south|-cdr.north);
  \draw[->] (dec.south|-cdr.north) -- node[right] {28 GHz clk} (dec.south);
\end{circuitikz}
\end{document}
```

```tikz title="Lee et al. 2015, NRZ transceiver, redrawn from Figs. 10–14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.8cm,align=center,fill=white}]
  \node[font=\small\bfseries,anchor=west] at (-1.2,1.3) {NRZ TX (65 nm)};
  \node[b,minimum width=1.8cm] (m1) at (1.2,0) {first stage:\\two $2{:}1$ MUXes};
  \node[b,minimum width=1.6cm] (rt) at (4,0) {retiming\\latches};
  \node[b,minimum width=2.6cm] (sel) at (7.3,0) {$2{:}1$ selector\\3-stage distributed\\amp, 50 $\Omega$ TLs};
  \draw[->] (-1.2,0) node[left] {$4\times$14 Gb/s} -- (m1);
  \draw[->] (m1) -- node[above] {$2\times$28} (rt);
  \draw[->] (rt) -- (sel);
  \draw[->] (sel) -- ++(2,0) node[right] {56 Gb/s};
  \node[b,minimum width=3cm] (pa) at (4,-1.8) {phase aligner: XOR-mixer\\M1, PI, mixer M2, V/I};
  \node[b,minimum width=1.8cm] (pll) at (8.2,-1.8) {56 GHz PLL\\$\div2\to$ 28 GHz};
  \draw[->] (pll) -- (pa);
  \draw[->] (pa) -- node[right] {$CK_{28}$} (rt);
  \draw[->] ([xshift=0.5cm]m1.south) |- ([yshift=-0.2cm]pa.west) node[pos=0.7,below] {data};
  \draw[->] (pll.north) -- node[right] {56 GHz} (pll.north|-sel.south);
  % RX
  \node[font=\small\bfseries,anchor=west] at (-1.2,-3.3) {NRZ RX (65 nm)};
  \node[b,minimum width=1.2cm] (ct) at (0.3,-4.6) {CTLE};
  \node[b,minimum width=1.6cm] (dv) at (2.4,-4.6) {static $\div2$\\(interleave)};
  \node[b,minimum width=1.8cm] (xo) at (4.9,-4.6) {$\Delta T_1,\Delta T_2$\\2 XORs};
  \node[b,minimum width=1.6cm] (mx) at (7.3,-4.6) {3-input\\mixer PD};
  \node[b,minimum width=1.6cm] (vco) at (9.6,-4.6) {CP, LPF\\56 GHz VCO};
  \node[b,minimum width=1.6cm] (fd) at (9.6,-3.2) {freq.\ det.\\ref 700 MHz};
  \draw[->] (-1.2,-4.6) node[left] {56 Gb/s} -- (ct);
  \draw[->] (ct) -- (dv); \draw[->] (dv) -- (xo); \draw[->] (xo) -- (mx); \draw[->] (mx) -- (vco);
  \draw[->] (fd) -- (vco);
  \draw[->] (vco.south) -- ++(0,-0.4) -| node[pos=0.25,below] {full-rate clock} (mx.south);
  \node[b,minimum width=2.4cm] (pi) at (9.6,-6.4) {$\div2$ chain +\\3 phase interp.};
  \node[b,minimum width=2.6cm] (dm) at (4.9,-6.4) {$1{:}8$ DEMUX tree};
  \draw[->] ([xshift=0.6cm]vco.south) -- ([xshift=0.6cm]pi.north);
  \draw[->] (pi) -- (dm);
  \draw[->] (ct.south) |- (dm.west);
  \draw[->] (dm.south) -- ++(0,-0.5) node[below] {$8\times$7 Gb/s};
\end{circuitikz}
\end{document}
```

**Minimal reading list:**
1. [[Differential Amplifiers]] (incl. Gilbert cell) → [[Frequency Response]] → [[Inductor]]
2. [[Exam Prep - Problems through Stability]] §1–2, §4 (TLs, microstrip, S-parameters)
3. NEW [[Channels]] → NEW [[Signaling and BER]] (PAM4 $P_e$, the 9.5 dB rule) → NEW [[Equalization]]
4. NEW [[High-Speed Circuit Techniques]] (CML, peaking, distributed amp, ÷2)
5. [[Comparators]] → [[Flash ADCs]] (thermometer decoding) → NEW [[Receivers]]
6. [[Oscillators]] → [[Phased-Locked Loops]] → NEW [[Link Noise and Jitter]] → NEW [[Clocking and CDR]] (mixer PD, Hogge, bang-bang, PI)
7. NEW [[Transmitters]] (FFE combiner, MUX timing); NEW [[Optical Transceivers]] for the EML pre-distortion

> [!note]- Concept list: Lee 2015, with locations
> - **NRZ vs PAM4 trade:** 9.5 dB SNR loss; multi-crossing CDR; PAM4 equalization and linearity; EML nonlinearity needs TX pre-distortion (Sec. I). **Decision rule:** compare channel loss at 14 vs 28 GHz against 9.5 dB (Sec. II, Fig. 2). Typical architectures (Fig. 1); spec table (Table I).
> - **FFE taps** (≤4 to limit parasitics); post-cursors usually dominate pre-cursors (Sec. II).
> - **PAM4 TX:** 28 GHz PLL with SSB-mixer PFD and sub-harmonic injection locking; dual-path half-rate 3-tap FFE, coefficients $[-0.215,0.6,-0.185]$ for 9 dB boost at Nyquist; on-chip TLs for paths over 100 µm (Sec. III-A, Fig. 3).
> - **Combiner:** distributed network with peaking inductors $L_D$, $L_G$, $L_{1,2}$ absorbing $C_{gs}$/$C_{db}$; over- vs under-damping gives ISI (Fig. 4, Fig. 5b).
> - **PAM4 error probability:** $P_{err}=1.5\,Q\!\left(V_{pp}/(6\sigma_n)\right)$; BER $<10^{-12}$ needs $V_{pp}/(6\sigma_n)>7.1$ (17 dB) (Eq. 1, Fig. 5a).
> - **EML transfer curve and pre-distortion** by an iDAC-set MSB:LSB current ratio away from 2:1 (Fig. 6, Fig. 17).
> - **PLL loop-bandwidth optimization** from measured reference and VCO phase noise; $\zeta=1$, 2.7 MHz; integrated rms jitter (Sec. III-A).
> - **PAM4 RX:** single-stage preamp/CTLE with a switching quad and variable $R$/$C$ degeneration (4.5 dB boost); three thresholds → thermometer code; 1-tap DFE; decoder as a 2-bit ADC; retiming (Figs. 7, 9).
> - **Linear CDR for PAM4:** a limited $V_H$ gives transition pulses that are mixed with the VCO, so phase error becomes a DC level. Central vs side crossovers occur with probability 1/4 vs 1/8. Hogge fails at this rate; a frequency-acquisition loop shuts off on lock (Sec. III-B, Fig. 7).
> - **LSB decoder:** flattened 3-pair CML instead of stacked logic; output CM shift; extra half-tail branch (Fig. 8).
> - **NRZ TX:** 4:1 tree MUX; quarter-rate PRBS $2^7-1$; 56 GHz PLL. The 8–10 ps sampling window vs 15–20 ps PVT drift forces a **dynamic phase aligner** (XOR-as-mixer M1, PI, mixer M2, V/I loop; purely linear, unconditionally stable) (Sec. IV-A, Fig. 10).
> - **Distributed 2:1 selector:** 3-stage distributed amplifier, 50 Ω microstrip M9-over-M1 lines with matched group velocity; stage count trade-off; $S_{11},S_{22}<-10$ dB to 70 GHz; no ESD on the output (Fig. 11).
> - **NRZ RX:** XOR pulses can't form at 56 Gb/s, so a static ÷2 interleaves data into two half-rate streams. Vernier half-bit delay $\Delta T_1-\Delta T_2$; 3-input mixer PD; FD with a 700 MHz reference; 1:8 DEMUX; three **phase interpolators** made of switching quads (Figs. 12–14). Why not bang-bang: flip-flop speed (~32 Gb/s), loop-filter capacitor, nonlinearity (Sec. IV-B).
> - **Measurements:** phase noise and integrated jitter, rms vs p-p jitter, rise time, eye SNR, BER vs input (sensitivity), test setup with error detector (Sec. V, Figs. 15–21, Table II).
> - **Future work:** 25 dB chip-to-chip loss; PAM4 adaptation; CTLE linearity loop; eye monitoring; Gray coding; FinFET at 0.85 V (Sec. VI).

### Palermo Lecture 16 Optical Transceivers

**What it does:** surveys optical I/O for data centers: fibers and silicon waveguides, dispersion, couplers, IMDD vs coherent, modulators (VCSEL, EAM, MZM, ring), the ER/OMA/TDECQ metrics, and the photodetector + TIA + LA receiver.

```tikz title="IMDD optical link, after Palermo ECEN720 Lecture 16 (slides 40, 44, 66)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\scriptsize,
  b/.style={draw,thick,minimum height=0.9cm,align=center,fill=white},
  o/.style={->,very thick,red!70!black}]
  \node[b,minimum width=1.5cm] (ser) at (0,0) {serializer\\+ TX FFE};
  \node[b,minimum width=1.6cm] (drv) at (2.4,0) {laser /\\modulator\\driver};
  \node[b,minimum width=2.4cm,minimum height=1.6cm,fill=red!5] (src) at (5.3,0) {direct: VCSEL\\$P_o=\eta(I-I_{TH})$\\external: CW laser +\\EAM / MZM / ring};
  \node[b,minimum width=2.2cm,fill=gray!10] (fib) at (8.6,0) {fiber (MMF/SMF)\\or Si waveguide};
  \node[b,minimum width=1.4cm,fill=red!5] (pd) at (11.2,0) {p-i-n PD\\$I=\rho P$};
  \node[b,minimum width=1.2cm] (tia) at (13.1,0) {TIA};
  \node[b,minimum width=1.4cm] (la) at (14.8,0) {LA /\\CTLE};
  \node[b,minimum width=1.6cm] (cdr) at (16.8,0) {CDR +\\deserializer};
  \draw[->] (-1.2,0) -- (ser); \draw[->] (ser) -- (drv); \draw[->] (drv) -- (src);
  \draw[o] (src) -- (fib); \draw[o] (fib) -- (pd);
  \draw[->] (pd) -- node[above] {$i$} (tia); \draw[->] (tia) -- node[above] {$v$} (la); \draw[->] (la) -- (cdr);
  \node[align=center] at (5.3,1.2) {ER $=P_1/P_0$, OMA $=P_1-P_0$, TDECQ};
  \node[align=center] at (8.6,-1.2) {modal, chromatic,\\PMD dispersion $\to$ ISI};
  \node[align=center] at (13.1,-1.2) {$C_{PD}$ loads\\the TIA input};
  \node[red!70!black,font=\scriptsize\itshape] at (8.6,0.72) {optical path};
\end{circuitikz}
\end{document}
```

**Minimal reading list:** [[Diodes]] (p-i-n junction) → [[Noise]] → [[Feedback]] (shunt-shunt, for the TIA) → NEW [[Signaling and BER]] → NEW [[High-Speed Circuit Techniques]] (peaking) → NEW [[Optical Transceivers]].

> [!note]- Concept list: Palermo Lecture 16, with slide numbers
> - **Motivation:** data-center link lengths, reach scaling inversely with rate, AI cluster demands, retimed vs linear-drive pluggables, co-packaged optics, WDM (slides 4–9).
> - **Optical channels:** fiber loss in dB/km, total internal reflection, MMF vs SMF, transmission bands (850 nm, O, C, L), dispersion: modal ($\Delta T$ for GRIN MMF), chromatic ($\Delta T = D\,\Delta\lambda\,L$), PMD (slides 11–27).
> - **Silicon photonics:** SOI vs bulk waveguides, TE/TM, couplers (edge, tapers, gratings) (slides 28–37).
> - **IMDD vs coherent** (dual-polarization I/Q) (slides 39–42).
> - **Modulation:** direct (chirp) vs external; definitions of $P_{avg}$, OMA, ER and the modulator OMA penalty; TDECQ (slides 44–48).
> - **Devices:** VCSEL ($P_o=\eta(I-I_{TH})$, bias-dependent bandwidth); MZM ($P_{out}/P_{in}=\tfrac12[1+\cos(\pi V_M/V_\pi)]$, $V_\pi L$, traveling-wave drive); EAM (Franz–Keldysh, QCSE); ring resonator modulator (FSR, $Q$, thermal tuning) (slides 49–64).
> - **Receivers:** p-i-n responsivity $\rho = \eta\lambda q/(hc)$, transit-time vs capacitance trade-off; waveguide photodetectors; TIA + limiting amplifier (slides 66–68).

## Proposed new SerDes notes

All go in `Notes/Analog Design/SerDes/`. Write them in this order: each one only needs the ones before it plus the L0/L1 notes named. Each is chapter-sized, in the [[MosFETs]] format (big picture → levels → trade-offs → cheat sheet).

| # | File | Scope | Sources |
|---|---|---|---|
| 1 | `Channels.md` | Link anatomy; channel components (package, PCB, vias, connectors, cables); RLGC lines, skin and dielectric loss; termination (series/parallel, AC/DC coupling); reflections and TDR; differential and mixed-mode S-parameters ($SDD21$, $SDC21$), insertion/return loss, ILD; NEXT/FEXT; impulse and pulse response, cursors; eye diagram construction; peak-distortion (worst-case) eye | Palermo L1, L2, L3, L4 (first half); Zhang slides 12–21, 38–41; Palermo 2011 chapter §9.2; Agilent TDR and S-parameter notes; Pozar Ch2–4 |
| 2 | `Signaling and BER.md` | Random-data PSD; NRZ, PAM4 (Gray, levels, eye height/width penalty, transition density), duobinary briefly; Gaussian noise, $Q$-function, BER/SER, PAM4 $P_e=1.5Q(\cdot)$; bathtub curves; the NRZ-vs-PAM4 decision rule; FEC (RS codes, coding gain), $1/(1+D)$ precoding; COM, EH6/EW6, test patterns, RLM | Palermo L4 (second half), L9; Zhang slides 13, 22–35, 54, 67–84; Lee Sec. II, Eq. 1; Palermo 2011 §9.3.2; Lee 2008 duobinary/PAM4/NRZ JSSC |
| 3 | `Link Noise and Jitter.md` | Noise sources (supply, offset, crosstalk, ISI, random); jitter definitions (absolute, period, cycle-to-cycle), RJ vs DJ (PJ, DDJ/ISI, DCD, EOJ); dual-Dirac model and $TJ@BER$; jitter budgets; jitter transfer and tolerance masks; link timing/voltage margin, StatEye-style statistical BER | Palermo L9, L10; Agilent jitter/BER and dual-Dirac notes; Sanders StatEye (DesignCon 2004); Casper clocking-analysis TCAS-I 2009; Tony §19.3; Zhang slides 77–79 |
| 4 | `Equalization.md` | Why equalize; TX FIR (de-emphasis, coefficient constraints, MMSE/zero-forcing tap choice); RX FIR; CTLE pole/zero design and noise boost; DFE (error propagation, loop-unrolling/speculation, IIR DFE); FFE vs DFE placement; adaptation (sign-sign LMS), eye monitors; baud-rate (Mueller–Müller) link to CDR | Palermo L7, L8; Hanumolu equalizer overview (2005); Stojanovic adaptive EQ JSSC 2005; Zhang slides 15–19, 51–64; Wong Eq. 1; Lee Sec. III |
| 5 | `High-Speed Circuit Techniques.md` | CML buffer, latch, MUX, XOR, and tail-less CML; swing, $RC$ and $f_T$ limits; CML↔CMOS conversion; shunt/series peaking, T-coils, distributed amplifiers; on-chip transmission lines; static/dynamic ÷2 dividers; TSPC and pulse generators | Shekhar et al. JSSC 2006 (bandwidth extension); Mohan et al. JSSC 2000 (shunt peaking); Palermo L5 (speed limits), L14 (CML2CMOS, multiphase); Kossel T-coil SST JSSC 2008; Lee Figs. 4, 8, 11, 12; Won Figs. 3–4 |
| 6 | `Transmitters.md` | Termination circuits and impedance calibration; current-mode (CML) vs voltage-mode / SST drivers (swing, power, matching); TX FFE implementation (segmented slices, IDACs); serializers (tree, half/quarter rate, current-domain MUX at the pad); clock–data alignment; PAM4 TX (2:1 weighting, MSB/LSB skew, RLM, pre-distortion, dual mode) | Palermo L5, L7; Wong 2004; Won 2024; Lee Secs. III-A, IV-A; Zhang slides 36–37, 51–52; Fukuda high-voltage VM driver ISSCC 2008; Palmer low-power I/O JSSC 2007 |
| 7 | `Receivers.md` | RX parameters (sensitivity, offset, aperture); input termination, T-coils, ESD; CTLE circuit (RC degeneration), VGA/AGC; clocked samplers (StrongARM, double-tail, SR latch) as slicers; offset correction; DEMUX trees; PAM4 RX (3 slicers, thermometer decode, error slicers); analog vs ADC-based RX | Palermo L6, L8; Razavi DC Ch5–7; Nikolić SA-FF JSSC 2000; Schinkel double-tail ISSCC 2007; Toifl 22 Gb/s PAM4 RX JSSC 2006; Wong Sec. IV; Lee Sec. III-B; Zhang slides 32, 55–60 |
| 8 | `Clocking and CDR.md` | Embedded vs forwarded clocking; TX PLL in a link (noise transfer, loop-BW optimization); DLLs; multiphase generation and QEC; phase interpolators; CDR phase detectors (Hogge linear, Alexander bang-bang, mixer-based linear, Mueller–Müller, MMSE); single- vs dual-loop CDRs; frequency acquisition; CDR jitter transfer/tolerance; PAM4 transition selection | Palermo L11, L12, L13, L14; Razavi "Challenges in the design of high-speed CDR circuits" (IEEE Comm. Mag. 2002); Hsieh CDR comparison (2008); Mansuri jitter-optimized PLL JSSC 2002; Lee Secs. III-B, IV; Wong Sec. V; Zhang slides 43–50 |
| 9 | `Optical Transceivers.md` | Optical channels and dispersion; IMDD vs coherent; VCSEL/EAM/MZM/ring modulators and drivers; ER, OMA, TDECQ; photodiodes; TIAs (shunt-feedback, RGC, inverter), limiting amps, bandwidth extension; laser-driver pre-distortion for PAM4 | Palermo ECEN720 L16; Palermo ECEN689 optical-interconnects lectures 2–14; Palermo 2011 chapter §9.5; Razavi, *Design of Integrated Circuits for Optical Communications*; Lee Fig. 6 |

> [!tip] Remark
> Notes 1–4 are system theory and need almost no circuits, so they can be written first, in parallel with the planned L1 notes. Notes 5–9 should wait for [[Comparators]], [[Oscillators]] and [[Phased-Locked Loops]] so they can link back instead of re-deriving.

> [!warning] Unverified
> The source lists above name papers hosted on Palermo's ECEN720/ECEN689 pages, and those were confirmed to download. Only the course pages' topic lists were read, not the contents of each paper. Check each paper's actual scope before relying on it for a section.

## Gaps in the existing and planned notes

These are sections the SerDes notes will want to link to rather than re-derive. When the planned note is written, it should include:

- **[[Comparators]]** (Razavi DC Ch5–7, Tony Ch10): preamp + regenerative latch and the StrongARM; regeneration time constant, metastability and its error rate; **input-referred noise → error probability** (Razavi DC Ch6 does this: the bridge to the $Q$-function); offset calibration with shorted inputs and a trim DAC (Razavi DC §6.5.2, as in Wong); kickback; reset to clear memory between decisions (Wong); a slicer with a programmable threshold (PAM4: three thresholds).
- **[[Phased-Locked Loops]]** (Razavi Ch16, Tony Ch19): jitter vs phase noise and integrated rms jitter (Tony §19.3); jitter transfer and peaking (Tony §19.2.1); choosing loop bandwidth from reference vs VCO noise (Tony §19.5, as done in Lee); **charge-pump mismatch → static phase offset** (Razavi §16.3.1, which Wong uses on purpose); the XOR/mixer phase detector (Razavi §16.1.1, the root of Lee's linear CDR); DLLs (Razavi §16.4); retiming / clock recovery as an application (Razavi §16.5.3). CDR proper goes to NEW 8.
- **[[Oscillators]]** (Razavi Ch15, Tony §19.4): LC VCOs at tens of GHz; quadrature generation by ÷2; injection locking (Lee uses sub-harmonic injection locking); ring oscillators for multiphase; oscillator phase noise.
- **[[Frequency Response]]** (written): has no section on **source degeneration with $R_S\parallel C_S$** (a zero below the poles is the CTLE). It also has nothing on **inductive peaking**. Either add a short Level-2 subsection, or leave both to NEW 4/5/7 and link from there. The existing [[Frequency Response#Level 0 Transfer Functions and Bode Plots|second-order $Q$ table]] is what explains Lee's Fig. 5(b) ringing vs long tail.
- **[[Noise]]**: noise bandwidth and integrated noise (why Wong *limits* comparator bandwidth to the signal bandwidth); the Gaussian amplitude PDF of thermal noise.
- **[[Inductor]]**: spiral inductor model, $Q$, self-resonance, area. These are needed for peaking and T-coils.
- **[[DACs]]**: segmented / binary current-steering and resistor-divider DACs with DNL. Wong's driver *is* a 4-bit DAC, and so is every FFE tap set.
- **[[Flash ADCs]]**: thermometer-to-binary decoding and bubble errors (the PAM4 decoder is a 2-bit flash).
- **[[Nonlinearity and Mismatch]]**: compression of a multi-level signal (PAM4 level mismatch, RLM); Pelgrom offsets in small samplers.
- **[[Digital CMOS Circuits]]**: D latch/flip-flop timing (setup, hold, clk-to-Q), TSPC, the FO4 delay metric, LFSR PRBS generators, MUX/DEMUX trees.
- **[[Biasing]]**: LDO regulators and replica-bias control loops (Wong's impedance and slew-rate loops).
- **[[Packaging]]**: ESD capacitance at high-speed pads, bond wires, AC-coupling capacitors.
- **ElectroMagnetism folder**: [[Exam Prep - Problems through Stability]] covers TLs and S-parameters as problem sets. The concept notes it links to ([[S-Parameters]], [[Reflection Coefficient (Transmission Line)]], [[Transmission Line Input Impedance]]) do not exist. Lossy lines (skin effect, dielectric loss), differential/mixed-mode S-parameters and TDR are not covered anywhere; they go in NEW 1.
- **Digital Signal Processing folder**: convolution, FIR, $z$ and DTFT are covered (exam-style). [[Pole-Zero Plots]] is a stub. Missing: the continuous-time Fourier transform of a pulse, the PSD of random data, and LMS adaptive filtering. These go in NEW 2 and NEW 4.

## Design intuition / trade-offs

| Choice the papers make | What it buys | What it costs | Paper |
|---|---|---|---|
| PAM4 instead of NRZ | Half the Nyquist frequency, so less channel loss to equalize | Eye $\tfrac13$ (−9.5 dB), narrower eye width, linearity everywhere, harder CDR | L15, Z16, W24 |
| Voltage-mode (low-CM) driver | Far less signaling power: 0.67 vs 7.87 mW single-ended in Wong Table I | Impedance must be calibrated; FFE must keep $R_{out}$ constant | W04 |
| Current-mode (CML) driver | Easy summing of FFE taps and MSB/LSB in current | Static current; headroom | L15, W24 |
| TX FFE | Cheap, no feedback timing | Lowers peak swing (de-emphasis); pre-cursors only at TX | all |
| CTLE | Passive-ish, continuous | Boosts noise and crosstalk too | L15, Z16 |
| DFE | Removes post-cursors without noise boost | Tight feedback timing; error propagation; post-cursors only | L15, Z16 |
| Bang-bang CDR | Digital-friendly, simple | Nonlinear, dithers; needs fast samplers | W04 |
| Linear (mixer) CDR | Linear loop, works at 56 Gb/s without a full-rate flip-flop | Analog sensitivity; needs ÷2 trick at 56 Gb/s NRZ | L15 |
| Baud-rate (MM) CDR | One clock phase, lower power | Locks where $h(-1)=h(+1)$, not necessarily eye center | Z16 |
| Bandwidth-limited sampler | Less integrated noise | Must still pass the signal; adds ISI if too low | W04 |
| Deliberate CP mismatch for phase | No phase interpolator | Ripple on control voltage; needs an SC filter | W04 |

## Cheat sheet

| Result | Expression |
|---|---|
| Unit interval | $UI = 1/R_{baud}$; NRZ $R_{baud}=R_b$, PAM4 $R_{baud}=R_b/2$ |
| Nyquist frequency | $f_N = R_{baud}/2$ (NRZ $R_b/2$, PAM4 $R_b/4$) |
| PAM4 eye penalty | $\boxed{20\log_{10}3\approx 9.5\ \text{dB}}$ (Z16 slide 27; Lee Sec. I) |
| NRZ-vs-PAM4 rule | PAM4 if $\lvert S_{21}(R_b/2)\rvert_{dB}-\lvert S_{21}(R_b/4)\rvert_{dB} > 9.5$ dB (Lee Fig. 2) |
| PAM4 symbol error | $\boxed{P_{err}=1.5\,Q\!\left(\dfrac{V_{pp}}{6\sigma_n}\right)}$; $10^{-12}$ needs $V_{pp}/6\sigma_n>7.1$ (Lee Eq. 1) |
| 2-tap TX pre-emphasis | $Y[n]=X[n]-\alpha X[n-1]$ (Wong Eq. 1) |
| 3-tap TX FIR constraints | $\lvert c_{-1}\rvert+c_0+\lvert c_1\rvert=1$, $c_0-\lvert c_{-1}\rvert-\lvert c_1\rvert>0$ (Z16 slides 16, 52) |
| Mueller–Müller lock | $h(t_k-T)=h(t_k+T)$ (Z16 slide 48) |
| VCSEL | $P_o=\eta(I-I_{TH})$ (P16 slide 50) |
| MZM intensity | $P_{out}/P_{in}=\tfrac12[1+\cos(\pi V_M/V_\pi)]$ (P16 slide 52) |
| Extinction ratio, OMA | $ER=P_1/P_0$, $OMA=P_1-P_0$ (P16 slide 47) |

## References

**The papers (local, `ref/SerDes/`):**
- J. Lee, P.-C. Chiang, P.-J. Peng, L.-Y. Chen, C.-C. Weng, "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," *IEEE JSSC* 50(9), Sep. 2015, doi:10.1109/JSSC.2015.2433269 (`56G_NRZPAM4_J.pdf`, all sections and figures read).
- H. Zhang, B. Jiao, Y. Liao, G. Zhang, "PAM4 Signaling for 56G Serial Link Applications – A Tutorial," DesignCon 2016 (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`, slides 1–91).
- K.-L. J. Wong, H. Hatamkhani, M. Mansuri, C.-K. K. Yang, "A 27-mW 3.6-Gb/s I/O Transceiver," *IEEE JSSC* 39(4), Apr. 2004, doi:10.1109/JSSC.2004.825259 (`voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`, all).
- J. Won, J. Kim, "A 28/56 Gb/s NRZ/PAM-4 Dual-Mode Transmitter with Eye-Opening Enhancement in 28 nm CMOS," *Electronics* 13, 3774, 2024, doi:10.3390/electronics13183774 (`electronics-13-03774.pdf`, all).
- S. Palermo, ECEN720 Lecture 1 "Introduction" and Lecture 16 "Optical Transceivers," Texas A&M, Spring 2025 (`lecture1_ee720_intro.pdf`, `lecture16_ee720_optical_xcvrs.pdf`, all slides).

**Textbook sections checked for coverage (`ref/`):** Razavi *Analog CMOS* §16.1.1 (XOR/mixer PD), §16.3 (PFD/CP nonidealities, jitter in PLLs), §16.4 (DLL), §16.5.3 (jitter reduction / clock recovery); Carusone et al. Ch19 (§19.2.1 jitter peaking, §19.3 jitter and phase noise, §19.5 PLL noise); Razavi *Data Converters* Ch5–7 (StrongARM, offset cancellation §6.5). None of the three books covers eye diagrams, ISI, CML, inductive peaking, phase interpolators or CDR phase detectors.

**Open primary references found (all checked to download):**
- Palermo ECEN720 course page (16 lectures, labs, papers): https://people.engr.tamu.edu/spalermo/ecen720.html. Lectures are at `https://people.engr.tamu.edu/spalermo/ecen689/lectureN_ee720_*.pdf`:
  L2 channels/TLs, L3 TDR & S-parameters, L4 pulse model & modulation, L5 termination/TX drivers/MUX, L6 RX circuits, L7 EQ intro & TX FIR, L8 RX FIR/CTLE/DFE/adaptive, L9 noise sources, L10 jitter, L11 clocking & PLLs, L12 CDRs, L13 forwarded-clock deskew, L14 clock distribution, L15 die-to-die, L16 optical.
- Palermo ECEN689 Optical Interconnects (photodetectors, RX analysis, TIAs, limiting amps, TX analysis, VCSEL/MZM/EAM/ring TX, laser sources): https://people.engr.tamu.edu/spalermo/ecen689_oi.html
- S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems" (book chapter, 2011): https://people.engr.tamu.edu/spalermo/ecen689/serial_links_chapter_palermo_2011.pdf
- B. Razavi, "Challenges in the Design of High-Speed Clock and Data Recovery Circuits," *IEEE Comm. Mag.*, 2002: https://people.engr.tamu.edu/spalermo/ecen689/cdr_challenges_Razavi_comm_2002.pdf
- P. Hanumolu et al., equalizer overview for high-speed links (2005): https://people.engr.tamu.edu/spalermo/ecen689/hslink_eq_overview_hanumolu_jhses05.pdf
- Agilent, dual-Dirac jitter note: https://people.engr.tamu.edu/spalermo/ecen689/jitter_dual_dirac_agilent.pdf
- J. Lee et al., 20 Gb/s duobinary/PAM4/NRZ backplane transceivers, JSSC 2008: https://people.engr.tamu.edu/spalermo/ecen689/20G_duobinary_pam4_nrz_xcvrs_lee_jssc_2008.pdf
- M. Kossel et al., T-coil SST transmitter, JSSC 2008: https://people.engr.tamu.edu/spalermo/ecen689/tcoil_sst_tx_kossel_jssc_2008.pdf
- B. Nikolić et al., improved sense-amplifier flip-flop, JSSC 2000: https://people.engr.tamu.edu/spalermo/ecen689/sa_ff_optimized_latch_nikolic_jssc_2000.pdf
- S. Shekhar, J. Walling, D. Allstot, "Bandwidth Extension Techniques for CMOS Amplifiers," JSSC 2006: https://people.engr.tamu.edu/spalermo/ecen689_oi/2006_passive_bw_extension_techniques_shekhar_jssc.pdf
