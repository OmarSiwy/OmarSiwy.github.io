---
title: Delta-Sigma ADCs
description: Oversampling and noise shaping from the linear NTF/STF model to first-, second- and higher-order DT and CT modulators, their nonidealities, MASH, multibit quantizers with DWA, and CIC decimation, with the ΔΣ spec carried down to the first integrator's capacitor and op amp.
kind: topic
status: growing
aliases:
  - Delta-Sigma ADCs
  - Delta-Sigma ADC
  - Sigma-Delta ADC
  - Oversampling ADCs
  - ΔΣ Modulators
---

A $\Delta\Sigma$ ADC buys resolution with clock rate instead of component matching: a coarse (often 1-bit) quantizer runs $M$ times faster than Nyquist inside a feedback loop that pushes its own error out of the signal band, and a digital filter then throws that band away. The note opens with the black box and the one equation everything rests on (NTF and STF), then builds first-order, second-order and higher-order loops, discrete-time (DT) and continuous-time (CT), then the nonidealities that limit them, then the advanced tricks (MASH, multibit with DWA, feedforward), and ends with the decimation filter. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="A Delta-Sigma ADC: a feedback loop around a coarse quantizer, clocked at f_S = 2 M f_B, followed by a digital decimation filter that removes the out-of-band quantization noise and drops the rate to 2 f_B. After Carusone Fig. 18.14 and Razavi (Data Converters) Figs. 21.15, 24.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.6cm,minimum height=1.0cm,align=center,fill=gray!8}}
  \node[blk] (aaf) at (0,0) {anti-alias\\ filter};
  \draw[thick] (2.3,0) circle (0.25);
  \node[font=\scriptsize] at (2.15,0.42) {$+$};
  \node[font=\scriptsize] at (2.05,-0.45) {$-$};
  \node[blk] (H) at (4.2,0) {loop filter\\ $H(z)$ or $H(s)$};
  \node[blk] (Q) at (6.9,0) {quantizer\\ $B$ bits};
  \node[blk] (dac) at (5.55,-1.8) {DAC};
  \node[blk,minimum width=2.2cm] (dec) at (11.3,0) {decimation\\ filter, $\downarrow M$};
  \draw[->] (-1.6,0) node[left] {$x(t)$} -- (aaf);
  \draw[->] (aaf) -- (2.05,0);
  \draw[->] (2.55,0) -- (H);
  \draw[->] (H) -- (Q);
  \draw[->] (Q) -- node[pos=0.75,above,font=\scriptsize] {$y[n]$, $f_S$} (dec);
  \draw[->] (8.45,0) -- (8.45,-1.8) -- (dac);
  \draw[->] (dac) -- (2.3,-1.8) -- (2.3,-0.25);
  \draw[->] (dec) -- (13.8,0) node[right] {$D_{out}$};
  \node[font=\scriptsize] at (13.2,-0.35) {$2f_B$};
  \draw[->] (6.9,1.25) node[above,font=\scriptsize] {$f_S = 2Mf_B$} -- (Q);
  \draw[dashed] (1.6,-2.5) rectangle (8.7,1.0);
  \node[font=\scriptsize,anchor=west] at (1.6,-2.8) {$\Delta\Sigma$ modulator (analog loop, digital output)};
  \node[font=\scriptsize,align=center] at (11.3,-1.4) {digital: removes\\ shaped Q-noise};
\end{circuitikz}
\end{document}
```

```tikz title="The noise transfer function |NTF| = |2 sin(pi f/f_S)|^L for L = 0, 1, 2. Raising the order pushes more noise out of the band 0 to f_B and piles more of it near f_S/2. After Carusone Fig. 18.11 and Razavi Fig. 21.40(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (0,0) rectangle (0.8,3.6);
  \draw[->] (0,0) -- (10.8,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,3.9) node[above] {$|NTF|$};
  \draw[thick,dotted] (0,0.8) -- (10,0.8) node[right,font=\scriptsize] {$L=0$ (no shaping)};
  \draw[thick,domain=0:0.5,samples=60] plot ({20*\x},{0.8*2*sin(180*\x)}) node[right,font=\scriptsize] {$L=1$};
  \draw[thick,dashed,domain=0:0.5,samples=60] plot ({20*\x},{0.8*4*sin(180*\x)*sin(180*\x)}) node[right,font=\scriptsize] {$L=2$};
  \node[below] at (0.8,0) {$f_B$};
  \node[below] at (10,0) {$f_S/2$};
  \node[below] at (3.33,0) {$f_S/6$};
  \draw[dotted] (3.33,0) -- (3.33,0.8);
  \node[left] at (0,0.8) {$1$};
  \node[left] at (0,1.6) {$2$};
  \node[left] at (0,3.2) {$4$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.9,2.6) {signal band:\\ noise suppressed};
  \node[font=\scriptsize,align=left,anchor=west] at (5.2,0.4) {out of band: removed\\ by the decimation filter};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Linear model:** the quantizer adds noise $Q$; the loop gives $Y = \mathrm{STF}\cdot X + \mathrm{NTF}\cdot Q$ with $\mathrm{NTF} = \frac{1}{1+H}$. The poles of the loop filter $H$ become the **zeros** of the NTF.
> 2. **Order $L$ and OSR $M$:** $\mathrm{NTF} = (1-z^{-1})^L$ leaves in-band Q-noise $\propto 1/M^{2L+1}$: every doubling of $M$ buys $6L+3$ dB. First order: $\pi^2\Delta^2/(36M^3)$; second order: $\pi^4\Delta^2/(60M^5)$.
> 3. **Circuit noise is not shaped, only averaged:** $kT/C$ and op-amp noise of the **first integrator** reach the output divided by $M$; everything after it is divided by the gain in front of it. The first integrator sets the noise, the power and the area.
> 4. **The loop forgives a lot:** capacitor mismatch, op-amp gain $A_0\gtrsim2M$, linear incomplete settling, comparator offset and noise. It does **not** forgive nonlinearity (slewing, multibit DAC mismatch) because that folds the large out-of-band noise back into the band, nor (in CT loops) clock jitter and excess loop delay.
> 5. **Stability:** 1- and 2-loop orders are robust; a single loop of order $\ge3$ with a 1-bit quantizer needs $\max|\mathrm{NTF}|\lesssim1.5$ and simulation. Higher order is reached safely by MASH cascades, multibit quantizers, and feedforward loop filters.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 Oversampling and Noise Shaping|oversampling, NTF/STF, metrics]] → [[#Level 1 The First-Order Modulator|first-order DT loop and its circuit]] → [[#Level 2 Second- and Higher-Order Loops|second order, order L, CIFB/CIFF, stability]] → [[#Level 3 Continuous-Time Modulators|CT loops]] → [[#Level 4 Discrete-Time Nonidealities|DT nonidealities]] → [[#Level 5 Continuous-Time Nonidealities|CT nonidealities]] → [[#Level 6 Advanced Architectures|MASH, multibit, DWA]] → [[#Level 7 Decimation|decimation]].

> [!tip] Remark
> The vocabulary (LSB $\Delta$, $\Delta^2/12$, SQNR $=6.02N+1.76$ dB, SNDR, DR, the oversampling ratio $M = f_S/(2f_B)$ and the Schreier FoM used for $\Delta\Sigma$ converters) is defined once in [[Data Converter Fundamentals]]; see [[Data Converter Fundamentals#Nyquist-Rate vs Oversampling Converters]]. Razavi writes $f_{CK}$ and $f_0$ for what this note calls $f_S$ and $f_B$.

## Spec translation

A $\Delta\Sigma$ ADC has one amplifier that matters: the op amp of the **first integrator**. The spec reaches it in three hops: **ADC spec → loop architecture $(L, M, B)$ → noise budget → first-integrator $C_S$ and op-amp specs → $g_m/I_D$, $I_D$, $L$.** This specialises the template of [[Data Converter Fundamentals#Spec translation]].

```tikz title="Spec translation for a Delta-Sigma ADC. The architecture choice fixes the quantization noise; the rest of the noise budget fixes the first integrator's sampling capacitor, which is the load the op amp must settle."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,align=center,fill=gray!8,font=\scriptsize,minimum height=1.0cm}}
  \node[blk,minimum width=2.4cm] (spec) at (0,0) {ADC spec\\ SNR/DR, $f_B$\\ full scale, $P$};
  \node[blk,minimum width=2.6cm] (arch) at (3.6,0) {architecture\\ order $L$, OSR $M$\\ quantizer $B$ bits};
  \node[blk,minimum width=2.8cm] (nb) at (7.4,0) {noise budget\\ $P_Q + \frac{P_{kT/C}+P_{op}}{M} + P_j$\\ $\le P_{sig}/\mathrm{SNR}$};
  \draw[->] (spec) -- (arch);
  \draw[->] (arch) -- (nb);
  \foreach \y/\t in {1.6/{$C_S$ from $kT/(MC_S)$},0.8/{op-amp noise $\sim kT/C_S$},0.0/{$A_0\gtrsim2M$ (leakage)},-0.8/{GBW, SR: settle in $T_S/2$},-1.6/{swing after scaling}} { \node[font=\scriptsize,anchor=west] (n) at (9.6,\y) {\t}; \draw[->] (nb.east) -- (n.west); }
  \draw[decorate,decoration={brace,amplitude=4pt}] (13.3,1.8) -- (13.3,-1.8);
  \node[font=\scriptsize,align=left,anchor=west] at (13.5,0) {$g_m/I_D$,\\ $I_D$, $L$};
  \node[font=\scriptsize] at (3.6,-0.95) {$f_S = 2Mf_B$};
\end{circuitikz}
\end{document}
```

**ADC specs** (Razavi DC §21.8, Carusone §18.2): peak SNR (or SNDR) and dynamic range DR, signal bandwidth $f_B$, full scale (set by the DAC reference $V_{REF}$), maximum stable input amplitude, power. DNL and INL are **not** specs here ([[#Metrics DR, Peak SNR and SNDR|why]]).

**Step 1: architecture.** Pick order $L$, OSR $M$ and quantizer resolution $B$ from the shaped-noise formula, leaving room for thermal noise and for the input back-off a high-order 1-bit loop needs:

$$
\boxed{\mathrm{SQNR}_{max} = 6.02B + 1.76 - 10\log\frac{\pi^{2L}}{2L+1} + (20L+10)\log M\ \ \text{dB}}
$$

$-10\log\frac{\pi^{2L}}{2L+1}$ is $-5.2$ dB for $L=1$ and $-12.9$ dB for $L=2$ (Carusone Eqs. 18.26, 18.32). Then $f_S = 2Mf_B$.

> [!warning] 1-bit quantizers: the two books differ by 6 dB
> Razavi takes $\Delta$ for a 1-bit quantizer as its full output height ($\Delta = 2V_{REF}$, after Ardalan and Paulos) with a full-scale input $V_{REF}\sin\omega t$, which gives $\mathrm{SNR} = 9M^3/(2\pi^2)$ and $15M^5/(2\pi^4)$ (Eqs. 22.10, 22.13). That is the formula above with $B = 0$. Carusone's $6.02N$ form with $N = 1$ is 6 dB more optimistic. Use Razavi's (the conservative one) for 1-bit loops.

**Step 2: noise budget.** All noise is referred to the modulator input and adds in power:

$$
\boxed{P_Q + \frac{P_{kT/C} + P_{op}}{M} + P_{jitter} \le \frac{P_{sig}}{\mathrm{SNR}}}
$$

$P_Q$ is shaped; $kT/C$ and op-amp noise are only averaged (÷$M$); only the first integrator's contributions count (later ones are divided by the gain ahead, [[#Errors Are Divided by the Gain in Front of Them]]).

**Step 3: block specs.**

| $\Delta\Sigma$ spec / budget item | Block | Amplifier or device spec it sets | Derivation |
|---|---|---|---|
| $kT/C$ share $P_{kT/C}$ (DT) | First-integrator sampling cap $C_S$ | $C_S \ge 4kT/(M P_{kT/C})$ (differential); $C_S$ is the op-amp load | [[#kT/C Noise Is Divided by M]] |
| Same share (CT) | Input resistor $R_1$, feedback DAC | $R_1\le P/(8kTf_B)$ (diff.); DAC noise ratio $\gamma V_{REF}/V_{OV}$: high $V_{OV}$ on DAC sources | [[#The DAC Out-Noises the Input Resistor]] |
| Op-amp noise share | First-integrator op amp | **Input-referred noise** $\overline{V_n^2}\,G_m/(4C_S)\cdot\frac1M \le P_{op}$: high $g_m/I_D$ input pair | [[#Op-Amp Noise Is Averaged, Its Power Is Not]] |
| NTF zero depth (leakage) | First integrator | **DC gain** $A_0 > \frac{\sqrt{30}}{\pi}\frac{C_S}{C_I}M - 1$ (Razavi), $A_0\ge2M$ (Carusone); MASH: higher | [[#Finite Op-Amp Gain Makes the Integrator Leak]] |
| Noise folding, SNDR | Every integrator in the loop | **Linearity**: $A_0$ high enough for closed-loop linearity; **no slewing** in the sampled window | [[#Noise Folding]], [[#Settling Linear Is Free, Slewing Is Not]] |
| DT settling in $\approx T_S/2$ | First-integrator op amp | **GBW**: $\beta\omega_u \ge (5\ldots7)/t_{lin}$ (a few % gain error is fine); **slew rate** for the largest step | [[#Settling Linear Is Free, Slewing Is Not]] |
| CT integration | First-integrator op amp | **Slew rate** $> V_p/(R_1C_1) + I_0/C_1$; drives $R_2$ of the next integrator | [[#Slewing Cannot Be Hidden]] |
| Integrator swing | Every integrator | **Output swing** after capacitor scaling ($\pm0.7V_{REF}$, $\pm0.6V_{REF}$ for Boser-Wooley 2nd order) | [[#Scaling the Second-Order Loop]] |
| Comparator | Quantizer | Offset and noise shaped like $Q$: loose. **Speed** (decide in $<T_S/2$; CT: delay small vs $T_S$) | [[#Comparator Offset and Noise Are Shaped]] |
| Clock jitter | Clock | DT: $\sigma_j^2A^2\omega^2/(2M)$, loose. CT (NRZ DAC): $\sigma_j\le T_S\sqrt{MP_j}/V_{REF}$, very tight | [[#Clock Jitter Corrupts the DAC Charge]] |
| Multibit DAC linearity | DAC unit elements | Mismatch referred straight to the input: ~$2^{-N}$ of full scale, or DEM/DWA | [[#The Multibit DAC Must Be as Linear as the ADC]] |

$$
\boxed{C_S \ge \frac{4kT}{M\,P_{kT/C}}}\qquad\boxed{A_0 > \frac{\sqrt{30}}{\pi}\frac{C_S}{C_I}M - 1\ \ (\approx1.7M\text{ for }C_S=C_I)}\qquad\boxed{\text{CT: } SR > \frac{V_p}{R_1C_1}+\frac{I_0}{C_1}}\qquad\boxed{\text{CT jitter: } \frac{1}{M}\left(\frac{V_{REF}\sigma_j}{T_S}\right)^2 \le P_j}
$$

> [!note]- Derivation: where each inequality comes from
> **$kT/C$.** Each DT integrator samples $kT/C_S$ and its virtual-ground switch adds another $kT/C_S$: $2kT/C_S$ input-referred per side, $4kT/C_S$ differential (Razavi §23.1.2 and its footnote). Averaging $M$ uncorrelated samples divides the power by $M$.
>
> **Op-amp noise.** In the integration phase the integrator is an MDAC-like amplifier sensing the op-amp noise; integrated over its noise bandwidth $G_m/(4C_S)$ it is $\overline{V_n^2}G_m/(4C_S)$ at the input (Razavi Eq. 18.57), then ÷$M$. With $\overline{V_n^2}\approx 8kT\gamma/G_m$ for the input pair alone ([[Noise#Differential Pair]]) this is $2\gamma kT/C_S$: the same order as $kT/C$, so the op amp's input pair must be designed with the capacitor, not after it.
>
> **Leakage.** A finite gain moves the NTF zero from dc to $\omega_z = 1/[(1+A_0)R_1C_1]$; keeping the in-band leakage term below 10% of the shaped term gives Razavi Eq. 23.24 ([[#Finite Op-Amp Gain Makes the Integrator Leak]]). Carusone's version (NTF flat below $1/A$ rad/sample must stay below $f_B$) gives $A > M/\pi$ and recommends $2M$ (Eq. 18.54).
>
> **Settling.** In a linear loop incomplete settling is only a gain error, and the loop tolerates a few percent of integrator gain error. So $e^{-t/\tau}$ need only reach ~0.7% (5 $\tau$), not ½ LSB (Razavi §23.1.6). Slewing is nonlinear and must end before the comparator samples.
>
> **CT slew.** The integrator output must follow the integral of a sine of amplitude $V_p$ (slope up to $V_p/(R_1C_1)$) plus the DAC step ($I_0/C_1$) at the same time (Razavi §23.4.1).
>
> **CT jitter.** A DAC pulse of current $I_0$ that is $\Delta t_j$ too long delivers $I_0\Delta t_j$ extra charge, an input-referred error $V_{REF}\Delta t_j/T_S$ per sample, white to $f_S/2$, ÷$M$ by the decimator (Razavi Eqs. 23.40–23.42).

> [!warning] Razavi Eq. 23.13 vs Eq. 18.57
> Razavi DC prints the integrator's input-referred op-amp noise as $\overline{V_n^2}\,G_m/C_2$ (Eq. 23.13) while citing the Chapter 18 MDAC result, which is $\overline{V_n^2}\,G_m/(4C_1)$ (Eq. 18.57, noise bandwidth $G_m/(4C)$). This note uses the Chapter 18 form. Either way it is a first-cut estimate; simulate the real op amp.

**Where the op-amp specs land in sizing** (method: [[gm-ID Design Methodology#Level 3 OTAs Sized for Settling and Noise]]):

| Op-amp spec | Lands on | Sizing knob |
|---|---|---|
| $A_0\ge2M$ (plus linearity margin) | $g_mr_o$ | $L$; one stage often enough (e.g. 48 dB for $M=128$); cascode for linearity |
| Linear settling $\tau = C_{Ltot}/(\beta g_m)$ | $g_m$ of input pair | $I_D = g_m/(g_m/I_D)$ |
| Slew rate $I_{SS}/C_{Ltot}$ | tail current | $I_{SS}$ directly; often larger than the $g_m$ current |
| Noise $\approx2\gamma kT/C_S$ | input-pair $g_m$, load-device $g_m$ | high $g_m/I_D$ on the input pair, low on the loads |
| Swing | $V_{D,sat}\approx2/(g_m/I_D)$ of output devices | output-stack $g_m/I_D$, topology choice ([[Operational Amplifiers#Choosing a Topology]]) |
| Non-dominant poles above $\sim\omega_u$ | $f_T$ of cascode and mirror devices | short $L$, moderate $g_m/I_D$ |
| CT: drive $R_2$ with gain | output resistance | two-stage or low-impedance output |

> [!tip] Remark
> Spec names and definitions are those of [[Single-Stage#Amplifier Specifications]]. The settling equations are the SC ones of [[Switched-Capacitor Circuits#Spec translation]] with one change: a $\Delta\Sigma$ integrator settles to a few percent, not to ½ LSB, which is why the op amp can be fast and cheap.

> [!example] Worked example A: architecture from the sources
> - **Razavi Exs. 22.5, 22.8** (14 bits = 86 dB, $f_B = 5$ MHz, 1-bit): first order needs $M = 956$, $f_S = 9.56$ GHz (impractical); second order needs $M\approx88$, $f_S = 880$ MHz.
> - **Razavi Exs. 22.12, 22.13** (same spec, CT): first order with $R_1 = 1$ kΩ, $C_1 = 100$ fF needs $f_S = 8.73$ GHz; second order with $R_1C_1 = R_2C_2 = 1/f_S$ gives $R_1C_1 = 1.14$ ns, $f_S = 876$ MHz.
> - **Carusone Ex. 18.5** (16 bits = 96 dB, $f_B = 25$ kHz): no shaping needs $f_S\approx54{,}000$ GHz; first order 75 MHz; second order 5.8 MHz (before the input back-off a 2nd-order 1-bit loop needs).
> - **Razavi §23.1.4:** $M = 64$ needs only $A_0\approx110$ against leakage.
> - **Razavi §23.1.2:** an 18-bit audio converter with $kT/C\approx0.2$ LSB would need several hundred pF of sampling capacitance at Nyquist rate; oversampled, a few pF.

**Worked example B (numbers computed here from the formulas above).** 14 bits, SNR ≥ 86 dB, $f_B = 1$ MHz, DT second-order 1-bit loop, DAC levels $\pm V_{REF} = \pm1$ V differential, input amplitude $A = 0.5$ V differential ($-6$ dBFS, the back-off for stability), 300 K, $\gamma\approx1$.

1. **Budget.** $P_{sig} = A^2/2 = 0.125$ V², so $P_n\le0.125/10^{8.6} = 3.14\times10^{-10}$ V².
2. **Architecture.** $P_Q = \pi^4\Delta^2/(60M^5)$ with $\Delta = 2V_{REF} = 2$ V gives $6.49/M^5$. $M = 64$: $6.0\times10^{-9}$ V² (fails). $M = 128$: $1.89\times10^{-10}$ V² (SQNR 88.2 dB at $-6$ dBFS). So $f_S = 256$ MHz, $T_S = 3.9$ ns. Thermal allowance $3.14-1.89 = 1.25\times10^{-10}$ V².
3. **Capacitor.** Per-sample thermal $\approx 4kT/C_S + 2\gamma kT/C_S = 6kT/C_S$, then ÷$M$: $C_S\ge6kT/(128\times1.25\times10^{-10}) = $ **1.55 pF per side** ($kT/C$ takes $8.3\times10^{-11}$, the op amp $4.2\times10^{-11}$ V²). Integrator gains 0.5 (Razavi §22.2): $C_I = 3.1$ pF; first-integrator swing $\pm0.7$ V differential ($\pm0.35$ V per output).
4. **DC gain.** Razavi: $A_0>1.74\times0.5\times128-1 = 111$ (41 dB). Carusone: $A_0\ge2M = 256$ (**48 dB**). Closed-loop gain error $(1+C_S/C_I)/A_0 = 0.6\%$: tolerable.
5. **Speed.** Integration phase $t_s\approx T_S/2 = 1.95$ ns. $\beta = C_I/(C_I+C_S) = 0.67$ (op-amp $C_{in}$ neglected); with an assumed 0.3 pF next-stage load, $C_{Ltot} = 0.3 + (1-\beta)C_I = 1.33$ pF.
   - **Slew:** largest step per side $\frac12\cdot\frac{C_S}{C_I}(A+V_{REF}) = 0.375$ V; give it 0.5 ns: $SR\ge0.75$ V/ns, $I_{SS}\ge0.75\ \text{V/ns}\times1.33\ \text{pF} = $ **1.0 mA**.
   - **Linear:** remaining 1.45 ns $\ge5\tau$ (0.7% gain error): $\tau\le0.29$ ns, $g_m = C_{Ltot}/(\beta\tau) = $ **6.9 mS**, $f_u\approx820$ MHz.
6. **Bias.** $I_D = I_{SS}/2 = 0.5$ mA per input device gives $g_m/I_D\approx14$ S/A: moderate inversion, a fair noise-and-speed compromise. Here slewing, not small-signal bandwidth, set the current. (A 2–3-bit quantizer would shrink the DAC step and the slew current: [[#Multibit Quantizers Buy 6 dB per Bit]].)
7. **Jitter check.** DT: $\sigma_j = 5$ ps gives $A^2\omega^2\sigma_j^2/(2M) = 9.6\times10^{-13}$ V², under 1% of the budget. The same 10% budget share in a CT loop with an NRZ DAC would need $\sigma_j\le T_S\sqrt{M\cdot3.1\times10^{-11}}/V_{REF}\approx$ **0.25 ps**.

> [!example] Worked example C: CT jitter (Razavi Ex. 23.12)
> 14 bits, $f_B = 20$ MHz, $M = 64$ ($T_S = 390$ ps), at most a 1-dB SNR penalty: $\sigma_j\le$ **28 fs rms**. That is why wideband CT modulators use multibit or switched-capacitor feedback DACs.

## Level 0: Oversampling and Noise Shaping

### Quantization Noise Is a Spectrum

```tikz title="Quantization noise model: the quantizer is a unity-gain path plus an additive noise q, white from -f_S/2 to f_S/2 with total power Delta^2/12, so its density is Delta^2/(12 f_S). Raising f_S at a fixed band lowers the in-band part. After Razavi Figs. 21.10-21.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick] (0,0) rectangle (1.4,1.0) node[pos=.5] {quant.};
  \draw[->] (-0.9,0.5) node[left] {$x$} -- (0,0.5);
  \draw[->] (1.4,0.5) -- (2.2,0.5) node[right] {$y$};
  \node at (2.9,0.5) {$\equiv$};
  \draw[->] (3.4,0.5) node[left] {$x$} -- (4.55,0.5);
  \draw[thick] (4.8,0.5) circle (0.25);
  \draw[->] (4.8,1.5) node[above] {$q$} -- (4.8,0.75);
  \draw[->] (5.05,0.5) -- (6.0,0.5) node[right] {$y = x+q$};
  \begin{scope}[xshift=10.2cm,yshift=-0.4cm]
    \draw[->] (-2,0) -- (2.4,0) node[right] {$f$};
    \draw[->] (0,0) -- (0,2.1) node[above] {$S_Q$};
    \draw[thick] (-1.2,0) -- (-1.2,0.9) -- (1.2,0.9) -- (1.2,0);
    \draw[dashed] (-1.9,0) -- (-1.9,0.57) -- (1.9,0.57) -- (1.9,0);
    \fill[gray!35] (-0.35,0) rectangle (0.35,0.9);
    \node[font=\scriptsize] at (1.2,-0.3) {$\frac{f_S}{2}$};
    \node[font=\scriptsize] at (1.95,-0.3) {$\frac{f_S'}{2}$};
    \node[font=\scriptsize] at (0.35,-0.3) {$f_B$};
    \node[font=\scriptsize,anchor=west] at (0.1,1.2) {$\frac{\Delta^2}{12f_S}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{S_Q(f) = \frac{\Delta^2}{12f_S}\ \ (-f_S/2<f<f_S/2)}
$$

A quantizer driven by a sine produces only harmonics; sampling aliases them into a dense comb that we approximate as white noise. The model assumes $q$ is uncorrelated with the input, white, and of power $\Delta^2/12$ (Razavi §21.1).

> [!tip] Remark
> The derivation of $\Delta^2/12$ and when the white model fails (low resolution, periodic inputs) are in [[Data Converter Fundamentals#Quantization Noise Power]]. A 1-bit quantizer is the worst case for the model: see [[#The 1-Bit Quantizer Has No Δ and No Fixed Gain]].

### Oversampling Alone: 3 dB per Octave

$$
\boxed{P_{Q,in\text{-}band} = \frac{\Delta^2}{12}\cdot\frac{1}{M}\qquad\mathrm{SQNR} = 6.02N+1.76+10\log M}
$$

Doubling $f_S$ at a fixed band halves the in-band noise: 3 dB, half a bit, per octave (Carusone Eq. 18.14). The same averaging divides any white noise (thermal, $kT/C$) by $M$. Too slow on its own: 16 bits from a 1-bit quantizer at $f_B = 25$ kHz would need $f_S\approx54{,}000$ GHz (Carusone Ex. 18.3).

> [!note]- Why averaging helps: signal adds coherently, noise in power
> Average $M$ samples: the signal adds linearly ($M$ times the amplitude, $M^2$ times the power), the uncorrelated noise adds in power ($M$ times). Net SNR gain $M$ (Carusone Ex. 18.2: 8 samples, 0 dB to about 9 dB). Oversampling does **not** improve linearity: a 12-bit quantizer oversampled to 16 bits of SNR still needs 16-bit-accurate levels, which is why 1-bit (two-level, inherently linear) DACs are attractive (Carusone §18.1.4).

### Feedback Shapes the Noise: NTF and STF

```tikz title="Linear model of a Delta-Sigma loop: the quantizer is replaced by an added noise Q. Noise injected near the output of a feedback loop sees 1/(1+H); the input sees H/(1+H). With H an integrator, the signal is low-passed and the noise high-passed. After Razavi Figs. 21.13, 21.15 and Carusone Fig. 18.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) node[left] {$X$} -- (0.75,0);
  \draw[thick] (1,0) circle (0.25);
  \node[font=\scriptsize] at (0.75,-0.4) {$-$};
  \draw[->] (1.25,0) -- (2.0,0);
  \draw[thick] (2.0,-0.5) rectangle (3.4,0.5) node[pos=.5] {$H$};
  \draw[->] (3.4,0) -- (4.25,0);
  \draw[thick] (4.5,0) circle (0.25);
  \draw[->] (4.5,1.0) node[above] {$Q$} -- (4.5,0.25);
  \draw[->] (4.75,0) -- (6.0,0) node[right] {$Y$};
  \draw[->] (5.4,0) -- (5.4,-1.2) -- (1,-1.2) -- (1,-0.25);
  \begin{scope}[xshift=8.4cm,yshift=-1.2cm]
    \draw[->] (0,0) -- (4.2,0) node[right] {$\log\omega$};
    \draw[->] (0,0) -- (0,2.6) node[above] {$|\cdot|$};
    \draw[thick] (0.2,2.0) -- (1.8,2.0) -- (3.8,0.3);
    \draw[thick,dashed] (0.2,0.2) -- (1.8,2.0) -- (3.8,2.0);
    \node[font=\scriptsize] at (0.9,2.25) {STF $=\frac{H}{1+H}$};
    \node[font=\scriptsize] at (3.2,2.25) {NTF $=\frac{1}{1+H}$};
    \node[left,font=\scriptsize] at (0,2.0) {$1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Y = \underbrace{\frac{H}{1+H}}_{\mathrm{STF}}X + \underbrace{\frac{1}{1+H}}_{\mathrm{NTF}}Q\qquad H = \frac{N}{D}\ \Rightarrow\ \mathrm{NTF} = \frac{D}{D+N}}
$$

- Where $|H|$ is large (in band) the NTF is small and the STF is ≈ 1, like an op amp in unity-gain feedback. Out of band the noise passes.
- **Poles of $H$ are zeros of the NTF.** An integrator (pole at dc) gives an NTF zero at dc; a resonator gives a zero at its resonance.
- The loop needs a DAC to subtract the digital output from the analog input; the quantizer-plus-DAC is the unity-gain block of the model.

> [!tip] Remark
> This is the disturbance rejection of [[Feedback#What feedback buys]]: an error injected after the gain is divided by $1+$loop gain. The difference here is that the "disturbance" is the quantizer's own error, and we design $H$ to have enormous gain only in the band.

> [!note]- Why an integrator and not a big flat amplifier (Razavi Ex. 21.4)
> A broadband gain $A$ would also suppress $Q$, by $1+A$ at all frequencies. But the integrator gives (ideally) infinite gain at dc where the signal lives. Building comparable in-band gain from several flat stages would add poles and phase shift and endanger stability. The integrator concentrates loop gain where it is needed.

### The Time-Domain View: Bit Density Equals the Input

$$
\boxed{\frac{dy}{dt}+y = x+\frac{dq}{dt}\qquad\Rightarrow\qquad \overline{y} = \overline{x}}
$$

With $H = 1/s$: the output is a low-passed copy of $x$ plus the **derivative** of $q$. Differentiation kills slow components of $q$ and passes fast ones (Razavi Eq. 21.14). Second, since the integrator's output stays bounded while it integrates $x-y$, the **average** of $y$ must equal the average of $x$: the density of ONEs in the bit stream is the input (Carusone §18.2.2).

> [!note]- Where the names come from (Razavi §21.2.3)
> The loop first takes the difference $x-g$ ("Delta"), then sums it into the integrator's previous value ("Sigma"). Node by node for $H = 1/s$: the subtractor output carries $\frac{s}{s+1}(X-N)$ (high-passed), the integrator output carries $\frac{1}{s+1}(X-N)$ (low-passed).

### Metrics: DR, Peak SNR and SNDR

```tikz title="SNR versus input amplitude of a Delta-Sigma ADC. The noise floor is fixed, so SNR rises dB for dB until integrator overload and the falling 1-bit quantizer gain break the shaping; the dynamic range Vin1/Vin0 therefore exceeds the peak SNR. After Razavi Fig. 21.43."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right] {$V_{in}$ (dB)};
  \draw[->] (0,0) -- (0,4.6) node[above] {SNR (dB)};
  \draw[thick] (1,0) -- (5.3,3.6) to[out=40,in=180] (5.8,3.75) to[out=0,in=110] (6.6,2.0);
  \draw[dashed] (5.3,3.6) -- (6.3,4.4);
  \draw[dotted] (0,3.75) node[left,font=\scriptsize] {SNR$_{max}$} -- (5.8,3.75);
  \draw[dotted] (0,4.4) node[left,font=\scriptsize] {SNR$_i$} -- (6.3,4.4);
  \draw[dotted] (6.48,0) -- (6.48,2.6);
  \node[below,font=\scriptsize] at (1,0) {$V_{in0}$};
  \node[below,font=\scriptsize] at (6.48,0) {$V_{in1}$};
  \node[left,font=\scriptsize] at (0,0) {0 dB};
  \draw[<->] (1,-0.7) -- node[below,font=\scriptsize] {dynamic range} (6.48,-0.7);
  \node[font=\scriptsize,align=left,anchor=west] at (6.7,2.0) {overload,\\ falling quantizer gain};
  \node[font=\scriptsize,anchor=west] at (3.3,0.9) {limited by noise};
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{DR} = \frac{V_{in1}}{V_{in0}}\qquad \mathrm{SNDR} < \mathrm{SNR}_{max} < \mathrm{DR}}
$$

- $V_{in0}$: input where SNR = 1. $V_{in1}$: **maximum stable amplitude**. Example: DR 80 dB with a peak SNR of only 75 dB (Razavi Ex. 21.20).
- **DNL and INL are meaningless:** the integrator gives the loop memory, so there is no one-to-one map from an input sample to an output code. Only the running average tracks the input (Razavi §21.8).

## Level 1: The First-Order Modulator

### The Discrete-Time Integrator in the z-Domain

$$
\boxed{\text{delaying: } \frac{z^{-1}}{1-z^{-1}}\qquad\text{non-delaying: }\frac{1}{1-z^{-1}}\qquad \frac{z^{-1}}{1-z^{-1}}\approx\frac{e^{-sT_S}}{sT_S}\ \ (f\ll f_S)}
$$

A SC integrator with sampling cap $C_S$ and integrating cap $C_I$ realises $V_{out}[n] = V_{out}[n-1] - \frac{C_S}{C_I}V_{in}[n-1]$. Its CT equivalent is $f_S\frac{C_S}{C_I}\frac1s$: the "gain" $C_S/C_I$ is really a unity-gain frequency proportional to $f_S$ (Razavi Ex. 21.13, Eq. 22.39). That is why a faster clock suppresses more noise in a DT loop.

> [!tip] Remark
> The circuits (parasitic-insensitive, delaying and delay-free, both polarities in differential form) and their charge bookkeeping are owned by [[Switched-Capacitor Circuits#Parasitic-Insensitive Integrators]]; the SC-resistor equivalence $R = 1/(f_SC)$ is [[Switched-Capacitor Circuits#A Switched Capacitor Is a Resistor]]. Razavi DC names the caps $C_2$ (sampling) and $C_1$ (integrating); this note uses $C_S$ and $C_I$. For $z$-transform rules see [[Z-Transform]]; for reading poles and zeros on the unit circle see [[Pole-Zero Plots]].

### First-Order Loop: STF = z⁻¹, NTF = 1 − z⁻¹

```tikz title="First-order DT Delta-Sigma loop in the z-domain, with a delaying integrator. After Razavi Fig. 21.26(b) and Carusone Fig. 18.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) node[left] {$X(z)$} -- (0.75,0);
  \draw[thick] (1,0) circle (0.25);
  \node[font=\scriptsize] at (0.75,-0.4) {$-$};
  \node[font=\scriptsize] at (1.4,0.3) {$E$};
  \draw[->] (1.25,0) -- (2.2,0);
  \draw[thick] (2.2,-0.6) rectangle (3.8,0.6) node[pos=.5] {$\frac{z^{-1}}{1-z^{-1}}$};
  \draw[->] (3.8,0) -- node[above,font=\scriptsize] {$A$} (4.75,0);
  \draw[thick] (5,0) circle (0.25);
  \draw[->] (5,1.0) node[above] {$Q(z)$} -- (5,0.25);
  \draw[->] (5.25,0) -- (6.6,0) node[right] {$Y(z)$};
  \draw[->] (5.9,0) -- (5.9,-1.3) -- node[below,font=\scriptsize] {DAC (gain 1)} (1,-1.3) -- (1,-0.25);
\end{circuitikz}
\end{document}
```

$$
\boxed{Y(z) = z^{-1}X(z) + (1-z^{-1})Q(z)\qquad |1-z^{-1}| = 2\sin\frac{\pi f}{f_S}\approx\frac{2\pi f}{f_S}}
$$

- The input is only **delayed**; the noise is **differentiated**: $y[n] = x[n-1] + q[n]-q[n-1]$.
- Low frequencies: $|NTF|^2\approx(2\pi f/f_S)^2$, a parabola, as in the CT model.
- Internal nodes: $E = (1-z^{-1})(X-Q)$ and $A = z^{-1}(X-Q)$. The integrator output holds the input minus the noise, **not** the integral of the input: feedback keeps it bounded (Razavi Exs. 21.15, 21.16).

> [!note]- Derivations: NTF magnitude and a non-delaying first-order loop
> $|1-e^{-j2\pi fT}| = \sqrt{2-2\cos(2\pi fT)} = |2\sin(\pi fT)|$ using $1-\cos\alpha = 2\sin^2(\alpha/2)$ (Razavi Eqs. 21.27–21.30; Carusone Eq. 18.22). In time: a slow input and its one-cycle-delayed copy nearly cancel; a faster clock makes them more alike, which is the OSR effect (Razavi Exs. 21.11, 21.12).
>
> With a **non-delaying** integrator in the loop, $Y = \frac{1}{2-z^{-1}}X + \frac{1-z^{-1}}{2-z^{-1}}Q$: an extra pole near $f_S/(2\pi)$ that is negligible at a high clock rate (Razavi Ex. 21.14).

### In-Band Noise: 9 dB per Octave

$$
\boxed{P_Q = \int_{-f_B}^{f_B}\frac{\Delta^2}{12f_S}\left(\frac{2\pi f}{f_S}\right)^2df = \frac{\pi^2\Delta^2}{36M^3}\qquad \text{1-bit, }\Delta=2V_{REF}:\ \mathrm{SNR} = \frac{9M^3}{2\pi^2}}
$$

Doubling $M$ buys 9 dB (1.5 bits). Carusone's form: $\mathrm{SQNR} = 6.02N+1.76-5.17+30\log M$ (Eq. 18.26). Still too slow for high resolution: 14 bits at 5 MHz would need $f_S = 9.56$ GHz (Razavi Ex. 22.5).

> [!example] A first-order loop with a dc input (Carusone Ex. 18.4)
> Input $1/3$, quantizer $\pm1$: the output locks into the period-3 pattern $\{1,1,-1,\ldots\}$ (Carusone §18.7.3) whose average is exactly $1/3$, whereas $1/3$ applied straight to a 1-bit quantizer gives all 1s. The average is right; the pattern is periodic, so the "noise" is a tone, which is the [[#Idle Tones and Dither|idle-tone]] problem.

### The 1-Bit Quantizer Has No Δ and No Fixed Gain

$$
\boxed{P_Q\approx\frac{(\text{output height})^2}{12} = \frac{(2V_{REF})^2}{12}\qquad G_Q = \frac{4}{\pi}\frac{A}{B}\ \ (\text{sine of amplitude }B,\ \text{levels }\pm A)}
$$

- A comparator has no analog LSB; Ardalan and Paulos take the full output height as $\Delta$. For a sine input the actual error is $(3/2-4/\pi)A^2\approx A^2/4.4$, below the model's $A^2/3$ (Razavi Ex. 21.21).
- Its **gain** is ill-defined: the output fundamental is $4A/\pi$ whatever the input, so the effective gain **falls as the input grows**. In a loop, the integrator swing sets the gain, so 1-bit loop analysis is approximate and stability is checked by simulation (Razavi §21.9).
- In exchange, a 2-level DAC is **perfectly linear**: two points always lie on a line.

### The Switched-Capacitor First-Order Modulator

```tikz title="Single-ended first-order SC modulator. On phi1 C_S samples V_in; on phi2 its left plate swings to V_DAC = +/-V_REF, so the integrator adds (C_S/C_I)(V_in - V_DAC). The comparator fires after the integrator has settled; a ONE must select +V_REF for negative feedback. After Razavi Figs. 22.6, 22.7, 22.10(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1) node[left] {$V_{in}$} to[nos, l=$\phi_1$] (1.6,1) -- (1.6,0.4);
  \draw (0,-0.2) node[left] {$V_{DAC}$} to[nos, l_=$\phi_2$] (1.6,-0.2) -- (1.6,0.4);
  \draw (1.6,0.4) to[C, l=$C_S$] (3.4,0.4) coordinate (p);
  \draw (p) to[nos, l=$\phi_2$] (5.0,0.4) coordinate (x);
  \draw (p) -- (3.4,-0.3) to[nos, l_=$\phi_1$] (3.4,-1.3) node[ground] {};
  \draw (6.4,0.1) node[op amp] (oa) {};
  \draw (x) -- (oa.-);
  \draw (oa.+) -- (5.25,-0.6) node[ground] {};
  \draw (x) -- (5.0,1.6) to[C, l=$C_I$] (7.8,1.6) -- (7.8,0.1);
  \draw (oa.out) -- (8.7,0.1);
  \node[above] at (8.25,0.1) {$V_{int}$};
  \draw[thick] (8.7,-0.4) rectangle (10.1,0.6) node[pos=.5] {comp};
  \draw[->] (10.1,0.1) -- (11.1,0.1) node[right] {$D_{out}$};
  \draw[->] (9.4,-1.1) node[below,font=\scriptsize] {CK} -- (9.4,-0.4);
  \draw[->] (10.7,0.1) -- (10.7,-2.0) -- node[below,font=\scriptsize] {1-bit DAC: ONE $\to +V_{REF}$, ZERO $\to -V_{REF}$} (0.3,-2.0) -- (0.3,-0.2);
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{int}[k+1] = V_{int}[k] + \frac{C_S}{C_I}\left(V_{in}[k] \mp V_{REF}\right)\quad(-\text{ if }V_{int}[k]>0)}
$$

- **Subtraction is free:** the DAC drives the left plate of $C_S$ in the integrate phase, so one capacitor samples and subtracts (Razavi Fig. 22.6).
- **Timing:** sample on $\phi_1$, subtract-and-integrate on $\phi_2$; clock the comparator only after $V_{int}$ settles. The integrator gets **less than half a period** to settle (Razavi Fig. 22.9).
- **Sign:** if $V_{int}>0$ the next step must lower it, so a ONE must apply $+V_{REF}$. A sign error turns the loop into a latch.
- **Differential:** the right-plate switch must go to the op amp's input CM level $V_{CM}$, not ground, or the CMFB fights every cycle (Razavi Ex. 22.2). Non-overlapping clocks, with $S_3$ opening before $S_1$ (bottom-plate sampling), avoid charge sharing and signal-dependent charge injection.

> [!tip] Remark
> Bottom-plate sampling and non-overlapping phases are owned by [[Switched-Capacitor Circuits#Bottom-Plate Sampling and Clock Ordering]] and [[Sampling Circuits#Bottom-Plate Sampling]]. The NAND-latch generator Razavi gives (non-overlap $T_{D2}+2T_{D1}$ with extra inverters in the feedback paths) is in Razavi §22.5.

```tikz title="Integrator output for V_in = +V_REF/3, C_S = C_I: steps of +4V_REF/3 (comparator ZERO) and -2V_REF/3 (comparator ONE). Every third cycle V_int lands on 0 and the comparator is metastable; the DAC averages exactly V_REF/3. After Razavi Fig. 22.10(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (10.2,0) node[right] {$n$};
  \draw[->] (0,-1.6) -- (0,3.0) node[above] {$V_{int}/V_{REF}$};
  \foreach \y/\l in {2/{4/3},1/{2/3},-1/{-2/3}} { \draw[dotted] (0,\y*1.0) -- (10,\y*1.0); \node[left,font=\scriptsize] at (0,\y*1.0) {$\l$}; }
  \foreach \n/\v in {0/0,1/2,2/1,3/0,4/-1,5/1,6/0,7/-1,8/1,9/0} {
    \draw[thick] (\n,0) -- (\n,\v);
    \fill (\n,\v) circle (0.07);
  }
  \foreach \n in {3,6,9} { \node[font=\scriptsize,red!70!black] at (\n,-0.35) {meta}; }
  \node[font=\scriptsize,align=left,anchor=west] at (4.3,2.55) {DAC: $+V_{REF}$ 4 cycles, $-V_{REF}$ 2 cycles $\Rightarrow$ mean $V_{REF}/3$};
\end{circuitikz}
\end{document}
```

- **The swing exceeds the input range:** here $V_{int}$ reaches $+\frac43V_{REF}$; for $V_{in} = V_{REF}$ it climbs to $+2V_{REF}$ and stays (Razavi Ex. 22.4). The op amp would need $\pm2V_{REF}$.
- **Capacitor scaling:** make $C_S/C_I = \alpha<1$, simulate the histogram of $V_{int}$ with a slow sine or band-limited noise input, and choose $\alpha$ so the peak fits the op amp. $kT/C$ then sets the absolute values (Razavi §22.1.2, Figs. 22.13–22.14).
- **Sine input:** the integrator accumulates input samples plus alternating $\pm V_{REF}$ that keep it from running away (Razavi Fig. 22.12).

## Level 2: Second- and Higher-Order Loops

### Second Order: Nest a Loop Inside a Loop

```tikz title="Second-order DT modulator with two delaying integrators. The gains 1/2 and 2 (absorbed into capacitor ratios) make the denominator collapse to 1, giving STF = z^-2 and NTF = (1 - z^-1)^2. After Razavi Fig. 21.41(b) (Boser and Wooley)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) node[left] {$X$} -- (0.75,0);
  \draw[thick] (1,0) circle (0.25);
  \node[font=\scriptsize] at (0.75,-0.4) {$-$};
  \draw[->] (1.25,0) -- (1.8,0);
  \draw[thick] (1.8,-0.35) rectangle (2.4,0.35) node[pos=.5] {$\frac12$};
  \draw[->] (2.4,0) -- (2.8,0);
  \draw[thick] (2.8,-0.6) rectangle (4.3,0.6) node[pos=.5] {$\frac{z^{-1}}{1-z^{-1}}$};
  \draw[->] (4.3,0) -- node[above,font=\scriptsize] {$D$} (4.95,0);
  \draw[thick] (5.2,0) circle (0.25);
  \node[font=\scriptsize] at (4.95,-0.4) {$-$};
  \draw[->] (5.45,0) -- (5.9,0);
  \draw[thick] (5.9,-0.35) rectangle (6.5,0.35) node[pos=.5] {$2$};
  \draw[->] (6.5,0) -- (6.9,0);
  \draw[thick] (6.9,-0.6) rectangle (8.4,0.6) node[pos=.5] {$\frac{z^{-1}}{1-z^{-1}}$};
  \draw[->] (8.4,0) -- (9.15,0);
  \draw[thick] (9.4,0) circle (0.25);
  \draw[->] (9.4,1.0) node[above] {$Q$} -- (9.4,0.25);
  \draw[->] (9.65,0) -- (10.9,0) node[right] {$Y$};
  \draw[->] (10.2,0) -- (10.2,-1.4) -- (1,-1.4) -- (1,-0.25);
  \draw[->] (5.2,-1.4) -- (5.2,-0.25);
  \node[font=\scriptsize,anchor=west] at (2.2,-1.7) {one 1-bit DAC feeds both summers};
\end{circuitikz}
\end{document}
```

$$
\boxed{Y(z) = z^{-2}X(z) + (1-z^{-1})^2Q(z)\qquad P_Q = \frac{\pi^4\Delta^2}{60M^5}\qquad\text{1-bit: }\mathrm{SNR} = \frac{15M^5}{2\pi^4}}
$$

- 15 dB (2.5 bits) per octave of $M$; Carusone: $\mathrm{SQNR} = 6.02N+1.76-12.9+50\log M$ (Eq. 18.32). 14 bits at 5 MHz now needs $M\approx88$, $f_S = 880$ MHz (Razavi Ex. 22.8).
- $|NTF|^2 = 16\sin^4(\pi f/f_S)$: better than first order up to $f_S/6$, worse above (the out-of-band noise is larger).
- In time: $q[n]-2q[n-1]+q[n-2]$, the second difference.
- The first integrator output is $\frac12(1+z^{-1})z^{-1}X - \frac12(1-z^{-1})z^{-1}Q$: low-passed input plus **first-order** shaped noise (Razavi Ex. 21.18).

> [!note]- Derivation: why the gain of 2 (Razavi Eqs. 21.49–21.53)
> Without it, two delaying integrators give $Y = \frac{z^{-2}X + (1-z^{-1})^2Q}{1-z^{-1}+z^{-2}}$: a denominator that distorts both transfer functions. With a gain of 2 in the inner loop, $\left[1+\frac{2z^{-1}}{1-z^{-1}}+\left(\frac{z^{-1}}{1-z^{-1}}\right)^2\right] = \frac{1}{(1-z^{-1})^2}$ and the denominator becomes 1. The DAC-times-2 is avoided by the identity $E-2Y = 2(E/2-Y)$: scale by ½ before the first integrator and by 2 before the second, both as capacitor ratios. The construction itself comes from replacing the quantizer of a first-order loop by a first-order loop (Razavi Fig. 21.37).

### Scaling the Second-Order Loop

- Unscaled, the integrators swing $\pm V_{REF}$ and $\pm2V_{REF}$. With **both integrator gains 0.5** (Boser and Wooley), the histograms shrink to about $\pm0.7V_{REF}$ and $\pm0.6V_{REF}$ (Razavi Fig. 22.16).
- A linear model says this changes the denominator to $1-1.5z^{-1}+0.75z^{-2}$. It does not matter much because a **1-bit quantizer absorbs any gain placed in front of it**: swap the gain and the second integrator and the gain merges into the comparator.
- Not exactly free: the quantizer's effective gain partly compensates, and a smaller swing at the comparator makes its noise relatively larger (Razavi Ex. 22.7).
- Clock the comparator on the rising edge of $\phi_1$, after $V_{int2}$ settled, to avoid the switching glitch at the end of $\phi_2$ (Razavi §22.2).

### Why the Inner Feedback Path Is Needed

$$
\boxed{\frac{a}{s}, \frac{b}{s}\text{ integrators: } \mathrm{NTF} = \frac{s^2}{s^2+bs+ab}\ \ (\text{stable if } b>0)\qquad\text{no inner path: } \frac{s^2}{s^2+ab}\ (\text{oscillates})}
$$

Two integrators in one loop give 180° of phase: the poles sit on the $j\omega$ axis. The DAC path into the second summer bypasses the first integrator, adds a left-half-plane zero to the loop gain and stabilises it. Each loop must contain exactly one net inversion (Razavi §22.2.2).

> [!tip] Remark
> Two integrators in a loop is the two-pole case of [[Stability#Two poles]]; the inner path plays the role of a zero that restores phase margin ([[Stability#Level 2 Phase Margin]]).

### Order L: 6L + 3 dB per Octave

$$
\boxed{\mathrm{NTF} = (1-z^{-1})^L\ \Rightarrow\ P_Q = \frac{\Delta^2}{12}\cdot\frac{\pi^{2L}}{(2L+1)M^{2L+1}}}
$$

| Order $L$ | NTF | $P_Q$ | per octave of $M$ |
|---|---|---|---|
| 0 (oversampling only) | 1 | $\frac{\Delta^2}{12M}$ | 3 dB |
| 1 | $1-z^{-1}$ | $\frac{\pi^2\Delta^2}{36M^3}$ | 9 dB |
| 2 | $(1-z^{-1})^2$ | $\frac{\pi^4\Delta^2}{60M^5}$ | 15 dB |
| $L$ | $(1-z^{-1})^L$ | $\frac{\pi^{2L}\Delta^2}{12(2L+1)M^{2L+1}}$ | $6L+3$ dB |

> [!note]- Derivation: the general L-th order integral
> For $f\ll f_S$, $|NTF|^2\approx(2\pi f/f_S)^{2L}$. Then $P_Q = \frac{\Delta^2}{12f_S}\int_{-f_B}^{f_B}\left(\frac{2\pi f}{f_S}\right)^{2L}df = \frac{\Delta^2}{12f_S}\cdot\frac{(2\pi)^{2L}}{f_S^{2L}}\cdot\frac{2f_B^{2L+1}}{2L+1} = \frac{\Delta^2}{12}\cdot\frac{\pi^{2L}}{2L+1}\left(\frac{2f_B}{f_S}\right)^{2L+1}$. With $M = f_S/(2f_B)$ this is the boxed result; $L=1$ and $L=2$ reproduce Razavi Eqs. 21.41, 21.58 and Carusone Eqs. 18.24, 18.30. In dB, $(2L+1)\cdot10\log2 = 6.02L+3.01$ dB per doubling, Carusone's "$6L+3$ dB/octave". The full-scale sine of an $N$-bit quantizer has power $(2^N\Delta)^2/8$, which gives the SQNR formula of the [[#Spec translation]].

### Loop-Filter Topologies: CIFB and CIFF

```tikz title="Two ways to build the loop filter. Top: cascade of integrators with distributed feedback (CIFB), coefficients b_i from the DAC and a_i for scaling (Carusone Fig. 18.31, third order). Bottom: feedforward (CIFF-style), the input and integrator outputs are summed before the quantizer; with alpha = 2, beta = 1 the integrators carry only shaped Q-noise (Razavi Fig. 24.20)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize,anchor=west] at (-0.6,1.3) {CIFB};
  \draw[->] (-0.6,0) node[left] {$u$} -- (0,0);
  \draw[thick] (0,-0.25) rectangle (0.5,0.25) node[pos=.5] {\scriptsize $a_1$};
  \foreach \i/\x in {1/1.0,2/3.6,3/6.2} {
    \draw[thick] (\x,0) circle (0.22);
    \draw[thick] (\x+0.6,-0.45) rectangle (\x+1.7,0.45) node[pos=.5] {$\frac{z^{-1}}{1-z^{-1}}$};
    \draw[->] (\x+0.22,0) -- (\x+0.6,0);
    \draw[->] (\x,-1.1) -- node[right,font=\scriptsize] {$-b_\i$} (\x,-0.22);
  }
  \draw[->] (0.5,0) -- (0.78,0);
  \draw[->] (2.7,0) -- node[above,font=\scriptsize] {$a_2$} (3.38,0);
  \draw[->] (5.3,0) -- node[above,font=\scriptsize] {$a_3$} (5.98,0);
  \node[font=\scriptsize] at (2.7,0.65) {$V_1$};
  \node[font=\scriptsize] at (5.3,0.65) {$V_2$};
  \draw[->] (7.9,0) -- node[above,font=\scriptsize] {$V_3$} (8.6,0);
  \draw[thick] (8.6,-0.35) rectangle (9.3,0.35) node[pos=.5] {\scriptsize Q};
  \draw[->] (9.3,0) -- (10.0,0) node[right] {$y$};
  \draw (9.65,0) -- (9.65,-1.1) -- (1,-1.1);
  \begin{scope}[yshift=-3.6cm]
    \node[font=\scriptsize,anchor=west] at (-0.6,1.5) {feedforward};
    \draw[->] (-0.6,0) node[left] {$X$} -- (0.78,0);
    \draw[thick] (1,0) circle (0.22);
    \draw[->] (1.22,0) -- (1.6,0);
    \draw[thick] (1.6,-0.45) rectangle (2.7,0.45) node[pos=.5] {$\frac{z^{-1}}{1-z^{-1}}$};
    \draw[->] (2.7,0) -- node[above,font=\scriptsize] {$A$} (3.38,0);
    \draw[thick] (3.6,0) circle (0.22);
    \draw[->] (3.82,0) -- (4.2,0);
    \draw[thick] (4.2,-0.45) rectangle (5.3,0.45) node[pos=.5] {$\frac{z^{-1}}{1-z^{-1}}$};
    \draw[->] (5.3,0) -- node[above,font=\scriptsize] {$B$} (6.98,0);
    \draw[thick] (7.2,0) circle (0.22);
    \draw[->] (7.42,0) -- (8.6,0);
    \draw[thick] (8.6,-0.35) rectangle (9.3,0.35) node[pos=.5] {\scriptsize Q};
    \draw[->] (9.3,0) -- (10.0,0) node[right] {$Y$};
    \draw[->] (0.2,0) -- (0.2,1.0) -- node[above,font=\scriptsize] {$\alpha$} (3.6,1.0) -- (3.6,0.22);
    \draw[->] (0.2,1.0) -- (0.2,1.3) -- node[above,font=\scriptsize] {$\beta$} (7.2,1.3) -- (7.2,0.22);
    \draw (9.65,0) -- (9.65,-1.0) -- (1,-1.0);
    \draw[->] (1,-1.0) -- (1,-0.22);
    \draw[->] (3.6,-1.0) -- node[right,font=\scriptsize] {$-2$} (3.6,-0.22);
    \node[font=\scriptsize] at (0.75,-0.4) {$-$};
    \node[font=\scriptsize,align=left,anchor=west] at (5.4,-0.6) {active summer,\\ no virtual ground};
  \end{scope}
\end{circuitikz}
\end{document}
```

| | CIFB (feedback) | Feedforward (CIFF-style) |
|---|---|---|
| NTF set by | feedback coefficients $b_i$ | loop coefficients; feedforward paths vanish when $X=0$ |
| STF | fixed by the loop (low-pass) | set freely by the feedforward gains (flat for $\alpha=2,\beta=1$) |
| Integrator swing | input **plus** noise: large, needs scaling | **only shaped $Q$**: small |
| Cost | many DAC branches | an active summer before the quantizer: power, extra loop delay |

$$
\boxed{\text{Razavi Fig. 24.20, }\alpha=2,\ \beta=1:\ Y = X + (1-z^{-1})^2Q,\quad A = -(1-z^{-1})z^{-1}Q,\quad B = -z^{-1}(2-z^{-1})Q}
$$

> [!note]- Detail: implementing the summations (Razavi Ex. 24.9, Fig. 24.22)
> The sum $\alpha X$ + first-integrator output is free: sample $X$ on an extra capacitor $C_3$ and dump both charges into the second integrator's virtual ground. The final sum before the quantizer has no virtual ground and still needs linearity, so it uses an active SC summer (an MDAC-like stage, not an integrator), which costs an op amp and adds delay to the loop. Feedforward also improves stability (Razavi §24.3).

> [!note]- Detail: designing a CIFB loop from an NTF (Carusone §18.9)
> Third order, 1-bit, all NTF zeros at $z=1$ so the design works at any OSR. Poles: a Butterworth high-pass with passband edge at $f_S/20$ gives peak $|NTF| = 1.37$: $\mathrm{NTF} = \frac{(z-1)^3}{z^3-2.3741z^2+1.9294z-0.5321}$, so $H = \frac{1-\mathrm{NTF}}{\mathrm{NTF}} = \frac{0.6259z^2-1.0706z+0.4679}{(z-1)^3}$. Matching the CIFB loop gives $b_1 = 0.0232$, $b_2 = 0.1348$, $b_3 = 0.4679$ with $a_1 = b_1$, $a_2 = a_3 = 1$. **Dynamic-range scaling:** simulate with a 0.7-peak sine at $\pi/256$ rad/sample, find node peaks (0.1256, 0.5108, 1.004), and scale each node to ≈1 by multiplying its input branches by $k$ and dividing its output branches by $k$: final $a' = (0.1847, 0.2459, 0.5108)$, $b' = (0.1847, 0.2639, 0.4679)$. Setting $a_1 = b_1$ lets the input be as large as the feedback.

### NTF Design and Stability

$$
\boxed{\max_\omega|\mathrm{NTF}(e^{j\omega})|\lesssim1.5\ \ \text{(1-bit loops)}}
$$

- **The rule** (Carusone Eq. 18.49, after Chao 1990, which used 2; often called Lee's rule): a heuristic, not a proof. Butterworth NTF poles give a flat out-of-band gain just under it.
- **Trade:** poles closer to the NTF zeros make a more stable loop that accepts a larger input, but leave more noise in band.
- **Spread the zeros** across the band with resonators (local feedback around integrator pairs) instead of stacking them at dc: better SQNR at low OSR (Carusone Fig. 18.20).
- **Multibit quantizers** have a well-defined gain and are far more stable: the usual partner of high order at low OSR ([[#Multibit Quantizers Buy 6 dB per Bit]]).

> [!note]- Detail: three kinds of "instability" and what to do about them
> Razavi §23.5 separates (1) **idle tones**: a bounded, periodic output under a dc input; (2) **overload**: an integrator output too large for its op amp, fixed by gain scaling; (3) **true oscillation**: internal amplitudes grow until the op amps saturate. The linear model cannot sort them, because the 1-bit quantizer's gain changes with amplitude. A loop of order ≥2 that goes unstable on a large input may never recover when the input goes away. Practical defences (Carusone §18.7.1): detect long runs of 1s or 0s or an over-range quantizer input, then reset the integrators, temporarily drop to first or second order, or bypass the comparator so the loop becomes a stable filter.

> [!note]- Detail: the error-feedback structure (Carusone §18.2.7)
> Subtract the delayed quantization error directly: $\mathrm{STF} = 1$, $\mathrm{NTF} = G(z)$, e.g. $G = (1-z^{-1})^2$. A coefficient error ($-0.99z^{-1}$ instead of $-z^{-1}$) moves the NTF zero off dc, so it suits only digital modulators (DACs), never analog loops. The interpolative structure keeps its zeros at dc as long as $H$ has high dc gain, which needs op-amp gain, not matching.

### Bandpass Modulators

$$
\boxed{H(z) = \frac{z}{z^2+1}\ \Rightarrow\ \text{NTF zeros at } z=\pm j\ (f_S/4)\qquad \mathrm{OSR} = \frac{f_S}{2f_\Delta}}
$$

A resonator in place of the integrator puts the NTF zeros at a carrier $f_c$. The OSR depends on the signal width $f_\Delta$, not on $f_c$ (e.g. $f_S = 4$ MHz, $f_\Delta = 10$ kHz: OSR 200). A second-order bandpass loop has one zero per sideband, so it shapes like a first-order low-pass (9 dB/octave); fourth order matches second-order low-pass (Carusone §18.6).

## Level 3: Continuous-Time Modulators

### The CT First-Order Loop

```tikz title="First-order CT modulator: an RC integrator, a clocked comparator that does the sampling, and a current DAC dumping +/-V_REF/R_1 into the virtual ground. The input full scale is I_DAC R_1. After Razavi Figs. 21.35, 22.19(c), 22.20(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0.5) node[left] {$V_{in}$} to[R, l=$R_1$] (2.0,0.5) coordinate (x);
  \draw (4.4,0.2) node[op amp] (oa) {};
  \draw (x) -- (oa.-);
  \draw (oa.+) -- ++(-0.2,0) -- ++(0,-0.5) node[ground] {};
  \draw (x) -- (2.0,1.7) to[C, l=$C_1$] (5.8,1.7) -- (5.8,0.2);
  \draw (oa.out) -- (6.9,0.2);
  \node[above] at (6.35,0.2) {$V_{int}$};
  \draw[thick] (6.9,-0.3) rectangle (8.3,0.7) node[pos=.5] {comp};
  \draw[->] (7.6,-1.0) node[below,font=\scriptsize] {CK} -- (7.6,-0.3);
  \draw[->] (8.3,0.2) -- (9.5,0.2) node[right] {$D_{out}$};
  \draw (9.0,0.2) -- (9.0,-1.8) -- (2.0,-1.8);
  \draw (2.0,-1.8) to[I, l={$I_{DAC} = \pm V_{REF}/R_1$}] (2.0,0.5);
  \node[circ] at (2.0,0.5) {};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{int} = -\frac{1}{R_1C_1}\int(V_{in}-I_{DAC}R_1)\,dt\qquad \text{full scale} = \pm I_{DAC}R_1 = \pm V_{REF}\qquad \overline{I_{DAC}} = V_{in}/R_1}
$$

- No input sampler, no non-overlapping clocks: the clock reaches only the comparator, which does the sampling (Razavi §22.3).
- Differential version: a current-steering pair at the two virtual grounds; on average it shifts their CM by $R_1I_{SS}/2$ unless a complementary PMOS pair is added (Razavi Fig. 22.19(b)).
- Negative feedback: a positive $V_{int}$ (a ONE) must steer the DAC current so $V_{int}$ falls.

### CT Shaping Depends on R₁C₁, Not on the Clock

$$
\boxed{|\mathrm{NTF}|\approx 2\pi fR_1C_1\qquad \mathrm{SNR}_{CT} = \frac{9f_S}{16\pi^2R_1^2C_1^2f_B^3}\qquad R_1C_1 = \frac{1}{f_S}\ \Rightarrow\ \mathrm{SNR}_{CT} = \mathrm{SNR}_{DT} = \frac{9M^3}{2\pi^2}}
$$

- In DT, the integrator's unity-gain frequency is $f_SC_S/C_I$: it tracks the clock. In CT it is $1/(R_1C_1)$, **fixed**. So SNR$_{CT}\propto f_S$ (only $S_Q\propto1/f_S$ helps), unless $R_1C_1$ is scaled with the clock (programmable $C_1$ for multi-rate parts) (Razavi Eqs. 22.37–22.44).
- Second order: $\mathrm{NTF}\approx R_1C_1R_2C_2s^2$; with $R_1C_1R_2C_2 = 1/f_S^2$ the SNR equals the DT $15M^5/(2\pi^4)$ (Razavi Eqs. 22.48–22.52). Both integrators must be **noninverting** (in differential form) or the poles land in the right half plane (Razavi Eqs. 22.46–22.47).

### CT Swing Trades Against Shaping

$$
\boxed{V_0 = \frac{T_SV_{REF}}{2R_1C_1}\ (V_{in}=0)\qquad V_{int,p} = (2-\alpha)\frac{T_SV_{REF}}{2R_1C_1}\ (V_{in} = (1-\alpha)V_{REF})}
$$

- Near full scale the loop holds one DAC level for $m = 2/\alpha-1$ cycles, so the swing nearly **doubles** the $V_{in}=0$ value (Razavi Eqs. 22.29–22.33; $\alpha = 0.1$ gives 19 cycles and $1.9V_0$).
- Smaller $R_1C_1$ means better shaping and larger swing. That is the CT version of capacitor scaling, and the second integrator, which sees two integrations, usually clips first (Razavi §22.4.2).

### DT vs CT

| | DT (switched-capacitor) | CT (RC or $g_m$-C) |
|---|---|---|
| Front-end sampler | needed ($kT/C$, bootstrapping, charge injection) | none: the comparator samples |
| Anti-aliasing | needed in front | the loop filter itself provides some |
| Input load | switching transients stress the driver | quiet resistive input |
| Coefficient accuracy | capacitor ratios (accurate) | absolute $RC$ (±PVT, needs tuning) |
| Op-amp speed | must settle each half period; linear incomplete settling OK | must never slew; resistive loads |
| Clock jitter | ÷$M$, benign | modulates DAC charge: dominant |
| Loop delay | absorbed in the half-cycle timing | excess loop delay degrades stability |
| Max bandwidth | lower | higher (no settling) |

Razavi §21.6.2, §23.4; Carusone footnote to §18.2.2 (DT is more popular in integrated form for its jitter tolerance and distortion).

## Level 4: Discrete-Time Nonidealities

### Errors Are Divided by the Gain in Front of Them

```tikz title="Referring a disturbance V_n at the second integrator's input to the modulator input: it is divided by the first integrator's gain and multiplied by s, so it is first-order shaped. Only the first integrator's noise, offset and nonlinearity reach the input unattenuated. After Razavi Fig. 23.4(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) node[left] {$X$} -- (0.75,0);
  \draw[thick] (1,0) circle (0.25);
  \draw[->] (1.25,0) -- (1.9,0);
  \draw[thick] (1.9,-0.45) rectangle (2.9,0.45) node[pos=.5] {$\frac{K_1}{s}$};
  \draw[->] (2.9,0) -- (3.65,0);
  \draw[thick] (3.9,0) circle (0.25);
  \draw[->] (3.9,1.0) node[above] {$V_n$} -- (3.9,0.25);
  \draw[->] (4.15,0) -- (4.9,0);
  \draw[thick] (4.9,-0.45) rectangle (5.9,0.45) node[pos=.5] {$\frac{K_2}{s}$};
  \draw[->] (5.9,0) -- (7.0,0) node[right] {$Y$};
  \draw[->] (6.5,0) -- (6.5,-1.2) -- (1,-1.2) -- (1,-0.25);
  \draw[->] (3.9,-1.2) -- (3.9,-0.25);
  \node[font=\scriptsize,anchor=west] at (7.8,0.2) {$V_{n,in} = \dfrac{s}{K_1}V_n$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{n,in} = \frac{s}{K_1}V_n}
$$

The second integrator's $kT/C$ noise and offset are divided by the first integrator's gain and first-order shaped (Razavi Ex. 23.2, Ex. 23.4). Its capacitors can be small; the first integrator owns the noise budget.

### Capacitor Mismatch Only Tilts the NTF

$$
\boxed{\mathrm{NTF}\approx(1-z^{-1})\left(1-\frac{\Delta C}{C}z^{-1}\right)\qquad |\cdot|\approx|1-z^{-1}|\left(1-\frac{\Delta C}{C}\cos\frac{2\pi f}{f_S}\right)}
$$

1% mismatch scales the shaping and the STF by 0.99 at dc and by 1.0 at $f_S/4$: a little ripple, no nonlinearity. A 1-bit loop tolerates a few percent of capacitor mismatch, unlike SAR and pipelined ADCs. Multibit DACs bring matching back (Razavi §23.1.1).

### kT/C Noise Is Divided by M

$$
\boxed{\overline{v_{n,in}^2} = \frac{2kT}{C_S}\ \text{per side}\ \xrightarrow{\ \div M\ }\ \frac{2kT}{MC_S}\qquad(\times2\text{ differential})}
$$

Two $kT/C_S$ terms: the sampling switch and the virtual-ground switch. Averaging $M$ uncorrelated samples (or filtering a white spectrum to $f_B$) divides the power by $M$: $C_S$ is effectively enlarged $M$ times (Razavi §23.1.2).

> [!tip] Remark
> The single-capacitor $kT/C$ result and why it is independent of $R$ live in [[Noise#kT/C Noise]]; the SC-integrator bookkeeping is in [[Switched-Capacitor Circuits#kT/C Noise]]. Only the ÷$M$ is new here.

### Op-Amp Noise Is Averaged, Its Power Is Not

$$
\boxed{\overline{V_{n,in}^2}\approx\overline{V_n^2}\,\frac{G_m}{4C_S}\ \xrightarrow{\ \div M\ }}
$$

- The op-amp noise is sampled through the integrator's noise bandwidth $G_m/(4C)$ and averaged like $kT/C$ (Razavi §23.1.3; form from Eq. 18.57, see the warning in [[#Spec translation]]).
- **No free power saving** (Razavi Ex. 23.3): the same $M$ forces the op amp to settle $M$ times faster, so its bandwidth and integrated noise grow. Only the relaxed settling accuracy below gives some of it back.
- **Design order** (Razavi §23.1.3): fix architecture and $M$ (hence $P_Q$), then choose $C_S$ and the op amp so that their noise ÷$M$ is at or below $P_Q$.

> [!tip] Remark
> The op-amp's input-referred noise for each topology is in [[Operational Amplifiers#Noise]]; noise bandwidth $\pi/2\cdot f_{-3dB}$ is [[Noise#Noise Bandwidth]].

### Finite Op-Amp Gain Makes the Integrator Leak

```tikz title="Integrator leakage: with finite gain A_0 the NTF zero moves from dc to 1/((1+A_0)R_1C_1), and the noise below it is suppressed only by 1/(1+A_0). The signal band must lie above that corner. After Razavi Fig. 23.7(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$\log|Y/Q|$};
  \draw[thick] (0.2,0.5) -- (2.0,0.5) -- (5.5,3.0) -- (7.6,3.0);
  \draw[dashed] (0.6,-0.3) -- (5.5,3.0);
  \node[left,font=\scriptsize] at (0,0.5) {$\frac{1}{1+A_0}$};
  \node[left,font=\scriptsize] at (0,3.0) {$1$};
  \draw[dotted] (2.0,0) -- (2.0,0.5);
  \draw[dotted] (5.5,0) -- (5.5,3.0);
  \node[below,font=\scriptsize] at (2.0,0) {$\frac{1}{(1+A_0)R_1C_1}$};
  \node[below,font=\scriptsize] at (5.5,0) {$\frac{1}{R_1C_1}$};
  \node[font=\scriptsize,anchor=west] at (0.9,1.9) {ideal (dashed)};
  \fill[gray!25] (2.4,0.05) rectangle (3.2,0.25);
  \node[font=\scriptsize,anchor=west] at (3.3,0.5) {$f_B$ band must sit here};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{Y}{Q} = \frac{1}{1+A_0}\cdot\frac{(1+A_0)R_1C_1s+1}{R_1C_1s+1}\qquad A_0 > \frac{\sqrt{30}}{\pi}\frac{C_S}{C_I}M - 1\approx1.7M}
$$

- Carusone's version: the NTF zero moves to $z = 1-1/A$; noise is flat below $1/A$ rad/sample, so $A>M/\pi$; **design for $A\ge2M$** (Carusone Eq. 18.54).
- With $M = 64$: $A_0\approx110$ (41 dB), far less than a pipelined ADC's MDAC needs (Razavi §23.1.4).
- The same finite gain gives a closed-loop gain error $-(1+C_S/C_I)/A_0$, which a single loop tolerates. **What really sets $A_0$** is closed-loop linearity (noise folding), and in MASH the analog-digital match (Razavi §23.1.4, Carusone §18.7.5).

> [!note]- Derivation: the leaky NTF and the 10% penalty (Razavi Eqs. 23.16–23.24)
> Model the SC input branch as $R_1 = 1/(C_Sf_S)$. With $V_X = -V_{out}/A_0$, the integrator is $G(s) = \frac{-A_0}{(1+A_0)R_1C_Is+1}$: dc gain $-A_0$, pole at $-1/[(1+A_0)R_1C_I]$ instead of the origin. In the loop, $\frac{Y}{Q} = \frac{1}{1-G}$ gives the boxed NTF. At low frequency $|Y/Q|^2\approx R_1^2C_I^2(2\pi f)^2 + \frac{1}{(1+A_0)^2}$; times $\Delta^2/(12f_S)$ and integrated over $\pm f_B$:
> $$P_Q = \frac{\Delta^2}{3}\left[\frac{2\pi^2}{3}\frac{C_I^2}{C_S^2}\left(\frac{f_B}{f_S}\right)^3 + \frac{1}{2(1+A_0)^2}\frac{f_B}{f_S}\right]$$
> The ratio of the second (leakage) term to the first is $\frac{3}{\pi^2}\frac{C_S^2}{C_I^2}\frac{M^2}{(1+A_0)^2}$; setting it below 0.1 gives the bound.
>
> The same result in $z$ (Carusone Eq. 18.52): $\frac{V_o}{V_i} = -\frac{C_S}{C_I}\frac{1}{z(1+\frac{C_S}{C_IA})-1}$, which is [[Switched-Capacitor Circuits#The Parasitic-Sensitive Integrator]]'s leaky integrator.

### Offsets: the Op Amp's Adds, the Comparator's Is Shaped

$$
\boxed{V_{OS,op}\ \to\ \text{adds to } V_{in}\qquad V_{OS,comp}\ \to\ \frac{V_{OS,comp}}{1+A_0}\ \text{at the input}}
$$

- The integrator integrates its op amp's offset exactly as it integrates an input: the offset is a dc input error, harmless unless the ADC must digitize dc (Razavi §23.1.5).
- A second integrator's offset is divided by the first's gain (Razavi Ex. 23.4).

### Comparator Offset and Noise Are Shaped

The comparator sits where $Q$ is injected, so its offset and noise see the NTF: offset suppressed by $1+A_0$, noise shaped as $\overline{V_n^2}(2\pi f/f_S)^2$ in a first-order loop. This is why a cheap StrongARM without preamp or offset cancellation suffices (Razavi §23.1.7). What still matters: deciding within the allotted half period, and metastability, which a 1-bit loop hits regularly by design (every third cycle for a $V_{REF}/3$ input).

> [!tip] Remark
> Regeneration time, metastability and the StrongARM are owned by [[Comparators]]; see [[Comparators#Level 4 Metastability]] for the decision-time budget.

### Settling: Linear Is Free, Slewing Is Not

```tikz title="Linear incomplete settling is only a gain error: a step of 2V_1 gives exactly twice the response of V_1. A slewing op amp breaks this: the slew segment has the same slope for both steps, so 2V_out1 - V_out2 is nonzero. Test: drive V_1 and 2V_1, plot 2V_out1 - V_out2, require it below (C_S/C_I) x 1 LSB by the sampling instant. After Razavi Figs. 23.13, 23.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (0,0) -- (4.4,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,3.2) node[above] {$V_{out}$};
    \draw[thick,domain=0:4,samples=40] plot (\x,{1.3*(1-exp(-1.4*\x))});
    \draw[thick,domain=0:4,samples=40] plot (\x,{2.6*(1-exp(-1.4*\x))});
    \node[font=\scriptsize] at (2.2,-0.45) {linear (RC): scales exactly};
  \end{scope}
  \begin{scope}[xshift=6.2cm]
    \draw[->] (0,0) -- (4.4,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,3.2) node[above] {$V_{out}$};
    \draw[thick] (0,0) -- (0.5,1.0);
    \draw[thick,domain=0.5:4,samples=40] plot (\x,{1.0+0.3*(1-exp(-2.0*(\x-0.5)))});
    \draw[thick] (0,0) -- (1.2,2.4);
    \draw[thick,domain=1.2:4,samples=40] plot (\x,{2.4+0.2*(1-exp(-2.0*(\x-1.2)))});
    \draw[dashed,domain=0.5:4,samples=40] plot (\x,{2*(1.0+0.3*(1-exp(-2.0*(\x-0.5))))});
    \draw[dashed] (0,0) -- (0.5,2.0);
    \node[font=\scriptsize,anchor=west] at (2.6,2.85) {$2V_{out1}$};
    \node[font=\scriptsize,anchor=west] at (2.6,2.2) {$V_{out2}$};
    \node[font=\scriptsize,anchor=west] at (2.6,1.5) {$V_{out1}$};
    \node[font=\scriptsize] at (1.7,0.55) {slew: same slope};
    \node[font=\scriptsize] at (2.2,-0.45) {slewing: does not scale};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out}(t_1) = \left(1-e^{-t_1/\tau}\right)\frac{C_S}{C_I}V_1,\quad \tau = \frac{C_S}{G_m}\ (\text{no load})\qquad SR = \frac{I_{SS}}{C_SC_I/(C_S+C_I)}}
$$

- **Linear** incomplete settling multiplies the step by a constant: a gain error of $-e^{-t_1/\tau}$. 5 $\tau$ gives 0.7%, which the loop absorbs; a 14-bit pipeline MDAC needs about 10 $\tau$ (Razavi §23.1.6).
- **Slewing** is nonlinear: the error depends on the step size, folds noise and distorts. The slewing must be over, and the residual nonlinear part below $(C_S/C_I)\times1$ LSB, by the time the comparator samples (Razavi Ex. 23.6).
- **The trade:** $\tau = C_S/G_m$ ties speed to power ($G_m$) and to noise ($C_S$). Doubling every width and current doubles $G_m$, halves $\tau$, permits $2f_S$, which halves $kT/C$ and op-amp noise in band, at twice the power (Razavi Ex. 23.7).

> [!tip] Remark
> Slew rate of each op-amp topology and the slewing-plus-linear settling split are owned by [[Operational Amplifiers#Slew Rate]] and [[Stability#Slewing plus linear settling]]. The only $\Delta\Sigma$-specific twist is that the linear tail need not finish.

### Reference Bounce

$$
\boxed{\text{shared } C_S:\ Q = C_S(V_{in}-V_{REF}^\pm)\ \text{flows into } V_{REF}\qquad \text{separate } C_D:\ V_{out} = \frac{C_S}{C_I}V_{in} - \frac{C_D}{C_I}V_{REF}^\pm}
$$

When $C_S$ swings from $V_{in}$ to $V_{REF}^\pm$ each cycle, it acts like a resistor between the input and the reference: an input-dependent load on a reference that, at high $f_S$, never fully settles. That distorts. Fixes: a low-impedance reference buffer, or a **separate DAC capacitor** $C_D$ that switches between 0 and $V_{REF}^\pm$ only. The cost: lower integrator loop gain (more op-amp distortion, slower settling, though the extra phase margin can be traded back by re-compensating) and extra $kT/C$ (Razavi §23.1.8, Ex. 23.8).

> [!tip] Remark
> Reference-buffer design and reference bounce in capacitor DACs: [[DACs#CDAC Reference Bounce and Its Buffer]].

### Clock Jitter in a DT Loop

$$
\boxed{P_j = \frac{1}{M}\left(\frac{dx}{dt}\right)^2\sigma_j^2 = \frac{A^2\omega_{in}^2\sigma_j^2}{2M}}
$$

A DT loop samples at its input, so jitter is an ordinary sampling error, averaged over $M$ samples. Benign, though a clock $M$ times faster at the same power is usually not as clean (Razavi §23.1.9).

> [!tip] Remark
> The single-sample jitter error $\Delta V = (dx/dt)\Delta t$ is derived in [[Sampling Circuits#Aperture Jitter]]; the converter-level budget is in [[Data Converter Fundamentals#Aperture Jitter and the Other Timing Specs]].

### Idle Tones and Dither

$$
\boxed{\text{dc input } v = \frac{m-n}{m+n}V_{REF}\ \Rightarrow\ \text{tones at } \frac{kf_S}{m+n}}
$$

- A deterministic loop with a constant (or very slow) input settles into a periodic pattern of $m$ ONEs and $n$ ZEROs. Its harmonics are **idle tones**; if one lands in band it is audible even below the noise floor (Razavi §23.2).
- Carusone's example (§18.7.3): $1/3$ gives a period of 3 (tone at $f_S/3$, out of band); $3/8$ gives a period of 16, a tone at $f_S/16$, inside the band for OSR 8. Other inputs give tones near $f_S/256$.
- Worst in first-order loops; present in higher-order ones too.
- **Dither:** add a pseudo-random signal to break the periodicity. Before the quantizer it is noise-shaped like $Q$, so it can be large, but it still adds ≈3 dB of in-band noise and needs a stability re-check (Carusone §18.7.4). At the input it must be subtracted digitally (Razavi Fig. 23.20), or made high-pass (out of band).

### Noise Folding

$$
\boxed{\alpha_2x^2:\ f_2-f_1\ \text{lands in band for any close pair near } f_S/2\qquad \alpha_3x^3:\ \text{only if } 2f_1\approx f_2}
$$

Shaped Q-noise is huge near $f_S/2$. Any second-order nonlinearity at the subtractor or integrator mixes pairs of close high-frequency components down to near dc, filling in the noise notch. Third-order folding needs $2f_1\approx f_2$, a narrower condition. Hence the op amp must be **linear in closed loop**, which in practice sets $A_0$ (Razavi §23.3).

> [!tip] Remark
> Intermodulation products and why feedback linearises are in [[Nonlinearity and Mismatch#Intermodulation and IP3]] and [[Nonlinearity and Mismatch#Effect of Negative Feedback]]. Folding is IM2 applied to a noise spectrum instead of two tones.

## Level 5: Continuous-Time Nonidealities

CT loops have no sampling $kT/C$ and no capacitor-ratio error, but keep op-amp noise, gain and nonlinearity, and add slewing, DAC noise, clock jitter and comparator delay (Razavi §23.4).

### Slewing Cannot Be Hidden

$$
\boxed{SR > \frac{V_p}{R_1C_1}+\frac{I_0}{C_1}}
$$

A CT integrator integrates all the time: there is no "late part of the phase" to recover in. It must follow the integrated input sine (slope up to $V_p/(R_1C_1)$) and the DAC step ($I_0/C_1$) at once. Check: drive $I_{DAC} = I_0$ and $2I_0$ with $V_{in} = 0$, form $2V_{out1}-V_{out2}$ until the swing limit; then confirm with the full loop and the spectrum of $V_{int}$ (Razavi §23.4.1).

### The DAC Out-Noises the Input Resistor

$$
\boxed{4kTR_1f_B = \frac{2kT}{MC_S}\ \text{ if } R_1 = \frac{1}{f_SC_S}\qquad \frac{\overline{I^2_{n,DAC}}}{\overline{I^2_{n,R_1}}} = \frac{2\gamma V_{REF}}{V_{GS}-V_{TH}}\ \text{(s.e.)},\ \ \frac{\gamma V_{REF}}{V_{GS}-V_{TH}}\ \text{(diff.)}}
$$

- An input resistor equivalent to a DT sampling branch has the **same** in-band noise; the CT advantage is a quiet input, not lower noise (Razavi Ex. 23.10).
- The current DAC source ($I_D = V_{REF}/R_1$) usually **out-noises** $R_1$: with $\gamma\approx1$, $V_{REF} = 0.5$ V, $V_{OV} = 0.2$ V the single-ended ratio is 5. Use a large $V_{OV}$ (low $g_m/I_D$) on DAC current sources (Razavi Eqs. 23.34–23.37).
- Op-amp input noise sees the same transfer function as $V_{in}$: it adds directly, integrated over $f_B$ (Razavi Eq. 23.39).

### Resistive Loading

In a CT loop the first op amp drives the second integrator's $R_2$: it must keep gain and linearity into a resistor. Make $R_2$ large, but only until its noise, referred to the input through the first integrator (first-order shaped), still matters. DT loops avoid this: once the next sampling capacitor is charged it draws little current (Razavi §23.4.3).

### Clock Jitter Corrupts the DAC Charge

```tikz title="CT clock jitter: an NRZ current pulse whose edge moves by dt_j delivers I_0 dt_j of wrong charge (left). A switched-capacitor feedback DAC delivers C_D V_REF regardless of the edge, as long as C_D discharges completely (right); choose C_D = T_S/R_1. After Razavi Figs. 23.30(b), 23.31(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (0,0) -- (5,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,2.0) node[above] {$I_{DAC}$};
    \draw[thick] (0.3,0) -- (0.3,1.2) -- (3.3,1.2) -- (3.3,0);
    \fill[gray!40] (3.3,0) rectangle (3.75,1.2);
    \draw[dashed] (3.75,0) -- (3.75,1.2);
    \draw[<->] (3.3,1.5) -- node[above,font=\scriptsize] {$\Delta t_j$} (3.75,1.5);
    \draw[<->] (0.3,-0.35) -- node[below,font=\scriptsize] {$T_S$} (3.3,-0.35);
    \node[left,font=\scriptsize] at (0,1.2) {$I_0$};
    \node[font=\scriptsize,align=left,anchor=west] at (3.9,0.75) {error\\ $I_0\Delta t_j$};
  \end{scope}
  \begin{scope}[xshift=7.2cm]
    \draw[->] (0,0) -- (5,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,2.0) node[above] {$I_{DAC}$};
    \draw[thick,domain=0.3:3.6,samples=50] plot (\x,{1.7*exp(-2.2*(\x-0.3))});
    \draw[thick] (0.3,0) -- (0.3,1.7);
    \draw[dashed] (3.3,0) -- (3.3,0.6);
    \draw[dashed] (3.75,0) -- (3.75,0.6);
    \node[font=\scriptsize,align=left,anchor=west] at (1.4,1.3) {area $= C_DV_{REF}$,\\ edge-independent};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{n,in} = \frac{V_{REF}\,\Delta t_j}{T_S}\qquad \overline{V^2_{n,jit}} = \frac{1}{M}\left(\frac{V_{REF}\sigma_j}{T_S}\right)^2\qquad C_D = \frac{T_S}{R_1}}
$$

- Every DAC pulse carries the jitter, at full DAC amplitude, every cycle: the defining weakness of CT loops. 14 bits, 20 MHz, $M = 64$: 28 fs rms for a 1-dB penalty (Razavi Ex. 23.12).
- Fixes: a **multibit DAC** (steps $I_{FS}/2^n$, jitter error ÷$2^n$), or a **switched-capacitor DAC** whose charge is $C_DV_{REF}$ regardless of timing. The SC DAC's current spike partly flows through $R_1$ into the driver, and $C_D$ lowers the integrator loop gain (Razavi §23.4.4).

> [!note]- Detail: NRZ memory and return-to-zero DACs (Carusone §18.7.2)
> A 2-level DAC is linear only if each symbol's area is independent of the previous one. With unequal rise and fall transients ($\delta_1\ne-\delta_2$), the averages of the patterns $\{1,-1\}$, $\{1,1,-1\}$, $\{-1,-1,1\}$ no longer lie on a line: distortion. A **return-to-zero** pulse makes every symbol identical (memoryless). SC circuits are naturally memoryless when they settle each phase; a CT loop with a 1-bit current DAC needs RZ or similar coding. Also keep reference and switch-driver supplies clean: if they droop with the ones-density, the levels become signal-dependent.

### Excess Loop Delay

$$
\boxed{e^{-s\Delta T}\approx1-s\Delta T:\ \ Y = \frac{K(1-s\Delta T)}{(1-K\Delta T)s+K}X + \frac{s(1-s\Delta T)}{(1-K\Delta T)s+K}Q}
$$

- A comparator (or DWA logic, or summer) delay $\Delta T$ puts a **right-half-plane zero** at $1/\Delta T$ in the loop: phase $-\tan^{-1}(\omega\Delta T)$, like an extra pole. Benign in first order; in higher order it causes NTF peaking, larger integrator swings and instability. Keep the total excess delay small against $T_S$ (Razavi §23.4.5).
- **Input-dependent delay** (regeneration is slower for small inputs) is worse: $W\approx V - g(V)\,dV/dt$ is a nonlinearity even if $g$ is linear, so it distorts and folds Q-noise. Fixes: the SC DAC (charge independent of the edge), or update the DAC on the **opposite clock edge** from the comparator, a fixed half-cycle delay designed into the loop (Razavi Ex. 23.13).

> [!tip] Remark
> A delay is a phase lag that grows with frequency; how it eats phase margin is [[Stability#Level 2 Phase Margin]]. Why a comparator's delay grows as its input shrinks is [[Comparators#Sensitivity]].

## Level 6: Advanced Architectures

### MASH: Cancel the First Stage's Noise Digitally

```tikz title="1-1 MASH cascade: the second modulator digitizes the first one's quantization error E_1; the digital combiner delays Y_1 and differentiates Y_2 so that E_1 cancels, leaving -(1 - z^-1)^2 E_2. After Carusone Fig. 18.21 and Razavi Figs. 24.1(e), 24.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=2.4cm,minimum height=1.0cm,align=center,fill=gray!8}}
  \node[blk] (m1) at (2,1.5) {1st-order $\Delta\Sigma$\\ $z^{-1}U + (1-z^{-1})E_1$};
  \node[blk] (m2) at (2,-1.0) {1st-order $\Delta\Sigma$\\ $z^{-1}E_1 + (1-z^{-1})E_2$};
  \draw[->] (-1.2,1.5) node[left] {$U$} -- (m1);
  \draw[->] (2,0.95) -- node[right,font=\scriptsize] {$E_1$} (m2);
  \node[blk,minimum width=1.4cm] (d1) at (6.6,1.5) {$z^{-1}$};
  \node[blk,minimum width=1.4cm] (d2) at (6.6,-1.0) {$1-z^{-1}$};
  \draw[->] (m1) -- node[above,font=\scriptsize] {$Y_1$} (d1);
  \draw[->] (m2) -- node[above,font=\scriptsize] {$Y_2$} (d2);
  \draw[thick] (8.6,0.25) circle (0.25);
  \draw[->] (d1) -- (8.6,1.5) -- (8.6,0.5);
  \draw[->] (d2) -- (8.6,-1.0) -- (8.6,0.0);
  \node[font=\scriptsize] at (8.95,-0.25) {$-$};
  \draw[->] (8.85,0.25) -- (9.6,0.25) node[right,align=left] {$z^{-2}U$\\ $-(1-z^{-1})^2E_2$};
  \draw[dashed] (5.6,-1.8) rectangle (9.2,2.3);
  \node[font=\scriptsize] at (7.4,2.55) {digital combiner};
\end{circuitikz}
\end{document}
```

$$
\boxed{W = z^{-1}Y_1 - (1-z^{-1})Y_2 = z^{-2}U - (1-z^{-1})^2E_2}
$$

- High-order shaping from stable 1st- and 2nd-order stages (MASH: multi-stage noise shaping). Combinations: 1-1 (2nd order), 2-1 and 1-2 (3rd order) (Razavi §24.1, Carusone §18.5.2).
- The analog residue $E_1 = $ quantizer input minus DAC output is formed by charge subtraction into the second integrator ($C_4 = C_5$, Razavi Ex. 24.3). Digitizing $V_{int}$ directly would also work but needs a wider-range second ADC (Razavi Ex. 24.2).
- The output is multi-level (4 levels for 1-1), so the decimator is slightly harder and a MASH **DAC** would need a linear 4-level DAC.

> [!tip] Remark
> This is the pipelined-ADC idea (digitise the residue of one stage in the next and combine digitally, [[Pipelined ADCs]]) with the residue being quantization noise instead of a held sample.

### MASH Needs the Analog to Match the Digital

$$
\boxed{\text{1-1, gain errors }\alpha,\beta:\ \ \text{leak } \approx z^{-1}(1-z^{-1})[(\beta-\alpha)z^{-1}-\beta]E_1\qquad\text{2-1: } -\beta z^{-1}(1-z^{-1})^2E_1\qquad\text{1-2: } -2\alpha z^{-2}(1-z^{-1})E_1}
$$

- Cancellation needs the digital filters to equal the analog NTF/STF. A gain error $\beta$ in the second stage leaks the first stage's noise with only first-order shaping, scaled by $\beta$. The first stage's own error $\alpha$ matters little (Razavi Ex. 24.5).
- **2-1 beats 1-2:** the leaked $E_1$ keeps second-order shaping (Razavi Eq. 24.20 vs Ex. 24.6). A multibit first quantizer also shrinks $E_1$.
- **DT:** gains are capacitor ratios, but finite $A_0$ gives $1/(1+2/A_0)$: 40 dB of cancellation needs $A_0\approx200$, more than a single loop (Razavi §24.1.3, Carusone §18.7.5). Incomplete settling, harmless in one loop, now leaks noise.
- **CT:** the digital differentiator $1-z^{-1}\approx sT_S$ requires the analog integrator to satisfy $1/K_2 = T_S$: an **absolute** $RC$ matched to the clock period. Needs calibration (Razavi Eq. 24.10). Alternatives: identify the analog transfer functions with injected test signals and adapt the digital filters (Carusone, after Kiss 2000).

### Multibit Quantizers Buy 6 dB per Bit

$$
\boxed{\Delta = \frac{V_{FS}}{2^n}\ \Rightarrow\ P_Q\div2^{2n}}
$$

A flash quantizer of $n$ bits driving a thermometer DAC (Razavi §24.2.1). Beyond the 6 dB/bit:
1. Smaller DAC steps: the integrator settles faster and **swings less**, and slews less.
2. The quantizer gain is well defined: the loop is **more stable** (higher order, more aggressive NTFs, larger inputs).
3. CT: jitter error per pulse ÷$2^n$.
4. MASH: less first-stage noise to leak.

Costs: the flash loads the integrator, its full scale must cover the integrator's swing (simulate), and above all **the DAC must be linear**.

### The Multibit DAC Must Be as Linear as the ADC

$$
\boxed{V_{in} - \left(\frac{jV_{REF}}{2^n}+\Delta V_j\right) = (V_{in}-\Delta V_j) - \frac{jV_{REF}}{2^n}}
$$

- DAC level errors $\Delta V_j$ are in the feedback path, so they appear **directly at the input**, unshaped: a 14-bit ADC needs $|\Delta V_j|<2^{-14}\approx0.006\%$ of full scale from a 3- or 4-bit DAC (Razavi §24.2.2).
- Worse, the DAC's nonlinearity folds the large out-of-band Q-noise into the band.
- By contrast, the **quantizer's** nonlinearity is suppressed by the loop gain (Carusone §18.3.1): in a $\Delta\Sigma$ ADC, linearity lives in the DAC.

> [!tip] Remark
> Why a unit-element (thermometer) DAC is the right substrate, and the matching statistics of its units, are owned by [[DACs#Binary-Weighted vs Thermometric]] and [[DACs#Random Mismatch and Unit Sizing]]. What follows (DEM/DWA) is owned here because it only makes sense inside an oversampled loop.

### Dynamic Element Matching and Data-Weighted Averaging

```tikz title="Data-weighted averaging as rotation: eight unit sources on a ring; each new code takes the next unused units. Codes 2, 4, 3, 6 select I1-I2, then I3-I6, then I7-I1, then I2-I7. Over time every unit is used equally often, so mismatch averages out and its error is pushed to high frequency. After Razavi Fig. 24.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i in {1,...,8} {
    \pgfmathsetmacro{\a}{112.5-45*\i}
    \node[draw,circle,inner sep=1pt,fill=white,font=\scriptsize] (u\i) at (\a:2.0) {$I_\i$};
  }
  \draw[->,thick,blue!70!black] (85:2.5) arc (85:5:2.5);
  \node[font=\scriptsize,blue!70!black,fill=white,inner sep=1pt] at (45:2.5) {1};
  \draw[->,thick,red!70!black] (0:2.85) arc (360:180:2.85);
  \node[font=\scriptsize,red!70!black,fill=white,inner sep=1pt] at (270:2.85) {2};
  \draw[->,thick,green!50!black] (175:3.2) arc (175:50:3.2);
  \node[font=\scriptsize,green!50!black,fill=white,inner sep=1pt] at (112.5:3.2) {3};
  \draw[->,thick,orange!80!black] (40:3.55) arc (40:-210:3.55);
  \node[font=\scriptsize,orange!80!black,fill=white,inner sep=1pt] at (-90:3.55) {4};
  \node[font=\scriptsize,align=left,anchor=west] at (4.2,0.6) {cycle 1: code 2 $\to I_1,I_2$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.2,0.1) {cycle 2: code 4 $\to I_3\ldots I_6$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.2,-0.4) {cycle 3: code 3 $\to I_7,I_8,I_1$};
  \node[font=\scriptsize,align=left,anchor=west] at (4.2,-0.9) {cycle 4: code 6 $\to I_2\ldots I_7$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{each new code selects the next unused units}\qquad I_{out} = I_0 + \frac{4}{\pi}\Delta I\cos(\pi f_St) - \frac{4}{3\pi}\Delta I\cos(3\pi f_St)+\cdots}
$$

- **Only intermediate levels carry nonlinearity:** the end points (all off, all on) are unique; their error is gain error. Each middle level can be made by many unit combinations, and the **average** over all combinations is the ideal point on the line (Razavi Eqs. 24.26–24.28).
- **DWA** (Baird and Fiez): rotate through the units so each is used equally often. With two units and a constant mid code, the mismatch becomes a square wave at $f_S/2$ (the formula above): the error is **first-order shaped**, removed by the decimator with the Q-noise (Razavi §24.2.3).
- **Randomised DEM** (Carley): pseudo-random assignment turns mismatch tones into **white** noise, not shaped. **Noise-shaping DEM** (Leung, Galton) is the most popular, allowing low OSR with coarse matching (Carusone §18.8.1).
- **DWA's costs:** in-band tones for some inputs, and its logic sits between quantizer and DAC, adding **excess loop delay**: serious in fast CT loops (Razavi §24.2.3).

> [!note]- Detail: other ways to make a multibit loop linear (Carusone §18.8)
> **Digital calibration** (Larson 1988): store each DAC level's true value in a $2^N$-word RAM and correct the output digitally (4-bit DAC, 18-bit linearity: 16 words × 18 bits = 288 bits; only the difference from the expected ~9-bit accuracy need be stored, 10-bit words). Calibrate by turning the loop into a 1-bit modulator and digitising each DAC level as a dc input.
> **Dual quantization** (Hairapetian 1994): a third-order loop with a 5-bit internal and a 1-bit final quantizer; after digital processing the 1-bit noise cancels, the 5-bit noise is third-order shaped and the 5-bit DAC's error only **second-order** shaped. Stability is that of a second-order loop.
> **Dynamically matched current sources** at the oversampled rate ([[DACs#Calibration Dynamically Matched Current Sources]]).

## Level 7: Decimation

### Two Jobs: Filter, Then Downsample

```tikz title="CIC (sinc^k) decimator: k accumulators at f_S, downsample by M, then k comb (differentiator) sections at f_S/M. Downsampling after the integrators is safe because they have already suppressed the high-frequency noise; 2's-complement wrap-around keeps the accumulators correct. After Razavi Fig. 24.31 and Carusone Fig. 18.19(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.3cm,minimum height=0.9cm,align=center,fill=gray!8}}
  \node[blk] (i1) at (1.3,0) {$\frac{1}{1-z^{-1}}$};
  \node at (2.6,0) {$\cdots$};
  \node[blk] (i2) at (3.9,0) {$\frac{1}{1-z^{-1}}$};
  \node[blk,minimum width=0.9cm] (ds) at (5.7,0) {$\downarrow M$};
  \node[blk] (c1) at (7.5,0) {$1-z^{-1}$};
  \node at (8.8,0) {$\cdots$};
  \node[blk] (c2) at (10.1,0) {$1-z^{-1}$};
  \draw[->] (-0.4,0) node[left] {$y[n]$} -- (i1);
  \draw[->] (i1) -- (2.25,0);
  \draw[->] (2.95,0) -- (i2);
  \draw[->] (i2) -- (ds);
  \draw[->] (ds) -- (c1);
  \draw[->] (c1) -- (8.45,0);
  \draw[->] (9.15,0) -- (c2);
  \draw[->] (c2) -- (11.6,0) node[right] {$D_{out}$};
  \draw[decorate,decoration={brace,amplitude=4pt}] (0.6,0.7) -- node[above=3pt,font=\scriptsize] {$k$ integrators at $f_S$} (4.6,0.7);
  \draw[decorate,decoration={brace,amplitude=4pt}] (6.8,0.7) -- node[above=3pt,font=\scriptsize] {$k$ combs at $f_S/M$} (10.8,0.7);
  \node[font=\scriptsize,align=center] at (5.7,-1.1) {comb $1-z^{-M}$ at $f_S$\\ $=1-z^{-1}$ at $f_S/M$};
\end{circuitikz}
\end{document}
```

$$
\boxed{H(z) = \left(\frac{1-z^{-M}}{1-z^{-1}}\right)^k\qquad |H| \propto \left|\frac{\sin(\pi fM/f_S)}{\sin(\pi f/f_S)}\right|^k\qquad k = L+1}
$$

- **Averaging alone does not give resolution:** counting the ONEs in each block of $M = 64$ bits yields only 6 bits whatever the loop order. The resolution comes from **filtering** (a running average at $f_S$), then downsampling (Razavi §24.4.1).
- The running average $1+z^{-1}+\cdots+z^{-(M-1)} = \frac{1-z^{-M}}{1-z^{-1}}$ is a sinc filter with nulls at multiples of $f_S/M$, exactly where downsampling would alias from. It factors into an accumulator and a comb: no multipliers.
- **Order** $k = L+1$ for an $L$-th order modulator: the filter's roll-off must beat the noise's rise (Carusone §18.4.1).
- **Never downsample first:** the shaped noise peaks at $f_S/2$ and would alias into the band (Razavi Ex. 24.10). Downsampling **between** integrators and combs is safe and saves power (Razavi Ex. 24.11).
- Higher $k$ means more noise rejection and more in-band **sinc droop**: follow the CIC with droop compensation.
- **Counter-based** (accumulate-and-dump): count ONEs for $MT_S$, latch, reset. A first-order sinc for 1-bit streams with no adder (Razavi §24.4.2).

> [!note]- Detail: multi-stage and single-stage decimators (Carusone §18.4)
> **Multi-stage:** a sinc$^{L+1}$ FIR drops the rate to $8f_B$, then either an IIR filter, or a chain of halfband FIRs (passband to $\pi/2$, every other coefficient zero, each allowing ÷2) plus a sinc-compensation FIR, reaches $2f_B$. The later stages also act as the sharp anti-alias filter the relaxed analog filter did not provide, and they correct the droop. Multipliers can often be avoided.
> **Single-stage:** one long FIR (e.g. 2048 taps for 1-bit outputs at OSR 64); multiplications by 1-bit inputs are trivial, outputs are computed only at the Nyquist rate, and 32 time-interleaved copies cut the accumulator clock to 3 MHz for a 48 kHz output. Grouping 4 input bits into a 16-word ROM lookup cuts the additions 4×.

> [!note]- Detail: the anti-alias filter is relaxed only on paper (Razavi Ex. 21.19)
> With oversampling only components near $f_S$ alias, so a simple RC can precede the ADC. But an unfiltered strong out-of-band interferer still reaches the modulator: the full scale must accommodate it without overload or nonlinearity (which could fold it onto the signal). In practice the front filter may need to be as selective as for a Nyquist ADC. CT loops help: their first integrator is itself a filter.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ OSR $M$ | $P_Q\propto M^{-(2L+1)}$; $kT/C$, op-amp, DT jitter ÷$M$ | $f_S$: op-amp GBW and slew, power; less signal bandwidth |
| ↑ order $L$ | $6L+3$ dB per octave of $M$ | Stability (1-bit, $L\ge3$), input back-off, more out-of-band noise for the decimator, more integrators |
| ↑ quantizer bits $B$ | 6 dB/bit; smaller steps (swing, slew, CT jitter); stability | Multibit DAC linearity (DEM/DWA, delay), flash power and loading |
| ↑ $C_S$ | $kT/C$ | Op-amp load: $g_m$ and $I_{SS}$ scale with it; area |
| ↓ $C_S/C_I$ (scaling) | Integrator swing | Lower effective loop gain at the quantizer; comparator noise matters more |
| ↑ op-amp $A_0$ | Leakage, closed-loop linearity, MASH matching | $L$, cascodes, swing |
| Feedforward loop filter | Integrators carry only $Q$: small swing; free STF | Active summer: power, excess delay |
| CT instead of DT | No sampler, implicit anti-aliasing, quiet input, higher speed | Jitter, excess loop delay, $RC$ tuning, slewing, resistive loads, DAC noise |
| MASH instead of single high-order loop | Unconditional stability | Analog-digital matching ($A_0\gtrsim200$, $RC = T_S$ in CT), multilevel output |
| Dither | Kills idle tones | ≈3 dB more noise, stability check |
| Higher CIC order $k$ | Out-of-band noise rejection | In-band droop, wordlength |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Oversampling ratio | $M = f_S/(2f_B)$ |
| Q-noise density | $S_Q = \Delta^2/(12f_S)$ |
| Oversampling only | $P_Q = \frac{\Delta^2}{12M}$; $+10\log M$ dB |
| Linear loop model | $Y = \frac{H}{1+H}X + \frac{1}{1+H}Q$; poles of $H$ = zeros of NTF |
| DT integrators | delaying $\frac{z^{-1}}{1-z^{-1}}$, non-delaying $\frac{1}{1-z^{-1}}$; CT equiv. $f_S\frac{C_S}{C_I}\frac1s$ |
| First order | $Y = z^{-1}X + (1-z^{-1})Q$; $\lvert NTF\rvert = 2\sin(\pi f/f_S)$ |
| First-order noise | $P_Q = \pi^2\Delta^2/(36M^3)$; 1-bit SNR $= 9M^3/(2\pi^2)$ |
| Second order | $Y = z^{-2}X + (1-z^{-1})^2Q$; $P_Q = \pi^4\Delta^2/(60M^5)$; 1-bit SNR $= 15M^5/(2\pi^4)$ |
| Order $L$ | $P_Q = \frac{\Delta^2}{12}\frac{\pi^{2L}}{(2L+1)M^{2L+1}}$; $6L+3$ dB/octave |
| SQNR (N-bit quantizer) | $6.02B+1.76-10\log\frac{\pi^{2L}}{2L+1}+(20L+10)\log M$ |
| 1-bit quantizer | $\Delta$ = output height; gain $\frac4\pi\frac AB$ falls with input |
| 2nd-order CT stability | $\frac{s^2}{s^2+bs+ab}$, needs $b>0$ (inner path) |
| Feedforward ($\alpha=2,\beta=1$) | $Y = X+(1-z^{-1})^2Q$; integrators carry only $Q$ |
| Stability rule | $\max\lvert NTF\rvert\lesssim1.5$ |
| CT first order | $\mathrm{SNR} = \frac{9f_S}{16\pi^2R_1^2C_1^2f_B^3}$; $= $ DT if $R_1C_1 = 1/f_S$ |
| CT swing | $V_0 = T_SV_{REF}/(2R_1C_1)$; near full scale $(2-\alpha)V_0$ |
| Second-stage referral | $V_{n,in} = (s/K_1)V_n$ |
| Capacitor mismatch | $\mathrm{NTF}\approx(1-z^{-1})(1-\frac{\Delta C}{C}z^{-1})$ |
| DT $kT/C$ | $2kT/(MC_S)$ per side |
| Op-amp noise | $\overline{V_n^2}G_m/(4C_S)$, then ÷$M$ |
| Leakage | $A_0>\frac{\sqrt{30}}{\pi}\frac{C_S}{C_I}M-1\approx1.7M$; design $A_0\ge2M$ |
| Comparator offset | $V_{OS}/(1+A_0)$ at the input |
| Linear settling | gain error $-e^{-t/\tau}$, $\tau = C_S/G_m$; 5 $\tau$ ≈ 0.7% |
| DT jitter | $P_j = A^2\omega^2\sigma_j^2/(2M)$ |
| Idle tones | dc $\frac{m-n}{m+n}V_{REF}$ → tones at $kf_S/(m+n)$ |
| CT slew | $SR > V_p/(R_1C_1)+I_0/C_1$ |
| CT resistor noise | $4kTR_1f_B = 2kT/(MC_S)$ for $R_1 = 1/(f_SC_S)$ |
| CT DAC noise ratio | $2\gamma V_{REF}/V_{OV}$ (s.e.), $\gamma V_{REF}/V_{OV}$ (diff.) |
| CT jitter | $\overline{V^2} = \frac1M(V_{REF}\sigma_j/T_S)^2$; SC DAC $C_D = T_S/R_1$ |
| Excess loop delay | $e^{-s\Delta T}\approx1-s\Delta T$: RHP zero at $1/\Delta T$ |
| 1-1 MASH | $W = z^{-1}Y_1-(1-z^{-1})Y_2 = z^{-2}U-(1-z^{-1})^2E_2$ |
| CT MASH match | $1/K_2 = T_S$ |
| Multibit | $\Delta = V_{FS}/2^n$; DAC error $\Delta V_j$ adds to input |
| DWA two units | mismatch at $f_S/2$: $\frac4\pi\Delta I\cos(\pi f_St)$ |
| CIC decimator | $\left(\frac{1-z^{-M}}{1-z^{-1}}\right)^k$, $k = L+1$ |
| Bandpass | $H = z/(z^2+1)$; OSR $= f_S/(2f_\Delta)$ |
| Spec → $C_S$ | $C_S\ge4kT/(MP_{kT/C})$ (diff.) |

## References

- **Razavi, *Analysis and Design of Data Converters* (2025)** (PDF page = printed + 19)
  - Ch. 21 Introduction to Oversampling ADCs, pp. 479–508: quantization noise as aliased harmonics (Exs. 21.1–21.2), Q-noise model, NTF/STF (Eqs. 21.3–21.8), time-domain shaping (Eq. 21.14), DT integrator and delaying/non-delaying forms (Eqs. 21.15–21.22, Exs. 21.7–21.10), first-order loop and $1-z^{-1}$ (Eqs. 21.23–21.42, Exs. 21.11–21.16), CT first-order loop, poles → NTF zeros (Eq. 21.44), second-order loop and the gain of 2 (Eqs. 21.45–21.59, Exs. 21.17–21.18), advantages and disadvantages (Ex. 21.19), DR/SNR/SNDR (Fig. 21.43, Ex. 21.20), 1-bit quantizer noise and gain (Ex. 21.21, Fig. 21.46).
  - Ch. 22 Basic Design of ΔΣ Modulators, pp. 509–532: parasitic-insensitive integrator, non-overlapping clocks, differential integrator and $V_{CM}$ (Exs. 22.1–22.2), subtraction, first-order 1-bit loop, timing, waveforms (Eqs. 22.1–22.6, Exs. 22.3–22.4), capacitor scaling (Figs. 22.13–22.14), SNR (Eqs. 22.7–22.10, Ex. 22.5), second-order loop, scaling (Fig. 22.16, Ex. 22.7), SNR (Eqs. 22.11–22.13, Ex. 22.8), CT stability (Eqs. 22.15–22.18), first-order CT loop, swing (Eqs. 22.19–22.35), CT SNR (Eqs. 22.36–22.44, Ex. 22.12), second-order CT (Eqs. 22.45–22.52, Ex. 22.13), non-overlapping clock generator (§22.5).
  - Ch. 23 Nonidealities in ΔΣ Modulators, pp. 533–558: capacitor mismatch (Eqs. 23.1–23.6, Ex. 23.1), $kT/C$ (Eqs. 23.7–23.9, Ex. 23.2), op-amp noise (Eq. 23.13, Ex. 23.3), op-amp gain and leakage (Eqs. 23.14–23.24), offset (Ex. 23.4), linear and nonlinear settling (Eqs. 23.25–23.26, Exs. 23.5–23.7), comparator offset and noise, reference settling (Eq. 23.27, Ex. 23.8), DT jitter (Eq. 23.28), idle tones and dither, noise folding (Eqs. 23.30–23.32, Ex. 23.9), CT slewing, CT noise (Eqs. 23.33–23.39, Exs. 23.10–23.11), resistive load, CT jitter and SC DAC (Eqs. 23.40–23.48, Ex. 23.12), comparator delay (Eqs. 23.49–23.51, Ex. 23.13), stability (§23.5).
  - Ch. 24 Advanced Oversampling ADCs, pp. 559–581: MASH 1-1, 2-1, 1-2 (Eqs. 24.1–24.9, Exs. 24.1–24.3), gain error in CT and DT cascades (Eqs. 24.10–24.24, Exs. 24.4–24.6), multibit quantizers, DAC nonlinearity (Ex. 24.7), DWA and rotation (Eqs. 24.25–24.28, Ex. 24.8), feedforward (Eqs. 24.29–24.33, Ex. 24.9), decimation, CIC, downsampling order, counter-based filter (Eqs. 24.34–24.38, Exs. 24.10–24.11).
  - Ch. 18 §18.6.3, pp. 408–410: op-amp noise of an MDAC (Eq. 18.57), used for the op-amp noise estimate.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - Ch. 18 Oversampling Converters, pp. 696–733: oversampling without shaping (Eqs. 18.10–18.14, Exs. 18.2–18.3), 1-bit DAC linearity (§18.1.4), NTF/STF (Eqs. 18.15–18.17), first- and second-order shaping (Eqs. 18.18–18.32, Exs. 18.4–18.5), 1-bit signal power (§18.2.6), error-feedback structure (§18.2.7), system architecture and DAC-dominated linearity (§18.3.1), multi-stage and single-stage decimation (Eqs. 18.35–18.41), higher-order interpolative and MASH (Eqs. 18.42–18.46), bandpass (Eqs. 18.47–18.48), stability rule (Eq. 18.49), two-level DAC memory and RZ coding, idle tones (Eqs. 18.50–18.51), dithering, op-amp gain (Eqs. 18.52–18.54), DEM, digital calibration, dual quantization (Eqs. 18.55–18.56), third-order design example (Eqs. 18.57–18.63).
- **Zettelkasten extensions** (`AnalogTheory/Oversampling and Delta-Sigma ADCs/`, S26; all sourced from Razavi DC): 26q (errors divided by the gain ahead, used as the organising Remark of Level 4), 26q3a (oversampling relaxes op-amp noise but not power), 26s2 (settling vs $kT/C$ vs power), 26v7 (three flavours of instability), 26x4b (only intermediate DAC levels carry nonlinearity), 26z4a (downsampling between integrators and combs).
- **Computed here, not in the sources:** the general order-$L$ formula's closed form (derived in a fold from the sources' $L = 1, 2$ cases), worked example B (all numbers from the formulas above with the stated assumptions: $\gamma = 1$, input-pair-only op-amp noise, 0.3 pF next-stage load, 0.5 ns slewing allowance).
