---
title: Nonlinearity and Mismatch
description: The two accuracy limits left after gain, speed and noise are met. A gain that changes with signal level (harmonics, IM3, IIP3) and two "identical" devices that are not (offset, Pelgrom's law). Then how to linearize and how to cancel offset.
kind: topic
status: growing
aliases:
  - Nonlinearity and Mismatch
  - Nonlinearity
  - Mismatch
  - Offset
---

This note covers the two errors that remain after a circuit has its gain, bandwidth, noise and stability: the transfer curve is not straight, and two transistors drawn the same are not the same. Both are handled the same way. Expand around the ideal case (a Taylor series in the signal, or a first-order differential in the device parameters) and ask what the first neglected term does. The note starts with the black-box metrics and opens one level per section, ending with the device-level statistics of mismatch.

## The big picture

```tikz title="Both errors in one output spectrum. A nonlinear amplifier with a pure sine in gives harmonics (nonlinearity); a mismatched one gives a dc term with the input shorted (offset). A differential circuit cancels the even harmonics, and mismatch brings them back. After Razavi Figs. 14.1, 14.24, 14.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % left: transfer curve
  \draw[->] (-2.4,0) -- (2.6,0) node[right] {$x$};
  \draw[->] (0,-2.2) -- (0,2.5) node[above] {$y$};
  \draw[dashed] (-1.75,-2.19) -- (1.75,2.19) node[above,font=\scriptsize] {ideal $\alpha_1x$};
  \draw[thick,domain=-2:2,samples=60] plot (\x,{1.25*\x-0.09*\x*\x*\x});
  \node[font=\scriptsize,anchor=west] at (0.9,0.55) {actual};
  \node[font=\scriptsize,align=center] at (0,-2.75) {slope = small-signal gain,\\ and it moves with $x$};
  % right: spectrum
  \begin{scope}[xshift=4.2cm,yshift=-2cm]
    \draw[->] (0,0) -- (6.4,0) node[right] {$f$};
    \draw[->] (0,0) -- (0,4.4) node[above] {$|Y|$};
    \draw[line width=3pt,gray!60] (0.25,0) -- (0.25,1.1);
    \node[font=\scriptsize,align=center] at (0.55,1.6) {dc:\\ offset};
    \draw[line width=3pt] (1.5,0) -- (1.5,4);
    \node[below,font=\scriptsize] at (1.5,0) {$f_0$};
    \draw[line width=3pt,gray!60] (3,0) -- (3,1.4);
    \node[below,font=\scriptsize] at (3,0) {$2f_0$};
    \draw[line width=3pt] (4.5,0) -- (4.5,0.9);
    \node[below,font=\scriptsize] at (4.5,0) {$3f_0$};
    \node[font=\scriptsize,align=center] at (3,2.2) {HD2: $\to0$ if\\ differential};
    \node[font=\scriptsize,align=center] at (4.9,1.6) {HD3: what\\ is left};
    \node[font=\scriptsize,anchor=west] at (2.1,3.9) {grey = needs asymmetry};
    \node[font=\scriptsize,anchor=west] at (2.1,3.45) {(single-ended or mismatch)};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Nonlinearity is a gain that depends on level.** Write $y=\alpha_1x+\alpha_2x^2+\alpha_3x^3$. The $n$th harmonic grows as $A^n$, so $HD_2\propto A$, $HD_3\propto A^2$, and IM3 rises 3 dB per dB of input.
> 2. **Differential circuits are odd** ($f(-x)=-f(x)$): no even harmonics. A pair has $HD_3 = V_m^2/[32V_{OV}^2]$, against $HD_2 = V_m/(4V_{OV})$ for a CS stage of the same gain.
> 3. **Negative feedback** cuts the relative harmonic by $(1+T)^2$ at a fixed input (and the gain by $1+T$). Gain error bounds nonlinearity.
> 4. **Pelgrom:** $\sigma(\Delta V_{TH}) = A_{VT}/\sqrt{WL}$. Matching costs area, and area costs capacitance.
> 5. **One mismatch, two ports.** Input offset $V_{OS}\approx\frac{V_{OV}}{2}\frac{\Delta\beta}{\beta}-\Delta V_{TH}$ wants *small* $V_{OV}$ (high $g_m/I_D$); current error $\frac{\Delta I}{I}\approx\frac{\Delta\beta}{\beta}-\frac{g_m}{I_D}\Delta V_{TH}$ wants *large* $V_{OV}$.
> 6. **If matching can't reach the spec, cancel the offset**: measure it with the input shorted, store it on capacitors, subtract. The same trick (CDS) removes $1/f$ noise below about $1/\Delta t$.

**Map:** [[#Level 0 Measuring Nonlinearity|metrics: deviation, HD, THD, P1dB, IM, IP2/IP3]] → [[#Level 1 Where the Harmonics Come From|CS vs pair, feedback, capacitors, switches]] → [[#Level 2 Linearization Techniques|linearizing a transconductor]] → [[#Level 3 Mismatch and Offset|Pelgrom, offset, current mismatch]] → [[#Level 4 Offset Cancellation|offset storage, CDS]] → [[#Level 5 Mismatch Beyond the Square Law|$g_m/I_D$ view, drift, why $V_{TH}$ is the wrong parameter]].

## Level 0: Measuring Nonlinearity

### The Polynomial Model

$$
\boxed{y(t) = \alpha_1x(t)+\alpha_2x^2(t)+\alpha_3x^3(t)+\cdots}
$$

$\alpha_1$ is the small-signal gain at $x\approx0$. The rest are the corrections that make the slope move. Carusone writes the same series with $a_1,a_2,a_3$.

> [!note]- Detail: what the model assumes
> The polynomial is *memoryless*: the output depends only on the present input. Real circuits have capacitors, so strictly a Volterra series is needed, and distortion usually gets worse at high frequency (nonlinear capacitances, less loop gain). The memoryless model is still the standard first estimate (Carusone §9.5.1, footnote 9).

### Maximum Deviation from the End-Point Line

```tikz title="Static nonlinearity: pass a line through the end points of the actual curve and take the largest gap, normalized to full-scale output. After Razavi Fig. 14.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6,0) node[right] {$V_{in}$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$V_{out}$};
  \draw[thick,domain=0:5,samples=50] plot (\x,{0.95*\x-0.06*\x*\x+0.0*\x});
  \draw[dashed] (0,0) -- (5,{0.95*5-0.06*25});
  \draw[dotted] (5,0) -- (5,{0.95*5-0.06*25}) -- (0,{0.95*5-0.06*25});
  \node[below] at (5,0) {$V_{in,max}$};
  \node[left] at (0,{0.95*5-0.06*25}) {$V_{out,max}$};
  \draw[<->] (2.5,{0.65*2.5}) -- (2.5,{0.95*2.5-0.06*6.25});
  \node[above left,font=\scriptsize] at (2.45,2.05) {$\Delta V$};
  \node[font=\scriptsize,anchor=west] at (3.0,1.2) {end-point line};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{nonlinearity} = \frac{\Delta V}{V_{out,max}}}\qquad\boxed{y=\alpha_1x+\alpha_3x^3,\ |x|\le x_{max}:\quad \frac{\Delta y}{y_{max}} \approx \frac{\alpha_3}{3\sqrt3\,\alpha_1}\,x_{max}^2}
$$

"1% nonlinearity over a 1 V input range" means $\Delta V/V_{out,max}=0.01$. For an odd (differential) curve the error grows with the **square** of the input range.

> [!note]- Derivation: the cubic case (Razavi Ex. 14.1)
> The end-point line is $y_1 = (\alpha_1+\alpha_3x_{max}^2)\,x$. The gap is $\Delta y = \alpha_3x^3 - \alpha_3x_{max}^2x$, extreme at $x=x_{max}/\sqrt3$, where $|\Delta y| = 2\alpha_3x_{max}^3/(3\sqrt3)$. The peak-to-peak output is $2(\alpha_1x_{max}+\alpha_3x_{max}^3)$, so
> $$\frac{\Delta y}{y_{max}} = \frac{2\alpha_3x_{max}^3}{3\sqrt3\cdot2(\alpha_1x_{max}+\alpha_3x_{max}^3)}\approx\frac{\alpha_3}{3\sqrt3\,\alpha_1}x_{max}^2.$$

### Harmonic Distortion and THD

Drive with $x = A\cos\omega t$:

$$
y = \alpha_1A\cos\omega t+\frac{\alpha_2A^2}{2}\left[1+\cos2\omega t\right]+\frac{\alpha_3A^3}{4}\left[3\cos\omega t+\cos3\omega t\right]
$$

$$
\boxed{HD_2 = \frac{\alpha_2}{2\alpha_1}A,\qquad HD_3 = \frac{\alpha_3}{4\alpha_1}A^2}\qquad\boxed{THD = \frac{\sum_{k\ge2}(\text{power at }kf_0)}{\text{power at }f_0}}
$$

- Even terms make even harmonics (and a dc shift), odd terms make odd harmonics. The $n$th harmonic grows as $A^n$: **halving the swing halves $HD_2$ and quarters $HD_3$.**
- The $\alpha_3$ term also changes the fundamental, to $(\alpha_1+\tfrac34\alpha_3A^2)A$. If $\alpha_3<0$ (a compressive curve, the usual case) the gain drops at large $A$: compression.
- In dB: $THD = 10\log\frac{H_{D2}^2+H_{D3}^2+\cdots}{H_{D1}^2}$. 0.1% = $-60$ dB. Typical targets: CD audio ≈ 0.01% ($-80$ dB), video ≈ 0.1% ($-60$ dB) (Razavi).
- THD must be quoted with its signal amplitude; it is meaningless alone.

> [!note]- Detail: THD formula and a worked number
> For a third-order polynomial (Razavi Eq. 14.10):
> $$THD = \frac{(\alpha_2A^2/2)^2+(\alpha_3A^3/4)^2}{(\alpha_1A+3\alpha_3A^3/4)^2}$$
> Carusone Ex. 9.12: fundamental $-10$ dBm (100 µW), harmonics $-53$, $-50$, $-56$ dBm (5, 10, 2.5 nW). $THD = 10\log(17.5\text{ nW}/100\ \mu\text{W}) = -37.6$ dB.

> [!warning] Why THD is not enough
> In a filter or any band-limited circuit, the harmonics of a high input tone fall in the stopband and get filtered away, so THD looks *better* exactly where linearity is worst (near the band edge). Use a two-tone (intermodulation) test there (Carusone §9.5.1).

### Intermodulation and IP3

```tikz title="Two-tone test: the third-order products at 2f1−f2 and 2f2−f1 land right next to the tones, inside the band, where no filter removes them. After Carusone Eq. (9.136)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (10,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$|Y|$};
  \draw[line width=3pt] (2.4,0) -- (2.4,3);
  \draw[line width=3pt] (3.0,0) -- (3.0,3);
  \node[below,font=\scriptsize] at (2.4,0) {$f_1$};
  \node[below,font=\scriptsize] at (3.0,0) {$f_2$};
  \draw[line width=3pt,gray] (1.8,0) -- (1.8,0.8);
  \draw[line width=3pt,gray] (3.6,0) -- (3.6,0.8);
  \node[below,font=\scriptsize] at (1.6,0) {$2f_1{-}f_2$};
  \node[below,font=\scriptsize] at (3.9,0) {$2f_2{-}f_1$};
  \node[font=\scriptsize,above] at (1.8,0.8) {IM3};
  \node[font=\scriptsize,above] at (3.6,0.8) {IM3};
  \draw[line width=3pt,gray!50] (7.2,0) -- (7.2,0.3);
  \draw[line width=3pt,gray!50] (7.8,0) -- (7.8,0.8);
  \draw[line width=3pt,gray!50] (8.4,0) -- (8.4,0.8);
  \draw[line width=3pt,gray!50] (9.0,0) -- (9.0,0.3);
  \node[below,font=\scriptsize] at (8.1,0) {$\approx3f$};
  \node[font=\scriptsize,align=center] at (8.1,1.6) {$3f_1,\,2f_1{+}f_2,\ldots$\\ out of band};
  \draw[dashed] (0.9,3.3) -- (0.9,0);
  \draw[dashed] (4.6,3.3) -- (4.6,0);
  \node[font=\scriptsize] at (2.75,3.45) {passband};
\end{circuitikz}
\end{document}
```

$$
\boxed{IM_3 = \frac{3\alpha_3}{4\alpha_1}A^2 = 3\,HD_3\ (\text{same }A)}
$$

```tikz title="Third-order intercept: on a dB scale the fundamental rises 1 dB/dB and IM3 rises 3 dB/dB. Their extrapolated crossing is IP3; it is never measured directly because both curves compress first. P1dB sits about 9.6 dB below IIP3. Lower the signal by 1 dB and IM3 improves by 2 dB. After Carusone Fig. 9.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.6,0) node[right] {input $A$ (dBm)};
  \draw[->] (0,0) -- (0,6.8) node[above] {output (dBm)};
  % fundamental y = 1.6 + 0.76x ; IM3 y = 2.28(x-3.43); intercept (6.2,6.31)
  \draw[thick] (0,1.6) -- (4.6,5.10);
  \draw[thick] (4.6,5.10) .. controls (5.4,5.6) .. (7.0,5.75);
  \draw[thick] (3.43,0) -- (4.9,3.35);
  \draw[thick] (4.9,3.35) .. controls (5.3,4.1) .. (6.6,4.5);
  \draw[dashed] (4.6,5.10) -- (6.2,6.31);
  \draw[dashed] (4.9,3.35) -- (6.2,6.31);
  \fill (6.2,6.31) circle (2pt);
  \draw[dashed] (6.2,6.31) -- (6.2,0) node[below] {IIP3};
  \draw[dashed] (6.2,6.31) -- (0,6.31) node[left] {OIP3};
  \node[font=\scriptsize,anchor=south east,align=right] at (2.4,3.55) {fundamental\\ slope 1};
  \node[font=\scriptsize,anchor=west,align=left] at (4.7,1.5) {IM3\\ slope 3};
  \node[font=\scriptsize,anchor=west] at (7.05,5.45) {compression};
\end{circuitikz}
\end{document}
```

$$
\boxed{OIP3 = I_{D1}-\frac{ID_3}{2}\ \ (\text{dB})}\qquad\boxed{A_{IIP3}=\sqrt{\frac{4}{3}\left|\frac{\alpha_1}{\alpha_3}\right|}}
$$

- $I_{D1}$ is the output fundamental (dBm); $ID_3$ the IM3 ratio in dB (negative). IIP3 = OIP3 minus gain (dB). State which one you mean when $\alpha_1\ne1$.
- In input terms: $IIP3 = P_{in}+\frac{P_{fund}-P_{IM3}}{2}$ (dB, output powers), measured at any one input level $P_{in}$ in the small-signal region.

> [!tip] Remark
> Noise sets the bottom of the usable range and distortion the top. Where IM3 meets the noise floor gives SFDR; SFDR, SNDR, dynamic range and the IIP3 of a cascade are in [[RF Noise and Distortion]].

> [!note]- Derivation: IIP3 from the coefficients
> Set the two (unextrapolated) small-signal lines equal: $|\alpha_1|A = \tfrac34|\alpha_3|A^3$, so $A_{IIP3}^2 = \tfrac43|\alpha_1/\alpha_3|$. Equivalently $IM_3 = (A/A_{IIP3})^2$: every 1 dB of backoff from IIP3 buys 2 dB of IM3. OIP3 relation: $ID_3$ improves 2 dB per dB, and OIP3 is the $I_{D1}$ where $ID_3=0$ dB, hence $OIP3 = I_{D1}-ID_3/2$ (Carusone Eq. 9.140).

> [!note]- Detail: worked numbers (Carusone Exs. 9.13, 9.14, IP3 part)
> - OIP3 = 20 dBm, want IM3 at $-60$ dB: $I_{D1} = 20-30 = -10$ dBm output.
> - Input 0 dBm, gain 2 dB, measured $ID_3 = -40$ dB: OIP3 $=2+20=22$ dBm, IIP3 = 20 dBm. For $-45$ dB, back off 2.5 dB (input $-2.5$ dBm).

### Gain Compression and P1dB

$$
\boxed{\text{fundamental gain} = \alpha_1+\tfrac34\alpha_3A^2}\qquad\boxed{A_{1dB} = \sqrt{0.145\left|\frac{\alpha_1}{\alpha_3}\right|}}\qquad\boxed{\frac{A_{1dB}^2}{A_{IIP3}^2} = 0.109\ \Rightarrow\ P_{1dB}\approx IIP3-9.6\text{ dB}}
$$

- With $\alpha_1\alpha_3<0$ (compressive, the normal case) the gain falls as the input grows. **P1dB** is the input level where the gain is 1 dB below its small-signal value.
- With $\alpha_1\alpha_3>0$ the gain *expands* instead; there is no P1dB, but IP3 still exists.
- The 9.6 dB rule holds only while the cubic term dominates. When it matters, measure both.

> [!note]- Derivation: P1dB from the cubic
> Gain at amplitude $A$: $|\alpha_1+\tfrac34\alpha_3A^2| = 10^{-1/20}|\alpha_1| = 0.891|\alpha_1|$, so $\tfrac34|\alpha_3|A^2 = 0.109|\alpha_1|$ and $A_{1dB}^2 = 0.145|\alpha_1/\alpha_3|$. Divide by $A_{IIP3}^2 = \tfrac43|\alpha_1/\alpha_3|$: $0.109$, i.e. $10\log_{10}0.109 = -9.6$ dB. This is plain algebra on the fundamental term of Carusone Eq. 9.126; neither Razavi Ch. 14 nor Carusone Ch. 9 prints the number.

### IM2 and IP2

Two tones through the $\alpha_2$ term give products at $f_1\pm f_2$ (and $2f_1$, $2f_2$):

$$
\boxed{IM_2 = \left|\frac{\alpha_2}{\alpha_1}\right|A}\qquad\boxed{A_{IIP2} = \left|\frac{\alpha_1}{\alpha_2}\right|}
$$

- The IM2 product rises 2 dB/dB, the tones 1 dB/dB; the two extrapolated lines cross at IP2. Every 1 dB of backoff buys 1 dB of IM2.
- $f_1-f_2$ lands near dc and $f_1+f_2$ near $2f$, which matters in wideband and direct-conversion systems. A differential circuit has $\alpha_2=0$, so in practice its IP2 is set by [[#What Else Mismatch Does|mismatch]].
- Carusone names IP2 alongside IP3 (§9.5.2) for circuits where even order dominates.

> [!note]- Derivation: IM2 amplitude
> $\alpha_2(A\cos\omega_1t+A\cos\omega_2t)^2$ contains $2\alpha_2A^2\cos\omega_1t\cos\omega_2t = \alpha_2A^2[\cos(\omega_1-\omega_2)t+\cos(\omega_1+\omega_2)t]$. Each product has amplitude $\alpha_2A^2$; divide by the fundamental $\alpha_1A$. Setting $\alpha_2A^2=\alpha_1A$ gives $A_{IIP2}$.

## Level 1: Where the Harmonics Come From

### Single-Ended vs Differential

```tikz title="Same gain g_m R_D, same device, same overdrive: a CS stage at I and a pair at I_SS = 2I. After Razavi Fig. 14.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M0){};
  \node[left] at (M0.G) {$V_{in}$};
  \draw (M0.S) -- ++(0,-0.3) node[ground]{};
  \draw (M0.D) to[R,l=$R_D$] ++(0,1.8) node[above]{$V_{DD}$};
  \draw (M0.D) node[circ]{} -- ++(0.6,0) node[right]{$V_{out}$};
  \node[font=\scriptsize] at (1.1,-0.4) {$W/L$, $I$};
  \begin{scope}[xshift=5cm]
    \draw (0,0) node[nmos](M1){};
    \draw (2.4,0) node[nmos,xscale=-1](M2){};
    \node[left] at (M1.G) {$V_{in}$};
    \draw (M1.S) -- (M2.S);
    \draw (1.2,-0.77) node[circ]{} to[I,l={$I_{SS}=2I$}] ++(0,-1.6) node[ground]{};
    \draw (M1.D) to[R,l=$R_D$] ++(0,1.8);
    \draw (M2.D) to[R,l_=$R_D$] ++(0,1.8);
    \draw (M1.D) ++(0,1.8) -- ++(2.4,0);
    \node[above] at (1.2,2.57) {$V_{DD}$};
    \node[font=\scriptsize] at (1.2,0.9) {$V_{out}$};
    \draw[->] (0.25,0.77) -- (2.15,0.77);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{CS: }\frac{A_{HD2}}{A_F} = \frac{V_m}{4V_{OV}}}\qquad\boxed{\text{Pair: }\frac{A_{HD3}}{A_F} \approx \frac{V_m^2}{32V_{OV}^2}}\qquad\boxed{f(-x)=-f(x)\Rightarrow\alpha_2=\alpha_4=\cdots=0}
$$

- At $V_m = 0.2V_{OV}$: CS 5%, pair 0.125%. Same gain, same swing, 40× less distortion.
- The pair burns $2I$. But giving the CS stage $2I$ (same $W/L$) only raises $V_{OV}$ by $\sqrt2$, so $HD_2$ drops only by $\sqrt2$. The win comes from symmetry, not current.
- Both formulas share a lesson: **distortion is set by $V_m/V_{OV}$**. Large overdrive (low $g_m/I_D$) is linear; it trades directly against gain per amp and noise.

> [!tip] Remark
> This is the odd symmetry of [[Differential Amplifiers#Large-Signal Characteristic]]: $I_{D1}-I_{D2}$ is odd in $\Delta V_{in}$ even though each $I_D$ is a square law. The pair also needs $V_m\ll\sqrt2 V_{OV}$ (half its input range) for the series to hold.

> [!note]- Derivation: CS and pair harmonics (Razavi Eqs. 14.14–14.22)
> **CS:** $I_D = \tfrac12\mu_nC_{ox}\tfrac WL(V_{OV}+V_m\cos\omega t)^2 = I + \mu_nC_{ox}\tfrac WL V_{OV}V_m\cos\omega t + \tfrac14\mu_nC_{ox}\tfrac WL V_m^2[1+\cos2\omega t]$. The ratio of the $2\omega$ to the $\omega$ term is $V_m/(4V_{OV})$.
>
> **Pair:** $I_{D1}-I_{D2} = \tfrac12\mu_nC_{ox}\tfrac WL V_{in}\sqrt{4V_{OV}^2-V_{in}^2}$. For $|V_{in}|\ll V_{OV}$, $\sqrt{1-\epsilon}\approx1-\epsilon/2$:
> $$I_{D1}-I_{D2}\approx g_mV_{in}\left(1-\frac{V_{in}^2}{8V_{OV}^2}\right).$$
> With $V_{in}=V_m\cos\omega t$ and $\cos^3 = (3\cos+\cos3)/4$, the third harmonic is $g_mV_m^3/(32V_{OV}^2)$; divide by $g_mV_m$.

> [!note]- Extension: weak inversion and the EKV view (Razavi Prob. 14.10; Jespers & Murmann §4.2)
> In weak inversion the pair is a $\tanh$: $I_{D1}-I_{D2} = I_{SS}\tanh\frac{V_{in}}{2nU_T}$ (Razavi writes $\zeta V_T$ for $nU_T$). With $\tanh u\approx u-u^3/3$:
> $$HD_3 = \frac14\cdot\frac{1}{3}\cdot\frac{V_m^2}{(2nU_T)^2} = \frac{V_m^2}{48\,(nU_T)^2}.$$
> Here $2nU_T$ plays the role $V_{OV}$ plays in strong inversion: the "linear range" is tens of mV, which is why weak-inversion pairs are very nonlinear per volt of input.
>
> Jespers & Murmann generalize this with the EKV model, which gives $g_{m2}$, $g_{m3}$ as functions of the inversion level alone. Two of their conclusions worth knowing: the square-law and $\tanh$ formulas are the two ends of one curve and mispredict real devices near threshold and in strong inversion; and plotting distortion against $g_m/I_D$ instead of $V_{GS}$ makes the curves portable between processes. For a CS stage, mobility degradation drives $g_{m3}$ through zero near $g_m/I_D\approx9$ S/A, a real $HD_3$ null that is too bias-sensitive to design on (JM §4.2.1). (Zettelkasten 12o1, 12o2a, 12p2, 12p3.)

### Effect of Negative Feedback

```tikz title="A mildly nonlinear amplifier in a feedback loop. After Razavi Fig. 14.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[left] {$x(t)$} -- (1,0);
  \draw (1.3,0) circle (0.3);
  \node at (1.3,0) {$\Sigma$};
  \node[font=\scriptsize] at (1.05,0.35) {$+$};
  \node[font=\scriptsize] at (1.55,-0.45) {$-$};
  \draw[->] (1.6,0) -- (2.6,0);
  \draw (2.6,-0.5) rectangle (5.4,0.5);
  \node at (4,0) {$\alpha_1u+\alpha_2u^2$};
  \draw[->] (5.4,0) -- (7.2,0) node[right] {$y(t)$};
  \draw (6.3,0) node[circ]{} -- (6.3,-1.6);
  \draw (4.5,-2.0) rectangle (3.5,-1.2);
  \node at (4,-1.6) {$\beta$};
  \draw[->] (6.3,-1.6) -- (4.5,-1.6);
  \draw[->] (3.5,-1.6) -- (1.3,-1.6) -- (1.3,-0.3);
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{b}{a} = \frac{\alpha_2V_m}{2\alpha_1}\cdot\frac{1}{(1+\beta\alpha_1)^2}}\quad(\text{same input }V_m)\qquad\boxed{\frac{b}{a}\Big|_{\text{same output}} = \frac{\text{open-loop value}}{1+\beta\alpha_1}}
$$

$a$, $b$ are the output fundamental and second harmonic.

- At the same **input**, relative $HD_2$ falls by $(1+T)^2$ and the gain by $1+T$.
- At the same **output** amplitude (the fair comparison, since the closed loop needs a bigger input), the relative harmonic falls by $1+T$.
- **Gain error bounds nonlinearity.** Draw the ideal line (slope $1/\beta$) and the end-point line. If the small-signal gain falls monotonically from $x=0$ to $x_{max}$ (the usual case), the nonlinearity $\Delta y_2$ is smaller than the gain error $\Delta y_1\approx1/(\beta A_0)$. So a high-enough open-loop gain guarantees the linearity spec. Pessimistic, and harder as short-channel devices lower $A_0$.

> [!tip] Remark
> Same result as [[Feedback#What feedback buys]], where the slope variation shrinks by $1+\beta A$. Here it is in harmonic form. Feedback only helps while there is loop gain: at high frequency, or once the amplifier slews or clips, $T$ falls and distortion rises.

> [!note]- Derivation: the loop with a square-law amplifier (Razavi Eqs. 14.23–14.36)
> Guess $y = a\cos\omega t+b\cos2\omega t$. The error is $u = (V_m-\beta a)\cos\omega t-\beta b\cos2\omega t$. Pass through $\alpha_1u+\alpha_2u^2$ and match coefficients:
> $$a = (\alpha_1-\alpha_2\beta b)(V_m-\beta a),\qquad b = -\alpha_1\beta b+\frac{\alpha_2(V_m-\beta a)^2}{2}.$$
> For small $\alpha_2$, $b$: $a\approx\alpha_1V_m/(1+\beta\alpha_1)$ and $V_m-\beta a\approx a/\alpha_1$. Then $b(1+\alpha_1\beta) = \tfrac{\alpha_2}{2}(a/\alpha_1)^2 = \frac{\alpha_2V_m^2}{2(1+\beta\alpha_1)^2}$, so $b = \frac{\alpha_2V_m^2}{2(1+\beta\alpha_1)^3}$; divide by $a$. Without feedback, $b/a = \alpha_2V_m/(2\alpha_1)$.
>
> **Same output amplitude:** open loop needs $V_m = a/\alpha_1$, giving $b/a = \alpha_2a/(2\alpha_1^2)$. Closed loop needs $V_m = a(1+\beta\alpha_1)/\alpha_1$, giving $b/a = \alpha_2a/[2\alpha_1^2(1+\beta\alpha_1)]$. The ratio is $1+\beta\alpha_1$.

### Capacitor Nonlinearity

$$
\boxed{Q(V_1) = \int_0^{V_1}C(V)\,dV\ \neq\ C(V_1)V_1}\qquad\boxed{V_{out}\approx MV_{in0}+(1-M)\frac{M\alpha_1}{2}V_{in0}^2}
$$

With $C = C_0(1+\alpha_1V+\alpha_2V^2+\cdots)$, the charge depends on the whole voltage history, not the end value. In the SC noninverting amplifier of nominal gain $M$ ($C_1 = MC_2$), the second term is the distortion.

> [!tip] Remark
> This is the charge-transfer amplifier of [[Switched-Capacitor Circuits]]. Linear (MIM, MOM, poly-poly) capacitors exist precisely to make $\alpha_1$ small; a MOSFET gate capacitor is badly nonlinear (see [[Capacitor]]).

> [!note]- Derivation: Razavi Eqs. 14.38–14.44
> Sampling leaves $V_{in0}$ on $C_1\approx MC_0(1+\alpha_1V)$: $Q_1 = MC_0V_{in0}+MC_0\tfrac{\alpha_1}{2}V_{in0}^2$. All of it moves to $C_2\approx C_0(1+\alpha_1V)$: $Q_2 = C_0V_{out}+C_0\tfrac{\alpha_1}{2}V_{out}^2$. Setting $Q_1=Q_2$ and solving the quadratic:
> $$V_{out}=\frac{1}{\alpha_1}\left[-1+\sqrt{1+M\alpha_1^2V_{in0}^2+2M\alpha_1V_{in0}}\right].$$
> With $\sqrt{1+\epsilon}\approx1+\epsilon/2-\epsilon^2/8$ this gives the boxed result.

### Nonlinearity in Sampling Circuits

```tikz title="A switch's on-resistance moves with the signal, so the RC phase shift moves too: that is distortion. With a CMOS switch R_on peaks mid-range and varies at twice the input frequency. After Razavi Fig. 14.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[left] {$V_{in}$} to[vR,l=$R_{on}(t)$] (2.6,0) node[circ]{} -- (3.4,0) node[right]{$V_{out}$};
  \draw (2.6,0) to[C,l_=$C_1$] (2.6,-1.6) node[ground]{};
  \begin{scope}[xshift=5.6cm,yshift=-1.4cm]
    \draw[->] (0,0) -- (4.2,0) node[right] {$t$};
    \draw[->] (0,0) -- (0,3.4);
    \draw[thick,domain=0:4,samples=80] plot (\x,{0.9+0.7*cos(\x*157)});
    \draw[thick,dashed,domain=0:4,samples=80] plot (\x,{2.6-0.35*cos(\x*314)});
    \node[font=\scriptsize,anchor=west] at (4.05,2.6) {$R_{on}$};
    \node[font=\scriptsize,anchor=west] at (4.05,0.9) {$V_{in}$};
    \node[font=\scriptsize,align=center] at (2,-0.45) {$R_{on}$ peaks at mid-scale: rate $2\omega_0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{on}(t) = R_0+R_1\cos\omega_0t+R_2\cos2\omega_0t+\cdots,\qquad THD \approx \frac{R_1^2+R_2^2}{4}C_1^2\omega_0^2}
$$

- $R_1$ makes the second harmonic, $R_2$ the third. A symmetric CMOS switch has $R_1\approx0$.
- THD grows as $\omega_0^2$: sampling distortion is worst at high input frequency.
- A differential sampler cancels the even harmonics. Bootstrapping, which holds $V_{GS}$ of the switch constant, attacks $R_1$ and $R_2$ directly ([[Sampling Circuits]]).

> [!note]- Derivation: Razavi Eqs. 14.45–14.49
> For a linear switch with $R_{on}C_1\omega_0\ll1$, $V_{out}\approx V_0\cos(\omega_0t-R_{on}C_1\omega_0)+V_0$. Substitute the Fourier series for $R_{on}$; if the extra phase terms are $\ll1$ rad, expand $\cos(\phi-\delta)\approx\cos\phi+\delta\sin\phi$. The products $R_1C_1\omega_0\cos\omega_0t\cdot V_0\sin(\cdot)$ and $R_2C_1\omega_0\cos2\omega_0t\cdot V_0\sin(\cdot)$ give second and third harmonics of amplitude $V_0R_1C_1\omega_0/2$ and $V_0R_2C_1\omega_0/2$.

## Level 2: Linearization Techniques

> [!important] One idea behind all of them
> Make the gain independent of the input level, which in practice means **independent of the transistor bias currents** (since $g_m$ moves with $I_D$). Global feedback does it best, but its stability and settling cost speed. The techniques below get much of the benefit locally.

### Resistive Degeneration

$$
\boxed{G_m = \frac{g_m}{1+g_mR_S}\ \xrightarrow{\ g_mR_S\gg1\ }\ \frac{1}{R_S}}
$$

The amount of linearization depends on **$g_mR_S$** (the local loop gain), not on $R_S$ alone.

- Example (Razavi Ex. 14.2): swing moves $I_D$ from $0.75I_1$ to $1.25I_1$. Without degeneration the small-signal gain varies by $\sqrt{1.25/0.75}=1.29$; with $g_mR_S=2$ only by $1.08$.
- It is weak: for 0.5 V$_{pp}$ inputs, even a gain of 2 at under 1% nonlinearity is hard in a CS stage (Razavi). Degeneration trades gain, noise and power for linearity.

> [!tip] Remark
> This is [[Single-Stage#Source Degeneration]] and [[Differential Amplifiers#Degenerated Pair]]. A degenerated stage is a feedback loop with loop gain $g_mR_S$, so the [[#Effect of Negative Feedback|$(1+T)$ results]] apply to it.

**For a pair**, two choices (Razavi Fig. 14.12, drawn in [[Differential Amplifiers#Degenerated Pair]]):

| | Single tail, $R_S$ in each source | Split tail, $2R_S$ between sources |
|---|---|---|
| Headroom | Loses $I_{SS}R_S/2$ | No dc drop on $R_S$ |
| Noise / offset | Tail noise is common-mode | Two tail sources add differential noise ($+2I_n^2R_S^2$ input-referred) and offset |

### Triode MOSFET Degeneration

```tikz title="Two triode devices in parallel degenerate the pair. As V_in grows, M3 stays in triode while M4 saturates, so one of them always holds the source nodes together. After Razavi Fig. 14.14 (Krummenacher and Joehl)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2.6) node[nmos](M1){};
  \draw (4.4,2.6) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \node[anchor=west,font=\scriptsize] at (0.1,3.3) {$M_1$};
  \node[anchor=east,font=\scriptsize] at (4.3,3.3) {$M_2$};
  \draw (2.2,1.4) node[nmos,rotate=90](M3){};
  \draw (2.2,-1.0) node[nmos,rotate=90](M4){};
  \draw (M1.S) -- (0,-2.4);
  \draw (M2.S) -- (4.4,-2.4);
  \draw (M3.D) -- (0,0 |- M3.D) node[circ]{};
  \draw (M3.S) -- (4.4,0 |- M3.S) node[circ]{};
  \draw (M4.D) -- (0,0 |- M4.D) node[circ]{};
  \draw (M4.S) -- (4.4,0 |- M4.S) node[circ]{};
  \node[below,font=\scriptsize] at (M3.G) {$V_{in1}$};
  \node[below,font=\scriptsize] at (M4.G) {$V_{in2}$};
  \node[anchor=west,font=\scriptsize] at (2.75,1.0) {$M_3$};
  \node[anchor=west,font=\scriptsize] at (2.75,-1.4) {$M_4$};
  \draw (0,-2.4) to[I,l_=$\frac{I_{SS}}{2}$] (0,-4.0) node[ground]{};
  \draw (4.4,-2.4) to[I,l=$\frac{I_{SS}}{2}$] (4.4,-4.0) node[ground]{};
\end{circuitikz}
\end{document}
```

- A single triode device between the sources (Razavi Fig. 14.13) leaves triode at large swing, and its gate bias must track the input CM.
- Gating the two devices from the two inputs fixes both: $V_{D3} = V_{G3}-V_{GS1}$ keeps $M_3$ in triode while $M_4$ saturates. Widest linear range near $(W/L)_{1,2}\approx7(W/L)_{3,4}$.

### Summing Two Offset Pairs

```tikz title="Two pairs with deliberate, opposite offsets (width ratio 1:2 and 2:1). Their G_m curves shift left and right; shorting the drains adds them into a flatter G_m. After Razavi Fig. 14.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-4,0) -- (4.2,0) node[right] {$\Delta V_{in}$};
  \draw[->] (0,0) -- (0,4) node[above] {$G_m$};
  \draw[thick,dashed,domain=-3.6:3.6,samples=80] plot (\x,{1.6*exp(-(\x+0.78)*(\x+0.78)/1.2)});
  \draw[thick,dashed,domain=-3.6:3.6,samples=80] plot (\x,{1.6*exp(-(\x-0.78)*(\x-0.78)/1.2)});
  \draw[thick,domain=-3.6:3.6,samples=80] plot (\x,{1.6*exp(-(\x+0.78)*(\x+0.78)/1.2)+1.6*exp(-(\x-0.78)*(\x-0.78)/1.2)});
  \node[font=\scriptsize,anchor=west] at (1.6,1.6) {sum: flat top};
  \node[font=\scriptsize] at (-2.6,1.2) {pair A};
  \node[font=\scriptsize] at (2.6,1.0) {pair B};
\end{circuitikz}
\end{document}
```

Each pair alone has a peaked $G_m$; offsetting them by equal and opposite amounts and summing currents widens the flat region. The 1:2 ratio is only illustrative; the best offset is found by optimization. This is mismatch put to use: the [[#Level 3 Mismatch and Offset|width-mismatch offset]] shifts each curve sideways.

### Triode Input Devices at Constant $V_{DS}$

In triode, $I_D = \tfrac12\mu C_{ox}\tfrac WL[2(V_{GS}-V_{TH})V_{DS}-V_{DS}^2]$ is **linear in $V_{GS}$** if $V_{DS}$ is held fixed. Razavi Fig. 14.16 does this with cascodes $M_3$, $M_4$ driven by auxiliary amplifiers that pin $V_X=V_Y=V_b$.

Costs: $g_m = \mu C_{ox}\tfrac WL V_{DS}$ is small (since $V_{DS}$ must stay low); the input CM must track $V_b$; the cascodes and auxiliary amplifiers add noise.

### Post-Correction: a Stage and Its Inverse

```tikz title="A square-law V/I stage followed by a square-root I/V stage (diode loads): the two nonlinearities cancel. After Razavi Fig. 14.18(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.4,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \draw (M1.S) -- (M2.S);
  \draw (1.2,-0.77) node[circ]{} to[I,l=$I_{SS}$] ++(0,-1.5) node[ground]{};
  \draw (0,2.2) node[pmos](M3){};
  \draw (2.4,2.2) node[pmos,xscale=-1](M4){};
  \draw (M1.D) -- (M3.D);
  \draw (M2.D) -- (M4.D);
  \draw (M3.S) -- ++(0,0.2) -- ++(2.4,0) -- (M4.S);
  \node[above] at (1.2,3.17) {$V_{DD}$};
  \draw (M3.G) -- ++(-0.3,0) |- (M3.D);
  \draw (M4.G) -- ++(0.3,0) |- (M4.D);
  \node[font=\scriptsize,anchor=west] at (0.1,2.75) {$M_3$};
  \node[font=\scriptsize,anchor=east] at (2.3,2.75) {$M_4$};
  \draw (M1.D) node[circ]{} -- ++(-0.9,0) node[left]{$V_{out}^-$};
  \draw (M2.D) node[circ]{} -- ++(0.9,0) node[right]{$V_{out}^+$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = \sqrt{\frac{(W/L)_{1,2}}{(W/L)_{3,4}}}}
$$

$V_{in}=V_{GS1}-V_{GS2}$ is a difference of square roots of the currents, and so is $V_{out}=V_{GS3}-V_{GS4}$. The same currents flow in both, so the square roots cancel and the gain is a ratio of sizes, independent of bias. Limits: body effect and short-channel effects; and once $M_1$ or $M_2$ goes subthreshold the gain collapses.

> [!tip] Remark
> This is the diode-loaded pair of [[Differential Amplifiers#Level 4 MOS Loads]]: the reason its gain is so well defined is exactly this cancellation.

### Local Feedback: a Linear Transconductor

```tikz title="M3 and M4 sense the pair's drains and return current to its sources, holding I_D1 and I_D2 (hence V_GS1, V_GS2) constant. The whole input then appears across R_S. After Razavi Fig. 14.19(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (6,0) node[nmos,xscale=-1](M2){};
  \node[left] at (M1.G) {$V_{in1}$};
  \node[right] at (M2.G) {$V_{in2}$};
  \node[anchor=west,font=\scriptsize] at (0.1,0.45) {$M_1$};
  \node[anchor=east,font=\scriptsize] at (5.9,0.45) {$M_2$};
  \draw (-2,3.6) -- (8,3.6);
  \node[above] at (3,3.6) {$V_{DD}$};
  \draw (0,3.6) to[I,l_=$I_3$] (0,2.4) -- (M1.D);
  \draw (6,3.6) to[I,l=$I_4$] (6,2.4) -- (M2.D);
  \draw (M1.D) node[circ]{} node[anchor=south west]{$X$};
  \draw (M2.D) node[circ]{} node[anchor=south east]{$Y$};
  \draw (-2,2.0) node[pmos,xscale=-1](M3){};
  \draw (8,2.0) node[pmos](M4){};
  \node[anchor=east,font=\scriptsize] at (-2.1,2.0) {$M_3$};
  \node[anchor=west,font=\scriptsize] at (8.1,2.0) {$M_4$};
  \draw (M3.S) -- (-2,3.6);
  \draw (M4.S) -- (8,3.6);
  \draw (M3.G) -- (0,0 |- M3.G) node[circ]{};
  \draw (M4.G) -- (6,0 |- M4.G) node[circ]{};
  \draw (M1.S) to[R,l_=$R_S$,*-*] (M2.S);
  \draw[->] (2.3,-0.35) -- (3.7,-0.35) node[midway,above,font=\scriptsize] {$I_{sig}$};
  \draw (M1.S) -- (0,-1.6) node[circ]{};
  \draw (M2.S) -- (6,-1.6) node[circ]{};
  \draw (M3.D) -- (-2,-1.6) -- (0,-1.6);
  \draw (M4.D) -- (8,-1.6) -- (6,-1.6);
  \draw (0,-1.6) to[I,l_=$I_1$] (0,-3.2) node[ground]{};
  \draw (6,-1.6) to[I,l=$I_2$] (6,-3.2) node[ground]{};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{in} = I_{sig}R_S\qquad V_{out} = \frac{2R_D}{R_S}V_{in}}
$$

With $I_1=\cdots=I_4$ and ignoring CLM and body effect, $I_{D1}=I_3$ and $I_{D2}=I_4$ regardless of input, so the input devices keep a constant $V_{GS}$ and all signal current flows through $R_S$, supplied by $M_3$, $M_4$. Copy those PMOS currents to resistors $R_D$ for a voltage output (Razavi Fig. 14.19(b)). Costs: many devices in the signal path (noise), and $r_o$ varying with $V_{DS}$ in short-channel devices adds nonlinearity at the output.

## Level 3: Mismatch and Offset

### Where Mismatch Comes From: Averaging

```tikz title="A big transistor is many small ones in series and parallel. Random local variations (edge roughness, dopant count, oxide grain) average over more units, so the spread falls as 1/sqrt(area). After Razavi Figs. 14.21-14.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i in {0,...,5} { \foreach \j in {0,...,3} {
    \draw[fill=gray!15] ({0.55*\i},{0.55*\j}) rectangle ({0.55*\i+0.5},{0.55*\j+0.5});
  } }
  \draw[<->] (0,-0.25) -- (3.25,-0.25) node[midway,below] {$L$};
  \draw[<->] (-0.25,0) -- (-0.25,2.15) node[midway,left] {$W$};
  \node[font=\scriptsize] at (0.25,2.45) {$W_0L_0$};
  \node[font=\scriptsize,align=left,anchor=west] at (3.5,1.1) {$N\propto WL$ units,\\ each $V_{TH,j}$, $(\mu C_{ox})_j$};
  \begin{scope}[xshift=7.6cm]
    \draw[->] (0,0) -- (4,0) node[right] {$1/\sqrt{WL}$};
    \draw[->] (0,0) -- (0,2.6) node[above] {$\sigma(\Delta V_{TH})$};
    \draw[thick] (0,0) -- (3.5,2.2);
    \node[font=\scriptsize,anchor=west] at (2.2,0.85) {slope $A_{VT}$};
    \node[font=\scriptsize,anchor=west] at (0.0,-0.5) {$\leftarrow$ big devices};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\sigma(\Delta V_{TH}) = \frac{A_{VT}}{\sqrt{WL}}}\qquad\boxed{\sigma\!\left(\frac{\Delta\beta}{\beta}\right) = \frac{A_\beta}{\sqrt{WL}},\quad \beta = \mu C_{ox}\frac WL}
$$

- $\Delta$ is the difference between **two** devices; $A_{VT}$ and $A_\beta$ are pair constants, measured. Don't multiply by $\sqrt2$ again.
- Scale: $A_{VT}\approx4$ mV·µm at 40 nm (Razavi); $3.5$ mV·µm and $A_\beta\approx1\%$·µm at 65 nm (Jespers & Murmann); 30 (NMOS) / 35 (PMOS) mV·µm in Pelgrom's original 2.5 µm process. $A_{VT}$ scales roughly with oxide thickness; $A_\beta$ has stayed near 1–2%·µm for many nodes.
- **Matching costs capacitance.** Halving $\sigma(\Delta V_{TH})$ takes 4× the area and 4× the gate capacitance. Razavi: about 300 fF per transistor for 1 mV in a 0.6 µm process.
- Capacitor matching is quoted around 0.1% (Razavi), an empirical number, not derived.

> [!tip] Remark
> These are the random, local errors that remain after layout has removed the systematic ones (gradients, orientation, STI stress, well proximity): see [[MosFETs#Layout]], [[Device Matching]] and [[Common-Centroid Layout]]. Layout can't shrink the random part; only area can.

> [!example] Razavi Ex. 14.4
> $L = 40$ nm, $A_{VT} = 4$ mV·µm, want $\sigma(\Delta V_{TH})\le2$ mV: $W = A_{VT}^2/(L\,\Delta V_{TH}^2) = 16/(0.04\cdot4) = 100$ µm. A $W/L$ of 2500 just for a 2 mV offset.

> [!note]- Detail: Pelgrom's model, in full (Pelgrom & Duinmaijer, ESSCIRC '88)
> **Assumptions.** Mismatch in a parameter $P$ is the sum of many independent small events whose correlation distance is much shorter than the device. Then $P$ is Gaussian with $\sigma^2(P)\propto1/WL$. A wafer-level gradient (from oxidation) adds a long-distance term:
> $$\sigma^2(\Delta P) = \frac{A_P^2}{WL}+S_P^2D^2$$
> with $D$ the spacing. Measured $S_{VT0}\approx4$ µV/µm; spacing could be ignored for areas below about 100 µm².
>
> **Current factor.** Edge roughness gives $\sigma^2(L)\propto1/W$ and $\sigma^2(W)\propto1/L$, so
> $$\frac{\sigma^2(\beta)}{\beta^2} = \frac{A_W^2}{W^2L}+\frac{A_L^2}{WL^2}+\frac{A_\mu^2}{WL}+\frac{A_{C_{ox}}^2}{WL}\approx\frac{A_\beta^2}{WL},$$
> less accurate for small $W$ and $L$.
>
> **Measured (2.5 µm, 500 Å oxide):** $A_{VT0}$ = 30 / 35 mV·µm, $A_\beta$ = 2 / 3 %·µm, $A_K$ (body factor) = $16\times10^{-3}$ / $12\times10^{-3}$ V$^{1/2}$·µm (n / p). $A_{VT0}$ and $A_K$ scale with oxide thickness, $A_\beta$ does not: threshold mismatch is a charge effect. Rotating one device of the pair by 90° hurts only $\beta$ (mobility anisotropy). $\Delta V_{TH}$ dominates for $V_{GS}-V_T$ below about 3 V in that process.
>
> **Circuit check.** A bandgap had $\sigma = 19$ mV of output spread, dominated by the op amp (18 mV at the output, 1.6 mV at its input). The measured transistor constants predicted 1.7 mV: 1.6 mV from $\Delta V_{TH}$, 0.35 mV from $\Delta\beta$. Getting the output to 9 mV needed 0.6 mV of op-amp offset, i.e. 9× the input-stage gate area.

> [!note]- Extension: pocket implants break the $1/L$ part (Jespers & Murmann §4.3.1)
> Halo/pocket implants near source and drain set the threshold; the lightly doped centre does not. Adding length adds centre, which averages nothing, so $\sigma(\Delta V_{TH})$ stops falling as $1/\sqrt L$. JM's conservative rule: evaluate Pelgrom with $L = L_{min}$ (the length $A_{VT}$ was measured at), whatever $L$ you draw, and treat any gain from a longer device as a bonus. (Zettelkasten 12r1.)

### Input-Referred Offset

```tikz title="Offset: the input that zeroes the output. Model it as a dc source in series with one gate. After Razavi Fig. 14.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (2.4,0) node[nmos,xscale=-1](M2){};
  \draw (M1.S) -- (M2.S);
  \draw (1.2,-0.77) node[circ]{} to[I,l=$I_{SS}$] ++(0,-1.5) node[ground]{};
  \draw (M1.D) to[R,l=$R_1$] ++(0,1.8);
  \draw (M2.D) to[R,l_=$R_2$] ++(0,1.8);
  \draw (M1.D) ++(0,1.8) -- ++(2.4,0);
  \node[above] at (1.2,2.57) {$V_{DD}$};
  \draw[->] (0.25,0.77) -- (2.15,0.77) node[midway,above,font=\scriptsize] {$V_{out}=0$};
  \draw (M1.G) to[battery1,l_=$V_{OS,in}$] ++(-1.8,0) -- ++(0,-3.6) coordinate(a);
  \draw (M2.G) -- ++(0.6,0) -- ++(0,-3.6) coordinate(b);
  \draw (a) -- (b) node[midway,below,font=\scriptsize] {inputs shorted through $V_{OS,in}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{|V_{OS,in}| = \frac{|V_{OS,out}|}{A_v}}\qquad\boxed{V_{OS,in}=\frac{V_{OV}}{2}\left(\frac{\Delta R_D}{R_D}+\frac{\Delta(W/L)}{W/L}\right)-\Delta V_{TH}}
$$

$$
\boxed{\sigma^2_{V_{OS,in}} = \left(\frac{V_{OV}}{2}\right)^2\left[\left(\frac{\Delta R_D}{R_D}\right)^2+\left(\frac{\Delta(W/L)}{W/L}\right)^2\right]+\sigma^2_{\Delta V_{TH}}}
$$

- $\Delta V_{TH}$ goes **straight** to the input. Dimension and load mismatch are scaled by $V_{OV}/2$: **low overdrive** (low tail current, wider devices) lowers offset.
- Independent sources add in power (quadrature), like noise. Polarity is unknown, so only $\sigma$ matters.
- Why it matters: in a dc-coupled cascade the amplified offset can saturate later stages, and an offset is a floor on the smallest difference a comparator or amplifier can resolve.

> [!tip] Remark
> Offset is noise at zero frequency. It refers to the input with the same gains as [[Noise#Input-Referred Voltage and Current|input-referred noise]], and both get worse with $V_{OV}$ at fixed current (since $g_m = 2I_D/V_{OV}$).

> [!note]- Derivation: offset of a resistively loaded pair (Razavi Eqs. 14.72–14.78)
> Let $V_{TH2} = V_{TH}+\Delta V_{TH}$, $(W/L)_2 = W/L+\Delta(W/L)$, $R_2 = R_D+\Delta R$, and $\lambda=\gamma=0$. Zero output means $I_{D1}R_1 = I_{D2}R_2$, so the currents differ: $I_{D2} = I_D+\Delta I_D$ with $\Delta I_D/I_D\approx-\Delta R/R_D$. Then
> $$V_{OS,in} = V_{GS1}-V_{GS2} = \sqrt{\frac{2}{\mu_nC_{ox}}}\left[\sqrt{\frac{I_D}{W/L}}-\sqrt{\frac{I_D+\Delta I_D}{W/L+\Delta(W/L)}}\right]-\Delta V_{TH}.$$
> Expand $\sqrt{1+\epsilon}\approx1+\epsilon/2$, drop products of small terms, substitute $\Delta I_D/I_D = -\Delta R/R_D$ and $\sqrt{2I_D/(\mu_nC_{ox}W/L)} = V_{OV}$.

> [!note]- Detail: offset with an active load (Razavi Ex. 14.5)
> For an NMOS pair with a PMOS current-source load, each pair has its own offset $V_{OS,N}$, $V_{OS,P}$ from the formula above (with its own overdrive). Referred to the input, the PMOS one is scaled by $g_{mP}/g_{mN}$:
> $$V_{OS,in}^2 = V_{OS,N}^2+\left(\frac{g_{mP}}{g_{mN}}\right)^2V_{OS,P}^2.$$
> Same rule as noise: make the load $g_m$ small. In $g_m/I_D$ terms (JM Eq. 4.57), with equal currents $g_{mP}/g_{mN} = (g_m/I_D)_P/(g_m/I_D)_N$, so the load wants low $g_m/I_D$, limited by its $V_{D,sat}$ (Razavi Prob. 14.20: offset trades with output swing).

### Current Mismatch: the Opposite Instruction

```tikz title="Offset voltage and current mismatch pull the overdrive in opposite directions. Sketch of Razavi Eqs. (14.79) and (14.86) at fixed device area; the Delta V_TH term sets the floor of one and the dominant part of the other."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right] {$V_{OV}$};
  \draw[->] (0,0) -- (0,4.3) node[above] {$\sigma$};
  \draw[thick,domain=0.3:6,samples=60] plot (\x,{sqrt(1+0.12*\x*\x)});
  \draw[thick,dashed,domain=0.55:6,samples=60] plot (\x,{sqrt(0.09+(2/\x)*(2/\x))});
  \draw[dotted] (0,1) -- (6,1);
  \node[font=\scriptsize,anchor=west] at (0.1,0.75) {$\sigma_{\Delta V_{TH}}$ floor};
  \node[font=\scriptsize,anchor=west] at (4.0,2.55) {$\sigma(V_{OS,in})$};
  \node[font=\scriptsize,anchor=west] at (1.0,3.6) {$\sigma(\Delta I_D/I_D)$ (dashed)};
  \node[font=\scriptsize,align=center] at (1.2,-0.6) {high $g_m/I_D$};
  \node[font=\scriptsize,align=center] at (5.2,-0.6) {low $g_m/I_D$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\Delta I_D}{I_D} = \frac{\Delta(W/L)}{W/L}-\frac{2\Delta V_{TH}}{V_{GS}-V_{TH}} = \frac{\Delta\beta}{\beta}-\frac{g_m}{I_D}\Delta V_{TH}}
$$

For two current sources with the same $V_{GS}$, **high overdrive** makes $\Delta V_{TH}$ a smaller fraction of the gate drive. Current mirrors, current-steering DACs and tail sources want large $V_{OV}$; input pairs want small $V_{OV}$.

> [!tip] Remark
> Same parallel as noise: a pair's input noise voltage rises with $V_{OV}$, a current source's output noise current is $\propto g_m$ and so falls with $V_{OV}$ at fixed current ([[Noise#Current Mirrors]]). The mirror version with sizing rules is in [[Current Mirrors#Level 6 Mismatch]]; bias choice is in [[Biasing]].

> [!note]- Derivation: total differential (Razavi Eqs. 14.83–14.86)
> $I_D = \tfrac12\mu_nC_{ox}\tfrac WL(V_{GS}-V_{TH})^2$. With $V_{GS}$ common, $\Delta I_D = \frac{\partial I_D}{\partial(W/L)}\Delta(W/L)+\frac{\partial I_D}{\partial V_{TH}}\Delta V_{TH} = \tfrac12\mu_nC_{ox}V_{OV}^2\Delta(W/L)-\mu_nC_{ox}\tfrac WL V_{OV}\Delta V_{TH}$. Divide by $I_D$. Since $g_m/I_D = 2/V_{OV}$ in strong inversion, the second form follows.
>
> Degeneration helps current matching if the resistors match better than the transistors (Razavi Prob. 14.15): the transistor terms are divided by $1+g_mR_S$, and $R_S$ must exceed $1/g_m$ to help much.

### What Else Mismatch Does

**Even-order distortion returns.** Two halves $y_1 = \alpha_1x+\alpha_2x^2+\alpha_3x^3$ and $y_2 = \beta_1x+\beta_2x^2+\beta_3x^3$ driven by $\pm x$:

$$
\boxed{y_1-y_2 = (\alpha_1+\beta_1)x+(\alpha_2-\beta_2)x^2+(\alpha_3+\beta_3)x^3,\qquad A_{HD2} = \frac{(\alpha_2-\beta_2)A^2}{2}}
$$

Phase mismatch between the halves at high frequency does the same, and so do thermal gradients (a pair device nearer a hot output stage gets a different $V_{TH}$ and $\mu$).

**CMRR is an offset that moves with the input CM.**

$$
\boxed{\text{CMRR} = \frac{\Delta V_{CM,in}}{\Delta V_{OS,in}}}
$$

Example: a PMOS input pair with each source tied to its own n-well has no body effect, so its offset doesn't move with CM. With the wells tied to $V_{DD}$, a mismatch in body-effect coefficients makes $\Delta V_{TH}$ (the offset) a function of CM: worse CMRR.

> [!tip] Remark
> This is the same CM-to-DM conversion as [[Differential Amplifiers#Mismatch Converts CM to DM]] and [[Differential Amplifiers#CMRR]], now read as "offset drift per volt of CM".

## Level 4: Offset Cancellation

When the area (capacitance) for matching is too high, or packaging stress shifts the offset after test, cancel it electronically. Every scheme has two phases: **measure** the offset with the input shorted, **store** it on capacitors, then subtract it while amplifying.

### Output Offset Storage

```tikz title="Output offset storage: during CK, S1-S4 close. The inputs sit at V_CM and the output A_v V_OS is stored on C1, C2 while X, Y are held at V_CM. After Razavi Figs. 14.30-14.31."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (3,-1) rectangle (5,1);
  \node at (4,0) {$A_v$};
  \draw (-0.6,0.6) node[left]{$V_{in}^+$} -- (1.2,0.6) to[battery1,l=$V_{OS}$] (3,0.6);
  \draw (-0.6,-0.6) node[left]{$V_{in}^-$} -- (3,-0.6);
  \draw (0.4,0.6) node[circ]{} to[nos,l=$S_1$] (0.4,2.0) node[above]{$V_{CM}$};
  \draw (0.4,-0.6) node[circ]{} to[nos,l_=$S_2$] (0.4,-2.0) node[below]{$V_{CM}$};
  \draw (5,0.6) to[C,l=$C_1$] (6.8,0.6) node[circ]{} -- (7.6,0.6) node[right]{$X$};
  \draw (5,-0.6) to[C,l_=$C_2$] (6.8,-0.6) node[circ]{} -- (7.6,-0.6) node[right]{$Y$};
  \draw (6.8,0.6) to[nos,l_=$S_3$] (6.8,2.0) node[above]{$V_{CM}$};
  \draw (6.8,-0.6) to[nos,l=$S_4$] (6.8,-2.0) node[below]{$V_{CM}$};
\end{circuitikz}
\end{document}
```

- After $S_1$–$S_4$ open, a zero differential input gives $V_X - V_Y = 0$: offset nulled, apart from **charge-injection mismatch** of $S_3$, $S_4$.
- $A_vV_{OS}$ must not saturate the amplifier, so $A_v\lesssim10$.

### Input Offset Storage

```tikz title="Input offset storage: during cancellation S1-S4 close. The input plates of C1, C2 go to V_CM and the amplifier sits in unity negative feedback, so X-Y settles to V_OS A_v/(1+A_v), which C1, C2 store. After Razavi Fig. 14.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (4,-1) rectangle (6,1);
  \node at (5,0) {$A_v$};
  \node[font=\scriptsize] at (4.2,0.6) {$+$};
  \node[font=\scriptsize] at (4.2,-0.6) {$-$};
  \node[font=\scriptsize] at (5.8,0.6) {$-$};
  \node[font=\scriptsize] at (5.8,-0.6) {$+$};
  \draw (-0.6,0.6) node[left]{$V_{in}^+$} -- (0.6,0.6) node[circ]{} to[C,l=$C_1$] (3.2,0.6) node[circ]{} node[below]{$X$} -- (4,0.6);
  \draw (-0.6,-0.6) node[left]{$V_{in}^-$} -- (0.6,-0.6) node[circ]{} to[C,l_=$C_2$] (3.2,-0.6) node[circ]{} node[above]{$Y$} -- (4,-0.6);
  \draw (0.6,0.6) to[nos,l=$S_1$] (0.6,2.0) node[above]{$V_{CM}$};
  \draw (0.6,-0.6) to[nos,l_=$S_2$] (0.6,-2.0) node[below]{$V_{CM}$};
  \draw (6,0.6) -- (7.0,0.6) node[circ]{} -- (7.8,0.6) node[right]{$V_{out}^-$};
  \draw (6,-0.6) -- (7.0,-0.6) node[circ]{} -- (7.8,-0.6) node[right]{$V_{out}^+$};
  \draw (7.0,0.6) -- (7.0,2.0) to[nos,l_=$S_3$] (3.2,2.0) -- (3.2,0.6);
  \draw (7.0,-0.6) -- (7.0,-2.0) to[nos,l=$S_4$] (3.2,-2.0) -- (3.2,-0.6);
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = \frac{A_v}{1+A_v}V_{OS}\approx V_{OS}\ \text{stored}\quad\Rightarrow\quad V_{OS,in,residual} = \frac{V_{OS}}{A_v}}
$$

- Allows high $A_v$ (the amplifier is in feedback while storing). Residual assumes $S_3$, $S_4$ match and $C_{in}\ll C_1$.
- Large $A_v$ makes charge-injection mismatch of $S_3$, $S_4$ the new problem; it can even saturate the amplifier.

> [!warning] Shared cost of input and output storage
> The storage capacitors sit **in the signal path**. Their bottom-plate parasitics add poles (phase margin in op amps) and slow settling.

### Auxiliary Amplifier: Capacitors Out of the Signal Path

```tikz title="The offset is stored at the input of a small auxiliary G_m2 that injects a correction current into the main path. In practice G_m1 + R is a one-stage op amp and G_m2 a small pair at its cascode nodes. After Razavi Figs. 14.35-14.36."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[left]{$V_{in}$} -- (0.8,0);
  \draw (0.8,-0.5) rectangle (2.2,0.5); \node at (1.5,0) {$G_{m1}$};
  \node[font=\scriptsize] at (1.5,0.75) {$V_{OS1}$};
  \draw[->] (2.2,0) -- (3.2,0);
  \draw (3.5,0) circle (0.3); \node at (3.5,0) {$+$};
  \draw[->] (3.8,0) -- (4.6,0);
  \draw (4.6,-0.5) rectangle (5.8,0.5); \node at (5.2,0) {$R$};
  \draw[->] (5.8,0) -- (8,0) node[right]{$V_{out}$};
  \draw (6.8,0) node[circ]{} -- (6.8,-1.0) to[nos,l=$S_{3,4}$] (6.8,-2.4) -- (5.6,-2.4);
  \draw (5.6,-2.4) node[circ]{} to[C,l=$C_{1,2}$] ++(0,-1.0) node[ground]{};
  \draw (5.6,-2.4) -- (4.6,-2.4);
  \draw (3.2,-2.9) rectangle (4.6,-1.9); \node at (3.9,-2.4) {$G_{m2}$};
  \node[font=\scriptsize] at (3.9,-3.15) {$V_{OS2}$};
  \draw[->] (3.5,-1.9) -- (3.5,-0.3);
  \node[font=\scriptsize] at (3.15,-1.1) {$-$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{OS,tot} \approx \frac{V_{OS1}}{G_{m2}R}+\frac{V_{OS2}}{G_{m1}R}}\qquad\boxed{\Delta V_{inj}\ \to\ \frac{G_{m2}}{G_{m1}}\Delta V_{inj}\ \text{at the input}}
$$

- During cancellation $S_{3,4}$ close the loop $R\to G_{m2}\to$ sum, and $V_{out}$ settles to $(G_{m1}RV_{OS1}+G_{m2}RV_{OS2})/(1+G_{m2}R)$, which is stored. Both terms are tiny when $G_{m1}R$, $G_{m2}R$ are large.
- Unequal charge injection from $S_3$, $S_4$ is *not* corrected (the loop is open), so keep $G_{m2}\approx0.1\,G_{m1}$.
- All storage schemes need **refresh** (switch junction and subthreshold leakage), typically at least a few kHz.
- The SC unity-gain and precision ×2 circuits also cancel op-amp offset ([[Switched-Capacitor Circuits]]).

> [!note]- Derivation: Razavi Eqs. 14.91–14.95
> In the loop: $[G_{m1}V_{OS1}-G_{m2}(V_{out}-V_{OS2})]R = V_{out}$, so $V_{out} = \frac{G_{m1}RV_{OS1}+G_{m2}RV_{OS2}}{1+G_{m2}R}$. After the switches open this is the stored state; refer it to the input by $G_{m1}R$:
> $$V_{OS,tot} = \frac{V_{OS1}}{1+G_{m2}R}+\frac{G_{m2}}{G_{m1}}\frac{V_{OS2}}{1+G_{m2}R}\approx\frac{V_{OS1}}{G_{m2}R}+\frac{V_{OS2}}{G_{m1}R}.$$
> The topology of Razavi Fig. 14.34 (a second stage $A_2$ plus $A_{aux}$) works the same way but puts two gain stages in the signal path and needs output voltages added, which is why the $G_m$/$R$ form is used.

### Correlated Double Sampling: Offset Cancellation Removes $1/f$ Noise

```tikz title="Offset stored at t1, signal sampled at t2. A slow noise component barely moves in Delta t = t2 - t1, so it is cancelled with the offset; a fast one is not. Delta t = 10 ns: a 1 MHz component moves 6.3% of its amplitude, a 10 MHz one 63%. After Razavi Figs. 14.38-14.39."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right] {$t$};
  \draw[thick,domain=0:7.5,samples=100] plot (\x,{1.6+1.2*sin(\x*20)});
  \draw[thick,dashed,domain=0:7.5,samples=200] plot (\x,{1.6+1.2*sin((\x-3.25)*200)});
  \draw[dotted] (3.0,0) -- (3.0,3.2);
  \draw[dotted] (3.5,0) -- (3.5,3.2);
  \node[below] at (3.0,0) {$t_1$};
  \node[below] at (3.5,0) {$t_2$};
  \node[font=\scriptsize,anchor=west] at (0,3.75) {slow (solid): barely moves in $\Delta t$, cancelled};
  \node[font=\scriptsize,anchor=west] at (0,3.35) {fast (dashed): moves a lot in $\Delta t$, survives};
  \node[font=\scriptsize,align=center] at (1.5,-0.6) {end of offset\\ cancellation $=t_1$};
  \node[font=\scriptsize,align=center] at (5.0,-0.6) {end of sampling $=t_2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{CDS suppresses noise below} \sim\frac{1}{\Delta t},\qquad \frac{\Delta V}{A}\le2\pi f\,\Delta t}
$$

Offset is noise at $f\to0$, so storing the offset just before each sample also removes low-frequency noise. Useful when the signal band is low (a few MHz) and the $1/f$ corner is typically 500 kHz to 1 MHz (Razavi). The price: **wideband (white) noise is aliased** into the band by the sampling.

> [!tip] Remark
> Flicker noise is the low-frequency component this removes ([[Noise#Flicker (1/f) Noise]]). Comparators use the same input/output offset storage ([[Comparators]]).

## Level 5: Mismatch Beyond the Square Law

### The $g_m/I_D$ Form

With $g_m/I_D = 2/V_{OV}$ in strong inversion, the two results of Level 3 become one pair of formulas valid at any inversion level:

$$
\boxed{\frac{\Delta I_D}{I_D} = \frac{\Delta\beta}{\beta}-\frac{g_m}{I_D}\Delta V_{TH}}\qquad\boxed{V_{OS} = \frac{\Delta\beta/\beta}{g_m/I_D}-\Delta V_{TH}}
$$

$$
\boxed{\sigma^2\!\left(\frac{\Delta I_D}{I_D}\right) = \left(\frac{g_m}{I_D}\right)^2\frac{A_{VT}^2}{WL}+\frac{A_\beta^2}{WL}}
$$

- The same two mismatches, referred to a current port (multiply $\Delta V_{TH}$ by $g_m/I_D$) or a voltage port (divide $\Delta\beta/\beta$ by $g_m/I_D$).
- **$\Delta V_{TH}$ dominates** at practical biases. With 65 nm numbers ($A_{VT}=3.5$ mV·µm, $A_\beta=1\%$·µm) the two mirror terms are equal only near $g_m/I_D\approx2.5$ S/A ($V_{D,sat}\approx2/(g_m/I_D) = 0.8$ V): not a usable bias (JM Ex. 4.7).

> [!tip] Remark
> $g_m/I_D$ is the sizing variable of [[MosFETs#gm/ID and ID/W Simulation-Aided Design]] and [[gm-ID Design Methodology]]. Its floor in weak inversion, $1/(nU_T)$, sets the worst a mirror can be per mV of $\Delta V_{TH}$.

### Offset Drift Comes from $\Delta\beta$, Not $\Delta V_{TH}$

$$
\boxed{\frac{dV_{OS}}{dT} = \left(\frac{\Delta\beta}{\beta}\right)_{tot}\frac{d}{dT}\left(\frac{I_D}{g_m}\right)_1\ \xrightarrow{\text{weak inv.}}\ \frac{V_{OS,\Delta\beta}}{T}}
$$

- Both $\Delta V_{TH}$ and $\Delta\beta/\beta$ are essentially temperature-independent (measured). $\Delta V_{TH}$ reaches the input directly, so it sets the offset *size* but does not drift. $\Delta\beta$ reaches it through $I_D/g_m$, which depends on $T$.
- In weak inversion $I_D/g_m = nkT/q$, so drift = $V_{OS,\Delta\beta}/T$ (3.3 µV/K per mV at 300 K), the same rule as bipolar amplifiers.
- In strong inversion the drift is larger, by up to about 3× (mobility $\propto T^a$, $a=-2\ldots-3$; $g_m\propto\mu^{1/b}$, $b$ from 2 (square law) toward 1 (velocity-saturated)). **For low drift, bias the input pair in weak inversion.**
- Trimming or cancelling the big $\Delta V_{TH}$ offset does nothing for drift.

(Jespers & Murmann §4.3.3, Ex. 4.8; Zettelkasten 12t1, 12t1a.)

### Why $V_{TH}$ and $\beta$ Are the Wrong Parameters

The Pelgrom form is a hand model. Drennan & McAndrew (JSSC 2003) show where it fails and what to do instead:

- **$V_{TH}$ is not a process parameter.** It depends on flat-band voltage, $t_{ox}$, $N_{sub}$, and on $L$ and $W$ through short-channel, reverse-short-channel, narrow-width and halo effects. So $\sigma_{V_t} = A_{V_t}/\sqrt{LW}$ is "physically incorrect" and mispredicts **wide/short and narrow/long devices**, exactly the shapes analog uses (differential pairs, mirrors). Test structures with $L\approx W$ hide this.
- **Use propagation of variance with the real model:**
$$
\boxed{\sigma_e^2 = \sum_i\left(\frac{\partial e}{\partial p_i}\right)^2\sigma_{p_i}^2}
$$
where $e$ is the electrical quantity ($I_D$, $V_{GS}$, $g_m$) and $p_i$ are independent process parameters ($V_{fb}$, $t_{ox}$, $N_{sub}$, $\mu$, $\Delta L$, $\Delta W$, sheet resistance, ...), each with its own geometry law ($\sigma^2_{\Delta L}\propto1/W$, $\sigma^2_{\Delta W}\propto1/L$, area terms $\propto1/LW$). The sensitivities come from SPICE (BSIM) at the actual bias. In practice: **run Monte Carlo with the foundry mismatch model at your bias**, rather than trusting $A_{VT}/\sqrt{WL}$.
- **Input offset is $\sigma_{V_{GS}} = \sigma_{I_D}/g_m$**, not $\sigma_{V_t}$: neither $\sigma_{I_D}$ nor $g_m$ is constant over bias, especially in halo devices.

```tikz title="Current-mirror mismatch at fixed current: longer L helps twice (more area, higher V_OV). Wider W adds area but lowers V_OV, and the two nearly cancel. Qualitative, after Drennan & McAndrew Fig. 6 and Jespers & Murmann §4.3.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (5.2,0) node[right] {$L$ or $W$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$\sigma(\Delta I/I)$};
  \draw[thick,domain=0.45:5,samples=60] plot (\x,{1.2/\x+0.15});
  \draw[thick,dashed,domain=0.45:5,samples=60] plot (\x,{1.25+0.6/(\x+0.3)});
  \node[font=\scriptsize,anchor=west] at (3.0,0.95) {vs $L$: falls};
  \node[font=\scriptsize,anchor=west] at (2.4,1.75) {vs $W$: nearly flat (strong inv.)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Mirror at fixed }I_D:\ \sigma\!\left(\tfrac{\Delta I}{I}\right)\text{ depends strongly on }L,\text{ weakly on }W\ (\text{strong inversion})}
$$

> [!note]- Detail: NMOS or PMOS, and unit devices (Drennan & McAndrew §III)
> **Which matches better** depends on how it is biased. Voltage-biased: no consistent trend. Current-biased: PMOS's lower mobility forces a larger $V_{OV}$ at the same current, which improves current matching. Their Table II (2×2 µm, 0.4 µm BiCMOS): mirror at 10 µA, NMOS 1.22%, PMOS 1.09%; voltage-driven at $V_{GS}=1.7$ V, NMOS 0.589%, PMOS 1.09%. Device engineers (voltage bias) and designers (current bias) see opposite rankings, so compare in the application.
>
> **Multiple units.** $n$ parallel units: process variance ×$n$, squared sensitivity ÷$n^2$, so $\sigma$ falls by $\sqrt n$, the same as one $n$-times-wider device. In a mirror, most of the benefit comes from splitting the *output* device. Their Table III (2×2 µm units, 0.13 µm): ref/out units 1/1: 3.86%; 1/4: 1.52%; 4/1: 3.05%; 4/4: 1.41%.
>
> **Bias dependence.** Mismatch is not a constant if the reference current is not (e.g. an active load); it falls with rising $I_{ref}$ as $V_{OV}$ grows (their Fig. 9).

> [!note]- Extension: mirror sizing rules from $g_m/I_D$ (Jespers & Murmann §4.3.2)
> - **Fixed area:** smallest $g_m/I_D$ that headroom allows ($V_{D,sat}\approx2/(g_m/I_D)$).
> - **Fixed current:** in weak inversion, wider helps ($\propto1/\sqrt W$). In strong inversion $g_m/I_D\propto\sqrt{W/(LI_D)}$ cancels the $\sqrt W$ from area, leaving $\sigma\propto A_{VT}/(L\sqrt{I_D})$; with pocket implants even $L$ helps less.
> - **Source-strap IR drop** looks exactly like a $\Delta V_{TH}$ and is referred by the same $g_m/I_D$: another argument for strong inversion in mirrors.
>
> Full treatment in [[Current Mirrors#Level 6 Mismatch]]. (Zettelkasten 12s, 12s1–12s4.)

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↓ Signal swing $V_m$ | $HD_2\propto V_m$, $HD_3\propto V_m^2$ | SNR (noise floor fixed) |
| ↑ $V_{OV}$ (↓ $g_m/I_D$) | Linearity ($V_m/V_{OV}$), current matching | Offset voltage ($\frac{V_{OV}}2\frac{\Delta\beta}\beta$ term), noise, headroom, gain per amp |
| ↓ $V_{OV}$ (↑ $g_m/I_D$) | Offset voltage, gain, noise; weak inversion lowest offset drift | Linearity, current matching, $f_T$ |
| Differential instead of single-ended | Even harmonics cancel; 40× lower distortion at $V_m=0.2V_{OV}$ | 2× power, needs CMFB; mismatch restores $HD_2$ |
| Feedback (loop gain $T$) | Relative harmonic ÷$(1+T)^2$ at fixed input | Gain, stability, speed; vanishes at high frequency or when slewing |
| Source degeneration ($g_mR_S$) | $G_m\to1/R_S$, wider linear range | Gain, noise; headroom unless split tail; split tail adds noise and offset |
| ↑ Area $WL$ | $\sigma(\Delta V_{TH})\propto1/\sqrt{WL}$ | Capacitance (speed or power of the driver) |
| ↑ $L$ (mirror, fixed $I_D$) | Current matching (area and $V_{OV}$ both rise) | Area, capacitance, headroom; pocket implants weaken it |
| Offset cancellation | Offset to $V_{OS}/A_v$ or below; CDS also kills $1/f$ noise | Dedicated phase, refresh, charge-injection residue, caps in the path, aliased white noise |
| Auxiliary-amp cancellation | Storage caps out of the signal path | Extra $G_{m2}$; keep $G_{m2}\approx0.1G_{m1}$ for injection |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Polynomial model | $y = \alpha_1x+\alpha_2x^2+\alpha_3x^3+\cdots$ |
| End-point nonlinearity (cubic) | $\Delta y/y_{max}\approx\alpha_3x_{max}^2/(3\sqrt3\alpha_1)$ |
| Harmonic distortion | $HD_2 = \frac{\alpha_2}{2\alpha_1}A$, $HD_3 = \frac{\alpha_3}{4\alpha_1}A^2$ |
| THD | $\sum_{k\ge2}P_k/P_1$; $10\log(\cdot)$ in dB |
| Intermodulation | $IM_3 = \frac{3\alpha_3}{4\alpha_1}A^2 = 3HD_3$ |
| IP3 | $A_{IIP3} = \sqrt{\tfrac43|\alpha_1/\alpha_3|}$; $OIP3 = I_{D1}-ID_3/2$ (dB) |
| Second-order intercept | $A_{IIP2} = |\alpha_1/\alpha_2|$, $IM_2 = |\alpha_2/\alpha_1|A$ |
| 1-dB compression | $A_{1dB}=\sqrt{0.145|\alpha_1/\alpha_3|}$, $P_{1dB}\approx IIP3-9.6$ dB |
| CS stage | $HD_2 = V_m/(4V_{OV})$ |
| Differential pair | $HD_3 \approx V_m^2/(32V_{OV}^2)$; weak inv. $V_m^2/[48(nU_T)^2]$ |
| Feedback | $b/a = \frac{\alpha_2V_m}{2\alpha_1}\frac{1}{(1+\beta\alpha_1)^2}$ |
| Capacitor nonlinearity | $V_{out}\approx MV_{in0}+(1-M)\frac{M\alpha_1}{2}V_{in0}^2$ |
| Sampling switch | $THD\approx\frac{R_1^2+R_2^2}{4}C_1^2\omega_0^2$ |
| Degeneration | $G_m = g_m/(1+g_mR_S)$ |
| Square-law post-correction | $A_v = \sqrt{(W/L)_{1,2}/(W/L)_{3,4}}$ |
| Local-feedback transconductor | $V_{out} = 2R_DV_{in}/R_S$ |
| Pelgrom | $\sigma(\Delta V_{TH}) = A_{VT}/\sqrt{WL}$, $\sigma(\Delta\beta/\beta) = A_\beta/\sqrt{WL}$; $+S_P^2D^2$ |
| Pair offset | $V_{OS} = \frac{V_{OV}}{2}\left(\frac{\Delta R}{R}+\frac{\Delta(W/L)}{W/L}\right)-\Delta V_{TH}$ |
| Offset variance | $\sigma^2_{V_{OS}} = (V_{OV}/2)^2[(\Delta R/R)^2+(\Delta(W/L)/(W/L))^2]+\sigma^2_{\Delta V_{TH}}$ |
| Active-load referral | $V_{OS,in}^2 = V_{OS,N}^2+(g_{mP}/g_{mN})^2V_{OS,P}^2$ |
| Current mismatch | $\Delta I/I = \Delta\beta/\beta-(g_m/I_D)\Delta V_{TH}$ |
| Mirror variance | $\sigma^2(\Delta I/I) = (g_m/I_D)^2A_{VT}^2/WL+A_\beta^2/WL$ |
| Even-order from mismatch | $A_{HD2} = (\alpha_2-\beta_2)A^2/2$ |
| CMRR as offset | $\Delta V_{CM,in}/\Delta V_{OS,in}$ |
| Input offset storage | residual $V_{OS}/A_v$ |
| Auxiliary-amp storage | $V_{OS,tot}\approx V_{OS1}/(G_{m2}R)+V_{OS2}/(G_{m1}R)$; injection $\times G_{m2}/G_{m1}$ |
| CDS | suppresses $f\lesssim1/\Delta t$; change $\le2\pi f A\Delta t$ |
| Offset drift (weak inv.) | $dV_{OS}/dT = V_{OS,\Delta\beta}/T$ |
| Propagation of variance | $\sigma_e^2 = \sum_i(\partial e/\partial p_i)^2\sigma_{p_i}^2$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 14 Nonlinearity and Mismatch, pp. 576–606: §14.1.1–14.1.6 (metrics, Ex. 14.1, THD, differential vs CS, feedback, capacitor nonlinearity, sampling circuits, linearization incl. Ex. 14.2, 14.3); §14.2 (Pelgrom, Ex. 14.4), §14.2.1 (offset, Ex. 14.5, current mismatch, even-order distortion), §14.2.2 (offset cancellation), §14.2.3 (CDS), §14.2.4 (CMRR via offset). Problems 14.10, 14.15, 14.20.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §9.5.1–9.5.2, pp. 398–402: THD (Ex. 9.12), IM3 and IP3 (Ex. 9.13, 9.14). §9.5.3–9.5.4 (SFDR, SNDR) are left to [[RF Noise and Distortion]]. This edition's Ch. 9 has no separate "linearity of basic circuits" section; circuit-level distortion comes from Razavi.
- **Pelgrom & Duinmaijer, "Matching properties of MOS transistors," ESSCIRC '88**, pp. 327–329 (`ref/Layout/`): area and distance law Eq. (1), current-factor components Eq. (3), Table 1, rotation, oxide dependence, bandgap example.
- **Drennan & McAndrew, "Understanding MOSFET mismatch for analog design," IEEE JSSC 38(3), 2003**, pp. 450–456 (`ref/Layout/`): local variation laws (1)–(3), why $\sigma_{V_t}=A/\sqrt{LW}$ fails (5)–(6), propagation of variance (8), (10)–(11), mirror geometry/bias (Figs. 6–9), NMOS vs PMOS (Table II), multiple-unit devices (Table III).
- **Jespers & Murmann, *Systematic Design of Analog CMOS Circuits***: §4.2 (EKV distortion, pointers only), §4.3.1 (Pelgrom constants at 65 nm, pocket implants), §4.3.2 (mirror mismatch, Ex. 4.7), §4.3.3 (differential-pair offset Eq. 4.57, offset drift Eqs. 4.58–4.62, Ex. 4.8).
- **Zettelkasten extensions** (`AnalogTheory/Nonlinearity and Mismatch/`): 12o1, 12o2a, 12p2, 12p3 (EKV distortion pointers), 12r1 (pocket implants), 12s, 12s1–12s4 (mirror matching), 12t1, 12t1a (offset drift). Note 12p1's "2.5 dB in strong inversion" claim was not used (unverified in the note itself).
