---
title: RF Noise and Distortion
description: How much noise and distortion a receiver chain adds - kTB, noise temperature, noise figure (and F = L for a lossy part), Friis, Y-factor measurement, noise parameters and circles, sensitivity, cascaded IIP3, AM-PM, and linear and spurious-free dynamic range - and how those receiver specs become LNA and mixer specs.
kind: topic
status: growing
aliases:
  - RF Noise and Distortion
  - Noise Figure
  - Friis Formula
  - Noise Temperature
  - Sensitivity
  - Dynamic Range
  - SFDR
---

A receiver works between two walls. Noise sets the floor: the weakest signal it can still detect. Distortion sets the ceiling: the strongest signal (or interferer) it can take before spurious products appear. This note measures both walls for a chain of blocks, then turns the system's floor and ceiling into a noise-figure, gain and IIP3 budget for each block. The circuit-level origin of the noise ([[Noise]]) and of the distortion ([[Nonlinearity and Mismatch]]) is owned elsewhere. As in [[MosFETs]], each level opens the box a bit further.

## The big picture

```tikz title="Two walls: a chain's noise is the sum of each stage's noise divided by the gain ahead of it; its distortion is the sum of each stage's distortion multiplied by the gain ahead of it. Right: the input power ladder from kT0 to IIP3. After Pozar Figs. 10.9, 10.18, 10.20 and binder p. 165."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,fill=blue!6,minimum width=1.5cm,minimum height=1.0cm,align=center,font=\scriptsize}}
  % chain
  \node[font=\scriptsize,align=center] (src) at (0,0) {source\\ $T_s$};
  \node[blk] (a) at (2.2,0) {stage 1\\ $G_1,F_1$\\ IIP3$_1$};
  \node[blk] (b) at (4.6,0) {stage 2\\ $G_2,F_2$\\ IIP3$_2$};
  \node[blk] (c) at (7.0,0) {stage 3\\ $G_3,F_3$\\ IIP3$_3$};
  \draw[->] (src) -- (a); \draw[->] (a) -- (b); \draw[->] (b) -- (c); \draw[->] (c) -- (8.6,0);
  % noise weights
  \node[font=\scriptsize,text=blue!70!black] at (2.2,-0.95) {$F_1$};
  \node[font=\scriptsize,text=blue!70!black] at (4.6,-0.95) {$+\dfrac{F_2-1}{G_1}$};
  \node[font=\scriptsize,text=blue!70!black] at (7.0,-0.95) {$+\dfrac{F_3-1}{G_1G_2}$};
  \node[font=\scriptsize,text=blue!70!black,anchor=east] at (1.2,-0.95) {$F=$};
  % linearity weights
  \node[font=\scriptsize,text=red!70!black] at (2.2,-1.85) {$\dfrac{1}{\mathrm{IIP3}_1}$};
  \node[font=\scriptsize,text=red!70!black] at (4.6,-1.85) {$+\dfrac{G_1}{\mathrm{IIP3}_2}$};
  \node[font=\scriptsize,text=red!70!black] at (7.0,-1.85) {$+\dfrac{G_1G_2}{\mathrm{IIP3}_3}$};
  \node[font=\scriptsize,text=red!70!black,anchor=east] at (1.2,-1.85) {$\dfrac{1}{\mathrm{IIP3}}=$};
  \node[font=\scriptsize,align=center,text=blue!70!black] at (4.6,1.0) {noise: later stages divided by the gain ahead};
  \node[font=\scriptsize,align=center,text=red!70!black] at (4.6,-2.75) {distortion: later stages multiplied by the gain ahead};
  % ladder
  \begin{scope}[xshift=12.4cm,yshift=-3.2cm]
    \draw[->] (0,0) -- (0,5.6) node[above,font=\scriptsize] {input power (dBm)};
    \foreach \y/\t in {0.3/{$-174$ dBm/Hz ($kT_0$)},1.4/{noise floor $N_{in}$},2.1/{sensitivity $S_{min}$},4.6/{IIP3},3.9/{$P_{1dB}$}} {
      \draw (-0.1,\y) -- (0.1,\y); \node[anchor=west,font=\scriptsize] at (0.2,\y) {\t};
    }
    \draw[<->,blue!70!black] (-0.35,0.3) -- (-0.35,1.4) node[midway,left,font=\scriptsize] {$+10\log B+\mathrm{NF}$};
    \draw[<->,blue!70!black] (-0.35,1.4) -- (-0.35,2.1) node[midway,left,font=\scriptsize] {$+\mathrm{SNR}_{min}$};
    \draw[<->,red!70!black] (-2.9,1.4) -- (-2.9,4.6);
    \draw[red!70!black,densely dotted] (-2.9,1.4) -- (0,1.4); \draw[red!70!black,densely dotted] (-2.9,4.6) -- (0,4.6);
    \node[font=\scriptsize,text=red!70!black,align=center] at (-1.5,3.4) {$\mathrm{IIP3}-N_{in}$\\ SFDR is $\tfrac23$ of it};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Thermal noise floor:** a matched source delivers $N=kTB$. At $T_0=290$ K that is $\mathbf{-174}$ **dBm/Hz**, plus $10\log B$.
> 2. **Noise figure** is SNR degradation with a $T_0$ source: $F=1+T_e/T_0$. A matched **lossy part at $T_0$ has $F=L$**: 1 dB of loss in front is 1 dB of NF.
> 3. **Friis:** $F=F_1+\dfrac{F_2-1}{G_1}+\dfrac{F_3-1}{G_1G_2}+\dots$ The first stage dominates, if it has gain.
> 4. **Sensitivity:** $S_{min}=-174+\mathrm{NF}+10\log B+\mathrm{SNR}_{min}$ (dBm, source at $T_0$).
> 5. **Cascaded IIP3:** $\dfrac{1}{\mathrm{IIP3}}=\dfrac{1}{\mathrm{IIP3}_1}+\dfrac{G_1}{\mathrm{IIP3}_2}+\dots$ This is the mirror image of Friis: gain ahead of a stage *divides* its noise but *multiplies* its distortion, so the last stage dominates.
> 6. **Dynamic range:** $\mathrm{LDR}=\mathrm{OP_{1dB}}-N_o$; $\mathrm{SFDR}=\tfrac23(\mathrm{OIP3}-N_o)$ (minus $\mathrm{SNR}_{min}$ for a receiver).

**Map:** [[#Spec translation|receiver spec → block specs]] → [[#Physics background|where kTB comes from]] → [[#Level 0 Noise Power and Noise Temperature|kTB, $T_e$, ENR]] → [[#Level 1 Noise Figure|noise figure, lossy parts, mismatch]] → [[#Level 2 Cascades|Friis]] → [[#Level 3 Sensitivity|sensitivity, MDS]] → [[#Level 4 Measuring Noise Figure|Y-factor, cold source]] → [[#Level 5 Noise Parameters and Noise Circles|$F_{min}$, $R_N$, $\Gamma_{opt}$, circles]] → [[#Level 6 Distortion in a Receiver|IM products, cascaded IIP3, AM-PM]] → [[#Level 7 Dynamic Range|LDR, SFDR]].

## Spec translation

A receiver front end is a chain of amplifiers (LNA, IF amp) and non-amplifiers (filters, mixer). Its system specs fix one noise-figure budget and one IIP3 budget for the whole chain. Friis and the IIP3 cascade split them into a gain window for the LNA, and the LNA's own NF, gain and IIP3 then go to [[RF Amplifier Design]].

```tikz title="Spec translation: system sensitivity and SFDR fix a chain NF and IIP3; Friis and the IIP3 cascade split them into a window for the LNA gain; the LNA and mixer specs go to their own notes. After Pozar Fig. 10.10 and binder p. 227."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{b/.style={draw,rounded corners=2pt,fill=gray!8,align=center,font=\scriptsize,text width=2.7cm,minimum height=1.5cm}}
  \node[b] (a) at (0,0) {\textbf{receiver spec}\\ $S_{min}$ at $\mathrm{SNR}_{min}$, $B$\\ SFDR or blocker level\\ $P_{1dB}$};
  \node[b] (b) at (3.6,0) {\textbf{chain budget}\\ $\mathrm{NF}_{tot}=S_{min}+174$\\ $-10\log B-\mathrm{SNR}_{min}$\\ $\mathrm{IIP3}_{tot}$ from SFDR};
  \node[b] (c) at (7.2,0) {\textbf{per block}\\ Friis: $F_1$, $G_1\ge\dots$\\ IIP3 cascade:\\ $G_1/\mathrm{IIP3}_2\le\dots$};
  \node[b,fill=red!6] (d) at (10.8,0.95) {\textbf{LNA}\\ NF, $G$, IIP3,\\ $S_{11}$ (match)};
  \node[b,fill=red!6] (e) at (10.8,-0.95) {\textbf{mixer}\\ NF, conv.\ gain/loss,\\ IIP3};
  \draw[->] (a) -- (b); \draw[->] (b) -- (c); \draw[->] (c.east) -- (d.west); \draw[->] (c.east) -- (e.west);
  \node[font=\scriptsize,align=center] at (13.6,0.95) {RF Amplifier Design\\ $\to g_m/I_D$, $I_D$, $W$};
  \node[font=\scriptsize,align=center] at (13.6,-0.95) {Mixers and Micro-\\wave Oscillators};
\end{circuitikz}
\end{document}
```

**Block (chain) specs** (Pozar §10.2–10.4, §14.2; binder pp. 165–169, 227, 236): bandwidth $B$; sensitivity $S_{min}$ at a required $\mathrm{SNR}_{min}$; noise figure (or system noise temperature); IIP3 / SFDR against two-tone interferers; $P_{1dB}$ and LDR; input match.

| Chain spec | Set inside the chain by | Amplifier spec it demands |
|---|---|---|
| Sensitivity $S_{min}$ | Total NF (Friis), $B$, $\mathrm{SNR}_{min}$ | **LNA input-referred noise** (NF), and enough **LNA gain** to bury the mixer's NF |
| Loss ahead of the LNA (filter, line, switch) | $F=L$ per lossy part | LNA NF $\le$ target $-$ loss (dB for dB) |
| IIP3 / SFDR / blocker level | Cascaded IIP3, dominated by the last stages | **Mixer IIP3**, LNA **OIP3** (output linearity), and a *ceiling* on LNA gain |
| $P_{1dB}$, LDR | Last stage compresses first | Output swing of the last amplifier |
| Input match ($S_{11}$) | Noise figure rises with input mismatch | LNA input impedance $\approx Z_0$ while $\Gamma_S\approx\Gamma_{opt}$ (noise circles) |

$$
\boxed{\mathrm{NF}_{tot}\le S_{min}+174-10\log B-\mathrm{SNR}_{min}}\qquad
\boxed{\frac{F_2-1}{F_{tot}-F_1}\ \le\ G_1\ \le\ \frac{1}{\mathrm{IIP3}_{tot}\left(\dfrac{1}{\mathrm{OIP3}_1}+\dfrac{1}{\mathrm{IIP3}_2}\right)}}
$$

- Left: the noise figure the whole chain may have (dB, dBm, $T_s=T_0$).
- Right: the LNA gain window, in linear units (powers in mW). $F_2$ and $\mathrm{IIP3}_2$ describe everything after the LNA, referred to its output. Noise sets the floor on $G_1$, linearity the ceiling. If the window is empty, the LNA needs a lower $F_1$ or a higher $\mathrm{OIP3}_1$, or the mixer a better NF or IIP3.

> [!note]- Derivation: the gain window
> Two stages: the LNA ($F_1$, $G_1$, output intercept $\mathrm{OIP3}_1$) and the rest ($F_2$, $\mathrm{IIP3}_2$).
> - **Noise.** Friis: $F_{tot}=F_1+(F_2-1)/G_1\le F_{tot,max}$ gives $G_1\ge(F_2-1)/(F_{tot}-F_1)$. It needs $F_1<F_{tot}$: the LNA alone must already beat the target.
> - **Linearity.** An LNA's IIP3 usually falls as its gain rises (it is output-limited), so write $\mathrm{IIP3}_1=\mathrm{OIP3}_1/G_1$. The coherent cascade in input form ([[#Cascaded IIP3]]) is $1/\mathrm{IIP3}_{tot}=G_1/\mathrm{OIP3}_1+G_1/\mathrm{IIP3}_2$. Requiring $\mathrm{IIP3}_{tot}\ge$ target gives the upper bound.
> - **Sensitivity.** $S_{min}=kT_0B\,F\,\mathrm{SNR}_{min}$ in dB is $-174+\mathrm{NF}+10\log B+\mathrm{SNR}_{min}$ ([[#Sensitivity]]); solve for NF.

| LNA spec from the budget | Lands on | Sizing knob |
|---|---|---|
| NF ($F_1$) | Input device's channel noise relative to the source, plus matching-network loss ahead of it | Higher $g_m$ at the input ($g_m/I_D$, $I_D$); $\Gamma_S\to\Gamma_{opt}$ by device size and bias |
| Gain $G_1$ inside the window | $g_m$ times the load (resistor or tank) | $g_m$, load $R$ or tank $Q$ |
| $\mathrm{OIP3}_1$, $P_{1dB}$ | Overdrive and output swing | Lower $g_m/I_D$ (larger $V_{OV}$), degeneration, more $I_D$ |
| $S_{11}$ | Input impedance vs $Z_0$ | Device size ($C_{gs}$) and the input network |

> [!tip] Remark
> How a target $g_m$, $V_{OV}$ or $I_D$ becomes $W$ and $L$ is [[gm-ID Design Methodology]]; the LNA topologies, gain circles and the noise/gain/match trade are [[RF Amplifier Design]]; the mixer's NF and IIP3 are [[Mixers and Microwave Oscillators]]. Why lower $g_m/I_D$ is more linear: [[Nonlinearity and Mismatch#Resistive Degeneration]]. Why $F$ has an optimum bias: [[Noise#Level 4 Designing for Noise]].

> [!example] Worked: one LNA gain, two budgets (Pozar Exs. 10.2 and 10.4, extended; numbers computed here)
> **Blocks.** Pozar's front end (Ex. 10.2): LNA NF 2 dB; bandpass filter 1 dB loss; mixer NF 4 dB. For linearity take Ex. 10.4's LNA $\mathrm{OIP3}=22$ dBm and mixer $\mathrm{IIP3}=13$ dBm. $B=10$ MHz, $\mathrm{SNR}_{min}=20$ dB.
> **Everything after the LNA** (filter then mixer): $F_2=L_fF_m$, i.e. $1+4=5.0$ dB; its IIP3 referred to the filter input is $13+1=14$ dBm.
> **Sweep the LNA gain** (filter assumed linear):
>
> | $G_{LNA}$ | NF | IIP3 | $N_{in}$ | $S_{min}$ | SFDR (input) |
> |---|---|---|---|---|---|
> | 10 dB | 2.56 dB | +3.4 dBm | $-101.4$ dBm | $-81.4$ dBm | 69.9 dB |
> | 15 dB | 2.18 dB | $-1.6$ dBm | $-101.8$ dBm | $-81.8$ dBm | 66.8 dB |
> | 20 dB | 2.06 dB | $-6.6$ dBm | $-101.9$ dBm | $-81.9$ dBm | 63.5 dB |
>
> Ten more dB of LNA gain buys 0.5 dB of NF and 0.5 dB of sensitivity, and costs 10 dB of IIP3 and 6.4 dB of SFDR. Past the point where the mixer's noise is buried, gain only hurts.
> **Window.** Ask for $\mathrm{NF}\le2.2$ dB and $\mathrm{IIP3}\ge-3$ dBm (targets chosen here): $G_1\ge\frac{3.162-1}{1.660-1.585}=29$ (14.6 dB) and $G_1\le\frac{1}{0.501\,(1/158.5+1/25.1)}=43$ (16.4 dB). So the LNA spec is **NF 2 dB, gain 15 to 16 dB, OIP3 $\ge$ 22 dBm**, and it goes to [[RF Amplifier Design]].

## Physics background

Everything in the noise half of this note comes from one physical fact (a resistor at temperature $T$ delivers $kTB$) and one argument (thermal equilibrium). The distortion half comes from one model: a power series.

### Thermal Noise Power

$$
\boxed{\overline{v_n}=\sqrt{4kTBR}}\qquad\boxed{P_n=kTB\ \text{(available)}}
$$

- Valid when $hf\ll kT$ (Rayleigh–Jeans). Pozar's worst case, 100 GHz at 100 K: $hf=6.6\times10^{-23}\ll kT=1.4\times10^{-21}$ J. Only very high frequencies or cryogenic temperatures need the full Planck form.
- $P_n$ is independent of $R$ and of the centre frequency: white noise, set only by $T$ and $B$.
- Independent white sources are Gaussian and uncorrelated, so **noise powers add**. Every result below is bookkeeping of added powers.

> [!tip] Remark
> The $4kTR$ spectral density, why it is white, and how circuit noise sources combine are owned by [[Noise#Resistor Thermal Noise]] and [[Noise#Adding Sources Correlation]]. RF uses the same physics but counts **available power** into a matched load instead of volts, because everything is matched to $Z_0$.

> [!note]- Derivation: Planck to $kTB$ (Pozar §10.1, binder p. 229)
> Planck's blackbody law gives the rms open-circuit voltage of a resistor:
> $$\overline{v_n}=\sqrt{\frac{4hfBR}{e^{hf/kT}-1}}.$$
> For $hf\ll kT$, $e^{hf/kT}-1\approx hf/kT$, so $\overline{v_n}=\sqrt{4kTBR}$. Load the resistor with an equal, noiseless $R$ (maximum power transfer): half the voltage appears across it, $P_n=(\overline{v_n}/2)^2/R=\overline{v_n^2}/4R=kTB$. As $B\to\infty$ this would diverge (the "ultraviolet catastrophe"); the exact Planck form does not.

### Thermal Equilibrium

A passive network (resistors, lines, attenuators, dividers) at temperature $T$, fed by a matched source also at $T$, is in equilibrium. Its output must then be exactly $kTB$, whatever its loss. Splitting that $kTB$ into "attenuated input" plus "noise the network added" gives the noise of any passive part without analyzing a single resistor inside it ([[#Noise Figure of a Lossy Network]]).

### Nonlinearity as a Power Series

$$
v_o=a_0+a_1v_i+a_2v_i^2+a_3v_i^3+\dots
$$

$a_1$ is the gain. $a_2$ makes second-order products (useful in a mixer, a nuisance in an amplifier). $a_3$ makes compression and the in-band third-order products that limit a receiver.

> [!tip] Remark
> This is [[Nonlinearity and Mismatch#The Polynomial Model]] ($\alpha_k$ there, $a_k$ here). Harmonics, IM3, the IP3 and $P_{1dB}$ definitions and the $-9.6$ dB relation between them are derived there. This note uses them for chains and receivers.

## Level 0: Noise Power and Noise Temperature

```tikz title="Left: a resistor at T is a noiseless R plus a source of rms sqrt(4kTBR); into a matched load it delivers kTB. Right: an amplifier's equivalent noise temperature Te is the source temperature that makes a noiseless copy give the same output noise. After Pozar Figs. 10.3, 10.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[vsource,l={$\overline{v_n}=\sqrt{4kTBR}$}] (0,2) to[R,l=$R$ (noiseless)] (2.4,2) -- (2.6,2);
  \draw[thick,fill=gray!8] (2.6,1.5) rectangle (4.0,2.5); \node[font=\scriptsize,align=center] at (3.3,2.0) {ideal\\ BPF, $B$};
  \draw (4.0,2) -- (5.4,2) to[R,l=$R$ load] (5.4,0) -- (0,0);
  \draw[->,blue!70!black,thick] (4.15,2.3) -- (5.0,2.3);
  \node[font=\scriptsize,text=blue!70!black,anchor=south] at (4.6,2.45) {$P_n=\overline{v_n^2}/4R=kTB$};
  \node[font=\scriptsize] at (2.7,-0.45) {resistor at temperature $T$, matched load};
  \begin{scope}[xshift=8.4cm]
    \node[draw,thick,fill=blue!6,minimum width=1.5cm,minimum height=1cm,align=center,font=\scriptsize] (A) at (1.5,2) {noisy\\ $G$, $B$};
    \node[font=\scriptsize,align=center] at (-0.2,2) {$R$ at\\ $T_s=0$ K};
    \draw[->] (0.5,2) -- (A.west); \draw[->] (A.east) -- (3.1,2) node[right,font=\scriptsize] {$N_o$};
    \node[font=\large] at (1.5,1.0) {$\Updownarrow$};
    \node[draw,thick,fill=white,minimum width=1.5cm,minimum height=1cm,align=center,font=\scriptsize] (B) at (1.5,0) {noiseless\\ $G$, $B$};
    \node[font=\scriptsize,align=center] at (-0.2,0) {$R$ at\\ $T_e$};
    \draw[->] (0.5,0) -- (B.west); \draw[->] (B.east) -- (3.1,0) node[right,font=\scriptsize] {$N_o=GkT_eB$};
  \end{scope}
\end{circuitikz}
\end{document}
```

### Noise Power

$$
\boxed{kT_0=-174\ \text{dBm/Hz}\quad(T_0=290\ \text{K})}\qquad\boxed{N\,[\text{dBm}]=-174+10\log B}
$$

- Smaller $B$ collects less noise; colder parts make less. That is why receivers filter early and why radio-astronomy front ends are cryogenic.
- Binder p. 230: a resistor at 300 K in 10 kHz delivers $kTB=4.14\times10^{-17}$ W, which is $-133.8$ dBm ($-174+40$, plus 0.1 dB for 300 K instead of 290 K). The slide's "$-176$ dBW $=-146$ dBm" is an arithmetic slip; $4.14\times10^{-17}$ W is $-163.8$ dBW.

### Noise Temperature

$$
\boxed{T_e=\frac{N_o}{GkB}}\qquad\text{(amplifier, source at 0 K)}\qquad\boxed{N_o=GkB\,(T_s+T_e)}
$$

- $T_e$ is not a physical temperature. It is the temperature a matched resistor at the input would need to make the amplifier's own output noise, with the amplifier treated as noiseless.
- Any white source (antenna, noise diode) is described the same way: $T=N/kB$.
- Temperatures **add at the input**: source $T_s$ plus amplifier $T_e$. This is the safest way to compute absolute noise power.

**Calibrated noise sources** are rated by excess noise ratio:

$$
\boxed{\mathrm{ENR}=\frac{T_g-T_0}{T_0}}\qquad(\text{solid-state sources: 20–40 dB})
$$

> [!example] Output noise from $T_e$ (Pozar Ex. 10.1, second part)
> An X-band amplifier, $G=20$ dB, $B=1$ GHz, $T_e=170$ K (measured in [[#Y-Factor Method]]), driven by a source at $T_s=450$ K: $N_o=100\,(1.38\times10^{-23})(10^9)(450+170)=8.56\times10^{-10}$ W $=-60.7$ dBm.

## Level 1: Noise Figure

### Noise Figure

$$
\boxed{F=\frac{S_i/N_i}{S_o/N_o}\Big|_{N_i=kT_0B}=1+\frac{T_e}{T_0}\ \ge1}\qquad\boxed{T_e=(F-1)\,T_0}\qquad \mathrm{NF}=10\log F
$$

- Two conditions are part of the definition: a **matched** source, at **$T_0=290$ K**. Change either and the number in the datasheet no longer predicts the SNR loss.
- A noiseless network has $F=1$ (0 dB): it scales signal and noise alike.
- Input-referred view (binder p. 234): the noisy two-port is a noiseless one with an extra input noise power $P_{N_a}=(F-1)\,kT_0B$.

| NF (dB) | 0.5 | 1 | 2 | 3 | 6 | 10 |
|---|---|---|---|---|---|---|
| $T_e$ (K) | 35 | 75 | 170 | 289 | 865 | 2610 |

Low-noise parts are quoted in kelvin because the dB scale crushes the differences: 0.5 dB vs 1 dB is a factor of two in added noise.

> [!tip] Remark
> Circuit designers write the same quantity as $F=1+\overline{v^2_{n,in}}/(4kTR_s)$: input-referred noise over the source resistor's own noise ([[Noise#Where Noise Goes Next]]). Same idea, voltage instead of power.

> [!note]- Derivation: $F=1+T_e/T_0$ (Pozar Eq. 10.11, binder p. 233)
> Input: $S_i$ and $N_i=kT_0B$. Output: $S_o=GS_i$, $N_o=GkB(T_0+T_e)$. Then
> $$F=\frac{S_i}{kT_0B}\cdot\frac{GkB(T_0+T_e)}{GS_i}=1+\frac{T_e}{T_0}.$$

### Noise Figure of a Lossy Network

```tikz title="Why F = L for a lossy part: at uniform temperature the output noise must stay kTB, so the part adds (L-1)kTB referred to its input. After Pozar Fig. 10.8."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) to[R,l=$R$ at $T$] (0,2) -- (1.2,2);
  \draw[thick,fill=orange!10] (1.2,1.4) rectangle (4.6,2.6);
  \node[font=\scriptsize,align=center] at (2.9,2.0) {lossy line / attenuator\\ loss $L=1/G$, at $T$};
  \draw (4.6,2) -- (5.8,2) to[R,l=$R$] (5.8,0) -- (0,0);
  \draw[->,blue!70!black] (0.2,2.3) -- (1.1,2.3) node[midway,above,font=\scriptsize] {$kTB$};
  \draw[->,blue!70!black] (4.7,2.3) -- (5.6,2.3) node[midway,above,font=\scriptsize] {$kTB$};
  \node[font=\scriptsize,align=center] at (2.9,-0.9) {everything at $T$ is in equilibrium, so the output is still $kTB$:\\[3pt]
  $kTB = \underbrace{G\,kTB}_{\text{source, attenuated}}+\underbrace{G\,N_{added}}_{\text{line's own noise}}\ \Rightarrow\ N_{added}=(L-1)\,kTB$};
\end{circuitikz}
\end{document}
```

$$
\boxed{T_e=(L-1)\,T}\qquad\boxed{F=1+(L-1)\frac{T}{T_0}}\qquad\boxed{F=L\ \ \text{at}\ T=T_0}
$$

- A 6 dB attenuator at room temperature has a 6 dB noise figure. Every dB of cable, filter, switch or diplexer **ahead of the LNA** adds a dB of NF (binder p. 236).
- Cooling the lossy part lowers $T_e$ in proportion to $T$; its loss still attenuates the signal.
- **Wilkinson divider** with one output matched (Pozar Ex. 10.3): $F=1+(2L-1)T/T_0$, so $F=2$ (3 dB) even when lossless. The noise comes from the isolation resistor.

> [!tip] Remark
> The divider itself is [[Power Dividers and Couplers#Wilkinson Divider]]. The "filter in front costs its loss in NF" budget is worked in [[Microwave Filters#Spec translation]].

> [!note]- Detail: any passive two-port, mismatched (Pozar §10.2)
> Replace $G$ by the **available gain** $G_{21}$, which includes mismatch at the ports:
> $$G_{21}=\frac{|S_{21}|^2(1-|\Gamma_S|^2)}{|1-S_{11}\Gamma_S|^2(1-|\Gamma_{out}|^2)},\qquad \Gamma_{out}=S_{22}+\frac{S_{12}S_{21}\Gamma_S}{1-S_{11}\Gamma_S}.$$
> The equilibrium argument still holds (available output noise $=kTB$), so
> $$T_e=\frac{1-G_{21}}{G_{21}}\,T,\qquad F=1+\frac{1-G_{21}}{G_{21}}\frac{T}{T_0}.$$
> Available gain doesn't depend on the load, because it assumes a conjugate-matched load. The $\Gamma_{out}$ formula is the terminated two-port of [[Microwave Network Analysis#Signal Flow Graphs]]; the gain definitions are [[RF Amplifier Design]]'s.

### Mismatch Raises Noise Figure

$$
\boxed{T_e=\frac{(L-1)(L+|\Gamma_s|^2)}{L(1-|\Gamma_s|^2)}\,T}\ \ \text{(lossy line, mismatched source)}\qquad
\boxed{F_m=1+\frac{F-1}{1-|\Gamma|^2}}\ \ \text{(amplifier, mismatched input)}
$$

- **Lossy line:** with $\Gamma_s=0$ it falls back to $(L-1)T$; lossless ($L=1$) gives 0 at any mismatch. Lossy *and* mismatched is worse than either: the line radiates noise out of **both** ends, and a mismatched source reflects the backward noise into the forward path.
- **Amplifier:** the reflection throws away signal but not the amplifier's own noise. $F_m$ is smallest at $\Gamma=0$.
- Computed here: a 1 dB line at $T_0$ with $|\Gamma_s|=0.5$ has $T_e=120$ K instead of 75 K (NF 1.50 dB instead of 1.0 dB). A 2 dB amplifier with $|\Gamma|=0.3$ becomes 2.16 dB.

> [!warning] Mismatch here is not $\Gamma_S\ne\Gamma_{opt}$
> Pozar's Eq. 10.36 models mismatch as signal lost by reflection at an amplifier whose $F$ was measured matched. A transistor's real dependence on the source impedance is richer, and is what the noise parameters of [[#Level 5 Noise Parameters and Noise Circles]] describe. There, the lowest $F$ is usually *not* at $\Gamma_S=0$.

> [!note]- Derivation: both mismatch results (Pozar Eqs. 10.30–10.36)
> **Line.** A matched lossy line has $[S]=\frac{e^{-j\beta\ell}}{\sqrt L}\begin{bmatrix}0&1\\1&0\end{bmatrix}$, so $\Gamma_{out}=\Gamma_se^{-2j\beta\ell}/L$ and
> $$G_{21}=\frac{(1/L)(1-|\Gamma_s|^2)}{1-|\Gamma_s|^2/L^2}=\frac{L(1-|\Gamma_s|^2)}{L^2-|\Gamma_s|^2}.$$
> Put this in $T_e=\frac{1-G_{21}}{G_{21}}T$ and simplify.
> **Amplifier.** Input noise $kT_0B$ loses the factor $(1-|\Gamma|^2)$, the amplifier's own $(F-1)kT_0B$ does not: $N_o=kT_0GB[(1-|\Gamma|^2)+(F-1)]$, $S_o=G(1-|\Gamma|^2)S_i$. Divide: $F_m=1+(F-1)/(1-|\Gamma|^2)$.

## Level 2: Cascades

### Friis Formula

$$
\boxed{F_{cas}=F_1+\frac{F_2-1}{G_1}+\frac{F_3-1}{G_1G_2}+\cdots}\qquad
\boxed{T_{cas}=T_{e1}+\frac{T_{e2}}{G_1}+\frac{T_{e3}}{G_1G_2}+\cdots}
$$

- Each stage's added noise is referred to the chain input by dividing by the gain ahead of it (binder p. 235). Linear units, **available** gains.
- **The first stage sets the floor**, and its gain hides everything after it. So the LNA needs low NF *and* moderate gain, and losses before it must be minimized (binder p. 236).
- A lossy stage has $G<1$: it *multiplies* the noise of everything after it. A lossy line ahead of a receiver gives $T=(L-1)T_p+L\,T_{REC}$ (Pozar Eq. 14.29).

> [!tip] Remark
> This is the power version of [[Noise#Cascaded Stages]] ($\overline{v^2_{n2}}/A_1^2$ there, $(F_2-1)/G_1$ here). Antenna noise temperature is owned by [[RF Systems#Antenna Noise Temperature]], the antenna + line + receiver system temperature (worked in Pozar Ex. 14.5) by [[RF Systems#Level 3 Receiver System Temperature and SNR]], and $G/T$ by [[RF Systems#G/T Figure of Merit]].

```tikz title="Friis in pictures for Pozar Ex. 10.2: the LNA's own noise is 73% of the total; its 10 dB of gain shrinks the mixer's 4 dB NF to a quarter of the budget and the filter's loss to almost nothing."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,fill=blue!6,minimum width=1.6cm,minimum height=0.9cm,align=center,font=\scriptsize}}
  \node[blk] (a) at (0,3.4) {LNA\\ 10 dB, NF 2 dB};
  \node[blk,fill=orange!10] (b) at (2.6,3.4) {BPF\\ loss 1 dB};
  \node[blk] (c) at (5.2,3.4) {mixer\\ loss 3 dB, NF 4 dB};
  \draw[->] (-1.4,3.4) -- (a); \draw[->] (a) -- (b); \draw[->] (b) -- (c); \draw[->] (c) -- (6.6,3.4);
  % bars: scale 4 cm per unit of (F-1)
  \draw[->] (-1.2,0) -- (6.8,0);
  \draw[->] (-1.2,0) -- (-1.2,2.8); \node[font=\scriptsize,anchor=west] at (1.2,2.4) {each stage's share of $F-1$ (Friis)};
  \fill[blue!50] (-0.4,0) rectangle (0.4,2.34);
  \fill[orange!60] (2.2,0) rectangle (3.0,0.104);
  \fill[blue!35] (4.8,0) rectangle (5.6,0.761);
  \node[font=\scriptsize,above] at (0,2.34) {$F_1-1=0.585$};
  \node[font=\scriptsize,above] at (2.6,0.104) {$\frac{F_f-1}{G_a}=0.026$};
  \node[font=\scriptsize,above] at (5.2,0.761) {$\frac{F_m-1}{G_aG_f}=0.190$};
  \node[font=\scriptsize,align=left,anchor=west] at (6.9,1.4) {total $F=1.80$\\ NF $=2.55$ dB\\[2pt] the LNA is\\ 73\% of the noise};
\end{circuitikz}
\end{document}
```

> [!note]- Derivation: two stages (Pozar Eqs. 10.17–10.21, binder p. 237)
> Input noise $kT_0B$. After stage 1: $N_1=G_1kB(T_0+T_{e1})$. After stage 2: $N_o=G_2N_1+G_2kT_{e2}B=G_1G_2kB\left(T_0+T_{e1}+T_{e2}/G_1\right)$. A single equivalent stage gives $N_o=G_1G_2kB(T_0+T_{cas})$, so $T_{cas}=T_{e1}+T_{e2}/G_1$. Substitute $T=(F-1)T_0$ for each: $F_{cas}=F_1+(F_2-1)/G_1$. Repeat for more stages.

> [!example] Receiver front end (Pozar Ex. 10.2)
> LNA $G_a=10$ dB, $F_a=2$ dB; bandpass filter $L_f=1$ dB; mixer $L_m=3$ dB, $F_m=4$ dB. $B=10$ MHz, antenna $T_A=150$ K, everything at $T_0$.
> 1. Linear: $G_a=10$, $G_f=0.79$, $G_m=0.5$; $F_a=1.58$, $F_f=1.26$, $F_m=2.51$.
> 2. Friis: $F=1.58+\frac{0.26}{10}+\frac{1.51}{(10)(0.79)}=1.80$, **NF $=2.55$ dB**. $T_e=(1.80-1)(290)=232$ K.
> 3. Output noise with the real antenna: $G=(10)(0.79)(0.5)=3.95$, $N_o=k(T_A+T_e)BG=(1.38\times10^{-23})(150+232)(10^7)(3.95)=2.08\times10^{-13}$ W $=-96.8$ dBm.
> 4. For 20 dB output SNR: $S_i=100\,N_o/G=5.27\times10^{-12}$ W $=-82.8$ dBm, i.e. $\sqrt{50\,S_i}=16.2\ \mu$V rms.

> [!warning] The noise-figure trap
> $N_o=kT_ABFG$ gives $1.47\times10^{-13}$ W for the same chain, which is **wrong** (Pozar's note on Ex. 10.2). $F$ assumes $N_i=kT_0B$; here $T_A=150$ K $\ne T_0$. Whenever the source isn't at 290 K, add temperatures, $N_o=kB(T_s+T_e)G$, and never multiply by $F$.

### Which Stage Goes First

$$
\boxed{M=\frac{F-1}{1-1/G}}\qquad\text{put the stage with the smaller noise measure }M\text{ first}
$$

- Comparing $F_{12}=F_1+\frac{F_2-1}{G_1}$ with $F_{21}=F_2+\frac{F_1-1}{G_2}$ reduces to $M_1<M_2$ (binder pp. 238–239).
- Minimum NF and maximum gain usually need different bias and source impedance. Trading a little $F_1$ for more $G_1$ can lower the *total* NF (binder p. 238).

> [!example] Amplifier into a noisy receiver (Pozar Prob. 10.4, answer in the back of the book)
> Amplifier $G=12$ dB, NF $=4$ dB, into a receiver with $T_e=900$ K: $F=2.512+\frac{900/290}{15.85}=2.71$, **4.3 dB**. The amplifier's 12 dB of gain shrinks the receiver's 6.1 dB NF contribution to 0.2 in linear $F$.

## Level 3: Sensitivity

### Sensitivity

$$
\boxed{S_{min}=kB\,(T_s+T_e)\,\mathrm{SNR}_{min}}\qquad\boxed{S_{min}\,[\text{dBm}]=-174+\mathrm{NF}+10\log B+\mathrm{SNR}_{min}\quad(T_s=T_0)}
$$

- **Sensitivity** is the smallest input power that still gives the required SNR (or BER) at the output. $\mathrm{SNR}_{min}$ depends on the modulation, coding and the required BER (Pozar §10.4, §14.2), so it is a system number, not a circuit number.
- The **minimum detectable signal (MDS)** is the same idea. Pozar uses it for the signal that meets the required SNR; many texts set $\mathrm{SNR}_{min}=0$ dB, which makes MDS the input-referred noise floor $N_{in}=-174+\mathrm{NF}+10\log B$. Say which one you mean.
- Four knobs, all in dB: bandwidth (10 dB per decade), NF, required SNR, and source temperature. Of these only NF belongs to the circuit designer.

> [!example] Pozar Ex. 10.2 as a sensitivity number
> The same chain (NF 2.55 dB, $B=10$ MHz, $\mathrm{SNR}_{min}=20$ dB):
> - with a $T_0$ source: $-174+2.55+70+20=$ **$-81.4$ dBm** (computed here);
> - with Pozar's 150 K antenna: **$-82.8$ dBm**. The colder source lowers the floor, and the dB formula above, which assumes $T_0$, can't show it.

> [!note]- Derivation: the dB form
> With $T_s=T_0$: $S_{min}=kB(T_0+T_e)\,\mathrm{SNR}_{min}=kT_0B\,F\,\mathrm{SNR}_{min}$. In dBm: $10\log(kT_0\cdot1\,\text{Hz}/1\,\text{mW})=-174$, plus $10\log B$, plus NF, plus $\mathrm{SNR}_{min}$ in dB.

## Level 4: Measuring Noise Figure

### Y-Factor Method

```tikz title="Y-factor: output noise is a straight line in source temperature with slope GkB that crosses zero at Ts = -Te. Two known temperatures fix the line, and only their power ratio Y is needed. After Pozar Fig. 10.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % x: source temperature, 1 unit = 100 K ; Te=170 K, T2=77, T1=290 ; y: N_o (arb), slope 0.5/unit
  \draw[->] (-2.4,0) -- (4.2,0) node[right,font=\scriptsize] {source temperature $T_s$ (K)};
  \draw[->] (0,-0.2) -- (0,3.4) node[above,font=\scriptsize] {output noise $N_o$};
  \draw[thick,blue!70!black] (-1.7,0) -- (3.6,2.65);
  \draw[dashed] (-1.7,0) -- (-1.7,-0.15);
  \node[below,font=\scriptsize] at (-1.7,-0.15) {$-T_e$};
  \fill (0.77,1.235) circle (2pt); \fill (2.9,2.3) circle (2pt);
  \draw[dotted] (0.77,0) -- (0.77,1.235); \draw[dotted] (2.9,0) -- (2.9,2.3);
  \draw[dotted] (0,1.235) -- (0.77,1.235); \draw[dotted] (0,2.3) -- (2.9,2.3);
  \node[below,font=\scriptsize] at (0.77,0) {$T_2$ cold};
  \node[below,font=\scriptsize] at (2.9,0) {$T_1$ hot};
  \node[left,font=\scriptsize] at (0,1.235) {$N_2$};
  \node[left,font=\scriptsize] at (0,2.3) {$N_1$};
  \node[font=\scriptsize,anchor=west,align=left] at (1.6,3.1) {slope $=GkB$\\ $N_o=GkB(T_s+T_e)$};
  \node[font=\scriptsize,anchor=west,align=left,text=red!70!black] at (1.0,-1.1) {$Y=\dfrac{N_1}{N_2}=\dfrac{T_1+T_e}{T_2+T_e}$};
  \draw[<->,red!70!black] (-1.7,-0.6) -- (0,-0.6) node[midway,below,font=\scriptsize] {$T_e$};
\end{circuitikz}
\end{document}
```

$$
\boxed{Y=\frac{N_1}{N_2}=\frac{T_1+T_e}{T_2+T_e}}\qquad\boxed{T_e=\frac{T_1-YT_2}{Y-1}}\qquad\boxed{F=\frac{\mathrm{ENR}}{Y-1}\ \ (T_2=T_0)}
$$

**Procedure** (Pozar §10.1):
1. Connect a **hot** matched source ($T_1$) to the DUT input and read the output noise power $N_1$ over the band.
2. Switch to a **cold** source ($T_2$) and read $N_2$. Only the ratio $Y$ matters, so the detector's absolute calibration and the DUT's gain-bandwidth drop out.
3. $T_e$ from the middle box, $F=1+T_e/T_0$.

- One source is usually a room-temperature load (290 K). The other is a noise diode (hot, rated by ENR) or a load in liquid nitrogen (77 K) or helium (4 K), whichever is far from $T_e$.
- **Keep $T_1$ and $T_2$ far apart.** If they are close, $Y\to1$ and $T_e$ comes from subtracting two nearly equal numbers.
- A commercial noise-figure meter automates exactly this, switching a calibrated noise diode on (hot) and off (cold, $\approx T_0$).

> [!example] Y-factor numbers
> - **Pozar Ex. 10.1:** $T_1=290$ K gives $N_1=-62.0$ dBm, $T_2=77$ K gives $N_2=-64.7$ dBm. $Y=2.7$ dB $=1.86$, $T_e=\frac{290-(1.86)(77)}{0.86}=170$ K (NF 2.0 dB).
> - **Pozar Prob. 10.1** (book answer 7.0 dB; worked here): noise source ENR 22 dB, so $T_1=290(1+158.5)=46{,}255$ K; cold load 77 K; $Y=15.83$ dB $=38.3$. $T_e=\frac{46{,}255-38.3(77)}{37.3}=1162$ K, $F=5.0$, **NF $=7.0$ dB**.

> [!note]- Derivation: $F=\mathrm{ENR}/(Y-1)$
> With $T_2=T_0$ and $T_1=T_0(1+\mathrm{ENR})$: $T_e=\frac{T_0(1+\mathrm{ENR})-YT_0}{Y-1}$, so $F=1+\frac{T_e}{T_0}=\frac{(Y-1)+(1+\mathrm{ENR}-Y)}{Y-1}=\frac{\mathrm{ENR}}{Y-1}$. In dB: $\mathrm{NF}=\mathrm{ENR_{dB}}-10\log(Y-1)$.

### Cold-Source Method

$$
\boxed{F=\frac{N_o}{kT_0B\,G}}\qquad\text{(input terminated in a matched load at }T_0\text{)}
$$

- One measurement, no hot source: terminate the input in $Z_0$ at room temperature and measure the absolute output noise power.
- The price: $G$ (from a VNA, $|S_{21}|^2$ or better the available gain) and the noise bandwidth $B$ must be known separately and accurately, and the receiver must be calibrated in absolute power. The Y-factor ratio cancels all three.
- Pozar describes only the Y-factor method. This form is Pozar's Eq. 10.7a with a single load at $T_0$, solved for $F$ with $F=1+T_e/T_0$; Pozar notes that the ideal version (a 0 K load) is impossible, which is why a second, known temperature is normally used.

> [!tip] Remark
> Measuring $|S_{21}|$ and the port matches is [[Microwave Network Analysis#Level 5 Measurement VNA, Calibration, De-embedding]]. Noise-parameter measurement (a tuner in front of the DUT) is in [[#Measuring the Noise Parameters]].

## Level 5: Noise Parameters and Noise Circles

### Noise Parameters

$$
\boxed{F=F_{min}+\frac{R_N}{G_S}\,|Y_S-Y_{opt}|^2}\qquad
\boxed{F=F_{min}+\frac{4R_N}{Z_0}\frac{|\Gamma_S-\Gamma_{opt}|^2}{(1-|\Gamma_S|^2)\,|1+\Gamma_{opt}|^2}}
$$

| Parameter | Meaning |
|---|---|
| $F_{min}$ | Lowest noise figure the device can reach, at any source impedance |
| $\Gamma_{opt}$ ($Y_{opt}$) | Source reflection coefficient (admittance) that gives $F_{min}$ |
| $R_N$ ($r_n=R_N/Z_0$) | Noise resistance: how fast $F$ rises as $\Gamma_S$ leaves $\Gamma_{opt}$ |

- Four real numbers ($F_{min}$, $R_N$, $|\Gamma_{opt}|$, $\angle\Gamma_{opt}$) describe a noisy two-port's noise at one frequency and bias. Datasheets list them, or they are measured.
- $\Gamma_{opt}$ is generally **not** the conjugate match for gain, $\Gamma_S=S_{11}^*$. Low noise and full gain need different source impedances: the central trade of LNA design.
- All four depend on bias (binder p. 242: a BJT's NF at 900 MHz bottoms out near $I_C\approx6$ mA and rises on both sides).

> [!tip] Remark
> Why NF has a minimum vs bias for a MOSFET ($g_m$ up, then the device's own noise and parasitics win) is [[Noise#Level 4 Designing for Noise]]. In the circuit picture, the noise parameters are what an input-referred voltage and current source, partly correlated, look like from the source ([[Noise#Input-Referred Voltage and Current]]).

> [!note]- Derivation: the $\Gamma$ form (Pozar Eqs. 12.53–12.57)
> Write $Y_S=\frac{1}{Z_0}\frac{1-\Gamma_S}{1+\Gamma_S}$ and the same for $Y_{opt}$. Then
> $$|Y_S-Y_{opt}|^2=\frac{4}{Z_0^2}\frac{|\Gamma_S-\Gamma_{opt}|^2}{|1+\Gamma_S|^2|1+\Gamma_{opt}|^2},\qquad G_S=\mathrm{Re}\,Y_S=\frac{1}{Z_0}\frac{1-|\Gamma_S|^2}{|1+\Gamma_S|^2}.$$
> The $|1+\Gamma_S|^2$ cancels in $|Y_S-Y_{opt}|^2/G_S$, leaving the boxed form.

### Noise Circles

```tikz title="Noise circles of Pozar Ex. 12.5 on the source Smith chart: Gamma_opt (F_min = 1.6 dB) and the 2.0, 2.5, 3.0 dB circles; Pozar's design point 0.53/75 deg lies on the 2 dB circle; a 50-ohm source gives 2.95 dB. 2.5 and 3.0 dB circles computed here."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
\begin{scope}[scale=2.6]
\begin{scope}\clip (0,0) circle (1);
\draw[gray!45,thin] (0.1667,0) circle (0.8333);
\draw[gray!45,thin] (0.5000,0) circle (0.5000);
\draw[gray!45,thin] (0.8333,0) circle (0.1667);
\draw[gray!45,thin] (1,2.0000) circle (2.0000);
\draw[gray!45,thin] (1,-2.0000) circle (2.0000);
\draw[gray!45,thin] (1,1.0000) circle (1.0000);
\draw[gray!45,thin] (1,-1.0000) circle (1.0000);
\draw[gray!45,thin] (1,0.5000) circle (0.5000);
\draw[gray!45,thin] (1,-0.5000) circle (0.5000);
\end{scope}
\draw[gray!60,thin] (-1,0) -- (1,0);
\draw[thick] (0,0) circle (1);
\draw[blue!80!black,thick] (-0.0972,0.5515) circle (0.24);
\draw[blue!60,thick] (-0.0866,0.4911) circle (0.368);
\draw[blue!40,thick] (-0.0768,0.4356) circle (0.456);
\draw[dashed,gray] (0,0) -- (-0.1077,0.6106);
\fill[red] (-0.1077,0.6106) circle (0.025);
\draw[red] (-0.1077,0.6106) -- (-0.62,0.95); \node[font=\scriptsize,anchor=east,text=red,fill=white,inner sep=1pt] at (-0.62,0.95) {$\Gamma_{opt}=0.62\angle100^\circ$, $F_{min}=1.6$ dB};
\fill[green!50!black] (0.1372,0.5119) circle (0.025);
\node[font=\scriptsize,anchor=west,text=green!40!black,fill=white,inner sep=1pt] at (0.16,0.5119) {$\Gamma_S=0.53\angle75^\circ$};
\fill (0,0) circle (0.02);
\node[font=\scriptsize,anchor=north west,fill=white,inner sep=1pt] at (0.0,-0.02) {$\Gamma_S=0$: 2.95 dB};
\node[font=\scriptsize,text=blue!80!black,fill=white,inner sep=1pt] at (-0.305,0.431) {2.0};
\node[font=\scriptsize,text=blue!60,fill=white,inner sep=1pt] at (-0.405,0.307) {2.5};
\node[font=\scriptsize,text=blue!40,fill=white,inner sep=1pt] at (-0.50,0.19) {3.0 dB};
\end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{N=\frac{F-F_{min}}{4R_N/Z_0}\,|1+\Gamma_{opt}|^2}\qquad
\boxed{C_F=\frac{\Gamma_{opt}}{N+1}}\qquad
\boxed{R_F=\frac{\sqrt{N\left(N+1-|\Gamma_{opt}|^2\right)}}{N+1}}
$$

- All source reflection coefficients that give the same $F$ lie on a circle in the $\Gamma_S$ plane. Centres lie on the line from the origin to $\Gamma_{opt}$; as $F\to F_{min}$ the circle shrinks to the point $\Gamma_{opt}$.
- A small $R_N$ means wide circles: the NF is forgiving of source mismatch.
- In design, the noise circles go on the same Smith chart as the available-gain circles; the chosen $\Gamma_S$ is where the highest gain circle touches the allowed noise circle. That procedure belongs to [[RF Amplifier Design#Gain–Noise Trade-off]].

> [!example] Noise circle (Pozar Ex. 12.5)
> GaAs MESFET at 4 GHz, $Z_0=50\ \Omega$: $F_{min}=1.6$ dB, $\Gamma_{opt}=0.62\angle100^\circ$, $R_N=20\ \Omega$. Target 2.0 dB:
> $N=\frac{1.58-1.445}{4(20/50)}|1+0.62\angle100^\circ|^2=0.0986$, $C_F=0.56\angle100^\circ$, $R_F=0.24$.
> Pozar then picks $\Gamma_S=0.53\angle75^\circ$, where the 1.7 dB input-gain circle just touches this 2 dB noise circle. Computed here from the same formulas: the 2.5 dB and 3.0 dB circles are $0.50\angle100^\circ$, $R=0.37$ and $0.44\angle100^\circ$, $R=0.46$; and a plain 50 Ω source ($\Gamma_S=0$) gives $F=2.95$ dB.

> [!note]- Derivation: the circle (Pozar Eqs. 12.58–12.60)
> Fix $F$ and collect the constants in $N$: $|\Gamma_S-\Gamma_{opt}|^2=N(1-|\Gamma_S|^2)$. Expand: $|\Gamma_S|^2(N+1)-2\mathrm{Re}(\Gamma_S\Gamma_{opt}^*)+|\Gamma_{opt}|^2=N$. Divide by $N+1$ and complete the square:
> $$\left|\Gamma_S-\frac{\Gamma_{opt}}{N+1}\right|^2=\frac{N(N+1-|\Gamma_{opt}|^2)}{(N+1)^2}.$$

> [!tip] Remark
> Reading $\Gamma$ on the chart and the constant-$r$, $x$ grid are [[Smith Chart and Impedance Matching#Reading the chart]]. Stability circles are a different family of circles on the same chart, owned by [[RF Amplifier Design#Stability Circles]].

### Measuring the Noise Parameters

Binder p. 243: noise source → tuner (matching network, sets $\Gamma_S$) → DUT → NF meter.
1. Tune $\Gamma_S$ until the NF meter reads its minimum. That reading is $F_{min}$; the tuner's $\Gamma_S$, measured on a VNA, is $\Gamma_{opt}$.
2. Set $\Gamma_S=0$ (a $Z_0$ termination), read $F_{\Gamma_S=0}$, and solve the $\Gamma$ form for the noise resistance:

$$
\boxed{r_n=\left(F_{\Gamma_S=0}-F_{min}\right)\frac{|1+\Gamma_{opt}|^2}{4|\Gamma_{opt}|^2}}
$$

## Level 6: Distortion in a Receiver

> [!tip] Remark
> The single-tone and two-tone expansions, IM3 $=3\,HD_3$, the IIP3 and $P_{1dB}$ formulas from $a_1$, $a_3$, and the one-measurement shortcut $\mathrm{IIP3}=P_{in}+\Delta P/2$ are all owned by [[Nonlinearity and Mismatch#Intermodulation and IP3]] and [[Nonlinearity and Mismatch#Gain Compression and P1dB]]. This level keeps what matters for a *chain* of RF blocks.

### Intermodulation in a Receiver

Two tones $\omega_1$, $\omega_2$ produce products at $m\omega_1+n\omega_2$, of order $|m|+|n|$ (Pozar Eq. 10.44):

| Order | Products | Where they land (tones close together) |
|---|---|---|
| 2 | $2\omega_1$, $2\omega_2$, $\omega_1\pm\omega_2$ | Far away (near dc or $2\omega$): filtered off. The *wanted* output of a mixer |
| 3 | $3\omega_1$, $3\omega_2$, $2\omega_1+\omega_2$, $2\omega_2+\omega_1$ | Near $3\omega$: filtered off |
| 3 | $2\omega_1-\omega_2$, $2\omega_2-\omega_1$ | **In band**, next to the signal: no filter removes them |

- Two strong interferers spaced $\Delta f$ from each other put an IM3 product $\Delta f$ further out. If that lands on the wanted channel, it is noise the receiver can't filter. This is why receiver linearity is specified as **IIP3**.
- Sizes from the same expansion (Pozar): $\omega_1\pm\omega_2$ is 6 dB above the second harmonic; $2\omega_1-\omega_2$ is 9.54 dB above the third harmonic.
- **Cross-modulation** (one carrier's modulation transferred to another) and **spectral regrowth** (IM among the many tones of a modulated signal) are the same odd-order terms acting on real signals.

$$
\boxed{P_{IM_n}=nP_{\omega_1}-(n-1)\,IP_n\ \ (\text{dBm})}\qquad\Rightarrow\qquad
\boxed{\mathrm{IIP3}\ge\frac{3P_{int}-P_{IM,max}}{2}}
$$

- Left (binder p. 167, output or input referred alike): an $n$th-order product rises $n$ dB per dB, so it sits $(n-1)(IP_n-P)$ below the tones.
- Right: two interferers at $P_{int}$ each (at the input) may produce at most $P_{IM,max}$, typically the noise floor or the sensitivity minus $\mathrm{SNR}_{min}$. That fixes the chain IIP3.
- Rules of thumb: Pozar finds IP3 typically 10–15 dB above $P_{1dB}$ for practical parts; the binder uses $P_{1dB}\approx IP_3-10$ dB; the pure-cubic value is 9.6 dB ([[Nonlinearity and Mismatch#Gain Compression and P1dB]]).
- Which port: IP3 and $P_{1dB}$ are quoted where the number is larger, the **output** for amplifiers and the **input** for mixers. $\mathrm{OIP3}=\mathrm{IIP3}+G$ (dB); $\mathrm{OP_{1dB}}=\mathrm{IP_{1dB}}+G-1$ dB.

> [!note]- Detail: passive intermodulation (Pozar §10.3)
> Metal-to-metal contacts, oxidized ferrous junctions, contaminated surfaces and nonlinear materials (carbon fibre, ferromagnetics) also produce IM products: **PIM**. It is hard to predict and is measured. It matters at high power: a cellular base station may need PIM below $-125$ dBm with two 40 dBm carriers. Receivers rarely see enough power for it to matter.

### Cascaded IIP3

$$
\boxed{\frac{1}{\mathrm{OIP3}}=\frac{1}{G_2\,\mathrm{OIP3}'}+\frac{1}{\mathrm{OIP3}''}}\ \ \text{(coherent)}\qquad
\boxed{\frac{1}{\mathrm{OIP3}^2}=\frac{1}{(G_2\,\mathrm{OIP3}')^2}+\frac{1}{(\mathrm{OIP3}'')^2}}\ \ \text{(random phase)}
$$

$$
\boxed{\frac{1}{\mathrm{IIP3}}=\frac{1}{\mathrm{IIP3}_1}+\frac{G_1}{\mathrm{IIP3}_2}+\frac{G_1G_2}{\mathrm{IIP3}_3}+\cdots}\ \ \text{(input form, coherent)}
$$

- $'$ is stage 1, $''$ stage 2 (Pozar's notation). Linear units (mW).
- **Coherent** (IM voltages add in phase) is the worst case and the usual design number. **Random phase** (IM powers add) applies when the products are far from the tones and their phases decorrelate.
- The cascade IP3 is **below the IP3 of every stage**. Gain ahead of a stage multiplies its distortion: the opposite of Friis, so the last stage tends to dominate.

> [!example] LNA + mixer (Pozar Ex. 10.4, and Prob. 10.15 reversed)
> LNA $G=20$ dB, $\mathrm{OIP3}=22$ dBm (158 mW); mixer conversion loss 6 dB, $\mathrm{IIP3}=13$ dBm, so its $\mathrm{OIP3}=7$ dBm (5 mW), $G_2=0.25$.
> - Coherent: $\left(\frac{1}{(0.25)(158)}+\frac15\right)^{-1}=4.4$ mW $=$ **6.4 dBm** (output). Referred to the input (14 dB total gain): $-7.6$ dBm. The input form gives the same: $\left(\frac{1}{1.58}+\frac{100}{20}\right)^{-1}=0.18$ mW $=-7.5$ dBm.
> - Random phase: $\left(\frac{1}{(0.25\cdot158)^2}+\frac{1}{5^2}\right)^{-1/2}=4.96$ mW $=$ **6.9 dBm**.
> - **Swapped** (mixer first, Prob. 10.15, book answer 20.8 dBm): $\left(\frac{1}{100\cdot5}+\frac{1}{158}\right)^{-1}=$ **20.8 dBm** output, IIP3 $=+6.8$ dBm. Fourteen dB better linearity, at a terrible noise figure. Noise wants the LNA first, linearity wants it last.

> [!note]- Derivation: coherent cascade (Pozar Eqs. 10.49–10.53)
> For one stage, $P_{IM}=P_{\omega_1}^3/\mathrm{OIP3}^2$ (output powers), so the IM voltage across $Z_0$ is $V_{IM}=\sqrt{P_{\omega_1}^3Z_0}/\mathrm{OIP3}$. Stage 1's IM voltage passes through stage 2's voltage gain $\sqrt{G_2}$; stage 2 adds its own, in phase (worst case):
> $$V_{IM}=\left(\frac{\sqrt{G_2}\,(P_{\omega_1}/G_2)^{3/2}}{\mathrm{OIP3}'}+\frac{P_{\omega_1}^{3/2}}{\mathrm{OIP3}''}\right)\sqrt{Z_0}=\left(\frac{1}{G_2\mathrm{OIP3}'}+\frac{1}{\mathrm{OIP3}''}\right)\sqrt{P_{\omega_1}^3Z_0}.$$
> Square, divide by $Z_0$, and match to $P_{\omega_1}^3/\mathrm{OIP3}^2$. Adding powers instead of voltages gives the random-phase form. The input form follows from $\mathrm{OIP3}=G_1G_2\,\mathrm{IIP3}$, $\mathrm{OIP3}'=G_1\mathrm{IIP3}_1$, $\mathrm{OIP3}''=G_2\mathrm{IIP3}_2$ (computed here).

### AM-AM and AM-PM

```tikz title="AM-AM (gain) and AM-PM (phase) against input power. Shape after the measured amplifier on binder p. 170."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.2,0) node[right,font=\scriptsize] {$P_{in}$ (dBm)};
  \draw[->] (0,0) -- (0,3.6) node[above,font=\scriptsize] {gain (dB)};
  \draw[->] (6.8,0) -- (6.8,3.6) node[above,font=\scriptsize] {phase ($^\circ$)};
  % AM-AM
  \draw[very thick,blue!70!black] (0.2,2.9) -- (4.6,2.85) .. controls (5.4,2.8) and (5.9,2.4) .. (6.4,1.7);
  \node[font=\scriptsize,text=blue!70!black,anchor=south] at (2.0,2.95) {AM-AM: gain vs.\ $P_{in}$};
  % AM-PM
  \draw[very thick,red!70!black] (0.2,2.0) -- (2.6,1.9) .. controls (3.6,1.75) and (4.4,0.9) .. (5.3,0.45) -- (6.4,0.4);
  \node[font=\scriptsize,text=red!70!black,anchor=north] at (1.4,1.75) {AM-PM: phase vs.\ $P_{in}$};
  \draw[dashed] (6.0,0) -- (6.0,3.3); \node[font=\scriptsize,below] at (6.0,0) {gain compression};
  \node[font=\scriptsize,align=center] at (3.4,-0.75) {the phase starts moving well before the gain compresses};
\end{circuitikz}
\end{document}
```

- **AM-AM:** gain vs input power, the compression curve. **AM-PM:** the insertion phase vs input power. An amplitude-modulated signal through either gets distorted; through AM-PM its amplitude changes become phase changes (Pozar §10.3 lists AM-PM conversion among the nonlinear effects).
- In the binder's measured amplifier (p. 170) the gain stays within about 0.2 dB of its small-signal value up to about $-6$ dBm input, but the phase starts to fall near $-15$ dBm and is already about $7^\circ$ off by $-9$ dBm. **Phase distortion starts first**, which matters for phase- and QAM-modulated signals.
- What a PA's nonlinearity does to a modulated signal (binder pp. 171–173):
  - **Spectral regrowth** (out of band) raises the **ACPR**, $\mathrm{ACPR}=P_{offset}-P_{mean}$ (dB): power in the adjacent channel relative to the channel. Failing it fails the spectral mask.
  - **In-band distortion** raises the **EVM**, the rms error vector over the rms ideal symbol: $\mathrm{EVM}=\left[\frac{\frac1N\sum|S_{ideal,r}-S_{meas,r}|^2}{\frac1N\sum|S_{ideal,r}|^2}\right]^{1/2}$.

> [!tip] Remark
> PA linearity, back-off and efficiency are designed in [[RF Amplifier Design]]. **Phase noise** is the oscillator's version of a noise floor, owned by [[Oscillators]]; how LO phase noise lets an adjacent strong signal down-convert onto the wanted channel (reciprocal mixing) is in [[Mixers and Microwave Oscillators]].

## Level 7: Dynamic Range

```tikz title="Linear dynamic range runs from the noise floor to the 1 dB compression point; spurious-free dynamic range runs from the noise floor to the tone level at which IM3 reaches the noise floor. After Pozar Fig. 10.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.4,0) node[right,font=\scriptsize] {$P_{in}$ (dBm)};
  \draw[->] (0,0) -- (0,6.4) node[above,font=\scriptsize] {$P_{out}$ (dBm)};
  % fundamental y=x+0.5 ; IM3 y=3x-8.5 ; OIP3 (4.5,5) ; No=1
  \draw[thick] (0.5,1.0) -- (3.3,3.8);
  \draw[thick] (3.3,3.8) .. controls (4.0,4.35) .. (6.6,4.55);
  \draw[thick,densely dashed] (0,0.5) -- (0.5,1.0);
  \draw[dashed] (3.3,3.8) -- (4.5,5.0);
  \draw[thick] (3.1667,1.0) -- (3.75,2.75);
  \draw[thick] (3.75,2.75) .. controls (4.0,3.4) .. (5.6,3.75);
  \draw[densely dashed] (2.9,0.2) -- (3.1667,1.0);
  \draw[dashed] (3.75,2.75) -- (4.5,5.0);
  \fill (4.5,5.0) circle (2pt);
  \draw[dotted] (4.5,5.0) -- (0,5.0) node[left,font=\scriptsize] {OIP3};
  \draw[dotted] (4.5,5.0) -- (4.5,0) node[below,font=\scriptsize] {IIP3};
  % noise floor
  \draw[gray,decorate,decoration={snake,amplitude=0.6pt,segment length=4pt}] (0,1.0) -- (7.0,1.0);
  \node[left,font=\scriptsize] at (0,1.0) {$N_o$};
  % P1dB
  \fill (3.65,4.05) circle (1.6pt);
  \draw[dotted] (3.65,4.05) -- (0,4.05) node[left,font=\scriptsize] {OP$_{1dB}$};
  % SFDR arrow
  \draw[<->,red!70!black,thick] (3.1667,1.0) -- (3.1667,3.6667);
  \node[font=\scriptsize,text=red!70!black,anchor=east] at (3.1,2.4) {SFDR};
  \draw[dotted,red!70!black] (3.1667,3.6667) -- (2.6,3.6667);
  % LDR arrow
  \draw[<->,blue!70!black,thick] (6.9,1.0) -- (6.9,4.05);
  \draw[dotted,blue!70!black] (3.65,4.05) -- (6.9,4.05);
  \node[font=\scriptsize,text=blue!70!black,anchor=west] at (6.95,2.5) {LDR};
  \node[font=\scriptsize,anchor=east] at (1.5,2.3) {slope 1};
  \node[font=\scriptsize,anchor=west] at (3.55,1.6) {IM3, slope 3};
\end{circuitikz}
\end{document}
```

### Linear Dynamic Range

$$
\boxed{\mathrm{LDR}=\mathrm{OP_{1dB}}-N_o\ \ (\text{dB, dBm})}
$$

From the noise floor to compression: the range over which $P_{out}=GP_{in}$ holds. The natural range for a power amplifier (Pozar §10.4, binder p. 165). Some authors use the minimum detectable signal instead of $N_o$ at the bottom; that makes LDR a receiver property that depends on modulation and coding.

### SFDR

$$
\boxed{\mathrm{SFDR}=\tfrac23\left(\mathrm{OIP3}-N_o\right)}\qquad\boxed{\mathrm{SFDR}=\tfrac23\left(\mathrm{OIP3}-N_o\right)-\mathrm{SNR}_{min}\ \ (\text{receiver})}\qquad\boxed{\mathrm{SFDR}=\tfrac23\left(\mathrm{IIP3}-N_{in}\right)}
$$

- **Definition:** raise a two-tone input until the IM3 product reaches the noise floor. The ratio of the tone to the floor at that point is the SFDR. Above it, spurs are visible; below it, the signal sinks into noise. This is the "two-tone dynamic range" of LNAs and mixers.
- The $\tfrac23$: IM3 rises 3 dB per dB, the tone 1 dB per dB. The input-referred form is the same number (both $\mathrm{OIP3}$ and $N_o$ are just $\mathrm{IIP3}$ and $N_{in}$ plus $G$), with $N_{in}=-174+\mathrm{NF}+10\log B$.
- **SFDR couples the two halves of this note:** 3 dB more IIP3 or 3 dB less noise floor buys 2 dB of SFDR.
- SFDR $<$ LDR in practice: distortion becomes a problem before compression does.

> [!tip] Remark
> A data converter's SFDR is a different quantity: signal over the largest spur in the output FFT at one stated amplitude, with no noise floor in it ([[Data Converter Fundamentals#SNDR, SFDR, THD]]). The RF SFDR is a range of input levels.

> [!note]- Derivation: the $\tfrac23$ (Pozar Eqs. 10.56–10.59)
> From the cascade derivation, $P_{2\omega_1-\omega_2}=P_{\omega_1}^3/\mathrm{OIP3}^2$. Set it equal to $N_o$: $P_{\omega_1}=(N_o\,\mathrm{OIP3}^2)^{1/3}$. Then $\mathrm{SFDR}=P_{\omega_1}/N_o=(\mathrm{OIP3}/N_o)^{2/3}$, i.e. $\tfrac23(\mathrm{OIP3}-N_o)$ in dB. A receiver that needs $\mathrm{SNR}_{min}$ above the floor loses that much off the bottom of the range, while the spur limit at the top stays put.

> [!example] Dynamic ranges (Pozar Ex. 10.5, and Prob. 10.18 as a check)
> **Ex. 10.5:** receiver NF 7 dB, $G=40$ dB, $\mathrm{OP_{1dB}}=25$ dBm, $\mathrm{OIP3}=35$ dBm, $B=100$ MHz, antenna $T_A=150$ K, $\mathrm{SNR}_{min}=10$ dB.
> - $N_o=GkB[T_A+(F-1)T_0]=10^4(1.38\times10^{-23})(10^8)[150+(4.01)(290)]=1.8\times10^{-8}$ W $=-47.4$ dBm (temperatures again, since $T_A\ne T_0$).
> - $\mathrm{LDR}=25+47.4=$ **72.4 dB**. $\mathrm{SFDR}=\tfrac23(35+47.4)-10=$ **44.9 dB**.
>
> **Prob. 10.18** (book answers LDR 86.7 dB, SFDR 57.8 dB; worked here): NF 6 dB, $G=30$ dB, $\mathrm{OP_{1dB}}=21$ dBm, $\mathrm{OIP3}=33$ dBm, input noise $-105$ dBm, $B=20$ MHz, $\mathrm{SNR}_{min}=8$ dB. $N_o=G[N_i+kT_0B(F-1)]=-65.7$ dBm; $\mathrm{LDR}=21+65.7=86.7$ dB; $\mathrm{SFDR}=\tfrac23(33+65.7)-8=57.8$ dB.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ LNA gain $G_1$ | NF (hides later stages), sensitivity | Cascade IIP3 (dB for dB once the mixer dominates), SFDR, stability |
| ↓ LNA NF ($\Gamma_S\to\Gamma_{opt}$, bias for $F_{min}$) | NF, sensitivity | Gain and input match ($\Gamma_{opt}\ne S_{11}^*$); bias may not suit linearity |
| ↓ loss before the LNA | NF dB for dB | Less preselection: blockers reach the LNA (IIP3 must rise) |
| Preselect filter before the LNA | Blockers, image, IM3 | Its loss adds to NF dB for dB |
| ↓ bandwidth $B$ | Noise floor, sensitivity (10 dB/decade), SFDR ($\tfrac23$ of it) | Data rate / channel width |
| ↑ mixer IIP3 | Cascade IIP3, SFDR | Mixer LO power, current |
| ↑ LNA OIP3 (larger $V_{OV}$, degeneration, more $I_D$) | Cascade IIP3 when the LNA dominates | Power; lower $g_m/I_D$ raises NF |
| Cool the front end (lower $T$) | $T_e$ of lossy parts ($\propto T$), $T_{sys}$ | Cost, cryogenics |
| Mismatch at the input | Nothing for noise | NF rises as $1/(1-|\Gamma|^2)$; a lossy line gets worse still |

## Cheat sheet

| Quantity | Formula |
|---|---|
| Thermal noise | $\overline{v_n}=\sqrt{4kTBR}$, $P_n=kTB$ |
| Noise floor | $kT_0=-174$ dBm/Hz; $N=-174+10\log B$ |
| Noise temperature | $T_e=N_o/(GkB)$; $N_o=GkB(T_s+T_e)$ |
| ENR | $(T_g-T_0)/T_0$ |
| Noise figure | $F=\dfrac{S_i/N_i}{S_o/N_o}=1+T_e/T_0$; $T_e=(F-1)T_0$ |
| Lossy part at $T$ | $T_e=(L-1)T$, $F=1+(L-1)T/T_0$; $F=L$ at $T_0$ |
| Wilkinson, one port terminated | $F=1+(2L-1)T/T_0$ |
| Passive, mismatched | $T_e=\frac{1-G_{21}}{G_{21}}T$ |
| Mismatched lossy line | $T_e=\frac{(L-1)(L+|\Gamma_s|^2)}{L(1-|\Gamma_s|^2)}T$ |
| Mismatched amplifier | $F_m=1+\frac{F-1}{1-|\Gamma|^2}$ |
| Friis | $F=F_1+\frac{F_2-1}{G_1}+\frac{F_3-1}{G_1G_2}+\dots$; $T=T_1+\frac{T_2}{G_1}+\dots$ |
| Noise measure | $M=(F-1)/(1-1/G)$, smaller first |
| Sensitivity | $S_{min}=kB(T_s+T_e)\mathrm{SNR}_{min}$; $-174+\mathrm{NF}+10\log B+\mathrm{SNR}_{min}$ |
| Y-factor | $Y=\frac{T_1+T_e}{T_2+T_e}$, $T_e=\frac{T_1-YT_2}{Y-1}$, $F=\frac{\mathrm{ENR}}{Y-1}$ |
| Cold source | $F=N_o/(kT_0BG)$ |
| Noise parameters | $F=F_{min}+\frac{R_N}{G_S}|Y_S-Y_{opt}|^2=F_{min}+\frac{4R_N}{Z_0}\frac{|\Gamma_S-\Gamma_{opt}|^2}{(1-|\Gamma_S|^2)|1+\Gamma_{opt}|^2}$ |
| Noise circles | $N=\frac{F-F_{min}}{4R_N/Z_0}|1+\Gamma_{opt}|^2$, $C_F=\frac{\Gamma_{opt}}{N+1}$, $R_F=\frac{\sqrt{N(N+1-|\Gamma_{opt}|^2)}}{N+1}$ |
| $r_n$ from two readings | $r_n=(F_{\Gamma_S=0}-F_{min})\frac{|1+\Gamma_{opt}|^2}{4|\Gamma_{opt}|^2}$ |
| IM product level | $P_{IM_n}=nP-(n-1)IP_n$ (dBm) |
| Blocker IIP3 | $\mathrm{IIP3}\ge(3P_{int}-P_{IM,max})/2$ |
| Cascade IP3 (coherent) | $\frac{1}{\mathrm{OIP3}}=\frac{1}{G_2\mathrm{OIP3}'}+\frac{1}{\mathrm{OIP3}''}$; $\frac{1}{\mathrm{IIP3}}=\frac{1}{\mathrm{IIP3}_1}+\frac{G_1}{\mathrm{IIP3}_2}+\dots$ |
| Cascade IP3 (random phase) | $\mathrm{OIP3}^{-2}=(G_2\mathrm{OIP3}')^{-2}+(\mathrm{OIP3}'')^{-2}$ |
| LDR | $\mathrm{OP_{1dB}}-N_o$ |
| SFDR | $\tfrac23(\mathrm{OIP3}-N_o)\ [-\mathrm{SNR}_{min}]$ $=\tfrac23(\mathrm{IIP3}-N_{in})$ |
| NF budget | $\mathrm{NF}_{tot}\le S_{min}+174-10\log B-\mathrm{SNR}_{min}$ |
| LNA gain window | $\frac{F_2-1}{F_{tot}-F_1}\le G_1\le\left[\mathrm{IIP3}_{tot}\left(\frac{1}{\mathrm{OIP3}_1}+\frac{1}{\mathrm{IIP3}_2}\right)\right]^{-1}$ |
| ACPR, EVM | $P_{offset}-P_{mean}$; rms error vector / rms ideal symbol |

## References

- **Pozar, *Microwave Engineering*, 4th ed.** (PDF page = printed + 20).
  - Ch. 10 Noise and Nonlinear Distortion, pp. 496–523, all sections: §10.1 dynamic range and noise sources (Fig. 10.1), noise power and equivalent noise temperature (Eqs. 10.1–10.6, ENR), measurement of noise temperature by the Y-factor method (Eqs. 10.7–10.9, Ex. 10.1); §10.2 noise figure definition (Eqs. 10.10–10.16), cascade (Eqs. 10.17–10.23, Ex. 10.2), passive two-port (Eqs. 10.24–10.29), mismatched lossy line (Eqs. 10.30–10.33), Wilkinson (Ex. 10.3), mismatched amplifier (Eqs. 10.34–10.36); §10.3 nonlinear distortion (Eqs. 10.37–10.44, gain compression, harmonic and IM distortion, IP3 Eqs. 10.45–10.48, cascaded intercept Eqs. 10.49–10.54, Ex. 10.4, passive intermodulation); §10.4 LDR and SFDR (Eqs. 10.55–10.60, Fig. 10.20, Ex. 10.5). Problems 10.1, 10.4, 10.15, 10.18 worked against the book's answers.
  - Ch. 12 §12.3 Low-noise amplifier design, pp. 580–582: noise parameters and noise-figure circles (Eqs. 12.53–12.60), Ex. 12.5 (circle only; the gain-circle design belongs to [[RF Amplifier Design]]).
  - Ch. 13 §13.3 p. 626 ($kT_0=-174$ dBm/Hz in the phase-noise floor) and pp. 626–627 (reciprocal mixing), used only for the link to [[Mixers and Microwave Oscillators]].
  - Ch. 14 §14.2 pp. 676–681: receiver noise characterization (Eqs. 14.27–14.29) for the lossy-line cascade; antenna noise temperature, $G/T$ and Ex. 14.5 left to [[RF Systems#Level 2 Antenna Noise Temperature]] and [[RF Systems#Level 3 Receiver System Temperature and SNR]].
- **ECE 373 binder (Boumaiza, Waterloo), scanned:** linearity specification pp. 165–174 (dynamic range, $P_{1dB}$, $P_{IM_n}=nP-(n-1)IP_n$, $P_{1dB}\approx IP_3-10$, two-tone spectrum, IM3/IM5 in dBc, AM-AM/AM-PM measured curves, spectral regrowth, ACPR, EVM); receiver front end p. 227; noise review pp. 229–231 (Planck, $kTB$, $-174$ dBm/Hz; the p. 230 dBW/dBm values for 300 K and 10 kHz are corrected here); noise figure pp. 232–240 (definition, $F=L$ for a passive part, input-referred noise, cascade, two-stage derivation with available gain, ordering and noise measure, noise parameters in $Y$ and $\Gamma$ form); NF vs collector current p. 242; two-port noise-parameter measurement p. 243; noise circles pp. 244–246. Not used: the BJT LNA design examples pp. 249–256 (they belong to [[RF Amplifier Design]]).
- Left out: Pozar's problem set beyond the four cited; antenna noise temperature and $G/T$ (to [[RF Systems#Level 2 Antenna Noise Temperature]]); oscillator phase noise (to [[Oscillators]]).
