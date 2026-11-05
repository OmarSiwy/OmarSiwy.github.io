---
title: Interleaved ADCs
description: M slower ADCs taking turns on one input - why the aliases cancel, the offset, gain, timing-skew and bandwidth spurs that appear when the channels differ, the front-end sampler and buffer, calibration, and multiphase clock generation.
kind: topic
status: growing
aliases:
  - Interleaved ADCs
  - Time-Interleaved ADCs
  - TI-ADC
---

Interleaving is not a new converter. It is a wrapper around any Nyquist ADC ([[Flash ADCs|flash]], [[SAR ADCs|SAR]], [[Pipelined ADCs|pipeline]]): $M$ copies run on staggered clocks, so the aggregate rate is $M$ times one channel's. The note starts with the black box, then the spectrum that shows why it works, then the four ways mismatched channels break it, then the input node and buffer, then calibration, then clock generation. Stop after any section and the picture is still correct, just coarser. Metric definitions (SNDR, SFDR, ENOB, the noise budget) are in [[Data Converter Fundamentals]]; the single sampler (switch, $kT/C$, bootstrapping, aperture jitter) is in [[Sampling Circuits]].

## The big picture

```tikz title="An M = 4 time-interleaved ADC. Each channel samples once every M/f_S seconds on its own phase; the multiplexer re-assembles a stream at f_S. After Razavi (Data Converters) Fig. 20.5 and Carusone Fig. 17.39."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.2cm,minimum height=0.6cm,align=center,fill=gray!8,font=\scriptsize}}
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} -- (0.8,0) coordinate (n);
  \draw (0.8,2.25) -- (0.8,-2.25);
  \foreach \k/\y in {1/2.25,2/0.75,3/-0.75,4/-2.25} {
    \node[blk] (s\k) at (2.3,\y) {S/H};
    \node[blk,minimum width=1.6cm] (a\k) at (4.5,\y) {ADC$_\k$\\ $f_S/M$};
    \draw (0.8,\y) -- (s\k.west);
    \draw[->] (s\k.east) -- (a\k.west);
    \draw[->] (a\k.east) -- (6.3,\y);
    \draw[->] (2.3,\y+0.62) -- (s\k.north); \node[left,font=\scriptsize] at (2.3,\y+0.55) {$CK_\k$};
  }
  \fill (0.8,0) circle (0.05);
  \draw[thick,fill=gray!8] (6.3,2.7) -- (7.3,2.2) -- (7.3,-2.2) -- (6.3,-2.7) -- cycle;
  \node[font=\scriptsize] at (6.8,0) {MUX};
  \draw[->] (7.3,0) -- (8.0,0) node[right]{$D_{out}$ at $f_S$};
  \begin{scope}[xshift=11.6cm]
    \foreach \k/\y in {1/2.0,2/1.0,3/0.0,4/-1.0} {
      \node[left,font=\scriptsize] at (0,\y+0.2) {$CK_\k$};
      \pgfmathsetmacro{\a}{0.8*(\k-1)}
      \draw (0,\y) -- (\a,\y) -- (\a,\y+0.45) -- (\a+0.8,\y+0.45) -- (\a+0.8,\y) -- (\a+3.2,\y) -- (\a+3.2,\y+0.45) -- (\a+4.0,\y+0.45) -- (\a+4.0,\y) -- (6.6,\y);
    }
    \draw[<->] (0,-1.5) -- (0.8,-1.5) node[midway,below,font=\scriptsize]{$T_S=1/f_S$};
    \draw[<->] (0,-2.3) -- (3.2,-2.3) node[midway,below,font=\scriptsize]{$T_{CK}=M\,T_S$};
  \end{scope}
\end{circuitikz}
\end{document}
```

```tikz title="What mismatched channels do to the output spectrum (M = 4, shown from 0 to f_S/2). Offset tones sit at k f_S/M and do not move with the input; gain and timing-skew spurs sit at k f_S/M +- f_in and move with it. After Carusone Fig. 17.40 and Razavi Figs. 20.9, 20.17."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (9.2,0) node[right]{$f$};
  \draw[thick,->] (1.2,0) -- (1.2,3.0) node[above,font=\scriptsize]{signal};
  \draw[thick,->,dashed] (4,0) -- (4,1.3);
  \draw[thick,->,dashed] (8,0) -- (8,1.0);
  \draw[thick,->] (2.8,0) -- (2.8,0.9);
  \draw[thick,->] (5.2,0) -- (5.2,0.9);
  \draw[thick,->] (6.8,0) -- (6.8,0.7);
  \foreach \x/\l in {1.2/{$f_{in}$},2.8/{$\frac{f_S}{4}-f_{in}$},4/{$\frac{f_S}{4}$},5.2/{$\frac{f_S}{4}+f_{in}$},6.8/{$\frac{f_S}{2}-f_{in}$},8/{$\frac{f_S}{2}$}} \node[below,font=\scriptsize] at (\x,-0.05) {\l};
  \node[font=\scriptsize,align=center] at (4,1.75) {offset tone\\(input-independent)};
  \node[font=\scriptsize] at (8,1.3) {offset};
  \node[font=\scriptsize,align=center] at (6.6,2.6) {gain / skew / bandwidth spurs\\ (move with $f_{in}$)};
  \draw[->,gray] (5.4,2.4) .. controls (3.2,2.4) .. (2.85,1.0);
  \draw[->,gray] (6.0,2.2) -- (5.25,1.0);
  \draw[->,gray] (6.8,2.2) -- (6.8,0.8);
\end{circuitikz}
\end{document}
```

> [!important] The six results the rest of the note refines
> 1. **$M$ channels at $f_S/M$ give one ADC at $f_S$.** Each channel aliases badly on its own; summed with the right phases the aliases cancel exactly. That cancellation is why any mismatch shows up as a spur.
> 2. **Four mismatches, two kinds of spur.** Offset mismatch gives a fixed tone at $kf_S/M$. Gain mismatch $\alpha$, timing skew $\Delta T$ and bandwidth mismatch give spurs at $kf_S/M\pm f_{in}$. For two channels: $\mathrm{SNR}_{gain}\approx4/\alpha^2$, $\mathrm{SNR}_{skew}\approx1/(\pi^2\Delta T^2f_{in}^2)$.
> 3. **Skew is the hard one.** Its error is $\Delta T\,dx/dt$, so it grows with $f_{in}$. 10 bits within 2 dB of ideal at $f_{in}=5$ GHz needs $\Delta T\le39$ fs. Bandwidth mismatch is the same thing: $\Delta T\approx\Delta\tau$.
> 4. **The input node is shared.** Overlapping clocks give more track time but load the input with $M/2$ capacitors and cause charge sharing; they only help if the buffer's $R_{buf}\ll R_{on}$. A full-rate front sampler (two-rank) removes skew but moves the whole problem into one full-speed buffer.
> 5. **Calibrate from digital statistics.** Offsets from long-term averages, gains from long-term power (a rectifier plus an accumulator), skew from the difference of odd-even and even-odd sample products. Skew is corrected in the analog clock path by a variable delay line whose range covers the raw skew and whose LSB is the skew budget.
> 6. **Clocks:** a chain of $\div2$ latches makes the overlapping phases, AND or NOR gates make nonoverlapping ones, and retiming every sampling edge with the one full-rate clock removes the divider's jitter and mismatch.

**Map:** [[#Spec translation|spec translation]] → [[#Level 0 The Black Box|the idea, why aliases cancel, what it buys]] → [[#Level 1 Mismatch Spurs|offset, gain, skew, bandwidth spurs]] → [[#Level 2 The Shared Input Node|overlap, charge sharing, two-rank, split buffers]] → [[#Level 3 Calibration|detection and correction]] → [[#Level 4 Clock Generation|dividers, nonoverlap, retiming, floor plan]].

## Spec translation

A TI-ADC adds three things to an ordinary ADC's budget: **per-channel** converters running $M$ times slower, a **mismatch** budget (offset, gain, skew, bandwidth) that eats into the same SNDR and SFDR, and a **front end** (buffer, samplers, clock tree) that runs at the full rate. The amplifiers inside are the front-end buffer (sized with gm/ID) and whatever each channel contains (op amps for an MDAC, comparators for a SAR or flash), whose specs follow [[Data Converter Fundamentals#Spec translation]] at $f_S/M$.

```tikz title="Where a TI-ADC spec goes. The per-channel ADC takes the familiar budget at f_S/M; the mismatch budget and the front end are new, and they run at the full f_in."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,align=center,fill=gray!8,font=\scriptsize,minimum height=0.9cm}}
  \node[blk,minimum width=2.6cm] (spec) at (0,0) {TI-ADC spec\\ $N$, $f_S$, $M$\\ SNDR @ $f_{in}$, SFDR\\ $C_{in}$, $P$};
  \node[blk,minimum width=3.4cm] (ch) at (4.6,2.0) {per channel at $f_S/M$\\ noise, settling, $\tau_{reg}$};
  \node[blk,minimum width=3.4cm] (mm) at (4.6,0) {mismatch budget\\ $\Delta V_{OS}$, $\alpha$, $\Delta T$, $\Delta\tau$};
  \node[blk,minimum width=3.4cm] (fe) at (4.6,-2.0) {front end at $f_S$\\ buffer, samplers, clock};
  \foreach \n in {ch,mm,fe} \draw[->] (spec.east) -- (\n.west);
  \node[font=\scriptsize,anchor=west,align=left] (a) at (7.2,2.0) {op amp: $A_0$, GBW $\div M$\\ comparator: $\sigma_n$, $\sigma_{OS}$, $\tau_{reg}$};
  \node[font=\scriptsize,anchor=west,align=left] (b) at (7.2,0) {calibration DAC / VDL range and LSB\\ device matching of $R_{on}$, $C_s$, buffers};
  \node[font=\scriptsize,anchor=west,align=left] (c) at (7.2,-2.0) {buffer $R_{out}\ll R_{on}$, HD, peak $I$\\ $\to g_m$, $g_m/I_D$, $I_D$};
  \draw[->] (ch.east) -- (a.west);
  \draw[->] (mm.east) -- (b.west);
  \draw[->] (fe.east) -- (c.west);
\end{circuitikz}
\end{document}
```

**TI-ADC specs** (Razavi DC §20.1–20.2; Carusone §17.9): resolution $N$, aggregate rate $f_S$ and interleaving factor $M$ (so $f_{CK}=f_S/M$ per channel), SNDR/ENOB at $f_{in}$ up to $f_S/2$, SFDR (now including the mismatch spurs), input capacitance and input bandwidth, power, and whether calibration runs in the foreground or background.

**Step 0: choose $M$.** Run one channel only as fast as its power still scales linearly with speed ($f_1$ in [[#Speed-Power and Metastability|the speed-power curve]]), then $M=f_S/f_1$. Razavi's example: a 10-bit, 10 GHz ADC from 1 GHz channels needs $M=10$.

**Step 1: what a channel must do.** Every output sample comes from exactly one channel, so the channels' own noise does not average down: each channel needs the full SNDR target minus the mismatch share. Its *rate* drops by $M$, but its *sampler* still sees the full-band input.

| TI-ADC spec | Per-channel spec it imposes | Why |
|---|---|---|
| SNDR at $f_{in}$ | Channel SNDR $\ge$ target, after the mismatch spurs are taken out of the budget | One channel per sample; noise does not average |
| Input bandwidth $f_S/2$ | Channel sampler bandwidth and aperture jitter at the **full** $f_{in}$, not $f_{CK}/2$ | Each sampler tracks the full-band input |
| Rate $f_S$ | Channel rate $f_S/M$: settling time $\times M$, so op-amp GBW $\div M$ | The power win |
| Metastability rate | Decision time $MT_1$: $P_e=\alpha e^{-MT_1/\tau_{reg}}$ | Each channel gets $M$ times longer |
| Input capacitance | $M/2$ sampling capacitors at once with overlapping clocks, plus routing | [[#Overlapping vs Nonoverlapping Clocks]] |

**Step 2: the mismatch budget.** Each mismatch is a spur. Against an SNR penalty $P$ (linear, $P=10^{P_{dB}/10}$) relative to $\mathrm{SNR}_{ideal}=\tfrac32\,2^{2N}$, or against an SFDR target, two channels give:

$$
\boxed{\alpha\le2\sqrt{\frac{P-1}{\mathrm{SNR}_{ideal}}}\quad\text{or}\quad\alpha\le2\cdot10^{-\mathrm{SFDR}/20}}
$$

$$
\boxed{\Delta T\le\frac{1}{\pi f_{in}}\sqrt{\frac{P-1}{\mathrm{SNR}_{ideal}}}\quad\text{or}\quad\Delta T\le\frac{10^{-\mathrm{SFDR}/20}}{\pi f_{in}}}
$$

$$
\boxed{\Delta\tau=\Delta(R\,C)\ \le\ \Delta T_{budget}\qquad\Longleftrightarrow\qquad\frac{\Delta\tau}{\tau}\le\frac{\Delta T_{budget}}{\tau}}
$$

$$
\boxed{\frac{\lvert\Delta V_{OS}\rvert}{2}\ \ll\ 1\ \text{LSB}\quad\text{and}\quad\lvert\Delta V_{OS}\rvert\le2A\cdot10^{-\mathrm{SFDR}/20}}
$$

The four shares, plus thermal noise and jitter, add in power and must fit inside the [[Data Converter Fundamentals#Spec translation|ADC noise ceiling]].

> [!note]- Derivation: each mismatch limit from its spur
> **Penalty bookkeeping.** A spur or noise term that alone would give $\mathrm{SNR}_x$ adds in power: $1/\mathrm{SNR}_{tot}=1/\mathrm{SNR}_{ideal}+1/\mathrm{SNR}_x$. The penalty is $P=\mathrm{SNR}_{ideal}/\mathrm{SNR}_{tot}=1+\mathrm{SNR}_{ideal}/\mathrm{SNR}_x$, so $\mathrm{SNR}_x\ge\mathrm{SNR}_{ideal}/(P-1)$. This is Razavi's Ex. 20.5 written for any mismatch.
>
> **Gain.** $\mathrm{SNR}_{gain}=4/\alpha^2$ ([[#Gain Mismatch]]). Setting $4/\alpha^2\ge\mathrm{SNR}_{ideal}/(P-1)$ gives the first form. The spur has amplitude $\alpha A/2$ against a signal $(2+\alpha)A/2\approx A$, so SFDR $=20\log(2/\alpha)$, which gives the second.
>
> **Skew.** $\mathrm{SNR}_{skew}=1/(\pi^2\Delta T^2f_{in}^2)$ ([[#Timing Skew]]). Same steps. The spur-to-signal amplitude ratio is $\pi\Delta Tf_{in}$ (Razavi Eq. 20.22), which gives the SFDR form. Note $\pi\Delta Tf_{in}=\omega_{in}\Delta T/2$: skew acts as a gain mismatch of $\omega_{in}\Delta T$ rotated by 90°.
>
> **Bandwidth.** A channel time-constant mismatch $\Delta\tau$ is a delay mismatch $\Delta T\approx\Delta\tau$ ([[#Bandwidth Mismatch]]), so it takes its share of the same $\Delta T$ budget. Writing $\Delta T=(\Delta\tau/\tau)\tau$ and $\pi f_{in}=\omega_{in}/2$: $\mathrm{SNR}_{BW}=4/[(\Delta\tau/\tau)^2(\omega_{in}\tau)^2]$. For a fixed *relative* mismatch, a faster sampler (smaller $\tau$) has proportionally less skew.
>
> **Offset.** Two channels give an output that alternates $\pm\Delta V_{OS}/2$ around the mean, a tone at $f_S/2$ of amplitude $\Delta V_{OS}/2$ ([[#Offset Mismatch]]). Razavi's rule is to keep it well below 1 LSB. Against a full-scale sine of amplitude $A$ the amplitude ratio is $\Delta V_{OS}/(2A)$, which gives the SFDR form.
>
> These are Razavi's two-channel results. The sources give no closed form for the total spur power of $M>2$ channels with random errors; only the $M=4$ offset tone is worked out ([[#Offset Mismatch]]).

**Step 3: the front end and the clock.** These are the full-rate circuits, and they hold the only amplifier that has to run at $f_S$.

| Front-end spec | Element that sets it | Amplifier / device spec it imposes |
|---|---|---|
| Acquisition in the track window | Buffer + switch + $C_s$ | $(R_{buf}+R_{on})C_s\le t_{tr}/[(N+1)\ln2]$; $t_{tr}=T_S$ (nonoverlap) or $T_{CK}/2$ (overlap) |
| Charge sharing with overlapping clocks | Shared buffer | **Output impedance** $R_{buf}\ll R_{on}$ (else overlap buys nothing) |
| SFDR (front-end distortion) | Buffer, switches | Buffer **linearity** at full scale and $f_{in}\approx f_S/2$; follower gain $r_O/(r_O+1/g_m)$ must not move with $V_{DS}$ |
| Peak current into $C_s$ | Buffer | **Slew / peak current** $\ge\Delta V_{step}/R_{on}$ and $C_s\omega_{in}V_1$ |
| Two-rank sampling | Full-rate buffer $A_1$ | **Settling** of $A_1$ in $T_S/2$; **noise** (the signal takes $kT/C$ twice); linearity at $N$ bits |
| Bandwidth mismatch $\Delta\tau$ | Per-channel $R_{on}$, $C_s$; per-channel buffers if split | Device matching; for split buffers $\Delta(1/g_m)\,C_s\le\Delta T$ → **current-source matching** |
| Raw clock skew | Clock divider, buffers, routing, switch turn-off | VDL **range** $\ge\Delta T_{raw}$ (3σ), VDL **LSB** $\le\Delta T_{budget}$ |
| Clock jitter | The one full-rate clock (two-rank or retimed edges) | $\sigma_j\le1/(\omega_{in}\sqrt{\mathrm{SNR}})$ ([[Sampling Circuits#Aperture Jitter]]) |

$$
\boxed{R_{out,buf}\approx\frac{1}{g_m}\ll R_{on}\ \Rightarrow\ I_D=\frac{g_m}{g_m/I_D}}\qquad
\boxed{N_{VDL}=\frac{\Delta T_{raw}}{\Delta T_{budget}}}\qquad
\boxed{\tau_{A_1}\le\frac{T_S}{2(N+1)\ln2}}
$$

$$
\boxed{\text{split buffers: }\ \frac{1}{g_m}C_s\cdot\frac{\Delta g_m}{g_m}\le\Delta T_{budget},\qquad \frac{\sigma(\Delta I)}{I}=\frac{g_m}{I_D}\bigg|_{src}\frac{A_{VT}}{\sqrt{WL}}}
$$

> [!note]- Derivation: from skew budget to the buffer's current source (derived here, not in Razavi)
> **Buffer impedance.** A source follower has $R_{out}=1/(g_m+g_{mb})\approx1/g_m$ ([[Single-Stage#Source Follower]]). Requiring $R_{out}\ll R_{on}$ fixes $g_m$; $g_m/I_D$ then fixes $I_D$.
>
> **Shared buffer.** With one buffer for all channels, $R_{buf}$ is common, so it adds no skew of its own; only $R_{buf}\Delta C_s$ and $\Delta R_{on}C_s$ do.
>
> **Split buffers** ([[#Splitting the Buffer]]). Each path's time constant now contains its own $R_{out}=1/g_m$, so $\Delta\tau\supset C_s\Delta(1/g_m)=(C_s/g_m)(\Delta g_m/g_m)$. At a fixed bias current, strong-inversion $g_m\propto\sqrt{I_D}$ gives $\Delta g_m/g_m\approx\tfrac12\Delta I/I$ (weak inversion: $\Delta g_m/g_m=\Delta I/I$), ignoring the follower's own $\Delta\beta$. The bias current's error is the mirror result $\sigma(\Delta I)/I=(g_m/I_D)A_{VT}/\sqrt{WL}$ of the *current-source* device ([[Current Mirrors#Level 6 Mismatch]], [[Nonlinearity and Mismatch#Current Mismatch the Opposite Instruction]]). So the skew budget asks for a low $g_m/I_D$ (large overdrive) or a large $WL$ in the follower's current source.
>
> **What calibration changes.** A skew loop corrects any static delay mismatch, including $\Delta\tau$ ([[#Bandwidth Mismatch]]: it is frequency-independent for $\omega_{in}\ll1/\tau$). With calibration, these device mismatches set the VDL *range*, not a hard limit; the VDL LSB sets what remains.
>
> **Two-rank buffer.** $C_F$ holds the input for only half a full-rate period, and the buffer must settle to ½ LSB inside it: the acquisition rule $t=(N+1)\ln2\,\tau$ from [[Sampling Circuits#Acquisition Time]] with $t=T_S/2$.
>
> **VDL.** Range must exceed the worst raw skew (3σ of a Gaussian, Razavi footnote 17); the step must be no larger than the budget (Razavi Ex. 20.18). The ratio is the number of steps.

| Amplifier / device spec | Lands on | Why |
|---|---|---|
| Buffer $R_{out}\ll R_{on}$ | $g_m$ of the follower, then $I_D=g_m/(g_m/I_D)$ | $R_{out}\approx1/g_m$ |
| Buffer linearity | Lower $g_m/I_D$ (stronger inversion) and $I_D\gg C_s\omega_{in}V_1$; long-$L$ or cascoded current source | Slope-dependent $V_{GS}$, body effect, $r_o(V_{DS})$ ([[Sampling Circuits#The Driver]]) |
| Buffer peak current | $I_D$ directly | Step $/R_{on}$ at the start of each track phase |
| Split-buffer matching | $g_m/I_D$ and $WL$ of the follower's current source | $\sigma(\Delta I)/I\propto(g_m/I_D)/\sqrt{WL}$ |
| Two-rank $A_1$ settling | $f_T$ of the follower: short $L$, moderate $g_m/I_D$ | Full-rate settling into $C_s$ of the next rank |
| Channel op amp (MDAC) | GBW $\div M$, so $g_m$ and $I_D\div M$ per channel | $\omega_u\ge(N+1)\ln2/(\beta t_s)$ with $t_s\propto M/f_S$ |
| Channel comparator | $\tau_{reg}$ relaxed by $M$ in the exponent | [[Comparators#Error Rate]] |
| Sampling switch $R_{on}$ (not gm/ID) | $W$ at $L_{min}$, bootstrapped | [[Sampling Circuits#Spec translation]] |

> [!tip] Remark
> Spec names are from [[Single-Stage#Amplifier Specifications]]; turning $g_m/I_D$, $L$ and $I_D$ into a width is [[gm-ID Design Methodology]]. The sampler's own sizing ($C_s$ from $kT/C$, $R_{on}$ from bandwidth and THD) is [[Sampling Circuits#Spec translation]]; this section only adds the interleaving terms.

**Worked example: 10 bits, 10 GS/s, two channels** (Razavi Exs. 20.5, 20.12; the channel sampler is the [[Sampling Circuits#Level 7 Design Study 10-bit, 5 GS/s Bootstrapped Sampler|Ch. 4 design study]]; steps marked *derived* are arithmetic on those numbers, not Razavi's).
1. **Per channel.** $M=2$, so each channel runs at 5 GS/s with $T_{CK}=200$ ps and 100 ps of track time: exactly the Ch. 4 sampler, $C_s=0.5$ pF, $R_{on}\approx23\ \Omega$, $\tau\approx11.5$ ps. Its input now reaches 5 GHz, not 2.5 GHz: $\omega_{in}\tau=0.36$, attenuation $\approx0.5$ dB (derived).
2. **Skew budget.** A 2 dB penalty on $\mathrm{SNR}_{ideal}=1.573\times10^6$ at $f_{in}=5$ GHz: $\Delta T\le$ **39 fs** (Razavi).
3. **Gain budget.** Same 2 dB: $\alpha\le2\sqrt{0.585/1.573\times10^6}=$ **0.12 %** (derived; Razavi: $\alpha=0.1\%$ gives 66 dB).
4. **Clock.** An uncorrected 2 ps skew must reach 40 fs: **50 VDL steps**, just under 6 bits (Razavi). With switched capacitors that is a 10 aF unit, which is not buildable, so use a starved inverter with a ladder DAC ([[#Delay Elements]]).
5. **Bandwidth mismatch.** $\Delta\tau\le39$ fs on $\tau=11.5$ ps means $\Delta\tau/\tau\le$ **0.34 %** between the two channels' $R_{on}C_s$ if left uncalibrated (derived). The skew loop absorbs it otherwise.
6. **Shared buffer.** $R_{out}\ll23\ \Omega$; take $R_{on}/5\approx4.6\ \Omega$, so $g_m\approx0.22$ S. At $g_m/I_D=10$ S/A, $I_D\approx$ **22 mA** (derived; the factor 5 and the 10 S/A are choices). That matches the 22 mA peak step current the Ch. 4 study already asked of its driver.
7. **If the buffer were split per channel** (derived): $R_{out}C_s=2.3$ ps, so $\Delta g_m/g_m\le39\ \text{fs}/2.3\ \text{ps}=1.7\%$ at 3σ, $\sigma(\Delta I)/I\le1.1\%$. With the current source at $g_m/I_D=5$ S/A, $\sigma(\Delta V_{TH})\le2.3$ mV; at $A_{VT}\approx4$ mV·µm (the 40 nm figure in [[Nonlinearity and Mismatch]]) that is $WL\ge3\ \mu\text{m}^2$.

## Level 0: The Black Box

### M Channels Take Turns

A **channel** is a sampler followed by a quantizer. Two channels on $CK$ and $\overline{CK}$ sample twice per clock period: while one samples, the other holds and converts. In general $M$ channels at $f_{CK}$ give

$$
\boxed{f_S=M\,f_{CK}}
$$

at $M$ times the power and area (to first order). Channel 1 produces the odd samples, channel 2 the even ones; the outputs are **multiplexed**, not added (each digital output is a held value, not an impulse). Often the MUX is skipped, because the DSP after the ADC prefers parallel, slower data anyway.

### Why the Aliases Cancel

```tikz title="Two channels clocked on CK and its complement. Each one alone aliases (f_CK is only slightly above f_in), but the replicas at +-f_CK come with opposite signs and cancel in the sum. After Razavi (Data Converters) Fig. 20.3(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \yo/\lab/\sgn in {4.2/{$Y_1(f)$}/1,1.8/{$Y_2(f)$}/-1} {
    \begin{scope}[yshift=\yo cm]
      \draw[->] (-4.6,0) -- (4.8,0) node[right]{$f$};
      \node[anchor=west] at (-4.6,1.2) {\lab};
      \draw[thick] (-1,0) -- (0,1) -- (1,0);
      \draw[thick,gray] (0.2,0) -- (1.2,{\sgn*1}) -- (2.2,0);
      \draw[thick,gray] (-2.2,0) -- (-1.2,{\sgn*1}) -- (-0.2,0);
      \node[below,font=\scriptsize] at (1.2,{min(0,\sgn)*1.05}) {$+f_{CK}$};
      \node[below,font=\scriptsize] at (-1.2,{min(0,\sgn)*1.05}) {$-f_{CK}$};
    \end{scope}
  }
  \begin{scope}[yshift=-1.6cm]
    \draw[->] (-4.6,0) -- (4.8,0) node[right]{$f$};
    \node[anchor=west] at (-4.6,1.4) {$Y_1+Y_2$};
    \draw[thick] (-1,0) -- (0,2) -- (1,0);
    \node[below,font=\scriptsize] at (-1,0) {$-f_{in}$};
    \node[below,font=\scriptsize] at (1,0) {$+f_{in}$};
    \node[font=\scriptsize,anchor=west] at (1.6,1.0) {replicas at $\pm f_{CK}$ cancel};
  \end{scope}
  \node[font=\scriptsize,anchor=west,align=left] at (2.6,2.6) {$e^{-j\pi n}=-1$ for odd $n$:\\ channel 2's odd replicas flip};
\end{circuitikz}
\end{document}
```

$$
Y_1(f)=\frac{1}{T_{CK}}\sum_nX(f-nf_{CK}),\qquad
Y_2(f)=\frac{1}{T_{CK}}\sum_nX(f-nf_{CK})\,e^{-j\pi n}
$$

The half-period offset of channel 2 multiplies each replica by $e^{-j\pi n}=(-1)^n$. In the sum the odd replicas (at $\pm f_{CK}$, which overlap the signal) cancel and the even ones (at $\pm2f_{CK}=\pm f_S$) double: the sum is exactly the spectrum of one ADC sampling at $f_S$. The two channels together sample correctly when $f_{CK}>f_{in}$, i.e. $f_S>2f_{in}$.

> [!tip] Remark
> This is ordinary impulse sampling ([[Sampling Circuits#Impulse Sampling and Aliasing]], [[Data Converter Fundamentals#Aliasing and Nyquist Zones]]) done twice with a time shift. The cancellation needs the two replicas to be *equal and opposite*: any difference in gain, timing or bandwidth between the channels leaves a residue at $f_{CK}\pm f_{in}$. That residue is every spur in [[#Level 1 Mismatch Spurs|Level 1]].

> [!note]- Detail: the three signal facts the derivation uses (Razavi §20.1.1)
> Sifting, $g(t)\delta(t-T_0)=g(T_0)\delta(t-T_0)$ (also in frequency). Time shift, $x(t-T_0)\leftrightarrow X(f)e^{-j2\pi fT_0}$. Convolution with an impulse shifts, $W(f)*\delta(f-f_0)=W(f-f_0)$. Channel 2's impulse train is delayed by $T_{CK}/2$, so its $n$-th line at $nf_{CK}$ picks up $e^{-j2\pi nf_{CK}T_{CK}/2}=e^{-j\pi n}$. For a random input, "spectrum" means the transform of the autocorrelation; Razavi doesn't distinguish, and neither do we until [[#Timing Skew|the random-input skew result]].

### Speed-Power and Metastability

```tikz title="For a given resolution, power rises linearly with speed only up to some rate f_1; beyond it each circuit is near its technology speed limit. Interleaving keeps each channel at or below f_1. After Razavi (Data Converters) Fig. 20.6."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.4,0) node[right,font=\scriptsize]{conversion rate};
  \draw[->] (0,0) -- (0,4.0) node[above,font=\scriptsize]{power};
  \draw[thick] (0,0) -- (3,1.5);
  \draw[thick,domain=3:4.6,samples=30] plot (\x,{1.5+0.5*(\x-3)+0.9*(\x-3)^2});
  \draw[dashed] (3,0) -- (3,1.5);
  \node[below,font=\scriptsize] at (3,0) {$f_1$};
  \draw[dashed,gray] (3,1.5) -- (6,3.0);
  \node[font=\scriptsize,anchor=north west,gray] at (5.0,2.4) {$M$ channels at $f_1$};
  \node[font=\scriptsize,anchor=east] at (4.0,3.6) {one channel pushed past $f_1$};
\end{circuitikz}
\end{document}
```

- **Speed-power.** An inverter has a minimum delay (5 to 6 ps fanout-of-one in 28 nm) that more current barely improves; a StrongARM and a SAR loop have the same kind of floor. So one channel's power goes superlinear above $f_1$, and the FoM degrades at high rates. Interleave $M=f_S/f_1$ channels, each at its optimum; the overhead is area and the multiphase clock.
- **Metastability.** With $M$ channels each comparator gets $M$ times the decision time:

$$
\boxed{P_e=\alpha\exp\!\left(-\frac{MT_1}{\tau_{reg}}\right)}
$$

Razavi's numbers: $T_1/\tau_{reg}=10$, $\alpha=1$: $P_e$ falls from $4.5\times10^{-5}$ to $2.1\times10^{-9}$ going from $M=1$ to 2.

> [!tip] Remark
> Same error-rate law as [[Comparators#Error Rate]] and [[Flash ADCs#Metastability in an Array]]: the exponent is the decision time over $\tau_{reg}$, and interleaving multiplies the numerator.

**Costs** (Razavi §20.1.3): area $\times M$; $M$ clock phases generated and distributed with fs-level accuracy; a larger input capacitance (overlapping phases put $M/2$ samplers on the input at once, and the input wire must reach all $M$ channels); and channel mismatches, which usually need calibration.

## Level 1: Mismatch Spurs

Razavi analyses two channels ($f_S=2f_{CK}$) unless stated otherwise.

### Offset Mismatch

```tikz title="Two channels with offsets V_OS1 and V_OS2 and zero input: the output alternates between them, a square wave at f_CK = f_S/2 of amplitude (V_OS1 - V_OS2)/2. After Razavi (Data Converters) Fig. 20.7."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (6.6,0) node[right]{$t$};
  \draw[->] (0,0) -- (0,2.2);
  \foreach \i in {0,...,5} {
    \pgfmathsetmacro{\x}{0.5+\i}
    \draw[thick] (\x,0) -- (\x,1.6); \draw (\x,1.6) circle (0.07);
    \pgfmathsetmacro{\xx}{1.0+\i}
    \draw[thick] (\xx,0) -- (\xx,0.9); \fill (\xx,0.9) circle (0.07);
  }
  \node[left,font=\scriptsize] at (0,1.6) {$V_{OS1}$};
  \node[left,font=\scriptsize] at (0,0.9) {$V_{OS2}$};
  \draw[<->] (0.5,-0.3) -- (1.5,-0.3) node[midway,below,font=\scriptsize]{$T_{CK}$};
  \begin{scope}[xshift=11.2cm]
    \draw[->] (-3.4,0) -- (3.6,0) node[right]{$f$};
    \draw[thick,->] (-2,0) -- (-2,1.3);
    \draw[thick,->] (2,0) -- (2,1.3);
    \node[below,font=\scriptsize] at (2,0) {$+f_{CK}=f_S/2$};
    \node[below,font=\scriptsize] at (-2,0) {$-f_{CK}$};
    \node[above,font=\scriptsize] at (2,1.3) {$\frac{V_{OS1}-V_{OS2}}{2}$};
    \node[font=\scriptsize] at (0,1.9) {input-independent tone};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{2 channels: tone at } f_S/2,\ \text{amplitude } \tfrac{V_{OS1}-V_{OS2}}{2}}\qquad
\boxed{\text{4 channels: tone at } f_S/4\ \propto\sqrt{(V_{OS1}-V_{OS3})^2+(V_{OS2}-V_{OS4})^2}}
$$

- The tone's frequency does not move with $f_{in}$, and it is there with zero input. That is how you recognise it (Carusone: tones at $f_S/m$ and harmonics, independent of the input's frequency and amplitude).
- With two channels the tone sits at the band edge. With four it sits at $f_S/4$, **inside** the signal band, and cannot be filtered. Keep it well below 1 LSB.
- Even a single-channel ADC wants a few-LSB offset at most: offset uses up the (small) full scale and costs dynamic range.

> [!note]- Derivation: the four-channel tone (Razavi Eqs. 20.6–20.9)
> The pattern $V_{OS1},V_{OS2},V_{OS3},V_{OS4}$ repeats every $T_{CK}$. Its first harmonic is four sinusoids at $f_{CK}$ shifted by $0,\pi/2,\pi,3\pi/2$:
> $$V_{eq}=V_{OS1}\cos\omega_{CK}t+V_{OS2}\cos(\omega_{CK}t-\tfrac\pi2)+V_{OS3}\cos(\omega_{CK}t-\pi)+V_{OS4}\cos(\omega_{CK}t-\tfrac{3\pi}2)$$
> $$=(V_{OS1}-V_{OS3})\cos\omega_{CK}t+(V_{OS2}-V_{OS4})\sin\omega_{CK}t$$
> Razavi drops the Fourier scale factor. Taking the DFT of the period-4 sequence properly (my arithmetic) gives an $f_S/4$ tone of amplitude $\tfrac12\sqrt{(V_{OS1}-V_{OS3})^2+(V_{OS2}-V_{OS4})^2}$ and an $f_S/2$ tone of amplitude $\tfrac14\lvert V_{OS1}-V_{OS2}+V_{OS3}-V_{OS4}\rvert$ (the "higher harmonic" Razavi ignores). For two channels the same DFT gives the $\tfrac12(V_{OS1}-V_{OS2})$ of the figure. Both tones vanish only if $V_{OS1}=V_{OS3}$, $V_{OS2}=V_{OS4}$ and the two pairs match.

### Gain Mismatch

```tikz title="Gain mismatch with a sine: the replicas at +-(f_CK - f_in) no longer cancel; an alpha A/2 residue is left beside the (2 + alpha) A/2 signal. After Razavi (Data Converters) Figs. 20.12, 20.13."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-5,0) -- (5,0) node[right]{$f$};
  \draw[very thick,->] (-1.5,0) -- (-1.5,2.4);
  \draw[very thick,->] (1.5,0) -- (1.5,2.4);
  \node[above,font=\scriptsize] at (1.5,2.4) {$(2+\alpha)\frac A2$};
  \draw[very thick,->] (-2.6,0) -- (-2.6,0.55);
  \draw[very thick,->] (2.6,0) -- (2.6,0.55);
  \node[above,font=\scriptsize] at (2.6,0.55) {$\alpha\frac A2$};
  \node[below,font=\scriptsize] at (1.5,0) {$f_{in}$};
  \node[below,font=\scriptsize] at (-1.5,0) {$-f_{in}$};
  \node[below,font=\scriptsize] at (2.75,0) {$f_{CK}-f_{in}$};
  \node[below,font=\scriptsize] at (-2.75,0) {$f_{in}-f_{CK}$};
  \node[font=\scriptsize,anchor=west] at (3.0,1.6) {$\mathrm{SNR}\approx4/\alpha^2$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{SNR}_{gain}\approx\frac{4}{\alpha^2}}\qquad(\alpha=0.1\%\Rightarrow66\text{ dB, roughly a 10-bit level})
$$

- The spurs sit at $kf_S/M\pm f_{in}$ and move with the input (Carusone: the gain is periodically modulated, so the input is multiplied by a periodic signal and intermodulates with the clock).
- The gain spur is **in phase** with the input ([[#Gain or Skew? The 90° Test]]).

> [!note]- Derivation: why $4/\alpha^2$
> Channel 2 has gain $1+\alpha$. For a random input of power $P_x$, the two channels' in-band copies add in phase, power $\approx(2)^2P_x=4P_x$; the replicas at $\pm f_{CK}$ cancel except for a residue of amplitude $\alpha$, power $\alpha^2P_x$. Ratio $4/\alpha^2$ (Eq. 20.12). With a sine $A\cos\omega_{in}t$: lines at $\pm f_{in}$ of $(2+\alpha)A/2$, at $\pm(f_{CK}-f_{in})$ of $\alpha A/2$, so $\mathrm{SNR}=(2+\alpha)^2/\alpha^2\approx4/\alpha^2$ (Eq. 20.13). The aliased lines of channel 1 are in phase with the input (Ex. 20.3): convolving with a real impulse train does not rotate phase.

### Timing Skew

```tikz title="Timing skew: a duty cycle off 50% shifts the even (falling-edge) samples by Delta T. The DSP assumes uniform spacing, so each even sample carries an error Delta T dx/dt. After Razavi (Data Converters) Figs. 20.14, 20.16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.4,0) node[right]{$t$};
  \draw[thick,domain=0:8,samples=100] plot (\x,{1.3+1.0*sin(45*\x)});
  \foreach \i in {0,...,3} {
    \pgfmathsetmacro{\xo}{0.5+2*\i}
    \pgfmathsetmacro{\yo}{1.3+sin(45*\xo)}
    \draw (\xo,\yo) circle (0.07);
    \pgfmathsetmacro{\xe}{1.5+2*\i}
    \pgfmathsetmacro{\xa}{1.8+2*\i}
    \pgfmathsetmacro{\ya}{1.3+sin(45*\xa)}
    \fill (\xa,\ya) circle (0.07);
    \draw[dotted] (\xe,0) -- (\xe,2.4);
  }
  \node[font=\scriptsize,anchor=west] at (8.3,2.1) {$\circ$ odd (on time)};
  \node[font=\scriptsize,anchor=west] at (8.3,1.6) {$\bullet$ even (late by $\Delta T$)};
  \node[font=\scriptsize,anchor=west] at (8.3,1.0) {dotted: ideal even instants};
  \begin{scope}[yshift=-1.4cm]
    \node[left,font=\scriptsize] at (0,0.3) {$CK$};
    \foreach \i in {0,...,3} { \pgfmathsetmacro{\a}{0.5+2*\i} \draw (\a,0) -- (\a,0.6) -- (\a+1.3,0.6) -- (\a+1.3,0) -- (\a+2,0); }
    \draw (0,0) -- (0.5,0);
    \draw[<->] (1.5,-0.25) -- (1.8,-0.25) node[midway,below,font=\scriptsize]{$\Delta T$};
    \node[font=\scriptsize,anchor=west] at (8.3,0.3) {duty cycle $>50\%$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta x\approx\Delta T\,\frac{dx}{dt}}\qquad
\boxed{\mathrm{SNR}_{skew}\approx\frac{1}{\pi^2\Delta T^2f_{in}^2}\ \ \text{(sine)}}\qquad
\boxed{\mathrm{SNR}_{skew}=\frac{3}{2\pi^2\Delta T^2f_{in}^2}\ \ \text{(random, flat to }f_{in}\text{)}}
$$

- $\Delta T$ is **static**: it varies from chip to chip but not in time. It is not jitter, which is random sample to sample ([[Sampling Circuits#Aperture Jitter]]).
- The spur scales with $\Delta T$ **and** $f_{in}$ (strictly, with the input slew rate $2\pi Af_{in}$), so it is worst near Nyquist. Example: two channels, $f_{in}=5$ GHz, $\Delta T=64$ fs already limits SNR to 60 dB.
- **Budget:** 10 bits within 2 dB of ideal at 5 GHz: $\Delta T\le39$ fs (Razavi Ex. 20.5).
- Every block from the divider to the sampling switch contributes skew: $\div2$ stage, clock buffers, long interconnects, nonoverlap generator, bootstrap circuit (Razavi Fig. 20.15).

> [!tip] Remark
> Same slope argument as aperture jitter in [[Sampling Circuits#Aperture Jitter]] and comparator skew in [[Flash ADCs#Clock Skew Makes Bubbles]]. The jitter SNR is $1/(\sigma_j\omega_{in})^2=1/(4\pi^2\sigma_j^2f_{in}^2)$; skew gives $1/(\pi^2\Delta T^2f_{in}^2)$, 4× (6 dB) better for the same number, because only the even half of the samples is wrong.

> [!note]- Derivation: the skew error and its SNR (Razavi Eqs. 20.18–20.24, Exs. 20.4–20.5)
> Channel 2 samples at $nT_{CK}+T_{CK}/2+\Delta T$. With $x(t+\Delta T)\approx x(t)+\Delta T\,x'(t)$:
> $$y_2(t)\approx\sum_nx\!\left(nT_{CK}+\tfrac{T_{CK}}2\right)\delta(\cdot)+\underbrace{\sum_n\Delta T\,x'\!\left(nT_{CK}+\tfrac{T_{CK}}2\right)\delta(\cdot)}_{y_e(t)}$$
> The impulses now sit at their ideal instants; the error $y_e$ is the *derivative* sampled by the even channel only. For $x=A\cos\omega_{in}t$, $\Delta T\,x'=-A\Delta T\omega_{in}\sin\omega_{in}t$, whose lines $\pm j\pi\Delta TAf_{in}$ are shifted to $\pm(f_{CK}-f_{in})$. The signal lines of the two channels add to area $A/T_{CK}$; each spur has area $\pi\Delta TAf_{in}/T_{CK}$. Ratio squared: $1/(\pi^2\Delta T^2f_{in}^2)$.
>
> **The trap (Ex. 20.4).** Taking spur power $[\Delta TA\,2\pi f_{in}]^2/2$ against $A^2/2$ gives $1/(4\pi^2\Delta T^2f_{in}^2)$, 4× too pessimistic: only half the samples carry the error. Referred to the input, the spur power is $\pi^2\Delta T^2A^2f_{in}^2/2$.
>
> **Penalty (Ex. 20.5).** Add the spur to quantization noise $\frac{1}{12}(2A/2^N)^2$: $\mathrm{SNR}=1/[\tfrac{2}{3}2^{-2N}+\pi^2\Delta T^2f_{in}^2]$. (Razavi's printed Eq. 20.26 shows $\tfrac13 2^{-2N}$; it must be $\tfrac23 2^{-2N}$ to match the ideal $\tfrac32 2^{2N}$ and his own Eq. 20.27 and 39 fs answer.) Penalty $=1+\mathrm{SNR}_{ideal}\pi^2\Delta T^2f_{in}^2=10^{0.2}$ with $\mathrm{SNR}_{ideal}=1.573\times10^6$ gives $\Delta T=38.8$ fs.
>
> **Random input.** The error is $\Delta T\,dx/dt$, a differentiator $H(s)=\Delta T\,s$, so it shapes the input PSD by $|j2\pi f\Delta T|^2=4\pi^2f^2\Delta T^2$: a parabola. This shaped spectrum adds to the signal directly, and its aliased copies add too. The SNR (from Razavi's JSSC 2013 paper, quoted without derivation) is $3/(2\pi^2\Delta T^2f_{in}^2)$, 1.76 dB better than the sine case: most of a random signal's power is not at the band edge.

### Gain or Skew? The 90° Test

```tikz title="Gain and skew spurs land on the same frequency f_CK - f_in but in quadrature: gain-mismatch spurs are real (in phase with the input), skew spurs are imaginary (the derivative rotates by 90 degrees). After Razavi (Data Converters) Fig. 20.18."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-2.6,0) -- (2.8,0) node[right]{Re};
  \draw[->] (0,-2.2) -- (0,2.4) node[above]{Im};
  \draw[very thick,->] (0,0) -- (1.8,0) node[below,font=\scriptsize]{$\alpha A/2$};
  \draw[very thick,->] (0,0) -- (0,1.6) node[right,font=\scriptsize]{$+j\pi\Delta TAf_{in}$};
  \node[font=\scriptsize,anchor=west] at (2.0,0.6) {gain mismatch};
  \node[font=\scriptsize,anchor=west] at (0.2,2.0) {timing skew};
  \node[font=\scriptsize] at (0,-2.6) {spur at $+(f_{CK}-f_{in})$};
\end{circuitikz}
\end{document}
```

- Read the **phase** of the spur in the output FFT: real means gain, imaginary means skew.
- Without phase: sweep $f_{in}$. Only the skew spur's amplitude grows in proportion to $f_{in}$ (Razavi Prob. 20.6). An offset tone is the one that does not move at all (Prob. 20.5).
- Because the two are orthogonal, gain and skew can be detected and calibrated independently.

### Bandwidth Mismatch

```tikz title="Two channel samplers whose switch resistances differ by Delta R have different bandwidths; for omega_in well below 1/(R_1 C_1) the phase difference is a pure delay, Delta T approx Delta R C_1. After Razavi (Data Converters) Fig. 20.20."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} -- (0.8,0);
  \draw (0.8,1.2) -- (0.8,-1.2);
  \draw (0.8,1.2) to[nos, l=$CK$] (2.2,1.2) to[R, l=$R_1$] (4.0,1.2) node[circ]{} -- (4.8,1.2) node[right]{$V_{out1}$};
  \draw (4.0,1.2) to[C, l=$C_1$] (4.0,0.1) node[ground]{};
  \draw (0.8,-1.2) to[nos, l_=$\overline{CK}$] (2.2,-1.2) to[R, l=$R_1+\Delta R$] (4.0,-1.2) node[circ]{} -- (4.8,-1.2) node[right]{$V_{out2}$};
  \draw (4.0,-1.2) to[C, l=$C_1$] (4.0,-2.3) node[ground]{};
  \node[font=\scriptsize,anchor=west,align=left] at (6.4,0) {$\Delta\omega\approx\dfrac{\Delta R}{R_1}\dfrac{1}{R_1C_1}$\\[4pt] $\Delta T\approx\dfrac{\Delta\omega}{\omega_0^2}\approx\Delta R\,C_1$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\Delta T\approx\frac{\Delta\omega}{\omega_0^2}=\Delta\tau\approx\Delta R\cdot C_1}
$$

Bandwidth mismatch is a delay mismatch: lump it with clock skew and use the same budget. (It also causes a small gain mismatch, which is negligible.) Carusone calls it a frequency-dependent gain mismatch; at $\omega_{in}\ll\omega_0$ the dominant part is this phase term.

> [!note]- Derivation: from phase difference to delay (Razavi Eqs. 20.32–20.36)
> Each RC network shifts the phase by $\tan^{-1}(\omega_{in}/\omega_0)$, with $\omega_0=1/(R_1C_1)$. The difference is $\Delta\phi=\tan^{-1}\frac{\omega_{in}}{\omega_0}-\tan^{-1}\frac{\omega_{in}}{\omega_0-\Delta\omega}$. With $\tan^{-1}a-\tan^{-1}b=\tan^{-1}\frac{a-b}{1+ab}$, $\Delta\omega\ll\omega_0$ and $\omega_{in}^2\ll\omega_0^2$: $|\Delta\phi|\approx(\Delta\omega/\omega_0^2)\,\omega_{in}$. A phase proportional to frequency is a delay: $\Delta T=\Delta\phi/\omega_{in}=\Delta\omega/\omega_0^2$, and $\Delta\omega/\omega_0^2=\Delta(1/\omega_0)=\Delta\tau\approx\Delta R\,C_1$.
>
> **Problem 20.7 (my arithmetic).** 60 dB from bandwidth mismatch alone at $\omega_{in}=0.2/(R_1C_1)$: $\pi\Delta Tf_{in}=\pi(\Delta R/R_1)\tau\cdot0.2/(2\pi\tau)=0.1\,\Delta R/R_1\le10^{-3}$, so $\Delta R/R_1\le1\%$.

## Level 2: The Shared Input Node

### Overlapping vs Nonoverlapping Clocks

```tikz title="Four-channel clocking. Nonoverlapping (left): each sampler gets only T_CK/4 to acquire but loads the input alone. Overlapping (right): T_CK/2 each, but two samplers load the input at once. After Razavi (Data Converters) Figs. 20.5(b), (c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \xo/\w/\lab in {0/0.8/{nonoverlapping: track $T_{CK}/4$},7.2/1.6/{overlapping: track $T_{CK}/2$}} {
    \begin{scope}[xshift=\xo cm]
      \foreach \k/\y in {1/1.8,2/1.2,3/0.6,4/0.0} {
        \pgfmathsetmacro{\a}{0.8*(\k-1)}
        \node[left,font=\scriptsize] at (0,\y+0.15) {$CK_\k$};
        \draw (0,\y) -- (\a,\y) -- (\a,\y+0.35) -- (\a+\w,\y+0.35) -- (\a+\w,\y) -- (5.6,\y);
      }
      \node[font=\scriptsize] at (2.6,-0.6) {\lab};
    \end{scope}
  }
  \fill[gray,opacity=0.25] (8.0,0) rectangle (8.8,2.2);
  \node[font=\scriptsize,align=center] at (8.4,2.6) {$CK_1,CK_2$ both on};
\end{circuitikz}
\end{document}
```

| Clocking | Track time per channel ($M=4$) | Samplers on the input at once | Conversion time |
|---|---|---|---|
| Nonoverlapping | $T_{CK}/4=T_S$ | 1 | $3T_{CK}/4$ |
| Overlapping | $T_{CK}/2$ | $M/2=2$ | Less |

### Charge Sharing Between Channels

```tikz title="With overlapping clocks, C_2 switches onto node X while C_1 is still acquiring and shares charge with it; V_1 drops and must re-settle. After Razavi (Data Converters) Figs. 20.21, 20.22."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} to[R, l=$R_{buf}$] (2.0,0) coordinate (X) node[circ]{} node[above left]{$X$};
  \draw (X) -- (2.0,-3.3);
  \foreach \k/\y in {1/0,2/-1.1,3/-2.2,4/-3.3} {
    \draw (2.0,\y) to[nos, l=\scriptsize $S_\k$] (3.4,\y) -- (4.0,\y);
    \draw (4.0,\y) to[C, l=\scriptsize $C_\k$] (5.0,\y) -- (5.3,\y) node[ground,rotate=90]{};
  }
  \begin{scope}[xshift=7.2cm,yshift=-2.4cm]
    \draw[->] (0,0) -- (5.4,0) node[right]{$t$};
    \draw[dashed] (0,2.2) -- (5,2.2) node[right,font=\scriptsize]{$V_a$};
    \draw[thick,domain=0:1.6,samples=30] plot (\x,{2.2*(1-exp(-\x/0.8))});
    \pgfmathsetmacro{\vt}{2.2*(1-exp(-2))}
    \draw[thick] (1.6,\vt) -- (1.6,\vt/2);
    \draw[thick,domain=1.6:4.0,samples=30] plot (\x,{2.2-(2.2-\vt/2)*exp(-(\x-1.6)/1.6)});
    \draw[thick,gray,domain=1.6:4.0,samples=30] plot (\x,{2.2-2.2*exp(-(\x-1.6)/1.6)});
    \node[font=\scriptsize] at (3.2,0.55) {$V_2$};
    \node[font=\scriptsize] at (3.2,2.4) {$V_1$};
    \foreach \x/\l in {0/t_1,1.6/t_2,4.0/t_3} {\draw (\x,0) -- (\x,-0.1) node[below,font=\scriptsize]{$\l$};}
    \node[font=\scriptsize,anchor=west] at (1.7,0.95) {charge sharing};
    \node[font=\scriptsize] at (2.0,-0.75) {$CK_2$ on at $t_2$, $CK_1$ off at $t_3$};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{Overlapping clocks help only if }R_{buf}\ll R_{on}}
$$

- When $S_2$ closes, $C_2$ (holding last cycle's value) is dumped onto node $X$ and drags $V_1$ away. $V_1$ is then accurate only if this disturbance dies out in the remaining $T_{CK}/4$: the overlap's extra track time is partly fake.
- With $R_{on}=0$ and $C_1=C_2$, overlapping is **worse** than nonoverlapping (Ex. 20.7). In the other limit, $R_{buf}\to0$, $C_2$ cannot disturb $X$ at all.
- So the buffer, not the switches, must dominate the speed: a low-impedance driver is what makes overlapped sampling pay.

> [!note]- Derivation: Razavi Ex. 20.7 ($R_{on}=0$, $C_1=C_2=C$, zero initial charge)
> From $t_1$ to $t_2$ ($T_{CK}/4$): $V_1=V_a[1-e^{-t/\tau_1}]$, $\tau_1=R_{buf}C$. At $t_2$ charge sharing halves it. Then one RC with $\tau_2=2R_{buf}C$ for another $T_{CK}/4$:
> $$\Delta V_1=\frac{V_a}{2}\left(1+e^{-T_{CK}/4\tau_1}\right)e^{-T_{CK}/4\tau_2}$$
> Nonoverlapping, the error after $T_{CK}/4$ is $\Delta V_2=V_ae^{-T_{CK}/4\tau_1}$. With $\beta=e^{-T_{CK}/4\tau_1}$ and $\tau_2=2\tau_1$: $\Delta V_1=\tfrac{V_a}{2}(1+\beta)\sqrt\beta$ and $\Delta V_2=V_a\beta$. Since $\beta<1$, $(1+\beta)/2>\sqrt\beta$, so $\Delta V_1>\Delta V_2$. The model ignores $R_{on}$, which is exactly what the $R_{buf}\ll R_{on}$ condition restores.

### Two-Rank Sampling

```tikz title="Two-rank sampling: one full-rate sampler C_F takes every sample on CK_F, buffer A_1 copies it, and the second-rank samplers (nonoverlapping CK_1..CK_4) only see held, constant voltages. Timing skew in CK_1..CK_4 no longer matters. After Razavi (Data Converters) Fig. 20.23."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} to[nos, l=$CK_F$] (1.8,0) coordinate (F) node[circ]{};
  \draw (F) to[C, l_=$C_F$] (1.8,-1.4) node[ground]{};
  \draw (F) -- (2.6,0) node[buffer,anchor=in,scale=0.8](B){};
  \node[font=\scriptsize] at ([yshift=0.6cm]B.center) {$A_1$};
  \draw (B.out) -- (5.2,0);
  \draw (5.2,1.8) -- (5.2,-1.8);
  \foreach \k/\y in {1/1.8,2/0.6,3/-0.6,4/-1.8} {
    \draw (5.2,\y) to[nos, l=\scriptsize $CK_\k$] (6.8,\y) -- (7.2,\y);
    \draw[thick,fill=gray!8] (7.2,\y-0.25) rectangle (8.8,\y+0.25);
    \node[font=\scriptsize] at (8.0,\y) {Channel \k};
  }
\end{circuitikz}
\end{document}
```

- **Gain:** skew in the channel clocks is irrelevant (the second rank samples a constant). Only the one full-rate clock $CK_F$ needs low jitter (Carusone: the other S/Hs "can have considerable jitter"; Razavi Prob. 20.9).
- **Cost 1, the buffer $A_1$:** its linearity, speed and noise must match the whole ADC, at full rate. A source follower loses a $V_{GS}$ of headroom, trades settling against power (slew $I_1/C_L$ on falling edges), adds the noise of $M_1$ and $I_1$, and is nonlinear even without body effect because short-channel $r_O$ varies with $V_{DS}$: $A_1=r_{O1}/(r_{O1}+1/g_{m1})$.
- **Cost 2, noise:** the signal is sampled twice, so it takes $kT/C$ twice; every capacitor must be larger than in a single-rank design (serious if $A_1\le1$).
- **Cost 3, clocks:** a full-rate clock *and* the $M$ sub-rate phases.
- **Without a buffer** (low resolution only): $C_F$ shares charge with $C_1$, $V_1=V_{in}C_F/(C_F+C_1)$. In a 6-bit 10 GS/s design, $C_F=100$ fF and $C_1=25$ fF cost 20% of the swing (Razavi Ex. 20.8, ref. [3]).

> [!tip] Remark
> The follower's three distortion mechanisms are the ones in [[Sampling Circuits#The Driver]] and [[Single-Stage#Source Follower]]. The two-rank design concentrates all of them in one place that must run at $f_S$.

### Splitting the Buffer

```tikz title="Channels 1 and 3 never sample at the same time, nor do 2 and 4. Giving each pair its own buffer means no buffer ever drives two capacitors at once: no interchannel crosstalk. After Razavi (Data Converters) Fig. 20.26(b)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} -- (0.6,0);
  \draw (0.6,1.5) -- (0.6,-1.5);
  \foreach \b/\y/\ka/\kb in {1/1.5/1/3,2/-1.5/2/4} {
    \draw (0.6,\y) -- (1.2,\y) node[buffer,anchor=in,scale=0.7](B\b){};
    \node[font=\scriptsize] at ([yshift=0.5cm]B\b.center) {$B_\b$};
    \draw (B\b.out) to[R, l=\scriptsize $R_{buf\b}$] ++(1.6,0) coordinate (n\b);
    \draw (n\b) -- ++(0,0.5) to[nos, l=\scriptsize $CK_\ka$] ++(1.4,0) to[C, l=\scriptsize $C_\ka$] ++(1.2,0) node[ground,rotate=90]{};
    \draw (n\b) -- ++(0,-0.5) to[nos, l_=\scriptsize $CK_\kb$] ++(1.4,0) to[C, l_=\scriptsize $C_\kb$] ++(1.2,0) node[ground,rotate=90]{};
  }
\end{circuitikz}
\end{document}
```

Two-phase systems ($CK$, $\overline{CK}$) never overlap, so they never cross-talk. Split a four-phase front end into two such pairs, one buffer each (Razavi §20.4.2, from Varzaghani's 10.3 GS/s flash, ref. [4]).

- **Power or speed:** two copies of $B_0$ double the power and the input capacitance; splitting $B_0$ into two half-width, half-current slices doubles each $R_{buf}$ and slows acquisition.
- **New mismatch:** the two buffers' offset, gain and delay mismatches add spurs that do not simply lump with the four channels' mismatches, because channels 1, 3 share $B_1$ and 2, 4 share $B_2$ (Razavi Probs. 20.10, 20.11).

## Level 3: Calibration

### Detect Digitally, Correct Where It Is Cheap

| Mismatch | Detect | Correct | Why there |
|---|---|---|---|
| Offset | Digital: subtract long-term averages of $D_{out,k}$ | Analog (CDAC on the sampling cap) or digital shift | Analog keeps full dynamic range; digital if the range loss is negligible |
| Gain | Digital: compare long-term **powers** (amplitudes of a random signal carry no pattern, Ex. 20.9) | Usually digital multiply; analog via a gain DAC | Analog gain trim is "somewhat complex" |
| Skew | Digital: correlation of neighbouring samples (hard) | **Analog** variable delay in the clock path | Digital needs $f_{in}<f_{CK}$ and a long FIR at full rate: too much power |

- **Foreground** calibration runs once at power-up and freezes the codes: simpler, but blind to supply and temperature drift (inverter delay mismatch drifts with temperature).
- **Background** calibration runs during normal operation on the real input, so it tracks drift but must work with a random signal. Updates need not be fast: if drift has a millisecond time constant, measure and update every 100 µs ("compute and rest") to save digital power. Every background scheme fails with no input signal and must be checked against odd spectra and statistics.

```tikz title="Offset correction in the analog path: part of the sampling capacitor becomes a small DAC whose bottom plates switch to V_REF in every hold phase, shifting node X by a stored code. After Razavi (Data Converters) Fig. 20.28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[ocirc]{} node[left]{$V_{in}$} to[nos] (1.6,0) coordinate (X) node[circ]{} -- (2.4,0) node[right]{$X$};
  \draw (X) -- (1.6,-0.4);
  \draw (1.6,-0.4) -- (0.6,-0.4) to[C, l_=$C_0$] (0.6,-1.8) node[ground]{};
  \draw (1.6,-0.4) -- (4.6,-0.4);
  \foreach \x in {2.0,3.3,4.6} { \draw (\x,-0.4) to[C] (\x,-1.5); \draw (\x,-1.5) to[nos] (\x,-2.5); }
  \node[font=\scriptsize] at (3.3,-2.85) {each bottom plate to $0$ or $V_{REF}$};
  \node[font=\scriptsize,anchor=west,align=left] at (5.2,-1.2) {offset-correction DAC:\\ fixed code from a register};
\end{circuitikz}
\end{document}
```

- In an MDAC channel, the same DAC injects its charge into the virtual ground in the amplification phase (Ex. 20.10). In a SAR channel, a second DAC beside the SAR DAC adds capacitance at the comparator node and raises the gain error (Ex. 20.11; [[SAR ADCs]]).
- Analog correction avoids the dynamic-range loss only if each channel's offset is driven to zero, not just made equal to the others.

### Offset: An Accumulator

```tikz title="Background offset calibration (top): each channel's accumulator integrates its own output and the result is subtracted; the loop settles only when the corrected output has zero average. Gain calibration (bottom): rectify, subtract, accumulate, and scale channel 1 until both have equal average power. After Razavi (Data Converters) Figs. 20.34, 20.37."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.4cm,minimum height=0.6cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[left] (d1) at (0,0) {$D_{out1}$};
  \node[draw,circle,inner sep=1pt] (s) at (1.2,0) {$-$};
  \draw[->] (d1) -- (s);
  \draw[->] (s) -- (5.2,0) node[right]{$D_{Y1}$};
  \node[blk] (acc) at (3.2,-1.1) {accumulator\\ $\sum$, $z^{-1}$};
  \draw[->] (4.2,0) |- (acc.east);
  \draw[->] (acc.west) -| node[pos=0.25,below,font=\scriptsize]{$D_{int1}$} (s.south);
  \begin{scope}[yshift=-3.6cm]
    \node[left] (g1) at (0,0.6) {$D_{out1}$};
    \node[left] (g2) at (0,-0.6) {$D_{out2}$};
    \node[draw,circle,inner sep=1pt] (m) at (1.0,0.6) {$\times$};
    \node[blk] (r1) at (2.6,0.6) {$|\cdot|$};
    \node[blk] (r2) at (2.6,-0.6) {$|\cdot|$};
    \node[draw,circle,inner sep=1pt] (sub) at (4.2,0) {$-$};
    \node[blk] (a2) at (5.9,0) {accumulator};
    \draw[->] (g1) -- (m); \draw[->] (m) -- (r1); \draw[->] (g2) -- (r2);
    \draw[->] (r1) -| (sub); \draw[->] (r2) -| (sub);
    \draw[->] (sub) -- (a2);
    \draw[->] (a2.east) -- ++(0.4,0) |- (1.0,1.5) -- (m.north);
    \node[font=\scriptsize] at (3.4,1.75) {$\beta$};
  \end{scope}
\end{circuitikz}
\end{document}
```

- Integration reveals offset: $\int(V_0\cos\omega t+V_{OS})dt=\frac{V_0}{\omega}\sin\omega t+V_{OS}t$; the offset term grows without bound, the signal term does not (Ex. 20.13).
- The accumulator output $D_{int}$ is bounded only if its input has zero mean, so in steady state $D_{out}-D_{int}$ has zero offset (Fu et al., ref. [6]).
- **Limit:** a very slow input looks like offset over a finite window. Size the register length $b$ (max $2^b-1$) to the period of the slowest input component (Ex. 20.14).

### Gain: Rectify and Accumulate

- Channel gain is measured from average power $\frac1T\int x^2dt$. A full-wave rectifier $|x|$ stands in for the squarer and avoids a multiplier.
- ADC codes are unsigned ($00\cdots0$ to $11\cdots1$): subtract the mean before rectifying (Ex. 20.15). So **offset must be calibrated first**.
- Loop: $\beta D_{out1}$ and $D_{out2}$ are rectified, subtracted and accumulated; the accumulator drives $\beta$ until the two average powers match.
- **Limits:** with no input the accumulator drifts to any value, and after the input returns it needs a time set by its length to reconverge. The multiplier processes one channel's full-speed data and can draw a lot of power; Janssen et al. (ref. [7]) drive a gain DAC in the analog path instead.

### Skew: Correlate Neighbouring Samples

```tikz title="Skew detection and correction for two channels: P_12 = y_1[k] y_2[k-1] and P_21 = y_2[k-1] y_1[k-1] are averaged and subtracted; the result D_dT is zero only at zero skew and drives a variable delay line (VDL) in one channel's clock. After Razavi (Data Converters) Figs. 20.39(b), 20.42."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.0cm,minimum height=0.6cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[blk,minimum width=1.6cm] (c1) at (0,1.2) {Channel 1};
  \node[blk,minimum width=1.6cm] (c2) at (0,-1.2) {Channel 2};
  \node[blk] (z1) at (2.6,0.4) {$z^{-1}$};
  \node[blk] (z2) at (2.6,-1.2) {$z^{-1}$};
  \node[draw,circle,inner sep=1pt] (m1) at (4.4,1.2) {$\times$};
  \node[draw,circle,inner sep=1pt] (m2) at (4.4,-0.4) {$\times$};
  \draw[->] (c1.east) -- node[above,font=\scriptsize]{$y_1[k]$} (m1);
  \draw[->] (c1.east) ++(0.5,0) |- (z1.west);
  \draw[->] (c2.east) -- (z2.west);
  \draw[->] (z2.east) -- ++(0.6,0) coordinate (q) |- (m1.south west);
  \draw[->] (q) |- (m2.south);
  \draw[->] (z1.east) -| (m2.north);
  \node[draw,circle,inner sep=1pt] (sb) at (6.0,0.4) {$-$};
  \draw[->] (m1) -| node[pos=0.25,above,font=\scriptsize]{$P_{1,2}$} (sb.north);
  \draw[->] (m2) -| node[pos=0.25,below,font=\scriptsize]{$P_{2,1}$} (sb.south);
  \node[blk,minimum width=1.4cm] (av) at (7.6,0.4) {average};
  \draw[->] (sb) -- (av);
  \node[blk,minimum width=1.3cm] (rg) at (7.6,-1.6) {register};
  \draw[->] (av.south) -- node[right,font=\scriptsize]{$D_{\Delta T}$} (rg.north);
  \node[blk] (vdl) at (2.6,-2.6) {VDL};
  \draw[->] (rg.west) -| (vdl.north);
  \draw[->] (-2.4,-2.6) node[left,font=\scriptsize]{$\overline{CK}$} -- (vdl.west);
  \draw[->] (vdl.south) -- ++(0,-0.3) -| (0,-1.5);
  \draw[->] (-2.0,0) node[left]{$x(t)$} -- (-1.2,0) |- (c1.west);
  \draw (-1.2,0) |- (c2.west);
\end{circuitikz}
\end{document}
```

- The goal of any detector is a DC value proportional to the error, zero at zero error.
- A plain product $y_1\times y_2$ fails: the cosine (signal) and sine (skew) components at the same frequency are in quadrature, so their product averages to zero.
- **What works:** the spacing from an odd sample to the next even one is $T_{CK}/2+\Delta T$, and from even to the next odd is $T_{CK}/2-\Delta T$. The products of these pairs are biased in opposite directions, and their averaged difference $D_{\Delta T}$ is proportional to $\Delta T$. Behavioural simulation with band-limited white noise gives a monotonic $D_{\Delta T}$ through zero at $\Delta T=0$ (Razavi Fig. 20.40, $\pm5\%$ of $T_{CK}$).
- **Closing the loop:** the register drives a VDL in one channel's clock. In steady state it toggles by 1 LSB. The detector logic may also run only every 100 µs.
- **Four channels:** measure channels 2, 3, 4 each against channel 1 (three detectors, three VDLs). Calibrating each against the reference, not against its neighbour, avoids accumulating errors (Exs. 20.16, 20.17).
- **Literature alternatives** (refs. [11]–[15]): judge each by whether it works with random inputs, constrains the spectrum, needs many full-rate multipliers, needs an extra channel, or adds a dither to the input.

> [!note]- Derivation: the detector with a sine input (Razavi Prob. 20.15, worked here)
> Let $a=\omega_0T_{CK}/2$, $d=\omega_0\Delta T$, and $V_{in}=V_0\cos\omega_0t$. Consecutive samples at $T_{CK}/2+\Delta T$, $T_{CK}$, $3T_{CK}/2+\Delta T$ are $V_0\cos(a+d)$, $V_0\cos2a$, $V_0\cos(3a+d)$. Product-to-sum:
> $$P_{12}-P_{23}=\tfrac{V_0^2}{2}[\cos(a-d)-\cos(a+d)]+\tfrac{V_0^2}{2}[\cos(3a+d)-\cos(5a+d)]=V_0^2\sin a\sin d+V_0^2\sin a\sin(4a+d)$$
> The second term is a sample of a sinusoid every $2T_{CK}$ and averages to zero; the first accumulates. So
> $$D_{\Delta T}\propto V_0^2\sin\!\left(\frac{\omega_0T_{CK}}{2}\right)\omega_0\Delta T\qquad(\omega_0\Delta T\ll1)$$
> My observation from this result: the gain $\sin(\omega_0T_{CK}/2)$ vanishes at DC and at $f_0=f_{CK}=f_S/2$, so a sine at either end gives no skew information.

### Variable Delay Lines

```tikz title="Differential delay control: a VDL in each of CK and its complement, both at mid-code when matched, moved in opposite directions to correct skew of either sign. After Razavi (Data Converters) Fig. 20.43."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \y/\c/\n/\ch in {0.8/{$CK$}/A/1,-0.8/{$\overline{CK}$}/B/2} {
    \draw (0,\y) node[left]{\c} -- (0.4,\y) node[not port,anchor=in,scale=0.6](i1\n){};
    \draw (i1\n.out) -- ++(0.6,0) coordinate (\n) node[above,font=\scriptsize]{\n} -- ++(0.4,0) node[not port,anchor=in,scale=0.6](i2\n){};
    \draw (i2\n.out) -- ++(0.4,0) node[right,font=\scriptsize]{to Channel \ch};
    \draw (\n) -- ++(0,-0.25);
    \draw[fill=gray!15] ($(\n)+(-0.5,-0.6)$) rectangle ($(\n)+(0.5,-0.25)$);
    \node[font=\tiny] at ($(\n)+(0,-0.43)$) {$C$ array};
  }
  \node[font=\scriptsize,anchor=west,align=left] at (4.6,0) {mid-code ($10\cdots0$) when matched;\\ one up, one down to correct;\\ jitter $\times\sqrt2$ (two uncorrelated VDLs)};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{range}\ \ge\ \Delta T_{raw,max}\ (\approx3\sigma),\qquad \text{LSB}\ \le\ \Delta T_{budget}}
$$

- **Range and resolution:** extract the clock network's parasitics after layout, simulate random and deterministic skew, take the worst (3σ). The step size follows from the tolerable SNR penalty (Ex. 20.18). 2 ps raw to 40 fs is 50 steps, slightly under 6 bits (Ex. 20.12).
- **Single-ended VDL problems:** it only adds delay (cannot correct negative skew), and even fully switched out it has the delay of two inverters, its own mismatch. **Differential** control fixes both, at the cost of $\sqrt2$ more VDL jitter.
- **Calibrating four channels differentially:** channels 1 and 2 as a differential pair, then 3 and 4 each against 1, adjusting only their own VDL (Ex. 20.19).

### Delay Elements

- **Capacitor arrays fail at fs resolution.** Razavi's 28 nm example: inverter $W/L$ 1 µm/28 nm (N) and 2 µm/28 nm (P), node $\approx5$ fF, delay $\approx10$ ps. A 2 ps range needs 1 fF; 100 steps of 20 fs need a 10 aF unit. Small metal squares (0.5 µm metal-9, $\approx10$ aF) suffer fringe coupling between neighbours, so two units are not twice one (Ex. 20.20), and the switch's own $C_{GS}$ and $C_{SB}$ are several fF, far above 10 aF.

```tikz title="Starved-inverter delay. Left: M_3 degenerates M_1, controlling the falling edge; near V_TH3 the delay is very nonlinear. Adding a parallel M_4 that stays on keeps M_1 partly on and linearizes the curve. After Razavi (Data Converters) Figs. 20.45(a)-(c)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[nmos](M1){};
  \draw (M1.D) -- ++(0,0.3) node[pmos,anchor=D](M2){};
  \draw (M2.S) -- ++(0,0.2) node[vcc]{$V_{DD}$};
  \draw (M1.G) -- ++(-0.3,0) coordinate (g1);
  \draw (M2.G) -- ++(-0.3,0) coordinate (g2);
  \draw (g1) -- (g2);
  \draw ($(g1)!0.5!(g2)$) -- ++(-0.5,0) node[left]{$V_{in}$};
  \draw (M1.D) -- ++(0.8,0) node[right]{$V_{out}$};
  \node[font=\scriptsize,anchor=west] at ([xshift=0.1cm]M1.east) {$M_1$};
  \node[font=\scriptsize,anchor=west] at ([xshift=0.1cm]M2.east) {$M_2$};
  \draw (M1.S) -- ++(0,-0.3) coordinate (s1);
  \draw (s1) -- ++(-0.9,0) node[nmos,anchor=D](M3){};
  \draw (s1) -- ++(0.9,0) node[nmos,anchor=D,xscale=-1](M4){};
  \draw (M3.S) -- ++(0,-0.2) node[ground]{};
  \draw (M4.S) -- ++(0,-0.2) node[ground]{};
  \draw (M3.G) -- ++(-0.3,0) node[left]{$V_{cont}$};
  \draw (M4.G) -- ++(0.3,0) node[right,font=\scriptsize]{$V_{DD}$};
  \node[font=\scriptsize] at ([xshift=0.35cm]M3.center) {$M_3$};
  \node[font=\scriptsize] at ([xshift=-0.35cm]M4.center) {$M_4$};
  \begin{scope}[xshift=4.6cm,yshift=-2.4cm]
    \draw[->] (0,0) -- (4.2,0) node[right,font=\scriptsize]{$V_{cont}$};
    \draw[->] (0,0) -- (0,3.4) node[above,font=\scriptsize]{delay};
    \draw[thick,domain=0.85:3.8,samples=40] plot (\x,{0.5+0.35/(\x-0.7)});
    \draw[thick,dashed] (0.4,2.4) -- (3.8,0.7);
    \draw[dotted] (0.7,0) -- (0.7,3.2);
    \node[below,font=\scriptsize] at (0.7,0) {$V_{TH3}$};
    \node[font=\scriptsize,anchor=west] at (1.4,2.6) {$M_3$ only};
    \node[font=\scriptsize,anchor=west] at (2.2,1.55) {with $M_4$ (dashed)};
  \end{scope}
\end{circuitikz}
\end{document}
```

- **$V_{cont}$** comes from a resistor-ladder DAC between $V_{DD}/4$ and $3V_{DD}/4$, driven by the calibration register: monotonic, and 100 steps need 100 segments but none of the aF inaccuracy (Wei and Razavi, ref. [8]).
- **Digital version:** split $M_3$ into $K$ thermometer-coded units in parallel with $M_4$; the degeneration runs from $R_{on4}$ to $R_{on4}\parallel(R_u/K)$. Because the minimum unit width (≈120 nm in 28 nm) makes the sum of units far wider than $M_4$, the delay saturates at high codes. Fix: longer units, or **taper** the unit lengths (weakest first) so later codes switch in stronger devices.
- **Coarse plus fine:** a 3-bit binary capacitor array for coarse steps and only $100/8\approx12$ starved-inverter units for fine. Calibration sets the coarse array first, then the fine.

```tikz title="If the coarse step exceeds the fine array's span, delays between Delta T_1 and Delta T_2 are unreachable (dead zone, left). If it is smaller, the curve is nonmonotonic (right): every delay is reachable, which is preferable, but a feedback loop sees its slope flip at D_0. After Razavi (Data Converters) Fig. 20.48."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \xo/\step/\lab in {0/1.2/{$\Delta_c>8\Delta_f$: dead zone},6.4/0.6/{$\Delta_c<8\Delta_f$: nonmonotonic}} {
    \begin{scope}[xshift=\xo cm]
      \draw[->] (0,0) -- (5.2,0) node[right,font=\scriptsize]{code};
      \draw[->] (0,0) -- (0,3.6) node[above,font=\scriptsize]{delay};
      \foreach \s in {0,1,2} {
        \pgfmathsetmacro{\x}{0.2+1.6*\s}
        \pgfmathsetmacro{\y}{0.3+\step*\s}
        \draw[thick] (\x,\y) -- (\x+1.6,\y+0.9);
      }
      \node[font=\scriptsize] at (2.6,-0.45) {\lab};
    \end{scope}
  }
  \fill[gray,opacity=0.3] (0,1.2) rectangle (5.0,1.5);
  \node[font=\scriptsize,anchor=west] at (0.1,1.75) {dead zone};
  \draw[->] (8.15,1.75) -- (8.15,1.05);
  \node[font=\scriptsize] at (8.15,2.05) {$D_0$};
\end{circuitikz}
\end{document}
```

- Prefer the overlap ($\Delta_c<8\Delta_f$). Use a search, not a free-running loop, for the initial setting: start at code 0, step one fine LSB at a time, stop when $D_{\Delta T}$ changes sign. In background tracking, keep the code a few LSB away from the fold point $D_0$, where incrementing would reduce the delay and flip the feedback polarity (Ex. 20.21).

## Level 4: Clock Generation

### Divide by Two for Quadrature Phases

```tikz title="Two latches in a negative-feedback loop divide CK by 2: X_1, Y_1 change on CK rising edges (I), X_2, Y_2 on falling edges (Q). ANDing pairs gives four nonoverlapping 25% phases. CK runs at f_S/2. After Razavi (Data Converters) Figs. 20.49(b), 20.52."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \def\h{0.4}
  \newcommand{\wave}[3]{\node[left,font=\scriptsize] at (0,#1+0.2) {#2}; \draw[thick] plot coordinates {#3};}
  \wave{6.0}{$CK$}{(0,6.0) (0,6.4) (1,6.4) (1,6.0) (2,6.0) (2,6.4) (3,6.4) (3,6.0) (4,6.0) (4,6.4) (5,6.4) (5,6.0) (6,6.0) (6,6.4) (7,6.4) (7,6.0) (8,6.0)}
  \wave{5.2}{$X_1$}{(0,5.6) (2,5.6) (2,5.2) (4,5.2) (4,5.6) (6,5.6) (6,5.2) (8,5.2)}
  \wave{4.4}{$X_2$}{(0,4.4) (1,4.4) (1,4.8) (3,4.8) (3,4.4) (5,4.4) (5,4.8) (7,4.8) (7,4.4) (8,4.4)}
  \wave{3.2}{$\phi_1=X_1X_2$}{(0,3.2) (1,3.2) (1,3.6) (2,3.6) (2,3.2) (5,3.2) (5,3.6) (6,3.6) (6,3.2) (8,3.2)}
  \wave{2.4}{$\phi_2=Y_1X_2$}{(0,2.4) (2,2.4) (2,2.8) (3,2.8) (3,2.4) (6,2.4) (6,2.8) (7,2.8) (7,2.4) (8,2.4)}
  \wave{1.6}{$\phi_3=Y_1Y_2$}{(0,1.6) (3,1.6) (3,2.0) (4,2.0) (4,1.6) (7,1.6) (7,2.0) (8,2.0)}
  \wave{0.8}{$\phi_4=X_1Y_2$}{(0,1.2) (1,1.2) (1,0.8) (4,0.8) (4,1.2) (5,1.2) (5,0.8) (8,0.8)}
  \foreach \x in {1,2,3,4} \draw[dotted,gray] (\x,0.6) -- (\x,6.6);
  \node[font=\scriptsize,anchor=west] at (8.3,5.2) {I};
  \node[font=\scriptsize,anchor=west] at (8.3,4.4) {Q};
  \node[font=\scriptsize,anchor=west] at (8.3,2.2) {25\% duty, nonoverlapping};
\end{circuitikz}
\end{document}
```

- **Overlapping phases** come straight from the divider: $X_1,Y_1,X_2,Y_2$ (I, $\bar I$, Q, $\bar Q$) are four 50% phases a quarter-period apart.
- **Nonoverlapping phases:** $X_1X_2$, $Y_1X_2$, $Y_1Y_2$, $X_1Y_2$, each high for 25% of the period.
- **Eight channels:** a chain of $\div2$ stages (each with I and Q outputs) gives $I_1,Q_1,I_2,Q_2,I_3,Q_3$; NOR-ing $CK$, $I_1$, $I_2$ gives one 12.5% phase, and similar NORs give the other seven (Fig. 20.56).
- **Duty cycle of $CK$** matters: a non-50% input clock moves the Q edges and becomes skew (Probs. 20.18, 20.20).

> [!tip] Remark
> These are the same latch dividers used in PLL feedback paths ([[Phased-Locked Loops#The divider]]). Here they generate phases, not a frequency.

### Latch Design: C²MOS and the Keeper Ratio

- Up to about 30 GHz in 28 nm, **clocked CMOS (C²MOS)** latches work: $D_{in}$ passes when $CK$ is high and is stored on node $N$'s capacitance when $CK$ is low. A single C²MOS latch is **unratioed** (works for any N/P strength ratio) but does not produce complementary outputs.
- Two C²MOS latches cross-coupled by inverters $Inv_1$, $Inv_2$ give differential outputs, but now the logic is **ratioed**: the main stack must overpower the keeper inverters to flip the state. Rule (Ex. 20.22): **keeper inverter widths ≈ 25% of the main branch.**
- Because only one of $M_1$, $M_2$ conducts at a time, the clocked nodes $A,A'$ and $B,B'$ can be merged, halving the clocked devices from four to two (ref. [10]).
- Single C²MOS also suffers charge sharing between $N$ and $A$/$B$ (mild in a $\div2$) and leakage corrupting the stored value below about 1 GHz.

### Retiming with the Input Clock

```tikz title="Retiming: making the input clock (inverted) a third input of each AND gate sets the falling (sampling) edge of phi_1 by a CK rising edge, so the divider's jitter and mismatch in X_1, X_2 drop out. After Razavi (Data Converters) Fig. 20.54."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw (0,0) node[and port,number inputs=3](G){};
  \draw (G.in 1) -- ++(-0.5,0) node[left,font=\scriptsize]{$\overline{CK}$};
  \draw (G.in 2) -- ++(-0.5,0) node[left,font=\scriptsize]{$X_1$};
  \draw (G.in 3) -- ++(-0.5,0) node[left,font=\scriptsize]{$X_2$};
  \draw (G.out) -- ++(0.4,0) node[right,font=\scriptsize]{$\phi_1$};
  \begin{scope}[xshift=3.2cm,yshift=-1.4cm]
    \node[left,font=\scriptsize] at (0,2.6) {$CK$};
    \draw[thick] plot coordinates {(0,2.4) (0.5,2.4) (0.5,2.8) (1.5,2.8) (1.5,2.4) (2.5,2.4) (2.5,2.8) (3.5,2.8) (3.5,2.4) (4.5,2.4) (4.5,2.8) (5.5,2.8) (5.5,2.4) (6,2.4)};
    \node[left,font=\scriptsize] at (0,1.8) {$X_1$};
    \draw[thick] plot coordinates {(0,1.6) (0.8,1.6) (0.8,2.0) (2.8,2.0) (2.8,1.6) (4.8,1.6) (4.8,2.0) (6,2.0)};
    \node[left,font=\scriptsize] at (0,1.0) {$X_2$};
    \draw[thick] plot coordinates {(0,0.8) (1.8,0.8) (1.8,1.2) (3.8,1.2) (3.8,0.8) (5.8,0.8) (5.8,1.2) (6,1.2)};
    \node[left,font=\scriptsize] at (0,0.2) {$\phi_1$};
    \draw[thick] plot coordinates {(0,0) (1.8,0) (1.8,0.4) (2.5,0.4) (2.5,0) (5.8,0) (5.8,0.4) (6,0.4)};
    \draw[dotted] (2.5,-0.2) -- (2.5,2.9);
    \node[font=\scriptsize,anchor=west] at (2.6,-0.25) {sampling edge = $CK$ rising edge};
    \draw[<->] (0.5,2.95) -- (0.8,2.95) node[midway,above,font=\tiny]{div. delay};
  \end{scope}
\end{circuitikz}
\end{document}
```

- With $\overline{CK}$ as the third AND input, $\phi_1$ can only stay high until the next $CK$ rising edge, so its falling edge (the sampling instant) is a $CK$ edge, free of the divider's jitter and mismatch. Only one clock, $CK$, must be clean.
- **Divider delay helps** (Ex. 20.25): with a divider delay $\Delta T_{div}$, $I_1$ and $I_2$ shift by $\Delta T_{div}$ and $2\Delta T_{div}$, $\phi_1$ does not move, and any jitter on those edges smaller than the shift (one or two $\Delta T_{div}$) never reaches either edge of $\phi_1$.
- **Start-up ambiguity:** at power-up $X_1$ may lead or lag $X_2$ by 90°, so the falling edges are $T_{CK}/4$ or $3T_{CK}/4$ apart and the channel order can scramble. Fix: reset the latches, or detect the phase sequence and reorder the outputs.

### Floor Plan

```tikz title="Linear floor plan (left): the clock reaches the outer channels later. Quadrant floor plan (right): the four clock phases are symmetric, but now the input must be distributed from the centre to stay matched. After Razavi (Data Converters) Fig. 20.53."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \tikzset{blk/.style={draw,thick,minimum width=1.3cm,minimum height=0.7cm,align=center,fill=gray!8,font=\scriptsize}}
  \node[blk,minimum width=2.0cm] (cg) at (3.0,2.0) {clock gen.};
  \foreach \k in {1,...,4} { \node[blk] (c\k) at ({1.5*\k-0.75},0) {Ch \k}; \draw[->] (cg.south) -- (c\k.north); }
  \node[font=\scriptsize] at (3.0,-1.0) {$V_{in}$ bus along the row};
  \draw (0,-0.6) -- (6,-0.6);
  \node[font=\scriptsize] at (3.0,-1.6) {(a) clock paths to Ch 1, 4 longer};
  \begin{scope}[xshift=8.6cm,yshift=0.2cm]
    \node[blk] (q1) at (0,1.2) {Ch 1}; \node[blk] (q2) at (2.6,1.2) {Ch 2};
    \node[blk] (q3) at (0,-0.6) {Ch 3}; \node[blk] (q4) at (2.6,-0.6) {Ch 4};
    \node[blk,minimum width=1.0cm,fill=gray!25] (cc) at (1.3,0.3) {CK};
    \foreach \q in {q1,q2,q3,q4} \draw[->] (cc) -- (\q);
    \node[font=\scriptsize] at (1.3,-1.8) {(b) symmetric clocks, $V_{in}$ from centre};
  \end{scope}
\end{circuitikz}
\end{document}
```

Skew is a layout decision before it is a calibration problem. The quadrant plan is preferable if $V_{in}$ is also fed from the centre, but it does not extend directly to eight channels (Ex. 20.23, Prob. 20.19).

> [!tip] Remark
> In a SerDes, an ADC-based receiver uses exactly this structure: an interleaved flash or SAR at the baud rate with 4 to 6 bits, then DSP equalization ([[Equalization]], Harwood 12.5 Gb/s, 4.5 b). Two-way interleaved slicers with per-segment offset correction are the 1-bit version ([[Comparators#Level 7 Thresholds and Slicers]]).

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| ↑ $M$ | Aggregate rate; each channel back on the linear power-speed line; metastability $\propto e^{-MT_1/\tau}$ | Area, input capacitance and routing, more clock phases, more mismatch spurs (offset tone moves into the band at $M=4$) |
| Overlapping clocks | Track time $T_{CK}/2$ instead of $T_S$ | $M/2$ capacitors on the input; charge-sharing crosstalk unless $R_{buf}\ll R_{on}$ |
| Two-rank (full-rate front sampler) | Removes channel skew; only one clean clock | Full-rate buffer linearity/noise/speed; $kT/C$ twice (bigger caps); extra full-rate clock |
| Split input buffer (two phases each) | No interchannel crosstalk | 2× power or 2× $R_{buf}$; buffer-to-buffer mismatch spurs |
| Faster sampler (smaller $\tau$) | Less bandwidth-mismatch skew for the same relative mismatch | Wider switches, more buffer current |
| Lower buffer $R_{out}$ (more $g_m$) | Acquisition, crosstalk, step current | Power: $I_D=g_m/(g_m/I_D)$; larger devices load the input |
| Analog offset correction (CDAC) | Keeps full dynamic range | Extra capacitance; in a SAR, more gain error |
| Digital gain correction | Simple, exact | A full-rate multiplier's power |
| Analog skew correction (VDL) | Low power; exact delay | Range vs LSB (number of steps); differential VDL adds √2 jitter |
| Background calibration | Tracks supply and temperature drift | Needs an input signal; convergence time; full-rate logic (run it every 100 µs) |
| Retime phases with $CK$ | Removes divider jitter and mismatch from sampling edges | One more AND input, and $CK$ must be clean |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Aggregate rate | $f_S=Mf_{CK}$ |
| Channel 2 replicas | $Y_2(f)=\frac{1}{T_{CK}}\sum_nX(f-nf_{CK})e^{-j\pi n}$ |
| Metastability | $P_e=\alpha\exp(-MT_1/\tau_{reg})$ |
| Offset tone, 2 channels | at $f_S/2$, amplitude $(V_{OS1}-V_{OS2})/2$ |
| Offset tone, 4 channels | at $f_S/4$, $\propto\sqrt{(V_{OS1}-V_{OS3})^2+(V_{OS2}-V_{OS4})^2}$ |
| Gain-mismatch SNR | $4/\alpha^2$ |
| Skew error | $\Delta x\approx\Delta T\,dx/dt$ |
| Skew SNR (sine) | $1/(\pi^2\Delta T^2f_{in}^2)$ |
| Skew SNR (random) | $3/(2\pi^2\Delta T^2f_{in}^2)$ |
| Bandwidth mismatch | $\Delta T\approx\Delta\omega/\omega_0^2=\Delta\tau\approx\Delta R\,C_1$ |
| Gain limit | $\alpha\le2\sqrt{(P-1)/\mathrm{SNR}_{ideal}}$, or $2\cdot10^{-\mathrm{SFDR}/20}$ |
| Skew limit | $\Delta T\le\frac{1}{\pi f_{in}}\sqrt{(P-1)/\mathrm{SNR}_{ideal}}$, or $10^{-\mathrm{SFDR}/20}/(\pi f_{in})$ |
| Offset limit | $\lvert\Delta V_{OS}\rvert/2\ll1$ LSB; $\lvert\Delta V_{OS}\rvert\le2A\cdot10^{-\mathrm{SFDR}/20}$ |
| Bandwidth limit | $\Delta\tau\le\Delta T_{budget}$ |
| Charge-sharing error ($R_{on}=0$) | $\Delta V_1=\frac{V_a}{2}(1+e^{-T_{CK}/4\tau_1})e^{-T_{CK}/4\tau_2}$ |
| Overlap condition | $R_{buf}\ll R_{on}$ |
| Unbuffered two-rank | $V_1=V_{in}C_F/(C_F+C_1)$ |
| Two-rank buffer | $\tau_{A_1}\le T_S/[2(N+1)\ln2]$; $A_1=r_{O1}/(r_{O1}+1/g_{m1})$ |
| Buffer impedance | $R_{out}\approx1/g_m\ll R_{on}$, $I_D=g_m/(g_m/I_D)$ |
| Split-buffer skew | $(C_s/g_m)(\Delta g_m/g_m)\le\Delta T_{budget}$; $\sigma(\Delta I)/I=(g_m/I_D)A_{VT}/\sqrt{WL}$ |
| VDL | range $\ge\Delta T_{raw}$ (3σ), LSB $\le\Delta T_{budget}$, steps $=\Delta T_{raw}/\Delta T_{budget}$ |
| Skew detector (sine) | $D_{\Delta T}\propto V_0^2\sin(\omega_0T_{CK}/2)\,\omega_0\Delta T$ |

## References

- **Razavi, *Analysis and Design of Data Converters*, 2025** (PDF page = printed + 19). Ch. 20 Interleaved ADCs, pp. 439–478, read in full:
  - §20.1 General considerations, pp. 439–443 (Figs. 20.1–20.6, Eqs. 20.1–20.5, Ex. 20.1).
  - §20.2 Effect of mismatches, pp. 443–453 (offset Eqs. 20.6–20.9; gain Eqs. 20.10–20.13, Ex. 20.3; phase Eqs. 20.16–20.31, Exs. 20.4–20.6; bandwidth Eqs. 20.32–20.36).
  - §20.3 Charge sharing and interchannel crosstalk, pp. 453–454 (Ex. 20.7).
  - §20.4 Two-rank interleaving and crosstalk reduction, pp. 455–457 (Exs. 20.8; Figs. 20.23–20.26).
  - §20.5 Mismatch calibration, pp. 457–470 (Exs. 20.9–20.21; Figs. 20.27–20.48).
  - §20.6 Clock generation, pp. 471–475 (Exs. 20.22–20.25; Figs. 20.49–20.58).
  - Problems 20.5–20.7, 20.9–20.11, 20.15, 20.18–20.20 (pp. 477–478).
  - Correction noted: Eq. (20.26)'s quantization term must be $\tfrac23 2^{-2N}$, not $\tfrac13 2^{-2N}$, to agree with Eq. (20.27) and the 39 fs result.
- **Carusone, Johns, Martin, *Analog Integrated Circuit Design*, 2nd ed.** (PDF page = printed + 24): §17.9 Time-Interleaved A/D Converters, pp. 687–689 (Figs. 17.39–17.41: architecture, the mismatch spur map up to $f_S/2$, digital offset/gain correction; full-rate front S/H relaxes jitter on the others; bandwidth mismatch as frequency-dependent gain mismatch).
- **Palermo ECEN 720 Lecture 6** (`ref/SerDes/lecture6_ee720_rx_circuits.pdf`): 2-way interleaved receiver with offset correction at the input amplifier and in each segment. The Harwood ADC-receiver paper is not downloaded; its numbers are quoted from [[Equalization]].
- **Zettelkasten** (`AnalogTheory/Interleaved ADCs/`, S25): all notes are drawn from Razavi Ch. 20; used for cross-checking. 25g2 flagged the Eq. (20.26) factor-of-two slip.
