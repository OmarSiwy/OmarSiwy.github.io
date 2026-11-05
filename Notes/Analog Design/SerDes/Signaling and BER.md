---
title: Signaling and BER
description: How bits become levels on a wire (NRZ, PAM4, duobinary), what that does to the spectrum and the eye, and how noise, ISI and the Q-function turn an eye into a bit-error rate and a link budget.
kind: topic
status: growing
aliases:
  - Signaling and BER
  - BER
  - PAM4
---

Note S2 of the [[SerDes Learning Path]]. [[Channels]] (S1) explains why each symbol smears into its neighbours (ISI). This note starts at the slicer: which levels you send, how wide a spectrum that takes, how big the eye is, and what bit-error rate (BER) the noise left on top of it gives. Jitter, the dual-Dirac model and StatEye in full belong to [[Link Noise and Jitter]] (S3). This note works the voltage axis. The timing axis only appears in Remark links.

## The big picture

```tikz title="The chapter on one screen: at the same swing, NRZ has one eye and PAM4 three eyes a third as tall. Whatever noise is left at the slicer sets the BER as a Gaussian tail. After Zhang slides 13, 27 and Palermo L9 slide 41."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=2.2cm,y=1cm]
  % ---- NRZ eye: levels +-1.5
  \foreach \p in {-1.5,1.5} { \foreach \q in {-1.5,1.5} {
    \foreach \c in {0,1} {
      \draw[blue!70!black,thick,domain=-0.3:0.3,samples=25] plot ({\c+\x},{(\p+\q)/2+(\q-\p)/2*sin(300*\x)});
    }
    \draw[blue!70!black,thick] (0.3,\p) -- (0.7,\p);
  }}
  \draw[dashed,gray] (-0.35,0) -- (1.35,0);
  \node[left,font=\scriptsize] at (-0.35,0) {threshold};
  \draw[<->,red!70!black] (0.5,-1.5) -- (0.5,1.5) node[pos=0.7,right,font=\scriptsize,fill=white,inner sep=1pt] {EH};
  \node[font=\bfseries] at (0.5,2.2) {NRZ (PAM2)};
  \node[font=\scriptsize] at (0.5,-2.1) {1 bit/symbol, $f_N=R_b/2$};
  \draw[|<->|] (0,-1.75) -- (1,-1.75) node[midway,fill=white,inner sep=1pt,font=\scriptsize] {1 UI};
  % ---- PAM4 eye
  \begin{scope}[xshift=7.2cm]
  \foreach \p in {-1.5,-0.5,0.5,1.5} { \foreach \q in {-1.5,-0.5,0.5,1.5} {
    \foreach \c in {0,1} {
      \draw[blue!70!black,domain=-0.3:0.3,samples=25] plot ({\c+\x},{(\p+\q)/2+(\q-\p)/2*sin(300*\x)});
    }
  }
  \draw[blue!70!black,thick] (0.3,\p) -- (0.7,\p);
  }
  \foreach \t in {-1,0,1} \draw[dashed,gray] (-0.35,\t) -- (1.35,\t);
  \draw[<->,red!70!black] (0.5,0.5) -- (0.5,1.5) node[midway,right,font=\scriptsize,fill=white,inner sep=1pt] {EH$/3$};
  \foreach \y/\l in {1.5/10,0.5/11,-0.5/01,-1.5/00} \node[right,font=\scriptsize] at (1.35,\y) {\texttt{\l}};
  \node[font=\bfseries] at (0.5,2.2) {PAM4 (same swing)};
  \node[font=\scriptsize] at (0.5,-2.1) {2 bits/symbol, $f_N=R_b/4$, eye $-9.5$ dB};
  \end{scope}
  % ---- Gaussian tail
  \begin{scope}[xshift=14.6cm]
  \draw[->] (0,-1.8) -- (0,1.9) node[above,font=\scriptsize] {$v$};
  \fill[red!40,domain=-1.2:0,samples=40] (0,-1.2) -- plot ({1.0*exp(-((\x-1.5)*(\x-1.5))/1.125)},\x) -- (0,0) -- cycle;
  \draw[thick,domain=-1.2:1.9,samples=60] plot ({1.0*exp(-((\x-1.5)*(\x-1.5))/1.125)},\x);
  \draw[dashed,gray] (-0.1,0) -- (1.3,0) node[right,font=\scriptsize,text=black] {threshold};
  \draw[<->] (1.15,0) -- (1.15,1.5) node[midway,right,font=\scriptsize] {$A$};
  \draw[->,red!70!black] (0.75,-0.9) node[right,font=\scriptsize,align=left] {tail = errors\\$P_e=Q(A/\sigma)$\\$10^{-12}$: $A\approx7\sigma$} -- (0.08,-0.3);
  \node[font=\bfseries] at (0.6,2.6) {noise at the slicer};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Symbols, not bits, set the bandwidth.** $UI = 1/R_{baud}$ and the **Nyquist frequency** is $f_N = R_{baud}/2$: NRZ $R_b/2$, PAM4 $R_b/4$. A random-data spectrum is a $\mathrm{sinc}^2$ with nulls at multiples of $R_{baud}$.
> 2. **More levels shrink the eye.** At fixed peak swing, PAM-$M$ has $M-1$ stacked eyes, each $\tfrac{1}{M-1}$ as tall as NRZ. PAM4 costs $20\log_{10}3 = 9.5$ dB of SNR (more than 11 dB in practice). PAM4 is worth it only when the channel loses more than about 9.5 dB extra between $R_b/4$ and $R_b/2$.
> 3. **BER is a Gaussian tail.** A level a distance $A$ from the threshold with rms noise $\sigma$ gives $P_e = Q(A/\sigma)$. $10^{-12}$ needs $A \approx 7\sigma$. For PAM4, $P_{err} = 1.5\,Q\!\left(V_{pp}/6\sigma_n\right)$.
> 4. **An eye only has a size at a stated BER.** Eye height is read off BER contours (bathtubs). The worst-case (peak-distortion) eye is pessimistic. The statistical eye convolves the ISI and noise distributions.
> 5. **A link budget subtracts everything from the swing.** Loss, residual ISI, crosstalk, offset, supply noise and $\sim14\sigma$ of random noise come out of the transmitted swing, and what is left is the margin. FEC buys back 5 to 8 dB, so 56G PAM4 links are specified at a raw BER of $10^{-6}$ instead of $10^{-12}$ to $10^{-15}$.

**Map:** [[#Level 0 Bits, Symbols and the Unit Interval|NRZ, PAM4, duobinary]] → [[#Level 1 Spectra and the Nyquist Frequency|spectra, Nyquist]] → [[#Level 2 Eye Diagrams|reading eyes]] → [[#Level 3 Noise, the Q-Function and BER|Q-function, BER/SER, NRZ vs PAM4]] → [[#Level 4 Margins at a Target BER|bathtubs, peak-distortion and statistical eyes, budgets, FEC, precoding]] → [[#Level 5 Test Patterns and Transmitter Linearity|PRBS, PAM4 test patterns, RLM]].

## Level 0: Bits, Symbols and the Unit Interval

### NRZ (PAM2)

Two levels, one bit per symbol, the level held for the whole symbol.

$$
\boxed{UI = T_{sym} = \frac{1}{R_{baud}},\qquad R_{baud} = \frac{R_b}{\log_2 M}}
$$

For NRZ ($M=2$) symbol = bit. At $R_b = 56$ Gb/s: $UI = 17.86$ ps and $f_N = 28$ GHz (Zhang slide 13).

### PAM4

Every 2 bits map to one of 4 levels, so $R_{baud} = R_b/2$ (56 Gb/s PAM4 = 28 GBd).

| Level (three naming conventions, Zhang slide 23) | | | Gray code (MSB first) | Linear code |
|---|---|---|---|---|
| $+3$ | $+1$ | 3 | `10` | `11` |
| $+1$ | $+\tfrac13$ | 2 | `11` | `10` |
| $-1$ | $-\tfrac13$ | 1 | `01` | `01` |
| $-3$ | $-1$ | 0 | `00` | `00` |

**Gray coding** is used by every PAM4 standard: adjacent levels differ in one bit, so the common error (a slip to the next level) costs one bit, not two. Grounding the LSB leaves only `10` and `00`, the outer levels, which is NRZ: one transmitter does both modes.

**Chain:** bits → Gray coding → PAM4 encoding → channel → PAM4 decoding (3 slicers) → inverse Gray → bits (Zhang slide 24).

> [!tip] Remark
> A PAM4 receiver is a **2-bit flash ADC**: three comparators at the three thresholds give a thermometer code, decoded to MSB/LSB. See [[Flash ADCs]] for thermometer decoding and [[Comparators]] for the slicer. NRZ needs one comparator, PAM4 three (Palermo L4 slide 22).

### Duobinary

Duobinary deliberately adds each bit to the one before it, so the ISI is *known* and part of the code (Lee 2008, Eq. 1–2):

$$
\boxed{w[n] = x[n] + x[n-1],\qquad H_1(z) = 1+z^{-1}}
$$

Two binary inputs sum to **three levels** $\{0,1,2\}$. A low-pass channel already looks like $1+z^{-1}$ (each bit leaks into the next), so the TX pre-emphasis and RX equalizer only have to shape the channel *into* $1+z^{-1}$ instead of into a flat response. The channel loss becomes part of the signal.

```tikz title="Duobinary link: the precoder makes the 3-level output decodable symbol by symbol. After Lee 2008 Figs. 4a and 5 (timing example reproduced)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,minimum height=1.1cm,minimum width=2cm,align=center,fill=white}]
  \node[blk] (pre) at (1.6,0) {precoder\\$\dfrac{1}{1+z^{-1}}$ mod 2};
  \node[blk] (pe) at (5,0) {pre-\\emphasis};
  \node[blk,fill=gray!15] (ch) at (7.6,0) {channel};
  \node[blk] (eq) at (10.2,0) {equalizer};
  \node[blk] (lsb) at (13.6,0) {LSB distiller\\(middle $\to$ 1)};
  \draw[->] (-0.6,0) node[left,align=right,font=\scriptsize] {2-level\\$x[n]$} -- (pre);
  \draw[->] (pre) -- node[above,font=\scriptsize] {$w_1[n]$} (pe);
  \draw[->] (pe) -- (ch); \draw[->] (ch) -- (eq);
  \draw[->] (eq) -- node[above,font=\scriptsize] {$w_2[n]$} node[below,font=\scriptsize] {3-level} (lsb);
  \draw[->] (lsb) -- (15.6,0) node[right,font=\scriptsize] {$y[n]=x[n]$};
  \draw[decorate,decoration={brace,amplitude=6pt,mirror}] (4,-0.8) -- (11.2,-0.8) node[midway,below=7pt,font=\scriptsize] {together shaped into $H_1(z)=1+z^{-1}$ (the channel's own roll-off does most of it)};
  % timing table
  \begin{scope}[yshift=-1.7cm]
  \foreach \lab/\vals [count=\r] in {{$x[n]$}/{0,1,0,1,1,1,0},{$w_1[n]$}/{0,1,1,0,1,0,0},{$w_2[n]$}/{0,1,2,1,1,1,0},{$y[n]$}/{0,1,0,1,1,1,0}} {
    \node[anchor=east,font=\scriptsize] at (4.6,-0.45*\r) {\lab};
    \foreach \v [count=\c] in \vals \node[font=\scriptsize] at (4.6+0.8*\c,-0.45*\r) {\v};
  }
  \node[anchor=west,font=\scriptsize,align=left] at (10.8,-1.1) {$w_1[n]=x[n]\oplus w_1[n-1]$\\$w_2[n]=w_1[n]+w_1[n-1]$\\$y[n]=w_2[n]\bmod 2$};
  \end{scope}
\end{circuitikz}
\end{document}
```

The **precoder** $1/(1+z^{-1})$ mod 2 (an XOR with the previous output) makes the decoder memoryless: after the channel adds $w_1[n]+w_1[n-1]$, taking the result mod 2 returns $x[n]$. So the receiver just asks "is this the middle level?" (middle = 1, outer = 0), the **LSB distiller**.

> [!note]- Detail: why the precoder makes decoding memoryless, and Lee's skew-tolerant version
> Precoder: $w_1[n] = x[n] \oplus w_1[n-1]$. Channel + EQ: $w_2[n] = w_1[n] + w_1[n-1]$. Mod 2, $w_2[n] \equiv w_1[n]\oplus w_1[n-1] = x[n]$. A middle level ($w_2 = 1$) means $x=1$; either outer level (0 or 2) means $x=0$. A wrong decision does not propagate, because each output depends on one received sample only.
>
> The XOR-plus-flip-flop loop needs XOR delay + clock-to-Q $= T_b$ exactly, which leaves no clock phase margin at 20 Gb/s (Lee 2008 Eq. 5, Fig. 7a). Lee replaces it with an AND gate (data AND clock) driving a ÷2: the output toggles on each data ONE, which is the same function with the loop broken. Clock skew margin becomes 180°, and the initial state of the divider does not matter because the opposite polarity decodes to the same data (Lee 2008 Eq. 6, Fig. 7b).

> [!tip] Remark
> The PAM4 $1/(1+D)$ mod 4 precoder in [[#Precoding Against DFE Burst Errors]] is the multilevel version of this same precoder (Zhang slide 69).

## Level 1: Spectra and the Nyquist Frequency

### PSD of Random Data

Random, independent, equiprobable symbols of amplitude $\pm a$ and duration $T$ give the shape of one rectangular pulse, squared:

$$
\boxed{S_x(f) = a^2\,T\,\mathrm{sinc}^2(fT),\qquad \mathrm{sinc}(u) = \frac{\sin \pi u}{\pi u}}
$$

The nulls sit at $f = k/T = k\,R_{baud}$ (Zhang slide 13). PAM4 at the same bit rate has $T = 2T_b$, so its spectrum is **half as wide** (Zhang slide 26, Palermo L4 slide 19). Duobinary is the NRZ spectrum times $|H_1|^2 = \cos^2(\pi f T_b)$, which works out to the same half-width shape (Lee 2008 Eq. 3–4):

$$
S_W(f) = \cos^2(\pi f T_b)\,T_b\,\mathrm{sinc}^2(fT_b) = T_b\,\mathrm{sinc}^2(2fT_b)
$$

```tikz title="PSD of random data, normalized to DC. PAM4 and duobinary have half the NRZ width at the same bit rate. After Zhang slides 13, 26 and Lee 2008 Fig. 2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=4cm,y=4cm]
  \draw[->] (0,0) -- (3.15,0) node[right] {$f\,T_b$};
  \draw[->] (0,0) -- (0,1.12) node[above] {$S(f)/S(0)$};
  \foreach \t in {0.5,1,1.5,2,2.5,3} \draw (\t,0) -- (\t,-0.03) node[below,font=\scriptsize] {\t};
  \foreach \t in {0.5,1} \draw (0,\t) -- (-0.03,\t) node[left,font=\scriptsize] {\t};
  \draw[blue!70!black,thick,domain=0.001:3,samples=200] plot (\x,{(sin(180*\x)/(3.14159*\x))^2});
  \draw[red!75!black,thick,domain=0.001:3,samples=250] plot (\x,{(sin(360*\x)/(6.28318*\x))^2});
  \draw[dashed,red!75!black] (0.25,0) -- (0.25,1.0);
  \draw[dashed,blue!70!black] (0.5,0) -- (0.5,1.0);
  \node[red!75!black,font=\scriptsize,align=center] at (0.25,1.07) {$f_N$ PAM4\\$1/4T_b$};
  \node[blue!70!black,font=\scriptsize,align=center] at (0.62,1.07) {$f_N$ NRZ\\$1/2T_b$};
  \node[blue!70!black,font=\scriptsize,anchor=west] at (1.05,0.55) {NRZ: $\mathrm{sinc}^2(fT_b)$, nulls at $k/T_b$};
  \node[red!75!black,font=\scriptsize,anchor=west,align=left] at (1.05,0.4) {PAM4 and duobinary: $\mathrm{sinc}^2(2fT_b)$,\\nulls at $k/2T_b$ (half the width)};
  \node[font=\scriptsize,anchor=west,align=left] at (1.05,0.22) {$\approx 90\%$ of the power sits in the main lobe (Lee 2008)};
\end{circuitikz}
\end{document}
```

> [!tip] Remark
> PSD is the same object as in [[Noise#Power Spectral Density]]: power per hertz, and the area under it is the mean-square value. A random data stream is a random signal like any noise source.

> [!note]- Derivation: the $\mathrm{sinc}^2$ spectrum of random NRZ
> Write the signal as $x(t) = \sum_k a_k\,p(t-kT)$ with $p$ a unit rectangle of width $T$ and $a_k$ independent, zero-mean, $E[a_k^2] = a^2$. For uncorrelated symbols the PSD of a pulse train is $S_x(f) = \frac{E[a_k^2]}{T}|P(f)|^2$. With $P(f) = T\,\mathrm{sinc}(fT)\,e^{-j\pi fT}$, $S_x(f) = a^2 T\,\mathrm{sinc}^2(fT)$.
>
> For PAM4, the symbols are $\{\pm1,\pm3\}\cdot h$, so $E[a_k^2] = 5h^2$, and $T = 2T_b$: same shape, first null at $1/(2T_b) = R_b/2$. For duobinary, $w = \tfrac12(x[n]+x[n-1])$ is $x$ through $H_1(f) = \tfrac12(1+e^{-j2\pi fT_b})$, with $|H_1|^2 = \cos^2(\pi fT_b)$. Then $\cos^2(\pi f T_b)\,\mathrm{sinc}^2(fT_b) = \sin^2(2\pi fT_b)/(2\pi f T_b)^2 = \mathrm{sinc}^2(2fT_b)$. Lee includes the $\tfrac12$ as a scale factor (Lee 2008 Eq. 2–4, Fig. 2).

### Nyquist Frequency

The minimum bandwidth that can carry $R_s$ symbols/s without ISI is $R_s/2$ (ideal sinc pulses): at most 2 symbols/s/Hz (Palermo L4 slide 20).

$$
\boxed{f_N = \frac{R_{baud}}{2}:\quad \text{NRZ } \frac{1}{2T_b},\quad \text{PAM4 } \frac{1}{4T_b}}
$$

At 56 Gb/s: NRZ 28 GHz, PAM4 14 GHz (Zhang slide 26; Lee 2015 Sec. II). The channel's loss **at $f_N$** is the number every SerDes paper quotes, because that is the frequency the equalizer must lift (see [[Channels]]).

| Format | Bits/symbol | Levels | Eyes | $f_N$ | Eye height vs NRZ (same swing) |
|---|---|---|---|---|---|
| NRZ (PAM2) | 1 | 2 | 1 | $1/(2T_b)$ | 1 (0 dB) |
| Duobinary | 1 | 3 | 2 | $1/(3T_b)$ (Lee's convention, see Remark) | $\tfrac12$ ($-6$ dB) |
| PAM4 | 2 | 4 | 3 | $1/(4T_b)$ | $\tfrac13$ ($-9.5$ dB) |

> [!tip] Remark
> Lee 2008 (footnote 1) gives the duobinary "Nyquist frequency" as $1/(3T_b)$ even though its first spectral null is at $1/(2T_b)$, like PAM4. It is a convention for where to quote equalizer boost, not a null. The duobinary eye height ($\tfrac12$: three levels in the same swing) follows from the PAM-$M$ rule in [[#The Eye-Height Penalty]]; Lee does not quote it.

**The brick-wall experiment** (Lee 2008 Fig. 3): pass 20 Gb/s data through an ideal low-pass at $1/(2T_b)$. NRZ loses 51.4% of its power and the eye shows 81.8% ISI and 0.8 UI of jitter. Duobinary loses 10% and is almost unaffected, because about 90% of a sinc's power is in its main lobe.

## Level 2: Eye Diagrams

### Reading an NRZ Eye

An eye diagram overlays every UI-long slice of the received waveform (usually 2 UI wide) on one screen, triggered by the clock. Each trace is one bit pattern. How the eye is *built* from the pulse response is in [[Channels]]. This section is how to *read* it.

```tikz title="Reading an NRZ eye: the inner rails set EH, the innermost crossings set EW. After Zhang slide 13 and Palermo L9 slide 30."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=5cm,y=1.4cm]
  \foreach \p in {-1.5,-1.15,1.15,1.5} { \foreach \q in {-1.5,-1.15,1.15,1.5} { \foreach \s in {-0.05,0,0.05} {
    \foreach \c in {0,1} {
      \draw[blue!70!black,domain=-0.3:0.3,samples=25] plot ({\c+\s+\x},{(\p+\q)/2+(\q-\p)/2*sin(300*\x)});
    }
  }}
  \draw[blue!70!black] (0.25,\p) -- (0.75,\p);
  }
  \draw[dashed,gray] (-0.38,0) -- (1.38,0) node[right,font=\scriptsize,text=black] {threshold};
  % EH
  \draw[<->,red!75!black,thick] (0.5,-1.15) -- (0.5,1.15);
  \node[red!75!black,fill=white,inner sep=1pt,font=\scriptsize] at (0.58,0.55) {EH};
  % EW
  \draw[<->,red!75!black,thick] (0.075,0) -- (0.925,0);
  \node[red!75!black,fill=white,inner sep=1pt,font=\scriptsize] at (0.3,0.15) {EW};
  \fill[black] (0.5,0) circle (0.04cm and 0.02cm);
  \draw[->] (0.6,-0.45) node[right,font=\scriptsize] {sample here} -- (0.51,-0.05);
  % rail thickness
  \draw[decorate,decoration={brace,amplitude=4pt}] (1.4,1.5) -- (1.4,1.15) node[midway,right=5pt,font=\scriptsize,align=left] {rail thickness:\\ISI (bands) + noise (blur)};
  % crossing spread
  \draw[decorate,decoration={brace,amplitude=4pt,mirror}] (-0.08,-1.75) -- (0.08,-1.75) node[midway,below=5pt,font=\scriptsize,align=center] {crossing spread\\= jitter};
  \draw[|<->|] (0,1.85) -- (1,1.85) node[midway,fill=white,inner sep=1pt,font=\scriptsize] {1 UI};
  \draw[->] (-0.33,0.9) node[left,font=\scriptsize,align=right] {edge slope:\\rise time} -- (-0.13,0.6);
\end{circuitikz}
\end{document}
```

| Feature | What it tells you |
|---|---|
| **Eye height (EH)** | Vertical opening at the sampling instant. Voltage margin left for noise and offset. |
| **Eye width (EW)** | Horizontal opening at the threshold. Timing margin left for clock jitter and phase error. |
| Thickness of the top/bottom rails | ISI (discrete bands, one per pattern) plus random noise (blur) |
| Spread of the crossing | Jitter (its RJ/DJ parts: [[Link Noise and Jitter]]) |
| Slope at the crossing | Rise time. A slow edge turns amplitude noise into timing jitter. |
| Best sampling point | Centre of the largest opening, where a CDR should put the clock |

Both EH and EW must be quoted **at a BER**: random noise and jitter are unbounded, so a longer capture always gives a smaller eye (Palermo L9 slide 30; Agilent p. 8). EH6/EW6, for example, are the openings across the $10^{-6}$ BER contour (Zhang slide 54).

### The PAM4 Eye

```tikz title="PAM4 eye with Gray labels and the three data slicers. Transitions between non-adjacent levels cross D_H and D_L late, which is why EW is only 1/2 to 2/3 UI. After Zhang slides 23, 28, 32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=5cm,y=1.4cm]
  \foreach \p in {-1.5,-0.5,0.5,1.5} { \foreach \q in {-1.5,-0.5,0.5,1.5} {
    \foreach \c in {0,1} {
      \draw[blue!70!black,domain=-0.3:0.3,samples=30] plot ({\c+\x},{(\p+\q)/2+(\q-\p)/2*sin(300*\x)});
    }
  }
  \draw[blue!70!black,thick] (0.3,\p) -- (0.7,\p);
  }
  \foreach \t/\n in {1/D_H\ (+2h_0),0/D_Z\ (0),-1/D_L\ (-2h_0)} {
    \draw[dashed,gray] (-0.35,\t) -- (1.35,\t);
    \node[left,font=\scriptsize] at (-0.35,\t) {$\n$};
  }
  \foreach \y/\l/\v in {1.5/10/+3h_0,0.5/11/+h_0,-0.5/01/-h_0,-1.5/00/-3h_0} \node[right,font=\scriptsize] at (1.35,\y) {\texttt{\l}\ \ $\v$};
  \draw[<->,red!75!black,thick] (0.5,-0.5) -- (0.5,0.5);
  \node[red!75!black,fill=white,inner sep=1pt,font=\scriptsize] at (0.57,0.22) {$2h_0$};
  \draw[<->,red!75!black,thick] (0.139,1) -- (0.861,1);
  \node[red!75!black,fill=white,inner sep=1pt,font=\scriptsize] at (0.5,1.18) {EW (top eye)};
  \draw[<->,red!75!black] (0.075,0) -- (0.925,0);
  \draw[|<->|] (0,-2.05) -- (1,-2.05) node[midway,fill=white,inner sep=1pt,font=\scriptsize] {1 UI $=2T_b$};
\end{circuitikz}
\end{document}
```

- **Three stacked eyes**, each $\tfrac13$ of the NRZ height at the same swing (Zhang slide 27).
- **Thresholds** sit midway between levels. With levels $\pm h_0,\pm3h_0$ the data slicers are at $D_H = 2h_0$, $D_Z = 0$, $D_L = -2h_0$. Zhang suggests adapting each threshold separately rather than assuming $3{:}2{:}1$ spacing, because the real levels are rarely linear (slide 32).
- **Width is only $\tfrac12$ to $\tfrac23$ UI**, not double the NRZ width. Transitions between non-adjacent levels (e.g. $-3\to+3$) cross a sub-eye's threshold at a different time than adjacent ones, which narrows every eye (slide 28).
- **The top and bottom eyes are asymmetric.** The widest point is not at the tallest point: in Zhang's example the middle eye has EW $\approx 60\%$ UI, the outer eyes $\approx 48\%$ at their maximum height (slide 29).
- **Far more trace combinations.** Three consecutive symbols give 8 traces for NRZ but 64 for PAM4. Only 40 of the 64 are "NRZ-like" (slide 33).
- **More transitions.** 12 of the 16 symbol pairs change level, so the transition density is 75% vs 50% for NRZ (slide 44). More edges help the CDR, but most of them are multi-level crossings that blur the edge.

> [!tip] Remark
> The narrower, asymmetric PAM4 eye is why PAM4 CDRs either pick out specific transitions or use baud-rate phase detectors such as Mueller–Müller. See [[Clocking and CDR]].

### The Duobinary Eye

Three levels give two stacked eyes. Measured over 40 cm of Rogers at 20 Gb/s and 1.5 V supply, the far-end duobinary waveform had 200 mV magnitude and a 35 mV opening, against 60 mV and 10 mV for NRZ. Yet the NRZ link still had the better BER, because a binary receiver can amplify without caring about linearity (Lee 2008 Sec. VI, Fig. 29).

## Level 3: Noise, the Q-Function and BER

### One Slicer and One Gaussian

```tikz title="One slicer, two Gaussian levels: the shaded tails past the threshold are the errors. After Palermo L9 slides 41-44."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.6cm,y=3cm]
  \draw[->] (-3.4,0) -- (3.6,0) node[right] {$v$ at the slicer};
  \fill[red!40,domain=0:1.6,samples=40] (0,0) -- plot (\x,{exp(-((\x+1.5)*(\x+1.5))/0.72)}) -- (1.6,0) -- cycle;
  \fill[red!40,domain=-1.6:0,samples=40] (-1.6,0) -- plot (\x,{exp(-((\x-1.5)*(\x-1.5))/0.72)}) -- (0,0) -- cycle;
  \draw[thick,blue!70!black,domain=-3.3:1.6,samples=80] plot (\x,{exp(-((\x+1.5)*(\x+1.5))/0.72)});
  \draw[thick,blue!70!black,domain=-1.6:3.3,samples=80] plot (\x,{exp(-((\x-1.5)*(\x-1.5))/0.72)});
  \draw[dashed] (0,-0.05) -- (0,1.15) node[above,font=\scriptsize] {threshold};
  \node[below,font=\scriptsize] at (-1.5,0) {$-A$ (sent 0)};
  \node[below,font=\scriptsize] at (1.5,0) {$+A$ (sent 1)};
  \draw[<->] (0,1.05) -- (1.5,1.05) node[midway,above,font=\scriptsize] {$A$};
  \draw[<->] (1.5,0.607) -- (2.1,0.607) node[right,font=\scriptsize] {$\sigma$};
  \draw[->,red!70!black] (-1.2,0.55) node[left,font=\scriptsize,align=right] {``1'' read as ``0'':\\area $=Q(A/\sigma)$} -- (-0.25,0.1);
\end{circuitikz}
\end{document}
```

Send $\pm A$ about a threshold at 0 with additive Gaussian noise of rms $\sigma$. A bit is wrong when the noise crosses the threshold, and both symbols have the same tail, so

$$
\boxed{\mathrm{BER} = Q\!\left(\frac{A}{\sigma}\right),\qquad Q(x) = \int_x^\infty \frac{e^{-u^2/2}}{\sqrt{2\pi}}\,du = \frac12\,\mathrm{erfc}\!\left(\frac{x}{\sqrt2}\right)}
$$

$A$ is half the eye opening and $\sigma$ the total rms noise at the slicer input.

| Target BER | $x = A/\sigma$ | $20\log_{10}x$ | Peak-to-peak eye needed |
|---|---|---|---|
| $10^{-3}$ | 3.09 | 9.8 dB | $6.2\sigma$ |
| $10^{-6}$ | 4.75 | 13.5 dB | $9.5\sigma$ |
| $10^{-9}$ | 6.00 | 15.6 dB | $12.0\sigma$ |
| $10^{-12}$ | **7.03** | 16.9 dB | $14.1\sigma$ |
| $10^{-15}$ | 7.94 | 18.0 dB | $15.9\sigma$ |

The rule to remember: **about $7\sigma$ for $10^{-12}$, and the peak-to-peak opening is twice that** (Palermo L9 slide 44). Each extra decade of BER costs only about $0.3$ to $0.5\sigma$ at these levels, because the tail falls like $e^{-x^2/2}$.

> [!tip] Remark
> $\sigma$ is the rms of [[Noise#Average Power and rms]], where thermal noise is shown to be Gaussian by the central-limit theorem. For a zero-mean source, $\sigma = v_{n,rms}$, so the input-referred noise of the receiver front end converts directly into a BER.

> [!note]- Derivation: from the Gaussian PDF to $Q$, and a quick upper bound
> Noise PDF: $P_n(x) = \frac{1}{\sqrt{2\pi}\sigma}e^{-(x-\mu)^2/2\sigma^2}$ (Palermo L9 slide 40). The CDF of a unit normal is $\Phi(x) = \tfrac12[1+\mathrm{erf}(x/\sqrt2)]$, so the probability of exceeding $x$ is $Q(x) = 1-\Phi(x) = \tfrac12\mathrm{erfc}(x/\sqrt2)$ (slide 43). For a "1" sent at $+A$, an error needs noise below $-A$: probability $Q(A/\sigma)$. A "0" has the same, and with equal priors $\mathrm{BER} = \tfrac12 Q + \tfrac12 Q = Q(A/\sigma)$.
>
> Conservative bound (Dally, via Palermo slide 44): $Q(x) \le \tfrac12 e^{-x^2/2}$. It overestimates BER by less than a decade near $x = 7$, so it is safe for hand budgets.
>
> The table values come from solving $Q(x) = \mathrm{BER}$ numerically. With an offset $V_{os}$ the two tails become $\tfrac12 Q\!\left(\frac{A-V_{os}}{\sigma}\right)+\tfrac12 Q\!\left(\frac{A+V_{os}}{\sigma}\right)$, dominated by the first, which is why offset is subtracted from $A$ in a budget.

### PAM4: SER and BER

With four equiprobable levels and only adjacent-level errors, the two inner levels can err in two directions and the two outer levels in one (Lee 2015 Eq. 1):

$$
\boxed{P_{err} = \frac{1+2+2+1}{4}\,Q\!\left(\frac{V_{pp}}{6\sigma_n}\right) = 1.5\,Q\!\left(\frac{V_{pp}}{6\sigma_n}\right)}
$$

$V_{pp}$ is the full swing of the four levels, so $V_{pp}/6 = h_0$ is the distance from each level to its nearest threshold. $P_{err} < 10^{-12}$ needs $V_{pp}/(6\sigma_n) > 7.1$, i.e. **17 dB eye SNR** (Lee 2015 Sec. III-A).

This is a **symbol** error rate. With Gray coding one symbol error is one bit error out of two bits sent, so (Zhang slides 67–68):

$$
\boxed{\mathrm{BER} \approx d_{avg}\,\frac{\mathrm{SER}}{\log_2 M},\qquad d_{avg} = 1 \text{ (Gray)},\quad 2-\frac{\log_2 M}{M-1} \text{ (linear)}}
$$

For Gray PAM4: $\mathrm{BER} = \frac{M-1}{2M}\mathrm{erfc}\!\left(\frac{h_0}{\sqrt2\sigma}\right) = \frac38\,\mathrm{erfc}\!\left(\frac{h_0}{\sqrt2\sigma}\right) = 0.75\,Q(h_0/\sigma)$, which is Lee's $1.5Q$ divided by 2 bits/symbol.

> [!tip] Remark
> Lee's $1.5Q$, Zhang's $\tfrac38\mathrm{erfc}$, and NRZ's $Q$ are one formula: $\mathrm{SER} = \frac{2(M-1)}{M}Q(h_0/\sigma)$, with $M=2$ giving NRZ. The prefactor barely matters ($1.5\times$ moves the required $x$ from 7.03 to 7.09). **The level spacing $h_0$ is what costs you.**

> [!note]- Derivation: general PAM-$M$ symbol error rate
> Zhang slide 67: $\mathrm{SER} = \frac1M\sum_i\sum_{j\ne i}P_{ij}$, with $P_{ij}$ the probability of deciding $j$ when $i$ was sent. Keep only adjacent errors (the far ones are many $\sigma$ further). Each of the $M-2$ inner levels has two neighbours, each of the 2 outer levels one: $\sum = [2(M-2)+2]\,Q(h_0/\sigma) = 2(M-1)\,Q(h_0/\sigma)$. Divide by $M$: $\mathrm{SER} = \frac{2(M-1)}{M}Q(h_0/\sigma)$. $M=4$ gives $1.5\,Q$. The BER weights each error by the Hamming distance $d_{ij}$ between labels, $\mathrm{BER} = \frac1M\sum\sum\frac{d_{ij}}{\log_2M}P_{ij}$; Gray makes every adjacent $d_{ij} = 1$.
>
> For ADC/DSP receivers Zhang estimates $\sigma$ from the slicer error: $\sigma^2 = \mathrm{MSE} = \frac1N\sum(x_k-\bar x)^2$ with $\bar x\in\{\pm h_0,\pm3h_0\}$ (slide 68). Above about $10^{-6}$, samples that land across a threshold get assigned to the wrong $\bar x$ and must be handled separately.

### The Eye-Height Penalty

At the same peak swing $\pm a$, PAM-$M$ splits $2a$ into $M-1$ eyes:

$$
\boxed{\frac{EH_{PAM\text{-}M}}{EH_{NRZ}} = \frac{1}{M-1},\qquad \text{PAM4: } 20\log_{10}3 = 9.54\ \text{dB}}
$$

The **swing** is fixed because the transmitter is peak-power limited (Palermo 2011 §9.3.2), so the levels cannot simply be spread further. In practice, PAM4 level nonlinearity pushes the penalty past **11 dB** (Zhang slide 27). Optical drivers can add another 2 to 3 dB of noise (Lee 2015 Sec. III-A).

PAM4 is also **3× more sensitive to residual ISI**: the same absolute ISI $\sum|c_n|$ is subtracted from a cursor that is a third the size (Palermo L4 slide 25). Without noise, a typical channel closes the PAM4 eye at about 4.5 dB of loss versus about 10 dB for NRZ, so ISI must be held to $\tfrac13$ (Zhang slide 35).

### NRZ or PAM4: the Loss-Slope Rule

```tikz title="The loss-slope rule: compare channel loss at the PAM4 and NRZ Nyquist frequencies. After Lee 2015 Fig. 2."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=1.6cm,y=0.12cm]
  \draw[->] (0,0) -- (6.3,0) node[right] {$f$};
  \draw[->] (0,0) -- (0,-42) node[below] {$|S_{21}|$ (dB)};
  \foreach \d in {-10,-20,-30} \draw (0,\d) -- (-0.08,\d) node[left,font=\scriptsize] {\d};
  \draw[thick,domain=0:6,samples=60] plot (\x,{-1.5*\x-0.75*\x*\x});
  \fill (2,-6) circle (2.5pt); \fill (4,-18) circle (2.5pt);
  \draw[dashed] (2,0) node[above,font=\scriptsize] {$R_b/4$} -- (2,-6) -- (5.2,-6);
  \draw[dashed] (4,0) node[above,font=\scriptsize] {$R_b/2$} -- (4,-18) -- (5.2,-18);
  \draw[<->,red!75!black,thick] (5.1,-6) -- (5.1,-18) node[midway,right,font=\scriptsize] {$P$};
  \node[anchor=west,font=\scriptsize,align=left] at (0.3,-30) {PAM4 Nyquist at $R_b/4$, NRZ Nyquist at $R_b/2$};
  \node[anchor=west,font=\scriptsize,align=left,red!75!black] at (5.5,-10) {$P>9.5$ dB $\Rightarrow$ PAM4\\$P<9.5$ dB $\Rightarrow$ NRZ};
\end{circuitikz}
\end{document}
```

PAM4 runs at half the symbol rate, so its equalizer only has to make up the loss at $R_b/4$, while NRZ must make up the loss at $R_b/2$. PAM4 wins when the extra loss NRZ sees is more than PAM4's eye penalty (Lee 2015 Fig. 2; Palermo L4 slide 21):

$$
\boxed{|S_{21}(R_b/2)|_{dB} - |S_{21}(R_b/4)|_{dB} > 9.5\ \text{dB} \;\Rightarrow\; \text{PAM4, otherwise NRZ}}
$$

| Channel (Palermo L4) | Loss at 2.5 GHz | Loss at 5 GHz | Octave slope | Verdict at 10 Gb/s |
|---|---|---|---|---|
| 7" desktop, no connector | 4.8 dB | 7.5 dB | 2.7 dB | NRZ has more voltage margin (slide 23) |
| 20" T20 server backplane, 2 connectors | 11.1 dB | 26.9 dB | 15.8 dB | PAM4 "might" be better (slide 24) |

> [!note]- Detail: why the 9.5 dB rule is only a first cut
> - **It is optimistic for PAM4.** PAM4 has different ISI and jitter distributions (narrower eye, multi-level crossings), and a nonlinear DFE lets NRZ cancel the first post-cursor without the attenuation that TX equalization costs (Palermo 2011 §9.3.2; Palermo L4 slide 26).
> - **The loss *shape* matters, not just two points.** Zhang's case 1 (smooth channel, NRZ loss about 20 dB) has a difference of about 11 dB, and both formats just meet the same eye mask (same mV and ps): "9.5 dB does not directly apply". Case 2 has a resonant suck-out between $R_b/4$ and $R_b/2$: NRZ sees about 56 dB, the difference is above 30 dB, and only PAM4 opens (slides 30–31).
> - **Other costs.** PAM4 needs 3× the comparators, reference thresholds that depend on loss and TX EQ, a linear front end, and a harder CDR. Its smaller eyes are more sensitive to crosstalk (Palermo L4 slides 22, 26; Lee 2015 Table I). Palermo's rule (2011 chapter) says 10 dB "relative to the previous octave".
> - **Duobinary.** Duobinary needs even less boost than PAM4 because it uses the channel roll-off as part of its response: at 20 Gb/s it needs 2.8 dB less equalization than PAM4 and 8.9 dB less than NRZ over 20 cm of FR4, and 4.0 / 6.8 dB less over 40 cm of Rogers (Lee 2008 Fig. 4b). Still, Lee's NRZ transceiver had the best BER and the lowest power (126 mW vs 195 mW duobinary and 408 mW PAM4), because the binary receiver can use nonlinear gain (Lee 2008 Sec. VI). The PAM4 transceiver also needed a higher supply (1.8 V vs 1.5 V) for its four levels.

## Level 4: Margins at a Target BER

### Bathtub Curves

A BERT sweeps the slicer threshold (vertical bathtub) or the sampling instant (horizontal bathtub) across the eye and plots $\log\mathrm{BER}$. The curve is high at the edges of the eye and falls steeply toward the centre. The voltage version follows directly from the Gaussian picture above:

```tikz title="Vertical (voltage) bathtub for two Gaussian levels at +-A with sigma = A/10: BER vs slicer threshold. The opening at the target BER is the eye height. Drawn with the bound Q(x) <= exp(-x^2/2)/2; after Palermo L9 slides 35-37."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,x=4.5cm,y=0.3cm]
  \draw[->] (-1.15,-16) -- (1.25,-16) node[right] {slicer threshold $V_{th}$};
  \draw[->] (-1.15,-16) -- (-1.15,1.5) node[above] {$\log_{10}\mathrm{BER}$};
  \foreach \d in {0,-3,-6,-9,-12,-15} \draw (-1.15,\d) -- (-1.17,\d) node[left,font=\scriptsize] {$10^{\d}$};
  \foreach \t/\l in {-1/-A,0/0,1/+A} \draw (\t,-16) -- (\t,-16.4) node[below,font=\scriptsize] {$\l$};
  \draw[thick,blue!70!black,domain=0.158:1,samples=60] plot (\x,{-0.602-((1-\x)/0.1)^2/4.605});
  \draw[thick,blue!70!black,domain=-1:-0.158,samples=60] plot (\x,{-0.602-((1+\x)/0.1)^2/4.605});
  \draw[dashed,red!75!black] (-1.15,-12) -- (1.15,-12);
  \draw[<->,red!75!black,thick] (-0.297,-12) -- (0.297,-12);
  \node[red!75!black,font=\scriptsize,fill=white,inner sep=1pt] at (0,-13.3) {EH at $10^{-12}$ $\approx 2(A-7\sigma)$};
  \draw[->] (0.62,-2.2) node[left,font=\scriptsize,align=right] {at a level ($V_{th}=\pm A$):\\half that level's symbols err, BER $=\tfrac14$} -- (0.97,-0.7);
  \draw[->] (0.75,-8) node[right,font=\scriptsize,align=left] {Gaussian tail\\$\tfrac12Q\!\left(\frac{A-V_{th}}{\sigma}\right)$} -- (0.6,-8);
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{BER}(V_{th}) = \tfrac12 Q\!\left(\frac{A-V_{th}}{\sigma}\right)+\tfrac12 Q\!\left(\frac{A+V_{th}}{\sigma}\right),\qquad EH_{\mathrm{BER}} \approx 2\big(A - x\,\sigma\big),\ Q(x)=\mathrm{BER}}
$$

- **The walls are Gaussian tails.** Their steepness is $\sigma$, and the opening at a target BER is the eye height quoted at that BER (EH6 at $10^{-6}$, the "$7\sigma$" eye at $10^{-12}$).
- **At a level** ($V_{th}=\pm A$) half of that level's symbols fall on the wrong side, so $\mathrm{BER}=\tfrac14$.
- Measured walls are rarely pure Gaussians: residual ISI and crosstalk add bounded terms, which is what the statistical eye below handles.

> [!tip] Remark
> The **horizontal (timing) bathtub** is the same picture with the sampling instant on the x-axis (Agilent Fig. 11). Its walls are set by jitter, and total jitter is read from it as $TJ(\mathrm{BER}) = 1\,UI - \text{opening}$. RJ/DJ, the dual-Dirac model and timing bathtubs live in [[Link Noise and Jitter]].

### Peak-Distortion (Worst-Case) Eye

The pulse response sampled once per UI gives the cursor $y_0$ and the ISI taps $y_k$ ([[Channels]]). The worst "1" has every ISI term pulling down. The worst "0" has every term pulling up (Palermo L4 slides 12–15):

$$
\boxed{EH_{worst} = 2\Big(y_0 - \sum_{k\ne0}|y_k|\Big)\ \text{(NRZ)},\qquad EH_{worst} = 2\Big(\tfrac{A}{3} - \sum_{n\ne0}|c_n|\Big)\ \text{(PAM4)}}
$$

Example (Palermo L4 slide 14): $y = [\dots,0.003, 0.036, \mathbf{0.540}, 0.165, 0.065, 0.033, 0.020, 0.012, 0.009,\dots]$. The positive ISI sums to 0.389 and the negative to $-0.007$, so $EH = 2(0.540-0.007-0.389) = 0.288$.

The **worst-case pattern** is the pulse response flipped about the cursor, each bit set to the opposite sign of its ISI tap (Palermo L4 slide 15).

> [!tip] Remark
> Peak-distortion analysis gives a **bound**, not a BER. The worst pattern needs every one of $N$ significant taps to line up, which happens with probability $2^{-N}$. Palermo's 5 Gb/s backplane eye with $10^4$ random bits is visibly wider than the worst-case eye (L9 slide 30). Use it to size equalizers. Use a statistical eye to predict BER.

### Statistical Eye

Treat each ISI tap as an independent random variable ($\pm y_k$ with probability $\tfrac12$ each for NRZ) and **convolve** their PDFs. Then convolve with the Gaussian noise PDF. The result is the full distribution of the sampled voltage (Palermo L9 slides 31–37).

```tikz title="Statistical eye: convolve the two-point PDF of every ISI tap (top), add noise, and integrate the data-1 PDF up to the threshold (bottom). Numbers from the Palermo pulse response. After Palermo L9 slides 31-35."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  % panel a: two-point PDFs convolved
  \begin{scope}[x=4cm,y=2.4cm]
    \draw[->] (-0.3,0) -- (0.3,0) node[right,font=\scriptsize] {V};
    \foreach \v in {-0.165,0.165} \draw[thick,blue!70!black] (\v,0) -- (\v,0.5) node[above,font=\scriptsize] {$\tfrac12$};
    \node[font=\scriptsize] at (0,-0.22) {tap $y_1=0.165$};
    \node at (0.42,0.25) {$*$};
    \begin{scope}[xshift=3.4cm]
      \draw[->] (-0.3,0) -- (0.3,0);
      \foreach \v in {-0.065,0.065} \draw[thick,blue!70!black] (\v,0) -- (\v,0.5);
      \node[font=\scriptsize] at (0,-0.22) {tap $y_2=0.065$};
      \node at (0.42,0.25) {$=$};
    \end{scope}
    \begin{scope}[xshift=6.8cm]
      \draw[->] (-0.3,0) -- (0.3,0);
      \foreach \v in {-0.23,-0.1,0.1,0.23} \draw[thick,blue!70!black] (\v,0) -- (\v,0.25) node[above,font=\scriptsize] {$\tfrac14$};
      \node[font=\scriptsize,align=center] at (0,-0.28) {4 points; keep going\\over all taps, add noise};
    \end{scope}
  \end{scope}
  % panel b: data-1 PDF and BER(X)
  \begin{scope}[yshift=-4.2cm,x=11cm,y=2.2cm]
    \draw[->] (0,0) -- (1.05,0) node[right] {$v$ sampled, data 1 sent};
    \fill[red!40,domain=0.1:0.3,samples=40] (0.1,0) -- plot (\x,{0.55*exp(-((\x-0.38)^2)/0.006)+0.7*exp(-((\x-0.7)^2)/0.008)}) -- (0.3,0) -- cycle;
    \draw[thick,blue!70!black,domain=0.1:0.98,samples=120] plot (\x,{0.55*exp(-((\x-0.38)^2)/0.006)+0.7*exp(-((\x-0.7)^2)/0.008)});
    \draw[dashed] (0.3,0) -- (0.3,0.95) node[above,font=\scriptsize] {threshold $X$};
    \draw (0.54,0) -- (0.54,-0.06) node[below,font=\scriptsize] {cursor $y_0=0.54$};
    \draw (0.144,0) -- (0.144,-0.06) node[below,font=\scriptsize,align=center] {worst case\\(peak distortion)};
    \draw[->,red!70!black] (0.07,0.55) node[above,font=\scriptsize,align=center] {$\mathrm{BER}(X)$\\$=\int_{-\infty}^X\mathrm{PDF}$} -- (0.24,0.08);
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{\mathrm{BER}(X) = \int_{-\infty}^{X}\mathrm{PDF}_{\text{data }1}(v)\,dv}
$$

That is the probability that a "1" lands below threshold $X$. Combine the "1" and "−1" CDFs at every sampling phase and draw contours of constant BER: the **statistical BER eye** (StatEye). Its vertical opening at, say, $10^{-12}$ is the real eye height (Palermo 2011 Fig. 9.14; L9 slide 37). Tools such as StatEye add jitter and receiver aperture the same way. That full version is in [[Link Noise and Jitter]].

> [!note]- Detail: COM, the standards' version of a statistical eye
> **Channel Operating Margin** (IEEE 802.3bj onward) is a figure of merit for a passive channel. It assumes reference TX and RX equalizers and computes ISI and crosstalk distributions in detail instead of treating them as Gaussian. It does not model the CDR but leaves some margin for it. It is a quick pass/fail for a channel. Time-domain simulation with hardware-correlated models (e.g. IBIS-AMI) is the more accurate step after it (Zhang slides 74–76; Zhang's IBIS-AMI example: 56 Gb/s MR channel, statistical BER $4.95\times10^{-10}$).

### Link Budget

Each budget item is either **bounded** (added at its worst: residual ISI, crosstalk from a few aggressors, offset, supply noise) or **statistical** (Gaussian, so it enters as $2x\sigma$: random noise), and either **proportional** to the swing or **independent** of it (Palermo L9 slides 5–6, 45):

$$
\boxed{V_N = K_N V_S + V_{NI}}
$$

A bigger swing cannot beat proportional noise: double the swing and the ISI and crosstalk double too. Only independent noise is "overpowered" by swing.

> [!tip] Remark
> What each link noise source is (supply noise, SSO, crosstalk, offset) and how to model it is in [[Link Noise and Jitter]]. The thermal noise behind $\sigma$ is in [[Noise]].

```tikz title="Palermo's worst-case voltage budget: a 400 mV TX swing after 10 dB of loss and every noise term leaves a 62 mV eye. After Palermo L9 slide 46."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,y=0.02cm]
  \def\seg#1#2#3#4{\fill[#3] (0,#1) rectangle (1.6,#2); \draw (0,#1) rectangle (1.6,#2); \node[anchor=west,font=\scriptsize] at (1.8,{(#1+#2)/2}) {#4};}
  \seg{0}{274}{gray!30}{attenuation, 10 dB: 274 mV}
  \seg{274}{279}{cyan!50}{}
  \seg{279}{284}{black!60}{}
  \seg{284}{304}{blue!50}{residual ISI ($0.05\times400$): 20 mV}
  \seg{304}{324}{green!50!black!40}{crosstalk ($0.05\times400$): 20 mV}
  \seg{324}{338}{red!50}{random noise ($14\times1$ mV rms): 14 mV}
  \seg{338}{400}{green!40}{\textbf{eye-height margin: 62 mV}}
  \draw[->] (2.6,240) node[right,font=\scriptsize] {RX offset + sensitivity 5 mV, supply noise 5 mV} -- (1.65,281);
  \draw[|<->|] (-0.4,0) -- (-0.4,400) node[midway,left,font=\scriptsize,align=right] {TX swing\\400 mV$_{ppd}$};
  \draw[|<->|] (-0.4,338) -- (-0.4,400);
\end{circuitikz}
\end{document}
```

Palermo's example (L9 slide 46): 400 mV$_{ppd}$ peak swing, equalized down 10 dB (±200 mV becomes ±63 mV):

| Item | $K_N$ or rms | Allotted |
|---|---|---|
| Attenuation, 10 dB ($1-10^{-0.5} = 0.684$) | | 274 mV |
| RX offset + sensitivity | | 5 mV |
| Power supply noise | | 5 mV |
| Residual ISI | 0.05 | 20 mV |
| Crosstalk | 0.05 | 20 mV |
| Random noise | 1 mV rms × 14 (for $10^{-12}$) | 14 mV |
| **Total** | | **338 mV** |
| **Eye-height margin** | | **62 mV** (31 mV each side) |

This adds every bounded term at its worst at the same time, so it is conservative. Statistical link simulators give the real margin.

The receiver side of the budget is its **sensitivity** (Palermo 2011 Eq. 9.5):

$$
\boxed{V_b = \sqrt{\mathrm{SNR}}\,\sigma_n + V_{offset} + V_{min}}
$$

$\sqrt{\mathrm{SNR}}\approx7$ for $10^{-12}$, $\sigma_n<1$ mV with proper biasing, and offset and latch minimum of 1 to 2 mV each after calibration give **under 20 mV$_{ppd}$** ($2V_b$). Reaching it needs offset correction (Palermo 2011 p. 307).

> [!tip] Remark
> The $\sqrt{\mathrm{SNR}}\,\sigma_n$ term is the $Q$-function result ($x = 7$) with $\sigma_n$ the comparator's input-referred noise ([[Noise#Input-Referred Voltage and Current]]). $V_{offset}$ is Pelgrom mismatch, $\sigma(\Delta V_t) = A_{Vt}/\sqrt{WL}$: halving the offset costs 4× the area, which is why links calibrate offset instead (Palermo L9 slides 13–14; [[Nonlinearity and Mismatch]]).

### FEC and Coding Gain

Links used to target raw BER $10^{-12}$ to $10^{-15}$ (Palermo 2011 p. 300). At 56G PAM4 that is no longer affordable, so the standards add **Reed–Solomon FEC** and accept a much worse raw BER. The VSR eye metrics are defined at $10^{-6}$ (Zhang slide 54).

- $\mathrm{RS}(n,k,T,M)$: $k$ data symbols of $M$ bits become an $n$-symbol codeword, and any $T = (n-k)/2$ wrong symbols are corrected (Zhang slide 72).
- **Coding gain** is the SNR reduction the code absorbs at the same output BER (slide 73).

| Code | Use | $T$ | Overhead | Coding gain (system measurements) |
|---|---|---|---|---|
| RS(528, 514), "KR4" | 802.3bj 25G NRZ | 7 | 3.5% | 5–6 dB |
| RS(544, 514), "KP4" | 802.3bj 28G PAM4, 802.3bs 56G PAM4 | 15 | 5.8% | 7–8 dB |

> [!note]- Detail: what "corrects 15 symbols" means in bits, and the catches
> A KP4 codeword is $544\times10 = 5440$ bits. Errors packed into 15 ten-bit symbols can be up to 150 bit errors and still corrected. 16 single-bit errors spread over 16 different symbols cannot (Zhang slide 72). So FEC loves bursts confined to a symbol and hates scattered errors. DFE error propagation (next section) makes bursts that can span symbols. The coding gain curve assumes AWGN, and the line rate rises by the overhead, so you pay a little SNR in extra channel loss at the higher $f_N$ (slide 73).

### Precoding Against DFE Burst Errors

A DFE subtracts ISI using its own past decisions, so one wrong decision corrupts the next. With a strong first tap, one noise event becomes a **burst**. PAM4 TX precoding $1/(1+D)$ mod 4, undone at the RX by $(1+D)$ mod 4 after slicing, turns each burst into **two** errors: one where it starts and one where it ends (Zhang slides 69–71).

```tikz title="PAM4 1/(1+D) mod 4 precoding around a DFE receiver. After Zhang slides 69 and 71."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,minimum height=1cm,minimum width=1.8cm,align=center,fill=white}]
  \node[blk] (g) at (0,0) {Gray\\coding};
  \node[blk,fill=yellow!20] (p) at (2.6,0) {$\frac{1}{1+D}$\\mod 4};
  \node[blk] (m) at (5.2,0) {PAM4\\TX};
  \node[blk,fill=gray!15] (c) at (7.8,0) {channel};
  \node[blk] (d) at (7.8,-2) {CTLE + DFE\\+ 3 slicers};
  \node[blk,fill=yellow!20] (r) at (5.2,-2) {$(1+D)$\\mod 4};
  \node[blk] (ig) at (2.6,-2) {inverse\\Gray};
  \draw[->] (-1.4,0) node[left,font=\scriptsize] {bits} -- (g);
  \draw[->] (g) -- (p); \draw[->] (p) -- node[above,font=\scriptsize] {$p(n)$} (m); \draw[->] (m) -- (c);
  \draw[->] (c) -- (d); \draw[->] (d) -- node[above,font=\scriptsize] {$d(n)$} (r); \draw[->] (r) -- node[above,font=\scriptsize] {$r(n)$} (ig);
  \draw[->] (ig) -- (1.0,-2) node[left,font=\scriptsize] {bits};
  \node[font=\scriptsize,align=left,anchor=north west] at (-1.4,-2.9) {DFE burst: $p(n)-d(n) = 0,\,+1,-1,+1,-1,\dots,+1,-1,\,0$\\after $(1+D)$: consecutive errors cancel, so only the \textbf{entry} and \textbf{exit} symbols are wrong};
\end{circuitikz}
\end{document}
```

In Zhang's 1-tap-DFE simulation (2M symbols analysed), precoding off gave symbol-error runs up to 11 long. Precoding on gave no run longer than 2. The true SER barely changed ($1.04\times10^{-3}$ vs $8.47\times10^{-4}$). What changed is that the errors became short enough for the FEC (slide 70). Zhang notes that "at most 2" is not guaranteed in general.

> [!note]- Detail: worked precoding example (Zhang slide 69)
> Precoder: $p(n) = [tx(n) - p(n-1)] \bmod 4$. Decoder: $r(n) = [d(n) + d(n-1)] \bmod 4$.
>
> | | | | | | | | | | |
> |---|---|---|---|---|---|---|---|---|---|
> | $tx$ | 2 | 2 | 2 | 2 | 0 | 3 | 2 | 0 | 1 … |
> | $p$ | 0 | 2 | 0 | 2 | 2 | 1 | 1 | 3 | 2 … |
>
> A DFE burst makes $p(n)-d(n)$ alternate $+1,-1,+1,\dots$. In $d(n)+d(n-1)$ consecutive errors cancel pairwise, so only the first and last symbols of the burst are wrong in $r(n)$.

## Level 5: Test Patterns and Transmitter Linearity

### PRBS Patterns

A pseudo-random bit sequence (PRBS) comes from a linear-feedback shift register (LFSR). An $N$-stage maximal-length LFSR cycles through all $2^N-1$ nonzero states, so it is random-looking, repeats exactly, and a receiver can rebuild it to count errors.

```tikz title="PRBS7 generator: a 7-stage maximal-length LFSR (feedback x^7 + x^6 + 1)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  ff/.style={draw,thick,minimum height=0.9cm,minimum width=0.9cm,fill=white}]
  \foreach \i in {1,...,7} \node[ff] (f\i) at (1.5*\i,0) {$D_{\i}$};
  \foreach \i [evaluate=\i as \j using int(\i+1)] in {1,...,6} \draw[->] (f\i) -- (f\j);
  \draw[->] (f7) -- (12.4,0) node[right,font=\scriptsize] {PRBS7 out};
  \node[draw,circle,inner sep=1pt] (x) at (9.75,1.5) {$\oplus$};
  \draw[->] (9.75,0) -- (x.south);
  \draw[->] (11.4,0) |- (x.east);
  \draw[->] (x.west) -- (0.4,1.5) -- (0.4,0) -- (f1.west);
  \node[font=\scriptsize,align=left,anchor=north west] at (1,-0.8) {feedback $x^7+x^6+1$: period $2^7-1=127$ bits, every nonzero 7-bit word once, longest run 7};
\end{circuitikz}
\end{document}
```

| Property of PRBS-$N$ | Value | Why it matters |
|---|---|---|
| Period | $2^N-1$ bits | Spectral **lines** at $R_b/(2^N-1)$ under a $\mathrm{sinc}^2$ envelope. 20 Gb/s PRBS $2^{31}-1$ gives 9.3 Hz spacing (Lee 2008 Fig. 28) |
| Longest run | $N$ identical bits | Longest low-frequency stretch: stresses baseline wander (AC coupling), DC gain of equalizers, CDR hold-in |
| Content | every $N$-bit pattern except all-zeros, once | Every ISI pattern up to $N$ bits long appears |

Short patterns (e.g. $2^7-1$) are cheap to build on-chip and fast to simulate; Lee 2015 puts a quarter-rate PRBS generator inside its 56G NRZ TX for self-test (Sec. IV-A). Long ones ($2^{31}-1$, used by Lee 2008 for all BER results) stress low-frequency effects.

> [!note]- Detail: how long to run a BER test
> With true BER $p$, the chance of seeing zero errors in $n$ bits is $(1-p)^n\approx e^{-np}$. To claim $\mathrm{BER}<p$ with 95% confidence after zero errors, need $e^{-np}\le0.05$, i.e. $n\ge\ln 20/p\approx3/p$. At $10^{-12}$ that is $3\times10^{12}$ bits, or 300 s at 10 Gb/s. This is why bathtub extrapolation and statistical eyes exist. (Standard statistics, not from the assigned sources.)

**PAM4 test patterns** (Zhang slides 77–82):

| Pattern | Definition | Measures |
|---|---|---|
| **QPRBS13** | PRBS13 bits Gray-mapped to PAM4. Two 8191-bit cycles, the second inverted, giving a repeating 8191-symbol sequence | Short, spectrally rich, well behaved: levels, eye thickness, eye vertical alignment |
| **PRQS10** | Pseudo-random *quaternary* sequence (GF(4) LFSR, or two PRBS muxed), about 1M symbols | Emulates random PAM4 data, good baseline-wander behaviour |
| **JP03A** | Repeating $\{0,3\}$ | Random jitter and deterministic clock jitter |
| **JP03B** | $15\times\{0,3\}$ then $16\times\{3,0\}$, repeating | RJ, PJ, and even–odd jitter (EOJ) |
| Linearity pattern | 160 symbols: $\{-1,-\tfrac13,+\tfrac13,+1,-1,+1,-1,+1,+\tfrac13,-\tfrac13\}$, each held 16 UI | Level spacing, for $R_{LM}$ below |

### Level Mismatch Ratio ($R_{LM}$)

PAM4 eyes are only equal if the four levels are equally spaced. With measured levels $V_A<V_B<V_C<V_D$ (Zhang slide 82):

$$
\boxed{S_{min} = \frac{\min(V_D-V_C,\;V_C-V_B,\;V_B-V_A)}{2},\qquad R_{LM} = \frac{6\,S_{min}}{V_D-V_A}}
$$

$R_{LM}=1$ for perfect spacing; the smallest eye sets it. CEI-56G-PAM4 MR and LR require $R_{LM}\ge0.95$.

| $R_{LM}$ | 0.99 | 0.92 | 0.85 |
|---|---|---|---|
| Simulated BER (Zhang slide 84) | $2.11\times10^{-22}$ | $1.17\times10^{-14}$ | $3.67\times10^{-8}$ |

A 15% level error costs 14 decades of BER. That is the Gaussian tail of the $Q$-function at work: the smallest eye shrinks and $Q$ is steep.

> [!tip] Remark
> The causes are DAC bit-weighting error (the MSB:LSB = 2:1 current ratio is off) and compression in the output driver (Zhang slide 83). That is weak nonlinearity of [[Nonlinearity and Mismatch]] in a multi-level signal. Lee 2015 goes the other way on purpose: it **pre-distorts** the 2:1 weighting with two current DACs so that a nonlinear EML laser ends up with equal levels (Fig. 6). See [[Transmitters]].

> [!note]- Detail: the $R_{LM}$ model and the other $R_{LM}$ quantities
> Zhang slide 82 also defines $V_{avg} = (V_A+V_B+V_C+V_D)/4$, $ES_1 = (V_B-V_{avg})/(V_A-V_{avg})$, $ES_2 = (V_C-V_{avg})/(V_D-V_{avg})$; ideal $ES_1 = ES_2 = \tfrac13$. For slide 84's simulation the ideal level $v\in[-3,3]$ is mapped by a quadratic: $v_{mapped} = \pm(R_{LM}-1)v^2 + (4-3R_{LM})v$ (sign $+$ for $v\ge0$, $-$ for $v<0$), then $v_{out} = (v_{mapped}/3)\,v_{swing}$. The end levels stay at $\pm3$, and the inner levels move outward when $R_{LM}<1$. The OIF proposal it comes from (Keysight, Oct. 2015) assumes the nonlinearity is in the TX, not the channel.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| NRZ → PAM4 | $f_N$ halves (less loss to equalize), half-rate circuits, reuse of 28G optics | Eye $\tfrac13$ (−9.5 dB, >11 dB real), EW $\tfrac12$–$\tfrac23$ UI, 3 slicers + thresholds, linear RX, multi-crossing CDR, 3× ISI and crosstalk sensitivity, $R_{LM}$ |
| NRZ → duobinary | Uses the channel roll-off; least EQ boost (2.8–8.9 dB less in Lee 2008) | Precoder timing, 3-level RX with two thresholds, eye $\tfrac12$ |
| Higher TX swing | Beats independent noise (offset, thermal, sensitivity) | Power. Does nothing against ISI and crosstalk (proportional) |
| Lower target raw BER + FEC | 5–8 dB coding gain, eye metrics at $10^{-6}$ | 3.5–5.8% overhead (higher line rate), latency, burst sensitivity |
| $1/(1+D)$ precoding | DFE bursts become 2 errors, FEC-friendly | Doubles isolated errors (1 becomes 2) |
| Offset calibration | Sensitivity toward 20 mV$_{pp}$ | Calibration DAC and loop |
| Longer PRBS | Exposes long runs, baseline wander, CDR drift | Longer simulation and test time per pattern period |
| Statistical instead of peak-distortion eye | Real BER, less over-design | Needs PDFs of every source, still assumes independence |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Unit interval, baud | $UI = 1/R_{baud}$, $R_{baud} = R_b/\log_2M$ |
| Nyquist frequency | $f_N = R_{baud}/2$: NRZ $1/(2T_b)$, PAM4 $1/(4T_b)$ (duobinary $1/(3T_b)$ per Lee) |
| Random-data PSD | $S_x(f) = a^2T\,\mathrm{sinc}^2(fT)$, nulls at $kR_{baud}$ |
| Duobinary | $w[n] = x[n]+x[n-1]$, $H_1 = \tfrac12(1+z^{-1})$, $S_W = T_b\,\mathrm{sinc}^2(2fT_b)$ |
| Eye penalty | $EH_{PAM\text{-}M}/EH_{NRZ} = 1/(M-1)$; PAM4 $20\log_{10}3 = 9.5$ dB |
| Loss-slope rule | PAM4 if $\lvert S_{21}(R_b/2)\rvert_{dB}-\lvert S_{21}(R_b/4)\rvert_{dB}>9.5$ dB |
| Q-function | $Q(x) = \tfrac12\mathrm{erfc}(x/\sqrt2)\le\tfrac12e^{-x^2/2}$ |
| NRZ BER | $\mathrm{BER} = Q(A/\sigma)$; $10^{-12}\Rightarrow A/\sigma = 7.03$ |
| PAM4 SER | $P_{err} = 1.5\,Q(V_{pp}/6\sigma_n)$; $10^{-12}\Rightarrow V_{pp}/6\sigma_n>7.1$ (17 dB) |
| PAM-$M$ SER | $\mathrm{SER} = \frac{2(M-1)}{M}Q(h_0/\sigma)$ |
| SER → BER | $\mathrm{BER}\approx d_{avg}\,\mathrm{SER}/\log_2M$, Gray $d_{avg}=1$ |
| Gray PAM4 BER | $\mathrm{BER} = \tfrac38\,\mathrm{erfc}(h_0/\sqrt2\sigma)$ |
| Vertical bathtub | $\mathrm{BER}(V_{th}) = \tfrac12Q\!\left(\frac{A-V_{th}}{\sigma}\right)+\tfrac12Q\!\left(\frac{A+V_{th}}{\sigma}\right)$, $EH_{\mathrm{BER}}\approx2(A-x\sigma)$ |
| Peak-distortion eye | NRZ $2(y_0-\sum_{k\ne0}\lvert y_k\rvert)$; PAM4 $2(A/3-\sum_{n\ne0}\lvert c_n\rvert)$ |
| Statistical BER | $\mathrm{BER}(X) = \int_{-\infty}^X\mathrm{PDF}\,dv$ |
| Noise model | $V_N = K_NV_S+V_{NI}$ |
| RX sensitivity | $V_b = \sqrt{\mathrm{SNR}}\,\sigma_n+V_{offset}+V_{min}$ |
| RS FEC | $\mathrm{RS}(n,k)$ corrects $T = (n-k)/2$ symbols |
| PRBS-$N$ | period $2^N-1$, line spacing $R_b/(2^N-1)$, longest run $N$ |
| $R_{LM}$ | $6S_{min}/(V_D-V_A)$, $S_{min} = \tfrac12\min(\Delta V)$; spec $\ge0.95$ |

## References

- **S. Palermo, ECEN720 Lecture 4, "Channel Pulse Model & Modulation Schemes"** (`lecture4_ee720_channel_pulse_model.pdf`): slides 4–10 (pulse response, cursors), 12–16 (peak-distortion analysis, worked examples, worst-case pattern), 18–27 (NRZ vs PAM4, spectra, Nyquist table, loss-slope rule, PAM4 RX, desktop and T20 server examples, PAM4 peak distortion, multi-level challenges).
- **S. Palermo, ECEN720 Lecture 9, "Noise Sources"** (`lecture9_ee720_noise_sources.pdf`): slides 5–6 (bounded/statistical, proportional/independent), 13–14 (offset), 28–37 (ISI PDF, cursor CDF, statistical BER eye), 39–44 (Gaussian, CDF, erf/erfc/Q, BER plot and bound), 45–46 (classification, noise budget example).
- **S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems"**, Ch. 9 in *High-Speed Circuits* (Iniewski ed.), 2011 (`serial_links_chapter_palermo_2011.pdf`): pp. 300–301 (BER targets, statistical BER eye, Fig. 9.14), §9.3.2 pp. 305–306 (PAM-4, 9.5 dB, rule of thumb and its limits, Fig. 9.20), §9.4 p. 307 (sensitivity Eq. 9.5).
- **H. Zhang et al., "PAM4 Signaling for 56G Serial Link Applications – A Tutorial,"** DesignCon 2016 (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`; PDF page = slide number): slides 13, 23–35 (NRZ, PAM4 mapping, PSD, eye height/width, anatomy, ISI rule of thumb), 32 (slicer naming), 44 (transition density), 54 (EH6/EW6), 67–84 (SER/BER, MSE BER, precoding, FEC, coding gain, COM, IBIS-AMI, JP03A/B, EOJ, QPRBS13, PRQS10, $R_{LM}$).
- **J. Lee et al., "Design of 56 Gb/s NRZ and PAM4 SerDes Transceivers in CMOS Technologies,"** IEEE JSSC 50(9), 2015 (`56G_NRZPAM4_J.pdf`): Sec. I (9.5 dB), Sec. II and Fig. 2 (decision rule), Table I, Sec. III-A Eq. 1 and Fig. 5 (PAM4 error probability, 17 dB), Fig. 6 (EML pre-distortion).
- **J. Lee, M.-S. Chen, H.-D. Wang, "Design and Comparison of Three 20-Gb/s Backplane Transceivers for Duobinary, PAM4, and NRZ Data,"** IEEE JSSC 43(9), 2008 (`20G_duobinary_pam4_nrz_xcvrs_lee_jssc_2008.pdf`): Sec. II, Eq. 1–4, Figs. 2–5 (duobinary model, spectrum, brick-wall test, required boost, footnote 1 Nyquist frequencies); Sec. III-A Eq. 5–6, Fig. 7 (precoder); Sec. VI, Figs. 28–29 (spectra, PRBS line spacing, far-end comparison, power).
- **Agilent, "Using Clock Jitter Analysis to Reduce BER in Serial Data Applications,"** application note (`jitter_analysis_ber_serial_data_agilent.pdf`): pp. 4, 8 (noise and jitter both set BER; eye size depends on BER; bathtub and TJ(BER) definition, Fig. 11).
