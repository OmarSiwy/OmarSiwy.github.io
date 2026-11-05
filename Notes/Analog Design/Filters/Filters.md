---
title: Filters
description: From a filter spec (passband ripple, stopband attenuation, edges) to an approximation (Butterworth, Chebyshev, elliptic, Bessel), an LC ladder prototype or a biquad cascade, and finally integrated continuous-time filters (active-RC, MOSFET-C, Gm-C) with the tuning loops and integrator specs that make them accurate.
kind: topic
status: growing
aliases:
  - Filters
  - Analog Filters
  - Active Filters
  - Continuous-Time Filters
  - Filter Approximations
---

A filter is designed in three steps that never change: **specify** the mask, **approximate** it with a rational $T(s)$, **realize** $T(s)$ with a circuit. The note follows those steps, then opens the realization one level at a time: passive LC, op-amp RC, and the integrated continuous-time filters whose integrators are the amplifiers you actually size. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="A low-pass spec is a mask: stay above 1/sqrt(1+eps^2) up to w_p, below the A_min line past w_s. Butterworth (N=5) is flat then rolls off; Chebyshev (N=5, same ripple) ripples in the passband and falls much faster; the Butterworth of the same order misses the stopband corner. After Sedra Figs. 14.3, 14.13, 14.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!20] (0,0) rectangle (4,2.75);
  \fill[gray!20] (0,4.2) rectangle (4,3.3);
  \fill[gray!20] (5.6,0.75) rectangle (9.2,4.2);
  \draw[->] (0,0) -- (9.6,0) node[right] {$\omega/\omega_p$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$|T|$};
  \draw[dashed] (0,3.3) -- (9.2,3.3);
  \node[left] at (0,3.3) {$1$};
  \node[left] at (0,2.75) {$\frac{1}{\sqrt{1+\epsilon^2}}$};
  \node[left] at (0,0.75) {$10^{-A_{min}/20}$};
  \draw (4,0.08) -- (4,-0.08) node[below] {$1$};
  \draw (5.6,0.08) -- (5.6,-0.08) node[below] {$\omega_s/\omega_p$};
  \draw[very thick,blue,domain=0:2.3,samples=80] plot ({4*\x},{3.3/sqrt(1+0.2589*pow(\x,10))});
  \draw[very thick,red,domain=0:1.6,samples=160] plot ({4*\x},{3.3/sqrt(1+0.2589*pow(16*pow(\x,5)-20*pow(\x,3)+5*\x,2))});
  \node[blue,font=\scriptsize,anchor=west] at (6.2,2.0) {Butterworth: monotonic};
  \node[red,font=\scriptsize,anchor=west] at (6.2,1.6) {Chebyshev: equiripple, steeper};
  \node[font=\scriptsize] at (2,1.4) {passband};
  \node[font=\scriptsize] at (4.8,3.9) {transition};
  \node[font=\scriptsize] at (7.4,3.9) {stopband};
  \draw[<->] (2.2,3.3) -- (2.2,2.75) node[midway,right,font=\scriptsize] {$A_{max}$};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **A spec is four numbers:** $\omega_p$, $\omega_s$, $A_{max}$ (passband ripple), $A_{min}$ (stopband attenuation). Tighter numbers mean a higher order $N$, and $N$ = number of poles = number of integrators = number of amplifiers.
> 2. **The approximation is a trade between steepness and pole Q:** Butterworth is maximally flat with low $Q$; Chebyshev reaches the same mask with a lower $N$ but higher $Q$; elliptic is steepest (finite stopband zeros); Bessel keeps the phase linear and gives up steepness.
> 3. **Two ways to build any $T(s)$:** a **cascade** of biquads $(\omega_0, Q)$ plus one first-order section, or a doubly terminated **LC ladder prototype** (tabulated $g_k$), scaled and transformed to HP/BP/BS. The ladder is the less sensitive one.
> 4. **The biquad is two integrators in a loop:** loop gain sets $\omega_0$, the loss of one integrator sets $Q$, the feed-ins set the zeros.
> 5. **Integrated time constants are $C/G_m$ or $RC$: about ±30% untuned.** A master–slave tuning loop locks them to a reference to about 1%. (Switched-capacitor filters avoid this with capacitor ratios.)
> 6. **The integrator's amplifier sets the filter's accuracy:** $\boxed{\left|\tfrac{\Delta Q}{Q}\right|\approx 2Q\left(\tfrac{\omega_0}{\omega_t}+\tfrac{1}{A_0}\right)}$, so a high-$Q$ section needs $\omega_t\gg 2Q\omega_0$ and $A_0\gg 2Q$. Noise ($kT/C$) and the linearity of the V-to-I converter set the dynamic range.

**Map:** [[#Spec translation|filter specs → integrator / op-amp / OTA specs]] → [[#Level 0 Specification and the Transfer Function|mask, poles, zeros]] → [[#Level 1 Approximations|Butterworth, Chebyshev, elliptic, Bessel, order]] → [[#Level 2 Realization I The LC Ladder Prototype|LC ladder $g_k$, scaling, LP→HP/BP/BS]] → [[#Level 3 Realization II Biquads|biquad functions, LCR resonator, op-amp RC biquads]] → [[#Level 4 Integrated Continuous-Time Filters|active-RC, MOSFET-C, Gm-C, transconductors]] → [[#Level 5 Tuning|tuning loops]].

## Spec translation

A filter's specs live on its mask and its dynamic range; the amplifiers inside are what you size with $g_m/I_D$. Every integrated filter is a network of **integrators**, so the translation goes filter spec → integrator spec → amplifier spec. Derivations are in [[#Level 4 Integrated Continuous-Time Filters]].

**Block specs** (Sedra §14.1.3; Carusone Ch. 12 intro, §12.9): passband edge $f_p$ (or $f_0$) and its **accuracy**; pole $Q$ and its accuracy; passband ripple $A_{max}$ (0.05 to 3 dB typical); stopband attenuation $A_{min}$ (20 to 100 dB typical); **dynamic range** (noise floor to distortion ceiling: about 60 dB is typical for high-frequency continuous-time filters, above 90 dB for low-frequency SC filters); linearity (THD, IM3); **tuning** range and accuracy; power.

| Filter spec | Inside the filter | Amplifier / integrator spec it sets |
|---|---|---|
| Order $N$ (from $A_{min}$, $\omega_s/\omega_p$, $A_{max}$) | One integrator per pole | Number of op amps / OTAs: power $\propto N$ |
| $f_0$ accuracy | Integrator unity-gain frequency $\omega_{ti}=G_m/C$ or $1/RC$ | Set by the tuning loop, not the amplifier; amplifier input/output parasitics add to $C$ and must be small or matched to the master |
| $Q$ accuracy $\varepsilon_Q$ (and the ripple it causes) | Integrator phase error at $\omega_0$ | Unity-gain frequency $\omega_t$ (op-amp GBW, or the OTA's first parasitic pole) and DC gain $A_0$ (op amp's $A_0$, or $G_mR_{out}$ of an OTA) |
| Dynamic range, noise floor | Integrating capacitors, transconductor noise | $C$ size (from $kT/C$), then $G_m=\omega_0C$; input-referred noise of each integrator |
| Linearity (THD, IM3), max swing | V-to-I conversion: $R$, triode MOSFET, or transconductor | Active-RC: op-amp loop gain at signal frequency, output swing into a **resistive** load. Gm-C: linear input range of the transconductor |
| Tuning range | Control knob of $G_m$ (bias current, triode gate voltage) | Bias range over which $G_m$ stays linear |
| Fully differential operation | Common-mode drifts freely | CMFB on every integrator ([[Operational Amplifiers#Level 4 Fully Differential Op Amps and Common-Mode Feedback]]) |

$$
\boxed{\omega_t \ge \frac{2Q\,\omega_0}{\varepsilon_Q}}\qquad
\boxed{A_0 \ge \frac{2Q}{\varepsilon_Q}}\qquad
\boxed{G_m = \omega_0 C}\qquad
\boxed{C \ge \xi\,(1+H_0)\,\frac{kT\cdot\mathrm{SNR}}{V_{rms}^2}\ \ (\text{1st-order Gm-C})}
$$

Here $\omega_t$ is the integrator amplifier's unity-gain frequency, $A_0$ its DC gain, $\xi\ge1$ the transconductor's excess-noise factor, $H_0$ the section's DC gain and $V_{rms}$ the largest signal the linearity allows.

> [!note]- Derivation: Q error from integrator excess phase and finite gain
> Write a real integrator near $s=j\omega_0$ as $\dfrac{\omega_0}{s+a}$. Two sources make $a\ne0$:
> - **Finite DC gain** $A_0$: the integrator becomes lossy, $\dfrac{\omega_0}{s+\omega_0/A_0}$, so $a = +\omega_0/A_0$. (Active-RC: Carusone Eq. 12.153 has the low pole at $1/(A_0RC)=\omega_0/A_0$. Gm-C: $\dfrac{G_m}{sC+g_o}$ has $a=g_o/C=\omega_0/(G_mR_{out})$.)
> - **Finite bandwidth** $\omega_t$: an extra pole gives $\dfrac{\omega_0}{s(1+s/\omega_t)}=\dfrac{\omega_0}{s+s^2/\omega_t}$; at $s=j\omega_0$, $s^2/\omega_t=-\omega_0^2/\omega_t$, so $a\approx-\omega_0^2/\omega_t$: a **negative** loss (phase lag).
>
> In the two-integrator loop ([[#The Two-Integrator Loop]]) the denominator is $(s+\omega_0/Q+a_1)(s+a_2)+\omega_0^2\approx s^2+s\left(\tfrac{\omega_0}{Q}+a_1+a_2\right)+\omega_0^2$ (dropping products of small terms). So with two identical integrators
> $$\frac{1}{Q_{eff}} \approx \frac1Q + \frac{2}{A_0} - \frac{2\omega_0}{\omega_t},\qquad \frac{\Delta Q}{Q}\approx 2Q\left(\frac{\omega_0}{\omega_t}-\frac1{A_0}\right).$$
> Finite gain lowers $Q$; finite bandwidth raises it (**Q enhancement**). If $2Q\omega_0/\omega_t$ approaches $1$ the poles reach the $j\omega$ axis and the filter oscillates. Demanding each term below $\varepsilon_Q$ gives the two boxed bounds. This is why Sedra limits single-op-amp biquads to $Q\lesssim5$ and warns that two-integrator loops are "adversely affected by the finite bandwidth of the op amps" (§14.6.4), and why Carusone tunes $Q$ by trimming integrator phase to exactly 90° (§12.9.4).

> [!note]- Derivation: noise of a first-order Gm-C section is $kT/C$, not a function of $G_m$
> First-order low-pass: input transconductor $G_{m1}$, feedback transconductor $G_{m2}=\omega_0C$, capacitor $C$ ([[#Gm-C Integrators and Biquads]]). Model each transconductor's output noise as a current of PSD $4kT\xi G_{mi}$ ($\xi\ge1$ depends on the circuit; see [[Noise#MOSFET Channel Thermal Noise]]). Both currents drive the output node impedance $1/(G_{m2}+j\omega C)$:
> $$\overline{v_n^2}=\int_0^\infty\frac{4kT\xi(G_{m1}+G_{m2})}{G_{m2}^2+(2\pi fC)^2}\,df = 4kT\xi(G_{m1}+G_{m2})\cdot\frac{1}{4G_{m2}C}=\xi\left(1+H_0\right)\frac{kT}{C},$$
> with $H_0=G_{m1}/G_{m2}$. Raising $G_m$ raises the noise density and the bandwidth by the same factor, so only $C$ sets the noise. For a sine of rms value $V_{rms}$ and a target SNR this gives the boxed $C$. Then $G_m=\omega_0C$ fixes the transconductance, and the current follows from how the transconductor makes its $G_m$ (next table). This is the same argument as [[Noise#Dynamic Range and the Size of C]], applied per integrator.

| Amplifier spec | Lands on | Sizing knob |
|---|---|---|
| $A_0\ge2Q/\varepsilon_Q$ | $g_mr_o$ of the op amp / $G_mR_{out}$ of the OTA | $L$ (intrinsic gain), cascoding |
| $\omega_t\ge2Q\omega_0/\varepsilon_Q$ | Op-amp GBW, or OTA non-dominant pole | $f_T$ of the signal-path devices: short $L$, moderate $g_m/I_D$; then $I_D$ |
| $G_m=\omega_0C$, simple pair (active-transistor transconductor) | $g_m$ of the input pair | $I_D=G_m/(g_m/I_D)$ |
| $G_m=\omega_0C$, degenerated pair ($G_m\approx1/R_S$) | linear input range $\approx(I_1/2)R_S$ | $I_1\ge 2V_{in,max}G_m$: current set by **linearity**, not by $G_m$ |
| Noise below the $kT/C$ budget | Input-pair $g_m$ | High $g_m/I_D$ on the input devices |
| Swing / linearity of an undegenerated pair | Overdrive of the pair | Low $g_m/I_D$ (large $V_{OV}$), at the cost of current per $g_m$ |

> [!tip] Remark
> The spec names (DC gain, GBW, phase margin, swing) are those of [[Single-Stage#Amplifier Specifications]]. Turning $g_m$, $f_T$ and $g_mr_o$ targets into $W$, $L$, $I_D$ is [[gm-ID Design Methodology]]. The linearity of a transconductor (degeneration, triode degeneration, local feedback) is owned by [[Nonlinearity and Mismatch#Level 2 Linearization Techniques]]. For **switched-capacitor** filters the translation is different (settling and $kT/C$ per clock phase): see [[Switched-Capacitor Circuits#Spec translation]].

> [!example] Worked example 1: active-RC Tow-Thomas bandpass (Sedra Exercise D14.21 parameters)
> **Filter spec:** $f_0=10$ kHz, $Q=20$, unity centre-frequency gain, $R=10\ \mathrm{k\Omega}$.
> - **Circuit** ([[#Tow-Thomas Biquad]]): $C=1/(\omega_0R)=1/(2\pi\cdot10^4\cdot10^4)=1.59$ nF; $R_d=QR=200\ \mathrm{k\Omega}$; centre gain is $KQ$, so $K=1/Q$ and $R_g=R/K=200\ \mathrm{k\Omega}$.
> - **Amplifier spec** for $\varepsilon_Q=1\%$: $\omega_t\ge2\cdot20\,\omega_0/0.01=4000\,\omega_0$, i.e. op-amp GBW $\ge40$ MHz; $A_0\ge2\cdot20/0.01=4000$ (72 dB).
> - A 10 kHz filter needs a 40 MHz op amp: the price of $Q=20$. At $Q=1$ the same accuracy needs only 2 MHz and 46 dB.
>
> These amplifier numbers are computed here from the boxed bounds; Sedra gives the circuit only.

> [!example] Worked example 2: Gm-C bandpass at 20 MHz (Carusone Ex. 12.4, extended to sizing)
> **Filter spec:** $f_0=20$ MHz, $Q=5$, centre gain 1, $C_A=C_B=2$ pF.
> - **Transconductances** (Carusone): $G_{m1}=G_{m2}=\omega_0C=0.2513$ mA/V; $G_{m3}=G_{m5}=k_1C_B=50.27\ \mu$A/V; $C_X=G_{m4}=0$.
> - **Q accuracy 5%:** $A_0=G_mR_{out}\ge2\cdot5/0.05=200$ (46 dB), and the OTA's parasitic pole must sit above $2\cdot5\cdot20\text{ MHz}/0.05=4$ GHz. That is not reachable by design margin alone, which is exactly why Carusone adds **Q tuning** at these frequencies ([[#Q-Factor Tuning]]).
> - **Noise:** $kT/C$ at 300 K for 2 pF is $2.07\times10^{-9}\ \mathrm{V^2}$, i.e. $45\ \mu\mathrm{V_{rms}}$ per integrator node (before $\xi$ and gain factors).
> - **Sizing, simple pair:** choosing $g_m/I_D=10$ S/A (moderate inversion, a design choice) gives $I_D=0.2513\text{ mS}/10=25\ \mu$A per input device for $G_{m1}$.
> - **Sizing, degenerated pair** ($R_S=1/G_m\approx3.98\ \mathrm{k\Omega}$, Carusone Eq. 12.40) for a $\pm0.25$ V input: $I_1\ge2\cdot0.25\cdot0.2513\text{ mS}=126\ \mu$A per side. Linearity costs about 5× the current of the bare pair.
>
> The sizing bullets are computed here; Carusone stops at the $G_m$ values.

## Level 0: Specification and the Transfer Function

### The Mask

$$
\boxed{G(\omega)=20\log|T(j\omega)|,\qquad A(\omega)=-20\log|T(j\omega)|}
$$

- Four ideal types: **LP, HP, BP, BS** ("brick walls"). Real specs replace each wall with a **transition band** between $\omega_p$ and $\omega_s$; $\omega_s/\omega_p$ is the **selectivity factor**.
- $A_{max}$ bounds the passband deviation from 0 dB; $A_{min}$ is the minimum attenuation in the stopband, measured from the passband maximum.
- Example (Sedra Ex. 14.2): passband variation limited to 10% gives $A_{max}=-20\log0.9=0.915$ dB; stopband transmission below 1% gives $A_{min}=40$ dB.
- Phase is usually not specified: doing so complicates the design a lot ([[#Bessel (Linear Phase)]] is the exception).

### Poles and Zeros

$$
\boxed{T(s)=\frac{a_Ms^M+\cdots+a_0}{s^N+b_{N-1}s^{N-1}+\cdots+b_0}=\frac{a_M\prod(s-z_i)}{\prod(s-p_i)},\qquad M\le N}
$$

- **Order** $N$ = number of poles. Counting zeros at $s=\infty$ ($N-M$ of them) and at $s=0$, there are also exactly $N$ transmission zeros.
- **Poles** in the left half-plane, real or in conjugate pairs. Sharper filters put the poles **closer to the $j\omega$ axis**, near the passband edge (higher $Q$).
- **Zeros** sit in the stopband on the $j\omega$ axis: at $s=0$ (HP, BP), at $s=\infty$ (LP, BP), or at finite $\pm j\omega_l$, giving a factor $s^2+\omega_l^2$ (a notch: infinite attenuation at $\omega_l$).
- **All-pole** filters (Butterworth, Chebyshev, Bessel) have every zero at $\infty$: $T(s)=a_0/(\text{denominator})$.

> [!tip] Remark
> Every rational $T(s)$ with real coefficients factors into first- and second-order terms with real coefficients (Carusone Key Point, p. 470). So "design an $N$th-order filter" always reduces to "design $\lfloor N/2\rfloor$ biquads and, for odd $N$, one first-order section", if you are willing to cascade them ([[#Cascade vs Ladder]]).

## Level 1: Approximations

```tikz title="Pole positions for N=5. Butterworth (left, eps=1): poles on a circle, spaced pi/N, first one pi/2N from the j-axis. Chebyshev 1 dB (right, w_p=1): poles on an ellipse, the top pair almost on the axis (Q=5.56). Values computed from Sedra Eqs. 14.24-14.25 and 14.33."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=2.2cm,y=2.2cm]
  \begin{scope}
    \draw[->] (-1.3,0) -- (0.5,0) node[right] {$\sigma$};
    \draw[->] (0,-1.2) -- (0,1.3) node[above] {$j\omega$};
    \draw[dashed] (0,1) arc (90:270:1);
    \foreach \x/\y in {-0.309/0.951,-0.809/0.588,-1/0,-0.809/-0.588,-0.309/-0.951} {\node[font=\large] at (\x,\y) {$\times$};}
    \draw[thin] (0,0) -- (-0.309,0.951);
    \node[font=\scriptsize] at (-0.1,0.55) {$\frac{\pi}{2N}$};
    \node[font=\scriptsize,anchor=east] at (-0.38,1.02) {$Q_1=1.62$};
    \node[font=\scriptsize,anchor=east] at (-0.85,0.68) {$Q_2=0.62$};
    \node[font=\scriptsize] at (-0.4,-1.35) {Butterworth: circle, one $\omega_0$};
  \end{scope}
  \begin{scope}[xshift=5.2cm]
    \draw[->] (-0.8,0) -- (0.5,0) node[right] {$\sigma$};
    \draw[->] (0,-1.2) -- (0,1.3) node[above] {$j\omega$};
    \draw[dashed] (0,1.041) arc (90:270:0.2895 and 1.041);
    \foreach \x/\y in {-0.0895/0.990,-0.234/0.612,-0.2895/0,-0.234/-0.612,-0.0895/-0.990} {\node[font=\large] at (\x,\y) {$\times$};}
    \node[font=\scriptsize,anchor=west] at (0.02,0.99) {$Q_1=5.56,\ \omega_{01}=0.994\,\omega_p$};
    \node[font=\scriptsize,anchor=west] at (0.02,0.61) {$Q_2=1.40,\ \omega_{02}=0.655\,\omega_p$};
    \node[font=\scriptsize,anchor=west] at (0.02,0.12) {real pole $0.29\,\omega_p$};
    \node[font=\scriptsize] at (0.3,-1.35) {Chebyshev 1 dB: ellipse, higher $Q$};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Butterworth (Maximally Flat)

$$
\boxed{|T(j\omega)|=\frac{1}{\sqrt{1+\epsilon^2(\omega/\omega_p)^{2N}}},\qquad \epsilon=\sqrt{10^{A_{max}/10}-1}}
$$

$$
\boxed{A(\omega_s)=10\log\!\left[1+\epsilon^2\left(\frac{\omega_s}{\omega_p}\right)^{2N}\right]\ \Rightarrow\ N\ge\frac{\log\!\left[(10^{A_{min}/10}-1)/\epsilon^2\right]}{2\log(\omega_s/\omega_p)}}
$$

$$
\boxed{\omega_0=\omega_p\left(\frac1\epsilon\right)^{1/N}\ (\text{all poles}),\qquad Q_k=\frac{1}{2\sin\!\left(\frac{2k-1}{N}\frac\pi2\right)}}
$$

- Monotonic; the deviation is largest at the band edge only. The first $2N-1$ derivatives of $|T|$ vanish at $\omega=0$, hence "maximally flat".
- $\epsilon=1$ makes $A_{max}=3$ dB and $\omega_p$ the 3 dB frequency (the form RF tables use).
- Far past the edge it falls at $20N$ dB/decade.
- $T(s)=K\omega_0^N/\left[(s+\omega_0)^{N\,\mathrm{odd}}\prod_k(s^2+s\omega_0/Q_k+\omega_0^2)\right]$ (Sedra Eq. 14.26).

> [!example] Sedra Example 14.3 (numbers computed here)
> $f_p=10$ kHz, $A_{max}=1$ dB, $f_s=15$ kHz, $A_{min}=25$ dB. $\epsilon=0.5088$. $A(\omega_s)$ is 22.3 dB at $N=8$ and 25.8 dB at $N=9$, so $N=9$. All poles at $f_0=10\cdot(1/0.5088)^{1/9}=10.78$ kHz with $Q=2.88,\ 1.00,\ 0.65,\ 0.53$ plus one real pole.

### Chebyshev (Equiripple Passband)

$$
\boxed{|T(j\omega)|=\frac{1}{\sqrt{1+\epsilon^2\cos^2\!\left[N\cos^{-1}(\omega/\omega_p)\right]}}\ (\omega\le\omega_p),\qquad \frac{1}{\sqrt{1+\epsilon^2\cosh^2\!\left[N\cosh^{-1}(\omega/\omega_p)\right]}}\ (\omega\ge\omega_p)}
$$

$$
\boxed{A(\omega_s)=10\log\!\left[1+\epsilon^2\cosh^2\!\left(N\cosh^{-1}\frac{\omega_s}{\omega_p}\right)\right]\ \Rightarrow\ N\ge\frac{\cosh^{-1}\!\left(\sqrt{10^{A_{min}/10}-1}\,/\,\epsilon\right)}{\cosh^{-1}(\omega_s/\omega_p)}}
$$

- Ripples between $1$ and $1/\sqrt{1+\epsilon^2}$ across the passband; $N$ maxima plus minima in total. **Odd $N$**: $|T(0)|=1$. **Even $N$**: $|T(0)|=1/\sqrt{1+\epsilon^2}$ (a ripple valley at dc).
- Same $\epsilon$-to-$A_{max}$ relation as Butterworth. All zeros at $\infty$.
- Far past the edge it falls at $20N$ dB/decade too, but $2^{2N}/4$ times (in power) more than a Butterworth of the same order and ripple (Pozar §8.3).

> [!note]- Detail: Chebyshev poles and transfer function (Sedra Eqs. 14.33–14.34)
> $$p_k=-\omega_p\sin\!\left(\frac{2k-1}{N}\frac\pi2\right)\sinh\!\left(\frac1N\sinh^{-1}\frac1\epsilon\right)+j\omega_p\cos\!\left(\frac{2k-1}{N}\frac\pi2\right)\cosh\!\left(\frac1N\sinh^{-1}\frac1\epsilon\right),\quad k=1..N$$
> They lie on an ellipse with semi-axes $\omega_p\sinh(\cdot)$ (real) and $\omega_p\cosh(\cdot)$ (imaginary). Read $\omega_{0k}=|p_k|$ and $Q_k=|p_k|/(2|\mathrm{Re}\,p_k|)$ from each pair.
> $$T(s)=\frac{K\omega_p^N}{\epsilon\,2^{N-1}(s-p_1)(s-p_2)\cdots(s-p_N)}$$
> **Sedra Example 14.4** (same spec as 14.3; numbers computed here): $A(\omega_s)=21.6$ dB at $N=4$, $29.9$ dB at $N=5$, so $N=5$. Poles: pair at $0.994\,\omega_p$ with $Q=5.56$, pair at $0.655\,\omega_p$ with $Q=1.40$, real pole at $0.290\,\omega_p$. Four fewer orders than Butterworth, but the top $Q$ nearly doubles (2.88 → 5.56).

> [!example] Butterworth vs Chebyshev order (Sedra Exercise D14.15, computed here)
> $f_p=1$ kHz, $A_{max}=1$ dB, $f_s=1.5$ kHz, $A_{min}=50$ dB. Chebyshev: $N=8$ (55.0 dB, 5 dB to spare). Butterworth: $N=16$ (50.5 dB). Half the integrators, at the price of higher-$Q$ sections.

### Elliptic (Cauer)

- **Equiripple in both** passband and stopband (Sedra Fig. 14.3 is exactly this response; Pozar Fig. 8.22).
- Finite transmission zeros $\pm j\omega_{l}$ in the stopband pull the attenuation up right after $\omega_s$, so it meets a mask with the **lowest order** of the four. It only guarantees $A_{min}$, not monotonic attenuation.
- Costs: highest pole $Q$s, numerator terms (notch sections or ladder branches with resonators), and synthesis by program or tables (Sedra §14.1.4; Pozar refers it out).
- Sedra's example mask (Fig. 14.5): a fifth-order LP with zeros at $\pm j\omega_{l1}$, $\pm j\omega_{l2}$ and $\infty$: $T(s)=\dfrac{a_4(s^2+\omega_{l1}^2)(s^2+\omega_{l2}^2)}{s^5+\cdots}$.

### Inverse Chebyshev (Chebyshev II)

> [!warning] Unverified
> Not covered by the assigned sources (Sedra, Carusone, Pozar); stated from standard filter theory. Monotonic (maximally flat) passband, **equiripple stopband**, finite $j\omega$-axis zeros:
> $|T(j\omega)|^2=\dfrac{\epsilon^2T_N^2(\omega_s/\omega)}{1+\epsilon^2T_N^2(\omega_s/\omega)}$, where $T_N$ is the Chebyshev polynomial and $\epsilon$ here sets the **stopband** level. It needs the same order as Chebyshev I for the same mask; it is chosen when a flat passband and good group delay matter more than steepness.

### Bessel (Linear Phase)

$$
\boxed{\phi(\omega)=A\omega\left[1+p\left(\frac{\omega}{\omega_c}\right)^{2N}\right],\qquad \tau_d=\frac{d\phi}{d\omega}=A\left[1+p(2N+1)\left(\frac{\omega}{\omega_c}\right)^{2N}\right]}
$$

- The group delay is **maximally flat** (Pozar Eqs. 8.55–8.56): every frequency in the passband is delayed by the same time, so pulses keep their shape. Pozar Table 8.5 tabulates the prototype ([[#Prototype Tables]]).
- Sharp cutoff and flat delay are incompatible: Bessel has the slowest roll-off of the four, Chebyshev the worst delay (Pozar Ex. 8.3, Fig. 8.30). Used for pulse/data shaping and wherever overshoot matters (Carusone cites a fifth-order Bessel R-MOSFET-C filter, §12.8.4).

### Choosing an Approximation

| Response | Passband | Stopband | Order for a given mask | Pole $Q$ | Group delay |
|---|---|---|---|---|---|
| Butterworth | Maximally flat | Monotonic, $20N$ dB/dec | High | Low | Moderate |
| Chebyshev I | Equiripple $A_{max}$ | Monotonic, steeper | Lower | Higher | Worst (peaks at the edge) |
| Inverse Chebyshev | Flat | Equiripple, finite zeros | Same as Cheb. I | Moderate | Good |
| Elliptic | Equiripple | Equiripple, finite zeros | Lowest | Highest | Poor |
| Bessel | Rounded | Slow | Highest | Lowest | Maximally flat |

> [!tip] Remark
> Every row trades the same two currencies the rest of this note spends: **order** (number of integrators, power, noise) and **pole $Q$** (amplifier GBW and gain via $|\Delta Q/Q|\approx2Q\,\omega_0/\omega_t$, sensitivity, tuning). See [[#Spec translation]].

## Level 2: Realization I: The LC Ladder Prototype

A doubly terminated LC ladder realizes all-pole responses directly. Design it once at $R_0=1\ \Omega$, $\omega_c=1$ rad/s (the **low-pass prototype**), then scale and transform. [[Microwave Filters]] starts from here and replaces the lumped elements with transmission-line sections.

```tikz title="The two dual forms of the low-pass prototype. g_0 is the source resistance (a) or conductance (b); g_1..g_N alternate shunt C and series L; g_{N+1} is the load. Both give the same response. After Pozar Fig. 8.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,0) to[sV] (0,2) to[R,l={$R_0=g_0$}] (2.4,2) coordinate(a);
  \draw (a) to[C,l_={$C_1=g_1$}] (2.4,0);
  \draw (a) to[L,l={$L_2=g_2$}] (5,2) coordinate(b) to[C,l_={$C_3=g_3$}] (5,0);
  \draw (b) -- (5.8,2);
  \draw[dashed] (5.8,2) -- (6.6,2);
  \draw (6.6,2) -- (7.4,2) to[R,l_=$g_{N+1}$] (7.4,0);
  \draw (0,0) -- (7.4,0);
  \node at (3.7,-0.6) {(a) starts with a shunt $C$};
  \begin{scope}[yshift=-3.6cm]
  \draw (0,0) to[sV] (0,2) to[R,l={$G_0=g_0$}] (2.2,2) to[L,l={$L_1=g_1$}] (4,2) coordinate(c);
  \draw (c) to[C,l_={$C_2=g_2$}] (4,0);
  \draw (c) to[L,l={$L_3=g_3$}] (6,2) -- (6.6,2);
  \draw[dashed] (6.6,2) -- (7.0,2);
  \draw (7.0,2) -- (7.6,2) to[R,l_=$g_{N+1}$] (7.6,0);
  \draw (0,0) -- (7.6,0);
  \node at (3.8,-0.6) {(b) starts with a series $L$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{g_0=\text{source }R\text{ (a) or }G\text{ (b)},\quad g_k=\begin{cases}L_k&\text{series}\\C_k&\text{shunt}\end{cases},\quad g_{N+1}=\begin{cases}R_L&g_N\text{ shunt }C\\G_L&g_N\text{ series }L\end{cases}}
$$

- Order = number of reactive elements. RF filters specify the response as an **insertion loss** $P_{LR}=1/(1-|\Gamma|^2)$ (Pozar Eq. 8.49): Butterworth $P_{LR}=1+k^2(\omega/\omega_c)^{2N}$, Chebyshev $1+k^2T_N^2(\omega/\omega_c)$. With $k=\epsilon$ this is the same $|T|^2$ as Level 1.
- Butterworth: $\boxed{g_k=2\sin\dfrac{(2k-1)\pi}{2N}}$, $g_{N+1}=1$. Check: $N=5$ gives $0.618, 1.618, 2.000$ (Table 8.3).
- Even-order Chebyshev has $|T(0)|<1$, so $g_{N+1}\ne1$ (load mismatched); odd $N$ ends in $g_{N+1}=1$.

> [!tip] Remark
> Butterworth $g_k=2\sin\frac{(2k-1)\pi}{2N}$ and Sedra's pole $Q_k=1/\left[2\sin\frac{(2k-1)\pi}{2N}\right]$ are the same sine: $g_kQ_k=1$. The ladder element next to the edge of the ladder is small exactly where the corresponding pole pair is high-$Q$.

> [!note]- Derivation: the N = 2 prototype by hand (Pozar Eqs. 8.57–8.60)
> Series $L$, then shunt $C\parallel R$, source $1\ \Omega$, $\omega_c=1$. With $Z_{in}=j\omega L+\frac{R(1-j\omega RC)}{1+\omega^2R^2C^2}$ and $P_{LR}=\frac{|Z_{in}+1|^2}{2(Z_{in}+Z_{in}^*)}$:
> $$P_{LR}=1+\frac{1}{4R}\left[(1-R)^2+(R^2C^2+L^2-2LCR^2)\omega^2+L^2C^2R^2\omega^4\right]$$
> **Butterworth** wants $1+\omega^4$: dc term $\Rightarrow R=1$; $\omega^2$ term $\Rightarrow (C-L)^2=0$; $\omega^4$ term $\Rightarrow L^4/4=1$. So $L=C=\sqrt2$, matching $g_1=g_2=1.4142$.
> **Chebyshev** wants $1+k^2T_2^2(\omega)=1+k^2(4\omega^4-4\omega^2+1)$: the dc term gives $k^2=(1-R)^2/4R$, i.e. $R=1+2k^2\pm2k\sqrt{1+k^2}\ne1$: the even-order load mismatch above.

> [!note]- Why: the doubly terminated ladder is the least sensitive realization (not in the assigned sources)
> Orchard's argument: a lossless ladder between resistive terminations delivers the **maximum available power** to the load at every passband frequency where $|T|$ peaks. Whether any $L$ or $C$ goes up or down, the delivered power can only drop, so $\partial|T|/\partial x=0$ at those points, and stays small across the passband. A cascade of biquads has no such property: each section's error adds directly. This is why high-order SC and Gm-C filters often **simulate the ladder** with integrators (signal-flow-graph or leapfrog) instead of cascading biquads (Carusone §14.5: "lower-sensitivity techniques such as signal-flow-graph simulations ... of passive doubly terminated LC ladder filters").

### Prototype Tables

All from Pozar Tables 8.3–8.5 (after Matthaei, Young and Jones); $g_0=1$, $\omega_c=1$.

> [!note]- Table: Butterworth (maximally flat), $\omega_c$ = 3 dB point (Pozar Table 8.3)
> | N | g1 | g2 | g3 | g4 | g5 | g6 | g7 | g8 | g9 | g10 | g11 |
> |---|---|---|---|---|---|---|---|---|---|---|---|
> | 1 | 2.0000 | 1.0000 | | | | | | | | | |
> | 2 | 1.4142 | 1.4142 | 1.0000 | | | | | | | | |
> | 3 | 1.0000 | 2.0000 | 1.0000 | 1.0000 | | | | | | | |
> | 4 | 0.7654 | 1.8478 | 1.8478 | 0.7654 | 1.0000 | | | | | | |
> | 5 | 0.6180 | 1.6180 | 2.0000 | 1.6180 | 0.6180 | 1.0000 | | | | | |
> | 6 | 0.5176 | 1.4142 | 1.9318 | 1.9318 | 1.4142 | 0.5176 | 1.0000 | | | | |
> | 7 | 0.4450 | 1.2470 | 1.8019 | 2.0000 | 1.8019 | 1.2470 | 0.4450 | 1.0000 | | | |
> | 8 | 0.3902 | 1.1111 | 1.6629 | 1.9615 | 1.9615 | 1.6629 | 1.1111 | 0.3902 | 1.0000 | | |
> | 9 | 0.3473 | 1.0000 | 1.5321 | 1.8794 | 2.0000 | 1.8794 | 1.5321 | 1.0000 | 0.3473 | 1.0000 | |
> | 10 | 0.3129 | 0.9080 | 1.4142 | 1.7820 | 1.9754 | 1.9754 | 1.7820 | 1.4142 | 0.9080 | 0.3129 | 1.0000 |

> [!note]- Table: Chebyshev (equal ripple) 0.5 dB and 3.0 dB, $\omega_c$ = ripple edge (Pozar Table 8.4)
> **0.5 dB ripple**
> | N | g1 | g2 | g3 | g4 | g5 | g6 | g7 | g8 | g9 | g10 | g11 |
> |---|---|---|---|---|---|---|---|---|---|---|---|
> | 1 | 0.6986 | 1.0000 | | | | | | | | | |
> | 2 | 1.4029 | 0.7071 | 1.9841 | | | | | | | | |
> | 3 | 1.5963 | 1.0967 | 1.5963 | 1.0000 | | | | | | | |
> | 4 | 1.6703 | 1.1926 | 2.3661 | 0.8419 | 1.9841 | | | | | | |
> | 5 | 1.7058 | 1.2296 | 2.5408 | 1.2296 | 1.7058 | 1.0000 | | | | | |
> | 6 | 1.7254 | 1.2479 | 2.6064 | 1.3137 | 2.4758 | 0.8696 | 1.9841 | | | | |
> | 7 | 1.7372 | 1.2583 | 2.6381 | 1.3444 | 2.6381 | 1.2583 | 1.7372 | 1.0000 | | | |
> | 8 | 1.7451 | 1.2647 | 2.6564 | 1.3590 | 2.6964 | 1.3389 | 2.5093 | 0.8796 | 1.9841 | | |
> | 9 | 1.7504 | 1.2690 | 2.6678 | 1.3673 | 2.7239 | 1.3673 | 2.6678 | 1.2690 | 1.7504 | 1.0000 | |
> | 10 | 1.7543 | 1.2721 | 2.6754 | 1.3725 | 2.7392 | 1.3806 | 2.7231 | 1.3485 | 2.5239 | 0.8842 | 1.9841 |
>
> **3.0 dB ripple**
> | N | g1 | g2 | g3 | g4 | g5 | g6 | g7 | g8 | g9 | g10 | g11 |
> |---|---|---|---|---|---|---|---|---|---|---|---|
> | 1 | 1.9953 | 1.0000 | | | | | | | | | |
> | 2 | 3.1013 | 0.5339 | 5.8095 | | | | | | | | |
> | 3 | 3.3487 | 0.7117 | 3.3487 | 1.0000 | | | | | | | |
> | 4 | 3.4389 | 0.7483 | 4.3471 | 0.5920 | 5.8095 | | | | | | |
> | 5 | 3.4817 | 0.7618 | 4.5381 | 0.7618 | 3.4817 | 1.0000 | | | | | |
> | 6 | 3.5045 | 0.7685 | 4.6061 | 0.7929 | 4.4641 | 0.6033 | 5.8095 | | | | |
> | 7 | 3.5182 | 0.7723 | 4.6386 | 0.8039 | 4.6386 | 0.7723 | 3.5182 | 1.0000 | | | |
> | 8 | 3.5277 | 0.7745 | 4.6575 | 0.8089 | 4.6990 | 0.8018 | 4.4990 | 0.6073 | 5.8095 | | |
> | 9 | 3.5340 | 0.7760 | 4.6692 | 0.8118 | 4.7272 | 0.8118 | 4.6692 | 0.7760 | 3.5340 | 1.0000 | |
> | 10 | 3.5384 | 0.7771 | 4.6768 | 0.8136 | 4.7425 | 0.8164 | 4.7260 | 0.8051 | 4.5142 | 0.6091 | 5.8095 |

> [!note]- Table: Bessel / maximally flat time delay, group delay = 1 s (Pozar Table 8.5)
> | N | g1 | g2 | g3 | g4 | g5 | g6 | g7 | g8 | g9 | g10 | g11 |
> |---|---|---|---|---|---|---|---|---|---|---|---|
> | 1 | 2.0000 | 1.0000 | | | | | | | | | |
> | 2 | 1.5774 | 0.4226 | 1.0000 | | | | | | | | |
> | 3 | 1.2550 | 0.5528 | 0.1922 | 1.0000 | | | | | | | |
> | 4 | 1.0598 | 0.5116 | 0.3181 | 0.1104 | 1.0000 | | | | | | |
> | 5 | 0.9303 | 0.4577 | 0.3312 | 0.2090 | 0.0718 | 1.0000 | | | | | |
> | 6 | 0.8377 | 0.4116 | 0.3158 | 0.2364 | 0.1480 | 0.0505 | 1.0000 | | | | |
> | 7 | 0.7677 | 0.3744 | 0.2944 | 0.2378 | 0.1778 | 0.1104 | 0.0375 | 1.0000 | | | |
> | 8 | 0.7125 | 0.3446 | 0.2735 | 0.2297 | 0.1867 | 0.1387 | 0.0855 | 0.0289 | 1.0000 | | |
> | 9 | 0.6678 | 0.3203 | 0.2547 | 0.2184 | 0.1859 | 0.1506 | 0.1111 | 0.0682 | 0.0230 | 1.0000 | |
> | 10 | 0.6305 | 0.3002 | 0.2384 | 0.2066 | 0.1808 | 0.1539 | 0.1240 | 0.0911 | 0.0557 | 0.0187 | 1.0000 |

**Order from the tables:** Pozar Figs. 8.26–8.27 plot attenuation versus $|\omega/\omega_c|-1$ for each $N$; the formulas of [[#Level 1 Approximations]] give the same answer. Above $N=10$, cascade two lower-order designs.

### Impedance and Frequency Scaling

$$
\boxed{L_k'=\frac{R_0L_k}{\omega_c},\qquad C_k'=\frac{C_k}{R_0\,\omega_c},\qquad R_s'=R_0,\quad R_L'=R_0R_L}
$$

Impedance scaling multiplies every impedance by $R_0$ ($L\times R_0$, $C\div R_0$); frequency scaling substitutes $\omega\leftarrow\omega/\omega_c$ (Pozar Eqs. 8.64–8.67).

### LP → HP, BP, BS

```tikz title="Element-by-element transformations of the prototype (impedance scaling R_0 applied afterwards). Delta = (w2 - w1)/w0 is the fractional bandwidth, w0 = sqrt(w1 w2). After Pozar Table 8.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[font=\bfseries] at (0,4.3) {Low-pass};
  \node[font=\bfseries] at (3.2,4.3) {High-pass};
  \node[font=\bfseries] at (6.8,4.3) {Bandpass};
  \node[font=\bfseries] at (10.8,4.3) {Bandstop};
  % series L row
  \draw (-0.8,3) to[L,l=$L$] (0.8,3);
  \draw (2.4,3) to[C,l=$\frac{1}{\omega_cL}$] (4.0,3);
  \draw (5.2,3) to[L,l=$\frac{L}{\omega_0\Delta}$] (6.8,3) to[C,l=$\frac{\Delta}{\omega_0L}$] (8.4,3);
  \draw (9.6,3) -- (10,3); \draw (10,3) -- (10,3.5) to[L,l=$\frac{L\Delta}{\omega_0}$] (11.6,3.5) -- (11.6,3);
  \draw (10,3) -- (10,2.5) to[C,l_=$\frac{1}{\omega_0L\Delta}$] (11.6,2.5) -- (11.6,3) -- (12,3);
  % shunt C row
  \draw (0,1.2) to[C,l=$C$] (0,-0.4) node[ground]{};
  \draw (3.2,1.2) to[L,l=$\frac{1}{\omega_cC}$] (3.2,-0.4) node[ground]{};
  \draw (6.8,1.2) -- (6.3,1.2) to[L,l_=$\frac{\Delta}{\omega_0C}$] (6.3,-0.4) -- (6.8,-0.4);
  \draw (6.8,1.2) -- (7.3,1.2) to[C,l=$\frac{C}{\omega_0\Delta}$] (7.3,-0.4) -- (6.8,-0.4) node[ground]{};
  \draw (10.8,1.1) to[L,l=$\frac{1}{\omega_0C\Delta}$] (10.8,0.1) to[C,l=$\frac{C\Delta}{\omega_0}$] (10.8,-0.9) node[ground]{};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{HP: }\omega\leftarrow-\frac{\omega_c}{\omega}\qquad \text{BP: }\omega\leftarrow\frac{1}{\Delta}\left(\frac{\omega}{\omega_0}-\frac{\omega_0}{\omega}\right)\qquad \text{BS: }\omega\leftarrow-\Delta\left(\frac{\omega}{\omega_0}-\frac{\omega_0}{\omega}\right)^{-1}}
$$

$$
\boxed{\Delta=\frac{\omega_2-\omega_1}{\omega_0},\qquad \omega_0=\sqrt{\omega_1\omega_2}}
$$

- **HP:** maps $0\leftrightarrow\infty$; series $L\to$ series $C=1/(\omega_cL)$, shunt $C\to$ shunt $L=1/(\omega_cC)$. The minus sign keeps the elements realizable.
- **BP:** maps $\omega_0\to0$ and $\omega_1,\omega_2\to\mp1$. Series $L$ becomes a **series resonator**, shunt $C$ a **parallel resonator**, both tuned to $\omega_0$.
- **BS:** the inverse: series $L\to$ parallel $LC$, shunt $C\to$ series $LC$.
- **Order of a BP from a BP spec:** map each stopband edge through the BP substitution to get the equivalent LP $\omega_s/\omega_p$, then use Level 1. A BP of prototype order $N$ has $2N$ poles.

> [!tip] Remark
> These resonators are the series and parallel RLC of [[Microwave Resonators#Level 0 Series and Parallel RLC]]: a series resonator is a short at $\omega_0$, a parallel one an open, so the BP ladder passes $\omega_0$ and rejects elsewhere. Their $Q$ and loss are owned there; the realization with lines and couplers is [[Microwave Filters]].

> [!example] Pozar Examples 8.3 and 8.4
> **LP, maximally flat, 2 GHz, 50 Ω, ≥15 dB at 3 GHz:** $|\omega/\omega_c|-1=0.5$ gives $N=5$ from Fig. 8.26; $g=0.618, 1.618, 2.000, 1.618, 0.618$; scaled: $C_1=C_5=0.984$ pF, $L_2=L_4=6.438$ nH, $C_3=3.183$ pF (shunt-first form).
> **BP, 0.5 dB Chebyshev, $N=3$, 1 GHz, 10% bandwidth, 50 Ω** (series-first form, $g=1.5963, 1.0967, 1.5963, 1.000$): series arms $L_1=L_3=127.0$ nH with $C_1=C_3=0.199$ pF; shunt arm $L_2=0.726$ nH with $C_2=34.91$ pF. Note the 175:1 spread of inductance: narrow bandwidth makes series resonators huge and shunt resonators tiny, which is what distributed realizations fix.

### Cascade vs Ladder

| | Biquad cascade | LC ladder (or its integrator simulation) |
|---|---|---|
| Design | Factor $T(s)$, one section per pole pair | Tables of $g_k$ |
| Tuning / debugging | Each section independent | Elements interact |
| Sensitivity | Errors of each section add; high-$Q$ sections dominate | Near zero in the passband (Orchard) |
| Typical use | Discrete active filters, low order | Passive RF filters; high-order SC and Gm-C (leapfrog / SFG) |
| Ordering | Pair zeros with nearest poles; order sections for swing and noise | Fixed by the ladder |

## Level 3: Realization II: Biquads

### The Biquad Functions

$$
\boxed{T(s)=\frac{a_2s^2+a_1s+a_0}{s^2+s\dfrac{\omega_0}{Q}+\omega_0^2},\qquad p_{1,2}=-\frac{\omega_0}{2Q}\pm j\omega_0\sqrt{1-\frac{1}{4Q^2}}}
$$

| Type | Numerator | Key result (Sedra §14.2.7) |
|---|---|---|
| Low-pass | $a_0$ | Peaks only if $Q>1/\sqrt2$: $\lvert T\rvert_{max}=\dfrac{\lvert a_0\rvert Q}{\omega_0^2\sqrt{1-1/4Q^2}}$ at $\omega_{max}=\omega_0\sqrt{1-1/2Q^2}$. $Q=1/\sqrt2$ is 2nd-order Butterworth |
| Bandpass | $a_1s$ | Peak at $\omega_0$, gain $a_1Q/\omega_0$; $\boxed{\text{BW}=\omega_2-\omega_1=\omega_0/Q}$, $\omega_1\omega_2=\omega_0^2$ |
| High-pass | $a_2s^2$ | Mirror of LP |
| Notch | $a_2(s^2+\omega_n^2)$ | Zero transmission at $\omega_n$; LPN if $\omega_n>\omega_0$, HPN if $\omega_n<\omega_0$ |
| All-pass | $a_2\left(s^2-s\frac{\omega_0}{Q}+\omega_0^2\right)$ | Flat magnitude; shapes phase (delay equalizers) |

> [!tip] Remark
> $\omega_0$ is the radial distance of the poles, $\omega_0/2Q$ their distance from the $j\omega$ axis: [[Frequency Response#Second Order and $Q$]] owns the pole/step-response side of this. The numerator only places zeros; the **poles are set by the loop**, which is why every realization below is "a resonator, excited somewhere".

### First-Order Sections

$$
\boxed{T(s)=\frac{a_1s+a_0}{s+\omega_0}}
$$

Pole at $-\omega_0$, zero at $-a_0/a_1$, high-frequency gain $a_1$. The op-amp RC version (inverting amplifier with $C\parallel R_2$) sets the gain and the pole independently and has a low output impedance, so it cascades (Sedra Ex. 14.2: $\omega_0=10^5$ rad/s, dc gain 10, $C=1$ nF gives $R_2=10\ \mathrm{k\Omega}$, $R_1=1\ \mathrm{k\Omega}$).

### The LCR Resonator

```tikz title="The parallel LCR resonator and three ways to excite it: lift a grounded node (x, y or z) to V_i and the poles stay put; only the zeros move. After Sedra Figs. 14.18 and 14.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \begin{scope}
    \draw (0,0) to[R,l=$R$] (0,2) -- (2.4,2);
    \draw (1.2,0) to[C,l=$C$] (1.2,2);
    \draw (2.4,0) to[L,l_=$L$] (2.4,2);
    \node[below] at (0,0) {$z$}; \node[below] at (1.2,0) {$y$}; \node[below] at (2.4,0) {$x$};
    \foreach \x in {0,1.2,2.4} {\draw (\x,0) node[ocirc]{};}
    \node at (1.2,-1.0) {resonator};
  \end{scope}
  \begin{scope}[xshift=4.4cm]
    \draw (0,0) to[sV,l=$V_i$] (0,2) to[L,l=$L$] (1.8,2) -- (2.8,2) node[right]{$V_o$};
    \draw (1.4,2) to[R,l_=$R$] (1.4,0); \draw (2.4,2) to[C,l=$C$] (2.4,0);
    \draw (0,0) -- (2.4,0);
    \node at (1.2,-1.0) {LP: $x\to V_i$};
  \end{scope}
  \begin{scope}[xshift=9cm]
    \draw (0,0) to[sV,l=$V_i$] (0,2) to[R,l=$R$] (1.8,2) -- (2.8,2) node[right]{$V_o$};
    \draw (1.4,2) to[C,l_=$C$] (1.4,0); \draw (2.4,2) to[L,l=$L$] (2.4,0);
    \draw (0,0) -- (2.4,0);
    \node at (1.2,-1.0) {BP: $z\to V_i$};
  \end{scope}
  \begin{scope}[xshift=13.6cm]
    \draw (0,0) to[sV,l=$V_i$] (0,2) -- (0.3,2) -- (0.3,2.5) to[L,l=$L$] (1.9,2.5) -- (1.9,2);
    \draw (0.3,2) -- (0.3,1.5) to[C,l_=$C$] (1.9,1.5) -- (1.9,2) -- (2.8,2) node[right]{$V_o$};
    \draw (2.4,2) to[R,l=$R$] (2.4,0) -- (0,0);
    \node at (1.2,-1.0) {notch at $\omega_0$: $x,y\to V_i$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_0=\frac{1}{\sqrt{LC}},\qquad Q=\omega_0CR}
$$

- Poles are found by exciting the resonator without changing its **natural structure**: a current source in parallel (open when zeroed) or a voltage source in place of a ground (short when zeroed) (Sedra §14.4.1).
- Lifting node $x$, $y$ or $z$ to $V_i$ makes the circuit a divider $Z_2/(Z_1+Z_2)$. Transmission zeros are where $Z_2=0$ or $Z_1=\infty$ (not both).
  - **LP** ($x$): $T=\dfrac{1/LC}{s^2+s/CR+1/LC}$. **BP** ($z$): $T=\dfrac{s/CR}{s^2+s/CR+1/LC}$, unity gain at $\omega_0$. **Notch** ($x$ and $y$): zeros at $\pm j\omega_0$, $a_2=1$.
  - **General notch:** split $L=L_1\parallel L_2$ and $C=C_1+C_2$, lift $L_1,C_1$ to $V_i$; $L_1C_1=1/\omega_n^2$ places the zeros anywhere (dc gain $L_2/(L_1+L_2)$, HF gain $C_1/(C_1+C_2)$).
- Three equations ($\omega_0$, $Q$) in three unknowns ($L$, $C$, $R$): the spare one sets the impedance level.

> [!tip] Remark
> Same tank as [[Microwave Resonators#Parallel RLC]], where $Q_0=\omega_0RC$ is its unloaded $Q$. Here the "loss" $R$ is not parasitic: it is the element that **sets** the filter's pole $Q$.

### Inductance Simulation (Antoniou GIC)

$$
\boxed{Z_{in}=\frac{sC_4R_1R_3R_5}{R_2}\ \Rightarrow\ L=\frac{C_4R_1R_3R_5}{R_2}\ \ (=CR^2\text{ with equal values})}
$$

Two op amps, four resistors and a capacitor present a grounded inductor; it is the variant most tolerant of finite op-amp gain and bandwidth (Sedra §14.5.1). Replacing $L$ in the LCR resonator gives the **op amp–RC resonator**: $\omega_0=1/\sqrt{C_4C_6R_1R_3R_5/R_2}$, $Q=\omega_0C_6R_6$; with $C_4=C_6=C$, $R_{1,2,3,5}=R$: $\omega_0=1/CR$, $R_6=QR$. Every LCR filter of the previous section carries over node for node, with a buffer $K=1+r_2/r_1$ at the output (Sedra Figs. 14.21–14.22).

> [!note]- Detail: why the GIC is an inductor (Sedra Fig. 14.20(b))
> With ideal op amps both inputs of each amplifier sit at the same voltage, so nodes 1, 3 and 5 are all at $V_1$. Then: current in $R_5$ is $V_1/R_5$, it flows through $C_4$, so the node between $R_3$ and $C_4$ sits at $V_1(1+1/sC_4R_5)$; the current in $R_3$ is $-V_1/(sC_4R_5R_3)$, the same current flows in $R_2$, which puts node 2 at $V_1-V_1R_2/(sC_4R_5R_3)$; the current in $R_1$ is then $I_1=V_1R_2/(sC_4R_1R_3R_5)$. Hence $Z_{in}=sC_4R_1R_3R_5/R_2$.

### The Two-Integrator Loop

```tikz title="Two-integrator-loop biquad. Rearranging T_HP to V_hp = K V_i - (1/Q)(w0/s)V_hp - (w0^2/s^2)V_hp gives the summer; the integrator outputs are BP and LP. After Sedra Fig. 14.23(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,minimum width=1.3cm,minimum height=0.9cm}]
  \node (vi) at (0,0) {$V_i$};
  \node[draw,circle,inner sep=2pt] (S) at (1.8,0) {$\Sigma$};
  \node[blk] (I1) at (4.4,0) {$-\dfrac{\omega_0}{s}$};
  \node[blk] (I2) at (7.6,0) {$-\dfrac{\omega_0}{s}$};
  \draw[->] (vi) -- node[above,font=\scriptsize]{$K$} (S);
  \draw[->] (S) -- (I1);
  \draw[->] (I1) -- (I2);
  \draw[->] (I2) -- (10,0) node[right] {$V_{lp}$};
  \draw[->] (9.2,0) -- (9.2,1.9) -- node[above,font=\scriptsize]{$-1$} (1.8,1.9) -- (S);
  \draw[->] (6,0) -- (6,1.1) -- node[above,font=\scriptsize]{$1/Q$} (2.2,1.1) -- (S.north east);
  \draw (6,0) node[circ]{} -- (6,-1) node[below] {$V_{bp}$};
  \draw (3,0) node[circ]{} -- (3,-1) node[below] {$V_{hp}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{T_{hp}=\frac{Ks^2}{D(s)},\quad T_{bp}=-\frac{K\omega_0s}{D(s)},\quad T_{lp}=\frac{K\omega_0^2}{D(s)},\qquad D(s)=s^2+s\frac{\omega_0}{Q}+\omega_0^2}
$$

- Cross-multiply $T_{hp}$, divide by $s^2$, and every term becomes an integration: two integrators of unity-gain frequency $\omega_0$ in a loop, damped by the $1/Q$ path. LP, BP and HP appear **simultaneously** ("universal active filter"). BP centre gain is $-KQ$, LP dc gain is $K$.
- Carusone's form (Fig. 12.2): poles independent of the feed-ins $k_0, k_1, k_2$; one integrator must be lossy (negative feedback $\omega_0/Q$ around it) for stability; feed-in gains place the zeros. **One integrator per pole.**

> [!important] The biquad in one line
> Loop gain sets $\omega_0$, integrator loss sets $Q$, feed-ins set the zeros. Every integrated biquad (active-RC, MOSFET-C, Gm-C, switched-capacitor) is this block diagram with a different integrator.

**KHN biquad** (Kerwin–Huelsman–Newcomb, Sedra §14.6.2): a summing op amp plus two Miller integrators ($CR=1/\omega_0$). Design: $R_f=R_1$, $\boxed{R_3/R_2=2Q-1}$, which fixes $\boxed{K=2-1/Q}$. A fourth op amp summing $V_{hp}$, $V_{bp}$, $V_{lp}$ gives notches and arbitrary zeros.

### Tow-Thomas Biquad

```tikz title="Tow-Thomas biquad: a damped integrator (R_d = QR across C), an ideal integrator, and an inverter close the loop; all op amps have grounded + inputs. The HP output is lost. After Sedra Fig. 14.25(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (2.5,0) node[op amp](A1){};
  \draw (6.8,0) node[op amp](A2){};
  \draw (11.1,0) node[op amp](A3){};
  \foreach \a in {A1,A2,A3} { \draw (\a.+) -- ++(-0.3,0) node[ground]{}; }
  \draw (A1.-) -- ++(-0.4,0) coordinate(n1);
  \draw (n1) to[R,l_={$R_g=R/K$},-o] ++(-2.2,0) node[left]{$V_i$};
  \draw (n1) -- (n1 |- 0,1.3) coordinate(t1) to[C,l=$C$] (t1 -| A1.out) -- (A1.out);
  \draw (t1) -- (n1 |- 0,2.4) coordinate(t2) to[R,l={$R_d=QR$}] (t2 -| A1.out) -- (t1 -| A1.out);
  \draw (A1.out) -- ++(0.3,0) |- ([xshift=-1.8cm]A2.-) to[R,l=$R$] (A2.-);
  \draw (A2.-) -- ++(-0.2,0) coordinate(n2);
  \draw (n2) -- (n2 |- 0,1.3) coordinate(t3) to[C,l=$C$] (t3 -| A2.out) -- (A2.out);
  \draw (A2.out) -- ++(0.3,0) |- ([xshift=-1.8cm]A3.-) to[R,l=$r$] (A3.-);
  \draw (A3.-) -- ++(-0.2,0) coordinate(n3);
  \draw (n3) -- (n3 |- 0,1.3) coordinate(t4) to[R,l=$r$] (t4 -| A3.out) -- (A3.out);
  \draw (A3.out) -- ++(0.4,0) coordinate(o3) node[right]{$-V_{lp}$};
  \draw (o3) -- (o3 |- 0,3.4) to[R,l_=$R$] (n1 |- 0,3.4) -- (t2);
  \draw (A1.out) node[circ]{} -- ++(0,-1.3) node[below]{$V_{bp}$};
  \draw (A2.out) node[circ]{} -- ++(0,-1.3) node[below]{$V_{lp}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_0=\frac{1}{CR},\qquad R_d=QR,\qquad R_g=\frac RK,\qquad T_{bp}=-\frac{K\omega_0s}{D(s)},\quad T_{lp}=\frac{K\omega_0^2}{D(s)}}
$$

- An inverter in the loop makes all summing weights positive, so the summation moves into the virtual ground of the first integrator: weights $1$, $1/Q$, $K$ become $R$, $QR$, $R/K$. Price: no HP output.
- **Feedforward** of $V_i$ into all three virtual grounds ($C_1$, $R_1$, $R_2$, $R_3$; Sedra Fig. 14.26) realizes any biquad:
$$\frac{V_o}{V_i}=-\frac{s^2\frac{C_1}{C}+s\frac1C\left(\frac{1}{R_1}-\frac{r}{RR_3}\right)+\frac{1}{C^2RR_2}}{s^2+\frac{s}{QCR}+\frac{1}{C^2R^2}}$$
  e.g. a notch with $R_1=R_3=\infty$: zeros at $\omega_n^2=1/(CC_1RR_2)$, set by $C_1$ and $R_2$ without touching the poles.

> [!tip] Remark
> Replace each resistor of the Tow-Thomas with a switched capacitor ($R=1/Cf_c$) and you have the SC biquad ([[Switched-Capacitor Circuits#Biquads]]): $Q$ there is set by a capacitor ratio, and the "exactly one delay around the loop" rule is the discrete-time version of the $90°$-per-integrator condition behind [[#Spec translation|$\Delta Q/Q\approx2Q\,\omega_0/\omega_t$]].

### Single-Op-Amp Biquads (Sallen-Key and Multiple Feedback)

```tikz title="Single-amplifier biquads. Left: unity-gain Sallen-Key low-pass (C4 feeds back from the follower output, C3 grounds the + input). Right: multiple-feedback bandpass. After Sedra Figs. 14.29 and 14.27(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \begin{scope}
    \draw (4.6,0.3) node[op amp,noinv input up](A){};
    \draw (A.out) -- ++(0.5,0) coordinate(o) node[right]{$V_o$};
    \draw (A.-) -- ++(0,-0.9) -| (o);
    \draw (A.+) -- ++(-1.0,0) coordinate(p);
    \draw (p) to[C,l_=$C_3$] (p |- 0,-2) node[ground]{};
    \draw (p) to[R,l_=$R_2$] ++(-1.8,0) coordinate(m);
    \draw (m) to[R,l_=$R_1$,-o] ++(-2,0) node[left]{$V_i$};
    \draw (m) -- (m |- 0,2.3) to[C,l=$C_4$] (o |- 0,2.3) -- (o);
    \node at (2.5,-2.9) {Sallen-Key LP: $K=1$};
  \end{scope}
  \begin{scope}[xshift=9cm]
    \draw (4.4,0) node[op amp](B){};
    \draw (B.+) -- ++(-0.3,0) node[ground]{};
    \draw (B.out) -- ++(0.5,0) coordinate(o2) node[right]{$V_o$};
    \draw (B.-) -- ++(-0.6,0) coordinate(ni);
    \draw (ni) -- (ni |- 0,2.6) to[R,l=$R_3$] (o2 |- 0,2.6) -- (o2);
    \draw (ni |- 0,1.4) to[C,l_=$C_2$] ++(-1.8,0) coordinate(X);
    \draw (X) to[R,l_=$R_4$,-o] ++(-1.6,0) node[left]{$V_i$};
    \draw (X) -- (X |- 0,3.6) to[C,l=$C_1$] (o2 |- 0,3.6) -- (o2 |- 0,2.6);
    \draw (X) node[circ]{} node[below]{$X$};
    \node at (2.6,-1.6) {MFB bandpass};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Sallen-Key LP: }\omega_0=\frac{1}{\sqrt{C_3C_4R_1R_2}},\ \ \text{dc gain }1;\ \ \text{design: }R_1=R_2=R,\ C_4=C,\ C_3=\frac{C}{4Q^2},\ CR=\frac{2Q}{\omega_0}}
$$

$$
\boxed{\text{MFB BP: }\omega_0=\frac{1}{\sqrt{C_1C_2R_3R_4}},\ \ \text{design: }C_1=C_2=C,\ R_3=R,\ R_4=\frac{R}{4Q^2},\ CR=\frac{2Q}{\omega_0},\ \ K=-2Q^2}
$$

- An RC network alone has real poles ($Q<0.5$). Put it in the feedback of an op amp and complex poles appear: one op amp per biquad, the most power-efficient option.
- Limits: **$Q\lesssim5$** (they depend more on the op amp's finite gain and bandwidth than the multi-amp circuits), and **component spread $4Q^2$** ($C_4/C_3$ or $R_3/R_4$). $Q=5$ already means a 100:1 spread.
- The Sallen-Key's amplifier is only a unity-gain follower, so a source follower can replace it (Sedra notes this for the HP version).
- HP version (Fig. 14.28): swap $R\leftrightarrow C$ positions around a follower; same denominator, $K=1$ (the **complementary transformation**).

> [!note]- Detail: Q of the single-amplifier circuits written out (Sedra Eqs. 14.78, 14.96)
> MFB bandpass: $Q=\dfrac{1}{\sqrt{C_1C_2R_3R_4}}\Big/\left[\dfrac{1}{R_3}\left(\dfrac1{C_1}+\dfrac1{C_2}\right)\right]$, centre gain $K=-\dfrac{R_3}{R_4}\Big/\left(1+\dfrac{C_1}{C_2}\right)$.
> Sallen-Key low-pass: $Q=\dfrac{1}{\sqrt{C_3C_4R_1R_2}}\Big/\left[\dfrac{1}{C_4}\left(\dfrac1{R_1}+\dfrac1{R_2}\right)\right]$, dc gain 1.
> With equal $C$'s (MFB) or equal $R$'s (Sallen-Key), $Q=\frac12\sqrt{R_3/R_4}$ resp. $\frac12\sqrt{C_4/C_3}$: the $4Q^2$ spread follows directly.

### Sensitivity

$$
\boxed{S_x^y=\frac{\partial y/y}{\partial x/x}}
$$

The fractional change of a filter parameter $y$ ($\omega_0$, $Q$) per fractional change of a component $x$. Read off the design equations (computed here, not tabulated in the sources):

- Any $\omega_0=1/\sqrt{\prod}$ of two $R$s and two $C$s: $S^{\omega_0}_{R,C}=-\tfrac12$ for each. A 1% capacitor gives a 0.5% $\omega_0$ error: this is why integrated filters need [[#Level 5 Tuning|tuning]].
- Tow-Thomas: $Q=R_d/R$, so $S^Q_{R_d}=1$, $S^Q_{R}=-1$: $Q$ depends on a **ratio**, which matches on chip to well under 1% (Carusone §12.9).
- The op amp: $|\Delta Q/Q|\approx2Q(\omega_0/\omega_t)$ ([[#Spec translation]]) is a sensitivity to the amplifier that **grows with $Q$**. High-$Q$ poles are sensitive poles; that, not component count, is the real cost of Chebyshev and elliptic responses.

## Level 4: Integrated Continuous-Time Filters

| | Switched-capacitor | Continuous-time (active-RC, MOSFET-C, Gm-C) |
|---|---|---|
| Coefficients set by | Capacitor ratios × clock: about 0.1% | $RC$ or $C/G_m$: about 30% untuned, ~1% tuned |
| Frequency range | Up to hundreds of kHz (Sedra §14.8); clock ≫ $2\times$ signal | Much higher: no sampling, no aliasing |
| Distortion + noise | Better than 90 dB at low frequency | Typically not much better than 60 dB at high frequency |
| Extra circuitry | Anti-alias and smoothing filters | Tuning loop |

(Carusone Ch. 12 intro.) SC filters are owned by [[Switched-Capacitor Circuits]]; this level covers the continuous-time family. All three build the [[#The Two-Integrator Loop]], differing only in how they turn a voltage into a current and where the capacitor sits.

### Active-RC Integrator

```tikz title="Active-RC integrator: R converts voltage to current into a virtual ground; C (a Miller capacitor) integrates it. With a one-pole op amp the response is ideal only between w = 1/(A0 RC) and the op amp's unity-gain frequency w_ta. After Carusone Figs. 12.41(a) and 12.42."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw (2.5,0) node[op amp](A){};
    \draw (A.+) -- ++(-0.3,0) node[ground]{};
    \draw (A.-) -- ++(-0.3,0) coordinate(x) node[above left]{$V_x$};
    \draw (x) to[R,l_=$R$,-o] ++(-2,0) node[left]{$v_i$};
    \draw (x) -- (x |- 0,1.4) to[C,l=$C_I$] (A.out |- 0,1.4) -- (A.out);
    \draw (A.out) to[short,-o] ++(0.5,0) node[right]{$v_o$};
  \end{scope}
  \begin{scope}[xshift=6.3cm,yshift=-1.4cm]
    \draw[->] (0,0) -- (7,0) node[right]{$\log\omega$};
    \draw[->] (0,0) -- (0,3.6) node[above]{$|H|$ (dB)};
    \draw[very thick] (0,3) -- (1.2,3) -- (5.0,0.3) -- (5.6,-0.2);
    \draw[dashed] (0.7,3.52) -- (5.3,0.25);
    \node[font=\scriptsize,anchor=west] at (2.7,2.2) {ideal $-1/(sRC)$};
    \draw[dashed] (1.2,0) -- (1.2,3);
    \node[below,font=\scriptsize] at (1.2,0) {$\frac{1}{A_0RC}$};
    \draw[dashed] (4.6,0) -- (4.6,0.6);
    \node[below,font=\scriptsize] at (4.6,0) {$\omega_{ta}$};
    \node[left,font=\scriptsize] at (0,3) {$A_0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{H(s)\approx-\frac{A_0}{(1+sA_0RC)(1+s/\omega_{ta})}\qquad(\omega_{ta}\gg1/RC)}
$$

- Passive resistor into a virtual ground: **excellent linearity**. Summing is free: more resistors into the same virtual ground. Negative coefficients by crossing wires in a fully differential circuit.
- Two weaknesses (Carusone §12.8): $R$ and $C$ do not track (no tuning knob), and the op amp must drive a **resistive** load, so it needs an output stage and a high GBW: active-RC is slower than Gm-C in CMOS.
- The two corners of this plot are exactly the two error terms of [[#Spec translation]]: $1/(A_0RC)=\omega_0/A_0$ (loss, lowers $Q$) and $\omega_{ta}$ (excess phase, raises $Q$).

> [!tip] Remark
> This is the Miller integrator of the op-amp notes: the capacitor around a high-gain amplifier, like the compensation capacitor of [[Operational Amplifiers#Level 2 Two-Stage Op Amps]]. The integrator's unity-gain frequency is $1/RC$; the op amp's own $\omega_{ta}$ must be far above it.

**High-linearity variants:** fully differential active-RC with digitally programmable capacitor arrays reached −94 dB distortion (Carusone §12.8.4, Durham 1993): tuning by switching $C$ instead of varying $R$.

### MOSFET-C Integrators

```tikz title="Two-transistor MOSFET-C integrator: the resistors of a fully differential active-RC integrator become triode MOSFETs with gate voltage V_C, which tunes the time constant. After Carusone Fig. 12.43 (one input pair shown)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (5,0) node[fd op amp](A){};
  \draw (A.-) -- ++(-0.5,0) coordinate(xm) -- ++(-0.6,0) node[nmos,rotate=-90,anchor=D](Q1){};
  \draw (Q1.S) -- ++(-0.6,0) node[left]{$v_{p}$};
  \draw (Q1.G) -- ++(0,0.3) node[above]{$V_C$};
  \draw (A.+) -- ++(-0.5,0) coordinate(xp) -- ++(-0.6,0) node[nmos,rotate=90,anchor=S](Q2){};
  \draw (Q2.D) -- ++(-0.6,0) node[left]{$v_{n}$};
  \draw (Q2.G) -- ++(0,-0.3) node[below]{$V_C$};
  \draw (xm) -- (xm |- 0,2.2) to[C,l=$C_I$] (A.out + |- 0,2.2) -- (A.out +);
  \draw (xp) -- (xp |- 0,-2.2) to[C,l_=$C_I$] (A.out - |- 0,-2.2) -- (A.out -);
  \draw (A.out +) -- ++(0.8,0) node[right]{$v_o^+$};
  \draw (A.out -) -- ++(0.8,0) node[right]{$v_o^-$};
  \node[font=\scriptsize] at (xm) [above left] {$V_x$};
\end{circuitikz}
\end{document}
```

$$
\boxed{r_{DS}=\frac{1}{\mu_nC_{ox}\frac WL\left(V_C-V_x-V_{tn}\right)},\qquad \omega_{ti}=\frac{1}{r_{DS}C_I}}
$$

- Triode transistors replace the resistors: the gate voltage $V_C$ **tunes** the time constant. The rest of the active-RC design carries over unchanged.
- Linearity: with balanced inputs the virtual-ground voltage $V_x$ moves with the square of the input, and in a fully differential circuit even-order terms cancel; about **50 dB** for two-transistor integrators (Carusone §12.8.2).
- **Four-transistor** (cross-coupled, Czarnul): $r_{DS}$ depends on $V_{C1}-V_{C2}$, odd terms also cancel in long-channel devices; about **10 dB** better in practice (short channels and mismatch limit it).
- **R-MOSFET-C** (Moon and Song): fixed resistors in series keep the low-frequency path resistive: about −90 dB THD at a few kHz, −70 dB at the passband edge of a 22 kHz fifth-order Bessel filter.

> [!tip] Remark
> $r_{DS}$ is the deep-triode $R_{on}$ of [[MosFETs#Regions of Operation]]: a resistor whose value the overdrive sets. Its nonlinearity is the $\frac12V_{DS}^2$ term the triode equation carries.

### Gm-C Integrators and Biquads

```tikz title="Gm-C integrator (left): a transconductor drives a grounded capacitor, w_ti = Gm/C. Summing is shorting output currents together. Right: single-ended Gm-C biquad (the fully differential version doubles every capacitor). After Carusone Figs. 12.4, 12.5 and 12.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,gm/.style={draw,isosceles triangle,isosceles triangle apex angle=60,minimum size=0.9cm,inner sep=0pt}]
  \begin{scope}
    \node[gm] (G) at (1.2,0) {$G_m$};
    \draw (G.west) ++(0,0.2) -- ++(-0.6,0) node[left]{$v_i$};
    \draw (G.apex) -- (2.6,0) coordinate(o) node[circ]{};
    \draw (o) to[C,l=$C_1$] (2.6,-1.6) node[ground]{};
    \draw (o) -- (3.2,0) node[right]{$v_o=\frac{G_m}{sC_1}v_i$};
    \draw[->] (1.9,0.25) -- (2.4,0.25) node[above,font=\scriptsize]{$i_o$};
  \end{scope}
  \begin{scope}[xshift=7cm]
    \node[gm] (G1) at (0,0) {\scriptsize$G_{m4}$};
    \node[gm] (G2) at (3,0) {\scriptsize$G_{m2}$};
    \node[gm,shape border rotate=180] (G3) at (6.3,-1.4) {\scriptsize$G_{m3}$};
    \node[gm,shape border rotate=180] (G4) at (3.2,1.6) {\scriptsize$G_{m1}$};
    \draw (G1.west) -- ++(-0.6,0) node[left]{$v_i$};
    \draw (G1.apex) -- (1.6,0) coordinate(n1) node[circ]{};
    \node[below right,font=\scriptsize] at (n1) {$v_1$};
    \draw (n1) to[C,l_=$C_A$] (1.6,-1.8) node[ground]{};
    \draw (n1) -- (G2.west);
    \draw (G2.apex) -- (4.6,0) coordinate(n2) node[circ]{};
    \draw (n2) to[C,l_=$C_B$] (4.6,-1.8) node[ground]{};
    \draw (n2) -- (7.8,0) node[right]{$v_o$};
    \draw (7.3,0) node[circ]{} |- (G3.east);
    \draw (G3.apex) -- (5.4,-1.4) -- (5.4,0) node[circ]{};
    \draw (7.3,0) |- (G4.east);
    \draw (G4.apex) -- (1.6,1.6) -- (n1);
    \node[font=\scriptsize,align=left,anchor=north west] at (-0.6,-2.6) {$G_{m1}$: loop ($-$), $G_{m3}$: damping ($-$):\ \ $\omega_0^2=\frac{G_{m1}G_{m2}}{C_AC_B}$,\ \ $\frac{\omega_0}{Q}=\frac{G_{m3}}{C_B}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_{ti}=\frac{G_m}{C}}\qquad\boxed{\omega_0^2=\frac{G_{m1}G_{m2}}{C_A(C_X+C_B)},\qquad \frac{\omega_0}{Q}=\frac{G_{m3}}{C_X+C_B}}
$$

- **Transconductor ≠ OTA:** a transconductor must be **linear** with a **known, controllable** $G_m$; an OTA only needs a large $g_m$ (Carusone §12.2.1).
- Ideal: $R_{in}=R_{out}=\infty$. Example 12.2: a 20 MHz integrator with 2 pF needs $G_m=2\pi\cdot20\text{ MHz}\cdot2\text{ pF}=0.251$ mA/V, i.e. the inverse of the $3.98\ \mathrm{k\Omega}$ an RC integrator would use.
- **Capacitive feed-ins** $C_X$ realize the $s$ and $s^2$ numerator terms (high-frequency gain $k_2=C_X/(C_X+C_B)<1$, a capacitive divider). Design equations (Carusone): $G_{m1}=\omega_0C_A$, $G_{m2}=\omega_0(C_B+C_X)$, $G_{m3}=\omega_0(C_B+C_X)/Q$, $G_{m4}=k_0C_A/\omega_0$, $G_{m5}=k_1(C_B+C_X)$.
- **Fully differential** is the norm (linearity, noise immunity), with CMFB. Two choices: one $C_1$ across the outputs (¼ the capacitance) or $2C_1$ from each output to ground (doubles as CMFB compensation). Bottom-plate parasitics (up to 20%) force a symmetric split; the integrator becomes $\omega_{ti}=G_m/(C_1+C_p/2)$, so **parasitics move $\omega_0$**.
- Gm-C is the fastest family (grounded capacitors, only capacitive loads, open-loop transconductors), and the least linear.

> [!note]- Derivation: first-order Gm-C section (Carusone Eqs. 12.13–12.17)
> KCL at the output of Fig. 12.8 ($G_{m1}$ from $V_{in}$, $C_X$ from $V_{in}$, $C_A$ to ground, $G_{m2}$ feedback):
> $$G_{m1}V_{in}+sC_X(V_{in}-V_{out})-sC_AV_{out}-G_{m2}V_{out}=0\Rightarrow\frac{V_{out}}{V_{in}}=\frac{s\frac{C_X}{C_A+C_X}+\frac{G_{m1}}{C_A+C_X}}{s+\frac{G_{m2}}{C_A+C_X}}$$
> Matching $k_1s+k_0$ over $s+\omega_0$: $C_X=C_A\,k_1/(1-k_1)$ (so $0\le k_1<1$), $G_{m1}=k_0(C_A+C_X)$, $G_{m2}=\omega_0(C_A+C_X)$.
> **Example 12.3:** dc gain 0.5, pole 20 MHz, zero 40 MHz, $C_A=2$ pF: $k_1=0.25$, $C_X=0.667$ pF, $G_{m1}=0.168$ mA/V, $G_{m2}=0.335$ mA/V.

### Transconductors

| Family (Carusone §) | $G_m$ | Linearity | Tuning | Speed |
|---|---|---|---|---|
| Fixed resistor degeneration (12.3) | $\dfrac{1}{R_S+2/g_{m1}}\to\dfrac1{R_S}$ | Good if $1/g_m\ll R_S$: needs large bias | None (switch resistor arrays) | Moderate |
| Degeneration + feedback (12.3: op amps or constant-$V_{be}$ loops) | $1/R_S$ | Better without extra bias | None | Moderate |
| Triode MOSFET as $R_S$ (12.4) | $\propto\mu C_{ox}\frac WL(V_{GS}-V_t)$ | Reduced vs a fixed $R$ | Gate voltage | Moderate |
| Active transistors: CMOS pair, inverter-based, cross-coupled pairs (12.5) | $\propto g_m$ | Lowest | Bias current | Highest |
| Bipolar / BiCMOS gain cells (12.6–12.7) | $1/R_S$ times a translinear gain | Good | Gain-cell current | High |

- **Degenerated pair input range:** at $V_{in}=I_1R_S$ one side turns off; usable range about half that, $\boxed{V_{in,max}\approx(I_1/2)R_S}$. Example 12.5 (bipolar, $R_S=3\ \mathrm{k\Omega}$, ±0.5 V): $r_{e,max}<0.1R_S$ needs $I_1=253\ \mu$A, $G_m=0.312$ mA/V; $r_{e,max}<0.01R_S$ needs 1.03 mA and gives about 10× lower distortion.
- If $1/g_m$ reaches 10% of $R_S$ at the peak input, the deviation from linearity is about 3% (Carusone §12.3).

> [!tip] Remark
> These are the linearization techniques of [[Nonlinearity and Mismatch#Resistive Degeneration]], [[Nonlinearity and Mismatch#Triode MOSFET Degeneration]] and [[Nonlinearity and Mismatch#Local Feedback a Linear Transconductor]], which own the distortion math. Here only the filter-specific point matters: **linear range costs bias current** ($I_1\ge2V_{in,max}G_m$), and a filter must also keep $G_m$ **tunable**.

## Level 5: Tuning

```tikz title="Indirect (master-slave) frequency tuning: a replica transconductor is locked to a reference (external resistor, switched capacitor, or a VCO in a PLL); its control signal also drives every filter transconductor. After Carusone Figs. 12.47 and 12.48(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,minimum height=1cm,minimum width=2.2cm,align=center}]
  \node[blk] (ref) at (0,0) {reference\\$R_{ext}$, $f_{clk}C_m$, or $f_{ref}$};
  \node[blk] (m) at (4,0) {master\\(replica $G_m$, VCO)};
  \node[blk] (e) at (8,0) {error integrator\\$C_I$};
  \node[blk,minimum width=7cm] (f) at (4,-2.6) {filter: every $G_{mi}=k_{mi}G_{m1}$, every $C=k\,C_A$};
  \draw[->] (ref) -- (m);
  \draw[->] (m) -- node[above,font=\scriptsize]{error} (e);
  \draw[->] (e.north) -- ++(0,0.8) -| node[pos=0.25,above,font=\scriptsize]{$V_{cntl}$} (m.north);
  \draw[->] (e.south) |- (f.east) node[pos=0.3,right,font=\scriptsize]{$V_{cntl}$};
  \draw[->] (-2,-2.6) node[left]{$v_{in}$} -- (f.west);
  \draw[->] (f.south) -- ++(0,-0.6) node[below]{$v_{out}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{untuned: }\frac{G_m}{C}\ \text{or}\ \frac{1}{RC}\ \pm30\%\ (C\ \pm10\%,\ R\text{ or }G_m\ \pm20\%)\qquad\text{ratios: }<1\%}
$$

All transconductors are scaled copies of one, $G_{mi}=k_{mi}G_{m1}$, and all capacitors scaled copies of $C_A$, with $k$'s set by matching. Then every coefficient is a constant times $G_{m1}/C_A$, so **tuning one ratio tunes the whole filter**, in any order (Carusone Eq. 12.176). The tuning loop sets $G_{m1}/C_A$ on a **replica**; the filter follows by matching (indirect tuning).

> [!tip] Remark
> The ratio accuracy is device matching ([[Nonlinearity and Mismatch#Level 3 Mismatch and Offset]]); $G_m$ moving about ±30% over corners at fixed $I_D$ is the same spread [[gm-ID Design Methodology#Design for Corners by Pre-Distorting the Spec]] designs around.

### Frequency Tuning

| Method | Sets | Accuracy / cost |
|---|---|---|
| **Constant $G_m$**: integrate the difference of $G_mV_B$ and $V_B/R_{ext}$ (Fig. 12.48) | $G_m=1/R_{ext}$ | Leaves the ±10% of $C$; fine for anti-alias filters with a moderate oversampling margin |
| Choose $R_{ext}$ per part (measure the step response in production) | $G_m/C$ | Under 1%; small TC if $R_{ext}$ has low TC |
| **Switched-capacitor** replaces $R_{ext}$ (Fig. 12.49) | $G_m=f_{clk}C_m$, so $G_m/C_A=f_{clk}C_m/C_A$ | No external parts, but clock leaks in; needs a ripple filter $R_1C_1$. A 100 MHz filter with $C_A=C_m=1$ pF needs $f_{clk}=628$ MHz |
| SC with $N$-scaled current sources (Fig. 12.50) | $G_m=Nf_{clk}C_m$ style ratio | $N$ times lower clock: a 10.7 MHz BP used $N=148$, $f_{clk}=450$ kHz |
| **PLL**: two Gm-C integrators as a VCO, locked to $f_{ref}$ (Fig. 12.51) | $G_m/C$ of the VCO | Best matching with $f_{ref}$ at the passband edge, but then the reference leaks into the band; supply noise becomes jitter on $V_{cntl}$ |
| **Tracking filter**: drive a biquad with $f_{ref}$, force 90° (zero correlation) (Fig. 12.52) | $\omega_0=\omega_{ref}$ | Less supply-sensitive; LP-vs-notch correlation variant avoids the $2f_{ref}$ ripple |

### Q-Factor Tuning

- Needed for high-speed or high-$Q$ filters: frequency tuning alone sets coefficients to about 1%, but for $Q>1$ small $Q$ errors cause large response errors (the $2Q$ factor of [[#Spec translation]]).
- Two knobs: trim each integrator's phase to exactly $-90°$ near the band edge (a tunable triode resistor in series with $C$, control $V_Q$), or tune the damping transconductor directly ($Q\propto1/k_{m3}$).
- $V_Q$ comes from a **magnitude-locked loop** (Fig. 12.53): a reference biquad driven at a known frequency; its output magnitude, compared to the scaled input, gives the $Q$ error.

### Adaptive and Direct Tuning

- Drive the filter with a known PN sequence through a DAC; adapt (digital) coefficients until the output matches the precomputed ideal; freeze (Kozma 1991). Tunes **all** poles and zeros.
- For a data pulse-shaping filter, tune the **step response**: frequency by the zero-crossing time of the LP output after a transition, $Q$ by the peak of the BP output, using two clocked comparators (Shoval 1995).

> [!note]- Detail: complex (polyphase) filters (Carusone §12.10)
> Real filters have conjugate-symmetric responses. Pairing two real signal paths ($I$, $Q$) and **cross-coupling** them at each integrator shifts a real low-pass prototype by $s\to s-j\omega_0$: a bandpass that passes $+\omega_0$ and rejects $-\omega_0$ (image rejection in low-IF receivers). Procedure: duplicate the real SFG, cross-couple each integrator; the coupling strength sets the shift. In active-RC: duplicate the prototype and cross-couple with resistors. Passive RC polyphase networks do the same with cascaded RC sections.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ order $N$ | Steeper transition, more $A_{min}$ | One more integrator (amplifier, power, noise) per pole |
| Chebyshev / elliptic instead of Butterworth | Lower $N$ for the same mask | Higher pole $Q$: more GBW and $A_0$, more sensitivity, worse group delay |
| Bessel | Flat group delay, no overshoot | Slowest roll-off: highest $N$ |
| Ladder (simulated) instead of cascade | Lowest passband sensitivity | Harder to design and debug; sections interact |
| Single-amp biquad (Sallen-Key, MFB) | One op amp per biquad: lowest power | $Q\lesssim5$, $4Q^2$ spread, more op-amp sensitivity |
| Two-integrator loop (KHN, Tow-Thomas) | Any $Q$, independent tuning, LP/BP(/HP) at once | Three or four op amps |
| ↑ $C$ (scale impedance down) | Lower $kT/C$ noise, parasitics matter less | $G_m=\omega_0C$ and power rise in proportion; area |
| Active-RC | Best linearity, simple design | Slow (op amp must drive $R$), not tunable without switched arrays |
| MOSFET-C | Tunable active-RC | ~50 dB linearity (2T), ~60 dB (4T) |
| Gm-C | Fastest, tunable | Least linear; parasitics shift $\omega_0$; $Q$ tuning at high $f$ |
| Degenerate the transconductor harder ($g_mR_S\uparrow$) | Linearity, $G_m$ less process-dependent | Bias current $I_1\ge2V_{in,max}G_m$, noise |
| ↑ amplifier $\omega_t$, $A_0$ | $Q$ and $\omega_0$ accuracy, no Q enhancement | Power ($f_T$), $L$ and cascodes (headroom) |
| Tuning loop | Coefficients to ~1% | Area, clock/reference leakage, a replica that must match |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Gain / attenuation | $G=20\log\lvert T\rvert$, $A=-20\log\lvert T\rvert$ |
| Ripple parameter | $\epsilon=\sqrt{10^{A_{max}/10}-1}$ |
| Butterworth magnitude | $\lvert T\rvert=1/\sqrt{1+\epsilon^2(\omega/\omega_p)^{2N}}$ |
| Butterworth order | $N\ge\log[(10^{A_{min}/10}-1)/\epsilon^2]\,/\,[2\log(\omega_s/\omega_p)]$ |
| Butterworth poles | $\omega_0=\omega_p(1/\epsilon)^{1/N}$, $Q_k=1/[2\sin(\frac{2k-1}{N}\frac\pi2)]$ |
| Chebyshev magnitude | $\lvert T\rvert=1/\sqrt{1+\epsilon^2\cos^2[N\cos^{-1}(\omega/\omega_p)]}$ (pass), $\cosh$ form (stop) |
| Chebyshev order | $N\ge\cosh^{-1}\!\left(\sqrt{10^{A_{min}/10}-1}/\epsilon\right)/\cosh^{-1}(\omega_s/\omega_p)$ |
| Bessel phase / delay | $\phi=A\omega[1+p(\omega/\omega_c)^{2N}]$, $\tau_d=A[1+p(2N+1)(\omega/\omega_c)^{2N}]$ |
| Butterworth prototype | $g_k=2\sin\frac{(2k-1)\pi}{2N}$, $g_{N+1}=1$ |
| Scaling | $L'=R_0L/\omega_c$, $C'=C/(R_0\omega_c)$ |
| LP→HP | $\omega\leftarrow-\omega_c/\omega$: $L\to C=1/(\omega_cL)$, $C\to L=1/(\omega_cC)$ |
| LP→BP | $\omega\leftarrow\frac1\Delta(\frac{\omega}{\omega_0}-\frac{\omega_0}{\omega})$: series $L\to(\frac{L}{\omega_0\Delta},\frac{\Delta}{\omega_0L})$, shunt $C\to(\frac{\Delta}{\omega_0C},\frac{C}{\omega_0\Delta})$ |
| LP→BS | series $L\to$ parallel $(\frac{L\Delta}{\omega_0},\frac{1}{\omega_0L\Delta})$, shunt $C\to$ series $(\frac{1}{\omega_0C\Delta},\frac{C\Delta}{\omega_0})$ |
| Fractional bandwidth | $\Delta=(\omega_2-\omega_1)/\omega_0$, $\omega_0=\sqrt{\omega_1\omega_2}$ |
| Biquad | $T=(a_2s^2+a_1s+a_0)/(s^2+s\omega_0/Q+\omega_0^2)$ |
| BP bandwidth | $\mathrm{BW}=\omega_0/Q$ |
| LP peaking | $Q>1/\sqrt2$: $\lvert T\rvert_{max}=\lvert a_0\rvert Q/(\omega_0^2\sqrt{1-1/4Q^2})$ |
| LCR resonator | $\omega_0=1/\sqrt{LC}$, $Q=\omega_0CR$ |
| Antoniou GIC | $L=C_4R_1R_3R_5/R_2$ |
| Two-integrator loop | $T_{hp}=Ks^2/D$, $T_{bp}=-K\omega_0s/D$, $T_{lp}=K\omega_0^2/D$ |
| KHN | $R_3/R_2=2Q-1$, $K=2-1/Q$ |
| Tow-Thomas | $\omega_0=1/CR$, $R_d=QR$, $R_g=R/K$ |
| Sallen-Key LP / MFB BP | $C_3=C/4Q^2$ resp. $R_4=R/4Q^2$; $CR=2Q/\omega_0$; MFB $K=-2Q^2$ |
| Sensitivity | $S_x^y=(\partial y/y)/(\partial x/x)$ |
| Active-RC integrator | $H\approx-A_0/[(1+sA_0RC)(1+s/\omega_{ta})]$ |
| MOSFET-C resistor | $r_{DS}=1/[\mu_nC_{ox}\frac WL(V_C-V_x-V_{tn})]$ |
| Gm-C integrator | $\omega_{ti}=G_m/C$ |
| Gm-C biquad | $\omega_0^2=G_{m1}G_{m2}/[C_A(C_X+C_B)]$, $\omega_0/Q=G_{m3}/(C_X+C_B)$ |
| Degenerated transconductor | $G_m=1/(R_S+2/g_{m1})$, $V_{in,max}\approx(I_1/2)R_S$ |
| Q error from the amplifier | $\Delta Q/Q\approx2Q(\omega_0/\omega_t-1/A_0)$ |
| Amplifier specs | $\omega_t\ge2Q\omega_0/\varepsilon_Q$, $A_0\ge2Q/\varepsilon_Q$ |
| Gm-C noise (1st order) | $\overline{v_n^2}=\xi(1+H_0)kT/C$ |
| Tuning | untuned $\pm30\%$; SC tuning $G_m=f_{clk}C_m$ |

## References

- **Sedra & Smith, *Microelectronic Circuits*, 8th ed., Ch. 14 Filters** (`Sedra.pdf` PDF pp. ≈1262–1316; the e-book has no printed page numbers): §14.1 filter transmission, types, specification (Figs. 14.2–14.4, Exercises 14.1–14.2); §14.2 transfer function, order, poles, zeros, all-pole, cascade factoring, first-order (Ex. 14.2), second-order functions (Eqs. 14.12–14.18, Figs. 14.9–14.12); §14.3 Butterworth (Eqs. 14.19–14.26, Figs. 14.13–14.15, Ex. 14.3) and Chebyshev (Eqs. 14.28–14.34, Fig. 14.17, Ex. 14.4, D14.15); §14.4 LCR resonator and its LP/BP/notch realizations (Eqs. 14.36–14.47, Figs. 14.18–14.19); §14.5 Antoniou GIC and op amp–RC resonator (Eqs. 14.48–14.57); §14.6 two-integrator loop, KHN, Tow-Thomas, feedforward (Eqs. 14.59–14.70, D14.21); §14.7 single-amplifier BP/HP/LP (Eqs. 14.75–14.101); §14.8 SC filters (used only for the link to the SC note).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed., Ch. 12 Continuous-Time Filters** (pp. 469–535, PDF = printed + 24): intro (SC vs CT accuracy, 30%/1%, 60 vs 90 dB); §12.1 first/second-order block diagrams, Ex. 12.1; §12.2 Gm-C integrators, summers, fully differential, first-order (Ex. 12.3) and biquad (Eqs. 12.26–12.32, Ex. 12.4), Ex. 12.2; §12.3 fixed-resistor transconductors (Eqs. 12.38–12.46, Ex. 12.5); §12.4–12.7 triode, active-transistor, bipolar, BiCMOS transconductors (summarized in one table); §12.8 active-RC (Eq. 12.153, Fig. 12.42), MOSFET-C two- and four-transistor, R-MOSFET-C; §12.9 tuning (indirect, constant $G_m$, SC, PLL, tracking filter, Q tuning, adaptive); §12.10 complex filters (folded summary); §12.11 key points. Ch. 14 p. 585 for ladder simulation as the low-sensitivity alternative.
- **Pozar, *Microwave Engineering*, 4th ed., Ch. 8** (PDF = printed + 20): §8.3 insertion-loss method, maximally flat, equal-ripple, elliptic, linear-phase responses (Eqs. 8.49–8.56), $N=2$ prototype derivation (Eqs. 8.57–8.63), Tables 8.3–8.5, Figs. 8.25–8.27; §8.4 impedance/frequency scaling, LP→HP/BP/BS (Eqs. 8.64–8.76, Table 8.6), Examples 8.3 and 8.4.
- **Computed here** (not printed in the sources): solutions of Sedra Ex. 14.3, 14.4, D14.15; Chebyshev pole $Q$s; the $\Delta Q/Q$ relation and its amplifier bounds (from Carusone's integrator model); the first-order Gm-C noise integral; the sizing steps of both worked examples; Butterworth $g_kQ_k=1$.
- No Zettelkasten notes exist for filters; none used.
