---
title: CMOS Processing
description: How a CMOS wafer is built, step by step in cross-section, from bare silicon through STI, wells, gate, self-aligned source/drain, silicide and the metal stack, plus the layer colour legend the whole Layout series uses.
kind: topic
status: growing
aliases:
  - CMOS Processing
  - CMOS Process
  - Fabrication
  - Process Flow
---

Every polygon you draw in a layout editor becomes a mask, and every mask becomes one physical step on the wafer. This note follows the wafer through those steps in cross-section: first the whole flow on one screen, then the unit operations, then isolation, then the full CMOS flow step by step, then the devices and process options it gives you. Later Layout notes reuse the cross-sections and the colour legend below.

## The big picture

```tikz title="The finished wafer: a CMOS inverter in a twin-metal STI process, cut through both transistors and their ties. The legend on the right is used by every Layout note. After Hastings Figs. 2.38, 4.26 and Razavi Fig. 18.11."
\usepackage{circuitikz}
\usetikzlibrary{decorations.pathreplacing}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \node[anchor=west,font=\bfseries] at (13.9,5.6) {Layer legend (whole Layout series)};
  \foreach \y/\s/\t in {5.1/psub/{p-substrate / p-epi},4.65/nwell/{n-well (top view: dashed outline)},4.2/ndiff/{n+ diffusion (NSD, active)},3.75/pdiff/{p+ diffusion (PSD, active)},3.3/sti/{STI / field oxide},2.85/poly/{polysilicon (gate)},2.4/sil/{silicide},1.95/cont/{contact / via (W plug)},1.5/mone/{metal 1},1.05/mtwo/{metal 2},0.6/diel/{deposited dielectric (PMD, IMD)},0.15/nit/{nitride (mask, overcoat, Cu cap)},-0.3/pr/{photoresist}} {
    \draw[\s] (14.0,\y-0.15) rectangle (14.5,\y+0.15);
    \node[anchor=west,font=\scriptsize] at (14.6,\y) {\t};
  }
  \draw[->,thick] (14.25,-0.55) -- (14.25,-0.85);
  \node[anchor=west,font=\scriptsize] at (14.6,-0.7) {implant / exposure};
  \draw[psub] (0,0.6) rectangle (12.2,2.6);
  \draw[diel] (0,2.6) rectangle (12.2,3.7);
  \draw[nwell] (6.0,2.6) -- (6.0,1.2) to[out=-90,in=180] (6.4,0.9) -- (11.8,0.9) to[out=0,in=-90] (12.2,1.3) -- (12.2,2.6);
  \foreach \a/\b in {0/0.5,1.5/2.1,5.1/7.0,10.0/10.6,11.6/12.2} {\draw[sti] (\a,2.6) -- (\a+0.05,2.1) -- (\b-0.05,2.1) -- (\b,2.6) -- cycle;}
  \draw[pdiff] (0.5,2.6) rectangle (1.5,2.3);
  \draw[ndiff] (2.1,2.6) rectangle (3.2,2.3);
  \draw[ndiff] (4.0,2.6) rectangle (5.1,2.3);
  \draw[pdiff] (7.0,2.6) rectangle (8.1,2.3);
  \draw[pdiff] (8.9,2.6) rectangle (10.0,2.3);
  \draw[ndiff] (10.6,2.6) rectangle (11.6,2.3);
  \foreach \g in {3.2,8.1} {
    \draw[poly] (\g+0.08,2.63) rectangle (\g+0.72,2.98);
    \fill[gray!35] (\g-0.12,2.6) -- (\g+0.08,2.6) -- (\g+0.08,2.95) -- cycle;
    \fill[gray!35] (\g+0.92,2.6) -- (\g+0.72,2.6) -- (\g+0.72,2.95) -- cycle;
    \draw[sil] (\g+0.08,2.98) rectangle (\g+0.72,3.04);
    \draw[thick,black!80] (\g+0.08,2.61) -- (\g+0.72,2.61);
  }
  \foreach \a/\b in {0.5/1.5,2.1/3.08,4.12/5.1,7.0/7.98,9.02/10.0,10.6/11.6} {\draw[sil] (\a,2.6) rectangle (\b,2.66);}
  \foreach \x in {0.9,2.55,4.55,7.45,9.45,11.0} {\draw[cont] (\x,2.66) rectangle (\x+0.2,3.7);}
  \foreach \a/\b in {0.6/3.0,4.25/5.0,7.1/7.95,9.15/11.5} {\draw[mone] (\a,3.7) rectangle (\b,3.95);}
  \draw[diel] (0,3.95) rectangle (12.2,4.65);
  \foreach \x in {4.5,7.45} {\draw[cont] (\x,3.95) rectangle (\x+0.2,4.65);}
  \draw[mtwo] (4.3,4.65) rectangle (7.85,4.92);
  \draw[nit] (0,4.92) rectangle (12.2,5.2);
  \node[font=\scriptsize] at (3.0,1.4) {p-substrate};
  \node[font=\scriptsize] at (9.1,1.5) {n-well};
  \node[font=\scriptsize] at (3.6,0.3) {NMOS};
  \node[font=\scriptsize] at (8.5,0.3) {PMOS};
  \node[font=\scriptsize] at (1.0,0.3) {sub tie};
  \node[font=\scriptsize] at (11.1,0.3) {well tie};
  \node[font=\scriptsize] at (6.05,2.35) {STI};
  \node[font=\scriptsize,anchor=south] at (3.6,3.02) {G};
  \node[font=\scriptsize,anchor=south] at (8.5,3.02) {G};
  \node[font=\scriptsize] at (1.8,4.1) {M1: GND};
  \node[font=\scriptsize] at (10.3,4.1) {M1: $V_{DD}$};
  \node[font=\scriptsize] at (6.1,4.785) {M2: output};
  \node[font=\scriptsize] at (1.5,5.4) {passivation (nitride)};
  \draw[decorate,decoration={brace,amplitude=4pt}] (12.35,3.0) -- (12.35,0.6) node[midway,right=4pt,font=\scriptsize] {FEOL};
  \draw[decorate,decoration={brace,amplitude=4pt}] (12.35,5.2) -- (12.35,3.05) node[midway,right=4pt,font=\scriptsize] {BEOL};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **One drawn layer, one mask, one lithography sequence.** Each sequence is coat resist, expose through the mask, develop, then one additive step (oxidize, implant, deposit) or subtractive step (etch), then strip. Mask count sets cost: about 7 for early CMOS, around 30 today (Razavi §18.3).
> 2. **The order is fixed by temperature.** Isolation (STI or LOCOS) → wells → gate oxide and $V_t$ adjust → poly gate → LDD and spacers → n+/p+ source/drain → anneal → silicide (this is the **front end**, FEOL); then contacts, metal/via pairs, passivation (the **back end**, BEOL). Nothing hot happens after metal goes on.
> 3. **The gate is self-aligned.** Source and drain are implanted *after* the poly, so the channel is exactly poly ∩ active. Channel length is set by the poly linewidth, not by mask alignment.
> 4. **Isolation is a reverse-biased junction plus thick oxide.** The p-substrate sits at the most negative potential, every n-well at or above its PMOS sources, and STI (or LOCOS plus channel stop) keeps wires from inverting the silicon between devices.
> 5. **Lithography sets the rules.** Resolution $R = k_1\lambda/NA$, depth of focus $\pm k_2\lambda/NA^2$, and the stacked misalignment $\sigma_{tot} = \sqrt{\sum\sigma_i^2}$ are where minimum widths, spacings and enclosures in the design rules come from.

**Map:** [[#Level 0 Four Operations and a Wafer|operations and wafer]] → [[#Level 1 Unit Steps|lithography, oxidation, implant, deposition, etch, CMP]] → [[#Level 2 Isolation|junction isolation, LOCOS/STI, SOI]] → [[#Level 3 The CMOS Flow Step by Step|the full flow, self-alignment, LDD, silicide, back end, masks]] → [[#Level 4 What the Flow Gives You|devices you get for free]] → [[#Level 5 Process Extensions|deep n-well, high voltage, BiCMOS]] → [[#Process Effects a Layout Must Respect|effects that become layout rules]].

> [!tip] Remark: colour conventions for the whole Layout series
> Cross-sections and top views in every Layout note use the legend above: n+ diffusion green, p+ diffusion orange, poly red, metal 1 blue, metal 2 purple, contacts and vias black, n-well light cyan with a dashed outline, STI grey, resist yellow, nitride pink. In a top view an "active" rectangle is coloured by the implant it receives (NSD → green, PSD → orange).

## Level 0: Four Operations and a Wafer

### The Unit Operations

```tikz title="A process is a prepared wafer plus a loop: one lithography sequence per mask, each followed by one add or remove step. After Razavi Sec. 18.1 and the ECE 331 Module 1 flow."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,box/.style={draw,rounded corners,align=center,minimum height=1.0cm,inner sep=4pt}]
  \node[box] (w) at (0,0) {wafer\\(CZ ingot, sliced,\\polished)};
  \node[box,fill=green!10] (f) at (4.0,0) {front end (FEOL)\\isolation, wells, gate,\\S/D, silicide};
  \node[box,fill=blue!10] (b) at (8.2,0) {back end (BEOL)\\contacts, metals, vias,\\passivation};
  \node[box] (p) at (12.2,0) {test, dice, bond,\\package\\$\to$ Packaging note};
  \draw[->] (w) -- (f); \draw[->] (f) -- (b); \draw[->] (b) -- (p);
  \node[box,fill=yellow!20] (l) at (6.1,-2.6) {per mask: coat resist $\to$ align and expose $\to$ develop};
  \node[box,fill=gray!10] (a) at (6.1,-4.2) {add: oxidize, implant, deposit (CVD, sputter, plate)\quad remove: etch (wet, RIE), CMP\\then strip resist; heat (anneal, drive) where needed};
  \draw[->] (l) -- (a);
  \draw[->] (a.west) -- ++(-0.6,0) |- (l.west);
  \draw[dashed] (f.south) -- (l.north west);
  \draw[dashed] (b.south) -- (l.north east);
  \node[font=\scriptsize] at (6.1,-5.2) {modern CMOS: $>$200 steps, $\sim$30 masks (Razavi); each extra metal costs 2 masks (via + metal)};
\end{circuitikz}
\end{document}
```

| Operation | Adds or removes | Examples | Patterned by |
|---|---|---|---|
| Oxidation | adds SiO₂ by consuming Si | pad oxide, gate oxide, LOCOS field oxide | nitride mask (LOCOS) or blanket |
| Ion implantation | adds dopant | wells, channel stop, $V_t$ adjust, LDD, n+/p+ | resist, poly, oxide, nitride |
| Deposition | adds a film | poly, nitride, PMD/IMD oxide, W, Al, Cu | then etched, or CMP'd (damascene) |
| Etching / CMP | removes | trenches, poly gates, contact holes, metal | resist (etch); topography (CMP) |
| Heat | moves dopant, repairs lattice | anneal, drive-in, reflow, silicide reaction | none (whole wafer) |

> [!tip] Remark
> "Front end of line" is everything built in the single-crystal silicon (wells, junctions, gate); "back end of line" is the stack of poly/metal and dielectric layers above it (Hastings §2.7). The split matters for you because BEOL layers are dielectrically isolated (any bias, low parasitics) while FEOL layers are junction-isolated (bias rules, junction capacitance).

### Starting Wafer

```tikz title="Two starting wafers. Devices always live in lightly doped p- silicon at the top; the epi version puts a low-resistance p++ ground plane under them. After Carusone Sec. 2.1.1 and Hastings Sec. 4.2.2."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (4,2.4);
  \node[align=center,font=\scriptsize] at (2,1.2) {bulk p$^-$ wafer\\$N_A\approx2\times10^{15}\,\mathrm{cm^{-3}}$\\10--20 $\Omega\cdot$cm};
  \node[font=\scriptsize] at (2,-0.35) {(a) lightly doped bulk};
  \draw[fill=orange!45,draw=black!60] (6,0) rectangle (10,1.6);
  \draw[psub] (6,1.6) rectangle (10,2.4);
  \node[align=center,font=\scriptsize] at (8,0.8) {p$^{++}$ substrate, $\approx$0.01 $\Omega\cdot$cm\\(low-R ground plane: latch-up,\\substrate noise)};
  \node[align=center,font=\scriptsize] at (8,2.0) {p$^-$ epi, 5--20 $\Omega\cdot$cm, 2--20 $\mu$m};
  \node[font=\scriptsize] at (8,-0.35) {(b) p$^-$ epi on p$^{++}$};
  \draw[<->] (10.3,1.6) -- (10.3,2.4) node[midway,right,font=\scriptsize] {devices here};
\end{circuitikz}
\end{document}
```

- **Orientation:** CMOS uses (100) silicon, which has the lowest surface-state charge under oxide and so the most stable $V_{TH}$. Standard bipolar used (111) (Hastings §2.1.3, §4.2.1).
- **Size:** 10 to 30 cm diameter, about 1 mm thick at the start (Carusone); 200/300 mm wafers carry a notch instead of a flat (Hastings).
- **Epi (most CMOS):** buy the epi wafers ready-made. The p++ underneath cuts substrate resistance, which helps against latch-up ([[Guard Rings, ESD and Interconnect#Latch-up]]) and couples less digital noise ([[Substrate Noise]]).

> [!note]- Detail: from sand to wafer (Hastings §2.1, Carusone §2.1.1)
> Silica + carbon in an arc furnace gives metallurgical-grade silicon (about 98% pure). It is converted to a volatile compound (trichlorosilane), distilled, and reduced back to very pure but *polycrystalline* silicon. That is melted and a rotating single-crystal seed is slowly pulled out (Czochralski method), growing an ingot over a metre long; dopant added to the melt sets the resistivity. The ingot is ground to diameter, oriented, sawn with a diamond saw (up to a third of the silicon is lost as dust), then lapped and chemically polished on the topside. The rough backside is left rough on purpose: it getters impurities.

## Level 1: Unit Steps

### Photolithography

```tikz title="One lithography sequence with positive resist: what was exposed dissolves, the opening (window) is etched, the resist is stripped. A negative resist leaves the inverse. After Hastings Fig. 2.8 and Razavi Fig. 18.3."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{1. oxidize, spin resist},1/{2. align mask, UV expose},2/{3. develop (positive)},3/{4. etch oxide},4/{5. strip resist}} {
    \begin{scope}[xshift=\i*3.3cm]
      \draw[psub] (0,0) rectangle (2.8,1.0);
      \node[font=\scriptsize,align=center] at (1.4,-0.35) {\t};
    \end{scope}
  }
  % 1
  \draw[diel] (0,1.0) rectangle (2.8,1.2); \draw[pr] (0,1.2) rectangle (2.8,1.5);
  % 2
  \begin{scope}[xshift=3.3cm]
    \draw[diel] (0,1.0) rectangle (2.8,1.2); \draw[pr] (0,1.2) rectangle (2.8,1.5);
    \fill[pattern=north east lines] (1.0,1.2) rectangle (1.8,1.5);
    \draw[fill=gray!20] (-0.1,2.3) rectangle (2.9,2.45);
    \fill[black] (-0.1,2.3) rectangle (1.0,2.45); \fill[black] (1.8,2.3) rectangle (2.9,2.45);
    \node[font=\scriptsize,anchor=south] at (0.35,2.45) {mask};
    \node[font=\scriptsize,anchor=south] at (1.4,3.15) {UV};
    \foreach \x in {1.1,1.4,1.7} {\draw[imp] (\x,3.15) -- (\x,2.5); \draw[imp] (\x,2.28) -- (\x,1.55);}
  \end{scope}
  % 3
  \begin{scope}[xshift=6.6cm]
    \draw[diel] (0,1.0) rectangle (2.8,1.2); \draw[pr] (0,1.2) rectangle (1.0,1.5); \draw[pr] (1.8,1.2) rectangle (2.8,1.5);
    \node[font=\scriptsize] at (1.4,1.75) {window};
  \end{scope}
  % 4
  \begin{scope}[xshift=9.9cm]
    \draw[diel] (0,1.0) rectangle (1.0,1.2); \draw[diel] (1.8,1.0) rectangle (2.8,1.2);
    \draw[pr] (0,1.2) rectangle (1.0,1.5); \draw[pr] (1.8,1.2) rectangle (2.8,1.5);
  \end{scope}
  % 5
  \begin{scope}[xshift=13.2cm]
    \draw[diel] (0,1.0) rectangle (1.0,1.2); \draw[diel] (1.8,1.0) rectangle (2.8,1.2);
    \node[font=\scriptsize,align=center] at (1.4,1.7) {patterned oxide:\\implant or etch here next};
  \end{scope}
  % negative
  \begin{scope}[xshift=6.6cm,yshift=-2.4cm]
    \draw[psub] (0,0) rectangle (2.8,1.0);
    \draw[diel] (0,1.0) rectangle (2.8,1.2); \draw[pr] (1.0,1.2) rectangle (1.8,1.5);
    \node[font=\scriptsize,align=center] at (1.4,-0.35) {3'. develop (negative):\\exposed resist stays};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{one layer} = \text{one mask} = \text{coat} \to \text{expose} \to \text{develop} \to \text{(add or remove)} \to \text{strip}}
$$

- **Positive resist:** exposed areas dissolve. **Negative resist:** exposed areas cross-link and stay. Using both with one mask gives complementary patterns (Razavi uses this for the n+ and p+ implants; Carusone for wells vs field implants).
- Modern lithography is mostly positive resist: negative resist swells during development and cannot print below a few microns (Hastings §2.2.1).
- High-temperature steps cannot be masked by (organic) resist; oxide or nitride is patterned first and serves as the hard mask (Hastings §2.2.3).
- Masks are written by an electron beam from the layout database; steppers print a **reticle** of a few dice per shot with 2X, 5X or 10X reduction (Hastings §2.2.2, Carusone §2.1.2).

> [!note]- Detail: the full resist recipe and exposure tools (ECE 331 Module 2, Hastings §2.2)
> **Recipe:** clean → dehydrate → prime (HMDS makes the surface hydrophobic) → spin coat (about 5 ml, 2000 to 7000 rpm) → soft bake (90 to 100 °C, about 30 s) → expose → post-exposure bake (110 to 130 °C, smooths standing-wave ripples in the resist sidewall) → develop (TMAH for positive resist) → hard bake (about 130 °C) → etch or implant → strip (solvent or oxygen-plasma "ashing").
>
> **Contrast:** g/i-line resists have contrast $\gamma\approx2$ to 3 and need about 100 mJ/cm²; chemically amplified DUV resists $\gamma\approx5$ to 10 at 20 to 40 mJ/cm². Finite $\gamma$ is why real resist sidewalls are tapered.
>
> **Exposure modes:** contact printing (mask touches resist: good resolution, damages masks), proximity printing (10 to 50 µm gap: diffraction limits it to about 2 µm), projection printing (lenses, cm away, used for all VLSI).
>
> **Light sources:** mercury lamp G-line 436 nm, H-line 405 nm, I-line 365 nm (most analog fabs, per Hastings); excimer lasers KrF 248 nm and ArF 193 nm, with immersion optics and phase-contrast tricks for sub-50 nm features; EUV at 13.5 nm with NA 0.33 → 0.55 for about 8 nm resolution (ECE 331). Below about 100 nm the mask pattern is pre-distorted (**optical proximity correction**, OPC) so the printed shape matches the drawn one (Carusone §2.1.2).

### Resolution, Depth of Focus and Overlay

```tikz title="Overlay error is why the design rules demand enclosures: a contact drawn flush with its n+ region lands partly on substrate when the contact mask shifts by delta. After ECE 331 Module 2 (overlay example) and Razavi Fig. 18.2."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) drawn: contact = n+ width},1/{(b) contact mask shifted by $\delta$},2/{(c) n+ encloses contact by $e>\delta$}} {
    \begin{scope}[xshift=\i*4.6cm]
      \draw[psub] (0,0) rectangle (4,1.4);
      \node[font=\scriptsize] at (2,-0.35) {\t};
    \end{scope}
  }
  \draw[ndiff] (1.5,1.4) rectangle (2.5,1.05); \draw[diel] (0,1.4) rectangle (1.5,2.0); \draw[diel] (2.5,1.4) rectangle (4,2.0); \draw[mone] (0.8,2.0) -- (1.5,2.0) -- (1.5,1.4) -- (2.5,1.4) -- (2.5,2.0) -- (3.2,2.0) -- (3.2,2.25) -- (0.8,2.25) -- cycle;
  \begin{scope}[xshift=4.6cm]
    \draw[ndiff] (1.5,1.4) rectangle (2.5,1.05); \draw[diel] (0,1.4) rectangle (1.9,2.0); \draw[diel] (2.9,1.4) rectangle (4,2.0);
    \draw[mone] (1.2,2.0) -- (1.9,2.0) -- (1.9,1.4) -- (2.9,1.4) -- (2.9,2.0) -- (3.6,2.0) -- (3.6,2.25) -- (1.2,2.25) -- cycle;
    \draw[red,thick] (2.5,1.4) -- (2.9,1.4);
    \node[font=\scriptsize,red,align=center] at (2.3,0.5) {metal on p-sub:\\leaky / shorted};
    \draw[<->] (1.5,2.45) -- (1.9,2.45) node[midway,above,font=\scriptsize] {$\delta$};
  \end{scope}
  \begin{scope}[xshift=9.2cm]
    \draw[ndiff] (0.9,1.4) rectangle (3.3,1.05); \draw[diel] (0,1.4) rectangle (1.9,2.0); \draw[diel] (2.9,1.4) rectangle (4,2.0);
    \draw[mone] (1.2,2.0) -- (1.9,2.0) -- (1.9,1.4) -- (2.9,1.4) -- (2.9,2.0) -- (3.6,2.0) -- (3.6,2.25) -- (1.2,2.25) -- cycle;
    \draw[<->] (2.9,0.85) -- (3.3,0.85); \node[font=\scriptsize,anchor=west] at (3.3,0.85) {$e$};
    \node[font=\scriptsize,green!40!black] at (2.0,0.5) {still on n+};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R = k_1\frac{\lambda}{NA}, \qquad DOF = \pm k_2\frac{\lambda}{NA^2}, \qquad \sigma_{tot} = \sqrt{\sum_i \sigma_i^2}}
$$

- $R$ is the smallest resolvable feature (Rayleigh gives $k_1 = 0.61$; in practice $k_1$ is a fitted process factor); $NA = n\sin\theta$ of the lens. Shorter $\lambda$ and larger $NA$ print smaller.
- Larger $NA$ *shrinks* the depth of focus, and $DOF$ is already well under 1 µm. Wafer topography taller than the $DOF$ cannot be printed in focus: this is why every modern level is planarized ([[#Planarization (CMP) and Dummy Fill|CMP]]).
- Each mask lands with a random misalignment $\sigma_i$ (translation, rotation, thermal run-out). Any rule that relates two layers (enclosure, extension, spacing to another layer) must exceed the combined $\sigma_{tot}$ (ECE 331 Module 2). That is the origin of the enclosure and extension rules in [[Layout Fundamentals]].

> [!example] Worked example (ECE 331 Module 2)
> KrF stepper, $\lambda = 248$ nm, $NA = 0.6$: with $k_1 = 0.75$, $R = 0.75 \times 0.248/0.6 \approx 0.3$ µm; with $k_2 = 0.5$, $DOF = \pm0.5\times0.248/0.36 \approx \pm0.35$ µm. A 0.35 µm oxide step is already the whole focus budget.

> [!note]- Derivation: why $R\propto\lambda/NA$ and $DOF\propto\lambda/NA^2$ (ECE 331 Module 2)
> **Resolution.** A grating of pitch $P$ diffracts order $m$ at $P\sin\theta = m\lambda$. To form any intensity variation on the wafer the lens must catch at least the $m=\pm1$ orders, so $\sin\theta \le NA$ gives $P_{min} = \lambda/NA$, i.e. a half-pitch $R \propto \lambda/NA$. Rayleigh's two-point criterion (Airy disc peak on the neighbour's first null) gives the constant $0.61$.
>
> **Depth of focus.** Rayleigh's focus criterion: the on-axis path and the path from the lens edge may differ by at most $\lambda/4$. A defocus $\delta$ changes the on-axis path by $\delta$ and the edge path by $\delta\cos\theta$, so $\lambda/4 = \delta(1-\cos\theta) \approx \delta\theta^2/2$. With $\theta \approx NA$: $\delta = \lambda/(2NA^2)$, written $\pm k_2\lambda/NA^2$ with $0.5 < k_2 < 1$.
>
> **Immersion.** Water between lens and wafer ($n = 1.44$ at 193 nm) shortens the effective wavelength to $\lambda/n$, improving $R$.
>
> **Overlay.** Independent misalignments add in variance, $\sigma_{tot}^2 = \sum\sigma_i^2$. In the ECE 331 example (4-inch wafer) a 0.5 µm rotational error at the wafer edge is only $10^{-5}$ rad.

### Oxidation

```tikz title="Thermal oxide grows by eating silicon: about 45% of its thickness lies below the original surface and 55% above, because SiO2 takes 2.2 times the volume of the silicon it consumes. After Carusone Sec. 2.1.5 and Hastings Sec. 2.3.3."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (4,1.5);
  \draw[dashed] (-0.2,1.5) -- (4.2,1.5);
  \node[font=\scriptsize,anchor=east] at (-0.2,1.5) {original surface};
  \node[font=\scriptsize] at (2,-0.35) {before};
  \draw[psub] (6,0) rectangle (10,1.05);
  \draw[diel,fill=gray!25] (6,1.05) rectangle (10,2.05);
  \draw[dashed] (5.8,1.5) -- (10.2,1.5);
  \draw[<->] (10.4,1.05) -- (10.4,1.5) node[midway,right,font=\scriptsize] {$0.45\,t_{ox}$ (Si consumed)};
  \draw[<->] (10.4,1.5) -- (10.4,2.05) node[midway,right,font=\scriptsize] {$0.55\,t_{ox}$};
  \node[font=\scriptsize] at (8,1.75) {SiO$_2$, thickness $t_{ox}$};
  \node[font=\scriptsize] at (8,-0.35) {after thermal oxidation ($\sim$800--1200 $^\circ$C)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Si consumed} \approx 0.45\,t_{ox}}
$$

| | Dry (O₂) | Wet (steam) |
|---|---|---|
| Rate | slow | fast (H₂O diffuses faster) |
| Quality | dense, few traps | hydrogen-related defects |
| Used for | **gate oxide** (thickness held to a few percent across the wafer) | thick **field oxide** (LOCOS) |

- Growth slows as the oxide thickens (oxidant must diffuse through it); higher temperature and pressure speed it up; (111) oxidizes faster than (100); heavy As/P doping speeds it up (dopant-enhanced oxidation) (Hastings §2.3.1, §2.3.3).
- Very thin gate oxides use **rapid thermal oxidation** (lamps heat the wafer in seconds). Oxide on top of non-silicon layers (between metals) must be **deposited**, not grown: CVD or spin-on glass (TEOS, PSG, BPSG).
- Gate oxide is the most critical film: $t_{ox}$ sets $C_{ox}$, current drive and reliability, and must match to a few angstroms across a 20 cm wafer (Razavi §18.4).

> [!tip] Remark
> $C_{ox} = \varepsilon_{ox}/t_{ox}$ from [[MosFETs#Structure]]: this one furnace step sets $\mu C_{ox}$, $V_{TH}$ (through $Q_{dep}/C_{ox}$) and the gate-oxide capacitor density in [[Capacitor#MOS Capacitors]].

> [!note]- Detail: oxidation side effects that reach the layout (Hastings §2.3.3)
> - **Oxide steps.** Re-oxidizing a patterned wafer grows faster in the old windows, so the silicon there recedes deeper: each masked oxidation leaves a step in the surface. These steps used to be visible as colours (thin-film interference); modern planarized chips look grey.
> - **Segregation.** Boron prefers oxide, so a growing oxide sucks boron out of the surface ("boron suckup", can even invert a light p-diffusion). P, As, Sb prefer silicon and pile up ahead of the interface ("phosphorus plow").
> - **Dopant-enhanced oxidation.** Heavy As/P doping makes oxide grow faster, e.g. thick oxide over a deep-N+ sinker.

### Diffusion and Ion Implantation

```tikz title="Dopant profiles versus depth: a diffusion peaks at the surface; an implant peaks at its range R_p and an anneal spreads it; stacked high-energy implants give a retrograde well. Right: a diffused junction spreads sideways under the mask by about 0.8 x_j. After Hastings Figs. 2.18, 2.20 and Carusone Fig. 2.4, Razavi Fig. 18.5."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) diffusion},1/{(b) implant, then anneal},2/{(c) retrograde well}} {
    \begin{scope}[xshift=\i*3.4cm]
      \draw[->] (0,3) -- (2.8,3) node[right,font=\scriptsize] {$N$};
      \draw[->] (0,3) -- (0,0) node[below,font=\scriptsize] {depth};
      \node[font=\scriptsize] at (1.3,-0.55) {\t};
      \draw[dashed] (0.5,3) -- (0.5,0.2);
      \node[font=\scriptsize] at (0.62,0.05) {$N_B$};
    \end{scope}
  }
  \draw[thick,red!70!black,domain=0:2.6,samples=40] plot ({0.3+2.3*exp(-(\x/1.3)^2)},{3-\x});
  \draw[dotted] (0,0.97) -- (0.5,0.97); \node[font=\scriptsize,anchor=east] at (0,0.97) {$x_j$};
  \begin{scope}[xshift=3.4cm]
    \draw[thick,red!70!black,domain=0:2.6,samples=60] plot ({0.2+2.3*exp(-((\x-0.9)/0.25)^2)},{3-\x});
    \draw[thick,blue!70!black,dashed,domain=0:2.6,samples=60] plot ({0.2+1.3*exp(-((\x-0.95)/0.55)^2)},{3-\x});
    \draw[dotted] (0,2.1) -- (2.5,2.1); \node[font=\scriptsize,anchor=east] at (0,2.1) {$R_p$};
    \node[font=\scriptsize,red!70!black] at (2.3,2.5) {as-implanted};
    \node[font=\scriptsize,blue!70!black] at (2.0,1.3) {annealed};
  \end{scope}
  \begin{scope}[xshift=6.8cm]
    \draw[thick,red!70!black,domain=0:2.6,samples=60] plot ({0.3+0.6*\x/2.6+1.6*exp(-((\x-1.9)/0.4)^2)},{3-\x});
    \node[font=\scriptsize,align=left,anchor=west] at (1.1,2.6) {low at surface:\\small $C_{jSB}$ for PMOS};
    \node[font=\scriptsize,align=left,anchor=west] at (2.5,1.1) {high deep:\\low $R_{well}$\\(latch-up)};
  \end{scope}
  \begin{scope}[xshift=11.2cm]
    \draw[psub] (0,0.4) rectangle (4,2.4);
    \draw[ndiff] (0.9,2.4) -- (0.9,2.2) to[out=-90,in=180] (1.6,1.5) -- (2.4,1.5) to[out=0,in=-90] (3.1,2.2) -- (3.1,2.4);
    \draw[diel,fill=gray!40] (0,2.4) rectangle (1.6,2.55); \draw[diel,fill=gray!40] (2.4,2.4) rectangle (4,2.55);
    \draw[<->] (0.9,2.8) -- (1.6,2.8) node[midway,above,font=\scriptsize] {$\approx0.8x_j$};
    \draw[<->] (3.4,2.4) -- (3.4,1.5) node[midway,right,font=\scriptsize] {$x_j$};
    \node[font=\scriptsize] at (2,0.05) {(d) outdiffusion under the mask};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{lateral outdiffusion} \approx 0.8\,x_j, \qquad \text{dose} \propto I_{beam}\,t, \qquad \text{depth (range)} \uparrow \text{ with energy}}
$$

- **Diffusion** (old way): deposit dopant at the surface, then drive it in at 800 to 1250 °C. Profile peaks at the surface, poorly controlled, spreads sideways; still used for deep N+ sinkers (Hastings §2.4.1).
- **Ion implantation** (how every modern CMOS layer is doped): a mass-analysed ion beam at typically 20 to 200 keV (MeV for buried layers). Dose (from beam current × time) and depth (from energy) are set *independently* and precisely, and patterned resist is a good enough mask because the wafer stays cold (Hastings §2.4.3, Carusone §2.1.3).
- **Anneal** repairs the lattice damage and **activates** the dopant, but also diffuses it: conventional furnace 800 to 1000 °C for 10 to 15 min, or **RTA** at 1000 to 1200 °C for seconds for shallow S/D junctions (Hastings). Razavi and Carusone describe one anneal at about 1000 °C for 15 to 30 min after all implants and before any metal.
- **Dopants:** boron is the only common acceptor; P (wells, fast), As (shallow n+ S/D, slow), Sb (buried layers, slow).
- **Channeling:** a beam aligned with a crystal axis tunnels deep; implants are tilted 7 to 10° (Hastings) or 7 to 9° (Razavi). The tilt makes the gate shadow one side of the device, a matching issue owned by [[Device Matching]].

> [!tip] Remark
> Outdiffusion is why wells need large spacings and enclosures in [[Layout Fundamentals]], and the same lateral spread under the gate is the $L_D$ in $L_{eff} = L_{drawn} - 2L_D$ from [[MosFETs#Structure]].

> [!note]- Detail: junction depths and implant ranges (Hastings Tables 2.2, 2.3)
> Diffused junction depth (µm) for a 15 min deposition and 1 h drive into $10^{16}$ cm⁻³ background:
>
> | Dopant | 950 °C | 1000 °C | 1100 °C | 1200 °C |
> |---|---|---|---|---|
> | Boron | 0.9 | 1.5 | 3.6 | 7.3 |
> | Phosphorus | | 0.5 | 1.6 | 4.6 |
> | Antimony | | | 0.8 | 2.1 |
> | Arsenic | | | 0.7 | 2.0 |
>
> Implant projected range (µm):
>
> | Dopant | 10 keV | 50 keV | 200 keV | 1 MeV |
> |---|---|---|---|---|
> | Boron | 0.03 | 0.16 | 0.51 | 1.1 |
> | Phosphorus | 0.01 | 0.06 | 0.25 | 1.0 |
> | Antimony | | 0.02 | 0.08 | 0.4 |
> | Arsenic | | 0.03 | 0.11 | 0.6 |
>
> Carusone's example: 100 keV arsenic stops at $0.06 \pm 0.02$ µm. Stacking a large high-energy dose with smaller low-energy doses gives a **retrograde** profile; equal doses at several energies give a deep **chained** implant with near-vertical sides.
>
> **Interactions** (Hastings §2.4.2): later hot steps keep driving earlier junctions deeper; heavy phosphorus strains the lattice and speeds up boron below it ("emitter push"); oxidation injects defects that deepen diffusions under a growing oxide (oxidation-enhanced diffusion). This is why process engineers resist changing a qualified recipe.

### Deposition and Etching

```tikz title="Etch direction decides the edge. A wet (isotropic) etch undercuts the resist; reactive-ion etching (anisotropic) cuts vertical walls. Deposition: CVD coats steps conformally, evaporated metal thins at a step. After Hastings Figs. 2.9, 2.33."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (4,1);
  \draw[diel,fill=gray!30] (0,1) -- (1.2,1) to[out=0,in=-90] (1.55,1.6) -- (0,1.6) -- cycle;
  \draw[diel,fill=gray!30] (4,1) -- (2.8,1) to[out=180,in=-90] (2.45,1.6) -- (4,1.6) -- cycle;
  \draw[pr] (0,1.6) rectangle (1.75,1.85); \draw[pr] (2.25,1.6) rectangle (4,1.85);
  \draw[<->,red] (1.55,2.05) -- (1.75,2.05); \node[font=\scriptsize,red] at (1.0,2.15) {undercut};
  \node[font=\scriptsize] at (2,-0.35) {(a) wet etch: isotropic};
  \begin{scope}[xshift=4.8cm]
    \draw[psub] (0,0) rectangle (4,1);
    \draw[diel,fill=gray!30] (0,1) rectangle (1.75,1.6); \draw[diel,fill=gray!30] (2.25,1) rectangle (4,1.6);
    \draw[pr] (0,1.6) rectangle (1.75,1.85); \draw[pr] (2.25,1.6) rectangle (4,1.85);
    \foreach \x in {1.9,2.0,2.1} {\draw[imp,thin] (\x,2.3) -- (\x,1.1);}
    \node[font=\scriptsize] at (2,-0.35) {(b) RIE: anisotropic};
  \end{scope}
  \begin{scope}[xshift=9.6cm]
    \draw[diel,fill=gray!30] (0,0) rectangle (4,1);
    \draw[diel,fill=gray!30] (0,1) rectangle (1.4,1.6); \draw[diel,fill=gray!30] (2.6,1) rectangle (4,1.6);
    \draw[mone] (0,1.6) -- (1.4,1.6) -- (1.4,1.0) -- (2.6,1.0) -- (2.6,1.6) -- (4,1.6) -- (4,1.85) -- (2.62,1.85) -- (2.62,1.22) -- (1.38,1.22) -- (1.38,1.85) -- (0,1.85) -- cycle;
    \draw[red,thick] (1.38,1.25) -- (1.38,1.6);
    \node[font=\scriptsize,align=center] at (2,-0.45) {(c) step coverage: thin sidewall\\(evaporated Al) $\to$ EM risk};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **CVD** (chemical vapour deposition, usually low-pressure LPCVD): poly from silane at about 650 °C on oxide, nitride, deposited oxides, and tungsten that fills narrow holes without voids (Carusone §2.1.7, Hastings §2.7.4).
- **Epitaxy** is CVD on bare silicon at high temperature: the film continues the crystal (single-crystal epi). The same reaction on oxide gives polycrystalline silicon (poly) (Hastings §2.5).
- **Sputtering** (argon plasma knocks atoms off a target) deposits barrier metals and Al with better step coverage than evaporation; **electroplating** deposits copper (Hastings §2.7).
- **Wet etch** (HF for oxide, hot phosphoric acid for nitride): simple, selective, isotropic → undercut. **RIE**: ions accelerated onto the wafer, near-vertical walls, needed for every sub-micron feature (poly gates, trenches, contacts) (Hastings §2.3.2, §2.5.3).

> [!tip] Remark
> Thinning at a step raises the local current density. That is the reason barrier metals and tungsten plugs exist ([[#Back End Contacts, Plugs and Metal]]) and why vias and contacts carry their own current limits in [[Electromigration]].

### Planarization (CMP) and Dummy Fill

```tikz title="CMP polishes high spots first, but over a wide empty region the pad sags and dishes the surface; dummy fill in empty areas keeps the pattern density, and so the surface, uniform. After Hastings Sec. 2.7.5."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[diel,fill=gray!20] (0,0) -- (7,0) -- (7,1.3) -- (5.8,1.3) to[out=180,in=0] (3.5,0.95) to[out=180,in=0] (1.2,1.3) -- (0,1.3) -- cycle;
  \foreach \x in {0.2,0.7} {\draw[mone] (\x,0.4) rectangle (\x+0.35,0.8);}
  \foreach \x in {6.0,6.5} {\draw[mone] (\x,0.4) rectangle (\x+0.35,0.8);}
  \draw[<->,red] (3.5,1.3) -- (3.5,0.95); \node[font=\scriptsize,red,anchor=west] at (3.6,1.12) {dishing};
  \draw[dashed] (0,1.3) -- (7,1.3);
  \node[font=\scriptsize] at (3.5,-0.35) {(a) wide empty region (hundreds of $\mu$m): dished};
  \begin{scope}[xshift=8cm]
    \draw[diel,fill=gray!20] (0,0) rectangle (7,1.3);
    \foreach \x in {0.2,0.7} {\draw[mone] (\x,0.4) rectangle (\x+0.35,0.8);}
    \foreach \x in {6.0,6.5} {\draw[mone] (\x,0.4) rectangle (\x+0.35,0.8);}
    \foreach \x in {1.6,2.3,3.0,3.7,4.4,5.1} {\draw[mone,fill=blue!25,dashed] (\x,0.4) rectangle (\x+0.35,0.8);}
    \node[font=\scriptsize] at (3.5,-0.35) {(b) floating dummy fill: flat};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **CMP** (chemical-mechanical polishing): an alkaline slurry softens oxide, abrasive scrubs it, high spots go first. It replaced spin-on-glass and resist etch-back once metal pitch went sub-micron (Hastings §2.7.5).
- It is what makes STI, tungsten plugs and damascene copper possible, and it erases the old alignment shadows (so STI processes use etched alignment marks; Hastings §2.5.1).
- Fill is generated automatically; the designer only blocks it where it would disturb a sensitive structure (rules in [[Layout Fundamentals]], fill near matched devices in [[Device Matching]]).

## Level 2: Isolation

### Junction Isolation and Wells

```tikz title="Junction isolation: every well-to-substrate junction must stay reverse-biased. p-substrate at the most negative supply; each n-well at (or above) the highest voltage on its PMOS. Two wells can sit at two different supplies. After Hastings Figs. 2.26, 2.27 and Sec. 4.2.2."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (12,2.6);
  \draw[nwell] (3.6,2.6) -- (3.6,1.3) to[out=-90,in=180] (4.0,0.9) -- (6.4,0.9) to[out=0,in=-90] (6.8,1.3) -- (6.8,2.6);
  \draw[nwell] (8.0,2.6) -- (8.0,1.3) to[out=-90,in=180] (8.4,0.9) -- (10.8,0.9) to[out=0,in=-90] (11.2,1.3) -- (11.2,2.6);
  \draw[ndiff] (1.0,2.6) rectangle (1.8,2.35); \draw[ndiff] (2.3,2.6) rectangle (3.1,2.35);
  \draw[pdiff] (4.0,2.6) rectangle (4.8,2.35); \draw[pdiff] (5.2,2.6) rectangle (6.0,2.35); \draw[ndiff] (6.1,2.6) rectangle (6.6,2.35);
  \draw[pdiff] (8.4,2.6) rectangle (9.2,2.35); \draw[pdiff] (9.6,2.6) rectangle (10.4,2.35); \draw[ndiff] (10.5,2.6) rectangle (11.0,2.35);
  \draw[pdiff] (0.2,2.6) rectangle (0.7,2.35);
  \draw (5.2,0.2) to[D,diodes/scale=0.5] (5.2,0.9);
  \draw (9.6,0.2) to[D,diodes/scale=0.5] (9.6,0.9);
  \draw (2.7,1.5) to[D,diodes/scale=0.5] (2.7,2.35);
  \node[font=\scriptsize,anchor=north] at (0.45,2.3) {GND};
  \node[font=\scriptsize,anchor=south] at (6.35,2.65) {$V_{DD1}$};
  \node[font=\scriptsize,anchor=south] at (10.75,2.65) {$V_{DD2}$};
  \node[font=\scriptsize] at (2.0,3.35) {NMOS (body = substrate)};
  \node[font=\scriptsize] at (5.2,3.35) {PMOS, well 1};
  \node[font=\scriptsize] at (9.6,3.35) {PMOS, well 2};
  \node[font=\scriptsize,align=left,anchor=west] at (12.2,1.5) {all junction diodes\\reverse-biased:\\$V_{sub} = $ most negative,\\$V_{well} \ge V_{S,PMOS}$};
  \node[font=\scriptsize] at (1.4,0.5) {p-substrate};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{p\text{-}sub} = \min(\text{all node voltages}), \qquad V_{n\text{-}well} \ge \max(V_{S}, V_{D}) \text{ of every PMOS in it}}
$$

- An **n-well process** puts NMOS in the p-epi/substrate and PMOS in n-wells. All NMOS share one body (the substrate); PMOS in separate wells can have separate bodies, an extra degree of freedom for analog design (Hastings §4.2.3).
- N-well beats p-well commercially because systems use a common negative ground with several positive supplies (Hastings §4.2.2).
- If an isolation junction forward-biases, it **injects minority carriers** into the substrate that collect at other wells: glitches, or latch-up ([[Failure Mechanisms]], [[Guard Rings, ESD and Interconnect#Latch-up]]).
- Well depth sets the voltage it can hold: a 20 V CMOS n-well is about 5 µm deep; a 40 V process needs 6 to 10 µm (Hastings §2.6.1, §4.2.2).

> [!tip] Remark
> These bias rules are the diode picture in [[MosFETs#Structure]]: NMOS bulk to the most negative supply, PMOS well to the most positive. The well junction is also a capacitor and a diode you can use on purpose ([[Diodes]], [[Capacitor#Junction Capacitors]]).

> [!note]- Detail: well vs tank (Hastings §2.6.1)
> A **well** is a counterdoped diffusion with a graded profile (CMOS n-well). A **tank** (or tub) is a piece of uniformly doped epi fenced in by isolation diffusions that reach down to the substrate (standard bipolar N-tank). Hybrids exist, but most structures are clearly one or the other.

### The Parasitic Field Transistor and Channel Stop

```tikz title="Any wire over the field between two diffusions is the gate of a thick-oxide MOSFET. If the wire voltage exceeds that device's threshold, an inversion layer leaks current from M1 to M2; a channel-stop implant under the field raises the threshold. After Razavi Fig. 18.6."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{(a) field inverts under a high-voltage wire},1/{(b) p+ channel-stop implant under the field}} {
    \begin{scope}[xshift=\i*7.4cm]
      \draw[psub] (0,0) rectangle (6.6,1.6);
      \draw[ndiff] (0.4,1.6) rectangle (1.6,1.3); \draw[ndiff] (5.0,1.6) rectangle (6.2,1.3);
      \draw[sti] (1.6,1.6) rectangle (5.0,2.3);
      \draw[mone] (1.4,2.3) rectangle (5.2,2.55);
      \node[font=\scriptsize] at (1.0,1.85) {M1 drain}; \node[font=\scriptsize] at (5.6,1.85) {M2 source};
      \node[font=\scriptsize,anchor=south] at (3.3,2.55) {wire at high $V$};
      \node[font=\scriptsize] at (3.3,-0.35) {\t};
    \end{scope}
  }
  \draw[red,very thick,dashed] (1.6,1.5) -- (5.0,1.5);
  \node[font=\scriptsize,red] at (3.3,1.05) {inversion layer: leakage};
  \begin{scope}[xshift=7.4cm]
    \draw[fill=orange!45,draw=black!50] (1.7,1.6) rectangle (4.9,1.35);
    \node[font=\scriptsize] at (3.3,1.0) {channel stop: $V_{TH,field}\gg V_{DD}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Thick field oxide alone raises the parasitic threshold by only a few volts in a low-doped process, so a **channel-stop** (field) implant is added: p-type under the field in p-regions, n-type under the field in n-wells (Hastings §4.2.2, Razavi §18.5).
- Modern low-voltage STI processes dope the body heavily enough that they rely less on channel stops (Hastings §4.2.1).
- The rule this leaves you: never assume a wire over the field is harmless if its voltage exceeds the process rating (thick-field threshold), e.g. high-voltage lines over low-voltage wells.

### LOCOS vs Shallow Trench Isolation

```tikz title="Two ways to put thick oxide between devices. LOCOS grows it through a nitride window, and the oxidant creeping under the nitride leaves a bird's beak that eats active width. STI etches a vertical trench, fills it and polishes flat. After Hastings Figs. 2.14, 2.25, 4.22 and Carusone Figs. 2.7, 2.8."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \node[font=\bfseries\scriptsize,anchor=west] at (-0.2,2.3) {LOCOS};
  \foreach \i/\t in {0/{1. pad oxide, nitride, active mask},1/{2. wet oxidation},2/{3. strip nitride}} {
    \begin{scope}[xshift=\i*4.6cm]
      \draw[psub] (0,0) rectangle (4,1.2);
      \node[font=\scriptsize] at (2,-0.35) {\t};
    \end{scope}
  }
  \draw[thick,gray!70] (0,1.2) -- (4,1.2); \draw[nit] (0,1.24) rectangle (1.3,1.45); \draw[nit] (2.7,1.24) rectangle (4,1.45);
  \node[font=\scriptsize] at (2,1.55) {window};
  \begin{scope}[xshift=4.6cm]
    \draw[sti] (0.9,1.2) to[out=0,in=180] (1.6,0.9) -- (2.4,0.9) to[out=0,in=180] (3.1,1.2) to[out=180,in=0] (2.4,1.6) -- (1.6,1.6) to[out=180,in=0] (0.9,1.2);
    \draw[nit] (0,1.24) -- (1.1,1.24) to[out=0,in=200] (1.5,1.5) -- (1.5,1.7) to[out=200,in=0] (1.1,1.45) -- (0,1.45) -- cycle;
    \draw[nit] (4,1.24) -- (2.9,1.24) to[out=180,in=-20] (2.5,1.5) -- (2.5,1.7) to[out=-20,in=180] (2.9,1.45) -- (4,1.45) -- cycle;
  \end{scope}
  \begin{scope}[xshift=9.2cm]
    \draw[sti] (0.9,1.2) to[out=0,in=180] (1.6,0.9) -- (2.4,0.9) to[out=0,in=180] (3.1,1.2) to[out=180,in=0] (2.4,1.6) -- (1.6,1.6) to[out=180,in=0] (0.9,1.2);
    \draw[<->,red] (0.9,1.85) -- (1.6,1.85); \node[font=\scriptsize,red] at (1.25,2.05) {bird's beak};
    \node[font=\scriptsize,align=left,anchor=west] at (4.1,1.0) {limit: devices $\gtrsim$0.6 $\mu$m\\(fully recessed: 0.4 $\mu$m)\\Hastings; Carusone: $>$0.25 $\mu$m};
  \end{scope}
  \begin{scope}[yshift=-3.3cm]
    \node[font=\bfseries\scriptsize,anchor=west] at (-0.2,2.3) {STI};
    \foreach \i/\t in {0/{1. nitride mask, RIE trench},1/{2. liner oxide, CVD overfill},2/{3. CMP, strip nitride}} {
      \begin{scope}[xshift=\i*4.6cm]
        \node[font=\scriptsize] at (2,-0.35) {\t};
      \end{scope}
    }
    \draw[psub] (0,0) -- (0,1.2) -- (1.5,1.2) -- (1.5,0.6) -- (2.5,0.6) -- (2.5,1.2) -- (4,1.2) -- (4,0) -- cycle;
    \draw[nit] (0,1.22) rectangle (1.5,1.42); \draw[nit] (2.5,1.22) rectangle (4,1.42);
    \begin{scope}[xshift=4.6cm]
      \draw[psub] (0,0) -- (0,1.2) -- (1.5,1.2) -- (1.5,0.6) -- (2.5,0.6) -- (2.5,1.2) -- (4,1.2) -- (4,0) -- cycle;
      \draw[nit] (0,1.22) rectangle (1.5,1.42); \draw[nit] (2.5,1.22) rectangle (4,1.42);
      \draw[sti] (0,1.42) -- (1.5,1.42) -- (1.5,0.6) -- (2.5,0.6) -- (2.5,1.42) -- (4,1.42) -- (4,1.75) -- (2.6,1.75) to[out=180,in=0] (2.0,1.6) to[out=180,in=0] (1.4,1.75) -- (0,1.75) -- cycle;
    \end{scope}
    \begin{scope}[xshift=9.2cm]
      \draw[psub] (0,0) -- (0,1.2) -- (1.5,1.2) -- (1.5,0.6) -- (2.5,0.6) -- (2.5,1.2) -- (4,1.2) -- (4,0) -- cycle;
      \draw[sti] (1.5,1.2) -- (1.5,0.6) -- (2.5,0.6) -- (2.5,1.2) -- cycle;
      \node[font=\scriptsize,align=left,anchor=west] at (4.1,0.8) {vertical walls, flat surface:\\widths $<$0.1 $\mu$m (Hastings)\\cost: more steps, stress};
    \end{scope}
  \end{scope}
\end{circuitikz}
\end{document}
```

- **LOCOS** (local oxidation): pad oxide (stress buffer) + CVD nitride patterned with the **inverse moat** mask; wet oxidation grows field oxide only in the nitride windows; the regions left are **moat** (active, OD). Leaves a bird's beak and a non-flat surface.
- **STI**: trenches cut by RIE, lined with thermal oxide, overfilled with CVD oxide, CMP'd flat. It is done at the start of the flow, before the wells (Carusone §2.1.5). It replaced LOCOS in fine-line processes.
- Either way the drawn **active** (OD, moat) layer defines where gate oxide and transistors go; everything else is field.

> [!tip] Remark
> STI has a cost that matters to analog layout: the oxide fill stresses the active silicon nearby, shifting mobility and $V_{TH}$ with the distance from gate to trench edge (Carusone §2.1.5; Razavi §19.2.3). The layout cure (dummy fingers, equal diffusion extensions) is in [[Device Matching]].

> [!note]- Detail: the Kooi effect and the sacrificial gate oxide (Hastings §2.3.4, §4.2.2)
> Steam during wet LOCOS attacks the nitride and releases ammonia, which diffuses under the pad oxide at the moat edge and re-forms silicon nitride there. That residue survives the oxide strip (the etch is selective to oxide) and locally blocks the later gate oxidation: thin, weak gate oxide at every moat edge. The cure is a **dummy (sacrificial) gate oxidation**: grow a thin oxide, which slowly consumes the nitride, strip it, then grow the real gate oxide.

### Dielectric Isolation (SOI)

```tikz title="Dielectric isolation: device islands sit on a buried oxide (BOX) and are fenced by oxide-lined, poly-filled deep trenches, so no junction to the substrate exists. After Hastings Figs. 2.29, 2.30."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub,fill=orange!25] (0,0) rectangle (10,1.2);
  \draw[sti] (0,1.2) rectangle (10,1.55);
  \draw[fill=cyan!10,draw=black!60] (0,1.55) rectangle (10,3.0);
  \foreach \x in {3.1,6.6} {\draw[sti] (\x,1.55) rectangle (\x+0.4,3.0); \draw[poly,fill=red!30] (\x+0.1,1.55) rectangle (\x+0.3,2.95);}
  \node[font=\scriptsize] at (5,0.6) {handle wafer (mechanical only)};
  \node[font=\scriptsize] at (1.5,1.37) {buried oxide (BOX)};
  \node[font=\scriptsize] at (1.5,2.3) {island 1}; \node[font=\scriptsize] at (5.0,2.3) {island 2}; \node[font=\scriptsize] at (8.4,2.3) {island 3};
  \node[font=\scriptsize,anchor=south] at (6.8,3.0) {deep trench (oxide + poly)};
\end{circuitikz}
\end{document}
```

- Ways to build it: silicon-on-sapphire (SOS), SIMOX (high-energy oxygen implant forms the BOX), or **wafer bonding** with hydrogen or germanium cleaving to leave a thin silicon layer (Hastings §2.6.2, §2.6.3).
- Gains: no substrate injection (so no latch-up path through the substrate), radiation tolerance, hundreds of volts of isolation in little area, very low drain capacitance. Costs: wafer price, and oxide conducts heat poorly.
- Thin-film SOI enables **fully depleted** MOS transistors, which Hastings names as one driver of renewed interest in dielectric isolation; device behaviour of FD transistors is outside these sources.

## Level 3: The CMOS Flow Step by Step

### Front End

```tikz title="Front end of an STI n-well CMOS process, NMOS on the left and PMOS (in the n-well) on the right. One mask per panel unless noted. After Carusone Figs. 2.5 to 2.12, Razavi Fig. 18.8, Hastings Figs. 4.19 to 4.25."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \c/\r/\t in {0/0/{(a) pad oxide + nitride; ACTIVE mask},1/0/{(b) trench etch, oxide fill, CMP (STI)},0/1/{(c) NWELL mask: phosphorus implant},1/1/{(d) gate oxide; $V_t$-adjust implant(s)},0/2/{(e) poly deposit; POLY mask; RIE},1/2/{(f) LDD implant; spacer deposit + etch},0/3/{(g) NSD mask: arsenic n+ S/D},1/3/{(h) PSD mask: boron p+; anneal; salicide}} {
    \begin{scope}[xshift=\c*7cm,yshift=-\r*3.1cm]
      \draw[psub] (0,0) rectangle (6,1.5);
      \node[font=\scriptsize] at (3,-0.3) {\t};
      \ifnum\r>0
        \draw[nwell] (3.0,1.5) -- (3.0,0.75) to[out=-90,in=180] (3.3,0.45) -- (6,0.45) -- (6,1.5);
      \fi
      \ifnum\r>0 \def\sti{1}\else\ifnum\c>0 \def\sti{1}\else\def\sti{0}\fi\fi
      \ifnum\sti=1
        \foreach \a/\b in {0/0.6,2.6/3.4,5.4/6} {\draw[sti] (\a,1.5) -- (\a+0.05,1.1) -- (\b-0.05,1.1) -- (\b,1.5) -- cycle;}
      \fi
    \end{scope}
  }
  % (a)
  \draw[thick,gray!70] (0,1.5) -- (6,1.5);
  \draw[nit] (0.6,1.52) rectangle (2.6,1.7); \draw[nit] (3.4,1.52) rectangle (5.4,1.7);
  \draw[pr] (0.6,1.7) rectangle (2.6,1.88); \draw[pr] (3.4,1.7) rectangle (5.4,1.88);
  \node[font=\scriptsize] at (1.6,2.1) {active}; \node[font=\scriptsize] at (4.4,2.1) {active};
  % (c)
  \begin{scope}[yshift=-3.1cm]
    \draw[pr] (0,1.5) rectangle (2.95,1.8);
    \foreach \x in {3.3,3.9,4.5,5.1,5.7} {\draw[imp] (\x,2.35) -- (\x,1.6);}
    \node[font=\scriptsize] at (4.5,0.75) {n-well};
  \end{scope}
  % (d)
  \begin{scope}[xshift=7cm,yshift=-3.1cm]
    \draw[very thick,black!80] (0.6,1.52) -- (2.6,1.52); \draw[very thick,black!80] (3.4,1.52) -- (5.4,1.52);
    \foreach \x in {0.9,1.6,2.3,3.7,4.4,5.1} {\draw[imp] (\x,2.3) -- (\x,1.6);}
  \end{scope}
  % (e)-(h) gates
  \foreach \c/\r in {0/2,1/2,0/3,1/3} {
    \begin{scope}[xshift=\c*7cm,yshift=-\r*3.1cm]
      \draw[very thick,black!80] (0.6,1.52) -- (2.6,1.52); \draw[very thick,black!80] (3.4,1.52) -- (5.4,1.52);
      \draw[poly] (1.4,1.53) rectangle (1.8,1.85); \draw[poly] (4.2,1.53) rectangle (4.6,1.85);
    \end{scope}
  }
  % spacers + LDD on (f),(g),(h)
  \foreach \c/\r in {1/2,0/3,1/3} {
    \begin{scope}[xshift=\c*7cm,yshift=-\r*3.1cm]
      \draw[nlight] (0.6,1.5) rectangle (1.4,1.38); \draw[nlight] (1.8,1.5) rectangle (2.6,1.38);
      \foreach \g in {1.4,4.2} {\fill[gray!40] (\g-0.18,1.53) -- (\g,1.53) -- (\g,1.83) -- cycle; \fill[gray!40] (\g+0.58,1.53) -- (\g+0.4,1.53) -- (\g+0.4,1.83) -- cycle;}
    \end{scope}
  }
  \begin{scope}[xshift=7cm,yshift=-6.2cm]
    \foreach \x in {0.8,1.6,2.4} {\draw[imp] (\x,2.4) -- (\x,1.95);}
    \node[font=\scriptsize,anchor=north] at (1.0,1.35) {n$^-$ LDD};
    \node[font=\scriptsize,anchor=south] at (4.4,1.85) {spacers};
  \end{scope}
  % (g) NSD
  \begin{scope}[yshift=-9.3cm]
    \draw[ndiff] (0.6,1.5) rectangle (1.22,1.25); \draw[ndiff] (1.98,1.5) rectangle (2.6,1.25);
    \draw[pr] (2.95,1.5) rectangle (6,2.05);
    \foreach \x in {0.8,1.6,2.4} {\draw[imp] (\x,2.45) -- (\x,1.95);}
  \end{scope}
  % (h) PSD + silicide
  \begin{scope}[xshift=7cm,yshift=-9.3cm]
    \draw[ndiff] (0.6,1.5) rectangle (1.22,1.25); \draw[ndiff] (1.98,1.5) rectangle (2.6,1.25);
    \draw[pdiff] (3.4,1.5) rectangle (4.02,1.25); \draw[pdiff] (4.78,1.5) rectangle (5.4,1.25);
    \foreach \a/\b in {0.6/1.2,2.0/2.6,3.4/4.0,4.8/5.4,1.4/1.8,4.2/4.6} {\draw[sil] (\a,1.5) rectangle (\b,1.56);}
    \draw[sil] (1.4,1.85) rectangle (1.8,1.91); \draw[sil] (4.2,1.85) rectangle (4.6,1.91);
    \node[font=\scriptsize] at (1.6,2.2) {NMOS}; \node[font=\scriptsize] at (4.4,2.2) {PMOS};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Step | Mask (drawn layer) | What it builds | Notes |
|---|---|---|---|
| 1. Active / isolation | ACTIVE (OD, moat); LOCOS uses its inverse | STI or LOCOS field | channel stop implanted under the field (LOCOS) |
| 2. N-well | NWELL | PMOS body, well resistor, PNP base | retrograde implant + drive |
| 3. $V_t$ adjust, gate oxide | (VT, often from active) | sets $V_{TH}$, $t_{ox}$ | one implant for both, or one per type |
| 4. Poly gate | POLY | gates, poly wires, poly resistors | $L$ = poly width; most critical mask with ACTIVE |
| 5. LDD + spacers | (none: self-aligned) | lightly doped drain extensions | spacer width sets the drift length |
| 6. n+ S/D | NSD (n-select) | NMOS S/D, n-well ties | arsenic, self-aligned to poly + spacer |
| 7. p+ S/D | PSD (p-select) | PMOS S/D, substrate ties | boron |
| 8. Anneal, salicide | (silicide block if resistors) | activates dopant; low-R S/D and poly | last high-temperature FEOL step |

- The threshold-adjust implant goes in after (or through) the gate oxide; native thresholds are typically off-target ($V_{THN}\approx0$, $V_{THP}\approx-1$ V in Razavi's description), and a single shallow boron implant moves both positive (Razavi §18.7.1, Carusone §2.1.6).
- Gate poly is doped (implant) to a few tens of Ω/□ and later silicided; the n+/p+ implants also dope the poly they hit (Razavi).
- Substrate and well **ties** are just p+ (PSD) in the substrate and n+ (NSD) in the well: the lightly doped body cannot take an ohmic contact directly (Hastings §4.2.2).

> [!tip] Remark
> Steps 4 to 7 are where the transistor in [[MosFETs#Structure]] gets its $L_{eff}$, its overlap capacitance $C_{ov}$, its $V_{TH}$ and its junction capacitances. The PMOS sits in the counterdoped n-well, which slightly lowers its mobility (Hastings §4.2.2), one more reason $\mu_p C_{ox} \approx 0.5\,\mu_n C_{ox}$.

> [!example]- Detail: Hastings' 4/3 analog CMOS, a complete LOCOS flow with real numbers (§4.2.2, Table 4.4)
> A 1980s analog process, 9 masks, still a good template: p-epi (5 to 10 µm) on P+ (100) substrate → N-well mask, phosphorus implant, long drive (about 5 µm deep for a 20 V process), pad oxide grows → nitride deposit, **inverse-moat** mask, nitride etch → blanket boron channel stop (resist kept), **channel-stop** mask, phosphorus channel stop over the n-well fields → LOCOS oxidation, nitride strip → dummy gate oxidation (Kooi) → **$V_t$-adjust** mask, single boron implant → strip, dry gate oxidation → poly deposit, phosphorus doping (20 to 40 Ω/□), **poly** mask → TEOS spacers → **NSD** mask (arsenic) → **PSD** mask (boron) → anneal → BPSG multilevel oxide (MLO) → **contact** mask, BPSG reflow (last hot step) → PtSi in contacts, barrier metal, Cu-doped Al → **metal** mask → protective overcoat + pad openings.
>
> | Parameter | NMOS | PMOS |
> |---|---|---|
> | Minimum drawn $L$ | 4 µm | 3 µm |
> | Gate oxide | 400 Å | 400 Å |
> | $V_{TH}$ adjusted / natural | 0.7 V / 0 V | −0.7 V / −1.4 V |
> | $k'$ at $W/L = 10/10$ | 50 µA/V² | 20 µA/V² |
> | Max $V_{GS}$ | 15 V | 15 V |
> | Max $V_{DS}$ blocking / operating | 15 V / 7 V | 15 V / 15 V |
>
> The NMOS operating limit is lower than its blocking limit because of hot-electron injection in saturation ([[MosFETs#Hot-Carrier Effects]]). Blocking the $V_t$-adjust implant gives **natural** (native) devices: a 0 V NMOS useful in analog, a −1.4 V PMOS.
>
> Gate oxide scales with voltage: about 400 Å for a 15 V device, under 100 Å for 3.3 V (Hastings); Carusone quotes 1 to 30 nm across processes.

### The Self-Aligned Gate

```tikz title="Why the gate comes before the junctions. (a) Junctions first: a small poly misalignment leaves a gap where no channel can form (or forces a large deliberate overlap). (b) Self-aligned: the implant is masked by the poly itself, so misalignment only changes which junction is wider. (c) Top view: the channel is the intersection of POLY and ACTIVE. After Razavi Fig. 18.9 and Hastings Fig. 2.21."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (4.4,1.4);
  \draw[ndiff] (0.4,1.4) rectangle (1.6,1.15); \draw[ndiff] (2.8,1.4) rectangle (4.0,1.15);
  \draw[very thick] (0.2,1.42) -- (4.2,1.42);
  \draw[poly] (1.9,1.43) rectangle (3.1,1.75);
  \draw[red,thick,<->] (1.6,1.0) -- (1.9,1.0); \node[font=\scriptsize,red,anchor=north] at (1.75,0.95) {gap: no channel};
  \node[font=\scriptsize] at (2.2,-0.35) {(a) S/D first, then gate (misaligned)};
  \begin{scope}[xshift=5.2cm]
    \draw[psub] (0,0) rectangle (4.4,1.4);
    \draw[very thick] (0.2,1.42) -- (4.2,1.42);
    \draw[poly] (1.9,1.43) rectangle (3.1,1.75);
    \draw[ndiff] (0.4,1.4) rectangle (1.9,1.15); \draw[ndiff] (3.1,1.4) rectangle (4.0,1.15);
    \foreach \x in {0.7,1.3,2.5,3.5} {\draw[imp] (\x,2.3) -- (\x,1.8);}
    \node[font=\scriptsize] at (2.2,-0.35) {(b) gate first, implant self-aligns};
  \end{scope}
  \begin{scope}[xshift=10.4cm]
    \draw[ndiff] (0,0.2) rectangle (3.6,1.6);
    \draw[poly] (1.4,-0.3) rectangle (2.2,2.1);
    \fill[pattern=north east lines] (1.4,0.2) rectangle (2.2,1.6);
    \draw[<->] (1.4,2.3) -- (2.2,2.3) node[midway,above,font=\scriptsize] {$L_{drawn}$};
    \draw[<->] (3.8,0.2) -- (3.8,1.6) node[midway,right,font=\scriptsize] {$W$};
    \node[font=\scriptsize,align=center] at (1.8,-0.75) {(c) channel = POLY $\cap$ ACTIVE};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{channel} = \text{POLY} \cap \text{ACTIVE}, \qquad L_{eff} = L_{drawn} - 2L_D}
$$

- Poly survives the S/D anneal (aluminium would not), which is what makes the self-aligned gate possible (Hastings §2.5.2, §4.2).
- The residual overlap $L_D$ comes only from straggle and lateral diffusion, so $C_{GD}$ stays small. Before self-alignment, metal gates had to overlap the drain on purpose, which made early CMOS slow (Hastings §4.2).
- ACTIVE and POLY are the two masks that define the transistor (Carusone §2.1.8); every other mask only needs to cover its region with margin.

> [!tip] Remark
> $L_D$ and the overlap capacitance $C_{ov} = WL_DC_{ox}$ are in [[MosFETs#Capacitances]]. Because the poly edge defines both junction edges, poly linewidth variation is what matters for $L$, and it is why matched devices use the same orientation and finger length ([[Device Matching]]).

### Spacers and Lightly Doped Drain

```tikz title="Building an LDD transistor with oxide sidewall spacers: a light n- implant self-aligned to the poly, a conformal oxide etched back to leave spacers, then the heavy n+ implant self-aligned to the spacers. After Hastings Fig. 4.33."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{1. poly; n$^-$ implant},1/{2. conformal oxide (CVD/TEOS)},2/{3. anisotropic etch: spacers},3/{4. n$^+$ implant}} {
    \begin{scope}[xshift=\i*4.0cm]
      \draw[psub] (0,0) rectangle (3.5,1.2);
      \draw[very thick] (0,1.22) -- (3.5,1.22);
      \draw[poly] (1.35,1.23) rectangle (2.15,1.6);
      \draw[nlight] (0.1,1.2) rectangle (1.35,1.08); \draw[nlight] (2.15,1.2) rectangle (3.4,1.08);
      \node[font=\scriptsize] at (1.75,-0.35) {\t};
    \end{scope}
  }
  \foreach \x in {0.5,1.0,2.5,3.0} {\draw[imp] (\x,2.2) -- (\x,1.35);}
  \begin{scope}[xshift=4cm]
    \draw[diel,fill=gray!30] (0,1.23) -- (1.15,1.23) -- (1.15,1.8) to[out=90,in=180] (1.35,2.0) -- (2.15,2.0) to[out=0,in=90] (2.35,1.8) -- (2.35,1.23) -- (3.5,1.23) -- (3.5,1.43) -- (2.55,1.43) -- (2.55,1.8) to[out=90,in=0] (2.15,2.2) -- (1.35,2.2) to[out=180,in=90] (0.95,1.8) -- (0.95,1.43) -- (0,1.43) -- cycle;
  \end{scope}
  \foreach \s in {8,12} {
    \begin{scope}[xshift=\s cm]
      \fill[gray!40] (1.0,1.23) -- (1.35,1.23) -- (1.35,1.58) to[out=200,in=80] cycle;
      \fill[gray!40] (2.5,1.23) -- (2.15,1.23) -- (2.15,1.58) to[out=-20,in=100] cycle;
    \end{scope}
  }
  \begin{scope}[xshift=12cm]
    \draw[ndiff] (0.1,1.2) rectangle (1.0,0.95); \draw[ndiff] (2.5,1.2) rectangle (3.4,0.95);
    \foreach \x in {0.4,0.8,2.7,3.1} {\draw[imp] (\x,2.2) -- (\x,1.35);}
    \draw[<->] (2.15,0.75) -- (2.5,0.75); \node[font=\scriptsize,anchor=north] at (2.5,0.7) {drift $\approx$ spacer};
  \end{scope}
\end{circuitikz}
\end{document}
```

- The light **drift region** lets the drain depletion spread into the drain, lowering the peak field at the pinch-off point and so hot-carrier injection. Cost: extra series resistance (Carusone §2.1.10).
- Hastings' numbers (400 Å oxide, 3 µm channel): SDD NMOS operates at 5 to 10 V, LDD NMOS at 12 to 15 V; spacer and drift width about 0.5 µm. Most 10 to 20 V processes pair LDD NMOS with plain (SDD) PMOS (Hastings §4.2.4).
- Spacers form on both sides, so the device stays symmetric (source and drain interchangeable). The spacer also stops the silicide on the gate shorting to the silicide on the S/D (Razavi §18.7.1).

> [!tip] Remark
> The hot-carrier mechanism LDD fights is in [[MosFETs#Hot-Carrier Effects]]; the reliability side (threshold drift, the "operating" vs "blocking" voltage rating) is in [[Failure Mechanisms]].

### Silicide and Silicide Block

```tikz title="Self-aligned silicide (salicide): a metal film reacts only where it touches silicon (S/D, poly top), the unreacted metal on oxide and spacers is stripped. A silicide-block mask keeps the body of a poly resistor unsilicided. After Hastings Fig. 2.35, Razavi Figs. 18.10, 18.13."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \foreach \i/\t in {0/{1. sputter Ti / Co / Ni},1/{2. anneal: reacts on Si only},2/{3. strip unreacted metal}} {
    \begin{scope}[xshift=\i*4.0cm]
      \draw[psub] (0,0) rectangle (3.5,1.2);
      \draw[very thick] (1.35,1.22) -- (2.15,1.22);
      \draw[poly] (1.35,1.23) rectangle (2.15,1.6);
      \fill[gray!40] (1.0,1.2) -- (1.35,1.2) -- (1.35,1.58) to[out=200,in=80] cycle;
      \fill[gray!40] (2.5,1.2) -- (2.15,1.2) -- (2.15,1.58) to[out=-20,in=100] cycle;
      \draw[ndiff] (0.1,1.2) rectangle (1.0,0.95); \draw[ndiff] (2.5,1.2) rectangle (3.4,0.95);
      \node[font=\scriptsize] at (1.75,-0.35) {\t};
    \end{scope}
  }
  \draw[fill=gray!60,draw=none] (0,1.2) -- (1.0,1.2) -- (1.35,1.58) -- (1.35,1.6) -- (2.15,1.6) -- (2.15,1.58) -- (2.5,1.2) -- (3.5,1.2) -- (3.5,1.3) -- (2.55,1.3) -- (2.2,1.7) -- (1.3,1.7) -- (0.95,1.3) -- (0,1.3) -- cycle;
  \begin{scope}[xshift=4cm]
    \draw[fill=gray!60,draw=none] (1.0,1.2) -- (1.35,1.58) -- (1.35,1.6) -- (1.3,1.7) -- (0.95,1.3) -- cycle;
    \draw[fill=gray!60,draw=none] (2.5,1.2) -- (2.15,1.58) -- (2.15,1.6) -- (2.2,1.7) -- (2.55,1.3) -- cycle;
    \draw[sil] (0.1,1.2) rectangle (1.0,1.28); \draw[sil] (2.5,1.2) rectangle (3.4,1.28); \draw[sil] (1.35,1.6) rectangle (2.15,1.68);
  \end{scope}
  \begin{scope}[xshift=8cm]
    \draw[sil] (0.1,1.2) rectangle (1.0,1.28); \draw[sil] (2.5,1.2) rectangle (3.4,1.28); \draw[sil] (1.35,1.6) rectangle (2.15,1.68);
    \node[font=\scriptsize,align=center] at (1.75,2.1) {self-aligned to\\spacer and STI edges};
  \end{scope}
  \begin{scope}[xshift=12.2cm]
    \draw[sti] (0,0.6) rectangle (4.2,1.2);
    \draw[psub] (0,0) rectangle (4.2,0.6);
    \draw[poly] (0.2,1.2) rectangle (4.0,1.45);
    \draw[sil] (0.2,1.45) rectangle (0.9,1.52); \draw[sil] (3.3,1.45) rectangle (4.0,1.52);
    \draw[dashed,thick,green!40!black] (1.0,1.1) rectangle (3.2,1.8);
    \node[font=\scriptsize,green!40!black] at (2.1,2.05) {silicide block};
    \node[font=\scriptsize] at (2.1,-0.35) {4. poly resistor on STI};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Silicide cuts the sheet resistance of poly and S/D by about an order of magnitude (from tens of Ω/□; Razavi §18.7.1) and gives low, repeatable contact resistance.
- Material history: PtSi (also makes Schottky diodes), then TiSi₂, whose low-resistance phase cannot form in lines narrower than about 1 µm; Co and Ni silicides do not have that problem (Hastings §2.7.3).
- **Silicide block** is an extra mask: without it every poly resistor would be a few Ω/□. Blocked poly gives tens to hundreds of Ω/□ (Razavi: 50 to a few hundred Ω/□, ±20% lot to lot); a further implant-block option gives 500 Ω to 3 kΩ/□ (Carusone §2.1.7).

> [!tip] Remark
> How to use each of these films as a resistor (sheet values, TC, voltage coefficient, contact resistance) is owned by [[Resistor#Silicide-Blocked Poly (the default)]] and [[Resistor#Silicided Poly, Source/Drain and Metal]]. Here: silicide is on by default everywhere silicon is exposed, and you must draw a block layer to stop it.

### Back End: Contacts, Plugs and Metal

```tikz title="Two back ends. Top: aluminium with tungsten plugs (contact etch, barrier, CVD tungsten, CMP, Al deposit and RIE). Bottom: dual-damascene copper (trench and via etched into the dielectric, TaN barrier and Cu seed, electroplate, CMP, nitride cap). After Hastings Figs. 2.36, 2.38, 2.40."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \node[font=\bfseries\scriptsize,anchor=west] at (-0.2,2.5) {Al + W plug};
  \foreach \i/\t in {0/{1. PMD; contact etch},1/{2. TiN barrier + CVD W},2/{3. CMP back to oxide},3/{4. Al deposit, M1 etch}} {
    \begin{scope}[xshift=\i*4.0cm]
      \draw[ndiff] (0,0) rectangle (3.5,0.5);
      \draw[sil] (0,0.5) rectangle (3.5,0.56);
      \draw[diel,fill=gray!15] (0,0.56) rectangle (1.45,1.6); \draw[diel,fill=gray!15] (2.05,0.56) rectangle (3.5,1.6);
      \node[font=\scriptsize] at (1.75,-0.35) {\t};
    \end{scope}
  }
  \begin{scope}[xshift=4cm]
    \draw[cont,fill=gray!70] (1.45,0.56) rectangle (2.05,1.6); \draw[cont,fill=gray!70] (0,1.6) rectangle (3.5,1.95);
    \draw[cont,fill=black] (1.5,0.6) rectangle (2.0,1.95);
  \end{scope}
  \begin{scope}[xshift=8cm]
    \draw[cont] (1.45,0.56) rectangle (2.05,1.6);
  \end{scope}
  \begin{scope}[xshift=12cm]
    \draw[cont] (1.45,0.56) rectangle (2.05,1.6);
    \draw[mone] (0.9,1.6) rectangle (2.6,1.9);
  \end{scope}
  \begin{scope}[yshift=-3.6cm]
    \node[font=\bfseries\scriptsize,anchor=west] at (-0.2,2.7) {dual-damascene Cu};
    \foreach \i/\t in {0/{1. IMD; via + trench etch},1/{2. TaN, Cu seed, plate},2/{3. CMP: inlaid line + via},3/{4. nitride (or SiC) cap}} {
      \begin{scope}[xshift=\i*4.0cm]
        \draw[diel,fill=gray!15] (0,0) rectangle (3.5,0.5);
        \draw[mone] (1.0,0.15) rectangle (2.5,0.5);
        \node[font=\scriptsize] at (1.75,-0.35) {\t};
      \end{scope}
    }
    \foreach \s in {0,4,8,12} {
      \begin{scope}[xshift=\s cm]
        \draw[diel,fill=gray!15] (0,0.5) -- (1.5,0.5) -- (1.5,1.1) -- (0.9,1.1) -- (0.9,1.8) -- (0,1.8) -- cycle;
        \draw[diel,fill=gray!15] (3.5,0.5) -- (2.0,0.5) -- (2.0,1.1) -- (2.6,1.1) -- (2.6,1.8) -- (3.5,1.8) -- cycle;
      \end{scope}
    }
    \begin{scope}[xshift=4cm]
      \draw[mtwo,fill=violet!45] (1.5,0.5) -- (2.0,0.5) -- (2.0,1.1) -- (2.6,1.1) -- (2.6,1.8) -- (3.5,1.8) -- (3.5,2.15) -- (0,2.15) -- (0,1.8) -- (0.9,1.8) -- (0.9,1.1) -- (1.5,1.1) -- cycle;
    \end{scope}
    \begin{scope}[xshift=8cm]
      \draw[mtwo] (1.5,0.5) -- (2.0,0.5) -- (2.0,1.1) -- (2.6,1.1) -- (2.6,1.8) -- (0.9,1.8) -- (0.9,1.1) -- (1.5,1.1) -- cycle;
    \end{scope}
    \begin{scope}[xshift=12cm]
      \draw[mtwo] (1.5,0.5) -- (2.0,0.5) -- (2.0,1.1) -- (2.6,1.1) -- (2.6,1.8) -- (0.9,1.8) -- (0.9,1.1) -- (1.5,1.1) -- cycle;
      \draw[nit] (0,1.8) rectangle (3.5,1.95);
    \end{scope}
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{each extra metal level} = 2 \text{ masks (via + metal)}}
$$

- **Pre-metal dielectric** (PMD, MLO; often BPSG) is deposited at 500 °C or lower, about 0.25 to 0.5 µm (Carusone, Razavi). After this the wafer only sees low temperatures: the Al sinter is about 450 °C (Hastings), and Carusone caps any post-metal anneal below 550 °C.
- **Tungsten plugs** appear once contacts shrink below about 1 µm: aluminium cannot fill the hole. Plugs give a flat surface, allow **stacked contacts and vias**, and force fixed-size square contacts (Hastings §2.7.4).
- **Copper** has about 35% less resistance than Al and an order of magnitude better electromigration life, but it diffuses through oxide and cannot be dry-etched, hence **damascene**: etch the dielectric, fill with Cu, polish, cap (Hastings §2.7.6). Dual damascene fills via and line in one plating step.
- Upper metals are thicker: about 100 mΩ/□ for the lower layers and 30 mΩ/□ for the top layer (Razavi §18.7.3). Analog processes typically have 3 or 4 metals (top one thick for current); digital ones 5 to 10 or more (Hastings, Carusone).

> [!note]- Detail: why aluminium needs a barrier, and the stack in Hastings' DLM process (§2.7.1 to §2.7.5)
> Sintering Al on silicon dissolves silicon into the aluminium unevenly; the deepest pits can punch through a shallow junction (**contact spiking**). Fixes in historical order: Al alloyed with a few percent Si; a refractory barrier metal (TiW, later TiN) between Al and Si; silicided contacts. A few tenths of a percent of Cu in the Al improves electromigration by about 10×. A typical first-metal stack is silicide in the contact → barrier → Cu-doped Al → TiN anti-reflective coat on top for the next lithography.
>
> Hastings' double-metal single-poly BEOL needs six masks (poly, contact, metal-1, via, metal-2, pad opening) plus a seventh (silicide block) if unsilicided resistors are wanted.
>
> Very thick top copper ("power copper", plated through openings in the overcoat, capped with Ni/Pd) allows bond-over-active-circuitry and copper pillars for flip-chip; that interface belongs to [[Packaging]].

### Contacts: Arrays of Small Squares

```tikz title="Bad vs good contact. One big contact window lets aluminium eat through a shallow junction (spiking). Modern rules allow only one contact size, so a wide connection is an array of minimum squares, each enclosed by diffusion and metal. After Razavi Fig. 18.12 and Hastings Sec. 4.2.3."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (4.4,1.2);
  \draw[ndiff] (0.4,1.2) rectangle (4.0,0.95);
  \draw[diel] (0,1.2) rectangle (0.6,1.8); \draw[diel] (3.8,1.2) rectangle (4.4,1.8);
  \draw[mone] (0.4,1.8) -- (0.6,1.8) -- (0.6,1.2) -- (3.8,1.2) -- (3.8,1.8) -- (4.0,1.8) -- (4.0,2.05) -- (0.4,2.05) -- cycle;
  \foreach \x in {1.4,2.6} {\draw[mone] (\x,1.2) -- (\x+0.15,0.6) -- (\x+0.3,1.2);}
  \node[font=\scriptsize,red,align=center] at (2.2,0.3) {spikes short n+ to p-sub};
  \node[font=\scriptsize] at (2.2,-0.35) {(a) bad: one large contact};
  \begin{scope}[xshift=5.2cm]
    \draw[psub] (0,0) rectangle (4.4,1.2);
    \draw[ndiff] (0.4,1.2) rectangle (4.0,0.95);
    \draw[sil] (0.4,1.2) rectangle (4.0,1.25);
    \draw[diel] (0,1.25) rectangle (4.4,1.8);
    \foreach \x in {0.8,1.6,2.4,3.2} {\draw[cont] (\x,1.25) rectangle (\x+0.35,1.8);}
    \draw[mone] (0.5,1.8) rectangle (3.9,2.05);
    \node[font=\scriptsize] at (2.2,-0.35) {(b) good: array of minimum contacts};
  \end{scope}
  \begin{scope}[xshift=10.4cm]
    \draw[ndiff] (0,0) rectangle (4.0,1.8);
    \draw[mone,fill=blue!25] (0.25,0.35) rectangle (3.75,1.45);
    \foreach \x in {0.55,1.4,2.25,3.1} {\draw[cont] (\x,0.65) rectangle (\x+0.35,1.0);}
    \draw[<->] (0,1.65) -- (0.55,1.65); \node[font=\scriptsize,anchor=south] at (0.3,1.8) {encl.};
    \node[font=\scriptsize,align=center] at (2.0,-0.45) {(c) top view: n+ and M1 both\\enclose every contact};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Oxide etch rate depends on window size and shape, so foundries fix one contact size; a "big contact" is an array (Hastings §4.2.3, Razavi §18.7.1).
- Razavi also notes that contacts to gate poly are not placed over the gate (thin oxide) area.

> [!tip] Remark
> The array's resistance (contacts in parallel, each a few ohms) and the current each contact may carry are in [[Resistor#Contact Resistance]] and [[Electromigration]]; the enclosure values come from the overlay budget above and live in [[Layout Fundamentals]].

### From Drawn Layers to Masks

```tikz title="Top view of the inverter whose cut A-A' is the big-picture cross-section. The designer draws ACTIVE (coloured by its NSD/PSD select), NWELL, POLY, CONTACT, M1, VIA, M2; the fab derives the actual masks (inverse moat, select layers oversized, V_t adjust, channel stop). After Razavi Figs. 18.1, 18.2 and Hastings Fig. 4.27."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[nwell] (6.0,-0.6) rectangle (12.2,4.2);
  \node[font=\scriptsize,cyan!40!black] at (11.5,3.95) {NWELL};
  \draw[pdiff] (0.5,0.4) rectangle (1.5,2.6);
  \draw[ndiff] (2.1,0.4) rectangle (5.1,2.6);
  \draw[pdiff] (7.0,0.4) rectangle (10.0,2.6);
  \draw[ndiff] (10.6,0.4) rectangle (11.6,2.6);
  \draw[poly] (3.28,0.0) rectangle (3.92,3.0); \draw[poly] (8.18,0.0) rectangle (8.82,3.0);
  \draw[poly] (3.28,3.0) rectangle (8.82,3.5);
  \draw[cont] (5.85,3.1) rectangle (6.15,3.4);
  \foreach \x in {0.85,2.5,4.45,7.35,9.35,10.95} {\foreach \y in {0.8,1.5,2.2} {\draw[cont] (\x,\y-0.15) rectangle (\x+0.3,\y+0.15);}}
  \draw[mone,fill=blue!55,opacity=0.55] (0.6,0.5) rectangle (3.0,2.5);
  \draw[mone,fill=blue!55,opacity=0.55] (4.25,0.5) rectangle (5.0,2.5);
  \draw[mone,fill=blue!55,opacity=0.55] (7.1,0.5) rectangle (7.95,2.5);
  \draw[mone,fill=blue!55,opacity=0.55] (9.15,0.5) rectangle (11.5,2.5);
  \draw[mone,fill=blue!55,opacity=0.55] (5.6,2.9) rectangle (6.4,3.6);
  \draw[mtwo,opacity=0.6] (4.3,1.15) rectangle (7.85,1.85);
  \draw[cont,fill=white] (4.45,1.35) rectangle (4.75,1.65); \draw[cont,fill=white] (7.35,1.35) rectangle (7.65,1.65);
  \draw[dashed,thick] (-0.3,1.5) -- (12.5,1.5); \node[font=\scriptsize,anchor=east] at (-0.3,1.5) {A}; \node[font=\scriptsize,anchor=west] at (12.5,1.5) {A$'$};
  \node[font=\scriptsize,anchor=south] at (6.0,3.6) {in (M1)};
  \node[font=\scriptsize] at (1.8,-0.3) {GND (M1)}; \node[font=\scriptsize] at (10.3,-0.3) {$V_{DD}$ (M1)}; \node[font=\scriptsize] at (6.05,0.9) {out (M2)};
  \node[font=\scriptsize] at (1.0,2.85) {sub tie}; \node[font=\scriptsize] at (11.1,2.85) {well tie};
  \node[font=\scriptsize,align=left,anchor=west] at (12.7,0.6) {white square = via\\black square = contact};
\end{circuitikz}
\end{document}
```

| Drawn layer | Mask(s) it generates | Typical derivation (Hastings §4.2.3) |
|---|---|---|
| NWELL | n-well; n-type channel stop | channel stop = NWELL oversized (covers outdiffusion) |
| ACTIVE (NMoat, PMoat) | moat / inverse moat (LOCOS) or STI trench | inverse moat = colour-reversed moat |
| NMoat / PMoat | NSD / PSD select | select = moat oversized by the misalignment budget |
| (derived) | $V_t$ adjust | = moat (only the channel needs it) |
| POLY | poly | sized so drawn ≈ effective $L$ |
| SILICIDE BLOCK | silicide block | drawn over resistor bodies |
| CONTACT, M1, VIA, M2, … | one mask each | fixed-size squares for contacts/vias |
| PAD | passivation (overcoat) opening | |

- NSD and PSD regions at different potentials must not abut: a p+/n+ junction leaks and breaks down at very low voltage. Abutting is allowed (and compact) only when they share a node, e.g. NMOS source butted to its substrate tie (Hastings §4.2.3).
- Drawn $W$ and $L$ are not the electrical ones; foundries may apply size adjusts so that drawn ≈ effective (Hastings §4.2.3).

> [!tip] Remark
> What the rules on these layers are (widths, spacings, enclosures, extensions), how to read a DRM, and stick diagrams are owned by [[Layout Fundamentals]]. This table only says which physical step each layer becomes.

## Level 4: What the Flow Gives You

### Devices for Free

```tikz title="Components built entirely from the CMOS steps above, no extra masks except the silicide block: a substrate PNP, an n-well resistor, a gate-oxide (poly on n-well) capacitor and a silicide-blocked poly resistor on STI. After Hastings Figs. 4.29 to 4.32, Razavi Figs. 18.13, 18.14."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (17,2.6);
  \foreach \a/\b in {0/0.4,1.2/1.6,4.4/4.8,8.6/9.0,12.4/12.8,16.6/17} {\draw[sti] (\a,2.6) -- (\a+0.05,2.2) -- (\b-0.05,2.2) -- (\b,2.6) -- cycle;}
  % substrate PNP
  \draw[pdiff] (0.4,2.6) rectangle (1.2,2.35);
  \draw[nwell] (1.6,2.6) -- (1.6,1.3) to[out=-90,in=180] (1.9,1.0) -- (4.1,1.0) to[out=0,in=-90] (4.4,1.3) -- (4.4,2.6);
  \draw[sti] (1.6,2.6) -- (1.65,2.2) -- (1.95,2.2) -- (2.0,2.6) -- cycle;
  \draw[pdiff] (2.0,2.6) rectangle (3.0,2.35);
  \draw[sti] (3.0,2.6) -- (3.05,2.2) -- (3.35,2.2) -- (3.4,2.6) -- cycle;
  \draw[ndiff] (3.4,2.6) rectangle (4.2,2.35);
  \node[font=\scriptsize] at (0.8,2.85) {C}; \node[font=\scriptsize] at (2.5,2.85) {E}; \node[font=\scriptsize] at (3.8,2.85) {B};
  \node[font=\scriptsize,align=center] at (2.4,0.45) {substrate PNP\\(collector = p-sub)};
  % n-well resistor
  \draw[nwell] (4.8,2.6) -- (4.8,1.5) to[out=-90,in=180] (5.1,1.2) -- (8.3,1.2) to[out=0,in=-90] (8.6,1.5) -- (8.6,2.6);
  \draw[ndiff] (5.0,2.6) rectangle (5.7,2.35); \draw[ndiff] (7.7,2.6) rectangle (8.4,2.35);
  \node[font=\scriptsize] at (6.7,2.85) {R$_1$ \hspace{1.2cm} R$_2$};
  \node[font=\scriptsize,align=center] at (6.7,0.6) {n-well resistor\\($\sim$1--2 k$\Omega/\square$)};
  % MOS cap
  \draw[nwell] (9.0,2.6) -- (9.0,1.5) to[out=-90,in=180] (9.3,1.2) -- (12.1,1.2) to[out=0,in=-90] (12.4,1.5) -- (12.4,2.6);
  \draw[ndiff] (9.2,2.6) rectangle (9.8,2.35); \draw[ndiff] (11.6,2.6) rectangle (12.2,2.35);
  \draw[very thick] (9.8,2.62) -- (11.6,2.62); \draw[poly] (9.8,2.63) rectangle (11.6,2.9);
  \node[font=\scriptsize,align=center] at (10.7,0.6) {gate-oxide capacitor\\(poly on n-well)};
  % poly resistor
  \draw[sti] (12.8,2.6) -- (12.85,2.1) -- (16.55,2.1) -- (16.6,2.6) -- cycle;
  \draw[poly] (13.0,2.6) rectangle (16.4,2.85);
  \draw[sil] (13.0,2.85) rectangle (13.6,2.92); \draw[sil] (15.8,2.85) rectangle (16.4,2.92);
  \node[font=\scriptsize,align=center] at (14.7,0.6) {silicide-blocked poly\\resistor on STI};
  \node[font=\scriptsize] at (14.7,3.15) {block};
\end{circuitikz}
\end{document}
```

| Device | Steps it uses | Owner note |
|---|---|---|
| NMOS / PMOS, natural (native) $V_t$ devices | full flow; natural = $V_t$-adjust blocked | [[MosFETs]] |
| Substrate (vertical) PNP | PSD emitter, n-well base, p-sub collector | [[BJTs#Substrate PNP in CMOS]] |
| Diodes (n+/p-sub, p+/n-well, well/sub) | S/D and well junctions | [[Diodes]] |
| Poly, NSD, PSD, n-well resistors | poly ± silicide block; S/D; well | [[Resistor]] |
| MOS / gate-oxide capacitor, varactor | gate oxide over well or channel | [[Capacitor#MOS Capacitors]] |
| MOM, MIM, poly-poly capacitors | metal stack; extra MIM or 2nd poly mask | [[Capacitor]] |
| Spiral inductor | thick top metal | [[Inductor]] |

- Digital-first processes give only the transistors; "analog" versions add high-value resistors, linear capacitors (second poly or MIM), thick top metal (Razavi §18.7.2, Carusone §2.1.10).
- The substrate PNP's collector is the substrate itself, so it always injects into the substrate and needs plenty of substrate contacts (Hastings §4.2.3).

> [!tip] Remark
> Every device in this table is junction-isolated or oxide-isolated by the rules of [[#Junction Isolation and Wells]]. Poly-on-STI devices are oxide-isolated, so they can sit at any voltage; anything in a well drags a well-to-substrate junction (capacitance, leakage, a diode) along with it.

### Interconnect Stack Numbers

| Layer (0.25 µm, 4-metal; Razavi Table 18.1) | Min width (µm) | Area cap to sub (aF/µm²) | Fringe cap, 2 sides (aF/µm) |
|---|---|---|---|
| Poly | 0.25 | 90 | 110 |
| Metal 1 | 0.35 | 30 | 80 |
| Metal 2 | 0.45 | 15 | 50 |
| Metal 3 | 0.50 | 9.0 | 40 |
| Metal 4 | 0.60 | 7.0 | 30 |

- Higher metals sit farther from the substrate (less cap per area) but have larger minimum widths, so the minimum capacitance per length barely improves going up (Razavi §18.7.3).
- Wire capacitance formulas are in [[Capacitor#Fringing]]; coupling between wires and shielding in [[Guard Rings, ESD and Interconnect]].

## Level 5: Process Extensions

### Twin Well and Deep N-Well

```tikz title="Triple well: a deep n-well implant about 2 um down, closed at the sides by a ring of ordinary n-well, encloses a p-well. The NMOS inside gets its own body terminal and is shielded from substrate noise. After Carusone Sec. 2.1.10 (items 1 and 15)."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (11,3.0);
  \draw[fill=cyan!30,draw=cyan!50!black] (1.5,0.7) rectangle (9.5,1.2);
  \draw[nwell] (1.5,3.0) rectangle (2.4,0.95); \draw[nwell] (8.6,3.0) rectangle (9.5,0.95);
  \draw[fill=orange!28,draw=black!50] (2.4,3.0) rectangle (8.6,1.2);
  \draw[ndiff] (1.65,3.0) rectangle (2.25,2.75); \draw[ndiff] (8.75,3.0) rectangle (9.35,2.75);
  \draw[pdiff] (2.7,3.0) rectangle (3.3,2.75);
  \draw[ndiff] (4.0,3.0) rectangle (5.0,2.75); \draw[ndiff] (5.8,3.0) rectangle (6.8,2.75);
  \draw[very thick] (5.0,3.02) -- (5.8,3.02); \draw[poly] (5.0,3.03) rectangle (5.8,3.3);
  \draw[pdiff] (0.4,3.0) rectangle (1.0,2.75);
  \node[font=\scriptsize] at (5.5,0.95) {deep n-well (buried)};
  \node[font=\scriptsize] at (5.5,1.8) {isolated p-well};
  \node[font=\scriptsize] at (5.4,3.55) {isolated NMOS};
  \node[font=\scriptsize] at (3.0,3.25) {body};
  \node[font=\scriptsize,align=center] at (1.95,3.3) {n-well\\ring};
  \node[font=\scriptsize] at (0.7,3.25) {sub};
  \node[font=\scriptsize] at (5.5,0.3) {p-substrate};
\end{circuitikz}
\end{document}
```

- **Twin well:** a separate p-well for NMOS lets both wells be doped optimally (Carusone §2.1.10).
- **Deep n-well:** a MeV implant about 2 µm below the surface, contacted by a regular n-well ring. It isolates a sensitive block from substrate noise in mixed-signal chips and gives NMOS a body that is not ground (Carusone §2.1.10). Analog BiCMOS gets the same isolated NMOS from NBL (Hastings §4.3.1).

> [!tip] Remark
> Using deep n-well and guard rings against coupled noise is the subject of [[Substrate Noise]] and [[Guard Rings, ESD and Interconnect]]; the isolated-body NMOS also removes body effect when you tie body to source ([[MosFETs#Body Effect]]).

### High Voltage from Standard Masks: Drain-Extended MOS

```tikz title="Drain-extended NMOS built only from standard masks: the n-well is a lightly doped drift region, the NSD plug in it is the drain, and the gate overlaps onto the well. A thick-oxide step (LOCOS beak or STI) under the gate edge relieves the field. After Hastings Fig. 4.34."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[psub] (0,0) rectangle (8,2.4);
  \draw[nwell] (4.0,2.4) -- (4.0,1.2) to[out=-90,in=180] (4.4,0.8) -- (7.2,0.8) to[out=0,in=-90] (7.6,1.2) -- (7.6,2.4);
  \draw[ndiff] (1.0,2.4) rectangle (2.4,2.15);
  \draw[sti] (4.7,2.4) -- (4.75,2.05) -- (5.75,2.05) -- (5.8,2.4) -- cycle;
  \draw[ndiff] (6.0,2.4) rectangle (7.2,2.15);
  \draw[very thick] (2.4,2.42) -- (4.7,2.42);
  \draw[poly] (2.4,2.43) -- (5.2,2.43) -- (5.2,2.7) -- (2.4,2.7) -- cycle;
  \node[font=\scriptsize] at (1.7,2.65) {S (NSD)}; \node[font=\scriptsize] at (6.6,2.65) {D (NSD)}; \node[font=\scriptsize] at (3.6,2.95) {G};
  \node[font=\scriptsize] at (5.8,1.3) {n-well drift region};
  \node[font=\scriptsize] at (5.25,1.85) {field relief};
  \node[font=\scriptsize] at (2.0,0.5) {p-epi = body};
\end{circuitikz}
\end{document}
```

- Asymmetric (source and drain not interchangeable), not self-aligned at the drain (large $C_{GD}$), more resistive, but needs no extra mask. In Hastings' 15 V process the well-based drain holds more than 40 V (§4.2.4).
- The gate oxide stays thin; only the oxide over the drift region near the drain is thickened, using the LOCOS bird's beak or an STI step (Hastings §4.2.4). Drain-extended PMOS uses the p-type channel stop as its drift region.

### Analog BiCMOS

```tikz title="Collector-diffused-isolation NPN in analog BiCMOS: the n-well is the collector, an n-buried layer (NBL) under it lowers collector resistance and a deep-N+ sinker reaches it from the surface; a dedicated base implant and an NSD emitter complete it. After Hastings Figs. 4.35, 4.37."
\usepackage{circuitikz}
\usetikzlibrary{patterns}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  nlight/.style={fill=green!20,draw=black!50},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60},
  pr/.style={fill=yellow!55,draw=black!60},
  imp/.style={->,thick},]
  \draw[fill=orange!35,draw=black!60] (0,0) rectangle (9,1.0);
  \draw[psub] (0,1.0) rectangle (9,3.0);
  \draw[nwell] (1.0,3.0) -- (1.0,1.6) to[out=-90,in=180] (1.4,1.25) -- (7.6,1.25) to[out=0,in=-90] (8.0,1.6) -- (8.0,3.0);
  \draw[fill=cyan!45,draw=black!60,rounded corners=4pt] (1.4,0.85) rectangle (7.6,1.35);
  \draw[fill=violet!30,draw=black!60] (1.8,3.0) -- (1.8,1.3) -- (2.8,1.3) -- (2.8,3.0);
  \draw[ndiff] (1.9,3.0) rectangle (2.7,2.75);
  \draw[fill=orange!40,draw=black!60] (3.8,3.0) -- (3.8,2.3) -- (7.2,2.3) -- (7.2,3.0);
  \draw[ndiff] (4.2,3.0) rectangle (5.2,2.75); \draw[pdiff] (6.0,3.0) rectangle (6.8,2.75);
  \node[font=\scriptsize] at (2.3,3.25) {C}; \node[font=\scriptsize] at (4.7,3.25) {E}; \node[font=\scriptsize] at (6.4,3.25) {B};
  \node[font=\scriptsize] at (5.5,2.05) {p base};
  \node[font=\scriptsize] at (2.3,2.0) {deep N+};
  \node[font=\scriptsize] at (4.5,1.1) {NBL};
  \node[font=\scriptsize] at (4.5,1.65) {n-well (collector)};
  \node[font=\scriptsize,anchor=west] at (9.1,2.2) {2nd p-epi};
  \node[font=\scriptsize,anchor=west] at (9.1,0.5) {1st p-epi / P+};
  \node[font=\scriptsize] at (4.5,0.4) {1st p-epi on P+ substrate};
\end{circuitikz}
\end{document}
```

- Analog BiCMOS = a poly-gate CMOS flow plus a few inserted masks: **NBL, deep-N+, base** for the NPN; one **DMOS** mask for LDMOS power transistors; often a second gate oxide. 25 to 30 masks and 50+ component types are typical (Hastings §4.3).
- Hastings' example (early 2000s): 160 Å / 5 V and 80 Å / 3.3 V gate oxides, LDMOS to 60 V, NBL, deep-N+, base, full silicide, W plugs, CMP, two Al metals: 18 masks baseline, 21 with 3.3 V devices, 25 with four metals.
- NBL needs a second epi (NBL directly on a P+ substrate would make a low-breakdown N+/P+ junction), antimony to limit autodoping, and etched alignment marks because CMP removes the NBL shadow (Hastings §4.3.2).
- Carusone §2.1.10 also lists strained silicon (SiGe stretches the lattice to raise electron mobility) and thin-film nichrome resistors as common additions.

> [!tip] Remark
> The NPN, lateral PNP and their layout are owned by [[BJTs#Layout]]. LDMOS and other high-voltage devices are not covered further in this series.

## Process Effects a Layout Must Respect

| Process effect | Where it comes from | What it forces in layout | Owner |
|---|---|---|---|
| Overlay error $\sigma_{tot}$ | each mask lands independently | enclosures, extensions (contact in active, select over active, poly past active) | [[Layout Fundamentals]] |
| Lateral diffusion / outdiffusion | anneal, well drive ($\approx0.8x_j$) | large well spacings; $L_{eff} < L_{drawn}$ | [[Layout Fundamentals]], [[MosFETs#Structure]] |
| Implant tilt (7 to 10°) | channeling avoidance | gate shadowing: matched devices in the same orientation | [[Device Matching]] |
| STI stress | trench fill vs silicon expansion | dummy fingers, equal diffusion extension | [[Device Matching]] |
| CMP dishing | polish of uneven density | dummy fill, density rules | [[Layout Fundamentals]] |
| Contact spiking, fixed contact size | Al-Si reaction; etch-rate vs size | arrays of minimum contacts | [[#Contacts Arrays of Small Squares]] |
| Silicide everywhere | salicide is the default | draw silicide block on resistors | [[Resistor]] |
| Junction isolation | p-sub / n-well diodes | substrate and well ties close to devices; bias rules | [[Failure Mechanisms]] |
| Parasitic field transistor | wires over field | thick-field voltage rating on high-voltage routing | [[#The Parasitic Field Transistor and Channel Stop]] |
| Hot carriers | high field at drain | LDD / drain-extended devices; operating vs blocking $V_{DS}$ | [[Failure Mechanisms]] |

## Design intuition / trade-offs

| Knob (process choice) | What improves | What it costs |
|---|---|---|
| STI instead of LOCOS | sub-0.5 µm devices, flat surface | more steps, STI stress on nearby devices |
| p- epi on p++ substrate | latch-up immunity, substrate noise, doping control | wafer cost |
| Implant instead of diffusion | dose and depth control, cold masking | equipment cost, lattice damage → anneal |
| Shorter λ / larger NA | resolution $\propto\lambda/NA$ | depth of focus $\propto\lambda/NA^2$ shrinks → CMP everywhere |
| LDD + spacers | higher operating $V_{DS}$, less hot-carrier drift | series resistance; longer apparent $L$ |
| Salicide | ~10× lower gate and S/D resistance, good contacts | needs a block mask for useful resistors |
| W plugs | stacked contacts/vias, sub-µm holes | fixed contact size, more steps |
| Copper damascene | ~35% lower R, ~10× EM life | barrier and cap layers, CMP dishing |
| More metal layers | density, routing | 2 masks per layer |
| Deep n-well / NBL | isolated NMOS, noise isolation | extra mask (and epi for NBL) |
| Silicide block / high-R poly mask | dense precise resistors | one mask each |
| Second gate oxide | thick-oxide high-voltage (I/O) devices beside thin core ones | extra masks |

## Cheat sheet

| Quantity | Result |
|---|---|
| One layer | one mask = coat → expose → develop → add/remove → strip |
| Oxide growth | Si consumed $\approx 0.45\,t_{ox}$ (volume ×2.2) |
| Lateral outdiffusion | $\approx 0.8\,x_j$ |
| Implant | dose $\propto I_{beam} t$; range ↑ with energy; tilt 7 to 10° |
| Lithography resolution | $R = k_1\lambda/NA$ |
| Depth of focus | $DOF = \pm k_2\lambda/NA^2$ |
| Overlay | $\sigma_{tot} = \sqrt{\sum\sigma_i^2}$; rule $> \sigma_{tot}$ |
| Isolation bias | $V_{p\text{-}sub} = $ most negative; $V_{n\text{-}well} \ge$ every PMOS terminal in it |
| Self-alignment | channel = POLY ∩ ACTIVE; $L_{eff} = L_{drawn} - 2L_D$ |
| Back-end cost | each extra metal level = 2 masks (via + metal) |
| Metal sheet resistance | ≈100 mΩ/□ lower metals, ≈30 mΩ/□ top metal (Razavi) |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** §2.1 to §2.7 (pp. 67–109: silicon manufacture, patterning, oxide growth and removal, LOCOS and Kooi effect, diffusion and ion implantation with Tables 2.2 and 2.3, epitaxy and poly, silicon etching and STI, junction and dielectric isolation, wafer bonding, aluminium, barrier metal, silicide, tungsten plugs, dielectrics and CMP, copper damascene); §4.2 (pp. 169–184: poly-gate CMOS essentials, 4/3 fabrication sequence Figs. 4.19–4.26, available devices and Table 4.4, layer derivations, LDD and drain-extended transistors); §4.3.1–4.3.2 (pp. 185–188: analog BiCMOS essentials, CDI NPN, LDMOS, mask counts, NBL and second epi). Assembly (§2.8) is left to [[Packaging]].
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** Ch. 18 (pp. 712–731): §18.1–18.6 unit steps, §18.7.1 transistor fabrication (Fig. 18.8), self-alignment (Fig. 18.9), silicide and spacers (Fig. 18.10), back end (Figs. 18.11, 18.12), §18.7.2 passive devices (used only for the device table), §18.7.3 interconnect Table 18.1. §18.8 latch-up is left to [[Guard Rings, ESD and Interconnect#Latch-up]].
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** §2.1 (pp. 73–86): wafer, photolithography and well definition, diffusion and implantation, CVD and active regions, LOCOS and STI, gate oxide and $V_t$ adjust, poly gate, junctions and contacts, metal and overglass, the list of additional processing steps.
- **ECE 331 (Waterloo) Module 1, Process Integration Overview:** simple nMOS process flow (4 lithography steps, 14 process steps). **Module 2, Photolithography:** resist process flow, exposure systems, resolution $R = k_1\lambda/NA$, depth of focus, KrF worked example, immersion, overlay error and total overlay tolerance, EUV.
