---
title: Noise
description: From the statistics of a random waveform to thermal and flicker sources, input-referred noise of every basic stage, kT/C, and the noise-power-bandwidth-bias trades.
kind: topic
status: growing
aliases:
  - Noise
  - Circuit Noise
---

Noise sets the smallest signal a circuit can process. This note starts with the bookkeeping needed to talk about a random waveform at all, then adds the device sources, then refers everything to the input so circuits can be compared, then works through each basic stage, and ends with the design trades (power, bandwidth, bias point). Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="Noise on one screen: every resistor and transistor injects a random source; we lump them into one input-referred voltage (and current) in front of a noiseless copy of the circuit. The spectrum is 1/f at low frequency, white above the corner f_C, and the circuit's own bandwidth ends it. After Razavi Figs. 7.27, 7.31, 7.33."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) rectangle (3.2,2.2);
  \node[font=\bfseries\small] at (1.6,1.85) {noisy circuit};
  \node[font=\scriptsize,align=center] at (1.6,0.9) {resistors: $4kTR$\\ MOSFETs: $4kT\gamma g_m$\\ flicker: $K/(C_{ox}WLf)$};
  \draw (-0.7,1.1) node[ocirc]{} node[left]{$V_{in}$} -- (0,1.1);
  \draw (3.2,1.1) -- (3.7,1.1) node[ocirc]{} node[right]{$V_{n,out}$};
  \node at (5.3,1.1) {\Large $\equiv$};
  \draw (6.0,1.1) node[ocirc]{} to[V, l=$\overline{V^2_{n,in}}$] (7.6,1.1) -- (8.6,1.1);
  \draw (8.1,1.1) node[circ]{} to[I, l_=$\overline{I^2_{n,in}}$] (8.1,-0.6) node[ground]{};
  \draw (8.6,0) rectangle (11.0,2.2);
  \node[align=center] at (9.8,1.1) {noiseless\\ circuit, $A_v$};
  \draw (11.0,1.1) -- (11.5,1.1) node[ocirc]{} node[right]{$V_{n,out}$};
  \begin{scope}[yshift=-6.4cm]
    \draw[->] (0,0) -- (11.2,0) node[below left] {$\log f$};
    \draw[->] (0,0) -- (0,4.8) node[above] {$\log \overline{V^2_n}$ (V$^2$/Hz)};
    \draw[thick,domain=0.3:7.7,samples=120] plot (\x,{1.4+log10(1+10^(3-\x))-log10(1+10^(2*(\x-7)))});
    \draw[dashed] (0.3,4.1) -- (3.6,0.8);
    \draw[dashed] (0.3,1.4) -- (9.6,1.4);
    \draw[dotted] (3,0) -- (3,1.7);
    \node[below] at (3,0) {$f_C$};
    \draw[dotted] (7,0) -- (7,1.1);
    \node[below] at (7,0) {$f_p$};
    \node[font=\scriptsize,anchor=west] at (1.5,3.3) {flicker: $\propto 1/f$, lives at the gate};
    \node[font=\scriptsize] at (5.0,1.75) {thermal: white};
    \node[font=\scriptsize,anchor=west] at (7.7,0.8) {output rolls off with $|H(f)|^2$};
    \node[font=\scriptsize,align=left,anchor=west] at (5.6,4.0) {total noise $=\int_0^\infty \overline{V^2_{n,out}}\,df$\\ (integrate at the output, then $\div A_v^2$)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The results the rest of the note refines
> 1. **Only power is predictable.** Work in mean-square quantities ($\mathrm{V^2/Hz}$). Uncorrelated sources add as powers; a transfer function shapes a spectrum by $|H(f)|^2$.
> 2. **Two device sources.** Thermal: $4kTR$ for a resistor, $4kT\gamma g_m$ (drain current, $\gamma\approx 2/3$ to $1$) for a MOSFET. Flicker: $\dfrac{K}{C_{ox}WL}\dfrac1f$ at the gate.
> 3. **Refer to the input to compare circuits:** $\overline{V^2_{n,in}} = \overline{V^2_{n,out}}/A_v^2$. A CS stage gives $4kT\left(\dfrac{\gamma}{g_m}+\dfrac{1}{g_m^2R_D}\right)$: signal devices want **large** $g_m$, current-source devices want **small** $g_m$.
> 4. **$kT/C$:** an RC network's total noise is $kT/C$ for any $R$. Only capacitance (and so power) buys it down.
> 5. **Noise costs power.** Halving the noise power at fixed bandwidth doubles the current. A differential pair has 2× the input noise power of its half circuit.

**Map:** [[#Level 0 Describing a Random Signal|statistics, PSD, filtering]] → [[#Level 1 Device Noise Sources|thermal, $kT/C$, gate resistance, flicker]] → [[#Level 2 Input-Referred Noise|input referral, two-port, noise bandwidth]] → [[#Level 3 Noise of the Basic Stages|CS, CG, SF, cascode, mirrors, diff pair, op-amp circuits]] → [[#Level 4 Designing for Noise|power, bias point, dynamic range]] → [[#Where Noise Goes Next|noise figure, jitter, phase noise]].

## Level 0: Describing a Random Signal

The instantaneous value of noise cannot be predicted. Its **average power** can, so that is the quantity every formula in this note carries.

### Average Power and rms

$$
\boxed{P_{av} = \overline{x^2} = \lim_{T\to\infty}\frac1T\int_{-T/2}^{T/2} x^2(t)\,dt,\qquad x_{rms} = \sqrt{P_{av}}}
$$

- $P_{av}$ is in $\mathrm{V^2}$ (power into $1\ \Omega$); divide by $R_L$ for watts.
- Noise is zero-mean, so for a Gaussian amplitude distribution $\sigma = x_{rms}$. Thermal noise is Gaussian (many independent electrons, central-limit theorem).
- The averaging time $T$ must cover many cycles of the slowest component (Razavi's example: ~500 ms for voice down to 20 Hz).

### Power Spectral Density

```tikz title="Two-sided vs one-sided white spectrum. Folding the negative frequencies onto the positive axis doubles the density. After Razavi Figs. 7.9-7.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-3.2,0) -- (3.4,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,2.4) node[above] {$S_x(f)$};
  \draw[thick] (-3,0.9) -- (3,0.9);
  \node[left,font=\scriptsize] at (0,1.15) {$\eta/2$};
  \node[font=\scriptsize] at (0,-0.5) {two-sided};
  \node at (4.3,1) {$\Longrightarrow$};
  \begin{scope}[xshift=5.4cm]
    \draw[->] (0,0) -- (4,0) node[right] {$f$};
    \draw[->] (0,0) -- (0,2.4) node[above] {$S_x(f)$};
    \draw[thick] (0,1.8) -- (3.6,1.8);
    \node[left,font=\scriptsize] at (0,1.8) {$\eta$};
    \node[font=\scriptsize] at (1.8,-0.5) {one-sided: fold $f<0$ onto $f>0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{x^2} = \int_0^\infty S_x(f)\,df \quad\text{(one-sided)},\qquad S_{x,\text{one-sided}} = 2\,S_{x,\text{two-sided}}}
$$

- $S_x(f)$: the power the signal carries in a 1-Hz band around $f$. Units $\mathrm{V^2/Hz}$, or $\mathrm{V/\sqrt{Hz}}$ after a square root ("$3\ \mathrm{nV/\sqrt{Hz}}$" means $(3\ \mathrm{nV})^2$ in each hertz).
- Integrate over the band you care about to get a number in $\mathrm{V^2}$ (then $\mathrm{V_{rms}}$). A white density of $5\times10^{-16}\ \mathrm{V^2/Hz}$ over 1 MHz is $5\times10^{-10}\ \mathrm{V^2}$, i.e. $22.4\ \mu\mathrm{V_{rms}}$.
- **White** = flat. It cannot be white forever (infinite power); "white" means flat over the band of interest.
- This note (like both books) uses the one-sided convention and writes $\overline{V_n^2}$ for the density in a 1-Hz band.

> [!note]- Detail: what a spectrum analyzer actually reads
> A spectrum analyzer is a bandpass filter of resolution bandwidth $W$ followed by a power meter. For noise, the reading is proportional to $W$ (the noise spends a fraction of its time in the filter's band); for a sinusoid at the center frequency, the reading is independent of $W$. That is why noise must be normalized to 1 Hz: Tony's example measures $1\ (\mu\mathrm{V})^2$ in a 1-mHz bandwidth, which is $1000\ (\mu\mathrm{V})^2/\mathrm{Hz}$. Formally, the PSD is the Fourier transform of the autocorrelation (Wiener–Khinchin); the two definitions agree for the stationary processes we meet.

### Filtering: Only the Magnitude Matters

```tikz title="A white input spectrum shaped by a low-pass transfer function. After Razavi Fig. 7.7 and Tony Fig. 9.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\lab in {0/{$S_x(f)$},4.4/{$|H(f)|^2$},8.8/{$S_y(f)$}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (0,0) -- (3.2,0) node[below] {$f$};
      \draw[->] (0,0) -- (0,2.0) node[above] {\lab};
    \end{scope}
  }
  \draw[thick] (0,1.3) -- (3,1.3);
  \draw[thick,domain=0:3,samples=60] plot ({4.4+\x},{1.6/(1+(\x/0.9)^2)});
  \draw[thick,domain=0:3,samples=60] plot ({8.8+\x},{1.3/(1+(\x/0.9)^2)});
  \node at (3.75,1) {$\times$};
  \node at (8.15,1) {$=$};
  \node[font=\scriptsize] at (6.0,-0.6) {phase of $H$ is irrelevant};
\end{circuitikz}
\end{document}
```

$$
\boxed{S_y(f) = S_x(f)\,|H(j2\pi f)|^2}
$$

- The phase of $H$ is irrelevant. In root-spectral-density form, $\sqrt{S_y} = |H|\sqrt{S_x}$: ordinary Bode-plot arithmetic.
- Integrate with respect to $f$ (hertz), not $\omega$: densities are per hertz.
- **Limit the bandwidth.** A 1-MHz amplifier for a 20-kHz audio signal collects 50× the white noise for nothing. Tony's RC example: $20\ \mathrm{nV/\sqrt{Hz}}$ white noise over 100 kHz is $6.3\ \mu\mathrm{V_{rms}}$; after a 1-kHz RC filter, $0.79\ \mu\mathrm{V_{rms}}$.

### Adding Sources: Correlation

$$
\boxed{\overline{v_{no}^2} = \overline{v_{n1}^2} + \overline{v_{n2}^2} + 2C\,v_{n1,rms}\,v_{n2,rms},\qquad -1\le C\le 1}
$$

- **Uncorrelated** ($C=0$, different physical sources): powers add, rms values add like orthogonal vectors. This is almost always the case.
- **Fully correlated** ($C=\pm1$, the same source reaching the output by two paths): rms values add linearly. Add the **voltages** first, then square.
- Uncorrelated sources stay uncorrelated after filtering, so you can filter each one separately and add the output powers.

> [!tip] Remark
> Because powers add, the largest source dominates. Tony's example: with $10\ \mu\mathrm{V}$ and $5\ \mu\mathrm{V}$ sources, cutting the larger by 13% does as much as removing the smaller entirely. **Find the biggest contributor first.**

### SNR and dBm

$$
\boxed{\mathrm{SNR} = 10\log\frac{P_{sig}}{P_{noise}} = 20\log\frac{V_{sig,rms}}{V_{n,rms}}\ \mathrm{dB}}
$$

- A sinusoid of peak $A$ has $P_{sig} = A^2/2$.
- **dBm** is power relative to 1 mW. For voltages, assume a reference load (usually $50$ or $75\ \Omega$): 0 dBm into $50\ \Omega$ is $0.2236\ \mathrm{V_{rms}}$.

### The Noise-Analysis Procedure

1. List every noise source and its spectrum.
2. Find the transfer function from each source to the output (as if it were a deterministic signal; input set to zero).
3. Multiply each spectrum by $|H|^2$.
4. Add the output spectra as powers (check for correlated sources), then integrate over frequency.

Steps 2 and 4 are ordinary small-signal analysis. Everything after this section applies these four steps.

## Level 1: Device Noise Sources

There are two kinds: **device (electronic) noise**, treated here, and **environmental noise** coupled through supplies and the substrate ([[Substrate Noise]]). Device noise has three mechanisms: thermal, shot, and flicker.

```tikz title="Noise models. A resistor is a noiseless R with a series voltage or parallel current source. A saturated MOSFET is a drain-source current source, or equivalently a voltage source in series with the gate. After Razavi Figs. 7.14, 7.17, 7.19 and Tony Fig. 9.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % resistor thevenin
  \draw (0,2.4) node[ocirc]{} to[R, l_=$R$] (0,1.2) to[V, l_={$\overline{V^2_n}=4kTR$}] (0,-0.4) node[ocirc]{};
  % resistor norton
  \draw (3.0,2.4) node[ocirc]{} -- (3.0,1.9) -- (2.4,1.9) to[R, l_=$R$] (2.4,0.1) -- (3.0,0.1) -- (3.0,-0.4) node[ocirc]{};
  \draw (3.0,1.9) -- (3.6,1.9) to[I, l={$\overline{I^2_n}=\frac{4kT}{R}$}] (3.6,0.1) -- (3.0,0.1);
  \node[font=\scriptsize] at (1.6,-1.0) {resistor (noiseless $R$ + source)};
  % MOSFET drain current
  \draw (8.0,1.0) node[nmos](M){};
  \draw (M.D) -- ++(0,0.4) coordinate (T) node[above]{$D$};
  \draw (M.S) -- ++(0,-0.4) coordinate (B) node[below]{$S$};
  \draw (T) -- ++(1.1,0) coordinate (T2) to[I, l=$4kT\gamma g_m$] (T2 |- B) -- (B);
  \node[left] at (M.G) {$G$};
  \node[font=\scriptsize,align=center] at (8.3,-1.0) {channel thermal noise\\ drain–source current};
  \node at (11.4,1.0) {\Large $\equiv$};
  % MOSFET gate voltage
  \draw (15.0,1.0) node[nmos](M2){};
  \draw (M2.G) to[V, l_=$\overline{V^2_n}$] ++(-1.7,0) node[ocirc]{} node[left]{$G$};
  \node[above] at (M2.D) {$D$};
  \node[below] at (M2.S) {$S$};
  \node[font=\scriptsize,align=center] at (14.2,-1.0) {$\overline{V^2_n}=\dfrac{4kT\gamma}{g_m}+\dfrac{K}{C_{ox}WL\,f}$};
\end{circuitikz}
\end{document}
```

### Resistor Thermal Noise

$$
\boxed{\overline{V_n^2} = 4kTR \qquad\Longleftrightarrow\qquad \overline{I_n^2} = \frac{4kT}{R}}
$$

- Random thermal motion of electrons; white (flat to about 100 THz), Gaussian, proportional to absolute temperature, independent of bias current.
- $k = 1.38\times10^{-23}\ \mathrm{J/K}$; at 300 K, $kT = 4.14\times10^{-21}\ \mathrm{J}$.
- Numbers to remember: **$1\ \mathrm{k}\Omega$ → $4.06\ \mathrm{nV/\sqrt{Hz}}$**, scaling as $\sqrt R$. $50\ \Omega$ → $0.91\ \mathrm{nV/\sqrt{Hz}}$.
- Choose the series (Thevenin) or parallel (Norton) form by whichever makes the circuit easier. The source's polarity is arbitrary but must be kept consistent through one calculation.
- Parallel resistors: add the noise currents, so $R_1\|R_2$ produces $4kT(R_1\|R_2)$, the noise of the equivalent resistor.

> [!tip] Remark
> Small-signal resistances are **not** noisy: $r_o$ of a MOSFET ([[MosFETs#Output Resistance and Intrinsic Gain]]) and $r_d = kT/qI_D$ of a diode are slopes of an I/V curve, not physical resistors. Only physical resistance (and the channel, below) generates thermal noise.

### kT/C Noise

```tikz title="An RC low-pass filter's output noise. A larger R gives more noise density but proportionally less bandwidth; the area is always kT/C. After Razavi Figs. 7.15-7.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ground]{} to[V, l={$4kTR$}] (0,2) to[R, l=$R$] (2.4,2) node[circ]{} -- (3.2,2) node[ocirc]{} node[right]{$V_{n,out}$};
  \draw (2.4,2) to[C, l=$C$] (2.4,0) node[ground]{};
  \begin{scope}[xshift=6cm]
    \draw[->] (0,0) -- (4.4,0) node[below] {$f$};
    \draw[->] (0,0) -- (0,2.6) node[above] {$\overline{V^2_{n,out}}$};
    \draw[dashed] (0,1.9) -- (4.1,1.9);
    \node[left,font=\scriptsize] at (0,1.9) {$4kTR$};
    \draw[thick,domain=0:4,samples=80] plot (\x,{1.9/(1+(\x/0.8)^2)});
    \draw[dotted] (0.8,0) -- (0.8,0.95);
    \node[below,font=\scriptsize] at (0.8,0) {$\frac{1}{2\pi RC}$};
    \node[font=\scriptsize,anchor=west] at (1.5,1.25) {area $=kT/C$, any $R$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{V^2_{n,out,tot}} = \int_0^\infty \frac{4kTR}{1+(2\pi fRC)^2}\,df = \frac{kT}{C}}
$$

- Independent of $R$. **1 pF → $64.3\ \mu\mathrm{V_{rms}}$** at 300 K.
- Holds for any network of resistors (including triode MOSFETs, i.e. switches) and capacitors with no active devices: each capacitor ends up with $kT/C$.
- **Sampling** freezes this noise: a switch opening on $C$ captures signal plus $kT/C$ of noise, independent of the sampling rate and uncorrelated from sample to sample. It sets the noise floor of every [[Switched-Capacitor Circuits|switched-capacitor]] and [[Sampling Circuits|sampling]] circuit.
- The dual: an inductor connected only to resistors carries $\overline{I^2_{n}} = kT/L$.

> [!note]- Derivation: the integral
> With $u = 2\pi RCf$: $\int_0^\infty \frac{4kTR\,df}{1+u^2} = \frac{4kTR}{2\pi RC}\int_0^\infty\frac{du}{1+u^2} = \frac{2kT}{\pi C}\cdot\frac{\pi}{2} = \frac{kT}{C}$. In noise-bandwidth form (Level 2): density $4kTR$ times noise bandwidth $\frac{\pi}{2}\cdot\frac{1}{2\pi RC} = \frac{1}{4RC}$ gives $kT/C$ in one line. Capacitors and inductors generate no noise themselves; they only shape (accumulate) the resistor's noise.

### MOSFET Channel Thermal Noise

$$
\boxed{\overline{I^2_{n,d}} = 4kT\gamma g_m \qquad\Longleftrightarrow\qquad \overline{V^2_{n,g}} = \frac{4kT\gamma}{g_m}}
$$

- The channel is a resistive path, so it makes thermal noise. In saturation, model it as a current source drain to source.
- $\gamma = 2/3$ for long-channel devices; larger in short-channel devices and somewhat dependent on $V_{DS}$. **Rule of thumb: $\gamma\approx1$.** (Not the body-effect $\gamma$.)
- In triode, the channel is just a resistor: $\overline{I^2_{n,d}} = 4kT/r_{ds}$ (Tony). This is why a MOSFET switch obeys $kT/C$.
- The gate-referred form says a MOSFET is as noisy as a resistor of $\gamma/g_m$ in series with its gate. With $\gamma=1$ and $g_m = 1\ \mathrm{mS}$: $4.1\ \mathrm{nV/\sqrt{Hz}}$.

> [!tip] Remark
> $g_m$ is the device transconductance from [[MosFETs#Transconductance]]. The **same** $g_m$ that gives gain sets the noise current; that one fact produces every "maximize $g_m$ here, minimize $g_m$ there" rule in Level 3.

> [!note]- Detail: where $\gamma$ comes from, and its real value
> Razavi's footnote: the exact form is $4kT\gamma g_{d0}$, with $g_{d0}$ the drain-source conductance at $V_{DS}=0$ (i.e. $1/R_{on}$). For a long-channel saturated device $g_{d0} = g_m$, so the textbook writes $g_m$. The channel is not uniform in saturation, so the noise is integrated along it (Tony §9.3.4), giving $\gamma = 2/3$.
>
> Extension (Jespers & Murmann §4.1.1, via the Zettelkasten): **define** $\gamma_n \equiv S_{TH}/(4kTg_m)$ and read it from simulated lookup tables. In weak inversion the channel is a diffusion barrier, the drain current carries full shot noise $2qI_D$, and with $g_m = I_D/(nU_T)$ this gives $\gamma_n = n/2$ (about 0.65 for $n = 1.3$). In strong inversion it rises to roughly 0.7–1.5, increasing as $L$ shrinks: velocity saturation makes $g_m < g_{d0}$ (inflating a $g_m$-normalized coefficient), and hot carriers add excess noise. Never mix a $\gamma$ normalized to $g_{d0}$ with one normalized to $g_m$.
>
> Maximum noise a single MOSFET can produce (Razavi Ex. 7.5): with an ideal current-source load, $\overline{V^2_{n,out}} = 4kT\gamma g_m r_o^2$. The output noise does not depend on whether the input is the gate (CS) or the source (CG); for output noise the input is grounded either way.

### Gate Resistance

```tikz title="Distributed gate resistance: unit transistors far from the gate contact see most of R_G, so the lumped noise equivalent is R_G/3. After Razavi Fig. 7.21(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} node[left]{$G$} to[R, l=$R_{G1}$] (2,2) to[R, l=$R_{G2}$] (4,2) -- (4.6,2);
  \node at (5.1,2) {$\cdots$};
  \draw (5.6,2) to[R, l=$R_{Gn}$] (7.6,2);
  \foreach \x/\i in {2/a,4/b,7.6/c} {
    \draw (\x,2) -- (\x,0.1) node[nmos,anchor=G](m\i){};
    \draw (m\i.D) -- ++(0,0.15) node[above,font=\scriptsize]{$D$};
    \draw (m\i.S) -- ++(0,-0.15) node[below,font=\scriptsize]{$S$};
  }
  \node[font=\scriptsize] at (4.2,-1.9) {all $D$ tied, all $S$ tied; $R_{G1}+\dots+R_{Gn}=R_G$};
  \node[font=\scriptsize] at (4.2,-2.4) {far-end units see most of $R_G$: lumped noise equivalent $R_G/3$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{V^2_{n,R_G}} = 4kT\frac{R_G}{3},\qquad N\text{ fingers: } R_G \to \frac{R_G}{N^2},\qquad \text{negligible if } \frac{R_G}{3}\ll\frac{\gamma}{g_m}}
$$

- Source and drain resistance are usually negligible in a wide device; the poly gate's distributed resistance is not.
- Contacting both ends of the gate cuts the distributed resistance to $R_G/4$; folding into two fingers also gives $R_G/4$. Four fingers: each finger has $R_G/4$, lumped as $R_G/12$, four in parallel → $R_G/48$.
- **Device models usually include channel thermal and flicker noise but not gate-resistance noise.** Add it yourself.

> [!tip] Remark
> This is the finger rule in [[MosFETs#Layout]]: size each finger's gate resistance well below $1/g_m$. Fingers are a noise decision, not only a capacitance one.

### Flicker (1/f) Noise

$$
\boxed{\overline{V^2_{n,g}} = \frac{K}{C_{ox}WL}\cdot\frac1f,\qquad K\sim10^{-25}\ \mathrm{V^2F}}
$$

- Carriers are trapped and released by "dangling bond" states at the oxide–silicon interface. The noise is modelled as a gate voltage, independent (to first order) of bias current and temperature.
- **Area cuts it**: low-noise devices with hundreds of $\mu\mathrm{m}^2$ are normal. More fundamentally, it trades with gate capacitance $WLC_{ox}$.
- **PMOS is quieter**: holes flow in a "buried channel" slightly away from the interface, so fewer are trapped. Tony: use PMOS and large gate area wherever $1/f$ matters.
- $K$ depends on how clean the process is and varies widely; measured spectra are $1/f^{\alpha}$ with $\alpha \approx 0.8$–$1.3$.
- $-10$ dB/decade in power ($\sqrt{S}\propto 1/\sqrt f$).

$$
\boxed{\int_{f_1}^{f_2}\frac{k_v^2}{f}\,df = k_v^2\ln\frac{f_2}{f_1}\qquad\Rightarrow\quad 2.3\,k_v^2\ \text{per decade}}
$$

- Every decade carries the same power. Integrating to $f=0$ diverges, but only logarithmically: going from 1 kHz down to 100 Hz moves the coefficient from 6.91 to 9.21. Components below ~0.01 Hz are indistinguishable from drift and aging; choose $f_L$ by the observation time.

**Corner frequency** $f_C$: where the $1/f$ and thermal densities are equal.

$$
\boxed{f_C = \frac{K}{C_{ox}WL}\cdot\frac{g_m}{4kT\gamma}}
$$

- Depends on area and $g_m$, but for a given $L$ the dependence is weak. Razavi: roughly **10–50 MHz for nanometer devices**; an NMOS with $W/L = 5\ \mu\mathrm{m}/40\ \mathrm{nm}$ at $250\ \mu\mathrm{A}$ has a corner of several hundred MHz.

> [!note]- Detail: a student's flawed argument (Razavi Ex. 7.18)
> Writing the drain flicker current as $\frac{K}{WLC_{ox}f}g_m^2$ and substituting $g_m^2 = 2\mu C_{ox}\frac WL I_D$ gives $2K\mu I_D/(L^2f)$, independent of $W$. Wrong comparison: changing $W$ at fixed $I_D$ also changes $V_{OV}$ and the headroom. Hold both $I_D$ and $V_{OV}$ fixed, $g_m = 2I_D/V_{OV}$, and the drain flicker current is $\frac{K}{WLC_{ox}f}\frac{4I_D^2}{V_{OV}^2}$, which falls as $WL$ grows.
>
> **Ten devices in parallel** (Tony Ex. 9.7): drain flicker current is 10× larger, $g_m$ is 10× larger, so the gate-referred density is 10× **smaller**, exactly what $1/(WL)$ predicts for 10× the area.

> [!note]- Detail: shot noise, diodes and BJTs (Tony §9.3.2–9.3.3)
> **Shot noise** comes from current being a stream of discrete carriers crossing a barrier: $\overline{I^2_d} = 2qI_D$, white, bias-dependent. A diode is a noiseless $r_d = kT/(qI_D)$ in parallel with that source (Thevenin: $2kTr_d$).
>
> **BJT** (active region), both sources at the base:
> $\overline{V_i^2} = 4kT\left(r_b+\frac{1}{2g_m}\right)$, $\overline{I_i^2} = 2q\left(I_B + \frac{K I_B}{f} + \frac{I_C}{|\beta(f)|^2}\right)$. Base-resistance thermal noise usually dominates $V_i$; base shot noise dominates $I_i$. Since they come from different mechanisms, they are usually treated as uncorrelated. Flicker noise matters far less than in MOSFETs. Details in [[BJTs]].

## Level 2: Input-Referred Noise

### Why Refer Noise to the Input

Output noise alone is unfair: put a noiseless gain $A_1$ after a stage and its output noise grows by $A_1^2$, though the SNR is unchanged. Instead, replace all sources by one equivalent source at the input of a **noiseless** copy of the circuit.

$$
\boxed{\overline{V^2_{n,in}} = \frac{\overline{V^2_{n,out}}}{A_v^2}}
$$

- Signal and input-referred noise see the same gain, so $\overline{V^2_{n,in}}$ directly says how small an input the circuit can detect.
- It is a **fictitious** quantity: it cannot be measured at the input. Only the output noise is physical.

### Input-Referred Voltage and Current

```tikz title="Finding the two input-referred sources. Short the input: the output noise comes only from the voltage source. Open it: only from the current source. After Razavi Figs. 7.33-7.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) input shorted
  \draw (0,0) node[ground]{} -- (0,1.5) to[V, l=$\overline{V^2_{n,in}}$] (2.2,1.5) -- (3.2,1.5);
  \draw (2.7,1.5) node[circ]{} to[I, l_=$\overline{I^2_{n,in}}$] (2.7,0) node[ground]{};
  \draw (3.2,0.6) rectangle (5.2,2.4);
  \node[align=center,font=\scriptsize] at (4.2,1.5) {noiseless\\circuit};
  \draw (5.2,1.5) -- (5.7,1.5) node[ocirc]{} node[right]{$V_{n1,out}$};
  \node[align=center,font=\scriptsize] at (2.6,-1.0) {(a) input shorted: $I_{n,in}$ flows in the short,\\ so only $\overline{V^2_{n,in}}$ reaches the output};
  % (b) input open
  \begin{scope}[xshift=8.4cm]
    \draw (0,1.5) node[ocirc]{} node[left,font=\scriptsize]{open} to[V, l=$\overline{V^2_{n,in}}$] (2.2,1.5) -- (3.2,1.5);
    \draw (2.7,1.5) node[circ]{} to[I, l_=$\overline{I^2_{n,in}}$] (2.7,0) node[ground]{};
    \draw (3.2,0.6) rectangle (5.2,2.4);
    \node[align=center,font=\scriptsize] at (4.2,1.5) {noiseless\\circuit};
    \draw (5.2,1.5) -- (5.7,1.5) node[ocirc]{} node[right]{$V_{n2,out}$};
    \node[align=center,font=\scriptsize] at (2.6,-1.0) {(b) input open: no current through $V_{n,in}$,\\ so only $\overline{I^2_{n,in}}$ reaches the output};
  \end{scope}
\end{circuitikz}
\end{document}
```

A single voltage source fails when the circuit has a finite input impedance and a finite source impedance: it would predict the output noise vanishes as the source impedance grows, which is false. Any linear two-port needs **both** $\overline{V^2_{n,in}}$ and $\overline{I^2_{n,in}}$, and they are enough.

- $\overline{V^2_{n,in}}$: output noise with the input **shorted**, divided by the voltage gain.
- $\overline{I^2_{n,in}}$: output noise with the input **open**, divided by the transimpedance gain.

$$
\boxed{\text{$I_{n,in}$ is negligible if } |Z_S|^2 \ll \frac{\overline{V^2_{n,in}}}{\overline{I^2_{n,in}}}}
$$

The **driving** impedance $Z_S$ decides whether $I_{n,in}$ matters, not the circuit's own $Z_{in}$. A MOS gate at low frequency has $\overline{I^2_{n,in}}\approx0$; a common-gate input does not.

> [!note]- Detail: $V_{n,in}$ and $I_{n,in}$ are correlated, but do not double count
> Both sources are built from the same physical sources, so they are correlated. For a CS stage with input capacitance $C_{in}$ (Razavi Ex. 7.12 and Fig. 7.37):
> $V_{n,in} = V_{n,M1} + \frac{V_{n,R_D}}{g_mR_D}$, $I_{n,in} = C_{in}s\left(V_{n,M1} + \frac{V_{n,R_D}}{g_mR_D}\right)$, so $\overline{I^2_{n,in}} = (C_{in}\omega)^2\,4kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)$.
> Add them as **voltages** at the gate through a source impedance $Z_S$: $V_{n,X} = \frac{V_{n,in}+I_{n,in}Z_S}{Z_SC_{in}s+1} = V_{n,M1}+\frac{V_{n,R_D}}{g_mR_D}$, independent of $Z_S$. The output noise is the correct $4kT(\gamma g_m + 1/R_D)R_D^2$; the pair does not double count.
>
> **Shortcut that avoids the correlation** (Razavi §7.10): if the output noise barely changes as the input goes from short to open (true of a CS stage with small $C_{GD}$), then $I_{n,in} = V_{n,in}/Z_{in}$ exactly. Drop $I_{n,in}$ and instead load the preceding stage with $Z_{in}$; the voltage at the input node equals $V_{n,in}$ for any $Z_S$. If the condition fails, treat the two stages as one block with one pair of sources.
>
> **Short-circuit-current shortcut** (Razavi Ex. 7.13): sometimes it is easier to short the output and find the output noise **current**, then divide by $G_m$ (for $V_{n,in}$) or by the current gain (for $I_{n,in}$). For a resistive-feedback stage ($R_F$ from drain to gate, current-source load): $\overline{V^2_{n,in}} = \frac{4kT/R_F + 4kT\gamma g_m}{(g_m-1/R_F)^2}$, $\overline{I^2_{n,in}} = \frac{4kTR_Fg_m^2+4kT\gamma g_m}{(g_mR_F-1)^2}$.

### The Gate-Referral Lemma

$$
\boxed{\text{drain current source } \overline{I_n^2} \;\equiv\; \text{gate voltage source } \overline{V_n^2} = \frac{\overline{I_n^2}}{g_m^2}\quad\text{(any } Z_S,\ \text{low frequency)}}
$$

Both give the same output short-circuit current, $I_{n,out} = g_mV_n/\left[Z_S(g_m+g_{mb}+1/r_o)+1\right]$, for any source impedance. So every transistor can be moved to its gate as $4kT\gamma/g_m + K/(C_{ox}WLf)$. This is the one move used in every stage below.

### Integrate at the Output, Not the Input

The input-referred **spectrum** of a CS stage is flat ($4kT\gamma/g_m$) forever, so integrating it gives infinity. Physically, the output noise is low-pass filtered and integrable. So:

$$
\boxed{\overline{V^2_{n,in,tot}} = \frac{\int_0^\infty \overline{V^2_{n,out}}(f)\,df}{A_{v,\text{mid-band}}^2}}
$$

Integrate at the output, then divide by the mid-band gain. The result is valid for SNR as long as the signal lives in the mid-band.

### Noise Bandwidth

```tikz title="Noise bandwidth: the brick-wall filter with the same peak gain and the same area as the real response. For one pole it is pi/2 times the -3 dB frequency. After Razavi Fig. 7.65 and Tony Fig. 9.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.6,0) node[below] {$f$};
  \draw[->] (0,0) -- (0,2.8) node[above] {$\overline{V^2_{n,out}}$};
  \fill[gray!20] (0,0) rectangle (2.83,2);
  \draw[thick,domain=0:7.2,samples=100] plot (\x,{2/(1+(\x/1.8)^2)});
  \draw[dashed] (2.83,0) -- (2.83,2) -- (0,2);
  \node[left,font=\scriptsize] at (0,2) {$V_0^2$};
  \draw[dotted] (1.8,0) -- (1.8,1.0);
  \node[below,font=\scriptsize] at (1.8,0) {$f_0$};
  \node[below,font=\scriptsize] at (3.1,0) {$B_n=\frac{\pi}{2}f_0$};
  \node[font=\scriptsize,anchor=west] at (3.4,1.6) {shaded box area $=$ area under curve};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_0^2\,B_n = \int_0^\infty\overline{V^2_{n,out}}\,df,\qquad \text{one pole: } B_n = \frac{\pi}{2}f_0 = \frac{1}{4R_{eq}C}}
$$

Use it to compare circuits with the same low-frequency noise but different roll-offs, and to integrate white noise through one pole in one multiplication.

> [!tip] Remark
> $f_0 = 1/(2\pi R_{eq}C)$ is the dominant pole from [[Frequency Response#First Order]]. The same $R_{eq}$ you find with the open-circuit time-constant method is the one in $B_n = 1/(4R_{eq}C)$.

> [!note]- Detail: piecewise integration and the 1/f tangent rule (Tony §9.2.6–9.2.7)
> For hand estimates, treat straight-line Bode plots of $\sqrt{S}$ as exact and integrate each segment: a flat segment gives $S\Delta f$; a $1/f$ segment gives $k^2\ln(f_2/f_1)$; a one-pole tail uses the noise bandwidth minus the part already counted. In Tony's Ex. 9.6 the total is $77.5\ \mu\mathrm{V_{rms}}$, of which the single high-frequency region is $76.7\ \mu\mathrm{V_{rms}}$.
>
> **1/f tangent principle:** lower a $1/f$ line (constant power per decade) onto the $S(f)$ plot; where it touches first is the region that dominates the total. Care is needed where the spectrum runs parallel to the $1/f$ line over a long span (it then contributes per decade, and the limits matter).

## Level 3: Noise of the Basic Stages

Each stage below uses the lemma: every transistor becomes a gate voltage source, every resistor a $4kT/R$ current, and everything is divided by the squared gain. Gains and output resistances come from [[Single-Stage]] and [[Differential Amplifiers]]. Low frequency throughout, unless stated.

### Common Source

```tikz title="CS stage noise sources. With lambda = 0 both noise currents flow entirely through R_D. After Razavi Fig. 7.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M){};
  \draw (M.S) node[ground]{};
  \draw (M.G) -- ++(-0.6,0) node[ocirc]{} node[left]{$V_{in}=0$};
  \draw (M.D) -- (0,1.6) coordinate (out) node[circ]{};
  \draw (out) to[R, l=$R_D$] (0,3.6) -- (1.5,3.6);
  \draw (0.75,3.6) node[vcc]{$V_{DD}$};
  \draw (out) -- (1.5,1.6) node[circ]{} to[I, l_={$\overline{I^2_{n,R_D}}=\dfrac{4kT}{R_D}$}] (1.5,3.6);
  \draw (1.5,1.6) -- (3.4,1.6) node[circ]{} to[I, l={$\overline{I^2_{n1}}=4kT\gamma g_m+\dfrac{Kg_m^2}{C_{ox}WLf}$}] (3.4,-0.9) node[ground]{};
  \draw (3.4,1.6) -- (7.4,1.6) node[ocirc]{} node[right]{$\overline{V^2_{n,out}}$};
  \node[font=\scriptsize,align=left,anchor=west] at (-1.2,-2.0) {$\lambda=0$: both currents flow only in $R_D$, so $\overline{V^2_{n,out}}=\left(\overline{I^2_{n1}}+\overline{I^2_{n,R_D}}\right)R_D^2$ and $\overline{V^2_{n,in}}=\overline{V^2_{n,out}}/(g_mR_D)^2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{V^2_{n,in}} = 4kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)+\frac{K}{C_{ox}WL}\frac1f}
$$

- First term: the transistor (a resistor $\gamma/g_m$ at the gate). Second: $R_D$, shrinking as $R_D$ grows because its noise voltage at the output grows as $\sqrt{R_D}$ but the gain grows as $R_D$.
- "Equivalent noise resistance" $R_T$: the input thermal noise is $4kTR_T$; here $R_T = \gamma/g_m + 1/(g_m^2R_D)$.

**Current-source load** (M2 is a PMOS current source):

$$
\boxed{\overline{V^2_{n,in}} = 4kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m2}}{g_{m1}^2}\right)+\frac{K_N}{C_{ox}(WL)_1f}+\frac{K_P}{C_{ox}(WL)_2f}\frac{g_{m2}^2}{g_{m1}^2}}
$$

> [!important] The central design rule
> A transistor that **amplifies** (signal at its gate) wants **large** $g_m$: its output noise grows as $g_m$ but its gain as $g_m^2$ (in power). A transistor that is a **current source** wants **small** $g_m$: it adds noise and no gain.

- **Complementary CS** (input on both gates): both devices amplify, so $\overline{V^2_{n,in}} = \dfrac{4kT\gamma}{g_{m1}+g_{m2}}$, lower than with a current-source load for the same bias current.
- **Low noise with a resistive load:** substituting $g_m = 2I_D/V_{OV}$, $\overline{V^2_{n,in}} = 4kT\left[\frac{\gamma V_{OV}}{2I_D}+\frac{V_{OV}^2}{4I_D\cdot I_DR_D}\right]$. Raising $I_D$ with $V_{OV}$ and $I_DR_D$ held fixed (i.e. $W\propto I_D$) lowers both terms. Costs: power, capacitance, headroom.
- **1/f**: increase $WL$ at fixed $W/L$. Thermal noise and $g_m$ are unchanged; capacitance rises.

> [!note]- Derivation: CS with a resistor and a current source in parallel as the load (Razavi Ex. 7.17)
> Load $R_D \| r_{o1} \| r_{o2}$, M2 a PMOS current source. Each gate source passes through its own transconductance into the same load, so the load cancels on input referral:
> $\overline{V^2_{n,in}} = 4kT\left(\frac{\gamma}{g_{m1}}+\frac{\gamma g_{m2}}{g_{m1}^2}+\frac{1}{g_{m1}^2R_D}\right)+\frac{K_N}{C_{ox}(WL)_1f}+\frac{K_P}{C_{ox}(WL)_2f}\frac{g_{m2}^2}{g_{m1}^2}$.
> It reduces to the resistive-load CS for $g_{m2}=0$ and to the current-source-load CS for $R_D=\infty$.

### Bandwidth-Limited CS: Total Noise and SNR

The spectrum is useless without a bandwidth. With load capacitance $C_L$ and a resistive load:

$$
\boxed{\overline{V^2_{n,out,tot}} = \frac{kT}{C_L}\left(1+\gamma g_mR_D\right),\qquad \overline{V^2_{n,in,tot}}\approx\frac{\gamma kT}{g_mR_DC_L}\ \ (R_D\text{ noise neglected})}
$$

- The output noise is $kT/C_L$ (from $R_D$) plus $kT/C_L$ multiplied by $\gamma g_mR_D$ (from M1). Both see the same pole.
- For a current-source load: $\overline{V^2_{n,out,tot}} = \gamma(g_{m1}+g_{m2})(r_{o1}\|r_{o2})\dfrac{kT}{C_L}$, and the output SNR for a sinusoid of peak $V_m$ is $\dfrac{C_L}{2\gamma kT}\dfrac{g_{m1}^2(r_{o1}\|r_{o2})}{g_{m1}+g_{m2}}V_m^2$. **SNR grows with $C_L$, i.e. with less bandwidth.** Broadband and low noise fight.

> [!note]- Derivation and design example (Razavi Ex. 7.19)
> Output noise: $\overline{V^2_{n,out}} = \frac{4kTR_D + 4kT\gamma g_mR_D^2}{R_D^2C_L^2\omega^2+1} = \frac{4kTR_D(1+\gamma g_mR_D)}{R_D^2C_L^2\omega^2+1}$. The $4kTR_D$-over-one-pole integral is $kT/C_L$, giving the boxed result. Divide by $g_m^2R_D^2$ to refer to the input.
>
> **Spec:** $100\ \mu\mathrm{V_{rms}}$ total input noise, 1 mW, 1 GHz, $V_{DD}=1$ V, $\gamma = 1$. Using $1/(2\pi R_DC_L) = 1\ \mathrm{GHz}$: $\frac{1+\gamma g_mR_D}{g_m^2R_D}\cdot\frac{2\pi kT}{2\pi R_DC_L} = (100\ \mu\mathrm{V})^2$ → $\frac1{g_m}\left(\frac{1}{g_mR_D}+\gamma\right) = 384\ \Omega$. Choosing $g_mR_D = 3$: $1/g_m = 288\ \Omega$, $R_D = 864\ \Omega$. With $I_D = 1$ mA, $I_DR_D = 864$ mV, leaving only $V_{DS,min}=136$ mV. The gain choice trades directly against headroom.

### Common Gate

$$
\boxed{\overline{V^2_{n,in}} = \frac{4kT(\gamma g_m+1/R_D)}{(g_m+g_{mb})^2},\qquad \overline{I^2_{n,in}} = \frac{4kT}{R_D}}
$$

- The input is low impedance, so $I_{n,in}$ matters even at low frequency.
- With the input open, M1's own noise current circulates inside the device ($I_{n1}+I_{D1}=0$) and does not reach the output. $R_D$'s noise goes straight to the input: a CG stage has **no current gain**, so the load's noise current is referred 1:1. This is its main drawback as a first stage.
- The **bias current source** (M2 at the source) adds its whole noise current to $\overline{I^2_{n,in}}$: keep $g_{m2}$ small, which costs $V_{DS2}$ and headroom.
- With a PMOS current-source load M3 (Razavi Ex. 7.20): $\overline{V^2_{n,in}} = \frac{4kT\gamma(g_{m1}+g_{m3})}{(g_{m1}+g_{mb1})^2}$, $\overline{I^2_{n,in}} = 4kT\gamma(g_{m2}+g_{m3})$. Every current source appears in proportion to its own $g_m$.

> [!note]- Detail: flicker noise of the CG stage with current-source bias (Razavi Fig. 7.50)
> Model each device's flicker noise at its gate. Input shorted: $\overline{V^2_{n,in}} = \frac{1}{C_{ox}f}\left[\frac{K_Ng_{m1}^2}{(WL)_1}+\frac{K_Pg_{m3}^2}{(WL)_3}\right]\frac{1}{(g_{m1}+g_{mb1})^2}$. Input open: $\overline{I^2_{n,in}} = \frac{1}{C_{ox}f}\left[\frac{K_Ng_{m2}^2}{(WL)_2}+\frac{K_Pg_{m3}^2}{(WL)_3}\right]$. Add these to the thermal results.

### Source Follower

$$
\boxed{\overline{V^2_{n,in}} = 4kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m2}}{g_{m1}^2}\right)}
$$

- The input impedance is high, so $I_{n,in}$ is negligible for moderate source impedances.
- Same form as the CS stage with a current-source load, but with gain below 1: it adds noise and gives no gain. **Avoid followers in low-noise signal paths.**

### Cascode

$$
\boxed{\overline{V^2_{n,in}}\Big|_{M_1,R_D} = 4kT\left(\frac{\gamma}{g_{m1}}+\frac{1}{g_{m1}^2R_D}\right),\qquad M_2\text{: negligible at low frequency}}
$$

- The cascode device's noise current circulates inside it ($I_{n2}+I_{D2}=0$ with $\lambda_1 = 0$); equivalently, its gate source sees a huge degeneration at node X. So **cascoding is noise-free at low frequency.**
- At high frequency the capacitance $C_X$ at node X gives M2's gate source a gain $\approx \dfrac{-R_D}{1/g_{m2}+1/(C_Xs)}$, and $C_X$ also steals M1's signal current. The input-referred noise can rise considerably at high frequency.

> [!tip] Remark
> $C_X$ is the same node capacitance that sets the cascode's non-dominant pole in [[Frequency Response#Cascode]]. Keeping node X small helps both bandwidth and high-frequency noise.

### Current Mirrors

A mirror copies its reference device's noise along with its current, multiplied by the mirror ratio $N$.

$$
\boxed{\overline{I^2_{n,out}} = \left(\frac{N g_{m,REF}^2}{C_B^2\omega^2+g_{m,REF}^2}+1\right)g_{m1}^2\overline{V^2_{n1}},\qquad \text{suppress REF noise if } C_B^2\gg\frac{(N-1)g_{m,REF}^2}{\omega^2}}
$$

- $N = (W/L)_1/(W/L)_{REF}$, typically 5–10 to save reference-branch power. With equal $L$, $\overline{V^2_{n,REF}} = N\overline{V^2_{n1}}$ (flicker density $\propto1/WL$).
- A bypass capacitor $C_B$ on the gate line filters the reference noise, but the numbers are brutal: $N=5$, $g_{m,REF} = 1/200\ \Omega$, $f_{min}=1$ MHz needs $C_B\gg 1.6\ \mathrm{nF}$; 10× suppression takes about **5 nF**.
- **Fix:** put a large resistor $R_B$ between the diode device and $C_B$. The pole moves to $1/[(1/g_{m,REF}+R_B)C_B]$, and $R_B$'s thermal noise stays small next to MREF's flicker noise. Realize $R_B$ as a long, narrow MOSFET at small overdrive. Gate leakage through $R_B$ limits how large it can be.
- Do not forget the reference current's own noise (from a bandgap; see [[Bandgap References]]).

> [!tip] Remark
> These are the mirrors of [[Current Mirrors]]. The same $N$ that saves bias power multiplies the reference device's noise power by $N$.

### Differential Pair

```tikz title="Differential-pair noise: each transistor becomes a gate voltage source and each load resistor is divided by g_m^2 R_D^2. Two devices in the signal path give twice the noise power of the half circuit. After Razavi Fig. 7.57."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (4,0) node[nmos,xscale=-1](M2){};
  \draw (M1.S) -- (M2.S);
  \draw (2,-0.77) to[I, l=$I_{SS}$] (2,-2.6) node[ground]{};
  \draw (M1.D) to[R, l=$R_D$] (0,3.0) -- (4,3.0) to[R, l=$R_D$] (M2.D);
  \draw (2,3.0) node[vcc]{$V_{DD}$};
  \draw (M1.G) to[V, l_=$\overline{V^2_{n1}}$] ++(-1.8,0) node[ground,rotate=-90]{};
  \draw (M2.G) to[V, l=$\overline{V^2_{n2}}$] ++(1.8,0) node[ground,rotate=90]{};
  \draw (M1.D) -- ++(0.6,0) node[ocirc]{};
  \draw (M2.D) -- ++(-0.6,0) node[ocirc]{};
  \node[font=\scriptsize] at (2,1.1) {$\overline{V^2_{n,out}}$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.6,-1.6) {$\overline{V^2_{n1}}=\overline{V^2_{n2}}=\dfrac{4kT\gamma}{g_m}+\dfrac{K}{C_{ox}WLf}$\\[2pt] each $R_D$: $\dfrac{4kTR_D}{(g_mR_D)^2}$ at the input};
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{V^2_{n,in}} = 8kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)+\frac{2K}{C_{ox}WL\,f}}
$$

- **Twice the half circuit** (input noise voltage $\sqrt2\times$ a CS stage with the same $g_m$): two devices sit in series in the signal path and their powers add. It also burns twice the current of one CS stage with the same device.
- The input-referred noise power of a fully differential circuit is twice that of its half circuit, in general.
- The tail node is **not** a virtual ground for noise (M1 and M2 noise currents are uncorrelated), so no half-circuit trick for the derivation. Half of $I_{n1}$ flows in each load, giving $I_{n1}^2R_D^2$ differentially.

**Current-source loads** (M3, M4) and the **five-transistor OTA** give the same thermal result:

$$
\boxed{\overline{V^2_{n,in}} = 8kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m3}}{g_{m1}^2}\right)+\frac{2K_N}{C_{ox}(WL)_1f}+\frac{2K_P}{C_{ox}(WL)_3f}\frac{g_{m3}^2}{g_{m1}^2}}
$$

- Again: maximize the input pair's $g_m$, minimize the loads' $g_m$. Tony: for fixed current, that means pushing the input pair toward weak inversion.
- **Tail noise**: with zero differential input, the tail noise splits evenly and is purely common-mode. With a differential input it modulates the transconductance, $I_{D1}-I_{D2}\approx g_{m0}(1+I_n/2I_{SS})V_{in}$, which is usually negligible. In the 5T OTA (single-ended output) the tail noise produces $\overline{I_n^2}/(4g_{m3}^2)$ at the output with the inputs tied.

> [!tip] Remark
> These are the stages of [[Differential Amplifiers]], and the 5T OTA is the first stage of most [[Operational Amplifiers|op amps]]. When the first stage has gain, it sets the op amp's input noise.

> [!note]- Detail: flicker noise of a PMOS-input pair with NMOS mirror loads (Tony §9.4.3)
> Substituting $g_{mi} = \sqrt{2\mu_iC_{ox}(W/L)_iI_D}$ into the load term (input pair Q1/Q2 PMOS, loads Q3/Q4 NMOS):
> $\overline{V^2_{ni}}(f) = \frac{2}{C_{ox}f}\left[\frac{K_1}{W_1L_1}+\frac{\mu_n}{\mu_p}\frac{K_3L_1}{W_1L_3^2}\right]$.
> 1. With $L_1 = L_3$ the **NMOS loads dominate** ($\mu_n>\mu_p$ and $K_3 > K_1$ typically).
> 2. **Lengthen the loads** ($1/L_3^2$): a large gain, at some cost in swing.
> 3. The result is independent of $W_3$.
> 4. Widening $W_1$ helps both flicker and thermal noise.
> 5. Lengthening $L_1$ **hurts**: it quiets the input pair (not dominant) and raises the referred load noise (dominant).
>
> Integrate over $f_1$–$f_2$ by multiplying by $\ln(f_2/f_1)$.
>
> **Floating-resistor pitfall** (Razavi Ex. 7.21): a differential pair biased at tiny current, used as a large resistor $\approx 2/g_{m1}$ between its sources, has $\overline{V^2_{n,AB}} = 8kT\gamma(g_{m1}+g_{m3})/g_{m1}^2 + $ flicker terms. That is noisier (and far less linear) than an ohmic resistor of the same value.

### Op-Amp Circuits

```tikz title="An op amp is a noiseless core plus three uncorrelated input sources. Resistor noise is drawn as currents for R_1 and R_f, as a voltage for R_2. After Tony Figs. 9.11, 9.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (4,0) node[op amp](A){};
  \draw (A.-) -- ++(-0.5,0) coordinate (nm);
  \draw (A.+) -- ++(-0.4,0) coordinate (p0);
  % feedback network
  \draw (nm) -- ++(0,1.5) coordinate (ft) -- ++(0.6,0) coordinate (r1);
  \draw (r1) to[R, l_=$R_f$] ++(2.4,0) coordinate (r2) -- (r2 |- A.out) -- (A.out);
  \draw (r1) -- ++(0,1.0) coordinate (c1) to[C, l=$C_f$] (c1 -| r2) -- (r2);
  \draw (A.out) -- ++(0.8,0) node[ocirc]{} node[right]{$V_{no}$};
  % inverting input: R1 and In-
  \draw (nm) -- ++(-1.4,0) coordinate (N) node[circ]{};
  \draw (N) to[R, l=$R_1$] ++(-2.0,0) coordinate (L) node[ground,rotate=-90]{};
  \draw (N) to[I, l_=$\overline{I^2_{n-}}$] ++(0,-1.8) node[ground]{};
  % noninverting input: Vn, R2, In+
  \draw (p0) to[V, l=$\overline{V^2_n}$] ++(0,-1.9) coordinate (P) node[circ]{};
  \draw (P) to[R, l=$R_2$] ++(0,-1.6) node[ground]{};
  \draw (P) -- ++(1.6,0) to[I, l=$\overline{I^2_{n+}}$] ++(0,-1.6) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (6.4,-2.2) {op amp = noiseless core\\ $+\ \overline{V^2_n},\ \overline{I^2_{n-}},\ \overline{I^2_{n+}}$ (uncorrelated);\\ each resistor adds its own $4kT/R$ or $4kTR$};
\end{circuitikz}
\end{document}
```

- An op amp needs **three** sources: $\overline{V_n^2}$, $\overline{I^2_{n-}}$, $\overline{I^2_{n+}}$. Dropping any one fails for some circuit: without $V_n$ a unity-gain buffer looks noiseless; without $I_n$ a large source resistance looks free. A MOS input stage usually makes the current noise negligible at low frequency.
- In the inverting integrator/filter of the figure, the noise currents at the virtual ground ($I_{n1}$, $I_{nf}$, $I_{n-}$) flow through $R_f\|C_f$. The voltages at the + input ($V_n$, $V_{n2}$, $I_{n+}R_2$) see the noise gain $1+\dfrac{R_f/R_1}{1+j2\pi fR_fC_f}$.

$$
\boxed{\overline{V^2_{no}}\ge\frac{kT}{C_f}\ \text{(capacitive feedback; } \times(1+R_f/R_1)\text{ with } R_1\text{)},\qquad \text{noise gain} \to 1 \text{ out to } f_t}
$$

- The + input sources are only filtered by the op amp itself: above the feedback pole the noise gain falls to 1 and stays there until the op amp's unity-gain frequency $f_t$. **A faster op amp is noisier.**
- Delete $R_2$ (the bias-current-balancing resistor) in low-noise designs: it adds both its own noise and $I_{n+}R_2$.

> [!note]- Worked example: 10-kHz active low-pass (Tony Ex. 9.10)
> $C_f = 160$ pF, $R_f = 100\ \mathrm{k}\Omega$, $R_1 = 10\ \mathrm{k}\Omega$, $R_2 = 9.1\ \mathrm{k}\Omega$; op amp $20\ \mathrm{nV/\sqrt{Hz}}$, $0.6\ \mathrm{pA/\sqrt{Hz}}$, $f_t = 5$ MHz.
> - Virtual-ground currents: $(0.406^2+1.28^2+0.6^2)\ \mathrm{pA^2/Hz}\times R_f^2 = (147\ \mathrm{nV/\sqrt{Hz}})^2$, times $1/(4R_fC_f)$ → $18.4\ \mu\mathrm{V_{rms}}$.
> - + input voltages: $(24.1\ \mathrm{nV/\sqrt{Hz}})^2\times11^2 = (265\ \mathrm{nV/\sqrt{Hz}})^2$ through the pole, plus $(24.1\ \mathrm{nV})^2\cdot\frac{\pi}{2}(f_t-f_1)$ at unity noise gain → $74.6\ \mu\mathrm{V_{rms}}$.
> - Total $77\ \mu\mathrm{V_{rms}}$; with 1 V rms out (100 mV in, gain 10), SNR = 82 dB. The op amp's $V_n$ dominates.

### Cascaded Stages

$$
\boxed{\overline{V^2_{n,in,tot}} = \overline{V^2_{n1}}+\frac{\overline{V^2_{n2}}}{A_1^2}+\frac{\overline{V^2_{n3}}}{A_1^2A_2^2}+\cdots}
$$

**The first stage dominates if it has gain.** Tony Ex. 9.9: amplifiers with 1 µV (gain 3) and 0.75 µV (gain 8) input noise. Gain-8 first gives $0.76\ \mu\mathrm{V}$ total, almost the first stage alone. Low-noise systems therefore start with a low-noise, high-gain preamp. This is also why the first stage of a two-stage op amp sets its noise.

## Level 4: Designing for Noise

### Noise vs. Power: Linear Scaling

```tikz title="Linear scaling: two copies of a stage in parallel (doubled W and current, halved R_D) keep the gain and swing and halve the output noise power. After Razavi Figs. 7.63-7.64."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M){};
  \draw (M.S) node[ground]{};
  \draw (M.D) to[R, l_=$R_D$] (0,2.6) node[vcc]{$V_{DD}$};
  \draw (M.D) -- ++(0.8,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (M.G) -- ++(-0.5,0) node[ocirc]{} node[left]{$V_{in}$};
  \node[font=\scriptsize] at (0.2,-1.9) {$W,\ I_D,\ R_D$};
  \node at (2.6,0.8) {\Large $\Rightarrow$};
  \begin{scope}[xshift=5cm]
    \draw (0,0) node[nmos](A){};
    \draw (2.4,0) node[nmos](B){};
    \draw (A.S) node[ground]{};
    \draw (B.S) node[ground]{};
    \draw (A.D) to[R, l_=$R_D$] (0,2.6) -- (2.4,2.6) to[R, l=$R_D$] (B.D);
    \draw (1.2,2.6) node[vcc]{$V_{DD}$};
    \draw (A.D) -- (B.D) -- ++(0.8,0) node[ocirc]{} node[right]{$V_{out}$};
    \draw (A.G) -- ++(-0.4,0) coordinate (g) node[ocirc]{} node[left]{$V_{in}$};
    \draw (B.G) -- ++(-0.3,0) -- ++(0,-1.55) -- (g |- 0,-1.55) -- (g);
    \node[font=\scriptsize] at (1.2,-1.95) {$\equiv\ 2W,\ 2I_D,\ R_D/2$};
  \end{scope}
  \node[font=\scriptsize,align=center] at (5,-2.6) {same gain $g_mR_D$ and swing; uncorrelated outputs average: noise power $\times\frac12$, power $\times2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{2 copies in parallel: } \overline{V^2_{n,out}}\to\tfrac12\overline{V^2_{n,out}} \text{ at } 2\times \text{power}, \text{ same gain and swing}}
$$

- Works for any circuit (whose input noise current is negligible). The two outputs' Thevenin noises are uncorrelated and each is divided by 2 in amplitude, so the power halves.
- **3 dB less noise costs 2× power** (and 2× input capacitance; the input-referred noise current doubles). This assumes the bandwidth is fixed by the application.

### Choosing the Bias Point (gm/ID)

Extension from Jespers & Murmann §4.1 (via the Zettelkasten). With bandwidth $\omega_u = g_m/C_L = \omega_T/\mathrm{FO}$ (fan-out $\mathrm{FO} = C_L/C_{gg}$) and input noise $4kT\gamma_n/g_m$, the device width cancels from a noise-bandwidth-current figure of merit:

$$
\boxed{\mathrm{FoM} = \frac{\omega_u}{I_D\,\overline{V^2_{n,in}}} = \frac{\omega_T\cdot(g_m/I_D)}{4kT\gamma_n\,\mathrm{FO}}}
$$

- Only the bias point is left: the product $\omega_T\cdot g_m/I_D$. The square law says it saturates at strong inversion; mobility degradation bends it down, so it **peaks** in moderate inversion. In JM's 65-nm data the peak is near **$g_m/I_D\approx 7\ \mathrm{S/A}$ at minimum $L$** (it scales as $1/L^2$).
- If noise matters far more than speed, drop $\omega_u$ from the FoM and push toward weak inversion (higher $g_m/I_D$), as Tony also concludes for the input pair.
- For current-source loads the opposite: low $g_m/I_D$ cuts their noise but raises $V_{D,sat}\approx2/(g_m/I_D)$ and eats swing, so the best dynamic range sits at an interior optimum (JM §4.1.3).
- Worked example (JM): $1\ \mathrm{nV/\sqrt{Hz}}$ input noise with $\gamma_n\approx0.8$ needs $g_m = 4kT\gamma_n/S = 13.3$ mS, i.e. $1.9$ mA at 7 S/A.

> [!tip] Remark
> This is the [[MosFETs#gm/ID and ID/W Simulation-Aided Design|gm/ID method]] with noise as the spec that fixes $g_m$. Read $\gamma_n$ from the same lookup tables (it is not $2/3$). Full method in [[gm-ID Design Methodology]].

### Flicker Noise Only Matters in Narrow Bands

Extension from JM §4.1.4. With $S_v = S_{th}(1+f_{co}/f)$ integrated from $f_L$ to $\mathrm{BW}$:

$$
\boxed{E = \frac{\overline{V^2_n}}{S_{th}\,\mathrm{BW}} = 1+\frac{f_{co}}{\mathrm{BW}}\ln\frac{\mathrm{BW}}{f_L}}
$$

- Band $0.01f_{co}$–$100f_{co}$: $E = 1.09$ (0.4 dB). Band ending at $f_{co}$: $E = 5.6$ (7.5 dB). **Wideband circuits integrate their flicker noise away**; narrowband ones (bandgaps, DC sensor front ends, low-offset-frequency phase noise) must fight the corner with area, PMOS, or chopping/CDS (see [[Switched-Capacitor Circuits]]).

### Dynamic Range and the Size of C

Noise sets the smallest signal; linearity sets the largest ([[Nonlinearity and Mismatch]]). Their ratio is the dynamic range, and $kT/C$ turns it into a capacitor size:

$$
\boxed{C = \frac{kT}{\overline{V^2_{n}}},\qquad V_{n,rms} = \frac{V_{sig,rms}}{10^{\mathrm{DR}/20}}}
$$

- Tony Ex. 9.8: 96 dB below $1\ \mathrm{V_{rms}}$ is $15.8\ \mu\mathrm{V_{rms}}$, so $C\ge16.6$ pF. Every 6 dB more costs 4× the capacitance, and with it 4× the current at the same bandwidth.
- Averaging many uncorrelated samples (oversampling) is the way past this limit ([[Delta-Sigma ADCs]]).

```tikz title="SNDR vs. signal amplitude: noise-limited (tracks SNR) at small amplitude, distortion-limited (about 1/THD) at large amplitude, with a maximum in between. After Tony Fig. 9.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right] {amplitude (dB)};
  \draw[->] (0,0) -- (0,4.2) node[above] {SNDR (dB)};
  \draw[thick] (0.3,0.3) -- (4.6,3.3);
  \draw[thick,domain=4.6:6.4,samples=30] plot (\x,{3.3+0.7*(\x-4.6)-0.9*(\x-4.6)^2});
  \draw[dashed] (4.6,3.3) -- (6.0,4.0);
  \draw[dashed] (3.4,3.8) -- (7.0,1.0);
  \node[font=\scriptsize,anchor=west] at (6.9,1.2) {$\approx 1/\mathrm{THD}$};
  \draw[dotted] (4.95,0) -- (4.95,3.42);
  \node[below,font=\scriptsize] at (4.95,0) {$A_{opt}$};
  \node[left,font=\scriptsize] at (0,3.42) {SNDR$_{max}$};
  \draw[dotted] (0,3.42) -- (4.95,3.42);
  \node[font=\scriptsize,rotate=35] at (2.0,1.9) {noise-limited: $\approx$ SNR};
  \node[font=\scriptsize] at (6.6,3.2) {distortion-limited};
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{SNDR} = 10\log\frac{V_f^2}{N_o+V_{h2}^2+V_{h3}^2+\cdots}}
$$

$\mathrm{SNDR}_{max}$ is a single-number dynamic range. Harmonics grow faster than the fundamental, so past $A_{opt}$ more signal hurts.

## Where Noise Goes Next

> [!tip] Remark: noise figure
> RF quotes noise as a **noise factor** relative to the source resistance's own $4kTR_s$: $F = 1+\overline{v^2_{ai}}/(4kTR_s)$, $\mathrm{NF} = 10\log F$ (Tony §9.3.8). Its cascade rule (Friis) is the power-gain analogue of [[#Cascaded Stages]]. Noise figure, noise temperature, Friis and sensitivity live in [[RF Noise and Distortion]].

> [!tip] Remark: jitter and phase noise
> Voltage noise at a clock edge becomes timing noise, $\sigma_\tau\approx\sigma_n/\text{slope}$ (Tony §19.3), and the circuit noise of Level 3 becomes the clock's phase-noise spectrum. Link jitter (RJ/DJ, BER) lives in [[Link Noise and Jitter]]; oscillator phase noise in [[Oscillators]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $g_m$ of signal devices (↑ $I_D$ or $W$) | Thermal $\overline{V^2_{n,in}}\propto1/g_m$ | Power; $W$ adds capacitance |
| ↓ $g_m$ of current-source devices (↑ $V_{OV}$) | Their referred noise $\propto g_{m,load}/g_{m1}^2$ | Headroom ($V_{D,sat}$), swing |
| ↑ $WL$ at fixed $W/L$ | Flicker $\propto1/(WL)$; matching | Capacitance, speed, area |
| PMOS input / long NMOS loads | Flicker noise | PMOS: lower $g_m$ per amp |
| ↑ $R_D$ | $R_D$ term $\propto1/(g_m^2R_D)$, gain | Headroom, bandwidth |
| ↓ bandwidth (↑ $C_L$) | Integrated noise ($kT/C$), SNR | Speed |
| ↑ sampling / feedback $C$ | $kT/C$, dynamic range (4× $C$ per 6 dB) | Power at fixed bandwidth, area |
| Linear scaling (2 copies) | −3 dB noise power | 2× power, 2× input capacitance |
| Differential instead of single-ended | Supply/CM rejection, even-order distortion | 2× input noise power vs. half circuit |
| More gate fingers | Gate-resistance noise $\propto R_G/N^2$ | S/D perimeter capacitance |
| Bypass $C_B$ / series $R_B$ on mirrors | Reference-device noise | Area (nF!), leakage error |
| $g_m/I_D\approx7$ S/A at $L_{min}$ (65 nm) | Best noise·bandwidth per amp | Intrinsic gain |
| Gain in the first stage | Later stages divided by $A_1^2$ | First stage must be low-noise |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Average power | $\overline{x^2} = \lim\frac1T\int x^2dt = \int_0^\infty S_x\,df$ |
| One- vs two-sided | $S_{1\text{-sided}} = 2S_{2\text{-sided}}$ |
| Filtering | $S_y = S_x\,\lvert H(j2\pi f)\rvert^2$ |
| Sum of sources | $\overline{v^2} = \overline{v_1^2}+\overline{v_2^2}+2Cv_{1}v_{2}$; uncorrelated: powers add |
| SNR | $10\log(P_{sig}/P_n)$; sinusoid $P_{sig} = A^2/2$ |
| Resistor | $4kTR$ or $4kT/R$; $1\ \mathrm{k}\Omega\to4.06\ \mathrm{nV/\sqrt{Hz}}$ |
| RC / sampled noise | $kT/C$ ($1\ \mathrm{pF}\to64.3\ \mu\mathrm{V_{rms}}$); inductor $kT/L$ |
| MOSFET thermal | $4kT\gamma g_m$ (drain) $= 4kT\gamma/g_m$ (gate); $\gamma = 2/3$ to $1$ |
| MOSFET triode | $4kT/r_{ds}$ |
| Gate resistance | $4kTR_G/3$; $N$ fingers $R_G/N^2$; need $R_G/3\ll\gamma/g_m$ |
| Flicker | $\frac{K}{C_{ox}WL f}$, $K\sim10^{-25}\ \mathrm{V^2F}$ |
| Flicker integral | $k_v^2\ln(f_2/f_1)$; $2.3k_v^2$ per decade |
| Flicker corner | $f_C = \frac{K}{C_{ox}WL}\frac{g_m}{4kT\gamma}$ |
| Shot noise | $2qI_D$ |
| Input-referred | $\overline{V^2_{n,in}} = \overline{V^2_{n,out}}/A_v^2$ (short input); $\overline{I^2_{n,in}}$ (open input) |
| $I_{n,in}$ negligible | $\lvert Z_S\rvert^2\ll\overline{V^2_{n,in}}/\overline{I^2_{n,in}}$ |
| Gate-referral lemma | $\overline{V_n^2} = \overline{I_n^2}/g_m^2$ |
| Total input noise | $\int\overline{V^2_{n,out}}df / A_{mid}^2$ |
| Noise bandwidth | $B_n = \frac\pi2f_0 = \frac{1}{4R_{eq}C}$ |
| CS, resistive load | $4kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)+\frac{K}{C_{ox}WLf}$ |
| CS, current-source load | $4kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m2}}{g_{m1}^2}\right)$ |
| Complementary CS | $4kT\gamma/(g_{m1}+g_{m2})$ |
| BW-limited CS | $\overline{V^2_{n,out,tot}} = \frac{kT}{C_L}(1+\gamma g_mR_D)$ |
| CG | $\overline{V^2_{n,in}} = \frac{4kT(\gamma g_m+1/R_D)}{(g_m+g_{mb})^2}$, $\overline{I^2_{n,in}} = \frac{4kT}{R_D}$ |
| Source follower | $4kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m2}}{g_{m1}^2}\right)$ |
| Cascode | same as CS; cascode device negligible at LF |
| Mirror | $\overline{I^2_{n,out}} = \left(\frac{Ng_{m,R}^2}{C_B^2\omega^2+g_{m,R}^2}+1\right)g_{m1}^2\overline{V^2_{n1}}$ |
| Diff pair, resistive | $8kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)+\frac{2K}{C_{ox}WLf}$ |
| Diff pair / 5T OTA, active load | $8kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m3}}{g_{m1}^2}\right)$ |
| Op-amp feedback cap | $\overline{V^2_{no}}\ge kT/C_f$ |
| Cascade | $\overline{V^2_{n1}}+\overline{V^2_{n2}}/A_1^2+\cdots$ |
| Linear scaling | 2× power → ½ noise power |
| $\gamma_n$ (extension) | $S_{TH}/(4kTg_m)$; $n/2$ in WI, 0.7–1.5 in SI |
| Noise FoM (extension) | $\frac{\omega_u}{I_D\overline{V^2_{n,in}}} = \frac{\omega_T(g_m/I_D)}{4kT\gamma_n\mathrm{FO}}$ |
| Flicker excess (extension) | $E = 1+\frac{f_{co}}{\mathrm{BW}}\ln\frac{\mathrm{BW}}{f_L}$ |
| Capacitor for dynamic range | $C = kT/\overline{V_n^2}$ |
| SNDR | $10\log\frac{V_f^2}{N_o+\sum V_{h}^2}$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 7 Noise, pp. 219–267: §7.1 statistics (average power, PSD, one/two-sided, amplitude distribution, correlation, SNR, analysis procedure) pp. 219–227; §7.2 thermal noise (resistor, $kT/C$ Ex. 7.3, MOSFET channel, gate resistance Exs. 7.6–7.7, nanometer flicker note) and flicker noise (Exs. 7.8–7.9, corner) pp. 228–236; §7.3 representation (output and input-referred noise, two-port $V_n$/$I_n$, correlation, Exs. 7.10–7.13) pp. 236–243; §7.4 single-stage amplifiers (lemma, CS Exs. 7.15–7.19, CG Ex. 7.20, source follower, cascode) pp. 243–254; §7.5 current mirrors pp. 254–256; §7.6 differential pairs (Exs. 7.21–7.22, 5T OTA, tail noise) pp. 256–262; §7.7 noise-power trade-off pp. 263–264; §7.8 noise bandwidth p. 264; §7.9 input noise integration p. 265; §7.10 Appendix A noise correlation pp. 265–267.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - Ch. 9 §9.1 time-domain analysis (rms, SNR, dBm, noise summation, Ex. 9.2) pp. 363–367; §9.2 frequency-domain analysis (spectral density, white, 1/f, filtered noise, noise bandwidth, piecewise integration, 1/f tangent principle) pp. 367–377; §9.3 noise models (resistors, diodes, BJTs, MOSFETs, op amps, capacitors/inductors and $kT/C$ Ex. 9.8, sampled noise, input-referred noise Ex. 9.9, noise factor/figure, used only for the link to [[RF Noise and Distortion]]) pp. 377–387; §9.4.1 op-amp example (Ex. 9.10) pp. 387–390; §9.4.3 CMOS differential pair example pp. 392–394; §9.5 dynamic range intro and §9.5.4 SNDR pp. 397–398, 404; §9.6 key points pp. 405–406. Skipped: §9.4.2 bipolar CE example, §9.4.4 TIA example, §9.5.1–9.5.3 THD/IP3/SFDR (belong to [[Nonlinearity and Mismatch]]).
  - Ch. 19 §19.3 Jitter and Phase Noise, pp. 756–760: used only for the one-line link to [[Link Noise and Jitter]] and [[Oscillators]].
- **Zettelkasten extensions** (`AnalogTheory/S6 Noise.md`, folder `Noise/`, citing Jespers & Murmann §4.1): 6s ($\gamma_n$ vs inversion level), 6t and 6t2 (noise-bandwidth-current FoM, ~7 S/A optimum and the 1-nV/√Hz sizing example), 6u (load-device dynamic-range optimum), 6v (flicker excess factor $E$). Notes 6w–6z7 (distortion and mismatch) left for [[Nonlinearity and Mismatch]].
