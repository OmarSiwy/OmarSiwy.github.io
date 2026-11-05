---
title: Flash ADCs
description: The fully parallel ADC from ladder and comparator bank to thermometer decoding, then the offset, kickback, metastability, skew and bubble errors that cap it near 8 bits, the variants that stretch it (interpolation, folding, two-step), and the translation of N, f_s and DNL into preamp gain, bandwidth, offset and g_m/I_D.
kind: topic
status: growing
aliases:
  - Flash ADCs
  - Flash ADC
---

A flash ADC compares the input against every threshold at once, so it converts in one clock cycle. The idea fits in one line. The rest of this note is about what that parallelism costs. It starts with the converter as a black box, then decodes its thermometer output, then works through the nonidealities (offset, input capacitance, metastability, kickback, timing), and ends with the circuit and architecture tricks that push the resolution up: differential subtraction, interpolation, folding and two-step. A flash is worth knowing even if you never build one as a full ADC: it is the sub-ADC in every pipeline stage, the coarse front end of hybrid SARs, and the PAM4 slicer bank in a SerDes receiver.

## The big picture

```tikz title="An N-bit flash ADC: a 2^N-resistor ladder sets 2^N - 1 thresholds, one comparator per threshold fires on the same clock edge, and the comparator outputs form a thermometer code that a decoder turns into binary. Here V_r2 < V_in < V_r3. After Razavi DC Fig. 13.1(a) and Carusone Fig. 17.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ladder
  \draw (0,7.2) node[above]{$V_{REF}$} to[R,l_=$R$] (0,5.4) to[R,l_=$R$] (0,3.6) to[R,l_=$R$] (0,1.8) to[R,l_=$R$] (0,0) node[ground]{};
  \foreach \y/\j in {5.4/3,3.6/2,1.8/1} {
    \draw (0,\y) node[circ]{} -- (1.9,\y) -- (1.9,{\y-0.2}) -- (2.0,{\y-0.2});
    \node[font=\scriptsize,anchor=south] at (0.9,\y) {$V_{r\j}$};
    \draw[fill=gray!8] (2.0,{\y-0.55}) -- (2.0,{\y+0.75}) -- (3.2,{\y+0.1}) -- cycle;
    \node[font=\scriptsize] at (2.45,{\y+0.1}) {C$_\j$};
    \node[font=\tiny] at (2.15,{\y+0.45}) {$+$};
    \node[font=\tiny] at (2.15,{\y-0.2}) {$-$};
    \draw ({\y*0+2.0},{\y+0.45}) -- (1.6,{\y+0.45});
  }
  % vin bus
  \draw (1.6,6.6) node[left]{$V_{in}$} -- (1.6,2.25);
  \foreach \y in {5.85,4.05,2.25} { \fill (1.6,\y) circle (1.5pt); }
  % clock
  \draw[dashed] (2.6,6.6) node[above,font=\scriptsize]{$CK$} -- (2.6,5.85);
  % thermometer outputs
  \foreach \y/\b in {5.5/0,3.7/1,1.9/1} {
    \draw[->] (3.2,\y) -- (4.4,\y);
    \node[draw,fill=white,minimum size=0.45cm] at (4.7,\y) {\b};
  }
  \node[font=\scriptsize,align=center] at (4.7,6.4) {thermometer\\code};
  \draw[fill=gray!8,rounded corners=2pt] (5.5,1.4) rectangle (7.6,6.0);
  \node[align=center] at (6.55,3.7) {decoder\\ (ROM, MUX,\\ ONEs counter,\\ Gray)};
  \foreach \y in {5.5,3.7,1.9} { \draw[->] (4.95,\y) -- (5.5,\y); }
  \draw[->] (7.6,3.7) -- (8.6,3.7) node[right]{$D_{out}=10$};
  \node[font=\scriptsize,align=left,anchor=west] at (-0.2,-1.1) {$N$ bits: $2^N$ resistors, $2^N-1$ comparators, all strobed on one edge};
  \node[font=\scriptsize,align=left,anchor=west] at (-0.2,-1.55) {costs that grow with $N$: comparators $\times2$, input capacitance $\times8$, ladder kickback $\times4$ per bit};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **One cycle, exponential hardware.** $2^N$ ladder resistors and $2^N-1$ comparators, all strobed together. The comparator outputs are a thermometer code; full scale is $V_{FS}=V_{REF}$. Practical up to about **8 bits** (Razavi: $4\le N\le8$; folding and interpolating variants $6\le N\le10$).
> 2. **Comparator offset is the static error.** Offset $V_{OS,j}$ moves transition $j$ by $V_{OS,j}$, so $\text{INL}_j=V_{OS,j}$ and $\text{DNL}_j=V_{OS,j}-V_{OS,j-1}$: $\sigma_{DNL}=\sqrt2\,\sigma_{OS}$. Design for $\sigma_{OS}\lesssim0.2$ LSB; an offset past 1 LSB puts a **bubble** in the thermometer code.
> 3. **Input capacitance grows as $2^{3N}$** at a fixed input range: twice the comparators, each needing 4× the area to halve its offset. Hence offset cancellation from about 4 bits up.
> 4. **Kickback piles up on the ladder:** $V_{max}=\frac{m^2}{8}I_uR_u$ at the midpoint ($m=2^N$). Fixes: an unclocked preamp in front of each latch, bypass capacitors on the ladder, or a smaller $R_u$ (more ladder power).
> 5. **The comparators are the sampler.** No front-end S/H is required, but clock skew between comparators must satisfy $\Delta T<1/(2^{N-1}\omega_{in})$ (under 1 ps for 6 bits at a 5 GHz input), or bubbles appear.
> 6. **The decoder decides how big an error gets.** A bubble or a metastable comparator can make a ROM decoder miss by half of full scale; 3-input gates, Gray coding (±1 LSB for metastability) and ONEs counters bound it. A second regenerative latch doubles the regeneration time and squares the metastability rate.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 The Black Box|black box: where flash sits, the ladder, distributed sampling]] → [[#Level 1 Thermometer-to-Binary Decoding|decoders, PAM4]] → [[#Level 2 Static Errors Offset and Input Capacitance|offset, DNL, input capacitance]] → [[#Level 3 Dynamic Errors|metastability, kickback, skew, input-dependent delay]] → [[#Level 4 Bubble Correction|bubble correction]] → [[#Level 5 Fully-Differential Flash|differential subtraction, U-shaped ladder]] → [[#Level 6 Fewer Comparators|interpolation, folding, two-step]].

> [!tip] Remark
> The vocabulary (LSB, DNL, INL, missing codes, SNDR, ENOB, FOM) is owned by [[Data Converter Fundamentals]]. The comparator itself (StrongARM, $\tau_{reg}$, offset budget, kickback mechanism, trim) is owned by [[Comparators]]. This note only says what an *array* of comparators does to them.

## Spec translation

A flash ADC contains three kinds of circuit: the **reference ladder** (resistors), the **preamplifiers** (resistively loaded differential pairs, real amplifiers sized with gm/ID), and the **latches** (regenerative pairs, sized for $g_m/C$). The ADC specs land on them as follows.

**Flash ADC specs** (Razavi DC §12.3, §13.4; Carusone §17.5.1): resolution $N$ and full scale $V_{FS}$ (so the LSB $=V_{FS}/2^N$), conversion rate $f_{CK}$, analog input bandwidth (dynamic performance up to $f_{CK}/2$), DNL / INL / no missing codes, SNDR and ENOB at Nyquist, metastability (sparkle) error rate, input capacitance seen by the driver, input common-mode range, and power.

| ADC spec | Element that sets it | Amplifier / device spec it imposes |
|---|---|---|
| DNL, INL, missing codes | Each comparator's input pair | **Input offset** $\sigma_{OS}\lesssim0.2$ LSB (DNL is $\sqrt2\,\sigma_{OS}$) |
| No bubbles from offset | Same | $P(\lvert V_{OS}\rvert>1\,\text{LSB})$ negligible over $2^N-1$ comparators |
| Latch offset, latch noise | Preamp in front of the latch | Preamp **DC gain** $A_1$ (2 to 3 in practice) divides them |
| Noise | Preamp, latch | **Input-referred noise** $\sigma_n\ll$ LSB (budget: [[Comparators#Noise Turns Into an Error Probability]]) |
| Metastability rate | Latch (plus pipelined second latch) | **$\tau_{reg}$** (a $g_m/C$, i.e. unity-gain-frequency spec) against the time allowed |
| Ladder accuracy under kickback | Preamp (reverse isolation), ladder $R_u$, bypass caps | Preamp **unclocked**, small $C_{GD}$; $R_u$ from the kickback bound; ladder **settling** $\tau=R_{th}C_t$ |
| Input bandwidth, distortion at high $f_{in}$ | Preamp output pole $R_DC_D$; clock tree | Preamp **bandwidth** (its delay $R_DC_D$ must not vary by more than the skew budget); clock **skew** $\Delta T$ |
| Input capacitance, driver | All $2^N-1$ input pairs (or sampling caps) | Input-pair $WL$ (fixed by offset) times $2^N$ |
| Input CM range | Preamp input pair, tail, load drop | **Input CM range**: $V_{GS}+V_{tail}\le V_{CM}\le V_{DD}-I R_D+V_{TH}$ |
| Power | Preamps, ladder, latches, decoder | Preamp **static current** (can exceed the latch's), ladder $V_{REF}^2/(mR_u)$, latch $fCV^2$ |

$$
\boxed{\sigma_{DNL}=\sqrt2\,\sigma_{OS}}\qquad
\boxed{V_{kick,max}=\frac{m^2}{8}I_uR_u\ \ll 1\ \text{LSB}}\qquad
\boxed{\Delta T<\frac{1}{2^{N-1}\,\omega_{in}}}
$$

$$
\boxed{P_{error}=\beta\,e^{-T_{CK}/(2\tau_{reg})}\ \Rightarrow\ \tau_{reg}\le\frac{T_{CK}}{2\ln(\beta/P_{error})}}\qquad
\boxed{A_1=g_mR_D=\left(\frac{g_m}{I_D}\right)(I_DR_D)}
$$

> [!note]- Derivation: where each inequality comes from
> **DNL.** Transition $j$ sits at $V_{r,j}+V_{OS,j}$. The step width between transitions $j-1$ and $j$ is $1\,\text{LSB}+V_{OS,j}-V_{OS,j-1}$, so $\text{DNL}_j=V_{OS,j}-V_{OS,j-1}$. Independent offsets add in power: $\sigma_{DNL}^2=2\sigma_{OS}^2$ (Razavi Eqs. 13.7–13.9). The INL at transition $j$ is just $V_{OS,j}$, so DNL is the tighter limit.
>
> **Kickback.** Model each comparator's kickback as a current $I_u$ into its tap (valid when the coupling capacitors' impedance is far above the ladder's). Norton-reduce the ladder on each side of tap $j$ and superpose: $V_j=\frac{j(m-j)}{2}I_uR_u$, maximum $m^2I_uR_u/8$ at $j=m/2$ ([[#Kickback Onto the Ladder]]).
>
> **Skew.** A full-scale sine $V_0\cos\omega_{in}t$ has peak slope $V_0\omega_{in}$, and $1\,\text{LSB}=2V_0/2^N$. Two adjacent comparators sampling $\Delta T$ apart must not see the input move by more than 1 LSB: $V_0\omega_{in}\Delta T<2V_0/2^N$ (Razavi Eqs. 13.25–13.26).
>
> **Metastability.** Razavi Eq. (13.10) gives the error rate for a uniformly distributed input with $T_{CK}/2$ of regeneration time, with the proportionality factor $\beta$ (0.2 to 2) that appears in Ex. 13.6. Solve for $\tau_{reg}$. The general sensitivity argument is in [[Comparators#Error Rate]].
>
> **Preamp gain.** A resistively loaded pair has $A_1=g_mR_D$; writing $g_m=(g_m/I_D)I_D$ splits it into the inversion level and the DC drop $I_DR_D$ across the load, which headroom caps.

| Amplifier spec | Lands on | Why |
|---|---|---|
| Preamp input offset | $WL$ of the input pair (Pelgrom), high $g_m/I_D$ to shrink the $\Delta\beta$ term | $V_{OS}^2=\Delta V_{TH}^2+\tfrac14(\Delta\beta/\beta)^2V_{OV}^2$ |
| Input capacitance | The same $WL$, times $2^N$ | Directly opposes the offset spec: the reason for offset cancellation, trim, or interpolation |
| Preamp gain $A_1$ (2 to 4) | $g_m/I_D$ and the load drop $I_DR_D$ | $A_1=(g_m/I_D)(I_DR_D)$; the drop is capped by the input CM range |
| Preamp bandwidth | $g_m/C_D$, then $I_D=g_m/(g_m/I_D)$ | $1/(R_DC_D)=g_m/(A_1C_D)$: gain and bandwidth trade at fixed current |
| Preamp reverse isolation | Continuous bias (no clocked tail), small input $C_{GD}$ | Kickback must cross $C_{GD}$ in series with the latch's capacitances |
| Latch $\tau_{reg}$ | Short $L$, low $g_m/I_D$ (high $f_T$) in the cross-coupled pair | $\tau_{reg}\approx C/g_m$ |
| Ladder $R_u$ | Unit resistor value and width | $V_{max}\propto R_u$; $P_{ladder}=V_{REF}^2/(mR_u)$ |

> [!tip] Remark
> Spec names are from [[Single-Stage#Amplifier Specifications]]. Turning $g_m/I_D$, $L$ and $I_D$ into a width is [[gm-ID Design Methodology]]. The offset formula and Pelgrom's law are owned by [[Nonlinearity and Mismatch#Input-Referred Offset]]; the per-comparator spec table (offset, noise, $\tau_{reg}$, StrongARM gain $(g_m/I_D)V_{THN}$) is [[Comparators#Spec translation]].

**Worked example: a 6-bit flash built from the Ch. 7 StrongARM** (Razavi DC §13.4.4–13.4.5 numbers; the StrongARM figures are from [[Comparators#Level 8 Design Study 5 GHz StrongARM in 28 nm]]; steps marked *derived* are arithmetic on those numbers, not Razavi's).
1. **LSB and offset target.** Razavi's kickback example takes LSB $=5$ mV, so $V_{FS}=64\times5=320$ mV. Offset target $0.2$ LSB $=1$ mV.
2. **Offset → area (derived).** The Ch. 7 StrongARM has $\sigma_{OS}=4.7$ mV $\approx0.94$ LSB, so $\sigma_{DNL}\approx1.3$ LSB: unusable. Shrinking its 4.4 mV input-pair term to 1 mV by area alone needs $(4.4/1)^2\approx19\times$ the $WL$, and 19× the input capacitance, on each of 63 comparators. This is why Razavi calls for offset cancellation from 4 bits up ([[Comparators#Level 6 Offset Cancellation and Trim]]).
3. **Kickback → ladder.** With 200 µA peak kickback per comparator and $R_u=10\ \Omega$: $V_{max}=\frac{64^2}{8}(200\ \mu\text{A})(10\ \Omega)=1024$ mV (Razavi). Holding it to 1 mV by $R_u$ alone needs $R_u\approx10\ \text{m}\Omega$, i.e. a ladder current $0.32\ \text{V}/(64\times9.8\ \text{m}\Omega)\approx0.5$ A (derived). Not an option.
4. **Bypass capacitor instead.** Lumping half the kickback at the midpoint, $I_0\approx32\times100\ \mu\text{A}$ for $\Delta T\approx50$ ps: $C_1\ge I_0\Delta T/1\,\text{mV}=160$ pF (Razavi). Large, and it does nothing for the input side.
5. **Input buffer.** $64\times200\ \mu\text{A}=12.8$ mA of kickback hits the driver; for 1 mV of error its output impedance must be below $1\ \text{mV}/12.8\ \text{mA}\approx0.08\ \Omega$ (derived). A 1 mA source follower cannot do it. Conclusion: an **unclocked preamp** in front of every latch, with gain 2 to 3.
6. **Preamp gm/ID (derived from Razavi §13.6.1).** In the two-pair differential comparator, each load carries $I_{SS}$ and drops about 0.5 V for a gain of 3 to 4. Each device carries $I_{SS}/2$, so $A_1=g_mR_D=(g_m/I_D)\cdot\tfrac12(I_{SS}R_D)=(g_m/I_D)\cdot0.25$ V, giving $g_m/I_D\approx12$–16 S/A: moderate inversion. The same 0.5 V drop leaves an input CM window of 0.5 to 0.8 V at $V_{DD}=1$ V, $V_{TH}=0.3$ V.
7. **Speed → skew and $\tau_{reg}$.** At 10 GS/s with a 5 GHz input: $\Delta T<1/(2^5\cdot2\pi\cdot5\ \text{GHz})\approx1$ ps (Razavi). With $\tau_{reg}=2.5$ ps and Eq. (13.10) as written, $T_{CK}/2=50$ ps gives $P_{error}\approx\beta e^{-20}\approx2\beta\times10^{-9}$; a pipelined second latch makes it $\beta e^{-40}$ (derived).

## Level 0: The Black Box

### Where Flash Sits Among Nyquist ADCs

```tikz title="Resolution ranges of the common Nyquist-rate architectures. After Razavi DC Fig. 12.20 and Sec. 12.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9.6,0) node[right]{$N$ (bits)};
  \foreach \n in {4,6,8,10,12,14,16} { \draw ({0.75*(\n-4)+0.4},0.08) -- ({0.75*(\n-4)+0.4},-0.08) node[below,font=\scriptsize]{\n}; }
  \def\bar#1#2#3#4{\draw[fill=#4,rounded corners=2pt] ({0.75*(#1-4)+0.4},#3) rectangle ({0.75*(#2-4)+0.4},{#3+0.45});}
  \bar{4}{8}{0.4}{gray!45}  \node[anchor=west,font=\scriptsize] at ({0.75*4+0.5},0.62) {flash};
  \bar{6}{10}{1.0}{gray!25} \node[anchor=west,font=\scriptsize] at ({0.75*6+0.5},1.22) {folding + interpolating};
  \bar{6}{16}{1.6}{gray!10} \node[anchor=west,font=\scriptsize] at ({0.75*12+0.5},1.82) {SAR};
  \bar{8}{16}{2.2}{gray!10} \node[anchor=west,font=\scriptsize] at ({0.75*12+0.5},2.42) {pipelined};
  \node[font=\scriptsize,align=left,anchor=west] at (0.4,3.15) {interleaving: applies to any of them for more speed};
\end{circuitikz}
\end{document}
```

- **Flash** for roughly 4 to 8 bits; **folding + interpolating** flash for 6 to 10 (less common); **pipelined** 8 to 16; **SAR** 6 to 16 (the most popular today, for power). **Interleaving** applies to any of them for more speed ([[Interleaved ADCs]]).
- **Static** performance is measured with a slow ramp; **dynamic** performance with a full-scale sine swept up to $f_{CK}/2$. An ideal $N$-bit ADC has SNDR $=\tfrac32 2^{2N}$ at every input frequency below Nyquist; real ones fall as $f_{in}$ rises. For a flash, the comparator-timing effects of [[#Level 3 Dynamic Errors]] are what make it fall.

> [!tip] Remark
> The figures of merit $P/(f_{CK}2^N)$ and $P/(2f_{in}2^{ENOB})$ are owned by [[Data Converter Fundamentals]]. A flash's $P$ is dominated by $2^N$ preamps and latches, so its FOM worsens fast with $N$.

### One Cycle, $2^N-1$ Comparators

$$
\boxed{V_{r,j}=\frac{j}{2^N}V_{REF},\qquad V_{FS}=V_{REF},\qquad \text{comparators}=2^N-1}
$$

- With $V_{r,j}<V_{in}<V_{r,j+1}$ the bottom $j$ comparators output ONE: a **thermometer code**. The comparator whose threshold is closest to $V_{in}$ makes the **critical decision**.
- $V_{FS}$ is one LSB above the last transition, so it equals $V_{REF}$ (Razavi Ex. 13.1). Above it the output saturates at $11\cdots1$ (**overrange**). Carusone's version uses $R/2$ at the top and bottom of the ladder, which shifts every transition by half an LSB, and adds an overrange comparator.
- **Input CM:** comparators with NMOS input pairs fail near $V_{in}=0$, so the ladder bottom is tied to some $V_B$ (e.g. 0.5 V) and the range becomes $V_{REF}-V_B$. Capacitive coupling removes the limit ([[#Subtraction in the Voltage Domain]]).
- **Cost** grows exponentially with $N$: power, input capacitance, kickback, offset-cancellation circuits, area, and the difficulty of distributing clock, input and references across the array.

> [!tip] Remark
> The ladder is a resistor-string DAC that never switches: every tap is used at once. Its matching and settling are owned by [[DACs]] (Razavi DC Ch. 9). The comparator is the clocked comparator of [[Comparators#Level 0 The Black Box]].

> [!note]- Detail: a CMOS inverter as a tiny flash comparator (Carusone Fig. 17.25)
> When $\phi$ is high, the inverter is shorted input to output and sits at its own threshold (a single inverter with feedback is a one-pole amplifier, so it does not oscillate), while the other plate of $C$ charges to $V_{ri}$. When $\phi$ falls, that plate is switched to $V_{in}$; the inverter input moves by $V_{in}-V_{ri}$ from its trip point and the output falls the corresponding way. It is the input-offset-storage idea of [[Nonlinearity and Mismatch#Input Offset Storage]] in its smallest form. Weakness: poor supply rejection, which fully differential inverters help.

### The Comparators Are the Sampler

- Each comparator's preamp tracks the input linearly only near its own threshold; elsewhere it is saturated. When the clock switches the array from amplify to latch, each latch **freezes** its preamp's output. Collectively the comparators are a **distributed sampler**, each responsible for a narrow slice of the input range.
- So a flash can run **without a front-end S/H**: a big win, since a sampler driving $2^N$ comparators is hard to build (Carusone: a high-speed S/H can be harder to build than the flash).
- The cost: every comparator samples at its own instant. Skew and amplitude-dependent delay then corrupt the samples at high $f_{in}$ ([[#Clock Skew Makes Bubbles]], [[#Input-Dependent Delay]]).

> [!tip] Remark
> A single front-end sampler removes the timing problems (one sampling instant) but brings back kT/C, charge injection and the driving problem of [[Sampling Circuits]]. Razavi Problem 13.12 asks which flash errors it fixes: feedthrough to the ladder, input-dependent delay and clock mismatch, but not metastability.

## Level 1: Thermometer-to-Binary Decoding

The thermometer code must be compressed to binary (or Gray) before any digital processing. The hard part is physical: the comparator outputs are spread across a large array, so decoders differ mainly in which wires get long.

### ROM Decoder

```tikz title="ROM decoder: two-input gates turn the 1-to-0 transition into a 1-of-n code, which pulls down the precharged output columns of one ROM row. Shown for 2 bits; code 00 needs one more row driven by NOT T_1. After Razavi DC Fig. 13.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % thermometer entries T1..T4 bottom->top, AND gates detect 1->0
  \foreach \i/\b in {1/1,2/1,3/0,4/0} {
    \node[draw,minimum size=0.45cm,fill=white] (T\i) at (0,{1.2*\i}) {\b};
    \node[left,font=\scriptsize] at (-0.3,{1.2*\i}) {$T_\i$};
  }
  \foreach \i/\o in {1/0,2/1,3/0} {
    \pgfmathtruncatemacro{\n}{\i+1}
    \node[and port,number inputs=2,scale=0.7] (A\i) at (2.2,{1.2*\i+0.6}) {};
    \draw (T\i.east) -- ++(0.4,0) |- (A\i.in 2);
    \draw (T\n.east) -- ++(0.6,0) |- (A\i.in 1);
    \node[ocirc] at ([xshift=-0.07cm]A\i.in 1) {};
    \draw (A\i.out) -- (7.7,{1.2*\i+0.6});
    \node[font=\scriptsize,above] at (3.2,{1.2*\i+0.6}) {\o};
  }
  % ROM columns D2 D1 D0
  \foreach \c/\x in {D_1/6.4,D_0/7.4} {
    \draw (\x,1.2) -- (\x,5.2);
    \node[below] at (\x,1.2) {$\c$};
    \draw (\x,5.2) -- (\x,5.5); \draw[fill=gray!20] ({\x-0.25},5.5) rectangle ({\x+0.25},5.9); \node[font=\tiny] at (\x,5.7) {pre};
  }
  \node[font=\scriptsize,anchor=west] at (7.8,5.7) {precharge to $V_{DD}$ while $CK$ low};
  % pull-downs: row1 -> 01 (D0 low? encode value) row i outputs code i: row1=01,row2=10,row3=11; pulldown where bit=0
  \foreach \x/\y in {6.4/1.8, 7.4/3.0} { \fill (\x,\y) circle (2.5pt); }
  \node[font=\scriptsize,anchor=west] at (7.8,1.8) {row 1 $\to$ 01};
  \node[font=\scriptsize,anchor=west] at (7.8,3.0) {row 2 $\to$ 10};
  \node[font=\scriptsize,anchor=west] at (7.8,4.2) {row 3 $\to$ 11};
  \node[font=\scriptsize,align=center] at (6.9,0.25) {$\bullet$ = NMOS pull-down:\\ discharges the column};
  \node[font=\scriptsize,align=center] at (2.4,5.6) {AND($T_j$, $\overline{T_{j+1}}$):\\ 1-of-$n$ code};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{1-of-}n:\ \ H_j=T_j\cdot\overline{T_{j+1}}}
$$

- Step 1 is local (adjacent comparators only, short wires). Step 2: precharge every output column to $V_{DD}$, then let the single active row discharge the columns that must be ZERO. Carusone builds the same thing with NAND gates and notes that more than one active gate flags an error.
- **Pairs naturally with the StrongARM:** in reset both StrongARM outputs are high, so every 1-of-$n$ entry is zero and the precharge does not fight any pull-down. The inverters and SR latch that normally follow the StrongARM can go; an SR latch moves to the ROM output instead (it is invalid during precharge).
- **Not with current-steering comparators:** they always output a valid thermometer code, so one row is always on and fights the precharge.
- **Slow:** each column runs the full height of the array and, in the worst case, one NMOS discharges it.

### MUX Decoder

```tikz title="MUX decoder for 3 bits: binary search for the topmost ONE. T_4 is the MSB and selects between the upper and lower halves; MSB-1 then selects the final pair. Each MUX passes its upper input when its select is 1. After Razavi DC Fig. 13.7(e)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,mx/.style={draw,thick,fill=gray!8,trapezium,trapezium angle=70,shape border rotate=270,minimum width=1.1cm,minimum height=0.6cm,inner sep=1pt,font=\scriptsize}]
  % first rank: select = MSB = T4
  \node[mx] (m1) at (2,4.2) {MUX};
  \node[mx] (m2) at (2,2.4) {MUX};
  \node[mx] (m3) at (2,0.6) {MUX};
  \draw[->] (0,4.45) node[left]{$T_6$} -- (m1.north west|-0,4.45);
  \draw[->] (0,3.95) node[left]{$T_2$} -- (m1.south west|-0,3.95);
  \draw[->] (0,2.65) node[left]{$T_7$} -- (m2.north west|-0,2.65);
  \draw[->] (0,2.15) node[left]{$T_3$} -- (m2.south west|-0,2.15);
  \draw[->] (0,0.85) node[left]{$T_5$} -- (m3.north west|-0,0.85);
  \draw[->] (0,0.35) node[left]{$T_1$} -- (m3.south west|-0,0.35);
  \draw (0,5.4) node[left]{$T_4$} -- (6.5,5.4) node[right]{MSB};
  \foreach \m/\y in {m1/4.2,m2/2.4,m3/0.6} { \draw[->] (1.3,{\y+0.65}) -| (\m.north); \fill (1.3,{\y+0.65}) circle (1.3pt); }
  \draw (1.3,5.4) -- (1.3,1.25);
  \fill (1.3,5.4) circle (1.5pt);
  \draw (m1.east) -- (6.5,4.2) node[right]{MSB$-1$};
  \node[mx] (m4) at (4.6,1.5) {MUX};
  \draw[->] (m2.east) -- ++(0.6,0) |- ([yshift=0.25cm]m4.west);
  \draw[->] (m3.east) -- ++(0.6,0) |- ([yshift=-0.25cm]m4.west);
  \fill (3.8,4.2) circle (1.5pt);
  \draw[->] (3.8,4.2) -- (3.8,3.0) -| (m4.north);
  \draw (m4.east) -- (6.5,1.5) node[right]{MSB$-2$ (LSB)};
  \node[font=\scriptsize,anchor=west] at (2.9,5.65) {MSB drives every first-rank select ($2^{N-1}-1$ of them): long, loaded line};
\end{circuitikz}
\end{document}
```

- Decoding is finding the **topmost ONE**, which a binary search does: $\text{MSB}=T_{2^{N-1}}$; the MSB selects which half to look at for the next bit, and so on.
- The MSB line drives every first-rank MUX ($2^{N-1}-1$; Razavi counts 32 in a 6-bit converter) and the first rank pairs entries half a full scale apart (entries 1 and 33, 2 and 34, …): long, heavily loaded wires. The U-shaped layout of [[#U-Shaped Ladder]] fixes the second problem, not the first.

### ONEs-Counter Decoder

```tikz title="ONEs counter for 3 bits: two full adders count T_1-T_3 and T_4-T_6, a third adds the weight-1 bits (S_1, S_2, T_7), a fourth the weight-2 carries. After Razavi DC Figs. 13.10-13.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,thick,fill=gray!8,minimum width=1.0cm,minimum height=1.5cm}]
  \node[blk] (F1) at (2,0.9) {FA$_1$};
  \node[blk] (F2) at (2,3.3) {FA$_2$};
  \node[blk] (F3) at (5,4.0) {FA$_3$};
  \node[blk] (F4) at (8,1.6) {FA$_4$};
  \foreach \i/\y in {1/0.4,2/0.9,3/1.4,4/2.8,5/3.3,6/3.8} { \draw[->] (0,\y) node[left]{$T_\i$} -- (1.5,\y); }
  \draw[->] (0,5.0) node[left]{$T_7$} -- (3.6,5.0) |- (4.5,4.5);
  % F1 outputs: S1 (weight1), C1 (weight2)
  \draw (2.5,0.6) -- (3.0,0.6) node[below,font=\scriptsize]{$S_1$} -- (3.9,0.6) |- (4.5,3.5);
  \draw (2.5,1.2) -- (3.0,1.2) node[above,font=\scriptsize]{$C_1$} -- (6.4,1.2) |- (7.5,1.1);
  \draw (2.5,3.0) -- (3.0,3.0) node[below,font=\scriptsize]{$S_2$} -- (3.7,3.0) |- (4.5,4.0);
  \draw (2.5,3.6) -- (3.0,3.6) node[above,font=\scriptsize]{$C_2$} -- (3.3,3.6) -- (3.3,2.3) -- (6.8,2.3) |- (7.5,2.1);
  \draw (5.5,4.3) -- (9.6,4.3) node[right]{$D_3$ (LSB)};
  \draw (5.5,3.7) node[below right,font=\scriptsize]{$C_3$} -- (7.1,3.7) |- (7.5,1.6);
  \draw (8.5,1.3) -- (9.6,1.3) node[right]{$D_1$ (MSB)};
  \draw (8.5,1.9) -- (9.6,1.9) node[right]{$D_2$};
  \node[font=\scriptsize,align=left,anchor=west] at (-0.3,-0.6) {weight 1: $T_7$, $S_1$, $S_2$ $\to$ FA$_3$; weight 2: $C_1$, $C_2$, $C_3$ $\to$ FA$_4$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{FA: } S=A\oplus B\oplus D,\ \ C=AB+BD+AD}\qquad
\boxed{\text{thermometric } ABD\ (A\text{ lowest}):\ \ S=A\,\overline{(B\oplus D)},\ \ C=B}
$$

- Count the ONEs: the binary count *is* the output. Full adders compress groups of three entries into (carry, sum) pairs, then ordinary binary addition combines the pairs.
- When the inputs are known to be thermometric, the adders collapse: a half adder's sum becomes $A\overline B$, a full adder's carry is just the middle entry.
- **Short thermometer wires** and the **best bubble tolerance** (it counts ONEs regardless of where they are). Costs: more logic, and the first adder rank drives long wires.

> [!note]- Why the thermometric simplification works
> A thermometer pair $AB$ (with $A$ the lower entry) can only be 00, 10 or 11, never 01. So $S=A\oplus B=A\overline B+\overline AB$ loses its $\overline AB$ term: $S=A\overline B$ (Razavi Ex. 13.3). For three entries, $ABD$ fills as 000, 100, 110, 111 with counts 0 to 3. The carry (count $\ge2$) is high exactly when $B$ is, and the sum (odd count) is $A$ with $B$ and $D$ equal: $S=A\,\overline{(B\oplus D)}$ (Eqs. 13.3–13.4).

### Gray Encoder

| $T_7\cdots T_1$ | $G_3G_2G_1$ | value |
|---|---|---|
| 0000000 | 000 | 0 |
| 0000001 | 001 | 1 |
| 0000011 | 011 | 2 |
| 0000111 | 010 | 3 |
| 0001111 | 110 | 4 |
| 0011111 | 111 | 5 |
| 0111111 | 101 | 6 |
| 1111111 | 100 | 7 |

$$
\boxed{G_3=T_4,\qquad G_2=T_2\overline{T_6},\qquad G_1=T_1\overline{T_3}+T_5\overline{T_7}}
$$

- Every thermometer entry drives **exactly one gate**: signals never split. That property is what makes Gray coding robust to metastability ([[#Metastability in an Array]]) and lets the Gray bits be pipelined with half as many latches per stage.
- Convert Gray to binary later, in clean digital logic.

### In a SerDes: the PAM4 Slicer Is a 2-Bit Flash

| $V_A\,V_B\,V_C$ (thermometer) | MSB | LSB |
|---|---|---|
| 111 | 1 | 1 |
| 011 | 1 | 0 |
| 001 | 0 | 1 |
| 000 | 0 | 0 |

- Three slicers at the three PAM4 thresholds give a 3-entry thermometer code ([[Comparators#PAM4 Needs Three Thresholds]]); Palermo's receiver lecture calls it a "2b flash ADC (3 comparators) for PAM4 symbol decisions".
- **MSB** = the middle slicer ($V_B$). **LSB** = $V_A\oplus V_B\oplus V_C$, the parity of the count. Lee et al. (JSSC 2015, 56 Gb/s) found stacked logic too slow at 56 Gb/s, so they flattened it: $V_A$, $V_B$, $V_C$ drive three identical CML differential pairs of alternating polarity into shared loads, so $\lvert V_{out}\rvert=I_{SS}R$ for every code. With $I_{SS}=2.5$ mA, inputs above about 300 mV give full swing.
- **ADC-based receivers** replace the slicers with a multi-bit ADC (after CTLE/AGC) and equalize in DSP (Zhang et al., DesignCon tutorial). Example: Harwood et al. (ISSCC 2007) used a 12.5 GS/s, 4.5-bit flash ADC in 65 nm with a 2-tap FFE and 5-tap DFE (Palermo lecture 8). The decoders above are exactly what such a front end needs. System side: [[Receivers]].

> [!tip] Remark
> Lee's LSB decoder computes the full-adder sum $S=A\oplus B\oplus D$ of [[#ONEs-Counter Decoder]], in current mode. It is a one-full-adder ONEs counter.

## Level 2: Static Errors: Offset and Input Capacitance

### Comparator Offset Sets DNL

```tikz title="Each comparator's offset shifts its own transition. The DNL of a step is the difference of the two offsets that bound it. After Razavi DC Figs. 13.13 and 13.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9.0,0) node[right]{$V_{in}$};
  \draw[->] (0,0) -- (0,4.6) node[above]{$D_{out}$};
  \draw[dashed,gray] (0,0.6) -- (2,0.6) -- (2,1.5) -- (4,1.5) -- (4,2.4) -- (6,2.4) -- (6,3.3) -- (8,3.3) -- (8,4.2) -- (8.6,4.2);
  \draw[thick] (0,0.6) -- (2,0.6) -- (2,1.5) -- (4.7,1.5) -- (4.7,2.4) -- (5.5,2.4) -- (5.5,3.3) -- (8,3.3) -- (8,4.2) -- (8.6,4.2);
  \foreach \x/\l in {2/{V_{r,j-1}},4/{V_{r,j}},6/{V_{r,j+1}}} { \draw[dotted] (\x,0) -- (\x,0.6); \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize]{$\l$}; }
  \draw[<->] (4,1.15) -- (4.7,1.15) node[midway,below,font=\scriptsize]{$V_{OS1}$};
  \draw[<->] (5.5,2.05) -- (6,2.05) node[midway,below,font=\scriptsize]{$V_{OS2}$};
  \draw[dotted] (4.7,2.4) -- (4.7,3.9); \draw[dotted] (5.5,3.3) -- (5.5,3.9); \draw[dotted] (2,1.5) -- (2,3.9);
  \draw[<->] (2,3.9) -- (4.7,3.9) node[midway,above,font=\scriptsize]{$1\,\text{LSB}+V_{OS1}$};
  \draw[<->] (4.7,3.9) -- (5.5,3.9);
  \node[font=\scriptsize,anchor=south] at (5.6,4.25) {$1\,\text{LSB}+V_{OS2}-V_{OS1}$};
  \draw[->,thin] (5.6,4.3) -- (5.15,3.95);
  \node[font=\scriptsize,anchor=west] at (6.3,1.0) {dashed: ideal};
  \node[font=\scriptsize,anchor=west] at (6.3,0.6) {solid: $V_{OS1}>0$, $V_{OS2}<0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{INL}_j=V_{OS,j},\qquad \text{DNL}_j=V_{OS,j}-V_{OS,j-1},\qquad \sigma_{DNL}=\sqrt2\,\sigma_{OS}}
$$

- One comparator alone with offset $V_{OS}$: DNL = INL = $V_{OS}$ at that transition.
- An offset approaching $\pm1$ LSB in one comparator merges two transitions: a **missing code**, whichever the sign (Razavi Ex. 13.5).
- Since DNL carries $\sqrt2$ and INL does not, **DNL sets the offset budget**. Typical design: $\sigma_{OS}<0.2$ LSB.

> [!tip] Remark
> "Offset" here is the comparator's input-referred offset from [[Comparators#Offset Budget of a Preamp and Latch]]: input-pair mismatch plus later stages divided by the gain in front of them. DNL and INL as such are defined in [[Data Converter Fundamentals]].

### Bubbles

```tikz title="Two ways to get a bubble (a ZERO between ONEs): one comparator's offset beyond 1 LSB (left), or two adjacent comparators clocked Delta T apart on a fast input (right). After Razavi DC Figs. 13.16 and 13.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % left: a thermometer with a bubble from offset, right: skew
  \foreach \y/\b in {0/1,0.6/1,1.2/0,1.8/1,2.4/0,3.0/0} { \node[draw,minimum size=0.5cm,fill=white] at (0,\y) {\b}; }
  \draw[fill=gray!35] (-0.25,0.95) rectangle (0.25,1.45); \node at (0,1.2) {0};
  \node[font=\scriptsize,anchor=west] at (0.45,1.2) {Comp$_j$: $V_{OS}=1.2$ LSB};
  \node[font=\scriptsize,anchor=west] at (0.45,1.8) {Comp$_{j+1}$: correct ONE};
  \node[font=\scriptsize,align=center] at (0,3.75) {bubble from\\ offset};
  \begin{scope}[xshift=5.2cm]
    \draw[->] (0,0) -- (4.4,0) node[right]{$t$};
    \draw[->] (0,-0.2) -- (0,3.3) node[above]{$V_{in}$};
    \draw[thick,domain=0.2:4.0,samples=30] plot (\x,{0.75*\x-0.1});
    \draw[dashed] (0,1.2) -- (4.2,1.2) node[right,font=\scriptsize]{$V_{r,j}$};
    \draw[dashed] (0,1.9) -- (4.2,1.9) node[right,font=\scriptsize]{$V_{r,j+1}$};
    \draw[dotted] (1.5,0) node[below,font=\scriptsize]{$t_1$} -- (1.5,1.025);
    \fill (1.5,1.025) circle (1.6pt);
    \draw[dotted] (2.75,0) node[below,font=\scriptsize]{$t_1+\Delta T$} -- (2.75,1.96);
    \fill (2.75,1.96) circle (1.6pt);
    \node[font=\scriptsize,anchor=west,align=left] at (4.6,0.5) {Comp$_j$ samples early: ZERO\\Comp$_{j+1}$ samples late: ONE};
    \node[font=\scriptsize] at (2,3.75) {bubble from clock skew};
  \end{scope}
\end{circuitikz}
\end{document}
```

- An offset is random, so with $\sigma_{OS}=0.2$ LSB some comparator in a large array can still exceed 1 LSB. Then with $V_{in}$ just above its threshold it outputs ZERO while the one above outputs ONE: a **bubble**.
- How much error a bubble causes depends entirely on the decoder ([[#Level 4 Bubble Correction]]). The "correct" reading in this case is to treat the bubble as a ONE.
- Carusone lists further causes: metastability, noise, crosstalk, limited bandwidth. Bubbles cluster near the transition point.

### Input Capacitance Grows as $2^{3N}$

$$
\boxed{C_{in,ADC}\propto2^N\cdot WL\propto2^{3N}\quad\text{(fixed input range, no offset cancellation)}}
$$

- One more bit at the same input range halves the LSB, so the offset must halve, so each pair's $WL$ (hence $C_{GS}$) must quadruple (Pelgrom). Twice the comparators, four times the capacitance each: **8× per bit**.
- A big $C_{in}$ needs a power-hungry, nonlinear buffer. So offset cancellation is used from about **4 bits** up, letting the input pairs stay small.

> [!tip] Remark
> The 4× area per halving of offset is $\sigma(\Delta V_{TH})=A_{VT}/\sqrt{WL}$ from [[Nonlinearity and Mismatch#Where Mismatch Comes From Averaging]]. The same law makes this note's $2^{3N}$ and the comparator note's "offset below ~10 mV needs trim".

## Level 3: Dynamic Errors

### Metastability in an Array

$$
\boxed{P_{error}=\beta\exp\!\left(-\frac{T_{CK}}{2\tau_{reg}}\right)\ \ (T_{CK}/2\text{ to regenerate})}\qquad
\boxed{\text{two pipelined latches: } V_{XY}=V_0\,e^{T_{CK}/\tau_{reg}}}
$$

- A comparator with $V_{in}\approx V_{r,j}$ may be undecided at the end of the cycle. Which way it resolves does not matter (the input is at the threshold); what matters is that **two gates reading the same undecided node may disagree**.
- In a ROM decoder, gates $G_{j-1}$ and $G_j$ can both fire, activating two rows; for a mid-scale input that can give 0000 instead of 1000, an error of half of full scale. These are the "sparkle codes" of [[Comparators#Why It Is Inevitable]].
- **Fix 1, pipelining.** A second regenerative latch on the opposite clock phase regenerates for another $T_{CK}/2$; the exponent doubles, so $P_{error}$ is squared: $10^{-7}\to10^{-14}$ (Razavi Ex. 13.6). Only a *regenerative* second latch does this; a plain clocked inverter latch gives linear gain and only a proportional improvement. Costs: power and clock load. Latches between the AND gates and the ROM do not help: the split has already happened.
- **Fix 2, Gray coding.** Every entry drives one gate, so an undecided $T_{j+1}$ is read once: the output is the code for either $j$ or $j+1$ ONEs, an error of **1 LSB** at most (Razavi Ex. 13.7).

> [!tip] Remark
> This is the exponential law $T/\tau_{reg}$ of [[Comparators#Level 4 Metastability]], and the two-latch result is the master-slave case of Evans' formula in [[Comparators#Evans' Error-Rate Formula and Cascaded Latches]].

> [!note]- Detail: Ex. 13.6 worked out
> With $\beta e^{-T_{CK}/(2\tau_{reg})}=10^{-7}$, doubling the regeneration time doubles the exponent: $\beta e^{-T_{CK}/\tau_{reg}}=\beta\left(e^{-T_{CK}/(2\tau_{reg})}\right)^2=\beta(10^{-7}/\beta)^2=10^{-14}/\beta$. With $\beta\approx1$, $10^{-14}$. (Razavi's printed Eq. 13.14 omits $\beta$ that the text then uses; the result is unchanged for $\beta\approx1$.)

### Kickback Onto the Ladder

```tikz title="Every comparator injects roughly the same kickback current into its tap. The ladder is grounded (for ac) at both ends, so the disturbance is a parabola peaking at the midpoint. After Razavi DC Fig. 13.21 and Eqs. (13.22)-(13.23)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % horizontal ladder, ends at AC ground (V_REF and ground)
  \draw (0,0) node[ground]{} -- (0,0.8) to[R,l=$R_u$] (2,0.8) to[R,l=$R_u$] (4,0.8) -- (4.4,0.8);
  \draw[dashed] (4.4,0.8) -- (6.2,0.8);
  \draw (6.2,0.8) to[R,l=$R_u$] (8.2,0.8) to[R,l=$R_u$] (10.2,0.8) -- (10.2,0) node[ground]{};
  \node[font=\scriptsize,anchor=west] at (10.3,0.2) {$V_{REF}$ (ac ground)};
  \foreach \x/\l in {2/{I_1},4/{I_2},6.2/{I_{m-2}},8.2/{I_{m-1}}} {
    \draw (\x,0.8) node[circ]{} to[I,l_=$\l$] (\x,2.4);
  }
  \node[font=\scriptsize,align=center] at (4.6,2.85) {kickback of every comparator, $I_j\approx I_u$};
  % profile
  \begin{scope}[yshift=-3.6cm]
    \draw[->] (0,0) -- (9.6,0) node[right]{tap $j$};
    \draw[->] (0,0) -- (0,2.4) node[above]{$V_j$};
    \draw[thick,domain=0:9.2,samples=60] plot (\x,{1.9*\x*(9.2-\x)/(4.6*4.6)});
    \draw[dashed] (4.6,0) node[below,font=\scriptsize]{$m/2$} -- (4.6,0.35); \draw[dashed] (4.6,1.05) -- (4.6,1.9);
    \node[below,font=\scriptsize] at (9.2,0) {$m$};
    \node[below,font=\scriptsize] at (0,0) {$0$};
    \node[font=\scriptsize,anchor=west] at (4.8,2.1) {$V_{max}=\dfrac{m^2}{8}I_uR_u$};
    \node[font=\scriptsize] at (4.6,0.7) {$V_j=\dfrac{j(m-j)}{2}I_uR_u$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_j=\frac{j(m-j)}{2}I_uR_u,\qquad V_{max}=\frac{m^2}{8}I_uR_u\ \text{at } j=\tfrac m2}
$$

- Kickback is the charge each comparator's switching pulls through its input capacitances ([[Comparators#Kickback]]). In an array, $2^N$ of them pull on one ladder at the moment one of them makes a critical decision. It can corrupt the present sample and, if it decays slowly, the next one.
- $V_{max}\propto m^2$: **4× per bit** at a fixed $I_uR_u$. Serious above about 4 bits; the 6-bit example of the [[#Spec translation]] gives 1 V.
- **Faster clock → lower $R_u$ → more ladder power** (Razavi Ex. 13.8): the disturbance has less time to decay before the next decision.
- Carusone's **ladder bowing** is the static version: DC comparator input currents (bipolar comparators) need a ladder current about **two orders of magnitude** larger; the error is largest at the center tap, which can be forced to its correct value.

> [!note]- Derivation: the kickback parabola
> Treat the injections as current sources $I_1=\dots=I_{m-1}=I_u$ (the injecting capacitors' impedance is much larger than the ladder's Thevenin resistance). Look at tap $j$. To its left, $j$ resistors to ground with sources at taps $1\dots j-1$; its Norton resistance is $jR_u$ and the short-circuit current from source $k$ is $I_k\cdot kR_u/(jR_u)$, summing to
> $$I_{Nort}=\frac{I_u}{j}\sum_{k=1}^{j-1}k=\frac{j-1}{2}I_u.$$
> To its right, by symmetry, $(m-j)R_u$ and $\frac{m-j-1}{2}I_u$. Add $I_j=I_u$ at the node itself. The total injected current is $\left(\frac{j-1}{2}+\frac{m-j-1}{2}+1\right)I_u=\frac m2I_u$, and it flows into $jR_u\parallel(m-j)R_u=\frac{j(m-j)}{m}R_u$:
> $$V_j=\frac m2I_u\cdot\frac{j(m-j)}{m}R_u=\frac{j(m-j)}{2}I_uR_u.$$
> Maximized at $j=m/2$: $m^2I_uR_u/8$. The same picture with a capacitor bypassing the midpoint makes the worst taps the quarter points, with a quarter of the disturbance (each half is now an $m/2$ ladder: $(m/2)^2/8=m^2/32$).

> [!note]- Extension: why speed costs ladder power (Zettelkasten 22i1)
> The tap disturbance decays through the ladder's Thevenin resistance $R_{th}=\frac{j(m-j)}{m}R_u$ (at most $mR_u/4$, at the midpoint) and the comparator input capacitance $C_t$ on the tap: $\tau=R_{th}C_t$. The residual at the next decision is $V_j(0)e^{-\Delta t/\tau}$ with $\Delta t\propto T_{CK}$. Holding it under a fixed fraction of an LSB at a higher rate means $\tau\propto1/f_{CK}$, so (with $C_t$ fixed by the comparator) $R_u\propto1/f_{CK}$, and the ladder power $P=V_{REF}^2/(mR_u)\propto f_{CK}$. A lower-capacitance comparator is the cheaper way out. The peak $V_{max}$ itself does not depend on $f_{CK}$; only the time it has to decay does.

### Fixing Kickback

```tikz title="Two kickback fixes. (a) An unclocked differential pair in front of the latch: kickback must now cross C_GD1. (b) A bypass capacitor at the ladder midpoint absorbs the lumped kickback, half of the total. After Razavi DC Figs. 13.23-13.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) preamp in front
  \draw (0,4.4) to[R,l_=$R_u$] (0,2.6) to[R,l_=$R_u$] (0,0.8);
  \draw (0,2.6) node[circ]{} node[left]{$V_{r,j}$} -- (1.0,2.6);
  \draw (1.0,2.6) node[nmos,anchor=G](M1){};
  \node[right,font=\scriptsize] at (M1.east) {$M_1$};
  \draw (M1.D) to[R,l_=$R_D$] ++(0,1.6) node[above]{$V_{DD}$};
  \draw (M1.D) node[circ]{} -- ++(1.2,0) node[right]{$A\to$ latch};
  \draw (M1.S) -- ++(0,-0.3) node[below,font=\scriptsize]{tail $I_{SS}$ (unclocked)};
  \draw[->,thick,gray] (2.9,3.0) .. controls (2.2,2.9) and (2.0,2.8) .. (1.8,2.75);
  \node[font=\scriptsize,align=center,gray] at (3.6,2.3) {kickback must\\ cross $C_{GD1}$};
  \node[font=\scriptsize] at (1.4,-0.6) {(a) continuous-time preamp};
  % (b) bypass cap at ladder midpoint
  \begin{scope}[xshift=7cm]
    \draw (0,5.0) node[above]{$V_{REF}$} to[R,l=$\tfrac m2R_u$] (0,2.5) to[R,l=$\tfrac m2R_u$] (0,0) node[ground]{};
    \draw (0,2.5) node[circ]{} node[below left]{$P$} -- (1.4,2.5) to[C,l=$C_1$] (1.4,0.8) node[ground]{};
    \draw (0,2.5) -- (-1.6,2.5);
    \draw (-1.6,2.5) to[I,l_=$\tfrac m2 I_u$] (-1.6,4.2);
    \node[font=\scriptsize,align=left,anchor=west] at (2.0,0.5) {$\Delta V_P=\dfrac{I_0\Delta T}{C_1}$};
    \node[font=\scriptsize] at (0.2,-0.9) {(b) lumped ladder + bypass capacitor};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V_P=\frac{I_0\,\Delta T}{C_1}}
$$

- **Preamp (reverse isolation).** An unclocked pair in front of the latch passes kickback back only through $C_{GD1}$, in series with the latch's capacitances. It also protects the *input* side. Cost: its power can exceed the comparator's, because nodes $A$, $B$ need bandwidth (small $R_D$, large $I_{SS}$) at a gain of only 2 or 3. Carusone (who calls kickback **flashback**): "most modern comparators have one or two stages of continuous-time buffering and/or preamplification".
- **Bypass capacitors** on the ladder midpoint (then the quarter points, ...). The 6-bit example needs 160 pF: a lot of area. They do nothing for the input.
- **The input buffer** sees the sum of all kickback currents: 12.8 mA in the 6-bit example. A source follower biased at 1 mA cannot sink or source that; its output drops when the comparators pull and rises (even above $V_{DD}$) when they push (Razavi Ex. 13.9). Only the preamp approach fixes this.
- Carusone also matches the two input impedances with a **second, matched resistor string** carrying $V_{in}$ to the comparators' other inputs. It also cures bowing, but delays $V_{in}$ differently to each comparator, which the clock routing must then match.

> [!note]- Derivation: sizing the bypass capacitor
> Rewrite $V_{max}=\frac m8 m I_uR_u=\left(\frac m4R_u\right)\left(\frac m2I_u\right)$: as if half the total kickback, $\frac m2I_u$, flowed out of the midpoint into the Thevenin resistance of two $\frac m2R_u$ halves in parallel. That lumped model is Fig. (b). Approximate the kickback as a pulse pair $\pm I_0$ of width $\Delta T$. If $C_1$ is large enough to hold $V_P$ nearly constant, the pulse flows into $C_1$: $\Delta V_P=I_0\Delta T/C_1$. With $I_0=32\times100\ \mu\text{A}$, $\Delta T=50$ ps, $\Delta V_P\le1$ mV: $C_1\ge160$ pF. With $C_1$ present the lumped model is only rough (Razavi footnote 7).

### Input Feedthrough to the Ladder

- Without a front-end sampler, a fast input couples through each pair's series $C_{GS1}C_{GS2}/(C_{GS1}+C_{GS2})$ into the ladder: a current $\approx V_{in}\omega_{in}C_{eq}$ per comparator, the same parabola as kickback but **signal-dependent**, so it distorts.
- Same cures: lower $R_u$ or bypass capacitors.

### Clock Skew Makes Bubbles

$$
\boxed{\Delta T<\frac{1}{2^{N-1}\,\omega_{in}}}
$$

- If comparator $j$ samples at $t_1$ and $j+1$ at $t_1+\Delta T$, and the input moves by more than an LSB in between, $j$ can say ZERO while $j+1$ says ONE: a bubble ([[#Bubbles]] figure, right).
- 6 bits, 10 GS/s, $f_{in}=5$ GHz: $\Delta T<1$ ps (Razavi). Carusone: an 8-bit converter with $V_{ref}=2$ V and a 250 MHz, 1 V-peak sine (peak slope 1570 V/µs) moves one LSB in **5 ps**, about the delay of 500 µm of interconnect. Route clock and $V_{in}$ together with matched delays; mismatched loads or preamp phase shifts cause skew too.
- The "correct" code here is ambiguous by ±1 (either comparator can be blamed), which favors a ONEs-counting decoder.

> [!tip] Remark
> This is aperture jitter's deterministic cousin: [[Sampling Circuits#Aperture Jitter]] bounds a *random* timing error by the same slope argument, $\sigma_t<\text{LSB}/(\text{peak slope})$.

### Input-Dependent Delay

$$
\boxed{\text{small input: } T_{D1}=R_DC_D\qquad\text{large input (full steering): } T_{D2}=R_DC_D\ln2}
$$

- The preamp's output pole delays the signal, and the delay **depends on amplitude**: linear operation gives $R_DC_D$, full current steering gives $R_DC_D\ln2$. A linear time-invariant system cannot do that.
- With a full-scale sine, comparators near the top and bottom of the array see a lower slew rate than those in the middle, so the peaks and valleys are effectively sampled later. The distributed sample is **distorted**; quantify it with transistor-level simulation (Razavi, after van de Plassche and Baltus).

> [!note]- Derivation: the two delays
> **Small signal.** A one-pole stage shifts a sine by $\theta=-\tan^{-1}(R_DC_D\omega_0)\approx-R_DC_D\omega_0$. As a time delay, $T_{D1}=\frac{\theta}{2\pi}T_0=R_DC_D$, independent of amplitude and frequency.
>
> **Large signal.** If the input steers the tail fully, the drain currents are square waves; each edge produces an $e^{-t/(R_DC_D)}$ response, which crosses its midpoint after $R_DC_D\ln2$.

> [!warning] Unverified: a bandwidth bound from the delay spread
> Razavi gives no bound, only "simulate". A first-order estimate (mine): the delay can vary by up to $(1-\ln2)R_DC_D\approx0.31R_DC_D$ across the array, which acts like a skew, so keeping $0.31R_DC_D<1/(2^{N-1}\omega_{in})$ sets a minimum preamp bandwidth. Treat it as a starting point for simulation, not a sign-off rule.

### Supply and Substrate Noise; Latch Recovery

- **Supply noise** (Carusone): with $V_{ref}=1$ V and 6 bits the LSB is 15.6 mV, yet supply noise near 100 mV is hard to avoid at GHz clocks. Shield clocks from substrate and analog circuits, run differential clocks together, power the preamps from the analog supply and the latches from the digital one, use on-chip bypass (with small series resistors to damp package resonance).
- **Latch-to-track recovery:** after a decision, the latch must recover in time to track a small input of the opposite sign. Keep internal time constants small, latch gain modest (2 to 4), or short the differential nodes briefly after latching (the equalize switch of [[Comparators#Reset Clears Memory]]).

## Level 4: Bubble Correction

| Decoder | Single bubble causes | Fix / tolerance |
|---|---|---|
| ROM, 2-input gates | Two rows active: e.g. 011111 and 100001 give 000001, about **half of full scale** (6 bits) | **3-input gates** $T_jT_{j+1}T_{j+2}=100$: one row, bubble read as ONE (code = ONEs + 1). Two bubbles (offset > 2 LSB) need 4-input gates |
| Gray | Error of **±2 LSB** (Razavi Table 13.1) | Bounded by construction |
| MUX | Output near the thermometer value (1110100 → 011; 1111010 → 110) | Similar to the 3-input AND method |
| ONEs counter | Counts ONEs regardless of position | Most tolerant; most logic |

- Carusone's other bubble defenses: allow bubbles in the 2 LSBs but find the MSBs from transitions between every **fourth** comparator (Gendai), so bubbles within 4 places of the transition do no harm; build **two encoders** (AND-type and OR-type) whose errors are equal and opposite and **average** them (add, drop the LSB) (Ito); or a **voting slave latch** whose value also depends on its two neighbors' master latches, so a lone dissenter is overruled, at no extra power since it reuses the slave's current (van Valburg).

> [!tip] Remark
> A 3-input gate is a majority vote over a window, and the voting slave latch is the same vote moved into the analog latch. The ONEs counter needs neither because counting ignores order.

## Level 5: Fully-Differential Flash

### Why, and What the Comparators Must Do

- Differential inputs reject common-mode noise, lower distortion and **double the analog LSB** (the input swing doubles), so each comparator may have twice the offset.
- A differential $N$-bit flash compares $V_{in}^+-V_{in}^-$ (from $-V_{FS}$ to $+V_{FS}$) against $2^N-1$ differential references, e.g. $-7$ to $+7$ LSB for 4 bits, with code 1000 at zero input. Razavi Ex. 13.10: 0.5 V single-ended peak-to-peak per side gives 1 V differential, LSB $=62.5$ mV, references from $-437.5$ to $+437.5$ mV.
- A two-input comparator cannot compare a differential input to a differential reference, so a **subtractor** is needed in front.

### Subtraction in the Current Domain

```tikz title="Two ways to form (V_in+ - V_in-) - (V_r1 - V_r2). (a) Two differential pairs sharing loads, each pairing one input with one reference so the critical comparator stays linear. (b) A switched-capacitor network in front of a single pair. After Razavi DC Figs. 13.38 and 13.43(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) current domain: two pairs share RD loads
  \draw (0,0) node[nmos](M1){}; \draw (1.6,0) node[nmos,xscale=-1](M2){};
  \draw (5.6,0) node[nmos](M3){}; \draw (7.2,0) node[nmos,xscale=-1](M4){};
  \node[left] at (M1.G) {$V_{in}^+$}; \node[right] at (M2.G) {$V_{r1}$};
  \node[left] at (M3.G) {$V_{r2}$}; \node[right] at (M4.G) {$V_{in}^-$};
  \draw (M1.S) -- (M2.S); \draw (M3.S) -- (M4.S);
  \draw ($(M1.S)!0.5!(M2.S)$) to[I,l_=$I_{SS}$] ++(0,-1.4) node[ground]{};
  \draw ($(M3.S)!0.5!(M4.S)$) to[I,l=$I_{SS}$] ++(0,-1.4) node[ground]{};
  \draw (M1.D) -- ++(0,0.4) coordinate(X) -- ++(5.6,0) -- (M3.D);
  \draw (M2.D) -- ++(0,0.8) coordinate(Y) -- ++(5.6,0) -- (M4.D);
  \draw (X) -- ++(-0.6,0) to[R,l=$R_D$] ++(0,1.8) node[above]{$V_{DD}$};
  \draw ($(M4.D)+(0,0.8)$) -- ++(0.6,0) to[R,l_=$R_D$] ++(0,1.4) node[above]{$V_{DD}$};
  \node[font=\scriptsize] at (-0.25,0.95) {$X$}; \node[font=\scriptsize] at (8.1,1.05) {$Y$};
  \node[font=\scriptsize,align=center] at (3.6,-3.3) {(a) current domain: pairs see $V_{in}^+-V_{r1}$ and $V_{in}^--V_{r2}$,\\ both small for the critical comparator};
  % (b) voltage domain
  \begin{scope}[xshift=11.6cm,yshift=0.6cm]
    \draw (-1.6,1.2) node[left]{$V_{in}^+$} to[nos,l=$S_3$] (0,1.2);
    \draw (-1.6,0.2) node[left]{$V_{r1}$} to[nos,l_=$S_5$] (0,0.2) -- (0,1.2);
    \draw (0,0.7) to[C,l=$C_1$] (1.6,0.7) node[circ]{} node[below right]{$A$};
    \draw (1.6,0.7) to[nos,l_=$S_1$] (1.6,2.2) node[above]{$V_{CM}$};
    \draw (-1.6,-1.4) node[left]{$V_{in}^-$} to[nos,l=$S_4$] (0,-1.4);
    \draw (-1.6,-2.4) node[left]{$V_{r2}$} to[nos,l_=$S_6$] (0,-2.4) -- (0,-1.4);
    \draw (0,-1.9) to[C,l_=$C_2$] (1.6,-1.9) node[circ]{} node[above right]{$B$};
    \draw (1.6,-1.9) to[nos,l=$S_2$] (1.6,-3.4) node[below]{$V_{CM}$};
    \draw (1.6,0.7) -- (2.6,0.7); \draw (1.6,-1.9) -- (2.6,-1.9);
    \draw[fill=gray!8] (2.6,1.0) -- (2.6,-2.2) -- (3.8,-0.6) -- cycle;
    \node[font=\scriptsize,align=center] at (3.0,-0.6) {cmp};
    \node[font=\scriptsize,align=center] at (1.1,-4.4) {(b) voltage domain: sample $V_{in}$ ($S_{1\text{--}4}$ on, $A,B$ at $V_{CM}$),\\ then switch to $V_r$: $\Delta(V_A-V_B)=-(V_{in}^+-V_{r1})+(V_{in}^--V_{r2})$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{I_1-I_2\propto(V_{in}^+-V_{r1})-(V_{in}^--V_{r2})=(V_{in}^+-V_{in}^-)-(V_{r1}-V_{r2})}
$$

- **Pair the input with a reference**, not input with input. Pairing $V_{in}^+$ with $V_{in}^-$ and $V_{r1}$ with $V_{r2}$ (Razavi Fig. 13.36) puts up to 500 mV across each pair for the critical comparator, turning both fully off ($G_m\to0$): its decision carries no information. Pairing $V_{in}^+$ with $V_{r1}$ (Fig. 13.38) gives, for $V_{in}^\pm=980/530$ mV and $V_{r1,2}=970/532.5$ mV, only 10 mV and 2.5 mV across the pairs: full $g_m$.
- Comparators far from their threshold do saturate (Ex. 13.11). That is fine: their decision is not critical.

**Three costs:**

| Cost | Size | Why |
|---|---|---|
| Offset | $\sigma=\sqrt2\,\sigma_{12}$, about **40 % more** (plus load mismatch) | Two pairs contribute |
| Gain at equal power | $g_mR_D$ with $g_m$ of a device at half the current | A single pair with both tails' current has a larger $g_m$ |
| Input range | Single-ended range about **0.3 V** at $V_{DD}=1$ V | $V_{CM}\ge V_{GS}+V_{tail}\approx0.5$ V; $V_{CM}\le V_{DD}-R_D\frac{I_{SS1}+I_{SS2}}{2}+V_{TH}\approx0.8$ V for a 0.5 V load drop (gain 3–4) |

- **Ladder and input CM must track** (Razavi Ex. 13.12): a ladder with the right span but shifted down by 0.4 V puts large voltages across both pairs of the critical comparator, so they steer fully and the decision is meaningless.

> [!tip] Remark
> The input-CM window is [[Differential Amplifiers#Input Common-Mode Range]]: tail headroom below, the drain's $V_{DD}-I R_D$ plus $V_{TH}$ above. It is also where the gm/ID of step 6 in the [[#Spec translation]] example comes from: the load drop is fixed by this window.

### Subtraction in the Voltage Domain

$$
\boxed{\Delta(V_A-V_B)=-(V_{in}^+-V_{r1})+(V_{in}^--V_{r2}),\qquad \Delta V=-(V_{in}^+-V_{r1})\frac{C_1}{C_1+C_p}}
$$

- Sample $V_{in}^\pm$ on $C_1$, $C_2$ with the right plates at $V_{CM}$ ($S_1$–$S_4$ on); then switch the left plates to $V_{r1}$, $V_{r2}$ ($S_5$, $S_6$). Charge conservation moves $A$ and $B$ by the subtraction result.
- **Advantages:** a single pair (less offset, more $g_m$ per power), rail-to-rail input via capacitive coupling, insensitive to the input-ladder CM difference, and it **samples** the input (no front-end sampler needed).
- **Sizing:** parasitics $C_p$ at $A$ (switch and input pair) attenuate the result: make $C_{1,2}$ **5 to 10 times** $C_p$ (17 % or 9 % loss).
- **Weakness:** it subtracts only the differential part; an input CM shift $\Delta V_{CM}$ passes straight through, so the comparator input sits at $V_{CM}-\Delta V_{CM}$ and must still work there (Ex. 13.14). And the input sees $C_1$ (5 to 10 times $C_{GS}$; nearer 10 since a pair only presents about $C_{GS}/2$) on every comparator: the **largest input capacitance** of all options. $S_1$, $S_2$ should open before $S_3$, $S_4$ (extra clock phases).
- **Reverse the sequence** (sample the references first, then switch to the input): the input now sees $C_1$ in series with $C_p$, far smaller. But the network no longer samples (a front-end S/H is needed again), and switching $C_1$ onto the ladder kicks the taps hard (more bypass capacitance).

> [!tip] Remark
> This is bottom-plate-style charge redistribution from [[Switched-Capacitor Circuits]]; the 5–10× rule is the same capacitive-divider loss as any SC stage with parasitic input capacitance. The input offset storage of [[Nonlinearity and Mismatch#Input Offset Storage]] fits the same network.

### U-Shaped Ladder

- Feeding $2^N-1$ differential references from one straight ladder needs crossing wires. **Fold the ladder** into a U with twice the resistors (0.5 LSB each): comparator 1 taps $N_{15}$/$N_1$ ($-7$ LSB), comparator 2 taps $N_{14}$/$N_2$ ($-6$ LSB), and so on; the upper half swaps its reference inputs to get $+1$ to $+7$ LSB. Each comparator plus two resistors becomes a **repeatable module**.
- Put the comparators on one side of the U to shorten the thermometer routing; it also places the first and last comparators next to each other, which shortens the MUX decoder's long pairings.

## Level 6: Fewer Comparators

### Interpolation

```tikz title="Each preamp's outputs cross at its own threshold. V_X1 and V_Y2 cross halfway between V_r1 and V_r2, so a latch on that pair adds a threshold with no extra input pair. After Razavi DC Fig. 13.48 and Carusone Fig. 17.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.4,0) node[right]{$V_{in}$};
  \draw[->] (0,0) -- (0,3.6) node[above]{preamp outputs};
  % pair 1 crosses at x=2.5, pair 2 at x=4.5; tanh-like
  \def\h{1.6} \def\a{1.1}
  \draw[thick,domain=0.2:7,samples=60] plot (\x,{\h+\a*tanh(1.1*(\x-2.5))}) node[right,font=\scriptsize]{$V_{Y1}$};
  \draw[thick,domain=0.2:7,samples=60] plot (\x,{\h-\a*tanh(1.1*(\x-2.5))}) node[right,font=\scriptsize]{$V_{X1}$};
  \draw[thick,dashed,domain=0.2:7,samples=60] plot (\x,{\h+\a*tanh(1.1*(\x-4.5))}) node[above right,font=\scriptsize]{$V_{Y2}$};
  \draw[thick,dashed,domain=0.2:7,samples=60] plot (\x,{\h-\a*tanh(1.1*(\x-4.5))}) node[below right,font=\scriptsize]{$V_{X2}$};
  \foreach \x/\l in {2.5/{V_{r1}},3.5/{V_m},4.5/{V_{r2}}} { \draw[dotted] (\x,0) node[below,font=\scriptsize]{$\l$} -- (\x,3.0); }
  \fill (2.5,\h) circle (1.6pt); \fill (4.5,\h) circle (1.6pt);
  \fill (3.5,{\h-\a*tanh(1.1)}) circle (2pt);
  \node[font=\scriptsize,anchor=north] at (3.5,{\h-\a*tanh(1.1)-0.35}) {$V_{X1}=V_{Y2}$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.1,3.35) {latch on $(X_1,Y_2)$ fires at $V_m=\tfrac{V_{r1}+V_{r2}}2$: a threshold with no input pair};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{X1}=V_{Y2}\ \text{at}\ V_m=\frac{V_{r1}+V_{r2}}{2}}
$$

- An interpolate-by-$k$ flash has $2^N/k$ input pairs and $2^N$ latches. The input capacitance (and the number of accurate references) drops by $k$; power drops slightly. Latches still number $2^N$.
- **Only the crossings matter.** For linearity the interpolated signals need only cross the latch threshold at the right inputs, which holds if the preamp outputs are **linear between adjacent thresholds**. Preamps away from the input saturate, so the latches only need signs.
- Carusone's 4-bit example interpolates by 4 with resistor strings between preamp outputs, and adds **series resistors** ($R/4$) so every latch sees the same source impedance and hence the same delay (van de Plassche). **Current-mode interpolation** by 3 uses mirrors with 2:1 and 1:2 width ratios: $I_{2a}=\tfrac23I_1+\tfrac13I_2$, $I_{2b}=\tfrac13I_1+\tfrac23I_2$, giving one third the input capacitance (Ex. 17.10). Capacitive interpolation also works.
- Requires a real preamp in every comparator; a bare StrongARM has no continuous output to interpolate.

> [!tip] Remark
> The preamp here is a gain stage whose output must be linear over one LSB pitch, a tighter linearity spec than for a lone comparator's preamp. Its large-signal curve is the $\tanh$-like characteristic of [[Differential Amplifiers#Large-Signal Characteristic]].

### Folding

```tikz title="Folding. (a) One folding block of a 4-bit folder with folding rate 4 crosses its latch threshold four times, so one latch resolves four thresholds. (b) The simplest fold: a polarity detector routes the input so the flash always sees a positive value. After Carusone Fig. 17.35 and Razavi DC Fig. 13.49."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) Carusone folding block outputs, folding rate 4, 4 blocks offset by 1/16
  \draw[->] (0,0) -- (8.6,0) node[right]{$V_{in}$};
  \draw[->] (0,0) -- (0,2.1) node[above]{$V_1$};
  \draw[thick] (0,0.2) -- (0.8,0.2) -- (1.2,1.6) -- (2.8,1.6) -- (3.2,0.2) -- (4.8,0.2) -- (5.2,1.6) -- (6.8,1.6) -- (7.2,0.2) -- (8.0,0.2);
  \draw[dashed] (0,0.9) -- (8.2,0.9) node[right,font=\scriptsize]{latch threshold};
  \foreach \x/\l in {1/{\tfrac4{16}},3/{\tfrac8{16}},5/{\tfrac{12}{16}},7/{1}} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize]{$\l$}; }
  \node[font=\scriptsize,align=left,anchor=west] at (0.2,2.55) {(a) one folding block, folding rate 4: four zero crossings, one latch};
  % (b) polarity detector
  \begin{scope}[yshift=-4.4cm]
    \draw[->] (0,1.5) -- (8.6,1.5) node[right]{$V_{in}^+-V_{in}^-$};
    \draw[->] (4.1,0) -- (4.1,3.2) node[above]{$V_F^+-V_F^-$};
    \draw[thick] (0.3,3.0) -- (4.1,1.5) -- (7.9,3.0);
    \node[font=\scriptsize,align=left,anchor=west] at (0.2,-0.5) {(b) Razavi: a front-end polarity detector swaps the inputs so the flash always sees a positive input;};
    \node[font=\scriptsize,align=left,anchor=west] at (0.2,-0.9) {\phantom{(b) }its decision is the MSB, and the comparator count drops from about $2^N$ to $2^N/2+1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Folding** reuses latches across MSB ranges: an analog **folding block** (cross-coupled differential pairs, $V_{out}$ high between $V_{r1}$–$V_{r2}$ and $V_{r3}$–$V_{r4}$) produces an output that crosses the threshold once per sub-range. The LSBs come from a few folding blocks, the MSBs from a coarse converter at the same time. Like a two-step converter, but with analog preprocessing instead of an accurate DAC and gain stage.
- Carusone's 4-bit example (folding rate 4): 8 latches instead of 16 (4 for the MSBs, 4 for the LSBs). The LSB thermometer code inverts in alternate MSB regions (0000 → 1111 rising, then 1110 → 0000). The MSBs can be taken from internal signals of the folding blocks (Ex. 17.11).
- **Frequency multiplication:** a folding block's output runs at $f_{in}$ times the folding rate. That limits the practical folding rate.
- **Input capacitance is not reduced:** the input still drives $2^N$ transistors. So folding is combined with interpolation. Van Valburg's 8-bit folder: four blocks of folding rate 8, offset by $1/32$ V, interpolated by 8 with resistor strings for crossings every $1/256$ V, using **32 latches**, plus the voting bubble correction.
- **Razavi's polarity detector** is the minimal fold: a front-end comparator ($CK_1$) detects the sign of $V_{in}^+-V_{in}^-$ and swaps the inputs so the flash only sees positive values; it delivers the MSB, and the flash ($CK_2$) the rest. Comparators drop from about $2^N$ to $2^N/2+1$, halving input capacitance, power and complexity. Cost: **more than 2× slower** (the front comparator must resolve 0.5 LSB and switch, then $V_F$ must settle into the flash's input capacitance) and the front comparator's offset must stay under 1 LSB.

### Two-Step (Subranging)

```tikz title="An 8-bit two-step ADC with digital error correction: a 4-bit coarse flash, an accurate DAC and subtractor, a gain of 8 and a 5-bit fine flash with one bit of overlap. After Carusone Fig. 17.30."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,thick,fill=gray!8,minimum height=1cm,align=center,font=\scriptsize}]
  \node[blk] (sh1) at (0,0) {S/H$_1$\\ 8-b acc.};
  \node[blk] (adc1) at (2.4,0) {4-bit\\ MSB flash\\ (4-b acc.)};
  \node[blk] (dac) at (5.0,0) {4-bit DAC\\ (8-b acc.)};
  \node[draw,circle,thick] (sum) at (7.0,0) {$-$};
  \node[blk] (amp) at (8.6,0) {gain\\ $\times8$};
  \node[blk] (adc2) at (10.8,0) {5-bit\\ LSB flash};
  \node[blk] (dig) at (6.4,-2.0) {digital\\ error correction};
  \draw[->] (-1.4,0) node[left]{$V_{in}$} -- (sh1);
  \draw[->] (sh1) -- (adc1); \draw[->] (adc1) -- (dac); \draw[->] (dac) -- node[above,font=\scriptsize]{$V_1$} (sum);
  \draw[->] (sum) -- node[above,font=\scriptsize]{$V_q$} (amp); \draw[->] (amp) -- (adc2);
  \fill (0.8,0) circle (1.5pt); \draw[->] (0.8,0) -- (0.8,1.2) -- (7.0,1.2) node[above,font=\scriptsize]{S/H$_2$ copy of $V_{in}$} -- (sum);
  \draw[->] (adc1.south) |- node[pos=0.75,above,font=\scriptsize]{4 bits} (dig.west);
  \draw[->] (adc2.south) |- node[pos=0.75,above,font=\scriptsize]{5 bits} (dig.east);
  \draw[->] (dig.south) -- ++(0,-0.6) node[below]{8 bits};
\end{circuitikz}
\end{document}
```

- Coarse flash → DAC → subtract → amplify the residue $V_q$ → fine flash. An 8-bit converter as 4 + 4 bits uses **32 comparators instead of 256**, with less area, power and input capacitance; throughput approaches a flash's, latency is longer.
- **Without correction**, every block needs 8-bit accuracy. **With correction**, the fine flash gets one extra bit (5 bits) and the gain drops to 8, so the residue may overrange: the coarse flash then needs only **4-bit accuracy**. S/H$_1$, S/H$_2$, the DAC and the subtractor still need 8-bit accuracy; the gain stage needs 0.5 LSB at 5 bits, at high speed, which is the hard part.
- Carusone Ex. 17.9 ($\pm2.5$ V full scale, $V_{LSB}=19.5$ mV): an ideal 4-bit coarse ADC leaves $V_q$ within 16 LSB (312 mV). An 8-bit-accurate coarse ADC: 17 LSB (332 mV), ×8 = 2.7 V at the fine ADC. A 4-bit-accurate one: 32 LSB (Carusone quotes 618 mV), ×8 = 4.9 V, the whole fine range.

> [!tip] Remark
> A two-step converter is a two-stage pipeline: residue, interstage gain, redundancy and digital correction are owned by [[Pipelined ADCs]]. The flash sub-ADC inside each stage inherits everything above, with its offset budget relaxed by the redundancy.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $N$ by one bit | Resolution | 2× comparators, ~8× input capacitance (no cancellation), 4× ladder kickback at fixed $I_uR_u$, tighter skew |
| ↑ Input-pair area $WL$ | Offset, DNL, bubbles | Input capacitance, kickback, driver power |
| Offset cancellation / trim | Offset without area | Extra phases or calibration; caps in the path (analog storage) |
| Unclocked preamp ($A_1\approx2$–3) | Kickback isolation, latch offset/noise ÷ $A_1$, interpolation possible | Static power (can exceed the latch's), its own offset and delay |
| ↓ Ladder $R_u$ | Kickback and feedthrough error, settling | Ladder power $V_{REF}^2/(mR_u)$ |
| Ladder bypass caps | Midpoint kickback | Area (160 pF in the 6-bit example); no help for the input |
| Front-end S/H | Skew, input-dependent delay, feedthrough | A sampler driving the whole array; kT/C, power |
| Pipelined second latch | Metastability rate squared | Power, clock load, latency |
| Gray / 3-input gates / ONEs counter | Bounded metastability and bubble errors | Logic, wiring (counter: most logic) |
| Differential (current-domain) | 2× LSB, CM rejection | +40 % offset, less gain per power, ~0.3 V input range, CM tracking |
| Differential (capacitive) | Single pair, rail-to-rail, samples | Largest input capacitance; CM shift passes through |
| Interpolation by $k$ | Input capacitance ÷ $k$, fewer references | Needs linear preamps; latches still $2^N$ |
| Folding | Fewer latches | Output frequency × folding rate; input capacitance unchanged unless interpolated |
| Two-step | Comparators $2\cdot2^{N/2}$ instead of $2^N$ | Accurate DAC, gain stage, latency |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Thresholds, full scale | $V_{r,j}=jV_{REF}/2^N$, $V_{FS}=V_{REF}$, $2^N-1$ comparators |
| Offset → linearity | $\text{INL}_j=V_{OS,j}$, $\text{DNL}_j=V_{OS,j}-V_{OS,j-1}$, $\sigma_{DNL}=\sqrt2\sigma_{OS}$ |
| Input capacitance | $\propto2^{3N}$ at fixed range without offset cancellation |
| 1-of-$n$ | $H_j=T_j\overline{T_{j+1}}$ |
| Full adder | $S=A\oplus B\oplus D$, $C=AB+BD+AD$; thermometric: $S=A\overline{(B\oplus D)}$, $C=B$ |
| Gray (3 bits) | $G_3=T_4$, $G_2=T_2\overline{T_6}$, $G_1=T_1\overline{T_3}+T_5\overline{T_7}$ |
| PAM4 decode | MSB $=V_B$, LSB $=V_A\oplus V_B\oplus V_C$ |
| Metastability | $P_{error}=\beta e^{-T_{CK}/(2\tau_{reg})}$; two latches: $V_0e^{T_{CK}/\tau_{reg}}$ |
| Kickback on ladder | $V_j=\frac{j(m-j)}{2}I_uR_u$, $V_{max}=\frac{m^2}{8}I_uR_u$ |
| Bypass capacitor | $\Delta V_P=I_0\Delta T/C_1$ |
| Ladder power | $P=V_{REF}^2/(mR_u)$ |
| Clock skew | $\Delta T<1/(2^{N-1}\omega_{in})$ |
| Preamp delay | $T_{D1}=R_DC_D$ (small), $T_{D2}=R_DC_D\ln2$ (large) |
| Preamp gain | $A_1=g_mR_D=(g_m/I_D)(I_DR_D)$ |
| Current-domain subtraction | $I_1-I_2\propto(V_{in}^+-V_{r1})-(V_{in}^--V_{r2})$; offset $\sqrt2\sigma_{12}$ |
| Capacitive subtraction | $\Delta V=-(V_{in}^+-V_{r1})\,C_1/(C_1+C_p)$, $C_1\approx5$–$10\,C_p$ |
| Interpolation | $V_{X1}=V_{Y2}$ at $(V_{r1}+V_{r2})/2$; mirrors: $I_{2a}=\tfrac23I_1+\tfrac13I_2$ |
| Polarity-detector fold | comparators $2^N\to2^N/2+1$ |

## References

- **Razavi, *Analysis and Design of Data Converters*, 2025** (PDF page = printed + 19)
  - Ch. 12 Introduction to Nyquist-Rate ADCs, pp. 236–250: only §12.3.7 (static vs dynamic performance) and §12.4 (architecture map, Fig. 12.20) used here; §12.1–12.3 (quantization, offset, gain error, DNL, INL, SNDR, ENOB, SFDR, FOM) left to [[Data Converter Fundamentals]].
  - Ch. 13 Flash ADCs, pp. 251–283: basic flash, Ex. 13.1–13.2 (§13.1), distributed sampling (§13.2), ROM, MUX and ONEs-counter decoders, Ex. 13.3–13.4, Eqs. 13.1–13.4 (§13.3), offset and DNL, Ex. 13.5, bubbles, input capacitance, metastability, pipelining, Ex. 13.6, Gray coding, Ex. 13.7, kickback, Eqs. 13.21–13.24, Ex. 13.8–13.9, input feedthrough, timing mismatch, input-dependent delay (§13.4), bubble correction, Table 13.1 (§13.5), fully-differential comparators, Ex. 13.10–13.14, U-shaped architecture (§13.6), interpolation and polarity-detector folding (§13.7), Problems 13.12.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §17.5 Flash converters, pp. 673–677 (ladder with half-LSB ends, inverter comparator, input loading, bowing, latch-to-track delay, skew example, supply noise, bubble removal schemes, flashback); §17.6 Two-step converters, pp. 677–680, Ex. 17.9; §17.7 Interpolating converters, pp. 680–683, Ex. 17.10; §17.8 Folding converters, pp. 683–687, Ex. 17.11.
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies," IEEE JSSC, vol. 50, no. 9, Sept. 2015** (`ref/SerDes/56G_NRZPAM4_J.pdf`), §III-B, Figs. 7–8: three-slicer PAM4 receiver and the flattened CML LSB decoder.
- **S. Palermo, ECEN 720 lectures** (`ref/SerDes/`): lecture 6 slide 69 (2-bit flash for PAM4 decisions); lecture 8 slides 10 and 28 (Harwood ISSCC 2007, 12.5 GS/s 4.5-bit flash ADC receiver).
- **H. Zhang, B. Jiao, Y. Liao, G. Zhang, "PAM4 Signaling for 56G Serial Link Applications," DesignCon tutorial** (`ref/SerDes/slides-pam4signalingfor56gserial-zhang-designcon.pdf`): ADC-based receiver architecture (CTLE/AGC, ADC, DSP).
- **Zettelkasten** (`AnalogTheory/S22 Flash ADCs.md` and `Flash ADCs/`): reading order matches Razavi Ch. 13; extensions taken from 22i1 (ladder Thevenin resistance $j(m-j)R_u/m$, settling $\tau=R_{th}C_t$, ladder power $\propto f_{CK}$), 22i4 (the buffer-impedance check $1\ \text{mV}/12.8\ \text{mA}$), 22p1 (17 % / 9 % loss for 5× / 10× sampling capacitors).
