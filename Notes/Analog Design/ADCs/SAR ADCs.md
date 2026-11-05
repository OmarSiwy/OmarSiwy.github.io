---
title: SAR ADCs
description: The successive-approximation ADC from binary search to charge-redistribution arrays, its error budget (kT/C, DAC matching, reference bounce, comparator noise and offset, settling), the speed tricks (asynchronous, multibit, flash front end), switching schemes, redundancy and calibration, and the hand-off to pipelined SAR, translated into comparator, switch and reference-buffer specs.
kind: topic
status: growing
aliases:
  - SAR ADCs
  - SAR ADC
  - Successive-Approximation ADC
---

A SAR ADC spends clock cycles instead of hardware. One comparator, one capacitor DAC and a little logic run a binary search that walks an analog estimate onto the held input, one bit per cycle. This note treats the loop as a black box first, then builds it from a capacitor array (top-plate and bottom-plate sampling), then budgets every error in it, then the speed, energy and accuracy tricks of modern SARs, and ends where the SAR hands its residue to a pipeline. Converter vocabulary (LSB, DNL, INL, ENOB, the noise ceiling) is in [[Data Converter Fundamentals]]; the capacitor DAC itself is in [[DACs]]; the comparator is in [[Comparators]].

## The big picture

```tikz title="The SAR loop: the comparator only senses the sign of V_in - V_DAC, the logic raises the next bit and undoes the last one if V_DAC overshot. A 4-bit search for V_in = 12.5 LSB visits 8, 12, 14, 13 and returns 1100. After Razavi (Data Converters) Figs. 14.2, 14.5, 14.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum height=1.0cm,align=center,fill=gray!8}}
  \node[blk,minimum width=2.0cm] (sh) at (0,0) {S/H};
  \node[blk,minimum width=1.6cm] (cmp) at (3.6,0) {comp};
  \node[blk,minimum width=2.2cm] (log) at (8.6,0) {SAR logic\\ (register)};
  \node[blk,minimum width=2.0cm] (dac) at (3.6,-2.2) {DAC};
  \draw[->] (-2.0,0) node[left] {$V_{in}$} -- (sh);
  \draw[->] (sh) -- node[above,font=\scriptsize] {$V_{in}$ held} (cmp.west|-0,0.25) ;
  \draw[->] (cmp) -- node[above,font=\scriptsize]{sign of} node[below,font=\scriptsize]{$V_{in}-V_{DAC}$} (log);
  \draw[->] (log.south) |- node[pos=0.75,below,font=\scriptsize]{$N$-bit code} (dac.east);
  \draw[->] (dac.west) -| (2.3,-0.25) -- (cmp.west|-0,-0.25);
  \node[left,font=\scriptsize] at (2.25,-1.2) {$V_{DAC}$};
  \draw[->] (log.east) -- ++(1.2,0) node[right] {$D_{out}$};
  \draw[->] (3.6,1.3) node[above,font=\scriptsize]{$CK$ ($\approx Nf_S$)} -- (cmp.north);
  \node[font=\scriptsize,align=center] at (3.6,-3.3) {CDAC: sampler + DAC + subtractor in one array};
  \begin{scope}[xshift=0.5cm,yshift=-8.6cm]
    \draw[->] (0,0) -- (9.2,0) node[right]{$t$};
    \draw[->] (0,0) -- (0,4.4) node[left]{$V_{DAC}$ (LSB)};
    \foreach \y/\l in {1/4,2/8,3/12,4/16} { \draw (-0.08,\y) -- (0.08,\y); \node[left,font=\scriptsize] at (-0.08,\y) {\l}; }
    \draw[dashed,gray] (0,3.125) -- (8.8,3.125) node[right,font=\scriptsize,black]{$V_{in}=12.5$};
    \draw[very thick] (0.4,2) -- (2.4,2) -- (2.4,3) -- (4.4,3) -- (4.4,3.5) -- (6.4,3.5) -- (6.4,3.25) -- (8.4,3.25);
    \foreach \x/\b in {1.4/{$>8$: MSB=1},3.4/{$>12$: 1},5.4/{$<14$: 0},7.4/{$<13$: 0}} { \node[font=\scriptsize] at (\x,0.4) {\b}; }
    \foreach \x in {2.4,4.4,6.4,8.4} { \draw[dotted] (\x,0) -- (\x,4.1); }
    \node[font=\scriptsize,align=left,anchor=west] at (0.5,4.75) {each cycle: raise the next bit; undo it if $V_{DAC}$ overshot};
    \node[font=\scriptsize] at (4.4,-0.4) {$N$ cycles $\to D_{out}=1100$};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **Binary search, one bit per cycle.** An $N$-bit conversion takes $N$ comparator decisions ($N-1$ DAC settlings with top-plate sampling) plus acquisition: $T_S\ge T_{acq}+N_c\,(t_{comp}+t_{logic}+t_{DAC})$. That is the price; zero static power and no linear amplifier are the payoff.
> 2. **The capacitor DAC is the sampler, the DAC and the subtractor at once.** Charge redistribution drives the comparator input toward a virtual ground. Bottom-plate sampling makes that node immune to input-dependent charge injection and junction nonlinearity.
> 3. **Noise adds in power:** $\mathrm{SNR}=\dfrac{A^2/2}{\Delta^2/12+2kT/C_{DAC}+\sigma_{n}^2}$. $C_{DAC}$ comes from $kT/C$ (or matching, whichever is larger); a comparator with $\sigma_n=\Delta/5$ costs 1.7 dB.
> 4. **The comparator's offset only shifts the curve** (input range lost, no DNL), so a SAR tolerates offsets of a few LSB. **The DAC's errors pass one-for-one:** DAC DNL/INL becomes ADC DNL/INL, and a DAC gain error $-\varepsilon$ becomes an ADC gain error $+\varepsilon$ (smaller LSB, worse $kT/C$).
> 5. **Speed is three delays per cycle.** DAC settling is worst in the first cycle (biggest step), comparator delay in the last ones (smallest residue). Asynchronous timing lets each cycle take what it needs (≤2× faster, far fewer metastable errors); a flash front end removes cycles; logic tapering sets a floor $(N-1)eT_d\ln[C_{DAC}/(4C_i)]$.
> 6. **The reference must settle every cycle** ($N$ times per sample): bounce under 0.2 LSB, worst when half the array switches. Switching schemes (monotonic: about 5× less DAC energy) and redundancy/overlap (tolerate flash offset up to ½ coarse LSB) are the modern refinements; calibration fixes capacitor mismatch beyond the ≈10 bits matching allows.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 Binary Search|binary search and the logic]] → [[#Level 1 Charge-Redistribution SAR|top- and bottom-plate CDAC loops]] → [[#Level 2 Static and Noise Errors|sampling, DAC, reference and comparator errors]] → [[#Level 3 Conversion Speed|loop delay, settling, tapering]] → [[#Level 4 Faster and Cheaper SARs|asynchronous, multibit, flash/SAR, monotonic, three-level]] → [[#Level 5 Redundancy, Calibration and Hybrids|redundancy, calibration, pipelined SAR]].

## Spec translation

A SAR contains no linear amplifier in its signal path, so its specs land on four non-amplifier blocks first (the CDAC, the sampling switches, the comparator, the reference) and only then on the amplifiers inside them: the comparator's preamp/latch, the reference buffer and the input driver. This specialises the template in [[Data Converter Fundamentals#Spec translation]]: the **noise budget** is $kT/C$ of the DAC + comparator noise + reference noise; the **error budget** is DAC matching, reference settling, $V_{REF}/2$ accuracy and DAC settling; and SAR adds a **time budget**, because everything happens $N$ times per sample.

```tikz title="The SAR time budget: one sample period holds the acquisition slot and N_c SAR cycles; every cycle holds a comparator decision, the logic delay and the DAC/reference settling. After Razavi (Data Converters) Fig. 14.29 and Sec. 15.4."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick,fill=gray!35] (0,0) rectangle (1.3,0.8) node[midway,font=\scriptsize]{$T_{acq}$};
  \foreach \i in {0,1,2} { \draw[thick,fill=gray!8] ({1.3+1.3*\i},0) rectangle ({2.6+1.3*\i},0.8); \node[font=\scriptsize] at ({1.95+1.3*\i},0.4) {cycle \pgfmathparse{int(\i+1)}\pgfmathresult}; }
  \node at (5.75,0.4) {$\cdots$};
  \draw[thick,fill=gray!8] (6.2,0) rectangle (7.5,0.8) node[midway,font=\scriptsize]{cycle $N_c$};
  \draw[<->] (0,-0.35) -- (7.5,-0.35) node[midway,below,font=\scriptsize]{$T_S=1/f_S$};
  \node[font=\scriptsize,anchor=west] at (7.7,0.4) {$N_c=N$ (bottom plate), $N-1$ (top plate)};
  \draw[dashed] (2.6,0) -- (0.4,-1.4);
  \draw[dashed] (3.9,0) -- (9.4,-1.4);
  \draw[thick,fill=blue!10] (0.4,-2.4) rectangle (3.4,-1.4) node[midway,align=center,font=\scriptsize]{$t_{comp}$\\ $\tau_{reg}$, noise};
  \draw[thick,fill=green!10] (3.4,-2.4) rectangle (5.0,-1.4) node[midway,align=center,font=\scriptsize]{$t_{logic}$\\ taper};
  \draw[thick,fill=orange!15] (5.0,-2.4) rectangle (9.4,-1.4) node[midway,align=center,font=\scriptsize]{$t_{DAC}$: switch + reference settle\\ to $\tfrac12$ LSB; bounce $<0.2$ LSB};
  \draw[<->] (0.4,-2.7) -- (9.4,-2.7) node[midway,below,font=\scriptsize]{$T_{CK}=t_{comp}+t_{logic}+t_{DAC}$};
  \node[font=\scriptsize,align=left,anchor=north west] at (0.4,-3.3) {$t_{comp}$ longest in the last cycles (small input)\\ $t_{DAC}$ longest in the first cycle (big step)};
\end{circuitikz}
\end{document}
```

**SAR specs** (Razavi DC Ch. 12, §14.2.7, Ch. 15; Carusone §17.2): $N$, $f_S$, $V_{FS}$, SNDR/ENOB at $f_{in}$, DNL/INL and no missing codes, input range (lost to offset), latency (one sample), power or FoM. Inside: $C_{DAC}$, unit capacitor $C_u$, the cycle time $T_{CK}$, and the clock ($Nf_S$ for a synchronous loop).

| SAR spec / budget item | Block | Block spec it imposes | Amplifier spec it lands on |
|---|---|---|---|
| $kT/C$ share of SNR | CDAC (it is the sampling capacitor) | $C_{DAC}\ge 2kT/P_{kTC}$; $C_u=C_{DAC}/2^{N}$ (or $2^{N-1}$) unless matching needs more | Load of the **input driver** and size of every switch and logic gate after it |
| DNL/INL $<\frac12$ LSB | CDAC unit elements | Capacitor matching (owned by [[DACs]]) | none (passive) |
| Acquisition in $T_{acq}$ | Sampling switches (two in series on a top-plate array) | $R_{on,tot}C_{DAC}\le T_{acq}/[(N+1)\ln2]$; bootstrapped input switch | **Driver** output impedance $\ll R_{on}$, peak current |
| Cycle time $T_{CK}=T_S/N$ (sync.) | Loop: comparator + logic + DAC | $t_{comp}+t_{logic}+t_{DAC}\le T_{CK}$ | see the three rows below |
| $t_{DAC}$: settle to ½ LSB | DAC switches and reference | $\tau_{DAC}\le t_{DAC}/\ln\frac{\Delta V_{step}}{0.5\,\mathrm{LSB}}$ | none for switches ($R_{on}$, not gm/ID) |
| Reference bounce $<0.2$ LSB | Reference buffer + decoupling | $R_{out}\frac{C_{DAC}}4\ln\frac{V_{REF}^+-V_{CM}}{0.4\,\mathrm{LSB}}\le t_{DAC}$ | **Output impedance** of the reference buffer (≈ $1/g_m$ of a follower) up to $\approx 1/(2\pi\tau_{ref})$ |
| Reference noise | Reference buffer + bandgap | Adds directly to comparator input noise | **Input-referred noise** of the buffer |
| $t_{comp}$ at ½ LSB input, metastability | Comparator latch | $\tau_{reg}\le\dfrac{t_{comp}-t_a}{\ln[V_M/(A_0\cdot\frac12\mathrm{LSB})]}$ | **$\tau_{reg}=C/g_m$**: short $L$, low $g_m/I_D$ in the latch |
| Comparator noise share | Comparator input pair | $\sigma_n\le\sqrt{P_c}$ (≈ $\Delta/5$ for 1.7 dB) | **Input-referred noise**: $C_P$ and $(g_m/I_D)$ of the StrongARM pair |
| Input range (offset eats it) | Comparator input pair | $V_{OS}$ ≤ a few LSB, and stable over the CM swing (monotonic switching) | **Offset**: $WL$ of the pair (loose, unlike flash) |
| $t_{logic}$ | SAR logic | Tapered chain driving $C_{DAC}/4$ | none (digital) |

$$
\boxed{T_S\ \ge\ T_{acq}+N_c\,(t_{comp}+t_{logic}+t_{DAC})}\qquad
\boxed{\mathrm{SNR}=\frac{A^2/2}{\dfrac{\Delta^2}{12}+\dfrac{2kT}{C_{DAC}}+\sigma_n^2+\overline{v_{n,ref}^2}}}
$$

$$
\boxed{\tau_{DAC}\le\frac{t_{DAC}}{\ln\!\big(\Delta V_{step}/0.5\,\mathrm{LSB}\big)}}\qquad
\boxed{R_{out}\frac{C_{DAC}}{4}\ln\frac{V_{REF}^+-V_{CM}}{0.4\,\mathrm{LSB}}\le t_{DAC}}\qquad
\boxed{\tau_{reg}\le\frac{t_{comp}-t_a}{\ln\!\big(V_M/(A_0\tfrac12\mathrm{LSB})\big)}}
$$

> [!note]- Derivation: where each inequality comes from
> **Time budget.** A synchronous SAR spends one slot on acquisition and $N_c$ cycles on conversion; each cycle must contain the comparator decision for the worst residue it will see (taken as ½ LSB), the logic delay and the DAC settling (Razavi DC §15.4, "$N(t_{comp}+t_{logic}+t_{DAC})$"). Razavi's clocking gives acquisition one SAR cycle, $T_{acq}=T_S/N$ (§14.2.7).
>
> **SNR.** The DAC's $kT/C$ (one per side, $2kT/C_{DAC}$ differential), the comparator's input noise and the reference noise all sit in series with the comparator input and so add to the sampled input (Razavi DC Eqs. 15.14, 15.20; [[#Reference Noise]]).
>
> **DAC settling.** A first-order step from $V_0$ to $V_\infty$ is within ½ LSB after $\tau\ln(|V_0-V_\infty|/0.5\,\mathrm{LSB})$ (Eqs. 15.38–15.39). The biggest step (the first one) sets the bound.
>
> **Reference.** In the worst cycle $k=m/2$ units switch from $V_{CM}$ to $V_{REF}^+$; the reference sees $\frac m2C_u$ in series with $\frac m2C_u$, i.e. $C_{DAC}/4$, through $R_{out}$. The comparator node $A$ moves half as much as the reference node $X$, so 0.2 LSB at $A$ means 0.4 LSB at $X$: $(V_{REF}^+-V_{CM})e^{-t/\tau_{ref}}\le0.4$ LSB (Eqs. 15.18–15.19; [[#Reference Bounce]]).
>
> **Comparator.** A StrongARM spends $t_a$ integrating (gain $A_0$) and then regenerates, $V_{XY}=A_0V_{in}e^{(t-t_a)/\tau_{reg}}$; it must reach a logic level $V_M$ for an input of ½ LSB inside $t_{comp}$ (Eq. 16.3; [[Comparators#Level 4 Metastability]]).

| Block spec | Lands on | Why |
|---|---|---|
| $C_{DAC}$ | Driver $g_m$ and current; switch widths; logic and clock power | Everything that charges $C_{DAC}$ in a fixed time scales with it (Razavi DC Ex. 15.4: 1.56× $C_{DAC}$ means 1.56× almost everything) |
| Switch $R_{on}$ | $W$ at $L_{min}$, bootstrapped $V_{GS}$ (not gm/ID) | Triode resistor; see [[Sampling Circuits#Spec translation]] |
| Reference $R_{out}$ | Buffer $g_m\gtrsim 1/R_{out}$, then $I_D=g_m/(g_m/I_D)$; plus a bypass capacitor | Follower output resistance $\approx1/g_m$; it rises with frequency, so simulate (Razavi DC §15.2.4) |
| Comparator noise | $C_P$ and $(g_m/I_D)_{1,2}$: $\overline{v_n^2}\approx\frac{4kT\gamma}{(g_m/I_D)C_PV_{THN}}$ | Integrated white noise on the StrongARM's own nodes |
| Comparator $\tau_{reg}$ | Short $L$, low $g_m/I_D$ (high $f_T$) in the cross-coupled pair | $\tau_{reg}\approx C/g_m$ |
| Comparator offset | $WL$ of the input pair, but only to "a few LSB" | Offset is a shift, not DNL ([[#Comparator Offset and Noise]]) |

> [!tip] Remark
> Amplifier spec names are those of [[Single-Stage#Amplifier Specifications]]; turning $g_m/I_D$, $L$ and $I_D$ into a width is [[gm-ID Design Methodology]]. The comparator rows are derived in [[Comparators#Spec translation]] and the switch and driver rows in [[Sampling Circuits#Spec translation]]; this table only says which SAR budget feeds them.

**Worked example** (10 bits, differential top-plate sampling, $\Delta=1$ mV, 300 K, $f_S=100$ MS/s). Steps 1, 2 and 5 are Razavi's numbers (DC §15.2.1, §15.3.2, Ex. 15.8); the rest is computed here from the boxed formulas, with the assumptions stated.
1. **$kT/C$ → $C_{DAC}$.** $C_{DAC}=0.5$ pF per side gives a penalty of $1+24kT/(\Delta^2C_{DAC})=1.2$ (**0.8 dB**). $C_u=0.5\ \text{pF}/2^{N}\approx0.5$ fF (≈1 fF for a top-plate array of $2^{N-1}$ units) unless matching needs more ([[DACs]]).
2. **Comparator noise.** $\sigma_n=\Delta/5=0.2$ mV costs **1.7 dB**. Together with step 1 the noise is $1.40\times10^{-7}$ V² against $\Delta^2/12=8.3\times10^{-8}$ V²: 2.25 dB, **ENOB ≈ 9.6**.
3. **Time budget.** $T_S=10$ ns. With Razavi's clocking, $T_{acq}=T_S/N=1$ ns and nine 1 ns SAR cycles. Split one cycle as $t_{comp}=0.5$ ns, $t_{logic}=0.1$ ns, $t_{DAC}=0.4$ ns.
4. **Acquisition → switches.** $R_{on,tot}C_{DAC}\le1\ \text{ns}/(11\ln2)=131$ ps, so $R_{on,tot}\le$ **262 Ω** for the two series switches (≈130 Ω each, input switch bootstrapped). The driver must have $R_{out}\ll262$ Ω and supply a full-scale step of ≈0.5 V through it (≈2 mA peak).
5. **Logic floor.** With $C_i=10$ fF and $T_d=10$ ps, $(N-1)eT_d\ln[C_{DAC}/(4C_i)]=$ **618 ps** per conversion, 69 ps per cycle: the 0.1 ns logic slot is feasible.
6. **DAC settling → switch + reference resistance.** The first differential step is $V_{REF}^{diff}/2=256$ LSB: $\tau\le0.4\ \text{ns}/\ln512=64$ ps. The reference criterion gives $\tau_{ref}\le0.4\ \text{ns}/\ln(256/0.4)=62$ ps. With $C_{DAC}/4=125$ fF: **$R_{sw}+R_{out}\lesssim500$ Ω**. A follower-type reference buffer then needs $g_m\gtrsim2$ mS (≈0.2 mA at $g_m/I_D=10$), or a large decoupling capacitor that holds the reference over a cycle.
7. **Comparator noise → StrongARM.** Assuming $\gamma\approx1$, $(g_m/I_D)_{1,2}=15$ S/A and $V_{THN}=0.4$ V: $C_P\ge4kT\gamma/[(g_m/I_D)V_{THN}\sigma_n^2]=$ **69 fF**.
8. **Comparator speed → latch.** $A_0=(g_m/I_D)V_{THN}=6$, so ½ LSB gives 3 mV after integration; reaching $V_M\approx0.45$ V takes $\ln150=5.0\,\tau_{reg}$. If $t_a\approx0.15$ ns, $\tau_{reg}\le70$ ps: easy in a modern process ([[Comparators#Level 8 Design Study 5 GHz StrongARM in 28 nm|2.5 ps in 28 nm]]). At this rate the comparator is **noise-limited, not speed-limited**, and its offset only needs to be a few mV.

## Level 0: Binary Search

### The Algorithm

Each cycle: **raise the next bit to 1; if $V_{DAC}$ overshot (or undershot) $V_{in}$, undo the previous change.** The comparator only ever sees the residue $V_{in}-V_{DAC}$ and reports its sign.

$$
\boxed{\text{cycle } k:\ \ V_{DAC}\to V_{DAC}\pm\frac{V_{REF}}{2^{k}},\quad\text{sign from } \mathrm{sgn}(V_{in}-V_{DAC})}\qquad
\boxed{T_c = N\,T_{CK}\ (+\,T_{acq})}
$$

- Viewed as a loop, the SAR is a **negative-feedback loop** whose comparator has (nearly) infinite gain: it forces $V_{in}-V_{DAC}\to0$, and may "ring" (overshoot/undershoot) on the way (Razavi DC §14.1.2).
- **Why $N$ cycles, not $N-1$** (Ex. 14.1): stop a 4-bit search after three decisions and $V_{in}=1.5$ LSB reads 0001 but $2.2$ LSB reads 0011; no input ever maps to 0010 (or any even code). One more comparison after the last DAC update is needed.
- The **time trellis** (all possible $V_{DAC}$ trajectories) is the tool for every error analysis below.

> [!tip] Remark
> "Raise, compare, maybe undo" is the same binary search a [[Pipelined ADCs|pipeline]] unrolls in space: a pipeline resolves one bit per *stage* with an amplifier between stages; a SAR resolves one bit per *cycle* in place, with no amplifier (Razavi DC §19.4).

### The Logic: Register and Pointer

- A **pointer** (a shift register carrying a single 1, a 1-of-$N$ code) selects which register bit the comparator writes this cycle (Fig. 14.6).
- **Register cells** are RS latches with an enable from the pointer; the comparator drives S/R. A StrongARM needs no extra RS latch here if its outputs stay low during precharge (Ex. 14.3).
- Both register and pointer reset to $100\cdots0$ during sampling.

> [!note]- Detail: reading $V_{in}$ back from $D_{out}$ (Razavi DC §14.1.5)
> Work backwards from the LSB: a bit of 1 means $V_{DAC}<V_{in}$ at that comparison, 0 means $V_{DAC}>V_{in}$; steps are $2^j$ LSB, starting from $V_{REF}/2$. For $D_{out}=0101$ (4 bits) the last two DAC values bracket the input, $5<V_{in}<6$ LSB. The same backward walk is how the decision thresholds of an imperfect SAR (offset, wrong $V_{REF}/2$) are found.

## Level 1: Charge-Redistribution SAR

### One Array Is Sampler, DAC and Subtractor

A capacitor DAC draws no static power, and its array can also hold the sample. A bottom-plate step $\Delta V$ on a capacitor $C_j$ of an array totalling $C_{tot}$ moves the floating top plate by

$$
\boxed{\Delta V_{top}=\frac{C_j}{C_{tot}}\,\Delta V_{bottom}}
$$

so binary-weighted plates switching by $V_{REF}$ subtract $V_{REF}/2,\ V_{REF}/4,\dots$ from the sampled input directly on the comparator node. The loop drives that node toward a fixed level, as if it were a **virtual ground** (Razavi DC §14.2.2).

> [!tip] Remark
> The array itself (binary vs thermometric segments, unit-capacitor matching, split arrays, the extra $C_u$ that makes the division exact, parasitic gain error) is owned by [[DACs]]. This note keeps what the SAR loop does with it: sampling discipline, switching schemes, and how its errors reach the ADC output. The charge-conservation step is [[Switched-Capacitor Circuits]].

### Top-Plate Sampling

```tikz title="Single-ended top-plate-sampling SAR (3 bits): the top plates track V_in through S_0; the bottom plates start at V_REF/2 and each decision moves one to 0 or V_REF. Only a 2-bit DAC (2^(N-1) units) settles twice. After Razavi (Data Converters) Fig. 14.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[ocirc]{} node[left]{$V_{in}$} to[nos,l=$S_0$] (2,3) coordinate(X);
  \draw (X) node[circ]{} -- (9.2,3);
  \node[above] at (5,3) {$V_{DAC}$ (top plates)};
  \draw (10.4,2.0) node[op amp,noinv input up](cmp){};
  \draw (9.2,3) |- (cmp.+);
  \draw (cmp.-) -- ++(-0.4,0) node[left]{$V_{REF}/2$};
  \draw (cmp.out) -- ++(0.4,0) node[right]{to logic};
  \foreach \x/\c/\n in {3/{2C_u}/3,5/{C_u}/2,7/{C_u}/1} {
    \draw (\x,3) to[C,l_=$\c$] (\x,1.4) node[circ]{};
    \node[font=\scriptsize] at (\x+0.65,2.2) {$C_\n$};
    \draw (\x,1.4) -- (\x,1.2);
    \draw (\x-0.6,0.4) node[below,font=\scriptsize]{$0$} -- (\x-0.6,0.6);
    \draw (\x,0.4) node[below,font=\scriptsize]{$\tfrac12$} -- (\x,0.6);
    \draw (\x+0.6,0.4) node[below,font=\scriptsize]{$1$} -- (\x+0.6,0.6);
    \draw[thick] (\x,1.2) -- (\x-0.45,0.65);
    \fill (\x-0.6,0.6) circle (1.5pt) (\x,0.6) circle (1.5pt) (\x+0.6,0.6) circle (1.5pt);
  }
  \node[font=\scriptsize,align=center] at (5,-0.6) {bottom-plate choices $0,\ \tfrac12,\ 1\ (\times V_{REF})$. Sample: plates at $V_{REF}/2$, top plates track $V_{in}$.\\ Each decision moves one plate to $0$ (if $V_{DAC}>V_{REF}/2$) or to $V_{REF}$ (if below).};
  \begin{scope}[xshift=1.4cm,yshift=-5.6cm]
    \draw[->] (0,0) -- (7,0) node[right]{$t$};
    \draw[->] (0,0) -- (0,3.6) node[left]{$V_{DAC}$ (LSB)};
    \draw[dashed,gray] (0,1.6) -- (6.6,1.6) node[right,font=\scriptsize,black]{$V_{REF}/2=4$};
    \foreach \y/\l in {0.8/2,1.6/4,2.4/6} { \draw (-0.08,\y) -- (0.08,\y); \node[left,font=\scriptsize] at (-0.08,\y) {\l}; }
    \draw[very thick] (0,1.88) -- (2,1.88) -- (2,1.08) -- (4,1.08) -- (4,1.48) -- (6,1.48);
    \node[font=\scriptsize,anchor=south] at (1,1.9) {$V_{in}=4.7$};
    \node[font=\scriptsize] at (1,0.35) {$>4$: FF3=1};
    \node[font=\scriptsize] at (3,0.35) {$<4$: FF2=0};
    \node[font=\scriptsize] at (5,0.35) {$<4$: FF1=0};
    \node[font=\scriptsize] at (3.2,3.2) {3 bits, 2 DAC settlings, $2^{N-1}$ units: $D_{out}=100$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **The first decision is free:** the comparator is clocked right after $S_0$ opens, so an $N$-bit conversion needs only **$N-1$ DAC settlings** and an **$(N-1)$-bit DAC with $2^{N-1}$ units** (three bottom-plate levels: 0, $V_{REF}/2$, $V_{REF}$).
- Each flip-flop is written **once** (no undo), unlike the generic loop.
- Costs: $S_0$'s channel charge depends on $V_{in}$ (bootstrapping helps but does not remove it), and **$V_{REF}/2$ must be accurate**: an error $\Delta V$ makes rising and falling steps unequal.

$$
\boxed{\text{4-bit, no missing code: }\ \Delta V<\frac{V_{REF}}{14}}\qquad\text{rule of thumb: } \Delta V<1\ \text{LSB}
$$

> [!note]- Derivation: a wrong $V_{REF}/2$ creates a missing code (Razavi DC Exs. 14.6–14.7)
> With $V_{REF}/2+\Delta V$ on the bottom plates and comparator, a falling MSB step is $(V_{REF}/2+\Delta V)/2$ and a rising one $(V_{REF}/2-\Delta V)/2$. For $\Delta V=1.2$ LSB in a 4-bit ADC the steps are 4.6/3.4, 2.3/1.7, 1.15/0.85 LSB. $V_{in}=8.7$ gives 0110 and $9.7$ gives 1000: a 1 LSB input change moved the code by 2. Code 0111 is missing because the first rising step (3.4) is smaller than the falling steps after it (2.3 + 1.15 = 3.45), so no trajectory can start below the threshold and end above it.
>
> No missing code needs the first rising step to exceed the later falling ones:
> $$\left(\tfrac14-\tfrac18-\tfrac1{16}\right)V_{REF}>\left(\tfrac12+\tfrac14+\tfrac18\right)\Delta V\ \Rightarrow\ \Delta V<\frac{V_{REF}}{14}$$
> It tightens with $N$; the differential version removes it.

### Differential Top-Plate Sampling

- Two arrays sample $V_{in}^+$ and $V_{in}^-$; bottom plates switch from $V_{CM}$ to $V_{REF}^+$ or $V_{REF}^-$; the comparator detects $\mathrm{sgn}(V_{DAC}^+-V_{DAC}^-)$ with **two inputs** (a differential flash comparator needs four).
- The input spans $\pm(V_{REF}^+-V_{REF}^-)$, so for $N$ bits $V_{REF}^+-V_{REF}^-=2^{N-1}$ LSB, not $2^N$.
- **$V_{CM}$ need not be precise:** the differential steps do not depend on it.
- A resistive divider can generate $V_{CM}$ with large resistors: for a differential input the CM node is a virtual ground, so the resistors do not slow acquisition (Fig. 14.18).

### Bottom-Plate Sampling

```tikz title="Single-ended bottom-plate-sampling SAR (3 bits): the bottom plates sample V_in while S_T grounds the top plates; S_T opens first. Converting, V_DAC = V_REF/2 - V_in and the loop drives it toward zero: 3 decisions and 3 settlings. After Razavi (Data Converters) Figs. 14.19, 14.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (1.2,3) -- (9.8,3);
  \node[above] at (5,3.05) {$V_{DAC}$ (top plates)};
  \draw (1.2,3) to[nos] (1.2,1.4) node[ground]{};
  \node[left,font=\scriptsize,align=right] at (0.95,2.2) {$S_T$\\(opens first)};
  \draw (11.0,2.0) node[op amp,noinv input up](cmp){};
  \draw (9.8,3) |- (cmp.+);
  \draw (cmp.-) -- ++(-0.3,0) -- ++(0,-0.6) node[ground]{};
  \draw (cmp.out) -- ++(0.4,0) node[right]{to logic};
  \foreach \x/\c in {2.6/{4C_u},4.6/{2C_u},6.6/{C_u},8.4/{C_u}} {
    \draw (\x,3) to[C,l_=$\c$] (\x,1.4) node[circ]{};
    \draw (\x,1.4) -- (\x,1.2);
    \draw (\x-0.6,0.4) node[below,font=\scriptsize]{$V_{in}$} -- (\x-0.6,0.6);
    \draw (\x,0.4) node[below,font=\scriptsize]{$V_{REF}$} -- (\x,0.6);
    \draw (\x+0.6,0.4) node[below,font=\scriptsize]{$0$} -- (\x+0.6,0.6);
    \draw[thick] (\x,1.2) -- (\x-0.45,0.65);
    \fill (\x-0.6,0.6) circle (1.5pt) (\x,0.6) circle (1.5pt) (\x+0.6,0.6) circle (1.5pt);
  }
  \node[font=\scriptsize,align=center] at (5,-0.7) {sample: bottom plates on $V_{in}$, top plates grounded by $S_T$.\\ Convert: MSB plate to $V_{REF}$, others to $0$ $\Rightarrow$ $V_{DAC}=V_{REF}/2-V_{in}$; loop drives $V_{DAC}\to0$.};
  \begin{scope}[xshift=1.4cm,yshift=-5.6cm]
    \draw[->] (0,0) -- (8,0) node[right]{$t$};
    \draw[->] (0,-1.4) -- (0,2.4) node[left]{$V_{DAC}$ (LSB)};
    \foreach \y/\l in {-0.7/{-1},0.7/{1},1.4/{2}} { \draw (-0.08,\y) -- (0.08,\y); \node[left,font=\scriptsize] at (-0.08,\y) {\l}; }
    \node[left,font=\scriptsize] at (-0.08,0) {0};
    \draw[very thick] (0,-0.49) -- (2,-0.49) -- (2,0.91) -- (4,0.91) -- (4,0.21) -- (6,0.21);
    \node[font=\scriptsize,anchor=north] at (1,-0.55) {$-0.7$: MSB$=1$};
    \node[font=\scriptsize,anchor=south] at (3,0.95) {$+1.3$: undo};
    \node[font=\scriptsize,anchor=south] at (5,0.25) {$+0.3$: LSB$=0$};
    \node[font=\scriptsize] at (4,2.1) {$V_{in}=4.7$, $V_{REF}=8$ LSB: 3 decisions, 3 settlings, $D_{out}=100$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{DAC}=\frac{V_{REF}}{2}-V_{in}\quad\text{after the MSB plate goes to }V_{REF}}
$$

- **$N$ decisions and $N$ settlings:** the comparator starts at zero difference, so the first cycle cannot be skipped.
- **No extra reference** ($V_{CM}$) in the single-ended form.
- **Input-dependent charge injection is gone.** $S_T$ (at a fixed node) opens first; after that the top plate floats and the input switch's charge goes to the next driven node (ground) when the bottom plate switches.

> [!tip] Remark
> The proof that the input switch's charge cannot reach a floating top plate is in [[Sampling Circuits#Bottom-Plate Sampling]]. SAR adds one twist (Razavi DC Fig. 14.23): even with a parasitic $C_X$ letting some charge in, the bottom plate goes from one *driven* point ($V_{in}$) to another (ground), so the injected charge is dumped there. "Bottom plate" means the plate tied to the input and released last; put the plate with the larger parasitic there.

**Differential bottom-plate SAR** (Fig. 14.26): bottom plates connect to one of **four** voltages ($V_{in}$, $V_{REF}^+$, $V_{REF}^-$, $V_{CM}$). After sampling, all go to $V_{CM}$, giving $V_{DAC}^+-V_{DAC}^-=-(V_{in}^+-V_{in}^-)$. The first decision is the sign; then each bit pushes the upper plate to $V_{REF}^-$ and the lower to $V_{REF}^+$ (or the reverse). The result is independent of $V_{CM}$. The **CM switches must latch off after the first decision** (an RS latch on the pointer's first bit), or the plates can never leave $V_{CM}$.

| | Top-plate sampling | Bottom-plate sampling |
|---|---|---|
| DAC settlings for $N$ bits | $N-1$ | $N$ |
| DAC resolution / units | $N-1$ bits, $2^{N-1}$ | $N$ bits, $2^N$ |
| Extra reference | $V_{CM}$ (or $V_{REF}/2$) | none (single-ended) |
| Input-dependent charge injection | yes (bootstrap $S_0$) | no |
| Switch junction-cap nonlinearity | yes (> ≈8 bits at speed) | suppressed |
| Use | Fast, ≤ ≈10 bits | High resolution (Razavi: ≥12 bits) |

### Clocking

- Synchronous: a **ring counter** ($N$ flip-flops passing a single 1) divides a clock at $Nf_S$ into a sampling pulse of one input period, and a NAND gives the conversion clock (Figs. 14.29–14.30).
- The catch: a 10-bit, 1 GS/s SAR would need a low-jitter **10 GHz** clock. Asynchronous timing ([[#Asynchronous SAR]]) and interleaving ([[Interleaved ADCs]]) remove it.

## Level 2: Static and Noise Errors

> [!tip] Remark
> Every error below is located with one rule (Razavi DC §15.2.2): **anything in series with the DAC output is in series with the comparator input, hence with the ADC input.** The comparator sees $V_{in}-(V_{err}+V_{DAC})=(V_{in}-V_{err})-V_{DAC}$.

### Sampling Switches

- A top-plate array has **two switches in series** with each capacitor (input and CM), roughly **doubling** the acquisition time constant.
- The input switch is bootstrapped (its $R_{on}$ and charge vary with $V_{in}$). The CM switch sits at $V_{CM}\approx V_{DD}/2$, where a single NMOS or PMOS is weak: use a wide complementary pair, bootstrap it, or **clock-boost** it.
- **Shared bootstrapping:** all CM switches can share one bootstrap network, but its capacitor $C_B$ must be large (≈70 switches plus long gate wires in a 6+4-bit array, Ex. 15.1).
- **Clock boosting** shifts the clock's DC level up by $V_{DD}/2$ through $C_B$ so $V_{GS}$ swings $0\ldots V_{DD}$ at $V_{CM}$. It needs $C_B\gg nC_{sw}+C_w$, whose own bottom-plate parasitic loads the clock buffer: $C_B\approx10(nC_{sw}+C_w)$ with $C_p\approx0.05C_B$ adds **50 %** to the buffer's load and power.
- A bottom-plate array does not *need* a bootstrapped input switch, but usually gets one for speed and lower distortion.

> [!tip] Remark
> Bootstrapping and clock boosting circuits are owned by [[Sampling Circuits#Level 5 Bootstrapping]]; the acquisition rule $R_{on}C\le T_{acq}/[(N+1)\ln2]$ by [[Sampling Circuits#Acquisition Time]].

### Switch Junction Capacitance

On a top-plate array the top-plate switch's junction capacitance $C_j(V)$ sees its voltage swing from $V_{in}$ to $V_{CM}$, and the loop has to supply that nonlinear charge:

$$
\boxed{k=\underbrace{\frac{V_{in}-V_{CM}}{V_{REF}}m}_{\text{ideal}}+\underbrace{\frac{V_{in}-V_{CM}}{V_{REF}}\frac{C_0}{C_u}}_{\text{gain error}}+\underbrace{\frac{\alpha}{2}\frac{V_{in}^2-V_{CM}^2}{V_{REF}}\frac{C_0}{C_u}}_{\text{nonlinearity}}}
$$

- Matters for high-speed designs above ≈8 bits: wide switches (for fast acquisition) bring large junctions.
- **Bottom-plate sampling suppresses it:** the comparator node starts and ends at $V_{CM}$, so the net charge on $C_j$ is ≈0 (the virtual ground again).
- Loading always gives a **positive** ADC gain error: the DAC needs a larger code $k$ to move the attenuated node by the same amount.

> [!note]- Derivation: nonlinear capacitance in a SAR (Razavi DC §15.1.2, Eqs. 15.2–15.13)
> **Define capacitance as $dQ/dV$**, not $Q/V$: for $Q=\beta_1V+\beta_2V^2+\beta_3V^3$, $I=dQ/dt=(\beta_1+2\beta_2V+3\beta_3V^2)\,dV/dt$, so $C=\beta_1+2\beta_2V+3\beta_3V^2$, and the charge at $V_0$ is $\int_0^{V_0}C\,dV$, not $C(V_0)V_0$. Using the wrong definition is off by a factor in every nonlinear term.
>
> **Charge the loop must deliver.** With $C_j=C_0(1+\alpha V)$ and the node going from $V_{in}$ to $V_{CM}$, the charge into $C_j+(m-k)C_u$ is
> $$Q=(V_{CM}-V_{in})[(m-k)C_u+C_0]+\frac\alpha2(V_{CM}^2-V_{in}^2)C_0$$
> It must come from the $k$ units switched from $V_{REF}$ to 0: $\Delta Q=kC_u[(0-V_{CM})-(V_{REF}-V_{in})]$. Equating gives the boxed $k$. A differential array cancels the $\alpha$ term but not a quadratic $\alpha_2V^2$ term in $C_j$.
>
> **Sign of the gain error** (Ex. 15.3): in the loop $V_{DAC}=\beta D_{out}$, so $D_{out}\approx V_{in}/\beta$. A DAC gain error $-\varepsilon$ gives $D_{out}\approx V_{in}/(\beta-\varepsilon)$: larger codes, a **positive** ADC gain error.

### DAC kT/C Noise

The switches leave $kT/C_{DAC}$ on each array; differentially that is $2kT/C_{DAC}$ in series with the comparator:

$$
\boxed{\mathrm{SNR}=\frac{A^2/2}{\dfrac{\Delta^2}{12}+\dfrac{2kT}{C_{DAC}}}}\qquad
\boxed{\text{penalty}=1+\frac{24kT}{\Delta^2C_{DAC}}}\qquad
\boxed{C_u=\frac{C_{DAC}}{2^N}\ \text{(unless matching needs more)}}
$$

> [!tip] Remark
> This is the generic $kT/C$ budget of [[Data Converter Fundamentals#Spec translation]] (worked example A there: 0.5 pF at $\Delta=1$ mV costs 0.8 dB), with the CDAC as the sampling capacitor. The $kT/C$ result itself is [[Noise#kT/C Noise]]. Whether $kT/C$ or matching sets $C_u$ is decided in [[DACs]].

### DAC Offset, Gain Error, DNL and INL

| DAC error | Origin | ADC effect | Rule |
|---|---|---|---|
| Offset | Mismatch of the two top-plate switches (overlap cap, channel charge) | Offset (in series with the input) | Usually small; either sampling type |
| Gain error $-\varepsilon$ | Top-plate parasitics: switch $C_{GD}+C_{DB}$, plate parasitic $C_T$, wiring $C_w$, comparator $C_{comp}$ | Gain error $+\varepsilon$: full scale reached early, **analog LSB smaller** | 5–10 % tolerable |
| DNL$_j$ | Unit-capacitor mismatch | Same DNL$_j$ at the same code | Keep well below 1 LSB |
| INL | Unit-capacitor mismatch (gradients) | $V_{INL}$ subtracts from $V_{in}$: same INL | Keep well below 1 LSB |

- **The cost of gain error is SNR** (Ex. 15.4): a −20 % DAC gain error shrinks $\Delta$ by 20 %, raising the $kT/C$ penalty of 0.5 pF from 0.8 to 1.2 dB, and the range by 20 %.
- Raising $C_{DAC}$ by $1/0.8^2=1.56$ (to 0.78 pF) restores SNR, but the switches, logic and reference decoupling must all grow by 1.56 to keep the speed, and **if every parasitic scales with $C_u$, the gain error does not improve at all.**

```tikz title="A DAC DNL error appears unchanged in the ADC: the loop forces V_DAC onto V_in, so the input must climb the same uneven DAC step before the code changes. After Razavi (Data Converters) Fig. 15.14."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (0,0) -- (4.4,0) node[right]{$D_{DAC}$};
    \draw[->] (0,0) -- (0,3.6) node[above]{$V_{DAC}$};
    \foreach \x/\y in {0.8/0.6,1.6/1.2,2.4/2.3,3.2/2.9} { \fill (\x,\y) circle (2pt); \draw[dotted] (\x,0) -- (\x,\y); }
    \node[below,font=\scriptsize] at (1.6,0) {$D_{j-1}$};
    \node[below,font=\scriptsize] at (2.4,0) {$D_j$};
    \draw[<->] (2.6,1.2) -- (2.6,2.3) node[midway,right,font=\scriptsize]{$1+\mathrm{DNL}_j$};
    \draw[dotted] (1.6,1.2) -- (2.7,1.2);
    \node[font=\scriptsize] at (2.0,-0.9) {DAC: one step too tall};
  \end{scope}
  \begin{scope}[xshift=6.2cm]
    \draw[->] (0,0) -- (4.4,0) node[right]{$V_{in}$};
    \draw[->] (0,0) -- (0,3.6) node[above]{$D_{out}$};
    \draw[very thick] (0.6,0.8) -- (1.2,0.8) -- (1.2,1.6) -- (2.3,1.6) -- (2.3,2.4) -- (2.9,2.4) -- (2.9,3.2) -- (3.6,3.2);
    \node[below,font=\scriptsize] at (1.2,0) {$V_{j-1}$};
    \node[below,font=\scriptsize] at (2.3,0) {$V_j$};
    \draw[dotted] (1.2,0) -- (1.2,0.8); \draw[dotted] (2.3,0) -- (2.3,1.6);
    \draw[<->] (1.2,1.3) -- (2.3,1.3);
    \node[font=\scriptsize] at (1.95,1.0) {$1+\mathrm{DNL}_j$};
    \node[font=\scriptsize] at (2.0,-0.9) {ADC: the same code is that much wider};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> The SAR therefore inherits the DAC's linearity exactly: capacitor matching ([[DACs]], [[Capacitor#Level 3 Variability|capacitor variability]], [[Nonlinearity and Mismatch#Level 3 Mismatch and Offset|mismatch]]) sets the resolution of an uncalibrated SAR. Carusone puts the limit at about **10 bits** for 0.1 % matching ([[#Calibration]]).

### Reference Bounce

```tikz title="Reference bounce: in the worst SAR cycle half the units switch, so the reference drives C_DAC/4 through its output resistance. After Razavi (Data Converters) Fig. 15.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[left,align=right,font=\scriptsize]{reference\\$V_{CM}\to V_{REF}^+$} to[R,l=$R_{out}$,o-*] (3,3) node[above]{$X$} to[C,l_=$\tfrac m2C_u$,*-*] (3,1.4) node[left]{$A$} to[C,l_=$\tfrac m2C_u$] (3,0) node[ground]{};
  \draw (3,1.4) -- (4.0,1.4) node[right,font=\scriptsize]{to comparator};
  \node[font=\scriptsize,align=left,anchor=west] at (6.8,3.2) {worst cycle: $k=m/2$ units switch};
  \node[font=\scriptsize,align=left,anchor=west] at (6.8,2.7) {(series $kC_u$ and $(m-k)C_u$ is largest)};
  \node[font=\scriptsize,align=left,anchor=west] at (6.8,2.1) {$\tau_{ref}=R_{out}\cdot\tfrac{m}{4}C_u=R_{out}C_{DAC}/4$};
  \node[font=\scriptsize,align=left,anchor=west] at (6.8,1.6) {$V_A$ moves half as much as $V_X$:};
  \node[font=\scriptsize,align=left,anchor=west] at (6.8,1.2) {0.2 LSB at $A$ $=$ 0.4 LSB at $X$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{bounce}\le0.2\ \text{LSB}}\qquad
\boxed{t_1=R_{out}\frac{C_{DAC}}{4}\ln\frac{V_{REF}^+-V_{CM}}{0.4\ \text{LSB}}=R_{out}\frac{C_{DAC}}{4}\ln\frac{2^N}{1.6}\ \ \le\ t_{DAC}}
$$

**Convention (used everywhere in this vault):** $C_{DAC}=mC_u$ is the whole array per side and 1 LSB $=\Delta=2(V_{REF}^+-V_{REF}^-)/2^N$ (differential full scale over $2^N$, [[Data Converter Fundamentals#The ADC Characteristic]]), with $V_{CM}$ midway, so the log argument is $2^N/1.6$ for any array size. Razavi's Eq. 15.19 writes $\frac m4R_{out}C_u\ln\frac m{1.6}$ with 1 LSB $=2(V_{REF}^+-V_{REF}^-)/m$; that equals $\Delta$ only if $m=2^N$ (a bottom-plate array), not for his $2^{N-1}$-unit top-plate array of Ch. 14, where it understates the log by $\ln2$.

- The array draws charge from $V_{REF}$ **$N$ (or $N-1$) times per conversion**, which is what makes reference settling a SAR problem more than a DAC problem.
- The worst cycle is $k=m/2$: at $k\approx0$ or $k\approx m$ the series capacitance $kC_u\|(m-k)C_u$ (and the charge) is small.
- $R_{out}$ of a real reference rises with frequency; a large bypass capacitor between $V_{REF}^+$ and $V_{REF}^-$ helps; resetting the DAC also bounces the reference. Simulate it.

> [!tip] Remark
> The circuit behind this (midscale current $mV_{REF}/4R_{on}$, $\tau=(4R_{on}/m+R_{REF})\frac m4C_0$, the $m^2C_0/2$ bypass rule, the reference buffer's $Z_{out}$) is owned by [[DACs#CDAC Reference Bounce and Its Buffer]]; $R_{REF}\frac m4C_0$ there is $R_{out}C_{DAC}/4$ here. This section keeps only the SAR budget (0.2 LSB, $N$ times per conversion). Building the reference itself is [[Bandgap References]].

### Reference Noise

- Reference noise $V_{n,R}$ reaches the comparator node unattenuated in the worst case (all units on $V_{REF}$, code $11\cdots1$) and passes through the comparator's own bandwidth (the $C_P$, $C_Q$ low-pass of a StrongARM).
- At the comparator it is **indistinguishable from the input pair's gate noise**: add its thermal part to $2\times4kT\gamma/g_{m1}$ and reuse the [[Comparators#StrongARM Noise Is Integrated White Noise|StrongARM noise]] result. Flicker usually contributes little.
- This is pessimistic: in a differential loop, plates of *both* arrays on the same reference make part of the noise **common-mode**, and some architectures never connect all plates to $V_{REF}$ before a decision. Transient-noise simulation gives the real number. Matters at ≥10 bits.

### Comparator Offset and Noise

```tikz title="Comparator offset shifts the SAR characteristic without changing any step: no DNL, but the top of the range is lost. After Razavi (Data Converters) Fig. 15.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right]{$V_{in}$};
  \draw[->] (0,0) -- (0,4.4) node[above]{$D_{out}$};
  \draw[gray] (0,0) foreach \i in {1,...,7} { -- ({0.7*\i},{0.5*(\i-1)}) -- ({0.7*\i},{0.5*\i}) } -- (5.6,3.5);
  \draw[very thick] (0,0) foreach \i in {1,...,6} { -- ({0.7*\i+0.5},{0.5*(\i-1)}) -- ({0.7*\i+0.5},{0.5*\i}) } -- (5.6,3.0);
  \draw[dashed] (5.6,0) -- (5.6,4.0) node[above,font=\scriptsize]{$V_{FS}$};
  \draw[<->] (0.7,-0.35) -- (1.2,-0.35) node[midway,below,font=\scriptsize]{$V_{OS}$};
  \draw[<->] (5.4,3.0) -- (5.4,3.5);
  \node[font=\scriptsize,anchor=east] at (5.3,3.55) {top code lost};
  \node[font=\scriptsize,align=left,anchor=west] at (6.6,2.6) {gray: ideal\\black: comparator offset $V_{OS}$\\every step the same width (no DNL)\\whole curve shifted by $V_{OS}$:\\range shrinks to $V_{FS}-V_{OS}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{offset: range }V_{FS}\to V_{FS}-V_{OS},\ \text{no DNL}}\qquad
\boxed{\mathrm{SNR}=\frac{A^2/2}{\dfrac{\Delta^2}{12}+V_{n,rms}^2}\quad(V_{n,rms}=\Delta/5\Rightarrow-1.7\ \text{dB})}
$$

- **Why offset is benign here:** one comparator makes every decision, so its offset shifts all thresholds together. A flash has a different comparator per threshold, so each offset becomes DNL ([[Flash ADCs]]). A SAR can take offsets **above 1 LSB**; design for no more than a few LSB to keep the range.
- **Unless the comparator's CM moves:** in monotonic switching ([[#Monotonic Switching]]) the input CM drifts each cycle. The StrongARM's input pair enters triode earlier at high CM, lowering the gain that divides the later stages' offsets, so the offset **varies cycle to cycle** and becomes nonlinearity. (A higher CM also raises the tail current, so the trend is not simple: simulate.)
- Comparator noise adds in power to the input; a DAC gain error makes it worse (smaller $\Delta$).

> [!tip] Remark
> Offset referral and the StrongARM's CM-dependent gain are [[Comparators#Offset Budget of a Preamp and Latch]]; the noise formula and its simulation are [[Comparators#Level 5 Noise and Error Probability]].

## Level 3: Conversion Speed

### Three Delays per Cycle

$$
\boxed{T_{conv}=N\,(t_{comp}+t_{logic}+t_{DAC})}\qquad\text{(flash: } t_{comp}\text{ only)}
$$

- $t_{comp}$ grows without bound as the input shrinks; it is quoted at $|V_{in1}-V_{in2}|=0.5$ LSB, and the loop must accommodate it in **every** cycle because any cycle can see a tiny residue.
- The decision path: StrongARM outputs separate → inverters with a low threshold flip → RS latch sets → DAC switches. Too slow a comparator eats the DAC's settling time, and the comparator then reads an unsettled $V_{DAC}$ (Fig. 15.21).
- **Metastability:** $|V_{in}-V_{DAC}|$ can be arbitrarily small with finite probability, so some cycles decide late or wrongly. The error-rate math is in [[Comparators#Level 4 Metastability]] (Razavi refers to Bankman et al. for the SAR-specific analysis).

### Incomplete DAC Settling

```tikz title="A slow DAC (tau = t_1/1.4) on a 4-bit top-plate loop with V_in = 4.6 LSB: V_DAC has only reached 7.6 LSB at t_1, the comparator wrongly asks for a rise, and the loop cannot fully recover: 0011 instead of 0100. After Razavi (Data Converters) Fig. 15.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,yscale=0.42,xscale=1.0]
  \draw[->] (0,4) -- (7.2,4) node[right]{$t$};
  \draw[->] (0,4) -- (0,12.0) node[above]{$V_{DAC}$ (LSB)};
  \foreach \y in {5,6,7,8,9,10,11} { \draw (-0.08,\y) -- (0.08,\y); \node[left,font=\scriptsize] at (-0.08,\y) {\y}; }
  \draw[gray,dashed] (0,8) -- (7,8) node[right,font=\scriptsize,black]{$V_{CM}$ (threshold)};
  \foreach \x/\l in {2/{t_1},4/{t_2},6/{t_3}} { \draw[dotted] (\x,4) -- (\x,11.2); \node[below,font=\scriptsize] at (\x,4) {$\l$}; }
  \draw[gray,thick] (0,4.6) -- (0,8.6) -- (2,8.6) -- (2,6.6) -- (4,6.6) -- (4,7.6) -- (6,7.6);
  \draw[very thick,domain=0:2,samples=40] plot (\x,{8.6-4*exp(-1.4*\x/2)});
  \draw[very thick,domain=2:4,samples=40] plot (\x,{10.6-3*exp(-1.4*(\x-2)/2)});
  \draw[very thick,domain=4:6,samples=40] plot (\x,{9.6+0.26*exp(-1.4*(\x-4)/2)});
  \fill (2,7.6) circle (2pt) (4,9.86) circle (2pt) (6,9.66) circle (2pt);
  \draw[->] (2.6,11.4) node[right,font=\scriptsize]{7.6 $<8$: wrong ``raise''} -- (2.05,7.75);
  \node[font=\scriptsize,anchor=south] at (4,10.0) {9.9};
  \node[font=\scriptsize,anchor=west] at (6.1,9.66) {9.7};
  \node[font=\scriptsize,anchor=west] at (2.1,5.5) {gray: fast DAC, $D_{out}=0100$};
  \node[font=\scriptsize,anchor=west] at (2.1,4.7) {black: $\tau=t_1/1.4$, $D_{out}=0011$};
  \node[font=\scriptsize,anchor=west] at (0.1,4.6) {$V_{in}=4.6$};
\end{circuitikz}
\end{document}
```

$$
\boxed{t_{DAC}=\tau\ln\frac{|V_0-V_\infty|}{0.5\ \text{LSB}}}\qquad
\boxed{\text{4-bit example: }\tau\le\frac{t_1}{\ln(4/0.6)}=0.53\,t_1}
$$

- An unsettled DAC is **not automatically fatal**: the loop is a feedback loop and partly corrects a wrong decision in later cycles (for $V_{in}=8.7$ LSB the same slow DAC gives the right code). It fails over a **band of inputs**: those whose first-cycle value lands near the threshold.
- A second-cycle failure also exists: with $t_1=1.4\tau$ a 4-bit loop errs for $5.75<V_0<8$ LSB.
- **Settling is longest in the first cycle** (largest step) if the switches dominate. A reference with finite $R_{out}$ changes that (worst at half switching).

> [!note]- Derivation: the slow-DAC trajectory (Razavi DC Eqs. 15.21–15.33)
> First-order: $V_{DAC}(t)=V_\infty+(V_0-V_\infty)e^{-t/\tau}$.
>
> $V_{in}=4.6$ LSB, $\tau=t_1/1.4$ ($e^{-1.4}=0.247$): the register asks for $+4$, so $V_{DAC}(t_1)=8.6-4(0.247)=7.6$ LSB $<8$: wrong decision, register asks for another $+2$, target 10.6. $V_{DAC}(t_2)=10.6-3(0.247)=9.9$ LSB $>8$: asks $-1$, target 9.6. $V_{DAC}(t_3)=9.6+0.3(0.247)=9.7$. Output 0011, 1 LSB low.
>
> **Maximum $\tau$** for this input: $V_{DAC}(t_1)$ must cross 8 LSB, $8=8.6-4e^{-t_1/\tau}$, so $\tau\le t_1/\ln(4/0.6)=0.53t_1$ (comparator and logic delay neglected).
>
> **Second cycle.** $V_1=V_0+4-4e^{-1.4}\approx V_0+3$ and $V_2=V_0+2+(1)e^{-1.4}\approx V_0+2.25$ LSB; both above 8 LSB (third decision wrong) when $V_0>5.75$ LSB.

### Carusone's RC Estimate for the Array

For sampling (all capacitors charging through bit switches $R$ and the shared switches $R_{s1}$, $R_{s2}$), the zero-value time constant and the ½-LSB condition give

$$
\boxed{\tau_{eq}=(R_{s1}+R+R_{s2})\,2^NC}\qquad\boxed{T>0.69\,(N+1)\,\tau_{eq}}
$$

- About 30 % pessimistic against simulation; scaling the switches of the large capacitors changes it. A first-cut number, then SPICE (Carusone §17.2.4).

### Tapering and the Minimum Cycle Time

- Comparator → inverters → flip-flop → DAC switch is a logic chain driving a big load. Widen the flip-flop to drive the switch and the inverter before it must grow, then the comparator: **taper** it (e.g. flip-flop ≈ $W_1/2$, inverters ≈ $W_1/4$).
- Widening the comparator itself raises its input capacitance (more DAC gain error) and power.
- The worst load is half the DAC switching, i.e. $C_{DAC}/4$. An optimally tapered chain (stage ratio $e$, $\ln(C_L/C_i)$ stages) gives a floor that **more power does not lower**:

$$
\boxed{T_{min}=(N-1)\,e\,T_d\ln\frac{C_{DAC}}{4C_i}}
$$

Razavi Ex. 15.8: 10 bits, $C_{DAC}=500$ fF, $C_i=10$ fF, $T_d=10$ ps → **618 ps** per conversion, before any comparator or DAC time.

> [!tip] Remark
> The tapering optimum (ratio $e$, $\ln(C_L/C_i)$ stages, $eT_d$ per stage) is the standard logical-effort result for inverter chains. Here $C_{DAC}$, already fixed by $kT/C$ or matching, is the load, which is why a bigger array makes the SAR slower even before settling.

## Level 4: Faster and Cheaper SARs

Four ways to raise the rate (Razavi DC §16.1): asynchronous timing, multibit cycles, a flash front end, and interleaving ([[Interleaved ADCs]]).

### Asynchronous SAR

```tikz title="Asynchronous SAR: a NAND of the StrongARM outputs detects that a decision is done (Ready); a pulse of width Delta T resets the comparator and starts the next evaluation. The digital loop must not be faster than the analog loop through the DAC. After Razavi (Data Converters) Figs. 16.1, 16.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum height=0.9cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[blk,minimum width=1.8cm] (cmp) at (0,0) {StrongARM\\ $X$, $Y$};
  \node[blk,minimum width=1.4cm] (nand) at (3.2,1.2) {NAND\\ (Ready)};
  \node[blk,minimum width=1.9cm] (pg) at (6.4,1.2) {pulse gen.\\ width $\Delta T$};
  \node[blk,minimum width=1.6cm] (rs) at (3.2,-1.2) {RS latch};
  \node[blk,minimum width=1.6cm] (log) at (6.4,-1.2) {SAR logic};
  \node[blk,minimum width=1.6cm] (dac) at (9.4,-1.2) {CDAC};
  \draw[->] (cmp.east) -- ++(0.4,0) |- (nand.west);
  \draw[->] (cmp.east) -- ++(0.4,0) |- (rs.west);
  \draw[->] (nand) -- (pg);
  \draw[->] (pg.north) -- ++(0,0.6) -| node[pos=0.25,above,font=\scriptsize]{$\overline{Reset}$ = comparator clock (digital loop)} (cmp.north);
  \draw[->] (rs) -- (log);
  \draw[->] (log) -- (dac);
  \draw[->] (dac.south) -- ++(0,-0.7) -| node[pos=0.25,below,font=\scriptsize]{$V_{DAC}$ (analog loop)} (cmp.south);
  \node[font=\scriptsize,align=left,anchor=west] at (8.6,1.2) {$\Delta T\approx t_{DAC}-2$ gate delays,\\ with margin for $\approx2\times$ PVT spread};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta T\approx t_{DAC}-2\ \text{gate delays}}\qquad\boxed{\text{speed-up}\le2\times}
$$

- **Idea:** cycles with a large residue finish early; only small-residue cycles wait. The comparator clocks itself from its own completion.
- **$\Delta T$ cannot track the DAC.** It is a large-signal inverter delay (≈2× spread over PVT); DAC settling is small-signal ($R_{on}$, $C$, reference). Choose $\Delta T$ for the worst corner.
- **Only $t_{comp}$ is made adaptive**; the DAC and logic still get fixed worst-case time. With the comparator dominating and following the linear-plus-regenerative model in every cycle, the best case is **2×**; less in practice (Chen and Brodersen).
- **Metastability drops sharply:** a slow decision simply takes longer instead of being cut off, and the error rate depends exponentially on available time ($e^{-T/\tau_{reg}}$).
- **Clock:** only $f_S$ is needed in principle. In practice a short acquisition slot still calls for a ring counter at $Nf_S$; a delay-based pulse generator would vary 2× with PVT and add jitter.

> [!note]- Derivation: the comparator response time (Razavi DC §16.1.1, Eqs. 16.1–16.3)
> A StrongARM's outputs first fall together (linear phase, duration $t_a$, building $V_{XY0}=A_0(V_{in1}-V_{in2})$), then regenerate: $V_X-V_Y=V_{XY0}e^{(t-t_a)/\tau_{reg}}$. Reaching $V_M$:
> $$t_1=t_a+\tau_{reg}\ln\frac{V_M}{A_0(V_{in1}-V_{in2})}$$
> Above some $\Delta V_0$ the log term is gone and $t_{comp}$ hits a technology floor; below it every halving of the input costs $0.69\tau_{reg}$. Those small-residue cycles are what synchronous timing must budget for in every cycle.

### Multibit per Cycle

- A $k$-bit quantizer ($2^k-1$ comparators) per cycle cuts the cycle count by $k$; each cycle "zooms" the comparator references into the surviving sub-range (e.g. $V_{REF}/4,\ V_{REF}/2,\ 3V_{REF}/4$, then $V_{REF}/16\ldots$).
- **Bill:** $2^k-1$ full $N$-bit DACs (area, $k$-fold input capacitance, more logic in the loop, so less speed-up than $k$).
- **Comparator offset matters again:** above 1 LSB it corrupts the thermometer code (DNL/INL), as in a flash. Offset cancellation is typically needed. (Ex.: 1.1 LSB on the middle comparator turns $V_{in}=8.3$ LSB into 0111.)
- One **resistor ladder** can replace the $2^k-1$ DACs (Wei et al.): static power, a slow output ($\tau_{max}=(\frac{2^N}4R_u+R_{on})(3\cdot2^NC_{sw}+C_w+C_{comp})$ for 2 b/cycle), and double the switches differentially. Carusone §17.2.6 gives the same picture: $2^L-1$ comparisons for $L$ bits per cycle, so $L$ stays small.

### Flash/SAR Hybrid

- A $k$-bit **flash** quantizes the held input first and sets the coarse DAC (thermometric, since the flash already gives a thermometer code and it relaxes matching); the SAR then searches one coarse LSB. 10 bits = 4-bit flash + 6-bit SAR: **6 cycles instead of 9** (top-plate).
- **No fewer unit capacitors:** 15 coarse capacitors of $32C_u$ plus a 5-bit fine array = $16\times32=512$, the same as a 9-bit DAC. Matching and noise still size the array.
- **Faster settling too:** the SAR steps are small, so $t_{DAC}=\tau\ln(\Delta V/0.5\,\mathrm{LSB})$ drops by about $\ln16=2.8$ for a 4-bit flash. Flash + asynchronous SAR is the natural pairing.
- **Errors the hybrid brings back:**
  - A flash comparator offset appears **directly as DNL** ($V_{OS}=1.1$ LSB → DNL 1.1 LSB). A 3σ offset below 1 mV (1 LSB at 10 bits, 1 V) is hard without cancellation.
  - The **SAR comparator offset now creates DNL and missing codes** at every coarse transition: the stitched fine characteristics leave gaps. The benign-offset property of a plain SAR is lost.
  - Flash and DAC must sample the same voltage: **equal time constants**, $(R_a+R_{c1})C_a=(R_b+R_{c2})C_{DAC}$, by scaling switch widths with $C_a=C_{DAC}/m$; random mismatch still matters at ≥10 bits.
- The fix for the flash offset and timing errors is overlap and redundancy ([[#Overlap and Redundancy]]).

### Monotonic Switching

```tikz title="Monotonic switching (V_in+ = 14.1, V_in- = 1.8 LSB, 4-bit arrays): only the higher side switches, and always down. One bit of DAC is saved, but the comparator's input common mode (dashed) falls from V_REF/2 toward zero. After Razavi (Data Converters) Fig. 16.27; Liu et al. 2010."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,yscale=0.28]
  \draw[->] (0,0) -- (9,0) node[right]{$t$};
  \draw[->] (0,0) -- (0,17) node[above]{$V_{DAC}$ (LSB)};
  \foreach \y in {0,4,8,12,16} { \draw (-0.08,\y) -- (0.08,\y); \node[left,font=\scriptsize] at (-0.08,\y) {\y}; }
  \foreach \x/\l in {1.6/{},3.2/{},4.8/{t_a},6.4/{t_b}} { \draw[dotted] (\x,0) -- (\x,16.5); \node[below,font=\scriptsize] at (\x,0) {$\l$}; }
  \draw[very thick] (0,14.1) -- (1.6,14.1) -- (1.6,6.1) -- (3.2,6.1) -- (3.2,2.1) -- (4.8,2.1) -- (4.8,0.1) -- (8,0.1);
  \draw[very thick,gray] (0,1.8) -- (6.4,1.8) -- (6.4,0.8) -- (8,0.8);
  \node[font=\scriptsize,anchor=south west] at (0.1,14.2) {$V_{DAC}^+$ ($V_{in}^+=14.1$)};
  \node[font=\scriptsize,anchor=south west,gray] at (5.0,2.0) {$V_{DAC}^-$ ($V_{in}^-=1.8$)};
  \node[font=\scriptsize,anchor=west] at (1.7,10) {$-8$};
  \node[font=\scriptsize,anchor=west] at (3.3,4.2) {$-4$};
  \node[font=\scriptsize,anchor=west] at (4.9,1.2) {$-2$};
  \node[font=\scriptsize,anchor=west,gray] at (6.5,1.3) {$-1$};
  \draw[dashed] (0,7.95) -- (1.6,7.95) -- (1.6,3.95) -- (3.2,3.95) -- (3.2,1.95) -- (4.8,1.95) -- (4.8,0.95) -- (6.4,0.95) -- (6.4,0.45) -- (8,0.45);
  \node[font=\scriptsize,anchor=west] at (5.4,9.5) {dashed: comparator input CM};
  \node[font=\scriptsize,anchor=west] at (5.4,8.0) {falls from $V_{REF}/2$ toward $0$};
  \node[font=\scriptsize,anchor=west] at (5.4,6.5) {only one side switches, always down};
\end{circuitikz}
\end{document}
```

- Sample on the top plates with all bottom plates at $V_{REF}$; after each decision **lower only the higher side** (by switching one bottom plate from $V_{REF}$ to 0), with binary steps continuing across sides.
- Like differential top-plate sampling: **$N-1$ settlings, one bit less DAC.**
- **Energy:** a capacitor charged through a switch from a source $V_1$ draws $C_1V_1^2$ (half stored, half burned). Never charging a plate back up cuts the DAC switching energy **about 5×** (Liu et al.).
- **Cost: the comparator input CM moves** by up to $V_{REF}/2$ during a conversion. That slows the StrongARM at one end of its CM range, makes its **offset vary** cycle to cycle, and lets the nonlinear input and switch junction capacitance distort.
- Logic complexity is comparable (it must choose which register to update).

### Three-Level Bottom-Plate Sampling

- For ≥12 bits Razavi turns to bottom-plate sampling (a 5 GHz bootstrapped top-plate design gives HD3 ≈ −62 dB). Letting bottom plates also go to $V_{REF}/2$ buys **one extra bit from the same array** (Cho et al.): after sampling, all plates go to $V_{REF}/2$, $V_{DAC}=V_{REF}-V_{in}$, and the comparator (referenced to $V_{REF}/2$) sees $V_{REF}/2-V_{in}$.
- **CM stays constant** (unlike monotonic), but it needs **$N$ settlings**.
- **$V_{REF}/2$ must be precise:** an error $\Delta V$ gives thresholds $V_{REF}/4+\Delta V/2$ and $3V_{REF}/4+\Delta V/2$ after the first step, neither an offset nor a gain error but **nonlinearity**. Generate it with an accurate (power-hungry) divider.
- The $V_{REF}/2$ generator sees the whole array **in series with the small comparator capacitance** in cycle 1 (fast), but the MSB's $2C_u$ plus switch and both reference impedances in cycle 2. An asynchronous loop cannot exploit the fast first cycle: it must still allot worst-case DAC time.

## Level 5: Redundancy, Calibration and Hybrids

### Overlap and Redundancy

```tikz title="Residue handed from a flash front end to the SAR: without overlap it fills exactly one flash LSB, so any threshold error overflows; with 1 bit of overlap the SAR range is doubled, the ideal residue sits at 0.5-1.5 flash LSB, and a flash offset up to half a flash LSB stays in range. After Razavi (Data Converters) Figs. 19.2, 19.4, 19.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (0,0) -- (5.2,0) node[right]{$V_{in}$};
    \draw[->] (0,0) -- (0,2.6) node[above]{$V_{res}$};
    \draw[dashed] (0,1) -- (4.8,1); \node[left,font=\scriptsize] at (0,1) {1};
    \draw[very thick] (0,0) foreach \j in {1,2,3,4} { -- (\j*1.2,1) -- (\j*1.2,0) };
    \foreach \j/\l in {1.2/{V_{j-1}},2.4/{V_j},3.6/{V_{j+1}}} \node[below,font=\scriptsize] at (\j,0) {$\l$};
    \node[font=\scriptsize,align=center] at (2.4,-1.0) {no overlap: residue fills $0\ldots1$ flash LSB;\\ any flash offset overflows the SAR range};
  \end{scope}
  \begin{scope}[xshift=7cm]
    \draw[->] (0,0) -- (5.2,0) node[right]{$V_{in}$};
    \draw[->] (0,0) -- (0,2.6) node[above]{$V_{res}$};
    \draw[dashed] (0,2) -- (4.8,2); \node[left,font=\scriptsize] at (0,2) {2};
    \draw[dashed] (0,1.5) -- (4.8,1.5); \node[left,font=\scriptsize] at (0,1.5) {1.5};
    \draw[dashed] (0,0.5) -- (4.8,0.5); \node[left,font=\scriptsize] at (0,0.5) {0.5};
    \draw[very thick] (0,0.5) foreach \j in {1,2,3,4} { -- (\j*1.2,1.5) -- (\j*1.2,0.5) };
    \draw[gray,thick] (2.4,0.5) -- (2.4+0.4,0.5+0.333);
    \draw[gray,thick,dashed] (2.4,1.5) -- (2.8,1.833) -- (2.8,0.833);
    \foreach \j/\l in {1.2/{V_{j-1}},2.4/{V_j},3.6/{V_{j+1}}} \node[below,font=\scriptsize] at (\j,0) {$\l$};
    \node[font=\scriptsize,align=center] at (2.4,-1.0) {1 bit overlap: SAR range $0\ldots2$, ideal residue $0.5\ldots1.5$;\\ gray: threshold $V_j$ moved by $V_{OS}$, still in range if $|V_{OS}|<\tfrac12$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Overlap:** when the flash picks $V_j$, set the DAC to $(V_{j-1}+V_j)/2$ instead of $V_j$; **redundancy:** give the SAR one extra bit and twice the range. The overall resolution does not change.
- **Flash offset tolerance** rises from <1 LSB (DNL) to **½ flash LSB**, and the timing mismatch between flash and DAC paths ($V_0\omega_1\Delta t$) can share it: correct output if $V_{OS}+V_0\omega_1\Delta t<\frac12$ flash LSB.
- **Combining codes:** shift $D_F$ by the SAR resolution and subtract the half-step offset (Ex. 19.2: 3-bit flash + 4-bit SAR on 640 mV gives a 6-bit result, 33 LSB for $V_{in}=V_{REF}/2+1.6$ LSB).
- **What it cannot fix: the SAR comparator's offset.** It shifts the residue the flash knows nothing about (Ex. 19.4: $-2.2$ LSB of SAR offset gives 31 LSB instead of 33). Keep it well below 1 LSB, usually with offset cancellation.

> [!tip] Remark
> This is the SAR face of the same idea as the **1.5-bit/stage pipeline** (Razavi DC §19.2), owned by [[Pipelined ADCs]]: extra range around each decision lets comparators be sloppy, but only "vertical" residue errors are tolerated; gain errors are not.

### Calibration

With matching of about 0.1 %, an uncalibrated SAR stops at about **10 bits** (Carusone §17.2.5). Lee's self-calibrated SAR (16 bits) measures each MSB capacitor's error at start-up with a small **cal-DAC** and subtracts it during conversion:

$$
\boxed{D_{V_{ei}}=\frac12\Big(D_{V_{xi}}-\sum_{j<i}D_{V_{ej}}\Big)}
$$

- Calibrate from the MSB down: connect $C_i$ low and all smaller capacitors high while the comparator resets, then swap; the residual $V_{xi}$ is twice $C_i$'s error plus the already-known errors of the larger capacitors.
- In conversion, an accumulator adds $D_{V_{ei}}$ whenever bit $i$ is kept at 1 and drives the cal-DAC; a resistor sub-DAC resolves the last LSBs uncalibrated.
- Razavi's pipelined-SAR designs calibrate the **inter-stage gain** instead (see below).

> [!note]- Detail: why the measurement gives twice the error (Carusone Eq. 17.28, Fig. 17.12)
> $C_1=C_{total}/2+\Delta C_1$. With $C_1$ grounded and the rest at $V_{ref}$ during reset, then all swapped, an ideal $C_1$ leaves $V_x=0$. A real one leaves $V_x$ equal to twice the error $V_{e1}$ that $C_1$ alone would cause in a normal conversion, because the rest of the array is short by the same $\Delta C_1$. Digitize $V_x$ with the cal-DAC by successive approximation, halve it, store it. For $C_2$ onward, subtract the errors already stored for the larger capacitors (which sit inside the "rest of the array").

### SAR Meets Pipeline

The SAR does binary search without amplification but slowly; the pipeline needs precise amplification but resolves a bit per stage. Hybrids (Razavi DC §19.4) mix them:

| Arrangement | How | Gain | Catch |
|---|---|---|---|
| **SAR → pipeline** | A 6-bit top-plate SAR (5 settlings) leaves $V_{res1}\le V_{REF}/64$ on its DAC; a buffer hands it to MDACs with full scale $V_{REF}/64$ | Fewer SAR cycles, smaller DAC, low-swing low-gain first MDAC | Buffer gain error $\lesssim1/64$ (1.6 %); a $V_{REF}/64$ reference; SAR comparator and buffer offsets ≪ 1 LSB |
| **MDAC → SAR** | Flip-around MDAC amplifies; SAR digitizes its residue (Brandolini et al.: 2.5 b first stage) | Saves one SAR cycle | Not better than a plain pipeline: the SAR is still the bottleneck |
| **Pipelined SAR** | SAR → residue amplifier ($A_b$) → SAR, e.g. two 5-bit SARs for 10 bits (van der Goes et al.) | Simple DACs; gain $A_b>1$ relaxes stage 2's noise and offset | $V_{OS1}+V_{OSb}+V_{OS2}/A_b\ll1$ LSB; buffer gain must match stage 2's full scale (calibrated) |
| **One comparator per cycle** | Each SAR cycle uses its own comparator (Kull et al.) | Long reset, per-cycle offset cancellation | Area, offset cancellation, comparator capacitance → gain error (calibrated) |
| **SAR as a virtual-ground enforcer** | A SAR loop senses the MDAC's virtual ground and drives $C_2$ until $V_X\to0$ (Yoshioka et al.: 12 b, "digital amplifier") | Low op-amp gain is enough, and op-amp nonlinearity is removed too | Slow (SAR cycles inside each MDAC phase); comparator noise and offset ≪ 1 LSB |

$$
\boxed{\text{pipelined SAR: } V_{OS1}+V_{OSb}+\frac{V_{OS2}}{A_b}\ll1\ \text{LSB}}
$$

> [!tip] Remark
> MDACs, residue plots, inter-stage gain error and 1.5-bit stages are owned by [[Pipelined ADCs]]. The hand-off point is the SAR's final $V_{DAC}$: after $n$ bits it *is* a residue of at most $V_{REF}/2^n$, just unamplified.

### Beyond the Sources

> [!warning] Unverified
> The following widely used SAR techniques are **not covered** in Razavi DC Ch. 14–16, 19 or Carusone Ch. 17; they are listed only so the reader knows they exist. Check the original papers before relying on any detail.
> - **Merged-capacitor (Vcm-based) switching:** bottom plates start at $V_{CM}$ and move up or down, so the first decision costs no switching energy and the CM stays fixed. It resembles Razavi's differential top-plate scheme.
> - **Non-binary (sub-radix-2) or extra-cycle redundancy inside a plain SAR:** the overlap idea of [[#Overlap and Redundancy]] applied between SAR cycles, so a decision made on an incompletely settled DAC can be corrected later.
> - **Noise-shaping SAR:** after conversion the CDAC holds the quantization error (the residue); filtering it and feeding it into the next conversion shapes quantization noise like a [[Delta-Sigma ADCs|ΔΣ]] loop.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $C_{DAC}$ | $kT/C$, matching | Driver and reference current, switch and logic size, slower loop ($T_{min}\propto\ln C_{DAC}$) |
| Top-plate sampling | $N-1$ settlings, half the units | Input-dependent charge injection, junction-cap nonlinearity, $V_{CM}$ reference |
| Bottom-plate sampling | Linearity (no injection, no $C_j$ distortion) | $N$ settlings, $2^N$ units |
| Differential arrays | $V_{CM}$/$V_{REF}/2$ precision no longer matters, CM reference noise rejected | Two arrays, four reference levels (bottom plate) |
| Larger comparator pair | Offset, noise | Input capacitance → DAC gain error, kickback, power |
| ↑ $C_P$ in the StrongARM | Comparator noise | Speed, power |
| Asynchronous timing | ≤2× speed, far fewer metastable errors, no $Nf_S$ clock in principle | $\Delta T$ must cover worst-case DAC settling over PVT |
| Multibit cycles | Fewer cycles | $2^k-1$ DACs or a slow ladder; comparator offset → DNL |
| Flash front end | Fewer cycles, ≈$\ln 2^k$ faster settling | Flash offset and SAR offset → DNL; time-constant matching |
| Overlap/redundancy | Flash offset and timing error tolerance (½ coarse LSB) | Extra SAR bit/cycle; SAR offset still uncorrected |
| Monotonic switching | ≈5× less DAC switching energy, one bit less DAC | Comparator CM drift: speed, varying offset, distortion |
| Three-level ($V_{REF}/2$) bottom plate | One extra bit from the array, constant CM | $N$ settlings, precise $V_{REF}/2$ |
| Bigger reference decoupling / lower $R_{out}$ | Bounce, settling | Area, buffer power |
| Calibration | Resolution beyond ≈10 bits of matching | Start-up time, cal-DAC, digital |
| Pipeline after the SAR | Fewer cycles, smaller DACs | Residue amplifier gain accuracy, offsets |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Conversion time | $T_S\ge T_{acq}+N_c(t_{comp}+t_{logic}+t_{DAC})$; $N_c=N$ (bottom plate), $N-1$ (top plate) |
| Bit-cycle step | $V_{DAC}\to V_{DAC}\pm V_{REF}/2^k$ |
| Charge redistribution | $\Delta V_{top}=(C_j/C_{tot})\Delta V_{bottom}$ |
| Bottom-plate first value | $V_{DAC}=V_{REF}/2-V_{in}$ |
| Top-plate $V_{REF}/2$ error (4 b) | $\Delta V<V_{REF}/14$; rule: $<1$ LSB |
| Junction-cap code error | $k=\frac{V_{in}-V_{CM}}{V_{REF}}\left(m+\frac{C_0}{C_u}\right)+\frac\alpha2\frac{V_{in}^2-V_{CM}^2}{V_{REF}}\frac{C_0}{C_u}$ |
| SNR with $kT/C$ | $\frac{A^2/2}{\Delta^2/12+2kT/C_{DAC}}$; penalty $1+24kT/(\Delta^2C_{DAC})$ |
| Unit capacitor | $C_u=C_{DAC}/2^N$ unless matching needs more |
| DAC gain error | $-\varepsilon$ (DAC) → $+\varepsilon$ (ADC); 5–10 % tolerable |
| DAC DNL/INL | Transfers 1:1 to the ADC |
| Reference bounce | $\le0.2$ LSB; $t_1=R_{out}\frac{C_{DAC}}4\ln\frac{2^N}{1.6}$ |
| Reference settling (general) | $R_{out}\frac{C_{DAC}}4\ln\frac{V_{REF}^+-V_{CM}}{0.4\,\mathrm{LSB}}\le t_{DAC}$ |
| Comparator offset | Range $V_{FS}-V_{OS}$, no DNL |
| Comparator noise | $\frac{A^2/2}{\Delta^2/12+V_{n,rms}^2}$; $\Delta/5\Rightarrow-1.7$ dB |
| Total noise | $\frac{A^2/2}{\Delta^2/12+2kT/C_{DAC}+\sigma_n^2+\overline{v_{n,ref}^2}}$ |
| Conversion (generic) | $N(t_{comp}+t_{logic}+t_{DAC})$ |
| DAC settling | $t_{DAC}=\tau\ln(\lvert V_0-V_\infty\rvert/0.5\,\mathrm{LSB})$ |
| 4-bit slow-DAC limit | $\tau\le0.53t_1$ |
| Array RC (Carusone) | $\tau_{eq}=(R_{s1}+R+R_{s2})2^NC$; $T>0.69(N+1)\tau_{eq}$ |
| Logic floor | $(N-1)eT_d\ln[C_{DAC}/(4C_i)]$ |
| Comparator response | $t_a+\tau_{reg}\ln\frac{V_M}{A_0(V_{in1}-V_{in2})}$ |
| Latch requirement | $\tau_{reg}\le(t_{comp}-t_a)/\ln[V_M/(A_0\frac12\mathrm{LSB})]$ |
| Async reset pulse | $\Delta T\approx t_{DAC}-2$ gate delays; speed-up ≤2× |
| Multibit | $2^k-1$ DACs/comparators for $k$ b/cycle |
| Resistor-ladder DAC | $\tau_{max}=(\frac{2^N}4R_u+R_{on})(3\cdot2^NC_{sw}+C_w+C_{comp})$ |
| Flash/SAR sampling match | $(R_a+R_{c1})C_a=(R_b+R_{c2})C_{DAC}$ |
| Overlap tolerance | $\lvert V_{OS}\rvert+V_0\omega_1\Delta t<\frac12$ flash LSB |
| Switching energy | $C_1V_1^2$ drawn to charge $C_1$ to $V_1$; monotonic ≈5× less |
| Calibration | $D_{V_{ei}}=\frac12(D_{V_{xi}}-\sum_{j<i}D_{V_{ej}})$ |
| Pipelined SAR offsets | $V_{OS1}+V_{OSb}+V_{OS2}/A_b\ll1$ LSB |

## References

- **Razavi, *Analysis and Design of Data Converters*, 2025** (PDF page = printed + 19)
  - Ch. 14 SAR ADC Fundamentals, pp. 284–309: binary search, basic loop, time trellis, pointer/register logic, computing $V_{in}$ from $D_{out}$ (§14.1); CDAC SAR, basic and single-ended top-plate sampling, $V_{REF}/2$ error and missing codes (Exs. 14.6–14.7, Eq. 14.2), differential top-plate, CM network, bottom-plate sampling and its charge injection, differential bottom-plate and its logic, clocking and ring counter (§14.2).
  - Ch. 15 SAR ADC Nonidealities, pp. 310–328: CM-switch bootstrapping and clock boosting, nonlinear capacitance definition and junction-cap code error (Eqs. 15.2–15.13) (§15.1); DAC $kT/C$ (Eqs. 15.14–15.16), offset and gain error (Exs. 15.3–15.4), DNL/INL, reference bounce (Eqs. 15.18–15.19), reference noise (§15.2); comparator offset, CM-dependent offset, noise (Eq. 15.20) (§15.3); delay components, comparator delay, incomplete settling (Eqs. 15.21–15.37), tapering and minimum delay (Ex. 15.8), settling vs step (Eq. 15.39) (§15.4).
  - Ch. 16 Advanced SAR Concepts, pp. 330–352: asynchronous SAR (ready generation, $\Delta T$, speed-up, metastability, clocking), multibit quantizers and the resistor-ladder variant (Eq. 16.4), flash/SAR hybrid (10-bit example, static and dynamic nonidealities, Eq. 16.8) (§16.1); monotonic switching and its energy, three-level bottom-plate sampling and the $V_{REF}/2$ generator (§16.2).
  - Ch. 19 Advanced SAR and Pipelining Techniques, pp. 418–437: overlap in flash/SAR, offset tolerance, timing mismatch, residue, SAR comparator offset (§19.1); 1.5-bit stage (only for the Remark, §19.2); hybrid SAR/pipelined ADCs, pipelined SAR, multiple comparators, SAR-assisted gain correction (§19.4). §19.3 (open-loop residue amplification) is left to [[Pipelined ADCs]].
  - Ch. 15 §15.2.1, p. 316 and Ch. 12 for the $kT/C$ SNR form (shared with [[Data Converter Fundamentals]]).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): Ch. 17 §17.2, pp. 650–662: binary search and DAC-based SAR (Ex. 17.3), unipolar and signed charge-redistribution converters (Ex. 17.4, parasitic attenuation), resistor–capacitor hybrid, speed estimate (Eqs. 17.25–17.27), error correction and self-calibration (Eqs. 17.28–17.30), multibit successive approximation.
- Papers cited by Razavi and named above (not read directly): Chen and Brodersen, JSSC 2006 (asynchronous SAR); Bankman et al., SSCM 2019 (SAR metastability); Cao et al., JSSC 2009 (2 b/step); Wei et al., JSSC 2012 (resistive DAC); Liu et al., JSSC 2010 (monotonic switching); Cho et al., JSSC 2011 (three-level switching); Brandolini et al., JSSC 2015; van der Goes et al., JSSC 2014; Kull et al., ISSCC 2017; Yoshioka et al., ISSCC 2017.
- **Zettelkasten** (`AnalogTheory/S23 SAR ADCs.md` and `SAR ADCs/`): used as a reading-order check (it follows Razavi DC Ch. 14–16). Framings taken from 23b (the SAR as a negative-feedback loop), 23b3 (zero static power and no linear amplification as the contrast with pipelining), 23l (series-with-DAC-output referral rule), 23p3a (the tapering floor is power-independent), 23q4 (asynchronous helps only the comparator) and 23s3 (moving bits to the flash does not reduce unit capacitors).
