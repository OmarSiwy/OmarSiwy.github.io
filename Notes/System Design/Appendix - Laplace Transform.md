---
tags: [ece380, control-systems, appendix]
---
> [[Notes/System Design/Overview]] · Appendix

# Appendix · Laplace Transform

$F(s)=\int_{0^-}^\infty f(t)e^{-st}dt$.

| $f(t)$ | $F(s)$ |
|---|---|
| $\delta(t)$ | $1$ |
| $H(t)$ (step) | $1/s$ |
| $e^{-at}$ | $1/(s+a)$ |
| $\sin\omega t$ | $\omega/(s^2+\omega^2)$ |
| $\cos\omega t$ | $s/(s^2+\omega^2)$ |

Properties: linearity; delay $\mathcal L\{f(t-\tau)\}=e^{-\tau s}F(s)$; shift $\mathcal L\{e^{at}f\}=F(s-a)$; derivative $\mathcal L\{\dot f\}=sF(s)-f(0^-)$; $\mathcal L\{tf\}=-\frac{dF}{ds}$; convolution $\mathcal L\{f*g\}=F(s)G(s)$.

> [!definition] Initial & Final Value Theorems
> $\lim_{t\to0}f(t)=\lim_{s\to\infty}sF(s)$;  $\lim_{t\to\infty}f(t)=\lim_{s\to0}sF(s)$ (final value valid only if poles of $sF(s)$ are in the LHP). These give steady-state values without inverting.

---
[[6 - State Feedback Control]] · [[Notes/System Design/Overview]]
