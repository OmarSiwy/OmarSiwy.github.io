---
title: Bandgap References
description: How a chip makes a voltage or current that ignores the supply and the temperature, from the self-biased loop to the Kuijk cell, offset, curvature, constant-gm, sub-1-V Banba references and output impedance.
kind: topic
status: growing
aliases:
  - Bandgap References
  - Bandgap Reference
  - Bandgap
---

A reference is the one circuit every other block quietly assumes is perfect: every bias current, every common-mode level, every converter full scale is a copy of it. This note starts with the reference as a black box, then opens it in two separate problems (supply first, temperature second), then walks through what breaks in a real CMOS cell: offset, curvature, low supply, output impedance and noise.

## The big picture

```tikz title="The bandgap idea: V_BE falls with temperature (CTAT), a scaled Delta V_BE rises (PTAT), and their sum is flat. Both lines extrapolate to about E_g/q at 0 K, which names the circuit. After Razavi Sec. 12.3 and Carusone Fig. 7.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.2,0) node[right] {$T$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$V$};
  \draw[thick] (0,3.4) -- (6.8,3.4);
  \draw[thick,dashed] (0,3.4) -- (3.2,1.98);
  \draw[thick] (3.2,1.98) -- (6.8,0.38);
  \draw[thick,dashed] (0,0) -- (3.2,1.42);
  \draw[thick] (3.2,1.42) -- (6.8,3.02);
  \fill[gray!15] (3.2,0.02) rectangle (6.8,0.25);
  \node[font=\scriptsize] at (5.0,0.14) {operating range};
  \node[left,font=\scriptsize] at (0,3.4) {$\approx E_g/q$};
  \node[below,font=\scriptsize] at (0,0) {0 K};
  \node[font=\scriptsize,anchor=south] at (5.0,3.45) {$V_{REF}=V_{BE}+K\,V_T\approx1.25$ V (zero TC)};
  \node[font=\scriptsize,anchor=west] at (5.2,1.35) {$V_{BE}$: $-1.5$ mV/K};
  \node[font=\scriptsize,anchor=north west] at (5.3,2.3) {$K\,V_T$: $+K\cdot0.087$ mV/K};
  \begin{scope}[xshift=8.6cm,yshift=1.0cm]
    \draw (0,1.6) rectangle (2.4,2.4) node[midway,align=center,font=\scriptsize] {junction\\ $V_{BE}$ (CTAT)};
    \draw (0,-0.4) rectangle (2.4,0.4) node[midway,align=center,font=\scriptsize] {PTAT generator\\ $\Delta V_{BE}=V_T\ln n$};
    \draw (3.2,0) node[draw,rectangle,minimum width=0.7cm,minimum height=0.6cm] (K) {$K$};
    \draw (4.6,1.0) node[draw,circle,inner sep=1pt] (S) {$+$};
    \draw[->] (2.4,0) -- (K.west);
    \draw[->] (K.east) -| (S.south);
    \draw[->] (2.4,2.0) -| (S.north);
    \draw[->] (S.east) -- ++(0.8,0) node[right] {$V_{REF}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Two separate problems.** Make the quantity independent of the **supply** (a self-biased loop, no bipolars needed), then give it the wanted **temperature law** (PTAT, constant-$g_m$, or zero TC).
> 2. **CTAT ingredient:** $\partial V_{BE}/\partial T = [V_{BE}-(4+m)V_T-E_g/q]/T \approx -1.5$ mV/K at 300 K.
> 3. **PTAT ingredient:** two junctions at current densities differing by $n$ give $\Delta V_{BE} = V_T\ln n$, TC $= (k/q)\ln n$, with no process parameter in it.
> 4. **Zero TC:** $V_{REF} \approx V_{BE} + 17.2\,V_T \approx 1.25$ V. The 17.2 is a resistor ratio times $\ln n$, e.g. Kuijk cell $V_{out} = V_{BE2} + (1+R_2/R_3)V_T\ln n$.
> 5. **What really limits it:** the op-amp offset is amplified by the **same** $1+R_2/R_3$ as the PTAT term, op-amp noise reaches the output almost unattenuated, and the 1.25 V output does not fit under a 1 V supply unless you sum **currents** instead (Banba).

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 What a Reference Is|what a reference is]] → [[#Level 1 Supply-Independent Biasing|supply independence, start-up]] → [[#Level 2 The First-Order Bandgap|$V_{BE}$, $\Delta V_{BE}$, Kuijk cell, CMOS pnp]] → [[#Level 3 Second-Order Errors of the Bandgap Cell|PTAT bias, offset, feedback polarity, curvature]] → [[#Level 4 Current-Mode, Constant-gm and Low-Voltage References|PTAT current, constant-$g_m$, Banba]] → [[#Level 5 Living With a Real Reference|output impedance, bypass, noise, PSRR case study]].

## Spec translation

A bandgap is not an amplifier, but its accuracy is mostly the accuracy of the op amp inside it. Every op-amp input error sits right next to $\Delta V_{BE}$ and gets the same gain $K = 1+R_2/R_3$.

```tikz title="Where the op amp enters a bandgap: offset, noise and the finite-gain error add to the PTAT voltage at the op-amp input and are multiplied by the same K as Delta V_BE. After Razavi Sec. 12.3 (offset) and Eqs. 12.63-12.65 (noise)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,align=center,minimum height=0.9cm,inner sep=4pt}}
  \node[blk] (ptat) at (0,0) {$\Delta V_{BE}=V_T\ln n$\\ \scriptsize PTAT};
  \node[draw,circle,inner sep=1pt] (s1) at (2.6,0) {$+$};
  \node[blk,align=left] (err) at (2.6,-2.2) {\scriptsize $-V_{OS}$ (offset, drift)\\ \scriptsize $+\,V_{n,op}$ (noise)\\ \scriptsize $-\,\Delta V_{o,op}/A_0$ (finite gain)};
  \node[blk] (K) at (5.2,0) {$\times K$\\ \scriptsize $K=1+R_2/R_3\approx5$ to 10};
  \node[draw,circle,inner sep=1pt] (s2) at (7.6,0) {$+$};
  \node[blk] (vbe) at (7.6,2.0) {$V_{BE}$ (CTAT)};
  \draw[->] (ptat) -- (s1);
  \draw[->] (err) -- (s1) node[pos=0.6,left,font=\scriptsize] {op-amp input};
  \draw[->] (s1) -- (K);
  \draw[->] (K) -- (s2);
  \draw[->] (vbe) -- (s2);
  \draw[->] (s2) -- ++(1.3,0) node[right] {$V_{REF}$};
  \node[font=\scriptsize,align=left,anchor=west,red!70!black] at (4.6,-2.2) {every op-amp error sits beside $\Delta V_{BE}$\\ and is amplified by the same $K$};
\end{circuitikz}
\end{document}
```

**The block's own specs:**

| Spec | Definition | Numbers from the sources |
|---|---|---|
| Output value, initial accuracy | $V_{REF}$ at $T_0$, before and after trim | $\approx 1.24$ to 1.25 V; about 1% or better from "$E_g/q$ plus ratios" (Carusone §7.1.2) |
| Temperature coefficient (TC) | $\frac{1}{V_{REF}}\frac{\partial V_{REF}}{\partial T}$, ppm/°C | Curvature alone: 6.5 ppm/K at 0 °C for a cell zeroed at 20 °C; practical references 4 to 10× worse; about **25 ppm/K** best first-order CMOS (Carusone Ex. 7.4, p. 319) |
| Line regulation / PSRR | $\Delta V_{REF}/\Delta V_{DD}$ at dc; $20\log\lvert v_{dd}/v_{ref}\rvert$ vs frequency | Case study: **94 dB** at low frequency, **58 dB at 100 kHz** (Razavi §12.8) |
| Output impedance / load regulation | $Z_{out}(\omega)$ seen by the circuits the reference drives | Low only below the op-amp pole $\omega_0$ (Razavi Ex. 12.7) |
| Recovery from a disturbance | Settling of the reference node after a kick through $C_c$ | Glitch area $R_PC_c\Delta V_N$, independent of $C_B$ |
| Output noise | Spot or integrated noise at $V_{REF}$ | $\approx V_{n,op}$ (Kuijk); $\times R_4/(R_1\Vert R_2)$ (Banba) |
| Start-up | Leaves the zero-current state on every supply ramp | Must be simulated (dc sweep and transient) |
| Minimum supply | Lowest $V_{DD}$ with everything saturated | Kuijk: $\approx V_{BE}+K V_T\ln n$ plus op-amp headroom; Banba: $\approx 0.75$ V (Razavi §12.7) |

**What sets each one:**

| Bandgap spec | Inside the block | Amplifier spec that sets it ([[Single-Stage#Amplifier Specifications]]) |
|---|---|---|
| TC, initial accuracy | Op amp $A_1$ | **Offset** $V_{OS}$ and its drift, amplified by $K$; **DC gain** (finite-gain error acts like an offset) |
| Line regulation, low-frequency PSRR | Op amp, mirror PMOS $r_o$ | **DC gain** (loop gain divides the supply error); output impedance $r_o$ of the core devices |
| PSRR at high frequency | Op amp | The op amp's own **PSRR** and **GBW**; beyond that, a local regulator or cascodes |
| Output impedance, load regulation | Op amp driving the PMOS gate line | **DC gain** ($Z_{out}$ divided by $1+g_{mP}R_1A_0$), **GBW** (how far up that holds), op-amp **output impedance** $R_{out}$ |
| Recovery, settling | Op amp, bypass $C_B$ | **GBW**, **slew rate**; with $C_B$, **phase margin** into a large load (one-stage op amp) |
| Noise | Op amp, PMOS mirrors | **Input-referred noise**, especially $1/f$ |
| Start-up, minimum supply | Op-amp input pair | **Input CM range** (inputs sit near $V_{BE}$), **output swing** |
| Loop stability | Two feedback paths $\beta_N > \beta_P$ | **Phase margin** of the net loop |

$$
\boxed{\Delta V_{REF} = K\left(V_{OS}+\frac{\Delta V_{o,op}}{A_0}\right),\qquad \mathrm{TC_{err}}\approx\frac{K\,V_{OS}}{V_{REF}\,T_0}\ \Rightarrow\ V_{OS}\le\frac{\mathrm{TC_{budget}}\cdot V_{REF}\,T_0}{K}}
$$

$$
\boxed{\lvert Z_{out}\rvert\approx\frac{R_{out}}{1+g_{mP}R_1A_0}\ \text{ up to }\ \omega_0,\qquad \text{closed-loop pole}\approx g_{mP}R_1\,\omega_u\qquad \lvert V_{n,out}\rvert\approx V_{n,op}}
$$

- **Offset is the big one.** Carusone: a temperature-independent 1 mV offset costs about **26 ppm/°C**, as much as the 25 ppm/K floor the cell has once offset is removed.
- **Gain enters twice:** as a systematic offset (the part that changes with temperature is not trimmed out) and as the divisor of supply and load errors. Razavi's low-voltage OTA only needs a loop gain of about **5 to 10**, because offset, not gain, dominates.
- **Noise passes straight through:** feedback in the cell does not divide the op amp's input noise ([[Feedback#What feedback does not buy noise]]).

> [!note]- Derivation: offset to TC (Carusone Eqs. 7.25, 7.56; Razavi §12.3 offset)
> With offset, $V_{REF} = V_{BE}+K(V_T\ln n - V_{OS})$. If the cell is trimmed so that $V_{REF}(T_0)$ equals the zero-TC value $V_{G0}+(m'-1)kT_0/q$, the trim adds a PTAT voltage equal to $KV_{OS}$ at $T_0$ to cancel the offset. A PTAT voltage has slope (value)/$T$, so the cell is left with
> $$\frac{\partial V_{REF}}{\partial T}\Big|_{T_0}\approx\frac{KV_{OS}}{T_0},\qquad \mathrm{TC_{err}} = \frac{KV_{OS}}{V_{REF}T_0}$$
> Check against Carusone's number: $K = 9.93$ (Ex. 7.5), $V_{OS} = 1$ mV, $T_0 = 300$ K, $V_{REF} = 1.24$ V gives $9.93\text{ mV}/(1.24\text{ V}\cdot300\text{ K}) = 26.7$ ppm/K, his 26 ppm/°C. Without trim the same offset is simply an initial error of $KV_{OS}$.

> [!note]- Derivation: finite gain is an offset; gain divides supply and load errors
> An op amp with gain $A_0$ whose output must move by $\Delta V_{o,op}$ (over temperature, supply or load) needs an input difference $\Delta V_{o,op}/A_0$. That difference sits where $V_{OS}$ sits, so it gets the same $K$. In the Kuijk cell the op-amp output *is* $V_{REF}$, which is flat, so this term is small; in current-mode cells the op amp drives PMOS gates whose $V_{GS}$ moves with temperature, and the term must be kept below the offset budget: $A_0\ge\Delta V_{o,op}/V_{OS,budget}$.
> Supply and load disturbances are disturbances inside a loop, so they are divided by $1+$ loop gain up to the op-amp pole; Razavi Ex. 12.7 gives the load case in closed form ([[#Output Impedance vs Frequency]]). Its closed-loop pole $(1+g_{mP}R_1A_0)\omega_0\approx g_{mP}R_1A_0\omega_0 = g_{mP}R_1\omega_u$.

**Where the op-amp specs land in sizing:**

| Op-amp spec | Knob |
|---|---|
| Offset $V_{OS}$ | Area $WL$ of pair and loads ($\sigma\propto A_{VT}/\sqrt{WL}$); input pair at high $g_m/I_D$, loads at low $g_m/I_D$ |
| $1/f$ noise | Area $WL$; PMOS input pair |
| Thermal noise | Input $g_m$, so $I_D$ at the chosen $g_m/I_D$ |
| DC gain | $L$ (long devices: Razavi's "long enough for a loop gain of 5 to 10") |
| Input CM range (inputs at $V_{BE}$) | High $g_m/I_D$ on the input pair and tail, so $V_{GS}+V_{D,sat,tail}\le\lvert V_{BE1}\rvert$ (Banba) |
| GBW, recovery | $I_D$ ($g_m = \omega_uC$), $f_T$ of the internal nodes |
| PM with a bypass $C_B$ | One stage, so the load capacitor is the dominant pole |

> [!tip] Remark
> Each row is one step of the $g_m/I_D$ procedure ([[gm-ID Design Methodology]]): the bandgap fixes $V_{OS}$ and noise first (area), then the CM range fixes $g_m/I_D$, then GBW fixes $I_D$.

> [!example] Worked example: TC budget to op-amp area
> Target 10 ppm/K of offset-induced TC, Carusone's cell ($K = 9.93$, $V_{REF} = 1.24$ V, $T_0 = 300$ K):
> $V_{OS}\le 10^{-5}\cdot1.24\cdot300/9.93 = 0.37$ mV. For $3\sigma$ yield, $\sigma(V_{OS})\le 0.125$ mV. With the 65 nm $A_{VT} = 3.5$ mV·µm of [[Nonlinearity and Mismatch#Level 5 Mismatch Beyond the Square Law]] and only the input pair counted, $WL\ge(3.5/0.125)^2\approx 800\ \mu\text{m}^2$ per device. That is why references use trimming, stacked junctions or offset-cancelled SC amplifiers ([[#Op-Amp Offset]]) rather than area alone.
> (Arithmetic on the sources' numbers; load-device mismatch adds to it.)

## Level 0: What a Reference Is

```tikz title="The three temperature laws a reference is asked for. PTAT current rises linearly from 0 K, a zero-TC quantity is flat, and a constant-gm bias current must rise faster than linear (about T^1.5) to cancel falling mobility. After Razavi Sec. 12.1 and Carusone Sec. 7.2.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right] {$T$ (K)};
  \draw[->] (0,0) -- (0,4.0) node[above] {$I$ or $V$};
  \draw[thick] (0,0) -- (6,2.9) node[right,font=\scriptsize] {PTAT};
  \draw[thick] (0,1.9) -- (6,1.9) node[right,font=\scriptsize] {zero TC};
  \draw[thick,domain=0:6,samples=40] plot (\x,{0.155*\x^1.5});
  \node[right,font=\scriptsize] at (6,2.28) {constant-$g_m$ ($\propto 1/\mu\propto T^{3/2}$)};
  \draw[dotted] (4.5,0) -- (4.5,3.6);
  \node[below,font=\scriptsize] at (4.5,0) {300 K};
\end{circuitikz}
\end{document}
```

A reference is a **DC** voltage or current that has little dependence on supply and process and a **well-defined** dependence on temperature. Three laws cover most uses:

| Law | Used for | Built from |
|---|---|---|
| PTAT ($\propto T$) | Bipolar bias (keeps $g_m = I_C/V_T$ constant), temperature sensors | $\Delta V_{BE}/R$ |
| Constant-$g_m$ | MOS amplifier gain, bandwidth, noise | self-biased loop with one resistor |
| Zero TC | Converter full scale, absolute voltages and currents | $V_{BE} + K\Delta V_{BE}$ (bandgap) |

Other specs that matter as much as accuracy: **output impedance, output noise, power** (Razavi), and supply rejection.

> [!tip] Remark
> Why the bandgap is the go-to: on a chip, **ratios** (sizes, resistor ratios) are accurate but almost every **dimensioned** quantity ($\mu C_{ox}$, $R$, $V_{TH}$) wanders from chip to chip and with temperature. The bandgap of silicon is a physical constant, so a circuit whose output is "$E_g/q$ plus ratios" can hit about 1% or better (Carusone Sec. 7.1.2). A reference with zero TC is usually process-independent too, because most process parameters move with temperature (Razavi Sec. 12.3).

> [!note]- Detail: why a simple resistor-and-diode-MOS reference is not good enough (Carusone Ex. 7.2)
> A resistor $R$ from $V_{DD}$ into a diode-connected NMOS gives $V_o$ from $\frac{V_{DD}-V_o}{R} = \frac12\mu_nC_{ox}\frac WL(V_o-V_{tn})^2$. With $W/L=10$, $\mu_nC_{ox}=190\ \mu$A/V², $V_{tn}=0.45$ V, $R=20$ kΩ, $V_{DD}=1.5$ V: $V_o = 660$ mV. Shift $\mu_nC_{ox}$ by −30%, $R$ by −10%, $V_{tn}$ by +30 mV and $V_{DD}$ by +100 mV (all typical) and $V_o = 747$ mV, a 13% change.

> [!note]- Detail: the references that lost (Carusone Sec. 7.3)
> - **Zener breakdown:** the breakdown voltage is usually above modern supplies.
> - **Enhancement minus depletion $V_{TH}$:** needs depletion devices (often unavailable), and the difference is process-sensitive, so the absolute value is hard to set.
> - **$V_{BE}$ + PTAT (bandgap):** the one used in both bipolar and CMOS. Everything below is this one.

## Level 1: Supply-Independent Biasing

> [!tip] Remark
> This level is the same loop as [[Biasing#The Self-Biased Loop]] and [[Biasing#Start-Up]], and its mirrors are the ones in [[Current Mirrors]]. Here it matters because every bandgap cell below is this loop with bipolars added.

### Resistor Biasing Follows the Supply

$$
\boxed{I_{out} = \frac{V_{DD}}{R_1 + 1/g_{m1}}\cdot\frac{(W/L)_2}{(W/L)_1}}
$$

A resistor from $V_{DD}$ into a diode-connected $M_1$, mirrored by $M_2$, gives a current roughly **proportional to the supply** (Razavi Fig. 12.1(b)). The fix is to make the circuit bias itself: derive $I_{REF}$ from $I_{out}$.

### The Self-Biased Loop

```tikz title="Self-biased (bootstrapped) current source with R_S to fix the current, and a start-up device M5. M3 = M4, M2 is K times M1. After Razavi Figs. 12.3(a) and 12.5(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (3.8,0) node[nmos](M2){};
  \draw (0,4) node[pmos,xscale=-1](M4){};
  \draw (3.8,4) node[pmos](M3){};
  \coordinate (h1) at (0,1.1);
  \coordinate (h2) at (0,2.9);
  \draw (M1.G) -- (M2.G);
  \draw (M4.G) -- (M3.G);
  \draw (M1.S) node[ground]{};
  \draw (M2.S) to[R,l=$R_S$] ++(0,-1.4) node[ground]{};
  \draw (M4.S) -- ++(0,0.3) coordinate(T1);
  \draw (M3.S) -- ++(0,0.3) coordinate(T2);
  \draw (T1) -- (T2);
  \draw (1.9,0 |- T1) node[vcc]{$V_{DD}$};
  \draw (M4.D) -- (M1.D);
  \draw (M3.D) -- (M2.D);
  \draw (M1.D |- h1) coordinate(X) node[circ]{} node[left]{$X$} -- (1.0,1.1) -- (1.0,0) node[circ]{};
  \draw (M3.D |- h2) coordinate(Y) node[circ]{} node[right]{$Y$} -- (2.8,2.9) node[circ]{} -- (2.8,4) node[circ]{};
  \node[left,font=\scriptsize] at (-0.9,0) {$M_1$, $(W/L)_N$};
  \node[right,font=\scriptsize] at (4.7,0) {$M_2$, $K(W/L)_N$};
  \node[left,font=\scriptsize] at (-0.9,4) {$M_4$};
  \node[right,font=\scriptsize] at (4.7,4) {$M_3$};
  \draw[->] (-0.3,2.4) -- (-0.3,1.9) node[left,font=\scriptsize] {$I_{REF}$};
  \draw[->] (4.1,1.9) -- (4.1,1.4) node[right,font=\scriptsize] {$I_{out}$};
  \begin{scope}[blue!70!black]
    \draw (1.9,2.0) node[nmos](M5){};
    \draw (M5.D) |- (2.8,2.9);
    \draw (M5.G) -- ++(-0.25,0) |- (M5.D |- h2);
    \draw (M5.S) |- (1.0,1.1);
    \node[right,font=\scriptsize,align=left] at (2.0,2.0) {$M_5$\\start-up};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{I_{out} = \frac{2}{\mu_nC_{ox}(W/L)_N}\cdot\frac{1}{R_S^2}\left(1-\frac{1}{\sqrt K}\right)^2}
$$

- The PMOS pair forces $I_{out} = I_{REF}$; the NMOS pair with $R_S$ forces $V_{GS1} = V_{GS2} + I_{out}R_S$. Two constraints, one current.
- Without $R_S$ the loop only says $I_{out} = KI_{REF}$ and can carry **any** current.
- $V_{DD}$ does not appear. Process and temperature still do (through $\mu_nC_{ox}$ and $R_S$); the next levels deal with those.
- Use **long channels** everywhere: lower $\lambda$ (less supply sensitivity) and lower flicker noise.

> [!note]- Derivation: the current (Razavi Eqs. 12.2–12.4)
> Square law, $\lambda=0$, equal thresholds:
> $$\sqrt{\frac{2I_{out}}{\mu_nC_{ox}(W/L)_N}} + V_{TH1} = \sqrt{\frac{2I_{out}}{\mu_nC_{ox}K(W/L)_N}} + V_{TH2} + I_{out}R_S$$
> With $V_{TH1}=V_{TH2}$: $\sqrt{\frac{2I_{out}}{\mu_nC_{ox}(W/L)_N}}\left(1-\frac1{\sqrt K}\right) = I_{out}R_S$. Dividing by $\sqrt{I_{out}}$ and squaring gives the boxed result. That division silently assumed $I_{out}\neq0$: the zero-current solution is still there (see [[#Start-Up]]).

> [!note]- Detail: body effect, and where $R_S$ should go (Razavi Fig. 12.3(b))
> $M_2$'s source sits $I_{out}R_S$ above ground, so its $V_{TH}$ rises ([[MosFETs#Body Effect]]) and $V_{TH1}=V_{TH2}$ is wrong. Fix: put the resistor in the source of a **PMOS** and tie that PMOS's bulk to its source (each PMOS has its own n-well). The NMOS pair then has equal sources and the PMOS pair has no body effect.

### What Limits It

$$
\boxed{\frac{\Delta I_{out}}{\Delta V_{DD}} = \frac{1}{r_{O4}}\left[\frac{1}{G_{m2}(r_{O4}\,\|\,R_1)} - g_{m4}R_3\right]^{-1}}
$$

with $R_1 = r_{O1}\|(1/g_{m1})$, $R_3 = r_{O3}\|(1/g_{m3})$ and $G_{m2}$ the degenerated transconductance of $M_2$ with $R_S$ (Razavi Ex. 12.1). It vanishes when $r_{O4}\to\infty$.

- Residual supply sensitivity comes from **finite $r_O$**. Cascode the mirrors, or run the core from a local regulated supply ([[#Supply Rejection Case Study]]).
- At high frequency capacitive paths add more supply coupling.

> [!tip] Remark
> $G_{m2} = \dfrac{g_{m2}r_{O2}}{R_S + r_{O2} + (g_{m2}+g_{mb2})R_Sr_{O2}}$ is the degenerated CS transconductance from [[Single-Stage]].

### Start-Up

```tikz title="The loop has two equilibria. Without start-up the current can stay at zero (the degenerate point); with M5 it jumps to the designed value once V_DD clears the start-up threshold. After Razavi Fig. 12.5(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.2,0) node[right] {$V_{DD}$};
  \draw[->] (0,0) -- (0,3.4) node[above] {$I_{D2}$};
  \draw[thick] (0,0) -- (2.0,0) -- (2.4,2.3) -- (5.8,2.55);
  \draw[thick,dashed] (2.0,0.06) -- (5.8,0.06);
  \node[font=\scriptsize,anchor=north] at (4.1,-0.05) {degenerate point (no start-up)};
  \node[font=\scriptsize,anchor=south] at (4.1,2.6) {designed current};
  \draw[dotted] (2.0,0) -- (2.0,2.8);
  \node[font=\scriptsize,align=center] at (1.0,2.9) {$V_{TH1}+V_{TH5}$\\$+|V_{TH3}|$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{TH1}+V_{TH5}+|V_{TH3}| \;<\; V_{DD} \;<\; V_{GS1}+V_{TH5}+|V_{GS3}|}
$$

Every self-biased loop is also stable at **zero current**: all devices off, nothing to turn them on. The start-up device must (left inequality) be able to conduct a path $V_{DD}\to M_3\to M_5\to M_1\to$ ground at turn-on, and (right inequality) turn itself off once the loop runs, so it doesn't disturb the operating point.

- The window is only $V_{OV1}+|V_{OV3}|$ wide. Wider supply ranges need a start-up that senses the loop current and disconnects (e.g. Carusone Fig. 7.8).
- **Verify in simulation two ways:** a DC sweep ramping $V_{DD}$ from zero (so parasitic capacitances can't fake a start-up) and a transient ramp, checking every supply value. Complex circuits can have more than one degenerate point.

> [!note]- Detail: why the right-hand inequality (Zettelkasten 10d1)
> Once running, $X$ sits at $V_{GS1}$ and $Y$ at $V_{DD}-|V_{GS3}|$, so $M_5$ sees $V_{DD}-|V_{GS3}|-V_{GS1}$. A diode-connected $M_5$ is off when this is below $V_{TH5}$. Example: $V_{TH1}=V_{TH5}=0.5$ V, $|V_{TH3}|=0.6$ V, $V_{OV1}=0.1$ V, $|V_{OV3}|=0.2$ V gives a working window of only $1.6<V_{DD}<1.9$ V.

> [!note]- Detail: Carusone's start-up (Fig. 7.8)
> A small always-on device $Q_8$ pulls the gates of injector devices $Q_{10,11}$ low when the loop is dead, so they inject current. Once the loop runs, a sensing device $Q_9$ sources all of $Q_8$'s current, pulls those gates high and turns the injectors off. $Q_8$ is sometimes replaced by a well resistor. The full bias cell then has four loops: the main positive-feedback loop, the start-up loop (disabled after start), and two low-gain cascode-bias loops.

## Level 2: The First-Order Bandgap

To get zero TC, add two quantities with opposite TCs: $V_{REF} = \alpha_1V_1+\alpha_2V_2$ with $\alpha_1\,\partial V_1/\partial T + \alpha_2\,\partial V_2/\partial T = 0$. Bipolar junctions supply both, more reproducibly than any MOS parameter.

### Negative TC: the Base-Emitter Voltage

$\partial V_{BE}/\partial T = [V_{BE}-(4+m)V_T-E_g/q]/T\approx-1.5$ mV/K at constant $I_C$ ($V_{BE}\approx750$ mV, 300 K; Carusone quotes about −2 mV/K).

> [!tip] Remark
> Derived in [[BJTs#V_BE vs Temperature]] (Razavi Eqs. 12.8–12.13), with $m\approx-3/2$, $E_g\approx1.12$ eV. For the bandgap, two facts matter: the TC depends on $V_{BE}$ itself, and it **changes with $T$**, which is the origin of [[#Curvature|curvature]].

### Positive TC: the Difference of Two Base-Emitter Voltages

```tikz title="Two junctions at different current densities. Q2 is m unit devices in parallel and carries 1/n of Q1's current, so the densities differ by nm. After Razavi Figs. 12.6 and 12.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,0) node[npn](Q1){};
  \draw (3,0) node[npn](Q2){};
  \draw (Q1.E) node[ground]{};
  \draw (Q2.E) node[ground]{};
  \draw (Q1.C) -- ++(0,0.4) coordinate(C1) to[I,l_=$nI_0$,invert] ++(0,1.8) node[vcc]{$V_{DD}$};
  \draw (Q2.C) -- ++(0,0.4) coordinate(C2) to[I,l=$I_0$,invert] ++(0,1.8) node[vcc]{$V_{DD}$};
  \draw (Q1.B) -| ++(-0.3,1.1) -| (C1);
  \draw (Q2.B) -| ++(-0.3,1.1) -| (C2);
  \node[below,font=\scriptsize] at (0.2,-1.3) {$Q_1$: $I_S$};
  \node[below,font=\scriptsize] at (3.2,-1.3) {$Q_2$: $mI_S$};
  \draw (C1) node[circ]{} node[right,font=\scriptsize] {$V_{BE1}$};
  \draw (C2) node[circ]{} node[right,font=\scriptsize] {$V_{BE2}$};
  \node[font=\scriptsize] at (1.7,-2.1) {$\Delta V_{BE}=V_{BE1}-V_{BE2}$};
\end{circuitikz}
\end{document}
```

$\Delta V_{BE} = V_T\ln(nm)$, so $\partial\,\Delta V_{BE}/\partial T = (k/q)\ln(nm)$ with $k/q = 0.087$ mV/K: PTAT, with no process parameter.

> [!tip] Remark
> Why only the density ratio survives is in [[BJTs#Delta V_BE Is PTAT]]; how to lay out the $1{:}n$ pair is [[BJTs#Ratioed Pairs and Quads]].

- Carusone Ex. 7.3: a 10:1 density ratio at 300 K gives $\Delta V_{BE} = 59.5$ mV and $+0.198$ mV/K.
- Canceling −1.5 mV/K directly would need $\ln n = 17.2$, i.e. $n\approx3\times10^7$ (Razavi Ex. 12.2). So the circuit must **amplify** $\Delta V_{BE}$ instead.

> [!tip] Remark
> Why bipolars and not MOS in weak inversion? The MOS exponential is $e^{V_{GS}/(nV_T)}$, with the process-dependent slope factor $n$ from [[MosFETs#Subthreshold Conduction]], which would put a process number in front of $k/q$ (Zettelkasten 10f1).

### Weighting the Two

$$
\boxed{V_{REF}\approx V_{BE}+17.2\,V_T\approx1.25\ \text{V}}
$$

Set $\alpha_1 = 1$ and choose $\alpha_2\ln n$ so that $(\alpha_2\ln n)(0.087\ \text{mV/K}) = 1.5$ mV/K. The weight 17.2 is a pure number, which a circuit can make from ratios.

### The Kuijk Cell

```tikz title="Kuijk bandgap cell in CMOS. The op amp forces V_X = V_Y; R1 = R2 so both branches carry the same current; Q2 is n units. After Razavi Figs. 12.9 and 12.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,5) -- (7.4,5);
  \draw (0,5) to[R,l_=$R_1$] (0,3.4) -- (0,1.9) coordinate(X) -- (0,1.4) coordinate(E1);
  \draw (2.6,5) to[R,l_=$R_2$] (2.6,3.6) coordinate(Y) to[R,l_=$R_3$] (2.6,2.2) -- (2.6,1.4) coordinate(E2);
  \draw (E1) node[pnp,anchor=E](Q1){};
  \draw (E2) node[pnp,anchor=E](Q2){};
  \draw (Q1.B) -- ++(-0.2,0) |- (Q1.C);
  \draw (Q1.C) node[ground]{};
  \draw (Q2.B) -- ++(-0.2,0) |- (Q2.C);
  \draw (Q2.C) node[ground]{};
  \node[right,font=\scriptsize] at (0.15,0.45) {$Q_1$: $A$};
  \node[right,font=\scriptsize] at (2.75,0.45) {$Q_2$: $nA$};
  \draw (5.4,2.75) node[op amp](A){};
  \draw (Y) node[circ]{} node[left]{$Y$} -- (3.9,3.6) |- (A.-);
  \draw (X) node[circ]{} node[left]{$X$} -- (3.6,1.9) |- (A.+);
  \draw (A.out) -- (7.4,2.75) node[circ]{} -- (8.0,2.75) node[right]{$V_{out}$};
  \draw (7.4,2.75) -- (7.4,5);
  \node[font=\scriptsize] at (5.4,3.65) {$A_1$};
  \node[font=\scriptsize,anchor=west] at (2.85,2.95) {$V_T\ln n$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = V_{BE2} + \left(1+\frac{R_2}{R_3}\right)V_T\ln n,\qquad \text{zero TC: }\left(1+\frac{R_2}{R_3}\right)\ln n\approx17.2}
$$

How it works, in three moves:
1. The op amp forces $V_X = V_Y$, so $V_{BE1} = V_{BE2} + I R_3$: the drop across $R_3$ is $\Delta V_{BE} = V_T\ln n$, and the branch current is $V_T\ln n/R_3$ (**PTAT**).
2. That current also flows through $R_2$, so the drop across $R_2+R_3$ is $\Delta V_{BE}$ amplified by $1+R_2/R_3$.
3. The output is taken at the **op amp output**, not at $Y$: $V_{out} = V_{BE2}$ plus the amplified PTAT term.

- Example: $n=31$, $R_2/R_3=4$ gives $5\ln31\approx17.2$.
- Only a resistor **ratio** appears, so the resistor TC cancels (to first order).
- The op amp drives two resistive branches, so it needs a low output impedance.

> [!note]- Detail: the same output written from the other branch (Razavi Ex. 12.4)
> From the left branch, $V_{out} = V_{BE1} + (V_T\ln n)R_1/R_3$, which looks like a smaller PTAT term. No contradiction: $V_{BE1} = V_{BE2}+V_T\ln n$ runs at higher density, so its TC is $\partial V_{BE2}/\partial T + (k/q)\ln n$. Adding $(k/q)\ln n\cdot R_1/R_3$ gives the same $(k/q)\ln n\,(1+R_1/R_3)$, consistent with $R_1=R_2$.

> [!note]- Detail: Carusone's version with equal-size transistors (Fig. 7.13(a), Ex. 7.5)
> Make $Q_1$, $Q_2$ the same size and get the density ratio from the resistors instead: the op amp puts the same voltage across $R_1$ and $R_3$, so $J_1/J_2 = R_3/R_1$, and
> $$V_{ref} = V_{EB1} + \frac{R_3}{R_2}\frac{kT}{q}\ln\frac{R_3}{R_1},\qquad K = \frac{R_3}{R_2}$$
> (Here $R_2$ carries $\Delta V_{EB}$ and $R_1$, $R_3$ are the two top resistors.) With $I_1 = 80\ \mu$A, $I_2 = 8\ \mu$A, $V_{EB1,0} = 0.65$ V at 300 K: $V_{R1} = 1.24-0.65 = 0.59$ V, $R_3 = 0.59/8\,\mu = 73.8$ kΩ, $R_1 = 7.38$ kΩ, $K = 0.59/(0.0258\ln10) = 9.93$, $R_2 = R_3/K = 7.43$ kΩ. $\Delta V_{EB} = 59$ mV, a gain of about 10 to cancel the TC.

> [!note]- Detail: the bipolar ancestor, the Brokaw cell (Carusone Figs. 7.10–7.11)
> In a bipolar process, $Q_1$ has 8× the emitter area of $Q_2$, equal collector loads ($R_3=R_4$) and an amplifier forcing equal collector voltages. Then $V_{ref} = V_{BE2} + \frac{2R_1}{R_2}\Delta V_{BE}$, so $K = 2R_1/R_2$; with $V_{BE2,0}=0.65$ V, $R_1/R_2 = 5.5$. All currents are $\Delta V_{BE}/R_2$, PTAT. A divider $R_4,R_5$ in the feedback scales the output to $(1+R_4/R_5)\times1.24$ V, with $R_3 = (R_2/R_1)(R_4\|R_5)$ to cancel base current. In production one resistor is **trimmed** at wafer test while monitoring $V_{ref}$.

### Why "Bandgap"

$$
\boxed{V_{REF}\big|_{\text{zero TC}} = \frac{E_g}{q}+(4+m)V_T}
\qquad
\boxed{V_{ref,0} = V_{G0}+(m'-1)\frac{kT_0}{q}\approx1.24\ \text{V}}
$$

Razavi's form (left) assumes constant collector current; Carusone's (right, $V_{G0}\approx1.206$ V the bandgap extrapolated to 0 K, $m'\approx2.3$) assumes PTAT collector current, which is what the cell actually does. As $T\to0$, $V_{REF}\to E_g/q$.

> [!tip] Remark
> The two books' $m$ are **different symbols**. Razavi's $m\approx-3/2$ is the mobility exponent, so $4+m = 2.5$. Carusone's $m\approx2.3$ is a lumped $I_S$ temperature constant in his $V_{BE}(T)$ model. Both land at 1.24 to 1.25 V.

- The zero-TC output is set by physics, independent of the current densities chosen: a larger density just means a smaller $K$.
- Precision parts hit it by **trimming**; the best target value is often found empirically on prototypes (Carusone).

> [!note]- Derivation: setting the TC to zero (Razavi Eqs. 12.45–12.48, Ex. 12.6)
> $V_{REF} = V_{BE}+V_T\ln n$, so $\partial V_{REF}/\partial T = \partial V_{BE}/\partial T + (V_T/T)\ln n = 0$. Substituting the $V_{BE}$ TC: $V_{BE}-(4+m)V_T-E_g/q = -V_T\ln n$, i.e. $V_{BE}+V_T\ln n = E_g/q+(4+m)V_T$.
> As $T\to0$ at constant $I_C$: $V_{BE} = V_T[\ln I_C - \ln b - (4+m)\ln T] + E_g/q\to E_g/q$.

> [!note]- Derivation: Carusone's fundamental equation (Eqs. 7.14, 7.20–7.25)
> $$V_{BE} = V_{G0}\left(1-\frac T{T_0}\right)+V_{BE0}\frac T{T_0}+\frac{m'kT}{q}\ln\frac{T_0}{T}+\frac{kT}{q}\ln\frac{J_C}{J_{C0}}$$
> With PTAT densities ($J_i/J_{i0} = T/T_0$) and $V_{ref} = V_{BE2}+K\Delta V_{BE}$:
> $$V_{ref} = V_{G0}+\frac T{T_0}(V_{BE0,2}-V_{G0})+(m'-1)\frac{kT}q\ln\frac{T_0}T+K\frac{kT}q\ln\frac{J_2}{J_1}$$
> Setting $\partial V_{ref}/\partial T=0$ at $T_0$ gives $V_{ref,0} = V_{G0}+(m'-1)kT_0/q$ and
> $$K = \frac{V_{G0}+(m'-1)kT_0/q - V_{BE0,2}}{(kT_0/q)\ln(J_2/J_1)} = \frac{1.24-V_{BE0,2}}{0.0258\ln(J_2/J_1)}\ \text{at 300 K}$$

### The Bipolar in a CMOS Process

The only bipolar in a plain n-well CMOS process is the vertical **substrate pnp** (p+ emitter, n-well base, p-substrate collector), so its **collector is always at ground** (in a p-well process it is an npn with collector at $V_{DD}$).

> [!tip] Remark
> Cross-section, layout rules, base resistance and low $\beta$: [[BJTs#Substrate PNP in CMOS]]. Unit-emitter arrays for the $1{:}n$ device: [[BJTs#Ratioed Pairs and Quads]].

What that means for the bandgap:
- Each junction must hang from a resistor to ground, as in the Kuijk cell above. A junction whose lower terminal isn't ground (series stacks, gain stages) can't be drawn directly.
- Keep collector currents below about 0.1 mA (base resistance, Carusone), and treat base current as an error (low $\beta$, Razavi).

## Level 3: Second-Order Errors of the Bandgap Cell

### PTAT Collector Current

$$
\boxed{\frac{\partial V_{BE}}{\partial T}\bigg|_{I_C\propto T} = \frac{V_{BE}-(3+m)V_T-E_g/q}{T}}
$$

In the Kuijk cell $I_C = V_T\ln n/R_3$ is PTAT, not constant. The extra $\partial I_C/\partial T = I_C/T$ adds $+V_T/T$, so the TC is **slightly less negative** than −1.5 mV/K and the needed weight shifts. In practice, simulate.

> [!note]- Derivation (Razavi Eqs. 12.29–12.31)
> $$\frac{\partial V_{BE}}{\partial T} = \frac{\partial V_T}{\partial T}\ln\frac{I_C}{I_S}+V_T\left(\frac1{I_C}\frac{\partial I_C}{\partial T}-\frac1{I_S}\frac{\partial I_S}{\partial T}\right)$$
> With $\frac1{I_C}\frac{\partial I_C}{\partial T}=\frac1T$, the $(4+m)$ of the constant-current case becomes $(3+m)$.

### Op-Amp Offset

$$
\boxed{V_{out} = V_{BE2}+\left(1+\frac{R_2}{R_3}\right)\left(V_T\ln n - V_{OS}\right)}
$$

> [!important] The bandgap is an offset problem
> The op-amp offset sits right next to $\Delta V_{BE}$ and gets amplified by the same $1+R_2/R_3\approx5$ to 10. Worse, $V_{OS}$ drifts with temperature, so it also adds TC. Carusone (citing Song 1983): a 1 mV temperature-independent offset alone causes about **26 ppm/°C** of TC error.

> [!tip] Remark
> $V_{OS}$ comes from mismatch, which is why the op amp uses large devices ([[Nonlinearity and Mismatch]], [[Device Matching]]).

Fixes, each buying accuracy with something:

| Fix | Effect | Cost |
|---|---|---|
| Large, carefully laid-out op-amp devices | smaller $V_{OS}$ | area |
| Ratio the collector currents by $m$ too | $\Delta V_{BE} = V_T\ln(mn)$ grows, $V_{OS}$ doesn't | larger resistor ratio |
| Two junctions in series per branch | $2V_T\ln(mn)$ vs one $V_{OS}$ | $V_{out}\approx2.5$ V, headroom |
| Offset-cancelled SC amplifier (Carusone Fig. 7.14) | removes $V_{OS}$ | clocks, SC complexity |

$$
\boxed{\text{Stacked: } V_{out} = 2V_{BE}+\left(1+\frac{R_2}{R_3}\right)\left[2V_T\ln(mn)-V_{OS}\right]}
$$

> [!note]- Derivation: exact small-signal offset gain (Razavi Ex. 12.5)
> Replace each diode by $1/g_m$. With $V_X - V_{OS} = V_Y$ and $R_1=R_2$:
> $$\frac{V_{out}}{V_{OS}} = -\left[1+\frac1{g_mR_2}+\frac{(1/g_m+R_2)^2}{R_2R_3}\right]\xrightarrow{g_mR_2\gg1}-\left(1+\frac{R_2}{R_3}\right)$$
> The small extra term comes from $V_{OS}$ also unbalancing the two currents: $I_{C1} = I_{C2}+V_{OS}/R_2$, which costs another $V_T\ln(1+V_{OS}/(R_2I_{C2}))\approx V_{OS}/(g_mR_2)$. Total: $-[1+1/(g_mR_2)](1+R_2/R_3)V_{OS}$.

> [!note]- Detail: stacking junctions in CMOS (Razavi Figs. 12.13–12.15)
> Two diodes in series need the lower one's collector off ground, impossible with a substrate pnp. Turn the upper junction into an **emitter follower** (collector to ground, base driven by the lower emitter) and bias each emitter with a **PMOS current source**, not a resistor, so both junctions' currents have the same TC. The op amp then drives only PMOS gates (no resistive load), but PMOS mismatch and $\lambda$ now enter the output, and the low native-pnp $\beta$ means the followers' base currents disturb the lower emitter currents, so base-current cancellation may be needed.

### Feedback Polarity

$$
\boxed{\beta_N = \frac{1/g_{m2}+R_3}{1/g_{m2}+R_3+R_2}\ >\ \beta_P = \frac{1/g_{m1}}{1/g_{m1}+R_1},\quad\text{preferably }\beta_P\approx\tfrac12\beta_N}
$$

The op amp output feeds back to **both** inputs: through $R_2,R_3,Q_2$ to the inverting input (negative feedback) and through $R_1,Q_1$ to the non-inverting input (positive feedback). The net loop is negative only if $\beta_N>\beta_P$; a factor of about two keeps the transient well behaved with large capacitive loads.

> [!tip] Remark
> Same caution as in [[Feedback]]: don't infer the loop sign from the op-amp symbol alone; compute both paths. The constant-$g_m$ loop of [[Biasing]] is also a positive-feedback loop that must have loop gain below one.

### Supply Rejection and Start-Up of the Cell

- DC supply rejection is good if the op-amp gain is high; at high frequency it degrades with the op amp's own PSRR, so precision references often **regulate the core's supply** ([[#Supply Rejection Case Study]]).
- If $V_X = V_Y = 0$ the op-amp input pair can be off and the cell can stay dead: add start-up as in [[#Start-Up]].

### Curvature

```tikz title="V_REF has zero TC at only one temperature T0 and droops on either side (curvature). Across samples, offset and process move T0 randomly, which defeats fixed curvature correction in CMOS. After Razavi Figs. 12.16 and 12.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right] {$T$};
  \draw[->] (0,0) -- (0,3.4) node[above] {$V_{REF}$};
  \draw[thick,domain=0.4:6.6,samples=40] plot (\x,{2.8-0.12*(\x-3.4)^2});
  \draw[thick,dashed,domain=0.4:6.6,samples=40] plot (\x,{2.6-0.12*(\x-2.2)^2});
  \draw[thick,dotted,domain=0.4:6.6,samples=40] plot (\x,{2.7-0.12*(\x-4.8)^2});
  \draw[dotted] (3.4,0) -- (3.4,2.8);
  \node[below] at (3.4,0) {$T_0$};
  \node[font=\scriptsize,anchor=west] at (4.6,3.1) {three samples, three $T_0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\partial V_{ref}}{\partial T} = (m'-1)\frac kq\ln\frac{T_0}{T}}
\qquad
\boxed{V_{ref} = V_{G0}+(m'-1)\frac{kT}{q}\left(1+\ln\frac{T_0}{T}\right)}
$$

Even an ideal cell is flat only at $T_0$: the TC is positive below and negative above, an $\cap$ shape. Sources: the temperature dependence of $V_{BE}$'s own TC, of the collector currents, and of the offset.

- Carusone Ex. 7.4: designed flat at 20 °C, at 0 °C the TC is 8 µV/K, i.e. 6.5 ppm/K of 1.24 V. Real references are typically **4 to 10× worse** than this ideal.
- With curvature plus the small TC of $V_{G0}$ itself, the best achievable TC is about 25 ppm/K without second-order correction (Carusone).
- **Resistor TC:** well resistors go as $R\propto T^\eta$ with $\eta\approx2.2$. Compensate by aiming slightly higher:

$$
\boxed{V_{ref,0} = V_{G0}+(m'+\eta-1)\frac{kT_0}{q}}
$$

- **Curvature correction** (extra bias branches) is common in bipolar references but seldom used in CMOS: large offsets and process spread scatter $T_0$ from sample to sample, so a fixed correction can't be aimed. In CMOS it generally requires **trimming** (Razavi Secs. 12.3.3, 12.7).

> [!note]- Derivation: where the curvature lives and how far $T_0$ wanders (Zettelkasten 10g1, from Razavi's $I_S$ model)
> Expand $V_{REF} = V_{BE}+KV_T$ with $I_S = bT^{4+m}e^{-E_g/kT}$ (constant $I_C$):
> $$V_{REF}(T) = \frac{E_g}{q}+\frac kq T\left[\ln\frac{I_C}{b}+K\right]-(4+m)\frac kq T\ln T$$
> A constant plus a straight line can't cancel the $T\ln T$ term; it is the curvature. Second derivative: $-(4+m)(k/q)/T = -2.5\times0.0862\ \text{mV/K}/300\ \text{K}\approx-0.72\ \mu$V/K². Over $\pm50$ K around $T_0$ the droop is $\frac12(0.72\ \mu)(50^2)\approx0.9$ mV.
>
> The flat point satisfies $\ln T_0 = \frac{\ln(I_C/b)+K}{4+m}-1$, so $\frac{\Delta T_0}{T_0} = \frac{\Delta K+\Delta\ln I_C}{4+m}$. An offset changes the weight by $\Delta K = -(1+R_2/R_3)V_{OS}/V_T$: with $R_2/R_3 = 4$ and $V_{OS}=1$ mV, $\Delta T_0/T_0 = -5/(2.5\times25.9)\approx-7.7\%$, about −23 K. That is why a fixed corrector misses.

## Level 4: Current-Mode, Constant-gm and Low-Voltage References

### PTAT Current, and a Bandgap From It

```tikz title="PTAT current generator (M3, M4, op amp, Q1, Q2, R1) with a third branch that adds a PTAT drop I R2 to a junction, giving a bandgap voltage. All PMOS identical. After Razavi Figs. 12.18 and 12.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,4.2) node[pmos](M3){};
  \draw (3,4.2) node[pmos](M4){};
  \draw (6,4.2) node[pmos](M5){};
  \draw (M3.S) -- (0,5.6) -- (6,5.6) -- (M5.S);
  \draw (M4.S) -- (3,5.6);
  \draw (1.5,5.6) node[vcc]{$V_{DD}$};
  \draw (M3.G) -- ++(0,1.0) coordinate(gl) -- (M5.G |- gl) -- (M5.G);
  \draw (M4.G) -- (M4.G |- gl) node[circ]{};
  \draw (M3.D) -- (0,1.0) coordinate(E1);
  \draw (0,1.9) coordinate(X) node[circ]{} node[above left]{$X$};
  \draw (M4.D) -- (3,1.9) coordinate(Y) to[R,l_=$R_1$] (3,1.0) coordinate(E2);
  \draw (Y) node[circ]{} node[above right]{$Y$};
  \draw (1.5,2.9) node[op amp,rotate=90,scale=0.6](A){};
  \draw (X) -| (A.-);
  \draw (Y) -| (A.+);
  \draw (A.out) -- (A.out |- gl) node[circ]{};
  \node[font=\scriptsize] at (1.95,3.35) {$A_1$};
  \path (A.-) ++(-0.15,-0.2) node[font=\scriptsize] {$-$};
  \path (A.+) ++(0.15,-0.2) node[font=\scriptsize] {$+$};
  \draw (M5.D) -- (6,1.9) coordinate(O) to[R,l_=$R_2$] (6,1.0) coordinate(E3);
  \draw (O) node[circ]{} -- (6.8,1.9) node[right]{$V_{REF}$};
  \draw (E1) node[pnp,anchor=E](Q1){};
  \draw (Q1.B) -- ++(-0.2,0) |- (Q1.C);
  \draw (Q1.C) node[ground]{};
  \draw (E2) node[pnp,anchor=E](Q2){};
  \draw (Q2.B) -- ++(-0.2,0) |- (Q2.C);
  \draw (Q2.C) node[ground]{};
  \draw (E3) node[pnp,anchor=E](Q3){};
  \draw (Q3.B) -- ++(-0.2,0) |- (Q3.C);
  \draw (Q3.C) node[ground]{};
  \node[right,font=\scriptsize] at (0.15,0.1) {$Q_1$: $A$};
  \node[right,font=\scriptsize] at (3.15,0.1) {$Q_2$: $nA$};
  \node[right,font=\scriptsize] at (6.15,0.1) {$Q_3$};
  \node[right,font=\scriptsize] at (0.1,4.2) {$M_3$};
  \node[right,font=\scriptsize] at (3.1,4.2) {$M_4$};
  \node[right,font=\scriptsize] at (6.1,4.2) {$M_5$};
\end{circuitikz}
\end{document}
```

$$
\boxed{I_{PTAT} = \frac{V_T\ln n}{R_1}}
\qquad
\boxed{V_{REF} = |V_{BE3}|+\frac{R_2}{R_1}V_T\ln n}
$$

- The op amp forces $V_X = V_Y$ through the PMOS mirror, so $R_1$ carries $\Delta V_{BE}$; the current is PTAT (if $R_1$ has zero TC).
- Copy it into a third branch through $R_2$ and a junction: a bandgap. $Q_3$'s size is free as long as the two terms cancel. PMOS mismatch now enters $V_{REF}$.
- The same core without an op amp (the self-biased loop of [[#The Self-Biased Loop]] with bipolars, Razavi Fig. 12.19) also works, but the op-amp version is preferred at low voltage and gives higher supply rejection with a good op amp.
- Real PTAT accuracy is limited by mismatch and, more importantly, by the TC of $R_1$.

> [!tip] Remark
> Bipolar circuits like PTAT bias because $g_m = I_C/V_T$ is then constant over temperature (constant speed). The cost: power rises at high temperature, making heat harder to remove (Carusone Sec. 7.3.2).

### Constant-gm Biasing

$$
\boxed{g_{m1} = \frac{2}{R_S}\left(1-\frac{1}{\sqrt K}\right)\ \xrightarrow{K=4}\ \frac1{R_S}}
$$

The [[#The Self-Biased Loop|self-biased loop]] already does it: plug its current into $g_m = \sqrt{2\mu_nC_{ox}(W/L)I_D}$ and $\mu_nC_{ox}$ cancels. Only $R_S$ and a size ratio remain.

> [!tip] Remark
> See [[Biasing#Level 3 Supply-Independent and Constant-gm Bias]] for the circuit-level view. This is the reason a bias generator is built around one good resistor.

- Every NMOS biased from the loop tracks: $g_{mi} = \sqrt{\frac{(W/L)_iI_{Di}}{(W/L)_1I_{D1}}}\,g_{m1}$. PMOS devices pick up a factor $\sqrt{\mu_p/\mu_n}$ that varies chip to chip and slightly with temperature (Carusone Eqs. 7.10–7.11).
- Cost of holding $g_m$: since $\mu\propto T^{-3/2}$, keeping $g_m$ from 300 K to 373 K needs $V_{eff}$ about **27% higher**, eating swing. Keep room-temperature $V_{eff}$ modest (Carusone: 0.2 to 0.25 V). On-chip resistors with positive TC partly offset this.
- $R_S$ itself has a TC and a process spread. The TC can be cancelled with bandgap/PTAT techniques, the spread can't.
- The loop is a **positive-feedback** loop; it is stable only if $R_S$ is large enough. Parasitic capacitance across $R_S$ (worst if $R_S$ is off-chip: pad + board) lowers its impedance at high frequency and can make it oscillate, so keep at least part of $R_S$ on-chip (Carusone).
- Carusone's improved cell (Fig. 7.7) puts the resistor on a PMOS with source tied to body (no body effect) and adds an op amp to equalize drain voltages (less $r_o$ error, less positive-feedback gain), compensated by $C_C$. Fig. 7.8 adds wide-swing cascode bias outputs.

> [!note]- Detail: a switched-capacitor $R_S$ (Razavi Figs. 12.21–12.22)
> If an accurate clock exists, replace $R_S$ by a capacitor $C_S$ switched at $f_{CK}$: average resistance $(C_Sf_{CK})^{-1}$, with $C_B$ to filter the switching. Absolute capacitance is better controlled than absolute resistance and has a much smaller TC, so $g_m$ becomes more reproducible. The same trick gives an accurate voltage-to-current converter: $I_{REF} = V_{REF}C_Sf_{CK}$. See [[Switched-Capacitor Circuits]].

### Low-Voltage Bandgap (Banba)

```tikz title="Banba sub-1-V bandgap: R3 and R2 (equal) add a CTAT current V_BE1/R2 to the PTAT current through R1; M5 copies the sum into R4. No node exceeds about one V_BE. After Razavi Fig. 12.32(c) and Carusone Fig. 7.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,4.2) node[pmos](M3){};
  \draw (3,4.2) node[pmos](M4){};
  \draw (7,4.2) node[pmos](M5){};
  \draw (M3.S) -- (0,5.6) -- (7,5.6) -- (M5.S);
  \draw (M4.S) -- (3,5.6);
  \draw (1.5,5.6) node[vcc]{$V_{DD}$};
  \draw (M3.G) -- ++(0,1.0) coordinate(gl) -- (M5.G |- gl) -- (M5.G);
  \draw (M4.G) -- (M4.G |- gl) node[circ]{};
  \draw (M3.D) -- (0,1.0) coordinate(E1);
  \draw (0,1.9) coordinate(X) node[circ]{} node[above left]{$X$};
  \draw (M4.D) -- (3,1.9) coordinate(Y) to[R,l_=$R_1$] (3,1.0) coordinate(E2);
  \draw (Y) node[circ]{} node[above right]{$Y$};
  \draw (1.5,2.9) node[op amp,rotate=90,scale=0.6](A){};
  \draw (X) -| (A.-);
  \draw (Y) -| (A.+);
  \draw (A.out) -- (A.out |- gl) node[circ]{};
  \node[font=\scriptsize] at (1.95,3.35) {$A_1$};
  \path (A.-) ++(-0.15,-0.2) node[font=\scriptsize] {$-$};
  \path (A.+) ++(0.15,-0.2) node[font=\scriptsize] {$+$};
  \draw (X) -- (-1.3,1.9) to[R,l_=$R_3$] (-1.3,0.0) node[ground]{};
  \draw (Y) -- (4.3,1.9) to[R,l=$R_2$] (4.3,0.0) node[ground]{};
  \draw (M5.D) -- (7,1.9) coordinate(O) to[R,l_=$R_4$] (7,0.0) node[ground]{};
  \draw (O) node[circ]{} -- (7.8,1.9) node[right]{$V_{BG}$};
  \draw (E1) node[pnp,anchor=E](Q1){};
  \draw (Q1.B) -- ++(-0.2,0) |- (Q1.C);
  \draw (Q1.C) node[ground]{};
  \draw (E2) node[pnp,anchor=E](Q2){};
  \draw (Q2.B) -- ++(-0.2,0) |- (Q2.C);
  \draw (Q2.C) node[ground]{};
  \node[right,font=\scriptsize] at (0.15,0.1) {$Q_1$: $A$};
  \node[right,font=\scriptsize] at (3.15,0.1) {$Q_2$: $nA$};
  \node[right,font=\scriptsize] at (0.1,4.2) {$M_3$};
  \node[right,font=\scriptsize] at (3.1,4.2) {$M_4$};
  \node[right,font=\scriptsize] at (7.1,4.2) {$M_5$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{BG} = \frac{R_4}{R_2}\left(|V_{BE1}|+\frac{R_2}{R_1}V_T\ln n\right),\qquad \text{zero TC: }\frac{R_2}{R_1}\ln n\approx17.2}
$$

> [!important] Sum currents, not voltages
> A series bandgap is stuck at $V_{BE}+17.2V_T\approx1.25$ V. Convert the CTAT and PTAT quantities into **currents** ($|V_{BE}|/R_2$ and $V_T\ln n/R_1$), add them at a node, and push the sum through any resistor $R_4$: the output level becomes a free choice, below 1 V.

- $R_2 = R_3$ keeps $I_{C1} = I_{C2}$ (equal resistor currents on both sides), so $R_1$ still carries a clean $V_T\ln n$.
- Minimum supply $\approx V_{BE1}+|V_{DS3}|$: with large bipolars at about 10 µA, $V_{BE}\approx0.7$ V, and wide PMOS need $|V_{DS}|\approx50$ mV, so about **0.75 V** (Razavi). Carusone reports operation down to 0.8 V.
- Offset is amplified by $R_4/(R_1\|R_2)$, i.e. $(1+R_2/R_1)$ referred to the bandgap form. Since $(R_2/R_1)\ln n$ is fixed at 17.2, the only way to shrink it is a **large $n$**.
- $R_4$ tends to be large (e.g. 50 kΩ): noisy, needs an output bypass capacitor. Copying the PMOS current up to a bigger output (say 0.5 mA) multiplies its noise by the same factor.

$$
\boxed{V_{BG} = \frac{R_4}{R_2}\left(|V_{BE1}|+\frac{R_2}{R_1}V_T\ln n\right)-\left(1+\frac{R_2}{R_1}\right)\frac{R_4}{R_2}V_{OS}}
$$

> [!note]- Derivation: Banba output and offset (Razavi Eqs. 12.66–12.73, Ex. 12.8)
> $V_X\approx V_Y\approx|V_{BE1}|$ and $I_{D3}=I_{D4}$: $I_{C1}+|V_{BE1}|/R_3 = I_{C2}+|V_{BE1}|/R_2$, so $I_{C1}=I_{C2}$ if $R_2=R_3$. Then $|V_{BE1}| = |V_{BE2}|+I_{C2}R_1$, $I_{C2} = V_T\ln n/R_1$, and $|I_{D4}| = V_T\ln n/R_1+|V_{BE1}|/R_2$. $M_5 = M_4$ copies it into $R_4$.
>
> With offset, $V_X = V_Y+V_{OS}$: $I_{C1}=I_{C2}-V_{OS}/R_2$, $I_{C2} = (V_T\ln n - V_{OS})/R_1$, and $|I_{D4}| = \frac{V_T\ln n-V_{OS}}{R_1}+\frac{|V_{BE1}|-V_{OS}}{R_2}$, so
> $$V_{BG} = \frac{R_4}{R_2}\left(|V_{BE1}|+\frac{R_2}{R_1}V_T\ln n\right)-\frac{R_4}{R_1\|R_2}V_{OS}$$
> Carusone writes the same circuit as $V_{ref} = V_{BE1}\frac{KR}{R_a}+\frac{kT}{q}\ln(MN)\frac{KR}{R_b}$, with an $M\!:\!1$ current ratio and $N$ area ratio so the densities differ by $MN$, and a $1\!:\!K$ output mirror into $R$.

> [!note]- Detail: the op amp and its start-up (Razavi Fig. 12.34)
> A five-transistor OTA is enough. Guidelines: (1) large devices for low flicker noise and offset; (2) the input pair's $V_{GS}$ plus the tail-current headroom must fit under $|V_{BE1}|$ (the inputs sit at $V_{BE}$); (3) long enough channels for a loop gain of about 5 to 10. Start-up: at power-on $V_X=V_Y=0$, the pair and the PMOS are off. With $V_{DD}<1$ V, the voltage from the OTA output node $P$ to $X$ starts positive and ends negative, so a diode-connected NMOS from $P$ to $X$ injects current only at start-up. (Alternatively an NMOS from $X$ to $V_{DD}$.)

> [!note]- Detail: a second low-voltage form, scaling with a divider (Razavi Fig. 12.35)
> Take the [[#PTAT Current, and a Bandgap From It|PTAT-plus-junction cell]] and add $R_3$ from the output to ground. Part of $I_{D5}$ now flows in $R_3$: $|I_{D5}| = V_{out}/R_3 + (V_{out}-|V_{BE3}|)/R_2$, and with $|I_{D5}| = V_T\ln n/R_1$:
> $$V_{out} = \frac{R_3}{R_2+R_3}\left(|V_{BE3}|+\frac{R_2}{R_1}V_T\ln n\right)$$
> The standard bandgap voltage scaled down by $R_3/(R_2+R_3)$.

### Reference Current From the Reference Voltage

$$
\boxed{I_{ref} = M\frac{V_{ref}}{R}}
$$

An op amp drives a PMOS gate until the PMOS current puts exactly $V_{ref}$ across $R$; mirrors copy it $M$ times (Carusone Sec. 7.3.4). The current is only as good as $R$. With an on-chip $R$ the current tracks on-chip resistors, which is exactly right if it later flows through a **matched** on-chip resistor (the voltage drop is then stable). An absolute current needs an off-chip precision resistor, or a trimmed and temperature-compensated on-chip one. See [[Biasing#Reference Current from a Reference Voltage]].

## Level 5: Living With a Real Reference

### Output Impedance vs Frequency

```tikz title="Reference output impedance: low inside the loop bandwidth, rising at 20 dB/dec from the op-amp pole omega_0, back near the open-loop R_out above the loop's crossover. After Razavi Fig. 12.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right] {$\omega$ (log)};
  \draw[->] (0,0) -- (0,3.6) node[above] {$|Z_{out}|$ (log)};
  \draw[thick] (0.2,0.6) -- (2,0.6) -- (4.6,3.0) -- (6.6,3.0);
  \draw[dotted] (2,0) -- (2,0.6);
  \draw[dotted] (4.6,0) -- (4.6,3.0);
  \draw[dotted] (0,3.0) -- (4.6,3.0);
  \node[below,font=\scriptsize] at (2,0) {$\omega_0$};
  \node[below,font=\scriptsize] at (4.6,0) {$(1+g_{mP}R_1A_0)\omega_0$};
  \node[left,font=\scriptsize] at (0,3.0) {$R_{out}$};
  \node[left,font=\scriptsize,align=right] at (0,0.6) {$\dfrac{R_{out}}{1+g_{mP}R_1A_0}$};
  \fill (4.6,2.62) circle (1.5pt) node[right,font=\scriptsize] {$R_{out}/\sqrt2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_{out}(s) = \frac{R_{out}}{1+g_{mP}R_1A_0}\cdot\frac{1+s/\omega_0}{1+s/[(1+g_{mP}R_1A_0)\omega_0]}}
$$

- Feedback divides the op amp's open-loop $R_{out}$ by the loop gain, but only up to the op-amp pole $\omega_0$. At the closed-loop pole $|Z_{out}| = R_{out}/\sqrt2$, only 30% below open loop.
- A fast disturbance on a line the reference drives (e.g. a node $N$ slammed by a fast circuit, coupling onto the PMOS gate line $P$) therefore moves the bias currents, and recovery takes as long as the op amp's settling. Blocks can **crosstalk** through a shared reference line.

> [!tip] Remark
> This is the closed-loop output impedance of a shunt-feedback loop from [[Feedback]], which only holds inside the loop bandwidth.

> [!note]- Derivation (Razavi Ex. 12.7)
> One-pole op amp $A(s) = A_0/(1+s/\omega_0)$ with output resistance $R_{out}$, each bipolar as $1/g_{mN}$, each PMOS $g_{mP}$. A test voltage $V_X$ on the PMOS gate line makes both PMOS currents $g_{mP}V_X$, so the op-amp input sees $V_{AB} = g_{mP}V_XR_1$ (the $1/g_{mN}$ terms cancel). Then $I_X = [V_X+g_{mP}R_1A(s)V_X]/R_{out}$ and $Z = R_{out}/[1+g_{mP}R_1A(s)]$, which expands to the boxed form: a zero at $\omega_0$, a pole at $(1+g_{mP}R_1A_0)\omega_0$.

### Bypass Capacitor: Height vs Width of the Glitch

```tikz title="Disturbance on the reference node P for increasing bypass capacitance C_B1 < C_B2 < C_B3: the glitch gets shallower but recovers more slowly. After Razavi Fig. 12.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right] {$t$};
  \draw[->] (0,-2.4) -- (0,0.8) node[above] {$\Delta V_P$};
  \draw[thick,domain=0:6.6,samples=60] plot (\x,{-2.0*exp(-\x/0.4)});
  \draw[thick,dashed,domain=0:6.6,samples=60] plot (\x,{-1.0*exp(-\x/0.8)});
  \draw[thick,dotted,domain=0:6.6,samples=60] plot (\x,{-0.5*exp(-\x/1.6)});
  \node[font=\scriptsize,anchor=west] at (0.15,-2.05) {$C_{B1}$};
  \node[font=\scriptsize,anchor=west] at (1.0,-0.65) {$C_{B2}$};
  \node[font=\scriptsize,anchor=west] at (3.0,-0.30) {$C_{B3}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V_P(0^+) = \Delta V_N\frac{C_c}{C_B+C_c},\qquad \int_0^\infty\Delta V_P\,dt = R_PC_c\,\Delta V_N\ \ (\text{independent of }C_B)}
$$

Instead of a fast (power-hungry) op amp, bypass the reference node to ground with a large $C_B$. Two catches:
1. The op amp must stay stable with $C_B$ on its output: use a **one-stage** op amp ([[Stability]]).
2. $C_B$ slows the loop. Unless $C_B$ is **much larger** than the coupling capacitance $C_c$, the node still moves and now takes longer to return, hurting the settling of the circuits being biased. Sometimes an **agile** (unbypassed) node is better.

Test it the honest way: apply a disturbance at the reference output and watch the settling (Razavi Fig. 12.25).

> [!note]- Detail: why the glitch area is fixed (Zettelkasten 10j1)
> The injected charge $q = C_c\Delta V_N$ lands on $C_B+C_c$, giving the initial step. It can only leave through the amplifier, which sinks $v_P/R_P$ ($R_P$ = closed-loop resistance at $P$). Integrating, $\int v_P\,dt = R_PC_c\Delta V_N$, with no $C_B$: a bigger $C_B$ trades height for width. With a repetitive disturbance at rate $f_{rep}$ faster than the recovery, $P$ never returns and the mean bias error is $R_PC_c\Delta V_N f_{rep}$, which no capacitor removes.

### Noise

$$
\boxed{|V_{n,out}|\approx V_{n,op}}\qquad(g_{mP}A_0\gg g_{mN}\gg R_1^{-1})
$$

The op amp's input-referred noise appears at the output **almost unattenuated**: the loop has no gain to divide it by.

> [!tip] Remark
> As in [[Feedback#What feedback does not buy noise]] and [[Noise]]: feedback sets gain, not the input-referred noise of the amplifier inside the loop.

- A bandgap that biases a load through an $N\times$ mirror multiplies its PMOS and op-amp noise current by $N$ in the load (Razavi Fig. 12.28).
- An ADC using the bandgap as its reference adds the reference noise **directly to the input** ([[Data Converter Fundamentals]]).
- A large output capacitor may still not remove the low-frequency **1/f** noise. Use large devices and low-noise op-amp design.

> [!note]- Derivation (Razavi Eqs. 12.63–12.65)
> With only $V_{n,op}$: the PMOS small-signal currents are $V_{n,out}/(R_1+g_{mN}^{-1})$, so the gate line moves by $-g_{mP}^{-1}V_{n,out}/(R_1+g_{mN}^{-1})$ and the op-amp input by that over $A_0$. KVL from node $A$:
> $$V_{n,out}\left[\frac1{R_1+g_{mN}^{-1}}\left(\frac1{g_{mN}}-\frac1{g_{mP}A_0}\right)-1\right] = V_{n,op}$$
> With $g_{mP}A_0\gg g_{mN}\gg R_1^{-1}$ the bracket is about $-1$.

### Supply Rejection Case Study

```tikz title="Precision reference with a locally regulated supply: an amplifier sets V_DDL from a bandgap voltage V_R1 generated inside the core itself; the core and its op amp run from V_DDL. After Razavi Figs. 12.39 to 12.41 (reported in Razavi ref. [7])."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[left] {$V_{DD}$ (noisy)} -- (0.6,0);
  \draw (0.6,-0.8) rectangle (4.0,0.8);
  \node[align=center,font=\scriptsize] at (2.3,0) {regulator\\ $V_{DDL}$ from\\ $V_{R1}$ and $R_{r1}/R_{r2}$};
  \draw[->] (4.0,0) -- (5.2,0) node[midway,above,font=\scriptsize] {$V_{DDL}$};
  \draw (5.2,-0.8) rectangle (8.2,0.8);
  \node[align=center,font=\scriptsize] at (6.7,0) {cascoded core\\ + op amp $A_1$};
  \draw[->] (8.2,0) -- (9.0,0) node[right] {$V_{out}$ (floating)};
  \draw[->] (6.7,-0.8) -- (6.7,-1.5) -- (2.3,-1.5) node[midway,below,font=\scriptsize] {$V_{R1}$: bandgap from the core} -- (2.3,-0.8);
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{out} = \frac{R_4}{R_6}V_{BE4}+2\frac{R_5}{R_1}V_T\ln n}
$$

The design in Razavi Sec. 12.8 (a two-$V_{BE}$-per-branch version of the self-biased PTAT core) shows what a high PSRR costs:
- **Two series junctions per branch** to dilute MOSFET mismatch.
- **Cascodes** on both NMOS and PMOS (self-biased, with resistors setting the cascode voltages, so no extra $V_{b1}$, $V_{b2}$ needed) to remove $\lambda$-driven supply dependence.
- A **floating output**: $V_{BE4}/R_6$ copied into $R_4$ and a PTAT current $2V_T\ln n/R_1$ copied into $R_5$, stacked by the op amp. Ratios and $n$ set zero TC.
- A **local regulated supply** $V_{DDL}$ for the core and op amp, whose own reference $V_{R1}$ is a bandgap generated inside the core (by choosing $R_M$). Plus a start-up circuit.
- Result: 5 V supply, 2.00 V output, 2.2 mW, PSRR **94 dB** at low frequency, **58 dB at 100 kHz**.

> [!tip] Remark
> A floating reference (not tied to either rail) is what a differential converter needs between its $V_{REF+}$ and $V_{REF-}$ ([[DACs]]).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ density ratio $n$ (or $mn$) | Smaller resistor ratio for the same 17.2, less offset gain (the only offset lever in Banba) | Area of the $n$-unit device; layout matching of many units |
| ↑ $R_2/R_3$ (smaller $n$) | Smaller bipolar array | Op-amp offset and noise amplified more |
| Stack two junctions | Halves offset's relative effect | $V_{out}\approx2.5$ V, needs high supply; PMOS sources, base currents |
| Current-mode (Banba) | Sub-1-V supply, any output level | More resistors and mirrors; offset gain $R_4/(R_1\|R_2)$; large noisy $R_4$ |
| Big op-amp devices | Lower $V_{OS}$, lower 1/f noise | Area, slower op amp |
| Trimming | Hits the zero-TC voltage, enables curvature correction | Test time, trim structures |
| Fast op amp | Low $Z_{out}$ to higher frequency, quick recovery | Power |
| Bypass $C_B$ | Smaller glitches, filters noise above $1/(R_PC_B)$ | Slower recovery, needs one-stage op amp, no help at 1/f |
| Cascodes / local regulator | PSRR (94 dB in the case study) | Headroom, complexity |
| Constant-$g_m$ instead of zero-TC bias | Gain, bandwidth, noise steady over T and process | $V_{eff}$ (swing) grows ~27% from 300 to 373 K; depends on $R_S$ spread |
| PTAT bias (bipolar) | Constant $g_m$ for bipolars | Power rises at high T |
| Long channels in the core | Less supply sensitivity and flicker noise | Area, capacitance |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Resistor bias | $I_{out} = \dfrac{V_{DD}}{R_1+1/g_{m1}}\dfrac{(W/L)_2}{(W/L)_1}$ |
| Self-biased loop | $I_{out} = \dfrac{2}{\mu_nC_{ox}(W/L)_NR_S^2}\left(1-\dfrac1{\sqrt K}\right)^2$ |
| Residual supply sensitivity | $\dfrac{\Delta I_{out}}{\Delta V_{DD}} = \dfrac1{r_{O4}}\left[\dfrac1{G_{m2}(r_{O4}\|R_1)}-g_{m4}R_3\right]^{-1}$ |
| Start-up window | $V_{TH1}+V_{TH5}+\lvert V_{TH3}\rvert < V_{DD} < V_{GS1}+V_{TH5}+\lvert V_{GS3}\rvert$ |
| $V_{BE}$ TC ($I_C$ const) | $\partial V_{BE}/\partial T = [V_{BE}-(4+m)V_T-E_g/q]/T\approx-1.5$ mV/K |
| $V_{BE}$ TC ($I_C\propto T$) | $[V_{BE}-(3+m)V_T-E_g/q]/T$ |
| PTAT voltage | $\Delta V_{BE} = V_T\ln(nm)$, TC $=(k/q)\ln(nm)$, $k/q=0.087$ mV/K |
| Zero-TC weight | $V_{REF}\approx V_{BE}+17.2V_T\approx1.25$ V |
| Kuijk cell | $V_{out} = V_{BE2}+(1+R_2/R_3)V_T\ln n$ |
| Zero-TC value (Razavi) | $V_{REF} = E_g/q+(4+m)V_T$ |
| Zero-TC value (Carusone) | $V_{ref,0} = V_{G0}+(m'-1)kT_0/q\approx1.24$ V |
| With resistor TC $R\propto T^\eta$ | $V_{ref,0} = V_{G0}+(m'+\eta-1)kT_0/q$ |
| Offset | $V_{out} = V_{BE2}+(1+R_2/R_3)(V_T\ln n-V_{OS})$ |
| Stacked junctions | $V_{out} = 2V_{BE}+(1+R_2/R_3)[2V_T\ln(mn)-V_{OS}]$ |
| Feedback polarity | $\beta_N = \frac{1/g_{m2}+R_3}{1/g_{m2}+R_3+R_2} > \beta_P = \frac{1/g_{m1}}{1/g_{m1}+R_1}$, aim $\beta_P\approx\beta_N/2$ |
| Curvature | $V_{ref} = V_{G0}+(m'-1)\frac{kT}q\left(1+\ln\frac{T_0}T\right)$, $\partial V_{ref}/\partial T = (m'-1)\frac kq\ln\frac{T_0}T$ |
| PTAT current | $I = V_T\ln n/R_1$ |
| PTAT-plus-junction | $V_{REF} = \lvert V_{BE3}\rvert+(R_2/R_1)V_T\ln n$ |
| Constant-$g_m$ | $g_{m1} = \frac2{R_S}\left(1-\frac1{\sqrt K}\right)$, $=1/R_S$ at $K=4$ |
| Banba | $V_{BG} = \frac{R_4}{R_2}\left(\lvert V_{BE1}\rvert+\frac{R_2}{R_1}V_T\ln n\right)-\left(1+\frac{R_2}{R_1}\right)\frac{R_4}{R_2}V_{OS}$ |
| Reference current | $I_{ref} = MV_{ref}/R$ |
| Output impedance | $Z_{out} = \frac{R_{out}}{1+g_{mP}R_1A_0}\cdot\frac{1+s/\omega_0}{1+s/[(1+g_{mP}R_1A_0)\omega_0]}$ |
| Bypass glitch | $\Delta V_P(0^+) = \Delta V_N\frac{C_c}{C_B+C_c}$, $\int\Delta V_P\,dt = R_PC_c\Delta V_N$ |
| Noise | $\lvert V_{n,out}\rvert\approx V_{n,op}$ |
| Floating reference | $V_{out} = \frac{R_4}{R_6}V_{BE4}+2\frac{R_5}{R_1}V_T\ln n$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 12 Bandgap References, pp. 509–535:
  - §12.1 General considerations, p. 509.
  - §12.2 Supply-independent biasing, pp. 509–512 (Figs. 12.1–12.5, Ex. 12.1, start-up).
  - §12.3 Temperature-independent references, pp. 513–522 ($V_{BE}$ TC, PTAT voltage, Exs. 12.2–12.6, Kuijk cell, PTAT collector current, CMOS pnp, offset, stacked junctions, feedback polarity, bandgap origin, curvature).
  - §12.4 PTAT current generation, pp. 523–524. §12.5 Constant-$G_m$ biasing, pp. 524–525. §12.6 Speed and noise, pp. 525–528 (Ex. 12.7). §12.7 Low-voltage bandgaps, pp. 529–533 (Banba, Ex. 12.8, OTA and start-up, Fig. 12.35). §12.8 Case study, pp. 533–535.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24), Ch. 7:
  - §7.1.2 Reference circuits, pp. 305–306 (Ex. 7.2).
  - §7.2 Constant transconductance, pp. 307–310 (Figs. 7.6–7.8, start-up, mobility limit, stability).
  - §7.3.1 Bandgap basics, pp. 310–314 (Eqs. 7.14–7.27, Exs. 7.3–7.4). §7.3.2 Bipolar and CMOS bandgap circuits, pp. 314–319 (Brokaw, well transistors, Ex. 7.5, resistor TC, offset 26 ppm/°C, SC reference, 25 ppm/K limit). §7.3.3 Low-voltage bandgap, pp. 319–320. §7.3.4 Current reference, p. 320.
- **Zettelkasten extensions** (`AnalogTheory/Bandgap and References/`, structure note `S10 Bandgap and References`): 10d1 (start-up supply window and example), 10f1 (why not MOS weak inversion; unit-device layout of the $n$ array), 10g1 ($T\ln T$ curvature term, $T_0$ sensitivity to offset), 10j1 (fixed glitch area, repetitive-disturbance error).
