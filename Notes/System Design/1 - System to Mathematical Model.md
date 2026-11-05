---
tags: [ece380, control-systems]
---
> [[Notes/System Design/Overview]] · Topic 1 / 6

# 1 · System → Mathematical Model

Step 3 of the design cycle: describe how the system maps inputs to outputs. Two equivalent models — **state-space** (time domain) and **transfer function** (Laplace domain).

## State-Space Model

> [!definition] State
> $x(t)$ = minimal set of variables such that knowing $x(t_0)$ and input $u$ on $[t_0,t_1]$ determines $x(t_1)$ and $y(t_1)$. (Everything needed to predict the future.)

General nonlinear form, then the LTI special case:
$$\dot x = f(x,u),\quad y=h(x,u) \qquad\longrightarrow\qquad \dot x = Ax+Bu,\quad y=Cx+Du$$
with $x\in\mathbb R^n,\ u\in\mathbb R^m,\ y\in\mathbb R^p$.

> [!annotation]- Derivation — vehicle example (ODE → state space)
> Plant: $m\ddot p + C(\dot p)=f$. Pick state $x=\begin{bmatrix}p\\\dot p\end{bmatrix}$, input $u=f$, output $y=p$.
> $$\dot x=\begin{bmatrix}\dot p\\ \ddot p\end{bmatrix}=\begin{bmatrix}x_2\\ -\tfrac{C(x_2)}{m}+\tfrac{u}{m}\end{bmatrix},\qquad y=x_1.$$
> State evolution + output depend only on $(x,u)$ ⇒ integrate forward in time. Choosing state = "what you must remember."

> [!definition] Building $(A,B,C,D)$ from an ODE
> Choose states = output and its derivatives up to order $n-1$: $x_1=y,\ x_2=\dot y,\dots$. Then $\dot x_i=x_{i+1}$, and solving the ODE for the highest derivative gives the last row of $A$ and $B$; read $C,D$ off the output equation.

> [!example]- Worked — mass–spring–damper $m\ddot y+b\dot y+ky=u$
> States $x=\begin{bmatrix}y\\\dot y\end{bmatrix}$: $\dot x_1=x_2$, and $\dot x_2=\ddot y=-\tfrac km x_1-\tfrac bm x_2+\tfrac1m u$, output $y=x_1$.
> $$A=\begin{bmatrix}0&1\\-\tfrac km&-\tfrac bm\end{bmatrix},\quad B=\begin{bmatrix}0\\\tfrac1m\end{bmatrix},\quad C=\begin{bmatrix}1&0\end{bmatrix},\quad D=0.$$

> [!example]- Worked — from a transfer function $G(s)=\frac{s+2}{s^2+3s+2}$ (controllable canonical form)
> Denominator $\Rightarrow a_0=2,\ a_1=3$; numerator $\Rightarrow b_0=2,\ b_1=1$; strictly proper ($m<n$) $\Rightarrow D=0$.
> $$A=\begin{bmatrix}0&1\\-2&-3\end{bmatrix},\quad B=\begin{bmatrix}0\\1\end{bmatrix},\quad C=\begin{bmatrix}2&1\end{bmatrix},\quad D=0.$$
> Check: $C(sI-A)^{-1}B=\frac{s+2}{s^2+3s+2}$ ✓ (general form in [[6 - State Feedback Control]]).
## Transfer Function Model

> [!definition] Transfer function (SISO)
> $G(s)=\dfrac{\mathcal L\{y\}}{\mathcal L\{u\}}=\dfrac{Y(s)}{U(s)}$ at **zero initial conditions**. From state space: $G(s)=C(sI-A)^{-1}B+D$.

Use: $U(s)=\mathcal L\{u\}$ → $Y(s)=G(s)U(s)$ (algebraic!) → $y=\mathcal L^{-1}\{Y\}$.

> [!definition] Real-rational, proper, poles/zeros
> $G(s)=\dfrac{b_ms^m+\dots+b_0}{s^n+a_{n-1}s^{n-1}+\dots+a_0}$. **Proper** iff $n\ge m$ ($\lim_{s\to\infty}G$ finite); **strictly proper** iff $n>m$ ($\lim=0$). **Pole** $p$: $|G(p)|\to\infty$ (root of denom). **Zero** $z$: $|G(z)|=0$ (root of numer).

---
→ Next: [[2 - Mathematical Model Theory]]
