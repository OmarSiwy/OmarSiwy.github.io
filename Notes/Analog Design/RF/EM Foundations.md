---
title: EM Foundations
description: The field physics under every RF note (Maxwell, plane waves, boundary conditions, skin depth, surface resistance, Poynting power, reflection, reciprocity, images), each ending in what it means for a circuit designer.
kind: topic
status: growing
aliases:
  - EM Foundations
  - Electromagnetic Theory
---

This is the shared physics note for the RF track. Every later RF note ([[Transmission Lines]], [[Microwave Network Analysis]], [[Smith Chart and Impedance Matching]], [[Microwave Resonators]], ...) gives a short version of its physics and links back here. Here the physics *is* the content, but every section ends with a **designer takeaway**: what the field result changes on a schematic or a board. As in [[MosFETs]], each section opens the box one level further; stop anywhere and you still have a correct, coarser picture.

## The big picture

```tikz title="The chain from Maxwell to circuit numbers. Each arrow is one section below; the bottom row is what an RF designer actually uses. After Pozar Ch. 1."
\usepackage{circuitikz}
\usetikzlibrary{positioning}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  box/.style={draw,rounded corners,align=center,minimum width=3.3cm,minimum height=1.25cm,fill=blue!6}]
  \node[box] (M) at (0,0) {Maxwell (phasor)\\[1pt] $\nabla\times\bar E=-j\omega\mu\bar H$\\ $\nabla\times\bar H=j\omega\epsilon\bar E+\bar J$};
  \node[box] (W) at (5.4,0) {Plane wave\\[1pt] $k=\omega\sqrt{\mu\epsilon}$, $\eta=\sqrt{\mu/\epsilon}$};
  \node[box] (B) at (10.8,0) {Interface\\[1pt] $E_t,H_t$ continuous\\ $\Gamma=\dfrac{\eta_2-\eta_1}{\eta_2+\eta_1}$};
  \node[box] (C) at (10.8,-2.8) {Good conductor\\[1pt] $\delta_s=1/\sqrt{\pi f\mu\sigma}$\\ $R_s=1/(\sigma\delta_s)\propto\sqrt f$};
  \node[box] (P) at (5.4,-2.8) {Power\\[1pt] $P=\tfrac12\mathrm{Re}\oint\bar E\times\bar H^*\cdot d\bar s$\\ $P_{loss}=\tfrac{R_s}{2}\int|\bar J_s|^2ds$};
  \node[box,fill=green!8] (T) at (0,-2.8) {Circuit numbers\\[1pt] $Z_0$, $\Gamma$, $v_p$, $\lambda$\\ $R'$, $G'$, $\alpha_c$, $\alpha_d$, $Q$};
  \draw[->,thick] (M) -- node[above,font=\scriptsize]{source-free} (W);
  \draw[->,thick] (W) -- node[above,font=\scriptsize]{two media} (B);
  \draw[->,thick] (B) -- node[right,font=\scriptsize]{$\sigma\gg\omega\epsilon$} (C);
  \draw[->,thick] (C) -- node[above,font=\scriptsize,align=center]{surface\\ impedance} (P);
  \draw[->,thick] (P) -- node[above,font=\scriptsize,align=center]{per unit\\ length} (T);
\end{circuitikz}
\end{document}
```

> [!important] The six results every RF note leans on
> 1. **Phasors:** with $e^{j\omega t}$, $\partial/\partial t\to j\omega$; time-average power is $\tfrac12\mathrm{Re}\{\cdot\}$ of a phasor product.
> 2. **A wave in a dielectric** ($\mu_r=1$) is slower and shorter by $\sqrt{\epsilon_r}$: $v_p=c/\sqrt{\epsilon_r}$, $\lambda=\lambda_0/\sqrt{\epsilon_r}$, and its impedance drops to $\eta=\eta_0/\sqrt{\epsilon_r}$, $\eta_0\approx377\ \Omega$.
> 3. **Boundaries:** tangential $E$ and $H$ are continuous; on a good metal $E_t=0$ and the surface current is $\bar J_s=\hat n\times\bar H$.
> 4. **Reflection** of a normally incident wave is $\Gamma=(\eta-\eta_0)/(\eta+\eta_0)$: the transmission-line formula with $\eta$ in place of $Z$.
> 5. **Metals:** current lives in a skin $\delta_s=1/\sqrt{\pi f\mu\sigma}$ (copper: 2.1 µm at 1 GHz), so loss per square is $R_s=1/(\sigma\delta_s)\propto\sqrt f$.
> 6. **Dielectrics:** loss is $\epsilon=\epsilon'(1-j\tan\delta)$, and a low-loss wave decays as $\alpha_d\approx\tfrac12k\tan\delta\propto f$.

**Map:** [[#Level 0 Lumped vs Distributed|why fields at all]] → [[#Level 1 Maxwell's Equations|Maxwell, media, loss tangent]] → [[#Boundary Conditions|boundary conditions]] → [[#Level 2 Plane Waves|plane waves, $\eta$, polarization]] → [[#Level 3 Lossy Media and Skin Depth|lossy media, skin depth]] → [[#Level 4 Energy and Power|Poynting, surface resistance]] → [[#Level 5 Reflection from an Interface|reflection, surface impedance]] → [[#Oblique Incidence|oblique incidence, surface waves]] → [[#Level 6 Useful Theorems|reciprocity, images]].

## Level 0: Lumped vs Distributed

```tikz title="The same pair of wires at two frequencies. Left: lambda much longer than the wire, so V is the same everywhere (lumped). Right: lambda comparable to the wire, so V depends on position (distributed). After ECE 373 binder p. 11 and Pozar Sec. 1.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[thick] (0,0.3) -- (4.5,0.3);
    \draw[thick] (0,-0.3) -- (4.5,-0.3);
    \draw[blue,thick,domain=0:4.5,samples=40] plot (\x,{1.3+0.5*cos(8*\x)});
    \draw[<->] (0,-0.8) -- node[below,font=\scriptsize]{$\ell\ll\lambda$} (4.5,-0.8);
    \node[font=\scriptsize,align=center] at (2.25,2.25) {low $f$: phase barely changes\\ along $\ell$ $\Rightarrow$ KVL/KCL hold};
  \end{scope}
  \begin{scope}[xshift=6.2cm]
    \draw[thick] (0,0.3) -- (4.5,0.3);
    \draw[thick] (0,-0.3) -- (4.5,-0.3);
    \draw[blue,thick,domain=0:4.5,samples=80] plot (\x,{1.3+0.5*cos(160*\x)});
    \draw[<->] (0,-0.8) -- node[below,font=\scriptsize]{$\ell\sim\lambda$} (4.5,-0.8);
    \node[font=\scriptsize,align=center] at (2.25,2.25) {high $f$: $V$ and $I$ vary\\ with position $\Rightarrow$ use fields/lines};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\lambda=\frac{c}{f\sqrt{\epsilon_r}},\qquad \text{phase across a part of length }\ell:\ \beta\ell=\frac{2\pi\ell}{\lambda}}
$$

- RF is roughly 100 MHz to 1000 GHz; **microwave** is 3–300 GHz ($\lambda_0$ = 10 cm to 1 mm); millimeter waves have mm wavelengths (Pozar p. 1).
- Circuit theory is the special case of Maxwell where the part is electrically small. Once $\ell$ is a sizeable fraction of $\lambda$, a part is a **distributed** element and you need [[Transmission Lines]].
- Pozar's goal for the whole book: solve the fields once, then reduce them to circuit quantities (V, I, Z, Γ, S-parameters) because those are what you design with.

> [!note]- Detail: common band names and allocations (Pozar Fig. 1.1)
> | Band | Range | | Service | Frequency |
> |---|---|---|---|---|
> | VHF | 30–300 MHz | | FM broadcast | 88–108 MHz |
> | UHF | 300 MHz–3 GHz | | GPS | 1575.42, 1227.60 MHz |
> | L | 1–2 GHz | | Microwave ovens | 2.45 GHz |
> | S | 2–4 GHz | | US ISM | 902–928 MHz, 2.400–2.484 GHz, 5.725–5.850 GHz |
> | C | 4–8 GHz | | US UWB | 3.1–10.6 GHz |
> | X | 8–12 GHz | | US DBS | 11.7–12.5 GHz |
> | Ku / K / Ka | 12–18 / 18–26 / 26–40 GHz | | | |
> | V / W | 50–75 / 75–110 GHz | | | |
>
> Why go up in frequency (Pozar p. 3): antenna gain grows with electrical size, and a fixed fractional bandwidth is more Hz (1% of 600 MHz is 6 MHz, 1% of 60 GHz is 600 MHz).

> [!success] Designer takeaway
> Before treating anything as a lumped part, compute $\lambda$ **in its dielectric**. The ECE 373 project board is RO4350B, $\epsilon_r=3.48$ (binder p. 9): at 2.5 GHz, $\lambda_0=120$ mm becomes $120/\sqrt{3.48}\approx64$ mm for a wave fully inside the substrate. A microstrip sees a slightly longer $\lambda$ because part of its field is in air ([[#Boundary Conditions]]).

## Level 1: Maxwell's Equations

### Maxwell's Equations

$$
\boxed{\nabla\times\bar E=-j\omega\mu\bar H-\bar M,\qquad \nabla\times\bar H=j\omega\epsilon\bar E+\bar J,\qquad \nabla\cdot\bar D=\rho,\qquad \nabla\cdot\bar B=0}
$$

$$
\boxed{\bar{\mathcal E}(x,y,z,t)=\mathrm{Re}\{\bar E(x,y,z)e^{j\omega t}\},\qquad \overline{|\mathcal E|^2}=\tfrac12|\bar E|^2,\quad |\bar E|_{rms}=|\bar E|/\sqrt2}
$$

- Phasor form (Pozar Eq. 1.27) for linear media: $\bar D=\epsilon\bar E$, $\bar B=\mu\bar H$, with $\epsilon,\mu$ allowed to be complex. Free space: $\mu_0=4\pi\times10^{-7}$ H/m, $\epsilon_0=8.854\times10^{-12}$ F/m.
- $\bar M$ is a *fictitious* magnetic current. No magnetic charge exists; it is a bookkeeping tool for apertures and slots (Pozar Ch. 4).
- Integral forms are the circuit laws in disguise: Faraday $\oint\bar E\cdot d\bar l=-j\omega\int\bar B\cdot d\bar s$ is KVL plus an inductive term; the continuity equation $\nabla\cdot\bar J=-j\omega\rho$ is KCL plus a capacitive term.

> [!note]- Detail: the time-domain set, the integral forms, and why displacement current must exist (Pozar §1.2, pp. 6–10)
> Time domain: $\nabla\times\bar{\mathcal E}=-\partial\bar{\mathcal B}/\partial t-\bar{\mathcal M}$, $\nabla\times\bar{\mathcal H}=\partial\bar{\mathcal D}/\partial t+\bar{\mathcal J}$, $\nabla\cdot\bar{\mathcal D}=\rho$, $\nabla\cdot\bar{\mathcal B}=0$.
>
> The four are not independent. Taking the divergence of the curl-$H$ equation (div of a curl is zero) gives $\nabla\cdot\bar{\mathcal J}+\partial\rho/\partial t=0$: charge is conserved. Without the $\partial\bar{\mathcal D}/\partial t$ term this would force $\nabla\cdot\bar{\mathcal J}=0$ always, which is false for a charging capacitor. That is the argument that led Maxwell to displacement current, and hence to waves.
>
> Integral forms (divergence and Stokes theorems):
> $$\oint_S\bar D\cdot d\bar s=Q,\quad \oint_S\bar B\cdot d\bar s=0,\quad \oint_C\bar E\cdot d\bar l=-j\omega\int_S\bar B\cdot d\bar s-\int_S\bar M\cdot d\bar s,\quad \oint_C\bar H\cdot d\bar l=j\omega\int_S\bar D\cdot d\bar s+I$$
>
> Sources of zero thickness are written with delta functions (Pozar Fig. 1.4): a surface current $\bar J=\bar J_s\,\delta(z-z_0)$ (A/m), a line current $\hat xI_0\,\delta(y-y_0)\delta(z-z_0)$, an infinitesimal dipole $\hat x\,Il\,\delta(x-x_0)\delta(y-y_0)\delta(z-z_0)$. The Fourier transform turns any single-frequency solution into an arbitrary-time-dependence one.

> [!success] Designer takeaway
> KVL is Faraday's law with the enclosed flux set to zero. At RF the flux through a signal loop is not zero, so every loop has an inductance $L=\Phi/I$ and a voltage $j\omega LI$ around it. Small loops (signal and return close together) are what keep the lumped approximation honest. The same law is the ground-bounce and ground-loop story in [[Packaging]].

### Fields in Media: Permittivity and Loss Tangent

$$
\boxed{\epsilon=\epsilon'-j\epsilon''=\epsilon_0\epsilon_r(1-j\tan\delta),\qquad \tan\delta=\frac{\omega\epsilon''+\sigma}{\omega\epsilon'}}
$$

$$
\nabla\times\bar H=j\omega\epsilon'\bar E+(\omega\epsilon''+\sigma)\bar E
$$

- A dielectric's dipoles lag the field; the lag is the imaginary part $\epsilon''$ and it turns into heat. Energy conservation forces $\epsilon''>0$.
- Damping loss ($\omega\epsilon''$) and conduction loss ($\sigma$) enter Maxwell identically: one **effective conductivity** $\omega\epsilon''+\sigma$. Datasheets quote the sum as $\tan\delta$ at a stated frequency.
- Solve the lossless problem first, then add loss by replacing $\epsilon\to\epsilon'(1-j\tan\delta)$. Same trick for magnetic loss: $\mu=\mu'-j\mu''$ (no magnetic conductivity exists).

> [!tip] Remark
> This effective conductivity becomes the shunt $G$ of the RLGC line model (binder p. 12: "G: dielectric loss"); for any line in a uniform dielectric $G/C=\omega\tan\delta$. See [[Transmission Lines]].

> [!note]- Detail: polarization, susceptibility, and anisotropic (tensor) media (Pozar §1.3, pp. 10–12)
> An applied field induces dipole moments, adding a polarization $\bar P_e=\epsilon_0\chi_e\bar E$ to the flux: $\bar D=\epsilon_0\bar E+\bar P_e=\epsilon_0(1+\chi_e)\bar E=\epsilon\bar E$. Magnetically, $\bar B=\mu_0(\bar H+\bar P_m)=\mu_0(1+\chi_m)\bar H=\mu\bar H$.
>
> In **anisotropic** media one component of $\bar E$ creates all three components of $\bar D$: $\bar D=[\epsilon]\bar E$ with a 3×3 tensor. Crystals and ionized gases are anisotropic dielectrics; **ferrites** are the anisotropic magnetic materials of microwave engineering (Pozar Ch. 9), and they are what make circulators and isolators nonreciprocal ([[#Reciprocity]]).
>
> $\bar D=\epsilon\bar E$ generally cannot be written in the time domain even for linear media, because $\bar D$ can lag $\bar E$. The complex phasor $\epsilon$ carries that phase shift.

> [!success] Designer takeaway
> For a substrate you need exactly two numbers: $\epsilon_r$ (sets size and $Z_0$) and $\tan\delta$ (sets dielectric loss), both at your frequency. ECE 373's RO4350B: $\epsilon_r=3.48\pm0.05$, $\tan\delta=0.0031$ at 2.5 GHz, 60 mil thick, 1 oz (34 µm) copper (binder p. 9). The $\pm0.05$ tolerance on $\epsilon_r$ moves every electrical length by about $\pm0.7\%$.

### Boundary Conditions

```tikz title="Left: the pillbox (height h -> 0) gives the normal-component conditions. Right: the thin contour gives the tangential ones. After Pozar Figs. 1.5-1.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!12] (-0.5,-1.6) rectangle (11.5,0);
  \draw[thick] (-0.5,0) -- (11.5,0);
  \node[font=\scriptsize,anchor=west] at (-0.4,1.4) {medium 2: $\epsilon_2,\mu_2$};
  \node[font=\scriptsize,anchor=west] at (-0.4,-1.35) {medium 1: $\epsilon_1,\mu_1$};
  \draw[->] (5.4,0) -- (5.4,0.7) node[above,font=\scriptsize]{$\hat n$};
  % pillbox
  \draw[thick,blue] (1.6,-0.35) rectangle (3.4,0.35);
  \draw[->,blue] (2.5,0.35) -- (2.5,1.2) node[above,font=\scriptsize]{$D_{n2}$};
  \draw[->,blue] (2.5,-1.2) -- (2.5,-0.35);
  \node[below,font=\scriptsize,blue] at (2.5,-1.2) {$D_{n1}$};
  \node[font=\scriptsize,anchor=west] at (3.45,0.18) {$\rho_s$};
  % contour
  \draw[thick,red,->] (7.2,0.3) -- (9.6,0.3);
  \draw[thick,red,->] (9.6,0.3) -- (9.6,-0.3);
  \draw[thick,red,->] (9.6,-0.3) -- (7.2,-0.3);
  \draw[thick,red,->] (7.2,-0.3) -- (7.2,0.3);
  \node[above,font=\scriptsize,red] at (8.4,0.3) {$E_{t2},\,H_{t2}$};
  \node[below,font=\scriptsize,red] at (8.4,-0.3) {$E_{t1},\,H_{t1}$};
  \node[font=\scriptsize,anchor=south west] at (9.7,0.05) {$\bar J_s,\ \bar M_s$};
  \node[font=\scriptsize] at (2.5,-2.0) {$\hat n\cdot(\bar D_2-\bar D_1)=\rho_s$};
  \node[font=\scriptsize] at (8.4,-2.0) {$\hat n\times(\bar H_2-\bar H_1)=\bar J_s$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Dielectric interface:}\quad E_{t1}=E_{t2},\quad H_{t1}=H_{t2},\quad D_{n1}=D_{n2},\quad B_{n1}=B_{n2}}
$$

$$
\boxed{\text{Perfect conductor (electric wall):}\quad \hat n\times\bar E=0,\quad \hat n\cdot\bar B=0,\quad \hat n\cdot\bar D=\rho_s,\quad \bar J_s=\hat n\times\bar H}
$$

- **Electric wall** (metal): tangential $E$ shorted out, so $E$ meets metal at right angles; the tangential $H$ at the surface *is* the surface current.
- **Magnetic wall** (dual, $\hat n\times\bar H=0$): not a real material, but a useful idealization. Electric wall ↔ short-circuited line end, magnetic wall ↔ open-circuited line end.
- **Radiation condition:** far from all sources, fields either vanish or travel outward. Incoming waves from infinity are not allowed.
- Matching the four tangential components is enough; the normal conditions then follow automatically.

> [!note]- Derivation: the general interface conditions (Pozar Eqs. 1.29–1.37)
> Apply $\oint\bar D\cdot d\bar s=\int\rho\,dv$ to a pillbox of face area $\Delta S$ straddling the interface. As $h\to0$ the sidewall flux vanishes: $\Delta S\,D_{2n}-\Delta S\,D_{1n}=\Delta S\,\rho_s$, so $\hat n\cdot(\bar D_2-\bar D_1)=\rho_s$. Same for $\bar B$ with no magnetic charge: $\hat n\cdot\bar B_2=\hat n\cdot\bar B_1$.
>
> Apply Faraday to a thin rectangle of length $\Delta\ell$: the $j\omega\bar B$ flux vanishes as $h\to0$, but a surface current sheet $\bar M=\bar M_s\delta(h)$ survives: $(\bar E_2-\bar E_1)\times\hat n=\bar M_s$. Ampère the same way: $\hat n\times(\bar H_2-\bar H_1)=\bar J_s$.
>
> Why fields vanish inside a perfect conductor: a finite-$\sigma$ conductor has skin depth $\delta_s\to0$ as $\sigma\to\infty$ ([[#Skin Depth]]).
>
> Magnetic wall: $\hat n\cdot\bar D=0$, $\hat n\cdot\bar B=0$, $\hat n\times\bar E=-\bar M_s$, $\hat n\times\bar H=0$.

```tikz title="Why microstrip fringes: E must leave the metal at right angles, and at the air-dielectric surface only tangential E (and normal D) carry across, so the field spills into the air around the strip. After ECE 373 binder p. 47 (fringing figure)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!12] (0,0) rectangle (9,1.6);
  \draw (0,1.6) -- (9,1.6);
  \fill[gray!60] (0,-0.12) rectangle (9,0);
  \fill[gray!70] (3.7,1.6) rectangle (5.3,1.75);
  \node[font=\scriptsize] at (4.5,2.0) {strip};
  \node[font=\scriptsize,anchor=west] at (9.1,0.8) {substrate $\epsilon_r$};
  \node[font=\scriptsize,anchor=west] at (9.1,2.2) {air $\epsilon_0$};
  \node[font=\scriptsize,anchor=west] at (6.4,-0.35) {ground plane};
  \foreach \x in {3.9,4.3,4.7,5.1} { \draw[->,blue] (\x,1.6) -- (\x,0); }
  \draw[->,blue] (5.3,1.7) to[out=20,in=90] (6.6,1.6) to[out=-90,in=90] (6.9,0);
  \draw[->,blue] (5.3,1.75) to[out=50,in=90] (7.6,1.6) to[out=-90,in=90] (8.0,0);
  \draw[->,blue] (3.7,1.7) to[out=160,in=90] (2.4,1.6) to[out=-90,in=90] (2.1,0);
  \draw[->,blue] (3.7,1.75) to[out=130,in=90] (1.4,1.6) to[out=-90,in=90] (1.0,0);
  \node[font=\scriptsize,align=left,anchor=west] at (6.0,2.6) {field partly in air:\\ $1<\epsilon_{eff}<\epsilon_r$, quasi-TEM};
\end{circuitikz}
\end{document}
```

> [!success] Designer takeaway
> 1. **Microstrip fringes** because the field lines must end perpendicular on both metals and cross the air-dielectric surface obeying $E_t$, $D_n$ continuity. Some field lives in air, so the line sees an effective $\epsilon_{eff}$ between 1 and $\epsilon_r$, and the mode is only **quasi-TEM** (binder p. 47). Formulas for $\epsilon_{eff}$ and $Z_0$ are in [[Transmission Lines]].
> 2. $\bar J_s=\hat n\times\bar H$: the current on a conductor goes wherever the tangential $H$ is strongest. On a microstrip that is the underside of the strip, its edges, and the ground directly beneath. Cut that ground (a slot, a split plane) and the return current must detour.
> 3. A metal enclosure or shield sets $E_t=0$ on its walls, which is what makes cavities resonate ([[Microwave Resonators]]).

## Level 2: Plane Waves

### Plane Waves

```tikz title="A plane wave: E, H and the direction of travel are mutually perpendicular (TEM), in phase in a lossless medium, with |E|/|H| = eta. After Pozar Fig. 1.8 and Eqs. 1.45-1.49."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x={(1cm,0cm)},y={(0cm,1cm)},z={(-0.3cm,-0.4cm)}]
  \draw[->] (0,0,0) -- (9,0,0) node[right]{$z$ (travel, $\hat n$)};
  \draw[->] (0,0,0) -- (0,2.0,0) node[above]{$x$};
  \draw[->] (0,0,0) -- (0,0,2.4) node[below left]{$y$};
  \draw[blue,thick,domain=0:8.4,samples=80] plot (\x,{1.4*cos(90*\x)},0);
  \foreach \t in {0,0.5,...,8} { \draw[blue!60] (\t,0,0) -- (\t,{1.4*cos(90*\t)},0); }
  \draw[red,thick,domain=0:8.4,samples=80] plot (\x,0,{1.2*cos(90*\x)});
  \foreach \t in {0,0.5,...,8} { \draw[red!50] (\t,0,0) -- (\t,0,{1.2*cos(90*\t)}); }
  \node[blue,anchor=west] at (0.15,1.6,0) {$E_x$};
  \node[red,below] at (4,0,1.25) {$H_y=E_x/\eta$};
  \draw[<->] (2,2.0,0) -- node[above,font=\scriptsize]{$\lambda=2\pi/k$} (6,2.0,0);
\end{circuitikz}
\end{document}
```

$$
\boxed{\nabla^2\bar E+k^2\bar E=0,\qquad k=\omega\sqrt{\mu\epsilon}}
$$

$$
\boxed{E_x=E^+e^{-jkz}+E^-e^{jkz},\qquad H_y=\frac{1}{\eta}\left(E^+e^{-jkz}-E^-e^{jkz}\right)}
$$

$$
\boxed{v_p=\frac{\omega}{k}=\frac{1}{\sqrt{\mu\epsilon}}=\frac{c}{\sqrt{\mu_r\epsilon_r}},\qquad \lambda=\frac{2\pi}{k}=\frac{\lambda_0}{\sqrt{\mu_r\epsilon_r}},\qquad \eta=\sqrt{\frac{\mu}{\epsilon}}=\eta_0\sqrt{\frac{\mu_r}{\epsilon_r}},\quad \eta_0=377\ \Omega}
$$

- $e^{-jkz}$ travels toward $+z$, $e^{+jkz}$ toward $-z$. The minus sign on the backward $H$ is what makes power flow backward.
- $\eta$ is the **wave impedance** $E/H$; for a plane wave it equals the medium's **intrinsic impedance**.
- $c=1/\sqrt{\mu_0\epsilon_0}=2.998\times10^8$ m/s.

> [!tip] Remark
> These are the [[Transmission Lines|telegrapher's solutions]] letter for letter: $E\leftrightarrow V$, $H\leftrightarrow I$, $\eta\leftrightarrow Z_0$, $k\leftrightarrow\beta$. A TEM line filled with a uniform dielectric has exactly the plane wave's $v_p$ and $\lambda$.

> [!example] Worked example: basic plane-wave parameters (Pozar Ex. 1.1, p. 17)
> A wave in a lossless dielectric has $f=5$ GHz and $\lambda=3.0$ cm. Find $k$, $v_p$, $\epsilon_r$, $\eta$.
> 1. $k=2\pi/\lambda=2\pi/0.03=209.4$ m⁻¹.
> 2. $v_p=\lambda f=0.03\times5\times10^9=1.5\times10^8$ m/s, half the speed of light.
> 3. $\epsilon_r=(c/v_p)^2=(3\times10^8/1.5\times10^8)^2=4.0$.
> 4. $\eta=\eta_0/\sqrt{\epsilon_r}=377/2=188.5\ \Omega$.

> [!note]- Derivation: Helmholtz equation from the two curl equations (Pozar §1.4, pp. 15–17)
> Source-free, linear, isotropic, homogeneous: $\nabla\times\bar E=-j\omega\mu\bar H$, $\nabla\times\bar H=j\omega\epsilon\bar E$. Curl the first and substitute the second: $\nabla\times\nabla\times\bar E=\omega^2\mu\epsilon\bar E$. With $\nabla\times\nabla\times\bar A=\nabla(\nabla\cdot\bar A)-\nabla^2\bar A$ and $\nabla\cdot\bar E=0$ (no charge): $\nabla^2\bar E+\omega^2\mu\epsilon\bar E=0$.
>
> For $\bar E=\hat xE_x(z)$ only: $d^2E_x/dz^2+k^2E_x=0$, solved by $E^\pm e^{\mp jkz}$. In time, $E^+\cos(\omega t-kz)$: a fixed phase point $\omega t-kz=$ const moves at $dz/dt=\omega/k$. Then $H_y=\frac{j}{\omega\mu}\frac{\partial E_x}{\partial z}$ gives $\eta=\omega\mu/k=\sqrt{\mu/\epsilon}$.

> [!note]- Detail: general plane waves and the current-sheet source (Pozar §1.5, pp. 20–23)
> Separation of variables on $\nabla^2E_i+k_0^2E_i=0$ gives $e^{-j(k_xx+k_yy+k_zz)}$ with $k_x^2+k_y^2+k_z^2=k_0^2$. With $\bar k=k_0\hat n$ and $\bar r$ the position:
> $$\bar E=\bar E_0e^{-j\bar k\cdot\bar r},\qquad \bar k\cdot\bar E_0=0,\qquad \bar H=\frac{1}{\eta_0}\hat n\times\bar E$$
> $\bar k\cdot\bar E_0=0$ (from $\nabla\cdot\bar E=0$): $\bar E$ is always perpendicular to travel, so only two of the three amplitudes are free. That is why a plane wave has exactly two polarizations.
>
> **Current sheet (Pozar Ex. 1.3):** a sheet $\bar J_s=\hat xJ_0$ at $z=0$ launches plane waves both ways. $E_x$ continuous and $\hat z\times(\bar H_2-\bar H_1)=\bar J_s$ give $E_x=-J_0\eta_0/2$ on each side. The sheet sees two half-spaces of $\eta_0$ in parallel: a load of $\eta_0/2$.

### Polarization

$$
\boxed{\bar E=E_0(\hat x-j\hat y)e^{-jk_0z}\ \text{(RHCP)},\qquad \bar E=E_0(\hat x+j\hat y)e^{-jk_0z}\ \text{(LHCP)}}
$$

- **Linear:** $(E_1\hat x+E_2\hat y)e^{-jk_0z}$ with $E_1,E_2$ in phase, tilted at $\tan^{-1}(E_2/E_1)$.
- **Circular:** equal amplitudes 90° apart; at fixed $z$ the vector rotates at $\omega$. Right-hand: thumb along travel, fingers along rotation.
- Any polarization is a sum of two linear ones, or of RHCP and LHCP.

> [!success] Designer takeaway
> - Every characteristic impedance you will meet is $\eta=\eta_0/\sqrt{\epsilon_r}$ scaled by a geometry factor; the line formulas live in [[Transmission Lines]].
> - The free-space wave impedance 377 Ω is the "load" an antenna is matching to.
> - Circular polarization matters when the link's orientation is unknown (satellites, GPS). Ferrite devices also act differently on RHCP and LHCP (Pozar Ch. 9).

## Level 3: Lossy Media and Skin Depth

### Propagation in a Lossy Medium

$$
\boxed{\gamma=\alpha+j\beta=j\omega\sqrt{\mu\epsilon}\sqrt{1-j\frac{\sigma}{\omega\epsilon}},\qquad \eta=\frac{j\omega\mu}{\gamma},\qquad E_x=E^+e^{-\alpha z}e^{-j\beta z}}
$$

$$
\boxed{\text{Low-loss dielectric }(\tan\delta\ll1):\quad \alpha_d\approx\frac{k\tan\delta}{2}\ \ \text{Np/m}}
$$

| | Lossless | General lossy | Good conductor ($\sigma\gg\omega\epsilon$) |
|---|---|---|---|
| $\gamma$ | $j\omega\sqrt{\mu\epsilon}$ | $j\omega\sqrt{\mu\epsilon}\sqrt{1-j\sigma/\omega\epsilon}$ | $(1+j)\sqrt{\omega\mu\sigma/2}$ |
| $\beta$ | $\omega\sqrt{\mu\epsilon}$ | $\mathrm{Im}\{\gamma\}$ | $\sqrt{\omega\mu\sigma/2}$ |
| $\alpha$ | 0 | $\mathrm{Re}\{\gamma\}$ | $\sqrt{\omega\mu\sigma/2}$ |
| $\eta$ | $\sqrt{\mu/\epsilon}$ (0°) | $j\omega\mu/\gamma$ (0°–45°) | $(1+j)\sqrt{\omega\mu/2\sigma}$ (45°) |
| $\delta_s$ | $\infty$ | $1/\alpha$ | $\sqrt{2/\omega\mu\sigma}$ |

*(Pozar Table 1.1, p. 20. $\lambda=2\pi/\beta$ and $v_p=\omega/\beta$ in every column.)*

- The wave still travels at $v_p=\omega/\beta$ but its amplitude falls by $e^{-\alpha z}$. 1 Np = 8.686 dB.
- The impedance phase tells you the medium: 0° lossless, 45° good conductor, in between for anything else.

> [!note]- Derivation: $\alpha_d\approx k\tan\delta/2$ (from Pozar Eq. 1.55)
> With $\sigma=0$ and $\epsilon=\epsilon'(1-j\tan\delta)$: $\gamma=jk\sqrt{1-j\tan\delta}$, $k=\omega\sqrt{\mu\epsilon'}$. For $\tan\delta\ll1$, $\sqrt{1-j\tan\delta}\approx1-j\tfrac12\tan\delta$, so $\gamma\approx\tfrac12k\tan\delta+jk$. Phase is unchanged to first order; attenuation is $\alpha_d=\tfrac12k\tan\delta$. Pozar reuses this for every TEM line's dielectric loss ([[Transmission Lines]]).

> [!example] Worked example: dielectric loss in RO4350B at 2.5 GHz (numbers from binder p. 9, formula above)
> $k=2\pi f\sqrt{\epsilon_r}/c=2\pi(2.5\times10^9)\sqrt{3.48}/(3\times10^8)=97.7$ rad/m.
> $\alpha_d=\tfrac12(97.7)(0.0031)=0.151$ Np/m $=1.32$ dB/m, i.e. about 0.013 dB/cm.
> This is for a wave entirely inside the substrate; a microstrip keeps part of its field in air, so its dielectric loss is somewhat lower.

### Skin Depth

```tikz title="Inside a good conductor the field and current decay as exp(-z/delta_s) (left). Replacing that by a uniform current one skin depth deep carries the same total current and dissipates the same power (dashed). In a round wire the current sits in a ring about delta_s thick (right). After Pozar Eqs. 1.60, 1.118 and 1.129."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!15] (0,0) rectangle (6,3.0);
  \draw[->] (-1.4,0) -- (6.4,0) node[right]{$z$};
  \draw[->] (0,0) -- (0,3.4) node[above]{$|J|/J_0$};
  \draw[thick] (0,0) -- (0,3.0);
  \node[font=\scriptsize,align=center] at (-0.8,1.6) {lossless\\ medium};
  \node[font=\scriptsize] at (4.6,3.25) {good conductor $\sigma\gg\omega\epsilon$};
  \draw[thick,blue,domain=0:6,samples=60] plot (\x,{2.6*exp(-\x/1.2)});
  \draw[dashed] (0,2.6) -- (1.2,2.6) -- (1.2,0);
  \node[left,font=\scriptsize] at (0,2.6) {1};
  \draw[dotted] (0,{2.6*0.368}) -- (1.2,{2.6*0.368});
  \node[left,font=\scriptsize] at (0,{2.6*0.368}) {$1/e$};
  \node[below,font=\scriptsize] at (1.2,0) {$\delta_s$};
  \node[font=\scriptsize,anchor=west] at (2.2,1.3) {$e^{-z/\delta_s}$};
  \begin{scope}[xshift=9.2cm,yshift=1.5cm]
    \fill[blue!35] (0,0) circle (1.3);
    \fill[gray!15] (0,0) circle (1.0);
    \draw (0,0) circle (1.3);
    \draw[<->] (1.0,0) -- (1.3,0);
    \node[font=\scriptsize,anchor=west] at (1.35,0) {$\approx\delta_s$};
    \node[font=\scriptsize,align=center] at (0,0) {almost\\ no current};
    \node[font=\scriptsize] at (0,-1.6) {wire cross-section};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\delta_s=\frac{1}{\alpha}=\sqrt{\frac{2}{\omega\mu\sigma}}=\frac{1}{\sqrt{\pi f\mu\sigma}},\qquad \eta_{metal}=(1+j)\sqrt{\frac{\omega\mu}{2\sigma}}=\frac{1+j}{\sigma\delta_s}}
$$

- One skin depth cuts the field to $1/e$ (36.8%). A few skin depths and it is gone.
- $\delta_s\propto1/\sqrt f$: ten times the frequency, $1/\sqrt{10}$ the skin.

> [!example] Worked example: skin depth at 10 GHz (Pozar Ex. 1.2, p. 19)
> $\delta_s=1/\sqrt{\pi(10^{10})(4\pi\times10^{-7})\sigma}=5.03\times10^{-3}/\sqrt\sigma$ m.
>
> | Metal | $\sigma$ (S/m) | $\delta_s$ at 10 GHz |
> |---|---|---|
> | Aluminum | $3.816\times10^7$ | 0.814 µm |
> | Copper | $5.813\times10^7$ | 0.660 µm |
> | Gold | $4.098\times10^7$ | 0.786 µm |
> | Silver | $6.173\times10^7$ | 0.640 µm |

> [!note]- Detail: copper skin depth and $R_s$ across frequency (computed from Pozar Eqs. 1.60 and 1.98, $\sigma=5.813\times10^7$ S/m)
> | $f$ | 1 MHz | 100 MHz | 1 GHz | 2.5 GHz | 10 GHz | 28 GHz |
> |---|---|---|---|---|---|---|
> | $\delta_s$ | 66 µm | 6.6 µm | 2.09 µm | 1.32 µm | 0.66 µm | 0.39 µm |
> | $R_s$ | 0.26 mΩ | 2.6 mΩ | 8.2 mΩ | 13 mΩ | 26 mΩ | 44 mΩ |
>
> The 1 GHz row matches Pozar Ex. 1.4 ($\delta_s=2.088$ µm, $\mathrm{Re}\{\eta\}=8.239$ mΩ).

> [!note]- Derivation: the good-conductor limit (Pozar Eqs. 1.59–1.61)
> When conduction current dominates displacement current ($\sigma\gg\omega\epsilon$), drop the 1 under the root: $\gamma\approx j\omega\sqrt{\mu\epsilon}\sqrt{\sigma/j\omega\epsilon}=\sqrt{j\omega\mu\sigma}=(1+j)\sqrt{\omega\mu\sigma/2}$, using $\sqrt j=(1+j)/\sqrt2$. Real and imaginary parts are equal, so $\alpha=\beta=1/\delta_s$: the field falls by $e^{-2\pi}$ in one wavelength inside the metal. $\eta=j\omega\mu/\gamma=(1+j)\sqrt{\omega\mu/2\sigma}$, 45° phase.

> [!success] Designer takeaway
> - **Conductor loss rises as $\sqrt f$:** current is confined to $\delta_s\propto1/\sqrt f$, so the resistance per square $R_s=1/(\sigma\delta_s)$ grows as $\sqrt f$ ([[#Surface Resistance]]). Dielectric loss ($\alpha_d\propto f$ at fixed $\tan\delta$) grows faster.
> - **Thickness past a few $\delta_s$ buys nothing.** 1 oz copper (34 µm) is about 26 skin depths at 2.5 GHz. That is why a thin plating of a good metal (silver, gold) is enough for low-loss microwave parts (Pozar p. 19).
> - **Roughness matters more than thickness.** Once copper roughness approaches $\delta_s$ the current follows the bumps; Pozar's empirical correction (Eq. 2.107, p. 85) raises conductor loss by up to **2×** when the rms roughness is much larger than $\delta_s$. The formula belongs with line attenuation in [[Transmission Lines]].
> - A wire's or inductor's AC resistance is set by its perimeter, not its area. This is the root of an on-chip inductor's falling Q at high frequency ([[Inductor]]).

## Level 4: Energy and Power

### Poynting Vector

$$
\boxed{\bar S=\bar E\times\bar H^*,\qquad P_o=\tfrac12\oint_S\bar E\times\bar H^*\cdot d\bar s\quad(\text{time-average: real part})}
$$

$$
\boxed{P_s=P_o+P_\ell+2j\omega(W_m-W_e)}
$$

$$
W_e=\frac{\epsilon'}{4}\int_V|\bar E|^2dv,\qquad W_m=\frac{\mu'}{4}\int_V|\bar H|^2dv,\qquad P_\ell=\frac{\sigma}{2}\int_V|\bar E|^2dv+\frac{\omega}{2}\int_V\left(\epsilon''|\bar E|^2+\mu''|\bar H|^2\right)dv
$$

Power delivered by the sources = power leaving through the surface + power burned inside + $2\omega$ × the net reactive energy stored.

> [!tip] Remark
> This is the field version of $P=\tfrac12VI^*=\tfrac12|I|^2Z_{in}$. Pozar later uses it to *define* the input impedance of any one-port: $R_{in}$ from $P_o+P_\ell$, $X_{in}$ from $4\omega(W_m-W_e)$ ([[Microwave Network Analysis]]). At **resonance** $W_m=W_e$ and the input is purely resistive ([[Microwave Resonators]]).

> [!note]- Derivation: Poynting's theorem (Pozar Eqs. 1.83–1.93, pp. 25–27)
> Dot $\bar H^*$ into $\nabla\times\bar E=-j\omega\mu\bar H-\bar M_s$ and $\bar E$ into the conjugate of $\nabla\times\bar H=j\omega\epsilon\bar E+\bar J_s+\sigma\bar E$. With $\nabla\cdot(\bar E\times\bar H^*)=\bar H^*\cdot\nabla\times\bar E-\bar E\cdot\nabla\times\bar H^*$:
> $$\nabla\cdot(\bar E\times\bar H^*)=-\sigma|\bar E|^2+j\omega(\epsilon^*|\bar E|^2-\mu|\bar H|^2)-(\bar E\cdot\bar J_s^*+\bar H^*\cdot\bar M_s)$$
> Integrate over $V$, apply the divergence theorem, split $\epsilon=\epsilon'-j\epsilon''$, $\mu=\mu'-j\mu''$, and divide by 2. The source term $P_s=-\tfrac12\int(\bar E\cdot\bar J_s^*+\bar H^*\cdot\bar M_s)dv$ equals the four terms in the box. The surface integral must be over a **closed** surface for this reading to hold.
>
> Subtlety (Pozar p. 31): with a standing wave, $\bar E\times\bar H^*$ of the *total* field is not the sum of incident and reflected Poynting vectors; the cross terms are the stored reactive energy. Time-average powers ($\tfrac12\mathrm{Re}$) do add, as long as the medium is lossless.

### Surface Resistance

$$
\boxed{R_s=\mathrm{Re}\{\eta_{metal}\}=\frac{1}{\sigma\delta_s}=\sqrt{\frac{\omega\mu}{2\sigma}}=\sqrt{\frac{\pi f\mu}{\sigma}}\quad(\Omega/\square)}
$$

$$
\boxed{P_{loss}=\frac{R_s}{2}\int_S|\bar J_s|^2\,ds=\frac{R_s}{2}\int_S|\bar H_t|^2\,ds,\qquad \bar J_s=\hat n\times\bar H\ \text{(computed as if the metal were perfect)}}
$$

- $R_s$ is the DC sheet resistance of a slab exactly one skin depth thick: the current is treated as uniform over $\delta_s$ and zero below.
- Recipe (the **surface impedance method**): solve the fields with perfect conductors, read $\bar J_s=\hat n\times\bar H$ off the walls, then charge $\tfrac12R_s|\bar J_s|^2$ per unit area. Valid for any shape with bend radii of a skin depth or more.
- The only approximation is $|\eta_{metal}|\ll\eta_0$. Copper at 1 GHz: $|\eta|=0.012\ \Omega$ against 377 Ω (Pozar p. 34).

> [!tip] Remark
> The series $R$ of every line in the binder's RLGC table (p. 46) is this recipe applied to its geometry, written with $R_s=\sqrt{\pi f\mu_c/\sigma_c}$ (the box above). E.g. a parallel-plate line: two plates, each $R_s$ per square, width $w$: $R=2R_s/w$. Line attenuation from $R$: [[Transmission Lines]].

> [!note]- Derivation: three routes to the same loss (Pozar pp. 27–28 and 33–34)
> Normally incident wave on a good conductor, per m²:
> 1. **Joule's law** on the decaying volume current $J=\sigma TE_0e^{-\gamma z}$: $P_t=\sigma|E_0|^2|T|^2/4\alpha$. With $T\approx2\eta/\eta_0$ and $\alpha=1/\delta_s$: $P_t=2|E_0|^2R_s/\eta_0^2$.
> 2. **Poynting** flow into the surface: $\tfrac12\mathrm{Re}\{\bar S\cdot\hat z\}=2|E_0|^2\mathrm{Re}\{\eta\}/|\eta+\eta_0|^2\to2|E_0|^2R_s/\eta_0^2$.
> 3. **Surface current:** $\int_0^\infty J\,dz=\sigma TE_0/\gamma\approx2E_0/\eta_0$, exactly the $J_s=\hat n\times\bar H$ a perfect conductor would carry. Spread it uniformly over one $\delta_s$: $P=\frac{1}{2\sigma}\frac{|J_s|^2}{\delta_s}=\frac{R_s}{2}|J_s|^2=2|E_0|^2R_s/\eta_0^2$.
>
> All three agree, which is why method 3 (no fields inside the metal needed) is safe to use everywhere.

> [!success] Designer takeaway
> - Conductor loss scales as $R_s\propto\sqrt{f/\sigma}$. Aluminum instead of copper: $\sqrt{5.813/3.816}=1.23$, i.e. 23% more conductor loss.
> - Loss goes where $|\bar J_s|^2$ is large. Narrow strips crowd current toward the edges, which is why for a given substrate a high-$Z_0$ (narrow) microstrip is lossier per unit length than a 50 Ω one.

## Level 5: Reflection from an Interface

### Normal Incidence

```tikz title="Plane-wave reflection is a transmission-line problem: the half-space is a load eta on a line of impedance eta_0. After Pozar Fig. 1.12 and Eqs. 1.104-1.105."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!15] (3,-0.2) rectangle (5.4,2.4);
  \draw[thick] (3,-0.2) -- (3,2.4);
  \node[font=\scriptsize] at (1.5,2.2) {$\epsilon_0,\mu_0$: $\eta_0$};
  \node[font=\scriptsize] at (4.2,2.2) {$\epsilon,\mu,\sigma$: $\eta$};
  \draw[->,thick,blue] (0.3,1.4) -- (2.8,1.4) node[midway,above,font=\scriptsize]{$E_0$};
  \draw[<-,thick,red] (0.3,0.7) -- (2.8,0.7) node[midway,below,font=\scriptsize]{$\Gamma E_0$};
  \draw[->,thick,blue] (3.2,1.1) -- (5.2,1.1) node[midway,above,font=\scriptsize]{$TE_0$};
  \node at (6.4,1.1) {$\Longleftrightarrow$};
  \draw (7.4,1.8) node[ocirc]{} -- (10.6,1.8);
  \draw (7.4,0.4) node[ocirc]{} -- (10.6,0.4);
  \node[font=\scriptsize] at (9,1.1) {line, $Z_0=\eta_0$};
  \draw (10.6,1.8) to[R,l={$Z_L=\eta$}] (10.6,0.4);
\end{circuitikz}
\end{document}
```

$$
\boxed{\Gamma=\frac{\eta-\eta_0}{\eta+\eta_0},\qquad T=1+\Gamma=\frac{2\eta}{\eta+\eta_0}}
$$

- From two conditions: $E_x$ continuous ($1+\Gamma=T$) and $H_y$ continuous ($(1-\Gamma)/\eta_0=T/\eta$).
- **Lossless dielectric:** $\Gamma$, $T$ real; transmitted power fraction is $1-|\Gamma|^2$.
- **Perfect conductor:** $\eta\to0$, so $\Gamma=-1$, $T=0$: a short circuit.

> [!tip] Remark
> Same formula as $\Gamma_L=(Z_L-Z_0)/(Z_L+Z_0)$ in [[Transmission Lines]]. The $1+\Gamma=T$ condition is "voltage is continuous at the load".

### Good and Perfect Conductors

```tikz title="Standing wave in front of a perfect conductor (Gamma = -1). E is zero at the wall and every lambda/2; H is maximum at the wall, where it equals the surface current. After Pozar Eqs. 1.120-1.122."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!40] (0,-0.2) rectangle (0.4,2.6);
  \node[font=\scriptsize,rotate=90] at (0.2,1.2) {PEC};
  \draw[->] (-8,0) -- (0.6,0) node[right]{$z$};
  \draw[thick,blue,domain=-7.2:0,samples=100] plot (\x,{2*abs(sin(50*\x))});
  \draw[thick,red,dashed,domain=-7.2:0,samples=100] plot (\x,{2*abs(cos(50*\x))});
  \node[blue,font=\scriptsize] at (-5.4,2.35) {$|E_x|=2E_0|\sin k_0z|$};
  \node[red,font=\scriptsize] at (-2.4,2.35) {$|H_y|=\tfrac{2E_0}{\eta_0}|\cos k_0z|$};
  \draw (-3.6,0.08) -- (-3.6,-0.08) node[below,font=\scriptsize]{$-\lambda/2$};
  \draw (-1.8,0.08) -- (-1.8,-0.08) node[below,font=\scriptsize]{$-\lambda/4$};
  \draw (-7.2,0.08) -- (-7.2,-0.08) node[below,font=\scriptsize]{$-\lambda$};
  \node[below,font=\scriptsize] at (0,0) {$0$};
  \node[font=\scriptsize,align=center] at (-1.8,-0.95) {$E$ max, $H=0$:\\ looks like a magnetic wall (open)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{PEC: }\ E_x=-2jE_0\sin k_0z,\quad H_y=\frac{2E_0}{\eta_0}\cos k_0z,\quad J_s=\frac{2E_0}{\eta_0}}
$$

$$
\boxed{\text{Good conductor: fraction of incident power absorbed}\ \approx\frac{4R_s}{\eta_0}}
$$

- In front of a short, $\bar E\times\bar H^*$ is purely imaginary: no real power reaches the wall, only stored energy sloshes.
- A good conductor is almost a short. The tiny $T$ carries the loss.

> [!example] Worked example: plane wave on copper at 1 GHz (Pozar Ex. 1.4, pp. 34–35)
> $\sigma=5.813\times10^7$ S/m.
> 1. $\delta_s=\sqrt{2/\omega\mu\sigma}=2.088$ µm.
> 2. $\gamma=(1+j)/\delta_s=(4.789+j4.789)\times10^5$ m⁻¹.
> 3. $\eta=(1+j)/(\sigma\delta_s)=(8.239+j8.239)\times10^{-3}\ \Omega$, tiny next to 377 Ω.
> 4. $\Gamma=(\eta-\eta_0)/(\eta+\eta_0)=1.0\angle179.99°$: practically a short.
> 5. $T=2\eta/(\eta+\eta_0)=6.181\times10^{-5}\angle45°$.
>
> Absorbed fraction (from the box): $4R_s/\eta_0=4(8.24\times10^{-3})/377=8.7\times10^{-5}$, about −41 dB. Copper reflects 99.99% of the power.

> [!note]- Derivation: absorbed fraction $4R_s/\eta_0$
> Incident power density $P_i=|E_0|^2/2\eta_0$. Power into the conductor (from [[#Surface Resistance]]) $P_t=2|E_0|^2R_s/\eta_0^2$. Ratio: $P_t/P_i=4R_s/\eta_0$. Equivalently $1-|\Gamma|^2$ with $\Gamma\approx-1+2\eta/\eta_0$.

> [!success] Designer takeaway
> - **Metal = short, a quarter-wave from metal = open.** $E$ vanishes at the wall and peaks $\lambda/4$ away. This is the field version of the [[Transmission Lines|$\lambda/4$ shorted stub]] and the reason a ground plane a quarter-wave behind an antenna reinforces it ([[#Image Theory]]).
> - Shielding works because a good conductor reflects almost everything and absorbs the rest within a few $\delta_s$.
> - The **surface impedance** idea is one line: treat the metal as perfect to find $J_s$, then pay $\tfrac12R_s|J_s|^2$. Every conductor-loss formula in later notes ($\alpha_c$ of coax, microstrip, waveguide; $Q_c$ of cavities) is this.

### Oblique Incidence

```tikz title="|Gamma| versus incidence angle from air onto eps_r = 2.55, computed from Pozar Eqs. 1.137a and 1.143a. Parallel polarization reaches zero at the Brewster angle (57.9 deg); perpendicular never does. After Pozar Fig. 1.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9.6,0) node[right]{$\theta_i$ (deg)};
  \draw[->] (0,0) -- (0,4.4) node[above]{$|\Gamma|$};
  \foreach \a in {0,30,60,90} { \draw ({\a/10},0.08) -- ({\a/10},-0.08) node[below,font=\scriptsize]{\a}; }
  \foreach \g in {0.25,0.5,0.75,1} { \draw (0.08,{4*\g}) -- (-0.08,{4*\g}) node[left,font=\scriptsize]{\g}; }
  \draw[thick,blue,domain=0:89.5,samples=90] plot ({\x/10},{4*abs((cos(\x)-1.5969*sqrt(1-sin(\x)^2/2.55))/(cos(\x)+1.5969*sqrt(1-sin(\x)^2/2.55)))});
  \draw[thick,red,domain=0:89.5,samples=180] plot ({\x/10},{4*abs((sqrt(1-sin(\x)^2/2.55)-1.5969*cos(\x))/(sqrt(1-sin(\x)^2/2.55)+1.5969*cos(\x)))});
  \draw[->,thin] (4.4,2.9) -- (5.74,0.08);
  \node[font=\scriptsize,anchor=south] at (4.4,2.9) {Brewster $57.9^\circ$};
  \node[blue,font=\scriptsize,anchor=west] at (1.0,1.25) {perpendicular};
  \node[red,font=\scriptsize,anchor=west] at (1.0,0.55) {parallel};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Snell:}\quad \theta_r=\theta_i,\qquad k_1\sin\theta_i=k_2\sin\theta_t}
$$

$$
\boxed{\Gamma_\parallel=\frac{\eta_2\cos\theta_t-\eta_1\cos\theta_i}{\eta_2\cos\theta_t+\eta_1\cos\theta_i},\qquad \Gamma_\perp=\frac{\eta_2\cos\theta_i-\eta_1\cos\theta_t}{\eta_2\cos\theta_i+\eta_1\cos\theta_t}}
$$

$$
\boxed{\text{Brewster (parallel only): }\sin\theta_b=\frac{1}{\sqrt{1+\epsilon_1/\epsilon_2}},\qquad \text{critical angle }(\epsilon_1>\epsilon_2):\ \sin\theta_c=\sqrt{\epsilon_2/\epsilon_1}}
$$

- Snell's law is **phase matching**: the fields on both sides must vary along the interface at the same rate.
- Past $\theta_c$ (going from dense to less dense), $|\Gamma|=1$: **total reflection**. The field in region 2 still exists but decays away from the interface and carries power only *along* it: a **surface wave**.
- Perpendicular polarization has no Brewster angle for non-magnetic dielectrics.

> [!example] Worked example: oblique reflection from $\epsilon_r=2.55$ (Pozar Ex. 1.5, p. 38)
> $\eta_1=377\ \Omega$, $\eta_2=377/\sqrt{2.55}=236\ \Omega$. At normal incidence both polarizations give $\Gamma=(236-377)/(236+377)=-0.23$. As $\theta_i$ grows, $|\Gamma_\perp|$ rises steadily to 1; $|\Gamma_\parallel|$ dips to zero at $\theta_b=\sin^{-1}(1/\sqrt{1+1/2.55})=57.9°$ and then rises to 1 (plot above).

> [!note]- Detail: the total-reflection fields (Pozar Eqs. 1.144–1.151, pp. 38–40)
> For $\theta_i>\theta_c$, $\cos\theta_t$ is imaginary. Write the transmitted field as $e^{-j\beta x}e^{-\alpha z}$ with $\beta=k_1\sin\theta_i$ and $\alpha=\sqrt{k_1^2\sin^2\theta_i-k_2^2}>0$. $\Gamma$ takes the form $(ja-b)/(ja+b)$, so $|\Gamma|=1$. The transmitted Poynting vector has a purely imaginary $z$ component (no power into region 2) and a real $x$ component decaying as $e^{-2\alpha z}$. Pozar notes that some authors call this a "forced surface wave" because it only exists while the incident wave does.

> [!success] Designer takeaway
> Total internal reflection is how a **grounded substrate traps energy**: waves bouncing inside a high-$\epsilon_r$ slab hit the top surface beyond $\theta_c$ and stay inside. Microstrip lines can excite these surface waves (Pozar §3.6, p. 135), which means lost power and unwanted coupling. Higher $\epsilon_r$ means a smaller $\theta_c$ and easier trapping.

## Level 6: Useful Theorems

### Reciprocity

$$
\boxed{\int_V\left(\bar E_1\cdot\bar J_2-\bar H_1\cdot\bar M_2\right)dv=\int_V\left(\bar E_2\cdot\bar J_1-\bar H_2\cdot\bar M_1\right)dv}
$$

Swap source and observer and the response is the same: the field of source 2 measured at source 1 equals the field of source 1 measured at source 2.

- Holds inside a perfectly conducting enclosure, for a sphere at infinity, and for any surface where a surface-impedance condition applies.
- Source-free form: $\oint_S\bar E_1\times\bar H_2\cdot d\bar s=\oint_S\bar E_2\times\bar H_1\cdot d\bar s$. Pozar uses this to prove $[Z]$ is symmetric.
- Requires $\epsilon$ and $\mu$ to be scalars (or symmetric tensors). Ferrites and active devices break it.

> [!tip] Remark
> This is where $Z_{12}=Z_{21}$, $S_{12}=S_{21}$ and $AD-BC=1$ come from ([[Microwave Network Analysis]]). The worked problems in [[Exam Prep - Problems through Stability]] use "passive, no ferrites ⇒ reciprocal" as the test, which is this theorem.

> [!note]- Derivation: Lorentz reciprocity (Pozar §1.9, pp. 40–42)
> Two source sets $(\bar J_1,\bar M_1)$, $(\bar J_2,\bar M_2)$ in the same medium. Expanding with $\nabla\cdot(\bar A\times\bar B)$ and the four curl equations:
> $$\nabla\cdot(\bar E_1\times\bar H_2-\bar E_2\times\bar H_1)=\bar J_1\cdot\bar E_2-\bar J_2\cdot\bar E_1+\bar M_2\cdot\bar H_1-\bar M_1\cdot\bar H_2$$
> Integrate and apply the divergence theorem. The surface term vanishes (a) on a perfect conductor, since $(\hat n\times\bar E)\cdot\bar H=0$; (b) on a sphere at infinity, since locally $\bar H=\hat n\times\bar E/\eta$ and the two products cancel. What remains is the boxed equation. The cancellation in (b) needs the *same* $\epsilon,\mu$ for both problems, i.e. a reciprocal medium.

> [!success] Designer takeaway
> Any passive network built from metals and ordinary dielectrics is reciprocal: $S_{21}=S_{12}$, and an antenna's receive pattern equals its transmit pattern. To get one-way behaviour (circulators, isolators) you need an anisotropic medium (magnetized ferrite) or an active device. A lossless, matched, reciprocal 3-port is impossible, which is why the Wilkinson divider adds a resistor ([[Power Dividers and Couplers]]).

### Image Theory

```tikz title="Image rules for a perfect ground plane: replace the plane with a mirror source and keep only the fields on the original side. Electric currents: parallel reverses, normal keeps direction. Magnetic currents (double arrow): the opposite. After Pozar Fig. 1.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\lab/\kind in {0/(a)/{electric $\parallel$},3.3/(b)/{electric $\perp$},6.6/(c)/{magnetic $\parallel$},9.9/(d)/{magnetic $\perp$}} {
    \begin{scope}[xshift=\ox cm]
      \draw[dashed] (1.3,0) -- (1.3,3.2);
      \node[font=\scriptsize] at (1.3,-0.35) {\lab\ \kind};
    \end{scope}
  }
  % (a) electric parallel: original up, image down
  \draw[->,thick] (1.8,1.0) -- (1.8,2.2);
  \draw[->,thick] (0.8,2.2) -- (0.8,1.0);
  % (b) electric normal: both point +x
  \draw[->,thick] (3.3+1.6,1.6) -- (3.3+2.6,1.6);
  \draw[->,thick] (3.3+0.0,1.6) -- (3.3+1.0,1.6);
  % (c) magnetic parallel: both up (double)
  \draw[->>,thick] (6.6+1.8,1.0) -- (6.6+1.8,2.2);
  \draw[->>,thick] (6.6+0.8,1.0) -- (6.6+0.8,2.2);
  % (d) magnetic normal: original +x, image -x
  \draw[->>,thick] (9.9+1.6,1.6) -- (9.9+2.6,1.6);
  \draw[->>,thick] (9.9+1.0,1.6) -- (9.9+0.0,1.6);
  \node[font=\scriptsize] at (6.4,3.6) {image (left of dashed plane)\quad|\quad original (right)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Sheet }J_{s0}\text{ at height }d\text{ over ground:}\quad E_x^+=-jJ_{s0}\eta_0\sin(k_0d)\,e^{-jk_0z}}
$$

- Remove the ground plane, add the mirror source; the fields are correct **only on the original side** of the plane.
- The far field of a current near ground is the sum of the current and its reversed image: it scales as $\sin k_0d$.

> [!note]- Derivation: current sheet over a ground plane (Pozar Eqs. 1.158–1.164, pp. 42–44)
> Between plane and sheet: a standing wave $E_x=A(e^{jk_0z}-e^{-jk_0z})$ that is zero at $z=0$. Above: an outgoing wave $Be^{-jk_0z}$. $E_x$ continuous at $z=d$ and the $H$ jump equal to $J_{s0}$ give $A=-\tfrac12J_{s0}\eta_0e^{-jk_0d}$, $B=-jJ_{s0}\eta_0\sin k_0d$. The image picture gives the same thing: the sheet and a reversed sheet at $-d$, each radiating $\mp J_{s0}\eta_0/2$, summed with their path phases.

> [!success] Designer takeaway
> - **A current close to its return plane barely radiates.** For $k_0d\ll1$, $\sin k_0d\approx k_0d=2\pi d/\lambda$: the trace and its reversed image almost cancel. Keep signal traces tight to an unbroken ground to cut radiation and coupling.
> - **A quarter-wave spacing doubles the field** ($\sin k_0d=1$, versus $\eta_0/2$ for a free sheet): the reflector-backed antenna.
> - A vertical current (a via, a monopole) over ground has an in-phase image, which is why a $\lambda/4$ monopole over ground behaves like a $\lambda/2$ dipole.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ frequency | Antenna gain per size, absolute bandwidth (Pozar §1.1) | Conductor loss ∝ $\sqrt f$, dielectric loss ∝ $f$; more parts become distributed |
| ↑ $\epsilon_r$ | Smaller circuits ($\lambda\propto1/\sqrt{\epsilon_r}$), field held in substrate | Lower $\eta$, more reflection at interfaces, smaller $\theta_c$ (surface waves), tighter dimensional tolerance |
| ↓ $\tan\delta$ | $\alpha_d\propto\tan\delta$ | Material cost |
| ↑ $\sigma$ (Cu, Ag, Au plating) | $R_s\propto1/\sqrt\sigma$ | Cost; Al is 23% lossier than Cu |
| Metal thicker than a few $\delta_s$ | Nothing at RF (DC resistance and current capacity only) | Etch tolerance, cost |
| Smoother copper | Up to 2× lower conductor loss when roughness ≈ or > $\delta_s$ | Adhesion, cost |
| Signal closer to ground ($k_0d$ ↓) | Less radiation and coupling ($\propto\sin k_0d$), tighter return path | Narrower trace for the same $Z_0$, so more conductor loss |
| Shield / metal enclosure | Reflects ≈ all incident power ($1-4R_s/\eta_0$) | Creates cavity resonances |
| Ferrite (anisotropic $\mu$) | Nonreciprocal parts: circulators, isolators | Size, bias magnet, cost |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Phasor ↔ time | $\bar{\mathcal E}=\mathrm{Re}\{\bar Ee^{j\omega t}\}$, $\overline{\mathcal E^2}=\tfrac12|\bar E|^2$ |
| Maxwell (phasor) | $\nabla\times\bar E=-j\omega\mu\bar H-\bar M$, $\nabla\times\bar H=j\omega\epsilon\bar E+\bar J$, $\nabla\cdot\bar D=\rho$, $\nabla\cdot\bar B=0$ |
| Lossy permittivity | $\epsilon=\epsilon_0\epsilon_r(1-j\tan\delta)$, $\tan\delta=(\omega\epsilon''+\sigma)/\omega\epsilon'$ |
| Dielectric interface | $E_t$, $H_t$, $D_n$, $B_n$ continuous |
| Perfect conductor | $\hat n\times\bar E=0$, $\bar J_s=\hat n\times\bar H$, $\hat n\cdot\bar D=\rho_s$ |
| Helmholtz | $\nabla^2\bar E+k^2\bar E=0$, $k=\omega\sqrt{\mu\epsilon}$ |
| Plane wave | $E_x=E^+e^{-jkz}+E^-e^{jkz}$, $H_y=(E^+e^{-jkz}-E^-e^{jkz})/\eta$ |
| Wave parameters | $v_p=c/\sqrt{\mu_r\epsilon_r}$, $\lambda=\lambda_0/\sqrt{\mu_r\epsilon_r}$, $\eta=\eta_0\sqrt{\mu_r/\epsilon_r}$, $\eta_0=377\ \Omega$ |
| Circular polarization | RHCP $E_0(\hat x-j\hat y)e^{-jk_0z}$, LHCP $E_0(\hat x+j\hat y)e^{-jk_0z}$ |
| Lossy medium | $\gamma=\alpha+j\beta=j\omega\sqrt{\mu\epsilon}\sqrt{1-j\sigma/\omega\epsilon}$, $\eta=j\omega\mu/\gamma$ |
| Low-loss dielectric | $\alpha_d\approx\tfrac12k\tan\delta$ |
| Skin depth | $\delta_s=\sqrt{2/\omega\mu\sigma}=1/\sqrt{\pi f\mu\sigma}$ |
| Metal impedance | $\eta=(1+j)/(\sigma\delta_s)$ |
| Surface resistance | $R_s=1/(\sigma\delta_s)=\sqrt{\omega\mu/2\sigma}$ |
| Conductor loss | $P=\tfrac{R_s}{2}\int|\bar J_s|^2ds$ |
| Poynting | $\bar S=\bar E\times\bar H^*$, $P_o=\tfrac12\oint\bar E\times\bar H^*\cdot d\bar s$ |
| Power balance | $P_s=P_o+P_\ell+2j\omega(W_m-W_e)$ |
| Normal-incidence reflection | $\Gamma=(\eta-\eta_0)/(\eta+\eta_0)$, $T=1+\Gamma$ |
| PEC standing wave | $E_x=-2jE_0\sin k_0z$, $H_y=(2E_0/\eta_0)\cos k_0z$, $J_s=2E_0/\eta_0$ |
| Metal absorption | $P_t/P_i\approx4R_s/\eta_0$ |
| Snell | $\theta_r=\theta_i$, $k_1\sin\theta_i=k_2\sin\theta_t$ |
| Oblique Γ | $\Gamma_\parallel=\frac{\eta_2\cos\theta_t-\eta_1\cos\theta_i}{\eta_2\cos\theta_t+\eta_1\cos\theta_i}$, $\Gamma_\perp=\frac{\eta_2\cos\theta_i-\eta_1\cos\theta_t}{\eta_2\cos\theta_i+\eta_1\cos\theta_t}$ |
| Brewster, critical | $\sin\theta_b=1/\sqrt{1+\epsilon_1/\epsilon_2}$, $\sin\theta_c=\sqrt{\epsilon_2/\epsilon_1}$ |
| Reciprocity | $\int(\bar E_1\cdot\bar J_2-\bar H_1\cdot\bar M_2)dv=\int(\bar E_2\cdot\bar J_1-\bar H_2\cdot\bar M_1)dv$ |
| Sheet over ground | $E_x^+=-jJ_{s0}\eta_0\sin(k_0d)e^{-jk_0z}$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20)
  - Ch. 1 Electromagnetic Theory, pp. 1–44: §1.1 introduction, bands and applications (pp. 1–6, Fig. 1.1); §1.2 Maxwell's equations, phasors, sources (pp. 6–10, Fig. 1.4); §1.3 fields in media, loss tangent, anisotropy, boundary conditions, electric and magnetic walls, radiation condition (pp. 10–15, Figs. 1.5–1.7); §1.4 Helmholtz equation, lossless/lossy/good-conductor plane waves, skin depth (pp. 15–20, Ex. 1.1, Ex. 1.2, Table 1.1); §1.5 general plane waves, current sheet, circular polarization (pp. 20–25, Fig. 1.8, Ex. 1.3, Fig. 1.9); §1.6 energy, Poynting's theorem, power absorbed by a good conductor, surface resistance (pp. 25–28); §1.7 normal-incidence reflection from a lossless medium, good conductor, perfect conductor, surface impedance concept (pp. 28–35, Ex. 1.4); §1.8 oblique incidence, Snell, Brewster, total reflection and surface waves (pp. 35–40, Ex. 1.5, Fig. 1.14); §1.9 Lorentz reciprocity and image theory (pp. 40–44, Figs. 1.15–1.17).
  - §2.7 p. 85, Eq. 2.107 (surface-roughness correction); §3.6 p. 135 (surface waves on a grounded dielectric sheet, cited only).
- **ECE 373 lecture binder (Boumaiza, Waterloo)**: pp. 1–9 course introduction, radio front end, RO4350B project substrate ($\epsilon_r=3.48\pm0.05$, $\tan\delta=0.0031$ at 2.5 GHz, 60 mil, 1 oz = 34 µm Cu); p. 11 low- vs high-frequency (lumped vs distributed); p. 12 RLGC model (R conductor loss, G dielectric loss); p. 46 RLGC table for coax, two-wire, parallel plate with $R_s=\sqrt{\pi f\mu_c/\sigma_c}$; p. 47 microstrip quasi-TEM and fringing.
- **Vault:** [[Exam Prep - Problems through Stability]] (reciprocity tests on S, Z, ABCD).
- Numbers marked "computed" (copper $\delta_s$/$R_s$ table, RO4350B $\alpha_d$, Brewster 57.9°, $4R_s/\eta_0$, Al/Cu ratio) are evaluated from the cited Pozar equations, not quoted.
