---
title: Capacitor
description: The integrated capacitor from parallel plates to MOS, junction, poly-poly, MIM and MOM structures, their density, voltage and temperature coefficients, parasitics, Q, layout and matching, ending in which capacitor to draw for a given circuit need.
kind: topic
status: growing
aliases:
  - Capacitor
  - Capacitors
  - Integrated Capacitors
  - MOS Capacitor
  - MIM Capacitor
---

Every integrated capacitor is two conductors and a dielectric. The first section treats it as $C = \varepsilon A/t$; each section after that adds what the real structure does: which conductors and dielectric the process offers, how the value moves with voltage and temperature, what parasitics hang on each plate, how it behaves at RF, and how to lay out matched arrays. Stop anywhere and the picture is still correct, just coarser.

## The big picture

```tikz title="The CMOS capacitor menu in one cross-section: MOS (gate oxide), poly-poly, MIM (thin dielectric between metals) and lateral-flux MOM (finger sidewalls). Thinner dielectric means more fF per square micron; semiconductor plates mean voltage dependence. After Hastings Figs. 7.14-7.18 and Carusone Fig. 1.37."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % legend
  \begin{scope}[shift={(0,5.6)}]
    \draw[fill=red!30] (0,0) rectangle (0.4,0.25); \node[anchor=west,font=\scriptsize] at (0.45,0.12) {poly};
    \draw[fill=green!30] (1.4,0) rectangle (1.8,0.25); \node[anchor=west,font=\scriptsize] at (1.85,0.12) {diffusion};
    \draw[fill=blue!30] (3.3,0) rectangle (3.7,0.25); \node[anchor=west,font=\scriptsize] at (3.75,0.12) {metal $x$};
    \draw[fill=violet!35] (5.1,0) rectangle (5.5,0.25); \node[anchor=west,font=\scriptsize] at (5.55,0.12) {metal $x{+}1$};
    \draw[fill=yellow!60] (7.1,0) rectangle (7.5,0.25); \node[anchor=west,font=\scriptsize] at (7.55,0.12) {thin dielectric};
    \draw[dashed] (9.6,0) rectangle (10.0,0.25); \node[anchor=west,font=\scriptsize] at (10.05,0.12) {well};
    \draw[fill=black] (11.0,0.02) rectangle (11.2,0.23); \node[anchor=west,font=\scriptsize] at (11.25,0.12) {contact/via};
  \end{scope}
  \fill[orange!10] (0,0) rectangle (13,1.6); \node[font=\scriptsize] at (12.3,0.25) {p-substrate};
  \draw (0,1.6) -- (13,1.6);
  \fill[gray!12] (3.2,1.6) rectangle (13,5.2);
  % MOS cap
  \draw[dashed,fill=green!8] (0.2,1.6) -- (0.2,0.5) -- (3.0,0.5) -- (3.0,1.6);
  \draw[fill=green!35] (0.3,1.35) rectangle (0.8,1.6); \draw[fill=green!35] (2.4,1.35) rectangle (2.9,1.6);
  \draw[fill=yellow!60] (0.8,1.6) rectangle (2.4,1.68);
  \draw[fill=red!30] (0.8,1.68) rectangle (2.4,2.0);
  \node[font=\scriptsize,align=center] at (1.6,0.9) {n-well};
  \node[font=\scriptsize,align=center] at (1.6,2.55) {MOS\\ $\approx$0.9--4.3 fF/µm$^2$\\ nonlinear};
  % poly-poly
  \draw[fill=red!30] (3.6,1.9) rectangle (5.6,2.2);
  \draw[fill=yellow!60] (3.9,2.2) rectangle (5.3,2.28);
  \draw[fill=red!45] (3.9,2.28) rectangle (5.3,2.55);
  \node[font=\scriptsize,align=center] at (4.6,3.15) {poly-poly\\ $\approx$1.3 fF/µm$^2$};
  % MIM
  \draw[fill=blue!30] (6.2,3.0) rectangle (8.4,3.3);
  \draw[fill=yellow!60] (6.5,3.3) rectangle (8.1,3.38);
  \draw[fill=violet!35] (6.5,3.38) rectangle (8.1,3.6);
  \draw[fill=black] (7.2,3.6) rectangle (7.4,4.2);
  \draw[fill=violet!35] (6.8,4.2) rectangle (7.8,4.45);
  \node[font=\scriptsize,align=center] at (7.3,2.35) {MIM / TiN\\ $\approx$3 fF/µm$^2$, linear};
  % MOM
  \foreach \i/\c in {0/blue!30,1/violet!35,2/blue!30,3/violet!35,4/blue!30,5/violet!35} {
    \draw[fill=\c] ({9.2+0.55*\i},3.0) rectangle ({9.2+0.55*\i+0.28},4.0);
    \node[font=\tiny] at ({9.2+0.55*\i+0.14},3.5) {\ifodd\i B\else A\fi};
  }
  \node[font=\scriptsize,align=center] at (10.7,2.35) {MOM fingers\\ sidewall flux, linear};
  \draw[<->,thick,red!60!black] (9.48,3.5) -- (9.75,3.5);
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Plates:** $C = \varepsilon_r\varepsilon_0 A/t$ plus fringing at the edges. Density is set by the thinnest dielectric you can use: gate oxide (MOS) ≳ dedicated thin film (MIM, poly-poly) ≫ interlevel oxide (metal stacks).
> 2. **Semiconductor plates make the value bias-dependent.** Junction and MOS capacitors vary with voltage (tens of %); poly plates deplete slightly; metal-metal capacitors are essentially linear (a few ppm/V).
> 3. **Absolute value is poor, ratios are excellent.** Thin-film capacitors vary about ±10–20%, junction capacitors ±30%. Build every ratio from identical unit capacitors in a common-centroid array.
> 4. **Two plates are never equal.** The plate nearer the substrate carries the bigger parasitic ($C_{p1}\gg C_{p2}$); connect it to a low-impedance or driven node and keep the quiet plate on the sensitive node.
> 5. **Q of a capacitor is $1/(\omega CR_s)$.** Series resistance (plate, channel, dielectric loss) and series inductance limit it; above its self-resonance a capacitor is an inductor.

**Map:** [[#Spec translation|spec → device]] → [[#Level 1 Parallel Plates|plates, fringing, dielectrics]] → [[#Level 2 Capacitor Types|junction, MOS, varactor, poly-poly, MIM, MOM, trench]] → [[#Level 3 Variability|process, voltage, temperature]] → [[#Level 4 Parasitics, Q and High Frequency|parasitics, Q, SRF]] → [[#Layout|matched arrays]].

## Spec translation

A capacitor is not an amplifier, so this section maps the **circuit's capacitor requirements** onto a **device type and geometry**.

```tikz title="Density of each capacitor type (log scale) from Hastings Table 7.3, with the metal-plate values from Razavi (analog CMOS Sec. 19.2.6 and data converters Sec. 11.5) and a 28 nm MOS value from Razavi data converters Sec. 11.5. Red bars are strongly voltage dependent; blue bars are linear."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x = 3*(log10(C)+2), C in fF/um^2 from 0.01 to 10
  \draw[->] (0,0) -- (10.4,0) node[right] {fF/µm$^2$};
  \foreach \e/\lab in {-2/{0.01},-1/{0.1},0/{1},1/{10}} { \draw ({3*(\e+2)},0.08) -- ({3*(\e+2)},-0.08) node[below,font=\scriptsize] {\lab}; }
  \foreach \i/\c/\lab/\col in {
    0/20/{MOS, 28 nm (Razavi, data converters)}/red!55,
    1/4.3/{thin gate oxide (MOS, BiCMOS)}/red!55,
    2/3.1/{TiN / MIM}/blue!45,
    3/2.2/{thick gate oxide (MOS)}/red!55,
    4/1.3/{poly-poly (ONO)}/blue!45,
    5/0.86/{400 Å gate oxide (MOS)}/red!55,
    6/0.8/{base-emitter junction}/red!55,
    7/0.07/{lateral flux (MOM)}/blue!45,
    8/0.0375/{one metal-metal gap (Razavi)}/blue!45,
    9/0.05/{metal-metal-poly stack}/blue!45,
    10/0.05/{M9-M8 plate (Razavi, data converters)}/blue!45} {
    \pgfmathsetmacro{\xx}{3*(log10(\c)+2)}
    \fill[\col] (0,{-0.55*\i-0.75}) rectangle (\xx,{-0.55*\i-0.35});
    \node[anchor=west,font=\scriptsize] at ({\xx+0.1},{-0.55*\i-0.55}) {\lab: \c};
  }
  \draw (0,0) -- (0,-6.4);
\end{circuitikz}
\end{document}
```

**The capacitor's own specs:** value $C$; absolute tolerance; ratio matching; voltage coefficient (linearity); temperature coefficient; density (area); parasitic to substrate on each plate; Q at the operating frequency and self-resonant frequency (SRF); voltage rating and reliability (TDDB); leakage.

| Circuit need (where it comes from) | Device choice | Geometry / connection knob | Why |
|---|---|---|---|
| Minimum value for noise ($kT/C$) in a sampler or SC stage | Any linear type; area follows from density | $C\ge kT/v_n^2$ | See [[Noise]] |
| Ratio accuracy (SC gain, charge-redistribution DAC, ADC residue) | MIM, poly-poly, MOM | Identical units, common centroid, dummies, equal $P/A$ | Overetch and gradients cancel; see [[#Layout]] |
| Linearity (SC sampling, precision charge transfer) | MIM / metal-metal, or heavily doped poly-poly | Avoid MOS and junction caps | MOS charge $\int C\,dV\ne CV$ |
| Maximum density, value not critical (supply decoupling, compensation of a fixed-polarity node) | MOS cap biased deep in inversion or accumulation | $\ge0.5$–1 V of overdrive; short fingers | Gate oxide is the thinnest dielectric |
| Electrically tuned C (VCO) | Accumulation-mode MOS varactor; reverse-biased junction | Many small units, low series $R$ | Monotonic $C(V)$; see [[Oscillators]] |
| Q at RF ($Q = 1/\omega CR_s$) | MIM, MOM (woven for low $L$) | Short, wide fingers; many contacts | Lower $R_s$ and $L_s$ |
| Low bottom-plate parasitic | Metal stack using upper layers; MIM high in the stack | Bottom plate to the driven/low-Z node | $C_p/C$ 5–10% vs ~20% |
| High voltage | Interlevel-oxide stack, thick dielectrics | $V_{max} = t_{min}E_{max}$ | Thin dielectrics break down |
| Bipolar-polarity bias | Back-to-back PMOS inversion caps; or MIM | Two halves, each $C/2$ | MOS dip in depletion |

> [!tip] Remark
> The minimum capacitor for a noise target comes from the sampled thermal noise $\overline{v_n^2} = kT/C$, owned by [[Noise]]. Mismatch statistics (how $\sigma(\Delta C/C)$ falls with area) belong to [[Device Matching]]; this note owns what makes one capacitor's value move and what the layout must do about it.

$$
\boxed{V_{max} = t_{min}\,E_{max}}\qquad\boxed{Q_C = \frac{1}{\omega CR_s},\quad R_s < \frac{0.1}{\omega C}\ \text{(rule of thumb)}}\qquad\boxed{\tau_{MOS} = \frac{L^2}{4\mu(V_{GS}-V_{TH})}\cdot\frac13}
$$

> [!note]- Derivation: voltage rating and composite dielectrics (Hastings Eqs. 7.4–7.5)
> The dielectric breaks down when the field exceeds its strength, and it degrades over time (TDDB) at a fraction of that, so reliability engineers specify a derated $E_{max}$. The thinnest dielectric must survive the full voltage: $V_{max} = t_{min}E_{max}$. Example: 200 Å dry oxide at $E_{max} = 5$ MV/cm gives 10 V.
>
> Stacked dielectrics are capacitors in series: $\varepsilon_r = (t_1+t_2)/(t_1/\varepsilon_{r1}+t_2/\varepsilon_{r2})$. 200 Å of nitride ($\varepsilon_r = 7.5$) between two 50 Å oxides (3.9) gives $\varepsilon_r = 5.7$.

> [!note]- Derivation: series resistance and time constant of a MOS capacitor (Razavi Sec. 18.7.2)
> The bottom plate of a MOS capacitor in inversion is the channel, a resistor $R_{tot} = [\mu C_{ox}(W/L)(V_{GS}-V_{TH})]^{-1}$ end to end. With source and drain both contacted, charge enters from both ends, so each half sees $R_{tot}/2$ and the two halves are in parallel: $R_{tot}/4$. The time constant with $C = WLC_{ox}$:
> $$\tau = \frac{R_{tot}}{4}WLC_{ox} = \frac{L^2}{4\mu(V_{GS}-V_{TH})}$$
> Because $R$ and $C$ are distributed along the channel, the true time constant is one third of this. Width cancels: only $L$ and overdrive set $\tau$. So a MOS capacitor is drawn as **many wide, short fingers** in parallel, never as a square block (Razavi Fig. 18.20), at the cost of more junction capacitance and some area.
>
> Hastings states the same thing for the gate side: a poly finger contacted at one end behaves as a lumped resistance of one third its end-to-end resistance; contacting both ends cuts that by four.

**Where the specs land in sizing:**

| Spec | Sets |
|---|---|
| $C$ and density | Area $A = C/(C/A)$ |
| $kT/C$ noise | Minimum $C$, hence minimum area |
| Matching | Unit size (area) and array pattern |
| VC, TC | Device type only |
| Q at $f$ | Finger length ($R_s$), connection density, structure ($L_s$) |
| Parasitic $C_p/C$ | Layers used, plate orientation |
| $V_{max}$ | Dielectric thickness (type) |

**Worked example (areas for 1 pF, from Hastings Table 7.3 densities):**

| Type | Density (fF/µm²) | Area for 1 pF | Notes |
|---|---|---|---|
| Thin gate oxide (MOS) | 4.3 | 233 µm² | Nonlinear; 3.6 V rating |
| TiN (MIM) | 3.1 | 323 µm² | Linear; 7 V |
| Poly-poly (ONO) | 1.3 | 770 µm² | Linear; 15 V |
| Lateral flux | 0.07 | 14,300 µm² | Linear; 40 V |
| Metal-metal-poly stack | 0.05 | 20,000 µm² | Linear; 40 V |

Hastings also notes that roughly 30,000 µm² of 10 kÅ interlevel oxide is needed for 1 pF, which is why plain metal-metal capacitors are used only for small values or high voltage.

## Level 1: Parallel Plates

### Plates and Dielectrics

```tikz title="Parallel-plate capacitor and its field. Most flux runs straight between the plates (C = eps A / t); the fringing field at the edges adds C_F, significant only for small plates or narrow lines. After Hastings Figs. 7.1 and 7.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=blue!30] (0,1.2) rectangle (6,1.4);
  \draw[fill=violet!35] (0,0) rectangle (6,0.2);
  \fill[yellow!40] (0,0.2) rectangle (6,1.2);
  \foreach \x in {0.4,1.0,...,5.8} { \draw[->,gray] (\x,1.2) -- (\x,0.22); }
  \draw[->,gray] (0,1.3) .. controls (-0.9,1.3) and (-0.9,0.1) .. (0,0.1);
  \draw[->,gray] (0,1.38) .. controls (-1.4,1.5) and (-1.4,-0.1) .. (0,0.02);
  \draw[->,gray] (6,1.3) .. controls (6.9,1.3) and (6.9,0.1) .. (6,0.1);
  \draw[->,gray] (6,1.38) .. controls (7.4,1.5) and (7.4,-0.1) .. (6,0.02);
  \draw[<->] (6.2,0.2) -- (6.2,1.2); \node[font=\scriptsize,right] at (7.4,0.7) {$t$};
  \draw (6.2,0.7) -- (7.4,0.7);
  \node[font=\scriptsize] at (-1.2,1.75) {fringing field};
  \node[font=\scriptsize] at (3,1.65) {area $A$, perimeter $P$};
  \node[font=\scriptsize] at (3,-0.35) {dielectric $\varepsilon = \varepsilon_r\varepsilon_0$};
\end{circuitikz}
\end{document}
```

$$
\boxed{C = \frac{\varepsilon_r\varepsilon_0A}{t},\qquad \varepsilon_0 = 8.854\ \text{pF/m}}
$$

- 0.1 mm² of 200 Å dry oxide ($\varepsilon_r = 3.9$) is 170 pF: integrated capacitors are limited to a few hundred pF at best.
- Thinner dielectric = more density but lower breakdown voltage.

| Dielectric | $\varepsilon_r$ | Strength (MV/cm) |
|---|---|---|
| Silicon | 11.8 | 30 |
| Dry oxide (SiO$_2$) | 3.9 | 11 |
| PECVD oxide | 4.9 | 3–6 |
| TEOS oxide | 4.0 | 10 |
| LPCVD nitride | 6–7 | 10 |
| PECVD nitride | 6–9 | 5 |
| HfO$_2$ (high-k gate) | ≈25 | — |

(Hastings Table 7.1.)

### Fringing

$$
\boxed{C_F \approx \frac{\varepsilon P}{\pi}\left[\ln\frac{2eP}{t} + \frac12\ln\left(1+\frac{4t_e}{t}\right)\right]}
$$

($P$ perimeter, $t_e$ electrode thickness, $e\approx2.718$.) For a 5 µm square poly plate over 200 Å oxide with 5 kÅ thick electrode: 43.1 fF of plate capacitance plus 2.6 fF of fringe. Fringing matters for **small** capacitors and for **narrow lines**, where it dominates: a 1 µm-wide, 5 kÅ-thick line 8 kÅ above the substrate has about 60% of its capacitance in fringe.

> [!note]- Detail: capacitance of a wire over a plane (Hastings Eq. 7.7, Razavi Eq. 18.11)
> $$\frac{C}{L} = \varepsilon\left[\frac Wh + 0.77 + 1.06\left(\frac Wh\right)^{0.25} + 1.06\left(\frac th\right)^{0.5}\right]$$
> for width $W$, thickness $t$, height $h$ above a conducting plane; within ±2% for $W/h>1$, $0.1<t/h<4$. The first term is the plate, the rest fringe. Interconnect extraction itself (and wire-to-wire coupling) belongs to [[CMOS Processing]] and [[Packaging]].

## Level 2: Capacitor Types

> [!tip] Remark
> How each layer and dielectric is fabricated is in [[CMOS Processing]]. The MOS capacitances of a transistor ($C_{GS}$, $C_{GD}$, overlap, junction) are in [[MosFETs#Capacitances]]; here the same structures are used on purpose.

### Junction Capacitors

```tikz title="Junction capacitance versus bias. It rises toward forward bias (peaking near 0.7 V before conduction swamps it) and falls with reverse bias until avalanche (about -7 V for a base-emitter junction). After Hastings Fig. 7.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[<->] (0,0) -- (9,0) node[right] {$V_F$};
  \draw[->] (5,0) -- (5,3.6) node[above] {$c_j$};
  \draw[very thick,red!70!black,domain=-6:0.62,samples=60] plot ({5+0.65*\x},{1.6*pow(1-\x/0.75,-0.33)});
  \draw[very thick,red!70!black] ({5+0.65*0.62},{1.6*pow(1-0.62/0.75,-0.33)}) .. controls (5.6,3.4) and (5.85,3.3) .. (5.95,2.6);
  \draw[dashed,red!70!black] (5.95,2.6) -- (6.05,1.8);
  \node[font=\scriptsize] at (4.75,1.75) {$c_{j0}$};
  \draw (4.92,1.6) -- (5.08,1.6);
  \node[font=\scriptsize,anchor=west] at (6.2,3.2) {peak near 0.7 V, then forward conduction};
  \node[font=\scriptsize,align=center] at (1.1,1.25) {avalanche\\ $\approx-7$ V};
  \node[font=\scriptsize] at (2.5,-0.35) {reverse bias};
  \node[font=\scriptsize] at (7.2,-0.35) {forward bias};
\end{circuitikz}
\end{document}
```

$$
\boxed{c_j = c_{j0}\left(1-\frac{V_F}{\phi_b}\right)^{-m},\qquad m = 0.5\ \text{(abrupt)}\ \dots\ 0.33\ \text{(linearly graded)}}
$$

- Silicon's permittivity is 3× oxide and the depletion region is thin, so density is high (base-emitter ≈0.8 fF/µm² at zero bias), but the value falls to about 75% at −1 V and 50% at −5 V; ±30% process; TC +500 to +700 ppm/°C; leaky; must stay reverse biased.
- Area and perimeter both count: $c_{j0} = c_aA_d + c_pP_d$. A **comb** (fingered) layout beats a **plate** when the finger spacing $S_f < 2c_p/c_a$ (Hastings measured $c_a = 0.82$ fF/µm², $c_p = 2.8$ fF/µm for a base-emitter junction).
- In CMOS, junction caps are mostly used as **varactors**; MOS capacitors replaced them for fixed values (Carusone Sec. 1.6.2).

> [!note]- Derivation: zero-bias junction capacitance (Hastings Eqs. 7.12–7.16)
> For a one-sided abrupt junction (heavy side $N_H$, light side $N_L$),
> $$c_{j0} = \frac{A\varepsilon_{si}}{x_{j0}},\quad x_{j0}\simeq\sqrt{\frac{2\varepsilon_{si}\phi_b}{qN_L}},\quad \phi_b = V_T\ln\frac{N_HN_L}{n_i^2}$$
> A diffusion has curved sidewalls, so its area is $A_{total}\approx A_d + \frac\pi2x_jP_d$, which is why the empirical $c_aA_d + c_pP_d$ form works. TC: $\phi_b$ depends on $V_T$ and $n_i(T)$; Hastings' example ($N_L = 10^{17}$, $N_H = 10^{19}$ cm$^{-3}$) gives about +600 ppm/°C; heavier doping reduces it. The junction-capacitance physics itself is in [[Diodes]].

### MOS Capacitors

```tikz title="Small-signal capacitance of a MOS capacitor versus gate voltage (NMOS shown). Flat at C_ox in accumulation, a dip through depletion with the minimum near threshold, back to C_ox in inversion only if source/drain diffusions supply the inversion charge. After Hastings Fig. 7.8 and Carusone Fig. 1.36(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[<->] (0,0) -- (10,0) node[right] {$V_{GB}$};
  \draw[->] (4,0) -- (4,3.4) node[above] {$C$};
  \draw[very thick,violet] (0.3,2.7) -- (4.0,2.7) .. controls (4.5,2.7) and (4.6,0.8) .. (5.0,0.8) -- (5.3,0.8) .. controls (5.7,0.8) and (5.8,2.7) .. (6.3,2.7) -- (9.5,2.7);
  \draw[dashed,violet] (5.3,0.8) -- (9.5,0.8);
  \draw[dashed,gray] (0,2.7) -- (0.3,2.7); \node[font=\scriptsize,left] at (0,2.7) {$C_{ox}WL$};
  \node[font=\scriptsize] at (2.0,3.0) {accumulation};
  \node[font=\scriptsize] at (4.8,0.45) {depletion};
  \node[font=\scriptsize] at (7.9,3.0) {inversion};
  \node[font=\scriptsize,align=left,anchor=west] at (6.6,1.25) {S/D tied to backgate: recovers to $C_{ox}$\\ no S/D: stays near $c_{min}$ (dashed)};
  \draw (5.15,0.08) -- (5.15,-0.08) node[below,font=\scriptsize] {$V_t$};
  \draw (3.7,0.08) -- (3.7,-0.08) node[below,font=\scriptsize] {$V_{FB}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{C_{MOS(on)} = WLC_{ox} + 2WL_{ov}C_{ox},\qquad C_{MOS(off)}\approx 2WL_{ov}C_{ox}}
$$

(Carusone Eqs. 1.135–1.136, PMOS with S, D, B tied: "on" in inversion or accumulation, "off" in depletion.)

- **Densest capacitor on the die**, needs no extra masks, modelled by the transistor model. Bottom-plate parasitic (S/D junctions or well) is 10–20% of the gate capacitance (Razavi).
- **Nonlinear**: bias it **deep** in accumulation or inversion, with at least 0.5–1 V of overdrive; even 0.5 V can leave it 10% short of $C_{ox}$ (Hastings).
- **Leaky** below about 50 Å (tunnelling), increasingly so below 40 Å.

| Type | Backgate | Optimal bias |
|---|---|---|
| NMOS accumulation | N-type (NMOS in n-well) | $V_{GB} < V_{FB} - 0.5$ V |
| NMOS inversion | P-type | $V_{GS} > V_t + 0.5$ V |
| PMOS accumulation | P-type | $V_{GB} > V_{FB} + 0.5$ V |
| PMOS inversion | N-type (n-well) | $V_{GS} < V_t - 0.5$ V |

(Hastings Table 7.2; "NMOS accumulation" here means an N-poly gate over an N backgate.)

```tikz title="Two MOS capacitor cross-sections in a p-substrate CMOS process. Left: PMOS inversion capacitor (S, D and n-well tied together form the lower plate). Right: NMOS-in-n-well accumulation capacitor, the standard accumulation-mode varactor. The n-well-to-substrate junction is the bottom-plate parasitic C_W. After Hastings Fig. 7.12 and Razavi Fig. 15.59(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (12,1.8);
  \foreach \ox/\sd/\lab in {0/{p$^+$}/{PMOS inversion},6.3/{n$^+$}/{n-gate over n-well: accumulation (varactor)}} {
    \begin{scope}[shift={(\ox,0)}]
      \draw[dashed,fill=green!8] (0.3,1.8) -- (0.3,0.6) -- (5.4,0.6) -- (5.4,1.8);
      \draw[fill=green!35] (0.6,1.5) rectangle (1.5,1.8); \node[font=\scriptsize] at (1.05,1.3) {\sd};
      \draw[fill=green!35] (4.2,1.5) rectangle (5.1,1.8); \node[font=\scriptsize] at (4.65,1.3) {\sd};
      \draw[fill=yellow!60] (1.5,1.8) rectangle (4.2,1.88);
      \draw[fill=red!30] (1.5,1.88) rectangle (4.2,2.2);
      \draw[fill=black] (2.75,2.2) rectangle (2.95,2.55); \node[font=\scriptsize,anchor=west] at (2.97,2.45) {gate};
      \draw[fill=black] (0.95,1.8) rectangle (1.15,2.4); \draw[fill=black] (4.55,1.8) rectangle (4.75,2.4);
      \draw (1.05,2.4) -- (1.05,3.0) -- (4.65,3.0) -- (4.65,2.4);
      \node[font=\scriptsize,above] at (2.85,3.0) {lower plate};
      \node[font=\scriptsize] at (2.85,0.95) {n-well};
      \node[font=\scriptsize] at (2.85,-0.3) {\lab};
      \draw[->] (0.6,0.6) -- (0.6,0.15); \node[font=\scriptsize,anchor=west] at (0.65,0.3) {$C_W$ to substrate};
    \end{scope}
  }
\end{circuitikz}
\end{document}
```

**Which MOS capacitor for which connection** (p-substrate, Hastings Sec. 7.1.3):
- One terminal at substrate potential, the other above it: NMOS inversion or PMOS accumulation (the silicon plate's parasitics go to ground and vanish).
- One terminal at the positive supply: PMOS inversion (source and backgate on the supply).
- Neither terminal on a supply, parasitic must be off the lower-voltage plate: PMOS inversion with the gate on the lower potential; tie the n-well to a quiet positive supply to isolate it from substrate noise.
- Bias that changes polarity: two antiparallel PMOS inversion caps of $C/2$ each; their dips are offset by $2V_t$.

> [!note]- Derivation: the bottom of the C-V dip and the flatband voltage (Hastings Eqs. 7.22–7.24)
> Deep accumulation: $c_{ox} = WL\varepsilon_{ox}/t_{ox}$. At threshold, oxide in series with the maximum depletion width:
> $$c_{min} = \frac{WL}{\dfrac{t_{ox}}{\varepsilon_{ox}} + \sqrt{\dfrac{4V_T}{q\varepsilon_{si}N_B}\ln\dfrac{N_B}{n_i}}}$$
> Without S/D diffusions the inversion layer forms only by thermal generation (hundreds of ms), so the capacitance stays at $c_{min}$ at any useful frequency.
> $$V_{FB} = V_t - 2V_T\ln\frac{N_B}{n_i} - \frac{t_{ox}}{\varepsilon_{ox}}\sqrt{4q\varepsilon_{si}N_BV_T\ln\frac{N_B}{n_i}}$$
> Example: $N_B = 10^{17}$ cm$^{-3}$, $t_{ox} = 200$ Å gives $V_{FB}$ about 1.8 V below $V_t$; with $V_t = 0.7$ V, $V_{FB} = -1.1$ V. In practice read $V_{FB}$ off a measured C-V curve.

> [!note]- Worked example: a MOS capacitor in a precision ×2 stage (Razavi Ex. 18.1)
> In a multiply-by-two SC amplifier with a MOS sampling capacitor $C_1$ and a linear feedback capacitor $C_2$, the charge transferred as $C_1$'s voltage falls from $V_{in}$ to zero is $\int_0^{V_{in}}C_1(V)\,dV$, the area under the C-V curve, not $C_1V_{in}$:
> $$V_{out}\approx V_{in} + \frac{1}{C_2}\int_0^{V_{in}}C_1\,dV$$
> The gain therefore depends on signal level: distortion. This is why precision charge transfer uses MIM, MOM or poly-poly capacitors.

### MOS Varactors and Junction Varactors

- **Accumulation-mode MOS varactor**: NMOS gate over an n-well with n$^+$ "source/drain" as well contacts (right side of the cross-section above). Its $C(V_{GS})$ is **monotonic**, unlike an inversion-mode device, which is why it is the standard VCO varactor (Razavi Sec. 15.4).
- **Junction varactor** (p$^+$ in n-well): the n-well's resistivity puts a resistance in series (lowering Q), and the n-well-to-substrate capacitance adds a fixed $C$ that limits tuning range. Surrounding each small p$^+$ island with an n$^+$ ring cuts the series resistance; many small units are paralleled (Razavi Figs. 15.55–15.56).

> [!tip] Remark
> How the varactor's $C_{max}/C_{min}$ and fixed parasitics set a VCO's tuning range and $K_{VCO}$ is owned by [[Oscillators]]; RF detector varactors belong to Active RF Devices.

### Poly-Poly Capacitors

```tikz title="Poly-poly capacitor: poly-1 lower plate on thick field oxide, thin ONO or nitride dielectric, poly-2 upper plate. The lower plate carries the substrate parasitic C_2; the upper plate couples only to leads above it (C_3). After Hastings Figs. 7.9(A) and 7.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (8,1.2); \node[font=\scriptsize] at (7.3,0.3) {p-substrate};
  \fill[gray!15] (0,1.2) rectangle (8,1.7); \node[font=\scriptsize] at (7.0,1.45) {field oxide};
  \draw[fill=red!30] (1.0,1.7) rectangle (6.0,2.05);
  \draw[fill=yellow!60] (1.6,2.05) rectangle (5.0,2.13);
  \draw[fill=red!45] (1.6,2.13) rectangle (5.0,2.45);
  \node[font=\scriptsize] at (3.3,2.29) {poly-2 (C1)};
  \node[font=\scriptsize] at (3.3,1.86) {poly-1 (C2)};
  \draw[fill=black] (3.2,2.45) rectangle (3.4,2.9); \draw[fill=black] (5.5,2.05) rectangle (5.7,2.9);
  \draw[->] (0.9,2.75) -- (1.7,2.1); \node[font=\scriptsize,anchor=east] at (0.9,2.8) {ONO / nitride};
  \begin{scope}[shift={(10.0,0)}]
    \draw (0,3.2) node[ocirc]{} to[C,l=$C_3$] (0,2.2) node[circ]{} -- (-0.7,2.2) node[ocirc]{} node[left,font=\scriptsize]{upper};
    \draw (0,2.2) to[C,l=$C_1$] (0,1.2) node[circ]{} -- (-0.7,1.2) node[ocirc]{} node[left,font=\scriptsize]{lower};
    \draw (0,1.2) to[C,l=$C_2$] (0,0.2) -- (-0.7,0.2) node[ocirc]{} node[left,font=\scriptsize]{SUBS};
    \node[font=\scriptsize,anchor=west] at (0.2,3.35) {overlying leads};
  \end{scope}
\end{circuitikz}
\end{document}
```

- About 1.3 fF/µm², ±25%, 15 V (Hastings Table 7.3). Both plates heavily doped: VC about 150 ppm/V unsilicided, TC below 250 ppm/°C (Hastings). Splitting it into two halves connected anti-parallel cancels most of the VC (2 ppm/V reported).
- **ONO dielectrics** show **dielectric absorption** (soakage): trapped charge redistributes slowly, giving hysteresis and frequency dependence above about 10 MHz. Single-layer oxide or nitride is preferred where $C$ must be constant with frequency. ONO also breaks down asymmetrically (up to 50% different).
- Older flows left poly-2 **stringers** along poly-1 steps (shorts, drifting transistors); patterning poly-2 first removes them.

> [!note]- Why: poly depletion makes even poly plates bias dependent (Hastings Eqs. 7.20–7.21)
> A depletion layer of width $w_d = \varepsilon V/(qN_Pt)$ forms in the poly and adds series dielectric: $c = \varepsilon A/[t + w_d(\varepsilon/\varepsilon_{si})]$. With both plates the same type, one depletes and the other accumulates whichever way the voltage goes. Example: arsenic $5\times10^{19}$ cm$^{-3}$, 200 Å oxide, 4.5 MV/cm: $w_d = 19$ Å and the capacitance falls from 1.73 to 1.67 fF/µm². Heavier doping, or a silicided lower plate, shrinks it.

### Metal-Insulator-Metal (MIM)

```tikz title="MIM capacitor between two upper metal layers: a thin dedicated dielectric (nitride, oxide or ARC) under a TiN or metal top plate, contacted by vias. Both plates are metal: no depletion, so VC and TC are tiny. After Hastings Fig. 7.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (9,0.8); \node[font=\scriptsize] at (8.3,0.3) {substrate};
  \fill[gray!12] (0,0.8) rectangle (9,4.2); \node[font=\scriptsize] at (8.1,1.2) {interlevel oxide};
  \draw[fill=blue!30] (1.0,2.0) rectangle (7.0,2.4); \node[font=\scriptsize] at (1.7,2.2) {metal $x$};
  \draw[fill=yellow!60] (2.4,2.4) rectangle (6.4,2.48);
  \draw[fill=gray!50] (2.4,2.48) rectangle (6.4,2.7); \node[font=\scriptsize] at (4.4,2.59) {TiN top plate};
  \foreach \x in {3.0,4.3,5.6} \draw[fill=black] (\x,2.7) rectangle ({\x+0.2},3.5);
  \draw[fill=black] (1.4,2.4) rectangle (1.6,3.5);
  \draw[fill=violet!35] (2.6,3.5) rectangle (6.4,3.85); \node[font=\scriptsize] at (4.4,3.67) {metal $x{+}1$ (top terminal)};
  \draw[fill=violet!35] (1.1,3.5) rectangle (2.0,3.85);
  \draw[->] (7.6,2.44) -- (6.45,2.44); \node[font=\scriptsize,anchor=west] at (7.6,2.44) {thin dielectric};
  \draw[<->] (0.6,0.8) -- (0.6,2.0); \node[font=\scriptsize,left] at (0.6,1.4) {$h$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.1,-0.4) {bottom plate sees $C_p\propto A/h$: put MIM high in the stack};
\end{circuitikz}
\end{document}
```

- Metal plates cannot deplete, so only the dielectric's own field and temperature dependence remain. Reported values: silicide–oxide–metal 2–4 ppm/V; 600 Å nitride between silicide and TiN: $-13$ ppm/V, $-4$ ppm/V², 39 ppm/°C (Hastings). TiN capacitor ≈3.1 fF/µm², ±20%, 7 V (Table 7.3).
- Al–oxide–Al needs dielectric densification at 800–1000 °C, which aluminum (400–450 °C) cannot survive; hence refractory or silicide lower plates, or the anti-reflective coating (ARC, silicon oxynitride) under a TiN top plate as the dielectric (one extra mask, placeable between any two metal layers).
- Nitride's residual VC comes from Si–H bonds; deposition tuning reduces it.

### Metal Stacks and Lateral-Flux (MOM) Capacitors

```tikz title="Using only interconnect layers. Left: vertical sandwich, alternate plates tied to A and B; more layers give more C but move the bottom plate closer to the substrate. Right: lateral-flux (MOM) horizontal-bar structure, every strip surrounded by strips of the other terminal, so vertical and sidewall flux both count. After Razavi Fig. 19.35 and Hastings Fig. 7.18(A)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (13,0.6); \node[font=\scriptsize] at (12.3,0.3) {substrate};
  % sandwich
  \foreach \i/\c/\t in {0/blue!30/A,1/violet!35/B,2/blue!30/A,3/violet!35/B} {
    \draw[fill=\c] (0.5,{1.4+0.7*\i}) rectangle (4.5,{1.4+0.7*\i+0.25});
    \node[font=\scriptsize] at (4.8,{1.52+0.7*\i}) {\t};
  }
  \foreach \i in {0,1,2} \node[font=\scriptsize] at (2.5,{1.82+0.7*\i}) {$C_{\i}$};
  \draw[->,red!70!black] (1.0,1.4) -- (1.0,0.65); \node[font=\scriptsize,red!70!black,anchor=west] at (1.05,1.0) {$C_P$ (bottom plate)};
  \node[font=\scriptsize,align=center] at (2.5,4.6) {sandwich: $C = C_0+C_1+C_2$};
  % MOM horizontal bar
  \begin{scope}[shift={(6.5,1.3)}]
    \foreach \r in {0,1,2} \foreach \c in {0,1,2,3,4} {
      \pgfmathtruncatemacro{\p}{mod(\r+\c,2)}
      \ifnum\p=0 \def\col{blue!30}\def\tt{A}\else \def\col{violet!35}\def\tt{B}\fi
      \draw[fill=\col] ({1.1*\c},{1.0*\r}) rectangle ({1.1*\c+0.55},{1.0*\r+0.45});
      \node[font=\scriptsize] at ({1.1*\c+0.275},{1.0*\r+0.225}) {\tt};
    }
    \draw[<->,red!70!black] (0.57,0.22) -- (1.08,0.22);
    \draw[<->,red!70!black] (0.275,0.47) -- (0.275,0.98);
    \node[font=\scriptsize,align=center] at (2.5,3.3) {lateral flux (cross-section of strips)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Interlayer capacitance per metal gap is only **35–40 aF/µm²** (metal-1 to poly ≈60 aF/µm²); a full nine-metal-plus-poly sandwich is over 9× a single gap (Razavi Sec. 19.2.6).
- **Bottom-plate parasitic ratio** $C_P/C$ is lowest, about **5–10%**, for a two- or three-layer stack near the top, and rises to about **20%** for the full sandwich down to poly.
- Interlayer dielectric thickness is loosely controlled in digital processes: ±20%. The full sandwich varies **less** than a single gap because independent layer variations average out (Razavi). Gate oxide, by contrast, is controlled within about 5%.
- **Lateral flux / MOM** (Carusone's "side-wall" capacitor): when metal spacing is below the interlevel thickness, sidewall flux dominates. Horizontal bars use lateral flux in one direction; vertical bars (stacked via pillars) in two. Symmetric parasitics on both terminals ($C_{p1} = C_{p2}$). Needs a field solver to predict. A **woven** structure adds vias throughout to lower series inductance; **fractal** geometries maximise periphery with lower resistance.

> [!note]- Detail: why the parasitic ratio has a minimum mid-stack (Zettelkasten 15n, built on Razavi's numbers)
> Idealise nine metals on a uniform pitch $d$, one gap $c_u = \varepsilon/d$. A stack from metal 9 down to metal $m$ has $9-m$ gaps, so $C = (9-m)c_u$, while the bottom plate sits at height $md$: $C_P = c_u/m$. Then $C_P/C = 1/[m(9-m)]$, smallest at $m\approx4$–5. One gap ($m = 8$): 12.5%; two gaps: 7.1%; three: 5.6%, matching Razavi's 5–10%. Running down to poly adds a poly-to-substrate plate comparable to a whole interplate capacitance, which is where the ~20% comes from. This is an idealisation; real stacks have unequal pitches.

> [!note]- Detail: trench capacitors (Hastings Sec. 7.1.3)
> Etch deep trenches, line them with a dielectric and fill with doped poly: the sidewall area makes a 3-D capacitor with densities orders of magnitude above planar ones (Hastings cites 58 nF/mm² with a 35 nm nitride, and above 0.4 µF/mm² with concentric multi-layer trenches). One plate is common to the substrate unless isolated; sharp trench corners lower the voltage rating. Used for decoupling, not precision.

### Top Plate, Bottom Plate and the Metal Cage

```tikz title="Unit capacitor in a metal cage (side view). The outer plates M9, M7, M5 and a wall of vias form a closed 'bottom' terminal A; the inner plates M8, M6 form the 'top' terminal B. Every field line from B ends on A, so B's parasitic to the substrate and to neighbouring units is nearly zero; fringe outside the wall (red arrow, wall to wall) only adds to A's parasitic. After Razavi, Analysis and Design of Data Converters, Fig. 11.17(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (12,0.6); \node[font=\scriptsize] at (11.2,0.3) {substrate};
  \foreach \ox/\lab in {0.6/{unit $k$},6.4/{unit $k{+}1$}} {
    \begin{scope}[shift={(\ox,1.2)}]
      \draw[fill=blue!30] (0,0) rectangle (4.6,0.22);
      \draw[fill=blue!30] (0,1.2) rectangle (4.6,1.42);
      \draw[fill=blue!30] (0,2.4) rectangle (4.6,2.62);
      \foreach \y in {0.22,0.82,1.42,2.02} { \fill[black] (0.05,\y) rectangle (0.3,{\y+0.6}); \fill[black] (4.3,\y) rectangle (4.55,{\y+0.6}); }
      \draw[fill=violet!35] (0.6,0.6) rectangle (4.0,0.82);
      \draw[fill=violet!35] (0.6,1.8) rectangle (4.0,2.02);
      \draw[violet!70!black,thick] (2.3,2.02) -- (2.3,3.1);
      \node[font=\scriptsize,above] at (2.3,3.1) {B (top)};
      \foreach \x in {1.0,1.8,2.8,3.6} { \draw[->,gray] (\x,0.6) -- (\x,0.24); \draw[->,gray] (\x,0.82) -- (\x,1.18); \draw[->,gray] (\x,1.8) -- (\x,1.44); \draw[->,gray] (\x,2.02) -- (\x,2.38); }
      \node[font=\scriptsize] at (2.3,-0.35) {\lab};
    \end{scope}
  }
  \node[font=\scriptsize,anchor=east] at (0.55,1.31) {M5}; \node[font=\scriptsize,anchor=east] at (0.55,1.91) {M6};
  \node[font=\scriptsize,anchor=east] at (0.55,2.51) {M7}; \node[font=\scriptsize,anchor=east] at (0.55,3.11) {M8}; \node[font=\scriptsize,anchor=east] at (0.55,3.71) {M9};
  \draw[blue!60!black,thick] (5.2,3.82) -- (5.2,4.5) node[above,font=\scriptsize] {A (bottom, cage)};
  \draw[<->,red!70!black] (5.25,2.4) -- (6.35,2.4);
\end{circuitikz}
\end{document}
```

- **"Top" and "bottom" are electrical, not geometric**: the *top plate* is the terminal with less capacitance to ground; the *bottom plate* is the one with more (Razavi, *Data Converters*, Sec. 11.5). In a two-plate M9–M8 capacitor the top-plate parasitic is about **1%** and the bottom-plate parasitic about **10%** of $C$; in a multilayer stack the bottom-plate ratio bottoms out near **5%** for the top four or five metals.
- **Unit-to-unit fringe**: in an array, a top plate fringes onto the neighbouring unit's plates as well as onto the substrate. Some of this adds to the neighbour (a mismatch that cancels only if the array is symmetric), some to ground.
- **Metal cage**: enclose the top plate in a closed surface tied to the bottom terminal (outer plates plus a wall of vias). All flux from the top plate then ends on its own bottom plate; the top-plate parasitic becomes very small, and outside fringe only adds to the bottom plate. A lateral (finger) capacitor, which is otherwise nearly symmetric (equal parasitics on A and B), can be caged the same way.
- **Cost**: each plate must extend sideways to a via column, adding $2S_1 + 2S_2$ (metal spacing plus via width) to one dimension of every unit.
- **Small units**: very small capacitors can use two widely separated layers; Razavi quotes about 10 aF/µm² plate plus 30 aF/µm fringe for M9 over M1, so two 0.8 µm × 0.8 µm plates give about 0.1 fF, at the price of a bottom-plate parasitic larger than $C$ itself.

> [!tip] Remark
> What each parasitic does to a converter (gain error from the top plate, only extra reference current from the bottom plate) is owned by [[DACs]]; the same orientation rule appears in [[Sampling Circuits#Bottom-Plate Sampling]].

## Level 3: Variability

### Process

| Type | Typical process variation | Main cause |
|---|---|---|
| Gate oxide (MOS) | ±20% routine, ±10% in some processes; Razavi: <5% | Oxide thickness |
| ONO poly-poly | at least ±20% | Three-step dielectric |
| Interlayer metal (digital process) | up to ±20% | ILD thickness |
| Junction, plate layout | at least ±20% | Doping, junction depth |
| Junction, comb layout | at least ±30% | Perimeter more sensitive |
| Thin-film overall (Hastings summary) | about ±10% | Dimensions |

Capacitors are hard to trim (trim circuitry adds parasitics), so circuits are built to depend on **capacitor ratios**, or trim a resistor or current instead (Hastings Sec. 7.3).

### Voltage

| Type | VC |
|---|---|
| Junction | $c_j\propto(1-V_F/\phi_b)^{-m}$: tens of % over a few volts |
| MOS | Full C-V dip; flat only deep in accumulation/inversion |
| Deep-N$^+$ MOS (450 Å oxide) | $\beta_1 = 450$ ppm/V, $\beta_2 = 80$ ppm/V² (<5% over range) |
| Poly-poly (unsilicided) | ≈150 ppm/V |
| Poly-poly, anti-parallel halves | ≈2 ppm/V |
| MIM, silicide–oxide–metal | 2–4 ppm/V |
| MIM, nitride, TiN top | −13 ppm/V, −4 ppm/V² |

> [!tip] Remark
> Same convention as [[Resistor#Voltage Coefficient and Nonlinearity]]: $C(V) = C_0[1+\beta_1V+\beta_2V^2]$, and the dynamic $c = dQ/dV$ differs from the absolute $C = Q/V$ for any nonlinear capacitor. How a VC becomes HD2/HD3 in a circuit is in [[Nonlinearity and Mismatch]].

### Temperature

- Thin-film capacitors: TC comes from the permittivity: oxide about **+20 ppm/°C**, nitride about **+12 ppm/°C**.
- Poly-poly: below 50 ppm/°C from poly depletion alone; Hastings also quotes "typically less than 250 ppm/°C" including VC effects.
- Junction: positive and large (≈+600 ppm/°C in Hastings' example; +500 to +700 ppm/°C for base-emitter).

> [!note]- Detail: reliability derating, TDDB (Hastings Sec. 7.1)
> Amorphous dielectrics wear out under field (time-dependent dielectric breakdown); crystalline silicon does not. Failure rate scales with area $A$, duty cycle $d$ and field:
> $$F_2 = F_1\frac{A_2}{A_1}\left(\frac{d_2}{d_1}\right)^\beta\exp[\beta\gamma(E_2-E_1)]\quad\text{(McPherson / E-model)}$$
> (the AHI model uses $\exp[\beta G(1/E_2-1/E_1)]$). Example: a 120 Å oxide rated 1 FIT/mm² at 4.5 MV/cm with $\beta = 2$, $\gamma = 3.5$ cm/MV; operating 1000 µm² at 6 MV/cm for 10% of the time adds only 0.36 FIT. Industry budgets around ten FITs for all TDDB, so small analog capacitors can often run above the "one size fits all" field rule if the designer does the derating.

## Level 4: Parasitics, Q and High Frequency

```tikz title="Subcircuit models. (A) Poly-poly or any deposited capacitor: C_1 the wanted capacitor, C_2 lower plate to substrate, C_3 upper plate to overlying leads. (B) MOS capacitor: two voltage-dependent halves, distributed channel/accumulation resistance R_1, gate resistance R_2, well-substrate diodes and substrate resistance R_3. After Hastings Figs. 7.9(A) and 7.10(B)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3.6) node[ocirc]{} to[C,l=$C_3$] (0,2.4) node[circ]{} -- (-0.8,2.4) node[ocirc]{} node[left,font=\scriptsize]{upper};
  \draw (0,2.4) to[C,l=$C_1$] (0,1.2) node[circ]{} -- (-0.8,1.2) node[ocirc]{} node[left,font=\scriptsize]{lower};
  \draw (0,1.2) to[C,l=$C_2$] (0,0) -- (-0.8,0) node[ocirc]{} node[left,font=\scriptsize]{SUBS};
  \node at (0,-0.6) {(A)};
  \begin{scope}[shift={(4.2,0)}]
    \draw (-0.6,3.4) node[ocirc]{} node[left,font=\scriptsize]{G} -- (0.5,3.4) to[R,l=$R_2$] (3.3,3.4);
    \draw (0.5,3.4) to[vC,l_=$C_1$] (0.5,2.0);
    \draw (3.3,3.4) to[vC,l=$C_2$] (3.3,2.0);
    \draw (-0.6,2.0) node[ocirc]{} node[left,font=\scriptsize]{D/S/B} -- (0.5,2.0) to[vR,l_=$R_1$] (3.3,2.0);
    \draw (0.5,0.6) to[D] (0.5,2.0);
    \draw (3.3,0.6) to[D] (3.3,2.0);
    \draw (0.5,0.6) -- (3.3,0.6);
    \draw (0.5,0.6) to[R,l=$R_3$] (-0.6,0.6) node[ocirc]{} node[left,font=\scriptsize]{SUBS};
    \node at (1.9,-0.6) {(B)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Every capacitor couples **both** plates to something else; electrodes made of silicon add distributed series resistance. The bottom plate (nearer the substrate) always has more parasitic: $C_{p1}\gg C_{p2}$ (Carusone Fig. 1.37). Orientation is a circuit decision; the layout must match it.
- In Hastings' poly-poly model with series resistance, the resistance $R_1$ also represents **dielectric loss**, which rises with frequency; oxide and nitride have very low loss.
- Diffused-electrode capacitors have diodes, not capacitors, to the substrate: they leak at high temperature, and if forward biased can latch up, so guard-ring them.

> [!tip] Remark
> **Q of a component vs Q of a resonator.** $Q_C = 1/(\omega CR_s)$ is a property of this one capacitor. A capacitor of finite $Q$ placed in a tank sets part of the tank's loss: near resonance the series $R_s$ can be swapped for a parallel $R_p\approx Q_C^2R_s$ (Razavi Sec. 15.3.1, shown for the inductor in [[Inductor#Series and Parallel Equivalents]]). How component $Q$s combine into the loaded/unloaded Q of a resonator is owned by [[Microwave Resonators]].

### RF Capacitor Model and Self-Resonance

```tikz title="Impedance of a real capacitor versus frequency. Below the series self-resonance it follows 1/(omega C); at SRF the lead/plate inductance cancels C and |Z| dips to R_s; above it the part is inductive. Shape after the ECE 373 binder, slide 40."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.5,0) node[right] {$\log f$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$\log|Z|$};
  \draw[dashed,red!70!black] (0.2,3.9) -- (7.5,0.3);
  \draw[very thick,blue!60!black] (0.2,3.9) -- (4.3,1.88) .. controls (4.8,1.6) and (5.0,0.3) .. (5.15,0.15) .. controls (5.3,0.3) and (5.5,1.5) .. (5.9,1.8) -- (8.0,3.4);
  \node[font=\scriptsize,red!70!black,anchor=west] at (7.55,0.3) {ideal $1/\omega C$};
  \node[font=\scriptsize,anchor=south west] at (2.0,3.1) {capacitive};
  \node[font=\scriptsize,anchor=south east] at (7.9,3.4) {inductive: $\omega L_s$};
  \node[font=\scriptsize,anchor=north] at (5.15,0.1) {SRF $=1/(2\pi\sqrt{L_sC})$};
  \begin{scope}[shift={(0.3,-3.0)}]
    \draw (0,1) node[ocirc]{} to[L,l=$L_s$] (1.8,1) to[R,l=$R_s$] (3.4,1) coordinate(a);
    \draw (a) -- (3.4,1.6) to[C,l=$C$] (5.2,1.6) -- (5.2,1);
    \draw (a) -- (3.4,0.4) to[R,l_=$R_p$] (5.2,0.4) -- (5.2,1) -- (5.8,1) node[ocirc]{};
    \node[font=\scriptsize,anchor=west] at (6.1,1.0) {$Z = j\omega L_s + \dfrac{1}{\omega C(j+\tan\Delta)}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{Z = j\omega L_s + R_s + \frac{1}{\omega C\,(j+\tan\Delta)},\qquad f_{SRF} = \frac{1}{2\pi\sqrt{L_sC}}}
$$

$\tan\Delta$ is the dielectric loss tangent ([[EM Foundations#Fields in Media Permittivity and Loss Tangent]]); it appears as a shunt conductance $G = \omega C\tan\delta$ across $C$. A capacitor is usable only well below its SRF.

> [!note]- Detail: microwave lumped capacitors (Pozar Sec. 5.1 Point of Interest; ECE 373 binder slides 36, 42)
> | Structure | Range | Model |
> |---|---|---|
> | Open stub | 0–0.1 pF shunt | — |
> | Gap or interdigital gap | up to about 0.5 pF series | $R$–$L$–$C$ in series, $C_1$ to ground at each end; $R = \frac43R_s\ell/(WN)$ |
> | Metal-insulator-metal | up to about 25 pF | $R$–$L$ in series with $C\parallel G$, $G = \omega C\tan\delta$; $C_1 = C_2$ plate-to-ground |
>
> The binder's MIM formula $C\,(\text{pF}) = 10^{-3}\varepsilon_{rd}W\ell/(36\pi d)$ is just $\varepsilon A/d$ with $W,\ell,d$ in µm. Lumped elements work while their size is below about $\lambda/10$.

## Layout

```tikz title="Matched capacitor array for C1 = 8 C2 (Razavi Ex. 19.4): C2 is one unit at the centre, C1 is the eight units around it, so horizontal and vertical gradients cancel to first order; a ring of dummy units gives the edge units the same surroundings. After Razavi Fig. 19.37(b) and Carusone Fig. 2.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \r in {0,...,4} \foreach \c in {0,...,4} {
    \pgfmathtruncatemacro{\edge}{(\r==0)||(\r==4)||(\c==0)||(\c==4)}
    \pgfmathtruncatemacro{\mid}{(\r==2)&&(\c==2)}
    \ifnum\edge=1 \def\col{gray!25}\def\tt{D}\else\ifnum\mid=1 \def\col{violet!40}\def\tt{$C_2$}\else\def\col{blue!25}\def\tt{$C_1$}\fi\fi
    \draw[fill=\col] ({1.0*\c},{1.0*\r}) rectangle ({1.0*\c+0.8},{1.0*\r+0.8});
    \node[font=\scriptsize] at ({1.0*\c+0.4},{1.0*\r+0.4}) {\tt};
  }
  \draw[->,thick,red!70!black] (-0.6,-0.3) -- (5.2,-0.3) node[right,font=\scriptsize] {$x$ gradient};
  \draw[->,thick,red!70!black] (-0.6,-0.3) -- (-0.6,5.0) node[above,font=\scriptsize] {$y$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.4,3.4) {$C_1$ centroid = $C_2$ centroid = array centre:\\ a gradient $g_xx+g_yy$ shifts both by the\\ same fraction, so $C_1/C_2 = 8$ holds.\\[3pt] D = dummy: same neighbours for every\\ active unit (etch, fringing).};
\end{circuitikz}
\end{document}
```

```tikz title="Bad versus good for a non-integer ratio. Overetch Delta e shrinks every edge, so the relative error is proportional to perimeter/area. Bad: the 2.314-unit capacitor drawn as one big square has a smaller P/A than the unit and is under-etched relatively. Good: one unit plus a 1.314-unit rectangle with the same P/A as the unit (Carusone Ex. 2.6: 19.56 um x 6.72 um with 10 um units)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % overetch detail
  \draw[dashed] (0,0) rectangle (2.4,2.4);
  \draw[fill=blue!25] (0.25,0.25) rectangle (2.15,2.15);
  \draw[<->] (0,-0.25) -- (2.4,-0.25) node[midway,below,font=\scriptsize] {$x_1$ drawn};
  \draw[<->] (2.15,1.2) -- (2.4,1.2); \node[font=\scriptsize,anchor=west] at (2.45,1.2) {$\Delta e$};
  \node[font=\scriptsize,align=center] at (1.2,1.2) {true\\ $x_1-2\Delta e$};
  % bad
  \node[font=\small\bfseries,red!70!black] at (6.0,3.3) {bad};
  \draw[fill=blue!25] (4.6,0) rectangle (5.6,1.0); \node[font=\scriptsize] at (5.1,0.5) {1};
  \draw[fill=violet!30] (5.9,0) rectangle (7.42,1.52); \node[font=\scriptsize] at (6.66,0.76) {2.314};
  \node[font=\scriptsize,align=center] at (6.0,-0.6) {$P/A$: 0.4 vs 0.26 µm$^{-1}$};
  % good
  \begin{scope}[shift={(9.0,0)}]
    \node[font=\small\bfseries,green!50!black] at (1.5,3.3) {good};
    \draw[fill=blue!25] (0,0) rectangle (1.0,1.0); \node[font=\scriptsize] at (0.5,0.5) {1};
    \draw[fill=violet!30] (1.3,0) rectangle (2.3,1.0); \node[font=\scriptsize] at (1.8,0.5) {1};
    \draw[fill=violet!30] (2.6,0) rectangle (3.27,1.956); \node[font=\scriptsize,rotate=90] at (2.935,0.98) {1.314};
    \node[font=\scriptsize,align=center] at (1.6,-0.6) {every piece: $A/P = 2.5$ µm};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Rules (in the open; justifications below):**
1. **Unit capacitors only**: every capacitor in a ratio is a parallel set of identical units; overetch then cancels exactly.
2. If a non-integer remainder is unavoidable, draw it as a **rectangle of 1–2 units with the same perimeter-to-area ratio** as the unit: $y_2 = x_1\left(K\pm\sqrt{K^2-K}\right)$, $x_2 = Kx_1^2/y_2$.
3. **Common centroid** (smaller capacitor in the middle) for gradients in oxide thickness; needed only for very accurate ratios over larger arrays.
4. **Dummy units** around the array; match the boundary with extra top-plate material.
5. **Match the wiring**: equal connection tabs on every unit (add unconnected tabs if needed); route so that no top-plate wire crosses another capacitor's bottom plate unevenly. Capacitors, unlike resistors and transistors, see every femtofarad of wiring (Razavi Fig. 19.38).
6. **Orientation**: bottom plate (bigger parasitic, noisier) to the low-impedance or driven node (op-amp output, driven input); top plate to the sensitive node (op-amp virtual ground).
7. **Shield**: put the shared bottom plate over a well tied to a quiet supply; for extra shielding sandwich the top plate under a metal layer tied to the bottom plate.
8. **MOS capacitors**: many short, wide fingers or contacts over the active gate, a ring of S/D (or backgate) contacts around the plate; size the contact array moderately (antenna effect).

> [!note]- Derivation: equal perimeter-to-area ratio cancels overetch (Carusone Eqs. 2.21–2.33)
> A unit of drawn side $x_1$ etched by $\Delta e$ per edge has $C_a = C_{ox}(x_1-2\Delta e)(y_1-2\Delta e)$, so the relative error is
> $$\varepsilon_r = \frac{\Delta C}{C}\approx\frac{-2\Delta e(x_1+y_1)}{x_1y_1} = -\Delta e\,\frac{P}{A}$$
> Two capacitors keep their ratio if $\varepsilon_{r1} = \varepsilon_{r2}$, i.e. equal $P/A$. For a rectangle $x_2\times y_2$ with $K = A_2/A_1$ (1 < K < 2) and a square unit $x_1$: equal $P/A$ means $x_2+y_2 = 2Kx_1$ and $x_2y_2 = Kx_1^2$, so $y_2^2 - 2Kx_1y_2 + Kx_1^2 = 0$:
> $$y_2 = x_1\left(K\pm\sqrt{K^2-K}\right)$$
> **Carusone Ex. 2.6:** 10 µm units, $K = 1.314$: $y_2 = 19.56$ µm or $6.717$ µm (the other is $x_2$). Area/perimeter of the rectangle is 2.5 µm, the same as the unit's $100/40$.

> [!note]- Why: what the other rules cancel
> - **Dummies and boundary matching:** etch rate and fringe field of an edge unit depend on its neighbours; a dummy ring makes every active unit an "inner" unit.
> - **Wiring:** a top-plate wire running over another unit's bottom plate adds capacitance to one capacitor only; equal tabs and symmetric routing make the extra capacitance a common factor.
> - **Orientation:** in an SC circuit the bottom plate's parasitic to substrate is charged by whatever drives it; on a driven node it costs only drive current, on the virtual ground it adds noise coupling and gain error.
> - **Common centroid:** Carusone notes that oxide-thickness gradients are small over small areas, so common-centroid is reserved for very accurate ratios. Full gradient and mismatch treatment: [[Device Matching]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Thinner dielectric (MOS, MIM) | Density | Voltage rating, leakage (gate oxide), TDDB |
| MOS instead of MIM | Density, no extra mask | Linearity, needs bias, bottom-plate junction |
| More metal layers in a stack | Density | Bottom-plate parasitic ratio (5–10% → 20%) |
| MOM / lateral flux | Symmetric parasitics, no extra mask, dense in fine-pitch processes | Needs a field solver, series $R$ of narrow strips |
| Larger unit capacitor | Matching, kT/C noise | Area, parasitic, speed |
| Short, wide MOS fingers | Series $R$, Q | Junction/perimeter parasitic, area |
| Bottom plate on the driven node | Noise, accuracy at the sensitive node | Load on the driver |
| Common centroid + dummies | Ratio accuracy | Area, wiring capacitance |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Parallel plate | $C = \varepsilon_r\varepsilon_0A/t$ |
| Fringing (plate) | $C_F\approx\frac{\varepsilon P}{\pi}\left[\ln\frac{2eP}{t}+\frac12\ln(1+\frac{4t_e}{t})\right]$ |
| Wire over plane | $C/L = \varepsilon[W/h+0.77+1.06(W/h)^{0.25}+1.06(t/h)^{0.5}]$ |
| Voltage rating | $V_{max} = t_{min}E_{max}$ |
| Composite dielectric | $\varepsilon_r = (t_1+t_2)/(t_1/\varepsilon_{r1}+t_2/\varepsilon_{r2})$ |
| Junction | $c_j = c_{j0}(1-V_F/\phi_b)^{-m}$, $c_{j0} = c_aA_d+c_pP_d$ |
| Comb beats plate | $S_f < 2c_p/c_a$ |
| MOS on/off | $C_{on} = WLC_{ox}+2WL_{ov}C_{ox}$, $C_{off}\approx2WL_{ov}C_{ox}$ |
| MOS minimum | $c_{min} = WL/[t_{ox}/\varepsilon_{ox}+\sqrt{(4V_T/q\varepsilon_{si}N_B)\ln(N_B/n_i)}]$ |
| Poly depletion | $c = \varepsilon A/[t+w_d\varepsilon/\varepsilon_{si}]$, $w_d = \varepsilon V/(qN_Pt)$ |
| MOS cap time constant | $\tau = \frac13\cdot\frac{L^2}{4\mu(V_{GS}-V_{TH})}$ |
| Capacitor Q | $Q_C = 1/(\omega CR_s)$; choose $R_s<0.1/(\omega C)$ |
| RF model | $Z = j\omega L_s + 1/[\omega C(j+\tan\Delta)]$, SRF $=1/(2\pi\sqrt{L_sC})$ |
| Overetch error | $\Delta C/C\approx-\Delta e\,P/A$ |
| Equal-$P/A$ rectangle | $y_2 = x_1(K\pm\sqrt{K^2-K})$, $x_2 = Kx_1^2/y_2$ |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (PDF page = printed + 1), Ch. 7 Capacitors and Inductors, §7.1 Capacitance pp. 326–353: Eqs. 7.1–7.7 and Tables 7.1 (dielectrics), fringing, TDDB derating (Eqs. 7.8–7.9), junction capacitance (Eqs. 7.10–7.18, Figs. 7.4–7.6); §7.1.1 variability (Eqs. 7.19–7.25, Figs. 7.7–7.8); §7.1.2 parasitics (Figs. 7.9–7.10); §7.1.3 comparison (Table 7.2, Figs. 7.11–7.20, Table 7.3); §7.3 Summary p. 363.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF = printed + 24): §1.6.2 Capacitors pp. 58–60 (Eqs. 1.135–1.137, Figs. 1.36–1.37); §2.4.2 Capacitor Matching pp. 104–107 (Eqs. 2.20–2.33, Ex. 2.6, Figs. 2.30–2.32).
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §15.3.1 p. 618–620 (series/parallel conversion, Q of RC); §15.4 pp. 642–644 (junction and MOS varactors, Figs. 15.54–15.59); §18.7.2 pp. 724–727 (MOS capacitor, Ex. 18.1, Eqs. 18.2–18.4, Fig. 18.20); Eq. 18.11 (interconnect capacitance, p. 729); §19.2.6 pp. 750–753 (Fig. 19.35 stacks, densities, $C_P/C$, Ex. 19.4, Fig. 19.38).
- **Razavi, *Analysis and Design of Data Converters*** (PDF = printed + 19): §11.5 Capacitor Structures pp. 217–222 (MOS density in 28 nm, M9–M8 density and $C_t$/$C_b$, multilayer $C_b/C$ minimum, Figs. 11.12–11.19, metal cage, lateral capacitors); §11.8 p. 231 (Fig. 11.31, small M9–M1 capacitor).
- **Pozar, *Microwave Engineering*, 4th ed.**: §5.1 Point of Interest, pp. 233–234.
- **ECE 373 binder** (Boumaiza), slides 36, 40, 42 (binder PDF pp. 89, 93, 95): lumped microwave capacitors, RF capacitor impedance, interdigital and MIM models.
- **Zettelkasten extensions** (`AnalogTheory/Process Layout and Packaging/`): 15n (parasitic-ratio idealisation $1/[m(9-m)]$), 15g3 (MOS cap density and conditions), 15g4–15g5 (MOS cap nonlinearity, series resistance).
