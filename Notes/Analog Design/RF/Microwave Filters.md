---
title: Microwave Filters
description: Turning an LC low-pass prototype into hardware made of transmission lines (Richards' transformation, unit elements, Kuroda's identities, stepped-impedance low-pass, coupled-line and coupled-resonator bandpass via J/K inverters), with Pozar's designs drawn as microstrip top views, insertion loss from finite resonator Q, the receiver noise budget it lands on, and how to measure and tune the result.
kind: topic
status: growing
aliases:
  - Microwave Filters
  - Distributed Filters
  - Stepped-Impedance Filter
  - Coupled-Line Filter
---

At microwave frequencies an inductor or capacitor is hard to build and the distance between parts is no longer negligible. So a microwave filter is designed exactly like an LC filter, from the same tabulated low-pass prototype, and then every element is swapped for a piece of transmission line. This note owns that swap. Approximation theory, the $g_k$ tables, scaling and the LP→HP/BP/BS transformations live in [[Filters]]; here we start from the prototype. As in [[MosFETs]], each section opens the box one level further: stop anywhere and you still have a correct, coarser picture.

## The big picture

```tikz title="Every microwave filter follows one pipeline: spec, LC prototype, a distributed realization chosen by response type, layout, then measurement and tuning. Bottom: the three layouts this note designs (not to scale). After binder p. 277 and Pozar Figs. 8.36(f), 8.40(c), 8.45(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,rounded corners=2pt,fill=gray!8,align=center,font=\scriptsize,minimum height=1.1cm,text width=2.3cm}}
  \node[b] (s) at (0,0) {\textbf{Spec}\\ $f_c$ or $f_0$, $\Delta$\\ ripple, rejection\\ IL budget};
  \node[b] (p) at (3.1,0) {\textbf{LP prototype}\\ order $N$, $g_k$\\ (owned by Filters)};
  \node[b,fill=blue!6] (l) at (6.4,0.9) {\textbf{Low-pass}\\ Richards + Kuroda\\ or stepped-$Z$};
  \node[b,fill=red!6] (bp) at (6.4,-0.9) {\textbf{Bandpass/stop}\\ $J$/$K$ inverters +\\ resonators};
  \node[b] (lay) at (9.6,0) {\textbf{Layout}\\ $Z\to W$, $\theta\to\ell$\\ EM check};
  \node[b] (m) at (12.6,0) {\textbf{Measure + tune}\\ VNA $S_{21}$, $S_{11}$\\ trim, $Q_u$};
  \draw[->] (s) -- (p); \draw[->] (p) -- (l); \draw[->] (p) -- (bp);
  \draw[->] (l) -- (lay); \draw[->] (bp) -- (lay); \draw[->] (lay) -- (m);
  % mini layouts
  \begin{scope}[yshift=-3.6cm]
    % stepped impedance
    \fill[orange!70] (0,-0.12) rectangle (0.5,0.12);
    \fill[orange!70] (0.5,-0.55) rectangle (0.8,0.55);
    \fill[orange!70] (0.8,-0.03) rectangle (1.6,0.03);
    \fill[orange!70] (1.6,-0.55) rectangle (2.4,0.55);
    \fill[orange!70] (2.4,-0.03) rectangle (3.3,0.03);
    \fill[orange!70] (3.3,-0.55) rectangle (3.9,0.55);
    \fill[orange!70] (3.9,-0.03) rectangle (4.2,0.03);
    \fill[orange!70] (4.2,-0.12) rectangle (4.7,0.12);
    \node[font=\scriptsize,align=center] at (2.35,-1.0) {stepped-impedance LPF\\ hi-$Z$ = $L$, lo-$Z$ = $C$};
    % stub LPF
    \begin{scope}[xshift=5.6cm]
      \fill[orange!70] (0,-0.12) rectangle (0.6,0.12);
      \fill[orange!70] (0.6,-0.03) rectangle (1.9,0.03);
      \fill[orange!70] (1.9,-0.03) rectangle (3.2,0.03);
      \fill[orange!70] (3.2,-0.12) rectangle (3.8,0.12);
      \foreach \x in {0.6,1.9,3.2} \fill[orange!70] (\x-0.08,0) rectangle (\x+0.08,0.9);
      \node[font=\scriptsize,align=center] at (1.9,-1.0) {stub LPF (Richards + Kuroda)\\ all lines $\lambda/8$ at $f_c$};
    \end{scope}
    % coupled line
    \begin{scope}[xshift=10.4cm]
      \fill[orange!70] (0,0.45) rectangle (0.5,0.6);
      \fill[orange!70] (0.5,0.45) rectangle (1.5,0.6);
      \fill[orange!70] (0.5,0.33) rectangle (2.5,0.42);
      \fill[orange!70] (1.5,0.18) rectangle (3.5,0.27);
      \fill[orange!70] (2.5,0.03) rectangle (4.0,0.12);
      \fill[orange!70] (3.5,-0.12) rectangle (4.0,0.0);
      \fill[orange!70] (4.0,-0.12) rectangle (4.5,0.03);
      \node[font=\scriptsize,align=center] at (2.25,-1.0) {coupled-line BPF\\ $N+1$ sections, each $\lambda/4$ at $f_0$};
    \end{scope}
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Richards' transformation** $\Omega=\tan\beta\ell$: an inductor $L$ becomes a short-circuited stub of $Z_0=L$, a capacitor $C$ an open-circuited stub of $Z_0=1/C$, all $\lambda/8$ long at $\omega_c$. The response repeats every $4\omega_c$.
> 2. **Kuroda's identities** insert redundant $\lambda/8$ **unit elements** to separate stubs, turn series stubs into shunt stubs, and fix impractical impedances: $n^2=1+Z_2/Z_1$.
> 3. **Stepped-impedance low-pass:** a short high-$Z$ line is a series $L$, a short low-$Z$ line a shunt $C$: $\beta\ell=g_kR_0/Z_h$ or $g_kZ_\ell/R_0$. Small and easy, but a soft cutoff.
> 4. **Bandpass filters are resonators coupled by inverters.** A $J$ (or $K$) inverter turns a shunt resonator into a series one, so one kind of resonator suffices: $\lambda/2$ lines between coupled-line sections, gaps, or $\lambda/4$ stubs.
> 5. **Coupled-line bandpass** (up to about 20% bandwidth): $N+1$ quarter-wave sections with $Z_0J_1=\sqrt{\pi\Delta/2g_1}$, $Z_0J_n=\pi\Delta/(2\sqrt{g_{n-1}g_n})$, $Z_{0e,0o}=Z_0[1\pm JZ_0+(JZ_0)^2]$.
> 6. **Loss:** $\boxed{IL_0\approx 4.343\,\dfrac{\sum g_k}{\Delta\,Q_u}\ \text{dB}}$. Narrow bands and low resonator $Q_u$ cost passband loss, and in front of an LNA every dB of it is a dB of noise figure.

**Map:** [[#Physics background|lines as reactances, inverters, periodicity]] → [[#Spec translation|filter spec → order → lines → IL → LNA budget]] → [[#Level 0 The Distributed Toolkit|Richards, unit elements, Kuroda, inverters]] → [[#Level 1 Low-Pass Filters|stub LPF, stepped-impedance LPF]] → [[#Level 2 Bandpass and Bandstop Filters|coupled-line, λ/4 stubs, gap-coupled, ceramic]] → [[#Level 3 Losses and Real Layouts|$Q_u$, IL, microstrip effects]] → [[#Level 4 Measuring and Tuning|VNA, $Q_u$ extraction, tuning]].

## Physics background

A line section is a reactance whose value depends on frequency through $\tan\beta\ell$. Three facts from earlier notes carry the whole chapter:

$$
\boxed{Z_{in}^{SC}=jZ_0\tan\beta\ell,\qquad Z_{in}^{OC}=-jZ_0\cot\beta\ell,\qquad Z_{in}^{\lambda/4}=\frac{Z_0^2}{Z_L}}
$$

- **Stubs are reactances.** A shorted stub shorter than $\lambda/4$ is inductive, an open one capacitive. That is all Richards' transformation uses.
- **A quarter-wave line inverts impedance.** $Z_0^2/Z_L$ turns a series resonator into a shunt one: it is an impedance (or admittance) inverter.
- **Everything distributed is periodic.** $\tan\beta\ell$ repeats every time $\beta\ell$ advances by $\pi$, so a line filter always has spurious passbands at multiples of its design frequency.

> [!tip] Remark
> The stub impedances and the quarter-wave transformer come from [[Transmission Lines#Transmission Line Input Impedance]] and [[Smith Chart and Impedance Matching#Quarter-Wave Transformer]]. Why a component becomes "distributed" once it is a sizeable fraction of a wavelength is in [[EM Foundations#Level 0 Lumped vs Distributed]]. The $\lambda/4$ and $\lambda/2$ line resonators and their $Q_0=\beta/2\alpha$ are owned by [[Microwave Resonators#Level 1 Transmission-Line Resonators]].

> [!tip] Remark
> Two coupled strips carry an even mode ($Z_{0e}$) and an odd mode ($Z_{0o}$). Their definitions are in [[Transmission Lines#Coupled Lines and Differential Pairs]], and the same pair of numbers designs the coupled-line coupler in [[Power Dividers and Couplers#Coupled-Line Coupler]]. In a filter we use the section at its other two ports.

The cascade algebra throughout is ABCD matrices ([[Microwave Network Analysis#ABCD Parameters]]). A line of impedance $Z_1$ and length $\ell$, written with $\Omega=\tan\beta\ell$:

$$
\boxed{\begin{bmatrix}A&B\\C&D\end{bmatrix}_{UE}=\frac{1}{\sqrt{1+\Omega^2}}\begin{bmatrix}1&j\Omega Z_1\\ j\Omega/Z_1&1\end{bmatrix}}
$$

> [!note]- Detail: periodic structures, briefly (Pozar §8.1)
> A line periodically loaded with a shunt susceptance $b$ (normalized) every $d$ is a cascade of identical cells. A wave must repeat cell to cell up to a factor $e^{-\gamma d}$, which forces
> $$\cosh\gamma d=\frac{A+D}{2}=\cos\theta-\frac b2\sin\theta,\qquad \theta=kd.$$
> Where the right side lies in $[-1,1]$, $\gamma=j\beta$: a **passband** (Bloch wave, slower than the unloaded line). Where it exceeds 1 in magnitude, $\gamma=\alpha$ (or $\alpha+j\pi$): a **stopband**, in which a lossless structure reflects the power instead of absorbing it. The wave impedance at the cell terminals, the **Bloch impedance** $Z_B=\pm BZ_0/\sqrt{A^2-1}$ for a symmetric cell, is real in a passband and imaginary in a stopband. A loaded line is thus already a filter; the image-parameter method below makes that a design method. Periodic structures are also used as slow-wave lines and in traveling-wave tubes and phase shifters.

> [!note]- Detail: the image-parameter method, briefly (Pozar §8.2)
> Older than the insertion-loss method of [[Filters]], and still a useful way to think about cascades. A two-port terminated in its **image impedances** $Z_{i1}=\sqrt{AB/CD}$, $Z_{i2}=\sqrt{BD/AC}$ is matched at both ends; its propagation factor is $\cosh\gamma=\sqrt{AD}$. Cascade sections with equal image impedances at each junction.
> - **Constant-$k$ low-pass section** (series $L$, shunt $C$): $\omega_c=2/\sqrt{LC}$, $R_0=\sqrt{L/C}=k$. Slow attenuation past cutoff and an image impedance that drifts with frequency.
> - **$m$-derived section** ($0<m<1$): replaces $Z_1\to mZ_1$ and adds an inductor in the shunt arm; it has an infinite-attenuation pole at $\omega_\infty=\omega_c/\sqrt{1-m^2}$ (the shunt series-LC resonance), but its attenuation falls again above $\omega_\infty$.
> - **Composite filter:** constant-$k$ section (deep attenuation far out) + $m$-derived section (sharp cutoff) + bisected $m$-derived end sections with $m=0.6$ (flattest image impedance) to match to $R_0$.
>
> The weakness: the design only holds when every section sees its image impedance, which a real resistive source and load do not provide, so the response must be iterated. The insertion-loss method specifies the whole response directly, which is why every design below starts from a $g_k$ prototype.

## Spec translation

A passive filter contains no amplifier, so its own specs are set by geometry. The translation runs two ways: the filter spec fixes the prototype and the lines, and the filter's **loss and rejection** fix what the amplifiers around it (the LNA, the mixer) must achieve.

**Block specs** (binder pp. 258–261; Pozar §8.3–8.8): cutoff $f_c$ (low-pass) or centre $f_0$ and fractional bandwidth $\Delta=(f_2-f_1)/f_0$; passband ripple; rejection (attenuation $A_s$ at a stated frequency $f_s$); passband insertion loss $IL_0$; return loss; spurious-free range (the next passband); power handling; size.

```tikz title="Spec translation chain: each block spec fixes one design number, and the filter's loss and rejection become specs of the LNA and mixer. After binder p. 277 and Pozar Fig. 10.10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,rounded corners=2pt,fill=gray!8,align=center,font=\scriptsize,text width=2.5cm,minimum height=1.2cm}}
  \node[b] (a) at (0,0) {ripple, $A_s$ at $f_s$,\\ $f_c$ or $f_0$, $\Delta$};
  \node[b] (b) at (3.3,0) {map $f_s$ to LP:\\ $|\omega/\omega_c|-1$\\ $\Rightarrow N$, $g_k$};
  \node[b] (c) at (6.6,0) {topology $\Rightarrow$\\ $Z_0$'s, $\theta$'s,\\ $Z_{0e}$, $Z_{0o}$, gaps};
  \node[b] (d) at (9.9,0) {substrate, $Q_u$\\ $\Rightarrow IL_0$};
  \node[b,fill=red!6] (e) at (13.2,0) {LNA: NF, gain,\\ IIP3, $S_{11}$/$S_{22}$};
  \draw[->] (a) -- (b); \draw[->] (b) -- (c); \draw[->] (c) -- (d); \draw[->] (d) -- (e);
  \node[font=\scriptsize,align=center] at (3.3,-1.1) {Filters note,\\ Pozar Figs.\ 8.26--8.27};
  \node[font=\scriptsize] at (6.6,-1.0) {this note, Levels 0--2};
  \node[font=\scriptsize] at (9.9,-1.0) {Level 3};
  \node[font=\scriptsize] at (13.2,-1.0) {RF Noise and Distortion};
\end{circuitikz}
\end{document}
```

| Filter spec | Set inside the filter by | What it demands of the amplifiers around it |
|---|---|---|
| Rejection $A_s$ at $f_s$ (blockers, image, TX leakage) | Order $N$ and ripple; distributed realizations differ from the prototype far from $f_c$ | What is left reaches the LNA and mixer: their **IIP3** and $P_{1dB}$ must handle the attenuated blocker |
| Passband $IL_0$ | $\sum g_k$, $\Delta$, resonator $Q_u$ (substrate, conductor, line width) | **Filter before the LNA:** LNA noise figure budget shrinks dB-for-dB. **Filter after:** LNA **gain** must make the filter's noise contribution small |
| Ripple | Prototype choice; approximations of the distributed design add a little | Gain flatness the LNA and later stages must tolerate |
| Return loss at both ports | Design assumes $Z_0$ source and load (doubly terminated) | LNA **input/output match** to $Z_0$, otherwise the passband ripple and edges move |
| Spurious passbands ($2\omega_c$, $3f_0$, ...) | Commensurate line lengths (Richards periodicity) | A second (lumped or low-pass) filter, or LNA/mixer linearity at those frequencies |
| Power handling | Line widths, gaps, $Q_u$ (stored energy) | Mostly a TX-side constraint on the PA's output filter |

$$
\boxed{NF_{\text{LNA}}\le NF_{\text{target}}-IL_0\ \ (\text{dB, filter first})}\qquad
\boxed{F=F_{\text{LNA}}+\frac{L_f-1}{G_{\text{LNA}}}+\dots\ \ (\text{filter after the LNA})}
$$

> [!note]- Derivation: why filter loss is noise figure, dB for dB
> A matched passive two-port with loss $L$ ($=1/G$) at the reference temperature $T_0$ has noise figure $F=L$ (Pozar §10.2: the thermodynamic argument for a lossy line or attenuator). Friis for a cascade (Pozar Eq. 10.23): $F=F_1+(F_2-1)/G_1+\dots$. With the filter first, $F=L_f+(F_{\text{LNA}}-1)L_f=L_fF_{\text{LNA}}$, i.e. $NF=IL_0+NF_{\text{LNA}}$ in dB. With the filter after an LNA of gain $G$, its contribution is $(L_f-1)/G$, small if $G$ is large. Mismatch at the filter's ports changes this; Pozar §10.2 has the general mismatched form. Friis, noise temperature and the sensitivity budget are owned by [[RF Noise and Distortion]].

| Amplifier spec the filter sets | Lands on | Sizing knob |
|---|---|---|
| LNA NF $\le NF_{\text{target}}-IL_0$ | Input device noise ($\gamma/g_m$) and matching-network loss | Higher $g_m$ at the input: $g_m/I_D$ and $I_D$ |
| LNA gain $G\gg L_f-1$ (filter after LNA) | Transconductance into the load | $g_m$, load $R_P$; current |
| LNA/mixer IIP3 against the residual blocker $P_{blk}-A_s$ | Overdrive of the signal path | Lower $g_m/I_D$ (larger $V_{OV}$), degeneration |
| $S_{11}$, $S_{22}$ to $Z_0$ | Input/output matching networks | Device size sets $C_{gs}$, which sets the match ([[RF Amplifier Design]]) |

> [!tip] Remark
> These are the receiver's noise, linearity and match specs; how a target NF or IIP3 becomes $W$, $L$ and $I_D$ is [[gm-ID Design Methodology]], and the LNA design itself is [[RF Amplifier Design]]. Cascaded IIP3 and dynamic range are owned by [[RF Noise and Distortion]].

> [!example] Worked: the same 1 dB filter before or after the LNA (Pozar Ex. 10.2, extended)
> Pozar's receiver: LNA $G_a=10$ dB, $NF_a=2$ dB; bandpass filter $L_f=1$ dB; mixer $L_m=3$ dB, $NF_m=4$ dB.
> - **LNA → filter → mixer** (Pozar's order): $F=1.58+\frac{0.26}{10}+\frac{1.51}{10\cdot0.79}=1.80$, **NF = 2.55 dB**.
> - **Filter → LNA → mixer** (computed here, same blocks): $F=1.26+\frac{0.58}{0.79}+\frac{1.51}{0.79\cdot10}=2.19$, **NF = 3.40 dB**.
>
> Moving the filter ahead of the LNA costs 0.85 dB of noise figure, almost all of its 1 dB loss. It is still often done, because a preselect filter keeps strong out-of-band signals out of the LNA (the IIP3 row of the table). That trade, low $IL_0$ versus rejection, is what the rest of this note optimizes.

> [!example] Worked: from spec to lines to LNA budget (Pozar Ex. 8.7, extended)
> **Spec:** bandpass, $f_0=2$ GHz, $\Delta=10\%$, 0.5 dB ripple, $Z_0=50\ \Omega$; Pozar fixes $N=3$ and asks for the attenuation at 1.8 GHz.
> 1. **Order:** 1.8 GHz maps to $\Omega=\frac1{0.1}\left(\frac{1.8}{2}-\frac{2}{1.8}\right)=-2.11$, $|\Omega|-1=1.11$: about 20 dB for $N=3$ (Pozar Fig. 8.27a). The exact Chebyshev value is 20.8 dB; the distributed filter gives 19.4 dB (computed here, [[#Coupled-Line Filter]]).
> 2. **Lines:** $g=1.5963, 1.0967, 1.5963, 1$ → $Z_{0e}/Z_{0o}=70.61/39.24$, $56.64/44.77$, $56.64/44.77$, $70.61/39.24\ \Omega$, each $\lambda/4$ at 2 GHz.
> 3. **Loss** (computed here, [[#Insertion Loss from Finite Q]]): $\sum g_k=4.289$, so $IL_0\approx186/Q_u$ dB: 0.24 dB with microstrip resonators of $Q_u=783$ (the $Q_0$ of Pozar Ex. 6.2), 0.08 dB at $Q_u=2380$ (air coax, Ex. 6.1).
> 4. **LNA budget:** put this filter ahead of the 2 dB LNA of Pozar Ex. 10.2 and the front end starts at **2.24 dB** (microstrip resonators) or **2.08 dB** (coax) before the later stages add anything. Turned around: whatever NF target the system sets, the LNA gets that target minus $IL_0$.

## Level 0: The Distributed Toolkit

Four tools turn a lumped ladder into lines. Richards replaces each element by a stub; unit elements and Kuroda's identities move and reshape the stubs; inverters let a bandpass filter use only one kind of resonator.

### Richards' Transformation

```tikz title="Richards' transformation. Left: an inductor becomes a short-circuited stub, a capacitor an open-circuited stub, both lambda/8 long at the cutoff. Right: the new frequency variable Omega = tan(beta l) is 1 at w_c, infinite at 2w_c (an attenuation pole) and repeats every 4w_c. After Pozar Fig. 8.34 and binder pp. 294-295."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) to[L,l=$L$] (1.8,3);
  \node at (2.4,3) {$\Rightarrow$};
  \draw[very thick] (3,3.25) -- (5.6,3.25); \draw[very thick] (3,2.75) -- (5.6,2.75); \draw[very thick] (5.6,2.75) -- (5.6,3.25);
  \node[font=\scriptsize] at (4.3,3.55) {$\lambda/8$ at $\omega_c$};
  \node[font=\scriptsize] at (4.3,2.45) {S.C., $Z_0=L$};
  \node[font=\scriptsize,anchor=west] at (5.7,3) {$jX=jL\Omega$};
  \draw (0.9,1.4) to[C,l=$C$] (0.9,0);
  \node at (2.4,0.7) {$\Rightarrow$};
  \draw[very thick] (3,0.95) -- (5.6,0.95); \draw[very thick] (3,0.45) -- (5.6,0.45);
  \node[font=\scriptsize] at (4.3,1.25) {$\lambda/8$ at $\omega_c$};
  \node[font=\scriptsize] at (4.3,0.15) {O.C., $Z_0=1/C$};
  \node[font=\scriptsize,anchor=west] at (5.7,0.7) {$jB=jC\Omega$};
  \begin{scope}[xshift=8.4cm,yshift=0.2cm]
    \draw[->] (0,0) -- (5.6,0) node[right] {$\omega/\omega_c$};
    \draw[->] (0,-1.2) -- (0,3.4) node[above] {$\Omega=\tan\beta\ell$};
    \draw[thick,blue,domain=0:1.7,samples=40] plot (\x,{tan(45*\x)/1.2});
    \draw[thick,blue,domain=2.78:4,samples=60] plot (\x,{tan(45*\x)/1.2});
    \draw[thick,blue,domain=4:5.4,samples=40] plot (\x,{tan(45*\x)/1.2});
    \draw[dashed] (1,0) -- (1,0.833) -- (0,0.833) node[left,font=\scriptsize] {$1$};
    \draw[dashed] (2,-1.2) -- (2,3.3); \node[font=\scriptsize,below right] at (2,0) {$2$};
    \node[font=\scriptsize,below] at (1,0) {$1$};
    \node[font=\scriptsize,below] at (4,0) {$4$};
    \node[font=\scriptsize,align=center] at (2.9,2.9) {pole: stubs $\lambda/4$};
    \node[font=\scriptsize,align=center] at (4.6,-0.8) {repeats};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Omega=\tan\beta\ell,\qquad L\ \to\ \text{S.C. stub}\ Z_0=L,\qquad C\ \to\ \text{O.C. stub}\ Z_0=\frac1C,\qquad \ell=\frac{\lambda}{8}\text{ at }\omega_c}
$$

- **Why $\lambda/8$:** the prototype cuts off at $\Omega=1$, and $\tan\beta\ell=1$ at $\beta\ell=\pi/4$.
- **Commensurate lines:** every stub has the same length. That is what makes the result exact at $\omega_c$ and periodic everywhere: an attenuation pole at $2\omega_c$ (stubs $\lambda/4$), the whole response repeating every $4\omega_c$.
- **Work normalized** ($g_k$, $Z_0=1$) until the last step, then multiply every impedance by $R_0$ and cut every line to $\lambda/8$ at $f_c$.

> [!tip] Remark
> The stub reactances $jZ_0\tan\beta\ell$ and $-jZ_0\cot\beta\ell$ are those of [[Transmission Lines#Transmission Line Input Impedance]]; Richards just renames $\tan\beta\ell$ as a frequency. The HP/BP transformations of [[Filters#LP → HP, BP, BS]] do the same thing with a different mapping function.

> [!note]- Detail: Richards straight from the scaled ladder, the binder's delay form (binder pp. 294–297)
> The binder applies Richards **after** impedance and frequency scaling: each stub then has a delay $T$ (here $T=25$ ps for a 5 GHz cutoff, i.e. $\lambda/8$) and the stub impedances are read directly off the scaled element values: a shunt capacitor of value $c$ becomes an open stub $Z_0=1/c$, an inductor of value $l$ a shorted stub $Z_0=l$, with $c$ and $l$ the impedance-scaled (not frequency-scaled) values. Example: 5th-order, 1 dB ripple, 5 GHz, 50 Ω. Prototype $C=2.13,\ L=1.099,\ C=3.0,\ L=1.099,\ C=2.13$; scaled by 50: $C=0.0426,\ L=54.95,\ C=0.06$, so open stubs of $23.47\ \Omega$ and $16.66\ \Omega$ and shorted stubs of $54.95\ \Omega$, all 25 ps long. Its plotted response is flat to 5 GHz and about $-40$ dB near 7 GHz (binder p. 297). It cannot be built as drawn (all stubs meet at one point, and the series shorted stubs have no ground in microstrip), which is what Kuroda fixes next.

### Unit Elements and Kuroda's Identities

```tikz title="The two Kuroda identities used in practice. A unit element (UE, a lambda/8 line) lets a stub move to its other side and change type: (a) a shunt open stub becomes a series shorted stub, (b) a series shorted stub becomes a shunt open stub. n^2 = 1 + Z2/Z1. Verified here by multiplying ABCD matrices; after Pozar Table 8.7 and Fig. 8.35."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{ue/.style={draw,fill=gray!15,minimum width=1.3cm,minimum height=0.9cm,align=center,font=\scriptsize},
           st/.style={draw,fill=blue!8,minimum width=0.9cm,minimum height=0.55cm,align=center,font=\scriptsize}}
  % (a)
  \node at (-1.0,0.45) {(a)};
  \draw (0,0.9) -- (3.6,0.9); \draw (0,0) -- (3.6,0);
  \node[st,rotate=90] at (0.8,0.45) {O.C. $Z_2$};
  \node[ue] at (2.4,0.45) {UE\\ $Z_1$};
  \node at (4.2,0.45) {$\equiv$};
  \draw (4.8,0.9) -- (8.6,0.9); \draw (4.8,0) -- (8.6,0);
  \node[ue] at (5.9,0.45) {UE\\ $Z_2/n^2$};
  \node[st] at (7.7,0.9) {S.C. $Z_1/n^2$};
  % (b)
  \begin{scope}[yshift=-2.0cm]
    \node at (-1.0,0.45) {(b)};
    \draw (0,0.9) -- (3.6,0.9); \draw (0,0) -- (3.6,0);
    \node[ue] at (1.0,0.45) {UE\\ $Z_2$};
    \node[st] at (2.8,0.9) {S.C. $Z_1$};
    \node at (4.2,0.45) {$\equiv$};
    \draw (4.8,0.9) -- (8.6,0.9); \draw (4.8,0) -- (8.6,0);
    \node[st,rotate=90] at (5.6,0.45) {O.C. $n^2Z_2$};
    \node[ue] at (7.4,0.45) {UE\\ $n^2Z_1$};
  \end{scope}
  \node[font=\scriptsize,align=left,anchor=west] at (9.0,-0.55) {$n^2=1+\dfrac{Z_2}{Z_1}$\\[2pt] every line and stub\\ $\lambda/8$ at $\omega_c$};
\end{circuitikz}
\end{document}
```

$$
\boxed{n^2=1+\frac{Z_2}{Z_1}\qquad\text{(a) O.C. }Z_2\,|\,\text{UE }Z_1\ \equiv\ \text{UE }\tfrac{Z_2}{n^2}\,|\,\text{S.C. }\tfrac{Z_1}{n^2}\qquad\text{(b) UE }Z_2\,|\,\text{S.C. }Z_1\ \equiv\ \text{O.C. }n^2Z_2\,|\,\text{UE }n^2Z_1}
$$

- **Unit element (UE):** a line $\lambda/8$ long at $\omega_c$, commensurate with the stubs. Placed at a port and matched to it ($Z=1$), it only adds delay, so it can be inserted for free (**redundant synthesis**).
- **What Kuroda buys:** physically separated stubs, series stubs converted to shunt stubs (microstrip can't ground a series stub), and impractical impedances moved to realizable ones.
- **Recipe:** add UEs of $Z=1$ at both ends; apply the identity that pushes each series stub through the UE next to it; repeat inward until only shunt stubs remain.
- Kuroda works for **low-pass and bandstop**, not for high-pass or bandpass (Pozar §8.5).

> [!note]- Derivation: identity (a) by ABCD matrices (Pozar Eqs. 8.79–8.80; binder pp. 298–299)
> Left side: shunt open stub, admittance $j\Omega/Z_2$, then UE $Z_1$:
> $$\begin{bmatrix}1&0\\ \frac{j\Omega}{Z_2}&1\end{bmatrix}\frac{1}{\sqrt{1+\Omega^2}}\begin{bmatrix}1&j\Omega Z_1\\ \frac{j\Omega}{Z_1}&1\end{bmatrix}=\frac{1}{\sqrt{1+\Omega^2}}\begin{bmatrix}1&j\Omega Z_1\\ j\Omega\left(\frac1{Z_1}+\frac1{Z_2}\right)&1-\Omega^2\frac{Z_1}{Z_2}\end{bmatrix}$$
> Right side: UE $Z_u$, then series shorted stub $j\Omega Z_s$:
> $$\frac{1}{\sqrt{1+\Omega^2}}\begin{bmatrix}1&j\Omega Z_u\\ \frac{j\Omega}{Z_u}&1\end{bmatrix}\begin{bmatrix}1&j\Omega Z_s\\0&1\end{bmatrix}=\frac{1}{\sqrt{1+\Omega^2}}\begin{bmatrix}1&j\Omega(Z_u+Z_s)\\ \frac{j\Omega}{Z_u}&1-\Omega^2\frac{Z_s}{Z_u}\end{bmatrix}$$
> Match the entries: $Z_u+Z_s=Z_1$, $\frac1{Z_u}=\frac1{Z_1}+\frac1{Z_2}$, $\frac{Z_s}{Z_u}=\frac{Z_1}{Z_2}$. Solution: $Z_u=\frac{Z_1Z_2}{Z_1+Z_2}=\frac{Z_2}{n^2}$, $Z_s=\frac{Z_1}{n^2}$ with $n^2=1+Z_2/Z_1$. Identity (b) is (a) read backwards with the labels renamed. Both were checked numerically here at several $\Omega$.

> [!note]- Detail: identities (c) and (d), with transformers (Pozar Table 8.7)
> The other two identities move a **series** shorted stub (c) or a **shunt** open stub (d) through a UE of the same kind, at the price of an ideal transformer $1:n^2$ (or $n^2:1$) with $n^2=1+Z_2/Z_1$. Transformers are not free in microstrip, so (a) and (b) do the everyday work; (c) and (d) are used where an impedance-level change is wanted anyway.

### Impedance and Admittance Inverters

```tikz title="Inverters. (a) An impedance inverter K makes a load look like its inverse; an admittance inverter J does the same for admittances. (b) A quarter-wave line is the simplest one. (c) A series capacitor between two negative-length lines is an admittance inverter, which is how a coupling gap works. (d) Pure capacitor networks. After Pozar Fig. 8.38 and binder p. 310."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{bx/.style={draw,fill=gray!12,minimum width=1.2cm,minimum height=1.0cm,align=center,font=\scriptsize}}
  % (a)
  \node at (-0.6,1.6) {(a)};
  \draw (0,1.0) -- (0.6,1.0); \draw (0,0) -- (0.6,0);
  \node[bx] at (1.2,0.5) {$K$\\ $\pm90^\circ$};
  \draw (1.8,1.0) -- (2.4,1.0) to[generic,l=$Z_L$] (2.4,0) -- (1.8,0);
  \node[font=\scriptsize] at (1.2,-0.5) {$Z_{in}=K^2/Z_L$};
  \draw (4.0,1.0) -- (4.6,1.0); \draw (4.0,0) -- (4.6,0);
  \node[bx] at (5.2,0.5) {$J$\\ $\pm90^\circ$};
  \draw (5.8,1.0) -- (6.4,1.0) to[generic,l=$Y_L$] (6.4,0) -- (5.8,0);
  \node[font=\scriptsize] at (5.2,-0.5) {$Y_{in}=J^2/Y_L$};
  % (b)
  \node at (8.2,1.6) {(b)};
  \draw[very thick] (8.6,1.0) -- (10.8,1.0); \draw[very thick] (8.6,0.2) -- (10.8,0.2);
  \node[font=\scriptsize] at (9.7,1.3) {$\lambda/4$};
  \node[font=\scriptsize] at (9.7,-0.2) {$Z_0=K$ (or $Y_0=J$)};
  % (c)
  \begin{scope}[yshift=-3.0cm]
    \node at (-0.6,1.6) {(c)};
    \draw[very thick] (0,1.0) -- (1.8,1.0); \draw[very thick] (2.4,1.0) -- (4.2,1.0);
    \draw (1.8,1.0) to[C,l=$jB$] (2.4,1.0);
    \draw[very thick] (0,0.2) -- (4.2,0.2);
    \draw[<->] (0,1.5) -- (1.8,1.5) node[midway,above,font=\scriptsize] {$\phi/2<0$};
    \draw[<->] (2.4,1.5) -- (4.2,1.5) node[midway,above,font=\scriptsize] {$\phi/2<0$};
    \node[font=\scriptsize,align=left,anchor=west] at (4.5,0.6) {$J=Y_0\tan|\phi/2|$\\ $B=\dfrac{J}{1-(J/Y_0)^2}$\\ $\phi=-\tan^{-1}\dfrac{2B}{Y_0}$};
  % (d)
    \node at (8.0,1.6) {(d)};
    \draw (8.2,1.0) -- (8.8,1.0) to[C,l=$C$] (10.8,1.0) -- (11.4,1.0);
    \draw (8.2,-0.4) -- (11.4,-0.4);
    \draw (8.8,1.0) to[C,l_=$-C$] (8.8,-0.4);
    \draw (10.8,1.0) to[C,l=$-C$] (10.8,-0.4);
    \node[font=\scriptsize] at (9.8,-0.8) {$J=\omega C$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_{in}=\frac{K^2}{Z_L},\qquad Y_{in}=\frac{J^2}{Y_L},\qquad \begin{bmatrix}A&B\\C&D\end{bmatrix}_K=\begin{bmatrix}0&\pm jK\\ \pm j/K&0\end{bmatrix}}
$$

- An inverter turns a **series** resonator into a **shunt** one (and back). A bandpass ladder alternates series and shunt resonators; with inverters between them it can use only one kind, which is what a given line medium builds easily.
- **Best for narrow bands** (below about 10%): the realizations below are exact only at $\omega_0$.
- **The negative lengths are not a problem:** in (c) the $\phi/2<0$ lines are absorbed into the resonator lines on each side. That is exactly how a capacitive gap couples two $\lambda/2$ resonators ([[#Capacitive-Gap Coupled Resonators]]).

> [!tip] Remark
> Realization (b) is the [[Smith Chart and Impedance Matching#Quarter-Wave Transformer|quarter-wave transformer]] $Z_{in}=Z_0^2/Z_L$ at one frequency. A series gap acting as an inverter is also why a gap-coupled $\lambda/2$ microstrip resonator looks like a series RLC: [[Microwave Resonators#Gap-Coupled Microstrip Resonator]].

## Level 1: Low-Pass Filters

### Stub Low-Pass Filter

Richards + Kuroda, start to finish. This is Pozar Ex. 8.5.

```tikz title="Design steps of Pozar Example 8.5 (normalized impedances). (a) 3-dB Chebyshev N=3 prototype. (b) Richards: series shorted stubs and a shunt open stub. (c) Unit elements added at both ends. (d) Kuroda identity (b) at both ends leaves only shunt open stubs. After Pozar Fig. 8.36(a)-(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{ue/.style={draw,fill=gray!15,minimum width=1.1cm,minimum height=0.8cm,align=center,font=\scriptsize},
           st/.style={draw,fill=blue!8,minimum width=1.0cm,minimum height=0.5cm,align=center,font=\scriptsize}}
  % (a)
  \node at (-0.8,0.4) {(a)};
  \draw (0,0.8) to[L,l=$3.3487$] (2,0.8) to[L,l=$3.3487$] (4,0.8);
  \draw (2,0.8) to[C,l=$0.7117$] (2,0);
  \draw (0,0) -- (4,0);
  \node[font=\scriptsize,anchor=west] at (4.2,0.4) {$R_S=R_L=1$};
  % (b)
  \begin{scope}[yshift=-2.0cm]
    \node at (-0.8,0.4) {(b)};
    \draw (0,0.8) -- (4,0.8); \draw (0,0) -- (4,0);
    \node[st] at (0.9,0.8) {S.C. 3.3487};
    \node[st] at (3.1,0.8) {S.C. 3.3487};
    \node[st,rotate=90] at (2,0.4) {O.C. 1.405};
    \node[font=\scriptsize,anchor=west] at (4.2,0.4) {$1/0.7117=1.405$};
  \end{scope}
  % (c)
  \begin{scope}[yshift=-4.0cm]
    \node at (-0.8,0.4) {(c)};
    \draw (0,0.8) -- (7,0.8); \draw (0,0) -- (7,0);
    \node[ue] at (0.7,0.4) {UE 1};
    \node[st] at (2.1,0.8) {S.C. 3.3487};
    \node[st,rotate=90] at (3.5,0.4) {O.C. 1.405};
    \node[st] at (4.9,0.8) {S.C. 3.3487};
    \node[ue] at (6.3,0.4) {UE 1};
  \end{scope}
  % (d)
  \begin{scope}[yshift=-6.0cm]
    \node at (-0.8,0.4) {(d)};
    \draw (0,0.8) -- (7,0.8); \draw (0,0) -- (7,0);
    \node[st,rotate=90] at (0.5,0.4) {O.C. 1.299};
    \node[ue] at (1.9,0.4) {UE 4.350};
    \node[st,rotate=90] at (3.5,0.4) {O.C. 1.405};
    \node[ue] at (5.1,0.4) {UE 4.350};
    \node[st,rotate=90] at (6.5,0.4) {O.C. 1.299};
    \node[font=\scriptsize,anchor=west,align=left] at (7.2,0.4) {$n^2=1+\frac{1}{3.3487}=1.299$\\ UE: $n^2\cdot3.3487=4.350$\\ stub: $n^2\cdot1=1.299$};
  \end{scope}
\end{circuitikz}
\end{document}
```

```tikz title="Pozar Example 8.5 as a microstrip top view: 4 GHz cutoff, 50 ohm, every line lambda/8 at 4 GHz. Impedances are Pozar's; widths are drawn qualitatively (thin = high Z) because the example names no substrate. After Pozar Fig. 8.36(e)-(f)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!70] (0,-0.35) rectangle (1.6,0.35);
  \fill[orange!70] (1.6,-0.06) rectangle (4.6,0.06);
  \fill[orange!70] (4.6,-0.06) rectangle (7.6,0.06);
  \fill[orange!70] (7.6,-0.35) rectangle (9.2,0.35);
  \fill[orange!70] (1.35,0) rectangle (1.85,3.0);
  \fill[orange!70] (4.37,0) rectangle (4.83,3.0);
  \fill[orange!70] (7.35,0) rectangle (7.85,3.0);
  \node[font=\scriptsize] at (0.8,-0.65) {50 $\Omega$};
  \node[font=\scriptsize] at (8.4,-0.65) {50 $\Omega$};
  \node[font=\scriptsize] at (3.1,-0.4) {217.5 $\Omega$};
  \node[font=\scriptsize] at (6.1,-0.4) {217.5 $\Omega$};
  \node[font=\scriptsize,anchor=east] at (1.3,2.4) {64.9 $\Omega$};
  \node[font=\scriptsize,anchor=west] at (4.9,2.4) {70.3 $\Omega$};
  \node[font=\scriptsize,anchor=west] at (7.9,2.4) {64.9 $\Omega$};
  \draw[<->] (1.6,0.5) -- (4.6,0.5) node[midway,above,font=\scriptsize] {$\lambda/8$};
  \draw[<->] (9.6,0) -- (9.6,3.0) node[midway,right,font=\scriptsize] {$\lambda/8$};
  \node[font=\scriptsize] at (4.6,3.35) {open ends};
  \node[font=\scriptsize,align=center] at (4.6,-1.3) {the series lines are the unit elements (217.5 = $50\times4.350$), the three stubs the capacitors};
\end{circuitikz}
\end{document}
```

> [!example] Pozar Ex. 8.5: microstrip stub low-pass
> **Spec:** $f_c=4$ GHz, 50 Ω, third-order, 3 dB equal ripple.
> 1. Table 8.4: $g_1=L_1=3.3487$, $g_2=C_2=0.7117$, $g_3=L_3=3.3487$, $g_4=1$.
> 2. Richards: series shorted stubs $Z_0=3.3487$, shunt open stub $Z_0=1/0.7117=1.405$.
> 3. Add UEs of $Z=1$ at both ends; Kuroda (b) with $n^2=1.299$ at both ends.
> 4. Scale by 50 Ω: open stubs **64.9, 70.3, 64.9 Ω**, series lines **217.5 Ω**, all $\lambda/8$ at 4 GHz.
>
> Pozar notes the passband matches the lumped version up to 4 GHz with a **sharper** cutoff, and the response repeats every 16 GHz.

```tikz title="Attenuation of Pozar Example 8.5, computed here by cascading ideal-line ABCD matrices (blue), against the lumped prototype (gray dashed). The distributed filter is steeper (19 dB vs 12 dB at 5 GHz), has a pole at 8 GHz (2 f_c, plotted clipped at 40 dB) and repeats at 16 GHz. Compare Pozar Fig. 8.37."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=0.5]
  \draw[->] (0,0) -- (20.8,0) node[right] {$f$ (GHz)};
  \draw[->] (0,0) -- (0,3.4) node[above] {atten. (dB)};
  \foreach \y/\l in {0.75/10,1.5/20,2.25/30,3/40} { \draw (0,\y) -- (-0.25,\y) node[left,font=\scriptsize] {\l}; \draw[gray!30] (0,\y) -- (20,\y); }
  \foreach \x in {0,4,8,12,16,20} \draw (\x,0) -- (\x,-0.1) node[below,font=\scriptsize] {\x};
  \draw[gray,dashed,thick] plot coordinates {(0.100,0.002) (0.200,0.007) (0.300,0.016) (0.400,0.027) (0.500,0.041) (0.600,0.057) (0.700,0.073) (0.800,0.091) (0.900,0.108) (1.000,0.126) (1.100,0.142) (1.200,0.158) (1.300,0.173) (1.400,0.186) (1.500,0.197) (1.600,0.207) (1.700,0.215) (1.800,0.220) (1.900,0.224) (2.000,0.225) (2.100,0.224) (2.200,0.220) (2.300,0.213) (2.400,0.204) (2.500,0.192) (2.600,0.177) (2.700,0.159) (2.800,0.138) (2.900,0.115) (3.000,0.089) (3.100,0.063) (3.200,0.038) (3.300,0.017) (3.400,0.003) (3.500,0.001) (3.600,0.015) (3.700,0.046) (3.800,0.094) (3.900,0.155) (4.000,0.225) (4.100,0.300) (4.200,0.377) (4.300,0.454) (4.400,0.529) (4.500,0.602) (4.600,0.673) (4.700,0.742) (4.800,0.807) (4.900,0.870) (5.000,0.931) (5.100,0.989) (5.200,1.046) (5.300,1.100) (5.400,1.152) (5.500,1.203) (5.600,1.252) (5.700,1.299) (5.800,1.346) (5.900,1.390) (6.000,1.434) (6.100,1.476) (6.200,1.517) (6.300,1.557) (6.400,1.597) (6.500,1.635) (6.600,1.672) (6.700,1.709) (6.800,1.744) (6.900,1.779) (7.000,1.813) (7.100,1.847) (7.200,1.880) (7.300,1.912) (7.400,1.943) (7.500,1.974) (7.600,2.005) (7.700,2.035) (7.800,2.064) (7.900,2.093) (8.000,2.121) (8.100,2.149) (8.200,2.177) (8.300,2.204) (8.400,2.230) (8.500,2.257) (8.600,2.282) (8.700,2.308) (8.800,2.333) (8.900,2.358) (9.000,2.382) (9.100,2.406) (9.200,2.430) (9.300,2.453) (9.400,2.476) (9.500,2.499) (9.600,2.522) (9.700,2.544) (9.800,2.566) (9.900,2.588) (10.000,2.609) (10.100,2.630) (10.200,2.651) (10.300,2.672) (10.400,2.692) (10.500,2.713) (10.600,2.733) (10.700,2.752) (10.800,2.772) (10.900,2.791) (11.000,2.811) (11.100,2.830) (11.200,2.848) (11.300,2.867) (11.400,2.885) (11.500,2.903) (11.600,2.922) (11.700,2.939) (11.800,2.957) (11.900,2.975) (12.000,2.992) (12.100,3.000) (12.200,3.000) (12.300,3.000) (12.400,3.000) (12.500,3.000) (12.600,3.000) (12.700,3.000) (12.800,3.000) (12.900,3.000) (13.000,3.000) (13.100,3.000) (13.200,3.000) (13.300,3.000) (13.400,3.000) (13.500,3.000) (13.600,3.000) (13.700,3.000) (13.800,3.000) (13.900,3.000) (14.000,3.000) (14.100,3.000) (14.200,3.000) (14.300,3.000) (14.400,3.000) (14.500,3.000) (14.600,3.000) (14.700,3.000) (14.800,3.000) (14.900,3.000) (15.000,3.000) (15.100,3.000) (15.200,3.000) (15.300,3.000) (15.400,3.000) (15.500,3.000) (15.600,3.000) (15.700,3.000) (15.800,3.000) (15.900,3.000) (16.000,3.000) (16.100,3.000) (16.200,3.000) (16.300,3.000) (16.400,3.000) (16.500,3.000) (16.600,3.000) (16.700,3.000) (16.800,3.000) (16.900,3.000) (17.000,3.000) (17.100,3.000) (17.200,3.000) (17.300,3.000) (17.400,3.000) (17.500,3.000) (17.600,3.000) (17.700,3.000) (17.800,3.000) (17.900,3.000) (18.000,3.000) (18.100,3.000) (18.200,3.000) (18.300,3.000) (18.400,3.000) (18.500,3.000) (18.600,3.000) (18.700,3.000) (18.800,3.000) (18.900,3.000) (19.000,3.000) (19.100,3.000) (19.200,3.000) (19.300,3.000) (19.400,3.000) (19.500,3.000) (19.600,3.000) (19.700,3.000) (19.800,3.000) (19.900,3.000) (20.000,3.000)};
  \draw[blue,thick] plot coordinates {(0.100,0.001) (0.200,0.004) (0.300,0.010) (0.400,0.017) (0.500,0.026) (0.600,0.037) (0.700,0.049) (0.800,0.062) (0.900,0.076) (1.000,0.090) (1.100,0.104) (1.200,0.119) (1.300,0.133) (1.400,0.147) (1.500,0.160) (1.600,0.173) (1.700,0.184) (1.800,0.195) (1.900,0.204) (2.000,0.212) (2.100,0.218) (2.200,0.222) (2.300,0.225) (2.400,0.225) (2.500,0.223) (2.600,0.218) (2.700,0.210) (2.800,0.199) (2.900,0.184) (3.000,0.164) (3.100,0.141) (3.200,0.113) (3.300,0.082) (3.400,0.050) (3.500,0.020) (3.600,0.002) (3.700,0.006) (3.800,0.045) (3.900,0.120) (4.000,0.225) (4.100,0.346) (4.200,0.474) (4.300,0.603) (4.400,0.730) (4.500,0.854) (4.600,0.974) (4.700,1.091) (4.800,1.206) (4.900,1.318) (5.000,1.428) (5.100,1.537) (5.200,1.645) (5.300,1.753) (5.400,1.861) (5.500,1.970) (5.600,2.079) (5.700,2.190) (5.800,2.302) (5.900,2.417) (6.000,2.535) (6.100,2.656) (6.200,2.781) (6.300,2.910) (6.400,3.000) (6.500,3.000) (6.600,3.000) (6.700,3.000) (6.800,3.000) (6.900,3.000) (7.000,3.000) (7.100,3.000) (7.200,3.000) (7.300,3.000) (7.400,3.000) (7.500,3.000) (7.600,3.000) (7.700,3.000) (7.800,3.000) (7.900,3.000) (8.000,3.000) (8.100,3.000) (8.200,3.000) (8.300,3.000) (8.400,3.000) (8.500,3.000) (8.600,3.000) (8.700,3.000) (8.800,3.000) (8.900,3.000) (9.000,3.000) (9.100,3.000) (9.200,3.000) (9.300,3.000) (9.400,3.000) (9.500,3.000) (9.600,3.000) (9.700,2.910) (9.800,2.781) (9.900,2.656) (10.000,2.535) (10.100,2.417) (10.200,2.302) (10.300,2.190) (10.400,2.079) (10.500,1.970) (10.600,1.861) (10.700,1.753) (10.800,1.645) (10.900,1.537) (11.000,1.428) (11.100,1.318) (11.200,1.206) (11.300,1.091) (11.400,0.974) (11.500,0.854) (11.600,0.730) (11.700,0.603) (11.800,0.474) (11.900,0.346) (12.000,0.225) (12.100,0.120) (12.200,0.045) (12.300,0.006) (12.400,0.002) (12.500,0.020) (12.600,0.050) (12.700,0.082) (12.800,0.113) (12.900,0.141) (13.000,0.164) (13.100,0.184) (13.200,0.199) (13.300,0.210) (13.400,0.218) (13.500,0.223) (13.600,0.225) (13.700,0.225) (13.800,0.222) (13.900,0.218) (14.000,0.212) (14.100,0.204) (14.200,0.195) (14.300,0.184) (14.400,0.173) (14.500,0.160) (14.600,0.147) (14.700,0.133) (14.800,0.119) (14.900,0.104) (15.000,0.090) (15.100,0.076) (15.200,0.062) (15.300,0.049) (15.400,0.037) (15.500,0.026) (15.600,0.017) (15.700,0.010) (15.800,0.004) (15.900,0.001) (16.000,-0.000) (16.100,0.001) (16.200,0.004) (16.300,0.010) (16.400,0.017) (16.500,0.026) (16.600,0.037) (16.700,0.049) (16.800,0.062) (16.900,0.076) (17.000,0.090) (17.100,0.104) (17.200,0.119) (17.300,0.133) (17.400,0.147) (17.500,0.160) (17.600,0.173) (17.700,0.184) (17.800,0.195) (17.900,0.204) (18.000,0.212) (18.100,0.218) (18.200,0.222) (18.300,0.225) (18.400,0.225) (18.500,0.223) (18.600,0.218) (18.700,0.210) (18.800,0.199) (18.900,0.184) (19.000,0.164) (19.100,0.141) (19.200,0.113) (19.300,0.082) (19.400,0.050) (19.500,0.020) (19.600,0.002) (19.700,0.006) (19.800,0.045) (19.900,0.120) (20.000,0.225)};
  \node[blue,font=\scriptsize] at (8,3.25) {pole};
  \node[font=\scriptsize,gray] at (15,2.75) {lumped};
  \node[font=\scriptsize,blue] at (17.6,1.0) {repeats};
\end{circuitikz}
\end{document}
```

> [!note]- Worked: the binder's 5 GHz, 5th-order all-stub version (binder pp. 298–302)
> Starting from the stub circuit of the previous fold (open stubs 23.47, 16.66, 23.47 Ω; shorted series stubs 54.95 Ω; delay 25 ps), the binder adds two 50 Ω UEs at each end and applies Kuroda twice per side. The final circuit is all shunt open stubs separated by UEs: stubs 123.4, 20.61, 16.66, 20.61, 123.4 Ω and UEs 84.02, 70.9 (or 70.1), 70.1, 84.02 Ω (the slide prints the inner UE both ways). Its simulated response matches the unconverted stub filter: flat to 5 GHz with about 1 dB ripple, roughly 40 dB down near 7 GHz.

### Stepped-Impedance Filter

A cheaper low-pass: no stubs at all, just alternating very high and very low impedance line.

```tikz title="Why a short line is a lumped element. Any line is exactly a T (series jX/2, shunt jB). Short and high-Z: B vanishes, a series inductor. Short and low-Z: X vanishes, a shunt capacitor. After Pozar Fig. 8.39 and binder p. 303."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1.4) to[L,l=$jX/2$] (1.8,1.4) to[L,l=$jX/2$] (3.6,1.4);
  \draw (1.8,1.4) to[C,l=$jB$] (1.8,0);
  \draw (0,0) -- (3.6,0);
  \node[font=\scriptsize,align=center] at (1.8,-0.7) {$\dfrac X2=Z_0\tan\dfrac{\beta\ell}2,\ \ B=\dfrac{\sin\beta\ell}{Z_0}$};
  \node at (4.4,0.7) {$\Rightarrow$};
  \draw (5.2,1.4) to[L,l={$X\simeq Z_0\beta\ell$}] (7.4,1.4);
  \draw (5.2,0) -- (7.4,0);
  \node[font=\scriptsize] at (6.3,-0.5) {short, $Z_0=Z_h$ large};
  \draw (8.4,1.4) -- (10.6,1.4); \draw (8.4,0) -- (10.6,0);
  \draw (9.5,1.4) to[C,l={$B\simeq Y_0\beta\ell$}] (9.5,0);
  \node[font=\scriptsize] at (9.5,-0.5) {short, $Z_0=Z_\ell$ small};
\end{circuitikz}
\end{document}
```

$$
\boxed{\beta\ell=\frac{g_k\,R_0}{Z_h}\ \ (\text{inductor}),\qquad \beta\ell=\frac{g_k\,Z_\ell}{R_0}\ \ (\text{capacitor}),\qquad \text{evaluated at }\omega_c}
$$

1. Pick $N$ from the attenuation spec and read $g_k$ ([[Filters#Prototype Tables]]).
2. Set $Z_h$ and $Z_\ell$ to the **highest and lowest impedances you can fabricate**: the larger $Z_h/Z_\ell$, the better the approximation.
3. Electrical lengths from the boxed equations; keep $\beta\ell<45^\circ$ where you can (the T-model is only approximate beyond that).
4. Widths from the microstrip synthesis equations, lengths from $\epsilon_e$ of each width.

- **Use it where a sharp cutoff isn't needed**, e.g. rejecting out-of-band mixer products (Pozar §8.6). It is smaller and simpler than a stub filter but rolls off more slowly far above $f_c$, because the short-line approximations break down there.
- Its spurious passbands are **not exactly periodic**: the sections are not commensurate.

> [!tip] Remark
> The binder writes the same mapping with delays: a short line of delay $T$ is $C=T/Z_0$ (low $Z_0$) or $L=Z_0T$ (high $Z_0$) (binder p. 303). Since $\beta\ell=\omega T$, this is the boxed equation with $\omega=\omega_c$. Microstrip $Z_0\to W$ synthesis and $\epsilon_e$ are owned by [[Transmission Lines#Microstrip Characteristic Impedance Synthesis]] and [[Transmission Lines#Microstrip Effective Dielectric Constant]].

> [!note]- Derivation: T-equivalent of a line section (Pozar Eqs. 8.81–8.85)
> From the line's ABCD matrix and the ABCD-to-Z conversion: $Z_{11}=Z_{22}=A/C=-jZ_0\cot\beta\ell$, $Z_{12}=Z_{21}=1/C=-jZ_0\csc\beta\ell$. A T has series arms $Z_{11}-Z_{12}=-jZ_0\frac{\cos\beta\ell-1}{\sin\beta\ell}=jZ_0\tan\frac{\beta\ell}2$ and shunt arm $Z_{12}$. So $X/2=Z_0\tan(\beta\ell/2)$, $B=\sin(\beta\ell)/Z_0$. For $\beta\ell<\pi/4$: $X\simeq Z_0\beta\ell$, $B\simeq Y_0\beta\ell$. With $Z_0$ large, $B$ is negligible (series $L$); with $Z_0$ small, $X$ is negligible (shunt $C$). Equate $X=\omega_cL_k'$ with $L_k'=R_0g_k/\omega_c$ to get $\beta\ell=g_kR_0/Z_h$; equate $B=\omega_cC_k'$ with $C_k'=g_k/(R_0\omega_c)$ to get $\beta\ell=g_kZ_\ell/R_0$.

> [!example] Pozar Ex. 8.6: stepped-impedance low-pass in microstrip
> **Spec:** maximally flat, $f_c=2.5$ GHz, >20 dB at 4 GHz, $R_0=50\ \Omega$, $Z_h=120\ \Omega$, $Z_\ell=20\ \Omega$. Substrate $d=0.158$ cm, $\epsilon_r=4.2$, $\tan\delta=0.02$, 0.5 mil copper.
> 1. $|\omega/\omega_c|-1=4/2.5-1=0.6$ → **N = 6** (Fig. 8.26). $g=0.517, 1.414, 1.932, 1.932, 1.414, 0.517$.
> 2. Lengths and widths (Pozar's table):
>
> | Section | $Z_i$ (Ω) | $\beta\ell$ (deg) | $W$ (mm) | $\ell$ (mm) |
> |---|---|---|---|---|
> | 1 ($C_1$) | 20 | 11.8 | 11.3 | 2.05 |
> | 2 ($L_2$) | 120 | 33.8 | 0.428 | 6.63 |
> | 3 ($C_3$) | 20 | 44.3 | 11.3 | 7.69 |
> | 4 ($L_4$) | 120 | 46.1 | 0.428 | 9.04 |
> | 5 ($C_5$) | 20 | 32.4 | 11.3 | 5.63 |
> | 6 ($L_6$) | 120 | 12.3 | 0.428 | 2.41 |
>
> 3. Check one: $C_3$: $\beta\ell=1.932\cdot20/50=0.773$ rad $=44.3^\circ$. All but one section stay below $45^\circ$.
> 4. **Loss** raises the passband attenuation to about **1 dB at 2 GHz** on this lossy ($\tan\delta=0.02$) substrate.

```tikz title="Pozar Example 8.6 drawn to scale (1 mm = 3 mm on the page): 20 ohm sections 11.3 mm wide, 120 ohm sections 0.428 mm wide. Total length 33.5 mm. The 50 ohm feeds (3.13 mm wide) are computed here with Pozar's synthesis equations for this substrate. After Pozar Fig. 8.40(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=0.3cm,y=0.3cm]
  \fill[orange!70] (-6,-1.565) rectangle (0,1.565);
  \fill[orange!70] (0,-5.65) rectangle (2.05,5.65);
  \fill[orange!70] (2.05,-0.214) rectangle (8.68,0.214);
  \fill[orange!70] (8.68,-5.65) rectangle (16.37,5.65);
  \fill[orange!70] (16.37,-0.214) rectangle (25.41,0.214);
  \fill[orange!70] (25.41,-5.65) rectangle (31.04,5.65);
  \fill[orange!70] (31.04,-0.214) rectangle (33.45,0.214);
  \fill[orange!70] (33.45,-1.565) rectangle (39.45,1.565);
  \foreach \x/\l/\n in {1.025/2.05/1,5.365/6.63/2,12.525/7.69/3,20.89/9.04/4,28.225/5.63/5,32.245/2.41/6} {
    \node[font=\scriptsize] at (\x,7.0) {\n};
    \node[font=\scriptsize,rotate=90,anchor=east] at (\x,-6.2) {\l\ mm};
  }
  \node[font=\scriptsize] at (-3,2.6) {50 $\Omega$};
  \node[font=\scriptsize] at (36.45,2.6) {50 $\Omega$};
  \node[font=\scriptsize] at (5.365,1.3) {120 $\Omega$};
  \node[font=\scriptsize] at (12.525,0) {20 $\Omega$};
  \draw[<->] (-7,-5.65) -- (-7,5.65) node[midway,left,font=\scriptsize] {11.3 mm};
  \draw[<->] (0,9.0) -- (33.45,9.0) node[midway,above,font=\scriptsize] {33.45 mm};
\end{circuitikz}
\end{document}
```

```tikz title="Attenuation of Pozar Example 8.6, lossless, computed here by cascading ideal-line ABCD matrices with Pozar's electrical lengths (blue), against the lumped N=6 Butterworth (gray dashed). Both meet 20 dB at 4 GHz (21.0 vs 24.5 dB); the stepped-impedance filter falls behind further out (curves clipped at 30 dB). Compare Pozar Fig. 8.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=2]
  \draw[->] (0,0) -- (5.3,0) node[right] {$f$ (GHz)};
  \draw[->] (0,0) -- (0,3.4) node[above] {atten. (dB)};
  \foreach \y/\l in {1/10,2/20,3/30} { \draw (0,\y) -- (-0.06,\y) node[left,font=\scriptsize] {\l}; \draw[gray!30] (0,\y) -- (5,\y); }
  \foreach \x in {0,1,2,3,4,5} \draw (\x,0) -- (\x,-0.1) node[below,font=\scriptsize] {\x};
  \draw[gray,dashed,thick] plot coordinates {(0.050,0.000) (0.100,0.000) (0.150,0.000) (0.200,0.000) (0.250,0.000) (0.300,0.000) (0.350,0.000) (0.400,0.000) (0.450,0.000) (0.500,0.000) (0.550,0.000) (0.600,0.000) (0.650,0.000) (0.700,0.000) (0.750,0.000) (0.800,0.000) (0.850,0.000) (0.900,0.000) (0.950,0.000) (1.000,0.000) (1.050,0.000) (1.100,0.000) (1.150,0.000) (1.200,0.000) (1.250,0.000) (1.300,0.000) (1.350,0.000) (1.400,0.000) (1.450,0.001) (1.500,0.001) (1.550,0.001) (1.600,0.002) (1.650,0.003) (1.700,0.004) (1.750,0.006) (1.800,0.008) (1.850,0.012) (1.900,0.016) (1.950,0.022) (2.000,0.029) (2.050,0.039) (2.100,0.051) (2.150,0.066) (2.200,0.085) (2.250,0.108) (2.300,0.136) (2.350,0.169) (2.400,0.208) (2.450,0.252) (2.500,0.302) (2.550,0.356) (2.600,0.416) (2.650,0.479) (2.700,0.547) (2.750,0.617) (2.800,0.690) (2.850,0.765) (2.900,0.841) (2.950,0.919) (3.000,0.997) (3.050,1.075) (3.100,1.153) (3.150,1.231) (3.200,1.308) (3.250,1.386) (3.300,1.462) (3.350,1.538) (3.400,1.613) (3.450,1.687) (3.500,1.761) (3.550,1.834) (3.600,1.905) (3.650,1.976) (3.700,2.047) (3.750,2.116) (3.800,2.184) (3.850,2.252) (3.900,2.319) (3.950,2.385) (4.000,2.450) (4.050,2.515) (4.100,2.579) (4.150,2.642) (4.200,2.704) (4.250,2.765) (4.300,2.826) (4.350,2.886) (4.400,2.946) (4.450,3.000) (4.500,3.000) (4.550,3.000) (4.600,3.000) (4.650,3.000) (4.700,3.000) (4.750,3.000) (4.800,3.000) (4.850,3.000) (4.900,3.000) (4.950,3.000) (5.000,3.000)};
  \draw[blue,thick] plot coordinates {(0.050,0.000) (0.100,0.000) (0.150,0.000) (0.200,0.000) (0.250,0.000) (0.300,0.000) (0.350,0.000) (0.400,0.000) (0.450,0.000) (0.500,0.000) (0.550,0.000) (0.600,0.000) (0.650,0.000) (0.700,0.000) (0.750,0.000) (0.800,0.000) (0.850,0.000) (0.900,0.000) (0.950,0.000) (1.000,0.000) (1.050,0.000) (1.100,0.000) (1.150,0.000) (1.200,0.000) (1.250,0.000) (1.300,0.000) (1.350,0.001) (1.400,0.001) (1.450,0.001) (1.500,0.002) (1.550,0.003) (1.600,0.004) (1.650,0.006) (1.700,0.009) (1.750,0.012) (1.800,0.016) (1.850,0.022) (1.900,0.030) (1.950,0.039) (2.000,0.051) (2.050,0.066) (2.100,0.085) (2.150,0.107) (2.200,0.133) (2.250,0.164) (2.300,0.199) (2.350,0.239) (2.400,0.283) (2.450,0.331) (2.500,0.383) (2.550,0.438) (2.600,0.496) (2.650,0.557) (2.700,0.619) (2.750,0.683) (2.800,0.747) (2.850,0.812) (2.900,0.877) (2.950,0.942) (3.000,1.007) (3.050,1.071) (3.100,1.134) (3.150,1.197) (3.200,1.259) (3.250,1.320) (3.300,1.379) (3.350,1.438) (3.400,1.496) (3.450,1.552) (3.500,1.608) (3.550,1.662) (3.600,1.715) (3.650,1.767) (3.700,1.817) (3.750,1.867) (3.800,1.915) (3.850,1.963) (3.900,2.009) (3.950,2.054) (4.000,2.098) (4.050,2.140) (4.100,2.182) (4.150,2.223) (4.200,2.262) (4.250,2.301) (4.300,2.338) (4.350,2.374) (4.400,2.410) (4.450,2.444) (4.500,2.477) (4.550,2.510) (4.600,2.541) (4.650,2.571) (4.700,2.601) (4.750,2.629) (4.800,2.657) (4.850,2.683) (4.900,2.709) (4.950,2.733) (5.000,2.757)};
  \draw[red,dashed] (4,0) -- (4,3.2); \node[red,font=\scriptsize,anchor=west] at (4.02,1.6) {spec: 20 dB};
  \node[blue,font=\scriptsize] at (4.6,1.85) {hi-$Z$/lo-$Z$};
  \node[gray,font=\scriptsize] at (4.25,3.25) {lumped};
\end{circuitikz}
\end{document}
```

> [!note]- Worked: the binder's version with delays (binder pp. 305–307)
> **Spec:** Butterworth, $f_c=2$ GHz, slope steeper than 90 dB/decade, 100 Ω. $-20N=-90$ → $N=4.5$, take **N = 5**: $g=0.618, 1.618, 2.0, 1.618, 0.618$ (shunt-C first). Scaled: $C=0.492$ pF, $L=12.87$ nH, $C=1.59$ pF, $L=12.87$ nH, $C=0.492$ pF.
> Pick lines shorter than $\lambda/10$ at 2 GHz ($\lambda=15$ cm in air): 0.2 cm, delay $T=6.67$ ps. Then $Z_0=T/C=13.56\ \Omega$ for 0.492 pF; but $T/C=4.12\ \Omega$ for 1.59 pF and $L/T=1930\ \Omega$ for 12.87 nH are impractical. So **change the delay instead**: $T=13.4$ ps gives $8.24\ \Omega$ for the 1.59 pF section; $T=26.8$ ps gives $482.5\ \Omega$ for the inductors. Final: 13.56 Ω/6.7 ps, 482.5 Ω/26.8 ps, 8.24 Ω/13.4 ps, 482.5 Ω/26.8 ps, 13.56 Ω/6.7 ps. The simulated response is $-3$ dB at 2 GHz, $-10$ dB at 2.5 GHz and about $-29$ dB at 4 GHz.
> The lesson: trading length against impedance is the designer's knob. A 482.5 Ω line is still impractical in microstrip; the binder's example assumes air ($v=c$), and Pozar's 120/20 Ω limits are the realistic ones.

## Level 2: Bandpass and Bandstop Filters

A bandpass prototype alternates series and shunt resonators ([[Filters#LP → HP, BP, BS]]). Every design below makes them all one type, coupled through inverters, and differs only in **what the resonator is and what the inverter is**.

> [!tip] Remark
> Pozar's lumped bandpass (Ex. 8.4) needed a 127 nH series inductor next to a 0.726 nH shunt one (175:1). That spread, worse for narrower bands, is why microwave bandpass filters use inverters and line resonators instead: see the remark under [[Filters#LP → HP, BP, BS]].

### Coupled-Line Filter

```tikz title="One coupled-line section, open at ports 2 and 4, is a bandpass element. Near theta = 90 degrees it is equivalent to a line of length theta, an admittance inverter J, and another line of length theta. After Pozar Figs. 8.42(c) and 8.44, binder p. 311."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!70] (0,1.0) rectangle (4,1.3);
  \fill[orange!70] (0,0.4) rectangle (4,0.7);
  \draw[->] (-0.9,1.15) -- (0,1.15); \node[left,font=\scriptsize] at (-0.9,1.15) {port 1};
  \draw[->] (4.9,0.55) -- (4,0.55); \node[right,font=\scriptsize] at (4.9,0.55) {port 3};
  \node[font=\scriptsize,anchor=west] at (4.05,1.15) {O.C. (4)};
  \node[font=\scriptsize,anchor=east] at (-0.05,0.55) {(2) O.C.};
  \draw[<->] (0,1.65) -- (4,1.65) node[midway,above,font=\scriptsize] {$\ell=\lambda/4$ at $\omega_0$ ($\theta=\pi/2$)};
  \node[font=\scriptsize] at (2,0) {$Z_{0e}$, $Z_{0o}$};
  \node at (5.6,0.85) {$\equiv$};
  \begin{scope}[xshift=6.4cm]
    \draw[very thick] (0,1.2) -- (1.6,1.2); \draw[very thick] (0,0.4) -- (1.6,0.4);
    \node[font=\scriptsize] at (0.8,1.5) {$Z_0$, $\theta$};
    \draw[fill=gray!12] (1.6,0.2) rectangle (2.8,1.4); \node[font=\scriptsize,align=center] at (2.2,0.8) {$J$\\ $-90^\circ$};
    \draw[very thick] (2.8,1.2) -- (4.4,1.2); \draw[very thick] (2.8,0.4) -- (4.4,0.4);
    \node[font=\scriptsize] at (3.6,1.5) {$Z_0$, $\theta$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_0J_1=\sqrt{\frac{\pi\Delta}{2g_1}},\quad Z_0J_n=\frac{\pi\Delta}{2\sqrt{g_{n-1}g_n}}\ (n=2..N),\quad Z_0J_{N+1}=\sqrt{\frac{\pi\Delta}{2g_Ng_{N+1}}}}
$$

$$
\boxed{Z_{0e}=Z_0\left[1+JZ_0+(JZ_0)^2\right],\qquad Z_{0o}=Z_0\left[1-JZ_0+(JZ_0)^2\right],\qquad \text{each section }\lambda/4\text{ at }\omega_0}
$$

**Design steps** (binder p. 314):
1. Order $N$ and $g_k$ from the attenuation spec, mapping the stopband frequency through the BP transformation.
2. Fractional bandwidth $\Delta=(\omega_2-\omega_1)/\omega_0$.
3. $N+1$ inverter constants $J_n$ from the boxed equations.
4. $Z_{0e}$, $Z_{0o}$ for each section; then $W$ and spacing $S$ from coupled-microstrip design data; each section $\lambda/4$ at $f_0$.

- **N + 1 sections for an order-N filter.** Between two inverters sits a line $2\theta\approx\lambda/2$: that half-wave line is the resonator.
- **Bandwidth limit about 20%**: wider bands need tightly coupled lines (large $Z_{0e}-Z_{0o}$, tiny gaps), which are hard to fabricate. The end sections always have the tightest coupling.
- **The layout is symmetric** about its midpoint for symmetric prototypes, and can be reversed.
- **Spurious passband at $3f_0$** (sections become $3\lambda/4$): Pozar Ex. 8.7 passes again at 6 GHz.

> [!tip] Remark
> The end inverters $J_1$, $J_{N+1}$ act as impedance transformers from $Z_0$ to the resonators; this is the "external $Q$" of the end resonators, the coupling coefficient $g$ of [[Microwave Resonators#Coupling Coefficient and Critical Coupling]] in filter clothing. The interior $J_n$ set how strongly neighbouring resonators exchange energy, i.e. the bandwidth.

> [!note]- Derivation: Z-matrix and image impedance of one section (Pozar Eqs. 8.87–8.103)
> Superpose even-mode (sources $i_1$, $i_3$) and odd-mode (sources $i_2$, $i_4$) excitations. With the other ports open, each mode sees an open-ended line: $Z_{in}^e=-jZ_{0e}\cot\beta\ell$, $Z_{in}^o=-jZ_{0o}\cot\beta\ell$. Adding the voltages at port 1 and substituting $i_1=\frac12(I_1+I_2)$ etc. gives, with $\theta=\beta\ell$,
> $$Z_{11}=-\tfrac j2(Z_{0e}+Z_{0o})\cot\theta,\ \ Z_{12}=-\tfrac j2(Z_{0e}-Z_{0o})\cot\theta,\ \ Z_{13}=-\tfrac j2(Z_{0e}-Z_{0o})\csc\theta,\ \ Z_{14}=-\tfrac j2(Z_{0e}+Z_{0o})\csc\theta.$$
> Open ports 2 and 4 ($I_2=I_4=0$): $V_1=Z_{11}I_1+Z_{13}I_3$, $V_3=Z_{31}I_1+Z_{33}I_3$. Image impedance $Z_i=\sqrt{Z_{11}^2-Z_{11}Z_{13}^2/Z_{33}}=\tfrac12\sqrt{(Z_{0e}-Z_{0o})^2\csc^2\theta-(Z_{0e}+Z_{0o})^2\cot^2\theta}$.
> At $\theta=\pi/2$: $Z_i=\tfrac12(Z_{0e}-Z_{0o})$, real. At $\theta\to0,\pi$: $Z_i\to\pm j\infty$, stopband. Band edges $\cos\theta_1=-\cos\theta_2=\frac{Z_{0e}-Z_{0o}}{Z_{0e}+Z_{0o}}$. Propagation: $\cos\beta=\frac{Z_{0e}+Z_{0o}}{Z_{0e}-Z_{0o}}\cos\theta$. Of the ten ways to terminate a coupled pair (Pozar Table 8.8), this open-open one is chosen because opens are easy in microstrip.

> [!note]- Derivation: equivalent circuit, $Z_{0e}$ and $Z_{0o}$ from $J$ (Pozar Eqs. 8.104–8.108)
> The equivalent (line $\theta$, inverter $J$ realized as a $\lambda/4$ line of impedance $1/J$, line $\theta$) has image impedance $Z_i=JZ_0^2$ at $\theta=\pi/2$ and $\cos\beta=(JZ_0+1/JZ_0)\sin\theta\cos\theta$. Equate to the section's values with $\sin\theta\simeq1$:
> $$\tfrac12(Z_{0e}-Z_{0o})=JZ_0^2,\qquad \frac{Z_{0e}+Z_{0o}}{Z_{0e}-Z_{0o}}=JZ_0+\frac1{JZ_0}.$$
> Solving gives the boxed $Z_{0e}$, $Z_{0o}$.

> [!note]- Derivation: J-inverter constants from the prototype (Pozar Eqs. 8.109–8.121)
> 1. **Interior line $2\theta$ is a shunt resonator.** Its exact T-equivalent has shunt arm $Z_{12}=jZ_0/\sin2\theta$ and series arms $-jZ_0\cot\theta\approx0$ near $\theta=\pi/2$ (plus a $1:-1$ transformer that only flips sign). With $2\theta=\pi(1+\Delta\omega/\omega_0)$: $Z_{12}\simeq-jZ_0\omega_0/[\pi(\omega-\omega_0)]$. A parallel LC near resonance is $-jL\omega_0^2/[2(\omega-\omega_0)]$, so $L=\frac{2Z_0}{\pi\omega_0}$, $C=\frac{\pi}{2Z_0\omega_0}$.
> 2. **End inverters are transformers.** $J$ followed by a matched line equals an ideal transformer of ratio $JZ_0$ plus a $\lambda/4$ line (a pure phase shift).
> 3. **Match to the lumped BP prototype** ($N=2$): the admittance seen into the inverter-coupled circuit has the same form as that of the shunt-first BP ladder with $L_1'=Z_0\Delta/(\omega_0g_1)$, $C_1'=g_1/(\omega_0Z_0\Delta)$, $L_2'=g_2Z_0/(\omega_0\Delta)$, $C_2'=\Delta/(\omega_0g_2Z_0)$ if
> $$Z_0J_1=\sqrt{\frac{\pi\Delta}{2g_1}},\quad Z_0J_2=\frac{\pi\Delta}{2\sqrt{g_1g_2}},\quad Z_0J_3=\sqrt{\frac{\pi\Delta}{2g_2}}.$$
> Generalizing to $N$ resonators and $g_{N+1}\ne1$ gives the boxed set. Check against Ex. 8.7: $\sqrt{\pi\cdot0.1/(2\cdot1.5963)}=0.3137$.

> [!example] Pozar Ex. 8.7: coupled-line bandpass
> **Spec:** $N=3$, 0.5 dB ripple, $f_0=2.0$ GHz, $\Delta=0.1$, $Z_0=50\ \Omega$. Attenuation at 1.8 GHz?
> 1. 1.8 GHz → $\Omega=-2.11$, $|\Omega|-1=1.11$ → **about 20 dB** (Fig. 8.27a).
> 2. Table:
>
> | $n$ | $g_n$ | $Z_0J_n$ | $Z_{0e}$ (Ω) | $Z_{0o}$ (Ω) |
> |---|---|---|---|---|
> | 1 | 1.5963 | 0.3137 | 70.61 | 39.24 |
> | 2 | 1.0967 | 0.1187 | 56.64 | 44.77 |
> | 3 | 1.5963 | 0.1187 | 56.64 | 44.77 |
> | 4 | 1.0000 | 0.3137 | 70.61 | 39.24 |
>
> 3. Check row 2: $Z_0J_2=\pi(0.1)/(2\sqrt{1.5963\cdot1.0967})=0.1187$; $Z_{0e}=50(1+0.1187+0.0141)=56.64\ \Omega$.

```tikz title="Pozar Example 8.7 as a microstrip top view: four coupled sections, each lambda/4 at 2 GHz, symmetric about the middle. The outer sections (Z0e/Z0o = 70.61/39.24 ohm) need a much narrower gap than the inner ones (56.64/44.77 ohm). Lengths are to scale with each other; widths and gaps are drawn qualitatively because the example names no substrate. After Pozar Fig. 8.45(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\w{0.28}
  % feed in
  \fill[orange!70] (-1.5,3.0) rectangle (0,3.0+\w);
  % section 1 (tight gap 0.08): strip A top (feed continues), strip B below
  \fill[orange!70] (0,3.0) rectangle (3,3.0+\w);
  \fill[orange!70] (0,3.0-0.08-\w) rectangle (6,3.0-0.08);
  % section 2 (wide gap 0.30)
  \fill[orange!70] (3,3.0-0.08-\w-0.30-\w) rectangle (9,3.0-0.08-\w-0.30);
  % section 3 (wide gap 0.30)
  \pgfmathsetmacro{\yc}{3.0-0.08-\w-0.30-\w}
  \fill[orange!70] (6,\yc-0.30-\w) rectangle (12,\yc-0.30);
  % section 4 (tight gap 0.08)
  \pgfmathsetmacro{\yd}{\yc-0.30-\w}
  \fill[orange!70] (9,\yd-0.08-\w) rectangle (13.5,\yd-0.08);
  % labels
  \foreach \x/\n/\z in {1.5/1/{70.61/39.24},4.5/2/{56.64/44.77},7.5/3/{56.64/44.77},10.5/4/{70.61/39.24}} {
    \node[font=\scriptsize] at (\x,3.75) {\n};
    \node[font=\scriptsize,align=center] at (\x,-0.9) {$Z_{0e}/Z_{0o}$\\ \z\ $\Omega$};
  }
  \foreach \x in {0,3,6,9,12} \draw[gray,dotted] (\x,3.55) -- (\x,-0.4);
  \draw[<->] (0,4.2) -- (3,4.2) node[midway,above,font=\scriptsize] {$\lambda/4$ at 2 GHz};
  \node[font=\scriptsize] at (-0.8,3.55) {50 $\Omega$ in};
  \node[font=\scriptsize] at (12.9,0.95) {50 $\Omega$ out};
  \node[font=\scriptsize,red] at (1.5,2.4) {tight gap};
  \node[font=\scriptsize,red] at (4.5,1.8) {wider gap};
  \node[font=\scriptsize,align=center] at (6.0,-2.0) {each strip end is an open circuit; a strip spanning two sections is a $\lambda/2$ resonator (3 resonators for $N=3$)};
\end{circuitikz}
\end{document}
```

```tikz title="Attenuation of Pozar Example 8.7 computed here by cascading the exact open-ended coupled-line two-ports (Pozar Eq. 8.99) with the table's Z0e and Z0o. 19.4 dB at 1.8 GHz (Pozar estimated about 20 dB from the prototype), passband ripple about 0.57 dB, and a second passband at 6 GHz = 3 f0 (plotted clipped at 60 dB). Compare Pozar Fig. 8.46."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=1.5]
  \draw[->] (0,0) -- (7.3,0) node[right] {$f$ (GHz)};
  \draw[->] (0,0) -- (0,3.4) node[above] {atten. (dB)};
  \foreach \y/\l in {1/20,2/40,3/60} { \draw (0,\y) -- (-0.05,\y) node[left,font=\scriptsize] {\l}; \draw[gray!30] (0,\y) -- (7,\y); }
  \foreach \x in {0,1,2,3,4,5,6,7} \draw (\x,0) -- (\x,-0.1) node[below,font=\scriptsize] {\x};
  \draw[blue,thick] plot coordinates {(0.050,3.000) (0.100,3.000) (0.150,3.000) (0.200,3.000) (0.250,3.000) (0.300,3.000) (0.350,3.000) (0.400,3.000) (0.450,3.000) (0.500,3.000) (0.550,3.000) (0.600,3.000) (0.650,3.000) (0.700,3.000) (0.750,3.000) (0.800,3.000) (0.850,3.000) (0.900,3.000) (0.950,3.000) (1.000,3.000) (1.050,3.000) (1.100,3.000) (1.150,2.978) (1.200,2.894) (1.250,2.804) (1.300,2.709) (1.350,2.608) (1.400,2.498) (1.450,2.380) (1.500,2.250) (1.550,2.107) (1.600,1.947) (1.650,1.764) (1.700,1.551) (1.750,1.295) (1.800,0.971) (1.850,0.528) (1.900,0.028) (1.950,0.024) (2.000,-0.000) (2.050,0.024) (2.100,0.028) (2.150,0.528) (2.200,0.971) (2.250,1.295) (2.300,1.551) (2.350,1.764) (2.400,1.947) (2.450,2.107) (2.500,2.250) (2.550,2.380) (2.600,2.498) (2.650,2.608) (2.700,2.709) (2.750,2.804) (2.800,2.894) (2.850,2.978) (2.900,3.000) (2.950,3.000) (3.000,3.000) (3.050,3.000) (3.100,3.000) (3.150,3.000) (3.200,3.000) (3.250,3.000) (3.300,3.000) (3.350,3.000) (3.400,3.000) (3.450,3.000) (3.500,3.000) (3.550,3.000) (3.600,3.000) (3.650,3.000) (3.700,3.000) (3.750,3.000) (3.800,3.000) (3.850,3.000) (3.900,3.000) (3.950,3.000) (4.000,3.000) (4.050,3.000) (4.100,3.000) (4.150,3.000) (4.200,3.000) (4.250,3.000) (4.300,3.000) (4.350,3.000) (4.400,3.000) (4.450,3.000) (4.500,3.000) (4.550,3.000) (4.600,3.000) (4.650,3.000) (4.700,3.000) (4.750,3.000) (4.800,3.000) (4.850,3.000) (4.900,3.000) (4.950,3.000) (5.000,3.000) (5.050,3.000) (5.100,3.000) (5.150,2.978) (5.200,2.894) (5.250,2.804) (5.300,2.709) (5.350,2.608) (5.400,2.498) (5.450,2.380) (5.500,2.250) (5.550,2.107) (5.600,1.947) (5.650,1.764) (5.700,1.551) (5.750,1.295) (5.800,0.971) (5.850,0.528) (5.900,0.028) (5.950,0.024) (6.000,-0.000) (6.050,0.024) (6.100,0.028) (6.150,0.528) (6.200,0.971) (6.250,1.295) (6.300,1.551) (6.350,1.764) (6.400,1.947) (6.450,2.107) (6.500,2.250) (6.550,2.380) (6.600,2.498) (6.650,2.608) (6.700,2.709) (6.750,2.804) (6.800,2.894) (6.850,2.978) (6.900,3.000) (6.950,3.000) (7.000,3.000)};
  \fill[red] (1.8,0.971) circle (0.04);
  \node[red,font=\scriptsize,anchor=east] at (1.75,0.95) {19.4 dB};
  \node[font=\scriptsize,align=center] at (4.0,2.5) {spurious passband\\ at $3f_0$ $\rightarrow$};
\end{circuitikz}
\end{document}
```

> [!note]- Worked: the binder's 5th-order coupled-line filter (binder p. 315)
> **Spec:** 5th-order Chebyshev, 50 Ω, passband 9.5 to 10.5 GHz ($\Delta=0.1$); every section $\lambda/4$ at 10 GHz, i.e. a 25 ps delay. Result: $Z_{0e}/Z_{0o}=75.35/38.34$ (sections 1, 6), $57.05/44.52$ (2, 5), $55.23/45.68\ \Omega$ (3, 4). Six sections for $N=5$: the section count exceeds the order by one. The slide doesn't state the ripple. Note the binder defines $\omega_0=(\omega_1+\omega_2)/2$ (arithmetic mean) where Pozar uses $\sqrt{\omega_1\omega_2}$; for 10% bandwidth the two differ by about 0.1%.

### Quarter-Wave Stub Filters

```tikz title="Shunt-stub filters on a Z0 line. Every stub and every connecting line is lambda/4 at w0. Open stubs (series resonators to ground) give a bandstop; shorted stubs (parallel resonators) give a bandpass. The lambda/4 connecting lines are the admittance inverters. After Pozar Fig. 8.47."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \yy/\lab/\endt in {0/{(a) bandstop: open stubs}/open,-3.4/{(b) bandpass: shorted stubs}/short} {
    \begin{scope}[yshift=\yy cm]
      \fill[orange!70] (-0.8,-0.12) rectangle (7.8,0.12);
      \foreach \x/\n in {0/1,2.5/2,5/3,7/N} {
        \fill[orange!70] (\x-0.08,0.12) rectangle (\x+0.08,2.0);
        \node[font=\scriptsize,anchor=west] at (\x+0.1,1.5) {$Z_{0\n}$};
      }
      \foreach \x in {0,2.5} \node[font=\scriptsize] at (\x+1.25,-0.4) {$Z_0$, $\lambda/4$};
      \node[font=\scriptsize] at (6.0,0.6) {$\cdots$};
      \node[font=\scriptsize,anchor=west] at (-0.8,2.4) {\lab};
    \end{scope}
  }
  \foreach \x in {0,2.5,5,7} \draw[very thick] (\x-0.2,-1.4) -- (\x+0.2,-1.4);
  \node[font=\scriptsize] at (8.6,-1.4) {via to ground};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{bandstop (open stubs): }Z_{0n}=\frac{4Z_0}{\pi g_n\Delta}\qquad\text{bandpass (shorted stubs): }Z_{0n}=\frac{\pi Z_0\Delta}{4g_n}}
$$

- **Compact and simple:** the filter runs at $Z_0$ throughout (no end transformers). For narrow bands its response matches a coupled-line filter with $N+1$ sections.
- **Catch: the impedances.** Narrow bandstop wants very high stub $Z_0$; narrow bandpass very low. Pozar Ex. 8.8 needs 265.9 and 387.0 Ω stubs.
- Only for $g_{N+1}=1$ (not even-order equal ripple). Making the connecting-line impedances free variables too gives an exact correspondence with coupled-line filters (Matthaei et al., cited by Pozar).

> [!note]- Derivation: open stub as a series resonator (Pozar Eqs. 8.122–8.130)
> Open stub near $\theta=\pi/2$: $Z=-jZ_{0n}\cot\theta$ with $\theta=\frac\pi2(1+\Delta\omega/\omega_0)$, so $Z\simeq jZ_{0n}\frac{\pi(\omega-\omega_0)}{2\omega_0}$. A series LC: $Z\simeq2jL_n(\omega-\omega_0)$. Equate: $Z_{0n}=4\omega_0L_n/\pi$. With $\lambda/4$ lines as ideal inverters ($J=1/Z_0$), alternate stubs are seen as parallel resonators; matching the input admittance to the bandstop prototype ($L_1'$, $C_1'$ parallel; $L_2'$, $C_2'$ series) gives $L_1=Z_0^2/(\omega_0^2L_1')$, $L_2=L_2'$. With the BS element values from [[Filters#LP → HP, BP, BS]] ($L_1'=Z_0g_1\Delta/\omega_0$, $L_2'=Z_0/(\omega_0g_2\Delta)$): $Z_{0n}=4Z_0/(\pi g_n\Delta)$ for every $n$.

> [!example] Pozar Ex. 8.8: three-stub bandstop
> $f_0=2$ GHz, $\Delta=15\%$, 50 Ω, 0.5 dB ripple, $N=3$. $Z_{01}=Z_{03}=\frac{4\cdot50}{\pi\cdot1.5963\cdot0.15}=\mathbf{265.9\ \Omega}$, $Z_{02}=\mathbf{387.0\ \Omega}$; all lines $\lambda/4$ at 2 GHz. The passband ripple comes out somewhat above 0.5 dB, from the approximations. 387 Ω is not realizable in ordinary microstrip, the practical limit of this topology.

### Capacitive-Gap Coupled Resonators

```tikz title="End-coupled (capacitive-gap) bandpass in microstrip, Pozar Example 8.9 to scale in electrical length: three resonators of 155.8, 166.5, 155.8 degrees at 2 GHz, four gaps. The end gaps carry more capacitance (0.554 pF) than the inner ones (0.192 pF), so they are narrower. Gap widths qualitative. After Pozar Fig. 8.50(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\s{0.022}
  \fill[orange!70] (-1.6,-0.15) rectangle (0,0.15);
  \pgfmathsetmacro{\aa}{0.10}
  \pgfmathsetmacro{\ab}{\aa+155.8*\s}
  \pgfmathsetmacro{\ba}{\ab+0.22}
  \pgfmathsetmacro{\bb}{\ba+166.5*\s}
  \pgfmathsetmacro{\ca}{\bb+0.22}
  \pgfmathsetmacro{\cb}{\ca+155.8*\s}
  \pgfmathsetmacro{\da}{\cb+0.10}
  \fill[orange!70] (\aa,-0.15) rectangle (\ab,0.15);
  \fill[orange!70] (\ba,-0.15) rectangle (\bb,0.15);
  \fill[orange!70] (\ca,-0.15) rectangle (\cb,0.15);
  \fill[orange!70] (\da,-0.15) rectangle (\da+1.6,0.15);
  \node[font=\scriptsize] at ({(\aa+\ab)/2},0.5) {$\theta_1=155.8^\circ$};
  \node[font=\scriptsize] at ({(\ba+\bb)/2},0.5) {$\theta_2=166.5^\circ$};
  \node[font=\scriptsize] at ({(\ca+\cb)/2},0.5) {$\theta_3=155.8^\circ$};
  \foreach \x/\c in {0.05/0.554,\ab+0.11/0.192,\bb+0.11/0.192,\cb+0.05/0.554} {
    \draw[->,red] (\x,-0.9) -- (\x,-0.2);
    \node[red,font=\scriptsize] at (\x,-1.15) {\c\ pF};
  }
  \node[font=\scriptsize] at (-0.8,0.5) {50 $\Omega$};
  \node[font=\scriptsize] at (\da+0.8,0.5) {50 $\Omega$};
\end{circuitikz}
\end{document}
```

$$
\boxed{B_i=\frac{J_i}{1-(Z_0J_i)^2},\qquad C_i=\frac{B_i}{\omega_0},\qquad \theta_i=\pi-\tfrac12\left[\tan^{-1}(2Z_0B_i)+\tan^{-1}(2Z_0B_{i+1})\right]}
$$

- $N$ resonators, roughly $\lambda/2$ each, separated by $N+1$ gaps; $J_i$ from the **same** equations as the coupled-line filter.
- Each gap plus the negative line lengths beside it is an admittance inverter ([[#Impedance and Admittance Inverters]], realization (c)); absorbing the negative lengths shortens each resonator below $180^\circ$.
- The response matches the coupled-line design near the passband. In-line and simple, but long (each resonator $\lambda/2$), and very small gap capacitances need tight gaps that are sensitive to etching.

> [!example] Pozar Ex. 8.9: gap-coupled bandpass
> 0.5 dB ripple, $f_0=2$ GHz, $\Delta=10\%$, 50 Ω, ≥20 dB at 2.2 GHz. 2.2 GHz maps to $\Omega=1.91$, so $|\Omega|-1=0.91$ and **N = 3** suffices (Fig. 8.27a).
>
> | $n$ | $g_n$ | $Z_0J_n$ | $B_n$ (S) | $C_n$ (pF) | $\theta_n$ (deg) |
> |---|---|---|---|---|---|
> | 1 | 1.5963 | 0.3137 | $6.96\times10^{-3}$ | 0.554 | 155.8 |
> | 2 | 1.0967 | 0.1187 | $2.41\times10^{-3}$ | 0.192 | 166.5 |
> | 3 | 1.5963 | 0.1187 | $2.41\times10^{-3}$ | 0.192 | 155.8 |
> | 4 | 1.0000 | 0.3137 | $6.96\times10^{-3}$ | 0.554 | — |
>
> Check $\theta_1=180^\circ-\tfrac12[\tan^{-1}(0.696)+\tan^{-1}(0.241)]=180^\circ-\tfrac12(34.8^\circ+13.6^\circ)=155.8^\circ$.

### Capacitively Coupled Shunt Resonators

```tikz title="Shunt shorted-stub resonators coupled by series capacitors: the topology of ceramic (dielectric-filled coaxial) resonator filters. Values are Pozar Example 8.10 (2.5 GHz, 10%, 0.5 dB ripple, N=3); each stub is a 50 ohm shorted line a little shorter than lambda/4. After Pozar Fig. 8.52."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} node[left] {$Z_0$} to[C,l=$C_{01}$] (2.2,2) to[C,l=$C_{12}$] (5.2,2) to[C,l=$C_{23}$] (8.2,2) to[C,l=$C_{34}$] (10.4,2) node[ocirc]{} node[right] {$Z_0$};
  \foreach \x/\t in {2.2/{73.6^\circ},5.2/{83.2^\circ},8.2/{73.6^\circ}} {
    \draw (\x,2) to[TL,l_={$Z_0$, $\t$}] (\x,0) node[ground]{};
  }
  \node[font=\scriptsize,align=left,anchor=west] at (0,-1.0) {$C_{01}=C_{34}=0.2896$ pF, $C_{12}=C_{23}=0.0756$ pF};
\end{circuitikz}
\end{document}
```

$$
\boxed{Z_0J_{01}=\sqrt{\frac{\pi\Delta}{4g_1}},\quad Z_0J_{n,n+1}=\frac{\pi\Delta}{4\sqrt{g_ng_{n+1}}},\quad C_{01}=\frac{J_{01}}{\omega_0\sqrt{1-(Z_0J_{01})^2}},\quad C_{n,n+1}=\frac{J_{n,n+1}}{\omega_0}}
$$

$$
\boxed{\Delta C_n=-C_{n-1,n}-C_{n,n+1},\qquad \ell_n=\frac{\lambda}{4}+\frac{Z_0\,\omega_0\,\Delta C_n}{2\pi}\,\lambda}
$$

- The inverters are $\pi$ networks of capacitors (realization (d)); their **negative shunt capacitors** merge into the resonators, so each stub is cut **shorter** than $\lambda/4$.
- **Ceramic resonator filters:** the stubs are coaxial lines filled with high-$\epsilon_r$, low-loss ceramic, which makes them small even at UHF. Pozar calls them among the most common RF bandpass filters in portable wireless devices (phones, GPS: usually two or more each). The material must also be temperature-stable. Example from Pozar: a zinc/strontium titanate with $\epsilon_r=36$, $Q=10{,}000$ at 4 GHz, $-7$ ppm/°C.
- **Asymmetric skirts:** the high side rolls off more slowly than the low side.

> [!example] Pozar Ex. 8.10: ceramic-style shunt-resonator bandpass
> $N=3$, 0.5 dB ripple, $f_0=2.5$ GHz, $\Delta=10\%$, 50 Ω. Attenuation at 3 GHz?
> - 3 GHz → $\Omega=3.667$, $|\Omega|-1=2.667$ → **35 dB** for the lumped prototype; the computed distributed response gives about **30 dB**.
> - $Z_0J_{01}=Z_0J_{34}=0.2218$, $Z_0J_{12}=Z_0J_{23}=0.0594$; $C_{01}=C_{34}=0.2896$ pF, $C_{12}=C_{23}=0.0756$ pF.
> - $\Delta C_1=\Delta C_3=-0.3652$ pF, $\Delta C_2=-0.1512$ pF → $\Delta\ell_1=-0.04565\lambda$, $\Delta\ell_2=-0.0189\lambda$ → stubs **73.6°, 83.2°, 73.6°** (all below 90°).

> [!note]- Derivation: stub length change from a shunt capacitor (Pozar Eqs. 8.139–8.141)
> A shorted stub with a capacitor across its input: $Y=Y_L+j\omega_0C$, $Y_L=-j\cot\beta\ell/Z_0$. Replacing the capacitor by an extra length $\Delta\ell$ of the same line: $Y=\frac1{Z_0}\frac{Y_L+j\tan\beta\Delta\ell/Z_0}{1+jY_LZ_0\tan\beta\Delta\ell}\simeq Y_L+j\beta\Delta\ell/Z_0$ for $\beta\Delta\ell\ll1$. Equate: $\Delta\ell=Z_0\omega_0C/\beta=\frac{Z_0\omega_0C}{2\pi}\lambda$. A negative $C$ is a negative $\Delta\ell$: a shorter stub.

### Choosing a Topology

| Topology | Response | Bandwidth | Strength | Weakness |
|---|---|---|---|---|
| Stub LPF (Richards + Kuroda) | Low-pass (also bandstop) | — | Exact at $f_c$, sharper cutoff than lumped | Spurious repeat at $4f_c$; extra UEs add length |
| Stepped-impedance | Low-pass | — | Smallest, simplest; good for cleaning up mixer products | Soft cutoff, limited by $Z_h/Z_\ell$ |
| Coupled-line | Bandpass | up to ~20% | Planar, no vias, easy design equations | Tight end gaps; long ($N+1$ quarter-waves); spurious at $3f_0$ |
| $\lambda/4$ shunt stubs | Bandstop (open) / bandpass (shorted) | narrow | Compact, runs at $Z_0$ | Extreme stub impedances for narrow bands; vias for shorts |
| Capacitive-gap end-coupled | Bandpass | narrow | In-line, simple | Long ($\lambda/2$ resonators); small gaps |
| Capacitively coupled shunt (ceramic coax) | Bandpass | narrow | Very small with high-$\epsilon_r$ ceramic, high $Q$ | Asymmetric skirts; a discrete part, not printed |

Pozar mentions two more without design detail: the **interdigital** filter (a coupled-line filter folded at its midpoints, much more compact) and real hardware mixing all of the above (Pozar Fig. 8.55: a 10 MHz to 27 GHz downconverter with a 21-pole microstrip stub low-pass, 5.4 GHz cutoff, more than 75 dB rejection from 5.8 to 9.0 GHz).

## Level 3: Losses and Real Layouts

### Insertion Loss from Finite Q

$$
\boxed{IL_0\approx 4.343\,\frac{\sum_{k=1}^{N}g_k}{\Delta\,Q_u}\ \text{dB}\quad(\text{bandpass, all resonators }Q_u),\qquad IL_0\approx4.343\,\frac{\omega_0\,\tau_g(\omega_0)}{Q_u}\ \text{dB}}
$$

- **Loss scales as $1/(\Delta Q_u)$.** Halve the bandwidth and the passband loss doubles; this is why narrow filters need high-$Q$ resonators (coax, ceramic, cavity) instead of microstrip.
- **Loss scales with $\sum g_k$:** higher order and higher ripple (larger $g_k$) cost loss, as does group delay: a filter loses in proportion to the energy it stores.
- **Loss is worst at the band edges**, where the group delay peaks (Chebyshev especially), so the passband rounds off at its corners.
- Low-pass: the same form without $\Delta$, with $Q$ the element $Q$ at $\omega_c$.

> [!tip] Remark
> $Q_u$ of a line resonator is $\beta/2\alpha$, set by conductor and dielectric loss of the substrate: [[Microwave Resonators#Level 1 Transmission-Line Resonators]] and [[Transmission Lines#Microstrip Losses]]. The single-resonator version, $IL=-20\log(1-Q_L/Q_0)\approx8.69\,Q_L/Q_0$ dB, is in [[Microwave Resonators#Mapping block specs to amplifier specs]]. It is the $N=1$ case of the boxed formula: a single resonator has $g_1=2$ and $Q_L=1/\Delta$, so $4.343\cdot2/(\Delta Q_u)=8.69\,Q_L/Q_u$.

```tikz title="Passband insertion loss versus resonator Q_u for the Pozar Example 8.7 prototype (sum g = 4.289), computed here from the boxed formula, for 10% and 2% bandwidth. Marked: Q_u = 783 (microstrip resonator, Pozar Ex. 6.2), 2380 (air coax, Ex. 6.1), 10,000 (titanate ceramic, Pozar Sec. 8.8)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x = log10(Q) from 2 to 4 mapped to 0..8 cm ; y = IL dB, 1 cm per dB, 0..5
  \draw[->] (0,0) -- (8.5,0) node[right] {$Q_u$};
  \draw[->] (0,0) -- (0,5.4) node[above] {$IL_0$ (dB)};
  \foreach \q/\l in {0/100,2/{316},4/{1000},6/{3162},8/{10000}} \draw (\q,0) -- (\q,-0.1) node[below,font=\scriptsize] {\l};
  \foreach \y in {1,2,3,4,5} { \draw (0,\y) -- (-0.1,\y) node[left,font=\scriptsize] {\y}; \draw[gray!30] (0,\y) -- (8,\y); }
  \draw[blue,thick,domain=0:8,samples=60] plot (\x,{186.29/pow(10,2+\x/4)});
  \draw[red,thick,domain=1.27:8,samples=60] plot (\x,{931.5/pow(10,2+\x/4)});
  \node[blue,font=\scriptsize,anchor=west] at (0.15,1.6) {$\Delta=10\%$};
  \node[red,font=\scriptsize,anchor=west] at (2.4,3.2) {$\Delta=2\%$};
  \foreach \q/\v in {783/0.238,2380/0.0783,10000/0.0186} {
    \pgfmathsetmacro{\xx}{4*(log10(\q)-2)}
    \fill[blue] (\xx,\v) circle (0.06);
  }
  \node[font=\scriptsize,blue] at (4.6,0.55) {0.24 dB};
  \node[font=\scriptsize,blue] at (6.5,0.4) {0.08 dB};
  \node[font=\scriptsize,blue] at (7.9,0.32) {0.02 dB};
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: Cohn's loss formula from one lossy element (not in the assigned sources; S. B. Cohn 1959, Matthaei et al. §4.13)
> Give one prototype shunt capacitor $g_1$ (between 1 Ω terminations, normalized) a conductance $G=\omega_c'g_1/Q$, i.e. a quality factor $Q$ at the cutoff $\omega_c'=1$. The through voltage drops from $\tfrac12$ to $\tfrac1{2+G}$, an extra loss $20\log(1+G/2)\approx8.686\,G/2=4.343\,g_1/Q$ dB. Each element contributes the same way to first order, so $\Delta IL\approx4.343\sum g_k/Q_k$. For a bandpass, the prototype capacitor $g_k$ becomes a shunt resonator $C'=g_k/(\omega_0\Delta Z_0)$ ([[Filters#LP → HP, BP, BS]]); its loss conductance $\omega_0C'/Q_u$ normalized to $Z_0$ is $g_k/(\Delta Q_u)$, i.e. it acts as a prototype element of $Q=\Delta Q_u$. Substituting gives the boxed formula.
> **Energy view:** at a reflectionless passband frequency the energy stored is $W=P\tau_g$, and resonators dissipate $\omega_0W/Q_u$, so the fractional loss is $\omega_0\tau_g/Q_u$, i.e. $4.343\,\omega_0\tau_g/Q_u$ dB. For one shunt resonator $\tau_g=C'=g_1/(\omega_0\Delta)$ (normalized), which reproduces the first form. This first-order result is accurate while $IL_0$ is small (a few dB at most).

> [!example] Worked: what $Q_u$ does to Pozar Ex. 8.7 and Ex. 8.6 (computed here, except the last line)
> - **Ex. 8.7** ($N=3$, $\Delta=0.1$, $\sum g=4.289$): $IL_0\approx186.3/Q_u$ dB: **0.24 dB** at $Q_u=783$, **0.08 dB** at 2380, **0.02 dB** at 10,000.
> - Same prototype at **2% bandwidth**: five times worse, 1.19 dB at $Q_u=783$. A narrow microstrip filter in front of an LNA is a noise-figure problem.
> - **Ex. 8.6** (stepped-impedance on $\tan\delta=0.02$ FR4-class board): Pozar's computed response shows about **1 dB** of passband loss at 2 GHz. Dielectric loss of that size dominates.

### Microstrip Non-Idealities

The design equations above assume ideal TEM lines, ideal opens and junctions with no parasitics. In microstrip:

- **Open ends are longer than drawn** (fringing): stubs and coupled-line sections must be cut shorter. The end correction and step and T-junction models are owned by [[Transmission Lines#Microstrip Discontinuities]].
- **Steps between very different widths** (stepped-impedance, stub roots) add junction reactance; the larger $Z_h/Z_\ell$, the larger the step.
- **Even and odd modes travel at different speeds** in microstrip ($\epsilon_{e,even}>\epsilon_{e,odd}$), so a coupled section has no single electrical length ([[Power Dividers and Couplers#Physics background]], binder p. 369).
- **Dispersion** shifts $\epsilon_e$ with frequency ([[Transmission Lines#Microstrip Dispersion]]), moving the band edges of wideband designs.
- **Realizable impedances** are bounded: very wide low-$Z$ lines support transverse resonances, very narrow high-$Z$ lines are lossy and hard to etch. Pozar's 20 Ω and 120 Ω on a 1.58 mm, $\epsilon_r=4.2$ board are typical limits.

> [!note]- Detail: consequences seen in practice (not in the assigned sources)
> Because the even mode is slower than the odd mode, a microstrip parallel-coupled filter typically shows a spurious response near $2f_0$ rather than only at $3f_0$ as the ideal-line analysis predicts, and its upper skirt is less steep. Common fixes are over-coupling compensation, wiggly or corrugated coupled edges, or a cascaded low-pass filter to cover the spurious band. Designs today are finished in an EM simulator (method of moments for planar circuits) after the closed-form start given here; Pozar's own remark that "most microwave filter design is done with sophisticated computer-aided design packages" is the same point.

## Level 4: Measuring and Tuning

```tikz title="A filter is measured as a two-port on a calibrated VNA: S21 gives insertion loss, ripple, rejection and group delay; S11 gives return loss. Tuning loops back to the layout. VNA and calibration are owned by Microwave Network Analysis."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=gray!10] (0,0) rectangle (3,2.2); \node[align=center,font=\scriptsize] at (1.4,1.3) {VNA};
  \node[font=\scriptsize,anchor=east] at (3,1.1) {port 1}; \node[font=\scriptsize,anchor=south] at (1.5,0) {port 2};
  \draw[thick,fill=orange!25] (4.5,0.6) rectangle (6.7,1.6); \node[font=\scriptsize] at (5.6,1.1) {filter DUT};
  \draw[thick] (3,1.1) -- (4.5,1.1);
  \draw[thick] (6.7,1.1) -- (7.2,1.1) -- (7.2,-0.5) -- (1.5,-0.5) -- (1.5,0);
  \draw[red,dashed] (4.3,0.3) -- (4.3,1.9); \draw[red,dashed] (6.9,0.3) -- (6.9,1.9);
  \node[red,font=\scriptsize] at (5.6,2.2) {calibration reference planes};
  \node[font=\scriptsize,align=left,anchor=west] at (8.0,1.6) {$|S_{21}|$: $IL_0$, ripple, $f_c$/BW, rejection, spurious bands};
  \node[font=\scriptsize,align=left,anchor=west] at (8.0,1.0) {$\angle S_{21}$: group delay $\tau_g=-d\phi/d\omega$};
  \node[font=\scriptsize,align=left,anchor=west] at (8.0,0.4) {$|S_{11}|$: return loss in the passband};
  \draw[->,thick] (5.6,-0.8) -- (5.6,-1.6);
  \node[draw,rounded corners,fill=gray!8,font=\scriptsize,align=center] at (5.6,-2.2) {compare to design $\to$ trim / tune $\to$ re-measure};
\end{circuitikz}
\end{document}
```

**What to measure** (the spec list, read off a calibrated VNA):
1. $|S_{21}|$ in dB: passband $IL_0$, ripple, band edges, rejection at the specified frequencies, and a **wide sweep** for the spurious passbands ($4f_c$ stub LPF, $3f_0$ coupled-line, near $2f_0$ in microstrip).
2. $|S_{11}|$: passband return loss. An equal-ripple filter's ripple shows up as return-loss peaks between reflection zeros.
3. Group delay from the phase of $S_{21}$: peaks at the band edges.

$$
\boxed{Q_u\approx\frac{4.343\sum g_k}{\Delta\cdot IL_0(\text{dB})}}
$$

- **Extract $Q_u$ from a measured filter** by inverting the loss formula: a quick check whether the substrate and conductors behave as modelled.
- **Calibrate to the filter's connectors** (or de-embed the fixture), otherwise the fixture's loss reads as filter loss: [[Microwave Network Analysis#Level 5 Measurement VNA, Calibration, De-embedding]].

> [!tip] Remark
> A single resonator's $Q_u$ is measured directly from its transmission or reflection response: [[Microwave Resonators#Level 4 Measuring Q]]. Tuning a cavity or dielectric resonator by inserting metal or dielectric is [[Microwave Resonators#Tuning by Perturbation]].

> [!note]- Detail: tuning practice (not in the assigned sources)
> - **Printed filters** are tuned by design iteration (EM simulation, then a re-spin), or on the bench by trimming open stub ends (shorter raises the resonance) and adding small capacitive pads; laser trimming is used in volume.
> - **Cavity, combline and ceramic filters** get one tuning screw per resonator (sets $f_0$ of that resonator) and sometimes per coupling (sets $J$). A standard bench method tunes the resonators one at a time from the input: short all but the first, set its reflection phase, then open the next, and so on (Dishal's method), or tunes on the group delay of $S_{11}$, which isolates each resonator's effect.
> - Tune centre frequency first, then the couplings (bandwidth and ripple), then re-check the centre: couplings pull the resonances, exactly as a coupling gap pulls a single resonator ([[Microwave Resonators#Gap-Coupled Microstrip Resonator]]).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ Order $N$ | Rejection, steeper skirts | Size, $IL_0\propto\sum g_k$, group delay, tuning effort |
| ↑ Ripple (Chebyshev vs Butterworth) | Steeper skirt at the same $N$ | Larger $g_k$, more loss and group-delay peaking |
| ↓ Bandwidth $\Delta$ | Selectivity | $IL_0\propto1/\Delta$; extreme stub impedances; tighter tolerances |
| ↑ Resonator $Q_u$ (air, ceramic, cavity) | $IL_0$, sharper corners | Volume, cost, not printable |
| ↑ $Z_h/Z_\ell$ (stepped-impedance) | Closer to the lumped prototype | Lossy, fragile narrow lines; wide lines resonate transversely |
| Richards stubs vs stepped-impedance | Sharper cutoff, exact at $f_c$ | Larger, more junctions, periodic at $4f_c$ |
| Coupled lines vs gap coupling | Shorter: $(N+1)$ quarter-waves side by side vs $N$ half-waves in line | Even/odd velocity mismatch in microstrip; wider board |
| Higher-$\epsilon_r$ substrate | Smaller filter | Narrower lines for the same $Z$, tighter tolerances, often more dielectric loss |
| Filter before the LNA | Blocker rejection, LNA linearity | NF rises by $IL_0$ dB |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Stub and $\lambda/4$ impedances | $Z^{SC}=jZ_0\tan\beta\ell$, $Z^{OC}=-jZ_0\cot\beta\ell$, $Z^{\lambda/4}=Z_0^2/Z_L$ |
| Richards' transformation | $\Omega=\tan\beta\ell$; $L\to$ S.C. stub $Z_0=L$; $C\to$ O.C. stub $Z_0=1/C$; $\ell=\lambda/8$ at $\omega_c$ |
| Unit element ABCD | $\frac1{\sqrt{1+\Omega^2}}\begin{bmatrix}1&j\Omega Z_1\\j\Omega/Z_1&1\end{bmatrix}$ |
| Kuroda | $n^2=1+Z_2/Z_1$; (a) O.C. $Z_2$ \| UE $Z_1$ ≡ UE $Z_2/n^2$ \| S.C. $Z_1/n^2$; (b) UE $Z_2$ \| S.C. $Z_1$ ≡ O.C. $n^2Z_2$ \| UE $n^2Z_1$ |
| Inverters | $Z_{in}=K^2/Z_L$, $Y_{in}=J^2/Y_L$; gap: $J=Y_0\tan|\phi/2|$, $B=J/[1-(J/Y_0)^2]$ |
| Stepped-impedance | $\beta\ell=g_kR_0/Z_h$ (L), $\beta\ell=g_kZ_\ell/R_0$ (C), at $\omega_c$ |
| Coupled-line $J$ | $Z_0J_1=\sqrt{\pi\Delta/2g_1}$, $Z_0J_n=\pi\Delta/(2\sqrt{g_{n-1}g_n})$, $Z_0J_{N+1}=\sqrt{\pi\Delta/2g_Ng_{N+1}}$ |
| Coupled-line $Z_{0e}$, $Z_{0o}$ | $Z_0[1\pm JZ_0+(JZ_0)^2]$, sections $\lambda/4$ at $\omega_0$ |
| One section, image impedance at $\lambda/4$ | $Z_i=\tfrac12(Z_{0e}-Z_{0o})$ |
| $\lambda/4$ stub filters | bandstop $Z_{0n}=4Z_0/(\pi g_n\Delta)$, bandpass $Z_{0n}=\pi Z_0\Delta/(4g_n)$ |
| Gap-coupled | $B_i=J_i/[1-(Z_0J_i)^2]$, $C_i=B_i/\omega_0$, $\theta_i=\pi-\tfrac12[\tan^{-1}2Z_0B_i+\tan^{-1}2Z_0B_{i+1}]$ |
| Shunt-resonator (ceramic) | $Z_0J_{01}=\sqrt{\pi\Delta/4g_1}$, $Z_0J_{n,n+1}=\pi\Delta/(4\sqrt{g_ng_{n+1}})$, $C_{01}=J_{01}/(\omega_0\sqrt{1-(Z_0J_{01})^2})$, $\ell_n=\lambda/4+Z_0\omega_0\Delta C_n\lambda/2\pi$ |
| Insertion loss | $IL_0\approx4.343\sum g_k/(\Delta Q_u)$ dB $\approx4.343\,\omega_0\tau_g/Q_u$ |
| $Q_u$ from measurement | $Q_u\approx4.343\sum g_k/(\Delta\,IL_0)$ |
| Receiver budget (filter first) | $NF=IL_0+NF_{\text{LNA}}$ (dB); after the LNA: $F=F_{\text{LNA}}+(L_f-1)/G$ |
| Image parameters (fold) | $Z_{i1}=\sqrt{AB/CD}$, $\cosh\gamma=\sqrt{AD}$; constant-$k$ $\omega_c=2/\sqrt{LC}$; $m$-derived $\omega_\infty=\omega_c/\sqrt{1-m^2}$ |
| Periodic structure (fold) | $\cosh\gamma d=\cos\theta-\tfrac b2\sin\theta$ |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20)
  - Ch. 8 intro and §8.1 Periodic Structures, pp. 380–388 (Eqs. 8.1–8.12, Bloch impedance; folded summary only).
  - §8.2 Image Parameter Method, pp. 388–397 (image impedances, constant-$k$, $m$-derived, $m=0.6$, composite filter; folded summary only).
  - §8.3–8.4 insertion-loss method and transformations: used only through [[Filters]] (Tables 8.3–8.6, Figs. 8.26–8.27).
  - §8.5 Filter Implementation, pp. 415–422: Richards (Eqs. 8.77–8.78, Fig. 8.34), Kuroda (Table 8.7, Fig. 8.35, Eqs. 8.79–8.80), Ex. 8.5 and Figs. 8.36–8.37, inverters (Fig. 8.38).
  - §8.6 Stepped-Impedance Low-Pass Filters, pp. 422–426: Eqs. 8.81–8.86, Ex. 8.6, Figs. 8.39–8.41.
  - §8.7 Coupled Line Filters, pp. 426–436: Eqs. 8.87–8.121, Table 8.8, Figs. 8.42–8.46, Ex. 8.7.
  - §8.8 Filters Using Coupled Resonators, pp. 437–448: Eqs. 8.122–8.141, Figs. 8.47–8.55, Exs. 8.8–8.10, ceramic material data.
  - §10.2 Noise Figure, pp. 504–507: Friis (Eq. 10.23), Ex. 10.2 (receiver with filter), passive two-port noise figure.
  - Exs. 6.1 and 6.2 (resonator $Q_0$ values reused for the loss examples).
- **ECE 373 lecture binder (Boumaiza, Waterloo), "RF Filters"** (scanned; binder page = slide number + 256), pp. 257–315: why filters (transceiver front end, p. 258), filter types and specs (pp. 259–261), insertion-loss prototypes and tables (pp. 265–275), design procedure (p. 277), transformations and examples (pp. 278–292), Richards (pp. 294–295), all-stub 5 GHz example and Kuroda derivation and application (pp. 296–302), stepped-impedance with delays and 2 GHz example (pp. 303–307), inverters (pp. 308–310), coupled-line equivalent and design steps (pp. 311–314), 5th-order 10 GHz coupled-line example (p. 315). Also p. 369 (even/odd mode velocity in microstrip).
- **Computed here** (marked in the text): the three response plots (ideal-line ABCD cascades of Pozar's designs), the 50 Ω feed width for Ex. 8.6, the IL-vs-$Q_u$ curve and numbers, the filter-before-LNA case of Ex. 10.2, and the ABCD check of the Kuroda identities.
- **Not in the assigned sources** (flagged in folds): Cohn's dissipation-loss formula (S. B. Cohn, "Dissipation loss in multiple-coupled-resonator filters," Proc. IRE, 1959; Matthaei, Young, Jones §4.13), the microstrip $2f_0$ spurious behaviour, and bench tuning methods.
