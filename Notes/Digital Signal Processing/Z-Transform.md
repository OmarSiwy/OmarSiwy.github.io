---
tags: [dsp, ece313]
---
# Z-Transform

Related: [[Discrete-Time Fourier Transform]], [[Pole-Zero Plots]], [[System Defintiions]]

$$X(z) = \sum_{n=-\infty}^{\infty} x[n]z^{-n}, \qquad z = re^{j\omega}$$

## 1. Properties / Rules

| # | Property | Time domain | Z-domain | ROC |
|---|---|---|---|---|
| 1 | Linearity | $ax_1[n]+bx_2[n]$ | $aX_1(z)+bX_2(z)$ | at least $ROC_1 \cap ROC_2$ |
| 2 | Time shift | $x[n-n_0]$ | $z^{-n_0}X(z)$ | same as $X(z)$ (except possibly $z=0,\infty$) |
| 3 | Scaling in z (modulation) | $a^n x[n]$ | $X(z/a)$ | $\lvert a\rvert \cdot ROC$ |
| 4 | Time reversal | $x[-n]$ | $X(1/z)$ | $1/ROC$ (inverted) |
| 5 | Conjugation | $x^*[n]$ | $X^*(z^*)$ | same as $X(z)$ |
| 6 | Differentiation in z | $n x[n]$ | $-z\dfrac{dX(z)}{dz}$ | same as $X(z)$ (except possibly endpoints) |
| 7 | Convolution | $x_1[n]*x_2[n]$ | $X_1(z)X_2(z)$ | at least $ROC_1 \cap ROC_2$ |
| 8 | Initial value (causal $x[n]$) | $x[0]$ | $\lim_{z\to\infty}X(z)$ | — |
| 9 | Final value theorem | $\lim_{n\to\infty}x[n]$ | $\lim_{z\to 1}(z-1)X(z)$ | poles of $(z-1)X(z)$ inside unit circle |

- **Eigenfunction rule:** for a stable LTI system, $z^n \to H(z)z^n$; $H(z)$ is the transfer function.
- **ROC never contains a pole.** ROC is a ring/disk/annulus bounded by poles.
- **Causal** sequence $\Rightarrow$ ROC is the exterior of the outermost pole (including $\infty$).
- **Anti-causal** sequence $\Rightarrow$ ROC is the interior of the innermost pole (including $0$).
- **Two-sided/stable** sequence $\Rightarrow$ ROC is an annulus between two poles.
- **Stability** $\Leftrightarrow$ ROC includes the unit circle $\lvert z\rvert=1$.
- $X(z)$ relates to the DTFT by $X(e^{j\omega}) = X(z)\big|_{z=e^{j\omega}}$, valid only if the unit circle is inside the ROC.

## 2. Common Transform Pairs

| Sequence $x[n]$ | $X(z)$ | ROC |
|---|---|---|
| $\delta[n]$ | $1$ | all $z$ |
| $\delta[n-n_0]$ | $z^{-n_0}$ | all $z$ except $0$ (or $\infty$) |
| $u[n]$ | $\dfrac{1}{1-z^{-1}}$ | $\lvert z\rvert > 1$ |
| $-u[-n-1]$ | $\dfrac{1}{1-z^{-1}}$ | $\lvert z\rvert < 1$ |
| $a^n u[n]$ | $\dfrac{1}{1-az^{-1}}$ | $\lvert z\rvert > \lvert a\rvert$ |
| $-a^n u[-n-1]$ | $\dfrac{1}{1-az^{-1}}$ | $\lvert z\rvert < \lvert a\rvert$ |
| $n a^n u[n]$ | $\dfrac{az^{-1}}{(1-az^{-1})^2}$ | $\lvert z\rvert > \lvert a\rvert$ |
| $-na^n u[-n-1]$ | $\dfrac{az^{-1}}{(1-az^{-1})^2}$ | $\lvert z\rvert < \lvert a\rvert$ |
| $a^n \cos(\omega_0 n)u[n]$ | $\dfrac{1-a\cos(\omega_0)z^{-1}}{1-2a\cos(\omega_0)z^{-1}+a^2z^{-2}}$ | $\lvert z\rvert > \lvert a\rvert$ |
| $a^n \sin(\omega_0 n)u[n]$ | $\dfrac{a\sin(\omega_0)z^{-1}}{1-2a\cos(\omega_0)z^{-1}+a^2z^{-2}}$ | $\lvert z\rvert > \lvert a\rvert$ |
| $\dfrac{a^n}{n!} u[n]$, finite length/polynomial cases | case-by-case | $\lvert z\rvert > 0$ |
| $-\dfrac{(-a)^n}{n} u[n-1]$ (series form) | $\ln\!\left(\dfrac{1}{1-az^{-1}}\right)$ | $\lvert z\rvert > \lvert a\rvert$ |

ponytail: table covers the standard first-course pair list, not every exotic sequence — add rows when a specific problem needs a pair not here.
