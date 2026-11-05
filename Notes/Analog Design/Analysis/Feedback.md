---
title: Feedback
description: Negative feedback from the ideal A/(1+βA) loop to the four topologies, loading via two-ports, and the exact return-ratio methods (Bode, Blackman, Middlebrook), ending with first- and second-order closed-loop dynamics.
kind: topic
status: growing
aliases:
  - Feedback
  - Negative Feedback
---

The loop is a black box first, then four port-level topologies, then a real circuit whose feedback network loads the amplifier, then the exact methods that never break the loop, and finally its time and frequency response. Stop after any section and you still have a correct, coarser model. Whether the loop is *stable*, and how to compensate it, is the job of [[Stability]].

## The big picture

```tikz title="The whole chapter: a large, poorly controlled gain A is wrapped by an accurate feedback factor β. The error at the input is driven toward zero, so βY ≈ X. After Razavi Figs. 8.1, 8.4 and Carusone Fig. 5.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0.2,0) node[left] {$X$} -- (1.2,0);
  \draw (1.5,0) circle (0.3);
  \node at (1.5,0) {$\Sigma$};
  \node[font=\scriptsize] at (1.2,0.45) {$+$};
  \node[font=\scriptsize] at (1.85,-0.5) {$-$};
  \draw[->] (1.8,0) -- (3.8,0);
  \node[font=\scriptsize,above] at (2.8,0) {$X-\beta Y$};
  \node[font=\scriptsize,below] at (2.8,0) {error};
  \draw (3.8,-0.6) rectangle (5.4,0.6);
  \node at (4.6,0) {$A$};
  \draw[->] (5.4,0) -- (8,0) node[right] {$Y$};
  \fill (6.8,0) circle (1.5pt);
  \node[font=\scriptsize,above] at (6.8,0) {sense};
  \draw[->] (6.8,0) -- (6.8,-1.8) -- (5.4,-1.8);
  \draw (3.8,-2.4) rectangle (5.4,-1.2);
  \node at (4.6,-1.8) {$\beta$};
  \draw[->] (3.8,-1.8) -- (1.5,-1.8) -- (1.5,-0.3);
  \node[font=\scriptsize,below] at (2.65,-1.8) {return $\beta Y\approx X$};
  \node[font=\scriptsize,align=left,anchor=west] at (6.95,-1.1) {feedback network\\(passives: accurate)};
  \node[font=\scriptsize] at (4.6,1.0) {forward amp: large, sloppy $A$};
  \node[anchor=west] at (0.3,-3.3) {$\dfrac{Y}{X}=\dfrac{A}{1+\beta A}\approx\dfrac1\beta,\qquad T=\beta A=$ loop gain};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Closed-loop gain:** $Y/X = A/(1+T)$ with loop gain $T=\beta A$. For $T\gg1$ it is $\approx 1/\beta$, set by passives, not transistors.
> 2. **One factor, everywhere:** $1+T$ divides the gain error, the gain sensitivity and the nonlinearity, and multiplies the bandwidth.
> 3. **Port impedances:** sensing a voltage (shunt) divides $R_{out}$ by $1+T$; sensing a current (series) multiplies it. Returning a voltage (series) multiplies $R_{in}$; returning a current (shunt) divides it.
> 4. **No free lunch on noise:** a noiseless feedback network leaves input-referred noise unchanged. Feedback fixes deterministic errors, not random ones.
> 5. **The loop gain is the quantity to compute**, and it is exact only as a return ratio ($T=-g_mD$) of a dependent source. The closed-loop bandwidth is roughly where $|T|=1$.

**Map:** [[#Level 0 The Ideal Loop|ideal loop]] → [[#Level 1 The Four Topologies|four topologies and impedances]] → [[#Level 2 Loading and Two-Port Analysis|loading, two-ports]] → [[#Level 3 Exact Methods Without Breaking the Loop|Bode, Blackman, Middlebrook]] → [[#Level 4 Dynamics of the Closed Loop|first- and second-order dynamics]] → [[#Design intuition / trade-offs|trade-offs]].

## Level 0: The Ideal Loop

Every feedback circuit has four parts: a forward amplifier, a way to **sense** the output, a feedback network, and a **subtractor** at the input. They exist even when hidden, e.g. in a degenerated common-source stage, where $R_S$ senses $I_D$ and subtracts $I_DR_S$ from $V_{in}$.

### Closed-loop gain and loop gain

$$
\boxed{\frac{Y}{X}=\frac{A}{1+\beta A}=\frac1\beta\cdot\frac{T}{1+T}\approx\frac1\beta\left(1-\frac1T\right),\qquad T=\beta A}
$$

$$
\boxed{\text{gain error}=1-\frac{A_{CL0}}{1/\beta}=\frac{1}{1+T_0}}
$$

- $T$ (loop gain) and $A$ (open-loop gain) are different things. $T$ is dimensionless in every topology.
- The error signal into $A$ is $X/(1+T)$: the input of $A$ is a "virtual ground", so $A$ only ever sees small signals.
- Accuracy now lives in $\beta$. A 5% change in $\beta$ moves the gain 5%; an order-of-magnitude change in $A$ moves it by a fraction of a percent (Carusone Exs. 5.1–5.2: $A=10^4\to10^3$ with $\beta=0.2$ moves $A_{CL}$ from 4.9975 to 4.9751).
- The trade: precision costs closed-loop gain. Large $\beta$ means large $T$ but small $1/\beta$.

> [!tip] Remark
> Carusone's habit is the useful one in practice: take $\beta\equiv1/(\text{ideal closed-loop gain})$ by inspection (assume an infinite-gain amplifier), measure $T$, and never compute $A$ at all. $A=T/\beta$ if you need it. $A$ is ambiguous once loading enters; $T$ is not, and stability depends only on $T$.

> [!note]- Derivation: gain sensitivity (Carusone Eq. 5.7)
> Let $A\to A+\Delta A$ at fixed $\beta$:
> $$\Delta A_{CL}=\frac{A+\Delta A}{1+(A+\Delta A)\beta}-\frac{A}{1+A\beta}=\frac{\Delta A}{(1+T)^2+\Delta A\,\beta(1+T)}\approx\frac{\Delta A}{(1+T)^2}.$$
> Dividing by $A_{CL}=A/(1+T)$: $\dfrac{\Delta A_{CL}}{A_{CL}}\approx\dfrac{1}{1+T}\dfrac{\Delta A}{A}$. The fractional error in $A$ is divided by $1+T$.

> [!note]- Example: capacitive feedback around a CS stage (Razavi Fig. 8.3, Eqs. 8.3–8.8)
> A CS stage with current-source load ($A=-g_{m1}r_{O1}$) gets $C_1$ from $V_{in}$ to the gate and $C_2$ from gate to drain. Neglecting the current $C_2$ draws from the output:
> $$\frac{V_{out}}{V_{in}}=-\frac{1}{\dfrac{1}{g_{m1}r_{O1}}+\dfrac{C_2}{C_1}\left(1+\dfrac{1}{g_{m1}r_{O1}}\right)}\ \xrightarrow{\ g_mr_O\to\infty\ }\ -\frac{C_1}{C_2}$$
> The loop gain is $T=\dfrac{C_2}{C_1+C_2}g_{m1}r_{O1}$. A capacitor ratio is process- and temperature-stable; $g_mr_O$ is not. This is the core of every [[Switched-Capacitor Circuits|switched-capacitor]] gain stage.

### Measuring the loop gain

```tikz title="Zero the main input, break the loop, inject a test signal in the forward direction, and see what comes back. After Razavi Fig. 8.5 and Carusone Fig. 5.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0.2,0) node[left] {$X=0$} -- (1.2,0);
  \draw (1.5,0) circle (0.3);
  \node at (1.5,0) {$\Sigma$};
  \node[font=\scriptsize] at (1.85,-0.5) {$-$};
  \draw[->] (1.8,0) -- (3.2,0);
  \draw (3.2,-0.6) rectangle (4.8,0.6);
  \node at (4.0,0) {$A$};
  \draw[->] (4.8,0) -- (6.3,0);
  \fill (6.3,0) circle (1.5pt) node[above] {$V_F$};
  \fill (6.9,0) circle (1.5pt) node[above] {$V_t$};
  \node[font=\scriptsize,align=center] at (6.6,0.9) {break};
  \draw[dashed] (6.6,0.6) -- (6.6,-0.4);
  \draw[->] (6.9,0) -- (7.5,0) -- (7.5,-1.8) -- (4.8,-1.8);
  \draw (3.2,-2.4) rectangle (4.8,-1.2);
  \node at (4.0,-1.8) {$\beta$};
  \draw[->] (3.2,-1.8) -- (1.5,-1.8) -- (1.5,-0.3);
  \node[anchor=west] at (0.3,-3.2) {$V_F = V_t\,\beta\,(-1)\,A\quad\Rightarrow\quad T = -\dfrac{V_F}{V_t} = \beta A$};
\end{circuitikz}
\end{document}
```

$$
\boxed{T=-\frac{V_F}{V_t}\quad(\text{or }-I_F/I_t),\qquad X=0}
$$

- Set the *small-signal* input to zero; keep the bias.
- Once the input is zeroed, input and output terminals disappear. Two circuits that look different (a CS and a CG stage with the same $C_1$–$C_2$ divider, Razavi Ex. 8.1) can share one loop gain.
- Where to break and whether to inject a voltage or a current is not arbitrary; see [[#Where to break the loop (and how to do it in a simulator)]].

> [!note]- Detail: a common mistake (Razavi footnote, p. 276)
> In the capacitive CS example it is tempting to say $C_2$ passes nothing at low frequency, so the loop gain is zero. Wrong: $C_1$ is also an open circuit there, so the divider ratio $C_2/(C_1+C_2)$ holds at every frequency.

### What feedback buys

Each benefit is the same desensitization, applied to a different source of variation in $A$: process, temperature, frequency, load, or signal level.

**Bandwidth.** For a one-pole amplifier $A(s)=A_0/(1+s/\omega_0)$:

```tikz title="Feedback trades gain for bandwidth along the same −20 dB/dec line: the low-frequency gain and the pole both move by 1+βA₀. After Razavi Fig. 8.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.6,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$\log|\cdot|$};
  % open loop: flat at 3.6 until x=1.5, then -1 slope (1 decade per unit)
  \draw[thick] (0,3.6) -- (1.5,3.6) -- (5.1,0);
  \node[font=\scriptsize,anchor=south west] at (0.1,3.65) {$|A|$: $A_0$, pole $\omega_0$};
  % closed loop: flat at 1.6 until x=3.5
  \draw[thick,dashed] (0,1.6) -- (3.5,1.6) -- (5.1,0);
  \node[font=\scriptsize,anchor=south west] at (0.1,1.65) {$|Y/X|$};
  \draw[densely dotted] (1.5,0) -- (1.5,3.6);
  \draw[densely dotted] (3.5,0) -- (3.5,1.6);
  \node[below] at (1.5,0) {$\omega_0$};
  \node[below] at (3.5,0) {$(1+\beta A_0)\,\omega_0$};
  \draw[<->] (6.0,3.6) -- (6.0,1.6);
  \draw[densely dotted] (1.5,3.6) -- (6.2,3.6);
  \draw[densely dotted] (3.5,1.6) -- (6.2,1.6);
  \node[font=\scriptsize,anchor=west] at (6.1,2.6) {$\div(1+\beta A_0)$};
  \node[font=\scriptsize,anchor=west] at (6.25,1.6) {$\dfrac{A_0}{1+\beta A_0}\approx\dfrac1\beta$};
  \node[font=\scriptsize,anchor=west] at (4.6,0.8) {same $-20$ dB/dec asymptote:};
  \node[font=\scriptsize,anchor=west] at (4.6,0.45) {gain $\times$ bandwidth $=A_0\omega_0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{Y}{X}(s)=\frac{\dfrac{A_0}{1+\beta A_0}}{1+\dfrac{s}{(1+\beta A_0)\,\omega_0}}}
$$

- The closed-loop gain–bandwidth product stays $A_0\omega_0$. Feedback does not create speed; it lets you *spend* gain on speed.
- Where speed matters, split the gain: two closed-loop stages of gain 10 each settle far faster than one open-loop stage of gain 100 (Razavi Fig. 8.11: $\tau$ = 16 ns vs 1.6 ns per stage, at twice the power).

> [!note]- Extension: the cascade does not keep each stage's full bandwidth (Zettelkasten 7a2)
> $n$ identical single-pole stages of bandwidth $\omega_1$ have an overall $-3$ dB frequency $\omega_1\sqrt{2^{1/n}-1}$. Two 100 MHz stages give $100\sqrt{\sqrt2-1}\approx64$ MHz: still about $6\times$ the 10 MHz open-loop amplifier, not $10\times$. (Razavi Problem 8.4 asks exactly this.)

**Linearity.** A nonlinear amplifier is one whose slope (small-signal gain) varies, say from $A_1$ to $A_2=A_1-\Delta A$:

$$
\boxed{r_{open}=\frac{A_2}{A_1}=1-\frac{\Delta A}{A_1}\qquad\longrightarrow\qquad r_{closed}\approx1-\frac{\Delta A}{A_1}\cdot\frac{1}{1+\beta A_2}}
$$

- The slope variation shrinks by $1+\beta A_2$, the loop gain where the amplifier is *weakest*.
- Carusone's view of the same fact: $A$ sees only $u/(1+T)$, so it stays in its linear range even for a large input. The feedback network sees the full output and must itself be linear (passives or switches).

> [!tip] Remark
> This is a low-frequency statement. As $|A|$ rolls off, $1+T$ shrinks and distortion rises with frequency even while the small-signal response still looks flat. Once $A$ clips or slews, $T\to0$ and there is no feedback left to help (Zettelkasten 7a3). Harmonic-domain treatment: [[Nonlinearity and Mismatch]].

> [!note]- Derivation: $r_{closed}$ (Razavi Eqs. 8.24–8.28)
> $$r_{closed}=\frac{A_2/(1+\beta A_2)}{A_1/(1+\beta A_1)}=\frac{1+\frac{1}{\beta A_1}}{1+\frac{1}{\beta A_2}}\approx1-\frac{\frac{1}{\beta A_2}-\frac{1}{\beta A_1}}{1+\frac{1}{\beta A_2}}=1-\frac{A_1-A_2}{1+\beta A_2}\cdot\frac{1}{A_1}.$$

**Terminal impedances.** Covered per topology in [[#Level 1 The Four Topologies|Level 1]]: every port impedance is scaled by $1+T$, up or down.

### What feedback does not buy: noise

$$
V_{out}=\frac{A_1}{1+\beta A_1}\,(V_{in}+V_n)\quad\Rightarrow\quad\boxed{V_{n,in,closed}=V_{n,in,open}\quad\text{(noiseless }\beta\text{, output = sensed node)}}
$$

Signal and amplifier noise enter at the same summing point, so the loop cannot treat them differently. This holds for the input-referred noise voltage *and* current in all four topologies.

> [!tip] Remark
> Input-referred noise is output noise divided by gain ([[Noise]]). Here both the output noise and the gain fall by $1+T$, so the quotient does not move.

- A real feedback network is made of resistors or transistors, so it **adds** noise. A resistive divider $R_1,R_2$ adds roughly $4kT(R_1\parallel R_2)$ at the summing node (Zettelkasten 7a4).
- Feedback widens the bandwidth by $1+T$, so the *integrated* input-referred noise grows even though the density does not (Zettelkasten 7a4).

> [!note]- Detail: when the sensed node is not the output (Razavi Fig. 8.44, Eqs. 8.55–8.56)
> $A_1$ drives the gate of $M_1$; the loop senses the *source* ($R_S$), but the output is the drain ($R_D$). Counting only $R_D$'s noise, with $\lambda=\gamma=0$:
> $$|V_{n,in,closed}|=|V_{n,R_D}|\,\frac{1+(1+A_1)g_mR_S}{A_1g_mR_D},\qquad |V_{n,in,open}|=|V_{n,R_D}|\,\frac{1+g_mR_S}{A_1g_mR_D}.$$
> As $A_1\to\infty$ the open-loop value goes to 0 while the closed-loop value stays at $|V_{n,R_D}|R_S/R_D$. Feedback made the noise worse.

## Level 1: The Four Topologies

### Four amplifier types

| Type | Senses | Produces | Gain (units) | Ideal $R_{in}$ | Ideal $R_{out}$ | Simple MOS version |
|---|---|---|---|---|---|---|
| Voltage | $V$ | $V$ | $A_v$ (V/V) | $\infty$ | $0$ | CS stage |
| Transimpedance | $I$ | $V$ | $R_0$ (Ω) | $0$ | $0$ | CG stage, output at drain |
| Transconductance | $V$ | $I$ | $G_m$ (S) | $\infty$ | $\infty$ | CS device, output = drain current |
| Current | $I$ | $I$ | $A_I$ (A/A) | $0$ | $\infty$ | CG device |

- Sensing a voltage needs a high input impedance (a voltmeter); sensing a current needs a low one (an ammeter).
- Producing a voltage needs a low output impedance; producing a current needs a high one.
- Transimpedance amplifiers sit behind photodiodes in optical receivers: the input *is* a current.

> [!note]- Detail: nonideal models (Razavi Ex. 8.3, Fig. 8.16)
> A voltage amplifier has $Z_{in}$ **in parallel** with its input; a transimpedance amplifier has $Z_{in}$ **in series** with its input. The placement is chosen so that the ideal limit ($Z_{in}\to\infty$ or $\to0$) recovers the ideal model. Same logic at the output: $Z_{out}$ in series with a voltage source, in parallel with a current source. Real amplifiers also have internal reverse feedback (e.g. $C_{GD}$), which these models drop.

### Sense and return

- **Sense a voltage:** connect in **parallel** with the output ("shunt"), e.g. a resistive or capacitive divider.
- **Sense a current:** insert in **series** with the output, in practice a small resistor whose drop is the measurement.
- **Add voltages:** in **series**. A differential pair, or a single transistor with $V_{in}$ on the gate and $V_F$ on the source, subtracts voltages.
- **Add currents:** in **parallel**, at one node.

> [!tip] Remark
> The identification trick (Razavi p. 286): if the input and the feedback signal land on **two distinct nodes**, the return is a voltage (series). If they land on **one node**, it is a current (shunt).

### The four loops

```tikz title="The four canonical topologies. Output side: a shunt tap senses V_out; a series element in the load path senses I_out. Input side: a series loop (two nodes) subtracts voltages; a shared node subtracts currents. After Razavi Figs. 8.21, 8.30, 8.35, 8.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % ---------- panel 1: V-V ----------
  \begin{scope}[shift={(0,5.3)}]
    \node[font=\bfseries\small,anchor=west] at (-0.3,3.3) {Voltage--voltage (series--shunt)};
    \draw (1.6,1.6) rectangle (3.2,2.6); \node at (2.4,2.1) {$A_0$};
    \draw (1.6,0) rectangle (3.2,1.0); \node at (2.4,0.5) {$\beta$};
    \draw (0,0) node[ground]{} to[vsource,l=$V_{in}$] (0,2.35) -- (1.6,2.35);
    \node[font=\scriptsize,anchor=west] at (1.6,2.35) {$+$};
    \node[font=\scriptsize,anchor=west] at (1.6,1.85) {$-$};
    \draw (1.6,1.85) -- (1.0,1.85) -- (1.0,0.5) -- (1.6,0.5);
    \node[font=\scriptsize,right] at (1.0,1.2) {$V_F$};
    \draw (3.2,2.1) -- (5.0,2.1) to[R,l=$R_L$] (5.0,0) node[ground]{};
    \fill (4.1,2.1) circle (1.5pt);
    \draw (4.1,2.1) -- (4.1,0.5) -- (3.2,0.5);
    \node[font=\scriptsize,above] at (4.1,2.1) {$V_{out}$};
    \node[font=\scriptsize,align=center] at (2.4,-0.75) {$R_{in}\uparrow\times(1+T)$,\ $R_{out}\downarrow\div(1+T)$};
  \end{scope}
  % ---------- panel 2: I-V ----------
  \begin{scope}[shift={(7.2,5.3)}]
    \node[font=\bfseries\small,anchor=west] at (-0.3,3.3) {Current--voltage (series--series)};
    \draw (1.6,1.6) rectangle (3.2,2.6); \node at (2.4,2.1) {$G_m$};
    \draw (1.6,0) rectangle (3.2,1.0); \node at (2.4,0.5) {$R_F$};
    \draw (0,0) node[ground]{} to[vsource,l=$V_{in}$] (0,2.35) -- (1.6,2.35);
    \node[font=\scriptsize,anchor=west] at (1.6,2.35) {$+$};
    \node[font=\scriptsize,anchor=west] at (1.6,1.85) {$-$};
    \draw (1.6,1.85) -- (1.0,1.85) -- (1.0,0.5) -- (1.6,0.5);
    \node[font=\scriptsize,right] at (1.0,1.2) {$V_F$};
    \draw[->] (3.2,2.1) -- (4.0,2.1) node[above,font=\scriptsize] {$I_{out}$};
    \draw (4.0,2.1) -- (4.6,2.1) to[R,l=$Z_L$] (4.6,0.5) -- (3.2,0.5);
    \draw (2.4,0) -- (2.4,-0.2) node[ground]{};
    \node[font=\scriptsize,align=center] at (2.4,-1.05) {$R_{in}\uparrow\times(1+T)$,\ $R_{out}\uparrow\times(1+T)$};
  \end{scope}
  % ---------- panel 3: V-I ----------
  \begin{scope}[shift={(0,0)}]
    \node[font=\bfseries\small,anchor=west] at (-0.3,3.3) {Voltage--current (shunt--shunt)};
    \draw (1.6,1.6) rectangle (3.2,2.6); \node at (2.4,2.1) {$R_0$};
    \draw (1.6,0) rectangle (3.2,1.0); \node at (2.4,0.5) {$g_{mF}$};
    \draw (0,0) node[ground]{} to[isource,l=$I_{in}$] (0,2.1) -- (1.6,2.1);
    \fill (1.0,2.1) circle (1.5pt);
    \draw (1.0,2.1) -- (1.0,0.5) -- (1.6,0.5);
    \node[font=\scriptsize,right] at (1.0,1.2) {$I_F$};
    \draw (3.2,2.1) -- (5.0,2.1) to[R,l=$R_L$] (5.0,0) node[ground]{};
    \fill (4.1,2.1) circle (1.5pt);
    \draw (4.1,2.1) -- (4.1,0.5) -- (3.2,0.5);
    \node[font=\scriptsize,above] at (4.1,2.1) {$V_{out}$};
    \node[font=\scriptsize,align=center] at (2.4,-0.75) {$R_{in}\downarrow\div(1+T)$,\ $R_{out}\downarrow\div(1+T)$};
  \end{scope}
  % ---------- panel 4: I-I ----------
  \begin{scope}[shift={(7.2,0)}]
    \node[font=\bfseries\small,anchor=west] at (-0.3,3.3) {Current--current (shunt--series)};
    \draw (1.6,1.6) rectangle (3.2,2.6); \node at (2.4,2.1) {$A_I$};
    \draw (1.6,0) rectangle (3.2,1.0); \node at (2.4,0.5) {$\beta$};
    \draw (0,0) node[ground]{} to[isource,l=$I_{in}$] (0,2.1) -- (1.6,2.1);
    \fill (1.0,2.1) circle (1.5pt);
    \draw (1.0,2.1) -- (1.0,0.5) -- (1.6,0.5);
    \node[font=\scriptsize,right] at (1.0,1.2) {$I_F$};
    \draw[->] (3.2,2.1) -- (4.0,2.1) node[above,font=\scriptsize] {$I_{out}$};
    \draw (4.0,2.1) -- (4.6,2.1) to[R,l=$Z_L$] (4.6,0.5) -- (3.2,0.5);
    \draw (2.4,0) -- (2.4,-0.2) node[ground]{};
    \node[font=\scriptsize,align=center] at (2.4,-1.05) {$R_{in}\downarrow\div(1+T)$,\ $R_{out}\uparrow\times(1+T)$};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Razavi name (sensed–returned) | Port name (input–output) | Forward | $\beta$ (units) | Closed-loop gain | $R_{in}$ | $R_{out}$ |
|---|---|---|---|---|---|---|
| Voltage–voltage | series–shunt | $A_0$ | V/V | $\dfrac{A_0}{1+\beta A_0}$ | $\times(1+T)$ | $\div(1+T)$ |
| Current–voltage | series–series | $G_m$ | $R_F$ (Ω) | $\dfrac{G_m}{1+G_mR_F}$ | $\times(1+T)$ | $\times(1+T)$ |
| Voltage–current | shunt–shunt | $R_0$ | $g_{mF}$ (S) | $\dfrac{R_0}{1+g_{mF}R_0}$ | $\div(1+T)$ | $\div(1+T)$ |
| Current–current | shunt–series | $A_I$ | A/A | $\dfrac{A_I}{1+\beta A_I}$ | $\div(1+T)$ | $\times(1+T)$ |

$$
\boxed{R_{closed}=R_{open}\,(1+T)^{\pm1}:\ \text{series connection}\ \Rightarrow\times,\quad\text{shunt connection}\ \Rightarrow\div}
$$

> [!important] Why, in one line
> The loop makes whatever it **senses** a faithful replica of the input. Regulating $V_{out}$ against load changes makes the output a voltage source (low $R_{out}$); regulating $I_{out}$ makes it a current source (high $R_{out}$). At the input, a series return leaves only $V_{in}/(1+T)$ across $R_{in}$ (less current, higher $R_{in}$); a shunt return pulls extra current from the input node (lower $R_{in}$).

The naming is not standardized: Razavi writes sensed-then-returned (voltage–current); the port names write input-then-output (shunt–shunt). Both name the same loop.

### Voltage–voltage (series–shunt)

The topology of the non-inverting op-amp amplifier and the unity-gain buffer: high $R_{in}$, low $R_{out}$, so a buffer between a high-impedance source and a low-impedance load.

$$
\boxed{R_{out,closed}=\frac{R_{out}}{1+\beta A_0},\qquad R_{in,closed}=R_{in}(1+\beta A_0)}
$$

> [!tip] Remark
> Low $R_{out}$ without burning current is the big win in CMOS. A CS stage can only lower $r_O$ by raising $I_D$ ([[MosFETs#Output Resistance and Intrinsic Gain]]); feedback divides it by $1+T$ for free (Carusone p. 230).

> [!note]- Example: the closed-loop $R_{out}$ is independent of $r_O$ (Razavi Ex. 8.4)
> A diff pair with mirror load ($A_0=g_{m1}(r_{O2}\parallel r_{O4})$) and a $C_1$–$C_2$ divider back to the inverting input: $\beta=C_1/(C_1+C_2)$,
> $$A_{closed}\approx1+\frac{C_2}{C_1},\qquad R_{out,closed}=\frac{r_{O2}\parallel r_{O4}}{1+\beta g_{m1}(r_{O2}\parallel r_{O4})}\approx\left(1+\frac{C_2}{C_1}\right)\frac{1}{g_{m1}}.$$
> The open-loop gain and the open-loop $R_{out}$ both scale with $r_O$, so $r_O$ cancels. A high-impedance op amp still makes a low-impedance closed-loop driver.

> [!note]- Example: unity-gain buffer driving a heavy load (Carusone Exs. 5.11–5.12)
> Op amp: $A_{v0}=10^4$, $Z_o=500\ \Omega$; load $Z_L=200\ \Omega$. Loop gain $L=A_vZ_L/(Z_L+Z_o)$: the load divider shrinks $L$ but it stays $\gg1$. Gain error $=0.03\%$. Closed-loop output impedance $Z_o/(A_v-1)\approx0.05\ \Omega$.

> [!note]- Example: a CG stage summing in series (Razavi Ex. 8.6)
> Input at the source of $M_1$, feedback divider $C_1$–$C_2$ from the drain to the gate. Open-loop $R_{in}=1/(g_{m1}+g_{mb1})$, loop gain $g_{m1}R_DC_1/(C_1+C_2)$, so $R_{in}$ **rises** by $1+T$: when the source moves down, the fed-back gate moves down too, and $V_{GS}$ changes by less.

### Current–voltage (series–series)

$$
\boxed{\frac{I_{out}}{V_{in}}=\frac{G_m}{1+G_mR_F},\qquad R_{out,closed}=R_{out}(1+G_mR_F)}
$$

- A $G_m$ stage must be terminated by a finite $Z_L$, or it has nowhere to deliver its current.
- $R_{out,closed}$ is measured by **breaking the output current path** and looking between the two resulting nodes (where the load sits).
- This is how high-gain op amps get their high output impedance ([[Operational Amplifiers]]).

> [!note]- Example: constant-current charger (Razavi Exs. 8.7, 8.14)
> A sense resistor $r$ in series with the load, an amplifier $A_1$ comparing $Ir$ with $V_{REF}$ and driving the gate of the output device $M_1$. With $T\approx g_mrA_1\gg1$: $I_{out}\approx V_{REF}/r$ (or $V_b/r_M$ in Ex. 8.14), and
> $$R_{out,closed}=(1+g_mrA_1)(r_O+r).$$
> The load sees a much better current source, at the cost of headroom across $r$.

> [!tip] Remark
> A degenerated CS stage is this topology in miniature: $R_S$ senses $I_D$ and subtracts $I_DR_S$ from $V_{in}$. Its $G_m=g_m/(1+g_mR_S)$ and its $R_{out}\approx(1+g_mr_O)R_S$ are the $1+T$ factors of this section ([[Single-Stage]]). The exact $R_{out}$ is derived with Blackman's theorem below.

### Voltage–current (shunt–shunt)

```tikz title="The simplest shunt–shunt amplifier: R_F senses V_out and returns a current to the gate node. After Razavi Fig. 8.39, Ex. 8.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (3,0) node[nmos](M){};
  \draw (M.S) node[ground]{};
  \draw (M.D) -- ++(0,0.8) coordinate(d);
  \draw (d) to[R,l_=$R_D$] ++(0,2) node[vcc]{$V_{DD}$};
  \fill (d) circle (1.5pt);
  \draw (d) -- ++(1.4,0) node[right] {$V_{out}$};
  \draw (M.G) -- ++(-0.9,0) coordinate(g);
  \fill (g) circle (1.5pt);
  \draw (g) to[R,l=$R_F$] (g |- d) -- (d);
  \draw (g) -- ++(-1.4,0) coordinate(s);
  \draw (s) to[isource,l_=$I_{in}$] ++(0,-1.8) node[ground]{};
  \draw[<-] ($(g)+(-0.15,0.3)$) -- ++(-0.8,0) node[left,font=\scriptsize] {$R_{in}$};
  \draw[<-] ($(d)+(0.7,-0.3)$) -- ++(0.7,0) node[right,font=\scriptsize] {$R_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.4,-0.6) {loop gain $T\approx g_mR_D$ ($R_F\gg R_D$)\\[3pt]$R_{in}=\dfrac{R_F}{1+g_mR_D}$\\[5pt]$R_{out}=\dfrac{R_D}{1+g_mR_D}=\dfrac1{g_m}\parallel R_D$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{V_{out}}{I_{in}}=\frac{R_0}{1+g_{mF}R_0},\qquad R_{in}=\frac{R_{in,open}}{1+T},\qquad R_{out}=\frac{R_{out,open}}{1+T}}
$$

- For the CS stage above, $R_{out}=R_D/(1+g_mR_D)=(1/g_m)\parallel R_D$: exactly a diode-connected device in parallel with $R_D$.
- $R_{in}=R_F/(1+g_mR_D)$ is Miller's result: $R_F$ across a gain of $-g_mR_D$ ([[Frequency Response]]).
- **TIA for a photodiode** (Razavi Fig. 8.40): a bare resistor $R_1$ gives bandwidth $1/(2\pi R_1C_D)$. Wrapping $R_1$ around a wideband inverting amplifier $-A$ keeps $V_{out}\approx-R_1I_D$ but divides $R_{in}$ to $R_1/(1+A)$, raising the bandwidth to $(1+A)/(2\pi R_1C_D)$.

> [!warning] The returned quantity must match the drive
> A shunt-shunt loop returns a *current*, so it maps onto the canonical loop only when driven by a current source. Drive it with an ideal voltage source and "zero the input" shorts the summing node: the loop gain appears to be zero, yet $R_{in}$ is still reduced (Razavi Ex. 8.9). Fix: convert a voltage source with $R_S$ into its Norton equivalent and treat $R_S$ as part of the amplifier's input (Razavi Ex. 8.16), or use [[#Blackman's impedance theorem|Blackman]].

> [!note]- Example: a CMOS TIA by brute loop gain (Carusone Ex. 5.14)
> Three cascaded CS stages with $R_f$ from output to input, source impedance $R_s$. Breaking just after the last stage's $g_m$ source:
> $$L(0)=g_{m1}r_{ds1}\,g_{m2}r_{ds2}\,g_{m3}\left(\frac{r_{ds3}}{r_{ds3}+R_f+R_s}\right)R_s,\qquad \frac1\beta=-R_f,\qquad R_{in}\approx\frac{r_{ds3}+R_f}{g_{m1}r_{ds1}\,g_{m2}r_{ds2}\,g_{m3}r_{ds3}}.$$
> $R_{in}$ can be far below $R_f$: a large transimpedance and a tiny input resistance at once. Three stages means a third-order loop, so a dominant pole is needed ([[Stability]]).

### Current–current (shunt–series)

$$
\boxed{\frac{I_{out}}{I_{in}}=\frac{A_I}{1+\beta A_I},\qquad R_{in}\div(1+T),\qquad R_{out}\times(1+T)}
$$

Example (Razavi Fig. 8.42): $R_S$ in the source of output device $M_2$ senses $I_{out}$ (source and drain currents are equal at low frequency), and $R_F$ returns a fraction of it to the input node, as in the shunt-shunt CS stage. Loading worked in [[#Level 2 Loading and Two-Port Analysis|Level 2]].

## Level 2: Loading and Two-Port Analysis

### Why the ideal picture fails

Level 1 assumed a feedback network with ideal port impedances and signal flow in one direction only. Real circuits break five assumptions (Razavi Table 8.1):

| Difficulty | Example |
|---|---|
| **Loading** | $R_1+R_2$ draws current from the op-amp output (output loading); the divider's Thevenin resistance degenerates $M_1$ (input loading) |
| **Ambiguous decomposition** | Does $R_{D2}$ belong to the amplifier or the feedback network? |
| **Noncanonical topology** | Degenerated CS: the loop senses $I_D$ but the output of interest is $V_{out}$ |
| **Non-unilateral loop** | $C_{GD}$ sends signal backward through the forward amplifier; $R_F$ sends the input forward through the feedback network |
| **Multiple loops** | Global $R_F$ plus local degeneration plus $C_{GS}$ around a follower: which loop gain? |

| Method | Gives | Includes loading | Limits |
|---|---|---|---|
| Two-port (this level) | open-loop gain, $R_{in}$, $R_{out}$, $T$ | yes | neglects feedthrough and reverse transmission; canonical topologies only |
| Bode (Level 3) | exact closed-loop quantities | n/a, never breaks the loop | $T$ is a clean loop gain only for one feedback mechanism |
| Middlebrook (Level 3) | exact closed-loop quantities, forward vs reverse $T$ | n/a | needs distinguishable local and global loops |

### Two-port models

| Model | Equations | Each parameter measured with |
|---|---|---|
| Z | $V_1=Z_{11}I_1+Z_{12}I_2$, $V_2=Z_{21}I_1+Z_{22}I_2$ | the other port **open** |
| Y | $I_1=Y_{11}V_1+Y_{12}V_2$, $I_2=Y_{21}V_1+Y_{22}V_2$ | the other port **shorted** |
| H | $V_1=H_{11}I_1+H_{12}V_2$, $I_2=H_{21}I_1+H_{22}V_2$ | port 2 shorted / port 1 open |
| G | $I_1=G_{11}V_1+G_{12}I_2$, $V_2=G_{21}V_1+G_{22}I_2$ | port 2 open / port 1 shorted |

- **Pick the model whose controlling variable matches the device.** A MOS gate draws no current, so Z and H (controlled by $I_1$) are meaningless for a voltage amplifier. G fits: $G_{11}=1/Z_{in}$, $G_{22}=Z_{out}$, $G_{21}=A_0$ once internal feedback $G_{12}$ is dropped.
- $Y_{11}\ne1/Z_{11}$: one is taken with the far port shorted, the other with it open.
- The forward amplifier and the feedback network use the models that make their ports add: series ports add $Z$-type terms, shunt ports add $Y$-type terms.

### The loading recipe

```tikz title="Opening a voltage–voltage loop without losing the loading: copy the feedback network onto both ports of the amplifier. At the output it hangs with its far (series-connected) end open; at the input it appears with its near (shunt-connected) end shorted. After Razavi Figs. 8.52–8.53 and Ex. 8.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % closed loop
  \node[font=\bfseries\small] at (2.2,1.9) {closed loop};
  \draw (2,0) node[op amp,noinv input up](A){$A_0$};
  \draw (A.+) -- ++(-0.8,0) node[left] {$V_{in}$};
  \draw (A.out) -- ++(0.8,0) coordinate(o) node[above] {$V_{out}$};
  \draw (o) to[R,l=$R_1$] ++(0,-1.6) coordinate(t) to[R,l=$R_2$] ++(0,-1.4) node[ground]{};
  \fill (t) circle (1.5pt);
  \draw (A.-) -- ++(-0.4,0) |- (t);
  \node[font=\scriptsize,anchor=west] at ($(t)+(0.1,-0.25)$) {$V_F$};
  % open loop
  \begin{scope}[shift={(7.6,0)}]
    \node[font=\bfseries\small] at (2.2,1.9) {open loop, loading kept};
    \draw (2,0) node[op amp,noinv input up](B){$A_0$};
    \draw (B.+) -- ++(-0.8,0) node[left] {$V_{in}$};
    \draw (B.out) -- ++(0.8,0) coordinate(o2) node[above] {$V_{out}$};
    \draw (o2) to[R,l=$R_1$] ++(0,-1.6) to[R,l=$R_2$] ++(0,-1.4) node[ground]{};
    \node[font=\scriptsize,align=left,anchor=west] at ($(o2)+(0.9,-1.6)$) {output load:\\$R_1+R_2$\\(tap \emph{open})};
    \draw (B.-) -- ++(-0.4,0) coordinate(m);
    \draw (m) -- ++(0,-1.0) coordinate(n);
    \draw (n) -- ++(-0.6,0) to[R,l_=$R_1$] ++(0,-1.4) node[ground]{};
    \draw (n) -- ++(0.6,0) to[R,l=$R_2$] ++(0,-1.4) node[ground]{};
    \node[font=\scriptsize,align=left,anchor=west] at ($(n)+(1.4,-0.7)$) {input load:\\$R_1\parallel R_2$\\(top \emph{shorted})};
  \end{scope}
  \node[anchor=west] at (0.3,-3.9) {$A_{v,open}=\dfrac{V_{out}}{V_{in}}\Big|_{\text{right}},\qquad \beta=\dfrac{R_2}{R_1+R_2},\qquad A_{CL}=\dfrac{A_{v,open}}{1+\beta A_{v,open}}$};
\end{circuitikz}
\end{document}
```

> [!important] One rule for all four topologies
> To load a port, take a copy of the feedback network and terminate its **other** port the way that port is connected in the loop: a **shunt** connection is **shorted**, a **series** connection is **opened**. Then $\beta$ is the feedback network's forward parameter $(\cdot)_{21}$, $T=\beta A_{open}$, and every closed-loop quantity is the loaded open-loop value scaled by $1+T$.

| Topology | Amp / network model | Output-side load | Input-side load | $\beta$ |
|---|---|---|---|---|
| V–V (series–shunt) | G / G | $g_{11}$: port 2 open | $g_{22}$: port 1 shorted | $g_{21}=V_2/V_1\vert_{I_2=0}$ |
| I–V (series–series) | Y / Z | $z_{11}$: port 2 open | $z_{22}$: port 1 open | $z_{21}=V_2/I_1\vert_{I_2=0}$ |
| V–I (shunt–shunt) | Z / Y | $y_{11}$: port 2 shorted | $y_{22}$: port 1 shorted | $y_{21}=I_2/V_1\vert_{V_2=0}$ |
| I–I (shunt–series) | H / H | $h_{11}$: port 2 shorted | $h_{22}$: port 1 open | $h_{21}=I_2/I_1\vert_{V_2=0}$ |

(Port 1 of the feedback network faces the amplifier output; port 2 faces its input.)

$$
\boxed{A_{v,open}=\frac{A_0}{\left(1+\dfrac{g_{22}}{Z_{in}}\right)\left(1+g_{11}Z_{out}\right)},\qquad\beta=g_{21}}
$$

The two factors are voltage dividers: $Z_{in}/(Z_{in}+g_{22})$ at the input and $g_{11}^{-1}/(g_{11}^{-1}+Z_{out})$ at the output. The other three topologies have the same shape, with current dividers where a port is in shunt.

> [!note]- Derivation: voltage–voltage loading (Razavi Eqs. 8.65–8.70)
> Drop the amplifier's reverse generator $G_{12}V_{out}$ and the network's feedthrough $g_{12}I_{in}$ (unilateralize). KVL around the input and KCL at the output:
> $$V_{in}=V_e+g_{22}\frac{V_e}{Z_{in}}+g_{21}V_{out},\qquad g_{11}V_{out}+\frac{V_{out}-A_0V_e}{Z_{out}}=0.$$
> Eliminating $V_e$:
> $$\frac{V_{out}}{V_{in}}=\frac{A_0}{\left(1+\frac{g_{22}}{Z_{in}}\right)(1+g_{11}Z_{out})+g_{21}A_0},$$
> and dividing top and bottom by the two loading factors gives $A_{v,open}/(1+g_{21}A_{v,open})$. The loop gain falls out as $g_{21}A_{v,open}$; no separate break is needed.

> [!note]- Derivations: the other three (Razavi §8.5.3–8.5.5)
> $$G_{m,open}=\frac{Y_{21}}{(1+z_{22}Y_{11})(1+z_{11}Y_{22})},\ \beta=z_{21};\qquad R_{0,open}=\frac{Z_{21}}{(1+y_{22}Z_{11})(1+y_{11}Z_{22})},\ \beta=y_{21};\qquad A_{I,open}=\frac{H_{21}}{(1+h_{22}H_{11})(1+h_{11}H_{22})},\ \beta=h_{21}.$$
> Each pair of factors is (input divider) × (output divider). Reverse generators $Y_{12}, z_{12}$ / $Z_{12}, y_{12}$ / $H_{12}, h_{12}$ are neglected throughout.

> [!note]- Example: two CS stages with series–shunt feedback (Razavi Ex. 8.12)
> $M_1$ (load $R_{D1}$) drives $M_2$ (load $R_{D2}$); $R_F$ from the output to the source of $M_1$, $R_S$ from there to ground. Opened with loading: $M_1$ is degenerated by $R_F\parallel R_S$ (far end shorted), $M_2$ is loaded by $R_F+R_S$ (far end open):
> $$A_{v,open}=\frac{-R_{D1}}{R_F\parallel R_S+1/g_{m1}}\left\{-g_{m2}\left[R_{D2}\parallel(R_F+R_S)\right]\right\},\qquad\beta=\frac{R_S}{R_F+R_S}.$$
> Neglected: $C_{GD2}$ and the path from the source of $M_1$ through $R_F$ to the output ($M_1$ also acts as a follower).

> [!note]- Example: the TIA, and where the approximation shows (Razavi Ex. 8.15)
> CS stage with $R_F$ drain-to-gate, current input. Loaded open loop: $R_F$ at the input (output shorted) and $R_F$ at the output (input shorted):
> $$R_{0,open}=-R_Fg_m(R_F\parallel R_D),\quad\beta=y_{21}=-\frac1{R_F},\quad\frac{V_{out}}{I_{in}}=\frac{-R_Fg_m(R_F\parallel R_D)}{1+g_m(R_F\parallel R_D)}\to-R_F.$$
> $$R_{in}=\frac{R_F}{1+g_m(R_F\parallel R_D)},\qquad R_{out}=\frac{R_F\parallel R_D}{1+g_m(R_F\parallel R_D)}.$$
> Two inconsistencies betray the approximation: breaking at the gate gives $T=g_mR_D$, not $g_m(R_D\parallel R_F)$; and the true closed-loop $R_{out}$ is $R_D/(1+g_mR_D)$, while the two-port value equals $R_D/(1+g_mR_D+R_D/R_F)$. Replace $R_D$ by $R_D\parallel r_O$ if $\lambda>0$.

> [!note]- Example: an H-model solve exposes the approximations (Razavi Ex. 8.13)
> Model the forward amplifier with H and solve exactly:
> $$A_{v,open}=-\frac{H_{21}+g_{12}}{(H_{22}+g_{11})(H_{11}+g_{22})},\qquad\beta=H_{12}+g_{21}.$$
> The two-port answer is this with $g_{12}\ll H_{21}$ (feedthrough negligible) and $H_{12}\ll g_{21}$ (reverse transmission negligible). Useless for MOS in practice, since $H_{21}\to\infty$ for a gate input.

## Level 3: Exact Methods Without Breaking the Loop

### Bode's method: the A–D coefficients

Any linear circuit containing a transistor (feedback or not) can be written with that transistor's dependent source $I_1=g_mV_1$ left *unsubstituted*:

$$
V_{out}=A\,V_{in}+B\,I_1,\qquad V_1=C\,V_{in}+D\,I_1
$$

```tikz title="Two experiments give the four coefficients: disable the transistor (g_m = 0) and drive V_in; then zero V_in and drive I₁ as an independent source. After Razavi Figs. 8.69–8.70."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \node[font=\bfseries\small] at (2.2,3.0) {step 1: $g_m=0$ (transistor off)};
    \draw[rounded corners] (0.8,0.6) rectangle (3.8,2.4);
    \node[align=center,font=\scriptsize] at (2.3,1.8) {rest of circuit\\(linear)};
    \draw (0,0) node[ground]{} to[vsource,l=$V_{in}$] (0,1.5) -- (0.8,1.5);
    \draw (3.8,1.5) -- (4.6,1.5) node[right] {$V_{out}$};
    \draw (1.6,0.6) -- (1.6,0.1) node[below] {$V_1$};
    \draw (3.0,0.6) -- (3.0,0.3);
    \node[font=\scriptsize,below,align=center] at (3.0,0.3) {$I_1=0$\\(open)};
    \node[anchor=west] at (0,-1.3) {$A=\dfrac{V_{out}}{V_{in}},\quad C=\dfrac{V_1}{V_{in}}$};
  \end{scope}
  \begin{scope}[shift={(6.6,0)}]
    \node[font=\bfseries\small] at (2.2,3.0) {step 2: $V_{in}=0$, $I_1$ independent};
    \draw[rounded corners] (0.8,0.6) rectangle (3.8,2.4);
    \node[align=center,font=\scriptsize] at (2.3,1.8) {rest of circuit\\(linear)};
    \draw (0.2,1.5) node[ground,rotate=-90]{} -- (0.8,1.5);
    \draw (3.8,1.5) -- (4.6,1.5) node[right] {$V_{out}$};
    \draw (1.6,0.6) -- (1.6,0.1) node[below] {$V_1$};
    \draw (3.0,0.6) to[isource,l=$I_1$] (3.0,-0.8);
    \node[anchor=west] at (0,-1.3) {$B=\dfrac{V_{out}}{I_1},\quad D=\dfrac{V_1}{I_1}$};
  \end{scope}
  \node[anchor=west] at (0.5,-2.6) {put back $I_1=g_mV_1$:\qquad $\dfrac{V_{out}}{V_{in}}=A+\dfrac{g_mBC}{1-g_mD},\qquad T=-g_mD$ (return ratio)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{V_{out}}{V_{in}}=A+\frac{g_mBC}{1-g_mD},\qquad T=RR=-g_mD}
$$

- $A$ is **feedthrough**: what reaches the output with the transistor off. If $A=0$, the result looks like $A_0/(1+T)$ with "open-loop gain" $g_mBC$.
- The **return ratio** $-g_mD$ is the loop gain measured by replacing $g_mV_1$ with an independent source and seeing how much $V_1$ comes back. It works even when the loop can't be cleanly broken. The result is exact; nothing is neglected.
- Works for dependent voltage sources too.

> [!tip] Remark
> The degenerated CS stage, done this way (Razavi Ex. 8.20): $A=0$, $C=1$, $B=-r_OR_D/(R_D+r_O+R_S)$, $D=-r_OR_S/(R_D+r_O+R_S)$, giving
> $$\frac{V_{out}}{V_{in}}=\frac{-g_mr_OR_D}{R_D+r_O+(1+g_mr_O)R_S},$$
> the exact formula of [[Single-Stage]]. The source follower gives $T=g_mR_S$ and $A_v=g_mR_S/(1+g_mR_S)$ (Ex. 8.22).

> [!warning] "The" loop gain is not unique
> Return ratio = loop gain only if the circuit has **one** feedback mechanism **and** the loop passes through the chosen transistor. A device outside the loop has $RR=0$ (Razavi Ex. 8.23). In a two-stage amplifier where $R_1,R_2$ provide both global feedback and local degeneration of $M_1$, the two devices give different return ratios (Eqs. 8.206–8.207); disabling $M_1$ kills both mechanisms, disabling $M_2$ kills only one. The closed-loop gain is the same whichever device you pick.

> [!note]- Example: shunt-feedback CS stage, exactly (Razavi Exs. 8.18–8.21)
> $R_S$ from $V_{in}$ to the gate, $R_F$ gate-to-drain, $R_D$ load, $\lambda=0$. With $g_m=0$: $A=\dfrac{R_D}{R_D+R_S+R_F}$, $C=\dfrac{R_F+R_D}{R_D+R_S+R_F}$. With $V_{in}=0$: $B=-\dfrac{R_D(R_S+R_F)}{R_D+R_S+R_F}$, $D=-\dfrac{R_SR_D}{R_D+R_S+R_F}$. Hence
> $$T=\frac{g_mR_SR_D}{R_D+R_S+R_F},\qquad\frac{V_{out}}{V_{in}}=\frac{R_D}{R_D+R_S+R_F}+\frac{-g_mR_D(R_S+R_F)(R_F+R_D)}{(R_D+R_S+R_F+g_mR_SR_D)(R_D+R_S+R_F)}.$$
> It reduces to $-R_F/R_S$ only if **both** $R_D\ll R_F$ (no loading) and $g_mR_D\gg1$ (high gain). Breaking at the gate gives the same $T$: it is the one loading-free break point in this circuit.

> [!note]- Detail: when Bode's formula misbehaves
> The derivation divides by $B$ and $D$. For a follower with an ideal current-source load, $T=g_mR_S\to\infty$ and $B\to\infty$; the formula still happens to give the right answer there (Ex. 8.22), but in general an infinite $B$ or $D$ is a warning.

### Asymptotic gain: ideal gain plus feedthrough

$$
\boxed{\frac{V_{out}}{V_{in}}=H_\infty\frac{T}{1+T}+H_0\frac{1}{1+T},\qquad H_0=A\ (g_m=0),\quad H_\infty=A-\frac{BC}{D}\ (g_m\to\infty)}
$$

- $H_\infty$ is the **ideal** gain (infinitely strong transistor: its $V_1\to0$, a virtual ground). $H_0$ is the direct **feedthrough** with the transistor off.
- To find $H_\infty$, set the nominated device's $V_{GS}=0$ and solve; this is how you get $-R_2/R_1$ instantly for an inverting amplifier made of two transistors (Razavi Ex. 8.32).

> [!tip] Remark
> This is Carusone's $A_{CL}=\frac1\beta\frac{L}{1+L}$ with $H_\infty=1/\beta$ and the feedthrough term added. The feedthrough is what an ideal block diagram cannot show and what limits reverse isolation.

> [!note]- Detail: the asymptotic form depends on which device you nominate (Razavi Ex. 8.32)
> CS stage $M_1$ (load $R_D$) driving follower $M_2$ (load $R_S$), with $R_1$ from $V_{in}$ to the gate of $M_1$ and $R_2$ from the output back to it. Nominating $M_1$: $H_\infty=-R_2/R_1$, $H_0=\dfrac{(1/g_{m2})\parallel R_S}{(1/g_{m2})\parallel R_S+R_1+R_2}$. Nominating $M_2$: $H_\infty=\dfrac{-g_{m1}R_2R_D}{R_1+R_2+g_{m1}R_1R_D}$ (a non-ideal op amp with an ideal buffer), $H_0=\dfrac{R_S}{R_S+R_1+R_2}$. Different $H_\infty$, $H_0$, $T$; same total. Razavi notes that a direct nodal analysis is sometimes simpler.

### Blackman's impedance theorem

```tikz title="Three return-ratio-style measurements give any port impedance exactly. After Razavi Fig. 8.76."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \x/\t/\port in {0/{$A$: $g_m=0$}/probe, 4.6/{$T_{oc}$: port open}/open, 9.2/{$T_{sc}$: port shorted}/short} {
    \begin{scope}[shift={(\x,0)}]
      \node[font=\bfseries\small] at (1.8,2.9) {\t};
      \draw[rounded corners] (1.0,0.3) rectangle (3.6,2.3);
      \draw (1.0,1.8) -- (0.3,1.8) node[left] {$P$};
      \draw (1.0,0.8) -- (0.3,0.8) node[left] {$Q$};
      \fill (0.3,1.8) circle (1.5pt); \fill (0.3,0.8) circle (1.5pt);
      \draw (2.0,0.3) -- (2.0,-0.1) node[below] {$V_1$};
      \draw (3.0,0.3) -- (3.0,-0.1) node[below] {$I_1$};
    \end{scope}
  }
  \node[font=\scriptsize,align=center] at (2.3,1.3) {$Z$ with\\transistor off};
  \node[font=\scriptsize,align=center] at (6.9,1.3) {$-g_mV_1/I_1$};
  \draw (9.5,1.8) -- (9.5,0.8);
  \node[font=\scriptsize,align=center] at (11.5,1.3) {$-g_mV_1/I_1$};
  \node[anchor=west] at (0.3,-1.4) {$\boxed{Z_{PQ}=A\,\dfrac{1+T_{sc}}{1+T_{oc}}}\qquad T_{sc}\gg1:\ Z\uparrow;\quad T_{oc}\gg1:\ Z\downarrow$};
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_{PQ}=A\,\frac{1+T_{sc}}{1+T_{oc}}}
$$

- $A$: impedance with the transistor disabled ($g_m=0$), the "open-loop" impedance.
- $T_{oc}$: return ratio with the port **open**. $T_{sc}$: return ratio with the port **shorted**.
- If $T_{sc}\approx0$, $Z$ is divided by $1+T_{oc}$ (shunt at that port). If $T_{oc}\approx0$, $Z$ is multiplied by $1+T_{sc}$ (series at that port). In general it is *neither* a pure multiply nor divide by one loop gain.
- Works for noncanonical topologies: it never asks what kind of feedback is present.

**Degenerated CS output resistance** (Razavi Ex. 8.25): $A=r_O+R_S$, $T_{oc}=0$ (no current in $R_S$ when open), $T_{sc}=g_m(R_S\parallel r_O)$:

$$
\boxed{R_{out}=(r_O+R_S)\left[1+g_m(R_S\parallel r_O)\right]=(1+g_mr_O)R_S+r_O}
$$

**With an amplifier $A_1$ sensing the source and driving the gate** (Razavi Ex. 8.26, the gain-boosted cascode): $T_{sc}=g_m(R_S\parallel r_O)A_1$, so

$$
\boxed{R_{out}=r_O+R_S+g_mr_OR_SA_1\approx(1+g_mr_O)A_1R_S+r_O}
$$

**CG input resistance** (Razavi Ex. 8.30): $A=R_D+r_O$, $T_{sc}=0$, $T_{oc}=g_mr_O$:

$$
\boxed{R_{in}=\frac{R_D+r_O}{1+g_mr_O}}
$$

> [!tip] Remark
> These are exactly the cascode and common-gate results of [[Single-Stage]], and the $A_1$ boost is the regulated cascode of [[Operational Amplifiers]]. Blackman gets them in three lines without a small-signal KCL.

> [!note]- Detail: when Blackman fails (Razavi Exs. 8.27–8.29)
> The proof divides by $A$. If disabling the transistor leaves the port floating ($A=\infty$), e.g. a source follower's output or the shunt-shunt circuit of Ex. 8.9, the theorem breaks; two ideal current sources may even end up in series and $T_{oc}$ has no solution. Fix: put a resistor $R_T$ across the port (or the floating node), apply the theorem, then let $R_T\to\infty$. In Ex. 8.29 this gives $R_{in}\to\dfrac{1}{g_{m2}}\cdot\dfrac{1}{1+g_{m1}R_DC_1/(C_1+C_2)}$: $1/g_m$ divided by one plus the loop gain.

> [!note]- Detail: the sign of $T_{oc}$ is not the feedback polarity (Razavi Exs. 8.30–8.31)
> In the CG stage, the feedback through $r_O$ is positive, yet $T_{oc}=g_mr_O>0$, because a second mechanism (degeneration by the infinite source resistance) is also present. In a two-transistor circuit with positive feedback through $M_2$, $RR_1=\frac{1-g_{m2}R_D}{1+g_{m2}R_S}g_{m1}R_S$ and $RR_2=\frac{1-g_{m1}R_D}{1+g_{m1}R_S}g_{m2}R_S$ can each take either sign. Do not read stability off the sign of one return ratio.

> [!note]- Detail: the double-null form (Razavi §8.9)
> Blackman generalizes to any transfer function:
> $$\frac{V_{out}}{V_{in}}=A\,\frac{1+T_{out,0}}{1+T_{in,0}},$$
> where $T_{in,0}$ is the return ratio with the input nulled ($=-g_mD$) and $T_{out,0}$ the return ratio with $V_{in}$ and $I_1$ chosen to null the output ($=-g_m(AD-BC)/A$). A nonzero $T_{out,0}$ reveals an internal loop that stays active even with the output forced to zero (Ex. 8.33). It fails whenever $A=0$, which is common in CMOS, including the plain degenerated CS stage.

### Middlebrook's method

Insert a test voltage $V_t$ in series with a branch and a test current $I_t$ into the node beside it; nothing is broken, so loading never enters.

$$
\boxed{H=H_\infty\frac{1+1/T_2}{1+1/T_1},\qquad T_1=\frac{T_{fwd}}{1+T_{rev}},\quad T_{fwd}=T_i\parallel T_v,\quad T_{rev}=\frac{1}{T_i'}\parallel\frac{1}{T_v'}}
$$

- $T_i$, $T_v$: forward current and voltage loop gains (short-circuit and open-circuit). $1/T_i'$, $1/T_v'$: the reverse ones. $H_\infty$: $V_{out}/V_{in}$ with $V_t$, $I_t$ chosen to null the error ($V_1=I_1=0$). $T_2$: same as $T_1$ with $V_{out}$ nulled.
- **The insight:** reverse transmission degrades the effective loop gain as soon as $T_{rev}$ approaches 1, even if $T_{rev}\ll T_{fwd}$.
- Only valid if the injection point carries the loop's *error* signal and sits inside the major loop but outside every minor loop. A degenerated CS stage with $\lambda>0$ meets neither condition. More algebra than Bode's method.

> [!note]- Detail: the four injection measurements (Razavi Eqs. 8.200–8.204)
> With $V_{in}=0$:
> $$\frac1{T_1}=\frac1{T_i}+\frac1{T_v}+\frac1{T_i'T_v'},\quad T_i=\frac{I_1}{I_2}\Big|_{V_1=0},\quad T_v=\frac{V_1}{V_2}\Big|_{I_1=0},\quad\frac1{T_i'}=\frac{I_2}{I_1}\Big|_{V_2=0},\quad\frac1{T_v'}=\frac{V_2}{V_1}\Big|_{I_2=0}.$$
> With no reverse propagation, $1/T_i'=1/T_v'=0$ and $T_1=T_i\parallel T_v$.

### Where to break the loop (and how to do it in a simulator)

> [!important] Best break points
> (a) The **gate–source** of a MOSFET, injecting a voltage. (b) The **dependent current source** of a MOSFET, injecting a current and reading back its $V_{GS}$; multiply by $g_m$. The two differ only by $g_m$, and (b) is the return ratio. A negative-feedback loop always passes through at least one gate (only the CS configuration inverts), so a loading-free break always exists, for a loop with one feedback mechanism.

- Breaking at a low-impedance node (e.g. the far end of $R_1$ in a divider) removes the current $R_1$ drew from the previous stage and changes its gain. Breaking at a gate does not (at low frequency).
- If $C_{GS2}$ matters, break *after* it so $M_1$ still sees it as load.
- $C_{GD}$ bridges the very gate–source pair being broken, so no clean break exists at high frequency; the measured $T$ depends on whether that local loop is also nulled.
- A single-source injection without breaking ($T=(Y/W)^{-1}-1$, Razavi Fig. 8.90) assumes a unilateral loop; in a real circuit different injection points give different answers.

```tikz title="Breaking the loop in simulation without disturbing the bias: a huge inductor closes the loop at DC and opens it at AC; a huge capacitor couples the test source in. After Carusone Fig. 5.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[left,align=right,font=\scriptsize] {returned side\\(from $\beta$)} -- (0.6,0) coordinate(r);
  \fill (r) circle (1.5pt) node[above] {$v_r$};
  \draw (r) to[L,l=$L\to\infty$] (3.4,0) coordinate(f);
  \fill (f) circle (1.5pt);
  \draw (f) -- (4.4,0) node[right,align=left,font=\scriptsize] {forward side\\(to $A$, e.g.\ a gate)};
  \draw (f) to[C,l=$C\to\infty$] (3.4,-1.6) to[vsource,l=$v_t$] (3.4,-3.2) node[ground]{};
  \draw (r) to[R,l_=$Z_t$] (0.6,-1.8) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (4.4,-1.8) {DC: $L$ shorts the break, bias unchanged\\AC: $L$ open, $C$ short, $v_t$ drives forward side\\$Z_t$ = impedance the forward side presented\\(omit if the break is at a gate)\\[3pt]$L(s)=-v_r/v_t$};
\end{circuitikz}
\end{document}
```

The loop gain from this setup neglects signals circulating backward around the loop. That is accurate when forward gain dominates, which is the usual case for feedback amplifiers (Carusone §5.4.1). Phase margin is read off exactly this $L(j\omega)$: see [[Stability]].

## Level 4: Dynamics of the Closed Loop

```tikz title="Closed-loop response: ≈1/β while |A| ≫ 1/β, ≈A beyond the crossover at ω_t (|L| = 1). Low phase margin makes it peak near ω_t. After Carusone Figs. 5.2 and 5.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9,0) node[right] {$\log\omega$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$\log|\cdot|$};
  % open-loop amplifier A: flat 4.2 until 1, slope -1 until 6, then -2
  \draw[thick] (0,4.2) -- (1,4.2) -- (5.0,0.2);
  \node[font=\scriptsize,anchor=south west] at (1.05,4.2) {$|A(\omega)|$};
  % 1/beta line
  \draw[densely dashed] (0,1.6) -- (8.4,1.6) node[right,font=\scriptsize] {$1/\beta$};
  % crossing at x = 1 + (4.2-1.6) = 3.6
  \draw[densely dotted] (3.6,0) -- (3.6,1.6);
  \node[below,align=center,font=\scriptsize] at (3.6,0) {$\omega_t$\\$|L|=1$};
  % closed loop, PM >= 60: follows 1/beta then A
  \draw[very thick,blue!70!black] (0,1.6) -- (3.0,1.6) .. controls (3.6,1.55) and (3.9,1.3) .. (4.2,1.0) -- (4.9,0.3);
  % closed loop, PM < 60: peaking
  \draw[thick,red!70!black] (0,1.6) -- (2.6,1.6) .. controls (3.2,1.7) and (3.4,2.5) .. (3.7,2.4) .. controls (4.0,2.3) and (4.2,1.0) .. (4.5,0.7) -- (4.9,0.3);
  \node[font=\scriptsize,anchor=west,blue!70!black] at (5.0,3.6) {$A_{CL}$, PM $\ge 60^\circ$: flat to $\approx\omega_t$};
  \node[font=\scriptsize,anchor=west,red!70!black] at (5.0,3.1) {$A_{CL}$, PM $<60^\circ$: peaks near $\omega_t$};
  \node[font=\scriptsize,anchor=west] at (0.1,0.9) {$|A|\gg1/\beta$: $A_{CL}\approx1/\beta$};
  \node[font=\scriptsize,anchor=west] at (5.6,0.9) {$|A|\ll1/\beta$: $A_{CL}\approx A$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_{CL}(s)=\frac1\beta\cdot\frac{L(s)}{1+L(s)}}
$$

The poles, zeros and bandwidth of the closed loop are those of $L/(1+L)$; $1/\beta$ is just a scale factor. The feedback network must be fast and accurate; the amplifier only needs gain.

### First-order loop

Model $L(s)=L_0/(1+s/\omega_{p1})$. Around crossover, $L(s)\approx\omega_t/s$ with $\omega_t\approx L_0\omega_{p1}$:

$$
\boxed{A_{CL}(s)\approx\frac{1/\beta}{1+s/\omega_t},\qquad\omega_{-3\,dB}\approx\omega_t\approx\beta\,\omega_{ta},\qquad\tau=\frac1{\omega_t}}
$$

- $\omega_{ta}$ is the op amp's own unity-gain frequency. Closed-loop bandwidth $\times$ closed-loop gain $\approx\omega_{ta}$: Razavi's constant gain–bandwidth product again.
- A one-pole loop is unconditionally stable with $\approx90^\circ$ phase margin.
- Linear settling: $V_{step}(1-e^{-t/\tau})$. **1% in $4.6\tau$, 0.1% in $\approx7\tau$.** Initial slope $V_{step}/\tau$; if the stage cannot supply $C\cdot V_{step}/\tau$ it slews and this model no longer applies ([[Operational Amplifiers]]).

> [!note]- Example: op-amp bandwidth for a switched-capacitor stage (Carusone Ex. 5.6)
> Capacitive inverting stage, 0.1% settling in 0.1 µs, so $7\tau\le0.1$ µs, $\tau\le14.2$ ns. With $\beta=C_2/(C_1+C_2)$ ($C_2$ the feedback capacitor, $C_1$ the input capacitor), $\omega_t=\beta\omega_{ta}$, so $\omega_{ta}\ge\frac{C_1+C_2}{C_2}\cdot\frac{1}{14.2\text{ ns}}$. For $C_2=10C_1$: $f_{ta}\ge12.3$ MHz. For $C_2=0.2C_1$ (gain 5): $f_{ta}\ge66.8$ MHz. Higher closed-loop gain, smaller $\beta$, faster op amp needed.

### Second-order loop

Model $L(s)=L_0/[(1+s/\omega_{p1})(1+s/\omega_{eq})]$, with $\omega_{eq}$ lumping every pole and zero above the dominant one. The closed loop is a second-order low-pass:

$$
\boxed{\omega_0=\sqrt{(1+L_0)\,\omega_{p1}\omega_{eq}},\qquad Q\approx\sqrt{\frac{\beta\,\omega_{ta}}{\omega_{eq}}},\qquad\%\,OS=100\,e^{-\pi/\sqrt{4Q^2-1}}\ (Q>0.5)}
$$

$$
\boxed{\frac{1}{\omega_{eq}}\approx\sum_{i\ge2}\frac1{\omega_{pi}}-\sum_i\frac1{\omega_{zi}}\qquad(\text{in simulation: where }\angle L=-135^\circ)}
$$

| Phase margin | $Q$ | Step overshoot |
|---|---|---|
| 60° | 0.82 | 8.7% |
| 65° | 0.72 | 4.7% (≈ no peaking) |
| 70° | 0.62 | 1.4% |
| 75° | 0.53 | ≈0 |

(Carusone Table 5.1.) **Larger $\beta$ means larger $Q$**: the worst case for an amplifier used at several gains is the **lowest** closed-loop gain (unity-gain buffer). Phase margin, its definition, and compensation belong to [[Stability]].

> [!note]- Derivation: $\omega_0$ and $Q$ (Carusone Eqs. 5.42–5.47)
> Substituting $L(s)$ into $A_{CL}=\frac1\beta\frac{L}{1+L}$:
> $$A_{CL}(s)=\frac{A_{CL0}}{1+\dfrac{s(1/\omega_{p1}+1/\omega_{eq})}{1+L_0}+\dfrac{s^2}{(1+L_0)\omega_{p1}\omega_{eq}}},\qquad A_{CL0}=\frac{L_0/\beta}{1+L_0}.$$
> Matching to $1+s/(\omega_0Q)+s^2/\omega_0^2$: $\omega_0=\sqrt{(1+L_0)\omega_{p1}\omega_{eq}}$ and $Q=\dfrac{\sqrt{(1+L_0)/(\omega_{p1}\omega_{eq})}}{1/\omega_{p1}+1/\omega_{eq}}\approx\sqrt{L_0\omega_{p1}/\omega_{eq}}=\sqrt{\beta\omega_{ta}/\omega_{eq}}$ for $L_0\gg1$, $\omega_{p1}\ll\omega_{eq}$.

> [!note]- Detail: the closed-loop gain at $\omega_t$ (Carusone Ex. 5.5)
> At crossover $L(\omega_t)=-e^{j\theta}$ with $\theta$ the phase margin, so $|A_{CL}(\omega_t)|=\dfrac{1}{\beta\sqrt{2(1-\cos\theta)}}$. This exceeds $1/\beta$ when $\theta<60^\circ$: the response rises before it falls, which is the peaking in the figure above.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $\beta$ (lower closed-loop gain) | $T$: accuracy, linearity, bandwidth ($\omega_t=\beta\omega_{ta}$), impedance correction | Closed-loop gain; $Q$ rises, so phase margin is worst at the smallest gain |
| ↑ forward gain $A$ (cascode, more stages) | Gain error $1/(1+T)$, linearity, $R_{out}$ reduction | More poles in the loop, harder [[Stability]]; headroom |
| Passive (R or C) feedback network | $\beta$ is a ratio: process/temperature stable, linear, wideband | Resistors add noise and load the amplifier; C needs DC bias defined elsewhere |
| Sense output voltage (shunt) | Low $R_{out}$ without extra current | Feedback network loads the output |
| Sense output current (series) | High $R_{out}$ (current source, charger, cascode boost) | Headroom across the sense element |
| Return a current (shunt) | Very low $R_{in}$: TIA, photodiode bandwidth $\times(1+A)$ | $R_F$ thermal noise lands directly on the input node |
| Return a voltage (series) | High $R_{in}$ (buffer) | Needs a differential input or a source-driven device |
| Split gain over cascaded closed-loop stages | Bandwidth for a given total gain | Power; overall bandwidth below each stage's |
| Wider loop bandwidth | Faster settling ($\tau=1/\omega_t$) | More integrated noise; more phase margin pressure |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Closed-loop gain | $Y/X = A/(1+\beta A) = \frac1\beta\frac{T}{1+T}$, $T=\beta A$ |
| Gain error | $1/(1+T_0)$ |
| Loop gain by breaking | $T=-V_F/V_t$, input zeroed |
| One-pole bandwidth | pole at $(1+\beta A_0)\omega_0$, gain $A_0/(1+\beta A_0)$ |
| Nonlinearity | $r_{closed}\approx1-\frac{\Delta A}{A_1}\frac1{1+\beta A_2}$ |
| Noise | $V_{n,in,closed}=V_{n,in,open}$ (noiseless $\beta$) |
| Port impedances | $R_{closed}=R_{open}(1+T)^{\pm1}$: series ×, shunt ÷ |
| V–V | $R_{out}/(1+\beta A_0)$, $R_{in}(1+\beta A_0)$ |
| I–V | $G_m/(1+G_mR_F)$, $R_{out}(1+G_mR_F)$ |
| V–I | $R_0/(1+g_{mF}R_0)$, both $R$ ÷ $(1+T)$ |
| Shunt-feedback CS | $R_{in}=R_F/(1+g_mR_D)$, $R_{out}=(1/g_m)\parallel R_D$ |
| Loaded V–V open loop | $A_{v,open}=A_0/[(1+g_{22}/Z_{in})(1+g_{11}Z_{out})]$, $\beta=g_{21}$ |
| Bode | $V_{out}/V_{in}=A+g_mBC/(1-g_mD)$, $T=-g_mD$ |
| Asymptotic gain | $H_\infty\frac{T}{1+T}+H_0\frac1{1+T}$ |
| Blackman | $Z=A(1+T_{sc})/(1+T_{oc})$ |
| Degenerated CS $R_{out}$ | $(1+g_mr_O)R_S+r_O$ |
| Boosted $R_{out}$ | $\approx(1+g_mr_O)A_1R_S+r_O$ |
| CG $R_{in}$ | $(R_D+r_O)/(1+g_mr_O)$ |
| Middlebrook | $H=H_\infty\frac{1+1/T_2}{1+1/T_1}$, $T_1=T_{fwd}/(1+T_{rev})$ |
| Closed loop from $L$ | $A_{CL}=\frac1\beta\frac{L}{1+L}$ |
| First order | $\omega_{-3dB}\approx\omega_t\approx\beta\omega_{ta}$, $\tau=1/\omega_t$; 1%: $4.6\tau$, 0.1%: $7\tau$ |
| Second order | $\omega_0=\sqrt{(1+L_0)\omega_{p1}\omega_{eq}}$, $Q\approx\sqrt{\beta\omega_{ta}/\omega_{eq}}$ |
| Overshoot | $100e^{-\pi/\sqrt{4Q^2-1}}$ % |
| Equivalent second pole | $1/\omega_{eq}\approx\sum_{i\ge2}1/\omega_{pi}-\sum1/\omega_{zi}$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 8 Feedback, pp. 274–339:
  - §8.1 General considerations, pp. 274–286: four elements, gain desensitization, loop-gain measurement, terminal impedances, bandwidth (Fig. 8.10–8.11), nonlinearity (Eqs. 8.22–8.28), amplifier types, sense and return mechanisms.
  - §8.2 Feedback topologies, pp. 286–298: Examples 8.4–8.10, TIA for photodiodes (Fig. 8.40), current–current (Fig. 8.42).
  - §8.3 Effect of feedback on noise, pp. 298–299.
  - §8.4 Analysis difficulties, pp. 299–303 (Tables 8.1, 8.2).
  - §8.5 Effect of loading, pp. 303–315: two-port models, loading in all four topologies, Examples 8.12–8.17, summary Fig. 8.67.
  - §8.6 Bode's analysis, pp. 315–330: A–D coefficients, return ratio, Examples 8.18–8.24; Blackman's theorem, Examples 8.25–8.31.
  - §8.7 Middlebrook's method, pp. 331–332. §8.8 Loop-gain calculation issues, pp. 332–336. §8.9 Asymptotic gain and double-null, pp. 336–339. Problem 8.4.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24), Ch. 5 Feedback Amplifiers, pp. 204–235:
  - §5.1 Ideal model, gain sensitivity, bandwidth, linearity, pp. 204–208 (Exs. 5.1–5.2).
  - §5.2 Dynamic response (only the closed-loop peaking result, Ex. 5.5 and Fig. 5.6, is used here; stability criteria are left to [[Stability]]), pp. 208–213.
  - §5.3 First- and second-order feedback systems, pp. 213–220 (Ex. 5.6, Table 5.1, Eq. 5.50).
  - §5.4 Common feedback amplifiers: loop-gain procedure and simulation break (Fig. 5.14), non-inverting and transimpedance amplifiers, Exs. 5.8–5.14, pp. 220–234.
- **Zettelkasten extensions** (`AnalogTheory/Feedback/`, `S7 Feedback`): 7a2 (cascade bandwidth $\omega_1\sqrt{2^{1/n}-1}$), 7a3 (linearity improvement vanishes when the stage clips or the loop gain rolls off), 7a4 (feedback-network noise $4kT(R_1\parallel R_2)$, integrated noise grows with bandwidth), 7c4a/7e4a (returned quantity must match the drive; Norton conversion), 7f2a/7g2 (return ratios differ by device and their sign does not give polarity), 7f3 ($C_{GD}$ spoils any clean break). The "short a shunt port, open a series port" summary of the loading rules is a restatement of Razavi Fig. 8.67.
