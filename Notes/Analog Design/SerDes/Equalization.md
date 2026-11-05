---
title: Equalization
description: How a link undoes channel ISI at the system level. The TX FFE trades swing for flatness, the CTLE puts a zero below its poles and boosts noise along with the signal, and the DFE subtracts post-cursors with its own decisions inside a 1-UI loop. The note also covers how the three are split and how sign-sign LMS adapts them.
kind: topic
status: growing
aliases:
  - Equalization
  - Equalizer
  - FFE
  - TX FIR
  - De-emphasis
  - CTLE
  - DFE
  - Adaptive Equalization
---

Note S4 of the [[SerDes Learning Path]]. [[Channels]] (S1) reduced the channel to a sampled pulse response whose cursors are the ISI. [[Signaling and BER]] (S2) turned eye height into BER, and [[Link Noise and Jitter]] (S3) did the same for timing. This note owns the **algorithms** that remove the cursors: the TX feed-forward equalizer (FFE), the RX continuous-time linear equalizer (CTLE), the RX FFE, the decision-feedback equalizer (DFE), how the work is split between them, and how they adapt. Each block is treated as a transfer function or a difference equation. The transistor-level TX FFE driver belongs to [[Transmitters]]; the CTLE, summer and slicer circuits belong to [[Receivers]].

## The big picture

```tikz title="An equalized link: TX FFE, channel, CTLE, then a DFE loop around the slicer, with an adaptation engine closing a slow loop to every tap. After Palermo ECEN720 L7 slide 5 and Hanumolu Figs. 10, 23, 28, 32."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,
  blk/.style={draw,thick,minimum height=1cm,minimum width=1.6cm,align=center,fill=white,font=\scriptsize},
  note/.style={font=\scriptsize,align=center,text=red!60!black}]
  \node[font=\scriptsize] (din) at (0,0) {$d_k$};
  \node[blk] (ffe) at (1.7,0) {TX FFE\\$W(z)$};
  \node[blk,fill=gray!15] (ch) at (4.3,0) {channel\\$H(f)$};
  \node[blk] (ctle) at (6.9,0) {CTLE\\$H_{CTLE}(s)$};
  \node[draw,thick,circle,inner sep=1.5pt] (sum) at (8.8,0) {$\Sigma$};
  \node[blk,minimum width=1.2cm] (sl) at (10.4,0) {slicer};
  \node[font=\scriptsize] (out) at (12.6,0) {$\hat d_k$};
  \draw[->,thick] (din)--(ffe);
  \draw[->,thick] (ffe)--(ch);
  \draw[->,thick] (ch)--(ctle);
  \draw[->,thick] (ctle)--(sum) node[midway,above,font=\scriptsize] {$y_k$};
  \draw[->,thick] (sum)--(sl) node[midway,above,font=\scriptsize] {$z_k$};
  \draw[->,thick] (sl)--(out);
  \node[blk,minimum width=2.2cm] (dfe) at (10.4,-1.8) {DFE taps\\$\sum_i w_i\hat d_{k-i}$};
  \draw[->,thick] (11.8,0) |- (dfe.east);
  \draw[->,thick] (dfe.west) -| (sum.south) node[pos=0.92,left,font=\scriptsize] {$-$};
  \node[blk,minimum width=2.2cm] (ad) at (6.9,2.1) {adaptation\\(sign-sign LMS)};
  \draw[->,dashed] (sl.north) |- (ad.east) node[pos=0.25,right,font=\scriptsize] {error $e_k$};
  \draw[->,dashed] (ad.south) -- (ctle.north);
  \draw[->,dashed] (ad.west) -| (ffe.north) node[pos=0.25,above,font=\scriptsize] {back-channel};
  \draw[->,dashed] (ad.east) ++(0,-0.25) -| (9.6,-1.3) -- (dfe.north west);
  \node[note] at (1.7,-1.25) {pre- and post-cursor\\costs swing};
  \node[note] at (4.3,-1.25) {low-pass:\\makes the ISI};
  \node[note] at (6.9,-1.25) {boosts HF, long tail\\boosts noise too};
  \node[note] at (10.4,-2.9) {post-cursors only, no noise boost,\\1-UI feedback loop};
\end{circuitikz}
\end{document}
```

```tikz title="Which equalizer goes after which cursor. Cursors are Palermo's refined-backplane pulse response (L4 slide 8; drawn ×5 vertically)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-3.4,0) -- (7.6,0) node[right] {$k$ (UI)};
  \draw[->] (-3,-0.2) -- (-3,3.2) node[above,font=\scriptsize] {$a_k$};
  \foreach \k/\v in {-2/0.003,-1/0.036,0/0.540,1/0.165,2/0.065,3/0.033,4/0.020,5/0.012,6/0.009} {
    \draw[thick] (\k,0) -- (\k,{5*\v});
    \fill (\k,{5*\v}) circle (1.8pt);
    \node[below,font=\tiny] at (\k,0) {\k};
  }
  \node[right,font=\scriptsize] at (0.05,2.7) {$a_0=0.540$ (main cursor)};
  \node[font=\tiny] at (1,1.05) {0.165};
  \node[font=\tiny] at (-1,0.42) {0.036};
  \draw[decorate,decoration={brace,amplitude=4pt},blue!70!black,thick] (-2.3,0.75) -- (-0.7,0.75);
  \node[blue!70!black,font=\scriptsize,align=center] at (-1.5,1.45) {pre-cursors:\\TX FFE / RX FFE};
  \draw[decorate,decoration={brace,amplitude=4pt,mirror},red!70!black,thick] (0.7,-0.5) -- (3.3,-0.5);
  \node[red!70!black,font=\scriptsize,align=center] at (2,-1.15) {first post-cursors:\\DFE taps $w_i=a_i$};
  \draw[decorate,decoration={brace,amplitude=4pt},green!40!black,thick] (3.7,0.5) -- (6.3,0.5);
  \node[green!40!black,font=\scriptsize,align=center] at (5,1.2) {long tail:\\CTLE, IIR DFE, FFE};
\end{circuitikz}
\end{document}
```

> [!important] The five results the rest of the note refines
> 1. **Equalizing means flattening $|H(f)|$ out to Nyquist**, or equivalently forcing every cursor except $a_0$ to zero. A linear equalizer is an approximate inverse filter $\approx 1/H$ (Palermo L7 slide 8; Zhang slide 19).
> 2. **TX FFE:** a symbol-spaced FIR, $W(z)=\sum_k w_kz^{-k}$. The driver's peak swing forces $\sum|w_k|\le1$, so it cannot boost Nyquist. It **de-emphasizes** DC by $20\log_{10}\!\left|\sum w_k\right|$. It adds no noise, but it shrinks the received signal.
> 3. **CTLE:** one zero below its poles. Peaking $=\omega_{p1}/\omega_z$ ($=1+g_mR_S/2$ for an RC-degenerated pair). It is cheap and cancels both pre-cursors and the long tail, but it **boosts noise and crosstalk by the same amount as the signal**, so the SNR does not improve.
> 4. **DFE:** $z_k = y_k-\sum_{i=1}^{N}w_i\hat d_{k-i}$, with $w_i$ equal to the post-cursors seen at its input. It adds no noise because it feeds back clean decisions. It cannot touch pre-cursors, it can propagate errors, and the **first tap must close in 1 UI**: $t_{clk\to Q}+t_{mux}+t_{summer}\le 1$ UI. Loop unrolling trades that loop for $2^N$ (NRZ) or $4^N$ (PAM4) slicers.
> 5. **Adaptation:** sign-sign LMS, $w_n \mathrel{+}= \mu\,\mathrm{sign}(e_k)\,\mathrm{sign}(x_{k-n})$, needs only an error slicer at the target level $d_{Lev}$ and up/down counters. Adapting the TX taps needs a back-channel.

**Map:** [[#Level 0 Why Equalize|why equalize]] → [[#Level 1 TX FFE|TX FFE: de-emphasis, peak power, zero-forcing taps]] → [[#Level 2 Linear RX Equalizers|RX FFE, CTLE, noise enhancement]] → [[#Level 3 Decision-Feedback Equalization|DFE: error propagation, 1-UI loop, unrolling, IIR]] → [[#Level 4 Partitioning FFE, CTLE and DFE|partitioning]] → [[#Level 5 Adaptation|LMS, SS-LMS, back-channel, eye monitors]] → [[#Level 6 PAM4 Equalization|PAM4]] → [[#What this implies for the circuit blocks|circuit blocks]].

## Level 0: Why Equalize

> [!tip] Remark
> The sampled pulse response from [[Channels#Cursors and the Channel as an FIR Filter]] makes the channel an FIR filter: $V_o(t_0+nT)=\sum_k d_{n-k}a_k$. Every $a_{k\neq0}$ is ISI, and the worst-case eye is $2\left(a_0-\sum_{k\ne0}|a_k|\right)$ ([[Channels#Peak-Distortion Analysis the Worst-Case Eye]]). An equalizer's only job is to shrink $\sum_{k\ne0}|a_k|$ without shrinking $a_0$ by more.

$$
\boxed{\text{goal: } |H(f)\,H_{EQ}(f)| \approx \text{const for } 0\le f\le f_N = \tfrac{1}{2T} \quad\Longleftrightarrow\quad (h*h_{EQ})[k]\approx\delta[k-D]}
$$

```tikz title="Two ways to flatten the channel: (A) attenuate low frequencies down to the loss at Nyquist (what a TX FFE must do), or (B) boost high frequencies (what an RX equalizer with gain can do). After Hanumolu Fig. 9."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,-4.2) -- (8,-4.2) node[right] {$f$};
  \draw[->] (0,-4.2) -- (0,0.6) node[above] {dB};
  \draw[thick,domain=0:7,samples=40] plot (\x,{-0.12-0.38*\x-0.18*sqrt(\x)}) node[right,font=\scriptsize] {channel};
  \draw[thick,dashed] (7,-4.2) node[below,font=\scriptsize] {$f_N$} -- (7,0);
  \draw[very thick,blue!70!black] (0,-3.25) -- (7,-3.25);
  \node[blue!70!black,font=\scriptsize,anchor=north west] at (0.1,-3.3) {(A) equalized by attenuating DC};
  \draw[very thick,red!70!black] (0,-0.12) -- (7,-0.12) node[pos=0.3,above,font=\scriptsize] {(B) equalized by boosting HF};
  \draw[<->,blue!70!black] (0.3,-0.25) -- (0.3,-3.15) node[midway,right,font=\scriptsize,align=left] {DC loss given up\\$=$ loss at $f_N$};
\end{circuitikz}
\end{document}
```

- Both curves flatten the response. They differ in **where the signal ends up**: (A) at the Nyquist loss level, the TX FFE's fate; (B) at the DC level, possible only with gain at Nyquist, which a CTLE or RX FFE has. Hanumolu's 20-inch FR4 server channel loses about 12 dB at 2.5 GHz, the Nyquist frequency of 5 Gb/s, and the unequalized eye is almost closed (Hanumolu §4).
- **Linear** equalizers (FFE, CTLE) filter signal, noise and crosstalk alike. The **nonlinear** DFE uses quantized decisions, so it does not fit the "flatten $|H|$" picture (Zhang slide 19). In the end the target is BER, not flatness.

> [!tip] Remark
> This is [[System Defintiions#10. Inversion and equalization|inversion and equalization]] from DSP: an exact causal, stable inverse $1/H$ exists only if $H$ is minimum phase. A channel's pre-cursors are its non-minimum-phase part, which is why a *delay* $D$ (a pre-cursor tap) is always needed, and why a purely causal post-cursor canceller (the DFE) can never remove them.

| Equalizer | Where | Linear? | Cancels | Noise/crosstalk | Main cost | Adapts without back-channel? |
|---|---|---|---|---|---|---|
| TX FFE (FIR) | TX | yes | pre + post (span of taps) | not amplified, but signal attenuated | peak-power limit: de-emphasis | no |
| RX FFE (analog or digital FIR) | RX | yes | pre + post | amplified | analog delays, tap precision, or a fast ADC | yes |
| CTLE | RX | yes | pre + long tail (1st-order shape) | amplified | limited shape, PVT, gain-bandwidth | yes |
| DFE (FIR or IIR feedback) | RX | **no** | post only | not amplified | 1-UI loop, error propagation, CDR interaction | yes |

(Palermo L7 slides 10–13, L8 slides 6, 13, 21; Palermo 2011 §9.3.1.)

## Level 1: TX FFE

### The FIR and its frequency response

```tikz title="Left: a 3-tap TX FIR (1 pre-cursor tap, main, 1 post-cursor tap). Right: |W(f)| of Palermo's 10 Gb/s taps W = [-0.131, 0.595, -0.274]: -14.4 dB at DC, 0 dB at Nyquist. After Palermo L7 slides 17-18 and Hanumolu Fig. 10."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize] (d) at (0,1.5) {$d_{k+1}$};
  \node[draw,thick] (z1) at (1.6,1.5) {$z^{-1}$};
  \node[draw,thick] (z2) at (3.2,1.5) {$z^{-1}$};
  \draw[->,thick] (d) -- (z1); \draw[->,thick] (z1) -- (z2);
  \foreach \x/\w/\n in {0.6/w_{-1}/a,2.4/w_0/b,4.0/w_1/c} {
    \node[draw,circle,inner sep=0.5pt,font=\scriptsize] (m\n) at (\x,0.3) {$\times$};
    \draw[->] (\x,1.5) -- (m\n);
    \node[left,font=\scriptsize] at (\x-0.15,0.75) {$\w$};
  }
  \draw[thick] (z2.east) -| (4.0,1.5);
  \node[draw,thick,circle,inner sep=1pt] (s) at (2.4,-0.9) {$\Sigma$};
  \draw[->] (ma) -- (s); \draw[->] (mb) -- (s); \draw[->] (mc) -- (s);
  \draw[->,thick] (s) -- (2.4,-1.8) node[below,font=\scriptsize] {to driver (peak $\sum|w_k|\le 1$)};
  \begin{scope}[xshift=6.3cm,yshift=-1.6cm]
    \draw[->] (0,0) -- (5.6,0) node[right,font=\scriptsize] {$fT$};
    \draw[->] (0,0) -- (0,3.8) node[above,font=\scriptsize] {$|W|$ (dB)};
    \foreach \d in {0,-5,-10,-15} \draw (0,{3.2+0.2*\d}) -- (-0.08,{3.2+0.2*\d}) node[left,font=\tiny] {\d};
    \draw[thick,blue!70!black,domain=0:0.5,samples=60] plot ({10*\x},{3.2+0.2*20*log10(sqrt((-0.131+0.595*cos(360*\x)-0.274*cos(720*\x))^2+(-0.595*sin(360*\x)+0.274*sin(720*\x))^2))});
    \draw[dashed] (5,0) -- (5,3.4);
    \node[below,font=\scriptsize] at (5,0) {$0.5$ ($f_N$)};
    \node[below,font=\scriptsize] at (0,0) {0};
    \node[right,font=\scriptsize] at (1.3,0.35) {$\sum w_k=0.190$: $-14.4$ dB};
    \node[left,font=\scriptsize] at (4.9,3.45) {$\sum(-1)^kw_k=1$: 0 dB};
  \end{scope}
\end{circuitikz}
\end{document}
```

$$
\boxed{W(e^{j2\pi fT}) = \sum_k w_k e^{-j2\pi fkT},\qquad W(0)=\sum_k w_k,\qquad W\!\left(\tfrac{1}{2T}\right)=\sum_k(-1)^kw_k}
$$

- Feed the FIR all ones: you get the DC gain, $\sum w_k$. Feed it $+1,-1,+1,\dots$: you get the Nyquist gain, which is the sum with alternating signs (Palermo L7 slide 17).
- With the main tap positive and the pre- and post-taps **negative**, the alternating sum is $\sum|w_k|$, the largest the driver allows. So a TX FFE is a **high-pass FIR whose Nyquist gain is pinned at 1**.

> [!tip] Remark
> A TX FFE is the FIR of [[Discrete Signals and Systems#8. FIR vs IIR, and the general LCCDE|FIR vs IIR]]: no feedback, so it is always causal and stable. Its zeros, the roots of $W(z)$ from the [[Z-Transform]], sit near $z=1$ (DC), which is why DC is notched down. The "pre-cursor" tap $w_{-1}$ multiplies the *next* bit, so the main tap really sits at delay $z^{-1}$. That delay is the $z^{-n_d}$ an inverse needs.

### Peak-power constraint and de-emphasis

$$
\boxed{\sum_k |w_k| \le 1 \quad\Rightarrow\quad \text{de-emphasis} = -20\log_{10}\Big|\sum_k w_k\Big| \ \text{dB (DC relative to Nyquist)}}
$$

```tikz title="De-emphasis in time (2-tap, w0 = 0.75, w1 = -0.25, example values): a bit after a transition goes out at the full swing |w0|+|w1| = 1; a repeated bit is pulled down to w0-|w1| = 0.5. After Hanumolu Sec. 5 and Zhang slide 16."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (10.2,0) node[right,font=\scriptsize] {$t$};
  \draw[->] (0,-2.3) -- (0,2.4);
  \foreach \y/\l in {2/{+1},1/{+0.5},-1/{-0.5},-2/{-1}} {\draw[dotted] (0,\y) -- (9.8,\y); \node[left,font=\scriptsize] at (0,\y) {\l};}
  % bits: 1 1 1 0 0 1 0 1 1 -> levels
  \draw[very thick,blue!70!black] (0,2) -- (1,2) -- (1,1) -- (3,1) -- (3,-2) -- (4,-2) -- (4,-1) -- (5,-1) -- (5,2) -- (6,2) -- (6,-2) -- (7,-2) -- (7,2) -- (8,2) -- (8,1) -- (9,1);
  \foreach \x/\b in {0.5/1,1.5/1,2.5/1,3.5/0,4.5/0,5.5/1,6.5/0,7.5/1,8.5/1} \node[font=\scriptsize] at (\x,2.6) {\b};
  \node[font=\scriptsize,align=center] at (2,0.45) {repeated bits:\\de-emphasized};
  \node[font=\scriptsize,align=center] at (9.1,-0.6) {transitions:\\full swing};
\end{circuitikz}
\end{document}
```

- **Why the constraint exists:** the driver's maximum output, $I\cdot R_T$ for a current-mode driver, is fixed by headroom, because the tail sources must stay in saturation for the termination to stay matched. Every tap's current comes out of the same budget: $\left(I\sum|C_i|\right)R_T = IR_T \Rightarrow \sum|C_i| = 1$ (Hanumolu Eq. 2). Adding taps can only shrink the main cursor.
- So the TX FFE **cannot improve SNR**: it lowers the low-frequency signal down to the high-frequency level (Palermo 2011 §9.3.1). It also needs large launch swings, which means more crosstalk onto neighbours (Hanumolu §5).
- Zhang's conventions (slide 16) write the taps as magnitudes with the pre- and post-taps subtracted: $C_{-1}+C_0+C_1 = 1$ and $C_0-C_{-1}-C_1>0$.

| Example | Taps $[w_{-1}, w_0, w_1]$ | $\sum w_k$ (DC) | De-emphasis |
|---|---|---|---|
| Palermo L7, 10 Gb/s refined server channel | $[-0.131, 0.595, -0.274]$ | 0.190 | 14.4 dB |
| Hanumolu, 5 Gb/s server channel | $[-0.13, 0.66, -0.21]$ | 0.32 | 9.9 dB |
| Zhang slide 16 | $[-0.075, 0.75, -0.175]$ | 0.50 | 6.0 dB |
| Zhang slide 52, PAM4 "10 dB link" | $[-0.1, 0.675, -0.225]$ | 0.35 | 9.1 dB |

The de-emphasis column is $-20\log_{10}\sum w_k$, computed here from the source taps. Palermo states 14.4 dB himself. Hanumolu's 3-tap FFE opens the 5 Gb/s eye to **80 ps** of timing margin with at least **100 mV** of voltage margin. Its sampled pulse response shows the main cursor attenuated (about 0.42 V to about 0.24 V) while the pre- and post-cursors almost vanish (Hanumolu Figs. 11–12).

### Choosing the taps: zero-forcing by least squares

$$
\boxed{\mathbf{y} = \mathbf{H}\mathbf{w},\qquad \mathbf{w}_{ls} = (\mathbf{H}^T\mathbf{H})^{-1}\mathbf{H}^T\mathbf{y}_{des},\qquad w_{n} = \frac{w_{ls,n}}{\sum_i|w_{ls,i}|}}
$$

- $\mathbf{H}$ is the convolution (Toeplitz) matrix of the channel's sampled pulse response, with one column per tap. $\mathbf{y}_{des}$ is a lone pulse: 1 at the main-cursor position (channel pre-cursor count + FFE pre-tap count + 1), 0 everywhere else.
- The least-squares fit comes out with gain. Dividing by $\sum|w|$ puts it back under the peak constraint.
- Palermo's 10 Gb/s example (L7 slides 21–23): $\mathbf{w}_{ls} = [-0.8180, 3.7245, -1.7184]$, $\sum|w| = 6.2609$, normalized $[-0.131, 0.595, -0.274]$.
- **Tap resolution:** TX DACs give about 4–6 bits (L7 slides 10, 23). Rounding the ideal taps to that grid costs some residual ISI.

> [!note]- Derivation: the least-squares taps
> With a lone-pulse input ($\mathbf{c}=[1]$) the output is $\mathbf{y}=\mathbf{H}\mathbf{w}$ and the error is $\mathbf{E}=\mathbf{H}\mathbf{w}-\mathbf{y}_{des}$. Then
> $$\|\mathbf{E}\|^2 = \mathbf{w}^T\mathbf{H}^T\mathbf{H}\mathbf{w} - 2\mathbf{y}_{des}^T\mathbf{H}\mathbf{w} + \mathbf{y}_{des}^T\mathbf{y}_{des}.$$
> Setting $\partial\|\mathbf{E}\|^2/\partial\mathbf{w} = 2\mathbf{w}^T\mathbf{H}^T\mathbf{H} - 2\mathbf{y}_{des}^T\mathbf{H} = 0$ gives the normal equations $\mathbf{H}^T\mathbf{H}\mathbf{w} = \mathbf{H}^T\mathbf{y}_{des}$ (Palermo L7 slide 22).
>
> Palermo calls this "MMSE", but the cost contains only ISI, no noise term. It is the least-squares approximation to a **zero-forcing** equalizer: with as many taps as cursors it would force every ISI sample to exactly zero. A true MMSE solution would add the noise autocorrelation to $\mathbf{H}^T\mathbf{H}$. For a TX FFE that distinction matters little, because the TX filter does not shape the RX noise.

> [!note]- Detail: what more taps buy (Palermo L7 slide 14)
> Palermo's sweep of equalizer complexity against maximum data rate for three channels (8-inch flex, 7-inch desktop, 17-inch refined backplane):
> - The big jump comes from adding a **2-tap** TX FFE.
> - With TX equalization alone, 2 to 4 taps make little difference: the peak-power constraint, not the tap count, is the limit.
> - Adding RX equalization, especially a DFE, buys most of the remaining data rate. "Caution: hard to build fast DFEs due to critical timing path."
>
> The TX FFE's pros and cons in one place (L7 slide 10): simple, cancels pre-cursors and ISI beyond the filter span, no noise amplification, 5–6 bit resolution achievable. On the other side: low frequencies are attenuated by the peak-power limit, and the taps need a back-channel to adapt.

How the taps become current (direct-FIR parallel drivers vs a segmented DAC with a lookup table, and voltage-mode or impedance-modulated FFE) is circuit work, owned by [[Transmitters]]. A tap set *is* a DAC: see [[DACs]].

## Level 2: Linear RX Equalizers

### RX FFE

$$
\boxed{z_k = \sum_{n} c_n\, y_{k-n}}
$$

- The same transversal filter as the TX FFE, but its input is the **analog** channel output. Its advantages: it can amplify high frequencies instead of attenuating low ones (given enough dynamic range), and it adapts without a back-channel (Palermo L8 slide 6; Palermo 2011 §9.3.1). Hanumolu's ideal 3-tap RX FIR at 5 Gb/s gives a visibly larger eye than the TX FFE (Fig. 15).
- **Digital:** an ADC followed by registers, multipliers and adders. It is limited by ADC resolution and power. Hanumolu cites a 2.3 Gb/s equalizer in 0.18 µm drawing 1.2 W. Harwood's 12.5 GS/s, 4.5-bit flash ADC receiver (65 nm, 2-tap FFE + 5-tap DFE) burns 330 mW for the whole transceiver: 245 mW analog, 85 mW digital (Palermo L8 slides 9–10).
- **Analog:** a sample-and-hold, analog delays and analog multipliers. Its problems are SHA settling, bandwidth lost along the delay chain, and the power of precise delays. Workarounds are time-interleaved rotating input samples or rotating tap weights, or a parallel current-mode architecture (Hanumolu §6.2; Zhang slides 57–58).
- A sampled (discrete-time) RX FFE has to be clocked by the recovered clock, so the CDR operates on the raw, unequalized channel output, which is extra jitter. This is why early discrete-time RX FIRs appeared in forwarded-clock links (Hanumolu §6.3).

### CTLE

```tikz title="CTLE asymptotic Bode plot: a zero at w_z below the first pole w_p1 gives peaking w_p1/w_z. The load pole w_p2 ends the boost. The sum with a channel that falls toward Nyquist is roughly flat. After Palermo L8 slide 15 and Hanumolu Eqs. (7)-(11)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (10,0) node[right,font=\scriptsize] {$\log\omega$};
  \draw[->] (0,-2.6) -- (0,3.2) node[above,font=\scriptsize] {dB};
  \draw[very thick,blue!70!black] (0,0.4) -- (3,0.4) -- (5.4,2.8) -- (6.9,2.8) -- (8.8,0.9);
  \node[right,blue!70!black,font=\scriptsize] at (8.8,0.9) {CTLE};
  \foreach \x/\l in {3/{\omega_z},5.4/{\omega_{p1}},6.9/{\omega_{p2}}} {\draw[dotted] (\x,-2.5) -- (\x,2.9); \node[below,font=\scriptsize] at (\x,-2.5) {$\l$};}
  \draw[<->] (1.2,0.4) -- (1.2,2.8) node[midway,right,font=\scriptsize] {peaking $\omega_{p1}/\omega_z$};
  \draw[dashed] (1.0,2.8) -- (5.4,2.8);
  \node[left,font=\scriptsize] at (0,0.4) {$A_{DC}$};
  \node[left,font=\scriptsize] at (0,2.8) {$A_{pk}$};
  \draw[thick,dashed,gray] (0,-0.1) .. controls (4,-0.6) and (6,-1.8) .. (8.6,-2.4) node[right,font=\scriptsize,black] {channel};
  \draw[thick,red!70!black] (0,0.3) .. controls (3,0.2) and (5,0.5) .. (6.7,0.4) .. controls (7.5,0.2) .. (8.6,-1.2) node[right,font=\scriptsize] {total};
  \node[font=\scriptsize] at (4.9,1.0) {$+20$ dB/dec};
\end{circuitikz}
\end{document}
```

$$
\boxed{H_{CTLE}(s) = A_{DC}\,\frac{1+s/\omega_z}{(1+s/\omega_{p1})(1+s/\omega_{p2})},\qquad \text{peaking} = \frac{A_{pk}}{A_{DC}} = \frac{\omega_{p1}}{\omega_z}}
$$

For the source-degenerated differential pair (total degeneration $R_S\parallel C_S$, load $R_D\parallel C_p$; Palermo L8 slide 15):

$$
\boxed{\omega_z=\frac{1}{R_SC_S},\quad \omega_{p1}=\frac{1+g_mR_S/2}{R_SC_S},\quad \omega_{p2}=\frac{1}{R_DC_p},\quad A_{DC}=\frac{g_mR_D}{1+g_mR_S/2},\quad A_{pk}=g_mR_D,\quad \text{peaking}=1+\frac{g_mR_S}{2}}
$$

- **The idea:** at DC, $R_S$ degenerates the pair and the gain drops by $1+g_mR_S/2$. Above $\omega_{p1}$, $C_S$ shorts $R_S$ and the full $g_mR_D$ returns. Peaking is therefore bought by **lowering DC gain**, never by raising the peak. The peak itself is capped by the pair's gain-bandwidth, which is $\omega_{p2}$ (Palermo L8 slide 15).
- **Tuning (L8 slide 17):** raising $C_S$ moves $\omega_z$ and $\omega_{p1}$ down together with the peaking unchanged. Raising $R_S$ moves $\omega_z$ down and increases peaking (lower DC gain), with little effect on $\omega_{p1}$ (for $g_mR_S\gg2$, $\omega_{p1}\approx g_m/2C_S$).
- **Passive version (Hanumolu Fig. 21):** a series $R_1\parallel C_1$ into a shunt $R_2\parallel C_2$. Excellent linearity, but no gain anywhere ($A_{pk}<1$) and an impedance discontinuity at the channel.

$$
\boxed{\text{passive: } \omega_z=\frac{1}{R_1C_1},\quad \omega_p=\frac{1}{(R_1\parallel R_2)(C_1+C_2)},\quad A_{DC}=\frac{R_2}{R_1+R_2},\quad A_{HF}=\frac{C_1}{C_1+C_2}}
$$

> [!tip] Remark
> A zero below a pole is the "zeros below the poles" Bode case in [[Frequency Response#Bode Rules]]: walk right from DC, gain $+20$ dB/dec from $\omega_z$ until $\omega_{p1}$ cancels it. [[Frequency Response]] has no section on $R_S\parallel C_S$ degeneration itself. The circuit derivation (half-circuit, $g_m/(1+g_mZ_S)$) is in [[High-Speed Circuit Techniques#Level 4 The RC-Degenerated Stage]]; how a receiver tunes and stacks it is in [[Receivers]].

> [!note]- Worked example: Hanumolu's passive equalizer and active CTLE (5 Gb/s server channel)
> **Passive** with $R_1=200\ \Omega$, $C_1=1$ pF, $R_2=65\ \Omega$, $C_2=0.1$ pF (Hanumolu §6.3). The numbers below are computed from these values:
> - $\omega_z = 1/(200\cdot10^{-12}) = 5.0\times10^9$ rad/s → $f_z\approx 0.80$ GHz.
> - $R_1\parallel R_2 = 49.1\ \Omega$, $(R_1\parallel R_2)(C_1+C_2)=54$ ps → $f_p\approx2.95$ GHz.
> - $A_{DC}=65/265=0.245$ ($-12.2$ dB), $A_{HF}=1/1.1=0.909$ ($-0.8$ dB), peaking $=3.7$ (11.4 dB), which is exactly $\omega_p/\omega_z$.
>
> This "results in considerable eye-opening at 5 Gbps" (Fig. 22), but the eye is only about ±50 mV, because the whole response sits below 0 dB.
>
> **Active** (Hanumolu Fig. 23: $2R_D\parallel 0.5C_D$ degeneration, so in Palermo's notation $R_S=2R_D$): in 0.18 µm at 1.8 V and under 10 mW it gives 8 dB of boost at 2.5 GHz. The 5 Gb/s eye has **120 ps** of timing margin with at least 100 mV of voltage margin, against 80 ps for the 3-tap TX FFE on the same channel (Figs. 24, 11). The boost is limited by the load pole $\omega_{p2}$. Inductive peaking or neutralization raises it (Fig. 25), and so do cascaded stages.

### Noise enhancement

```tikz title="A linear equalizer cannot tell signal from noise: it flattens the channel and lifts the high-frequency noise by the same amount. Signal-to-ISI improves, SNR does not. After Palermo L8 slide 7 (Hall)."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (0,0) -- (8.5,0) node[right,font=\scriptsize] {$f$};
  \draw[->] (0,-0.2) -- (0,4.2) node[above,font=\scriptsize] {dB};
  \draw[thick,dashed] (0.3,3.0) -- (8,1.1) node[right,font=\scriptsize] {channel};
  \draw[thick,dash dot,blue!70!black] (0.3,3.0) -- (8,4.0) node[right,font=\scriptsize] {linear EQ};
  \draw[very thick] (0.3,3.0) -- (8,3.0) node[right,font=\scriptsize] {equalized channel};
  \draw[thick,gray] (0.3,0.4) -- (8,0.4) node[right,font=\scriptsize,black] {noise};
  \draw[thick,red!70!black] (0.3,0.4) -- (8,1.95) node[right,font=\scriptsize] {enhanced noise};
\end{circuitikz}
\end{document}
```

$$
\boxed{\overline{v^2_{on}} = \int_0^\infty |H_{CTLE}(f)|^2\,S_{in}(f)\,df,\qquad S_{in} = \frac{4kT\gamma}{g_m}\ \text{(input pair)}}
$$

- The equalizer lifts noise and crosstalk that arrive at the input along with the signal, **and** its own input-pair noise, both by $|H|^2$ at high frequency.
- Hanumolu's 8 dB, 0.18 µm CTLE has under **1 mV rms** of output noise. Against tens of millivolts of signal this "does not limit the overall performance" (Hanumolu §6.4, closed form in his Eq. 12).
- The more dangerous case is crosstalk. NEXT is high-pass ([[Channels]]), so a CTLE amplifies the aggressor exactly where it is strongest.
- **A DC gain below 1 hurts the stages that follow:** with a passive equalizer, or a CTLE that trades DC gain for peaking, every later stage's noise is referred to the input through a gain under 1 (Palermo 2011 §9.4; Hanumolu §6.4 footnote). This is one reason a CTLE is usually wrapped with a VGA/AGC (Zhang slide 17).

> [!tip] Remark
> Integrated noise through $|H|^2$ is the noise-bandwidth calculation of [[Noise]], and the input pair's $4kT\gamma/g_m$ is the MOS channel-noise result there. Converting the resulting $\sigma$ to BER is [[Signaling and BER#One Slicer and One Gaussian]].

## Level 3: Decision-Feedback Equalization

### The DFE as a feedback FIR on decisions

```tikz title="DFE: past decisions drive a feedback FIR whose output is subtracted before the slicer. The loop marked in red must settle in 1 UI. After Palermo L8 slides 20 and 24, Payne (TI) and Hanumolu Fig. 28."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize] (y) at (0,0) {$y_k$};
  \node[draw,thick,circle,inner sep=1.5pt] (s) at (1.5,0) {$\Sigma$};
  \node[draw,thick,minimum width=1.3cm,minimum height=0.9cm,align=center,font=\scriptsize] (sl) at (3.6,0) {slicer\\(clocked)};
  \node[font=\scriptsize] (d) at (6.8,0) {$\hat d_k$};
  \draw[->,thick] (y) -- (s);
  \draw[->,thick] (s) -- (sl) node[midway,above,font=\scriptsize] {$z_k$};
  \draw[->,thick] (sl) -- (d);
  \foreach \i/\x in {1/5.6,2/4.1,3/2.6} {
    \node[draw,thick,font=\scriptsize] (z\i) at (\x,-1.4) {$z^{-1}$};
  }
  \draw[->,thick] (5.6,0) -- (z1);
  \draw[->,thick] (z1) -- (z2); \draw[->,thick] (z2) -- (z3);
  \foreach \i/\x in {1/5.6,2/4.1,3/2.6} {
    \node[draw,circle,inner sep=0.5pt,font=\scriptsize] (m\i) at (\x,-2.6) {$\times$};
    \draw[->] (z\i) -- (m\i);
    \node[right,font=\scriptsize] at (\x+0.2,-2.6) {$w_\i$};
  }
  \node[draw,thick,circle,inner sep=1pt] (fs) at (1.5,-2.6) {$\Sigma$};
  \draw[->] (m1) -- ++(0,-0.6) -| (fs);
  \draw[->] (m2) -- ++(0,-0.6);
  \draw[->] (m3) -- (fs);
  \draw[->,thick] (fs) -- (s) node[pos=0.85,right,font=\scriptsize] {$-$};
  \draw[red!70!black,very thick,dashed,rounded corners] (0.95,0.65) -- (6.3,0.65) -- (6.3,-3.45) -- (0.95,-3.45) -- cycle;
  \node[red!70!black,font=\scriptsize,align=left,anchor=west] at (6.5,-1.6) {1st-tap loop:\\$t_{clk\to Q}+t_{mux}+t_{sum}\le 1$ UI};
\end{circuitikz}
\end{document}
```

$$
\boxed{z_k = y_k - \sum_{i=1}^{N} w_i\,\hat d_{k-i},\qquad w_i = a_i\ \ \text{(post-cursors of the pulse response at the DFE input)}}
$$

- If every past decision is right, $\sum w_i\hat d_{k-i}$ is exactly the post-cursor ISI on bit $k$, and the subtraction removes it with **no high-frequency gain**: no noise or crosstalk is amplified (Palermo L8 slide 21; Hanumolu §6.5).
- **Set the taps to whatever post-cursors reach the DFE.** With no other equalization that is the raw channel's $[a_1,\dots,a_N]$. With an FFE or CTLE in front, it is the *equalized* pulse response. So the other equalizers can ignore every ISI term the DFE will take care of (Palermo L8 slide 22, a 2-tap DFE at 6 Gb/s on the refined backplane).
- A DFE helps against both kinds of ISI: dominant **positive** post-cursor ISI (loss) and dominant **negative** ISI (over-equalization, reflections) (Zhang slide 18).

> [!tip] Remark
> In the [[Discrete Signals and Systems#8. FIR vs IIR, and the general LCCDE|LCCDE]] picture a DFE is the feedback ($a_k$) half of an IIR filter, with a **slicer inside the loop**. That quantizer makes it nonlinear, and it is why it adds no noise: the fed-back $\hat d$ is a clean $\pm1$. It is still a loop in the sense of [[Feedback]]. What matters here is not phase margin but loop **latency**: the correction has to arrive before the next decision.

### Error propagation

- A wrong $\hat d_{k-i}$ subtracts ISI with the wrong sign, which **adds** $2w_i$ of ISI to the next bits and makes further errors more likely. So errors come in bursts.
- At link BERs ($\le10^{-12}$) the effect on BER is small (Palermo L8 slide 21; Hanumolu §6.5). The burst *structure* still matters to FEC. The cure, $1/(1+D)$ precoding, is owned by [[Signaling and BER#Precoding Against DFE Burst Errors]].

### The 1-UI critical path and loop unrolling

$$
\boxed{t_{clk\to Q,\,slicer} + t_{mux} + t_{summer} \le 1\ \text{UI}}
$$

- The first tap must sample, resolve, and subtract $w_1\hat d_{k-1}$ from the input before the next sample: one bit period. Payne's 6.25 Gb/s, 4-tap, half-rate TI DFE (tap 1 has 5 bits; taps 3–4 have 3 bits + sign) actually closes it in **½ UI**, so the CDR's edge samples also see the equalized signal (Palermo L8 slides 23–24).
- The summer must settle to better than about 95 % within that window. A resistive-load summer trades swing ($IR$) against settling ($RC$), which can mean large bias currents. An integrating summer removes the $RC$ settling and cuts bias current by about 3× (Palermo L8 slides 26–27, Park). Both are [[Receivers]] circuits.

```tikz title="Loop unrolling (speculation) for a 1-tap NRZ DFE: two slicers pre-subtract both possible values of the first-tap ISI, and the previous decision picks one with a mux. After Palermo L8 slide 25, Stojanovic Fig. 3(b) and Hanumolu Fig. 29."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \node[font=\scriptsize] (y) at (0,0) {$y_k$};
  \draw[thick] (y) -- (0.8,0);
  \draw[thick] (0.8,1.2) -- (0.8,-1.2);
  \node[draw,thick,minimum width=1.7cm,minimum height=0.8cm,align=center,font=\scriptsize] (a) at (2.6,1.2) {slicer\\thr. $+w_1$};
  \node[draw,thick,minimum width=1.7cm,minimum height=0.8cm,align=center,font=\scriptsize] (b) at (2.6,-1.2) {slicer\\thr. $-w_1$};
  \draw[->,thick] (0.8,1.2) -- (a); \draw[->,thick] (0.8,-1.2) -- (b);
  \draw[thick] (4.6,1.6) -- (5.4,1.0) -- (5.4,-1.0) -- (4.6,-1.6) -- cycle;
  \node[font=\scriptsize] at (5.0,0) {mux};
  \draw[->,thick] (a) -- (4.6,1.2);
  \draw[->,thick] (b) -- (4.6,-1.2);
  \node[font=\scriptsize] at (2.6,2.0) {$\hat d_k\,|\,\hat d_{k-1}=+1$};
  \node[font=\scriptsize] at (2.6,-2.0) {$\hat d_k\,|\,\hat d_{k-1}=-1$};
  \node[draw,thick,minimum width=0.9cm,minimum height=0.8cm,font=\scriptsize] (ff) at (6.6,0) {D Q};
  \draw[->,thick] (5.4,0) -- (ff) node[midway,above,font=\scriptsize] {$\hat d_k$};
  \draw[->,thick] (ff.east) -- (8.0,0) node[right,font=\scriptsize] {$\hat d_{k-1}$};
  \draw[->,thick] (7.4,0) -- (7.4,-2.2) -| (5.0,-1.3);
  \node[font=\scriptsize,align=left,anchor=west] at (0,-2.9) {$\hat d_k = \mathrm{sgn}(y_k-w_1)$ if $\hat d_{k-1}=+1$, \ $\mathrm{sgn}(y_k+w_1)$ if $\hat d_{k-1}=-1$};
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{unrolled } N \text{ taps: } 2^N \text{ slicers (NRZ)},\qquad 4^N \text{ slicer banks (PAM4)}}
$$

- Unrolling (Kasturia, "decision look-ahead") **removes the subtraction from the 1-UI loop**. What remains in the loop is a mux select, which is much faster.
- **Hardware grows exponentially**: practical designs unroll one tap, at most a few (Hanumolu §6.5; Palermo L8 slide 25). Half-rate clocking doubles the count again: for PAM4, Zhang counts 4 data slicers at full rate and 8 at half rate for one tap, and 16 / 32 for two taps (slide 56).
- **The critical path moves**, it does not vanish: with more taps, the second tap now has a timing constraint near 1 UI (Palermo 2011 §9.3.1). Unrolling also complicates timing recovery (§9.4).
- The two slicer thresholds $\pm w_1$ make the received NRZ signal look like **four levels** (a $1+D$-like partial response). That is why the same hardware is a PAM4 receiver: Stojanovic reuses the idle PAM4 LSB slicers to make a PAM2 receiver with 1-tap unrolled DFE at no extra front-end cost (Stojanovic §II-A, Fig. 4).

> [!note]- Detail: what the unrolled DFE does to the CDR (Stojanovic §II-C)
> Under a first post-cursor $h_1$ the transitions no longer cross zero at one time: $(1,1)\to(0,0)$-type and $(0,1)\to(1,0)$-type transitions form **two** crossing modes (Fig. 7). Bang-bang edge samplers then see a bimodal edge distribution. Stojanovic filters edges by the current, previous and one more past bit, and offsets the spare edge samplers by the trailing ISI, so that no transitions are wasted. Measured result: with a 1-tap DFE instead of full TX pre-emphasis, the recovered-clock dither fell from **14 ps to 5 ps** peak-to-peak, because the TX post-tap was barely engaged.
>
> This is the general "timing of ISI subtraction complicates CDR phase detection" con of the DFE (Palermo L7 slide 13). Baud-rate CDRs (Mueller–Müller) instead lock to a point defined *by* the cursors, e.g. $a_{-1}=a_1$, so the DFE and CDR adaptation interact: see [[Clocking and CDR]].

### IIR feedback for long tails

```tikz title="Smooth-channel tail: one FIR tap cancels H1, and a low-pass (IIR) feedback with decay e^(-t/tau), started at the 2nd post-cursor, cancels the rest. After Palermo L8 slides 30-31 (Liu ISSCC 2009) and Zhang slide 61."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \draw[->] (-1.4,0) -- (9,0) node[right,font=\scriptsize] {$t$ (UI)};
  \draw[->] (-1,-0.2) -- (-1,3.6);
  \draw[thick,blue!70!black] (-1,0) -- (-0.6,0);
  \draw[thick,blue!70!black] plot[smooth,tension=0.4] coordinates {(-0.6,0) (-0.25,1.2) (0,3.2) (0.5,1.9) (1,1.3) (2,0.8) (3,0.5) (4,0.32) (5,0.2) (6,0.13) (7,0.08) (8,0.05)};
  \foreach \x/\v in {0/3.2,1/1.3,2/0.8,3/0.5,4/0.32,5/0.2,6/0.13,7/0.08} {\fill (\x,\v) circle (1.6pt); \node[below,font=\tiny] at (\x,0) {\x};}
  \node[right,font=\scriptsize] at (0.1,3.25) {main cursor};
  \node[right,font=\scriptsize,red!70!black] at (1.1,1.4) {$H_1$: FIR tap};
  \draw[red!70!black,thick,domain=2:8,samples=30,dashed] plot (\x,{0.8*exp(-(\x-2)/2.1)});
  \node[font=\scriptsize,red!70!black,align=left,anchor=west] at (3.6,1.2) {$H_2e^{-(t-2)/\tau}$: one IIR (RC) tap\\cancels the whole tail};
\end{circuitikz}
\end{document}
```

- An FIR-feedback DFE cancels only as many post-cursors as it has taps. A 2-tap DFE leaves everything from the 3rd post-cursor on (Palermo L8 slide 29).
- Smooth channels (on-chip wires, silicon-carrier wires) have tails close to exponential. Liu's example channel loses 6 dB at DC and 17 dB at 5 GHz. There, a first-order low-pass in the feedback path, with time constant $\tau$ and amplitude adjustable, delayed 2 UI, replaces many taps (L8 slides 30–31, 34). It needs a **smooth** channel: reflections break the exponential.
- The same idea at the TX: Zhang's 25 dB channel goes from BER ≈ $2.5\times10^{-5}$ (3-tap TX FIR + CTLE + 2-tap DFE) to ≈ $2.2\times10^{-7}$ (3-tap TX FIR + 3-tap TX IIR + CTLE) (slide 62).

## Level 4: Partitioning FFE, CTLE and DFE

No single equalizer covers the whole pulse response cheaply. Each is good at one region of it:

| Pulse-response region | Best tool | Why not the others |
|---|---|---|
| Pre-cursors $a_{-1}, a_{-2}$ | TX FFE pre-tap (or RX FFE) | A DFE is causal, so it can't; a CTLE only through its one-zero shape |
| First post-cursors $a_1\dots a_N$ (large) | DFE | A TX FFE pays de-emphasis for every bit of $a_1$ it removes; a CTLE boosts noise |
| Long smooth tail | CTLE, or IIR DFE | An FIR DFE or FFE needs one tap per UI of tail |
| Reflections many UI later | Long-latency DFE / "reflection canceller", floating taps | A CTLE can't shape them; an FFE span is too short |

- **Order of operations:** CTLE first for the bulk loss and tail, then a short TX FFE (usually 1 pre-tap, 1 post-tap) for the pre-cursor and residual. The DFE takes whatever post-cursors are left. The DFE is set to the residual cursors, so the linear equalizers need not be tuned for them (Palermo L8 slide 22).
- **Why DFE beats TX FFE on $a_1$:** Stojanovic's 26-inch FR4 channel at 5 Gb/s. With TX equalization plus a 1-tap DFE the equalized pulse is about **60 mV (40 %) larger** than with full TX equalization, because the TX no longer spends swing on $a_1$. The BER-vs-margin curves show the same (Figs. 18–19). Palermo 2011 §9.3.2 gives the same reason for NRZ + DFE closing the gap to PAM4.
- **TX + RX together:** Hanumolu at 8 Gb/s. The RX equalizer *amplifies* the main cursor (about 0.3 V raw to about 0.5 V) and kills most post-cursor ISI. What remains is mostly the first pre- and post-cursor, so a 3-tap TX FFE finishes the job: 50 ps timing margin at ≥ 100 mV (Figs. 30–31).

```tikz title="TX + RX together, sampled pulse responses at 8 Gb/s: raw; after the RX equalizer (cursor amplified, the first pre/post-cursors left); after adding a 3-tap TX FFE. Values read approximately off Hanumolu Fig. 31."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small]
  \foreach \ox/\ttl/\vals in {0/{(a) raw}/{0.01,0.02,0.10,0.30,0.15,0.07,0.04,0.02},4.6/{(b) RX equalized}/{0.01,0.03,0.12,0.50,0.07,0.0,0.01,0.01},9.2/{(c) RX + TX FFE}/{0.0,0.0,0.0,0.32,0.0,0.0,0.01,0.0}} {
    \begin{scope}[xshift=\ox cm]
      \draw[->] (0,0) -- (4,0);
      \draw[->] (0,0) -- (0,2.9);
      \node[font=\scriptsize] at (2,3.15) {\ttl};
      \foreach \v [count=\i] in \vals {
        \draw[thick] ({0.45*\i},0) -- ({0.45*\i},{5*\v});
        \fill ({0.45*\i},{5*\v}) circle (1.5pt);
      }
    \end{scope}
  }
  \node[font=\scriptsize] at (6.9,-0.4) {time (bit periods); vertical: 1 cm = 0.2 V};
\end{circuitikz}
\end{document}
```

- **Zhang's 56G view (slide 55, 59):** analog receivers (TX FIR + CTLE/AGC + DFE, optionally an analog FFE) still win on power. ADC + DSP receivers (long FFE, e.g. 20 taps + 1-tap DFE, slide 60) win on flexibility and channel reach at the cost of complexity and power.

> [!tip] Remark
> Which mix is needed depends on the loss at $f_N$, and that depends on the modulation. Halving $f_N$ with PAM4 trades equalizer burden for a 9.5 dB eye penalty: the decision rule is [[Signaling and BER#NRZ or PAM4 the Loss-Slope Rule]].

## Level 5: Adaptation

### Why adapt

- Channels in one backplane differ widely (Stojanovic Fig. 1), and one channel's loss changes with temperature and humidity: a reported **10 → 20 dB at 3 GHz** (Sheets and D'Ambrosia, cited in Stojanovic §I).
- Fixed settings from lab measurements are sensitive to manufacturing and environment. Equalizers with many parameters can't be tuned by hand at all (Palermo L8 slide 36; Zhang slide 63).
- Three problems to solve: extracting an error signal, the algorithm and its hardware, and getting the update to the equalizer (for the TX, across the channel).

### LMS and sign-sign LMS

```tikz title="Adaptive equalizer with sign-sign LMS: a data slicer and an error slicer at threshold dLev. Their signs drive up/down counters that set the tap DACs, while a second loop adapts dLev itself. After Hanumolu Figs. 32-33, Palermo L8 slides 37-38 and Stojanovic Sec. II-B."
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth,font=\small,blk/.style={draw,thick,minimum height=0.85cm,align=center,font=\scriptsize,fill=white}]
  \node[font=\scriptsize] (x) at (0,0) {$x_k$};
  \node[blk,minimum width=1.8cm] (eq) at (2,0) {equalizer\\taps $w_n$};
  \node[blk] (ds) at (5,0.9) {data slicer\\thr. 0};
  \node[blk] (es) at (5,-0.9) {error slicer\\thr. $d_{Lev}$};
  \draw[->,thick] (x) -- (eq);
  \draw[->,thick] (eq) -- (3.4,0) |- (ds); \draw[->,thick] (3.4,0) |- (es);
  \node[blk] (xor) at (8,0) {$\mathrm{sign}(e_k)$\\$\times\,\mathrm{sign}(d_{k-n})$};
  \draw[->,thick] (ds) -| (xor.north) node[pos=0.25,above,font=\scriptsize] {$\hat d_k$};
  \draw[->,thick] (es) -| (xor.south) node[pos=0.25,below,font=\scriptsize] {$\mathrm{sign}(e_k)$};
  \node[blk] (cnt) at (8,-2.3) {up/down counter\\(integrator) per tap};
  \draw[->,thick] (xor) -- (cnt);
  \draw[->,thick] (cnt.south) -- (8,-3.3) -| (eq.south);
  \node[font=\scriptsize] at (5,-3.55) {tap DAC codes (or back-channel to TX)};
  \node[blk] (dl) at (5,-2.3) {$d_{Lev}$ loop};
  \draw[->,dashed] (cnt.west) -- (dl.east);
  \draw[->,dashed] (dl.north) -- (es.south);
\end{circuitikz}
\end{document}
```

$$
\boxed{\text{LMS: } w_n \leftarrow w_n + \mu\, e_k\, x_{k-n}\qquad\text{SS-LMS: } w_n \leftarrow w_n + \mu\,\mathrm{sign}(e_k)\,\mathrm{sign}(x_{k-n})\qquad e_k = \hat d_k - y_k}
$$

$$
\boxed{d_{Lev} \leftarrow d_{Lev} - \mu_{Lev}\,\mathrm{sign}(e_k)}
$$

- **LMS** is a stochastic gradient descent on the mean-square error. It needs analog multipliers of $e_k$ and $x_{k-n}$, both analog quantities.
- **Sign-sign LMS** keeps only signs. The product is an XOR, the integrator is an up/down counter, and there are no multipliers. It converges more slowly than LMS, which "in most serial-link applications ... is not a problem" (Hanumolu §8).
- For a TX FFE or DFE the "$x$" is the **data** (decisions $d_{k-n}$), so only the error needs a new slicer. Palermo's form: $w_{n+1}^k = w_n^k + \Delta_w\,\mathrm{sign}(d_{n-k})\,\mathrm{sign}(e_n)$ (L8 slide 38).
- **Training:** start on a known sequence, then switch to decision-directed operation, using the RX's own decisions as $\hat d$ (Hanumolu Fig. 33).

> [!note]- Derivation: LMS from steepest descent, and the sign convention
> Let $y_k = \sum_n w_nx_{k-n}$ and $e_k = \hat d_k - y_k$ (desired minus actual). The cost $J = E[e_k^2]$ has gradient
> $$\frac{\partial J}{\partial w_n} = -2E[e_k\,x_{k-n}].$$
> Steepest descent $w_n \leftarrow w_n - \tfrac{\mu}{2}\partial J/\partial w_n$, with the expectation replaced by the instantaneous product, gives $w_n \leftarrow w_n + \mu e_kx_{k-n}$. Taking signs of both factors gives SS-LMS: the step no longer scales with the error, so the taps dither by $\pm\mu$ around the optimum. That is why Stojanovic block-averages the sign products (127 updates) before stepping.
>
> **Sign check.** Hanumolu writes Eqs. (13)–(14) with a $+$ sign but defines $e_k = y_k-\hat d_k$. With that definition the update must be $-\mu$, or the loop runs away. Palermo/Stojanovic's $d_{Lev}\leftarrow d_{Lev}-\Delta\,\mathrm{sign}(e_n)$ is consistent only with $e_n = d_{Lev}-y_n$, so the convention above (desired minus actual, $+$ in the tap update) matches them. A tap that is *subtracted* (a DFE weight) flips the sign once more. When in doubt, check that the update reduces $e^2$.

> [!tip] Remark
> Each tap's update loop is an integrator (the counter) inside a negative-feedback loop, the first-order loop of [[Feedback#First-order loop]]. The step $\mu$ sets the loop bandwidth: large $\mu$ converges fast but dithers more. Two coupled loops (taps and $d_{Lev}$) must not fight, and Stojanovic finds the algorithm stable over a wide ratio of the two update rates (Fig. 22).

### The target level and the peak constraint (TX adaptation)

- The error needs a target $d_{Lev}$, but under the TX peak constraint the received amplitude depends on how much de-emphasis the channel needs. So $d_{Lev}$ is unknown in advance and is **adapted by a second loop** (Stojanovic §II-B1). The alternative, a VGA in front of the slicer that holds the levels constant, costs power.
- After each update, rescale the TX taps so that $\sum|w|$ equals the peak limit. This avoids the trivial solution where all taps and $d_{Lev}$ go to zero. Stojanovic computes the main-tap update from the other taps' updates plus the constraint instead of from its own error.
- **One adaptive sampler, data-filtered:** the error slicer sits at one level and updates fire only when the received data matches that level. This trades convergence time for hardware, and is what makes PAM4 adaptation cheap. $d_{Lev}$ locks in about **50 updates**, after which the taps converge (Stojanovic Fig. 21; Palermo L8 slide 38).
- **1-tap unrolled DFE:** lock $d_{Lev}$ alternately to the $(1,1)$ and $(0,1)$ levels (current, previous bit). The first trailing tap is half their difference, $h_1 = \tfrac12[d_{Lev}(1,1)-d_{Lev}(0,1)]$, and it sets the unrolled thresholds $\pm h_1$ (Stojanovic Fig. 6).

### Back-channel

- The TX taps are set by an RX measurement, so the updates have to travel back:
  - **Common-mode signaling** on the same differential pair. Palermo cites about 10 Mb/s. Stojanovic: 1–16 Mb/s, 12–100 mV swing, slow edges to keep the mode-converted crosstalk off the forward link, no measurable margin loss at 100 mV.
  - **Embedded in the reverse-direction data**, using spare code space in 8B10B (Stonick) (Palermo L8 slides 39–40).
- The back-channel can be very unreliable: a gradient sign is useful as long as its error rate is under 50 %. Stojanovic runs at up to 30 % packet error; that only slows adaptation (§III, IV-B).

### CTLE and DFE adaptation, eye monitors

| What is adapted | Error / monitor signal | Source |
|---|---|---|
| CTLE | Ratio of low- to high-frequency **power** of random data. For ideal NRZ, $\int_0^{f_m}s_x = \int_{f_m}^\infty s_x = \tfrac14$ with $f_m\approx0.28/T_b$; the imbalance drives a servo | Lee JSSC 2006 (L8 slide 41) |
| CTLE | Low- vs high-frequency **peak-to-peak amplitude**: equalized when they match | Uchiki ISSCC 2008 (L8 slide 42) |
| CTLE | Width of the **edge (crossing) distribution** from oversampling: minimize its standard deviation | Gerfers JSSC 2008 (L8 slide 43) |
| DFE (FIR) | 2× oversampled data + edge samples, SS-LMS (the same samples drive the CDR) | Payne JSSC 2005 (L8 slide 44) |
| DFE (IIR) | IIR amplitude and $\tau$ adapted | Huang ISSCC 2011 (L8 slide 45) |
| TX FFE, $d_{Lev}$, $h_1$ | One adaptive sampler with variable threshold and phase, data-filtered SS-LMS | Stojanovic JSSC 2005 |

> [!tip] Remark
> The $\tfrac14$–$\tfrac14$ split uses the random-NRZ PSD $s_x(f) = T_b\,\mathrm{sinc}^2(fT_b)$ from [[Signaling and BER#PSD of Random Data]]. Half the one-sided power lies below $0.28/T_b$.

- **Eye-opening monitor:** Stojanovic's adaptive sampler has a 9-bit threshold DAC and an adjustable phase. Sweeping both scans out the **pulse response** and a **statistical eye** as the slicer sees them, including RX bandwidth limits (Figs. 18, 20). It also stands in for any data or edge sampler while that sampler's 6-bit offset DAC is calibrated offline. One spare comparator therefore serves adaptation, link monitoring and offset calibration.
- Adapting a full receiver: Zhang's 56G example converges AGC and CTLE codes, a 5-tap FFE and a 5-tap DFE together (slide 63).

## Level 6: PAM4 Equalization

> [!tip] Remark
> PAM4 levels, Gray coding, the $\tfrac13$ eye, $R_{LM}$ and EH6/EW6 are owned by [[Signaling and BER]]. Here are only the equalizer consequences.

- **TX FFE:** filter the MSB and LSB streams separately and weight them 2:1 at the driver, or map to the 4-level symbol first and filter that (DSP). Both are linear, so they are equivalent if the 2:1 weighting is exact (Zhang slide 51). A 3-tap FFE produces $4^3=64$ distinct TX levels. Zhang's TX eye is "totally distorted" while the eye after the channel is open (slide 52).
- **CTLE:** works the same as for NRZ, usually with an AGC before or after it (Zhang slide 53). Everything before the slicers must stay **linear** over the full 4-level swing. A limiting stage that is harmless for NRZ compresses the outer PAM4 eyes ([[Nonlinearity and Mismatch]]).
- **DFE:** the feedback is $h_i\hat d_{k-i}$ with $\hat d\in\{\pm1,\pm3\}$, so the tap DAC needs 4 levels. Each slicer decision is a 3-threshold flash decision ([[Flash ADCs]]). Unrolling 1 tap takes 4 slicer banks, offset by $\{-3,-1,+1,+3\}h_1$. Unrolling 2 taps takes 16, with offsets $\pm h_1\pm h_2$ combinations up to $3h_1+3h_2$ (Zhang slide 56). PAM4 DFEs therefore unroll at most one tap.
- **Error propagation and FEC:** a wrong PAM4 decision feeds back the wrong level: an adjacent-level slip injects $2h_1$ of ISI into the next symbol, a $+3\leftrightarrow-3$ swap $6h_1$. Precoding $1/(1+D)$ mod 4 cuts the bursts down: see [[Signaling and BER#Precoding Against DFE Burst Errors]].
- **Adaptation:** the error slicer must track each level. Data-filtered updates (adapt only when the data sits at the level the error slicer is set to) make one adaptive sampler enough (Stojanovic §II-B). A dual-mode RX gets the 1-tap unrolled NRZ DFE for free from the PAM4 slicers.
- **ADC + DSP receivers** dominate long-reach PAM4: long digital FFEs (Zhang's 20-tap FFE + 1-tap DFE, slide 60), at the cost of ADC power (Zhang slide 55).

## What this implies for the circuit blocks

The equalization plan (how many TX taps, how much CTLE peaking, how many DFE taps, what adapts) becomes these circuit specs. Each row's owner note does the translation to amplifier specs and gm/ID sizing.

| Block | Spec handed down from this note | Set by | Owner note |
|---|---|---|---|
| **TX FFE driver** | $\sum|w_k|\le1$ at full swing; tap count and span; 4–6 bit tap resolution; levels: 8 (NRZ, 3 taps) or 64 (PAM4); 2:1 MSB/LSB weighting accuracy | Driver headroom and termination match (tail sources in saturation), segmented vs direct-FIR DAC, pre-driver power | [[Transmitters]], [[DACs]] |
| **CTLE / VGA** | $\omega_z$, peaking $=1+g_mR_S/2$ (dB range and step), $\omega_{p2}$ above $f_N$, DC gain, input linear range (PAM4!), output noise $\int|H|^2S_{in}$ | Degeneration $R_S, C_S$ tuning; $g_mR_D$; load pole $R_DC_p$; bandwidth extension (inductive peaking) | [[Receivers]], [[High-Speed Circuit Techniques]] |
| **DFE summer** | Settle to >95 % in < 1 UI minus $t_{clk\to Q}$; swing large enough for the slicer; tap DAC range $\ge|h_1|$ and resolution | $IR$ vs $RC$ (resistive) or $T/C$ (integrating) summer; tap current DACs | [[Receivers]] |
| **Slicers** | $t_{clk\to Q}$ inside the 1-UI loop; offset small against the equalized eye (or calibrated); count: $2^N$/$4^N$ if unrolled, 3 per bank for PAM4 | Regeneration time constant, offset calibration DAC, metastability | [[Comparators]], [[Receivers]] |
| **Error / adaptive sampler** | Programmable threshold $d_{Lev}$ (Stojanovic: 9-bit) and phase; same aperture as data slicers | Threshold DAC, phase interpolator | [[Receivers]], [[Clocking and CDR]] |
| **CDR** | Phase detector that tolerates or uses the DFE-shaped edges (edge filtering, Mueller–Müller lock to cursors); DFE first tap closed early enough for edge samples | PD type, edge filtering | [[Clocking and CDR]] |
| **Back-channel** | ~10 Mb/s, tens of mV of common-mode swing, slow edges; tolerant of high error rates | CM driver/receiver, AC-coupling caps | [[Transmitters]], [[Receivers]] |
| **ADC (DSP RX)** | Sample rate = baud rate, resolution 4–6 b class (Harwood: 4.5 b at 12.5 GS/s) | Flash / interleaved SAR | [[Flash ADCs]], [[ADCs]] |

Three rules that fall out of the note:

1. **Equalize with gain where the noise is low, and with decisions where it is not.** The CTLE is the cheapest loss compensation, but every dB of peaking is a dB of high-frequency noise and crosstalk gain. Let the DFE take $h_1$ and the tap TX FFE take the pre-cursor.
2. **The DFE's first tap is a timing spec, not a gain spec.** $t_{clk\to Q}+t_{mux}+t_{sum}\le1$ UI sets slicer speed, summer settling current, and whether to unroll. Unrolling moves the problem into slicer count and power.
3. **Leave a monitor.** One spare sampler with programmable threshold and phase adapts the taps, calibrates offsets, and scans the eye. That is the "calibration knob" a fixed design lacks when the channel moves by 10 dB.

## Design intuition / trade-offs

| Knob | Improves | Costs |
|---|---|---|
| More TX de-emphasis | Flatter response, less ISI | Lower received swing (DC down to the Nyquist level), more launch swing for the same eye means more crosstalk |
| More TX taps | Longer span, pre-cursor coverage | Little gain past 2 taps (peak constraint); flops, pre-driver power, output $C$ |
| More CTLE peaking ($R_S\uparrow$) | Cancels more loss, pre-cursor and long tail | Lower DC gain, noise and crosstalk amplified, PVT sensitivity, later-stage noise referred up |
| Lower CTLE zero ($C_S\uparrow$) | Shapes for the long tail at lower frequency | Both $\omega_z$ and $\omega_{p1}$ move; mismatch with the channel's $\sqrt f$ + $f$ loss shape |
| RX FFE (analog) | Pre + post cancel, adaptive, gain | Analog delay lines, tap precision, noise boost |
| RX FFE (ADC + DSP) | Long, flexible equalizers, reach | ADC and DSP power (Harwood 330 mW; older 1.2 W at 2.3 Gb/s) |
| More DFE taps | Cancels more post-cursors, no noise boost | Summer loading, tap DACs, longer loops; still nothing on pre-cursor |
| DFE loop unrolling | Removes subtraction from the 1-UI loop | $2^N$ / $4^N$ slicers and power, mux in the loop, harder CDR |
| IIR DFE | Whole smooth tail with one tap | Needs a reflection-free channel |
| Adaptation (SS-LMS) | Tracks channel, PVT, temperature; no manual search | Error sampler, counters, back-channel for TX, convergence time |
| Bigger step $\mu$ | Faster convergence | More tap dither (noise on the equalizer) |
| PAM4 | Half $f_N$, less loss to equalize | 4-level DFE feedback, $4^N$ unrolling, linearity of every pre-slicer stage, $\tfrac13$ eye |

## Cheat sheet

| Quantity | Equation |
|---|---|
| Equalization goal | $\lvert HH_{EQ}\rvert\approx$ const to $f_N=1/2T$; $(h*h_{EQ})[k]\approx\delta[k-D]$ |
| FIR response | $W(e^{j2\pi fT})=\sum w_ke^{-j2\pi fkT}$; $W(0)=\sum w_k$; $W(f_N)=\sum(-1)^kw_k$ |
| TX peak constraint | $\sum\lvert w_k\rvert\le1$ ($I\sum\lvert C_i\rvert R_T = IR_T$) |
| De-emphasis | $-20\log_{10}\lvert\sum w_k\rvert$ dB |
| Zero-forcing LS taps | $\mathbf w_{ls}=(\mathbf H^T\mathbf H)^{-1}\mathbf H^T\mathbf y_{des}$, then $\div\sum\lvert w_{ls}\rvert$ |
| RX FFE | $z_k=\sum_nc_ny_{k-n}$ |
| CTLE | $A_{DC}\frac{1+s/\omega_z}{(1+s/\omega_{p1})(1+s/\omega_{p2})}$, peaking $\omega_{p1}/\omega_z$ |
| Degenerated pair | $\omega_z=\frac1{R_SC_S}$, $\omega_{p1}=\frac{1+g_mR_S/2}{R_SC_S}$, $\omega_{p2}=\frac1{R_DC_p}$, $A_{DC}=\frac{g_mR_D}{1+g_mR_S/2}$, $A_{pk}=g_mR_D$ |
| Passive CTLE | $\omega_z=\frac1{R_1C_1}$, $\omega_p=\frac1{(R_1\parallel R_2)(C_1+C_2)}$, $A_{DC}=\frac{R_2}{R_1+R_2}$, $A_{HF}=\frac{C_1}{C_1+C_2}$ |
| Noise enhancement | $\overline{v^2_{on}}=\int\lvert H\rvert^2S_{in}df$, $S_{in}=4kT\gamma/g_m$ |
| DFE | $z_k=y_k-\sum_{i=1}^Nw_i\hat d_{k-i}$, $w_i=a_i$ (at DFE input) |
| DFE timing | $t_{clk\to Q}+t_{mux}+t_{sum}\le1$ UI |
| Unrolling | $2^N$ slicers (NRZ), $4^N$ banks (PAM4); 1-tap thresholds $\pm w_1$ |
| LMS | $w_n\leftarrow w_n+\mu e_kx_{k-n}$, $e_k=\hat d_k-y_k$ |
| SS-LMS | $w_n\leftarrow w_n+\mu\,\mathrm{sign}(e_k)\mathrm{sign}(x_{k-n})$ |
| Level loop | $d_{Lev}\leftarrow d_{Lev}-\mu_{Lev}\mathrm{sign}(e_k)$ |
| Unrolled $h_1$ estimate | $h_1=\tfrac12[d_{Lev}(1,1)-d_{Lev}(0,1)]$ |
| PSD CTLE servo | $\int_0^{f_m}s_x=\int_{f_m}^\infty s_x=\tfrac14$, $f_m\approx0.28/T_b$ |

## References

- **S. Palermo, ECEN720 Lecture 7, "Equalization Introduction & TX FIR Eq"**, Spring 2025 (`lecture7_ee720_eq_intro_txeq.pdf`): slides 5–8 (link with equalization, channel impact, the equalization goal), 9–13 (TX FIR, RX FIR, CTLE, DFE pros and cons), 14 (equalization effectiveness), 17–18 (TX FIR in time and frequency, 14.4 dB example), 19–23 (least-squares "MMSE" taps, lone-pulse example, normalization, tap resolution). Slides 24–36 (direct FIR vs segmented DAC, voltage-mode and impedance-modulated FFE drivers) are left to [[Transmitters]].
- **S. Palermo, ECEN720 Lecture 8, "RX FIR, CTLE, DFE, & Adaptive Eq."** (`lecture8_ee720_rx_adaptive_eq.pdf`): slides 6–10 (RX FIR, noise enhancement, analog and digital FIR, Harwood), 13–17 (passive and active CTLE, tuning), 20–25 (DFE, example, Payne critical path, loop unrolling), 29–31, 34 (FIR vs IIR feedback, smooth channel), 36–45 (adaptation: error extraction, SS-LMS, $d_{Lev}$, back-channels, CTLE tuning by PSD/amplitude/edges, DFE tuning), 47–48 (modulation, multitone; one line here). Slides 26–27 and 32–33 (resistive and integrating summers, merged summer/slicer circuits) are given one line and left to [[Receivers]].
- **P. K. Hanumolu, G.-Y. Wei, U.-K. Moon, "Equalizers for High-Speed Serial Links,"** Int. J. High Speed Electronics and Systems 15(2), 2005, pp. 429–458 (`hslink_eq_overview_hanumolu_jhses05.pdf`, scanned; read as images): §4 Fig. 9 (two ways to equalize), §5 Figs. 10–13 and Eq. (2) (TX pre-emphasis, peak constraint, limitations), §6.1–6.2 Figs. 14–19 (digital and analog RX FIR), §6.3 Eqs. (3)–(11), Figs. 21–26 (passive and active CTLE, worked values), §6.4 Eq. (12) (noise enhancement), §6.5 Figs. 28–29 (DFE, look-ahead), §7 Figs. 30–31 (TX + RX), §8 Eqs. (13)–(14), Figs. 32–33 (LMS, SS-LMS, training; sign convention corrected above). §2–3 (channel modeling, worst-case eye) are left to [[Channels]].
- **V. Stojanović et al., "Autonomous Dual-Mode (PAM2/4) Serial Link Transceiver With Adaptive Equalization and Data Recovery,"** IEEE JSSC 40(4), 2005 (`adaptive_eq_stojanovic_jssc_2005.pdf`): §I (channel variation), §II (adaptive sampler, offset calibration, dual-mode loop-unrolled DFE Figs. 3–4, dual-loop SS-LMS Eqs. (1)–(2), peak-constraint rescaling, $h_1$ extraction Fig. 6, CDR edge filtering Figs. 7–8), §III (common-mode back-channel; circuit details left to [[Transmitters]]/[[Receivers]]), §IV (Figs. 18–22: pulse responses, 40 % larger pulse with 1-tap DFE, CDR dither, convergence; back-channel error tolerance).
- **S. Palermo, "High-Speed Serial I/O Design for Channel-Limited and Power-Constrained Systems,"** Ch. 9 in *High-Speed Circuits* (Iniewski ed.), 2011 (`serial_links_chapter_palermo_2011.pdf`): §9.3.1 pp. 302–305, Figs. 9.16–9.19 (equalization systems), §9.3.2 pp. 305–306 (PAM4 vs NRZ+DFE), §9.4 p. 309 (low-power equalization: unrolling cost, CTLE noise and DC gain < 1).
- **H. Zhang et al., "PAM4 Signaling for 56G Serial Link Applications – A Tutorial,"** DesignCon 2016 (`slides-pam4signalingfor56gserial-zhang-designcon.pdf`): slides 15–19 (ISI, TX de-emphasis coefficient rules, CTLE, DFE positive/negative ISI, equalization goals), 51–53 (PAM4 TX FIR, 64 levels, CTLE + AGC), 55–63 (analog vs DSP RX, PAM4 tap-unrolled DFE, FFE + DFE, analog FFE delay lines, 20-tap FFE, IIR DFE, TX IIR 25 dB example, adaptation). Slide 54 (EH6/EW6) is left to [[Signaling and BER]].
- **Vault:** [[Channels]] (cursors, worst-case eye), [[Signaling and BER]] (PSD, loss-slope rule, precoding), [[Link Noise and Jitter]] (ISI jitter), [[Frequency Response]] (Bode rules), [[Feedback]] (first-order loop), [[Discrete Signals and Systems]] §8, [[Z-Transform]], [[System Defintiions]] §10.
