---
title: Microwave Network Analysis
description: Describing any linear N-port by Z, Y, h, ABCD or S matrices, converting and connecting them, solving terminated networks with power waves and signal-flow graphs, and measuring S with a calibrated VNA (SOL, TRL, de-embedding, mixed-mode).
kind: topic
status: growing
aliases:
  - Microwave Network Analysis
  - S-Parameters
  - S-Parameter Properties
  - Z-Parameters
  - Y-Parameters
  - ABCD Parameters
  - Hybrid Parameters
  - Two-Port Parameter Conversions
  - Two-Port Network Interconnections
  - Power Waves
  - Signal Flow Graphs
---

Once a line or a component has a $Z_0$ and a $\beta$ ([[Transmission Lines]]), we stop solving Maxwell and treat every component as a box with ports. This note is about the matrices that describe the box: which one to use for which job, how to convert and connect them, how to solve a terminated network by inspection, and how a VNA measures one. As in [[MosFETs]], each level opens the box a bit further.

## The big picture

```tikz title="One two-port, five descriptions. Z, Y, h and ABCD relate total port voltages and currents; S relates the waves a (in) and b (out). Each is defined by a different termination of the other port. After Pozar Figs. 4.5, 4.11, 4.14 and ECE 373 binder pp. 105-122."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=blue!5] (0,0) rectangle (3,2.4);
  \node[align=center] at (1.5,1.2) {linear\\ two-port};
  \draw (-2.2,2) node[ocirc]{} -- (0,2);
  \draw (-2.2,0.4) node[ocirc]{} -- (0,0.4);
  \draw (3,2) -- (5.2,2) node[ocirc]{};
  \draw (3,0.4) -- (5.2,0.4) node[ocirc]{};
  \node at (-2.2,1.2) {$V_1$};
  \node[font=\scriptsize] at (-2.2,1.7) {$+$};
  \node[font=\scriptsize] at (-2.2,0.7) {$-$};
  \node at (5.2,1.2) {$V_2$};
  \node[font=\scriptsize] at (5.2,1.7) {$+$};
  \node[font=\scriptsize] at (5.2,0.7) {$-$};
  \draw[->] (-1.6,2.25) -- (-0.6,2.25) node[midway,above] {$I_1$};
  \draw[->] (4.6,2.25) -- (3.6,2.25) node[midway,above] {$I_2$};
  \draw[->,red,thick] (-1.5,1.45) -- (-0.3,1.45) node[midway,above,font=\scriptsize] {$a_1$};
  \draw[->,red,thick] (-0.3,0.95) -- (-1.5,0.95) node[midway,below,font=\scriptsize] {$b_1$};
  \draw[->,red,thick] (4.5,1.45) -- (3.3,1.45) node[midway,above,font=\scriptsize] {$a_2$};
  \draw[->,red,thick] (3.3,0.95) -- (4.5,0.95) node[midway,below,font=\scriptsize] {$b_2$};
  \begin{scope}[yshift=-1.9cm]
    \foreach \x/\t in {-4.4/{\textbf{Z}\\ $[V]=[Z][I]$\\ other ports open\\ series: add},
                      -1.4/{\textbf{Y}\\ $[I]=[Y][V]$\\ other ports shorted\\ parallel: add},
                      1.6/{\textbf{h}\\ $V_1,I_2$ from $I_1,V_2$\\ mixed open/short\\ series-shunt: add},
                      4.6/{\textbf{ABCD}\\ $V_1,I_1$ from $V_2,I_2$\\ chain\\ cascade: multiply},
                      7.6/{\textbf{S}\\ $[b]=[S][a]$\\ other ports matched\\ what a VNA measures}} {
      \node[draw,rounded corners,align=center,font=\scriptsize,minimum width=2.65cm,minimum height=1.6cm,fill=gray!6] at (\x,0) {\t};
    }
  \end{scope}
  \node[font=\scriptsize,red,align=center] at (6.6,1.2) {waves\\ (S)};
  \node[font=\scriptsize,align=center] at (-3.6,1.2) {total $V,I$\\ (Z, Y, h, ABCD)};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Any one matrix describes a linear network completely.** They differ only in which port variables are independent, and so in which termination defines each entry: Z (other ports **open**), Y (**shorted**), S (**matched**).
> 2. **$S_{ij}=b_i/a_j$ with every other port matched.** $S_{11}$ is the input reflection coefficient and $|S_{21}|^2$ the transducer gain *only* with matched terminations. Change a termination and the network's S stays the same, but what you see at the port changes.
> 3. **Reciprocal → symmetric** ($Z=Z^t$, $Y=Y^t$, $S=S^t$, $AD-BC=1$). **Lossless → Z, Y imaginary and S unitary**: each column has unit power, e.g. $|S_{11}|^2+|S_{21}|^2=1$.
> 4. **Connections pick the matrix:** series → Z add, parallel → Y add, series-shunt → h add, cascade → ABCD (or T) multiply, in order.
> 5. **Terminated two-port:** $\Gamma_{in}=S_{11}+\dfrac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L}$. Signal-flow graphs give results like this by inspection.
> 6. **A VNA measures S at its own connectors.** Calibration (SOL, TRL) solves for the error boxes between those planes and the DUT and removes them (de-embedding).

**Map:** [[#Physics background|why V and I become waves]] → [[#Level 0 Ports and Reference Planes|ports, planes]] → [[#Level 1 Voltage-Current Matrices|Z, Y, h, ABCD, interconnections]] → [[#Level 2 Waves and the Scattering Matrix|power waves, S, properties, plane shifts]] → [[#Two-Port Parameter Conversions|conversions, T-matrix]] → [[#Signal Flow Graphs|signal-flow graphs]] → [[#Level 4 Mixed-Mode S-Parameters|differential S]] → [[#Level 5 Measurement VNA, Calibration, De-embedding|VNA, SOL, TRL, de-embedding]].

## Physics background

The whole chapter rests on one move: replace the fields at a port by a voltage and a current (or by two waves) whose product is the power through that port.

> [!tip] Remark
> Fields, Poynting power and reciprocity are derived in [[EM Foundations]]; $Z_0$, $\Gamma$ and the line equations in [[Transmission Lines]]. This section only says what network analysis takes from them.

### Equivalent Voltages and Currents

- **TEM lines** (coax, stripline, approximately microstrip): $V=\int_+^-\bar E\cdot d\bar\ell$ and $I=\oint\bar H\cdot d\bar\ell$ are unique, so $Z_0=V/I$ is unique.
- **Waveguides** (TE/TM): the line integral of $\bar E$ depends on the path, so there is no unique $V$. We *define* an equivalent $V$, $I$ per mode so that (1) $V\propto E_t$, $I\propto H_t$; (2) $\tfrac12VI^*$ is the mode's power; (3) $V^+/I^+=Z_0$, usually chosen as the wave impedance or normalized to 1.
- A waveguide carrying several propagating modes is one *electrical port per mode*.

> [!note]- Detail: equivalent V and I for TE10, and a waveguide junction as a line junction (Pozar Ex. 4.1, 4.2)
> Write the transverse fields as $\bar E_t=\frac{\bar e}{C_1}(V^+e^{-j\beta z}+V^-e^{j\beta z})$, $\bar H_t=\frac{\bar h}{C_2}(I^+e^{-j\beta z}-I^-e^{j\beta z})$. The power condition fixes $C_1C_2^*=\int_S\bar e\times\bar h^*\cdot\hat z\,ds$, and the impedance condition fixes $C_1/C_2=Z_0$.
> For TE10 ($E_y\propto\sin(\pi x/a)$) with $Z_0=Z_{TE}$: $C_1=\sqrt{ab/2}$, $C_2=\frac{1}{Z_{TE}}\sqrt{ab/2}$.
> Ex. 4.2: an X-band guide ($a=2.286$ cm, $b=1.016$ cm) at 10 GHz, air for $z<0$ and Rexolite ($\epsilon_r=2.54$) for $z>0$. $\beta_a=158.0$ m⁻¹, $\beta_d=304.1$ m⁻¹, so $Z_{0a}=k_0\eta_0/\beta_a=500.0\ \Omega$ and $Z_{0d}=259.6\ \Omega$. The interface is a junction of two lines: $\Gamma=\frac{259.6-500}{259.6+500}=-0.316$.

### Impedance, Stored Energy and Loss

$$
\boxed{Z_{in}=R+jX=\frac{P_\ell+2j\omega(W_m-W_e)}{\tfrac12|I|^2}}
$$

$R$ is set by the power dissipated, $X$ by the *net* stored energy: $X>0$ (inductive) when magnetic energy dominates, $X<0$ (capacitive) when electric energy does. A lossless network has $R=0$.

> [!note]- Detail: even and odd parts of $Z(\omega)$ and $\Gamma(\omega)$
> Because $v(t)$ is real, $V(-\omega)=V^*(\omega)$, and the same holds for $I$ and $Z$. So $R(\omega)$ is even and $X(\omega)$ is odd. Then $\Gamma(-\omega)=\Gamma^*(\omega)$, so $|\Gamma(\omega)|^2$ is even in $\omega$: it can only be expanded as $a+b\omega^2+c\omega^4+\dots$ (the form used to synthesize matching networks and filters).

### Where Reciprocity and Losslessness Come From

- **Reciprocity:** the Lorentz reciprocity theorem applied at the port planes gives $V_1^aI_1^b-V_1^bI_1^a+V_2^aI_2^b-V_2^bI_2^a=0$, which forces $Y_{12}=Y_{21}$. It holds for any network without active devices, ferrites or plasmas.
- **Losslessness:** $\mathrm{Re}\{P_{avg}\}=\tfrac12\mathrm{Re}\{[I]^t[Z][I]^*\}=0$ for every current vector forces $\mathrm{Re}\{Z_{mn}\}=0$ for all $m,n$.

> [!tip] Remark
> The theorem itself is [[EM Foundations#Reciprocity]]. Everything in [[#S-Parameter Properties]] is these two facts rewritten for waves.

> [!note]- Derivation: $Y_{12}=Y_{21}$ and $\mathrm{Re}\,Z_{mn}=0$ (Pozar §4.2)
> **Reciprocity.** Short every port except 1 and 2. For two independent sources $a$ and $b$, $\oint_S(\bar E_a\times\bar H_b-\bar E_b\times\bar H_a)\cdot d\bar s=0$. On metal walls $E_{tan}=0$, so only the port planes contribute. With $\bar E_{1a}=V_{1a}\bar e_1$, $\bar H_{1a}=I_{1a}\bar h_1$ and the modal fields normalized so that $\int\bar e\times\bar h\cdot d\bar s=1$:
> $$V_{1a}I_{1b}-V_{1b}I_{1a}+V_{2a}I_{2b}-V_{2b}I_{2a}=0$$
> Substitute $I_1=Y_{11}V_1+Y_{12}V_2$, $I_2=Y_{21}V_1+Y_{22}V_2$: $(V_{1a}V_{2b}-V_{1b}V_{2a})(Y_{12}-Y_{21})=0$. The sources are arbitrary, so $Y_{12}=Y_{21}$. The inverse of a symmetric matrix is symmetric, so $Z_{12}=Z_{21}$ too.
>
> **Losslessness.** $P_{avg}=\tfrac12\sum_m\sum_nI_mZ_{mn}I_n^*$. Drive only port $n$: $|I_n|^2\mathrm{Re}\{Z_{nn}\}=0$. Drive only $m$ and $n$: $\mathrm{Re}\{(I_nI_m^*+I_mI_n^*)Z_{mn}\}=0$, and the bracket is real and nonzero, so $\mathrm{Re}\{Z_{mn}\}=0$.

### Discontinuities Are Reactances

A step, gap, bend or transition launches evanescent higher-order modes. They don't carry power away but store energy next to the junction, so **every discontinuity looks like a reactive equivalent circuit** (plus a reference-plane shift) between two lines.

> [!note]- Detail: waveguide discontinuities and modal analysis (Pozar §4.6, Figs. 4.12, 4.22)
> | Discontinuity | Equivalent circuit |
> |---|---|
> | Inductive diaphragm (iris narrowing the broad wall), H-plane step (change in width) | Shunt $L$ |
> | Capacitive diaphragm (narrowing the height), E-plane step (change in height) | Shunt $C$ |
> | Resonant iris (rectangular or circular hole) | Shunt parallel $LC$ |
> | Coax-to-microstrip transition | Shunt $C_1$, series $L$, shunt $C_2$ |
>
> **Modal analysis** (H-plane step): write the fields on each side as a sum of $TE_{n0}$ modes with unknown amplitudes, enforce continuity of $E_y$, $H_x$ over the aperture and $E_y=0$ on the step wall, project onto each mode with the orthogonality integrals, truncate to $N$ modes and solve the linear system. $A_1$ is the reflection of the incident $TE_{10}$; the higher modes are below cutoff and only add stored (here magnetic) energy, hence the shunt inductance.
> Microstrip discontinuities (open end, gap, width step, T-junction) are in [[Transmission Lines]]. Pozar §4.7–4.8 (exciting waveguides with probes, loops and apertures) is not covered here.

## Level 0: Ports and Reference Planes

```tikz title="An N-port. Each port is a line with a terminal plane t_n where V_n, I_n (or the waves V_n^+ in, V_n^- out) are defined. The plane fixes the phase of every parameter. After Pozar Fig. 4.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=blue!5] (0,-2) rectangle (2.6,2);
  \node[align=center] at (1.3,0) {$N$-port\\ $[Z],[Y],[S]$};
  \foreach \y/\n in {1.3/1,-1.3/N} {
    \draw (-3.5,{\y+0.25}) -- (0,{\y+0.25});
    \draw (-3.5,{\y-0.25}) -- (0,{\y-0.25});
    \draw[dashed] (-0.6,{\y+0.55}) -- (-0.6,{\y-0.55}) node[below,font=\scriptsize] {$t_{\n}$};
    \draw[->,red] (-3.0,{\y+0.45}) -- (-1.6,{\y+0.45}) node[midway,above,font=\scriptsize] {$V_{\n}^+$};
    \draw[->,red] (-1.6,{\y-0.45}) -- (-3.0,{\y-0.45}) node[midway,below,font=\scriptsize] {$V_{\n}^-$};
  }
  \node at (-1.8,0.05) {$\vdots$};
  \draw (2.6,0.25) -- (5,0.25);
  \draw (2.6,-0.25) -- (5,-0.25);
  \draw[dashed] (3.2,0.55) -- (3.2,-0.55) node[below,font=\scriptsize] {$t_2$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.2,0) {$V_n=V_n^++V_n^-$\\ $I_n=I_n^+-I_n^-$\\ $I_n^\pm=V_n^\pm/Z_{0n}$};
\end{circuitikz}
\end{document}
```

- A **port** is one propagating mode on one line. A **terminal (reference) plane** $t_n$ is a chosen point on it; all phases are referred to it.
- $V_n$, $I_n$ are *total* port quantities; $V_n^\pm$ are the incident and reflected waves. $I_n$ points **into** the network (except for ABCD, below).
- A two-port has 4 variables. Choose 2 as independent and you get one of the matrices below.

> [!tip] Remark
> $V=V^++V^-$, $I=(V^+-V^-)/Z_0$ is the line solution at $z=0$ from [[Transmission Lines]]. Network analysis is that solution, one per port, glued to a matrix.

## Level 1: Voltage-Current Matrices

### Z-Parameters

$$
\boxed{[V]=[Z][I],\qquad Z_{ij}=\left.\frac{V_i}{I_j}\right|_{I_k=0,\ k\ne j}}
$$

Drive port $j$ with a current, **open** every other port, read the voltage at port $i$. $Z_{ii}$ is the input impedance with the other ports open; $Z_{ij}$ is the open-circuit transfer impedance.

```tikz title="Any reciprocal two-port is a T of impedances (left, from Z) or a pi of admittances (right, from Y). After Pozar Fig. 4.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,0) node[ocirc]{} to[generic,l=$Z_{11}-Z_{12}$] (2.6,0) to[generic,l=$Z_{22}-Z_{12}$] (5.2,0) node[ocirc]{};
  \draw (2.6,0) to[generic,l=$Z_{12}$] (2.6,-2);
  \draw (0,-2) node[ocirc]{} -- (5.2,-2) node[ocirc]{};
  \node at (2.6,-2.6) {T equivalent};
  \begin{scope}[xshift=7cm]
    \draw (0,0) node[ocirc]{} -- (0.9,0) to[generic,l=$-Y_{12}$] (4.3,0) -- (5.2,0) node[ocirc]{};
    \draw (0.9,0) to[generic,l_=$Y_{11}+Y_{12}$] (0.9,-2);
    \draw (4.3,0) to[generic,l=$Y_{22}+Y_{12}$] (4.3,-2);
    \draw (0,-2) node[ocirc]{} -- (5.2,-2) node[ocirc]{};
    \node at (2.6,-2.6) {$\pi$ equivalent};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Example (Pozar Ex. 4.3):** a T of series $Z_A$, shunt $Z_C$, series $Z_B$ has $Z_{11}=Z_A+Z_C$, $Z_{12}=Z_{21}=Z_C$, $Z_{22}=Z_B+Z_C$. Read straight off the T: **T networks are easy in Z.**
- **Open/short measurement:** $Z_{11}=Z_{OC}^{(1)}$, $Z_{22}=Z_{OC}^{(2)}$, $Z_{12}^2=(Z_{OC}^{(1)}-Z_{SC}^{(1)})Z_{OC}^{(2)}$ ([[Exam Prep - Problems through Stability#4.8 Z from open/short measurements|Exam Prep 4.8]]).
- **A line section:** $Z_{11}=Z_{22}=-jZ_0\cot\beta\ell$, $Z_{12}=Z_{21}=-jZ_0\csc\beta\ell$ ([[Exam Prep - Problems through Stability#4.9 ★ Z‑parameters of a TL section|Exam Prep 4.9]]).
- A reciprocal two-port has 3 independent complex entries (6 real degrees of freedom); a lossless reciprocal one has 3 real ones, so its T or π is three pure reactances. A nonreciprocal network has no passive reciprocal equivalent circuit.

### Y-Parameters

$$
\boxed{[I]=[Y][V],\qquad Y_{ij}=\left.\frac{I_i}{V_j}\right|_{V_k=0,\ k\ne j},\qquad [Y]=[Z]^{-1}}
$$

Drive port $j$ with a voltage, **short** every other port, read the current at port $i$. **π networks are easy in Y** (shunt $Z_A$, series $Z_B$, shunt $Z_A$: $Y_{11}=1/Z_A+1/Z_B$, $Y_{12}=-1/Z_B$); get the other matrix by inversion ([[Exam Prep - Problems through Stability#4.7 📝PS2 Q1 ★ Z and Y of π and T networks|Exam Prep 4.7]]).

> [!tip] Remark
> A transistor's $C_{gd}$ bridges input and output, which makes the small-signal model of [[MosFETs#Small-Signal Models]] a π: that is why device models are usually written in Y.

### Hybrid Parameters

$$
\boxed{\begin{bmatrix}V_1\\I_2\end{bmatrix}=\begin{bmatrix}h_{11}&h_{12}\\h_{21}&h_{22}\end{bmatrix}\begin{bmatrix}I_1\\V_2\end{bmatrix}}
$$

```tikz title="h-parameter equivalent circuit: a Thevenin input (h11 with a reverse-feedback source h12 V2) and a Norton output (h21 I1 with admittance h22). After ECE 373 binder p. 117."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} to[short,i=$I_1$] (0.9,2) to[generic,l=$h_{11}$] (2.9,2) to[cV,l_=$h_{12}V_2$] (2.9,0) -- (0,0) node[ocirc]{};
  \draw (5,2) to[cI,l=$h_{21}I_1$] (5,0);
  \draw (7.4,2) to[generic,l=$h_{22}$] (7.4,0);
  \draw (5,2) -- (9.0,2) node[ocirc]{};
  \draw (5,0) -- (9.0,0) node[ocirc]{};
  \draw[->] (9.5,2.35) -- (8.6,2.35) node[midway,above] {$I_2$};
  \node at (0,1) {$V_1$};
  \node at (9.0,1) {$V_2$};
\end{circuitikz}
\end{document}
```

| Entry | Condition | Name |
|---|---|---|
| $h_{11}=V_1/I_1$ | $V_2=0$ | short-circuit input impedance |
| $h_{12}=V_1/V_2$ | $I_1=0$ | open-circuit reverse voltage gain |
| $h_{21}=I_2/I_1$ | $V_2=0$ | short-circuit forward current gain |
| $h_{22}=I_2/V_2$ | $I_1=0$ | open-circuit output admittance |

- Built for transistors: for a BJT, $h_{11}\approx r_\pi$ ($h_{ie}$) and $h_{21}\approx\beta$ ($h_{fe}$). Reciprocal networks have $h_{12}=-h_{21}$.
- **Worked example** ([[Exam Prep - Problems through Stability|Exam Prep: interconnections + h-parameters]]): a T with series 10 Ω, shunt 50 Ω, series 20 Ω gives $h_{11}=24.29\ \Omega$, $h_{12}=0.714$, $h_{21}=-0.714$, $h_{22}=14.3$ mS, which converts back to $Z=(60,50,50,70)\ \Omega$.

### ABCD Parameters

$$
\boxed{\begin{bmatrix}V_1\\I_1\end{bmatrix}=\begin{bmatrix}A&B\\C&D\end{bmatrix}\begin{bmatrix}V_2\\I_2\end{bmatrix},\qquad I_2\ \text{flows OUT of port 2}}
$$

Port 1 in terms of port 2. With $I_2$ pointing out, the output current of one block is the input current of the next, so **a cascade is a matrix product** (in order; matrices don't commute):

$$
\boxed{[ABCD]_{total}=[ABCD]_1[ABCD]_2\cdots[ABCD]_n}
$$

| Element | $A$ | $B$ | $C$ | $D$ |
|---|---|---|---|---|
| Series $Z$ | 1 | $Z$ | 0 | 1 |
| Shunt $Y$ | 1 | 0 | $Y$ | 1 |
| Line $Z_0,\beta,\ell$ | $\cos\beta\ell$ | $jZ_0\sin\beta\ell$ | $jY_0\sin\beta\ell$ | $\cos\beta\ell$ |
| Ideal transformer $N:1$ | $N$ | 0 | 0 | $1/N$ |
| π: shunt $Y_1$, series $Y_3$, shunt $Y_2$ | $1+Y_2/Y_3$ | $1/Y_3$ | $Y_1+Y_2+Y_1Y_2/Y_3$ | $1+Y_1/Y_3$ |
| T: series $Z_1$, shunt $Z_3$, series $Z_2$ | $1+Z_1/Z_3$ | $Z_1+Z_2+Z_1Z_2/Z_3$ | $1/Z_3$ | $1+Z_2/Z_3$ |

- **Meaning:** $A=V_1/V_2|_{I_2=0}$ (open-circuit voltage ratio), $B=V_1/I_2|_{V_2=0}$, $C=I_1/V_2|_{I_2=0}$, $D=I_1/I_2|_{V_2=0}$.
- **Checks:** reciprocal $\Rightarrow AD-BC=1$; symmetric $\Rightarrow A=D$; lossless and reciprocal $\Rightarrow A,D$ real and $B,C$ imaginary.
- **Reversed network** (ports swapped, reciprocal): $\begin{bmatrix}D&B\\C&A\end{bmatrix}$ ([[Exam Prep - Problems through Stability#4.25 Reversed network|Exam Prep 4.25]]).
- **Input impedance with a load:** $Z_{in}=\dfrac{AZ_L+B}{CZ_L+D}$.

> [!tip] Remark
> The line row is the [[Transmission Lines]] input-impedance formula in matrix form: put $Z_L$ in $Z_{in}=(AZ_L+B)/(CZ_L+D)$ and divide by $\cos\beta\ell$ to get $Z_0\frac{Z_L+jZ_0\tan\beta\ell}{Z_0+jZ_L\tan\beta\ell}$. A quarter-wave line ($A=D=0$, $B=jZ_0$, $C=jY_0$) gives $Z_{in}=Z_0^2/Z_L$, the inverter of [[Smith Chart and Impedance Matching]].

> [!warning] Sign convention
> The ECE 373 binder (p. 118) writes $V_1=AV_2-BI_2$, $I_1=CV_2-DI_2$ with $I_2$ flowing **into** port 2. That is the same matrix as Pozar's with $I_2\to-I_2$; the numbers in the table above don't change. Just don't mix the two conventions in one calculation.

> [!example] Worked example: ABCD chain (Exam Prep 4.24, Pozar Prob. 4.24)
> A 3∠0° V source with 50 Ω feeds a 1:2 transformer ($N=\tfrac12$), then a 90° line of 50 Ω, then $Z_L=25\ \Omega$:
> $$\begin{bmatrix}1&50\\0&1\end{bmatrix}\begin{bmatrix}\tfrac12&0\\0&2\end{bmatrix}\begin{bmatrix}0&j50\\j/50&0\end{bmatrix}=\begin{bmatrix}j2&j25\\j0.04&0\end{bmatrix}$$
> $V_s=AV_L+BI_L=j2V_L+j25\,V_L/25=j3V_L$, so $V_L=1\angle-90^\circ$ V. Sanity check: the λ/4 line turns 25 Ω into 100 Ω, and the 1:2 transformer turns 100 Ω into 25 Ω at the primary. ([[Exam Prep - Problems through Stability#4.24 📝PS2 Q3 ★ ABCD chain with a transformer and a λ/4 line|Exam Prep 4.24]])

> [!note]- Derivation: ABCD from Z (Pozar Eq. 4.73)
> With $I_2$ out of port 2: $V_1=Z_{11}I_1-Z_{12}I_2$, $V_2=Z_{21}I_1-Z_{22}I_2$.
> $A=\frac{V_1}{V_2}\big|_{I_2=0}=\frac{Z_{11}}{Z_{21}}$, $C=\frac{I_1}{V_2}\big|_{I_2=0}=\frac{1}{Z_{21}}$.
> With $V_2=0$: $I_1=I_2Z_{22}/Z_{21}$, so $D=\frac{Z_{22}}{Z_{21}}$ and $B=\frac{Z_{11}Z_{22}-Z_{12}Z_{21}}{Z_{21}}$.
> Then $AD-BC=\frac{Z_{11}Z_{22}-(Z_{11}Z_{22}-Z_{12}Z_{21})}{Z_{21}^2}=\frac{Z_{12}}{Z_{21}}$, which is 1 exactly when the network is reciprocal.

### Two-Port Network Interconnections

```tikz title="The three basic interconnections and which matrix adds or multiplies. Series: the same current flows through both input (and both output) ports. Parallel: both share the port voltages. Cascade: output of one is input of the next. After ECE 373 binder pp. 106-108."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % series
  \draw[fill=blue!5] (0,1.2) rectangle (1.8,2.4); \node at (0.9,1.8) {$N_a$};
  \draw[fill=blue!5] (0,-0.6) rectangle (1.8,0.6); \node at (0.9,0) {$N_b$};
  \draw (-0.8,2.1) node[ocirc]{} -- (0,2.1);
  \draw (0,1.5) -- (-0.4,1.5) -- (-0.4,0.3) -- (0,0.3);
  \draw (-0.8,-0.3) node[ocirc]{} -- (0,-0.3);
  \draw (1.8,2.1) -- (2.6,2.1) node[ocirc]{};
  \draw (1.8,1.5) -- (2.2,1.5) -- (2.2,0.3) -- (1.8,0.3);
  \draw (1.8,-0.3) -- (2.6,-0.3) node[ocirc]{};
  \node[align=center] at (0.9,-1.4) {series-series\\ $[Z]=[Z_a]+[Z_b]$};
  % parallel
  \begin{scope}[xshift=4.6cm]
    \draw[fill=blue!5] (0,1.2) rectangle (1.8,2.4); \node at (0.9,1.8) {$N_a$};
    \draw[fill=blue!5] (0,-0.6) rectangle (1.8,0.6); \node at (0.9,0) {$N_b$};
    \draw (-0.9,2.1) node[ocirc]{} -- (0,2.1);
    \draw (-0.9,1.5) node[ocirc]{} -- (0,1.5);
    \draw (-0.4,2.1) node[circ]{} -- (-0.4,0.3) -- (0,0.3);
    \draw (-0.65,1.5) node[circ]{} -- (-0.65,-0.3) -- (0,-0.3);
    \draw (1.8,2.1) -- (2.7,2.1) node[ocirc]{};
    \draw (1.8,1.5) -- (2.7,1.5) node[ocirc]{};
    \draw (2.2,2.1) node[circ]{} -- (2.2,0.3) -- (1.8,0.3);
    \draw (2.45,1.5) node[circ]{} -- (2.45,-0.3) -- (1.8,-0.3);
    \node[align=center] at (0.9,-1.4) {parallel-parallel\\ $[Y]=[Y_a]+[Y_b]$};
  \end{scope}
  % cascade
  \begin{scope}[xshift=9.2cm,yshift=0.9cm]
    \draw[fill=blue!5] (0,-0.6) rectangle (1.6,0.6); \node at (0.8,0) {$N_a$};
    \draw[fill=blue!5] (2.6,-0.6) rectangle (4.2,0.6); \node at (3.4,0) {$N_b$};
    \draw (-0.8,0.3) node[ocirc]{} -- (0,0.3); \draw (-0.8,-0.3) node[ocirc]{} -- (0,-0.3);
    \draw (1.6,0.3) -- (2.6,0.3); \draw (1.6,-0.3) -- (2.6,-0.3);
    \draw (4.2,0.3) -- (5,0.3) node[ocirc]{}; \draw (4.2,-0.3) -- (5,-0.3) node[ocirc]{};
    \node[align=center] at (2.1,-2.3) {cascade\\ $[ABCD]=[ABCD]_a[ABCD]_b$};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Connection (input side – output side) | Shared quantity | Matrix that adds |
|---|---|---|
| Series – series | port currents | $[Z]=[Z_a]+[Z_b]$ |
| Parallel – parallel | port voltages | $[Y]=[Y_a]+[Y_b]$ |
| Series – parallel | $I_1$ and $V_2$ | $[h]=[h_a]+[h_b]$ |
| Parallel – series | $V_1$ and $I_2$ | $[g]=[g_a]+[g_b]$ ($g=h^{-1}$) |
| Cascade | output = next input | $[ABCD]=[ABCD]_a[ABCD]_b$ (multiply) |

- **Rule:** an element in the *common lead* (emitter/source degeneration) is a series connection: add $\begin{bmatrix}Z&Z\\Z&Z\end{bmatrix}$ to the device's Z. An element *bridging* input and output (feedback $R_F$, $C_{gd}$) is a parallel connection: add $\begin{bmatrix}Y&-Y\\-Y&Y\end{bmatrix}$ to its Y.
- **Workflow with measured S:** S → Z (or Y), add, → S.

> [!example] Worked example: inductive emitter degeneration (Exam Prep PS2 Q6)
> A BJT at 10 GHz with $S=\begin{bmatrix}0.73\angle-126^\circ&0\\1.73\angle-73^\circ&0.75\angle-52^\circ\end{bmatrix}$ gets $L=0.1$ nH from emitter to ground ($j\omega L=j6.28\ \Omega$). Convert to $Z=\begin{bmatrix}9.77-j24.70&0\\-112.0-j84.0&34.2-j92.5\end{bmatrix}$, add $j6.28$ to **all four** entries, convert back: $S'_{11}=0.906\angle-141.9^\circ$, $S'_{21}=2.04\angle-81.5^\circ$, $S'_{22}=0.768\angle-62.2^\circ$, and $S'_{12}=0.094\angle153.8^\circ$. The feedback created reverse transmission where there was none, so stability must be rechecked ([[RF Amplifier Design]]). ([[Exam Prep - Problems through Stability#PS2 Q6 ★ Emitter degeneration via Z‑parameter addition|Exam Prep PS2 Q6]])

> [!tip] Remark
> These are the four feedback topologies of [[Feedback]]: series-shunt feedback is the h-connection, shunt-shunt the Y-connection, and so on. The matrices that add are the ones whose *independent* variables are shared by both networks.

> [!note]- Detail: when adding matrices is not allowed
> Adding Z (or Y, h) assumes each sub-network still sees equal and opposite currents at the two terminals of each of its ports after connection. If the connection lets current circulate between the sub-networks (e.g. two networks whose bottom terminals are already common, wired in series), that port condition breaks and the sum is wrong. Common-lead elements, bridging elements and grounded three-terminal devices (the cases above) satisfy it. Cascades never have this problem.

## Level 2: Waves and the Scattering Matrix

### Why Waves

Z, Y, h and ABCD each need ideal **opens or shorts** on the other port. At microwave frequencies:

- a real open has fringing capacitance and radiates; a real short has inductance;
- an active device terminated in an open or short may **oscillate**;
- full reflections set up standing waves that can damage parts;
- an instrument naturally measures the amplitude and phase of a *wave* travelling in one direction (a directional coupler), not a total $V$ or $I$.

S-parameters are defined with **matched** terminations instead, and are ratios of waves. (Binder p. 120–121, Pozar §4.3.)

### Power Waves

```tikz title="Power waves at any interface, even with no line present: a goes into the load, b comes back, both referred to a chosen reference impedance Z_R. Choosing Z_R = Z_L* makes b = 0. After Pozar Fig. 4.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[sV,l=$V_0$] (0,2.4) to[generic,l=$Z_g$] (2.6,2.4) to[short,i=$I$] (3.6,2.4) -- (5,2.4) to[generic,l=$Z_L$] (5,0) -- (0,0);
  \draw[dashed] (4.1,2.9) -- (4.1,-0.4) node[below,font=\scriptsize] {reference $Z_R$};
  \draw[->,red,thick] (3.4,1.6) -- (4.6,1.6) node[midway,above] {$a$};
  \draw[->,red,thick] (4.6,0.8) -- (3.4,0.8) node[midway,below] {$b$};
  \node at (6.4,1.9) {$+$};
  \node at (6.4,1.2) {$V$};
  \node at (6.4,0.5) {$-$};
\end{circuitikz}
\end{document}
```

**On a line with real $Z_0$** (the normalized waves of the binder):

$$
\boxed{a=\frac{V^+}{\sqrt{Z_0}}=\frac{V+Z_0I}{2\sqrt{Z_0}},\qquad b=\frac{V^-}{\sqrt{Z_0}}=\frac{V-Z_0I}{2\sqrt{Z_0}},\qquad P=\tfrac12|a|^2-\tfrac12|b|^2}
$$

**At any interface, with a complex reference $Z_R=R_R+jX_R$** (Pozar's power waves):

$$
\boxed{a=\frac{V+Z_RI}{2\sqrt{R_R}},\qquad b=\frac{V-Z_R^*I}{2\sqrt{R_R}},\qquad \Gamma_p=\frac{b}{a}=\frac{Z_L-Z_R^*}{Z_L+Z_R}}
$$

- $a$, $b$ have units of $\sqrt{\text{W}}$. $\tfrac12|a|^2$ is the incident power, $\tfrac12|b|^2$ the reflected power, and the **difference is the power delivered, for any choice of $Z_R$**.
- With $Z_R=Z_0$ real, $\Gamma_p$ is the ordinary $\Gamma$. With $Z_R=Z_L^*$, $b=0$ (no reflected power wave), though that alone doesn't mean maximum power transfer; that needs $Z_g=Z_L^*$.
- **Available power:** a source $E$ with internal $Z_0$ launches $a_1=E/(2\sqrt{Z_0})$, so $\boxed{P_{avs}=\tfrac12|a_1|^2=\dfrac{|E|^2}{8Z_0}}$, independent of what it is connected to. $|b_1|^2/2=P_{avs}-P_1$ is what the port sends back.
- Phasors here are **peak** values, hence the ½. With RMS phasors drop the ½.

> [!tip] Remark
> Voltage waves ($V^\pm$, $Z_0$ real) only make sense on a lossless line. Power waves work on lossy lines (complex $Z_0$) and at a bare source-load junction with no line at all, which is why amplifier gain and conjugate matching are written in them ([[RF Amplifier Design]], [[Smith Chart and Impedance Matching]]).

> [!example] Worked example: power waves through a λ/4 line (Exam Prep, Practice midterm Q2)
> 10∠0° V source with 50 Ω, a 100 Ω λ/4 line, 200 Ω load. $Z_{in}=100^2/200=50\ \Omega$, so $V_{in}=5$ V, $I_{in}=0.1$ A. Referred to 100 Ω: $a_1=\frac{5+10}{20}=0.75$, $b_1=-0.25$, $P=\tfrac12(0.5625-0.0625)=0.25$ W $=P_{avs}=\frac{100}{8\cdot50}$. Referred to 50 Ω instead: $a_1=0.707$, $b_1=0$, same 0.25 W. The reference changes $a$ and $b$, never the power. ([[Exam Prep - Problems through Stability#Practice midterm Q2 ★ λ/4 line, power waves, capacitor → inductor|Exam Prep: Practice midterm Q2]], [[Exam Prep - Problems through Stability#4.20 ☆ Power waves at two reference planes|Exam Prep 4.20]])

> [!note]- Detail: power waves of a source driving a load, and generalized S-parameters (Pozar Eqs. 4.62–4.68)
> **Power.** Invert: $V=\frac{Z_R^*a+Z_Rb}{\sqrt{R_R}}$, $I=\frac{a-b}{\sqrt{R_R}}$. Then $P_L=\tfrac12\mathrm{Re}\{VI^*\}=\frac{1}{2R_R}\mathrm{Re}\{Z_R^*|a|^2-Z_R^*ab^*+Z_Ra^*b-Z_R|b|^2\}=\tfrac12|a|^2-\tfrac12|b|^2$, since the cross terms are purely imaginary.
> **Source and load.** With $Z_R=Z_L^*$: $a=V_0\frac{\sqrt{R_L}}{Z_L+Z_g}$, $b=0$, and $P_L=\tfrac12|a|^2=\frac{V_0^2}{2}\frac{R_L}{|Z_L+Z_g|^2}$, the circuit-theory answer. $|a|$ is largest when $Z_g=Z_L^*$, giving $P_L=V_0^2/(8R_L)$.
> **N-port.** With a reference $Z_{Ri}$ per port, $[a]=[F]([V]+[Z_R][I])$, $[b]=[F]([V]-[Z_R]^*[I])$, $[F]=\mathrm{diag}\big(1/(2\sqrt{\mathrm{Re}Z_{Ri}})\big)$:
> $$[S_p]=[F]\big([Z]-[Z_R]^*\big)\big([Z]+[Z_R]\big)^{-1}[F]^{-1}$$
> Convert ordinary S to Z first, then use this. The diagonal entries can be zeroed by choosing each $Z_{Ri}$ as the conjugate of the impedance seen at that port.

### S-Parameters

$$
\boxed{[b]=[S][a],\qquad S_{ij}=\left.\frac{b_i}{a_j}\right|_{a_k=0,\ k\ne j}=\left.\frac{V_i^-}{V_j^+}\right|_{V_k^+=0}}
$$

$a_k=0$ means port $k$ is terminated in its own $Z_0$ (no wave comes back into it).

| Entry | Meaning (all other ports matched) | In dB |
|---|---|---|
| $S_{11}$ | input reflection coefficient | return loss $RL=-20\log\vert S_{11}\vert$ |
| $S_{21}$ | forward transmission | insertion loss $IL=-20\log\vert S_{21}\vert$ (gain if $>1$) |
| $S_{12}$ | reverse transmission (isolation) | |
| $S_{22}$ | output reflection coefficient | |

$$
\boxed{|S_{11}|^2=\frac{P_{avs}-P_1}{P_{avs}},\qquad |S_{21}|^2=\frac{P_L}{P_{avs}}=G_T\ \text{(matched source and load)},\qquad S_{21}=2\sqrt{\frac{Z_{01}}{Z_{02}}}\frac{V_2}{E_1}}
$$

> [!important] $S_{nn}$ is not "the" reflection coefficient
> $S_{nn}$ equals the reflection seen at port $n$ **only when every other port is matched**. S belongs to the network; terminations change what you see at the ports, not S.

> [!example] Worked example: matched 3 dB attenuator (Pozar Ex. 4.4)
> Series 8.56 Ω, shunt 141.8 Ω, series 8.56 Ω in a 50 Ω system. With port 2 matched, $Z_{in}=8.56+141.8\,\|\,58.56=50\ \Omega$, so $S_{11}=S_{22}=0$. Two voltage divisions give $V_2=V_1\frac{41.44}{50}\frac{50}{58.56}=0.707V_1$, and since both ports are matched $V_1=V_1^+$, $V_2=V_2^-$, so $S_{21}=S_{12}=0.707$: half the power (−3 dB) gets through. The 16.67–66.67–16.67 Ω T is the 6 dB version ($S_{21}=0.5$, [[Exam Prep - Problems through Stability#Past midterm 2018 P2 / Practice midterm Q3 ★ The 16.67–66.67–16.67 Ω T network|Exam Prep: past midterm P2]]).

> [!example] Worked example: what a termination does (Pozar Ex. 4.5)
> $S=\begin{bmatrix}0.15\angle0^\circ&0.85\angle-45^\circ\\0.85\angle45^\circ&0.2\angle0^\circ\end{bmatrix}$. Not symmetric → **not reciprocal**. $|S_{11}|^2+|S_{21}|^2=0.745\ne1$ → **lossy**. Port 2 matched: $\Gamma=S_{11}=0.15$, $RL=16.5$ dB. Port 2 shorted ($a_2=-b_2$): $\Gamma=S_{11}-\frac{S_{12}S_{21}}{1+S_{22}}=0.15-\frac{0.7225}{1.2}=-0.452$, $RL=6.9$ dB. Same S, very different port behavior.

More drills: series and shunt $Z$ ([[Exam Prep - Problems through Stability#4.11 ★ S of a series Z and a shunt Z|Exam Prep 4.11]]: $S_{21}=1-S_{11}$ for series, $1+S_{11}$ for shunt) and reading a 4-port matrix ([[Exam Prep - Problems through Stability#4.14 📝PS2 Q4 ★ Reading a 4‑port S‑matrix|Exam Prep 4.14]]).

> [!note]- Derivation: S from Z and back (Pozar Eqs. 4.42–4.45)
> Normalize all ports to $Z_0=1$: $V_n=V_n^++V_n^-$, $I_n=V_n^+-V_n^-$. Then $[Z][I]=[V]$ becomes $[Z]([V^+]-[V^-])=[V^+]+[V^-]$, i.e. $([Z]+[U])[V^-]=([Z]-[U])[V^+]$:
> $$[S]=([Z]+[U])^{-1}([Z]-[U]),\qquad [Z]=([U]+[S])([U]-[S])^{-1}$$
> For one port this is $S_{11}=\frac{z-1}{z+1}$, the familiar $\Gamma$. This assumes the same $Z_0$ at every port; otherwise use the generalized form above.

### S-Parameter Properties

| Property | Z, Y | S |
|---|---|---|
| Reciprocal (no ferrites, plasmas, active devices) | symmetric | $\boxed{[S]=[S]^t}$, $S_{ij}=S_{ji}$ |
| Lossless | purely imaginary | $\boxed{[S]^t[S]^*=[U]}$ (unitary) |
| Symmetric (ports interchangeable) | $Z_{11}=Z_{22}$ | $S_{11}=S_{22}$ (plus reciprocal) |

**Unitary, in words:** every column has unit power, $\sum_k|S_{ki}|^2=1$ (all incident power comes out somewhere), and any two different columns are orthogonal, $\sum_kS_{ki}S_{kj}^*=0$. The same holds for rows.

Consequences worth remembering:

- **Lossless reciprocal two-port:** $|S_{21}|^2=1-|S_{11}|^2$ and $|S_{11}|=|S_{22}|$. A lossless line that isn't $Z_0$ still reflects ($S_{11}\ne0$) and transmits the rest.
- **A lossless two-port can't be one-way** ($S_{12}=0$, $S_{21}\ne0$): orthogonality forces $S_{21}=0$. Isolators must absorb ([[Exam Prep - Problems through Stability#4.13 Lossless two‑port|Exam Prep 4.13]]).
- **A three-port can't be lossless, reciprocal and matched at all ports at once** ([[Exam Prep - Problems through Stability#4.15 Three‑port impossibility|Exam Prep 4.15]]). This is why the Wilkinson divider has a resistor and the circulator is nonreciprocal ([[Power Dividers and Couplers]]).
- **Quick lossy test:** if any column has $\sum_k|S_{ki}|^2<1$, the network dissipates.

> [!note]- Derivation: reciprocity and losslessness in S (Pozar Eqs. 4.46–4.53)
> **Symmetric.** $[V^+]=\tfrac12([Z]+[U])[I]$, $[V^-]=\tfrac12([Z]-[U])[I]$, so $[S]=([Z]-[U])([Z]+[U])^{-1}$. Transpose and use $[Z]^t=[Z]$: $[S]^t=([Z]+[U])^{-1}([Z]-[U])$, which is the other form of $[S]$. So $[S]^t=[S]$.
> **Unitary.** $P_{avg}=\tfrac12[V^+]^t[V^+]^*-\tfrac12[V^-]^t[V^-]^*$ (the cross terms are imaginary). Lossless means this is 0. With $[V^-]=[S][V^+]$: $[V^+]^t[V^+]^*=[V^+]^t[S]^t[S]^*[V^+]^*$ for every $[V^+]$, so $[S]^t[S]^*=[U]$.

### Shifting Reference Planes

```tikz title="Moving the reference planes outward by theta_n = beta_n l_n. Each S_mn picks up the phase of the extra path in and out. After Pozar Fig. 4.9 and binder p. 128."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=blue!5] (3,-0.8) rectangle (5,0.8);
  \node at (4,0) {$[S]$};
  \draw (0,0.3) -- (3,0.3); \draw (0,-0.3) -- (3,-0.3);
  \draw (5,0.3) -- (8,0.3); \draw (5,-0.3) -- (8,-0.3);
  \draw[dashed] (0.4,1.1) -- (0.4,-1.1) node[below,font=\scriptsize] {new plane 1};
  \draw[dashed] (2.6,1.1) -- (2.6,-1.1) node[below,font=\scriptsize] {old plane 1};
  \draw[dashed] (5.4,1.1) -- (5.4,-1.1) node[below,font=\scriptsize] {old plane 2};
  \draw[dashed] (7.6,1.1) -- (7.6,-1.1) node[below,font=\scriptsize] {new plane 2};
  \draw[<->] (0.4,1.0) -- (2.6,1.0) node[midway,above] {$\theta_1=\beta_1\ell_1$};
  \draw[<->] (5.4,1.0) -- (7.6,1.0) node[midway,above] {$\theta_2=\beta_2\ell_2$};
  \node[font=\scriptsize] at (4,-1.7) {$[S']$ seen at the new planes};
\end{circuitikz}
\end{document}
```

$$
\boxed{S'_{mn}=e^{-j(\theta_m+\theta_n)}S_{mn},\qquad S'_{nn}=e^{-2j\theta_n}S_{nn}}
$$

- A reflection travels the extra line twice, so $S_{nn}$ rotates by $2\theta_n$ (clockwise on the Smith chart, toward the generator).
- **De-embedding a known line** is the inverse: $S_{mn}=e^{+j(\theta_m+\theta_n)}S'_{mn}$. This is how you strip the feed lines off a measured fixture (binder p. 128–129).

> [!note]- Derivation: plane shift (Pozar Eqs. 4.54–4.56)
> On a lossless line, the wave entering the network at the old plane left the new plane $\theta_n$ earlier, and the outgoing wave reaches the new plane $\theta_n$ later: $V_n'^+=V_n^+e^{j\theta_n}$, $V_n'^-=V_n^-e^{-j\theta_n}$. Substituting into $[V^-]=[S][V^+]$ gives $[S']=\mathrm{diag}(e^{-j\theta_n})\,[S]\,\mathrm{diag}(e^{-j\theta_n})$.

## Level 3: Conversions and Signal-Flow Graphs

### Two-Port Parameter Conversions

All for a two-port with the same real $Z_0=1/Y_0$ at both ports (Pozar Table 4.2, binder p. 148). The one you use most is S ↔ ABCD, because cascades are done in ABCD and measured in S.

$$
\boxed{S_{11}=\frac{A+\frac{B}{Z_0}-CZ_0-D}{\Delta},\quad S_{12}=\frac{2(AD-BC)}{\Delta},\quad S_{21}=\frac{2}{\Delta},\quad S_{22}=\frac{-A+\frac{B}{Z_0}-CZ_0+D}{\Delta},\quad \Delta=A+\frac{B}{Z_0}+CZ_0+D}
$$

$$
\boxed{A=\frac{(1+S_{11})(1-S_{22})+S_{12}S_{21}}{2S_{21}},\ \ B=Z_0\frac{(1+S_{11})(1+S_{22})-S_{12}S_{21}}{2S_{21}},\ \ C=\frac{1}{Z_0}\frac{(1-S_{11})(1-S_{22})-S_{12}S_{21}}{2S_{21}},\ \ D=\frac{(1-S_{11})(1+S_{22})+S_{12}S_{21}}{2S_{21}}}
$$

| From → To | Z | Y | ABCD | h |
|---|---|---|---|---|
| **Z** | | $Y=Z^{-1}$: $\frac{Z_{22}}{\vert Z\vert},\frac{-Z_{12}}{\vert Z\vert},\frac{-Z_{21}}{\vert Z\vert},\frac{Z_{11}}{\vert Z\vert}$ | $\frac{Z_{11}}{Z_{21}},\frac{\vert Z\vert}{Z_{21}},\frac{1}{Z_{21}},\frac{Z_{22}}{Z_{21}}$ | $\frac{\vert Z\vert}{Z_{22}},\frac{Z_{12}}{Z_{22}},\frac{-Z_{21}}{Z_{22}},\frac{1}{Z_{22}}$ |
| **Y** | $\frac{Y_{22}}{\vert Y\vert},\frac{-Y_{12}}{\vert Y\vert},\frac{-Y_{21}}{\vert Y\vert},\frac{Y_{11}}{\vert Y\vert}$ | | $\frac{-Y_{22}}{Y_{21}},\frac{-1}{Y_{21}},\frac{-\vert Y\vert}{Y_{21}},\frac{-Y_{11}}{Y_{21}}$ | $\frac{1}{Y_{11}},\frac{-Y_{12}}{Y_{11}},\frac{Y_{21}}{Y_{11}},\frac{\vert Y\vert}{Y_{11}}$ |
| **ABCD** | $\frac{A}{C},\frac{AD-BC}{C},\frac{1}{C},\frac{D}{C}$ | $\frac{D}{B},\frac{BC-AD}{B},\frac{-1}{B},\frac{A}{B}$ | | |
| **h** | $\frac{\vert h\vert}{h_{22}},\frac{h_{12}}{h_{22}},\frac{-h_{21}}{h_{22}},\frac{1}{h_{22}}$ | | | |

Entries are listed in the order 11, 12, 21, 22 (or $A,B,C,D$). $|Z|=Z_{11}Z_{22}-Z_{12}Z_{21}$, and likewise $|Y|$, $|h|$.

> [!note]- Detail: S ↔ Z and S ↔ Y in full (Pozar Table 4.2)
> With $\Delta Z=(Z_{11}+Z_0)(Z_{22}+Z_0)-Z_{12}Z_{21}$:
> $$S_{11}=\frac{(Z_{11}-Z_0)(Z_{22}+Z_0)-Z_{12}Z_{21}}{\Delta Z},\ S_{12}=\frac{2Z_{12}Z_0}{\Delta Z},\ S_{21}=\frac{2Z_{21}Z_0}{\Delta Z},\ S_{22}=\frac{(Z_{11}+Z_0)(Z_{22}-Z_0)-Z_{12}Z_{21}}{\Delta Z}$$
> With $\Delta Y=(Y_{11}+Y_0)(Y_{22}+Y_0)-Y_{12}Y_{21}$:
> $$S_{11}=\frac{(Y_0-Y_{11})(Y_0+Y_{22})+Y_{12}Y_{21}}{\Delta Y},\ S_{12}=\frac{-2Y_{12}Y_0}{\Delta Y},\ S_{21}=\frac{-2Y_{21}Y_0}{\Delta Y},\ S_{22}=\frac{(Y_0+Y_{11})(Y_0-Y_{22})+Y_{12}Y_{21}}{\Delta Y}$$
> With $\Delta_S^Z=(1-S_{11})(1-S_{22})-S_{12}S_{21}$:
> $$Z_{11}=Z_0\frac{(1+S_{11})(1-S_{22})+S_{12}S_{21}}{\Delta_S^Z},\ Z_{12}=Z_0\frac{2S_{12}}{\Delta_S^Z},\ Z_{21}=Z_0\frac{2S_{21}}{\Delta_S^Z},\ Z_{22}=Z_0\frac{(1-S_{11})(1+S_{22})+S_{12}S_{21}}{\Delta_S^Z}$$
> With $\Delta_S^Y=(1+S_{11})(1+S_{22})-S_{12}S_{21}$:
> $$Y_{11}=Y_0\frac{(1-S_{11})(1+S_{22})+S_{12}S_{21}}{\Delta_S^Y},\ Y_{12}=Y_0\frac{-2S_{12}}{\Delta_S^Y},\ Y_{21}=Y_0\frac{-2S_{21}}{\Delta_S^Y},\ Y_{22}=Y_0\frac{(1+S_{11})(1-S_{22})+S_{12}S_{21}}{\Delta_S^Y}$$

> [!note]- Derivation: S from ABCD (Exam Prep 4.26)
> Terminate port 2 in $Z_0$ ($V_2=Z_0I_2$): $Z_{in}=\frac{AZ_0+B}{CZ_0+D}$, so $S_{11}=\frac{Z_{in}-Z_0}{Z_{in}+Z_0}=\frac{A+B/Z_0-CZ_0-D}{\Delta}$.
> With port 2 matched, $V_2=V_2^-=S_{21}V_1^+$ and $V_1=V_1^+(1+S_{11})=(A+B/Z_0)V_2$, so $S_{21}=\frac{1+S_{11}}{A+B/Z_0}=\frac{2}{\Delta}$. The other two follow the same way from port 2.

> [!example] Worked example: a mismatched line (Exam Prep, λ/8 line)
> A 100 Ω, λ/8 line in a 50 Ω system: $A=D=0.7071$, $B=j70.71\ \Omega$, $C=j0.007071$ S. $\Delta=1.414+j1.414+j0.354=2.264\angle51.3^\circ$, so $S_{11}=\frac{j1.061}{\Delta}=0.469\angle38.7^\circ$ and $S_{21}=\frac{2}{\Delta}=0.884\angle-51.3^\circ$. Check: $|S_{11}|^2+|S_{21}|^2=0.220+0.781=1.00$, lossless as it must be. ([[Exam Prep - Problems through Stability|Exam Prep: λ/8 line]])

**Cascading measured S-blocks: the T-matrix.** Defining $\begin{bmatrix}a_1\\b_1\end{bmatrix}=[T]\begin{bmatrix}b_2\\a_2\end{bmatrix}$ makes the waves leaving one block the waves entering the next, so $[T]=[T_a][T_b]$, the wave-domain ABCD:

$$
\boxed{T_{11}=\frac{1}{S_{21}},\quad T_{12}=-\frac{S_{22}}{S_{21}},\quad T_{21}=\frac{S_{11}}{S_{21}},\quad T_{22}=-\frac{S_{11}S_{22}-S_{12}S_{21}}{S_{21}}}
$$

([[Exam Prep - Problems through Stability#4.29 ☆ T‑parameters|Exam Prep 4.29]]; the binder calls these chain scattering parameters, p. 127. Other books order the waves differently, so check the definition before reusing a T-matrix.)

> [!warning] You can't multiply S-matrices
> S-parameters of a cascade are not the product of the S-matrices, and $S_{21}\ne S_{21}^aS_{21}^b$. The reflections bounce between the blocks: $S_{21}=\dfrac{S_{21}^aS_{21}^b}{1-S_{22}^aS_{11}^b}$ ([[Exam Prep - Problems through Stability#4.12 ★ Cascade S₂₁ via signal flow graph|Exam Prep 4.12]]). Convert to ABCD or T, multiply, convert back.

### Signal Flow Graphs

```tikz title="Signal-flow graph of a two-port between a source (b_s, Gamma_s) and a load (Gamma_L). Each port has an in-node a and an out-node b; each branch is an S-parameter or a reflection coefficient. After Pozar Figs. 4.14, 4.18 and binder p. 186."
\usepackage{circuitikz}
\usetikzlibrary{decorations.markings}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  mid/.style={postaction={decorate},decoration={markings,mark=at position 0.55 with {\arrow{stealth}}}},
  nd/.style={circle,draw,fill=white,inner sep=1.3pt}]
  \node[nd,label=above:$b_s$] (bs) at (-3,1.5) {};
  \node[nd,label=above:$a_1$] (a1) at (0,1.5) {};
  \node[nd,label=above:$b_2$] (b2) at (3.5,1.5) {};
  \node[nd,label=below:$b_1$] (b1) at (0,-1.5) {};
  \node[nd,label=below:$a_2$] (a2) at (3.5,-1.5) {};
  \draw[mid] (bs) -- node[above] {$1$} (-1.4,1.5) -- (a1);
  \draw[mid] (a1) -- node[above] {$S_{21}$} (b2);
  \draw[mid] (a1) -- node[left] {$S_{11}$} (b1);
  \draw[mid] (a2) -- node[right] {$S_{22}$} (b2);
  \draw[mid] (a2) -- node[below] {$S_{12}$} (b1);
  \draw[mid] (b2) -- (5,1.5) -- node[right] {$\Gamma_L$} (5,-1.5) -- (a2);
  \draw[mid] (b1) -- (-1.4,-1.5) -- node[left] {$\Gamma_s$} (-1.4,1.5);
  \draw[dashed,gray] (-0.8,-2.4) -- (-0.8,2.4);
  \draw[dashed,gray] (4.3,-2.4) -- (4.3,2.4);
  \node[font=\scriptsize,gray] at (-2.2,-2.3) {source};
  \node[font=\scriptsize,gray] at (1.75,-2.3) {two-port};
  \node[font=\scriptsize,gray] at (5.4,-2.3) {load};
\end{circuitikz}
\end{document}
```

- **Nodes:** two per port, $a_i$ (wave in) and $b_i$ (wave out). A node's value is the sum of all branches entering it.
- **Branches:** directed, weighted by an S-parameter or a reflection coefficient. A load is one branch $b\to a$ of weight $\Gamma_L$. A source is $b_s\to a$ (weight 1) plus $\Gamma_s$ from $b\to a$, with $b_s=\dfrac{V_s\sqrt{Z_0}}{Z_s+Z_0}$.

```tikz title="The four reduction rules. Series branches multiply, parallel branches add, a self-loop S divides by (1 - S), and a node can be split as long as every in-out path survives once. After Pozar Fig. 4.16."
\usepackage{circuitikz}
\usetikzlibrary{decorations.markings}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  mid/.style={postaction={decorate},decoration={markings,mark=at position 0.55 with {\arrow{stealth}}}},
  nd/.style={circle,draw,fill=white,inner sep=1.2pt}]
  % series
  \node[nd,label=below:$V_1$] (s1) at (0,0) {}; \node[nd,label=below:$V_2$] (s2) at (1.6,0) {}; \node[nd,label=below:$V_3$] (s3) at (3.2,0) {};
  \draw[mid] (s1) -- node[above] {$S_{21}$} (s2); \draw[mid] (s2) -- node[above] {$S_{32}$} (s3);
  \node at (4.1,0) {$\Rightarrow$};
  \node[nd,label=below:$V_1$] (t1) at (5,0) {}; \node[nd,label=below:$V_3$] (t3) at (7.4,0) {};
  \draw[mid] (t1) -- node[above] {$S_{21}S_{32}$} (t3);
  \node[anchor=west,font=\scriptsize] at (8.2,0) {1 series};
  % parallel
  \begin{scope}[yshift=-1.9cm]
    \node[nd,label=left:$V_1$] (p1) at (0,0) {}; \node[nd,label=right:$V_2$] (p2) at (3.2,0) {};
    \draw[mid] (p1) to[out=40,in=140] node[above] {$S_a$} (p2);
    \draw[mid] (p1) to[out=-40,in=-140] node[below] {$S_b$} (p2);
    \node at (4.1,0) {$\Rightarrow$};
    \node[nd,label=below:$V_1$] (q1) at (5,0) {}; \node[nd,label=below:$V_2$] (q2) at (7.4,0) {};
    \draw[mid] (q1) -- node[above] {$S_a+S_b$} (q2);
    \node[anchor=west,font=\scriptsize] at (8.2,0) {2 parallel};
  \end{scope}
  % self loop
  \begin{scope}[yshift=-4.7cm]
    \node[nd,label=below:$V_1$] (l1) at (0,0) {}; \node[nd,label=below:$V_2$] (l2) at (1.6,0) {}; \node[nd,label=below:$V_3$] (l3) at (3.2,0) {};
    \draw[mid] (l1) -- node[above] {$S_{21}$} (l2); \draw[mid] (l2) -- node[above] {$S_{32}$} (l3);
    \draw[mid] (l2) .. controls (1.0,1.3) and (2.2,1.3) .. node[above] {$S_{22}$} (l2);
    \node at (4.1,0) {$\Rightarrow$};
    \node[nd,label=below:$V_1$] (m1) at (5,0) {}; \node[nd,label=below:$V_2$] (m2) at (6.4,0) {}; \node[nd,label=below:$V_3$] (m3) at (7.6,0) {};
    \draw[mid] (m1) -- node[above] {$\frac{S_{21}}{1-S_{22}}$} (m2); \draw[mid] (m2) -- node[above] {$S_{32}$} (m3);
    \node[anchor=west,font=\scriptsize] at (8.2,0) {3 self-loop};
  \end{scope}
  % split
  \begin{scope}[yshift=-7.0cm]
    \node[nd,label=below:$V_1$] (n1) at (0,0) {}; \node[nd,label=below:$V_2$] (n2) at (1.6,0) {}; \node[nd,label=below:$V_3$] (n3) at (3.2,0) {}; \node[nd,label=above:$V_4$] (n4) at (3.2,1.0) {};
    \draw[mid] (n1) -- node[above] {$S_{21}$} (n2); \draw[mid] (n2) -- node[above] {$S_{32}$} (n3);
    \draw[mid] (n2) -- (1.6,1.0) -- node[above] {$S_{42}$} (n4);
    \node at (4.1,0.4) {$\Rightarrow$};
    \node[nd,label=below:$V_1$] (o1) at (5,0) {}; \node[nd,label=below:$V_2$] (o2) at (6.3,0) {}; \node[nd,label=below:$V_3$] (o3) at (7.6,0) {};
    \node[nd,label=above:$V_2'$] (o2b) at (6.3,1.0) {}; \node[nd,label=above:$V_4$] (o4) at (7.6,1.0) {};
    \draw[mid] (o1) -- node[above] {$S_{21}$} (o2); \draw[mid] (o2) -- node[above] {$S_{32}$} (o3);
    \draw[mid] (o1) -- (5,1.0) -- node[above] {$S_{21}$} (o2b); \draw[mid] (o2b) -- node[above] {$S_{42}$} (o4);
    \node[anchor=west,font=\scriptsize] at (8.2,0.4) {4 split};
  \end{scope}
\end{circuitikz}
\end{document}
```

Applying the rules to the terminated two-port above (Pozar Ex. 4.7):

$$
\boxed{\Gamma_{in}=\frac{b_1}{a_1}=S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L},\qquad \Gamma_{out}=\frac{b_2}{a_2}=S_{22}+\frac{S_{12}S_{21}\Gamma_s}{1-S_{11}\Gamma_s}}
$$

- Read it as: direct reflection $S_{11}$, plus the path through the network, off the load, and back, divided by $1-$(the loop $S_{22}\Gamma_L$) for the endless re-reflections.
- **Unilateral** ($S_{12}=0$): $\Gamma_{in}=S_{11}$, the termination doesn't matter. A load at port $n$ of a multiport contributes through $S_{in}\Gamma_nS_{nj}$; matched ports contribute nothing.
- With a source too: $a_1=\dfrac{b_s}{1-\Gamma_s\Gamma_{in}}$.

> [!tip] Remark
> These $\Gamma_{in}$, $\Gamma_{out}$ are the starting point of every gain and stability result ($G_T$, $G_P$, $G_A$, K-Δ, stability circles), which live in [[RF Amplifier Design]]. With $\Gamma_L=-1$ (short) the formula reproduces Pozar Ex. 4.5 above.

> [!note]- Detail: Mason's gain rule (the one-shot alternative)
> $T=\dfrac{\sum_kP_k\Delta_k}{\Delta}$, with $\Delta=1-\sum L_1+\sum L_2-\sum L_3+\dots$, where $L_1$ are the loop gains, $L_2$ the products of pairs of non-touching loops, and so on. $P_k$ is the $k$-th forward path, and $\Delta_k$ is $\Delta$ with every loop touching that path removed.
> For $\Gamma_{in}$ with a matched source: paths $S_{11}$ (touches nothing, so $\Delta_1=1-S_{22}\Gamma_L$) and $S_{21}\Gamma_LS_{12}$ ($\Delta_2=1$); one loop $S_{22}\Gamma_L$. So $\Gamma_{in}=\frac{S_{11}(1-S_{22}\Gamma_L)+S_{21}\Gamma_LS_{12}}{1-S_{22}\Gamma_L}$, the same result. Multiport drills: [[Exam Prep - Problems through Stability#4.28 ★ Signal flow graph, mismatched 3‑port|Exam Prep 4.28]] (mismatched 3-port), [[Exam Prep - Problems through Stability#4.18 📝PS2 Q5 Connecting two ports of a 4‑port|Exam Prep 4.18]] (two ports of a 4-port joined by a line).

## Level 4: Mixed-Mode S-Parameters

A differential channel (two coupled lines) is a 4-port. Rewriting its waves as differential and common pairs gives the matrix a SerDes designer actually reads.

```tikz title="A differential pair as a 4-port. Ports 1 and 3 are the input pair, 2 and 4 the output pair (Hall's numbering, used by Palermo). Drive +v/-v for the differential mode, +v/+v for the common mode. After Palermo EE720 Lecture 3, slide 25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=blue!5] (1.5,-1.4) rectangle (6.5,1.4);
  \node[align=center,font=\scriptsize] at (4,0) {coupled pair\\ (channel, package, connector)};
  \draw (0,0.9) node[ocirc,label=left:{port 1}]{} -- (1.5,0.9);
  \draw (0,-0.9) node[ocirc,label=left:{port 3}]{} -- (1.5,-0.9);
  \draw (6.5,0.9) -- (8,0.9) node[ocirc,label=right:{port 2}]{};
  \draw (6.5,-0.9) -- (8,-0.9) node[ocirc,label=right:{port 4}]{};
  \node[font=\scriptsize,blue] at (0.75,1.25) {$+v$};
  \node[font=\scriptsize,blue] at (0.75,-0.55) {$-v$};
  \node[font=\scriptsize,align=left,anchor=west] at (-1.6,-2.2) {$a_{d1}=\frac{a_1-a_3}{\sqrt2},\ a_{c1}=\frac{a_1+a_3}{\sqrt2}$ (same for $b$, and for port pair 2, 4)};
  \node[font=\scriptsize] at (4,-3.0) {$\begin{bmatrix}b_d\\ b_c\end{bmatrix}=\begin{bmatrix}S_{dd}&S_{dc}\\ S_{cd}&S_{cc}\end{bmatrix}\begin{bmatrix}a_d\\ a_c\end{bmatrix}$};
\end{circuitikz}
\end{document}
```

With this port numbering (Palermo, from Hall):

$$
\boxed{S_{dd11}=\tfrac12\left(S_{11}+S_{33}-S_{13}-S_{31}\right),\qquad S_{dd21}=\tfrac12\left(S_{21}+S_{43}-S_{23}-S_{41}\right)}
$$

| Block | Meaning | What you want |
|---|---|---|
| $S_{dd21}$ | differential insertion loss: the channel response the receiver sees | as flat as possible (its IFFT is the impulse response) |
| $S_{dd11}$ | differential return loss | small (good termination, few discontinuities) |
| $S_{cd21}$, $S_{dc21}$ | mode conversion: differential to common and back | ~0; nonzero means the pair is asymmetric (skew, unequal loading), which radiates and picks up noise |
| $S_{cc21}$ | common-mode transmission | matters for common-mode noise and EMI |

> [!warning] Check the port map
> Touchstone files and tools number differential ports differently (some put the input pair on ports 1, 2). The formulas above assume 1, 3 in and 2, 4 out. With another numbering, permute the indices before using them.

> [!note]- Derivation: all mixed-mode terms from the 4-port S
> Define $a_{d1}=(a_1-a_3)/\sqrt2$, $a_{c1}=(a_1+a_3)/\sqrt2$, and likewise for $b$ and for ports 2, 4. The $\sqrt2$ keeps the power the same: $|a_{d}|^2+|a_{c}|^2=|a_1|^2+|a_3|^2$.
> **Differential drive** ($a_1=a_d/\sqrt2$, $a_3=-a_d/\sqrt2$, $a_2=a_4=0$): $b_2=\frac{a_d}{\sqrt2}(S_{21}-S_{23})$, $b_4=\frac{a_d}{\sqrt2}(S_{41}-S_{43})$. So
> $S_{dd21}=\frac{b_2-b_4}{\sqrt2\,a_d}=\tfrac12(S_{21}-S_{23}-S_{41}+S_{43})$ (Palermo's result) and $S_{cd21}=\frac{b_2+b_4}{\sqrt2\,a_d}=\tfrac12(S_{21}-S_{23}+S_{41}-S_{43})$.
> **Common drive** ($a_1=a_3=a_c/\sqrt2$): $S_{cc21}=\tfrac12(S_{21}+S_{23}+S_{41}+S_{43})$, $S_{dc21}=\tfrac12(S_{21}+S_{23}-S_{41}-S_{43})$.
> The reflection terms follow the same way at ports 1, 3: $S_{dd11}=\tfrac12(S_{11}-S_{13}-S_{31}+S_{33})$, $S_{cc11}=\tfrac12(S_{11}+S_{13}+S_{31}+S_{33})$.
> For a perfectly symmetric pair ($S_{21}=S_{43}$, $S_{23}=S_{41}$) both conversion terms vanish.

> [!tip] Remark
> Turning $S_{dd21}(f)$ into an impulse and pulse response (append the conjugate negative frequencies, zero-pad, IFFT), and what loss and reflections do to the eye, belong to [[Channels]]. This note only supplies the matrix.

## Level 5: Measurement: VNA, Calibration, De-embedding

### Vector Network Analyzer

```tikz title="Simplified two-port VNA. A switched source drives port 1 (FWD) or port 2 (REV). Directional couplers sample the incident wave (reference channel) and the reflected or transmitted wave (test channels); the receivers down-convert and take complex ratios. After Pozar Point of Interest p. 188 and binder p. 150."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  bx/.style={draw,rounded corners,align=center,fill=gray!8,minimum height=0.8cm}]
  \node[bx] (src) at (0,0) {RF source\\ (swept)};
  \node[bx] (sw) at (2.7,0) {FWD/REV\\ switch};
  \node[bx,minimum width=1.4cm] (c1) at (5.2,1.6) {coupler};
  \node[bx,minimum width=1.4cm] (c2) at (5.2,-1.6) {coupler};
  \node[bx,fill=blue!6,minimum width=1.8cm] (dut) at (8.6,0) {DUT};
  \draw[->] (src) -- (sw);
  \draw[->] (sw) |- node[pos=0.75,above,font=\scriptsize] {FWD} (c1);
  \draw[->] (sw) |- node[pos=0.75,below,font=\scriptsize] {REV} (c2);
  \draw (c1) -| node[pos=0.25,above,font=\scriptsize] {port 1} (dut.north);
  \draw (c2) -| node[pos=0.25,below,font=\scriptsize] {port 2} (dut.south);
  \draw[->,red] (c1.north) -- ++(0,0.6) node[above,font=\scriptsize,align=center] {samples $a_1$, $b_1$ $\to$ receivers $R_1$, $T_1$};
  \draw[->,red] (c2.south) -- ++(0,-0.6) node[below,font=\scriptsize,align=center] {samples $a_2$, $b_2$ $\to$ receivers $R_2$, $T_2$};
  \node[bx,align=left,font=\scriptsize] at (12.2,0) {4 receivers\\ $\to$ IF (dual conversion)\\ $\to$ complex ratios\\ $\to$ error correction};
  \node[font=\scriptsize,align=left,anchor=west] at (10.3,-1.9) {FWD: $S_{11}=b_1/a_1$, $S_{21}=b_2/a_1$\\ REV: $S_{22}=b_2/a_2$, $S_{12}=b_1/a_2$};
\end{circuitikz}
\end{document}
```

- The analyzer measures **ratios** of sampled waves, so source power drift cancels. The example in Pozar uses a 20 MHz first IF and a 100 kHz second IF; the Agilent N5247A covers 10 MHz–67 GHz, the binder's HP 8510B 0.05–26.5 GHz.
- An inverse FFT of the swept data gives a **time-domain** (TDR-like) view that locates discontinuities along a line ([[Channels]]).
- The raw ratios are measured at planes inside the instrument, so they include cables, connectors, couplers' finite directivity and mismatch. **Calibration** removes them.

### Error Model and Calibration

```tikz title="What the VNA sees: the DUT sandwiched between two unknown error boxes (cables, connectors, fixture). The measured matrix is the cascade; calibration finds the boxes so the DUT can be extracted. After Pozar Fig. 4.20 and binder p. 151."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  bx/.style={draw,align=center,minimum height=1.4cm,minimum width=2.1cm}]
  \node[bx,fill=red!6] (ea) at (0,0) {error box A\\ $\begin{bmatrix}A&B\\C&D\end{bmatrix}$};
  \node[bx,fill=blue!6] (d) at (3.6,0) {DUT\\ $\begin{bmatrix}A'&B'\\C'&D'\end{bmatrix}$};
  \node[bx,fill=red!6] (eb) at (7.2,0) {error box B\\ $\begin{bmatrix}D&B\\C&A\end{bmatrix}$};
  \draw (ea) -- (d) -- (eb);
  \draw (-2,0) -- (ea); \draw (eb) -- (9.2,0);
  \draw[dashed] (-1.25,1.2) -- (-1.25,-1.3) node[below,font=\scriptsize,align=center] {measurement\\ plane 1};
  \draw[dashed] (8.45,1.2) -- (8.45,-1.3) node[below,font=\scriptsize,align=center] {measurement\\ plane 2};
  \draw[dashed,blue] (1.8,1.2) -- (1.8,-1.3) node[below,font=\scriptsize,align=center] {DUT\\ plane 1};
  \draw[dashed,blue] (5.4,1.2) -- (5.4,-1.3) node[below,font=\scriptsize,align=center] {DUT\\ plane 2};
  \draw[decorate,decoration={brace,amplitude=6pt}] (-1.25,1.35) -- (8.45,1.35) node[midway,above=6pt] {measured $\begin{bmatrix}A^m&B^m\\C^m&D^m\end{bmatrix}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{[M]=[E_A][DUT][E_B]\quad\Rightarrow\quad [DUT]=[E_A]^{-1}[M][E_B]^{-1}}
$$

- **Count:** the binder's two-port model has 10 unknown error terms; commercial VNAs use a **12-term** model (Pozar). Each standard you connect yields 4 measured S-parameters, so you need **at least 3 independent standards**.
- **Standard sets:** **SOL(T)** = Short, Open, Load (+ Thru): the standards must be known accurately. **TRL** = Thru, Reflect, Line: only the Thru must be ideal. **TRM** = Thru, Reflect, Match: the Line replaced by a matched load.

> [!warning] Binder typo
> Binder p. 153 expands TRL as "Thru, Reflect, Load". Pozar §4.5 and the method itself use a **Line** (a length of matched line); the matched-load variant is TRM.

**One port (SOL), the case to know by hand.** The error box is three terms: directivity $e_{00}$, source match $e_{11}$, and reflection tracking $e_{10}e_{01}$.

```tikz title="One-port error model as a signal-flow graph: the measured reflection is the error box's own leakage e00 plus the DUT reflection seen through the box. Same shape as the terminated two-port above."
\usepackage{circuitikz}
\usetikzlibrary{decorations.markings}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  mid/.style={postaction={decorate},decoration={markings,mark=at position 0.55 with {\arrow{stealth}}}},
  nd/.style={circle,draw,fill=white,inner sep=1.3pt}]
  \node[nd,label=above:{$a_0$ (VNA)}] (a0) at (0,1.4) {};
  \node[nd,label=below:{$b_0$ (VNA)}] (b0) at (0,-1.4) {};
  \node[nd,label=above:$a$] (a) at (3.4,1.4) {};
  \node[nd,label=below:$b$] (b) at (3.4,-1.4) {};
  \draw[mid] (a0) -- node[above] {$e_{10}$} (a);
  \draw[mid] (a0) -- node[left] {$e_{00}$} (b0);
  \draw[mid] (b) -- node[right] {$e_{11}$} (a);
  \draw[mid] (b) -- node[below] {$e_{01}$} (b0);
  \draw[mid] (a) -- (4.8,1.4) -- node[right] {$\Gamma$ (DUT)} (4.8,-1.4) -- (b);
  \draw[dashed,gray] (4.1,-2.2) -- (4.1,2.2);
  \node[font=\scriptsize,gray] at (1.7,-2.3) {error box};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Gamma_m=e_{00}+\frac{e_{10}e_{01}\,\Gamma}{1-e_{11}\Gamma}\qquad\Longleftrightarrow\qquad \Gamma=\frac{\Gamma_m-e_{00}}{e_{10}e_{01}+e_{11}(\Gamma_m-e_{00})}}
$$

Calibration procedure:

1. Connect a **Load** ($\Gamma=0$): $e_{00}=\Gamma_{m,L}$.
2. Connect an **Open** ($\Gamma=1$): $p=\Gamma_{m,O}-e_{00}=\dfrac{e_{10}e_{01}}{1-e_{11}}$.
3. Connect a **Short** ($\Gamma=-1$): $q=\Gamma_{m,S}-e_{00}=\dfrac{-e_{10}e_{01}}{1+e_{11}}$.
4. Solve: $e_{11}=\dfrac{p+q}{p-q}$, $e_{10}e_{01}=p(1-e_{11})$.
5. Measure the DUT and invert with the boxed formula.

> [!example] Worked example: SOL by hand (Exam Prep)
> $\Gamma_{m,L}=0.05$, $\Gamma_{m,S}=-0.7682$, $\Gamma_{m,O}=1.05$. Then $e_{00}=0.05$, $p=1.0$, $q=-0.8182$, $e_{11}=0.1818/1.8182=0.10$, $e_{10}e_{01}=0.90$. A DUT that reads $\Gamma_m=0.5$ is really $\Gamma=\frac{0.45}{0.90+0.045}=0.476$. ([[Exam Prep - Problems through Stability|Exam Prep: VNA calibration]])

### TRL Calibration

```tikz title="The three TRL connections. Thru: the two error boxes joined directly at the DUT planes. Reflect: the same unknown high-reflection load on each box. Line: a matched line of unknown length and loss between them. After Pozar Fig. 4.21."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  bx/.style={draw,fill=red!6,minimum width=1.5cm,minimum height=0.8cm}]
  \foreach \i/\y/\t in {1/0/Thru $[T]$,2/-1.6/Reflect $[R]$,3/-3.8/Line $[L]$} {
    \node[anchor=east] at (-1.6,\y) {\t};
    \node[bx] (A\i) at (0,\y) {box A};
    \node[bx] (B\i) at (5,\y) {box B};
    \draw (-1.2,\y) -- (A\i.west);
    \draw (B\i.east) -- (6.2,\y);
  }
  \draw (A1.east) -- (B1.west);
  \draw (A2.east) -- (1.4,-1.6) to[generic,l=$\Gamma_L$] (1.4,-2.6) node[ground]{};
  \draw (B2.west) -- (3.6,-1.6) to[generic,l_=$\Gamma_L$] (3.6,-2.6) node[ground]{};
  \draw (A3.east) -- (1.4,-3.8);
  \draw[thick,blue] (1.4,-3.8) -- node[above,font=\scriptsize] {$Z_0$, $e^{-\gamma\ell}$} (3.6,-3.8);
  \draw (3.6,-3.8) -- (B3.west);
\end{circuitikz}
\end{document}
```

TRL needs no accurately known load or short, only a good Thru, which suits PCB, microstrip and on-wafer fixtures where precise standards can't be built. Pozar's version assumes identical, reciprocal error boxes (S-matrix $S_{11},S_{12}=S_{21},S_{22}$, connected mirror-image).

1. **Thru** (measure $[T]$): $T_{11}=S_{11}+\dfrac{S_{22}S_{12}^2}{1-S_{22}^2}$, $T_{12}=\dfrac{S_{12}^2}{1-S_{22}^2}$.
2. **Reflect** (measure $[R]$, ports decoupled): $R_{11}=S_{11}+\dfrac{S_{12}^2\Gamma_L}{1-S_{22}\Gamma_L}$.
3. **Line** (measure $[L]$): $L_{11}=S_{11}+\dfrac{S_{22}S_{12}^2e^{-2\gamma\ell}}{1-S_{22}^2e^{-2\gamma\ell}}$, $L_{12}=\dfrac{S_{12}^2e^{-\gamma\ell}}{1-S_{22}^2e^{-2\gamma\ell}}$.
4. **Solve** five equations for five unknowns ($S_{11},S_{12},S_{22},\Gamma_L,e^{\gamma\ell}$):
$$
e^{\gamma\ell}=\frac{L_{12}^2+T_{12}^2-(T_{11}-L_{11})^2\pm\sqrt{\left[L_{12}^2+T_{12}^2-(T_{11}-L_{11})^2\right]^2-4L_{12}^2T_{12}^2}}{2L_{12}T_{12}}
$$
$$
S_{22}=\frac{T_{11}-L_{11}}{T_{12}-L_{12}e^{-\gamma\ell}},\quad S_{11}=T_{11}-S_{22}T_{12},\quad S_{12}^2=T_{12}(1-S_{22}^2),\quad \Gamma_L=\frac{R_{11}-S_{11}}{S_{12}^2+S_{22}(R_{11}-S_{11})}
$$
   Pick the root with $\mathrm{Re}\{\gamma\}$, $\mathrm{Im}\{\gamma\}$ positive, or from the rough phase of $\Gamma_L$ (known to within 180°: "it's roughly an open" or "roughly a short").
5. **Correct the DUT:** convert boxes and measurement to ABCD and apply $\begin{bmatrix}A'&B'\\C'&D'\end{bmatrix}=\begin{bmatrix}A&B\\C&D\end{bmatrix}^{-1}\begin{bmatrix}A^m&B^m\\C^m&D^m\end{bmatrix}\begin{bmatrix}D&B\\C&A\end{bmatrix}^{-1}$.

> [!note]- Detail: why the Line can't look like the Thru
> The quadratic for $e^{\gamma\ell}$ and the $S_{22}$ formula both come from comparing the Thru and Line measurements. If the line's extra electrical length is a multiple of 180°, $e^{-\gamma\ell}\approx\pm1$ for a low-loss line and the Line measurement repeats the Thru, so $T_{11}-L_{11}\to0$ and $T_{12}-L_{12}e^{-\gamma\ell}\to0$: $S_{22}$ becomes 0/0. One line therefore calibrates only a band where its electrical length stays away from multiples of 180°; wider bands use several lines.

### De-embedding

De-embedding is the general version of the last step: strip any **known** network off the measurement.

- **Known lossless lines:** rotate phases, $S_{mn}=e^{+j(\theta_m+\theta_n)}S'_{mn}$ ([[#Shifting Reference Planes]]).
- **Known fixtures** (pads, launches, via transitions): get their S (from TRL, an EM simulation or a measured "thru" structure), convert to ABCD or T, and multiply by the inverses as in the boxed $[DUT]=[E_A]^{-1}[M][E_B]^{-1}$.
- Calibration moves the reference planes to wherever the standards were connected. De-embedding moves them further, mathematically.

## Design intuition / trade-offs

| Choice | Best for | Cost / catch |
|---|---|---|
| Z-parameters | T networks, series feedback (common-lead elements), open-circuit measurements | Need opens; undefined for some networks (an ideal series element has no Z) |
| Y-parameters | π networks, shunt feedback, transistor models with $C_{gd}$ | Need shorts; undefined for an ideal shunt element |
| h-parameters | BJTs ($h_{fe}$, $h_{ie}$), series-shunt feedback | Mixed open/short conditions; rarely measured above RF |
| ABCD | Cascades of lumped elements, lines, transformers; quick $Z_{in}$ | $I_2$ sign convention; awkward for multiports |
| S-parameters | Anything measured; gain, match, isolation, stability | Depend on the reference $Z_0$ and planes; can't be multiplied for cascades |
| T-matrix | Cascading measured S-blocks; de-embedding | Several incompatible conventions in print |
| Mixed-mode S | Differential channels, packages, connectors | Port-numbering convention must match the formulas |
| SOL(T) calibration | Coaxial measurements with a good cal kit | Accuracy limited by how well the standards are known |
| TRL calibration | PCB, microstrip, on-wafer: no precise standards needed | Band-limited by the line length; needs a good Thru and a reflect common to both ports |
| Move planes by $\theta$ | Removing known feed lines | Only for lossless, matched lines; anything else needs full de-embedding |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Impedance and energy | $Z_{in}=\dfrac{P_\ell+2j\omega(W_m-W_e)}{\frac12\vert I\vert^2}$ |
| Z-parameters | $[V]=[Z][I]$, $Z_{ij}=V_i/I_j$ (other ports open) |
| Y-parameters | $[I]=[Y][V]$, $Y_{ij}=I_i/V_j$ (other ports shorted), $[Y]=[Z]^{-1}$ |
| h-parameters | $V_1=h_{11}I_1+h_{12}V_2$, $I_2=h_{21}I_1+h_{22}V_2$; reciprocal $h_{12}=-h_{21}$ |
| ABCD | $V_1=AV_2+BI_2$, $I_1=CV_2+DI_2$ ($I_2$ out); reciprocal $AD-BC=1$ |
| Cascade | $[ABCD]=[ABCD]_1[ABCD]_2\cdots$ |
| Line ABCD | $\begin{bmatrix}\cos\beta\ell&jZ_0\sin\beta\ell\\jY_0\sin\beta\ell&\cos\beta\ell\end{bmatrix}$ |
| Interconnections | series: $Z$ add; parallel: $Y$ add; series-shunt: $h$ add; cascade: ABCD multiply |
| Voltage-normalized waves | $a=\frac{V+Z_0I}{2\sqrt{Z_0}}$, $b=\frac{V-Z_0I}{2\sqrt{Z_0}}$ |
| Power waves | $a=\frac{V+Z_RI}{2\sqrt{R_R}}$, $b=\frac{V-Z_R^*I}{2\sqrt{R_R}}$, $\Gamma_p=\frac{Z_L-Z_R^*}{Z_L+Z_R}$ |
| Delivered power | $P=\tfrac12\vert a\vert^2-\tfrac12\vert b\vert^2$ (any $Z_R$) |
| Available power | $P_{avs}=\vert E\vert^2/(8Z_0)=\tfrac12\vert a_1\vert^2$ |
| S-parameters | $[b]=[S][a]$, $S_{ij}=b_i/a_j$ (other ports matched) |
| Return / insertion loss | $RL=-20\log\vert S_{11}\vert$, $IL=-20\log\vert S_{21}\vert$ |
| Transducer gain (matched) | $\vert S_{21}\vert^2=P_L/P_{avs}$ |
| S ↔ Z | $[S]=([Z]+[U])^{-1}([Z]-[U])$, $[Z]=([U]+[S])([U]-[S])^{-1}$ (normalized) |
| Reciprocal | $[S]=[S]^t$ |
| Lossless | $[S]^t[S]^*=[U]$; two-port: $\vert S_{11}\vert^2+\vert S_{21}\vert^2=1$ |
| Plane shift | $S'_{mn}=e^{-j(\theta_m+\theta_n)}S_{mn}$ |
| S from ABCD | $S_{11}=\frac{A+B/Z_0-CZ_0-D}{\Delta}$, $S_{21}=\frac2\Delta$, $\Delta=A+\frac{B}{Z_0}+CZ_0+D$ |
| ABCD from S | $A=\frac{(1+S_{11})(1-S_{22})+S_{12}S_{21}}{2S_{21}}$, $B=Z_0\frac{(1+S_{11})(1+S_{22})-S_{12}S_{21}}{2S_{21}}$, … |
| T-matrix | $T_{11}=\frac1{S_{21}}$, $T_{12}=-\frac{S_{22}}{S_{21}}$, $T_{21}=\frac{S_{11}}{S_{21}}$, $T_{22}=-\frac{\Delta_S}{S_{21}}$; $[T]=[T_a][T_b]$ |
| Cascade $S_{21}$ | $\frac{S_{21}^aS_{21}^b}{1-S_{22}^aS_{11}^b}$ |
| Terminated two-port | $\Gamma_{in}=S_{11}+\frac{S_{12}S_{21}\Gamma_L}{1-S_{22}\Gamma_L}$, $\Gamma_{out}=S_{22}+\frac{S_{12}S_{21}\Gamma_s}{1-S_{11}\Gamma_s}$ |
| SFG self-loop | divide by $1-S_{loop}$ |
| Mixed mode | $S_{dd11}=\frac12(S_{11}+S_{33}-S_{13}-S_{31})$, $S_{dd21}=\frac12(S_{21}+S_{43}-S_{23}-S_{41})$ |
| One-port error model | $\Gamma_m=e_{00}+\frac{e_{10}e_{01}\Gamma}{1-e_{11}\Gamma}$ |
| De-embedding | $[DUT]=[E_A]^{-1}[M][E_B]^{-1}$ (ABCD or T) |
| TRL error box | $S_{22}=\frac{T_{11}-L_{11}}{T_{12}-L_{12}e^{-\gamma\ell}}$, $S_{11}=T_{11}-S_{22}T_{12}$, $S_{12}^2=T_{12}(1-S_{22}^2)$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20). Ch. 4 Microwave Network Analysis, pp. 165–202: §4.1 equivalent voltages and currents, impedance and energy, even/odd properties (Ex. 4.1, 4.2); §4.2 Z and Y, reciprocity and losslessness (Ex. 4.3); §4.3 scattering matrix, S↔Z, reciprocal/lossless S, reference-plane shift, power waves and generalized S (Eqs. 4.57–4.68), VNA Point of Interest p. 188 (Ex. 4.4, 4.5); §4.4 ABCD, Table 4.1, relation to Z, Table 4.2 conversions, two-port equivalent circuits (Figs. 4.12, 4.13, Ex. 4.6); §4.5 signal-flow graphs, decomposition rules, Ex. 4.7, TRL calibration (Eqs. 4.80–4.90). §4.6 pp. 203–205 discontinuities and the H-plane step modal analysis, read for the fold only. §4.7–4.8 (waveguide excitation) not covered.
- **ECE 373 lecture binder (Boumaiza, Waterloo)**, scanned: pp. 103–119 linear network parameters, interconnections (series, parallel, cascade), Z, Y, h, chain (ABCD) parameters; pp. 120–148 S-parameters, normalized power waves, $P_{avs}$, $\vert S_{21}\vert^2$ as transducer gain, reference-plane shift and de-embedding, reciprocity/symmetry/losslessness, conversion chart; pp. 149–153 VNA (HP 8510B), calibration error model, 10 unknowns, SOL/TRL/TRM; pp. 186–187 the source–two-port–load flow graph and power definitions.
- **Palermo, ECEN720 Lecture 3 (TDR and S-parameter channel models)**, `ref/SerDes/lecture3_ee720_tdr_spar.pdf`: slides 14–21 (VNA, directional coupler, why S, S↔ABCD from Hall Table 9-3), slide 25 (4-port differential channel, $S_{dd11}$, $S_{dd21}$). The remaining mixed-mode terms are derived here from the same definitions.
- **Worked problems:** [[Exam Prep - Problems through Stability]], §4 (Pozar Probs. 4.4–4.29), §P (PS2 Q2, Q6; practice midterm Q2; past midterm P2) and the VNA calibration problem.
