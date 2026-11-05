---
title: Pipelined ADCs
description: Binary search unrolled into a chain of sample-subtract-amplify stages - the MDAC, the residue plot, 1.5-bit redundancy, every stage error read off the residue, and the full chain from pipeline specs to the residue amplifier's A0, GBW, gm/ID and I_D.
kind: topic
status: growing
aliases:
  - Pipelined ADCs
  - Pipelined ADC
  - Pipeline ADC
---

A pipelined ADC is a SAR search laid out in space: each stage makes a coarse decision, subtracts it, amplifies what is left by 2 and hands that **residue** to the next stage, so all stages work on different samples at once. The amplification is what makes it fast and what makes it hard: almost every spec of the converter becomes a spec of the **residue amplifier's op amp**. This note uses the vocabulary of [[Data Converter Fundamentals]] (LSB, DNL, INL, ENOB, the noise budget) and the SC circuits of [[Switched-Capacitor Circuits]] without redefining them.

## The big picture

```tikz title="A pipelined ADC: stages of sub-ADC, DAC, subtractor and x2 amplifier (the MDAC) hand residues down the chain; a delay-aligned adder combines the stage codes. After Razavi (Data Converters) Figs. 17.32, 17.36 and Carusone Figs. 17.21, 17.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.5cm,minimum height=0.9cm,align=center,fill=gray!8}}
  \node[blk] (s1) at (0,0) {Stage 1};
  \node[blk] (s2) at (2.6,0) {Stage 2};
  \node at (4.5,0) {$\cdots$};
  \node[blk] (sk) at (6.4,0) {Stage $k$};
  \node[blk] (be) at (9.0,0) {backend\\ flash};
  \draw[->] (-1.6,0) node[left] {$V_{in}$} -- (s1);
  \draw[->] (s1) -- node[above,font=\scriptsize] {$V_{res1}$} (s2);
  \draw[->] (s2) -- (3.9,0);
  \draw[->] (5.1,0) -- (sk);
  \draw[->] (sk) -- node[above,font=\scriptsize] {$V_{resk}$} (be);
  \node[draw,thick,minimum width=11.4cm,minimum height=0.7cm,fill=gray!15] (dig) at (4.2,-1.9) {delay alignment + adder (digital correction)};
  \foreach \n in {s1,s2,sk,be} { \draw[->] (\n.south) -- (\n.south |- dig.north); }
  \draw[->] (dig.east) -- ++(0.7,0) node[right] {$D_{out}$};
  % one stage, opened up
  \draw[dashed,gray] (-1.4,-3.1) rectangle (7.9,-6.3);
  \node[font=\scriptsize,gray,anchor=north west] at (-1.4,-3.1) {one stage};
  \node[blk,minimum width=1.3cm] (adc) at (0.6,-5.4) {sub-ADC\\ $k$ bits};
  \node[blk,minimum width=1.3cm] (dac) at (2.9,-5.4) {DAC};
  \node[draw,thick,circle,inner sep=1pt] (sum) at (4.4,-3.9) {$\Sigma$};
  \node[draw,thick,regular polygon,regular polygon sides=3,shape border rotate=-90,inner sep=1pt,fill=gray!8] (amp) at (5.9,-3.9) {$G$};
  \draw[->] (-1.2,-3.9) node[above right,font=\scriptsize] {$V_{in}$} -- (sum.west) node[above left,font=\scriptsize] {$+$};
  \draw[->] (-0.6,-3.9) |- (adc.west);
  \draw[->] (adc) -- (dac);
  \draw[->] (dac.east) -| (sum.south) node[below right,font=\scriptsize] {$-$};
  \draw[->] (sum) -- (amp);
  \draw[->] (amp.east) -- (7.7,-3.9) node[above,font=\scriptsize] {$V_{res}$};
  \draw[->] (adc.south) -- ++(0,-0.5) node[below,font=\scriptsize] {bits};
  \node[font=\scriptsize,align=center] at (6.3,-5.4) {MDAC = DAC\\ + subtract + amplify:\\ one SC op-amp circuit};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Each stage samples, decides, subtracts, amplifies:** $V_{res} = 2V_{in} - D\,V_{REF}$ with $D\in\{-1,0,+1\}$ for a 1.5-bit stage. One stage delay sets the throughput; $N$ stages set the latency.
> 2. **The residue plot is the debugging tool.** Comparator and op-amp offsets shift it (vertical/horizontal), gain error and capacitor mismatch rotate it. Digitize it and the DNL/INL fall out.
> 3. **Redundancy (1.5 bits/stage)** lets a comparator be off by up to $\pm V_{REF}/4$ and the digital adder fixes it. It fixes vertical shifts only: **gain errors are never corrected**.
> 4. **The residue gain must be accurate to ½ LSB of everything behind the stage.** With $N_b$ bits left: $A_0\ge2^{N_b+1}/\beta$ and $\omega_u\ge(N_b+1)\ln2/(\beta t_s)$, with $t_s<T/2$. Stage 1 is the hard one.
> 5. **Errors and noise of stage $k$ are divided by the gain in front of it**, $2^{k-1}$ (power: $4^{k-1}$). So stages are scaled down along the pipe and the first one or two burn most of the power.
> 6. **The flip-around MDAC wins:** larger $\beta$ ($\tfrac12$ vs $\tfrac13$) for the same gain of 2, cancels its op-amp offset and its sampled op-amp noise, and needs no fractional references.

**Map:** [[#Spec translation|spec translation (pipeline → op amp → gm/ID, worked stage by stage)]] → [[#Level 0 Binary Search Unrolled|binary search unrolled]] → [[#Level 1 The Stage MDAC and Residue|MDAC and residue]] → [[#Level 2 Redundancy The 1.5-Bit Stage|1.5-bit redundancy]] → [[#Level 3 Stage Errors on the Residue Plot|stage errors]] → [[#Level 4 Op-Amp Limits Settling, Gain, Noise|op-amp limits]] → [[#Level 5 Multibit Stages and Stage Scaling|multibit and scaling]] → [[#Level 6 Escaping the Op Amp|open-loop, SAR hybrids]].

## Spec translation

The pipeline has one block that is not a switch, capacitor or comparator: the op amp inside each MDAC. So the converter's specs land on it in three hops: **pipeline spec → stage error and noise budget → op-amp spec → $g_m/I_D$, $L$, $I_D$**.

```tikz title="Spec translation for one stage k: the converter spec splits into a residue error budget (sets A0 and GBW) and a noise budget (sets the capacitors, hence the load), which together fix the input pair."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,align=center,fill=gray!8,font=\scriptsize,minimum height=0.9cm}}
  \node[blk,minimum width=2.4cm] (spec) at (0,0) {pipeline spec\\ $N$, $f_S$, $V_{REF}$\\ ENOB, DNL};
  \node[blk,minimum width=3.3cm] (err) at (4.0,1.4) {residue error at stage $k$\\ $\le\tfrac12$ LSB of backend\\ ($N_b=N-k$ bits left)};
  \node[blk,minimum width=3.3cm] (noi) at (4.0,-1.4) {noise share of stage $k$\\ $\times\,4^{k-1}$ (input-referred)};
  \node[blk,minimum width=3.0cm] (a0) at (8.4,2.2) {$A_0\ge2^{N_b+1}/\beta$};
  \node[blk,minimum width=3.0cm] (wu) at (8.4,0.9) {$\omega_u\ge\frac{(N_b+1)\ln2}{\beta t_s}$, SR, PM};
  \node[blk,minimum width=3.0cm] (cs) at (8.4,-1.4) {$C_{s,k}$ $\Rightarrow$ $C_{Ltot}$};
  \draw[->] (spec.east) -- (err.west);
  \draw[->] (spec.east) -- (noi.west);
  \draw[->] (err.east) -- (a0.west);
  \draw[->] (err.east) -- (wu.west);
  \draw[->] (noi.east) -- (cs.west);
  \node[blk,minimum width=2.6cm] (sz) at (12.4,0.4) {$L$ from $g_mr_o$\\ $g_m=\omega_uC_{Ltot}$\\ $I_D=\frac{g_m}{g_m/I_D}$};
  \draw[->] (a0.east) -- (sz.west);
  \draw[->] (wu.east) -- (sz.west);
  \draw[->] (cs.east) -- (sz.west);
  \node[font=\scriptsize,align=center] at (4.0,-2.75) {comparator offset and noise:\\ absorbed by redundancy ($<V_{REF}/4$)};
\end{circuitikz}
\end{document}
```

**Pipeline specs** (Razavi DC Chs. 17–19; Carusone §17.4): resolution $N$, sample rate $f_S=1/T$, differential input range $\pm V_{REF}$ (so $\Delta = 2V_{REF}/2^N$), SNDR/ENOB, DNL/INL (no missing codes), latency, power. **Architecture choices** that shape the budget: bits per stage (1.5 is the default), flip-around or non-flip-around MDAC, whether there is a front-end S/H, and how fast the stages scale down.

| Pipeline spec | Element inside stage $k$ | Amplifier spec it imposes |
|---|---|---|
| DNL/INL: residue gain accurate to ½ LSB of the backend | MDAC op amp, closed loop with $\beta = C_2/(C_1+C_2+C_{in})$ | **DC gain** $A_0\ge2^{N_b+1}/\beta$ |
| $f_S$: residue settles to ½ LSB of the backend in $t_s<T/2$ | Op amp driving $C_{Ltot}$ | **GBW** $\omega_u\ge(N_b+1)\ln2/(\beta t_s)$; **slew rate** for a $V_{REF}$ step; **phase margin** checked at $\beta=1$ (sampling phase) |
| Noise share (ENOB) of stage $k$, times $4^{k-1}$ | $C_{s,k}$ ($kT/C$) and op-amp noise | **Input-referred noise** no larger than the switch $kT/C$; $C_{s,k}$ becomes the **load** of stage $k-1$ |
| Residue range $\pm V_{REF}$ | Op-amp output | **Output swing** $\pm V_{REF}$ differential (the look-ahead subtraction keeps it there) |
| $\beta$ (keep $C_{in}$ small) | Input-pair $C_{gs}$ | Input-pair $f_T$: $C_{in}\approx(C_S+C_F)/3$ at the current optimum |
| No front-end S/H: MDAC samples $V_{in}$ directly | Op amp as the virtual ground in sampling | **Closed-loop $Z_X\approx1/G_m\ll R_{on}$** of the input switch |
| Comparator offset and noise (sub-ADC) | 2 comparators per 1.5-bit stage | Nothing on the op amp. Comparator $\lvert V_{OS}\rvert<V_{REF}/4$: no preamp needed |
| Capacitor ratio $C_1/C_2$ | Unit capacitors | Not an amplifier spec. $\lvert\Delta C/C\rvert<0.4/2^N$ for DNL $<0.2$ LSB (stage 1) |
| Op-amp offset | Flip-around MDAC cancels it | **Offset** spec relaxed (non-flip-around: DNL $=V_{OS}/2$) |
| Reference ($\pm V_{REF}$) | Reference buffer, loaded by every amplifying stage at once | **Output impedance** $R_{REF}\ll R_{on}$ of the DAC switch |

$$
\boxed{A_0\ \ge\ \frac{2^{N_b+1}}{\beta}}\qquad
\boxed{\omega_u\ \ge\ \frac{(N_b+1)\ln 2}{\beta\,t_s},\quad t_s<\tfrac{T}{2}-t_{comp}}\qquad
\boxed{\beta=\frac{C_2}{C_1+C_2+C_{in}}\ \ (\text{flip-around: }\le\tfrac12)}
$$

$$
\boxed{P_{n,in}=\sum_k\frac{P_{n,k}}{4^{\,k-1}}\ \le\ \text{noise budget}}\qquad
\boxed{N_b = N-k\ \ \text{(1.5-bit stages, one effective bit each)}}
$$

> [!note]- Derivation: ½ LSB of the backend becomes $A_0$ and $\omega_u$
> After stage $k$ the backend resolves $N_b$ bits over the residue range $\pm V_{REF}$, so its LSB is $2V_{REF}/2^{N_b}$ and half of it is $V_{REF}\,2^{-N_b}$. Errors the backend cannot see (gain error, incomplete settling: [[#What Redundancy Does Not Fix]]) must stay below that.
>
> **Split it in two.** Give the static (finite-gain) error and the dynamic (settling) error half each, $V_{REF}\,2^{-(N_b+1)}$.
>
> **Static.** The closed-loop gain error is $\epsilon = -1/(\beta A_0)$ (Razavi DC Eq. 18.31 with $C_{in}$ in the divider). The residue error at the extremes is $|\epsilon|V_{REF}$ (Eq. 18.34). So $|\epsilon|\le2^{-(N_b+1)}$, i.e. $A_0\ge2^{N_b+1}/\beta$.
>
> **Dynamic.** Single-pole closed-loop settling with $\tau = 1/(\beta\omega_u)$ (Razavi DC Eq. 18.26 rewritten, see [[#Settling Time Constant]]) leaves $e^{-t_s/\tau}$ of a step that is at most $V_{REF}$. So $e^{-\beta\omega_ut_s}\le2^{-(N_b+1)}$, i.e. $\omega_u\ge(N_b+1)\ln2/(\beta t_s)$.
>
> This is the generic $A_0\ge2^{N+1}/\beta$, $\omega_u\ge(N+1)\ln2/(\beta t_s)$ of [[Data Converter Fundamentals#Spec translation]] with $N$ replaced by the bits still to be resolved. **Cross-check against Razavi DC Ex. 18.8:** for DNL $<0.2$ LSB (tighter than ½) a non-flip-around first stage needs $A_0>15(2^{N-2}-1)$, 3800 at 10 bits; the formula here gives $2^{10}/\beta = 3072$ at $\beta=\frac13$.
>
> **Noise.** The noise of stage $k$, referred to the ADC input, is divided by the gain in front of it squared, $(2^{k-1})^2 = 4^{k-1}$: the same reason comparator offsets are divided by $2^{k-1}$ (Razavi DC §18.2.2).
>
> **Time.** Half a period is not all available: the comparators must decide and the DAC switches must move before the residue starts settling (Razavi DC Fig. 17.44), and the next stage must acquire it.

| Op-amp spec | Lands on | Sizing knob |
|---|---|---|
| $A_0\ge2^{N_b+1}/\beta$ | $g_mr_o$ per device | $L$ from the $g_m/g_{ds}$ lookup; cascode ($A_0\approx(g_mr_o)^2/2$) or gain boosting for stage 1, a simple stage for late stages |
| $\omega_u$, with $C_{Ltot} = C_{s,k+1}+(1-\beta)C_F$ | $g_m = \omega_uC_{Ltot}$ of the input pair | $I_D = g_m/(g_m/I_D)$ |
| $\beta$ near $0.75\beta_{max}$ | Input-pair $C_{gs}$ | $(g_m/I_D)_1$ from the required $f_{Ti}\approx3(\mathrm{FO}\cdot G+1)\beta\omega_u$ |
| Slew for a $V_{REF}$ step | $2I_D/C_{Ltot}$ | $I_D$; pushes $g_m/I_D$ down |
| Phase margin at $\beta=1$ | Non-dominant poles | $f_T$ of cascode/mirror devices: short $L$, moderate $g_m/I_D$ |
| Output swing $\pm V_{REF}$ | $V_{D,sat}\approx2/(g_m/I_D)$ of the output stack | $g_m/I_D$ **floor** of the stack |
| Noise below $kT/C$ | Input pair $g_m$ vs. loads | High $(g_m/I_D)_1$, low $(g_m/I_D)$ on loads |

> [!tip] Remark
> Spec names are those of [[Single-Stage#Amplifier Specifications]]. The step from $g_m$, $f_T$, $g_mr_o$ targets to $W$, $L$, $I_D$ is [[gm-ID Design Methodology]]; its [[gm-ID Design Methodology#Level 3 OTAs Sized for Settling and Noise|Level 3]] sizes exactly this circuit (an SC gain stage in its amplify phase), so the numbers below plug into that recipe. The closed-loop gain error and settling derivations are owned by [[Switched-Capacitor Circuits#Spec translation]].

### Worked Example: 10-bit, 100 MS/s, Stage by Stage

> [!warning] Own arithmetic
> Razavi and Carusone give the individual formulas and single-stage numbers (quoted where used) but no full pipeline design. The chain below is computed here from those formulas. Assumptions are marked *(assumed)*; a lookup table replaces them in a real design.

**Converter spec** (the same converter as [[Data Converter Fundamentals#Spec translation|Fundamentals Worked Example C]]): $N=10$, $f_S=100$ MS/s ($T = 10$ ns), $\pm V_{REF}=\pm0.5$ V differential ($\Delta = 0.977$ mV), ENOB 9.5, 300 K. Architecture: eight 1.5-bit flip-around stages and a 2-bit flash backend (Carusone Fig. 17.21), no front-end S/H.

**1. Noise budget.** Fundamentals Ex. C allows $7.9\times10^{-8}$ V² of circuit noise. Jitter keeps its $2.65\times10^{-8}$ V². The comparator share is **free**: comparator noise is a random comparator offset and the redundancy absorbs it ([[#Level 2 Redundancy The 1.5-Bit Stage|Level 2]]). That leaves $5.3\times10^{-8}$ V² for MDAC switch and op-amp noise, all stages, input-referred.

**2. Stage scaling.** Halve the capacitors (and the op amp) for stages 2, 3, 4, then hold *(assumed)*. With scaling factor $s=\frac12$, the total is $P_1(1+\frac12+\frac14+\cdots)\approx2P_1$ ([[#Stage Scaling]]), so stage 1 gets $P_1 = 2.65\times10^{-8}$ V².

**3. Stage-1 capacitors.** Flip-around switch noise referred to the input is $2kT/C_s$ (differential, $C_s=C_1+C_2$ per side). Give the op amp an equal share *(assumed)*: $4kT/C_s\le2.65\times10^{-8}$ V², so $C_s\ge$ **0.62 pF per side**, $C_1=C_2=0.31$ pF.

**4. Feedback factor.** $\beta_{max}=\frac12$. Take $\beta = 0.75\beta_{max} = 0.375$, the current-optimal point of [[gm-ID Design Methodology#Minimum Current Maximise β²·gm/ID]]. That allots $C_{in} = C_2/\beta - C_1 - C_2 = 0.21$ pF to the input pair.

**5. Gain.** $N_b = 9$: $A_0\ge2^{10}/0.375 = $ **2731 (68.7 dB)**. A cascode with $A_0\approx(g_mr_o)^2/2$ needs $g_mr_o\ge74$ per device, which sets $L$.

**6. Settling time.** $t_s = 4$ ns of the 5 ns half period *(assumed: 1 ns for comparator decision, DAC switching, non-overlap)*. Linear settling alone: $\beta\omega_u\ge10\ln2/4\ \text{ns} = 1.73\times10^9$ rad/s. With slewing (JM piecewise model, $X = V_{REF}\frac{\beta}{2}\frac{g_m}{I_D}=1.41$ at 15 S/A): $\beta\omega_u = \frac{1}{t_s}\left[X-1+\ln\frac{X}{\epsilon_d}\right] = 1.92\times10^9$ rad/s. So $\omega_u = $ **5.1 Grad/s (815 MHz)**, loop crossover 306 MHz.

**7. Load and $g_m$.** $C_{Ltot} = C_{s,2}+(1-\beta)C_F = 0.31+0.625\times0.31 = 0.50$ pF (comparator inputs ignored). $g_m = \omega_u C_{Ltot} = $ **2.6 mS**.

**8. $g_m/I_D$ and $I_D$.** Swing: $\pm0.25$ V per side around a 0.6 V output CM at $V_{DD}=1.2$ V *(assumed)* leaves 0.35 V for two stacked devices, $V_{D,sat}\le175$ mV, so $g_m/I_D\ge11.4$ S/A. Take **15 S/A**: $I_D = 2.58/15 = $ **172 µA per input device** (344 µA tail). Check: required $f_{Ti}\approx6\beta\omega_u/2\pi = 1.8$ GHz gives $C_{gs}=g_m/\omega_{Ti}=0.22$ pF, matching the 0.21 pF allotted in step 4. Slew rate $2I_D/C_{Ltot} = 0.68$ V/ns.

**9. Repeat for every stage** (same $\beta$, $t_s$, $g_m/I_D$; $C_{s,9}$ = backend flash input, taken equal to $C_{s,8}$):

| Stage $k$ | $N_b$ | $A_0$ min | $C_s$/side (pF) | $C_{Ltot}$ (pF) | $f_u$ op amp (MHz) | $g_m$ (mS) | $I_D$ (µA) | Noise to input (V²) |
|---|---|---|---|---|---|---|---|---|
| 1 | 9 | 2731 (68.7 dB) | 0.62 | 0.50 | 815 | 2.58 | 172 | $2.7\times10^{-8}$ |
| 2 | 8 | 1365 (62.7 dB) | 0.31 | 0.25 | 741 | 1.17 | 78 | $1.3\times10^{-8}$ |
| 3 | 7 | 683 (56.7 dB) | 0.155 | 0.13 | 668 | 0.53 | 35 | $6.7\times10^{-9}$ |
| 4 | 6 | 341 (50.7 dB) | 0.078 | 0.10 | 594 | 0.38 | 25 | $3.3\times10^{-9}$ |
| 5 | 5 | 171 (44.6 dB) | 0.078 | 0.10 | 521 | 0.33 | 22 | $8\times10^{-10}$ |
| 6 | 4 | 85 (38.6 dB) | 0.078 | 0.10 | 447 | 0.29 | 19 | $2\times10^{-10}$ |
| 7 | 3 | 43 (32.6 dB) | 0.078 | 0.10 | 373 | 0.24 | 16 | $5\times10^{-11}$ |
| 8 | 2 | 21 (26.6 dB) | 0.078 | 0.10 | 300 | 0.19 | 13 | $1\times10^{-11}$ |
| **Sum** | | | | | | | **380 per side** | $5.1\times10^{-8}$ ✓ |

- **Stage 1 takes 45% of the current, stages 1–2 take 66%.** Everything after stage 4 is set by the capacitor floor, not by noise.
- **$A_0$ halves per stage** (6 dB): stage 1 needs a gain-boosted or two-stage op amp, stage 8 a single differential pair.
- **The comparators are cheap:** $V_{REF}/4 = 125$ mV of offset tolerance, against $\Delta = 0.98$ mV for a 1-bit stage 1. A bare StrongARM ([[Comparators#Level 3 The StrongARM Latch]]) with no offset cancellation.
- **Matching** is separate: $|\Delta C/C|<0.4/2^{10} = 0.04\%$ for DNL $<0.2$ LSB (Razavi DC Eq. 18.66). If the capacitor technology cannot match that at 0.31 pF, matching, not $kT/C$, sets $C_1$ ([[Capacitor]]).

```tikz title="Where the current goes in the worked example: input-pair bias current per stage (bars) and input-referred noise contribution (dots, log scale). Own arithmetic from the table above."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1cm,y=1cm]
  \draw[->] (0,0) -- (9,0) node[right] {stage $k$};
  \draw[->] (0,0) -- (0,4.0) node[above] {$I_D$ ($\mu$A)};
  \foreach \y/\l in {0/0,1/50,2/100,3/150} { \draw (0,\y) -- (-0.1,\y) node[left,font=\scriptsize] {\l}; }
  \foreach \k/\i in {1/172,2/78,3/35,4/25,5/22,6/19,7/16,8/13} {
    \draw[fill=gray!35] ({\k-0.3},0) rectangle ({\k+0.3},{\i/50});
    \node[below,font=\scriptsize] at (\k,0) {\k};
  }
  \draw[->] (9,0) -- (9,4.0) node[above] {noise (V$^2$)};
  \foreach \y/\l in {0.5/{$10^{-11}$},1.5/{$10^{-10}$},2.5/{$10^{-9}$},3.5/{$10^{-8}$}} { \draw (9,\y) -- (9.1,\y) node[right,font=\scriptsize] {\l}; }
  \foreach \k/\e in {1/-7.57,2/-7.87,3/-8.18,4/-8.48,5/-9.08,6/-9.68,7/-10.28,8/-10.89} {
    \fill ({\k},{3.5+(\e+8)}) circle (2.5pt);
  }
  \draw[dashed] (1,{3.5+0.43}) -- (2,{3.5+0.13}) -- (3,{3.5-0.18}) -- (4,{3.5-0.48}) -- (5,{3.5-1.08}) -- (6,{3.5-1.68}) -- (7,{3.5-2.28}) -- (8,{3.5-2.89});
  \node[font=\scriptsize,anchor=west] at (4.4,3.4) {capacitors halved (stages 1--4)};
  \node[font=\scriptsize,anchor=west] at (4.4,3.0) {then held: noise falls $4\times$ per stage};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> Steps 3–8 are the [[gm-ID Design Methodology#Level 3 OTAs Sized for Settling and Noise|JM single-stage OTA recipe]] with this note's numbers: noise sets $C_{Ltot}$, settling sets $g_m$, $\beta = 0.75\beta_{max}$ sets the input $f_{Ti}$, and $g_m/I_D$ turns $g_m$ into $I_D$. With FO $=C_L/C_S = 1$ and $G = C_S/C_F = 1$ (flip-around), the rule $\omega_{Ti}/(\beta\omega_u) = 3(\mathrm{FO}\cdot G+1) = 6$ is what step 8 used.

## Level 0: Binary Search Unrolled

### From SAR Loop to Cascade

```tikz title="SAR reuses one comparator and DAC for N cycles (top); a pipeline gives each binary-search step its own stage, and each stage samples its predecessor's output so it can release it (bottom). After Razavi (Data Converters) Figs. 17.2, 17.7(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.4cm,minimum height=0.8cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[blk] (sar) at (2,2.6) {comparator\\ + DAC};
  \draw[->] (0,2.6) node[left] {$V_{in}$} -- (sar);
  \draw[->] (sar.east) -- ++(0.6,0) |- ++(-0.6,0.9) -| (sar.north);
  \node[font=\scriptsize,anchor=west] at (3.4,3.2) {$N$ cycles per sample};
  \foreach \i/\x in {1/0,2/2.3,3/4.6,4/6.9} {
    \node[blk] (p\i) at (\x,0.5) {stage \i};
  }
  \draw[->] (-1.4,0.5) node[left] {$V_{in}$} -- (p1);
  \draw[->] (p1) -- (p2); \draw[->] (p2) -- (p3); \draw[->] (p3) -- (p4);
  % time table
  \foreach \c/\t in {0/{$x_3$},2.3/{$x_2$},4.6/{$x_1$},6.9/{$x_0$}} { \node[font=\scriptsize] at (\c,-0.5) {\t}; }
  \foreach \c/\t in {0/{$x_4$},2.3/{$x_3$},4.6/{$x_2$},6.9/{$x_1$}} { \node[font=\scriptsize] at (\c,-1.0) {\t}; }
  \node[font=\scriptsize,anchor=east] at (-0.8,-0.5) {clock $n$:};
  \node[font=\scriptsize,anchor=east] at (-0.8,-1.0) {clock $n{+}1$:};
  \node[font=\scriptsize,anchor=west] at (7.8,-0.75) {every stage busy on a different sample};
\end{circuitikz}
\end{document}
```

- Binary search compares $V_{in}$ with $V_{REF}/2$, then with $V_{REF}/4$ or $3V_{REF}/4$, and so on. Stage $n$ needs only the **difference** $V_{in}\pm\ldots$, not $V_{in}$ and the estimate separately: it compares the difference with zero and adds $\pm V_{REF}/2^n$.
- If each stage **samples** its input, the stage before it is free for the next sample. One stage delay ($T_{CK}/2$ to acquire, $T_{CK}/2$ to process) sets the rate; the $N$ stages set the latency (Carusone: $N$ clock cycles).
- Cost: one stage per bit, so more power and area than one SAR loop.

> [!tip] Remark
> The SAR's $V_{in}-V_{DAC}$ is the same residue ([[SAR ADCs]]). Pipelining unrolls that loop in space, the way a CPU pipeline unrolls an instruction.

### Amplify the Residue by 2

$$
\boxed{V_{res} = 2V_{in}\mp V_{REF}\ \ (\text{1 bit, differential, sign of }V_{in})}
$$

$V_{in}-V_{REF}/2^j$ has the same sign as $2^jV_{in}-V_{REF}$. So each stage can multiply by 2 and subtract the **full** $V_{REF}$ instead of a shrinking fraction:

- No fractions of $V_{REF}$ are needed anywhere.
- The signal grows along the chain, so **later stages see the earlier stages' noise and offset divided by $2^{k-1}$** and can be built smaller.

Carusone writes the same stage as $V_{i+1} = 2[V_i+(b_i-0.5)V_{ref}/2]$ for inputs in $\pm V_{ref}/2$ (Eq. 17.39), with $\hat V_{in} = V_{ref}\sum_i(b_i-0.5)2^{-i}$ (Eq. 17.40).

> [!example]- Carusone Ex. 17.6: 3-bit, 1 bit per stage, $V_{ref}=1$ V, $V_{in} = 240$ mV
> $b_1 = 1$, $V_2 = 2(240-250) = -20$ mV; $b_2 = 0$, $V_3 = 2(-20+250) = 460$ mV; $b_3 = 1$. Code 101, $\hat V_{in} = 187.5$ mV. With a 30 mV offset on the stage-2 comparator (Ex. 17.7), $b_2 = 1$ and $V_3 = -540$ mV: out of range, the code becomes 110 (375 mV). A 1-bit-per-stage pipeline cannot recover a wrong decision.

### Pipeline vs SAR

| | SAR | Pipelined |
|---|---|---|
| Conversion time | $N(t_{comp}+t_{logic})+(N-1)t_{DAC}$ | $t_{flash}+t_{MDAC}$ per stage, all stages concurrent |
| Precision element | Comparator (noise critical), high-resolution DAC | Op amp: gain, settling, swing, noise, power |
| DAC | $N$-bit, must be linear to $N$ bits | $\le5$ bits per stage, still must be linear |
| Reference settling | Every cycle: $N-1$ times per sample | Once per stage per sample |
| Character | "Comparator-centric" | "Op-amp-centric" |

(Razavi DC Table 17.1, §17.9.)

## Level 1: The Stage: MDAC and Residue

### Gain by a Capacitor Ratio

```tikz title="Non-flip-around (left): sample on C1, then switch its left plate to K*V_REF; gain -C1/C2 = -2. Flip-around (right): sample on C1 and C2, flip C2 around the op amp, switch C1 to K*V_REF; gain 1 + C1/C2 = 2. Single-ended view of differential circuits. After Razavi (Data Converters) Figs. 17.19(d), 17.24, 17.29, 17.31."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % non flip-around (amplify phase)
  \draw (3.2,0) node[op amp](A){};
  \draw (A.+) -- ++(-0.3,0) -- ++(0,-0.6) node[ground]{};
  \draw (A.-) -- (1.6,0.5) coordinate(X) node[circ]{};
  \node[above left,font=\scriptsize] at (X) {$X$};
  \draw (X) to[C,l_=$C_1{=}2C$] (-0.2,0.5) coordinate(a);
  \draw (a) -- ++(-0.3,0) node[ocirc]{} node[left,font=\scriptsize] {$KV_{REF}$};
  \draw (X) -- (1.6,1.7) to[C,l=$C_2{=}C$] (4.6,1.7) -- (4.6,0) -- (A.out);
  \draw (A.out) -- (5.0,0) node[ocirc]{} node[right] {$V_{res}$};
  \node[font=\scriptsize,align=center] at (2.2,-2.4) {non-flip-around\\ $K=\pm\tfrac12$, $\beta=\tfrac{C_2}{C_1+C_2+C_{in}}\approx\tfrac13$};
  % flip-around
  \begin{scope}[xshift=8.4cm]
    \draw (3.2,0) node[op amp](B){};
    \draw (B.+) -- ++(-0.3,0) -- ++(0,-0.6) node[ground]{};
    \draw (B.-) -- (1.6,0.5) coordinate(Y) node[circ]{};
    \node[above left,font=\scriptsize] at (Y) {$X$};
    \draw (Y) to[C,l_=$C_1{=}C$] (-0.2,0.5) coordinate(b);
    \draw (b) -- ++(-0.3,0) node[ocirc]{} node[left,font=\scriptsize] {$KV_{REF}$};
    \draw (Y) -- (1.6,1.7) to[C,l=$C_2{=}C$] (4.6,1.7) -- (4.6,0) -- (B.out);
    \draw (B.out) -- (5.0,0) node[ocirc]{} node[right] {$V_{res}$};
    \node[font=\scriptsize,align=center] at (2.2,-2.4) {flip-around ($C_2$ also sampled $V_{in}$)\\ $K=\pm1,0$, $\beta=\tfrac{C_2}{C_1+C_2+C_{in}}\approx\tfrac12$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{non-flip: } V_{res} = -\frac{C_1}{C_2}\left(KV_{REF}-V_{in}\right) = 2V_{in}\mp V_{REF}}\qquad
\boxed{\text{flip-around: } V_{res} = \left(1+\frac{C_1}{C_2}\right)V_{in}-\frac{C_1}{C_2}KV_{REF} = 2V_{in}\mp V_{REF}}
$$

- **Sampling phase:** the op amp is reset into unity feedback (switch $S_F$), so $X$ is a virtual ground, $V_{in}$ lands on the sampling capacitor(s), and any old charge on $C_2$ is cleared.
- **Amplification phase:** the left plate of $C_1$ jumps from $V_{in}$ to $KV_{REF}$; charge conservation at $X$ moves the difference onto $C_2$. The gain is a **capacitor ratio**, accurate because capacitors match to well below 1%.
- A settled capacitor carries no current, so the op amp's $R_{out}$ does not load it: the op amp keeps its full open-loop gain (unlike resistive feedback, Razavi DC §17.3).
- The comparator (1-bit sub-ADC) picks $K$; the switch to $\pm V_{REF}$ is a 1-bit DAC. Sample + DAC + subtract + ×2 in one circuit is the **multiplying DAC (MDAC)**.

> [!tip] Remark
> The flip-around stage is the $\times2$ circuit of [[Switched-Capacitor Circuits#Multiply-by-Two]] with $C_1$'s plate switched to $KV_{REF}$ instead of ground; the non-flip-around stage is the [[Switched-Capacitor Circuits#Noninverting Amplifier]] with $C_1 = 2C_2$. Their gain error and $\tau$ formulas carry over unchanged.

| | Non-flip-around | Flip-around |
|---|---|---|
| Capacitors | $C_1 = 2C_2$ | $C_1 = C_2$ |
| References | $\pm V_{REF}/2$ (a ladder, which must settle) | $\pm V_{REF}$ directly |
| $\beta$ (no $C_{in}$) | $\frac13$ | $\frac12$ |
| Gain error | $-3/A_0$ | $-2/A_0$ |
| Op-amp offset | Adds to the residue | Cancelled |
| Sampled op-amp noise | Adds | Cancelled |
| Switch $kT/C$ at the output | $3kT/C_2$ | $2kT/C_1$ |

The flip-around topology wins every row (Razavi DC Ch. 18). Carusone's standard 1.5-bit stage (Fig. 17.22, after Sutarja 1988) is a flip-around stage whose sampling capacitor $2C$ is split into $C$ (flipped into feedback) and two $C/2$ (the DAC).

> [!example]- Razavi DC Ex. 17.15: a mistaken $C_1 = 2C_2$ in a flip-around MDAC
> After the flip, $V_{out} = V_{in}$; switching $C_1$ from $V_{in}$ to 0 adds $-2(0-V_{in})$, so $V_{out} = 3V_{in}$, then $\mp2V_{REF}$. The residue $3V_{in}\mp2V_{REF}$ over- and undershoots badly around $V_{in}=0$. A wrong ratio is a gain error; nothing digital repairs it.

### The Residue Plot

```tikz title="Residue of a 1-bit stage (left) and two cascaded 1-bit stages (right). Each stage doubles the slope and halves the search window; the zero crossings are the decision points of the next comparator. After Razavi (Data Converters) Figs. 17.28, 17.38."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.6cm,y=1.1cm]
  \foreach \ox/\lab in {0/{$V_{res1}$},3.4/{$V_{res2}$}} {
    \begin{scope}[xshift=\ox*1.6cm]
      \draw[->] (-1.25,0) -- (1.35,0) node[right] {$V_{in}$};
      \draw[->] (0,-1.3) -- (0,1.45) node[above] {\lab};
      \draw[dashed,gray] (-1,1) -- (1,1); \draw[dashed,gray] (-1,-1) -- (1,-1);
      \node[left,font=\scriptsize] at (-1,1) {$+V_{REF}$};
      \node[left,font=\scriptsize] at (-1,-1) {$-V_{REF}$};
      \node[below,font=\scriptsize] at (-1,-1.05) {$-V_{REF}$};
      \node[below,font=\scriptsize] at (1,-1.05) {$+V_{REF}$};
    \end{scope}
  }
  \draw[thick] (-1,-1) -- (0,1); \draw[thick] (0,-1) -- (1,1);
  \node[font=\scriptsize] at (-0.75,0.55) {$2V_{in}{+}V_{REF}$};
  \node[font=\scriptsize] at (0.75,-0.55) {$2V_{in}{-}V_{REF}$};
  \begin{scope}[xshift=3.4*1.6cm]
    \foreach \a in {-1,-0.5,0,0.5} { \draw[thick] (\a,-1) -- ({\a+0.5},1); }
    \node[font=\scriptsize,align=center] at (0.1,-1.85) {slope 4, zero crossings at $\pm\tfrac14,\pm\tfrac34\,V_{REF}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Look-ahead:** the comparator picks $\pm V_{REF}$ before the amplification, so the output stays within $\pm V_{REF}$ although $2V_{in}$ could reach $\pm2V_{REF}$. The op amp never needs more than $\pm V_{REF}$ of swing.
- An $N$-bit pipeline needs $N-1$ MDACs and one final comparator (no residue is needed after the last decision).
- **Every static stage error is a distortion of this plot**, and reading it off the plot is the method of Level 3.

> [!example]- Razavi DC Fig. 17.39: residues in the time domain
> $V_{REF} = 16$ LSB, $V_{in} = 10.7$ LSB. $V_{res1} = 2(10.7)-16 = 5.4$; $V_{res2} = 2(5.4)-16 = -5.2$; $V_{res3} = 2(-5.2)+16 = 5.6$ LSB. Each output is reset for the half cycle in which its stage samples.

### Timing: One Comparator Decision per Half Cycle

The stage's half period holds, in sequence: the comparator decision, the DAC switch turning on, the residue settling, and the next stage acquiring it (Razavi DC Fig. 17.44). A flash ADC can take its next sample once the latches have saved the decision; a pipeline stage cannot, so **pipelines are slower than flash**, and the time left for op-amp settling is $t_s<T/2-t_{comp}$.

## Level 2: Redundancy: The 1.5-Bit Stage

### Why One Bit per Stage Fails

```tikz title="1-bit stage with comparator offset V_OS (left): the residue overshoots +V_REF, the next stages saturate, and the error is permanent. 1.5-bit stage (right): two comparators at +-V_REF/4 and a middle segment keep the residue within +-V_REF/2 nominally, so an offset up to V_REF/4 stays in range. After Razavi (Data Converters) Fig. 19.11 and Carusone Fig. 17.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.7cm,y=1.1cm]
  \foreach \ox in {0,3.5} {
    \begin{scope}[xshift=\ox*1.7cm]
      \draw[->] (-1.25,0) -- (1.35,0) node[right] {$V_{in}$};
      \draw[->] (0,-1.45) -- (0,1.55) node[above] {$V_{res}$};
      \draw[dashed,gray] (-1.1,1) -- (1.1,1); \draw[dashed,gray] (-1.1,-1) -- (1.1,-1);
      \node[left,font=\scriptsize] at (-1.1,1) {$+V_{REF}$};
      \node[left,font=\scriptsize] at (-1.1,-1) {$-V_{REF}$};
    \end{scope}
  }
  % 1-bit with offset 0.15
  \draw[thick] (-1,-1) -- (0.15,1.3); \draw[thick] (0.15,-0.7) -- (1,1);
  \draw[dotted] (0.15,1.3) -- (0.15,-0.7);
  \fill[gray!40,opacity=0.6] (-0.2,1) rectangle (0.17,1.3);
  \node[font=\scriptsize,anchor=west] at (0.2,1.35) {overrange $2V_{OS}$: lost};
  \node[above right,font=\scriptsize] at (0.15,0) {$V_{OS}$};
  % 1.5-bit
  \begin{scope}[xshift=3.5*1.7cm]
    \draw[thick] (-1,-1) -- (-0.25,0.5);
    \draw[thick] (-0.25,-0.5) -- (0.25,0.5);
    \draw[thick] (0.25,-0.5) -- (1,1);
    \draw[dashed,gray] (-1.1,0.5) -- (1.1,0.5); \draw[dashed,gray] (-1.1,-0.5) -- (1.1,-0.5);
    \node[right,font=\scriptsize] at (1.1,0.5) {$+V_{REF}/2$};
    \node[right,font=\scriptsize] at (1.1,-0.5) {$-V_{REF}/2$};
    \draw[thin] (0.25,0.5) -- (0.4,0.8);
    \draw[thin,dotted] (0.4,0.8) -- (0.4,-0.2);
    \draw[->] (0.95,1.3) node[right,font=\scriptsize] {threshold moved by $V_{OS}$} -- (0.42,0.82);
    \node[font=\scriptsize,align=center] at (0,-1.75) {still inside $\pm V_{REF}$ if $|V_{OS}|<V_{REF}/4$};
  \end{scope}
  \node[font=\scriptsize,align=center] at (0,-1.75) {1 bit/stage: needs $|V_{OS}|<1$ LSB};
\end{circuitikz}
\end{document}
```

**1-bit stage:** a comparator offset moves the transition, and the residue overshoots $\pm V_{REF}$ by $2V_{OS}$. The backend saturates and the code is wrong.

$$
\boxed{\text{1 bit/stage: DNL} = \frac{V_{OS,k}}{2^{k-1}},\quad\text{missing code if }|V_{OS,1}|>1\text{ LSB}}
$$

Carusone puts it as a 10 mV, 20 mV, 40 mV, … comparator accuracy for a 10 mV-LSB converter (§17.4.1): "the one bit per stage pipeline architecture is rarely used".

> [!note]- Derivation: digitizing a residue (Razavi DC §18.1.2, §18.2)
> To get the ADC characteristic with stage 1 as the only non-ideal stage, model everything behind it as an ideal quantizer of $\pm V_{REF}$ (Fig. 18.5):
> 1. Plot $V_{res1}$ versus $V_{in}$.
> 2. Pass it through the backend's staircase: the backend output is a "digitized residue", sawtooth-shaped. Anything beyond $\pm V_{REF}$ **saturates**.
> 3. Add the stage-1 comparator bit with its weight ($\pm2^{N-1}$ LSB): shift the left half down and the right half up.
>
> **Comparator offset in stage 1** (4-bit example: $\pm V_{REF} = \pm400$ mV, 1 LSB = 50 mV, $V_{OS} = 90$ mV): the transition at 0 moves to 90 mV, DNL = INL = 90 mV, and code 0 is missing because DNL $>1$ LSB. No gain error (end points unchanged). A missing code is avoided only if $|V_{OS}|<1$ LSB.
>
> **Comparator offset in stage 2** ($V_{OS}=90$ mV): it acts on $V_{res1}$, which is $2V_{in}+V_{REF}$, so the transition in $V_{in}$ moves by only $V_{OS}/2 = 45$ mV (from $-200$ to $-155$ mV), and $V_{res2}$ overshoots by 180 mV. DNL = INL = 45 mV. In general stage $k$'s offset is divided by $2^{k-1}$.

### The 1.5-Bit Stage

$$
\boxed{V_{res} = \begin{cases}2V_{in}+V_{REF} & V_{in}<-V_{REF}/4\\ 2V_{in} & |V_{in}|<V_{REF}/4\\ 2V_{in}-V_{REF} & V_{in}>+V_{REF}/4\end{cases}}\qquad\boxed{|V_{OS}|<\frac{V_{REF}}{4}\ \text{is corrected}}
$$

- **Two comparators** at $\pm V_{REF}/4$ give **three** decisions ($\log_2 3\approx1.58$ bits: "1.5 bits"). The middle range amplifies without subtracting.
- Nominally the residue stays within $\pm V_{REF}/2$. With offset it reaches $\pm(V_{REF}/2+2V_{OS})$, still inside $\pm V_{REF}$ until $|V_{OS}| = V_{REF}/4$.
- The comparator outputs form a thermometer code $A_2A_1\in\{00,10,11\}$; a decoder switches $C_1$ to $-V_{REF}$, 0 or $+V_{REF}$ (Razavi DC Fig. 19.12). The last stage is a single comparator (Razavi) or a 2-bit flash (Carusone).
- The cost is one extra comparator per stage and a little decoding delay: "much more popular than the 1-bit counterpart".

> [!important] What redundancy buys
> A wrong decision changes the DAC value by $V_{REF}/2$ (input-referred) and the residue by $\mp V_{REF}$ in exactly the opposite direction, so the **next** stage's code carries the correction. Every source that only moves a **decision threshold** is absorbed: comparator offset, comparator noise, comparator/sampler timing skew. The comparators become cheap; the op amp does not.

> [!tip] Remark
> This is the same overlap/redundancy idea as in the hybrid flash/SAR converter, where 1 bit of overlap buys half a flash LSB of offset tolerance ([[SAR ADCs]] owns that case). Comparator noise turning into a decision error is [[Comparators#Noise Turns Into an Error Probability]]; here such errors are corrected, so the comparator spec is set by the $V_{REF}/4$ window, not by the converter LSB.

### Digital Correction: Add with One Bit of Overlap

```tikz title="Digital correction for a 3-bit pipeline of two 1.5-bit stages and a 1-bit last stage: each stage's 2-bit code is added with a 1-bit overlap (shifted right by one bit relative to the previous). Razavi (Data Converters) Ex. 19.6, V_in = +1.2 LSB."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{bit/.style={draw,minimum width=0.55cm,minimum height=0.5cm,font=\scriptsize}}
  \node[font=\scriptsize,anchor=east] at (-0.3,1.5) {stage 1 ($V_{in}>V_{REF}/4$): $D_{2,1}D_{1,1}$};
  \node[bit] at (0.3,1.5) {1}; \node[bit] at (0.85,1.5) {0};
  \node[font=\scriptsize,anchor=east] at (-0.3,0.9) {stage 2 ($V_{res1}=-1.6$ LSB): $D_{2,2}D_{1,2}$};
  \node[bit] at (0.85,0.9) {0}; \node[bit] at (1.4,0.9) {0};
  \node[font=\scriptsize,anchor=east] at (-0.3,0.3) {stage 3 ($V_{res2}=+0.8$ LSB): $D_{1,3}$};
  \node[bit] at (1.4,0.3) {1};
  \draw (0,-0.05) -- (1.7,-0.05);
  \node[font=\scriptsize,anchor=east] at (-0.3,-0.4) {sum $=D_{out}$};
  \node[bit,fill=gray!20] at (0.3,-0.4) {1}; \node[bit,fill=gray!20] at (0.85,-0.4) {0}; \node[bit,fill=gray!20] at (1.4,-0.4) {1};
  \node[font=\scriptsize,anchor=west] at (2.0,-0.4) {$=5$};
  \node[font=\scriptsize,anchor=west,align=left] at (2.0,1.0) {thermometer $A_2A_1=00,10,11$\\ $\to$ binary $00,01,10$};
\end{circuitikz}
\end{document}
```

$$
\boxed{D_{out} = \sum_{k=1}^{M} d_k\,2^{\,M-k+n_b-1} + d_b,\qquad d_k = A_{2,k}+A_{1,k}\in\{0,1,2\}}
$$

$M$ redundant stages, each contributing $d_k$ (how many of its two comparators fired: thermometer 00, 10, 11 read as binary 00, 01, 10), and a backend of $n_b$ bits with code $d_b$. In binary: **add the 2-bit stage codes, each shifted one bit right of the previous**, so adjacent stages overlap by one bit; that overlap is where a wrong decision is cancelled. Shift registers of decreasing length first align one sample's codes in time (Carusone Fig. 17.21).

> [!note]- Detail: where the formula comes from
> This compact form is written here; it reproduces both books' examples. Razavi DC Ex. 19.6 ($M=2$, $n_b=1$): $d = 2,0,1$ gives $2\cdot2+0+1 = 5$; $d = 0,2,0$ gives 2; $d = 2,2,1$ gives 7. Carusone Ex. 17.8 ($M=1$, $n_b=2$): $d_1 = 2$, $d_b = 01$ gives $2\cdot2+1 = 5$ (101). Carusone's analog form is Eq. 17.42, $\hat V_{in}$ as a weighted sum of $(b_{i,0}+b_{i,1}-1)2^{-i}$ (the $-1$ centres each stage's $d_k$ on zero).

> [!example]- Carusone Ex. 17.8: the offset is corrected
> 3 bits, $V_{ref} = 1$ V (stage input range $\pm V_{ref}/2$, thresholds $\pm V_{ref}/8$), $V_{in} = 150$ mV. Ideal: $b_{1,1}b_{1,0} = 11$, DAC $= V_{ref}/4$, $V_2 = 2(150-250) = -200$ mV, final 2-bit flash gives 01. Decoder: $1+1$ shifted, plus 01, gives **101**.
> With a 30 mV offset on stage 1's upper comparator: $b_{1,1} = 0$, DAC $=0$, $V_2 = +300$ mV, flash gives 11. Decoder: $0+1$, plus 11, gives **101**. Same output.

### What Redundancy Does Not Fix

> [!important] Only vertical shifts of the residue plot are tolerated
> Finite op-amp gain and capacitor mismatch change the **slope** of the residue (its gain), so the backend digitizes a residue whose full scale no longer matches its own. Those errors, MDAC nonlinearity, DAC-level errors and MDAC noise appear in $V_{i+1}$ but not in the stage's code, and nothing digital removes them (Razavi DC §19.2.3; Carusone §17.4.2). **That is why the op-amp specs in the [[#Spec translation]] carry the full ½-LSB-of-backend accuracy.**

### Thresholds Without a Ladder

$$
\boxed{V_X = -V_{in}+V_{REF}\frac{C_{1a}}{C_{1a}+C_{1b}}}
$$

Split each comparator's sampling capacitor into $C_{1a}$, $C_{1b}$, sample $V_{in}$ on both, then switch their plates to $V_{REF}$ and 0. With $C_{1b} = 3C_{1a}$ the threshold is $V_{REF}/4$, with no static ladder current. Keep $C_{1a}+C_{1b}$ 5 to 10× the comparator input capacitance, or it attenuates (Razavi DC §19.2.4). The threshold may be imprecise: it is a redundancy-absorbed error.

## Level 3: Stage Errors on the Residue Plot

```tikz title="The four static signatures on a 1-bit residue: comparator offset moves the transition sideways; op-amp offset lifts the whole plot; finite gain or non-flip capacitor mismatch rotates each segment about its zero crossing (pinned at +-V_REF/2); flip-around capacitor mismatch rotates it about the end points (pinned at +-V_REF). After Razavi (Data Converters) Figs. 17.42, 18.15, 18.30, 18.40, 18.43."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.1cm,y=0.8cm]
  \foreach \ox/\t in {0/{comparator offset},3.2/{op-amp offset (non-flip)},6.4/{gain error ($A_0$, $\Delta C$ non-flip)},9.6/{$\Delta C$ (flip-around)}} {
    \begin{scope}[xshift=\ox*1.1cm]
      \draw[->] (-1.2,0) -- (1.3,0);
      \draw[->] (0,-1.4) -- (0,1.5);
      \draw[dashed,gray] (-1,-1) -- (0,1); \draw[dashed,gray] (0,-1) -- (1,1);
      \node[font=\scriptsize] at (0,-1.85) {\t};
    \end{scope}
  }
  \draw[thick] (-1,-1) -- (0.2,1.4); \draw[thick] (0.2,-0.6) -- (1,1);
  \begin{scope}[xshift=3.2*1.1cm]
    \draw[thick] (-1,-0.7) -- (0,1.3); \draw[thick] (0,-0.7) -- (1,1.3);
  \end{scope}
  \begin{scope}[xshift=6.4*1.1cm]
    \draw[thick] (-1,-0.8) -- (0,0.8); \draw[thick] (0,-0.8) -- (1,0.8);
    \fill (-0.5,0) circle (1.5pt); \fill (0.5,0) circle (1.5pt);
  \end{scope}
  \begin{scope}[xshift=9.6*1.1cm]
    \draw[thick] (-1,-1) -- (0,1.25); \draw[thick] (0,-1.25) -- (1,1);
    \fill (-1,-1) circle (1.5pt); \fill (1,1) circle (1.5pt);
  \end{scope}
\end{circuitikz}
\end{document}
```

| Error | Residue signature | DNL / INL (1-bit stage 1, other stages ideal) | Fixed by |
|---|---|---|---|
| Comparator offset $V_{OS}$ | Transition moves by $V_{OS}$; overrange $2V_{OS}$ | DNL = INL = $V_{OS}$ (stage $k$: $V_{OS}/2^{k-1}$) | **Redundancy** |
| Op-amp offset (non-flip) | Whole plot shifts up by $V_{OS}$ | DNL = $V_{OS}/2$ | Flip-around (cancels), redundancy |
| Finite $A_0$ | Rotation about $\pm V_{REF}/2$; residue $(1+\epsilon)(2V_{in}\pm V_{REF})$ | $\lvert\mathrm{DNL}\rvert = \frac{\epsilon}{2(1+\epsilon)}(V_{REF}-2\Delta)$; ramp-shaped INL | **Nothing** but $A_0$ (or calibration) |
| Capacitor mismatch | Rotation; pinned at $\pm V_{REF}/2$ (non-flip) or $\pm V_{REF}$ (flip) | DNL $=(\Delta C/C)V_{REF}$ | **Nothing** but matching (or calibration) |
| Charge injection | $S_F$ charge: constant offset $-Q_F/C_2$ | Common-mode in a differential stage | Switching order: $S_F$ off first |
| Comparator/sampler timing skew | Like comparator offset, $V_0\omega_1\Delta t$ | Like comparator offset | Redundancy |

### Comparator Offset

The 1-bit case is in [[#Why One Bit per Stage Fails]]; the 1.5-bit stage absorbs up to $V_{REF}/4$. Nothing more to remember.

### Op-Amp Offset

$$
\boxed{\text{flip-around: cancelled};\qquad\text{non-flip: } V_{res} = 2V_{in}\pm V_{REF}+V_{OS},\ \ \mathrm{DNL}=\frac{V_{OS}}{2}}
$$

- **Flip-around:** in sampling the op amp sits in unity feedback, so $V_X\approx V_{OS}$ is stored on $C_1$ and $C_2$. In amplification it still holds $V_X\approx V_{OS}$, so neither charge changes and $V_{out}$ carries no offset (Razavi DC §18.3).
- **Non-flip-around:** $V_{OS}$ is stored on $C_1$ only; $C_2$ was reset, so $V_{out}\approx V_{OS}$ appears in the residue. Example: $V_{OS} = 102$ mV with $\pm400$ mV gives DNL = 51 mV (Razavi DC Fig. 18.15).

> [!tip] Remark
> This is the offset-storing trick of [[Switched-Capacitor Circuits#Correlated Double Sampling and Offset Cancellation]]: the flip-around MDAC gets it for free because the same capacitors sample the signal and the offset.

### Charge Injection

- A switch whose plate moves from one **driven** (low-impedance) node to another injects charge that is undone when the node is driven again: the input switches $S_1$, $S_2$ and the DAC switches do no harm.
- The feedback/reset switch $S_F$ is the exception: its charge at the virtual ground $X$ has nowhere to go but $C_2$, giving a constant offset $-Q_F/C_2$, common-mode in a differential stage.
- **$S_F$ must turn off before the sampling switch.** Reversed, the input-dependent charge of $S_1$ is trapped on $C_1$ and transferred to $C_2$: offset, gain error and distortion (Razavi DC §18.4).

> [!tip] Remark
> This is bottom-plate sampling with advanced clocks, [[Sampling Circuits#Bottom-Plate Sampling]]: the switch at the virtual ground opens first and freezes a signal-independent charge.

### Switch kT/C

$$
\boxed{\text{non-flip: } \overline{V^2_{n,out}} = \frac{kT}{C_2}+\frac{kT}{C_1}\left(\frac{C_1}{C_2}\right)^2 = \frac{3kT}{C_2}}\qquad\boxed{\text{flip-around: } \overline{V^2_{n,out}} = \frac{2kT}{C_1}}
$$

(single-ended; Razavi DC Eqs. 18.11, 18.12). Non-flip: $S_F$ freezes $kT/C_2$; the grounding switch adds $kT/C_1$ at $A$, amplified by $(C_1/C_2)^2$. Flip-around: each of the equal capacitors holds $kT/C_1$, uncorrelated. Divided by the gain² of 4: flip-around gives $kT/(2C_1) = kT/(C_1+C_2)$, exactly $kT$ over its total sampling capacitance; non-flip gives $3kT/(4C_2)$, which is $1.5\times kT/C_1$, its total sampling capacitance (own arithmetic).

> [!tip] Remark
> $kT/C$ itself is owned by [[Noise#kT/C Noise]] and [[Sampling Circuits#kT/C Noise]]; here only the switching sequence decides which capacitors keep it.

### Capacitor Mismatch

$$
\boxed{\text{non-flip: } V_{res}\approx\left(1-\frac{\Delta C}{C}\right)(2V_{in}+V_{REF})}\qquad\boxed{\lvert\mathrm{DNL}_{max}\rvert = \frac{\Delta C}{C}V_{REF}\ \Rightarrow\ \left|\frac{\Delta C}{C}\right|<\frac{0.4}{2^N}\ \text{for DNL}<0.2\text{ LSB}}
$$

- Mismatch is a gain error and looks exactly like finite $A_0$: the two budgets merge.
- $\Delta C/C<0$: residue overranges near $V_{in}=0$, output saturates over a band of inputs (DNL). $\Delta C/C>0$: residue underranges, missing codes at $-V_{REF}$, 0, $+V_{REF}$.
- Flip-around ($C_1 = C$, $C_2 = C+\Delta C$): $V_{res} = V_{in}+\frac{C_1}{C_2}(V_{in}\mp V_{REF})$ is pinned at $\pm V_{REF}$ instead; the budget is the same.
- **12 bits needs 0.01%** (Razavi DC Ex. 18.10). The bound halves per bit; since mismatch falls only as $1/\sqrt{\text{area}}$, each extra bit costs about 4× the first-stage capacitor area (Zettelkasten 24p1; [[Nonlinearity and Mismatch]]).

> [!note]- Derivation: DNL from mismatch (Razavi DC Ex. 18.10)
> With $\Delta C<0$ the left segment reaches $+V_{REF}$ at $V_{in1}$ where $(1-\Delta C/C)(2V_{in1}+V_{REF}) = V_{REF}$, i.e. $V_{in1}\approx\frac{\Delta C}{2C}V_{REF}$; symmetrically on the right. The output sits at $10\cdots0$ from $V_{in1}$ to $V_{in2}$, a DNL of $2\cdot\frac{\Delta C}{2C}V_{REF}$. Setting it below $0.2\cdot2V_{REF}/2^N$ gives $|\Delta C/C|<0.4/2^N$, independent of $V_{REF}$.

### Reference Bounce and Timing Skew

- **Reference:** every amplifying stage switches capacitors onto $\pm V_{REF}$ in the same phase, so the reference buffer sees several transient loads at once (a SAR sees one). Keep $R_{REF}$ well below the DAC switch $R_{on}$; stage scaling also relieves it (Razavi DC §18.8). The bounce model and buffer are [[DACs#CDAC Reference Bounce and Its Buffer]].
- **Timing skew** between the comparator path and the MDAC sampling capacitor: on $V_0\cos\omega_1t$ the two disagree by up to $V_0\omega_1\Delta t$.

$$
\boxed{V_0\,\omega_1\,\Delta t<0.2\text{ LSB}\ \Rightarrow\ \Delta t<\frac{0.2/2^{N-1}}{\omega_1}\quad\text{(no redundancy)}}\qquad\boxed{V_{OS}+V_0\omega_1\Delta t<\frac{V_{REF}}{4}\quad\text{(1.5-bit)}}
$$

10 bits at 5 GHz without redundancy: $\Delta t<12$ fs (Razavi DC Ex. 18.11, §18.9). With redundancy the skew joins the offset in the $V_{REF}/4$ window, which is why a **SHA-less** pipeline (MDAC samples the input directly) is practical. Making the comparator's sampling network a scaled copy of the MDAC's (switch width ∝ capacitance) cuts $\Delta t$ (Razavi DC Fig. 19.6).

## Level 4: Op-Amp Limits: Settling, Gain, Noise

### Sampling Phase: The Virtual Ground Must Be Low-Z

$$
\boxed{Z_X\approx\frac{R_{out}}{1+A_0}\approx\frac{1}{G_m}\ll R_{on,S_1}}
$$

Without a front-end S/H the MDAC tracks $V_{in}$ through $S_1$ into the op amp's virtual ground. The closed-loop impedance at $X$ is $1/G_m$ (both topologies, since the flip-around stage has twice the sampling capacitance). For a two-stage op amp $Z_X$ rises above the open-loop pole $\omega_p$ like an inductor (zero at $\omega_p$, pole at $(1+A_0)\omega_p$), so designs short $X$ to a CM voltage with a switch during sampling (Razavi DC Fig. 18.22(c)).

> [!tip] Remark
> $R_{out}/(1+A_0)\approx1/G_m$ is the closed-loop output resistance of [[Feedback]]; the inductive rise is the one-pole loop gain falling with frequency.

### Settling Time Constant

```tikz title="Amplify-phase small-signal model: the op amp's G_m appears divided by beta, driving C_L in parallel with C2 in series with (C1 + C_in). The step first jumps the wrong way through the capacitors (RHP zero), then settles with tau. After Razavi (Data Converters) Figs. 18.24(c), 18.25(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} to[R] (4.2,0) node[circ]{} -- (5.2,0) node[ocirc]{} node[right]{$V_{out}$};
  \node at (2.1,1.1) {$\dfrac{1}{\beta G_m}=\dfrac{C_1+C_2+C_{in}}{C_2G_m}$};
  \draw (4.2,0) to[C,l_={$C_L+\dfrac{C_2(C_1+C_{in})}{C_1+C_2+C_{in}}$}] (4.2,-2) node[ground]{};
  \begin{scope}[xshift=8.2cm,yshift=-1.6cm]
    \draw[->] (0,1.2) -- (4.2,1.2) node[right] {$t$};
    \draw[->] (0,-0.4) -- (0,2.6) node[above] {$V_{out}$};
    \draw[thick] (0,1.2) -- (0,1.9);
    \draw[thick,domain=0:4,samples=40] plot (\x,{-0.1+2.0*exp(-1.4*\x)});
    \draw[dashed] (0,-0.1) -- (4,-0.1) node[right,font=\scriptsize] {$-\tfrac{C_1}{C_2}V_1$};
    \node[font=\scriptsize,anchor=west] at (0.1,2.15) {jump $V_a$ (RHP zero)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\tau = \frac{C_1+C_2+C_{in}}{C_2\,G_m}\left[C_L+\frac{C_2(C_1+C_{in})}{C_1+C_2+C_{in}}\right] = \frac{C_{L,eff}}{\beta G_m} = \frac{1}{\beta\omega_u}}
$$

- The op amp's transconductance appears divided by $\beta$; the load is $C_L$ (the next stage's sampling capacitors) plus $C_2$ in series with $C_1+C_{in}$.
- **The step response jumps first** through the capacitor network, to $V_a$ (Razavi DC Eq. 18.27), then settles from there: the jump lengthens settling.
- **Compensate for $\beta = 1$:** in the sampling phase the op amp is in unity feedback with a different load, so its phase margin is lowest there.
- A two-stage op amp's internal pole makes the response second order; simulate.

> [!tip] Remark
> This is the [[Switched-Capacitor Circuits#Noninverting Amplifier]] time constant (same circuit, same equation). Settling budgets with slewing and the second pole are in [[gm-ID Design Methodology#Slewing in the Sizing Loop]] and [[gm-ID Design Methodology#The Second Pole]]; the slew-then-settle split is [[Operational Amplifiers#Slew Rate]].

### Finite Gain

$$
\boxed{\frac{V_{out}}{V_{in}} = -\frac{C_1/C_2}{1+\frac{1}{A_0}\left(1+\frac{C_1}{C_2}\right)},\qquad\epsilon\approx-\frac{1}{\beta A_0}=\begin{cases}-3/A_0&\text{non-flip}\\-2/A_0&\text{flip-around}\end{cases}}
$$

$$
\boxed{V_{res} = (1+\epsilon)(2V_{in}\pm V_{REF})}\qquad\boxed{|\epsilon|<\frac{0.2}{2^{N-2}-1}\ \Rightarrow\ A_0>15(2^{N-2}-1)\ \text{(non-flip, DNL}<0.2\text{ LSB)}}
$$

- The error multiplies the reference term too, so the residue rotates about its zero crossings $\pm V_{REF}/2$ and misses $\pm V_{REF}$ at the ends.
- Choosing $C_1/C_2$ slightly above 2 to pre-correct does not work: $A_0$ varies too much with PVT.
- **10 bits: $A_0>3800$** (non-flip, Razavi DC Ex. 18.8); 0.1% gain error alone needs $A_0>3000$. Required gain **doubles per bit**: high-resolution pipelines are an op-amp problem.
- A gain error $\epsilon<0$ stretches every LSB, giving a ramp-shaped INL; a large one ($\epsilon=-0.3$, Razavi DC Fig. 18.31) leaves codes missing at the ends and at mid-scale.

> [!tip] Remark
> $1/(\beta A_0)$ is the loop-gain error of [[Operational Amplifiers#Gain Sets the Gain Error]]. The flip-around stage's advantage is only its larger $\beta$.

### Op-Amp Noise

$$
\boxed{\overline{V^2_{n,in}} = \overline{V_n^2}\,\frac{G_m}{4C_1}}\qquad\boxed{\text{non-flip: } \overline{V^2_{n,MDAC}} = \frac{13}{4}\frac{G_m}{C_1}\overline{V_n^2}}\qquad\boxed{\text{flip-around: } \overline{V^2_{n,MDAC}} = \frac{G_m}{C_1}\overline{V_n^2}\ \ (C_1=C_2)}
$$

- The op amp's white input-noise density $\overline{V_n^2}$ is integrated over the **noise bandwidth** $G_m/(4C_1)$, which is $\pi/2$ times the closed-loop $-3$ dB bandwidth $G_m/(2\pi C_1)$ (Razavi DC Eqs. 18.56, 18.57).
- **More $G_m$ means more bandwidth and the same noise:** with $\overline{V_n^2}\propto1/G_m$ the product is $\propto kT/C_1$. Op-amp noise is a $kT/C$ term like the switches'.
- Non-flip-around ($C_1=2C_2$): the noise sampled on $C_1$, $\overline{V_n^2}G_m/(4C_1)$, is transferred to $C_2$ and amplified by $(C_1/C_2)^2=4$, giving $\frac{G_m}{C_1}\overline{V_n^2}$; the amplification phase adds $(1+C_1/C_2)^2\frac{G_m}{4C_1}\overline{V_n^2}=\frac94\frac{G_m}{C_1}\overline{V_n^2}$. They are uncorrelated (frozen at different times), so the total is $\frac{13}{4}$. Flip-around: the sampled op-amp noise is cancelled, like its offset, and only $(1+1)^2\frac{G_m}{4C_1}\overline{V_n^2}$ remains.
- **Target:** MDAC output noise of **10% to 20% of the LSB** at that point (Razavi DC §18.6.3).
- Approximations: no load capacitance, no internal op-amp pole; the input-referred noise of a two-stage op amp changes between phases. Simulate.

> [!tip] Remark
> The noise-bandwidth integral is the one that gives $kT/C$ in [[Noise#kT/C Noise]]. The JM form $\overline{v_{od}^2} = 2\gamma_n kT/(\beta C_{Ltot})$ ([[gm-ID Design Methodology#The Equations]]) is the same result written with $\beta$ and the total load, and is what the worked example's step 3 budgets against.

## Level 5: Multibit Stages and Stage Scaling

### Several Bits per Stage

```tikz title="A 2-bit MDAC: three flash comparators drive a thermometric capacitor DAC of four unit capacitors; C_F = C_u gives a residue gain of 4. After Razavi (Data Converters) Fig. 17.48."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (6,0) node[op amp](A){};
  \draw (A.+) -- ++(-0.3,0) -- ++(0,-0.6) node[ground]{};
  \draw (A.-) -- (4.4,0.5) coordinate(X) node[circ]{};
  \foreach \i/\y in {0/2.0,1/1.0,2/0.0,3/-1.0} {
    \draw (X) |- (3.6,\y) to[C] (2.2,\y) -- (1.8,\y) node[ocirc]{};
  }
  \node[font=\scriptsize] at (2.9,2.6) {four units $C_u$};
  \node[font=\scriptsize,anchor=east] at (1.7,2.0) {$V_{in}\to0$};
  \node[font=\scriptsize,anchor=east] at (1.7,1.0) {$V_{in}\to0/V_{REF}$};
  \node[font=\scriptsize,anchor=east] at (1.7,0.0) {$V_{in}\to0/V_{REF}$};
  \node[font=\scriptsize,anchor=east] at (1.7,-1.0) {$V_{in}\to0/V_{REF}$};
  \draw (X) -- (4.4,2.9) to[C,l={$C_F=C_u$}] (7.4,2.9) -- (7.4,0) -- (A.out);
  \draw (A.out) -- (7.9,0) node[ocirc]{} node[right] {$V_{out}=4V_{in}-KV_{REF}$};
  \node[font=\scriptsize,align=center] at (3.2,-2.0) {$K$ units switch to $V_{REF}$ (thermometer code of a 3-comparator flash), $K=0\ldots3$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = 2^kV_{in}-KV_{REF}\ \ (\text{gain }2^k\text{ restores full scale})}\qquad\boxed{\beta\approx\frac{1}{2^k}\ \text{falls as the stage resolves more}}
$$

- **Fewer stages:** fewer op amps (power, area) and fewer cycles of latency (Carusone §17.4.4).
- **Lower $\beta$:** a gain of $2^k$ means $\beta\approx2^{-k}$, so for the same op amp the closed-loop bandwidth drops and the $A_0$ requirement ($\propto1/\beta$) rises.
- **The DAC must be linear** to the stage's input accuracy: the unit capacitors must match (no longer automatic as in a 1-bit DAC). Pipeline DACs stay at about 5 bits or fewer (Razavi DC §17.9).
- The gain need not be $2^k$: a lower gain settles faster and swings less, at the cost of a scaled-down reference for the next stage (Carusone Problem 17.19 asks for the interstage gain of a 10-bit, 5-stage pipeline).
- **Redundancy extends:** add comparators so that the $k$-bit stage tolerates offsets the same way (Carusone §17.4.4, after Lewis 1992).

> [!note]- Detail: the 2-bit thermometric MDAC (Razavi DC §17.8)
> All four units sample $V_{in}$; $C_0$ always returns to 0, the other three go to 0 or $V_{REF}$ by their comparator. If $KV_{REF}/4<V_{in}<(K+1)V_{REF}/4$, the bottom-plate change is $-(4-K)V_{in}+K(V_{REF}-V_{in})$, so $V_{out} = -K(V_{REF}-V_{in})-(4-K)(0-V_{in}) = 4V_{in}-KV_{REF}$, ranging 0 to $V_{REF}$ in every segment. The next stage then needs its full scale scaled by the stage's resolution and gain (Problem 17.21).

### Stage Scaling

$$
\boxed{P_{n,in} = \sum_{k}\frac{P_{n,k}}{G^{2(k-1)}}\ \ \Rightarrow\ \ C_{k+1}=s\,C_k:\ \ P_{n,in} = \frac{P_{n,1}}{1-\frac{1}{G^2 s}}\quad(G^2s>1)}
$$

- With $G=2$: $s=1$ (no scaling) gives $\frac43P_{n,1}$; $s=\frac12$ gives $2P_{n,1}$; $s=\frac14$ diverges (every stage contributes equally).
- Scaling capacitors scales the op amp too ($g_m\propto C_{Ltot}$ at fixed bandwidth), so each halving roughly halves the stage's power, and the $A_0$ requirement drops by 2 per stage anyway.
- **Stop scaling** where the capacitors approach the parasitics and comparator loads: the worked example holds from stage 4.
- Scaling also eases reference bounce (Razavi DC §18.8). "The first stage is normally designed to be the larger and consume more power" (Carusone §17.4.2).

> [!warning] Unverified
> The closed-form sum and the "$s\approx\frac12$" choice are own arithmetic from the $4^{k-1}$ referral; Razavi calls scaling "beyond our scope" and Carusone states it qualitatively. The noise-optimal scaling factor depends on the op-amp topology and on the parasitic floor; check against a design paper before relying on it.

## Level 6: Escaping the Op Amp

### Open-Loop Residue Amplifiers

$$
\boxed{A_v = \frac{R_D}{R_S/2+1/g_{m1,2}}\ \ \text{(degenerated pair): cannot be exactly 2 over PVT}}
$$

Replace the closed-loop op amp with a resistively degenerated differential pair driven by the sampling capacitors, the bottom plates switched to $\pm V_{REF}/4$ to subtract (Razavi DC Fig. 19.18). It settles much faster than a closed loop, but:

1. **Linearity:** it must amplify up to $\pm V_{REF}/2$ (250 mV with $V_{REF} = 500$ mV) to 10-bit linearity.
2. **Gain accuracy:** the pair's $C_{gs}$ attenuates the capacitor steps and the gain drifts with PVT; both are gain errors, which redundancy does not fix. **Calibration becomes mandatory.**
3. **Offset** is not cancelled.

A flash front end shrinks the residue the pair must handle: a 5-bit flash with 1 bit of redundancy cuts it 16× (Razavi DC §19.3).

### SAR and Pipeline Hybrids

```tikz title="Two SAR loops pipelined through a residue amplifier: each resolves half the bits, and the amplifier's gain lets the second loop's comparator be noisier. After Razavi (Data Converters) Figs. 19.20(d), 19.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.9cm,minimum height=0.9cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[blk] (s1) at (0,0) {SAR 1\\ $n_1$ bits};
  \node[draw,thick,regular polygon,regular polygon sides=3,shape border rotate=-90,inner sep=1pt,fill=gray!8,font=\scriptsize] (ra) at (3.6,0) {$A_b$};
  \node[blk] (s2) at (6.0,0) {SAR 2\\ $n_2$ bits};
  \draw[->] (-1.6,0) node[left] {$V_{in}$} -- (s1);
  \draw[->] (s1) -- node[above,font=\scriptsize] {$V_{res}\le$ 1 LSB$_1$} (ra);
  \draw[->] (ra) -- (s2);
  \draw[->] (s1.south) -- ++(0,-0.6) node[below,font=\scriptsize] {MSBs};
  \draw[->] (s2.south) -- ++(0,-0.6) node[below,font=\scriptsize] {LSBs};
  \node[font=\scriptsize,align=left,anchor=west] at (7.2,0.2) {$V_{OS1}+V_{OSb}+V_{OS2}/A_b\ll$ 1 LSB\\ $A_b$ gain error $\to$ DNL: calibrate};
\end{circuitikz}
\end{document}
```

- **Why combine:** SAR is comparator-limited and needs no linear amplifier; a pipeline is op-amp-limited but resolves a bit per stage. A short SAR loop followed by a few pipeline stages (or a second SAR) takes the best of each (Razavi DC §19.4).
- **SAR then MDAC:** a top-plate SAR loop leaves a residue of at most one SAR LSB; the MDAC sees a small input, so its gain and swing are relaxed. Costs: a buffer between the SAR DAC and the MDAC whose gain must be precise (10-bit example, 6 SAR + 4 pipeline bits: gain error below about $1/64\approx1.6\%$), a reference of $V_{REF}/64$, and offsets that must sit well below 1 LSB.
- **MDAC then SAR:** saves only one SAR cycle, so it does not outperform a plain chain of MDACs (Razavi DC §19.4, Fig. 19.21).
- **Two pipelined SAR loops** (van der Goes 2014: 10 bits as $2\times5$): simpler DACs; the residue amplifier's gain relaxes the second comparator; its gain is **calibrated** to match the second loop's full scale. Using a separate comparator for each SAR cycle (Kull 2017) buys reset and offset-cancellation time at the cost of area and DAC loading.

> [!tip] Remark
> The SAR loops themselves, top-plate sampling, and the hybrid flash/SAR with overlap are [[SAR ADCs]]; this note keeps only the residue hand-off and what it costs the amplifier.

### Forcing the Virtual Ground with a SAR Loop

$$
\boxed{V_X = -\frac{V_{res}}{A_0}\ \Rightarrow\ \text{drive }V_X\to0\text{ and }V_{res}=2V_{in}-KV_{REF}\text{ regardless of }A_0}
$$

Finite gain shows up at one node: the virtual ground $X$. Add a phase in which a comparator senses $V_X$ and a SAR loop drives $C_2$ through a capacitor DAC until $V_X\to0$; the charge at $X$ is conserved, so the residue becomes exact (Yoshioka 2017: 12 bits with a low-gain op amp). It also removes the op amp's static nonlinearity (a gain that varies with output). Costs: SAR cycles in every conversion (low speed), loop gain reduced by the capacitive divider, and the comparator's offset and noise must be below 1 LSB (Razavi DC §19.5). A slow, high-gain, low-power op amp would do the same, but with more noise than a low-noise comparator.

> [!warning] Not covered by the sources
> Ring amplifiers and dynamic (integrating) residue amplifiers are not in Razavi DC Ch. 19, Carusone Ch. 17, or the Zettelkasten, so this note does not cover them. Calibration is mentioned only as a requirement (open-loop stages, hybrid buffers); no calibration algorithm is in the sources.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ bits per stage ($k$) | Fewer stages and op amps, less latency, later stages relaxed sooner | $\beta\approx2^{-k}$: more $A_0$ and GBW per op amp; DAC matching; $2^k$ comparators |
| 1.5-bit (redundant) stage | Comparator offset, noise and timing skew up to $V_{REF}/4$ absorbed; cheap comparators; SHA-less front end | One more comparator, decoding delay; does nothing for gain errors |
| Flip-around vs non-flip | $\beta=\frac12$ vs $\frac13$; cancels op-amp offset and sampled noise; no $V_{REF}/2$ ladder | Twice the sampling capacitance for the same $C_2$ |
| ↑ $C_s$ in stage 1 | $kT/C$, matching ($\Delta C/C$) | Load of the driver and of stage 1's op amp: $g_m$, $I_D$ grow with it |
| Stage scaling ($s<1$) | Power, area, reference bounce | Later stages' noise grows; $s\to\frac14$ makes every stage count equally |
| ↑ $A_0$ (cascode, gain boost, two-stage) | Gain error $1/(\beta A_0)$, DNL/INL | Swing, speed (two-stage: internal pole), complexity |
| ↑ $g_m/I_D$ of the input pair | $g_m$ per amp, noise per amp | $f_T$, $C_{in}$ rises so $\beta$ falls; slewing earlier |
| Open-loop residue amp | Speed, no $A_0$ requirement | Linearity, gain drift, offset: needs calibration |
| SAR front end / pipelined SAR | Fewer precision op amps, small residue | Precise inter-stage buffer gain (calibrate), more cycles |

## Cheat sheet

| Quantity | Equation |
|---|---|
| 1-bit residue | $V_{res} = 2V_{in}\mp V_{REF}$ |
| 1.5-bit residue | $2V_{in}+V_{REF}$ / $2V_{in}$ / $2V_{in}-V_{REF}$ split at $\pm V_{REF}/4$ |
| Redundancy window | $\lvert V_{OS}\rvert+V_0\omega_1\Delta t<V_{REF}/4$ |
| 1-bit comparator offset | DNL $=V_{OS,k}/2^{k-1}$; missing code if $\lvert V_{OS,1}\rvert>1$ LSB |
| Non-flip / flip-around output | $-\frac{C_1}{C_2}(KV_{REF}-V_{in})$ / $(1+\frac{C_1}{C_2})V_{in}-\frac{C_1}{C_2}KV_{REF}$ |
| Feedback factor | $\beta = C_2/(C_1+C_2+C_{in})$: $\frac13$ (non-flip), $\frac12$ (flip) |
| Gain error | $\epsilon\approx-1/(\beta A_0)$: $-3/A_0$, $-2/A_0$ |
| Residue with gain error | $(1+\epsilon)(2V_{in}\pm V_{REF})$ |
| DNL from gain error | $\frac{\epsilon}{2(1+\epsilon)}(V_{REF}-2\Delta)$; $A_0>15(2^{N-2}-1)$ (non-flip, 0.2 LSB) |
| Op-amp $A_0$ (stage $k$) | $A_0\ge2^{N_b+1}/\beta$, $N_b = N-k$ |
| Op-amp $\omega_u$ (stage $k$) | $\omega_u\ge(N_b+1)\ln2/(\beta t_s)$, $t_s<T/2-t_{comp}$ |
| Settling $\tau$ | $\frac{C_1+C_2+C_{in}}{C_2G_m}\left[C_L+\frac{C_2(C_1+C_{in})}{C_1+C_2+C_{in}}\right]$ |
| Sampling-phase $Z_X$ | $1/G_m\ll R_{on}$ |
| Switch noise (output) | $3kT/C_2$ (non-flip), $2kT/C_1$ (flip) |
| Op-amp noise (input-ref.) | $\overline{V_n^2}G_m/(4C_1)$; noise BW $=\frac\pi2f_{3dB}$ |
| Op-amp noise (MDAC output) | $\frac{13}{4}\frac{G_m}{C_1}\overline{V_n^2}$ (non-flip), $\frac{G_m}{C_1}\overline{V_n^2}$ (flip) |
| Capacitor mismatch | DNL $=(\Delta C/C)V_{REF}$; $\lvert\Delta C/C\rvert<0.4/2^N$ |
| Op-amp offset (non-flip) | DNL $=V_{OS}/2$; flip-around cancels |
| Timing skew (no redundancy) | $\Delta t<(0.2/2^{N-1})/\omega_1$ |
| $k$-bit stage | $V_{out}=2^kV_{in}-KV_{REF}$, $\beta\approx2^{-k}$ |
| Noise referral | $P_{n,in}=\sum P_{n,k}/4^{k-1}$; with $C_{k+1}=sC_k$: $P_{n,1}/(1-\frac{1}{4s})$ |
| Digital correction | $D_{out}=\sum_k d_k2^{M-k+n_b-1}+d_b$, $d_k\in\{0,1,2\}$ |
| Capacitive threshold | $V_X=-V_{in}+V_{REF}C_{1a}/(C_{1a}+C_{1b})$ |
| Open-loop stage gain | $R_D/(R_S/2+1/g_m)$ |

## References

- **Razavi, *Analysis and Design of Data Converters*, 2025** (PDF page = printed + 19)
  - Ch. 17 Fundamentals of Pipelined ADCs, pp. 353–382: binary search revisited, pipelining, op-amp models (Eqs. 17.5–17.15), non-flip-around and flip-around ×2 stages, MDACs (Figs. 17.24–17.32), cascading and residue plots (Exs. 17.9–17.14), timing (Fig. 17.44), multibit stages (Figs. 17.45–17.50), SAR vs pipeline (Table 17.1).
  - Ch. 18 Nonidealities in Pipelined ADCs, pp. 383–417: residue manipulation (§18.1.2), comparator offset in stages 1 and 2 (§18.2), op-amp offset (§18.3), charge injection (§18.4), $kT/C$ (Eqs. 18.9–18.12), sampling-phase impedance (Eqs. 18.13–18.17), settling (Eqs. 18.18–18.29), finite gain (Eqs. 18.30–18.44, Exs. 18.5–18.8), op-amp noise (Eqs. 18.45–18.59), capacitor mismatch (Eqs. 18.60–18.68, Ex. 18.10), reference bounce (§18.8), timing mismatch (§18.9).
  - Ch. 19 Advanced SAR and Pipelining, pp. 418–438: overlap in hybrid flash/SAR (§19.1, linked to SAR ADCs), 1.5-bit stages (Eqs. 19.1–19.6, Exs. 19.5–19.6, §19.2.3), capacitive thresholds (Eq. 19.7), open-loop residue amplification (§19.3), SAR/pipeline hybrids (§19.4), SAR-forced virtual ground (§19.5).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §17.4 Pipelined A/D Converters, pp. 665–673 (Eqs. 17.39–17.42, Exs. 17.6–17.8, Figs. 17.18–17.23: 1-bit and 1.5-bit stages, digital correction, flip-around 1.5-bit MDAC with $\beta = \frac12$ vs $\frac13$, $k$-bit stages, key points on first-stage power); Problems 17.16–17.20.
- **Jespers & Murmann** (via [[gm-ID Design Methodology]]): §6.1.2–6.1.3 ($\beta = 0.75\beta_{max}$, $\omega_{Ti}/\omega_u = 3(\mathrm{FO}\cdot G+1)$, slewing parameter $X$), used in the worked example.
- **ECE 636 (Fall 2026) slides:** "Analysis of a ×2 S/H Amplifier" (9/10): pipelined ADC algorithm example, 1-bit stage model, op-amp DC-gain and GBW specs from settling (numbers in [[Sampling Circuits#Spec translation]]).
- **Zettelkasten** (`AnalogTheory/S24 Pipelined ADCs` and `Pipelined ADCs/`): reading order and framing (24a, 24h3 comparator- vs op-amp-centric, 24x4 vertical shifts only, 24z thesis of SAR/pipeline hybrids); `Practical Sizing Case Studies/17o, 17p` (SC gain stage settling, $\beta^2 g_m/I_D$ optimum) for the worked example. All content cross-checked against Razavi DC.
