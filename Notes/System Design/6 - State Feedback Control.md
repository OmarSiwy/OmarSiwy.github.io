---
tags: [ece380, control-systems]
---
> [[Notes/System Design/Overview]] · Topic 6 / 6

# 6 · State Feedback Control

Static output feedback can't always stabilize (e.g. $L=\frac{\mu}{s(s-1)}$: RHP pole for all $\mu$). If the state is available, use $u=-Kx$.

## Controllable Canonical Form

> [!definition] Controllable canonical form & state feedback
> For $G=\frac{b_{n-1}s^{n-1}+\dots+b_0}{s^n+a_{n-1}s^{n-1}+\dots+a_0}$:
> $$A=\begin{bmatrix}0&1&&\\ &\ddots&\ddots&\\ 0&\dots&0&1\\ -a_0&-a_1&\dots&-a_{n-1}\end{bmatrix},\ B=\begin{bmatrix}0\\\vdots\\0\\1\end{bmatrix},\ C=\begin{bmatrix}b_0&\dots&b_{n-1}\end{bmatrix}.$$
> Control $u=-Kx$ ⇒ closed loop $\dot x=(A-BK)x$: behavior set by eigenvalues of $A-BK$.

**Fig — state feedback ($u=-Kx+r$); inner $A$ loop + integrator realize the plant:**
```tikz
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,calc}
\begin{document}
\begin{tikzpicture}[>=Stealth,font=\small,
  blk/.style={draw,thick,minimum size=0.8cm},
  sum/.style={draw,thick,circle,minimum size=5mm,inner sep=0pt}]
  \node (r) at (0,0) {$r$};
  \node[sum] (s1) at (1,0) {};
  \node[blk] (B) at (2.1,0) {$B$};
  \node[sum] (s2) at (3.3,0) {};
  \node[blk] (int) at (4.5,0) {$\frac{1}{s}$};
  \node[blk] (C) at (6.6,0) {$C$};
  \node (y) at (7.9,0) {$y$};
  \node[blk] (A) at (4.5,-1.5) {$A$};
  \node[blk] (K) at (3.3,-2.7) {$K$};
  \draw[->] (r)--(s1);
  \draw[->] (s1)-- node[above]{$u$} (B);
  \draw[->] (B)--(s2);
  \draw[->] (s2)--(int);
  \draw[->] (int)-- node[above,pos=0.18]{$x$} (C);
  \draw[->] (C)--(y);
  \draw[->] (5.5,0) |- (A.east);
  \draw[->] (A.west) -| (s2);
  \draw[->] (5.8,0) |- (K.east);
  \draw[->] (K.west) -| (s1);
  \node[font=\scriptsize] at ($(s1)+(-0.3,0.22)$) {$+$};
  \node[font=\scriptsize] at ($(s1)+(0.16,-0.3)$) {$-$};
  \node[font=\scriptsize] at ($(s2)+(-0.3,0.22)$) {$+$};
  \node[font=\scriptsize] at ($(s2)+(0.16,-0.3)$) {$+$};
\end{tikzpicture}
\end{document}
```

## Pole Placement

> [!definition] Pole placement via state feedback
> If controllable-canonical, any desired eigenvalues $\lambda_1^\star,\dots,\lambda_n^\star$ are achievable by suitable $K^T\in\mathbb R^n$.

> [!annotation]- Derivation — solving for $K$ by coefficient matching
> With $K=[K_1,\dots,K_n]$, $|\lambda I-(A-BK)|=\lambda^n+(a_{n-1}+K_n)\lambda^{n-1}+\dots+(a_0+K_1)$. Set equal to desired $P(\lambda)=\lambda^n+c_{n-1}\lambda^{n-1}+\dots+c_0$ ⇒ $\;K_{i}=c_{i-1}-a_{i-1}$ term-by-term.

> [!example]- Worked — notes Ex. 9: stabilize $G=\frac{1}{s(s-1)}$ (unstable, poles $0,1$)
> CCF: $A=\begin{bmatrix}0&1\\0&1\end{bmatrix},\ B=\begin{bmatrix}0\\1\end{bmatrix}$ ($a_0=0,a_1=-1$). Want $\lambda^\star=-1,-2$ ⇒ $P(\lambda)=(\lambda+1)(\lambda+2)=\lambda^2+3\lambda+2$ ($c_0=2,c_1=3$).
> $K_1=c_0-a_0=2-0=2$; $K_2=c_1-a_1=3-(-1)=4$ ⇒ $\boxed{u=-2x_1-4x_2}$.

> [!example]- Worked — Q3(b): observer + state feedback (separation)
> $u=-K\hat x$, error $e=x-\hat x$. Plant $\dot x=Ax+Bu$; observer $\dot{\hat x}=A\hat x+Bu+L(y-C\hat x)$.
> $\dot x=(A-BK)x+BKe$; $\dot e=\dot x-\dot{\hat x}=(A-LC)e$. Autonomous ($r=0$):
> $$\begin{bmatrix}\dot x\\\dot e\end{bmatrix}=\begin{bmatrix}A-BK&BK\\0&A-LC\end{bmatrix}\begin{bmatrix}x\\e\end{bmatrix}.$$
> Block-triangular ⇒ eigenvalues = those of $A-BK$ **and** $A-LC$ (separation principle).

> [!example]- Worked — Q6(b): integral-augmented state feedback
> Add integral state $\dot z=r-y=r-Cx$; control $u=-K_xx+K_zz$.
> $\dot x=(A-BK_x)x+BK_zz$; $\dot z=-Cx+r$. Augmented ($[x^T\ z^T]^T$):
> $$\begin{bmatrix}\dot x\\\dot z\end{bmatrix}=\begin{bmatrix}A-BK_x&BK_z\\-C&0\end{bmatrix}\begin{bmatrix}x\\z\end{bmatrix}+\begin{bmatrix}0\\I\end{bmatrix}r.$$

**Notes:** need state access (else observer); pole placement→time/freq specs isn't always intuitive; same procedure for MIMO; watch uncontrollable states.

---
[[5 - Controller Synthesis]] · [[Appendix - Laplace Transform]]
