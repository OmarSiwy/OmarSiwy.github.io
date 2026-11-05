---
title: Guard Rings, ESD and Interconnect
description: What protects a layout from itself and from the outside world. Covers merged devices, majority and minority guard rings, the CMOS latch-up SCR and its rules, wiring practice (IR drop, current density, star/Kelvin, shielding, slotting), and ESD from the HBM/CDM models through clamps and the pad ring to the capacitance it costs a high-speed pin.
kind: topic
status: growing
aliases:
  - Guard Rings, ESD and Interconnect
  - Guard Rings
  - ESD
  - ESD Protection
  - Latch-up
  - Interconnect
---

A schematic assumes ideal wires and devices that don't interact. Silicon has neither. Every junction is half of a parasitic bipolar, every well and substrate is a resistor, every wire is a resistor and a capacitor, and every pin is an antenna for kilovolt static. This note covers the layout structures that keep those parasitics asleep: guard rings, tap placement against latch-up, wiring rules, and the ESD network. Physics owned elsewhere is linked rather than re-derived: junctions in [[Diodes]], bipolars in [[BJTs]], electromigration in [[Electromigration]], substrate noise in [[Substrate Noise]], and the other failure mechanisms in [[Failure Mechanisms]].

## The big picture

```tikz title="The die edge in cross-section. A pad's ESD diode (NSD in p-sub) injects electrons when the pin is pulled below ground. An n-well ring tied to V_DD collects them (minority-carrier guard ring) before they reach the PMOS well, and the p+/n+ taps around each transistor pin the substrate and well (majority-carrier guard rings). The legend is the Layout-series legend from CMOS Processing. After Hastings Figs. 5.27, 14.12 and Razavi Fig. 19.55."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  sti/.style={fill=gray!45,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70}]
  \node[anchor=west,font=\bfseries\scriptsize] at (14.2,4.3) {Legend (Layout series)};
  \foreach \y/\s/\t in {3.85/psub/{p-substrate / p-epi},3.45/nwell/{n-well},3.05/ndiff/{n+ diffusion (NSD)},2.65/pdiff/{p+ diffusion (PSD)},2.25/sti/{STI},1.85/poly/{poly},1.45/cont/{contact / via},1.05/mone/{metal 1},0.65/mtwo/{metal 2 / pad}} {
    \draw[\s] (14.3,\y-0.13) rectangle (14.75,\y+0.13);
    \node[anchor=west,font=\scriptsize] at (14.85,\y) {\t};
  }
  \draw[->,thick,blue!70!black] (14.3,0.25) -- (14.75,0.25); \node[anchor=west,font=\scriptsize] at (14.85,0.25) {electrons};
  \draw[->,thick,red!70!black] (14.3,-0.15) -- (14.75,-0.15); \node[anchor=west,font=\scriptsize] at (14.85,-0.15) {holes};
  \draw[psub] (0,0) rectangle (13.6,2.6);
  \draw[nwell] (3.0,2.6) -- (3.0,1.3) -- (4.2,1.3) -- (4.2,2.6);
  \draw[nwell] (9.2,2.6) -- (9.2,1.0) -- (13.4,1.0) -- (13.4,2.6);
  \foreach \a/\b in {0/0.2,1.4/1.7,2.6/3.3,3.9/4.6,5.3/5.6,8.1/8.4,8.9/9.5,9.9/10.2,12.7/13.0} {\draw[sti] (\a,2.6) rectangle (\b,2.3);}
  \draw[ndiff] (0.2,2.6) rectangle (1.4,2.35);
  \draw[pdiff] (1.7,2.6) rectangle (2.6,2.35);
  \draw[ndiff] (3.3,2.6) rectangle (3.9,2.35);
  \draw[pdiff] (4.6,2.6) rectangle (5.3,2.35);
  \draw[ndiff] (5.6,2.6) rectangle (6.5,2.35);
  \draw[ndiff] (7.2,2.6) rectangle (8.1,2.35);
  \draw[poly] (6.5,2.65) rectangle (7.2,2.95);
  \draw[pdiff] (8.4,2.6) rectangle (8.9,2.35);
  \draw[ndiff] (9.5,2.6) rectangle (9.9,2.35);
  \draw[pdiff] (10.2,2.6) rectangle (11.1,2.35);
  \draw[pdiff] (11.8,2.6) rectangle (12.7,2.35);
  \draw[poly] (11.1,2.65) rectangle (11.8,2.95);
  \draw[ndiff] (13.0,2.6) rectangle (13.4,2.35);
  \foreach \x in {0.7,2.05,3.5,4.85,5.95,7.55,8.55,9.6,10.55,12.15,13.1} {\draw[cont] (\x,2.6) rectangle (\x+0.2,3.2);}
  \foreach \x in {7.55,12.15} {\draw[cont] (\x,3.45) rectangle (\x+0.2,4.1);}
  \draw[mone] (0.4,3.2) rectangle (1.2,3.45);
  \draw[mone] (1.8,3.2) rectangle (2.5,3.45);
  \draw[mone] (3.3,3.2) rectangle (3.9,3.45);
  \draw[mone] (4.7,3.2) rectangle (6.3,3.45);
  \draw[mone] (7.4,3.2) rectangle (7.9,3.45);
  \draw[mone] (8.4,3.2) rectangle (8.9,3.45);
  \draw[mone] (9.5,3.2) rectangle (10.9,3.45);
  \draw[mone] (12.0,3.2) rectangle (12.5,3.45);
  \draw[mone] (12.95,3.2) rectangle (13.4,3.45);
  \draw[mtwo] (7.4,4.1) rectangle (12.5,4.35);
  \node[font=\scriptsize,white] at (9.95,4.22) {M2: output (interconnect)};
  \draw[cont] (0.7,3.45) rectangle (0.9,3.9);
  \draw[mtwo] (0.0,3.9) rectangle (1.6,4.25);
  \node[font=\scriptsize,white] at (0.8,4.07) {PAD};
  \node[font=\scriptsize] at (2.15,3.65) {GND};
  \node[font=\scriptsize] at (3.6,3.65) {$V_{DD}$};
  \node[font=\scriptsize] at (5.5,3.65) {GND};
  \node[font=\scriptsize] at (10.2,3.65) {$V_{DD}$};
  \node[font=\scriptsize] at (8.65,3.65) {GND};
  \node[font=\scriptsize] at (13.2,3.65) {$V_{DD}$};
  \node[font=\scriptsize] at (6.85,3.15) {G};
  \node[font=\scriptsize] at (11.45,3.15) {G};
  \draw[->,thick,blue!70!black] (0.8,2.3) to[out=-80,in=-120] (3.15,1.35);
  \draw[->,thick,blue!70!black] (1.0,2.3) to[out=-60,in=-150] (3.4,1.25);
  \draw[->,thick,blue!70!black,dashed] (1.1,2.25) to[out=-30,in=-175,looseness=0.7] (9.3,1.1);
  \node[font=\scriptsize,blue!70!black,align=center] at (6.4,0.35) {without the ring these electrons reach the PMOS well:\\ well debiasing, latch-up};
  \node[font=\scriptsize,align=center] at (1.1,-0.45) {ESD diode\\ (injector)};
  \node[font=\scriptsize,align=center] at (3.6,-0.45) {n-well ring\\ (minority: collects $e^-$)};
  \node[font=\scriptsize,align=center] at (6.8,-0.45) {NMOS + p+ taps\\ (majority ring)};
  \node[font=\scriptsize,align=center] at (11.3,-0.45) {PMOS + n+ taps\\ (majority ring)};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **A pin can drive any junction it touches forward.** That junction then injects minority carriers, which travel hundreds of µm and land in other devices. Rule: *a diffusion connected to a pin through less than 10 kΩ can trigger latch-up* (use 50–100 kΩ for low-current analog).
> 2. **CMOS contains an SCR.** The PMOS source, n-well, p-substrate and NMOS source form a pnpn. It latches when the loop gain $\beta_N\beta_P$ exceeds 1 *and* $R_{well}$, $R_{sub}$ let the bases forward-bias. The fix is low-resistance taps everywhere (≤ a few Ω), plus minority-carrier guard rings around injectors.
> 3. **Two kinds of guard ring.** *Majority* rings (p+ taps in p-sub, n+ taps in the n-well) pin the potential. *Minority* rings (an n-type ring tied to $V_{DD}$ in the substrate, a p+ ring tied to ground inside a well) collect stray carriers. Put the minority ring around the **injector**: every pad device and ESD clamp.
> 4. **ESD: every pin gets a primary clamp to a low-resistance return, and every gate on a pin also gets a secondary (CDM) clamp next to it.** HBM is about 1.3 A for ~150–230 ns (energy, heating). CDM is >5 A for ~1 ns (voltage, oxide). Keep the metal in the ESD path under ~2 Ω.
> 5. **Wires are resistors and capacitors.** $\Delta V = IR_\square L/W$; width ≥ $I/J_{max}$; coupled noise $\Delta V = RC\,dV/dt$. Star-connect shared returns, Kelvin-connect what you sense, shield sensitive lines to *their own* reference, and slot wide metal parallel to the current.

**Map:** [[#Level 0 Parasitics and Merged Devices|injection and merged devices]] → [[#Latch-up|latch-up: the SCR, triggers, debiasing, rules]] → [[#Level 2 Guard Rings|majority vs minority rings, CMOS rings, placement]] → [[#Level 3 Interconnect|IR drop, current density, star/Kelvin, shielding, slots, tunnels]] → [[#Level 4 ESD Protection|models, clamps, networks, CDM, ESD metal, high-speed I/O]].

## Level 0: Parasitics and Merged Devices

### Minority-Carrier Injection

A pin (or a capacitively kicked internal node) driven past a rail forward-biases the diffusion on it, which injects minority carriers into the well or substrate; the latch-up trigger is any diffusion reached from a pin through less than about 10 kΩ (50–100 kΩ for low-current analog).

> [!tip] Remark
> The injectors (pins, capacitors, Schottkys), the cross-section of both injection paths and the 10 kΩ derivation are owned by [[Failure Mechanisms#Level 4 Minority-Carrier Injection]]; this note keeps only what feeds latch-up and guard-ring design. These are the parasitic transistors of [[BJTs#Substrate PNP in CMOS]] and the substrate-touching junctions in the table at [[Diodes#Diodes in a CMOS Process]]. That table is where "an NSD/p-sub diode can only forward-bias if its cathode goes below ground" comes from.

### Merged Devices

```tikz title="Merging three PMOS that share a body (and here a gate) into one n-well. Separate wells (left) each pay the well-to-well spacing and their own tap; merged (right) uses less than half the area. After Hastings Fig. 14.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  cont/.style={fill=black,draw=none}]
  \foreach \x in {0,2.5,5.0} {
    \draw[nwell] (\x,0) rectangle (\x+2.0,3.0);
    \draw[pdiff] (\x+0.4,0.4) rectangle (\x+1.6,1.6);
    \draw[poly] (\x+0.9,0.2) rectangle (\x+1.1,1.8);
    \draw[ndiff] (\x+0.4,2.1) rectangle (\x+1.6,2.6);
    \draw[cont] (\x+0.55,0.9) rectangle (\x+0.72,1.07);
    \draw[cont] (\x+1.28,0.9) rectangle (\x+1.45,1.07);
    \draw[cont] (\x+0.92,2.27) rectangle (\x+1.08,2.44);
  }
  \node[font=\scriptsize] at (3.5,-0.4) {(A) three wells, three taps};
  \begin{scope}[xshift=8.5cm]
    \draw[nwell] (0,0) rectangle (3.6,3.0);
    \foreach \y in {0.3,0.95,1.6} {\draw[pdiff] (0.4,\y) rectangle (2.4,\y+0.45);
      \draw[cont] (0.6,\y+0.14) rectangle (0.77,\y+0.31); \draw[cont] (2.05,\y+0.14) rectangle (2.22,\y+0.31);}
    \draw[poly] (1.35,0.15) rectangle (1.5,2.25);
    \draw[ndiff] (2.8,0.3) rectangle (3.25,2.05);
    \draw[cont] (2.95,1.1) rectangle (3.12,1.27);
    \node[font=\scriptsize] at (1.8,-0.4) {(B) one well, one tap, shared gate};
  \end{scope}
\end{circuitikz}
\end{document}
```

Merging saves the big spacings between isolation regions (≈70 % of the area for three bipolar NPNs, under half for three PMOS). It is safe only if the devices cannot disturb one another through the shared region. Ask three questions before merging (Hastings §14.1.5):

1. **Can any merged device inject minority carriers into the shared region?** Pin-connected diffusions, saturating bipolars, forward-biased Schottkies or bodies. If yes, give it its own well/tank or a guard ring.
2. **Can any device debias the shared region?** Large current through a well or tank contact shifts the local potential.
3. **Can noise couple?** A fast node and a sensitive node sharing a resistive region couple capacitively through it. Don't merge noisy with sensitive.

| Risk | Typical mergers | Watch for |
|---|---|---|
| Low | Sections of one matched device; fingers of a power device; sense FET in its power FET's well; back-to-back LDMOS with common drain | Thermal gradient across a sense FET (split it in two, halfway out) |
| Medium | **MOS transistors in a common backgate** (every CMOS layout); diffused resistors in one tank; merged lateral PNPs; Zeners in a tank biased ≥ cathode | An *output* transistor (drain on a pin) in a shared well; deliberately forward-biased bodies (charge pumps, clamps). The designer must mark them |
| High | NPN driving a merged lateral PNP; NPN + base resistor sharing one tank contact; NPN + Schottky in one tank | These are SCRs: latch-up |

> [!note]- Detail: debiasing and coupling numbers for merged regions (Hastings §14.1)
> - Metal: 1000 squares of 50 mΩ/□ carrying 100 µA drops 0.5 mV. Silicon is worse: 2 µA of base current through a 500 Ω shared base drops 1 mV.
> - A merged device on a pin can dump the whole latch-up test current (100 mA) into the shared region. Even through a 5 Ω deep-N+ sinker that is 0.5 V of debiasing, enough to forward-bias a junction.
> - Coupling through a parasitic capacitance $C_P$ from a node slewing at $S$ V/s onto a node of resistance $R$: $V_P = RSC_P$ (Eq. 14.1). Hastings's example is a minimum M2/M1 crossing (about 0.05 fF) carrying a 1 V/ns clock over a 200 kΩ node. The equation gives 10 mV. The book prints "about 50 mV", against a 100 mV signal; either way it is not negligible.
> - Bipolar mergers: with a bar of collection efficiency $\eta_C$ between an NPN and the lateral PNP it drives, latch-up needs $\beta_N\beta_P(1-\eta_C) > 1$ (Eq. 14.2). With $\beta_N = 300$ and $\beta_P = 10$ the bar must exceed 99.97 % efficiency, which no bar guarantees. So never merge a PNP that might saturate with the NPN that drives it.
> - An emitter-follower NPN merged with its base resistor latches once the shared tank contact debiases about 0.6 V. Without a deep-N+ sinker the tank resistance is hundreds to thousands of Ω, so this is likely; with a sinker (≤ 100 Ω) it is unlikely.

> [!tip] Remark
> Sharing diffusion between series MOSFETs (the cascode trick) is the friendliest merger of all and is drawn in [[Layout Fundamentals#Shared diffusions and merged devices]]. This section is about sharing a *well or tank*.

## Latch-up

### The Parasitic SCR

```tikz title="CMOS latch-up. The NMOS source (NSD), p-epi and n-well form a lateral npn Q_N; the PMOS source (PSD), n-well and p-epi form a pnp Q_P. Each base is the other's collector, and each base reaches its supply only through a resistance (R_well, R_sub). Right: the same loop redrawn as an SCR. After Hastings Fig. 5.29 and Razavi Fig. 18.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70}]
  \draw[psub] (0,0) rectangle (9.4,2.4);
  \draw[nwell] (4.6,2.4) -- (4.6,0.8) -- (9.2,0.8) -- (9.2,2.4);
  \draw[pdiff] (0.3,2.4) rectangle (1.0,2.15);
  \draw[ndiff] (1.3,2.4) rectangle (2.1,2.15);
  \draw[poly] (2.1,2.45) rectangle (2.6,2.7);
  \draw[ndiff] (2.6,2.4) rectangle (3.4,2.15);
  \draw[pdiff] (5.4,2.4) rectangle (6.2,2.15);
  \draw[poly] (6.2,2.45) rectangle (6.7,2.7);
  \draw[pdiff] (6.7,2.4) rectangle (7.5,2.15);
  \draw[ndiff] (8.1,2.4) rectangle (8.8,2.15);
  \node[font=\scriptsize,above] at (0.65,2.72) {GND};
  \node[font=\scriptsize,above] at (1.7,2.72) {S=GND};
  \node[font=\scriptsize,above] at (3.0,2.72) {D};
  \node[font=\scriptsize,above] at (5.8,2.72) {D};
  \node[font=\scriptsize,above] at (7.1,2.72) {S=$V_{DD}$};
  \node[font=\scriptsize,above] at (8.45,2.72) {$V_{DD}$};
  % Q_N lateral npn: emitter NSD source, base p-epi, collector n-well
  \draw[->,thick,blue!70!black] (1.7,2.1) to[out=-80,in=-150] (4.7,1.2);
  \node[font=\scriptsize,blue!70!black] at (3.3,0.75) {$Q_N$};
  % Q_P vertical/lateral pnp: emitter PSD source, base n-well, collector p-epi
  \draw[->,thick,red!70!black] (7.1,2.1) -- (7.1,0.55);
  \node[font=\scriptsize,red!70!black,anchor=west] at (7.15,0.45) {$Q_P$};
  % resistors
  \draw[very thick,cyan!50!black,decorate,decoration={zigzag,amplitude=1.5pt,segment length=4pt}] (8.45,2.1) -- (7.6,1.2);
  \node[font=\scriptsize,anchor=west] at (8.1,1.4) {$R_{well}$};
  \draw[very thick,orange!70!black,decorate,decoration={zigzag,amplitude=1.5pt,segment length=4pt}] (0.65,2.1) -- (1.8,0.5);
  \node[font=\scriptsize,anchor=east] at (1.15,1.1) {$R_{sub}$};
  \node[font=\scriptsize] at (3.6,0.3) {p-epi};
  \node[font=\scriptsize] at (5.4,1.1) {n-well};
  \begin{scope}[xshift=11.4cm,yshift=-0.9cm]
    \draw (-0.4,4.0) node[left,font=\scriptsize] {$V_{DD}$} -- (3.2,4.0);
    \draw (0.6,4.0) to[R,l_=\scriptsize$R_{well}$] (0.6,2.6) node[circ]{} node[left,font=\scriptsize]{$Y$};
    \draw (2.6,3.2) node[pnp,anchor=E](QP){};
    \draw (QP.E) -- (QP.E |- 0,4.0);
    \draw (QP.B) -- ++(-0.2,0) |- (0.6,2.6);
    \node[font=\scriptsize,anchor=west] at (2.75,2.8) {$Q_P$};
    \draw (0.6,2.6) -- (0.6,2.0) node[npn,xscale=-1,anchor=C](QN){};
    \node[font=\scriptsize,anchor=east] at (0.3,1.5) {$Q_N$};
    \draw (QP.C) -- (QP.C |- QN.B) coordinate (X) node[circ]{} node[right,font=\scriptsize]{$X$};
    \draw (QN.B) -- (X);
    \draw (X) to[R,l=\scriptsize$R_{sub}$] (X |- 0,-0.2);
    \draw (QN.E) -- (QN.E |- 0,-0.2);
    \draw (-0.4,-0.2) node[left,font=\scriptsize] {GND} -- (3.2,-0.2);
  \end{scope}
\end{circuitikz}
\end{document}
```

Normally $R_{well}$ and $R_{sub}$ hold both bases at their emitters and both transistors are off. Inject current into either base node and the loop can regenerate. It latches when three things hold (Hastings §5.4.2):

1. Both transistors are biased active (a base resistor drop of about a diode).
2. The **beta product exceeds unity** over some range of current:
$$
\boxed{\beta_N\,\beta_P > 1 \quad\text{(with the base resistors: } T = \tfrac{\beta_N}{1+\beta_N/(g_{mN}R_{sub})}\cdot\tfrac{\beta_P}{1+\beta_P/(g_{mP}R_{well})} \ge 1)}
$$
3. The supply can deliver the **holding current**.

Once latched, current climbs until high-injection beta roll-off brings the product back to 1. It stays there until the **power is cycled**. Large devices at high voltage overheat and die; small ones just draw excess current and stop working.

> [!note]- Derivation: loop gain of the parasitic SCR with base resistors (Zettelkasten 15f5, Razavi §18.8)
> Hybrid-π both transistors ($g_m = I_C/V_T$, $r_\pi = \beta/g_m$), emitters at ac ground. Break the loop at the substrate node $X$. A voltage $v_x$ makes $Q_N$ pull $g_{mN}v_x$ out of the well node $Y$, whose impedance is $R_{well}\parallel r_{\pi P}$. That gives $v_y = -g_{mN}v_x(R_{well}\parallel r_{\pi P})$. $Q_P$ then pushes $-g_{mP}v_y$ into $X$, which develops a voltage across $R_{sub}\parallel r_{\pi N}$. Same sign as $v_x$, so the loop is positive feedback:
> $$T = g_{mP}(R_{well}\parallel r_{\pi P})\cdot g_{mN}(R_{sub}\parallel r_{\pi N}),\qquad g_m(R\parallel r_\pi) = \frac{\beta}{1+\beta/(g_mR)}$$
> - No taps ($R\to\infty$): $T\to\beta_N\beta_P$, which is always > 1. The bare structure *is* a thyristor.
> - Good taps ($g_mR\ll1$): $T\approx I_{CN}I_{CP}R_{sub}R_{well}/V_T^2$. That is tiny at rest, but it **rises with the injected current**, so a big enough transient always pushes $T$ past 1. Latch-up is a triggered, large-signal event, so evaluate $T$ at the injected current, not at the quiescent point.
> - $R_{well}$ and $R_{sub}$ are really distributed. What matters is the resistance from the disturbance to the *nearest* tap, which is why the rules are maximum tap spacings.

> [!tip] Remark
> The same pnpn is the core of an SCR ESD clamp ([[#SCR Clamps]]): there it is triggered on purpose. And $Q_P$ is the substrate pnp a bandgap uses deliberately ([[BJTs#Substrate PNP in CMOS]]), biased at a current far too small to close the loop.

### Triggering and Testing

```tikz title="What triggers latch-up: anything that forward-biases an emitter or pushes current through R_well or R_sub. Pin overshoot and undershoot, displacement current through a drain junction, and ground bounce under a large output buffer. After Razavi Sec. 18.8 and Hastings Sec. 14.2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \foreach \i/\t/\s in {0/{pin $>V_{DD}+V_D$}/{injects holes (PSD in well)},1/{pin $<-V_D$}/{injects electrons (NSD in sub)},2/{fast drain swing $C_{j}\,dV/dt$}/{displacement current into well/sub},3/{ground bounce $L\,di/dt$}/{source-body junction forward-biases},4/{supply sequencing, ESD while powered}/{an I/O sits above its own $V_{DD}$}} {
    \draw[fill=black!4,rounded corners=2pt] (0,{-0.9*\i}) rectangle (5.4,{-0.9*\i+0.7});
    \node[font=\scriptsize] at (2.7,{-0.9*\i+0.35}) {\t};
    \draw[->] (5.4,{-0.9*\i+0.35}) -- (6.1,{-0.9*\i+0.35});
    \node[font=\scriptsize,anchor=west] at (6.15,{-0.9*\i+0.35}) {\s};
  }
  \draw[thick,decorate,decoration={brace,amplitude=5pt}] (11.0,0.7) -- (11.0,-3.6);
  \node[font=\scriptsize,align=left,anchor=west] at (11.25,-1.45) {current through\\ $R_{well}$ or $R_{sub}$\\ $\Rightarrow$ base forward-biased\\ $\Rightarrow$ loop closes};
\end{circuitikz}
\end{document}
```

**Test (JESD78):** put ammeters in every supply. Apply a current pulse to each pin, typically **100 mA for 50 ms**, in both polarities. Latch-up is flagged if any supply current stays higher by a set amount, typically 10 %. Emission microscopy (EMMI) then shows the faint infrared glow of recombination at the latched site.

> [!note]- Detail: why latch-up hides from simulation
> Parasitic bipolars are rarely in the device models, the trigger is a transient from outside the chip, and a chip that works in one application can latch in another. Hastings opens Ch. 14.2 with exactly this. Some parts run thousands of hours before the right transient arrives. Only layout discipline and the JESD78 test catch it. Razavi adds that large digital output buffers are a classic trigger: their big drain junctions inject displacement current, and bond-wire bounce on ground forward-biases their source-body diodes.

### Debiasing and Tap Placement

Four ways to stop latch-up (Hastings §5.4.2):

1. Don't inject (series resistance, clamp elsewhere, don't forward-bias bodies).
2. **Collect** the minority carriers before they reach a reverse-biased junction (minority guard rings).
3. Let them **recombine** first (distance, heavily doped blocking layers).
4. **Lower $R_{well}$ and $R_{sub}$** so the drift current cannot debias a base (taps, majority guard rings). Target: no more than a few ohms.

```tikz title="Good vs bad tapping, top view. Left: one substrate tap and one well tap for a whole row; the injected current travels far, R_sub and R_well are large, the bases debias. Right: taps on every device (or a ring) keep every point within the rule distance of a tap. After Hastings Sec. 5.4.3 and Carusone's 100-lambda rule quoted in Layout Fundamentals."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70}]
  \begin{scope}
    \draw[nwell] (0,2.0) rectangle (6.0,3.6);
    \foreach \x in {0.6,1.9,3.2,4.5} {\draw[pdiff] (\x,2.4) rectangle (\x+0.9,3.2); \draw[poly] (\x+0.38,2.25) rectangle (\x+0.52,3.35);}
    \foreach \x in {0.6,1.9,3.2,4.5} {\draw[ndiff] (\x,0.4) rectangle (\x+0.9,1.2); \draw[poly] (\x+0.38,0.25) rectangle (\x+0.52,1.35);}
    \draw[ndiff] (5.55,3.15) rectangle (5.85,3.45);
    \draw[pdiff] (5.55,0.15) rectangle (5.85,0.45);
    \draw[<->,thick,red!70!black] (0.8,0.8) -- (5.5,0.35);
    \node[font=\scriptsize,red!70!black] at (2.9,1.75) {long path: large $R_{sub}$, $R_{well}$};
    \node[font=\scriptsize] at (3.0,-0.35) {bad: one tap per row};
    \node[font=\scriptsize,anchor=west] at (6.1,3.3) {well tap};
    \node[font=\scriptsize,anchor=west] at (6.1,0.3) {sub tap};
  \end{scope}
  \begin{scope}[xshift=8.0cm]
    \draw[nwell] (0,2.0) rectangle (6.0,3.6);
    \draw[ndiff] (0.15,2.15) rectangle (5.85,2.35);
    \draw[ndiff] (0.15,3.25) rectangle (5.85,3.45);
    \foreach \x in {0.6,1.9,3.2,4.5} {\draw[pdiff] (\x,2.5) rectangle (\x+0.9,3.1); \draw[poly] (\x+0.38,2.4) rectangle (\x+0.52,3.2);}
    \draw[pdiff] (0.15,0.05) rectangle (5.85,0.25);
    \draw[pdiff] (0.15,1.55) rectangle (5.85,1.75);
    \foreach \x in {0.6,1.9,3.2,4.5} {\draw[ndiff] (\x,0.45) rectangle (\x+0.9,1.35); \draw[poly] (\x+0.38,0.35) rectangle (\x+0.52,1.45);}
    \node[font=\scriptsize] at (3.0,-0.35) {good: n+ strips in the well, p+ strips in the substrate};
  \end{scope}
\end{circuitikz}
\end{document}
```

How to place taps depends on what the substrate is (Hastings §5.4.3):

| Substrate / layer | Rules |
|---|---|
| **p-epi on p++** (most CMOS) | Vertical path to the p++ dominates: $R_V = \rho t/A_{dif}$. Place small contacts wherever convenient and fill unused area with contacts. Ring injectors that spray current from their periphery. |
| **Thick lightly doped substrate** | Resistance depends on contact *size*, weakly on spacing. Keep every device within ~½ die thickness of a tap and make taps as large as space allows. Rings are not better than big nearby taps. |
| **Thin layer** (well without buried layer, SOI film) | Lateral current crowds, so proximity is everything. Ring every majority-carrier injector closely; ring width ≥ ½ layer thickness; scatter extra taps no more than 20–50 layer thicknesses apart. |

$$
\boxed{R_V = \frac{\rho\,t}{A_{dif}}\ \ (A_{dif}\gg t^2),\qquad R_V \le \frac{\Delta V_{max}}{I_{test}} = \frac{0.3\ \mathrm V}{100\ \mathrm{mA}} = 3\ \Omega}
$$

For $\rho = 10\ \Omega\cdot$cm and $t = 10$ µm that takes about **0.33 mm²** of contact diffusion, which is why taps are scattered everywhere rather than placed once.

> [!note]- Detail: spreading-resistance results behind the rules (Hastings Eqs. 5.22–5.30)
> ```tikz title="Model of a lightly doped layer (thickness t, resistivity rho) on a heavily doped sublayer: majority current goes down through R_V under one contact, along the near-zero-resistance sublayer, and up under the other. After Hastings Fig. 5.30."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[font=\small]
>   \draw[fill=orange!12,draw=black!60] (0,1.2) rectangle (8,2.4);
>   \draw[fill=orange!40,draw=black!60] (0,0) rectangle (8,1.2);
>   \draw[fill=orange!65,draw=black!60] (0.8,2.4) rectangle (1.8,2.25);
>   \draw[fill=orange!65,draw=black!60] (6.2,2.4) rectangle (7.2,2.25);
>   \draw (1.3,2.25) to[R,l_=$R_V$] (1.3,0.6) -- (6.7,0.6) to[R,l_=$R_V$] (6.7,2.25);
>   \node[font=\scriptsize] at (4,0.35) {$R_H\approx0$ (p++ sublayer)};
>   \node[font=\scriptsize] at (4,1.8) {p-epi, $\rho$, thickness $t$};
>   \node[font=\scriptsize,above] at (1.3,2.4) {$C_1$, area $A_{dif}$};
>   \node[font=\scriptsize,above] at (6.7,2.4) {$C_2$};
> \end{circuitikz}
> \end{document}
> ```
> - **Disperse beats lumped.** A small circular contact of radius $r$ has $R_V = \frac{\rho}{2\pi r}\tan^{-1}\frac{2t}{r}$ (Eq. 5.24). Many small contacts have far less resistance than one big one of the same total area (13 % in Hastings's example), provided they are spaced at least about $2t$ apart.
> - **Thick substrate:** $R_{SP} = \frac{\rho}{2r}\left[1 - \frac{2}{\pi}\sin^{-1}\frac{r}{d}\right]$ for two contacts of radius $r$ at distance $d$: it barely changes with separation because the current spreads deeper (two 10 µm contacts in 10 Ω·cm: 1 kΩ far apart, 840 Ω at 20 µm). An annular contact around a central one can even get *lower* resistance at larger spacing, because its area grows (around a 10 µm contact: 110 Ω at 5 µm spacing, 22 Ω at 100 µm). The equations hold only for dimensions below the post-backgrind die thickness, hence "within ½ die thickness".
> - **Thin layer:** resistance rises fast once the layer is thinner than the contact diameter and depends little on contact size. An annular contact collects nearly all majority current injected inside it if it is ≥ ½ the layer thick. But it cannot stop **minority** carriers, which diffuse far past it before recombining (electrons in p-type travel a long way). Those need scattered contacts to supply recombination current, or a minority guard ring.
> - Standard bipolar: ring majority injectors with as much substrate contact as possible, without gaps in the metal.

### Latch-up Rules

1. **Tap every transistor.** No point may be farther from a tap than the process latch-up rule (a maximum distance; Carusone's λ example is 100λ, see [[Layout Fundamentals#Body (backgate) contacts]]).
2. **Ring the injectors.** Every device with a diffusion on a pin (I/O drivers, ESD clamps, pin resistors under 10 kΩ) gets a majority tap ring *and* a minority guard ring, and is separated from core logic.
3. **Keep NMOS and PMOS of I/O apart.** Distance reduces both $\beta$s; a guard ring between them collects what is left.
4. **Fill spare area with substrate contact** rather than decap when substrate resistance would otherwise exceed ~1 Ω (Hastings).
5. **Wire guard rings and taps with metal all the way round.** Gaps in the metal leave a resistive ring that debiases and re-injects. Size the metal for tens to hundreds of mA of transient.
6. **Know your substrate.** p-epi on p++ is far more robust than a lightly doped substrate. Many designs on p- substrates needed extra mask passes to fix latch-up (Hastings). Even SOI latches when PMOS and NMOS share an isolated tank.
7. **Mark deliberate forward-biased bodies and every pin device** on the schematic so layout knows where the injectors are.

> [!tip] Remark
> The process side of the same fight is the p++ substrate and the retrograde well (low $R_{sub}$, low $R_{well}$): see [[CMOS Processing#Starting Wafer]] and [[CMOS Processing#Diffusion and Ion Implantation]].

## Level 2: Guard Rings

### Majority vs Minority Rings

"Guard ring" means two different structures. Mixing them up is a classic error.

| Ring | Built from (CMOS) | Tied to | What it does |
|---|---|---|---|
| **Majority-carrier** ring (tap ring) | p+ ring in the substrate around NMOS; n+ ring in the well around PMOS | GND / $V_{DD}$ (the body's own potential) | Supplies majority carriers, **pins the body potential**, lowers $R_{sub}$/$R_{well}$. Does **not** stop minority carriers. |
| **Electron-collecting** (ECGR) | n+ (NMoat) or n-well ring in the p-substrate | $V_{DD}$ (preferred) or GND | A reverse-biased junction sweeps up injected electrons |
| **Hole-collecting** (HCGR) | p+ (PMoat) ring inside the n-well, around the injector | GND | A reverse-biased junction sweeps up injected holes; needs a retrograde well |
| Electron-/hole-**blocking** (EBGR/HBGR) | High-low junctions (n+/n−, p+/p−), buried layers, sinkers, deep trench | — | A built-in field reflects minority carriers so they recombine. Needs BiCMOS layers (NBL, deep N+, DTI) |
| Noise-blocking ring | n-well or NSD ring around a noisy NMOS | clean supply / GND | Interrupts the near-surface substrate path. For [[Substrate Noise]], not latch-up |

> [!note]- Why a high-low junction blocks (Hastings §5.4.4)
> In an n+/n− junction electrons diffuse from n+ to n− until a built-in field balances them. That field points so as to push **holes** back into the n− side, so the junction reflects holes. The fraction that leaks through (the *permeation ratio*) scales with the lightly doped region's minority lifetime and volume, and inversely with the doping ratio $N_{high}/N_{low}$. A ratio of about **100** makes an effective blocker. Example: NBL under a deep, lightly doped tank lets about 0.2 % of the injected holes through. The epi/p++ interface of a CMOS wafer is a free electron-blocking high-low junction: it keeps injected electrons in the epi, which is why ECGRs work much better on p++ substrates. Modern shallow, heavily doped wells (surface ~10¹⁸ cm⁻³) no longer form good high-low junctions with implanted sinkers, so holes leak out.

### CMOS Electron-Collecting Guard Rings

```tikz title="Electron-collecting guard rings in CMOS around an NSD injector. (A) An NMoat (n+) ring is shallow; electrons burrow beneath it unless it is wide. (B) An n-well ring reaches deeper and collects more, but its vertical resistance debiases it, so tie it to V_DD and contact it with as much NMoat as fits. After Hastings Fig. 14.12."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  \begin{scope}
    \draw[psub] (0,0) rectangle (6.2,2.4);
    \draw[ndiff] (0.3,2.4) rectangle (1.3,2.15);
    \draw[ndiff] (2.0,2.4) rectangle (4.0,2.15);
    \draw[pdiff] (4.6,2.4) rectangle (5.3,2.15);
    \node[font=\scriptsize,above] at (0.8,2.4) {PIN};
    \node[font=\scriptsize,above] at (3.0,2.4) {$V_{DD}$ (ECGR)};
    \node[font=\scriptsize,above] at (4.95,2.4) {GND};
    \draw[->,thick,blue!70!black] (0.9,2.1) to[out=-60,in=-120] (2.5,2.1);
    \draw[->,thick,blue!70!black] (1.0,2.1) to[out=-70,in=-110] (3.5,2.1);
    \draw[->,thick,blue!70!black,dashed] (1.0,2.05) to[out=-80,in=180] (3.0,0.9) to[out=0,in=-110] (6.0,1.6);
    \node[font=\scriptsize,blue!70!black,align=center] at (3.3,0.4) {some burrow under: width $\ge$ epi thickness};
    \node at (3.1,-0.4) {(A) NMoat ring};
  \end{scope}
  \begin{scope}[xshift=7.0cm]
    \draw[psub] (0,0) rectangle (6.2,2.4);
    \draw[nwell] (2.0,2.4) -- (2.0,0.9) -- (4.0,0.9) -- (4.0,2.4);
    \draw[ndiff] (0.3,2.4) rectangle (1.3,2.15);
    \draw[ndiff] (2.2,2.4) rectangle (3.8,2.15);
    \draw[pdiff] (4.6,2.4) rectangle (5.3,2.15);
    \node[font=\scriptsize,above] at (0.8,2.4) {PIN};
    \node[font=\scriptsize,above] at (3.0,2.4) {$V_{DD}$};
    \node[font=\scriptsize,above] at (4.95,2.4) {GND};
    \draw[->,thick,blue!70!black] (0.9,2.1) to[out=-60,in=180] (2.0,1.6);
    \draw[->,thick,blue!70!black] (1.0,2.1) to[out=-80,in=-120] (2.4,0.95);
    \draw[very thick,cyan!50!black,decorate,decoration={zigzag,amplitude=1.5pt,segment length=4pt}] (3.0,2.1) -- (3.0,1.0);
    \node[font=\scriptsize,anchor=west] at (3.1,1.45) {$R_{vert}$};
    \node[font=\scriptsize,align=center] at (3.1,0.45) {deeper, but resistive};
    \node at (3.1,-0.4) {(B) n-well ring};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **NMoat ECGR:** NSD is shallow (in modern processes it sits recessed in the STI) and CMOS supplies are too low to deplete deep. The only knob is width: make it **at least as wide as the p-epi is thick** (or as the retrograde p-well is deep).
- **N-well ECGR:** deeper, so it intercepts more, but tie it to a **supply**, not ground, and fill it with NMoat to cut its vertical resistance. Deep, lightly doped wells are of questionable use. Modern shallow, heavily doped wells work better.
- If the ring must be grounded, prefer a **wide NMoat** ring to an n-well ring.
- Typical attenuation with a p++ substrate: electron current reduced **10–100×** (Hastings §5.4.4). A grounded ring made of low-resistance layers survives 100–200 mA latch-up tests only if every part of it connects to ground through metal.
- Double up where needed: a grounded ECGR inside a supply-tied ECGR, in case the first one saturates.

> [!tip] Remark
> These are reverse-biased pn junctions collecting carriers, the same physics as a BJT collector ([[BJTs#Collector Current]]). The ring is the collector of the parasitic npn you are trying to starve.

### CMOS Hole-Collecting Guard Rings

```tikz title="Hole-collecting guard ring in CMOS. A PSD injector on a pin sits in an n-well; a PMoat ring around it, inside the same well, is tied to ground and collects holes before they reach the well edge and the substrate. It works only if the well bottom is strongly retrograde (about 10x the mid-well doping) so holes cannot escape downward. An n+ ring outside it ties the well to V_DD. After Hastings Fig. 14.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  \draw[psub] (0,0) rectangle (10,2.6);
  \draw[nwell] (0.6,2.6) -- (0.6,0.9) -- (9.4,0.9) -- (9.4,2.6);
  \fill[cyan!40] (0.62,0.92) rectangle (9.38,1.15);
  \node[font=\scriptsize,anchor=west] at (6.8,1.03) {retrograde bottom};
  \draw[ndiff] (0.9,2.6) rectangle (1.6,2.35);
  \draw[pdiff] (2.1,2.6) rectangle (3.2,2.35);
  \draw[pdiff] (4.4,2.6) rectangle (5.6,2.35);
  \draw[pdiff] (6.8,2.6) rectangle (7.9,2.35);
  \draw[ndiff] (8.4,2.6) rectangle (9.1,2.35);
  \node[font=\scriptsize,above] at (1.25,2.6) {$V_{DD}$};
  \node[font=\scriptsize,above] at (2.65,2.6) {GND};
  \node[font=\scriptsize,above] at (5.0,2.6) {PIN $>V_{DD}$};
  \node[font=\scriptsize,above] at (7.35,2.6) {GND};
  \node[font=\scriptsize,above] at (8.75,2.6) {$V_{DD}$};
  \draw[->,thick,red!70!black] (4.6,2.3) to[out=-110,in=-60] (3.0,2.3);
  \draw[->,thick,red!70!black] (5.4,2.3) to[out=-70,in=-120] (7.0,2.3);
  \draw[->,thick,red!70!black,dashed] (5.0,2.3) -- (5.0,1.2);
  \node[font=\scriptsize,red!70!black,anchor=west] at (5.05,1.55) {reflected};
  \node[font=\scriptsize] at (5.0,0.4) {p-substrate};
  \draw[decorate,decoration={brace,amplitude=4pt,mirror}] (2.1,2.25) -- (3.2,2.25);
  \node[font=\scriptsize,align=center] at (1.5,1.6) {PMoat ring:\\ width $\ge$ well depth};
\end{circuitikz}
\end{document}
```

- Without a retrograde well, nothing stops holes diffusing straight down to the substrate, so a hole ring can't work (old CMOS).
- **Pure CMOS cannot build hole-*blocking* rings**: there is no deep N+ sinker or trench to close the sidewall.
- The PMoat ring does not reach the heavily doped well bottom. To help it: ground it (more reverse bias, deeper depletion) and make it **as wide as the well is deep**. Even minimum width collects some holes.
- In practice, CMOS designers usually rely on n+ well taps around PMOS (a majority ring) plus spacing, and add hole rings only around known injectors.

> [!note]- Detail: BiCMOS and bipolar rings, which do much better (Hastings §§14.2.1–14.2.6)
> ```tikz title="BiCMOS hole-blocking guard ring: an N-well floored by NBL and walled by a deep-N+ sinker. The high-low junctions trap holes from a PSD injector in the well, where they recombine. Draw the NBL out to the outer edge of the sinker so the doping stays high where they meet. After Hastings Figs. 5.38 and 14.15(A)."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[font=\small,>=stealth]
>   \draw[fill=orange!12,draw=black!60] (0,0) rectangle (8,3);
>   \draw[fill=cyan!18,draw=cyan!50!black,dashed] (1.2,3) rectangle (6.8,1.0);
>   \draw[fill=cyan!55,draw=black!60] (1.0,1.0) rectangle (7.0,0.6);
>   \draw[fill=green!45,draw=black!60] (1.0,3) rectangle (1.6,0.8);
>   \draw[fill=green!45,draw=black!60] (6.4,3) rectangle (7.0,0.8);
>   \draw[fill=orange!65,draw=black!60] (3.4,3) rectangle (4.6,2.75);
>   \node[font=\scriptsize,above] at (4.0,3) {PSD on pin};
>   \node[font=\scriptsize] at (4.0,0.8) {NBL};
>   \node[font=\scriptsize,rotate=90] at (1.3,1.9) {deep N+};
>   \node[font=\scriptsize,rotate=90] at (6.7,1.9) {deep N+};
>   \draw[->,thick,red!70!black] (3.6,2.7) to[out=-120,in=0] (1.65,2.0);
>   \draw[->,thick,red!70!black] (4.0,2.7) -- (4.0,1.05);
>   \draw[->,thick,red!70!black] (4.4,2.7) to[out=-60,in=180] (6.35,2.0);
>   \node[font=\scriptsize,align=center] at (4.0,1.6) {reflected,\\ recombine};
>   \node[font=\scriptsize] at (4.0,0.25) {p-substrate};
> \end{circuitikz}
> \end{document}
> ```
> - **Standard bipolar ECGR:** deep N+ + NBL + emitter in a tank, tied to the highest supply. Only marginally effective, because electrons go under it through the lightly doped substrate. Designers often skip it and rely on spacing plus hole rings.
> - **Standard bipolar HBGR:** NBL floor + deep-N+ wall around the injector, with no gaps. Efficiency usually above 95 %, often above 98 %. Add an HCGR inside for above 99 %. In standard bipolar it beats the ECGR at preventing latch-up.
> - **P-bar / N-bar:** a strip of base (P) or emitter/sinker (N) between merged lateral PNPs to stop cross-injection when one saturates. Blocks most, not all; if 1 % leakage would break the circuit, use separate tanks.
> - **BiCMOS ECGR:** NBL ring contacted by deep N+, efficiency above 90 % observed, can be grounded. **Isolated NMOS** (p-epi tank cut off by NBL + deep N+ or DTI with tilted arsenic sidewalls) is a 100 %-efficient electron collector around the NMOS.
> - **BiCMOS HCGR** in a twin-well process with a blanket PBL under the shallow well: the PBL plus surrounding P-well collect 100 % of holes.
> - **Pitfall:** heavily doped modern shallow N-wells (surface above 10¹⁸ cm⁻³) with implanted sinkers lose the ≈100:1 ratio, so holes slip out of the sidewalls. Some processes also have a hole-permeable NBL.

### Where to Put Guard Rings

```tikz title="Top view of a die corner. Every pad has its primary ESD device; the whole I/O ring and its ESD sits outside one shared electron-collecting guard ring (n-well to V_DD) plus a p+ tap ring, which separate injectors from the core. The ring can stop short of the die edge (L or U shape) because the edge side protects nothing. After Hastings Secs. 14.2 and 5.4.4 (Fig. 5.35)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  pdiff/.style={fill=orange!65,draw=black!60},
  mtwo/.style={fill=violet!55,draw=black!70}]
  \draw[thick] (0,0) rectangle (9,6.5);
  \node[font=\scriptsize,anchor=south west] at (0,6.5) {die edge (scribe seal)};
  \foreach \y in {2.9,4.2,5.5} {\draw[mtwo] (0.3,\y) rectangle (1.1,\y+0.8); \draw[fill=gray!25] (1.25,\y+0.1) rectangle (1.95,\y+0.7); \node[font=\tiny] at (1.6,\y+0.4) {ESD};}
  \foreach \x in {3.0,4.4,5.8,7.2} {\draw[mtwo] (\x,0.3) rectangle (\x+0.8,1.1); \draw[fill=gray!25] (\x+0.1,1.25) rectangle (\x+0.7,1.95); \node[font=\tiny] at (\x+0.4,1.6) {ESD};}
  % ECGR L shape (actually wraps core) 
  \draw[nwell,line width=0.6pt] (2.15,6.5) -- (2.15,2.15) -- (9,2.15) -- (9,2.45) -- (2.45,2.45) -- (2.45,6.5) -- cycle;
  \draw[pdiff] (2.55,6.5) -- (2.55,2.55) -- (9,2.55) -- (9,2.7) -- (2.7,2.7) -- (2.7,6.5) -- cycle;
  \draw[fill=black!5] (3.0,3.0) rectangle (8.6,6.2);
  \node[align=center,font=\scriptsize] at (5.8,4.6) {core: every device tapped\\ (majority rings / tap strips)};
  \draw[->] (1.2,1.15) -- (2.2,2.1);
  \node[font=\scriptsize,anchor=north,align=center] at (1.2,1.1) {n-well ECGR\\ to $V_{DD}$};
  \draw[->] (9.6,2.62) -- (9.05,2.62);
  \node[font=\scriptsize,anchor=west] at (9.6,2.62) {p+ tap ring to GND};
  \node[font=\scriptsize,anchor=west] at (9.6,2.2) {ring ends at die edges};
\end{circuitikz}
\end{document}
```

1. **Ring the injector, not the victim.** There are far fewer injectors (pin devices, ESD, charge pumps, marked bodies) than potential victims.
2. **ESD devices along the periphery can share one ring** that separates the whole pad ring from the core.
3. **Put the ring as close to the injector as rules allow.** It collects carriers before they spread.
4. **Metal it all the way round** and size that metal for the transient current. A ring tied to a supply tolerates more debiasing than a grounded one, but dissipates power at high voltage.
5. The part of a ring along the die edge does little. **L- or U-shaped rings** ending at the edge save area.
6. **Noise rings are separate.** For substrate noise, rings around the *noisy* device beat rings around the victim, and their grounds should return on separate leads or pins. That is [[Substrate Noise#Guard Rings at the Rule Level]].

> [!tip] Remark
> Razavi's "guard ring" in §19.3 (a continuous ring of substrate ties plus an n-well) is the noise-isolation use of the same geometry: low-impedance substrate ties to soak up injected noise current, with the deep n-well blocking surface currents. The latch-up use and the noise use share layout but not purpose. See [[Substrate Noise]].

## Level 3: Interconnect

### Wires Are Resistors: IR Drop

$$
\boxed{\Delta V = I\,R_\square\,\frac{L}{W}}
$$

- Hastings: 1000 squares of 50 mΩ/□ at 100 µA is 0.5 mV, already enough to upset a precision circuit. Contacts and vias are worse per item: in Razavi's 40 nm-class numbers, an 80 nm contact to silicided poly is 30–40 Ω and an M1–M2 via 5–10 Ω.
- **Power buses:** strap several metal layers in parallel. The top metal is typically about twice as thick as the lower ones, so it takes **three layers in parallel to halve** bus resistance (Razavi §19.2.7). That eats routing tracks.
- **Taper** a bus whose tap-off currents are known, so the drop per unit length stays roughly constant.

```tikz title="A ground bus that collects current from blocks along its length carries the most current next to the pad. Uniform width (top) puts most of the drop near the pad; tapering (bottom) spends width where the current is. After Razavi Fig. 19.47."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70}]
  \draw[mtwo] (0,2.2) rectangle (1,3.2); \node[font=\scriptsize,white] at (0.5,2.7) {GND};
  \draw[mone] (1,2.55) rectangle (9,2.85);
  \foreach \x in {2.5,4.5,6.5,8.5} {\draw[->] (\x,3.4) -- (\x,2.9); \node[font=\scriptsize,above] at (\x,3.4) {$I$};}
  \node[font=\scriptsize,anchor=west] at (9.2,2.7) {uniform: drop concentrates near the pad};
  \draw[mtwo] (0,0) rectangle (1,1.0); \node[font=\scriptsize,white] at (0.5,0.5) {GND};
  \draw[mone] (1,0.05) -- (9,0.38) -- (9,0.62) -- (1,0.95) -- cycle;
  \foreach \x in {2.5,4.5,6.5,8.5} {\draw[->] (\x,1.4) -- (\x,0.9); \node[font=\scriptsize,above] at (\x,1.4) {$I$};}
  \node[font=\scriptsize,anchor=west] at (9.2,0.5) {tapered: width $\propto$ current carried};
  \node[font=\scriptsize] at (2.0,-0.3) {$4I$};
  \node[font=\scriptsize] at (8.2,-0.3) {$I$};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> What an IR drop does to a matched pair or a mirror (a $\Delta V$ on a source line acts like a $\Delta V_{TH}$, scaled by $g_m/I_D$) is owned by [[Device Matching#Wiring Resistance and Reference Distribution]]. The fix there, distributing bias as currents rather than voltages, is in [[Layout Fundamentals#Distributing bias references]].

### Current-Density Limits (Rule Level)

$$
\boxed{W_{min} = \frac{I_{DC}}{J_W},\qquad J_W\approx 2\ \mathrm{mA/\mu m}\ \text{(Razavi's rule of thumb for Al; read the real value per layer from the PDK)}}
$$

- **Vias and contacts fail first.** Fill the overlap of two wide leads with as many vias as fit.
- **ESD metal is a third, different limit** (adiabatic heating, [[#ESD Metal and Layout]]). The old "20× / 40× the EM width" rules have no physical basis (Hastings).

> [!tip] Remark
> The physics (Black's equation, Blech length, AC vs DC, via and thermal derating), the per-layer rule and which of EM or IR drop sets the width (the crossover length $L^*$) belong to [[Electromigration]] ([[Electromigration#Current density and the per-layer rule]], [[Electromigration#Worked example: a bias bus and an output-stage lead]]). This note uses only the width rule.

### Star Routing and Kelvin Connections

```tikz title="Bad vs good return wiring. (A) Two matched transistors' emitters tap a shared ground line at A and B; 1 mA in R_m (10 squares of 30 mOhm/sq) puts 0.3 mV between them. (B) Both leads return to one star point C: the drop is common to both and cancels in a differential circuit. After Hastings Fig. 15.26."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \begin{scope}
    \draw (0,1.6) node[npn,anchor=E](Q1){};
    \draw (2.4,1.6) node[npn,anchor=E](Q2){};
    \node[font=\scriptsize,anchor=east] at (-0.8,1.6) {$Q_1$};
    \node[font=\scriptsize,anchor=east] at (1.6,1.6) {$Q_2$};
    \draw (-1.0,0) -- (Q1.E |- 0,0) node[circ]{} node[below,font=\scriptsize]{A};
    \draw (Q1.E) -- (Q1.E |- 0,0);
    \draw (Q1.E |- 0,0) to[R,l_=\scriptsize$R_m$] (Q2.E |- 0,0) node[circ]{} node[below,font=\scriptsize]{B};
    \draw (Q2.E) -- (Q2.E |- 0,0) -- ++(1.0,0);
    \draw[<-] (1.1,0.35) -- (1.9,0.35) node[right,font=\scriptsize]{1 mA};
    \node[font=\scriptsize,red!70!black] at (1.2,-0.9) {$\Delta V_E = 0.3$ mV};
    \node at (1.2,-1.5) {(A) bad: shared line};
  \end{scope}
  \begin{scope}[xshift=6.5cm]
    \draw (0,1.6) node[npn,anchor=E](P1){};
    \draw (2.4,1.6) node[npn,anchor=E](P2){};
    \coordinate (C) at (1.2,0);
    \draw (P1.E) -- (C);
    \draw (P2.E) -- (C);
    \draw (C) node[circ]{} node[above,font=\scriptsize]{C};
    \draw (-1.0,0) to[R,l=\scriptsize$R_m/2$] (C);
    \draw (C) to[R,l=\scriptsize$R_m/2$] (3.4,0);
    \node[font=\scriptsize,green!40!black] at (1.2,-0.9) {$\Delta V_E = 0$ (common mode)};
    \node at (1.2,-1.5) {(B) good: star point};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Star node:** every sensitive return goes to one point. Drops elsewhere move both sides together (common mode).
- **Kelvin connection:** separate **force** leads (carry the current) from **sense** leads (carry almost none, so they drop nothing). For extreme accuracy, match the two sense currents and route the sense leads with equal resistance so their residual drops cancel. The metal-resistor layout is in [[Resistor]].
- Two bondpads wired to the same package pin for a Kelvin pair each still need their own ESD device (bond wires have about 1 nH/mm, worth volts during a CDM strike; [[#Rail Clamps and Whole-Chip Strategy]]).

> [!tip] Remark
> [[Resistor]] owns the Kelvin-connected metal-resistor layout and [[Current Mirrors]] the star-connected source straps. This section is the general routing rule they both follow.

### Crossing, Coupling and Shielding

$$
\boxed{\Delta V = C\,R\,\frac{dV}{dt}}\qquad\boxed{\Delta V_{in} = \frac{C_c}{C_c + C_{tot}}\,\Delta V_{aggr}}
$$

- A 0.1 ns logic edge slews faster than 1 GV/s. Through 10 fF into a 100 kΩ node that is **1 V** (Hastings Eq. 15.23). A 50 aF overlap from a 1 V clock onto a 10 fF node gives **5 mV** (Razavi).
- **Noisy** = fast slewing (clocks, digital, switch nodes, charge pumps). **Sensitive** = high-gain inputs, ADC inputs, references, analog grounds, high-value resistor networks, low-current bias lines.

```tikz title="Shielding, in cross-section and top view. (a) Grounded lines beside the sensitive wire terminate the field from neighbours; this beats spacing alone. (b) Lines plus planes above and below enclose the wire completely (at the cost of capacitance and three layers). (c) A noisy M3 line crossing a sensitive M1 line at right angles, with an M2 shield plate between them tied to the sensitive line's own reference and extending past the crossing. After Razavi Figs. 19.42, 19.43 and Hastings Fig. 15.28(A)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70},
  mthree/.style={fill=teal!45,draw=black!70},
  diel/.style={fill=gray!8,draw=black!40}]
  \begin{scope}
    \draw[diel] (0,0) rectangle (5,1.6);
    \draw[mone] (0.3,0.6) rectangle (0.8,0.95); \node[font=\scriptsize,above] at (0.55,0.95) {$V_A$};
    \draw[mone] (1.3,0.6) rectangle (1.8,0.95); \node[font=\scriptsize,above] at (1.55,0.95) {GND};
    \draw[mone] (2.25,0.6) rectangle (2.75,0.95); \node[font=\scriptsize,above] at (2.5,0.95) {$V_{in}$};
    \draw[mone] (3.2,0.6) rectangle (3.7,0.95); \node[font=\scriptsize,above] at (3.45,0.95) {GND};
    \draw[mone] (4.2,0.6) rectangle (4.7,0.95); \node[font=\scriptsize,above] at (4.45,0.95) {$V_B$};
    \node at (2.5,-0.35) {(a) side shields};
  \end{scope}
  \begin{scope}[xshift=5.8cm]
    \draw[diel] (0,0) rectangle (4,1.6);
    \draw[mone] (0.3,0.15) rectangle (3.7,0.35); \node[font=\scriptsize,anchor=west,white] at (0.35,0.25) {M$_{n-1}$ GND};
    \draw[mtwo] (0.3,1.25) rectangle (3.7,1.45); \node[font=\scriptsize,anchor=west,white] at (0.35,1.35) {M$_{n+1}$ GND};
    \draw[fill=black] (0.5,0.35) rectangle (0.65,1.25);
    \draw[fill=black] (3.35,0.35) rectangle (3.5,1.25);
    \draw[mthree] (1.6,0.65) rectangle (2.4,0.95); \node[font=\scriptsize] at (2.0,1.1) {$V_{in}$ (M$_n$)};
    \node at (2.0,-0.35) {(b) full enclosure};
  \end{scope}
  \begin{scope}[xshift=10.8cm,yshift=-0.2cm]
    \draw[mone] (0,0.75) rectangle (4,1.05); \node[font=\scriptsize,anchor=west] at (4.05,0.9) {M1 sensitive};
    \draw[mtwo,opacity=0.85] (1.3,0.3) rectangle (2.7,1.5); \node[font=\scriptsize,anchor=west] at (2.75,1.65) {M2 shield to sensitive ref.};
    \draw[mthree] (1.8,-0.1) rectangle (2.2,1.9); \node[font=\scriptsize,anchor=south] at (2.0,1.9) {M3 noisy};
    \draw[<->] (2.2,0.2) -- (2.7,0.2); \node[font=\scriptsize,anchor=north] at (2.45,0.15) {overhang};
    \node at (2.0,-0.6) {(c) right-angle crossing};
  \end{scope}
\end{circuitikz}
\end{document}
```

Rules:

1. **Noisy never runs over, under or alongside sensitive.** Lateral capacitance in modern metal stacks is as large as vertical.
2. If they must cross, **cross at 90°** (minimum overlap), then check the coupled $\Delta V$ by hand or from extraction.
3. **Shield** with a plate between them, or a quiet line (static digital, power, ground) run between them. Tie the shield to the **reference of the sensitive node** (e.g. analog ground for a reference output). Extend it past the crossing to catch fringing.
4. **Go differential:** coupling becomes common mode. Add a dummy line so both halves see the same aggressor overlap. Even 10 % capacitor mismatch leaves about 10× less error (Razavi Fig. 19.41).
5. **Slow down** static control lines: a few tens of kΩ in series with the driving gate cuts their slew and their injection (Hastings).
6. Mark nets on the schematic: power (red, width noted, no tunnels), noisy (yellow, `_n`), sensitive (green, `_s`, no tunnels, no substrate contacts in sensitive grounds) (Hastings Table 14.1 and §15.4.4).

> [!note]- Detail: wire noise and RC delay (Razavi §19.2.7)
> - **Thermal noise of wiring:** a 100 µm M4 line (40 mΩ/□, 2 µm wide: 2 Ω), two vias at 5 Ω (2.5 Ω each for parallel pairs as drawn) and a 30 Ω poly contact pair (15 Ω) total 24.5 Ω, which is $\sqrt{4kTR} = 0.64$ nV/√Hz. That is significant at an LNA input (Example 19.5). See [[Noise]].
> - **Distributed RC delay:** $T_D\approx\tfrac12 R_uC_uL^2$ (Eq. 19.14), quadratic in length. A clock and a signal running in parallel to an array of samplers see different delays and different dispersion (a square wave vs a smooth signal), so the sampled levels are skewed. Buffers sharpen edges but add delay uncertainty.
> - Line capacitance (parallel plate plus fringe) belongs to [[Capacitor]].

### Wide-Metal Slotting

```tikz title="Slots in wide metal (anti-delamination or stress-relief) must run along the current. Left: slots parallel to the current barely raise resistance. Right: slots across the current pinch it into necks. Slots are staggered, and offset between adjacent layers. After Hastings Figs. 15.11 and 14.42(B)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70}]
  \begin{scope}
    \draw[mone] (0,0) rectangle (6,2.2);
    \foreach \x in {0.4,2.4,4.4} {\foreach \y in {0.35,1.55} {\draw[fill=white] (\x,\y) rectangle (\x+1.3,\y+0.25);}}
    \foreach \x in {1.4,3.4} {\draw[fill=white] (\x,0.95) rectangle (\x+1.3,1.2);}
    \draw[->,very thick,yellow!80!black] (0.2,1.08) -- (5.8,1.08);
    \node[font=\scriptsize] at (3,-0.35) {good: slots parallel to $I$};
    \draw[<->] (0.4,2.4) -- (1.7,2.4) node[midway,above,font=\scriptsize] {$L_S$};
    \draw[<->] (1.7,2.4) -- (2.4,2.4) node[midway,above,font=\scriptsize] {$S_L$};
    \draw[<->] (6.2,1.55) -- (6.2,1.8) node[midway,right,font=\scriptsize] {$W_S$};
  \end{scope}
  \begin{scope}[xshift=7.6cm]
    \draw[mone] (0,0) rectangle (6,2.2);
    \foreach \x in {0.7,2.3,3.9} {\draw[fill=white] (\x,0.2) rectangle (\x+0.25,1.6);}
    \foreach \x in {1.5,3.1,4.7} {\draw[fill=white] (\x,0.6) rectangle (\x+0.25,2.0);}
    \draw[->,very thick,yellow!80!black] (0.1,1.9) -- (0.6,1.9);
    \draw[->,very thick,yellow!80!black] (5.2,0.3) -- (5.9,0.3);
    \node[font=\scriptsize,red!70!black] at (3.0,2.45) {current forced through necks};
    \node[font=\scriptsize] at (3,-0.35) {bad: slots across $I$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\frac{R_{slot}}{R_{unslot}}\approx\frac{W\,L_S}{(S_L+L_S)(W-N_SW_S)}+\frac{S_L}{S_L+L_S}}
$$

($L_S$ slot length, $W_S$ slot width, $S_L$ gap between slots along the line, $N_S$ average number of slots across the width $W$.)

- Slots exist for different reasons: **anti-delamination** near the die edge in plastic packages (oxide locks into the slots against shear), stress-voiding relief, and maximum-density rules. Many PDKs draw them on a `METxSLOT` layer subtracted at mask generation.
- Anti-delamination slots must be **orthogonal to the shear-stress gradient**: parallel to the die edge along an edge, along the diagonal in a corner exclusion zone. Luckily that is also along the current in a ground ring.
- Where a short lead must turn (ESD device to ring), keep it short and orient slots so they block no current. Or replace the slotted lead with **several narrower parallel leads**.

### Single-Level Interconnection and Tunnels

With one metal layer, leads cannot cross freely, so placement is planned with **mock layouts** (rough sketches showing terminals and tank contacts) to minimise crossings. It is a nearly lost art, but it reappears wherever a metal capacitor or shield blocks the upper layers over a region. Crossing techniques, cheapest first (Hastings §14.3.2):

1. Cross over resistors (if not field-plated, not sensitive, not lightly doped HSR).
2. Rearrange device terminals (CEB vs CBE NPN).
3. Stretch devices so a lead passes between terminals (stretch all matched partners equally).
4. Route through merged devices (a base with two contacts).
5. **Insert a tunnel (crossunder):** a low-value resistor under the other lead. It costs area, series resistance (a base tunnel is a few hundred Ω), tens to hundreds of fF of junction capacitance, and leakage. The circuit designer must approve and resimulate each one. Never in power or sensitive leads.
6. Rearrange the bondpads.

```tikz title="A tunnel (crossunder): lead A drops through contacts into a low-resistance diffusion (or poly) and passes under lead B. The tunnel adds series R, junction C and leakage, so power and sensitive leads never tunnel. After Hastings Fig. 14.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  ndiff/.style={fill=green!45,draw=black!60},
  cont/.style={fill=black,draw=none},
  mone/.style={fill=blue!55,draw=black!70}]
  \draw[ndiff] (1.5,1.15) rectangle (5.5,1.85);
  \draw[mone] (0,1.25) rectangle (2.1,1.75);
  \draw[mone] (4.9,1.25) rectangle (7,1.75);
  \draw[cont] (1.65,1.38) rectangle (1.9,1.62);
  \draw[cont] (5.1,1.38) rectangle (5.35,1.62);
  \draw[mone] (3.25,0) rectangle (3.75,3);
  \node[font=\scriptsize,anchor=west] at (3.8,2.7) {lead B (M1)};
  \node[font=\scriptsize] at (0.6,2.0) {lead A};
  \node[font=\scriptsize,anchor=north west] at (3.9,1.1) {tunnel: emitter / NSD / poly};
\end{circuitikz}
\end{document}
```

> [!note]- Detail: bipolar tunnel types (Hastings §14.3.3)
> Base tunnels share tanks without merging signals (most common, highest R). Emitter-in-tank tunnels have about 10× lower sheet resistance; NBL adds capacitance but not much less R, so leave it out. Emitter-in-iso saves the tank but breaks down at a few volts and leaks, so use it mostly in ground leads. Stacked tunnels (emitter + deep N+ + NBL) give the lowest R. NBL tunnels bridge two tanks, with the isolation acting as a P-bar; they need an NBL/iso breakdown high enough to avoid Zener leakage.

## Level 4: ESD Protection

### ESD Models: HBM, MM, CDM

```tikz title="The three component-level ESD tests and their current waveforms. HBM: a charged body (C_B) discharging through skin resistance; MM: a charged capacitor with no resistor, only stray inductance; CDM: the package itself is charged on a field plate and discharges through the touched pin. Waveforms after Hastings Fig. 14.21 (2 kV HBM, 500 V CDM)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \begin{scope}
    \draw (0,0) node[ground]{} to[C,l_=\scriptsize$100$ pF] (0,2) -- (0.6,2) to[R,l=\scriptsize$1.5$ k$\Omega$] (2.4,2) -- (2.8,2);
    \draw[fill=gray!20] (2.8,1.2) rectangle (3.6,2.4); \node[font=\scriptsize] at (3.2,1.8) {DUT};
    \draw (3.2,1.2) -- (3.2,0) node[ground]{};
    \node at (1.6,-0.7) {HBM};
  \end{scope}
  \begin{scope}[xshift=4.6cm]
    \draw (0,0) node[ground]{} to[C,l_=\scriptsize$200$ pF] (0,2) -- (0.6,2) to[L,l=\scriptsize$\approx750$ nH] (2.4,2) -- (2.8,2);
    \draw[fill=gray!20] (2.8,1.2) rectangle (3.6,2.4); \node[font=\scriptsize] at (3.2,1.8) {DUT};
    \draw (3.2,1.2) -- (3.2,0) node[ground]{};
    \node at (1.6,-0.7) {MM (no $R$)};
  \end{scope}
  \begin{scope}[xshift=9.4cm]
    \draw[fill=gray!40] (0,0) rectangle (3.6,0.25); \node[font=\scriptsize,anchor=west] at (3.65,0.12) {field plate (HV)};
    \draw[fill=yellow!20] (0,0.25) rectangle (3.6,0.4); \node[font=\scriptsize,anchor=west] at (3.65,0.4) {FR4};
    \draw[fill=gray!20] (0.8,0.4) rectangle (2.8,1.1); \node[font=\scriptsize] at (1.8,0.85) {IC (upside down)};
    \foreach \x in {1.0,1.4,1.8,2.2,2.6} {\node[font=\tiny] at (\x,0.52) {+};}
    \draw (2.6,1.1) -- (2.6,1.6); \draw[->,thick] (2.6,2.4) -- (2.6,1.7); \node[font=\scriptsize,anchor=west] at (2.7,2.1) {grounded probe};
    \node at (1.8,-0.7) {CDM};
  \end{scope}
  \begin{scope}[yshift=-4.6cm]
    \draw[->] (0,0) -- (5.6,0) node[right,font=\scriptsize] {$t$ (ns)};
    \draw[->] (0,0) -- (0,2.8) node[above,font=\scriptsize] {$I$ (A)};
    \draw[thick,red!70!black,domain=0.075:5.2,samples=60] plot (\x,{2.6*exp(-(\x-0.075)/1.15)});
    \draw[thick,red!70!black] (0,0) -- (0.075,2.6);
    \foreach \t/\l in {1/100,2/200,3/300,4/400} {\draw (\t,0.06) -- (\t,-0.06) node[below,font=\scriptsize] {\l};}
    \draw (0.06,2.6) -- (-0.06,2.6) node[left,font=\scriptsize] {1.3};
    \node[font=\scriptsize,anchor=west,align=left] at (1.4,2.0) {2 kV HBM: rise $\approx$15 ns,\\ decay $\approx$230 ns};
  \end{scope}
  \begin{scope}[yshift=-4.6cm,xshift=7.6cm]
    \draw[->] (0,0) -- (5.6,0) node[right,font=\scriptsize] {$t$ (ns)};
    \draw[->] (0,-1.0) -- (0,2.8) node[above,font=\scriptsize] {$I$ (A)};
    \draw[thick,red!70!black,domain=0:5.2,samples=120] plot (\x,{2.5*exp(-\x/1.2)*sin(\x*170)});
    \foreach \t/\l in {2/0.5,4/1} {\draw (\t,0.06) -- (\t,-0.06) node[below,font=\scriptsize] {\l};}
    \draw (0.06,2.1) -- (-0.06,2.1) node[left,font=\scriptsize] {5};
    \node[font=\scriptsize,anchor=west,align=left] at (2.0,2.0) {500 V CDM: $>$5 A in\\ $\approx$0.25 ns, over in 1--2 ns};
  \end{scope}
\end{circuitikz}
\end{document}
```

| Model | Represents | Circuit | Peak / duration | Typical spec | What it kills |
|---|---|---|---|---|---|
| **HBM** (human body) | A charged person touching a pin | 100 pF through 1.5 kΩ | $V/1.5\,\mathrm{k\Omega}$: **1.3 A at 2 kV**, $RC = 150$ ns (testers ≈230 ns) | **1 kV** (Industry Council, 2010); 2 kV still often demanded | Junctions and clamps by **heating**: thermal runaway, filaments, molten metal |
| MM (machine) | Extreme HBM, no resistor | 200 pF, ≈750 nH stray | Oscillatory | 200 V; now considered **redundant** | Same as HBM |
| **CDM** (charged device) | The package charged during handling, discharging through one pin | Package capacitance to a grounded probe | **>5 A in ≈0.25 ns**, gone in 1–2 ns (≈12 A in Hastings's worst example) | **250 V** suggested; 500 V often demanded | **Gate oxides** by **voltage**: too fast for thermal runaway, but $IR$ drops of tens of volts |
| System level (IEC 61000-4-2) | A product in use | Lower-R version of HBM | 8 kV contact: ≈30 A, <1 ns, then ≈16 A over 50–100 ns | Only for pins on user connectors | Usually handled by **board** parts (TVS, capacitors) |

$$
\boxed{I_{pk,HBM}=\frac{V_{HBM}}{1.5\ \mathrm{k\Omega}}\approx 1.3\ \mathrm A\ @\ 2\ \mathrm{kV}}
$$

**Why a chip can't take it on its own:** a pad is ≈40 fF against a 100 pF source, so the pad sees essentially the full kilovolts. A gate oxide breaks at about $10^7$ V/cm (≈2 V for 20 Å, Razavi). Failure modes: oxide rupture (immediate, or a "walking wounded" part that fails hundreds of hours later), junction filamentation and melting into a short (silicided junctions are worst, because the silicide removes the ballast resistance), post-stress leakage, and fused metal or resistors (thin films and poly are fragile; deep, lightly doped wells are the most robust resistors).

> [!tip] Remark
> ESD is one entry in the failure-mechanism zoo; EOS, TDDB, hot carriers and the antenna effect are in [[Failure Mechanisms]] and [[Layout Fundamentals#Antenna rules]]. The diode used as the simplest clamp is drawn in [[Diodes#ESD and Antenna Diodes]].

### Primary and Secondary Protection

```tikz title="Hastings's worked example. (A) An unprotected 5 V gate on a pin fails 2 kV HBM. (B) A primary clamp D1 (7 V, 2 Ohm) holds the gate to 9.6 V at 1.3 A: passes HBM. A 500 V CDM strike (about 12 A) drives D1 to 31 V: fails. (C) A 500 Ohm resistor and a small secondary clamp D2 (50 Ohm) next to the gate limit it to 44 mA and 9.2 V: passes CDM. After Hastings Fig. 14.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \begin{scope}
    \draw (0,2) node[left,font=\scriptsize]{IN} -- (2.0,2);
    \draw (2.0,2) node[nmos,rotate=0,anchor=G](M){};
    \draw (0,2) ++(0,0) (M.S) -- (M.S |- 0,0) node[ground]{};
    \draw (M.D) -- ++(0,0.3);
    \node[font=\scriptsize] at (2.3,2.6) {$M_1$ (5 V)};
    \node at (1.3,-0.8) {(A) fails};
  \end{scope}
  \begin{scope}[xshift=4.2cm]
    \draw (0,2) node[left,font=\scriptsize]{IN} -- (2.3,2);
    \draw (2.3,2) node[nmos,anchor=G](M){};
    \draw (M.S) -- (M.S |- 0,0) node[ground]{};
    \draw (M.D) -- ++(0,0.3);
    \draw (0.8,0) to[zD*,l=\scriptsize$D_1$] (0.8,2);
    \draw (0.8,0) -- (M.S |- 0,0);
    \node[font=\scriptsize,align=center] at (1.5,-0.8) {(B) HBM: 9.6 V ok\\ CDM: 31 V fails};
  \end{scope}
  \begin{scope}[xshift=8.6cm]
    \draw (0,2) node[left,font=\scriptsize]{IN} -- (0.6,2) to[R,l=\scriptsize$500\,\Omega$] (2.4,2) -- (3.6,2);
    \draw (3.6,2) node[nmos,anchor=G](M){};
    \draw (M.S) -- (M.S |- 0,0) node[ground]{};
    \draw (M.D) -- ++(0,0.3);
    \draw (0.6,0) to[zD*,l=\scriptsize$D_1$] (0.6,2);
    \draw (2.6,0) to[zD*,l=\scriptsize$D_2$] (2.6,2);
    \draw (0.6,0) -- (M.S |- 0,0);
    \node[font=\scriptsize,align=center] at (2.0,-0.8) {(C) CDM: 44 mA in $D_2$,\\ 9.2 V on the gate: ok};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **Primary** protection takes the full strike at the pad: it must keep the HBM peak below every junction breakdown, and the CDM peak below field and interlevel oxide breakdown.
- **Secondary** (CDM) protection sits **next to the fragile gate**, behind a current-limiting resistor. It only has to absorb a small current, but it must be close, because the metal between pad and gate drops tens of volts at CDM currents.
- Large output transistors and big junctions can be **self-protecting**, except devices prone to filamentation (high-voltage MOS with lightly doped drift regions).

### Clamp Types: Clipping, Snapback, Rate-Fired

```tikz title="Idealised I-V of the three primary clamp types, with the design window shaded. V_c (conduction, about 1 uA) must exceed the maximum operating voltage; the peak V_pk at the HBM current must stay below junction and oxide breakdown; failure (I_f or the second trigger I_t2) must lie well above I_pk. A snapback device (B) collapses from V_t1 to the hold voltage V_h. A rate-fired device (C) follows the dashed curve for slow signals and the solid one for fast ESD edges. After Hastings Fig. 14.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \foreach \ox/\lab in {0/{(A) clipping},5.2/{(B) snapback},10.4/{(C) rate-fired}} {
    \begin{scope}[xshift=\ox cm]
      \fill[green!10] (1.6,0) rectangle (3.4,3.2);
      \draw[->] (0,0) -- (4.4,0) node[right,font=\scriptsize] {$V$};
      \draw[->] (0,0) -- (0,3.4) node[above,font=\scriptsize] {$I$};
      \draw[dashed,gray] (1.6,0) -- (1.6,3.2); \node[font=\tiny,anchor=north] at (1.6,-0.05) {$V_{DD,max}$};
      \draw[dashed,gray] (3.4,0) -- (3.4,3.2); \node[font=\tiny,anchor=north] at (3.4,-0.05) {$BV$, oxide};
      \node[font=\scriptsize] at (2.2,-0.75) {\lab};
    \end{scope}
  }
  \draw[thick,red!70!black] (0,0) -- (1.9,0) to[out=0,in=-110] (2.3,0.6) -- (2.9,3.0);
  \node[circ,red!70!black] at (2.75,2.4){}; \node[font=\tiny,anchor=east] at (2.7,2.4) {$(V_{pk},I_{pk})$};
  \node[font=\tiny,anchor=north] at (1.95,-0.35) {};
  \node[font=\tiny,red!70!black,anchor=west] at (2.95,3.05) {$I_f$};
  \begin{scope}[xshift=5.2cm]
    \draw[thick,red!70!black] (0,0) -- (2.4,0) to[out=0,in=-90] (3.3,0.3) to[out=90,in=0] (2.0,0.55) -- (2.0,0.6) -- (2.6,3.0);
    \node[font=\tiny,anchor=west] at (3.3,0.35) {$V_{t1}$};
    \node[font=\tiny,anchor=east] at (2.0,0.6) {$V_h,I_h$};
    \node[circ,red!70!black] at (2.45,2.4){}; \node[font=\tiny,anchor=east] at (2.4,2.4) {$V_{pk}$};
    \node[font=\tiny,red!70!black,anchor=west] at (2.65,3.05) {$I_{t2}$};
  \end{scope}
  \begin{scope}[xshift=10.4cm]
    \draw[thick,red!70!black] (0,0) -- (0.9,0) to[out=0,in=-110] (1.2,0.5) -- (2.0,3.0);
    \draw[dashed,blue!60!black] (0.9,0.02) -- (3.6,0.02) to[out=0,in=-110] (3.9,0.6);
    \node[circ,red!70!black] at (1.85,2.4){}; \node[font=\tiny,anchor=west] at (1.95,2.4) {$V_{pk}$};
    \node[font=\tiny,blue!60!black,anchor=west] at (3.6,0.8) {slow};
    \node[font=\tiny,red!70!black,anchor=west] at (1.0,1.4) {fast};
  \end{scope}
\end{circuitikz}
\end{document}
```

Every primary clamp must satisfy:

1. **$V_c$ > maximum operating voltage** (no leakage in use; $V_c$ is usually defined at 1 µA, sometimes 100 nA, and leakage worsens hot and after strikes).
2. **$V_{pk}$ < every junction breakdown** it protects, at $I_{pk}$.
3. **$V_{pk}$ < field and interlevel oxide breakdown.**
4. **Failure current ≫ $I_{pk}$**, measured with **TLP** (transmission-line pulse) testing, because failure is electrothermal and time-dependent.

Then by type:

- **Snapback** (ggNMOS, SCR, bipolar clamps): also need **$V_h$ > max operating voltage**, *or* the pin can never supply $I_h$, *or* the pin can never reach $V_{t1}$. Don't count on the last one. A snapback device whose $V_h$ is below the supply and that the supply can feed $I_h$ into **is a latch-up**.
- **Rate-fired** (gcNMOS, active FET, RC rail clamp): they react to edges (HBM needs reaching $V_{pk}$ within ~50 ns; a typical trigger reacts to ≳1 V/ns). So either the pin never slews faster than about **100 V/µs**, or the clamp has a **disable circuit** that turns it off a few µs after power appears. That is legal because HBM and CDM happen unpowered, but not if the pin needs system-level protection.

### Clamp Devices

```tikz title="Grounded-gate NMOS (ggNMOS), the classic CMOS snapback clamp. A positive strike avalanches the drain junction; the hole current flows through R_sub to the tap and forward-biases the source: the parasitic lateral npn turns on and the device snaps back. Silicide is blocked over the drain so the drain region ballasts each finger. After Hastings Fig. 14.30 and Sec. 14.4.1."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60},
  poly/.style={fill=red!65,draw=black!70},
  sil/.style={fill=black!75,draw=none},
  cont/.style={fill=black,draw=none}]
  \draw[psub] (0,0) rectangle (9,2.6);
  \draw[pdiff] (0.3,2.6) rectangle (1.1,2.35);
  \draw[ndiff] (1.6,2.6) rectangle (3.0,2.35);
  \draw[poly] (3.0,2.65) rectangle (3.6,2.95);
  \draw[ndiff] (3.6,2.6) rectangle (7.6,2.35);
  \draw[sil] (1.6,2.6) rectangle (3.0,2.66);
  \draw[sil] (6.6,2.6) rectangle (7.6,2.66);
  \draw[cont] (2.2,2.66) rectangle (2.4,3.3);
  \draw[cont] (7.0,2.66) rectangle (7.2,3.3);
  \draw[cont] (0.6,2.6) rectangle (0.8,3.3);
  \draw[<->] (3.7,2.8) -- (6.6,2.8); \node[font=\scriptsize,anchor=south] at (5.2,2.82) {silicide block};
  \node[font=\scriptsize,above] at (7.1,3.3) {PAD};
  \node[font=\scriptsize,above] at (2.3,3.3) {GND};
  \node[font=\scriptsize,above] at (0.7,3.3) {GND};
  \node[font=\scriptsize,anchor=south] at (3.3,2.97) {G=GND};
  \node[font=\scriptsize,red!70!black,anchor=west] at (4.2,1.95) {avalanche at drain edge};
  \draw[->,thick,red!70!black] (3.6,2.0) to[out=-150,in=-60] (0.9,2.3);
  \draw[very thick,orange!70!black,decorate,decoration={zigzag,amplitude=1.5pt,segment length=4pt}] (2.0,1.0) -- (0.8,1.8);
  \node[font=\scriptsize] at (1.2,1.0) {$R_{sub}$};
  \draw[->,thick,blue!70!black] (2.4,2.2) to[out=-60,in=-120] (3.9,2.2);
  \node[font=\scriptsize,blue!70!black] at (3.1,1.35) {npn: $e^-$};
  \node[font=\scriptsize,align=left,anchor=west] at (5.0,1.3) {1. drain avalanches at $V_{t1}\gtrsim BV_{DSS}$\\ 2. $I_{hole}R_{sub}\approx 0.7$ V: npn on\\ 3. snaps back to $V_h$};
\end{circuitikz}
\end{document}
```

| Device | Type | Key layout facts (Hastings §14.4.1) | Needs ECGR? |
|---|---|---|---|
| **Dual diodes** (pad→$V_{DD}$, $V_{SS}$→pad) + rail clamp | Clipping | Smallest; **least capacitance**; pure clamp. **Not failsafe**: forward-biases if the pin exceeds its own $V_{DD}$ (power-down, sequencing). Metal between any two pins ≤ 2 Ω | Yes (NSD/p-epi diode) |
| Antiparallel diodes | Clipping | Between separate grounds; interdigitated NMoat/PMoat strips, square-ish arrays, a few Ω. Robust (low clamp voltage) | Yes |
| **ggNMOS** | Snapback | Multi-finger NMOS, gate grounded. Drain contact-to-gate spacing 1–3 µm beyond minimum, silicide-blocked; about **600 µm total width for 2 kV HBM**. Needs $V_{t2} > V_{t1}$ so all fingers fire. LDD makes it weaker. Triggers *slightly above* $BV_{DSS}$, so it **can't protect an identical NMOS** without a series resistor | Yes |
| **gcNMOS** | Rate-fired + snapback | A coupling cap $C_1$ (PMOS gate cap) and $R_1$ ($R_1C_1$ = **20–50 ns**) lift the gate. Lowest trigger at $V_{GS}\approx V_{GD}/2$, about half the ggNMOS trigger, so it protects same-type NMOS. Optional disable ($\ge 1$ µs filter). Larger area | Yes |
| BTNMOS / substrate-pumped | Snapback | Deliberately debiases the backgate (pumps current into the substrate ring): lower $V_{t1}$, more uniform turn-on, often smaller than gcNMOS | Yes |
| **Active FET ("big FET")**, RC rail clamp | Rate-fired | Gate fully driven by the coupling cap, sized so the npn never snaps. Protection **scales linearly with width**: easy to design, always large. The usual CMOS **supply clamp**; needs a disable on fast-slewing pins | Yes |
| **SCR** | Deep snapback | Smallest per amp ($V_h\approx1$ V, little heat). But $I_h$ is only a few mA, so **it is designed to latch up**. Use only if $V_{max} < V_h$ or the pin can't supply $I_h$ | Yes |
| Lateral PNP (CMOS) | Snapback, little | PMoat in N-well, P-well collector; interdigitated fingers; no ballast needed. Best general-purpose high-voltage clamp | Yes (prudent) |
| Thick-field NMOS | Snapback | Historic; ruined by silicide and heavy NSD. Abandoned | Yes |
| Bipolar clamps (buffered Zener, $V_{CES}$, $V_{CBO}$, $V_{ECS}$) | Clipping / snapback | BiCMOS options: see the fold | mostly yes |

**Every clamp that can be pulled below ground injects electrons**, so every ESD device sits behind an electron-collecting guard ring ([[#Where to Put Guard Rings]]).

> [!note]- Detail: gate-coupled NMOS and the bipolar clamps (Hastings Figs. 14.24–14.31)
> ```tikz title="Gate-coupled NMOS: C1 (often a PMOS gate capacitor) and R1 lift M1's gate during a fast strike, lowering the trigger voltage; R1 holds the gate low in normal operation. After Hastings Fig. 14.31(A)."
> \usepackage{circuitikz}
> \begin{document}
> \begin{circuitikz}[font=\small]
>   \draw (0,3) node[left,font=\scriptsize]{PAD} -- (2.6,3);
>   \draw (0.6,3) to[C,l_=\scriptsize$C_1$] (0.6,1.6) node[circ]{} to[R,l_=\scriptsize$R_1$] (0.6,0) node[ground]{};
>   \draw (2.2,1.6) node[nmos,anchor=G](M){};
>   \draw (0.6,1.6) -- (M.G);
>   \draw (M.D) |- (2.6,3);
>   \draw (M.S) -- (M.S |- 0,0) node[ground]{};
>   \node[font=\scriptsize,anchor=west] at (2.8,1.6) {$M_1$ (+ parasitic npn)};
> \end{circuitikz}
> \end{document}
> ```
> - Keep the coupled gate voltage modest. Too much channel current overheats the surface at the pinch-off point, while bipolar conduction is spread through more volume and so is more robust. With large $C_1$ and a large $M_1$ that never snaps, the same schematic is the **active FET**. ggNMOS → gcNMOS → active FET is a continuum from pure snapback to pure rate-fired.
> - **Buffered (power) Zener:** a Zener drives an NPN base, which divides the Zener resistance by β and gives a clamp of a few ohms. Base turn-off resistor of a few kΩ: it limits leakage gain, raises BV, and limits rate-firing.
> - **$V_{CES}$ / $V_{CBO}$ clamps:** an NPN in breakdown. Hold = $V_{CEO(sus)}$. A typical standard-bipolar $V_{CES}$ device triggers at 60 V and snaps back to 40 V. Fillet the base corners and overlap base and emitter over contact generously (contacts are the most thermally fragile part).
> - **$V_{ECS}$ clamp:** the NPN operated reverse-active (emitter-base breakdown). Low β, so little snapback. Popular for low-voltage pins in BiCMOS. With its collector grounded it rarely needs an ECGR.
> - Hastings's summary table (14.2): clipping devices (Zener, diodes), snapback devices (bipolar, ggNMOS, BTNMOS, SCR, PNP), rate-fired devices (gcNMOS, active FET). SCR and lateral PNP are the smallest, the active FET is the largest, and every one except $V_{ECS}$ wants an ECGR.

### SCR Clamps

```tikz title="A medium-voltage SCR (MVSCR) clamp in N-well CMOS: exactly the latch-up structure above, fired on purpose. PMoat in the n-well (anode, on the pad) is the pnp emitter; NMoat in the p-epi (cathode, GND) is the npn emitter. An NMoat strip straddling the well edge is the trigger: it avalanches at roughly the ggNMOS voltage and starts the loop. After Hastings Fig. 14.33(B)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  psub/.style={fill=orange!12,draw=black!60},
  nwell/.style={fill=cyan!18,draw=cyan!50!black,dashed},
  ndiff/.style={fill=green!45,draw=black!60},
  pdiff/.style={fill=orange!65,draw=black!60}]
  \draw[psub] (0,0) rectangle (10,2.6);
  \draw[nwell] (0.4,2.6) -- (0.4,0.9) -- (5.2,0.9) -- (5.2,2.6);
  \draw[ndiff] (0.7,2.6) rectangle (1.4,2.35);
  \draw[pdiff] (1.9,2.6) rectangle (3.4,2.35);
  \draw[ndiff] (4.6,2.6) rectangle (5.8,2.35);
  \draw[ndiff] (6.6,2.6) rectangle (8.0,2.35);
  \draw[pdiff] (8.6,2.6) rectangle (9.4,2.35);
  \draw (1.05,2.6) -- (1.05,3.3); \draw (2.65,2.6) -- (2.65,3.3); \draw (1.05,3.3) -- (2.65,3.3) node[midway,above,font=\scriptsize] {PAD (anode)};
  \draw (7.3,2.6) -- (7.3,3.3); \draw (9.0,2.6) -- (9.0,3.3); \draw (7.3,3.3) -- (9.0,3.3) node[midway,above,font=\scriptsize] {GND (cathode)};
  \node[font=\scriptsize,above] at (5.2,2.62) {trigger};
  \draw[->,thick,red!70!black] (2.65,2.3) to[out=-90,in=180] (5.6,0.6) to[out=0,in=-120] (8.9,2.3);
  \draw[->,thick,blue!70!black] (7.0,2.3) to[out=-110,in=-30] (4.9,1.2);
  \node[font=\scriptsize,red!70!black] at (5.4,0.3) {holes: pnp (PSD / n-well / p-epi)};
  \node[font=\scriptsize,blue!70!black,anchor=west] at (5.9,1.55) {$e^-$: npn (NSD / p-epi / n-well)};
  \node[font=\scriptsize] at (1.0,1.2) {n-well};
\end{circuitikz}
\end{document}
```

- Hold voltage ≈ 1 V means very little dissipation, so SCRs are among the smallest clamps, and among the lowest capacitance per amp. That makes them attractive on high-speed pins.
- The catch is the hold current of a few mA. A pin that is powered above $V_h$ and can source $I_h$ will keep it latched after any transient. Raising $I_h$ (lower $R_{well}$, $R_{sub}$) fights the loop gain. Stacking two or three raises $V_h$ but gives back the area advantage.
- **Kossel et al. (JSSC 2008), 8.5 Gb/s SST transmitter in 65 nm:** 2 kV HBM on each output with an SCR of about 300 µm total perimeter, plus an N+/P-well diode of the same size for negative strikes. The SCR's n-well was tied to $V_{DD}$ through 17 kΩ to cut its junction capacitance in operation. Combined SCR + diode: about **300 fF**.

> [!tip] Remark
> Same four layers, same $\beta_N\beta_P>1$ condition as [[#The Parasitic SCR]]. The latch-up section is about keeping $T<1$; the SCR clamp is about making $T>1$ only during a strike.

### Rail Clamps and Whole-Chip Strategy

```tikz title="Two primary networks, with the path of a strike from INP (positive) to INM. (A) Pad-based: one clamp E per pad to a wide substrate (VSS) ring; the current goes through E2 forward-strike, the ring, and E3 reverse. (B) Rail-based: dual diodes to VDD and VSS rails and one rail clamp E1; the current goes through D1, the VDD rail, E1, the VSS rail, and D4. After Hastings Fig. 14.39."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \begin{scope}
    \draw[line width=3pt,gray!60] (0,0) -- (5,0);
    \node[font=\scriptsize,anchor=north] at (2.5,-0.15) {VSS / substrate ring ($R_{VSS}\le 2\,\Omega$)};
    \foreach \x/\n/\e in {0.8/INP/E_2,2.5/INM/E_3,4.2/OUT/E_4} {
      \draw[fill=violet!55] (\x-0.3,3.2) rectangle (\x+0.3,3.7); \node[font=\scriptsize,above] at (\x,3.7) {\n};
      \draw (\x,3.2) -- (\x,2.6);
      \draw[fill=gray!20] (\x-0.3,1.2) rectangle (\x+0.3,2.6); \node[font=\scriptsize] at (\x,1.9) {$\e$};
      \draw (\x,1.2) -- (\x,0);
    }
    \draw[->,very thick,red!70!black] (1.05,3.0) -- (1.05,0.25) -- (2.25,0.25) -- (2.25,3.0);
    \node at (2.5,-0.9) {(A) pad-based (analog default)};
  \end{scope}
  \begin{scope}[xshift=7cm]
    \draw[line width=3pt,gray!60] (0,0) -- (6,0); \node[font=\scriptsize,anchor=north] at (3,-0.15) {VSS rail};
    \draw[line width=3pt,gray!60] (0,3.0) -- (6,3.0); \node[font=\scriptsize,anchor=south] at (3.0,3.15) {VDD rail};
    \foreach \x/\n/\a/\b in {0.9/INP/1/2,2.7/INM/3/4} {
      \draw[fill=violet!55] (\x-0.75,1.25) rectangle (\x-0.25,1.75); \node[font=\scriptsize,anchor=east] at (\x-0.78,1.5) {\n};
      \draw (\x-0.25,1.5) -- (\x,1.5);
      \draw (\x,1.5) to[D*,l_=\scriptsize$D_\a$] (\x,3.0);
      \draw (\x,0) to[D*,l_=\scriptsize$D_\b$] (\x,1.5);
    }
    \draw[fill=gray!20] (4.8,0.8) rectangle (5.6,2.2); \node[font=\scriptsize,align=center] at (5.2,1.5) {$E_1$\\ rail\\ clamp};
    \draw (5.2,2.2) -- (5.2,3.0); \draw (5.2,0.8) -- (5.2,0);
    \draw[->,very thick,red!70!black] (1.15,1.6) -- (1.15,2.75) -- (4.95,2.75) -- (4.95,0.25) -- (2.95,0.25) -- (2.95,1.35);
    \node at (3,-0.9) {(B) rail-based (digital default)};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{pad-based: }\Delta V = V_{E2}(I_{pk}) + V_{E3}(-I_{pk}) + I_{pk}R_{VSS}}
\qquad
\boxed{\text{rail-based: }\Delta V = V_{D1}+I_{pk}R_{VDD}+V_{E1}+I_{pk}R_{VSS}+V_{D4}}
$$

- **Pad-based:** every pin except substrate ground gets a primary device to a wide substrate return ring. Any pin-to-pin strike passes at most two devices (one forward, one reverse; reverse strikes clamp low). Budget $R_{VSS}\le 2\ \Omega$, which is 2.6 V at 2 kV HBM. **Failsafe** clamps (they reference only ground), so this is the analog favourite: multiple supplies sequence unpredictably, and analog processes have good snapback devices.
- **Rail-based:** dual diodes (2–3 V each at the HBM peak) to both rails, and one rate-fired clamp (active FET) between the rails. Keep $R_{VDD}$ and $R_{VSS}$ ≤ 1 Ω each, or put several rail clamps around the die so the current travels less. Small and low-capacitance per pin, but non-failsafe.
- **Hybrid networks** are normal: e.g. a power IC keeps PGND separate from the substrate GND (so output currents don't debias the substrate), joins them with antiparallel diodes, and returns the output clamp to PGND.

Rules for a pad-based network (Hastings §14.4.3, condensed):

1. Substrate-ground pads need no device of their own; the others protect them. Size the ring instead.
2. Bondpads joined by stout on-chip metal can share one device. Beware DC currents between double-bonded pads (unequal bond wires make an electromigration path).
3. **Separate grounds:** connect them with antiparallel diodes (stack two pairs if they differ by more than a diode drop).
4. **Two pads on one package pin need two devices.** A bond wire is about 1 nH/mm, worth volts per nH in CDM, so one bond wire's clamp doesn't protect the other.
5. CMOS inputs: ggNMOS or gcNMOS primary + failsafe CDM clamp near the gates.
6. BiCMOS inputs (≈5 V): $V_{ECS}$ clamps; compact and need no ECGR.
7. Large MOS outputs often **self-protect**: lay them out like the ESD device (silicide block included) and give them an ECGR and plenty of taps.
8. Collector-base junctions of large bipolars self-protect; NPN emitters on a pin need diode clamps.
9. **CMOS supply pins:** a ggNMOS can't protect them (the circuit's own NMOS avalanche at the same voltage). Use a gcNMOS with $V_h$ > $V_{DD,max}$ and $V_{pk} < BV_{DSS}$, or an active FET with a disable tied to the rail.
10. High-voltage pins: lateral PNP, power Zener, $V_{CES}$/$V_{CBO}$ if the circuit can't hold them in snapback.
11. Stack devices when one can't stand off the voltage. Each stacked device must be about 2× larger to keep total resistance, so the stack is about 4× the area.
12. If all else fails, an active FET built from any NMOS, LDMOS included, up to that device's $BV_{DSS}$.

```tikz title="Substrate return ring around the die, avoiding the corner exclusion zones (d_c). Its worst-case resistance is between diametrically opposite pads, through two parallel half-perimeters. After Hastings Fig. 14.41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw[thick] (0,0) rectangle (6,4);
  \draw[fill=gray!35,even odd rule] (0.25,0.75) -- (0.75,0.25) -- (5.25,0.25) -- (5.75,0.75) -- (5.75,3.25) -- (5.25,3.75) -- (0.75,3.75) -- (0.25,3.25) -- cycle (0.55,0.88) -- (0.88,0.55) -- (5.12,0.55) -- (5.45,0.88) -- (5.45,3.12) -- (5.12,3.45) -- (0.88,3.45) -- (0.55,3.12) -- cycle;
  \draw[<->] (0,-0.3) -- (6,-0.3) node[midway,below,font=\scriptsize] {$W_D$};
  \draw[<->] (6.3,0) -- (6.3,4) node[midway,right,font=\scriptsize] {$L_D$};
  \draw[<->] (0,4.25) -- (0.75,4.25) node[midway,above,font=\scriptsize] {$d_c$};
  \draw[->] (3,2.4) -- (3,3.5); \node[font=\scriptsize] at (3,2.2) {$W_G$};
\end{circuitikz}
\end{document}
```

$$
\boxed{W_G \approx \frac{R_S\,\left(W_D+L_D-4d_c+2\sqrt2\,d_c\right)}{4\ \Omega}}\qquad(R_{VSS} = 2\ \Omega)
$$

$R_S$ is the **maximum** sheet resistance at 25 °C (ESD happens during handling, not at temperature extremes). Stack all metal layers in the ring.

> [!note]- Derivation and a misprint: the ring-width formula
> The worst strike runs between opposite pads. Current splits into two equal half-perimeters in parallel, each of length $W_D+L_D$ minus the two cut corners. Each corner replaces $2d_c$ of edge with a diagonal of $\sqrt2\,d_c$, so a half-perimeter is $P = W_D+L_D-4d_c+2\sqrt2\,d_c$. Two halves in parallel: $R = \tfrac12 R_S P/W_G$. Setting $R = 2\ \Omega$ gives $W_G = R_SP/(4\ \Omega)$. The book prints the last term as $2\sqrt{d_C}$, which is dimensionally inconsistent. $2\sqrt2\,d_c$ is the geometric result.

### CDM and Secondary Protection

**Why location matters (Hastings §14.4.2):** a 5 V gate oxide (90 Å) survives about 22 V for an ESD-length pulse. A 5 V gcNMOS has $V_h\approx6$ V and ≈4 Ω, and the metal adds up to 2 Ω.

| Strike | Current | Gate sees | Result |
|---|---|---|---|
| 2 kV HBM | 1.3 A | $6 + 1.3\times6 = 13.8$ V | survives |
| CDM | 10 A | $6 + 10\times 6 = 46$ V (20 V of it in the metal alone) | **ruptures** |

So the CDM clamp goes **at the gate**, tied to the same supply and ground lines that gate's circuit uses, with the series resistor anywhere between it and the pad.

```tikz title="Secondary (CDM) protection. (A) RC filter: R1 (anywhere along the line) and C1 at the gate with R1*C1 >= 10 ns; e.g. 0.25 pF needs 40 kOhm. (B) CDM clamp for a CMOS input: series R1 plus small single-finger ggNMOS M4 (gate to GND) and M5 (V_DD to gate) placed beside the protected gates, after the primary M1 at the pad. Not failsafe: M5 conducts if the pin exceeds V_DD; a third ggNMOS makes it failsafe. After Hastings Figs. 14.37 and 14.38."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \begin{scope}
    \draw (0,2) node[left,font=\scriptsize]{PAD} -- (0.4,2) to[R,l=\scriptsize$R_1$] (2.2,2) -- (3.5,2);
    \draw (2.6,2) to[C,l_=\scriptsize$C_1$] (2.6,0.3) node[ground]{};
    \draw (3.5,2) node[nmos,anchor=G](M2){};
    \draw (M2.S) -- (M2.S |- 0,0.3) node[ground]{}; \draw (M2.D) -- ++(0,0.3);
    \node[font=\scriptsize,anchor=west] at (4.0,1.5) {$M_2$};
    \node[font=\scriptsize,align=center] at (1.8,-0.6) {(A) $R_1C_1\ge 10$ ns};
  \end{scope}
  \begin{scope}[xshift=6cm]
    \draw (0,2) node[left,font=\scriptsize]{PAD} -- (0.4,2) to[R,l=\scriptsize$R_1$] (2.2,2) -- (4.4,2);
    \draw (0.3,2) -- (0.3,1.5); \draw[fill=gray!20] (0.0,0.8) rectangle (0.6,1.5); \node[font=\tiny] at (0.3,1.15) {$M_1$};
    \draw (0.3,0.8) -- (0.3,0.3) node[ground]{};
    \draw[fill=gray!20] (2.5,0.8) rectangle (3.1,1.5); \node[font=\tiny] at (2.8,1.15) {$M_4$};
    \draw (2.8,2) -- (2.8,1.5); \draw (2.8,0.8) -- (2.8,0.3) node[ground]{};
    \draw[fill=gray!20] (2.5,2.5) rectangle (3.1,3.2); \node[font=\tiny] at (2.8,2.85) {$M_5$};
    \draw (2.8,2) -- (2.8,2.5); \draw (2.8,3.2) -- (2.8,3.6) node[above,font=\scriptsize]{$V_{DD}$};
    \draw[dashed] (2.2,0.1) rectangle (3.4,3.4); \node[font=\scriptsize,anchor=west] at (3.45,0.6) {next to the gates};
    \node[font=\scriptsize,anchor=west] at (4.45,2) {to $M_2$ (NMOS), $M_3$ (PMOS) gates};
    \node[font=\scriptsize] at (2.2,-0.6) {(B) CDM clamp (ggNMOS)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **RC filter:** $R_1C_1 \ge 10$ ns, because CDM lasts only a few ns. Place $C_1$ at the gate (between gate and its source line); $R_1$ only limits current, so it can sit anywhere on the line.
- **CDM clamp:** single-finger ggNMOS sized to the process's $RW$ product, next to the gates. Their junctions inject electrons, so they need an ECGR unless $R_1 \gtrsim 25$ kΩ. Make the line from pad to clamp wide enough for the CDM current through $R_1$.
- **Output transistors** aren't behind a resistor. One finger snaps first and takes everything, so ballast: ESD rules give an **$RW$ product**. Example: $RW = 5$ mm·Ω with 50 µm fingers needs 100 Ω. Put a separate 100 Ω on each of five fingers instead of one resistor in series: they look like 20 Ω in parallel but each finger still meets $RW$.
- Bipolar inputs: avalanche-induced β degradation of an emitter-base junction is an ESD failure too (a parametric shift in input bias current). A diode-connected clamp across the junction plus a limiting resistor, with a matching resistor on the other side of the pair, fixes it (Hastings Fig. 14.35).

$$
\boxed{R_1C_1 \ge 10\ \mathrm{ns}}\qquad \boxed{R_{ballast} = \frac{(RW)}{W_{finger}}}
$$

### ESD Metal and Layout

ESD current is huge but brief, so heating is **adiabatic** (no time to conduct heat away):

$$
\boxed{A_{metal} = \sqrt{\frac{\rho\,\tau\,I_{pk}^2}{2\,C_V\,\Delta T}}}\qquad(\tau = 225\ \text{ns for HBM})
$$

At 1.3 A and $\Delta T = 50$ °C: **6.5 µm²** of aluminium ($\rho = 2.7$ µΩ·cm, $C_V = 2.42$ J/°C/cm³) or **4.3 µm²** of copper (1.7 µΩ·cm, 3.45 J/°C/cm³). A 0.5 µm thick Al lead must be **≥13 µm wide**.

```tikz title="Layout of ESD metal. Left: current crowds at a sharp inside corner (hot spot); a chamfer removes it. Right: a lead from an ESD device into the ground ring, with every via site filled where the two layers overlap. After Hastings Fig. 14.42(A) and Sec. 14.4.3."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  mone/.style={fill=blue!55,draw=black!70},
  mtwo/.style={fill=violet!55,draw=black!70}]
  \begin{scope}
    \draw[mone] (0,0) -- (3,0) -- (3,3) -- (2,3) -- (2,1) -- (0,1) -- cycle;
    \fill[red!70] (2,1) circle (0.12);
    \node[font=\scriptsize,red!70!black,anchor=south east] at (1.95,1.05) {hot spot};
    \node[font=\scriptsize] at (1.5,-0.4) {bad: square inside corner};
  \end{scope}
  \begin{scope}[xshift=4cm]
    \draw[mone] (0,0) -- (3,0) -- (3,3) -- (2,3) -- (2,1.5) -- (1.5,1) -- (0,1) -- cycle;
    \node[font=\scriptsize] at (1.5,-0.4) {good: chamfered};
  \end{scope}
  \begin{scope}[xshift=8.4cm]
    \draw[mone] (0,0) rectangle (4,1.2); \node[font=\scriptsize,anchor=west] at (4.05,0.6) {M1 ground ring};
    \draw[mtwo,opacity=0.85] (1.2,0) rectangle (2.8,3); \node[font=\scriptsize,anchor=west] at (2.85,2.6) {M2 from ESD device};
    \foreach \x in {1.35,1.75,2.15,2.55} {\foreach \y in {0.15,0.55,0.9} {\fill (\x,\y) rectangle (\x+0.18,\y+0.18);}}
    \node[font=\scriptsize] at (2.0,-0.4) {fill the overlap with vias};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Budget ≤ **3 V** of metal drop at the HBM peak: ≤ 2.3 Ω total, 2 Ω of it in the substrate ring, the rest in the pad-to-device-to-ring leads.
- **Chamfer inside corners**; keep ESD leads short; orient any slots **along** the current (see [[#Wide-Metal Slotting]]) or use parallel narrow leads.
- **Vias:** run the two leads across each other and fill the overlap with as many vias as fit.
- **Contacts are the weakest thermal point:** keep them away from the avalanching junction (larger diffusion overlap of contact, silicide block).
- **Resistors in ESD paths** use the same heating formula with $\rho = R_\square t$ and $I = V_{peak}/R$. Silicided resistors carry their current in the thin silicide, so they need much more width.
- "20×/40× the EM width" rules exist but are physically unjustified.

### ESD for High-Speed I/O

Every femtofarad of ESD hangs on a 50 Ω line. The pad also needs termination, and its own capacitance and the driver's add on top.

```tikz title="A terminated high-speed pad. Left: the lumped picture: termination R_T in parallel with pad, ESD and driver capacitance; it sets return loss and bandwidth. Right: a T-coil puts the ESD capacitance at the centre tap of two coupled inductors, so the line sees close to a resistive 50 Ohm over a wide band. Off-chip series capacitors (AC coupling) let the receiver set its own common mode. After Kossel et al. (JSSC 2008) Figs. 7 and 10, and Palermo ECEN720 Lectures 5 and 6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \begin{scope}
    \draw (0,2) node[left,font=\scriptsize]{line $Z_0$} -- (0.3,2) to[C,l=\scriptsize$C_{AC}$ (off-chip)] (2.0,2) -- (2.4,2) node[circ]{} node[above,font=\scriptsize]{pad} -- (6.9,2);
    \draw (3.0,2) to[R,l=\scriptsize$R_T$] (3.0,0) node[ground]{};
    \draw (4.3,2) to[C,l=\scriptsize$C_{pad}$] (4.3,0) node[ground]{};
    \draw (5.6,2) to[C,l=\scriptsize$C_{ESD}$] (5.6,0) node[ground]{};
    \draw (6.9,2) to[C,l=\scriptsize$C_{drv}$] (6.9,0) node[ground]{};
    \node[font=\scriptsize] at (3.4,-0.8) {$C_{tot} = C_{pad}+C_{ESD}+C_{drv}$};
  \end{scope}
  \begin{scope}[xshift=9.0cm]
    \draw (0,2) node[left,font=\scriptsize]{pad} -- (0.3,2) to[L,l=\scriptsize$L_a$] (2.0,2) node[circ]{} to[L,l=\scriptsize$L_b$] (3.7,2) -- (4.0,2) node[right,font=\scriptsize]{to $R_T$ \& driver};
    \draw (2.0,2) to[C,l_=\scriptsize$C_{ESD}$] (2.0,0.2) node[ground]{};
    \draw[<->,dashed] (0.9,2.6) to[bend left=20] node[above,font=\scriptsize]{$k$} (3.1,2.6);
    \node[font=\scriptsize] at (2.0,-0.6) {T-coil: ESD at the centre tap};
  \end{scope}
\end{circuitikz}
\end{document}
```

What each ESD device costs in capacitance is the layout question here; Kossel's 65 nm SST driver is the reference budget: about 600 fF of output stage + **300 fF of SCR and diode clamps** + 70 fF of pad ≈ **1 pF**. The ESD share alone is a third of the pin. Of the clamp types, dual diodes carry the least capacitance and SCRs the lowest capacitance per amp ([[#Clamp Devices]], [[#SCR Clamps]]); every extra kV of HBM is more junction perimeter on the pin.

> [!tip] Remark
> How much total pin capacitance a 50 Ω termination tolerates, $|\Gamma| = \omega RC/\sqrt{4+(\omega RC)^2}$ and the Bode–Fano ceiling, is owned by [[Smith Chart and Impedance Matching#Termination Matching (SerDes and on-chip)]]. For $|S_{11}|<-8$ dB at Nyquist it gives roughly 1.1 pF at 5 Gb/s, 0.55 pF at 10 Gb/s and 0.1 pF at 56 Gb/s, so Kossel's 1 pF caps the plain design below 5 Gb/s; a T-coil then hides the ESD capacitance.

Practice for high-speed pins:

- **Use the least-capacitance clamp that passes:** dual diodes plus a rail clamp (Hastings: dual diodes are "used to protect high-speed data pins that cannot tolerate more than a few picofarads"), or SCRs with diodes for negative strikes. Size them for the HBM/CDM target and no more. The 2010 move from 2 kV to 1 kV HBM was largely about this.
- **Hide it with inductors:** T-coils or series peaking put the ESD capacitance behind an inductive network (Kossel TX; Pisati and Loi 56 Gb/s PAM4 RX inputs). Their design belongs to [[High-Speed Circuit Techniques]].
- **Reduce junction capacitance in operation:** reverse-bias the clamp's junctions (Kossel's 17 kΩ well tie).
- **No series resistor** on a 50 Ω input: Razavi's pad resistor $R_1$ adds $4kTR_1$ noise and an RC pole, tolerable on slow pins, not on links. The CDM secondary then has to be a small clamp right at the input devices.
- **AC coupling** (off-chip series capacitors) lets the receiver set its own common mode independent of the transmitter. The price is a low-frequency cutoff, so data must be DC-balanced (coded). The pad behind the capacitor still needs full ESD protection. See [[Transmitters]] and [[Receivers]].
- Razavi's warnings apply double here: ESD capacitance couples $V_{DD}$ noise onto the input, and an unqualified ESD structure is a latch-up risk. Use only foundry-characterised clamps.

> [!tip] Remark
> Pad size, pad capacitance (≈40–60 fF for a 75 µm pad, Razavi Ex. 19.6), octagonal pads and bond-wire inductance belong to [[Packaging]]. Termination, matching and return loss are covered generally in [[Smith Chart and Impedance Matching]] and [[Microwave Network Analysis]].

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| More / closer taps (majority rings) | $R_{sub}$, $R_{well}$ ↓: latch-up margin, body debiasing, substrate noise pickup | Area, routing; slight source resistance |
| Minority guard ring around injectors | Collected carriers: latch-up, cross-injection | Area (wide NMoat ≥ epi thickness, n-well ring spacing); power if supply-tied |
| Supply-tied vs grounded ECGR | Deeper depletion, tolerates debiasing | Dissipation at high voltage, needs the supply to source it |
| Merging devices in one well/tank | Area (2× or more), matching of sections | Cross-injection, debiasing, coupling |
| Series resistance on a pin (≥10 kΩ) | Latch-up immunity, CDM protection | Noise $4kTR$, RC pole, IR drop on outputs |
| Wider metal / more layers in parallel | IR drop, current density, ESD heating | Capacitance, routing tracks |
| Star / Kelvin routing | Drop-free references, matching | Extra wires |
| Shields and spacing | Crosstalk ↓ | Capacitance to ground, routing layers |
| Pad-based vs rail-based ESD | Failsafe, any supply sequence (pad) | Ring width; more devices (pad) vs less cap (rail) |
| Bigger primary clamp | HBM level | Area, **pin capacitance**, leakage |
| Snapback with low $V_h$ (SCR) | Smallest, lowest C | Latch-up if $V_h<V_{DD}$ and $I_h$ available |
| Rate-fired clamp (gcNMOS, active FET) | Low trigger, protects same-type NMOS | Area, false triggering on fast pins (needs disable) |
| T-coil on high-speed pads | Hides ESD C: bandwidth, return loss | Inductor area, design effort |

## Cheat sheet

| Quantity | Equation / rule |
|---|---|
| Latch-up condition | $\beta_N\beta_P > 1$; with taps $T = \frac{\beta_N}{1+\beta_N/(g_{mN}R_{sub})}\cdot\frac{\beta_P}{1+\beta_P/(g_{mP}R_{well})}\ge1$ |
| Latch-up test | 100 mA, 50 ms per pin, both polarities; fail if supply current +10 % |
| Vertical tap resistance | $R_V = \rho t/A_{dif}$, target ≤ 3 Ω (0.3 V / 100 mA) |
| Merged-bar latch-up | $\beta_N\beta_P(1-\eta_C) > 1$ |
| Capacitive coupling | $\Delta V = RC\,dV/dt$; $\Delta V = \frac{C_c}{C_c+C_{tot}}\Delta V_{aggr}$ |
| IR drop | $\Delta V = IR_\square L/W$ |
| EM width (rule level) | $W_{min} = I_{DC}/J_W$, $J_W\approx 2$ mA/µm (Al, rule of thumb) |
| Wire RC delay | $T_D \approx \tfrac12R_uC_uL^2$ |
| Slotted metal | $\frac{R_{slot}}{R_{unslot}}\approx\frac{WL_S}{(S_L+L_S)(W-N_SW_S)}+\frac{S_L}{S_L+L_S}$ |
| HBM peak | $I_{pk} = V/1.5$ kΩ ≈ 1.3 A at 2 kV, $\tau\approx150$–230 ns |
| CDM | >5 A, ≈0.25 ns rise, 1–2 ns |
| Pad-based strike | $\Delta V = V_{E2}+V_{E3}+I_{pk}R_{VSS}$, $R_{VSS}\le2$ Ω |
| Rail-based strike | $\Delta V = V_{D1}+I_{pk}R_{VDD}+V_{E1}+I_{pk}R_{VSS}+V_{D4}$, each rail ≤1 Ω |
| Ground-ring width | $W_G\approx R_S(W_D+L_D-4d_c+2\sqrt2d_c)/4\ \Omega$ |
| ESD metal (adiabatic) | $A = \sqrt{\rho\tau I_{pk}^2/(2C_V\Delta T)}$: 6.5 µm² Al, 4.3 µm² Cu at 1.3 A, 50 °C |
| CDM RC filter | $R_1C_1 \ge 10$ ns |
| Finger ballast | $R = (RW)/W_{finger}$ |
| gcNMOS timing | $R_1C_1$ = 20–50 ns; disable filter ≥ 1 µs |
| Rate-fired limit | pin slew ≤ ~100 V/µs or add a disable |

## References

- **Hastings, *The Art of Analog Layout*, 3rd ed.** (Pearson 2023; ebook PDF, printed page = PDF − 1 in this range)
  - §5.1.5 Electrostatic Discharge, pp. 223–226: HBM/MM/CDM/HMM tests and target levels, failure modes, pad-ring idea. Rest of §5.1 and §§5.2–5.3 left to [[Failure Mechanisms]].
  - §5.4 Minority Carrier Injection, pp. 254–269: injection sources and the 10 kΩ rule (Fig. 5.27), capacitor trigger (Fig. 5.28), CMOS latch-up and its three conditions (Fig. 5.29), JESD78 test and EMMI, SCR latch-up, debiasing models (Eqs. 5.22–5.30, Fig. 5.30) and tap rules per substrate type, guard-ring taxonomy, high-low junctions, ECGR/HCGR/HBGR (Figs. 5.33–5.38).
  - Ch. 14 Special Topics, pp. 721–776: §14.1 merged devices (Figs. 14.1–14.9, Eqs. 14.1–14.2, low/medium-risk lists, three questions); §14.2 minority-carrier guard rings in bipolar, CMOS and BiCMOS (Figs. 14.10–14.15); §14.3 single-level interconnection, mock layouts, crossing techniques, Table 14.1 annotation, tunnels (Figs. 14.16–14.20); §14.4 ESD: test waveforms (Fig. 14.21), primary/secondary example (Fig. 14.22), clipping/snapback/rate-fired requirements (Fig. 14.23), buffered Zener, $V_{CES}$/$V_{CBO}$/$V_{ECS}$, antiparallel and dual diodes, thick-field, ggNMOS, gcNMOS, BTNMOS, active FET, MVSCR, lateral PNP, Table 14.2; secondary protection (emitter-base clamp, ballasting $RW$, RC filter, CDM clamps, Figs. 14.35–14.38); die-level strategy (Figs. 14.39–14.41, Eqs. 14.3–14.5), high-current metallization (Eq. 14.6, Table 14.3, Fig. 14.42), high-current resistors, 12 guidelines. Bipolar-only details (bipolar tunnels, buffered-Zener layout, emitter-base clamp) are summarised in folds only.
  - §15.3.2 (pp. 798–800) anti-delamination slots, Eq. 15.16 (Fig. 15.11); §15.4.4 (pp. 815–818) star nodes and Kelvin connections (Figs. 15.26–15.27), noisy vs sensitive signals, Eq. 15.23, electrostatic shields (Fig. 15.28). The rest of Ch. 15 is left to [[Floorplanning and Top-Level Assembly]].
- **Razavi, *Design of Analog CMOS Integrated Circuits*, 2nd ed.** (PDF = printed + 19): §18.5 electromigration rule of thumb (p. 729); §18.8 Latch-up (pp. 730–731, Fig. 18.26); §19.2.7 Interconnects (pp. 753–757: crosstalk Fig. 19.40, differential + dummy line Fig. 19.41, shielding Figs. 19.42–19.43, wire noise Example 19.5, RC delay Eq. 19.14, parallel bus layers and tapering Fig. 19.47); §19.2.8 Pads and ESD Protection (pp. 757–759: oxide field, Fig. 19.52, the three costs of ESD); §19.3 substrate coupling and guard ring Fig. 19.55 (used only for the [[Substrate Noise]] link). Pad sizing and §19.4 packaging are left to [[Packaging]].
- **Kossel et al., "A T-Coil-Enhanced 8.5 Gb/s High-Swing SST Transmitter in 65 nm Bulk CMOS," JSSC 43(12), 2008**, §V, pp. 2911–2912: SCR + diode ESD for 2 kV HBM, ≈300 fF ESD, ≈1 pF total, $|S_{11}|<-8$ dB limit, T-coil parameters (Table I).
- **Palermo, ECEN720 (Texas A&M) Lectures 5 and 6:** DC vs AC coupled termination (slide 8), passive termination resistors and ESD tolerance, T-coil isolation of ESD in 56 Gb/s RX inputs (Pisati, Loi ISSCC 2019), AC-coupled CTLE input.
- **Zettelkasten extensions** (`AnalogTheory/Process Layout and Packaging/`): `15f5` (loop gain of the latch-up SCR with base resistors), `15q1` (ESD costs: capacitance pole, $4kTR_1$ noise, supply coupling).
