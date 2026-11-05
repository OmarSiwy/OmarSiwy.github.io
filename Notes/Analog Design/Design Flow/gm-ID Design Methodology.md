---
title: gm-ID Design Methodology
description: How a set of amplifier specs (gain, GBW, phase margin, slew, settling, noise, offset, swing, power) becomes g_m/I_D, L, I_D and W for every device, in a fixed order, with worked sizings from Jespers & Murmann and ECE 636.
kind: topic
status: growing
aliases:
  - gm-ID Design Methodology
  - gm/ID Design Methodology
  - gm-ID Sizing
---

This note owns the **method**: given amplifier specs, which number does each spec fix, in what order, and how the lookup table turns the result into widths. Why $g_m/I_D$ is the right knob, and how the tables are made, is device material and lives in [[MosFETs#gm/ID and ID/W Simulation-Aided Design]]. The spec names are those of [[Single-Stage#Amplifier Specifications]].

## The big picture

```tikz title="The two curves every sizing decision lives on: transit frequency falls and intrinsic gain rises as g_m/I_D goes up; a longer L trades f_T for gain. Shapes only (qualitative), after Jespers and Murmann Fig. 3.7 and Table 1.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % left panel: fT
  \draw[->] (0,0) -- (6.2,0) node[right,font=\scriptsize] {$g_m/I_D$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$f_T$ (log)};
  \foreach \x/\l in {0.5/5,2.5/15,4.5/25} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {\l}; }
  \draw[very thick,domain=0.3:5.6,samples=40] plot (\x,{3.9-0.55*\x});
  \draw[thick,dashed,domain=0.3:5.2,samples=40] plot (\x,{3.0-0.55*\x});
  \node[font=\scriptsize,anchor=west] at (2.4,2.9) {short $L$};
  \node[font=\scriptsize,anchor=east] at (2.0,1.2) {long $L$};
  \draw[<-,thick] (0.3,4.2) -- (2.0,4.2);
  \node[font=\scriptsize,anchor=west] at (2.05,4.2) {GBW, PM, $\beta$, small $W$};
  % right panel: gain
  \begin{scope}[xshift=7.6cm]
  \draw[->] (0,0) -- (6.2,0) node[right,font=\scriptsize] {$g_m/I_D$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$g_m/g_{ds}$};
  \foreach \x/\l in {0.5/5,2.5/15,4.5/25} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {\l}; }
  \draw[very thick,domain=0.3:5.6,samples=40] plot (\x,{0.6+0.9*(1-exp(-\x/1.5))});
  \draw[thick,dashed,domain=0.3:5.6,samples=40] plot (\x,{1.2+2.3*(1-exp(-\x/1.5))});
  \node[font=\scriptsize,anchor=west] at (3.2,1.25) {short $L$};
  \node[font=\scriptsize,anchor=west] at (3.6,2.85) {long $L$};
  \draw[->,thick] (2.6,4.2) -- (4.4,4.2);
  \node[font=\scriptsize,anchor=east] at (2.55,4.2) {power, swing, noise/A};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Every spec lands on one of four numbers:** $g_m/I_D$ (inversion level), $L$, $I_D$ (equivalently $g_m$), and the capacitor sizes. $W$ is never chosen: $W = I_D/(I_D/W)$.
> 2. **Ratios before absolutes.** Swing bounds $g_m/I_D$, gain picks $L$, phase margin picks the $f_T$ of the non-dominant nodes. All of this is done in normalized space before $C_L$ or $f_u$ enter (JM §3.1.4). Then noise fixes $C$, settling fixes $g_m$, and $g_m/I_D$ turns $g_m$ into $I_D$.
> 3. **At fixed $f_T$ the gain has an interior maximum** in $g_m/I_D$ and $L$; at fixed gain $f_T$ has one. Max gain sits where the gain and $f_T$ contours touch.
> 4. **Noise plus settling:** minimum current $\Leftrightarrow$ maximum $\beta^2\,g_m/I_D$, reached near $\boxed{\beta\approx\tfrac34\beta_{max}}$, with the input device at $\omega_{Ti}\approx3(\mathrm{FO}\cdot G+1)\,\omega_u$.
> 5. **Optima are shallow.** Backing $g_m/I_D$ off the minimum-current point buys large area savings for a small current penalty. Corners are handled by pre-distorting the spec (e.g. $g_m$ moves about $\pm30\%$ at constant $I_D$), then verified in SPICE.

**Map:** [[#From amplifier specs to sizing|spec → knob → order]] → [[#Level 0 The Sizing Step Given L and gm/ID|the sizing step]] → [[#Level 1 Choosing gm/ID and L|choosing $g_m/I_D$ and $L$]] → [[#Level 2 Real Stages|self-loading, loads, pairs, noise/mismatch/distortion]] → [[#Level 3 OTAs Sized for Settling and Noise|OTAs for settling and noise]] → [[#Level 4 Corners and What the Table Cannot See|corners and table limits]].

## From amplifier specs to sizing

Every block note's **Spec translation** ends with amplifier specs. This section is where they land.

> [!tip] Remark
> The specs are defined in [[Single-Stage#Amplifier Specifications]]. The lookup table ($g_m/I_D$, $I_D/W$, $f_T$, $g_m/g_{ds}$, $C/W$ versus $L$, $V_{GS}$, $V_{DS}$, $V_{SB}$) is built as in [[MosFETs#Why gm/ID, why ID/W]]. Nothing here re-derives either.

```tikz title="The hand-off: each amplifier spec (left) fixes one sizing quantity (right), in this order. Steps 1, 2, 3 and 6 are normalized and need no absolute numbers; 4, 5, 7, 8 bring in C, omega_u and I_D. Steps 5 to 8 repeat until the self-loading C_dd converges. After Jespers and Murmann Secs. 3.1, 5.6.3, 6.1.2, 6.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\s/\t in {
    0/{Corners ($g_m$ spread)}/{0. Pre-distort: design nominal for $\omega_u/0.7$},
    1/{Swing, CM range, $V_{DD}$, HD3}/{1. $g_m/I_D$ floor/ceiling per device: $V_{D,sat}\approx 2/(g_m/I_D)$},
    2/{DC gain $A_0$, static error}/{2. $L$ per device from the $g_m/g_{ds}$ lookup},
    3/{Phase margin}/{3. $f_T$ at non-dominant nodes: their $L$, $g_m/I_D$},
    4/{Noise ($kT/C$ or PSD)}/{4. Capacitors $C_{Ltot}$ (or $g_m$ for a PSD spec)},
    5/{Settling $t_s$, $\epsilon_d$; GBW}/{5. $g_m = \omega_u C_{Ltot}/\beta$},
    6/{Power (minimise)}/{6. Input $g_m/I_D$: trade $f_T$ against $g_m/I_D$ via $\beta$},
    7/{Slew rate, step size}/{7. $I_D = \max\left[g_m/(g_m/I_D),\ SR\cdot C\right]$},
    8/{Offset, $1/f$, area}/{8. $W = I_D/(I_D/W)$; check $WL$, $C_{dd}$; iterate 5--8}} {
    \draw[fill=gray!12,rounded corners=2pt] (0,{-1.05*\i}) rectangle (4.2,{-1.05*\i+0.75});
    \node[font=\scriptsize] at (2.1,{-1.05*\i+0.375}) {\s};
    \draw[fill=black!3,rounded corners=2pt] (4.9,{-1.05*\i}) rectangle (12.2,{-1.05*\i+0.75});
    \node[font=\scriptsize] at (8.55,{-1.05*\i+0.375}) {\t};
    \draw[->] (4.2,{-1.05*\i+0.375}) -- (4.9,{-1.05*\i+0.375});
  }
  \foreach \i in {0,...,7} { \draw[->] (8.55,{-1.05*\i}) -- (8.55,{-1.05*\i-0.3}); }
  \draw[fill=gray!25,rounded corners=2pt] (12.9,-6.0) rectangle (15.3,-1.6);
  \node[align=center,font=\scriptsize] at (14.1,-3.8) {lookup\\table\\[2pt] $g_m/g_{ds}$\\ $f_T$, $C/W$\\ $I_D/W$};
  \draw (12.6,-1.725) -- (12.6,-8.025);
  \draw (12.9,-3.8) -- (12.6,-3.8);
  \foreach \i in {2,3,6,8} { \draw[->] (12.6,{-1.05*\i+0.375}) -- (12.2,{-1.05*\i+0.375}); }
  \draw[->] (12.6,-7.6) -- (12.6,-8.025) -- (12.2,-8.025);
\end{circuitikz}
\end{document}
```

| Amplifier spec | Sizing equation | Fixes | Step |
|---|---|---|---|
| Supply, output swing, input CM range | $\sum V_{D,sat}\le$ headroom, $V_{D,sat}\approx2/(g_m/I_D)$ | $g_m/I_D$ **floor** of every stacked device | 1 |
| Linearity (HD3 of a pair) | $HD_3 = \frac{v_{id,pk}^2}{48(nU_T)^2}\frac{1+3q}{(1+2q)^3}$, $g_m/I_D = \frac{1}{nU_T(1+q)}$ | $g_m/I_D$ **ceiling** of the input pair | 1 |
| DC gain $A_0$ / static error $\epsilon_s$ | $A_0\ge1/(\beta\epsilon_s)$; per stage $\lvert A_{v0}\rvert = \frac{(g_m/I_D)_1}{(g_{ds}/I_D)_1+(g_{ds}/I_D)_2}$ | $L$ (via $g_m/g_{ds}$ at the chosen $g_m/I_D$) | 2 |
| Phase margin | $\omega_{p2}\ge4\,\omega_u$ (76°), $\omega_{p2}\approx\frac{g_{m3}+g_{mb3}}{C_{ss3}+2C_{dd2}}$ (folded node) | $f_T$ of the non-dominant-node device: its $L$, $g_m/I_D$ | 3 |
| Noise, sampled (SC) | $\overline{v_{od}^2} = \alpha\frac{kT}{\beta C_{Ltot}}$ | $C_{Ltot}$, hence $C_F$, $C_S$, $C_L$ | 4 |
| Noise, spectral density | $\overline{v_n^2}/\Delta f = 4kT\gamma/g_m\cdot(1+\ldots)$ | $g_m$ of the input device | 4 |
| Settling ($t_s$, $\epsilon_d$) / GBW | $\tau = t_s/\ln(1/\epsilon_d)$, $\omega_u = \beta\kappa\,g_m/C_{Ltot}$ | $g_m$ of the input device | 5 |
| Power (minimised) | $I_D\propto\frac{1}{\beta^2}\frac{I_D}{g_m}$ at fixed noise and $\omega_u$ | input $g_m/I_D$ (through $f_{Ti} = g_m/2\pi C_{gs}$) | 6 |
| Slew rate | $SR = 2I_D/C_{Ltot}$; with slewing $\omega_u = \frac{1}{t_s}\left[X-1+\ln\frac{X}{\epsilon_d}\right]$ | $I_D$ (and pushes $g_m/I_D$ lower) | 7 |
| Offset | $\sigma^2_{V_{OS}}\approx\sigma^2_{\Delta V_{T1}}+\left[\frac{(g_m/I_D)_2}{(g_m/I_D)_1}\right]^2\sigma^2_{\Delta V_{T2}}$, $\sigma_{\Delta V_T} = A_{VT}/\sqrt{WL}$ | $WL$ of the pair; low $g_m/I_D$ on the loads | 8 (check) |
| Flicker corner | $f_{co}$ fixed once $L$ and $g_m/I_D$ are fixed; level $\propto1/(WL)$ | $WL$ | 8 (check) |
| Output impedance, CMRR, PSRR | $r_o$ and cascode gain | $L$ of loads and tail | 2 |
| Corners | $g_m/I_D$ spread $\pm30\%$ (constant $I_D$), $\pm50\%$ (constant $g_m$) | the spec you design to | 0 |

**The order and why:**

0. **Pre-distort** every speed and noise target by the worst-case $g_m$ loss at the corner you bias for.
1. **Headroom first.** It is the only hard wall: it bounds $g_m/I_D$ of the stack before anything else is known.
2. **Gain picks $L$.** $g_m/g_{ds}$ is width-independent, so $L$ follows from the gain share at the bounded $g_m/I_D$.
3. **Phase margin** is a ratio ($\omega_{p2}/\omega_u$), so the cascode/mirror devices' $f_T$ can be fixed now.
4. **Noise sets the capacitors** (sampled noise) or $g_m$ (spectral noise). Capacitors are the first absolute numbers.
5. **Settling sets $g_m$** for those capacitors.
6. **Pick the input $g_m/I_D$** that minimises current (it changes $C_{gs}$, hence $\beta$, hence step 5: sweep, or take $\beta = 0.75\beta_{max}$).
7. **$I_D$** is the larger of the small-signal and the slew demand.
8. **De-normalize** to $W$, add the drain capacitance it brings back into step 5, iterate. Check offset area, flicker, power.

> [!tip] Remark
> Steps 1, 2, 3 and 6 live entirely in normalized space. That is why one gain stage designed for 1 GHz into 1 pF is also the design for 100 MHz into 10 pF: only $I_D$ and $W$ scale (JM §3.1.4).

> [!note]- Detail: what is not an amplifier spec (carried alongside)
> A few primitives do not reduce to $g_m/I_D$: switches (triode $R_{on}$, sized from the $V_{DS}=0$ table, see [[Sampling Circuits]]), resistor and capacitor values, and fixed bias currents. The owner's flow note lists them: [[Analog Design Flow]]. Switch example (JM Ex. 6.9): settling 1 pF to 0.1% in half of a 100 MHz clock needs $R_{on} = 1/(2f_{clk}C\ln(1/\epsilon)) = 724\ \Omega$, so $W_n = 5.3$ µm, $W_p = 2.6\,W_n = 13.7$ µm (the ratio that flattens $R_{on}$ versus input).

## Level 0: The Sizing Step Given L and gm/ID

> [!tip] Remark
> This is the five-step flow of [[MosFETs#Why gm/ID, why ID/W]] ($g_m$ → $L$ → $g_m/I_D$ → $I_D$ → $W$), run on the simplest circuit. What is new here is only the circuit equation that turns the spec into $g_m$.

```tikz title="The intrinsic gain stage (IGS): ideal current-source load, capacitive load. It is also the half circuit of an actively loaded differential pair, so every result here carries over. After Jespers and Murmann Figs. 3.1 to 3.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M){};
  \draw (M.S) node[ground]{};
  \draw (M.G) -- ++(-0.6,0) node[ocirc]{} node[left]{$v_{in}$};
  \draw (M.D) -- (0,1.2) coordinate (o);
  \draw (o) to[I, l_=$I_D$, invert] (0,3.2) node[vcc]{$V_{DD}$};
  \draw (o) -- (1.6,1.2) to[C, l=$C_L$] (1.6,-0.77) node[ground]{};
  \draw (1.6,1.2) -- (2.4,1.2) node[ocirc]{} node[right]{$v_{out}$};
  \begin{scope}[xshift=5.2cm,yshift=-0.6cm]
    \draw[->] (0,0) -- (6.0,0) node[right] {$\log\omega$};
    \draw[->] (0,0) -- (0,3.4) node[above] {$\lvert A_v\rvert$ (dB)};
    \draw[thick] (0,2.6) -- (1.8,2.6) -- (4.4,0.0);
    \draw[dashed] (1.8,0) -- (1.8,2.6);
    \node[below,font=\scriptsize] at (1.8,0) {$\omega_c$};
    \node[below,font=\scriptsize] at (4.4,0) {$\omega_u = g_m/C_L$};
    \node[left,font=\scriptsize] at (0,2.6) {$g_m/g_{ds}$};
    \node[font=\scriptsize,anchor=west] at (2.9,2.1) {$-20$ dB/dec};
    \draw[dotted] (5.5,0) -- (5.5,1.6);
    \node[font=\scriptsize,anchor=south] at (5.5,1.6) {$\omega_T$};
    \draw[<->] (4.4,0.5) -- (5.5,0.5) node[midway,above,font=\scriptsize] {FO};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_u = \frac{g_m}{C_L}}\qquad\boxed{\lvert A_{v0}\rvert = \frac{g_m}{g_{ds}}}\qquad\boxed{\mathrm{FO} = \frac{C_L}{C_{gg}} = \frac{\omega_T}{\omega_u}\gtrsim10}\qquad\boxed{I_D = \frac{g_m}{g_m/I_D},\quad W = \frac{I_D}{J_D}}
$$

- **Fan-out** is the ratio of load to own input capacitance. The quasi-static model holds only to about $f_T/10$, so keep $\mathrm{FO}\gtrsim10$; a low FO also means the stage is mostly loading itself.
- **$V_{GS}$ is an output**, read from the table after sizing. Never bias by a chosen $V_{GS}$: it moves ±100–200 mV over corners ([[MosFETs#Process Corners]]). Bias by current through mirrors, a tail, or a replica.
- Once $L$ and $g_m/I_D$ are fixed, $J_D$, $V_{GS}$, $g_m/g_{ds}$ and $f_T$ are all fixed by the same lookup.

> [!example] JM Ex. 3.1: the sizing step in one pass
> Spec: $f_u = 1$ GHz into $C_L = 1$ pF. Choice: $L = 60$ nm, $g_m/I_D = 15$ S/A, $V_{DS} = 0.6$ V.
> 1. $g_m = 2\pi f_uC_L = 6.28$ mS.
> 2. $I_D = g_m/(g_m/I_D) = 419$ µA.
> 3. Lookup $J_D(15\ \mathrm{S/A}, 60\ \mathrm{nm}) = 10.05$ µA/µm, so $W = 41.7$ µm.
> 4. Read-outs: $V_{GS} = 0.468$ V, $\lvert A_{v0}\rvert = 10.25$, $f_T = 26.5$ GHz (FO = 26.5, fine), $V_A = 0.68$ V (DIBL at 60 nm).
>
> SPICE: $g_m/I_D = 14.99$ S/A, $V_{GS} = 468$ mV, GBW about 3% low because $C_{gd}$ and $C_{db}$ were ignored ([[#Self-Loading]]).

## Level 1: Choosing gm/ID and L

Level 0 took $L$ and $g_m/I_D$ as given. Choosing them is the design.

### Three Slices Through the Trade-off

$f_T$ and $g_m/g_{ds}$ both depend on ($g_m/I_D$, $L$) only. Fix one quantity and sweep the other two (JM §3.1.4, $C_L = 1$ pF, $V_{DS} = 0.6$ V):

| Held constant | What you sweep | Result | JM example |
|---|---|---|---|
| $g_m/I_D = 15$ S/A (set by swing or distortion), $f_u = 100$ MHz | $L$ | $I_D = 41.9$ µA for every $L$. Gain rises with $L$ until $f_T = 10f_u$: $L_{max} = 0.6$ µm, $\lvert A_{v0}\rvert\approx100$ | 3.2 |
| $f_T = 10$ GHz ($f_u = 1$ GHz, FO = 10) | $g_m/I_D$ and $L$ along the $f_T$ contour | **Interior gain maximum:** 10.62 S/A, 220 nm, $\lvert A_{v0}\rvert = 40.9$, 592 µA. Minimum current: 20.76 S/A, 70 nm, $\lvert A_{v0}\rvert = 13.75$, 303 µA | 3.3 |
| $\lvert A_{v0}\rvert = 50$ | $g_m/I_D$ and $L$ along the gain contour | **Interior $f_T$ maximum:** 11.7 S/A, 250 nm, $f_u = 679$ MHz. 80% of that $f_u$ at minimum current: 16.3 S/A, 200 nm, 210 µA | 3.4 |

- **Why interior optima:** along a constant-$f_T$ line, raising $g_m/I_D$ first raises gain, but holding $f_T$ then forces $L$ shorter, and gain falls. The same tension, mirrored, gives the $f_T$ peak at fixed gain.
- **Don't sit at the minimum-current point:** a little more current there buys a lot of gain (JM Fig. 3.12).

### Maximum Gain for a Given fT

```tikz title="Maximum intrinsic gain reachable at each required f_T, with the (g_m/I_D, L) that reaches it. 65-nm NMOS, V_DS = 0.6 V. Data from Jespers and Murmann Table 3.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.6,0) node[right] {$f_T$ (GHz)};
  \draw[->] (0,0) -- (0,5.6) node[above] {max $\lvert A_{v0}\rvert$};
  \foreach \l/\v in {-1/0.1,0/1,1/10} { \draw ({1.8*(\l+2)},0.08) -- ({1.8*(\l+2)},-0.08) node[below,font=\scriptsize] {\v}; }
  \draw ({1.8*(log10(0.02)+2)},0.08) -- ({1.8*(log10(0.02)+2)},-0.08) node[below,font=\scriptsize] {0.02};
  \draw ({1.8*(log10(50)+2)},0.08) -- ({1.8*(log10(50)+2)},-0.08) node[below,font=\scriptsize] {50};
  \foreach \g in {50,100,150,200} { \draw (0.08,{\g/40}) -- (-0.08,{\g/40}) node[left,font=\scriptsize] {\g}; }
  \draw[thick] plot coordinates {
    ({1.8*(log10(0.02)+2)},{206.4/40}) ({1.8*(log10(0.05)+2)},{196.0/40}) ({1.8*(log10(0.1)+2)},{179.0/40})
    ({1.8*(log10(0.2)+2)},{155.1/40}) ({1.8*(log10(0.5)+2)},{124.0/40}) ({1.8*(log10(1)+2)},{102.0/40})
    ({1.8*(log10(2)+2)},{81.6/40}) ({1.8*(log10(5)+2)},{57.6/40}) ({1.8*(log10(10)+2)},{40.9/40})
    ({1.8*(log10(20)+2)},{27.4/40}) ({1.8*(log10(50)+2)},{15.5/40})};
  \foreach \f/\g/\t in {0.1/179.0/{26.5 S/A, 0.99 µm},1/102.0/{20 S/A, 0.44 µm},10/40.9/{10.6 S/A, 0.22 µm},50/15.5/{6.7 S/A, 0.11 µm}} {
    \fill ({1.8*(log10(\f)+2)},{\g/40}) circle (2pt);
    \node[font=\scriptsize,anchor=south west] at ({1.8*(log10(\f)+2)+0.05},{\g/40+0.05}) {\t};
  }
  \node[font=\scriptsize,align=left,anchor=west] at (0.3,0.7) {left: longest $L$ (1 µm)\\ right: $L$ near min., strong inv.};
\end{circuitikz}
\end{document}
```

$$
\boxed{\max\lvert A_{v0}\rvert\ \text{at fixed } f_T\ \Leftrightarrow\ \text{the gain contour tangent to the } f_T \text{ contour in the } (J_D, L)\ \text{plane}}
$$

- Faster costs gain twice: shorter $L$ **and** lower $g_m/I_D$. At 1 GHz this 65 nm device tops out near 100; at 10 GHz near 40.
- Below the maximum gain, a band of $g_m/I_D$ works, and current varies 3–5× across it (JM Ex. 3.6). Pick for **max FO** (smallest $C_{gg}$, e.g. $\lvert A_{v0}\rvert = 50$ at 100 MHz: 12.4 S/A, 0.24 µm, 6.5 µm, 51 µA, FO = 68) or **min current** (weak inversion, FO = 10).

### Weak Inversion: Size by Current Density

In weak inversion $g_m/I_D\to1/(nU_T)$ and stops moving, so it can no longer pick the design. Choose $J_D = I_D/W$ first, then look up $g_m/I_D$ (JM Fig. 3.17, §3.1.6).

$$
\boxed{J_D\ \text{and}\ L\ \xrightarrow{\text{lookup}}\ g_m/I_D,\ f_T,\ g_m/g_{ds}}\qquad\text{weak inversion: } L \text{ sets the gain, } J_D \text{ sets } W
$$

- Use the $g_m/I_D$-first flow for moderate and high-speed circuits; switch to $J_D$-first when the circuit is clearly sub-threshold (µW and below).
- ECE 636 works in $J_D$ throughout: $I_D/W<0.1$ A/m is deep weak inversion, $>10$ A/m deep strong inversion, between is moderate ("Designing for Gain and Bandwidth").
- Stop lengthening $L$ before $J_D$ reaches the weak-inversion knee (beyond it $g_m/I_D$ drops), and before the model is out of range.

> [!example] JM Ex. 3.5: a 0.8 nA stage
> $C_L = 1$ pF, $I_D = 0.8$ nA, $W\ge5$ µm (matching, flicker), target gain about 150.
> 1. $J_D = 0.8\ \mathrm{nA}/5\ \mu\mathrm{m} = 0.16$ nA/µm (deep weak inversion).
> 2. Gain 150 at that $J_D$ needs $L = 500$ nm (from $g_m/g_{ds}$ vs $J_D$).
> 3. Lookup: $g_m/I_D = 30.5$ S/A, $f_T = 445$ kHz, $V_{GS} = 128$ mV.
> 4. $g_m = 24.4$ nS, $f_u = g_m/(2\pi C_L) = 3.82$ kHz, FO = 116. SPICE: gain 145, $f_u = 3.87$ kHz.

### Worked Example 1: CS Stage for GBW and Gain (JM Exs. 3.3, 3.7, 3.8)

**Specs:** $f_u = 1$ GHz, $C_L = 1$ pF, FO = 10, $V_{DD} = 1.2$ V, $V_{OUT} = V_{DD}/2$, maximum DC gain. 65 nm.

1. **Translate.** FO = 10 means $f_T = 10$ GHz. $g_m = 2\pi f_uC_L = 6.283$ mS.
2. **Normalized choice (IGS).** On the 10 GHz contour the gain peaks at $g_m/I_D = 10.62$ S/A, $L = 220$ nm, $\lvert A_{v0}\rvert = 40.9$, $V_{GS} = 0.579$ V.
3. **De-normalize.** $I_D = 6.283/10.62 = 592$ µA; $J_D = 12.9$ A/m, so $W = 45.9$ µm. SPICE: gain 41.0, $f_u = 0.967$ GHz (−3.3%: drain capacitance ignored).
4. **Self-loading** (shown on the minimum-current variant, 20.76 S/A, 70 nm, 303 µA, 114 µm, which missed $f_u$ by 6.7%). Iterating $g_m = \omega_u(C_L+C_{dd})$: 302.7 → 324.0 → 325.6 µA; final +7.6% in $I_D$ and $W$ (114.2 → 122.8 µm). The one-shot factor $S$ gives the same 1.076.
5. **Real load.** Replace the ideal source by a PMOS. Choose $(g_m/I_D)_2 = 10$ S/A, so $V_{D,sat2} = 0.2$ V (gain vs headroom vs noise compromise). Sweep $L_2$: gain stops improving past 0.5 µm while $W_2$ and the self-loading grow. Take $L_2 = 0.5$ µm.
6. **Re-optimize M1 with the load** (self-loading included): $(g_m/I_D)_1 = 13.55$ S/A, $L_1 = 170$ nm, $W_1 = 67.2$ µm, $W_2 = 175.6$ µm, $I_D = 537$ µA, $C_{self} = 0.157$ pF, $\lvert A_{v0}\rvert = 22.6$.
7. **Swing.** Both devices at 10 S/A have $V_{D,sat}\approx0.2$ V, so the output swings about ±400 mV around 0.6 V.

SPICE: $\lvert A_{v0}\rvert = 22.60$, $f_u = 1013$ MHz, $V_{GS1} = 0.5212$ V (predicted 0.5213).

> [!tip] Remark
> The gain fell from 41 to 23 because $g_{ds2}$ adds to $g_{ds1}$: the active load roughly halves the gain, as in [[Single-Stage#Choosing the Load]]. With equal Early voltages it is exactly half.

### Worked Example 2: ECE 636 CS Amplifier at 1 µA

**Specs** ("Characterizing Transistor Performance for Design", 180 nm bulk): NMOS CS with PMOS mirror load, $\lvert A_0\rvert\ge40$, GBW $\ge500$ MHz, $V_{DD} = 1.8$ V, $I_B = 1$ µA, $P\le3.6$ µW, $V_{out} = V_{DD}/2$, no external $C_L$, M1 and M2 the same size.

1. **Gain → $J_D$, $L$.** With $L_1 = L_2$ and $\lambda'_n\approx\lvert\lambda'_p\rvert$, $\lvert A_0\rvert\approx g_{m1}r_{o1}/2$, so $g_mr_o\ge80$. On the simulated intrinsic-gain-versus-$I_D/W$ plot, $L = 360$ nm reaches about 82 at $I_D/W = 1$ A/m (moderate inversion).
2. **Speed check.** A CS stage driving a replica of itself has GBW bounded by $f_T$ of M1. At 1 A/m, $f_{T1}\approx2$ GHz $>$ 500 MHz.
3. **De-normalize.** $W_1 = I_D/(I_D/W) = 1\ \mu\mathrm{A}/(1\ \mathrm{A/m}) = 1$ µm, $L = 360$ nm. Power: two 1 µA branches at 1.8 V = 3.6 µW.
4. **Estimate GBW** from the per-width capacitances in the operating point: $\mathrm{GBW}\approx g_{m1}/[2\pi(C_{gd1}+C_{gd2}+C_{db1}+C_{db2})]$ with $C_{db}\approx818$ aF/µm, $C_{gd}\approx387$ aF/µm.

Simulated: $\lvert A_0\rvert = 74.9$, GBW = 1.33 GHz. Both clear the spec with margin. With no external load the GBW is set by self-loading alone: it scales with $J_D$ at fixed $L$ (raising it costs gain), and scaling $I_D$ and $W$ together leaves it unchanged.

## Level 2: Real Stages

### Self-Loading

The drain capacitance $C_{dd} = C_{db}+C_{gd}$ of the device (and of its load) adds to $C_L$, but is unknown until $W$ is. Two fixes (JM §3.1.7):

$$
\boxed{S = \frac{1}{1-C_{dd1}/C_L}}\qquad\text{(scale } I_D \text{ and } W \text{ of the first-pass design by } S\text{)}
$$

$$
\boxed{g_m^{(k+1)} = \omega_u\left(C_L + W^{(k)}\cdot\frac{C_{dd}}{W}\right)}\qquad\text{(iterate; converges in 2–3 passes)}
$$

- Scaling $I_D$ and $W$ together keeps $J_D$, $g_m/I_D$, $f_T$ fixed and scales $g_m$ and $C_{dd}$ alike, which is why one factor fixes it exactly.
- The iteration also works when the parasitic does **not** scale with the device that sets $\omega_u$ (OTAs, where the output devices load the input pair's bandwidth). In OTAs write it as a ratio $r_{self} = C_{self}/C_{L,ext}$.

### Loads and Differential Pairs

$$
\boxed{\lvert A_{v0}\rvert = \frac{(g_m/I_D)_1}{(g_{ds}/I_D)_1+(g_{ds}/I_D)_2}}\ \ \text{(active load)}\qquad\boxed{\lvert A_{v0}\rvert = \frac{(g_m/I_D)_1}{1/V_{EA1}+1/(I_DR)}}\ \ \text{(resistor)}
$$

- **Active load:** its current is fixed by M1. Free knobs: $(g_m/I_D)_2$ and $L_2$. Minimum $g_{ds}/I_D$ wants about 5 S/A, but that costs 0.4 V of headroom. **Default $(g_m/I_D)_2\approx10$ S/A**, which is also near the dynamic-range optimum (JM §4.1.3). **$L_2\approx0.5$ µm**: longer buys no gain, only width and self-loading.
- **Resistive load:** gain needs a large $I_DR$, which steals swing and lowers $V_{DS1}$ (DIBL lowers $V_{EA1}$). Sweep $L$ and $V_{DS}$ together (JM Ex. 3.10: max gain only 8.49 at $L = 110$ nm, $V_{DS} = 0.4$ V, 18 S/A, 368 µA, $W = 87.9$ µm, $R = 2.17$ kΩ).
- **Differential pair:** for small inputs the tail is an AC ground, so the half circuit **is** the IGS and the whole flow applies. Only the bias differs: $V_{SB}$ (the tail voltage) and $V_{DS}$ come from `lookupVGS`, and they move $J_D$ (JM Ex. 3.11: same 419 µA as Ex. 3.1, but $W = 41.06$ instead of 41.72 µm, $V_{SB} = 225$ mV).
- **Mirror-loaded pair:** gain is that of the active-load CS stage. The mirror adds a pole-zero doublet near $f_{T}/2$ of the load devices: harmless at 100 MHz, a settling hazard in fast loops. Shorter $L_2$ pushes it up.

> [!example] JM Ex. 3.12: mirror-loaded pair, 100 MHz into 1 pF
> Choices reused from earlier: pair at 17 S/A, $L_1 = 0.34$ µm (from the CS sweep); load at 10 S/A, $L_2 = 0.5$ µm. Terminal voltages by lookup: $V_{GS1} = 0.467$ V, $V_{GS2} = 0.586$ V, so $V_{DS1} = 0.381$ V, $V_S = 0.233$ V. Then $\lvert A_{v0}\rvert = 31.06$; $g_{m1} = 2\pi\cdot100\ \mathrm{MHz}\cdot1\ \mathrm{pF}$, $I_D = 36.96$ µA, $W_1 = 18.07$ µm, $W_2 = 12.13$ µm. SPICE: gain 30.74, tail 0.2329 V, doublet pole about 580 MHz.

### Noise, Distortion and Mismatch as Sizing Constraints

Each of these is owned elsewhere. Here is only where it lands:

| Constraint | Lands on | Rule | Owner |
|---|---|---|---|
| Thermal noise + bandwidth + current | input $g_m/I_D$ | FoM $\propto f_T\cdot g_m/I_D$ peaks near 7 S/A at minimum $L$ (65 nm) | [[Noise#Choosing the Bias Point (gm/ID)]] |
| Load noise $\gamma_2g_{m2}/(\gamma_1g_{m1})$ | $(g_m/I_D)_2/(g_m/I_D)_1$ | low ratio cuts noise but raises $V_{D,sat2}$: interior DR optimum, loads in moderate inversion | [[Noise#Choosing the Bias Point (gm/ID)]] |
| Flicker noise | $WL$ | $f_{co}$ is set once $L$ and $g_m/I_D$ are; only area lowers the level | [[Noise#Flicker (1/f) Noise]] |
| HD3 of a pair | input $g_m/I_D$ ceiling | lower $g_m/I_D$ (higher $q$) for less distortion; costs current | [[Nonlinearity and Mismatch]] |
| Offset | $WL$ of pair; load $g_m/I_D$ | $\sigma_{\Delta V_T} = A_{VT}/\sqrt{WL}$; loads low $g_m/I_D$ | [[Nonlinearity and Mismatch#The $g_m/I_D$ Form]] |
| Offset drift | input $g_m/I_D$ | weak inversion: drift = $V_{OS,\Delta\beta}/T$, the minimum | [[Nonlinearity and Mismatch#Offset Drift Comes from $\Delta\beta$, Not $\Delta V_{TH}$]] |
| Mirror accuracy | mirror $g_m/I_D$ | fixed area: low $g_m/I_D$. Fixed current: weak inversion with large $W$ is fine | [[Current Mirrors]] |

> [!example] JM Ex. 4.4: distortion fixes $g_m/I_D$, gain fixes $g_m$
> Differential pair, $\lvert A_v\rvert = 2$, $R_L$ such that $g_m = 10$ mS, $L = 100$ nm, $n = 1.29$ (from the peak of $g_m/I_D$). HD3 = −60 dB at $v_{id,pk} = 10$ mV solves to 24.2 S/A: $I_0 = 0.826$ mA, $W = 321$ µm. At 40 mV the same HD3 needs 8.0 S/A: $I_0 = 2.51$ mA (3.0×, where the square law predicts 4×). For −70 dB: 15.8 S/A, 1.26 mA at 10 mV; 4.7 S/A, 4.25 mA at 40 mV.

## Level 3: OTAs Sized for Settling and Noise

The canonical load is a switched-capacitor gain stage in its amplify phase. Its block-level translation (accuracy → $A_0$, settling → $\omega_u$) is in [[Switched-Capacitor Circuits#Spec translation]]; this level sizes the OTA from those numbers.

### The Equations

```tikz title="Switched-capacitor gain stage in the amplify phase (single-ended view of a fully differential circuit). The OTA's own C_gs sits in the feedback divider, so the input device size lowers beta. After Jespers and Murmann Figs. 6.1 and 6.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (4,0) node[op amp](A){};
  \draw (A.+) -- ++(-0.3,0) -- ++(0,-0.9) node[ground]{};
  \draw (A.-) -- (1.4,0.5) coordinate (x);
  \draw (x) to[C, l_=$C_S$] (-0.8,0.5) node[ocirc]{} node[left]{$v_{in}$};
  \draw (x) to[C, l_=$C_{gs}$] (1.4,-1.4) node[ground]{};
  \draw (x) -- (1.4,2.0) to[C, l=$C_F$] (6.0,2.0) -- (6.0,0) coordinate (o);
  \draw (A.out) -- (o) -- (6.8,0) coordinate (o2);
  \draw (o2) to[C, l=$C_L$] (6.8,-1.4) node[ground]{};
  \draw (o2) -- (7.6,0) node[ocirc]{} node[right]{$v_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (8.5,1.4) {$G = C_S/C_F$ (ideal gain)};
  \node[font=\scriptsize,align=left,anchor=west] at (8.5,0.8) {$\beta = \dfrac{C_F}{C_F+C_S+C_{gs}}$};
  \node[font=\scriptsize,align=left,anchor=west] at (8.5,-0.1) {$\beta_{max} = \dfrac{1}{1+G}$};
  \node[font=\scriptsize,align=left,anchor=west] at (8.5,-0.9) {$\mathrm{FO} = C_L/C_S$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\omega_u = \beta\frac{g_m}{C_{Ltot}},\quad C_{Ltot} = C_L+(1-\beta)C_{Ftot}}\qquad\boxed{\tau = \frac{1}{\omega_u} = \frac{t_s}{\ln(1/\epsilon_d)}}\qquad\boxed{\epsilon_s\approx-\frac{1}{L_0} = -\frac{1}{\beta g_mr_{ds}}}\qquad\boxed{\overline{v_{od}^2} = 2\gamma_n\frac{kT}{\beta\,C_{Ltot}}}
$$

- $C_{Ftot} = C_F+C_{gd}$ for this basic OTA (the input pair's $C_{gd}$ is in parallel with $C_F$). Here **FO = $C_L/C_S$**, not the device fan-out of Level 0.
- **Noise sets the capacitors, bandwidth sets $g_m$:** that clean split is why the flow is linear.
- **Noise scaling:** multiply every capacitor, width and current by $S = \overline{v^2}_{actual}/\overline{v^2}_{target}$. Current densities, $g_m/C$ and the frequency response stay put; only the noise moves.

> [!tip] Remark
> This is the closed-loop first-order settling of [[Operational Amplifiers#Bandwidth Sets the Settling Time]] and the $kT/C$ of [[Noise#kT/C Noise]], written with the OTA's own capacitance inside $\beta$ and $C_{Ltot}$.

### Minimum Current: Maximise β²·gm/ID

$$
\boxed{I_D = \frac{2kT\gamma_n}{\overline{v_{od}^2}}\,\omega_u\cdot\frac{1}{\beta^2}\frac{I_D}{g_m}}\qquad\boxed{\frac{\beta}{\beta_{max}}\approx\frac34}\qquad\boxed{\frac{\omega_{Ti}}{\omega_u}\approx3(\mathrm{FO}\cdot G+1),\quad C_{gs}\approx\frac{C_S+C_{Ftot}}{3}}
$$

with $\omega_{Ti} = g_m/C_{gs}$ (slightly above $\omega_T = g_m/C_{gg}$).

- Raising $g_m/I_D$ makes each amp of current give more $g_m$, but lowers $f_T$, so for the same $g_m$ the input device has more $C_{gs}$, $\beta$ drops, and you need even more $g_m$. The optimum balances the two.
- The closed form assumes strong inversion; real optima land in moderate inversion, but $\beta/\beta_{max}$ stays near 0.73–0.86 in every JM example, so **0.75 is a safe default**.
- Optimal FO for a cascade of SC stages is about $1/G$ (Cline and Gray), so $\mathrm{FO}\cdot G\approx1$ and $\omega_{Ti}\approx6\omega_u$.

> [!note]- Derivation: β in terms of the device's f_Ti, and the 3/4 optimum (JM §6.1.2)
> Start from $I_D = g_m\cdot(I_D/g_m)$. Solve $\omega_u = \beta g_m/C_{Ltot}$ for $g_m$ and eliminate $C_{Ltot}$ with the noise equation: $I_D = \frac{2kT\gamma_n}{\overline{v_{od}^2}}\omega_u\frac{1}{\beta^2}\frac{I_D}{g_m}$, so minimise $K = \frac{1}{\beta^2}\frac{I_D}{g_m}$.
>
> Write $\beta = 1/(1+G+C_{gs}/C_{Ftot})$ and $\frac{C_{gs}}{C_{Ftot}} = \frac{g_m/C_{Ftot}}{\omega_{Ti}}$. From $\omega_u = \beta g_m/[C_L+C_{Ftot}(1-\beta)]$ and $C_L/C_{Ftot} = \frac{C_L}{C_S}\frac{C_S}{C_{Ftot}} = \mathrm{FO}\cdot G$: $\frac{g_m}{C_{Ftot}} = \frac{\omega_u}{\beta}\left(\mathrm{FO}\cdot G+1-\beta\right)$. Substitute into $\beta$ and solve:
> $$\beta = \frac{1-(1+\mathrm{FO}\cdot G)\,\omega_u/\omega_{Ti}}{1+G-\omega_u/\omega_{Ti}}$$
> so $K = \left(\frac{1+G-\omega_u/\omega_{Ti}}{1-(1+\mathrm{FO}\cdot G)\omega_u/\omega_{Ti}}\right)^2\frac{I_D}{g_m}$. Dropping the small $\omega_u/\omega_{Ti}$ in the numerator (all of $C_{Ftot}$ loads the output: conservative), and using the strong-inversion link between $\omega_{Ti}$ and $g_m/I_D$, the minimum is at $\omega_{Ti}/\omega_u = 3(\mathrm{FO}\cdot G+1)$, $C_{gs} = (C_S+C_{Ftot})/3$, hence $\beta = \frac34\beta_{max}$.
>
> JM Ex. 6.1 ($L = 100$ nm, $f_u = 1$ GHz, $G = 2$): FO = 0.5, 1, 2, 4 give optimum $g_m/I_D$ = 22.6, 20.4, 17.1, 12.9 S/A and $\beta/\beta_{max}$ = 0.857, 0.825, 0.788, 0.755. With $\mathrm{FO}\cdot G = 2$ fixed, $G$ from 1 to 8 barely moves the optimum (20.6 to 20.1 S/A), but the current grows with $G$. Large $g_m/I_D$ is a feasibility wall: 1 GHz cannot be built deep in weak inversion.

**Recipe (single-stage OTA, linear settling)** (JM §6.1.2):
1. Assume $\beta = 0.75\beta_{max}$.
2. $L$ from the loop-gain (static error) requirement.
3. $C_{Ltot}$ from the noise spec; $G$ and FO then fix $C_S$, $C_F$, $C_L$.
4. $g_m = \omega_uC_{Ltot}/\beta$ from the settling time.
5. Required $f_{Ti}$ from $g_m$ and $C_{gs}$; look up $g_m/I_D$, then $I_D$.
6. Look up $I_D/W$, then $W$.
7. If $W$ is huge and the inversion low, lower $g_m/I_D$: a small current increase buys a large width cut.

### Worked Example 3: Basic OTA for Noise and Settling (JM Ex. 6.2)

**Specs:** $f_u = 1$ GHz, total integrated output noise 100 µV rms, $G = 2$, FO = 1, $L = 100$ nm, minimum current.

1. **Normalized optimum** (from the sweep above, FO = 1): $g_m/I_D = 20.4$ S/A, $f_{Ti} = 15.6$ GHz, $\beta/\beta_{max} = 0.825$, so $\beta = 0.825/3 = 0.275$.
2. **Noise → capacitors.** $\gamma_n\approx0.7$: $C_{Ltot} = 2\gamma_nkT/(\beta\,\overline{v_{od}^2}) = 2.1$ pF.
3. **Bandwidth → $g_m$.** $g_m = C_{Ltot}\omega_u/\beta = 48.2$ mS.
4. **$I_D$.** $48.2/20.4 = 2.36$ mA.
5. **$W$.** $J_D = 3.02$ A/m, $W = 783$ µm.
6. **Capacitors.** $C_{Ltot} = C_{Ftot}(\mathrm{FO}\cdot G+1-\beta)$ gives $C_{Ftot} = 774$ fF; $C_S = C_L = 1.55$ pF. Lookup $C_{gd} = 259$ fF, so the drawn $C_F = 515$ fF.
7. **Checks.** $g_m/g_{ds} = 24.2$, so $\epsilon_s\approx-1/(\beta\,g_m/g_{ds}) = -15\%$ (too large for a real ADC: a reason to cascode). 0.1% settling: $\ln(1000)/\omega_u = 1.1$ ns.

SPICE: $f_c = 1.05$ GHz, 0.1% settling in 1.06 ns, noise about 10% below target (ignored $C_{db} = 230$ fF, about 10% of $C_{Ltot}$; partly offset in bandwidth by the ignored $r_{ds}$). Noise scaling by $S = 0.9^2 = 0.81$ would then cut the current by 19%.

### Slewing in the Sizing Loop

For a large step the pair first slews at $SR = 2I_D/C_{Ltot}$, then settles linearly. In the piecewise model of JM §6.1.3:

$$
\boxed{X = \frac{v_{OD,final}}{v_{OD,lin}} = v_{OD,final}\cdot\frac{\beta}{2}\frac{g_m}{I_D}}\qquad\boxed{\omega_u = \frac{1}{t_s}\left[X-1+\ln\frac{X}{\epsilon_d}\right]\quad(X\ge1)}
$$

- $X = 1$ is pure linear settling: $\omega_u = \ln(1/\epsilon_d)/t_s$.
- **A large $g_m/I_D$ makes $X$ larger** (the pair saturates sooner), so slewing pushes the optimum to lower $g_m/I_D$ and more current.
- No closed form: sweep $\beta$ and $g_m/I_D$ in 2-D and keep only self-consistent points (assumed $\beta$ = $\beta$ recomputed from the resulting $C_{gs}$). Or budget $t_{slew}/t_s\approx0.3$, keep $\beta = 0.75\beta_{max}$, and check.

> [!tip] Remark
> The slew-plus-linear split itself is in [[Operational Amplifiers#Slew Rate]]. What is new here is that $X$ depends on $g_m/I_D$ and $\beta$, so slewing becomes a sizing variable rather than an after-the-fact check.

JM Ex. 6.3 (same specs as Ex. 6.2, $t_s = 1.1$ ns, 0.8 V differential step): optimum moves to $g_m/I_D = 19.55$ S/A, $\beta = 0.277$, $I_D = 2.6$ mA, $C_{Ltot} = 2.09$ pF, $W = 714$ µm; $SR = 2.45$ V/ns, $t_{slew} = 176$ ps (16% of $t_s$; 32% for a 1.6 V step).

### The Second Pole

$$
\boxed{\frac{\omega_{p2}}{\omega_{u1}} = 4\ \Rightarrow\ Q = 0.5,\ \text{PM}\approx76^\circ,\ \text{fastest settling without overshoot}}
$$

| $\omega_{p2}/\omega_{u1}$ | 1 | 2 | 3 | 4 | 6 | 10 | ∞ |
|---|---|---|---|---|---|---|---|
| PM (°) | 51.8 | 65.5 | 72.4 | 76.3 | 80.7 | 84.3 | 90 |
| $\omega_u/\omega_{u1}$ | 0.786 | 0.910 | 0.953 | 0.972 | 0.987 | 0.995 | 1 |

| Settling error | $t_s/\tau$, first order | $t_s/\tau$, critically damped | Speed-up |
|---|---|---|---|
| 1% | 4.6 | 3.3 | 28% |
| 0.1% | 6.9 | 4.6 | 33% |
| 0.01% | 9.2 | 5.9 | 36% |

- Designing with the first-order count while $\omega_{p2}/\omega_{u1}\ge4$ is conservative: the real circuit settles faster (both JM OTAs beat 5 ns by 12–15%).
- Below 4 the step overshoots; avoid it in robust designs. ([[Stability]] owns phase margin; this is only the sizing target.)

### Worked Example 4: Folded-Cascode OTA (JM Exs. 6.4 to 6.6)

**Specs** (JM Table 6.6): loop gain $L_0>50$, $G = C_S/C_F = 2$, $\mathrm{FO} = C_L/C_S = 0.5$, 400 µV rms differential output noise, 0.1% settling in 5 ns, $V_{DD} = 1.2$ V, 0.8 V peak-to-peak differential output swing. PMOS input pair.

```tikz title="Final folded-cascode half circuit with every device annotated W/L (µm) and g_m/I_D. Input pair at 18.7 S/A, L = 0.2 µm; the whole output stack at 15 S/A, L = 0.4 µm. Total supply current 652 µA. After Jespers and Murmann Fig. 6.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,6.4) -- (9.0,6.4) node[right]{$V_{DD}$};
  \draw (0,-0.4) -- (9.0,-0.4) node[right]{$V_{SS}$};
  % tail source and input PMOS
  \draw (1.6,6.4) to[I, l_={$2I_{D1}=326\,\mu$A}] (1.6,4.6) coordinate (t);
  \draw (1.6,3.8) node[pmos, anchor=S](M1){};
  \draw (t) -- (M1.S);
  \draw (M1.G) -- ++(-0.4,0) node[left]{$v_{ip}$};
  \node[font=\scriptsize,align=left,anchor=west] at (2.0,3.3) {$M_1$: 119/0.2\\ 18.7 S/A};
  \draw (M1.D) -- (1.6,1.6) coordinate (xx) -- (5.0,1.6) coordinate (X);
  % output stack
  \draw (5.0,5.7) node[pmos](M5){};
  \draw (M5.S) -- (5.0,6.4);
  \draw (5.0,4.3) node[pmos](M4){};
  \draw (M5.D) -- (M4.S);
  \draw (M4.D) -- (5.0,3.4) coordinate (out);
  \draw (5.0,2.6) node[nmos](M3){};
  \draw (out) -- (M3.D);
  \draw (M3.S) -- (X);
  \draw (5.0,0.5) node[nmos](M2){};
  \draw (X) -- (M2.D);
  \draw (M2.S) -- (5.0,-0.4);
  \draw (out) -- (8.6,3.4) node[ocirc]{} node[right]{$v_{om}$};
  \foreach \m/\t in {M5/{$M_5$: 142/0.4, 15 S/A},M4/{$M_4$: 142/0.4, 15 S/A},M3/{$M_3$: 64.5/0.4, 15 S/A},M2/{$M_2$: 129/0.4, 15 S/A}} {
    \node[font=\scriptsize,anchor=west] at ([xshift=0.25cm]\m.center) {\t};
  }
  \node[font=\scriptsize,anchor=west] at (5.1,1.75) {$v_X$};
  \node[font=\scriptsize,anchor=west] at (5.3,0.0) {carries $2I_{D1}$};
\end{circuitikz}
\end{document}
```

1. **Swing → $g_m/I_D$ of the stack.** Output CM at 0.6 V, each side swings 0.4 to 0.8 V, leaving about 400 mV for two stacked devices per side: $V_{DS,min} = 200$ mV, so $g_m/I_D\ge10$. Choose **15 S/A** for M2–M5 (margin; lower would raise $f_T$ and $\omega_{p2}$, but there is little room).
2. **Gain → $L$ of the stack.** Assume $\beta = 0.75\beta_{max} = 0.25$ ($\beta_{max} = 1/3$), $\kappa = 0.7$ (current division at the folding node), all $g_m/I_D$ equal, and sweep
   $\frac{1}{L_0}\approx\frac{1}{\beta\kappa}\left(\frac{1}{(1+\frac{g_{m5}}{g_{ds5}})\frac{g_{m4}}{g_{ds4}}}+\frac{1}{(1+\frac13\frac{g_{m2}}{g_{ds2}})\frac{g_{m3}}{g_{ds3}}}\right)$. $L_0>50$ needs **$L_{2..5} = 0.4$ µm**.
3. **Phase margin → check $\omega_{p2}$.** With the stack fixed, $f_{p2}\approx\frac{(g_{m3}+g_{mb3})/2\pi}{C_{ss3}+2C_{dd2}} = 1.45$ GHz ($f_T$ of M3 is 1.96 GHz). The swing and gain choices have already set the second pole.
4. **Settling → $f_{u1}$.** $f_{u1} = \ln(1/\epsilon_d)/(2\pi t_s) = 220$ MHz. $f_{p2}/f_{u1} = 6.6$, so PM about 81° and the first-order estimate is safe.
5. **Noise, $g_m$, input $g_m/I_D$ together** (2-D sweep over $\beta$ and $(g_m/I_D)_1$, keeping self-consistent points):
   $\overline{v_{od}^2} = \alpha\frac{kT}{\beta C_{Ltot}}$, $\alpha = 2\gamma_1\left(1+\frac{\gamma_5(g_m/I_D)_5}{\gamma_1(g_m/I_D)_1}+2\frac{\gamma_2(g_m/I_D)_2}{\gamma_1(g_m/I_D)_1}\right)$, $\omega_{u1} = \beta\kappa g_{m1}/C_{Ltot}$, $C_{Ltot} = [C_L+(1-\beta)C_F](1+r_{self})$, $\beta = C_F/(C_F+C_S+C_{in})$, $C_{in}\approx C_{gg1}+C_{gd1}g_{m1}/g_{m3}$. $\gamma = 0.7$.
   Across $L_1 = 0.1$–0.4 µm: little gain past 0.2 µm, and at 0.4 µm the self-loading reaches 40% of $C_{Ltot}$. Take **$L_1 = 0.2$ µm**.
6. **Iterate self-loading** (converges in four passes): **$(g_m/I_D)_1 = 18.7$ S/A, $I_{D1} = 163$ µA**, $\beta/\beta_{max} = 0.728$, $C_{Ltot} = 508$ fF, $r_{self} = 0.23$. Input $f_T\approx2.5$ GHz, about $11f_{u1}$ (the strong-inversion rule said 6×; self-loading and moderate inversion explain the gap).
7. **De-normalize.** $W = I_D/J_D$ per device: $W_1 = 119$ µm; $W_2 = 129$ µm (carries $2I_{D1}$), $W_3 = W_2/2 = 64.5$ µm; $W_4 = W_5 = 142$ µm. Capacitors from $C_{Ltot}$: $C_F = 224$ fF, $C_S = 448$ fF, $C_L = 224$ fF.

SPICE: loop $f_u = 207.9$ MHz, PM about 81°, $L_0 = 88$ (38.9 dB), 0.1% settling in 4.39 ns, integrated noise about 400 µV. Total 652 µA.

> [!note]- Detail: the simplified folded-cascode flow (JM §6.4.1), spreadsheet-sized
> 1. Design the cascode stack from swing and loop gain (steps 1–3 above).
> 2. Budget slewing at about 30% of $t_s$; compute the $\omega_{u1}$ target.
> 3. Assume $r_{self} = 0.4$.
> 4. Assume $\beta = 0.75\beta_{max}$.
> 5. Excess-noise factor $\alpha$ with all $g_m/I_D$ equal (fix the noise afterwards by scaling).
> 6. $C_{Ltot}$ from noise; $C_S$, $C_F$, $C_L$ from $G$, FO, $r_{self}$.
> 7. $\kappa = 0.7$.
> 8. $g_{m1}$ from $\omega_{u1}$.
> 9. $C_{gg1}$ from $\beta$ and the capacitors (ignore the Miller term).
> 10. $f_{T1}$, then $(g_m/I_D)_1$, then $I_{D1}$.
> 11. Compute $X$ and the real settling time; adjust the slew budget.
> 12. Check every assumption ($r_{self}$, $\kappa$, $\alpha$) against the sized circuit; recompute.
> 13. Size; if the input pair is huge, lower $(g_m/I_D)_1$.
> 14. SPICE, small-signal first.

### Two-Stage Miller OTA

The second stage is a charge amplifier ([[Operational Amplifiers#Single-Ended Two-Stage (Miller) Op Amp]] owns the topology). Two primary knobs, the rest set a priori:

$$
\boxed{\text{knobs: } \beta/\beta_{max}\ \text{and}\ C_{Ltot}/C_C}\qquad\boxed{C_{gs2}/C_C\approx\tfrac13,\ \ \beta\approx0.75\beta_{max},\ \ C_{Ltot}\approx C_C\ \text{(start)}}\qquad\boxed{I_{D2} > I_{D1}\left(1+\frac{C_{Ltot}}{C_C}\right)}
$$

$$
\overline{v_{od}^2} = 2\frac{kT}{\beta C_C}\gamma_1\left(1+\frac{\gamma_3g_{m3}}{\gamma_1g_{m1}}\right)+2\frac{kT}{C_{Ltot}}\left(1+\gamma_2\left(1+\frac{\gamma_4g_{m4}}{\gamma_2g_{m2}}\right)\right),\qquad\omega_{p2}\approx\frac{g_{m2}}{C_1}\frac{1}{1+\frac{C_{Ltot}}{C_C}+\frac{C_{Ltot}}{C_1}}
$$

- **Noise → $C_C$** (and $C_{Ltot}$ through the ratio); **$\omega_{u1}$ → $g_{m1}$**, then $(g_m/I_D)_1$ from $C_{gg1}$; **$\omega_{p2}$ → $g_{m2}$**, then $(g_m/I_D)_2$ from $C_1 = C_{gs2}(1+r_{self1})$.
- Use the full $\omega_{u1}$ expression with finite $g_mR$: the textbook $\beta g_{m1}/C_C$ can be 40% off when $C_1$, $C_C$, $C_{Ltot}$ are comparable and $g_mR\approx10$.
- $\omega_{p2}$ cannot pass $\omega_{T2}$; with comparable capacitors it sits at $f_{T2}/3$ to $f_{T2}/5$.
- **The slew condition is mandatory:** otherwise the two half circuits slew at different rates, the common mode drifts, and CMFB (slower) leaves a settling tail.

> [!example]- JM Exs. 6.7 and 6.8: two-stage OTA, same specs as the folded cascode
> Fixed a priori: $L_1 = L_4 = 0.15$ µm (PMOS), $L_2 = L_3 = 0.2$ µm (NMOS), $g_{m3}/g_{m1} = 1$, $g_{m4}/g_{m2} = 0.5$, $\gamma = 0.8$, $f_{p2}/f_{u1} = 6$ (PM about 80°), $f_{u1} = 220$ MHz.
> 2-D sweep of $\beta/\beta_{max}$ and $C_{Ltot}/C_C$: minimum 318 µA at 0.84 and 0.56 without self-loading; 387 µA after iterating it. Sweeping $C_{gs2}/C_C$ from 0.1 to 0.6 is remarkably flat; 0.3 chosen.
>
> | Parameter | Value | Parameter | Value |
> |---|---|---|---|
> | $C_{gs2}/C_C$ | 0.3 | $(g_m/I_D)_1$ | 15.2 S/A |
> | $\beta/\beta_{max}$ | 0.81 | $(g_m/I_D)_2$ | 20.6 S/A |
> | $C_{Ltot}/C_C$ | 0.53 | $C_S$ | 198 fF |
> | $r_{self1}$, $r_{self2}$ | 0.40, 0.28 | $C_C$ | 416 fF |
> | $I_{D1}$, $I_{D2}$ | 157, 196 µA | total | 706 µA |
>
> Widths ($W/L$ in µm): M1 48.4/0.15, M3 32.3/0.2 (15.2 S/A), M2 120.3/0.2, M4 22.1/0.15 (10.3 S/A). $C_n = C_{gd1} = 17$ fF; added $C_C = C_C-C_{gd2} = 375$ fF ($C_{gd2} = 41.7$ fF); $R_Z = 1/g_{m2} = 247\ \Omega$.
> SPICE: $f_u = 203.4$ MHz, PM about 80°, $L_0 = 93$, 0.1% settling in 4.24 ns, noise 9% high (fix by scaling everything 9%, or a slightly larger $C_C$).
> Versus the folded cascode: 706 vs 652 µA. Pick the two-stage for output swing, the folded cascode for input CM range.

## Level 4: Corners and What the Table Cannot See

### Design for Corners by Pre-Distorting the Spec

| Bias style | Holds constant | Spread over process and temperature (65 nm, $L = 100$ nm) |
|---|---|---|
| Constant $I_D$ | $J_D$ | $g_m/I_D$ and so $g_m$: about ±30%; $f_T$ about ±25% |
| Constant $g_m$ | $g_m/W$, GBW | $g_m/I_D$ ±50%, so $I_D$ −50% to +100%; $V_{D,sat}$ up to +200 mV slow/hot |

$$
\boxed{\text{size with nominal tables for } \frac{\text{spec}}{1-\Delta_{worst}}\ \ \text{(e.g. } \omega_u/0.7 \text{ at constant } I_D\text{), then verify every corner in SPICE}}
$$

- Corner pairing: fast with cold (−40 °C), slow with hot (125 °C) gives the widest current spread.
- Moderate inversion is the robust place: $V_{D,sat}$ and $g_m/g_{ds}$ spread least there.
- Most real designs bias between constant-$I_D$ and constant-$g_m$ (a constant-$g_m$ reference holds $g_m$ within about ±4%: [[Biasing]]).

> [!example] JM Ex. 5.11: charge amplifier, 3 GHz across corners
> Constant-current bias, so $g_m$ can drop 30% slow/hot. Design nominal for $3/0.7 = 4.2$ GHz (and 50 pA/√Hz at 4.2 GHz). New optimum: 20.5 S/A (was 21.9), $f_T = 9.08$ GHz; current only about 10% above the 3 GHz design. SPICE: $f_c$ = 3.19 / 4.37 / 5.74 GHz (slow-hot / nominal / fast-cold); noise at 3 GHz 46.8 / 35.4 / 27.7 pA/√Hz. Spec met at every corner. Noise spreads a bit more than bandwidth because of the extra $kT$.

### Shallow Optima: Trade Current for Area

$$
\boxed{\text{near the minimum-current } g_m/I_D,\ \text{a few S/A lower costs} \sim20\%\ I_D\ \text{and saves} \sim45\%\ W}
$$

JM Ex. 5.9: charge amplifier moved from the 21.9 S/A optimum to 18 S/A: $I_D$ +22%, $W$ −45% (495 → 272 µm). Only works when the curve is shallow (short $L$, speed well below the technology limit); near the bandwidth limit the optimum is sharp.

### What the Table Cannot See

- **Terminal voltages are guesses** until the circuit is solved: the table is exact for the $V_{DS}$, $V_{SB}$ you give it. Re-look-up once the bias is known (JM Ex. 3.12 iterates $V_{GS2}$ to get $V_{DS1}$). Residual sizing error comes from here, not from the model.
- **Width dependence** (JM App. 3, 65 nm, tables at five 2 µm fingers): for $W>2$ µm, $g_m/I_D$ is within about 1%, $g_m/C_{gg}$ about 2%, but **$g_m/g_{ds}$ 10–20%** at long $L$ in weak inversion. Give gain margin. At minimum width (0.2 µm) the $f_T$ prediction is 40% off.
- **Layout effects** (STI stress, well proximity) shift $\mu$ and $V_T$ by placement; size first, extract only to verify.

> [!note]- Detail: the three lookup modes and their traps (JM App. 2; Zettelkasten 16x, 16x2, 16x3)
> 1. **Read** a stored quantity at given $(L, V_{GS}, V_{DS}, V_{SB})$, interpolated linearly in all four.
> 2. **Ratio** of two stored quantities at given voltages ($g_m/I_D$, $g_m/C_{gg}$, $I_D/W$).
> 3. **Cross-lookup:** one ratio as a function of another ($J_D$ at a given $g_m/I_D$), done by intersecting the two along the $V_{GS}$ sweep. This is the mode sizing uses.
>
> Cross-lookup needs a monotone index:
> - $g_m/I_D$ versus $V_{GS}$ **folds over at very low $V_{GS}$** (leakage divides the current, worst at long $L$ and large $V_{SB}$). Discard the weak side of the peak.
> - $g_m/C_{gg}$ **peaks then falls at high $V_{GS}$** (mobility degradation). Discard the strong side.
> - Any other ratio used as an index needs its range limited by hand.
>
> Defaults when an argument is omitted (JM's Matlab tables): $L = L_{min}$, $V_{DS} = V_{DD}/2$, $V_{SB} = 0$.

> [!tip] Remark
> Where this method sits in the full flow (intents stored as $g_m/I_D$ and $L$, re-solved per kit, then centred over corners and mismatch) is the owner's [[Analog Design Flow]], with centring in [[Design Centering]] and minimum-area sign-off in [[The Minimum, the Loop, and the Sign-off]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $g_m/I_D$ (input device) | $g_m$ per amp (power), noise per amp, swing ($V_{D,sat}$↓), offset drift (weak inv.) | $f_T$↓ so $C_{gs}$↑, $\beta$↓; width; HD3; slewing starts sooner ($X$↑) |
| ↓ $g_m/I_D$ (loads, mirrors) | Load noise and offset contribution, mirror match at fixed area | Headroom ($V_{D,sat}$↑), less output swing |
| ↑ $L$ | $g_m/g_{ds}$, $L_0$, CMRR, (less so) matching | $f_T$↓: second pole drops, self-loading and width grow |
| ↑ $\beta$ toward $\beta_{max}$ | Every $g_m$ works harder: less current for $\omega_u$, less noise | Needs smaller $C_{gs}$: lower $g_m/I_D$, more current. Optimum at $0.75\beta_{max}$ |
| ↑ FO ($C_L/C_S$, or $C_L/C_{gg}$) | Device does less self-loading | Stage works harder: current up, optimum moves toward strong inversion |
| ↑ $\omega_{p2}/\omega_u$ | Phase margin, no overshoot | Past 4: slower settling; cascode $f_T$ costs gain or current |
| Slew budget $t_{slew}/t_s$ | Allows a larger step | Less time for linear settling: higher $\omega_u$, lower $g_m/I_D$ |
| Scale all $C$, $W$, $I_D$ by $S$ | Noise power by $1/S$; speed unchanged | Power and area by $S$ |
| Off the minimum-current point (lower $g_m/I_D$) | Width −45% | Current +20% |
| Constant-$g_m$ bias | GBW over corners | $I_D$ spreads 4×, $V_{D,sat}$ rises slow/hot |

## Cheat sheet

| Quantity | Equation |
|---|---|
| De-normalization | $I_D = g_m/(g_m/I_D)$, $W = I_D/J_D$ |
| Saturation voltage | $V_{D,sat}\approx2/(g_m/I_D)$ |
| IGS bandwidth | $\omega_u = g_m/C_L$ |
| IGS gain | $\lvert A_{v0}\rvert = g_m/g_{ds}$ |
| Device fan-out | $\mathrm{FO} = C_L/C_{gg} = \omega_T/\omega_u\gtrsim10$ |
| Active-load CS gain | $\lvert A_{v0}\rvert = (g_m/I_D)_1/[(g_{ds}/I_D)_1+(g_{ds}/I_D)_2]$ |
| Resistive-load CS gain | $\lvert A_{v0}\rvert = (g_m/I_D)_1/[1/V_{EA1}+1/(I_DR)]$ |
| Self-loading scale factor | $S = 1/(1-C_{dd1}/C_L)$ |
| Self-loading iteration | $g_m = \omega_u(C_L+W\cdot C_{dd}/W)$ |
| Max gain at fixed $f_T$ | gain contour tangent to $f_T$ contour |
| SC loop bandwidth | $\omega_u = \beta g_m/C_{Ltot}$, $C_{Ltot} = C_L+(1-\beta)C_{Ftot}$ |
| Feedback factor | $\beta = C_F/(C_F+C_S+C_{gs})$, $\beta_{max} = 1/(1+G)$ |
| Settling time constant | $\tau = t_s/\ln(1/\epsilon_d)$ |
| Static gain error | $\epsilon_s\approx-1/L_0 = -1/(\beta g_mr_{ds})$ |
| Sampled noise (basic OTA) | $\overline{v_{od}^2} = 2\gamma_nkT/(\beta C_{Ltot})$ |
| Minimum-current objective | minimise $K = \frac{1}{\beta^2}\frac{I_D}{g_m}$ |
| First-order optimum | $\beta = \frac34\beta_{max}$, $\omega_{Ti}/\omega_u = 3(\mathrm{FO}\cdot G+1)$, $C_{gs} = (C_S+C_{Ftot})/3$ |
| Slewing parameter | $X = v_{OD,final}\,\frac{\beta}{2}\frac{g_m}{I_D}$ |
| Bandwidth with slewing | $\omega_u = \frac{1}{t_s}[X-1+\ln(X/\epsilon_d)]$ |
| Slew rate (single stage) | $SR = 2I_D/C_{Ltot}$ |
| Second-pole target | $\omega_{p2}/\omega_{u1} = 4$: $Q = 0.5$, PM 76° |
| Folded-cascode bandwidth | $\omega_{u1} = \beta\kappa g_{m1}/C_{Ltot}$, $C_{Ltot} = [C_L+(1-\beta)C_F](1+r_{self})$ |
| Folded-cascode noise | $\overline{v_{od}^2} = \alpha kT/(\beta C_{Ltot})$ |
| Two-stage slew symmetry | $I_{D2}>I_{D1}(1+C_{Ltot}/C_C)$ |
| Corner pre-distortion | design nominal for spec$/(1-\Delta_{worst})$; $\Delta_{g_m}\approx30\%$ at constant $I_D$ |
| Switch on-resistance | $R_{on} = 1/(2f_{clk}C\ln(1/\epsilon))$ |

## References

- **Jespers & Murmann, *Systematic Design of Analog CMOS Circuits Using Pre-Computed Lookup Tables*** (Cambridge, 2017; PDF page = printed page):
  - Ch. 3, pp. 105–172: §3.1 IGS (Eqs. 3.1–3.11, Exs. 3.1–3.7, Tables 3.1–3.10), §3.2 CS with active and resistive load (Eqs. 3.12–3.14, Exs. 3.8–3.10), §3.3 differential pairs (Exs. 3.11–3.13).
  - Ch. 4, pp. 173–232: §4.1 noise in sizing (Eqs. 4.4–4.9, Exs. 4.1–4.2), §4.1.4 flicker corner, §4.2.2 pair distortion (Ex. 4.4, Table 4.1), §4.3 mismatch (Eqs. 4.50, 4.57), used only for the constraint table.
  - Ch. 5, pp. 236–311: §5.5.4 charge amplifier at constant noise and bandwidth (Exs. 5.7–5.9), §5.6 process corners (Figs. 5.36–5.39, Ex. 5.11, Table 5.16).
  - Ch. 6, pp. 314–395: §6.1 basic OTA (Eqs. 6.1–6.37, Exs. 6.1–6.3, Tables 6.1–6.3), §6.2 folded cascode (Eqs. 6.38–6.59, Tables 6.4–6.5, Exs. 6.4–6.6, Fig. 6.20), §6.3 two-stage (Eqs. 6.60–6.76, Exs. 6.7–6.8, Table 6.7, Fig. 6.29), §6.4 simplified flows, §6.5 switch sizing (Ex. 6.9).
  - App. 2 (lookup modes), App. 3 (width dependence), via the Zettelkasten.
- **ECE 636 (Fall 2026, Levine) slides:** "Designing for Gain and Bandwidth" (9/28: $g_mr_o$ and $f_T$ as the two design FOMs, $I_D/W$ region boundaries 0.1 and 10 A/m); "Characterizing Transistor Performance for Design" (10/06: design approach, CS amplifier example, slides 54–70).
- **Zettelkasten extensions** (`AnalogTheory/`): `S16 gm-ID Sizing Methodology` §§5, 6, 8, 9, 12 (16e7 terminal-voltage error, 16x/16x2/16x3 lookup modes and non-monotonic indices, 16y5–16y7 width dependence); `S17 Practical Sizing Case Studies` §§3, 7–10 (reading order for the case studies).
