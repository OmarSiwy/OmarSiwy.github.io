---
title: Transmission Lines
description: Lines from the RLGC model to reflection, VSWR, input impedance, power on a mismatched line, loss, transients, and the practical lines (coax, stripline, microstrip) with synthesis formulas, dispersion and discontinuities.
kind: topic
status: growing
aliases:
  - Transmission Lines
  - Telegrapher's Equations
  - Reflection Coefficient (Transmission Line)
  - Transmission Line Input Impedance
  - Return Loss and VSWR
  - Power Flow on a Mismatched Line
  - Coaxial Line
  - Microstrip Effective Dielectric Constant
  - Microstrip Characteristic Impedance Synthesis
  - Microstrip Losses
  - Microstrip Dispersion
  - Microstrip Discontinuities
---

A wire stops being a wire once it is a sizeable fraction of a wavelength long: voltage and current then depend on *where* you measure them. This note treats the line as a black box with two numbers ($Z_0$, $\beta$) first, then adds the load, the generator, loss and time-domain behavior, and ends with the lines you actually build (coax, stripline, microstrip) and how to size them. Stop after any section and you still have a correct, coarser picture.

## The big picture

```tikz title="A line between a generator and a load: an incident wave travels toward the load, the mismatch at the load sends a reflected wave back, and the generator sees Z_in. After Pozar Figs. 2.4 and 2.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[sV, l=$V_g$] (0,2) to[generic, l=$Z_g$] (2,2) -- (2.2,2);
  \draw (0,0) -- (2.2,0);
  \draw[very thick] (2.2,2) -- (8.2,2);
  \draw[very thick] (2.2,0) -- (8.2,0);
  \draw (2.2,2) node[ocirc]{} (2.2,0) node[ocirc]{} (8.2,2) node[ocirc]{} (8.2,0) node[ocirc]{};
  \draw (8.2,2) -- (9.4,2) to[generic, l=$Z_L$] (9.4,0) -- (8.2,0);
  \node at (5.2,1.0) {$Z_0,\ \beta=2\pi/\lambda,\ v_p=1/\sqrt{LC}$};
  \draw[->,thick,blue] (3.2,2.45) -- node[above,font=\scriptsize]{incident $V_0^+e^{-j\beta z}$} (6.6,2.45);
  \draw[<-,thick,red] (3.8,-0.45) -- node[below,font=\scriptsize]{reflected $\Gamma_L V_0^+e^{+j\beta z}$} (7.2,-0.45);
  \draw[->] (1.55,1.0) -- (2.15,1.0);
  \node[left,font=\scriptsize] at (1.6,1.0) {$Z_{in}$};
  \node[font=\scriptsize] at (8.75,1.0) {$\Gamma_L$};
  \draw[->] (2.2,-1.35) -- (10,-1.35) node[right] {$z$};
  \draw (2.2,-1.25) -- (2.2,-1.45) node[below,font=\scriptsize] {$-\ell$};
  \draw (8.2,-1.25) -- (8.2,-1.45) node[below,font=\scriptsize] {$0$};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **A line is two numbers:** characteristic impedance $Z_0=\sqrt{L/C}$ (the V/I ratio of *one* traveling wave) and phase constant $\beta=\omega\sqrt{LC}=2\pi/\lambda$, with $\lambda=\lambda_0/\sqrt{\epsilon_e}$.
> 2. **Mismatch reflects:** $\Gamma_L=\dfrac{Z_L-Z_0}{Z_L+Z_0}$. Matched ($Z_L=Z_0$) means no reflected wave.
> 3. **The line rotates the load:** $\Gamma(\ell)=\Gamma_Le^{-2j\beta\ell}$ and $Z_{in}=Z_0\dfrac{Z_L+jZ_0\tan\beta\ell}{Z_0+jZ_L\tan\beta\ell}$. $\lambda/2$ repeats the load, $\lambda/4$ inverts it ($Z_0^2/Z_L$), a shorted or open stub is a pure reactance.
> 4. **Mismatch costs power:** $P_L=\dfrac{|V_0^+|^2}{2Z_0}(1-|\Gamma|^2)$. Quote it as return loss $RL=-20\log|\Gamma|$ or $\text{SWR}=\dfrac{1+|\Gamma|}{1-|\Gamma|}$. Maximum power needs a conjugate match $Z_{in}=Z_g^*$, not necessarily a flat line.
> 5. **Low loss barely changes $\beta$ or $Z_0$ but sets $\alpha$:** $\alpha\approx\tfrac12\left(R/Z_0+GZ_0\right)$; conductor loss grows as $\sqrt f$, dielectric loss as $f$.
> 6. **Microstrip** is quasi-TEM in an effective medium $1<\epsilon_e<\epsilon_r$. Width sets $Z_0$ (wide = low $Z_0$); synthesize $W/d$ from closed-form fits, then correct for dispersion and discontinuities.

**Map:** [[#Physics background|fields behind L, C, R, G]] → [[#Telegrapher's Equations|RLGC model, $\gamma$, $Z_0$]] → [[#Reflection Coefficient (Transmission Line)|$\Gamma$]] → [[#Return Loss and VSWR|RL, SWR]] → [[#Transmission Line Input Impedance|$Z_{in}$, stubs]] → [[#Power Flow on a Mismatched Line|power, generator mismatch]] → [[#Level 2 Lossy Lines|loss, dispersion]] → [[#Level 3 Transients and Bounce Diagrams|bounce diagrams, termination]] → [[#Coaxial Line|coax]] → [[#Stripline|stripline]] → [[#Microstrip Effective Dielectric Constant|microstrip]] → [[#Microstrip Discontinuities|discontinuities]] → [[#Coupled Lines and Differential Pairs|coupled lines]].

## Physics background

A TEM line is two conductors with the fields entirely transverse to the direction of travel. Everything in this note is circuit language for those fields.

```tikz title="Field lines (E blue) in the three workhorse lines. Coax and stripline are filled with one dielectric (TEM); microstrip splits its field between substrate and air (quasi-TEM). After Pozar Figs. 3.17(a), 3.22(b), 3.25(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % coax
  \begin{scope}
    \fill[gray!20] (0,0) circle (1.5);
    \draw[very thick] (0,0) circle (1.5);
    \fill[gray!70] (0,0) circle (0.4);
    \foreach \a in {0,45,...,315} { \draw[->,blue] ({0.45*cos(\a)},{0.45*sin(\a)}) -- ({1.42*cos(\a)},{1.42*sin(\a)}); }
    \draw[red,dashed] (0,0) circle (0.9); \node[red,font=\scriptsize] at (-0.75,0.75) {$H$}; \node[blue,font=\scriptsize] at (1.05,-0.55) {$E$};
    \draw[<->] (0,0) -- node[below,font=\scriptsize,pos=0.5] {$a$} (0.4,0);
    \node[font=\scriptsize] at (0,-2.0) {coax: TEM, $\epsilon_r$ fills all};
    \node[font=\scriptsize] at (1.35,1.4) {$b$};
  \end{scope}
  % stripline
  \begin{scope}[xshift=4.2cm,yshift=-1.3cm]
    \fill[gray!20] (0,0) rectangle (4,2.6);
    \draw[very thick] (0,0) -- (4,0);
    \draw[very thick] (0,2.6) -- (4,2.6);
    \fill[gray!70] (1.5,1.25) rectangle (2.5,1.35);
    \foreach \x in {1.6,1.9,2.1,2.4} { \draw[->,blue] (\x,1.42) -- (\x,2.55); \draw[->,blue] (\x,1.18) -- (\x,0.05); }
    \draw[->,blue] (1.5,1.42) .. controls (1.1,1.8) .. (0.9,2.55);
    \draw[->,blue] (2.5,1.42) .. controls (2.9,1.8) .. (3.1,2.55);
    \draw[->,blue] (1.5,1.18) .. controls (1.1,0.8) .. (0.9,0.05);
    \draw[->,blue] (2.5,1.18) .. controls (2.9,0.8) .. (3.1,0.05);
    \draw[<->] (4.2,0) -- node[right,font=\scriptsize] {$b$} (4.2,2.6);
    \draw[dashed,gray] (1.5,1.25) -- (1.5,-0.3); \draw[dashed,gray] (2.5,1.25) -- (2.5,-0.3); \draw[<->] (1.5,-0.25) -- node[below,font=\scriptsize] {$W$} (2.5,-0.25);
    \node[font=\scriptsize] at (2,-0.95) {stripline: TEM, homogeneous};
  \end{scope}
  % microstrip
  \begin{scope}[xshift=9.6cm,yshift=-1.3cm]
    \fill[gray!20] (0,0) rectangle (4.4,1.1);
    \draw[very thick] (0,0) -- (4.4,0);
    \fill[gray!70] (1.7,1.1) rectangle (2.7,1.2);
    \foreach \x in {1.8,2.05,2.35,2.6} { \draw[->,blue] (\x,1.08) -- (\x,0.05); }
    \draw[->,blue] (1.7,1.15) .. controls (1.0,1.9) and (0.6,1.3) .. (0.5,0.05);
    \draw[->,blue] (2.7,1.15) .. controls (3.4,1.9) and (3.8,1.3) .. (3.9,0.05);
    \draw[->,blue] (1.7,1.2) .. controls (0.9,2.6) and (0.1,1.6) .. (0.05,0.05);
    \draw[->,blue] (2.7,1.2) .. controls (3.5,2.6) and (4.3,1.6) .. (4.35,0.05);
    \draw[<->] (4.6,0) -- node[right,font=\scriptsize] {$d$} (4.6,1.1);
    \node[font=\scriptsize] at (2.2,2.3) {air};
    \node[font=\scriptsize] at (3.6,0.55) {$\epsilon_r$};
    \node[font=\scriptsize] at (2.2,-0.7) {microstrip: quasi-TEM};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> The field facts used below are derived in [[EM Foundations]]: wave speed and impedance of a medium ($v=c/\sqrt{\epsilon_r}$, $\eta=\eta_0/\sqrt{\epsilon_r}$) in [[EM Foundations#Plane Waves]], complex permittivity and $\tan\delta$ in [[EM Foundations#Fields in Media Permittivity and Loss Tangent]], skin depth and $R_s=1/(\sigma\delta_s)\propto\sqrt f$ in [[EM Foundations#Skin Depth]] and [[EM Foundations#Surface Resistance]], power flow in [[EM Foundations#Poynting Vector]]. Lumped vs distributed (when you need this note at all) is [[EM Foundations#Level 0 Lumped vs Distributed]].

$$
\boxed{L=\frac{\mu}{|I_0|^2}\int_S \bar H\cdot\bar H^*\,ds,\quad C=\frac{\epsilon'}{|V_0|^2}\int_S\bar E\cdot\bar E^*\,ds,\quad R=\frac{R_s}{|I_0|^2}\oint_{C_1+C_2}\bar H\cdot\bar H^*\,dl,\quad G=\frac{\omega\epsilon''}{|V_0|^2}\int_S\bar E\cdot\bar E^*\,ds}
$$

- $L$ and $C$ are the stored magnetic and electric energy per meter written as circuit elements; $R$ is the conductor surface loss ($R_s$ from skin depth); $G$ is the dielectric loss ($\epsilon''=\epsilon'\tan\delta$).
- **TEM lines** (coax, stripline, two-wire): $\beta=\omega\sqrt{\mu\epsilon}$ exactly as for a plane wave, the wave impedance $E_t/H_t$ equals the medium's $\eta$, and there is **no cutoff and no dispersion**. They need two conductors.
- **Power travels in the fields between the conductors**, not in the metal: $P=\tfrac12\int\bar E\times\bar H^*\cdot d\bar s=\tfrac12V_0I_0^*$. Power that enters the metal is lost as heat.
- **Microstrip** is not TEM (the field is partly in air, partly in substrate, and the two can't phase-match). For a thin substrate ($d\ll\lambda$) it is *quasi-TEM*: static formulas work up to a frequency set by the substrate.
- **Waveguides** (one conductor) carry TE/TM modes with a cutoff and are dispersive. Only a short fold here: [[#Waveguides and Other Lines]].

> [!note]- Derivation: the telegrapher equations from Maxwell, for coax (Pozar §2.2)
> Coax, inner radius $a$, outer $b$, TEM so $E_z=H_z=0$, azimuthal symmetry so $\partial/\partial\phi=0$, perfect conductors. Maxwell's curls $\nabla\times\bar E=-j\omega\mu\bar H$, $\nabla\times\bar H=j\omega\epsilon\bar E$ with $\epsilon=\epsilon'-j\epsilon''$.
> - The $\hat z$ components force $E_\phi=f(z)/\rho$, $H_\phi=g(z)/\rho$. $E_\phi=0$ on the conductors, so $E_\phi=0$ everywhere, and then $H_\rho=0$.
> - What remains: $\partial E_\rho/\partial z=-j\omega\mu H_\phi$, $\partial H_\phi/\partial z=-j\omega\epsilon E_\rho$, with $E_\rho=h(z)/\rho$.
> - Voltage and current: $V=\int_a^bE_\rho\,d\rho=h(z)\ln(b/a)$, $I=\oint H_\phi\,a\,d\phi=2\pi g(z)$.
> - Substituting:
> $$\frac{dV}{dz}=-j\omega\underbrace{\frac{\mu\ln(b/a)}{2\pi}}_{L}I,\qquad \frac{dI}{dz}=-\Big(\underbrace{\frac{2\pi\omega\epsilon''}{\ln(b/a)}}_{G}+j\omega\underbrace{\frac{2\pi\epsilon'}{\ln(b/a)}}_{C}\Big)V$$
>
> These are the circuit telegrapher equations below with $R=0$ (perfect conductors). The wave equation gives $\beta=\omega\sqrt{\mu\epsilon}=\omega\sqrt{LC}$, the wave impedance is $E_\rho/H_\phi=\eta$, and $Z_0=V_0/I_0=\frac{\eta}{2\pi}\ln\frac ba$.

> [!note]- Detail: TEM, TE, TM and why microstrip is "quasi" (Pozar §3.1, §3.8)
> - **TEM:** $k_c=0$, $\beta=k$, fields are the *static* fields of the cross-section (they satisfy Laplace's equation), so $Z_0$ comes from an electrostatic capacitance: $Z_0=1/(v_pC)$. Needs two or more conductors.
> - **TE / TM:** a longitudinal $H_z$ or $E_z$, a cutoff wavenumber $k_c\ne0$, $\beta=\sqrt{k^2-k_c^2}$: below $f_c$ the mode is evanescent; above it $v_p$ depends on frequency.
> - **Microstrip:** in the substrate a TEM wave would travel at $c/\sqrt{\epsilon_r}$, in air at $c$. No single TEM wave satisfies the boundary at the air–dielectric interface, so the true mode is a hybrid TE–TM. When $d\ll\lambda$ its fields look like the static ones and an effective medium works.
> - The ECE 373 binder classifies lines the same way (p. 43): multi-conductor (homogeneous dielectric = TEM, inhomogeneous = quasi-TEM), single-conductor (waveguides, slow-wave), no conductor (dielectric/optical guides).

## Level 0: The Line as a Two-Number Box

### Telegrapher's Equations

```tikz title="Lumped model of a length dz of line: series R, L per meter, shunt G, C per meter. Cascading these gives the telegrapher equations. After Pozar Fig. 2.1 and ECE 373 binder p. 12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} to[R, l=$R\Delta z$] (2.2,2) to[L, l=$L\Delta z$] (4.4,2) -- (8,2) node[ocirc]{};
  \draw (0,0) node[ocirc]{} -- (8,0) node[ocirc]{};
  \draw (4.9,2) to[R, l_=$G\Delta z$] (4.9,0);
  \draw (6.2,2) to[C, l=$C\Delta z$] (6.2,0);
  \node[font=\scriptsize] at (0,1.65) {$+$};
  \node[font=\scriptsize] at (0,0.35) {$-$};
  \node[left] at (-0.1,1) {$v(z,t)$};
  \node[font=\scriptsize] at (8,1.65) {$+$};
  \node[font=\scriptsize] at (8,0.35) {$-$};
  \node[right] at (8.1,1) {$v(z+\Delta z,t)$};
  \draw[->] (0.1,2.9) -- node[above,font=\scriptsize]{$i(z,t)$} (0.9,2.9);
  \draw[->] (7.1,2.9) -- node[above,font=\scriptsize]{$i(z+\Delta z,t)$} (7.9,2.9);
  \draw[<->] (0,-0.5) -- node[below,font=\scriptsize]{$\Delta z\ll\lambda$} (8,-0.5);
  \node[font=\scriptsize,align=left,anchor=west] at (10.4,1.6) {$R$: conductor loss ($\Omega$/m)};
  \node[font=\scriptsize,align=left,anchor=west] at (10.4,1.15) {$L$: loop inductance (H/m)};
  \node[font=\scriptsize,align=left,anchor=west] at (10.4,0.7) {$G$: dielectric loss (S/m)};
  \node[font=\scriptsize,align=left,anchor=west] at (10.4,0.25) {$C$: capacitance (F/m)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{\partial v}{\partial z}=-Ri-L\frac{\partial i}{\partial t},\qquad \frac{\partial i}{\partial z}=-Gv-C\frac{\partial v}{\partial t}}
\qquad\xrightarrow{\ e^{j\omega t}\ }\qquad
\boxed{\frac{dV}{dz}=-(R+j\omega L)I,\qquad \frac{dI}{dz}=-(G+j\omega C)V}
$$

$$
\boxed{V(z)=V_0^+e^{-\gamma z}+V_0^-e^{\gamma z},\qquad I(z)=\frac{V_0^+}{Z_0}e^{-\gamma z}-\frac{V_0^-}{Z_0}e^{\gamma z}}
$$

$$
\boxed{\gamma=\alpha+j\beta=\sqrt{(R+j\omega L)(G+j\omega C)},\qquad Z_0=\sqrt{\frac{R+j\omega L}{G+j\omega C}}}
$$

$$
\boxed{\text{Lossless: }\ \beta=\omega\sqrt{LC},\quad Z_0=\sqrt{L/C},\quad v_p=\frac{\omega}{\beta}=\frac{1}{\sqrt{LC}},\quad \lambda=\frac{2\pi}{\beta}=\frac{v_p}{f}}
$$

- The $e^{-\gamma z}$ term travels toward $+z$ (toward the load), $e^{+\gamma z}$ toward $-z$. $\alpha$ (Np/m) is the decay, $\beta$ (rad/m) the phase per meter.
- $Z_0$ is the ratio $V/I$ **of each traveling wave alone**. It is *not* the ratio of total voltage to total current on a mismatched line (binder p. 19).
- $Z_0$ is set by the cross-section geometry and $\epsilon_r$; it is real for a lossless line and nearly real for a low-loss one.

> [!tip] Remark
> These are the plane-wave equations of [[EM Foundations#Plane Waves]] with $V\leftrightarrow E$, $I\leftrightarrow H$, $L\leftrightarrow\mu$, $C\leftrightarrow\epsilon$. That is why $\Gamma$ below has exactly the form of the plane-wave reflection coefficient $(\eta_2-\eta_1)/(\eta_2+\eta_1)$.

> [!note]- Derivation: from the lumped section to the wave equation (Pozar §2.1, binder pp. 12–18)
> KVL around the section: $v(z,t)-R\Delta z\,i-L\Delta z\,\partial i/\partial t-v(z+\Delta z,t)=0$. KCL at the shunt node: $i(z,t)-G\Delta z\,v(z+\Delta z,t)-C\Delta z\,\partial v(z+\Delta z,t)/\partial t-i(z+\Delta z,t)=0$. Divide by $\Delta z$ and let $\Delta z\to0$ to get the time-domain telegrapher equations; $\partial/\partial t\to j\omega$ gives the phasor form.
>
> Differentiate the first phasor equation and substitute the second:
> $$\frac{d^2V}{dz^2}-\gamma^2V=0,\qquad \gamma^2=(R+j\omega L)(G+j\omega C)$$
> with solution $V=V_0^+e^{-\gamma z}+V_0^-e^{\gamma z}$. Put it back into $dV/dz=-(R+j\omega L)I$:
> $$I=\frac{\gamma}{R+j\omega L}\left(V_0^+e^{-\gamma z}-V_0^-e^{\gamma z}\right)\ \Rightarrow\ Z_0=\frac{R+j\omega L}{\gamma}=\sqrt{\frac{R+j\omega L}{G+j\omega C}}$$
> In the time domain, $v(z,t)=|V_0^+|\cos(\omega t-\beta z+\phi^+)e^{-\alpha z}+|V_0^-|\cos(\omega t+\beta z+\phi^-)e^{\alpha z}$.
>
> Note: the binder's p. 18 writes $dV/dz=+(R+j\omega L)I$; the minus sign above (Pozar 2.3a) is the correct one.

> [!note]- Detail: RLGC of the three textbook lines (Pozar Table 2.1, binder p. 46)
> | | Coax ($a$ inner, $b$ outer radius) | Two-wire (radius $a$, spacing $D$) | Parallel plate (width $w$, gap $d$) |
> |---|---|---|---|
> | $L$ | $\frac{\mu}{2\pi}\ln\frac ba$ | $\frac{\mu}{\pi}\cosh^{-1}\frac{D}{2a}$ | $\frac{\mu d}{w}$ |
> | $C$ | $\frac{2\pi\epsilon'}{\ln(b/a)}$ | $\frac{\pi\epsilon'}{\cosh^{-1}(D/2a)}$ | $\frac{\epsilon' w}{d}$ |
> | $R$ | $\frac{R_s}{2\pi}\left(\frac1a+\frac1b\right)$ | $\frac{R_s}{\pi a}$ | $\frac{2R_s}{w}$ |
> | $G$ | $\frac{2\pi\omega\epsilon''}{\ln(b/a)}$ | $\frac{\pi\omega\epsilon''}{\cosh^{-1}(D/2a)}$ | $\frac{\omega\epsilon'' w}{d}$ |
>
> $R_s=\sqrt{\omega\mu_c/2\sigma_c}=\sqrt{\pi f\mu_c/\sigma_c}$ uses the *conductor's* $\mu,\sigma$; $\epsilon',\epsilon''$ are the filling's. For $D\gg 2a$, $\cosh^{-1}(D/2a)\approx\ln(D/a)$. Every entry obeys $LC=\mu\epsilon'$ (TEM).

**Worked:** [[Exam Prep - Problems through Stability#2.1 ★ Reading a traveling wave|Pozar 2.1]] (read $f$, $v_p$, $\epsilon_r$ off $i(t,z)$), [[Exam Prep - Problems through Stability#2.2 📝PS1 ★ γ and Z₀ from RLGC (lossy vs lossless)|Pozar 2.2]] ($\gamma$, $Z_0$ from RLGC at 800 MHz: $Z_0=50.0+j0.46\ \Omega$, 1.41 dB over 30 cm), [[Exam Prep - Problems through Stability#2.3 ★ Coax RLGC (RG‑402U)|Pozar 2.3]] (RG-402U RLGC, 0.38 dB/m computed vs 0.43 dB/m spec).

## Level 1: The Terminated Lossless Line

### Reflection Coefficient (Transmission Line)

$$
\boxed{\Gamma_L=\frac{V_0^-}{V_0^+}=\frac{Z_L-Z_0}{Z_L+Z_0}=\frac{z_L-1}{z_L+1},\qquad z_L=\frac{Z_L}{Z_0}}
$$

$$
\boxed{\Gamma(\ell)=\Gamma_L\,e^{-2j\beta\ell}\quad(\ell=\text{distance from the load toward the generator})}
$$

$$
\boxed{V(z)=V_0^+\left(e^{-j\beta z}+\Gamma_Le^{j\beta z}\right),\qquad I(z)=\frac{V_0^+}{Z_0}\left(e^{-j\beta z}-\Gamma_Le^{j\beta z}\right)}
$$

| Load | $\Gamma_L$ |
|---|---|
| Matched, $Z_L=Z_0$ | $0$ |
| Short | $-1$ |
| Open | $+1$ |
| Pure reactance $jX$ | $|\Gamma|=1$ (all power reflects) |
| Passive load | $|\Gamma|\le1$ |

- On a lossless line $|\Gamma|$ is the same everywhere; only its phase rotates, by $-2\beta\ell$ (two trips over $\ell$). Half a wavelength is one full turn, so everything repeats every $\lambda/2$.
- **Junction of two lines** $Z_0\to Z_1$ (second line matched or infinite): $\Gamma=\frac{Z_1-Z_0}{Z_1+Z_0}$, and the wave continues with
$$\boxed{T=1+\Gamma=\frac{2Z_1}{Z_1+Z_0},\qquad IL=-20\log|T|\ \text{dB}}$$
$T>1$ is allowed for voltage (a higher-impedance line); power is still conserved: $P_{inc}=P_{ref}+P_{trans}$.

> [!tip] Remark
> Rotating $\Gamma$ by $-2\beta\ell$ at constant $|\Gamma|$ is a circle around the center of the [[Smith Chart and Impedance Matching|Smith chart]] (clockwise = toward the generator). The chart, admittance moves and matching all live there; this note only supplies $\Gamma$ and $Z_{in}$.

**Worked:** [[Exam Prep - Problems through Stability#2.10 📝PS1 Γ → Z and moving along the line|Pozar 2.10]] ($\Gamma\to Z$ and moving 0.3λ), [[Exam Prep - Problems through Stability#2.18 📝PS1 ★ Junction of two lines (binder L17)|Pozar 2.18]] (junction 50 → 75 Ω: $P_{inc}=0.25$ W, $P_{ref}=0.01$ W, $P_{trans}=0.24$ W), [[Exam Prep - Problems through Stability#2.17 Reactive load|Pozar 2.17]] ($|\Gamma|=1$ for $Z_L=jX$).

### Return Loss and VSWR

```tikz title="Standing-wave magnitude versus distance from the load: flat for a match, between 1-|Γ| and 1+|Γ| for a partial mismatch (here Γ = 0.5, real), full nulls for a short. Maxima repeat every lambda/2. After Pozar Fig. 2.6 and binder p. 30."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.6,0) node[right] {$\ell/\lambda$ (from load)};
  \draw[->] (0,0) -- (0,3.4) node[above] {$|V|/|V_0^+|$};
  \foreach \x/\t in {0/0,2/0.25,4/0.5,6/0.75,8/1} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {\t}; }
  \foreach \y in {1,2} { \draw (0.08,{1.4*\y}) -- (-0.08,{1.4*\y}) node[left,font=\scriptsize] {\y}; }
  \draw[thick,green!50!black] (0,1.4) -- (8,1.4);
  \draw[thick,blue,domain=0:8,samples=160] plot (\x,{1.4*sqrt(1.25+cos(90*\x))});
  \draw[thick,red,domain=0:8,samples=160] plot (\x,{1.4*2*abs(sin(45*\x))});
  \draw[dashed] (0,2.1) -- (8.2,2.1) node[right,font=\scriptsize] {$1+|\Gamma|$};
  \draw[dashed] (0,0.7) -- (8.2,0.7) node[right,font=\scriptsize] {$1-|\Gamma|$};
  \draw[<->] (0,3.0) -- node[above,font=\scriptsize] {$\lambda/2$} (4,3.0);
  \draw[<->] (4,0.35) -- node[below,font=\scriptsize] {$\lambda/4$} (6,0.35);
  \node[font=\scriptsize,green!50!black,anchor=west] at (8.9,1.4) {matched: flat};
  \node[font=\scriptsize,blue,anchor=west] at (8.9,2.6) {$|\Gamma|=0.5$: SWR $=3$};
  \node[font=\scriptsize,red,anchor=west] at (8.9,3.0) {short: SWR $=\infty$};
  \node[font=\scriptsize,anchor=west] at (0.1,-0.75) {load};
\end{circuitikz}
\end{document}
```

$$
\boxed{|V(\ell)|=|V_0^+|\,\big|1+|\Gamma|e^{j(\theta-2\beta\ell)}\big|,\qquad V_{max}=|V_0^+|(1+|\Gamma|),\quad V_{min}=|V_0^+|(1-|\Gamma|)}
$$

$$
\boxed{\text{SWR}=\frac{V_{max}}{V_{min}}=\frac{1+|\Gamma|}{1-|\Gamma|},\qquad |\Gamma|=\frac{\text{SWR}-1}{\text{SWR}+1},\qquad RL=-20\log|\Gamma|\ \text{dB}}
$$

- Maxima repeat every $\lambda/2$; a maximum and the next minimum are $\lambda/4$ apart. A matched line is **flat** (SWR = 1).
- $1\le\text{SWR}\le\infty$; return loss is $\ge0$ dB for a passive load ($\infty$ dB = matched, 0 dB = total reflection).
- At a voltage maximum $\Gamma(\ell)$ is real and positive, so $Z=Z_0\cdot\text{SWR}$; at a minimum $Z=Z_0/\text{SWR}$. For a *real* load, $\text{SWR}=Z_L/Z_0$ or $Z_0/Z_L$, whichever is $>1$.

| SWR | $|\Gamma|$ | RL (dB) | Power reflected |
|---|---|---|---|
| 1.00 | 0 | ∞ | 0 |
| 1.22 | 0.10 | 20.0 | 1% |
| 1.50 | 0.20 | 14.0 | 4% |
| 1.92 | 0.316 | 10.0 | 10% |
| 2.00 | 0.333 | 9.5 | 11% |
| 3.00 | 0.50 | 6.0 | 25% |

Anchors: **RL 20 dB ≈ SWR 1.2, RL 10 dB ≈ SWR 2.**

> [!note]- Detail: decibels, nepers and dBm (Pozar §2.3 Point of Interest)
> Power ratio in dB is $10\log(P_1/P_2)$; across equal resistances that is $20\log(V_1/V_2)$. Line attenuation is often in nepers: $\ln(V_1/V_2)$ Np, and $1\ \text{Np}=10\log e^2=8.686$ dB. So $\alpha$ in Np/m times 8.686 is dB/m. Absolute power: $10\log(P/1\text{ mW})$ dBm; 0 dBm = 1 mW, 30 dBm = 1 W.

**Worked:** [[Exam Prep - Problems through Stability#2.8 📝PS1 ★ Γ, SWR, Z_in|Pozar 2.8]] (SWR 2.71, $Z_{in}\approx Z_0\cdot$SWR near a maximum), [[Exam Prep - Problems through Stability#2.12 SWR → Z₀|Pozar 2.12]] (two possible $Z_0$ from SWR and a real load), Pozar 2.15 (the full table, in §1 of [[Exam Prep - Problems through Stability]]), [[Exam Prep - Problems through Stability#Pozar 2.19 (PS1) Voltage along a line|Pozar 2.19]] (plot $|V(z)|$: 6.21 V max, 3.79 V min, first minimum 0.106λ from the load).

### Transmission Line Input Impedance

$$
\boxed{Z_{in}=\frac{V(-\ell)}{I(-\ell)}=Z_0\frac{1+\Gamma_Le^{-2j\beta\ell}}{1-\Gamma_Le^{-2j\beta\ell}}=Z_0\frac{Z_L+jZ_0\tan\beta\ell}{Z_0+jZ_L\tan\beta\ell}}
$$

| Case | $Z_{in}$ | Use |
|---|---|---|
| Matched load | $Z_0$ for any $\ell$ | The goal of every match |
| Short, $Z_L=0$ | $\boxed{jZ_0\tan\beta\ell}$ | Stub: $<\lambda/4$ inductive, $\lambda/4$ = open |
| Open, $Z_L=\infty$ | $\boxed{-jZ_0\cot\beta\ell}$ | Stub: $<\lambda/4$ capacitive, $\lambda/4$ = short |
| $\ell=\lambda/2$ (any $n\lambda/2$) | $\boxed{Z_L}$ | Transparent at one frequency, whatever $Z_0$ |
| $\ell=\lambda/4+n\lambda/2$ | $\boxed{Z_0^2/Z_L}$ | Impedance inverter: [[Smith Chart and Impedance Matching\|quarter-wave transformer]] |

```tikz title="Input reactance of a shorted (left) and an open (right) lossless stub versus length. Short stubs below lambda/4 are inductive, open stubs below lambda/4 capacitive; the pattern repeats every lambda/2. After Pozar Figs. 2.6(c) and 2.8(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\nm in {0/{short: $X_{in}=Z_0\tan\beta\ell$},7.6/{open: $X_{in}=-Z_0\cot\beta\ell$}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (0,0) -- (6.6,0) node[right] {$\beta\ell$};
      \draw[->] (0,-2.4) -- (0,2.6) node[above] {$X_{in}/Z_0$};
      \foreach \x/\t in {1.5/{$\lambda/8$},3/{$\lambda/4$},4.5/{$3\lambda/8$},6/{$\lambda/2$}} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {\t}; }
      \draw (0.08,0.7) -- (-0.08,0.7) node[left,font=\scriptsize] {$1$};
      \draw (0.08,-0.7) -- (-0.08,-0.7) node[left,font=\scriptsize] {$-1$};
      \draw[dashed,gray] (3,-2.3) -- (3,2.3);
      \node[font=\scriptsize] at (3.2,2.95) {\nm};
    \end{scope}
  }
  \draw[thick,blue,domain=0:72,samples=60] plot ({\x/30},{0.7*tan(\x)});
  \draw[thick,blue,domain=108:180,samples=60] plot ({\x/30},{0.7*tan(\x)});
  \node[font=\scriptsize,anchor=west] at (0.2,1.6) {$L$};
  \node[font=\scriptsize,anchor=west] at (3.6,-1.6) {$C$};
  \draw[thick,red,domain=17:163,samples=80] plot ({7.6+\x/30},{-0.7/tan(\x)});
  \node[font=\scriptsize,anchor=west] at (8.0,-1.6) {$C$};
  \node[font=\scriptsize,anchor=west] at (11.4,1.6) {$L$};
\end{circuitikz}
\end{document}
```

- A short line ($\beta\ell\ll1$) is a lumped element: shorted ≈ series $L=Z_0\ell/v_p$ (high $Z_0$ makes good inductors), open ≈ shunt $C=\ell/(Z_0v_p)$ (low $Z_0$ makes good capacitors).
- The open-stub column is the shorted one shifted by $\lambda/4$.
- **Measuring a line:** terminate it in an open and then a short; $\boxed{Z_0=\sqrt{Z_{oc}Z_{sc}}}$ and $\tanh\gamma\ell=\sqrt{Z_{sc}/Z_{oc}}$ (holds for lossy lines too).

> [!tip] Remark
> The stub reactances are what [[Smith Chart and Impedance Matching|stub matching]] and [[Microwave Filters|Richards' transformation]] use: a shorted stub replaces an inductor, an open stub a capacitor. The $\lambda/4$ resonance of a shorted or open line is a [[Microwave Resonators|transmission-line resonator]]. A via stub notching a SerDes channel at $f=v/(4\ell_{stub})$ ([[Channels]]) is the open-stub row: at $\lambda/4$ its $Z_{in}=0$ shorts the through path.

> [!note]- Derivation: $Z_{in}$ in tan form (Pozar §2.3)
> Take $V(-\ell)/I(-\ell)$ from the standing-wave expressions: $Z_{in}=Z_0\frac{e^{j\beta\ell}+\Gamma e^{-j\beta\ell}}{e^{j\beta\ell}-\Gamma e^{-j\beta\ell}}$. Substitute $\Gamma=\frac{Z_L-Z_0}{Z_L+Z_0}$ and multiply through by $Z_L+Z_0$:
> $$Z_{in}=Z_0\frac{(Z_L+Z_0)e^{j\beta\ell}+(Z_L-Z_0)e^{-j\beta\ell}}{(Z_L+Z_0)e^{j\beta\ell}-(Z_L-Z_0)e^{-j\beta\ell}}=Z_0\frac{Z_L\cos\beta\ell+jZ_0\sin\beta\ell}{Z_0\cos\beta\ell+jZ_L\sin\beta\ell}$$
> and divide by $\cos\beta\ell$. Short: $V=-2jV_0^+\sin\beta z$, $I=\frac{2V_0^+}{Z_0}\cos\beta z$ (voltage null, current maximum at the load). Open: $V=2V_0^+\cos\beta z$, $I=\frac{-2jV_0^+}{Z_0}\sin\beta z$. Normalized: $z_{in}=\frac{z_L+j\tan\beta\ell}{1+jz_L\tan\beta\ell}$.

> [!example]- Example: a 5 pF capacitor from an open stub (Pozar 2.11)
> 100 Ω line, $\epsilon_e=1.65$, 2.5 GHz, so $\lambda=c/(f\sqrt{\epsilon_e})=9.34$ cm.
> 1. Target reactance $X=-1/(\omega C)=-12.73\ \Omega$.
> 2. $-Z_0\cot\beta\ell=-12.73\Rightarrow\cot\beta\ell=0.1273$, $\beta\ell=1.444$ rad.
> 3. $\ell=\frac{1.444}{2\pi}\lambda=2.15$ cm $=0.155\lambda$ (shorter than $\lambda/4$: capacitive ✓).
>
> A 5 nH inductor from the same open line needs $\beta\ell=2.237$ rad, $\ell=3.32$ cm (between $\lambda/4$ and $\lambda/2$). As microstrip on a 0.762 mm, $\epsilon_r=2.2$ board (Pozar 3.21): $W=0.683$ mm, $\epsilon_e=1.758$, $\ell_C=2.08$ cm. Full solutions: [[Exam Prep - Problems through Stability#2.11 📝PS1 ★ Open stub as a capacitor / inductor|2.11]], [[Exam Prep - Problems through Stability#3.21 ★ Microstrip stub as C / L|3.21]].

**Worked:** [[Exam Prep - Problems through Stability#Past midterm 2018 P1 ★ Z₀ and βℓ from open/short measurements|Midterm 2018 P1]] ($Z_{oc}=-j10$, $Z_{sc}=j70$ give $Z_0=26.5\ \Omega$, $\beta\ell=69.3^\circ$), [[Exam Prep - Problems through Stability#2.9 Same idea with physical length|Pozar 2.9]] (physical length → electrical length), [[Exam Prep - Problems through Stability#2.21 / 2.22 Stub lengths on the Smith chart|Pozar 2.21/2.22]] (stub-length table).

### Power Flow on a Mismatched Line

$$
\boxed{P_L=\frac{|V_0^+|^2}{2Z_0}\left(1-|\Gamma_L|^2\right)=P_{inc}-P_{ref}}\qquad(\text{same at every } z \text{ on a lossless line})
$$

With a mismatched generator too ($Z_g$, $\Gamma_g=\frac{Z_g-Z_0}{Z_g+Z_0}$):

$$
\boxed{P_L=\frac12|V_g|^2\frac{R_{in}}{(R_{in}+R_g)^2+(X_{in}+X_g)^2},\qquad Z_{in}=R_{in}+jX_{in}}
$$

| Condition | What is set | $P_L$ | Standing wave? |
|---|---|---|---|
| Load matched to line | $Z_L=Z_0$ ($\Gamma_L=0$) | $\frac12|V_g|^2\frac{Z_0}{(Z_0+R_g)^2+X_g^2}$ | No |
| Generator matched to loaded line | $Z_{in}=Z_g$ | $\frac12|V_g|^2\frac{R_g}{4(R_g^2+X_g^2)}$ | Possibly |
| **Conjugate match** | $\boxed{Z_{in}=Z_g^*}$ | $\boxed{P_{avs}=\frac{|V_g|^2}{8R_g}}$ (peak $V_g$) | Possibly |

- Conjugate matching gives the **maximum** power for a fixed $Z_g$, and it does not require a flat line: the multiple reflections add in phase at the load. For real $Z_g$ the last two rows coincide.
- Neither match gives the best *efficiency*: with $Z_g=Z_L=Z_0$ half the generated power burns in $Z_g$ (50%). Efficiency improves only by making $Z_g$ small.
- **Mismatch loss** $=-10\log(1-|\Gamma|^2)$ dB: the power you lose to reflection when the source is matched to the line.

> [!tip] Remark
> $P_{avs}=|V_g|^2/8R_g$ is the available power that [[RF Amplifier Design]] gains ($G_T$, $G_A$) are normalized to, and $(1-|\Gamma|^2)$ is the mismatch factor that appears in every one of them. The same three cases in power-wave language are in [[Microwave Network Analysis]].

> [!note]- Derivation: generator mismatch and conjugate matching (Pozar §2.6, binder pp. 34–41)
> At the line input $V_{in}=V_g\frac{Z_{in}}{Z_{in}+Z_g}$, so $P=\frac12\mathrm{Re}\{V_{in}I_{in}^*\}=\frac12|V_g|^2\left|\frac{Z_{in}}{Z_{in}+Z_g}\right|^2\mathrm{Re}\{1/Z_{in}\}$, which reduces to the boxed $R_{in}$ form. On a lossless line this is also the load power. The incident amplitude is
> $$V_0^+=V_g\frac{Z_0}{Z_0+Z_g}\frac{e^{-j\beta\ell}}{1-\Gamma_\ell\Gamma_ge^{-2j\beta\ell}}$$
> (the denominator sums the infinite bounce series). Maximize $P$ over $R_{in}$ and $X_{in}$:
> $$\frac{\partial P}{\partial R_{in}}=0\Rightarrow R_g^2-R_{in}^2+(X_{in}+X_g)^2=0,\qquad\frac{\partial P}{\partial X_{in}}=0\Rightarrow X_{in}(X_{in}+X_g)=0$$
> so $R_{in}=R_g$, $X_{in}=-X_g$: $Z_{in}=Z_g^*$ and $P=\frac12|V_g|^2/(4R_g)$.

> [!example]- Example: power to an antenna through 50 Ω coax (Pozar 2.14)
> A 50 Ω transmitter that delivers 30 W into 50 Ω feeds an $80+j40\ \Omega$ antenna. The source is matched to the line, so $P_{inc}=30$ W.
> $\Gamma=\frac{30+j40}{130+j40}=0.368\angle36^\circ$, $P_L=30(1-0.135)=25.9$ W, mismatch loss 0.63 dB.

**Worked:** [[Exam Prep - Problems through Stability#2.16 📝PS1 ★ Power to the load, three ways|Pozar 2.16]] ($P_L$ three ways, and which survive a lossy line), [[Exam Prep - Problems through Stability#Pozar 2.25 (PS1) Waves on a λ/4 transformer|Pozar 2.25]] (standing wave *inside* a matched $\lambda/4$ section), and the "Generator mismatch: the three cases" problem in §1 of [[Exam Prep - Problems through Stability]].

## Level 2: Lossy Lines

### Low-Loss Line and Attenuation

For $R\ll\omega L$ and $G\ll\omega C$ (every useful line):

$$
\boxed{\alpha\approx\frac12\left(\frac{R}{Z_0}+GZ_0\right)=\alpha_c+\alpha_d,\qquad \beta\approx\omega\sqrt{LC},\qquad Z_0\approx\sqrt{L/C}}
$$

$$
\boxed{\text{Lossy terminated line: }\ \Gamma(\ell)=\Gamma_Le^{-2\gamma\ell},\qquad Z_{in}=Z_0\frac{Z_L+Z_0\tanh\gamma\ell}{Z_0+Z_L\tanh\gamma\ell}}
$$

$$
\boxed{\alpha_d=\frac{k\tan\delta}{2}\ \text{(TEM, filled)},\qquad \alpha_c\propto R_s\propto\sqrt f,\qquad \text{dB/m}=8.686\,\alpha}
$$

- Loss leaves $\beta$ and $Z_0$ at their lossless values to first order; it only adds $\alpha$.
- $|\Gamma|$ now **shrinks** toward the generator by $e^{-2\alpha\ell}$: a long lossy line looks matched at its input whatever the load. (This hides a bad load from a VNA at the far end of a cable.)
- **Power:** into the line $P_{in}=\frac{|V_0^+|^2}{2Z_0}\left(e^{2\alpha\ell}-|\Gamma_L|^2e^{-2\alpha\ell}\right)$, to the load $P_L=\frac{|V_0^+|^2}{2Z_0}(1-|\Gamma_L|^2)$; both the incident and the reflected wave lose power on the way.
- Measured attenuation is higher than theory because of **surface roughness**: $\alpha_c'=\alpha_c\left[1+\frac2\pi\tan^{-1}\!\left(1.4(\Delta/\delta_s)^2\right)\right]$, $\Delta$ the rms roughness. When $\Delta\gg\delta_s$ conductor loss up to doubles.

> [!tip] Remark
> $R_s\propto\sqrt f$ is the skin effect ([[EM Foundations#Skin Depth]]) and $\alpha_d\propto f$ is the loss tangent ([[EM Foundations#Fields in Media Permittivity and Loss Tangent]]). In a backplane both grow with frequency and shape the channel's insertion loss; that link-level story is [[Channels#Level 1 Loss]].

> [!note]- Derivation: low-loss $\alpha$, $\beta$ (Pozar §2.7)
> $\gamma=\sqrt{(j\omega L)(j\omega C)}\sqrt{\left(1+\frac{R}{j\omega L}\right)\left(1+\frac{G}{j\omega C}\right)}=j\omega\sqrt{LC}\sqrt{1-j\left(\frac{R}{\omega L}+\frac{G}{\omega C}\right)-\frac{RG}{\omega^2LC}}$. Drop the $RG$ term and use $\sqrt{1+x}\approx1+x/2$:
> $$\gamma\approx j\omega\sqrt{LC}\left[1-\frac j2\left(\frac{R}{\omega L}+\frac{G}{\omega C}\right)\right]\Rightarrow\alpha\approx\frac12\left(R\sqrt{\frac CL}+G\sqrt{\frac LC}\right)$$
> For coax with the Table 2.1 RLGC (Pozar Ex. 2.6): $\alpha=\frac{R_s}{2\eta\ln(b/a)}\left(\frac1a+\frac1b\right)+\frac{\omega\epsilon''\eta}{2}$.

> [!note]- Derivation: the perturbation method and Wheeler's rule (Pozar §2.7)
> **Perturbation.** Without reflections $P(z)=P_0e^{-2\alpha z}$, so the loss per meter is $P_\ell=-dP/dz=2\alpha P$ and
> $$\alpha=\frac{P_\ell}{2P_0}$$
> Compute $P_\ell$ from the *lossless* fields: conductor loss $\frac{R_s}{2}\oint|\bar H_t|^2dl$, dielectric loss $\frac{\omega\epsilon''}{2}\int|\bar E|^2ds$. For coax this reproduces the result above (Pozar Ex. 2.7).
>
> **Wheeler incremental inductance.** The field penetrating a good conductor adds inductance $\Delta L$ equal to that of moving every wall back by $\delta_s/2$, and the same field sets the loss: $P_\ell=|I|^2\omega\Delta L/2$. So
> $$\alpha_c=\frac{\omega\Delta L}{2Z_0}=\frac{\beta\Delta Z_0}{2Z_0}=\frac{R_s}{2Z_0\eta}\frac{dZ_0}{d\ell}$$
> with $\ell$ the distance *into* each wall. Only $Z_0$(geometry) is needed. For coax, $Z_0=\frac{\eta}{2\pi}\ln\frac ba$ gives $\alpha_c=\frac{R_s}{4\pi Z_0}\left(\frac1a+\frac1b\right)$ (Pozar Ex. 2.8).

### Dispersion and the Distortionless Line

$$
\boxed{v_p=\frac{\omega}{\beta},\qquad v_g=\left(\frac{d\beta}{d\omega}\right)^{-1}}
$$

$$
\boxed{\text{Distortionless (Heaviside): }\ \frac RL=\frac GC\ \Rightarrow\ \alpha=R\sqrt{\frac CL}\ \text{(flat in } f),\quad \beta=\omega\sqrt{LC}\ \text{(linear)}}
$$

- A signal stays undistorted if the line's transfer function is $Ae^{-j\omega\tau}$: flat magnitude, linear phase. A lossless TEM line is exactly that.
- If $\beta$ is not linear in $\omega$ (any loss, microstrip, waveguide), components travel at different speeds: **dispersion**. A narrowband envelope travels at the group velocity $v_g$.
- The distortionless condition was met in telephone lines by adding series loading coils to raise $L$. It is not loss-free; it just loses every frequency equally.

> [!note]- Derivation: group velocity (Pozar §3.10)
> Model the matched line as $Z(\omega)=Ae^{-j\beta z}$. Feed it a narrowband signal $f(t)\cos\omega_0t$ (bandwidth $\omega_m\ll\omega_0$) and expand $\beta(\omega)\approx\beta_0+\beta_0'(\omega-\omega_0)$. The output is
> $$s_o(t)=A\,f(t-\beta_0'z)\cos(\omega_0t-\beta_0z)$$
> The envelope is delayed by $\beta_0'z$, so it moves at $v_g=1/\beta_0'=(d\beta/d\omega)^{-1}$; the carrier phase moves at $v_p=\omega_0/\beta_0$. In an air waveguide $\beta=\sqrt{k_0^2-k_c^2}$ gives $v_g=c\beta/k_0<c<v_p$ (Pozar Ex. 3.9).

## Level 3: Transients and Bounce Diagrams

A step launched into a line sees $Z_0$ until the first reflection returns, $2\ell/v_p$ later. So the line is a resistor $Z_0$ at first and becomes its DC equivalent only after the reflections die out.

$$
\boxed{v^+=V_0\frac{Z_0}{R_g+Z_0},\qquad \Gamma_L=\frac{R_L-Z_0}{R_L+Z_0},\quad \Gamma_g=\frac{R_g-Z_0}{R_g+Z_0},\qquad V_\infty=V_0\frac{R_L}{R_g+R_L}}
$$

```tikz title="Bounce (lattice) diagram for Pozar Example 2.9: each arrival multiplies the wave by that end's reflection coefficient. After Pozar Fig. 2.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7,0) node[right] {$z$};
  \draw[->] (0,0) -- (0,5.3) node[above] {$t$};
  \draw (6,0) -- (6,5.0);
  \node[below,font=\scriptsize] at (0,0) {$0$};
  \node[below,font=\scriptsize] at (6,0) {$\ell$};
  \foreach \k/\t in {1/{$\ell/v_p$},2/{$2\ell/v_p$},3/{$3\ell/v_p$},4/{$4\ell/v_p$}} { \draw (0.08,{1.2*\k}) -- (-0.08,{1.2*\k}) node[left,font=\scriptsize] {\t}; }
  \draw[->,thick,blue] (0,0) -- node[above,sloped,font=\scriptsize] {$+8$ V} (6,1.2);
  \draw[->,thick,red] (6,1.2) -- node[above,sloped,font=\scriptsize] {$+8/3$ V} (0,2.4);
  \draw[->,thick,blue] (0,2.4) -- node[above,sloped,font=\scriptsize] {$-8/9$ V} (6,3.6);
  \draw[->,thick,red] (6,3.6) -- node[above,sloped,font=\scriptsize] {$-8/27$ V} (0,4.8);
  \node[font=\scriptsize,align=center] at (-1.6,5.1) {source\\ $\Gamma_g=-1/3$};
  \node[font=\scriptsize,align=center] at (6.9,5.1) {load\\ $\Gamma_L=+1/3$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,3.2) {$V_0=12$ V, $R_g=50\ \Omega$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,2.75) {$Z_0=100\ \Omega$, $R_L=200\ \Omega$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,2.0) {first wave: $12\cdot\frac{100}{150}=8$ V};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,1.4) {$V_L$: $10.67\to9.48\to9.61\to\dots$};
  \node[font=\scriptsize,align=left,anchor=west] at (7.6,0.9) {$\to 12\cdot\frac{200}{250}=9.6$ V (DC divider)};
\end{circuitikz}
\end{document}
```

- Each arrival multiplies the wave by the end's $\Gamma$; the voltage at a point is the sum of every ray that has crossed it.
- Matched load: one step of $V_0/2$, done at $\ell/v_p$. Short load ($\Gamma=-1$) with matched source: a pulse of width $2\ell/v_p$ at the input (a pulse generator). Open load ($\Gamma=+1$): the input steps to $V_0/2$, then to $V_0$ at $2\ell/v_p$.

| $\Gamma_g$, $\Gamma_L$ signs | Waveform at the load (Palermo L2 slide 40) |
|---|---|
| both $<0$ (e.g. 25 Ω / 25 Ω on 50 Ω) | Converges monotonically |
| opposite signs | Oscillates (rings) about the final value |
| both $>0$ (e.g. 100 Ω / 100 Ω) | Rings up in steps |

| Termination | Behavior | Use (Palermo L2 slides 41–42) |
|---|---|---|
| None | Nothing absorbs the energy; rings | Only if the line is short: $t_r>n\cdot2\ell\sqrt{LC}$, $n\approx4$–6 |
| Source (series $R_g=Z_0$) | Load steps once to full swing; the source sees a half-step "porch" for $2\ell\sqrt{LC}$ | Moderate-speed point-to-point |
| Receiver ($R_L=Z_0$) | No load reflection, but anything reflected back is not absorbed at the driver | Watch intermediate discontinuities |
| Double ($R_g=R_L=Z_0$) | Reflections absorbed at both ends; half the swing | Standard for high-speed serial links |

> [!tip] Remark
> This is the time-domain face of the same $\Gamma$: a TDR trace *is* a bounce diagram measured at the input, with each impedance step read off as $\Gamma$. TDR, via and package reflections, and the pulse response of a real lossy channel are in [[Channels]]; termination circuits are in [[Transmitters]] and [[Receivers]].

> [!example]- Example: bounce diagram with both ends mismatched (Pozar Ex. 2.9, p. 89)
> 12 V step, $R_g=50\ \Omega$, $Z_0=100\ \Omega$, $R_L=200\ \Omega$.
> 1. First wave: $v^+=12\cdot\frac{100}{150}=8$ V.
> 2. $\Gamma_L=\frac{200-100}{300}=+\frac13$, $\Gamma_g=\frac{50-100}{150}=-\frac13$.
> 3. Rays: $8\to+\frac83\to-\frac89\to-\frac{8}{27}$ V.
> 4. Load voltage: $10.67$ V at $\ell/v_p$, $9.48$ V at $3\ell/v_p$, $9.61$ V at $5\ell/v_p$, settling to $12\cdot\frac{200}{250}=9.6$ V. Opposite-sign reflections, so it oscillates as it converges.

## Level 4: Practical Lines

Which line to use (Pozar Table 3.6, binder p. 44):

| | Coax | Waveguide | Stripline | Microstrip |
|---|---|---|---|---|
| Mode | TEM | TE$_{10}$ | TEM | Quasi-TEM |
| Dispersion | None | Medium | None | Low |
| Bandwidth | High | Low | High | High |
| Loss | Medium | Low | High | High |
| Power capacity | Medium | High | Low | Low |
| Size | Large | Large | Medium | Small |
| Integration with devices | Hard | Hard | Fair | Easy |

### Coaxial Line

$$
\boxed{Z_0=\frac{\eta}{2\pi}\ln\frac ba=\frac{60}{\sqrt{\epsilon_r}}\ln\frac ba\ \Omega,\qquad \beta=\omega\sqrt{\mu\epsilon}=\sqrt{\epsilon_r}\,k_0}
$$

$$
\boxed{\alpha_c=\frac{R_s}{2\eta\ln(b/a)}\left(\frac1a+\frac1b\right),\qquad \alpha_d=\frac{k\tan\delta}{2}}
$$

$$
\boxed{\text{First higher mode TE}_{11}:\ k_c\approx\frac{2}{a+b},\qquad f_c=\frac{ck_c}{2\pi\sqrt{\epsilon_r}},\qquad f_{max}\approx0.95f_c}
$$

- Higher-order modes cap the frequency for a given cable size, and so cap the power for a given frequency. Thinner cable = higher $f_{max}$, less power.
- **Why 50 Ω:** an air coax has minimum conductor loss near **77 Ω** ($b/a=3.59$) and maximum power capacity near **30 Ω**. 50 Ω is the compromise; 75 Ω (TV) optimizes loss.
- Power capacity of air coax: breakdown at $E_d\approx3\times10^6$ V/m at the inner conductor gives $P_{max}=\frac{\pi a^2E_d^2}{\eta_0}\ln\frac ba$; with no higher modes, about 520 kW peak at 10 GHz for any coax.

| Connector | Upper frequency (Pozar p. 134) | Note |
|---|---|---|
| TNC (threaded BNC) | below 1 GHz | |
| Type-N | 11–18 GHz | Rugged, large (0.625 in) |
| SMA | 18–25 GHz | Most common microwave connector |
| APC-7 | 18 GHz, SWR < 1.04 | Sexless precision, for measurement |
| 2.4 mm | about 50 GHz | SMA-sized, mm-wave |

> [!example]- Example: highest usable frequency of RG-401U (Pozar Ex. 3.3, p. 132)
> Inner 0.0645 in, outer 0.215 in diameter, Teflon $\epsilon_r=2.2$.
> 1. $b/a=3.33$; from the exact curve $k_ca=0.45$ (the approximation gives $2/(1+b/a)=0.462$).
> 2. $k_c=549.4\ \text{m}^{-1}$, $f_c=\frac{ck_c}{2\pi\sqrt{\epsilon_r}}=17.7$ GHz.
> 3. With a 5% margin, $f_{max}=16.8$ GHz.

> [!note]- Derivation: why 77 Ω is the minimum-loss coax (Pozar Prob. 2.27)
> Fix $b$, vary $x=b/a$: $\alpha_c\propto\frac{1+x}{\ln x}$. Setting the derivative to zero gives $x\ln x=1+x$, so $x=3.59$ and $Z_0=60\ln3.59=76.7\ \Omega$ for air. Full solution: [[Exam Prep - Problems through Stability#2.27 ☆ Optimum coax for minimum conductor loss|2.27]].

### Stripline

A strip of width $W$ centered between two ground planes $b$ apart, homogeneous dielectric: a "flattened coax", pure TEM.

$$
\boxed{Z_0=\frac{30\pi}{\sqrt{\epsilon_r}}\frac{b}{W_e+0.441b},\qquad \frac{W_e}{b}=\frac Wb-\begin{cases}0 & W/b>0.35\\ (0.35-W/b)^2 & W/b<0.35\end{cases}}
$$

$$
\boxed{\text{Synthesis: } \frac Wb=\begin{cases}x & \sqrt{\epsilon_r}Z_0<120\ \Omega\\ 0.85-\sqrt{0.6-x} & \sqrt{\epsilon_r}Z_0>120\ \Omega\end{cases},\qquad x=\frac{30\pi}{\sqrt{\epsilon_r}Z_0}-0.441}
$$

- $v_p=c/\sqrt{\epsilon_r}$ exactly (TEM). Zero-thickness strip; about 1% accurate.
- Keep the plate spacing and the sidewall spacing below $\lambda_d/2$ and stitch the grounds with vias to suppress parallel-plate modes.

> [!example]- Example: 50 Ω stripline at 10 GHz (Pozar Ex. 3.5, p. 143)
> $b=0.32$ cm, $\epsilon_r=2.20$, $\tan\delta=0.001$, copper, $t=0.01$ mm.
> 1. $\sqrt{\epsilon_r}Z_0=74.2<120$, $x=0.830$, so $W=bx=0.266$ cm.
> 2. $k=310.6\ \text{m}^{-1}$, $\alpha_d=k\tan\delta/2=0.155$ Np/m.
> 3. $R_s=0.026\ \Omega$, $\alpha_c=0.122$ Np/m (formula below, $A=4.74$).
> 4. Total $0.277$ Np/m $=2.41$ dB/m; $\lambda=2.02$ cm, so $0.049$ dB/$\lambda$.

> [!note]- Detail: stripline conductor loss formula (Pozar Eq. 3.181)
> $$\alpha_c=\begin{cases}\dfrac{2.7\times10^{-3}R_s\epsilon_rZ_0}{30\pi(b-t)}A & \sqrt{\epsilon_r}Z_0<120\\[2mm] \dfrac{0.16R_s}{Z_0b}B & \sqrt{\epsilon_r}Z_0>120\end{cases}\ \text{Np/m}$$
> $A=1+\frac{2W}{b-t}+\frac1\pi\frac{b+t}{b-t}\ln\frac{2b-t}{t}$, $B=1+\frac{b}{0.5W+0.7t}\left(0.5+\frac{0.414t}{W}+\frac{1}{2\pi}\ln\frac{4\pi W}{t}\right)$, $t$ = strip thickness. Pozar also solves $Z_0$ numerically from Laplace's equation with a uniform-charge guess (Ex. 3.6): within a few ohms of the formula, best for wide strips.

### Microstrip Effective Dielectric Constant

```tikz title="The effective-dielectric-constant idea: replace the air-plus-substrate cross-section by one uniform medium ε_e that gives the same capacitance and phase velocity. After Pozar Fig. 3.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \fill[gray!25] (0,0) rectangle (4.4,1.1);
    \draw[very thick] (0,0) -- (4.4,0);
    \fill[black!70] (1.7,1.1) rectangle (2.7,1.22);
    \node[font=\scriptsize] at (3.7,0.55) {$\epsilon_r$};
    \node[font=\scriptsize] at (3.7,1.7) {air, $\epsilon=1$};
    \draw[<->] (1.7,1.45) -- node[above,font=\scriptsize] {$W$} (2.7,1.45);
    \draw[<->] (-0.25,0) -- node[left,font=\scriptsize] {$d$} (-0.25,1.1);
    \node[font=\scriptsize] at (2.2,-0.5) {real line: field split between air and substrate};
  \end{scope}
  \node at (5.5,0.8) {$\Longrightarrow$};
  \begin{scope}[xshift=6.8cm]
    \fill[blue!12] (0,0) rectangle (4.4,2.2);
    \draw[very thick] (0,0) -- (4.4,0);
    \fill[black!70] (1.7,1.1) rectangle (2.7,1.22);
    \node[font=\scriptsize] at (3.7,0.55) {$\epsilon_e$};
    \node[font=\scriptsize] at (3.7,1.7) {$\epsilon_e$};
    \draw[<->] (-0.25,0) -- node[left,font=\scriptsize] {$d$} (-0.25,1.1);
    \node[font=\scriptsize] at (2.2,-0.5) {equivalent: one homogeneous medium, $1<\epsilon_e<\epsilon_r$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\epsilon_e=\frac{\epsilon_r+1}{2}+\frac{\epsilon_r-1}{2}\frac{1}{\sqrt{1+12d/W}},\qquad 1<\epsilon_e<\epsilon_r}
$$

$$
\boxed{v_p=\frac{c}{\sqrt{\epsilon_e}},\qquad \beta=\sqrt{\epsilon_e}\,k_0,\qquad \lambda_g=\frac{\lambda_0}{\sqrt{\epsilon_e}},\qquad Z_0=\frac{1}{v_pC}}
$$

- $\epsilon_e$ is the permittivity of the one uniform medium that would give the same $C$ (and so the same $v_p$) as the real air-plus-substrate cross-section.
- Wider strip → more field in the substrate → $\epsilon_e\to\epsilon_r$. Narrow strip → $\epsilon_e\to(\epsilon_r+1)/2$.
- The binder (p. 48) adds a small correction for narrow strips, $W/d\le1$: $\epsilon_e=\frac{\epsilon_r+1}{2}+\frac{\epsilon_r-1}{2}\left[\left(1+12\frac dW\right)^{-1/2}+0.04\left(1-\frac Wd\right)^2\right]$. For $W/d\ge1$ the two agree.
- Substrates (binder p. 47): Duroid, quartz, alumina, silicon. The ECE 373 project board is RO4350B, $\epsilon_r=3.48$.

### Microstrip Characteristic Impedance Synthesis

**Analysis** (given $W/d$):

$$
\boxed{Z_0=\begin{cases}\dfrac{60}{\sqrt{\epsilon_e}}\ln\left(\dfrac{8d}{W}+\dfrac{W}{4d}\right) & W/d\le1\\[3mm]\dfrac{120\pi}{\sqrt{\epsilon_e}\left[W/d+1.393+0.667\ln(W/d+1.444)\right]} & W/d\ge1\end{cases}}
$$

**Synthesis** (given $Z_0$, $\epsilon_r$):

$$
\boxed{\frac Wd=\begin{cases}\dfrac{8e^A}{e^{2A}-2} & W/d<2\\[3mm]\dfrac2\pi\left[B-1-\ln(2B-1)+\dfrac{\epsilon_r-1}{2\epsilon_r}\left(\ln(B-1)+0.39-\dfrac{0.61}{\epsilon_r}\right)\right] & W/d>2\end{cases}}
$$

$$
\boxed{A=\frac{Z_0}{60}\sqrt{\frac{\epsilon_r+1}{2}}+\frac{\epsilon_r-1}{\epsilon_r+1}\left(0.23+\frac{0.11}{\epsilon_r}\right),\qquad B=\frac{377\pi}{2Z_0\sqrt{\epsilon_r}}}
$$

**Design procedure:**
1. Compute $A$; try $W/d=\frac{8e^A}{e^{2A}-2}$. If the result is $>2$, use the $B$ formula instead.
2. $W=(W/d)\,d$. Compute $\epsilon_e$ from $W/d$.
3. Check $Z_0$ with the analysis formula (it should come back within about 1%).
4. Electrical length: $\ell=\theta/(\sqrt{\epsilon_e}k_0)$, $k_0=2\pi f/c$.
5. Correct for strip thickness (below), dispersion ([[#Microstrip Dispersion]]) and discontinuities ([[#Microstrip Discontinuities]]); confirm in a CAD/EM tool.

Rules of thumb that fall out: $W/d$ depends only on $Z_0$ and $\epsilon_r$ (scale $W$ with $d$); 50 Ω on alumina ($\epsilon_r=9.9$) is $W\approx d$; on $\epsilon_r\approx2.2$–3.5 it is $W\approx2$–3$d$; a narrow strip is a high-$Z_0$ line.

> [!tip] Remark
> These are curve fits to quasi-static solutions, the same idea as Pozar's stripline fit. A wide strip is a parallel-plate capacitor ($C\approx\epsilon W/d$), so $Z_0=1/(v_pC)$ falls as $W$ grows; the $\ln$ form at narrow widths is the two-wire-like regime.

> [!note]- Detail: finite strip thickness (binder p. 51)
> The formulas assume $t/h<0.005$. A thick strip has extra edge capacitance; model it as a wider zero-thickness strip:
> $$\frac{W_{eff}}{h}=\frac Wh+\frac{t}{\pi h}\left(1+\ln\frac{2h}{t}\right)\ \ (W/h\ge\tfrac1{2\pi}),\qquad \frac{W_{eff}}{h}=\frac Wh+\frac{t}{\pi h}\left(1+\ln\frac{4\pi W}{t}\right)\ \ (W/h\le\tfrac1{2\pi})$$
> $Z_0$ drops slightly, so you can draw the line slightly narrower. ($h$ = substrate thickness, Pozar's $d$.)
>
> The binder (p. 49) also gives direct fits for the guide wavelength: $\lambda=\frac{\lambda_0}{\sqrt{\epsilon_r}}\left[\frac{\epsilon_r}{1+0.63(\epsilon_r-1)(W/h)^{0.1255}}\right]^{1/2}$ for $W/h\ge0.6$ and $\lambda=\frac{\lambda_0}{\sqrt{\epsilon_r}}\left[\frac{\epsilon_r}{1+0.6(\epsilon_r-1)(W/h)^{0.0297}}\right]^{1/2}$ for $W/h<0.6$.

> [!example]- Example: 50 Ω on alumina, 270° at 10 GHz (Pozar Ex. 3.7, p. 149)
> $d=0.5$ mm, $\epsilon_r=9.9$, $\tan\delta=0.001$, copper.
> 1. $A=2.142$, $W/d=0.9654<2$ ✓, so $W=0.483$ mm.
> 2. $\epsilon_e=6.665$.
> 3. $k_0=209.4\ \text{m}^{-1}$; $\ell=\frac{270^\circ(\pi/180^\circ)}{\sqrt{\epsilon_e}k_0}=8.72$ mm.
> 4. Loss: $\alpha_d=0.255$ Np/m $=0.022$ dB/cm; $R_s=0.026\ \Omega$, $\alpha_c=R_s/(Z_0W)=0.0108$ Np/cm $=0.094$ dB/cm; total 0.101 dB over the line.
>
> CAD gives $W=0.478$ mm, $\epsilon_e=6.83$, $\ell=8.61$ mm, $\alpha_d=0.022$ dB/cm, $\alpha_c=0.054$ dB/cm. The formulas are within a few percent except for conductor loss, which they overestimate.

> [!example]- Example: 50 Ω on the course board, RO4350B (binder pp. 47–52)
> $h=1.524$ mm, $\epsilon_r=3.48$, 2.5 GHz. $A=1.392$ gives $W/h=2.27>2$, so switch to the $B$ formula: $B=6.349$, $W/h=2.27$, **$W=3.46$ mm**, $\epsilon_e=2.73$, $\lambda_g=72.5$ mm, $\lambda_g/4=18.1$ mm. Full solution, including dispersion and thickness, in [[Exam Prep - Problems through Stability]] §2 ("Course substrate"). A 100 Ω line on 0.51 mm, $\epsilon_r=2.2$ (Pozar 3.20): $W=0.457$ mm, $\lambda_g=4.52$ cm at 5 GHz ([[Exam Prep - Problems through Stability#3.20 ★ Microstrip design: W, λ_g, loss|3.20]]).

### Microstrip Losses

$$
\boxed{\alpha_d=\frac{k_0\epsilon_r(\epsilon_e-1)\tan\delta}{2\sqrt{\epsilon_e}(\epsilon_r-1)}\ \text{Np/m},\qquad \alpha_c\approx\frac{R_s}{Z_0W}\ \text{Np/m},\qquad R_s=\sqrt{\frac{\omega\mu_0}{2\sigma}}}
$$

- $\alpha_d$ is the TEM $k\tan\delta/2$ (with $k=\sqrt{\epsilon_e}k_0$) times the **filling factor** $\frac{\epsilon_r(\epsilon_e-1)}{\epsilon_e(\epsilon_r-1)}$: only the part of the field inside the substrate is lossy.
- **Conductor loss usually dominates** on good microwave substrates (exception: lossy semiconductor substrates such as silicon). It grows as $\sqrt f$ and as $1/W$: narrow, high-$Z_0$ lines are the lossiest.
- The $R_s/(Z_0W)$ estimate is rough (Ex. 3.7: 0.094 vs 0.054 dB/cm CAD); use it for trends, CAD for numbers.

> [!tip] Remark
> Line loss sets the $Q$ of a microstrip resonator ($Q\approx\beta/2\alpha$, [[Microwave Resonators]]) and the noise figure of a lossy line at the LNA input (a matched attenuator at room temperature has $F=L$, [[RF Noise and Distortion]]). Both are reasons the input match and resonators get wide, low-loss lines.

### Microstrip Dispersion

```tikz title="Microstrip dispersion: ε_e rises from its quasi-static value toward ε_r as frequency grows. Curve is Pozar Eq. 3.200 for the line of Example 3.8; the dot is the CAD value. After Pozar Fig. 3.27."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.6,0) node[right] {$f$ (GHz)};
  \draw[->] (0,0) -- (0,5.0) node[above] {$\epsilon_e(f)$};
  \foreach \f in {0,5,10,15,20} { \draw ({0.35*\f},0.08) -- ({0.35*\f},-0.08) node[below,font=\scriptsize] {\f}; }
  \foreach \e in {7,8,9,10} { \draw (0.08,{1.5*(\e-7)}) -- (-0.08,{1.5*(\e-7)}) node[left,font=\scriptsize] {\e}; }
  \draw[dashed] (0,4.5) -- (7.2,4.5) node[right,font=\scriptsize] {$\epsilon_r=10$};
  \draw[dashed] (0,0.795) -- (7.2,0.795) node[right,font=\scriptsize] {$\epsilon_e(0)=7.53$};
  \draw[very thick,blue,domain=0:20,samples=80] plot ({0.35*\x},{1.5*(3-2.47/(1+0.825*(\x/15.3)*(\x/15.3)))});
  \fill[red] (3.5,{1.5*(8.12-7)}) circle (0.07);
  \node[font=\scriptsize,red,anchor=north west] at (3.55,{1.5*(8.12-7)}) {CAD: 8.12 at 10 GHz};
  \node[font=\scriptsize,blue,anchor=south east] at (3.4,{1.5*(8.17-7)}) {Eq.: 8.17};
  \node[font=\scriptsize,align=left,anchor=west] at (0.3,3.8) {$25\ \Omega$ line, $\epsilon_r=10$, $d=0.65$ mm};
\end{circuitikz}
\end{document}
```

$$
\boxed{\epsilon_e(f)=\epsilon_r-\frac{\epsilon_r-\epsilon_e(0)}{1+G(f/f_p)^2},\qquad G=0.6+0.009Z_0,\qquad f_p=\frac{Z_0}{8\pi d}}
$$

($Z_0$ in Ω, $f$ in GHz, $d$ in cm.) Below this frequency dispersion can be neglected (binder p. 52):

$$
\boxed{f_0\ (\text{GHz})=0.3\sqrt{\frac{Z_0}{h(\text{cm})\sqrt{\epsilon_r-1}}}}
$$

- As $f$ rises more field crowds into the substrate: $\epsilon_e\uparrow$ toward $\epsilon_r$, $v_p\downarrow$, $Z_0$ rises slightly while the effective width falls. **Thin substrates and high-$Z_0$ lines disperse less.**
- The $\epsilon_e$ change matters more than the $Z_0$ change: it shifts the phase of every long line. A $Z_0$ shift only adds a small mismatch.

**Upper frequency limits** of a microstrip (higher-order modes, Pozar Eqs. 3.201–3.204):

| Mode that appears | Threshold | Cause |
|---|---|---|
| TM$_0$ surface wave couples strongly | $f_{T1}\simeq\frac{c}{2\pi d}\sqrt{\frac{2}{\epsilon_r-1}}\tan^{-1}\epsilon_r$ | TM$_0$ has zero cutoff, couples above this |
| TE$_1$ surface wave (at bends, steps, junctions) | $f_{T2}\simeq\frac{c}{4d\sqrt{\epsilon_r-1}}$ | Transverse currents at discontinuities |
| Transverse resonance across a wide strip | $f_{T3}\simeq\frac{c}{\sqrt{\epsilon_r}(2W+d)}$ | Width $\approx\lambda/2$ in the dielectric (rare) |
| Parallel-plate mode under a wide strip | $f_{T4}\simeq\frac{c}{2d\sqrt{\epsilon_r}}$ | Height $\approx\lambda/2$; up to 50% lower for thin strips |

Thinner substrates push all of them up.

> [!example]- Example: phase error from ignoring dispersion (Pozar Ex. 3.8, p. 152)
> 25 Ω line, $\epsilon_r=10$, $d=0.65$ mm, $W=2.00$ mm, $\epsilon_e(0)=7.53$. A 1.093 cm line is $360^\circ$ with $\epsilon_e(0)$; at 10 GHz CAD gives $\epsilon_e=8.120$ and the delay is $374^\circ$, a $14^\circ$ error. The formula tracks CAD up to about 10 GHz and overestimates above (plot above: $f_p=15.3$ GHz, $G=0.825$).
>
> Course board, RO4350B 50 Ω (binder p. 52): $f_0=4.3$ GHz, so quasi-static values are fine at 2.5 GHz; $\epsilon_e$ rises from 2.73 to 3.02 at 10 GHz.

### Microstrip Discontinuities

Every bend, step, gap, open end and junction stores extra field and adds a parasitic $L$ or $C$ (a T or Π equivalent). Effects (binder p. 98): **center-frequency shift** in narrowband circuits, **worse input/output VSWR**, **gain ripple** in broadband circuits, interfacing problems between blocks. They grow with frequency.

```tikz title="Common microstrip discontinuities (top views, left) and their equivalent circuits (right). After Pozar Fig. 4.23 and binder p. 100."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) open end
  \fill[gray!50] (0,0) rectangle (2.4,0.4);
  \node[font=\scriptsize,anchor=west] at (-0.1,-0.4) {(a) open end};
  \draw (4,0.6) node[left,font=\scriptsize] {$Z_0$} -- (5.0,0.6) to[C,l=$C_f$] (5.0,-0.4);
  \draw (4,-0.4) -- (5.0,-0.4);
  \node[font=\scriptsize,anchor=west] at (6.3,0.1) {$\equiv$ extra length $\Delta\ell$};
  % (b) gap
  \begin{scope}[yshift=-2.2cm]
    \fill[gray!50] (0,0) rectangle (1.05,0.4);
    \fill[gray!50] (1.35,0) rectangle (2.4,0.4);
    \node[font=\scriptsize,anchor=west] at (-0.1,-0.4) {(b) gap};
    \draw (4,0.6) node[left,font=\scriptsize] {$Z_0$} -- (4.6,0.6) to[C,l=$C_g$] (6.4,0.6) -- (7,0.6) node[right,font=\scriptsize] {$Z_0$};
    \draw (4.6,0.6) to[C,l_=$C_p$] (4.6,-0.6);
    \draw (6.4,0.6) to[C,l=$C_p$] (6.4,-0.6);
    \draw (4,-0.6) -- (7,-0.6);
  \end{scope}
  % (c) step
  \begin{scope}[yshift=-4.6cm]
    \fill[gray!50] (0,-0.15) rectangle (1.2,0.55);
    \fill[gray!50] (1.2,0.05) rectangle (2.4,0.35);
    \node[font=\scriptsize,anchor=west] at (-0.1,-0.55) {(c) step in width};
    \draw (4,0.6) node[left,font=\scriptsize] {$Z_{01}$} to[L,l=$L$] (5.5,0.6) to[L,l=$L$] (7,0.6) node[right,font=\scriptsize] {$Z_{02}$};
    \draw (5.5,0.6) to[C,l=$C$] (5.5,-0.6);
    \draw (4,-0.6) -- (7,-0.6);
  \end{scope}
  % (d) T junction
  \begin{scope}[yshift=-7.2cm]
    \fill[gray!50] (0,0) rectangle (2.4,0.4);
    \fill[gray!50] (1.0,-0.9) rectangle (1.4,0);
    \node[font=\scriptsize,anchor=west] at (-0.1,-1.25) {(d) T-junction};
    \draw (3.6,0.6) node[left,font=\scriptsize] {$Z_{01}$} to[L,l=$L_1$] (5,0.6) -- (6.2,0.6) to[L,l=$L_2$] (7.6,0.6) node[right,font=\scriptsize] {$Z_{02}$};
    \draw (5,0.6) to[C,l_=$C$] (5,-0.6) node[ground]{};
    \draw (6.2,0.6) to[L,l=$L_3$] (6.2,-0.9) node[below,font=\scriptsize] {$Z_{03}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Discontinuity | Equivalent circuit | Where you meet it (binder pp. 96–97) |
|---|---|---|
| Open end | Shunt $C_f$ = extra length $\Delta\ell$ | Open stubs, coupled-line filters |
| Gap | Π: series $C_g$, shunt $C_p$ each side | Coupling to resonators, DC blocks |
| Step in width | T: series $L$, shunt $C$, series $L$ | Stepped-impedance transformers and filters |
| Right-angle bend | Excess shunt $C$ + series $L$ | Any layout |
| T-junction | Series $L$ per arm + shunt $C$ | Stubs, branch-line couplers |
| Cross junction | Reactive 4-port | Low-impedance (paired) stubs |
| Coax-to-microstrip | Π: $C_1$, $L$, $C_2$ (or a measured [S] black box) | Every board edge |

$$
\boxed{\text{Open end: }\ \Delta\ell=C_fZ_0v_p=\frac{C_fZ_0c}{\sqrt{\epsilon_e}},\qquad \Delta\ell\approx0.412d\,\frac{\epsilon_e+0.3}{\epsilon_e-0.258}\,\frac{W/d+0.262}{W/d+0.813}\ \text{(Hammerstad)}}
$$

**Compensation** (Pozar p. 209):
1. **Open stubs:** cut them shorter by $\Delta\ell$.
2. **Bends:** remove the excess corner capacitance. A swept bend with $r\ge3W$ works but costs area; a **mitered** bend with $a\approx1.8W$ (optimum depends on $Z_0$ and angle) is the usual fix.
3. **Steps and T-junctions:** miter them too (chamfered taper, notch in the T).
4. Otherwise: model the discontinuity (by EM simulation or measurement) and absorb it by retuning line lengths, impedances or stubs.

```tikz title="Bend compensation: a right-angle bend has excess corner capacitance (red); a swept bend or a mitered corner removes it. After Pozar p. 210 and binder p. 101."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % right angle
  \fill[gray!50] (0,2) -- (2,2) -- (2,0) -- (1.5,0) -- (1.5,1.5) -- (0,1.5) -- cycle;
  \draw[<->] (-0.2,1.5) -- node[left,font=\scriptsize] {$W$} (-0.2,2);
  \fill[red!60] (1.5,1.5) rectangle (2,2);
  \node[font=\scriptsize,align=center] at (1,-0.5) {right angle:\\ excess $C$ at corner};
  % swept
  \begin{scope}[xshift=3.6cm]
    \fill[gray!50] (0,2) -- (0.5,2) arc (90:0:1.5) -- (1.5,0.5) arc (0:90:1.0) -- (0,1.5) -- cycle;
    \draw[->] (0.5,0.5) -- node[below left,font=\scriptsize,pos=0.6] {$r$} ({0.5+1.25*cos(45)},{0.5+1.25*sin(45)});
    \node[font=\scriptsize,align=center] at (1,-0.5) {swept: $r\ge 3W$\\ (costs area)};
  \end{scope}
  % mitered
  \begin{scope}[xshift=7.2cm]
    \fill[gray!50] (0,2) -- (1.15,2) -- (2,1.15) -- (2,0) -- (1.5,0) -- (1.5,1.5) -- (0,1.5) -- cycle;
    \draw[<->] (1.15,2.2) -- node[above right,font=\scriptsize] {$a$} (2.2,1.15);
    \node[font=\scriptsize,align=center] at (1,-0.5) {mitered: $a\approx1.8W$\\ removes excess $C$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!example]- Example: open-end extension on a 50 Ω line (Pozar Prob. 4.30)
> $d=0.158$ cm, $\epsilon_r=2.2$, $W=0.487$ cm, $\epsilon_e=1.894$, $C_f=0.075$ pF. Equate $j\omega C_f$ with a short open stub $jY_0\tan\beta\Delta\ell\approx jY_0\beta\Delta\ell$:
> $\Delta\ell=\frac{(0.075\text{ pF})(50)(3\times10^8)}{\sqrt{1.894}}=0.082$ cm. Hammerstad gives 0.075 cm. Full solution: [[Exam Prep - Problems through Stability#4.30 ★ Open‑end discontinuity → length extension|4.30]].

> [!tip] Remark
> The lumped chips at the ends of these lines have their own parasitics (a capacitor's ESL makes it inductive above self-resonance, an inductor's winding $C$ makes it capacitive): those models live in [[Capacitor]], [[Inductor]] and [[Resistor]]. Waveguide discontinuities (irises, steps) and their modal analysis are network problems for [[Microwave Network Analysis]].

### Coupled Lines and Differential Pairs

Two lines close together support two modes: **even** (both driven equal, common mode) and **odd** (equal and opposite, differential). Each mode has its own impedance.

$$
\boxed{Z_{even}=\sqrt{\frac{L+M}{C_c}},\qquad Z_{odd}=\sqrt{\frac{L-M}{C_c+2C_d}},\qquad Z_{DIFF}=2Z_{odd},\qquad Z_{CM}=\frac{Z_{even}}{2}}
$$

($L$ self and $M$ mutual inductance per meter, $C_c$ each line to ground, $C_d$ line to line; Palermo L2 slide 45.)

- In odd mode a virtual ground plane sits midway between the conductors; it gives the differential signal a continuous return path.
- Coupling ($M$, $C_d$) pushes $Z_{odd}$ down and $Z_{even}$ up. Uncoupled lines have $Z_{odd}=Z_{even}=Z_0$.
- To terminate both modes at once:

```tikz title="Terminating a coupled (differential) pair for both even and odd modes: Pi network (left) and T network (right). After Palermo ECE 720 L2 slides 46-47."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % Pi termination
  \draw (0,2) node[left] {line $+$} -- (3,2);
  \draw (0,0.6) node[left] {line $-$} -- (3,0.6);
  \draw (1.2,2) to[R,l_=$R_2$] (1.2,0.6);
  \draw (2.6,2) -- (3.4,2) to[R,l=$R_1$] (3.4,-0.4) node[ground]{};
  \draw (2.6,0.6) -- (2.6,0.2) to[R,l_=$R_1$] (2.6,-0.4) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.8,-1.4) {$\Pi$: $Z_{even}=R_1$,\\ $Z_{odd}=R_1\parallel\frac{R_2}{2}$};
  % T termination
  \begin{scope}[xshift=7cm]
    \draw (0,2) node[left] {line $+$} to[R,l=$R_2$] (2.2,2) -- (2.6,2) -- (2.6,1.3);
    \draw (0,0.6) node[left] {line $-$} to[R,l_=$R_2$] (2.2,0.6) -- (2.6,0.6) -- (2.6,1.3);
    \draw (2.6,1.3) node[circ]{} -- (3.4,1.3) to[R,l=$R_1$] (3.4,-0.4) node[ground]{};
    \node[font=\scriptsize,align=center] at (1.6,-1.4) {T: $Z_{odd}=R_2$,\\ $Z_{even}=R_2+2R_1$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Pi:\ R_1=Z_{even},\quad R_2=\frac{2Z_{odd}Z_{even}}{Z_{even}-Z_{odd}}\qquad\qquad T:\ R_2=Z_{odd},\quad R_1=\frac{Z_{even}-Z_{odd}}{2}}
$$

> [!tip] Remark
> The same even/odd decomposition designs coupled-line directional couplers and filters; in an inhomogeneous line (microstrip) the two modes also travel at different speeds (binder p. 369). Those designs are in [[Power Dividers and Couplers]] and [[Microwave Filters]]. Differential signaling in links (and why it costs 1.3–1.8× the pins rather than 2×) is in [[Channels]].

### Waveguides and Other Lines

- **Coplanar waveguide (CPW):** signal strip between two coplanar grounds on one side of the substrate. Grounds sit right next to the signal, so shunt devices need no vias; useful for active circuits. Supports even and odd quasi-TEM modes (Pozar p. 159). Pozar gives no design formulas; use CAD.
- **Slotline:** a slot in a ground plane, quasi-TEM, $Z_0$ set by the slot width. **Covered microstrip:** a shielding lid several substrate heights above; it perturbs $Z_0$ and must be included.

> [!note]- Detail: hollow rectangular waveguide in one fold (Pozar §3.3, §3.10)
> One conductor, so no TEM mode; TE$_{mn}$/TM$_{mn}$ modes with cutoff $f_{c,mn}=\frac{1}{2\pi\sqrt{\mu\epsilon}}\sqrt{(m\pi/a)^2+(n\pi/b)^2}$. The dominant mode ($a>b$) is TE$_{10}$:
> $$f_{c10}=\frac{c}{2a\sqrt{\epsilon_r}},\qquad \beta=\sqrt{k^2-k_c^2},\qquad Z_{TE}=\frac{k\eta}{\beta},\qquad \alpha_d=\frac{k^2\tan\delta}{2\beta}$$
> - Below $f_c$ the mode is evanescent; above it, $v_g=c\beta/k_0<c<v_p$ (dispersive).
> - Single-mode bandwidth is under an octave, because TE$_{20}$ starts at $2f_{c10}$. A ridge waveguide lowers $f_{c10}$ to widen it, at the cost of power capacity.
> - Lowest loss and highest power of all the lines (air-filled breakdown $P_{max}=abE_d^2/4Z_w$), but large and hard to integrate.
> - The coax TE$_{11}$ limit above and the microstrip surface-wave limits are the same physics: a second mode appears once some dimension reaches about half a wavelength.

## How Lines Are Measured

- **Open/short:** $Z_0=\sqrt{Z_{oc}Z_{sc}}$, $\tanh\gamma\ell=\sqrt{Z_{sc}/Z_{oc}}$ gives loss and electrical length too ([[Exam Prep - Problems through Stability#2.13 📝PS1 Z₀ from open/short measurements|Pozar 2.13]]).
- **Slotted line (classic):** the spacing of minima gives $\lambda/2$, $V_{max}/V_{min}$ gives SWR and $|\Gamma|$, and the position of the first minimum gives the phase of $\Gamma_L$ (at a minimum $\Gamma$'s phase is $\pi$). Example: minima 2.1 cm apart, first minimum 0.9 cm from the load, SWR 2.5 on 50 Ω gives $Z_L=99-j46\ \Omega$ ([[Exam Prep - Problems through Stability#2.23 ★ Slotted‑line measurement (Pozar Ex 2.4 style)|2.23]]). The Smith-chart version is in [[Smith Chart and Impedance Matching]].
- **VNA:** measures $S_{11}$ ($=\Gamma$) and $S_{21}$ directly; calibration moves the reference plane to the line ends ([[Microwave Network Analysis]]). Return loss is $-20\log|S_{11}|$, insertion loss $-20\log|S_{21}|$.
- **TDR:** the bounce diagram measured at the input, giving $Z$ versus position ([[Channels]]).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ strip width $W$ (fixed $d$) | Lower $Z_0$, less conductor loss, $\epsilon_e\to\epsilon_r$ | Area; transverse-resonance limit $f_{T3}$ drops |
| ↓ substrate thickness $d$ (same $Z_0$) | Narrower lines, higher surface-wave and parallel-plate limits, less dispersion, less radiation at discontinuities | Narrower $W$ → more conductor loss, tighter etch tolerance |
| ↑ $\epsilon_r$ | Shorter $\lambda_g$ (smaller circuits), field better confined | More dispersion, lower surface-wave thresholds, often higher $\tan\delta$ |
| Low-$\tan\delta$ substrate | Less $\alpha_d$, higher resonator $Q$ | Cost, softer materials |
| High $Z_0$ (narrow) section | Good series inductor, high-impedance bias line | Loss, low current capacity |
| Low $Z_0$ (wide) section | Good shunt capacitor | Area, transverse resonance |
| Coax: larger diameter (same $b/a$) | Power, lower loss | Lower $f_{max}$ (TE$_{11}$) |
| 50 Ω vs 77 Ω vs 30 Ω coax | 77 Ω min loss, 30 Ω max power | 50 Ω splits the difference |
| Mitered / swept bends | Removes corner $C$, better match | Swept costs area; miter is a fitted value |
| Double termination | No reflections at either end | Half the signal swing |
| Conjugate match | Maximum delivered power | Standing wave may remain; efficiency ≤ 50% with $Z_g=Z_0$ |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Telegrapher (phasor) | $dV/dz=-(R+j\omega L)I$, $dI/dz=-(G+j\omega C)V$ |
| Propagation constant | $\gamma=\alpha+j\beta=\sqrt{(R+j\omega L)(G+j\omega C)}$ |
| Characteristic impedance | $Z_0=\sqrt{(R+j\omega L)/(G+j\omega C)}$; lossless $\sqrt{L/C}$ |
| Lossless line | $\beta=\omega\sqrt{LC}$, $v_p=1/\sqrt{LC}$, $\lambda=2\pi/\beta$ |
| Field-defined RLGC | $L=\frac{\mu}{|I|^2}\int|H|^2$, $C=\frac{\epsilon'}{|V|^2}\int|E|^2$, $R=\frac{R_s}{|I|^2}\oint|H|^2$, $G=\frac{\omega\epsilon''}{|V|^2}\int|E|^2$ |
| Reflection coefficient | $\Gamma_L=(Z_L-Z_0)/(Z_L+Z_0)$, $\Gamma(\ell)=\Gamma_Le^{-2j\beta\ell}$ |
| Junction | $T=1+\Gamma=2Z_1/(Z_1+Z_0)$, $IL=-20\log|T|$ |
| Standing wave | $V_{max,min}=|V_0^+|(1\pm|\Gamma|)$, max spacing $\lambda/2$, max-to-min $\lambda/4$ |
| SWR, RL | $\text{SWR}=\frac{1+|\Gamma|}{1-|\Gamma|}$, $RL=-20\log|\Gamma|$ |
| Input impedance | $Z_{in}=Z_0\frac{Z_L+jZ_0\tan\beta\ell}{Z_0+jZ_L\tan\beta\ell}$ |
| Stubs | short $jZ_0\tan\beta\ell$, open $-jZ_0\cot\beta\ell$ |
| Special lengths | $\lambda/2$: $Z_L$; $\lambda/4$: $Z_0^2/Z_L$ |
| $Z_0$ from measurement | $Z_0=\sqrt{Z_{oc}Z_{sc}}$ |
| Load power | $P_L=\frac{|V_0^+|^2}{2Z_0}(1-|\Gamma|^2)$ |
| General source | $P_L=\frac12|V_g|^2\frac{R_{in}}{(R_{in}+R_g)^2+(X_{in}+X_g)^2}$ |
| Conjugate match | $Z_{in}=Z_g^*$, $P_{avs}=|V_g|^2/8R_g$ |
| Low-loss line | $\alpha\approx\frac12(R/Z_0+GZ_0)$ |
| Lossy line | $Z_{in}=Z_0\frac{Z_L+Z_0\tanh\gamma\ell}{Z_0+Z_L\tanh\gamma\ell}$, $\Gamma(\ell)=\Gamma_Le^{-2\gamma\ell}$ |
| TEM dielectric loss | $\alpha_d=k\tan\delta/2$; 1 Np = 8.686 dB |
| Perturbation / Wheeler | $\alpha=P_\ell/2P_0$; $\alpha_c=\frac{R_s}{2Z_0\eta}\frac{dZ_0}{d\ell}$ |
| Roughness | $\alpha_c'=\alpha_c[1+\frac2\pi\tan^{-1}(1.4(\Delta/\delta_s)^2)]$ |
| Group velocity | $v_g=(d\beta/d\omega)^{-1}$ |
| Distortionless | $R/L=G/C$, $\alpha=R\sqrt{C/L}$ |
| Transient | $v^+=V_0Z_0/(R_g+Z_0)$, $V_\infty=V_0R_L/(R_g+R_L)$ |
| Coax | $Z_0=\frac{60}{\sqrt{\epsilon_r}}\ln\frac ba$, $\alpha_c=\frac{R_s}{2\eta\ln(b/a)}(\frac1a+\frac1b)$ |
| Coax TE$_{11}$ | $k_c\approx2/(a+b)$, $f_c=ck_c/(2\pi\sqrt{\epsilon_r})$ |
| Stripline | $Z_0=\frac{30\pi}{\sqrt{\epsilon_r}}\frac{b}{W_e+0.441b}$ |
| Microstrip $\epsilon_e$ | $\frac{\epsilon_r+1}{2}+\frac{\epsilon_r-1}{2}(1+12d/W)^{-1/2}$ |
| Microstrip $v_p$, $\lambda_g$ | $c/\sqrt{\epsilon_e}$, $\lambda_0/\sqrt{\epsilon_e}$ |
| Microstrip $Z_0$ | $\frac{60}{\sqrt{\epsilon_e}}\ln(\frac{8d}{W}+\frac{W}{4d})$ ($W/d\le1$); $\frac{120\pi}{\sqrt{\epsilon_e}[W/d+1.393+0.667\ln(W/d+1.444)]}$ ($W/d\ge1$) |
| Microstrip synthesis | $W/d=\frac{8e^A}{e^{2A}-2}$ ($<2$), else the $B$ form |
| Microstrip losses | $\alpha_d=\frac{k_0\epsilon_r(\epsilon_e-1)\tan\delta}{2\sqrt{\epsilon_e}(\epsilon_r-1)}$, $\alpha_c\approx\frac{R_s}{Z_0W}$ |
| Microstrip dispersion | $\epsilon_e(f)=\epsilon_r-\frac{\epsilon_r-\epsilon_e(0)}{1+G(f/f_p)^2}$, $G=0.6+0.009Z_0$, $f_p=\frac{Z_0}{8\pi d}$ |
| Dispersion threshold | $f_0(\text{GHz})=0.3\sqrt{Z_0/(h_{cm}\sqrt{\epsilon_r-1})}$ |
| Surface-wave limits | $f_{T1}\simeq\frac{c}{2\pi d}\sqrt{\frac{2}{\epsilon_r-1}}\tan^{-1}\epsilon_r$, $f_{T2}\simeq\frac{c}{4d\sqrt{\epsilon_r-1}}$ |
| Open-end extension | $\Delta\ell=C_fZ_0c/\sqrt{\epsilon_e}$ |
| Coupled lines | $Z_{even}=\sqrt{(L+M)/C_c}$, $Z_{odd}=\sqrt{(L-M)/(C_c+2C_d)}$, $Z_{DIFF}=2Z_{odd}$ |
| Π / T termination | Π: $R_1=Z_{even}$, $R_2=\frac{2Z_{odd}Z_{even}}{Z_{even}-Z_{odd}}$; T: $R_2=Z_{odd}$, $R_1=\frac{Z_{even}-Z_{odd}}{2}$ |
| Rectangular waveguide | $f_{c10}=c/(2a\sqrt{\epsilon_r})$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20)
  - Ch. 2 Transmission Line Theory: §2.1 lumped model, pp. 48–51; §2.2 field analysis, Table 2.1, Ex. 2.1, pp. 51–56; §2.3 terminated lossless line, special cases, junctions, dB/Np, pp. 56–63; §2.6 generator and load mismatches, pp. 76–78; §2.7 lossy lines (low-loss, distortionless, terminated lossy, perturbation, Wheeler, roughness), Ex. 2.6–2.8, pp. 78–85; §2.8 transients and bounce diagrams, Ex. 2.9, pp. 85–89. Problems 2.1–2.18, 2.27. §2.4 (Smith chart) and §2.5 (quarter-wave transformer) deliberately left to [[Smith Chart and Impedance Matching]].
  - Ch. 3 Transmission Lines and Waveguides: §3.1 TEM/TE/TM and Eq. 3.30, pp. 96–103; §3.3 rectangular waveguide cutoff, p. 113; §3.5 coaxial line, higher-order modes, Ex. 3.3, connectors, pp. 130–135; §3.7 stripline, Ex. 3.5–3.6, pp. 141–147; §3.8 microstrip (formulas, Ex. 3.7, dispersion, higher-order modes, Ex. 3.8), pp. 147–153; §3.10 group velocity, Ex. 3.9, pp. 154–157; §3.11 comparison table, other lines, power capacity, pp. 157–160. Problems 3.20, 3.21.
  - Ch. 4: §4.6 microstrip discontinuities (Fig. 4.23) and the discontinuity-compensation Point of Interest, pp. 203–210; Problem 4.30 (open-end extension, Hammerstad formula), p. 226.
- **ECE 373 (Waterloo, Boumaiza) lecture binder** (PDF pages; slide numbers are PDF − 9 in the TL deck): pp. 11–20 lumped model, telegrapher equations, $\gamma$, $Z_0$ (sign typo on p. 18); pp. 21–33 terminated line, $\Gamma$, short/open, junction, power flow, return loss, VSWR, $Z_{in}$; pp. 34–41 generator mismatch, three matching cases; pp. 42–46 circuit-model limits, line taxonomy, comparison table, coax RLGC; pp. 47–53 microstrip ($\epsilon_e$ with the 0.04 term, $Z_0$, $\lambda$ fits, synthesis, $W_{eff}$, dispersion and $f_0$, uses of microstrip); pp. 89–101 lumped elements and microstrip discontinuities, effects, coax-to-microstrip transition, mitering.
- **Palermo, ECE 720 Lecture 2 (Channels)**, `ref/SerDes/lecture2_ee720_channels.pdf`: slides 34–42 (reflections, termination examples, lattice diagram, reflection patterns, termination schemes), 43–47 (differential signaling, odd/even modes, balanced-line impedances, Π and T termination).
- **Worked problems:** [[Exam Prep - Problems through Stability]] §P (midterm 2018 P1, Pozar 2.19, 2.25), §1 (Pozar 2.1–2.27, generator mismatch), §2 (Pozar 3.20, 3.21, 4.30, RO4350B design, discontinuities).
