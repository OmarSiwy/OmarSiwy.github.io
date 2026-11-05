---
tags: [ece380, control-systems]
---
> [[Notes/System Design/Overview]] · Topic 2 / 6

# 2 · Mathematical Model Theory

Tools to make a model usable: linearize a nonlinear plant, then read its behavior in the frequency domain (Bode).

## Linearization

> [!definition] Equilibrium
> $(\bar x,\bar u)$ is an equilibrium of $\dot x=f(x,u)$ if $f(\bar x,\bar u)=0$ (state stays put; output $\bar y=h(\bar x,\bar u)$).

Small perturbations $\delta x=x-\bar x,\ \delta u=u-\bar u$ obey an LTI system:
$$\dot{\delta x}=A\,\delta x+B\,\delta u,\qquad \delta y=C\,\delta x+D\,\delta u.$$

> [!annotation]- Derivation — Jacobians from Taylor expansion
> $\dot{\delta x}=f(x,u)$, $\delta y=h(x,u)-\bar y$. Taylor about $(\bar x,\bar u)$, drop $\mathcal O(\|\cdot\|^2)$:
> $$A=\tfrac{\partial f}{\partial x}\big|_{(\bar x,\bar u)},\ B=\tfrac{\partial f}{\partial u}\big|,\ C=\tfrac{\partial h}{\partial x}\big|,\ D=\tfrac{\partial h}{\partial u}\big|.$$
> Valid only near $(\bar x,\bar u)$. Afterwards write $x,u,y$ for the variations (they are deviations from the operating point, not absolute values).

> [!example]- Worked — nonlinear system → non-zero equilibrium → linearize → transfer function
> System $\dot x_1=x_2,\quad \dot x_2=-x_1^2+u,\quad y=x_1$.
> **Equilibrium** ($\dot x=0$): $x_2=0$ and $\bar x_1^2=\bar u$; take $\bar u=1\Rightarrow(\bar x_1,\bar x_2)=(1,0)$, $\bar y=1$ — a **non-zero** operating point.
> **Linearize** (Jacobians at $\bar x_1=1$, since $\partial\dot x_2/\partial x_1=-2x_1$):
> $$A=\begin{bmatrix}0&1\\-2&0\end{bmatrix},\quad B=\begin{bmatrix}0\\1\end{bmatrix},\quad C=\begin{bmatrix}1&0\end{bmatrix},\quad D=0.$$
> **Transfer function**: $sI-A=\begin{bmatrix}s&-1\\2&s\end{bmatrix}$, $\det=s^2+2$,
> $$G(s)=C(sI-A)^{-1}B=\frac{1}{s^2+2}\begin{bmatrix}1&0\end{bmatrix}\begin{bmatrix}s&1\\-2&s\end{bmatrix}\begin{bmatrix}0\\1\end{bmatrix}=\frac{1}{s^2+2}.$$
> This $G(s)$ relates the **variations** $\delta u,\delta y$ about $(\bar u,\bar y)=(1,1)$ — not the absolute signals.

## Frequency Response

Poles in LHP ⇒ for input $u=U\sin(\omega t)$ the response settles to
$$y_{ss}(t)=|G(j\omega)|\,U\sin\!\big(\omega t+\angle G(j\omega)\big).$$
So $G(j\omega)$ (magnitude + phase vs $\omega$) fully describes sinusoidal steady state.

## Bode Plots

Log $\omega$ axis (factor-10 = **decade**); magnitude in dB $=20\log_{10}|G(j\omega)|$; phase linear in degrees. Factor $G$ and **add** the plots:
$$G(s)=\frac{\mu\prod(1+T_is)\prod\!\big(1+\tfrac{2\bar\zeta_i}{\alpha_{n,i}}s+\tfrac{s^2}{\alpha_{n,i}^2}\big)}{s^{\rho}\prod(1+\tau_is)\prod\!\big(1+\tfrac{2\zeta_i}{\omega_{n,i}}s+\tfrac{s^2}{\omega_{n,i}^2}\big)}$$
$\mu$ = gain; $\rho$ = net poles at origin; $T_i,\tau_i$ = zero/pole time constants; $\zeta,\omega_n$ = 2nd-order damping/natural freq.

| Factor | Magnitude | Phase |
|---|---|---|
| $\mu$ | flat $20\log\lvert\mu\rvert$ | $0°$ ($\mu>0$), $\pm180°$ ($\mu<0$) |
| $1/s$ (each origin pole) | $-20$ dB/dec | $-90°$ |
| $1/(1+\tau s)$ | flat then $-20$ dB/dec at $\omega=1/\tau$ | $0\to-90°$ ($-45°$ at $1/\tau$) |
| $\frac{1}{1+2\zeta s/\omega_n+s^2/\omega_n^2}$ | flat then $-40$ dB/dec at $\omega_n$ | $0\to-180°$ ($-90°$ at $\omega_n$); peak if $\zeta$ small |

Zeros = mirror images (positive slopes/phase). Origin poles add $-20\rho$ dB/dec and $-90\rho°$ everywhere.

### Sketching recipe — asymptotic Bode plot

> [!definition] Bode sketching procedure
> 1. **Bode form** $L=\mu\frac{\prod(1+s/\omega_z)}{s^\rho\prod(1+s/\omega_p)\cdots}$: list gain $\mu$, origin poles $\rho$, corner freqs $\omega_i$ (real $=1/\tau$, complex $=\omega_n$) in increasing order.
> 2. **Magnitude, low-freq start** (below first corner): straight line of slope $-20\rho$ dB/dec through $(\omega=1,\ 20\log|\mu|)$ — equivalently it hits $0$ dB at $\omega=\mu^{1/\rho}$.
> 3. **Magnitude, at each corner** change the slope: $\mp20$ (real pole/zero is $-/+$), $\mp40$ (complex pole/zero) dB/dec. Small-$\zeta$ complex pole → resonant bump $\approx-20\log(2\zeta)$ dB at $\omega_n$.
> 4. **Phase, start/end**: $\angle L\to-90°\rho$ (low $\omega$), $\to-90°(n-m)$ (high $\omega$).
> 5. **Phase, at each corner**: real pole $-90°$ (spread over the decade, $-45°$ at $\omega_i$); real zero $+90°$; complex pole $-180°$ ($-90°$ at $\omega_n$); complex zero $+180°$.
> 6. **Crossover** $\omega_c$: where the magnitude asymptote hits $0$ dB; then $\varphi_m=180°+\angle L(\omega_c)$.

> [!example]- Worked — sketch $L=\frac{100}{s(s/10+1)(s/50+1)}$
> **1.** $\mu=100$, $\rho=1$, corners $\omega=10,50$ (poles), no zeros, $n-m=3$.
> **2.** Low freq: slope $-20$, through $(\omega{=}1,\,40\text{ dB})$; extended, hits $0$ dB at $\omega=100$.
> **3.** At $\omega=10\to-40$; at $\omega=50\to-60$ dB/dec. Corner values: $20$ dB @ $10$, $\approx-8$ dB @ $50$.
> **4–5.** Phase $-90°$ (low) $\to-270°$ (high); $-146°$ @ $10$, $-214°$ @ $50$.
> **6.** Crossover in the $-40$ band: $20=40\log_{10}(\omega_c/10)\Rightarrow\omega_c=10\cdot10^{0.5}\approx31.6$. Phase there $=-90-\arctan3.16-\arctan0.63=-194.7°\Rightarrow\varphi_m=-14.7°$ ⇒ **unstable**. ($\angle=-180°$ at $\omega_\pi=\sqrt{500}\approx22.4$, where $|L|\approx+6$ dB ⇒ negative gain margin — same verdict.)

**Fig — asymptotic Bode of $\frac{100}{s(s/10+1)(s/50+1)}$ (slopes $-20\to-40\to-60$; $\varphi_m<0$):**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[font=\small,>=stealth]
  % magnitude
  \draw[->] (-0.3,0) -- (4.8,0) node[right]{\scriptsize$\log\omega$};
  \draw[->] (0,-1.25) -- (0,1.95) node[above]{\scriptsize$|L|_{dB}$};
  \draw[thick,blue] (0,1.6) -- (2.2,0.8) -- (3.74,-0.32) -- (4.4,-1.04);
  \fill (3.3,0) circle (1pt) node[above right]{\scriptsize$\omega_c\!\approx\!31.6$};
  \draw[gray,dotted] (2.2,0)--(2.2,0.8);
  \draw[gray,dotted] (3.74,0)--(3.74,-0.32);
  \node[below,font=\scriptsize] at (2.2,0) {$10$};
  \node[below,font=\scriptsize] at (3.74,0) {$50$};
  \node[font=\scriptsize] at (1.1,1.35) {$-20$};
  \node[font=\scriptsize] at (3.0,0.55) {$-40$};
  \node[font=\scriptsize] at (4.2,-0.45) {$-60$};
  % phase
  \draw[->] (0,-3.6) -- (0,-2.0) node[above,font=\scriptsize]{$\angle L$};
  \draw[->] (-0.3,-2.2) -- (4.8,-2.2) node[right]{\scriptsize$\log\omega$};
  \node[left,font=\scriptsize] at (0,-2.2) {$-90°$};
  \draw[dashed] (-0.1,-2.83) -- (4.7,-2.83) node[right,font=\scriptsize]{$-180°$};
  \node[left,font=\scriptsize] at (0,-3.46) {$-270°$};
  \draw[thick,blue] plot[smooth,tension=0.8] coordinates{
    (0,-2.25)(1.1,-2.42)(2.2,-2.59)(2.97,-2.83)(3.74,-3.07)(4.4,-3.23)};
  \fill (2.97,-2.83) circle (1pt) node[above right,font=\scriptsize]{$\omega_\pi\!\approx\!22.4$};
  \draw[gray,dotted] (3.3,-2.2)--(3.3,-2.93);
  \node[font=\scriptsize] at (3.95,-2.5) {$\varphi_m<0$};
\end{tikzpicture}
\end{document}
```

---
[[1 - System to Mathematical Model]] · → Next: [[3 - Linear System Theory]]
