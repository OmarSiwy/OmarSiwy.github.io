---
title: Electromigration
description: Why metal wires wear out under current (electron wind, voids, hillocks, thermo- and stress migration), how Black's equation turns a lifetime and temperature target into a current-density limit, and how that limit becomes wire widths, via arrays and a verification flow, priced back into circuit R and C.
kind: topic
status: growing
aliases:
  - Electromigration
  - EM
  - Electromigration-Aware Design
---

A metal wire carrying DC current slowly moves its own atoms downstream. Where more atoms leave a spot than arrive, a void opens and the wire eventually breaks; where they pile up, a hillock grows and can short to a neighbour. This note goes from the black box (a current-density limit per layer) to the lifetime model behind it (Black's equation), then the physics (electron wind, thermo- and stress migration), the layout geometry that helps or hurts (Blech length, vias, corners, reservoirs, slotting), EM-aware analog sizing with a worked example, and finally the verification flow. Interconnect rules in general (spacing, shielding, routing practice) live in [[Guard Rings, ESD and Interconnect]].

## The big picture

```tikz title="Electromigration on one screen: electrons push metal atoms downstream. Atoms leave the cathode end faster than they are replaced (void, open circuit) and pile up at the anode end (hillock, short to the neighbour). Top view and side view of the same M1 segment between two vias. After Lienig & Thiele Figs. 2.1-2.3 and Hastings Sec. 5.1.3. Layer colours: legend of CMOS Processing."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  cont/.style={fill=black,draw=none},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60}]
  % ---------- top view ----------
  \node[anchor=west,font=\bfseries] at (-0.8,6.3) {Top view};
  \draw[mone] (1.4,5.0) rectangle (8.6,5.6);
  \node[font=\scriptsize,white] at (5.0,5.3) {neighbour M1 (other net)};
  \draw[mone] (0,3.6) rectangle (10,4.4);
  \draw[mtwo] (-0.7,2.9) rectangle (0.8,4.6);
  \draw[mtwo] (9.2,2.9) rectangle (10.7,4.6);
  \draw[cont] (-0.15,3.75) rectangle (0.45,4.25);
  \draw[cont] (9.55,3.75) rectangle (10.15,4.25);
  % void at cathode end (left), hillock at anode end (right)
  \filldraw[fill=white,draw=black!80] (0.85,4.4) -- (0.85,3.95) .. controls (1.05,3.7) and (1.45,3.75) .. (1.6,4.05) -- (1.75,4.4) -- cycle;
  \draw[mone] (8.0,4.4) -- (8.15,4.75) -- (8.35,4.7) -- (8.5,4.92) -- (8.75,4.4) -- cycle;
  \foreach \x in {2.3,3.9,5.5,7.1} {\draw[->,thick] (\x,3.82) -- (\x+1.0,3.82);}
  \node[font=\scriptsize] at (4.55,4.17) {$e^-$ (electron wind): atoms drift this way};
  \draw[->,thick,red!70!black] (6.5,3.2) -- (3.5,3.2) node[midway,below,font=\scriptsize] {conventional current $I$};
  \node[font=\scriptsize,align=center] at (1.3,2.55) {cathode ($-$):\\ void};
  \node[font=\scriptsize,align=center] at (8.4,2.55) {anode ($+$):\\ hillock};
  \draw[->] (1.25,2.85) -- (1.25,3.75);
  \draw[->] (8.45,2.85) -- (8.45,4.5);
  \node[font=\scriptsize,anchor=west,red!60!black] at (8.85,4.95) {short risk};
  % ---------- side view ----------
  \node[anchor=west,font=\bfseries] at (-0.8,1.6) {Side view};
  \draw[diel] (-0.9,-2.0) rectangle (10.9,1.2);
  \draw[mone] (0,-0.9) rectangle (10,-0.35);
  \draw[nit] (0,-0.35) rectangle (10,-0.25);
  \draw[cont] (-0.1,-0.25) rectangle (0.4,0.55);
  \draw[cont] (9.6,-0.25) rectangle (10.1,0.55);
  \draw[mtwo] (-0.8,0.55) rectangle (1.0,1.05);
  \draw[mtwo] (9.0,0.55) rectangle (10.8,1.05);
  \filldraw[fill=white,draw=black!80] (0.45,-0.35) .. controls (0.6,-0.75) and (1.3,-0.8) .. (1.5,-0.35) -- cycle;
  \draw[mone] (8.1,-0.25) .. controls (8.3,0.2) and (8.6,0.25) .. (8.8,-0.25) -- cycle;
  \foreach \x in {2.3,3.9,5.5,7.1} {\draw[->,thick,white] (\x,-0.62) -- (\x+1.0,-0.62);}
  \node[font=\scriptsize,anchor=north,align=center] at (1.0,-0.95) {void at the via:\\ barrier blocks resupply};
  \node[font=\scriptsize,anchor=north,align=center] at (8.45,-0.95) {extrusion through\\ the cap};
  \node[font=\scriptsize] at (5.0,-1.75) {M1 segment, length $L$, width $W$, thickness $t$};
  % ---------- legend ----------
  \node[anchor=west,font=\bfseries\scriptsize] at (11.4,6.3) {Legend (as CMOS Processing)};
  \foreach \y/\s/\t in {5.8/mone/{metal 1},5.35/mtwo/{metal 2},4.9/cont/{contact / via},4.45/diel/{dielectric (IMD)},4.0/nit/{nitride (Cu cap)}} {
    \draw[\s] (11.5,\y-0.15) rectangle (12.0,\y+0.15);
    \node[anchor=west,font=\scriptsize] at (12.1,\y) {\t};
  }
  \filldraw[fill=white,draw=black!80] (11.5,3.4) rectangle (12.0,3.7);
  \node[anchor=west,font=\scriptsize] at (12.1,3.55) {void (missing metal)};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **It is a current-density limit, per layer:** $J = I/(Wt) \le J_{max}(T)$, so $W_{min} = I/(J_{max}\,t)$. Rule of thumb ≈ 2 mA per µm of width for lower Al metal (Razavi); Al-Cu rules are often $5\times10^5$ A/cm² at 105 °C (Hastings).
> 2. **Black's equation:** $t_{50} = \dfrac{A}{J^n}\,e^{E_a/kT}$, with $n\approx 2$ (void nucleation, Al) to $n\approx 1$ (void growth, Cu) and $E_a \approx 0.7$ eV (Al), 0.8–0.9 eV (Cu). Lifetime is steep in both $J$ and $T$: 105 → 125 °C cuts the allowed Al current to 58%.
> 3. **Damage happens at flux divergences, not in the uniform wire:** vias, contacts, ends, bends, width changes, hot spots. The via is usually the weak point.
> 4. **DC is the enemy; AC heals.** Size power and bias nets on average (or RMS) DC current; bidirectional current above ~10 kHz rarely fails by EM. RMS current also sets Joule heating; peak/ESD currents follow a separate fusing rule.
> 5. **Geometry can buy margin:** short segments ($jL$ below the Blech product) are immortal; via arrays must sit across the current flow, not in line with it; avoid 90° corners; contact a critical segment from below. Every micron of extra width costs area and capacitance, and saves resistance.

**Map:** [[#Spec translation|currents + lifetime → width, vias → R, C]] → [[#Level 0 A Current-Density Limit|the limit and current types]] → [[#Level 1 Black's Equation and Lifetime|Black, temperature, mission, AC]] → [[#Level 2 The Physics of Migration|electron wind, voids, TM, SM]] → [[#Level 3 Geometry That Helps or Hurts|Blech, vias, reservoirs, corners, slotting]] → [[#Level 4 EM-Aware Analog Sizing|bias, power, output stages, worked example]] → [[#Level 5 Verification Flow|segment currents, mission profiles, checking]].

## Spec translation

Electromigration is not a block with specs of its own; it converts **circuit currents and a reliability target** into **minimum metal geometry**, and that geometry hands **parasitics** back to the circuit.

```tikz title="Spec translation for interconnect: circuit currents and the mission (lifetime, temperature, failure budget) set a current-density limit per layer; the limit sets wire width and via count; the geometry sets R and C that come back into the amplifier specs. After Lienig & Thiele Figs. 3.2, 3.11 and Eqs. 3.21-3.25."
\usepackage{circuitikz}
\usetikzlibrary{positioning}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  box/.style={draw,rounded corners=2pt,align=center,minimum height=1.0cm,text width=3.1cm,font=\scriptsize}]
  \node[box,fill=yellow!15] (cur) at (0,2.2) {\textbf{Circuit currents}\\ $I_{avg}$, $I_{rms}$, $I_{peak}$, duty $D$, $f$\\ (simulation, per mode)};
  \node[box,fill=yellow!15] (mis) at (0,0) {\textbf{Mission}\\ lifetime $t_{life}$, $T$ profile,\\ failure quantile $q$};
  \node[box,fill=green!10] (lim) at (4.4,1.1) {\textbf{Limit per layer}\\ $j_{eff}(T)$, $j_{peak}$\\ via current $i_{via}(T)$};
  \node[box,fill=blue!10] (geo) at (8.8,1.1) {\textbf{Geometry}\\ $W \ge I/(j_{eff}t)$\\ $n_{via}\ge I/i_{via}$\\ short segments, no 90° bends};
  \node[box,fill=red!10] (par) at (8.8,-1.6) {\textbf{Parasitics}\\ $R = R_\square L/W$\\ $C = c_a W L + c_f L$};
  \node[box,fill=red!10] (amp) at (4.4,-1.6) {\textbf{Back to the circuit}\\ IR drop, $G_m$ degeneration,\\ extra pole, matching};
  \draw[->,thick] (cur) -- (lim);
  \draw[->,thick] (mis) -- (lim);
  \draw[->,thick] (lim) -- (geo);
  \draw[->,thick] (geo) -- (par);
  \draw[->,thick] (par) -- (amp);
  \draw[->,thick,dashed] (amp.south) -- ++(0,-0.4) -| (-2.3,2.2) -- (cur.west);
  \node[font=\scriptsize,align=center,anchor=north] at (0,-1.6) {re-simulate\\ with layout};
\end{circuitikz}
\end{document}
```

| Circuit / mission quantity | Interconnect quantity it sets | Where it lands |
|---|---|---|
| DC bias or supply current $I_{avg}$, lifetime, $T_j$ | $J_{avg} \le j_{eff}(T)$ | minimum width $W$, via count |
| RMS current | Joule heating $\Delta T$ of the wire | minimum width (often binding on thick top metal) |
| Peak / ESD current | adiabatic temperature rise (fusing) | width of ESD and pulse paths, see [[Guard Rings, ESD and Interconnect]] |
| Duty cycle, frequency | equivalent DC current (self-healing) | relief for pulsed and AC nets |
| IR-drop budget $\Delta V$ | $R = R_\square L/W$ | width of long buses (usually wider than EM needs) |
| $G_m$, UGF of a stage | series $R$ in source/drain wires | width of R-sensitive nets |
| Bandwidth / pole of a node | wire $C$ | keep RC-sensitive nets near minimum width |
| Matching of a pair | equal $R$, $C$ on both sides | identical widths on symmetric nets |

$$
\boxed{W \ge \max\!\left(\frac{I_{eq}}{j_{eff}(T)\,t},\ \frac{I_{peak}}{j_{peak}\,t},\ W_{min,process}\right)} \qquad \boxed{n_{via} \ge \left\lceil \frac{I_{eq}}{i_{via}(T_{ref})}\, f(T)\, g \right\rceil}
$$

$I_{eq}$ is the equivalent (average or RMS) current, $f(T)$ the temperature factor from Black's equation and $g \ge 1$ the current-crowding factor of the via array (Lienig & Thiele Eqs. 3.21–3.26). The [[#Worked example a bias bus and an output-stage lead|worked example]] walks through one wire with numbers.

> [!tip] Remark
> The other half of the trade is in the amplifier: a wire in the source of a transistor is source degeneration, $G_m = g_m/(1+g_m R)$ ([[Single-Stage#Source Degeneration]]), and wire capacitance adds to the node capacitance that sets each pole ([[Capacitor#Fringing]]).

## Level 0: A Current-Density Limit

### Current density and the per-layer rule

```tikz title="The black box: a wire of drawn width W and process thickness t carries I; the density J = I/(Wt) must stay below the layer's limit. Because t is fixed per layer, rules are often quoted as current per micron of width. After Lienig & Thiele Eq. 1.1 and Hastings Eq. 15.24."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40}]
  % 3D-ish wire
  \draw[mone] (0,0) -- (6,0) -- (6.8,0.6) -- (0.8,0.6) -- cycle;
  \draw[mone] (6,0) -- (6.8,0.6) -- (6.8,0.0) -- (6,-0.6) -- cycle;
  \draw[mone] (0,0) rectangle (6,-0.6);
  \draw[<->] (0,-0.9) -- (6,-0.9) node[midway,below,font=\scriptsize] {length $L$};
  \draw[<->] (7.0,0.0) -- (7.0,-0.6) node[midway,right,font=\scriptsize] {$t$ (fixed by process)};
  \draw[<->] (6.1,-0.75) -- (6.9,-0.15);
  \node[font=\scriptsize,anchor=west] at (6.95,-0.95) {$W$ (drawn)};
  \draw[->,very thick,red!70!black] (-1.4,-0.3) -- (-0.1,-0.3) node[midway,above,font=\scriptsize] {$I$};
  \node[font=\scriptsize,align=left,anchor=west] at (0.4,1.4) {$J = \dfrac{I}{W t} \le J_{max}(T)$ \quad $\Rightarrow$ \quad $W_{min} = \dfrac{I}{J_{max}\,t}$};
  % rule-of-thumb box
  \node[draw,rounded corners=2pt,align=left,font=\scriptsize,anchor=north west,fill=yellow!10] at (9.2,1.6) {Typical numbers\\[2pt] Al-Cu: $5\times10^5$ A/cm$^2$ at 105 °C\\ \quad $t=1$ µm $\Rightarrow$ 5 mA/µm (Hastings)\\ lower Al metal: $\approx$ 2 mA/µm (Razavi)\\ early Al failures: above $\sim10^5$ A/cm$^2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{J = \frac{I}{W t},\qquad W_{min} = \frac{I_{max}}{J_{max}\, t_{min}}}
$$

- Use the **minimum** metal thickness $t_{min}$ of the layer, and only the Al or Cu thickness: barrier metals (TiW, TaN) carry almost no current (Hastings Eq. 5.12).
- Example (Hastings Sec. 15.3.4): 50 mA in 1 µm (10 kÅ) Al-Cu at $5\times10^5$ A/cm² needs $W \ge 10$ µm.
- A lead must meet the rule **at every point**: necking a wide lead down to pass an obstruction is not allowed, even though a short narrow section barely changes its resistance (Hastings Sec. 15.3.4).

> [!note]- Detail: where the standard numbers come from
> The best-known value, $5\times10^5$ A/cm² from MIL-M-38510 (1991), is specified for "aluminum, pure or doped" over the "worst-case specified operating conditions"; it is unclear which temperature was intended (some assume 85 °C, others 105 °C). In practice it is taken as representative of copper-doped aluminum under compressive nitride at 105 °C (Hastings Sec. 15.3.4). Razavi's 2 mA/µm (Sec. 18.7.3) is a rule of thumb that "varies according to the thickness of the metal", with transient peaks allowed to be "quite a lot higher". Always use the PDK's per-layer table; the numbers here are for orientation.

> [!tip] Remark
> The limits shrink with every node: the ITRS data in Lienig & Thiele Ch. 1 show the *permissible* density halving about every 3 years while the *required* density doubles about every 8. That is why EM moved from a power-bus problem to a signal-wire problem in digital, and why analog nets (bias and power currents of the same order) have long been EM-aware.

### Three current types: average, RMS and peak

```tikz title="The same wire sees different 'currents'. Average current (directed flux) drives EM in nets that switch faster than ~1 Hz, RMS sets Joule heating and is the conservative choice for DC-like analog nets, peak sets short-pulse (ESD) fusing. After Lienig & Thiele Sec. 3.3.1 and Hastings Eq. 5.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \foreach \ox/\ttl in {0/{DC (bias, supply)},5.8/{pulsed, unidirectional ($D=0.25$)},12.0/{bidirectional (AC)}} {
    \draw[->] (\ox,0) -- (\ox+4.4,0) node[right,font=\scriptsize] {$t$};
    \draw[->] (\ox,-1.4) -- (\ox,2.2) node[above,font=\scriptsize] {$i$};
    \node[font=\scriptsize\bfseries] at (\ox+2.1,2.6) {\ttl};
  }
  % DC
  \draw[very thick,blue!70!black] (0,1.2) -- (4.2,1.2);
  \node[font=\scriptsize,align=left,anchor=north west] at (0.1,-0.2) {$I_{avg}=I_{rms}=I_{peak}$\\ no self-healing};
  % pulsed
  \draw[very thick,blue!70!black] (5.8,0) -- (5.8,1.8) -- (6.15,1.8) -- (6.15,0) -- (7.2,0) -- (7.2,1.8) -- (7.55,1.8) -- (7.55,0) -- (8.6,0) -- (8.6,1.8) -- (8.95,1.8) -- (8.95,0) -- (10.0,0);
  \draw[dashed,red!70!black] (5.8,0.45) -- (10.0,0.45) node[right,font=\scriptsize] {$I_{avg}=D\,I_p$};
  \draw[dashed,green!40!black] (5.8,0.9) -- (10.0,0.9) node[right,font=\scriptsize] {$I_{rms}=\sqrt{D}\,I_p$};
  \node[font=\scriptsize,anchor=south west] at (6.15,1.6) {$I_p$};
  \draw[<->] (5.8,-0.3) -- (6.15,-0.3) node[midway,below,font=\scriptsize] {$DT$};
  \draw[<->] (5.8,-0.95) -- (7.2,-0.95) node[midway,below,font=\scriptsize] {$T$};
  % AC
  \draw[very thick,blue!70!black,domain=0:4.2,samples=80] plot ({12.0+\x},{1.3*sin(\x*171.9)});
  \node[font=\scriptsize,align=left,anchor=north west] at (12.1,-1.45) {$I_{avg}\approx 0$: flux reverses\\ $I_{rms}$ still heats};
\end{circuitikz}
\end{document}
```

| Current type | Use it for (Lienig & Thiele Sec. 3.3.1) | Why |
|---|---|---|
| **Average** | nets switching above ~1 Hz: digital and analog signal nets; Black's-law lifetime | counts the net directed flux, so it includes self-healing |
| **RMS** | below ~1 Hz, analog DC nets, reliability-critical nets, long pulses | conservative: ignores self-healing and includes Joule heating |
| **Peak** | single events: ESD, short power-stage pulses | different damage mechanism (electrical overstress, fusing) |

**Size every segment for all three and take the widest** (most vias) for the given layer and temperature.

> [!tip] Remark
> Peak and ESD sizing is an adiabatic heating problem, not EM. Hastings notes that "20X" or "40X the EM width" rules for ESD paths "have little justification" because fusing and EM are different mechanisms; the proper rule limits the adiabatic temperature rise, and it lives in [[Guard Rings, ESD and Interconnect]].

## Level 1: Black's Equation and Lifetime

### Black's equation

```tikz title="Black's equation on log axes: median life falls as J^-n (slope -1 for void-growth-limited failure, -2 for nucleation-limited) and drops further at higher temperature through exp(Ea/kT). Sketch after Hastings Eq. 5.10 and Lienig & Thiele Eq. 2.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw[->] (0,0) -- (7.4,0) node[right,font=\scriptsize] {$\log J$};
  \draw[->] (0,0) -- (0,5.2) node[above,font=\scriptsize] {$\log t_{50}$};
  \draw[very thick,blue!70!black] (0.6,4.6) -- (6.6,1.6) node[right,font=\scriptsize] {$n=1$, $T_1$};
  \draw[very thick,blue!70!black,dashed] (0.6,3.4) -- (6.6,0.4) node[right,font=\scriptsize] {$n=1$, $T_2>T_1$};
  \draw[very thick,red!70!black] (3.0,4.9) node[above,font=\scriptsize] {$n=2$, $T_1$} -- (5.2,0.5);
  \draw[<->,thick] (1.2,4.3) -- (1.2,3.1);
  \node[font=\scriptsize,anchor=north west,align=left] at (0.2,2.9) {shift $\propto \frac{E_a}{k}\left(\frac1{T_1}-\frac1{T_2}\right)$};
  \draw (5.6,2.1) -- (6.4,2.1) -- (6.4,1.7);
  \node[font=\scriptsize,anchor=west] at (6.45,2.0) {slope $-1$};
  \draw (3.4,4.1) -- (3.8,4.1) -- (3.8,3.3);
  \node[font=\scriptsize,anchor=west] at (3.85,3.8) {slope $-2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{t_{50} = \frac{A}{J^{\,n}}\exp\!\left(\frac{E_a}{kT}\right)}
$$

$t_{50}$ (MTF, median time to failure) is when half the wires have failed; $A$ is a cross-section-dependent constant from characterization; $k = 8.62\times10^{-5}$ eV/K.

| Metal system | $E_a$ | $n$ | Dominant path |
|---|---|---|---|
| Pure Al | ≈0.5 eV (Hastings) | 2 | grain boundaries |
| Al-Cu (0.5% Cu) | ≈0.7 eV (Hastings, Lienig) | ≈2 (nucleation) | grain boundaries |
| Cu damascene | 0.8 eV (Hastings), 0.9 eV (Lienig) | 1.1–1.3 (growth) | top surface / cap interface |
| High-tin solder | ≈0.5 eV | | bulk (low melting point) |

- **$n = 2$**: void *nucleation* limits life (Black's original fit, most Al). **$n = 1$**: void *growth* limits life (Al with barrier metal and W vias, most Cu). **$n > 2$** hints that thermal gradients are accelerating EM (Hastings Sec. 5.1.3).
- Lifetime targets scale with $J$ as $t_{50} \propto J^{-n}$, so **doubling a lifetime target costs a factor $2^{1/n}$ in current** (√2 for Al, 2 for Cu).
- Black's equation is for a **straight, uniform line**. It does not cover bends, layer changes, material transitions or mechanical boundary conditions, so its $A$ and $E_a$ cannot be compared across technologies (Lienig & Thiele Sec. 2.2).

> [!note]- Detail: why the exponent and the activation energy matter for Cu vs Al
> Cu carries at least 5× the current of Al for the same EM life at 105 °C. But Cu's smaller exponent ($n\approx1$) makes its advantage shrink with temperature: the two reach parity around 175 °C and above that Al can be better (Hastings Secs. 5.1.3, 15.3.4). The low exponent comes from Cu's weak top surface, which is hard to passivate after CMP. Lienig & Thiele give Cu's lowest $E_a$ as 0.9 eV with $n = 1.1$–1.3 depending on the failure mode.

### Temperature derating

```tikz title="Allowed current density relative to its value at 105 C, for a constant lifetime (Black's equation with the Ea and n shown). The Al-Cu curve reproduces Hastings' 0.58 derating at 125 C; above ~150 C the allowed density is a fraction of the 105 C rule. After Hastings Eq. 15.25 and Lienig & Thiele Fig. 2.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,x=1cm,y=1.6cm]
  % x: (T-25)*0.05 cm, y: log10 ratio (1.6 cm per decade)
  \draw[->] (0,-1.7) -- (8.0,-1.7) node[right,font=\scriptsize] {$T$ (°C)};
  \draw[->] (0,-1.7) -- (0,3.0) node[above,font=\scriptsize] {$J_{max}(T)/J_{max}(105\,^\circ\mathrm{C})$};
  \foreach \t in {25,50,75,105,125,150,175} {\draw ({(\t-25)*0.05},-1.7) -- ({(\t-25)*0.05},-1.75) node[below,font=\scriptsize] {\t};}
  \foreach \d/\l in {-1/0.1,0/1,1/10,2/100} {\draw (0,\d) -- (-0.08,\d) node[left,font=\scriptsize] {\l}; \draw[gray!30] (0,\d) -- (7.6,\d);}
  \fill[gray!15] ({(125-25)*0.05},-1.7) rectangle ({(175-25)*0.05},2.9);
  \node[font=\scriptsize,align=center] at (6.3,2.5) {automotive\\ (up to 175 °C)};
  \draw[very thick,red!70!black,domain=25:175,samples=60] plot ({(\x-25)*0.05},{4.6648*(105-\x)/(\x+273)});
  \draw[very thick,blue!70!black,domain=25:175,samples=60] plot ({(\x-25)*0.05},{10.0*(105-\x)/(\x+273)});
  \node[font=\scriptsize,red!70!black,anchor=west] at (0.3,1.55) {Al-Cu: $E_a=0.7$ eV, $n=2$};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (1.6,2.6) {Cu: $E_a=0.9$ eV, $n=1.2$};
  \fill[red!70!black] (5.0,-0.2345) circle (0.06);
  \draw[->] (3.2,-0.55) -- (4.92,-0.27);
  \node[font=\scriptsize,anchor=east] at (3.2,-0.55) {0.58 at 125 °C};
  \draw[dashed] ({(105-25)*0.05},-1.7) -- ({(105-25)*0.05},0);
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{J_{max}(T_j)}{J_{max}(T_0)} = \exp\!\left[\frac{E_a}{n k}\left(\frac{1}{T_j}-\frac{1}{T_0}\right)\right]}
$$

- Hastings' example: $E_a = 0.7$ eV, $n=2$, 105 → 125 °C gives 0.58: **a lead good for 25 mA at 105 °C carries only 15 mA at 125 °C.**
- Lienig & Thiele, for Cu: +10 K requires cutting the current by more than 50% for the same MTF; −5 K allows about +25%.
- Use the **wire** temperature: junction temperature of nearby devices plus the wire's own Joule heating.

> [!note]- Derivation: derating from Black's equation
> Hold $t_{50}$ fixed at two temperatures: $J_0^{-n}e^{E_a/kT_0} = J_j^{-n}e^{E_a/kT_j}$. Take logs: $n\ln(J_j/J_0) = \frac{E_a}{k}\left(\frac1{T_j}-\frac1{T_0}\right)$. Divide by $n$ and exponentiate. With 0.7 eV, $n=2$: $E_a/(nk) = 4060$ K; $1/398 - 1/378 = -1.33\times10^{-4}$ K⁻¹; product $-0.54$; $e^{-0.54} = 0.58$.

### Joule heating

$$
\boxed{\Delta T = \frac{I^2\, t_{ox}\, R_s}{\kappa\, W^2}} \qquad \boxed{W_{min} = I_{max}\sqrt{\frac{t_{ox}R_s}{\kappa\,\Delta T}}}
$$

Temperature rise of a metal (or poly, thin-film) line of sheet resistance $R_s$ on oxide of thickness $t_{ox}$, $\kappa_{ox} \approx 0.011$ W/(cm·°C) (Hastings Eqs. 5.7–5.8).

- Designers allow only **ΔT ≈ 5 °C** so the gradient does not invalidate EM numbers in nearby metal; at most 50 °C to limit thermal stress (Hastings Sec. 5.1.1). Use the **RMS** current here.
- Joule heating limits most in **top metal layers**, which are thick (high current) but far from the substrate heat sink (Lienig & Thiele Sec. 3.3.1).
- Pulses shorter than ~1 µs are adiabatic: the limit becomes energy, not power (the ESD regime).

> [!tip] Remark
> The same self-heating formula sizes poly and thin-film resistors, which do not electromigrate: [[Resistor]]. Heat from transistors also flows into the metal above them, which is why a bias line routed over a power device must be derated to the hot spot's temperature.

### From one wire to a whole chip: MTF, quantiles, FIT and mission profiles

```tikz title="Scaling a characterization result to a product rule. Characterization runs hot and at high J (left curve); the temperature, lifetime and failure-quantile factors shift it to the reference rule a designer uses, then the mission profile maps it to the effective limit. After Lienig & Thiele Figs. 3.11-3.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw[->] (0,0) -- (9.4,0) node[right,font=\scriptsize] {$\log t$};
  \draw[->] (0,0) -- (0,4.6);
  \node[font=\scriptsize,rotate=90] at (-1.35,2.3) {cumulative failures $F$ (lognormal)};
  \fill (5.72,0.5) circle (0.06);
  \draw[dotted] (5.72,0.5) -- (5.72,0) node[below,font=\scriptsize] {$t_{life,ref}$};
  \foreach \y/\l in {0.5/0.01\%,1.6/1\%,2.6/50\%,4.0/99.99\%} {\draw (0,\y) -- (-0.08,\y) node[left,font=\scriptsize] {\l};}
  \draw[very thick,green!50!black] (0.6,0.3) -- (3.0,4.3) node[above,font=\scriptsize,align=center] {characterization\\ ($>$200 °C, high $J$)};
  \draw[very thick,blue!70!black,dashed] (3.4,0.3) -- (5.8,4.3) node[above,font=\scriptsize] {at $T_{ref}$};
  \draw[very thick,red!70!black] (5.6,0.3) -- (8.0,4.3) node[above,font=\scriptsize] {+ lifetime, quantile};
  \draw[->,thick] (2.25,2.6) -- (4.6,2.6) node[midway,above,font=\scriptsize] {$AF_T$};
  \draw[->,thick] (5.2,2.6) -- (6.8,2.6) node[midway,above,font=\scriptsize] {$AF_{TF}$};
  \draw[dashed] (0,0.5) -- (9.0,0.5);
  \node[font=\scriptsize,anchor=west] at (6.2,0.75) {$q_{eff}\approx 1/m$ ($m$ segments)};
  \draw[->,thick] (6.65,1.6) -- (5.95,0.55) node[pos=0.2,right,font=\scriptsize] {$AF_q$};
\end{circuitikz}
\end{document}
```

- **Lifetime target:** typically $t_{life,ref}$ = 10 years of constant operation at $T_{ref}$ (e.g. 105 °C). For 15 years, $AF_{TF} = 1.5$ (Lienig & Thiele Sec. 3.4.2). Hastings' operating-life convention is 100,000 h (11.4 years) at the rated maximum junction temperature.
- **Failure quantile, not median:** one dead wire kills the chip, so the rule is set at the time a small fraction $q$ fails. With $m$ segments on the chip, $q_{eff} \approx 1/m$. The factor $AF_q$ uses the lognormal spread $\sigma$ from characterization and a confidence factor $1 < S_1 \le 10$.
- **Mission profile:** real chips spend time at several temperatures. Collapse the profile into one effective temperature per layer (fold below), and take the hottest layer's value.
- **FIT** (failures in time) counts failures per $10^9$ device-hours; it is the unit reliability budgets are written in. The EM share of a FIT budget is what sets $q$.

$$
j_{ref} = \frac{j_{char}(T_{char})}{AF_T\cdot AF_q\cdot AF_{TF}}, \qquad AF_T = \exp\!\left[\frac{E_a}{nk}\left(\frac{1}{T_{ref}}-\frac{1}{T_{char}}\right)\right]
$$

(Lienig & Thiele Eqs. 3.11, 3.13: the reference rule is the characterization result scaled by a temperature, a quantile and a lifetime factor. The designer receives $j_{ref}$; the mission profile then maps it to $j_{eff}$.)

> [!note]- Detail: the scaling factors and the effective temperature (Lienig & Thiele Eqs. 3.10–3.20)
> - Target: $t_{life,ref} = AF_{TF}\cdot AF_T\cdot AF_q\cdot t_{50,char}$.
> - Quantile factor: $AF_q(0.5, q_{ref}) = S_1/\exp[\mathrm{norminv}(q_{ref})\,\sigma]$, $\sigma$ the lognormal standard deviation, $S_1$ the confidence factor for having characterized only a few hundred structures.
> - Mission profile with states $s$ (duration $t_{life,s}$ at temperature $T_s$): accumulated EM life $t_{life,eff} = \sum_s t_{life,s}\exp\!\left[-\frac{E_a}{nk}\left(\frac1{T_{ref}}-\frac1{T_s}\right)\right]$, and the effective temperature follows from $\frac{1}{T_{eff}} = \frac{1}{T_{ref}} - \frac{k}{E_a}\ln\frac{t_{life,eff}}{t_{life,ref}}$.
> - Effective limit: $j_{eff}(T_{eff}, q_{eff}) = j_{ref}(T_{ref})/[AF_T(T_{ref},T_{eff})\,AF_q(q_{ref},q_{eff})\,AF_{TF}]$.
> - Because the rules depend on the mission, **reusing a verified layout in a new application (new temperature profile or durations) requires re-verifying current densities**, even though no polygon changed.
>
> Note that Lienig & Thiele divide $j$ by $AF_{TF}$ directly; from Black's equation alone a lifetime factor $AF_{TF}$ would scale $j$ by $AF_{TF}^{-1/n}$. Use the foundry's convention.

> [!tip] Remark
> Hastings makes the same point for power devices: without a usage profile you must assume maximum current at maximum temperature for the whole life, which "often grossly exaggerates the required metal widths"; a proper profile can turn an impossible layout into a straightforward one (Sec. 13.1.4).

### AC, pulsed current and self-healing

```tikz title="Lifetime under alternating current relative to DC versus frequency. Reversing current pushes atoms back (self-healing), so life rises through the Hz-kHz range and plateaus; in the THz range the skin effect crowds current to the surface. Thermal migration (RMS heating) still limits the plateau. Qualitative, after Lienig & Thiele Figs. 2.13 and 4.30."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw[->] (0,0) -- (10.2,0) node[right,font=\scriptsize] {$f$ (Hz)};
  \draw[->] (0,0) -- (0,4.2) node[above,font=\scriptsize] {MTF(AC)/MTF(DC)};
  \foreach \e/\x in {0/0.4,3/2.6,6/4.8,9/7.0,12/9.2} {\draw (\x,0) -- (\x,-0.08) node[below,font=\scriptsize] {$10^{\e}$};}
  \foreach \v/\y in {1/0.3,10/1.3,100/2.3,1000/3.3} {\draw (0,\y) -- (-0.08,\y) node[left,font=\scriptsize] {\v};}
  \draw[very thick,blue!70!black] (0.2,0.3) .. controls (1.4,0.3) and (2.0,3.0) .. (3.2,3.1) -- (8.6,3.1) .. controls (9.1,3.1) and (9.3,2.3) .. (9.9,1.6);
  \node[font=\scriptsize,align=center] at (1.6,3.6) {self-healing\\ rises (kHz)};
  \node[font=\scriptsize,align=center] at (5.4,3.6) {plateau: today's signal\\ and clock frequencies};
  \node[font=\scriptsize,align=center] at (10.3,2.4) {skin effect\\ (THz)};
  \fill[red!15] (0.2,0) rectangle (0.9,0.25);
  \node[font=\scriptsize,anchor=west] at (0.2,-0.75) {power nets, slow analog: no healing};
\end{circuitikz}
\end{document}
```

- **Pure AC above ~10 kHz seldom fails by EM** (Hastings Sec. 5.1.3). Tao et al. measured up to ~500× longer life than DC for Cu between 10 Hz and 10 kHz (Lienig & Thiele Fig. 2.13).
- **Pulsed, unidirectional current** (Hastings Eq. 5.13, vacancy recombination time $\tau > 0.1$ ms):

$$
\boxed{t_{pulse} = \begin{cases} t_{DC}/D, & f < 1/\tau \\ t_{DC}/D^2, & f > 1/\tau \end{cases}}
$$

  where $t_{DC}$ is the life at a DC current equal to the pulse peak. Most power applications have $f > 1/\tau$: 50% duty quadruples life, so with $n=2$ an Al lead can be **half as wide** as for the same DC current. For $n=2$ and $f > 1/\tau$ this is the same as sizing on the average current $D\,I_p$.
- **Net classes:** use at least two limits, one for DC and below ~10 kHz, one for AC; power nets (DC, high current) are most sensitive, clock nets (symmetric AC, high RMS) and signal nets (asymmetric pulses, low RMS) less (Lienig & Thiele Sec. 4.7.2).
- **Skin effect** is irrelevant for EM in on-chip wires today: the critical frequency for a 0.45 µm square wire is about 90 GHz and about 35 THz at the 22 nm node (Lienig & Thiele Sec. 2.4.3).

> [!note]- Detail: the self-healing coefficient and asymmetric waveforms
> Net flux under reversal: $J_{net} = J_{forward}(1-\gamma)$, $\gamma$ the self-healing coefficient (depends on duty factor and frequency). An extended Black's equation (Lienig & Thiele Eq. 2.7): $MTF_{AC} = A/[r j^+ - \gamma(1-r) j^-]^n\cdot e^{E_a/kT}$ with $r$ the duty factor and $j^\pm$ the half-cycle densities. For zero-mean but time-asymmetric waveforms (long low pulses one way, short tall pulses back) the nonlinear $J$ dependence still leaves a net flux; Shono et al.'s model has its lifetime minimum near a duty factor of 0.4. Even at high frequency, life is finite because thermal migration (driven by the RMS heating) takes over.

## Level 2: The Physics of Migration

### Electron wind and diffusion paths

```tikz title="Where atoms move. Left: polycrystalline Al vs bamboo wire (top view). Grain boundaries along the wire are diffusion highways; in a bamboo wire they cross it and carry little flux. Right: Cu damascene cross-section; the weakest path is the top surface under the dielectric cap. Activation energies from Lienig & Thiele Table 2.1. After Hastings Fig. 5.2 and Lienig & Thiele Figs. 2.6, 2.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60}]
  % polycrystalline
  \node[anchor=west,font=\scriptsize\bfseries] at (0,4.25) {polycrystalline (wide Al)};
  \draw[mone] (0,2.6) rectangle (6,3.6);
  \draw[white,thick] (0.6,2.6) -- (0.9,3.1) -- (0.7,3.6) (0.9,3.1) -- (1.6,3.0) -- (1.9,2.6) (1.6,3.0) -- (1.8,3.6)
    (2.6,2.6) -- (2.5,3.0) -- (2.9,3.6) (2.5,3.0) -- (3.3,3.1) -- (3.6,2.6) (3.3,3.1) -- (3.6,3.6)
    (4.3,2.6) -- (4.4,3.2) -- (4.2,3.6) (4.4,3.2) -- (5.1,3.0) -- (5.3,2.6) (5.1,3.0) -- (5.4,3.6);
  \draw[->,very thick,orange] (0.2,3.25) -- (5.8,3.25);
  \node[font=\scriptsize,anchor=north west] at (0,2.55) {boundaries run along the flow: fast path};
  \fill[red] (0.9,3.1) circle (0.05); \node[font=\scriptsize,red,anchor=south west] at (0.95,3.62) {triple point};
  % bamboo
  \node[anchor=west,font=\scriptsize\bfseries] at (0,1.5) {bamboo (narrow, $w <$ grain size/2)};
  \draw[mone] (0,0.6) rectangle (6,1.1);
  \foreach \x in {0.7,1.5,2.6,3.3,4.4,5.2} {\draw[white,thick] (\x,0.6) -- (\x+0.06,1.1);}
  \node[font=\scriptsize,anchor=north west] at (0,0.55) {boundaries cross the flow: little transport};
  \draw[->,thick] (6.3,0.85) -- (7.0,0.85) node[right,font=\scriptsize] {$e^-$};
  % Cu cross-section
  \begin{scope}[xshift=8.8cm]
    \node[anchor=west,font=\scriptsize\bfseries] at (-0.6,3.9) {Cu damascene line (cross-section)};
    \draw[diel] (-0.6,0.0) rectangle (4.4,3.5);
    \draw[fill=black!60,draw=none] (0.6,0.8) rectangle (3.2,2.6);
    \draw[mone] (0.7,0.9) rectangle (3.1,2.6);
    \draw[nit] (-0.6,2.6) rectangle (4.4,2.8);
    \draw[white,thick] (1.5,0.9) -- (1.5,2.6) (2.3,0.9) -- (2.35,2.6);
    \node[font=\scriptsize,anchor=west] at (3.3,1.2) {liner Ta/TaN};
    \node[font=\scriptsize,anchor=west] at (3.3,3.2) {cap SiN};
    \draw[->] (3.5,3.05) -- (3.3,2.75);
    \node[circle,draw,fill=white,inner sep=1pt,font=\scriptsize] (c) at (1.1,2.45) {c};
    \node[circle,draw,fill=white,inner sep=1pt,font=\scriptsize] (a) at (1.5,1.6) {a};
    \node[circle,draw,fill=white,inner sep=1pt,font=\scriptsize] (b) at (2.7,1.6) {b};
  \end{scope}
  \node[draw,align=left,font=\scriptsize,anchor=north west,fill=white] at (8.2,-0.2) {
    \begin{tabular}{lcc} path & Al & Cu \\ \hline
    (a) grain boundary & 0.7 & 1.2 \\
    (b) bulk & 1.2 & 2.3 \\
    (c) surface & 0.8 & 0.8 \end{tabular}\\ $E_a$ in eV: lowest wins};
\end{circuitikz}
\end{document}
```

- Two forces act on a metal ion: the electrostatic force of the field (mostly screened by the electrons, negligible) and the **electron wind**, the momentum transferred by colliding electrons, pointing along electron flow. When it supplies enough energy to cross the activation barrier, atoms diffuse **from cathode (−) to anode (+)**, i.e. against conventional current (Lienig & Thiele Sec. 2.1).
- **The path with the lowest $E_a$ dominates.** Al: grain boundaries (0.7 eV), hence Cu-doping and big grains help. Cu: the surfaces, especially the top surface damaged by CMP under a poorly adhering dielectric cap, which is why Cu voids usually start at the top surface.
- Blocking one path promotes the next: Al→Cu removed grain-boundary diffusion but made surface diffusion dominant; suppressing surface diffusion with better caps brings grain boundaries back (Lienig & Thiele Sec. 2.4.2).

> [!note]- Derivation: drift velocity and flux
> Atoms drift with velocity $v = \frac{D}{kT}\,e z^*\rho j$ (Lienig & Thiele Eq. 2.3), $z^*$ the effective charge (a measure of momentum exchange), $\rho$ resistivity, $D = D_0 e^{-E_a/kT}$. The EM atomic flux is $J_E = \frac{c}{kT}D_0 e^{-E_a/kT} z^* e\rho j$ (Eq. 2.15): proportional to $j$ and Arrhenius in $T$. For combined grain-boundary and bulk diffusion, $D = D_v + \frac{\delta}{d}D_b$ (boundary width $\delta$, grain size $d$): fewer boundaries per unit length (bigger grains) mean less flux. Black's empirical $J^{-n}$ comes from integrating this flux until a critical void (growth, $n\approx1$) or a critical vacancy supersaturation (nucleation, $n\approx2$).

> [!note]- Detail: materials (Lienig & Thiele Sec. 4.8, Hastings Secs. 2.7, 5.1.3)
> - **Al:** 0.5% Cu (0.5–4% possible; dry etch limits it to ~0.5%) gives >10× life by segregating at grain boundaries; a compressive nitride overcoat confines the metal and slows voiding; refractory barrier metal (TiW, TiN) under the Al carries current across a voided contact sidewall and is itself almost immune.
> - **Cu:** 35% lower resistance than Al and roughly 10× better EM; the barrier is essential (Cu diffuses into Si and oxide). Metal liner (Ta, TaN, Ti, TiN) on three sides, dielectric cap (SiN, SiCN) on top. Boundary $E_a$: Ta 2.1 eV, Ta/TaN 1.4, SiN/SiCxNyHz 0.7–1.1, CoWP 1.9–2.4 eV, so metallic or self-aligned caps (CoWP, Co, Mn- or Ru-doped Cu) raise the weakest path. Doping Cu with Mn or Pd also helps.
> - **Dielectric:** stiffness (Young's modulus) sets how much back-stress resists EM, so stiff SiO₂ gives long Blech lengths; porous and organic low-k dielectrics are soft, lowering the Blech product and raising extrusion risk. Local reinforcement or extra metal near anode and cathode can compensate.
> - **Other metals:** W ($E_a$ 1.89 eV) is robust but resistive, used for contacts and plugs. Ag conducts best but has low $E_a$; Au poisons silicon.
> - **CNTs:** single tubes have carried up to $10^{10}$ A/cm² versus $<10^7$ for Cu; still research.

### Flux divergence: voids, hillocks, line and via depletion

```tikz title="Damage appears where atomic flux is divergent. In Cu dual damascene the liner at the via bottom blocks atoms. Left: electrons flowing from the via into the lower line sweep M1 atoms away from the via landing (line depletion). Right: electrons flowing from the line up into the via sweep the via empty (via depletion). After Lienig & Thiele Fig. 2.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60}]
  \foreach \ox/\ttl in {0/{line depletion},7.4/{via depletion}} {
    \begin{scope}[xshift=\ox cm]
      \node[font=\scriptsize\bfseries] at (3.0,4.1) {\ttl};
      \draw[diel] (0,0) rectangle (6.2,3.7);
      \draw[mone] (0.3,0.6) rectangle (5.9,1.3);
      \draw[nit] (0,1.3) rectangle (6.2,1.42);
      \draw[mtwo] (2.4,1.42) rectangle (3.1,2.6);
      \draw[mtwo] (0.3,2.6) rectangle (3.1,3.3);
      \draw[nit] (0,3.3) rectangle (6.2,3.42);
      \draw[black,line width=1.2pt] (2.4,1.42) -- (3.1,1.42);
      \node[font=\scriptsize,white] at (0.6,2.95) {M2};
      \node[font=\scriptsize,white] at (5.55,0.95) {M1};
    \end{scope}
  }
  % left: e- down via, then right along M1; void in M1 under via edge
  \draw[->,thick] (1.0,2.95) -- (2.6,2.95) -- (2.75,1.6);
  \draw[->,thick] (3.2,0.95) -- (4.9,0.95);
  \node[font=\scriptsize,anchor=south] at (1.6,2.98) {$e^-$};
  \filldraw[fill=white,draw=black!80] (2.4,1.3) -- (3.6,1.3) .. controls (3.4,0.85) and (2.7,0.85) .. (2.4,1.3);
  \node[font=\scriptsize,anchor=north,align=center] at (3.0,0.55) {void in M1: liner stops\\ resupply from the via};
  % right: e- along M1 into via, up; void at via bottom
  \draw[->,thick] (12.5,0.95) -- (10.15,0.95) -- (10.15,2.95) -- (8.4,2.95);
  \node[font=\scriptsize,anchor=south] at (11.5,0.98) {$e^-$};
  \filldraw[fill=white,draw=black!80] (9.8,1.45) rectangle (10.5,1.85);
  \node[font=\scriptsize,anchor=north,align=center] at (10.4,0.55) {void in the via: liner stops\\ resupply from M1};
\end{circuitikz}
\end{document}
```

- Uniform flux moves metal but does no damage. Damage needs a **divergence**: wire ends, bends, layer changes (vias), width changes, material changes (Al/W, Cu/liner), grain-size changes, existing defects, temperature gradients, stress gradients (Lienig & Thiele Sec. 2.1).
- **Void → open** (or a resistance step when the liner carries the current); **hillock / whisker / extrusion → short** to a neighbour. Damage pictures cannot tell EM, thermal and stress migration apart; location can: EM damage sits at high-$J$ spots and follows current direction (Lienig & Thiele Sec. 2.5.4).
- The wider the line relative to the via, the more current the via must carry at the same line density, so via depletion gets worse with wide lines on single vias.

> [!note]- Detail: Al contacts, tungsten plugs and asymmetry (Hastings Sec. 5.1.3)
> In Al systems current flows up or down the contact/via sidewalls, which step coverage thins: 10 kÅ metal with 50% step coverage has 5 kÅ sidewalls, and only the sidewalls facing the current conduct. With refractory barrier metal you can ignore step coverage (the barrier still conducts if the Al sidewall voids). For W-plug vias in Al, voids form much faster where conventional current flows *into* the plug (electrons leave the Al into W, which does not resupply Al). A plug with barrier metal below but not above is weaker for current flowing from upper to lower metal; experiments confirm the asymmetry.

### Joule heating feedback, thermomigration and stress migration

```tikz title="Left: the four migration mechanisms in solid metal and their driving forces. Right: the positive feedback that makes a void run away. After Lienig & Thiele Figs. 2.4, 2.5 and 2.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  box/.style={draw,rounded corners=2pt,align=center,font=\scriptsize,minimum height=0.9cm,text width=2.4cm}]
  \node[box,fill=gray!10] (cd) at (0,3) {chemical diffusion\\ (concentration)};
  \node[box,fill=orange!20] (tm) at (3.2,3) {thermomigration\\ (grad $T$)};
  \node[box,fill=blue!15] (em) at (6.4,3) {electromigration\\ (current density $j$)};
  \node[box,fill=green!15] (sm) at (9.6,3) {stress migration\\ (grad $\sigma$)};
  \draw[->,thick] (em.south) to[bend left=35] node[below,font=\scriptsize] {Joule heating} (tm.south);
  \draw[->,thick] (em.south) to[bend right=35] node[below,font=\scriptsize] {moves atoms: stress} (sm.south);
  \draw[->,thick,red!70!black] (sm.north) to[bend right=35] node[above,font=\scriptsize] {back-flux opposes EM (Blech)} (em.north);
  \node[font=\scriptsize,align=center] at (4.8,1.0) {CTE mismatch: $T\to\sigma$; \ $T$ and $\sigma$ change $D$ for all three};
  \begin{scope}[xshift=15.2cm,yshift=2.4cm]
    \node[box,fill=white] (v) at (0,1.4) {void grows};
    \node[box,fill=white] (j) at (2.4,0) {local $j$ rises};
    \node[box,fill=white] (h) at (0,-1.4) {Joule heating:\\ $T$ rises};
    \node[box,fill=white] (d) at (-2.4,0) {diffusion faster};
    \draw[->,thick] (v) -- (j); \draw[->,thick] (j) -- (h); \draw[->,thick] (h) -- (d); \draw[->,thick] (d) -- (v);
    \node[font=\small,red!70!black] at (0,0) {$+$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Thermomigration (TM):** atoms diffuse down a temperature gradient. Causes: Joule heating, nearby hot transistors, local cooling (e.g. a TSV to a heat sink). Minor inside ICs (pure metals, high thermal conductivity), but important in solder: a 10 K difference across a 100 µm flip-chip bump is 1000 K/cm, enough to migrate solder (Lienig & Thiele Sec. 2.5.1). In AC wires, where EM cancels, TM driven by RMS heating is often what remains.
- **Stress migration (SM, stress voiding):** atoms flow from compressive to tensile regions. Sources: CTE mismatch after deposition (Cu 16.5 ppm/K vs SiO₂ 0.5 ppm/K; stress-free near 250 °C, so wires sit in tension at operating temperature, ≈140 MPa for a 200 K cool-down), EM itself, packaging, TSVs (keep-out zones for transistors). When vacancies supersaturate, a void nucleates (Lienig & Thiele Secs. 2.4.4, 2.5.2).
- **The coupling that helps:** EM piles atoms at the anode (compression) and depletes the cathode (tension); the stress gradient drives SM **backwards**. In a short wire the two balance: the Blech effect below.

$$
\boxed{J_a = \frac{Dc}{kT}\left(\rho\, j\, z^* e \;-\; \Omega\frac{\partial\sigma}{\partial x}\right)}
$$

(one-dimensional net atomic flux, EM minus SM; $\Omega$ atomic volume, $x=0$ at the cathode; Lienig & Thiele Eq. 2.19).

> [!note]- Detail: the three fluxes (Lienig & Thiele Eqs. 2.15–2.18)
> $\vec J_E = \frac{c}{kT}D_0e^{-E_a/kT}z^*e\rho\vec j$, $\quad \vec J_T = -\frac{cQ^*}{kT^2}D_0e^{-E_a/kT}\,\mathrm{grad}\,T$, $\quad \vec J_S = \frac{c\Omega}{kT}D_0e^{-E_a/kT}\,\mathrm{grad}\,\sigma$, with $Q^*$ the heat of transport. The net flux $\vec J_a = \vec J_E + \vec J_T + \vec J_S$; damage follows its divergence. Thermal stress estimate: $\sigma = \frac{\alpha_{Cu}-\alpha_{SiO_2}}{1/E_{SiO_2}+1/E_{Cu}}\Delta T$ with $E_{Cu}=117$ GPa, $E_{SiO_2}=70$ GPa, $\Delta T = 200$ K gives ≈140 MPa.

## Level 3: Geometry That Helps or Hurts

### Blech effect: short segments are immortal

```tikz title="Blech effect. EM drives atoms to the anode and builds a stress gradient that pushes them back (stress migration). The steady-state stress is linear along the segment with a slope set by j. If the cathode stress stays below the void threshold, flux stops: the segment is immortal. Since the slope is fixed by j, the end stress grows with L, hence a critical product jL. After Lienig & Thiele Figs. 4.4 and 4.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  cont/.style={fill=black,draw=none}]
  % short segment and a longer one (dashed outline)
  \draw[dashed,blue!55!black] (0,4.4) rectangle (10,5.0);
  \draw[mone] (0,4.4) rectangle (5,5.0);
  \draw[cont] (-0.3,4.45) rectangle (0.2,4.95);
  \draw[cont] (4.8,4.45) rectangle (5.3,4.95);
  \node[font=\scriptsize,anchor=south] at (-0.05,5.6) {cathode $-$};
  \node[font=\scriptsize,anchor=south] at (5.05,5.6) {anode $+$};
  \draw[->,thick] (0.6,5.3) -- (4.4,5.3) node[midway,above,font=\scriptsize] {EM flux};
  \draw[<-,thick,red!70!black] (0.6,4.1) -- (4.4,4.1) node[midway,below,font=\scriptsize] {SM back-flux};
  \node[font=\scriptsize,blue!55!black,anchor=west] at (5.6,4.7) {longer segment, same $j$};
  % stress plot, sigma = 0 at y = 2
  \draw[->] (0,2.0) -- (10.6,2.0) node[right,font=\scriptsize] {$x$};
  \draw[->] (0,-0.1) -- (0,3.9);
  \node[font=\scriptsize,rotate=90] at (-0.45,2.0) {$\sigma$ (tensile $+$)};
  \draw[dashed] (0,3.2) -- (10.3,3.2) node[right,font=\scriptsize] {$\sigma_{crit}$ (void)};
  \draw[thick,gray] (0,2.3) -- (5,1.7);
  \draw[thick,gray!70!black] (0,2.55) -- (5,1.45);
  \draw[very thick,blue!70!black] (0,2.75) -- (5,1.25);
  \draw[very thick,red!70!black,dashed] (0,3.5) -- (10,0.5);
  \fill[red!70!black] (0,3.5) circle (0.07);
  \node[font=\scriptsize,anchor=west,red!70!black] at (5.6,2.75) {long: cathode stress $>\sigma_{crit}$ $\Rightarrow$ void};
  \node[font=\scriptsize,anchor=west,blue!70!black] at (0.2,-0.4) {short ($L<L_{Blech}$): steady-state stress (blue) stays below $\sigma_{crit}$: immortal; grey = earlier times};
\end{circuitikz}
\end{document}
```

$$
\boxed{(jL)_{Blech} = \frac{\Omega\,\Delta\sigma}{e\,z^*\rho}} \qquad \boxed{L_{Blech} = \frac{(jL)_{Blech}}{j}}
$$

| System | $(jL)_{Blech}$ | $L_{Blech}$ at $5\times10^5$ A/cm² |
|---|---|---|
| Pure Al on TiN (Blech 1976, via Hastings) | ≈1200 A/cm | 24 µm |
| Al, measured range | 420–3800 A/cm | 8–76 µm |
| Cu, measured range | 375–3700 A/cm | 7.5–74 µm (≈5–100 µm typical) |

- A **segment** is a straight piece between two vias/contacts or branch points (one anode, one cathode). The criterion applies per segment; linked segments interact through their shared nodes and reservoirs, so the whole net matters (Lienig & Thiele Secs. 4.3.1, 4.3.3).
- **Using it:** keep high-current segments short; break a long route into short segments with layer changes (but each via adds its own risk). Many analog EM rule decks ignore Blech and specify only $J_{max}$ at a temperature (Hastings), so the benefit is free margin unless the foundry provides length-dependent rules.
- **Above $L_{Blech}$, not necessarily dead:** a void can form and then stop growing (void-growth saturation). The wire is still immortal if the saturated void volume stays below about $H^2W$ (it never spans the whole cross-section), so the liner never carries the full current. For short segments (<20 µm) $jL^2$ is a less conservative criterion, because it is proportional to the void volume and hence to the absolute resistance increase (Lienig & Thiele Sec. 4.3.1).

> [!note]- Derivation: the Blech product from zero net flux
> Set $J_a = 0$ in the one-dimensional flux: $\rho j z^* e = \Omega\,\partial\sigma/\partial x$. The stress gradient is constant, so $\sigma$ is linear with total drop $\Delta\sigma = \rho j z^*e L/\Omega$ between the ends. Require $\Delta\sigma$ to stay below the critical difference (void at the cathode or extrusion at the anode): $jL \le \Omega\Delta\sigma/(ez^*\rho)$. Voids form first, because the wire starts in tension and the tensile threshold is lower than the compressive one. Saturated void growth (Lienig & Thiele Eqs. 4.2–4.5): $V_{sat} = \frac{ez^*\rho A_{Cu}}{2\Omega B}jL^2$ ($B$ the effective modulus of the surroundings), and once the void spans the line, $\Delta R_{sat} = V_{sat}\rho_b/(A_{Cu}A_b)$ through the liner.

> [!note]- Detail: simplified length-dependent rules
> Lienig & Thiele quote a set of simplified rules (Seth, 2009) of the form $I_{max} \approx \frac{W}{L}S$ for $5 \le L \le 10$, $I_{max}\approx\frac{W}{5}S$ for $L<5$, $I_{max}\approx W\sqrt{W}S$ for $2<W<20$ and $I_{max}\approx WS$ for $W\ge20$, with $S$ a user de-rating factor. Units and constants are technology specific; treat these as the *shape* of a Blech-aware rule deck, not values.

> [!warning] Unverified
> The units of $W$, $L$ and $I_{max}$ in the simplified rules above are not stated in the source.

### Via-above vs via-below (downstream vs upstream)

```tikz title="Same segment, contacted from above or from below. Cu voids nucleate at the CMP-damaged top surface. Via-above (downstream): the void forms right under the via and a small one opens the circuit. Via-below (upstream): the void forms away from the contact and must grow through the line, so about 10x the jL product is tolerated. After Lienig & Thiele Figs. 4.13-4.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40},
  nit/.style={fill=magenta!40,draw=black!60}]
  % via-above
  \node[font=\scriptsize\bfseries,align=center] at (3,3.9) {BAD: via-above (downstream)\\ $(jL)_c\approx 375$ A/cm};
  \draw[diel] (0,0) rectangle (6,3.2);
  \draw[mone] (0.3,0.8) rectangle (5.7,1.5);
  \draw[nit] (0,1.5) rectangle (6,1.62);
  \draw[mtwo] (0.6,1.62) rectangle (1.3,2.5);
  \draw[mtwo] (0.3,2.5) rectangle (2.4,3.0);
  \filldraw[fill=white,draw=black!80] (0.6,1.5) -- (1.4,1.5) .. controls (1.3,1.3) and (0.7,1.3) .. (0.6,1.5);
  \node[font=\scriptsize,align=center] at (3.6,2.3) {small void under\\ the via $\Rightarrow$ open};
  \draw[->] (2.6,2.1) -- (1.4,1.45);
  \draw[->,thick,white] (2.0,1.15) -- (5.0,1.15);
  \node[font=\scriptsize,white] at (3.5,0.95) {critical segment};
  % via-below
  \begin{scope}[xshift=7.2cm]
  \node[font=\scriptsize\bfseries,align=center] at (3,3.9) {GOOD: via-below (upstream)\\ $(jL)_c$ up to 3700 A/cm};
  \draw[diel] (0,0) rectangle (6,3.2);
  \draw[mone] (0.3,0.3) rectangle (2.4,0.8);
  \draw[nit] (0,0.8) rectangle (6,0.92);
  \draw[mtwo] (0.6,0.92) rectangle (1.3,1.8);
  \draw[mtwo] (0.3,1.8) rectangle (5.7,2.5);
  \draw[nit] (0,2.5) rectangle (6,2.62);
  \filldraw[fill=white,draw=black!80] (0.6,2.5) -- (1.4,2.5) .. controls (1.3,2.3) and (0.7,2.3) .. (0.6,2.5);
  \node[font=\scriptsize,align=center] at (3.9,1.3) {void on top surface:\\ via still connected};
  \draw[->,thick,white] (2.0,2.15) -- (5.0,2.15);
  \node[font=\scriptsize,white] at (3.5,1.98) {critical segment};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Cu voids sit at the **top surface** (CMP defects, weak cap adhesion). If the critical segment is contacted from **above**, the void lands in the via contact zone; from **below**, there is copper between the void and the via (Lienig & Thiele Sec. 4.4).
- Thompson's numbers: $(jL)_c \approx 375$ A/cm via-above vs up to 3700 A/cm via-below, i.e. 7.5 µm vs 74 µm at $5\times10^5$ A/cm².
- **Rule:** contact critical high-current segments **from below** where the layout allows; apply a tighter $jL$ to the remaining via-above segments; for via-above, overlap the via liner with the line liner to limit the resistance jump.

### Reservoirs

```tikz title="Reservoirs: extra metal at a segment end that carries no current. At the cathode it is a source of atoms (the void can grow without cutting the path); at the anode it is a sink (lower back-stress, larger voids at the cathode). Top views. After Lienig & Thiele Figs. 4.16-4.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  cont/.style={fill=black,draw=none}]
  % end-of-line reservoir at cathode
  \node[font=\scriptsize\bfseries,align=center] at (2.9,2.5) {GOOD (DC): end-of-line reservoir\\ at the cathode = source};
  \draw[mone] (0,1.0) rectangle (6,1.6);
  \draw[mtwo] (1.1,0.2) rectangle (1.8,2.0);
  \draw[cont] (1.2,1.08) rectangle (1.7,1.52);
  \fill[green!50!black,opacity=0.35] (0,1.0) rectangle (1.1,1.6);
  \node[font=\scriptsize,anchor=north] at (0.55,0.95) {reservoir};
  \draw[->,thick] (2.2,1.3) -- (5.6,1.3);
  \node[font=\scriptsize,anchor=north] at (3.9,0.95) {$e^-$ flow (DC)};
  % BAD: reservoir at the anode = sink
  \begin{scope}[xshift=14.4cm]
  \node[font=\scriptsize\bfseries,align=center] at (2.9,2.5) {BAD: reservoir at the anode\\ = sink (worse with low-k, AC)};
  \draw[mone] (0,1.0) rectangle (6,1.6);
  \draw[mtwo] (4.2,0.2) rectangle (4.9,2.0);
  \draw[cont] (4.3,1.08) rectangle (4.8,1.52);
  \fill[red!60,opacity=0.45] (4.9,1.0) rectangle (6,1.6);
  \node[font=\scriptsize,anchor=north] at (5.45,0.95) {sink};
  \draw[->,thick] (0.4,1.3) -- (3.9,1.3);
  \node[font=\scriptsize,anchor=north,align=center] at (2.1,0.95) {less back-stress $\Rightarrow$\\ bigger cathode void};
  \end{scope}
  % side reservoir
  \begin{scope}[xshift=7.2cm]
  \node[font=\scriptsize\bfseries,align=center] at (2.9,2.5) {side reservoir: intercepts\\ voids drifting along the line};
  \draw[mone] (0,1.0) rectangle (6,1.6);
  \draw[mone] (2.6,1.6) rectangle (3.4,2.1);
  \draw[mone] (2.6,0.5) rectangle (3.4,1.0);
  \fill[green!50!black,opacity=0.35] (2.6,1.6) rectangle (3.4,2.1);
  \fill[green!50!black,opacity=0.35] (2.6,0.5) rectangle (3.4,1.0);
  \draw[mtwo] (0.2,0.2) rectangle (0.9,2.0); \draw[cont] (0.3,1.08) rectangle (0.8,1.52);
  \draw[mtwo] (5.1,0.2) rectangle (5.8,2.0); \draw[cont] (5.2,1.08) rectangle (5.7,1.52);
  \draw[->,thick] (1.1,1.3) -- (2.4,1.3);
  \node[font=\scriptsize,anchor=north,align=center] at (3.0,0.45) {breaks the grid; may violate\\ double-patterning rules};
  \end{scope}
\end{circuitikz}
\end{document}
```

- A **source** reservoir (at the cathode) supplies atoms: voids can grow inside it without cutting the path, so the critical void volume rises. On average reservoirs gave a **5× longer** permissible Blech length at the same $j$ (Hau-Riege et al., via Lienig & Thiele Sec. 4.5.4).
- A **sink** (at the anode) relaxes compressive stress, so less back-stress builds up and the cathode void grows bigger: **sinks hurt**, especially with low-k (soft) dielectrics.
- **AC nets:** each end alternates between source and sink; with low-k the sink effect wins and reservoirs **reduce** life. Use reservoirs on **DC power nets**, not on signal nets.
- The gaps between vias in a via array and the overlap regions are unintended reservoirs (next sections).

### Wide wires: bamboo effect and slotting

```tikz title="Left: a solid wide bus. Right: the same bus slotted (cheesed) into narrow parallel strips. Slots are required by CMP width/density rules; in Al the narrow strips also tend to form bamboo grains, which slows grain-boundary EM. Effective cross-section is reduced by the slots, so recompute J. After Lienig & Thiele Figs. 4.1-4.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70}]
  \node[font=\scriptsize\bfseries] at (2.5,3.4) {solid wide bus};
  \draw[->,very thick,red!70!black] (-1.0,1.5) -- (-0.1,1.5) node[midway,above,font=\scriptsize] {$I$};
  \draw[mone] (0,0) rectangle (5,3);
  \node[font=\scriptsize,white,align=center] at (2.5,1.5) {fine polycrystalline grains\\ CMP dishing risk};
  \begin{scope}[xshift=6.5cm]
  \node[font=\scriptsize\bfseries] at (2.5,3.4) {slotted bus};
  \draw[mone] (0,0) rectangle (5,3);
  \foreach \y in {0.55,1.3,2.05} {\foreach \x in {0.45,1.95,3.45} {\draw[fill=gray!8,draw=black!50] (\x,\y) rectangle (\x+1.1,\y+0.35);}}
  \node[font=\scriptsize,anchor=north,align=center] at (2.5,-0.1) {narrow strips $\to$ bamboo grains (Al)};
  \end{scope}
  % MTF vs width sketch
  \begin{scope}[xshift=13.2cm]
  \draw[->] (0,0) -- (4.2,0) node[right,font=\scriptsize] {$w$};
  \draw[->] (0,0) -- (0,3.2) node[above,font=\scriptsize] {MTF ($I$, $T$ const.)};
  \draw[very thick,blue!70!black] (0.3,2.6) .. controls (0.8,1.0) and (1.2,0.6) .. (1.6,0.7) .. controls (2.4,1.0) and (3.2,1.9) .. (3.9,2.6);
  \draw[dashed] (1.2,0) -- (1.2,2.9) node[above,font=\scriptsize] {$\approx d_{grain}/2$};
  \node[font=\scriptsize,anchor=north] at (0.35,-0.05) {bamboo};
  \node[font=\scriptsize,anchor=north] at (1.95,-0.05) {near-bamboo};
  \node[font=\scriptsize,align=center] at (3.2,0.6) {$J$ falls};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Bamboo effect:** when the wire is narrower than about half the grain size ($w/D_{50} < 0.5$), grains span the line and the boundaries cross the current, removing the fast path. Big help in Al (grains ~0.25 µm, effective below ~2 µm for Al-0.5%Cu); little help in Cu unless surface diffusion is suppressed (Hastings Sec. 5.1.3; Lienig & Thiele Sec. 4.2).
- **Near-bamboo** (a few blocking grains and triple points) is the worst case: it adds divergences. Narrowing a wire first lowers MTF (higher $J$, near-bamboo), then raises it once fully bamboo; too narrow and Joule heating wins.
- **Slotting (cheesing)** wide buses is mainly a CMP rule (maximum Cu width, metal density); as a side effect the strips can be bamboo. **Size the slotted bus on its remaining metal width**, not the outline.

### Corners and current crowding

```tikz title="Current crowds toward the inside corner of a bend. A 90 degree inside corner is a current-density (and EM) hot spot; replacing it with two 135 degree corners (a chamfer) spreads the current. After Hastings Sec. 15.3.4 and Lienig & Thiele Fig. 2.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70}]
  % BAD 90 deg
  \node[font=\scriptsize\bfseries] at (2.2,4.6) {BAD: 90° bend};
  \draw[mone] (0,0) -- (1.4,0) -- (1.4,2.6) -- (4.4,2.6) -- (4.4,4.0) -- (0,4.0) -- cycle;
  \draw[white,thick,->] (0.35,0.2) -- (0.35,3.65) -- (4.2,3.65);
  \draw[white,thick,->] (0.75,0.2) -- (0.75,3.25) -- (4.2,3.25);
  \draw[white,thick,->] (1.15,0.2) -- (1.15,2.85) -- (4.2,2.85);
  \draw[white,thick,->] (1.3,0.2) -- (1.3,2.72) -- (4.2,2.72);
  \fill[red,opacity=0.6] (1.4,2.6) circle (0.28);
  \node[font=\scriptsize,anchor=west,align=left] at (1.75,2.15) {hot spot at the\\ inside corner};
  % GOOD 135 deg
  \begin{scope}[xshift=6.5cm]
  \node[font=\scriptsize\bfseries] at (2.2,4.6) {GOOD: two 135° corners};
  \draw[mone] (0,0) -- (1.4,0) -- (1.4,2.0) -- (2.0,2.6) -- (4.4,2.6) -- (4.4,4.0) -- (0.9,4.0) -- (0,3.1) -- cycle;
  \draw[white,thick,->] (0.35,0.2) -- (0.35,3.0) -- (1.0,3.65) -- (4.2,3.65);
  \draw[white,thick,->] (0.75,0.2) -- (0.75,2.85) -- (1.15,3.25) -- (4.2,3.25);
  \draw[white,thick,->] (1.15,0.2) -- (1.15,2.15) -- (1.85,2.85) -- (4.2,2.85);
  \node[font=\scriptsize,anchor=west,align=left] at (1.9,1.7) {current spread\\ over the chamfer};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Inside corners of 90° bends carry the highest local $J$: **replace each 90° interior corner with a pair of 135° corners** (Hastings Sec. 15.3.4). FEM plots show 135° and 150° bends much milder than 90° (Lienig & Thiele Fig. 2.8).
- Where the wire cannot be widened (at terminals, inside a bend), add **support polygons** (local fillets) to lower the corner density (Lienig & Thiele Sec. 3.6).
- Device terminals have uneven ampacity: a U-shaped analog pin connected at its thin arm may overload that arm. Check which terminal regions can take the wire current before choosing the connection point (Lienig & Thiele Sec. 3.5.3).

### Via arrays and redundancy

```tikz title="Via and contact current sharing (top views, M1 horizontal blue, M2 violet). Top row BAD: vias in line with the current (only the front face of the front via conducts much), and a 3x3 array in a 90 degree bend (via 1 at the inside corner takes the most). Bottom row GOOD: vias in a row across the current, and the array placed in a straight run so every path has the same length. After Hastings Figs. 5.3 and 15.29 and Lienig & Thiele Figs. 4.25-4.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,fill opacity=0.75,draw=black!70},
  cont/.style={fill=black,draw=none}]
  % ---- BAD 1: in-line pair at lead end
  \node[font=\scriptsize\bfseries,align=center] at (2.5,8.5) {BAD: two vias in line\\ with the flow};
  \draw[mone] (0,5.6) rectangle (5,6.6);
  \draw[mtwo] (2.8,5.4) rectangle (5.0,6.8);
  \draw[cont] (3.1,5.85) rectangle (3.6,6.35);
  \draw[cont] (4.1,5.85) rectangle (4.6,6.35);
  \foreach \y in {5.8,6.1,6.4} {\draw[->,red!70!black,thick] (0.3,\y) -- (3.05,\y);}
  \node[font=\scriptsize,anchor=north,align=center] at (2.5,5.3) {front face of the front via carries\\ almost everything; rear via idles};
  % ---- BAD 2: array in a 90 deg bend
  \begin{scope}[xshift=7.0cm]
  \node[font=\scriptsize\bfseries,align=center] at (2.5,8.7) {BAD: 3$\times$3 array in a 90° bend};
  \draw[mone] (0,5.2) rectangle (3.4,6.9);
  \draw[mtwo] (1.7,5.2) rectangle (3.4,8.3);
  \foreach \i/\x/\y in {1/1.85/6.55,2/2.35/6.55,3/2.85/6.55,4/1.85/6.05,5/2.35/6.05,6/2.85/6.05,7/1.85/5.55,8/2.35/5.55,9/2.85/5.55} {\draw[cont] (\x,\y) rectangle (\x+0.35,\y+0.3); \node[white,font=\tiny] at (\x+0.175,\y+0.15) {\i};}
  \draw[->,red!70!black,thick] (0.2,6.05) -- (1.7,6.05);
  \draw[->,red!70!black,thick] (2.5,6.95) -- (2.5,7.9);
  \node[font=\scriptsize,anchor=west,align=left] at (3.6,6.2) {via 1 (inside\\ corner) highest,\\ via 9 lowest};
  \end{scope}
  % ---- GOOD 1: row across the flow
  \node[font=\scriptsize\bfseries,align=center] at (2.5,3.6) {GOOD: row across the flow};
  \draw[mone] (0,0.9) rectangle (5,2.9);
  \draw[mtwo] (3.4,0.7) rectangle (5.0,3.1);
  \foreach \y in {1.1,1.55,2.0,2.45} {\draw[cont] (3.6,\y) rectangle (4.0,\y+0.35);}
  \foreach \y in {1.25,1.7,2.15,2.6} {\draw[->,green!40!black,thick] (0.3,\y) -- (3.55,\y);}
  \node[font=\scriptsize,anchor=north,align=center] at (2.5,0.6) {every via has a front face; current\\ shared; lead widened to land them};
  % ---- GOOD 2: array in straight run
  \begin{scope}[xshift=7.0cm]
  \node[font=\scriptsize\bfseries,align=center] at (2.5,3.6) {GOOD: array in a straight run};
  \draw[mone] (0,0.9) rectangle (3.4,2.6);
  \draw[mtwo] (1.7,0.9) rectangle (5.4,2.6);
  \foreach \x in {1.85,2.35,2.85} {\foreach \y in {1.05,1.6,2.15} {\draw[cont] (\x,\y) rectangle (\x+0.35,\y+0.3);}}
  \draw[->,green!40!black,thick] (0.2,1.75) -- (1.7,1.75);
  \draw[->,green!40!black,thick] (3.4,1.75) -- (5.2,1.75);
  \node[font=\scriptsize,anchor=north,align=center] at (2.6,0.6) {columns see roughly equal current;\\ route M2 `around the corner' first};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Count vias like width:** $n_{via} \ge \lceil I_{eq} f(T)\, g / i_{via}\rceil$, where $i_{via}$ is the PDK's per-via limit at $T_{ref}$, $f(T)$ the temperature factor (fold below) and $g \ge 1$ accounts for uneven sharing (from FEM) (Lienig & Thiele Eqs. 3.25–3.26).
- **Redundant (double) vias** raise yield (a via that fails to open, mask shift, bad fill) and give **2–4× longer EM life** through lower density and the reservoirs between vias (Lienig & Thiele Sec. 4.6). Digital flows add them post-route wherever space allows; **power nets get full arrays**.
- **Placement beats count:** put vias **across** the current (in line with the current direction of the connecting wires so all paths have equal length), at minimum spacing on the perpendicular to the bisector of the two wires. In a bend, the inside-corner via is overloaded; route one wire around the corner so the array sits in a straight run (Hastings Fig. 15.29, Lienig & Thiele Figs. 4.28–4.29).
- In Al systems only the **sidewalls facing the current** conduct; a contact between two leads conducts on two sides, a contact at a lead end on one (Hastings Fig. 5.3).

> [!note]- Detail: the via temperature factor and the reservoir trade-off
> $f(T_{eff}) = \dfrac{i_{via}(T_{ref})}{i_{via}(T_{eff})} = \exp\!\left[\frac{E_a}{nk}\left(\frac{1}{T_{ref}}-\frac{1}{T_{eff}}\right)\right]$, the inverse of the derating factor from Black's equation: $f>1$ (more vias) when the application runs hotter than the temperature at which $i_{via}$ was specified, $f=1$ when they are equal. 
>
> > [!warning] Unverified
> > Lienig & Thiele print Eq. 3.26 as $f = \exp\!\left[-\frac{E_a}{nkT_{ref}}\left(1-\frac{T_{ref}}{T_{eff}}\right)\right]$, which gives $f<1$ (fewer vias) for $T_{eff}>T_{ref}$; that contradicts Black's equation and their own statement that hotter operation needs more margin. The form above is the Black-consistent one; check your PDK's convention.
>
> Larger via pitch gives bigger inter-via reservoirs but softens the dielectric between metal layers (less back-stress) and degrades current sharing; minimum pitch is usually the right call. Unintended reservoirs between vias can cancel the expected lifetime gain on AC nets.

> [!tip] Remark
> The resistance side of a contact array (contacts in parallel, a few ohms each, plus crowding) is in [[Resistor#Contact Resistance]]; the enclosure rules that set how close vias can sit are in [[Layout Fundamentals]].

## Level 4: EM-Aware Analog Sizing

### Bias lines, power nets and output stages

```tikz title="Analog high-current routing. Left: a supply bus tapped by loads along its length carries less current downstream; tapering W(x) to follow I(x) keeps J constant. Right: strapping metal layers in parallel (top metal about 2x thicker) shares the current; at least three layers halve the density of the top layer alone. After Razavi Sec. 19.2.7 and Fig. 19.47."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  cont/.style={fill=black,draw=none},
  diel/.style={fill=gray!8,draw=black!40}]
  % tapered bus
  \node[font=\scriptsize\bfseries] at (3.6,3.3) {tapered bus (top view)};
  \draw[mtwo] (0,0.6) -- (7.2,1.35) -- (7.2,1.65) -- (0,2.4) -- cycle;
  \draw[->,very thick,red!70!black] (-1.2,1.5) -- (-0.1,1.5) node[midway,above,font=\scriptsize] {$I_T$};
  \foreach \x/\l in {1.5/1,3.2/2,4.9/3,6.6/4} {\draw[->,thick] (\x,1.5) -- (\x,0.0) node[below,font=\scriptsize] {$I_\l$};}
  \node[font=\scriptsize,align=center] at (3.6,-0.85) {$W(x)\propto I(x)$: constant $J$ and $dV/dx$};
  % stacked layers
  \begin{scope}[xshift=9.8cm]
  \node[font=\scriptsize\bfseries] at (2.0,3.3) {strapped layers (cross-section)};
  \draw[diel] (-0.2,-0.4) rectangle (4.2,2.9);
  \draw[mone] (0,0.0) rectangle (4,0.3);
  \draw[mtwo] (0,0.9) rectangle (4,1.2);
  \draw[fill=teal!50,draw=black!70] (0,1.8) rectangle (4,2.4);
  \foreach \x in {0.4,1.4,2.4,3.4} {\draw[cont] (\x,0.3) rectangle (\x+0.2,0.9); \draw[cont] (\x,1.2) rectangle (\x+0.2,1.8);}
  \node[font=\scriptsize,anchor=west] at (4.3,0.15) {M1, $t$};
  \node[font=\scriptsize,anchor=west] at (4.3,1.05) {M2, $t$};
  \node[font=\scriptsize,anchor=west] at (4.3,2.1) {top, $2t$};
  \node[font=\scriptsize,align=center] at (2.0,-0.85) {$t_{tot} = 4t = 2\times$ top alone;\\ needs vias along the whole run};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Procedure for an analog high-current net** (Hastings Secs. 13.1.4, 15.1, 15.3.4; Razavi Sec. 19.2.7):

1. **Find the currents per segment and per mode:** DC bias, average and RMS of switching or signal currents, peaks. Mark each high-current lead on the floorplan with its equivalent DC current and maximum allowed resistance.
2. **Pick the limit:** layer rule at the mission temperature (derate), lifetime and failure budget.
3. **Width and vias:** $W \ge I/(J t)$ everywhere along the lead, vias across the flow, no necking, no 90° inside corners.
4. **Then resistance:** in analog, **IR drop and gain/offset errors usually force wider metal than EM** (Hastings Sec. 15.1). Keep high-current leads short.
5. **Re-check after layout:** extract, simulate, verify densities (Level 5).

- **Bias lines** carry small, constant currents: EM rarely binds, but they are DC (no healing) and long; resistance (offset from IR drop) and coupling decide their width. Mirror and DAC ground buses carry the **sum** of many currents: check the trunk, not the branches.
- **Power buses:** strap layers (top metal ≈2× thicker, so at least three layers in parallel halve the density of the top layer alone) and taper when tap currents are known (Razavi). Vias must stitch the layers along the run or the lower layers carry nothing.
- **Output stages and power transistors:** the source/drain fingers carry their maximum current where they join the bus, $I_{max} \approx I_D/N$ for $N > 10$ fingers; the buses peak where they leave the device. Buses that do not span the whole device (two check points per finger: where it leaves the opposite bus and where it joins its own) and diagonal layouts with trapezoidal buses relax EM (Hastings Sec. 13.1.4, Figs. 13.16–13.17). For class-AB and switching output stages, size the supply metal on the average (DC-equivalent) current and check RMS heating and peaks separately.

> [!tip] Remark
> The power-transistor metallization procedure (guess metal ≈ ⅓ of $R_{on}$, fingers on M1, buses on M2/M3, iterate) is in [[Layout Fundamentals#Variant layouts]]; this note supplies the EM checks inside that loop.

### Wire width is also a performance knob

- In advanced nodes minimum-width wires are resistive enough to hurt analog performance. In a 7 nm OTA, widening two source-side wires from 1× to 3× minimum raised UGF from 688.5 MHz to 972.0 MHz and gain from 23 dB to 25 dB, because the wire resistance was degenerating the input pair's $G_m$ (Li et al., TODAES 2022, Fig. 1).
- Wire sizing alone improved a composite figure of merit by 11.5%; after transistor sizing it still added 19%. Optimized wire sizing gave 8–21% over unsized automated layouts.
- A useful manual classification from the same paper: **non-sensitive nets 1×, R-sensitive nets (sources, supplies) as wide as allowed (3×), RC-sensitive nets (high-impedance nodes) moderate (2×)**: too narrow costs $R$, too wide costs $C$. Symmetric nets get identical widths. Wider wires are realized as parallel routes.

> [!tip] Remark
> So the EM minimum width is a floor, not the answer. The final width of an analog net is the maximum of the EM width, the IR-drop width and the performance-optimal width, capped where the added capacitance starts to cost bandwidth ([[Single-Stage#Source Degeneration]], [[Capacitor#Fringing]]).

### Worked example: a bias bus and an output-stage lead

```tikz title="Worked example. Required M1 width versus lead length for 10 mA at 125 C: the EM width is flat (3.5 um), the IR-drop width grows linearly with length (10 mV budget, 100 mOhm/sq). Below L* = 34 um EM sets the width; above it resistance does. Numbers from Hastings Sec. 15.3.4 (EM rule) and Razavi Sec. 18.7.3 (sheet resistance)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,x=0.035cm,y=0.5cm]
  \draw[->] (0,0) -- (220,0) node[right,font=\scriptsize] {$L$ (µm)};
  \draw[->] (0,0) -- (0,11) node[above,font=\scriptsize] {$W_{req}$ (µm)};
  \foreach \l in {0,50,100,150,200} {\draw (\l,0) -- (\l,-0.15) node[below,font=\scriptsize] {\l};}
  \foreach \w in {0,2,4,6,8,10} {\draw (0,\w) -- (-3,\w) node[left,font=\scriptsize] {\w};}
  \fill[red!10] (0,0) rectangle (34.5,3.45);
  \draw[very thick,red!70!black] (0,3.45) -- (210,3.45) node[above left,font=\scriptsize] {EM: $W\ge I/(J t)=3.45$ µm};
  \draw[very thick,blue!70!black,domain=0:105] plot (\x,{0.1*\x/1});
  \node[font=\scriptsize,blue!70!black,anchor=west] at (108,10.0) {IR: $W \ge R_\square L I/\Delta V = 0.1\,L$};
  \draw[dashed] (34.5,0) -- (34.5,3.45);
  \fill (34.5,3.45) circle (0.08);
  \node[font=\scriptsize,anchor=north west] at (36,3.3) {$L^*=34$ µm};
  \node[font=\scriptsize,align=center] at (17,1.4) {EM\\ binds};
  \node[font=\scriptsize] at (150,1.4) {resistance binds};
\end{circuitikz}
\end{document}
```

**Given.** A class-A output stage draws a constant 10 mA from $V_{DD}$ through an M1 lead. A second lead feeds a pulsed driver: 40 mA pulses, duty $D = 0.25$, $f = 1$ MHz. Mission: 125 °C wire temperature for the rated life. Process rule (Hastings): Al-Cu, $5\times10^5$ A/cm² at 105 °C, $E_a = 0.7$ eV, $n=2$, minimum metal thickness 1 µm (10 kÅ), 50% step coverage in vias. For the parasitic estimate, Razavi's lower-metal numbers: $R_\square = 100$ mΩ/□, $c_a = 30$ aF/µm², $c_f = 80$ aF/µm (M1, two sides, 0.25 µm process).

**1. Limit at temperature.** Derating factor $\exp[4060\,(1/398 - 1/378)] = 0.58$ → $J_{max} = 2.9\times10^5$ A/cm². Per µm of width with $t = 1$ µm: $J_W = 2.9\times10^5 \times 10^{-4}\,\mathrm{cm}\times10^{-4}\,\mathrm{cm} = 2.9$ mA/µm.

**2. DC lead.** $W \ge 10/2.9 = 3.45$ µm → draw **3.5 µm** (add the PDK's width variation and etch loss, Lienig & Thiele Eq. 3.24).

**3. Pulsed lead.** $f = 1$ MHz $> 1/\tau$ (τ > 0.1 ms) so $t_{pulse} = t_{DC}/D^2 = 16\,t_{DC}$. With $n=2$ the allowed peak density rises by $1/D = 4$: $W \ge 40/(4 \times 2.9) = 3.45$ µm, **the same as for its 10 mA average**. Check RMS for heating separately: $I_{rms} = \sqrt{0.25}\times40 = 20$ mA, twice the average.

**4. Vias (Al sidewall model).** Sidewalls are $0.5 \times 1$ µm = 0.5 µm thick, so each µm of via edge **facing the current** carries $2.9\times10^5 \times (0.5\times10^{-4}) \times 10^{-4} = 1.45$ mA. 10 mA needs ≥ 6.9 µm of facing edge. Stacking vias one behind another adds nothing (only the front face of the front via conducts), so the edge must come from vias in a row **across** the lead; the lead is widened locally into a landing pad to fit them. With a barrier metal or W plugs, use the PDK's per-via current instead.

**5. Lifetime change.** If the product needs twice the rated lifetime at the same temperature, $J \propto t_{50}^{-1/n}$ gives $J_{max}/\sqrt2$ and $W \ge 4.9$ µm.

**6. Price it back.** For a 200 µm run at 3.5 µm: $R = 0.1 \times 200/3.5 = 5.7$ Ω, so **57 mV** of IR drop at 10 mA, far beyond a typical budget; $C = 30\text{ aF}\times 700 + 80\text{ aF}\times 200 = 21 + 16 = 37$ fF. With a 10 mV budget the crossover length is

$$
L^* = \frac{\Delta V}{R_\square J_W} = \frac{0.01}{0.1 \times 2.9\times10^{-3}} \approx 34\ \mu\mathrm{m}
$$

so beyond about 34 µm **resistance, not EM, sets the width**: the 200 µm run needs 20 µm (1 Ω, 10 mV), and its capacitance grows to $120 + 16 = 136$ fF. This is Hastings' observation that EM gives the lower bound and metal resistance usually forces wider leads. If this 5.7 Ω sat in the source of a $g_m = 10$ mS device, it would degenerate $G_m$ by $1/(1+0.057) $, about 5%.

> [!warning] Unverified
> The example mixes two sources on purpose: the EM rule and thickness from Hastings' Al-Cu example, the sheet resistance and capacitances from Razavi's 0.25 µm table. A real process ties $t$, $R_\square$ and $J_{max}$ together; the 10 mV budget and $g_m = 10$ mS are illustrative choices, not source values.

## Level 5: Verification Flow

### Terminal and segment currents

```tikz title="Why a single current per terminal is not enough. Each terminal gets lower and upper current bounds; the worst-case current in the segment between them follows from the bounds on each side. Here VT1 spans -1 to +2 mA and VT2 -3 to 0 mA, so the segment must be sized for 2 mA. After Lienig & Thiele Figs. 3.4 and 3.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  cont/.style={fill=black,draw=none}]
  \draw[mone] (0,1.0) rectangle (8,1.4);
  \draw[cont] (-0.3,0.95) rectangle (0.2,1.45); \node[font=\scriptsize,anchor=east,align=right] at (-0.4,1.2) {VT1 (LHS)\\ $[-1, +2]$ mA};
  \draw[cont] (7.8,0.95) rectangle (8.3,1.45); \node[font=\scriptsize,anchor=west,align=left] at (8.4,1.2) {VT2 (RHS)\\ $[-3, 0]$ mA};
  \draw[->,thick,red!70!black] (1.0,1.9) -- (7.0,1.9) node[midway,above,font=\scriptsize] {VT1 sources $+2$ while VT2 sinks $-3$: up to 2 mA flows};
  \node[font=\scriptsize,align=center,anchor=north] at (4.0,0.85) {$i_W = \max\{\min(|i_{L,LHS}|,|i_{U,RHS}|),\ \min(|i_{L,RHS}|,|i_{U,LHS}|)\}$\\ $= \max\{\min(1,0),\ \min(3,2)\} = 2$ mA};
\end{circuitikz}
\end{document}
```

- EM analysis starts from **currents per segment**, from transient (or quasi-static) simulation reduced to average, RMS and peak values, per operating mode (Lienig & Thiele Sec. 3.3).
- Each terminal gets **lower and upper bounds** per current type and mode, not one number: two terminals with opposite worst cases can drive a cross-current through a segment whose "net" current is zero. Sum the bounds on each side of a segment and take the worst case (Eqs. 3.5–3.7).
- Topology changes segment currents, so analog EM-aware routing first **plans the net topology** (Steiner points) to minimize current-weighted wire area, keeping high-current segments short, then routes point-to-point with known widths (Lienig & Thiele Sec. 3.3.3).

### From mission profile to sign-off

```tikz title="EM-aware analog design flow. Characterization gives rules at reference conditions; the mission profile scales them to effective limits; currents from simulation drive current-aware routing; verification flags violations, which are fixed by local decompaction (widen wires, add vias, add support polygons) rather than re-routing. After Lienig & Thiele Figs. 3.2, 3.11, 3.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  box/.style={draw,rounded corners=2pt,align=center,font=\scriptsize,minimum height=0.8cm,text width=3.4cm}]
  \node[box,fill=green!10] (ch) at (0,5.2) {technology characterization\\ ($j_{char}$, $T_{char}$, $E_a$, $n$, $\sigma$)};
  \node[box,fill=green!10] (rr) at (0,3.8) {reference rules ($j_{ref}$ at $T_{ref}$)};
  \node[box,fill=yellow!15] (mp) at (0,2.2) {mission profile\\ ($T$ vs time, lifetime, $q$)};
  \node[box,fill=green!10] (er) at (0,0.6) {effective limits per layer\\ $j_{eff}$, $i_{via}$};
  \draw[->,thick] (ch) -- (rr); \draw[->,thick] (rr) -- (mp); \draw[->,thick] (mp) -- (er);
  \node[box,fill=blue!10] (sim) at (5,5.2) {schematic + simulation:\\ terminal current bounds};
  \node[box,fill=blue!10] (rt) at (5,3.8) {floorplan, placement,\\ current-driven routing};
  \node[box,fill=blue!10] (ver) at (5,2.2) {extract, simulate, check\\ $J$ in every segment and via};
  \node[draw,diamond,aspect=2,font=\scriptsize,inner sep=1pt] (q) at (5,0.6) {violations?};
  \node[box,fill=red!10] (dc) at (9.6,0.6) {decompaction: widen,\\ add vias, support polygons};
  \node[box,fill=white] (ok) at (5,-0.9) {EM-robust layout};
  \draw[->,thick] (sim) -- (rt); \draw[->,thick] (rt) -- (ver); \draw[->,thick] (ver) -- (q);
  \draw[->,thick] (q) -- node[right,font=\scriptsize] {no} (ok);
  \draw[->,thick] (q.east) -- node[above,font=\scriptsize] {yes} (dc.west);
  \draw[->,thick] (dc.north) |- (rt.east);
  \draw[->,thick] (er.east) -- (2.5,0.6) |- (ver.west);
\end{circuitikz}
\end{document}
```

- **Inputs to a current-density check:** current bounds per terminal or segment, layout geometry, layer thicknesses, temperature (average or a thermal map near hot devices), and the per-layer limits (Lienig & Thiele Sec. 3.5.1).
- **Two kinds of checker:** (1) per segment, compare required vs drawn cross-section and via count; fast, good for digital and analog pre-checks. (2) FEM of the actual metal shape: exclude non-critical nets (sum of terminal currents below what a minimum wire can carry), cut critical nets into independent segments, mesh, solve $\vec j = \sigma\vec E$, flag elements over the limit, then discard "dummy errors" at sharp corner points.
- **Fix-up:** current-driven decompaction resizes only the flagged segments and via arrays and adds support polygons, avoiding a full re-route (Lienig & Thiele Sec. 3.6).
- **Digital vs analog:** digital flows classify nets (power DC, clock symmetric AC, signal asymmetric AC) and run sign-off DRC with EM rules plus SPICE-based segment currents. Analog layout is manual and every net may matter; currents span nA (sensors) to amps (power), and power and signal currents are of similar size.
- **Practice (Hastings Sec. 15.5):** commercial EM checkers are "of doubtful utility" for analog because the real waveforms are hard to know. Most analog designers **verify crucial power routing by hand**: generate plots of specific nets with a special DRC deck and look for pinch points, too few vias, unexpected narrow links. FEM tools (e.g. R3D) help on complicated geometries. Checklist item: *have the widths of all power wires been checked for electromigration compliance?*

## Design intuition / trade-offs

| Knob | What improves | What it costs |
|---|---|---|
| Wider wire | lower $J$ (EM, life ∝ $W^n$), lower $R$, less Joule heating | area, capacitance ($c_aWL$), routing blockage; near-bamboo widths can be worse in Al |
| Lower temperature (placement away from hot devices) | large: derating is exponential (125 → 105 °C ≈ 1.7× current) | floorplan constraints |
| Shorter segments (below $L_{Blech}$) | immortal segments, free current margin | more vias, each a new weak point |
| Via-below contact of critical segments | ~10× higher $jL$ tolerance (Cu) | layer assignment freedom |
| Via arrays across the flow | 2–4× life, yield, lower via $J$ | landing pad area, unintended reservoirs |
| Reservoir at cathode (DC nets) | ~5× Blech length | area; harmful on AC nets and with low-k |
| 135° corners, support polygons | removes corner hot spots | slightly odd geometry, off-grid |
| Strapping layers | shares current, lowers $R$ | consumes layers, blocks crossings |
| Slotting wide buses | CMP compliance, bamboo strips (Al) | less metal per outline width |
| Cu instead of Al | ≥5× current at 105 °C, 35% less $R$ | advantage shrinks with $T$ ($n\approx1$), parity ≈175 °C |
| Size on average (AC nets) instead of RMS | narrower signal and clock wires | must still check RMS heating and peaks |
| Mission profile instead of worst case | much narrower power metal | needs a credible usage profile; re-verify on reuse |

## Cheat sheet

| Quantity | Result |
|---|---|
| Current density | $J = I/(Wt)$, $W_{min} = I_{max}/(J_{max}t_{min})$ |
| Black's equation | $t_{50} = A J^{-n}e^{E_a/kT}$; $n=2$ nucleation, $n=1$ growth |
| Activation energies | Al-Cu ≈0.7 eV, Cu 0.8–0.9 eV, pure Al ≈0.5 eV |
| Temperature derating | $J_j/J_0 = \exp[\frac{E_a}{nk}(\frac1{T_j}-\frac1{T_0})]$; 105→125 °C: 0.58 (0.7 eV, $n=2$) |
| Lifetime scaling | $J \propto t_{50}^{-1/n}$ |
| Reference limit | $j_{ref} = j_{char}/(AF_T AF_q AF_{TF})$, $q_{eff}\approx 1/m$ |
| Joule heating | $\Delta T = I^2t_{ox}R_s/(\kappa W^2)$; design ΔT ≈ 5 °C |
| Pulsed DC | $t_{pulse} = t_{DC}/D$ ($f<1/\tau$), $t_{DC}/D^2$ ($f>1/\tau$), $\tau>0.1$ ms |
| Pulsed/AC currents | $I_{avg} = DI_p$, $I_{rms} = \sqrt{D}I_p$; AC > 10 kHz rarely fails |
| Net flux | $J_a = \frac{Dc}{kT}(\rho jz^*e - \Omega\,\partial\sigma/\partial x)$ |
| Blech product | $(jL)_B = \Omega\Delta\sigma/(ez^*\rho)$; Al ≈1200 A/cm, Cu 375–3700 A/cm |
| Via-above vs via-below (Cu) | $(jL)_c \approx 375$ vs 3700 A/cm |
| Wire width (rule) | $W = \max(I_{eq}/(j_{eff}t), I_{peak}/(j_{peak}t), W_{min})$ |
| Via count | $n_{via} = \lceil I_{eq} f(T) g/i_{via}\rceil$, $f = \exp[\frac{E_a}{nk}(\frac1{T_{ref}}-\frac1{T_{eff}})]$ |
| Finger current (power MOS) | $I_{max}\approx I_D/N$ |
| EM vs IR crossover | $L^* = \Delta V/(R_\square J_W)$ |

## References

- **Lienig & Thiele**, *Fundamentals of Electromigration-Aware Integrated Circuit Design*, Springer 2018 (PDF page = printed + 12). Ch. 1.3 (trends, Figs. 1.4–1.6); Ch. 2 (pp. 13–45): mechanisms, Black's equation (Eq. 2.1), Table 2.1, temperature (Fig. 2.7), Cu barriers, self-healing (Eqs. 2.6–2.8, Fig. 2.13), skin effect, mechanical stress (Eqs. 2.12–2.13), TM/SM and coupling (Eqs. 2.15–2.20). Ch. 3 (pp. 61–96): design flows (Figs. 3.2–3.3), current types (Sec. 3.3.1), terminal and segment currents (Eqs. 3.1–3.7), mission profiles and limits (Eqs. 3.8–3.20, Figs. 3.11–3.12), verification (Sec. 3.5), wire and via sizing (Eqs. 3.21–3.26), decompaction (Sec. 3.6). Ch. 4 (pp. 99–140): bamboo, Blech/critical length (Eqs. 4.1–4.9), via-above/below, reservoirs, multiple vias (Figs. 4.20–4.29), frequency and net classes, materials (Tables 4.2–4.5). Ch. 5 summary (pp. 149–153).
- **Hastings**, *The Art of Analog Layout*, 3rd ed. Sec. 2.7 (Al-Cu, barrier metal, step coverage, Cu); Sec. 5.1.1 (Arrhenius, self-heating Eqs. 5.7–5.8); Sec. 5.1.3 (pp. 216–219: Black's law Eq. 5.10, Blech length, activation energies, Cu vs Al, rule scaling Eqs. 5.11–5.12, contacts and vias Fig. 5.3, pulsed current Eq. 5.13); Sec. 13.1.4 (power-transistor metallization, $I_D/N$); Sec. 14.4.3 (ESD width rules); Sec. 15.1 (high-current leads on the floorplan); Sec. 15.3.4 (pp. 820–821: MIL-M-38510 value, Eqs. 15.24–15.25, 25 → 15 mA example, corners, Fig. 15.29); Sec. 15.5 (checklist).
- **Razavi**, *Design of Analog CMOS Integrated Circuits*, 2nd ed. Sec. 18.7.3 (p. 729: 2 mA/µm rule, sheet resistances, Table 18.1 capacitances); Sec. 19.2.7 (p. 757: parallel layers, tapered bus, Fig. 19.47).
- **Li, Lin, Madhusudan, Sharma, Sapatnekar, Harjani, Hu**, "Performance-driven Wire Sizing for Analog Integrated Circuits," ACM TODAES 2022 (Fig. 1 OTA example, Sec. 6.2 results, Sec. 6.4 manual R/RC classification).
- Carusone, Johns & Martin, *Analog Integrated Circuit Design*: no electromigration content found.
- Zettelkasten extensions: `15h2 Electromigration Caps Current Density Near Two Milliamps Per Micron` (EM vs IR-drop crossover length) and `15p2 Power Buses Need Parallel Metal Layers and Tapered Widths` (three-layer strapping arithmetic).
