---
title: Frequency Response
description: Where the poles of a MOS amplifier come from (one per node, Miller-multiplied across gain), how to estimate them in one line, and what each single-stage topology and the gain-bandwidth trade cost in speed.
kind: topic
status: growing
aliases:
  - Frequency Response
---

This note puts the capacitors from [[MosFETs#Capacitances]] back into the stages of [[Single-Stage]]. It starts with the whole chapter on one screen. Then it covers Bode plots, the three hand-analysis shortcuts (node poles, Miller, zero-value time constants), every basic stage, and finally the gain-bandwidth trade. Stop after any section and you still have a correct (just coarser) picture.

## The big picture

```tikz title="Each node with resistance R to ground and capacitance C to ground contributes a pole at 1/(RC); each pole bends the Bode plot down another 20 dB/dec. After Razavi Fig. 6.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,6) node[ocirc]{} node[left] {$V_{in}$} to[R, l=$R_S$] (2,6) coordinate (M);
  \draw (M) to[C, l_=$C_{in}$, *-] (2,4.5) node[ground]{};
  \draw (M) -- (2.6,6);
  \draw (2.6,5.4) -- (2.6,6.6) -- (3.6,6) -- cycle;
  \node at (2.95,6) {\scriptsize $A_1$};
  \draw (3.6,6) to[R, l=$R_1$] (5.6,6) coordinate (N);
  \draw (N) to[C, l_=$C_N$, *-] (5.6,4.5) node[ground]{};
  \draw (N) -- (6.2,6);
  \draw (6.2,5.4) -- (6.2,6.6) -- (7.2,6) -- cycle;
  \node at (6.55,6) {\scriptsize $A_2$};
  \draw (7.2,6) to[R, l=$R_2$] (9.2,6) coordinate (P);
  \draw (P) to[C, l_=$C_P$, *-] (9.2,4.5) node[ground]{};
  \draw (P) -- (10,6) node[ocirc]{} node[right] {$V_{out}$};
  \node[font=\scriptsize,red!70!black,anchor=west] at (2+0.4,5.0) {$\omega_1=\frac{1}{R_SC_{in}}$};
  \node[font=\scriptsize,red!70!black,anchor=west] at (5.6+0.4,5.0) {$\omega_2=\frac{1}{R_1C_N}$};
  \node[font=\scriptsize,red!70!black,anchor=west] at (9.2+0.4,5.0) {$\omega_3=\frac{1}{R_2C_P}$};
  % Bode
  \draw[->] (0,0) -- (10.4,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,3.8) node[above] {$|H|$ (dB)};
  \draw[very thick] (0,3.2) -- (2.5,3.2) -- (5,2.45) -- (7.5,0.95) -- (8.5,0.05);
  \foreach \x/\n in {2.5/1,5/2,7.5/3} {\draw[dotted] (\x,0) -- (\x,3.4); \node[below] at (\x,0) {$\omega_\n$};}
  \node[font=\scriptsize,anchor=south] at (1.2,3.2) {$A_1A_2$};
  \node[font=\scriptsize,anchor=south west] at (3.0,3.05) {$-20$ dB/dec};
  \node[font=\scriptsize,anchor=south west] at (6.3,1.85) {$-40$};
  \node[font=\scriptsize,anchor=south west] at (8.1,0.65) {$-60$};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **One pole per node:** $\omega_j \approx 1/(R_jC_j)$, the resistance and capacitance seen from node $j$ to ground. Exact only when nodes don't interact.
> 2. **Miller:** a capacitor $C_F$ across an inverting gain $-A$ looks like $(1+A)C_F$ at the input. That is why the common-source (CS) stage is slow: $\omega_{in} = 1/\{R_S[C_{GS}+(1+g_mR_D)C_{GD}]\}$.
> 3. **Zero-value time constants:** $\omega_{-3\text{dB}} \approx 1/\sum_k R_kC_k$, each $R_k$ found at DC with every other capacitor open. One DC calculation per capacitor, no transfer function.
> 4. **Topology:** CS pays the Miller penalty. Common gate (CG), cascode ($C_{GD1}\times\approx 2$) and source follower (bootstrapped $C_{GS}$) avoid it. A diff pair's half circuit is a CS stage; a mirror load adds a mirror pole $g_{m3}/C_E$ and a zero at twice that.
> 5. **Gain-bandwidth:** a one-pole stage has $\text{GBW} = g_m/C_L$, whatever $R_{out}$ is. Cascoding buys gain but not GBW. Cascading $N$ stages raises GBW but shrinks bandwidth to $\sqrt{2^{1/N}-1}\,\omega_p$.

**Map:** [[#Level 0 Transfer Functions and Bode Plots|Bode basics]] → [[#Level 1 Three Shortcuts for Finding Poles|node poles, Miller, ZVTC]] → [[#Level 2 The Basic Stages at High Frequency|CS, SF, CG, cascode, diff pair]] → [[#Level 3 Gain-Bandwidth Trade-Offs|GBW and cascading]] → [[#Level 4 Exact Tools and Device Limits|EET, dual Miller, $f_T$]].

## Level 0: Transfer Functions and Bode Plots

### Poles, Zeros, and the Sign Convention

$$
\boxed{H(s) = A_0\frac{(1+s/\omega_{z1})(1+s/\omega_{z2})\cdots}{(1+s/\omega_{p1})(1+s/\omega_{p2})\cdots}}
$$

- Every circuit here gives a rational $H(s)$ with real coefficients. Poles and zeros are real or come in complex-conjugate pairs. A stable circuit has all denominator coefficients positive.
- Convention (Razavi): $\omega_p$ is written **positive** and the root is at $s=-\omega_p$. A zero written $(1-s/\omega_z)$ sits in the **right half plane** (RHP).
- For the sinusoidal steady state, set $s=j\omega$: the output is the same sinusoid scaled by $|H(j\omega)|$ and shifted by $\angle H(j\omega)$. Doubling the gain adds 6 dB; ×10 adds 20 dB.

### Bode Rules

```tikz title="Two real poles and a zero. Magnitude: each pole adds -20 dB/dec, each zero (either half plane) +20 dB/dec. Phase: each pole and each RHP zero adds -90° (-45° at its corner); an LHP zero adds +90°. After Carusone Fig. 4.4 and Razavi Fig. 6.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % magnitude
  \draw[->] (0,2) -- (9.6,2) node[right] {$\log\omega$};
  \draw[->] (0,2) -- (0,7.2) node[above] {$20\log|H|$};
  \draw[very thick] (0,6.6) -- (1.5,6.6) -- (4,5.35) -- (6,3.35) -- (9,1.85+0.3);
  \draw[thick,dashed] (6,3.35) -- (7.3,2.05);
  \foreach \x in {1.5,4,6} \draw[dotted] (\x,2) -- (\x,6.8);
  \node[below] at (1.5,2) {$\omega_{p1}$};
  \node[below] at (4,2) {$\omega_{p2}$};
  \node[below] at (6,2) {$|\omega_{z}|$};
  \node[font=\scriptsize,anchor=south] at (0.75,6.6) {$20\log A_0$};
  \node[font=\scriptsize,anchor=south west] at (2.7,6.0) {$-20$ dB/dec};
  \node[font=\scriptsize,anchor=west] at (5.1,4.6) {$-40$};
  \node[font=\scriptsize,anchor=south west] at (7.0,2.9) {zero: back to $-20$};
  \node[font=\scriptsize,anchor=west] at (7.35,2.2) {no zero};
  % phase
  \draw[->] (0,0) -- (9.6,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,-3.4);
  \node[left,font=\scriptsize] at (0,0) {$0^\circ$};
  \node[left,font=\scriptsize] at (0,-1) {$-90^\circ$};
  \node[left,font=\scriptsize] at (0,-2) {$-180^\circ$};
  \node[left,font=\scriptsize] at (0,-3) {$-270^\circ$};
  \node[left] at (-0.6,-1.5) {$\angle H$};
  \foreach \y in {-1,-2,-3} \draw[gray!40] (0,\y) -- (9.2,\y);
  \draw[very thick,domain=0:9.2,samples=80] plot (\x,{-(atan(10^((\x-1.5)/2)) + atan(10^((\x-4)/2)))/90});
  \draw[thick,dashed,blue!70!black,domain=3.5:9.2,samples=60] plot (\x,{-(atan(10^((\x-1.5)/2)) + atan(10^((\x-4)/2)) + atan(10^((\x-6)/2)))/90});
  \draw[thick,dashed,red!70!black,domain=3.5:9.2,samples=60] plot (\x,{-(atan(10^((\x-1.5)/2)) + atan(10^((\x-4)/2)) - atan(10^((\x-6)/2)))/90});
  \fill (1.5,-0.5) circle (1.5pt) node[below left,font=\scriptsize] {$-45^\circ$};
  \fill (4,{-(atan(10^1.25)+45)/90}) circle (1.5pt) node[below left,font=\scriptsize] {$\approx-135^\circ$};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (7.4,-2.75) {RHP zero: more lag};
  \node[font=\scriptsize,red!70!black,anchor=west] at (7.4,-1.25) {LHP zero: lead};
  \node[font=\scriptsize,anchor=west] at (7.4,-2.15) {no zero};
\end{circuitikz}
\end{document}
```

| Element | Magnitude slope after the corner | Phase at the corner | Phase far above |
|---|---|---|---|
| LHP pole | $-20$ dB/dec | $-45^\circ$ | $-90^\circ$ |
| LHP zero | $+20$ dB/dec | $+45^\circ$ | $+90^\circ$ |
| **RHP zero** | $+20$ dB/dec | $-45^\circ$ | $-90^\circ$ |

> [!tip] Remark
> An RHP zero looks like a zero on the magnitude plot but like a pole on the phase plot. That combination ruins phase margin, which is why the CS stage's $g_m/C_{GD}$ zero matters in [[Stability]].

> [!note]- Detail: plots with zeros below the poles (Carusone §4.1.4)
> Start at a mid-band frequency $\omega_{mid}$ where the number of poles below equals the number of zeros below, at gain $K\prod z/\prod\omega$ over the corners *above* $\omega_{mid}$. Walk right: every pole $-20$ dB/dec, every zero $+20$. Walk left: reverse the signs. Rule of thumb from the same section: very large capacitors can be treated as **shorts** to find the high-frequency behavior; very small ones as **opens** to find the low-frequency behavior.

### First Order

$$
\boxed{H(s) = \frac{A_0}{1+s/\omega_0}:\quad \omega_{-3\text{dB}} = \omega_0,\quad \omega_u \approx A_0\omega_0,\quad \angle H(\omega_u)\approx -90^\circ}
$$

- Step response $x(t) = x(\infty) - [x(\infty)-x(0^+)]e^{-t/\tau}$, $\tau = 1/\omega_0$. This holds for **any** first-order circuit, including one with a zero. A zero only changes the initial jump: $x(0^+) = A_{in}A_0\,\omega_0/\omega_z$.
- Above $\omega_0$ a high-gain one-pole amplifier is an integrator, $A(s)\approx A_0\omega_0/s$. Most of its useful band (inside feedback) is in this region.

### Second Order and $Q$

$$
\boxed{H(s) = \frac{K}{1 + \dfrac{s}{\omega_0Q} + \dfrac{s^2}{\omega_0^2}},\qquad \omega_0^2 = \omega_{p1}\omega_{p2},\quad \frac{\omega_0}{Q} = \omega_{p1}+\omega_{p2}}
$$

| $Q$ | Poles | Response |
|---|---|---|
| $\ll 0.5$ | Real, widely spaced: $\omega_{p1}\approx Q\omega_0$, $\omega_{p2}\approx\omega_0/Q$ | Behaves like one pole up to $\omega_{p2}$ |
| $\le 0.5$ | Real | No overshoot |
| $<1/\sqrt2$ | Complex if $>0.5$ | Overshoot but no magnitude peaking |
| $>0.5$ | Complex, real part $\omega_0/2Q$ | Overshoot $= e^{-\pi/\sqrt{4Q^2-1}}$; rings longer as $Q$ rises |

> [!note]- Derivation: reading two poles off the denominator (Razavi Eqs. 6.33–6.34)
> Expand $(1+s/\omega_{p1})(1+s/\omega_{p2}) = 1 + s\left(\frac1{\omega_{p1}}+\frac1{\omega_{p2}}\right) + \frac{s^2}{\omega_{p1}\omega_{p2}}$.
> If $\omega_{p1}\ll\omega_{p2}$, the coefficient of $s$ is $\approx 1/\omega_{p1}$, so $\omega_{p1}\approx 1/(\text{coef. of } s)$ and $\omega_{p2}\approx(\text{coef. of } s)/(\text{coef. of } s^2)$. This **dominant-pole approximation** is how every two-pole result below is read. Check afterwards that the two really are far apart.
>
> Step response with real poles (Carusone Eq. 4.81) is the sum of two first-order modes. For $t\gg 1/\omega_{p2}$ the fast one has died and only $1-e^{-\omega_{p1}t}$ remains.

## Level 1: Three Shortcuts for Finding Poles

Exact nodal analysis of even one transistor gives a second-order transfer function you can't read by eye. Designers instead use the three estimates below and then check with simulation.

### Association of Poles with Nodes

$$
\boxed{\omega_j = \frac{1}{R_jC_j}\quad\text{(total small-signal } R \text{ and } C \text{ from node } j \text{ to ground)}}
$$

- Exact for a cascade of isolated stages ([[#The big picture|Fig. above]]): $H = \prod A_i/(1+R_iC_is)$.
- Fails when a floating element (a resistor or capacitor between two signal nodes, e.g. $C_{GD}$ or $r_o$) couples the nodes. Miller's theorem is the usual way to remove that coupling.

### Miller's Theorem

```tikz title="A floating capacitor across an inverting gain splits into two grounded ones. After Razavi Figs. 6.2–6.3 and Carusone Fig. 4.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % left: floating C across -A
  \draw (0,0) node[ocirc]{} node[left] {$X$} -- (1,0) coordinate (X);
  \draw (1,-0.7) -- (1,0.7) -- (2.4,0) -- cycle;
  \node at (1.45,0) {$-A$};
  \draw (2.4,0) -- (3.4,0) node[ocirc]{} node[right] {$Y$};
  \draw (0.5,0) node[circ]{} -- (0.5,1.5) to[C, l=$C_F$] (2.9,1.5) -- (2.9,0) node[circ]{};
  \node[font=\scriptsize] at (1.7,-1.1) {$v_Y=-Av_X$};
  \node at (4.6,0) {$\Longrightarrow$};
  % right: split
  \begin{scope}[xshift=6cm]
    \draw (0,0) node[ocirc]{} node[left] {$X$} -- (1.6,0);
    \draw (1.6,-0.7) -- (1.6,0.7) -- (3.0,0) -- cycle;
    \node at (2.05,0) {$-A$};
    \draw (3.0,0) -- (4.6,0) node[ocirc]{} node[right] {$Y$};
    \draw (0.8,0) node[circ]{} to[C, l_=$(1{+}A)C_F$] (0.8,-1.8) node[ground]{};
    \draw (3.8,0) node[circ]{} to[C, l=$(1{+}\frac1A)C_F$] (3.8,-1.8) node[ground]{};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_1 = \frac{Z}{1-A_v},\qquad Z_2 = \frac{Z}{1-1/A_v},\qquad A_v = \frac{V_Y}{V_X}}
\qquad
\boxed{C_{in} = (1+A)C_F\ \text{ for } A_v=-A}
$$

**Why $(1+A)$:** step $X$ by $\Delta V$ and $Y$ moves by $-A\Delta V$. The voltage across $C_F$ changes by $(1+A)\Delta V$, so the input must supply $(1+A)C_F\Delta V$ of charge.

**Miller's approximation** uses the *low-frequency* $A_v$. It costs you three things:
1. It can **lose zeros** (the CS feedthrough zero vanishes).
2. It can **invent poles** (it predicts two poles where the exact answer has one).
3. It gives the **wrong output impedance**: the gain $V_X/V_Y$ measured from the output is not $1/A_v$.

It is invalid when $Z$ is the **only** signal path from $X$ to $Y$ (a resistive divider gives the right input impedance and the wrong gain). It is valid when $Z$ is in parallel with the main amplifying path.

> [!tip] Remark
> The capacitor being multiplied is almost always $C_{GD} = WC_{ov}$, the overlap capacitance from [[MosFETs#Capacitances]]. It is small, but it sits across the full stage gain.

> [!note]- Derivation: exact vs Miller on one capacitor (Razavi Ex. 6.4)
> Ideal amp $-A$ with output resistance $R_{out}$, driven through $R_S$, $C_F$ from input to output. Exact:
> $$\frac{V_{out}}{V_{in}} = \frac{R_{out}C_Fs - A}{[(1+A)R_SC_F + R_{out}C_F]s+1}$$
> one pole and an RHP zero at $A/(R_{out}C_F)$. Miller gives $\dfrac{-A}{[(1+A)R_SC_Fs+1][R_{out}C_Fs/(1+A^{-1})+1]}$: two poles, no zero. The input pole agrees. Multiplying $C_F$ by $1+A(s)$ instead of $1+A$ would fix both artifacts, but the algebra is as long as the exact analysis.

> [!note]- Detail: why Miller still works at the CS pole (Razavi Ex. 6.6)
> The overall gain has fallen by $\sqrt2$ at $\omega_0$, so why multiply $C_{GD}$ by the full $1+g_mR_D$? Because the gain $C_{GD}$ sees is $V_{out}/V_X = (C_{GD}s-g_m)R_D/(R_DC_{GD}s+1)$, which only starts rolling off at $1/(R_DC_{GD})$, far above the input pole.

> [!note]- Detail: Miller as a capacitance multiplier (Razavi Ex. 6.2; Carusone §4.2.3)
> Putting a small $C$ across a high-gain inverting amplifier gives a large grounded capacitor on-chip. The price is swing: if the input moves $V_0$, the amplifier output must swing $AV_0$ without clipping, and the input DC level must suit the amplifier.

### Zero-Value Time Constants

$$
\boxed{\omega_{-3\text{dB}} \approx \frac{1}{\sum_k R_kC_k}}
$$

Procedure (Carusone §4.2.4):
1. Zero the independent sources (voltage → short, current → open).
2. For each capacitor $C_k$, open every other capacitor. Replace $C_k$ with a test source and find the DC resistance $R_k$ it sees.
3. Add all the $R_kC_k$. The inverse of the sum is the bandwidth.

> [!tip] Remark
> Unlike Miller, this is not a guess. $\sum R_kC_k$ is **exactly** the coefficient of $s$ in the denominator, $\sum 1/\omega_{pi}$. The only approximation is assuming one pole dominates and ignoring zeros. It also ranks the capacitors: the largest $R_kC_k$ is the one to attack.

- **Pessimistic** without a dominant pole: two coincident poles at $\omega$ give an estimate of $\omega/2$; the true $-3$ dB point is $0.64\,\omega$.
- Says nothing about zeros. An LHP zero in band makes the real bandwidth wider than the estimate; an RHP zero damages the phase without changing $\sum R_kC_k$.
- A single $R_kC_k$ is **not** a pole. Only the sum means something.
- A negative $R_k$ (a capacitively loaded follower) warns of instability, not bandwidth.

> [!note]- Derivation: why the sum of time constants is the $s$ coefficient (Razavi App. B)
> The denominator is $1 + B_ss + \dots$ with $B_s = \sum_i \omega_{pi}^{-1}$. Each $C_i$ enters the nodal determinant linearly, and $B_s$ has units of time, so $B_s = \sum R_iC_i$ with capacitance-free $R_i$. Set every $C_j=0$ except $C_i$: the circuit is first order with $D = 1 + R_iC_is$, and a one-capacitor circuit's pole is $1/(R_iC_i)$ with $R_i$ the resistance that capacitor sees. Check on an RC ladder $R_1, C_1, R_2, C_2$: $B_s = R_1C_1 + (R_1+R_2)C_2$, exactly the zero-value sum.

> [!note]- Extension: the low-frequency edge uses short-circuit time constants (Zettelkasten 5i2, after Gray et al. §7.3, Sedra & Smith §10.9)
> AC-coupled stages with coupling or bypass capacitors also roll off at the **bottom**. Use the dual method: for each large capacitor, **short** the others and find the resistance it sees, $R_{is}$. Then
> $$\omega_L \approx \sum_i \frac{1}{R_{is}C_i}$$
> a sum of pole frequencies, dominated by the **largest** term. That is usually a bypass capacitor across a source resistor, which sees only about $1/g_m$. Fully DC-coupled IC amplifiers have no low edge.

### Finding Zeros by Inspection

- **Output-null trick:** a zero $s_z$ makes $V_{out}(s_z) = 0$. Short the output and find the $s$ at which no current flows into the short. For the CS stage, $V_1C_{GD}s_z = g_mV_1$, so $s_z = +g_m/C_{GD}$ (Razavi Fig. 6.18).
- **Two parallel paths make a zero**, even if each is a simple low-pass (Razavi Ex. 6.8). Paths with the same sign give an LHP zero. A feedforward path that fights the main path gives an RHP zero.

## Level 2: The Basic Stages at High Frequency

> [!tip] Remark
> Low-frequency gains, $R_{out}$ and $R_{in}$ for every stage below come from [[Single-Stage]]. Each section here adds only the capacitors: $C_{GS}$, $C_{GD}$, $C_{DB}$, $C_{SB}$ from [[MosFETs#Capacitances]], plus the load $C_L$.

### Common Source

```tikz title="CS stage with all device capacitances. R_S models the driving stage's output resistance. After Razavi Fig. 6.13(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M){};
  \node[anchor=west] at (0.1,-0.3) {$M_1$};
  \draw (M.S) node[ground]{};
  \draw (M.D) -- ++(1.6,0) coordinate (O) node[circ]{};
  \draw (O) to[R, l_=$R_D$] ++(0,2) node[vcc]{$V_{DD}$};
  \draw (O) -- ++(1.2,0) coordinate (P) node[circ]{} -- ++(1,0) node[ocirc]{} node[right] {$V_{out}$};
  \draw (P) to[C, l=$C_{DB}{+}C_L$] ++(0,-1.9) node[ground]{};
  \draw (M.G) -- ++(-0.8,0) coordinate (X) node[circ]{};
  \node[above left] at (X) {$X$};
  \draw (X) to[R, l_=$R_S$] ++(-2.2,0) node[ocirc]{} node[left] {$V_{in}$};
  \draw (X) to[C, l_=$C_{GS}$] ++(0,-1.75) node[ground]{};
  \draw (X) -- ++(0,1.6) to[C, l=$C_{GD}$] ($(M.D)+(0.7,1.6-0.77)$) -- ($(M.D)+(0.7,0)$) node[circ]{};
\end{circuitikz}
\end{document}
```

**Miller estimate (one pole per node):**

$$
\boxed{\omega_{in} = \frac{1}{R_S\left[C_{GS} + (1+g_mR_D)C_{GD}\right]}}
\qquad
\boxed{\omega_{out} \approx \frac{1}{R_D(C_{GD}+C_{DB})}}
$$

**Exact** (three capacitors in a loop, so only second order):

$$
\boxed{\frac{V_{out}}{V_{in}} = \frac{(C_{GD}s - g_m)R_D}{R_SR_D\xi s^2 + \left[R_S(1+g_mR_D)C_{GD} + R_SC_{GS} + R_D(C_{GD}+C_{DB})\right]s + 1}},\quad \xi = C_{GS}C_{GD}+C_{GS}C_{DB}+C_{GD}C_{DB}
$$

**Read with the dominant-pole approximation:**

$$
\boxed{\omega_{p1} \approx \frac{1}{R_S(1+g_mR_D)C_{GD} + R_SC_{GS} + R_D(C_{GD}+C_{DB})}}
\qquad
\boxed{\omega_{p2} \approx \frac{R_S(1+g_mR_D)C_{GD} + R_SC_{GS} + R_D(C_{GD}+C_{DB})}{R_SR_D\,\xi}}
\qquad
\boxed{\omega_z = +\frac{g_m}{C_{GD}}\ \text{(RHP)}}
$$

- $\omega_{p1}$ is the Miller input pole plus one extra term, $R_D(C_{GD}+C_{DB})$. The zero-value method gives exactly this (Carusone Eq. 4.152).
- When the Miller term dominates, $\omega_{p2}\approx g_mC_{GD}/\xi$ (Carusone Eq. 4.128). $\omega_{p2}$ and $\omega_z$ both scale with $g_m$: more $g_m$ pushes both out.
- The RHP zero comes from **feedthrough**: at high frequency $C_{GD}$ carries the input straight to the output, against the inverted main path. The slope then flattens from $-40$ to $-20$ dB/dec, but the phase keeps falling (diagram above). $g_m/C_{GD} > g_m/C_{GS}$, so this zero sits above $f_T$. It moves down when you deliberately add gate-drain capacitance ([[Stability]], Miller compensation).
- The "output pole" $1/[R_D(C_{GD}+C_{DB})]$ is valid only when $C_{GS}$ dominates. In general take $\omega_{p2}$ from the exact form.

> [!important] Large load: Miller disappears
> With a current-source load ($R_D\to\infty$) and a large $C_{DB}+C_L$, the second pole becomes $\omega_{p2}\approx 1/[R_S(C_{GS}+C_{GD})]$: **no** Miller multiplication. The big output capacitance kills the gain from $X$ to the output before $\omega_{p2}$ is reached, so $C_{GD}$ sees almost no gain. This is the main case where the low-frequency Miller estimate is badly wrong (Razavi Ex. 6.7).

> [!note]- Derivation: nodal analysis of the CS stage (Razavi Eqs. 6.26–6.30; Carusone Eqs. 4.116–4.123)
> KCL at $X$: $\dfrac{V_X-V_{in}}{R_S} + V_XC_{GS}s + (V_X-V_{out})C_{GD}s = 0$.
> KCL at the output: $(V_{out}-V_X)C_{GD}s + g_mV_X + V_{out}\left(\dfrac1{R_D}+C_{DB}s\right) = 0$, so $V_X = -V_{out}\dfrac{C_{GD}s + 1/R_D + C_{DB}s}{g_m - C_{GD}s}$.
> Substituting gives the boxed second-order form. Second order with three capacitors because $C_{GS}$, $C_{GD}$, $C_{DB}$ form a loop: only two independent initial voltages.
>
> With $R_D\to\infty$ (Razavi Ex. 6.7):
> $$\frac{V_{out}}{V_{in}} = \frac{C_{GD}s-g_m}{s\left[R_S\xi s + (1+g_mR_S)C_{GD} + C_{DB}\right]},\qquad |\omega_{p2}| \approx \frac{(1+g_mR_S)C_{GD}+C_{DB}}{R_S\xi}$$
> which tends to $1/[R_S(C_{GS}+C_{GD})]$ as $C_{DB}$ grows.

> [!note]- Detail: input impedance at high frequency (Razavi Eqs. 6.45–6.47, Ex. 6.10)
> Low frequency: $Z_{in} = 1/\{[C_{GS}+(1+g_mR_D)C_{GD}]s\}$, purely capacitive. Including the output node (and ignoring $C_{GS}$ for the moment):
> $$\frac{V_X}{I_X} = \frac{1+R_D(C_{GD}+C_{DB})s}{C_{GD}s\,(1+g_mR_D+R_DC_{DB}s)}$$
> in parallel with $1/(C_{GS}s)$. At high frequency it has a real part: $C_{GD}$ nearly shorts gate to drain, so $1/g_m\parallel R_D$ appears across the input. With a large load capacitance it collapses to $1/(C_{GD}s)$: again no Miller.

> [!note]- Detail: output pole when $R_S$ is large (Razavi Eqs. 6.23–6.24)
> Ignoring $R_S$, the impedance looking into the drain through $C_{GD}$ and $C_{GS}$ is $Z_X = \frac{1}{C_{eq}s}\parallel\frac{C_{GD}+C_{GS}}{C_{GD}}\frac1{g_m}$, with $C_{eq} = C_{GD}C_{GS}/(C_{GD}+C_{GS})$. So $\omega_{out}\approx 1/\left[\left(R_D\parallel\frac{C_{GD}+C_{GS}}{C_{GD}g_m}\right)(C_{eq}+C_{DB})\right]$. $C_{GD}$ acts as a diode connection at high frequency.

> [!note]- Detail: designing a CS stage for bandwidth (Carusone Exs. 4.10–4.12)
> - **Miller-dominated** (large $R_S$, modest $C_L$): shrink $W$ to shrink $C_{GD}$, which means high $V_{eff}$. Stop around $V_{eff}\approx 1/(2\theta)$ ($\approx 300$ mV in Carusone's 0.18 µm example) before mobility degradation eats the gain. Use all the available current: at fixed $V_{eff}$, more $I_D$ raises $g_m$ and lowers $r_{ds}$ together, so gain stays put while $R_2$ in the $R_2(C_{gd}+C_2)$ term falls.
> - **Load-dominated** (large $C_L$, small $R_S$): $\omega_{-3\text{dB}}\approx 1/[(r_{ds1}\parallel r_{ds2})C_L]$. For minimum power use short $L$ (large $\lambda$) to hit the needed $r_{ds}$ at low current, then wide $W$ and small $V_{eff}$ (100 mV in the example) for gain.
> - Worked number (Ex. 4.10): $R_s = 180$ kΩ, $C_L = 0.3$ pF, $R_2 = 77$ kΩ. The $R_s$ terms total 0.26 µs against 0.03 µs at the output, so $f_{-3\text{dB}}\approx 550$ kHz is set almost entirely by Miller.

> [!note]- Detail: complementary CS (Razavi Ex. 6.9)
> An NMOS and PMOS sharing gate and drain merge into one device with $g_{m1}+g_{m2}$, $r_{O1}\parallel r_{O2}$ and summed capacitances. Same transfer function as the plain CS.

### Source Follower

$$
\boxed{\frac{V_{out}}{V_{in}} = \frac{g_m + C_{GS}s}{R_S(C_{GS}C_L+C_{GS}C_{GD}+C_{GD}C_L)s^2 + (g_mR_SC_{GD}+C_L+C_{GS})s + g_m}}
\qquad
\boxed{\omega_{p1}\approx\frac{1}{R_SC_{GD} + \dfrac{C_L+C_{GS}}{g_m}}}
$$

- **LHP zero** at $g_m/C_{GS}$, near $f_T$. The signal through $C_{GS}$ adds to the transistor's own signal with the same sign.
- **Bootstrapping:** with $C_L=0$ the response is just $1/(1+R_SC_{GD}s)$. The source follows the gate, so $C_{GS}$ carries no current and drops out entirely. With body effect the input capacitance is $C_{GD} + C_{GS}\,g_{mb}/(g_m+g_{mb})$, a small fraction of $C_{GS}$. Low input capacitance is the main reason to use a follower.
- $R_S = 0$ gives $\omega_{p1} = g_m/(C_L+C_{GS})$.

```tikz title="Follower output impedance rises from 1/g_m to R_S. With R_S > 1/g_m (the normal buffer case) it is inductive, modelled by R_1, L, R_2. After Razavi Figs. 6.28–6.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % follower
  \draw (0,0) node[nmos](M){};
  \draw (M.D) node[vcc]{$V_{DD}$};
  \draw (M.G) to[R, l_=$R_S$] ++(-2,0) -- ++(0,-0.6) node[ground]{};
  \draw (M.S) -- ++(0,-0.4) coordinate (O) node[circ]{} -- ++(0.9,0) node[ocirc]{} node[right] {$Z_{out}$};
  \draw (O) to[I, l=$I_{bias}$] ++(0,-1.6) node[ground]{};
  \node[anchor=west] at (0.1,0.3) {$M_1$};
  % plot
  \begin{scope}[xshift=4.6cm,yshift=-2.2cm]
    \draw[->] (0,0) -- (4.4,0) node[right] {$\log\omega$};
    \draw[->] (0,0) -- (0,3) node[above] {$|Z_{out}|$};
    \draw[very thick] (0,0.7) -- (1.4,0.7) -- (2.8,2.2) -- (4.1,2.2);
    \draw[dashed] (0,2.2) -- (2.8,2.2);
    \node[left,font=\scriptsize] at (0,0.7) {$1/g_m$};
    \node[left,font=\scriptsize] at (0,2.2) {$R_S$};
    \draw[dotted] (1.4,0) -- (1.4,0.7);
    \draw[dotted] (2.8,0) -- (2.8,2.2);
    \node[below,font=\scriptsize] at (1.4,0) {$\frac{1}{R_SC_{GS}}$};
    \node[below,font=\scriptsize] at (2.8,0) {$\frac{g_m}{C_{GS}}$};
    \node[font=\scriptsize,anchor=north west,align=left] at (1.9,1.3) {rises:\\ inductive};
  \end{scope}
  % equivalent
  \begin{scope}[xshift=11.3cm,yshift=-2.2cm]
    \draw (0,3) node[ocirc]{} node[above] {$Z_{out}$} -- (0,2.6) coordinate (T);
    \draw (T) -- (-0.7,2.6) to[R, l_=$R_1$] (-0.7,1.2) -- (0.7,1.2) to[L, l_=$L$] (0.7,2.6) -- (T);
    \draw (0,1.2) to[R, l=$R_2$] (0,-0.2) node[ground]{};
    \node[font=\scriptsize,align=left,anchor=west] at (1.4,1.6) {$R_2=1/g_m$\\ $R_1=R_S-1/g_m$\\ $L=\frac{C_{GS}}{g_m}\!\left(R_S-\frac1{g_m}\right)$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_{out} = \frac{R_SC_{GS}s+1}{g_m+C_{GS}s}}
\qquad
\boxed{L = \frac{C_{GS}}{g_m}\left(R_S-\frac1{g_m}\right)}
$$

> [!warning] Followers ring
> An inductive output driving a capacitor is a resonator. Seen from the input, a follower loaded by $C_L$ at high frequency is $C_{GS}$ in series with $C_L$ and a **negative resistance** $-g_m/(C_{GS}C_L\omega^2)$. The poles can go complex: overshoot and ringing, even oscillation (Razavi Fig. 6.26; Carusone §4.4). Check $Q$ (or run a transient). If it rings, add load or input capacitance, or use the compensation network below.

> [!tip] Remark
> $C_{GS}/g_m\approx 1/\omega_T$ ([[MosFETs#Full Small-Signal Model and $f_T$|$f_T$]]). So the follower inductance is $L\approx(R_S-1/g_m)/\omega_T$: a slow device or a high source resistance makes it worse.

> [!note]- Derivation: input impedance with body effect (Razavi Eqs. 6.57–6.60)
> $$Z_{in} = \frac1{C_{GS}s} + \left(1+\frac{g_m}{C_{GS}s}\right)\frac{1}{g_{mb}+C_Ls}$$
> Low frequency ($g_{mb}\gg|C_Ls|$): $Z_{in}\approx\frac1{C_{GS}s}\left(1+\frac{g_m}{g_{mb}}\right)+\frac1{g_{mb}}$, a capacitance $C_{GS}g_{mb}/(g_m+g_{mb})$. Miller gives the same: the gate-to-source gain is $g_m/(g_m+g_{mb})$, so $C_{GS}$ is multiplied by $1-g_m/(g_m+g_{mb})$.
> High frequency ($g_{mb}\ll|C_Ls|$): $Z_{in}\approx\frac1{C_{GS}s}+\frac1{C_Ls}+\frac{g_m}{C_{GS}C_Ls^2}$. With $s=j\omega$ the last term is $-g_m/(C_{GS}C_L\omega^2)$, real and negative.

> [!note]- Detail: $\omega_0$, $Q$ and the compensation network (Carusone Eqs. 4.199–4.220, Exs. 4.16–4.17)
> Norton drive $i_{in}$, $R_{in}$, $C'_{in} = C_{in}+C_{gd1}$; $G_{s1} = g_{s1}+g_{ds1}+g_{ds2}$ at the output; $C_s = C_L + C_{sb1}$.
> $$\omega_0 = \sqrt{\frac{G_{in}(g_{m1}+G_{s1})}{C_{gs1}C_s + C'_{in}(C_{gs1}+C_s)}},\qquad Q = \frac{\sqrt{G_{in}(g_{m1}+G_{s1})\,[C_{gs1}C_s + C'_{in}(C_{gs1}+C_s)]}}{G_{in}(C_{gs1}+C_s) + C'_{in}(g_{m1}+G_{s1}) + C_{gs1}G_{s1}}$$
> Large $C_s$ or $C'_{in}$ makes $Q$ small: one real dominant pole $\approx g_{m1}/C_s$. Small $C'_{in}$, small $G_{in}$ and $C_s\approx C_{gs1}$ give high $Q$. Example 4.16: $\omega_0 = 2\pi\times680$ MHz, $Q = 0.554$, overshoot 0.13%, zero at 39 GHz.
> **Fix:** the gate admittance equals $C_2 = C_{gs1}C_s/(C_{gs1}+C_s)$ in parallel with a series $-R_1$, $-C_1$. Add a real series $R_1$–$C_1$ from the gate to ground, with $C_1\approx g_{m1}C_{gs1}C_s/[(g_{m1}+G_{s1})(C_{gs1}+C_s)]$ and $R_1\approx(C_{gs1}+C_s)^2/(C_{gs1}C_sg_{m1})$. The negative elements cancel and the poles become real: $p_1\approx G_{in}/(C'_{in}+C_{gs1})$, $p_2\approx(g_{m1}+G_{s1})/(C_{gs}+C_L)$. Inside an op-amp loop whose unity-gain frequency is well below $\omega_0$, the overshoot can simply be tolerated.

> [!note]- Detail: active inductor (Razavi Ex. 6.14)
> A follower whose gate is fed through $R_S$ from a supply is a two-terminal inductor $L = (C_{GS2}/g_{m2})(R_S-1/g_{m2})$, with parallel loss $R_S - 1/g_{m2}$ and series loss $1/g_{m2}$. As the load of a CS stage it partly cancels $C_L$ and extends bandwidth. It costs a $V_{GS}$ of headroom, and $C_{GD2}$ limits the gain in bandwidth.

### Common Gate

$$
\boxed{\frac{V_{out}}{V_{in}} = \frac{(g_m+g_{mb})R_D}{1+(g_m+g_{mb})R_S}\cdot\frac{1}{(1+s/\omega_{in})(1+s/\omega_{out})}},\quad
\omega_{in} = \frac{1}{(C_{GS}+C_{SB})\left(R_S\parallel\frac1{g_m+g_{mb}}\right)},\quad
\omega_{out} = \frac1{R_D(C_{GD}+C_{DB})}
$$

- Every capacitor is grounded (gate at AC ground), so there is **no Miller multiplication** and the two nodes are isolated when $r_o$ is neglected. The input node is fast because it sees only about $1/g_m$.
- The costs are a low input impedance that loads the driver and a low input DC level. So CG is used where a low $R_{in}$ is wanted, and as the top device of a cascode.
- With $r_o$, $Z_{in}\approx Z_L/[(g_m+g_{mb})r_o] + 1/(g_m+g_{mb})$ depends on the load, and the nodes interact. A large $C_L$ shorts $Z_L$ at high frequency, and $Z_{in}$ falls back to $1/(g_m+g_{mb})$ (Razavi Ex. 6.15).

> [!warning] Gate resistance brings the Miller effect back
> A resistance $R_G$ in series with the gate (bias network, poly) adds straight to $R_S$: $\omega_p = (1+g_mR_S)/[(R_G+R_S)C_{GS}]$. The time constant of $C_{GD}$ grows to $\left[R_D + \left(1+\frac{g_mR_D}{1+g_mR_S}\right)R_G\right]C_{GD}$. A CG stage with $R_G$ is **topologically identical** to a CS stage with source degeneration: same zero-value time constants, same poles (Razavi Exs. 6.21, 6.23). "CG has no Miller effect" holds only because the gate is kept at a low-impedance AC ground.

> [!note]- Detail: CG transfer function with $r_o$ and $C_L$ (Razavi Ex. 6.15)
> $$\frac{V_{out}}{V_{in}} = \frac{1+g_mr_O}{r_OC_LC_{in}R_Ss^2 + [r_OC_L + C_{in}R_S + (1+g_mr_O)C_LR_S]s + 1}$$
> (replace $g_m$ by $g_m+g_{mb}$ for body effect), and $\omega_{p,in} = 1/[(R_S\parallel\frac1{g_m+g_{mb}})C_{in}]$ once $C_L$ dominates.

> [!note]- Detail: zero-value analysis of the CG stage (Carusone §4.2.6)
> With a Norton drive: $\tau_1 = (r_{in}\parallel R_s)C_{gs}\approx C_{gs}/g_m$ (using $r_{in}\approx\frac1{g_m}(1+R_L/r_{ds})$) and $\tau_2 = (R_L\parallel r_{d1})C_2\approx R_LC_2$ with $r_{d1} = r_{ds}(1+g_mR_s)$. $\omega_{-3\text{dB}}\approx 1/(\tau_1+\tau_2)$. Neither term contains a gain factor.

### Cascode

```tikz title="Cascode: three nodes, three poles. After Razavi Fig. 6.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (0,3.4) node[nmos](M2){};
  \node[anchor=west] at (0.1,-0.3) {$M_1$};
  \node[anchor=west] at (0.1,3.1) {$M_2$};
  \draw (M1.S) node[ground]{};
  \draw (M1.D) -- (M2.S);
  \draw (M2.G) -- ++(-0.4,0) node[left] {$V_b$};
  % node X
  \coordinate (X) at ($(M1.D)!0.5!(M2.S)$);
  \draw (X) node[circ]{} -- ++(1.5,0) coordinate (Xc);
  \draw (Xc) to[C, l=$C_X$] ++(0,-1.5) node[ground]{};
  \node[anchor=south west,font=\scriptsize] at (X) {$X$};
  % node Y
  \draw (M2.D) -- ++(0,0.3) coordinate (Y) node[circ]{};
  \draw (Y) to[R, l_=$R_D$] ++(0,1.8) node[vcc]{$V_{DD}$};
  \draw (Y) -- ++(3.3,0) coordinate (Yc) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right] {$V_{out}$};
  \draw (Yc) to[C, l=$C_Y$] ++(0,-1.6) node[ground]{};
  \node[anchor=south east,font=\scriptsize] at (Y) {$Y$};
  % node A
  \draw (M1.G) -- ++(-0.8,0) coordinate (A) node[circ]{};
  \node[above left,font=\scriptsize] at (A) {$A$};
  \draw (A) to[R, l_=$R_S$] ++(-2,0) node[ocirc]{} node[left] {$V_{in}$};
  \draw (A) to[C, l_=$C_{GS1}$] ++(0,-1.7) node[ground]{};
  \draw (A) |- ($(X)+(-1.4,0)$) to[C, l=$C_{GD1}$] (X);
  % annotations
  \node[font=\scriptsize,align=left,anchor=west] at (3.6,-1.3) {$C_X = C_{DB1}{+}C_{SB2}{+}C_{GS2}$\\ $C_Y = C_{DB2}{+}C_{GD2}{+}C_L$\\[2pt] $R_X\approx 1/g_{m2}$ (small $R_D$): $v_X/v_A\approx -g_{m1}/g_{m2}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_{p,A} = \frac{1}{R_S\left[C_{GS1} + \left(1+\frac{g_{m1}}{g_{m2}+g_{mb2}}\right)C_{GD1}\right]}}
\qquad
\boxed{\omega_{p,X} = \frac{g_{m2}+g_{mb2}}{2C_{GD1}+C_{DB1}+C_{SB2}+C_{GS2}}}
\qquad
\boxed{\omega_{p,Y} = \frac1{R_D(C_{DB2}+C_L+C_{GD2})}}
$$

- $M_2$ holds node $X$ at about $1/g_{m2}$, so the gain from $A$ to $X$ is about $-g_{m1}/g_{m2}\approx -1$ and **$C_{GD1}$ is multiplied by about 2**, not $1+g_mR_D$. A cascode has the input impedance of a CS stage and the speed of a CG stage.
- $\omega_{p,X}\approx g_{m2}/C_{GS2}$ minus the extra capacitance, roughly **$\omega_T/2$**. It is usually the highest of the three.
- **Current-source load:** at DC the resistance at $X$ is large (looking up into $M_2$ sees the big load). But near $\omega_{p,X}$ the load capacitance has already shorted the output, so the pole at $X$ stays at $g_{m2}/C_X$ (Razavi Ex. 6.16).

> [!warning] The "Miller ×2" needs a low-impedance output at the frequency of interest
> With a high-impedance cascode load and a large $R_S$, the low-frequency gain from $A$ to $X$ is no longer $-1$, and the zero-value time constant of $C_{GD1}$ becomes $\tau_{gd1}\approx C_{gd1}g_mr_{ds}^2/2$, **almost as large as in a plain CS stage** (Carusone Eq. 4.173). The factor-2 picture comes back only above $1/(r_{ds}C_L)$, where $C_L$ shorts the output and $Y_{in2}\to g_{m2}$ (Carusone Eqs. 4.185–4.186): $\omega_{in}\approx 1/[R_s(C_{gs1}+2C_{gd1})]$.

$$
\boxed{\omega_{-3\text{dB}}\approx\frac1{R_{out}C_{out}}\approx\frac{2g_{ds}^2}{g_mC_{out}},\qquad \omega_{s2}\approx\frac{g_{m2}}{C_{s2}} < \omega_{T2}\approx\frac{3\mu V_{eff2}}{2L_2^2}}
$$

- A high-gain cascode with $R_{out}\approx g_mr_{ds}^2/2$ and real load capacitance is a **one-pole** amplifier set by the output node. Above that pole, $A(s)\approx -g_{m1}/(sC_L)$.
- The second pole, at the cascode node, cannot exceed the cascode device's $f_T$. That caps the unity-gain frequency of **any** feedback amplifier built on the stage. Note the $1/L_2^2$.

> [!tip] Remark
> Same device ceiling as [[MosFETs#Full Small-Signal Model and $f_T$|$f_T\approx 3\mu V_{OV}/(4\pi L^2)$]]. A folded cascode uses a PMOS $M_2$ (lower $\mu$), so its second pole and its maximum unity-gain frequency are lower than a telescopic cascode's. See [[Single-Stage#Cascode]].

> [!note]- Detail: cascode output impedance rolls off (Razavi Eq. 6.86)
> Ignoring $C_{GD1}$ and $C_Y$: $Z_{out} = (1+g_{m2}r_{O2})Z_X + r_{O2}$ with $Z_X = r_{O1}\parallel(C_Xs)^{-1}$. The famous $g_mr_o^2$ output resistance has a pole at $1/(r_{O1}C_X)$, low because $r_{O1}$ is large. A cascode current source is a good current source only at low frequency.

> [!note]- Detail: worked numbers (Carusone Exs. 4.13–4.15)
> $g_m = 1$ mA/V, $r_{ds} = 100$ kΩ, $C_{gs} = 0.2$ pF, $C_{gd} = 15$ fF, $R_s = 180$ kΩ, $C_L = 5$ pF, high-impedance load. $\tau_{gs1} = 36$ ns, $\tau_{gd1}\approx 75$ ns, $\tau_{s2}\approx 13$ ns, $\tau_{out}\approx 25.3$ µs, giving $f_{-3\text{dB}}\approx 6.3$ kHz. Using $\tau_{out}$ alone gives the same answer: the output node is all that matters.
> Folded cascode in 0.18 µm with $L_2 = 0.27$ µm, $V_{eff2} = 0.25$ V, $\mu_p = 0.0082$ m²/Vs: $\omega_{s2} < 2\pi\times 6.7$ GHz. Leaving margin for uncertainty and temperature, a practical unity-gain frequency is about a quarter of that, around 1.5 GHz.

### Differential Pair

- **Differential mode, passive or current-source loads:** the half circuit **is** a CS stage. Every CS result above applies, Miller included: $\omega_{-3\text{dB}}\approx 1/\{R_s[C_{gs1}+C_{gd1}(1+g_{m1}R_2)]\}$. Both outputs share the same transfer function, so the number of poles does not double. With current-source loads the output pole $1/[(r_{O1}\parallel r_{O3})C_L]$ is usually dominant. The PMOS gate node $G$ is an AC ground for differential signals.
- **Common mode:** the tail node capacitance $C_P$ ($C_{GD3}$, $C_{DB3}$, $C_{SB1}$, $C_{SB2}$) shunts $r_{O3}$. CMRR falls above $1/(r_{O3}C_P)$. A wide tail device (chosen for headroom) means a big $C_P$, so low supply voltage costs high-frequency CMRR. Supply noise then turns into differential noise through mismatch.

$$
\boxed{\text{CMRR}\approx\frac{g_m}{\Delta g_m}\cdot\frac{r_{O3}C_Ps + 1 + 2g_mr_{O3}}{r_{O3}C_Ps+1}:\quad\text{pole at }\frac1{r_{O3}C_P},\ \text{zero at}\approx\frac{2g_m}{C_P}}
$$

```tikz title="Five-transistor OTA: a slow path through the mirror and a fast path straight across. After Razavi Figs. 6.40–6.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (3,0) node[nmos,xscale=-1](M2){};
  \node[anchor=east] at (-0.45,0.55) {$M_1$};
  \node[anchor=west] at (3.45,0.55) {$M_2$};
  \draw (0,2.6) node[pmos,xscale=-1](M3){};
  \draw (3,2.6) node[pmos](M4){};
  \node[anchor=east] at (-0.1,2.9) {$M_3$};
  \node[anchor=west] at (3.1,2.9) {$M_4$};
  \draw (M1.D) -- (M3.D);
  \draw (M2.D) -- (M4.D);
  \draw (M3.S) -- ++(0,0.3) -- ($(M4.S)+(0,0.3)$) -- (M4.S);
  \draw ($(M3.S)!0.5!(M4.S)+(0,0.3)$) node[vcc]{$V_{DD}$};
  \draw (M3.G) -- (M4.G);
  \coordinate (E) at ($(M1.D)!0.5!(M3.D)$);
  \draw (E) node[circ]{} -| ($(M3.G)!0.5!(M4.G)$) node[circ]{};
  \node[anchor=east,font=\scriptsize] at (E) {$E$};
  \coordinate (O) at ($(M2.D)!0.5!(M4.D)$);
  \draw (O) node[circ]{} -- ++(2.6,0) coordinate (Oc) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right] {$V_{out}$};
  \draw (Oc) to[C, l=$C_L$] ++(0,-1.6) node[ground]{};
  \draw (M1.S) -- ($(M2.S)$);
  \draw ($(M1.S)!0.5!(M2.S)$) to[I, l=$I_{SS}$] ++(0,-1.5) node[ground]{};
  \draw (M1.G) -- ++(-0.3,0) node[left] {$v_{in}^+$};
  \draw (M2.G) -- ++(0.3,0) node[right] {$v_{in}^-$};
  \node[font=\scriptsize,align=center,red!70!black] at (-2.2,1.3) {mirror pole\\ $\omega_{p2}\approx g_{m3}/C_E$};
  \node[font=\scriptsize,align=center,blue!70!black] at (7.0,2.4) {output pole\\ $\omega_{p1}\approx \frac{1}{(r_{oN}\|r_{oP})C_L}$};
  \node[font=\scriptsize,align=left] at (7.6,-1.6) {slow path: $M_1{\to}M_3{\to}M_4$\\ fast path: $M_1{\to}M_2$ (via tail)\\ LHP zero at $2\omega_{p2}$};
\end{circuitikz}
\end{document}
```

**Active (mirror) load:**

$$
\boxed{\omega_{p1}\approx\frac{1}{(r_{ON}\parallel r_{OP})C_L},\qquad \omega_{p2}\approx\frac{g_{mP}}{C_E},\qquad \omega_z\approx\frac{2g_{mP}}{C_E}\ \text{(LHP)}}
$$

- $C_E$ is $C_{GS3}+C_{GS4}+C_{DB3}+C_{DB1}$ plus the Miller parts of $C_{GD1}$ and $C_{GD4}$. PMOS devices have poor $g_m$ per unit $C_{GS}$, so the **mirror pole** matters even when only $C_{GS3}+C_{GS4}$ is counted.
- **The zero:** half the signal takes the slow path ($M_1\to M_3\to M_4$, two poles) and half the fast path ($M_1\to M_2$, one pole). Adding $\frac{A_0}{1+s/\omega_{p1}}\left(\frac{1}{1+s/\omega_{p2}}+1\right)$ gives a zero at $2\omega_{p2}$. The pole-zero doublet slows settling.
- A fully differential pair with current-source loads has **no mirror pole**, one more advantage of fully differential design. But folding the signal current through mirrors ($M_3$–$M_5$) brings one back even in a fully differential circuit (Razavi Ex. 6.17).

> [!tip] Remark
> The tail, half-circuit and mirror-load results are the [[Differential Amplifiers]] and [[Current Mirrors]] DC analyses with $r\to r\parallel 1/(Cs)$. Nothing new beyond the capacitors.

> [!note]- Derivation: active-load transfer function (Razavi Eqs. 6.90–6.96)
> Thevenin the input pair: $V_X = g_{mN}r_{ON}V_{in}$, $R_X = 2r_{ON}$ (assuming $1/g_{mP}\ll r_{OP}$). Then
> $$\frac{V_{out}}{V_{in}} = \frac{g_{mN}r_{ON}(2g_{mP}+C_Es)r_{OP}}{2r_{OP}r_{ON}C_EC_Ls^2 + [(2r_{ON}+r_{OP})C_E + r_{OP}(1+2g_{mP}r_{ON})C_L]s + 2g_{mP}(r_{ON}+r_{OP})}$$
> Dominant pole: $\omega_{p1}\approx 2g_{mP}(r_{ON}+r_{OP})/[(2r_{ON}+r_{OP})C_E + r_{OP}(1+2g_{mP}r_{ON})C_L]\to 1/[(r_{ON}\parallel r_{OP})C_L]$. Second pole $\approx g_{mP}/C_E$. Zero at $-2g_{mP}/C_E$.

> [!note]- Detail: the single-ended pair is a follower driving a CG stage (Carusone §4.5.3)
> Drive $Q_1$, ground $Q_2$'s gate, take the output at $Q_2$'s drain. In the T model the two $1/g_m$ source resistances and the negative resistance $-2/g_m$ cancel, leaving
> $$|H(s)| = \frac{(g_m/2)R_D}{\left|1+sR_s\left(\frac{C_{gs}}2+C_{gd1}\right)\right|\,\left|1+sC_{gd2}R_D\right|}$$
> No Miller term on $C_{gd1}$. Half the gain of the symmetric pair, much more bandwidth.

## Level 3: Gain-Bandwidth Trade-Offs

```tikz title="One stage: gain and pole trade one-for-one along a fixed line. Cascoding slides along the line. Cascading two stages raises the line but lowers the -3 dB point. After Razavi Figs. 6.43–6.45."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,yscale=0.6]
  \draw[->] (0,0) -- (7,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,7) node[above] {$20\log|A|$};
  \node[left,font=\scriptsize] at (0,0) {$0$ dB};
  % single stage
  \draw[very thick] (0,3) -- (2,3) -- (5,0);
  % cascoded
  \draw[thick,dashed,blue!70!black] (0,4.5) -- (0.5,4.5) -- (2,3);
  % two stages
  \draw[thick,red!70!black] (0,6) -- (2,6) -- (5,0);
  \draw[dotted] (2,0) -- (2,3);
  \node[below] at (2,0) {$\omega_p$};
  \node[below] at (5,0) {$\omega_u\approx A_0\omega_p$};
  \node[left,font=\scriptsize] at (0,3) {$A_0$};
  \node[left,font=\scriptsize,blue!70!black] at (0,4.5) {$KA_0$};
  \node[left,font=\scriptsize,red!70!black] at (0,6) {$A_0^2$};
  \node[font=\scriptsize,anchor=west] at (5.1,1.0) {one stage: $\mathrm{GBW}=g_m/C_L$};
  \node[font=\scriptsize,anchor=west,blue!70!black] at (0.2,5.15) {cascoded ($\times K$)};
  \node[font=\scriptsize,anchor=west,red!70!black] at (2.2,6.3) {two stages: $-40$ dB/dec, $\omega_{-3\mathrm{dB}}=0.64\,\omega_p$};
\end{circuitikz}
\end{document}
```

### One Pole: GBW Is Fixed by $g_m/C_L$

$$
\boxed{\text{GBW} = A_0\omega_p = g_m(r_{O1}\parallel r_{O2})\cdot\frac{1}{(r_{O1}\parallel r_{O2})C_L} = \frac{g_m}{C_L}\ \text{rad/s}}
\qquad
\boxed{\omega_u = \sqrt{A_0^2-1}\,\omega_p\approx A_0\omega_p}
$$

- $R_{out}$ cancels. **Cascoding does not raise GBW:** $R_{out}$ up by $K$ means gain up by $K$ and pole down by $K$ (Razavi Ex. 6.18).
- The only levers are $g_m$ (current, or $g_m/I_D$) and $C_L$. Example: $g_m = 1/(100\ \Omega)$, $C_L = 50$ fF gives $\text{GBW} = g_m/(2\pi C_L) = 31.8$ GHz.

> [!tip] Remark
> $g_m/C_L$ is the circuit version of the device's $g_m/C_{GS}$. If the load is the next stage's gate, GBW cannot beat $\omega_T$. Razavi's nanometer note: $f_T$ exceeds 300 GHz in modern processes, yet a CS stage loaded by an identical stage (5 µm/40 nm, $R_D = 5$ kΩ, 130 µA) reaches only about 34 GHz of GBW. See [[MosFETs#Full Small-Signal Model and $f_T$|$f_T$]].

### Many Poles: Cascading

$$
\boxed{\omega_{-3\text{dB}} = \sqrt{2^{1/N}-1}\;\omega_p,\qquad \text{GBW}_N = A_0^N\sqrt{2^{1/N}-1}\;\omega_p}
$$

| $N$ | $\omega_{-3\text{dB}}/\omega_p$ | $\text{GBW}_N/\text{GBW}_1$ |
|---|---|---|
| 1 | 1 | 1 |
| 2 | 0.64 | $0.64A_0$ |
| 3 | 0.51 | $0.51A_0^2$ |
| 4 | 0.43 | $0.43A_0^3$ |

- Cascading raises GBW (by $0.64A_0$ for two stages) at $N\times$ the power, and the bandwidth **shrinks** with every stage.
- $N$ poles inside a feedback loop is a stability problem ([[Stability]]). That is where compensation comes in.

> [!note]- Derivation: $N$ identical stages (Razavi Prob. 6.25; Zettelkasten 5j1)
> $|H| = A_0^N(1+\omega^2/\omega_p^2)^{-N/2}$. Setting this to $A_0^N/\sqrt2$: $(1+\omega^2/\omega_p^2)^{N} = 2$, so $\omega^2/\omega_p^2 = 2^{1/N}-1$.

## Level 4: Exact Tools and Device Limits

> [!note]- Detail: Extra Element Theorem (Razavi App. A, after Middlebrook)
> Know $H(s)$ without an element $Z_1$ between nodes $A$ and $B$? Adding it gives
> $$G(s) = H(s)\,\frac{1+Z_{out,0}/Z_1}{1+Z_{in,0}/Z_1}$$
> $Z_{in,0}$: impedance between $A$ and $B$ with $V_{in}=0$. $Z_{out,0}$: impedance between $A$ and $B$ when $V_{in}$ is adjusted to force $V_{out}=0$ (not a real impedance, it can be negative). Start from the DC gain, add the capacitors one at a time. CS with $C_F$ gate-to-drain: $Z_{out,0} = -1/g_m$, $Z_{in,0} = (1+g_mR_D)R_S + R_D$, so
> $$G(s) = -g_m(R_D\parallel r_O)\frac{1-C_Fs/g_m}{1+[(1+g_mR_D)R_S+R_D]C_Fs}$$
> the RHP zero and the Miller pole in one line. Series version: $G = H\,(1+Z_1/Z_{out,0})/(1+Z_1/Z_{in,0})$. $H$ must not be zero or infinite.

> [!note]- Detail: the dual of Miller's theorem (Razavi App. C)
> $Z_1+Z_2 = Z$ always: Miller splits $Z$ at the point along it where the local potential is zero. In a CS stage $V_X$ and $V_Y$ have opposite signs, so that point exists inside $C_{GD}$. The resistive-divider failure is grounding that point when it carries the only current path. Dual form: two loops with currents $I_1$, $I_2$ sharing an admittance $Y$ can be split as $Y_1 = Y/(1-I_2/I_1)$, $Y_2 = Y/(1-I_1/I_2)$.

> [!note]- Detail: what the device model leaves out (Razavi nanometer notes, §6.1–6.2)
> - $f_T\approx g_m/(2\pi C_{GS})$ rises with overdrive but flattens as vertical-field mobility degradation sets in. Low-voltage (small $V_{OV}$) design therefore trades away $f_T$.
> - Real devices have a drain-source capacitance $C_{DS}$ between the stacked contact "columns" on source and drain. It grows as channels shorten and contact stacks get taller. The Chapter 2 model has no $C_{DS}$, so include it for CG stages in modern nodes.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↓ $R_S$ (stronger driver) | Input pole of CS/cascode | Power or gain in the previous stage |
| Small $W$, high $V_{OV}$ on a CS device (Miller-limited) | $C_{GD}$ and $C_{GS}$ down, so $\omega_{in}$ up | Headroom; gain and mobility once $V_{OV}\gtrsim 1/(2\theta)$ |
| Wide $W$, low $V_{OV}$ (load-limited) | $g_m/I_D$, gain at fixed current | Bigger input capacitance |
| ↑ $I_D$ at fixed $V_{OV}$ | $g_m$: GBW $= g_m/C_L$, $\omega_{p2}$ and $\omega_z$ move out | Power |
| Cascode | Miller on $C_{GD1}$ cut to about 2× (when the output is low-impedance), gain ×$g_mr_o$ | Headroom; GBW unchanged; extra pole $\le\omega_{T2}$; $Z_{out}$ rolls off at $1/(r_{O1}C_X)$ |
| CG input stage | No Miller; input pole at about $g_m/C_{GS}$ | Low $R_{in}$ loads the driver; any gate resistance $R_G$ brings Miller back |
| Source-follower buffer | Small input capacitance (bootstrapped), $Z_{out}\approx 1/g_m$ | $V_{GS}$ headroom; inductive $Z_{out}$, so it rings with $C_L$ |
| Source degeneration $R_S$ | $C_{GS}$ and $R_G$ time constants divided by $(1+g_mR_S)$ | Gain |
| Cascade $N$ stages | GBW ×$\approx0.64A_0$ per extra stage | Bandwidth shrinks; $N\times$ power; stability |
| Fully differential load instead of a mirror | No mirror pole and zero | Needs CMFB |
| Wide tail device | Headroom | $C_P$ up, so CMRR falls above $1/(r_{O3}C_P)$ |
| Longer $L$ on the cascode device | $r_o$ | Cascode-node pole $\propto 1/L_2^2$ |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Node pole | $\omega_j = 1/(R_jC_j)$ |
| First order | $\omega_u\approx A_0\omega_{-3\text{dB}}$, phase $-90^\circ$ |
| Second order | $\omega_0^2 = \omega_{p1}\omega_{p2}$, $\omega_0/Q = \omega_{p1}+\omega_{p2}$; overshoot $e^{-\pi/\sqrt{4Q^2-1}}$ for $Q>0.5$ |
| Miller | $Z_1 = Z/(1-A_v)$, $Z_2 = Z/(1-A_v^{-1})$; $C_{in} = (1+A)C_F$ |
| Zero-value time constants | $\omega_{-3\text{dB}}\approx 1/\sum R_kC_k$ |
| Short-circuit time constants | $\omega_L\approx\sum 1/(R_{is}C_i)$ |
| CS input pole (Miller) | $1/\{R_S[C_{GS}+(1+g_mR_D)C_{GD}]\}$ |
| CS output pole (Miller) | $1/[R_D(C_{GD}+C_{DB})]$ |
| CS dominant pole | $1/[R_S(1+g_mR_D)C_{GD}+R_SC_{GS}+R_D(C_{GD}+C_{DB})]$ |
| CS second pole | $[R_S(1+g_mR_D)C_{GD}+R_SC_{GS}+R_D(C_{GD}+C_{DB})]/(R_SR_D\xi)$ |
| CS zero | $+g_m/C_{GD}$ (RHP) |
| CS, large $C_L$, $R_D\to\infty$ | $\omega_{p2}\approx 1/[R_S(C_{GS}+C_{GD})]$ |
| SF transfer function | $(g_m+C_{GS}s)/[R_S(C_{GS}C_L+C_{GS}C_{GD}+C_{GD}C_L)s^2+(g_mR_SC_{GD}+C_L+C_{GS})s+g_m]$ |
| SF dominant pole | $1/[R_SC_{GD}+(C_L+C_{GS})/g_m]$ |
| SF output impedance | $(R_SC_{GS}s+1)/(g_m+C_{GS}s)$, $L = \frac{C_{GS}}{g_m}(R_S-\frac1{g_m})$ |
| CG poles | $\omega_{in} = 1/[(C_{GS}+C_{SB})(R_S\parallel\frac1{g_m+g_{mb}})]$, $\omega_{out} = 1/[R_D(C_{GD}+C_{DB})]$ |
| CG with $R_G$ | $\omega_p = (1+g_mR_S)/[(R_G+R_S)C_{GS}]$ |
| Cascode poles | $\omega_A = 1/\{R_S[C_{GS1}+(1+\frac{g_{m1}}{g_{m2}+g_{mb2}})C_{GD1}]\}$, $\omega_X = \frac{g_{m2}+g_{mb2}}{2C_{GD1}+C_{DB1}+C_{SB2}+C_{GS2}}$, $\omega_Y = \frac1{R_D(C_{DB2}+C_L+C_{GD2})}$ |
| High-gain cascode | $\omega_{-3\text{dB}}\approx 1/(R_{out}C_{out})$; $\omega_{s2}\approx g_{m2}/C_{s2}<\omega_{T2}\approx 3\mu V_{eff2}/(2L_2^2)$ |
| Diff-pair CMRR | pole $1/(r_{O3}C_P)$, zero $\approx 2g_m/C_P$ |
| Mirror-load OTA | $\omega_{p1}\approx 1/[(r_{ON}\parallel r_{OP})C_L]$, $\omega_{p2}\approx g_{mP}/C_E$, $\omega_z\approx 2g_{mP}/C_E$ |
| One-pole GBW | $A_0\omega_p = g_m/C_L$; $\omega_u = \sqrt{A_0^2-1}\,\omega_p$ |
| $N$ cascaded stages | $\omega_{-3\text{dB}} = \sqrt{2^{1/N}-1}\,\omega_p$ |
| EET | $G = H\,(1+Z_{out,0}/Z_1)/(1+Z_{in,0}/Z_1)$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - Ch. 6 Frequency Response of Amplifiers, pp. 173–218 (PDF 192–237): §6.1 Miller effect, association of poles with nodes (Exs. 6.1–6.5); §6.2 CS stage (Miller estimate, exact analysis, dominant pole, RHP zero, $R_D\to\infty$ case, input impedance, Exs. 6.6–6.10); §6.3 source followers (transfer function, bootstrapping, input and output impedance, active inductor, Exs. 6.11–6.14); §6.4 CG stage (Ex. 6.15, gate resistance); §6.5 cascode (Ex. 6.16, $Z_{out}$ roll-off); §6.6 differential pairs (CMRR vs frequency, current-source loads, mirror pole and zero, Ex. 6.17); §6.7 gain-bandwidth trade-offs (Ex. 6.18, cascaded stages); App. A extra element theorem; App. B zero-value time constants (Exs. 6.21–6.23); App. C dual of Miller's theorem; nanometer design notes on $f_T$, CS GBW, $C_{DS}$; Problems 6.23, 6.25.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - Ch. 4 Frequency Response of Electronic Circuits, pp. 144–198 (PDF 168–222): §4.1 linear systems, first and second order, Bode rules, $Q$ and overshoot (Exs. 4.1–4.7); §4.2.1–4.2.3 high-frequency model, CS nodal analysis, Miller (Ex. 4.8); §4.2.4 zero-value time constants (Exs. 4.9–4.10); §4.2.5 CS design examples (Exs. 4.11–4.12); §4.2.6 CG; §4.3 cascode (Exs. 4.13–4.15, $\omega_{s2}<\omega_{T2}$); §4.4 source follower $Q$, overshoot, compensation (Exs. 4.16–4.17); §4.5 differential pair (T model, symmetric, single-ended, active load).
- **Zettelkasten extensions** (`AnalogTheory/Frequency Response/`): 5i2 (short-circuit time constants for the low edge, citing Gray, Hurst, Lewis & Meyer §7.3 and Sedra & Smith §10.9); 5i1 (where ZVTC breaks: coincident-pole pessimism, negative $R_k$); 5j1 ($N$-stage table); `S5 Frequency Response` reading order.
