---
title: Microwave Resonators
description: Resonance and Q from the RLC tank to transmission-line, cavity and dielectric resonators, how a resonator is coupled to a line (under, critical, over), how Q is measured on a VNA, and what f0, Q_u, Q_L and coupling hand to an oscillator, filter or LNA designer.
kind: topic
status: growing
aliases:
  - Microwave Resonators
  - Resonators
  - Quality Factor
---

A resonator is any structure that stores electric and magnetic energy and trades it back and forth at one frequency. Near that frequency every resonator, from an on-chip LC tank to a metal cavity, looks like a series or parallel RLC, so this note starts with the RLC and its $Q$, then builds the microwave resonators (lines, cavities, dielectric pucks), couples them to a feedline, and ends with how $Q$ is measured. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="A parallel RLC tank loaded by an external R_L (left) and its impedance near resonance (right). At f0 the reactances cancel and the tank is a resistor; the half-power width is f0/Q. After Pozar Figs. 6.2 and 6.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[C, l=$C$] (0,2.4);
  \draw (0,2.4) -- (1.6,2.4) to[L, l=$L$] (1.6,0) -- (0,0);
  \draw (1.6,2.4) -- (3.2,2.4) to[R, l=$R$] (3.2,0) -- (1.6,0);
  \draw[dashed] (-1.0,-0.4) rectangle (3.95,2.85);
  \node[font=\scriptsize] at (1.5,3.1) {resonator: $Q_0=\omega_0RC$};
  \draw (3.2,2.4) -- (5.0,2.4) to[R, l=$R_L$] (5.0,0) -- (3.2,0);
  \node[font=\scriptsize,align=center] at (5.0,-0.85) {external load\\ $Q_e=R_L/\omega_0L$};
  \node[font=\scriptsize] at (2.1,-1.3) {$1/Q_L=1/Q_0+1/Q_e$};
  \begin{scope}[xshift=7cm]
    \draw[->] (0,0) -- (5.9,0) node[right] {$\omega/\omega_0$};
    \draw[->] (0,0) -- (0,3.5) node[above] {$|Z_{in}|$};
    \draw[thick,blue,domain=0.5:1.6,samples=160] plot ({5*(\x-0.5)},{3/sqrt(1+(5*(\x-1/\x))^2)});
    \draw[dotted] (0,3) node[left,font=\scriptsize] {$R$} -- (2.5,3);
    \draw[dotted] (0,2.121) node[left,font=\scriptsize] {$R/\sqrt2$} -- (3.025,2.121);
    \draw[dotted] (2.025,2.121) -- (2.025,0);
    \draw[dotted] (3.025,2.121) -- (3.025,0);
    \draw[<->] (2.025,1.2) -- node[above,font=\scriptsize] {BW} (3.025,1.2);
    \draw (2.5,0.08) -- (2.5,-0.08) node[below,font=\scriptsize] {1};
    \node[font=\scriptsize,anchor=west] at (3.6,2.7) {inductive below};
    \node[font=\scriptsize,anchor=west] at (3.6,2.3) {capacitive above};
    \node[font=\scriptsize,anchor=west] at (3.3,0.6) {$\dfrac{\text{BW}}{f_0}=\dfrac1Q$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Resonance is equal stored energies,** $W_m=W_e$. Then the input is purely resistive and $\omega_0=1/\sqrt{LC}$.
> 2. **$Q$ is stored energy over energy lost per radian:** $Q=\omega\dfrac{W_m+W_e}{P_{loss}}$. Series RLC $Q_0=\omega_0L/R$; parallel RLC $Q_0=\omega_0RC=R/\omega_0L$. Fractional half-power bandwidth $=1/Q$.
> 3. **Losses add as reciprocals:** $\dfrac1{Q_L}=\dfrac1{Q_0}+\dfrac1{Q_e}$, and inside $Q_0$ the same holds for conductor, dielectric and radiation loss. A filled cavity or dielectric resonator can never beat $Q_d=1/\tan\delta$.
> 4. **A low-loss line resonates** at $\ell=n\lambda/2$ (or $\lambda/4$ shorted) with $Q_0=\beta/2\alpha$. Shorted $\lambda/2$ is series, shorted $\lambda/4$ and open $\lambda/2$ are parallel.
> 5. **Coupling coefficient** $g=Q_0/Q_e$: $g=1$ is critical (matched at $f_0$, $Q_L=Q_0/2$), $g<1$ under-, $g>1$ over-coupled.
> 6. **Measure, don't guess:** on a VNA, $Q_L=f_0/\text{BW}_{3\,\text{dB}}$, $g$ from $|S_{21}(f_0)|$ (or the resonance-circle diameter), then $Q_0=(1+g)Q_L$.

**Map:** [[#Physics background|energy, $Q$, loss mechanisms]] → [[#Spec translation|what a resonator hands to an oscillator, filter or LNA]] → [[#Level 0 Series and Parallel RLC|RLC, series-parallel conversion, loaded Q]] → [[#Level 1 Transmission-Line Resonators|$\lambda/2$, $\lambda/4$ lines]] → [[#Level 2 Cavities and Dielectric Resonators|cavities, DRs, tuning]] → [[#Level 3 Coupling to a Resonator|coupling, gap and aperture]] → [[#Level 4 Measuring Q|VNA measurement]] → [[#Choosing a Resonator|which resonator]].

## Physics background

### Resonance as an energy balance

Any one-port that stores energy and loses power has (Pozar Eq. 6.5, the same for series and parallel):

$$
\boxed{Z_{in}=\frac{P_{loss}+2j\omega\,(W_m-W_e)}{\tfrac12|I|^2}}
$$

- The **real part** is loss; the **imaginary part** is the *imbalance* of stored magnetic and electric energy.
- **Resonance** is $W_m=W_e$: the reactance vanishes and $Z_{in}=R=P_{loss}/(\tfrac12|I|^2)$, purely real.
- Below resonance one energy dominates, above it the other: that is why a parallel tank is inductive below $f_0$ and capacitive above.

> [!tip] Remark
> This is the complex Poynting theorem written for a one-port: [[EM Foundations#Poynting Vector]] already noted that $X_{in}$ comes from $4\omega(W_m-W_e)$ and $R_{in}$ from the loss. In a cavity the energies are field integrals ($W_e=\frac\epsilon4\int|E|^2dv$), in a tank they are $\frac14L|I|^2$ and $\frac14C|V|^2$; the rest of this note never needs more than that.

### Quality Factor

$$
\boxed{Q=\omega\,\frac{\text{average energy stored}}{\text{energy lost per second}}=\omega\,\frac{W_m+W_e}{P_{loss}}}
$$

Three readings of the same number, each one used later:

| Reading | Formula | Used in |
|---|---|---|
| Bandwidth | $\text{BW}/f_0=1/Q$ (half-power) | filters, measurement |
| Phase slope | $Q=\dfrac{\omega_0}{2}\left\lvert\dfrac{d\angle Z}{d\omega}\right\rvert_{\omega_0}$ | oscillator frequency stability, group-delay measurement |
| Ring-down | stored energy $\propto e^{-\omega_0t/Q}$, amplitude $\propto e^{-\omega_0t/2Q}$ | why a tank needs a negative resistance to keep ringing |

```tikz title="Ring-down of a tank left alone after a kick: each cycle loses 2*pi/Q of its stored energy, so the amplitude envelope decays as exp(-omega_0 t / 2Q). Higher Q rings longer. After Razavi Fig. 15.32(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (10.4,0) node[right] {$t$};
  \draw[->] (0,-2.2) -- (0,2.4) node[above] {$v(t)$};
  \draw[thick,blue,domain=0:10,samples=400] plot (\x,{2*exp(-0.22*\x)*cos(360*1.2*\x)});
  \draw[dashed,red,domain=0:10,samples=60] plot (\x,{2*exp(-0.22*\x)});
  \draw[dashed,red,domain=0:10,samples=60] plot (\x,{-2*exp(-0.22*\x)});
  \node[red,font=\scriptsize,anchor=west] at (3.2,1.45) {envelope $e^{-\omega_0t/2Q}$};
  \node[font=\scriptsize,anchor=west] at (6.0,-1.6) {period $2\pi/\omega_0$};
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: bandwidth, phase slope and ring-down from the definition
> - **Ring-down.** With no drive, the stored energy $W$ can only fall by the loss: $dW/dt=-P_{loss}=-\omega_0W/Q$, so $W=W(0)e^{-\omega_0t/Q}$. Energy goes as amplitude squared, so the amplitude envelope is $e^{-\omega_0t/2Q}$.
> - **Bandwidth.** Near resonance a parallel RLC is $Z_{in}\simeq R/(1+2jQ_0\Delta\omega/\omega_0)$ (Pozar Eq. 6.19). $|Z|^2=R^2/2$ when $2Q_0\Delta\omega/\omega_0=\pm1$, so the two half-power points are $\pm\omega_0/2Q_0$ apart from $\omega_0$ and $\text{BW}=1/Q_0$ (Pozar Eqs. 6.11, 6.21). The series case is the dual.
> - **Phase slope.** From the same form, $\angle Z=-\tan^{-1}(2Q_0\Delta\omega/\omega_0)$, whose slope at $\Delta\omega=0$ is $-2Q_0/\omega_0$.
> - **Complex frequency.** Pozar's shortcut (Eq. 6.10): find the lossless answer, then replace $\omega_0$ by $\omega_0(1+j/2Q_0)$. Plugging into the lossless series form $Z=j2L(\omega-\omega_0)$ gives back $R+j2L\Delta\omega$ with $R=\omega_0L/Q_0$. Every near-resonance formula below (lines, gap coupling, apertures) uses this trick.

### Where the loss comes from

$$
\boxed{\frac1{Q_0}=\frac1{Q_c}+\frac1{Q_d}+\frac1{Q_r},\qquad Q_d=\frac1{\tan\delta}}
$$

- Each loss mechanism is its own $P_{loss}$ against the same stored energy, so the $1/Q$'s add (Pozar Eq. 6.49).
- **Conductor loss** $Q_c$: wall currents through the surface resistance $R_s=\sqrt{\omega\mu_0/2\sigma}$. Stored energy scales with volume, wall loss with surface area times $R_s$, so bigger resonators (relative to skin depth) have higher $Q_c$. For a fixed cavity shape $Q_c\propto1/\sqrt f$ (Pozar §6.4).
- **Dielectric loss** $Q_d=1/\tan\delta$ when the dielectric fills the whole field region, for *any* mode (Pozar Eqs. 6.48, 6.59): the integral of $|E|^2$ cancels between stored energy and loss. This is a hard ceiling.
- **Radiation loss** $Q_r$: open structures (open microstrip ends, dielectric resonators) leak.
- **External loading** $Q_e$ is a fourth $1/Q$ term, added on top in [[#Loaded and Unloaded Q]].

> [!tip] Remark
> $R_s$ and the skin depth are derived in [[EM Foundations#Skin Depth]] and [[EM Foundations#Surface Resistance]]; $\tan\delta=\epsilon''/\epsilon'$ in [[EM Foundations#Fields in Media Permittivity and Loss Tangent]]. The line attenuations $\alpha_c$, $\alpha_d$ used in Level 1 are in [[Transmission Lines#Low-Loss Line and Attenuation]] and [[Transmission Lines#Microstrip Losses]]. A metal wall forces $E_t=0$ ([[EM Foundations#Boundary Conditions]]), which is what quantises a cavity's modes.

## Spec translation

### The block's specs

| Spec | Meaning | Where it comes from |
|---|---|---|
| $f_0$ | Resonant frequency (and its tolerance / tuning range) | Geometry: $L$, $C$, line length, cavity size; pulled by coupling and by perturbations |
| $Q_0$ ($Q_u$) | Unloaded $Q$: the resonator's own loss | Conductor, dielectric, radiation ([[#Where the loss comes from]]) |
| $Q_L$ | Loaded $Q$ including the external circuit; sets the bandwidth $f_0/Q_L$ | $1/Q_L=1/Q_0+1/Q_e$ |
| $g=Q_0/Q_e$ | Coupling coefficient: how hard the outside world loads it | Gap capacitance, aperture size, probe/loop, tap point |
| $R$ at resonance | $R_P$ of the parallel model (or $R_s$ of the series) | $R_P=Q_0\omega_0L$ |
| Spurious modes | Next resonance above $f_0$ | $n\lambda/2$ harmonics of a line; mode chart of a cavity (Pozar Fig. 6.9) |

### Mapping block specs to amplifier specs

A resonator has no amplifier inside it; it sets the specs of the amplifier wrapped around it. Three users:

| Resonator spec | Used by | Amplifier / device spec it sets | Condition |
|---|---|---|---|
| $Q_0$ via $R_P$ | LC oscillator (negative-$G_m$ pair) | Transconductance (start-up) | $g_m\ge\alpha/R_P$ |
| $Q_0$ via $R_P$, swing $A$ | LC oscillator | Tail current = power | $I_{SS}=\pi A/(2R_P)$ |
| $Q_L$ | LC oscillator | Phase noise at offset $\Delta f$ (with the device noise factor $F$ and signal power) | $\mathcal L\propto\left(f_0/2Q_L\Delta f\right)^2$ |
| $f_0$, $L$ | Tuned amplifier, VCO | Device capacitance allowed on the node | $C_{dev}\le\dfrac1{\omega_0^2L}-C_{fixed}$ |
| $R_P$, $C$ | Tuned amplifier (LNA load, IF stage) | Gain and bandwidth; their product is fixed by $g_m/C$ | $A=g_mR_P$, $\ A\cdot\text{BW}=\dfrac{g_m}{2\pi C}$ |
| $Q_L/Q_0$ | Preselect filter in front of an LNA | Insertion loss, which adds dB-for-dB to the LNA's noise figure | $IL=-20\log\left(1-\dfrac{Q_L}{Q_0}\right)$ |
| $g$ | Oscillator output, filter end resonators | Power transfer to the load vs. $Q_L$ | $g=1$: matched, $Q_L=Q_0/2$ |

$$
\boxed{g_m\ge\frac{\alpha}{Q_0\,\omega_0L}}\qquad
\boxed{A\cdot\text{BW}=\frac{g_m}{2\pi C}}\qquad
\boxed{IL_{dB}=-20\log\!\left(1-\frac{Q_L}{Q_0}\right)}
$$

> [!note]- Derivation: oscillator start-up and current from the tank's $R_P$
> At resonance the tank is just $R_P=Q_0\omega_0L$ ([[#Parallel RLC]]). A negative resistance $-R_{neg}$ across it sustains oscillation only if $R_{neg}\le R_P$ (Razavi §15.3.4: $R_P\parallel(-R_P)=\infty$; binder pp. 376-378: the active circuit must "exactly cancel out the load and any other positive resistance" and leave a lossless $L$ and $C$). A cross-coupled pair presents $-2/g_m$ across the differential tank, giving $g_mR_P\ge1$; $\alpha\approx$ 1.4-1.7 is the PVT margin chosen in [[Oscillators#Mapping block specs to device and amplifier specs]]. Amplitude $A=\frac2\pi I_{SS}R_P$ is derived there too. A low $Q_0$ costs current twice: more $g_m$ to start, more $I_{SS}$ for the same swing.

> [!note]- Derivation: a tuned stage trades gain for bandwidth at constant $g_m/C$
> A transconductor $g_m$ driving a parallel tank gives $A=-g_mR_P$ at resonance (Razavi Fig. 15.23). The tank's 3 dB bandwidth is $f_0/Q=\frac{1}{2\pi R_PC}$ (from $Q=\omega_0R_PC$). Multiply: $A\cdot\text{BW}=g_m/(2\pi C)$, the same gain-bandwidth product as an RC-loaded stage, just centred at $f_0$ instead of dc. A higher-$Q$ tank buys gain by giving up bandwidth; it does not create gain-bandwidth.

> [!note]- Derivation: single-resonator insertion loss from $Q_L/Q_0$
> For a resonator between two matched ports (Pozar Fig. 6.21), $S_{21}(\omega_0)=g/(1+g)$ (Eq. 6.93) and $Q_0=(1+g)Q_L$ (Eq. 6.91). Eliminate $g$: $1+g=Q_0/Q_L$, so $S_{21}(\omega_0)=1-Q_L/Q_0$. A matched passive loss $L$ at room temperature has noise figure equal to $L$ ([[RF Noise and Distortion]]), so this loss lands directly on the receiver's NF when the filter sits in front of the LNA. For $Q_L\ll Q_0$, $IL\approx8.69\,Q_L/Q_0$ dB. Multi-resonator filters lose more; that belongs to [[Microwave Filters]].

### Where it lands in sizing

| Resonator-derived spec | Fixes | How |
|---|---|---|
| $g_m\ge\alpha/R_P$ and swing $A$ | $g_m/I_D$ of the oscillator pair | $g_m/I_D\ge4\alpha/(\pi A)$, independent of $Q$ ([[Oscillators#Where it lands in sizing]]) |
| $I_{SS}=\pi A/2R_P$ | $I_D$ | Low $Q_0$ → low $R_P$ → more current |
| Capacitance budget $1/(\omega_0^2L)-C_{fixed}$ | $W$, hence $L=L_{min}$ | Device $C_{gs}+C_{db}+\dots$ must fit; caps $g_m$ at a given $g_m/I_D$ |
| Tuned gain $A=g_mR_P$ | $g_m$, then $I_D=g_m/(g_m/I_D)$ | Higher $R_P$ (higher $Q$, larger $L$) reaches the gain with less current |

> [!tip] Remark
> The step from $g_m/I_D$ to a width is [[gm-ID Design Methodology]]; device background in [[MosFETs#gm/ID and ID/W Simulation-Aided Design]]. The full oscillator translation (start-up margin, ring vs LC, varactors) is owned by [[Oscillators#Spec translation]]; this table only shows where the tank's numbers enter it.

### Worked examples

**Filter / LNA front end (Pozar Fig. 6.22).** One resonator with $Q_0=1000$ between matched ports:

| Coupling | $Q_L=Q_0/(1+g)$ | $S_{21}(f_0)=g/(1+g)$ | Insertion loss = NF added in front of an LNA |
|---|---|---|---|
| $g=0.5$ (under) | 667 | 0.333 | 9.54 dB |
| $g=4$ (over) | 200 | 0.800 | 1.94 dB |

Heavy coupling widens the band ($f_0/200$ instead of $f_0/667$) and cuts the loss; light coupling is narrow and lossy. The only way to get narrow *and* low-loss is a higher $Q_0$.

**Oscillator (Razavi Problem 15.15, worked in [[Oscillators#Worked example a 1 GHz LC VCO (Razavi Problem 15.15)]]).** $L_P=5$ nH, $Q=4$ at 1 GHz gives $R_P=Q\omega_0L=126\ \Omega$, so the pair needs $g_m\ge1.7/126=13.5$ mS per device. The same tank with $Q=8$ would halve both the required $g_m$ and the tail current for the same swing.

## Level 0: Series and Parallel RLC

### Series RLC

$$
\boxed{Z_{in}=R+j\omega L-\frac{j}{\omega C}\ \simeq\ R+j\,\frac{2RQ_0\,\Delta\omega}{\omega_0},\qquad \omega_0=\frac1{\sqrt{LC}},\qquad Q_0=\frac{\omega_0L}{R}=\frac{1}{\omega_0RC}}
$$

- At resonance $Z_{in}=R$, a **minimum**: a series resonator is a short (through $R$) at $f_0$.
- $Q_0$ **rises as $R$ falls**. Near $f_0$ the reactance grows linearly, $X\simeq2L\Delta\omega$; this is the form every distributed resonator is matched to.

### Parallel RLC

$$
\boxed{Z_{in}=\left(\frac1R+\frac1{j\omega L}+j\omega C\right)^{-1}\simeq\frac{R}{1+2jQ_0\Delta\omega/\omega_0},\qquad Q_0=\omega_0RC=\frac{R}{\omega_0L}}
$$

- At resonance $Z_{in}=R$, a **maximum** (an *antiresonance*): a parallel tank is an open (through $R$) at $f_0$.
- $Q_0$ **rises as $R$ rises**. Near $f_0$ the admittance is $Y\simeq1/R+2jC\Delta\omega$.
- The circulating current in $L$ and $C$ is $Q_0$ times the drive current: that is the energy sloshing back and forth.

> [!tip] Remark
> The two are duals: swap $Z\leftrightarrow Y$, $L\leftrightarrow C$, $R\leftrightarrow1/R$. In [[Filters]], a lowpass-to-bandpass transformation turns every series $L$ into a series resonator and every shunt $C$ into a parallel one (binder p. 284), so a bandpass ladder is nothing but these two circuits alternated.

> [!note]- Detail: Pozar Table 6.1 in one place
> | | Series | Parallel |
> |---|---|---|
> | Input | $Z_{in}=R+j\omega L-j/\omega C\simeq R+j2RQ_0\Delta\omega/\omega_0$ | $Y_{in}=1/R+j\omega C-j/\omega L\simeq1/R+j2Q_0\Delta\omega/(R\omega_0)$ |
> | $P_{loss}$ | $\frac12|I|^2R$ | $\frac12|V|^2/R$ |
> | $W_m$ | $\frac14|I|^2L$ | $\frac14|V|^2/(\omega^2L)$ |
> | $W_e$ | $\frac14|I|^2/(\omega^2C)$ | $\frac14|V|^2C$ |
> | $\omega_0$ | $1/\sqrt{LC}$ | $1/\sqrt{LC}$ |
> | $Q_0$ | $\omega_0L/R=1/(\omega_0RC)$ | $\omega_0RC=R/(\omega_0L)$ |
> | $Q_e$ | $\omega_0L/R_L$ | $R_L/(\omega_0L)$ |

### Series-Parallel Conversion

Real tanks are drawn with loss *in series* with the inductor (wire resistance), but analysed as a parallel RLC. Near one frequency the two are equivalent:

```tikz title="A lossy inductor (series R_S) is, over a narrow band, an inductor in parallel with R_P = Q^2 R_S. Applied to a tank it gives the three-element parallel RLC every oscillator analysis uses. After Razavi Figs. 15.20 and 15.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) to[L, l=$L_S$] (0,1.5) to[R, l=$R_S$] (0,0);
  \node at (1.6,1.5) {$\Longleftrightarrow$};
  \draw (3.4,3) -- (3.4,2.6) -- (2.8,2.6) to[L, l_=$L_P$] (2.8,0.4) -- (3.4,0.4) -- (3.4,0);
  \draw (3.4,2.6) -- (4.0,2.6) to[R, l=$R_P$] (4.0,0.4) -- (3.4,0.4);
  \node[font=\scriptsize,align=left,anchor=west] at (5.0,1.5) {$Q=\dfrac{\omega L_S}{R_S}$\\[6pt] $R_P=R_S(1+Q^2)\approx Q^2R_S$\\[6pt] $L_P=L_S(1+1/Q^2)\approx L_S$};
  \begin{scope}[xshift=9.6cm]
    \draw (0,3) -- (1.8,3);
    \draw (0,3) to[L, l_=$L_S$] (0,1.5) to[R, l_=$R_S$] (0,0);
    \draw (1.8,3) to[C, l=$C$] (1.8,0) -- (0,0);
    \node at (2.9,1.5) {$\Rightarrow$};
    \draw (4.0,3) -- (6.6,3);
    \draw (4.0,3) to[C, l=$C$] (4.0,0);
    \draw (5.3,3) to[L, l=$L_P$] (5.3,0);
    \draw (6.6,3) to[R, l=$R_P$] (6.6,0);
    \draw (4.0,0) -- (6.6,0);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R_P=R_S(1+Q^2)\approx Q^2R_S=Q\,\omega L,\qquad L_P=L_S\left(1+\frac1{Q^2}\right)\approx L_S}
$$

The reactance stays (almost) the same; the resistance is multiplied by $Q^2$. The same trick converts a series $RC$ with $Q=1/(\omega CR_S)$.

> [!note]- Derivation: matching real and imaginary parts (Razavi Eqs. 15.29-15.36)
> Set $j\omega L_S+R_S=\dfrac{R_P\,j\omega L_P}{R_P+j\omega L_P}$ and cross-multiply: $(L_SR_P+L_PR_S)j\omega+R_SR_P-L_SL_P\omega^2=R_PL_Pj\omega$.
> - Real: $R_SR_P=L_SL_P\omega^2$.
> - Imaginary: $L_SR_P+L_PR_S=R_PL_P$.
>
> Substituting $R_P$ from the first into the second gives $L_P=L_S(1+R_S^2/(L_S^2\omega^2))=L_S(1+1/Q^2)$. Back into the first: $R_P=L_S^2\omega^2(1+1/Q^2)/R_S=R_S(Q^2+1)$. Exact at the one frequency $\omega$; Razavi stresses it only holds in a narrow band, and that monolithic inductors have $Q$ "typically greater than 3", so the $1/Q^2$ corrections are small.
>
> **With a lossy inductor and a lossy capacitor** in one tank, convert each to its parallel $R$ and combine: the tank's $1/Q=1/Q_{L}+1/Q_{C}$ (the reciprocal rule of [[#Where the loss comes from]]).

> [!tip] Remark
> This is the same arithmetic as the real-to-real L-section in [[Smith Chart and Impedance Matching#L-Network Matching]]: $Q=\sqrt{R_{hi}/R_{lo}-1}$ is $R_P=R_S(1+Q^2)$ solved for $Q$. A matching L-section *is* a resonator at the design frequency, which is why its bandwidth is about $f_0/Q$. The spiral inductor's own $Q$, $R_S$ and self-resonance belong to [[Inductor]].

### Loaded and Unloaded Q

```tikz title="Loading: the external circuit adds its own loss. Series resonator: R_L adds in series. Parallel resonator: R_L adds in parallel. Either way 1/Q_L = 1/Q_0 + 1/Q_e. After Pozar Fig. 6.3 and Eq. (6.22)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[R, l=$R_L$] (0,2.4) -- (1.0,2.4) to[R, l=$R$] (2.8,2.4) to[L, l=$L$] (4.6,2.4) to[C, l=$C$] (4.6,0) -- (0,0);
  \node[font=\scriptsize] at (2.3,-0.6) {series: $Q_e=\omega_0L/R_L$};
  \begin{scope}[xshift=7cm]
    \draw (0,0) to[R, l=$R_L$] (0,2.4) -- (3.6,2.4);
    \draw (1.2,2.4) to[R, l=$R$] (1.2,0);
    \draw (2.4,2.4) to[L, l=$L$] (2.4,0);
    \draw (3.6,2.4) to[C, l=$C$] (3.6,0);
    \draw (0,0) -- (3.6,0);
    \node[font=\scriptsize] at (1.8,-0.6) {parallel: $Q_e=R_L/\omega_0L$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac1{Q_L}=\frac1{Q_0}+\frac1{Q_e},\qquad Q_e=\begin{cases}\omega_0L/R_L & \text{series}\\ R_L/\omega_0L & \text{parallel}\end{cases}}
$$

- $Q_0$ (also written $Q_u$): the resonator alone. $Q_e$: what $Q$ would be if the external load were the only loss. $Q_L$: what you actually see.
- **$Q_L$ is always below both.** The bandwidth you measure is $f_0/Q_L$, never $f_0/Q_0$.
- A resonator matched to the line it is measured on ($Q_e=Q_0$) shows half its own $Q$. Coupling is Level 3.

## Level 1: Transmission-Line Resonators

```tikz title="Line resonators and their standing-wave voltage |V(z)| at the first resonance. A voltage null at the input means a series resonance (Z_in -> R small); a voltage maximum means a parallel one (Z_in -> R large). After Pozar Figs. 6.4 and 6.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % row 1 shorted lambda/2
  \begin{scope}[yshift=5.2cm]
    \draw[very thick] (0,0) -- (5,0); \draw[very thick] (0,-0.5) -- (5,-0.5);
    \draw[very thick] (5,0) -- (5,-0.5);
    \node[font=\scriptsize,anchor=west] at (5.1,-0.25) {short};
    \draw[blue,thick,domain=0:5,samples=60] plot (\x,{0.15+1.0*abs(sin(36*\x))});
    \node[font=\scriptsize,anchor=east] at (-0.1,-0.25) {$Z_{in}$};
    \node[font=\scriptsize] at (2.5,-0.85) {shorted, $\ell=\lambda/2$};
    \node[font=\scriptsize,align=left,anchor=west] at (6.4,0.0) {\textbf{series} RLC: $R=Z_0\alpha\ell$, $L=\dfrac{\pi Z_0}{2\omega_0}$\\ $Q_0=\pi/2\alpha\ell=\beta/2\alpha$};
  \end{scope}
  % row 2 shorted lambda/4
  \begin{scope}[yshift=2.6cm]
    \draw[very thick] (0,0) -- (2.5,0); \draw[very thick] (0,-0.5) -- (2.5,-0.5);
    \draw[very thick] (2.5,0) -- (2.5,-0.5);
    \node[font=\scriptsize,anchor=west] at (2.6,-0.25) {short};
    \draw[blue,thick,domain=0:2.5,samples=40] plot (\x,{0.15+1.0*abs(sin(36*(2.5-\x)))});
    \node[font=\scriptsize,anchor=east] at (-0.1,-0.25) {$Z_{in}$};
    \node[font=\scriptsize] at (1.25,-0.85) {shorted, $\ell=\lambda/4$};
    \node[font=\scriptsize,align=left,anchor=west] at (6.4,0.0) {\textbf{parallel} RLC: $R=\dfrac{Z_0}{\alpha\ell}$, $C=\dfrac{\pi}{4\omega_0Z_0}$\\ $Q_0=\pi/4\alpha\ell=\beta/2\alpha$};
  \end{scope}
  % row 3 open lambda/2
  \begin{scope}[yshift=0cm]
    \draw[very thick] (0,0) -- (5,0); \draw[very thick] (0,-0.5) -- (5,-0.5);
    \node[font=\scriptsize,anchor=west] at (5.1,-0.25) {open};
    \draw[blue,thick,domain=0:5,samples=60] plot (\x,{0.15+1.0*abs(cos(36*\x))});
    \node[font=\scriptsize,anchor=east] at (-0.1,-0.25) {$Z_{in}$};
    \node[font=\scriptsize] at (2.5,-0.85) {open, $\ell=\lambda/2$};
    \node[font=\scriptsize,align=left,anchor=west] at (6.4,0.0) {\textbf{parallel} RLC: $R=\dfrac{Z_0}{\alpha\ell}$, $C=\dfrac{\pi}{2\omega_0Z_0}$\\ $Q_0=\pi/2\alpha\ell=\beta/2\alpha$};
  \end{scope}
  \node[blue,font=\scriptsize] at (-0.6,6.5) {$|V(z)|$};
\end{circuitikz}
\end{document}
```

$$
\boxed{Q_0=\frac{\beta}{2\alpha}=\frac{\pi}{\lambda_g\,\alpha}\qquad\text{(any TEM line resonator, } \alpha=\alpha_c+\alpha_d\text{)}}
$$

- **Resonance** at $\ell=n\lambda/2$ (shorted or open) or $\ell=\lambda/4$ shorted. Higher $n$ modes are the line's own spurious responses.
- **Which model:** look at the voltage at the input. Null → series (Pozar Eq. 6.26). Maximum → parallel (Eqs. 6.30, 6.34).
- **$Q_0$ depends only on the line's loss per radian**, not on which termination or which $n$: the same $\alpha$ that sets insertion loss sets $Q$.
- **Open microstrip ends are not perfect opens:** fringing makes the line electrically longer, so a real resonator is cut a little short (Pozar ignores this in Ex. 6.2; the end correction is in [[Transmission Lines#Microstrip Discontinuities]]).

> [!tip] Remark
> These are the stub impedances of [[Transmission Lines#Transmission Line Input Impedance]] with loss kept: shorted $Z_0\tanh(\alpha+j\beta)\ell$, open $Z_0\coth(\alpha+j\beta)\ell$. A lossless shorted $\lambda/4$ is the "infinite impedance" stub used in bias tees and stub filters; this section says *how* infinite: $Z_0/\alpha\ell$.

> [!note]- Derivation: shorted $\lambda/2$ line is a series RLC (Pozar §6.2)
> $Z_{in}=Z_0\tanh(\alpha+j\beta)\ell=Z_0\dfrac{\tanh\alpha\ell+j\tan\beta\ell}{1+j\tan\beta\ell\tanh\alpha\ell}$.
> - Low loss: $\tanh\alpha\ell\simeq\alpha\ell$.
> - TEM line, $\omega=\omega_0+\Delta\omega$, $\ell=\pi v_p/\omega_0$: $\beta\ell=\pi+\pi\Delta\omega/\omega_0$, so $\tan\beta\ell\simeq\pi\Delta\omega/\omega_0$.
> - Then $Z_{in}\simeq Z_0(\alpha\ell+j\pi\Delta\omega/\omega_0)$, which is the series form $R+2jL\Delta\omega$ with $R=Z_0\alpha\ell$, $L=\pi Z_0/2\omega_0$, $C=1/\omega_0^2L$.
> - $Q_0=\omega_0L/R=\pi/(2\alpha\ell)=\beta/2\alpha$ since $\beta\ell=\pi$.
>
> **Shorted $\lambda/4$:** multiply top and bottom by $-j\cot\beta\ell$; with $\cot\beta\ell\simeq-\pi\Delta\omega/2\omega_0$ near $\beta\ell=\pi/2$, $Z_{in}\simeq Z_0/(\alpha\ell+j\pi\Delta\omega/2\omega_0)$, the parallel form $1/(1/R+2j\Delta\omega C)$: $R=Z_0/\alpha\ell$, $C=\pi/(4\omega_0Z_0)$, $Q_0=\omega_0RC=\pi/(4\alpha\ell)=\beta/2\alpha$.
>
> **Open $\lambda/2$:** $Z_{in}=Z_0\coth(\alpha+j\beta)\ell\simeq Z_0/(\alpha\ell+j\pi\Delta\omega/\omega_0)$: $R=Z_0/\alpha\ell$, $C=\pi/(2\omega_0Z_0)$, $Q_0=\pi/(2\alpha\ell)=\beta/2\alpha$.

**Design procedure (line resonator):**
1. Pick the line ($Z_0$, substrate) and get $\epsilon_e$, $\alpha_c$, $\alpha_d$ from [[Transmission Lines]].
2. Length: $\ell=\lambda_g/2=c/(2f_0\sqrt{\epsilon_e})$ (or $\lambda_g/4$ shorted). Subtract the open-end extension for microstrip.
3. $Q_0=\beta/2(\alpha_c+\alpha_d)$. If it is too low, use a lower-loss dielectric, air, or a wider (lower-loss) line, or move to a cavity.
4. Choose the coupling for the $Q_L$ the application needs ([[#Level 3 Coupling to a Resonator]]), then re-tune: coupling pulls $f_0$ down.

> [!example] Worked: $\lambda/2$ coax resonator, air vs Teflon (Pozar Ex. 6.1)
> Copper coax, $a=1$ mm, $b=4$ mm, $f_0=5$ GHz. $R_s=1.84\times10^{-2}\ \Omega$.
> - Air: $\alpha_c=\frac{R_s}{2\eta\ln(b/a)}\left(\frac1a+\frac1b\right)=0.022$ Np/m, $\beta=104.7$ rad/m, $Q_0=104.7/(2\cdot0.022)=2380$.
> - Teflon ($\epsilon_r=2.08$, $\tan\delta=0.0004$): $\alpha_c=0.032$ Np/m (scaled by $\sqrt{\epsilon_r}$), $\alpha_d=k_0\sqrt{\epsilon_r}\tan\delta/2=0.030$ Np/m, $\beta=104.7\sqrt{2.08}$, $Q_0=1218$.
>
> Filling the line almost halves $Q$: the dielectric adds its own loss *and* raises the conductor loss per meter.

> [!example] Worked: $\lambda/2$ open microstrip resonator (Pozar Ex. 6.2)
> 50 Ω microstrip on Teflon ($\epsilon_r=2.08$, $\tan\delta=0.0004$, $d=0.159$ cm), copper, $f_0=5$ GHz. $W=0.508$ cm, $\epsilon_e=1.80$.
> - $\ell=c/(2f\sqrt{\epsilon_e})=2.24$ cm; $\beta=2\pi f\sqrt{\epsilon_e}/c=151.0$ rad/m.
> - $\alpha_c=R_s/(Z_0W)=0.0724$ Np/m; $\alpha_d=\dfrac{k_0\epsilon_r(\epsilon_e-1)\tan\delta}{2\sqrt{\epsilon_e}(\epsilon_r-1)}=0.024$ Np/m.
> - $Q_0=151.0/(2\cdot0.0964)=783$. Conductor loss dominates, opposite to the filled coax.

## Level 2: Cavities and Dielectric Resonators

### Waveguide Cavities

```tikz title="A rectangular cavity is a waveguide shorted at both ends. In the TE101 mode E_y has one half-sine across a and one along d (arrows); H circulates around it. After Pozar Fig. 6.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick] (0,0) rectangle (5,2);
  \draw[thick] (0,2) -- (1.5,3) -- (6.5,3) -- (5,2);
  \draw[thick] (6.5,3) -- (6.5,1) -- (5,0);
  \draw[dashed] (0,0) -- (1.5,1) -- (6.5,1); \draw[dashed] (1.5,1) -- (1.5,3);
  \foreach \u in {0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9} {
      \pgfmathsetmacro{\h}{1.6*sin(180*\u)}
      \draw[->,blue,thick] ({5*\u},{1-\h/2}) -- ({5*\u},{1+\h/2});
  }
  \node[font=\scriptsize,align=left,anchor=west] at (7.4,2.0) {$E_y\propto\sin\dfrac{\pi x}{a}\sin\dfrac{\ell\pi z}{d}$\\[4pt] arrow length: $\sin(\pi x/a)$ on the\\ mid-plane $z=d/2$ ($\ell=1$)\\[4pt] $E_y=0$ on all walls it is tangent to};
  \draw[<->] (0,-0.3) -- node[below] {$a$} (5,-0.3);
  \draw[<->] (6.8,1) -- node[right] {$b$} (6.8,3);
  \draw[<->] (5.25,-0.15) -- node[below right] {$d$} (6.75,0.85);
  \node[blue,font=\scriptsize] at (-0.5,1.0) {$E_y$};
\end{circuitikz}
\end{document}
```

$$
\boxed{f_{mn\ell}=\frac{c}{2\pi\sqrt{\mu_r\epsilon_r}}\sqrt{\left(\frac{m\pi}{a}\right)^2+\left(\frac{n\pi}{b}\right)^2+\left(\frac{\ell\pi}{d}\right)^2},\qquad Q_0=\left(\frac1{Q_c}+\frac1{Q_d}\right)^{-1}}
$$

- A cavity is a waveguide **an integer number of half guide-wavelengths long**, $\beta_{mn}d=\ell\pi$ (Pozar Eq. 6.38). With $b<a<d$ the lowest mode is TE$_{101}$, the cavity version of the shorted $\lambda/2$ line.
- **Many modes:** every $(m,n,\ell)$ resonates somewhere. Choose dimensions so the nearest unwanted mode is far from $f_0$ (Pozar's mode chart, Fig. 6.9, for circular cavities).
- **Circular cavities:** dominant TE$_{111}$, but **TE$_{011}$** has a much higher $Q_c$ (Pozar Fig. 6.10), which is why frequency meters use it, loosely coupled and tuned by a movable end wall.
- **$Q$ is in the thousands to tens of thousands**, an order of magnitude above a microstrip line, and it is set by the filling: a dielectric caps it at $1/\tan\delta$.

> [!example] Worked: rectangular and circular cavities at 5 GHz (Pozar Ex. 6.3, 6.4)
> **Rectangular**, copper WR-187 ($a=4.755$ cm, $b=2.215$ cm), polyethylene filled ($\epsilon_r=2.25$, $\tan\delta=0.0004$). $k=157.08$ m$^{-1}$, $d=\ell\pi/\sqrt{k^2-(\pi/a)^2}$:
>
> | Mode | $d$ | $Q_c$ | $Q_d$ | $Q_0$ |
> |---|---|---|---|---|
> | TE$_{101}$ | 2.20 cm | 8403 | 2500 | 1927 |
> | TE$_{102}$ | 4.40 cm | 11,898 | 2500 | 2065 |
>
> **Circular TE$_{011}$**, $d=2a$, Teflon ($\epsilon_r=2.08$, $\tan\delta=0.0004$): $a=2.74$ cm, $d=5.48$ cm, $Q_c=29{,}390$, $Q_d=2500$, $Q_0=2300$. **Air filled: 42,400.**
>
> In every filled case $Q_d$ dominates. The metal is not the problem; the plastic is.

> [!note]- Derivation: TE$_{101}$ $Q_c$ (Pozar Eqs. 6.41-6.46)
> Standing-wave fields: $E_y=E_0\sin\frac{\pi x}{a}\sin\frac{\ell\pi z}{d}$, $H_x=\frac{-jE_0}{Z_{TE}}\sin\frac{\pi x}a\cos\frac{\ell\pi z}d$, $H_z=\frac{j\pi E_0}{k\eta a}\cos\frac{\pi x}a\sin\frac{\ell\pi z}d$.
> - Energies: $W_e=\frac{\epsilon abd}{16}E_0^2=W_m$ at resonance (check: $\frac1{Z_{TE}^2}+\frac{\pi^2}{k^2\eta^2a^2}=\frac{1}{\eta^2}$).
> - Wall loss by the perturbation method, $P_c=\frac{R_s}{2}\oint|H_t|^2ds$, summed over the six walls (symmetry doubles three).
> - $Q_c=\dfrac{2\omega_0W_e}{P_c}=\dfrac{(kad)^3b\eta}{2\pi^2R_s}\,\dfrac{1}{2\ell^2a^3b+2bd^3+\ell^2a^3d+ad^3}$.
> - Dielectric: $P_d=\frac{\omega\epsilon''}{2}\int|E|^2dv$ and the same integral appears in $W_e$, so $Q_d=\epsilon'/\epsilon''=1/\tan\delta$ for any mode.

> [!note]- Detail: Fabry-Perot resonator (Pozar Problem 6.21)
> Two parallel metal plates a distance $d$ apart with a plane wave bouncing at normal incidence: the same "integer number of half wavelengths" condition, $d=\ell\lambda/2$, so $f_\ell=\ell c/(2d)$. Used at millimetre waves because a high mode number $\ell$ keeps the structure large (high volume-to-surface, high $Q$) when $\lambda$ is tiny. Pozar leaves the $Q$ as an exercise; it is not derived here.

### Dielectric Resonators

```tikz title="A dielectric resonator (DR) beside a microstrip line: the puck's TE01delta mode has a vertical magnetic dipole field that links the line's magnetic field. Spacing sets the coupling; a metal plate above tunes f0. After Pozar Figs. 6.11 and 6.13(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!15] (-0.5,-0.4) rectangle (8,-0.1);
  \draw (-0.5,-0.1) -- (8,-0.1);
  \node[font=\scriptsize,anchor=west] at (8.1,-0.25) {substrate};
  \fill[orange!60] (-0.5,-0.1) rectangle (8,0.05);
  \node[font=\scriptsize,anchor=south] at (1.2,0.05) {microstrip line};
  \begin{scope}[xshift=4.2cm,yshift=1.1cm]
    \fill[blue!12] (-1,-0.7) rectangle (1,0.3);
    \fill[blue!12] (0,-0.7) ellipse (1 and 0.25);
    \draw (-1,-0.7) -- (-1,0.3); \draw (1,-0.7) -- (1,0.3);
    \draw (1,-0.7) arc (0:-180:1 and 0.25);
    \fill[blue!22] (0,0.3) ellipse (1 and 0.25); \draw (0,0.3) ellipse (1 and 0.25);
    \node[font=\scriptsize] at (0,-0.25) {$\epsilon_r$ 10--100};
    \draw[red,dashed,->] (0,0.6) .. controls (1.9,1.2) and (1.9,-1.6) .. (0,-1.1);
    \draw[red,dashed,->] (0,0.6) .. controls (-1.9,1.2) and (-1.9,-1.6) .. (0,-1.1);
    \node[red,font=\scriptsize] at (1.9,0.6) {$H$};
    \draw[very thick,gray] (-1.2,2.0) -- (1.2,2.0);
    \draw[<->] (1.4,2.0) -- node[right,font=\scriptsize] {tuning gap} (1.4,0.6);
  \end{scope}
\end{circuitikz}
\end{document}
```

- A **puck of high-$\epsilon_r$, low-loss ceramic** (barium tetratitanate, titania; $\epsilon_r$ 10-100). The high permittivity traps most of the field inside: at the puck's wall $\Gamma=\frac{\eta_0-\eta}{\eta_0+\eta}\to+1$, an approximate "magnetic wall".
- **No conductor loss**; $Q_0\approx1/\tan\delta$ if radiation is small, "up to several thousand" (Pozar §6.5). Dielectric loss tends to rise with $\epsilon_r$.
- **Smaller, cheaper and lighter than a cavity**, and couples to planar lines simply by placement. Tuned mechanically by a metal plate above. The workhorse of microwave filters and dielectric-resonator oscillators ([[Mixers and Microwave Oscillators]]).
- **Mode used:** TE$_{01\delta}$, the dual of the circular cavity's TE$_{011}$; $\delta<1$ because the puck is shorter than $\lambda_g/2$ (fields spill out evanescently).

> [!example] Worked: titania DR (Pozar Ex. 6.5)
> $\epsilon_r=95$, $\tan\delta=0.001$, $a=0.413$ cm, $L=0.8255$ cm. Solving the transcendental equation (6.70) gives $f_0\approx3.152$ GHz, against a measured 3.4 GHz: the magnetic-wall model is only about 10% accurate. $Q_0\approx1/\tan\delta=1000$.

> [!note]- Derivation: the TE$_{01\delta}$ transcendental equation (Pozar Eqs. 6.60-6.70)
> Treat the puck as a short length $L$ of dielectric waveguide with a magnetic wall at $\rho=a$: $H_z=H_0J_0(k_c\rho)e^{\pm j\beta z}$, $k_c=p_{01}/a$, $p_{01}=2.405$.
> - Inside ($|z|<L/2$): propagating, $\beta=\sqrt{\epsilon_rk_0^2-(p_{01}/a)^2}$, wave impedance $Z_d=\omega\mu_0/\beta$.
> - Outside: evanescent, $\alpha=\sqrt{(p_{01}/a)^2-k_0^2}$, $Z_a=j\omega\mu_0/\alpha$.
> - Even mode, match $E_\phi$ and $H_\rho$ at $z=L/2$: $\tan\dfrac{\beta L}{2}=\dfrac{\alpha}{\beta}$. Solve numerically for $k_0$. Real $\alpha$ and $\beta$ bound the root between $f_1=cp_{01}/(2\pi\sqrt{\epsilon_r}a)$ and $f_2=cp_{01}/(2\pi a)$ (2.853-27.804 GHz in Ex. 6.5).

### Tuning by Perturbation

$$
\boxed{\frac{\omega-\omega_0}{\omega_0}\simeq-\frac{\int(\Delta\epsilon|E_0|^2+\Delta\mu|H_0|^2)\,dv}{\int(\epsilon|E_0|^2+\mu|H_0|^2)\,dv}\quad\text{(material)},\qquad \frac{\omega-\omega_0}{\omega_0}\simeq\frac{\Delta W_m-\Delta W_e}{W_m+W_e}\quad\text{(shape)}}
$$

- **Adding material** ($\Delta\epsilon$ or $\Delta\mu>0$) anywhere **lowers** $f_0$, most where that field is strongest. Used to measure a sample's $\epsilon_r$ from the frequency shift.
- **Pushing a wall in** (screw, plunger) removes stored energy: where $E$ is strong it removes $W_e$ and **lowers** $f_0$; where $H$ is strong it removes $W_m$ and **raises** $f_0$.
- Pozar Ex. 6.7: a thin slab of thickness $t$ on the floor of a TE$_{101}$ cavity: $\Delta\omega/\omega_0=-(\epsilon_r-1)t/2b$. Ex. 6.8: a thin screw of volume $\Delta V$ at the centre of the top wall (maximum $E$): $\Delta\omega/\omega_0=-2\Delta V/V_0$.

> [!tip] Remark
> The same logic explains why a gap or aperture that couples a resonator also **pulls $f_0$ down** (next level), and why a VCO's varactor or an oscillator's device capacitance detunes its tank ([[Oscillators#Tuning an LC oscillator varactors]]).

## Level 3: Coupling to a Resonator

### Coupling Coefficient and Critical Coupling

$$
\boxed{g=\frac{Q_0}{Q_e}=\begin{cases}Z_0/R & \text{series resonator on a } Z_0 \text{ line}\\ R/Z_0 & \text{parallel resonator}\end{cases}\qquad g=1\iff Z_{in}(f_0)=Z_0,\ Q_L=\frac{Q_0}{2}}
$$

| $g$ | Name | At $f_0$ | Used for |
|---|---|---|---|
| $<1$ | undercoupled | mismatched, $Q_L\to Q_0$ | frequency meters, $Q$ measurement (loose coupling keeps $Q$ high) |
| $=1$ | critically coupled | matched, max power into resonator | absorbing resonators, matched one-ports |
| $>1$ | overcoupled | mismatched, $Q_L\ll Q_0$ | oscillators and tuned amplifiers wanting power transfer; wide filters |

```tikz title="Series RLC on a Z0 line, swept through resonance: each locus is a constant-r circle traversed clockwise, crossing the real axis at f0. Over-coupled circles enclose the centre, under-coupled ones do not, critical passes through it. After Pozar Fig. 6.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.6]
  \begin{scope}\clip (0,0) circle (1);
    \draw[gray!45,thin] (1,1) circle (1); \draw[gray!45,thin] (1,-1) circle (1);
    \draw[gray!45,thin] (1,0.5) circle (0.5); \draw[gray!45,thin] (1,-0.5) circle (0.5);
    \draw[gray!45,thin] (1,2) circle (2); \draw[gray!45,thin] (1,-2) circle (2);
  \end{scope}
  \draw[gray!60] (-1,0) -- (1,0);
  \draw[thick] (0,0) circle (1);
  \draw[very thick,red] (0.3333,0) circle (0.6667);
  \draw[very thick,black!70!green] (0.5,0) circle (0.5);
  \draw[very thick,blue] (0.6667,0) circle (0.3333);
  \draw[->,very thick,red] (-0.3333,-0.02) -- (-0.3333,0.04);
  \draw[->,very thick,black!70!green] (0,-0.02) -- (0,0.04);
  \draw[->,very thick,blue] (0.3333,-0.02) -- (0.3333,0.04);
  \fill (-0.3333,0) circle (0.025); \fill (0,0) circle (0.025); \fill (0.3333,0) circle (0.025);
  \draw[red] (0,0.577) -- (-0.6,0.66) node[left,font=\scriptsize] {over, $r=0.5$};
  \draw[black!70!green] (0.854,0.354) -- (1.2,0.62) node[right,font=\scriptsize] {critical, $r=1$};
  \draw[blue] (0.833,-0.289) -- (1.2,-0.55) node[right,font=\scriptsize] {under, $r=2$};
  \node[font=\scriptsize,anchor=west] at (1.05,0.15) {$f\to0,\infty$};
  \node[font=\scriptsize,anchor=north] at (0,-1.05) {dots: $f_0$, $\ \Gamma(f_0)=\dfrac{r-1}{r+1}$};
  \node[font=\scriptsize,anchor=east] at (-0.75,0.9) {$x>0$ ($f>f_0$)};
  \node[font=\scriptsize,anchor=east] at (-0.75,-0.9) {$x<0$ ($f<f_0$)};
\end{scope}
\end{circuitikz}
\end{document}
```

- The **diameter of the resonance circle** is $2g/(1+g)$: less than the chart's radius when undercoupled, more when overcoupled. A lossless line in front only *rotates* the circle (about the chart centre), so the diameter survives an unknown reference plane over the narrow resonance band. This is the one-port measurement of [[#One-port reflection the resonance circle]].
- Under vs over **cannot be told from $|\Gamma(f_0)|$ alone**: $g$ and $1/g$ give the same $|\Gamma|$. Look at whether the circle encloses the chart centre (equivalently, the phase swing of $S_{11}$: nearly $360^\circ$ overcoupled, much less undercoupled).

> [!tip] Remark
> Constant-$r$ circles: centre $\left(\frac r{1+r},0\right)$, radius $\frac1{1+r}$, from [[Smith Chart and Impedance Matching#Reading the chart]]. Clockwise is increasing series reactance, as in the [[Smith Chart and Impedance Matching#Element moves|element moves]] there.

> [!note]- Detail: constant-$Q_n$ arcs on the Smith chart
> A point $z=r+jx$ has node quality factor $Q_n=|x|/r$ (the $Q$ of that series combination). The locus $|x|/r=Q_n$ is a circular arc through $\Gamma=\pm1$: $u^2+(v+1/Q_n)^2=1+1/Q_n^2$ for the upper half ($x>0$), mirrored for the lower half. (Checked numerically, e.g. $Q_n=2$: $z=1+j2\to\Gamma=0.5+j0.5$ lies on it.) A matching path that stays inside a low-$Q_n$ arc is broadband; this is the precise form of "stay near the centre" in [[Smith Chart and Impedance Matching#Choosing a Matching Network]].

### Gap-Coupled Microstrip Resonator

```tikz title="Equivalent circuits for the two classic couplings. (a) A gap between a feedline and an open lambda/2 microstrip resonator is a series capacitor. (b) A small aperture in a waveguide wall is a shunt inductor in front of a shorted lambda_g/2 cavity. After Pozar Figs. 6.16 and 6.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1.5) node[ocirc]{} to[TL, l={$Z_0$ feed}] (2.4,1.5) to[C, l={$C$ (gap)}] (4.2,1.5) to[TL, l={$Z_0$, $\ell\approx\lambda/2$}] (7.2,1.5) node[ocirc]{};
  \draw (0,0) node[ocirc]{} -- (7.2,0) node[ocirc]{};
  \node[font=\scriptsize] at (8.0,1.5) {open};
  \node at (-0.6,0.75) {(a)};
  \begin{scope}[yshift=-3.0cm]
    \draw (0,1.5) node[ocirc]{} to[TL, l={$Z_0$ guide}] (2.4,1.5) -- (3.2,1.5) to[TL, l={$Z_0$, $\ell\approx\lambda_g/2$}] (6.4,1.5) -- (6.8,1.5) -- (6.8,0);
    \draw (3.2,1.5) to[L, l_={$L$ (aperture)}] (3.2,0);
    \draw (0,0) node[ocirc]{} -- (6.8,0);
    \node[font=\scriptsize] at (7.4,0.75) {short};
    \node at (-0.6,0.75) {(b)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{b_c=Z_0\omega C=\sqrt{\frac{\pi}{2Q_0}}\ \text{(critical)},\qquad g=\frac{2Q_0b_c^2}{\pi}}
$$

- Near resonance the gap-coupled $\lambda/2$ looks like a **series** RLC with $R=Z_0\pi/(2Q_0b_c^2)$, even though the bare open $\lambda/2$ is a parallel one: the series capacitor acts as an **impedance inverter**.
- **Coupling pulls $f_0$ down:** resonance is where $\tan\beta\ell=-b_c$, slightly below $\beta\ell=\pi$.
- **Higher $Q_0$ needs less coupling:** $b_c\propto1/\sqrt{Q_0}$, so a high-$Q$ resonator wants a smaller gap capacitance (a wider gap) for critical coupling.

> [!tip] Remark
> The capacitor-as-inverter idea is exactly the $J$/$K$-inverter used to couple resonators in coupled-line and end-coupled bandpass filters: [[Microwave Filters]]. The binder lists the gap as the standard way of "coupling to resonators" in microstrip (binder p. 96).

> [!example] Worked: critically coupled gap (Pozar Ex. 6.6)
> Open 50 Ω microstrip, $\ell=2.175$ cm, $\epsilon_e=1.9$, $\alpha=0.01$ dB/cm, 50 Ω feed.
> 1. Uncoupled resonance: $f_0=c/(2\ell\sqrt{\epsilon_e})=5.00$ GHz.
> 2. $Q_0=\pi/(\lambda_g\alpha)=\pi(8.7\text{ dB/Np})/(2\cdot0.02175\text{ m}\cdot1\text{ dB/m})=628$.
> 3. $b_c=\sqrt{\pi/(2\cdot628)}=0.05$, so $C=b_c/(\omega Z_0)=0.05/(2\pi\cdot5\text{ GHz}\cdot50)=0.032$ pF.
> 4. Solve $\tan\beta\ell+b_c=0$ near 5 GHz: $f_1\approx4.918$ GHz, **1.6% low**. Re-cut the line to correct it.

> [!note]- Derivation: gap-coupled input impedance (Pozar Eqs. 6.77-6.83)
> Normalized input: $z=-j\,\dfrac{1/\omega C+Z_0\cot\beta\ell}{Z_0}=-j\,\dfrac{\tan\beta\ell+b_c}{b_c\tan\beta\ell}$. Resonance ($z=0$): $\tan\beta\ell=-b_c$.
> - Taylor about $\omega_1$: $\dfrac{dz}{d(\beta\ell)}=-j\dfrac{\sec^2\beta\ell}{b_c\tan^2\beta\ell}\cdot(\ldots)\simeq\dfrac{j}{b_c^2}$ for $b_c\ll1$; with $d(\beta\ell)/d\omega=\ell/v_p$ and $\ell\simeq\pi v_p/\omega_1$: $z\simeq\dfrac{j\pi(\omega-\omega_1)}{\omega_1b_c^2}$.
> - Add loss with $\omega_1\to\omega_1(1+j/2Q_0)$: $z=\dfrac{\pi}{2Q_0b_c^2}+j\dfrac{\pi(\omega-\omega_1)}{\omega_1b_c^2}$, a series RLC.
> - Critical: $\pi/(2Q_0b_c^2)=1$. Coupling $g=Z_0/R=2Q_0b_c^2/\pi$.

### Aperture-Coupled Cavity

$$
\boxed{X_L=Z_0\sqrt{\frac{\pi k_0\,\omega_1}{2Q_0\beta^2c}}\quad\text{(critical coupling)}}
$$

- The dual of the gap: a small aperture in a transverse waveguide wall is a **shunt inductance**, and the coupled cavity looks like a **parallel** resonance near $\omega_1$ (Pozar Eqs. 6.84-6.89). From $X_L$, size the aperture ([[Microwave Network Analysis#Discontinuities Are Reactances]]).
- The next resonance, where the cavity is exactly $\lambda_g/2$, puts an $E$-null at the aperture: practically **uncoupled** and useless.
- **Probes and loops** also couple cavities: a probe couples to $E$, a loop to $H$ (Pozar Fig. 6.13(b)); their analysis needs a modal expansion that Pozar does not carry out.

> [!example] Exercise (Pozar Problem 6.23)
> An aperture-coupled rectangular cavity, $f_0=9.0$ GHz, $Q_0=11{,}000$, guide $a=2.5$ cm, $b=1.25$ cm. Find $x_L$ for critical coupling: $k_0=2\pi f_0/c$, $\beta=\sqrt{k_0^2-(\pi/a)^2}$, then the box above with $\omega_1/c=k_0$, i.e. $x_L=(k_0/\beta)\sqrt{\pi/2Q_0}$. (Left as an exercise in Pozar; not solved there.)

## Level 4: Measuring Q

$Q_0$ cannot be measured directly: the instrument loads the resonator. Measure the loaded response, extract $g$, then $Q_0=(1+g)Q_L$.

> [!tip] Remark
> Calibrate first ([[Microwave Network Analysis#Error Model and Calibration]]) so the data are at the connector planes, then de-embed or shift the reference planes to the resonator ([[Microwave Network Analysis#Shifting Reference Planes]], [[Microwave Network Analysis#De-embedding]]). Pozar's $S_{21}(f_0)$ is real only at the resonator's own planes. Sweep a span a few times $f_0/Q_L$ with enough points to resolve the 3 dB band.

### Two-port transmission

```tikz title="|S21| of a series resonator between two matched ports, Q0 = 1000 for both curves. Light coupling (g = 0.5) is narrow and lossy; heavy coupling (g = 4) is wide and nearly lossless. After Pozar Fig. 6.22 (recomputed from Eq. 6.93)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[x=300cm,y=0.15cm]
  \draw[->] (-0.016,0) -- (0.017,0) node[right] {$\omega/\omega_0$};
  \draw[->] (-0.016,-36) -- (-0.016,3) node[above] {$|S_{21}|$ (dB)};
  \foreach \y in {-5,-10,-15,-20,-25,-30,-35} { \draw (-0.0163,\y) -- (-0.0157,\y) node[left,font=\scriptsize] at (-0.0163,\y) {$\y$}; }
  \foreach \x/\l in {-0.01/0.990,-0.005/0.995,0/1.000,0.005/1.005,0.01/1.010} { \draw (\x,0.4) -- (\x,-0.4); \node[font=\scriptsize,above] at (\x,0.4) {\l}; }
  \draw[very thick,blue,domain=-0.015:0.015,samples=200] plot (\x,{-1.9382-10*log10(1+(400*\x)^2)});
  \draw[very thick,red,domain=-0.015:0.015,samples=200] plot (\x,{-9.5424-10*log10(1+(1333.3*\x)^2)});
  \draw[dashed,blue] (-0.0025,-4.95) -- (0.0025,-4.95);
  \node[blue,font=\scriptsize,anchor=west] at (0.0055,-3.0) {$g=4$: $Q_L=200$, $-1.94$ dB};
  \node[red,font=\scriptsize,anchor=west] at (0.0065,-21.5) {$g=0.5$: $Q_L=667$, $-9.54$ dB};
  \node[blue,font=\scriptsize] at (0,-6.6) {3 dB band};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Q_L=\frac{f_0}{\text{BW}_{3\,\text{dB}}},\qquad g=\frac{|S_{21}(f_0)|}{1-|S_{21}(f_0)|},\qquad Q_0=(1+g)\,Q_L}
$$

**Procedure (series resonator in series with the line, Pozar Fig. 6.21):**
1. Find $f_0$ at the transmission peak; read $S_{21}(f_0)$ (linear).
2. $g=S_{21}/(1-S_{21})$ (Eq. 6.94). For a resonator that appears as a parallel RLC, invert it (Pozar).
3. Read the two frequencies 3 dB below the peak: $Q_L=f_0/(f_2-f_1)$.
4. $Q_0=(1+g)Q_L$ (Eq. 6.91).

> [!note]- Derivation: why $g=S_{21}/(1-S_{21})$ here
> The resonator is loaded by $Z_0$ on *each* side, so $Q_e=\omega_0L/2Z_0$ and $g=Q_0/Q_e=2Z_0/R$ (Eq. 6.92). At $f_0$ the resonator is just $R$ in series: $S_{21}=\dfrac{2Z_0}{2Z_0+R}=\dfrac{g}{1+g}$ (Eq. 6.93). Solve for $g$. With $1/Q_L=1/Q_0+1/Q_e=(1+g)/Q_0$ you get step 4.
>
> Off resonance, $S_{21}=\dfrac{g/(1+g)}{1+2jQ_L\Delta\omega/\omega_0}$, which is what the figure plots: a Lorentzian whose $-3$ dB points are $\pm f_0/2Q_L$ from $f_0$.

> [!example] Worked: Pozar Problem 6.25 (my solution)
> Minimum insertion loss 1.94 dB at 3.0000 GHz; 4.95 dB at 2.9925 and 3.0075 GHz.
> - $|S_{21}(f_0)|=10^{-1.94/20}=0.800$, so $g=0.8/0.2=4.0$ (overcoupled).
> - The band edges are $4.95-1.94=3.01$ dB down: $\text{BW}=15$ MHz, $Q_L=3000/15=200$.
> - $Q_0=(1+4)\cdot200=1000$.
>
> These are exactly the $g=4$ numbers of the figure.

**Group delay** gives $Q_L$ without finding the 3 dB points. From the Lorentzian above, the phase of $S_{21}$ is $-\tan^{-1}(2Q_L\Delta\omega/\omega_0)$, so the VNA's group-delay trace peaks at $f_0$ with

$$
\boxed{\tau_g(f_0)=\frac{2Q_L}{\omega_0}\quad\Longrightarrow\quad Q_L=\pi f_0\,\tau_g(f_0)}
$$

(Derived from Pozar Eq. 6.93 plus the near-resonance form; checked numerically against a full RLC sweep. Use the delay at the resonator's own reference planes: the line delay of fixtures adds to $\tau_g$.)

### One-port reflection: the resonance circle

```tikz title="Reading Q from a one-port S11 sweep (over-coupled example, r = 0.5, g = 2). The resonance circle's diameter gives g; the two points 90 degrees either side of resonance, seen from the circle's centre, are the loaded half-power frequencies. The points where X = +-R give Q0 directly. Derived from Pozar Eq. (6.9)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.8]
  \draw[thick] (0,0) circle (1);
  \draw[gray!60] (-1,0) -- (1,0);
  \draw[very thick,red] (0.3333,0) circle (0.6667);
  \fill (0.3333,0) circle (0.018) node[above right,font=\scriptsize] {centre};
  \fill[red] (-0.3333,0) circle (0.025) node[left,font=\scriptsize,text=red] {$f_0$};
  \draw[dashed] (0.3333,0) -- (0.3333,0.6667); \draw[dashed] (0.3333,0) -- (0.3333,-0.6667);
  \fill[blue] (0.3333,0.6667) circle (0.025) node[above left,font=\scriptsize,text=blue] {$f_2$: $x=+(1+r)$};
  \fill[blue] (0.3333,-0.6667) circle (0.025) node[below left,font=\scriptsize,text=blue] {$f_1$: $x=-(1+r)$};
  \fill[black!60!green] (-0.2,0.4) circle (0.025) node[above left,font=\scriptsize,text=black!60!green] {$x=+r$};
  \fill[black!60!green] (-0.2,-0.4) circle (0.025) node[below left,font=\scriptsize,text=black!60!green] {$x=-r$};
  \draw[<->] (-0.3333,-0.08) -- node[below,font=\scriptsize,pos=0.35] {$d=\frac{2g}{1+g}$} (1,-0.08);
  \node[font=\scriptsize,align=left,anchor=west] at (1.15,0.45) {$Q_L=\dfrac{f_0}{f_2-f_1}$ (blue)};
  \node[font=\scriptsize,align=left,anchor=west] at (1.15,0.0) {$Q_0=\dfrac{f_0}{f_+-f_-}$ (green)};
  \node[font=\scriptsize,align=left,anchor=west] at (1.15,-0.45) {$g=\dfrac{d}{2-d}$};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{d=\frac{2g}{1+g}\ \Rightarrow\ g=\frac{d}{2-d},\qquad Q_L:\ X=\pm(R+Z_0),\qquad Q_0:\ X=\pm R,\qquad Q_e:\ X=\pm Z_0}
$$

**Procedure (series-type resonance on a $Z_0$ line):**
1. Sweep $S_{11}$ and plot it on the Smith chart. Near $f_0$ it traces a circle.
2. **Diameter** $d$ (in $|\Gamma|$ units) gives $g=d/(2-d)$. Encloses the centre → overcoupled ($d>1$).
3. **$Q_L$:** the two frequencies at $\pm90^\circ$ from the resonance point, seen from the circle's centre.
4. **$Q_0$:** either $(1+g)Q_L$, or, with the reference plane moved to the resonator, the frequencies where the normalized impedance has $|x|=r$.

> [!note]- Derivation: the circle and its special points (from Pozar Eq. 6.9)
> Near $f_0$, $z=r+jx$ with $x=2rQ_0\Delta\omega/\omega_0$ sweeping all reals, so the locus is the constant-$r$ circle: centre $c=\frac r{1+r}$, radius $\frac1{1+r}$, diameter $\frac2{1+r}=\frac{2g}{1+g}$ with $g=1/r$.
> - $\Gamma-c=\dfrac{-(1+r)+jx}{(1+r)(1+r+jx)}$. At $x=0$ this is $-\frac1{1+r}$ (the resonance point, $180^\circ$). At $x=\pm(1+r)$ it is $\pm\frac{j}{1+r}$: exactly $90^\circ$ round the circle.
> - $x=\pm(1+r)$ means $X=\pm(R+Z_0)$: the reactance equals the *total* series resistance, which is the half-power condition for the loaded circuit, $\Delta\omega/\omega_0=\pm1/2Q_L$ with $Q_L=\omega_0L/(R+Z_0)$. Equivalently the absorbed power $1-|\Gamma|^2$ falls to half its value at $f_0$.
> - $x=\pm r$ is $X=\pm R$: $\Delta\omega/\omega_0=\pm1/2Q_0$. $x=\pm1$ is $X=\pm Z_0$: $\pm1/2Q_e$.
> - A lossless line in front multiplies $\Gamma$ by $e^{-2j\beta\ell}$: a rotation about the chart centre that, over a narrow band, keeps the circle's diameter and the $90^\circ$ points. A parallel resonance gives the same picture on the admittance chart.

> [!warning] Unverified
> Pozar Problem 6.24 gives a one-port with 14 dB return loss at resonance and calls the 11 dB points "the half-power points". With the absorbed-power definition above, 14 dB at $f_0$ puts the loaded half-power points near 2.8 dB return loss, not 11 dB, so I could not reconcile the problem's intended convention and have not used it.

## Choosing a Resonator

| Resonator | $Q_0$ (source example) | Size / integration | Typical use |
|---|---|---|---|
| On-chip LC tank | low single digits to tens; Razavi: monolithic inductor $Q$ "typically greater than 3", his VCO problem uses 4 | Smallest; set by spiral inductor | VCOs, tuned LNA loads ([[Inductor]]) |
| Microstrip $\lambda/2$ | 783 (Teflon, 5 GHz, Ex. 6.2); 628 (Ex. 6.6) | Planar, cm at a few GHz | Filters, gap-coupled resonators |
| Coax $\lambda/2$ | 2380 air, 1218 Teflon (5 GHz, Ex. 6.1) | 3-D, tens of mm | Combline/coax filters |
| Dielectric resonator | $\approx1/\tan\delta$: 1000 for titania (Ex. 6.5); "up to several thousand" | Small puck beside a planar line | DROs, compact filters |
| Rectangular cavity | 1927-2065 polyethylene filled (Ex. 6.3) | Bulky, waveguide | High-power filters |
| Circular TE$_{011}$ | 2300 Teflon, 42,400 air (Ex. 6.4) | Bulkiest | Frequency meters, reference cavities |

- **First choice is set by the $Q_L$ you need.** Insertion loss is about $8.69\,Q_L/Q_0$ dB per resonator, so you need $Q_0\gg Q_L$.
- **Dielectric filling is the $Q$ ceiling** ($1/\tan\delta$): air for the highest $Q$, ceramics for small size.
- **High $Q$ in an oscillator gives low phase noise** (binder p. 390: "high-Q series or parallel resonator circuits can be used to generate higher quality and therefore lower phase noise oscillators"), at the cost of tuning range.

> [!tip] Remark
> Resonance is not always wanted. An on-chip decoupling capacitor and the package inductance form a tank; if it lands on a clock harmonic it multiplies supply noise by its $Q$, so it is deliberately damped with series resistance (Razavi §19.4; Zettelkasten 15s2).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $Q_0$ (lower loss, air, bigger structure) | Narrower BW at the same IL; lower filter loss; lower oscillator phase noise; larger $R_P$ (less $g_m$, less current) | Size, cost; narrower tuning; more sensitive to temperature and tolerance |
| ↑ coupling $g$ | More power transfer, wider $Q_L$ bandwidth, lower IL of a single resonator | $Q_L$ falls ($Q_0/(1+g)$): worse oscillator phase noise; $f_0$ pulled further |
| ↓ coupling $g$ | $Q_L\to Q_0$: sharp, accurate frequency reference | Mismatch, little power through, high IL |
| Fill with dielectric | Smaller ($\lambda/\sqrt{\epsilon_r}$) | $Q\le1/\tan\delta$; conductor loss per length also rises |
| Larger $L$ in an LC tank (fixed $f_0$) | Larger $R_P=Q\omega L$: more gain $g_mR_P$, less current for a given swing | Less room for capacitance: device size and tuning range shrink |
| Higher-order mode ($n\lambda/2$, TE$_{102}$, TE$_{011}$) | Often higher $Q$ (bigger structure) | Spurious modes closer; larger |
| Perturbation tuning (screw, plate, varactor) | Trims $f_0$ after build | Adds loss; reduces $Q$ slightly |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Input impedance from energy | $Z_{in}=\dfrac{P_{loss}+2j\omega(W_m-W_e)}{\frac12|I|^2}$ |
| Resonance | $W_m=W_e$, $\omega_0=1/\sqrt{LC}$ |
| $Q$ definition | $Q=\omega(W_m+W_e)/P_{loss}$ |
| Series RLC | $Q_0=\omega_0L/R=1/(\omega_0RC)$, $Z_{in}\simeq R+j2RQ_0\Delta\omega/\omega_0$ |
| Parallel RLC | $Q_0=\omega_0RC=R/(\omega_0L)$, $Z_{in}\simeq R/(1+2jQ_0\Delta\omega/\omega_0)$ |
| Bandwidth, phase slope | $\text{BW}/f_0=1/Q$; $Q=\frac{\omega_0}{2}|d\angle Z/d\omega|$ |
| Ring-down | energy $\propto e^{-\omega_0t/Q}$ |
| Complex frequency | $\omega_0\to\omega_0(1+j/2Q_0)$ |
| Loss sum | $1/Q_0=1/Q_c+1/Q_d+1/Q_r$, $Q_d=1/\tan\delta$ |
| Series-parallel | $R_P=R_S(1+Q^2)\approx Q^2R_S=Q\omega L$, $L_P=L_S(1+1/Q^2)$ |
| Loaded Q | $1/Q_L=1/Q_0+1/Q_e$; $Q_e=\omega_0L/R_L$ (series), $R_L/\omega_0L$ (parallel) |
| Line resonator | $Q_0=\beta/2\alpha=\pi/(\lambda_g\alpha)$ |
| Shorted $\lambda/2$ | series: $R=Z_0\alpha\ell$, $L=\pi Z_0/2\omega_0$ |
| Shorted $\lambda/4$ | parallel: $R=Z_0/\alpha\ell$, $C=\pi/4\omega_0Z_0$ |
| Open $\lambda/2$ | parallel: $R=Z_0/\alpha\ell$, $C=\pi/2\omega_0Z_0$ |
| Rectangular cavity | $f_{mn\ell}=\frac{c}{2\pi\sqrt{\mu_r\epsilon_r}}\sqrt{(m\pi/a)^2+(n\pi/b)^2+(\ell\pi/d)^2}$ |
| Perturbation | material: $\Delta\omega/\omega_0\simeq-\frac{\int(\Delta\epsilon|E|^2+\Delta\mu|H|^2)}{\int(\epsilon|E|^2+\mu|H|^2)}$; shape: $\frac{\Delta W_m-\Delta W_e}{W_m+W_e}$ |
| Coupling | $g=Q_0/Q_e$; series $Z_0/R$, parallel $R/Z_0$; critical $g=1$, $Q_L=Q_0/2$ |
| Gap coupling | $b_c=Z_0\omega C=\sqrt{\pi/2Q_0}$ (critical), $g=2Q_0b_c^2/\pi$ |
| Aperture coupling | $X_L=Z_0\sqrt{\pi k_0\omega_1/(2Q_0\beta^2c)}$ (critical) |
| Two-port measurement | $Q_L=f_0/\text{BW}_{3dB}$, $g=S_{21}/(1-S_{21})$, $Q_0=(1+g)Q_L$ |
| Group delay | $Q_L=\pi f_0\tau_g(f_0)$ |
| One-port circle | $d=2g/(1+g)$; $Q_L$ at $X=\pm(R+Z_0)$ ($\pm90^\circ$), $Q_0$ at $X=\pm R$ |
| Constant-$Q_n$ arc | $u^2+(v+1/Q_n)^2=1+1/Q_n^2$ (upper half) |
| Oscillator start-up | $g_m\ge\alpha/R_P=\alpha/(Q_0\omega_0L)$ |
| Tuned stage | $A=g_mR_P$, $A\cdot\text{BW}=g_m/(2\pi C)$ |
| Single-resonator IL | $IL=-20\log(1-Q_L/Q_0)\approx8.69\,Q_L/Q_0$ dB |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20)
  - Ch. 6 Microwave Resonators: §6.1 series and parallel RLC, loaded and unloaded $Q$, Table 6.1, pp. 272–278; §6.2 transmission-line resonators (shorted $\lambda/2$, shorted $\lambda/4$, open $\lambda/2$), Ex. 6.1–6.2, pp. 278–284; §6.3 rectangular cavities, TE$_{10\ell}$ $Q$, Ex. 6.3, pp. 284–288; §6.4 circular cavities, mode chart, TE$_{011}$, Ex. 6.4, pp. 288–293; §6.5 dielectric resonators, TE$_{01\delta}$, Ex. 6.5, pp. 293–297; §6.6 excitation (coupling coefficient, critical coupling, Fig. 6.15, gap-coupled microstrip Ex. 6.6, aperture-coupled cavity, two-port $Q$ measurement Figs. 6.21–6.22), pp. 297–306; §6.7 cavity perturbations, Ex. 6.7–6.8, pp. 306–311. Problems 6.21 (Fabry-Perot), 6.23, 6.24, 6.25, pp. 314–315.
  - Left out: full circular-cavity field expressions and $Q_c$ derivation (Eqs. 6.53–6.57, only results used), probe/loop modal analysis (Pozar also omits it), Fabry-Perot $Q$ (Pozar leaves it as a problem).
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19): §15.3.1 basic RLC concepts, series-to-parallel conversion, Eqs. 15.27–15.36, Figs. 15.19–15.23, pp. 618–621; §15.3.4 one-port oscillators, negative resistance, Fig. 15.32, pp. 626–628. Problem 15.15 (via [[Oscillators]]).
- **ECE 373 (Waterloo, Boumaiza) lecture binder** (PDF pages): p. 96 gap as "coupling to resonators" in microstrip; p. 284 lowpass-to-bandpass transformation into series/parallel resonators; pp. 376–378 oscillator design: negative resistance cancelling a lossy $L$-$C$, $f=1/2\pi\sqrt{LC}$; p. 390 high-$Q$ resonators for low phase noise. The binder has no dedicated resonator lecture.
- **Zettelkasten** (`AnalogTheory/`): 15s2 (decoupling capacitor resonating with package inductance, after Razavi §19.4) for the closing Remark only.
