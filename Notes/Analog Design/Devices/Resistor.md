---
title: Resistor
description: The integrated resistor from squares to materials, tolerance, TC, voltage coefficient, parasitics, layout and trimming, ending in which resistor to draw for a given circuit need.
kind: topic
status: growing
aliases:
  - Resistor
  - Resistors
  - Integrated Resistors
---

An integrated resistor is a strip of some conducting layer with a contact at each end. The first section treats it as $R = R_\square L/W$; each section after that adds what the strip really does: process spread, temperature, voltage, contacts, parasitic capacitance, layout and trimming. Stop anywhere and the picture is still correct, just coarser.

## The big picture

```tikz title="A silicide-blocked poly resistor (top view) and its first-order model. Current enters through silicided heads; only the unsilicided body between the inner contact edges counts as L_d. After Hastings Figs. 6.2, 6.10, 6.20(A) and Carusone Fig. 1.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % legend
  \begin{scope}[shift={(0,3.6)}]
    \draw[fill=red!30] (0,0) rectangle (0.4,0.25); \node[anchor=west,font=\scriptsize] at (0.45,0.12) {poly};
    \draw[fill=green!30] (1.5,0) rectangle (1.9,0.25); \node[anchor=west,font=\scriptsize] at (1.95,0.12) {diffusion};
    \draw[fill=blue!30] (3.4,0) rectangle (3.8,0.25); \node[anchor=west,font=\scriptsize] at (3.85,0.12) {metal 1};
    \draw[fill=violet!35] (5.1,0) rectangle (5.5,0.25); \node[anchor=west,font=\scriptsize] at (5.55,0.12) {metal 2};
    \draw[fill=black] (6.85,0.02) rectangle (7.06,0.23); \node[anchor=west,font=\scriptsize] at (7.1,0.12) {contact};
    \draw[fill=gray!55] (8.4,0) rectangle (8.8,0.25); \node[anchor=west,font=\scriptsize] at (8.85,0.12) {silicide};
    \draw[dashed,thick,orange] (10.05,0) rectangle (10.45,0.25); \node[anchor=west,font=\scriptsize] at (10.5,0.12) {silicide block};
    \draw[dashed] (0,-0.5) rectangle (0.4,-0.25); \node[anchor=west,font=\scriptsize] at (0.45,-0.38) {well};
  \end{scope}
  % resistor top view
  \draw[fill=red!30] (0,0.6) rectangle (7,1.6);
  \draw[fill=gray!55] (0,0.6) rectangle (1.2,1.6);
  \draw[fill=gray!55] (5.8,0.6) rectangle (7,1.6);
  \draw[dashed,thick,orange] (1.0,0.35) rectangle (6.0,1.85);
  \draw[fill=blue!30,opacity=0.6] (-0.6,0.75) rectangle (0.95,1.45);
  \draw[fill=blue!30,opacity=0.6] (6.05,0.75) rectangle (7.6,1.45);
  \foreach \x in {0.3,0.65} { \draw[fill=black] (\x,0.95) rectangle ({\x+0.22},1.25); }
  \foreach \x in {6.15,6.5} { \draw[fill=black] (\x,0.95) rectangle ({\x+0.22},1.25); }
  \draw[<->] (0.87,0.15) -- (6.15,0.15) node[midway,below,font=\scriptsize] {$L_d$ (inner contact edge to inner contact edge)};
  \draw[<->] (7.9,0.6) -- (7.9,1.6) node[midway,right,font=\scriptsize] {$W_d$};
  \node[font=\scriptsize] at (3.5,1.1) {unsilicided body, $R_\square$};
  % model
  \begin{scope}[shift={(9.4,0)}]
    \draw (0,1.6) node[ocirc]{} node[above]{T1} to[R,l=$R$] (3,1.6) node[ocirc]{} node[above]{T2};
    \draw (0.5,1.6) node[circ]{} to[C,l_=$C/2$] (0.5,0) node[ground]{};
    \draw (2.5,1.6) node[circ]{} to[C,l=$C/2$] (2.5,0) node[ground]{};
    \node[font=\scriptsize,align=center] at (1.5,-1.0) {$C$ = body area $\times$ oxide\\ capacitance to substrate};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Squares:** $R = R_\square\,\dfrac{L}{W}$. The mask fixes $L/W$; the process fixes $R_\square$. A $90^\circ$ corner counts about half a square.
> 2. **Absolute value is poor, ratios are excellent.** Sheet resistance is held to only about $\pm20$–$30\%$, but two identical neighbouring resistors match to about $0.1$–$0.2\%$. Design circuits whose answer depends on a resistor *ratio*.
> 3. **Material sets everything else.** Silicide-blocked poly is the default analog resistor (linear, low parasitic, no junction). Diffusions and wells give more $\Omega/\square$ but bring a junction: voltage dependence, capacitance, leakage. Metal gives milliohms.
> 4. **Drift:** $R(T) = R_0[1+\alpha(T-T_0)]$ and $R(V) = R_0[1+\beta_1 V + \beta_2 V^2]$. TC runs from about $-1000$ to $+6000$ ppm/°C depending on material; lightly doped layers are the most voltage dependent.
> 5. **It is a distributed RC.** A resistor carries capacitance to the substrate along its whole length (a $\pi$ model with $C/2$ at each end); a wide, long, high-value resistor is also a low-pass filter.

**Map:** [[#Spec translation|spec → device]] → [[#Level 1 Sheet Resistance and Geometry|squares and geometry]] → [[#Level 2 Resistor Types|materials]] → [[#Level 3 Variability|process, temperature, voltage, contacts]] → [[#Level 4 Parasitics and High Frequency|parasitics, RF behaviour]] → [[#Layout|layout]] → [[#Adjusting Resistor Values|tweaking and trimming]].

## Spec translation

A resistor is not an amplifier, so this section maps the **circuit's resistor requirements** onto a **device type and geometry**, the way [[gm-ID Design Methodology]] maps amplifier specs onto $g_m/I_D$, $L$ and $I_D$.

```tikz title="Where each CMOS-relevant resistor sits: sheet resistance against process spread. Filled marks are deposited (no junction); hollow marks are junction-isolated diffusions. Numbers from Hastings Table 6.7, Hastings Sec. 6.5.7, and Razavi Sec. 19.2.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x: log10(Rs) from -2 to 4 -> 0..9 ; y: spread % 0..55 -> 0..5.5
  \draw[->] (0,0) -- (9.6,0) node[right] {$R_\square$ ($\Omega/\square$)};
  \draw[->] (0,0) -- (0,5.9) node[above] {process spread ($\pm\%$)};
  \foreach \e/\lab in {-2/{0.01},-1/{0.1},0/{1},1/{10},2/{100},3/{1k},4/{10k}} { \draw ({1.5*(\e+2)},0.08) -- ({1.5*(\e+2)},-0.08) node[below,font=\scriptsize] {\lab}; }
  \foreach \s in {10,20,30,40,50} { \draw (0.08,{\s/10}) -- (-0.08,{\s/10}) node[left,font=\scriptsize] {\s}; }
  % deposited (filled)
  \foreach \r/\v/\lab/\a in {0.05/20/{metal}/above, 5/20/{LSR poly}/below, 200/20/{MSR poly}/below, 500/30/{HSR poly}/above, 5000/50/{VHSR poly}/left} {
    \pgfmathsetmacro{\xx}{1.5*(log10(\r)+2)}
    \fill[blue!60!black] (\xx,{\v/10}) circle (0.09);
    \node[\a,font=\scriptsize] at (\xx,{\v/10}) {\lab};
  }
  % silicided poly from Razavi: 20-30 ohm/sq, 20-30 %
  \draw[blue!60!black,thick] ({1.5*(log10(20)+2)},2.0) rectangle ({1.5*(log10(30)+2)},3.0);
  \node[font=\scriptsize,anchor=east] at ({1.5*(log10(20)+2)-0.05},2.75) {silicided poly (Razavi)};
  % diffused (hollow)
  \foreach \r/\v/\lab/\a in {30/20/{NSD}/below, 50/20/{PSD}/above right, 2000/40/{n-well}/right, 5000/50/{n-well pinch}/right} {
    \pgfmathsetmacro{\xx}{1.5*(log10(\r)+2)}
    \draw[thick,red!70!black,fill=white] (\xx,{\v/10}) circle (0.1);
    \node[\a,font=\scriptsize] at (\xx,{\v/10}) {\lab};
  }
  \node[font=\scriptsize,anchor=south east] at (9.2,0.05) {thin film: $\pm20\%$ as deposited, $\pm0.05\%$ after laser trim};
\end{circuitikz}
\end{document}
```

**The resistor's own specs:** value $R$; absolute tolerance $\pm\delta R$; ratio matching to a neighbour; temperature coefficient (TC); voltage coefficient (VC, i.e. linearity); parasitic capacitance (bandwidth); power and current handling; voltage rating; area.

| Circuit need (where it comes from) | Device choice | Geometry knob | Why |
|---|---|---|---|
| Large $R$ in small area, value not critical (bias, start-up, DC-blocking bias resistor) | HSR/VHSR poly; n-well if no high-sheet poly | Minimum width, many squares | Area $\propto R/R_\square$ |
| Absolute value within a few % (RC filter corner, termination) | Silicide-blocked poly; trim if tighter | $W$ 2–3× minimum; or trim network | $\delta R \approx \delta W/W + \delta R_\square$ |
| Ratio accuracy 0.1% (gain, bandgap, DAC ladder) | Silicide-blocked poly or thin film | Identical unit segments, common centroid, dummies | Common errors cancel in a ratio; see [[#Layout]] |
| Low TC (reference, timing) | Thin film; or poly near its zero-TC doping; or series/parallel mix of $\pm$TC poly | Mix ratio | $\alpha_{tot}$ is the weighted sum |
| Linearity (feedback resistor, I-V converter, ADC input) | Heavily doped poly or metal; never wells or pinched layers | Long $L$ (velocity saturation, grain voltage, self-heating) | VC grows as doping falls |
| Bandwidth (high-$R$ node at high $f$) | High $R_\square$ (fewer squares) and narrow $W$ | Minimum body area | $\tau \propto R\,C_{area}\,WL$ |
| Current sense, low $R$ | Metal, Kelvin-connected | Force and sense leads | Contact and lead drops excluded |
| High power / ESD | Diffused (NSD, PSD) | Wide | Silicon conducts heat; oxide does not |
| High voltage | Poly on field oxide, or diffusions under ~2/3 breakdown | Spacing to neighbours $\ge$ rule for $\Delta V$ | Breakdown of junction or ILO |

> [!tip] Remark
> The noise of any resistor is the thermal $4kTR$ of [[Noise]]; a resistor's value is therefore also a noise spec. Its mismatch statistics (how $\sigma$ falls with area) belong to [[Device Matching]]; this note owns only what makes a single resistor's value move.

The inequalities that land in the open:

$$
\boxed{\delta R \simeq \left(\frac{\delta W}{W} + \frac{\delta R_\square}{100\%}\right)\cdot 100\%}
\qquad
\boxed{L_{min} = (10\ \mu\text{m/V})\,V_{max}\ \text{(N-type)},\quad (3.3\ \mu\text{m/V})\,V_{max}\ \text{(P-type)}}
$$

> [!note]- Derivation: from a tolerance spec to a minimum width (Hastings Eq. 6.12)
> $R = R_\square L/W$, so to first order $\delta R/R = \delta R_\square/R_\square + \delta L/L - \delta W/W$. Resistors are much longer than wide, so the $\delta L/L$ term drops out and the two remaining errors add in the worst case.
>
> **Worked example (Hastings Sec. 6.3.1):** poly with $\delta R_\square = \pm20\%$ and linewidth control $\delta W = \pm0.05\ \mu$m:
>
> | $W$ | $\delta W/W$ | $\delta R$ |
> |---|---|---|
> | $0.5\ \mu$m | 10% | $\pm30\%$ |
> | $1\ \mu$m | 5% | $\pm25\%$ |
> | $10\ \mu$m | 0.5% | $\pm21\%$ |
>
> Widening helps until $\delta R_\square$ dominates; past that only trimming helps. Linewidth control is about $\pm10\%$ of the minimum feature for a deposited layer (0.25 µm CMOS: $\pm0.03\ \mu$m), and about $\pm10\%$ of minimum feature plus $\pm5\%$ of junction depth for a diffusion.

> [!note]- Derivation: minimum length for linearity (Hastings Eqs. 6.17–6.18)
> Carrier mobility in silicon starts to fall above about $0.2$ V/µm for electrons and $0.6$ V/µm for holes (velocity saturation, the same physics as [[MosFETs#Velocity Saturation]]). Keep the field $V_{max}/L$ under half that critical field: $L \ge 2V_{max}/E_c$, i.e. $10\ \mu$m per volt for N-type and $3.3\ \mu$m per volt for P-type.
>
> Poly has a second limit: if a single grain boundary drops an appreciable voltage, its barrier resistance becomes bias dependent. It is negligible when $L$ exceeds about $1000\times$ the grain diameter ($0.05\ \mu$m grains → $50\ \mu$m); in practice $10\ \mu$m is not severe.

**Where the specs land in sizing:**

| Spec | Sets |
|---|---|
| $R$ and $R_\square$ | Square count $L/W$ |
| Tolerance, matching | $W$ (and with it $L$ and area) |
| VC | Material, and minimum $L$ |
| TC | Material (doping) only |
| Parasitic $C$ / bandwidth | Body area $WL$, so prefer high $R_\square$ and small $W$ |
| Power | $W$ (heat spreading), material |

**Worked examples** (all from the sources):
- Carusone Ex. 1.19: 50 kΩ from $500\ \Omega/\square$ poly in $1\ \mu$m × $5\ \mu$m strips: each strip is 5 squares = 2.5 kΩ, so 20 strips in series.
- Carusone Ex. 2.7: four fingers of 10 squares of $800\ \Omega/\square$ poly, two parallel 20 Ω contacts per end: $4\times(8\ \text{k}\Omega + 20\ \Omega)\approx 32$ kΩ. Contacts are under 0.3% of the total, which is the point.
- Hastings Sec. 6.4: a 1 µm-wide poly resistor of 1000 squares over field oxide ($0.05\ \text{fF}/\mu\text{m}^2$) carries about 50 fF. At $500\ \Omega/\square$ that is $R = 500$ kΩ and $RC = 25$ ns, a corner near 6 MHz: high-value resistors are slow.

## Level 1: Sheet Resistance and Geometry

### Squares

```tikz title="A homogeneous slab (left): R = rho L/(W t). Any square of the same film has the same resistance R_s regardless of size, so a resistor is counted in squares (right). After Hastings Fig. 6.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % slab
  \draw[fill=red!20] (0,0) -- (4,0) -- (4.8,0.6) -- (0.8,0.6) -- cycle;
  \draw[fill=red!30] (0,0) -- (4,0) -- (4,-0.35) -- (0,-0.35) -- cycle;
  \draw[fill=red!40] (4,0) -- (4.8,0.6) -- (4.8,0.25) -- (4,-0.35) -- cycle;
  \draw[fill=gray!50] (0,0) -- (0.8,0.6) -- (0.8,0.25) -- (0,-0.35) -- cycle;
  \draw[<->] (0,-0.6) -- (4,-0.6) node[midway,below,font=\scriptsize] {$L$};
  \draw[<->] (5.0,0.6) -- (5.0,0.25) node[midway,right,font=\scriptsize] {$t$};
  \draw[<->] (4.2,-0.35) -- (5.0,0.25);
  \node[font=\scriptsize] at (4.95,-0.15) {$W$};
  \node[font=\scriptsize] at (2.4,1.0) {$R=\rho\dfrac{L}{Wt}=R_\square\dfrac{L}{W}$, $\ R_\square=\rho/t$};
  % squares
  \begin{scope}[shift={(6.5,-0.5)}]
    \draw[fill=red!30] (0,0) rectangle (1,1); \node[font=\scriptsize] at (0.5,0.5) {1 sq};
    \draw[fill=red!30] (1.6,0.25) rectangle (2.1,0.75); \node[font=\scriptsize,below] at (1.85,0.25) {1 sq};
    \draw[fill=red!30] (2.7,0.25) rectangle (5.7,1.25);
    \foreach \x in {3.7,4.7} \draw[dashed] (\x,0.25) -- (\x,1.25);
    \node[font=\scriptsize] at (4.2,-0.05) {3 squares $=3R_\square$};
    \node[font=\scriptsize,align=center] at (2.9,1.75) {size does not matter;\\ only $L/W$ does};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R = R_\square\,\frac{L}{W},\qquad R_\square = \frac{\rho}{t}\ \ (\Omega/\square)}
$$

A diffusion's resistivity varies with depth, so its sheet resistance is $R_\square = \left(\int_0^{x_j} dx/\rho(x)\right)^{-1}$, which in practice is measured, not computed. For a uniformly doped layer of depth $H$, $R_\square = 1/(q\mu_n H N_D)$ (Carusone Eq. 1.134).

> [!note]- Detail: resistivities of the materials on a die (Hastings Table 6.2, at 25 °C)
> | Material | $\rho$ ($\Omega\cdot$cm) |
> |---|---|
> | Copper, bulk | $1.7\times10^{-6}$ |
> | Aluminum, thin film | $2.7\times10^{-6}$ |
> | Al + 2% Si, thin film | $3.8\times10^{-6}$ |
> | TiW (40% W) | $7.5\times10^{-5}$ |
> | TiN, sputtered | $4.3\times10^{-5}$ |
> | TiSi$_2$ (C54), CoSi$_2$ | $1.5\times10^{-5}$ |
> | NiSi | $1.1\times10^{-5}$ |
> | Si, $N_d=10^{18}$ cm$^{-3}$ | 0.25 |
> | Si, $N_d=10^{15}$ cm$^{-3}$ | 48 |
> | Intrinsic Si | $2.5\times10^{5}$ |
>
> Example (Hastings): 10 squares of $150\ \Omega/\square$ is 1.5 kΩ.

### Effective Dimensions and Contacts

```tikz title="Strip resistor (left): contacts narrower than the body, so current crowds inward and R rises slightly. Dogbone (right): current spreads into the enlarged heads and R falls. After Hastings Figs. 6.2 and 6.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=red!30] (0,0) rectangle (5,1.2);
  \draw[fill=black] (0.25,0.35) rectangle (0.75,0.85);
  \draw[fill=black] (4.25,0.35) rectangle (4.75,0.85);
  \foreach \y in {0.1,0.6,1.1} { \draw[->,blue!70!black] (1.6,\y) -- (0.85,{0.6+0.45*(\y-0.6)}); \draw[->,blue!70!black] (4.15,{0.6+0.45*(\y-0.6)}) -- (3.4,\y); }
  \draw[<->] (0.75,-0.3) -- (4.25,-0.3) node[midway,below,font=\scriptsize] {$L_d$};
  \draw[<->] (-0.3,0) -- (-0.3,1.2) node[midway,left,font=\scriptsize] {$W_d$};
  \node[font=\scriptsize] at (2.5,1.55) {strip: crowding adds $\Delta R>0$};
  \begin{scope}[shift={(6.6,0)}]
    \draw[fill=red!30] (0,-0.2) -- (1.2,-0.2) -- (1.2,0.35) -- (3.8,0.35) -- (3.8,-0.2) -- (5,-0.2) -- (5,1.4) -- (3.8,1.4) -- (3.8,0.85) -- (1.2,0.85) -- (1.2,1.4) -- (0,1.4) -- cycle;
    \draw[fill=black] (0.25,0.2) rectangle (0.95,1.0);
    \draw[fill=black] (4.05,0.2) rectangle (4.75,1.0);
    \foreach \y in {-0.05,0.6,1.25} { \draw[<-,blue!70!black] (0.98,\y) -- (1.6,0.6); \draw[->,blue!70!black] (3.4,0.6) -- (4.02,\y); }
    \draw[<->] (1.2,-0.5) -- (3.8,-0.5) node[midway,below,font=\scriptsize] {$L_d$};
    \draw[<->] (5.3,0.35) -- (5.3,0.85) node[midway,right,font=\scriptsize] {$W_d$};
    \node[font=\scriptsize] at (2.5,1.75) {dogbone: spreading gives $\Delta R<0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R = R_\square\,\frac{L_d + L_b}{W_d + W_b}}
$$

- $W_b, L_b$ are **process biases** (lithography, etch, outdiffusion). $W_b$ matters far more because resistors are long and narrow. For a diffusion, $W_b\approx 20\%$ of junction depth (a 1.25 µm base gives 0.25 µm, a 5% error on a 5 µm resistor).
- **Contact crowding** in a strip adds only $\approx0.05$ squares per resistor end-pair for a 5 µm strip with 3 µm contacts: under 1% for any resistor over 10 squares. Make accurate segments **at least 10 µm long** and ignore it.
- **Dogbone heads** subtract: $\Delta R = -0.7\,\square$ with overlap $W_o = W_d$, $-0.3\,\square$ with $W_o = W_d/2$ (two heads). Dogbones pack worse and are *not* more accurate: matched resistors only need identical sections.

> [!note]- Derivation: the contact-crowding correction (Hastings Eq. 6.8, Ting and Chen)
> With $k = W/(W-W_c)$ ($W_c$ the contact width),
> $$\Delta R = \frac{R_\square}{\pi}\left[\frac1k\ln\frac{k+1}{k-1} + \ln\frac{k^2-1}{k^2}\right]$$
> for both ends together. Valid for $W_c\gg W-W_c$. Vertical crowding into the contact is lumped into contact resistance and is negligible once $L > 20\times$ the film thickness.

### Serpentines and Corners

```tikz title="Each square corner of a serpentine adds about 0.56 square (left). R = R_s[(2A+B)/W + 1.12] for the two-corner fold. The general corner between widths W and aW is the shaded square (right). After Hastings Figs. 6.3(A) and 6.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=red!30] (0,0) -- (0,4) -- (2.4,4) -- (2.4,0) -- (1.6,0) -- (1.6,3.2) -- (0.8,3.2) -- (0.8,0) -- cycle;
  \fill[red!55] (0,3.2) rectangle (0.8,4);
  \fill[red!55] (1.6,3.2) rectangle (2.4,4);
  \draw (0,0) -- (0,4) -- (2.4,4) -- (2.4,0) -- (1.6,0) -- (1.6,3.2) -- (0.8,3.2) -- (0.8,0) -- cycle;
  \draw[fill=black] (0.2,0.2) rectangle (0.6,0.6);
  \draw[fill=black] (1.8,0.2) rectangle (2.2,0.6);
  \draw[<->] (-0.3,0.6) -- (-0.3,3.2) node[midway,left,font=\scriptsize] {$A$};
  \draw[<->] (0.8,-0.3) -- (1.6,-0.3) node[midway,below,font=\scriptsize] {$B$};
  \draw[<->] (0,4.3) -- (0.8,4.3) node[midway,above,font=\scriptsize] {$W$};
  \node[font=\scriptsize,anchor=west] at (2.6,3.6) {corner $\approx 0.56\,\square$};
  \begin{scope}[shift={(5.5,0.5)}]
    \draw[fill=red!30] (0,2) rectangle (2,3);
    \draw[fill=red!30] (2,0) rectangle (3.4,3);
    \fill[red!55] (2,2) rectangle (3.4,3);
    \draw (2,2) rectangle (3.4,3);
    \draw[<->] (-0.3,2) -- (-0.3,3) node[midway,left,font=\scriptsize] {$W$};
    \draw[<->] (2,-0.3) -- (3.4,-0.3) node[midway,below,font=\scriptsize] {$aW$};
    \node[font=\scriptsize,anchor=west] at (3.6,2.5) {adds $N$ squares};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{square corner} \approx 0.56\,\square\ (\text{"half a square"}),\qquad 180^\circ\ \text{round end} \approx 2.96\,\square}
$$

> [!note]- Detail: the general corner (Hastings Eq. 6.10, Hall)
> $$N = \frac1a - \frac2\pi\ln\frac{4a}{a^2+1} + \frac{a^2-1}{\pi a}\cos^{-1}\frac{a^2-1}{a^2+1}$$
> which gives 0.5587 for $a=1$. Round turns ($R = R_\square(2C/W + 2.96)$) are used in high-voltage resistors, where sharp corners lower breakdown.

> [!tip] Remark
> Razavi (Sec. 19.2.6) prefers straight units in parallel joined by metal over a serpentine for matching, because the corner contribution is the least reproducible part. See the good/bad comparison in [[#Layout]].

## Level 2: Resistor Types

> [!tip] Remark
> How each layer is made (silicide, silicide block mask, wells, STI) is in [[CMOS Processing]]; here only what each layer does as a resistor.

### Silicide-Blocked Poly (the default)

```tikz title="Cross-section of a silicide-blocked poly resistor. Silicide stays on the heads for low contact resistance; the block mask keeps it off the body. The only parasitic is oxide capacitance to the substrate: no junction. After Razavi Fig. 18.13 and Hastings Fig. 6.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (10,1.4); \node[font=\scriptsize] at (9.1,0.4) {p-substrate};
  \fill[gray!15] (0.6,1.4) rectangle (9.4,2.0); \node[font=\scriptsize] at (8.7,1.65) {field oxide / STI};
  \draw (0,1.4) -- (10,1.4);
  \draw[fill=red!30] (1.2,2.0) rectangle (8.8,2.35);
  \draw[fill=gray!55] (1.2,2.35) rectangle (2.6,2.5);
  \draw[fill=gray!55] (7.4,2.35) rectangle (8.8,2.5);
  \draw[dashed,thick,orange] (2.4,2.65) -- (7.6,2.65); \node[font=\scriptsize,orange!70!black] at (5,2.85) {silicide block};
  \draw[fill=black] (1.7,2.5) rectangle (2.0,3.3); \draw[fill=black] (8.0,2.5) rectangle (8.3,3.3);
  \draw[fill=blue!30] (1.2,3.3) rectangle (2.5,3.55); \draw[fill=blue!30] (7.5,3.3) rectangle (8.8,3.55);
  \node[font=\scriptsize] at (5,2.17) {doped poly body};
  \foreach \x in {3.2,4.2,5.2,6.2,7.0} { \draw[->,gray] (\x,2.0) -- (\x,1.45); }
  \node[font=\scriptsize,anchor=west] at (2.8,1.15) {$C\approx 0.05$ fF/µm$^2$ (Hastings) or 90 aF/µm$^2$ (Razavi) to substrate};
  \draw[<-] (2.55,2.42) -- (3.2,3.2) node[above,font=\scriptsize] {silicided head};
\end{circuitikz}
\end{document}
```

- Unsilicided doped poly runs from about **50 to a few hundred $\Omega/\square$** (Razavi Sec. 18.7.2), up to **100–1500 $\Omega/\square$** with a dedicated implant (Carusone Sec. 2.4.3); spread about $\pm20\%$. Very-high-sheet poly ($\ge5$ k$\Omega/\square$) gives megohms but varies by $\pm50\%$.
- **Advantages:** no junction (no body effect, no leakage, no forward-bias risk), low capacitance (about 90 aF/µm² bottom plate and 100 aF/µm fringe, Razavi), linear when long, mismatch about **0.2%** for units a few microns on a side (Razavi).
- **TC depends on doping**: heavy doping gives a positive TC ($70\ \Omega/\square$: $+500$ ppm/°C), light doping negative (500 $\Omega/\square$: $-1000$; 10 k$\Omega/\square$: $-7000$). A **zero-TC** point exists near $200$–$300\ \Omega/\square$ for 4 kÅ films, but varies by about $\pm100$ ppm/°C.
- Place it over **field oxide**, not thin oxide (less parasitic). Its power handling is poor: oxide conducts heat badly, and overheating permanently shifts its value.

$$
\boxed{R = R_\square\frac{L_d - 2L_b}{W_d+W_b} + 2R_h\frac{L_h+L_b}{W_d+W_b}}
$$

(body plus two heads, Hastings Eq. 6.22; with silicided heads the second term is usually dropped).

> [!note]- Why: the negative TC of high-sheet poly (Hastings Sec. 6.5.7)
> Most materials have a positive TC because lattice scattering lowers mobility as temperature rises. Lightly doped poly is different: its resistance comes mainly from grain boundaries, where trapped charge creates potential barriers. Higher temperature releases trapped carriers and helps carriers over the barriers, so resistance falls. Doping is not the only variable: grain size and anneal set the barriers, which is why high-sheet poly is so process-variable. "Ramped" poly (furnace temperature graded along the boat) causes wafer-to-wafer spread in high-sheet poly; analog fabs ideally use "flat" poly.

> [!note]- Detail: making high-sheet poly in a digital flow (Hastings Fig. 6.20)
> Digital processes silicide the gate poly to 2–5 $\Omega/\square$ (unsilicided gate poly is only 25–50 $\Omega/\square$). Two masks recover a resistor: a **silicide block** over the body, and in blanket-doped processes a **gate doping block** so a lighter implant sets the body. Dopant diffuses quickly along poly grain boundaries, so the doping block must overlap the body by several microns (a large length bias $L_b$). Narrow poly ($W\lesssim$ grain size) shows the bamboo effect; titanium silicide below about 0.2 µm stays in the high-resistivity C49 phase (80–100 µΩ·cm instead of 13–20).

### Silicided Poly, Source/Drain and Metal

| Type | $R_\square$ | Spread | TC | Notes |
|---|---|---|---|---|
| Silicided poly | 20–30 $\Omega/\square$ (Razavi); 2–5 (Hastings, modern silicide) | 20–30% | $+0.2$ to $+0.4\%$/°C | Only for low values whose absolute value is not critical (e.g. a reference ladder) |
| NSD / PSD (unsilicided) | 20–50 $\Omega/\square$ | ±20% | — | Junction to well/substrate: capacitance, voltage dependence, but good heat sinking (ESD, clamps) |
| Metal | 100 m$\Omega/\square$ bottom to 30 m$\Omega/\square$ top (Razavi); 50–90 m$\Omega/\square$ (Hastings) | ±20% | $\approx+3300$ to $+4000$ ppm/°C | Current sense, ballast, flash-ADC ladders |

A metal resistor's TC ($\approx3300$ ppm/°C) is close to that of a voltage proportional to absolute temperature, so sensing current across metal with a PTAT reference gives a nearly temperature-invariant current measurement (Hastings Sec. 6.5.6).

```tikz title="Kelvin-connected metal resistor. Force leads carry the current; sense leads carry none, so their drops do not appear in the measured voltage. L_d is measured between the inner edges of the sense taps. After Hastings Fig. 6.18(A)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[fill=blue!30] (0,0) -- (8,0) -- (8,-1.2) -- (7.0,-1.2) -- (7.0,-0.6) -- (1.0,-0.6) -- (1.0,-1.2) -- (0,-1.2) -- cycle;
  \draw[fill=blue!30] (2.4,0) rectangle (2.6,0.9);
  \draw[fill=blue!30] (5.4,0) rectangle (5.6,0.9);
  \draw[<->] (2.6,1.1) -- (5.4,1.1) node[midway,above,font=\scriptsize] {$L_d$};
  \draw[<->] (8.3,0) -- (8.3,-0.6) node[midway,right,font=\scriptsize] {$W_d$};
  \node[font=\scriptsize] at (0.5,-1.5) {force $I$};
  \node[font=\scriptsize] at (7.5,-1.5) {force $I$};
  \node[font=\scriptsize] at (2.5,1.3) {sense $+$};
  \node[font=\scriptsize] at (5.5,1.3) {sense $-$};
  \draw[->,thick,blue!60!black] (1.2,-0.3) -- (6.8,-0.3);
  \node[font=\scriptsize,align=left,anchor=west] at (8.9,-0.3) {extend the force leads $\ge 2W$\\ past the taps before bending};
\end{circuitikz}
\end{document}
```

### N-Well and Other Junction-Isolated Resistors

```tikz title="N-well resistor with one end at high voltage. The well-substrate depletion region is wider at the high-voltage end, so the conducting depth shrinks there: the value depends on the terminal voltages (nonlinearity) and on the well width. After Razavi Figs. 18.14 and 19.32 and Hastings Fig. 6.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[orange!10] (0,0) rectangle (10,3); \node[font=\scriptsize] at (9.2,0.3) {p-substrate};
  \draw[dashed,fill=green!8] (1,3) -- (1,1.2) -- (9,1.2) -- (9,3);
  \fill[yellow!35] (1,1.2) -- (9,1.2) -- (9,1.9) -- (1,1.45) -- cycle;
  \draw[dashed] (1,1.45) -- (9,1.9);
  \node[font=\scriptsize] at (5,1.45) {depletion (wider at high $V$)};
  \draw[fill=green!35] (1.4,2.7) rectangle (2.4,3.0); \node[font=\scriptsize] at (1.9,2.5) {n$^+$};
  \draw[fill=green!35] (7.6,2.7) rectangle (8.6,3.0); \node[font=\scriptsize] at (8.1,2.5) {n$^+$};
  \draw (0,3) -- (10,3);
  \draw[fill=black] (1.75,3.0) rectangle (2.05,3.45); \draw[fill=black] (7.95,3.0) rectangle (8.25,3.45);
  \node[above,font=\scriptsize] at (1.9,3.45) {low $V$}; \node[above,font=\scriptsize] at (8.1,3.45) {high $V$};
  \node[font=\scriptsize] at (5,2.5) {n-well, $\approx 1$ k$\Omega/\square$};
  \draw[<->] (0.6,3) -- (0.6,1.45); \node[font=\scriptsize,left] at (0.6,2.2) {$t_0-x_d$};
\end{circuitikz}
\end{document}
```

- About **1 k$\Omega/\square$** (shallow well) up to 10 k$\Omega/\square$ (deep well); pinched under a PSD plate, up to 20 k$\Omega/\square$ but as nonlinear as a JFET.
- Spread about $\pm40\%$, TC $+0.2$ to $+0.5\%$/°C (Razavi); Hastings lists $+6000$ ppm/°C for a 10 k$\Omega/\square$ well.
- **Width dependent:** a well several microns deep diffuses sideways, so $R_\square$ rises as $W$ falls (Razavi Fig. 19.31). Keep $W\ge$ 2–3× junction depth.
- **Bias dependent:** depletion width $x_d = \sqrt{2\varepsilon_{si}(\phi_B+V_R)/(qN_{well})}$ eats into the conducting depth $t_0$.
- Use only where the absolute value does not matter (e.g. a bias-isolation resistor whose only job is to be large).

> [!note]- Worked example: an n-well reference ladder (Razavi Ex. 19.3)
> A 128-unit n-well ladder runs from $V_1 = 1$ V to $V_2 = 2$ V. Each unit's conducting depth is $t_0 - x_d(V)$, so
> $$\frac{R_{128}}{R_1}\approx 1 + \frac{1}{t_0}\sqrt{\frac{2\varepsilon_{si}\phi_B}{qN_{well}}}\left[\sqrt{1+\frac{V_2}{\phi_B}} - \sqrt{1+\frac{V_1}{\phi_B}}\right]$$
> With $t_0 = 2\ \mu$m, $N_{well} = 10^{16}$ cm$^{-3}$, $\phi_B = 0.7$ V: the top and bottom units differ by **nearly 60%**. A poly ladder has no such term.

> [!note]- Detail: diffused-resistor example with numbers (Carusone Ex. 1.20)
> A 4 kΩ resistor from a 3 µm-wide n-type strip, $N_D = 10^{23}$ m$^{-3}$, depth 2 µm, in $N_A = 10^{22}$ m$^{-3}$ substrate, $\mu_n = 0.08$ m²/V·s, 3 V reverse bias:
> - $R_\square = 1/(q\mu_nHN_D) = 390\ \Omega/\square$, so $L = (4\text{k}/0.39\text{k})\times3\ \mu\text{m} = 31\ \mu$m.
> - $\Phi_0 = 0.77$ V; $C_{j0} = 0.33$ fF/µm², at 3 V $C_j = 0.15$ fF/µm².
> - Junction area $93\ \mu$m² bottom plus $136\ \mu$m² sidewall: $C_{R1} = C_{R2} = 17$ fF, and these vary with voltage.

> [!note]- Detail: the bipolar-process resistors (Hastings Secs. 6.5.1–6.5.5)
> | Type | $R_\square$ | Spread | Notes |
> |---|---|---|---|
> | Base | 100–200 $\Omega/\square$ | ±20% | Best general resistor in standard bipolar; 50 Ω–20 kΩ |
> | Emitter | 2–10 $\Omega/\square$ | ±20% | Few tenths of an ohm to a couple hundred ohms; ballast, crossunders |
> | Base pinch | 2–10 k$\Omega/\square$ | ±50% | Really a JFET; can double from 0 to 5 V |
> | HSR implant | 1–10 k$\Omega/\square$ (2 k optimal) | ±30% | Shallow boron; TC several thousand ppm/°C; 20–30 V breakdown |
> | Epi pinch (epi-FET) | 5–20 k$\Omega/\square$ | ±50%+ | Start-up trickle current only |
>
> All of these are junction isolated and need a correctly biased tank. CMOS/BiCMOS designers use poly instead.

### Thin-Film and MOS Resistors

- **Thin film** (nichrome, tantalum nitride, sichrome) is deposited only to be a resistor: TC under 100 ppm/°C, as-deposited spread $\pm20\%$, laser-trimmed to $\pm0.05\%$ or better, minimal ageing, little power handling, extra masks. "When thin-film resistors are available they are almost always the preferred type; unfortunately they are seldom available" (Carusone Sec. 2.4.3).

| Film | $\rho$ (m$\Omega\cdot$cm) | $R_\square$ ($\Omega/\square$) | TC (ppm/°C) |
|---|---|---|---|
| Nichrome | 0.1 | 20–200 | 50 to 100 |
| Tantalum | 0.2 | 20–200 | $-100$ to $-150$ |
| Sichrome | 1–20 | 100–2000 | 0 to $-150$ |

- **Triode MOSFET:** $R_{on} = 1/[\mu C_{ox}(W/L)V_{OV}]$, tunable by the gate and very compact, but more nonlinear than any diffusion: keep $V_{DS}\ll V_{OV}$ (Carusone Sec. 1.6.1).

> [!tip] Remark
> This is the deep-triode $R_{on}$ of [[MosFETs#Regions of Operation]]. Carusone Ex. 1.21: 50 kΩ with $V_{DS}<200$ mV from 21 series $2/1$ NMOS at $V_{GS} = 1$ V ($\mu_nC_{ox} = 300\ \mu$A/V², $V_{tn} = 0.3$ V gives 2.38 kΩ each), far smaller than the 20 poly strips of Ex. 1.19.

## Level 3: Variability

### Process Variation

- Fabs hold $R_\square$ within **±20–25%** for most layers, up to **±50%** for very-high-sheet poly and pinch resistors (wafers outside are scrapped).
- Width errors add to that through $\delta W/W$ (see [[#Spec translation]]).
- **Design rules of thumb (Hastings Sec. 6.3.1):**
  - Tolerance unimportant: minimum width.
  - Moderate: 2–3× minimum width; poly $\ge0.3\ \mu$m; diffusions $\ge2\times$ junction depth; avoid poly above 5 k$\Omega/\square$ and pinched resistors.
  - Crucial: trim; poly $\ge0.5\ \mu$m; no lightly doped layer of any kind.

### Temperature

```tikz title="Linear drift Delta R/R = alpha (T - 25 C) over -40 to 125 C for representative materials. After Hastings Table 6.4 and Table 6.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x: T -40..125 -> 0..8.25 (0.05/C) ; y: % -40..60 -> 0..5 (0.05/%)
  \draw[->] (0,2.0) -- (8.6,2.0);
  \node[font=\small] at (3.9,1.55) {$T$ (°C)};
  \draw[->] (0,0) -- (0,5.4) node[above] {$\Delta R/R$ (\%)};
  \foreach \t in {-40,0,25,85,125} { \draw ({0.05*(\t+40)},2.08) -- ({0.05*(\t+40)},1.92) node[below,font=\scriptsize] {\t}; }
  \foreach \p in {-40,-20,0,20,40,60} { \draw (0.08,{0.05*(\p+40)}) -- (-0.08,{0.05*(\p+40)}) node[left,font=\scriptsize] {\p}; }
  \foreach \a/\c in {6000/red!70!black, 3800/blue!70!black, 1500/green!50!black, 1000/orange!80!black, 50/black, -1000/violet} {
    \draw[thick,\c,domain=-40:125,samples=2] plot ({0.05*(\x+40)},{0.05*(\a*1e-4*(\x-25)+40)});
  }
  \node[font=\scriptsize,anchor=west,red!70!black] at (8.3,5.0) {n-well 10 k$\Omega/\square$: $+6000$};
  \node[font=\scriptsize,anchor=west,blue!70!black] at (8.3,3.9) {aluminum: $+3800$};
  \node[font=\scriptsize,anchor=west,green!50!black] at (8.3,2.85) {base diffusion: $+1500$};
  \node[font=\scriptsize,anchor=west,orange!80!black] at (8.3,2.5) {poly 25 $\Omega/\square$: $+1000$};
  \node[font=\scriptsize,anchor=west] at (8.3,2.15) {thin film: $\lesssim100$};
  \node[font=\scriptsize,anchor=west,violet] at (8.3,1.5) {poly 500 $\Omega/\square$: $-1000$};
  \node[font=\scriptsize,anchor=west] at (8.3,1.0) {(ppm/°C)};
\end{circuitikz}
\end{document}
```

$$
\boxed{R(T) = R(T_0)\left[1+\alpha_1(T-T_0)+\alpha_2(T-T_0)^2\right]}
$$

- $\alpha$ in ppm/°C (divide by $10^6$). $\alpha_2$ is much smaller but matters over wide ranges. Coefficients are least-squares fits valid only over the range they were fit on; the linear-only $\alpha$ is not the $\alpha_1$ of the quadratic fit.
- Positive TC = lattice scattering (metals, diffusions, heavily doped poly). Negative TC = grain-boundary-limited high-sheet poly.
- **Cancelling TC**: put low-sheet (+TC) and high-sheet (−TC) poly in series or parallel. Fabs rarely monitor high-sheet poly TC, so the cancellation can be off by more than expected; series/parallel composites can be made insensitive to small TC variations (Gregoire and Moon, cited by Hastings).

> [!note]- Detail: TC table (Hastings Table 6.4, $T_0 = 25$ °C, valid −40 to 125 °C)
> | Material | TCR (ppm/°C) |
> |---|---|
> | Aluminum / copper / gold, bulk | +3800 / +4000 / +3700 |
> | CoSi$_2$, 1.2 kÅ | +3000 |
> | 160 $\Omega/\square$ base | +1500 |
> | 7 $\Omega/\square$ emitter | +600 |
> | 5 k$\Omega/\square$ base pinch | +2500 |
> | 2 k$\Omega/\square$ HSR implant | +3000 |
> | 500 $\Omega/\square$ poly (4 kÅ, P-doped) | −1000 |
> | 25 $\Omega/\square$ poly (4 kÅ, P-doped) | +1000 |
> | 10 k$\Omega/\square$ n-well | +6000 |
>
> Razavi's rule of thumb for silicide-blocked poly: about $+0.1\%$/°C for p$^+$ and $-0.1\%$/°C for n$^+$ doping. Carusone: diffused/implanted 1000–3000 ppm/°C, thin film as low as 100 ppm/°C.

### Voltage Coefficient and Nonlinearity

```tikz title="Absolute resistance V/I versus incremental resistance dV/dI. They are equal only for a linear resistor (left); for a nonlinear one (right) they differ, and 'resistance' means the absolute value unless stated. After Hastings Fig. 6.7(A),(B)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (3.6,0) node[right] {$I$}; \draw[->] (0,0) -- (0,2.8) node[above] {$V$};
  \draw[thick,red!70!black] (0,0) -- (3.3,2.5);
  \draw[dashed] (2,0) node[below] {$I_0$} -- (2,1.515);
  \node[font=\scriptsize,anchor=east] at (1.9,2.2) {$R = V/I$ = slope};
  \begin{scope}[shift={(5,0)}]
    \draw[->] (0,0) -- (3.6,0) node[right] {$I$}; \draw[->] (0,0) -- (0,2.8) node[above] {$V$};
    \draw[thick,red!70!black,domain=0:3.3,samples=40] plot (\x,{2.6*(1-exp(-0.75*\x))});
    \draw[dashed] (1.6,0) node[below] {$I_0$} -- (1.6,1.81);
    \draw[blue!70!black] (0.6,1.18) -- (2.6,2.44);
    \draw[gray] (0,0) -- (1.6,1.81);
    \node[font=\scriptsize,anchor=west,blue!70!black] at (2.0,1.6) {$r(I_0)=dV/dI$};
    \node[font=\scriptsize,anchor=east,gray] at (1.05,1.55) {$R=V/I$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{R(V) = R(V_0)\left[1+\beta_1(V-V_0)+\beta_2(V-V_0)^2\right]}
$$

Four mechanisms, from most to least common:

| Mechanism | Affects | Typical size | Cure |
|---|---|---|---|
| **Depletion pinching** (junction-isolated layers) | Diffusions, wells, pinched layers | $\beta_1$: 100 ppm/V base, 2.5%/V high-sheet; base pinch $\beta_1 = 6\%$/V, $\beta_2 = 2\%$/V² | Use poly; or split into segments, each in its own body tied to its high end |
| **Body (tank) modulation** | Any junction-isolated resistor | 700 $\Omega/\square$ P-type: $\beta_1 = 1000$ ppm/V, $\beta_2 = -20$ ppm/V² | Bias bodies so each resistor sees the same body-to-resistor voltage |
| **Self-heating** | Anything with a TC, especially poly on oxide | $\beta_2\simeq\alpha t_{ox}R_\square/(\kappa R_0^2W^2)$ | Wider, lower $R_\square$, thinner oxide below |
| **Velocity saturation / grain voltage** | Short resistors | Above 0.2 V/µm (n), 0.6 V/µm (p) | $L\ge10\ \mu$m/V (n), 3.3 µm/V (p) |
| **Conductivity modulation by overlying leads** | Lightly doped layers | 0.1%/V in 2 k$\Omega/\square$ HSR | Field plate; route leads around; poly $\le1$ k$\Omega/\square$ is largely immune |

> [!note]- Derivation: self-heating as a quadratic voltage coefficient (Hastings Eq. 6.16)
> Power $V^2/R_0$ spread over area $WL$ through oxide of thickness $t_{ox}$ and thermal conductivity $\kappa$ raises temperature by $\Delta T = V^2t_{ox}/(R_0\kappa WL)$. With $L = R_0W/R_\square$, $\Delta T = V^2t_{ox}R_\square/(\kappa R_0^2W^2)$, and $R = R_0(1+\alpha\Delta T)$ gives
> $$\beta_2 \simeq \frac{\alpha\,t_{ox}R_\square}{\kappa R_0^2W^2},\qquad \kappa_{SiO_2}\approx 0.013\ \text{W/cm}\cdot{}^\circ\text{C}$$
> **Example:** 10 kΩ, 5 µm wide, $500\ \Omega/\square$ poly ($\alpha = -1000$ ppm/°C) on 1 µm field oxide: $\beta_2 = -1.5\%/\text{V}^2$. Negative because the TC is negative: the resistor's value *falls* as voltage rises.

> [!tip] Remark
> A voltage coefficient is a nonlinearity: in a resistive feedback amplifier it shows up directly as harmonic distortion. How $\beta_1,\beta_2$ turn into HD2/HD3 is in [[Nonlinearity and Mismatch]]. Razavi (Sec. 19.2.6) notes that for an I-V converter $V_{out} = -I_{in}R_F$ the op amp usually limits linearity before a long silicide-blocked poly $R_F$ does.

### Contact Resistance

$$
\boxed{R_C = \frac{\sqrt{R_\square\rho_C}}{W_C}\coth\!\left(L_C\sqrt{R_\square/\rho_C}\right)}
$$

per contact of width $W_C$ and length $L_C$ ($\rho_C$ = specific contact resistance, $\Omega\cdot\mu$m², covers both barrier and crowding).

- Hastings example: a 1 kΩ base resistor with $8\times8\ \mu$m Al-Cu-Si contacts gains 43 Ω per contact, 86 Ω total: **9%**. Short (<10 square) segments need oversized contacts, or put longer segments in parallel.
- Silicided CMOS: roughly **20 Ω per contact**, varying by over 50% (Carusone). Razavi: a minimum contact ($\approx80$ nm × 80 nm in 40 nm CMOS) has a high, poorly controlled interface resistance. Keep it a small fraction of the total: **long fingers, many parallel contacts**.

> [!note]- Detail: specific contact resistances (Hastings Table 6.5)
> | Contact system | $\rho_C$ ($\Omega\cdot\mu$m²) |
> |---|---|
> | Al (2% Si, 0.5% Cu) to 160 $\Omega/\square$ base | 750 |
> | Refractory barrier metal to 160 $\Omega/\square$ base | 2500 |
> | PtSi to 160 $\Omega/\square$ base | 1250 |
> | Al to 5 $\Omega/\square$ emitter | 40 |
> | TiSi$_2$ to NSD | 30 |
> | TiSi$_2$ to PSD | 100 |

> [!note]- Detail: long-term drift by (de)hydrogenation (Hastings Sec. 6.3.5)
> Hydrogen ties off dangling bonds at poly grain boundaries and lowers resistance. Weak Si–H bonds (about 0.5 eV) break under heat or hot carriers, so high-sheet **P-type** poly drifts upward by several percent over hundreds to thousands of hours at high temperature. Phosphorus segregates to grain boundaries and ties off bonds itself, so high-sheet N-type poly (more phosphorus than boron) drifts less. A concern for precision current sources.

## Level 4: Parasitics and High Frequency

```tikz title="Subcircuit models. (A) single pi for a deposited (poly) resistor, (B) dual pi: C/4, C/2, C/4 with R/2 per section, (C) diffused resistor: the capacitors become reverse-biased junction diodes to the body (tank) and from body to substrate. After Hastings Figs. 6.10 and 6.12(A)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2) node[ocirc]{} node[above]{T1} to[R,l=$R$] (2.4,2) node[ocirc]{} node[above]{T2};
  \draw (0.3,2) node[circ]{} to[C,l_=$\tfrac C2$] (0.3,0.4); \draw (2.1,2) node[circ]{} to[C,l=$\tfrac C2$] (2.1,0.4);
  \draw (0,0.4) node[ocirc]{} node[left,font=\scriptsize]{SUBS} -- (2.1,0.4);
  \node at (1.2,-0.3) {(A)};
  \begin{scope}[shift={(3.9,0)}]
    \draw (0,2) node[ocirc]{} to[R,l=$\tfrac R2$] (2,2) to[R,l=$\tfrac R2$] (4,2) node[ocirc]{};
    \draw (0.3,2) node[circ]{} to[C,l_=$\tfrac C4$] (0.3,0.4);
    \draw (2,2) node[circ]{} to[C,l_=$\tfrac C2$] (2,0.4);
    \draw (3.7,2) node[circ]{} to[C,l=$\tfrac C4$] (3.7,0.4);
    \draw (0,0.4) node[ocirc]{} -- (3.7,0.4);
    \node at (2,-0.3) {(B)};
  \end{scope}
  \begin{scope}[shift={(9.4,0)}]
    \draw (0,2) node[ocirc]{} node[above]{T1} to[R,l=$R$] (2.6,2) node[ocirc]{} node[above]{T2};
    \draw (0.4,2) node[circ]{} to[D,l_=$D_1$] (0.4,0.6);
    \draw (2.2,2) node[circ]{} to[D,l_=$D_2$] (2.2,0.6);
    \draw (0,0.6) node[ocirc]{} node[left,font=\scriptsize]{TANK} -- (2.4,0.6);
    \draw (3.8,0.6) node[ocirc]{} node[right,font=\scriptsize]{SUBS} to[D,l_=$D_3$] (2.4,0.6);
    \node at (1.4,-0.3) {(C)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Deposited (poly):** only oxide capacitance, $\approx0.05$ fF/µm² over field oxide. A $\pi$ model splits it $C/2$–$C/2$; a dual $\pi$ ($C/4$, $C/2$, $C/4$) is more accurate for long resistors.
- **Crossing leads:** interlevel oxide is about the same 0.05 fF/µm². A 1 µm lead crossing a 1 µm poly resistor adds 0.05 fF; if the resistor node totals 0.1 pF, a 2 V$_{pp}$ digital square wave on the lead injects **1 mV$_{pp}$**, enough to cost a 16-bit converter several bits (Hastings Sec. 6.4). Do not route noisy leads over resistors.
- **Diffused:** the capacitors become diodes (1–5 fF/µm², voltage dependent). The body must be biased so the diodes never forward bias (latch-up risk) and should not exceed about 2/3 of the rated breakdown.

> [!note]- Detail: biasing the body of a diffused resistor (Hastings Fig. 6.13)
> - Both bodies to $V_{CC}$: simplest, but the two halves of a divider see different body-to-resistor voltages, so body modulation changes the divider ratio with supply.
> - Each body tied to its own resistor's high end: both halves see the same differential, so modulation tracks. Costs separate bodies (area) and adds well-substrate leakage.
> - Body tied to a node that is neither a supply nor the resistor's high end (e.g. one $V_{BE}$ above): check every transient for forward bias.

```tikz title="Impedance of a real resistor versus frequency (shape after the ECE 373 binder, slide 39, from Ludwig and Bretchko). Flat at R, then the shunt capacitance takes over, then a series resonance and the lead inductance dominates."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.5,0) node[right] {$\log f$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$\log|Z|$};
  \draw[very thick,blue!60!black] (0,3.4) -- (2.0,3.4) .. controls (2.6,3.4) and (2.8,3.1) .. (3.2,2.7) -- (5.4,0.8) .. controls (5.7,0.5) and (5.85,0.1) .. (5.95,0.05) .. controls (6.05,0.1) and (6.2,0.5) .. (6.5,0.85) -- (8.2,1.6);
  \node[font=\scriptsize] at (1.2,3.65) {$R$};
  \node[font=\scriptsize,anchor=south west] at (4.3,1.9) {$1/(\omega C_a)$: capacitive};
  \node[font=\scriptsize,anchor=south] at (7.3,1.55) {$\omega L$: inductive};
  \node[font=\scriptsize,anchor=north] at (5.95,-0.05) {series resonance};
  \begin{scope}[shift={(0.3,-3.0)}]
    \draw (0,1) node[ocirc]{} to[L,l=$\tfrac L2$] (1.6,1) coordinate(a);
    \draw (a) to[R,l=$R$] (3.4,1) coordinate(b) to[L,l=$\tfrac L2$] (5,1) node[ocirc]{};
    \draw (a) -- (1.6,2.3) to[C,l=$C_a$] (3.4,2.3) -- (b);
    \draw (0.3,1) -- (0.3,-0.3) to[C,l_=$C_b$] (4.7,-0.3) -- (4.7,1);
    \node[font=\scriptsize,anchor=west] at (5.4,0.8) {$Z = j\omega L + \dfrac{R}{1+j\omega C_aR}$, $C_b\approx0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> At RF a "resistor" is the same lumped RLC idea as the [[Inductor#Level 3 Losses and the Equivalent Circuit|inductor]] and [[Capacitor#RF Capacitor Model and Self-Resonance|capacitor]] models: every component is useful only below its self-resonance. Pozar (Sec. 5.1, Point of Interest) adds that low resistances are hard to make in thin film, and that a lumped element needs its size under about $\lambda/10$.

## Layout

```tikz title="Bad versus good matched-resistor layout. Left: a serpentine and a short unit with few contacts, the corners and contact resistance are the least reproducible parts. Right: identical long unit strips, same orientation, interleaved ABBA, dummies at both ends, many contacts per head. After Razavi Fig. 19.30 and Carusone Fig. 2.33."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % bad
  \node[font=\small\bfseries,red!70!black] at (2.2,4.6) {bad};
  \draw[fill=red!30] (0,0) -- (0,4) -- (0.5,4) -- (0.5,0.5) -- (1.0,0.5) -- (1.0,4) -- (1.5,4) -- (1.5,0.5) -- (2.0,0.5) -- (2.0,4) -- (2.5,4) -- (2.5,0) -- (2.0,0) -- (2.0,0) -- cycle;
  \draw[fill=black] (0.1,3.6) rectangle (0.4,3.9); \draw[fill=black] (2.1,3.6) rectangle (2.4,3.9);
  \node[font=\scriptsize,anchor=west] at (0.1,-0.3) {A: serpentine, corners};
  \draw[fill=red!30] (3.2,1.6) rectangle (3.7,2.4);
  \draw[fill=black] (3.3,1.65) rectangle (3.6,1.9); \draw[fill=black] (3.3,2.1) rectangle (3.6,2.35);
  \node[font=\scriptsize,anchor=west,align=left] at (3.0,1.1) {B: short unit,\\ one contact per end};
  \draw[->,red!70!black] (4.4,3.6) -- (2.7,3.6);
  \node[font=\scriptsize,red!70!black,align=left,anchor=west] at (4.4,3.6) {A and B do not\\ share a gradient\\ centroid};
  % good
  \begin{scope}[shift={(7,0)}]
    \node[font=\small\bfseries,green!50!black] at (2.6,4.6) {good};
    \foreach \i/\t/\f in {0/D/gray!30,1/A/red!30,2/B/red!45,3/B/red!45,4/A/red!30,5/D/gray!30} {
      \draw[fill=\f] ({0.9*\i},0.4) rectangle ({0.9*\i+0.5},3.6);
      \foreach \y in {0.5,0.8,3.2,3.5} \fill[black] ({0.9*\i+0.13},{\y-0.12}) rectangle ({0.9*\i+0.37},{\y+0.05});
      \node[font=\scriptsize] at ({0.9*\i+0.25},2.0) {\t};
    }
    \draw[->] (0,0) -- (5.3,0) node[right,font=\scriptsize] {gradient};
    \node[font=\scriptsize,align=left,anchor=west] at (5.5,2.4) {D = dummy (matched\\ surroundings for the\\ outermost units);\\ A and B share a centroid};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Rules (in the open; justifications below):**
1. **Build every resistor from identical unit segments**, in series or parallel, never by scaling $L$ or $W$ of one strip. A non-integer ratio becomes a ratio of integers of units (Razavi Ex. 19.2: $R_2/R_1 = 5.34\approx16/3$, so $R_2$ = 16 quarter-units and $R_1$ = 3 thirds-units of the same unit).
2. **Same orientation** for all matched units (stress, piezoresistivity, etch direction).
3. **Interleave in a common-centroid pattern** (ABBA) so a linear gradient cancels; put the smaller resistor in the middle.
4. **Dummies** at both ends of the array.
5. **Long segments, wide segments:** at least 10 µm long; width well above minimum (edge roughness); many parallel contacts. Doubling both $L$ and $W$ keeps $R$ and halves contact resistance (Razavi Fig. 19.29).
6. **Shield underneath** with a well tied to a clean supply; model the added capacitance. A metal shield over the top for very low-noise designs (Carusone Sec. 2.4.3).
7. **No leads over precision resistors**, especially noisy ones; if unavoidable, field-plate.
8. **Kelvin-connect** low-value metal resistors.
9. **Poly spacing** by voltage: with $N$ equal segments and $V_d$ across the whole resistor, adjacent turns see at most $\Delta V = 2V_d/N$ (Hastings Eq. 6.24).

```tikz title="Razavi's bandgap ratio R2/R1 = 16/3 from one unit size: R2 is four parallel groups of four series quarter-units, R1 is four series groups of three thirds-units, interleaved with dummies at both ends. After Razavi Fig. 19.28(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \i/\t/\f in {0/{D}/gray!30,1/{$\tfrac14R_2$}/red!30,2/{$\tfrac13R_1$}/red!50,3/{$\tfrac14R_2$}/red!30,4/{$\tfrac13R_1$}/red!50,5/{$\tfrac14R_2$}/red!30,6/{$\tfrac13R_1$}/red!50,7/{$\tfrac14R_2$}/red!30,8/{D}/gray!30} {
    \draw[fill=\f] ({1.2*\i},0) rectangle ({1.2*\i+0.9},2.6);
    \node[font=\scriptsize] at ({1.2*\i+0.45},1.3) {\t};
  }
  \node[font=\scriptsize,align=center] at (5.2,-0.55) {each $\tfrac14R_2$ block = 4 series units; each $\tfrac13R_1$ block = 4 series units; all units identical};
\end{circuitikz}
\end{document}
```

> [!note]- Why: what each rule cancels
> - **Identical units:** width bias $W_b$, end effects, contact resistance and corner squares are the same in every unit, so they scale out of any ratio of unit counts.
> - **Dummies:** etch rate and lithography depend on neighbours; dummies give the outermost active units the same surroundings as the inner ones. Carusone: about 0.1% matching for identical resistors with dummies and fingers much wider than minimum.
> - **Common centroid:** a linear gradient in $R_\square$ shifts each unit by $g\,x_i$; if both resistors' units have the same mean position, the shifts sum equally. Full treatment, including quadratic gradients and dispersion: [[Device Matching]].
> - **No serpentine:** the corner squares and the current crowding around them are geometry-sensitive (Razavi). Hastings adds that matched resistors only need identical sections, so a serpentine of identical folds is acceptable, but its corners still count about 0.56 square each.
> - **Shield:** a resistor is a large-area capacitor to the substrate; without a quiet well under it, substrate noise couples straight onto the resistor node.

## Adjusting Resistor Values

Two ideas: **tweaking** changes one mask after a first silicon pass (every later die gets the change); **trimming** adjusts each die at probe or final test.

> [!note]- Detail: tweaks (Hastings Sec. 6.6.1)
> - **Sliding contact:** extend the body; move the contact along it (metal plate already covers the range). Only for bodies and heads of the same material.
> - **Sliding head:** move a low-sheet head into or out of a high-sheet body (HSR, high-sheet poly).
> - **Trombone slide:** lengthen or shorten the turns of a serpentine; reserve the room (and the well or block-mask coverage).
> - **Metal options:** spare segments connected or not by a new metal mask; series and parallel combinations.

```tikz title="Series binary-weighted trim network. Blowing fuse F_k inserts its resistor; codes step in R_lsb increments. After Hastings Fig. 6.27(A)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (3,5.2) node[above]{} to[R,l=$R_x$] (3,4) node[circ]{} to[R,l=$4R_{lsb}$] (3,2.6) node[circ]{} to[R,l=$2R_{lsb}$] (3,1.2) node[circ]{} to[R,l=$R_{lsb}$] (3,-0.2) node[ground]{};
  \draw (3,4) -- (1.2,4) node[circ]{} to[fuse,l_=$F_1$] (1.2,2.6) node[circ]{} to[fuse,l_=$F_2$] (1.2,1.2) node[circ]{} to[fuse,l_=$F_3$] (1.2,-0.2) node[ground]{};
  \draw (1.2,2.6) -- (3,2.6); \draw (1.2,1.2) -- (3,1.2);
  \foreach \y in {4,2.6,1.2} { \draw (1.2,\y) -- (0.2,\y); \draw[fill=white] (-0.1,{\y-0.15}) rectangle (0.2,{\y+0.15}); }
  \node[font=\scriptsize,anchor=east] at (-0.2,3.3) {trim pads};
  \node[font=\scriptsize,align=left,anchor=west] at (4.0,2.6) {an intact fuse shorts the resistor beside it;\\ blowing the fuse inserts that resistor};
\end{circuitikz}
\end{document}
```

$$
\boxed{N = \left\lceil 3.32\log_{10}\frac{X}{\delta X}\right\rceil}\qquad\boxed{\Delta R_{\text{diff. trim}} = \frac{R_B^2}{R_A+R_B}}
$$

- $N$ bits trim a range $\pm X$ to a resolution $\pm\delta X$. Example: $\pm0.25\%$ over $\pm5\%$ needs **4 bits**; a 100 kΩ resistor becomes 95 kΩ plus four series trims $R_{lsb},2R_{lsb},4R_{lsb},8R_{lsb}$ totalling 10 kΩ, so $R_{lsb} = 10\text{k}/15 = 667\ \Omega$.
- Above about six bits, mismatch between trim resistors exceeds an LSB: cascade a second network, or use a sub-binary ratio (e.g. 1:2:4:6:12:24:36:72:144) with a binary-search look-ahead.
- **Differential trim** for very small LSBs: a fuse disconnects $R_A$ from $R_A\parallel R_B$.
- Trimmed accuracy is limited by drift and stress to about **±0.05%** (thin film ±0.01%).

| Method | Programming | Resolution | Notes |
|---|---|---|---|
| Metal fuse | ≈5 V, 1 ms, several hundred mA, fast edge | Discrete | Needs overcoat opening; probe-pad sized |
| Poly fuse | 5–15 V, 1 ms, 50–150 mA, rise <25 ns | Discrete | Lowest-sheet poly; silicided poly can "program" by electromigration (≈500 Ω → ≈1 MΩ) |
| Zener zap | 100–250 mA for ms; ends near 10 Ω | Discrete | No overcoat opening; avoid with refractory barrier metal |
| NVM (EPROM/EEPROM) | Small current | Discrete, many bits | Drives MOS switches across trim resistors; post-package trim |
| Electrical poly trim | Pulses >10$^6$ A/cm² | Continuous, down to 50% of value | Also shifts TC, so not for precision ratios |
| Laser trim | Nd:YAG, 5–10 µm spot, 0.02 µm path resolution | Continuous ($\pm0.1\%$, needs 30–50 µm width) or link cuts (1 µm × 15 µm links) | Costly test time; thin film |

> [!note]- Detail: remote trimming and fuse placement (Hastings Sec. 6.6.2)
> Precision resistors sit inside the die (away from edge stress) while trim pads sit at the periphery, so long leads would cross the die. Use MOS switches across the trim resistors, with widths scaled inversely to each segment's value ($4W/L$, $2W/L$, $W/L$ for $R_{lsb}$, $2R_{lsb}$, $4R_{lsb}$) so on-resistance error is the same fraction of each segment. Drive the switches from fuses through a current mirror and inverters fed by a clean supply; a small $R_S$ keeps programming current out of the ground system. Put fuses on the grounded, least vulnerable end of the trimmed resistor (e.g. the Brokaw bandgap's emitter resistor) so programming voltage does not avalanche emitter-base junctions.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $R_\square$ (HSR, VHSR poly, wells) | Area and parasitic $C$ for a given $R$ | Spread (±30–50%), TC magnitude, VC, drift |
| ↑ $W$ (with $L$ to hold $R$) | Tolerance, matching, current handling, contact error | Area, parasitic $C$ ($\propto W^2$ at fixed $R$) |
| ↑ $L$ per segment | Linearity (field, grains, self-heating), contact fraction | Area |
| Poly instead of diffusion | No junction: linear, low $C$, no leakage, no body bias | Power handling, needs silicide block mask |
| Diffusion instead of poly | Heat sinking, ESD robustness | Junction $C$ and VC, body biasing, latch-up |
| Identical units + common centroid + dummies | Ratio accuracy ~0.1% | Area, routing |
| Trim network | Absolute accuracy to ~0.05% | Test time, pads, fuses or NVM, switch parasitics |
| Silicided heads, many contacts | Lower, better-controlled contact resistance | Nothing much |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Resistance | $R = R_\square L/W$, $R_\square = \rho/t$ |
| Uniform diffusion | $R_\square = 1/(q\mu_nHN_D)$ |
| With process biases | $R = R_\square(L_d+L_b)/(W_d+W_b)$ |
| Poly with heads | $R = R_\square\frac{L_d-2L_b}{W_d+W_b} + 2R_h\frac{L_h+L_b}{W_d+W_b}$ |
| Corners | square corner $\approx0.56\,\square$; $180^\circ$ round end $2.96\,\square$; two-corner fold $R_\square[(2A+B)/W+1.12]$ |
| Tolerance | $\delta R\simeq(\delta W/W+\delta R_\square)\times100\%$ |
| Temperature | $R(T) = R_0[1+\alpha_1(T-T_0)+\alpha_2(T-T_0)^2]$ |
| Voltage | $R(V) = R_0[1+\beta_1(V-V_0)+\beta_2(V-V_0)^2]$ |
| Self-heating | $\beta_2\simeq\alpha t_{ox}R_\square/(\kappa R_0^2W^2)$ |
| Linearity length | $L_{min} = 10\ \mu\text{m/V}\cdot V_{max}$ (n), $3.3\ \mu\text{m/V}\cdot V_{max}$ (p) |
| Contact | $R_C = \frac{\sqrt{R_\square\rho_C}}{W_C}\coth(L_C\sqrt{R_\square/\rho_C})$ |
| Distributed RC | $\pi$: $C/2$ each end; dual $\pi$: $C/4$, $C/2$, $C/4$ |
| RF model | $Z = j\omega L + R/(1+j\omega C_aR)$ |
| Poly spacing | $\Delta V = 2V_d/N$ |
| Trim bits | $N = \lceil3.32\log_{10}(X/\delta X)\rceil$ |
| Differential trim | $\Delta R = R_B^2/(R_A+R_B)$ |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (PDF page = printed + 1), Ch. 6 Resistors, pp. 274–324: §6.1 resistivity and sheet resistance (Tables 6.1–6.2), §6.2 layout (Eqs. 6.5–6.11, Figs. 6.2–6.6, Table 6.3), §6.3 variability (Eq. 6.12–6.19, Tables 6.4–6.5, Figs. 6.7–6.8), §6.4 parasitics (Figs. 6.9–6.13), §6.5 comparison of resistor types (Figs. 6.14–6.22, Tables 6.6–6.7), §6.6 tweaking and trimming (Figs. 6.23–6.33, Eqs. 6.25–6.26).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF = printed + 24): §1.6.1 Resistors pp. 54–58 (Eqs. 1.133–1.134, Exs. 1.19–1.21, Figs. 1.34–1.35); §2.4.3 Resistor Layout pp. 107–109 (Fig. 2.33, Ex. 2.7).
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §18.7.2 Passive Devices pp. 722–724 (Figs. 18.13–18.16); §19.2.6 Passive Devices pp. 746–750 (Ex. 19.2, Figs. 19.26–19.34, Ex. 19.3).
- **Pozar, *Microwave Engineering*, 4th ed.**: §5.1 Point of Interest "Lumped Elements for Microwave Integrated Circuits", pp. 233–234.
- **ECE 373 binder** (Boumaiza), slides 36 and 39 (binder PDF pp. 89, 92): lumped microwave elements, RF resistor impedance.
- **Zettelkasten extensions** (`AnalogTheory/Process Layout and Packaging/`): 15m (material vs spread table, combined spread + drift budget), 15g2 (n-well width and bias dependence), 15m1 (unit segments).
