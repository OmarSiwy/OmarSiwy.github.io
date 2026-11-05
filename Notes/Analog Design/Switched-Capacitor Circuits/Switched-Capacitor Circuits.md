---
title: Switched-Capacitor Circuits
description: Clocked capacitors and switches around an op amp replace resistors, so gain, integration and filtering come from capacitor ratios and a clock; then come the switch, the settling, and the offset.
kind: topic
status: growing
aliases:
  - Switched-Capacitor Circuits
  - SC circuits
---

A switched-capacitor (SC) circuit moves **charge packets** between capacitors, clocked by two non-overlapping phases, instead of letting current flow through resistors. Results go from the black box (charge in, charge out) to the z-domain math, then the integrators and filters built from it, then the real switch, and last the precision and speed limits of the op amp that moves the charge. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="The SC amplifier on one screen. On phi1 C1 samples V_in while S2 resets the op amp; on phi2 the left plate of C1 goes to ground and its charge moves onto C2, so V_out = (C1/C2) V_in0. After Razavi Figs. 13.5 and 13.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (5,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.4,0) node[ground]{};
  \draw (OA.-) -- ++(-0.7,0) coordinate(X) node[circ]{};
  \node[below left] at (X) {$X$};
  \draw (X) to[C,l_=$C_1$] ++(-2,0) coordinate(A) node[circ]{};
  \node[above left] at (A) {$A$};
  \draw (A) to[nos,l=$S_1\ (\phi_1)$] ++(-2.4,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (A) to[nos,l=$S_3\ (\phi_2)$] ++(0,-1.8) node[ground]{};
  \draw (X) -- ++(0,1.3) coordinate(F1) to[C,l=$C_2$] (F1 -| OA.out) -- (OA.out);
  \draw (X) -- ++(0,2.5) coordinate(F2) to[nos,l=$S_2\ (\phi_1)$] (F2 -| OA.out) -- (F1 -| OA.out);
  \draw (OA.out) -- ++(0.6,0) node[ocirc]{} node[right]{$V_{out}$};
  \begin{scope}[xshift=9.4cm,yshift=-1.4cm]
    \draw[->] (0,0) -- (4.4,0) node[right]{$t$};
    \draw (0,3.4) -- (0,3.9) -- (1.9,3.9) -- (1.9,3.4) -- (4.2,3.4);
    \node[left] at (0,3.65) {$\phi_1$};
    \draw (0,2.5) -- (2.1,2.5) -- (2.1,3.0) -- (4.0,3.0) -- (4.0,2.5) -- (4.2,2.5);
    \node[left] at (0,2.75) {$\phi_2$};
    \draw[thick] (0,0.2) -- (2.1,0.2);
    \draw[thick,domain=0:2.0,samples=40] plot ({2.1+\x},{0.2+1.5*(1-exp(-3.5*\x))});
    \node[left] at (0,0.2) {$V_{out}$};
    \draw[dashed] (1.9,0) -- (1.9,3.9);
    \node[below] at (1.9,0) {$t_0$};
    \node[font=\scriptsize] at (0.95,1.2) {sample};
    \node[font=\scriptsize] at (3.1,2.1) {amplify};
    \node[font=\scriptsize,anchor=west] at (4.15,1.7) {$\frac{C_1}{C_2}V_{in0}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Charge transfer:** gains and filter coefficients are **capacitor ratios** (matched to about 0.1%) times a clock, not $RC$ products (about 20% spread).
> 2. **A switched capacitor is a resistor** at low frequency: $R_{eq} = 1/(C f_s)$.
> 3. **SC circuits are discrete-time:** analyse them with $z$. The integrator is $\frac{C_1}{C_2}\frac{1}{z-1}$, a pole at $z=1$ (dc).
> 4. **Parasitic insensitivity:** four switches per capacitor plus one rule, *turn off the switch at the virtual ground first*, leaves only a constant offset from charge injection.
> 5. **Op-amp limits:** gain error $\approx 1/(\beta A)$ and settling $\tau \approx C_{L,\text{eff}}/(\beta G_m)$, with $\beta$ set by the capacitors. Higher gain means lower $\beta$, so the stage is slower and less accurate.
> 6. **Noise floor:** every sampled capacitor stores $kT/C$; a switched branch refers $2kT/C$ to its input. $C$ is sized by noise first, speed second.

**Map:** [[#Spec translation|specs → op amp]] → [[#Level 0 Charge Instead of Current|charge, $R_{eq}$, clocks]] → [[#Level 1 Discrete-Time Signals|spectra, $z$, bilinear, sinc]] → [[#Level 2 Integrators and Signal-Flow Graphs|integrators, SFGs]] → [[#Level 3 Filters|first-order, biquads, fully differential]] → [[#Level 4 The Switch as a Real Device|$R_{on}$, charge injection, $kT/C$]] → [[#Level 5 SC Amplifiers, Precision and Speed|clock ordering, gain error, settling, $\times 2$]] → [[#Level 6 Offset Cancellation, CMFB and Other SC Circuits|CDS, CMFB, oscillators]].

## Spec translation

The SC block is specified at its terminals; the op amp inside it is what you size with $g_m/I_D$. This section carries the numbers from one to the other. The formulas behind it are derived in [[#Level 5 SC Amplifiers, Precision and Speed]] and [[#kT/C Noise]].

**Block specs** (Razavi §13.3, Carusone §14.1, §14.3): closed-loop **gain accuracy** $\varepsilon_{gain}$ (or filter-coefficient accuracy); **settling** to accuracy $\varepsilon$ within the available time $t_s$ (less than half a clock period, minus the non-overlap gap); sampled **noise** ($kT/C$); **charge-injection** error (offset, gain error, distortion); **output swing**; **offset and 1/f noise**.

| SC block spec | Inside the block | Op-amp spec it sets |
|---|---|---|
| Gain accuracy $\varepsilon_{gain}$ | static error $1/(\beta A_0)$ | DC gain $A_0$ |
| Settling to $\varepsilon$ in $t_s$ | linear $\tau = 1/(\beta\omega_u)$, plus a slewing segment | GBW / $\omega_u$ with the real load, phase margin, slew rate |
| Feedback factor $\beta$ | $C_F/(C_F+C_S+C_{in})$ | Op-amp input capacitance $C_{in}$ (limits input-pair $W$) |
| $kT/C$ noise, SNR | sampling capacitor size | Load $C_{L,eff}$ (hence $\omega_u$, power); op-amp input-referred noise should sit below $kT/C$ |
| Charge-injection error | switch $W L$, clock ordering, differential | Nothing directly: a constant offset, cancelled by differential operation or CDS |
| Output swing | signal range at the op-amp output | Output swing (headroom of the output devices), CMFB range |
| Offset, 1/f noise | CDS or offset-storing reset | Offset spec relaxed; design for thermal noise instead |

$$
\boxed{A_0 \ge \frac{1}{\beta\,\varepsilon_{gain}}}\qquad
\boxed{\omega_u \ge \frac{\ln(1/\varepsilon)}{\beta\,t_{lin}}}\qquad
\boxed{t_{slew}+t_{lin}\le t_s}\qquad
\boxed{\text{PM}\gtrsim70^\circ,\ \ f_u\ge5f_s}
$$

For a binary accuracy $\varepsilon = 2^{-(N+1)}$ (half an LSB at $N$ bits) these read $A_0 \ge 2^{N+1}/\beta$ and $\omega_u \ge (N+1)\ln2/(\beta t_{lin})$.

> [!note]- Derivation: from block specs to op-amp specs
> **Gain.** With loop gain $\beta A_0$, the closed-loop gain is $\frac{1}{\beta}\frac{1}{1+1/(\beta A_0)}\approx\frac1\beta\left(1-\frac{1}{\beta A_0}\right)$ (Razavi Eqs. 13.41 and 13.53 are this with $\beta$ written out). Error $\le\varepsilon_{gain}$ gives $A_0\ge1/(\beta\varepsilon_{gain})$.
>
> **Linear settling.** A single-pole closed loop has $\tau = 1/(\beta\omega_u)$; for an OTA, $\omega_u = G_m/C_{L,eff}$ and this is Razavi's $\tau_{amp} = C_{L,eff}/(\beta G_m)$ with $C_{L,eff} = C_L + C_F(C_S+C_{in})/(C_F+C_S+C_{in})$. The error after $t$ is $e^{-t/\tau}$; $e^{-t_{lin}/\tau}\le\varepsilon$ gives $t_{lin}\ge\tau\ln(1/\varepsilon)$.
>
> **Slewing.** At the start of the amplify phase the summing node jumps by about the sampled step, so the input pair switches fully and the output ramps at $I_{tail}/C_{L,eff}$ (Razavi Fig. 13.41) until the error is small enough for linear settling. That time comes out of the same $t_s$.
>
> **Phase margin.** A second-order loop rings and takes longer to settle; Carusone's rule of thumb (PM $>70^\circ$, $f_s\le f_u/5$, little slewing) assumes a near-first-order response.
>
> **Noise.** One SC branch refers $2kT/C$ to its input (Carusone Eq. 14.35). For a signal of rms value $V_{sig}$ and target SNR, $C\ge2kT\cdot\text{SNR}/V_{sig}^2$ for that branch. That $C$ is part of $C_{L,eff}$, so the noise spec sets the load that the settling spec must drive: noise and speed together set the power.

> [!example] Numbers from the sources
> - **Gain** (Razavi Ex. 13.4): unity-gain sampler, $C_{in} = 0.5$ pF, $C_H = 2$ pF, so $\beta = 2/2.5 = 0.8$. 0.1% gain error needs $A_0\ge\frac{1}{0.8\times10^{-3}} = 1250$ (62 dB).
> - **Settling to the same 0.1%:** $\ln(1000)\approx6.9$ time constants, so $\beta\omega_u\ge6.9/t_{lin}$.
> - **Clock rate** (Carusone §14.1.1): with PM $>70^\circ$ and little slewing, $f_u\ge5f_s$.
> - **Gain-2 stage:** the flip-around $\times2$ has $\beta\approx\frac12$ against $\frac13$ for a noninverting stage of the same gain, so it needs $\frac23$ of the $A_0$ and $\omega_u$ ([[#Multiply-by-Two]]).
>
> The sources stop at the op-amp spec. Carrying on to sizing: $A_0$ picks $L$ and the topology; $\omega_u C_{L,eff}$ gives $g_m$; the chosen $g_m/I_D$ gives $I_D = g_m/(g_m/I_D)$ and the width from $I_D/W$.

| Op-amp spec | Lands on | Sizing knob |
|---|---|---|
| $A_0\ge1/(\beta\varepsilon)$ | $g_mr_o$ per stage | $L$ (intrinsic gain), cascoding or gain boosting, number of stages |
| $\omega_u\ge\ln(1/\varepsilon)/(\beta t_{lin})$ | $g_m = \omega_uC_{L,eff}$ of the input pair | $I_D = g_m/(g_m/I_D)$ |
| $\beta$ (keep $C_{in}$ small) | input-pair $C_{gs}$ | $f_T$ of the input pair: lower $g_m/I_D$ and short $L$ shrink $C_{in}$ for a given $g_m$ |
| Phase margin | non-dominant poles (cascode, mirror nodes) | $f_T$ of those devices: short $L$, moderate $g_m/I_D$ |
| Slew rate | $I_{tail}/C_{L,eff}$ | $I_D$ directly (sometimes more than $\omega_u$ asks for) |
| Thermal noise below $kT/C$ | input-pair $g_m$ | high $g_m/I_D$ for noise per amp |
| Output swing | $V_{D,sat}\approx2/(g_m/I_D)$ of the output devices | high $g_m/I_D$ at the output stack |

> [!tip] Remark
> The spec definitions (DC gain, GBW, phase margin, slew rate, swing) are those of [[Single-Stage#Amplifier Specifications]], and turning $g_m$, $f_T$ and $g_mr_o$ targets into $W$, $L$, $I_D$ is the method in [[gm-ID Design Methodology]]. The $\beta$ trade in the table is the same one as in [[Feedback#First-order loop]].

## Level 0: Charge Instead of Current

### Why Not Resistors

$$
\boxed{\frac{V_{out}}{V_{in}} = -\frac{R_2}{R_1}\cdot\frac{A_v - R_{out}/R_2}{1+\dfrac{R_{out}}{R_1}+A_v+\dfrac{R_2}{R_1}}}
$$

A CMOS op amp gets its gain from a high output resistance (hundreds of kΩ). A feedback resistor $R_2$ loads that node all the time, so the closed-loop gain loses accuracy in both numerator and denominator. $R_1$ also loads the previous stage and adds thermal noise.

Swapping the resistors for capacitors ($-C_1/C_2$) removes the loading, but now the op-amp input node has **no dc path**: its bias is whatever charge happened to be there.

> [!note]- Detail: why a big bias resistor $R_F$ across $C_2$ doesn't fix it (Razavi Eqs. 13.5–13.6)
> $$\frac{V_{out}}{V_{in}}(s) = -\frac{R_FC_1s}{R_FC_2s+1}$$
> A **high-pass**: it equals $-C_1/C_2$ only for $\omega \gg 1/(R_FC_2)$. A step input gives the right jump and then a tail as $C_2$ discharges through $R_F$. Pushing $R_FC_2$ high enough for low-frequency signals needs impractically large parts.

### Charge Transfer Sets the Gain

Replace $R_F$ with a **switch** (the circuit in the big picture):

1. **Sample** ($\phi_1$): $S_2$ shorts the op amp into unity gain, so $X \approx 0$. $C_1$ charges to $V_{in}$.
2. **Amplify** ($\phi_2$): $S_1, S_2$ open, $S_3$ grounds node $A$. Feedback drives the voltage on $C_1$ to zero, so its charge $C_1V_{in0}$ must move onto $C_2$.

$$
\boxed{V_{out} = \frac{C_1}{C_2}V_{in0}}
$$

- After $V_{out}$ settles, **no current flows in $C_2$**: the feedback network stops loading the op amp. A resistor loads it forever.
- The output is valid only part of the time, and between samples the circuit ignores $V_{in}$.
- $S_2$ must close periodically anyway: leakage (from $S_2$ and the op-amp gate) slowly discharges $X$.
- CMOS dominates sampled-data circuits because it has a near-ideal switch and an input that draws no dc current. A BJT op amp's base current would bleed the stored charge.

> [!tip] Remark
> This "close a switch around the op amp, then open it" step is the unity-gain [[Feedback#Closed-loop gain and loop gain|feedback]] configuration used as a reset. Everything later in this note is that loop, re-formed every half clock period.

### A Switched Capacitor Is a Resistor

```tikz title="A resistor moves (V_A - V_B)/R coulombs per second; a capacitor toggled between A and B at f_s moves C_S (V_A - V_B) per period. After Razavi Fig. 13.56 and Carusone Fig. 14.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[above]{$V_A$} to[R,l=$R$] (3,0) node[ocirc]{} node[above]{$V_B$};
  \draw[->] (1.0,-0.45) -- (2.0,-0.45) node[midway,below]{$I$};
  \node at (4.2,0) {$\Longleftrightarrow$};
  \draw (5.2,0) node[ocirc]{} node[above]{$V_A$} to[nos,l=$\phi_1$] (7.2,0) coordinate(M) to[nos,l=$\phi_2$] (9.2,0) node[ocirc]{} node[above]{$V_B$};
  \draw (M) node[circ]{} to[C,l=$C_S$] (7.2,-1.6) node[ground]{};
  \node[font=\scriptsize,align=center] at (7.2,-2.4) {$\Delta Q = C_S(V_A-V_B)$ per period};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_{avg} = C_Sf_s(V_A-V_B)\quad\Rightarrow\quad R_{eq} = \frac{1}{C_Sf_s} = \frac{T}{C_S}}
$$

- Faster clock or bigger $C_S$: more charge per second, smaller resistance.
- 5 pF at 100 kHz is 2 MΩ (Carusone Ex. 14.1): a huge on-chip resistance from two transistors and a small capacitor.
- **Only valid when the signal barely changes between clock edges** ($f \ll f_s$). Near $f_s$ you need the $z$-domain analysis of the next two sections.

> [!tip] Remark
> Every "replace $R$ by an SC branch" step in [[#Level 3 Filters]] rests on this equivalence. The integrator gain $1/(RC)$ becomes $C_1/(C_2T)$: a capacitor ratio times a crystal-accurate clock.

### The Four Building Blocks

```tikz title="Non-overlapping two-phase clock. Samples are indexed at the end of phi1 (n-1, n, ...) and phi2 ends half a sample earlier. The gap guarantees no charge path is shared. After Carusone Fig. 14.3(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \s in {0,4} {
    \draw[thick] ({\s+0},1.6) -- ({\s+0},2.4) -- ({\s+1.7},2.4) -- ({\s+1.7},1.6) -- ({\s+4},1.6);
    \draw[thick] ({\s+0},0) -- ({\s+2},0) -- ({\s+2},0.8) -- ({\s+3.7},0.8) -- ({\s+3.7},0) -- ({\s+4},0);
  }
  \node[left] at (0,2.0) {$\phi_1$};
  \node[left] at (0,0.4) {$\phi_2$};
  \draw[dashed] (1.7,-0.4) -- (1.7,2.7);
  \draw[dashed] (5.7,-0.4) -- (5.7,2.7);
  \draw[dashed] (3.7,-0.4) -- (3.7,2.7);
  \node[below] at (1.7,-0.4) {$n-1$};
  \node[below] at (3.7,-0.4) {$n-\tfrac12$};
  \node[below] at (5.7,-0.4) {$n$};
  \draw[<->] (1.7,1.2) -- (2.0,1.2);
  \node[font=\scriptsize,anchor=west] at (2.05,1.2) {non-overlap};
  \draw[<->] (1.7,2.8) -- (5.7,2.8) node[midway,above]{$T = 1/f_s$};
\end{circuitikz}
\end{document}
```

| Block | What matters in SC use |
|---|---|
| **Op amp** | DC gain (typically 40–80 dB) sets coefficient error; $f_u$ and phase margin set settling; slew rate limits the charge-transfer step; offset and 1/f noise appear at the output unless cancelled ([[#Correlated Double Sampling and Offset Cancellation|CDS]]). Rule of thumb: $f_s \le f_u/5$ with PM $> 70^\circ$ and little slewing. |
| **Capacitors** | Two plates over substrate. The **bottom plate** has a large parasitic to substrate (5–10% per Razavi, up to 20% per Carusone); the top plate's is smaller (under 5%). |
| **Switches** | MOSFETs: off resistance up to GΩ, on resistance a few kΩ or less, **zero offset** when on (a BJT switch would leave $V_{CE,sat}$). |
| **Clocks** | Two **non-overlapping** phases $\phi_1,\phi_2$, never high together, so no charge leaks through two closed paths at once. |

> [!tip] Remark
> SC op amps are often single-stage OTAs with very high $R_{out}$: the load is purely capacitive, so the gain stays high with no output buffer, and the load capacitor *is* the compensation capacitor. Doubling $C_L$ halves $f_u$ and improves phase margin ([[Operational Amplifiers#Level 1 One-Stage Op Amps]]).

> [!note]- Detail: generating non-overlapping clocks (Carusone Fig. 14.3(b); Razavi Fig. 13.19)
> Two cross-coupled NOR (or NAND) gates with a delay in each feedback path: each phase can only rise after the other has fallen and propagated through the delay. The delay (an even number of inverters, or an RC) sets the non-overlap gap. For complementary $\phi$ and $\bar\phi$ driving a CMOS switch, Razavi matches the inverter delay with a transmission gate in the other path so both edges arrive together.

## Level 1: Discrete-Time Signals

An SC circuit is quantized in **time** but not in amplitude: it is an analog discrete-time system. Its natural language is the sample sequence $x(n) = x_c(nT)$ and the $z$-transform.

### Sampling Makes Images

Sampling copies the input spectrum to every $kf_s$; holding each sample for $T$ (S/H, DAC) shapes the copies by a sinc with nulls at multiples of $f_s$. No aliasing if $x_c$ is band-limited to $f_s/2$, so an SC filter needs a continuous-time anti-aliasing filter in front and a smoothing filter after.

> [!tip] Remark
> The impulse-train spectrum $X_s(f)=\frac1T\sum_kX_c(f-kf_s)$ and the zero-order-hold sinc are derived once, in [[Sampling Circuits#Impulse Sampling and Aliasing]] and [[Sampling Circuits#Zero-Order Hold and Track-and-Hold]]; folding into Nyquist zones is [[Data Converter Fundamentals#Aliasing and Nyquist Zones]].

- The **discrete sequence** $x(n)$ has unattenuated images. Only a held, continuous-time output (S/H, DAC) gets the sinc shaping. A S/H in front of an ADC just holds the value steady for conversion; it does **not** help anti-aliasing.
- Normalized frequency: $\omega = 2\pi f/f_s$ rad/sample. Spectra repeat every $2\pi$; plot $0 \le \omega \le \pi$.

> [!note]- Detail: down- and upsampling (Carusone §13.4)
> **Downsampling by $L$** (keep every $L$th sample) stretches the spectrum by $L$. To avoid aliasing the signal must already be band-limited to $\pi/L$, i.e. sampled $L$ times above Nyquist.
> **Upsampling by $L$** (insert $L-1$ zeros) keeps the spectrum but renormalizes the axis: $L$ copies now sit in $0$ to $2\pi$. A digital filter that removes the extra images gives the same sequence as sampling the analog signal $L$ times faster.

> [!note]- Example: sinc droop and image size (Carusone Ex. 13.8)
> 10 kHz tone, 50 kHz clock, through $H(z) = 0.2/(z-0.8)$ and a DAC with hold. $|H(e^{j0.4\pi})| = 0.1869$. Sinc at $f/f_s = 0.2$: $0.9355$, so the 10 kHz output is $175$ mV rms for a 1 V rms input. Images at 40 and 60 kHz see sinc values $0.2399$ and $0.1559$: $43.7$ and $29.1$ mV rms.

### The z-Domain

```tikz title="Frequency response lives on the unit circle: z = 1 is dc (and f_s), z = -1 is f_s/2. Stable iff every pole is inside. The ideal SC integrator has its pole exactly at z = 1. After Carusone Fig. 13.10(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!15] (0,0) circle (2);
  \draw[->] (-3,0) -- (3.2,0) node[right]{$\mathrm{Re}\,z$};
  \draw[->] (0,-2.6) -- (0,2.7) node[above]{$\mathrm{Im}\,z$};
  \draw[thick] (0,0) circle (2);
  \draw[thick] (1.85,-0.15) -- (2.15,0.15);
  \draw[thick] (1.85,0.15) -- (2.15,-0.15);
  \node[anchor=south west,font=\scriptsize] at (2.05,0.05) {$z=1$: dc, $f_s$};
  \node[anchor=north west,font=\scriptsize] at (2.05,-0.1) {integrator pole};
  \fill (-2,0) circle (2pt);
  \node[anchor=south east,font=\scriptsize] at (-2.05,0.05) {$z=-1$: $f_s/2$};
  \fill (0,2) circle (2pt);
  \node[anchor=south west,font=\scriptsize] at (0.05,2.05) {$z=j$: $f_s/4$};
  \draw[->] (0,0) -- (1.414,1.414);
  \node[font=\scriptsize,anchor=west] at (1.45,1.45) {$e^{j\omega},\ \omega = 2\pi f/f_s$};
  \node[font=\scriptsize] at (-0.8,-0.9) {stable};
\end{circuitikz}
\end{document}
```

$$
\boxed{z \equiv e^{sT},\qquad X(z) = \sum_n x(n)z^{-n},\qquad x(n-k)\leftrightarrow z^{-k}X(z)}
$$

- A $z^{-1}$ is one clock period of delay: the "integrator" of discrete time is a delay in a loop.
- Evaluate $H(z)$ on $z = e^{j\omega}$. Poles and zeros at $z = 0$ change only the phase.
- **Stable iff all poles satisfy $|z_p| < 1$.** A pole at $z=1$ is a discrete-time integrator (marginally stable); at $z=-1$ it oscillates at $f_s/2$.
- **FIR:** impulse response ends (all poles at 0, always stable). **IIR:** response decays forever; lower order for the same spec.

> [!tip] Remark
> The transform pairs, ROC rules and pole-zero geometry are in [[Z-Transform]] and [[Pole-Zero Plots]]. Here only three facts are needed: $z^{-1}$ = one period of delay, the unit circle is the frequency axis, and poles inside it are stable.

> [!note]- Example: 3-dB point of a first-order pole (Carusone Ex. 13.5)
> $H(z) = b/(z-a)$. The 3-dB point is where $|e^{j\omega}-a| = \sqrt2(1-a)$:
> $$\omega_{3dB} = \cos^{-1}\!\left(2-\frac a2-\frac1{2a}\right)$$
> For $a = 0.8$: $\omega = 0.2241$ rad, i.e. $f_s/28.04$.

### Bilinear Transform

$$
\boxed{s = \frac{z-1}{z+1},\qquad z = \frac{1+s}{1-s},\qquad \Omega = \tan\frac{\omega}{2}}
$$

Design a fictitious continuous-time $H_c(s)$, then set $H(z) = H_c\!\left(\frac{z-1}{z+1}\right)$. The whole $j\Omega$ axis maps onto the unit circle ($z=1\to$ dc, $z=-1\to\infty$), so the response is $H_c$'s, with the frequency axis **warped** by $\Omega = \tan(\omega/2)$. Pre-warp the critical frequencies; order is preserved.

> [!note]- Example: first-order low-pass at $f_s/20$ (Carusone Ex. 13.7)
> $\omega = 2\pi/20 = 0.3142 \Rightarrow \Omega = \tan(0.1571) = 0.1584$. Continuous pole at $-0.1584$, zero at $\infty$. Map back: pole $z = (1-0.1584)/(1+0.1584) = 0.7265$, zero at $z=-1$:
> $$H(z) = \frac{0.1368\,(z+1)}{z-0.7265}$$
> ($k$ from $H(1) = 1$.) Carusone's convention normalizes $T$ to 2; other texts write $s = \frac2T\frac{z-1}{z+1}$. The $T$ cancels as long as you use the same one both ways.

## Level 2: Integrators and Signal-Flow Graphs

### The Parasitic-Sensitive Integrator

```tikz title="First SC integrator: the SC 'resistor' feeding an op-amp integrator. Left: circuit with the top-plate and switch parasitics C_p1 drawn dashed. Right: for a constant input the output steps by -(C1/C2) V_in every period. After Carusone Figs. 14.5 and 14.8, Razavi Fig. 13.57."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (6,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.4,0) node[ground]{};
  \draw (OA.-) -- ++(-0.6,0) coordinate(X) node[circ]{};
  \draw (X) to[nos,l_=$\phi_2$] ++(-2,0) coordinate(P) node[circ]{};
  \node[above] at (P) {$P$};
  \draw (P) to[nos,l_=$\phi_1$] ++(-2,0) node[ocirc]{} node[left]{$v_i$};
  \draw (P) to[C,l_=$C_1$] ++(0,-1.8) node[ground]{};
  \draw[dashed] (P) ++(0,-0.35) -- ++(1.0,0) coordinate(Q);
  \draw[dashed] (Q) to[C,l=$C_{p1}$] ++(0,-1.45) node[ground]{};
  \draw (X) -- ++(0,1.4) coordinate(F) to[C,l=$C_2$] (F -| OA.out) -- (OA.out);
  \draw (OA.out) -- ++(0.6,0) node[ocirc]{} node[right]{$v_o$};
  \begin{scope}[xshift=9.8cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (4,0) node[right]{$t$};
    \draw[->] (0,-0.2) -- (0,3) node[above]{$-v_o$};
    \draw[thick] (0,0.2) -- (0.6,0.2) -- (0.6,0.7) -- (1.2,0.7) -- (1.2,1.2) -- (1.8,1.2) -- (1.8,1.7) -- (2.4,1.7) -- (2.4,2.2) -- (3,2.2) -- (3,2.7) -- (3.5,2.7);
    \draw[dashed] (0,0.2) -- (3.4,2.7);
    \draw[<->] (3.2,2.2) -- (3.2,2.7);
    \node[right,font=\scriptsize] at (3.25,2.45) {$\frac{C_1}{C_2}V_{in}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{v_o(n) = v_o(n-1) - \frac{C_1}{C_2}v_i(n-1)\quad\Rightarrow\quad H(z) = -\frac{C_1}{C_2}\frac{z^{-1}}{1-z^{-1}} = -\frac{C_1}{C_2}\frac{1}{z-1}}
$$

$$
\boxed{\text{for } \omega T \ll 1:\quad H \approx -\frac{C_1}{C_2}\frac{1}{j\omega T}\quad(\text{integrator gain } K_I = C_1/(C_2T))}
$$

Each period, $C_1$ grabs charge $C_1v_i$ and dumps it into $C_2$ through the virtual ground. The pole at $z = 1$ is the integrator.

**The flaw:** $C_{p1}$ (top-plate parasitic plus both switches' junction capacitance) sits in parallel with $C_1$:

$$
\boxed{H(z) = -\frac{C_1+C_{p1}}{C_2}\frac{1}{z-1}}
$$

$C_{p1}$ is poorly controlled and **nonlinear** (junctions): coefficient error and distortion. The input-dependent charge injection of the $\phi_1$ switch adds more nonlinearity (Razavi §13.4).

> [!note]- Derivation: charge bookkeeping and the $j\omega T$ limit (Carusone Eqs. 14.6–14.18)
> End of $\phi_1$ at $nT-T$: $C_1$ holds $C_1v_i(nT-T)$, $C_2$ holds $C_2v_o(nT-T)$. During $\phi_2$, the virtual ground empties $C_1$ and the discharge current passes through $C_2$:
> $$C_2v_o(nT-T/2) = C_2v_o(nT-T) - C_1v_i(nT-T)$$
> $C_2$'s charge is untouched during the next $\phi_1$, so $v_o(nT) = v_o(nT-T/2)$. $z$-transform: $V_o = z^{-1}V_o - \frac{C_1}{C_2}z^{-1}V_i$.
>
> Low-frequency limit: write $H = -\frac{C_1}{C_2}\frac{z^{-1/2}}{z^{1/2}-z^{-1/2}}$ and use $z^{\pm1/2} = \cos\frac{\omega T}2 \pm j\sin\frac{\omega T}2$:
> $$H(e^{j\omega T}) = -\frac{C_1}{C_2}\frac{z^{-1/2}}{2j\sin(\omega T/2)} \approx -\frac{C_1}{C_2}\frac{z^{-1/2}}{j\omega T}$$
> The $z^{-1/2}$ is half a period of delay. Why the other parasitics don't matter: the bottom plate of $C_1$ is grounded always; $C_{p3}$ at the virtual ground holds no charge; $C_{p4}$ at the op-amp output only slows settling.
>
> **Finite op-amp gain $A$** (Carusone Prob. 14.6): $H(z) = -\frac{C_1}{C_2}\frac{1}{z(1+\frac{C_1}{C_2A})-1}$, dc gain $-A$ and the pole moves inside the circle by about $\frac{C_1}{C_2}\frac1A$: a leaky integrator.

> [!note]- Detail: why junction capacitance is nonlinear charge (Razavi Eq. 13.64)
> The charge stored on the switch junctions at node $P$ is not $C_jV_{in0}$ but $q = \int_0^{V_{in0}}C_j(V)\,dV$. Since $C_j$ depends on voltage ([[MosFETs#Capacitances]]), the charge dumped into $C_2$ is a nonlinear function of $V_{in0}$.

### Parasitic-Insensitive Integrators

```tikz title="Four switches per capacitor. Both plates of C1 are always tied to a voltage source, ground, or the virtual ground, so C_p1 and C_p2 never pass charge into C2. Phases outside parentheses: delayed integrator (+C1/C2 * 1/(z-1)). Swap the two right-plate phases (in parentheses): delay-free integrator (-C1/C2 * z/(z-1)). After Carusone Figs. 14.9, 14.11, 14.12 and Razavi Fig. 13.59."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (10,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.4,0) node[ground]{};
  \draw (OA.-) -- ++(-0.6,0) coordinate(X) node[circ]{};
  \draw (X) to[nos,l_={$\phi_2\ (\phi_1)$}] ++(-2.6,0) coordinate(R) node[circ]{};
  \draw (R) to[C,l_=$C_1$] ++(-3,0) coordinate(L) node[circ]{};
  \draw (L) to[nos,l_=$\phi_1$] ++(-2.2,0) node[ocirc]{} node[left]{$v_i$};
  \draw (L) to[nos,l=$\phi_2$] ++(0,-1.8) node[ground]{};
  \draw (R) to[nos,l_={$\phi_1\ (\phi_2)$}] ++(0,-1.8) node[ground]{};
  \draw[dashed] (L) ++(0,-0.35) -- ++(-0.9,0) coordinate(LP);
  \draw[dashed] (LP) to[C,l_=$C_{p1}$] ++(0,-1.45) node[ground]{};
  \draw[dashed] (R) ++(0,-0.35) -- ++(0.9,0) coordinate(RP);
  \draw[dashed] (RP) to[C,l=$C_{p2}$] ++(0,-1.45) node[ground]{};
  \draw (X) -- ++(0,1.6) coordinate(F) to[C,l=$C_2$] (F -| OA.out) -- (OA.out);
  \draw (OA.out) -- ++(0.6,0) node[ocirc]{} node[right]{$v_o$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Delayed: } H(z) = +\frac{C_1}{C_2}\frac{z^{-1}}{1-z^{-1}} = \frac{C_1}{C_2}\frac{1}{z-1}}\qquad
\boxed{\text{Delay-free: } H(z) = -\frac{C_1}{C_2}\frac{1}{1-z^{-1}} = -\frac{C_1}{C_2}\frac{z}{z-1}}
$$

Why the parasitics drop out:
- $C_{p1}$ (left plate) is charged by $v_i$ and discharged to ground through its own switch; none of that current passes through $C_1$ into $C_2$.
- $C_{p2}$ (right plate) always sits at ground or virtual ground, so it never holds charge.
- The switch junctions at the right plate swing between 0 and virtual ground: almost no voltage change, so their nonlinearity is negligible (Razavi).

**Delayed:** $C_1$ samples on $\phi_1$, is flipped (right plate to $X$, left to ground) on $\phi_2$: output lags input by a full period, sign positive. **Delay-free:** the right plate is on $X$ during $\phi_1$, so charging $C_1$ to $v_i(n)$ pulls that charge through $C_2$ in the same phase.

> [!tip] Remark
> In a fully differential circuit, crossing two wires flips a sign, so either integrator can have either polarity. Name them by **delay**, not by sign.

> [!note]- Derivation: delay-free integrator (Carusone Eqs. 14.22–14.25)
> On $\phi_2$, $C_1$ is discharged (both plates grounded) and $C_2$'s charge doesn't change: $v_o(n-\tfrac12) = v_o(n-1)$. On $\phi_1$, charging $C_1$ to $v_i(nT)$ draws $C_1v_i(nT)$ through $C_2$:
> $$C_2v_o(n) = C_2v_o(n-\tfrac12) - C_1v_i(n) \Rightarrow v_o(n) = v_o(n-1)-\frac{C_1}{C_2}v_i(n)$$
> The input sample appears in the same period: no delay, purely real numerator.

### Signal-Flow-Graph Analysis

```tikz title="SFG of a three-input SC integrator. The op amp with integrating capacitor C_A becomes one block; each input branch becomes a gain set by its type. Output sampled at the end of phi1. After Carusone Fig. 14.14(b)."
\usepackage{circuitikz}
\usetikzlibrary{positioning}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,minimum height=0.9cm,inner sep=4pt}]
  \node (V1) at (0,1.6) {$V_1(z)$};
  \node (V2) at (0,0) {$V_2(z)$};
  \node (V3) at (0,-1.6) {$V_3(z)$};
  \node[draw,circle,inner sep=1pt] (S) at (6,0) {$+$};
  \node[blk] (I) at (9,0) {$\dfrac{1}{C_A}\dfrac{1}{1-z^{-1}}$};
  \node (Vo) at (11.8,0) {$V_o(z)$};
  \draw[->] (V1) -- node[above,font=\scriptsize]{unswitched: $-C_1(1-z^{-1})$} (4.2,1.6) -- (S);
  \draw[->] (V2) -- node[above,font=\scriptsize]{delayed: $+C_2z^{-1}$} (S);
  \draw[->] (V3) -- node[below,font=\scriptsize]{delay-free: $-C_3$} (4.2,-1.6) -- (S);
  \draw[->] (S) -- (I);
  \draw[->] (I) -- (Vo);
\end{circuitikz}
\end{document}
```

$$
\boxed{V_o(z) = \frac{1}{C_A(1-z^{-1})}\Big[-C_1(1-z^{-1})V_1 + C_2z^{-1}V_2 - C_3V_3\Big]}
$$

Three branch types, one integrator block. Draw the SFG, then write $H(z)$ by inspection instead of tracking charge phase by phase.
- **Unswitched** capacitor into the virtual ground: $-C_1(1-z^{-1})$, so with $C_A$ it is a plain gain $-C_1/C_A$.
- **Delayed** SC branch: $+C_2z^{-1}$.
- **Delay-free** SC branch: $-C_3$.

## Level 3: Filters

### First-Order Filter

```tikz title="First-order SC filter with switch sharing: C1 unswitched feed-in, C2 delay-free input branch, C3 delay-free damping branch from the output; C2 and C3 share their right-plate switches. After Carusone Figs. 14.18 and 14.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (10,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.4,0) node[ground]{};
  \draw (OA.-) -- ++(-0.6,0) coordinate(X) node[circ]{};
  \draw (X) to[nos,l_=$\phi_1$] ++(-1.9,0) coordinate(N) node[circ]{};
  \draw (N) to[nos,l=$\phi_2$] ++(0,-1.6) node[ground]{};
  \draw (N) to[C,l_=$C_2$] ++(-1.8,0) coordinate(L2) node[circ]{};
  \draw (L2) to[nos,l=$\phi_2$] ++(0,-1.6) node[ground]{};
  \draw (L2) to[nos,l_=$\phi_1$] ++(-1.9,0) coordinate(VI) node[circ]{};
  \draw (VI) -- ++(-0.8,0) node[ocirc]{} node[left]{$V_i$};
  \draw (N) -- ++(0,1.5) coordinate(N3);
  \draw (N3) to[C,l_=$C_3$] ++(-1.8,0) coordinate(L3) node[circ]{};
  \draw (L3) to[nos,l_=$\phi_2$] ++(-1.2,0) node[ground]{};
  \draw (L3) to[nos,l_=$\phi_1$] ++(0,1.3) node[ocirc]{} node[above]{from $V_o$};
  \draw (VI) -- ++(0,3.9) coordinate(C1L) to[C,l=$C_1$] (C1L -| X) -- (X);
  \draw (X) -- ++(0,5.0) coordinate(FA) to[C,l=$C_A$] (FA -| OA.out) -- (OA.out);
  \draw (OA.out) -- ++(0.6,0) node[ocirc]{} node[right]{$V_o$};
\end{circuitikz}
\end{document}
```

$$
\boxed{H(z) = -\frac{\left(\frac{C_1+C_2}{C_A}\right)z - \frac{C_1}{C_A}}{\left(1+\frac{C_3}{C_A}\right)z - 1},\qquad z_p = \frac{C_A}{C_A+C_3},\quad z_z = \frac{C_1}{C_1+C_2},\quad H(1) = -\frac{C_2}{C_3}}
$$

$$
\boxed{\omega_pT \approx \frac{C_3/C_A}{1+C_3/(2C_A)},\qquad \omega_zT \approx \frac{C_2/C_1}{1+C_2/(2C_1)}\qquad(\omega T\ll1)}
$$

Recipe: take the active-RC prototype, replace every resistor by a **delay-free** SC branch (delay-free inputs integrate negatively, as resistors do), keep unswitched capacitors as they are, then get the exact response from the SFG.
- With positive capacitors both pole and zero are real, between 0 and 1: always stable. $C_3 = 0$ gives the integrator (pole at 1).
- A zero at $z = -1$ (a null at $f_s/2$) needs $C_1 = -0.5C_2$: a negative capacitor, made in a fully differential circuit by crossing the input wires.
- **Switch sharing:** $C_2$ and $C_3$ switch their right plates together, so one pair of switches serves both.

> [!note]- Example: unity-gain low-pass with a null at $f_s/2$ (Carusone Ex. 14.3)
> 3-dB at 10 kHz, $f_s = 100$ kHz, zero gain at 50 kHz, dc gain 1, $C_A = 10$ pF. Pre-warp: $\Omega = \tan(0.2\pi/2) = 0.3249$; pole $z_p = (1-0.3249)/(1+0.3249) = 0.5095$:
> $$H(z) = \frac{0.24525(z+1)}{z-0.5095} = \frac{0.4814z+0.4814}{1.9627z-1}$$
> Matching coefficients: $C_1 = 4.814$ pF, $C_2 = -9.628$ pF, $C_3 = 9.628$ pF (differential input for the negative one).

> [!note]- Example: approximate design at $f_s/64$ (Carusone Ex. 14.4)
> $C_1 = 0$, pole at $f_s/64$: $C_3/C_A = \frac{2\pi/64}{1-2\pi/128} = 0.1032$. With $C_A = 10$ pF, $C_3 = 1.032$ pF; unity low-frequency gain $C_2/C_3 = 1$ gives $C_2 = 1.032$ pF.

### Fully Differential Filters

```tikz title="Differential symmetry: identical nonlinear halves driven by +v1 and -v1. Even-order terms appear as common mode and cancel in the difference. After Carusone Fig. 14.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,minimum width=2cm,minimum height=0.8cm}]
  \node[blk] (A) at (2,1) {nonlinear};
  \node[blk] (B) at (2,-1) {nonlinear};
  \draw[->] (0,1) node[left]{$v_1$} -- (A);
  \draw[->] (0,-1) node[left]{$-v_1$} -- (B);
  \draw[->] (A) -- (4.2,1) node[right]{$k_1v_1+k_2v_1^2+k_3v_1^3+\dots$};
  \draw[->] (B) -- (4.2,-1) node[right]{$-k_1v_1+k_2v_1^2-k_3v_1^3+\dots$};
  \node[anchor=west] at (4.2,0) {$v_{diff} = 2k_1v_1+2k_3v_1^3+2k_5v_1^5+\dots$};
\end{circuitikz}
\end{document}
```

- **Sign inversion is free** (swap wires), so negative capacitors and either-polarity integrators exist.
- Common-mode noise (supply, substrate, clock coupling) is rejected.
- **Even-order distortion cancels** if each half distorts symmetrically about the common mode.
- Signal swing doubles, so for the same $kT/C$-limited dynamic range the capacitors can be **half** as big. With smaller capacitors, smaller switches settle in time. Cost: more switches and wiring and a CMFB circuit; well designed, much less than $2\times$ the area.

> [!tip] Remark
> The even-order cancellation is the same argument as in [[Nonlinearity and Mismatch]] and [[Differential Amplifiers]]. The CMFB it requires can itself be switched-capacitor: see [[#Switched-Capacitor Common-Mode Feedback]].

> [!note]- Detail: why half the capacitance gives the same SNR (Carusone footnote, p. 577)
> Doubling swing quadruples signal power. Two capacitor networks double the noise power, and halving each capacitor doubles it again: net SNR equal to a single-ended circuit with capacitors twice as large.

### Biquads

```tikz title="Two-integrator loop of the low-Q SC biquad as an SFG. K5 z^-1 is the single delay around the loop (LDI); K4 closes the loop delay-free, K6 is the damping branch. Lowpass via K1, bandpass via K2, highpass via K3. After Carusone Fig. 14.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,minimum height=0.9cm,inner sep=3pt}]
  \node (Vi) at (0,0) {$V_i$};
  \node[draw,circle,inner sep=1pt] (S1) at (2.2,0) {$+$};
  \node[blk] (I1) at (4,0) {$\frac{1}{1-z^{-1}}$};
  \node[draw,circle,inner sep=1pt] (S2) at (7.4,0) {$+$};
  \node[blk] (I2) at (9.2,0) {$\frac{1}{1-z^{-1}}$};
  \node (Vo) at (11.8,0) {$V_o$};
  \draw[->] (Vi) -- node[above,font=\scriptsize]{$-K_1$} (S1);
  \draw[->] (S1) -- (I1);
  \draw[->] (I1) -- node[above,font=\scriptsize]{$V_1$} node[below,font=\scriptsize]{$K_5z^{-1}$} (S2);
  \draw[->] (S2) -- (I2);
  \draw[->] (I2) -- (Vo);
  \draw[->] (10.8,0) -- (10.8,1.8) -- node[above,font=\scriptsize]{$-K_4$} (2.2,1.8) -- (S1);
  \draw[->] (10.8,0.9) -- node[above,font=\scriptsize]{$-K_6$} (7.4,0.9) -- (S2);
  \draw[->] (1,0) -- (1,-1.3) -- node[below,font=\scriptsize]{$-K_2-K_3(1-z^{-1})$} (7.4,-1.3) -- (S2);
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Low-Q: } H(z) = -\frac{(K_2+K_3)z^2+(K_1K_5-K_2-2K_3)z+K_3}{(1+K_6)z^2+(K_4K_5-K_6-2)z+1}}
$$

$$
\boxed{K_4\approx K_5\approx\omega_0T,\qquad K_6\approx\frac{\omega_0T}{Q},\qquad \text{spread}\approx\frac{Q}{\omega_0T}\ (Q>1)}
$$

- Build it like the first-order filter: an active-RC two-integrator loop (Tow-Thomas style) with each resistor replaced by an SC branch.
- **Exactly one delay around the two-integrator loop** (lossless discrete integrator, LDI). Two delay-free branches give a delay-free loop and slow settling; two delayed ones make high-$Q$ poles over-sensitive.
- Since $f_s \gg f_0$, $\omega_0T \ll 1$: the integrating capacitors are the big ones, and the damping capacitor $K_6C_2$ becomes tiny at high $Q$. **Capacitance spread** (area, matching) is the reason for a second, **high-Q** topology that damps through a capacitor around the first integrator instead.
- Carusone's comparison (Ex. 14.5, $Q\approx10$ bandpass near $f_s/10$): spread about 11 for the high-Q circuit vs about 17 for the low-Q one.
- Higher order: cascade biquads and first-order sections, or simulate an LC ladder with an SFG for lower sensitivity.

> [!note]- Detail: design equations (Carusone Eqs. 14.54–14.60, 14.71–14.78)
> **Low-Q**, target $H(z) = -\frac{a_2z^2+a_1z+a_0}{b_2z^2+b_1z+1}$:
> $K_3 = a_0$, $K_2 = a_2-a_0$, $K_1K_5 = a_0+a_1+a_2$, $K_6 = b_2-1$, $K_4K_5 = b_1+b_2+1$.
> One free parameter (the internal node level $V_1$). Choosing $K_4 = K_5 = \sqrt{b_1+b_2+1}$ equalizes the two integrators' time constants and is usually near the dynamic-range optimum.
>
> **High-Q** (damping capacitor $K_6C_1$ around integrator 1):
> $$H(z) = -\frac{K_3z^2+(K_1K_5+K_2K_5-2K_3)z+(K_3-K_2K_5)}{z^2+(K_4K_5+K_5K_6-2)z+(1-K_5K_6)}$$
> Target $-\frac{a_2z^2+a_1z+a_0}{z^2+b_1z+b_0}$: $K_1K_5 = a_0+a_1+a_2$, $K_2K_5 = a_2-a_0$, $K_3 = a_2$, $K_4K_5 = 1+b_0+b_1$, $K_5K_6 = 1-b_0$; start from $K_4 = K_5 = \sqrt{1+b_0+b_1}$, then rescale for equal swing at both op-amp outputs.
>
> Main signal paths: $K_1$ for low-pass, $K_2$ for bandpass, $K_3$ for high-pass. With $K_6 = 0$ and complex poles, the low-Q circuit's poles sit exactly on the unit circle: a resonator (Prob. 14.16).

## Level 4: The Switch as a Real Device

Only what an SC designer needs from the switch is kept here; the sampling switch itself (bootstrapping, charge-injection models, aperture jitter) is owned by [[Sampling Circuits]].

### On-Resistance and Signal Swing

```tikz title="On-resistance vs input level: NMOS blows up near V_DD - V_THN, PMOS near |V_THP|; in parallel (transmission gate) the variation is much smaller. Drawn with a weaker PMOS, which leaves the bump. After Razavi Figs. 13.16 and 13.17(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.2,0) node[right]{$V_{in}$};
  \draw[->] (0,0) -- (0,4.6) node[above]{$R_{on}$};
  \draw[thick,domain=0:2.03,samples=50] plot ({1.8*\x},{1.2/(2.3-\x)});
  \draw[thick,dashed,domain=1.3:3.2,samples=50] plot ({1.8*\x},{1.2/(0.5*(\x-0.7))});
  \draw[very thick,domain=0:0.7,samples=20] plot ({1.8*\x},{1.2/(2.3-\x)});
  \draw[very thick,domain=0.7:2.3,samples=40] plot ({1.8*\x},{1.2/(1.95-0.5*\x)});
  \draw[very thick,domain=2.3:3.2,samples=20] plot ({1.8*\x},{1.2/(0.5*(\x-0.7))});
  \draw[dotted] (4.14,0) -- (4.14,3.4);
  \node[below,font=\scriptsize] at (4.14,0) {$V_{DD}-V_{THN}$};
  \draw[dotted] (1.26,0) -- (1.26,3.4);
  \node[below,font=\scriptsize] at (1.26,0) {$|V_{THP}|$};
  \node[font=\scriptsize,anchor=west] at (3.8,4.3) {NMOS};
  \node[font=\scriptsize,anchor=east] at (2.25,4.3) {PMOS (dashed)};
  \node[font=\scriptsize,anchor=west] at (4.5,0.45) {CMOS $R_{on,N}\parallel R_{on,P}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{on} = \frac{1}{\mu_nC_{ox}\frac WL(V_{DD}-V_{in}-V_{TH})}}\qquad
\boxed{\text{for } R_{on} \text{ within } 4{:}1:\ V_{in,max} = \tfrac34(V_{DD}-V_{TH})}
$$

> [!tip] Remark
> This is the deep-triode $R_{on}$ from [[MosFETs#Regions of Operation]], with $V_{GS} = V_{DD}-V_{in}$. A MOSFET makes a good sampler because it conducts in both directions and passes no dc offset when on.

- An NMOS switch cannot pass inputs above $V_{DD}-V_{TH}$ at all. Even inside the range, $R_{on}$ and the settling time constant depend on the signal, and that causes distortion.
- The threshold voltage, not the overdrive, limits the swing. Body effect makes it worse: $V_{TH}$ rises with $V_{in}$.
- **Transmission gate:** $R_{on,N}\parallel R_{on,P}$ is flat if $\mu_nC_{ox}(W/L)_N = \mu_pC_{ox}(W/L)_P$ (ignoring body effect). Both devices must turn off **at the same instant**, otherwise the late one keeps tracking with a large, input-dependent time constant.
- Example (Razavi Ex. 13.3): $\mu_nC_{ox} = 50\ \mu$A/V², $W/L = 10$, $V_{TH} = 0.7$ V, $V_{DD} = 3$ V: $R_{on}$ goes from 870 Ω to 1.11 kΩ over a 0–0.5 V input, and reaches 2.5 kΩ at 1.5 V.
- Speed must come with an accuracy band: settled means within $\Delta V$ of the final value (e.g. 0.1%).

### Charge Injection and Clock Feedthrough

```tikz title="When the switch opens, its channel charge Q_ch leaves through both ends; the part landing on C_H plus the clock step coupled through the overlap capacitance W C_ov gives a negative pedestal Delta V. After Razavi Figs. 13.20, 13.21 and 13.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[nmos,rotate=-90] (M) at (1.6,0) {};
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} -- (M.S);
  \draw (M.D) -- (3.8,0) coordinate(O) node[circ]{} -- (4.6,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (O) to[C,l=$C_H$] (3.8,-1.6) node[ground]{};
  \node[left] at ($(M.G)+(0,0.25)$) {$CK$};
  \draw[->,thick] (1.45,-0.55) -- ++(-0.8,-0.5);
  \draw[->,thick] (1.75,-0.55) -- ++(0.8,-0.5);
  \node[font=\scriptsize] at (1.6,-1.35) {$Q_{ch}$ splits};
  \coordinate (CX) at (3.0,0);
  \draw[dashed] (M.G) -- ++(0,0.5) coordinate(GT);
  \draw[dashed] (GT) -- (GT -| CX) to[C,l=$WC_{ov}$] (CX);
  \begin{scope}[xshift=7cm,yshift=-1.4cm]
    \draw[->] (0,0) -- (4.2,0) node[right]{$t$};
    \draw (0,2.6) -- (1.8,2.6) -- (1.8,2.0) -- (4,2.0);
    \node[left] at (0,2.3) {$CK$};
    \draw[thick] (0,0.4) -- (0.5,0.7) -- (1.0,0.9) -- (1.8,1.3) -- (1.8,0.9) -- (4,0.9);
    \draw[dashed] (1.8,1.3) -- (4,1.3);
    \draw[<->] (3.5,0.9) -- (3.5,1.3);
    \node[right,font=\scriptsize] at (3.55,1.1) {$\Delta V$};
    \node[left] at (0,0.6) {$V_{out}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Q_{ch} = WLC_{ox}(V_{DD}-V_{in}-V_{TH}),\qquad \Delta V_{inj} = \frac{\alpha\,Q_{ch}}{C_H}\ (\alpha\le1)}\qquad
\boxed{\Delta V_{ft} = V_{CK}\frac{WC_{ov}}{WC_{ov}+C_H}}
$$

- **Channel charge injection** depends on $V_{in}$: assuming all of it lands on $C_H$,
  $$V_{out} = V_{in}\left(1+\frac{WLC_{ox}}{C_H}\right)-\frac{WLC_{ox}}{C_H}(V_{DD}-V_{TH})$$
  a **gain error** and an **offset**. Body effect makes $V_{TH}$ depend on $V_{in}$, which adds **nonlinearity**, the one you cannot calibrate away.
- The split fraction $\alpha$ depends on terminal impedances and clock edge rate, has no reliable rule of thumb, and is poorly simulated. Worst case: assume all of it goes to $C_H$.
- **Clock feedthrough** through the overlap capacitance is input-independent: a constant offset.
- **Speed vs precision:** with $\tau = R_{on}C_H$ and $\Delta V = WLC_{ox}(V_{DD}-V_{in}-V_{TH})/C_H$,

$$
\boxed{F = \frac{1}{\tau\,\Delta V} = \frac{\mu_n}{L^2}}\qquad\boxed{f_{clk} < \frac{\mu_n\,\Delta V_{max}}{5L^2}}
$$

Neither $W$ nor $C$ escapes the trade-off; only a shorter $L$ (a newer process) does. Carusone's version assumes half the charge lands on $C$ and a half period of $5\tau$; for $\Delta V_{max} = 1$ mV it gives 14.8, 69 and 196 MHz in 0.8, 0.35 and 0.18 µm processes (Ex. 14.7). Overlap capacitance is ignored, so treat it as an upper bound.

> [!tip] Remark
> $Q_{ch} = WLC_{ox}V_{OV}$ is the inversion charge from [[MosFETs#Regions of Operation|the square-law derivation]], and the body-effect term is [[MosFETs#Body Effect]]. Both errors scale with $WLC_{ox}/C_H$, which is why the switch and capacitor are always sized together.

> [!tip] Remark
> Dummy switches, complementary switches and differential sampling each cancel only part of the error (feedthrough only, one input level, offset and even order only). Those schemes, bootstrapped switches that hold $V_{GS}$ constant, and the charge-split models are owned by [[Sampling Circuits]]. What SC circuits actually rely on is **bottom-plate sampling with clock ordering**: [[#Bottom-Plate Sampling and Clock Ordering]].

### kT/C Noise

$$
\boxed{\overline{v_n^2} = \frac{kT}{C}\ \text{per sample}}\qquad\boxed{\text{SC branch, two phases: } \overline{v_{n,in}^2} = \frac{2kT}{C}}
$$

- An SC branch samples $kT/C$ on $\phi_1$ and again on $\phi_2$. The two are uncorrelated, so the charge into the integrator has $\overline{\Delta Q^2} = 2kTC$: equivalent to $2kT/C$ at the input (ideal op amp; op-amp noise adds a little more).
- Low noise needs large $C$, which loads the op amp and the switches and slows everything. Choose $C$ from the dynamic-range spec first.

> [!tip] Remark
> The derivation (noise of $R$ integrated over the $RC$ bandwidth gives $kT/C$ whatever $R$ is) is in [[Noise#kT/C Noise]]; capacitor sizing for a dynamic range is in [[Noise#Dynamic Range and the Size of C]]. Sampler-specific noise design (aliasing, the op-amp's share) is in [[Sampling Circuits]].

## Level 5: SC Amplifiers, Precision and Speed

### Bottom-Plate Sampling and Clock Ordering

```tikz title="Unity-gain (flip-around) sampler and its clock edges. S2 at the virtual ground opens first, so X floats and its total charge is frozen; S1 then opens and S3 closes. Only S2's charge reaches X, and it is input-independent. After Razavi Figs. 13.31, 13.32 and 13.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (5,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.4,0) node[ground]{};
  \draw (OA.-) -- ++(-0.7,0) coordinate(X) node[circ]{};
  \node[below left] at (X) {$X$};
  \draw (X) to[C,l_=$C_H$] ++(-2,0) coordinate(P) node[circ]{};
  \node[below left] at (P) {$P$};
  \draw (P) to[nos,l_=$S_1$] ++(-2.2,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (X) -- ++(0,1.3) coordinate(F1) to[nos,l=$S_2$] (F1 -| OA.out) -- (OA.out);
  \draw (P) -- ++(0,2.5) coordinate(F2) to[nos,l=$S_3$] (F2 -| OA.out) -- (F1 -| OA.out);
  \draw (OA.out) -- ++(0.6,0) node[ocirc]{} node[right]{$V_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (-0.4,-1.6) {bottom plate of $C_H$ on $P$ (driven),\\ top plate on $X$ (floating)};
  \begin{scope}[xshift=9.2cm,yshift=-1.2cm]
    \draw (0,3.4) -- (1.6,3.4) -- (1.6,2.9) -- (4,2.9);
    \node[left] at (0,3.15) {$S_2$};
    \draw (0,2.3) -- (2.1,2.3) -- (2.1,1.8) -- (4,1.8);
    \node[left] at (0,2.05) {$S_1$};
    \draw (0,0.7) -- (2.6,0.7) -- (2.6,1.2) -- (4,1.2);
    \node[left] at (0,0.95) {$S_3$};
    \draw[dashed] (1.6,0.4) -- (1.6,3.7);
    \node[below,font=\scriptsize] at (1.6,0.4) {1};
    \node[below,font=\scriptsize] at (2.1,0.4) {2};
    \node[below,font=\scriptsize] at (2.6,0.4) {3};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The clock-ordering rule
> Open the switch on the **virtual-ground (floating) node first**. From then on that node's total charge is fixed: no path in or out. Every later switch only disturbs **driven** nodes, which end at a fixed voltage anyway, so their charge injection doesn't reach the output.

1. $S_2$ opens with $X$ at virtual ground: it injects $q_2 = WLC_{ox}(V_{CK}-V_{TH}-V_X)$, a **constant**: an offset only, removed by differential operation.
2. $S_1$ opens: its input-dependent charge cannot change the total charge at floating $X$. With feedback re-formed, $V_{out}$ is independent of $q_1$, of $C_X$, and of op-amp gain.
3. $S_3$'s channel charge comes from the op amp, not from $C_H$.
4. The **sampling instant is the fall of $S_2$**: the input may move between $S_2$ and $S_1$ opening without error.

**Bottom-plate sampling:** connect the big-parasitic bottom plate to the driven side ($V_{in}$ or op-amp output) and the top plate to $X$. That keeps parasitic capacitance (and substrate noise) off the summing node, where it would cost both gain error and speed.

- Differential version: $S_2$ and $S_2'$ inject as common mode. Their mismatch is fixed by an equalizing switch $S_{eq}$ that opens just after them and before $S_1$.
- Carusone's practical form (§14.6): every switch on ground or virtual ground is a single NMOS (it only passes a voltage near ground), driven by an **advanced** clock ($\phi_{1a}, \phi_{2a}$). Signal-side switches can be CMOS gates and are not advanced.

> [!note]- Derivation: why $S_1$'s charge can't reach the output (Razavi Fig. 13.33)
> After $S_2$ opens, give $X$ a capacitance $C_X$ to ground (its value drops out). $S_1$ injects $\Delta q_1$; the series $C_H$, $C_X$ each carry it, but the **net** charge on node $X$ (right plate of $C_H$ plus top plate of $C_X$) is still zero. Flip $C_H$ around the op amp:
> $$C_XV_X-(V_{out}-V_X)C_H = 0,\quad V_X = -V_{out}/A \;\Rightarrow\; -(C_X+C_H)\frac{V_{out}}{A}-V_{out}C_H = 0 \;\Rightarrow\; V_{out} = 0$$
> independent of $\Delta q_1$, $C_X$, $C_H$ and $A$.

> [!note]- Example: offset from mismatched reset switches (Razavi Ex. 13.6)
> Differential noninverting amplifier without $S_{eq}$; $S_2$, $S_2'$ differ in $V_{TH}$ by 10 mV; $C_1 = 1$ pF, $C_2 = 0.5$ pF, $WLC_{ox} = 50$ fF, all channel charge to $X$/$Y$. $\Delta q = WLC_{ox}\Delta V_{TH}$ lands on $C_2$ ($X$ is virtual ground, so $C_1$ doesn't matter): $\Delta V_{out} = 50\text{ fF}\times10\text{ mV}/0.5\text{ pF} = 1$ mV.
>
> Carusone Ex. 14.6 does the same for the first-order filter with advanced ground switches: two 5 µm/0.2 µm NMOS at $V_{DD}/2$ inject 3.8 fC per cycle that must leave through $C_3 = 0.4$ pF, giving a 9.5 mV output offset.

### Unity-Gain Sampler: Gain Error and Settling

$$
\boxed{\frac{V_{out}}{V_0} \approx 1-\frac{1}{A}\left(1+\frac{C_{in}}{C_H}\right) = 1-\frac{1}{\beta A},\qquad \beta = \frac{C_H}{C_H+C_{in}}}
$$

$$
\boxed{\tau_{sam} = \left(R_{on1}+\frac{1}{G_m}\right)C_H,\qquad \tau_{amp} = \frac{C_LC_{in}+C_{in}C_H+C_HC_L}{G_mC_H} = \frac{1}{G_m}\left[C_{in}+\left(1+\frac{C_{in}}{C_H}\right)C_L\right]}
$$

- The op-amp input capacitance $C_{in}$ costs both accuracy and speed, so a wider input pair that raises $A$ is not automatically better: size for **minimum gain error**, not maximum $A$.
- In the sampling phase, the resistance at $X$ is $\approx 1/G_m$ (the op amp in unity feedback), in series with $R_{on1}$.
- $\tau_{amp}$ does not depend on $R_{out}$: a larger $R_{out}$ raises the loop gain, and the closed-loop speed stays the same.
- On entering the amplify phase, $X$ jumps by about $-V_0$: the input pair fully switches and the op amp **slews** at $I_{SS}/C_L$ before linear settling with $\tau_{amp}$.
- Example (Razavi Ex. 13.4): $C_{in} = 0.5$ pF, $C_H = 2$ pF, 0.1% error needs $A \ge 1000\times1.25 = 1250$.

> [!tip] Remark
> $1/(\beta A)$ is the closed-loop gain error and $\tau = C/(\beta G_m)$ the closed-loop time constant from [[Operational Amplifiers#Gain Sets the Gain Error]] and [[Operational Amplifiers#Bandwidth Sets the Settling Time]]. The large initial step is the closed-loop slewing case in [[Operational Amplifiers#Slew Rate]]. Here, $\beta$ is a capacitor ratio.

> [!note]- Detail: limits of $\tau_{amp}$ and the plain sampler comparison (Razavi Ex. 13.5)
> $C_L = 0$: $\tau = C_{in}/G_m$ ($C_{in}$ sees $1/G_m$). $C_{in} = 0$: $\tau = C_L/G_m$. Compared with a switch + $C_H$ followed by a buffer, the flip-around sampler settles more slowly (it needs a full closed-loop settle), but its charge injection is input-independent, which is the whole point.

### Noninverting Amplifier

```tikz title="Settling of an SC amplifier: the op amp's G_m, divided by beta, drives C_L in parallel with C2 in series with (C1 + C_in). After Razavi Fig. 13.52."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} to[R] (4.5,0) node[circ]{} -- (6,0) node[ocirc]{} node[right]{$V_{out}$};
  \node[above] at (2.25,0.45) {$\dfrac{1}{\beta G_m} = \dfrac{C_1+C_2+C_{in}}{G_mC_2}$};
  \draw (4.5,0) to[C,l_={$C_L+\dfrac{C_2(C_1+C_{in})}{C_1+C_2+C_{in}}$}] (4.5,-2) node[ground]{};
\end{circuitikz}
\end{document}
```

$$
\boxed{\left|\frac{V_{out}}{V_{in}}\right| \approx \frac{C_1}{C_2}\left(1-\frac{1}{\beta A}\right),\qquad \beta = \frac{C_2}{C_1+C_2+C_{in}}}
$$

$$
\boxed{\tau_{amp} = \frac{C_L(C_1+C_{in})+C_LC_2+(C_1+C_{in})C_2}{G_mC_2} = \frac{C_L+\dfrac{C_2(C_1+C_{in})}{C_1+C_2+C_{in}}}{\beta G_m}}
$$

- This is the big-picture circuit with $S_2$ opened first. Its output polarity matches $V_{in0}$ (hence "noninverting"), and gain can exceed 1.
- **Gain error and time constant both grow with the nominal gain $C_1/C_2$**, because $\beta$ falls.
- At unity gain it is worse than the flip-around sampler: $\beta = C_2/(C_1+C_2+C_{in})\approx\frac12$ vs $C_H/(C_H+C_{in})\approx1$, so twice the gain error.
- With $C_L = 0$: $\tau = (C_1+C_{in})/G_m$, independent of $C_2$ (more loading but more feedback).

> [!note]- Derivation: gain with finite $A$ (Razavi Eqs. 13.51–13.53)
> Amplification phase, KCL at $X$: $(V_{out}-V_X)C_2 = V_XC_{in}+(V_X-V_{in})C_1$ with $V_{out} = -AV_X$:
> $$\left|\frac{V_{out}}{V_{in}}\right| = \frac{C_1}{C_2+\dfrac{C_2+C_1+C_{in}}{A}} \approx \frac{C_1}{C_2}\left(1-\frac{C_1+C_2+C_{in}}{C_2}\cdot\frac1A\right)$$
> For $\tau$: replace $V_{in}$, $C_1$, $C_{in}$ by a Thevenin equivalent $\alpha V_{in}$, $C_{eq} = C_1+C_{in}$ ($\alpha = C_1/C_{eq}$); the result is the unity-gain $\tau_{amp}$ with $C_{in}\to C_1+C_{in}$.

### Multiply-by-Two

```tikz title="Sample on both C1 and C2 (left); then flip C1 around the op amp and ground C2 (right). Gain 2 with beta of about 1/2, versus 1/3 for a noninverting stage with C1 = 2 C2. After Razavi Fig. 13.53."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (4,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.4,0) node[ground]{};
  \draw (OA.-) -- ++(-0.6,0) coordinate(X) node[circ]{};
  \draw (X) -- ++(0,0.9) coordinate(A1) to[C,l_=$C_1$] ++(-1.8,0) coordinate(B1);
  \draw (X) -- ++(0,-0.9) coordinate(A2) to[C,l=$C_2$] ++(-1.8,0) coordinate(B2);
  \draw (B1) -- (B2);
  \draw (B1) ++(0,-0.9) -- ++(-0.8,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (A1) -- ++(0,1.0) coordinate(T) -| (OA.out);
  \node[font=\scriptsize] at ($(T)+(1.2,0.25)$) {$S_3$ closed};
  \draw (OA.out) -- ++(0.5,0) node[ocirc]{};
  \node[font=\scriptsize] at (2.4,-2.2) {sampling};
  \begin{scope}[xshift=8cm]
    \draw (4,0) node[op amp](OB){};
    \draw (OB.+) -- ++(-0.4,0) node[ground]{};
    \draw (OB.-) -- ++(-0.6,0) coordinate(Y) node[circ]{};
    \draw (Y) -- ++(0,1.4) coordinate(C1L) to[C,l=$C_1$] (C1L -| OB.out) -- (OB.out);
    \draw (Y) -- ++(0,-0.9) coordinate(C2R) to[C,l=$C_2$] ++(-1.8,0) node[ground]{};
    \draw (OB.out) -- ++(0.5,0) node[ocirc]{} node[right]{$V_{out}\approx2V_{in0}$};
    \node[font=\scriptsize] at (2.4,-2.2) {amplification};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = \left(1+\frac{C_2}{C_1}\right)V_{in0} = 2V_{in0},\qquad \beta = \frac{C_1}{C_1+C_2+C_{in}}\approx\frac12}
$$

Charge $2CV_{in0}$ sampled on both capacitors ends up all on $C_1$. Same gain error and $\tau$ formulas as the noninverting amplifier, but with a **higher $\beta$ for the same gain**: $\frac12$ instead of $\frac13$. Cost: twice the input (sampling) capacitance. $S_3$ injects a constant offset; $S_1$, $S_2$, $S_4$, $S_5$ act on driven nodes.

> [!tip] Remark
> This flip-around $\times2$ is the residue amplifier (MDAC) of a 1.5-bit [[Pipelined ADCs|pipelined ADC]] stage; its gain error and settling become the converter's linearity budget. The integrators above are the loop filter of [[Delta-Sigma ADCs]].

## Level 6: Offset Cancellation, CMFB and Other SC Circuits

### Correlated Double Sampling and Offset Cancellation

```tikz title="Resettable gain circuit. On phi2 both capacitors charge to the op-amp offset V_off; on phi1 C1 takes the input and the output is -(C1/C2) v_in with V_off cancelled. After Carusone Figs. 14.31 and 14.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (8,0) node[op amp](OA){};
  \draw (OA.+) -- ++(-0.3,0) coordinate(PP);
  \draw (PP) to[V,l_=$V_{off}$] ++(0,-1.6) node[ground]{};
  \draw (OA.-) -- ++(-0.9,0) coordinate(X) node[circ]{};
  \draw (X) to[C,l_=$C_1$] ++(-1.8,0) coordinate(L) node[circ]{};
  \draw (L) to[nos,l_=$\phi_1$] ++(-2,0) node[ocirc]{} node[left]{$v_{in}$};
  \draw (L) to[nos,l=$\phi_2$] ++(0,-1.6) node[ground]{};
  \draw (X) -- ++(0,1.4) coordinate(F) to[C,l_=$C_2$] ++(1.8,0) coordinate(M) node[circ]{};
  \draw (M) to[nos,l_=$\phi_1$] (M -| OA.out);
  \draw (M) to[nos,l_=$\phi_2$] ++(0,1.2) node[ground,rotate=180]{};
  \draw (X) -- ++(0,3.4) coordinate(F2) to[nos,l=$\phi_2$] (F2 -| OA.out) -- (OA.out);
  \draw (OA.out) -- ++(0.6,0) node[ocirc]{} node[right]{$v_{out}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{v_{out}(n) = V_{off}+\left(-V_{off}-\frac{C_1}{C_2}v_{in}(n)\right) = -\frac{C_1}{C_2}v_{in}(n)}
$$

Store the op amp's error on capacitors during a reset phase, subtract it during the output phase. That is **correlated double sampling (CDS)**:
- Cancels **offset** and, because the cancellation is a high-pass from op-amp input to output, suppresses **1/f noise**, without changing the overall circuit's dc gain.
- With CDS, design the op amp for **thermal** noise, not 1/f (e.g. NMOS input devices may now be the better choice).
- **Resettable gain circuit:** the output returns to $V_{off}$ every $\phi_2$, so the op amp slews the full output each period.
- **Capacitive-reset gain circuit** (Carusone Fig. 14.34): a third capacitor holds the previous output during reset, so the output only moves by about $V_{off}$; for slow inputs the finite-gain error falls to $\propto 1/A^2$, which lets fast single-stage op amps be used. Add a small **deglitching capacitor** (about 0.5 pF or less) wherever a circuit has no feedback during the non-overlap gap.
- The parallel-RC-style SC gain stage ($-K$, Carusone Fig. 14.30) has a continuous output and no slew problem, but amplifies offset and 1/f noise by $K$.
- CDS versions of the amplifier and integrator (Carusone Figs. 14.37–14.38) put a capacitor holding the op-amp input error in series with the input during the output phase, cutting the errors by about a factor $A$. Used in the first integrator of oversampling ADCs.

> [!note]- Derivation: offset cancellation step by step (Carusone Eqs. 14.99–14.102)
> Define each capacitor voltage as (outer plate) minus (node $X$).
> $\phi_2$: the op amp is in unity gain, so $X = V_{off}$; the outer plates of $C_1$ and $C_2$ are grounded, so $V_{C1} = V_{C2} = -V_{off}$.
> $\phi_1$: $X$ is still $V_{off}$ and $C_1$'s outer plate is $v_{in}$: $V_{C1} = v_{in}-V_{off}$, so $\Delta Q_{C1} = C_1[(v_{in}-V_{off})-(-V_{off})] = C_1v_{in}$. The offset has dropped out of the charge. That same charge flows through $C_2$: $V_{C2}(n) = -V_{off}-\frac{C_1}{C_2}v_{in}(n)$, and $v_{out} = V_{off}+V_{C2}(n)$.

> [!tip] Remark
> Replacing $C_1$ by a binary-weighted, digitally switched capacitor array gives a programmable-gain amplifier.

### Switched-Capacitor Common-Mode Feedback

```tikz title="SC CMFB. Reset: S4, S5 put V_CM on the outer plates and S1 ties node G to diode M6, so each capacitor stores V_CM - V_GS6. Amplify: S2, S3 connect the outputs; G then sits at the output CM minus that stored voltage and drives tail M5. After Razavi Fig. 13.62."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[ocirc]{} node[left]{$V_{out1}$} to[nos,l=$S_2$] (1.8,3) coordinate(A) node[circ]{};
  \draw (A) to[C,l=$C_1$] (3.6,3) coordinate(G) node[circ]{} to[C,l=$C_2$] (5.4,3) coordinate(B) node[circ]{};
  \draw (B) to[nos,l=$S_3$] (7.2,3) node[ocirc]{} node[right]{$V_{out2}$};
  \draw (A) to[nos,l_=$S_4$] (1.8,1.7) node[below]{$V_{CM}$};
  \draw (B) to[nos,l=$S_5$] (5.4,1.7) node[below]{$V_{CM}$};
  \node[above right,font=\scriptsize] at (G) {$G$};
  \node[nmos,xscale=-1] (M5) at (2.2,-0.5) {};
  \node[font=\scriptsize,anchor=east] at ($(M5.S)+(-0.1,0.3)$) {$M_5$};
  \draw (G) -- (3.6,0.8) coordinate(GG) |- (M5.G);
  \draw (M5.S) node[ground]{};
  \draw (M5.D) -- ++(0,0.3) node[above,font=\scriptsize]{to diff-pair tail};
  \draw (GG) to[nos,l=$S_1$] (5.6,0.8) coordinate(K);
  \node[nmos] (M6) at (7.2,-0.5) {};
  \node[font=\scriptsize,anchor=west] at ($(M6.S)+(0.1,0.3)$) {$M_6$};
  \draw (K) |- (M6.G);
  \draw (K) -- (M6.D |- K) -- (M6.D);
  \draw (M6.S) node[ground]{};
  \draw (M6.D |- K) ++(0,0) -- ++(0,0.2) coordinate(T);
  \draw (T) ++(0,1.2) node[above,font=\scriptsize]{$V_{DD}$} to[I,l=$I_{REF}$] (T);
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out,CM} = V_{CM}-V_{GS6}+V_{GS5} = V_{CM}\quad(\text{if } I_{D5}/I_{REF} \text{ is copied so } V_{GS5} = V_{GS6})}
$$

Capacitors sense the output CM without loading the differential gain (resistors would) and without the limited linear range of source-follower or triode sensing. The price: the stored voltage must be **refreshed** every reset phase.
- Simplest version (Razavi Fig. 13.60): $C_1$, $C_2$ from the outputs to the tail gate, their voltage set during reset by a sense pair $M_6$, $M_7$ whose nonlinearity no longer matters once $S_1$ opens.
- With large output swings the CMFB loop's speed can affect differential settling: supply part of the tail current from a fixed source so $M_5$ makes only small corrections.

> [!tip] Remark
> Why a fully differential op amp needs CMFB, and the continuous-time sensing alternatives this replaces, are in [[Operational Amplifiers#Why CMFB Is Needed]] and [[Operational Amplifiers#Sensing the CM Level]].

### Other SC Circuits

$$
\boxed{\text{Relaxation oscillator: } f_{osc} = \frac14\frac{k_2}{k_1}f_s,\qquad \text{VCO: } f_{osc} = \frac14\left(\frac{k_2}{k_1}+\frac{k_{in}V_{in}}{k_1V_{DD}}\right)f_s}
$$

(for $k_1 \gg k_2$ and $V_{DD} = V_{SS}$)

| Circuit | How |
|---|---|
| Square-wave **modulator** | Capacitive-reset gain stage whose input clock phases swap with the carrier: output $\pm(C_1/C_2)v_{in}$. Images at odd carrier harmonics. |
| Full-wave **rectifier** | The same modulator with a comparator on $v_{in}$ choosing the sign. |
| **Peak detector** | Latched comparator closes a switch onto $C_H$ when $v_{in} > v_{out}$ (fast), or an op amp drives a switch in feedback (high input impedance, slower). |
| **Relaxation VCO** | SC integrator ($k_2C$ into $C$) ramps $v_x$ in steps; a comparator flips the output, which kicks $v_x$ by $k_1(V_{DD}+V_{SS})$ through unswitched $k_1C$. |
| **Sinusoidal oscillator** | High-Q SC bandpass plus a hard limiter (comparator switching $\pm V_{ref}$), with a start-up loop. |

> [!note]- Derivation: relaxation oscillator period (Carusone Eqs. 14.107–14.113)
> With $v_{out} = -V_{SS}$, $k_2C$ and $C$ form a noninverting SC integrator: each period $v_x$ steps by $-k_2V_{SS}$ until it crosses 0; then $v_{out}$ jumps to $V_{DD}$ and $k_1C$ dumps $k_1C(V_{DD}+V_{SS})$, moving $v_x$ by $-k_1(V_{DD}+V_{SS})$. Counting steps per half period ($k_1\gg k_2$):
> $$\frac{T_{osc}}{T} = \frac{k_1(V_{DD}+V_{SS})}{k_2V_{SS}}+\frac{k_1(V_{DD}+V_{SS})}{k_2V_{DD}} \xrightarrow{V_{DD}=V_{SS}} 4\frac{k_1}{k_2}$$
> An extra input branch $k_{in}C$ adds or subtracts charge per period, moving the zero crossing earlier or later: the VCO.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ Sampling $C$ | $kT/C$ noise, relative charge-injection error | Settling ($R_{on}C$, op-amp load), power, area |
| ↑ Switch $W$ | $R_{on}$, sampling speed | Charge injection, feedthrough, junction cap; $F = \mu_n/L^2$ fixed |
| Shorter $L$ (newer process) | Speed–precision product $\propto 1/L^2$ | Lower intrinsic gain, lower supply ([[MosFETs]]) |
| CMOS transmission gate | Rail-to-rail swing, flatter $R_{on}$ | Complementary clocks that must turn off together; cancellation of injection only at one level |
| ↑ Nominal gain $C_1/C_2$ | Gain per stage | ↓ $\beta$: gain error $1/(\beta A)$ and $\tau$ both grow |
| Flip-around ($\times1$, $\times2$) instead of noninverting | Higher $\beta$, faster, more accurate | Larger input capacitance during sampling |
| ↑ Op-amp input pair $W$ | $A$ | $C_{in}$, which lowers $\beta$; optimum is minimum gain error, not maximum $A$ |
| ↑ $f_s$ | Wider bandwidth, smaller SC "resistors" | Needs $f_u \ge 5f_s$, more slewing; charge-injection bound $f_{clk}<\mu_n\Delta V/(5L^2)$ |
| ↑ $f_s/f_0$ in filters | Easier anti-aliasing, closer to the RC prototype | Capacitance spread $\approx Q/(\omega_0T)$ |
| Parasitic-insensitive branches | Coefficients set only by $C_1/C_2$, linear | Four switches per capacitor |
| Fully differential | Free sign inversion, even-order and CM rejection, half-size $C$ for same DR | CMFB, more switches and wiring |
| CDS / offset-storing reset | Offset, 1/f noise, finite-gain error | Extra capacitors and phases, slewing (resettable type) |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Resistive feedback with $R_{out}$ | $\frac{V_{out}}{V_{in}} = -\frac{R_2}{R_1}\frac{A_v-R_{out}/R_2}{1+R_{out}/R_1+A_v+R_2/R_1}$ |
| Charge-transfer gain | $V_{out} = (C_1/C_2)V_{in0}$ |
| Spec → op-amp gain | $A_0\ge1/(\beta\varepsilon_{gain})$ (binary: $2^{N+1}/\beta$) |
| Spec → op-amp bandwidth | $\omega_u\ge\ln(1/\varepsilon)/(\beta t_{lin})$, $t_{slew}+t_{lin}\le t_s$, PM $\gtrsim70^\circ$, $f_u\ge5f_s$ |
| SC resistor | $R_{eq} = 1/(C_Sf_s)$ |
| $z$ | $z = e^{sT}$; $x(n-k)\leftrightarrow z^{-k}X(z)$; stable iff $\lvert z_p\rvert<1$ |
| Bilinear | $s = \frac{z-1}{z+1}$, $\Omega = \tan(\omega/2)$ |
| Parasitic-sensitive integrator | $H = -\frac{C_1}{C_2}\frac{1}{z-1}$; with parasitic $-\frac{C_1+C_{p1}}{C_2}\frac1{z-1}$ |
| Low-frequency integrator | $H\approx-\frac{C_1}{C_2}\frac{1}{j\omega T}$ |
| Delayed integrator | $H = +\frac{C_1}{C_2}\frac{1}{z-1}$ |
| Delay-free integrator | $H = -\frac{C_1}{C_2}\frac{z}{z-1}$ |
| SFG branches | unswitched $-C(1-z^{-1})$, delayed $+Cz^{-1}$, delay-free $-C$; op amp $\frac{1}{C_A(1-z^{-1})}$ |
| First-order filter | $H = -\frac{\frac{C_1+C_2}{C_A}z-\frac{C_1}{C_A}}{(1+\frac{C_3}{C_A})z-1}$, $z_p = \frac{C_A}{C_A+C_3}$, $z_z = \frac{C_1}{C_1+C_2}$, $H(1) = -\frac{C_2}{C_3}$ |
| First-order approx. | $\omega_pT\approx\frac{C_3/C_A}{1+C_3/(2C_A)}$, $\omega_zT\approx\frac{C_2/C_1}{1+C_2/(2C_1)}$ |
| Low-Q biquad | $H = -\frac{(K_2+K_3)z^2+(K_1K_5-K_2-2K_3)z+K_3}{(1+K_6)z^2+(K_4K_5-K_6-2)z+1}$ |
| Biquad ratios | $K_4\approx K_5\approx\omega_0T$, $K_6\approx\omega_0T/Q$, spread $\approx Q/(\omega_0T)$ |
| Switch on-resistance | $R_{on} = 1/[\mu_nC_{ox}\frac WL(V_{DD}-V_{in}-V_{TH})]$ |
| Swing for 4:1 $R_{on}$ | $V_{in,max} = \frac34(V_{DD}-V_{TH})$ |
| Channel charge | $Q_{ch} = WLC_{ox}(V_{DD}-V_{in}-V_{TH})$, $\Delta V = \alpha Q_{ch}/C_H$ |
| Clock feedthrough | $\Delta V = V_{CK}\frac{WC_{ov}}{WC_{ov}+C_H}$ |
| Speed–precision | $F = 1/(\tau\Delta V) = \mu_n/L^2$; $f_{clk}<\mu_n\Delta V_{max}/(5L^2)$ |
| Sampled noise | $kT/C$ per sample; SC branch $2kT/C$ input-referred |
| Unity-gain sampler | gain error $\frac1A(1+\frac{C_{in}}{C_H})$; $\tau_{sam} = (R_{on1}+\frac1{G_m})C_H$; $\tau_{amp} = \frac{C_LC_{in}+C_{in}C_H+C_HC_L}{G_mC_H}$ |
| Noninverting amplifier | $\beta = \frac{C_2}{C_1+C_2+C_{in}}$, gain $\frac{C_1}{C_2}(1-\frac1{\beta A})$, $\tau = \frac{C_L+C_2(C_1+C_{in})/(C_1+C_2+C_{in})}{\beta G_m}$ |
| Multiply-by-two | $V_{out} = (1+C_2/C_1)V_{in0} = 2V_{in0}$, $\beta\approx\frac12$ |
| Resettable gain | $v_{out} = -\frac{C_1}{C_2}v_{in}$, independent of $V_{off}$ |
| SC CMFB | $V_{out,CM} = V_{CM}-V_{GS6}+V_{GS5}$ |
| Relaxation oscillator | $f_{osc} = \frac14\frac{k_2}{k_1}f_s$; VCO adds $\frac{k_{in}V_{in}}{4k_1V_{DD}}f_s$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 13 Introduction to Switched-Capacitor Circuits, pp. 539–572:
  - §13.1 General Considerations, pp. 539–543: resistive vs capacitive feedback, $R_F$ high-pass, charge transfer (Figs. 13.1–13.8, Eqs. 13.1–13.6, Ex. 13.1).
  - §13.2.1–13.2.2 MOSFETs as Switches, Speed, pp. 543–549: sampler transients, $R_{on}$ vs input, complementary switch (Figs. 13.9–13.19, Eqs. 13.7–13.24, Ex. 13.2–13.3).
  - §13.2.3 Precision, pp. 549–553: charge injection, body-effect nonlinearity, $F = \mu_n/L^2$, clock feedthrough, $kT/C$ (Eqs. 13.25–13.35).
  - §13.2.4 Charge Injection Cancellation, pp. 553–555: dummy, complementary, differential (Eqs. 13.36–13.39).
  - §13.3 SC Amplifiers, pp. 555–568: capacitor parasitics, unity-gain sampler (clock ordering, gain error, $\tau_{sam}$, $\tau_{amp}$, slewing, bottom-plate sampling), noninverting amplifier, multiply-by-two (Figs. 13.29–13.54, Eqs. 13.40–13.59, Ex. 13.4–13.6).
  - §13.4 SC Integrator, pp. 568–571: SC resistor, integrator, junction nonlinearity, parasitic-insensitive integrator (Eqs. 13.60–13.64).
  - §13.5 SC Common-Mode Feedback, pp. 571–572 (Figs. 13.60–13.62).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24):
  - Ch. 13 Discrete-Time Signals, pp. 537–554: §13.1 spectra, §13.2 Laplace of sampled signals, §13.3 $z$-transform, §13.4 down/upsampling, §13.5 discrete-time filters (frequency response, stability, IIR/FIR, bilinear transform; Ex. 13.4–13.7), §13.6 sample-and-hold response (Ex. 13.8).
  - Ch. 14 Switched-Capacitor Circuits, pp. 557–600: §14.1 building blocks (op amps, capacitors, switches, non-overlapping clocks), §14.2 resistor equivalence, parasitic-sensitive and -insensitive integrators, SFG analysis (Eqs. 14.1–14.31, Ex. 14.1–14.2), §14.3 noise (Eqs. 14.32–14.35), §14.4 first-order filters, switch sharing, fully differential (Eqs. 14.36–14.48, Ex. 14.3–14.4), §14.5 low-Q and high-Q biquads (Eqs. 14.49–14.85, Ex. 14.5), §14.6 charge injection (Eqs. 14.86–14.97, Ex. 14.6–14.7), §14.7 SC gain circuits (parallel RC, resettable, capacitive-reset; Eqs. 14.98–14.102), §14.8 correlated double sampling, §14.9 modulator, rectifier, peak detector, VCO, sinusoidal oscillator (Eqs. 14.104–14.114). Problem 14.6 (finite-gain integrator), 14.16 (resonator). Table 1.5 for the process numbers behind Ex. 14.7.
- **Zettelkasten extensions** (`AnalogTheory/S11 Switched-Capacitor Circuits.md` and `Switched-Capacitor Circuits/`): 11j1 and 11k1 (clock ordering stated as a rule; driven vs floating nodes), 11k3–11k4 (the $\beta = \frac12$ vs $\frac13$ comparison for gain 2), 11d2 (speed–precision depends only on $L$), 11c3 (speed only with an accuracy band).
