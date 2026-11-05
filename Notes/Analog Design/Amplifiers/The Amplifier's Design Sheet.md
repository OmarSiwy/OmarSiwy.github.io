---
title: The Amplifier's Design Sheet
description: One-page quick reference for picking and sizing a CMOS amplifier, every formula linked to the note that derives it.
kind: topic
status: growing
aliases:
  - The Amplifier's Design Sheet
  - Amplifier Design Sheet
  - Amplifier Cheat Sheet
---

The page to open when you need an amplifier. Nothing is derived here: each row links to the note that owns the result. Device labels ($M_1$, $M_7$, …) follow the linked section's figure, not one global numbering.

**Map:** [[#Topology map|topology map]] → [[#Master comparison|master comparison]] → [[#Spec to topology|spec → topology]] → [[#Sizing checklist|sizing checklist]] → [[#Compensation quick reference|compensation]] → [[#Common mistakes and sanity checks|sanity checks]].

## Topology map

```tikz title="The amplifier zoo on one screen, each with its one-line result. Redrawn from the figures in the owner notes (Razavi Chs. 3, 4, 5, 9; Carusone Fig. 6.3)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,font=\small,scale=0.85,transform shape]
  % ---------- row 1: CS, CG, CD, cascode ----------
  \begin{scope}[shift={(0,0)}]
    \node[font=\bfseries] at (0,5.0) {CS};
    \draw (0,0) node[nmos](a){} node[right=2pt,font=\scriptsize] at (a.center) {$M_1$};
    \draw (a.S) node[ground]{};
    \draw (a.D) ++(0,2.2) node[vcc]{$V_{DD}$} to[I] (a.D);
    \draw (a.D) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{out};
    \draw (a.G) -- ++(-0.4,0) node[ocirc]{} node[left]{in};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-2.9) {$A_v=-g_{m1}(r_{o1}\|r_{o2})\approx g_mr_o/2$\\ $R_{out}=r_{o1}\|r_{o2}$, swing $V_{DD}-2V_{ov}$\\ Miller input pole, RHP zero $g_m/C_{GD}$};
  \end{scope}
  \begin{scope}[shift={(6.2,0)}]
    \node[font=\bfseries] at (0,5.0) {CG};
    \draw (0,0) node[nmos](b){};
    \draw (b.G) -- ++(-0.4,0) node[left]{$V_b$};
    \draw (b.S) -- ++(0,-0.3) node[ocirc]{} node[right]{in};
    \draw (b.D) ++(0,2.2) node[vcc]{$V_{DD}$} to[R,l=$R_D$] (b.D);
    \draw (b.D) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-2.9) {$A_v\approx(g_m+g_{mb})(R_D\|r_o)$\\ $R_{in}\approx1/(g_m+g_{mb})$ (small $R_D$)\\ no Miller: poles $\approx g_m/C_S$, $1/R_DC_D$};
  \end{scope}
  \begin{scope}[shift={(12.4,0)}]
    \node[font=\bfseries] at (0,5.0) {CD (follower)};
    \draw (0,0.6) node[nmos](c){};
    \draw (c.D) -- ++(0,0.4) node[vcc]{$V_{DD}$};
    \draw (c.G) -- ++(-0.4,0) node[ocirc]{} node[left]{in};
    \draw (c.S) to[I] ++(0,-1.4) node[ground]{};
    \draw (c.S) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-2.9) {$A_v\to1/(1+\eta)<1$\\ $R_{out}=1/(g_m+g_{mb})$, costs one $V_{GS}$\\ $Z_{out}$ inductive: rings with $C_L$};
  \end{scope}
  \begin{scope}[shift={(18.6,0)}]
    \node[font=\bfseries] at (0,5.0) {cascode};
    \draw (0,-0.4) node[nmos](d1){};
    \draw (0,1.15) node[nmos](d2){};
    \draw (d1.D) -- (d2.S);
    \draw (d1.S) node[ground]{};
    \draw (d1.G) -- ++(-0.4,0) node[ocirc]{} node[left]{in};
    \draw (d2.G) -- ++(-0.4,0) node[left]{$V_b$};
    \draw (d2.D) ++(0,1.4) node[vcc]{$V_{DD}$} to[I] (d2.D);
    \draw (d2.D) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-2.9) {$R_{out}\approx g_{m2}r_{o2}r_{o1}$, $A_v\to(g_mr_o)^2$\\ (with a cascode load)\\ swing $V_{DD}-4V_{ov}$; pole $g_{m2}/C_X$};
  \end{scope}
  % ---------- row 2: folded cascode, diff pair, 5T OTA, telescopic ----------
  \begin{scope}[shift={(0,-10.6)}]
    \node[font=\bfseries] at (0,5.0) {folded cascode};
    \draw (-0.9,1.6) node[pmos](e1){};
    \draw (e1.S) node[vcc]{$V_{DD}$};
    \draw (e1.G) -- ++(-0.4,0) node[ocirc]{} node[left]{in};
    \draw (e1.D) -- (-0.9,-0.9) coordinate(X) -- (0.9,-0.9);
    \draw (X) node[circ]{} node[left]{$X$} to[I,l_=$I_1$] ++(0,-1.3) node[ground]{};
    \draw (0.9,-0.13) node[nmos](e2){};
    \draw (e2.S) -- (0.9,-0.9);
    \draw (e2.G) -- ++(-0.35,0) node[left,font=\scriptsize]{$V_b$};
    \draw (e2.D) ++(0,1.9) node[vcc]{} to[I] (e2.D);
    \draw (e2.D) node[circ]{} -- ++(0.6,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-3.1) {$R_{out}\approx g_{m2}r_{o2}(r_{o1}\|r_{o3})$\\ input not under the cascode\\ more current ($I_1=|I_{D1}|+I_{D2}$)};
  \end{scope}
  \begin{scope}[shift={(6.2,-10.6)}]
    \node[font=\bfseries] at (0,5.0) {diff pair};
    \draw (-0.75,0) node[nmos](f1){};
    \draw (0.75,0) node[nmos,xscale=-1](f2){};
    \draw (f1.S) -- (f2.S);
    \draw (0,0 |- f1.S) node[circ]{} to[I,l=$I_{SS}$] ++(0,-1.3) node[ground]{};
    \draw (f1.G) -- ++(-0.3,0) node[left]{$v_1$};
    \draw (f2.G) -- ++(0.3,0) node[right]{$v_2$};
    \draw (f1.D) ++(0,2.0) node[vcc]{} to[R] (f1.D);
    \draw (f2.D) ++(0,2.0) node[vcc]{} to[R] (f2.D);
    \node[align=left,font=\footnotesize,anchor=north] at (0,-3.1) {$A_{dm}=-g_m(R_D\|r_o)$ (half circuit = CS)\\ CMRR $\approx 2g_m^2R_{SS}/\Delta g_m$\\ noise $2\times$ half circuit};
  \end{scope}
  \begin{scope}[shift={(12.4,-10.6)}]
    \node[font=\bfseries] at (0,5.0) {5T OTA};
    \draw (-1.0,0) node[nmos](g1){};
    \draw (1.0,0) node[nmos,xscale=-1](g2){};
    \draw (g1.S) -- (g2.S);
    \draw (0,0 |- g1.S) node[circ]{} to[I,l=$I_{SS}$] ++(0,-1.3) node[ground]{};
    \draw (g1.G) -- ++(-0.3,0) node[left]{$v_1$};
    \draw (g2.G) -- ++(0.3,0) node[right]{$v_2$};
    \draw (-1.0,2.3) node[pmos,xscale=-1](g3){};
    \draw (1.0,2.3) node[pmos](g4){};
    \draw (g3.D) -- (g1.D); \draw (g4.D) -- (g2.D);
    \draw (g3.S) node[vcc]{}; \draw (g4.S) node[vcc]{};
    \draw (g3.G) -- (g4.G);
    \draw (0,0 |- g3.G) node[circ]{} -- ++(0,-0.55) -| (g3.D);
    \draw (g2.D) ++(0,0.4) node[circ]{} -- ++(0.9,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0,-3.1) {$|A_v|\approx g_{m1}(r_{o2}\|r_{o4})$\\ mirror pole $g_{m3}/C_E$, zero $2\times$\\ $V_{out}\ge V_{in,CM}-V_{TH}$};
  \end{scope}
  \begin{scope}[shift={(18.6,-10.6)}]
    \node[font=\bfseries] at (0,5.6) {telescopic (half)};
    \draw (0,-0.9) node[nmos](h1){};
    \draw (0,0.6) node[nmos](h3){};
    \draw (0,2.25) node[pmos](h5){};
    \draw (0,3.75) node[pmos](h7){};
    \draw (h1.D) -- (h3.S); \draw (h3.D) -- (h5.D); \draw (h5.S) -- (h7.D);
    \draw (h7.S) node[vcc]{};
    \draw (h1.S) to[I] ++(0,-0.9) node[ground]{};
    \draw (h1.G) -- ++(-0.3,0) node[left]{in};
    \foreach \m/\v in {h3/b1,h5/b2,h7/b3} \draw (\m.G) -- ++(-0.3,0) node[left,font=\scriptsize]{$V_{\v}$};
    \foreach \m/\l in {h1/1,h3/3,h5/5,h7/7} \node[font=\scriptsize,right] at (\m.center) {$M_\l$};
    \draw (h3.D) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-3.1) {$A_v\approx g_{m1}[(g_{m3}r_{o3}r_{o1})\|(g_{m5}r_{o5}r_{o7})]$\\ 5 overdrives stacked: least swing\\ fastest, least power and noise};
  \end{scope}
  % ---------- row 3: folded-cascode OTA, two-stage, gain-boosted, legend ----------
  \begin{scope}[shift={(0,-21.4)}]
    \node[font=\bfseries] at (0,5.6) {folded-cascode OTA (half)};
    \draw (-1.1,3.2) node[vcc]{} to[I] (-1.1,2.2);
    \draw (-1.1,1.4) node[pmos](k1){};
    \draw (k1.S) -- (-1.1,2.2);
    \draw (k1.G) -- ++(-0.3,0) node[left]{in};
    \draw (k1.D) |- (0.9,-0.4) coordinate(Xk);
    \draw (0.9,-1.2) node[nmos](k5){};
    \draw (k5.S) node[ground]{};
    \draw (0.9,0.35) node[nmos](k3){};
    \draw (k5.D) -- (k3.S);
    \draw (0.9,2.0) node[pmos](k7){};
    \draw (0.9,3.5) node[pmos](k9){};
    \draw (k3.D) -- (k7.D); \draw (k7.S) -- (k9.D); \draw (k9.S) node[vcc]{};
    \foreach \m/\l in {k5/5,k3/3,k7/7,k9/9} \node[font=\scriptsize,right] at (\m.center) {$M_\l$};
    \node[font=\scriptsize,right] at (k1.center) {$M_1$};
    \draw (Xk) node[circ]{};
    \draw (k3.D) node[circ]{} -- ++(0.7,0) node[ocirc]{} node[right]{out};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-3.1) {$A_v\approx g_{m1}R_{out}$, $R_{out}$ has $r_{o1}\|r_{o5}$\\ swing: 4 overdrives per side\\ lower folding pole, more power};
  \end{scope}
  \begin{scope}[shift={(6.2,-21.4)}]
    \node[font=\bfseries] at (0,5.0) {two-stage Miller};
    \draw (-1.6,1.0) rectangle (-0.4,0) node[pos=0.5,font=\scriptsize,align=center]{stage 1\\$g_{m1}$};
    \draw (-1.6,0.75) -- ++(-0.3,0) node[left]{$+$};
    \draw (-1.6,0.25) -- ++(-0.3,0) node[left]{$-$};
    \draw (-0.4,0.5) -- (0.0,0.5) coordinate(v1) -- (0.0,-0.4) -- ++(1.2,0) coordinate(g7);
    \draw (2.6,-0.4) node[nmos](m7){};
    \draw (g7) -- (m7.G);
    \draw (m7.S) node[ground]{};
    \draw (m7.D) ++(0,2.0) node[vcc]{} to[I] (m7.D);
    \draw (v1) node[circ]{} node[above left,font=\scriptsize]{$v_1$} -- (0,1.5) to[R,l=$R_C$] (0.9,1.5) to[C,l=$C_C$] (1.8,1.5) -- (1.8,0.37) -- (m7.D);
    \draw (m7.D) node[circ]{} -- ++(0.7,0) node[ocirc]{} node[right]{out};
    \node[font=\scriptsize,right] at (m7.center) {$M_7$};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-3.1) {$A_v\approx(g_mr_o/2)^2$, swing $V_{DD}-2V_{ov}$\\ $\omega_{ta}=g_{m1}/C_C$, $\omega_{p2}\approx g_{m7}/(C_1+C_2)$\\ RHP zero $g_{m7}/C_C$; SR $=I_{D5}/C_C$};
  \end{scope}
  \begin{scope}[shift={(12.4,-21.4)}]
    \node[font=\bfseries] at (0,5.0) {gain-boosted cascode};
    \draw (0,-0.6) node[nmos](n1){};
    \draw (0,1.0) node[nmos](n2){};
    \draw (n1.D) -- (n2.S);
    \draw (n1.S) node[ground]{};
    \draw (n1.G) -- ++(-0.3,0) node[left]{in};
    \draw (n2.D) ++(0,1.5) node[vcc]{} to[I] (n2.D);
    \draw (n2.D) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{out};
    \draw (n1.D) ++(0,0.0) node[circ]{} node[right,font=\scriptsize]{$P$};
    \draw (-1.6,1.5) -- (-1.6,0.5) -- (-0.8,1.0) -- cycle;
    \node[font=\scriptsize] at (-1.35,1.0) {$A_1$};
    \draw (-0.8,1.0) -- (n2.G);
    \draw (-1.6,0.7) -| (-1.9,0.2) -| (n1.D);
    \draw (-1.6,1.3) -- ++(-0.5,0) node[left,font=\scriptsize]{$V_b$};
    \node[align=left,font=\footnotesize,anchor=north] at (0.2,-3.1) {$R_{out}\approx(A_1+1)g_{m2}r_{o2}r_{o1}$\\ cascode swing, no extra stack\\ booster doublet: slow settling tail};
  \end{scope}
  \begin{scope}[shift={(18.6,-21.4)}]
    \node[align=left,font=\scriptsize,anchor=north west,draw,rounded corners,inner sep=5pt] at (-2.2,4.4) {\textbf{Notation}\\[2pt]
      every output drives $C_L$\\
      $V_{ov}\approx V_{D,sat}\approx 2/(g_m/I_D)$\\
      $g_mr_o$: intrinsic gain, 5--10\\ in nanometer CMOS\\[3pt]
      \textbf{One-stage (OTA)}\\ GBW $=g_{m1}/C_L$ for all;\\ cascoding adds gain, not GBW\\[3pt]
      \textbf{Labels} follow each\\ owner note's figure};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The four facts every row below obeys
> 1. **Gain** $A_v = G_mR_{out}$; each cascode multiplies $R_{out}$ by $g_mr_o$ and costs one $V_{ov}$ of swing ([[Single-Stage#The Gm·Rout Lemma]], [[Single-Stage#Headroom]]).
> 2. **Speed** of a one-pole stage is $\text{GBW} = g_m/C_L$, whatever $R_{out}$ is ([[Frequency Response#Level 3 Gain-Bandwidth Trade-Offs]]). In a loop, $\omega_t = \beta\,\omega_u$.
> 3. **Noise** is set by the input $g_m$; every load adds $g_{m,load}/g_{m,in}^2$ ([[Noise#Op-Amp Circuits]]).
> 4. **Two stages** buy swing and pay with a second pole that must be compensated ([[Stability#Level 4 Compensating Two-Stage Op Amps]]).

## Master comparison

Thermal noise only; add flicker $K/(C_{ox}WLf)$ per device, referred the same way ([[Noise#Level 1 Device Noise Sources]]). "Swing" is the output range with every device saturated; $V_{ov}\approx V_{D,sat}\approx 2/(g_m/I_D)$.

### Single-transistor stages and the cascode

| Topology | $A_v$ | $R_{in}$ | $R_{out}$ | Swing / headroom | Poles (dominant; non-dominant) | Input-referred noise | Power | When to use |
|---|---|---|---|---|---|---|---|---|
| **CS**, current-source load ([[Single-Stage#Choosing the Load]], [[Frequency Response#Common Source]]) | $-g_{m1}(r_{o1}\parallel r_{o2})\approx g_mr_o/2$ | $\infty$ (gate) | $r_{o1}\parallel r_{o2}$ | $V_{ov1}\le V_{out}\le V_{DD}-\lvert V_{ov2}\rvert$ | Output $1/(R_{out}C_L)$; input (Miller) $1/\{R_S[C_{GS}+(1+g_mR_D)C_{GD}]\}$; RHP zero $+g_m/C_{GD}$ | $4kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m2}}{g_{m1}^2}\right)$ | $I_D$ | The gain stage; the output stage of a two-stage op amp |
| **CS**, resistor $R_D$ ([[Single-Stage#Resistive Load]]) | $-g_m(R_D\parallel r_o) = -2V_{RD}/V_{OV}$ | $\infty$ | $R_D\parallel r_o$ | top $\approx V_{DD}$, but $I_DR_D$ is lost to DC | as above | $4kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)$ | $I_D$ | Low-gain, low-cap, accurate; wideband |
| **CG** ([[Single-Stage#Common-Gate Stage]], [[Frequency Response#Common Gate]]) | $\approx(g_m+g_{mb})(R_D\parallel r_o)$, non-inverting | $\frac{R_D+r_o}{1+(g_m+g_{mb})r_o}\approx\frac{1}{g_m+g_{mb}}$ (small $R_D$) | $R_D\parallel\{r_o+[1+(g_m+g_{mb})r_o]R_S\}$ | as CS; input enters at the source | $\omega_{in}=1/[(C_{GS}+C_{SB})(R_S\parallel\frac{1}{g_m+g_{mb}})]$, $\omega_{out}=1/[R_D(C_{GD}+C_{DB})]$; no Miller | $\overline{V^2_n}=\frac{4kT(\gamma g_m+1/R_D)}{(g_m+g_{mb})^2}$, $\overline{I^2_n}=\frac{4kT}{R_D}$ | $I_D$ | Low-$R_{in}$ input (current, termination), current buffer, cascode device |
| **CD / source follower** ([[Single-Stage#Source Follower]], [[Frequency Response#Source Follower]]) | $\frac{g_mR_S}{1+(g_m+g_{mb})R_S}\to\frac{1}{1+\eta}<1$ | $\infty$, $C_{GS}$ bootstrapped | $\frac{1}{g_m+g_{mb}}$ | loses one $V_{GS}$ (level shift) | $1/[R_SC_{GD}+(C_L+C_{GS})/g_m]$; $Z_{out}$ inductive for $R_S>1/g_m$ | $4kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m2}}{g_{m1}^2}\right)$ | $I_D$ | Buffer, level shift, driving low $R_L$ |
| **Cascode** (telescopic, single-ended) ([[Single-Stage#Cascode]], [[Frequency Response#Cascode]]) | $\approx g_{m1}[(g_{m2}r_{o2}r_{o1})\parallel(g_{m3}r_{o3}r_{o4})]\to(g_mr_o)^2$ | $\infty$ | $\approx g_{m2}r_{o2}r_{o1}$ (NMOS side) | $V_{out,\min}=V_{ov1}+V_{ov2}$; $V_{DD}-4V_{ov}$ with cascode load | $1/(R_{out}C_{out})$; $\omega_X=\frac{g_{m2}+g_{mb2}}{2C_{GD1}+C_{DB1}+C_{SB2}+C_{GS2}}$; Miller on $C_{GD1}$ only $\approx 2\times$ | same as CS; cascode device negligible at LF | $I_D$ | High gain in one stage; shielding; better than a 4× longer device at equal headroom |
| **Folded cascode** (single stage) ([[Single-Stage#Folded Cascode]]) | $\approx g_{m1}R_{out}$ | $\infty$ | $[1+(g_{m2}+g_{mb2})r_{o2}](r_{o1}\parallel r_{o3})+r_{o2}$ | input not under the cascode: more swing and input range | output; extra pole at the fold node $X$ (bias source adds $C$) | input + bias source at $X$ + load ([[Noise#Cascode]]) | $I_1=\lvert I_{D1}\rvert+I_{D2}$: more | Input and output CM far apart; low supply |

### Differential stages and op amps

| Topology | $A_v$ | $R_{out}$ | Swing / headroom | Poles (dominant; non-dominant) | Input-referred noise | Power | When to use |
|---|---|---|---|---|---|---|---|
| **Diff pair**, $R_D$ or current-source loads ([[Differential Amplifiers#Small-Signal Gain and the Half Circuit]], [[Differential Amplifiers#Level 4 MOS Loads]]) | $-g_m(R_D\parallel r_o)$; $-g_{mN}(r_{oN}\parallel r_{oP})$ | $R_D\parallel r_o$ per side | Output diff $\approx 2V_{DD}-4V_{ov}$; input CM $V_{GS1}+V_{OV3}\le V_{in,CM}\le\min[V_{DD}-R_DI_{SS}/2+V_{TH},V_{DD}]$ | half circuit = CS; CMRR falls above $1/(r_{O3}C_P)$ | $8kT\left(\frac{\gamma}{g_m}+\frac{1}{g_m^2R_D}\right)$: $2\times$ the half circuit | $I_{SS}$ | Any differential front end; CMRR $\approx 2g_m^2R_{SS}/\Delta g_m$; current-source loads need CMFB |
| **5T OTA** (active-load pair) ([[Differential Amplifiers#Level 5 The Active-Load Pair (Five-Transistor OTA)]]) | $g_{m1}(r_{o2}\parallel r_{o4})$, $G_m=g_{m1}$ | $r_{o2}\parallel r_{o4}$ | $V_{out}\ge V_{in,CM}-V_{TH}$: keep $V_{in,CM}$ low ($V_{GS1}+V_{DS5,\min}$) | $1/[(r_{oN}\parallel r_{oP})C_L]$; mirror pole $g_{m3}/C_E$, zero $2g_{m3}/C_E$ | $8kT\gamma\left(\frac{1}{g_{m1}}+\frac{g_{m3}}{g_{m1}^2}\right)$ | $I_{SS}$ | Diff → single-ended, simple op amp, low-gain loops. CMRR $(1+2g_{m1}R_{SS})g_{m3}(r_{o1}\parallel r_{o3})$, PSRR $\approx g_{mN}(r_{oP}\parallel r_{oN})$ |
| **Telescopic** ([[Operational Amplifiers#Telescopic Cascode]]) | $g_{m1}[(g_{m3}r_{o3}r_{o1})\parallel(g_{m5}r_{o5}r_{o7})]$ | $(g_{m3}r_{o3}r_{o1})\parallel(g_{m5}r_{o5}r_{o7})$ | $2[V_{DD}-(V_{OD1}+V_{OD3}+V_{ISS}+\lvert V_{OD5}\rvert+\lvert V_{OD7}\rvert)]$ diff; as a unity-gain buffer only $V_{TH4}-(V_{GS4}-V_{TH2})$ | $\omega_{ta}=g_{m1}/C_L$; cascode-source nodes $\approx g_m/C_X$; mirror pole if single-ended | $4kT\left(\frac{2\gamma}{g_{m1}}+\frac{2\gamma g_{m7}}{g_{m1}^2}\right)$ | Lowest ($I_{SS}$ only) | Highest speed, lowest power and noise, when five stacked overdrives still leave the swing |
| **Folded-cascode OTA** ([[Operational Amplifiers#Folded Cascode]]) | $g_{m1}\{[(g_{m3}+g_{mb3})r_{o3}(r_{o1}\parallel r_{o5})]\parallel[(g_{m7}+g_{mb7})r_{o7}r_{o9}]\}$; 2–3× below telescopic | the bracket | $V_{DD}-(V_{OD3}+V_{OD5}+\lvert V_{OD7}\rvert+\lvert V_{OD9}\rvert)$ per side; input CM free | $\omega_{ta}=g_{m1}/C_L$; folding-node pole lower ($C_{GD5}+C_{DB5}$ of a wide $M_5$) | $8kT\left(\frac{\gamma}{g_{m1}}+\gamma\frac{g_{m5}}{g_{m1}^2}+\gamma\frac{g_{m9}}{g_{m1}^2}\right)$ ($M_5$ NMOS folding source, $M_9$ PMOS source): three pairs, noisier | Higher: $I_{SS1}=I_{SS}/2+I_{D3}$ per folding source | Input CM = output CM (unity-gain buffer, SC); PMOS input for low $1/f$ |
| **Current-mirror OTA** ([[Operational Amplifiers#Current-Mirror Op Amp]]) | $Kg_{m1}Z_L(s)\approx Kg_{m1}/(sC_L)$, $G_m=Kg_{m1}$ | output node only; every mirror input is a diode ($\approx1/g_m$) | set by the output mirror devices | $\omega_{ta}=Kg_{m1}/C_L$; second pole at the mirror input (drain of $Q_1$) falls toward $\omega_{ta}$ as $K$ grows | higher thermal noise than a folded cascode: the input pair gets only $2/(3+K)$ of the current | $I_{total}=(3+K)I_{D1}$ | High SR per power ($SR=KI_b/C_L$, no internal node collapses), large $C_L$; $K\le5$, $K=2$ general purpose, $K=1$ fastest |
| **Two-stage Miller** ([[Operational Amplifiers#Single-Ended Two-Stage (Miller) Op Amp]], [[Stability#Miller compensation and pole splitting]]) | $g_{m1}(r_{ds2}\parallel r_{ds4})\cdot g_{m7}(r_{ds6}\parallel r_{ds7})\approx(g_mr_o/2)^2$ (Tony labels: $Q_7$ driver = Razavi $M_5$, $Q_5$ tail; [[Operational Amplifiers#Single-Ended Two-Stage (Miller) Op Amp\|label map]]) | $r_{ds6}\parallel r_{ds7}$ | One overdrive from each rail: $V_{DD}-\lvert V_{OD5}\rvert-V_{OD7}$ (Razavi labels) | $\omega_{p1}\approx\frac{1}{g_{m7}R_1R_2C_C}$; $\omega_{p2}\approx\frac{g_{m7}}{C_1+C_2}$; RHP zero $g_{m7}/C_C$; $\omega_{ta}=g_{m1}/C_C$ | stage 1 as the 5T OTA; stage 2 divided by $A_1^2$ ([[Operational Amplifiers#Noise]]) | Tail + output branch ($I_{D6}>I_{D5}$ for slewing) | Low $V_{DD}$ with large swing and high gain; heavy resistive loads |
| **Gain-boosted cascode** ([[Operational Amplifiers#Level 3 Gain Boosting]], [[Current Mirrors#Enhanced Output Impedance (Gain Boosting)]]) | $(A_1+1)g_{m1}r_{o1}g_{m2}r_{o2}$ | $r_{o2}+(A_1+1)g_{m2}r_{o2}r_{o1}+r_{o1}$ | Same as the cascode it boosts (no extra stack) | $\omega_{p1}\approx\frac{1}{A_0g_{m2}r_{o2}r_{o1}C_L}$; doublet $\omega_z\approx(A_0+1)\omega_0$ next to $\omega_{p2}$ | Medium (Razavi Table 9.1) | High (boosters) | Gain near a quadruple cascode at one-stage speed; slow settling tail from the doublet |

Razavi's own ranking ([[Operational Amplifiers#Choosing a Topology]]):

| Topology | Gain | Swing | Speed | Power | Noise |
|---|---|---|---|---|---|
| Telescopic | Medium | Medium | Highest | Low | Low |
| Folded cascode | Medium | Medium | High | Medium | Medium |
| Two-stage | High | Highest | Low | Medium | Low |
| Gain-boosted | High | Medium | Medium | High | Medium |

> [!tip] Remark
> Every one-stage OTA row has the same GBW, $g_{m1}/C_L$; the two-stage has $g_{m1}/C_C$. Topology changes gain, swing and poles, not the "$g_m$ over the capacitor" law ([[Frequency Response#Level 3 Gain-Bandwidth Trade-Offs]], [[Stability#One-stage op amps the load is the compensation]]).

## Spec to topology

```tikz title="Spec to topology. Answer top to bottom; every exit goes to the sizing step. Rankings from Razavi Table 9.1; sizing order from Jespers and Murmann Secs. 3.1, 5.6.3, 6.1.2."
\usepackage{circuitikz}
\usetikzlibrary{positioning,shapes.geometric}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  q/.style={draw,rounded corners,fill=blue!6,align=center,text width=5.6cm,minimum height=0.9cm},
  a/.style={draw,fill=green!8,align=center,text width=5.4cm,minimum height=0.9cm},
  s/.style={draw,thick,fill=orange!12,align=center,text width=12.6cm,minimum height=1cm}]
  \node[s] (spec) at (3.6,0) {\textbf{Specs:} $A_0$ (gain error $1/\beta A_0$), GBW $\omega_u$, output swing, $V_{DD}$, $C_L$, input-referred noise, input CM range, power};
  \node[q] (q1) at (0,-1.7) {Input is a current, or low $R_{in}$ needed?};
  \node[q] (q2) at (0,-3.2) {Gain $\le1$ into a low-impedance load, or a level shift?};
  \node[q] (q3) at (0,-4.7) {Is $A_0\approx g_mr_o/2$ (one CS-type stage) enough?};
  \node[q] (q4) at (0,-6.2) {Does a cascode stack (five overdrives: tail, input, two cascodes, load) still leave the swing?};
  \node[q] (q5) at (0,-7.7) {Input CM must equal output CM (unity-gain buffer, SC)?};
  \node[q] (q6) at (0,-9.2) {$A_0$ still short of spec?};
  \node[a] (a1) at (7.2,-1.7) {\textbf{Common gate}: $R_{in}\approx1/(g_m+g_{mb})$, no Miller};
  \node[a] (a2) at (7.2,-3.2) {\textbf{Source follower}, or a 2nd stage that ends in one};
  \node[a] (a3) at (7.2,-4.7) {\textbf{CS} (single-ended) / \textbf{5T OTA} (diff in, single out)};
  \node[a] (a4) at (7.2,-6.2) {\textbf{Two-stage Miller}: swing $V_{DD}-2V_{ov}$; cascode stage 1 for more gain; compensate};
  \node[a] (a5) at (7.2,-7.7) {\textbf{Folded-cascode OTA}; else \textbf{telescopic} (fastest, least power and noise)};
  \node[a] (a6) at (7.2,-9.2) {\textbf{Gain boosting} on the cascodes (no extra stack; booster doublet)};
  \node[s] (size) at (3.6,-11.0) {\textbf{Size it:} headroom $\to g_m/I_D$ floor; $A_0\to L$; PM $\to f_T$ of internal nodes; noise $\to C$ or $g_m$; settling $\to g_m=\omega_uC/\beta$; $I_D=\max[g_m/(g_m/I_D),\,SR\cdot C]$; $W=I_D/(I_D/W)$};
  \draw[->] (spec.south -| q1) -- (q1);
  \foreach \i/\j in {1/2,2/3,3/4} \draw[->] (q\i) -- node[left,font=\scriptsize]{no} (q\j);
  \draw[->] (q4) -- node[left,font=\scriptsize]{yes} (q5);
  \draw[->] (q5) -- node[left,font=\scriptsize]{then} (q6);
  \foreach \i in {1,2,3,6} \draw[->] (q\i) -- node[above,font=\scriptsize]{yes} (a\i);
  \draw[->] (q4) -- node[above,font=\scriptsize]{no} (a4);
  \draw[->] (q5) -- node[above,font=\scriptsize]{yes / no} (a5);
  \draw[->] (q6) -- node[left,font=\scriptsize]{no} (q6 |- size.north);
  \foreach \i in {1,2,3,4,6} \draw (a\i.east) -- (10.3,0 |- a\i.east);
  \draw[->] (10.3,-1.7) |- (size.east);
\end{circuitikz}
\end{document}
```

Then size it with [[gm-ID Design Methodology#From amplifier specs to sizing]].

- **Large $C_L$:** prefer a one-stage OTA, where $C_L$ is the compensation; in a two-stage, more $C_L$ lowers $\omega_{p2}$ and the phase margin ([[Stability#Load capacitance the opposite of one-stage]]).
- **Lowest noise per power:** telescopic; PMOS input for $1/f$ ([[Operational Amplifiers#Noise]]).
- **Fully differential** doubles swing and removes the mirror pole, but needs CMFB ([[Operational Amplifiers#Why CMFB Is Needed]]).

## Sizing checklist

In the order of [[gm-ID Design Methodology#From amplifier specs to sizing]]: headroom, then gain, then phase margin, then noise, then settling, then current.

| # | Spec | Equation | Knob it fixes | Owner |
|---|---|---|---|---|
| 0 | Corners | design nominal for spec$/(1-\Delta)$, $\Delta g_m\approx30\%$ at constant $I_D$ | the target | [[gm-ID Design Methodology#Design for Corners by Pre-Distorting the Spec]] |
| 1 | Swing, $V_{DD}$, input CM | $\sum V_{D,sat}\le$ headroom, $V_{D,sat}\approx 2/(g_m/I_D)$ | $g_m/I_D$ **floor** of each stacked device | [[Single-Stage#Amplifier Specifications]] |
| 1 | Linearity (pair) | $HD_3\approx V_m^2/(32V_{OV}^2)$ (SI); $V_m^2/[48(nU_T)^2]$ (WI) | $g_m/I_D$ **ceiling** of the input pair | [[Nonlinearity and Mismatch#Single-Ended vs Differential]] |
| 2 | DC gain / static error | $A_0\ge 1/(\beta\epsilon_s)$; per stage $\lvert A_{v0}\rvert=\frac{(g_m/I_D)_1}{(g_{ds}/I_D)_1+(g_{ds}/I_D)_2}$ | $L$ (from $g_m/g_{ds}$); topology if one stage can't reach it | [[Operational Amplifiers#Gain Sets the Gain Error]] |
| 3 | Phase margin | $\text{PM}\approx 90^\circ-\tan^{-1}(\omega_t/\omega_{p2})$; sizing target $\omega_{p2}\ge4\omega_u$ (76°) | $f_T$ (so $L$, $g_m/I_D$) of the non-dominant-node devices; $g_{m7}$ in a two-stage | [[Stability#The bandwidth ceiling the second pole]], [[gm-ID Design Methodology#The Second Pole]] |
| 4 | Noise, sampled | $\overline{v_{od}^2}=\alpha\,kT/(\beta C_{Ltot})$ | capacitor sizes | [[gm-ID Design Methodology#The Equations]] |
| 4 | Noise, PSD | $4kT\gamma/g_{m,in}\,(1+g_{m,load}/g_{m,in}+\ldots)$ | input $g_m$ (high $g_m/I_D$); loads at low $g_m/I_D$ | [[Noise#Op-Amp Circuits]] |
| 4 | Flicker | $\frac{K}{C_{ox}WLf}$, corner $f_C=\frac{K}{C_{ox}WL}\frac{g_m}{4kT\gamma}$ | $WL$; PMOS input | [[Noise#Level 1 Device Noise Sources]] |
| 5 | GBW / settling | $g_m=\omega_uC_L$ (one stage), $g_{m1}=\omega_{ta}C_C$ (two stage); $\tau=1/(\beta\omega_u)$, $t_s=\tau\ln(1/\epsilon)$ | input $g_m$ | [[Operational Amplifiers#Bandwidth Sets the Settling Time]] |
| 6 | Power (minimise) | minimise $\frac{1}{\beta^2}\frac{I_D}{g_m}$; optimum near $\beta\approx\frac34\beta_{max}$ | input $g_m/I_D$ | [[gm-ID Design Methodology#Level 3 OTAs Sized for Settling and Noise]] |
| 7 | Slew rate | $SR=I_{max}/C$: one stage $2I_D/C_{Ltot}$; two stage $I_{D5}/C_C=V_{ov1}\omega_{ta}$ | $I_D=\max[g_m/(g_m/I_D),\,SR\cdot C]$ | [[Stability#Slew rate of a two-stage op amp]], [[gm-ID Design Methodology#Slewing in the Sizing Loop]] |
| 7 | Two-stage slew symmetry | $I_{D6}>I_{D5}(1+C_L/C_C)$ | output-branch current | [[Stability#Load capacitance can starve one edge]] |
| 8 | Offset | $\sigma^2_{V_{OS}}\approx\sigma^2_{\Delta V_{T1}}+\left[\frac{(g_m/I_D)_2}{(g_m/I_D)_1}\right]^2\sigma^2_{\Delta V_{T2}}$, $\sigma_{\Delta V_T}=A_{VT}/\sqrt{WL}$ | $WL$ of pair; low $g_m/I_D$ loads | [[Nonlinearity and Mismatch#Input-Referred Offset]] |
| 8 | Mirror accuracy | $\sigma(\Delta I)/I\approx(g_m/I_D)\,A_{VT}/\sqrt{WL}$ | low $g_m/I_D$, $WL$ | [[Current Mirrors#Level 6 Mismatch]] |
| 8 | De-normalize | $I_D=g_m/(g_m/I_D)$, $W=I_D/(I_D/W)$; add $C_{dd}$ back to $C_L$, iterate | $W$ | [[gm-ID Design Methodology#Self-Loading]] |
| 2 | $R_{out}$, CMRR, PSRR | $r_o$, $\times g_mr_o$ per cascode; tail $R_{SS}$ | $L$ of loads and tail | [[Differential Amplifiers#CMRR]] |
| — | Bias | copy a reference current, never a fixed $V_{GS}$; cascode bias $V_b\approx V_{GS3}+V_{OV1}$ | bias network | [[Biasing#Why Not a Fixed Gate Voltage]], [[Biasing#Cascode Bias Voltages]] |

> [!tip] Remark
> Linear scaling is the free knob at the end: scale every $W$ and $I_D$ by $k$ at fixed $L$, and gain and swing stay put while speed into a fixed $C_L$ goes $\times k$ and noise power $\div k$ ([[Operational Amplifiers#Choosing a Topology]]).

## Compensation quick reference

Two-stage labels after Carusone Fig. 6.3: input $g_{m1}$, tail $I_{D5}$, second-stage driver $g_{m7}$, $R_1,C_1$ at the first-stage output, $R_2,C_2\approx C_L$ at the output ([[Stability#Level 4 Compensating Two-Stage Op Amps]]).

| Technique | Loop crossover $\omega_t$ | Poles | Zero | Rule of thumb | Catch | Owner |
|---|---|---|---|---|---|---|
| One-stage OTA (load compensates) | $\beta g_{m1}/C_L$ | dominant at output; non-dominant at internal nodes | — | more $C_L$ = more PM | bandwidth and SR $=I_{out,max}/C_L$ fall with $C_L$ | [[Stability#One-stage op amps the load is the compensation]] |
| Dominant pole | $\omega'_{p1}=\omega_x/(\beta A_0)$ | lowers the first pole | — | $\angle\beta H(\omega_x)=-180^\circ+\text{PM}$ | throws away bandwidth | [[Stability#Dominant-pole compensation]] |
| Miller $C_C$ | $\beta g_{m1}/C_C$ | $\omega_{p1}\approx\frac{1}{g_{m7}R_1R_2C_C}$, $\omega_{p2}\approx\frac{g_{m7}}{C_1+C_2}$ | RHP, $g_{m7}/C_C$ | start $C_C\approx\beta g_{m1}C_L/g_{m7}$ (45°) | RHP zero; SR $=I_{D5}/C_C$ | [[Stability#Miller compensation and pole splitting]], [[Stability#Sizing $C_C$]] |
| Nulling resistor $R_C$ | as Miller | as Miller | $s_z=1/[C_C(1/g_{m7}-R_C)]$ | $R_C=1/g_{m7}$ kills it; $R_C\approx1/(1.7\omega_tC_C)$ adds $\approx30^\circ$; $R_C=\frac{C_1+C_2+C_C}{g_{m7}C_C}$ cancels $\omega_{p2}$ | $R_C$ must track $g_{m7}$ (triode device); cancelling $\omega_{p2}$ needs known $C_L$ and leaves a doublet | [[Stability#The nulling resistor (lead compensation)]] |
| Carusone recipe | — | — | — | $C_C'\approx\beta g_{m1}C_L/g_{m7}$; find $-125^\circ$ point; $C_C=C_C'A'$; $R_C=1/(1.7\omega_tC_C)$: $\approx85^\circ$ | simulate each step | [[Operational Amplifiers#Single-Ended Two-Stage (Miller) Op Amp]] |
| Source follower in the $C_C$ path | as Miller | as Miller | LHP, $-g_{ma}/C_C$ | $C_{GSa}\ll C_C$ | output can't go below $V_{GSa}+V_{I2}$ | [[Stability#Level 6 Other Compensation Techniques]] |
| Common-gate return (Ahuja) | as Miller | $\omega_{p2}\approx g_{ma}R_1g_{m7}/C_L$ ($\times g_{ma}R_1$) | LHP, $-g_{ma}/C_C$ | — | slewing needs $I_2=I_3\ge I_{SS}$; power | [[Stability#Level 6 Other Compensation Techniques]] |
| $C_C$ to stage-1 cascode source | as Miller | $\omega_{p2}\approx g_{m,cas}R_1g_{m7}/C_L$ | $(g_{m,cas}R_1)g_{m7}/C_C$ | the cascode is the CG device for free | pole at the cascode node | [[Stability#Level 6 Other Compensation Techniques]] |
| Gain-boost booster | — | booster pole-zero doublet near $(A_0+1)\omega_0$ | doublet | — | doublet tail $(1-\omega_z/\omega_{p2})e^{-\omega_{p2}t}$ slows settling | [[Stability#Pole-zero cancellation and doublets]] |

| PM target | Source | Meaning |
|---|---|---|
| $\approx60^\circ$ | [[Stability#Definition and peaking]] | little peaking or ringing |
| $\omega_{p2}/\omega_u = 4$ ($76^\circ$) | [[gm-ID Design Methodology#The Second Pole]] | $Q=0.5$: fastest settling without overshoot; the sizing target |
| $\text{PM}>45^\circ\iff\omega_t<\omega_{p2}$ | [[Stability#The bandwidth ceiling the second pole]] | compensated bandwidth can't pass the second pole |

## Common mistakes and sanity checks

- **Cascoding to get speed.** It adds gain, not GBW: GBW stays $g_m/C_L$ ([[Frequency Response#Level 3 Gain-Bandwidth Trade-Offs]]).
- **Leaving a high-gain output's DC level to chance.** A current-source-loaded stage has an undefined output level: it needs a feedback loop or CMFB ([[Single-Stage#Headroom]], [[Operational Amplifiers#Why CMFB Is Needed]]).
- **Using the half circuit on a 5T OTA.** $P$ is not a virtual ground there; use $G_mR_{out}$. Its output swing is also capped by the input CM ([[Differential Amplifiers#Level 5 The Active-Load Pair (Five-Transistor OTA)]]).
- **Telescopic op amp as a unity-gain buffer.** The input-output range shrinks to $V_{TH4}-(V_{GS4}-V_{TH2})$; use a folded cascode ([[Operational Amplifiers#Telescopic Cascode]]).
- **Checking phase margin only at your closed-loop gain.** $\beta=1$ is the worst case ([[Stability#Weaker feedback is always safer]]).
- **Adding $C_L$ to a two-stage to "stabilize" it.** That lowers $\omega_{p2}$ and the PM, the opposite of a one-stage ([[Stability#Load capacitance the opposite of one-stage]]).
- **Forgetting the RHP zero.** $R_C\ge 1/g_{m7}$, and make it track $g_{m7}$ ([[Stability#The right-half-plane zero]]).
- **Trusting small-signal settling for a large step.** It slews first if $V_{step}>SR\cdot\tau$ ([[Stability#Slewing plus linear settling]], [[Operational Amplifiers#Slew Rate]]).
- **A low-overdrive input pair in a two-stage.** $SR/\omega_{ta}=V_{ov1}$: low overdrive means slow slewing ([[Stability#Slew rate of a two-stage op amp]]).
- **Two-stage output current too small.** Need $I_{D6}>I_{D5}(1+C_L/C_C)$, else one edge slews at $(I_{D6}-I_{D5})/C_L$ ([[Stability#Load capacitance can starve one edge]]).
- **Systematic offset in a two-stage.** Need $(W/L)_7/(W/L)_4=2(W/L)_6/(W/L)_5$ ([[Operational Amplifiers#Single-Ended Two-Stage (Miller) Op Amp]]).
- **Expecting feedback to lower input-referred noise.** It doesn't ([[Feedback#What feedback does not buy noise]]).
- **Loads at high $g_m/I_D$.** Load noise scales as $g_{m,load}/g_{m,in}^2$ and load offset as $(g_m/I_D)_2/(g_m/I_D)_1$: give loads a large overdrive ([[Noise#Op-Amp Circuits]], [[Nonlinearity and Mismatch#Input-Referred Offset]]).
- **Same instruction for offset and current matching.** Voltage offset wants high $g_m/I_D$; current-mirror matching wants low ([[Nonlinearity and Mismatch#Current Mismatch the Opposite Instruction]]).
- **Ignoring tail capacitance.** CMRR falls above $1/(r_{O3}C_P)$ ([[Differential Amplifiers#Tail Capacitance CMRR Falls with Frequency]]).
- **Biasing with a fixed $V_{GS}$.** Copy a reference current ([[Biasing#Why Not a Fixed Gate Voltage]]); self-biased references need start-up ([[Biasing#Start-Up]]).
- **Stacked-diode cascode mirrors at low $V_{DD}$.** They waste a $V_{TH}$; use the low-voltage cascode ([[Current Mirrors#Level 3 Low-Voltage Cascodes]]).
- **Source follower driving a big $C_L$.** Its inductive $Z_{out}$ rings ([[Frequency Response#Source Follower]]).
- **Sizing without the self-loading.** The drain capacitance you just added changes $C_L$: iterate ([[gm-ID Design Methodology#Self-Loading]]).
- **Designing at nominal.** $g_m$ moves about ±30% over corners at fixed $I_D$: pre-distort the spec ([[gm-ID Design Methodology#Design for Corners by Pre-Distorting the Spec]]).

## References

Summary note: every result is taken from, and cited in, its owner note: [[Single-Stage]], [[Differential Amplifiers]], [[Current Mirrors]], [[Biasing]], [[Operational Amplifiers]], [[Frequency Response]], [[Noise]], [[Feedback]], [[Stability]], [[Nonlinearity and Mismatch]], [[gm-ID Design Methodology]]. The topology ranking is Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed., Table 9.1 (§9.5); the compensation recipe is Carusone, Johns, Martin, 2nd ed., §6.2.2; the sizing order is Jespers and Murmann, *Systematic Design of Analog CMOS Circuits*, §§3.1, 5.6.3, 6.1.2, 6.4.
