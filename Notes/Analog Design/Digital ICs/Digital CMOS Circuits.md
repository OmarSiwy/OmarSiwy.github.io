---
title: Digital CMOS Circuits
description: Transistor-level digital CMOS from the switch model to the inverter VTC, RC propagation delay, CV²f power, gate and buffer-chain sizing, pass/transmission gates, latches and flip-flops, SRAM/DRAM cells, LFSR/PRBS generators and what scaling does to all of it.
kind: topic
status: growing
aliases:
  - Digital CMOS Circuits
  - CMOS Logic
  - CMOS Inverter
  - Digital IC Design
---

Digital CMOS uses the MOSFET at its two extremes: off, or a resistor to a rail. Every result in this note comes from that picture plus one capacitor. The note opens with the inverter as a black box and refines it level by level. Arithmetic and RTL-level digital design (Boolean algebra, adders, counters, timing closure) live in the separate `Notes/Digital Design/` folder; this note is the circuit view underneath it.

## The big picture

```tikz title="The CMOS inverter on one screen: a PMOS pull-up and an NMOS pull-down driven together (left), which act as two complementary switched resistors charging a load C (middle), giving a rail-to-rail VTC with a steep transition at V_M (right). After Sedra Figs. 16.2, 16.18, 16.25."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1) node[pmos,anchor=D](P){};
  \draw (P.D) -- (0,0) node[circ](O){};
  \draw (O) -- (0,-1) node[nmos,anchor=D](N){};
  \draw (P.S) -- ++(0,0.25) node[above]{$V_{DD}$};
  \draw (N.S) node[ground]{};
  \draw (P.G) -- (N.G);
  \draw ($(P.G)!0.5!(N.G)$) node[circ]{} -- ++(-0.6,0) node[left]{$v_I$};
  \draw (O) -- (2.0,0) node[circ]{} to[C,l=$C$] (2.0,-1.6) node[ground]{};
  \draw (2.0,0) -- (2.4,0) node[right]{$v_O$};
  \node[font=\scriptsize,anchor=west] at (0.15,1.55) {$Q_P$ (pull-up)};
  \node[font=\scriptsize,anchor=west] at (0.15,-1.55) {$Q_N$ (pull-down)};
  \begin{scope}[xshift=5cm]
    \draw (0,2.3) node[above]{$V_{DD}$} to[R,l=$R_P$] (0,1.0) to[nos,l=$S_P$] (0,0) node[circ]{};
    \draw (0,0) to[nos,l=$S_N$] (0,-1.0) to[R,l=$R_N$] (0,-2.3) node[ground]{};
    \draw (0,0) -- (1,0) node[right]{$v_O$};
    \node[font=\scriptsize,align=center] at (0.3,-3.3) {one switch closed at a time:\\ no DC path, $v_O\in\{0,V_{DD}\}$};
  \end{scope}
  \begin{scope}[xshift=8.4cm,yshift=-1.8cm]
    \draw[->] (0,0) -- (3.6,0) node[right]{$v_I$};
    \draw[->] (0,0) -- (0,3.8) node[above]{$v_O$};
    \draw[thick] (0,3) -- (0.9,3) .. controls (1.35,3) and (1.45,2.6) .. (1.5,1.5) .. controls (1.55,0.4) and (1.65,0) .. (2.1,0) -- (3,0);
    \draw[dashed] (0,0) -- (3,3);
    \draw[dotted] (1.5,0) -- (1.5,1.5);
    \node[below] at (1.5,0) {$V_M$};
    \node[below] at (3,0) {$V_{DD}$};
    \node[left] at (0,3) {$V_{DD}$};
    \node[font=\scriptsize,anchor=west] at (1.75,1.3) {$|$gain$|\gg1$};
    \node[font=\scriptsize,anchor=west] at (2.0,0.35) {$V_{OL}=0$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Static CMOS:** an NMOS pull-down network (PDN) and its dual PMOS pull-up network (PUN). Output is $0$ or $V_{DD}$ exactly, and no static current flows in either state.
> 2. **Inverter VTC:** $V_M = \dfrac{r(V_{DD}-|V_{tp}|)+V_{tn}}{r+1}$ with $r=\sqrt{k_p/k_n}$. Matched ($W_p/W_n=\mu_n/\mu_p$): $V_M=V_{DD}/2$, $NM_H=NM_L=\tfrac18(3V_{DD}+2V_t)$.
> 3. **Delay is $RC$:** $t_P = 0.69\,R_{eq}C$, with $R\propto 1/(W/L)$ and $C = 2C_{gd1}+2C_{gd2}+C_{db1}+C_{db2}+C_{g,load}+C_w$. Widening a gate only shrinks the delay due to *external* load. The **FO4** delay is the yardstick.
> 4. **Power is $CV^2f$:** $P_{dyn}=fCV_{DD}^2$, plus a short-circuit pulse and subthreshold leakage. Energy per transition $=\tfrac12CV_{DD}^2$; trade it against delay with $EDP=\tfrac12CV_{DD}^2t_P$.
> 5. **Memory is positive feedback or stored charge:** two cross-coupled inverters make a latch (and the SRAM cell); a capacitor plus one transistor makes the DRAM cell, read out as $\Delta V \approx \pm\frac{C_S}{C_B}\frac{V_{DD}}{2}$.

**Map:** [[#Spec translation|$f_{clk}$, fan-out, power, noise margin → $W_p/W_n$, scale, taper]] → [[#Level 0 Switches and Static CMOS Gates|switches, PUN/PDN, NAND/NOR]] → [[#Level 1 The Inverter's Static Behaviour|VTC, noise margins, $V_M$]] → [[#Level 2 Propagation Delay|$t_P$, load $C$, FO4]] → [[#Level 3 Sizing|inverter, gates, buffer chains]] → [[#Level 4 Power|dynamic, short-circuit, leakage, PDP/EDP]] → [[#Level 5 Pass-Transistor and Transmission-Gate Logic|pass gates, TGs, Elmore]] → [[#Level 6 Dynamic Logic|precharge/evaluate]] → [[#Level 7 Latches and Flip-Flops|latch, SR, D, master-slave, timing]] → [[#Level 8 Memory Cells|SRAM, DRAM, sense amp, decoders]] → [[#Level 9 LFSR and PRBS Generators|LFSR/PRBS]] → [[#Level 10 Scaling and Nanometer Effects|scaling, leakage, FinFETs]].

## Spec translation

### The block's specs

| Digital spec | Definition | Source |
|---|---|---|
| Clock frequency $f_{clk}$ | Set by the slowest register-to-register path: flip-flop overhead plus the gate delays between | Sedra §17.1; Nikolić 2000 §I |
| Propagation delay $t_P$ | $\tfrac12(t_{PHL}+t_{PLH})$, 50 % to 50 % | Sedra Eq. (17.1) |
| Fan-out / load | Number of gate inputs (plus wire) on a node: sets $C_{ext}$ | Sedra §17.1.3, 17.2.3 |
| Noise margins | $NM_L=V_{IL}-V_{OL}$, $NM_H=V_{OH}-V_{IH}$ | Sedra Table 16.1 |
| Power budget | $fCV_{DD}^2$ + short-circuit + leakage | Sedra §17.3 |
| Area | Sum of $W\cdot L$ (with $L=L_{min}$) | Sedra §17.4.1 |
| Memory cell | Non-destructive read, guaranteed write, read delay | Sedra §18.3 |

### Mapping specs to device sizes

There is no amplifier inside a static gate, so the mapping goes straight from the digital spec to transistor widths.

| Digital spec | Circuit quantity it fixes | Device knob |
|---|---|---|
| $f_{clk}$ | $\sum t_P$ on the critical path, each $t_P=0.69R_{eq}C$ | $L=L_{min}$; scale factor $S$ on all widths; buffer taper $x$; $V_{DD}$ (process-fixed) |
| Fan-out, wire load | $C_{ext}$ in $C=C_{int}+C_{ext}$ | $S$ until $R_{eq0}C_{ext}/S$ is small; a chain with $x\approx e$ to 4 for big loads |
| Equal rise/fall (clock duty cycle) | $t_{PLH}=t_{PHL}$ | $W_p/W_n=\mu_n/\mu_p$ (matched); $2\times$ is the usual compromise |
| Noise margin | $V_M$, $NM_L$, $NM_H$ | $r=\sqrt{k_p/k_n}$; weak function, so $W_p=W_n$ costs little |
| Power budget | $C$ switched per cycle, $V_{DD}$, leakage | Small $S$; NAND over NOR; high-$V_t$ devices off the critical path; clock gating |
| Area | $\sum WL$ | $W_p=W_n$ (minimum area) to $W_p=(\mu_n/\mu_p)W_n$ (matched) |
| SRAM read stability / writability | $V_{\bar Q}<V_{tn}$ on read; $V_Q<V_{tn}$ on write | $(W/L)_a/(W/L)_n$ upper bound; $(W/L)_p/(W/L)_a$ upper bound |
| DRAM sense margin | $\Delta V=\frac{C_S}{C_B}\frac{V_{DD}}2$ | $C_S$; cells per bit line (sets $C_B$) |
| Sense-amplifier speed | Regeneration $\tau=C_B/G_m$ | $G_m=g_{mn}+g_{mp}$ at $V_{DD}/2$ |

$$
\boxed{\text{Per gate: } t_P = 0.69\,\frac{R_{eq0}}{S}\left(SC_{int0}+C_{ext}\right)\le \frac{T_{clk}-t_{FF}}{N_{stages}},\qquad P = f C V_{DD}^2 \le P_{budget}}
$$

> [!note]- Derivation: from $f_{clk}$ to a width scale factor
> 1. The clock period must cover the flip-flop overhead ($t_{FF}$ = setup + clock-to-Q, [[#Flip-flop timing at the circuit level|below]]) plus the gate delays on the slowest path: $T_{clk}\ge t_{FF}+\sum_i t_{P,i}$.
> 2. Split that budget over the $N$ stages of the path to get a $t_P$ target per stage.
> 3. Each stage's load is $C=C_{int}+C_{ext}$. Scaling every width of the stage by $S$ multiplies $C_{int}$ by $S$ and divides $R_{eq}$ by $S$ (Sedra Eqs. 17.22–17.25), so
> $$t_P=0.69\left(R_{eq0}C_{int0}+\frac{R_{eq0}C_{ext}}{S}\right)$$
> 4. The first term is a floor no sizing can beat (the gate loading itself). Solve for the smallest $S$ that meets the target. If even $S\to\infty$ misses, the load is too big for one stage: insert a [[#Driving a large capacitance|buffer chain]].
> 5. Check power: the chosen $S$ sets $C$, and $P=fCV_{DD}^2$ must fit the budget. Speed and power pull $S$ in opposite directions.

### Why not gm/ID

> [!tip] Remark
> [[gm-ID Design Methodology]] sizes a transistor around a **bias point**: it picks an inversion level for small-signal $g_m$, $f_T$ and $g_mr_o$. A logic transistor has no bias point. It spends its life in cutoff or deep triode ([[MosFETs#Level 0 The Switch Model|switch model]]) and crosses saturation only during a transition. What matters is (i) on-current per unit input capacitance, which the process fixes at $L=L_{min}$ and $V_{GS}=V_{DD}$, and (ii) the ratios between widths. So the design variables are $W_p/W_n$, a scale $S$ and a taper $x$, and the figure of merit is $RC$, not $g_m/I_D$.

$g_m$ comes back in exactly one place: **regeneration**. A latch, a sense amplifier or a metastable flip-flop sits at its unstable midpoint, where both devices are saturated and the pair is a small-signal amplifier with $\tau=C/G_m$. That is the [[Comparators#Positive Feedback Regeneration|comparator]] view, used [[#Sense amplifier|below]].

### Where it lands in sizing

| Knob | Set by | Typical choice (Sedra) |
|---|---|---|
| $L$ | Area and speed | $L_{min}$ for every logic device |
| $(W/L)_n$ of the unit inverter | Area vs drive | 1 to 1.5 for minimum area; "closer to 2 and above" in recent nodes |
| $W_p/W_n$ | $V_M$, $t_{PLH}=t_{PHL}$ vs area | $\mu_n/\mu_p$ (matched), $2$ (compromise), $1$ (minimum area; common at 28 nm where $k_n'\approx k_p'$) |
| Series stack of $k$ devices | Worst-case current equal to the unit inverter | Each device $k\times$ wider |
| Buffer taper $x$ | $x^n=C_L/C$ | $x=e$ ideal, 2.5 to 4 in practice |
| SRAM ratios | Read and write constraints | Eqs. (18.23), (18.29) |

### Worked example: a 28 nm inverter

Sedra Ex. 17.3 with Exs. 17.7, 17.11, 17.14. Given: $C_{ox}=34$ fF/µm², $R_{eff,N}=15$ kΩ and $R_{eff,P}=20$ kΩ at $W/L=1$, both devices $60/28$ nm, overlap $0.4$ fF/µm, $C_{db}=0.03$ fF each, $C_w=0.5$ fF, $V_{DD}=0.9$ V, driving one identical inverter.

| Step | Value |
|---|---|
| Gate cap per device: $WLC_{ox}+2(0.4\,\text{fF/}\mu\text{m})W$ | $0.057+0.048=0.105$ fF |
| $C=2C_{gdn}+2C_{gdp}+C_{dbn}+C_{dbp}+C_{gn}+C_{gp}+C_w$ | $0.096+0.06+0.21+0.5=\mathbf{0.866}$ fF (Sedra) |
| $R_N=15\,\text{k}\cdot\frac{28}{60}$, $R_P=20\,\text{k}\cdot\frac{28}{60}$ | $7.0$ kΩ, $9.33$ kΩ |
| $t_{PHL}=0.69R_NC$, $t_{PLH}=0.69R_PC$ | $4.18$ ps, $5.58$ ps; $t_P=\mathbf{4.88}$ ps (Sedra) |
| FO4: $C=2C_{gd}$'s $+C_{db}$'s $+4C_{g}$'s $+C_w$ | $1.50$ fF → $t_{P,FO4}\approx 8.4$ ps |
| $P_{dyn}$ at 1 GHz | $fCV_{DD}^2=0.70$ µW |
| $PDP=\frac12CV_{DD}^2$, $EDP=PDP\cdot t_P$ | $0.35$ fJ, $1.7\times10^{-27}$ J·s |

Values in bold are Sedra's; the rest is my arithmetic from his data (the solutions are not in the PDF). The wire is the single largest term: in this node the wiring, not the transistors, dominates $C$.

## Level 0: Switches and Static CMOS Gates

### Switch model

An NMOS is a closed switch (resistance $R_{on}$) when its gate is at $V_{DD}$ and open at $0$; a PMOS is the opposite.

> [!tip] Remark
> This is the switch model of [[MosFETs#Level 0 The Switch Model]], with $R_{on}=1/\left[\mu C_{ox}\frac WL(V_{DD}-|V_t|)\right]$ from [[MosFETs#Regions of Operation|deep triode]]. NMOS is active-high, PMOS active-low.

### Pull-up and pull-down networks

```tikz title="Two-input NAND (left) and NOR (right). Series in one network is parallel in the other. Device labels are W/L relative to the unit inverter (n, p) for worst-case drive equal to that inverter. After Sedra Figs. 16.7, 16.8, 17.8, 17.9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % NAND2
  \draw (-0.9,2.0) node[pmos](PA){};
  \draw (1.3,2.0) node[pmos](PB){};
  \draw (PA.S) -- (-0.9,3.0) -- (1.3,3.0) -- (PB.S);
  \draw (0.2,3.0) node[vcc]{$V_{DD}$};
  \draw (PA.D) -- (-0.9,1.0) -- (1.3,1.0) -- (PB.D);
  \draw (0.2,1.0) node[circ]{} -- (0.2,0.7) node[nmos,anchor=D](NA){};
  \draw (NA.S) -- (0.2,-0.8) node[nmos,anchor=D](NB){};
  \draw (NB.S) node[ground]{};
  \draw (1.3,1.0) -- (2.2,1.0) node[right]{$Y=\overline{AB}$};
  \node[left] at (PA.G) {$A$}; \node[left] at (PB.G) {$B$};
  \node[left] at (NA.G) {$A$}; \node[left] at (NB.G) {$B$};
  \node[font=\scriptsize] at (-0.4,2.0) {$p$};
  \node[font=\scriptsize] at (1.8,2.0) {$p$};
  \node[font=\scriptsize] at (0.75,0.0) {$2n$};
  \node[font=\scriptsize] at (0.75,-1.5) {$2n$};
  \node[font=\scriptsize] at (0.4,-3.3) {NAND: PDN series, PUN parallel};
  % NOR2
  \begin{scope}[xshift=6.5cm]
    \draw (0.2,3.4) node[vcc]{$V_{DD}$} -- (0.2,3.1) node[pmos,anchor=S](PA){};
    \draw (PA.D) -- (0.2,1.6) node[pmos,anchor=S](PB){};
    \draw (PB.D) -- (0.2,0.2) node[circ]{};
    \draw (-0.9,0.2) -- (1.3,0.2);
    \draw (-0.9,0.2) -- (-0.9,-0.1) node[nmos,anchor=D](NA){};
    \draw (1.3,0.2) -- (1.3,-0.1) node[nmos,anchor=D](NB){};
    \draw (NA.S) -- (-0.9,-1.9) -- (1.3,-1.9) -- (NB.S);
    \draw (0.2,-1.9) node[ground]{};
    \draw (1.3,0.2) -- (2.2,0.2) node[right]{$Y=\overline{A+B}$};
    \node[left] at (PA.G) {$A$}; \node[left] at (PB.G) {$B$};
    \node[left] at (NA.G) {$A$}; \node[left] at (NB.G) {$B$};
    \node[font=\scriptsize] at (0.75,2.55) {$2p$};
    \node[font=\scriptsize] at (0.75,1.05) {$2p$};
    \node[font=\scriptsize] at (-0.4,-0.6) {$n$};
    \node[font=\scriptsize] at (1.8,-0.6) {$n$};
    \node[font=\scriptsize] at (0.4,-3.3) {NOR: PDN parallel, PUN series};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **PDN** (NMOS) conducts for every input combination that needs $Y=0$; **PUN** (PMOS) conducts for every combination that needs $Y=1$. Never both, so no DC path.
- In either network, **parallel = OR, series = AND** (of conduction).
- PDN and PUN are **duals**: series in one is parallel in the other. Duality is sufficient, not necessary (Sedra's XOR uses non-dual networks).
- Each extra input costs one NMOS and one PMOS.

> [!note]- Detail: Sedra's synthesis recipe and the complex-gate and XOR examples
> 1. **PDN:** write $\overline Y$ as a function of the *uncomplemented* inputs; each AND is a series branch, each OR a parallel branch. Complemented inputs need extra inverters.
> 2. **PUN:** write $Y$ as a function of the *complemented* inputs (De Morgan), then drive the PMOS gates with the uncomplemented variables.
> 3. Or derive one network as the dual of the other.
>
> **Complex gate** $Y=\overline{A(B+CD)}$ (Sedra Eq. 16.3, Fig. 16.9): PDN is $A$ in series with ($B$ parallel with $C$-series-$D$). De Morgan gives $Y=\overline A+\overline B(\overline C+\overline D)$, so PUN is $A$ in parallel with ($B$ in series with $C\|D$). One stage, 8 transistors, instead of a cascade of simple gates.
>
> **XOR** $Y=A\overline B+\overline AB$ (Fig. 16.10): $Y$ is given directly but is not a function of complemented variables only, so two inverters supply $\overline A,\overline B$. PUN: two series pairs in parallel. PDN from $\overline Y=AB+\overline A\,\overline B$. Total 12 transistors, and the networks are not duals.

### Why NAND beats NOR

Series devices add their channel lengths; parallel devices add their widths:

$$
\boxed{\left(\frac WL\right)_{series}=\frac{1}{\sum_i 1/(W/L)_i},\qquad \left(\frac WL\right)_{parallel}=\sum_i\left(\frac WL\right)_i}
$$

To give an $N$-input gate the same worst-case current as the unit inverter ($n$, $p$), every device in a stack of $N$ is $N\times$ wider. A NAND$N$ stacks the fast NMOS ($Nn$ each, PMOS stay $p$); a NOR$N$ stacks the slow PMOS ($Np$ each). With $p$ = 2 to 3 $n$, the NOR is much bigger, so **CMOS logic prefers NAND** (Sedra §17.2.2). Fan-in is limited to about 4; wider functions are better split into more, smaller stages (§17.2.3).

> [!tip] Remark
> "Worst case" means the input combination with the least current: for a NOR's PDN that is one NMOS on (so each is $n$); for its PUN the only conducting case is all four PMOS on in series (so each is $4p$).

## Level 1: The Inverter's Static Behaviour

### VTC and noise margins

```tikz title="Inverter VTC and its critical points. V_IL and V_IH are where the slope is -1; V_M is where v_O = v_I. The noise margins are the input ranges that still read as a clean 0 or 1. After Sedra Figs. 16.13, 16.15."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right]{$v_I$};
  \draw[->] (0,0) -- (0,5.4) node[above]{$v_O$};
  \draw[thick] (0,4.8) -- (1.6,4.8) .. controls (2.3,4.8) and (2.75,4.3) .. (2.9,2.9) .. controls (3.05,1.4) and (3.4,0.15) .. (4.2,0.15) -- (6,0.15);
  \draw[dashed] (0,0) -- (5,5);
  \draw[dotted] (2.3,0) -- (2.3,4.6);
  \draw[dotted] (3.5,0) -- (3.5,0.6);
  \draw[dotted] (2.9,0) -- (2.9,2.9);
  \node[below] at (2.3,0) {$V_{IL}$};
  \node[below] at (2.9,0) {$V_M$};
  \node[below] at (3.5,0) {$V_{IH}$};
  \node[left] at (0,4.8) {$V_{OH}$};
  \node[left] at (0,0.15) {$V_{OL}$};
  \draw[red,thick] (1.9,4.95) -- (2.7,4.15) node[right,font=\scriptsize]{slope $-1$};
  \draw[red,thick] (3.1,0.95) -- (3.9,0.15);
  \node[font=\scriptsize,anchor=west] at (3.95,0.65) {slope $-1$};
  \draw[<->] (6.9,0.15) -- (6.9,2.3) node[midway,right,font=\scriptsize,align=left]{$NM_L$\\$=V_{IL}-V_{OL}$};
  \draw[<->] (6.9,3.5) -- (6.9,4.8) node[midway,right,font=\scriptsize,align=left]{$NM_H$\\$=V_{OH}-V_{IH}$};
  \draw[dotted] (2.3,2.3) -- (6.9,2.3);
  \draw[dotted] (3.5,3.5) -- (6.9,3.5);
  \draw[dotted] (6,0.15) -- (6.9,0.15);
  \draw[dotted] (1.6,4.8) -- (6.9,4.8);
  \node[font=\scriptsize] at (0.8,2.6) {logic-0 input};
  \node[font=\scriptsize] at (5.1,1.4) {logic-1 input};
\end{circuitikz}
\end{document}
```

$$
\boxed{NM_L = V_{IL}-V_{OL},\qquad NM_H = V_{OH}-V_{IH}}
$$

- $V_{IL}$ is the largest input still read as 0; $V_{IH}$ the smallest read as 1. Both are defined at slope $-1$.
- A gate **restores** levels: noise smaller than the margin at its input does not reach its output. This is why noise does not accumulate along a logic path.
- Ideal VTC: $V_{OH}=V_{DD}$, $V_{OL}=0$, a vertical transition at $V_{DD}/2$, so $NM=V_{DD}/2$. CMOS comes close.

> [!tip] Remark
> The transition region is a high-gain amplifier: the same circuit biased at $V_M$ is the inverter amplifier (a CS stage with an active load, [[Single-Stage]]). Digital design wants that region as narrow as possible; analog design lives inside it.

### Why CMOS is (almost) ideal

| Property | Reason |
|---|---|
| $V_{OH}=V_{DD}$, $V_{OL}=0$ | The on device carries zero current at the end, so no drop across it |
| Zero static power | One network is always off |
| Low output resistance in both states | $r_{DSN}=1/\left[k_n'(W/L)_n(V_{DD}-V_{tn})\right]$, $r_{DSP}=1/\left[k_p'(W/L)_p(V_{DD}-|V_{tp}|)\right]$ |
| Strong drive in both directions | Active pull-up and pull-down |
| Infinite input resistance | Fan-out limited only by capacitance (speed), never by DC level |

> [!note]- Detail: the inverters CMOS replaced (resistive load, pseudo-NMOS, current steering)
> - **Resistive load** (Sedra Fig. 16.12, Ex. 16.2): an NMOS switch with a pull-up resistor $R_D$. $V_{OL}=V_{DD}\,r_{DS}/(r_{DS}+R_D)>0$, static power $\approx V_{DD}^2/R_D$ in the low state, and $R_D$ must be large, which costs area on chip.
> - **Pseudo-NMOS** (Fig. 16.21): replace $R_D$ with a PMOS whose gate is grounded. Same ratioed behaviour ($V_{OL}>0$, static current in the low state) in less area. Sedra's full treatment is an online appendix not in this PDF.
> - **Current steering** (Fig. 16.19): a double-throw switch steers a constant current into one of two resistors. The output does not depend on the switch resistance. This is the root of ECL and of CML, which is owned by [[High-Speed Circuit Techniques#The CML gate as a current switch]].

### Matched inverter: the five-segment VTC

With $V_{tn}=|V_{tp}|=V_t$ and $k_n=k_p$, i.e.

$$
\boxed{\frac{W_p}{W_n}=\frac{\mu_n}{\mu_p}\quad(\text{same } L)}
$$

the VTC is symmetric, $V_M=V_{DD}/2$, and

$$
\boxed{V_{IH}=\tfrac18(5V_{DD}-2V_t),\qquad V_{IL}=\tfrac18(3V_{DD}+2V_t),\qquad NM_H=NM_L=\tfrac18(3V_{DD}+2V_t)}
$$

The vertical segment (both devices saturated, infinite gain if $\lambda=0$) runs from $v_O=V_{DD}/2+V_t$ (where $Q_P$ enters triode) to $V_{DD}/2-V_t$ (where $Q_N$ does).

> [!note]- Derivation: $V_{IH}$ and $V_{IL}$ from slope $=-1$
> At $v_I=V_{IH}$, $Q_N$ is in triode and $Q_P$ in saturation. Equate currents (matched, $\lambda=0$):
> $$(v_I-V_t)v_O-\tfrac12v_O^2=\tfrac12(V_{DD}-v_I-V_t)^2$$
> Differentiate with respect to $v_I$:
> $$(v_I-V_t)\frac{dv_O}{dv_I}+v_O-v_O\frac{dv_O}{dv_I}=-(V_{DD}-v_I-V_t)$$
> Set $dv_O/dv_I=-1$: $v_O=V_{IH}-V_{DD}/2$. Substitute back: $V_{IH}=\frac18(5V_{DD}-2V_t)$. By symmetry about $V_{DD}/2$, $V_{IL}=V_{DD}-V_{IH}=\frac18(3V_{DD}+2V_t)$. With $V_{OL}=0$, $V_{OH}=V_{DD}$ both margins equal $\frac18(3V_{DD}+2V_t)$ (Sedra Eqs. 16.33–16.38).

### Switching threshold and the sizing ratio

$$
\boxed{V_M=\frac{r\,(V_{DD}-|V_{tp}|)+V_{tn}}{r+1},\qquad r=\sqrt{\frac{k_p}{k_n}}=\sqrt{\frac{\mu_pW_p}{\mu_nW_n}}}
$$

- $V_M$ rises with $r$: a stronger PMOS pushes the trip point toward $V_{DD}$.
- $V_M$ is a **weak** function of $r$ (square root). For $V_{DD}=1$ V, $V_t=0.35$ V, halving $r$ from 1 to 0.5 moves $V_M$ by only 0.05 V (Sedra Fig. 16.26).
- So matching costs a lot of PMOS area ($W_p$ 3 to 4× $W_n$ historically) for a small gain in $NM_L$. Sedra's practice: $W_p=W_n$ for minimum area, $W_p=2W_n$ as the common compromise, matched only where symmetry matters.

> [!note]- Derivation and numbers: $V_M$, and Sedra Ex. 16.3 at 65 nm
> At $v_I=v_O=V_M$ both devices saturate: $\frac12k_n(V_M-V_{tn})^2=\frac12k_p(V_{DD}-V_M-|V_{tp}|)^2$. Take square roots and solve for $V_M$ to get Eq. (16.39).
>
> **Ex. 16.3** ($V_{DD}=1$ V, $V_t=0.35$ V, $\mu_n=5.4\mu_p$, $\mu_nC_{ox}=540$ µA/V², $(W/L)_n=1.5$). My arithmetic from Sedra's data:
>
> | Sizing | $r$ | $V_M$ | Area vs matched |
> |---|---|---|---|
> | Matched, $W_p=5.4W_n$ | 1 | 0.50 V | 100 % |
> | $W_p=2W_n$ | 0.61 | 0.46 V | 47 % |
> | $W_p=W_n$ | 0.43 | 0.44 V | 31 % |
>
> Matched case: $V_{IH}=0.54$ V, $V_{IL}=0.46$ V, $NM=0.46$ V, $r_{DSN}=r_{DSP}=1/[540\,\mu\cdot1.5\cdot0.65]\approx1.9$ kΩ.

## Level 2: Propagation Delay

### Definitions

```tikz title="Propagation delays are measured 50% to 50%; transition times 10% to 90% of the output swing. After Sedra Fig. 17.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,2.6) -- (10,2.6) node[right]{$t$};
  \node[left] at (0,3.4) {$v_I$};
  \draw[thick] (0,2.6) -- (0.8,2.6) -- (1.2,4.2) -- (5,4.2) -- (5.4,2.6) -- (9.5,2.6);
  \draw[dotted] (0,3.4) -- (9.5,3.4);
  \draw[->] (0,0) -- (10,0) node[right]{$t$};
  \node[left] at (0,0.8) {$v_O$};
  \draw[thick] (0,1.6) -- (1.2,1.6) .. controls (1.8,1.6) and (2.0,0) .. (3.2,0) -- (5.4,0) .. controls (6.0,0) and (6.6,1.6) .. (8,1.6) -- (9.5,1.6);
  \draw[dotted] (0,0.8) -- (9.5,0.8);
  \draw[dotted] (1.0,3.4) -- (1.0,-0.3);
  \draw[dotted] (1.85,0.8) -- (1.85,-0.3);
  \draw[<->] (1.0,-0.35) -- (1.85,-0.35) node[midway,below,font=\scriptsize]{$t_{PHL}$};
  \draw[dotted] (5.2,3.4) -- (5.2,-0.3);
  \draw[dotted] (6.35,0.8) -- (6.35,-0.3);
  \draw[<->] (5.2,-0.35) -- (6.35,-0.35) node[midway,below,font=\scriptsize]{$t_{PLH}$};
  \node[font=\scriptsize,anchor=west] at (8.1,3.55) {50 \%};
  \node[font=\scriptsize,anchor=west] at (8.1,0.95) {50 \%};
  \draw[dotted] (5.65,0.16) -- (7.2,0.16);
  \draw[dotted] (7.2,1.44) -- (7.6,1.44);
  \draw[<->] (5.65,-1.1) -- (7.25,-1.1) node[midway,below,font=\scriptsize]{$t_{TLH}$ (10 \% to 90 \%)};
  \draw[dotted] (5.65,0.16) -- (5.65,-1.1);
  \draw[dotted] (7.25,1.44) -- (7.25,-1.1);
\end{circuitikz}
\end{document}
```

$$
\boxed{t_P=\tfrac12\left(t_{PHL}+t_{PLH}\right)}
$$

All delay is the time to move charge $C\Delta V$ with a finite current: $I\Delta t=C\Delta V$. Two hand methods give it.

### Equivalent-resistance method

$$
\boxed{t_{PHL}=0.69\,R_NC,\quad t_{PLH}=0.69\,R_PC,\qquad R_N=\frac{R_{eff,N}}{(W/L)_n},\ R_P=\frac{R_{eff,P}}{(W/L)_p}}
$$

- $0.69=\ln2$: the 50 % point of an $RC$ step response. For a **ramp** input the factor approaches 1: $t_{PHL}\approx R_NC$, $t_{PLH}\approx R_PC$.
- $R_{eff}$ is the resistance of a unit ($W/L=1$) device, extracted once per process by simulating an inverter into a large $C$. Sedra quotes $R_{eff,N}=12.5$ kΩ and $R_{eff,P}=30$ kΩ for 0.25, 0.18 and 0.13 µm (Hodges et al.).
- It absorbs velocity saturation automatically, which the square-law method misses ([[#Level 10 Scaling and Nanometer Effects|Level 10]]).

> [!note]- Derivation: the average-current method (square law)
> Input steps to $V_{DD}$; $C$ discharges from $V_{DD}$ to $V_{DD}/2$ through $Q_N$, which starts saturated (point E) and enters triode at $v_O=V_{DD}-V_{tn}$. Approximate the current by the average of its values at the two ends:
> $$i_{DN}(E)=\tfrac12k_n'\left(\tfrac WL\right)_n(V_{DD}-V_{tn})^2,\qquad i_{DN}(M)=k_n'\left(\tfrac WL\right)_n\left[(V_{DD}-V_{tn})\tfrac{V_{DD}}2-\tfrac12\left(\tfrac{V_{DD}}2\right)^2\right]$$
> $$t_{PHL}=\frac{C\,V_{DD}/2}{I_{av}}=\frac{\alpha_nC}{k_n'(W/L)_nV_{DD}},\qquad \alpha_n=\frac{2}{\frac74-\frac{3V_{tn}}{V_{DD}}+\left(\frac{V_{tn}}{V_{DD}}\right)^2}$$
> $\alpha_n$ is 1 to 3. $t_{PLH}$ is the same with $p$ subscripts. Insights (Sedra §17.1.2): match $k_n=k_p$ to equalize the two; $t_P\propto C$; a bigger $k'$ helps but brings a bigger $C_{ox}$; bigger $W/L$ helps only when $C$ is mostly external; higher $V_{DD}$ is faster but is fixed by the process and costs power. This method *underestimates* delay in short-channel devices because velocity saturation lowers the current.

### What makes up $C$

```tikz title="Capacitances on the output node of inverter Q1-Q2 driving inverter Q3-Q4 through a wire. C_gd is Miller-doubled because input and output swing in opposite directions. After Sedra Figs. 17.6, 17.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw (0,1) node[pmos,anchor=D](P){};
  \draw (P.D) -- (0,0) node[circ](O){};
  \draw (O) -- (0,-1) node[nmos,anchor=D](N){};
  \draw (P.S) -- ++(0,0.2) node[above]{$V_{DD}$};
  \draw (N.S) node[ground]{};
  \draw (P.G) -- (N.G);
  \draw ($(P.G)!0.5!(N.G)$) node[circ]{} -- ++(-0.5,0) node[left]{$v_I$};
  \node[font=\scriptsize] at (0.5,1.5) {$Q_2$};
  \node[font=\scriptsize] at (0.5,-1.5) {$Q_1$};
  \draw (O) -- (8.6,0);
  \draw (1.2,0) node[circ]{} to[C,l=$2C_{gd1}$] (1.2,-1.6) node[ground]{};
  \draw (2.9,0) node[circ]{} to[C,l=$2C_{gd2}$] (2.9,-1.6) node[ground]{};
  \draw (4.6,0) node[circ]{} to[C,l={$C_{db1}{+}C_{db2}$}] (4.6,-1.6) node[ground]{};
  \draw (7.2,0) node[circ]{} to[C,l=$C_w$] (7.2,-1.6) node[ground]{};
  \begin{scope}[xshift=9.6cm]
    \draw (0,1) node[pmos,anchor=D](P2){};
    \draw (P2.D) -- (0,0) node[circ](O2){};
    \draw (O2) -- (0,-1) node[nmos,anchor=D](N2){};
    \draw (P2.S) -- ++(0,0.2) node[above]{$V_{DD}$};
    \draw (N2.S) node[ground]{};
    \draw (P2.G) -- (N2.G);
    \draw ($(P2.G)!0.5!(N2.G)$) node[circ]{} -- (-0.8,0);
    \node[font=\scriptsize] at (0.45,1.95) {$Q_4$};
    \node[font=\scriptsize] at (0.45,-1.95) {$Q_3$};
    \node[font=\scriptsize,align=left,anchor=west] at (0.9,-0.8) {load: $C_{g3}+C_{g4}$\\ $=(WL)_3C_{ox}+(WL)_4C_{ox}$ + overlaps};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{C=2C_{gd1}+2C_{gd2}+C_{db1}+C_{db2}+C_{g3}+C_{g4}+C_w}
$$

- **$2C_{gd}$:** input rises by $\Delta V$ while the output falls by $\Delta V$, so the overlap cap sees $2\Delta V$ (Miller).
- **$C_{db}$:** one terminal is at a fixed voltage; use the large-signal (effective) junction value.
- **$C_g$ of the load:** the load inverter does not switch during the first half-swing, so its gate cap is constant: $WLC_{ox}+C_{gsov}+C_{gdov}$ per device.
- **$C_w$:** wire. Increasingly the dominant term.

> [!tip] Remark
> These are the device capacitances of [[MosFETs#Capacitances]]. The factor 2 is [[Frequency Response#Miller's Theorem|Miller's theorem]] with a gain of $-1$ between input and output.

### FO4: the technology's unit of delay

The **fan-out-of-4 (FO4)** delay is the delay of an inverter driving four copies of itself:

$$
\boxed{C_{FO4}=2C_{gd1}+2C_{gd2}+C_{db1}+C_{db2}+4C_{g1}+4C_{g2}+C_w}
$$

It is the yardstick for comparing processes and for quoting cycle times. In Sedra's 28 nm example it is about 8.4 ps (my arithmetic, [[#Worked example a 28 nm inverter|above]]). Wong et al. target a bit time of 3 FO4, which they equate to 3.6 Gb/s in 0.18 µm, i.e. FO4 ≈ 93 ps there.

> [!tip] Remark
> Why 4: it is near the optimum stage effort of a tapered chain, see [[#Driving a large capacitance]] and [[Logical Effort]]. How many FO4 a clock or a serial bit can be is owned by [[High-Speed Circuit Techniques#FO4 limits of CMOS]] (about 8 FO4 per clock period, about 2 FO4 per MUX bit).

## Level 3: Sizing

### Inverter sizing: intrinsic vs extrinsic load

$$
\boxed{t_P=0.69\left(R_{eq0}C_{int0}+\frac{R_{eq0}C_{ext}}{S}\right),\qquad R_{eq}=\tfrac12(R_N+R_P)}
$$

Scaling both widths by $S$ divides $R_{eq}$ by $S$ and multiplies the inverter's own capacitance $C_{int}$ by $S$. The self-loading term $R_{eq0}C_{int0}$ is **independent of size**: only the external part of the delay can be bought with width.

### Gate sizing

Size each network so that its worst-case conducting path matches the unit inverter ($n$, $p$): devices in a stack of $k$ get $k\times$ the unit width ([[#Why NAND beats NOR]]). Upsizing restores the current but not the capacitance, so $t_P$ still grows with fan-in.

> [!note]- Detail: Sedra Ex. 17.4 recipe and Exs. 17.9–17.10
> For each network, list the conduction paths from output to rail. For each device, find the longest series path it sits on (count of devices $k$) and size it $k\cdot n$ (PDN) or $k\cdot p$ (PUN). A device that sits on paths of different lengths takes the largest $k$.
> Ex. 17.9 (0.18 µm, $n=1.5$, $p=3$): NOR4 has NMOS $1.5$ and PMOS $12$ each; NAND4 has NMOS $6$ and PMOS $3$ each. Area ratio NOR4 : NAND4 $=(4\cdot1.5+4\cdot12):(4\cdot6+4\cdot3)=54:36=1.5$ (my arithmetic). Ex. 17.10 points out that the best-case (all parallel devices on) current of the sized NAND is several times the worst case, so the gate is fast for some inputs and only "inverter-fast" for the worst.

### Driving a large capacitance

```tikz title="Tapered buffer: each stage is x times larger, so every interface has the same time constant xCR. After Sedra Fig. 17.11(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee}
  \draw (0,0) node[not port,scale=0.6](a){};
  \draw (2.4,0) node[not port,scale=0.8](b){};
  \draw (5.0,0) node[not port,scale=1.0](c){};
  \draw (8.4,0) node[not port,scale=1.3](d){};
  \draw (a.in) -- ++(-0.4,0) node[left]{in};
  \draw (a.out) -- (b.in);
  \draw (b.out) -- (c.in);
  \draw (c.out) -- (6.5,0);
  \draw[dashed] (6.5,0) -- (7.1,0);
  \draw (7.1,0) -- (d.in);
  \draw (d.out) -- (10.2,0) node[circ]{} to[C,l=$C_L$] (10.2,-1.6) node[ground]{};
  \node[font=\scriptsize] at (0,0.8) {$1$};
  \node[font=\scriptsize] at (2.4,0.9) {$x$};
  \node[font=\scriptsize] at (5.0,1.0) {$x^2$};
  \node[font=\scriptsize] at (8.4,1.2) {$x^{n-1}$};
  \node[font=\scriptsize,align=center] at (0,-1.0) {in: $C$\\out: $R$};
  \node[font=\scriptsize,align=center] at (2.4,-1.0) {$xC$\\$R/x$};
  \node[font=\scriptsize,align=center] at (5.0,-1.0) {$x^2C$\\$R/x^2$};
  \node[font=\scriptsize,align=center] at (8.4,-1.2) {$x^{n-1}C$\\$R/x^{n-1}$};
  \node[font=\scriptsize] at (5,-2.3) {each interface: $\tau = xCR$;\quad last: $C_LR/x^{n-1}=xCR$ when $x^n=C_L/C$};
\end{circuitikz}
\end{document}
```

$$
\boxed{x^n=\frac{C_L}{C},\qquad t_P=n\,x\,CR,\qquad x_{opt}=e\ (\text{2.5 to 4 in practice})}
$$

- One minimum inverter into $C_L$: $\tau=C_LR$, huge.
- One $m$-times bigger inverter: $\tau=C_LR/m$, but now *its* input is $mC$: the problem moved upstream.
- A geometric chain equalizes every stage's delay; minimum total delay at $x=e$ (Sedra Eq. 17.33). The optimum is flat, so 2.5 to 4 is near-optimal.

> [!note]- Derivation and example: $x=e$, and Sedra Ex. 17.5
> With $n=\ln(C_L/C)/\ln x$, $t_P=\frac{x}{\ln x}\,CR\ln\frac{C_L}{C}$. Minimizing $x/\ln x$ gives $\ln x=1$, $x=e$. This ignores each stage's self-loading; with self-loading the optimum moves up to about 3.6 to 4, which is the FO4 of [[Logical Effort]].
>
> **Ex. 17.5:** $C=10$ fF, $R=1$ kΩ, $C_L=1$ pF. Direct drive: $\tau=C_LR=1$ ns. Chain: $C_L/C=100$, $n=\ln100=4.6$, so $n=5$ with $x=100^{1/5}=2.51$: $t_P=5\cdot2.51\cdot10$ ps $\approx126$ ps; $n=4$ with $x=3.16$ gives $\approx126$ ps too. About 8× faster. (My arithmetic; Sedra's solution is not in the PDF.)

> [!tip] Remark
> Sedra stops at the tapered chain. The general method for paths of mixed gates (logical effort $g$, electrical effort $h$, parasitic $p$, $D=NF^{1/N}+P$, optimum stage effort ≈ 4) is owned by [[Logical Effort]] in the Digital Design notes. Sedra's $x=e$ is its $p_{inv}=0$ special case.

## Level 4: Power

### Dynamic power

```tikz title="Each full cycle draws C·V_DD² from the supply: half is lost in the pull-up while charging, the other half (the stored energy) in the pull-down while discharging. After Sedra Fig. 17.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,2.4) node[vcc]{$V_{DD}$} to[R,l=$R_{on,PU}$] (0,0.8) -- (0,0.4) node[circ]{} to[C,l=$C$] (0,-1.2) node[ground]{};
  \draw[->,thick] (-0.6,1.8) -- (-0.6,0.6) node[midway,left]{$i_D$};
  \node[font=\scriptsize,align=center] at (0,-2.2) {charge: supply gives $CV_{DD}^2$\\ $\tfrac12CV_{DD}^2$ heats $R_{on,PU}$, $\tfrac12CV_{DD}^2$ stored};
  \begin{scope}[xshift=5.5cm]
    \draw (0,0.4) node[circ]{} to[C,l=$C$] (0,-1.2) node[ground]{};
    \draw (0,0.4) -- (1.6,0.4) to[R,l=$R_{on,PD}$] (1.6,-1.2) node[ground]{};
    \draw[->,thick] (0.5,0.75) -- (1.3,0.75);
    \node[font=\scriptsize,align=center] at (0.8,-2.2) {discharge: stored $\tfrac12CV_{DD}^2$\\ heats $R_{on,PD}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{E_{cycle}=CV_{DD}^2,\qquad P_{dyn}=f\,C\,V_{DD}^2}
$$

Independent of $R_{on}$ and of the circuit details. Levers: smaller $C$, lower $V_{DD}$ (quadratic, the reason supplies fell from 5 V at 0.5 µm to 1.2 V at 0.13 µm and 0.9 V at 28 nm), and fewer transitions. **Clock gating** removes transitions in idle blocks without lowering the chip clock.

> [!note]- Derivation: why half the energy is always lost
> Charging: the supply delivers $Q=CV_{DD}$ at voltage $V_{DD}$, so $E_{DD}=\int V_{DD}i_D\,dt=V_{DD}Q=CV_{DD}^2$. The capacitor ends with $\frac12CV_{DD}^2$, so $\frac12CV_{DD}^2$ was dissipated in the pull-up resistance, whatever its value. Discharging dumps the stored $\frac12CV_{DD}^2$ into the pull-down. Total $CV_{DD}^2$ per cycle (Sedra Eqs. 17.34–17.39).

### Short-circuit power

While $V_{tn}<v_I<V_{DD}-|V_{tp}|$ both devices conduct. For a matched inverter the current peaks at $V_M=V_{DD}/2$:

$$
\boxed{I_{peak}=\tfrac12\mu_nC_{ox}\left(\frac WL\right)_n\left(\frac{V_{DD}}2-V_{tn}\right)^2}
$$

The energy grows with the input transition time (slower edge, wider pulse). Usually smaller than $P_{dyn}$. Sharp edges keep it small, which is one more reason to size buffer chains properly.

### Static (leakage) power

Static CMOS has zero static power only in the square-law world. Subthreshold conduction and junction leakage make static power a growing share of the total in nanometer nodes, and it is strongly temperature-dependent (through $V_T=kT/q$).

> [!tip] Remark
> The subthreshold current is $I_D\propto e^{V_{GS}/(\xi V_T)}$ of [[MosFETs#Subthreshold Conduction]]: lowering $V_t$ by one subthreshold slope (≥ 60 mV) multiplies off-current by 10. That is the speed-vs-leakage trade behind multi-$V_t$ libraries ([[#Level 10 Scaling and Nanometer Effects|Level 10]]).

### Power-delay and energy-delay products

$$
\boxed{PDP=P_Dt_P=\tfrac12CV_{DD}^2\ \ (f=1/2t_P),\qquad EDP=\tfrac12CV_{DD}^2\,t_P}
$$

- $PDP$ is the energy per output transition. It is good for comparing logic families, useless for optimizing one circuit: it is minimized by $V_{DD}\to$ as low as works, ignoring that $t_P$ explodes.
- $EDP$ includes the delay and so has a true optimum in $V_{DD}$.

## Level 5: Pass-Transistor and Transmission-Gate Logic

Switches in the signal path: series switches AND the controls, parallel switches OR them (Sedra Fig. 18.1). Fewer transistors than static CMOS for some functions (multiplexers, XOR).

```tikz title="NMOS pass transistor (left): passes a good 0 but only V_DD - V_t for a 1; a weak PMOS feedback device restores the level (middle). The CMOS transmission gate (right) passes both rails. After Sedra Figs. 18.3, 18.5, 18.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee}
  % NMOS pass transistor
  \node[nmos,rotate=-90](Q) at (1.0,0){};
  \draw (0,0) node[left]{$v_I$} -- (Q.S);
  \draw (Q.G) -- ++(0,0.3) node[above]{$V_{DD}$};
  \draw (Q.D) -- (2.4,0) node[circ]{} to[C,l=$C$] (2.4,-1.5) node[ground]{};
  \node[right,align=left,font=\scriptsize] at (2.5,-2.3) {$V_{OH}=V_{DD}-V_t$\\($V_t$ raised by body effect)};
  \draw (2.4,0) -- (3.0,0) node[right]{$v_O$};
  % level restorer
  \begin{scope}[xshift=5.6cm]
    \node[nmos,rotate=-90](Q1) at (1.0,0){};
    \draw (0,0) node[left]{$A$} -- (Q1.S);
    \draw (Q1.G) -- ++(0,0.3) node[above]{$B$};
    \draw (Q1.D) -- (2.4,0) node[circ](x){};
    \node[not port,scale=0.7](inv) at (3.6,0){};
    \draw (x) -- (inv.in);
    \draw (inv.out) -- (4.6,0) node[circ](y){} -- (5.1,0) node[right]{$v_{O2}$};
    \node[pmos,xscale=-1](QR) at (2.4,1.5){};
    \draw (QR.D) -- (x);
    \draw (QR.S) -- ++(0,0.2) node[above]{$V_{DD}$};
    \draw (QR.G) -| (y);
    \node[font=\scriptsize,anchor=west] at (2.0,-0.7) {$Q_R$: weak PMOS, $k_r\approx k_n/3$ to $k_n/5$};
    \node[font=\scriptsize] at (1.8,1.5) {$Q_R$};
  \end{scope}
  % transmission gate
  \begin{scope}[xshift=12.6cm]
    \node[nmos,rotate=-90](TN) at (1.0,0.8){};
    \node[pmos,rotate=90](TP) at (1.0,-0.8){};
    \draw (0,0) node[left]{$X$} -- (0.2,0);
    \draw (0.2,0.8) -- (0.2,-0.8);
    \draw (0.2,0.8) -- (TN.S); \draw (0.2,-0.8) -- (TP.S);
    \draw (TN.D) -- (1.8,0.8) -- (1.8,-0.8) -- (TP.D);
    \draw (1.8,0) -- (2.3,0) node[right]{$Y$};
    \draw (TN.G) -- ++(0,0.25) node[above]{$C$};
    \draw (TP.G) -- ++(0,-0.25) node[below]{$\overline{C}$};
    \node[font=\scriptsize] at (1.0,-2.8) {good 0 and good 1};
  \end{scope}
\end{circuitikz}
\end{document}
```

### NMOS pass transistor

- Passing a 0: source is at 0, no body effect, discharges fully. **Good 0.**
- Passing a 1: the output is the source; the device cuts off at $v_O=V_{DD}-V_t$, and $V_t$ grows with $v_O$ through the body effect (1.5 to 2× $V_{t0}$ possible). **Poor 1**, and slow because the overdrive shrinks as it charges.
- A poor 1 into a CMOS inverter leaves its PMOS partly on: static current.

$$
\boxed{V_{OH}=V_{DD}-V_t(V_{OH}),\qquad V_t=V_{t0}+\gamma\left(\sqrt{2\phi_f+V_{OH}}-\sqrt{2\phi_f}\right)}
$$

> [!tip] Remark
> This is the [[MosFETs#Body Effect|body effect]] with $V_{SB}=v_O$. With Sedra Ex. 18.1 values ($V_{DD}=1$ V, $V_{t0}=0.35$ V, $\gamma=0.25\ \text{V}^{1/2}$, $2\phi_f=1$ V) the fixed point is $V_{OH}\approx0.585$ V, $V_t\approx0.415$ V (my arithmetic).

**Level restorer** (Fig. 18.5): a weak PMOS $Q_R$ from $V_{DD}$ to the pass-gate output, gated by the following inverter's output. When the node is a degraded 1, the inverter output goes low, $Q_R$ turns on and pulls the node to $V_{DD}$. It is a positive-feedback loop, so $Q_R$ must stay weak ($k_r$ about a third to a fifth of $k_n$) or the pass device cannot pull the node down.

### CMOS transmission gate

NMOS in parallel with PMOS, complementary gates. The NMOS passes a good 0, the PMOS a good 1; each covers the other's weak end.

$$
\boxed{R_{TG}=R_{Neq}\parallel R_{Peq}\ \approx\ \text{nearly constant over }0\le v_O\le V_{DD}}
$$

As $v_O$ rises the NMOS resistance blows up toward cut-off while the PMOS resistance falls. In Sedra's 65 nm example ($W/L=2$ both) $R_{TG}$ goes from 3.9 kΩ at $v_O=0$ to 7.1 kΩ at 0.5 V (Fig. 18.8). Cost: two devices, two control phases, more capacitance.

> [!tip] Remark
> The same flat-resistance switch is the analog sampling switch: its signal-dependent $R_{on}$, charge injection and bootstrapping are owned by [[Sampling Circuits]].

### Delay through a TG chain: Elmore

$$
\boxed{t_P=0.69\left[C_1R_1+C_2(R_1+R_2)+C_3(R_1+R_2+R_3)+\cdots\right]}
$$

Each capacitor is charged through all the resistance between it and the source. For inverter → TG → inverter: $t_P=0.69\left[(C_{out1}+C_{TG1})R_{P1}+(C_{in2}+C_{TG2})(R_{P1}+R_{TG})\right]$, with the 0.69 dropped for a ramp input. Delay grows **quadratically** with the number of series TGs, which is why long pass chains need buffers.

> [!tip] Remark
> Elmore's sum is the first moment of the impulse response, the same time-constant bookkeeping as [[Frequency Response#Zero-Value Time Constants|zero-value time constants]] applied to a ladder.

## Level 6: Dynamic Logic

Sedra uses **precharge-and-evaluate** in the memory periphery: in the NOR row decoder (Fig. 18.36) every word line is pulled to $V_{DD}$ by a PMOS while $\phi_P$ is low; then the address bits are applied and NMOS pull-downs discharge every line but the selected one. Bit lines are precharged the same way before every SRAM/DRAM read. The decoder burns no static power and needs only one PMOS per line instead of a full PUN.

```tikz title="Precharged NOR decoder row (one of 2^M). During precharge the PMOS pulls the word line high; during evaluate any NMOS whose input is high discharges it, so only the row whose inputs are all low stays high. After Sedra Fig. 18.36."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[pmos,anchor=D](P) at (0,0.6){};
  \draw (P.S) -- ++(0,0.2) node[vcc]{$V_{DD}$};
  \node[left] at (P.G) {$\phi_P$};
  \draw (0,0.6) node[circ]{};
  \draw (0,0.6) -- (6.2,0.6) node[right]{$W_0$ (word line)};
  \foreach \x/\l in {1.5/A_0,3.0/A_1,4.5/A_2} {
    \draw (\x,0.6) node[circ]{} -- (\x,0.3) node[nmos,anchor=D](n){};
    \draw (n.S) node[ground]{};
    \node[left] at (n.G) {$\l$};
  }
  \node[font=\scriptsize,align=left,anchor=west] at (5.3,-0.5) {$W_0=\overline{A_0+A_1+A_2}$\\ stays high only for 000};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{precharge } (\phi_P=0):\ \text{node}\to V_{DD};\qquad \text{evaluate}:\ \text{node}=\overline{\text{PDN}}\ \text{(can only fall)}}
$$

> [!warning] Unverified
> Sedra's general dynamic-logic and domino sections are an online appendix that is not in `Sedra.pdf`, so the following is standard material not checked against a vault source. A dynamic gate is a clocked precharge PMOS, an NMOS PDN, and a clocked evaluate NMOS at its foot. Its output can only fall during evaluate, so its inputs must not fall during evaluate (they must be monotonically rising), otherwise a node discharged by a glitch cannot recover. **Domino** logic appends a static inverter to each dynamic gate so every output starts low and can only rise, making cascades safe, at the cost of being able to build only non-inverting functions. Charge sharing between the output node and internal PDN nodes, and leakage of the floating precharged node (a keeper PMOS fixes it, like the [[#NMOS pass transistor|level restorer]]), are the main hazards.

## Level 7: Latches and Flip-Flops

### The bistable latch

```tikz title="Two cross-coupled inverters (left). Break the loop and plot v_Z vs v_W: the cascaded-inverter VTC crosses the unity line at A and C (stable, loop gain ~0) and at B (unstable, loop gain >> 1). After Sedra Figs. 18.11, 18.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \ctikzset{logic ports=ieee}
  \draw (0,1) node[not port,scale=0.8](g1){};
  \draw (0,-0.4) node[not port,scale=0.8,xscale=-1](g2){};
  \draw (g1.out) -- ++(0.4,0) node[circ](X){} node[above]{$X$} |- (g2.in);
  \draw (g2.out) -- ++(-0.4,0) node[circ](Z){} node[below]{$Z{=}W$} |- (g1.in);
  \node at (0,1.6) {$G_1$};
  \node at (0,-1.0) {$G_2$};
  \begin{scope}[xshift=3.2cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (4.2,0) node[right]{$v_W$};
    \draw[->] (0,0) -- (0,4.2) node[above]{$v_Z$};
    \draw[thick] (0,0.15) -- (1.4,0.15) .. controls (1.85,0.15) and (1.95,1.0) .. (2,2) .. controls (2.05,3.0) and (2.15,3.85) .. (2.6,3.85) -- (4,3.85);
    \draw[dashed] (0,0) -- (4,4);
    \fill (0.15,0.15) circle (2pt) node[above left]{$A$};
    \fill (2,2) circle (2pt) node[right]{$\ B$};
    \fill (3.85,3.85) circle (2pt) node[below right]{$C$};
    \node[font=\scriptsize,anchor=west] at (2.2,1.2) {slope $\gg1$: unstable};
    \node[font=\scriptsize,anchor=west] at (3.0,2.6) {$v_Z=v_W$ (loop closed)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Closing the loop forces $v_Z=v_W$: three intersections.
- **A and C** are stable: the loop gain there is ≈ 0, so a disturbance dies.
- **B** is unstable: the loop gain is ≫ 1, so any noise regenerates toward A or C. Equivalently, a loop with −180° shift and gain > 1: zero phase margin.
- One bit of static storage, held as long as the supply is on.

> [!tip] Remark
> Starting near B and racing to a rail is **regeneration**. With each inverter linearized at its midpoint ($G_m=g_{mn}+g_{mp}$) the departure from B grows as $e^{tG_m/C}$: the same law as the [[Comparators#Positive Feedback Regeneration|comparator latch]], the [[#Sense amplifier|sense amplifier]] and the time a metastable flip-flop takes to resolve. **Metastability** (an input arriving so close to the clock edge that the latch starts near B) is owned by [[Comparators#Level 4 Metastability]]; its MTBF and synchronizers at the RTL level are in the Digital Design notes ([[Synchronizer Chain]]).

### SR flip-flop

Two cross-coupled NOR gates; $S$ and $R$ start the regeneration and the loop finishes it. $S=R=1$ is disallowed (both outputs low, and the final state is unpredictable if both return to 0 together). Cross-coupled NANDs give active-low set/reset.

**Clocked CMOS SR (Sedra Fig. 18.14):** a CMOS latch with NMOS-only set/reset stacks ($S\cdot\phi$ pulls $\overline Q$ down, $R\cdot\phi$ pulls $Q$ down). No static power. It switches only if:
1. the stack pulls the node below the opposite inverter's $V_M$, which sets a **minimum $W/L$** for the set/reset devices against the latch's PMOS (a ratioed fight), and
2. the set pulse lasts long enough for regeneration to take over: about the time to pull the node from $V_{DD}$ to $V_{DD}/2$ plus the time for the other side to rise to $V_{DD}/2$.

The pass-transistor version (Fig. 18.17), where two access devices connect the latch nodes to $S$/$R$ lines, is the 6T [[#6T SRAM cell|SRAM cell]].

### D latch and master-slave D flip-flop

```tikz title="Master-slave D flip-flop: two TG latches on non-overlapping phases phi1, phi2. phi1 high: master samples D, slave holds. phi2 high: master holds, slave copies it to Q. Output changes at the rising edge of phi2. After Sedra Fig. 18.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \ctikzset{logic ports=ieee}
  \tikzset{tg/.style={draw,minimum width=0.6cm,minimum height=0.5cm,font=\scriptsize}}
  \draw (0,0) node[left]{$D$} -- (0.4,0) node[tg,anchor=west](s1){$\phi_1$};
  \draw (s1.east) -- (1.6,0) node[circ](m1){} -- (1.9,0) node[not port,anchor=in,scale=0.7](G1){};
  \draw (G1.out) -- (3.6,0) node[circ](m2){} -- (3.9,0) node[not port,anchor=in,scale=0.7](G2){};
  \draw (G2.out) -- ++(0.3,0) node[circ](m3){};
  \draw (m3) -- ++(0,-1.0) -- (3.3,-1.0) node[tg](f1){$\phi_2$};
  \draw (f1.west) -- (1.6,-1.0) -- (m1);
  \node[font=\scriptsize] at (2.9,0.9) {master};
  \draw (m3) -- (5.6,0) node[tg,anchor=west](s2){$\phi_2$};
  \draw (s2.east) -- (6.8,0) node[circ](n1){} -- (7.1,0) node[not port,anchor=in,scale=0.7](G3){};
  \draw (G3.out) -- (8.8,0) node[circ](n2){} -- (9.1,0) node[not port,anchor=in,scale=0.7](G4){};
  \draw (G4.out) -- ++(0.3,0) node[circ](n3){} -- ++(0.5,0) node[right]{$Q$};
  \draw (n3) -- ++(0,-1.0) -- (8.5,-1.0) node[tg](f2){$\phi_1$};
  \draw (f2.west) -- (6.8,-1.0) -- (n1);
  \node[font=\scriptsize] at (8.1,0.9) {slave};
  \begin{scope}[yshift=-2.4cm]
    \draw (0,0) node[left,font=\scriptsize]{$\phi_1$} -- (0.5,0) -- (0.5,0.5) -- (2.3,0.5) -- (2.3,0) -- (4.7,0) -- (4.7,0.5) -- (6.5,0.5) -- (6.5,0) -- (9,0);
    \draw (0,-1) node[left,font=\scriptsize]{$\phi_2$} -- (2.7,-1) -- (2.7,-0.5) -- (4.3,-0.5) -- (4.3,-1) -- (6.9,-1) -- (6.9,-0.5) -- (8.5,-0.5) -- (8.5,-1) -- (9,-1);
    \draw[<->] (2.3,-0.25) -- (2.7,-0.25);
    \node[font=\scriptsize,anchor=west] at (2.75,0.25) {non-overlap};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **D latch** (Fig. 18.19): when $\phi$ is high the input TG is on and the feedback TG off; the node capacitances charge to $D$, $\overline D$. When $\phi$ falls, the input is isolated and the loop closes, locking the value. It is **transparent** while $\phi$ is high: $Q$ follows $D$. Static (feedback) plus dynamic (charge held on node capacitance during the handover).
- **Master-slave** (Fig. 18.20): two such latches on opposite phases. Never both transparent, so the flip-flop is **edge-triggered**: $Q$ takes the value $D$ had at the end of $\phi_1$, and holds it for a full period.
- The phases must be **non-overlapping**; during the gap both loops are open and the state lives on node capacitance, so the gap must be short (one or two gate delays) or leakage erodes it.

> [!tip] Remark
> Latches, flip-flops and their logic-level variants (SR, JK, T, enable, clock gating) are covered as blocks in [[Transparent D Latch]], [[Master-Slave D Flip-Flop]] and [[Dual-Phase Latches]]. The single-phase high-speed versions are owned elsewhere: TSPC by [[High-Speed Circuit Techniques#TSPC flip-flop]], CML latches by [[High-Speed Circuit Techniques#Latch]], and the StrongARM + SR-latch flip-flop by [[Comparators#The SR Latch After It]].

### Flip-flop timing at the circuit level

| Parameter | Meaning | Circuit origin (master-slave, my reading of Fig. 18.20) |
|---|---|---|
| Setup $t_{su}$ | $D$ must be stable this long *before* the capturing edge | $D$ must propagate through the input TG and the master's inverter so the master holds the right value when its loop closes |
| Hold $t_h$ | $D$ must stay stable this long *after* the edge | The input TG is not fully off until its clock has finished switching; a fast $D$ change can still leak in |
| Clock-to-Q $t_{cq}$ | Edge to $Q$ change | Slave TG plus two inverters |

$$
\boxed{t_{FF}=t_{su}+t_{cq}\ \ \text{(cycle time taken by the flip-flop)},\qquad T_{clk}\ge t_{cq}+t_{logic}+t_{su}}
$$

- Nikolić et al.: the cycle time taken by a flip-flop is the **sum of setup and clock-to-Q**; the true measure is the minimum data-to-output (D-Q) delay. As data approaches the setup or hold edge, clock-to-Q **grows** until capture fails (their Fig. 12): this is the onset of metastability.
- Their improved sense-amplifier flip-flop (0.18 µm) has a sampling window under 100 ps; hold time depends on the input slope; the clock network takes 20–45 % of a high-performance chip's power.
- The full path inequalities with skew and jitter, and the hold check, are owned by [[Setup and Hold Constraints]].

## Level 8: Memory Cells

### Array organization

$2^M$ rows × $2^N$ columns. A **row decoder** raises one **word line**; every cell in that row drives its **bit line(s)** with a small signal (0.1 to 0.2 V, or 20–500 mV depending on cell); a **sense amplifier** per column restores it to a full swing; the **column decoder** (a multiplexer) picks one column for the I/O. The cell is made as small as possible because it is replicated millions of times: that is why the signal is small and the sense amplifier is essential.

### 6T SRAM cell

```tikz title="6T SRAM cell: two cross-coupled inverters (Q1-Q2, Q3-Q4) and two NMOS access devices Q5, Q6 to the bit lines B and B-bar, gated by the word line W. After Sedra Fig. 18.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % left inverter (gates face right)
  \node[pmos,xscale=-1](Q2) at (2,3){};
  \node[nmos,xscale=-1](Q1) at (2,-0.6){};
  \draw (Q2.D) -- (Q1.D);
  \draw (Q2.G) -- (Q1.G);
  \draw (Q1.S) node[ground]{};
  % right inverter (gates face left)
  \node[pmos](Q4) at (5.2,3){};
  \node[nmos](Q3) at (5.2,-0.6){};
  \draw (Q4.D) -- (Q3.D);
  \draw (Q4.G) -- (Q3.G);
  \draw (Q3.S) node[ground]{};
  \draw (Q2.S) -- (2,3.9) -- (5.2,3.9) -- (Q4.S);
  \node[above] at (3.6,3.9) {$V_{DD}$};
  % cross coupling
  \draw (2,1.6) node[circ]{} -- (Q3.G |- 0,1.6) node[circ]{};
  \draw (5.2,0.8) node[circ]{} -- (Q1.G |- 0,0.8) node[circ]{};
  \node[font=\scriptsize,anchor=east] at (1.95,1.85) {$\overline Q$};
  \node[font=\scriptsize,anchor=west] at (5.25,1.05) {$Q$};
  % access devices
  \node[nmos,rotate=-90](Q5) at (0.5,1.6){};
  \draw (Q5.D) -- (2,1.6);
  \draw (Q5.S) -- (-0.8,1.6);
  \draw (5.2,0.8) -- (5.9,0.8) -- (5.9,1.6) -- (6.0,1.6);
  \node[nmos,rotate=-90](Q6) at (6.7,1.6){};
  \draw (Q6.D) -- (8.0,1.6);
  \draw[thick] (-0.8,4.8) -- (-0.8,-1.9) node[below]{$\overline B$};
  \draw[thick] (8.0,4.8) -- (8.0,-1.9) node[below]{$B$};
  \draw (Q5.G) -- (0.5,4.5) node[circ]{};
  \draw (Q6.G) -- (6.7,4.5) node[circ]{};
  \draw[thick] (-1.2,4.5) -- (8.4,4.5) node[right]{$W$};
  \node[font=\scriptsize] at (0.5,0.9) {$Q_5$};
  \node[font=\scriptsize] at (6.7,0.9) {$Q_6$};
  \node[font=\scriptsize] at (1.2,3.0) {$Q_2$}; \node[font=\scriptsize] at (1.2,-0.6) {$Q_1$};
  \node[font=\scriptsize] at (6.0,3.0) {$Q_4$}; \node[font=\scriptsize] at (6.0,-0.6) {$Q_3$};
\end{circuitikz}
\end{document}
```

**Read** (cell stores 1, $\overline Q=0$; bit lines precharged to $V_{DD}$): $Q_5$ pours current into node $\overline Q$ while $Q_1$ sinks it. $V_{\bar Q}$ settles where the two currents balance, and it must stay below $V_{tn}$ so $Q_3$ cannot start flipping the cell (**non-destructive read**). That caps the access device against the pull-down:

$$
\boxed{\frac{V_{\bar Q}}{V_{DD}-V_{tn}}=1-\frac{1}{\sqrt{1+\frac{(W/L)_a}{(W/L)_n}}},\qquad \frac{(W/L)_a}{(W/L)_n}\le\frac{1}{\left(1-\frac{V_{tn}}{V_{DD}-V_{tn}}\right)^2}-1}
$$

Meanwhile $Q_5$'s current slowly discharges the big bit-line capacitance $C_{\bar B}$ (often > 100 fF):

$$
\boxed{\Delta t=\frac{C_{\bar B}\,\Delta V}{I_5}}
$$

A bigger access device reads faster but runs into the read bound and costs area.

**Write** (stores 1, write 0: $B\to0$, $\overline B\to V_{DD}$): the $\overline Q$ side cannot do it (the read constraint was designed to stop exactly that), so the write must pull **$Q$ below $V_{tn}$** through $Q_6$ against the PMOS $Q_4$. That caps the PMOS against the access device:

$$
\boxed{\frac{(W/L)_p}{(W/L)_a}\le\frac{\mu_n}{\mu_p}\left[1-\left(1-\frac{V_{tn}}{V_{DD}-V_{tn}}\right)^2\right]}
$$

Ranking that falls out: **pull-down > access > pull-up** in strength. Writes are fast (bit lines are driven hard, and the delay is about twice an inverter delay around the loop); reads are slow (a weak cell discharges a big bit line).

> [!note]- Derivation and numbers: read and write bounds, Sedra Exs. 18.6–18.8
> **Read:** $Q_5$ saturated, $I_5=\frac12k_n'(W/L)_5(V_{DD}-V_{\bar Q}-V_{tn})^2$; $Q_1$ triode, $I_1=k_n'(W/L)_1[(V_{DD}-V_{tn})V_{\bar Q}-\frac12V_{\bar Q}^2]$. Equate and solve the quadratic: Eq. (18.21), a universal curve (no process parameters except $V_{DD}$, $V_{tn}$). Setting $V_{\bar Q}=V_{tn}$ gives Eq. (18.23).
>
> **Write:** $Q_4$ saturated with $V_{SG}=V_{DD}$, $I_4=\frac12\mu_pC_{ox}(W/L)_4(V_{DD}-|V_{tp}|)^2$; $Q_6$ triode, $I_6=\mu_nC_{ox}(W/L)_6[(V_{DD}-V_{tn})V_Q-\frac12V_Q^2]$. With $|V_{tp}|=V_{tn}$: $\frac{V_Q}{V_{DD}-V_{tn}}=1-\sqrt{1-\frac{\mu_p}{\mu_n}\frac{(W/L)_4}{(W/L)_6}}$; set $V_Q=V_{tn}$ for Eq. (18.29).
>
> **65 nm numbers** ($V_{DD}=1$ V, $V_t=0.35$ V, $(W/L)_n=2$, $\mu_nC_{ox}=450$ µA/V², $\mu_n\approx3\mu_p$):
> - Read bound: $(W/L)_a\le2\left[1/(1-0.538)^2-1\right]=7.4$ (Sedra).
> - Write bound with $(W/L)_a=7.4$: $(W/L)_p\le3\,[1-0.213]\cdot7.4\approx17.5$ (my arithmetic).
> - Read delay, $C_{\bar B}=2$ pF, $\Delta V=0.15$ V: with $(W/L)_a=7.4$, $V_{\bar Q}=0.35$ V, $I_5\approx150$ µA, $\Delta t\approx2.0$ ns; with $(W/L)_a=2$, $V_{\bar Q}\approx0.19$ V, $I_5\approx95$ µA, $\Delta t\approx3.2$ ns (my arithmetic).

### 1T DRAM cell

```tikz title="One-transistor DRAM cell (left) and the charge sharing that reads it (right): the cell capacitor C_S joins the bit line C_B, precharged to V_DD/2. After Sedra Figs. 18.28, 18.29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \draw[thick] (-0.5,2) -- (3.3,2) node[right]{word line};
  \draw[thick] (2.5,2.5) -- (2.5,-1.6) node[below]{bit line};
  \node[nmos,rotate=-90](Q) at (1.3,0.8){};
  \draw (Q.G) -- (1.3,2) node[circ]{};
  \draw (Q.D) -- (2.5,0.8) node[circ]{};
  \draw (Q.S) -- (0,0.8) to[C,l_=$C_S$] (0,-0.8) node[ground]{};
  \begin{scope}[xshift=6cm]
    \draw (0,0.8) to[C,l_=$C_S$] (0,-0.8) node[ground]{};
    \draw (0,0.8) to[nos] (2,0.8);
    \draw (2,0.8) to[C,l=$C_B$] (2,-0.8) node[ground]{};
    \node[font=\scriptsize,above] at (0,0.85) {$V_{CS}$};
    \node[font=\scriptsize,above] at (2.3,0.85) {$V_{DD}/2$};
    \node[font=\scriptsize,align=center] at (1,-1.9) {after: both at $V_{DD}/2+\Delta V$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta V=\frac{C_S}{C_B+C_S}\left(V_{CS}-\frac{V_{DD}}2\right)\approx\pm\frac{C_S}{C_B}\frac{V_{DD}}2}
$$

- One NMOS + one capacitor: about 4× denser than SRAM.
- $C_S$ is 20 to 30 fF; $C_B$ about 10× larger. For $C_B=10C_S$, $V_{DD}=1.8$ V: $\Delta V\approx\pm90$ mV, and that is the best case.
- **Destructive read:** charge sharing destroys the stored level, so the sense amplifier's full-swing result is written back. Every access to a row refreshes the whole row.
- **Leakage** drains $C_S$: refresh every 10 to 100 ms, in bursts, costing under 2 % of availability.
- **Word-line boost** to $V_{DD}+V_t$ so the access NMOS writes a full $V_{DD}$ (the [[#NMOS pass transistor|poor-1]] problem).

### Sense amplifier

A cross-coupled CMOS latch whose inputs and outputs are the same nodes ($B$, $\overline B$), switched to the rails by $\phi_S$ only when sensing (one per column, so it must burn no power otherwise). Sequence: (1) $\phi_P$ precharges and **equalizes** $B$, $\overline B$ to $V_{DD}/2$ (any residual difference is read as signal); (2) the word line rises and the cell develops $\Delta V$; (3) $\phi_S$ fires and the latch, starting at its unstable midpoint, regenerates:

$$
\boxed{v_B=\frac{V_{DD}}2\pm\Delta V\,e^{(G_m/C_B)t},\qquad G_m=g_{mn}+g_{mp}\ \text{at}\ V_{DD}/2}
$$

> [!note]- Example: Sedra Ex. 18.3 (0.18 µm)
> $\Delta V(1)=0.1$ V, $(W/L)_n=0.54/0.18$, $(W/L)_p=2.16/0.18$, $V_{DD}=1.8$ V, $V_t=0.5$ V, $\mu_nC_{ox}=4\mu_pC_{ox}=300$ µA/V², $C_B=1$ pF. Find the time to reach $0.9V_{DD}$.
> $g_{mn}=300\,\mu\cdot3\cdot0.4=0.36$ mS, $g_{mp}=75\,\mu\cdot12\cdot0.4=0.36$ mS, $G_m=0.72$ mS, $\tau=C_B/G_m=1.39$ ns. Need $0.1\,e^{t/\tau}=1.62-0.9=0.72$, so $t=\tau\ln7.2\approx2.7$ ns (my arithmetic; the small-signal law is only accurate near $V_{DD}/2$).

> [!tip] Remark
> Same circuit and same $\tau=C/G_m$ as a [[Comparators#Positive Feedback Regeneration|regenerative comparator]]. Equalization is the comparator's [[Comparators#Reset Clears Memory|reset]]; the DRAM "dummy cell" at mid-level is its reference input.

### Decoders and flash

- **Row decoder:** each word line is a NOR of the address bits or their complements; built as a precharged NOR array ([[#Level 6 Dynamic Logic|Level 6]]).
- **Column decoder:** a pass-transistor multiplexer driven by a NOR decoder ($2^N$ pass devices), or a **tree decoder** of pass transistors (fewer devices, but $N$ in series, so slower per [[#Delay through a TG chain Elmore|Elmore]]). TGs instead of NMOS pass devices need complementary decoder outputs. Logic-level versions: [[Binary Decoder]], [[Multiplexer Tree]].
- **Flash:** a floating-gate NMOS. Hot electrons injected through the oxide (large $V_{DS}$ and select-gate voltage) charge the floating gate, which raises $V_t$; the charging is self-limiting. Read with a select-gate voltage between the two thresholds. Non-volatile.

> [!warning] Unverified
> ROM is in Sedra's online appendix "Memory Architectures and Read-Only Memory", which is not in the PDF; it is not covered here.

## Level 9: LFSR and PRBS Generators

SerDes test and built-in self-test need a pseudo-random bit sequence (PRBS) at the full line rate: every transmitter in the vault's sources carries an on-chip PRBS generator and every receiver a checker (Toifl 2006, Kossel 2008, Lee 2008, Lee 2015, Won 2024).

```tikz title="PRBS7 generator: a 7-stage shift register whose input is the XOR of stages 6 and 7 (polynomial x^7 + x^6 + 1). One flip-flop delay plus one XOR is the whole critical loop. After the Fibonacci LFSR structure."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \ctikzset{logic ports=ieee}
  \foreach \i in {1,...,7} {
    \draw ({1.4*\i},0) rectangle ({1.4*\i+0.9},0.9);
    \node[font=\scriptsize] at ({1.4*\i+0.45},0.45) {D\,$\i$};
  }
  \foreach \i in {1,...,6} {
    \draw[->] ({1.4*\i+0.9},0.45) -- ({1.4*\i+1.4},0.45);
  }
  \draw ({1.4*7+0.9},0.45) -- (11.3,0.45) node[circ](o){} -- (12.0,0.45) node[right]{PRBS out};
  \draw (6.4,2.2) node[xor port,rotate=180,scale=0.8](x){};
  \draw (o) |- (x.in 2);
  \draw ({1.4*6+0.9+0.25},0.45) node[circ]{} -- ({1.4*6+0.9+0.25},1.6) -- (8.3,1.6) |- (x.in 1);
  \draw (x.out) -- (0.8,2.2) -- (0.8,0.45) -- (1.4,0.45);
  \draw[->] (0.8,0.45) -- (1.4,0.45);
  \node[font=\scriptsize] at (6.4,2.9) {$x^7+x^6+1$};
  \node[font=\scriptsize] at (6.0,-0.6) {common clock to all stages (not drawn)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{period}=2^N-1\ \text{bits (primitive polynomial)},\qquad \text{longest run}=N\ \text{ones},\qquad T_{clk}\ge t_{cq}+t_{XOR}+t_{su}}
$$

| Pattern | Polynomial | Period | Where in the sources |
|---|---|---|---|
| PRBS7 | $x^7+x^6+1$ | 127 | Toifl 22 Gb/s RX ($2^7-1$), Kossel T-coil TX (PRBS-7), Lee 2015 (quarter-rate $2^7-1$), MZM table |
| PRBS13 / QPRBS13 | $x^{13}+x^{12}+x^2+x+1$ | 8191 | Won 2024 (4-way parallel at 7 GHz); Zhang DesignCon (PAM4 test pattern) |
| PRBS23 | $x^{23}+x^{18}+1$ | $2^{23}-1$ | MZM transmitter table |
| PRBS31 | $x^{31}+x^{28}+1$ | $2^{31}-1$ | Lee 2008 (20 Gb/s, $2^{31}-1$), MZM table |

> [!warning] Unverified
> The tap polynomials are the standard ITU-T O.150 (PRBS7/23/31) and IEEE 802.3 (PRBS13) ones from memory; the vault sources name the patterns and lengths but not the taps. Check against the standard before using them in RTL.

- **Longer is more stressful:** a PRBS$N$ contains every $N$-bit word except all-zeros, so its longest run of identical bits is $N$. PRBS31 stresses low-frequency wander and CDR run-length tolerance far more than PRBS7.
- **QPRBS13** (Zhang): an 8191-symbol PAM4 pattern built from a PRBS13 bit stream; two cycles are concatenated, the second inverted, to make a 16 382-bit sequence.
- **Speed:** the loop is one flip-flop plus one XOR, so a CMOS LFSR runs at most at a few FO4 per bit. At line rate it is built **in parallel** at a sub-rate and serialized: Lee 2015 uses a quarter-rate PRBS7 into a 4:1 MUX; Won 2024 a 4-way parallel QPRBS13 at 7 GHz feeding the transmitter's MUX.
- **Checker:** load the received bits into the same shift register and compare each new bit with the XOR prediction; after $N$ correct bits it is synchronized, and every later mismatch is a bit error (standard construction).

> [!note]- Why: a PRBS can be generated in $M$ parallel lanes and multiplexed
> Over GF(2), squaring is linear: $p(x)^2=p(x^2)$. So taking every second bit of an m-sequence gives the same m-sequence (shifted). Repeating, decimating by $M=2^k$ also gives the same sequence. Hence $M$ lanes, each running the same LFSR at $f_b/M$ with the correct starting phases, multiplexed $M{:}1$ in order, reproduce the full-rate PRBS bit for bit. Equivalently, one can run one LFSR that advances $M$ steps per clock: its next-state matrix is $A^M$ (a fixed XOR network), at the cost of a deeper XOR tree in the loop. The polynomial theory (primitivity, tap sets, Galois form) is owned by [[Fibonacci LFSR]] and [[Galois LFSR]].

> [!tip] Remark
> The MUX tree that serializes the lanes and its FO4 limits are in [[High-Speed Circuit Techniques#MUX and XOR]] and [[Transmitters]]; the flip-flops in the generator are TSPC or static CMOS when the sub-rate is low enough ([[High-Speed Circuit Techniques#CML vs CMOS]]).

## Level 10: Scaling and Nanometer Effects

### Constant-field scaling

Scale $W$, $L$, $t_{ox}$, $V_{DD}$ and $V_t$ all by $1/S$ (Sedra Table 17.1):

| Quantity | Relation | Scales as |
|---|---|---|
| Area per device | $WL$ | $1/S^2$ |
| $C_{ox}$, $k'$ | $\varepsilon_{ox}/t_{ox}$, $\mu C_{ox}$ | $S$ |
| Gate capacitance | $WLC_{ox}$ | $1/S$ |
| Intrinsic $t_P$ | $\alpha C/(k'V_{DD})$ | $1/S$ |
| Energy per switching cycle | $CV_{DD}^2$ | $1/S^3$ |
| $P_{dyn}$ per gate (at $S\times f$) | $fCV_{DD}^2$ | $1/S^2$ |
| Power density | $P_{dyn}/\text{area}$ | $1$ |

$$
\boxed{t_P\propto\frac1S,\qquad P_{dyn}\propto\frac1{S^2},\qquad \frac{P}{\text{area}}=\text{const}}
$$

> [!tip] Remark
> The device-side scaling (fields, $f_T$, why $g_mr_o$ does not improve) is owned by [[MosFETs#Scaling Theory]]. This table is its digital consequence: gates get faster and cheaper per operation, but power density does not fall, and the wire delay in $t_P$ does not scale with it.

### Where real nodes break the table

| Effect | Consequence for digital | Designer's response |
|---|---|---|
| **Velocity saturation** ([[MosFETs#Velocity Saturation]]) | Less on-current than the square law; average-current delay estimates are optimistic | Use measured/simulated $R_{eff}$ ([[#Equivalent-resistance method|resistance method]]) |
| **Subthreshold leakage** | Static power, strongly temperature-dependent; leaks dynamic storage nodes | Multi-$V_t$ (low-$V_t$ on critical paths, high-$V_t$ elsewhere); **power gating** with high-$V_t$ switches; SOI **body biasing** |
| **PVT variation** | $V_t$, $\mu$ vary with temperature; supply ±10 %; $V_t$ varies device-to-device, die-to-die, wafer-to-wafer | Simulate all corners and temperatures |
| **Interconnect** | $IR$ drop on $V_{DD}$ lines; wire $RC$ delay comparable to a gate; crosstalk | Wider supply straps, repeaters, spacing |
| **FinFETs** (below 28 nm) | Better switches, but width comes in whole fins | Size by integer fin count |
| **3D integration** | Stacked dies with TSVs (logic on DRAM, imagers) | System-level partitioning |

> [!tip] Remark
> Fin quantization is $W=N_{fins}(W_F+2H_F)$ from [[MosFETs#Layout]]. Supply-line $IR$ drop and wire spacing rules are in [[Layout Fundamentals]] and [[Electromigration]].

### Ring oscillators measure $t_P$

$N$ (odd, ≥ 3) inverters in a loop oscillate at

$$
\boxed{f=\frac{1}{2Nt_P}}
$$

so measuring $f$ measures the gate delay (e.g. 5 stages, $t_P=100$ ps → 1 GHz). Because $t_P\propto1/V_{DD}$, tuning the supply makes a VCO. An even ring latches (the SRAM cell is $N=2$); a single inverter settles at $V_M$. The oscillator itself is owned by [[Oscillators#Level 1 Ring Oscillators]]. A one-shot (XOR of a signal and its delayed copy, delay $=Nt_P$ with $N$ even) makes a pulse of width $Nt_P$ on every input edge, used to turn a latch into a pulsed flip-flop; the high-speed 1-UI version is in [[High-Speed Circuit Techniques#Programmable-reset TSPC and 1-UI pulse generators]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $W_p/W_n$ toward $\mu_n/\mu_p$ | Symmetric VTC ($V_M=V_{DD}/2$), equal $t_{PLH}$, $t_{PHL}$ | PMOS area and capacitance; total $t_P$ may not improve |
| $W_p=W_n$ | Minimum area and input cap | $V_M$ shifts low (weakly), $NM_L$ drops a little, slow rise |
| ↑ scale $S$ of a gate | External-load part of $t_P$ ($\propto1/S$) | Area, input cap seen by the previous stage, power; self-loading floor unchanged |
| Tapered buffer, $x\approx e$ to 4 | Delay into big $C_L$ (logarithmic in $C_L/C$) | Area and power of the chain |
| NAND instead of NOR | Area (stacks the fast NMOS) | — |
| Higher fan-in in one gate | Fewer stages | $t_P$ grows faster than linearly; keep fan-in ≤ 4 |
| ↓ $V_{DD}$ | $P\propto V_{DD}^2$, PDP | $t_P\propto1/V_{DD}$ (worse near $V_t$), noise margins |
| ↓ $V_t$ (low-$V_t$ device) | Drive current, speed | Exponential leakage |
| Pass gate / TG instead of static CMOS | Transistor count for MUX/XOR | NMOS: poor 1, static current downstream; TG: two phases; Elmore delay $\propto N^2$ |
| Dynamic (precharged) | No PUN, no static power (decoders) | Monotonic-input rule, charge sharing, leakage of the dynamic node |
| Larger SRAM access device | Read speed | Read stability (bound 18.23), cell area |
| More cells per DRAM bit line | Density | Smaller $\Delta V=\frac{C_S}{C_B}\frac{V_{DD}}2$ |
| Longer PRBS ($N$) | Stresses longer runs and low-frequency content | Longer test time to cover a period |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Series / parallel devices | $(W/L)_{ser}=1/\sum(W/L)_i^{-1}$; $(W/L)_{par}=\sum(W/L)_i$ |
| Noise margins | $NM_L=V_{IL}-V_{OL}$, $NM_H=V_{OH}-V_{IH}$ |
| Matched sizing | $W_p/W_n=\mu_n/\mu_p$ |
| Matched VTC | $V_{IH}=\frac18(5V_{DD}-2V_t)$, $V_{IL}=\frac18(3V_{DD}+2V_t)$, $NM=\frac18(3V_{DD}+2V_t)$ |
| Switching threshold | $V_M=\frac{r(V_{DD}-|V_{tp}|)+V_{tn}}{r+1}$, $r=\sqrt{k_p/k_n}$ |
| Output resistance | $r_{DSN}=1/[k_n'(W/L)_n(V_{DD}-V_{tn})]$, $r_{DSP}=1/[k_p'(W/L)_p(V_{DD}-|V_{tp}|)]$ |
| Propagation delay | $t_P=\frac12(t_{PHL}+t_{PLH})$ |
| Average-current delay | $t_{PHL}=\frac{\alpha_nC}{k_n'(W/L)_nV_{DD}}$, $\alpha_n=2/[\frac74-\frac{3V_{tn}}{V_{DD}}+(\frac{V_{tn}}{V_{DD}})^2]$ |
| Resistance delay | $t_{PHL}=0.69R_NC$, $R_N=R_{eff,N}/(W/L)_n$ (ramp: drop 0.69) |
| Load capacitance | $C=2C_{gd1}+2C_{gd2}+C_{db1}+C_{db2}+C_{g3}+C_{g4}+C_w$ |
| FO4 load | $C=2C_{gd1}+2C_{gd2}+C_{db1}+C_{db2}+4C_{g1}+4C_{g2}+C_w$ |
| Sized inverter | $t_P=0.69(R_{eq0}C_{int0}+R_{eq0}C_{ext}/S)$, $R_{eq}=\frac12(R_N+R_P)$ |
| Buffer chain | $x^n=C_L/C$, $t_P=nxCR$, $x_{opt}=e$ |
| Dynamic power | $P_{dyn}=fCV_{DD}^2$ |
| Short-circuit peak | $I_{peak}=\frac12\mu_nC_{ox}(W/L)_n(V_{DD}/2-V_{tn})^2$ |
| PDP, EDP | $PDP=\frac12CV_{DD}^2$, $EDP=\frac12CV_{DD}^2t_P$ |
| Pass-transistor high level | $V_{OH}=V_{DD}-V_t(V_{OH})$ |
| Transmission gate | $R_{TG}=R_{Neq}\parallel R_{Peq}$ |
| Elmore delay | $t_P=0.69[C_1R_1+C_2(R_1+R_2)+\cdots]$ |
| Flip-flop overhead | $t_{FF}=t_{su}+t_{cq}$; $T_{clk}\ge t_{cq}+t_{logic}+t_{su}$ |
| SRAM read | $\frac{V_{\bar Q}}{V_{DD}-V_{tn}}=1-1/\sqrt{1+(W/L)_a/(W/L)_n}$; $\frac{(W/L)_a}{(W/L)_n}\le\frac{1}{(1-\frac{V_{tn}}{V_{DD}-V_{tn}})^2}-1$ |
| SRAM read delay | $\Delta t=C_B\Delta V/I_5$ |
| SRAM write | $\frac{(W/L)_p}{(W/L)_a}\le\frac{\mu_n}{\mu_p}[1-(1-\frac{V_{tn}}{V_{DD}-V_{tn}})^2]$ |
| DRAM readout | $\Delta V=\frac{C_S}{C_B+C_S}(V_{CS}-\frac{V_{DD}}2)\approx\pm\frac{C_S}{C_B}\frac{V_{DD}}2$ |
| Sense amplifier | $v_B=\frac{V_{DD}}2\pm\Delta V e^{(G_m/C_B)t}$, $G_m=g_{mn}+g_{mp}$ |
| LFSR / PRBS | period $2^N-1$; longest run $N$; $T_{clk}\ge t_{cq}+t_{XOR}+t_{su}$ |
| Scaling by $1/S$ | $t_P\propto1/S$, $E\propto1/S^3$, $P\propto1/S^2$, $P/A$ const |
| Ring oscillator | $f=1/(2Nt_P)$ |

## References

- **Sedra & Smith, *Microelectronic Circuits*** (`Sedra.pdf`, an e-book without printed page numbers; PDF pages given):
  - Ch. 16 CMOS Digital Logic Circuits, PDF pp. 1383–1418: §16.1 switch model, PUN/PDN synthesis, NOR, NAND, complex gate, duality, XOR; §16.2 VTC, noise margins (Table 16.1), ideal VTC, resistive-load and pseudo-NMOS inverters; §16.3 CMOS inverter operation, VTC (Eqs. 16.33–16.38), unmatched case (Eqs. 16.39–16.40, Fig. 16.26, Ex. 16.3), Table 16.2.
  - Ch. 17 Digital Design: Power, Speed, and Area, PDF pp. 1425–1465: §17.1 propagation delay, average-current and equivalent-resistance methods (Eqs. 17.4–17.17), load capacitance (17.18–17.19), FO4 (17.20), Ex. 17.3 and Exs. 17.6–17.8; §17.2 inverter sizing (17.21–17.26), gate sizing (17.27–17.28), fan-in/fan-out, inverter chains (17.29–17.33, Ex. 17.5); §17.3 dynamic and short-circuit power (17.34–17.40), PDP/EDP (17.41–17.44), clock gating; §17.4 scaling (Table 17.1), PVT, interconnect, velocity saturation, subthreshold leakage, multi-$V_t$, SOI body bias, power gating, FinFETs, 3D; Table 17.2.
  - Ch. 18 Memory and Clocking Circuits, PDF pp. 1475–1520: §18.1 pass transistors, level restorer, transmission gates, $R_{TG}$ (Fig. 18.8), Elmore delay (18.17–18.18); §18.2 latch, SR flip-flop, clocked CMOS SR (Ex. 18.2), D latch, master-slave D flip-flop; §18.3 memory organization, 6T SRAM read/write (18.19–18.29, Exs. 18.6–18.8), 1T DRAM (18.30–18.33), flash; §18.4 ring oscillator (18.34), one-shot, sense amplifier (18.35–18.36, Ex. 18.3), NOR row decoder, column and tree decoders.
  - Not in the PDF (online appendices, so not covered): dynamic/domino logic and pseudo-NMOS in full, ROM.
- **B. Nikolić et al., "Improved Sense-Amplifier-Based Flip-Flop: Design and Measurements," IEEE JSSC 35(6), June 2000** (`ref/SerDes/sa_ff_optimized_latch_nikolic_jssc_2000.pdf`): §I (flip-flop overhead = setup + clock-to-Q, clock power 20–45 %), §II (pulse generator + slave latch), Fig. 12 (clock-to-Q vs setup/hold), §V (sampling window, hold vs input slope).
- **K.-L. J. Wong et al., voltage-mode TX with 2-tap equalization, IEEE JSSC 2004** (`ref/SerDes/voltage_mode_tx_2tap_eq_wong_jssc_2004.pdf`): §II (3 FO4 bit time = 3.6 Gb/s in 0.18 µm), §III (16:1 binary MUX tree).
- **PRBS usage:** Toifl et al. JSSC 2006 (`22Gbps_PAM4_rx_toifl_jssc_2006.pdf`, $2^7-1$, PRBS checker); Kossel et al. JSSC 2008 (`tcoil_sst_tx_kossel_jssc_2008.pdf`, on-chip PRBS-7, quarter-rate data); Lee et al. JSSC 2008 (`20G_duobinary_pam4_nrz_xcvrs_lee_jssc_2008.pdf`, $2^{31}-1$); Lee et al. JSSC 2015 (`56G_NRZPAM4_J.pdf`, quarter-rate PRBS); Won & Kim, *Electronics* 2024 (`electronics-13-03774.pdf`, 4-way parallel QPRBS13 at 7 GHz); Zhang, DesignCon 2016 slides (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`, QPRBS13 and PRQS10 definitions); Palermo EE689 L9 (`lecture9_ee689_mzm_tx.pdf`, PRBS 7/23/31 test-pattern table).
- **Vault owner notes linked instead of repeated:** [[MosFETs]] (switch model, capacitances, subthreshold, scaling), [[High-Speed Circuit Techniques]] (CML, TSPC, FO4 limits, dividers, pulse generators), [[Comparators]] (regeneration, metastability), [[Oscillators]] (ring oscillators), Digital Design notes [[Logical Effort]], [[Setup and Hold Constraints]], [[Fibonacci LFSR]], [[Galois LFSR]], [[Master-Slave D Flip-Flop]], [[Transparent D Latch]].
