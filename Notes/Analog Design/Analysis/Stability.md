---
title: Stability
description: When closing a feedback loop makes it ring or oscillate, how phase margin measures how close it is, and how dominant-pole, Miller, nulling-resistor and cascode compensation fix one- and two-stage op amps.
kind: topic
status: growing
aliases:
  - Stability
  - Stability and Compensation
---

[[Feedback]] gives you the loop gain $\beta H$ (Carusone writes it $L$). This note asks whether it is safe to close that loop, and what to change if it isn't. It opens with the whole chapter on one screen. Each section after that goes one level deeper: the oscillation condition, pole counting, phase margin, compensation, two-stage op amps, slewing, better compensation networks, and finally Nyquist, which says when the Bode reasoning used everywhere else can be trusted. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="Loop-gain Bode plot. Stable when the gain crossover (GX, where |βH| = 1) comes before the phase crossover (PX, where ∠βH = -180°). Phase margin is how far the phase is from -180° at GX. After Razavi Figs. 10.2 and 10.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.25cm,y=1cm]
  \coordinate (rail) at (0,0);
  % magnitude panel
  \draw[->] (0,4.5) -- (7.4,4.5) node[right] {$\log\omega$};
  \draw[->] (0,2.6) -- (0,8.3) node[above] {$20\log|\beta H|$};
  \node[left,font=\scriptsize] at (0,4.5) {0 dB};
  \draw[very thick] (0,7.5) -- (1,7.5) -- (4.2,4.3) -- (5.0,2.7);
  \node[font=\scriptsize,anchor=south] at (1,7.55) {$\omega_{p1}$};
  \node[font=\scriptsize,anchor=north east] at (4.1,4.2) {$\omega_{p2}$};
  \node[font=\scriptsize,anchor=south west] at (2.4,6.1) {$-20$ dB/dec};
  \draw[dotted] (4,4.5) -- (4,-2.4);
  \draw[dotted] (4.7,4.5) -- (4.7,-2.4);
  \draw[<->,blue!70!black] (4.7,4.5) -- (4.7,3.3);
  \node[font=\scriptsize,blue!70!black,anchor=west] at (4.75,3.6) {gain margin};
  % phase panel
  \draw[->] (0,1.5) -- (7.4,1.5) node[right] {$\log\omega$};
  \draw[->] (0,-2.5) -- (0,2.3) node[above] {$\angle\beta H$};
  \foreach \y/\l in {1.5/0,0.25/-90,-1/-180,-2.25/-270} {\draw (0.06,\y) -- (-0.06,\y) node[left,font=\scriptsize] {$\l^\circ$};}
  \draw[dashed] (0,-1) -- (7.2,-1);
  \draw[very thick,domain=0:7,samples=90] plot (\x,{1.5+(2.5/180)*(-atan(10^(max(-3,min(3,\x-1))))-atan(10^(max(-3,min(3,\x-4.2))))-atan(10^(max(-3,min(3,\x-5.2)))))});
  \draw[<->,red!70!black,thick] (4,-1) -- (4,-0.25);
  \node[font=\scriptsize,red!70!black,anchor=east] at (3.95,-0.6) {PM};
  \node[font=\scriptsize,anchor=north east] at (4.02,-2.45) {GX ($\omega_t$)};
  \node[font=\scriptsize,anchor=north west] at (4.68,-2.45) {PX};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Oscillation:** a loop can oscillate at $\omega_1$ if $|\beta H(j\omega_1)| = 1$ and $\angle\beta H(j\omega_1) = -180^\circ$. Stable (for ordinary loops) when the gain crossover comes before the phase crossover. The worst case is $\beta = 1$.
> 2. **Phase margin:** $\text{PM} = 180^\circ + \angle\beta H(\omega_t)$. Aim for about $60^\circ$: no peaking, little ringing. A PM above $45^\circ$ needs $\omega_t$ below the first nondominant pole, so **the compensated bandwidth cannot exceed the second pole**.
> 3. **Compensation** either removes poles (fewer stages) or lowers the dominant pole so $|\beta H|$ hits 1 sooner. A one-pole loop has $\omega_t = \beta g_m/C$: one-stage op amps are compensated by their load capacitor.
> 4. **Two-stage Miller compensation:** $C_C$ across the second stage splits the poles, $\omega_{p1}\approx 1/(g_{m7}R_1R_2C_C)$ and $\omega_{p2}\approx g_{m7}/C_L$, and gives $\omega_t = \beta g_{m1}/C_C$. Start from $C_C \approx \beta g_{m1}C_L/g_{m7}$. Its feedforward path adds a right-half-plane zero at $g_{m7}/C_C$; a series resistor $R_C \ge 1/g_{m7}$ removes it or turns it into a phase lead.
> 5. **Slew rate** of a two-stage op amp: $\text{SR} = I_{tail}/C_C = V_{ov1}\,\omega_{ta}$. Compensation sets large-signal speed too.

**Map:** [[#Level 0 When a Loop Oscillates|Barkhausen]] → [[#Level 1 Counting Poles|one, two, three poles]] → [[#Level 2 Phase Margin|phase margin]] → [[#Level 3 Frequency Compensation|dominant-pole and one-stage compensation]] → [[#Level 4 Compensating Two-Stage Op Amps|Miller, RHP zero, nulling resistor]] → [[#Level 5 Slewing|slew rate]] → [[#Level 6 Other Compensation Techniques|follower and cascode compensation]] → [[#Level 7 Nyquist's Criterion|Nyquist]].

## Level 0: When a Loop Oscillates

### Barkhausen's criteria

```tikz title="Negative feedback already inverts the signal once (-180°). If H adds another -180° at ω1 and the loop gain is still 1, the returned noise adds in phase and builds up. After Razavi Fig. 10.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) node[left] {$X$} -- (1,0);
  \draw (1.3,0) circle (0.3);
  \node at (1.3,0) {$\Sigma$};
  \node[font=\scriptsize] at (0.85,0.3) {$+$};
  \node[font=\scriptsize] at (1.65,-0.5) {$-$};
  \draw[->] (1.6,0) -- (2.6,0);
  \draw (2.6,-0.5) rectangle (4.2,0.5);
  \node at (3.4,0) {$H(s)$};
  \draw[->] (4.2,0) -- (6,0) node[right] {$Y$};
  \draw (5.2,0) node[circ]{} -- (5.2,-1.8) -- (4.2,-1.8);
  \draw (2.6,-2.3) rectangle (4.2,-1.3);
  \node at (3.4,-1.8) {$\beta$};
  \draw[->] (2.6,-1.8) -- (1.3,-1.8) -- (1.3,-0.3);
  \node[font=\scriptsize,red!70!black] at (3.4,0.8) {$-180^\circ$ at $\omega_1$};
  \node[font=\scriptsize,red!70!black,anchor=east] at (1.15,-1.1) {$-180^\circ$ (inversion)};
  \node[font=\scriptsize,anchor=west,align=left] at (6.6,-0.9) {at $\omega_1$: $|\beta H|=1$, $\angle\beta H=-180^\circ$\\total $-360^\circ$ around the loop:\\the returned signal adds in phase};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{Y}{X}=\frac{H(s)}{1+\beta H(s)},\qquad \text{oscillation at }\omega_1\text{ if}\quad |\beta H(j\omega_1)|=1\ \text{ and }\ \angle\beta H(j\omega_1)=-180^\circ}
$$

> [!tip] Remark
> $\beta H$ is the loop gain $T$ (Razavi) or $L$ (Carusone) of [[Feedback#Closed-loop gain and loop gain]], and you get it the same way: [[Feedback#Measuring the loop gain|break the loop]]. Stability depends only on the loop gain, not on where the input and output are.

- Both conditions are needed: the phase makes the feedback positive, the gain lets the signal grow.
- **Gain crossover (GX)**, $\omega_t$: where $|\beta H| = 1$. It is the unity-gain bandwidth of the loop gain. **Phase crossover (PX):** where $\angle\beta H = -180^\circ$. A stable loop has GX well before PX.
- Two equivalent ways to say "unstable": too much gain at PX, or too much phase at GX.
- **Gain margin** is the standard companion number: how far $|\beta H|$ is below 0 dB at PX. Razavi and this note work with phase margin.

### Poles and the time response

```tikz title="Where the closed-loop poles sit decides the step response: right half plane grows, jω axis rings forever, left half plane decays. After Razavi Fig. 10.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\sp/\k/\lab in {0/0.8/0.45/{RHP: grows},4.4/0/0/{$j\omega$ axis: sustained},8.8/-0.8/-0.45/{LHP: decays}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (-1.5,0) -- (1.6,0) node[right] {$\sigma$};
      \draw[->] (0,-1.2) -- (0,1.3) node[above] {$j\omega$};
      \node[font=\large] at (\sp,0.8) {$\times$};
      \node[font=\large] at (\sp,-0.8) {$\times$};
      \begin{scope}[yshift=-2.7cm]
        \draw[->] (-0.2,0) -- (3.2,0) node[right] {$t$};
        \draw[->] (-0.2,-1) -- (-0.2,1.1);
        \draw[thick,domain=0:3,samples=150] plot (\x,{0.35*exp(\k*\x)*sin(\x*420)});
        \node[font=\scriptsize] at (1.5,-1.35) {\lab};
      \end{scope}
    \end{scope}
  }
\end{circuitikz}
\end{document}
```

A pole at $s_p = \sigma_p + j\omega_p$ puts $e^{\sigma_pt}e^{j\omega_pt}$ in the impulse response. $\sigma_p > 0$ grows, $\sigma_p = 0$ oscillates at constant amplitude, $\sigma_p<0$ decays. Plotting the closed-loop poles as the loop gain varies is the **root locus**.

### Weaker feedback is always safer

Lowering $\beta$ shifts $|\beta H|$ down and moves GX left, while $\angle\beta H$ does not depend on $\beta$ at all. So:

- **The worst case is $\beta = 1$** (unity-gain buffer). Stability is usually checked with $\beta H = H$.
- An amplifier stable at unity gain is stable at every higher closed-loop gain. A design that only ever runs at gain 4 can be compensated for $\beta\approx 0.25$ ([[#Lower β relaxes the compensation|below]]).
- Switched-capacitor circuits change $\beta$ from phase to phase; check the largest one ([[Switched-Capacitor Circuits]]).

> [!tip] Remark
> This is the same statement as [[Feedback#Second-order loop]]: $Q\approx\sqrt{\beta\omega_{ta}/\omega_{eq}}$ grows with $\beta$, so the lowest closed-loop gain rings most.

## Level 1: Counting Poles

```tikz title="Root loci as β grows. One pole: moves left forever, always stable. Two poles: they meet and turn complex, but never reach the jω axis. After Razavi Figs. 10.6 and 10.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-4,0) -- (0.8,0) node[right] {$\sigma$};
  \draw[->] (0,-1.6) -- (0,1.7) node[above] {$j\omega$};
  \node[font=\large] at (-0.8,0) {$\times$};
  \node[font=\scriptsize,above] at (-0.8,0.15) {$-\omega_0$};
  \draw[->,very thick,red!70!black] (-1.0,-0.3) -- (-3.4,-0.3);
  \node[font=\scriptsize,red!70!black,below] at (-2.2,-0.35) {$-\omega_0(1+\beta A_0)$};
  \node[font=\scriptsize] at (-2,-1.5) {one pole};
  \begin{scope}[xshift=7.2cm]
    \draw[->] (-4,0) -- (0.8,0) node[right] {$\sigma$};
    \draw[->] (0,-1.6) -- (0,1.7) node[above] {$j\omega$};
    \node[font=\large] at (-0.6,0) {$\times$};
    \node[font=\large] at (-3.0,0) {$\times$};
    \node[font=\scriptsize,above] at (-0.6,0.15) {$-\omega_{p1}$};
    \node[font=\scriptsize,above] at (-3.0,0.15) {$-\omega_{p2}$};
    \draw[->,very thick,red!70!black] (-0.75,-0.12) -- (-1.7,-0.12);
    \draw[->,very thick,red!70!black] (-2.85,-0.12) -- (-1.9,-0.12);
    \draw[->,very thick,red!70!black] (-1.8,0.1) -- (-1.8,1.4);
    \draw[->,very thick,red!70!black] (-1.8,-0.3) -- (-1.8,-1.4);
    \node[font=\scriptsize,anchor=west] at (-1.7,-0.8) {$\beta>\beta_1$};
    \node[font=\scriptsize] at (-2,-1.85) {two poles};
  \end{scope}
\end{circuitikz}
\end{document}
```

### One pole

$$
\boxed{H=\frac{A_0}{1+s/\omega_0}:\quad \frac YX=\frac{A_0/(1+\beta A_0)}{1+s/[\omega_0(1+\beta A_0)]}}
$$

One pole never gives more than $90^\circ$ of phase, so the loop is **unconditionally stable** for every $\beta\ge 0$.

### Two poles

$$
\boxed{s_{1,2}=\frac{-(\omega_{p1}+\omega_{p2})\pm\sqrt{(\omega_{p1}+\omega_{p2})^2-4(1+\beta A_0)\omega_{p1}\omega_{p2}}}{2},\qquad \beta_1=\frac{1}{A_0}\frac{(\omega_{p1}-\omega_{p2})^2}{4\omega_{p1}\omega_{p2}}}
$$

- Phase approaches but never reaches $-180^\circ$: still stable for any $\beta$.
- Past $\beta_1$ the closed-loop poles are complex: **stable but ringing**. Stability is not enough; you also want damping, which is what phase margin measures.

### Three poles

```tikz title="Three poles: the phase of each pole starts moving a decade below it, but its magnitude bends only at the pole. Extra poles pull PX in much faster than GX. After Razavi Fig. 10.9(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.1cm,y=1cm]
  \draw[->] (0,4.2) -- (7.4,4.2) node[right] {$\log\omega$};
  \draw[->] (0,2.6) -- (0,9.2) node[above] {$20\log|\beta H|$};
  \node[left,font=\scriptsize] at (0,4.2) {0 dB};
  \draw[very thick] (0,8.5) -- (1,8.5) -- (3,6.5) -- (4,4.5) -- (4.6,2.7);
  \foreach \x/\n in {1/1,3/2,4/3} {\draw[dotted] (\x,4.2) -- (\x,8.7); \node[font=\scriptsize,above] at (\x,8.7) {$\omega_{p\n}$};}
  \draw[<->,red!70!black,thick] (3.5,4.2) -- (3.5,5.5);
  \draw[->] (0,1.5) -- (7.4,1.5) node[right] {$\log\omega$};
  \draw[->] (0,-2.6) -- (0,2.3) node[above] {$\angle\beta H$};
  \foreach \y/\l in {1.5/0,0.25/-90,-1/-180,-2.25/-270} {\draw (0.06,\y) -- (-0.06,\y) node[left,font=\scriptsize] {$\l^\circ$};}
  \draw[dashed] (0,-1) -- (7.2,-1);
  \draw[very thick,domain=0:7,samples=90] plot (\x,{1.5+(2.5/180)*(-atan(10^(max(-3,min(3,\x-1))))-atan(10^(max(-3,min(3,\x-3))))-atan(10^(max(-3,min(3,\x-4)))))});
  \draw[dotted] (3.5,-1) -- (3.5,4.2);
  \node[font=\scriptsize,anchor=north east] at (3.45,4.15) {PX};
  \node[font=\scriptsize,anchor=west,align=left,red!70!black] at (4.3,6.4) {$|\beta H|>1$ at PX:\\unstable};
\end{circuitikz}
\end{document}
```

The third pole is where op amps get into trouble. Its phase arrives about a decade before its magnitude does, so it pulls PX below GX before it has done much to the gain.

- Again, a smaller $\beta$ (a higher closed-loop gain) is more stable.
- Don't read stability off the closed-loop response: $|Y/X|$ goes to infinity exactly at the frequency where GX and PX coincide.

> [!tip] Remark
> These are the rules from [[Frequency Response#Bode Rules]]: $-20$ dB/dec per pole, and $-45^\circ$ at the pole with the phase moving from $0.1\omega_p$ to $10\omega_p$.

## Level 2: Phase Margin

### Definition and peaking

$$
\boxed{\text{PM}=180^\circ+\angle\beta H(\omega_t),\qquad \left|\frac YX(j\omega_t)\right|=\frac{1}{\beta}\cdot\frac{1}{2\sin(\text{PM}/2)}}
$$

| PM | $\beta\,\lvert Y/X\rvert$ at $\omega_t$ | Damping $\zeta$ | Step overshoot |
|---|---|---|---|
| $5^\circ$ | 11.5 | | near oscillation |
| $45^\circ$ | 1.3 (30% peak) | 0.42 | 23% |
| $60^\circ$ | 1.0 (no peak) | 0.61 | 8.8% |
| $65.5^\circ$ | 0.92 | 0.71 | 4.3% |
| $76^\circ$ | 0.80 | 1.0 | 0 |

(Peaking: Razavi Eqs. 10.10–10.18. Damping and overshoot: dominant pole plus one nondominant pole, from the Zettelkasten, checked below.)

```tikz title="Unity-gain step response for three phase margins, time in units of 1/ω_p2. 45° rings, 60° is the usual optimum, a larger margin is overdamped and slow. After Razavi Fig. 10.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.5cm,y=2.6cm]
  \draw[->] (0,0) -- (16,0) node[right] {$\omega_{p2}t$};
  \draw[->] (0,0) -- (0,1.45) node[above] {$y(t)$};
  \draw[dotted] (0,1) -- (15.5,1);
  \node[left,font=\scriptsize] at (0,1) {1};
  \foreach \x in {5,10,15} {\draw (\x,0.02) -- (\x,-0.02) node[below,font=\scriptsize] {\x};}
  \draw[thick,red!70!black,domain=0:15.5,samples=160] plot (\x,{1-exp(-0.5*\x)*(cos(1.08*\x r)+0.463*sin(1.08*\x r))});
  \draw[thick,blue!70!black,domain=0:15.5,samples=160] plot (\x,{1-exp(-0.5*\x)*(cos(0.646*\x r)+0.774*sin(0.646*\x r))});
  \draw[thick,domain=0:15.5,samples=100] plot (\x,{1-(1+0.5*\x)*exp(-0.5*\x)});
  \node[font=\scriptsize,red!70!black,anchor=west] at (3.2,1.3) {PM $=45^\circ$};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (6.6,1.15) {PM $=60^\circ$};
  \node[font=\scriptsize,anchor=west] at (7.5,0.72) {PM $=76^\circ$ (critically damped)};
\end{circuitikz}
\end{document}
```

> [!important] Sixty degrees
> $\text{PM}=60^\circ$ is the usual target: no frequency peaking, little ringing, fast settling. More margin is more stable but slower. Carusone's procedure targets $55^\circ$ from $C_C$, then about $85^\circ$ with a lead zero ([[#The nulling resistor (lead compensation)|below]]).

> [!tip] Remark
> Same result, other book: [[Feedback#Second-order loop]] lists PM against $Q$ and overshoot (Carusone Table 5.1), and its fold shows the peak $1/[\beta\sqrt{2(1-\cos\text{PM})}]$, which equals the $2\sin(\text{PM}/2)$ form here.

- Phase margin is a **small-signal** measure. A large step slews and moves the bias points, so the poles shift during the transient. For large-signal settling, simulate the closed loop in the time domain. Razavi's Fig. 10.14 buffer has 65° PM in AC analysis and still rings on a large step.

> [!note]- Derivation: peaking and damping from the phase margin
> **Peaking.** At $\omega_t$, $\beta H = 1\cdot e^{-j(180^\circ-\text{PM})} = -e^{j\text{PM}}$. So $|1+\beta H| = |1-e^{j\text{PM}}| = 2\sin(\text{PM}/2)$, and $|Y/X| = |H|/|1+\beta H| = (1/\beta)/[2\sin(\text{PM}/2)]$. Razavi's numbers: $-175^\circ$ gives $|0.0038-j0.0872|$, so a peak of $11.5/\beta$. $45^\circ$ gives $1.3/\beta$; $60^\circ$ gives exactly $1/\beta$.
>
> **Damping** (Zettelkasten 9e1). Take $\beta H\approx\omega_u/[s(1+s/\omega_{p2})]$, a dominant pole far below crossover plus one more. The closed-loop poles solve $s^2+\omega_{p2}s+\omega_u\omega_{p2}=0$, so $\omega_n=\sqrt{\omega_u\omega_{p2}}$ and $\zeta=\frac12\sqrt{\omega_{p2}/\omega_u}$. With $r=\omega_t/\omega_{p2}=1/\tan\text{PM}$ and $\omega_u=\omega_t\sqrt{1+r^2}$:
> $$\zeta=\tfrac12\left[r\sqrt{1+r^2}\right]^{-1/2}$$
> Check at $60^\circ$: $r=0.577$, $r\sqrt{1+r^2}=0.667$, $\zeta=0.612$, overshoot $e^{-\pi\zeta/\sqrt{1-\zeta^2}}=8.8\%$, matching Carusone's 8.7%.
>
> **Why 60° and not more.** With $\omega_{p2}$ fixed, an underdamped response decays as $e^{-\omega_{p2}t/2}$ whatever the margin, so settling barely changes from $45^\circ$ to $65^\circ$. Beyond critical damping the slow real pole follows $\omega_u$, which you lowered to buy margin, and settling gets worse.

### The bandwidth ceiling: the second pole

```tikz title="Two-pole loop with gain crossover exactly at the second pole: the phase there is -90° - 45° = -135°, so PM = 45°. Any higher crossover gives less than 45°. After Razavi Fig. 10.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.1cm,y=1cm]
  \draw[->] (0,4.2) -- (6.6,4.2) node[right] {$\log\omega$};
  \draw[->] (0,3.0) -- (0,7.6) node[above] {$20\log|\beta H|$};
  \node[left,font=\scriptsize] at (0,4.2) {0 dB};
  \draw[very thick] (0,7) -- (1,7) -- (3.8,4.2) -- (4.5,2.8);
  \node[font=\scriptsize,above] at (1,7.05) {$\omega_{p1}$};
  \node[font=\scriptsize,anchor=south west] at (3.85,4.25) {$\omega_{p2}=\omega_t$};
  \draw[dotted] (3.8,4.2) -- (3.8,-1.1);
  \draw[->] (0,1.5) -- (6.6,1.5) node[right] {$\log\omega$};
  \draw[->] (0,-1.4) -- (0,2.1) node[above] {$\angle\beta H$};
  \foreach \y/\l in {1.5/0,0.25/-90,-1/-180} {\draw (0.06,\y) -- (-0.06,\y) node[left,font=\scriptsize] {$\l^\circ$};}
  \draw[dashed] (0,-1) -- (6.3,-1);
  \draw[dashed,gray] (0,-0.375) -- (3.8,-0.375) node[left,pos=0,font=\scriptsize,black] {};
  \node[font=\scriptsize,anchor=east] at (-0.06,-0.375) {$-135^\circ$};
  \draw[very thick,domain=0:6.3,samples=80] plot (\x,{1.5+(2.5/180)*(-atan(10^(max(-3,min(3,\x-1))))-atan(10^(max(-3,min(3,\x-3.8)))))});
  \draw[<->,red!70!black,thick] (3.8,-1) -- (3.8,-0.375);
  \node[font=\scriptsize,red!70!black,anchor=east] at (3.75,-0.7) {PM $=45^\circ$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{PM}\approx 90^\circ-\tan^{-1}\frac{\omega_t}{\omega_{p2}}\quad(\omega_{p1}\ll\omega_t),\qquad \text{PM}>45^\circ\iff\omega_t<\omega_{p2}}
$$

| $\omega_t/\omega_{p2}$ | 1 | 0.7 | 0.58 | 0.5 | 0.36 |
|---|---|---|---|---|---|
| PM | 45° | 55° | 60° | 63° | 70° |

> [!important] Compensated bandwidth ≤ first nondominant pole
> With adequate phase margin, the loop's unity-gain frequency cannot exceed the first nondominant pole. Wide feedback bandwidth means pushing that pole out, not adjusting the dominant one. Carusone's rule of thumb: $\omega_t\lesssim\omega_{p2}/2$ gives over $60^\circ$.

## Level 3: Frequency Compensation

### Two strategies

| Strategy | How | Cost |
|---|---|---|
| Push PX out | Fewer poles in the signal path: fewer stages, no mirror poles | Gain and/or output swing ([[Operational Amplifiers]]) |
| Pull GX in | Make $\lvert\beta H\rvert$ fall sooner: lower the dominant pole | Bandwidth |

In practice: first design for the fewest poles, then compensate (pull GX in) for the $\beta$ the application really uses.

### Dominant-pole compensation

```tikz title="Compensating for 45° PM: from the frequency where the phase is -135° (here the mirror pole ω_p,A), draw a -20 dB/dec line back to the DC gain. Where it meets is the new dominant pole. After Razavi Figs. 10.19 and 10.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.15cm,y=1cm]
  \draw[->] (0,3.6) -- (6.6,3.6) node[right] {$\log\omega$};
  \draw[->] (0,2.2) -- (0,8.4) node[above] {$20\log|\beta H|$};
  \node[left,font=\scriptsize] at (0,3.6) {0 dB};
  \draw[thick,gray] (0,7.1) -- (1.8,7.1) -- (4,4.9) -- (4.65,3.6) -- (5,2.9);
  \node[font=\scriptsize,gray,anchor=west] at (2.9,6.4) {original};
  \draw[very thick] (0,7.1) -- (0.5,7.1) -- (4,3.6) -- (4.6,2.4);
  \node[font=\scriptsize,anchor=west] at (2.3,4.3) {$-20$ dB/dec};
  \foreach \x/\l in {0.5/{\omega'_{p,out}},1.8/{\omega_{p,out}},4/{\omega_{p,A}}} {\draw[dotted] (\x,3.6) -- (\x,7.5); \node[font=\scriptsize,above] at (\x,7.5) {$\l$};}
  \draw[->] (0,1.5) -- (6.6,1.5) node[right] {$\log\omega$};
  \draw[->] (0,-1.5) -- (0,2.1) node[above] {$\angle\beta H$};
  \foreach \y/\l in {1.5/0,0.25/-90,-1/-180} {\draw (0.06,\y) -- (-0.06,\y) node[left,font=\scriptsize] {$\l^\circ$};}
  \draw[dashed] (0,-1) -- (6.3,-1);
  \draw[thick,gray,domain=0:6.3,samples=80] plot (\x,{1.5+(2.5/180)*(-atan(10^(max(-3,min(3,\x-1.8))))-atan(10^(max(-3,min(3,\x-4))))-atan(10^(max(-3,min(3,\x-5.5)))))});
  \draw[very thick,domain=0:6.3,samples=80] plot (\x,{1.5+(2.5/180)*(-atan(10^(max(-3,min(3,\x-0.5))))-atan(10^(max(-3,min(3,\x-4))))-atan(10^(max(-3,min(3,\x-5.5)))))});
  \draw[dotted] (4,-1) -- (4,3.6);
  \draw[<->,red!70!black,thick] (4,-1) -- (4,-0.39);
  \node[font=\scriptsize,red!70!black,anchor=east] at (3.95,-0.65) {PM $\approx45^\circ$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega'_{p1}=\frac{\omega_x}{\beta A_0},\qquad \omega_x:\ \angle\beta H(\omega_x)=-180^\circ+\text{PM}}
$$

Lower the dominant pole (in a one-stage op amp, add load capacitance) until the loop gain reaches 1 at $\omega_x$. Well above the dominant pole its phase is about $-90^\circ$ wherever it sits, so moving it changes the magnitude near crossover but not the phase.

- Result for 45°: the compensated unity-gain frequency **equals the first nondominant pole**. This is the [[#The bandwidth ceiling the second pole|ceiling]] again.
- Raising $R_{out}$ does **not** compensate: it raises the low-frequency gain only, and $\omega_t = g_m/C$ stays where it was.
- Moving a nondominant pole down doesn't help either: it adds phase near crossover.

### Lower β relaxes the compensation

$$
\boxed{\omega''_{p1}=\frac{\omega'_{p1}}{\beta}\quad\Rightarrow\quad C_{comp}\ \text{shrinks by}\ \approx 1/\beta}
$$

The magnitude plot is $20\log\beta$ lower, so the $-20$ dB/dec line from $\omega_x$ meets it $1/\beta$ further out (Razavi Ex. 10.5). The closed-loop speed is unchanged: $(1+\beta A_0)\omega''_{p1}\approx A_0\omega'_{p1}$. Lighter compensation just matches the weaker feedback.

### One-stage op amps: the load is the compensation

$$
\boxed{\omega_{ta}=\frac{g_{m1}}{C_L},\qquad \omega_t=\beta\frac{g_{m1}}{C_L},\qquad \text{SR}=\frac{I_{out,max}}{C_L}}
$$

A telescopic or folded cascode has one high-impedance node, the output, so its dominant pole is $1/(R_{out}C_L)$. With a large $C_L$, $\omega_t$ sits far below the internal poles and PM approaches $90^\circ$. **A heavier load makes a one-stage op amp more stable** (and slower).

If the phase margin is short (Carusone §6.4.1):

1. Add capacitance at the output: more PM, no extra power, same DC gain; costs bandwidth and area.
2. Raise the second pole: more current (and width) in the cascode devices; costs power and DC gain. Capped by the cascode device's own speed, $f_{p2}<f_{T}$ of the cascode transistor.
3. Lead compensation: put $R_C$ in series with the load capacitor. That adds a zero at $1/(R_CC_L)$; place it near $1.7\,\omega_t$ ([[#The nulling resistor (lead compensation)|same rule as two-stage]]).

For the folded cascode the slew current is the cascode-branch current: $\text{SR}=I_{D4}/C_L$ in Carusone's Fig. 6.20.

```tikz title="Pole map of a single-ended telescopic cascode. The output pole dominates; the mirror pole at node A is the first nondominant pole and sets the phase margin. After Razavi Fig. 10.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-11.6,0) -- (0.8,0) node[right] {$\sigma$};
  \draw[->] (0,-0.9) -- (0,1.4) node[above] {$j\omega$};
  \foreach \x/\l/\d in {-0.8/{-\frac{1}{R_{out}C_L}}/{output\\(dominant)},-4.0/{-\frac{g_{m5}}{C_A}}/{mirror\\node A},-7.2/{-\frac{g_{m7}}{C_N}}/{PMOS cascode\\node N},-10.4/{-\frac{g_{m3}}{C_X}}/{NMOS cascode\\nodes X, Y}} {
    \node[font=\large] at (\x,0) {$\times$};
    \node[above,font=\scriptsize] at (\x,0.2) {$\l$};
    \node[below,font=\scriptsize,align=center] at (\x,-0.25) {\d};
  }
\end{circuitikz}
\end{document}
```

**Single-ended telescopic cascode** (Razavi Fig. 10.16): the mirror pole at node A has a large capacitance ($C_{GS5}+C_{GS6}+C_{DB5}+2C_{GD6}+C_{DB3}+C_{GD3}$) and a large resistance ($1/g_{m5}$, a PMOS), so it is the first nondominant pole and limits PM. The pole at the PMOS cascode node N comes next (PMOS are 2 to 3× wider for the same $g_m$, so more capacitance), then X and Y.

- The mirror also adds a left-half-plane zero at $2\omega_{p,A}$.
- **Fully differential** removes the mirror pole: one dominant pole per output and essentially one nondominant pole (node X), at high frequency thanks to the NMOS $g_m$. A fully differential telescopic cascode may need no compensation beyond its load.

> [!tip] Remark
> This is the mirror pole and zero from [[Frequency Response#Differential Pair]]. Fully differential circuits avoid it there for the same reason.

$$
\boxed{\tau_{out}=(1+g_{m5}r_{O5})\,r_{O7}C_L+r_{O7}C_N}
$$

The internal node of a cascode **current-source load** does not add a pole: its time constant just adds to the output one. The signal "does not see" the cascode-load pole (Razavi Eq. 10.23).

> [!note]- Derivation: the cascode-load pole merges with the output pole (Razavi Eqs. 10.20–10.23)
> PMOS cascode load: $M_7$ the current source, $M_5$ the cascode, $C_N$ at their shared node. $Z_{out}=(1+g_{m5}r_{O5})Z_N+r_{O5}$ with $Z_N=r_{O7}\parallel(C_Ns)^{-1}$. Dropping $r_{O5}$, $Z_{out}\approx(1+g_{m5}r_{O5})\,r_{O7}/(r_{O7}C_Ns+1)$. In parallel with $1/(C_Ls)$:
> $$Z_{out}\parallel\frac1{C_Ls}=\frac{(1+g_{m5}r_{O5})r_{O7}}{[(1+g_{m5}r_{O5})r_{O7}C_L+r_{O7}C_N]s+1}$$
> One pole, not two: the usual output time constant plus $r_{O7}C_N$. Keeping $r_{O5}$ adds a nearly coincident pole and zero; negligible for $g_mr_O\gg1$ and $C_L>C_N$.

### Pole-zero cancellation and doublets

A fast low-gain path in parallel with the main amplifier makes a zero that could sit on the first nondominant pole. If the pole and zero don't match exactly they form a **doublet**:

$$
\boxed{\text{step response contains}\ \left(1-\frac{\omega_z}{\omega_{p2}}\right)e^{-\omega_{p2}t}}
$$

A slow tail with amplitude set by the mismatch (Razavi Problem 10.19). It barely shows on a Bode plot but stretches high-accuracy settling. Every cancellation scheme below has this risk.

## Level 4: Compensating Two-Stage Op Amps

Two-stage op amps give the most gain and swing at low supply ([[Operational Amplifiers]]). They are also the hardest to compensate. Notation follows Carusone's Fig. 6.3: input pair $M_1,M_2$ ($g_{m1}$), tail $M_5$, mirror $M_3,M_4$; second stage driver $M_7$ ($g_{m7}$) with current source $M_6$. $R_1,C_1$ are the resistance and capacitance at the first-stage output $v_1$; $R_2,C_2$ at the output ($C_2\approx C_L$).

```tikz title="Two-stage op amp with Miller compensation (C_C) and nulling resistor (R_C) across the second stage. After Carusone Fig. 6.3 (output buffer omitted)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \coordinate (rail) at (0,6.4);
  \draw (-0.6,6.4) -- (10.2,6.4) node[right] {$V_{DD}$};
  \draw (2.5,5.3) node[pmos](M5){$M_5$};
  \draw (M5.S) -- (M5.S |- rail);
  \draw (M5.G) -- ++(-0.3,0) node[left] {$V_{bias}$};
  \draw (M5.D) -- ++(0,-0.35) coordinate (T);
  \draw (1.3,3.1) node[pmos](M1){$M_1$};
  \draw (3.7,3.1) node[pmos,xscale=-1](M2){};
  \node at ([xshift=-0.55cm]M2.center) {$M_2$};
  \draw (M1.S) |- (T);
  \draw (M2.S) |- (T);
  \draw (T) node[circ]{};
  \draw (M1.G) -- ++(-0.3,0) node[left] {$v_{in}^{-}$};
  \draw (M2.G) -- ++(0.3,0) node[right] {$v_{in}^{+}$};
  \draw (1.3,0.9) node[nmos,xscale=-1](M3){};
  \node at (0.6,0.7) {$M_3$};
  \draw (3.7,0.9) node[nmos](M4){$M_4$};
  \draw (M1.D) -- (M3.D);
  \draw (M2.D) -- (M4.D);
  \draw (M3.G) -- (M4.G);
  \coordinate (dg) at ([yshift=0.2cm]M3.D);
  \draw (M3.G) |- (dg) node[circ]{};
  \draw (M3.S) node[ground]{};
  \draw (M4.S) node[ground]{};
  \coordinate (v1) at ([yshift=0.2cm]M4.D);
  \draw (v1) node[circ]{} -- ++(1.8,0) coordinate (v1r);
  \node[above] at ([xshift=0.9cm]v1) {$v_1$};
  \draw (8,0.9) node[nmos](M7){$M_7$};
  \draw (v1r) node[circ]{} |- (M7.G);
  \draw (M7.S) node[ground]{};
  \draw (8,4.5) node[pmos](M6){$M_6$};
  \draw (M6.S) -- (M6.S |- rail);
  \draw (M6.G) -- ++(-0.3,0) node[left] {$V_{bias}$};
  \draw (M6.D) -- (M7.D);
  \coordinate (vo) at (8,2.75);
  \draw (v1r) -- (v1r |- vo) to[R, l=$R_C$] ++(1.2,0) to[C, l=$C_C$] (vo);
  \draw (vo) node[circ]{} -- (10,2.75) node[right] {$v_{out}$};
  \draw (9.2,2.75) node[circ]{} to[C, l=$C_L$] (9.2,0.5) node[ground]{};
\end{circuitikz}
\end{document}
```

### Why two stages are hard

Each stage's output is a high-impedance node, so there are **two dominant poles**: the first-stage output (huge $R_1$, even with small $C_1$) and the second-stage output (smaller $R_2$, large $C_L$). The phase can approach $-180^\circ$ before any third pole shows up.

Plain dominant-pole compensation fails here: lowering one of the two leaves the other as the "first nondominant pole", so the bandwidth would be capped at a low frequency, and the capacitor would be huge.

### Miller compensation and pole splitting

```tikz title="Small-signal model used for compensation: first stage as g_m1 into R_1 || C_1, second stage as g_m7 into R_2 || C_2, coupled by R_C and C_C. After Carusone Fig. 6.5 (Razavi Fig. 10.29)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,0) to[cI, l=$g_{m1}v_{in}$] (0,2);
  \draw (0,2) -- (3,2);
  \draw (1.5,2) to[R, l=$R_1$, *-] (1.5,0);
  \draw (3,2) to[C, l=$C_1$] (3,0);
  \draw (3,2) node[circ]{} node[above left] {$v_1$} -- (3,3.3) to[R, l=$R_C$] (5.5,3.3) to[C, l=$C_C$] (8.8,3.3) -- (8.8,2);
  \draw (6,2) to[cI, l_=$g_{m7}v_1$] (6,0);
  \draw (6,2) -- (8.8,2);
  \draw (7.4,2) to[R, l=$R_2$, *-] (7.4,0);
  \draw (8.8,2) to[C, l=$C_2$] (8.8,0);
  \draw (8.8,2) node[circ]{} -- (9.8,2) node[right] {$v_{out}$};
  \draw (0,0) -- (8.8,0);
  \draw (3.9,0) node[ground]{};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_{p1}\approx\frac{1}{g_{m7}R_1R_2C_C},\qquad \omega_{p2}\approx\frac{g_{m7}}{C_1+C_2}\approx\frac{g_{m7}}{C_L},\qquad \omega_z=+\frac{g_{m7}}{C_C}\ \text{(RHP, with }R_C=0)}
$$

$$
\boxed{\omega_{ta}=\frac{g_{m1}}{C_C},\qquad \omega_t=\beta\frac{g_{m1}}{C_C}}
$$

```tikz title="Pole splitting: C_C pushes the first-stage pole toward the origin (Miller multiplication) and the output pole away from it (C_C diode-connects M7 at high frequency). After Razavi Fig. 10.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-9,0) -- (0.8,0) node[right] {$\sigma$};
  \draw[->] (0,-0.9) -- (0,1.6) node[above] {$j\omega$};
  \node[font=\large,gray] at (-2.0,0) {$\times$};
  \node[font=\large,gray] at (-3.0,0) {$\times$};
  \node[font=\scriptsize,gray,below] at (-2.5,-0.25) {before $C_C$};
  \node[font=\large,red!70!black] at (-0.4,0) {$\times$};
  \node[font=\large,red!70!black] at (-8.0,0) {$\times$};
  \draw[->,thick,red!70!black] (-2.0,0.3) to[bend right=30] (-0.45,0.3);
  \draw[->,thick,red!70!black] (-3.0,0.3) to[bend left=20] (-7.9,0.3);
  \node[font=\scriptsize,red!70!black,anchor=south east] at (-0.3,0.75) {$\omega_{p1}\approx\frac{1}{g_{m7}R_1R_2C_C}$};
  \node[font=\scriptsize,red!70!black,above] at (-8.0,0.75) {$\omega_{p2}\approx\frac{g_{m7}}{C_L}$};
  \node[font=\scriptsize,red!70!black,below] at (-5.5,-0.25) {after $C_C$};
\end{circuitikz}
\end{document}
```

- **Miller:** $C_C$ across a gain $g_{m7}R_2$ looks like $(1+g_{m7}R_2)C_C$ at $v_1$. A modest capacitor makes a very low pole, which saves area.
- **Pole splitting:** at high frequency $C_C$ shorts the gate and drain of $M_7$, which then looks like a diode, $1/g_{m7}$. The output resistance falls from $R_2$ to about $1/g_{m7}$ and the output pole rises by about $g_{m7}R_2$. Equivalently, $C_C$ is local shunt feedback around the second stage.
- **Bigger $g_{m7}$** separates the poles further; **bigger $C_C$** lowers $\omega_{p1}$ without moving $\omega_{p2}$. Both help.
- $\omega_{ta}=g_{m1}/C_C$ does not depend on $C_L$ to first order. Unlike a one-stage op amp, a two-stage op amp's speed is set by $C_C$.

> [!tip] Remark
> These are the exact [[Frequency Response#Common Source|common-source]] poles and zero with $C_{GD}$ replaced by $C_C+C_{GD7}$ and $R_S$ by $R_1$. Same circuit, deliberately big Miller capacitor. The RHP zero is the one found [[Frequency Response#Finding Zeros by Inspection|by inspection]]: $V_1C_Cs_z=g_{m7}V_1$.

> [!note]- Derivation: the two-stage transfer function (Carusone Eqs. 6.15–6.20, Razavi Eqs. 10.24–10.25)
> Nodal analysis of the model with $R_C=0$:
> $$A_v(s)=\frac{g_{m1}g_{m7}R_1R_2\left(1-sC_C/g_{m7}\right)}{1+as+bs^2}$$
> $$a=(C_2+C_C)R_2+(C_1+C_C)R_1+g_{m7}R_1R_2C_C,\qquad b=R_1R_2(C_1C_2+C_1C_C+C_2C_C)$$
> For widely separated real poles, $1+as+bs^2\approx1+s/\omega_{p1}+s^2/(\omega_{p1}\omega_{p2})$, so $\omega_{p1}=1/a$ and $\omega_{p2}=a/b$:
> $$\omega_{p1}=\frac{1}{R_1[C_1+C_C(1+g_{m7}R_2)]+R_2(C_2+C_C)}\approx\frac{1}{g_{m7}R_1R_2C_C}$$
> $$\omega_{p2}=\frac{g_{m7}C_C}{C_1C_2+C_2C_C+C_1C_C}\approx\frac{g_{m7}}{C_1+C_2}$$
> (the last step needs $C_C\gg C_1$ and $g_{m7}R_1R_2C_C$ dominating $a$). Before compensation ($C_C=0$) the output pole is $1/(R_2C_L)$, so splitting raised it by $\approx g_{m7}R_2$ (with $C_1\ll C_L$).
>
> **Midband shortcut** (Carusone Eqs. 6.4–6.9): above $\omega_{p1}$, $v_1$ sees $C_{eq}\approx C_CA_{v2}$, so $A_v\approx A_{v2}\cdot g_{m1}/(sC_CA_{v2})=g_{m1}/(sC_C)$: an integrator with unity gain at $g_{m1}/C_C$. Example 6.2: $g_{m1}=1.3$ mA/V, $C_C=1$ pF gives $f_{ta}=207$ MHz.
>
> **Razavi's labels:** first-stage output resistance $R_S$, node $E$ with $C_E$, output device $M_9$ ($g_{m9}$), $R_L=r_{O9}\parallel r_{O11}$. $C_{GD9}$ appears explicitly beside $C_C$.

> [!note]- Example: second pole and zero in numbers (Carusone Ex. 6.3)
> $g_{m7}=3.12$ mA/V, $C_C=1$ pF, $C_L=5$ pF: $\omega_{p2}\approx g_{m7}/(C_L+C_C)=2\pi\times82.8$ MHz. Both $\omega_{p2}$ and $\omega_z$ rise with $g_{m7}$, i.e. a wider $M_6,M_7$ and more second-stage current.
>
> > [!warning] Unverified
> > Carusone prints the zero as $3.12\text{ mA/V}/5\text{ pF}=2\pi\times99.3$ MHz, dividing by $C_L$. His own Eq. 6.21, $\omega_z=g_{m7}/C_C$, with $C_C=1$ pF gives $2\pi\times497$ MHz. The book's number looks like a slip; check the errata before quoting either.

### Sizing $C_C$

$$
\boxed{C_C\approx\beta\frac{g_{m1}}{g_{m7}}C_L\quad(\text{PM}\approx45^\circ:\ \omega_t=\omega_{p2})}
$$

Set the loop gain to 1 at the split output pole: $\beta g_{m1}R_1g_{m7}R_2=\omega_{p2}/\omega_{p1}$, and everything but $\beta g_{m1}=g_{m7}C_C/C_L$ cancels (Razavi Ex. 10.6).

- This is a **starting point**. 45° is too little, and the RHP zero is ignored, so the real $C_C$ is larger. Keeping $\omega_{p2}$'s own $\sqrt2$ in the magnitude gives $g_{m1}C_L/(\sqrt2g_{m7})$.
- Most op amps run at closed-loop gain ≥ 2, so $\beta<1$ and a smaller $C_C$ suffices.
- $C_{GD7}$ is in parallel with $C_C$: the capacitor you draw is $C_C-C_{GD7}$ (Zettelkasten 9h1a).
- Iteration is normal: both poles move with $C_C$.

### The right-half-plane zero

```tikz title="A zero in the RHP has the same magnitude effect as a normal zero (the slope flattens) but adds phase lag like a pole. A lead (LHP) zero adds phase. Pole ω_p1, zero ω_z, pole ω_p2. After Razavi Fig. 10.31 and Carusone Fig. 6.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.15cm,y=1cm]
  \draw[->] (0,4.4) -- (6.8,4.4) node[right] {$\log\omega$};
  \draw[->] (0,3.0) -- (0,8.2) node[above] {$20\log|\beta H|$};
  \node[left,font=\scriptsize] at (0,4.4) {0 dB};
  \draw[thick,gray] (0,7.6) -- (0.6,7.6) -- (3.4,4.8) -- (4.4,2.8);
  \draw[very thick,dashed] (0,7.6) -- (0.6,7.6) -- (3.4,4.8) -- (4.4,4.8) -- (6.2,3.0);
  \node[font=\scriptsize,anchor=west] at (4.45,5.0) {with zero (either half plane)};
  \node[font=\scriptsize,gray,anchor=east] at (3.3,4.2) {no zero};
  \foreach \x/\l in {0.6/{\omega_{p1}},3.4/{\omega_z},4.4/{\omega_{p2}}} {\draw[dotted] (\x,4.4) -- (\x,7.9); \node[font=\scriptsize,above] at (\x,7.9) {$\l$};}
  \draw[->] (0,1.5) -- (6.8,1.5) node[right] {$\log\omega$};
  \draw[->] (0,-2.6) -- (0,2.3) node[above] {$\angle\beta H$};
  \foreach \y/\l in {1.5/0,0.5/-90,-0.5/-180,-1.5/-270} {\draw (0.06,\y) -- (-0.06,\y) node[left,font=\scriptsize] {$\l^\circ$};}
  \draw[dashed] (0,-0.5) -- (6.5,-0.5);
  \draw[thick,gray,domain=0:6.5,samples=80] plot (\x,{1.5+(1/90)*(-atan(10^(max(-3,min(3,\x-0.6))))-atan(10^(max(-3,min(3,\x-4.4)))))});
  \draw[very thick,red!70!black,domain=0:6.5,samples=80] plot (\x,{1.5+(1/90)*(-atan(10^(max(-3,min(3,\x-0.6))))-atan(10^(max(-3,min(3,\x-3.4))))-atan(10^(max(-3,min(3,\x-4.4)))))});
  \draw[very thick,blue!70!black,domain=0:6.5,samples=80] plot (\x,{1.5+(1/90)*(-atan(10^(max(-3,min(3,\x-0.6))))+atan(10^(max(-3,min(3,\x-3.4))))-atan(10^(max(-3,min(3,\x-4.4)))))});
  \node[font=\scriptsize,red!70!black,anchor=west] at (5.0,-1.6) {RHP zero: more lag};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (5.0,0.75) {LHP (lead) zero};
  \node[font=\scriptsize,gray,anchor=west] at (5.4,-0.2) {no zero};
\end{circuitikz}
\end{document}
```

$C_C$ is also a **feedforward path**: at high frequency it carries $v_1$ straight to the output, opposite in sign to the inverting path through $g_{m7}$. The numerator is $(1-s/\omega_z)$, so:

- **Phase:** $-\tan^{-1}(\omega/\omega_z)$, extra lag that pulls PX in.
- **Magnitude:** the slope flattens, pushing GX out. Both hurt.
- Typically $\omega_{p1}<\omega_z<\omega_{p2}$: the zero sits right where it does most damage.
- **Making $C_C$ bigger doesn't fix it:** $\omega_t$ and $\omega_z$ both scale with $1/C_C$, so their ratio $\omega_z/\omega_t=g_{m7}/(\beta g_{m1})$ is fixed by the transconductances. Only more $g_{m7}$ moves the zero relative to crossover.
- **Matching $C_C=C_L$ does not cancel it** (Razavi Ex. 10.7): the zero is in the RHP and the pole in the LHP, so $(1-s/\omega_z)/(1+s/\omega_{p2})$ is an all-pass, not 1.

> [!tip] Remark
> Why the zero is "serious" in CMOS (Razavi): MOS $g_{m7}$ is small, and $C_C$ must be large to place the dominant pole. A BJT output stage has far more $g_m$ per amp ([[BJTs]]), which pushes the zero out.

### The nulling resistor (lead compensation)

$$
\boxed{s_z=\frac{1}{C_C\left(1/g_{m7}-R_C\right)}}
$$

| Choice of $R_C$ | Zero | Use |
|---|---|---|
| $R_C=1/g_{m7}$ | at infinity | Kills the RHP zero |
| $R_C=\dfrac{1}{g_{m7}}\left(1+\dfrac{C_1+C_2}{C_C}\right)\approx\dfrac{C_L+C_C}{g_{m7}C_C}$ | LHP, on $\omega_{p2}$ | Cancels the second pole; needs $C_L$ known (doublet risk) |
| $R_C\approx\dfrac{1}{1.7\,\omega_tC_C}=\dfrac{1}{1.7\,\beta g_{m1}}$ | LHP, at $1.7\,\omega_t$ | Lead: about $+30^\circ$ at $\omega_t$. **Carusone's recommendation** |

$R_C$ adds a third pole, but for moderate $R_C$ it lies at high frequency and the first two poles barely move. The lead choice adds $\tan^{-1}(1/1.7)\approx30^\circ$ at crossover and raises $\omega_t$ a little.

> [!important] Carusone's compensation procedure (two-stage, works for most op amps)
> 1. Start with $C'_C\approx(\beta g_{m1}/g_{m7})C_L$, which puts $\omega_t$ near $\omega_{p2}$.
> 2. In SPICE, find the frequency $\omega_t$ where the loop phase is $-125^\circ$; call the gain there $A'$.
> 3. Set $C_C=C'_CA'$ so that $\omega_t$ becomes the crossover: PM $=55^\circ$. Iterate if needed.
> 4. Set $R_C=1/(1.7\,\omega_tC_C)$: about $+30^\circ$, total about $85^\circ$ (5° short of real closed-loop poles, as margin for process spread). Check that the gain keeps falling above the new $\omega_t$.
> 5. If PM is still short, increase $C_C$ and keep $R_C$: $\omega_t$ and the lead zero move down together.
> 6. Replace $R_C$ with a triode transistor, $r_{ds}=1/[\mu_nC_{ox}(W/L)V_{ov}]$, and fine-tune in SPICE.

> [!note]- Example: lead compensation in numbers (Carusone Ex. 6.7)
> $A(s)=A_0(1+s/\omega_z)/[(1+s/\omega_{p1})(1+s/\omega_2)]$, $A_0=10^4$, $\omega_2=2\pi\times50$ MHz, $\beta=1$.
>
> (a) No zero, PM $=55^\circ$: $\angle A=-90^\circ-\tan^{-1}(\omega'_t/\omega_2)=-125^\circ$ gives $\omega'_t=2\pi\times35$ MHz. $|A|=1$ there gives $\omega_{p1}=\omega'_t\sqrt{1+(\omega'_t/\omega_2)^2}/A_0=2\pi\times4.28$ kHz.
>
> (b) Zero at $1.7\omega'_t=2\pi\times59.5$ MHz: solving $|A|=1$ iteratively gives $\omega_t=2\pi\times39.8$ MHz (14% higher), $\angle A=-90^\circ+\tan^{-1}(\omega_t/\omega_z)-\tan^{-1}(\omega_t/\omega_2)=-95^\circ$, so PM $=85^\circ$. Real circuits gain less because of higher poles.

> [!note]- Derivation: the zero with $R_C$ (Razavi Problem 10.8, Carusone Eq. 6.43)
> Output-null method: at $s_z$ no current flows into a grounded output, so the current through $R_C$ and $C_C$ must equal $g_{m7}V_1$: $V_1/(R_C+1/(sC_C))=g_{m7}V_1$, so $1/(sC_C)=1/g_{m7}-R_C$ and $s_z=1/[C_C(1/g_{m7}-R_C)]$. Positive (RHP) for $R_C<1/g_{m7}$, infinite at equality, negative (LHP) beyond. For pole cancellation set $s_z=-g_{m7}/(C_1+C_2)$: $R_C=(C_1+C_2+C_C)/(g_{m7}C_C)$.

**Drawbacks of $R_C$ (Razavi):**

- Cancelling $\omega_{p2}$ needs $C_L$ known and fixed. In switched-capacitor circuits $C_L$ changes from phase to phase; mismatch gives a [[#Pole-zero cancellation and doublets|doublet]].
- A triode-MOS $R_C$ changes when the output swing couples through $C_C$ to its terminal: worse large-signal settling.
- $R_C$ must track $1/g_{m7}$ over process and temperature.

### Making $R_C$ track $1/g_{m7}$

$$
\boxed{R_Cg_{m7}=\frac{(W/L)_7}{(W/L)_9}\cdot\frac{(W/L)_{12}}{(W/L)_{13}}}
$$

Derive the gate voltage of the triode transistor $M_9$ (which realizes $R_C$) from a bias branch that copies $M_7$'s overdrive. The product then depends only on geometry (Carusone §6.2.3). Razavi's version (Fig. 10.34, $M_{13}$–$M_{15}$) does the same thing, and a third scheme makes $g_{m7}\propto1/R_S$ with a resistor-defined bias so a real resistor $R_C$ tracks it (Fig. 10.35).

- All of these assume square-law devices; the short-channel output transistor (chosen for speed) breaks that ([[MosFETs#Velocity Saturation]]).

> [!tip] Remark
> $R_C=r_{ds9}=1/[\mu_nC_{ox}(W/L)_9V_{ov9}]$ is the deep-triode $R_{on}$ from [[MosFETs#Regions of Operation]], and $g_{m7}=\mu_nC_{ox}(W/L)_7V_{ov7}$ is the same expression for a saturated device. Equal overdrives make the ratio pure geometry.

> [!note]- Derivation: the tracking bias network (Carusone Eqs. 6.64–6.72, Fig. 6.11)
> $R_Cg_{m7}=\dfrac{(W/L)_7V_{ov7}}{(W/L)_9V_{ov9}}$, so you need $V_{ov9}/V_{ov7}$ fixed. A bias branch ($Q_{11}$ mirroring $Q_6$, diode devices $Q_{12}$, $Q_{13}$) sets $V_a=V_b$ by making $V_{ov13}=V_{ov7}$, which requires $(W/L)_6/(W/L)_7=(W/L)_{11}/(W/L)_{13}$. $Q_{12}$ and $Q_9$ share gate and source voltages, so $V_{ov12}=V_{ov9}$, and with $I_{D12}=I_{D13}$, $V_{ov7}/V_{ov9}=V_{ov13}/V_{ov12}=\sqrt{(W/L)_{12}/(W/L)_{13}}$. Substituting gives the boxed geometric ratio.
>
> Razavi's Fig. 10.34: diode-connected $M_{13}$, $M_{14}$ in series; choose $I_1$ so $V_{GS13}=V_{GS9}$, then $V_{GS15}=V_{GS14}$ and $R_{on15}=g_{m14}^{-1}(W/L)_{14}/(W/L)_{15}$. Cancellation needs $(W/L)_{15}=\sqrt{(W/L)_{14}(W/L)_9\,\frac{I_{D9}}{I_{D14}}}\cdot\frac{C_C}{C_C+C_L}$.

### Load capacitance: the opposite of one-stage

| | One-stage (cascode) | Two-stage (Miller) |
|---|---|---|
| Dominant pole | Output, $1/(R_{out}C_L)$ | First-stage output, $1/(g_{m7}R_1R_2C_C)$ |
| Larger $C_L$ | Lowers the dominant pole: **more** PM (overdamped) | Lowers $\omega_{p2}=g_{m7}/C_L$: **less** PM, rings, can oscillate |
| $\omega_{ta}$ | $g_{m1}/C_L$ (load-dependent) | $g_{m1}/C_C$ (roughly load-independent) |

A two-stage op amp cannot be stabilized by adding load capacitance (Razavi Fig. 10.36). Size $C_C$ for the **largest** $C_L$ it will see.

## Level 5: Slewing

### Slew rate of a two-stage op amp

$$
\boxed{\text{SR}=\frac{I_{D5}}{C_C}=\frac{2I_{D1}}{C_C}=V_{ov1}\,\omega_{ta}}
$$

On a large input step the input pair fully switches. All of the tail current $I_{D5}$ then flows into or out of $C_C$, while the second stage holds $v_1$ near a virtual ground. $C_C$ charges at a constant rate.

- With $\omega_{ta}<\omega_{p2}$ fixed by stability, the only ways to raise SR are **larger $V_{ov1}$** or **larger $\omega_{p2}$** (Carusone Eq. 6.30). Larger $V_{ov1}$ costs DC gain and input-referred thermal noise.
- Example 6.5: $I_{D5}=200$ µA, $C_C=1$ pF gives 200 V/µs. Halving $C_C$ doubles SR; halving $g_{m1}$ (input widths ÷ 4) keeps $\omega_{ta}$.
- Both edges need headroom in the current sources: the output current source must exceed the tail current ($I_{D6}>I_{D5}$, Carusone), and the output driver must sink its bias plus the tail current while staying saturated (Razavi). Otherwise one edge slews more slowly, or the first stage falls out of saturation.

> [!tip] Remark
> $C_C$ is set by stability ($\omega_t=\beta g_{m1}/C_C$), so it also sets SR. With $g_{m1}=2I_{D1}/V_{ov1}$ ([[MosFETs#Transconductance]]), $\text{SR}/\omega_{ta}=2I_{D1}/g_{m1}=V_{ov1}$: a low-overdrive input pair is a slow-slewing one.

> [!note]- Derivation: the Miller integrator during slewing (Razavi Eqs. 10.36–10.38)
> A current step $I_{SS}u(t)$ into the input of a one-transistor inverting stage with feedback capacitor $C_F$ (bias current $I_1$): KCL gives $C_F(1+\frac1{g_mr_O})\frac{dV_{out}}{dt}=I_{in}-\frac{C_F}{g_m}\frac{dI_{in}}{dt}$, so
> $$V_{out}(t)=\frac{I_{SS}}{C_F(1+1/(g_mr_O))}\,t\,u(t)-\frac{I_{SS}}{g_m+r_O^{-1}}u(t)$$
> At $t=0^+$, $C_F$ is a short and $I_{SS}$ drops across $(1/g_m)\parallel r_O$ (the downward step); then the output ramps at $\approx I_{SS}/C_F$. The ramp doesn't depend on $I_1$, which only biases the device.

### Load capacitance can starve one edge

$$
\boxed{\text{rising edge needs } I_{D6}>I_{D5}\left(1+\frac{C_L}{C_C}\right),\ \text{otherwise } \text{SR}=\frac{I_{D6}-I_{D5}}{C_L}}
$$

When the output rises at $I_{D5}/C_C$, the output current source must supply $C_C$'s current and $C_L\,dV_{out}/dt=(C_L/C_C)I_{D5}$ at the same time. If it can't, the driver $M_7$ turns off and only the leftover current charges $C_L$, a much lower slew rate (Razavi Ex. 10.8, in Carusone's labels). On the falling edge the driver absorbs all three currents and stays on as long as it remains saturated.

**Class-AB output stages** fix this by making the output current itself grow with the input: $\text{SR}=[\alpha(W_{p1}/W_{p2})-1]I_{SS}/C_L$ (Razavi Fig. 10.40). The mirrors in the signal path add a pole, so two-stage class-AB op amps are usually slower in small-signal terms.

### Slewing plus linear settling

```tikz title="Large step: slew at SR until the remaining error is small enough to settle linearly, then settle exponentially with τ = 1/ω_t. After Carusone Figs. 6.6 and 6.7 (Example 6.4: 1 V step, SR·τ = 0.2 V)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.4cm,y=1cm]
  \draw[->] (0,0) -- (5.2,0) node[right] {$t$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$v_o$};
  \draw[dotted] (0,3) -- (5,3);
  \node[left,font=\scriptsize] at (0,3) {$V_{step}$};
  \draw[dotted] (0,2.4) -- (1.6,2.4);
  \node[left,font=\scriptsize] at (0,2.4) {$V_{step}-\text{SR}\,\tau$};
  \draw[thick,densely dashed,gray,domain=0:5,samples=60] plot (\x,{3-3*exp(-\x/0.4)});
  \draw[very thick] (0,0) -- (1.6,2.4);
  \draw[very thick,domain=1.6:5,samples=60] plot (\x,{3-0.6*exp(-(\x-1.6)/0.4)});
  \draw[dotted] (1.6,0) -- (1.6,2.4);
  \node[below,font=\scriptsize] at (1.6,0) {$t_{slew}$};
  \node[font=\scriptsize,anchor=west] at (0.85,1.0) {slope SR};
  \node[font=\scriptsize,anchor=west] at (2.1,2.0) {linear settling, $\tau=1/\omega_t$};
  \node[font=\scriptsize,gray,anchor=west] at (0.45,3.3) {linear only};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{step,max}=\text{SR}\cdot\tau,\qquad t_{settle}\approx\frac{V_{step}-\text{SR}\,\tau}{\text{SR}}+\tau\ln\frac{\text{SR}\,\tau}{\varepsilon}\quad(V_{step}>\text{SR}\,\tau)}
$$

The fastest slope a linear first-order response asks for is $V_{step}/\tau$ at $t=0$. A step larger than $\text{SR}\cdot\tau$ slews first; the slewing ends when the remaining error is $\text{SR}\cdot\tau$, and linear settling to error $\varepsilon$ takes over from there.

> [!note]- Example: settling time with and without slewing (Carusone Ex. 6.4)
> $\tau=0.2$ µs, SR $=1$ V/µs, accuracy 0.1 mV. Linear up to $V_{step}=0.2$ V.
> - 10 mV step: no slewing; $\ln(10/0.1)\tau=4.6\tau=0.92$ µs.
> - 1 V step: slews for $(1-0.2)/1=0.8$ µs, then $\ln(200/0.1)=7.6$ time constants, total $0.8+7.6\tau=2.32$ µs. Without slew limiting it would be $\ln(1000/0.1)\tau=1.84$ µs.

> [!tip] Remark
> $\tau=1/\omega_t=1/(\beta\omega_{ta})$ is the first-order loop of [[Feedback#First-order loop]]. For a one-stage op amp $\omega_{ta}$ falls with $C_L$, and $C_L$ includes the feedback network: $C_L=C_C+C_{load}+C_2(C_1+C_p)/(C_1+C_p+C_2)$ for a capacitive feedback stage, with $\beta=C_2/(C_1+C_p+C_2)$ (Carusone §6.6, Ex. 6.12: 45 ns for 0.1%).

## Level 6: Other Compensation Techniques

The RHP zero exists because $C_C$ conducts both ways. Let it carry the output back to the first stage but block the forward path, and the zero goes away.

```tikz title="Two ways to make C_C one-directional. (a) A source follower M_a buffers the output before C_C. (b) A common-gate device M_a returns the C_C current to node X (Ahuja). M7 is the output device. After Razavi Figs. 10.41(b) and 10.43."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \coordinate (top) at (0,3.2);
  % (a) source follower
  \draw (-1.2,0) node[left] {from stage 1} -- (0,0) coordinate (X) node[circ]{} node[above left] {$X$};
  \draw (1.5,-0.4) node[nmos](M7){$M_7$};
  \draw (X) |- (M7.G);
  \draw (M7.S) node[ground]{};
  \draw (1.5,3.2) to[I, l=$I_1$] (1.5,1.2) coordinate (vo);
  \draw (M7.D) -- (vo);
  \draw (vo) node[circ]{} node[above left] {$v_{out}$} -- (3.0,1.2);
  \draw (4.0,2.0) node[nmos](Ma){$M_a$};
  \draw (3.0,1.2) |- (Ma.G);
  \draw (Ma.D) -- (Ma.D |- top);
  \draw (Ma.S) -- ++(0,-0.3) coordinate (S) node[circ]{};
  \draw (S) -- ++(1.0,0) to[I, l=$I_2$] ++(0,-1.8) node[ground]{};
  \draw (S) -- (S |- 0,-2.4) to[C, l=$C_C$] (0,-2.4) -- (X);
  \draw (-1.0,3.2) -- (5.4,3.2);
  \node[font=\scriptsize] at (2.0,-3.6) {(a) follower: zero at $-g_{ma}/C_C$, swing $\ge V_{GSa}+V_{I2}$};
  % (b) common gate
  \begin{scope}[xshift=8.8cm]
    \draw (-1.6,3.2) -- (4.0,3.2);
    \draw (0,3.2) to[I, l_=$I_3$] (0,1.6) -- (0,0) coordinate (X) node[circ]{} node[above right] {$X$};
    \draw (-1.6,0.6) node[left] {stage 1} -- (-1.2,0.6) -- (-1.2,0) -- (X);
    \draw (1.5,-0.4) node[nmos](M7){$M_7$};
    \draw (X) |- (M7.G);
    \draw (M7.S) node[ground]{};
    \draw (1.5,3.2) to[I, l=$I_1$] (1.5,1.2) coordinate (vo);
    \draw (M7.D) -- (vo);
    \draw (vo) node[circ]{} -- (3.2,1.2) node[right] {$v_{out}$};
    \draw (0,-1.4) node[nmos](Ma){};
    \node at ([xshift=0.6cm]Ma.center) {$M_a$};
    \draw (Ma.D) -- (X);
    \draw (Ma.G) -- ++(-0.3,0) node[left] {$V_b$};
    \draw (Ma.S) -- ++(0,-0.25) coordinate (P) node[circ]{};
    \node[left,font=\scriptsize] at (P) {$P$};
    \draw (P) -- ++(-0.9,0) to[I, l_=$I_2$] ++(0,-1.4) node[ground]{};
    \draw (P) -- (P |- 0,-2.9) to[C, l=$C_C$] (3.0,-2.9) -- (3.0,1.2);
    \node[font=\scriptsize] at (1.6,-4.6) {(b) common gate: $\omega_{p2}\approx g_{ma}R_1\,g_{m7}/C_L$};
  \end{scope}
\end{circuitikz}
\end{document}
```

Notation as in [[#Level 4 Compensating Two-Stage Op Amps|Level 4]], plus $g_{ma}$ for the auxiliary device $M_a$.

| Technique | Zero | $\omega_{p1}$ | $\omega_{p2}$ | Catch |
|---|---|---|---|---|
| Miller + $R_C$ | moved by $R_C$ | $\dfrac{1}{g_{m7}R_1R_2C_C}$ | $\dfrac{g_{m7}}{C_L}$ | $R_C$ tracking, doublet |
| Source follower in series with $C_C$ | LHP, $-g_{ma}/C_C$ | same | same | Output can't go below $V_{GSa}+V_{I2}$ |
| Common-gate return (Ahuja) | LHP, $-g_{ma}/C_C$ | same | $\dfrac{g_{ma}R_1\,g_{m7}}{C_L}$ (×$g_{ma}R_1$) | Slewing: $I_2=I_3\ge I_{SS}$, power |
| $C_C$ to the cascode source of stage 1 | $(g_{m,cas}R_1)\dfrac{g_{m7}}{C_C}$ | same | $\dfrac{g_{m,cas}R_1\,g_{m7}}{C_L}$ | Pole at the high-resistance cascode node |

- **Follower:** a source follower passes signal from its gate to its source but not back, so $C_C$ can only carry the output to $X$. $C_{GSa}\ll C_C$ keeps the residual zero far out. The output's lower swing limit is the follower's $V_{GS}$ plus its current source.
- **Common gate:** $C_C$ and $M_a$ turn the output swing into a current returned to $X$; $C_C$'s bottom plate is a low-impedance source node, which also isolates the DC levels. $\omega_{p2}$ rises by $g_{ma}R_1$ because at high frequency the loop $M_a$–$R_1$ lowers the output resistance by that factor. Capacitance at $X$ (the gate of $M_7$) weakens the splitting. Equal slew rates need $I_2=I_3\ge I_{SS}$.
- **Cascode-source variant** (Razavi Fig. 10.46): with a cascode first stage, tie $C_C$ to the source of the cascode device, which then acts as the common-gate device for free. Two capacitors ($C_C$ to the cascode source, $C'_C$ to the first-stage output) can be combined for more freedom, and a resistor in series with $C_C$ still moves the zero.

> [!tip] Remark
> Same trick as in [[Frequency Response#Finding Zeros by Inspection]]: a zero comes from two paths fighting. Remove the forward path and only the feedback (pole-splitting) action of $C_C$ remains.

> [!note]- Derivation: transfer functions (Razavi Eqs. 10.39–10.51), with Razavi's labels
> Razavi labels the output device $M_1$ ($g_{m1}$, load $R_L$, $C_L$), the auxiliary device $M_2$ ($g_{m2}$), the first-stage resistance $R_S$; driven by $I_{in}$.
>
> **Follower** ($\gamma=\lambda=0$): $V_1=-\frac{V_{out}}{g_{m1}R_L}(1+R_LC_Ls)$ and $\frac{V_{out}-V_1}{1/g_{m2}+1/(C_Cs)}+I_{in}=\frac{V_1}{R_S}$ give
> $$\frac{V_{out}}{I_{in}}=\frac{-g_{m1}R_LR_S(g_{m2}+C_Cs)}{R_LC_LC_C(1+g_{m2}R_S)s^2+[(1+g_{m1}g_{m2}R_LR_S)C_C+g_{m2}R_LC_L]s+g_{m2}}$$
> LHP zero at $-g_{m2}/C_C$. With $g_{m2}R_S\gg1$ and $(1+g_{m1}g_{m2}R_LR_S)C_C\gg g_{m2}R_LC_L$: $\omega_{p1}\approx1/(g_{m1}R_LR_SC_C)$, $\omega_{p2}\approx g_{m1}/C_L$.
>
> **Common gate:** $V_{out}+g_{m2}V_2/(C_Cs)=-V_2$, $g_{m1}V_1+V_{out}(1/R_L+C_Ls)=g_{m2}V_2$, $I_{in}=V_1/R_S+g_{m2}V_2$:
> $$\frac{V_{out}}{I_{in}}=\frac{-g_{m1}R_SR_L(g_{m2}+C_Cs)}{R_LC_LC_Cs^2+[(1+g_{m1}R_S)g_{m2}R_LC_C+C_C+g_{m2}R_LC_L]s+g_{m2}}$$
> $\omega_{p1}\approx1/(g_{m1}R_LR_SC_C)$, $\omega_{p2}\approx g_{m2}R_Sg_{m1}/C_L$.
>
> **Slewing of the CG version** (Fig. 10.45): positive slewing needs $I_1\ge I_{SS}+I_{D1}$, otherwise $V_P$ drops and $M_1$ turns off, and for $I_1<I_{SS}$ the slew rate is $I_1/C_C$. Negative slewing needs $I_2$ to carry $I_{SS}$ plus $I_{D2}$.
>
> **Cascode variant** (Fig. 10.46(b), first-stage resistance $R_{eq}$, cascode $M_4$, output $M_9$): zero $(g_{m4}R_{eq})(g_{m9}/C_C)$, $\omega_{p1}\approx(R_{eq}g_{m9}R_LC_C)^{-1}$, $\omega_{p2}\approx g_{m4}g_{m9}R_{eq}/C_L$.

## Level 7: Nyquist's Criterion

Everything above tests $s=j\omega$ only: steady sinusoids. Nyquist tests the whole right half plane, so it catches growing sinusoids and settles the cases where the Bode reading is ambiguous. Read this section last; it changes no earlier answer for ordinary op-amp loops.

### Why Bode plots are not the whole story

Razavi Fig. 10.47: $\beta=1$, $|H|=3$ at the phase crossover $\omega_0$. Bode says unstable. Yet $Y/X(j\omega_0)=-3/(1-3)=3/2$, finite, and no $j\omega$ makes $Y/X$ infinite. No steady sinusoid can circulate. But a **growing** sinusoid $s=\sigma_1+j\omega_1$, $\sigma_1>0$, can satisfy $H(s)=-1$. Only a test over the RHP finds it.

### Polar plots and Cauchy's principle

$$
\boxed{\text{clockwise } s\text{-contour around } Z \text{ zeros and } P \text{ poles of } F(s) \;\Rightarrow\; F \text{ encircles the origin } Z-P \text{ times clockwise}}
$$

- Plot $H(j\omega)$ in polar form: radius $|H|$, angle $\angle H$. Only $\omega=0$, $\omega\to\infty$ and the crossings of the real axis matter; the exact shape doesn't.
- The angle of $H(s_1)$ can be read in the $s$ plane: draw vectors from each zero and pole to $s_1$; zero angles add, pole angles subtract (the magnitude is the product of zero-vector lengths over the product of pole-vector lengths).
- The plot is symmetric about the real axis: draw $\omega$ from 0 to $+\infty$ and reflect.

### The criterion

```tikz title="Left: the Nyquist contour runs up the jω axis and closes around the right half plane. Right: βH of a three-pole loop. It crosses the negative real axis at Q (where ∠βH = -180°); stable if Q is to the right of -1, i.e. -1 is not encircled. After Razavi Figs. 10.62 and 10.65."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % s-plane contour
  \draw[->] (-2.6,0) -- (2.4,0) node[right] {$\sigma$};
  \draw[->] (0,-2.4) -- (0,2.5) node[above] {$j\omega$};
  \draw[very thick,red!70!black,->] (0,0) -- (0,1.0);
  \draw[very thick,red!70!black] (0,0.9) -- (0,1.9);
  \draw[very thick,red!70!black,->] (0,1.9) arc (90:30:1.9);
  \draw[very thick,red!70!black] (1.645,0.95) arc (30:-90:1.9);
  \draw[very thick,red!70!black,->] (0,-1.9) -- (0,-0.8);
  \draw[very thick,red!70!black] (0,-0.9) -- (0,0);
  \foreach \x in {-0.5,-1.2,-2.0} {\node[font=\large] at (\x,0) {$\times$};}
  \node[font=\scriptsize,red!70!black,anchor=west] at (1.4,1.7) {$|s|\to\infty$};
  \node[font=\scriptsize] at (-1.2,-0.4) {open-loop poles};
  \node[font=\scriptsize,align=center] at (0,-2.9) {$s$ plane: encloses the RHP};
  % polar plot
  \begin{scope}[xshift=5.8cm,x=0.9cm,y=0.9cm]
    \draw[->] (-2.0,0) -- (5.9,0) node[right] {$\mathrm{Re}\{\beta H\}$};
    \draw[->] (0,-3.0) -- (0,3.2) node[above] {$\mathrm{Im}\{\beta H\}$};
    \draw[very thick,blue!70!black,domain=0:2.9,samples=140,variable=\t] plot ({5.0/sqrt((1+(\t)^4)*(1+(\t)^4/4)*(1+(\t)^4/16))*cos(-(atan((\t)^2)+atan((\t)^2/2)+atan((\t)^2/4)))},{5.0/sqrt((1+(\t)^4)*(1+(\t)^4/4)*(1+(\t)^4/16))*sin(-(atan((\t)^2)+atan((\t)^2/2)+atan((\t)^2/4)))});
    \draw[thick,densely dashed,blue!70!black,domain=0:2.9,samples=140,variable=\t] plot ({5.0/sqrt((1+(\t)^4)*(1+(\t)^4/4)*(1+(\t)^4/16))*cos(-(atan((\t)^2)+atan((\t)^2/2)+atan((\t)^2/4)))},{-5.0/sqrt((1+(\t)^4)*(1+(\t)^4/4)*(1+(\t)^4/16))*sin(-(atan((\t)^2)+atan((\t)^2/2)+atan((\t)^2/4)))});
    \node[font=\large,red!70!black] at (-1,0) {$\times$};
    \node[font=\scriptsize,red!70!black,below left] at (-1,-0.1) {$(-1,0)$};
    \fill (-0.44,0) circle (2pt);
    \node[font=\scriptsize,above] at (-0.4,0.12) {$Q$};
    \node[font=\scriptsize,anchor=south west] at (5.0,0.1) {$\beta A_0$};
    \node[font=\scriptsize,blue!70!black,anchor=north west] at (2.2,-2.2) {$\omega:0\to+\infty$};
    \node[font=\scriptsize,blue!70!black,anchor=south west] at (2.2,2.2) {$\omega:-\infty\to0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z = N + P,\qquad \text{stable} \iff \beta H(s)\ \text{does not encircle}\ (-1,0)\ \text{clockwise}\quad(P=0)}
$$

$Z$: zeros of $1+\beta H$ in the RHP (= closed-loop poles there). $N$: clockwise encirclements of $-1$ by $\beta H$. $P$: open-loop RHP poles, zero for almost every circuit here. Encircling the origin with $1+\beta H$ is the same as encircling $-1$ with $\beta H$.

- **Counting:** draw a ray from $-1$ to infinity in any direction; clockwise crossings minus counterclockwise crossings.
- If $\beta H$ passes **through** $-1$, the closed loop has poles on the $j\omega$ axis: a sustained oscillation (the [[Oscillators]] condition).
- **One pole, two poles:** the plot ends at the origin at $-90^\circ$ or $-180^\circ$ and never reaches $-1$. Stable for any $\beta$.
- **Three poles:** the plot crosses the negative real axis at $Q$, where $\angle\beta H=-180^\circ$. Stable if $|\beta H(Q)|<1$. Since every radius scales with $\beta$, a larger $\beta$ can push $Q$ past $-1$.

### Poles at the origin

Integrators put poles on the contour. Detour around each with a tiny semicircle $s=\varepsilon e^{j\phi}$; $\beta H$ then swings through a huge arc.

$$
\boxed{\beta H=\frac{\beta A_0}{s^2}\ \Rightarrow\ \text{closed-loop poles}\ \pm j\sqrt{\beta A_0};\qquad \beta H=\frac{\beta A_0(1+s/\omega_z)}{s^2}\ \Rightarrow\ \text{stable}}
$$

- One integrator ($A_0/s$): the plot arrives at $-90^\circ$; stable. Adding a zero bends the plot away from the origin toward the real value $\beta A_0/\omega_z$.
- Two ideal integrators: $\beta H$ runs along the negative real axis and passes through $-1$ at $\omega=\sqrt{\beta A_0}$: an oscillator.
- A zero on one integrator keeps the phase from ever reaching exactly $-180^\circ$ except at $\omega=0$, so the plot never touches $-1$. This is the type-II [[Phased-Locked Loops|PLL]] loop: its Bode plot seems to show $|\beta H|>1$ at $-180^\circ$, yet it is stable.

### Multiple 180° crossings: conditional stability

$$
\boxed{\angle\beta H\ \text{crosses}\ -180^\circ\ \text{an even (odd) number of times while}\ |\beta H|>1\ \Rightarrow\ \text{stable (unstable)}}
$$

With three poles and two zeros (Razavi Fig. 10.72) the phase dips below $-180^\circ$ and comes back, both times with $|\beta H|>1$. Bode's "gain crossover before phase crossover" rule calls that unstable. Nyquist says it's stable when both real-axis crossings ($B$ and $C$) are to the left of $-1$: the ray from $-1$ crosses the plot twice in opposite directions. If $-1$ lies between $B$ and $C$, it's unstable.

> [!note]- Detail: building polar plots by hand (Razavi §10.8.3)
> - **First order, $A_0(1+s/\omega_z)/(1+s/\omega_p)$, $\omega_p>\omega_z$:** starts at $A_0$, the zero leads the pole so the angle is positive, ends at $A_0\omega_p/\omega_z$ on the real axis. For $\omega_p<\omega_z$ it dips negative and ends at the smaller value $A_0\omega_p/\omega_z$.
> - **A clockwise contour enclosing only a pole** makes the plot circle the origin counterclockwise; **only a zero**, clockwise; **both**, no net encirclement. This is Cauchy's $Z-P$.
> - **Two poles on the $j\omega$ axis contour:** starts at $A_0$, crosses $-90^\circ$, ends at the origin from $-180^\circ$. A contour enclosing both poles makes the plot circle the origin twice counterclockwise.
> - **Three poles:** the $-180^\circ$ point $Q$ solves $\tan^{-1}(\omega_Q/\omega_{p1})+\tan^{-1}(\omega_Q/\omega_{p2})+\tan^{-1}(\omega_Q/\omega_{p3})=180^\circ$; compare $|\beta H(j\omega_Q)|$ with 1. This is the same calculation as reading a Bode plot at PX.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↓ $\beta$ (higher closed-loop gain) | PM; $C_C$ can shrink by $1/\beta$ | Loop gain and accuracy; closed-loop bandwidth unchanged |
| ↑ $C_L$ (one-stage) | PM (dominant pole is the output) | Bandwidth $\beta g_{m1}/C_L$, slew rate $I/C_L$ |
| ↑ $C_L$ (two-stage) | Nothing | $\omega_{p2}=g_{m7}/C_L$ falls: PM falls, ringing |
| ↑ $C_C$ | PM (lower $\omega_t$) | $\omega_t=\beta g_{m1}/C_C$, SR $=I_{D5}/C_C$, area; zero-to-crossover ratio unchanged |
| ↑ $g_{m7}$ (second-stage current) | $\omega_{p2}$ and $\omega_z$ up: more PM or bandwidth | Power, output-stage area and capacitance |
| ↑ $g_{m1}$ at fixed $C_C$ | $\omega_t$, DC gain, input noise | Needs more $C_C$ for the same PM; SR/$\omega_{ta}=V_{ov1}$ drops |
| ↑ $V_{ov1}$ at fixed current | Slew rate at the same $\omega_{ta}$ | DC gain, input-referred thermal noise |
| $R_C=1/g_{m7}$ | Removes the RHP zero | Needs $g_{m7}$ tracking |
| $R_C$ for zero at $1.7\omega_t$ | $\approx+30^\circ$ PM, slightly higher $\omega_t$ | Tracking; check gain keeps falling above $\omega_t$ |
| $R_C$ to cancel $\omega_{p2}$ | Removes the second pole | $C_L$ must be known; doublet slows settling |
| Follower or CG in the $C_C$ path | No RHP zero (CG: $\omega_{p2}\times g_{ma}R_1$) | Swing (follower) or power for symmetric slewing (CG) |
| Fully differential instead of a mirror | No mirror pole: higher $\omega_t$ | Common-mode feedback |
| Larger PM target | Less overshoot | Slower settling once overdamped |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Closed loop | $Y/X=H/(1+\beta H)$ |
| Barkhausen | $\lvert\beta H(j\omega_1)\rvert=1$, $\angle\beta H(j\omega_1)=-180^\circ$ |
| One-pole closed loop | pole at $-\omega_0(1+\beta A_0)$, always stable |
| Two-pole closed loop | $s_{1,2}=\frac{-(\omega_{p1}+\omega_{p2})\pm\sqrt{(\omega_{p1}+\omega_{p2})^2-4(1+\beta A_0)\omega_{p1}\omega_{p2}}}{2}$; complex for $\beta>\frac{(\omega_{p1}-\omega_{p2})^2}{4A_0\omega_{p1}\omega_{p2}}$ |
| Phase margin | $\text{PM}=180^\circ+\angle\beta H(\omega_t)$ |
| Peaking | $\lvert Y/X(j\omega_t)\rvert=\frac1\beta\cdot\frac{1}{2\sin(\text{PM}/2)}$ |
| Two-pole PM | $\text{PM}\approx90^\circ-\tan^{-1}(\omega_t/\omega_{p2})$; $>45^\circ$ iff $\omega_t<\omega_{p2}$ |
| Dominant-pole compensation | $\omega'_{p1}=\omega_x/(\beta A_0)$, $\angle\beta H(\omega_x)=-180^\circ+\text{PM}$ |
| Lower $\beta$ | $\omega''_{p1}=\omega'_{p1}/\beta$ |
| One-stage op amp | $\omega_{ta}=g_{m1}/C_L$, $\omega_t=\beta g_{m1}/C_L$, SR $=I_{out,max}/C_L$ |
| Cascode-load pole | $\tau=(1+g_{m5}r_{O5})r_{O7}C_L+r_{O7}C_N$ |
| Doublet tail | $(1-\omega_z/\omega_{p2})e^{-\omega_{p2}t}$ |
| Miller poles | $\omega_{p1}\approx1/(g_{m7}R_1R_2C_C)$, $\omega_{p2}\approx g_{m7}/(C_1+C_2)$ |
| RHP zero | $\omega_z=g_{m7}/C_C$ |
| Two-stage crossover | $\omega_{ta}=g_{m1}/C_C$, $\omega_t=\beta g_{m1}/C_C$ |
| Starting $C_C$ | $C_C\approx\beta g_{m1}C_L/g_{m7}$ (45°) |
| Zero with $R_C$ | $s_z=1/[C_C(1/g_{m7}-R_C)]$ |
| Kill zero | $R_C=1/g_{m7}$ |
| Cancel $\omega_{p2}$ | $R_C=(C_1+C_2+C_C)/(g_{m7}C_C)$ |
| Lead zero at $1.7\omega_t$ | $R_C\approx1/(1.7\omega_tC_C)=1/(1.7\beta g_{m1})$ |
| Tracking $R_C$ | $R_Cg_{m7}=\frac{(W/L)_7(W/L)_{12}}{(W/L)_9(W/L)_{13}}$ |
| Two-stage slew rate | SR $=I_{D5}/C_C=V_{ov1}\omega_{ta}$ |
| Slew with $C_L$ | need $I_{D6}>I_{D5}(1+C_L/C_C)$, else SR $=(I_{D6}-I_{D5})/C_L$ |
| Class-AB slew | SR $=[\alpha(W_{p1}/W_{p2})-1]I_{SS}/C_L$ |
| Slew + linear settling | $V_{step,max}=\text{SR}\,\tau$; $t\approx\frac{V_{step}-\text{SR}\tau}{\text{SR}}+\tau\ln\frac{\text{SR}\tau}{\varepsilon}$ |
| Follower compensation | zero $-g_{ma}/C_C$, poles as Miller |
| Common-gate compensation | zero $-g_{ma}/C_C$, $\omega_{p2}\approx g_{ma}R_1g_{m7}/C_L$ |
| Cauchy | $F$ encircles origin $Z-P$ times (clockwise) |
| Nyquist | $Z=N+P$; stable iff $\beta H$ doesn't encircle $-1$ (for $P=0$) |
| Double integrator | poles $\pm j\sqrt{\beta A_0}$; a zero stabilizes |
| Multiple crossings | even number of $-180^\circ$ crossings with $\lvert\beta H\rvert>1$: stable |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 10 Stability and Frequency Compensation, pp. 410–458:
  - §10.1 General considerations, pp. 410–414: Barkhausen, GX/PX, Ex. 10.1 (lower $\beta$), Bode rules, pole positions (Fig. 10.4), one-pole root locus (Ex. 10.2).
  - §10.2 Multipole systems, pp. 414–416: two-pole root locus (Ex. 10.3, Eq. 10.9), three poles (Fig. 10.9).
  - §10.3 Phase margin, pp. 416–419: Eqs. 10.10–10.18, Ex. 10.4, Figs. 10.12–10.14.
  - §10.4 Basic frequency compensation, pp. 420–426: Figs. 10.15–10.21, telescopic mirror pole, Ex. 10.5, fully differential, Eqs. 10.20–10.23, pole-zero cancellation.
  - §10.5 Compensation of two-stage op amps, pp. 426–433: Miller, pole splitting (Eqs. 10.24–10.25), Ex. 10.6, RHP zero (Ex. 10.7), $R_z$ (Eqs. 10.30–10.35, Figs. 10.32–10.35), load capacitance (Fig. 10.36).
  - §10.6 Slewing in two-stage op amps, pp. 433–435: Eqs. 10.36–10.38, Fig. 10.38, Ex. 10.8, class-AB (Fig. 10.40).
  - §10.7 Other compensation techniques, pp. 436–439: follower (Eqs. 10.39–10.45), common gate (Eqs. 10.46–10.51, Fig. 10.45), cascode variant (Fig. 10.46).
  - §10.8 Nyquist's criterion, pp. 439–455: motivation, polar plots, Cauchy, Exs. 10.9–10.14, multiple crossings (Fig. 10.72).
  - Problems 10.8, 10.19 (doublet), 10.23.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24), Ch. 6:
  - §6.1.2 Frequency response of the two-stage op amp, pp. 245–249: Eqs. 6.4–6.21, Exs. 6.2–6.3.
  - §6.1.3 Slew rate, pp. 249–252: Ex. 6.4 (slew + settling), Eqs. 6.25–6.30, Ex. 6.5.
  - §6.2 Opamp compensation, pp. 254–261: dominant-pole and lead compensation (Fig. 6.8), Eqs. 6.41–6.50, compensation procedure, Ex. 6.7, process/temperature tracking (Eqs. 6.61–6.72, Fig. 6.11).
  - §6.4.1–6.4.2 Folded cascode small-signal analysis and slew rate, pp. 270–272: Eqs. 6.99–6.105 (compensating a single-stage op amp).
  - §6.6 Linear settling time revisited, pp. 279–280: Eqs. 6.137–6.141, Ex. 6.12.
- **Zettelkasten extensions** (`AnalogTheory/Stability and Compensation/`, `S9 Stability and Compensation`): 9e1 (peaking $1/[2\beta\sin(\text{PM}/2)]$, PM-to-damping formula and the PM/$\zeta$/overshoot table, why 60° rather than more), 9h1a (drawn capacitor is $C_C-C_{GD}$; the RHP zero erodes the 45° estimate), 9h2 (the ratio $\omega_z/\omega_t$ is fixed by transconductances, not by $C_C$).
