---
title: Inductor
description: The integrated spiral inductor from L = flux linkage to geometry formulas, loss mechanisms, the pi equivalent circuit, Q and self-resonance, and layout rules, ending in which spiral to draw for a given L, Q and frequency.
kind: topic
status: growing
aliases:
  - Inductor
  - Inductors
  - Spiral Inductor
  - Integrated Inductors
---

An on-chip inductor is a flat spiral of metal over a lossy silicon substrate. The first section treats it as an inductance set by geometry; each section after that adds what the spiral really is: a resistor whose resistance rises with frequency, a capacitor to the substrate, and an antenna that induces eddy currents in everything nearby. Stop anywhere and the picture is still correct, just coarser.

## The big picture

```tikz title="A square planar spiral (top view) and its lumped model. The spiral is on the thickest top metal; an underpass on a lower metal brings out the inner terminal. L and R_s are the winding; C_3 is turn-to-turn and underpass capacitance; C_1, C_2 to the substrate through the oxide, R_1, R_2 the lossy substrate. After Hastings Figs. 7.22(C) and 7.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % legend
  \begin{scope}[shift={(0,5.9)}]
    \draw[fill=violet!35] (0,0) rectangle (0.4,0.25); \node[anchor=west,font=\scriptsize] at (0.45,0.12) {top metal (spiral)};
    \draw[fill=blue!30] (2.9,0) rectangle (3.3,0.25); \node[anchor=west,font=\scriptsize] at (3.35,0.12) {lower metal (underpass)};
    \draw[fill=black] (6.8,0.02) rectangle (7.0,0.23); \node[anchor=west,font=\scriptsize] at (7.05,0.12) {via};
  \end{scope}
  % spiral: 3 turns, width 0.3, pitch 0.5, outer 5.0
  \def\w{0.3}
  \fill[violet!35] (0,0) rectangle (5,\w);
  \fill[violet!35] (5-\w,0) rectangle (5,5);
  \fill[violet!35] (0,5-\w) rectangle (5,5);
  \fill[violet!35] (0,0.5) rectangle (\w,5);
  \fill[violet!35] (0,0.5) rectangle (4.5,0.5+\w);
  \fill[violet!35] (4.5-\w,0.5) rectangle (4.5,4.5);
  \fill[violet!35] (0.5,4.5-\w) rectangle (4.5,4.5);
  \fill[violet!35] (0.5,1.0) rectangle (0.5+\w,4.5);
  \fill[violet!35] (0.5,1.0) rectangle (4.0,1.0+\w);
  \fill[violet!35] (4.0-\w,1.0) rectangle (4.0,4.0);
  \fill[violet!35] (1.0,4.0-\w) rectangle (4.0,4.0);
  \fill[violet!35] (1.0,1.5) rectangle (1.0+\w,4.0);
  \fill[violet!35] (1.0,1.5) rectangle (2.4,1.5+\w);
  \fill[violet!35] (-0.8,0) rectangle (0,\w);
  \fill[blue!30] (2.1,1.55) rectangle (2.3,-0.9);
  \fill[black] (2.12,1.57) rectangle (2.28,1.73);
  \fill[violet!35] (2.0,-0.9) rectangle (2.4,-1.2);
  \fill[black] (2.12,-1.0) rectangle (2.28,-0.86);
  \node[font=\scriptsize] at (-0.95,0.15) {P1};
  \node[font=\scriptsize,anchor=north] at (2.2,-1.2) {P2};
  \draw[<->] (0,5.3) -- (5,5.3) node[midway,above,font=\scriptsize] {$d_o$};
  \draw[<->] (1.3,2.7) -- (3.7,2.7) node[midway,above,font=\scriptsize] {$d_i$};
  \draw[<->] (5.2,4.7) -- (5.2,5.0); \node[font=\scriptsize,anchor=west] at (5.25,4.85) {$w$};
  \draw[<->] (5.2,4.5) -- (5.2,4.7); \node[font=\scriptsize,anchor=west] at (5.25,4.45) {$s$};
  % model
  \begin{scope}[shift={(7.6,1.0)}]
    \draw (0,2.4) node[ocirc]{} node[left]{P1} -- (0.6,2.4) to[R,l=$R_s$] (2.3,2.4) to[L,l=$L$] (4.0,2.4) -- (4.6,2.4) node[ocirc]{} node[right]{P2};
    \draw (0.6,2.4) -- (0.6,3.4) to[C,l=$C_3$] (4.0,3.4) -- (4.0,2.4);
    \draw (0.6,2.4) node[circ]{} to[C,l_=$C_1$] (0.6,1.0) to[R,l_=$R_1$] (0.6,-0.4);
    \draw (4.0,2.4) node[circ]{} to[C,l=$C_2$] (4.0,1.0) to[R,l=$R_2$] (4.0,-0.4);
    \draw (0.6,-0.4) -- (4.0,-0.4); \draw (2.3,-0.4) node[circ]{} -- (2.3,-0.7) node[ground]{} ;
    \node[font=\scriptsize,anchor=west] at (2.4,-0.6) {SUBS};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Value:** a few nH, set by turns and diameters: $L\approx\mu_0K_1N^2d_{avg}/(1+K_2\rho)$. About 100 nH is the practical ceiling; the best spirals give 10–100 nH.
> 2. **Q of the inductor:** $Q = \omega L/R_s$. It rises with frequency, peaks, then falls as skin, proximity and substrate losses and parasitic capacitance take over. Peak Q runs from about 1 to about 40 on chip (5–10 is hard to beat on standard low-resistivity substrates); discrete air-core coils exceed 100.
> 3. **Self-resonance:** the parasitic capacitance makes it an LC tank. Above the SRF it is a capacitor; the operating frequency must sit well below it. Integrated spirals usually resonate above 1 GHz.
> 4. **Losses come from the metal and the substrate:** DC resistance (thin metal), skin and proximity current crowding above $f_{crit}$, and eddy currents plus capacitive loss in the silicon underneath.
> 5. **Layout decides most of it:** thickest top metal, hollow centre, tight turn spacing, patterned (slotted) ground shield, nothing else nearby, symmetric spirals for differential circuits.

**Map:** [[#Physics background|physics]] → [[#Spec translation|spec → geometry]] → [[#Level 1 Inductance and Geometry|inductance and spiral geometry]] → [[#Level 2 Inductance Formulas|formulas]] → [[#Level 3 Losses and the Equivalent Circuit|losses and model]] → [[#Level 4 Q and Self-Resonance|Q, SRF]] → [[#Layout|layout rules]].

## Physics background

```tikz title="Cross-section of a spiral over silicon. The winding's own field sets L; part of it penetrates the substrate and drives eddy currents (loss). Displacement current flows through the oxide (C_ox) into the resistive silicon (R_si, C_si). After Hastings Sec. 7.2.1 and the substrate branch of Shekhar et al. Fig. 15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!12] (0,0) rectangle (11,1.6); \node[font=\scriptsize] at (10.2,0.3) {silicon};
  \fill[gray!12] (0,1.6) rectangle (11,3.4); \node[font=\scriptsize] at (10.1,3.1) {oxide stack};
  \foreach \x/\d in {1.5/{$\odot$},2.5/{$\odot$},3.5/{$\odot$},7.0/{$\otimes$},8.0/{$\otimes$},9.0/{$\otimes$}} {
    \draw[fill=violet!35] (\x,3.4) rectangle ({\x+0.6},3.75);
    \node[font=\scriptsize] at ({\x+0.3},3.95) {\d};
  }
  \draw[gray,thick] (5.25,2.6) ellipse (2.6 and 1.6);
  \draw[gray,thick] (5.25,2.6) ellipse (3.6 and 2.2);
  \node[font=\scriptsize,gray] at (5.25,4.35) {magnetic field $H$};
  \draw[->,red!70!black,thick] (3.4,0.7) arc (180:0:1.85 and 0.35);
  \node[font=\scriptsize,red!70!black] at (5.25,0.25) {eddy current in substrate};
  \draw[->,blue!70!black] (1.8,3.4) -- (1.8,1.65); \node[font=\scriptsize,blue!70!black,anchor=west] at (1.85,2.4) {$C_{ox}$};
  \draw[->,blue!70!black] (1.8,1.55) -- (1.8,0.6); \node[font=\scriptsize,blue!70!black,anchor=west] at (1.85,1.1) {$R_{si}\parallel C_{si}$};
\end{circuitikz}
\end{document}
```

- **Inductance** is flux linkage per ampere, $V = L\,dI/dt$. It depends on the whole current loop, including the return path; integrated formulas assume a planar spiral far from other conductors.
- **Mutual coupling between turns** multiplies $L$ (roughly $\propto N^2$), but in a flat spiral the inner turns are smaller and not all flux links all turns, so the gain is less than in a solenoid.
- **Skin effect:** AC current crowds to the conductor surface within $\delta = \sqrt{\rho/(\pi f\mu)}$; about 2.3 µm in thin-film aluminum at 1 GHz, so thick top metals start to see it above about 1 GHz.
- **Eddy currents** are induced in any conductor the field crosses: the winding itself (skin, proximity), neighbouring metal, and the substrate. They are negligible only if that conductor is either very resistive or a near-perfect conductor; doped silicon is neither.

> [!tip] Remark
> Skin depth, surface resistance and eddy-current loss are derived once in [[EM Foundations#Skin Depth]] and [[EM Foundations#Surface Resistance]]; here only their effect on a spiral.

## Spec translation

An inductor is not an amplifier, so this section maps the **circuit's inductor requirements** onto a **spiral geometry**. The circuits that ask for inductors are tanks ([[Oscillators]]), matching networks ([[Smith Chart and Impedance Matching]]), and bandwidth-extension peaking ([[High-Speed Circuit Techniques]]).

**The inductor's own specs:** $L$ at the operating frequency; $Q$ at that frequency; SRF; area; current capacity (electromigration); symmetry (single-ended or differential); coupling $k$ (transformers, T-coils); isolation from neighbours.

| Circuit need | Geometry knob | Why |
|---|---|---|
| $L$ | $N$, $d_o$, $d_i$ (Mohan formula) | $L\propto N^2d_{avg}$ |
| $Q$ at $f$ (tank loss, LNA noise, VCO phase noise) | Wide, thick top metal; stacked layers; high-resistivity substrate; patterned ground shield; $w$ such that $f_{crit}>f$ | $Q = \omega L/R_s$; $R_s$ from DC, skin/proximity and substrate |
| SRF $\gg f$ | Small $d_o$, few turns, top metal far from substrate, few layers | SRF $=1/(2\pi\sqrt{LC_{par}})$; multilayer spirals resonate much lower |
| Area | Octagonal or square spiral; fill turns (but not the centre) | Square packs best but has the most series resistance for a given $L$ |
| Differential circuit | Symmetric (centre-tapped) spiral with crossovers | Both ends see the same parasitics; one symmetric coil replaces two |
| Wide bandwidth peaking | Small $L$ (higher SRF), parasitic C absorbed into the load | Shekhar: tie the inductor's parasitic side to the supply |
| Coupling $k$ (T-coil, transformer) | Concentric (tapped) or interleaved windings | Interleaving gives high $k$; concentric gives 0.3–0.7 |

> [!tip] Remark
> **Component Q vs resonator Q.** $Q_L = \omega L/R_s$ belongs to this one inductor. In a tank the inductor usually dominates the loss, so the tank's Q is close to $Q_L$; how component losses, the load and the coupling combine into unloaded, loaded and external Q is owned by [[Microwave Resonators]].

$$
\boxed{L\approx\mu\frac{K_1N^2(d_o+d_i)}{2\left(1+K_2\dfrac{d_o-d_i}{d_o+d_i}\right)},\quad d_i = d_o-2Np}
\qquad
\boxed{Q = \frac{\omega L}{R_s}}
\qquad
\boxed{f_{crit} = \frac{pR_\square}{2\mu w^2}}
$$

> [!note]- Derivation: from (L, f) to a first-cut geometry
> 1. Choose metal: thickest top layer (or strapped top two/three layers), $R_\square$ known.
> 2. Choose width $w$ so the winding resistance is low but current crowding has not set in at $f$: $f_{crit} = pR_\square/(2\mu w^2) > f$ gives $w < \sqrt{pR_\square/(2\mu f)}$ (with $p\approx w+s$). Hastings' rule of thumb: $w\approx10$–15 µm at 1–3 GHz. Spacing $s$ = minimum (more coupling, more $L$, less $R$).
> 3. Choose shape (octagon or square), $K_1, K_2$ from the table below, and $d_o$, $N$ with $d_i\ge5w$ and $d_i\ge d_o/3$ for larger coils. Solve Mohan's formula for $N$ at a trial $d_o$; iterate.
> 4. $R_{DC} = R_\square\ell/w$ for total length $\ell$; then $R_W = R_{DC}[1+\frac1{10}(f/f_{crit})^2]$ (valid for $d_i\approx d_o/3$) plus substrate loss, so $Q\approx\omega L/R_W$ is an upper bound.
> 5. Confirm with an EM solver (2.5-D or 3-D) and fit a compact model; Shekhar et al. found a Grover concentric-ring estimate within 10% of EM-simulated DC inductance, which makes it a good starting point that cuts EM iterations.

**Where the specs land in sizing:**

| Spec | Sets |
|---|---|
| $L$ | $N$, $d_{avg}$, shape |
| $Q$ at $f$ | $w$ (vs $f_{crit}$), metal thickness/stack, substrate, shield |
| SRF | $d_o$ (area → $C_{ox}$), layer height, number of layers |
| Current | $w$ × metal thickness (electromigration) |
| Symmetry | Topology (symmetric with crossovers) |

**Worked examples:**
- **Hastings Sec. 7.2.2:** a square spiral, $d_o = 300$ µm, 10 turns of 9 µm width and 1 µm spacing: $p = 10$ µm, $d_i = 300-2\cdot10\cdot10 = 100$ µm. Hastings states $L\approx18.6$ nH.

> [!warning] Unverified
> Evaluating Eq. 7.34 with these numbers ($K_1 = 2.34$, $K_2 = 2.75$, $d_{avg} = 200$ µm, $\rho = 0.5$, $\mu = \mu_0$) gives $\mu_0\cdot2.34\cdot100\cdot200\ \mu\text{m}/(1+1.375)\approx24.8$ nH, not 18.6 nH. The order of magnitude (tens of nH from a 300 µm, 10-turn spiral) is the point; check against an EM solver before trusting either number.

- **Hastings Eq. 7.38 example:** 5 kÅ aluminum, $R_\square = 50$ m$\Omega/\square$, $w = 9$ µm, $p = 10$ µm: $f_{crit} = 2.4$ GHz. Above that, current crowding raises $R_s$ quadratically.
- **Shekhar et al. (JSSC 2006), 0.18 µm CMOS, 2 µm top metal:** an asymmetric (tapped) octagonal T-coil, 132.4 µm outer dimension, 3.24 µm trace, 3 µm spacing, four primary and three secondary turns: EM-simulated winding inductances about 2.6 nH and 1.05 nH at low frequency, simulated **SRF 19.2 GHz** and **Q of 9**.

## Level 1: Inductance and Geometry

### Loops, Solenoids and Bondwires

$$
\boxed{L_{loop} = \mu r\left[\ln\frac{8r}{a}-1.75\right]}\qquad\boxed{L_{solenoid} = \mu\frac{N^2r^2}{D}}
$$

(loop of radius $r$ in wire of radius $a$; toroidal solenoid of $N$ turns of radius $r$ around a toroid of diameter $D$, Hastings Eqs. 7.31, 7.33). The solenoid's $N^2$ is why discrete coils on high-permeability cores reach henries. Integrated circuits have $\mu_r\approx1$ and no third dimension, so they use planar spirals.

- A bondwire (25 µm diameter, about 1 mm long) contributes several nH. At $di/dt$ of $5\times10^7$ A/s (an amp in 20 ns) 5 nH drops 0.25 V, enough to pull diffusions beyond the rails. Package and bondwire inductance belong to [[Packaging]].

### Planar Spirals

```tikz title="Spiral shapes: circular (lowest series resistance for a given L, hard to draw), octagonal, square (most resistance, easiest), and the symmetric spiral whose crossovers make both terminals equivalent. After Hastings Figs. 7.22 and 7.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % circular
  \foreach \r in {1.2,0.9,0.6} \draw[violet!50,line width=4pt] (1.4,1.4) circle (\r);
  \node[font=\scriptsize] at (1.4,-0.1) {circular};
  % octagon
  \begin{scope}[shift={(4.4,1.4)}]
    \foreach \r in {1.25,0.95,0.65} \draw[violet!50,line width=4pt] (22.5:\r) \foreach \a in {67.5,112.5,...,337.5} { -- (\a:\r) } -- cycle;
  \end{scope}
  \node[font=\scriptsize] at (4.4,-0.1) {octagonal};
  % square
  \begin{scope}[shift={(7.4,1.4)}]
    \foreach \r in {1.1,0.8,0.5} \draw[violet!50,line width=4pt] (-\r,-\r) rectangle (\r,\r);
  \end{scope}
  \node[font=\scriptsize] at (7.4,-0.1) {square};
  % symmetric
  \begin{scope}[shift={(11.0,1.4)}]
    \draw[violet!50,line width=4pt] (-0.15,1.2) -- (-1.2,1.2) -- (-1.2,-1.2) -- (-0.15,-1.2);
    \draw[violet!50,line width=4pt] (0.15,1.2) -- (1.2,1.2) -- (1.2,-1.2) -- (0.15,-1.2);
    \draw[violet!50,line width=4pt] (-0.15,0.8) -- (-0.8,0.8) -- (-0.8,-0.8) -- (-0.15,-0.8);
    \draw[violet!50,line width=4pt] (0.15,0.8) -- (0.8,0.8) -- (0.8,-0.8) -- (0.15,-0.8);
    \draw[violet!50,line width=4pt] (-0.15,1.2) -- (0.15,0.8);
    \draw[blue!40,line width=4pt] (0.15,1.2) -- (-0.15,0.8);
    \draw[violet!50,line width=4pt] (0.8,0.8) -- (0.8,0.8);
    \draw[violet!50,line width=4pt] (-0.15,-1.2) -- (-0.15,-1.6); \draw[violet!50,line width=4pt] (0.15,-1.2) -- (0.15,-1.6);
    \draw[violet!50,line width=4pt] (-0.15,-0.8) -- (0.15,-0.8);
    \fill[black] (0.1,1.15) rectangle (0.2,1.25); \fill[black] (-0.2,0.75) rectangle (-0.1,0.85);
    \node[font=\scriptsize,anchor=west] at (1.35,1.0) {crossover};
    \node[font=\scriptsize] at (-0.45,-1.8) {P1}; \node[font=\scriptsize] at (0.45,-1.8) {P2};
  \end{scope}
  \node[font=\scriptsize] at (11.0,-0.9) {symmetric};
\end{circuitikz}
\end{document}
```

- A simple spiral is **asymmetric**: one terminal is the outer turn, the other the inner turn reached by an underpass, so the two ends see different parasitics. Jumpers that swap the turns halfway round make a **symmetric** spiral (Hastings Fig. 7.23), preferred for differential and balanced circuits; symmetry also lowers loss, so even single-ended designs benefit.
- A spiral is weaker than a solenoid of the same turns because its inner turns are small and not all flux couples all turns.
- **Coupled spirals** make transformers (power combiners, baluns) and T-coils; they suffer even more from parasitic losses than single coils.

> [!tip] Remark
> T-coil and shunt/series peaking design (choosing $L$, $k$, $C_B$ for bandwidth extension) is owned by [[High-Speed Circuit Techniques]]; here only the coil as a component. Shekhar et al. chose a concentric (tapped) asymmetric winding because their required coupling, 0.3–0.7, is too low for an interleaved T-coil.

## Level 2: Inductance Formulas

$$
\boxed{L = \mu\frac{K_1N^2(d_o+d_i)}{2\left(1+K_2\dfrac{d_o-d_i}{d_o+d_i}\right)}}\qquad \text{square: }K_1 = 2.34,\ K_2 = 2.75;\quad \text{octagon: }K_1 = 2.25,\ K_2 = 3.55
$$

(Mohan, Hershenson, Boyd and Lee 1999, as given by Hastings Eq. 7.34.) With $d_{avg} = (d_o+d_i)/2$ and fill ratio $\rho = (d_o-d_i)/(d_o+d_i)$ it reads $L = \mu K_1N^2d_{avg}/(1+K_2\rho)$: inductance grows as $N^2$ and with mean diameter, and **falls as the spiral fills in** (inner turns add little).

> [!note]- Detail: microwave lumped-inductor formulas (ECE 373 binder slide 41, after Bahl)
> | Geometry | $L$ (nH) | $R$ (Ω) | Model |
> |---|---|---|---|
> | Straight strip, length $\ell$, width $W$, thickness $t$ | $2\times10^{-4}\,\ell\left[\ln\frac{\ell}{W+t}+1.193+0.2235\frac{W+t}{\ell}\right]K_g$ | $\frac{KR_s\ell}{2(W+t)}$ | $\pi$: series $R$–$L$, $C$ to ground each end |
> | Single loop, radius $a$ | $1.257\times10^{-3}\,a\left[\ln\frac{a}{W+t}+0.078\right]K_g$ | $\frac{KR_s}{W+t}\pi a$ | same |
> | Spiral, $n$ turns, $a = (D_o+D_i)/4$, $c = (D_o-D_i)/2$ | $0.03937\frac{a^2n^2}{8a+11c}K_g$ | $\frac{k\pi anR_s}{W}$ | $\pi$ plus $C_3 = 3.5\times10^{-5}D_o+0.06$ pF across |
>
> $K_g$ corrects for a ground plane underneath; lengths in µm. The spiral formula is Wheeler's. Pozar (Sec. 5.1) adds that spirals reach about 10 nH in MMICs and that larger values bring more loss and shunt capacitance, i.e. a lower resonance.

> [!note]- Detail: Grover's concentric-ring method (Shekhar et al. Appendix)
> Break the spiral into concentric rings; compute each ring's self-inductance and every pair's mutual inductance (Grover's tables) into a matrix $M$. The inductance of a winding is the sum of its rings' entries; the mutual between two windings sums the cross terms. Fast enough to iterate on geometry by hand or script before an EM run.

## Level 3: Losses and the Equivalent Circuit

```tikz title="Where the series resistance comes from. Left: at DC current fills each turn uniformly. Right: above f_crit the skin effect pushes current to the surface and the proximity effect crowds it toward the inner edges of adjacent turns, shrinking the effective cross-section. After Hastings Sec. 7.2.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \x in {0,1.4,2.8} { \draw[fill=violet!45] (\x,0) rectangle ({\x+1.0},0.5); }
  \node[font=\scriptsize] at (1.9,-0.4) {DC: uniform current};
  \begin{scope}[shift={(5.5,0)}]
    \foreach \x/\l/\r in {0/0.15/0.45,1.4/0.3/0.3,2.8/0.45/0.15} {
      \draw[fill=violet!8] (\x,0) rectangle ({\x+1.0},0.5);
      \fill[violet!60] (\x,0) rectangle ({\x+\l},0.5);
      \fill[violet!60] ({\x+1.0-\r},0) rectangle ({\x+1.0},0.5);
      \fill[violet!35] (\x,0.42) rectangle ({\x+1.0},0.5);
      \fill[violet!35] (\x,0) rectangle ({\x+1.0},0.08);
    }
    \node[font=\scriptsize] at (1.9,-0.4) {above $f_{crit}$: skin + proximity crowding};
    \draw[->] (1.9,1.1) -- (1.9,0.6); \node[font=\scriptsize] at (1.9,1.3) {turn-to-turn field};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Loss | Mechanism | Cure |
|---|---|---|
| **DC resistance** $R_{DC} = \rho\ell/A$ | IC metal is thin: matching #40 AWG magnet wire (5000 µm²) needs five 8 kÅ layers 1250 µm wide; thin-film Al is ~60% more resistive than copper | Wide turns, thick top metal (2–5 µm Cu or Al), strap 2–3 layers with vias |
| **Skin effect** | Current confined to $\delta\approx2.3$ µm in Al at 1 GHz | Matters only above ~1 GHz in thick metal |
| **Proximity effect** | Neighbouring turns' fields crowd current; worse with more turns and more layers | Few layers; $w$ below the crowding limit |
| **Substrate eddy current** | Field enters silicon and induces currents | High-resistivity substrate (>10 Ω·cm, preferably >100), top metal, cavities (MEMS), magnetic films |
| **Substrate capacitive loss** | Displacement current through $C_{ox}$ into resistive silicon | Height above substrate; grounded patterned shield |
| **Dielectric / core loss** | Magnetic shielding films have core loss rising from 100 MHz to 10 GHz | Use only where it pays |

$$
\boxed{R_W = R_{DC}\left[1+\frac1{10}\left(\frac{f}{f_{crit}}\right)^2\right],\qquad f_{crit} = \frac{pR_\square}{2\mu w^2}}
$$

(Kuhn and Ibrahim, for $d_i\approx d_o/3$, via Hastings Eqs. 7.38–7.39.) The total series resistance is $R_W$ plus a term for substrate eddy loss.

```tikz title="Impedance of a real inductor and its simplest RF model (L, R_s with C_s across). Below SRF it is inductive; at SRF the impedance peaks (parallel resonance); above it the part is a capacitor. Shape after the ECE 373 binder, slide 38."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.5,0) node[right] {$\log f$};
  \draw[->] (0,0) -- (0,4.4) node[above] {$\log|Z|$};
  \draw[dashed,red!70!black] (0.3,0.1) -- (8.0,3.9);
  \draw[very thick,blue!60!black] (0.2,0.9) -- (1.5,0.9) .. controls (2.0,0.9) and (2.1,1.0) .. (2.4,1.15) -- (4.9,2.42) .. controls (5.3,2.8) and (5.45,4.0) .. (5.55,4.2) .. controls (5.65,4.0) and (5.8,2.9) .. (6.2,2.5) -- (8.0,1.2);
  \node[font=\scriptsize,anchor=south] at (1.0,0.95) {$R_s$};
  \node[font=\scriptsize,red!70!black,anchor=west] at (8.0,3.9) {ideal $\omega L$};
  \node[font=\scriptsize,anchor=west] at (5.7,4.1) {SRF};
  \node[font=\scriptsize,anchor=north east] at (4.6,2.1) {inductive};
  \node[font=\scriptsize,anchor=south west] at (6.6,2.1) {capacitive};
  \begin{scope}[shift={(0.6,-2.6)}]
    \draw (0,1) node[ocirc]{} -- (0.4,1) to[L,l=$L$] (2.0,1) to[R,l=$R_s$] (3.6,1) -- (4.0,1) node[ocirc]{};
    \draw (0.4,1) -- (0.4,0.1) to[C,l_=$C_s$] (3.6,0.1) -- (3.6,1);
    \node[font=\scriptsize,anchor=west] at (4.5,0.6) {$Z = \dfrac{j\omega L+R}{1-\omega^2LC+j\omega CR}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Hastings $\pi$ model** (big-picture figure): $R_s$ and $L$ in series, $C_3$ across them (turn-to-turn and underpass), and at each end $C_{1,2}$ (oxide) in series with $R_{1,2}$ (substrate) to ground. The parasitics are hard to compute by hand; use a 3-D or 2.5-D EM solver (e.g. HFSS, EMPro).
- At RF the inductor's **substrate branch** is often refined to $C_{ox}$ in series with $R_{si}\parallel C_{si}$ at each port, and the series branch gets extra elements for skin and proximity effects.

> [!note]- Detail: a wideband compact model (Shekhar et al. Fig. 15)
> For the T-coil, Shekhar et al. used a compact model with, per winding: the series $L$ and $R$; a parallel $R/x^N$–$L/x^N$ ladder branch that makes the effective resistance rise and inductance fall with frequency (skin and proximity); a mutually coupled loop $L_{si}$, $R_{si}$ (coupling $k_1$, $k_2$) for bulk eddy-current loss in the substrate; $C_{ox}$ to $R_{si}\parallel C_{si}$ at each node; the magnetic coupling $k_m$ between windings; and a bridging capacitance $C_b$. This is the form fitted to EM simulations of an on-chip coil when a simple $\pi$ is not accurate enough over a decade of frequency.

## Level 4: Q and Self-Resonance

```tikz title="Q of an integrated inductor versus frequency. At low frequency Q = omega L/R_DC rises linearly; skin, proximity and substrate losses then bend it over, and it falls to zero at the self-resonant frequency, where the parasitic capacitance cancels L. After Hastings Sec. 7.2.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,3.6) node[above] {$Q$};
  \draw[dashed,gray] (0,0) -- (3.0,3.4) node[above,font=\scriptsize] {$\omega L/R_{DC}$};
  \draw[very thick,violet,domain=0:6.5,samples=80] plot (\x,{3.2*(\x/2.6)*exp(1-\x/2.6)*(1-(\x/6.5)^2)});
  \draw[dashed] (2.3,0) -- (2.3,3.15); \node[font=\scriptsize,below] at (2.3,0) {$f_{Q,max}$};
  \node[font=\scriptsize,below] at (6.5,0) {SRF};
  \draw[fill=violet] (6.5,0) circle (0.05);
  \node[font=\scriptsize,anchor=west,align=left] at (4.3,2.6) {skin, proximity,\\ substrate loss,\\ parasitic $C$};
  \node[font=\scriptsize,anchor=west] at (6.7,0.35) {capacitive above};
\end{circuitikz}
\end{document}
```

$$
\boxed{Q = \frac{2\pi fL}{R_s},\qquad f_{SRF} = \frac{1}{2\pi\sqrt{LC_{par}}}}
$$

- Q is defined as $2\pi\times$ (peak energy stored)/(energy lost per cycle). For a series $L$–$R_s$ that reduces to $\omega L/R_s$.
- Peak on-chip Q: from about 1 to about 40 (Hastings); Razavi takes "typically greater than 3" for monolithic inductors; standard CMOS on low-resistivity epi struggles past 5–10.
- **Use the inductor only well below its SRF.** Multilayer spirals have much lower SRF than single-layer ones, which is why practical designs use one, or at most two, layers (strapped layers count as one).
- Sometimes a **low** Q is wanted: Shekhar et al. used a deliberately lossy spiral (plus a small series resistor) to flatten series-peaking gain.

### Series and Parallel Equivalents

```tikz title="Near one frequency a lossy inductor (L_1 in series with R_S) is equivalent to L_P in parallel with R_P. For Q > 3, L_P ~ L_1 and R_P ~ Q^2 R_S. After Razavi Fig. 15.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[ocirc]{} to[L,l=$L_1$] (0,1.5) to[R,l=$R_S$] (0,0) node[ocirc]{};
  \node at (1.6,1.5) {$\Longleftrightarrow$};
  \draw (3.2,3) node[ocirc]{} -- (3.2,2.6) -- (2.6,2.6) to[L,l_=$L_P$] (2.6,0.4) -- (3.2,0.4) -- (3.2,0) node[ocirc]{};
  \draw (3.2,2.6) -- (3.8,2.6) to[R,l=$R_P$] (3.8,0.4) -- (3.2,0.4);
  \node[font=\scriptsize,anchor=west] at (4.8,1.9) {$L_P = L_1\left(1+\dfrac{R_S^2}{L_1^2\omega^2}\right)\approx L_1$};
  \node[font=\scriptsize,anchor=west] at (4.8,1.0) {$R_P\approx\dfrac{L_1^2\omega^2}{R_S}=Q^2R_S$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_P\approx Q^2R_S,\qquad L_P\approx L_1\quad(Q\gtrsim3)}
$$

> [!note]- Derivation: series-to-parallel conversion (Razavi Eqs. 15.29–15.36)
> Equate $L_1s+R_S = R_PL_Ps/(R_P+L_Ps)$ at $s = j\omega$ and match real and imaginary parts:
> $$L_1R_P + L_PR_S = R_PL_P,\qquad R_SR_P = L_1L_P\omega^2$$
> so $L_P = L_1(1+R_S^2/(L_1^2\omega^2))$ and $R_P = L_1L_P\omega^2/R_S$. With $Q = L_1\omega/R_S > 3$, $L_P\approx L_1$ and $R_P\approx Q^2R_S$. The same conversion holds for a lossy capacitor with $Q = 1/(C\omega R_S)$ ([[Capacitor#Level 4 Parasitics, Q and High Frequency]]). Once every tank element is in parallel form, the tank's loss is the parallel combination of all $R_P$'s; what that means for resonance and bandwidth is owned by [[Microwave Resonators]] and [[Oscillators]].

## Layout

```tikz title="Bad versus good. Left: spiral filled to the centre over a solid ground plate; the inner turns add little L, sit in the strongest field (eddy loss, crowding), and the solid plate carries large eddy currents. Right: hollow spiral over a patterned ground shield; radial slots break every eddy loop while still terminating the electric field. After Hastings Fig. 7.25 and guidelines 8-9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % bad
  \node[font=\small\bfseries,red!70!black] at (2.2,5.0) {bad};
  \fill[blue!20] (0,0) rectangle (4.4,4.4);
  \foreach \r in {2.0,1.6,1.2,0.8,0.4} \draw[violet!60,line width=5pt] ({2.2-\r},{2.2-\r}) rectangle ({2.2+\r},{2.2+\r});
  \draw[->,red!70!black,thick] (0.2,0.15) -- (4.2,0.15) -- (4.2,4.25) -- (0.2,4.25) -- (0.2,0.4);
  \node[font=\scriptsize,red!70!black,align=center] at (2.2,-0.45) {solid plate: one big eddy loop;\\ centre turns in peak field};
  % good
  \begin{scope}[shift={(6.0,0)}]
    \node[font=\small\bfseries,green!50!black] at (2.2,5.0) {good};
    \foreach \i in {0,...,14} {
      \pgfmathsetmacro{\o}{0.2+0.29*\i}
      \fill[blue!20] (\o,0) rectangle ({\o+0.18},{2.2-0.05-abs(2.2-\o-0.09)});
      \fill[blue!20] (\o,4.4) rectangle ({\o+0.18},{2.2+0.05+abs(2.2-\o-0.09)});
      \fill[blue!20] (0,\o) rectangle ({2.2-0.05-abs(2.2-\o-0.09)},{\o+0.18});
      \fill[blue!20] (4.4,\o) rectangle ({2.2+0.05+abs(2.2-\o-0.09)},{\o+0.18});
    }
    \foreach \r in {2.0,1.6,1.2} \draw[violet!60,line width=5pt] ({2.2-\r},{2.2-\r}) rectangle ({2.2+\r},{2.2+\r});
    \draw[<->] (1.4,2.2) -- (3.0,2.2); \node[font=\scriptsize,above] at (2.2,2.2) {$d_i\ge5w$};
    \node[font=\scriptsize,align=center] at (2.2,-0.45) {slotted shield, slots normal to the turns;\\ hollow centre};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Rules (Hastings Sec. 7.2.2, after Long and Copeland):**
1. **Highest-resistivity substrate available**; below about 10 Ω·cm eddy loss severely cuts Q. Guard rings and scattered substrate contacts against debiasing and latch-up.
2. **Highest metal layers** for the spiral; the underpass to the inner turn goes **under** the spiral, never over.
3. **Strap two or three thin top metals** with vias if there is no thick top metal; never use metal 1 in the body.
4. **Keep unrelated metal away**, at least half the inductor's width; nothing in the empty centre.
5. **Width neither too wide nor too narrow**: about 10–15 µm at 1–3 GHz (narrow: winding resistance; wide: skin and proximity loss; check $f_{crit}$).
6. **Narrowest turn spacing**: more coupling, more $L$, higher Q.
7. **Minimum number of layers**: one, at most two; multilayer coils have far lower SRF.
8. **Do not fill the centre**: $d_i\ge5w$; for larger coils $d_i\ge d_o/3$.
9. **No metal or poly above or below**, except a **slotted (patterned) ground shield**; remove dummy fill within about half the spiral width, or size and place it to minimise eddy loss.
10. **No junctions underneath** (RF couples in and gets rectified).
11. **Short, direct, top-metal leads.**

> [!note]- Why: the patterned ground shield (Hastings Sec. 7.2.2, Yue and Wong)
> A grounded conductor between the spiral and the silicon terminates the electric field, so displacement current no longer flows through the resistive substrate (higher Q, at the cost of more parasitic capacitance, i.e. lower SRF). A *solid* plate would also be crossed by the magnetic field and carry a huge eddy current loop; cutting it into strips **perpendicular to the winding** breaks every loop. The strips must be narrow enough that their own $f_{crit}$ is above the operating frequency. Silicided poly gives the best combination of low shield resistance and low capacitance to the winding.

> [!note]- Detail: process extensions that raise Q
> - **Thick top metal** (2–5 µm Cu or Al), above the other metals or even above the protective overcoat on a polyimide layer: lower $R$ and more height above the substrate.
> - **Etched cavities** under the coil (MEMS processes) remove the substrate entirely.
> - **Magnetic thin films** or ferrite layers raise $L$ per area but add core loss that becomes intolerable between 100 MHz and 10 GHz.
> - Hastings' summary of the state of the art: 10–100 nH with Q about 40 up to a few GHz; an integrated buck converter has processed 0.27 W at 75% efficiency with two thick metals. Beyond that, co-packaged discrete inductors.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ turns $N$ | $L$ ($\propto N^2$) | $R_s$, area, proximity loss, lower SRF |
| ↑ $d_o$ (same $N$) | $L$ | Substrate capacitance and eddy loss, area, lower SRF |
| Fill toward the centre | Small $L$ gain | Q (inner turns in peak field), little $L$ |
| ↑ width $w$ | DC resistance | Skin/proximity above $f_{crit}\propto1/w^2$; capacitance; area |
| ↓ spacing $s$ | Coupling, $L$, Q | Inter-turn $C$ (minor for one layer) |
| Thick or strapped top metal | $R_s$, Q, height above substrate | Via resistance; process option |
| Patterned ground shield | Q (no substrate displacement loss) | More $C_{par}$, lower SRF |
| High-resistivity substrate | Q (eddy loss) | Latch-up and debiasing care |
| Symmetric spiral | Differential balance, area (one coil for two), loss | Crossover vias, design effort |
| Multilayer spiral | $L$ per area | Much lower SRF, proximity loss |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Definition | $V = L\,dI/dt$ |
| Loop | $L = \mu r[\ln(8r/a)-1.75]$ |
| Toroidal solenoid | $L = \mu N^2r^2/D$ |
| Spiral (Mohan) | $L = \mu K_1N^2(d_o+d_i)/[2(1+K_2\frac{d_o-d_i}{d_o+d_i})]$; square $2.34, 2.75$; octagon $2.25, 3.55$ |
| Inner diameter | $d_i = d_o-2Np$, $p = w+s$ |
| DC resistance | $R_{DC} = \rho\ell/A = R_\square\ell/w$ |
| Skin depth | $\delta = \sqrt{\rho/(\pi f\mu)}$ |
| Crowding onset | $f_{crit} = pR_\square/(2\mu w^2)$ |
| Winding resistance | $R_W = R_{DC}[1+\frac1{10}(f/f_{crit})^2]$ ($d_i\approx d_o/3$) |
| Q | $Q = 2\pi fL/R_s$ |
| Self-resonance | $f_{SRF} = 1/(2\pi\sqrt{LC_{par}})$ |
| RF model | $Z = (j\omega L+R)/(1-\omega^2LC+j\omega CR)$ |
| Series → parallel | $L_P\approx L_1$, $R_P\approx Q^2R_S$ |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (PDF page = printed + 1), Ch. 7, §7.2 Inductance pp. 354–362: Eqs. 7.30–7.35 and Figs. 7.21–7.23 (loops, solenoids, bondwires, planar and symmetric spirals, Mohan formula and example); §7.2.1 Inductor Parasitics (Eqs. 7.36–7.40, Fig. 7.24: DCR, skin, proximity, substrate eddy currents, $f_{crit}$, $R_W$, Q, SRF); §7.2.2 Inductor Construction and Guidelines for Integrating Inductors (Fig. 7.25, rules 1–11); §7.3 Summary p. 363.
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §15.3.1 pp. 618–620 (inductor Q, series/parallel conversion, Eqs. 15.27–15.36); §15.4 p. 643 (spiral inductor structure, Fig. 15.57, $S\approx100$–200 µm).
- **Shekhar, Walling, Allstot, "Bandwidth Extension Techniques for CMOS Amplifiers," IEEE JSSC vol. 41, no. 11, Nov. 2006**: §II (inductor shunt parasitics, symmetric inductors), §V-B and Figs. 13–15 (asymmetric T-coil geometry, EM-simulated inductances, SRF 19.2 GHz, Q = 9, wideband compact model), §VIII-A (deliberately low-Q inductor), Appendix (Grover concentric-ring estimate, Table VI within 10%). Peaking circuits themselves are left to [[High-Speed Circuit Techniques]].
- **Pozar, *Microwave Engineering*, 4th ed.**: §5.1 Point of Interest "Lumped Elements for Microwave Integrated Circuits", pp. 233–234.
- **ECE 373 binder** (Boumaiza), slides 36–38 and 41 (binder PDF pp. 89–91, 94): lumped microwave elements, distributed inductor, RF inductor model and $|Z|$, strip/loop/spiral formulas.
- **Carusone, Johns, Martin**: §1.6 lists resistors and capacitors as the common passives; no inductor content used.
