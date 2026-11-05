---
title: Data Converter Fundamentals
description: The shared vocabulary of every ADC and DAC note - LSB, quantization noise and 6.02N+1.76, aliasing, offset/gain/DNL/INL, SNDR/SFDR/ENOB/ERBW, Walden and Schreier figures of merit, the architecture map, and the generic ADC spec-to-block budget.
kind: topic
status: growing
aliases:
  - Data Converter Fundamentals
  - Data Conversion Fundamentals
  - ADC Fundamentals
  - Quantization Noise
  - DNL
  - INL
  - ENOB
---

This note is the entry point for every converter note ([[DACs]], [[Flash ADCs]], [[SAR ADCs]], [[Pipelined ADCs]], [[Interleaved ADCs]], [[Delta-Sigma ADCs]]). It treats the converter as a black box: what an ideal one does, how a real one is scored, and how a converter spec is split into budgets for the blocks inside. The architecture notes each specialise the [[#Spec translation|budget template]] below and import the metrics from here instead of redefining them.

## The big picture

```tikz title="An ADC is a sampler followed by a quantizer, behind an anti-alias filter. Every error budgeted in this note enters at one of these three blocks. After Razavi (Data Converters) Figs. 1.2, 1.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.9cm,minimum height=1.0cm,align=center,fill=gray!8}}
  \node[blk] (aaf) at (1.6,0) {anti-alias\\ LPF};
  \node[blk] (sh) at (5.4,0) {sampler\\ (S/H)};
  \node[blk] (q) at (9.4,0) {quantizer\\ $2^N$ levels};
  \draw[->] (-0.4,0) node[left] {$x(t)$} -- (aaf);
  \draw[->] (aaf) -- (sh);
  \draw[->] (sh) -- node[above,font=\scriptsize] {$y(nT_S)$} (q);
  \draw[->] (q) -- (11.6,0) node[right] {$D_{out}$};
  \draw[->] (5.4,1.4) node[above] {$f_S=1/T_S$} -- (sh);
  \node[font=\scriptsize,align=center] at (1.6,-1.0) {continuous time\\ continuous amplitude};
  \node[font=\scriptsize,align=center] at (5.4,-1.0) {discrete time\\ continuous amplitude};
  \node[font=\scriptsize,align=center] at (9.4,-1.0) {discrete time\\ discrete amplitude};
  \draw[dashed,gray] (0.0,-1.75) -- (11.4,-1.75);
  \node[font=\scriptsize,anchor=west] at (0.0,-2.05) {what each block adds (referred to the input):};
  \node[font=\scriptsize,align=center] at (1.6,-2.8) {aliased out-of-band\\ noise and tones};
  \node[font=\scriptsize,align=center] at (5.4,-2.8) {$kT/C$, jitter,\\ distortion, settling error};
  \node[font=\scriptsize,align=center] at (9.4,-2.8) {$\Delta^2/12$, comparator noise,\\ threshold errors (DNL, INL)};
\end{circuitikz}
\end{document}
```

> [!important] The six results every converter note builds on
> 1. **An ADC samples, then quantizes.** Sampling makes time discrete (and aliases anything above $f_S/2$); quantization makes amplitude discrete with step $\Delta = V_{FS}/2^N$ (1 LSB).
> 2. **Quantization noise** is uniform over $\pm\Delta/2$: power $\Delta^2/12$. For a full-scale sine, $\mathrm{SQNR} = 6.02N+1.76$ dB. Each bit is 6 dB.
> 3. **Static errors** are read off the staircase: offset (shift), gain error (slope), DNL (one step's width minus 1 LSB), INL (running sum of DNL). DNL $=-1$ LSB is a missing code.
> 4. **Dynamic errors** are read off the output spectrum: SNDR counts noise plus all harmonics, SFDR only the tallest spur. $\mathrm{ENOB} = (\mathrm{SNDR}-1.76)/6.02$, and it falls as $f_{in}\to f_S/2$.
> 5. **Figure of merit:** energy per conversion step, $P/(2f_{in}\cdot2^{\mathrm{ENOB}})$ (Walden). It assumes 2× power per bit; thermal-noise-limited designs pay 4× per bit, which is why the Schreier FoM exists.
> 6. **The budget:** losing $N-\mathrm{ENOB}$ bits lets the total noise grow to $\frac{\Delta^2}{12}4^{\,N-\mathrm{ENOB}}$. Everything above $\Delta^2/12$ is split among $kT/C$, jitter, comparator noise and reference noise; settling and matching get an error budget in LSBs.

**Map:** [[#Spec translation|spec translation (the template)]] → [[#Level 0 The Ideal Converter|ideal ADC and DAC]] → [[#Level 1 Quantization Noise|quantization noise]] → [[#Level 2 Sampling at the Converter Level|aliasing, Nyquist vs oversampling]] → [[#Level 3 Static Specifications|offset, gain, DNL, INL]] → [[#Level 4 Dynamic Specifications|SNDR, SFDR, ENOB, ERBW, jitter]] → [[#Level 5 Figures of Merit|Walden, Schreier]] → [[#Level 6 The Architecture Landscape|which architecture]].

## Spec translation

An ADC has no single amplifier, so its specs reach gm/ID in two hops: **ADC spec → noise and error budgets → block specs** (sampler, comparator, op amp, reference, clock). The block notes own the second hop; this section is the template every ADC note fills in.

```tikz title="The spec-translation template: an ADC spec splits into a noise budget (V^2, referred to the input) and an error budget (LSB), each of which becomes block specs."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,align=center,fill=gray!8,font=\scriptsize,minimum height=0.9cm}}
  \node[blk,minimum width=2.6cm] (spec) at (0,0) {ADC spec\\ $N$, $f_S$, $V_{FS}$\\ ENOB @ $f_{in}$, SFDR\\ DNL, INL, $P$};
  \node[blk,minimum width=3.0cm] (nb) at (4.4,1.3) {noise budget (V$^2$)\\ $P_{tot}=\frac{\Delta^2}{12}4^{\,N-\mathrm{ENOB}}$};
  \node[blk,minimum width=3.0cm] (eb) at (4.4,-1.3) {error budget (LSB)\\ settling $<\frac12$ LSB\\ DNL $<1$, INL, SFDR};
  \draw[->] (spec.east) -- (nb.west);
  \draw[->] (spec.east) -- (eb.west);
  \foreach \y/\t in {2.6/{$\Delta^2/12$: fixed by $N$},1.85/{$kT/C$ $\to$ $C_S$},1.1/{jitter $\to$ $\sigma_j$ of the clock},0.35/{comparator noise $\to$ $\sigma_n$}} { \node[font=\scriptsize,anchor=west] (n) at (6.6,\y) {\t}; \draw[->] (nb.east) -- (n.west); }
  \foreach \y/\t in {-0.6/{op-amp $A_0$, GBW, SR (MDAC, S/H)},-1.35/{comparator offset, DAC matching},-2.1/{sampler THD, reference settling}} { \node[font=\scriptsize,anchor=west] (e) at (6.6,\y) {\t}; \draw[->] (eb.east) -- (e.west); }
  \draw[decorate,decoration={brace,amplitude=4pt}] (11.7,2.8) -- (11.7,-2.3);
  \node[font=\scriptsize,align=left,anchor=west] at (11.9,0.25) {block specs\\ $\to$ gm/ID,\\ $I_D$, $L$};
\end{circuitikz}
\end{document}
```

**ADC specs** (Razavi DC §12.3; Carusone §15.5): resolution $N$, sample rate $f_S$, full scale $V_{FS}$, SNDR/ENOB at a stated $f_{in}$ (usually near $f_S/2$), SFDR at a stated amplitude, DNL/INL (and no missing codes), offset and gain error, latency, power or FoM.

**Step 1: the noise budget.** All random errors are referred to the input and add in power:

$$
\boxed{P_{n,tot} = \frac{\Delta^2}{12} + \underbrace{\frac{2kT}{C_S}}_{\text{sampler (diff.)}} + \underbrace{\frac{\sigma_j^2\omega_{in}^2A^2}{2}}_{\text{jitter}} + \underbrace{\sigma_{n,comp}^2}_{\text{comparator}} + \underbrace{\overline{v_{n,ref}^2}+\cdots}_{\text{reference, op amp}}\ \le\ \frac{\Delta^2}{12}\,4^{\,N-\mathrm{ENOB}}}
$$

Giving up half a bit ($\mathrm{ENOB} = N-0.5$) doubles the allowed noise: the non-quantization terms together may equal $\Delta^2/12$, i.e. **$\Delta/\sqrt{12}\approx0.29$ LSB rms**. Split three ways, each gets $\Delta/6\approx0.17$ LSB rms.

**Step 2: the error budget.** Deterministic errors are budgeted in LSB, not in noise power: residue/S/H settling to within ½ LSB, $|\mathrm{DNL}|<1$ LSB (comparator offset, DAC matching), INL and SFDR (sampler linearity, reference settling, matching).

| ADC budget item | Block | Block spec it imposes | Owner of the derivation |
|---|---|---|---|
| $kT/C$ share $P_{kTC}$ | Sampling capacitor (or SAR cap DAC) | $C_S\ge 2kT/P_{kTC}$ (differential) | [[Noise#kT/C Noise]], [[Sampling Circuits#Spec translation]] |
| Jitter share $P_j$ | Clock generator | $\sigma_j\le\sqrt{2P_j}/(A\,\omega_{in})$ | [[Sampling Circuits#Aperture Jitter]] |
| Comparator share $P_c$ | Comparator (preamp / StrongARM) | Input-referred noise $\sigma_n\le\sqrt{P_c}$ | [[Comparators#Spec translation]] |
| Reference noise | Bandgap + reference buffer | Noise referred directly to the input | [[Bandgap References]] |
| Settling to ½ LSB in $t_s$ | **Op amp** in S/H or MDAC | **DC gain** $A_0\ge2^{N+1}/\beta$, **GBW** $\omega_u\ge(N+1)\ln2/(\beta t_s)$, **slew rate** for the full-scale step, **output swing** = full scale | [[Sampling Circuits#Spec translation]], [[Operational Amplifiers]] |
| Sampler/front-end THD → SFDR | Switch, input **buffer** | **Linearity** (HD3 below the SFDR target at full scale), **output impedance** $\ll R_{on}$ | [[Sampling Circuits#Spec translation]], [[Nonlinearity and Mismatch]] |
| $\lvert\mathrm{DNL}\rvert<1$, INL | Comparator, DAC unit elements | **Offset** $\sigma_{V_{OS}}\ll1$ LSB (flash: every threshold); capacitor/current matching | [[Comparators#Spec translation]], [[DACs]] |
| Gain error | Reference ($V_{FS}$) | Reference accuracy and drift | [[Bandgap References]] |

$$
\boxed{C_S\ge\frac{2kT}{P_{kTC}}}\qquad\boxed{\sigma_j\le\frac{\sqrt{2P_j}}{A\,\omega_{in}}}\qquad\boxed{\sigma_{n,comp}\le\sqrt{P_c}}\qquad\boxed{A_0\ge\frac{2^{N+1}}{\beta},\ \ \omega_u\ge\frac{(N+1)\ln2}{\beta t_s}}
$$

> [!note]- Derivation: the noise ceiling $\frac{\Delta^2}{12}4^{\,N-\mathrm{ENOB}}$ and the block inequalities
> **Ceiling.** The ideal SQNR for a full-scale sine is $6.02N+1.76$ dB; the target SNDR is $6.02\,\mathrm{ENOB}+1.76$ dB. Same signal, so the noise may grow by $6.02(N-\mathrm{ENOB})$ dB, a power factor $10^{0.602(N-\mathrm{ENOB})} = 4^{N-\mathrm{ENOB}}$. Quantization keeps its $\Delta^2/12$; the rest, $\frac{\Delta^2}{12}(4^{N-\mathrm{ENOB}}-1)$, is the circuit-noise allowance (distortion also has to fit, if the spec is SNDR rather than SNR).
>
> **$kT/C$.** Each sampling capacitor holds $kT/C_S$; a differential input has two uncorrelated ones, $2kT/C_S$ (Razavi DC Eq. 15.14). Set it equal to the share and invert.
>
> **Jitter.** An edge error $\Delta T$ on $A\sin\omega_{in}t$ gives $\Delta V = \Delta T\,A\omega_{in}\cos\omega_{in}t$, power $\sigma_j^2A^2\omega_{in}^2/2$ (Razavi DC Eq. 3.88). Set equal to $P_j$ and invert.
>
> **Comparator.** Its input-referred noise lands directly on the decision threshold, so it adds $\sigma_n^2$ to the input-referred noise.
>
> **Settling.** Finite gain leaves a static error $1/(A_0\beta)$, single-pole settling leaves $e^{-\beta\omega_ut_s}$; each must be below $2^{-(N+1)}$ (½ LSB of full scale). The derivation is in [[Sampling Circuits#Spec translation]]; in a pipeline, $N$ becomes the resolution still to be resolved after the stage ([[Pipelined ADCs]]).

| Block spec | Lands on | Why |
|---|---|---|
| $C_S$ (from $kT/C$) | Load capacitance $C_L$ of the driver and op amp | Bigger $C_S$ means more $g_m$ for the same speed |
| Op-amp GBW | $g_m=\omega_uC_L$, then $I_D=g_m/(g_m/I_D)$ | Every $C_S$ quadrupling (1 bit of $kT/C$) quadruples $I_D$ |
| Op-amp $A_0$ | $g_mr_o$: $L$, cascoding | $A_0\ge2^{N+1}/\beta$ |
| Slew rate | $I_D$ directly | $SR=I/C_L$; the larger of the GBW and SR currents wins |
| Comparator noise | $g_m$ (preamp) or $(g_m/I_D)\cdot C$ (StrongARM) | Thermal noise $\propto kT/C$ of its own nodes |
| Comparator offset | $WL$ of the input pair, high $g_m/I_D$ | Pelgrom: $\sigma\propto1/\sqrt{WL}$ |
| Buffer linearity, $R_{out}$ | $g_m\gg1/R_{on}$; lower $g_m/I_D$ on the follower | A follower's $R_{out}\approx1/g_m$ |

> [!tip] Remark
> Amplifier spec names are the ones in [[Single-Stage#Amplifier Specifications]]; the step from $g_m/I_D$, $L$, $I_D$ to a width is [[gm-ID Design Methodology]]. This note stops at the block spec.

**Worked example A (Razavi DC §15.2.1, SAR cap DAC).** The $kT/C$ penalty is the ratio of the ideal SNR to the SNR with $2kT/C_{DAC}$ added:

$$
\boxed{\text{SNR penalty} = 1+\frac{24kT}{\Delta^2C_{DAC}}}
$$

With $\Delta = 1$ mV and $C_{DAC} = 0.5$ pF at 300 K: penalty $=1.2$, i.e. **0.8 dB**. The unit capacitor is then $C_u = 0.5\ \text{pF}/2^N$, unless matching demands more.

**Worked example B (Razavi DC Exs. 3.25, 3.26, jitter plus $kT/C$).** 60 dB at $f_{in}=5$ GHz from jitter alone needs $\sigma_j = 32$ fs. Add $kT/C$ of 1 pF with a 0.5 Vpp single-ended input: jitter $3.1\times10^{-8}$ V², $kT/C$ $4.1\times10^{-9}$ V², overall **59.5 dB**.

**Worked example C (the template, numbers computed here from the formulas above).** 10 bits, $V_{FS}=1$ V differential ($A=0.5$ V), $f_S = 100$ MS/s, target ENOB $=9.5$ at $f_{in}=50$ MHz, 300 K.
1. $\Delta = 0.977$ mV, $\Delta^2/12 = 7.9\times10^{-8}$ V², SQNR $=62.0$ dB. ENOB 9.5 (59.0 dB) allows $1.59\times10^{-7}$ V² total, so $7.9\times10^{-8}$ V² for circuits.
2. Split equally three ways: $2.65\times10^{-8}$ V² each ($\Delta/6 = 163\ \mu$V rms).
3. $kT/C$: $C_S\ge 2kT/2.65\times10^{-8} = $ **0.31 pF per side**.
4. Jitter: $\sigma_j\le\sqrt{5.3\times10^{-8}}/(0.5\cdot2\pi\cdot50\ \text{MHz}) = $ **1.5 ps rms**. (The same share at $f_{in}=2.5$ GHz would need 29 fs: the jitter line is what makes GS/s converters hard.)
5. Comparator: $\sigma_n\le$ **163 µV rms**.
6. A ×2 S/H ($\beta=\tfrac{1}{2}$) settling in $t_s=5$ ns (half a period): $A_0\ge 4096$ (**72 dB**), $\omega_u\ge 11\ln2/(0.5\cdot5\ \text{ns}) = 3.05\times10^9$ rad/s (**485 MHz**). With $C_L\approx0.5$ pF, $g_m\approx1.5$ mS; at $g_m/I_D = 15$ S/A, $I_D\approx0.1$ mA.

## Level 0: The Ideal Converter

### The ADC Characteristic

```tikz title="Ideal 3-bit ADC characteristic (top) and its quantization noise after removing the Delta/2 mean (bottom): a sawtooth confined to plus or minus half an LSB. After Razavi (Data Converters) Figs. 12.1, 12.4, 12.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.75cm,y=0.42cm]
  \draw[->] (0,0) -- (9.2,0) node[right] {$V_{in}$};
  \draw[->] (0,0) -- (0,8.6) node[above] {$D_{out}$};
  \foreach \k in {0,...,7} {
    \draw[very thick] (\k,\k) -- ({\k+1},\k);
    \ifnum\k>0 \draw[thin] (\k,{\k-1}) -- (\k,\k); \fi
    \node[left,font=\scriptsize] at (0,\k) {\k};
  }
  \foreach \k/\l in {1/\Delta,2/2\Delta,3/3\Delta,4/4\Delta,5/5\Delta,6/6\Delta,7/7\Delta} { \node[below,font=\scriptsize] at (\k,0) {$\l$}; }
  \node[below,font=\scriptsize] at (8,0) {$V_{FS}$};
  \draw[dashed] (0,0) -- (8,8) node[above right,font=\scriptsize] {$V_{in}/\Delta$};
  \draw[<->] (2,1.5) -- (3,1.5) node[midway,below,font=\scriptsize] {1 LSB};
  \node[font=\scriptsize,anchor=west] at (4.6,1.6) {decision thresholds $V_j = j\Delta$};
  \node[font=\scriptsize,anchor=west] at (4.6,0.8) {$\Delta = V_{FS}/2^N$};
  \begin{scope}[yshift=-4.6cm]
    \draw[->] (0,0) -- (9.2,0) node[right] {$V_{in}$};
    \draw[->] (0,-1.9) -- (0,2.4) node[above] {$n_q=\epsilon_q-\frac{\Delta}{2}$};
    \foreach \k in {0,...,7} { \draw[thick] (\k,-1.5) -- ({\k+1},1.5); \ifnum\k>0 \draw[thin,dotted] (\k,1.5) -- (\k,-1.5); \fi }
    \draw[dotted] (8,1.5) -- (8,-1.5);
    \node[left,font=\scriptsize] at (0,1.5) {$+\frac{\Delta}{2}$};
    \node[left,font=\scriptsize] at (0,-1.5) {$-\frac{\Delta}{2}$};
    \draw[gray] (0,1.5) -- (8,1.5); \draw[gray] (0,-1.5) -- (8,-1.5);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta = 1\ \text{LSB} = \frac{V_{FS}}{2^N},\qquad D_{out} = \left\lfloor\frac{V_{in}}{\Delta}\right\rfloor\ \text{(Razavi's convention)}}
$$

- Vocabulary (Razavi DC §12.1): each jump is a **code transition**; the input at which it happens is a **decision threshold** $V_j$; the input spacing between jumps is the **analog LSB** $\Delta$; one output count is the **digital LSB**; the input range is the **full scale** $V_{FS}$.
- An N-bit quantizer has $2^N$ levels, $2^N-1$ thresholds. Typical $N$: 4 to 20 bits, most often 6 to 12 (Razavi DC §1.1).
- Resolution ($N$) is not accuracy: a converter can have 12-bit resolution and 10-bit accuracy, or the reverse (Carusone §15.5.3).

> [!note]- Detail: truncation vs rounding (Razavi vs Carusone)
> Razavi puts the first threshold at $\Delta$ (truncation), so the raw error $\epsilon_q$ runs from 0 to $\Delta$ with mean $\Delta/2$; he subtracts that mean to get the zero-mean noise $n_q$. Carusone shifts every threshold by $-\tfrac{1}{2}$ LSB (first transition at $\tfrac{1}{2}\,V_{LSB}$) so the midpoints of the steps sit on the ideal DAC line and the error is $\pm\tfrac{1}{2}$ LSB directly. Same staircase, shifted by half a step; the noise power is identical. Carusone's offset definition (below) is relative to that ½-LSB first transition.
>
> Carusone also notes the quantizer only stays within $\pm\tfrac{1}{2}$ LSB when the input stays within ½ LSB of the end transitions; beyond that it is **overloaded** and the error grows without bound (clipping).

### The DAC Characteristic

$$
\boxed{V_{out} = V_{ref}\left(b_12^{-1}+b_22^{-2}+\cdots+b_N2^{-N}\right),\qquad V_{LSB} = \frac{V_{ref}}{2^N}}
$$

- The output is a well-defined level per code, so an ideal DAC has **no** quantization error; its largest output is $V_{ref}-V_{LSB}$, not $V_{ref}$ (Carusone §15.1).
- The output can be a voltage, a current, a charge or a time (Razavi DC §1.2).
- It is continuous in time but not in amplitude: the held staircase has high-frequency content, so a standalone DAC is followed by a reconstruction low-pass filter. DACs also sit *inside* SAR and pipelined ADCs (Razavi DC §1.2).
- Carusone Ex. 15.1: 8 bits, $V_{ref}=5$ V, $B_{in}=10110100$ gives $0.703125\cdot5 = 3.516$ V; $V_{LSB} = 19.5$ mV.

> [!tip] Remark
> DAC architectures and DAC-specific errors (glitches, settling, unit-element matching) are owned by [[DACs]]. This note only fixes the vocabulary both directions share.

> [!note]- Detail: signed codes (Carusone §15.4)
> A bipolar converter spans $\pm\tfrac{1}{2}V_{ref}$. Four 4-bit encodings of the integers $-8\ldots+7$:
>
> | Code | $+5$ | $-5$ | Two zeros? | Note |
> |---|---|---|---|---|
> | Sign-magnitude | 0101 | 1101 | yes | MSB = sign |
> | 1's complement | 0101 | 1010 | yes | invert all bits |
> | Offset binary | 1101 | 0011 | no | unipolar code shifted by $2^{N-1}$; $V_{out} = V_{ref}B_{in}-\tfrac{1}{2}V_{ref}$ |
> | 2's complement | 0101 | 1011 | no | offset binary with MSB inverted; plain addition works, intermediate overflow is harmless if the final sum fits |
>
> 2's complement is the usual choice wherever the codes feed arithmetic (Carusone Ex. 15.3: $2/8+7/8-3/8$ overflows midway and still ends at $6/8$).

## Level 1: Quantization Noise

### Quantization Noise Power

$$
\boxed{n_q\sim\mathcal{U}\!\left(-\tfrac{\Delta}{2},+\tfrac{\Delta}{2}\right)\ \Rightarrow\ P_{n_q} = \frac{\Delta^2}{12},\qquad V_{Q,rms} = \frac{\Delta}{\sqrt{12}}}
$$

- The quantizer output is *exactly* input plus error, $V_1 = V_{in}+V_Q$ (Carusone Eq. 15.10). The approximation is only in treating $V_Q$ as uniform random noise independent of the input.
- The error depends only on the input *level*, not on the waveform shape (at low frequencies), which is why it can be modelled as additive noise at all (Razavi DC §12.2.1).
- Each extra bit halves $\Delta$: **−6 dB of noise per bit**.

> [!note]- Derivation: two routes to $\Delta^2/12$
> **Stochastic (Razavi DC Eq. 12.4, Carusone Eq. 15.14).** Uniform PDF of height $1/\Delta$ on $\pm\Delta/2$:
> $$P = \int_{-\Delta/2}^{\Delta/2}x^2\frac{1}{\Delta}\,dx = \frac{1}{\Delta}\cdot\frac{2}{3}\left(\frac{\Delta}{2}\right)^3 = \frac{\Delta^2}{12}$$
> **Deterministic (Carusone Eq. 15.11).** A ramp input makes $V_Q$ a sawtooth $-\Delta t/T$ over $\pm T/2$; its mean square over one period is the same integral with $t$ in place of $x$. Random samples of a sawtooth *are* uniformly distributed, so the two routes must agree.

> [!warning] When the uniform model fails
> A periodic input gives a periodic error, which is harmonics, not noise (Razavi DC Ex. 12.2, Ch. 21). The model is still a good estimate for $N\gtrsim3$, and for $\gtrsim4$ bits the quantization harmonics are spread so evenly that they behave like a flat floor. For a 1-bit quantizer (a comparator) it is badly wrong; [[Delta-Sigma ADCs]] revisit this.

### SQNR = 6.02N + 1.76 dB

$$
\boxed{\mathrm{SQNR} = \frac{A^2/2}{\Delta^2/12} = \frac32\,2^{2N}\quad\Longrightarrow\quad \mathrm{SQNR_{dB}} = 6.02N+1.76}
$$

- Full-scale sine: $A = V_{FS}/2$, $\Delta = V_{FS}/2^N$. A 10-bit ADC can never exceed ≈62 dB; 12 bits ≈74 dB.
- For a smaller sine the SQNR drops dB-for-dB: **SQNR = 6.02N + 1.76 + (input level in dBFS)**. Carusone Ex. 15.2: 200 mVpp into a 12-bit, 5 V-full-scale ADC is 28 dB below full scale, so 74 − 28 = **46 dB**.
- The 1.76 dB is the sine's crest-factor bonus: a uniformly distributed (sawtooth) full-scale input gives exactly $6.02N$ (Carusone Eq. 15.15).
- Driving past full scale clips the output at all-ones: large distortion, not more SNR (Razavi DC §12.2.2).

> [!tip] Remark
> This assumes the uniform model, i.e. $N\gtrsim4$ ([[#Quantization Noise Power]]). For a 1-bit quantizer there is no analog $\Delta$: Razavi takes $\Delta = 2V_{REF}$ (the full output height) and lands 6 dB below Carusone's $6.02N+1.76$ at $N=1$. The convention used in this vault is in [[Delta-Sigma ADCs#Spec translation]] and [[Delta-Sigma ADCs#The 1-Bit Quantizer Has No Δ and No Fixed Gain]].

> [!tip] Remark
> Turn it around and this is the design entry point: the application's required SNR picks $N$, with margin for the circuit noise in [[#Spec translation]]. Razavi DC Eq. (1.1) prints "1.74"; $10\log_{10}1.5 = 1.76$, which is the value in Eq. (12.10) and in Carusone.

## Level 2: Sampling at the Converter Level

### Aliasing and Nyquist Zones

```tikz title="Top: sampling folds every input frequency into the first Nyquist zone. Bottom: an input just below f_S/2 folds its own harmonics back next to itself. After Razavi (Data Converters) Fig. 12.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.6,0) node[right] {$f_{in}$};
  \draw[->] (0,0) -- (0,2.6) node[above] {$f_{out}$};
  \draw[very thick] (0,0) -- (2,2) -- (4,0) -- (6,2) -- (8,0);
  \foreach \x/\l in {2/{f_S/2},4/{f_S},6/{3f_S/2},8/{2f_S}} { \draw[dotted] (\x,0) -- (\x,2.2); \node[below,font=\scriptsize] at (\x,0) {$\l$}; }
  \node[left,font=\scriptsize] at (0,2) {$f_S/2$};
  \draw[dotted] (0,2) -- (2,2);
  \node[font=\scriptsize] at (1,2.45) {zone 1};
  \node[font=\scriptsize] at (3,2.45) {zone 2};
  \node[font=\scriptsize] at (5,2.45) {zone 3};
  \node[font=\scriptsize] at (7,2.45) {zone 4};
  \fill (2.9,1.1) circle (0.06);
  \draw[->,dashed] (2.9,1.1) -- (0.02,1.1);
  \node[font=\scriptsize,left] at (0,1.1) {$f_S-f_{in}$};
  \draw[dashed] (2.9,0) -- (2.9,1.1);
  \node[below,font=\scriptsize] at (2.9,-0.3) {$f_{in}$};
  \begin{scope}[yshift=-3.6cm]
    \draw[->] (0,0) -- (8.6,0) node[right] {$f$};
    \draw[dotted] (4,0) -- (4,2.4) node[above right,font=\scriptsize] {$f_S/2$};
    \node[below,font=\scriptsize] at (0,0) {$0$};
    \draw[very thick] (3.7,0) -- (3.7,2.2) node[above left,font=\scriptsize] {$f_{in}$};
    \draw[thick] (0.6,0) -- (0.6,1.0) node[above,font=\scriptsize] {HD2};
    \node[below,font=\scriptsize] at (0.6,0) {$2\Delta f$};
    \draw[thick] (3.1,0) -- (3.1,0.7) node[above,font=\scriptsize] {HD3};
    \node[below,font=\scriptsize] at (3.1,0) {$\frac{f_S}{2}-3\Delta f$};
    \draw[<->] (3.7,-0.3) -- (4,-0.3) node[midway,below,font=\scriptsize] {$\Delta f$};
    \node[font=\scriptsize,anchor=west,align=left] at (4.4,1.4) {$f_{in}=f_S/2-\Delta f$: harmonics at\\ $2f_{in}$, $3f_{in}$ fold back into zone 1,\\ often right next to the signal};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{f_S > 2f_{max}\ \text{(Nyquist)},\qquad f_{alias} = \lvert f_{in}-kf_S\rvert\ \text{folded into}\ 0\ldots f_S/2}
$$

- After sampling, every input frequency lands somewhere in the **first Nyquist zone** $0\ldots f_S/2$; the zones fold like a paper fan. Anything in zones 2, 3, ... that reaches the sampler, noise included, lands in band and cannot be filtered out afterwards. Hence the **anti-alias filter** in front.
- **Harmonics fold too.** For $f_{in} = f_S/2-\Delta f$, HD2 lands at $2\Delta f$ and HD3 at $f_S/2-3\Delta f$, right beside the signal (Razavi DC Ex. 12.8). This is why distortion generated in the sampler can't be removed digitally.
- **Uniform** sampling is a convention, not a theorem requirement (Razavi DC Ex. 1.2); it wins because a fixed $T_S$ gives the digital back end fixed coefficients. Non-uniform spacing returns as a *defect* in [[Interleaved ADCs]] (timing skew).

> [!tip] Remark
> The impulse-train picture of sampling (spectrum copied to every $kf_S$, ZOH sinc) and the circuit that does it are in [[Sampling Circuits#Impulse Sampling and Aliasing]]. The discrete-time signal and its DTFT, which is periodic in $2\pi$ for the same reason, are in [[Discrete Signals and Systems]] and [[Discrete-Time Fourier Transform]].

### Nyquist-Rate vs Oversampling Converters

| | Nyquist-rate | Oversampling |
|---|---|---|
| Sample rate | 1.5–10× the Nyquist rate (3–20× the signal bandwidth) in practice | 10–512× (Carusone); "e.g. 8 or 16×" (Razavi) |
| Input ↔ output | One output word per input sample | Each output word depends on many samples |
| SNR beyond $6.02N+1.76$ | No | Yes: quantization noise outside the band is filtered away, often after **noise shaping** |
| Typical resolution | up to ≈12–16 b | above ≈12 b |

$$
\boxed{M = \mathrm{OSR} = \frac{f_S}{2f_B}}
$$

Sources: Carusone Ch. 15 intro, Razavi DC §21 intro. Even without noise shaping, spreading $\Delta^2/12$ (and $kT/C$) over $0\ldots f_S/2$ and keeping only $0\ldots f_B$ cuts the in-band power by $M$ (Razavi DC §23.1.2). The rest belongs to [[Delta-Sigma ADCs]].

> [!note]- Why Nyquist-rate converters don't run at exactly $2f_{max}$
> A brick-wall anti-alias (and reconstruction) filter is impractical. Sampling a bit faster leaves a transition band for a realizable filter, hence Carusone's 1.5–10× (§15 intro).

## Level 3: Static Specifications

Static specs are measured with a slow ramp (or a slow sine histogram): they describe the DC staircase only (Carusone §15.5.3, Razavi DC §12.3.7).

### Offset and Gain Error

```tikz title="Offset shifts every threshold by the same voltage; gain error scales the step (and the full scale). After Razavi (Data Converters) Figs. 12.9, 12.10 and Carusone Fig. 15.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.55cm,y=0.42cm]
  \foreach \ox/\ttl in {0/{offset: every threshold shifts by $V_{OS}$},11/{gain error: $\Delta_{act}\neq\Delta$, so $V_{FS}$ moves}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (0,0) -- (9,0) node[right] {$V_{in}$};
      \draw[->] (0,0) -- (0,8.4) node[above] {$D_{out}$};
      \foreach \k in {0,...,7} { \draw[gray] (\k,\k) -- ({\k+1},\k); \ifnum\k>0 \draw[gray] (\k,{\k-1}) -- (\k,\k); \fi }
      \node[font=\scriptsize] at (4.5,-1.3) {\ttl};
    \end{scope}
  }
  \foreach \k in {0,...,7} {
    \draw[very thick] ({max(\k-0.6,0)},\k) -- ({\k+0.4},\k);
    \ifnum\k>0 \draw[very thick] ({\k-0.6},{\k-1}) -- ({\k-0.6},\k); \fi
  }
  \draw[<->] (3.4,3.5) -- (4,3.5);
  \node[font=\scriptsize,anchor=west] at (4.05,3.5) {$V_{OS}$};
  \begin{scope}[xshift=11cm]
    \foreach \k in {0,...,7} {
      \draw[very thick] ({0.8*\k},\k) -- ({0.8*\k+0.8},\k);
      \ifnum\k>0 \draw[very thick] ({0.8*\k},{\k-1}) -- ({0.8*\k},\k); \fi
    }
    \node[below,font=\scriptsize] at (6.4,0) {$V_{FS,act}$};
    \node[below,font=\scriptsize] at (8.3,0) {$V_{FS}$};
    \node[font=\scriptsize,anchor=west] at (5.0,2.6) {black: $\Delta_{act}<\Delta$};
    \node[font=\scriptsize,anchor=west] at (5.0,1.8) {(positive gain error)};
  \end{scope}
  \node[font=\scriptsize,anchor=west] at (5.2,1.5) {gray: ideal};
\end{circuitikz}
\end{document}
```

$$
\boxed{E_{off,ADC} = \frac{V_{0\ldots01}}{V_{LSB}}-\tfrac12\ \text{LSB}\qquad E_{gain,ADC} = \left(\frac{V_{1\ldots1}}{V_{LSB}}-\frac{V_{0\ldots01}}{V_{LSB}}\right)-(2^N-2)}
$$

- **Offset:** a constant shift of every threshold (equivalently, a vertical shift of the curve). Example source: a sampler's pedestal from charge injection (Razavi DC §12.3.1), or comparator offset.
- **Gain error:** the slope is wrong because the actual LSB $\ne\Delta$, which usually means $V_{FS}$ (the reference) moved. $\Delta_{act}<\Delta$ is *positive* gain error. It is measured at full scale after removing offset.
- A thermometer reading −20 to +60 °C (Razavi DC Ex. 12.3): offset adds the same 2 °C everywhere; a +2% gain error multiplies every reading by 1.02, so the error grows toward full scale.
- Neither distorts the signal; both are usually trimmed or calibrated out. **Absolute accuracy** includes them; **relative accuracy** (= max INL) does not (Carusone §15.5.3).

> [!note]- Detail: why gain error can't be read off one curve (Razavi DC §12.3.2)
> Offset is visible as an absolute shift of the first threshold. Gain error is a ratio $\Delta_{act}/\Delta_{nom}$, and a measured curve gives only $\Delta_{act}$. Without the nominal $V_{FS}$ (the reference value the design intended) it is undefined. This is why reference accuracy and gain error are the same spec.

> [!tip] Remark
> These are the converter versions of the offset and gain error of any circuit (Razavi DC §2.4): offset is a vertical shift, gain error a wrong slope, nonlinearity a slope that changes with input. The general treatment is [[Nonlinearity and Mismatch]].

### DNL and Missing Codes

```tikz title="(a) DNL is each step's width minus 1 LSB (Razavi's numbers). (b) DNL = -1 LSB merges two thresholds: a missing code. After Razavi (Data Converters) Figs. 12.11, 12.12(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.1cm,y=0.75cm]
  \draw[->] (0,0) -- (4.6,0) node[right] {$V_{in}/\Delta$};
  \draw[->] (0,0) -- (0,4.0) node[above] {$D_{out}$};
  \foreach \k/\c in {0/00,1/01,2/10,3/11} { \node[left,font=\scriptsize] at (0,\k) {\c}; }
  \foreach \k in {1,2,3,4} { \node[below,font=\scriptsize] at (\k,0) {\k}; \draw[gray,dotted] (\k,0) -- (\k,3.6); }
  \draw[very thick] (0,0) -- (0.7,0) -- (0.7,1) -- (2.2,1) -- (2.2,2) -- (3.5,2) -- (3.5,3) -- (4.3,3);
  \node[font=\scriptsize,above] at (0.7,1.05) {$0.7$};
  \node[font=\scriptsize,above] at (2.2,2.05) {$2.2$};
  \node[font=\scriptsize,above] at (3.5,3.05) {$3.5$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.2,-1.3) {DNL$_1=0.7-0-1=-0.3$\\ DNL$_2=2.2-0.7-1=+0.5$\\ DNL$_3=3.5-2.2-1=+0.3$};
  \node[font=\scriptsize] at (2.2,4.6) {(a) DNL: step width $-$ 1 LSB};
  \begin{scope}[xshift=7.0cm]
    \draw[->] (0,0) -- (4.6,0) node[right] {$V_{in}/\Delta$};
    \draw[->] (0,0) -- (0,4.0) node[above] {$D_{out}$};
    \foreach \k/\c in {0/00,1/01,2/10,3/11} { \node[left,font=\scriptsize] at (0,\k) {\c}; }
    \foreach \k in {1,2,3,4} { \node[below,font=\scriptsize] at (\k,0) {\k}; \draw[gray,dotted] (\k,0) -- (\k,3.6); }
    \draw[very thick] (0,0) -- (1,0) -- (1,1) -- (2,1) -- (2,3) -- (4.3,3);
    \draw[->] (2.8,1.5) -- (2.08,2.0);
    \node[font=\scriptsize,anchor=west,align=left] at (2.8,1.4) {$V_2=V_3$: code 10\\ never appears};
    \node[font=\scriptsize,align=left,anchor=west] at (0.2,-1.3) {DNL$_3=V_3-V_2-1=-1$ LSB\\ $\Rightarrow$ missing code};
    \node[font=\scriptsize] at (2.2,4.6) {(b) DNL $=-1$ LSB};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{DNL}_j = V_j-V_{j-1}-1\ \text{LSB}}\qquad\boxed{\mathrm{DNL}=-1\ \text{LSB}\ \Rightarrow\ \text{missing code (always)}}
$$

- DNL is the error in one **step width**, measured on the analog axis. Target $|\mathrm{DNL}|<1$ LSB (Razavi DC §12.3.3).
- Sources: comparator offsets displace individual thresholds; capacitor or current-source mismatch in DAC-based ADCs.
- **DNL $=-1$:** two thresholds coincide, a code vanishes. **DNL $=+1$:** a missing code only if the neighbouring threshold did not also move (Razavi DC Ex. 12.4).
- No missing codes is guaranteed if $\max|\mathrm{DNL}|<1$ LSB or $\max|\mathrm{INL}|<\tfrac{1}{2}$ LSB (Carusone §15.5.3).
- **Monotonicity** is the DAC counterpart: output never decreases as the code increases. Guaranteed by $\max|\mathrm{DNL}|<1$ LSB or $\max|\mathrm{INL}|<\tfrac{1}{2}$ LSB, but many monotonic DACs have larger DNL.
- Positive DNL accumulated over a region **lowers** the local slope; negative DNL raises it. DNL and gain error are the same effect at different scales (Razavi DC Ex. 12.5).

> [!warning] Axis convention: ADC vs DAC
> In both, DNL and INL are measured along the **analog** axis. For an ADC that is the *input* (threshold spacing); for a DAC it is the *output* (level spacing). The plot is usually against the output code anyway, which only matters if you are reading off a position, not a maximum (Razavi DC §12.3.3).

### INL

```tikz title="INL is the horizontal gap from each threshold to the end-point line, and equals the running sum of DNL. After Razavi (Data Converters) Figs. 12.14, 12.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.7cm,y=0.42cm]
  \draw[->] (0,0) -- (9,0) node[right] {$V_{in}$};
  \draw[->] (0,0) -- (0,8.6) node[above] {$D_{out}$};
  \draw[dashed] (0,0) -- (8,8) node[above,font=\scriptsize] {end-point line, thresholds at $j\Delta$};
  \foreach \k in {1,...,7} {
    \pgfmathsetmacro{\v}{\k - 0.09*\k*(8-\k)}
    \pgfmathsetmacro{\vn}{(\k+1) - 0.09*(\k+1)*(7-\k)}
    \draw[very thick] (\v,{\k-1}) -- (\v,\k);
    \ifnum\k<7 \draw[very thick] (\v,\k) -- (\vn,\k); \else \draw[very thick] (\v,\k) -- (8.4,\k); \fi
  }
  \draw[very thick] (0,0) -- ({1-0.09*7},0);
  \draw[<->] ({4-0.09*16},3.5) -- (4,3.5);
  \node[font=\scriptsize,anchor=west] at (4.1,3.2) {INL$_4=V_4-4\Delta$};
  \begin{scope}[yshift=-3.0cm]
    \draw[->] (0,0) -- (9,0) node[right] {$V_{in}$};
    \draw[->] (0,-2.0) -- (0,0.8) node[above] {INL};
    \draw[thick,domain=0:8,samples=40] plot (\x,{-0.12*\x*(8-\x)});
    \node[font=\scriptsize,anchor=west] at (8.2,-0.9) {$\mathrm{INL}_j=\sum_{k\le j}\mathrm{DNL}_k$};
    \draw[dashed,gray] (0,-0.96) -- (8,-0.96);
    \node[font=\scriptsize,anchor=west,gray] at (8.2,-1.8) {single-sign: half is really offset};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{INL}_j = V_j - j\Delta = \sum_{k=1}^{j}\mathrm{DNL}_k}
$$

- INL is the **horizontal** distance from each threshold to the straight line, here the **end-point** line (offset and gain removed). A **best-fit** line gives smaller numbers; know which one a datasheet uses (Carusone Fig. 15.10).
- It is the static picture of distortion: a bowed INL is a curved transfer, which shows up dynamically as harmonics.
- **A single-sign INL hides an offset.** Shift the line so the peaks are $\pm\alpha$: the converter then has offset $\alpha$ plus peak INL $\pm\alpha$, half the naive number (Razavi DC §12.3.4).
- **Smaller swing, less INL, less SNR.** Using half the full scale reduces the curvature the signal sees but costs 6 dB of SQNR: the linearity-vs-SNR trade every architecture faces (Razavi DC §12.3.4).

> [!note]- Derivation: INL is the running sum of DNL (Razavi DC Eqs. 12.13–12.15)
> $\sum_{k=1}^{j}\mathrm{DNL}_k = \sum_{k=1}^{j}(V_k-V_{k-1})-j\Delta$. The sum telescopes to $V_j-V_0$ with $V_0 = 0$, leaving $V_j-j\Delta = \mathrm{INL}_j$. So one ramp measurement gives both curves.

> [!note]- Detail: Carusone Ex. 15.4 (3-bit DAC, all static specs from one measurement)
> $V_{ref} = 4$ V, so 1 LSB = 0.5 V. Measured levels: 0.011, 0.507, 1.002, 1.501, 1.996, 2.495, 2.996, 3.491 V.
> 1. Offset $=0.011/0.5 = 0.022$ LSB. Gain error $= (3.491-0.011)/0.5-7 = -0.04$ LSB.
> 2. Remove both (e.g. code 2: $1.002/0.5-0.022+\frac27\cdot0.04 = 1.993$), then INL = level − code: max $|\mathrm{INL}| = 0.007$ LSB; DNL = successive differences − 1: max 0.007 LSB.
> 3. Absolute accuracy: worst raw error 11 mV, $4\ \text{V}/2^{N}=11$ mV gives **8.5 bits**. Relative accuracy: 0.007 LSB = 3.5 mV gives **10.2 bits**.

> [!tip] Remark
> Outside converters the same idea is "maximum deviation from the end-point line, normalized to full scale": [[Nonlinearity and Mismatch#Maximum Deviation from the End-Point Line]]. The converter just quotes it in LSB per code.

## Level 4: Dynamic Specifications

Dynamic specs come from the FFT of the output with a full-scale sine swept toward $f_S/2$ (Razavi DC §12.3.7).

### SNDR, SFDR, THD

```tikz title="Reading an ADC output FFT: SNDR integrates everything but the fundamental up to f_CK/2; SFDR is the gap to the single tallest spur. After Razavi (Data Converters) Figs. 12.17, 12.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9.4,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,5.0) node[above] {dB};
  \fill[gray!25] (0,0) rectangle (8.5,0.55);
  \draw[gray] (0,0.55) -- (8.5,0.55);
  \node[font=\scriptsize,anchor=west] at (5.6,0.27) {noise floor $\eta$};
  \draw[very thick] (1.5,0) -- (1.5,4.4) node[above,font=\scriptsize] {$A_1$ at $f_{in}$};
  \draw[thick] (3.0,0) -- (3.0,1.9) node[above,font=\scriptsize] {$A_2$};
  \draw[thick] (4.5,0) -- (4.5,2.8) node[above,font=\scriptsize] {$A_3$};
  \draw[thick] (6.0,0) -- (6.0,1.4) node[above,font=\scriptsize] {$A_5$};
  \draw[dotted] (8.5,0) -- (8.5,4.7) node[above,font=\scriptsize] {$f_{CK}/2$};
  \draw[dashed] (1.5,4.4) -- (7.4,4.4);
  \draw[dashed] (4.5,2.8) -- (7.4,2.8);
  \draw[<->] (7.2,2.8) -- (7.2,4.4) node[midway,right,font=\scriptsize] {SFDR};
  \node[below,font=\scriptsize] at (1.5,0) {$f_{in}$};
  \node[below,font=\scriptsize] at (3.0,0) {$2f_{in}$};
  \node[below,font=\scriptsize] at (4.5,0) {$3f_{in}$};
  \node[below,font=\scriptsize] at (6.0,0) {$5f_{in}$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.2,-1.3) {SNDR $=\dfrac{A_1^2/2}{\eta\,f_{CK}/2+\sum_{j\ge2}A_j^2/2}$:\ every bin except the fundamental, $0\ldots f_{CK}/2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{SNDR} = \frac{A_1^2/2}{P_{noise}+P_{dist}}}\qquad\boxed{\mathrm{SFDR} = \frac{P_{signal}}{P_{\text{largest spur}}}}\qquad\boxed{\mathrm{THD} = \frac{\sum_{j\ge2}P_j}{P_1}}
$$

- **SNDR** counts everything in $0\ldots f_S/2$ except the fundamental: quantization, $kT/C$, jitter, and every harmonic (Razavi DC Ex. 12.7). $P_{noise} = \eta\,f_{CK}/2$ for a flat floor $\eta$. Carusone's "dynamic range" is the maximum achievable SNDR.
- **SNR** is the same without the harmonics; **THD** is harmonics only.
- **SFDR** ignores noise and depends strongly on amplitude: the $n$th harmonic scales as $A^n$, so halving the swing lowers HD3 by 8× (18 dB) and raises SFDR. **Quote SFDR with its input level** (Razavi DC §12.3.6).
- SNDR vs amplitude peaks near full scale in typical designs: below it noise dominates, above it distortion grows faster than the signal (Razavi DC Ex. 12.9).
- Distortion set by matching stays fixed as the input shrinks, so the signal-to-distortion ratio falls with the input; distortion from weak input-stage nonlinearity falls with the input, the nicer property (Carusone §15.5.3).

> [!tip] Remark
> The polynomial origin of $HD_2$, $HD_3$ and the THD definition are owned by [[Nonlinearity and Mismatch#Harmonic Distortion and THD]]. The SNDR-vs-amplitude curve with its optimum is drawn in [[Noise#Dynamic Range and the Size of C]]. The RF use of "SFDR" (in terms of IIP3 and the noise floor) is a different quantity, owned by [[RF Noise and Distortion]].

### ENOB and ERBW

```tikz title="ENOB vs input frequency. Static tests see only the flat left end; ERBW is where SNDR has fallen 3 dB (0.5 bit). After Carusone Sec. 15.5.3 and Fig. P15.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.4,0) node[right] {$f_{in}$};
  \draw[->] (0,0) -- (0,4.2) node[above] {ENOB, SNDR};
  \draw[dashed] (0,3.6) -- (7.6,3.6);
  \node[left,font=\scriptsize] at (0,3.6) {$N$};
  \draw[very thick,domain=0:7.6,samples=60] plot (\x,{3.2-2.2*(\x/7.6)^3});
  \node[left,font=\scriptsize] at (0,3.2) {ENOB$_{low}$};
  \pgfmathsetmacro{\fe}{7.6*(0.5/2.2)^(1/3)}
  \draw[dotted] (0,2.7) -- (\fe,2.7);
  \draw[dotted] (\fe,0) -- (\fe,2.7);
  \fill (\fe,2.7) circle (0.06);
  \node[below,font=\scriptsize] at (\fe,0) {ERBW};
  \draw[<->] (0.5,2.7) -- (0.5,3.2) node[midway,right,font=\scriptsize] {0.5 bit = 3 dB};
  \draw[dotted] (7.6,0) -- (7.6,3.8);
  \node[below,font=\scriptsize] at (7.6,0) {$f_{CK}/2$};
  \node[font=\scriptsize,align=left,anchor=west] at (1.0,1.0) {static tests (slow ramp) see only the left end;\\ dynamic tests sweep a full-scale sine to $f_{CK}/2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{ENOB} = \frac{\mathrm{SNDR_{dB}}-1.76}{6.02}}\qquad\boxed{\mathrm{ERBW}: f_{in}\ \text{where SNDR is 3 dB (ENOB 0.5 bit) below its low-frequency value}}
$$

- ENOB is the resolution of an ideal quantizer with the same SNDR. Always $<N$, since a properly measured SNDR includes quantization noise.
- Razavi DC §12.3.5: 10 bits with SNDR 58 dB is **9.3** effective bits. Carusone Ex. 15.5: 12 bits, fundamental 1 W, everything else 0.5 µW: SNDR 63 dB, **10.2** bits.
- **Static ≠ dynamic.** An 8-bit, 200 MS/s ADC can show full 8-bit DNL/INL with a DC ramp and only 6 bits at $f_{in}=40$ MHz because of a band-limited preamp or a slew-limited S/H (Carusone §15.5.3). That is what ERBW captures.

### Aperture Jitter and the Other Timing Specs

$$
\boxed{\Delta t < \frac{1}{2^N\pi f_{in}}\ \ \text{(peak error} < 1\ \text{LSB at the zero crossing)}}
$$

- Carusone §15.5.3: an 8-bit ADC at a full-scale 250 MHz input, or a 16-bit ADC at 1 MHz, both need $\Delta t<5$ ps. The rms-noise version, $\mathrm{SNR} = 1/(\sigma_j\omega_{in})^2$, is the one used in the budget above.
- **Conversion time vs sample rate vs latency:** the sample rate is how often a new result appears; latency is how long one sample takes to come out. A pipelined 12-bit ADC can run at 500 MS/s (2 ns per sample) with 24 ns latency (Carusone §15.5.3).
- **DAC settling time:** time to come within a stated band (usually ½ LSB) of the final value. The DAC update rate is roughly its inverse.

> [!tip] Remark
> The jitter derivation, the 32 fs example and the circuit view (sampling-edge uncertainty) are owned by [[Sampling Circuits#Aperture Jitter]]. Clock jitter itself is in [[Oscillators]] and [[Link Noise and Jitter]].

## Level 5: Figures of Merit

$$
\boxed{\mathrm{FOM_1} = \frac{P}{f_{CK}\cdot2^N}}\qquad\boxed{\mathrm{FOM_W} = \frac{P}{2f_{in}\cdot2^{\mathrm{ENOB}}}\ \ [\text{J/conv-step}]}\qquad\boxed{\mathrm{FOM_S} = \mathrm{SNDR_{dB}}+10\log_{10}\frac{f_S/2}{P}\ \ [\text{dB}]}
$$

- **FOM$_1$** (Razavi DC Eq. 12.19): energy per cycle $P/f_{CK}$ per level. It assumes doubling resolution or speed doubles power, and it is blind to dynamic loss.
- **Walden FOM$_W$** (Razavi DC Eq. 12.20, called FOM$_2$ there): replace $N$ by ENOB and $f_{CK}$ by $2f_{in}$, so the converter is charged for what it delivers at the frequency it is used. Lower is better; the best is often below Nyquist because ENOB falls with $f_{in}$. Razavi: today's ADCs reach "a few tens of fJ per conversion step".
- **Schreier FOM$_S$**: higher is better. It charges 4× power per extra bit (+6 dB SNDR needs +6 dB of power to hold FOM$_S$), the right exponent for thermal-noise-limited designs.

> [!note]- Why 2× per bit (Walden) vs 4× per bit (Schreier)
> Walden's denominator $2^{\mathrm{ENOB}}$ rewards one more bit at twice the power. But if $kT/C$ sets the noise floor, one more bit means $\Delta$ halves, the allowed $kT/C$ quarters, $C$ quadruples, and so does the current needed to drive it at the same speed ([[Noise#Dynamic Range and the Size of C]]: "every 6 dB more costs 4× the capacitance"). So at high resolution Walden flatters low-resolution designs and Schreier is the fair comparison; at low resolution, where power is set by digital and comparator energy rather than noise, Walden is closer to reality.

> [!warning] Unverified (not in the vault's sources)
> The Schreier FOM is not defined in Razavi DC or Carusone; the form above is the standard one from Schreier and Temes / Pavan, Schreier and Temes, *Understanding Delta-Sigma Data Converters*, and the Murmann ADC survey. Some authors use dynamic range instead of SNDR, or the signal bandwidth $f_B$ instead of $f_S/2$ (for oversampling ADCs). Check the definition before comparing published numbers.

## Level 6: The Architecture Landscape

```tikz title="Architecture map: resolution ranges from Razavi (Data Converters) Fig. 12.20 and Ch. 21; vertical order by speed class from Carusone Table 17.1 (qualitative, no rate scale)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.62cm]
  \draw[->] (3,0) -- (21.2,0) node[right] {resolution (bits)};
  \foreach \b in {4,6,...,20} { \draw (\b,0) -- (\b,-0.1) node[below,font=\scriptsize] {\b}; }
  \tikzset{bar/.style={draw,thick,minimum height=0.5cm,anchor=west,font=\scriptsize}}
  \foreach \a/\b/\y/\f/\t in {4/8/4.4/gray!45/{Flash},6/10/3.7/gray!25/{Folding/interpolating},8/16/3.0/gray!45/{Pipelined},6/16/2.3/gray!30/{SAR},12/20/1.6/gray!15/{Oversampling ($\Delta\Sigma$)}} {
    \draw[thick,fill=\f] (\a,{\y-0.25}) rectangle (\b,{\y+0.25});
    \node[font=\scriptsize,anchor=west] at (\b+0.2,\y) {\t};
  }
  \draw[->,very thick] (2.5,1.2) -- (2.5,4.8);
  \node[font=\scriptsize,rotate=90,anchor=south] at (2.3,3.0) {faster};
  \node[font=\scriptsize,anchor=west,align=left] at (11.2,5.0) {interleaving ($M$ channels): any bar, $M\times$ the rate};
  \draw[->] (11.1,5.0) -- (10.2,4.6);
  \node[font=\scriptsize,anchor=west] at (3,0.8) {bars: Razavi Fig.\ 12.20 and Ch.\ 21 (oversampling attractive above $\approx$12 b); speed order: Carusone Tab.\ 17.1};
\end{circuitikz}
\end{document}
```

| Architecture | Resolution (Razavi DC §12.4) | Speed class (Carusone Tab. 17.1) | Spends its budget on | Note |
|---|---|---|---|---|
| Flash | 4–8 b | High | $2^N-1$ comparators: offset → DNL, power, input capacitance | [[Flash ADCs]] |
| Folding / interpolating | 6–10 b | High | Fewer comparators; less common | [[Flash ADCs]] |
| SAR | 6–16 b | Medium | One comparator, a cap DAC: $kT/C$, DAC matching, $N$ cycles per sample | [[SAR ADCs]] |
| Pipelined | 8–16 b | High | Residue amplifiers: op-amp gain and settling, $kT/C$ per stage | [[Pipelined ADCs]] |
| Oversampling ($\Delta\Sigma$) | above ≈12 b (Razavi DC §21) | Low-to-medium | Loop filter, OSR, noise shaping | [[Delta-Sigma ADCs]] |
| Integrating | (high accuracy) | Low | Slow, very linear; instruments | Carusone §17.1 |
| Time-interleaved | any of the above | ×M | Offset, gain, timing-skew mismatch between channels | [[Interleaved ADCs]] |

- SAR is the most popular today for its potentially low power (Razavi DC §12.4).
- **Interleaving is a wrapper, not an architecture:** $M$ copies on staggered clocks give $M\times$ the rate for any of the rows, and it can also ease the speed–power trade.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $N$ (1 bit) | SQNR +6 dB | $\Delta$ halves: every noise and error budget shrinks 4× in power; $C_S$ and current ×4 if thermal-limited |
| ↑ $V_{FS}$ | SNR (signal power ∝ $V_{FS}^2$ at fixed noise) | Headroom, linearity of switch and buffer |
| ↓ input swing | INL seen, SFDR ($A^n$ harmonics) | SNR dB-for-dB |
| ↑ $f_S$ | Bandwidth, easier anti-alias filter | Power, settling time per conversion |
| ↑ $f_{in}$ toward $f_S/2$ | Use of the full band | Jitter noise ∝ $f_{in}^2$, sampler distortion, ENOB drops (ERBW) |
| Oversampling ($M$) | In-band $\Delta^2/12$ and $kT/C$ ÷ $M$ | Bandwidth per clock rate; digital filter |
| Bigger $C_S$ | $kT/C$ | Driver/op-amp current, area |
| Larger comparator input pair | Offset (DNL) | Input capacitance, kickback, speed |
| Spend ENOB margin ($N-\mathrm{ENOB}$) | Room for circuit noise | Effective resolution, FoM |
| Interleave $M$ channels | Rate ×$M$ | Mismatch spurs: offset, gain, skew |

## Cheat sheet

| Quantity | Equation |
|---|---|
| LSB | $\Delta = V_{FS}/2^N$ |
| Ideal DAC | $V_{out} = V_{ref}\sum b_i2^{-i}$, $V_{LSB} = V_{ref}/2^N$ |
| Quantization noise | $P = \Delta^2/12$, $V_{rms} = \Delta/\sqrt{12}$ |
| Ideal SQNR (full-scale sine) | $6.02N+1.76$ dB $(=\frac32 2^{2N})$; minus dBFS for smaller inputs |
| Nyquist / aliasing | $f_S>2f_{max}$; $f_{alias} = \lvert f_{in}-kf_S\rvert$ folded into $0\ldots f_S/2$ |
| Oversampling ratio | $M = f_S/(2f_B)$; unshaped in-band noise ÷ $M$ |
| ADC offset | $E_{off} = V_{0\ldots01}/V_{LSB}-\tfrac{1}{2}$ LSB |
| ADC gain error | $E_{gain} = (V_{1\ldots1}-V_{0\ldots01})/V_{LSB}-(2^N-2)$ |
| DNL | $\mathrm{DNL}_j = V_j-V_{j-1}-1$ LSB; $-1$ LSB = missing code |
| INL | $\mathrm{INL}_j = V_j-j\Delta = \sum_{k\le j}\mathrm{DNL}_k$ |
| No missing codes / monotonic | $\max\lvert\mathrm{DNL}\rvert<1$ LSB or $\max\lvert\mathrm{INL}\rvert<\tfrac{1}{2}$ LSB |
| SNDR | $\frac{A_1^2/2}{P_{noise}+P_{dist}}$ |
| SFDR | $P_{signal}/P_{\text{largest spur}}$ |
| ENOB | $(\mathrm{SNDR}-1.76)/6.02$ |
| ERBW | $f_{in}$ where SNDR is 3 dB below its low-frequency value |
| Aperture (peak) | $\Delta t<1/(2^N\pi f_{in})$ |
| Jitter noise | $\sigma_j^2\omega_{in}^2A^2/2$; $\mathrm{SNR} = 1/(\sigma_j\omega_{in})^2$ |
| Walden FoM | $P/(2f_{in}2^{\mathrm{ENOB}})$ |
| Schreier FoM | $\mathrm{SNDR}+10\log(f_S/2/P)$ |
| Noise ceiling | $P_{n,tot}\le\frac{\Delta^2}{12}4^{N-\mathrm{ENOB}}$ |
| $kT/C$ budget | $C_S\ge2kT/P_{kTC}$ (differential) |
| Jitter budget | $\sigma_j\le\sqrt{2P_j}/(A\omega_{in})$ |
| SAR $kT/C$ penalty | $1+24kT/(\Delta^2C_{DAC})$ |
| Settling (S/H, MDAC) | $A_0\ge2^{N+1}/\beta$, $\omega_u\ge(N+1)\ln2/(\beta t_s)$ |

## References

- **Razavi, *Analysis and Design of Data Converters* (2025)** (PDF page = printed + 19)
  - Ch. 1 Introduction to Data Conversion, §1.1–1.2, pp. 1–5: sampler + quantizer, Examples 1.1–1.5, 2-bit characteristic, Eq. (1.1), DAC uses and reconstruction filter.
  - Ch. 2 Basic Circuit Concepts, §2.4, pp. 13–17: offset, gain error, nonlinearity, HD/THD (used only for the Remark; charge sharing §2.1–2.2 and integrated capacitors §2.3 are owned by [[Switched-Capacitor Circuits]] and [[Capacitor]]).
  - Ch. 3 §3.10, pp. 55–57: jitter noise power, Examples 3.25–3.26 (worked example B).
  - Ch. 12 Introduction to Nyquist-Rate ADCs, §12.1–12.4, pp. 236–250: terminology, quantization error, $\Delta^2/12$, SQNR, offset, gain error, DNL, missing codes, INL, INL vs offset and swing, SNDR, harmonic folding (Ex. 12.8), ENOB, SFDR, static vs dynamic, FOM$_1$/FOM$_2$, Fig. 12.20 architectures.
  - Ch. 15 §15.2.1, pp. 316–317: DAC $kT/C$ noise and SNR penalty (worked example A).
  - Ch. 21 intro, p. 479; Ch. 23 §23.1.2, pp. 535–536: oversampling attractive above ≈12 b; $kT/C$ reduced by $M$.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - Ch. 15 Data Converter Fundamentals, pp. 606–620: Nyquist-rate vs oversampling, ideal DAC/ADC, quantization noise (deterministic and stochastic), SQNR, signed codes, offset/gain error in LSB, accuracy, INL (end-point and best-fit), DNL, monotonicity, missing codes, conversion time and latency, aperture jitter, dynamic range, $N_{eff}$, ERBW, Examples 15.1–15.5.
  - Ch. 17 intro, p. 646, Table 17.1: speed classes of A/D architectures.
- **Not from the vault's sources:** the Schreier FoM definition (flagged above).
- **Zettelkasten extensions** (`AnalogTheory/Data Conversion Fundamentals/`, S21): 21a3a (uniform sampling as a convention), 21i1 (gain error needs the nominal LSB), 21j3 (DNL axis convention), 21k2 (single-sign INL hides an offset), 21o (static vs dynamic divergence), 21p1 (Walden as the dynamic FoM), 21q1 (interleaving as a wrapper).
