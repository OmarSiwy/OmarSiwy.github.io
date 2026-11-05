---
tags: [ece380, control-systems]
---
> [[Notes/System Design/Overview]] · Topic 3 / 6

# 3 · Linear System Theory

What the model tells us: is it stable, how well does it perform, and can it be simplified.

Free response of $\dot x=Ax,\ x(t_0)=x_0$: $\;x(t)=e^{A(t-t_0)}x_0$.

## Stability

> [!definition] Stability (internal & BIBO)
> **Stable**: $x(t)=e^{A(t-t_0)}x_0$ bounded for every $x_0$. **Asymptotically stable**: also $x(t)\to0$. **Unstable**: otherwise. **BIBO stable**: every bounded input → bounded output.

- **Asymptotic stability ⇔ all eigenvalues of $A$ have negative real part.**
- **BIBO stability ⇔ all poles of the transfer function have negative real part.**
- Asymptotic ⇒ BIBO (converse can fail via unstable pole-zero cancellation).

> [!annotation]- Refresher — eigenvalues & solving $x(t)=e^{A(t-t_0)}x_0$
> **Eigenvalues**: roots of $\det(A-\lambda I)=0$. Each eigenvector solves $(A-\lambda_i I)v_i=0$.
> **Matrix exponential** (distinct $\lambda_i$): diagonalize $A=V\Lambda V^{-1}$ with $V=[v_1\,\cdots\,v_n]$, $\Lambda=\mathrm{diag}(\lambda_i)$ ⇒ $e^{At}=Ve^{\Lambda t}V^{-1}$, where $e^{\Lambda t}=\mathrm{diag}(e^{\lambda_i t})$.
> **Free response** = sum of modes: $x(t)=e^{A(t-t_0)}x_0=\sum_i c_i e^{\lambda_i(t-t_0)}v_i$, $\ c=V^{-1}x_0$. Mode $i$ decays iff $\mathrm{Re}(\lambda_i)<0$ — hence asymptotic stability ⇔ all $\mathrm{Re}(\lambda_i)<0$.
>
> **Mini example** $A=\begin{bmatrix}0&1\\-2&-3\end{bmatrix}$: $\det(A-\lambda I)=\lambda^2+3\lambda+2=(\lambda+1)(\lambda+2)\Rightarrow\lambda=-1,-2$. Eigenvectors $v_1=\begin{bmatrix}1\\-1\end{bmatrix},\ v_2=\begin{bmatrix}1\\-2\end{bmatrix}$ ⇒ $x(t)=c_1e^{-t}v_1+c_2e^{-2t}v_2$ → both modes decay ⇒ stable.

## Performance (step response)

- steady-state gain $C_{ss}=\lim_{t\to\infty}y$; 
- rise time $T_r$ (10%→90%);
- peak time $T_p$;
- overshoot $OS\%=\frac{C_{max}-C_{ss}}{C_{ss}}100$;
- settling time $T_s^{\varepsilon\%}$ (stays within $\pm\varepsilon$).

**Fig — 2nd-order step response ($\zeta=0.3$) with metrics:**
```tikz
\usepackage{tikz}
\usetikzlibrary{arrows.meta}
\begin{document}
\begin{tikzpicture}[>=Stealth,x=0.42cm,y=2.3cm,font=\small]
  \draw[->] (0,0) -- (15.5,0) node[right]{$t$};
  \draw[->] (0,0) -- (0,1.6) node[above]{$y(t)$};
  \draw[dashed] (0,1) -- (15,1) node[right]{$C_{ss}$};
  \draw[gray,dotted] (0,1.02) -- (15,1.02);
  \draw[gray,dotted] (0,0.98) -- (15,0.98) node[right,black]{\scriptsize$\pm2\%$};
  \draw[red,dashed] (0,1.37) -- (3.29,1.37);
  \node[left] at (0,1.37) {\scriptsize$C_{max}$};
  \draw[thick,blue] plot[smooth,tension=0.7] coordinates{
    (0,0)(0.5,0.11)(1,0.38)(1.5,0.71)(2,1.02)(2.5,1.24)(3,1.36)(3.29,1.37)
    (4,1.30)(4.5,1.18)(5,1.06)(5.5,0.95)(6,0.89)(6.5,0.86)(7,0.87)(8,0.95)
    (9,1.03)(10,1.05)(11,1.03)(12,1.01)(13,0.99)(14,1.0)};
  \draw[dotted] (3.29,0) -- (3.29,1.37);
  \node[below] at (3.29,0) {$T_p$};
  \draw[<->] (0.48,0.2) -- (1.75,0.2);
  \node[above] at (1.1,0.2) {\scriptsize$T_r$};
  \draw[<->,red] (3.29,1.0) -- (3.29,1.37);
  \node[right,red] at (3.29,1.2) {\scriptsize$OS\%$};
  \draw[dotted] (7.5,0) -- (7.5,0.98);
  \node[below] at (7.5,0) {\scriptsize$T_s$};
\end{tikzpicture}
\end{document}
```

| Metric | 1st order $\frac{\mu}{1+\tau s}$ | 2nd order $\frac{\mu\omega_n^2}{s^2+2\zeta\omega_n s+\omega_n^2}$ |
|---|---|---|
| ss gain | $\mu$ | $\mu$ |
| $T_r$ | $2\tau$ | $\frac{2.16\zeta+0.6}{\omega_n}$ |
| $T_p$ | — | $\frac{\pi}{\omega_n\sqrt{1-\zeta^2}}$ |
| $OS\%$ | — | $100\,e^{-\zeta\pi/\sqrt{1-\zeta^2}}$ |
| $T_s^{\varepsilon\%}$ | $-\tau\ln(0.01\varepsilon)$ | $-\frac{\ln(0.01\varepsilon)}{\zeta\omega_n}$ |

## Steady-State Error & System Type

Unity feedback, $E(s)=\frac{R(s)}{1+L(s)}$, FVT ⇒ $e_{ss}=\lim_{s\to0}\frac{sR(s)}{1+L(s)}$. **Type** = # integrators in $L$.

> [!definition] Error constants
> Position $K_p=\lim_{s\to0}L(s)$ → step $e_{ss}=\frac{1}{1+K_p}$. Velocity $K_v=\lim_{s\to0}sL(s)$ → ramp slope $A$: $e_{ss}=\frac{A}{K_v}$. Acceleration $K_a=\lim_{s\to0}s^2L(s)$ → parabola $e_{ss}=\frac{1}{K_a}$. (Type 1 kills step error; type 2 kills ramp error.)

**Why it matters:** $e_{ss}$ tells you — *without simulating* — how well the closed loop will track a set-point (step), a constant-velocity command (ramp), or an accelerating one (parabola). Each extra integrator (higher **type**) drives one more of these errors to zero. That is exactly *why* you add integral action (see [[5 - Controller Synthesis]] → Integral Control).

All cases at a glance (unit inputs; scale by the input's amplitude/slope):

| Type = # integrators | Step $r=u(t)$ | Ramp $r=t$ | Parabola $r=\tfrac{t^2}{2}$ |
|---|---|---|---|
| 0 | $\frac{1}{1+K_p}$ | $\infty$ | $\infty$ |
| 1 | $0$ | $\frac{1}{K_v}$ | $\infty$ |
| 2 | $0$ | $0$ | $\frac{1}{K_a}$ |

> [!definition] Steady-state error — procedure
> 1. Count integrators in $L$ → **type** (picks the row).
> 2. Identify the input → step / ramp / parabola (picks the column).
> 3. Compute the matching constant ($K_p$, $K_v$, or $K_a$) and read $e_{ss}$; multiply by the input amplitude/slope.

> [!example]- Worked — $L(s)=\frac{10}{s(s+2)}$ (type 1): try all three inputs
> One integrator ⇒ **type 1** (middle row).
> - **Step** $r=u(t)$: $K_p=\lim_{s\to0}L=\infty\Rightarrow e_{ss}=\frac{1}{1+\infty}=0$.
> - **Ramp** $r=t$: $K_v=\lim_{s\to0}sL=\frac{10}{2}=5\Rightarrow e_{ss}=\frac{1}{5}=0.2$.
> - **Parabola** $r=\tfrac{t^2}{2}$: $K_a=\lim_{s\to0}s^2L=0\Rightarrow e_{ss}=\infty$.
> Reading: tracks a step perfectly, follows a ramp with a constant $0.2$ lag, can't keep up with acceleration. Want zero ramp error too? Add a second integrator (type 2). (More instances: Q1(c) ramp error and Q7(a) in [[4 - Stability Analysis]] / [[5 - Controller Synthesis]].)

## Lower-Order Approximations

**Dominant poles** = poles nearest the $j\omega$ axis (slowest). Factor $G=G_{fast}G_{slow}$; approximate fast part by its DC gain $G_{fast}(0)$, keep $G_{slow}$. Then use the 1st/2nd-order metric table.

---
[[2 - Mathematical Model Theory]] · → Next: [[4 - Stability Analysis]]
