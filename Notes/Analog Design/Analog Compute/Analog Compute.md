---
title: Analog Compute
description: Computing with circuit laws instead of logic. Crossbar and charge-domain in-memory MAC, why weight stationarity is the real win, why the column ADC eats the budget, what IR drop, variation, drift and noise do to accuracy, how analog compares with digital CIM and systolic arrays, and analog solvers (one-step linear solves, ODE integrators, Ising machines), translated into ADC, DAC, capacitor and TIA specs.
kind: topic
status: growing
aliases:
  - Analog Compute
  - In-Memory Computing
  - Compute-in-Memory
  - Analog AI
  - Analog Solvers
---

Analog compute lets a circuit law do the arithmetic. A conductance multiplies by Ohm's law, a wire adds by Kirchhoff's current law, a capacitor integrates by charge conservation, and a feedback loop solves an equation by settling to the only state KCL allows. This note treats the in-memory multiply-accumulate (MAC) as a black box first, then opens up the memory cell, the peripheral converters, the accuracy limits, the full-system comparison with digital hardware, and finally the analog solvers that use the same idea for things other than neural networks.

There is no textbook for this chapter. It is built from the owner's research Zettelkasten (`AnalogTheory/S27 In-Memory Computing`, `S28 Analog Solvers and Physical Optimization` and their atomic notes), which cites the primary literature, and from the owner's own design study, [[#The Owner's Analysis Analog IMC vs Systolic Arrays|Analog IMC v Systolic Arrays]]. Citations are given as *(first author, venue year)*. Converter vocabulary (LSB, ENOB, SQNR, FoM) is in [[Data Converter Fundamentals]]; $kT/C$ is in [[Noise#kT/C Noise]].

## The big picture

```tikz title="An analog in-memory MAC: row DACs drive voltages V_i, each crosspoint conductance G_ij multiplies (Ohm), each column wire sums (KCL), a front end holds the column at virtual ground and an ADC digitizes the dot product. The weights never move; the periphery is where the energy goes. After Ielmini & Wong (Nat. Electron. 2018), Shafiee et al. (ISCA 2016)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum height=0.55cm,minimum width=1.0cm,align=center,fill=gray!10,font=\scriptsize}}
  \foreach \r/\y in {1/3,2/2,3/1} {
    \node[blk] (d\r) at (-1.2,\y) {DAC};
    \node[left,font=\scriptsize] at (-1.75,\y) {$x_\r$};
    \draw (d\r.east) -- (4.3,\y);
    \node[above,font=\scriptsize] at (-0.35,\y) {$V_\r$};
  }
  \foreach \c/\x in {1/1.2,2/2.6,3/4.0} {
    \draw (\x,3.4) -- (\x,0.2);
    \foreach \y in {1,2,3} { \draw (\x-0.5,\y) to[R,bipoles/length=0.55cm] (\x-0.5,\y-0.5) -- (\x,\y-0.5); \fill (\x-0.5,\y) circle (1.2pt); \fill (\x,\y-0.5) circle (1.2pt); }
    \node[blk] (t\c) at (\x,-0.45) {TIA /\\[-2pt] int.};
    \draw (\x,0.2) -- (t\c.north);
    \node[blk] (a\c) at (\x,-1.45) {ADC};
    \draw[->] (t\c.south) -- (a\c.north);
    \draw[->] (a\c.south) -- (\x,-2.2);
  }
  \node[font=\scriptsize,anchor=east] at (0.55,2.75) {$G_{11}$};
  \draw[thick,fill=gray!10] (0.3,-2.2) rectangle (4.9,-2.75);
  \node[font=\scriptsize] at (2.6,-2.47) {digital: shift-add, scale, activation};
  \node[font=\scriptsize,anchor=west] at (4.75,2.0) {$\boxed{I_j=\sum_i G_{ij}V_i}$};
  \node[font=\scriptsize,anchor=west,align=left] at (4.75,1.1) {multiply: Ohm\\ add: KCL\\ one settling time};
  \node[font=\scriptsize,anchor=west,align=left,text=blue!60!black] at (4.75,-0.1) {weights stay put:\\ no weight fetch};
  \node[font=\scriptsize,anchor=west,align=left,text=red!60!black] at (4.75,-1.4) {DAC + front end + ADC:\\ most of the energy\\ and area};
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **The physics is the MAC.** Current domain: $I_j=\sum_i G_{ij}V_i$ (Ohm multiplies, KCL adds). Charge domain: $V_{MAC}=\sum_i C_iV_i/(\sum_i C_i+C_P)$ (charge sharing averages). Time domain: $Q_j=V_rt_q\sum_i G_{ij}x_i$ (pulse width carries the input). An $N\times M$ matrix–vector product finishes in one settling time.
> 2. **The win is not moving the weights, not the analog multiply.** Analog deletes the weight-traffic term of the roofline, so it helps where arithmetic intensity $I=B/b_w$ sits far below the ridge $P/\beta$ (batch-1 decode, KV-cache attention, which has $I=1$ at every batch size) **and** precision is low.
> 3. **Analog energy is linear in SNR, so it quadruples per bit:** $E\ge12kT\cdot2^{2B}$ for a charge column. Digital cost grows only polynomially in bits. Analog wins only below a precision crossover (a few bits).
> 4. **The column ADC dominates** energy and area once it needs more than about 5–7 bits. A faithful readout needs $\log_2N+B_w+B_x$ bits, so every real design truncates, shares converters across columns, or makes the input bit-serial.
> 5. **Accuracy is capped by the array, not the ADC:** $\mathrm{SNR}_T\le\mathrm{SNR}_a$. IR drop grows as $N^2$ ($N_{crit}=\sqrt{2\varepsilon/r_w\bar G}$), a device holds about 4 bits, PCM drifts as $t^{-\nu}$, and read noise averages down slowly.
> 6. **Count the whole system.** Macro TOPS/W overstates system TOPS/W by about 1.4–3×. Digital in-memory compute (bit-exact, no ADC) is the real competitor. Analog solvers settle to an answer, but precision costs dynamic range and digital reimplementations of the same dynamics often win.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 The MAC in Physics|current, charge and time-domain MAC, the roofline]] → [[#Level 1 The Memory Cell|cells, levels, write-verify]] → [[#Level 2 The Periphery DAC, Front End, ADC|DAC, TIA/integrator, ADC]] → [[#Level 3 What Bounds Accuracy|noise, IR drop, variation, drift]] → [[#Level 4 Analog vs Digital The Full Accounting|digital CIM, systolic arrays, built chips]] → [[#Level 5 Analog Solvers and Physical Optimisation|linear solvers, ODEs, Ising machines]].

## Spec translation

A CIM macro is not an amplifier. Its specs land first on the array (cell variation, on/off ratio, wire resistance, column capacitance) and the converters (row DAC, column ADC), and only then on the amplifiers inside the periphery: the column TIA or integrator, the comparator, the reference buffer. Converter-internal specs are owned by [[SAR ADCs#Spec translation]], [[Flash ADCs#Spec translation]] and [[DACs#Spec translation]]; this section says what the CIM spec demands of them.

**CIM specs** (from the sources below): energy efficiency in TOPS/W, quoted **per bit** ($\eta_{1b}=\eta\,b_ib_w$) and with the energy boundary stated; compute density in TOPS/mm²; input, weight and output precision $B_x$, $B_w$, $B_{out}$; array size $N$ rows × $M$ columns and the number of rows $N_a$ active per conversion; accuracy as **compute-SNR** (the error of the digital output against the ideal dot product), not ENOB; latency per MVM.

```tikz title="Spec flow for a CIM macro: the system spec fixes the array and converter specs, which fix the amplifier specs of the front end and the ADC internals. After Gonugondla et al. (TCAD 2022), Murmann (2021)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum height=0.9cm,text width=3.0cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[blk] (s) at (0,0) {CIM spec\\ TOPS/W, TOPS/mm$^2$,\\ $B_x,B_w,B_{out}$, $N\times M$,\\ compute-SNR};
  \node[blk] (a) at (4.2,1.1) {Array\\ $\sigma_G/G$, $G_{max}/G_{min}$,\\ $r_w$, $C_{col}$, $N_a$};
  \node[blk] (c) at (4.2,-1.1) {Converters\\ ADC $B$, $f_s$, cols/ADC;\\ DAC $B_x$ or bit-serial};
  \node[blk] (f) at (8.4,0) {Amplifiers\\ TIA $g_m$, $R_f$; integrator\\ $C$, $T_{int}$; comparator\\ noise, $\tau_{reg}$; ref.\ $R_{out}$};
  \draw[->] (s) -- (a); \draw[->] (s) -- (c); \draw[->] (a) -- (f); \draw[->] (c) -- (f);
  \draw[->] (a) -- (c);
\end{circuitikz}
\end{document}
```

| CIM spec | Block | Block spec it imposes | Amplifier / device spec it lands on |
|---|---|---|---|
| Output precision with $N$ rows, $B_w$, $B_x$ | Column ADC | $B_{ADC}=\log_2N+B_w+B_x$ for exact; in practice truncated by about $\tfrac12\log_2N$ (the sum's spread is only $\sqrt N$) | ADC internals: [[SAR ADCs#Spec translation]] (comparator noise, CDAC, reference) |
| Throughput (MVM/s) with $S$ columns per ADC | Column ADC | $f_{ADC}=S/t_{read}$, plus a sample-and-hold per column; $S=\lceil w_{ADC}/p_{col}\rceil$ is set by pitch | Comparator $\tau_{reg}$, reference-buffer $R_{out}$ ([[SAR ADCs]]) |
| Input precision $B_x$ | Row driver | Multi-level DAC with $2^{B_x}$ levels inside the cell's linear range, **or** bit-serial (an inverter, $B_x$ passes), **or** PWM ($2^{B_x}$ time quanta) | DAC linearity ([[DACs]]); for bit-serial none |
| Thermal noise below quantization at $B$ bits | Column capacitance (charge domain) or integrator $C$ | $C\ge 12kT\,2^{2B}/V_{FS}^2$, energy $\ge12kT\,2^{2B}$ | Sets the load of the integrator/ADC driver |
| Weight precision $B_w$ per device | Cell + write-verify | Levels $L=\Delta G/(k\sigma_G)\ge2^{b}$; else slice weight over $\lceil B_w/b\rceil$ devices | Access-device $V_{GS}$ accuracy: $\delta G/G\approx(g_m/I_D)\,\delta V_{GS}$ for a compliance-programmed cell (derived, 27c5) |
| Rows read at once, $N_a$ | On/off ratio | $N_a\le(r-1)/2$ to resolve every partial sum, $r=G_{max}/G_{min}$; or $2^{A}\le(r-1)/2$ codes | none (device) |
| Linear map to error $\varepsilon$ | Column/row wires | IR drop $\tfrac12r_w\bar GN^2\le\varepsilon$, so $N\le N_{crit}=\sqrt{2\varepsilon/(r_w\bar G)}$ | Access device: $\Delta I/I\approx(g_m/I_D)\Delta V_S$, so **low $g_m/I_D$** in the bitcell |
| Column held at $V_{read}$ to $B$ bits (current domain) | TIA front end | Input impedance $1/g_m$: $I_{col}/g_m\le V_{read}/2^B$ | **Transconductance** $g_m\ge I_{col}2^{B}/V_{read}$; $I_D=g_m/(g_m/I_D)$ |
| Front-end noise below 1 LSB | TIA feedback resistor | $R_f\ge kT\,g_m\,4^{B}/(C_{BL}I_{col}^2)$ | Input-referred current noise $4kT/R_f\,[1+\gamma/(g_mR_f)]$ |
| Read time (integrating front end) | Integrator | $T_{int}=CV_c/I_{col}$ | Integrator **output swing** $V_c$, **slew**, **DC gain** (virtual ground) |
| Bandwidth of the virtual ground | TIA / integrator | Input pole $g_m/(2\pi C_{BL})$ above the read rate | **$f_T$** of the input device: moderate inversion, not weak |

$$
\boxed{B_{ADC}=\log_2N+B_w+B_x\ \text{(exact)}}\qquad
\boxed{C\ge\frac{12kT\,2^{2B}}{V_{FS}^2},\ \ E\ge12kT\,2^{2B}}\qquad
\boxed{N_{crit}=\sqrt{\frac{2\varepsilon}{r_w\bar G}}}
$$

$$
\boxed{g_m\ge\frac{I_{col}\,2^{B}}{V_{read}},\quad I_D=\frac{g_m}{g_m/I_D}}\qquad
\boxed{R_f\ge\frac{kT\,g_m\,4^{B}}{C_{BL}I_{col}^2}}\qquad
\boxed{T_{int}=\frac{CV_c}{I_{col}}}\qquad
\boxed{N_a\le\frac{r-1}{2}}
$$

> [!note]- Derivation: where each inequality comes from
> **ADC bits.** $N$ products of $B_w$-bit weights and $B_x$-bit inputs take $1+N(2^{B_w}-1)(2^{B_x}-1)$ values, so an exact readout needs $\approx\log_2N+B_w+B_x$ bits. For zero-mean random products the sum's standard deviation grows as $\sqrt N$, leaving about $\tfrac12\log_2N$ bits of range almost never used, which is why truncation is universal (Zettelkasten 27h6; Shafiee, ISCA 2016; Jiang, 2021).
>
> **$kT/C$.** A charge column is a sampled node with noise $kT/C$. Requiring it to be below the quantization noise $\Delta^2/12$ with $\Delta=V_{FS}/2^B$ gives $C\ge12kT2^{2B}/V_{FS}^2$; charging it costs $CV_{FS}^2\ge12kT2^{2B}$, and $V_{FS}$ cancels (27g2; Murmann 2021; Gonugondla, TCAD 2022). Same law as the SAR CDAC in [[SAR ADCs#DAC kT/C Noise]].
>
> **On/off ratio.** With $N$ rows asserted and $x$ cells on, $I(x)=xV(G_{max}-G_{min})+NVG_{min}$. If the background $NVG_{min}$ is not cancelled it must stay under half an LSB $V(G_{max}-G_{min})/2$, so $N\le(r-1)/2$. If the ADC only resolves $A$ bits, the LSB is $N/2^A$ cells and $N$ cancels: $2^A\le(r-1)/2$ (27c3; Wang, TED 2023).
>
> **IR drop.** See [[#Wire IR Drop]]: the worst cell sees $\tfrac12r_wiN^2$, $i=\bar GV_{read}$, so the fractional error is $\tfrac12r_w\bar GN^2$ and $V_{read}$ cancels.
>
> **TIA.** A shunt-feedback stage presents $\approx1/g_m$ at the bitline, so the bitline moves by $I_{col}/g_m$; for a $B$-bit-correct multiply that must be below $V_{read}/2^B$. Its input-referred noise is $4kT/R_f\,[1+\gamma/(g_mR_f)]$; integrating over the noise bandwidth $g_m/(4C_{BL})$ of the one-pole input and requiring less than one LSB of current, $(I_{col}/2^B)^2$, gives the $R_f$ bound (27h7; Chou, MICRO 2019; Marinella 2018).
>
> **Integrator.** $V_o=(1/C)\int I_{col}dt$ reaches $V_c$ after $CV_c/I_{col}$, during which the column is busy.

| Block spec | Lands on | Why |
|---|---|---|
| TIA $g_m$ | $I_D=g_m/(g_m/I_D)$ at **moderate inversion** ($g_m/I_D\approx10$ S/A) | The input pole $g_m/(2\pi C_{BL})$ needs $f_T$ well above it; weak inversion cannot deliver it |
| TIA $R_f$ | Output swing $I_{col}R_f$ | Bigger $R_f$ is quieter but swings more |
| Integrator $C$, $T_{int}$ | OTA DC gain (virtual ground), slew $I_{col}$, swing $V_c$ | The gain is $1/C$; a capacitor ratio is lithographic ([[#Charge Domain]]) |
| Bitcell access device | **Low $g_m/I_D$** (strong inversion), longer $L$ | Source-line IR drop and $V_{GS}$ errors scale with $g_m/I_D$; integrated access-device noise grows as $\sqrt{g_m/I_D}$ (27h7, 27f2) |
| Comparator in the column SAR | Noise: $C_P$, $(g_m/I_D)$ of the input pair; speed: short $L$, low $g_m/I_D$ in the latch | [[Comparators#Spec translation]] |
| Reference buffer | $g_m\gtrsim1/R_{out}$ | [[SAR ADCs#Reference Bounce]] |

> [!tip] Remark
> Amplifier spec names follow [[Single-Stage#Amplifier Specifications]]; turning $g_m/I_D$, $L$ and $I_D$ into a width is [[gm-ID Design Methodology]]. The same "low $g_m/I_D$ buys insensitivity to a source-line drop" rule appears for current mirrors in [[Nonlinearity and Mismatch#Current Mismatch the Opposite Instruction]].

**Worked example 1: a per-column TIA** (Zettelkasten 27h7 with Marinella et al. 2018 and Gonugondla et al. 2022 numbers). Wire current is kept under $I_{col}=10\ \mu$A so the line drop stays under 20 mV; $V_{read}=0.8$ V; $B=8$; $C_{BL}=270$ fF.
1. **Virtual ground → $g_m$.** $g_m\ge(10\ \mu\text{A})(256)/0.8\ \text{V}=$ **3.2 mS**.
2. **Bandwidth → inversion level.** Input pole $g_m/(2\pi C_{BL})=1.9$ GHz, so weak inversion is out; take $g_m/I_D=10$ S/A: **$I_D=320\ \mu$A per column**.
3. **Array → power.** 256 columns × 320 µA = 82 mA, about **66 mW at 0.8 V before any conversion**. At 30 S/A it would be 27 mA, but $f_T$ collapses.
4. **Noise → $R_f$.** $R_f\ge kT g_m4^B/(C_{BL}I_{col}^2)=$ **32 kΩ**, so a 0.32 V full-scale output.

That standing current is the case against a TIA per column. It is why designs share TIAs (32 on a $64\times64$ array: Chou, MICRO 2019) or replace them with integrators, oscillators or null-balancing SARs ([[#Front Ends Three Currencies]]).

**Worked example 2: $kT/C$ of a charge column** (27g2). $B=8$, $V_{FS}=0.9$ V, 300 K: $C\ge12(4.14\times10^{-21})(65536)/0.81=$ **4.0 fF**, $E\ge$ **3.3 fJ**. Over $N=256$ rows that is $C_u\ge16$ aF. Real macros use about 1 fF per cell (Kavishwar 2025, 28 nm), roughly 60× above the thermal bound: matching and parasitics, not $kT/C$, size the unit capacitor ([[DACs#Choosing $C_0$ kT/C Against Matching]]).

> [!tip] Remark: checking the owner's design against this
> The owner's charge-domain tile (see [[#The Owner's Analysis Analog IMC vs Systolic Arrays|below]]) reads a $C_{col}=56$ fF column with a 12-bit SAR. *Assuming* $V_{FS}\approx0.7$ V (ASAP7 nominal supply; the write-up does not state $V_{FS}$), $C\ge12kT2^{2B}/V_{FS}^2$ allows about **9.5 bits** of thermal SNR on 56 fF, while 12 bits would need about 1.7 pF. That is fine if the extra bits are range (the $\log_2N$ headroom above), not noise. If they are meant to be noise-limited, the bank capacitance, not the converter, sets the floor. My calculation, not the owner's.

## Level 0: The MAC in Physics

### Current Domain: Ohm Multiplies, Kirchhoff Adds

$$
\boxed{I_j=\sum_i G_{ij}V_i}
$$

Drive row $i$ with $V_i$, hold every column at virtual ground, and the column current is the dot product. The multiply happens at each crosspoint, the sum on the wire. An $N\times M$ matrix–vector product costs one settling time, whatever $N$ (Ielmini, Nat. Electron. 2018; Sebastian, Nat. Nanotech. 2020).

> [!tip] Remark
> The virtual ground matters. Hopfield's 1984 network is the same conductance crossbar, $C_i\,du_i/dt=\sum_jT_{ij}V_j-u_i/R_i+I_i$ with $T_{ij}=1/R_{ij}$, but its summing node is free to move (Hopfield, PNAS 1984). Pin the node and you get a MAC; let it move through a nonlinearity and you get the [[#Hopfield Networks Are Ising Machines|Hopfield/Ising solver]] of Level 5.

**Signed weights.** A conductance is $\ge0$, so a signed weight is stored as a pair, $w\propto G^+-G^-$, on two columns (or two cells) subtracted in the readout. Cost: two devices, twice the read current, and $\sqrt2$ times the conductance noise (27c1; Joshi, Nat. Commun. 2020).

**Background current.** An "off" cell still conducts $G_{min}$, so $N$ asserted rows add $NVG_{min}$ to every column. The mean is an offset a reference column cancels; its $\sqrt N$ spread is not (27c2, derived from KCL and variance addition).

### Charge Domain

```tikz title="Charge-domain column: each unit capacitor's bottom plate is set to its product bit (0 or V_DD); closing the share switches averages the charge onto the column. The result is a ratio of identical capacitors, so it is lithographically accurate. After Valavi et al. (JSSC 2019), Gonugondla et al. (TCAD 2022)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[thick] (0,2.4) -- (8.1,2.4) node[right] {$V_{MAC}$};
  \foreach \i/\x in {1/0.6,2/2.0,3/3.4} {
    \draw (\x,2.4) to[nos,l=\scriptsize share] (\x,1.5) to[C,l=$C_u$] (\x,0.3);
    \node[below,font=\scriptsize] at (\x,0.3) {$V_\i$};
  }
  \node at (4.7,1.5) {$\cdots$};
  \node[font=\scriptsize,anchor=west] at (0,-0.5) {$V_i=w_ix_i\in\{0,V_{DD}\}$ (product bit)};
  \draw (5.6,2.4) to[C,l=$C_P$] (5.6,1.0) node[ground]{};
  \draw[thick,fill=gray!10] (7.0,1.0) rectangle (8.1,1.6); \node[font=\scriptsize] at (7.55,1.3) {ADC};
  \draw[->] (7.55,2.4) -- (7.55,1.6);
  \node[font=\scriptsize,anchor=west] at (0,3.0) {$V_{MAC}=\dfrac{\sum_i C_uV_i}{NC_u+C_P}$: scale every $C$ by $k$ and nothing changes};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{MAC}=\frac{\sum_i C_iV_i}{\sum_i C_i+C_P}}
$$

The multiply is $Q=CV$; the accumulate is charge sharing. Three reasons it is the dominant SRAM-CIM style:

- **Linearity.** The output depends only on capacitor *ratios*, which are set by identical metal fingers, not by $V_{TH}$ or a bias point (27i1; Valavi, JSSC 2019; Verma 2019). Multi-bit weights use a C-2C ladder, $2M+1$ capacitors of two values for $M$ bits (Wang 2023).
- **No static power.** A capacitor passes no DC: $\alpha CV_{DD}^2$ once per operation, against $V_{DD}I_{read}T$ for a conducting cell. Crossover $T^*=\alpha CV_{DD}/I_{read}$ is nanoseconds (27i3).
- **But PVT still enters** through $C_P/C$, comparator offset and LSB size, and inference accuracy falls off a cliff near $0.4\ \mathrm{LSB_{rms}}$ of column error (0.1 LSB for bit-parallel input). Most papers report only the nominal corner (27i5; Chen, JSSC 2024 PICO-RAM; Zhang 2024 ASiM).

> [!tip] Remark
> This is a [[Switched-Capacitor Circuits]] charge-sharing node, and the column ADC is usually a charge-redistribution SAR whose CDAC can *be* the column bank (the owner's design does this). Charge sharing, bottom-plate sampling and charge injection all carry over from [[Switched-Capacitor Circuits#Level 4 The Switch as a Real Device]].

**Gain cells.** A weight stored as a voltage on an isolated gate and read through a second transistor gives a continuous, non-destructively read analog weight at DRAM-like density with no eNVM module. Retention only needs $\tau>2^bT_{use}$, microseconds for a KV-cache entry, against a measured 5 ms in plain 28 nm logic (27i6; Khwa, 2024; Leroux, Nat. Comput. Sci. 2025).

### Time Domain

$$
\boxed{Q_j=V_rt_q\sum_i G_{ij}x_i}
$$

Apply one read voltage for $x_it_q$ instead of $2^{B_x}$ voltage levels. Precision moves from the amplitude axis, which would need $4^{B_x}$ of headroom between the noise floor and the device's nonlinearity, to the time axis, which needs $2^{B_x}$ time quanta and no linearity in $V$ (27h9; Jiang 2022, 40 nm PWM RRAM macro). **Bit-serial** input is the extreme case: one bit per pass, the row DAC becomes an inverter, and the ADC needs $\log_2N+B_w$ bits instead of $\log_2N+B_x+B_w$ (27h5; Shafiee 2016; Khaddam-Aljameh, JSSC 2022).

### Why It Wins: The Roofline

```tikz title="Roofline: attainable throughput vs arithmetic intensity I = B/b_w (log-log). Left of the ridge P/beta the machine waits on weight fetches. Analog removes the weight-traffic term, so it helps exactly where a workload sits far left of the ridge: batch-1 decode and KV-cache attention (I = 1). After Zettelkasten 27a2 and 27l2; Leroux et al. (2025)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8,0) node[below left] {$\log I$ (MAC/byte)};
  \draw[->] (0,0) -- (0,4.4) node[above] {$\log$ throughput};
  \draw[very thick] (0,0.4) -- (4.5,3.6) -- (7.7,3.6);
  \node[above,font=\scriptsize] at (6.2,3.6) {compute-bound: $P$};
  \node[rotate=35.4,font=\scriptsize] at (3.0,2.85) {memory-bound: $\beta I$};
  \draw[dashed] (4.5,3.6) -- (4.5,0) node[below] {$P/\beta$};
  \draw[fill=red!50] (0.9,1.04) circle (2.5pt);
  \node[font=\scriptsize,align=left,anchor=west] at (1.1,0.65) {decode $B{=}1$, KV attention $I{=}1$};
  \draw[fill=blue!50] (6.4,3.6) circle (2.5pt);
  \node[font=\scriptsize,anchor=north] at (6.4,3.45) {batched prefill};
  \draw[->,thick,red!60!black] (0.9,1.15) -- (0.9,3.5);
  \node[font=\scriptsize,anchor=west,text=red!60!black,align=left] at (1.0,3.95) {analog: weight traffic removed};
\end{circuitikz}
\end{document}
```

$$
\boxed{I=\frac{B}{b_w}\quad\text{memory-bound when}\quad I<\frac{P}{\beta}}
$$

For $\mathbf y=\mathbf W\mathbf x$ on a batch of $B$ vectors, the arithmetic is $BMN$ and the weight traffic is $MNb_w$ whatever $B$, so $I$ depends only on batch and weight width, not on layer size. A stationary array still does all $MN$ multiplies; what it deletes is the $MNb_w/\beta$ fetch time. The gain is the distance below the ridge, and it vanishes as $I$ rises toward $P/\beta$ (27a2; Murmann 2021).

> [!important] Where the energy saving actually comes from
> Weight stationarity is available to *any* in-memory macro, analog or digital. On a measured hybrid CMOS/memristor chip the multiply itself was **4.9 %** of total energy (Jebali, Nat. Commun. 2024), which bounds what the analog multiply alone can contribute (27a3). The argument for analog is therefore density and amortisation, not that analog arithmetic is cheap.

**Transformers.** A weight matrix serves $B$ tokens per load (intensity $B$), but each sequence has its own KV cache, so attention has $I=1$ at **every** batch size: the one part batching cannot rescue (27l2; Leroux 2025). This is the owner's thesis in [[#The Owner's Analysis Analog IMC vs Systolic Arrays]]: prefill GEMM is compute-bound, decode is memory-bound. Two caveats: large batches erase the premise for the weight matrices (at $B=64$, $I$ rises 64×), and the ridge point is a property of whichever digital baseline you pick (27a2).

> [!note]- Detail: weight stationarity is also the constraint
> Per-weight cost is $E_{read}+E_{prog}/R$, with $R$ the MVMs served before the weight is overwritten. $R\to\infty$ only if all $P$ parameters fit the total array capacity, so **capacity, not throughput, is what runs out** (27l1; Shafiee 2016; Ankit, ASPLOS 2019). Published multi-core analog chips store $10^4$–$10^5$ weights/mm², so a 7 B-parameter model needs $1.7\times10^4$–$2.4\times10^5$ mm² in one layer; stacking $L$ layers divides area by $L$ but, with converters shared, divides throughput by $L$ too (27l8; Büchel, Nat. Comput. Sci. 2025). Programming is not free either: a modelled $1024\times1024$ ReRAM tile costs 1.66 nJ to write against 0.36 nJ to read, negligible after $\gtrsim10^4$ inferences per programming but dominant below $\sim10^2$ (27n2; Marinella 2018).

## Level 1: The Memory Cell

### The Device Menu

| Cell | Weight is | Strength | Weakness | Source |
|---|---|---|---|---|
| RRAM (1T1R) | Filament conductance | Dense, non-volatile, CMOS-BEOL | ~4 bits; intermediate states relax; foundry endurance ~$10^4$ cycles (inference only) | Wan, Nature 2022; 27c4, 27d8, 27m4 |
| PCM | Amorphous/crystalline fraction | Mature, large chips built | Drift $G\propto t^{-\nu}$; abrupt (non-analog) reset | Joshi 2020; Le Gallo 2020; 27d1, 27d11 |
| NOR flash / floating gate | Stored gate charge, weight $\exp(\kappa Q_{FG}/C_TU_T)$ in weak inversion | Shipped (Mythic); oldest analog synapse | Temperature: a ratio of subthreshold currents goes as $w(T)=w(T_0)^{T_0/T}$, ≈10 % at $w=0.9$ from 25 to 85 °C | Guo 2017; 27b3, 27d9 |
| SRAM (charge-domain) | Bit in an 8T/10T cell + capacitor | Linear, no static power, logic process | One bit per cell; 8T is ≈1.45× the 6T area (≈2× with compute) | Valavi 2019; 27i1, 27i7 |
| Gain cell (eDRAM-like) | Voltage on an isolated gate | Continuous weight, logic process, fast write | Retention µs–ms: suits KV cache, not frozen weights | Khwa 2024; 27i6 |
| FeFET | Polarization | Capacitive write $E=2P_rAV_{prog}$, no static write current | Multilevel endurance ~$10^4$ cycles | Soliman 2023; 27e2 |
| ECRAM | Ion count in a channel | Write path separate from read: linear update $\Delta G=(\beta/q)Q/L^2$ | Immature | Talin 2022; 27e1 |
| MTJ (MRAM) | Parallel/antiparallel | Endurance | Two states only; $\mathrm{TMR}/(1+\mathrm{TMR})$ of the column current carries information | Cai 2023; 27e3 |

> [!tip] Remark
> A passive crossbar (no transistor per cell) is $4F^2$ but leaks through sneak paths, $(N-1)^2$ three-cell return paths around each target. It needs a selector, and selectors are the unsolved piece (27f1, 27e4). 1T1R buys selector-free operation and per-cell current compliance for roughly an order of magnitude in area (27f3; Hu, DAC 2016).

### About Four Bits per Device

$$
\boxed{L=\frac{G_{max}-G_{min}}{k\,\sigma_G}}
$$

The number of distinguishable levels is the usable conductance span over the separation each level needs. On measured PCM and RRAM that is 10 to 50 levels, **3 to 5 bits** (27c4; Sebastian 2020; Khwa 2022; Song 2024). So an 8-bit or 16-bit weight is **sliced** across $\lceil B_w/b\rceil$ devices of graded significance and recombined digitally (Shafiee 2016). Spending devices instead of device quality works: with weight $\overline W=\sum_n\gamma^nW^{(n)}$, the residual falls as $\gamma^N$, so precision grows linearly with tile count (Song, Science 2024; 27c9).

> [!note]- Detail: what $\sigma_G$ actually contains, and write-verify
> $\sigma_G$ is not one number. Budget separately: $\sigma^2_{eff}(t,N)=\sigma^2_{prog}+\sigma^2_{LF}(t)+\sigma^2_{RTN}+\sigma^2_{MVM}/N$ **plus a bias** $b(t)$ from drift and relaxation (27d5; Pedretti 2021; Le Gallo 2023 AIHWKit). Collapsing them into one Gaussian mispredicts the floor, the die-to-die spread and the time dependence.
>
> **Write-verify** reads the cell back and re-pulses in proportion to the residual: $e_{k+1}=(1-\mu)e_k-n_k$. The deterministic error decays geometrically and what remains is the noise of the *verify read*, not of the write pulse, which is why a device whose single-pulse spread covers several levels can still hold one (27c6; Alibart 2013; Shim 2020).
>
> **Compliance programs the level.** In a 1T1R cell the filament grows until the access transistor's saturation current limits it, so the analog weight is a gate voltage and its relative spread is $(g_m/I_D)\,\delta V_{GS}$ ([[MosFETs#gm/ID and ID/W Simulation-Aided Design]]). Low $g_m/I_D$ again (27c5; flagged needs-source in the Zettelkasten, so treat it as a derivation, not a measured result).

> [!warning] Unverified
> Per-device claims of 10–14+ bits exist; the Zettelkasten flags them as not evaluated against their sources (27c7). Read any such figure against the read bandwidth it was measured at: thermal read noise $4kTG\Delta f$ gives half a bit per doubling of read time, so a "14-bit" and a "4-bit" device can be the same device.

## Level 2: The Periphery: DAC, Front End, ADC

### The Column Is a Data Converter Whose Input Is a Dot Product

A column has a full scale $V_{FS}=N\Delta_{imc}$, an LSB, INL, DNL and SNDR like any ADC, but its input takes only $N+1$ discrete values and comes from many inputs, so linearity has two axes and the quantization error is not the textbook uniform kind (27h3; Kavishwar 2025). The right accuracy metric is **compute-SNR**, the error of the digital output against the ideal dot product. Because the ideal output is discrete, the quantizer can even *remove* analog noise, so compute-SNR can exceed the converter's SQNR (27g3; Shanbhag 2022).

> [!tip] Remark
> SQNR $=6.02N+1.76$ dB and ENOB are defined in [[Data Converter Fundamentals#SQNR = 6.02N + 1.76 dB]]. They describe the converter, not the MAC.

### The ADC Dominates Above About Five Bits

```tikz title="Column-ADC energy model E = k1(B + log2 r) + k2 r^2 4^B with the fitted k1 = 100 fJ, k2 = 1 aJ (Gonugondla et al. TCAD 2022), for a converter that sees the full supply (r = 1) and a column whose swing is 10x below it (r = 10), against the kT/C floor 12kT 4^B. The array's own read energy has no B in it. After Zettelkasten 27h1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,xscale=0.7,yscale=0.55]
  \draw[->] (1.5,-3.5) -- (12.8,-3.5); \node[font=\scriptsize] at (7,-4.5) {ADC bits $B$};
  \draw[->] (1.5,-3.5) -- (1.5,7.0) node[above] {$\log_{10}(E/1\,\mathrm{fJ})$};
  \foreach \b in {2,4,6,8,10,12} { \draw (\b,-3.6) -- (\b,-3.4); \node[below,font=\scriptsize] at (\b,-3.6) {\b}; }
  \foreach \e in {-3,0,3,6} { \draw (1.4,\e) -- (1.6,\e); \node[left,font=\scriptsize] at (1.4,\e) {\e}; }
  \draw[thick] plot coordinates {(2,2.30) (3,2.48) (4,2.60) (5,2.70) (6,2.78) (7,2.86) (8,2.94) (9,3.07) (10,3.31) (11,3.72) (12,4.25)};
  \node[font=\scriptsize,anchor=west] at (12.1,4.25) {$r=1$};
  \draw[thick,dashed] plot coordinates {(2,2.73) (3,2.81) (4,2.88) (5,2.97) (6,3.13) (7,3.43) (8,3.89) (9,4.44) (10,5.03) (11,5.62) (12,6.23)};
  \node[font=\scriptsize,anchor=west] at (12.1,6.23) {$r=10$};
  \draw[thick,dotted] plot coordinates {(2,-3.10) (3,-2.50) (4,-1.90) (5,-1.29) (6,-0.69) (7,-0.09) (8,0.51) (9,1.11) (10,1.72) (11,2.32) (12,2.92)};
  \node[font=\scriptsize,anchor=west] at (12.1,2.92) {$12kT\,4^B$};
  \draw[->] (6.6,4.8) -- (6.6,3.5); \node[font=\scriptsize,anchor=south] at (6.6,4.8) {corner $\approx6.6$ b ($r=10$)};
  \draw[->] (10.0,0.7) -- (10.0,3.15); \node[font=\scriptsize,anchor=north] at (10.0,0.7) {$\approx10$ b ($r=1$)};
  \node[font=\scriptsize,anchor=west,align=left] at (5.6,-2.4) {flat: switching ($k_1$ term)\\ steep: thermal, $\times4$ per bit};
\end{circuitikz}
\end{document}
```

$$
\boxed{E_{ADC}=k_1\!\left[B+\log_2\frac{V_{DD}}{V_c}\right]+k_2\left(\frac{V_{DD}}{V_c}\right)^2 4^{B},\quad k_1\approx100\ \text{fJ},\ k_2\approx1\ \text{aJ}}
$$

The array does the same analog operation however finely it is later digitized, so its energy has no $B$; the converter's does. The switching term and the $kT/C$ term cross at $B^*\approx10$ for a full-supply input, $6.6$ at $r=V_{DD}/V_c=10$ and $5.0$ at $r=32$. A compute column's swing sits well below the supply, so the corner lands at **5–7 bits**: a property of the signal, not the converter (27h1; Gonugondla, TCAD 2022).

Measured shares, for scale:
- **ISAAC** (32 nm, 8-bit 1.2 GS/s SARs): ADCs are **58 % of tile power**, 31 % of area (Shafiee, ISCA 2016).
- **14/16 nm ramp ADC on a $1024\times1024$ array**: array 0.36 nJ, integrator 2.81 nJ, ADC 9.4 nJ at 8 bits, so the ADC is 74 % and ADC+integrator 95 % of the read energy. Ramp converters cost $2^B$ from the first bit (256, 16, 3 ns at 8, 4, 2 bits) (Marinella 2018).
- Under a 2×-array area budget at 40 nm, a flash front end goes from 8 to 64 columns per converter between 3 and 6 bits; SAR holds 16 columns throughout (Jiang 2021).

> [!tip] Remark
> Flash costs $2^B-1$ comparators and input capacitance $\propto2^{3N}$ ([[Flash ADCs#Input Capacitance Grows as $2^{3N}$]]); a SAR costs $B$ decisions ([[SAR ADCs]]). That is why column ADCs are SARs above about 3 bits and flash or sense-amp sweeps only for binary/ternary networks (27h8: a reused sense amplifier costs $2^B$ decisions, affordable only at $B\le3$).

> [!note]- Detail: the escapes, and why none breaks the law
> Every standard trick moves along $E_{ADC}(B,r)$ rather than defeating it (27h1):
> - **Column sharing:** $S=\lceil w_{ADC}/p_{col}\rceil$ columns per converter, set by pitch; costs sample rate, area and a sample-and-hold per column, but not conversion energy (27h4).
> - **Truncation:** drop the $\tfrac12\log_2N$ unused range bits (27h6).
> - **Sparsity:** with $V_c=\Delta2^B$, energy reduces to $k_1\log_2(V_{DD}/\Delta)+k_2(V_{DD}/\Delta)^2$; sparsity pays only through a bigger LSB or skipped conversions (27h2).
> - **Analog shift-add** of weight slices in charge before one conversion: 37× and 4.9× lower EDP than flash and SAR at 6 bits, 40 nm (Jiang 2021).
> - **Analog dataflow between tiles** (no ADC between layers): $K$ stage errors add as $\sigma_{stage}\sqrt K$ because nothing snaps them back to a code, so CASCADE runs its bitlines at 6 bits instead of 11 (27l3; Chou, MICRO 2019).
> - **Parallelism:** activating $N_a$ rows amortizes the ADC over $N_a$ MACs but raises IR drop as $N_aN$, so $e_{ADC}\cdot\varepsilon=\tfrac12E_0r_w\bar GN$ has no $N_a$ in it: the knob moves along a hyperbola (27f6; Liu, ISSCC 2020).

### Front Ends: Three Currencies

```tikz title="Current-mode front ends hold the column at virtual ground and turn I_col into something quantizable. A TIA pays standing bias, an integrator pays time, a CCO pays linearity. After Zettelkasten 27h7; Khaddam-Aljameh (JSSC 2022), Chou (MICRO 2019)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % TIA
  \draw (0,0) node[op amp,scale=0.7](A){};
  \draw (A.-) -- ++(-0.6,0) coordinate(n1);
  \draw (A.out) -- ++(0.2,0) coordinate(o1);
  \draw (n1) -- ++(0,0.9) coordinate(t1) to[R,l=$R_f$] (t1 -| o1) -- (o1);
  \draw (A.+) -- ++(-0.3,0) node[ground]{};
  \draw[<-] (n1) -- ++(-0.8,0) node[left] {$I_{col}$};
  \draw (A.out) -- ++(0.4,0) node[right] {$-I_{col}R_f$};
  \node[font=\scriptsize,align=center] at (0,-1.5) {TIA: $g_m\ge I_{col}2^B/V_{read}$\\ cost: standing $I_D$};
  % integrator
  \begin{scope}[xshift=5.6cm]
  \draw (0,0) node[op amp,scale=0.7](B){};
  \draw (B.-) -- ++(-0.6,0) coordinate(n2);
  \draw (B.out) -- ++(0.2,0) coordinate(o2);
  \draw (n2) -- ++(0,0.9) coordinate(t2) to[C,l=$C$] (t2 -| o2) -- (o2);
  \draw (B.+) -- ++(-0.3,0) node[ground]{};
  \draw[<-] (n2) -- ++(-0.8,0) node[left] {$I_{col}$};
  \draw (B.out) -- ++(0.4,0) node[right] {$-\frac1C\!\int\! I_{col}$};
  \node[font=\scriptsize,align=center] at (0,-1.5) {Integrator: $T_{int}=CV_c/I_{col}$\\ cost: column busy for $T_{int}$};
  \end{scope}
  \node[font=\scriptsize,align=center,draw,fill=gray!8] at (2.8,-2.7) {CCO: $T=C_1v_{th}/(\alpha I_{col})+t_{delay}$: no bias, no wait, but $f(I)$ compresses at high current};
\end{circuitikz}
\end{document}
```

| Front end | Pays with | Number | Source |
|---|---|---|---|
| TIA (shunt feedback) | Static current | $I_D\ge I_{col}2^B/[V_{read}(g_m/I_D)]$: 320 µA/column at 8 bits ([[#Spec translation|worked example]]) | 27h7; Marinella 2018 |
| Charge integrator | Time | $T_{int}=CV_c/I_{col}$: 3.2 ns (64 fF, 0.5 V, 10 µA) to 24 ns (270 fF, 0.9 V) | 27h7; Soliman 2023 |
| Current-controlled oscillator | Linearity | Fixed latch delay $t_{delay}$ compresses $f(I)$; fixed by making $v_{th}$ track $I_{col}$ (feed-forward) | 27h7; Khaddam-Aljameh 2022 (HERMES) |
| Null-balancing SAR | Matching and area | A per-column current DAC cancels the column current; the code at the null *is* the dot product. The front end only ever sees a ≤1 LSB residue | 27h10 (patent) |
| Open-circuit voltage sensing | Settling to a ratio | Sense $V_{out}=\sum G_jV_j/\sum G_j$ instead of current (NeuRRAM) | Wan, Nature 2022 |

> [!tip] Remark
> The TIA's input-referred noise and the one-pole noise bandwidth $\tfrac\pi2f_p$ are [[Noise#Noise Bandwidth]] and [[Noise#Op-Amp Circuits]]. The integrator is the [[Switched-Capacitor Circuits]] integrator without the switches; its accuracy depends on a capacitor, which favours it.

> [!warning] Unverified
> The null-balancing readout is documented only in Mythic patents (US10523230B2, US10255205B1). The ≈13× front-end power saving the Zettelkasten derives for it (4.08 W TIA vs ≈0.3 W) is a calculation from vendor-level assumptions, not a measurement; no public source gives its measured ENOB, energy or area (27h10).

## Level 3: What Bounds Accuracy

### An Upper Bound Before the ADC

$$
\boxed{\mathrm{SNR}_T=\left(\mathrm{SQNR}_i^{-1}+\mathrm{SNR}_a^{-1}+\mathrm{SQNR}_y^{-1}\right)^{-1}\le\mathrm{SNR}_a}
$$

Input quantization, analog noise and output quantization add in power. Raise every precision and only $\mathrm{SNR}_a$ survives, so **no converter buys accuracy the array did not produce** (27g1; Roy 2022; Gonugondla 2020, 2022).

> [!tip] Remark
> Noise powers add when sources are uncorrelated: [[Noise#Adding Sources Correlation]]. The same sum appears in the SAR's $\mathrm{SNR}=\frac{A^2/2}{\Delta^2/12+2kT/C+\sigma_n^2}$ ([[SAR ADCs]]).

### Analog Energy Quadruples per Bit

$$
\boxed{E_{thermal}\ge12kT\cdot2^{2B}\qquad E_{mismatch}\propto\frac{(g_m/I_D)^2A_{VT}^2}{L}\,\mathrm{SNR}}
$$

By either mechanism, thermal ($kT/C$) or mismatch (Pelgrom), analog MAC energy is **linear in SNR**, so ×4 per bit. Digital cost grows only polynomially in bits. The curves cross once, which bounds where analog can win (27g4; Murmann 2021; Rekhi 2019; Gonugondla 2022). Workloads need about 10–40 dB of compute-SNR depending on the layer, and analog costs 2× (charge-summing) to 4× (charge-redistribution) more energy per 6 dB (27n7; Gonugondla 2022).

> [!tip] Remark
> The mismatch form is Pelgrom's $\sigma_{V_{TH}}=A_{VT}/\sqrt{WL}$ turned into energy through the gm/ID form of offset in [[Nonlinearity and Mismatch#The $g_m/I_D$ Form]]. The thermal form is [[Noise#Dynamic Range and the Size of C]]: halving noise voltage needs 4× the capacitance.

### Wire IR Drop

```tikz title="Column wire as a resistor ladder: the segment nearest the sense node carries all N cell currents, the far one carries one, so the worst-case droop is about half r_w i N^2, and it depends on every active input and stored weight. After Zettelkasten 27f2; Luquin et al. (2025), Fouda et al. (2021)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ground]{} node[left=6pt,font=\scriptsize] {sense node (virtual gnd)};
  \draw (0,0) to[R,l_=$r_w$,a^=\scriptsize$Ni$] (0,1.6) to[R,l_=$r_w$,a^=\scriptsize$(N{-}1)i$] (0,3.2);
  \draw[dashed] (0,3.2) -- (0,3.9);
  \draw (0,3.9) to[R,l_=$r_w$,a^=\scriptsize$i$] (0,5.5);
  \foreach \y/\l in {1.6/1,3.2/2,5.5/N} { \draw (2.2,\y) to[I,l_=\scriptsize$i$] (0,\y); \node[right,font=\scriptsize] at (2.2,\y) {cell \l}; }
  \draw[->] (4.4,0) -- (8.6,0) node[below left,font=\scriptsize] {node $n$ (cells from sense node)};
  \draw[->] (4.4,0) -- (4.4,5.0) node[left,font=\scriptsize] {$\Delta V(n)$};
  \draw[thick,domain=0:4,samples=30] plot ({4.4+\x},{2*\x-\x*\x/4});
  \draw[dashed] (8.4,4.0) -- (4.4,4.0) node[left,font=\scriptsize] {$\tfrac12r_wiN^2$};
  \node[font=\scriptsize,anchor=west] at (5.7,0.8) {$\Delta V(n)=r_wi\left[nN-\tfrac{n(n-1)}2\right]$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\varepsilon\approx\tfrac12r_w\bar GN^2\quad\Rightarrow\quad N_{crit}=\sqrt{\frac{2\varepsilon}{r_w\bar G}}}
$$

With $i=\bar GV_{read}$, $V_{read}$ cancels: a bigger read voltage does not help. With $r_w=3.1\ \Omega$ per cell (M3 at a 1.4 nm node) and $\bar G=10\ \mu$S (an order-of-magnitude estimate mixing two technologies), $\varepsilon\approx6\%$ at $N=64$ and $26\%$ at $N=128$, and $N_{crit}\approx25$ rows for 1 % (27f2). It matches simulation: 7 nm ResNet-20/CIFAR-10 stays at the 92.8 % baseline on a $64\times64$ 8T-SRAM array and collapses to 47.8 % at $128\times128$ (Victor 2024). IBM's tile modelling calls IR drop "the most significant circuit non-ideality" (Luquin 2025).

The worst part: both droop terms depend on the whole input vector and weight matrix, so the tile is **no longer a linear map** $\mathbf I=\tilde{\mathbf G}\mathbf x$ for any fixed $\tilde{\mathbf G}$, and Gaussian-noise training does not fix it.

> [!note]- Detail: wordline vs bitline droop, and the $g_m/I_D$ path
> $I_j=\big[\sum_i\tilde G_{ij}V_i\big]/\big[1+R_cG_c(\mathbf x)\big]$. **Row (wordline) droop** lives inside the sum as a rescaled weight $\tilde G_{ij}=G_{ij}[1-f(i,j)]$, which programming can absorb. **Column (bitline) droop** is a divisor outside the sum that depends on which inputs are active; it cannot be pre-programmed (27f7; Fouda 2021; Lee 2022).
>
> In transistor cells (8T SRAM, FeFET) the more critical path is the **source** side: a source rise $\Delta V_S$ degenerates the access device, $\Delta I/I\approx(g_m/I_D)\Delta V_S$. At 10–15 S/A that is 10–15 % of cell current per 10 mV (27f2; Victor 2024). Lower $g_m/I_D$ trades headroom for insensitivity, the same rule as a mirror on a resistive ground line ([[DACs#Ground-Line IR Drop]] is the DAC version).
>
> **Fixes:** fewer active rows (moves along the $e_{ADC}\varepsilon$ hyperbola above), segmentation, wider metal, IR-drop-aware training (Fouda 2021), or closed-loop programming under realistic loading so the stored weights absorb the drop. The last is claimed in a Mythic patent (US12531129B1), not in peer-reviewed measurement (27k6, flagged).

### Drift, Read Noise and Temperature

$$
\boxed{G(t)=G(t_0)\left(\frac{t}{t_0}\right)^{-\nu},\quad\nu\approx0.06\ \text{(90 nm PCM)}}
$$

- **PCM drift.** The melt-quenched amorphous phase structurally relaxes, giving a power law in time (Joshi 2020; Le Gallo 2020). Because it is multiplicative, a reference cell that ages with the weights cancels the common exponent: $g/g_{REF}\propto(t/t_0)^{-(\alpha-\alpha_{REF})}$, turning a growing bias into a spread set by $\mathrm{Var}[\alpha]$ (27d7; Ambrogio 2019). After compensation accuracy still falls **linearly in log time**, $A(t)\approx A_0-\kappa\sigma_\alpha\ln(t/t_0)$, so a number without $(t,T)$ and compensation state is not a measurement (27d12).
- **RRAM relaxation.** Intermediate filament states are metastable and relax toward the fully-on or fully-off gap (27d8; Zhao 2017).
- **Read noise.** Integrating for $T$ turns white noise into $S_w/2T$ but $1/f$ noise into $K\ln(T_{obs}/T)$, so averaging beats flicker only logarithmically (27d2; Luquin 2025). Raising $V_{read}$ helps against the fixed periphery noise but not against the device's own current-proportional $1/f$, and read disturb grows as $\exp(V_R/V_0)$: the read voltage is bounded from both sides (27d10, flagged needs-source in the Zettelkasten).
- **Temperature** moves both the device and the peripheral transfer function (27d9; Guo 2017).

> [!tip] Remark
> Flicker noise that integrating cannot remove is the same $1/f$ problem [[Nonlinearity and Mismatch#Correlated Double Sampling Offset Cancellation Removes $1/f$ Noise]] attacks with CDS.

### What Training Can and Cannot Absorb

Hardware-aware training minimizes $\mathbb E_\delta[\mathcal L(\mathbf W+\delta)]$, which adds $\tfrac{\sigma^2}2\mathrm{tr}(\mathbf H)$ to the loss and pushes the network to flat minima (27k1; Joshi 2020). It absorbs errors that are **zero-mean and input-independent** (programming spread, read noise). It does not absorb data-dependent or accumulating ones: IR drop, ADC clipping, drift bias (27d6). For LLMs noise injection is not enough: the fixed 8-bit input range and the globally static ADC output range bind (27k5). Off-the-shelf Phi-3-mini lost 8.01 % average accuracy under analog noise; recovering to 3.81 % took 20 B tokens of hardware-aware distillation on 96 V100s for ≈230 h (Büchel, NeurIPS 2025; 27n3).

> [!note]- Detail: training *in* the array, briefly
> The outer-product update (Bernoulli pulse trains on rows and columns, coincidences ∝ $x_i\delta_j$) does a rank-one update in $O(1)$ (Gokmen 2016; 27j2). But conductance update is nonlinear and asymmetric, $U=w+\Delta wF(w)-|\Delta w|G(w)$, and the $|\Delta w|$ term rectifies noise into a bias, so analog SGD provably does not converge to the optimum (27d4, 27j1). Tiki-Taka splits the weight across two arrays so the asymmetry becomes an attractor (Gokmen 2020; 27j5). The resistive-processing-unit spec (≥$10^3$ states, ≤5 % asymmetry) is met by no existing device (27j3). This note treats inference; training is out of scope beyond this fold.

## Level 4: Analog vs Digital: The Full Accounting

### Digital In-Memory Compute Is the Real Competitor

Keep the weights in SRAM and read all rows at once, but make each cell's product a logic level (a NAND) and replace the ADC with an adder tree. No converter, no reference, no corners, and the result is bit-exact. Its cost per MAC has no term that amortizes over rows; analog's ADC divides by the row count (27i2).

From a validated 28 nm cost model, INT8, no sparsity (Sun/Houshmand/Verhelst 2024):
- Analog peak macro efficiency improves ~10× from $32\times32$ to $1024\times1024$ purely by amortizing the ADC/DAC; digital is flat in array size.
- **Digital wins TOPS/W at $64\times64$ and below**, analog above.
- **Digital wins TOPS/mm² at every size**: an adder tree is faster than an ADC.
- On the four MLPerf Tiny networks at system level, digital has higher TOPS/mm² and *similar* energy efficiency.

> [!warning] Unverified
> The specific digital-CIM macro figures usually quoted (e.g. 89 TOPS/W at 22 nm, 254 TOPS/W at 5 nm, and a 397 vs 405 TOPS/W digital-vs-analog comparison at 28 nm) come from papers the Zettelkasten could not obtain (27i2, 27a3). The model-based conclusions above come from the one validated study that was read.

### Macro vs System, and How to Read a Benchmark

$$
\boxed{\frac{\eta_{sys}}{\eta_{macro}}=\frac{U}{1+r}}\qquad\boxed{\eta_{1b}=\eta\,b_ib_w}
$$

$U$ is array utilization, $r$ the wrapper-to-macro power ratio. Measured: IBM's PCM tile at 20.0 TOPS/W gives 6.94 chip-sustained (Ambrogio, Nature 2023); HERMES-64 at 9.76 TOPS/W at full MVM utilization gives 6.88 on a real ResNet-9 layer (Le Gallo, Nat. Electron. 2023) (27n4). In the one architecture that publishes a breakdown, the digital wrapper (register files, vector units, buses, network, converters excluded) is 32.6 % of node power and 70.8 % of node area (27l5).

Read every result with four questions: **precision** (bit-normalize; 1-bit vs 8-bit is 64×), **energy boundary** (what is inside), **retraining** (was the model hardware-aware-trained), **time and temperature since programming**. Together they move efficiency by more than 180× and accuracy by about 20 points (27n10). Baselines matter too: the same 336 M-MAC model on three shipping digital edge parts spans 21.5 to 1359.6 MMAC/J, a 63× spread among digital choices alone (27n9; Capogrosso 2026).

> [!note]- Detail: why peak TOPS/W and TOPS/mm² pull apart
> Along the number of rows $N$ per conversion, $\eta=1/(E_{cell}+E_{ADC}/N)$ rises while density $D\propto1/(NA_{cell}+A_{ADC})$ falls, because the same $N$ that amortizes the converter forces it to more bits, longer conversions and more area. A record in one is bought from the other (27n5). Energy is also data-dependent: a column's read energy scales with $\sum_jG_jx_j$, the answer it computes, and fixed-energy models miss per-layer energy by 28 % on average, 70 % worst case (27n6; Andrulis 2024 CiMLoop).

### The Owner's Analysis: Analog IMC vs Systolic Arrays

From the owner's write-up (`Notes/Analog Design/Analog IMC v Systollic Arrays.txt`; ASAP7, a predictive non-fabricable 7 nm PDK). **Thesis:** a transformer GEMM/GEMV runs as a compute-bound prefill and a memory-bound decode. Analog IMC is denser in tok/s/mm² than a systolic array and has a higher compute ceiling, at the cost of being harder to design. Compared against published systolic numbers (e.g. Etched's Sohu) and a synthesized INT8 systolic baseline.

**Architecture:** a streaming, **charge-domain** IMC die. Weights stream from HBM into analog tiles just ahead of the activations that use them; each tile multiplies by passive charge sharing ($Q=CV$, the column sums the charges) and reads out once per weight column. A digital rail handles attention, softmax and the KV cache.

| Block | Implementation (owner's) | Key numbers (owner's tags) |
|---|---|---|
| B1 Weight store | Gain cell, W8 as two 4-bit slices of charge on MOM caps (MSB 1 fF, LSB 0.25 fF units), differential | 8 rows × 256 columns × 2 slices per tile; write 0.70 fJ/bit; retention ≥1.32 µs; needs a buffered output: 5T per bit, not 3 |
| B2 Row drive | Bit-serial $\lvert x\rvert$ planes on 0/V rails, 6-tick (0.849 ns) slots, 7 slots per word | Settling 0.067 % at the share edge; $R_{PDN}\le0.4\ \Omega$ per tile; 108 pJ per pass |
| B3 Column | Bootstrapped share switch, $C_{col}=56$ fF, ping-pong banks, 1:16 MSB/LSB charge merge on the idle bank | Merge hidden under the next pass; 88 pF of bank caps per tile (not yet priced) |
| B4 Column ADC | Noise-aware 12-bit SAR: 6 decisions on a fast double-tail comparator (1.82 mV), a redundant step, 7 on a quiet one (0.60 mV); 3 columns per converter; MSB bank is the CDAC | 1.61 ns and 277 fJ per conversion; 86 converters per tile |
| B5 Reference | Class-A buffered CDAC reference per tile | ≤3.7 µV droop spec; the Verilog-A bench shows 130 µV (open) |

Selected rows of the owner's Pareto table:

| Design point | tok/s | TOPS/W | What it trades |
|---|---|---|---|
| **Chosen:** bit-serial 6-tick, 12-bit two-comparator SAR, 3 cols/ADC, banks in their own MOM area | **49,168** | **13.21** | Every known cost priced |
| Same, bank caps stacked under the array | 66,565 | 11.60 | +35 % tok/s, −12 % TOPS/W, if layout allows |
| 4 columns per converter | 43,196 | 12.78 | Conversion binds the pass at 7.36 ns: −12 % tok/s |
| Time-domain (VTC) SAR, charge-reservoir reference | 34,976 | 27.17 | TOPS/W end: −35 % tok/s for 2.6× TOPS/W vs the KV8 tok/s end |
| PWM inputs ($2^8$ steps) | 17,548 | 27.55 | Why PWM is rejected: −50 % tok/s, no TOPS/W gain |
| StrongARM SAR, 4-level buffered rows | 68,890 | 10.88 | **Infeasible:** level buffers do not settle (0.64 %), StrongARM noise fails by 7.9 dB |
| Systolic, synthesized INT8 PE | 46,398 | 10.61 | Baseline |
| Systolic, literature INT8 PE | 61,005 | 18.30 | Strongest baseline |

> [!tip] Remark: how the owner's numbers line up with the literature
> - The design is built exactly around the levers above: **bit-serial input** (no row DAC, [[#Time Domain]]), **charge domain** (linearity, no static power), **column sharing** (3 per ADC, and 4 per ADC loses 12 % tok/s to conversion time: the pitch/sample-rate trade of 27h4), and a **SAR with redundancy** ([[SAR ADCs#Overlap and Redundancy]]) whose fast-then-quiet comparators spend noise only on the LSBs.
> - **PWM is rejected** for the reason 27h9 predicts: $2^{B_x}$ time quanta cost throughput.
> - On the owner's own table the chosen point beats the synthesized systolic baseline (+6 % tok/s, +25 % TOPS/W) but **not** the literature-PE baseline on either axis; only the time-domain-SAR points beat it on TOPS/W, at lower tok/s. That matches 27n7: analog's lead depends on which baseline and which accounting.
> - The infeasible rows fail on settling and comparator noise, i.e. on the [[#Spec translation|amplifier specs]], not on the array.

### What Has Been Built

| Chip | Technology | Result | Source |
|---|---|---|---|
| NeuRRAM | 130 nm, 48 cores of 256×256 1T1R RRAM, 3 M devices | 1.6–2.3× lower EDP, 7–13× throughput per M cells vs prior RRAM-CIM; voltage-mode sensing | Wan, Nature 2022 (27m1) |
| HERMES core | 14 nm + PCM, single core | 10.5 TOPS/W, 1.59 TOPS/mm² at 1 GHz, 0.8 V, MVM only; CCO-based ADCs | Khaddam-Aljameh, JSSC 2022 (27m2) |
| HERMES 64-core | 14 nm + PCM | 9.76 TOPS/W MVM → 6.88 on ResNet-9 once on-chip digital and network are counted | Le Gallo, Nat. Electron. 2023 |
| IBM 34-tile | 14 nm, 35 M PCM devices, 512×2048 tiles, duration-domain inter-tile links | Software-equivalent keyword spotting (86.14 %); RNNT WER 9.258 % vs 7.452 % software; 12.4 TOPS/W chip-sustained | Ambrogio, Nature 2023 (27m3, 27n7) |
| Mythic M1076 | 40 nm NOR flash | Tens of TOPS, no DRAM access | Capogrosso 2026 (27m5) |

> [!warning] Unverified
> Mythic's ≈8 TOPS/W comes from vendor documentation, not a peer-reviewed measurement (27m5). A compilation row lists 5.2 TOPS/W and 16.6 TOPS peak MVM (Le Gallo 2023, arXiv Extended Data), itself digest-derived.

## Level 5: Analog Solvers and Physical Optimisation

Same structure as the MAC, run as a dynamical system: **encode the objective in the physics, let it settle, read the state.** The revival is driven by the memory wall, not by new physics: a local Ising search reads $\Theta(KN^2)$ couplings per anneal on any substrate, so the substrate changes only the cost and parallelism of those reads, and the strongest demonstration of the period, Fujitsu's Digital Annealer, is fully digital (28a3; Aramon 2019).

### The Integrator Solves an ODE

$$
\boxed{\dot v_{out}=-\frac{v_{in}}{RC}\qquad t=RC\,\tau}
$$

With the summing node at virtual ground, all of $v_{in}/R$ flows into $C$; feed $-f(v_{out})$ back and the transient *is* the solution of $dy/d\tau=f(y)$ in machine time $RC\tau$ (28a2; Guo 2016). Limits:
- **Stiffness:** time-scaling by $k$ scales every eigenvalue; the fastest must stay below the integrator's unity-gain frequency and the slowest above its drift, so the representable stiffness is $S_{max}=f_u/f_{drift}$, independent of $k$ (28i1).
- **Magnitude scaling:** one fixed dynamic range $\mathrm{DR}=V_{FS}/v_{n,rms}$ per trajectory (28i2).
- **Accuracy:** a modern 65 nm continuous-time accelerator solved van der Pol with 4.6 % RMS error after calibration, about **4.4 bits** (28i3; Guo 2016, Sun 2026 review).
- Historically the op-amp analog computer died of **setup time and recalibration**, not speed: $S_{eff}=S_{raw}/(1+T_{setup}/(RT_{solve}))$ (28a4).

> [!tip] Remark
> The integrator is the op-amp integrator of [[Operational Amplifiers]]; $f_u$ is its unity-gain bandwidth and $f_{drift}$ is set by its offset and leakage ([[Nonlinearity and Mismatch#Input-Referred Offset]]).

### One-Step Linear Solves

```tikz title="One-step matrix inversion: put the conductance array in the feedback path of op amps whose inputs are virtual grounds. KCL at each input forces G v + i = 0, so the outputs settle to v = -G^{-1} i. After Sun et al. (PNAS 2019, 2020)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum height=0.9cm,minimum width=1.6cm,align=center,fill=gray!8}}
  \node[circle,draw,thick,inner sep=2pt] (s) at (0,0) {$\Sigma$};
  \node[blk] (a) at (2.6,0) {$-A$\\[-2pt]\scriptsize op amps};
  \node[blk] (g) at (2.6,-1.8) {$\mathbf G$\\[-2pt]\scriptsize crossbar};
  \draw[<-] (s.west) -- ++(-1.2,0) node[left] {$\mathbf i$};
  \draw[->] (s) -- (a) node[midway,above,font=\scriptsize] {virtual gnd};
  \draw[->] (a.east) -- ++(1.6,0) node[right] {$\mathbf v$};
  \draw[->] (4.6,0) |- (g.east);
  \draw[->] (g.west) -| (s.south) node[near end,left,font=\scriptsize] {$\mathbf G\mathbf v$};
  \node[font=\scriptsize,anchor=west] at (5.0,-1.0) {$A\to\infty:\ \mathbf G\mathbf v+\mathbf i=0$};
  \node[font=\scriptsize,anchor=west] at (5.0,-1.6) {$\Rightarrow\ \boxed{\mathbf v=-\mathbf G^{-1}\mathbf i}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathbf v=-\mathbf G^{-1}\mathbf i,\qquad t_s\simeq\frac{\kappa_\lambda(S^{-1}G)\ln(1/\varepsilon)}{\omega_t}}
$$

The loop reaches equilibrium only if every eigenvalue of $S^{-1}G$ has positive real part, and the $O(N^3)$ of elimination reappears as a **conditioning-dependent settling time**, not a function of $N$ (28h2, 27o1; Sun, PNAS 2019 and 2020). Positive feedback without an input gives a physical power iteration for the dominant eigenvector, conditioning-limited the same way (28h7).

**Mixed-precision refinement** makes the analog error disappear from the answer. In $x_{k+1}=x_k+\tilde M^{-1}(b-Ax_k)$ with the residual formed digitally, the analog inverse $\tilde M^{-1}=A^{-1}+E$ only sets the contraction $\rho\le\kappa(A)\eta$, $\eta=\|E\|/\|A^{-1}\|$: **array precision buys iteration count, never the final accuracy**, which is $\lesssim\kappa(A)u_{digital}$, unless $\kappa(A)\eta\ge1$ and it never converges (28h1, 28h5; Le Gallo, Nat. Electron. 2018). This is the one place analog beats digital most clearly, because a linear system has a computable residual and a neural network does not (27o4).

> [!tip] Remark
> The settling-time law is closed-loop settling with a gain-bandwidth $\omega_t$, as in [[Stability]] and [[Switched-Capacitor Circuits#Unity-Gain Sampler Gain Error and Settling]]; here the "feedback factor" is the matrix, and its worst eigenvalue plays the role of $\beta$.

**Where latency beats precision: MIMO detection.** The solved vector is rounded onto an $M$-QAM constellation, so any error below half the decision distance is discarded: the solver needs relative accuracy $1/(\sqrt M-1)$, about **3.9 bits at 256-QAM** (28h6; Mannocci 2026). Every iteration of a mixed-precision solver crosses the analog–digital boundary, and the conversion energy $E_{ADC}(b)$ (exponential in $b$) competes with array energy $Ne_{dev}$ (linear in $N$) (28m4, flagged needs-source).

### Hopfield Networks Are Ising Machines

$$
\boxed{E=-\tfrac12\sum_{ij}T_{ij}V_iV_j-\sum_iI_iV_i,\qquad \frac{dE}{dt}\le0\ \ (T_{ij}=T_{ji})}
$$

A symmetric Hopfield network always runs downhill on this energy, which in the high-gain limit is the Ising Hamiltonian with $T_{ij}$ the coupling and $I_i$ the field (28b1; Hopfield 1982, 1984). The 1985 travelling-salesman results did not replicate, and the failure was structural: an $n$-city tour as an $n\times n$ neuron array puts $n!$ feasible states among $2^{n^2}$ corners, a fraction $e^{-\Theta(n^2)}$ (28b3; Hopfield & Tank 1985). Penalty weights trade feasibility against optimality with no universal setting (28b5).

### Oscillator Ising Machines

```tikz title="Second-harmonic injection locking (SHIL) makes each oscillator's phase a spin: the injected 2 omega_0 tone gives a phase potential with minima only at 0 and pi. Couplings between oscillators then tilt the wells toward the Ising ground state. After Wang & Roychowdhury (2019), Zettelkasten 28d1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (7.0,0) node[below left] {phase $\phi$};
  \draw[->] (0,-1.3) -- (0,1.5) node[above] {$U(\phi)$};
  \draw[thick,domain=0:6.28,samples=80] plot ({\x},{-cos(2*\x r)});
  \draw (0,-0.1) -- (0,0.1); \node[below left,font=\scriptsize] at (0,0) {$0$};
  \draw (3.14,-0.1) -- (3.14,0.1); \node[above,font=\scriptsize] at (3.14,0.1) {$\pi$};
  \node[below,font=\scriptsize] at (6.28,-1.05) {$2\pi$};
  \fill[red!60] (0.05,-0.95) circle (3pt); \fill[blue!60] (3.14,-0.95) circle (3pt);
  \node[font=\scriptsize,anchor=west] at (0.2,-1.3) {$s=+1$}; \node[font=\scriptsize,anchor=west] at (3.35,-1.3) {$s=-1$};
  \node[font=\scriptsize,anchor=west] at (4.2,1.25) {$\dot\phi=-K_s\sin2\phi$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\dot\phi=-K_s\sin2\phi\ \Rightarrow\ \phi\in\{0,\pi\}}\qquad\boxed{b_{eff}=-\log_2\!\big(\sqrt{12}\,\sigma_r\big)}
$$

- **Binarization by injection locking:** a $2\omega_0$ SYNC tone makes the locking function $\pi$-periodic, so the only stable phases are 0 and π, with eigenvalue $-2K_s$ (28d1; Wang 2017, 2019). Too much SHIL freezes the machine before it searches (28d5); the locking range bounds the coupling strength (28d10).
- **Couplers dominate area:** all-to-all needs $\binom N2$ programmable couplers against $N$ oscillators, so area per spin grows as $a_cN/2$ (28d2; Lo 2023, 48-node CMOS OIM).
- **Coupling precision is set by mismatch, not DAC bits:** $\sigma^2=J_{max}^22^{-2b}/12+\sigma_r^2J^2$ saturates at $b_{eff}$, about **5 bits at 1 % matching, 8 at 0.1 %** (28d3). Below roughly 5–8 bits the hardware's ground state can be a *different* configuration from the intended one (28m2; Sevenants 2024).
- **Phase noise is temperature:** adding phase diffusion gives a stationary distribution $\propto e^{-KH/D}$, so $k_BT_{eff}/J=D/K$ with $D=(2\pi f_m)^2\mathcal L(f_m)$ read off the $1/f^2$ region of the phase-noise plot (28d6).

> [!tip] Remark
> Injection locking, lock range and $\mathcal L(f_m)$ are owned by [[Oscillators]]; the coupling-precision law is the same Pelgrom-limited matching as [[DACs#Random Mismatch and Unit Sizing]], here capping effective coupling bits.

> [!note]- Detail: the rest of the solver zoo, and the cautionary pattern
> - **Coherent Ising machines** binarize by optical-parametric-oscillator symmetry breaking: $\dot c=(p-1-c^2)c$ pitchforks to $c=\pm\sqrt{p-1}$ (28e1).
> - **p-bits** set the energy barrier $\Delta\lesssim kT$ instead of 40 kT, so the bit resamples itself every 10 ps–1 ns with a tunable mean (28f1; Camsari 2017).
> - **Thermodynamic computing**: a Langevin system in $U=\tfrac12x^\top Ax-b^\top x$ equilibrates to $\mathcal N[A^{-1}b,\beta^{-1}A^{-1}]$, but the moments come from a finite trajectory, so error falls only as $\tau^{-1/2}$ (28j1). Its matrix inversion is first-order identical to preconditioned gradient descent (28j4; Kirsten 2026).
> - **The pattern:** a physical mechanism is claimed as the source of an advantage, shown to be a known algorithm, then run digitally and beats the hardware. OIM phase dynamics are the rank-two Burer–Monteiro relaxation of MaxCut (28d7); simulated bifurcation on one FPGA reached a better mean cut on the 2000-node $K_{2000}$ in 0.5 ms than the coherent Ising machine in 5 ms (28g1; Goto 2019). Analog and digital Ising hardware now run the same update, $s_i\leftarrow\mathrm{sgn}[f(\sum_jJ_{ij}s_j)-\vartheta]$, and differ only in update rate, a memory-distance quantity (28g7).
> - **Complexity:** an analog model that charges neither for precision nor for trajectory length "solves" PSPACE-complete problems; charge either and it collapses to Turing-equivalent (28l1). Continuous-time SAT solvers buy polynomial time with exponentially growing auxiliary variables, i.e. unbounded dynamic range on a rail that has none (28m1).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ Rows per conversion $N_a$ | ADC amortization, TOPS/W | IR drop ($\propto N_aN$), more ADC bits ($\log_2N$), lower TOPS/mm²; on/off ratio limit $(r-1)/2$ |
| ↑ ADC resolution $B$ | Compute-SNR (up to $\mathrm{SNR}_a$) | ×4 energy per bit above the 5–7 bit corner; area |
| Truncate ADC by $\tfrac12\log_2N$ | Energy, area | Clipping of rare large sums |
| Columns per ADC $S$ ↑ | Area | Sample rate $S/t_{read}$, S/H per column, throughput (owner: 3→4 cols costs 12 % tok/s) |
| Bit-serial inputs | No row DAC; ADC needs $B_x$ fewer bits | $B_x$ passes per MVM |
| PWM inputs | No amplitude linearity needed | $2^{B_x}$ time quanta (owner: −50 % tok/s) |
| Charge domain instead of current | Linearity (ratio), no static power | $C_P/C$, PVT through comparator and LSB; $kT/C$ floor |
| TIA front end | Fast, continuous | Static $I_D\propto2^B$ per column |
| Integrator front end | Capacitor-defined gain | Column busy for $CV_c/I_{col}$ |
| Lower $g_m/I_D$ in the bitcell | Insensitive to source-line IR drop, $V_{GS}$ error, noise | Headroom, current |
| Weight slicing over more devices | Weight precision beyond ~4 bits/device | Area, more columns and conversions |
| Reference columns / cells | Cancel $G_{min}$ background and common drift | Area, a column of ADC |
| Keep the inter-tile path analog | Removes conversions | Errors add as $\sqrt K$; lower per-stage resolution |
| Analog solver + digital residual | Final accuracy from digital | Conversions every iteration; diverges if $\kappa(A)\eta\ge1$ |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Current-domain MAC | $I_j=\sum_iG_{ij}V_i$ |
| Charge-domain MAC | $V_{MAC}=\sum_iC_iV_i/(\sum_iC_i+C_P)$ |
| Time-domain MAC | $Q_j=V_rt_q\sum_iG_{ij}x_i$ |
| Arithmetic intensity, memory-bound | $I=B/b_w$; memory-bound if $I<P/\beta$ |
| Levels per device | $L=(G_{max}-G_{min})/(k\sigma_G)$ |
| On/off-ratio limit | $N_a\le(r-1)/2$; $2^A\le(r-1)/2$ |
| ADC bits (exact) | $B_{ADC}=\log_2N+B_w+B_x$ |
| $kT/C$ column | $C\ge12kT2^{2B}/V_{FS}^2$, $E\ge12kT2^{2B}$ |
| ADC energy model | $E_{ADC}=k_1[B+\log_2(V_{DD}/V_c)]+k_2(V_{DD}/V_c)^24^B$, $k_1\approx100$ fJ, $k_2\approx1$ aJ |
| Accuracy bound | $\mathrm{SNR}_T=(\mathrm{SQNR}_i^{-1}+\mathrm{SNR}_a^{-1}+\mathrm{SQNR}_y^{-1})^{-1}\le\mathrm{SNR}_a$ |
| Mismatch-limited energy | $E\propto(g_m/I_D)^2A_{VT}^2\,\mathrm{SNR}/L$ |
| IR drop | $\varepsilon\approx\tfrac12r_w\bar GN^2$, $N_{crit}=\sqrt{2\varepsilon/(r_w\bar G)}$ |
| TIA | $g_m\ge I_{col}2^B/V_{read}$, $I_D=g_m/(g_m/I_D)$, $R_f\ge kTg_m4^B/(C_{BL}I_{col}^2)$ |
| Integrator | $T_{int}=CV_c/I_{col}$ |
| PCM drift | $G(t)=G(t_0)(t/t_0)^{-\nu}$, $\nu\approx0.06$ |
| System vs macro | $\eta_{sys}/\eta_{macro}=U/(1+r)$; bit-normalized $\eta_{1b}=\eta b_ib_w$ |
| Analog integrator | $\dot v_{out}=-v_{in}/RC$, machine time $t=RC\tau$ |
| One-step inverse | $\mathbf v=-\mathbf G^{-1}\mathbf i$, $t_s\simeq\kappa_\lambda\ln(1/\varepsilon)/\omega_t$ |
| Refinement contraction | $\rho\le\kappa(A)\eta$, final error $\lesssim\kappa(A)u_{digital}$ |
| Hopfield / Ising energy | $E=-\tfrac12\sum T_{ij}V_iV_j-\sum I_iV_i$ |
| SHIL spin | $\dot\phi=-K_s\sin2\phi$ |
| Coupling bits | $b_{eff}=-\log_2(\sqrt{12}\sigma_r)$ |

## References

- **Owner's write-up:** `Notes/Analog Design/Analog IMC v Systollic Arrays.txt`: thesis, architecture, block table B1–B5, Pareto table (rows quoted in [[#The Owner's Analysis Analog IMC vs Systolic Arrays]]). ASAP7 simulation/estimate numbers with the owner's own provenance tags.
- **Zettelkasten** (`~/Documents/Projects/EDA-Tools/Helper/Circuit-Skills/AnalogTheory/`): structure notes `S27 In-Memory Computing`, `S28 Analog Solvers and Physical Optimization`; atomic notes in `Analog Compute/`. Primary sources resolved from `Analog Compute/paper/refs_auto.bib`:
  - **Primitive and roofline** (27a1–a3, 27b2, 27l1, 27l2, 27l8, 27n2): Hopfield, PNAS 1984; Ielmini & Wong, Nat. Electron. 2018; Sebastian et al., Nat. Nanotech. 2020; Murmann et al., 2021; Jebali et al., Nat. Commun. 2024; Leroux et al., Nat. Comput. Sci. 2025; Büchel et al., Nat. Comput. Sci. 2025; Marinella et al., 2018.
  - **Cells** (27c1–c6, 27c9, 27d1–d12, 27e1–e3, 27f3, 27i1, 27i3–i7, 27m4): Joshi et al., Nat. Commun. 2020; Khwa et al., 2022, 2024; Song et al., 2024; Shim et al., 2020; Pedretti et al., 2021; Le Gallo et al., J. Phys. D 2020; Ambrogio et al., IEDM 2019; Guo et al., 2017; Wang et al., IEEE TED 2023; Valavi et al., JSSC 2019; Verma et al., 2019; Chen et al., JSSC 2024 (PICO-RAM); Wang et al., 2023 (C-2C); Zhang et al., 2024 (ASiM); Hu et al., DAC 2016.
  - **Periphery** (27h1–h10, 27g1–g4, 27l3): Gonugondla et al., IEEE TCAD 2022; Kavishwar et al., 2025; Shafiee et al., ISCA 2016 (ISAAC); Chi et al., ISCA 2016 (PRIME); Jiang et al., 2021, 2022; Khaddam-Aljameh et al., JSSC 2022 (HERMES); Chou et al., MICRO 2019 (CASCADE); Roy et al., 2022; Rekhi et al., 2019; Shanbhag et al., 2022; Mythic patents US10523230B2, US10255205B1 (27h10).
  - **Array non-idealities** (27f1, 27f2, 27f6, 27f7, 27k6): Luquin et al., 2025; Fouda et al., 2021 (IR-QNN); Lee et al., 2022; Liu et al., ISSCC 2020; Victor et al., 2024; Mythic patent US12531129B1.
  - **Training and adaptation** (27d4, 27d6, 27j1–j5, 27k1, 27k5, 27n3): Gokmen & Vlasov, Front. Neurosci. 2016; Gokmen & Haensch, 2020; Büchel et al., NeurIPS 2025; Le Gallo et al., 2023 (AIHWKit).
  - **Benchmarking and built chips** (27i2, 27l5, 27m1–m5, 27n4–n10): Sun, Houshmand, Verhelst et al., 2024; Andrulis et al., 2024 (CiMLoop); Capogrosso et al., 2026; Wan et al., Nature 2022 (NeuRRAM); Le Gallo et al., Nat. Electron. 2023 (HERMES-64); Ambrogio et al., Nature 2023.
  - **Solvers** (27o1, 27o4, 28a2–a4, 28b1, 28b3, 28b5, 28d1–d3, 28d5–d7, 28d10, 28e1, 28f1, 28g1, 28g7, 28h1, 28h2, 28h5–h7, 28i1–i3, 28j1, 28j4, 28l1, 28m1, 28m2, 28m4): Sun et al., PNAS 2019 and 2020; Le Gallo et al., Nat. Electron. 2018 (mixed precision); Guo et al., 2016; Sun et al., 2026 (review); Hopfield, PNAS 1982; Hopfield & Tank, 1985; Wang & Roychowdhury, 2017, 2019 (OIM); Lo et al., 2023; Sevenants et al., 2024; Goto et al., 2019; Aramon et al., 2019; Camsari et al., 2017; Kirsten et al., 2026; Mannocci et al., 2026.
- **Vault cross-links** (not re-derived here): [[Data Converter Fundamentals]], [[SAR ADCs]], [[Flash ADCs]], [[DACs]], [[Noise]], [[Nonlinearity and Mismatch]], [[Switched-Capacitor Circuits]], [[MosFETs]].
