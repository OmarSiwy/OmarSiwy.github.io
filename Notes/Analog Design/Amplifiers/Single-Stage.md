---
title: Single-Stage
description: One transistor, three ways to wire it (CS, CG, CD), the impedance rules that predict all of them, and the cascode that stacks two to square the gain.
kind: topic
status: growing
aliases:
  - Single-Stage
  - Single-Stage Amplifiers
---

One MOSFET can take its input at the gate or the source and give its output at the drain or the source. That leaves three topologies, plus the cascode (two of them stacked). The note starts with all of them on one screen, then the three impedance rules that predict every result, then each topology in more detail. Cascodes come last because they reuse everything before them. Everything here is low-frequency: capacitors return in [[Frequency Response]].

## The big picture

```tikz title="The three single-transistor amplifiers, named by the terminal that is common to input and output. After Razavi Figs. 3.4, 3.48, 3.34."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,font=\small]
  % CS
  \draw (0,0) node[nmos](A){};
  \draw (A.S) -- ++(0,-0.4) node[ground]{};
  \draw (A.D) to[R, l=$R_D$] ++(0,1.8) node[vcc]{$V_{DD}$};
  \draw (A.G) -- ++(-0.6,0) node[ocirc]{} node[left]{$v_{in}$};
  \draw (A.D) ++(0,0.25) node[circ]{} -- ++(0.9,0) node[ocirc]{} node[right]{$v_{out}$};
  \node[align=center,font=\scriptsize] at (0.1,-3.3) {\textbf{common source}\\ in: gate, out: drain};
  % CG
  \begin{scope}[xshift=4.6cm]
  \draw (0,0) node[nmos](B){};
  \draw (B.D) to[R, l=$R_D$] ++(0,1.8) node[vcc]{$V_{DD}$};
  \draw (B.G) -- ++(-0.6,0) node[left]{$V_b$};
  \draw (B.S) -- ++(0,-0.4) node[ocirc]{} node[right]{$v_{in}$};
  \draw (B.D) ++(0,0.25) node[circ]{} -- ++(0.9,0) node[ocirc]{} node[right]{$v_{out}$};
  \node[align=center,font=\scriptsize] at (0.1,-3.3) {\textbf{common gate}\\ in: source, out: drain};
  \end{scope}
  % CD
  \begin{scope}[xshift=9.2cm]
  \draw (0,0) node[nmos](C){};
  \draw (C.D) -- ++(0,0.5) node[vcc]{$V_{DD}$};
  \draw (C.G) -- ++(-0.6,0) node[ocirc]{} node[left]{$v_{in}$};
  \draw (C.S) to[I, l=$I_1$] ++(0,-1.6) node[ground]{};
  \draw (C.S) ++(0,-0.2) node[circ]{} -- ++(0.9,0) node[ocirc]{} node[right]{$v_{out}$};
  \node[align=center,font=\scriptsize] at (0.1,-3.3) {\textbf{common drain (source follower)}\\ in: gate, out: source};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Stage | In → out | $A_v$ | $R_{in}$ | $R_{out}$ | Used as |
|---|---|---|---|---|---|
| Common source (CS) | gate → drain | $-g_m(R_D\parallel r_o)$ | $\infty$ | $R_D\parallel r_o$ | the gain stage |
| Common gate (CG) | source → drain | $\approx(g_m+g_{mb})(R_D\parallel r_o)$, non-inverting | $\approx\dfrac{1}{g_m+g_{mb}}$ (small $R_D$) | $R_D\parallel\{r_o+[1+(g_m+g_{mb})r_o]R_S\}$ | low-$R_{in}$ input, current buffer |
| Common drain (source follower, CD) | gate → source | $\dfrac{g_mR_S}{1+(g_m+g_{mb})R_S}\to\dfrac{1}{1+\eta}<1$ | $\infty$ | $\dfrac{1}{g_m+g_{mb}}$ | buffer, level shift |
| Cascode (CS + CG) | gate → drain | $\approx -g_{m1}\,(g_{m2}r_{o2}r_{o1}\parallel R_{load})$ | $\infty$ | $\approx g_{m2}r_{o2}r_{o1}$ | high gain in one stage |

> [!important] The five results the rest of the note refines
> 1. **Every stage:** $A_v = -G_mR_{out}$. Find $G_m$ with the output shorted, $R_{out}$ with the input zeroed.
> 2. **Looking into a MOSFET:** the gate is open; the source is low, $\approx 1/(g_m+g_{mb})$; the drain is high, $r_o$ plus $R_S$ multiplied by $\approx g_mr_o$.
> 3. **Ceiling:** one transistor gives at most its intrinsic gain $g_mr_o$ (roughly 5–10 in nanometer CMOS). A CS stage with a current-source load gets about half of it.
> 4. **Degeneration:** $|A_v| = \dfrac{\text{resistance at the drain}}{\text{resistance in the source path}} = \dfrac{R_D}{1/g_m+R_S}$.
> 5. **Cascode:** stacking a CG device on a CS device multiplies $R_{out}$ by $g_mr_o$, so the gain approaches $(g_mr_o)^2$. Each stacked device costs one $V_{OV}$ of output swing.

**Map:** [[#Amplifier Specifications|the specs and their knobs]] → [[#Level 0 Any Stage Is a Gm and an Rout|$G_mR_{out}$ and the impedance rules]] → [[#Common-Source Stage|CS and its five loads]] → [[#Source Degeneration|degeneration]] → [[#Source Follower|source follower]] → [[#Common-Gate Stage|common gate]] → [[#Cascode|telescopic and folded cascode]] → [[#Design intuition / trade-offs|trade-offs]].

## Amplifier Specifications

This is the vault's one list of amplifier specs. Every block note's **Spec translation** maps its own specs onto these names.

```tikz title="The analog design octagon: the eight properties of an amplifier, every one of which trades with the others. After Razavi Fig. 3.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \foreach \a/\n/\l/\b in {112.5/1/Noise/south, 67.5/2/Linearity/south, 22.5/3/Gain/west, -22.5/4/{Supply voltage}/west, -67.5/5/{Voltage swings}/north, -112.5/6/Speed/north, -157.5/7/{I/O impedance}/east, 157.5/8/{Power dissipation}/east} {
    \coordinate (P\n) at (\a:2.6);
    \node[font=\small,anchor=\b] at (\a:2.75) {\l};
  }
  \foreach \i in {1,...,8} { \foreach \j in {1,...,8} { \ifnum\i<\j \draw[gray!45] (P\i) -- (P\j); \fi } }
  \draw[thick] (P1) -- (P2) -- (P3) -- (P4) -- (P5) -- (P6) -- (P7) -- (P8) -- cycle;
  \foreach \i in {1,...,8} { \fill (P\i) circle (2pt); }
  \node[font=\scriptsize,align=center,fill=white,inner sep=1pt] at (0,0) {every spec\\ trades with\\ every other};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_0 = G_mR_{out}}\qquad\boxed{\omega_u = A_0\,\omega_0 = \frac{G_m}{C_L}}\qquad\boxed{SR = \frac{I_{max}}{C}}\qquad\boxed{t_s = \frac{1}{\beta\,\omega_u}\ln\frac{1}{\epsilon}}\qquad\boxed{V_{D,sat}\approx\frac{2}{g_m/I_D}}
$$

| Spec | Definition | What sets it in a stage | Knob it fixes |
|---|---|---|---|
| **DC gain** $A_0$ | Low-frequency $\lvert v_{out}/v_{in}\rvert$. In a loop with feedback factor $\beta$ the closed-loop gain error is $\approx 1/(\beta A_0)$ | $G_mR_{out}$: about $g_mr_o/2$ per CS stage, $\times g_mr_o$ per cascode | $g_mr_o$: longer $L$, higher $g_m/I_D$ |
| **Unity-gain frequency / GBW** $\omega_u$ | Frequency where $\lvert A\rvert = 1$. One pole: $\omega_u = A_0\omega_0$. $f_{-3\text{dB}} = \omega_0/2\pi$ is also quoted | $G_m/C_L$ | $g_m = \omega_uC_L$; with the chosen $g_m/I_D$ this fixes $I_D$ |
| **Phase margin** | $180^\circ + \angle\beta A$ at the loop's unity-gain frequency ([[Stability#Definition and peaking]]) | Non-dominant poles at internal nodes, $\approx g_m/C$ of the device there | $f_T$ of the internal-node devices: short $L$, lower $g_m/I_D$ |
| **Slew rate** $SR$ | Largest $dV_{out}/dt$ for a large step, when the input pair is fully switched | Tail or bias current into the capacitor it must charge | $I_D$ directly |
| **Settling time** $t_s$ | Time to come within error $\epsilon$ of the final value. Linear: $4.6\tau$ for 1%, about $7\tau$ for 0.1%, $\tau = 1/(\beta\omega_u)$ | $\omega_u$, then $SR$ for large steps, then phase margin (ringing, doublets) | $I_D$ (through $g_m$ and $SR$), $f_T$ |
| **Output swing** | Output range with every device still saturated (or gain within, e.g., 10% of nominal) | $V_{DD}$ minus the $V_{D,sat}$ of each device stacked at the output | High $g_m/I_D$ on the output devices; fewer stacked devices |
| **Input CM range** | Range of $V_{in,CM}$ over which the input pair and its tail stay saturated ([[Operational Amplifiers#Input Common-Mode Range]]) | $V_{GS}$ of the input pair plus the tail's $V_{D,sat}$ | High $g_m/I_D$ (small $V_{GS}-V_{TH}$) on input and tail |
| **Linearity** | Deviation from a straight-line transfer: HD, IM, IP3 ([[Nonlinearity and Mismatch]]) | Input overdrive (large-signal range of the pair), loop gain | Lower $g_m/I_D$ on the input; more $A_0$ |
| **Input-referred noise** | Output noise divided by the gain: thermal $\approx 4kT\gamma/g_m$ per device, plus flicker $\propto 1/(WL)$ ([[Noise]]) | $g_m$ of the input pair; loads enter as $g_{m,load}/g_{m,in}^2$ | Input $g_m$ (so $I_D$ at high $g_m/I_D$); loads at low $g_m/I_D$; $WL$ for flicker |
| **Offset** $V_{OS}$ | DC input that zeroes the output; random part from mismatch ([[Nonlinearity and Mismatch#Input-Referred Offset]]) | $\Delta V_{TH}\propto A_{VT}/\sqrt{WL}$ of pair and loads, plus $(\Delta\beta/\beta)/(g_m/I_D)$ | Area $WL$; high $g_m/I_D$ on the input, low on the loads |
| **Output impedance** | $R_{out}$ with the input zeroed ([[#The Gm·Rout Lemma]]) | $r_o$, multiplied by $g_mr_o$ per cascode; $1/g_m$ for a follower | $g_mr_o$: $L$ |
| **Input impedance** | Gate: capacitive only. Source: $\approx 1/(g_m+g_{mb})$ | Topology ([[#Looking Into the Gate, Drain, and Source]]) | $g_m$ |
| **CMRR / PSRR** | $A_{dm}/A_{cm}$; $A_{in\to out}/A_{V_{DD}\to out}$ | Tail $r_o$, symmetry, load type; fully differential helps | $g_mr_o$ of tail and loads: $L$ |
| **Power** | $V_{DD}\times$ total bias current | Every $I_D$ | $I_D$ |
| **Supply voltage** | The rail the stack must fit under | Sum of stacked $V_{D,sat}$ plus signal swing | $g_m/I_D$ of every stacked device |

- **Gain buys precision, bandwidth buys settling**, and the settling bandwidth scales with both the accuracy and the closed-loop gain $1/\beta$ (Razavi Exs. 9.1–9.2). Derived in [[Operational Amplifiers#Gain Sets the Gain Error]] and [[Operational Amplifiers#Bandwidth Sets the Settling Time]].
- **A large step slews first**, then settles linearly. Linear settling holds only while $V_{step} < SR\cdot\tau$ (Carusone Eq. 6.24); see [[Stability#Slewing plus linear settling]].
- **Speed needs large-signal checks:** small-signal bandwidth does not predict a large step (Razavi §9.1.1).
- **Swing vs noise:** at a fixed current, lowering a load's overdrive frees headroom but raises its $g_m$ and its noise current (Razavi §9.1.1).

> [!tip] Remark
> The last column is the $g_m/I_D$ method: every spec lands on one of $g_m/I_D$ (inversion level), $I_D$, $L$, $f_T$ or $g_mr_o$, and the lookup tables of [[MosFETs#Why gm/ID, why ID/W]] turn them into $W$. The procedure itself is [[gm-ID Design Methodology]].

> [!note]- Detail: why each knob lands where it does
> - $g_mr_o$ and $f_T$ are width-independent: at a given $L$ both are functions of $g_m/I_D$ alone ([[MosFETs#Why gm/ID, why ID/W]]). Gain wants long $L$ and high $g_m/I_D$; $f_T$ wants short $L$ and low $g_m/I_D$. That is the speed-vs-gain line of the octagon.
> - $V_{D,sat}\approx 2/(g_m/I_D)$ (in strong inversion $g_m/I_D = 2/V_{OV}$): swing, CM range and minimum supply all push $g_m/I_D$ up.
> - Once $g_m/I_D$ is set, any spec that fixes $g_m$ (GBW $g_m = \omega_uC_L$, thermal noise $g_m = 4kT\gamma/\overline{V_n^2}$) fixes $I_D = g_m/(g_m/I_D)$, and $SR$ fixes $I_D$ directly. The larger of the two wins.
> - Mismatch has two terms with opposite instructions: a voltage port (offset) divides $\Delta\beta/\beta$ by $g_m/I_D$, a current port (mirror copy) multiplies $\Delta V_{TH}$ by it ([[Nonlinearity and Mismatch#Level 5 Mismatch Beyond the Square Law]]).

## Level 0: Any Stage Is a Gm and an Rout

### The Gm·Rout Lemma

```tikz title="Any linear stage, seen from its output, is a Norton source G_m v_in in parallel with R_out. After Razavi Fig. 3.32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$v_{in}$} -- (0.5,0);
  \draw (0.5,-1) rectangle (2.7,1); \node[align=center] at (1.6,0) {linear\\ stage};
  \draw (2.7,0) -- (3.3,0) node[ocirc]{} node[above]{$v_{out}$};
  \node at (4.1,0) {$\Longrightarrow$};
  \draw (6.2,1.2) -- (9.0,1.2);
  \draw (6.2,1.2) to[cI, l_=$G_m v_{in}$] (6.2,-1.2);
  \draw (7.8,1.2) to[R, l=$R_{out}$] (7.8,-1.2);
  \draw (6.2,-1.2) -- (7.8,-1.2) node[ground]{};
  \draw (9.0,1.2) node[ocirc]{} node[right]{$v_{out}=-G_mR_{out}\,v_{in}$};
  \node[align=left,font=\scriptsize,anchor=west] at (5.6,-2.2) {$G_m$: short $v_{out}$ to ground, $i_{out}/v_{in}$\\ $R_{out}$: set $v_{in}=0$, look into the output};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = -G_mR_{out}}
$$

- $G_m$: short the output to AC ground and measure $i_{out}/v_{in}$.
- $R_{out}$: set $v_{in}=0$ and look into the output.
- Each one is easier to find than the whole gain. $G_m$ usually comes from one transistor, and you raise the gain by raising $R_{out}$, which is the whole idea behind the [[#Cascode|cascode]].

> [!tip] Remark
> Gain is a **slope at a bias point**: $A_v = \partial V_{out}/\partial V_{in}$. If the slope changes as the signal swings, the stage distorts. This is why every analysis starts by fixing the [[MosFETs#Regions of Operation|region]] of each device.

### Looking Into the Gate, Drain, and Source

```tikz title="What a MOSFET looks like from each terminal (all gates at AC ground except the left one). After Razavi Fig. 3.56."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  % gate
  \draw (0,0) node[nmos](A){};
  \draw (A.S) -- ++(0,-0.3) node[ground]{};
  \draw (A.D) -- ++(0,0.3) node[right,font=\scriptsize]{any load};
  \draw (A.G) -- ++(-0.3,0) coordinate (g);
  \draw[<-] (g) -- ++(-0.8,0) node[left]{$R_G=\infty$};
  \node[font=\bfseries] at (-0.6,-3.4) {gate};
  % drain
  \draw (5,0) node[nmos](B){};
  \draw (B.G) -- ++(-0.4,0) node[left]{$V_b$};
  \draw (B.S) to[R, l=$R_S$] ++(0,-1.4) node[ground]{};
  \draw (B.D) -- ++(0,0.4) coordinate (d);
  \draw[<-] (d) -- ++(0,0.6);
  \node[above] at (5,1.55) {$r_o+\left[1+(g_m+g_{mb})r_o\right]R_S$};
  \node[font=\bfseries,align=center] at (5,-3.4) {drain: $R_S$ multiplied up};
  % source
  \draw (10.6,0) node[nmos](C){};
  \draw (C.G) -- ++(-0.4,0) node[left]{$V_b$};
  \draw (C.D) to[R, l=$R_D$] ++(0,1.4) node[vcc]{$V_{DD}$};
  \draw (C.S) -- ++(0,-0.3) coordinate (s);
  \draw[<-] (s) -- ++(0,-0.6);
  \node[below] at (10.6,-1.75) {$\dfrac{R_D+r_o}{1+(g_m+g_{mb})r_o}$};
  \node[font=\bfseries,align=center] at (10.6,-3.4) {source: $R_D$ divided down};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{\text{gate}} = \infty}\qquad
\boxed{R_{\text{drain}} = r_o + \left[1+(g_m+g_{mb})r_o\right]R_S}\qquad
\boxed{R_{\text{source}} = \frac{R_D + r_o}{1+(g_m+g_{mb})r_o}}
$$

A transistor **multiplies resistance up** from source to drain, and **divides it down** from drain to source, by roughly its intrinsic gain.

| Special case | Result | Where it shows up |
|---|---|---|
| Diode-connected (gate tied to drain) | $\frac{1}{g_m+g_{mb}}\parallel r_o \approx \frac{1}{g_m}$ | [[#Choosing the Load|diode load]], [[Current Mirrors]] |
| Source, $R_D = 0$ | $\frac{1}{g_m+g_{mb}}\parallel r_o$ | [[#Source Follower|follower output]] |
| Source, $R_D = r_o$ | $\approx 2/g_m$ | CG with current-mirror load (Carusone) |
| Source, $R_D\to\infty$ (ideal current source) | $\infty$ | cascode device with cascode load |
| Drain, $R_S = 0$ | $r_o$ | plain current source |
| Drain, $R_S = r_{o1}$ | $\approx g_{m2}r_{o2}r_{o1}$ | [[#Cascode|cascode]] |

> [!tip] Remark
> The $g_{mb}$ terms come from the [[MosFETs#Body Effect|body effect]]: whenever the source moves and the bulk doesn't, the bulk acts as a second gate. Drop $g_{mb}$ when the source is at AC ground, and in a PMOS whose bulk is tied to its source.

> [!note]- Derivation: the three impedances from the small-signal model (Razavi §3.3.6, §3.5)
> **Source, $R_D=0$ (diode / follower).** Apply $V_X$ at the source with gate grounded: $v_{gs} = v_{bs} = -V_X$. KCL gives $I_X = (g_m+g_{mb})V_X + V_X/r_o$, so $R = \frac{1}{g_m+g_{mb}}\parallel r_o$ (Eq. 3.22–3.23).
>
> **Drain with $R_S$.** The test current $I_X$ flows through $R_S$, so $v_{gs} = v_{bs} = -I_XR_S$. The current in $r_o$ is $I_X + (g_m+g_{mb})R_SI_X$. Add the drops across $r_o$ and $R_S$:
> $$V_X = r_o\left[1+(g_m+g_{mb})R_S\right]I_X + R_SI_X \;\Rightarrow\; R_{out} = \left[1+(g_m+g_{mb})R_S\right]r_o + R_S$$
> Read it two ways: $r_o$ boosted by $1+(g_m+g_{mb})R_S$ then plus $R_S$, or $R_S$ boosted by $1+(g_m+g_{mb})r_o$ then plus $r_o$ (Eqs. 3.65–3.66). Intuition: raise the drain by $\Delta V$; the source rises a little, which *reduces* $v_{gs}$ and fights the current increase.
>
> **Source with $R_D$.** Current through $r_o$ is $I_X - (g_m+g_{mb})V_X$; drops across $R_D$ and $r_o$ sum to $V_X$:
> $$R_DI_X + r_o\left[I_X-(g_m+g_{mb})V_X\right] = V_X\;\Rightarrow\;\frac{V_X}{I_X} = \frac{R_D+r_o}{1+(g_m+g_{mb})r_o}\approx\frac{R_D}{(g_m+g_{mb})r_o}+\frac{1}{g_m+g_{mb}}$$
> (Eqs. 3.115–3.117.) With $R_D\to\infty$ the device current can't change, so $I_X = 0$ and the impedance is infinite.

### Picking the Simplest Model

1. Break the circuit into CS, CG, follower and cascode blocks.
2. Model every saturated device as $g_mv_{gs}$ alone.
3. Add $r_o$ only where a drain sees a high impedance (another drain, a current source).
4. Second pass: add $g_{mb}$ where a source is off AC ground.
5. For bias, drop $\lambda$ and $\gamma$ on the first pass.

Short-channel devices don't follow these formulas exactly; hand analysis is for insight and simulation is for numbers. Razavi: "Don't let the computer think for you."

> [!note]- Detail: how much the simple model throws away (Razavi Eq. 3.77)
> The full degenerated-CS gain is $A_v = \dfrac{-g_mr_oR_D}{R_D+R_S+r_o+(g_m+g_{mb})R_Sr_o}$. Divide through by $g_mr_o$ and write $g_{mb}=\eta g_m$:
> $$A_v = \frac{-R_D}{\dfrac{R_D+R_S}{g_mr_o}+\dfrac1{g_m}+(1+\eta)R_S}$$
> While $R_D+R_S\ll r_o$ the first term is negligible and the result collapses to $-R_D/(1/g_m+R_S)$. It fails for a current-source load, where $R_D\gtrsim r_o$: that is exactly when step 3 says to keep $r_o$. (Zettelkasten 2z.)

## Common-Source Stage

### Resistive Load

```tikz title="CS with resistor load: off, then saturation (where it amplifies), then triode past point A where V_out = V_in - V_TH. After Razavi Fig. 3.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (-2.6,1.6) node[nmos](M){};
  \draw (M.S) -- ++(0,-0.3) node[ground]{};
  \draw (M.D) to[R, l=$R_D$] ++(0,1.5) node[vcc]{$V_{DD}$};
  \draw (M.G) -- ++(-0.4,0) node[left]{$V_{in}$};
  \draw (M.D) ++(0,0.2) -- ++(0.5,0) node[right]{$V_{out}$};
  \draw[->] (0,0) -- (5.6,0) node[right] {$V_{in}$};
  \draw[->] (0,0) -- (0,4.6) node[above] {$V_{out}$};
  \draw[thick] (0,4) -- (1,4);
  \draw[thick,domain=1:2.456,samples=40] plot (\x,{4-1.2*(\x-1)*(\x-1)});
  \draw[thick] plot[smooth] coordinates {(2.456,1.456) (2.9,1.0) (3.5,0.72) (4.2,0.55) (5.2,0.42)};
  \draw[dashed] (1,0) -- (4.0,3.0) node[right,font=\scriptsize] {$V_{out}=V_{in}-V_{TH}$};
  \fill (2.456,1.456) circle (1.5pt) node[right,font=\scriptsize] {$A$};
  \draw[dotted] (2.456,0) -- (2.456,1.456);
  \node[below] at (1,0) {$V_{TH}$};
  \node[below] at (2.456,0) {$V_{in1}$};
  \node[left] at (0,4) {$V_{DD}$};
  \node[font=\scriptsize] at (0.5,4.3) {off};
  \node[font=\scriptsize,anchor=west] at (1.7,3.95) {saturation: slope $-g_mR_D$};
  \node[font=\scriptsize] at (4.3,0.95) {triode};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = -g_mR_D = -\sqrt{2\mu_nC_{ox}\frac WL I_D}\,R_D = -\frac{2V_{RD}}{V_{OV}}}\qquad
\boxed{A_v = -g_m(R_D\parallel r_o)}
$$

- Input gate → output drain, inverting, $R_{in} = \infty$.
- Keep $V_{out} > V_{in}-V_{TH}$ (left of $A$). Past $A$, $M_1$ is in triode and $g_m$ collapses.
- $V_{RD} = I_DR_D$ is the DC drop across the resistor. More gain means more drop, so less swing: gain, swing, and bandwidth trade.

> [!tip] Remark
> $A_v = -2V_{RD}/V_{OV}$ is just $g_m = 2I_D/V_{OV}$ from [[MosFETs#Transconductance]] times $R_D = V_{RD}/I_D$. Gain per volt of headroom is fixed by overdrive.

> [!note]- Derivation: gain from the large-signal curve (Razavi Eqs. 3.3–3.17)
> In saturation, $V_{out} = V_{DD} - R_D\cdot\frac12\mu_nC_{ox}\frac WL(V_{in}-V_{TH})^2$. Differentiate: $A_v = -R_D\mu_nC_{ox}\frac WL(V_{in}-V_{TH}) = -g_mR_D$. With CLM, $(1+\lambda V_{out})$ multiplies the current; differentiating gives $A_v = -g_mR_D - (R_D/r_o)A_v$, so $A_v = -g_m(r_o\parallel R_D)$.
>
> Large signals: $g_m$ itself tracks $V_{in}$, so the gain changes with the swing. That *is* nonlinearity. To linearize, make the gain a weak function of $g_m$ (degeneration, diode load).
>
> In deep triode, $V_{out} = V_{DD}\frac{R_{on}}{R_{on}+R_D}$, and the triode slope peaks at point $A$ (Eq. 3.11).

> [!note]- Detail: what nanometer numbers look like (Razavi, Nanometer Design Notes, Ch. 3)
> - 40 nm, $W/L = 2\,\mu\text{m}/40$ nm, $R_D = 2$ kΩ, $V_{DD} = 1$ V: gain about 3 for $V_{in}$ from 0.4 to 0.6 V; output usable from about 0.3 to 0.8 V.
> - Starting point for a design: $W/L = 0.5\,\mu\text{m}/40$ nm at 50 µA gives (simulated) $g_m = 0.45$ mS; a gain of 10 then needs $R_D = 22.2$ kΩ (if $\lambda=0$).

### Intrinsic Gain: The Ceiling

Replace $R_D$ by an ideal current source: the only resistance left at the drain is $r_o$.

$$
\boxed{A_{v,\max} = -g_mr_o}
$$

```tikz title="Intrinsic gain vs current density, for three channel lengths (shape only). Flat in weak inversion, falling as 1/sqrt(I_D/W) in strong inversion. Region boundaries from ECE 636 'Designing for Gain and Bandwidth' slides 5-7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \fill[gray!12] (0,0) rectangle (2.4,4.4);
  \fill[gray!12] (4.8,0) rectangle (7.2,4.4);
  \draw[->] (0,0) -- (7.6,0) node[right] {$I_D/W$ (A/m, log)};
  \draw[->] (0,0) -- (0,4.7) node[above] {$g_mr_o$};
  \foreach \e/\x in {-3/0,-2/1.2,-1/2.4,0/3.6,1/4.8,2/6.0,3/7.2} { \draw (\x,0.08) -- (\x,-0.08) node[below,font=\scriptsize] {$10^{\e}$}; }
  \foreach \L in {1,2,3} {
    \draw[thick,domain=-3:3,samples=80] plot ({1.2*(\x+3)},{1.25*\L/sqrt(1+pow(10,\x)*\L)});
  }
  \draw[->] (0.6,1.1) -- (0.6,3.95) node[midway,right,font=\scriptsize,align=left] {$L$\\ up};
  \node[font=\scriptsize] at (1.2,4.5) {weak};
  \node[font=\scriptsize] at (3.6,4.5) {moderate};
  \node[font=\scriptsize] at (6.0,4.5) {strong};
  \node[font=\scriptsize,anchor=west] at (2.5,3.3) {WI: $\dfrac{1}{nV_T}\dfrac{L}{\lambda'}$ (flat in $I_D/W$)};
  \node[font=\scriptsize,anchor=west] at (4.2,1.8) {SI: $\dfrac{\sqrt{2\mu_nC_{ox}}}{\lambda'}\dfrac{\sqrt L}{\sqrt{I_D/W}}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{SI: } g_mr_o = \frac{\sqrt{2\mu_nC_{ox}}}{\lambda'}\frac{\sqrt L}{\sqrt{I_D/W}}}\qquad
\boxed{\text{WI: } g_mr_o = \frac{1}{nV_T}\frac{L}{\lambda'}}\qquad (\lambda = \lambda'/L)
$$

- Two knobs: **lower $I_D/W$** and **longer $L$**. Gain is maximized in weak inversion.
- Regions by current density (ECE 636): $I_D/W < 0.1$ A/m weak, $> 10$ A/m strong, between is moderate.
- Short-channel $g_mr_o$ is only about 5–10 (Razavi). Older textbooks quote 10–100 (Carusone): that is long-channel data.
- The same knobs push $f_T$ the other way: $f_T \propto \sqrt{I_D/W}/L^{3/2}$ in strong inversion. Gain vs. speed is the core trade of [[The Amplifier's Design Sheet]].

> [!tip] Remark
> This is [[MosFETs#Output Resistance and Intrinsic Gain|$g_mr_o = 2/(\lambda V_{OV})$]] rewritten with current density instead of overdrive. The $g_m/I_D$ design view is in [[MosFETs#Why gm/ID, why ID/W]] and [[gm-ID Design Methodology]].

> [!note]- Detail: if $I_D$ is fixed by $I_1$, how does $V_{in}$ change the current? (Razavi Ex. 3.3)
> KCL forces $I_{D1} = I_1$. Write $I_{D1} = \frac12\mu_nC_{ox}\frac WL(V_{in}-V_{TH})^2(1+\lambda V_{out})$: when $V_{in}$ rises, $V_{out}$ must fall so the product stays constant. "The current rises with $V_{in}$" refers only to the square-law factor; the $\lambda V_{out}$ factor gives it back. That is why the gain is limited by $r_o$.

### Choosing the Load

```tikz title="Five CS loads and their gains. After Razavi Figs. 3.4, 3.13, 3.18, 3.20, 3.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,font=\small]
  \foreach \i/\x/\t/\g in {1/0/{resistor}/{$-g_{m1}(R_D\|r_{o1})$},2/3.4/{diode (NMOS)}/{$-\dfrac{g_{m1}}{g_{m2}+g_{mb2}}$},3/6.8/{current source}/{$-g_{m1}(r_{o1}\|r_{o2})$},4/10.2/{active (CMOS)}/{$-(g_{m1}+g_{m2})(r_{o1}\|r_{o2})$},5/13.6/{triode}/{$-g_{m1}(R_{on2}\|r_{o1})$}} {
    \draw (\x,0) node[nmos](M\i){};
    \draw (M\i.S) -- ++(0,-0.3) node[ground]{};
    \draw (M\i.D) -- ++(0,0.3) coordinate (o);
    \draw (o) node[circ]{} -- ++(0.6,0) node[right]{$V_{out}$};
    \node[font=\bfseries\scriptsize] at (\x,-1.9) {\t};
    \node[font=\scriptsize] at (\x,-2.7) {\g};
  }
  \foreach \i in {1,2,3,5} { \draw (M\i.G) -- ++(-0.3,0) node[left]{$V_{in}$}; }
  \draw (0.0,1.07) to[R, l=$R_D$] (0.0,2.6) node[vcc]{$V_{DD}$};
  \draw (3.4,2.25) node[nmos](D){};
  \draw (D.S) -- (3.4,1.07);
  \draw (D.D) -- ++(0,0.3) coordinate (dt) -- ++(0,0.1) node[vcc]{$V_{DD}$};
  \draw (D.G) -- ++(-0.3,0) |- (dt);
  \draw (6.8,2.25) node[pmos](P){};
  \draw (P.D) -- (6.8,1.07);
  \draw (P.S) -- ++(0,0.2) node[vcc]{$V_{DD}$};
  \draw (P.G) -- ++(-0.3,0) node[left]{$V_b$};
  \draw (10.2,2.25) node[pmos](Q){};
  \draw (Q.D) -- (10.2,1.07);
  \draw (Q.S) -- ++(0,0.2) node[vcc]{$V_{DD}$};
  \draw (Q.G) -- ++(-0.4,0) coordinate (qg) |- (M4.G);
  \draw (qg |- M4.G) node[circ]{} -- ++(-0.4,0) node[left]{$V_{in}$};
  \draw (13.6,2.25) node[pmos](T){};
  \draw (T.D) -- (13.6,1.07);
  \draw (T.S) -- ++(0,0.2) node[vcc]{$V_{DD}$};
  \draw (T.G) -- ++(-0.3,0) node[left]{$V_b$};
\end{circuitikz}
\end{document}
```

| Load | $A_v$ | Max $V_{out}$ | Strength | Weakness |
|---|---|---|---|---|
| Resistor $R_D$ | $-g_{m1}(R_D\parallel r_{o1})$ | $\approx V_{DD}$ | low cap, low noise, accurate | gain costs DC drop $I_DR_D$ |
| Diode-connected | $-\dfrac{g_{m1}}{g_{m2}}\dfrac{1}{1+\eta}$ (NMOS), $-\sqrt{\dfrac{\mu_n(W/L)_1}{\mu_p(W/L)_2}}$ (PMOS) | $\approx V_{DD}-\lvert V_{TH2}\rvert$ | linear, set by geometry ratio | low gain; gain costs swing |
| Current source | $-g_{m1}(r_{o1}\parallel r_{o2})$ | $V_{DD}-\lvert V_{OV2}\rvert$ | highest gain per headroom | output DC level undefined without feedback |
| Active (complementary) | $-(g_{m1}+g_{m2})(r_{o1}\parallel r_{o2})$ | $V_{DD}-\lvert V_{OV2}\rvert$ | doubles $G_m$ for free current | bias set by PVT; amplifies supply noise |
| Triode | $-g_{m1}(R_{on2}\parallel r_{o1})$ | $V_{DD}$ | least headroom | $R_{on2}$ tracks $\mu_pC_{ox}$, $V_{TH}$, $V_b$ |

Resistor, current-source and active loads are the ones used in practice (Razavi).

**Diode-connected load.** The gain is a ratio of sizes, so it holds across bias and is fairly linear: $M_1$ squares, $M_2$ square-roots, $f^{-1}(f(x)) = x$. The cost is swing:

$$
\boxed{|A_v| = \frac{|V_{OV2}|}{V_{OV1}}}\qquad\text{(PMOS diode load, }\lambda = 0\text{)}
$$

A gain of 5 needs $\mu_n(W/L)_1/[\mu_p(W/L)_2] = 25$, so $(W/L)_1\approx 12.5(W/L)_2$, and $M_2$ needs 5× the overdrive of $M_1$. With $V_{OV1} = 100$ mV and $|V_{TH2}| = 0.3$ V, $|V_{GS2}| = 0.8$ V eats most of the supply (Razavi §3.3.2).

> [!note]- Detail: buying back swing with a bleed current, and the trap in differentiating it (Razavi Exs. 3.6–3.7)
> Add a current source $I_S = 0.75I_1$ from $V_{DD}$ into the output, so the diode carries only $I_1/4$. Then $|A_v| = \sqrt{4\mu_n(W/L)_1/[\mu_p(W/L)_2]}$ and $|V_{OV2}|/V_{OV1} = A_v/4$: a gain of 5 now needs only 1.25× the overdrive.
>
> **Trap:** differentiating the bias equation $\mu_n(W/L)_1V_{OV1}^2 = 4\mu_p(W/L)_2V_{OV2}^2$ gives $-g_{m1}/(4g_{m2})$, which is wrong. That equation holds at **one** $V_{in}$ only: once the signal moves, $I_{D1}$ is no longer $4|I_{D2}|$. Differentiate only relations that hold for every input, like KCL. (Zettelkasten 2c3.)

> [!note]- Detail: the "paradox" of $|A_v| = g_{m1}/g_{m2}$ (Razavi Eqs. 3.37–3.39)
> Writing $g_m = \mu C_{ox}(W/L)V_{OV}$ makes the gain look *inversely* proportional to $|V_{OV2}|$, while Eq. 3.37 says it is *proportional*. Both are right: Eq. 3.39 holds the sizes fixed, Eq. 3.37 holds the current fixed (sizes adjust). Always ask what is held constant.

**Current-source load.** A transistor in saturation does not obey Ohm's law: its small-signal resistance $r_{o2}$ is huge while its DC drop is only $|V_{OV2}|$, which can be under 100 mV by widening $M_2$. Longer $L_2$ raises $r_{o2}$ at the cost of capacitance (and of $|V_{DS2,min}|$ if $W_2$ is held). Carusone Ex. 3.2: $W/L = 10/0.4$, 100 µA, 0.35 µm: $g_{m1} = 0.97$ mA/V, $r_{ds} = 25$ kΩ, $A_v = -12.1$. To get 20% more gain at fixed current, widen $W_1$ by 44% ($g_m\propto\sqrt W$).

> [!warning] Bias
> Two current sources in series (the $M_1$ drain and $M_2$) leave the output DC level undefined. The stage must sit inside a feedback loop that sets $V_{out}$ ([[Feedback]], [[Biasing]]).

**Active (complementary) load.** Drive both gates: the PMOS stops being a passive current source and becomes a second amplifying device in parallel. Same $r_{o1}\parallel r_{o2}$, more $G_m$, no extra current. Two problems: $V_{GS1}+|V_{GS2}| = V_{DD}$ means the bias current swings with supply and threshold, and the supply leaks to the output with gain $(g_{m2}+1/r_{o2})(r_{o1}\parallel r_{o2})$, about half the signal gain. Fixed in [[Biasing]].

**Triode load.** Gate of $M_2$ held low enough to keep it in deep triode: $R_{on2} = 1/[\mu_pC_{ox}(W/L)_2(V_{DD}-V_b-|V_{THP}|)]$. Output can reach $V_{DD}$, but the gain wanders with process and temperature.

> [!tip] Remark
> $R_{on2}$ is the [[MosFETs#Regions of Operation|deep-triode resistance]], and the diode's $1/g_m$ is the [[#Looking Into the Gate, Drain, and Source|source-impedance rule]] with $R_D = 0$.

> [!note]- Detail: the bulk as the input (Razavi Ex. 3.4)
> Hold the gate at DC and drive the bulk: $v_{gs}=0$, $v_{bs}=v_{in}$, so $i_d = g_{mb}v_{in}$ and $A_v = -g_{mb}R_D$. Rarely worth it (the gain is $\eta$ times smaller), but it frees the gate in low-headroom designs. (Zettelkasten 2b5.)

> [!note]- Detail: minimum-length devices give very little gain (Razavi, Nanometer Design Notes, §3.3.4)
> 40 nm CS with current-source load, NMOS $5\,\mu\text{m}/40$ nm, PMOS $10\,\mu\text{m}/40$ nm, $V_{DD}=1$ V: peak gain about 2.5, usable output range about 0.7 V. High gain at short $L$ needs cascodes or several stages.

### Source Degeneration

```tikz title="Degeneration: G_m starts at g_m near threshold and saturates at 1/R_S once g_m R_S >> 1. After Razavi Fig. 3.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (-2.6,1.4) node[nmos](M){};
  \draw (M.S) to[R, l=$R_S$] ++(0,-1.4) node[ground]{};
  \draw (M.D) to[R, l=$R_D$] ++(0,1.5) node[vcc]{$V_{DD}$};
  \draw (M.G) -- ++(-0.4,0) node[left]{$V_{in}$};
  \draw (M.D) ++(0,0.2) node[circ]{} -- ++(0.5,0) node[right]{$V_{out}$};
  \draw[->] (0,0) -- (6.4,0) node[right] {$V_{in}$};
  \draw[->] (0,0) -- (0,4.2) node[above] {$G_m$};
  \draw[dashed] (1,0) -- (3.4,3.6) node[above,font=\scriptsize] {$g_m$ alone ($R_S=0$)};
  \draw[thick,domain=1:6,samples=50] plot (\x,{(1.5*(\x-1))/(1+1.5*(\x-1)/2.5)});
  \draw[dotted] (0,2.5) -- (6.2,2.5);
  \node[left] at (0,2.5) {$1/R_S$};
  \node[below] at (1,0) {$V_{TH}$};
  \node[font=\scriptsize,anchor=west] at (3.8,0.85) {$G_m=\dfrac{g_m}{1+g_mR_S}$};
  \node[font=\scriptsize,anchor=west] at (1.9,0.3) {near $V_{TH}$: $G_m\approx g_m$};
  \node[font=\scriptsize,anchor=west] at (4.4,2.75) {$G_m\to1/R_S$};
\end{circuitikz}
\end{document}
```

$$
\boxed{G_m = \frac{g_m}{1+g_mR_S}}\qquad
\boxed{A_v = -\frac{R_D}{1/g_m + R_S}}
$$

- **Gain by inspection:** resistance seen at the drain over the total resistance in the source path ($1/g_m$ of the device plus whatever is below it).
- For $g_mR_S\gg1$: $A_v\to -R_D/R_S$, a ratio of resistors, so linear and nearly independent of the device. Paid in gain (and [[Noise]]).
- Part of $\Delta V_{in}$ appears across $R_S$ instead of across $V_{GS}$: the current varies more gently.

> [!tip] Remark
> Same algebra as negative [[Feedback]]: $g_m$ is the forward gain, $R_S$ the feedback factor, $1+g_mR_S$ the loop gain. Degeneration also **boosts the output resistance** to $r_o+[1+(g_m+g_{mb})r_o]R_S$: this is the [[#Looking Into the Gate, Drain, and Source|drain rule]], and it is how the cascode works.

$$
\boxed{G_m = \frac{g_mr_o}{R_S+\left[1+(g_m+g_{mb})R_S\right]r_o}}\qquad\text{(with } r_o, g_{mb}\text{)}
$$

$$
\boxed{A_v = \frac{-g_mr_oR_D}{R_D+R_S+r_o+(g_m+g_{mb})R_Sr_o}} = -G_m\left(R_D\parallel R_{out}\right)
$$

> [!note]- Derivation: $G_m$ with and without $r_o$ (Razavi Eqs. 3.52–3.61)
> **Without $r_o$:** $V_{GS} = V_{in}-I_DR_S$, so $\partial V_{GS}/\partial V_{in} = 1 - R_S\,\partial I_D/\partial V_{in}$. Then $G_m = g_m(1-R_SG_m)$, giving $G_m = g_m/(1+g_mR_S)$.
>
> **With $r_o$ and $g_{mb}$:** output shorted, current $I_{out}$ through $R_S$, $V_1 = V_{in}-I_{out}R_S$, $v_{bs} = -I_{out}R_S$. KCL at the source:
> $$I_{out} = g_m(V_{in}-I_{out}R_S) - g_{mb}I_{out}R_S - \frac{I_{out}R_S}{r_o}$$
> Solve for $I_{out}/V_{in}$.
>
> **Full gain:** the current through $R_S$ equals that through $R_D$, $-V_{out}/R_D$. Writing the $r_o$ current and summing the drops gives Eq. 3.77. Splitting it, the first factor is $G_m$ (Eq. 3.61), the second is $R_D\parallel R_{out}$: the $G_mR_{out}$ lemma again.

> [!note]- Detail: degeneration under an ideal current-source load does nothing (Razavi Ex. 3.11)
> With $R_D\to\infty$: $A_v = -G_mR_{out} = -g_mr_o$, independent of $R_S$. The current through $R_S$ can't change, so there is no signal across it, as if $R_S = 0$.

> [!note]- Detail: a diode as the degeneration (Razavi Ex. 3.10)
> Degenerate $M_1$ with a diode-connected $M_2$ ($\lambda=\gamma=0$): the source path is $1/g_{m1}+1/g_{m2}$, so $A_v = -R_D/(1/g_{m1}+1/g_{m2})$. One line, using the rule.

## Source Follower

```tikz title="Source follower (left). With an ideal current source and lambda = 0, g_mb acts as a resistor 1/g_mb at the output, giving the Thevenin divider on the right. After Razavi Figs. 3.37 and 3.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (0,1.4) node[nmos](M){};
  \draw (M.D) -- ++(0,0.4) node[vcc]{$V_{DD}$};
  \draw (M.G) -- ++(-0.4,0) node[left]{$V_{in}$};
  \draw (M.S) -- ++(0,-0.3) coordinate (o) to[I, l=$I_1$] ++(0,-1.6) node[ground]{};
  \draw (o) node[circ]{} -- ++(0.7,0) node[right]{$V_{out}=V_{in}-V_{GS}$};
  \node[font=\scriptsize,align=center] at (0.3,-2.4) {source follower\\ (common drain)};
  % Thevenin model
  \draw (4.6,1.6) node[ocirc]{} node[left]{$v_{in}$} to[R, l=$1/g_m$] (7.4,1.6) node[circ]{} -- (8.4,1.6) node[ocirc]{} node[right]{$v_{out}$};
  \draw (7.4,1.6) to[R, l=$1/g_{mb}$] (7.4,-0.4) node[ground]{};
  \node[font=\scriptsize,align=center] at (6.6,-1.9) {ideal $I_1$, $\lambda=0$:\\ $A_v=\dfrac{1/g_{mb}}{1/g_m+1/g_{mb}}=\dfrac{g_m}{g_m+g_{mb}}=\dfrac{1}{1+\eta}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = \frac{g_mR_S}{1+(g_m+g_{mb})R_S}}\qquad
\boxed{A_v\big|_{R_S\to\infty} = \frac{g_m}{g_m+g_{mb}} = \frac{1}{1+\eta}}\qquad
\boxed{R_{out} = \frac{1}{g_m+g_{mb}}}
$$

$$
\boxed{A_v = \frac{R_{eq}}{R_{eq}+1/g_m},\qquad R_{eq} = \frac{1}{g_{mb}}\parallel r_{o1}\parallel r_{o2}\parallel R_L}
$$

- Input at the gate (high $R_{in}$), output at the source, which "follows" the gate one $V_{GS}$ lower.
- Gain is below 1 even with an ideal current source, because of the body effect; $\eta$ stays above about 0.2 for typical $V_{SB}$ (Razavi). Carusone Ex. 3.4: $g_{s}\approx 0.13g_m$, $A_v = 0.8$ V/V; without body effect about $-0.9$ dB.
- It is unilateral at low frequency: nothing flows from output back to input (Carusone).

> [!tip] Remark
> The $1/g_{mb}$ resistor is a trick that works **only** in a follower: the $g_{mb}v_{bs}$ source sits across its own controlling voltage $v_{out}$, so it behaves like a resistor. The output resistance $1/(g_m+g_{mb})$ is the [[#Looking Into the Gate, Drain, and Source|source rule]] with $R_D = 0$.

**Three drawbacks, so avoid followers unless they're needed:**

1. **Nonlinear.** $V_{TH}$ depends on $V_{out}$ through the body effect ([[MosFETs#Body Effect]]), and short-channel $r_o$ moves with $V_{DS}$. Fix: a PMOS follower in its own n-well with bulk tied to source (higher $R_{out}$, lower mobility).
2. **Eats headroom.** The level shift is $V_{GS}$. A CS stage followed by a follower needs $V_X\ge V_{GS2}+V_{OV3}$ instead of $V_{OV1}$: about one $V_{GS}$ of swing lost.
3. **Poor driver.** Into a load $R_L$ at the same bias current: follower $\approx g_{m1}R_L/(1+g_{m1}R_L)$, CS $\approx -g_{m1}R_L$. With $R_L = 1/g_{m1}$ the follower gives 0.5 and the CS stage about 1.

Followers are also noisy ([[Noise]]). Their main use is **level shifting** (to let the next stage's input sit near a rail).

> [!note]- Derivation: gain by differentiating the large-signal curve (Razavi Eqs. 3.82–3.86)
> $\frac12\mu_nC_{ox}\frac WL(V_{in}-V_{TH}-V_{out})^2R_S = V_{out}$. Differentiate, with $\partial V_{TH}/\partial V_{in} = \eta\,\partial V_{out}/\partial V_{in}$:
> $$\frac{\partial V_{out}}{\partial V_{in}} = \frac{g_mR_S}{1+g_mR_S(1+\eta)}$$
> The gain rises from 0 at $V_{in}\approx V_{TH}$ toward $1/(1+\eta)$ as $g_m$ grows. With a resistor bias, $I_D$ (and so $V_{GS}$) varies with the input: use a current source.
>
> **Why gain is 1 with ideal $I_1$ and $\lambda=\gamma=0$:** $I_D$ is constant, so $V_{GS}$ is constant, so $V_{out} = V_{in}-V_{GS}$ tracks exactly (Ex. 3.13).

> [!note]- Detail: worked bias example (Razavi Ex. 3.12)
> $(W/L)_1 = 20/0.5$, $I_1 = 200$ µA, $V_{TH0} = 0.6$ V, $2\phi_F = 0.7$ V, $\mu_nC_{ox} = 50\ \mu\text{A/V}^2$, $\gamma = 0.4\ \text{V}^{1/2}$, $V_{in} = V_{DD} = 1.2$ V. First pass with $V_{TH} = 0.6$ V gives $V_{out} = 0.153$ V; updating $V_{TH}$ for $V_{SB}$ gives 0.635 V, so $V_{out}\approx 0.118$ V. For the current-source NMOS $M_2$ to stay saturated with $V_{DS2} = 0.118$ V at 200 µA it needs $(W/L)_2 \ge 287/0.5$: a big device with big drain capacitance at the output.

> [!note]- Detail: follower loaded by a diode (Razavi Ex. 3.14)
> Replace the current source by a diode-connected $M_2$: its source impedance $\frac1{g_{m2}+g_{mb2}}\parallel r_{o2}$ joins $1/g_{mb1}$ and $r_{o1}$ in $R_{eq}$, then $A_v = R_{eq}/(R_{eq}+1/g_{m1})$.

## Common-Gate Stage

$$
\boxed{A_v = (g_m+g_{mb})R_D = g_m(1+\eta)R_D}\qquad(\lambda = 0,\ R_S = 0)
$$

- Input at the source, output at the drain, gate at a DC bias. **Non-inverting.** Same magnitude as CS, slightly more from the body effect.
- The bias current of $M_1$ flows through the input source (or through an extra current source, with the signal AC-coupled).
- Its value is the **low input resistance**: terminating a 50 Ω line, or taking a current input.

```tikz title="CG input resistance is low only if the drain load is small: it grows linearly with R_D and is infinite for an ideal current-source load. After Razavi Eq. 3.116 and Carusone Eq. 3.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (-3,1.6) node[nmos](M){};
  \draw (M.D) to[R, l=$R_D$] ++(0,1.5) node[vcc]{$V_{DD}$};
  \draw (M.D) ++(0,0.2) node[circ]{} -- ++(0.5,0) node[right]{$v_{out}$};
  \draw (M.G) -- ++(-0.4,0) node[left]{$V_b$};
  \draw (M.S) -- ++(0,-0.2) coordinate (x) to[R, l=$R_S$] ++(0,-1.4) to[sV, l=$v_{in}$] ++(0,-1.4) node[ground]{};
  \draw (x) node[circ]{} node[left]{$X$};
  \draw[<-] (x) ++(0.15,-0.05) -- ++(0.7,-0.4) node[right,font=\scriptsize]{$R_{in}$};
  % Rin vs RD
  \draw[->] (0.8,-1.5) -- (6.6,-1.5) node[right] {$R_D$};
  \draw[->] (0.8,-1.5) -- (0.8,2.6) node[above] {$R_{in}$};
  \draw[thick] (0.8,-1.0) -- (6.2,2.2);
  \node[left,font=\scriptsize] at (0.8,-1.0) {$\approx\dfrac{1}{g_m+g_{mb}}$};
  \draw[dotted] (2.8,-1.5) -- (2.8,0.185) -- (0.8,0.185);
  \node[below,font=\scriptsize] at (2.8,-1.5) {$r_o$};
  \node[left,font=\scriptsize] at (0.8,0.185) {$\approx\dfrac{2}{g_m}$};
  \node[font=\scriptsize,anchor=west] at (3.0,-0.6) {slope $\dfrac{1}{1+(g_m+g_{mb})r_o}$};
  \node[font=\scriptsize,anchor=west] at (4.0,2.4) {$R_D\to\infty$: $R_{in}\to\infty$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{in} = \frac{R_D+r_o}{1+(g_m+g_{mb})r_o}\approx\frac{1}{g_m+g_{mb}}+\frac{R_D}{(g_m+g_{mb})r_o}}
$$

$$
\boxed{A_v = \frac{(g_m+g_{mb})r_o+1}{r_o+(g_m+g_{mb})r_oR_S+R_S+R_D}\,R_D}\qquad
\boxed{R_{out} = R_D\parallel\left\{r_o+\left[1+(g_m+g_{mb})r_o\right]R_S\right\}}
$$

> [!tip] Remark
> Compare with the [[#Source Degeneration|degenerated CS]] gain: same denominator. A CG stage is a degenerated CS stage driven from the other end of $R_S$. Its $R_{out}$ is the drain rule with the source resistance $R_S$.

- With an ideal current-source load ($R_D\to\infty$): $A_v = (g_m+g_{mb})r_o+1$, **independent of $R_S$**, because the source impedance is infinite and node $X$ simply equals $v_{in}$ (Razavi Ex. 3.19).
- With a current-mirror load $R_D \approx r_o$: $R_{in}\approx 2/g_m$, twice the textbook value (Carusone). This is the usual trap.
- A real source resistance divides the input: $v_X/v_{in} = R_{in}/(R_S+R_{in})$.

> [!note]- Detail: CG as a 50 Ω terminator (Razavi Ex. 3.17, Carusone Ex. 3.5)
> A CS device drives a 50 Ω line. Terminating it with a 50 Ω resistor gives $-g_{m1}R_D$ with $R_D = 50$ Ω. Terminating it with a CG stage with $1/(g_{m2}+g_{mb2}) = 50$ Ω also gives $-g_{m1}R_D$, but now $R_D$ can be much larger than 50 Ω without reflections: more gain. Small device, large current (high $g_m$, low capacitance), large $V_{GS}$.
>
> Carusone's sizing, 0.18 µm, with a matched current-mirror load ($R_{in}\approx 2/g_{m1}$): $g_{m1} = 40$ mA/V; at $V_{eff} = 200$ mV that is $I_D = 4$ mA, a 40:1 mirror from 100 µA, $(W/L)_1 = 148/0.2$. Body effect and $r_{ds}$ make the real $R_{in}$ a bit lower.

> [!note]- Detail: current input (Razavi Ex. 3.20)
> Drive the source with $I_{in}$ shunted by $R_P$. Convert to Thévenin ($V = I_{in}R_P$, $R_S = R_P$):
> $$\frac{V_{out}}{I_{in}} = \frac{\left[(g_m+g_{mb})r_o+1\right]R_DR_P}{r_o+(g_m+g_{mb})r_oR_P+R_P+R_D},\qquad R_{out} = R_D\parallel\left\{\left[1+(g_m+g_{mb})r_o\right]R_P+r_o\right\}$$
> This is exactly the top half of a [[#Cascode|cascode]]: $R_P$ is the input device's $r_o$.

> [!note]- Detail: large-signal behaviour and the gain derivation (Razavi Eqs. 3.102–3.111, Ex. 3.16)
> For $V_{in}\ge V_b-V_{TH}$, $M_1$ is off and $V_{out} = V_{DD}$. Below that, $I_D = \frac12\mu_nC_{ox}\frac WL(V_b-V_{in}-V_{TH})^2$, and differentiating with $\partial V_{TH}/\partial V_{in} = \eta$ gives $g_m(1+\eta)R_D$. $M_1$ enters triode when $V_{out}$ falls to $V_b-V_{TH}$; choosing $V_{DD}-R_DI_D > V_b-V_{TH}$ (with $I_D$ at $V_{in}=0$) keeps it saturated over the whole range.
>
> Full gain: the current in $R_S$ is $-V_{out}/R_D$, so $V_1 = -V_{in}+V_{out}R_S/R_D$ (sign convention of Fig. 3.51). Write the $r_o$ current, sum drops, solve: Eq. 3.111.
>
> To maximize CG gain at fixed power: widen the device toward subthreshold (where $g_m\to I_D/(\xi V_T)$) and/or raise $R_D$.

## Cascode

A CS device converts $v_{in}$ to a current; a CG device on top passes that current to the load ("cascaded triodes"). $M_1$ is the **input device**, $M_2$ the **cascode device**. Stacked on the same current: **telescopic** cascode.

### Output Resistance and Gain

```tikz title="Telescopic cascode with cascode PMOS load. Each side looks like g_m r_o^2 into the output; each device needs its own overdrive. After Razavi Figs. 3.61, 3.70."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (M1.S) -- ++(0,-0.3) node[ground]{};
  \draw (M1.G) -- ++(-0.3,0) node[left]{$V_{in}$};
  \node[right,font=\scriptsize] at (0.1,0) {$M_1$};
  \draw (M1.D) -- ++(0,0.3) coordinate (x) node[circ]{} node[left,font=\scriptsize]{$X$};
  \draw (x) ++(0,0.77) node[nmos](M2){};
  \draw (M2.G) -- ++(-0.3,0) node[left]{$V_{b1}$};
  \node[right,font=\scriptsize] at (0.1,1.84) {$M_2$};
  \draw (M2.D) -- ++(0,0.4) coordinate (o);
  \draw (o) ++(0,1.17) node[pmos](M3){};
  \draw (M3.D) -- (o);
  \draw (M3.G) -- ++(-0.3,0) node[left]{$V_{b2}$};
  \node[right,font=\scriptsize] at (0.1,4.18) {$M_3$};
  \draw (M3.S) -- ++(0,0.3) coordinate (y);
  \draw (y) ++(0,0.77) node[pmos](M4){};
  \draw (M4.G) -- ++(-0.3,0) node[left]{$V_{b3}$};
  \node[right,font=\scriptsize] at (0.1,6.02) {$M_4$};
  \draw (M4.S) -- ++(0,0.2) node[vcc]{$V_{DD}$};
  \draw (o) node[circ]{} -- ++(2.0,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw[->] (1.2,2.9) -- (1.2,2.3) node[right,font=\scriptsize] {$\approx g_{m2}r_{o2}r_{o1}$};
  \draw[->] (1.2,3.12) -- (1.2,3.72) node[right,font=\scriptsize] {$\approx g_{m3}r_{o3}r_{o4}$};
  \draw[|<->|] (4.4,-0.77) -- (4.4,1.07) node[midway,right,font=\scriptsize] {$V_X\ge V_{OV1}$};
  \draw[|<->|] (4.4,1.07) -- (4.4,3.01) node[midway,right,font=\scriptsize] {$\ge V_{OV2}$};
  \draw[|<->|] (4.4,3.01) -- (4.4,4.95) node[midway,right,font=\scriptsize] {$\ge |V_{OV3}|$};
  \draw[|<->|] (4.4,4.95) -- (4.4,6.79) node[midway,right,font=\scriptsize] {$\ge |V_{OV4}|$};
  \node[font=\scriptsize,anchor=west] at (4.1,-1.3) {output swing $=V_{DD}-4V_{OV}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{R_{out} = \left[1+(g_{m2}+g_{mb2})r_{o2}\right]r_{o1}+r_{o2}\approx(g_{m2}+g_{mb2})\,r_{o2}\,r_{o1}}
$$

$$
\boxed{|A_v| \approx g_{m1}\left[(g_{m2}r_{o2}r_{o1})\parallel(g_{m3}r_{o3}r_{o4})\right]}\qquad
\boxed{|A_v|_{\text{ideal load}} = g_{m1}r_{o1}\left[(g_{m2}+g_{mb2})r_{o2}+1\right]\approx(g_mr_o)^2}
$$

- $G_m\approx g_{m1}$: the cascode doesn't add transconductance, it just **routes** $M_1$'s current. With $\lambda = 0$ the gain equals the plain CS gain $-g_{m1}R_D$.
- The gain comes from $R_{out}$: $M_2$ multiplies $r_{o1}$ by its own intrinsic gain.
- The **load must be just as good**. A simple current-source load ($r_{o,p}$) caps $R_{out}$ at about $r_o$ and the gain at about $g_mr_o$, barely 2× a CS stage. Use a cascode load.

> [!tip] Remark
> $R_{out}$ is the [[#Source Degeneration|degenerated-CS output resistance]] with $R_S = r_{o1}$. Read the cascode as "a CS device degenerated by $r_{o1}$" for $R_{out}$, and as "a CS stage driving a CG stage" for the signal path.

> [!note]- Detail: Carusone's numbers (Exs. 3.9–3.10)
> All devices $g_m\approx 0.5$ mA/V, $r_{ds}\approx 100$ kΩ.
> - **Simple current-source load** ($R_L\approx r_{ds}$): $r_{in2}\approx 2/g_m$, so $v_{s2}/v_{in}\approx -2$ (a plain CS stage with the same numbers gives $-25$), and $v_{out}/v_{s2}\approx\frac12g_mr_{ds}$. Overall $A_V\approx -g_mr_{ds} = -50$ (34 dB), $R_{out}\approx 100$ kΩ. Almost all the gain is across $Q_2$.
> - **Cascode load** ($R_L\approx g_mr_{ds}^2$): $r_{in2}\approx r_{ds}$, $A_V\approx -\frac12(g_mr_{ds})^2 = -1250$, $R_{out}\approx\frac12g_mr_{ds}^2 = 2.5$ MΩ.
>
> Carusone's caution: $r_{ds}$ is voltage-dependent and hard to predict, so never design a circuit that works only if the gain is exactly known, only if it exceeds a minimum.

> [!note]- Derivation: exact gain with ideal current-source load (Razavi Ex. 3.22)
> Short the output. $M_1$'s current $g_{m1}v_{in}$ splits between $r_{o1}$ and the source of $M_2$, which looks like $\frac{1}{g_{m2}+g_{mb2}}\parallel r_{o2}$:
> $$G_m = \frac{g_{m1}r_{o1}\left[(g_{m2}+g_{mb2})r_{o2}+1\right]}{r_{o1}r_{o2}(g_{m2}+g_{mb2})+r_{o1}+r_{o2}}$$
> Slightly below $g_{m1}$. Multiply by $R_{out}$: $|A_v| = g_{m1}r_{o1}\left[(g_{m2}+g_{mb2})r_{o2}+1\right]$. The same answer comes from replacing $M_1$ + $v_{in}$ by a Thévenin source ($-g_{m1}r_{o1}v_{in}$ behind $r_{o1}$) and using the CG formula.

> [!note]- Detail: a resistor at the cascode node (Razavi Ex. 3.21)
> With $R_P$ from node $X$ to ground ($\lambda = 0$), $g_{m1}v_{in}$ splits between $R_P$ and $1/(g_{m2}+g_{mb2})$: $A_v = -\dfrac{g_{m1}(g_{m2}+g_{mb2})R_PR_D}{1+(g_{m2}+g_{mb2})R_P}$. This is the seed of the [[#Folded Cascode|folded-cascode]] penalty.

### Headroom

$$
\boxed{V_{out,\min} = V_{OV1}+V_{OV2}}\qquad
\boxed{\text{swing} = V_{DD} - V_{OV1}-V_{OV2}-|V_{OV3}|-|V_{OV4}|}
$$

- Bias $V_{b1} = V_{GS2}+V_{OV1}$ to put $M_1$ at the edge of saturation; $V_{b2}$ likewise for $M_4$. "Four overdrives" ($4V_{D,sat}$) for a cascode with cascode load.
- Carusone Ex. 3.8: at $V_{eff} = 250$ mV, the cascode output can't go below 500 mV, versus 250 mV for a plain CS. That is why op-amp **output** stages are often plain CS ([[Operational Amplifiers]]).
- Triple cascodes give even more $R_{out}$ but cost three overdrives at the bottom alone.
- Like the CS with current-source load, the output DC level is undefined; it must sit in a feedback loop.

> [!note]- Detail: large-signal path and swing at 40 nm (Razavi Fig. 3.62 and Nanometer Design Notes)
> As $V_{in}$ rises from $V_{TH1}$, $V_{out}$ falls and $V_X$ falls (more $V_{GS2}$ is needed). Either $M_1$ goes into triode first ($V_X < V_{in}-V_{TH1}$, likely if $V_b$ is low) or $M_2$ does ($V_{out}<V_b-V_{TH2}$). In deep triode for $M_2$, $V_X\approx V_{out}$.
>
> 40 nm cascode, NMOS $10\,\mu\text{m}/40$ nm, PMOS $20\,\mu\text{m}/40$ nm, 0.3 mA: if the gain must stay above 10, the single-ended swing is about 0.5 V p-p. A 40 nm cascode current source ($5\,\mu\text{m}/40$ nm) has only slightly higher $R_{out}$ than a single device for $V_X<0.2$ V.

### Cascode vs. a Longer Transistor

At equal headroom: quadrupling $L$ (fixed $W$, fixed $I_D$) doubles $V_{OV}$, so it uses the same headroom as a cascode. But it only **doubles** $g_mr_o$ and **halves** $g_m$, while the cascode gives $\approx g_mr_o^2$. For a given headroom, the cascode wins (Razavi Fig. 3.69).

> [!tip] Remark
> At fixed $W$ and $I_D$: $g_m\propto\sqrt{1/L}$ and $r_o\propto L$, so $g_mr_o\propto\sqrt L$ (Razavi Eq. 3.133). Same scaling as the strong-inversion formula in [[#Intrinsic Gain The Ceiling|intrinsic gain]].

### Shielding

The cascode device holds node $X$ nearly still when the output moves: a change $\Delta V$ at the output becomes about $\Delta V/[(g_m+g_{mb})r_o]$ at $X$.

$$
\boxed{\Delta V_X \approx \frac{\Delta V_{out}}{(g_m+g_{mb})r_o}}
$$

- Two current sources whose drains sit $\Delta V$ apart: unequal currents by $\frac12\mu_nC_{ox}\frac WL V_{OV}^2\lambda\Delta V$. Cascode both and the error drops by $(g_{m3}+g_{mb3})r_{o3}$ (Razavi Ex. 3.24). This is why [[Current Mirrors]] are cascoded.
- Limits $V_{DS}$ of the input device: fewer short-channel effects (Carusone) and no device **stress** even when $V_{DD}$ exceeds what one device tolerates (about 1 V in 40 nm; Razavi).
- Shielding fails when the cascode device enters triode: then $V_X$ follows $V_{out}$ and eventually pushes $M_1$ into triode.
- The same shielding cuts the Miller effect on $M_1$ ([[Frequency Response]]).

> [!note]- Detail: the poor man's cascode (Razavi Fig. 3.71; Zettelkasten 2k5)
> Tie both gates together (no separate cascode bias). Then $V_{DS,bottom} = V_{GS,bottom} - V_{GS,top} < V_{GS,bottom}-V_{TH}$: the bottom device is always in triode. With equal sizes the pair is exactly **one transistor of twice the length**: no $g_mr_o$ multiplication.
>
> Exception: with two threshold flavors, a lower-$V_{TH}$ top device lets the bottom one saturate. Razavi's example: $V_{TH,bottom}-V_{TH,top} = 150$ mV with $V_{OV,top} < 100$ mV makes it a true cascode.

### Folded Cascode

```tikz title="Folded cascode: PMOS input M1, NMOS cascode M2. The input current folds up through M2 because I_1 is fixed. After Razavi Fig. 3.74(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[american,>=stealth,font=\small]
  \draw (0,2.4) node[pmos](M1){};
  \draw (M1.S) -- ++(0,0.3) node[vcc]{$V_{DD}$};
  \draw (M1.G) -- ++(-0.3,0) node[left]{$V_{in}$};
  \node[right,font=\scriptsize] at (0.1,2.4) {$M_1$};
  \draw (M1.D) -- (0,0.6) coordinate (x) -- (2.6,0.6);
  \draw (x) node[circ]{} node[left,font=\scriptsize]{$X$};
  \draw (x) to[I, l_=$I_1$] (0,-1.4) node[ground]{};
  \draw (2.6,2.2) node[nmos](M2){};
  \draw (M2.S) -- (2.6,0.6);
  \draw (M2.G) -- ++(-0.3,0) node[left]{$V_b$};
  \node[right,font=\scriptsize] at (2.7,2.2) {$M_2$};
  \draw (M2.D) to[R, l=$R_D$] ++(0,1.6) node[vcc]{$V_{DD}$};
  \draw (M2.D) ++(0,0.2) node[circ]{} -- ++(0.8,0) node[ocirc]{} node[right]{$V_{out}$};
  \node[font=\scriptsize,align=left,anchor=west] at (1.0,-0.6) {$|I_{D1}|+I_{D2}=I_1$\\ $\Rightarrow$ $g_{m1}v_{in}$ is pushed into $M_2$};
\end{circuitikz}
\end{document}
```

The input and cascode devices needn't be the same type. If $V_{in}$ rises, $|I_{D1}|$ falls, so $I_{D2} = I_1-|I_{D1}|$ rises and $V_{out}$ falls. Small-signal gain and $R_{out}$ are the telescopic ones, except for the bias source at $X$:

$$
\boxed{R_{out} = \left[1+(g_{m2}+g_{mb2})r_{o2}\right](r_{o1}\parallel r_{o3})+r_{o2}}
$$

| | Telescopic | Folded |
|---|---|---|
| Bias current | shared by $M_1$ and $M_2$ (reused) | $\vert I_{D1}\vert +I_{D2} = I_1$: more total current for the same performance |
| $R_{out}$ | $\propto r_{o1}$ | $\propto r_{o1}\parallel r_{o3}$: lower |
| Headroom | input and cascode stacked | input not under the cascode: more swing and input range in an op amp (Carusone) |

> [!tip] Remark
> $M_3$ (the bias source at $X$) is a transistor, so its $r_{o3}$ sits in parallel with $r_{o1}$: the degeneration seen by the cascode shrinks. Same mechanism as $R_P$ in Razavi Ex. 3.21. (Zettelkasten 2l1.) For high gain, give the folded cascode a cascode load too; the full op amp is in [[Operational Amplifiers]].

> [!note]- Detail: large-signal folded cascode (Razavi Eqs. 3.143–3.145)
> Sweep $V_{in}$ down from $V_{DD}$. Above $V_{DD}-|V_{TH1}|$, $M_1$ is off, $M_2$ carries all of $I_1$, $V_{out} = V_{DD}-I_1R_D$. Below, $I_{D2} = I_1-\frac12\mu_pC_{ox}(W/L)_1(V_{DD}-V_{in}-|V_{TH1}|)^2$, falling to zero at
> $$V_{in1} = V_{DD}-\sqrt{\frac{2I_1}{\mu_pC_{ox}(W/L)_1}}-|V_{TH1}|$$
> Below that, $M_1$ goes into triode to keep $|I_{D1}| = I_1$. Meanwhile $V_X$ rises to $V_b-V_{TH2}$ as $I_{D2}\to 0$, and toward $V_{DD}$ once $M_1$ is in triode.

> [!tip] Remark
> High $R_{out}$ looks like it would make the stage slow into a load capacitor. Inside a [[Feedback]] loop it doesn't matter much (Razavi §3.6.1); speed is set by $g_m/C$, not by $R_{out}$.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $R_D$ (resistor load) | gain $g_mR_D$ | DC drop $I_DR_D$, swing, bandwidth ($R_DC$) |
| Resistor → current-source load | gain up to $g_mr_o/2$ per headroom | output DC level needs feedback; $M_2$ capacitance |
| Active (complementary) load | $G_m = g_{m1}+g_{m2}$ at same current | bias set by PVT, supply noise reaches output |
| Diode load | linear, PVT-tracking gain | low gain; $\vert V_{OV2}\vert  = A_v V_{OV1}$ eats swing |
| ↑ $L$ (input or load) | $r_o$, intrinsic gain ($\propto\sqrt L$ at fixed $W$) | capacitance, $f_T$; headroom if $W$ fixed |
| ↓ $I_D/W$ (toward weak inversion) | $g_mr_o$, $g_m/I_D$ | $f_T$, area |
| Add $R_S$ (degeneration) | linearity, $R_{out}$ | gain ($\to R_D/R_S$), noise, headroom $I_DR_S$ |
| Source follower | low $R_{out}$, level shift | gain $<1$, body-effect distortion, one $V_{GS}$ of headroom, noise |
| Common gate input | low $R_{in}$ (if $R_D$ small), non-inverting | input current through the source; $R_{in}$ rises with $R_D$ |
| Cascode | $R_{out}\times g_mr_o$, gain $\to(g_mr_o)^2$, shielding | one $V_{OV}$ of swing per device; needs a cascode load to pay off |
| Fold the cascode | swing and input range | more current, lower $R_{out}$ ($r_{o1}\parallel r_{o3}$) |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Specs | $A_0 = G_mR_{out}$, $\omega_u = A_0\omega_0 = G_m/C_L$, $SR = I_{max}/C$, $t_s = \frac{1}{\beta\omega_u}\ln\frac1\epsilon$, $V_{D,sat}\approx\frac{2}{g_m/I_D}$ |
| Lemma | $A_v = -G_mR_{out}$ |
| Into the drain | $r_o+\left[1+(g_m+g_{mb})r_o\right]R_S$ |
| Into the source | $\dfrac{R_D+r_o}{1+(g_m+g_{mb})r_o}\approx\dfrac1{g_m+g_{mb}}+\dfrac{R_D}{(g_m+g_{mb})r_o}$ |
| Diode-connected | $\frac1{g_m+g_{mb}}\parallel r_o$ |
| CS, resistor | $-g_m(R_D\parallel r_o) = -2V_{RD}/V_{OV}$ (for $r_o\to\infty$) |
| Intrinsic gain | $g_mr_o$; SI $\frac{\sqrt{2\mu_nC_{ox}}}{\lambda'}\sqrt{\frac{L}{I_D/W}}$; WI $\frac{L}{nV_T\lambda'}$ |
| CS, diode load | $-\frac{g_{m1}}{g_{m2}}\frac1{1+\eta}$; PMOS: $-\sqrt{\frac{\mu_n(W/L)_1}{\mu_p(W/L)_2}} = -\frac{\vert V_{OV2}\vert }{V_{OV1}}$ |
| CS, current source | $-g_{m1}(r_{o1}\parallel r_{o2})$ |
| CS, active load | $-(g_{m1}+g_{m2})(r_{o1}\parallel r_{o2})$ |
| CS, triode load | $-g_{m1}(R_{on2}\parallel r_{o1})$, $R_{on2} = \frac1{\mu_pC_{ox}(W/L)_2(V_{DD}-V_b-\vert V_{THP}\vert )}$ |
| Degeneration | $G_m = \frac{g_m}{1+g_mR_S}$, $A_v = -\frac{R_D}{1/g_m+R_S}$ |
| Degeneration, full | $G_m = \frac{g_mr_o}{R_S+[1+(g_m+g_{mb})R_S]r_o}$, $A_v = \frac{-g_mr_oR_D}{R_D+R_S+r_o+(g_m+g_{mb})R_Sr_o}$ |
| Source follower | $A_v = \frac{g_mR_S}{1+(g_m+g_{mb})R_S}\to\frac1{1+\eta}$; $A_v = \frac{R_{eq}}{R_{eq}+1/g_m}$; $R_{out} = \frac1{g_m+g_{mb}}$ |
| Common gate | $A_v = (g_m+g_{mb})R_D$; full $\frac{(g_m+g_{mb})r_o+1}{r_o+(g_m+g_{mb})r_oR_S+R_S+R_D}R_D$ |
| CG, current-source load | $A_v = (g_m+g_{mb})r_o+1$ |
| CG $R_{in}$, $R_{out}$ | $\frac{R_D+r_o}{1+(g_m+g_{mb})r_o}$; $R_D\parallel\{r_o+[1+(g_m+g_{mb})r_o]R_S\}$ |
| Cascode $R_{out}$ | $[1+(g_{m2}+g_{mb2})r_{o2}]r_{o1}+r_{o2}\approx g_{m2}r_{o2}r_{o1}$ |
| Cascode gain | $\approx g_{m1}[(g_{m2}r_{o2}r_{o1})\parallel(g_{m3}r_{o3}r_{o4})]$; ideal load $g_{m1}r_{o1}[(g_{m2}+g_{mb2})r_{o2}+1]$ |
| Cascode headroom | $V_{out,\min} = V_{OV1}+V_{OV2}$; swing $= V_{DD}-4V_{OV}$ |
| Folded cascode $R_{out}$ | $[1+(g_{m2}+g_{mb2})r_{o2}](r_{o1}\parallel r_{o3})+r_{o2}$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19), Ch. 3 Single-Stage Amplifiers, pp. 45–92: §3.2 general considerations (Table 3.1, design octagon); §3.3.1–3.3.6 CS with resistive, diode-connected, current-source, active and triode loads and source degeneration, the $G_mR_{out}$ lemma (Exs. 3.1–3.11); §3.4 source follower (Exs. 3.12–3.15); §3.5 common gate (Exs. 3.16–3.20, Fig. 3.56 impedance transformation); §3.6 cascode, poor man's cascode, shielding, §3.6.1 folded cascode (Exs. 3.21–3.25); §3.7 choice of device models; Nanometer Design Notes in Ch. 3. Ch. 9 §9.1.1 performance parameters, pp. 344–349 (gain, small-signal bandwidth, large-signal behaviour, output swing, linearity, noise and offset, supply rejection; Exs. 9.1–9.2) for [[#Amplifier Specifications]].
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24), Ch. 3: §3.2 common-source amplifier (Exs. 3.2–3.3), §3.3 source follower (Ex. 3.4), §3.4 common-gate amplifier ($r_{in}\approx 2/g_m$, Ex. 3.5), §3.5 degenerated mirror $r_{out}$, §3.7 cascode gain stage (Exs. 3.8–3.10), §3.9 key points; pp. 120–135. For the spec definitions: §5.3.1 settling time to a given accuracy (Eqs. 5.29–5.31, p. 216) and §6.1.3 slew rate (Ex. 6.4, Eqs. 6.22–6.24, 6.30; pp. 249–251).
- **ECE 636 (Fall 2026), "Designing for Gain and Bandwidth" (9/28):** slides 2–8 (intrinsic gain in strong and weak inversion, regions by $I_D/W$), slides 19–23 ($f_T$ in strong and weak inversion).
- **Zettelkasten** (`AnalogTheory/Single-Stage Amplifiers/`): 2b5 (bulk input), 2c2 (diode-load swing cost), 2c3 (bias-point relation trap), 2e (complementary stage), 2f (triode load), 2j3 and 2j5 (CG with source resistance, current input), 2k3 (four overdrives), 2k5 (poor man's cascode), 2l1 (folded-cascode $R_{out}$), 2z (model choice); structure note `S2 Single-Stage Amplifiers`.

