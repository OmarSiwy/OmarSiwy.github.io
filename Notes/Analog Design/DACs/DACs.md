---
title: DACs
description: Resistor-ladder, current-steering and capacitor DACs, from unit elements and coding through mismatch, output impedance, glitches, reference bounce and layout, ending in unit-cell sizing.
kind: topic
status: growing
aliases:
  - DACs
  - DAC
  - Digital-to-Analog Converters
---

A DAC is a pile of nominally identical unit elements (resistors, current sources or capacitors) plus a rule for switching them. Everything below follows from two questions: how well do the units match, and what does the output do while they switch? The note starts with the black box and then opens it one architecture at a time.

## The big picture

```tikz title="The three DAC media. Resistor ladder: pick one tap (1-of-n code). Current steering: steer m unit currents between two loads. Capacitor DAC: switch bottom plates between V_REF and 0, read the top plate. After Razavi DC Figs. 9.1(b), 10.5, 11.2(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.9cm]
  % RDAC
  \draw (0,4.2) node[above]{$V_{REF}$} to[R] (0,3) to[R] (0,2) to[R] (0,1) to[R] (0,0) node[ground]{};
  \foreach \y/\s in {3/S_3,2/S_2,1/S_1,0/S_0} { \draw (0,\y) node[circ]{} to[nos,l=\scriptsize$\s$] (1.8,\y); }
  \draw (1.8,0) -- (1.8,3); \draw (1.8,1.5) node[circ]{} -- (2.6,1.5) node[right]{$V_{out}$};
  \node[align=center,font=\scriptsize] at (1.1,-1.1) {resistor ladder (RDAC)\\ monotonic, rail-to-rail,\\ no resistive load};
  % IDAC
  \draw (5.0,4.4) -- (10.4,4.4) node[right]{$V_{DD}$};
  \draw (5.3,4.4) to[R,l_=$R_L$] (5.3,3.2) node[left]{$A$};
  \draw (10.1,4.4) to[R,l=$R_L$] (10.1,2.5) node[right]{$B$};
  \draw (5.3,3.2) -- (9.4,3.2); \draw (6.4,2.5) -- (10.1,2.5);
  \foreach \x/\w in {6.1/I_0,7.5/2I_0,8.9/4I_0} {
    \draw (\x,1.0) to[I,l_=\scriptsize$\w$] (\x,-0.2) node[ground]{};
    \draw (\x-0.4,1.0) -- (\x+0.4,1.0);
    \draw (\x-0.4,1.0) to[nos] (\x-0.4,3.2);
    \draw (\x+0.4,1.0) to[nos] (\x+0.4,2.5);
  }
  \node[align=center,font=\scriptsize] at (7.7,-1.1) {current steering (IDAC)\\ fast, drives $50\ \Omega$,\\ swing limited by headroom};
  % CDAC
  \draw (12.0,3.4) -- (15.6,3.4);
  \foreach \x in {12.4,13.4,14.4} {
    \draw (\x,3.4) to[C] (\x,1.8);
    \draw (\x,1.8) -- (\x,1.4);
  }
  \node[font=\scriptsize] at (13.4,1.1) {bottom plates: $V_{REF}$ or 0};
  \node[font=\scriptsize,above] at (13.4,3.4) {$C_0$ each};
  \draw (15.6,3.4) node[circ]{} -- (16.3,3.4) node[right]{$V_{out}$};
  \draw (15.6,3.4) to[nos,l=\scriptsize$S_R$] (15.6,1.8) node[below]{$V_{CM}$};
  \node[align=center,font=\scriptsize] at (14.0,-1.1) {capacitor DAC (CDAC)\\ no static power,\\ the reference pays};
\end{circuitikz}
\end{document}
```

> [!important] The results the rest of the note refines
> 1. **Build every weight from identical units.** A $2W$ device is not twice a $W$ device (edge effects). An $N$-bit binary DAC therefore uses the same $m-1 = 2^N-1$ units as a thermometric one; only the wiring differs.
> 2. **Coding sets DNL, unit count sets INL.** Binary: DNL $<\tfrac12$ LSB needs $\sigma_I/I_0 < 1/2^N$ (the MSB carry). Thermometric: $\sigma_I/I_0<0.5$, and monotonic for free. INL $<\tfrac12$ LSB needs $\sigma_I/I_0 < 1/\sqrt{2^{N+1}}$ for both. **Segment**: thermometric MSBs, binary LSBs.
> 3. **Ladders and capacitor arrays are pinned at both ends**, so random INL peaks at midscale: $\sigma_{INL} = \frac{1}{\sqrt{4m}}\frac{\sigma_R}{R}V_{REF}$ (same with $C$).
> 4. **Current-steering linearity is an output-impedance spec.** Single-ended $HD_2 = mR_L/(4r_O)$; differential $HD_3 = (mR_L/4r_O)^2$. At high frequency the tail capacitance takes over: $HD_2 = mR_LC_u\omega/4$.
> 5. **Glitches come from timing, not matching.** Skewed bits produce a glitch impulse area; the fixes are a retiming register, thermometer coding of the MSBs, and a latch in each unit cell.
> 6. **The reference is part of the DAC.** Every architecture draws code-dependent transient current from its reference; a decoupling capacitor must be about $2m\times$ the load to help, and a buffer's output impedance rises with frequency.

**Map:** [[#Spec translation|specs → devices]] → [[#Level 0 The DAC as a Black Box|black box]] → [[#Level 1 Coding and Architecture|binary vs thermometric, segmentation]] → [[#Level 2 Resistor-Ladder DACs|resistor ladders]] → [[#Level 3 Current-Steering DACs|current steering]] → [[#Level 4 Current-Steering Arrays and Dynamics|IDAC layout and dynamics]] → [[#Level 5 Capacitor DACs|capacitor DACs]] → [[#Level 6 DACs in SerDes Transmitters|SerDes drivers]].

> [!tip] Remark
> INL, DNL, offset, gain error, SFDR, SNDR and ENOB are defined once, for every converter, in [[Data Converter Fundamentals]]. This note uses them and only adds what is DAC-specific: how an element error shapes the curve, glitch impulse area, and what each architecture's errors look like.

## Spec translation

A DAC is not an amplifier, but it contains devices that are sized like one: the **unit current source** and **switch pair** of a current-steering cell, the **output buffer** of a resistor ladder, the **reference buffer** of every architecture, and the **op amp** of a charge-redistribution DAC.

**DAC specs** (Razavi DC §8.2, Carusone §15–16): resolution $N$ ($m = 2^N$ levels), DNL and INL (in LSB), monotonicity, SFDR at a stated output frequency *and* amplitude, settling time to $\pm\tfrac12$ LSB, glitch impulse area (V·s), output swing and load ($R_L$ or $C_L$), power, area.

### Current-steering DAC

| DAC spec | Element that sets it | Device / amplifier spec it imposes |
|---|---|---|
| INL (random) | Unit current source $M_1$ | $\sigma_I/I_0 < 1/\sqrt{2m}$ → gate area $WL$ and overdrive (current-mismatch law) |
| DNL (random) | Same, plus the coding | Thermometric: $\sigma_I/I_0<0.5$. Segmented 7+3: $\sigma_I/I_0 < 1/(2\sqrt{85})$ |
| INL / low-frequency SFDR | Unit-cell **output impedance** | Single-ended $r_O > m^2R_L/2$; differential $r_O > \sqrt{\sqrt3/18}\,m^{3/2}R_L$ |
| SFDR at high $f_{out}$ | Tail capacitance $C_P$, cascode gain $g_mr_O$ | $C_u = C_P/(g_{m}r_{O})$ small enough that $mR_LC_u\omega/4$ meets HD2; memory HD3 $\propto C_P/(1+g_mr_O)$ |
| Output swing (compliance) | Stack: source + cascode + switch | $V_{DS1}+V_{DS2}+V_{DS3} < V_{out} < V_{DD}$: **output swing** with every device saturated |
| Settling | Output node | $\tau = m(C_{GD}+C_{DB})R_L$ (plus wiring): switch width, not source width |
| Glitch impulse | Decoder, drivers, switch timing | Retiming register; latch per cell; thermometric MSBs |
| Reference bounce | Shared bias line $N$ | $C_b > 4m^2C_{GD3}\,\Delta V_X/(V_{GS}-V_{TH})_3$ or a fast-recovering tail |
| Gradient / IR INL | Array layout | Switching sequence; ground resistance per cell ($\approx 1\ \Omega$ in Razavi's 10-bit example) |

$$
\boxed{\left(\frac{\sigma_I}{I_0}\right)^2 = \frac{A_\beta^2}{WL}+\frac{4A_{VT}^2}{(V_{GS}-V_{TH})^2\,WL} = \frac{A_\beta^2+(g_m/I_D)^2A_{VT}^2}{WL} < \frac{1}{2m}}
$$

$$
\boxed{r_O > \frac{m^2R_L}{2}\ \ (\text{single-ended}),\qquad r_O > \sqrt{\frac{\sqrt3}{18}}\;m^{3/2}R_L\ \ (\text{differential})}
$$

> [!note]- Derivation: where each inequality comes from
> **Matching.** Random INL of a thermometric (or unit-built binary) array is largest at midscale, where $m/2$ units are on. Their sum has $\sigma = \sqrt{m/2}\,\sigma_I$ about a full scale that is nearly ideal, so $\sqrt{m/2}\,\sigma_I < I_0/2$ ([[#Random Mismatch and Unit Sizing]]). The mismatch law is Razavi DC Eq. (10.6); with $g_m/I_D = 2/(V_{GS}-V_{TH})$ in strong inversion the two forms are the same ([[Nonlinearity and Mismatch#Current Mismatch: the Opposite Instruction]]).
>
> **Output impedance.** $j$ units on put $r_O/j$ in parallel with $R_L$; the step height falls as $j$ grows. Subtracting the end-point line gives $\mathrm{INL}_j \approx j(m-j)I_0R_L^2/r_O$, peak $m^2I_0R_L^2/(4r_O)$ at midscale; set it below $\tfrac12$ LSB $= I_0R_L/2$. Differential: the even part cancels and the peak is $\frac{3\sqrt3}{18}\frac{I_0R_L^3m^3}{r_O^2}$ against 1 LSB $\approx I_0R_L$ ([[#Output Resistance Compresses the Characteristic]]).
>
> **Settling.** Each unit hangs $C_{GD}+C_{DB}$ of its switch on the output; $m$ of them in parallel with $R_L$. Settling to $\tfrac12$ LSB of a full-scale step takes $\tau\ln(2m)$ ([[#Settling to Half an LSB]]).
>
> **Bounce.** A tail dip $\Delta V_X$ couples through $mC_{GD3}$ onto the shared gate line; $m$ sources each change by $g_{m3}\Delta V_N$. Requiring the total below $\tfrac12$ LSB with a bypass $C_b$ gives the boxed $C_b$ bound ([[#Output Time Constant and Reference Bounce]]).

| Device spec | Lands on | Why |
|---|---|---|
| Current-source matching $\sigma_I/I_0$ | **Low $g_m/I_D$** (large $V_{OV}$) and large $WL$ for $M_1$ | $\Delta V_{TH}$ enters multiplied by $g_m/I_D$; low $g_m/I_D$ also lowers $g_m$, so ground IR drop and bias-line bounce move the current less |
| Headroom of the source | Upper bound on $V_{OV}$ of $M_1$: $V_{D,sat}\approx 2/(g_m/I_D)$ | Swing $= V_{DD}-\sum V_{D,sat}$; Razavi takes $V_{OV}\approx100$ mV for a 0.5 V swing |
| $r_O$ of the unit | **$L$** of $M_1$ (then cascode $M_2$, $g_mr_O\approx10$–20 for a long device) | $r_O = V_A/I_D$, $V_A\propto L$. Large $WL$ for matching and long $L$ for $r_O$ are compatible |
| Switch pair as cascode | **Minimum $L$**, moderate-to-high $g_m/I_D$ for $M_3,M_4$ | Small $C$ at all three terminals; $g_mr_O\approx5$–10; needs $V_{out}\ge V_G-V_{TH}$ to stay saturated |
| Gate swing to steer fully | $V_{OV}$ of the switches | A pair steers all its tail current at $\Delta V_{in} = \sqrt2\,V_{OV}$ ([[Differential Amplifiers#Large-Signal Characteristic]]); low $V_{OV}$ means small gate swings and a quiet tail |
| Tail capacitance $C_P$ | Area of $M_1$ ($C_{GD1}+C_{DB1}$) and the switches' $C_{GS}$, $C_{SB}$ | Big matching area costs dynamic linearity unless a cascode isolates it: $C_u = C_P/(g_mr_O)$ |

> [!tip] Remark
> The spec names come from [[Single-Stage#Amplifier Specifications]]; the procedure that turns $g_m/I_D$, $L$ and $I_D$ into $W$ is [[gm-ID Design Methodology]]. Unit-source output impedance and compliance are owned by [[Current Mirrors#Cascode Mirror]] and [[Current Mirrors#Compliance: How a Cascode Source Fails]]; the Pelgrom constants by [[Nonlinearity and Mismatch#Where Mismatch Comes From: Averaging]].

**Worked example** (Razavi DC §10.7: 8-bit differential thermometric IDAC, 0.5 V$_{pp}$ single-ended swing into $50\ \Omega$).
1. **Swing → unit current.** $0.5\ \text{V}/50\ \Omega = 10$ mA full scale, $I_0 = 10\ \text{mA}/256 = 39\ \mu$A.
2. **INL → output resistance.** Differential bound: $r_O > \sqrt{\sqrt3/18}\cdot256^{3/2}\cdot50\ \Omega = 63.5$ kΩ. With rail-to-rail gate drive and a 0.5 V swing the switches enter triode and add nothing, so $M_1$ alone must give it: $V_A = r_OI_D \ge 63.5\ \text{k}\Omega\times39\ \mu\text{A}\approx 2.5$ V. Choose $L$ from the lookup table; if it gets too long, add a cascode.
3. **INL → matching.** $\sigma_I/I_0 < 1/\sqrt{512} = 4.4\%$.
4. **Swing → overdrive.** The 0.5 V swing leaves $V_{OV}\approx100$ mV for $M_1$, i.e. $g_m/I_D \approx 2/V_{OV} = 20$ S/A by the square law (read the real value from the table).
5. **Area.** With $A_\beta\approx0.05\ \mu$m and $A_{VT}\approx2.5$ mV·µm, Razavi gets $WL = 1.6\ \mu\text{m}^2$.

> [!warning] Unverified: a factor of 4 in Razavi's sizing step
> Razavi's Eq. (10.44) writes the $A_{VT}$ term with a coefficient of 1, while his Eq. (10.6) has 4. The $1.6\ \mu\text{m}^2$ follows from Eq. (10.44): $(0.05^2+0.025^2)/0.044^2 = 1.6$. With Eq. (10.6)'s factor of 4: $(0.05^2+4\cdot0.025^2)/0.044^2\approx2.6\ \mu\text{m}^2$. Use the larger number until checked against your PDK's Pelgrom data. Also check whether your $A_{VT}$ is quoted for a pair difference or a single device: that changes the result by $\sqrt2$.

### Resistor-ladder DAC

| DAC spec | Element | Device / amplifier spec |
|---|---|---|
| INL (random) | Unit resistors | $\sigma_R/R < 1/\sqrt m$ (8 bits: 6.3%) |
| INL (gradient) | Ladder layout | $\Delta R/R_0 < 4/m^2$ per unit step: fold or common-centroid the ladder |
| INL (load) | Output buffer input | $mR_u/R_L < 27/(8m)$: a buffer with a gate input makes $R_L\to\infty$ |
| Settling | Switches + ladder | $t_s \approx \tau\ln(2m)$, $\tau = (R_{Th}+R_{sw})\,mC_{sw}$; start with $R_{sw}\approx R_{Th,max} = mR_u/4$ |
| Power | Ladder | $P = V_{REF}^2/(mR_u)$ fixes $mR_u$ first |
| Rail-to-rail swing | Output buffer | **Input CM range** and **output swing** of the buffer must span $0$ to $V_{REF}$; **offset** must not depend on the input (monotonicity) |
| Gain error (if it matters) | Output buffer, follower $\beta=1$ | **DC gain** $A_0 \ge 2^{N+1}$ for $<\tfrac12$ LSB at full scale |
| Settling of the buffered output | Output buffer | **Unity-gain frequency** $\omega_u \ge (N+1)\ln2/t_s$; **slew rate** for the full-scale step |
| Reference bounce | Reference buffer | Low **output impedance** up to the DAC's switching frequencies; decoupling $C_1\gtrsim 2mC_L$ |

$$
\boxed{\text{follower buffer: }A_0 \ge 2^{N+1},\qquad \omega_u \ge \frac{(N+1)\ln 2}{t_s}}
$$

> [!note]- Derivation: the buffer inequalities
> A unity-feedback buffer ($\beta = 1$) has static gain $A_0/(1+A_0)$, an error of about $1/A_0$. At full scale ($\approx V_{REF}$) the error is $V_{REF}/A_0$; requiring it below $\tfrac12$ LSB $= V_{REF}/2^{N+1}$ gives $A_0\ge 2^{N+1}$. This is a *gain* error (linear), so a stand-alone DAC can tolerate it; INL comes only from the part of $A_0$ that varies with output level. A one-pole follower settles with $\tau = 1/\omega_u$; reaching $\tfrac12$ LSB needs $e^{-t_s\omega_u} < 2^{-(N+1)}$. The general form with $\beta$ is in [[Operational Amplifiers#Bandwidth Sets the Settling Time]].

### Capacitor DAC

| DAC spec | Element | Device / amplifier spec |
|---|---|---|
| INL / DNL | Unit capacitor $C_0$ | $\sigma_C/C_0 < 1/\sqrt m$ for $\tfrac12$ LSB INL; mismatch $\propto 1/\sqrt{\text{area}}$ |
| Noise | Reset switch, $C_0$ | $C_0 \approx 25mkT/V_{REF}^2$ for $V_n = 0.2$ LSB |
| Gain error | Top-plate parasitic $C_t$, load $C_L$ | Gain error $C_t/C_0$ (or $C_L/mC_0$) |
| Settling | Reference + switches | Ideal array settles at once; the real limit is $(R_{on}+mR_{REF}/4)C_0$ at midscale |
| Reference current | Reference buffer | Peak $mV_{REF}/(4R_{on})$ at midscale; buffer **output impedance** at high frequency ($1/g_m$ of its output follower) |
| Charge-redistribution output | SC op amp | **DC gain** and **unity-gain frequency** of an SC amplifier with $\beta$ set by the array ([[Switched-Capacitor Circuits#Unity-Gain Sampler: Gain Error and Settling]]) |

$$
\boxed{\text{reference recovers within } t_s:\quad \left(R_{on}+\frac{m}{4}R_{REF}\right)C_0\,\ln(2m) \le t_s}
$$

> [!note]- Derivation: reference resistance budget
> When half the units switch to the reference (the worst case), the array looks like $4R_{on}/m$ in series with $(m/4)C_0$ at $t=0^+$ (Razavi DC Fig. 11.20b). A reference of output resistance $R_{REF}$ adds in series, so the time constant is $\tau = (4R_{on}/m + R_{REF})(m/4)C_0 = (R_{on}+mR_{REF}/4)C_0$ (Eq. 11.25). Settling a one-pole response to $\tfrac12$ LSB of a full-scale step takes $\tau\ln(2m)$ ([[#Settling to Half an LSB]]). For an active buffer, $R_{REF}$ at these frequencies is its open-loop output resistance (about $1/g_m$ of its output follower, [[#CDAC Reference Bounce and Its Buffer]]), so this sets $g_m$ of that device: $g_m \ge m/\left[4\left(t_s/(C_0\ln 2m) - R_{on}\right)\right]$.

| Device spec | Lands on | Why |
|---|---|---|
| Switch $R_{on}$ | $W/L$ and overdrive of the bottom-plate switches (triode devices, not gm/ID-sized) | $R_{on} = 1/(\mu C_{ox}\frac WL V_{OV})$ ([[MosFETs#Regions of Operation]]); $R_{on}C_{sw}$ is a technology constant |
| Reference-buffer output impedance | $g_m$ of the output follower (so $I_D$ at the chosen $g_m/I_D$); loop gain and bandwidth of the error amp | Low-frequency $Z_{out} = (1/g_{m5})/(1+A_0)$; above $\omega_p\approx g_{m1}/C_A$ it is just $1/g_{m5}$ |
| Ladder/CDAC output buffer | Input pair type (rail-to-rail CM), $A_0$ via $L$, $\omega_u$ via $I_D$ | Standard op-amp sizing ([[Operational Amplifiers]]) |

> [!tip] Remark
> A CDAC inside a SAR ADC is also the sampler, so its switch sizing is set by acquisition bandwidth as well: [[SAR ADCs]] and [[Sampling Circuits#Acquisition Time]] own that.

## Level 0: The DAC as a Black Box

### What It Does

$$
\boxed{A_{out} = \alpha D_{in},\qquad A_{FS} = (2^N-1)\,\Delta A_{LSB},\qquad \Delta A_{LSB} = \frac{A_{FS}-A_{OS}}{m-1}\approx\frac{A_{FS}}{m}}
$$

- The **reference** ($I_{REF}$, $V_{REF}$) sets $\alpha$, the dimension and the full scale. An error in $I_{REF}$ is a gain error, nothing worse: in the mirror-built DAC of Razavi Fig. 8.6, $I_{out} = (4D_3+2D_2+D_1)I_{REF}$.
- **Full scale is one LSB short of $2^N$ LSBs**: a 3-bit DAC jumps seven times, $0$ to $7I_{REF}$.
- The output exists only at the codes. The staircase or line drawn through them is for visualising errors.

### An Element Error Moves Only the Codes That Turn It On

```tikz title="Binary-weighted current DAC (left) and what an error in one element does (right): an LSB error alternates (every odd code), an MSB error lands entirely on the major carry 011 to 100. After Razavi DC Figs. 8.3, 8.4, 8.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.9cm]
  \draw (0,3.2) -- (4.6,3.2) node[right]{$I_{out}$};
  \foreach \x/\w/\d in {0.4/4I_{REF}/D_3,2.0/2I_{REF}/D_2,3.6/I_{REF}/D_1} {
    \draw (\x,3.2) to[nos,l=\scriptsize$\d$] (\x,1.9);
    \draw (\x,1.9) to[I,l=\scriptsize$\w$] (\x,0.4) node[ground]{};
  }
  \begin{scope}[xshift=6cm]
    \draw[->] (0,0) -- (4.4,0) node[right]{$D_{in}$};
    \draw[->] (0,0) -- (0,3.9) node[above]{$I_{out}$};
    \draw[dashed,gray] (0,0) -- (3.5,3.5);
    \foreach \k/\v in {0/0,1/1,2/2,3/3,4/4.6,5/5.6,6/6.6,7/7.6} { \fill (\k*0.5,\v*0.45) circle (1.6pt); }
    \draw[<->] (2.15,1.35) -- (2.15,2.07);
    \node[font=\scriptsize,anchor=west] at (2.2,1.55) {$\Delta I$ at};
    \node[font=\scriptsize,anchor=west] at (2.2,1.25) {major carry};
    \node[font=\scriptsize,align=center] at (2.0,-0.65) {MSB $=4I_{REF}+\Delta I$: one DNL of $\Delta I$\\ at $3\to4$, plus a gain error};
  \end{scope}
  \begin{scope}[xshift=11.4cm]
    \draw[->] (0,0) -- (4.4,0) node[right]{$D_{in}$};
    \draw[->] (0,0) -- (0,3.9) node[above]{$I_{out}$};
    \draw[dashed,gray] (0,0) -- (3.5,3.5);
    \foreach \k/\v in {0/0,1/1,2/2,3/3,4/2.5,5/3.5,6/4.5,7/5.5} { \fill (\k*0.5,\v*0.45) circle (1.6pt); }
    \node[font=\scriptsize,align=center] at (2.0,-0.65) {MSB $=4I_{REF}-1.5I_{REF}$:\\ DNL $=-1.5$ LSB, nonmonotonic};
  \end{scope}
\end{circuitikz}
\end{document}
```

- An element's error appears at **every code that turns it on**. An LSB error alternates ($+\Delta I$, $-\Delta I$, ...: DNL of both signs, Razavi Ex. 8.3); an MSB error appears once, at the **major carry** $011\cdots1\to100\cdots0$, where every other element turns off.
- DNL also produces gain error, because it moves the end point (Razavi Fig. 8.9).
- **Nonmonotonic** needs a DNL worse than $-1$ LSB. That matters inside a feedback loop (the gain changes sign) and it defeats calibration, which needs a one-to-one input–output map.

> [!tip] Remark
> INL is the running sum of DNL when the LSB is defined from the actual end points ([[Data Converter Fundamentals]]). So a bowed INL forces the DNL to change sign across the range: you can read a DNL pattern off an INL shape (Razavi Fig. 8.14).

### Settling to Half an LSB

$$
\boxed{t_s = \tau\ln(2m)\quad(\text{full-scale step to }\pm\tfrac12\text{ LSB}),\qquad \text{3 bits: } t_s = R_LC_L\ln14\approx2.63R_LC_L}
$$

Every added bit costs another $\tau\ln 2$, and in most architectures it also raises $\tau$ (more units on the output node). This is the conversion used by every architecture below.

> [!note]- Derivation: why the logarithm
> A full-scale step moves the output by $(m-1)$ LSB $\approx m$ LSB. A one-pole response leaves an error $m\,\text{LSB}\cdot e^{-t/\tau}$; setting it to $\tfrac12$ LSB gives $t_s = \tau\ln(2m)$ (Razavi Eqs. 8.13–8.15 for 3 bits, Eq. 9.7 in general, where the exact form is $\ln(2m-2)$).

### Glitch Impulse Area

```tikz title="A glitch from bit skew: the MSB turns off late on the 100 to 011 transition, so the output visits 7 LSB before settling at 3. The retiming register (right) aligns the bits. After Razavi DC Figs. 8.18, 8.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right]{$t$};
  \draw[->] (0,0) -- (0,3.6) node[above]{$I_{out}$};
  \fill[gray!30] (2.2,1.8) -- (2.2,3.15) -- (3.2,3.15) -- (3.2,1.35) -- (2.2,1.35) -- cycle;
  \draw[thick] (0.2,1.8) -- (2.2,1.8) -- (2.2,3.15) -- (3.2,3.15) -- (3.2,1.35) -- (5.6,1.35);
  \draw[dotted] (0,1.8) node[left]{\scriptsize$4I_{REF}$} -- (0.2,1.8);
  \draw[dotted] (0,3.15) node[left]{\scriptsize$7I_{REF}$} -- (2.2,3.15);
  \draw[dotted] (0,1.35) node[left]{\scriptsize$3I_{REF}$} -- (0.2,1.35);
  \node[font=\scriptsize,align=center] at (2.7,2.4) {glitch\\ area};
  \node[font=\scriptsize] at (1.1,-0.3) {$D_{in}=100$};
  \node[font=\scriptsize] at (4.8,-0.3) {$D_{in}=011$};
  \draw[<->] (2.2,0.5) -- (3.2,0.5) node[midway,below,font=\scriptsize]{skew};
  \begin{scope}[xshift=9.4cm,yshift=1.2cm]
    \node[draw,minimum width=1.5cm,minimum height=1cm] (r) at (0,0) {register};
    \node[draw,minimum width=1.5cm,minimum height=1cm] (d) at (3,0) {DAC core};
    \draw[->] (-1.8,0) node[left]{$D_{in}$} -- (r.west);
    \draw[->] (r.east) -- node[above]{$D_R$} (d.west);
    \draw[->] (d.east) -- ++(0.7,0) node[right]{$A_{out}$};
    \draw[->] (0,-1.3) node[below]{$CK$ ($f_{CK}$)} -- (r.south);
  \end{scope}
\end{circuitikz}
\end{document}
```

- Bits arrive with different delays, so on a code change the output briefly visits a wrong code. The worst case is the major carry, where every element changes state (Carusone §16.2.6). The error is quantified by the **area under the glitch** (V·s or A·s), often loosely called "glitch energy".
- It matters most in stand-alone DACs (a display shows it). Inside an ADC only the **settled** value is sampled, so a glitch just eats settling time.
- Cures: a **retiming register** in front of the core (Razavi §8.4), **thermometer coding** so a 1-LSB step only ever switches one unit (Carusone §16.3), a latch in each unit cell ([[#Race Glitches and Local Latches]]). Carusone also lists limiting the output bandwidth (slower) and a sample-and-hold after the DAC.

### SFDR Is Measured with a Digital Sinusoid

- Settling is hard to measure (the scope must settle faster than the DAC), so DACs are characterised by applying a **digital sinusoid** and reading the output spectrum: THD, SNDR, SFDR versus $f_{out}$.
- **SFDR must be quoted with the output amplitude.** Lowering the swing usually helps: if $P_1$ drops 3 dB, a third harmonic can drop 9 dB. A low amplitude costs SNDR.
- The largest spur is not always a harmonic. A spur's origin is found by stepping $f_{in}$ by $\Delta f_{in}$: a component moving by $k\,\Delta f_{in}$ comes from the $k$-th harmonic (Razavi Ex. 8.9).

### The Register Is a Sampler

$$
\boxed{\text{3rd-order nonlinearity on } f_{in} \text{ and its image } f_{CK}-f_{in}\ \Rightarrow\ \text{spur at } 3f_{in}-f_{CK}\ (\text{in band})}
$$

- The register samples at $f_{CK}$: it needs $f_{CK}\ge 2\times$ the signal bandwidth, and the held output has the **sinc droop** of a zero-order hold.
- Near Nyquist, the image at $f_{CK}-f_{in}$ is in the spectrum alongside $f_{in}$. A cubic term mixes them into $2f_1-f_2 = 3f_{in}-f_{CK}$ and $2f_2-f_1 = 2f_{CK}-3f_{in}$: spurs that are harmonics of neither.

> [!tip] Remark
> The hold and its $\mathrm{sinc}$ spectrum are the zero-order hold of [[Sampling Circuits#Zero-Order Hold and Track-and-Hold]]; the intermodulation arithmetic is [[Nonlinearity and Mismatch#Intermodulation and IP3]].

## Level 1: Coding and Architecture

### Codes and Decoders

| Decimal | Binary | Thermometer ($T_3T_2T_1$) | 1-of-n |
|---|---|---|---|
| 0 | 00 | 000 | 0001 |
| 1 | 01 | 001 | 0010 |
| 2 | 10 | 011 | 0100 |
| 3 | 11 | 111 | 1000 |

- **Thermometer:** the number of ONEs is the value; one more unit turns on per LSB. **1-of-n:** a single ONE whose position is the value; it selects one ladder tap.
- **1-of-n decoder:** one AND gate per output. **Thermometer decoder:** read the OR terms off the truth table; for 3 bits $T_1 = D_3+D_2+D_1$, $T_2 = D_3+D_2$, $T_3 = D_3+D_2D_1$, $T_4 = D_3$, $T_5 = D_3(D_2+D_1)$, $T_6 = D_3D_2$, $T_7 = D_3D_2D_1$ (Razavi Eqs. 8.19–8.25).

### Binary-Weighted vs Thermometric

```tikz title="Seven units, four of them 0.3 LSB low. Grouped as binary (left), the 3 to 4 step goes down. Driven by a thermometer code (right), every step goes up. After Razavi DC Fig. 10.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\lab/\vals in {0/{binary: $I_1$; $I_2{+}I_3$; $I_4{+}\dots{+}I_7$}/{0,1,2,3,2.8,3.8,4.8,5.8}, 6.5/{thermometric: one unit per code}/{0,1,2,3,3.7,4.4,5.1,5.8}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (0,0) -- (4.6,0) node[right]{$D_{in}$};
      \draw[->] (0,0) -- (0,3.6) node[above]{$I_{out}/I_0$};
      \draw[dashed,gray] (0,0) -- (4.2,3.36);
      \foreach \v [count=\k from 0] in \vals { \fill (\k*0.6,\v*0.48) circle (1.7pt); }
      \foreach \t in {1,3,5} { \draw (0.05,\t*0.48) -- (-0.05,\t*0.48) node[left,font=\scriptsize]{\t}; }
      \node[font=\scriptsize] at (2.2,-0.5) {\lab};
    \end{scope}
  }
  \node[font=\scriptsize,red!70!black] at (3.1,1.0) {$3\to2.8$};
\end{circuitikz}
\end{document}
```

| Requirement | Binary-weighted (units) | Thermometric |
|---|---|---|
| DNL $<\tfrac12$ LSB | $\sigma_I/I_0 < 1/2^N$ | $\sigma_I/I_0 < 0.5$ |
| INL $<\tfrac12$ LSB | $\sigma_I/I_0 < 1/\sqrt{2^{N+1}}$ | $\sigma_I/I_0 < 1/\sqrt{2^{N+1}}$ |
| Monotonic | No guarantee | Guaranteed |
| Units | $2^N-1$ | $2^N-1$ |
| Extra cost | none | binary-to-thermometer decoder (power at high speed) |

$$
\boxed{\text{binary DNL: } \frac{\sigma_I}{I_0}<\frac1m,\qquad \text{thermometric DNL: } \frac{\sigma_I}{I_0}<0.5,\qquad \text{INL (both): } \frac{\sigma_I}{I_0}<\frac{1}{\sqrt{2m}}}
$$

- 12-bit example: binary DNL needs the MSB ($2048I_0$) to match the sum of the rest ($2047I_0$) to $0.5I_0$, i.e. **0.024%**. Thermometric INL needs only $1/\sqrt{8192}$ = **1.1%** (Razavi §10.3).
- Area is the same: the binary array is also built from $2^N-1$ units, and resistor totals match ($R+2R+4R = 7R$ either way, Carusone §16.3). The thermometric DAC also glitches less, because a 1-LSB step switches one unit instead of a bank.
- Binary weighting is limited to about 5–6 bits in IDACs and about 4 bits in CDACs (Razavi §§10.3, 11.2).

> [!note]- Derivation: thermometric INL at midscale
> Each unit has standard deviation $\sigma_I$. At $D_{in}=m/2$ half the units are on: their sum has $\sigma = \sqrt{m/2}\,\sigma_I$. The full scale (all $m$ units) has $\sigma = \sqrt m\,\sigma_I$, which is a small fraction of $mI_0$ for large $m$, so take the end-point line as ideal. The midscale error is then $\sqrt{m/2}\,\sigma_I < I_0/2$, i.e. $\sigma_I/I_0 < 1/\sqrt{2m}$ (Razavi Eq. 10.9). The same holds for a unit-built binary DAC at $100\cdots0$, because half the units are on there too (Ex. 10.5). Meeting DNL $<\tfrac12$ LSB in a binary DAC automatically meets INL $<\tfrac12$ LSB, not the other way round.
>
> One subtlety: you can't simply subtract the line's and the curve's standard deviations (that assumes full correlation) or add their variances (no correlation); the first $m/2$ units are in both. Taking the full scale as ideal sidesteps it.

### Segmentation

- **Segmented (hybrid) DAC:** thermometric MSBs, binary LSBs. The MSBs carry the accuracy and the glitch risk; the LSBs carry little of either, so a compact binary section is fine there (Carusone §16.4).
- Razavi's 10-bit example: 7 thermometric MSBs (127 units) plus a 3-bit R-2R LSB section, **130 switching units** instead of 1023 ([[#Binary, Thermometric, R-2R and Segmented Arrays]]).

### The Three Media

| | Resistor ladder | Current steering | Capacitor |
|---|---|---|---|
| Output | Voltage, $0$ to $V_{REF}$ (rail-to-rail) | Current into $R_L$ (drives 50 Ω) | Voltage on the top plate |
| Static power | $V_{REF}^2/(mR_u)$ | Full-scale current always flows | None (reference transients only) |
| Monotonic | Always (1-of-n tap) | Only if thermometric | Only if thermometric |
| Main nonlinearity | Load, gradients | Output impedance $r_O$, tail capacitance | Capacitor mismatch, top-plate parasitics |
| Speed limit | Switch fanout $mR_{sw}C_{sw}$, ladder $m^2$ | Output pole (fast); reference bounce | Reference and its buffer |
| Typical home | Reference taps, trims, flash ADC ladders | Stand-alone, high-speed (comms, SerDes TX) | SAR and pipelined ADCs |

## Level 2: Resistor-Ladder DACs

### Ladder and Selection Network

```tikz title="A 2-bit binary-tree multiplexer: each bit halves the number of candidate taps, so no decoder is needed but the signal passes N switches in series. After Razavi DC Fig. 9.1(c) and Carusone Fig. 16.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.85cm]
  \draw (0,4) node[above]{$V_{REF}$} to[R] (0,3) to[R] (0,2) to[R] (0,1) to[R] (0,0) node[ground]{};
  \foreach \y/\d/\v in {0/\bar D_1/V_0,1/D_1/V_1,2/\bar D_1/V_2,3/D_1/V_3} {
    \draw (0,\y) node[circ]{} node[left,font=\scriptsize]{$\v$} to[nos,l=\scriptsize$\d$] (2,\y);
  }
  \draw (2,0) -- (2,1); \draw (2,2) -- (2,3);
  \draw (2,0.5) node[circ]{} to[nos,l=\scriptsize$\bar D_2$] (4,0.5);
  \draw (2,2.5) node[circ]{} to[nos,l=\scriptsize$D_2$] (4,2.5);
  \draw (4,0.5) -- (4,2.5); \draw (4,1.5) node[circ]{} -- (5,1.5) node[right]{$V_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.0,0.4) {$D_2D_1=10$ selects $V_2$};
\end{circuitikz}
\end{document}
```

- $m$ equal resistors give taps $V_j = jV_{REF}/m$. **1-of-n selection** (one switch per tap, big picture) needs a decoder and puts all $m$ switch capacitances on the output bus. A **binary tree** needs no decoder but puts $N$ switches in series.
- **Unconditionally monotonic:** a higher tap is always at a higher voltage, whatever the mismatch. **Rail-to-rail:** $0$ to $V_{DD}$ if $V_{REF}=V_{DD}$.
- Polysilicon ladders reach about **10 bits** of accuracy (Carusone §16.1.1).
- An n-channel-only tree lays out compactly (no contacts in the tree) and is about as fast as transmission gates: their extra junction capacitance offsets their lower resistance (Carusone §16.1.1).

> [!note]- Detail: folded and multiple resistor strings (Carusone §§16.1.2–16.1.3)
> **Folded string:** decode like a memory. The MSBs select one word line, which connects a block of adjacent taps to the bit lines; a bit-line decoder picks one. Junctions on the output fall from $2^N$ to $2\cdot2^{N/2}$: 64 instead of 1024 for 10 bits. The speed-up is less than that ratio, because every bit line must move when a word line rises.
>
> **Multiple strings:** buffers copy two adjacent taps of a coarse string onto the ends of a fine string that interpolates between them. Only $2\times2^{N/2}$ resistors, and still monotonic if the buffer offsets match and don't depend on voltage. The fine string only resolves LSBs, so it may match worse: a 10-bit DAC with a 4-bit coarse string matched to 0.1% needs the 6-bit fine string matched to only $2^4\times0.1\% = 1.6\%$ (Ex. 16.2). The buffers must be fast and quiet.
>
> **Signed outputs:** tying the bottom of the string to $-V_{REF}$ needs a matched negative supply; any mismatch is an offset. An SC gain stage whose input clock phases are swapped for negative codes avoids it (Fig. 16.6).

### A Resistive Load Bends the Ladder

$$
\boxed{\mathrm{INL}_j \approx -\frac{j^2(m-j)}{m^2}\frac{R_u}{R_L}V_{REF},\qquad \lvert\mathrm{INL}\rvert_{max} = \frac{4}{27}\frac{mR_u}{R_L}V_{REF}\ \text{at } j=\tfrac{2m}{3}}
$$

The tap's Thevenin resistance $R_{Th} = R_u\,j(m-j)/m$ depends on the code, so the divider into $R_L$ is code-dependent. For 8 bits and INL $<\tfrac12$ LSB the whole ladder must be below $0.013R_L$. In practice: **an RDAC drives a high-impedance buffer, never a resistor.**

> [!note]- Derivation: load INL (Razavi Ex. 9.1)
> At code $j$: $V_{Th} = jV_{REF}/m$, $R_{Th} = (jR_u)\parallel[(m-j)R_u] = R_uj(m-j)/m$. Then $V_{out} = V_{Th}R_L/(R_L+R_{Th})$. Subtract the end-point line $(j/m)V_{REF}$ (taking $j=m$ as the end point for simplicity): $\mathrm{INL}_j = -\frac{j^2(m-j)R_u}{R_L+R_uj(m-j)/m}\frac{V_{REF}}{m^2}$. With $R_L\gg R_{Th}$ the denominator is $R_L$. Maximise $j^2(m-j)$: $j = 2m/3$, value $4m^3/27$. Setting $\frac{4}{27}\frac{mR_u}{R_L}V_{REF} < V_{REF}/(2m)$ gives $mR_u/R_L < 27/(8m)$; 8 bits: $27/2048 = 0.013$.

### Settling: Fanout and Ladder Resistance

```tikz title="Settling model of a 1-of-n RDAC (left): the selected switch drives the drain capacitance of all m switches. The ladder's Thevenin resistance (right) peaks at midscale, where settling must be checked. After Razavi DC Fig. 9.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[V,l=$\frac{j}{m}V_{REF}$] (0,2) to[R,l=$R_{Th}$] (2,2) to[R,l=$R_{sw}$] (4,2) to[C,l=$mC_{sw}$] (4,0) -- (0,0);
  \draw (4,2) -- (4.8,2) node[right]{$V_{out}$};
  \draw (2,0) node[ground]{};
  \begin{scope}[xshift=7.3cm]
    \draw[->] (0,0) -- (4.4,0) node[right]{$j$};
    \draw[->] (0,0) -- (0,2.6) node[above]{$R_{Th}$};
    \draw[thick,domain=0:4,samples=40] plot (\x,{2*\x*(4-\x)/4});
    \draw[dotted] (2,0) node[below]{$m/2$} -- (2,2);
    \draw[dotted] (0,2) node[left]{$mR_u/4$} -- (2,2);
    \node[below] at (4,0) {$m$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\tau = (R_{Th}+R_{sw})\,mC_{sw},\qquad t_s\approx\tau\ln(2m)}
$$

| Regime | Worst-case $t_s$ | Note |
|---|---|---|
| $R_{sw}\gg mR_u/4$ | $mR_{sw}C_{sw}\ln(2m)$ | $R_{sw}C_{sw}$ is a **technology constant** (both scale with $W$): the floor |
| $R_{sw}\ll mR_u/4$ | $\frac{m^2}{4}R_uC_{sw}\ln(2m)$ | grows as $m^2$; 8 bits: $1.02\times10^5R_uC_{sw}$ |
| Binary tree, $R_{Th}\ll NR_{sw}$ | $\tau_2\approx(3N-1)NR_{sw}C_{sw}$ | 8 bits: $184$ vs $256\,R_{sw}C_{sw}$ for 1-of-n |

- Neither extreme is optimal: wide switches lower $R_{sw}$ but raise $C_{sw}$.
- **Design order** (Razavi §9.2): (1) power budget fixes the ladder, $P = V_{REF}^2/(mR_u)$; (2) start with $R_{sw}\approx R_{Th,max} = mR_u/4$; (3) include $C_L$ and tune the switch width in simulation. If $t_s$ is still too long, spend power: lower $R_u$.
- Going from 7 to 8 bits with the ladder neglected: $\tau\to2\tau$ *and* the target tightens, $t_s\to 2\tau\ln(4m)$.
- Inside ADCs the code usually arrives in 1-of-n form, which favours the 1-of-n ladder over the tree.

> [!note]- Detail: the zero-value time-constant estimate (Carusone Ex. 16.1)
> For an RC line of $n$ resistors $R$ with $C$ at every node, sum each capacitor's time constant with the others open: $RC(1+2+\dots+n) = RC\,n(n+1)/2 \approx RCn^2/2$. Settling to 0.1% takes about $7\tau$. This is the tool for estimating a switch tree or the ladder itself when it carries a moving reference (a multiplying DAC).

### Differential and Folded Ladders

- A differential RDAC takes taps $j$ and $m-1-j$ from one ladder. The differential LSB is **doubled** ($2V_{REF}/m$), so halve $V_{REF}$ to keep the old LSB.
- Halving $V_{REF}$ has a bonus (Razavi Ex. 9.3, 1 V supply): single-ended with $V_{REF}=0.6$ V, taps near $V_{REF}$ need PMOS or complementary switches (an NMOS there has only 0.4 V of $V_{GS}$), with an n-well next to every switch. Differential with $V_{REF} = 0.3$ V, **NMOS-only** switches work, worst-case $V_{GS}\approx0.7$ V.
- The two switches of a pair ($S_0$ and $S_8$ in Razavi Fig. 9.5) share one control line but sit at opposite ends of the ladder: long routing. **Folding the ladder** into an inverted U puts them side by side.

### Gradients and Random Mismatch

```tikz title="A linear resistance gradient bows the whole curve below the end-point line (INL, left, peak at midscale), and its DNL grows linearly away from midscale (right). After Razavi DC Fig. 9.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (4.6,0) node[right]{$j$};
  \draw[->] (0,-2) -- (0,1) node[above]{INL};
  \draw[thick,domain=0:4,samples=40] plot (\x,{-1.6*\x*(4-\x)/4});
  \draw[dotted] (2,0) -- (2,-1.6) node[below]{$m/2$};
  \node[font=\scriptsize,fill=white,inner sep=1pt] at (2,-0.6) {peak $-\frac{m}{8}\frac{\Delta R}{R_0}V_{REF}$};
  \node[above] at (4,0) {$m$};
  \begin{scope}[xshift=7cm,yshift=-0.5cm]
    \draw[->] (0,0) -- (4.6,0) node[right]{$j$};
    \draw[->] (0,-1.5) -- (0,1.5) node[above]{DNL};
    \draw[thick] (0,-1.2) -- (4,1.2);
    \node[below] at (2,0) {$m/2$};
    \node[font=\scriptsize,align=left,anchor=west] at (0.2,1.1) {steps short below midscale,\\ long above it};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{gradient } (R_k = R_0+k\Delta R):\quad \lvert\mathrm{INL}\rvert_{max} = \frac{m}{8}\frac{\Delta R}{R_0}V_{REF}\ \Rightarrow\ \frac{\Delta R}{R_0}<\frac{4}{m^2},\qquad \mathrm{DNL}_j = \left(j-\frac{m-1}{2}\right)\frac{\Delta R}{R_0}\frac{V_{REF}}{m}}
$$

$$
\boxed{\text{random:}\quad \sigma_{V_j} = \sqrt{j\left(1-\frac jm\right)}\,\frac{\sigma_R}{R_0}\frac{V_{REF}}{m},\qquad \sigma_{INL,max} = \frac{1}{\sqrt{4m}}\frac{\sigma_R}{R_0}V_{REF} = \sqrt{\frac m4}\,\frac{\sigma_R}{R_0}\ \text{LSB}\ \Rightarrow\ \frac{\sigma_R}{R_0}<\frac{1}{\sqrt m}}
$$

- Both ends are **pinned** ($0$ and $V_{REF}$) whatever the mismatch, so both errors peak at midscale.
- A gradient is the harder spec: 8 bits needs $\Delta R/R_0 < 1/128^2$ per unit. Real gradients are small enough for about 10 bits.
- Random mismatch is **averaged**: 8 bits needs only $\sigma_R/R<6.3\%$, far looser than $1/512$. Unit matching need not reach the DAC resolution.
- **Adding a bit** with the same resistors halves INL in volts ($m$ doubles, like making each resistor $\sqrt2$ better matched) but raises it by $\sqrt2$ in LSB. A 0.5 LSB 8-bit ladder becomes a $0.5\sqrt2$ LSB 9-bit ladder (Razavi Ex. 9.7).

> [!tip] Remark
> Resistor mismatch falls as $1/\sqrt{WL}$ like transistor mismatch; 0.1% is reachable with large resistors ([[Nonlinearity and Mismatch#Where Mismatch Comes From: Averaging]], [[Resistor]]). The cure for gradients is layout, not area: [[Common-Centroid Layout]].

> [!note]- Derivation: gradient and midpoint statistics (Razavi Eqs. 9.15–9.21, Ex. 9.6)
> **Gradient.** $V_j = V_{REF}\sum_{k<j}(R_0+k\Delta R)/\sum_{k<m}(R_0+k\Delta R) = V_{REF}\frac{jR_0+\Delta R\,j(j-1)/2}{mR_0+\Delta R\,m(m-1)/2}$. Subtract $(j/m)V_{REF}$ and keep first order in $\Delta R$: $\mathrm{INL}_j\approx\frac{j(j-m)}{2m}\frac{\Delta R}{R_0}V_{REF}$, peak $-\frac m8\frac{\Delta R}{R_0}V_{REF}$ at $j=m/2$. Set it below $V_{REF}/(2m)$. The DNL follows from $V_{j+1}-V_j-V_{REF}/m$, or by differentiating the INL in $j$.
>
> **Random midpoint.** Top half: $(m/2)R_0+\Delta R_t$, bottom half: $(m/2)R_0+\Delta R_b$, each with $\sigma = \sqrt{m/2}\,\sigma_R$. Expanding the divider to first order, $V_{mid}\approx V_{REF}/2 + V_{REF}(\Delta R_b-\Delta R_t)/(2mR_0)$. The two halves are independent, so $\sigma(\Delta R_b-\Delta R_t) = \sqrt m\,\sigma_R$, giving $\sigma_{V,mid} = V_{REF}\sigma_R/(2\sqrt mR_0) = V_{REF}\sigma_R/(\sqrt{4m}R_0)$. Divide by $V_{REF}/m$ for LSB. The general tap result is from Kuboki et al. (Razavi Ref. [1]).

### Reference Bounce and the Reference Buffer

```tikz title="Reference-buffer output impedance: low at DC, rising like an inductor from the op amp's pole to its unity-gain frequency (solid). A capacitor on the reference node turns it over at omega_1 (dashed). After Razavi DC Fig. 9.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.2,0) node[right]{$\omega$ (log)};
  \draw[->] (0,0) -- (0,3.3) node[above]{$\lvert Z_{out}\rvert$ (log)};
  \draw[thick] (0.2,0.6) -- (1.5,0.6) -- (4.5,2.6) -- (6.8,2.6);
  \draw[thick,dashed] (2.6,1.33) -- (3.4,1.65) -- (4.4,1.0) -- (5.8,0.3);
  \draw[dotted] (1.5,0) node[below]{$\omega_0$} -- (1.5,0.6);
  \draw[dotted] (4.5,0) node[below]{$(1+A_0)\omega_0$} -- (4.5,2.6);
  \draw[dotted] (3.4,0) node[below]{$\omega_1$} -- (3.4,1.65);
  \node[left,font=\scriptsize] at (0,0.6) {$\frac{R_0}{1+A_0}$};
  \node[left,font=\scriptsize] at (0,2.6) {$R_0$};
  \node[font=\scriptsize,anchor=west] at (4.5,1.2) {with $C_1$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{bypass helps only if } C_1 \gtrsim 2m\,C_L},\qquad\boxed{Z_{out}(s) = R_0\frac{s+\omega_0}{s+(A_0+1)\omega_0}}
$$

- The reference has an output resistance $R_T$; it simply adds to the ladder resistance in the settling time constant. Its voltage "bounces" every time the DAC switches.
- A **decoupling capacitor** $C_1$ shares charge with the load at once but also slows the recovery to $R_T(C_L+C_1)$. It only wins when the initial charge-sharing step is already inside the error band: $C_1\approx 2mC_L$, i.e. $512\,C_L$ for 8 bits.
- A **buffer** (op amp $A_0/(1+s/\omega_0)$, open-loop output resistance $R_0$) has a zero at $\omega_0$ and a pole near its unity-gain frequency: it looks **inductive** in between. Fast settling needs a wide-band, power-hungry buffer, plus a capacitor on its output to cap the peak; the capacitor value is set by time-domain simulation, not by formula.

> [!note]- Derivation: why the bypass must be $2m\times$ the load (Razavi Ex. 9.8)
> Without $C_1$: $t_1 = R_TC_L\ln(2m)$. With $C_1$, at $t=0^+$ charge sharing puts the output at $V_0 = V_{REF}C_1/(C_1+C_L)$, then it recovers with $\tau_2 = R_T(C_L+C_1)$: $t_2 = R_T(C_L+C_1)\ln\!\left(2m\frac{C_L}{C_1+C_L}\right)$. Requiring $t_2<t_1$ gives $(1+C_1/C_L)\ln\frac{C_L}{C_1+C_L}<\ln\frac{1}{2m}$; for $C_1\gg C_L$ it reduces to $1+C_1/C_L>2m$. At that point the initial step lands within $\tfrac12$ LSB and stays there.
>
> **Buffer impedance.** Closed-loop output impedance is the open-loop $R_0$ divided by $1+$ loop gain: $Z_{out} = R_0/[1+A_0/(1+s/\omega_0)]$, which rearranges to the boxed form.

## Level 3: Current-Steering DACs

### Steering, Not Switching

```tikz title="Switching a unit off (left) lets the tail node X collapse; turning it back on, C_X must recharge from the output: a glitch. Steering the current to a second branch (right) keeps X nearly constant and gives a differential output. After Razavi DC Figs. 10.3, 10.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \node[left] at (M1.G) {$V_b$};
  \node[right,font=\scriptsize] at ([xshift=0.2cm]M1.center) {$M_1$};
  \draw (M1.S) node[ground]{};
  \draw (0,1.9) node[nmos](M2){};
  \node[left] at (M2.G) {$D_1$};
  \node[right,font=\scriptsize] at ([xshift=0.2cm]M2.center) {$M_2$};
  \draw (M1.D) -- (M2.S);
  \draw (M1.D) node[circ]{} node[left,font=\scriptsize]{$X$} -- ++(1.6,0) to[C,l=$C_X$] ++(0,-1.2) node[ground]{};
  \draw (M2.D) to[short,-o] ++(0,0.3) node[right]{$V_{out}$} to[R,l=$R_L$] ++(0,1.3) node[above]{$V_{DD}$};
  \begin{scope}[xshift=6cm]
    \draw (0,0) node[nmos](N1){};
    \node[left] at (N1.G) {$V_b$};
    \draw (N1.S) node[ground]{};
    \draw (-1,1.9) node[nmos](Na){};
    \draw (1,1.9) node[nmos,xscale=-1](Nb){};
    \node[left] at (Na.G) {$D_1$};
    \node[right] at (Nb.G) {$\bar D_1$};
    \draw (Na.S) |- (N1.D); \draw (Nb.S) |- (N1.D);
    \draw (N1.D) node[circ]{} node[below right,font=\scriptsize]{$X$};
    \draw (Na.D) to[R,l=$R_L$] ++(0,1.6) node[above]{$V_{DD}$};
    \draw (Nb.D) to[R,l_=$R_L$] ++(0,1.6) node[above]{$V_{DD}$};
    \draw (Na.D) node[circ]{} -- ++(-0.7,0) node[left]{$A$};
    \draw (Nb.D) node[circ]{} -- ++(0.7,0) node[right]{$B$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Each unit is a tail source plus a differential switching pair. The current is **steered** between two loads, never interrupted, so the tail node $X$ (and its $C_X$) barely moves.
- The DAC becomes **differential** for free: $V_A$ and $V_B$ move oppositely and cross at midscale. That halves the even-order distortion, makes the output less sensitive to supply noise, and keeps the **supply current constant** ($mI_0$ for every code).
- Supply inductance makes the difference concrete: a single-ended DAC jumping $000\to111$ draws a $7I_0$ step through $L_{DD}$ ($L_{DD}\,dI/dt$ undershoot, then ringing); the differential one keeps drawing $7I_0$. Some current still moves: during finite edges $V_X$ dips and $C_X$ supplies part of $I_0$ (Razavi Ex. 10.2, Fig. 10.6c).
- Unlike a ladder, an IDAC **drives a resistive load** but its output **cannot swing to the rails**: sources and switches need headroom.

### Unit Cells and Deterministic Mismatch

- **Edge effects:** the gate climbs over the channel edges, so the effective width is less than the drawn $W$, and a $2W$ device carries *less* than twice the current. Build every weight from **parallel identical units**: an 8-bit IDAC is 255 units grouped as $1,2,4,\dots,128$.
- **Channel-length modulation:** if the switches are identical, the one carrying $2I_0$ drops more $V_{DS}$, so its source sits lower and $I_{D2}<2I_{D1}$. **Scale the switches with the sources**: make a switching unit (source plus pair) and replicate *it*. Then every source sees the same $V_{DS}$ for every code.

### Random Mismatch and Unit Sizing

$$
\boxed{\frac{\sigma_I^2}{I_0^2} = \frac{A_\beta^2}{WL}+\frac{4A_{VT}^2}{(V_{GS}-V_{TH})^2WL}}
$$

Two knobs: **gate area** and **overdrive**. A current source wants a *large* overdrive, the opposite of a differential pair's input devices. The bound it must meet is set by the coding: $1/\sqrt{2m}$ for INL, $0.5$ (thermometric) or $1/m$ (binary) for DNL.

> [!tip] Remark
> This is $\Delta I/I = \Delta\beta/\beta - (g_m/I_D)\Delta V_{TH}$ squared and averaged over area, from [[Nonlinearity and Mismatch#Current Mismatch: the Opposite Instruction]]. The overdrive is capped by output swing, which is why the spec-translation example lands at only about 100 mV. Lay the units out as a common-centroid array ([[Common-Centroid Layout]]) to turn gradients into random error.

### Binary, Thermometric, R-2R and Segmented Arrays

```tikz title="Segmented IDAC: a 127-unit thermometric array for the 7 MSBs on the output node, and a 3-bit R-2R ladder that weights three more unit sources by 1/2, 1/4, 1/8. Ten bits from 130 units. After Razavi DC Figs. 10.13, 10.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.85cm]
  \draw (0,3.6) -- (8.4,3.6) node[right]{ac GND};
  \foreach \x/\r in {1/2R,3.4/2R,5.8/2R,8.2/R} { \draw (\x,2) to[R,l=\scriptsize$\r$] (\x,3.6); }
  \draw (1,2) to[R,l_=\scriptsize$R$] (3.4,2) to[R,l_=\scriptsize$R$] (5.8,2) to[R,l_=\scriptsize$R$] (8.2,2);
  \foreach \x/\d/\i in {3.4/D_3/I_3,5.8/D_2/I_2,8.2/D_1/I_1} {
    \draw (\x,2) node[circ]{} to[nos,l_=\scriptsize$\d$] (\x,0.9) to[I,l_=\scriptsize$\i$] (\x,-0.4) node[ground]{};
  }
  \draw (1,2) node[circ]{} -- (-0.4,2) node[left]{$V_{out}$};
  \draw (1,2) -- (1,1.2);
  \node[draw,minimum width=1.9cm,minimum height=0.9cm,align=center,font=\scriptsize] at (1,0.6) {127 units $I_0$\\ thermometer $n$};
  \draw (1,0.15) -- (1,-0.4) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (-0.6,-1.4) {$V_{out} = -R\left(nI_0+D_3\frac{I_3}{2}+D_2\frac{I_2}{4}+D_1\frac{I_1}{8}\right)$, all sources $=I_0$};
\end{circuitikz}
\end{document}
```

- **R-2R:** equal current sources, binary weights from the ladder. $N$ sources and $3N-2$ unit resistors for $N$ bits. Each Norton reduction halves the current and presents $2R$ again; the whole DAC is a Norton source $I_4+I_3/2+I_2/4+I_1/8$ with output resistance $R$, so it also gives a voltage directly.
- But R-2R is still **binary**: the MSB-carry DNL of [[#Binary-Weighted vs Thermometric]] applies, and the ladder puts a different $V_{DS}$ on each source (a channel-length-modulation mismatch). Limit it to about **4 bits**. The resistors are not the limit; they usually match better than the sources.
- Why a ladder and not $I_0/2$, $I_0/4$ sources? Transistor widths cannot shrink arbitrarily.

$$
\boxed{\text{10-bit, 7+3 segmented:}\quad \text{DNL: }\frac{\sigma_I}{I_0}<\frac{1}{2\sqrt{85}}\approx5.4\%,\qquad \text{INL: }\frac{\sigma_I}{I_0}<\frac{1}{128}\approx0.78\%}
$$

- The worst DNL is at a segment carry ($\cdots0111\to\cdots1000$): one MSB unit turns on, three LSB sources turn off. Four **independent** units: $\sigma = \sqrt{1+\tfrac14+\tfrac1{16}+\tfrac1{64}}\,\sigma_I = \frac{\sqrt{85}}{8}\sigma_I$, against $\tfrac12$ LSB $=I_0/16$. Far better than a binary MSB carry.
- **INL is set by the MSB array alone**: at midscale 64 units are on, $8\sigma_I < I_0/16$. INL again demands more than DNL.

> [!note]- Detail: Carusone's segmented and binary circuits
> Carusone's 6-bit segmented example (Fig. 16.22) thermometer-codes 2 MSBs with three equal sources, and diverts a fourth MSB-sized source into a 4-bit binary current divider for the LSBs: not monotonic in the LSB segment, but its accuracy needs are relaxed. Other binary circuits in Carusone §16.2: binary-weighted resistors into an op-amp virtual ground ($V_{out} = (R_F/R)V_{REF}B_{in}$; resistor and current ratios of order $2^N$, switches must be scaled, glitch-prone), the reduced-resistance-ratio ladder (a series $3R$ divides a sub-array by 4), and the R-2R voltage ladder (Fig. 16.10; internal nodes fixed, so fast, but switch currents still binary) versus the equal-switch-current variant (Fig. 16.11, slower because the internal nodes swing).

### Output Resistance Compresses the Characteristic

```tikz title="Finite unit output resistance. Single-ended (left): the slope falls as more units load the output (compression), INL peaks at midscale. Differential (right): the even part cancels; INL is an odd S-curve with zeros at 0, m/2, m and peaks at (3 +/- sqrt3)m/6. After Razavi DC Figs. 10.16, 10.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (4.6,0) node[right]{$j$};
  \draw[->] (0,0) -- (0,3.2) node[above]{$V_{out}$};
  \draw[dashed,gray] (0,0) -- (4,2.6);
  \draw[thick,domain=0:4,samples=40] plot (\x,{2.6*\x/4 + 0.55*\x*(4-\x)/4});
  \node[font=\scriptsize,anchor=west] at (0.4,2.6) {$jI_0\left(R_L\parallel\frac{r_O}{j}\right)$};
  \node[font=\scriptsize,anchor=west] at (2.4,1.0) {end-point line};
  \node[below] at (4,0) {$m$};
  \begin{scope}[xshift=7cm,yshift=1.4cm]
    \draw[->] (0,0) -- (4.6,0) node[right]{$j$};
    \draw[->] (0,-1.4) -- (0,1.6) node[above]{INL};
    \draw[thick,domain=0:4,samples=60] plot (\x,{12*(2*\x/4-1)*((\x/4)*(\x/4)-\x/4)});
    \draw[dotted] (0.845,0) -- (0.845,1.15);
    \node[font=\scriptsize,above] at (0.845,1.15) {$\frac{3-\sqrt3}{6}m$};
    \node[below left,font=\scriptsize] at (2,0) {$m/2$};
    \node[below right,font=\scriptsize] at (4,0) {$m$};
  \end{scope}
\end{circuitikz}
\end{document}
```

| | Single-ended | Differential |
|---|---|---|
| INL | $\approx\frac{I_0R_L^2}{r_O}j(m-j)$, peak $\frac{m^2I_0R_L^2}{4r_O}$ at $m/2$ | $\approx\frac{I_0R_L^3}{r_O^2}(2j-m)(j^2-mj)$, peak $\frac{3\sqrt3}{18}\frac{I_0R_L^3m^3}{r_O^2}$ |
| INL $<\tfrac12$ LSB needs | $r_O > m^2R_L/2$ | $r_O > \sqrt{\sqrt3/18}\,m^{3/2}R_L$ |
| Harmonic (full-scale sine) | $HD_2 = \frac{mR_L}{4r_O}$, no HD3 | $HD_3 = \left(\frac{mR_L}{4r_O}\right)^2$, no HD2 |
| 8 bits, 50 Ω, 0.5 V | $r_O > 1.64$ MΩ at 39 µA (hard) | $r_O > 63.5$ kΩ, and twice the swing |

$$
\boxed{HD_2^{SE} = \frac{mR_L}{4r_O},\qquad HD_3^{diff} = \left(\frac{mR_L}{4r_O}\right)^2}
$$

- $mR_L/(4r_O)$ is a quarter of the load divided by the output resistance of all $m$ sources in parallel. One number sets both cases; going differential **squares** it.
- The same bounds hold for binary-weighted DACs: at midscale half the units are on either way.
- Single-ended gain *falls* with code (compression); differential gain *rises* toward the ends. The differential 1 LSB is $\approx 2I_0R_L$.
- Example: an 8-bit single-ended DAC with $HD_2 = -50$ dB needs $mR_L/(4r_O) = 0.32\%$, $r_O\approx1$ MΩ (Razavi Ex. 10.7).

> [!note]- Derivation: single-ended and differential INL and harmonics (Razavi §10.6)
> **Single-ended.** $V_{out}(j) = jI_0(R_L\parallel r_O/j) = jI_0R_Lr_O/(jR_L+r_O)$. The end-point line is $jI_0(R_L\parallel r_O/m)$. Subtracting, $\mathrm{INL}_j = jI_0R_L\frac{(m-j)R_Lr_O}{(jR_L+r_O)(mR_L+r_O)}\approx\frac{I_0R_L^2}{r_O}j(m-j)$ for $r_O\gg mR_L$. Peak $m^2I_0R_L^2/(4r_O)$; set it below $I_0R_L/2$.
>
> For the harmonic, $V_{out}\approx jI_0R_L(1-jR_L/r_O)$ with $j = \frac m2+\frac m2\cos\omega_1t$. The $j^2$ term gives a second harmonic of amplitude $I_0R_L^2m^2/(8r_O)$ against a fundamental of $I_0R_Lm/2$: $HD_2 = mR_L/(4r_O)$. There is only a square term, so only HD2.
>
> **Differential.** $V_{out} = jI_0(R_L\parallel\frac{r_O}{j})-(m-j)I_0(R_L\parallel\frac{r_O}{m-j}) = I_0R_Lr_O^2\frac{2j-m}{(jR_L+r_O)[(m-j)R_L+r_O]}$. Subtract the line through $\pm mI_0(R_L\parallel r_O/m)$ to get $\mathrm{INL}_j\approx\frac{I_0R_L^3}{r_O^2}(2j-m)(j^2-mj)$, zero at $0,m/2,m$, extrema at $j = \frac{3\pm\sqrt3}{6}m$. Expanding $V_{out}$ to second order gives a polynomial in $j$; the input is symmetric about $m/2$, so the even terms produce no even harmonics ([[Nonlinearity and Mismatch#Single-Ended vs Differential]]). The cubic coefficient $-2I_0R_L^3/r_O^2$ gives a third harmonic $\frac{\alpha_3}{4}(m/2)^3 = -I_0R_L^3m^3/(16r_O^2)$ against a fundamental $2I_0R_L(m/2)$: $HD_3 = (mR_L/4r_O)^2$.

### Raising the Output Resistance: Cascodes and Compliance

```tikz title="Unit cell with a cascoded source (M1, M2) and the switch pair (M3, M4) acting as a second cascode while saturated (left). Its output impedance falls above the tail pole omega_p = 1/(r_O3 C_P) (right). After Razavi DC Figs. 10.20(b), 10.35."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \node[left] at (M1.G) {$V_{b1}$};
  \node[right,font=\scriptsize] at ([xshift=0.15cm]M1.center) {$M_1$};
  \draw (M1.S) node[ground]{};
  \draw (0,1.6) node[nmos](M2){};
  \node[left] at (M2.G) {$V_{b2}$};
  \node[right,font=\scriptsize] at ([xshift=0.15cm]M2.center) {$M_2$};
  \draw (M1.D) -- (M2.S);
  \draw (-1,3.4) node[nmos](M3){};
  \draw (1,3.4) node[nmos,xscale=-1](M4){};
  \node[left] at (M3.G) {$V_G$};
  \node[right] at (M4.G) {$\bar V_G$};
  \draw (M3.S) |- (M2.D); \draw (M4.S) |- (M2.D);
  \draw (M2.D) node[circ]{} node[below right,font=\scriptsize]{$P$};
  \draw (M3.D) -- ++(0,0.4) node[above]{$V_{out}$};
  \draw (M4.D) -- ++(0,0.4) node[above]{$\bar V_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (2.2,0.4) {$R_{out2} = (1+g_{m2}r_{O2})r_{O1}+r_{O2}$\\ $R_{out3} = (1+g_{m3}r_{O3})R_{out2}+r_{O3}$\\ saturated if $V_{out}\ge V_G-V_{TH}$};
  \begin{scope}[xshift=8.2cm,yshift=0.2cm]
    \draw[->] (0,0) -- (5,0) node[right]{$\omega$ (log)};
    \draw[->] (0,0) -- (0,3.4) node[above]{$|Z_u|$ (log)};
    \draw[thick] (0.2,2.7) -- (1.4,2.7) -- (3.6,0.7) -- (4.8,0.7);
    \draw[dotted] (1.4,0) node[below]{$\omega_p$} -- (1.4,2.7);
    \draw[dotted] (3.6,0) node[below]{$\omega_z$} -- (3.6,0.7);
    \node[font=\scriptsize,anchor=west] at (0.1,3.05) {$(1+g_{m1}r_{O1})r_{O3}+r_{O1}$};
    \node[font=\scriptsize,anchor=west] at (3.7,1.0) {$r_{O1}$};
    \node[font=\scriptsize,anchor=west] at (2.5,2.0) {$\approx\frac{g_{m1}r_{O1}}{C_Ps}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Cascode the source** ($M_2$): a long $M_2$ gives $g_mr_O\approx10$–20. **Let the switch be a cascode** ($M_3$, minimum $L$, $g_mr_O\approx5$–10), but only while it stays saturated.
- **Compliance:** $V_{DS1}+V_{DS2}+V_{DS3} < V_{out} < V_{DD}$. With $V_{DS}\approx100$ mV each and $V_{DD}=1$ V: 0.7 V$_{pp}$ single-ended.
- The catch is the gate drive: keeping $M_3$ saturated at the bottom of that swing needs $V_G\approx V_{TH}+V_{DS1}+V_{DS2}+V_{DS3}\approx0.6$ V, so the data path must run from a 0.6 V supply. Driving the gates rail-to-rail is simpler but shrinks the saturated swing to $V_{DD}$ down to $V_{DD}-V_{TH}$.
- If the switches are in triode (rail-to-rail gates, large swing), the source alone must supply $r_O$: lengthen $M_1$ first, cascode if it gets too long (Razavi §10.7).

> [!tip] Remark
> These are the cascode output resistance and the compliance limit of [[Current Mirrors#Cascode Mirror]] and [[Current Mirrors#Compliance: How a Cascode Source Fails]]. The single-ended switch in triode is Razavi Ex. 10.1: $R_{out} = r_{O1}+R_{on}$, almost no boost.

## Level 4: Current-Steering Arrays and Dynamics

### Matrix Architecture and Local Decoding

```tikz title="Matrix IDAC (6 thermometric bits as 8 x 8): row and column thermometer decoders drive every cell, each cell has a local decoder, and a ring of dummy cells gives every active cell the same surroundings. Shaded: the cells on for code 19 (rows 1-2 full, 3 cells of row 3). After Razavi DC Figs. 10.22, 10.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i in {0,...,9} { \foreach \j in {0,...,9} {
    \pgfmathsetmacro{\d}{(\i==0 || \i==9 || \j==0 || \j==9) ? 1 : 0}
    \ifdim\d pt=1pt \fill[gray!25] (\i*0.5,-\j*0.5) rectangle ++(0.45,-0.45); \else \draw (\i*0.5,-\j*0.5) rectangle ++(0.45,-0.45); \fi
  } }
  \foreach \i in {1,...,8} { \foreach \j in {1,2} { \fill[blue!35] (\i*0.5,-\j*0.5) rectangle ++(0.45,-0.45); } }
  \foreach \i in {1,2,3} { \fill[blue!35] (\i*0.5,-1.5) rectangle ++(0.45,-0.45); }
  \node[draw,minimum width=4cm,minimum height=0.5cm,font=\scriptsize] at (2.475,0.6) {column decoder ($D_3D_2D_1$) $\to$ 11100000};
  \node[draw,minimum width=4cm,minimum height=0.5cm,font=\scriptsize,rotate=90] at (-0.65,-2.475) {row decoder ($D_6D_5D_4$) $\to$ 11100000};
  \node[font=\scriptsize,anchor=north] at (2.475,-5.1) {gray ring: dummy cells};
  \begin{scope}[xshift=8.4cm,yshift=-1.4cm]
    \node[draw,minimum width=0.9cm,minimum height=0.5cm,font=\scriptsize] (and2) at (0,0.5) {AND};
    \node[draw,minimum width=0.9cm,minimum height=0.5cm,font=\scriptsize] (and1) at (0,-0.5) {AND};
    \node[draw,minimum width=0.9cm,minimum height=0.5cm,font=\scriptsize] (or) at (1.8,0) {OR};
    \draw (and2.east) -- (or.west); \draw (and1.east) -- (or.west);
    \draw[->] (or.east) -- ++(0.7,0) node[right]{$D_{out}$};
    \draw (-1.6,0.65) node[left,font=\scriptsize]{$Row_j$} -- ([yshift=0.15cm]and2.west);
    \draw (-1.6,0.35) node[left,font=\scriptsize]{$Row_{j+1}$} -- ([yshift=-0.15cm]and2.west);
    \draw (-1.6,-0.35) node[left,font=\scriptsize]{$Row_j$} -- ([yshift=0.15cm]and1.west);
    \draw (-1.6,-0.65) node[left,font=\scriptsize]{$Col_k$} -- ([yshift=-0.15cm]and1.west);
    \node[font=\scriptsize,align=center] at (0.9,-1.5) {cell on if its row is full,\\ or its row is the partial one and $Col_k=1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- A long linear array of units is disproportionate in $x$ and $y$ and suffers large IR drops. A **square matrix** with a **two-step thermometer decode** (row code from the MSBs, column code from the LSBs, a few gates per cell) routes cleanly (Miki 1986, Razavi Ref. [1]; Carusone Fig. 16.17).
- **Local logic:** $D_{out} = Row_j\cdot Row_{j+1} + Row_j\cdot Col_k$. Full rows are on; the first partially-filled row is resolved by the column code.
- **Dummy cells** (identical, terminals grounded) on all four sides: an edge cell otherwise sees different neighbours than a middle cell.

### Gradients Accumulate Across the Array

```tikz title="One row of an array with a linear gradient (unit p carries I0 + (p-1)dI). Turning cells on left to right accumulates a quadratic error, peak -8 dI (circles). The sequence 1,8,2,7,3,6,4,5 cuts the peak to -3.5 dI (squares) but leaves a 7 dI DNL step. After Razavi DC Figs. 10.24-10.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.0,0) node[right]{$j$ (units on in the row)};
  \draw[->] (0,-3.6) -- (0,0.6) node[above]{INL / $\Delta I$};
  \foreach \v in {-2,-4,-6,-8} { \draw (0.05,\v*0.4) -- (-0.05,\v*0.4) node[left,font=\scriptsize]{\v}; }
  \draw[gray] plot coordinates {(0,0) (0.75,-1.4) (1.5,-2.4) (2.25,-3.0) (3,-3.2) (3.75,-3.0) (4.5,-2.4) (5.25,-1.4) (6,0)};
  \foreach \j/\v in {0/0,1/-3.5,2/-6,3/-7.5,4/-8,5/-7.5,6/-6,7/-3.5,8/0} { \draw (\j*0.75,\v*0.4) circle (2pt); }
  \draw[blue!70!black] plot coordinates {(0,0) (0.75,-1.4) (1.5,0) (2.25,-1.0) (3,0) (3.75,-0.6) (4.5,0) (5.25,-0.2) (6,0)};
  \foreach \j/\v in {0/0,1/-3.5,2/0,3/-2.5,4/0,5/-1.5,6/0,7/-0.5,8/0} { \fill[blue!70!black] (\j*0.75-0.06,\v*0.4-0.06) rectangle ++(0.12,0.12); }
  \foreach \j in {2,4,6,8} { \node[below,font=\scriptsize] at (\j*0.75,0) {\j}; }
  \node[font=\scriptsize,anchor=west] at (3.3,-3.35) {left to right: $\frac{j(j-8)}{2}\Delta I$};
  \node[font=\scriptsize,anchor=west,blue!70!black] at (3.9,-0.9) {reordered};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{8-unit row, gradient } \Delta I:\quad \lvert\mathrm{INL}\rvert_{max} = 8\Delta I,\quad \mathrm{DNL}_{max} = 7\Delta I,\quad \text{gain error } \tfrac{7\Delta I}{2I_0}}
$$

- Unlike random mismatch, a gradient gives **INL and DNL of the same size**: both must be below $\tfrac12$ LSB. The error repeats row by row; the points at the end of each row lie on the end-point line.
- **Reordering the switching sequence** (1, 8, 2, 7, ...) is free (decoder only) and cuts the row INL from $-8\Delta I$ to $-3.5\Delta I$, about $2.3\times$. The DNL stays at $7\Delta I$, because the first and last units still sit next to each other in the sequence. Gradients in $x$ and $y$ add (Razavi Prob. 10.14).

> [!note]- Derivation: gradient INL of one row (Razavi Ex. 10.9)
> With $j$ units on, $I_{out} = \sum_{k=0}^{j-1}(I_0+k\Delta I) = jI_0+\frac{j(j-1)}{2}\Delta I$: quadratic. A full row gives $8I_0+28\Delta I$; 8 rows give $64I_0(1+\frac{7\Delta I}{2I_0})$, the gain error. The end-point line is $jI_0(1+\frac{7\Delta I}{2I_0})$; subtract it within the first row: $\mathrm{INL}_j = \frac{j(j-8)}{2}\Delta I$, peak $-8\Delta I$ at $j=4$. Steps are $I_0, I_0+\Delta I,\dots,I_0+7\Delta I$: DNL up to $7\Delta I$.
>
> Reordered (1, 8, 2, 7, 3, 6, 4, 5): cumulative extra current $0, 7, 8, 14, 16, 21, 24, 28$ (in $\Delta I$) against the line $3.5j$: INL $-3.5, 0, -2.5, 0, -1.5, 0, -0.5, 0$.

### Race Glitches and Local Latches

- Going from $16I_0$ to $17I_0$ in Razavi's matrix, the column code must go $11\cdots1\to10\cdots0$ while the row code goes $1100\cdots\to1110\cdots$. If the column code changes first, the second row empties for a moment ($I_{out}$ drops $7I_0$); if the row code changes first, the third row fills ($+7I_0$). Delays along the rows and columns cause similar races.
- **Fix:** a D-latch in each cell, clocked globally, presents the local decoder's output only after the codes settle. It only helps if the clock skew across the array is smaller than the data skew: decide after extracted-layout simulation.
- Carusone adds a driver-level version: if $d_i$ and $\bar d_i$ are both high the output shorts to ground; if both low, the tail is pulled down and recovers slowly (Fig. 16.17). One fix is to tie one side of each pair to a DC bias and drive only the other (Fig. 16.18, Colles 1988); the tail then sits just where the other side is off, and the pair acts as a cascode while it steers to the output.

### Ground-Line IR Drop

```tikz title="Unit sources share a ground line of resistance r_u per cell. The drops accumulate quadratically toward the far end, stealing g_m times the drop from each source. After Razavi DC Fig. 10.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.9cm]
  \draw (0,0) node[ground]{} -- (0,0.6) node[left]{global GND};
  \draw (0,0.6) to[R,l_=\scriptsize$r_u$] (2,0.6) to[R,l_=\scriptsize$r_u$] (4,0.6) to[R,l_=\scriptsize$r_u$] (6,0.6) -- (6.6,0.6) node[right]{$A$: $V_A = \frac{n(n-1)}{2}I_0r_u$};
  \foreach \x in {0.6,2,4,6} { \draw (\x,2.2) node[above]{\scriptsize$V_{DD}$} to[I,l=\scriptsize$I_0$] (\x,0.6) node[circ]{}; }
\end{circuitikz}
\end{document}
```

- The voltage at the far end is $\frac{n(n-1)}{2}I_0r_u$: $28I_0r_u$ for an 8-unit row. A source whose ground is $\Delta V$ higher loses $g_m\Delta V$ of current. The INL looks like a gradient, peaking at the row ends.
- Razavi Ex. 10.10 (10-bit segmented, 6-bit thermometric as $8\times8$, 10 mA, $V_{OV}\approx300$ mV, $g_m\approx1$ mS): row INL $= -32.5\,g_mI_0r_u$, so $r_u\approx1\ \Omega$ per cell for $\tfrac12$ LSB. Higher resolution tightens it.
- **A uniformly wide line beats a tapered one.** If the cell fits a line of width $W_2$, use it everywhere: tapering to $W_2$ only at the busy end gives $4g_mI_0r_u$ of end-to-end error, the untapered $W_2$ line $2.5\,g_mI_0r_u$ (Ex. 10.11).
- Lower $g_m/I_D$ on the sources (larger $V_{OV}$) lowers $g_m$ and therefore this error too.

### Output Time Constant and Reference Bounce

```tikz title="Reference bounce: the tail dips of all m switching units couple through m C_GD3 onto the shared gate line N of the sources. A bypass C_b on N divides it down. After Razavi DC Figs. 10.33, 10.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[above]{$\Delta V_X$ (tails)} to[C,l=$mC_{GD3}$] (0,1.5) node[circ]{} node[left]{$N$};
  \draw (0,1.5) to[C,l_=$mC_{GS3}$] (0,0) node[ground]{};
  \draw (0,1.5) -- (1.8,1.5) to[C,l=$C_b$] (1.8,0) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (3,1.8) {no $C_b$: $\Delta V_N = \frac{C_{GD3}}{C_{GD3}+C_{GS3}}\Delta V_X$};
  \node[font=\scriptsize,align=left,anchor=west] at (3,1.1) {$\Delta I_{out} = mg_{m3}\Delta V_N$: the dip is multiplied by $m$};
  \node[font=\scriptsize,align=left,anchor=west] at (3,0.4) {with $C_b\gg m(C_{GD3}+C_{GS3})$: $\Delta V_N\approx\frac{mC_{GD3}}{C_b}\Delta V_X$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\tau_{out} = m(C_{GD}+C_{DB})R_L},\qquad\boxed{\Delta I_{out} = \frac{2m\,\Delta V_X}{(V_{GS}-V_{TH})_3}\frac{C_{GD3}}{C_{GD3}+C_{GS3}}I_{SS},\qquad C_b > 4m^2C_{GD3}\frac{\Delta V_X}{(V_{GS}-V_{TH})_3}}
$$

- **Output pole:** each unit adds its switch's $C_{GD}+C_{DB}$ (plus wiring). The big matching device sits behind the switch, and the switch only needs enough width to carry $I_{SS}$ at a reasonable $V_{GS}$, so $\tau$ is small: IDACs are fast.
- **Reference bounce is the real limit.** Full-scale code jumps dip every tail at once; the shared bias line $N$ moves and *every* source changes. Razavi's numbers: $m = 256$, $\Delta V_X = 10$ mV, $V_{OV3} = 200$ mV, $C_{GD3} = 0.2C_{GS3}$ give a $4.3I_{SS}$ glitch on a $256I_{SS}$ output.
- With a bypass, the same numbers need $C_b > 1.31\times10^4C_{GD3}$: 66–130 pF for $C_{GD3}$ = 5–10 fF. Either pay that area, or make sure the tail dip recovers fast enough not to matter. Simulate both.

> [!note]- Derivation: bounce and bypass (Razavi Eqs. 10.57–10.63)
> The dip lasts short compared with the time constant at $N$, so ignore the diode $M_B$: $mC_{GD3}$ and $mC_{GS3}$ form a divider, $\Delta V_N = \Delta V_X C_{GD3}/(C_{GD3}+C_{GS3})$. All $m$ sources respond: $\Delta I_{out} = mg_{m3}\Delta V_N$ with $g_{m3} = 2I_{SS}/V_{OV3}$. With $C_b$ dominating, $\Delta V_N\approx(mC_{GD3}/C_b)\Delta V_X$ and $\Delta I_{out} = 2m^2C_{GD3}\Delta V_XI_{SS}/(C_bV_{OV3})$; require it below $I_{SS}/2$.

> [!tip] Remark
> Same structure as the RDAC reference problem ([[#Reference Bounce and the Reference Buffer]]): a node shared by all $m$ elements is disturbed in proportion to how many switch at once. A larger $V_{OV3}$ (lower $g_m/I_D$) on the sources directly divides the glitch.

### High-Frequency Output Impedance: Phase and Amplitude Distortion

$$
\boxed{C_u\approx\frac{C_P}{g_{m1}r_{O1}},\qquad HD_2^{SE} = \frac{mR_LC_u\omega_1}{4},\qquad HD_3^{diff}\approx\frac12\left(\frac{mR_LC_u\omega_1}{4}\right)^2}
$$

- Labels follow Razavi Fig. 10.35 here: $M_3$ is the tail source, $M_1$/$M_2$ the switches. Above $\omega_p = 1/(r_{O3}C_P)$ the unit's impedance is a capacitor, $C_P/(g_{m1}r_{O1})$, with $C_P = C_{GD3}+C_{DB3}+C_{GS1}+C_{SB1}+C_{GS2}+C_{SB2}$ at the tail.
- The number of these capacitors on the output follows the code, so the output pole moves with the signal, exactly like a sampler whose bandwidth depends on the input. Single-ended: **phase distortion → HD2**. Differential: HD2 cancels and the **amplitude** distortion leaves **HD3** (phase distortion's cubic term is a smaller $C_u^3$ term, Ex. 10.13).
- Read $mR_LC_u\omega_1/4$ as the input frequency over four times the output bandwidth with all units connected.
- Razavi's numbers ($m=64$, $R_L = 50\ \Omega$, $C_u = 2$ fF, 10 GHz): single-ended $HD_2\approx-20$ dB, where a 6-bit DAC needs about $-38$ dB to match its SNR; differential $HD_3 = -46$ dB.

> [!note]- Derivation: code-dependent capacitance (Razavi §10.10.1)
> $Z_u = (1+g_{m1}r_{O1})Z_T+r_{O1}$ with $Z_T = r_{O3}\parallel(1/C_Ps)$: a pole at $1/(r_{O3}C_P)$, a zero higher up. Between them $Z_u\approx g_{m1}r_{O1}/(C_Ps)$.
>
> After a code change, $jI_0$ flows and $j$ capacitors $C_u$ are on the output. With $j = \frac m2(1+\cos\omega_1t)$ the output is a low-pass whose corner moves: $V_{out}\approx\frac m2I_0R_L+\frac m2I_0R_L\cos\!\left[\omega_1t-\left(\frac m2+\frac m2\cos\omega_1t\right)C_uR_L\omega_1\right]$. For a small phase, expand: the product $\sin\omega_1t\cos\omega_1t$ makes $HD_2 = mR_LC_u\omega_1/4$.
>
> Amplitude: $1/\sqrt{1+R^2C^2\omega^2}\approx1-R^2C^2\omega^2/2$ with $C = jC_u$. This is second order in $R_LC_u\omega_1$, so single-ended it is smaller than the phase term (Ex. 10.12). Differential, the phase term's HD2 cancels, and the amplitude term's $\cos^3$ gives $HD_3\approx\frac12(mR_LC_u\omega_1/4)^2$.

### Memory Effect

$$
\boxed{HD_3 = \frac{m\pi R_LC_P}{4(1+g_mr_O)}f}
$$

- While $M_1$ is on, channel-length modulation lets the output voltage $V_X$ set the tail voltage $V_P$. When the unit switches, $C_P$ must move to agree with the *other* output and draws charge $C_P\Delta V_P$, with $\Delta V_P = (V_2-V_1)/(1+g_mr_O)$. The injected charge depends on a **previous** output value.
- Each step is linear, but the delay before a unit switches again depends on the code (in a sinusoid, unit 2 stays on almost a full period, unit 60 only briefly), so the result is distortion (Palmers and Steyaert 2010, Razavi Ref. [2]).
- Razavi's numbers ($m=64$, 50 Ω, $C_P = 10$ fF, $g_mr_O = 5$): $HD_3 = 4.2\% = -27.5$ dB at 10 GHz. Cure: extra cascodes carrying a small constant current (Lin and Bult 1998, Razavi Ref. [3]).

### Calibration: Dynamically Matched Current Sources

```tikz title="Dynamic current-source calibration: during calibration Q1 is diode-connected through S1 and its C_gs charges to whatever V_GS makes I_d1 = I_ref; in use, S1 is open and C_gs holds it. A fixed 0.9 I_ref source in parallel leaves Q1 only 0.1 I_ref to trim. After Carusone Fig. 16.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](Q){};
  \node[right,font=\scriptsize] at ([xshift=0.15cm]Q.center) {$Q_1$};
  \draw (Q.S) node[ground]{};
  \draw (Q.D) -- ++(0,0.6) coordinate (top);
  \draw (top) node[circ]{} -- ++(-1.6,0) coordinate (s1r);
  \draw (s1r) to[nos,l_=$S_1$] (s1r |- Q.G) coordinate (g) -- (Q.G);
  \draw (g) node[circ]{} to[C,l_=$C_{gs}$] ++(0,-1.4) node[ground]{};
  \draw (top) -- ++(1.6,0) coordinate (ps) to[I,l=$0.9I_{ref}$] ++(0,-1.9) node[ground]{};
  \draw (top) -- ++(0,0.6) node[above,align=center,font=\scriptsize]{$S_2$: to $I_{ref}$ (calibrate)\\ or to $I_{out}$ (use)};
\end{circuitikz}
\end{document}
```

- Schouwenaars 1988 (Carusone §16.3.3): a 16-bit audio DAC whose 6 thermometric MSBs use **64** sources, one more than needed, so one can be calibrated while 63 run. A shift register visits each source in turn and sets it against the *same* $I_{ref}$. Only their equality matters, so any common error in $I_{ref}$ is harmless.
- **Limits:** mismatched clock feedthrough and charge injection of the $S_i$. Make $C_{gs}$ and $V_{GS}$ large (a fixed voltage error becomes a small current error), hence the $0.9I_{ref}$ fixed source and a large, low-$g_m$ $Q_1$ ($W/L\approx1/8$). Junction leakage (about 10 pA/µm²) on $C_{gs}$ sets the recalibration interval: 1.7 ms in that design.
- Details there: a common-gate amplifier holds $Q_1$'s $V_{DS}$ at its in-use value during calibration; dummy switches cancel part of the injected charge.

> [!tip] Remark
> The hold-on-$C_{gs}$ error is the charge injection and clock feedthrough of [[Sampling Circuits#Channel Charge Injection]] and [[Sampling Circuits#Clock Feedthrough]], turned into a current error by $g_m$: one more reason for low $g_m/I_D$ in current sources.

## Level 5: Capacitor DACs

### The Capacitive Divider

```tikz title="Thermometric CDAC (left): k of m unit capacitors switch their bottom plates to V_REF, the top plate is reset to V_CM each cycle. At code k (right), the array is two branches in parallel, and the series resistance and capacitance of the two scale the same way, so the pole cancels the zero. After Razavi DC Figs. 11.2, 11.5, 11.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.9cm]
  \draw (0,3.4) -- (4.2,3.4);
  \foreach \x/\s in {0.4/V_{REF},1.4/V_{REF},2.4/0,3.4/0} {
    \draw (\x,3.4) to[C] (\x,1.9) -- (\x,1.5) node[below,font=\scriptsize]{$\s$};
  }
  \node[font=\scriptsize] at (1.9,0.65) {$k$ to $V_{REF}$, $m-k$ to 0};
  \draw (4.2,3.4) node[circ]{} -- (4.8,3.4) node[right]{$V_{out}$};
  \draw (4.2,3.4) to[nos,l=\scriptsize$S_R$] (4.2,1.9) node[below]{$V_{CM}$};
  \begin{scope}[xshift=7.4cm,yshift=0.8cm]
    \draw (0,2.6) node[left]{$V_{REF}$} to[R,l=$\frac{R_{on}}{k}$] (1.8,2.6) to[C,l=$kC_0$] (3.4,2.6) node[circ]{} -- (4.0,2.6) node[right]{$V_{out}$};
    \draw (3.4,2.6) to[C,l=$(m-k)C_0$] (3.4,1.0) to[R,l=$\frac{R_{on}}{m-k}$] (3.4,-0.4) node[ground]{};
    \node[font=\scriptsize,align=left,anchor=west] at (-0.4,-1.4) {$V_{out}(0^+) = \frac km V_{REF}$ (resistive divider)\\ $V_{out}(\infty) = \frac km V_{REF}$ (capacitive divider)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V_{out} = \frac{kC_0}{mC_0+C_L}V_{REF}\approx\frac km\left(1-\frac{C_L}{mC_0}\right)V_{REF}}
$$

- Two capacitors divide a reference step; switching *all* left plates passes the full $V_{REF}$ (no capacitance to ground, no division). $m$ units give an LSB of $V_{REF}/m$. To get exactly $m$ levels, leave one unit permanently grounded (Razavi Fig. 11.3); otherwise $m$ switched units give $m+1$ levels ($\log_2 5 = 2.3$ bits for four).
- **Good:** rail-to-rail output, no output-impedance nonlinearity, far less power than an RDAC or IDAC.
- **Bad:** cannot drive a resistor (it would discharge the top plate), and a load capacitance is a **gain error** $C_L/(mC_0)$.
- A **reset switch** returns the top plate to $V_{CM}$ every cycle (it also fights junction and channel leakage), so the output is return-to-zero: fine inside an ADC. The reset switch's parasitics add gain error and nonlinearity.
- With $V_{REF}\approx0.6$ V, the switches to ground are NMOS and those to $V_{REF}$ PMOS; size them for equal resistance.

### Binary, Thermometric and Differential CDACs

- Same coding argument as IDACs: **thermometric above about 4 bits**.
- A binary CDAC is still built from units, *switches included*: the $2C_0$ bit is two unit branches in parallel, i.e. $R_{on}/2$ with $2C_0$, so every bit has the same time constant $R_{on}C_0$.
- **Differential:** each side needs an extra grounded unit. In reset the "a" switches on one side and the "b" switches on the other are on, and both tops sit at $V_{CM}$. A code step moves one side up by $V_{REF}/4$ and the other down by the same: differential LSB and full scale both double.

### Settling Is Instant; the Reference Pays

$$
\boxed{I_{REF}(0^+) = \frac{k(m-k)}{mR_{on}}V_{REF},\quad I_{REF,max} = \frac{mV_{REF}}{4R_{on}}\ (k=m/2),\quad \tau = R_{on}C_0}
$$

- The two branches have $R\propto1/k$ and $C\propto k$, so their pole and zero cancel and $V_{out}/V_{in} = k/m$ at all frequencies (Razavi Prob. 11.8). **Unique to CDACs**, and it would be infinitely fast with an ideal reference.
- The price is a large midscale reference current. A large $R_{on}$ to tame it does not work: $R_{on}$ varies during the transition (its $V_{GS}$ is not constant), which breaks the cancellation, and a CDAC inside an ADC usually doubles as the sampler and needs a small time constant anyway.

### Random Mismatch

$$
\boxed{\sigma_{INL,max} = \frac{1}{\sqrt{4m}}\frac{\sigma_C}{C_0}V_{REF}\ \Rightarrow\ \frac{\sigma_C}{C_0}<\frac{2}{\sqrt m}\ (\text{INL}<1\text{ LSB}),\quad<\frac{1}{\sqrt m}\ (\tfrac12\text{ LSB})}
$$

The end points are pinned ($0$ with no units switched, $V_{REF}$ with all), so the result is identical to the resistor ladder's.

> [!note]- Derivation: midscale error (Razavi Eqs. 11.12–11.20)
> At midscale $V_{out} = V_{REF}C_a/(C_a+C_b)$, where $C_a$ and $C_b$ are each $m/2$ units: mean $(m/2)C_0$, $\sigma = \sqrt{m/2}\,\sigma_C$. To first order, $V_{out}\approx\frac{V_{REF}}{2}+\frac{\Delta C_a-\Delta C_b}{mC_0}\frac{V_{REF}}2$. Independent halves: $\sigma(\Delta C_a-\Delta C_b) = \sqrt m\,\sigma_C$, so $\sigma_{INL} = \frac{\sigma_C}{\sqrt mC_0}\frac{V_{REF}}{2} = \frac{1}{\sqrt{4m}}\frac{\sigma_C}{C_0}V_{REF}$. Set it below $V_{REF}/m$ (or $V_{REF}/2m$).

> [!warning] Unverified: Razavi's quoted tolerance for an 8-bit CDAC
> Razavi §11.8 quotes "4.4% for $m=256$" and "1.1% for $m=4096$" as the tolerance from Eq. (11.20), but those are $1/\sqrt{2m}$ (the IDAC bound of Eq. 10.9). Eq. (11.20) itself, $2/\sqrt m$, gives 12.5% and 3.1%; the $\tfrac12$-LSB version $1/\sqrt m$ gives 6.3% and 1.6%. The conclusion of §11.8 (noise, not matching, binds at high resolution) holds with any of them.

### Capacitor Parasitics: Top Plate Costs Gain, Bottom Plate Costs Speed

```tikz title="Parallel-plate (M9 over M8) unit capacitor and its parasitics: top-plate fringe C_t (about 1% of C_1) and bottom-plate C_b (about 10%) to the substrate. After Razavi DC Fig. 11.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (-0.5,0) rectangle (6.5,-0.6);
  \node[font=\scriptsize] at (3,-0.3) {substrate};
  \fill[blue!35] (1,2.8) rectangle (5,3.1); \node[font=\scriptsize,anchor=west] at (5.1,2.95) {M9 (top plate, to $V_{out}$)};
  \fill[purple!35] (0.6,1.8) rectangle (5.4,2.1); \node[font=\scriptsize,anchor=west] at (5.5,1.95) {M8 (bottom plate, switched)};
  \draw (3,2.8) to[C,l=$C_1$] (3,2.1);
  \draw (1,2.95) -- (0.2,2.95) to[C,l_=$C_t$] (0.2,0);
  \draw (1.6,1.8) to[C,l=$C_b$] (1.6,0);
  \draw (4.4,1.8) to[C,l_=$C_b$] (4.4,0);
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{top plate: } V_{out} = \frac{kC_0}{mC_0+mC_t}V_{REF}\approx\frac km\left(1-\frac{C_t}{C_0}\right)V_{REF}\quad(\text{gain error}),\qquad \text{bottom plate: no effect on } V_{out}}
$$

- **Top-plate parasitics** sit from the output node to ground: they divide the signal, a gain error. **Bottom-plate parasitics** hang on nodes driven by switches; a capacitive divider transfers only voltage *changes* and the bottom plate still moves by exactly $V_{REF}$, so they only add reference current and slow settling. **Connect the plate with the smaller parasitic (the top) to the output.**
- **MOS capacitors are out:** densest (about 20 fF/µm² in 28 nm), but their capacitance depends on voltage and different units sit at different voltages, so the DAC becomes nonlinear.
- **Metal capacitors** buy linearity with area. M9–M8 parallel plates: linear enough for 16–18 bits, about 50 aF/µm². Example (Razavi Ex. 11.4): an 8-bit differential CDAC with 10 fF units is 512 units of about 1000 µm² each, roughly $500\ \mu\text{m}\times1000\ \mu\text{m}$ before spacing rules.
- **Stacking layers** (M6–M9 interleaved) about triples the density, but the bottom plate moves toward the substrate: $C_b/C_{tot}$ has a minimum of about 5% with the top four or five metals. Via columns widen each plate by $2S_1+2S_2$.
- **Fringe to neighbours:** a top plate's fringe onto the next unit's bottom plate adds to that unit (a mismatch, cancelled only if symmetric); fringe to the substrate is gain error. A **metal cage** (via wall tied to the outer plates) makes every field line from the top plate end on its own bottom plate: top-plate parasitic nearly zero, the outer fringe only adds bottom-plate capacitance.
- **Lateral (finger) capacitors** are denser but nearly symmetric, so their top-plate parasitic is as large as their bottom-plate one; cage them too. The thick top metal needs wider fingers and spacing.

> [!tip] Remark
> The capacitor structures themselves (MOM, MIM, finger, densities, matching) are owned by [[Capacitor]]; this section keeps only what each parasitic does to a DAC. Top-plate vs bottom-plate is the same orientation rule as [[Sampling Circuits#Bottom-Plate Sampling]].

### CDAC Reference Bounce and Its Buffer

$$
\boxed{V_X(0^+) = \frac{4R_{on}/m}{4R_{on}/m+R_{REF}}V_{REF},\qquad \tau = \left(\frac{4R_{on}}{m}+R_{REF}\right)\frac m4C_0,\qquad \text{bypass } C_1\approx\frac{m^2}{2}C_0}
$$

- The reference sees a large midscale current through only $4R_{on}/m$, so even a small $R_{REF}$ makes it droop and recover slowly.
- The RDAC bypass rule ($C_1\approx2m\times$ the load, here $(m/4)C_0$) gives $C_1\approx(m^2/2)C_0$: **larger than the DAC itself**.
- **Differential does not help here.** Unlike the IDAC's supply current, one side switches to $V_{REF}$ while the other switches to ground; nothing cancels (Razavi Ex. 11.6).
- So CDACs use a **reference buffer**, and it is harder than an RDAC's because the array is a much larger capacitance. The usual 5-transistor amplifier with a source-follower output (Razavi Ex. 11.7): $Z_{out}$ starts at $(1/g_{m5})/(1+A_0)$, rises (inductively) above $\omega_z = 1/[(r_{O2}\parallel r_{O4})C_A]$, and flattens at $1/g_{m5}$ above $\omega_p\approx g_{m1,2}/C_A$. It needs $V_{DD}\ge V_{I_{SS}}+V_{GS2}+V_{GS5}+|V_{DS4}|$, perhaps 1.2–1.5 V. **The CDAC consumes almost nothing; its reference buffer does not.**
- Large-signal reality: when the array switches, $V_X$ dips because $M_5$ must supply the charge; a large enough dip turns $M_2$ off and the internal node slews. The buffer's noise also goes straight to the DAC output.

> [!tip] Remark
> This section owns the CDAC reference-bounce model. Inside a SAR ADC the same $\tau$ (with $R_{REF}\frac m4C_0=R_{out}C_{DAC}/4$) must bring the bounce below 0.2 LSB in every one of $N$ cycles; that budget, and the LSB convention for top-plate arrays, is [[SAR ADCs#Reference Bounce]].

### Split (Bridge) CDACs

```tikz title="6-bit split CDAC: two 3-bit binary sections joined by a bridge capacitor C_S = C0. A bottom-plate step in the LSB section reaches the output attenuated by exactly 8. Only 15 unit capacitors. After Razavi DC Fig. 11.25(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.8cm]
  \draw (0,2.4) -- (3.6,2.4);
  \draw (5.4,2.4) -- (9.0,2.4);
  \draw (3.6,2.4) node[circ]{} node[above]{$X$} to[C,l={$C_S=C_0$}] (5.4,2.4) node[circ]{} node[above]{$Y$};
  \foreach \x/\c/\d in {0.4/4C_0/D_3,1.6/2C_0/D_2,2.8/C_0/D_1} { \draw (\x,2.4) to[C,l_=\scriptsize$\c$] (\x,1.0) node[below,font=\scriptsize]{$\d$}; }
  \foreach \x/\c/\d in {6.0/4C_0/D_6,7.2/2C_0/D_5,8.4/C_0/D_4} { \draw (\x,2.4) to[C,l_=\scriptsize$\c$] (\x,1.0) node[below,font=\scriptsize]{$\d$}; }
  \draw (9.0,2.4) -- (9.6,2.4) node[right]{$V_{out}$};
  \node[font=\scriptsize] at (1.6,3.2) {LSB section};
  \node[font=\scriptsize] at (7.2,3.2) {MSB section};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{V_{out2}}{V_{out1}} = \frac{\alpha}{\alpha+1}\frac1\beta\ \ (\alpha=\beta=7\Rightarrow\tfrac18),\qquad V_{out} = \sum_k D_k\frac{2^{k-1}}{63}V_{REF}\ (6\text{ bits})}
$$

- A bridge capacitor attenuates one section by a binary factor, so unit count stops growing as $2^N$: 6 bits from 15 units. The LSB is $V_{REF}/63$, not $V_{REF}/64$, and full scale is exactly $V_{REF}$.
- 8 bits (Razavi Ex. 11.8): make the MSB section thermometric (15 units), keep a binary LSB section ($8,4,2,1$), plus the bridge: 31 units.
- **Weakness: top-plate parasitics at the bridge.** $C_Y$ (MSB side) is only a gain error, but $C_X$ (LSB side) changes the weight ratio to $8+C_X/C_0$ and produces a DNL step at **every 8th code**:

$$
\boxed{\mathrm{DNL} = \frac{56\,C_X}{63^2C_0}V_{REF}\ \text{every 8 codes}\quad(C_X/C_0\lesssim0.2\text{ for }<0.2\text{ LSB at 6 bits})}
$$

- These steps accumulate into gain error and INL. Use low-parasitic (caged) units, and tie $C_S$'s large bottom plate to $Y$, the less sensitive node. A periodic DNL every $2^{N_{LSB}}$ codes in a measurement is the signature of a bridge.

> [!note]- Derivation: bridge weighting and the $C_X$ error (Razavi Eqs. 11.28–11.51)
> Thevenin of a 3-bit section (top plate open): $V_{Thev} = (4D_3+2D_2+D_1)V_{REF}/7$ behind $7C_0$. Two sections $\alpha C_0$ and $\beta C_0$ joined by $C_0$: a step on the far section reaches the output through the series combination $\frac{\alpha}{\alpha+1}C_0$; the ratio of the two sections' effects is $\frac{\alpha}{\alpha+1}\frac1\beta = \frac18$ for $\alpha=\beta=7$. With the numbers, a near-section unit step gives $8V_{REF}/63$ and a far-section one $V_{REF}/63$.
>
> Add $C_X$ at $X$ and $C_Y$ at $Y$ and redo the two cases; the weight ratio becomes $(8C_0+C_X)/C_0$, and with $C_Y$ neglected $V_{out} = \frac{8C_0+C_X}{63C_0+8C_X}(4D_6+2D_5+D_4)V_{REF}+\frac{C_0}{63C_0+8C_X}(4D_3+2D_2+D_1)V_{REF}$. At $000111\to001000$ the step is $\frac{C_0+C_X}{63C_0+8C_X}V_{REF}$ instead of $\frac{C_0}{63C_0+8C_X}V_{REF}$; subtracting 1 LSB gives $\frac{56C_X}{63^2C_0}V_{REF}$ to first order.

### Choosing $C_0$: kT/C Against Matching

$$
\boxed{\frac{kT}{mC_0}\le(0.2\,\text{LSB})^2\ \Rightarrow\ C_0\approx\frac{25mkT}{V_{REF}^2}}
$$

| $m$ | $C_0$ for noise ($V_{REF}=0.5$ V) | Matching needed ($\tfrac12$ LSB INL) |
|---|---|---|
| 256 | 0.106 fF | $\sigma_C/C_0<6.3\%$ |
| 4096 | 1.7 fF | $\sigma_C/C_0<1.6\%$ |

- The reset switch leaves $kT/(mC_0)$ on the whole array. During evaluation, the switches' thermal noise appears in parallel as $4kTR_{on}/m$, and with an output parasitic $C_p$ it integrates to $kT/C_p$ (for $mC_0\gg C_p$).
- **The noise bound grows as $m$; the matching bound loosens only as $1/\sqrt m$.** At high resolution noise sets $C_0$, especially since mismatch can be calibrated and noise cannot.
- A 0.1 fF unit is tiny: two $0.8\ \mu\text{m}\times0.8\ \mu\text{m}$ plates in M9 over M1 (about 10 aF/µm² plate plus 30 aF/µm fringe) make it, matched to a few percent. Its bottom-plate parasitic exceeds $C_0$, and neighbours couple strongly.

> [!tip] Remark
> This is the kT/C result of [[Noise#kT/C Noise]]; the SAR ADC note uses the same trade to size its array ([[SAR ADCs]]).

### Matrix CDACs and Routing

- The matrix idea carries over, but five things must reach every cell: row code, column code, $V_{REF}$, ground and $V_{DD}$. Two errors: **static** (cells see different surroundings: mismatch) and **dynamic** (transitions couple into the capacitors).
- A digital line coupling $C_f$ to a **top** plate injects $\Delta V_{out}\approx C_fV_{DD}/(mC_0)$: small $C_f$, but a full logic swing. Coupling to a **bottom** plate only makes a glitch that decays through the switch with $R_{on1}C_f$, harmless if the output is sampled a little later (inside an ADC). **Route digital lines over the bottom plates.**
- Razavi's unit cell (9 metals): capacitor in five shielded layers on top, row code in M4, column code, $V_{REF}$, $V_{DD}$, ground in M3, switches and logic in M1–M2 underneath. Every cell is identical, codes couple only to bottom plates, and a dummy ring surrounds the array (Fig. 11.34).

### Charge-Redistribution and Hybrid DACs

- **Charge-redistribution SC DAC** (Carusone §16.2.4): the input capacitor of an SC gain stage replaced by a binary (or thermometric, Fig. 16.16) array. Like the SC amplifier, it is insensitive to op-amp offset, $1/f$ noise and finite gain, and a sign bit is free by swapping the input clock phases. It needs careful clocking against signal-dependent feedthrough, a deglitching capacitor, and codes that change only while the inputs are grounded.
- **Resistor–capacitor hybrid** (Yang and Martin 1989, Carusone §16.4.1): a 7-bit ladder picks the pair of voltages across one resistor; an 8-bit capacitor array interpolates between them. Monotonic as long as the capacitor array is accurate to 8 bits; 15-bit monotonic untrimmed, 100 kHz, 10 mW.

> [!tip] Remark
> The output stage is an SC amplifier: its gain error and settling are [[Switched-Capacitor Circuits#Unity-Gain Sampler: Gain Error and Settling]] and [[Switched-Capacitor Circuits#Noninverting Amplifier]].

## Level 6: DACs in SerDes Transmitters

```tikz title="Voltage-mode (resistor-divider) driver DAC: n equal legs, k pulled up to V_S and n-k pulled down. Its Thevenin resistance R_u/n does not depend on k, so the termination stays matched at every level. After Wong et al. JSSC 2004 Fig. 7(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,/tikz/circuitikz/bipoles/length=0.9cm]
  \draw (0,3) -- (4.2,3);
  \foreach \x/\t in {0.4/V_S,1.6/V_S,2.8/0} { \draw (\x,3) to[R,l_=\scriptsize$R_u$] (\x,1.5) -- (\x,1.1) node[below,font=\scriptsize]{$\t$}; }
  \node[font=\scriptsize] at (1.6,0.35) {$k$ legs to $V_S$, $n-k$ to 0};
  \draw (4.2,3) node[circ]{} -- (4.8,3) node[right]{$V_{out}$};
  \draw (4.2,3) to[R,l=$R_T$] (4.2,1.2) node[ground]{};
  \node at (6.6,2.2) {$\Longrightarrow$};
  \begin{scope}[xshift=8cm]
    \draw (0,1.0) to[V,l=$\frac kn V_S$] (0,3) to[R,l=$\frac{R_u}{n}$] (2.2,3) node[circ]{} -- (2.8,3) node[right]{$V_{out}$};
    \draw (2.2,3) to[R,l=$R_T$] (2.2,1.0) -- (0,1.0);
    \draw (1.1,1.0) node[ground]{};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = \frac kn V_S\frac{R_T}{R_T+R_u/n},\qquad R_{out} = \frac{R_u}{n}\ \text{for every } k}
$$

- A segmented voltage-mode driver is a **resistor-divider DAC** whose output resistance is the termination. Because all legs are always connected (each pulls up or down), the parallel conductance, and so the source match, is the same at every level. That is how Wong 2004 gets 2-tap pre-emphasis with matched 50 Ω: 4 binary-weighted segments make **16 levels**, output impedance within 10%.
- **DNL** follows the binary rules above: the worst step is the segment carry, and leg mismatch acts exactly like capacitor mismatch in a CDAC (both are dividers of matched admittances; replace $C$ by $G$). Wong measured a peak DNL of **0.8 LSB** and concluded more binary segments would not improve the pre-emphasis accuracy (Fig. 26).
- **New nonlinearity: the legs are transistors.** Each leg's $R_{on}$ depends on its $V_{DS}$, and a device that leaves triode (velocity saturation, the FF corner with less gate overdrive) bends the levels (Wong Fig. 9). Keep the switch deep in triode, or add series poly resistance so the transistor is a small part of $R_u$.
- **Current-mode (CML) drivers** with FFE taps are current-steering DACs: their tap weights are IDACs, and the output-impedance, segmentation and glitch results of [[#Level 3 Current-Steering DACs]] apply directly.

> [!tip] Remark
> Driver topologies, impedance control loops and equalization live in [[Transmitters]] and [[Equalization]]; this section only owns the DAC view. Linearity of the levels (RLM for PAM4) is in [[Signaling and BER]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Thermometric instead of binary (more MSBs in the unary segment) | DNL ($\sigma_I/I_0<0.5$ vs $1/m$), monotonicity, glitches | Decoder area and power; routing |
| Segmented (unary MSBs, binary/R-2R LSBs) | Unit count (130 vs 1023 at 10 bits) | DNL at segment carries (set by a few units) |
| ↑ unit gate area $WL$ | Random INL/DNL ($\sigma\propto1/\sqrt{WL}$) | Tail capacitance $C_P$ → HD2/HD3 at high $f$, memory effect; area |
| ↑ source overdrive (↓ $g_m/I_D$) | Current matching; less sensitivity to ground IR and bias bounce ($\propto g_m$) | Headroom, output swing |
| ↑ source $L$, or cascode | $r_O$ → static INL, HD2 (SE), HD3 (diff) | Headroom (cascode), area, a larger $C_P$ if done with length alone |
| Switch pair as cascode (keep it saturated) | $R_{out}\times g_{m3}r_{O3}$, isolates $C_P$ | Limited swing or a reduced-swing data path |
| Differential output | HD2 cancels; HD3 $=(mR_L/4r_O)^2$; constant supply current; 2× swing | Two loads; does *not* cancel CDAC reference current |
| Retiming register, latch per cell | Glitch impulse, race glitches | Clock distribution; sinc droop, images ($3f_{in}-f_{CK}$ spurs) |
| Switching-sequence reordering | Gradient INL (2.3× in one row) | Nothing (decoder only); DNL unchanged |
| Bias-line bypass $C_b$ | Reference bounce | $\propto m^2C_{GD}$: tens of pF |
| RDAC: ↓ $R_u$ | Settling ($m^2R_uC_{sw}$), load INL | Power $V_{REF}^2/(mR_u)$ |
| RDAC: switch width | $R_{sw}$ | $C_{sw}$: $R_{sw}C_{sw}$ is fixed; optimum near $R_{sw}\approx mR_u/4$ |
| CDAC: ↑ $C_0$ | kT/C, matching | Reference current and buffer power, area |
| CDAC: split array | Unit count, area | Periodic DNL from bridge parasitic $C_X$ |
| Caged / top-plate-to-output capacitors | Gain error | Area (via walls) |
| Reference decoupling cap | Reference bounce | $2m\times$ load (RDAC), $m^2C_0/2$ (CDAC) |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Output, full scale | $A_{out} = \alpha D_{in}$, $A_{FS} = (2^N-1)\Delta A_{LSB}$, $m = 2^N$ |
| Settling to ½ LSB | $t_s = \tau\ln(2m)$; 3 bits: $R_LC_L\ln14$ |
| Retiming spur | $3f_{in}-f_{CK}$, $2f_{CK}-3f_{in}$ |
| Binary vs thermometric | DNL: $\sigma_I/I_0<1/m$ vs $<0.5$; INL (both): $\sigma_I/I_0<1/\sqrt{2m}$ |
| Current mismatch | $\sigma_I^2/I_0^2 = [A_\beta^2+4A_{VT}^2/(V_{GS}-V_{TH})^2]/(WL)$ |
| Segmented 7+3 | DNL $\sigma_I/I_0<1/(2\sqrt{85})$; INL $<1/128$ |
| RDAC load INL | $\lvert\mathrm{INL}\rvert_{max} = \frac4{27}\frac{mR_u}{R_L}V_{REF}$ at $j=2m/3$ |
| RDAC settling | $\tau = (R_{Th}+R_{sw})mC_{sw}$; $R_{Th,max} = mR_u/4$; tree $\tau\approx(3N-1)NR_{sw}C_{sw}$ |
| RDAC gradient | $\lvert\mathrm{INL}\rvert_{max} = \frac m8\frac{\Delta R}{R_0}V_{REF}$; $\mathrm{DNL}_j = (j-\frac{m-1}2)\frac{\Delta R}{R_0}\frac{V_{REF}}m$ |
| Ladder/CDAC random INL | $\sigma_{INL} = \frac{1}{\sqrt{4m}}\frac{\sigma}{X}V_{REF}$; ½ LSB: $\sigma/X<1/\sqrt m$ |
| Reference bypass | $C_1\gtrsim2mC_L$; buffer $Z_{out} = R_0\frac{s+\omega_0}{s+(A_0+1)\omega_0}$ |
| Follower buffer | $A_0\ge2^{N+1}$, $\omega_u\ge(N+1)\ln2/t_s$ |
| IDAC $r_O$ INL | SE: $r_O>m^2R_L/2$; diff: $r_O>\sqrt{\sqrt3/18}\,m^{3/2}R_L$ |
| IDAC $r_O$ harmonics | SE: $HD_2 = mR_L/(4r_O)$; diff: $HD_3 = (mR_L/4r_O)^2$ |
| Cascoded unit | $R_{out3} = (1+g_{m3}r_{O3})[(1+g_{m2}r_{O2})r_{O1}+r_{O2}]+r_{O3}$ |
| Compliance | $V_{DS1}+V_{DS2}+V_{DS3}<V_{out}<V_{DD}$ |
| Gradient, 8-unit row | INL $8\Delta I$, DNL $7\Delta I$; reordered INL $3.5\Delta I$ |
| Ground IR | $V_A = \frac{n(n-1)}2I_0r_u$ |
| IDAC output pole | $\tau = m(C_{GD}+C_{DB})R_L$ |
| Bias-line bounce | $\Delta I_{out} = \frac{2m\Delta V_X}{V_{OV3}}\frac{C_{GD3}}{C_{GD3}+C_{GS3}}I_{SS}$; $C_b>4m^2C_{GD3}\Delta V_X/V_{OV3}$ |
| HF output impedance | $C_u\approx C_P/(g_{m1}r_{O1})$; SE $HD_2 = mR_LC_u\omega/4$; diff $HD_3\approx\frac12(mR_LC_u\omega/4)^2$ |
| Memory effect | $HD_3 = m\pi R_LC_Pf/[4(1+g_mr_O)]$ |
| CDAC transfer | $\Delta V_{out} = \frac{kC_0}{mC_0+C_L+mC_t}V_{REF}$ |
| CDAC reference current | $I_{REF,max} = mV_{REF}/(4R_{on})$, $\tau = R_{on}C_0$ |
| CDAC reference resistance | $\tau = (R_{on}+mR_{REF}/4)C_0$; bypass $C_1\approx m^2C_0/2$ |
| Split CDAC | ratio $\frac{\alpha}{\alpha+1}\frac1\beta$; DNL $\frac{56C_X}{63^2C_0}V_{REF}$ every 8 codes |
| CDAC noise | $C_0\approx25mkT/V_{REF}^2$ |
| Voltage-mode driver DAC | $V_{out} = \frac knV_S\frac{R_T}{R_T+R_u/n}$, $R_{out} = R_u/n$ |

## References

- **Razavi, *Analysis and Design of Data Converters*, 2025** (PDF page = printed + 19)
  - Ch. 8 General DAC Concepts, pp. 142–155: transfer characteristic, offset, gain error, DNL/INL as applied to element errors (Exs. 8.1–8.5), nonmonotonicity, settling (Ex. 8.6), glitch impulse area, THD/SNDR/SFDR, codes and decoders (Exs. 8.7–8.8), retiming register, $3f_{in}-f_{CK}$ spur, spur identification (Ex. 8.9).
  - Ch. 9 Resistor-Ladder DACs, pp. 158–171: 1-of-n and binary-tree RDACs, load INL (Ex. 9.1), settling regimes and design procedure (Ex. 9.2), differential and folded ladders (Ex. 9.3), gradients (Exs. 9.4–9.5), random mismatch (Exs. 9.6–9.7), reference bounce, decoupling (Ex. 9.8), buffer output impedance.
  - Ch. 10 Current-Steering DACs, pp. 174–208: basic and differential cells (Exs. 10.1–10.2), deterministic and random mismatch, binary vs thermometric (Exs. 10.3–10.5, Table 10.1), R-2R, segmented 10-bit example, output-impedance INL and harmonics (Exs. 10.6–10.8), cascodes and compliance, transistor sizing (§10.7), matrix architecture, gradients and switching sequence (Ex. 10.9), race conditions and latches, ground IR drop (Exs. 10.10–10.11), output pole and reference bounce, high-frequency output impedance (Exs. 10.12–10.13), memory effect.
  - Ch. 11 Capacitor DACs, pp. 210–234: capacitive divider and reset (Ex. 11.1), binary/thermometric/differential CDACs (Ex. 11.2), instant settling and reference current (Ex. 11.3), random mismatch, capacitor structures and parasitics (Exs. 11.4–11.5), reference bounce and buffer (Exs. 11.6–11.7), split CDACs (Exs. 11.8–11.9), unit capacitance from kT/C and matching (Ex. 11.10), matrix CDACs and routing (Ex. 11.11).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - Ch. 16 Nyquist-Rate D/A Converters, pp. 623–642: resistor-string with tree and digital decoding, zero-value time constants (Ex. 16.1), folded and multiple R-strings (Ex. 16.2), signed outputs; binary-weighted, reduced-ratio and R-2R resistor DACs; charge-redistribution DACs; current-mode DACs; glitches; thermometer-code DACs (resistor, charge-redistribution, current-mode matrix, single-supply positive-output); dynamically matched current sources; R–C hybrid and segmented converters.
- **Wong et al., "A 27-mW 3.6-Gb/s I/O Transceiver," IEEE JSSC, vol. 39, no. 4, Apr. 2004** (`ref/SerDes/voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`): Fig. 7(a) segmented voltage-mode driver as a 16-level DAC, Fig. 9 simulated DNL across corners, Fig. 10 output impedance, Fig. 26 measured DNL (0.8 LSB).
- **Zettelkasten** (`AnalogTheory/S20 DACs.md` and `DACs/`): used as a reading-order check; every atomic note there is sourced from Razavi DC Chs. 8–11, so no content beyond those chapters came from it.
