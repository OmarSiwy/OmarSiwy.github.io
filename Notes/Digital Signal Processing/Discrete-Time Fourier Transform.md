---
tags: [dsp, ece313]
---
# Discrete-Time Fourier Transform (DTFT)

Related: [[Z-Transform]], [[Pole-Zero Plots]], [[System Defintiions]]

$$X(e^{j\omega}) = \sum_{n=-\infty}^{\infty} x[n]e^{-j\omega n}, \qquad x[n] = \frac{1}{2\pi}\int_{-\pi}^{\pi} X(e^{j\omega})e^{j\omega n}\,d\omega$$

$X(e^{j\omega})$ is just $X(z)$ evaluated on the unit circle, $z=e^{j\omega}$ — it only exists if the Z-transform's ROC includes the unit circle (equivalently, $x[n]$ absolutely/square summable).

## 1. Properties / Rules

| # | Property | Time domain | Frequency domain |
|---|---|---|---|
| 1 | Periodicity | — | $X(e^{j\omega})$ is periodic with period $2\pi$ |
| 2 | Linearity | $ax_1[n]+bx_2[n]$ | $aX_1(e^{j\omega})+bX_2(e^{j\omega})$ |
| 3 | Time shift | $x[n-n_0]$ | $e^{-j\omega n_0}X(e^{j\omega})$ |
| 4 | Frequency shift (modulation) | $e^{j\omega_0 n}x[n]$ | $X(e^{j(\omega-\omega_0)})$ |
| 5 | Time reversal | $x[-n]$ | $X(e^{-j\omega})$ |
| 6 | Conjugation | $x^*[n]$ | $X^*(e^{-j\omega})$ |
| 7 | Conjugate symmetry (real $x[n]$) | — | $X(e^{-j\omega}) = X^*(e^{j\omega})$; $\lvert X\rvert$ even, $\angle X$ odd |
| 8 | Differentiation in frequency | $n x[n]$ | $j\dfrac{dX(e^{j\omega})}{d\omega}$ |
| 9 | Convolution | $x_1[n]*x_2[n]$ | $X_1(e^{j\omega})X_2(e^{j\omega})$ |
| 10 | Multiplication (windowing) | $x_1[n]x_2[n]$ | $\dfrac{1}{2\pi}X_1(e^{j\omega}) \circledast X_2(e^{j\omega})$ (periodic convolution) |
| 11 | Parseval's relation | $\sum_n \lvert x[n]\rvert^2$ | $\dfrac{1}{2\pi}\int_{-\pi}^{\pi}\lvert X(e^{j\omega})\rvert^2 d\omega$ |

- **Eigenfunction rule:** for a stable LTI system, $e^{j\omega n} \to H(e^{j\omega})e^{j\omega n}$; $H(e^{j\omega})$ is the frequency response.
- Only amplitude/phase change through an LTI system — frequency never changes (that would mean nonlinear).
- **Phase wrapping:** principal value returned by numerical tools is $-\pi \le \text{ARG}[H] < \pi$; unwrap before differentiating.
- Downsampling/upsampling (not covered here) stretch/compress $\omega$ — see [[System Defintiions]] if that comes up.

## 2. Common Transform Pairs

| Sequence $x[n]$ | $X(e^{j\omega})$ |
|---|---|
| $\delta[n]$ | $1$ |
| $\delta[n-n_0]$ | $e^{-j\omega n_0}$ |
| $1$ (all $n$) | $2\pi\sum_{k=-\infty}^{\infty}\delta(\omega-2\pi k)$ |
| $e^{j\omega_0 n}$ | $2\pi\sum_{k=-\infty}^{\infty}\delta(\omega-\omega_0-2\pi k)$ |
| $\cos(\omega_0 n)$ | $\pi\sum_{k}\big[\delta(\omega-\omega_0-2\pi k)+\delta(\omega+\omega_0-2\pi k)\big]$ |
| $\sin(\omega_0 n)$ | $\dfrac{\pi}{j}\sum_{k}\big[\delta(\omega-\omega_0-2\pi k)-\delta(\omega+\omega_0-2\pi k)\big]$ |
| $a^n u[n]$, $\lvert a\rvert<1$ | $\dfrac{1}{1-ae^{-j\omega}}$ |
| $-a^n u[-n-1]$, $\lvert a\rvert>1$ | $\dfrac{1}{1-ae^{-j\omega}}$ |
| $na^n u[n]$, $\lvert a\rvert<1$ | $\dfrac{ae^{-j\omega}}{(1-ae^{-j\omega})^2}$ |
| $u[n]$ | $\dfrac{1}{1-e^{-j\omega}} + \pi\sum_k \delta(\omega-2\pi k)$ |
| $\dfrac{\sin(\omega_c n)}{\pi n}$ (ideal LPF, cutoff $\omega_c$) | rectangular pulse: $1$ for $\lvert\omega\rvert<\omega_c$, else $0$ (one period) |
| rectangular pulse, length $N$ ($1$ for $0\le n\le N-1$) | $e^{-j\omega(N-1)/2}\dfrac{\sin(\omega N/2)}{\sin(\omega/2)}$ |

ponytail: standard first-course pair list — add a row here when a problem needs a pair not listed, don't pre-build every exotic case.
