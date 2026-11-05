---
title: Power Dividers and Couplers
description: Three- and four-port passive networks that split, combine and sample RF power (T-junction, resistive, Wilkinson, branch-line, coupled-line, Lange, rat-race, baluns), with microstrip layouts, design numbers, front-end uses and how to measure isolation and directivity.
kind: topic
status: growing
aliases:
  - Power Dividers and Couplers
  - Power Dividers
  - Directional Couplers
  - Hybrids
  - Wilkinson Divider
  - Branch-Line Coupler
  - Rat-Race Coupler
  - Balun
---

A divider splits one signal into several; run backwards, it combines them. A directional coupler also tells waves apart by their direction of travel. Every block in this note is a few quarter-wave lines arranged so that two wave paths add at one port and cancel at another. As in [[MosFETs]], the note starts with the black box and opens it one level at a time.

## The big picture

```tikz title="A directional coupler on one screen: power into port 1 splits between through (2) and coupled (3); the isolated port (4) gets nothing. Below, the family this note covers. After Pozar Figs. 7.1, 7.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % directional coupler symbol
  \draw[thick,fill=blue!5] (0,0) rectangle (3.2,2.4);
  \draw[very thick] (-1.6,2) -- (4.8,2);
  \draw[very thick] (-1.6,0.4) -- (4.8,0.4);
  \draw[->,thick,red] (0.4,1.85) .. controls (1.6,1.6) and (1.6,0.8) .. (2.8,0.55);
  \node[left,align=right] at (-1.6,2) {\textbf{1} Input\\ $P_1$};
  \node[right,align=left] at (4.8,2) {\textbf{2} Through\\ $P_2=(1-\beta^2)P_1$};
  \node[right,align=left] at (4.8,0.4) {\textbf{3} Coupled\\ $P_3=\beta^2 P_1$};
  \node[left,align=right] at (-1.6,0.4) {\textbf{4} Isolated\\ $P_4\approx 0$};
  \node[font=\scriptsize,align=center] at (1.6,-0.6) {$C=10\log\frac{P_1}{P_3}$,\quad $D=10\log\frac{P_3}{P_4}$,\quad $I=10\log\frac{P_1}{P_4}=C+D$};
  % family
  \begin{scope}[xshift=0cm,yshift=-1.7cm]
    \tikzset{b/.style={draw,rounded corners,fill=gray!8,align=center,font=\scriptsize,minimum height=0.9cm}}
    \node[b] (t) at (-1.2,-0.6) {\textbf{3-port dividers}\\ T-junction (lossless, unmatched)\\ resistive (matched, $-6$ dB)\\ \textbf{Wilkinson} (matched, isolated)};
    \node[b] (h9) at (3.0,-0.6) {\textbf{90$^\circ$ hybrids}\\ branch-line ($\sim$10\%)\\ coupled-line ($\lambda/4$)\\ Lange (octave)};
    \node[b] (h18) at (6.6,-0.6) {\textbf{180$^\circ$ hybrids}\\ rat-race ($\sim$25\%)\\ tapered coupled line\\ magic-T};
    \node[b] (dc) at (3.0,-2.3) {\textbf{weak couplers} (10--30 dB): coupled-line, multihole waveguide};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **A 3-port can't be lossless, reciprocal and matched at all ports at once.** Give up one: lossy → resistive divider or **Wilkinson**; nonreciprocal → circulator; unmatched → lossless T-junction.
> 2. **Any lossless, reciprocal 4-port matched at every port is a directional coupler.** One number describes it: the coupling $\beta$, with $\alpha^2+\beta^2=1$.
> 3. **Coupler figures of merit:** coupling $C$, directivity $D$, isolation $I=C+D$ (dB), insertion loss $L$. Directivity is what makes it a coupler; it comes from cancellation and is the first thing to degrade.
> 4. **Equal-split designs are all quarter-wave lines:** Wilkinson ($\sqrt2Z_0$ arms, $R=2Z_0$), branch-line ($Z_0/\sqrt2$ series, $Z_0$ shunt), rat-race ($\sqrt2Z_0$ ring, $1.5\lambda$ around), coupled-line ($Z_0=\sqrt{Z_{0e}Z_{0o}}$).
> 5. **90° hybrids** (branch-line, Lange, coupled-line) make balanced amplifiers and balanced mixers; **180° hybrids** (rat-race, magic-T) make sum/difference networks and baluns; **Wilkinsons** split LOs and combine PAs.
> 6. **Even-odd mode analysis** solves every symmetric one of them: cut the circuit on its symmetry plane, open for even, short for odd, and add the two halves.

**Map:** [[#Physics background|why 3 ports fail, why couplers cancel, even-odd]] → [[#Spec translation|specs → amplifier specs]] → [[#Level 0 Coupler Specs|C, D, I, L]] → [[#Level 1 Three-Port Dividers|T, resistive, Wilkinson]] → [[#Level 2 90° Hybrids|branch-line, coupled-line, Lange]] → [[#Level 3 180° Hybrids|rat-race, bandwidth compared]] → [[#Level 4 In the Front End|balanced amp, mixers, balun, PA combining, VNA]] → [[#Level 5 Measuring Couplers and Dividers|measuring isolation and directivity]].

## Physics background

Everything here is a TEM or quasi-TEM line network. Lines are [[Transmission Lines]] (the quarter-wave transformer $Z_{in}=Z^2/Z_L$ does most of the work), and the language is the S-matrix from [[Microwave Network Analysis]].

> [!tip] Remark
> Two S-matrix facts carry this whole note ([[Microwave Network Analysis#S-Parameter Properties]]): **reciprocal** → $S=S^t$; **lossless** → $S$ unitary (each column has unit power, different columns are orthogonal).

### Why a Three-Port Can't Do It All

$$
\boxed{\text{lossless} + \text{reciprocal} + \text{matched at all 3 ports}\ \text{is impossible}}
$$

Relax one condition and a real device appears:

| Give up | Device | Price |
|---|---|---|
| Matched at every port | Lossless T-junction | Outputs mismatched ($\Gamma=-0.67$, $-0.33$ in Pozar Ex. 7.1), no isolation |
| Lossless | Resistive divider | $-6$ dB per output (half the power burned), no isolation |
| Lossless (but only for reflected power) | **Wilkinson** | Matched, outputs isolated, lossless when outputs are matched |
| Reciprocal | Circulator (ferrite) | Magnetized ferrite, nonreciprocal: $1\to2\to3\to1$ |

> [!note]- Derivation: the three-port impossibility (Pozar Eqs. 7.1–7.8)
> Matched and reciprocal: $[S]=\begin{bmatrix}0&S_{12}&S_{13}\\S_{12}&0&S_{23}\\S_{13}&S_{23}&0\end{bmatrix}$.
> Lossless (unitary) gives column powers and orthogonality:
> $|S_{12}|^2+|S_{13}|^2=1$, $|S_{12}|^2+|S_{23}|^2=1$, $|S_{13}|^2+|S_{23}|^2=1$, and $S_{13}^*S_{23}=0$, $S_{23}^*S_{12}=0$, $S_{12}^*S_{13}=0$.
> The three products force at least two of $S_{12},S_{13},S_{23}$ to zero. Then one of the three power equations reads $0=1$. Contradiction.
>
> **Drop reciprocity** (matched, lossless): the same equations are satisfied by $S_{12}=S_{23}=S_{31}=0$, $|S_{21}|=|S_{32}|=|S_{13}|=1$ (or the mirror image). That is a **circulator**: power goes only $1\to2\to3\to1$. So *any* matched lossless 3-port is a circulator.
>
> **Drop the match at one port** (lossless, reciprocal, ports 1 and 2 matched): the unitary conditions give $|S_{13}|=|S_{23}|$ and $S_{13}^*S_{23}=0$, so $S_{13}=S_{23}=0$ and $|S_{12}|=|S_{33}|=1$. The "3-port" degenerates into a matched line between 1 and 2 plus a fully reflecting port 3. Useless as a divider.
>
> **Drop losslessness:** the resistive divider (all ports matched, no isolation) and the Wilkinson (all ports matched *and* $S_{23}=0$).

> [!tip] Remark
> This is the result [[Microwave Network Analysis#S-Parameter Properties]] points forward to, and the worked version is [[Exam Prep - Problems through Stability#4.15 Three‑port impossibility|Exam Prep 4.15]]. The circulator itself (ferrites) is not covered here.

### Every Matched Lossless Four-Port Is a Directional Coupler

Add a fourth port and the impossibility goes away. A reciprocal 4-port matched at all ports and lossless must have $S_{14}=S_{23}=0$: port 1 never talks to port 4, port 2 never talks to port 3. Choosing the phase references gives two standard forms:

$$
\boxed{[S]_{sym}=\begin{bmatrix}0&\alpha&j\beta&0\\\alpha&0&0&j\beta\\j\beta&0&0&\alpha\\0&j\beta&\alpha&0\end{bmatrix}\qquad [S]_{anti}=\begin{bmatrix}0&\alpha&\beta&0\\\alpha&0&0&-\beta\\\beta&0&0&\alpha\\0&-\beta&\alpha&0\end{bmatrix}\qquad \alpha^2+\beta^2=1}
$$

- Symmetric form: the coupled output is $90^\circ$ from the through output. With $\alpha=\beta=1/\sqrt2$ it is the **quadrature (90°) hybrid**.
- Antisymmetric form: the outputs are in phase from port 1 and $180^\circ$ apart from port 4. With $\alpha=\beta=1/\sqrt2$ it is the **180° hybrid** (rat-race, magic-T).
- An ideal coupler has **one** degree of freedom: the coupling $\beta$.

> [!note]- Derivation: why $S_{14}=S_{23}=0$ (Pozar Eqs. 7.9–7.19)
> Matched and reciprocal: $S_{ii}=0$, $S_{ij}=S_{ji}$. Unitary row products:
> rows 1·2: $S_{13}^*S_{23}+S_{14}^*S_{24}=0$; rows 4·3: $S_{14}^*S_{13}+S_{24}^*S_{23}=0$. Multiply the first by $S_{24}^*$, the second by $S_{13}^*$, subtract: $S_{14}(|S_{13}|^2-|S_{24}|^2)=0$.
> Rows 1·3 and 4·2 similarly give $S_{23}(|S_{12}|^2-|S_{34}|^2)=0$.
> Solution 1: $S_{14}=S_{23}=0$, a directional coupler. Then the row self-products give $|S_{13}|=|S_{24}|$, $|S_{12}|=|S_{34}|$. Pick $S_{12}=S_{34}=\alpha$, $S_{13}=\beta e^{j\theta}$, $S_{24}=\beta e^{j\phi}$. Rows 2·3: $\theta+\phi=\pi$. $\theta=\phi=\pi/2$ is the symmetric coupler; $\theta=0,\phi=\pi$ the antisymmetric one.
> Solution 2 ($|S_{13}|=|S_{24}|$, $|S_{12}|=|S_{34}|$ with $S_{14},S_{23}\ne0$) forces either solution 1 again or $\alpha=\beta=0$: two disconnected 2-ports. So every reciprocal, lossless, matched 4-port is a directional coupler.

### Directivity Is a Cancellation

Every directional coupler gets its direction sense from **two wave components that add in phase at the coupled port and cancel at the isolated port**. In a two-hole waveguide coupler the holes are $\lambda_g/4$ apart: both components travel the same distance to the coupled port, but the one through the second hole travels $\lambda_g/2$ farther to the isolated port and cancels.

- The coupled-port path is length-independent, so **coupling is broadband**; the isolated-port cancellation depends on a path difference, so **directivity is narrowband** and degrades first with any asymmetry, loss, mismatch or unequal mode velocities.
- More cancelling components (more holes, more sections) give more degrees of freedom: binomial or Chebyshev responses, exactly like multisection matching transformers ([[Smith Chart and Impedance Matching#Multisection Transformers]]).

> [!note]- Detail: waveguide couplers (Bethe hole, multihole, others), briefly (Pozar Sec. 7.4, 7.9)
> **Bethe hole.** One small hole in the common broad wall of two waveguides. The hole radiates like an electric dipole (even symmetry, same sign forward and backward) plus a magnetic dipole (odd symmetry). Choose the hole offset $s$ (parallel guides, $\sin(\pi s/a)=\lambda_0/\sqrt{2(\lambda_0^2-a^2)}$) or the skew angle $\theta$ (skewed guides) so the two cancel toward the isolated port; then the hole radius $r_0$ sets the coupling (polarizabilities $\alpha_e=2r_0^3/3$, $\alpha_m=4r_0^3/3$). Directivity is narrowband (Pozar Ex. 7.3).
> **Multihole.** $N+1$ holes spaced $d=\lambda_g/4$. Forward wave $F=Ae^{-j\beta Nd}\sum F_n$ (all paths equal length: coupling is flat); backward wave $B=A\sum B_ne^{-2j\beta nd}$ (an array factor: directivity is synthesized). With $F_n,B_n\propto r_n^3$, pick $r_n^3\propto$ binomial coefficients for a maximally flat directivity, or Chebyshev for equal ripple. Same math as multisection transformers and antenna arrays.
> **Others:** Moreno crossed-guide (two crossed slots, guides at right angles), Schwinger reversed-phase (slots on opposite sides of the centreline, so the isolated-port paths are equal length and directivity is broadband but coupling narrowband), Riblet short-slot (common sidewall removed; TE10 and TE20 beat), symmetric tapered coupled lines (continuous taper, $90^\circ$ outputs), and aperture-coupled planar couplers (microstrip-to-microstrip or microstrip-to-waveguide through a ground-plane slot).

### Even-Odd Mode Analysis

```tikz title="Even-odd mode analysis: drive the two mirror ports equally (even) or oppositely (odd); the symmetry plane becomes an open or a short and the network splits into two 2-ports. After Pozar Figs. 7.10, 7.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \xs/\sb/\tt/\wall in {0/+/{even: $V_2=V_3$}/{$I=0$ on the midplane\\ $\Rightarrow$ cut it \textbf{open}\\ (magnetic wall)}, 7/-/{odd: $V_2=-V_3$}/{$V=0$ on the midplane\\ $\Rightarrow$ \textbf{short} it to ground\\ (electric wall)}} {
    \begin{scope}[xshift=\xs cm]
      \draw[thick,fill=blue!5] (0,0) rectangle (3,3);
      \draw[dashed,red,thick] (-0.6,1.5) -- (3.6,1.5);
      \node[font=\scriptsize,align=left] at (1.5,2.3) {symmetric\\ network};
      \draw (3,2.5) -- (4.2,2.5) node[right] {$+V_0$};
      \draw (3,0.5) -- (4.2,0.5) node[right] {$\sb V_0$};
      \node[font=\scriptsize] at (1.5,3.4) {\tt};
      \node[font=\scriptsize,align=center,red] at (1.5,-0.8) {\wall};
    \end{scope}
  }
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{response}=\text{even response}+\text{odd response},\qquad \text{even: midplane open},\quad \text{odd: midplane shorted}}
$$

A 4-port (or 3-port) symmetric about a plane becomes two 2-ports. Drive port 1 with a unit wave as $(+\tfrac12,+\tfrac12)$ plus $(+\tfrac12,-\tfrac12)$ on the two mirror ports; solve each half for $\Gamma_{e,o}$ and $T_{e,o}$ (cascade ABCD matrices); then
$B_1=\tfrac12(\Gamma_e+\Gamma_o)$, $B_4=\tfrac12(\Gamma_e-\Gamma_o)$, $B_2=\tfrac12(T_e+T_o)$, $B_3=\tfrac12(T_e-T_o)$ (branch-line labelling). Every hybrid in this note is designed by making $\Gamma_e=\Gamma_o=0$ (match) and $T_e=\pm T_o$ (isolation).

> [!tip] Remark
> Coupled lines are the same idea applied along the length: two coupled strips carry an even mode ($Z_{0e}$, $C_e=C_{11}$) and an odd mode ($Z_{0o}$, $C_o=C_{11}+2C_{12}$). Their definitions, the virtual walls, and termination of a differential pair live in [[Transmission Lines#Coupled Lines and Differential Pairs]]. Here we only use $Z_{0e}$, $Z_{0o}$ as design variables.

**Microstrip's catch:** the even mode keeps more of its field in the substrate than the odd mode, so $\epsilon_{e,even}>\epsilon_{e,odd}$ and the even mode is slower (binder p. 369). A coupled-line coupler assumes equal electrical length for both modes; in microstrip they differ and **directivity suffers**. Stripline (pure TEM) doesn't have this problem; dielectric overlays, anisotropic substrates, or the Lange layout compensate in microstrip.

## Spec translation

A coupler or divider has no amplifier inside it, so its own specs are set by geometry and line impedance. The translation runs the other way: the hybrid's properties set what the **amplifiers, mixers and PAs around it** must achieve.

**Block specs** (Pozar Sec. 7.1, 12.4, 13.5): coupling $C$, directivity $D$, isolation $I$, insertion loss $L$, return loss at every port, amplitude balance (dB) and phase balance (deg) between outputs, bandwidth over which all of these hold, and power handling (including the isolation resistor's rating).

| System spec | Set by the hybrid | What it demands of the amplifiers | Amplifier spec |
|---|---|---|---|
| Balanced-amp input/output return loss | $S_{11}=\tfrac12(\Gamma_A-\Gamma_B)$ + hybrid's own match | A and B must have **equal** $\Gamma$; each one alone may be badly matched | Matching between A and B (layout symmetry, identical bias), not $|\Gamma|$ |
| Balanced-amp gain | $S_{21}=-\tfrac j2(G_A+G_B)$ | Equal gains; the difference is dumped in the terminations | DC/RF gain matching, $g_m$ matching |
| Balanced-amp noise figure | $F=\tfrac12(F_A+F_B)$, plus the input hybrid's loss in front | Each amp's NF must beat the target by the hybrid's insertion loss (dB for dB) | Input-referred noise |
| Balanced-amp $P_{1dB}$ | Each amp sees half the power | Each amp needs $P_{1dB}$ 3 dB below the target | Output swing, $I_D$ |
| Wilkinson PA-combiner efficiency | $\eta=\dfrac{|1+re^{j\varphi}|^2}{2(1+r^2)}$ | PA paths matched in amplitude $r$ and phase $\varphi$ | Gain and phase matching between PAs |
| Reflectometer / VNA accuracy | $\pm1/D$ error on $|\Gamma|$ | none (passive), $D\ge40$ dB | n/a |
| LO distribution to several mixers | Wilkinson $S_{23}=0$ | Mixer input reflections don't reach the other branch | Relaxed buffer reverse isolation |

$$
\boxed{S_{11,bal}=\tfrac12(\Gamma_A-\Gamma_B),\qquad S_{21,bal}=-\tfrac j2(G_A+G_B),\qquad F_{bal}=\tfrac12(F_A+F_B),\qquad \eta_{comb}=\cos^2\tfrac{\varphi}{2}\ (r=1)}
$$

> [!note]- Derivation: combiner efficiency with amplitude and phase error
> Drive a Wilkinson's ports 2 and 3 with waves $a_2$ and $a_3=r e^{j\varphi}a_2$. Output: $b_1=S_{12}a_2+S_{13}a_3=-\tfrac{j}{\sqrt2}(a_2+a_3)$. Power out over power in:
> $\eta=\dfrac{|a_2+a_3|^2/2}{|a_2|^2+|a_3|^2}=\dfrac{|1+re^{j\varphi}|^2}{2(1+r^2)}$. Since $S_{22}=S_{33}=S_{23}=0$, nothing reflects back to the PAs: the missing power heats the resistor.
> Equal amplitudes: $\eta=\tfrac{1+\cos\varphi}{2}=\cos^2(\varphi/2)$. Numbers: $10^\circ\to0.992$ ($-0.03$ dB), $20^\circ\to0.970$ ($-0.13$ dB), $30^\circ\to0.933$ ($-0.30$ dB). Amplitude error alone: 1 dB → $-0.014$ dB, 2 dB → $-0.057$ dB. **Phase matching matters far more than amplitude matching.**
> One PA dead ($r=0$): $\eta=\tfrac12$. Output drops from $2P$ to $P/2$, a 6 dB loss, the same as Pozar's balanced-amplifier failure case.

**Where the amplifier specs land in sizing:**

| Amplifier spec from the table | Fixes |
|---|---|
| Gain and $\Gamma$ matching between paths | Identical device sizes, bias and layout (symmetry), not a $g_m/I_D$ choice |
| Per-amplifier NF (target minus hybrid loss) | $g_m/I_D$ and $I_D$ of the input device |
| Per-amplifier $P_{1dB}$ (target minus 3 dB) | $I_D$, supply, load line |
| Phase matching of combined PAs | Matched interconnect lengths and matching networks |

> [!tip] Remark
> The sizing method itself is [[gm-ID Design Methodology]]; the amplifiers in a balanced pair are designed as in [[RF Amplifier Design]], but freed from the input/output match (that is the point of the balanced topology). Pozar Ex. 12.7 makes this concrete: an amplifier designed for 11 dB at 4 GHz with return loss no better than 5 dB alone, put into a balanced pair with 4 GHz quadrature hybrids, keeps its 11 dB gain and gets a much better match across 3–5 GHz; reoptimizing the stubs for 10 dB flat gain then flattens the gain without breaking the match.

## Level 0: Coupler Specs

$$
\boxed{C=10\log\frac{P_1}{P_3}=-20\log\beta,\quad D=10\log\frac{P_3}{P_4}=20\log\frac{\beta}{|S_{14}|},\quad I=10\log\frac{P_1}{P_4}=-20\log|S_{14}|,\quad L=-20\log|S_{12}|}
$$

$$
\boxed{I=C+D\ \ \text{(dB)}}
$$

- **Coupling:** how much goes to the coupled port. A 20 dB coupler takes 1% of the power; the through path loses only $10\log0.99=0.044$ dB.
- **Directivity:** how well it separates forward from backward waves (coupled vs isolated port). Reflectometers want 35–40 dB or more.
- **Isolation:** leakage to the isolated port relative to the input.
- **Hybrid** = 3 dB coupler ($\alpha=\beta=1/\sqrt2$): quadrature ($90^\circ$) or $180^\circ$.

$$
\boxed{[S]_{90^\circ}=\frac{-1}{\sqrt2}\begin{bmatrix}0&j&1&0\\j&0&0&1\\1&0&0&j\\0&1&j&0\end{bmatrix}\qquad [S]_{180^\circ}=\frac{-j}{\sqrt2}\begin{bmatrix}0&1&1&0\\1&0&0&-1\\1&0&0&1\\0&-1&1&0\end{bmatrix}}
$$

(Branch-line labelling for the $90^\circ$ hybrid: 1 in, 2 through, 3 coupled, 4 isolated. Rat-race labelling for the $180^\circ$: 1 = $\Sigma$, 4 = $\Delta$.)

> [!tip] Remark
> A port's "isolated" or "coupled" role depends on which port you feed: any port of a hybrid can be the input. Terminate unused ports in good $Z_0$ loads; a reflection on an output comes back and splits, and part of it lands on the "isolated" port (that is exactly what limits measured directivity, [[#Measuring Isolation and Directivity]]).

## Level 1: Three-Port Dividers

### T-Junction and Resistive Divider

```tikz title="Three-port dividers without isolation: the lossless T-junction (junction susceptance jB) and the equal-split resistive divider. After Pozar Figs. 7.6, 7.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % lossless T
  \draw[very thick] (0,1) -- (2,1) node[midway,above] {$Z_0$};
  \draw[very thick] (2,1) -- (3.6,2) node[midway,above,sloped] {$Z_1$};
  \draw[very thick] (2,1) -- (3.6,0) node[near end,above,sloped] {$Z_2$};
  \draw (2,1) to[C,l_=$jB$] (2,-0.6) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.8,-1.7) {lossless T: $\frac{1}{Z_1}+\frac{1}{Z_2}=\frac{1}{Z_0}$\\ input matched, outputs not, no isolation};
  % resistive
  \begin{scope}[xshift=6.5cm]
    \draw (0,1) node[ocirc]{} node[left]{1} to[R,l=$\frac{Z_0}{3}$] (2,1) node[circ]{};
    \draw (2,1) -- (2,2) to[R,l=$\frac{Z_0}{3}$] (4,2) node[ocirc]{} node[right]{2};
    \draw (2,1) -- (2,0) to[R,l_=$\frac{Z_0}{3}$] (4,0) node[ocirc]{} node[right]{3};
    \node[font=\scriptsize,align=center] at (2,-1.7) {resistive: all ports matched,\\ $S_{21}=S_{31}=\tfrac12$ ($-6$ dB), half the power burned};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{lossless T: } \frac1{Z_1}+\frac1{Z_2}=\frac1{Z_0},\quad P_i\propto\frac{1}{Z_i}\qquad\qquad \text{resistive: } R=\frac{Z_0}{3},\ \ S_{21}=S_{31}=\tfrac12\ (-6\text{ dB})}
$$

- **Lossless T:** the junction's stored energy is a shunt susceptance $jB$; compensate it (or tune it out) for a real match. An equal split from 50 Ω uses two 100 Ω lines, then quarter-wave transformers back to 50 Ω if needed. Outputs are not matched and not isolated.
- **Resistive:** matched everywhere and broadband (no lines at all), but $-6$ dB per output and still no isolation. $[S]=\tfrac12\begin{bmatrix}0&1&1\\1&0&1\\1&1&0\end{bmatrix}$, not unitary.

> [!example]- Worked example: 2:1 lossless T-junction (Pozar Ex. 7.1, p. 326)
> 50 Ω source, $P_1=P_{in}/3$, $P_2=2P_{in}/3$. Since $P_i=V_0^2/(2Z_i)$: $Z_1=3Z_0=150\ \Omega$, $Z_2=3Z_0/2=75\ \Omega$. Input: $75\parallel150=50\ \Omega$, matched.
> Looking back into the 150 Ω output: $50\parallel75=30\ \Omega$, $\Gamma_1=(30-150)/(30+150)=-0.666$. Into the 75 Ω output: $50\parallel150=37.5\ \Omega$, $\Gamma_2=-0.333$. Badly mismatched outputs: the reason for the Wilkinson.

> [!note]- Derivation: resistive divider (Pozar Eqs. 7.26–7.32)
> Each output arm is $Z_0/3+Z_0=4Z_0/3$; two in parallel are $2Z_0/3$; plus the input $Z_0/3$ gives $Z_{in}=Z_0$. By symmetry every port is matched.
> Centre voltage $V=V_1\cdot\frac{2Z_0/3}{Z_0/3+2Z_0/3}=\tfrac23V_1$; output $V_2=V\frac{Z_0}{Z_0+Z_0/3}=\tfrac12V_1$. So $S_{21}=\tfrac12$ and $P_2=P_3=P_{in}/4$: half the power is burned in the resistors.

### Wilkinson Divider

```tikz title="Equal-split Wilkinson in microstrip (top view): two 70.7-ohm quarter-wave arms and a 100-ohm chip resistor across the output ends. Dimensions computed for 2 GHz on a 0.762 mm, eps_r = 2.2 board. After Pozar Fig. 7.8a."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=2.2mm,y=2.2mm]
  % board
  \fill[green!8] (-24,-16) rectangle (34,16);
  \tikzset{cu/.style={draw=orange!70!black,line cap=butt}}
  % input 50 ohm, W=2.35mm
  \draw[cu,line width=2.35*2.2mm*0.9] (-22,0) -- (-9.65,0);
  % arms: 70.7 ohm, W=1.35mm, R=9.65mm, from 180 to 15 deg
  \draw[cu,line width=1.35*2.2mm*0.9] (-9.65,0) arc[start angle=180,end angle=15,radius=9.65];
  \draw[cu,line width=1.35*2.2mm*0.9] (-9.65,0) arc[start angle=180,end angle=345,radius=9.65];
  % outputs 50 ohm
  \draw[cu,line width=2.35*2.2mm*0.9] (9.32,2.5) -- (14,2.5) -- (20,10) -- (32,10);
  \draw[cu,line width=2.35*2.2mm*0.9] (9.32,-2.5) -- (14,-2.5) -- (20,-10) -- (32,-10);
  % resistor
  \fill[black] (10.6,-1.7) rectangle (12.2,1.7);
  \draw[->] (16,0) node[right,font=\scriptsize,align=left] {$R=2Z_0=100\ \Omega$\\ chip resistor} -- (12.4,0);
  % labels
  \node[font=\scriptsize] at (-18,2.5) {port 1, $Z_0=50\ \Omega$};
  \node[font=\scriptsize] at (-17,-2.5) {$W=2.35$ mm};
  \node[font=\scriptsize,align=center] at (0,12.6) {$\sqrt2Z_0=70.7\ \Omega$, $W=1.35$ mm,\\ arc length $\lambda_g/4=27.8$ mm};
  \node[font=\scriptsize] at (0,0) {arms};
  \node[font=\scriptsize] at (27,12.3) {port 2, 50 $\Omega$};
  \node[font=\scriptsize] at (27,-12.5) {port 3, 50 $\Omega$};
  \node[font=\scriptsize,align=left,anchor=west] at (-23.5,-14) {2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm (approx.\ to scale)};
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_{arm}=\sqrt2Z_0=70.7\ \Omega\ (\lambda/4),\qquad R=2Z_0=100\ \Omega,\qquad S_{21}=S_{31}=\frac{-j}{\sqrt2},\quad S_{11}=S_{22}=S_{33}=S_{23}=0}
$$

- **Matched at all three ports, outputs isolated,** and **lossless when the outputs are matched**: with equal output voltages no current flows in $R$. Only power reflected from (or unequal power fed into) ports 2 and 3 is burned.
- Isolation and output match come from $R$; input match from the two $\lambda/4$ transformers ($2Z_0$ each, in parallel).

**Design procedure (equal split):**
1. $Z_0$ and $f_0$ given. Arms: $\sqrt2Z_0$, $\lambda_g/4$ at $f_0$.
2. $R=2Z_0$, as a chip resistor bridging the two output ends. Keep the gap short: the resistor must sit between the arm ends, so the arms curve toward each other (a ring or "teardrop").
3. Synthesize the widths and lengths ([[Transmission Lines#Microstrip Characteristic Impedance Synthesis]]). For the layout above (2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm): 50 Ω is $W=2.35$ mm ($\epsilon_e=1.87$); 70.7 Ω is $W=1.35$ mm ($\epsilon_e=1.82$), $\lambda_g/4=27.8$ mm.
4. Separate the output lines after the resistor so they don't couple.
5. For more bandwidth, cascade stepped sections (more $\lambda/4$ arms and resistors).

> [!note]- Derivation: even-odd analysis of the Wilkinson (Pozar Sec. 7.3, binder pp. 330–337)
> Normalize to $Z_0$. Arms have impedance $Z$, the resistor $r$, split into $r/2+r/2$ by the symmetry plane; the port-1 source resistance $1$ is split into two $2$s in parallel.
>
> ```tikz title="Wilkinson bisected (normalized to Z0): even mode (midplane open, left) sets the arm impedance; odd mode (midplane shorted, right) sets the resistor. After Pozar Fig. 7.10."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[>=stealth,font=\small]
>   % even
>   \draw (0,0) node[ground]{} to[R,l=$2$] (0,1.5) -- (0.6,1.5);
>   \draw[very thick] (0.6,1.5) -- (3.4,1.5) node[midway,above] {$Z=\sqrt2$, $\lambda/4$};
>   \node[font=\scriptsize] at (0.1,2.1) {port 1 side};
>   \draw (3.4,1.5) -- (4.2,1.5) node[circ]{} node[above]{port 2};
>   \draw (4.2,1.5) -- (4.2,1.2); \draw (4.2,1.2) to[R,l=$r/2$] (4.2,0.2); \node[font=\scriptsize] at (4.2,-0.05) {open};
>   \draw (4.2,1.5) -- (5.4,1.5) to[R,l=$1$] (6.6,1.5) to[V,l=$2V_0$] (6.6,0) node[ground]{};
>   \node[font=\scriptsize,align=center] at (3.2,-1) {even: $Z_{in}^e=\frac{Z^2}{2}=1$ if $Z=\sqrt2$;\ resistor carries no current};
>   % odd
>   \begin{scope}[xshift=8.4cm]
>     \draw (0.6,0) node[ground]{} -- (0.6,1.5);
>     \draw[very thick] (0.6,1.5) -- (3.4,1.5) node[midway,above] {$Z=\sqrt2$, $\lambda/4$};
>     \node[font=\scriptsize] at (0.6,2.1) {short};
>     \draw (3.4,1.5) -- (4.2,1.5) node[circ]{} node[above]{port 2};
>     \draw (4.2,1.5) to[R,l=$r/2$] (4.2,0) node[ground]{};
>     \draw (4.2,1.5) -- (5.4,1.5) to[R,l=$1$] (6.6,1.5) to[V,l=$2V_0$] (6.6,0) node[ground]{};
>     \node[font=\scriptsize,align=center] at (3.4,-1) {odd: shorted $\lambda/4$ looks open, $Z_{in}^o=r/2=1$ if $r=2$};
>   \end{scope}
> \end{circuitikz}
> \end{document}
> ```
>
> **Even mode** ($V_{g2}=V_{g3}=2V_0$): no current crosses the midplane, so open it. The resistor half dangles. Port 2 sees a $\lambda/4$ line of $Z$ loaded by 2: $Z_{in}^e=Z^2/2$. Matched if $Z=\sqrt2$. Then $V_2^e=V_0$, and from the line equations with $\Gamma=(2-\sqrt2)/(2+\sqrt2)$ at port 1, $V_1^e=-jV_0\sqrt2$.
> **Odd mode** ($V_{g2}=-V_{g3}$): the midplane is at zero volts, so short it. The $\lambda/4$ line shorted at port 1 looks open at port 2, so port 2 sees $r/2$. Matched if $r=2$. $V_2^o=V_0$, $V_1^o=0$: all odd-mode power goes into the resistor.
> **Port 1** with outputs matched: $V_2=V_3$ (even), no resistor current, two $\lambda/4$ lines of $\sqrt2$ loaded by 1 in parallel: $Z_{in}=\tfrac12(\sqrt2)^2=1$.
> Result: $S_{11}=0$, $S_{22}=S_{33}=0$, $S_{21}=\dfrac{V_1^e+V_1^o}{V_2^e+V_2^o}=-j/\sqrt2$, $S_{31}=-j/\sqrt2$, $S_{23}=0$ (open or short at the bisection).

**Bandwidth:** solving the network over frequency gives return loss and isolation better than 20 dB over about 36% and 15 dB over about 64% (computed from the ideal lines; compare Pozar Fig. 7.12 and the plot in [[#Bandwidth Compared]]). $|S_{21}|$ stays within 0.3 dB of 3 dB from $0.5f_0$ to $1.5f_0$.

**Unequal split** ($K^2=P_3/P_2$, Pozar Eq. 7.37):

$$
\boxed{Z_{03}=Z_0\sqrt{\frac{1+K^2}{K^3}},\qquad Z_{02}=K^2Z_{03}=Z_0\sqrt{K(1+K^2)},\qquad R=Z_0\left(K+\frac1K\right)}
$$

The outputs are then matched to $R_2=Z_0K$ and $R_3=Z_0/K$, not $Z_0$; add quarter-wave transformers to bring them back to $Z_0$ ([[Smith Chart and Impedance Matching#Quarter-Wave Transformer]]).

> [!example]- Worked example: 2:1 Wilkinson, 50 Ω (computed from Pozar Eq. 7.37)
> $P_3/P_2=1/2$, so $K^2=0.5$, $K=0.707$.
> $Z_{03}=50\sqrt{1.5/0.354}=103.0\ \Omega$, $Z_{02}=0.5\times103.0=51.5\ \Omega$, $R=50(0.707+1.414)=106.1\ \Omega$.
> Output terminations: $R_2=35.4\ \Omega$, $R_3=70.7\ \Omega$. Quarter-wave transformers to 50 Ω: $\sqrt{50\cdot35.4}=42.0\ \Omega$ and $\sqrt{50\cdot70.7}=59.5\ \Omega$.
> The high-power arm is the *lower*-impedance (wider) line.

**N-way:** $N$ arms of $Z_0\sqrt N$, each output tied to a common node through $Z_0$ resistors (star). Matched and isolated at every port, but for $N\ge3$ the resistors need crossovers, awkward in planar form. In practice N-way dividers are trees of 2-way Wilkinsons (a **corporate feed**, Pozar Fig. 7.15: three Wilkinsons make a 4-way).

## Level 2: 90° Hybrids

### Branch-Line Coupler

```tikz title="Branch-line (quadrature) hybrid in microstrip, top view, 2 GHz on 0.762 mm eps_r = 2.2. Ports 2 and 3 get half the power each, 90 degrees apart; port 4 is isolated. After Pozar Fig. 7.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.6mm,y=1.6mm]
  \fill[green!8] (-22,-12) rectangle (52,40);
  \tikzset{cu/.style={draw=orange!70!black,line cap=rect}}
  % square: centers at (0,0),(27,0),(0,27.4),(27,27.4) approx; series arms (horizontal) 35.4 ohm W=3.83, shunt (vertical) 50 ohm W=2.35
  \draw[cu,line width=3.83*1.6mm] (0,27.4) -- (27,27.4);
  \draw[cu,line width=3.83*1.6mm] (0,0) -- (27,0);
  \draw[cu,line width=2.35*1.6mm] (0,0) -- (0,27.4);
  \draw[cu,line width=2.35*1.6mm] (27,0) -- (27,27.4);
  % feed lines 50 ohm
  \foreach \a/\b/\c/\d in {0/27.4/-14/27.4, 27/27.4/41/27.4, 0/0/-14/0, 27/0/41/0} \draw[cu,line width=2.35*1.6mm] (\a,\b) -- (\c,\d);
  \node[font=\scriptsize,anchor=east] at (-14.5,27.4) {1 in};
  \node[font=\scriptsize,anchor=west] at (41.5,27.4) {2 out, $-90^\circ$};
  \node[font=\scriptsize,anchor=west] at (41.5,0) {3 out, $-180^\circ$};
  \node[font=\scriptsize,anchor=east] at (-14.5,0) {4 isolated};
  \node[font=\scriptsize] at (13.5,32.5) {$Z_0/\sqrt2=35.4\ \Omega$, $W=3.83$ mm, $\ell=27.0$ mm};
  \node[font=\scriptsize] at (13.5,-5) {$35.4\ \Omega$ series arm};
  \node[font=\scriptsize,align=center] at (13.5,14) {$Z_0=50\ \Omega$ shunt arms\\ $W=2.35$ mm, $\ell=27.4$ mm\\ (lengthen $10$--$20^\circ$\\ for the T-junctions)};
  \node[font=\scriptsize,anchor=west] at (-21,-10) {2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm; line lengths centre-to-centre};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{series arms } Z_0/\sqrt2=35.4\ \Omega,\quad \text{shunt arms } Z_0=50\ \Omega,\quad \text{all } \lambda/4;\qquad S_{21}=\frac{-j}{\sqrt2},\ S_{31}=\frac{-1}{\sqrt2},\ S_{41}=0}
$$

- Input at any port; the outputs are always the two ports across the square, the isolated port is the other one on the input side.
- Outputs are equal in amplitude and $90^\circ$ apart at $f_0$.
- Narrowband: the whole square is $\lambda/4$ on a side.

**Design procedure:**
1. Series (through) arms $Z_0/\sqrt2$, shunt arms $Z_0$, all $\lambda_g/4$ at $f_0$.
2. Lay out the square; T-junction discontinuities shorten the effective shunt arms, so **lengthen the shunt arms by $10^\circ$–$20^\circ$** (Pozar p. 346) and tune in EM simulation.
3. For more bandwidth, cascade more sections (bandwidth to a decade or more is possible, Pozar p. 346). For unequal split or different output impedances, change the arm impedances (Pozar Prob. 7.18).

Numbers for the layout above (2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm): 35.4 Ω is $W=3.83$ mm, $\lambda_g/4=27.0$ mm; 50 Ω is $W=2.35$ mm, $\lambda_g/4=27.4$ mm.

> [!example]- Worked example: 50 Ω branch-line hybrid (Pozar Ex. 7.5, p. 346)
> Lines $\lambda/4$ at $f_0$, branch impedances $Z_0/\sqrt2=35.4\ \Omega$ and $Z_0=50\ \Omega$. At $f_0$: perfect 3 dB split, perfect isolation and match. Away from $f_0$ all four degrade quickly (Pozar Fig. 7.25). Solving the ideal network: return loss and isolation better than 20 dB over about 10%, 15 dB over about 19%; at $0.9f_0$ the outputs are $-3.6$ and $-3.0$ dB (0.6 dB imbalance) while the phase stays near $89^\circ$. **Amplitude balance and isolation, not phase, limit a branch-line.**

> [!note]- Derivation: even-odd analysis of the branch-line (Pozar Eqs. 7.62–7.67)
> Symmetry plane is horizontal, through the middle of the shunt arms. Even: open midplane, each half is a shunt $\lambda/8$ open stub ($Y=j\tan45^\circ=j$), a $\lambda/4$ line of $1/\sqrt2$, another open stub. Odd: shorted $\lambda/8$ stubs ($Y=-j$).
> $\begin{bmatrix}A&B\\C&D\end{bmatrix}_e=\begin{bmatrix}1&0\\j&1\end{bmatrix}\begin{bmatrix}0&j/\sqrt2\\j\sqrt2&0\end{bmatrix}\begin{bmatrix}1&0\\j&1\end{bmatrix}=\frac1{\sqrt2}\begin{bmatrix}-1&j\\j&-1\end{bmatrix}$, giving $\Gamma_e=0$, $T_e=-\tfrac1{\sqrt2}(1+j)$.
> Odd: $\frac1{\sqrt2}\begin{bmatrix}1&j\\j&1\end{bmatrix}$, $\Gamma_o=0$, $T_o=\tfrac1{\sqrt2}(1-j)$.
> $B_1=\tfrac12(\Gamma_e+\Gamma_o)=0$, $B_2=\tfrac12(T_e+T_o)=-j/\sqrt2$, $B_3=\tfrac12(T_e-T_o)=-1/\sqrt2$, $B_4=\tfrac12(\Gamma_e-\Gamma_o)=0$.

> [!tip] Remark
> Terminate ports 2 and 3 of a quadrature hybrid in equal loads $\Gamma$: port 1 stays matched for *every* $\Gamma$ and port 4 sees $j\Gamma$. That is a variable attenuator or phase shifter, and the same cancellation as the balanced amplifier. Worked in [[Exam Prep - Problems through Stability#Pozar 4.27 (PS2 Q7) Hybrid‑coupler variable attenuator|Exam Prep 4.27]].

### Coupled-Line Coupler

```tikz title="Single-section coupled-line coupler: the coupled port is on the input end (backward coupling); coupling peaks when the section is a quarter wave (right, C = 0.6 shown). After Pozar Figs. 7.31, 7.33."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1cm,y=1cm]
  % coupled line top view
  \fill[green!8] (-0.5,-1.4) rectangle (8.5,2.6);
  \tikzset{cu/.style={draw=orange!70!black,line width=4pt,line cap=butt}}
  \draw[cu] (0,-0.9) -- (1.5,0) -- (6.5,0) -- (8,-0.9);
  \draw[cu] (0,2.1) -- (1.5,1.2) -- (6.5,1.2) -- (8,2.1);
  \node[font=\scriptsize,anchor=east] at (0,-0.9) {1 input};
  \node[font=\scriptsize,anchor=west] at (8,-0.9) {2 through};
  \node[font=\scriptsize,anchor=east] at (0,2.1) {3 coupled};
  \node[font=\scriptsize,anchor=west] at (8,2.1) {4 isolated};
  \draw[<->] (1.5,0.6) -- (6.5,0.6) node[midway,fill=green!8,font=\scriptsize] {$\ell=\lambda/4$, gap $S$ sets $Z_{0e},Z_{0o}$};
  \draw[->,red,thick] (2,-0.45) -- (6,-0.45) node[midway,below,font=\scriptsize] {forward wave};
  \draw[->,red,thick] (6,1.65) -- (2,1.65) node[midway,above,font=\scriptsize] {coupled wave travels \textbf{backward}};
  % response vs theta
  \begin{scope}[xshift=10.5cm,yshift=-1cm,x=0.55cm,y=3cm]
    \draw[->] (0,0) -- (7,0) node[right] {$\theta$};
    \draw[->] (0,0) -- (0,1.15);
    \draw[thick,blue,domain=0:6.28,samples=80] plot (\x,{0.36*sin(\x r)^2/(0.64*cos(\x r)^2+sin(\x r)^2)});
    \draw[thick,black,domain=0:6.28,samples=80] plot (\x,{0.64/(0.64*cos(\x r)^2+sin(\x r)^2)});
    \foreach \x/\l in {1.571/{\pi/2},3.1416/{\pi},4.712/{3\pi/2},6.283/{2\pi}} \draw (\x,0) -- (\x,-0.04) node[below,font=\scriptsize] {$\l$};
    \node[font=\scriptsize,blue] at (3.6,0.5) {$|V_3/V_0|^2$ coupled};
    \node[font=\scriptsize] at (3.4,1.08) {$|V_2/V_0|^2$ through};
    \node[font=\scriptsize,anchor=east] at (0,0.36) {$C^2$};
    \node[font=\scriptsize,anchor=east] at (0,0.64) {$1-C^2$};
    \node[font=\scriptsize,anchor=east] at (0,1) {$1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_0=\sqrt{Z_{0e}Z_{0o}},\qquad C=\frac{Z_{0e}-Z_{0o}}{Z_{0e}+Z_{0o}},\qquad Z_{0e}=Z_0\sqrt{\frac{1+C}{1-C}},\quad Z_{0o}=Z_0\sqrt{\frac{1-C}{1+C}}}
$$

$$
\boxed{\text{at } \ell=\lambda/4:\quad \frac{V_3}{V_0}=C,\qquad \frac{V_2}{V_0}=-j\sqrt{1-C^2},\qquad V_4=0}
$$

- **Backward coupler:** the coupled port is on the *same end* as the input. Through and coupled outputs are $90^\circ$ apart.
- As long as $Z_0=\sqrt{Z_{0e}Z_{0o}}$, the coupler is matched and isolated at **every** frequency; only the coupling varies (maximum at $\ell=\lambda/4$, periodic).
- **Best for weak coupling** (10–30 dB). Tight coupling needs impossibly close lines: a 3 dB design needs $Z_{0e}=120.7\ \Omega$, $Z_{0o}=20.7\ \Omega$.

**Design procedure:**
1. Voltage coupling $C=10^{-C_{dB}/20}$.
2. $Z_{0e}$, $Z_{0o}$ from the boxed formulas.
3. Read $W$ and $S$ off a coupled-line chart (Pozar Fig. 7.29 stripline, Fig. 7.30 microstrip on $\epsilon_r=10$) or a CAD line calculator.
4. Length $\lambda/4$ at $f_0$. In microstrip, check even/odd phase velocity mismatch in EM simulation; it sets the directivity.

> [!example]- Worked example: 20 dB stripline coupler at 3 GHz (Pozar Ex. 7.7, p. 355)
> $C=10^{-20/20}=0.1$. $Z_{0e}=50\sqrt{1.1/0.9}=55.28\ \Omega$, $Z_{0o}=50\sqrt{0.9/1.1}=45.23\ \Omega$.
> Stripline, $b=0.32$ cm, $\epsilon_r=2.2$: $\sqrt{\epsilon_r}Z_{0e}=82.0$, $\sqrt{\epsilon_r}Z_{0o}=67.1$; Fig. 7.29 gives $W/b=0.809$, $S/b=0.306$, so $W=0.259$ cm and $S=0.098$ cm.
> Lossless directivity is typically above 70 dB; with $\tan\delta=0.05$ and 2 mil copper the losses pull it down (Pozar Fig. 7.34).

> [!note]- Derivation: coupled-line coupler (Pozar Eqs. 7.72–7.86)
> Drive port 1 with $2V_0$ through $Z_0$; ports 2, 3, 4 terminated in $Z_0$. Split into even (ports 1 and 3 driven $+V_0$) and odd ($+V_0$, $-V_0$). Each mode sees a line of $Z_{0e}$ or $Z_{0o}$, length $\theta$, terminated in $Z_0$:
> $Z_{in}^{e}=Z_{0e}\dfrac{Z_0+jZ_{0e}\tan\theta}{Z_{0e}+jZ_0\tan\theta}$, same for odd.
> $Z_{in}=\dfrac{V_1^e+V_1^o}{I_1^e+I_1^o}=Z_0+\dfrac{2(Z_{in}^oZ_{in}^e-Z_0^2)}{Z_{in}^e+Z_{in}^o+2Z_0}$. With $Z_0^2=Z_{0e}Z_{0o}$, $Z_{in}^eZ_{in}^o=Z_0^2$ at every $\theta$, so $Z_{in}=Z_0$.
> Coupled port: $V_3=V_1^e-V_1^o=V_0\dfrac{j(Z_{0e}-Z_{0o})\tan\theta}{2Z_0+j(Z_{0e}+Z_{0o})\tan\theta}=V_0\dfrac{jC\tan\theta}{\sqrt{1-C^2}+j\tan\theta}$.
> Through: $V_2=V_0\dfrac{\sqrt{1-C^2}}{\sqrt{1-C^2}\cos\theta+j\sin\theta}$. Isolated: $V_4=V_2^e-V_2^o=0$.
> At $\theta=\pi/2$: $V_3/V_0=C$, $V_2/V_0=-j\sqrt{1-C^2}$; power conserves.

> [!note]- Detail: multisection coupled-line couplers (Pozar Ex. 7.8, p. 358)
> For weak coupling each section contributes $jC_n\sin\theta e^{-j\theta}$ at the coupled port, delayed by $2\theta$ per section. A symmetric $N$-section coupler ($N$ odd) has
> $\dfrac{V_3}{V_1}=2j\sin\theta e^{-jN\theta}\left[C_1\cos(N-1)\theta+C_2\cos(N-3)\theta+\dots+\tfrac12C_M\right]$, a Fourier series in $\theta$: you synthesize the **coupling** response (the opposite of the multihole waveguide coupler, where the coupled path is the frequency-independent one and you synthesize directivity).
> **3-section, 20 dB, maximally flat, 3 GHz:** $d^2C/d\theta^2=0$ at $\pi/2$ gives $10C_1=C_2$; midband $C_2-2C_1=0.1$. So $C_1=C_3=0.0125$, $C_2=0.125$. Sections: $Z_{0e}/Z_{0o}=50.63/49.38\ \Omega$ (outer) and $56.69/44.10\ \Omega$ (centre). Coupling stays near 20 dB across 1–5 GHz with directivity above 100 dB (ideal lines, Pozar Fig. 7.37). Decade bandwidths are possible; equal even/odd velocities matter more as the coupler gets longer, so stripline is preferred.

### Lange Coupler

```tikz title="Unfolded Lange coupler (top view): four interdigitated quarter-wave fingers, alternate fingers tied together, so each finger couples on both edges and 3 dB becomes realizable. After Pozar Fig. 7.38b."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1cm,y=1cm]
  \fill[green!8] (-1.5,-1.5) rectangle (9.5,3.4);
  \tikzset{cu/.style={fill=orange!70!black}}
  % four fingers, y = 0, 0.6, 1.2, 1.8 (width 0.3)
  % fingers A (1 and 3 from bottom: y=0 and y=1.2) start left at x=0 joined to port 1 strip; fingers B (y=0.6, 1.8) from right
  \fill[cu] (0,0) rectangle (7,0.3);
  \fill[cu] (0,1.2) rectangle (7,1.5);
  \fill[cu] (1,0.6) rectangle (8,0.9);
  \fill[cu] (1,1.8) rectangle (8,2.1);
  % left spine joining A fingers, right spine joining B fingers
  \fill[cu] (-0.3,0) rectangle (0,1.5);
  \fill[cu] (8,0.6) rectangle (8.3,2.1);
  % ports
  \fill[cu] (-1.4,0) rectangle (-0.3,0.3);    % port 1
  \fill[cu] (7,0) rectangle (7.3,-1.0);        % port 3 coupled? (end of A fingers bottom)
  \fill[cu] (8.3,1.8) rectangle (9.4,2.1);     % port 2
  \fill[cu] (1,2.1) rectangle (1.3,3.1);       % port 4
  \node[font=\scriptsize,anchor=south] at (-0.85,0.35) {1 input};
  \node[font=\scriptsize,anchor=west] at (7.35,-0.8) {2 through};
  \node[font=\scriptsize,anchor=south] at (8.85,2.15) {4 isolated};
  \node[font=\scriptsize,anchor=west] at (1.35,3.0) {3 coupled};
  % bond wires joining A fingers at right end and B fingers at left end
  \draw[thick,blue] (6.8,0.15) .. controls (7.2,0.7) .. (6.8,1.35);
  \draw[thick,blue] (1.2,0.75) .. controls (0.8,1.3) .. (1.2,1.95);
  \draw[<->] (0,-0.5) -- (7,-0.5) node[midway,fill=green!8,font=\scriptsize] {$\lambda/4$};
  \node[font=\scriptsize,blue,align=center] at (4,-1.15) {bond wires (blue) tie alternate fingers together};
\end{circuitikz}
\end{document}
```

Four (or more) interdigitated $\lambda/4$ fingers, alternate fingers tied together with bond wires. Each finger couples on both edges, so a **3 dB quadrature coupler** becomes realizable, with **an octave or more** of bandwidth, and the interdigitation partly equalizes the even/odd phase velocities in microstrip.

$$
\boxed{Z_{0e}=\frac{4C-3+\sqrt{9-8C^2}}{2C\sqrt{(1-C)/(1+C)}}Z_0,\qquad Z_{0o}=\frac{4C+3-\sqrt{9-8C^2}}{2C\sqrt{(1+C)/(1-C)}}Z_0}
$$

($Z_{0e},Z_{0o}$ are for any adjacent *pair* of fingers.) For 3 dB, 50 Ω ($C=0.707$): $Z_{0e}=176\ \Omega$, $Z_{0o}=52.6\ \Omega$, compared with $120.7/20.7\ \Omega$ for a plain coupled-line pair. Much looser per pair, so the gap is manufacturable.

- **Cost:** very narrow lines and gaps, plus bond wires (or airbridges in MMIC). In the folded layout (Pozar Fig. 7.38a) both outputs exit on the far side, convenient for a balanced amplifier.
- **Where used:** balanced MMIC amplifiers (Pozar p. 586), wideband quadrature splits.

> [!note]- Derivation: four-wire to two-wire (Pozar Eqs. 7.92–7.100)
> Four-line capacitances: outer lines $C_{ex}$, inner $C_{in}\approx C_{ex}-\dfrac{C_{ex}C_m}{C_{ex}+C_m}$, between neighbours $C_m$. Even: $C_{e4}=C_{ex}+C_{in}$. Odd (electric wall through each $C_m$): $C_{o4}=C_{ex}+C_{in}+6C_m$.
> A two-wire pair has $C_e=C_{ex}$, $C_o=C_{ex}+2C_m$. Eliminating: $C_{e4}=\dfrac{C_e(3C_e+C_o)}{C_e+C_o}$, $C_{o4}=\dfrac{C_o(3C_o+C_e)}{C_e+C_o}$, i.e.
> $Z_{e4}=\dfrac{Z_{0o}+Z_{0e}}{3Z_{0o}+Z_{0e}}Z_{0e}$, $Z_{o4}=\dfrac{Z_{0o}+Z_{0e}}{3Z_{0e}+Z_{0o}}Z_{0o}$.
> Apply the coupled-line results to $Z_{e4},Z_{o4}$: $Z_0=\sqrt{Z_{e4}Z_{o4}}$, $C=\dfrac{3(Z_{0e}^2-Z_{0o}^2)}{3(Z_{0e}^2+Z_{0o}^2)+2Z_{0e}Z_{0o}}$; invert for the boxed design equations. Approximate (nearest-neighbour coupling, equal mode velocities) but usually adequate.

## Level 3: 180° Hybrids

### Rat-Race Coupler

```tikz title="Rat-race (ring) hybrid in microstrip, top view: 70.7-ohm ring, 1.5 guided wavelengths round, ports a quarter wave apart except the 3/4-wave segment from 4 back to 2. Dimensions for 2 GHz on 0.762 mm eps_r = 2.2. After Pozar Fig. 7.42a."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.6mm,y=1.6mm]
  \fill[green!8] (-48,-42) rectangle (48,40);
  \tikzset{cu/.style={draw=orange!70!black,line cap=butt}}
  % ring radius 26.6mm, 70.7 ohm W=1.35mm; ports: 2 at 135deg, 1 at 180? use: 2 at 150, 1 at 180+? choose angles: lambda/4 = 60 deg of ring (1.5 lambda = 360)
  \draw[cu,line width=1.35*1.6mm] (0,0) circle[radius=26.6];
  % port angles: 2 at 120, 1 at 180, 3 at 240, 4 at 300 (3l/4 from 4 back to 2 = 180 deg)
  \foreach \a/\n in {120/{2},180/{1 ($\Sigma$)},240/{3},300/{4 ($\Delta$)}} {
    \draw[cu,line width=2.35*1.6mm] (\a:26.6) -- (\a:38);
    \node[font=\scriptsize] at (\a:42.5) {\n};
  }
  \node[font=\scriptsize] at (150:21) {$\lambda/4$};
  \node[font=\scriptsize] at (210:21) {$\lambda/4$};
  \node[font=\scriptsize] at (270:21) {$\lambda/4$};
  \node[font=\scriptsize] at (30:21) {$3\lambda/4$};
  \node[font=\scriptsize,align=center] at (0,3) {ring $\sqrt2Z_0=70.7\ \Omega$\\ $W=1.35$ mm, mean radius $26.6$ mm\\ circumference $1.5\lambda_g=167$ mm};
  \node[font=\scriptsize,align=center] at (0,-7) {feeds $50\ \Omega$, $W=2.35$ mm};
  \node[font=\scriptsize,anchor=east,align=right] at (46,37) {2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm};
  \node[font=\scriptsize,anchor=east,align=right] at (46,31) {in at 1: 2, 3 in phase, 4 isolated\\ in at 4: 2, 3 at $180^\circ$, 1 isolated};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{ring } \sqrt2Z_0=70.7\ \Omega,\quad \text{circumference } 1.5\lambda_g\ \ (\lambda/4,\lambda/4,\lambda/4,3\lambda/4\ \text{between ports})}
$$

- **Feed $\Sigma$ (port 1):** ports 2 and 3 get equal, **in-phase** halves ($-j/\sqrt2$ each), port 4 isolated.
- **Feed $\Delta$ (port 4):** ports 2 and 3 get equal halves **$180^\circ$ apart** ($+j/\sqrt2$, $-j/\sqrt2$), port 1 isolated.
- **Combine at 2 and 3:** the sum appears at $\Sigma$, the difference at $\Delta$.
- **Why it works:** from port 1, the two ways round the ring to port 4 differ by $\lambda/2$ and cancel; to ports 2 and 3 they arrive in phase.

**Design procedure:**
1. Ring impedance $\sqrt2Z_0$; circumference $1.5\lambda_g$ at $f_0$ (ring $\epsilon_e$, not the feeds').
2. Place the ports at $\lambda/4$ spacing over half the ring ($60^\circ$ of arc each), leaving the $3\lambda/4$ segment between ports 4 and 2.
3. Numbers for the layout above (2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm): ring $W=1.35$ mm, $\lambda_g=111.3$ mm, circumference 167 mm, mean radius 26.6 mm.
4. Bandwidth about 20–30% (Pozar p. 367); more with extra sections or a symmetric-ring variant.

> [!example]- Worked example: 50 Ω ring hybrid (Pozar Ex. 7.9, p. 367)
> Ring $\sqrt2Z_0=70.7\ \Omega$, feeds 50 Ω. Solving the ideal network: return loss and isolation better than 20 dB over about 28%, 15 dB over about 40%; at $0.9f_0$ the in-phase outputs are $-3.2$ and $-2.9$ dB and $6^\circ$ apart. The $3\lambda/4$ arm makes it wider than the branch-line but its outputs drift in phase faster.

> [!note]- Derivation: even-odd analysis of the ring (Pozar Eqs. 7.102–7.109)
> Bisect through ports 1 and 4's axis. Feeding port 1: each half is a $\lambda/4$ line of $\sqrt2$ between ports 1 and 2, with a $\lambda/8$ stub (open for even, shorted for odd) on the port-1 side and a $3\lambda/8$ stub on the port-2 side.
> $\begin{bmatrix}A&B\\C&D\end{bmatrix}_e=\begin{bmatrix}1&j\sqrt2\\j\sqrt2&-1\end{bmatrix}$, $\begin{bmatrix}A&B\\C&D\end{bmatrix}_o=\begin{bmatrix}-1&j\sqrt2\\j\sqrt2&1\end{bmatrix}$
> $\Gamma_e=-j/\sqrt2$, $T_e=-j/\sqrt2$, $\Gamma_o=j/\sqrt2$, $T_o=-j/\sqrt2$.
> $B_1=\tfrac12(\Gamma_e+\Gamma_o)=0$, $B_2=\tfrac12(T_e+T_o)=-j/\sqrt2$, $B_3=\tfrac12(\Gamma_e-\Gamma_o)=-j/\sqrt2$, $B_4=\tfrac12(T_e-T_o)=0$.
> Feeding port 4 swaps the roles of the two stubs; the same steps give $B_1=0$, $B_2=j/\sqrt2$, $B_3=-j/\sqrt2$, $B_4=0$.

> [!note]- Detail: tapered coupled-line hybrid and magic-T (Pozar Sec. 7.8)
> **Tapered coupled-line 180° hybrid.** Two coupled lines whose $Z_{0e}(z)$ tapers from $Z_0$ to $Z_0/k$ and $Z_{0o}(z)$ from $Z_0$ to $kZ_0$ (with $Z_{0e}Z_{0o}=Z_0^2$ everywhere, usually a Klopfenstein taper), followed by equal-length uncoupled lines for phase compensation. Arbitrary split with a decade or more of bandwidth:
> $[S]=\begin{bmatrix}0&\beta&\alpha&0\\\beta&0&0&-\alpha\\\alpha&0&0&\beta\\0&-\alpha&\beta&0\end{bmatrix}e^{-2j\theta}$, $\beta=\dfrac{2\sqrt k}{k+1}$, $\alpha=\dfrac{1-k}{1+k}$.
> **Magic-T.** A waveguide E-plane and H-plane tee in one junction. A TE10 wave into the $\Sigma$ arm has odd symmetry about the $\Delta$ arm, which only supports even TE10: no coupling to $\Delta$, equal in-phase split. Into $\Delta$: equal split, $180^\circ$ apart. Matched with symmetric posts or irises.

### Bandwidth Compared

```tikz title="Return loss vs frequency for the three quarter-wave hybrids, computed from the ideal line networks (isolation tracks return loss closely). Percentages are the 20 dB bandwidth. Compare Pozar Figs. 7.12, 7.25, 7.46."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=7cm,y=0.12cm]
  % axes: x = f/f0 from 0.5 to 1.5 mapped to 0..1 ; y = dB 0..-40
  \draw[->] (0,0) -- (1.05,0) node[right] {$f/f_0$};
  \draw[->] (0,-40) -- (0,3) node[above] {$|S_{11}|$ (dB)};
  \foreach \y in {-10,-20,-30,-40} { \draw (0,\y) -- (-0.01,\y) node[left,font=\scriptsize] {$\y$}; \draw[gray!30] (0,\y) -- (1,\y); }
  \foreach \x/\l in {0/0.5,0.25/0.75,0.5/1,0.75/1.25,1/1.5} { \draw (\x,-40) -- (\x,-41) node[below,font=\scriptsize] {\l}; }
  \draw[gray,dashed] (0,-20) -- (1,-20);
  % Wilkinson S11 (computed)
  \draw[thick,blue] plot coordinates {(0,-12.3)(0.05,-13.0)(0.1,-13.8)(0.15,-14.8)(0.2,-16.0)(0.25,-17.5)(0.3,-19.3)(0.35,-21.7)(0.4,-25.2)(0.45,-31.1)(0.48,-40)(0.52,-40)(0.55,-31.1)(0.6,-25.2)(0.65,-21.7)(0.7,-19.3)(0.75,-17.5)(0.8,-16.0)(0.85,-14.8)(0.9,-13.8)(0.95,-13.0)(1,-12.3)};
  % ring S11
  \draw[thick,red] plot coordinates {(0,-3.4)(0.05,-3.4)(0.1,-4.0)(0.15,-5.7)(0.2,-8.3)(0.25,-11.4)(0.3,-15.0)(0.35,-19.0)(0.4,-23.9)(0.45,-30.8)(0.48,-40)(0.52,-40)(0.55,-30.8)(0.6,-23.9)(0.65,-19.0)(0.7,-15.0)(0.75,-11.4)(0.8,-8.3)(0.85,-5.7)(0.9,-4.0)(0.95,-3.4)(1,-3.4)};
  % branch-line S11
  \draw[thick,black!70!green] plot coordinates {(0,-4.4)(0.05,-4.5)(0.1,-4.8)(0.15,-5.2)(0.2,-5.9)(0.25,-7.0)(0.3,-8.5)(0.35,-10.8)(0.4,-14.3)(0.45,-20.4)(0.48,-40)(0.52,-40)(0.55,-20.4)(0.6,-14.3)(0.65,-10.8)(0.7,-8.5)(0.75,-7.0)(0.8,-5.9)(0.85,-5.2)(0.9,-4.8)(0.95,-4.5)(1,-4.4)};
  \node[blue,font=\scriptsize,anchor=west] at (1.02,-12.3) {Wilkinson (36\%)};
  \node[red,font=\scriptsize,anchor=west] at (1.02,-2) {rat-race (28\%)};
  \node[black!70!green,font=\scriptsize,anchor=west] at (1.02,-6.5) {branch-line (10\%)};
  \node[font=\scriptsize,anchor=west,gray] at (0.02,-22) {20 dB line};
\end{circuitikz}
\end{document}
```

| Device | 20 dB RL and isolation BW | 15 dB BW | What fails first |
|---|---|---|---|
| Wilkinson | ≈36% | ≈64% | Return loss and isolation (split stays ≈3 dB) |
| Rat-race | ≈28% | ≈40% | Match/isolation; output phase drifts a few degrees |
| Branch-line | ≈10% | ≈19% | Amplitude balance and isolation |
| Coupled-line (1 section) | match and isolation ideal at all $f$ | | Coupling level (peaks at $\lambda/4$); directivity in microstrip |
| Lange | octave+ | | Fabrication (fine gaps, bond wires) |

(First three: computed from the ideal transmission-line networks of Pozar Figs. 7.8, 7.21, 7.42a with return loss and isolation as the criterion; Pozar quotes 10–20% for the branch-line and 20–30% for the ring.)

## Level 4: In the Front End

### Balanced Amplifier

```tikz title="Balanced amplifier: two identical amplifiers between two 90-degree hybrids. Input reflections cancel at the input port and are absorbed in the terminations. After Pozar Fig. 12.11."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{hy/.style={draw,thick,fill=blue!5,minimum width=1.6cm,minimum height=2.4cm,align=center,font=\scriptsize}}
  \node[hy] (H1) at (0,0) {90$^\circ$\\ hybrid};
  \node[hy] (H2) at (7,0) {90$^\circ$\\ hybrid};
  \draw (-2.4,0.8) node[left] {in} -- (-0.8,0.8);
  \draw (-0.8,-0.8) -- (-1.4,-0.8) to[R,l_=$Z_0$] (-1.4,-2.2) node[ground]{};
  \draw (0.8,0.8) -- (2.6,0.8) node[midway,above,font=\scriptsize] {$\tfrac{1}{\sqrt2}\angle0^\circ$};
  \draw[thick,fill=white] (2.6,1.3) -- (2.6,0.3) -- (3.8,0.8) -- cycle; \coordinate (A) at (3.8,0.8);
  \draw (0.8,-0.8) -- (2.6,-0.8) node[midway,below,font=\scriptsize] {$\tfrac{1}{\sqrt2}\angle-90^\circ$};
  \draw[thick,fill=white] (2.6,-0.3) -- (2.6,-1.3) -- (3.8,-0.8) -- cycle; \coordinate (B) at (3.8,-0.8);
  \node[font=\scriptsize] at (3.2,1.6) {amp A};
  \node[font=\scriptsize] at (3.2,-1.6) {amp B};
  \draw (A) -- (6.2,0.8);
  \draw (B) -- (6.2,-0.8);
  \draw (7.8,0.8) -- (9.4,0.8) node[right] {out};
  \draw (7.8,-0.8) -- (8.4,-0.8) to[R,l=$Z_0$] (8.4,-2.2) node[ground]{};
  \node[font=\scriptsize,align=left,red,anchor=west] at (-0.9,-1.9) {reflections from A and B\\ cancel at "in", land here};
  \node[font=\scriptsize,align=left,anchor=west] at (-2.4,-3.9) {$S_{21}=-\tfrac{j}{2}(G_A+G_B)$,\quad $S_{11}=\tfrac12(\Gamma_A-\Gamma_B)$,\quad $F=\tfrac12(F_A+F_B)$,\quad one amp dead: $-6$ dB};
\end{circuitikz}
\end{document}
```

Two identical amplifiers between two 90° hybrids. Reflections from A and B return to the input hybrid $90^\circ$ apart twice over, so they **cancel at the input** and **add in the termination**:

- Each amplifier can be designed for flat gain or minimum NF, ignoring its own match.
- Reflections are absorbed in the hybrid terminations: better match and better stability of each stage.
- **Graceful failure:** one amplifier dead costs 6 dB, not the whole signal.
- Bandwidth an octave or more, limited by the hybrids. MMICs use Lange couplers here; branch-lines or Wilkinsons with an extra $90^\circ$ line also work.
- Cost: two amplifiers, two hybrids, twice the DC power, same gain as one stage.

> [!note]- Derivation: balanced-amplifier S-parameters (Pozar Eqs. 12.64–12.68)
> Input hybrid: $V_{A1}^+=V_1^+/\sqrt2$, $V_{B1}^+=-jV_1^+/\sqrt2$.
> Output: $V_2^-=\tfrac{-j}{\sqrt2}G_AV_{A1}^++\tfrac{1}{\sqrt2}G_BV_{B1}^+=-\tfrac j2V_1^+(G_A+G_B)$, so $S_{21}=-\tfrac j2(G_A+G_B)$: the average gain.
> Reflections: $V_1^-=\tfrac{1}{\sqrt2}\Gamma_AV_{A1}^++\tfrac{-j}{\sqrt2}\Gamma_BV_{B1}^+=\tfrac12V_1^+(\Gamma_A-\Gamma_B)$, so $S_{11}=\tfrac12(\Gamma_A-\Gamma_B)=0$ for identical amplifiers.
> One amp dead ($G_B=0$): $|S_{21}|$ halves, $-6$ dB. Noise: $F=\tfrac12(F_A+F_B)$ (Pozar p. 587).

### Balanced and Image-Reject Mixers

Two single-ended mixers joined by a hybrid (Pozar Sec. 13.5):

| Hybrid | Gives | Doesn't give |
|---|---|---|
| $90^\circ$ | RF port matched over a wide band (diode reflections cancel at RF, like the balanced amp) | RF–LO isolation (depends on diode matching) |
| $180^\circ$ | RF–LO isolation over a wide band ($\Sigma$/$\Delta$ ports are isolated) | (RF match not claimed by Pozar; worked as Prob. 13.22) |

Both reject even-order intermodulation products. The **image-reject mixer** uses an RF $90^\circ$ hybrid, an in-phase LO split, and an IF $90^\circ$ hybrid to send the upper and lower sidebands to separate ports, with no extra loss beyond the usual conversion loss. The practical difficulty is building a good hybrid at the low IF. Mixer analysis lives in [[Mixers and Microwave Oscillators]].

### Balun

```tikz title="Two baluns: a 180-degree hybrid fed at its difference port (left) and a Marchand coupled-line balun (right). After Pozar Sec. 12.4 and Fig. 12.18b."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % 180 hybrid as balun
  \node[draw,thick,fill=blue!5,minimum width=1.6cm,minimum height=2.4cm,align=center,font=\scriptsize] (H) at (0,0) {180$^\circ$\\ hybrid};
  \draw (-0.8,-0.8) -- (-2.2,-0.8) node[left,align=right,font=\scriptsize] {4 ($\Delta$)\\ unbalanced in};
  \draw (-0.8,0.8) -- (-2.2,0.8) node[left,align=right,font=\scriptsize] {1 ($\Sigma$)\\ $Z_0$ load};
  
  \draw (0.8,0.8) -- (2.2,0.8) node[right,font=\scriptsize] {2: $+\tfrac{j}{\sqrt2}$};
  \draw (0.8,-0.8) -- (2.2,-0.8) node[right,font=\scriptsize] {3: $-\tfrac{j}{\sqrt2}$};
  \draw[decorate,decoration={brace,amplitude=4pt}] (3.5,1) -- (3.5,-1) node[midway,right=4pt,font=\scriptsize,align=left] {balanced\\ pair};
  % Marchand
  \begin{scope}[xshift=10cm]
    \tikzset{cu/.style={line width=3pt,orange!70!black}}
    \draw[cu] (-2.6,0.6) -- (2.6,0.6);
    \draw (2.6,0.6) -- (2.9,0.6) node[right,font=\scriptsize] {open};
    \draw[cu] (-2.4,0) -- (-0.15,0);
    \draw[cu] (0.15,0) -- (2.4,0);
    \draw (-2.4,0) -- (-2.4,-0.6) node[ground]{};
    \draw (2.4,0) -- (2.4,-0.6) node[ground]{};
    \draw (-0.15,0) -- (-0.15,-1.3) node[below,font=\scriptsize] {$+$};
    \draw (0.15,0) -- (0.15,-1.3) node[below,font=\scriptsize] {$-$};
    \node[font=\scriptsize] at (0,-2.1) {balanced out};
    \draw (-2.6,0.6) -- (-3.2,0.6) node[left,font=\scriptsize,align=right] {unbalanced\\ in};
    \node[font=\scriptsize] at (-1.3,0.95) {$\lambda/4$};
    \node[font=\scriptsize] at (1.3,0.95) {$\lambda/4$};
    \node[font=\scriptsize,align=center] at (0,1.6) {Marchand: two $\lambda/4$ coupled sections};
  \end{scope}
\end{circuitikz}
\end{document}
```

A **balun** (balanced-to-unbalanced) turns a ground-referenced signal into a differential pair, e.g. to drive a differential LNA, mixer or PA from a single-ended antenna (Pozar Sec. 12.4).

- **Low frequency:** a transformer with a centre-tapped secondary.
- **180° hybrid as balun:** feed the $\Delta$ port, terminate $\Sigma$; ports 2 and 3 are equal and $180^\circ$ apart. Any rat-race does this.
- **Marchand balun:** a $\lambda/2$ open-ended unbalanced line coupled to two $\lambda/4$ lines grounded at their far ends; the balanced output is taken between their inner ends.
- Two single-ended amplifiers between two 180° hybrids form a **pseudo-differential** amplifier (Pozar p. 594).

> [!tip] Remark
> A balun's quality is its mixed-mode behaviour: how much single-ended input converts to differential (wanted) versus common mode (amplitude and phase imbalance). The bookkeeping for that is [[Microwave Network Analysis#Level 4 Mixed-Mode S-Parameters]].

### PA Combining and LO Distribution

When one device can't deliver the power, combine $N$ of them (Pozar Sec. 11.1): an N-way Wilkinson, a tree of 2-way Wilkinsons, or a cavity combiner. Practical limit about 10–20 dB of power multiplication (combiner loss and higher-order modes).

$$
\boxed{\eta_{comb}=\frac{|1+re^{j\varphi}|^2}{2(1+r^2)}\qquad\text{(2-way, amplitude ratio } r\text{, phase error } \varphi)}
$$

- The **isolation resistor** absorbs the imbalance; size its rating for the worst case. One PA off: the other's power $P$ splits $P/2$ to the output and $P/2$ into the resistor (nothing reflects, $S_{22}=S_{23}=0$), and total output falls from $2P$ to $P/2$, i.e. 6 dB ([[#Spec translation]]).
- Phase match matters more than amplitude: $20^\circ$ costs 0.13 dB, 2 dB of amplitude costs 0.06 dB.
- The same Wilkinson splits an LO to I and Q mixers or to array elements while keeping each load's reflections out of the other branch ($S_{23}=0$).

### Couplers in a VNA

```tikz title="Left: a reflectometer samples incident and reflected waves; finite directivity D leaks the incident wave into the reflected sample. Right: the sliding-load directivity measurement traces a circle centred on the leakage (C/D)V_i. After Pozar pp. 323-324, 374-375."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % reflectometer
  \draw[very thick] (0,0) -- (6,0);
  \draw[thick,fill=blue!5] (1.5,-0.3) rectangle (4.5,0.9);
  \node[font=\scriptsize] at (3,0.3) {coupler $C$, $D$};
  \draw (0,0) to[sV] (0,-1.4) node[ground]{};
  \node[font=\scriptsize,anchor=east] at (-0.5,-0.7) {source};
  \draw (6,0) to[R,l=$\Gamma$] (6,-1.4) node[ground]{};
  \draw (1.8,0.9) -- (1.8,1.8) node[above,font=\scriptsize] {$V_r$ (4)};
  \draw (4.2,0.9) -- (4.2,1.8) node[above,font=\scriptsize] {$V_i$ (3)};
  \node[font=\scriptsize,align=center] at (3,-1.6) {$\left|\frac{V_r}{V_i}\right|=\frac{|\Gamma|\pm1/D}{1\mp|\Gamma|/D}$\quad (error $\approx\pm1/D$)};
  % directivity measurement locus
  \begin{scope}[xshift=9.6cm,yshift=0.2cm]
    \draw[->] (-0.4,0) -- (3.4,0) node[right,font=\scriptsize] {Re $V_0$};
    \draw[->] (0,-1.4) -- (0,1.6) node[above,font=\scriptsize] {Im $V_0$};
    \draw[thick,->] (0,0) -- (1.6,0) node[pos=0.3,above,font=\scriptsize] {$\frac{C}{D}V_i$};
    \draw[blue,thick] (1.6,0) circle[radius=1];
    \draw[->,red] (1.6,0) -- (2.307,0.707) node[above right,font=\scriptsize] {$C|\Gamma|V_i$};
    \node[font=\scriptsize,align=center] at (1.6,-1.85) {sliding load sweeps the phase:\\ $P_{max},P_{min}$ give $D$};
  \end{scope}
\end{circuitikz}
\end{document}
```

A **reflectometer** samples the incident wave (port 3) and reflected wave (port 4) of one coupler; $|V_r/V_i|\to|\Gamma|$. This is the front end of every scalar and vector network analyzer and of SWR and power monitors.

$$
\boxed{\left|\frac{V_r}{V_i}\right|_{max,min}=\frac{|\Gamma|\pm1/D}{1\mp|\Gamma|/D}\quad\Rightarrow\quad \text{error}\approx\pm\frac1D}
$$

Finite directivity leaks the incident wave into the "reflected" port. Good accuracy needs **$D>40$ dB** (Pozar p. 375). Example: with $D=40$ dB, $1/D=0.01$; a load with $|\Gamma|=0.1$ (20 dB return loss) reads between 0.09 and 0.11. A 30 dB-return-loss load ($|\Gamma|=0.03$) reads anywhere from 0.02 to 0.04.

> [!tip] Remark
> A VNA's calibration ([[Microwave Network Analysis#Error Model and Calibration]]) is largely there to remove this: the "directivity" term of the one-port error model *is* the coupler leakage, and calibration subtracts it as a vector. Raw coupler directivity still sets how stable that correction is.

## Level 5: Measuring Couplers and Dividers

### Measuring Isolation and Directivity

**Procedure (VNA, every unused port in a good load):**
1. Calibrate at the coupler's connectors ([[Microwave Network Analysis#Level 5 Measurement VNA, Calibration, De-embedding]]).
2. Measure $S_{11}$ (return loss), $S_{21}$ (through, gives $L$), $S_{31}$ (gives $C$), $S_{41}$ (gives $I$). Then $D=I-C$.
3. For hybrids and dividers also read amplitude balance $|S_{21}|/|S_{31}|$ (dB) and phase balance $\angle S_{21}-\angle S_{31}$ against the ideal $0^\circ$, $90^\circ$ or $180^\circ$. For a Wilkinson, isolation is $S_{32}$.
4. Sweep the band: directivity is the narrowband quantity.

**Directivity can't be read directly** because the leakage you want to see is tiny and the termination's reflection couples into the same port. Pozar's example: $C=20$ dB, $D=35$ dB, load return loss 30 dB. The directivity leakage is $C+D=55$ dB below the input, but the load's reflection coupled backward is $RL+C=50$ dB below: the load error is bigger than what you are trying to measure.

$$
\boxed{\text{to measure } D \text{ you need } RL_{load}>D}
$$

**Sliding-load method** (Pozar p. 323): reverse the coupler and terminate the through arm with a sliding load. The output is $V_0=V_i(C/D+C|\Gamma|e^{-j\theta})$; sliding the load sweeps $\theta$, so $V_0$ traces a circle centred on the leakage $C/D$ with radius $C|\Gamma|$. With $P_c=C^2P_i$ (the forward coupled power) and the circle's $P_{max}$, $P_{min}$:

$$
\boxed{\sqrt{M}=\sqrt{\frac{P_c}{P_{max}}}=\frac{D}{1+|\Gamma|D},\qquad \sqrt m=\sqrt{\frac{P_{max}}{P_{min}}}=\frac{1+|\Gamma|D}{1-|\Gamma|D},\qquad D=\sqrt M\,\frac{2\sqrt m}{\sqrt m+1}}
$$

Both ratios are measured with a calibrated variable attenuator; requires $|\Gamma|<1/D$.

> [!warning] Unverified
> Pozar (p. 324) prints the final step as $D=M\cdot\frac{2m}{m+1}$ with $M$, $m$ defined as the power ratios above. Solving his own two definitions gives the square-root form boxed here (check: $D=100$, $|\Gamma|D=0.5$ gives $M=4444$, $m=9$; the boxed form returns 100, the printed one 8000). Treat the printed form as a typo unless you find an erratum saying otherwise.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Lossless T instead of resistive | No dissipated power | Outputs mismatched, no isolation |
| Resistive instead of Wilkinson | Broadband, tiny, no lines | $-6$ dB per output, no isolation |
| Wilkinson isolation resistor | Output match and isolation | Burns any imbalance; needs a rating and a short bridge |
| More $\lambda/4$ sections (any type) | Bandwidth (to a decade) | Size, loss, more junctions to model |
| Branch-line → Lange | Bandwidth (octave+), compact | Fine gaps, bond wires / airbridges |
| Tighter coupled-line gap | More coupling | Manufacturability; $>$~10 dB coupling becomes unrealizable |
| Stripline instead of microstrip coupler | Directivity (equal mode velocities) | Two ground planes, harder to mount parts |
| Rat-race instead of branch-line | Wider band, in-phase or 180° outputs | $1.5\lambda$ ring, larger |
| Balanced amplifier | Match, stability, graceful failure, octave BW | 2× devices and DC power, hybrid loss adds to NF |
| Higher coupler directivity | VNA/reflectometer accuracy ($\pm1/D$) | Narrower band; demands better loads to verify |

## Cheat sheet

| Result | Equation |
|---|---|
| 3-port impossibility | lossless + reciprocal + all matched: impossible |
| Ideal coupler | $\alpha^2+\beta^2=1$, $S_{14}=S_{23}=0$ |
| Coupler specs | $C=-20\log\beta$, $D=20\log(\beta/|S_{14}|)$, $I=-20\log|S_{14}|$, $L=-20\log|S_{12}|$ |
| Isolation | $I=C+D$ (dB) |
| 90° hybrid | $[S]=\frac{-1}{\sqrt2}\begin{bmatrix}0&j&1&0\\j&0&0&1\\1&0&0&j\\0&1&j&0\end{bmatrix}$ |
| 180° hybrid | $[S]=\frac{-j}{\sqrt2}\begin{bmatrix}0&1&1&0\\1&0&0&-1\\1&0&0&1\\0&-1&1&0\end{bmatrix}$ |
| Even-odd | even: midplane open; odd: midplane shorted; add |
| Lossless T | $1/Z_1+1/Z_2=1/Z_0$ |
| Resistive divider | $R=Z_0/3$, $S_{21}=\tfrac12$ |
| Wilkinson (equal) | $\sqrt2Z_0$, $\lambda/4$, $R=2Z_0$, $S_{21}=-j/\sqrt2$ |
| Wilkinson (unequal) | $Z_{03}=Z_0\sqrt{(1+K^2)/K^3}$, $Z_{02}=K^2Z_{03}$, $R=Z_0(K+1/K)$ |
| Branch-line | series $Z_0/\sqrt2$, shunt $Z_0$, all $\lambda/4$ |
| Coupled-line | $Z_0=\sqrt{Z_{0e}Z_{0o}}$, $C=\frac{Z_{0e}-Z_{0o}}{Z_{0e}+Z_{0o}}$, $Z_{0e,0o}=Z_0\sqrt{\frac{1\pm C}{1\mp C}}$ |
| Coupled-line at $\lambda/4$ | $V_3/V_0=C$, $V_2/V_0=-j\sqrt{1-C^2}$, $V_4=0$ |
| Lange | $Z_{0e}=\frac{4C-3+\sqrt{9-8C^2}}{2C\sqrt{(1-C)/(1+C)}}Z_0$, $Z_{0o}=\frac{4C+3-\sqrt{9-8C^2}}{2C\sqrt{(1+C)/(1-C)}}Z_0$ |
| Rat-race | ring $\sqrt2Z_0$, $1.5\lambda$, ports $\lambda/4$ apart + $3\lambda/4$ |
| Balanced amplifier | $S_{21}=-\tfrac j2(G_A+G_B)$, $S_{11}=\tfrac12(\Gamma_A-\Gamma_B)$, $F=\tfrac12(F_A+F_B)$ |
| Combiner efficiency | $\eta=\frac{|1+re^{j\varphi}|^2}{2(1+r^2)}$, $=\cos^2(\varphi/2)$ for $r=1$ |
| Reflectometer error | $|V_r/V_i|=\frac{|\Gamma|\pm1/D}{1\mp|\Gamma|/D}$ |
| Measuring $D$ | need $RL_{load}>D$; $D=\sqrt M\frac{2\sqrt m}{\sqrt m+1}$ |

## References

- **Pozar, *Microwave Engineering* 4th ed.** (PDF page = printed + 20):
  - Ch. 7 in full, pp. 317–375: Sec. 7.1 (3- and 4-port properties, Eqs. 7.1–7.23, directivity-measurement Point of Interest pp. 323–324), 7.2 (T-junction, Ex. 7.1; resistive divider), 7.3 (Wilkinson, even-odd, Ex. 7.2, unequal and N-way, Figs. 7.8–7.15), 7.4 (Bethe hole, multihole; folded), 7.5 (branch-line, Ex. 7.5), 7.6 (coupled lines, Figs. 7.26–7.30, single-section Ex. 7.7, multisection Ex. 7.8), 7.7 (Lange, Eqs. 7.92–7.100, Fig. 7.38), 7.8 (rat-race Ex. 7.9, tapered coupled-line hybrid, magic-T), 7.9 (other couplers; reflectometer Point of Interest pp. 374–375).
  - Sec. 11.1 "Power Combining", pp. 539–540.
  - Sec. 12.4 balanced amplifiers pp. 586–588 (Eqs. 12.64–12.68, Ex. 12.7); differential amplifiers and baluns pp. 593–594 (Fig. 12.18).
  - Sec. 13.5 balanced mixer and image-reject mixer pp. 646–650.
- **ECE 373 binder** (Boumaiza), "RF Couplers and Dividers" lecture, binder pp. 316–374: 3-port/4-port properties (pp. 317–325), T-junction and resistive divider (pp. 326–328), Wilkinson even-odd and unequal split (pp. 329–340), branch-line (pp. 341–350), rat-race (pp. 351–358), coupled lines, even/odd velocity mismatch and coupled-line coupler (pp. 359–371), multisection and Lange (pp. 372–374). Follows Pozar Ch. 7 closely.
- **Computed for this note** (ideal transmission-line networks solved by nodal analysis; microstrip widths from the synthesis formulas in [[Transmission Lines#Microstrip Characteristic Impedance Synthesis]]): Wilkinson, branch-line and rat-race bandwidths and imbalance; the 2 GHz, $\epsilon_r=2.2$, $d=0.762$ mm layout dimensions; 2:1 Wilkinson; 3 dB coupled-line and Lange impedances; combiner efficiency numbers.
- Worked problem: [[Exam Prep - Problems through Stability#Pozar 4.27 (PS2 Q7) Hybrid‑coupler variable attenuator|Exam Prep 4.27]] (hybrid-coupler attenuator).
