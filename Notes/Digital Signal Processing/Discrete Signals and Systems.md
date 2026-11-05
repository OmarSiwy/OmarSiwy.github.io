---
source: "[[ref/section1.pdf]]"
tags: [dsp, ece313]
---
# Discrete Signals and Systems (Section 1)

Related: [[Z-Transform]], [[Discrete-Time Fourier Transform]], [[System Defintiions]]

## 1. Signals basics
- $s[n] = s(t)\big|_{t=nT}$, sampling period $T$, sampling frequency $F_s = 1/T$.
- **Energy:** $\mathcal{E}_x = \sum_n |x[n]|^2$. **Power:** $\mathcal{P}_x = \lim_{L\to\infty}\frac{1}{2L+1}\sum_{n=-L}^{L}|x[n]|^2$.
  - Finite-duration signal $\Rightarrow$ $\mathcal{E}_x$ finite, $\mathcal{P}_x = 0$.

## 2. Elementary sequences
- Unit sample: $\delta[n] = 1$ if $n=0$, else $0$.
- Unit step: $u[n] = \sum_{k=-\infty}^{n}\delta[k]$ (1 for $n\ge0$).
- Sinusoid: $x[n]=A\cos(\omega_0 n+\varphi)$.
- Complex exponential: $Ae^{j\omega_0 n} = A\cos(\omega_0 n)+jA\sin(\omega_0 n)$.

## 3. Periodicity (watch for this on exams)
- $x[n]$ periodic with period $N$ iff $x[n]=x[n+N]$ for all $n$.
- A **discrete sinusoid is periodic only if** $\omega_0 N = 2\pi k$ for some integers $N,k$ — i.e. $\omega_0/2\pi$ is **rational**. (Unlike continuous-time, not every discrete sinusoid is periodic.)
- For a given $N$, there are exactly $N$ distinct sinusoid frequencies: $\omega_k = \dfrac{2\pi k}{N}$, $k=0,\dots,N-1$.

## 4. System properties (check all four when ID'ing a system)
| Property | Definition | Test example |
|---|---|---|
| **Causal** | $y[n_0]$ depends only on $x[n]$, $n\le n_0$ | $y[n]=\frac13(x[n]+x[n-1]+x[n-2])$ causal; median filter using $x[n+1]$ is not |
| **BIBO stable** | $\lvert x[n]\rvert \le M_x < \infty \Rightarrow \lvert y[n]\rvert \le M_y <\infty$ | moving average stable; running sum $\sum_{k=-\infty}^n x[k]$ not stable |
| **Linear** | $\mathcal{H}\{a_1x_1+a_2x_2\} = a_1\mathcal{H}\{x_1\}+a_2\mathcal{H}\{x_2\}$ | $y[n]=x[n]-x[n-1]$ linear; $y[n]=x[n]^2$ not |
| **Time-invariant (TI)** | $y[n]=\mathcal{H}\{x[n]\} \Rightarrow y[n-n_0]=\mathcal{H}\{x[n-n_0]\}$ | $y[n]=\cos(x[n])$ is TI; $y[n]=\sum_n x[n]w[n]$ (fixed weights $w[n]$) is not |

- **Folding ≠ shifting commute:** $x[n]\xrightarrow{\text{shift }n_0}x[n-n_0]\xrightarrow{\text{fold}}x[-n-n_0] \ne x[n]\xrightarrow{\text{fold}}x[-n]\xrightarrow{\text{shift}}x[-n+n_0]$. Order matters.

## 5. Impulse response & convolution
- $x[n] = \sum_{k} x[k]\delta[n-k]$ (impulse decomposition).
- Impulse response: $h[n] = \mathcal{H}\{\delta[n]\}$.
- **If $\mathcal{H}$ is LTI:** $y[n] = \mathcal{H}\{x[n]\} = \sum_k x[k]h[n-k] = x[n]*h[n]$ — this is *the* reason LTI systems are special: fully characterized by $h[n]$.
- Convolution sum: $y[n]=\sum_k x[k]h[n-k]$. By hand: flip one sequence, shift, multiply, sum (see worked example in PDF p.21).
- For finite sequences of length $N$ and $M$: $y[n]=0$ for $n<0$ and $n \ge N+M-1$ (output length $= N+M-1$).
- `conv(x,h)` = full convolution; `conv(x,h,'same')` = length-N; `conv(x,h,'valid')` = full-overlap only. Convolution = multiplication by a Toeplitz matrix.

## 6. LTI system properties (useful for simplifying block diagrams)
| Property | Formula |
|---|---|
| Identity | $x[n]*\delta[n] = x[n]$ |
| Delay | $x[n]*\delta[n-n_0] = x[n-n_0]$ |
| Commutative | $x[n]*h[n] = h[n]*x[n]$ |
| Associative | $(x*h_1)*h_2 = x*(h_1*h_2)$ — cascaded systems combine as $h[n]=h_1[n]*h_2[n]$ |
| Distributive | $x*(h_1+h_2) = x*h_1 + x*h_2$ — parallel systems combine as $h[n]=h_1[n]+h_2[n]$ |

## 7. Causality & stability of LTI systems (in terms of $h[n]$)
- **Causal** $\iff$ $h[n]=0$ for $n<0$.
- **BIBO stable** $\iff$ $h[n]$ absolutely summable: $\sum_n |h[n]| < \infty$.
  - Example: $h[n]=ba^n u[n]$ is stable iff $\lvert a\rvert < 1$ (geometric series).

## 8. FIR vs IIR, and the general LCCDE
$$y[n] = -\sum_{k=1}^{N} a_k y[n-k] + \sum_{k=0}^{M} b_k x[n-k]$$
- $\{a_k\}$ = feedback coefficients, $\{b_k\}$ = feedforward coefficients. $N$ = **order** of the system.
- $N=0$ (no feedback) $\Rightarrow$ $y[n]=(x*h)[n]$ with $h[n]=b_n$, finite length $\Rightarrow$ **FIR** (finite impulse response), automatically causal and stable.
- $N>0$ $\Rightarrow$ **IIR** (infinite impulse response), computed **recursively** (needs past outputs). E.g. $h[n]=ba^nu[n]$ gives $y[n]=bx[n]+ay[n-1]$.
- Moving average $y[n]=\frac{1}{M+1}\sum_{k=0}^{M}x[n-k]$ is FIR but has an equivalent recursive form: $y[n]=y[n-1]+\frac{1}{M+1}(x[n]-x[n-M-1])$.
- Real-time FIR filtering = stream processing (shift register of past inputs × coefficients); the input-to-output delay is the **latency**.

## 9. Why this all matters (motivation for Z-transform)
Given an LCCDE, we want to: confirm LTI, find $h[n]$ analytically, find $y[n]$ for a given $x[n]$, and check BIBO stability from $\{a_k,b_k\}$ — all of this is what the [[Z-Transform]] is built to do cleanly.

ponytail: trimmed slide fluff (DSP application lists, ADC/DAC block diagrams, echo/reverb motivation) — only the definitions/rules you'd actually be tested on are here; ping me if you need the applications list back.
