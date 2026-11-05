---
source: "[[ref/section4.pdf]]"
tags: [dsp, ece313]
---
# Transform Analysis of LTI Systems (Section 4)

Related: [[Z-Transform]], [[Discrete-Time Fourier Transform]], [[Pole-Zero Plots]]

## 1. Frequency response basics
- **Eigenfunction rule:** for a stable LTI system, $e^{j\omega n} \to H(e^{j\omega})\,e^{j\omega n}$. The frequency response is $H(e^{j\omega}) = H(z)\big|_{z=e^{j\omega}}$.
- **Sinusoid in, same sinusoid out:** $A\cos(\omega n+\phi) \to |H|A\cos(\omega n+\phi+\angle H)$. An LTI system can only change amplitude and phase. **If the frequency changes, the system is nonlinear.**
- **Getting H from an LCCDE:** substitute $x=e^{j\omega n}$ and $y=He^{j\omega n}$, then solve for $H$.
  - Example: $y[n]=ay[n-1]+bx[n] \Rightarrow H=\dfrac{b}{1-ae^{-j\omega}}$

## 2. Phase wrapping
- Phase is only defined up to $2\pi m$. Numerical tools return the **principal value** $-\pi \le \text{ARG}[H] < \pi$.
- The jumps you see in a wrapped phase plot are exactly $2\pi m$. They are artifacts, not real behaviour. Unwrap the phase ($\Psi(\omega)$) before taking derivatives.

## 3. Input/output relations
- **Periodic input** (period $N$): the output is periodic with the same $N$, and $c_k^y = H(e^{j2\pi k/N})\,c_k^x$.
- **Aperiodic input:** $Y = HX$, so **magnitudes multiply and phases add**.
- **Power gain** is $|H|^2$ (from Parseval).
- **Gain in dB:** $10\log_{10}|H|^2 = 20\log_{10}|H|$. Negative dB means attenuation. In dB, gains add: $|Y|_{dB} = |H|_{dB} + |X|_{dB}$.

## 4. Distortion
- **Distortionless** means $y[n] = Gx[n-n_d]$. This needs $|H| = G$ (constant) and $\angle H = -\omega n_d$ (linear phase).
- $|H| \ne$ const causes **magnitude distortion**.
- Nonlinear phase causes **phase (delay) distortion**.
- **Allpass** means $|H|$ is constant, so the system is fully described by its phase.
- **Phase delay:** $\tau_{pd} = -\dfrac{\angle H}{\omega}$
- **Group delay:** $\tau_{gd} = -\dfrac{d\Psi}{d\omega}$, using the unwrapped phase. It is the delay of the "bundle" of frequencies around $\omega$.
- Linear phase gives $\tau_{pd} = \tau_{gd} = n_d$ (constant).
- **Generalized linear phase** $\theta_0 - \omega n_d$ has constant group delay but **not** constant phase delay.

> [!warning] A **constant phase shift distorts** the signal, because each frequency is delayed by a different amount. A **linear phase shift does not**.

## 5. Ideal vs practical filters
- Ideal filter: $e^{-j\omega n_d}$ in the passband and $0$ elsewhere. LPF has $\omega_l=0$, HPF has $\omega_u=\pi$. Bandwidth is $\Delta\omega = \omega_u-\omega_l$.
- **Ideal LPF:** $h_{lp}[n] = \dfrac{\sin(\omega_c(n-n_d))}{\pi(n-n_d)}$. It has infinite support and is not absolutely summable, so it is **unstable and unrealizable**. All ideal filters are.
- Building other ideal filters from the LPF:
  - BPF: $h_{bp} = 2h_{lp}[n]\cos(\omega_0 n)$, with $\omega_l=\omega_0-\omega_c$ and $\omega_u=\omega_0+\omega_c$
  - HPF: $h_{hp} = \delta[n]-h_{lp}[n]$
  - BSF: $h_{bs} = \delta[n]-h_{bp}[n]$
- A practical filter (e.g. a truncated $h_{lp}$) should have **small passband ripple, high stopband attenuation and a narrow transition band**.

## 6. Rational H: reading poles and zeros
- Magnitude: $|H| = |b_0|\dfrac{\prod_k|1-z_ke^{-j\omega}|}{\prod_k|1-p_ke^{-j\omega}|}$
- **Phase** = $\angle b_0$ + Σ(zero angles) − Σ(pole angles).
- **Group delay** = Σ(pole contributions) − Σ(zero contributions).
- **Zero on the unit circle at angle $\omega_0$ kills that frequency.**
- **Pole near the unit circle (inside it) at angle $\omega_0$ boosts that frequency.**
- Complex poles and zeros must come in **conjugate pairs** to keep the coefficients real.
- **Poles or zeros at the origin don't change $|H|$.** A pole at the origin adds linear phase and a zero at the origin subtracts it.
- MATLAB: use `freqz`, then `abs` and `angle`.

## 7. Simple filter designs
### Resonator
Poles at $re^{\pm j\phi}$:
$$H(z) = \frac{b_0}{1-2r\cos\phi\,z^{-1}+r^2z^{-2}}$$
- Impulse response is a damped sinusoid: $h[n] = \dfrac{b_0}{\sin\phi}r^n\sin((n+1)\phi)u[n]$
- The peak is near $\phi$ when $r \approx 1$.
- 3 dB bandwidth: $\Delta\omega \approx 2(1-r)$
- Normalize the peak to 1 with $b_0 = (1-r)\sqrt{1+r^2-2r\cos2\phi}$
- Adding zeros at $z=\pm1$ (numerator $1-z^{-2}$) gives a better bandpass.

### Notch filter
Zeros on the unit circle at $\pm\phi$: $1-2\cos\phi\,z^{-1}+z^{-2}$. The FIR-only version has wide notches. Add poles at the same angle but at radius $r \approx 1$ for sharp notches:
$$H(z) = b_0\frac{1-2\cos\phi\,z^{-1}+z^{-2}}{1-2r\cos\phi\,z^{-1}+r^2z^{-2}}$$

### Comb filter
$G(z) = H(z^L)$
- The response repeats every $2\pi/L$, with each period a compressed copy of the original.
- $g[n]$ is $h[n]$ upsampled by $L$ (zeros inserted).
- Example: $1-z^{-1}$ becomes $1-z^{-L}$.

## 8. Magnitude doesn't determine phase
- $|H|^2$ comes from $R(z) = H(z)H^*(1/z^*)$. For real $h$ it is $H(z)H(1/z)$. This $R(z)$ is the z-transform of the autocorrelation $r[n] = h[n]*h^*[-n]$.
- The poles and zeros of $R(z)$ come in **conjugate-reciprocal pairs**: $w$ and $1/w^*$.
- There are $2^{N+M}$ systems with the same $|H|$ but different phase. **You can't get the phase from the magnitude alone.** Recovering $H$ from $|H|^2$ is called **spectral factorization**.

## 9. Allpass, minimum phase, maximum phase
- **Allpass section:** $\dfrac{z^{-1}-p^*}{1-pz^{-1}}$. Each pole $p$ is paired with a zero at $1/p^*$. **A causal, stable allpass has its zeros outside the unit circle.**
- **Minimum phase (MPS):** all poles **and** zeros inside the unit circle. This is the same as being causal and stable with a causal, stable inverse.
  - Among all systems with the same $|H|$, it has the **smallest phase delay and group delay**.
- **Maximum phase:** all zeros outside the unit circle.
- **Mixed phase:** neither of the above.
- Reversing and conjugating the coefficients of a min-phase polynomial gives a max-phase one: $A_{max}(z) = z^{-N}A^*_{min}(1/z^*)$. The ratio $A_{max}/A_{min}$ is allpass.
- **Any rational $H = H_{min}\cdot H_{ap}$.** To split it, reflect each outside zero $1/a^*$ to $a$ inside the circle, and put the leftover ratio into an allpass factor. Example:
$$\frac{1+5z^{-1}}{1+0.5z^{-1}} = 5\underbrace{\frac{1+0.2z^{-1}}{1+0.5z^{-1}}}_{H_{min}}\underbrace{\frac{z^{-1}+0.2}{1+0.2z^{-1}}}_{H_{ap}}$$

## 10. Inversion and equalization
- An inverse needs $H\,H_{inv} = 1$, i.e. $H_{inv} = A(z)/B(z)$. It is only causal and stable if $H$ is minimum phase.
- **$H$ is min-phase:** use $H_{eq} = Gz^{-n_d}/H$. The result is a perfect gain plus delay.
- **$H$ is not min-phase:** use $H_{eq} = Gz^{-n_d}/H_{min}$. The overall system becomes $GH_{ap}z^{-n_d}$. The magnitude is fixed, and an allpass phase is left over.

---
> [!summary] Exam essentials
> - Distortionless means flat $|H|$ and linear phase. A constant phase shift ≠ no distortion.
> - Zeros on the unit circle kill frequencies and poles near it boost them.
> - Ideal filters are unrealizable.
> - $|H|$ alone doesn't determine phase.
> - Min-phase means all poles and zeros are inside the unit circle.
> - Any $H = H_{min}H_{ap}$.
