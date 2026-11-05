---
title: Channels
description: The wire between TX and RX as a lossy, reflecting, coupled transmission line, measured with TDR and S-parameters and reduced to a sampled pulse response whose cursors are the ISI every equalizer fights.
kind: topic
status: growing
aliases:
  - Channels
  - SerDes Channels
---

This note treats the channel of a serial link first as a black box (a low-pass filter with a pulse response), then opens it: wires, transmission lines, the two loss mechanisms, reflections and termination, measurement (TDR and S-parameters, including mixed-mode), crosstalk, and finally the pulse response, cursors, eye diagram and worst-case eye that every later SerDes note starts from. Stop after any section and you still have a correct (just coarser) picture.

## The big picture

```tikz title="A backplane channel and what each part does to the signal. After Palermo 2011 Fig. 9.11 and ECEN720 Lecture 2, slide 4 (Meghelli, ISSCC 2006)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,minimum height=0.9cm,align=center,fill=white,font=\scriptsize},
  imp/.style={font=\scriptsize\itshape,text=red!70!black,align=center}]
  \node[blk,minimum width=1.1cm] (tx) at (0,0) {TX\\IC};
  \node[blk,minimum width=1.0cm] (p1) at (1.5,0) {pkg};
  \node[blk,minimum width=1.5cm] (t1) at (3.15,0) {line-card\\trace};
  \node[blk,minimum width=0.8cm] (v1) at (4.65,0) {via};
  \node[blk,minimum width=1.2cm] (c1) at (5.85,0) {edge\\conn.};
  \node[blk,minimum width=2.2cm,fill=gray!10] (bp) at (7.95,0) {backplane\\trace (16'')};
  \node[blk,minimum width=1.2cm] (c2) at (10.05,0) {edge\\conn.};
  \node[blk,minimum width=0.8cm] (v2) at (11.25,0) {via};
  \node[blk,minimum width=1.5cm] (t2) at (12.45,0) {line-card\\trace};
  \node[blk,minimum width=1.0cm] (p2) at (13.95,0) {pkg};
  \node[blk,minimum width=1.1cm] (rx) at (15.25,0) {RX\\IC};
  \draw[thick] (tx)--(p1)--(t1)--(v1)--(c1)--(bp)--(c2)--(v2)--(t2)--(p2)--(rx);
  \node[imp] at (1.5,1.0) {crosstalk};
  \node[imp] at (3.15,1.0) {loss\\(dispersion)};
  \node[imp] at (4.65,-1.0) {stub\\reflections};
  \node[imp] at (5.85,1.0) {crosstalk};
  \node[imp] at (7.95,1.0) {loss\\(dispersion)};
  \node[imp] at (11.25,-1.0) {stub\\reflections};
  \node[imp] at (15.25,1.0) {termination\\reflections};
  \draw[decorate,decoration={brace,amplitude=6pt,mirror}] (1.0,-1.6) -- (14.45,-1.6) node[midway,below=7pt,font=\scriptsize] {the channel: one linear, time-invariant system $H(f)\;\Leftrightarrow\;h(t)$};
\end{circuitikz}
\end{document}
```

```tikz title="What the channel does to one bit: a 1-UI pulse in, a smaller, wider pulse out. Its samples one UI apart are the cursors. Values from Palermo ECEN720 Lecture 4, slide 8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % input pulse
  \draw[->] (-0.2,0) -- (3.2,0) node[right] {$t$};
  \draw[->] (0,-0.2) -- (0,3.6);
  \draw[very thick,blue!70!black] (0,0) -- (1,0) -- (1,3.0) -- (2,3.0) -- (2,0) -- (3,0);
  \node[font=\scriptsize] at (1.5,3.3) {1 UI};
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {TX: isolated ``1''};
  \draw[->,thick] (3.6,1.5) -- (4.8,1.5) node[midway,above,font=\scriptsize] {$h(t)$};
  % output pulse
  \begin{scope}[xshift=6cm]
    \draw[->] (-0.2,0) -- (9.4,0) node[right] {$t$};
    \draw[->] (0,-0.2) -- (0,3.6) node[above,font=\scriptsize] {$y^{(1)}(t)$};
    \draw[thick,red!70!black] plot[smooth,tension=0.6] coordinates {(0,0) (0.5,0.01) (1,0.018) (1.5,0.04) (2,0.216) (2.5,1.4) (3,3.24) (3.5,2.0) (4,0.99) (4.5,0.6) (5,0.39) (5.5,0.28) (6,0.198) (6.5,0.15) (7,0.12) (7.5,0.09) (8,0.072) (8.5,0.06) (9,0.054)};
    \foreach \x/\y/\l in {1/0.018/{-2},2/0.216/{-1},3/3.24/{0},4/0.99/{1},5/0.39/{2},6/0.198/{3},7/0.12/{4},8/0.072/{5},9/0.054/{6}} {
      \draw[thick] (\x,0) -- (\x,\y);
      \fill (\x,\y) circle (1.6pt);
      \node[below,font=\tiny] at (\x,0) {\l};
    }
    \node[right,font=\scriptsize] at (3.05,3.3) {cursor $a_0=0.540$};
    \node[font=\scriptsize,align=center] at (1.4,1.2) {pre-cursor\\ISI};
    \node[font=\scriptsize,align=center] at (6.5,1.3) {post-cursor ISI\\(long tail from loss)};
    \node[font=\scriptsize] at (4.5,-0.6) {sample index $k$ (one per UI)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **The channel is an LTI low-pass filter.** Two equivalent views: insertion loss $|S_{21}(f)|$ (frequency) and impulse/pulse response $h(t)$ (time), a Fourier pair.
> 2. **Loss grows with length and frequency:** $V(x)/V(0) = e^{-(\alpha_R+\alpha_D)x}$, with skin-effect loss $\alpha_R\propto\sqrt f$ and dielectric loss $\alpha_D\propto f$.
> 3. **Any impedance change reflects:** $\Gamma = (Z_T-Z_0)/(Z_T+Z_0)$. Terminate both ends in $Z_0$; vias, stubs, connectors and packages are the discontinuities left over.
> 4. **Crosstalk:** NEXT (a strong local TX onto a weak received signal) is usually worse than FEXT.
> 5. **Data out = sum of shifted pulse responses.** The pulse response sampled once per UI gives the cursors; everything except $a_0$ is ISI. Worst-case eye height: $2\left(a_0 - \sum_{k\ne0}|a_k|\right)$.

**Map:** [[#Level 0 The Channel as a Black Box|black box]] → [[#Level 1 Loss|skin and dielectric loss]] → [[#Level 2 Discontinuities|terminations, vias, connectors, packages]] → [[#Level 3 Measuring the Channel|TDR, IL/RL, mode conversion, ILD]] → [[#Level 4 Crosstalk|NEXT/FEXT]] → [[#Level 5 Pulse Response, ISI and the Eye|pulse response, ISI, eye, worst-case eye]].

This note owns only the link-level view of the channel. Transmission-line theory is in [[Transmission Lines]], network parameters and mixed-mode S-parameters in [[Microwave Network Analysis]], skin depth in [[EM Foundations]].

## Level 0: The Channel as a Black Box

### What Is in the Channel

| Part | What it is | What it does to the signal |
|---|---|---|
| Package | Bondwires or flip-chip bumps, package traces and vias | Inductance, crosstalk, reflections |
| PCB trace | Microstrip (outer layer) or stripline (between planes) | Frequency-dependent loss (dispersion) |
| Via | Plated hole joining PCB layers; the unused part is a **stub** | Reflections, deep nulls in $|H(f)|$ |
| Connector | Board-to-board (16–32 differential pairs per 10 mm) | Impedance change, crosstalk |
| On-chip termination | The $50\ \Omega$ resistors at TX and RX | Reflections if mismatched |

Reach depends on the application: processor-to-memory runs over short (<10 in.) microstrip; servers and routers use ~30 in. backplanes or ~10 m cables, both with large discontinuities and loss (Palermo 2011). Zhang quotes up to 1 m for backplanes and 5 m for copper cables.

> [!tip] Remark
> The channel is **linear and time-invariant**, so everything from [[Discrete Signals and Systems#5. Impulse response & convolution|impulse response and convolution]] applies directly: one measured $h(t)$ predicts the output for any bit pattern.

### Two Views of the Same Channel

$$
\boxed{S_{21}(f)\;\Longleftrightarrow\;h_{21}(t)}
$$

- **Frequency domain (insertion loss):** read loss at Nyquist, nulls, bumpiness.
- **Time domain (impulse response):** read delay, attenuation, spreading, ripples (reflections).

The frequency that matters is the **Nyquist frequency** $f_N = R_s/2$ (half the symbol rate): at 56 Gb/s NRZ, $UI = 17.857$ ps and $f_N = 28$ GHz (Zhang slide 13). Example: the IBM 10 Gb/s backplane has $|S_{DD21}| = -24.6$ dB at 5 GHz (Palermo L1 slide 16).

> [!tip] Remark
> Read $|S_{21}|$ like the Bode plots of [[Frequency Response#Level 0 Transfer Functions and Bode Plots|Frequency Response]], with one difference: channel loss is not a few poles. It is $e^{-\alpha(f)l}$ with $\alpha\propto\sqrt f$ and $f$, so its dB loss is a $\sqrt f$ term plus an $f$ term times length: on a log-frequency axis it bends down ever more steeply instead of settling onto $-20$ dB/dec asymptotes. That is why channels are modelled by measured data, not by a pole list.

> [!tip] Remark
> Why $R_s/2$: the fastest NRZ pattern (1010...) is a square wave at $R_s/2$. The power spectrum of random data and the NRZ-vs-PAM4 trade are in [[Signaling and BER]].

## Level 1: Loss

The board trace is a transmission line, and its attenuation constant $\alpha$ is what the link sees as loss.

> [!tip] Remark
> Recap from [[Transmission Lines#Telegrapher's Equations]]: a line with per-length $R, L, G, C$ has $\gamma = \alpha+j\beta = \sqrt{(R+j\omega L)(G+j\omega C)}$ and $Z_0 = \sqrt{(R+j\omega L)/(G+j\omega C)}$; when $R\ll\omega L$ and $G\ll\omega C$, $Z_0\approx\sqrt{L/C}$ and $\alpha\approx R/(2Z_0)+GZ_0/2$. Low-loss attenuation: [[Transmission Lines#Low-Loss Line and Attenuation]]; dispersion and the distortionless line: [[Transmission Lines#Dispersion and the Distortionless Line]]; worked problems in [[Exam Prep - Problems through Stability]] §1.

Wire regime (Palermo L2 slide 20): a wire behaves as an LC (wave) line above $f_0 = R/(2\pi L)$. A PCB trace ($5\ \Omega$/m, 300 nH/m) crosses over at 2.7 MHz and an AWG24 pair at 32 kHz, so board and cable channels are wave-propagating at every link rate; an on-chip min-width M6 wire in 0.18 µm (40 kΩ/m) stays RC up to 1.6 GHz.

```tikz title="Attenuation vs frequency: skin-effect loss grows as sqrt(f), dielectric loss as f, so dielectric loss wins at high frequency. Shape after Palermo L2 slides 27-31 (Dally)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.3,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,4.6) node[above] {loss (dB per length)};
  \draw[thick,blue!70!black,domain=0:8,samples=60] plot (\x,{0.6*sqrt(\x)});
  \draw[thick,red!70!black,domain=0:8,samples=20] plot (\x,{0.35*\x});
  \draw[very thick,domain=0:8,samples=60] plot (\x,{0.6*sqrt(\x)+0.35*\x});
  \draw[dashed,gray] (2.94,0) -- (2.94,2.4);
  \node[font=\scriptsize,gray!40!black,align=center] at (1.3,2.4) {skin loss\\dominates};
  \node[font=\scriptsize,gray!40!black,align=center] at (5.6,0.45) {dielectric loss dominates};
  \node[blue!70!black,font=\scriptsize,anchor=west] at (8.05,1.7) {$\alpha_R\propto\sqrt f$ (skin)};
  \node[red!70!black,font=\scriptsize,anchor=west] at (8.05,2.8) {$\alpha_D\propto f$ (dielectric)};
  \node[font=\scriptsize,anchor=west] at (8.05,4.5) {total $\alpha_R+\alpha_D$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{V(x)}{V(0)} = e^{-(\alpha_R+\alpha_D)x}}
$$

Both terms grow with frequency, at different rates. That frequency-dependent loss is what turns the channel into a low-pass filter whose attenuation increases with length.

### Skin Effect (Conductor Loss)

$$
\boxed{R(f) = R_{DC}\sqrt{\frac{f}{f_s}}\ \ (f>f_s), \qquad \alpha_R = \frac{R_{DC}}{2Z_0}\sqrt{\frac{f}{f_s}}}
$$

- $f_s$ is where the skin depth $\delta = (\pi f\mu\sigma)^{-1/2}$ equals half the conductor thickness: $f_s = \rho/(\pi\mu(h/2)^2)$. Above it current crowds into a shell of depth $\delta\propto f^{-1/2}$, so $R\propto\sqrt f$.
- Examples (Dally): 5-mil stripguide $R_{DC} = 7\ \Omega/\text{m}$, $f_s = 43$ MHz; 30 AWG pair $R_{DC} = 0.08\ \Omega/\text{m}$, $f_s = 67$ kHz. Every link runs far above $f_s$, so the $\sqrt f$ law is the one that matters.
- Palermo 2011 Eq. (9.2), in trace units: $\alpha_R = \dfrac{2.61\times10^{-7}\sqrt{\rho_r}}{\pi D\,2Z_0}\sqrt f$, with $D$ the trace diameter (in.) and $\rho_r$ the resistivity relative to copper. Wider conductors lose less.

> [!tip] Remark
> Skin depth itself is derived in [[EM Foundations#Skin Depth]] and its surface-resistance form in [[EM Foundations#Surface Resistance]]. Horowitz's 12 m RG-55U cable shows it at link level: skin-effect resistance is the main loss, the dielectric a lesser one, and a single square pulse loses more than 40% of its amplitude and grows a long settling tail (Horowitz 1998, Figs. 14–15).

### Dielectric Loss

$$
\boxed{\alpha_D = \frac{GZ_0}{2} = \pi f\tan\delta_D\sqrt{LC} = \frac{\pi\sqrt{\varepsilon_r}\tan\delta_D}{c}\,f}
$$

- The **loss tangent** $\tan\delta_D = G/(\omega C)$ is the board-material number (definition in [[EM Foundations#Fields in Media Permittivity and Loss Tangent]]).
- $\alpha_D\propto f$ eventually beats $\alpha_R\propto\sqrt f$: at the tens of GHz of modern links, the board material sets the reach.

| Board material (Samtec data, Palermo L2 slide 32) | Loss at 56 GHz | Length for 25 dB |
|---|---|---|
| Megtron 6 | ≈2 dB/in | 12.5 in |
| Tachyon | ≈1.6 dB/in | 15.6 in |
| PTFE (Teflon) | ≈1.1 dB/in | 22.7 in |

Cabled interconnect reaches ~1.5 m; a cabled backplane with short daughter cards supports ~1 m at 224 Gb/s (Ghiasi, IEEE 802.3, 2017).

### What Loss Does in Time

```tikz title="Loss in the time domain: a 1-UI input pulse comes out shorter and wider, and its energy spills into the neighbouring UIs (ISI). After Palermo 2011 Fig. 9.13(a) and Horowitz Fig. 15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (11,0) node[right] {$t$};
  \draw[->] (0,0) -- (0,3.4) node[above] {$V$};
  \draw[thick,blue!70!black] (0.5,0) -- (1.5,0) -- (1.5,3) -- (2.5,3) -- (2.5,0) -- (3,0);
  \node[blue!70!black,font=\scriptsize] at (2,3.25) {TX pulse (1 UI)};
  \draw[thick,red!70!black] plot[smooth,tension=0.6] coordinates {(4.0,0) (4.6,0.1) (5.2,0.8) (5.8,1.6) (6.3,1.25) (6.9,0.7) (7.6,0.42) (8.4,0.27) (9.4,0.18)};
  \node[red!70!black,font=\scriptsize,anchor=west] at (6.3,1.75) {RX pulse};
  \foreach \x in {4.8,5.8,6.8,7.8,8.8} \draw[gray,dashed] (\x,0) -- (\x,2.2);
  \node[font=\scriptsize] at (5.3,2.4) {UI};
  \draw[<->,gray] (4.8,2.2) -- (5.8,2.2);
  \draw[<->] (3.2,0.3) -- (4.0,0.3) node[midway,above,font=\scriptsize] {delay};
  \node[font=\scriptsize,align=left,anchor=west] at (8.9,0.7) {tail: energy\\in later UIs};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> This is magnitude distortion from [[System Defintiions#4. Distortion|Distortion]]: a distortionless channel needs flat $|H|$ and linear phase. Loss breaks the first, dispersion the second. Undoing it is [[System Defintiions#10. Inversion and equalization|inversion and equalization]], which is the whole of [[Equalization]].

## Level 2: Discontinuities

Every change of impedance along the channel reflects part of the wave back, and the reflection reaches the receiver late, as ISI many UIs after the cursor.

$$
\boxed{\Gamma = \frac{V_r}{V_i} = \frac{Z_r-Z_0}{Z_r+Z_0}}
$$

> [!tip] Remark
> $\Gamma$ is [[Transmission Lines#Reflection Coefficient (Transmission Line)]]; lattice diagrams, ringing patterns and the four termination schemes (none, source, receiver, double) are [[Transmission Lines#Level 3 Transients and Bounce Diagrams]]. The link-level conclusion (Palermo L2 slides 41–42): **high-speed links terminate both ends** in $Z_0$, absorbing reflections at driver and receiver at the cost of half the swing of single termination. The termination circuits are in [[Transmitters]] and [[Receivers]]; matching networks in [[Smith Chart and Impedance Matching]].

The most common discontinuities in a link are on-chip termination mismatch and via stubs (Palermo 2011), then connectors and packages:

| Discontinuity | Looks like | Notes |
|---|---|---|
| On-chip termination | $Z_T\ne Z_0$ | Any mismatch reflects at the very end of the channel |
| Via | Lower-impedance section plus an open **stub** | Eats several routing tracks; stub resonance |
| Connector | Impedance change across the pins | Must hold the differential impedance; also the main crosstalk site |
| Package | Bondwire/trace $L$, pad $C$ | Bondwire $L\approx1$ nH/mm, $C_{couple}\approx20$ fF/mm; package trace $L\approx0.7$–$1$ nH/mm, $C_{layer}\approx80$–$90$ fF/mm, $C_{couple}\approx40$ fF/mm (Dally). Flip-chip has much lower interface impedance than wirebond |

### Vias and Stubs

```tikz title="A through-hole via used to reach an inner layer: the unused barrel below the signal layer is an open stub. Backdrilling removes it. After Palermo L2 slides 13-14 and Palermo 2011 Fig. 9.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % board layers
  \foreach \y in {0,0.8,1.6,2.4,3.2,4.0} \draw[gray] (0,\y) -- (6,\y);
  \fill[green!8] (0,0) rectangle (6,4.0);
  \foreach \y in {0.8,1.6,2.4,3.2} \draw[gray] (0,\y) -- (6,\y);
  % via barrel
  \fill[orange!70!black] (2.7,0) rectangle (3.0,4.0);
  % top trace in, inner trace out
  \fill[orange!70!black] (0.3,4.0) rectangle (2.7,4.12);
  \fill[orange!70!black] (3.0,2.36) rectangle (5.7,2.44);
  \draw[->,thick,blue!70!black] (0.6,4.45) -- (2.4,4.45) node[midway,above,font=\scriptsize] {signal in (top)};
  \draw[->,thick,blue!70!black] (3.3,2.75) -- (5.4,2.75) node[midway,above,font=\scriptsize] {out (inner layer)};
  \draw[decorate,decoration={brace,amplitude=4pt}] (3.15,2.36) -- (3.15,0) node[midway,right=4pt,font=\scriptsize,align=left] {stub: open-ended,\\resonates};
  \node[font=\scriptsize] at (1.2,-0.4) {thick backplane};
  % S21 with null
  \begin{scope}[xshift=8.3cm]
    \draw[->] (0,0) -- (5,0) node[right,font=\scriptsize] {$f$};
    \draw[->] (0,0) -- (0,4.0) node[above,font=\scriptsize] {$|S_{21}|$ (dB)};
    \draw[thick,gray] (0,3.7) .. controls (2,3.0) and (3.5,2.2) .. (4.8,1.4);
    \node[gray,font=\scriptsize,anchor=west] at (3.3,2.6) {backdrilled};
    \draw[thick,red!70!black] (0,3.7) .. controls (1.2,3.2) and (2.0,2.9) .. (2.5,2.6) -- (2.8,0.3) -- (3.1,2.2) .. controls (3.6,1.8) and (4.2,1.2) .. (4.8,0.9);
    \node[red!70!black,font=\scriptsize,anchor=east] at (2.7,0.5) {stub null};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Vias are expensive in signal density (each eats several trace tracks) and integrity: usually lower impedance than the trace, and they leave **stubs**.
- Legacy backplanes with straight-through vias show **severe nulls** in $|S_{21}|$; refined backplanes pay for **backdrilled** vias (Palermo L2 slide 14). In Palermo 2011 Fig. 9.12 the 17 in. legacy backplane shows nulls below −60 dB within the first few GHz, while the backdrilled (refined) one rolls off smoothly.

> [!note]- Why: an open stub notches at a quarter wavelength
> An open stub of length $l_{stub}$ looks like a short to the through path when $l_{stub} = \lambda/4$, so the transmitted signal has a notch at $f = v/(4l_{stub})$ (and odd multiples). A longer stub (thick backplane, signal on a top layer) puts the notch lower, inside the data band; backdrilling shortens the stub and pushes it out. The open-stub input impedance is in [[Transmission Lines#Transmission Line Input Impedance]]. Palermo's sources show the nulls but do not give this formula.

## Level 3: Measuring the Channel

Models come from EM field solvers or from measurement. The two instruments are the **time-domain reflectometer** (TDR) and the **network analyzer** (frequency domain).

### Time-Domain Reflectometry

```tikz title="TDR waveforms at the source (50 ohm line, matched source, 1 V step so V_i = 0.5 V): every discontinuity appears 2 t_d after it is launched, up for higher impedance, down for lower. After Palermo L3 slides 8-10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\oy/\name in {0/0/{open},4.6/0/{short},9.2/0/{matched},0/-3.3/{$Z_T>Z_0$ / $Z_T<Z_0$},4.6/-3.3/{shunt $C$},9.2/-3.3/{series $L$}} {
    \begin{scope}[xshift=\ox cm,yshift=\oy cm]
      \draw[->] (0,0) -- (3.8,0) node[right,font=\tiny] {$t$};
      \draw[->] (0,0) -- (0,2.4);
      \draw[dotted] (0,1) -- (3.6,1);
      \node[left,font=\tiny] at (0,1) {0.5};
      \node[left,font=\tiny] at (0,2) {1};
      \node[font=\scriptsize] at (1.9,2.6) {\name};
      \draw[dotted] (1,0) -- (1,2.2); \draw[dotted] (2.6,0) -- (2.6,2.2);
    \end{scope}
  }
  \node[font=\tiny] at (1.8,-0.25) {$2t_d$};
  \draw[thick] (0,0) -- (1,0) -- (1,1) -- (2.6,1) -- (2.6,2) -- (3.6,2);
  \draw[thick] (4.6,0) -- (5.6,0) -- (5.6,1) -- (7.2,1) -- (7.2,0) -- (8.2,0);
  \draw[thick] (9.2,0) -- (10.2,0) -- (10.2,1) -- (12.8,1);
  \draw[thick] (0,-3.3) -- (1,-3.3) -- (1,-2.3) -- (2.6,-2.3) -- (2.6,-1.7) -- (3.6,-1.7);
  \draw[thick,dashed] (2.6,-2.3) -- (2.6,-2.8) -- (3.6,-2.8);
  \draw[thick] (4.6,-3.3) -- (5.6,-3.3) -- (5.6,-2.3) -- (7.2,-2.3) -- (7.25,-2.95) .. controls (7.4,-2.5) .. (7.7,-2.3) -- (8.2,-2.3);
  \draw[thick] (9.2,-3.3) -- (10.2,-3.3) -- (10.2,-2.3) -- (11.8,-2.3) -- (11.85,-1.55) .. controls (12.0,-2.1) .. (12.3,-2.3) -- (12.8,-2.3);
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_T(t) = Z_0\frac{1+\Gamma(t)}{1-\Gamma(t)} = Z_0\frac{V(t)}{2V_i - V(t)}, \qquad x = \frac{v\,t}{2}}
$$

- A TDR is a fast step generator plus a fast oscilloscope at the same port. Voltage gives impedance; delay gives location (round trip, hence the $/2$). It needs access to one port only.
- **Resolution is set by the step rise time.** The edge itself slows as it travels (skin-effect dispersion, lumped discontinuities low-pass filtering it), which smears later features and makes $L$ and $C$ values hard to extract.
- Multiple discontinuities produce multiple reflections (paths like A→B→A) that also show up on the trace.
- **TDT** (time-domain transmission) measures the output port instead and gives $H(j\omega) = V_2/V_1$, but discontinuities pile up on one rising edge and are hard to separate.

> [!note]- Detail: TDR with a 1 V step
> With a matched source and $V_{STEP} = 1$ V, $V_i = 0.5$ V and $Z_T(t) = Z_0\,V(t)/(1\text{ V} - V(t))$. Open: $V\to1$ V, $Z\to\infty$. Short: $V\to0$. A higher-impedance section reads above 0.5 V, a lower one below.

### Reading Lumped Discontinuities on a TDR

Pads, vias and connectors look like a shunt $C$; bondwires and narrow necks look like a series $L$. Seen by a step of rise time $t_r$:

$$
\boxed{\tau_C = \frac{Z_0C}{2}, \qquad \tau_L = \frac{L}{2Z_0}, \qquad \frac{\Delta V}{V} = \frac{\tau}{t_r}\left[1-e^{-t_r/\tau}\right]}
$$

- Shunt C → a negative dip in the reflected wave; series L → a positive spike. Both shrink if $t_r\gg\tau$: a lumped discontinuity only hurts when the edge is fast compared to its time constant.
- Palermo L3 slide 10 example: $Z_0 = 50\ \Omega$, $C = 1$ pF, $L = 1$ nH, $t_r = 10$ ps.

> [!note]- Why: where $\tau_C$ and $\tau_L$ come from
> The capacitor sits between two $Z_0$ lines, so it sees $Z_0\parallel Z_0 = Z_0/2$: $\tau_C = (Z_0/2)C$. The inductor sits in series between two $Z_0$ lines and sees $Z_0+Z_0 = 2Z_0$: $\tau_L = L/(2Z_0)$. The peak formula is the response of a single-pole high-pass reflection to a ramp of duration $t_r$: it approaches 1 when $t_r\ll\tau$ and $\tau/t_r$ when $t_r\gg\tau$.

### Channel Specs in S-Parameters

$$
\boxed{IL = -20\log_{10}|S_{DD21}|, \qquad RL = -20\log_{10}|S_{DD11}|}
$$

- A link channel is specified by its **differential insertion loss** $S_{DD21}$ (the through path, usually quoted at Nyquist) and **return loss** $S_{DD11}$ (reflections back toward the TX). The network analyzer measures them with every port terminated in $Z_0$, which is why S-parameters (not Z or Y) are used at these frequencies.
- Channel models are delivered as 4-port Touchstone data (Palermo's example: 50 MHz to 15 GHz in 10 MHz steps). With Hall's numbering (ports 1, 3 the input pair, 2, 4 the output pair): $S_{DD21} = \tfrac12(S_{21}+S_{43}-S_{23}-S_{41})$.

> [!tip] Remark
> Definitions: [[Microwave Network Analysis#S-Parameters]]; ABCD conversion and cascading: [[Microwave Network Analysis#Two-Port Parameter Conversions]]; the full mixed-mode set ($S_{DD}$, $S_{DC}$, $S_{CD}$, $S_{CC}$): [[Microwave Network Analysis#Level 4 Mixed-Mode S-Parameters]]; VNA and calibration: [[Microwave Network Analysis#Level 5 Measurement VNA, Calibration, De-embedding]]. Worked Pozar problems: [[Exam Prep - Problems through Stability]] §4.

**Differential signaling** is the norm: self-referenced, rejects common-mode noise, twice the swing, less self-induced supply noise. It needs twice the signal pins but fewer supply/return pins per signal, so the total pin overhead is 1.3–1.8× rather than 2× (Palermo L2 slide 43). Coupled-pair impedances ($Z_{odd}$, $Z_{even}$, $Z_{DIFF} = 2Z_{odd}$) and the Π/T networks that terminate both modes are in [[Transmission Lines#Coupled Lines and Differential Pairs]].

**Mode conversion** ($S_{DC21}$, $S_{CD21}$): any P/N imbalance (intra-pair skew from routing length, connector fan-out, fiber weave) converts differential signal to common mode and back. Zhang's example: 15 ps of skew raises $S_{DC21}$ by more than 30 dB, and leaving it out of the simulation makes the predicted BER optimistic ($1.3\times10^{-9}$ instead of $5.4\times10^{-8}$) (slides 40–41).

### Insertion Loss Deviation

$$
\boxed{ILD = IL - \text{fitted attenuation}}
$$

ILD measures how **smooth** the channel is: the fitted curve is the smooth loss, and the ripple left over around it comes from impedance mismatches. In some links these reflections hurt more than the insertion loss itself (Zhang slide 20).

## Level 4: Crosstalk

```tikz title="Near-end (NEXT) and far-end (FEXT) crosstalk from one aggressor. NEXT lands on a receiver on the aggressor's own chip, where the victim signal is already weak; FEXT travels with the aggressor to the far chip. After Palermo 2011 Sec. 9.2.2 and L1 slide 12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \y/\l/\r in {4.0/{TX$_W$}/{RX$_W$},2.0/{TX$_A$}/{RX$_A$},0/{RX$_V$}/{TX$_V$}} {
    \draw[thick] (0,\y) rectangle (1.2,\y+0.8); \node[font=\scriptsize] at (0.6,\y+0.4) {\l};
    \draw[thick] (8.8,\y) rectangle (10,\y+0.8); \node[font=\scriptsize] at (9.4,\y+0.4) {\r};
  }
  \draw[thick,gray,->] (1.2,4.4) -- (8.8,4.4) node[midway,above,font=\scriptsize] {victim $W$ (same direction as aggressor)};
  \draw[very thick,blue!70!black,->] (1.2,2.4) -- (8.8,2.4) node[pos=0.38,above,font=\scriptsize] {aggressor, $\sim$1 V$_{pp}$ at TX};
  \draw[thick,gray,<-] (1.2,0.4) -- (8.8,0.4) node[midway,below,font=\scriptsize] {victim $V$ from far chip, $\sim$20 mV$_{pp}$ after loss};
  \draw[->,red!70!black,thick] (3,2.25) .. controls (2.4,1.4) .. (1.4,0.6);
  \node[red!70!black,font=\scriptsize,anchor=west] at (2.9,1.3) {NEXT};
  \draw[->,red!70!black,thick,dashed] (6.5,2.55) .. controls (7.6,3.4) .. (8.6,4.2);
  \node[red!70!black,font=\scriptsize,anchor=east] at (7.0,3.3) {FEXT};
  \node[font=\scriptsize] at (0.6,-0.4) {chip 1};
  \node[font=\scriptsize] at (9.4,-0.4) {chip 2};
\end{circuitikz}
\end{document}
```

- Crosstalk is capacitive plus inductive coupling between neighbours. It is worst where spacing is small compared to the distance to a shield: **connectors and packages**.
- **NEXT:** aggressor TX energy couples back to a victim RX on the **same** chip. **FEXT:** aggressor energy travels along with the victim to the **other** chip.
- **NEXT is usually the worst**: a ~1 V$_{pp}$ transmitter next to a received signal attenuated to ~20 mV$_{pp}$. In common backplanes crosstalk energy can exceed the through-channel signal near 4 GHz (Palermo 2011).

Metrics, roughly in the order they appeared as data rates rose (Zhang slide 21):

| Metric | Meaning |
|---|---|
| PSXT (PSNEXT, PSFEXT) | Power sum of all crosstalk aggressors |
| ICR | Insertion loss to crosstalk ratio, $IL - PSXT$ |
| ICN | Integrated crosstalk noise |
| COM | Channel operating margin (whole-link figure of merit, in [[Signaling and BER]]) |

> [!tip] Remark
> Crosstalk is bounded, data-dependent noise: margin depends on its **peak-to-peak**, not its rms. With more than 3 aggressors it approaches a bounded Gaussian with peak-to-peak/rms up to 11 (Zhang slide 39, empirical). How it enters the noise budget is in [[Link Noise and Jitter]].

> [!note]- Detail: how NEXT and FEXT scale on a coupled line
> > [!warning] Unverified
> > The following standard coupled-line results (Dally & Poulton Ch. 6; Hall & Heck) are not in the assigned Palermo/Zhang/Horowitz sources.
>
> - **NEXT** is a backward wave. Each piece of coupled length sends some aggressor energy back, so NEXT lasts one round trip ($2t_d$) of the coupled section and its amplitude **saturates** once the coupled length exceeds about half the rise time's spatial extent. Longer coupling makes it last longer, not grow.
> - **FEXT** is a forward wave travelling with the aggressor edge. It grows with coupled length and with edge rate ($\propto l\,dV/dt$). Its two causes, inductive and capacitive coupling, have opposite signs; in a homogeneous dielectric (stripline) they cancel and FEXT is ideally zero, while in microstrip (part air, part dielectric) they do not.

## Level 5: Pulse Response, ISI and the Eye

### From S-Parameters to an Impulse Response

$$
\boxed{h(t) = \mathcal F^{-1}\{S_{21}(f)\}, \qquad y(t) = h(t) * x(t)}
$$

- Before the inverse FFT, build the negative frequencies as the conjugate, $S(-f) = S^*(f)$, so $h(t)$ comes out real.
- Time resolution is $1/(2f_{max})$: a 15 GHz measurement gives 33.3 ps. To get 1 ps, **zero-pad** to ±500 GHz. Check by FFT-ing $h(t)$ back and comparing with the measured data (Palermo L3 slides 28–30).

> [!tip] Remark
> This is the DTFT/DFT machinery of [[Discrete-Time Fourier Transform]]: a measurement over $\pm f_{max}$ samples $h(t)$ at $1/(2f_{max})$, and zero-padding in frequency only interpolates in time; it adds no information above $f_{max}$.

### NRZ Data as a Sum of Pulses

$$
\boxed{y^{(1)}(t) = c^{(1)}(t) * h(t), \qquad V_o(t) = \sum_{k} y^{(d_k)}(t - kT), \qquad y^{(0)}(t) = -y^{(1)}(t)}
$$

- An NRZ stream is a superposition of isolated 1-UI pulses $c_k^{(1)}(t) = u(t-kT) - u(t-(k+1)T)$, with a "0" as the negative pulse.
- By linearity the channel output is the same superposition of **pulse responses**. One pulse response therefore describes the channel for any data.

```tikz title="Channel output for data 1 0 1 1 (bipolar): each bit launches a shifted, signed copy of the pulse response, and the received waveform is their sum. After Palermo L4 slide 9 (Song)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  declare function={p(\t)=1.6*(max(\t,0)/1.1)^2*exp(2*(1-max(\t,0)/1.1));}]
  \draw[->] (0,0) -- (10.6,0) node[right] {$t$};
  \draw[->] (0,-2.2) -- (0,2.6);
  \foreach \k/\s/\c in {0/1/blue,1/-1/red,2/1/green!50!black,3/1/orange} {
    \draw[thin,\c,domain=0:10,samples=80] plot (\x,{\s*p(\x-\k*1.6)});
  }
  \draw[very thick,domain=0:10,samples=120] plot (\x,{p(\x)-p(\x-1.6)+p(\x-3.2)+p(\x-4.8)});
  \foreach \k/\b in {0/1,1/0,2/1,3/1} \node[font=\scriptsize] at ({\k*1.6+1.1},-2.5) {bit \b};
  \node[font=\scriptsize,anchor=west] at (7.2,2.2) {thick: sum $=V_o(t)$};
\end{circuitikz}
\end{document}
```

### Cursors and the Channel as an FIR Filter

$$
\boxed{a_k = y^{(1)}(t_0 + kT), \qquad V_o(t_0 + nT) = \sum_k d_{n-k}\,a_k}
$$

- Sample the pulse response once per UI, aligned to its peak at $t_0$ (the delay $D$ through the channel). $a_0$ is the **main cursor**; $a_{-1}, a_{-2},\dots$ are **pre-cursors**; $a_1, a_2,\dots$ are **post-cursors**.
- Palermo's example (L4 slide 8): $[\dots, 0.003, 0.036, \mathbf{0.540}, 0.165, 0.065, 0.033, 0.020, 0.012, 0.009, \dots]$ for $k = -2,\dots,6$.
- So, sampled at the data rate, the channel is an **FIR filter** with taps $a_k$. Everything except $a_0$ is **ISI**.
- Causes of ISI: loss/dispersion (smooth post-cursor tail), reflections (bumps many UIs later), channel resonances.

> [!tip] Remark
> The cursors are the targets of every equalizer: a TX FFE and RX FFE cancel pre- and post-cursors, a DFE subtracts post-cursors $a_1, a_2,\dots$ using past decisions. See [[Equalization]]. The same cursors set the Mueller–Müller CDR lock point in [[Clocking and CDR]].

### Eye Diagrams

An eye diagram overlays the received waveform in windows one or two UI wide, triggered on the data clock. Its vertical opening is the voltage margin at the sampling instant; its horizontal opening is the timing margin.

- At the channel input (TX output) the eye is wide open. After a lossy channel ISI closes it (Palermo L3 slides 33–37, Meghelli's 10 Gb/s backplane).
- Raising the data rate on the same channel closes the eye: the same $h(t)$ now spreads over more UIs.
- Eye mask, statistical eyes and BER contours belong to [[Signaling and BER]] and [[Link Noise and Jitter]].

### Peak-Distortion Analysis: the Worst-Case Eye

$$
\boxed{s_1 = a_0 - \sum_{k\ne0}|a_k|, \qquad s_0 = -s_1, \qquad \text{worst-case eye height} = s_1 - s_0 = 2\Big(a_0 - \sum_{k\ne0}|a_k|\Big)}
$$

$$
\boxed{\text{worst-case pattern: } d_{-k} = -\operatorname{sign}(a_k)\ \text{for } k\ne0, \quad d_0 = 1}
$$

- The worst "1" is a "1" whose every neighbour was chosen to push it down: each $k\ne0$ contributes $-|a_k|$. The worst "0" is the mirror image.
- To find the pattern, flip the cursor list about $a_0$ and invert the sign of each ISI term.
- If the eye height is negative, some bit pattern will fail even with zero noise.

| Example (Palermo L4) | $a_0$ | $\sum$ negative ISI | $\sum$ positive ISI | Worst-case eye |
|---|---|---|---|---|
| Refined backplane, 5 Gb/s | 0.540 | −0.007 | 0.389 | $2(0.540-0.007-0.389) = 0.288$ V (open) |
| Legacy backplane, 5 Gb/s | 0.426 | −0.053 | 0.542 | $2(0.426-0.053-0.542) = -0.338$ V (closed) |

Peak distortion is a strict bound: only one specific pattern reaches it, so a short random-data simulation (Palermo's 10 kbit eyes, L4 slides 15–16) looks more open than the worst-case eye. At the very low BERs links target, the bound is what counts. Small, late terms all add into $\sum|a_k|$: the refined backplane's pulse response still has a reflection ripple about 35–45 UI after the cursor (L4 slide 14).

> [!note]- Derivation: worst-case eye from the pulse response
> With bipolar data $d_k\in\{\pm1\}$ and $y^{(0)} = -y^{(1)}$, the sample for bit 0 is $d_0a_0 + \sum_{k\ne0}d_{-k}a_k$. For $d_0 = 1$, the minimum over all other bits picks $d_{-k} = -\operatorname{sign}(a_k)$, giving $s_1 = a_0 - \sum_{k\ne0}|a_k|$. In Palermo's notation this is $y_0 + \sum_{y<0}y_k - \sum_{y>0}y_k$ where the sums run over the negative-valued and positive-valued ISI samples. By symmetry $s_0 = -s_1$, so $s = 2s_1$. If the "1" and "0" pulse responses are not mirror images (nonlinear driver), compute $s_1$ and $s_0$ from each separately.

> [!tip] Remark
> PAM4 has three eyes stacked in the same swing, so the same reflection or crosstalk is about 3× worse relative to each eye (Zhang slides 38–39). Intra-pair skew also hurts PAM4 more than NRZ at the same baud rate (slide 40). The level arithmetic is in [[Signaling and BER]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Shorter channel | Less loss and ISI at every frequency | System architecture (pin and board placement) |
| Lower-loss dielectric (FR-4 → Megtron 6 → Tachyon → PTFE) | $\alpha_D$, reach (12.5 → 22.7 in for 25 dB at 56 GHz) | Board cost |
| Cables / cabled backplane instead of PCB | Reach (~1–1.5 m at high rates) | Mechanical complexity, connectors |
| Wider / thicker traces | $\alpha_R$ (more skin area) | Routing density, impedance targets |
| Stripline instead of microstrip | Crosstalk isolation (shielded) | More layers, vias to reach it |
| Backdrilled vias | Removes stub nulls | Fabrication cost |
| Double termination | Reflections absorbed at both ends | Half the swing of single termination |
| Flip-chip package vs wirebond | Lower interface impedance and inductance | Package cost |
| Differential signaling | CM noise rejection, 2× swing, self-reference | 1.3–1.8× pins; skew converts modes |
| More pair spacing / shielding in connectors and packages | NEXT, FEXT | Density |
| Lower symbol rate (e.g. PAM4) | Lower Nyquist frequency, less loss | Reflections and crosstalk ≈3× worse per eye |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Two views | $S_{21}(f)\Leftrightarrow h_{21}(t)$, Nyquist $f_N = R_s/2$ |
| Attenuation along line | $V(x)/V(0) = e^{-(\alpha_R+\alpha_D)x}$ |
| Skin loss | $R = R_{DC}\sqrt{f/f_s}$, $\alpha_R = \frac{R_{DC}}{2Z_0}\sqrt{f/f_s}$ |
| Dielectric loss | $\alpha_D = GZ_0/2 = \pi f\tan\delta_D\sqrt{LC} = \pi\sqrt{\varepsilon_r}\tan\delta_D f/c$ |
| Reflection | $\Gamma = (Z_r-Z_0)/(Z_r+Z_0)$ |
| TDR | $Z_T(t) = Z_0 V(t)/(2V_i - V(t))$, $x = vt/2$ |
| Lumped discontinuity | $\tau_C = Z_0C/2$, $\tau_L = L/(2Z_0)$, $\Delta V/V = (\tau/t_r)(1-e^{-t_r/\tau})$ |
| Channel spec | $IL = -20\log|S_{DD21}|$, $RL = -20\log|S_{DD11}|$ |
| ILD | $ILD = IL - $ fitted attenuation |
| Crosstalk ratio | $ICR = IL - PSXT$ |
| Impulse response | $h(t) = \mathcal F^{-1}\{S_{21}\}$, resolution $1/(2f_{max})$ |
| Pulse response | $y^{(1)} = c^{(1)}*h$, $V_o(t) = \sum_k y^{(d_k)}(t-kT)$ |
| Cursors | $a_k = y^{(1)}(t_0+kT)$, $V_o(t_0+nT) = \sum_k d_{n-k}a_k$ |
| Worst-case eye | $2\left(a_0 - \sum_{k\ne0}|a_k|\right)$; pattern $d_{-k} = -\operatorname{sign}(a_k)$ |

## References

- **Palermo, ECEN720 *High-Speed Links*, Spring 2025** (`ref/SerDes/`)
  - Lecture 1 (Introduction): slides 11–14 (link system, backplane channel impairments, NEXT/FEXT, channel performance), 16 (Meghelli $|S_{DD21}|$ −24.6 dB at 5 GHz).
  - Lecture 2 (Channel Components, Wires, Transmission Lines): slides 4–15 (packages, PCB stackup, connectors, vias, via stubs), 20 (wire-model regimes), 26–33 (low-loss $\alpha_R$, $\alpha_D$, skin effect, dielectric loss, total loss, board dielectrics, cabled backplane), 34 and 41–42 (reflection coefficient, termination schemes; recap only), 43 (differential signaling). Slides 17–19, 21–25, 35–40 and 44–47 (wire R/L/C, RLGC derivation, termination examples, lattice diagrams, odd/even modes, Π/T termination) are left to [[Transmission Lines]].
  - Lecture 3 (TDR and S-Parameters): slides 5–13 (TDR, impedance, discontinuities, resolution, multiple reflections, TDT), 14 and 17 (network analyzer, why S-parameters), 24–26 (4-port differential channel, $S_{DD21}$), 27–37 (impulse response from S-parameters, eye diagrams, ISI). Slides 15–23 (directional couplers, ABCD conversion and cascading) are left to [[Microwave Network Analysis]].
  - Lecture 4 (Channel Pulse Model): slides 4–16 (ISI, NRZ data model, pulse response, cursors, FIR model, peak-distortion analysis, worst-case pattern, two examples). The NRZ-vs-PAM4 half (slides 17–28) is left to [[Signaling and BER]].
- **Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems," 2011**, §9.2.2 Electrical Channels, pp. 296–299 (PDF pp. 13–16): Fig. 9.11 backplane cross-section, Eqs. (9.1)–(9.4), Fig. 9.12 channel responses, Fig. 9.13 pulse response and eye, NEXT/FEXT.
- **Zhang, "PAM4 Signaling for 56G Serial Link Applications," DesignCon 2016 tutorial**: slides 12–14 (link, Nyquist, time–frequency views; the terminated-$H(s)$ formula on slide 14 is left to [[Microwave Network Analysis]]), 15 and 19 (ISI), 20 (reflections, ILD), 21 (crosstalk metrics), 38–41 (reflection, crosstalk, skew and mode-conversion impact on PAM4). Slides 16–18 (equalizers) are left to [[Equalization]].
- **Horowitz, Yang, Sidiropoulos, "High-Speed Electrical Signaling: Overview and Limitations," IEEE Micro 1998**: "Channel limitations" and "Cable characteristics", PDF p. 9, Figs. 14–15 (RG-55U cable, skin effect, pulse response).
- **Vault:** [[Transmission Lines]], [[Microwave Network Analysis]], [[EM Foundations]] (owners of the linked theory); [[Exam Prep - Problems through Stability]] §1, §4; [[Discrete Signals and Systems]] §5; [[System Defintiions]] §4, §10; [[Discrete-Time Fourier Transform]].
