---
tags: [ece380, control-systems]
---
> [[Notes/System Design/Overview]] · Topic 5 / 6

# 5 · Controller Synthesis

Design $C(s)$ so the closed loop meets specs. Loop shaping frames the specs; integral/lead-lag/PID/pole-placement are the tools.

**Loop shaping**: design $C$ so $F=\dfrac{Y}{R}=\dfrac{L}{1+L}=\dfrac{CG}{1+CG}$ meets specs. Translate time-domain specs on $F$ into frequency constraints on $L=CG$:

| Spec on $F$ | Constraint on $L$ (Bode) |
|---|---|
| Stability | $k_m>0$, $\varphi_m>0$, no unstable pole-zero cancellation in $CG$ |
| Robust stability | larger $k_m,\varphi_m$; upper bound on $\omega_c$ (delay adds $-\omega_c\tau$) |
| Static perf (small $e_{ss}$) | high $\lvert L\rvert$ at low $\omega$; integrator ⇒ $\lvert L\rvert\to\infty$, $F(0)=1$ |
| Dynamic perf (track fast $r$) | lower bound on $\omega_c$ ($\lvert F\rvert\approx1$ for $\omega<\omega_c$) |
| Disturbance rejection | $\lvert L\rvert\gg1$ over disturbance band (low $\omega$) |
| Noise attenuation | $\lvert L\rvert\ll1$ over noise band (high $\omega$); upper bound on $\omega_c$ |
| Realizable $C$ | slope $\lvert L\rvert\le$ slope $\lvert G\rvert$ as $\omega\to\infty$ (proper $C$) |

## Integral Control

$C(s)=\frac{\mu}{s}$: pole at origin ⇒ **zero steady-state error** + perfect disturbance rejection (infinite DC gain), but adds $-90°$ phase everywhere ⇒ watch $\varphi_m$.

> [!example]- Worked — Q8: integral controller $C=\frac{K}{s}$, $G=\frac{1}{s+2}$
> $L=CG=\frac{K}{s(s+2)}$, $1+L=\frac{s^2+2s+K}{s(s+2)}$.
> **(a)** $T_{r\to y}=\frac{CG}{1+CG}=\frac{K}{s^2+2s+K}$; step $y_{ss}=T(0)=\frac{K}{K}=1$ ⇒ **perfect tracking**.
> **(b)** $T_{d\to y}=\frac{G}{1+CG}=\frac{s}{s^2+2s+K}$; step $y_{ss}=T(0)=0$ ⇒ **disturbance fully rejected** (integral action).
> **(c)** $\frac{K}{s^2+2s+K}$ vs $s^2+2\zeta\omega_n s+\omega_n^2$: $\omega_n=\sqrt K$, $\zeta=\frac{1}{\sqrt K}$.
> **(d)** Routh on $s^2+2s+K$: coeffs $1,2,K$ ⇒ stable for **$K>0$**.

## Lead–Lag Compensators

> [!definition] Lead vs Lag
> **Lead** $C=\mu\frac{1+Ts}{1+\alpha Ts}$, $0<\alpha<1$: adds phase (peak $\approx55°$ at $\alpha=0.1$) around $\frac{1}{\sqrt\alpha T}$ ⇒ **boosts $\varphi_m$** (faster/more damped), at cost of HF gain $\mu/\alpha$. Limit $\alpha\to0$ ⇒ **PD** $C=\mu+\mu Ts$.
> **Lag** $C=\mu\frac{1+Ts}{1+\alpha Ts}$, $\alpha>1$: raises low-freq gain by $\alpha$ ⇒ **better static perf**, small ($\le\!6°$ at $\alpha=10$, corners $\le\omega_c/10$) phase loss. Limit $\alpha\to\infty$ (with $\mu/\alpha=c$) ⇒ **PI** $C=c+\frac{c}{T}\frac1s$.

> [!example]- Worked — Q4: PD via root locus, $G=\frac{1}{s(s+4)}$, want $\zeta=0.5,\ \omega_n=4$
> $C=K_P+K_Ds$. Desired poles $s=-\zeta\omega_n\pm j\omega_n\sqrt{1-\zeta^2}=-2\pm j2\sqrt3$ ⇒ desired char $s^2+4s+16$.
> Char: $s(s+4)+K_Ds+K_P=s^2+(4+K_D)s+K_P$. Match: $4+K_D=4\Rightarrow\boxed{K_D=0}$; $K_P=\boxed{16}$.
> Insight: $\zeta\omega_n=2$ = midpoint of plant poles $\{0,-4\}$, so the target sits on the *proportional* locus (vertical branch) ⇒ no derivative action needed.

> [!example]- Worked — Q5: lead via pole cancellation, $G=\frac{1}{(s+1)(s+3)}$, want $s=-2\pm j2$
> Hint: zero cancels plant pole $-1$ ⇒ $z=1$. Then $L=\frac{K}{(s+p)(s+3)}$, char $s^2+(p+3)s+(3p+K)$.
> Desired $(s+2)^2+4=s^2+4s+8$. Match: $p+3=4\Rightarrow p=1$; $3(1)+K=8\Rightarrow K=5$.
> Insight: target $\mathrm{Re}=-2$ = midpoint of $\{-1,-3\}$, so $p=1$ (equals $z$) ⇒ compensator collapses to gain $K=5$; specs met by proportional control.

> [!example]- Worked — Q9: lag design, $G=\frac{10}{(s+1)(s+10)}$, want step $e_{ss}=\frac{1}{21}$
> $C_{lag}=K_c\frac{s+1/T}{s+1/(\alpha T)}$, $\alpha>1$. $G(0)=1$, $C(0)=K_c\alpha$ ⇒ $K_p=K_c\alpha$.
> **(a)** $e_{ss}=\frac{1}{1+K_p}=\frac{1}{21}\Rightarrow K_p=20\Rightarrow K_c\alpha=20$. Keep HF gain $K_c=1\Rightarrow\alpha=20$.
> **(b)** Place upper corner a decade below $\omega_{gc}\approx3$: $\frac1T=\frac{3}{10}=0.3\Rightarrow\frac{1}{\alpha T}=\frac{0.3}{20}=0.015$.
> $$\boxed{C_{lag}(s)=\frac{s+0.3}{s+0.015}}\quad(\le5°\ \text{PM loss}).$$

## PID Controllers

Time domain $u=K_pe+K_I\!\int e+K_D\dot e$. Transfer functions:
$$C_{PID}=K_P+\frac{K_I}{s}+K_Ds=K_P\Big(1+\frac{1}{T_Is}+T_Ds\Big),\quad T_I=\tfrac{K_P}{K_I},\ T_D=\tfrac{K_D}{K_P}.$$
Integral ⇒ zero $e_{ss}$ + disturbance rejection (pole at origin). Derivative ⇒ faster (phase lead), but improper ⇒ add HF pole to realize: $\frac{T_Ds}{1+(T_D/N)s}$. Practical: derivative-kick limiting, anti-windup; tune via Ziegler–Nichols.

> [!example]- Worked — Q3(a): PI placing poles at $-1\pm j$, $G=\frac{2}{s^2+5s+6}$
> $C=K_P+\frac{K_I}{s}$, $CG=\frac{2(K_Ps+K_I)}{s(s+2)(s+3)}$. Char: $s^3+5s^2+(6+2K_P)s+2K_I$.
> Desired: two poles $-1\pm j$ ⇒ factor $s^2+2s+2$; third pole $-p$: $(s^2+2s+2)(s+p)$.
> Match $s^2$: $p+2=5\Rightarrow p=3$ (**third pole $-3$**). $s^1$: $2p+2=6+2K_P\Rightarrow K_P=1$. $s^0$: $2p=2K_I\Rightarrow K_I=3$.

> [!example]- Worked — Q6(a): PID matching char eqn, $G=\frac{1}{s(s+3)}$
> $C=K_P+\frac{K_I}{s}+K_Ds$, $CG=\frac{K_Ds^2+K_Ps+K_I}{s^2(s+3)}$. Char: $s^3+(3+K_D)s^2+K_Ps+K_I$.
> Desired $(s+2)(s^2+4s+8)=s^3+6s^2+16s+16$. Match: $K_D=3$, $K_P=16$, $K_I=16$.

## Pole Placement (dominant-pole design)

For a complex-conjugate dominant pair with damping $\zeta$, natural freq $\omega_n$, real part $\sigma=\zeta\omega_n$:
$$OS\%=100e^{-\zeta\pi/\sqrt{1-\zeta^2}},\quad T_p=\tfrac{\pi}{\omega_n\sqrt{1-\zeta^2}},\quad \omega_d=\omega_n\sqrt{1-\zeta^2},\quad T_s=\tfrac{-\ln(0.01\varepsilon)}{\sigma},\quad \varphi_m\approx100\zeta,\quad \omega_c\approx\omega_n.$$
So $\zeta$ ⇒ overshoot/PM/oscillation; $\omega_n$ ⇒ speed/$\omega_c$; $\sigma$ ⇒ settling. Design targets = wedge ($\zeta\ge\bar\zeta$), circle ($\omega_n\ge\bar\omega_n$), half-plane ($\sigma\le\bar\sigma$) regions of the $s$-plane.

**Fig — damping wedge $\zeta=\cos\beta\ge\bar\zeta$ (shaded = acceptable poles):**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=1cm,font=\small,>=stealth]
  \fill[blue!12] (0,0) -- (120:2.77) -- (-3,2.4) -- (-3,-2.4) -- (240:2.77) -- cycle;
  \draw[->] (-3.2,0) -- (0.9,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.5) -- (0,2.5) node[above]{$\mathrm{Im}$};
  \draw[blue,thick] (0,0) -- (120:2.9);
  \draw[blue,thick] (0,0) -- (240:2.9);
  \draw[<->] (180:0.9) arc (180:120:0.9);
  \node at (150:1.3) {$\beta$};
  \draw[dashed,gray] (0,0) -- (120:2.2);
  \fill[red] (120:2.2) circle (1.5pt);
  \fill[red] (240:2.2) circle (1.5pt);
  \node[red,above right] at (120:2.2) {\scriptsize$-\zeta\omega_n+j\omega_d$};
  \node[gray] at (108:1.5) {\scriptsize$\omega_n$};
  \node[align=center] at (-2.1,-1.7) {\footnotesize$\zeta=\cos\beta\ge\bar\zeta$\\\footnotesize inside wedge};
\end{tikzpicture}
\end{document}
```

---
[[4 - Stability Analysis]] · → Next: [[6 - State Feedback Control]]
