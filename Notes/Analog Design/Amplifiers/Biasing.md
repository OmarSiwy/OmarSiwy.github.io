---
title: Biasing
description: How every transistor gets its dc operating point, from coupling and self-biasing single stages to cascode bias voltages, constant-gm loops with start-up, current-mode distribution, and the regulators that give them a quiet supply.
kind: topic
status: growing
aliases:
  - Biasing
  - Bias Circuits
---

Every small-signal result in [[Single-Stage]] and [[Differential Amplifiers]] assumes the transistor already sits at the right $I_D$, $V_{GS}$, $V_{DS}$. This note is where those numbers come from. It opens with the whole bias system as a block diagram, then goes stage by stage, then into the circuits that generate bias voltages and currents, and ends with regulators. Stop after any section and the picture is still correct, just coarser.

## The big picture

```tikz title="The bias system of a mixed-signal chip. A reference fixes absolute values, the bias circuit turns them into currents that track the devices, mirrors copy them to every stage, and a regulator gives critical stages a quiet supply. After Carusone Fig. 7.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,rounded corners=2pt,align=center,minimum height=1.0cm,minimum width=2.4cm}}
  \node[blk] (ref) at (0,0) {Reference\\ \scriptsize $V_{REF}$, $I_{REF}$ (fixed)};
  \node[blk] (bias) at (4.4,0) {Bias circuit\\ \scriptsize constant-$g_m$ loop};
  \node[blk] (mir) at (8.8,0) {Mirrors\\ \scriptsize copy $I$ by $W$ ratio};
  \node[blk,minimum width=2.6cm] (amp) at (8.8,-2.6) {Amplifier stages\\ \scriptsize CS, CG, SF, diff pair};
  \node[blk] (reg) at (0,-2.6) {Regulator\\ \scriptsize quiet $V_{reg}$};
  \draw[->,thick] (ref) -- (bias) node[midway,above,font=\scriptsize] {$I$ or $V$};
  \draw[->,thick] (bias) -- (mir) node[midway,above,font=\scriptsize] {current-mode};
  \draw[->,thick] (mir) -- (amp) node[midway,right,font=\scriptsize] {$I_D$, $V_b$};
  \draw[->,thick] (ref) -- (reg) node[midway,left,font=\scriptsize] {$V_{REF}$};
  \draw[->,thick] (reg) -- (amp) node[midway,above,font=\scriptsize] {$V_{reg}$ (supply)};
  \node[font=\scriptsize,align=center] at (4.4,-1.2) {dc path for every gate:\\ ac coupling, diode, self-bias};
  \draw[->,dashed] (4.4,-1.65) -- (7.45,-2.35);
  \node[font=\scriptsize,anchor=east] at (-1.3,0.9) {noisy $V_{DD}$};
  \draw[->] (-1.3,0.9) -- (-1.3,0.55);
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Never set a current with a fixed $V_{GS}$.** $I_D \propto (V_{GS}-V_{TH})^2$ and $V_{TH}$ moves 50 to 100 mV over process: at $V_{OV}=200$ mV a 50 mV $V_{TH}$ error is a **44%** current error. Copy currents from a reference with mirrors instead.
> 2. **Every gate needs a dc path that does not fight the signal:** ac coupling with a large bias resistor, a diode connection at dc, or a self-bias loop. Two high-impedance current sources in series must be given a dc feedback path, or one goes to triode.
> 3. **A self-biased loop with one resistor fixes $g_m$, not $I_D$:** $g_{m1} = \frac{2}{R_S}\left(1-\frac{1}{\sqrt K}\right)$, which is $1/R_S$ for $K = 4$. It is independent of supply and of $\mu C_{ox}$, $V_{TH}$.
> 4. **Self-biased loops have a zero-current solution** and need a start-up circuit. Check it with a ramped supply in dc and transient simulation.
> 5. **Distribute bias as currents, not voltages**, and give critical circuits a regulated supply: $V_{reg}$ tracks $V_{ref}$ through a loop around a pass device. NMOS pass: better supply rejection. PMOS pass (LDO): lower dropout.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 Bias, Reference, Regulator|three kinds of dc circuit]] → [[#Level 1 Biasing Each Stage|biasing CS, CG, SF, diff pair]] → [[#Level 2 Generating Bias Voltages|cascode bias voltages, distribution]] → [[#Level 3 Supply-Independent and Constant-gm Bias|constant-$g_m$ loops, start-up]] → [[#Level 4 Voltage Regulators|regulators, LDOs, PSRR]].

## Spec translation

Most of a bias network has no amplifier in it: its specs land directly on device $L$ and $g_m/I_D$. Amplifiers appear in three places: the drain-equalizing op amp of an improved constant-$g_m$ loop (Carusone Fig. 7.7), the op amp that makes a current from a voltage ($I_{ref} = MV_{ref}/R$), and the error amplifier of a regulator. Those carry the amplifier specs.

**The block's own specs:**

| Spec | Definition | Numbers from the sources |
|---|---|---|
| Bias accuracy | Spread of $I_D$ (or $g_m$) over process | Fixed $V_{GS}$: **44%** for a 50 mV $V_{TH}$ shift at $V_{OV} = 200$ mV (Razavi §5.1); resistor-and-diode: **13%** (Carusone Ex. 7.2) |
| Supply sensitivity | $\Delta I_{out}/\Delta V_{DD}$ | Self-biased loop: $\propto 1/r_{O4}$ (Razavi Ex. 12.1) |
| Temperature behaviour | What is held constant over $T$ | Constant-$g_m$: $V_{eff}$ must rise $1.39\times$ from 300 to 373 K (Carusone §7.2) |
| Constant-$g_m$ accuracy | $g_m$ vs its target $1/R_S$ | Only as good as $R_S$; mismatch of the $K{:}1$ pair; opposite-type devices pick up $\mu_p/\mu_n$ |
| Start-up | Leaves the zero-current state on every supply ramp | $V_{TH1}+V_{TH5}+\lvert V_{TH3}\rvert < V_{DD} < V_{GS1}+V_{TH5}+\lvert V_{GS3}\rvert$ |
| Regulator dropout $V_{DO}$ | Smallest $V_{DD}-V_{reg}$ that still regulates | NMOS pass $\ge 2V_{eff}+V_{tn}$; PMOS (LDO) $\approx V_{eff}$ |
| Line regulation / PSRR | $v_{reg}/v_{dd}$ at dc / vs frequency | Mid-band gap in the **hundreds of MHz** (Carusone §7.4, Fig. 7.22) |
| Load regulation / $Z_{out}$ | $\Delta V_{reg}/\Delta i_L$ | Low $f$: $(1/g_{m1})$ divided by the op-amp gain; high $f$: $1/(j\omega C_L)$ |
| Regulation accuracy | $V_{reg}-V_{ref}$ | Set by loop gain and offset |

**What sets each one:**

| Bias / regulator spec | Inside the block | Amplifier spec that sets it ([[Single-Stage#Amplifier Specifications]]) |
|---|---|---|
| Supply sensitivity (constant-$g_m$ loop) | Drain-equalizing op amp | **DC gain** (divides the finite-$r_o$ error); **offset** (leaves a $\Delta V_{DS}$) |
| Loop stability (constant-$g_m$) | Positive loop gain $<1$; the op amp's own loop with $C_C$ | **Phase margin** of the op-amp loop |
| $I_{ref} = MV_{ref}/R$ accuracy | Op amp forcing $V_{ref}$ across $R$ | **Offset** ($V_{OS}/V_{ref}$ error), **DC gain**, **output swing** (to reach the PMOS gate) |
| Regulation accuracy | Error amplifier | **DC gain** ($V_{ref}/(1+L_0)$), **offset** |
| Line regulation | Error amplifier | **DC gain** $G_{ma}R_{oa}$ |
| PSRR above the loop's dominant pole | Error amplifier, pass device | **GBW** (loop crossover $\omega_t$), op-amp **output impedance** $R_{oa}$ (which pole dominates), op-amp **PSRR** |
| Load regulation, transient | Error amplifier driving the pass gate | **DC gain**, **GBW**, **slew rate** into $C_1+C_{gs1}$ |
| Dropout | Error-amplifier output stage | **Output swing**: up to $V_{DD}-V_{eff}$ (NMOS pass), down to $V_{DD}-\lvert V_{GS1}\rvert$ at full load (PMOS pass) |
| Regulator stability | Two poles, $\omega_{pa}$ and $\omega_{pL}$ | **Phase margin** |

$$
\boxed{\frac{\Delta V_{reg}}{V_{ref}}\approx\frac{1}{1+L_0}+\frac{V_{OS}}{V_{ref}},\qquad \mathrm{PSRR}^{-1}(0) = \frac{H_{CG}(0)}{L_0},\qquad L_0\approx G_{ma}R_{oa}\ \text{(NMOS follower)}}
$$

$$
\boxed{\frac{\Delta I_{ref}}{I_{ref}} = \frac{V_{OS}}{V_{ref}}\qquad\qquad \text{constant-}g_m\text{ loop: }\frac{\Delta I}{I}\approx\lambda V_{OS}}
$$

> [!note]- Derivation: the regulator's accuracy and line regulation (Carusone Eqs. 7.64–7.70, 7.75–7.76)
> The regulator is a unity-gain buffer: $V_{reg} = (V_{ref}+V_{OS})\frac{L_0}{1+L_0}$, so the relative error is $\approx 1/(1+L_0)+V_{OS}/V_{ref}$. From [[#Compensation and Supply Rejection]], $L_0 = G_{ma}R_{oa}\cdot\frac{R_L'}{R_L'+1/g_{m1}}\approx G_{ma}R_{oa}$ when the follower gain is near one. A supply ripple reaches the output open-loop through $H_{CG}$ and is divided by $1+L$: at dc this is Carusone's Eq. 7.76. The rejection holds only while $\lvert L\rvert\gg1$, i.e. below the loop crossover $\omega_t$, which is why mid-band PSRR is a **GBW** spec.

> [!note]- Derivation: offset in the current-making op amps
> - $I_{ref} = MV_{ref}/R$: the op amp forces $V_{ref}+V_{OS}$ across $R$, so $\Delta I/I = V_{OS}/V_{ref}$. A 1 mV offset on a 1.2 V reference is under 0.1%: this offset spec is loose.
> - Constant-$g_m$ loop with a drain-equalizing op amp (Carusone Fig. 7.7): the op amp sets the two drains equal to within $V_{OS}$, so the two currents differ by the channel-length modulation of that $\Delta V_{DS}$, $\Delta I/I\approx\lambda V_{OS}$. Also loose; gain matters more, because the residual drain difference without it is the full supply-dependent $\Delta V_{DS}$ of [[#What Limits It]].
> (Small-signal reasoning on the circuits of the sources; Carusone leaves the second as Problem 7.10.)

**Where the amplifier specs land in sizing:**

| Spec | Knob |
|---|---|
| Error-amp DC gain | $L$ of the error amplifier ($g_mr_o$) |
| Loop crossover / mid-band PSRR | Error-amp $I_D$ (low $R_{oa}$ to make the output pole dominant costs current) |
| Dropout (PMOS LDO) | Pass device at high $g_m/I_D$: $V_{DO}\approx V_{eff}\approx 2/(g_m/I_D)$ at $i_{L,max}$, so a wide device |
| Pass-device $g_{m1}$ ($Z_{out}$) | $g_{m1} = (g_m/I_D)\cdot i_L$ |
| Phase margin of the regulator | $C_{gs1}$ of that wide pass device sets $\omega_{pa}$: the dropout knob fights the stability knob |
| Error-amp output swing | High $g_m/I_D$ on its output devices |
| Bias-loop supply sensitivity | Long $L$ in the loop (both $r_o$ and flicker noise) |

> [!tip] Remark
> The method that turns these into widths is [[gm-ID Design Methodology]]; the pass device is just a large CS (LDO) or CD (NMOS) stage sized at the edge of saturation.

> [!example] Worked example: dropout
> With Carusone Ex. 7.1's $V_{tn} = 450$ mV and $V_{eff} = 200$ mV: an NMOS-pass regulator needs $V_{DO}\ge 2(0.2)+0.45 = 0.85$ V; a PMOS LDO needs $\approx 0.2$ V. At $g_m/I_D\approx 2/V_{eff} = 10$ S/A, a pass device carrying $i_L$ has $g_{m1} = 10\,i_L$, so its open-loop $1/g_{m1}$ (the NMOS case) is $0.1\ \text{V}/i_L$, divided by $L_0$ in closed loop.
> (Arithmetic on Carusone's numbers.)

## Level 0: Bias, Reference, Regulator

| Circuit | Output | Should it move with PVT? |
|---|---|---|
| **Bias circuit** | dc gate voltages that keep transistors at an operating point | **Yes**: it must track the devices it biases |
| **Reference** | a voltage or current of known absolute value (e.g. 1 V) | **No**: fixed across process and temperature ([[Bandgap References]]) |
| **Regulator** | a low-noise supply that can source load current | **No**: follows its reference, rejects supply noise |

A bias circuit is not a reference. What it should hold constant depends on what the stage needs: drain current, voltage swing, or gain. Each choice asks the bias voltage to move differently.

> [!note]- Detail: three different "constants" for one differential pair (Carusone Ex. 7.1)
> NMOS pair with resistor loads $R$ and a tail biased by $V_b$; nominally $V_{tn}=450$ mV, $V_{eff}=200$ mV, so $V_b = 650$ mV. Now let $\mu_nC_{ox}$ and $R$ fall 10% and $V_{tn}$ rise 10%. Square law, $I_D \propto \mu_nC_{ox}V_{eff}^2$, $g_m \propto \mu_nC_{ox}V_{eff}$ at fixed $W/L$:
>
> | Hold constant | Requires | New $V_b$ |
> |---|---|---|
> | Drain current | $V_{eff}\propto 1/\sqrt{\mu_nC_{ox}}$ | $495 + 200/\sqrt{0.9} = 706$ mV |
> | Drop $I_DR$ (swing) | $V_{eff}\propto 1/\sqrt{\mu_nC_{ox}R}$ | $495 + 200/0.9 = 717$ mV |
> | Gain $g_mR$ | $V_{eff}\propto 1/(\mu_nC_{ox}R)$ | $495 + 200/0.81 = 742$ mV |
>
> In every case $V_b$ must track $V_{tn}$ one-for-one. A good bias circuit has to sense several device parameters and adjust several voltages at once.
>
> Carusone prints 729 mV for the middle row. That value scales $V_{eff}$ by $1/R$ (on top of the $1/\sqrt{\mu C_{ox}}$), so it holds $I_DR^2$ fixed. Holding $I_DR$ fixed needs $V_{eff}^2 \propto 1/(\mu C_{ox}R)$, which gives 717 mV.

> [!note]- Detail: how far a resistor-and-diode "reference" drifts (Carusone Ex. 7.2)
> $V_{DD}$ through $R = 20$ kΩ into a diode-connected NMOS ($W/L = 10$, $\mu_nC_{ox} = 190\ \mu$A/V², $V_{tn} = 0.45$ V, $V_{DD} = 1.5$ V) gives $V_o = 660$ mV. With typical variations ($\mu_nC_{ox}$ −30%, $R$ −10%, $V_{tn}$ +30 mV, $V_{DD}$ +100 mV) it becomes 747 mV, a 13% shift. Good enough to bias a stage, not good enough to be a reference.

## Level 1: Biasing Each Stage

### Why Not a Fixed Gate Voltage

$$
\boxed{I_{out} \approx \tfrac12\mu_nC_{ox}\frac WL\left(\frac{R_2}{R_1+R_2}V_{DD} - V_{TH}\right)^2}
$$

A resistor divider on the gate makes $I_{out}$ depend on $V_{DD}$, $V_{TH}$ (50 to 100 mV wafer to wafer), and $\mu_n$ and $V_{TH}$ over temperature. The smaller the overdrive (more swing), the worse: $V_{OV} = 200$ mV with $V_{TH}$ 50 mV high gives $(150/200)^2 = 0.56$, a 44% current error.

> [!important]
> If $V_{GS}$ is precisely defined, $I_D$ is not. Define $I_D$ instead: generate one good $I_{REF}$ and copy it with [[Current Mirrors]]. The mirror's diode-connected device makes $V_{GS}$ whatever $I_{REF}$ needs, so $V_{GS}$ tracks $V_{TH}$ automatically.

> [!tip] Remark
> This is the square law from [[MosFETs#Regions of Operation]] read backwards. Its $V_{TH}$ and $\mu$ dependence is exactly what a diode connection cancels.

### Common-Source Stage

```tikz title="CS biasing. (a) C_B and R_B separate the dc level at X (set by the diode M_B) from the signal. (b) The large R_B built as a long triode M_R whose overdrive is set by the diode M_C, so it cannot turn off with PVT. After Razavi Figs. 5.43(c) and (e)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) ac coupling + mirror bias
  \draw (3.4,0) node[nmos](M1){};
  \node[right] at (M1.east) {$M_1$};
  \draw (M1.S) node[ground]{};
  \draw (M1.D) to[R,l=$R_D$] ++(0,2) node[vcc]{$V_{DD}$};
  \draw (M1.D) -- ++(0.8,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (M1.G) -- ++(-0.2,0) coordinate (X) node[circ]{} node[above]{$X$};
  \draw (X) to[C,l_=$C_B$] ++(-1.5,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (X) to[R,l=$R_B$] ++(0,-2.4) coordinate (B);
  \draw (-0.6,-2.4) node[nmos,xscale=-1](MB){};
  \node[left] at (MB.east) {$M_B$};
  \draw (MB.S) node[ground]{};
  \draw (MB.D) -- ++(0.6,0) coordinate (dd) |- (MB.G);
  \draw (MB.G) -- (B);
  \draw (MB.D) ++(0,2.4) node[vcc]{$V_{DD}$} to[american current source,l_=$I_B$] (MB.D);
  \node[font=\scriptsize] at (1.8,-4.0) {(a) ac coupling; diode $M_B$ sets $V_B$};
  % (b) triode MOSFET as R_B
  \begin{scope}[xshift=8.6cm]
  \draw (4.8,0) node[nmos](N1){};
  \node[right] at (N1.east) {$M_1$};
  \draw (N1.S) node[ground]{};
  \draw (N1.D) to[R,l=$R_D$] ++(0,2) node[vcc]{$V_{DD}$};
  \draw (N1.G) -- (3.2,0) coordinate (Y) node[circ]{} node[above]{$X$};
  \draw (Y) to[C,l_=$C_B$] (1.9,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (3.2,-1.4) node[nmos](MR){};
  \node[right] at (MR.east) {$M_R$};
  \draw (MR.D) -- (Y);
  \draw (0,-1.4) node[nmos,xscale=-1](MC){};
  \node[left] at (MC.east) {$M_C$};
  \draw (MC.G) -- (MR.G);
  \draw (MC.D) -- ++(0.6,0) |- (MC.G);
  \node[font=\scriptsize,below] at (1.6,-1.4) {$V_G$};
  \draw (MC.D) ++(0,2.2) node[vcc]{$V_{DD}$} to[american current source,l_=$I_B$] (MC.D);
  \draw (MC.S) -- ++(0,-0.4) coordinate (sb) -- (sb -| MR.S) -- (MR.S);
  \draw (sb -| MR.S) -- ++(1.2,0) node[ocirc]{} node[right]{$V_B$};
  \node[font=\scriptsize] at (2.0,-4.0) {(b) $R_B$ = long triode $M_R$; $M_C$ sets its overdrive};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{1}{2\pi R_BC_B} < f_{min}},\qquad \boxed{R_{on,R} = \frac{(W/L)_C}{(W/L)_R}\cdot\frac{1}{g_{m,C}}}
$$

- $C_B$ passes the signal, $R_B$ passes the dc. They form a high-pass filter whose corner must sit below the lowest signal frequency.
- $X$ needs a dc path. Without $R_B$ the gate floats (and gate leakage would discharge it).
- $V_B$ comes from a diode-connected $M_B$, never a fixed voltage. Run $I_B$ at about 1/10 to 1/5 of $I_{D1}$ to save power.
- At low frequencies (audio) $R_B$ and $C_B$ get huge. $C_B$ also adds parasitics to the signal path, which caps its size even if area is free.
- Huge $R_B$ on chip: a long, narrow $M_R$ in deep triode at small overdrive. Its overdrive must be generated, not chosen: $M_C$ (sources tied together) makes $V_G - V_B = V_{GS,C}$, so $V_{TH}$ cancels. Maximize $(W/L)_C$, minimize $(W/L)_R$.

> [!tip] Remark
> $R_{on,R}$ is the deep-triode $R_{on}$ from [[MosFETs#Regions of Operation]] with the overdrive borrowed from $M_C$: $V_{OV,C} = g_{m,C}/[\mu_nC_{ox}(W/L)_C]$.

> [!note]- Detail: where the triode-resistor trick breaks (Zettelkasten 4d1)
> - The overdrive it runs at is tiny (tens of mV), so $M_C$ is really in weak inversion. $M_R$ does not turn off, but $R_{on,R}$ stops following the boxed formula and becomes exponentially sensitive to $I_B$ and temperature. Razavi's Problem 5.24 redoes it in subthreshold.
> - $M_R$'s drain is node $X$, which carries the signal, so $R_{on,R}$ is modulated by the signal. Tolerable only because it merely has to be *large*: it sets a corner far below the band.
> - $M_C$ (very wide) and $M_R$ (very long) are very different geometries; a few mV of $V_{TH}$ mismatch against a tens-of-mV overdrive is a large fractional error in $R_{on,R}$.
> - A long $M_R$ has a large distributed gate capacitance; at high frequency it couples $X$ to $V_B$.

> [!warning] Direct coupling amplifies PVT
> Driving $M_1$'s gate straight from the previous stage's drain ($V_{DD}-R_{D2}I_{D2}$) removes $C_B$, but any PVT shift in $I_{D2}$ moves $I_{D1}$ too: bias errors are indistinguishable from signal and get amplified down the chain. Acceptable only for low per-stage gain (about 2 to 3); otherwise use negative feedback ([[Feedback]]).

### CS Stage with Current-Source Load

```tikz title="Two facing current sources fight; R_G and C_G make M_2 a diode at dc and a current source at signal frequencies. I_G shifts the output up to center the swing. After Razavi Figs. 5.45(c) and (d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \node[right] at (M1.east) {$M_1$};
  \draw (M1.S) node[ground]{};
  \draw (M1.G) -- ++(-0.6,0) node[ocirc]{} node[left,align=right,font=\scriptsize]{$V_{in}$\\(ac-coupled,\\mirror-biased)};
  \draw (0,2.4) node[pmos](M2){};
  \node[right] at (M2.east) {$M_2$};
  \draw (M2.S) node[vcc]{$V_{DD}$};
  \draw (M2.D) -- (M1.D);
  \draw (0,1.2) node[circ]{} coordinate (O) -- (2.6,1.2) node[ocirc]{} node[right]{$V_{out}$};
  \draw (M2.G) -- ++(-1.2,0) coordinate (N) node[circ]{} node[above]{$N$};
  \draw (N) to[R,l_=$R_G$] (N |- O) -- (O);
  \draw (N) -- ++(-1.4,0) coordinate (n2);
  \draw (n2) to[C,l=$C_G$] ++(0,-2.4) node[ground]{};
  \draw (n2) -- ++(-2.0,0) to[american current source,l_=$I_G$] ++(0,-2.4) node[ground]{};
  \node[font=\scriptsize,align=left,anchor=west] at (1.3,2.6) {dc: $M_2$ is a diode, $V_{out}=V_{DD}-|V_{GS2}|+I_GR_G$\\ ac: $C_G$ grounds $N$, $M_2$ is a current source};
\end{circuitikz}
\end{document}
```

$$
\boxed{A_v = -g_{m1}\left(r_{O1}\parallel r_{O2}\parallel R_G\right),\qquad R_G \gg r_{O1}\parallel r_{O2},\qquad \frac{1}{2\pi R_GC_G}<f_{min}}
$$

$$
\boxed{V_{out,dc} = V_{DD}-|V_{GS2}| + I_GR_G,\qquad I_GR_G \approx |V_{GS2}|-\frac{V_{DD}}{2}\ \text{centers the swing}}
$$

Two mirrored currents are never exactly equal, and KCL at the output allows only one current. The output moves until one device leaves saturation. Fix: give the node a low **dc** impedance and keep its high **ac** impedance.

- No dc current flows into $M_2$'s gate, so $V_N = V_{out}$ at dc: $M_2$ is diode-connected and carries whatever $M_1$ sets.
- Above $1/(2\pi R_GC_G)$, $C_G$ grounds $N$ and $M_2$ is a current source again.
- Without $I_G$, $V_{out}$ sits at $V_{DD}-|V_{GS2}|$, off-center. $I_G \ll I_D$ drawn from $N$ lifts it by $I_GR_G$.
- Peak-to-peak swing with $I_G$ centering: $2\left[\frac{V_{DD}}{2} - V_{OV1}\right]$ (equal NMOS and PMOS overdrives). Without it: about $2\left[V_{DD}-|V_{GS2}|-V_{OV1}\right]$.

> [!tip] Remark
> Without self-biasing, an imbalance $\Delta I$ moves the output by $\Delta I\,(r_{O1}\parallel r_{O2})$. With $M_2$ diode-connected at dc it moves by $\Delta I/g_{m2}$, smaller by the intrinsic-gain factor $g_{m2}(r_{O1}\parallel r_{O2})$. Same idea as the common-mode feedback that fully differential stages need ([[Operational Amplifiers]]).

> [!note]- Detail: why $I_G$ instead of $|V_{GS2}| = V_{DD}/2$ (Razavi Ex. 5.14)
> Choosing $|V_{GS2}| = V_{DD}/2$ also centers the output with no $I_G$. But for a fixed bias current, a larger PMOS overdrive means less noise from $M_2$ ([[Noise]]), so the $I_G$ version, which leaves $|V_{GS2}|$ free, is preferred. $I_GR_G$ is a current times a resistance and drifts over PVT unless $I_G$ is made from a reference voltage across a resistor of the same type as $R_G$ (Zettelkasten 4e1).

### Complementary CS Stage

```tikz title="Self-biased complementary CS stage: R_F makes both devices diode-connected at dc, I_1 fixes their current, C_1 removes I_1 from the signal path, C_in lets X follow V_out. After Razavi Fig. 5.47(d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \node[right] at (M1.east) {$M_1$};
  \draw (M1.S) node[ground]{};
  \draw (0,2.2) node[pmos](M2){};
  \node[right] at (M2.east) {$M_2$};
  \draw (M2.D) -- (M1.D);
  \draw (M2.S) -- ++(0,0.3) coordinate (s2);
  \draw (s2) ++(0,2) coordinate (top) node[vcc]{$V_{DD}$};
  \draw (top) to[american current source,l_=$I_1$] (s2);
  \draw (top) -- ++(1.4,0) to[C,l=$C_1$] ++(0,-2) -- (s2);
  \draw (0,1.1) node[circ]{} coordinate (O) -- (2.4,1.1) node[ocirc]{} node[right]{$V_{out}$};
  \draw (M1.G) -- (-1.4,0) coordinate (g1) -- (-1.4,2.2) coordinate (g2) -- (M2.G);
  \draw (-1.4,1.1) node[circ]{} coordinate (X) node[above left]{$X$};
  \draw (-1.4,0) -- (-1.4,-1.7) coordinate (rf);
  \draw (rf) to[R,l_=$R_F$] (0.8,-1.7) -- (0.8,1.1);
  \draw (0.8,1.1) node[circ]{};
  \draw (X) to[C,l_=$C_{in}$] (-3.4,1.1) node[ocirc]{} node[left]{$V_{in}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_X = V_{out}\ (\text{dc}),\quad I_{D1}=|I_{D2}|=I_1,\quad A_v = -(g_{m1}+g_{m2})(r_{O1}\parallel r_{O2}),\quad \frac{1}{C_1\omega_{min}}\ll\frac{1}{g_{m2}}}
$$

- Without bias help $V_{GS1}+|V_{GS2}| = V_{DD}$: the current is set by the supply against two thresholds and two mobilities, and the devices fight.
- $R_F$ carries no dc current, so both devices are diode-connected at dc and both stay saturated. If $M_1$ pulls harder, $V_{out}$ and $V_X$ fall together and the currents re-balance.
- $I_1$ fixes the current exactly; $C_1$ shorts it at signal frequencies so $M_2$ is not degenerated. Cost: $I_1$'s headroom.
- $X$ must follow $V_{out}$, so the input is ac-coupled through $C_{in}$, with a corner below $\omega_{min}$.

### Common-Gate Stage

```tikz title="CG and SF biasing. (a) A current source under the CG input passes dc without the attenuation and dc drop of a resistor. (b) A follower is biased by a current-source pull-down. After Razavi Figs. 5.48(b) and 5.49(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % CG
  \draw (2.6,2.0) node[nmos](M1){};
  \node[right] at (M1.east) {$M_1$};
  \draw (M1.G) -- ++(-0.3,0) node[ocirc]{} node[left]{$V_b$};
  \draw (M1.D) to[R,l_=$R_D$] ++(0,1.8) node[vcc]{$V_{DD}$};
  \draw (M1.D) -- ++(0.9,0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (2.6,0) node[nmos](M2){};
  \node[left] at (M2.west) {};
  \node[right] at (M2.east) {$M_2$};
  \draw (M2.D) -- (M1.S);
  \draw (M2.S) node[ground]{};
  \draw (2.6,1.0) node[circ]{} coordinate (X) node[left]{$X$};
  \draw (X) to[C,l=$C_{in}$] (4.2,1.0) to[R,l=$R_1$] (5.8,1.0) node[ocirc]{} node[right]{$V_{in}$};
  \draw (0,0) node[nmos,xscale=-1](MB){};
  \node[left] at (MB.east) {$M_B$};
  \draw (MB.S) node[ground]{};
  \draw (MB.G) -- (M2.G);
  \draw (MB.D) -- ++(0.5,0) |- (MB.G);
  \draw (MB.D) ++(0,1.9) node[vcc]{$V_{DD}$} to[american current source,l_=$I_B$] (MB.D);
  \node[font=\scriptsize] at (2.4,-1.9) {(a) CG: current source $M_2$ under the source};
  % SF
  \begin{scope}[xshift=9cm]
  \draw (2.6,2.0) node[nmos](S1){};
  \node[right] at (S1.east) {$M_1$};
  \draw (S1.D) node[vcc]{$V_{DD}$};
  \draw (S1.G) -- ++(-0.3,0) node[ocirc]{} node[left]{$V_{in}$};
  \draw (2.6,0) node[nmos](S2){};
  \node[right] at (S2.east) {$M_2$};
  \draw (S2.D) -- (S1.S);
  \draw (S2.S) node[ground]{};
  \draw (2.6,1.0) node[circ]{} -- (3.6,1.0) node[ocirc]{} node[right]{$V_{out}$};
  \draw (0,0) node[nmos,xscale=-1](SB){};
  \node[left] at (SB.east) {$M_B$};
  \draw (SB.S) node[ground]{};
  \draw (SB.G) -- (S2.G);
  \draw (SB.D) -- ++(0.5,0) |- (SB.G);
  \draw (SB.D) ++(0,1.9) node[vcc]{$V_{DD}$} to[american current source,l_=$I_B$] (SB.D);
  \node[font=\scriptsize] at (1.6,-1.9) {(b) SF: current-source pull-down};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{V_X}{V_{in}} = \frac{\frac{1}{g_{m1}+g_{mb1}}\parallel R_S}{\frac{1}{g_{m1}+g_{mb1}}\parallel R_S + R_1}}
$$

The source carries the signal, so it can't be grounded. It needs a dc path: a resistor, current source, or inductor.

- **Resistor $R_S$** (with a mirror $M_B$ setting $V_{GS1}$; scale $R_B/R_S = I_{D1}/I_B$ so the mirror sees equal $V_{GS}$): $R_S$ shunts the input, so it must be $\gg 1/(g_{m1}+g_{mb1})$. But the gain $(g_{m1}+g_{mb1})R_D$ makes $R_S$ comparable to $R_D$, so $R_S$ eats dc headroom that $R_D$ needed.
- **Current source $M_2$**: high impedance without a large $V_{DS}$. Its current has a CLM error because $V_{DS2} < V_{DS,B}$; fix it with a low-voltage cascode mirror ([[#Cascode Bias Voltages]]).

### Source Follower

- Bias with a current source (panel b). The follower's current is set by $M_2$, not by its gate voltage, so its gate can be wired straight to the previous stage.
- If CLM mismatch between $I_{D2}$ and $I_B$ matters, put a resistor in series with $M_B$'s drain ([[Current Mirrors]]).
- If the input dc level varies a lot, ac-couple it (with $R_{in}$ to $V_{DD}$ as the dc path). The gate then starts at $V_{DD}$ and can swing up one $V_{TH}$ before $M_1$ enters triode.

> [!note]- Detail: follower buffering a CS stage (Razavi Ex. 5.15)
> Direct-coupled, the CS drain must sit at least $V_{GS1}+V_{DS2,min}$ above ground to keep the follower and its current source saturated. That leaves little drop for $R_D$ and limits the CS gain. Ac-coupling the follower (with $R_B$ to $V_{DD}$ as its gate path) lets the CS gain be maximized on its own.

### Differential Pair

```tikz title="Choose the lowest input CM level that keeps the tail saturated: the drains can then fall to two overdrives above ground, giving the largest R_D. After Razavi Fig. 5.51(a)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,1.6) node[nmos](M1){};
  \node[left] at (M1.west) {};
  \draw (3,1.6) node[nmos,xscale=-1](M2){};
  \node[anchor=west] at (0.15,1.25) {$M_1$};
  \node[anchor=east] at (2.85,1.25) {$M_2$};
  \draw (M1.D) to[R,l=$R_D$] ++(0,1.8) coordinate (t1);
  \draw (M2.D) to[R,l_=$R_D$] ++(0,1.8) coordinate (t2);
  \draw (t1) -- (t2) coordinate[midway](tm); \draw (tm) node[vcc]{$V_{DD}$};
  \draw (M1.S) -- ++(0,-0.2) -| (M2.S);
  \draw (1.5,0.63) node[circ]{} node[above]{$P$} -- (1.5,0.4);
  \draw (1.5,-0.37) node[nmos](M3){};
  \node[right] at (M3.east) {$M_3$};
  \draw (M3.S) node[ground]{};
  \draw (M3.G) -- ++(-0.3,0) node[ocirc]{} node[left]{$V_b$};
  \draw (M1.G) -- ++(-0.4,0) node[ocirc]{} node[left]{$V_{in,CM}$};
  \draw (M2.G) -- ++(0.4,0) node[ocirc]{} node[right]{$V_{in,CM}$};
  % level ladder
  \begin{scope}[xshift=8.4cm]
    \draw[->] (0,-1.2) -- (0,3.6) node[above]{$V$};
    \draw (-0.1,-1.2) -- (0.1,-1.2) node[right,font=\scriptsize]{$0$};
    \draw (-0.1,-0.2) -- (0.1,-0.2) node[right,font=\scriptsize]{$V_P = V_{DS3,min}$};
    \draw (-0.1,0.8) -- (0.1,0.8) node[right,font=\scriptsize]{$V_{D1,min}=V_{DS3,min}+V_{OV1}$};
    \draw (-0.1,1.8) -- (0.1,1.8) node[right,font=\scriptsize]{$V_{in,CM,min}=V_{DS3,min}+V_{GS1}$};
    \draw (-0.1,3.0) -- (0.1,3.0) node[right,font=\scriptsize]{$V_{DD}$};
    \draw[<->] (-0.4,0.8) -- (-0.4,3.0) node[midway,left,font=\scriptsize]{max $I_DR_D$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{in,CM,min} = V_{GS1} + V_{DS3,min},\qquad V_{D1,min} = (V_{GS1}-V_{TH1}) + V_{DS3,min}}
$$

- Besides the tail current, the gate (CM) level must be defined. The lowest workable $V_{in,CM}$ leaves the most room for $I_DR_D$, so the most gain and swing.
- Pair currents are set by the tail, not by the gate voltage, so pairs can be direct-coupled. But a first stage whose outputs sit two overdrives above ground (maximum gain) gives the next pair too low a CM level. Use capacitive coupling there.

> [!tip] Remark
> The input common-mode range itself (top and bottom limits) belongs to [[Differential Amplifiers]]. Here we only pick the operating point inside it.

> [!note]- Detail: replica biasing the tail when there is no room for a cascode (Razavi Ex. 5.6)
> The tail mirror's error is $\lambda(V_{DS2}-V_{DS1})$ with $V_{DS2} = V_P$, which moves with the input CM level. A fixed resistor in the reference drain can't follow it. Instead, stack a scaled copy of the pair on top of the reference device $M_1$, its gates driven from the same nodes $A$, $B$. Its common source $P'$ then tracks $P$ for any CM level, provided both pairs have the same $L$ and $W_r/W_d = I_{REF}/I_{SS}$ (equal current density, equal $V_{GS}$). It fails if the CM rises enough to push the replica into triode. This "replica" idea recurs in [[Current Mirrors]] and regulator design.

## Level 2: Generating Bias Voltages

### Cascode Bias Voltages

```tikz title="Low-voltage cascode mirror with its bias generator. M_7 supplies a V_GS, the triode M_6 under it adds about one overdrive, so V_b = V_GS + V_OV and M_1, M_2 sit at the edge of saturation with equal V_DS. After Razavi Figs. 5.18(b) and 5.19(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % Vb generator
  \draw (0,1.6) node[nmos](M7){};
  \draw (0,0) node[nmos](M6){};
  \node[right] at (M7.east) {$M_7$};
  \node[right] at (M6.east) {$M_6$};
  \draw (M7.S) -- (M6.D);
  \draw (M6.S) node[ground]{};
  \draw (M7.D) -- ++(0,0.3) coordinate (T);
  \draw (T) ++(0,1.6) node[vcc]{$V_{DD}$} to[american current source,l_=$I_1$] (T);
  \draw (T) -- ++(-1.0,0) coordinate (tl) |- (M6.G);
  \draw (M7.G) -- (M7.G -| tl);
  \draw (M7.G -| tl) node[circ]{};
  \draw (T) node[circ]{} -- (3.2,2.67) coordinate (vb);
  \node[above,font=\scriptsize] at (1.4,2.67) {$V_b=V_{GS7}+V_{DS6}$};
  % reference cascode branch
  \draw (4,1.6) node[nmos](M0){};
  \draw (4,0) node[nmos](M1){};
  \node[right] at (M0.east) {$M_0$};
  \node[right] at (M1.east) {$M_1$};
  \draw (M0.S) -- (M1.D);
  \draw (4,0.8) node[circ]{} node[left]{$A$};
  \draw (M1.S) node[ground]{};
  \draw (vb) |- (M0.G);
  \draw (M0.D) -- ++(0,0.5) coordinate (X) node[circ]{} node[left]{$X$};
  \draw (X) ++(0,1.4) node[vcc]{$V_{DD}$} to[american current source,l_=$I_{REF}$] (X);
  \draw (X) -- ++(0.9,0) coordinate (xr) -- (xr |- M1.G) coordinate (gm);
  \draw (M1.G) -- ++(-0.3,0) |- ++(0,-0.65) -| (gm);
  % output cascode
  \draw (7,1.6) node[nmos](M3){};
  \draw (7,0) node[nmos](M2){};
  \node[right] at (M3.east) {$M_3$};
  \node[right] at (M2.east) {$M_2$};
  \draw (M3.S) -- (M2.D);
  \draw (7,0.8) node[circ]{} node[right]{$B$};
  \draw (M2.S) node[ground]{};
  \draw (gm) -- (M2.G);
  \draw (M3.G) -- ++(-0.4,0) node[ocirc]{} node[left]{$V_b$};
  \draw (M3.D) -- ++(0,0.6) node[ocirc]{} node[right]{$I_{out}$};
\end{circuitikz}
\end{document}
```

$$
\boxed{V_b \approx V_{GS3} + (V_{GS1}-V_{TH1})},\qquad \boxed{V_{GS0}+(V_{GS1}-V_{TH1}) \le V_b \le V_{GS1}+V_{TH0}}
$$

- A cascode current source needs a gate voltage $V_b$ one $V_{GS}$ plus one overdrive above the bottom rail. Stacked diodes ($V_N = V_{GS0}+V_{GS1}$) are accurate but waste one $V_{TH}$ of output headroom.
- The low-voltage cascode feeds the reference branch with the same $V_b$, so $V_{DS1} = V_b - V_{GS0}$ equals $V_{DS2}$ (when $V_{GS0}=V_{GS3}$). A valid $V_b$ exists only if $V_{GS0}-V_{TH0} < V_{TH1}$: keep the cascode overdrive well below $V_{TH}$.
- Make $V_b$ from devices, not from resistor $IR$ drops: $IR$ products don't track $V_{GS}$ over temperature. Fig. (b) above: diode $M_7$ gives the $V_{GS}$, and $M_6$ (gate tied to the top) runs in triode with a $V_{DS}$ of about one overdrive.

> [!tip] Remark
> The mirror side (why the drains must match, output impedance, compliance) is in [[Current Mirrors]]. This section is only about *producing* $V_b$.

> [!note]- Detail: other ways to make $V_b$ and their errors (Razavi §5.2)
> - Resistor in the diode's drain: $R_1I_{REF}\approx V_{TH1}$ drops $V_{DS1}$ to one overdrive, with $V_b = V_{GS3}+(V_{GS1}-V_{TH1})$. Hard to hold over PVT because $R$ and $V_{TH}$ drift differently.
> - $V_b = V_{GS5}+R_6I_6$: the $IR$ term must equal an overdrive, which doesn't track.
> - $V_b = V_{GS5} + (V_{GS6}-R_6I_6)$ with $I_6 = I_{REF}$, $R_6 = R_1$, $(W/L)_6 = (W/L)_1$: now the $V_{GS}$s track and the $IR$s track. The leftover error is body effect ($M_6$ has it, $M_1$ doesn't).
> - Fig. 5.19(a): diode $M_5$ for the $V_{GS}$, $M_6$ with $R_b$ for the overdrive. Errors: $M_5$ has no body effect but $M_0$ does, and $R_bI_1$ is not well controlled.
> - In Carusone's constant-$g_m$ bias (Fig. 7.8) the cascode biases are diodes run at **5× higher current density** than the devices they bias, so (square law) their overdrive is $\sqrt5\approx2.2\times$ larger and their $V_{GS}$ exceeds the main one by about $1.2V_{eff}$.

### Distributing Bias Across the Chip

```tikz title="Two ways to send a bias across a die. Voltage-mode puts the mirror halves far apart; current-mode keeps each pair together and sends a current. After Carusone Fig. 7.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) voltage mode
  \draw (0,0) node[nmos,xscale=-1](A1){};
  \node[left] at (A1.east) {$Q_1$};
  \draw (A1.S) node[ground]{};
  \draw (A1.D) -- ++(0.5,0) |- (A1.G);
  \draw (A1.D) ++(0,1.6) node[vcc]{$V_{DD}$} to[american current source,l_=$I_b$] (A1.D);
  \draw[very thick] (A1.G) -- (8.0,0) node[midway,below,font=\scriptsize]{long wire, $I=0$: carries a \emph{voltage}};
  \draw (9,0) node[nmos](A2){};
  \draw (A2.G) -- (8.0,0);
  \node[right] at (A2.east) {$Q_2$};
  \draw (A2.S) node[ground]{};
  \draw (A2.D) -- ++(0,0.6) node[ocirc]{} node[right]{$I_c$};
  \node[font=\scriptsize,anchor=west] at (-1.6,-1.5) {(a) voltage-mode: $\Delta V_{TH}$ and ground drop between $Q_1$, $Q_2$ go straight into $I_c$};
  % (b) current mode
  \begin{scope}[yshift=-4.0cm]
  \draw (0,0) node[pmos,xscale=-1](Q4){};
  \node[left] at (Q4.east) {$Q_4$};
  \draw (3.0,0) node[pmos](Q3){};
  \node[right] at (Q3.east) {$Q_3$};
  \draw (Q4.S) |- (0,1.1) -- (3.0,1.1) -- (Q3.S);
  \draw (1.5,1.1) node[vcc]{$V_{DD}$};
  \draw (Q4.G) -- (Q3.G);
  \draw (Q4.D) -- ++(0.55,0) -- ++(0,0.77);
  \draw (1.5,0) node[circ]{} to[C,l_=$C$] (1.5,1.1);
  \draw (Q4.D) to[american current source,l_=$I_b$] ++(0,-1.6) node[ground]{};
  \draw[very thick] (Q3.D) |- (7.5,-1.3);
  \node[font=\scriptsize] at (5.3,-1.0) {long wire carries a \emph{current} $I_d$};
  \draw[->] (6.6,-1.3) -- (7.0,-1.3);
  \draw (7.5,-2.5) node[nmos,xscale=-1](B1){};
  \node[left] at (B1.east) {$Q_1$};
  \draw[very thick] (7.5,-1.3) -- (B1.D);
  \draw (B1.S) node[ground]{};
  \draw (B1.D) -- ++(0.55,0) -- ++(0,-0.77);
  \draw (10.0,-2.5) node[nmos](B2){};
  \node[right] at (B2.east) {$Q_2$};
  \draw (B1.G) -- (B2.G);
  \draw (B2.S) node[ground]{};
  \draw (B2.D) -- ++(0,0.6) node[ocirc]{} node[right]{$I_c$};
  \draw (8.8,-2.5) node[circ]{} to[C,l=$C$] (8.8,-3.6) node[ground]{};
  \node[font=\scriptsize,anchor=west] at (-1.6,-4.3) {(b) current-mode: each mirror pair sits together; decoupling caps hold $V_{GS}$ (PMOS cap to $V_{DD}$)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Voltage-mode** (not recommended): $Q_1$ and $Q_2$ are far apart, so $V_{TH}$ gradients and ground drops between them go straight into $I_c$.
- **Current-mode** (preferred): send a current $I_d$; every mirror pair is local, so its devices match. Costs one extra branch, but $Q_1$, $Q_3$ can be small and $I_d$ low (practical floor: tens of µA; below that the bias line gets too noisy).
- One bias circuit usually feeds many blocks: its power and area are overhead.
- **Decoupling caps** on the bias gates filter noise. A PMOS gate cap goes to $V_{DD}$, not ground, so the gate follows supply noise and $V_{SG}$ (hence the current) stays constant.

> [!tip] Remark
> Why local pairs match and distant ones don't (gradients, orientation, surroundings) is in [[MosFETs#Layout]].

## Level 3: Supply-Independent and Constant-gm Bias

### Resistor Biasing Follows the Supply

$$
\boxed{I_{out} = \frac{V_{DD}}{R_1 + 1/g_{m1}}\cdot\frac{(W/L)_2}{(W/L)_1}}\qquad(\text{approx., } R_1 \text{ from } V_{DD} \text{ into a diode})
$$

A resistor is not a current source: the reference current, and every copy, scales with $V_{DD}$.

### The Self-Biased Loop

```tikz title="Supply-independent bias. M_3/M_4 force equal branch currents, M_1/M_2 with R_S fix their value. The loop also supports zero current; M_5 conducts only at power-up to escape it. After Razavi Figs. 12.3(a) and 12.5."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,3) node[pmos,xscale=-1](M4){};
  \draw (3,3) node[pmos](M3){};
  \node[left] at (M4.east) {$M_4$};
  \node[right] at (M3.east) {$M_3$};
  \draw (M4.S) |- (0,4.1) -- (3,4.1) -- (M3.S);
  \draw (1.5,4.1) node[vcc]{$V_{DD}$};
  \draw (M4.G) -- (M3.G);
  \draw (M3.D) -- ++(-0.5,0) coordinate (d3) -- (d3 |- M3.G);
  \draw (d3 |- M3.G) node[circ]{};
  \draw (0,0) node[nmos,xscale=-1](M1){};
  \draw (3,0) node[nmos](M2){};
  \node[left] at (M1.east) {$M_1$};
  \node[right] at (M2.east) {$M_2$};
  \node[left,font=\scriptsize] at (-0.7,-0.5) {$(W/L)_N$};
  \node[right,font=\scriptsize] at (3.6,-0.5) {$K(W/L)_N$};
  \draw (M4.D) -- (M1.D);
  \draw (M3.D) -- (M2.D);
  \draw (M1.G) -- (M2.G);
  \draw (M1.D) -- ++(0.5,0) coordinate (d1) -- (d1 |- M1.G);
  \draw (d1 |- M1.G) node[circ]{};
  \draw (M1.S) node[ground]{};
  \draw (M2.S) to[R,l=$R_S$] ++(0,-1.4) node[ground]{};
  \draw (0,1.5) node[left,font=\scriptsize]{$I_{REF}\downarrow$};
  \draw (3,1.5) node[right,font=\scriptsize]{$\downarrow I_{out}$};
  % start-up M5: diode-connected, PMOS-gate node -> M1 gate node
  \draw (1.7,1.6) node[nmos](M5){};
  \node[right,font=\scriptsize] at (M5.east) {$M_5$};
  \draw (M5.D) -- (M5.D |- M3.G);
  \draw (M5.D |- M3.G) node[circ]{};
  \draw (M5.D) ++(0,-0.1) node[circ]{} -- ++(-0.65,0) |- (M5.G);
  \draw (M5.S) -- (M5.S |- M1.G);
  \draw (M5.S |- M1.G) node[circ]{};
  \node[font=\scriptsize,align=center] at (1.5,-3.1) {(a) self-biased loop with $R_S$, start-up device $M_5$};
  % (b) degenerate point
  \begin{scope}[xshift=7.2cm,yshift=0.2cm]
    \draw[->] (0,0) -- (4.2,0) node[right]{$V_{DD}$};
    \draw[->] (0,0) -- (0,3.2) node[above]{$I_{out}$};
    \draw[thick,domain=0:3.9,samples=40] plot (\x,{2.5*(1-exp(-1.4*\x))});
    \draw[thick,dashed] (0.6,0.02) -- (3.9,0.02);
    \fill (0,0) circle (2pt);
    \node[font=\scriptsize,align=left,anchor=west] at (1.2,0.55) {degenerate point: $I=0$,\\ all devices off (dashed)};
    \node[font=\scriptsize,anchor=west] at (1.6,2.75) {intended point, flat in $V_{DD}$};
    \node[font=\scriptsize,align=center] at (2.0,-1.2) {(b) two solutions; start-up must\\ kick the loop off the lower one};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{GS1} = V_{GS2} + I_{out}R_S \;\Rightarrow\; I_{out} = \frac{2}{\mu_nC_{ox}(W/L)_N R_S^2}\left(1-\frac{1}{\sqrt K}\right)^2}
$$

$$
\boxed{g_{m1} = \frac{2}{R_S}\left(1-\frac{1}{\sqrt K}\right)\qquad K=4:\ g_{m1} = \frac{1}{R_S}}
$$

- Let the circuit bias itself: $I_{REF}$ is a copy of $I_{out}$, so neither depends on $V_{DD}$ (to first order).
- Without $R_S$ the loop has one equation, $I_{out} = KI_{REF}$, and supports **any** current. $R_S$ adds the second equation.
- $I_{out}$ still depends on $\mu_nC_{ox}$ and temperature; $g_m$ does not. That's why this is the **constant-$g_m$** bias: $g_m$ is set by one resistor and a size ratio.
- Every device of the same type biased from this loop gets a $g_m$ fixed by size and current ratios. Opposite-type devices pick up $\mu_p/\mu_n$, which varies chip to chip.

$$
\boxed{g_{mi} = \sqrt{\frac{(W/L)_i I_{Di}}{(W/L)_1 I_{D1}}}\, g_{m1}\ \ (\text{NMOS}),\qquad g_{mi} = \sqrt{\frac{\mu_p (W/L)_i I_{Di}}{\mu_n (W/L)_1 I_{D1}}}\, g_{m1}\ \ (\text{PMOS})}
$$

> [!tip] Remark
> Why hold $g_m$ rather than $I_D$? Gain, bandwidth ($g_m/C$), and noise all go through $g_m$ ([[MosFETs#Transconductance]]). A $g_m$ tied to $1/R$ also makes $g_mR$ gains ratio-defined when the load is a matched on-chip resistor.

> [!note]- Derivation: from the loop equation to $g_m = 2(1-1/\sqrt K)/R_S$ (Razavi Eqs. 12.2–12.4, 12.52–12.54; Carusone Eqs. 7.3–7.9)
> The PMOS mirror makes both branches carry $I_{out}$. Around $M_1$, $M_2$, $R_S$ (ignore body effect, so $V_{TH1}=V_{TH2}$):
> $$\sqrt{\frac{2I_{out}}{\mu_nC_{ox}(W/L)_N}} = \sqrt{\frac{2I_{out}}{\mu_nC_{ox}K(W/L)_N}} + I_{out}R_S$$
> The left side is $V_{OV1}$, so $V_{OV1}\left(1-\tfrac{1}{\sqrt K}\right) = I_{out}R_S$. Square and solve for $I_{out}$ for the first box (dividing by $I_{out}$ here silently assumes $I_{out}\neq0$: that's the degenerate point). Then $g_{m1} = 2I_{out}/V_{OV1} = \frac{2}{R_S}\left(1-\tfrac1{\sqrt K}\right)$.
>
> Carusone's version (Fig. 7.6) is the same loop with cascodes added: $g_{m13} = \frac{2}{R_B}\left[1-\sqrt{(W/L)_{13}/(W/L)_{15}}\right]$, and $(W/L)_{15} = 4(W/L)_{13}$ gives $g_{m13} = 1/R_B$.

### What Limits It

- **Finite $r_o$:** with $\lambda\neq0$ the current does move with $V_{DD}$. Use long channels (also less flicker noise). The sensitivity vanishes if the PMOS $r_{O4}\to\infty$.
- **Body effect:** $M_2$'s source sits at $I_{out}R_S$, so $V_{TH2}\ne V_{TH1}$. Fix: put $R_S$ in the PMOS branch with source tied to its own well (Razavi Fig. 12.3(b), Carusone Fig. 7.7).
- **Stability:** the loop is **positive feedback**. It is stable while the degenerated stage ($M_2$ with $R_S$) has gain well below 1. Parasitic capacitance across $R_S$ lowers its impedance at high frequency and can make it unstable, so an off-chip precision $R$ (with pad and board capacitance) is risky; keep at least part of $R$ on chip.
- **The resistor:** $g_m$ is only as good as $R_S$, which varies with process and temperature. A switched-capacitor resistor $R = 1/(C_Sf_{CK})$ is more reproducible when a precise clock exists.
- **Temperature and swing:** to hold $g_m = \mu C_{ox}(W/L)V_{eff}$ as $\mu\propto T^{-3/2}$ falls (about 27% from 300 K to 373 K), $V_{eff}$ must rise by $(373/300)^{3/2}\approx 1.39\times$. Headroom shrinks when hot. Design room-temperature $V_{eff}$ around 0.2 to 0.25 V (Carusone).

> [!note]- Detail: supply sensitivity with finite $r_o$ (Razavi Ex. 12.1)
> Lump $R_1 = r_{O1}\parallel(1/g_{m1})$, $R_3 = r_{O3}\parallel(1/g_{m3})$, and let $G_{m2} = I_{out}/V_X$ be the degenerated $M_2$:
> $$\frac{\Delta I_{out}}{\Delta V_{DD}} = \frac{1}{r_{O4}}\left[\frac{1}{G_{m2}(r_{O4}\parallel R_1)} - g_{m4}R_3\right]^{-1},\qquad G_{m2} = \frac{g_{m2}r_{O2}}{R_S + r_{O2} + (g_{m2}+g_{mb2})R_Sr_{O2}}$$
> When this is still too large (and it rises at high frequency through capacitive paths), the core is run from a locally regulated supply ([[#Level 4 Voltage Regulators]]).

> [!note]- Detail: the improved loops (Carusone Figs. 7.7, 7.8)
> - Fig. 7.7: PMOS pair $Q_{14}$/$Q_{15}$ (4:1) with $R_B$, source tied to body: no body effect. An op amp forces equal drain voltages, cancelling finite-$r_o$ error, and lowers the impedance at $Q_{15}$'s drain, which reduces the positive-loop gain. The op amp's own negative loop is stabilized by $C_C$.
> - Fig. 7.8 (McLaren 2001): the same core plus wide-swing cascode mirrors and their bias generators, and a start-up circuit. Four loops in all: the main positive loop, the start-up loop (disabled after start-up), and two weak positive loops that make the cascode biases. The op amp can be biased by the loop it serves.
> - Carusone's Fig. 7.6 labels $Q_{13}$ and $Q_{15}$ both 100 while the text requires $(W/L)_{15} = 4(W/L)_{13}$; follow the text.

### Start-Up

$$
\boxed{V_{TH1}+V_{TH5}+|V_{TH3}| < V_{DD} < V_{GS1}+V_{TH5}+|V_{GS3}|}
$$

- With all currents zero at power-up, every self-biased loop can stay at zero forever: the **degenerate point**.
- A start-up device conducts only when the loop is dead. Here $M_5$ (diode-connected, from the PMOS gate node to $M_1$'s gate) opens a path $V_{DD}\to M_3\to M_5\to M_1$ at turn-on (left inequality), then turns off once the loop runs (right inequality).
- Carusone's version (Fig. 7.8): an always-on weak device $Q_8$ pulls the gates of injectors $Q_{10,11}$ to turn them on while the loop is off. Once current flows, $Q_9$ takes $Q_8$'s current, turns $Q_{10,11}$ off, and they drop out.

> [!warning] Simulate start-up, don't trust the equation
> Ramp $V_{DD}$ from zero in a **dc sweep** (so parasitic capacitances can't fake a start) **and** in a **transient**, and check the operating point at each supply. Complex bias circuits can have more than one degenerate point.

> [!tip] Remark
> Every self-biased loop has this problem, including the bandgap core in [[Bandgap References]], which adds temperature shaping to this same supply-independent loop.

### Reference Current from a Reference Voltage

$$
\boxed{I_{ref} = M\,\frac{V_{ref}}{R}}
$$

An op amp drives a PMOS gate so the PMOS forces exactly $V_{ref}$ across $R$; a $1{:}M$ mirror copies the current. If $R$ is on chip, $I_{ref}$ varies with $R$, which is what you want when the current flows into a matched on-chip resistor (the voltage drop is then stable). An absolute current needs an off-chip or trimmed, temperature-compensated $R$. $V_{ref}$ comes from a [[Bandgap References|bandgap]].

## Level 4: Voltage Regulators

```tikz title="Regulators. The loop forces V_reg = V_ref; the pass device Q_1 supplies the load current. After Carusone Figs. 7.17 and 7.19."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % (a) NMOS pass
  \draw (0,0) node[op amp,yscale=-1](A){};
  \draw (A.+) -- ++(-0.6,0) node[ocirc]{} node[left]{$V_{ref}$};
  \draw (A.out) -- ++(0.5,0) coordinate (v1) node[circ]{} node[above]{$V_1$} -- (2.3,0) coordinate (g);
  \draw (3.1,0) node[nmos](Q1){};
  \draw (g) -- (Q1.G);
  \node[right] at (Q1.east) {$Q_1$};
  \draw (Q1.D) node[vcc]{$V_{DD}$};
  \draw (Q1.S) -- ++(0,-0.6) coordinate (o) node[circ]{};
  \draw (o) -- ++(1.6,0) coordinate (o2) node[ocirc]{} node[above]{$V_{reg}$};
  \draw (o2) ++(-0.5,0) node[circ]{} to[C,l=$C_L$] ++(0,-1.6) node[ground]{};
  \draw (o) |- (0,-1.9) coordinate (fb);
  \draw (fb) -| ([xshift=-0.3cm]A.-) -- (A.-);
  \draw (v1) to[C,l=$C_1$] (v1 |- 0,-1.3) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.0,-4.4) {(a) NMOS pass (follower): low $Z_{out}$, good PSRR,\\ dropout $\ge 2V_{eff}+V_{tn}$};
  % (b) PMOS LDO
  \begin{scope}[xshift=8.4cm]
  \draw (0,0) node[op amp](B){};
  \draw (B.-) -- ++(-0.6,0) node[ocirc]{} node[left]{$V_{ref}$};
  \draw (B.out) -- ++(0.5,0) coordinate (w1) node[circ]{} node[above]{$V_1$} -- (2.3,0) coordinate (h);
  \draw (3.1,0) node[pmos](P1){};
  \draw (h) -- (P1.G);
  \node[right] at (P1.east) {$Q_1$};
  \draw (P1.S) node[vcc]{$V_{DD}$};
  \draw (P1.D) -- ++(0,-0.6) coordinate (p) node[circ]{};
  \draw (p) -- ++(1.6,0) coordinate (p2) node[ocirc]{} node[above]{$V_{reg}$};
  \draw (p2) ++(-0.5,0) node[circ]{} to[C,l=$C_L$] ++(0,-1.6) node[ground]{};
  \draw (p) |- (0,-1.9) coordinate (fb2);
  \draw (fb2) -| ([xshift=-0.3cm]B.+) -- (B.+);
  \draw (w1) to[C,l=$C_1$] (w1 |- 0,-1.3) node[ground]{};
  \node[font=\scriptsize,align=center] at (1.0,-4.4) {(b) PMOS pass (LDO): dropout $\approx V_{eff}$,\\ but $Q_1$ amplifies $V_{DD}$ noise like a CG stage};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{V_{reg}\approx V_{ref},\qquad P_1 = (V_{DD}-V_{reg})\,i_L \ge V_{DO}\,i_L,\qquad \mathrm{PSRR}(\omega) = 20\log_{10}\left|\frac{v_{dd}}{v_{reg}}\right|}
$$

A regulator is a unity-gain feedback buffer whose output stage carries the load current. It makes a quiet local supply for a critical analog circuit sharing a supply with noisy (often digital) circuits. The regulated voltage is below $V_{DD}$.

| Spec | Set by |
|---|---|
| Line regulation (PSRR at dc) | Reference's own supply rejection, then the loop gain |
| Output impedance | Low freq: pass-device impedance divided by loop gain. High freq: $1/(j\omega C_L)$ |
| Dropout $V_{DO}$ | Smallest $V_{DD}-V_{reg}$ that still regulates; sets the minimum wasted power $V_{DO}i_L$ |

### NMOS Pass vs PMOS Pass (LDO)

$$
\boxed{\text{NMOS (follower): } V_{DO}\ge 2V_{eff}+V_{tn}\qquad \text{PMOS (LDO): } V_{DO}\approx V_{eff}}
$$

| | NMOS pass | PMOS pass (LDO) |
|---|---|---|
| Dropout | $V_{eff1}$ across $Q_1$ plus $V_{GS1}$ below the op amp output, which sits $V_{eff}$ under $V_{DD}$ | only $V_{eff1}$ (gate can go well below $V_{DD}$) |
| Supply rejection | good: follower, $V_{DD}$ is on the drain | worse: $Q_1$ acts like a CG stage from $V_{DD}$ with real gain; poor in a mid-band |
| Open-loop $Z_{out}$ | $1/g_{m1}$ | $r_{ds1}$, but loop gain is about $g_{m1}r_{ds1}$ higher, so closed-loop $Z_{out}$ is similar |
| Op amp polarity | non-inverting through follower | inputs swapped ($Q_1$ inverts) |
| Fix for NMOS dropout | native ($V_{tn}\approx0$) devices, or run the op amp from a higher supply | |

### Compensation and Supply Rejection

```tikz title="Supply rejection of an LDO. Left: output pole dominant, the load cap filters supply noise just as the loop runs out of gain. Right: op-amp pole dominant, a mid-band gap opens where neither helps. After Carusone Fig. 7.22(c), (d)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \begin{scope}
    \draw[->] (0,0) -- (5.6,0) node[right]{$\log\omega$};
    \draw[->] (0,0) -- (0,3.4) node[above]{$\log|v_{reg}/v_{dd}|$};
    \draw[very thick] (0,0.9) -- (3.2,0.9) -- (5.2,0.1);
    \draw[dashed] (1.0,0) -- (1.0,3.1);
    \draw[dashed] (3.2,0) -- (3.2,3.1);
    \node[below,font=\scriptsize] at (1.0,0) {$\omega_{p1}=\omega_{pL}$};
    \node[below,font=\scriptsize] at (3.2,0) {$\omega_t$};
    \node[font=\scriptsize,anchor=west] at (1.15,1.2) {$H_{CG}(0)/L(0)$};
    \node[font=\scriptsize,align=center] at (2.6,-1.1) {(a) output pole dominant: flat, then falls};
  \end{scope}
  \begin{scope}[xshift=7.6cm]
    \draw[->] (0,0) -- (6.2,0) node[right]{$\log\omega$};
    \draw[->] (0,0) -- (0,3.4) node[above]{$\log|v_{reg}/v_{dd}|$};
    \draw[very thick] (0,0.9) -- (1.2,0.9) -- (2.6,2.5) -- (4.2,2.5) -- (5.8,1.0);
    \draw[dashed] (1.2,0) -- (1.2,3.1);
    \draw[dashed] (2.6,0) -- (2.6,3.1);
    \draw[dashed] (4.2,0) -- (4.2,3.1);
    \node[below,font=\scriptsize] at (1.2,0) {$\omega_{p1}=\omega_{pa}$};
    \node[below,font=\scriptsize] at (2.6,0) {$\omega_t$};
    \node[below,font=\scriptsize] at (4.2,0) {$\omega_{pL}$};
    \node[font=\scriptsize,anchor=south] at (3.4,2.55) {$\approx H_{CG}(0)$};
    \node[font=\scriptsize,align=center] at (3.4,1.8) {mid-band\\gap};
    \node[font=\scriptsize,align=center] at (3.0,-1.1) {(b) gate pole dominant: between $\omega_t$ and $\omega_{pL}$ the loop\\ is out of gain and $C_L$ is not yet filtering};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{L(s) = \frac{G_{ma}R_{oa}\,g_{m1}R_L'}{\left(1+\frac{s}{\omega_{pa}}\right)\left(1+\frac{s}{\omega_{pL}}\right)},\quad \omega_{pa} = \frac{1}{R_{oa}(C_1+C_{gs1})},\quad \omega_{pL} = \frac{1}{R_L'C_L}}
$$

$$
\boxed{\frac{v_{reg}}{v_{dd}}(s) = \mathrm{PSRR}^{-1}(s) = \frac{H_{CG}(s)}{1+L(s)}}
$$

Two nodes, two poles: either can be made dominant.

| Dominant pole | Cost | Benefit |
|---|---|---|
| **Output** ($\omega_{pL}\ll\omega_{pa}$): big $C_L$, low $R_{oa}$ | op amp power (low $R_{oa}$) | low $Z_{out}$ at mid frequencies, $C_L$ filters supply noise as the loop gain fades: good PSRR |
| **Pass-device gate** ($\omega_{pa}\ll\omega_{pL}$): big $C_1$ | cheap | PSRR degrades from $\omega_{pa}$ until $\omega_{pL}$ kicks in; the poles must be widely spaced for stability, so the gap is wide |

> [!important]
> That mid-band gap usually lands in the hundreds of MHz, right where digital supply noise is worst. It is the central difficulty of on-chip regulators.

> [!tip] Remark
> An LDO is analyzed like a two-stage op amp ([[Stability]]): the op amp is stage one, the common-source pass device is stage two, and compensating means choosing which of the two nodes carries the dominant pole.

> [!note]- Derivation: NMOS-pass loop gain (Carusone Eqs. 7.64–7.70)
> Break the loop at the op amp input; single-stage op amp ($G_{ma}$, $R_{oa}$), $C_1$ at its output, $R_L' = R_L\parallel r_{ds1}\parallel(1/g_{s1})$. The follower gives
> $$L(s) = \frac{G_{ma}R_{oa}R_L'}{R_L'+1/g_{m1}}\cdot\frac{1+sC_{gs1}/g_{m1}}{1+\frac{s}{\omega_0Q}+\frac{s^2}{\omega_0^2}},\quad \omega_0^2 = \frac{(1/R_{oa})(g_{m1}+1/R_L')}{C_{gs1}C_L + C_1(C_{gs1}+C_L)}$$
> With $Q\ll1$ (dominant-pole compensated) the poles separate:
> $$\omega_{p1} = \frac{(1/R_{oa})(g_{m1}+1/R_L')}{C_L/R_{oa}+C_1(g_{m1}+1/R_{oa})+C_{gs1}/R_L'},\qquad \omega_{p2} = \frac{C_L/R_{oa}+C_1(g_{m1}+1/R_{oa})+C_{gs1}/R_L'}{C_{gs1}C_L+C_1(C_{gs1}+C_L)}$$
> and a zero at $\omega_z = g_{m1}/C_{gs1}$ (feedforward through $C_{gs1}$), usually far out. Large $C_1$: $\omega_{p1}\approx 1/(R_{oa}C_1)$, $\omega_{p2}\approx g_{m1}/C_L$. Large $C_L$ and small $R_{oa}$: the roles swap.

> [!note]- Detail: the open-loop supply path $H_{CG}$ (Carusone Ex. 7.6)
> With the loop open, $v_{dd}$ reaches $v_{reg}$ through the pass device; for the small-signal model of Carusone Fig. 7.21 this is $H_{CG}(s) = \frac{R_L}{r_{ds1}+R_L}\cdot\frac{1}{1+sR_LC_L}$. Closing the loop divides it by $1+L(s)$; at dc, $\mathrm{PSRR}^{-1}\approx H_{CG}(0)/L(0)$.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| Copy from $I_{REF}$ instead of fixed $V_{GS}$ | $I_D$ tracks $V_{TH}$, $\mu$ | a reference and a mirror branch |
| ↑ $R_BC_B$ (ac coupling) | lower corner frequency | area; $C_B$ parasitics in the signal path |
| Triode MOSFET as $R_B$ | MΩ in tiny area | weak-inversion sensitivity, mismatch, signal-dependent $R$ |
| Direct coupling | no capacitors, dc response | PVT shifts amplified like signal |
| Self-bias with $R_G$/$C_G$ or $R_F$ | no fighting current sources, guaranteed saturation | $R_G$ must be $\gg r_o$; low-frequency corner |
| $I_G$ level shift | centered swing, free PMOS overdrive (less noise) | $I_GR_G$ drift unless ratio-matched |
| Current-source (not resistor) under a CG input | no attenuation, no dc drop | CLM error; fix with low-voltage cascode |
| Lowest $V_{in,CM}$ for a pair | max $R_D$, gain, swing | next stage's CM too low if direct-coupled |
| Low-voltage cascode bias | one $V_{TH}$ more headroom than stacked diodes | needs a $V_b$ generator; cascode $V_{OV} < V_{TH}$ |
| Current-mode distribution | local matching, immune to ground drops | extra branch and current (≥ tens of µA) |
| Constant-$g_m$ loop, ↑ $K$ or ↓ $R_S$ | $g_m$ set by $R$ and ratios; supply-independent | positive-feedback stability, start-up, $V_{eff}$ rises with $T$ |
| Long channels in the bias loop | less supply sensitivity, less flicker noise | area |
| NMOS pass device | supply rejection | dropout $2V_{eff}+V_{tn}$ |
| PMOS pass device (LDO) | dropout $V_{eff}$, efficiency | mid-band PSRR |
| Output pole dominant | PSRR, mid-band $Z_{out}$ | op amp power, large $C_L$ |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Resistor-divider bias | $I_{out}\approx\frac12\mu_nC_{ox}\frac WL\left(\frac{R_2}{R_1+R_2}V_{DD}-V_{TH}\right)^2$ |
| Ac-coupling corner | $1/(2\pi R_BC_B) < f_{min}$ |
| Triode bias resistor | $R_{on,R} = \frac{(W/L)_C}{(W/L)_R}\frac{1}{g_{m,C}}$ |
| CS + self-biased current load | $A_v = -g_{m1}(r_{O1}\parallel r_{O2}\parallel R_G)$, $R_G\gg r_{O1}\parallel r_{O2}$ |
| Output level with $I_G$ | $V_{out} = V_{DD}-\lvert V_{GS2}\rvert+I_GR_G$; center: $I_GR_G\approx\lvert V_{GS2}\rvert-V_{DD}/2$ |
| Complementary CS | $A_v = -(g_{m1}+g_{m2})(r_{O1}\parallel r_{O2})$, $1/(C_1\omega_{min})\ll 1/g_{m2}$ |
| CG input attenuation | $\frac{V_X}{V_{in}} = \frac{(g_{m1}+g_{mb1})^{-1}\parallel R_S}{(g_{m1}+g_{mb1})^{-1}\parallel R_S+R_1}$ |
| Diff pair CM choice | $V_{in,CM,min} = V_{GS1}+V_{DS3,min}$, $V_{D1,min} = V_{OV1}+V_{DS3,min}$ |
| Low-voltage cascode bias | $V_b\approx V_{GS3}+V_{OV1}$; $V_{GS0}+V_{OV1}\le V_b\le V_{GS1}+V_{TH0}$ |
| Resistor reference current | $I_{out} = \frac{V_{DD}}{R_1+1/g_{m1}}\frac{(W/L)_2}{(W/L)_1}$ |
| Self-biased current | $I_{out} = \frac{2}{\mu_nC_{ox}(W/L)_NR_S^2}\left(1-\frac1{\sqrt K}\right)^2$ |
| Constant $g_m$ | $g_{m1} = \frac{2}{R_S}\left(1-\frac1{\sqrt K}\right)$; $K=4$: $1/R_S$ |
| Other devices' $g_m$ | NMOS $\sqrt{\frac{(W/L)_iI_{Di}}{(W/L)_1I_{D1}}}g_{m1}$; PMOS adds $\sqrt{\mu_p/\mu_n}$ |
| Start-up window ($M_5$) | $V_{TH1}+V_{TH5}+\lvert V_{TH3}\rvert < V_{DD} < V_{GS1}+V_{TH5}+\lvert V_{GS3}\rvert$ |
| Current from voltage | $I_{ref} = MV_{ref}/R$ |
| Regulator power, PSRR | $P_1 = (V_{DD}-V_{reg})i_L\ge V_{DO}i_L$; $\mathrm{PSRR} = 20\log\lvert v_{dd}/v_{reg}\rvert$ |
| Dropout | NMOS: $\ge 2V_{eff}+V_{tn}$; PMOS LDO: $\approx V_{eff}$ |
| LDO loop gain | $L(s) = \frac{G_{ma}R_{oa}g_{m1}R_L'}{(1+s/\omega_{pa})(1+s/\omega_{pL})}$, $\omega_{pa} = \frac{1}{R_{oa}(C_1+C_{gs1})}$, $\omega_{pL} = \frac{1}{R_L'C_L}$ |
| Supply transfer | $\mathrm{PSRR}^{-1}(s) = H_{CG}(s)/(1+L(s))$ |

## References

- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF page = printed + 19)
  - §5.1, pp. 134–135: resistive-divider bias (Eq. 5.1), 44% error example, copying from a reference.
  - §5.2, pp. 141–145: cascode bias $V_b$, low-voltage cascode (Eqs. 5.16–5.19), Fig. 5.19 $V_b$ generators, Ex. 5.6 replica biasing.
  - §5.4.1–5.4.4, pp. 160–166: CS biasing (Figs. 5.43–5.47, Eqs. 5.58–5.62, Ex. 5.14), CG biasing (Fig. 5.48, Eq. 5.63), source follower biasing (Fig. 5.49, Ex. 5.15), differential pair biasing (Fig. 5.51).
  - §12.2, pp. 509–512: supply-independent biasing (Eqs. 12.1–12.7, Ex. 12.1), start-up (Fig. 12.5).
  - §12.5, pp. 524–525: constant-$G_m$ biasing (Eqs. 12.52–12.54), switched-capacitor resistor (Fig. 12.21).
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24)
  - §7.1, pp. 302–307: bias vs reference vs regulator, Ex. 7.1, bias distribution (Fig. 7.3), Ex. 7.2.
  - §7.2, pp. 307–310: constant-transconductance circuits (Eqs. 7.3–7.12, Figs. 7.6–7.8), stability, start-up, temperature limit.
  - §7.3.4, pp. 320–321: current reference from a voltage reference (Fig. 7.16).
  - §7.4, pp. 321–327: regulators, specifications (Eqs. 7.61–7.63), feedback analysis (Eqs. 7.64–7.70), LDOs (Eqs. 7.71–7.73), Ex. 7.6 supply rejection (Eqs. 7.74–7.76, Fig. 7.22); §7.5 key points.
- **Zettelkasten extensions** (`AnalogTheory/Current Mirrors and Biasing/`): 4d1 (failure modes of the triode bias resistor), 4e (imbalance shift $\Delta I(r_{O1}\parallel r_{O2})$ vs $\Delta I/g_{m2}$), 4e1 ($I_GR_G$ drift and ratio matching), 4b2a (replica-bias failure modes); `Bandgap and References/` 10c–10d1, 10i–10i1 (self-biased loop, start-up, constant-$g_m$, SC resistor), cross-checked against Razavi Ch. 12.
