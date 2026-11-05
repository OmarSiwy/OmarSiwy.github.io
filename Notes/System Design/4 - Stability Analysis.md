---
tags: [ece380, control-systems]
---
> [[Notes/System Design/Overview]] · Topic 4 / 6

# 4 · Stability Analysis

Four tools to decide closed-loop stability from the open loop $L=CG$: Routh–Hurwitz (algebraic), Nyquist (graphical), stability margins (Bode), root locus (poles vs gain).

Interconnections: series $G_1G_2$; parallel $G_1+G_2$; **negative feedback** $\frac{G_1}{1+G_1G_2}$. Series/parallel preserve stability; **feedback need not** (can stabilize or destabilize). Unstable pole-zero cancellations ⇒ internal instability.

Closed loop stable ⇔ roots of $1+L(s)=0$ in LHP, i.e. characteristic polynomial $\pi(s)=s^n+a_{n-1}s^{n-1}+\dots+a_0$ is **Hurwitz**.

## Routh–Hurwitz Criterion

> [!definition] Hurwitz
> $\pi(s)$ is Hurwitz iff all roots have negative real part. **Necessary** (not sufficient): all $a_i>0$ (same sign). If any coefficient is $\le0$ or missing ⇒ not Hurwitz.

Build the Routh table; then apply the criterion.

$$
\begin{array}{c|ccc}
s^n & 1 & a_{n-2} & a_{n-4}\\
s^{n-1} & a_{n-1} & a_{n-3} & a_{n-5}\\
s^{n-2} & r_{2,0} & r_{2,1} & \\
\vdots & \vdots & & \\
s^0 & r_{n,0} & &
\end{array}
\qquad r_{2,0}=-\tfrac{1}{a_{n-1}}\begin{vmatrix}1&a_{n-2}\\a_{n-1}&a_{n-3}\end{vmatrix},\ \dots
$$

**General entry formula.** Let row $k$ (0-indexed, so $k=0$ is $s^n$, $k=1$ is $s^{n-1}$, …) have entries $r_{k,0},r_{k,1},r_{k,2},\dots$ Then each entry in row $k+1$ is

$$
\boxed{r_{k+1,\,j} = -\frac{1}{r_{k,0}}\begin{vmatrix}r_{k-1,0} & r_{k-1,\,j+1}\\r_{k,0} & r_{k,\,j+1}\end{vmatrix} = r_{k-1,\,j+1} - \frac{r_{k-1,0}}{r_{k,0}}\,r_{k,\,j+1}}
$$

where $r_{k,0}$ is the **pivot** (first-column entry of row $k$), and missing entries are treated as 0. In words: the new entry is obtained by crossing out the first column and taking a 2×2 determinant of the two rows above, divided by the pivot.

> [!definition] Routh–Hurwitz criterion
> (i) $\pi(s)$ Hurwitz ⇔ **all first-column entries have the same sign**. (ii) If no zeros in the first column: **# sign changes = # roots with positive real part**, and there are no roots on the $j\omega$ axis.

> [!definition] Routh procedure
> 1. **Necessary check**: all coefficients present and same sign? If not → not Hurwitz, stop.
> 2. **First two rows** from the coefficients: $s^n$ row $=a_n,a_{n-2},a_{n-4},\dots$; $s^{n-1}$ row $=a_{n-1},a_{n-3},\dots$.
> 3. **Fill down**: each entry $=-\dfrac{1}{\text{pivot}}\begin{vmatrix}\text{top-left}&\text{top-right}\\\text{pivot}&\text{next}\end{vmatrix}$, row by row until $s^0$.
> 4. **Special cases** (below): zero in first column only → $\varepsilon$-method; a whole row of zeros → auxiliary polynomial from the row above, differentiate.
> 5. **Read**: # first-column sign changes $=$ # RHP roots; Hurwitz ⇔ no changes.
> 6. **With a gain $K$**: keep $K$ symbolic, require every first-column entry $>0$ → inequalities → stable range.

Three cases you must handle:

> [!example]- Case 1 — Normal (range of $K$): Practice Q1(b)
> $L(s)=\dfrac{K(s+2)}{s(s+1)(s+5)}$, $K>0$. Char: $s(s+1)(s+5)+K(s+2)=s^3+6s^2+(5+K)s+2K=0$.
> $$\begin{array}{c|cc}s^3&1&5+K\\ s^2&6&2K\\ s^1&\frac{6(5+K)-2K}{6}=\frac{30+4K}{6}&0\\ s^0&2K&\end{array}$$
> First column $>0$: $6>0$; $\frac{30+4K}{6}>0\Rightarrow K>-7.5$; $2K>0\Rightarrow K>0$. **⇒ stable for all $K>0$.** (Matches root locus: branches go straight up/down at $\mathrm{Re}=-2$, never enter RHP.)

> [!example]- Case 2 — Zero in first column, rest nonzero ($\varepsilon$-method)
> $\pi(s)=s^4+s^3+2s^2+2s+3$.
> $$\begin{array}{c|ccc}s^4&1&2&3\\ s^3&1&2&0\\ s^2&\frac{2-2}{1}=0\to\varepsilon&3&\\ s^1&\frac{2\varepsilon-3}{\varepsilon}&0&\\ s^0&3&&\end{array}$$
> Replace $0$ by small $\varepsilon\to0^+$. First col: $1,\,1,\,\varepsilon(+),\,\frac{2\varepsilon-3}{\varepsilon}\to-\infty(-),\,3(+)$. Signs $+,+,+,-,+$ ⇒ **2 sign changes ⇒ 2 RHP roots ⇒ unstable.**

> [!example]- Case 3 — Entire row of zeros (auxiliary polynomial ⇒ $j\omega$ roots)
> $\pi(s)=s^3+2s^2+s+2$.
> $$\begin{array}{c|cc}s^3&1&1\\ s^2&2&2\\ s^1&\frac{2\cdot1-1\cdot2}{2}=0&0\ \leftarrow\text{all zero}\end{array}$$
> Row of zeros ⇒ symmetric roots. Auxiliary from row above: $A(s)=2s^2+2$, $\frac{dA}{ds}=4s$; replace zero row with $[4,\ 0]$:
> $$\begin{array}{c|cc}s^1&4&0\\ s^0&\frac{4\cdot2-2\cdot0}{4}=2&\end{array}$$
> First col $1,2,4,2$: no sign change ⇒ no RHP roots. $A(s)=0\Rightarrow s=\pm j$ ⇒ **imaginary-axis roots ⇒ marginally stable (not asymptotic).**

## Nyquist Plot

> [!definition] Nyquist plot & criterion
> Nyquist plot = image of the Nyquist contour under $L(s)$ (detour on tiny RH semicircles around $j\omega$-axis poles). **Criterion:** closed loop stable ⇔ $N=P$, where $P$ = # RHP poles of $L$, $N$ = # **counterclockwise** encirclements of $-1$. If $N\neq P$: unstable with $P-N$ RHP closed-loop poles. If plot hits $-1$, $N$ undefined.
> Useful: $L(-j\omega)=\overline{L(j\omega)}$ (symmetry); strictly proper ⇒ $L(\infty)=0$.

**Corollary (stable $L$):** sufficient for stability that $|L(j\omega)|<1$ whenever $\angle L=\pm180°$, i.e. plot stays right of $-1$.

> [!example]- Worked — Q2(a): Nyquist of $L(s)=\frac{K}{s+2}$ ($T=0$, $K>0$)
> $L(j\omega)=\frac{K}{2+j\omega}$: starts at $K/2$ ($\omega=0$, on $+$real axis), phase $0°\to-90°$, $|L|\to0$. Full plot = circle through origin and $K/2$, entirely in the right-half of the plane ⇒ **never encircles $-1$**, $N=0$. Pole at $-2$ ⇒ $P=0$. $N=P=0$ ⇒ **stable for all $K>0$.**

**Fig — Nyquist of $\frac{K}{s+2}$ ($K=2$):**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=2.2cm,y=2.2cm,font=\small,>=stealth]
  \draw[->] (-1.6,0) -- (1.4,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-0.85) -- (0,0.85) node[above]{$\mathrm{Im}$};
  \draw[thick,blue,->] (1,0) arc (0:-180:0.5);
  \draw[thick,blue,->] (0,0) arc (180:0:0.5);
  \fill (1,0) circle (0.6pt) node[above right]{\scriptsize$\omega=0$};
  \fill (0,0) circle (0.6pt) node[above left]{\scriptsize$\omega=\pm\infty$};
  \fill[red] (-1,0) circle (1.2pt) node[below]{$-1$};
  \node[blue] at (0.5,-0.62) {$L(j\omega)$};
  \node[align=center] at (-0.72,0.55) {\scriptsize $-1$ not encircled\\\scriptsize $N=P=0\Rightarrow$ stable};
\end{tikzpicture}
\end{document}
```

### Hand-drawing recipe — any $L(s)$

Trace $L(j\omega)$ for $\omega:0^+\to\infty$; the $\omega<0$ half and the closure follow mechanically.

> [!definition] Nyquist sketching recipe (7 steps)
> 1. **Factor & classify** $L$: mark poles/zeros; let $k$ = # poles at origin (**type**), $r=n-m$ = relative degree, $P$ = # RHP poles. Put $L$ in Bode form $\mu\frac{\prod(1+\tau_z s)}{s^k\prod(1+\tau_p s)}$.
> 2. **Start** $\omega\to0^+$: type 0 → finite point $L(0)=\mu$ on the real axis. Type $k\ge1$ → $|L|\to\infty$ at angle $-90°k$. For **type 1** the branch hugs the **vertical asymptote** $\ \mathrm{Re}=\mu\big(\sum\tau_z-\sum\tau_p\big)$ while $\mathrm{Im}\to-\infty$.
> 3. **End** $\omega\to\infty$ (strictly proper): $|L|\to0$, entering the **origin** at angle $-90°r$.
> 4. **Axis crossings** — the ones that matter: solve $\angle L(j\omega)=-180°$ for $\omega$, then the negative-real crossing $=|L(j\omega)|$. (Set $\mathrm{Re}\{L\}=0$ for imaginary-axis crossings if needed.)
> 5. **Sweep**: for minimum-phase $L$ the phase **decreases monotonically** from $-90°k$ to $-90°r$ — move **clockwise** through the quadrants, joining the points from 2–4.
> 6. **Mirror & close**: reflect about the real axis ($L(-j\omega)=\overline{L(j\omega)}$). Each origin pole adds a **big clockwise arc** spanning $180°k$ at radius $\infty$ (through $+\mathrm{Re}$); the $\omega=\pm\infty$ ends meet at the origin.
> 7. **Stability**: count $N$ = CCW encirclements of $-1$; stable iff $N=P$. Shortcut: is the $-180°$ crossing to the right of $-1$?

> [!annotation]- Why the start / asymptote / end / arc rules hold
> **Start & asymptote (type 1).** Small $\omega$: $L\approx\dfrac{\mu(1+j\omega\sum\tau_z)}{j\omega(1+j\omega\sum\tau_p)}\approx\dfrac{\mu}{j\omega}+\mu\big(\textstyle\sum\tau_z-\sum\tau_p\big)$. The $\mu/j\omega=-j\mu/\omega\to-j\infty$; the constant term is the real offset ⇒ vertical asymptote at $\mathrm{Re}=\mu(\sum\tau_z-\sum\tau_p)$. General type $k$: $L\approx\mu/(j\omega)^k$ ⇒ $|L|\to\infty$, $\angle=-90°k$.
> **End.** Large $\omega$: $L\approx(\text{lead coeff})/(j\omega)^r$ ⇒ $|L|\to0$, $\angle\to-90°r$.
> **Infinite arc.** Origin detour $s=\varepsilon e^{j\theta}$, $\theta:-90°\!\to\!+90°$: $L\approx(\mu/\varepsilon^k)e^{-jk\theta}$ — radius $\to\infty$, angle sweeps $-180°k$ ⇒ $k$ clockwise half-turns through $+\mathrm{Re}$.

> [!example]- Worked — full sketch of $L=\dfrac{K}{s(s+1)(s+2)}$ ($K>0$)
> **1.** Poles $0,-1,-2$; $k=1$, $r=3$, $P=0$. Bode form $\mu=\tfrac K2$, $\tau_p=\{1,\tfrac12\}$.
> **2.** $\omega\to0^+$: $|L|\to\infty$ at $-90°$; asymptote $\mathrm{Re}=\mu(0-\tfrac32)=-\tfrac{3K}{4}$ (branch rises from $(-\tfrac{3K}{4},-\infty)$).
> **3.** $\omega\to\infty$: origin at $-90°\cdot3=-270°$ (enters from $+\mathrm{Im}$).
> **4.** $\angle L=-90°-\arctan\omega-\arctan\tfrac\omega2=-180°\Rightarrow\arctan\omega+\arctan\tfrac\omega2=90°\Rightarrow1-\tfrac{\omega^2}{2}=0\Rightarrow\omega=\sqrt2$. Then $|L(j\sqrt2)|=\dfrac{K}{\sqrt2\,\sqrt3\,\sqrt6}=\dfrac{K}{6}$ ⇒ crosses the $-$real axis at $-\tfrac K6$.
> **5.** Phase $-90°\to-180°\,(@\,\sqrt2,\text{ at }-\tfrac K6)\to-270°$: 3rd quadrant → real axis → 2nd quadrant → origin.
> **6.** Mirror for $\omega<0$; one clockwise $180°$ arc at $\infty$ (type 1).
> **7.** $-1$ encircled iff $-\tfrac K6<-1\Leftrightarrow K>6$. So **stable for $0<K<6$** ($N=P=0$); $K>6\Rightarrow N=-2$, $P-N=2$ RHP poles. ✔ Cross-check Routh on $s^3+3s^2+2s+K$: stable iff $0<K<6$.

#### Build it stage by stage — $L=\dfrac{K}{s(s+1)(s+2)}$, $K>0$

*Setup (step 1):* poles $0,-1,-2$ ⇒ type $k=1$, relative degree $r=3$, $P=0$, $\mu=K/2$. Precompute the two anchors — asymptote at $\mathrm{Re}=\mu(\sum\tau_z-\sum\tau_p)=-3K/4$, and the $-180^\circ$ crossing at $\omega=\sqrt2$ where $|L|=K/6$ (curve cuts the real axis at $-K/6$).

**Stage 1 — plot the three anchors.** Nothing is joined yet: just mark where the curve *starts* ($\omega\to0^+$), where it *crosses* the negative real axis, and where it *ends* ($\omega\to\infty$).
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=0.9cm,font=\small,>=stealth]
  \draw[->] (-3,0) -- (1.4,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-3.4) -- (0,3.4) node[above]{$\mathrm{Im}$};
  \draw[dashed,gray] (-2.4,-3.3) -- (-2.4,3.3);
  \node[gray,font=\scriptsize] at (-2.4,3.65) {$\mathrm{Re}=-3K/4$};
  \fill[blue] (-2.4,-3.0) circle (1.3pt);
  \draw[blue,->] (-2.4,-3.15) -- (-2.4,-2.3);
  \node[blue,right,align=center,font=\scriptsize] at (-2.3,-2.6) {start $\omega=0^+$\\$|L|\to\infty$ ($-90^\circ$)};
  \fill[blue] (-0.6,0) circle (1.3pt);
  \node[blue,below,align=center,font=\scriptsize] at (-0.6,-0.15) {$-K/6$\\($-180^\circ$)};
  \fill[blue] (0,0) circle (1.3pt);
  \draw[blue,->] (0.12,0.95) -- (0.01,0.06);
  \node[blue,right,align=center,font=\scriptsize] at (0.15,1.25) {end $\omega\to\infty$\\origin ($-270^\circ$)};
\end{tikzpicture}
\end{document}
```

**Stage 2 — draw the $\omega:0^+\to\infty$ branch.** Phase falls $-90^\circ\to-270^\circ$, so sweep **clockwise**: up along the asymptote (3rd quadrant), through $-K/6$, into the 2nd quadrant, into the origin.
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=0.9cm,font=\small,>=stealth]
  \draw[->] (-3,0) -- (1.4,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-3.4) -- (0,3.4) node[above]{$\mathrm{Im}$};
  \draw[dashed,gray] (-2.4,-3.3) -- (-2.4,3.3);
  \node[gray,font=\scriptsize] at (-2.4,3.65) {$\mathrm{Re}=-3K/4$};
  \draw[blue,thick,->] (-2.32,-3.0) .. controls (-2.5,-1.1) and (-1.5,-0.03) .. (-0.6,0);
  \draw[blue,thick,->] (-0.6,0) .. controls (-0.12,0.03) and (0.06,0.7) .. (0,0.02);
  \fill[blue] (-0.6,0) circle (1.3pt);
  \node[blue,below,font=\scriptsize] at (-0.6,-0.12) {$-K/6$};
  \node[font=\scriptsize] at (-1.75,-1.7) {3rd quad};
  \node[font=\scriptsize] at (-0.5,1.15) {2nd quad};
  \node[blue,font=\scriptsize] at (-2.35,-2.65) {$\omega=0^+$};
  \node[font=\scriptsize] at (0.5,0.5) {$\omega\to\infty$};
\end{tikzpicture}
\end{document}
```

**Stage 3 — mirror, then close.** Reflect the branch about the real axis for $\omega<0$ (gray), then join the $\omega=\pm\infty$ ends with one clockwise $180^\circ$ arc at radius $\infty$ (one origin pole ⇒ one half-turn through $+\mathrm{Re}$).
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=0.9cm,font=\small,>=stealth]
  \draw[->] (-3,0) -- (1.4,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-3.4) -- (0,3.4) node[above]{$\mathrm{Im}$};
  \draw[dashed,gray] (-2.4,-3.3) -- (-2.4,3.3);
  \draw[dotted] (-2.3,-3.1) .. controls (3.7,-3.3) and (3.7,3.3) .. (-2.3,3.1);
  \node[align=center,font=\scriptsize] at (2.6,0) {arc\\at $\infty$};
  \draw[blue,thick,->] (-2.32,-3.0) .. controls (-2.5,-1.1) and (-1.5,-0.03) .. (-0.6,0);
  \draw[blue,thick,->] (-0.6,0) .. controls (-0.12,0.03) and (0.06,0.7) .. (0,0.02);
  \draw[gray,thick] (-2.32,3.0) .. controls (-2.5,1.1) and (-1.5,0.03) .. (-0.6,0);
  \draw[gray,thick] (-0.6,0) .. controls (-0.12,-0.03) and (0.06,-0.7) .. (0,-0.02);
  \fill[blue] (-0.6,0) circle (1.3pt);
  \node[blue,below right,font=\scriptsize] at (-0.55,-0.05) {$-K/6$};
  \node[blue,font=\scriptsize] at (-2.0,-2.6) {$\omega>0$};
  \node[align=center,gray,font=\scriptsize] at (-1.55,2.4) {$\omega<0$\\(mirror)};
\end{tikzpicture}
\end{document}
```

**Stage 4 — read stability.** Mark $-1$ and count CCW encirclements $N$; stable iff $N=P=0$. The crossing $-K/6$ stays right of $-1$ while $K<6$ ⇒ not encircled ⇒ **stable for $0<K<6$** (for $K>6$, $-1$ is enclosed: $N=-2$, giving $P-N=2$ RHP poles). ✔ matches Routh on $s^3+3s^2+2s+K$.
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=0.9cm,font=\small,>=stealth]
  \draw[->] (-3,0) -- (1.4,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-3.4) -- (0,3.4) node[above]{$\mathrm{Im}$};
  \draw[dashed,gray] (-2.4,-3.3) -- (-2.4,3.3);
  \node[gray,font=\scriptsize] at (-2.4,3.65) {$\mathrm{Re}=-3K/4$};
  \draw[dotted] (-2.3,-3.1) .. controls (3.7,-3.3) and (3.7,3.3) .. (-2.3,3.1);
  \draw[blue,thick,->] (-2.32,-3.0) .. controls (-2.5,-1.1) and (-1.5,-0.03) .. (-0.6,0);
  \draw[blue,thick,->] (-0.6,0) .. controls (-0.12,0.03) and (0.06,0.7) .. (0,0.02);
  \draw[gray,thick] (-2.32,3.0) .. controls (-2.5,1.1) and (-1.5,0.03) .. (-0.6,0);
  \draw[gray,thick] (-0.6,0) .. controls (-0.12,-0.03) and (0.06,-0.7) .. (0,-0.02);
  \fill[blue] (-0.6,0) circle (1.3pt);
  \node[below right,blue,font=\scriptsize] at (-0.55,-0.05) {$-K/6$};
  \fill[red] (-1,0) circle (1.3pt) node[above,font=\scriptsize]{$-1$};
  \node[red,align=center,font=\scriptsize] at (-1.7,-1.7) {$-1$ right of curve\\$\Rightarrow N=P=0$\\stable};
\end{tikzpicture}
\end{document}
```

## Stability Margins

> [!definition] Gain & phase margin
> Let $\omega_\pi$: $\angle L(j\omega_\pi)=-180°$, and $\omega_c$ (**crossover**): $|L(j\omega_c)|=1$.
> $$k_m=\frac{1}{|L(j\omega_\pi)|}\quad(\text{gain margin}),\qquad \varphi_m=180°-|\angle L(j\omega_c)|\quad(\text{phase margin}).$$
> $k_m$ = max gain blow-up before instability; $\varphi_m$ = max added phase lag before instability. **Both positive (dB / degrees) ⇒ closed loop stable.** Read directly off the Bode plot of $L$.

**Fig — reading $k_m,\varphi_m$ off the Bode plot of $L$:**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[font=\small,>=stealth]
 \begin{scope}
  \draw[->] (0,-1.4) -- (0,1.6) node[above]{$|L|_{dB}$};
  \draw[->] (0,0) -- (5.3,0) node[right]{$\log\omega$};
  \draw[thick,blue] (0.3,1.3) .. controls (2,0.8) and (2.6,0.2) .. (5,-1.15);
  \draw[dotted] (2.9,0) -- (2.9,-1.2);
  \draw[<->,red] (4.1,-0.7) -- (4.1,0);
  \node[right,black] at (4.1,-0.4) {\scriptsize$k_m$(dB)};
  \node[below] at (2.9,0) {$\omega_c$};
  \node[above right] at (4.1,0) {\scriptsize$\omega_\pi$};
 \end{scope}
 \begin{scope}[yshift=-3.5cm]
  \draw[->] (0,-2.0) -- (0,0.45) node[above]{$\angle L$};
  \draw[->] (0,0) -- (5.3,0) node[right]{$\log\omega$};
  \draw[dashed] (0,-1.4) -- (5,-1.4) node[right,black]{\scriptsize$-180^\circ$};
  \draw[thick,blue] (0.3,-0.1) .. controls (2,-0.4) and (2.6,-1.0) .. (5,-1.85);
  \draw[dotted] (2.9,0) -- (2.9,-1.4);
  \draw[<->,red] (2.9,-1.4) -- (2.9,-0.87);
  \node[right,black] at (2.9,-1.13) {\scriptsize$\varphi_m$};
  \node[below] at (2.9,-1.4) {\scriptsize$\omega_c$};
  \node[above right] at (4.1,-1.4) {\scriptsize$\omega_\pi$};
 \end{scope}
\end{tikzpicture}
\end{document}
```

> [!annotation]- Derivation — pure delay $e^{-sT}$ eats phase margin
> Delay: $|e^{-j\omega T}|=1$ (magnitude, hence $\omega_c$, unchanged) but $\angle=-\omega T$ rad (extra lag, grows with $\omega$). So $\varphi_m(T)=\varphi_m(0)-\omega_c T$ (convert $\omega_c T$ rad→deg). Instability when lag consumes the whole margin: $\omega_c T_{max}=\varphi_m(0)$.

> [!example]- Worked — Q2(b,c): max delay & PM for $L=\frac{4e^{-sT}}{s+2}$
> **Crossover:** $|L|=\frac{4}{\sqrt{\omega^2+4}}=1\Rightarrow\omega^2=12\Rightarrow\omega_c=2\sqrt3\approx3.46$.
> **Phase at $\omega_c$ (no delay):** $\angle=-\arctan(\omega_c/2)=-\arctan\sqrt3=-60°$ ⇒ $\varphi_m(0)=180-60=120°=\frac{2\pi}{3}$ rad.
> **(b)** Instability at $\angle L=-180°$: $-60°-\omega_c T_{max}=-180°\Rightarrow\omega_c T_{max}=\frac{2\pi}{3}$ ⇒
> $$T_{max}=\frac{2\pi/3}{2\sqrt3}=\frac{\pi}{3\sqrt3}\approx0.605\ \text{s}.$$
> **(c)** Delay leaves $\omega_c$ fixed but subtracts $\omega_c T$: $\varphi_m(T)=120°-\omega_c T$ (rad→deg). PM shrinks linearly with $T$, hitting $0$ at $T_{max}$ ⇒ delay is strictly destabilizing.

> [!example]- Worked — Q7(b,c,d): Bode analysis of $L=\frac{100}{s(s/10+1)(s/50+1)}$
> Corners at $\omega=10,50$; low-freq asymptote $|L|\approx100/\omega$ ($-20$ dB/dec).
> **(b)** In $10<\omega<50$ (slope $-40$): $|L|\approx\frac{1000}{\omega^2}=1\Rightarrow\omega_{gc}=\sqrt{1000}\approx31.6$ rad/s.
> **(c)** $\angle L=-90°-\arctan\frac{\omega}{10}-\arctan\frac{\omega}{50}$. At $31.6$: $-90-72.4-32.3=-194.7°$ ⇒ $\varphi_m=180-194.7=\boxed{-14.7°}$ ⇒ **PM negative ⇒ closed loop unstable** (gain too high).
> **(d)** As $\omega\to\infty$: 3 poles, 0 zeros ⇒ $-60$ dB/decade high-freq attenuation.

## Root Locus

Roots of $1+L(s)=0$, $L=\mu\frac{N_0(s)}{D(s)}$ (deg $m,n$), as $\mu$ varies over $(0,\infty)$.

> [!definition] Root-locus rules ($\mu>0$)
> 1. $n$ branches (one per pole), symmetric about real axis; **start at poles**, end at zeros ($m$ of them) or $\infty$ ($n-m$).
> 2. **Real-axis segment**: points with an **odd** number of real poles+zeros to their right.
> 3. **Asymptotes** ($n-m$ of them): meet at centroid $x_a=\dfrac{\sum p_i-\sum z_i}{n-m}$, angles $\psi_a=\dfrac{(2k+1)}{n-m}180°$, $k=0,\dots,n-m-1$.

> [!definition] Root-locus drawing procedure
> Steps 1–3 = the rules above (branches, real-axis segments, asymptotes). Then:
> 4. **Breakaway / break-in** (branches leaving/joining the real axis): solve $\frac{dK}{ds}=0$, i.e. $\sum_i\frac{1}{s-p_i}=\sum_j\frac{1}{s-z_j}$; keep only real roots that lie on a locus segment.
> 5. **$j\omega$-axis crossing** (stability limit): put $s=j\omega$ in $1+L=0$, set real part $=0$ and imag part $=0$ → solve for $\omega$ and the critical gain $K$ (or use Routh).
> 6. **Angle of departure/arrival** at a complex pole/zero: $\theta_{dep}=180°+\sum\angle(\text{from zeros})-\sum\angle(\text{from other poles})$.
> 7. **Gain at a point** $s_0$ on the locus: $K=\dfrac{1}{|G(s_0)|}=\dfrac{\prod_i|s_0-p_i|}{\prod_j|s_0-z_j|}$.
> Then draw smooth branches poles→(zeros/asymptotes), symmetric about the real axis.

> [!example]- Worked — Q1(a): root locus of $L=\frac{K(s+2)}{s(s+1)(s+5)}$
> Poles $0,-1,-5$; zero $-2$. $n=3,m=1\Rightarrow n-m=2$ asymptotes.
> **Centroid:** $x_a=\frac{(0-1-5)-(-2)}{2}=\frac{-4}{2}=-2$. **Angles:** $\frac{180°}{2},\frac{3\cdot180°}{2}=\pm90°$ (vertical).
> **Real-axis segments** (odd count to the right): $[-1,0]$ and $[-5,-2]$.
> Sketch: branch from $0$ and from $-1$ approach each other on $[-1,0]$, break away, rise/fall along the vertical asymptotes at $\mathrm{Re}=-2$; branch from $-5$ runs right to the zero at $-2$. Whole locus in LHP ⇒ consistent with "stable $\forall K>0$."

**Fig — root locus of Q1 (× poles, ○ zero, thick = real-axis locus, dashed = asymptotes):**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=1cm,font=\small,>=stealth]
  \draw[->] (-6.2,0) -- (0.9,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.9) -- (0,2.9) node[above]{$\mathrm{Im}$};
  \draw[very thick,blue] (-1,0) -- (0,0);
  \draw[very thick,blue] (-5,0) -- (-2,0);
  \draw[dashed,gray] (-2,-2.7) -- (-2,2.7);
  \draw[blue,thick] (-0.45,0) .. controls (-0.45,1.1) and (-1.5,1.7) .. (-2,2.6);
  \draw[blue,thick] (-0.45,0) .. controls (-0.45,-1.1) and (-1.5,-1.7) .. (-2,-2.6);
  \foreach \p in {0,-1,-5}{
    \draw[thick] (\p-0.13,-0.13)--(\p+0.13,0.13);
    \draw[thick] (\p-0.13,0.13)--(\p+0.13,-0.13);
  }
  \draw[thick,fill=white] (-2,0) circle (0.13);
  \node[below] at (0,-0.2) {$0$};
  \node[below] at (-1,-0.2) {$-1$};
  \node[below] at (-5,-0.2) {$-5$};
  \node[above right] at (-2,0.12) {zero $-2$};
  \node[gray,align=center] at (-3.7,2.2) {\scriptsize asymptotes\\\scriptsize $\pm90^\circ$, $\mathrm{Re}=-2$};
\end{tikzpicture}
\end{document}
```

> [!example]- Worked — full locus of $L=\frac{K}{s(s+1)(s+2)}$ (breakaway + $j\omega$ crossing)
> **1–2.** Poles $0,-1,-2$; $n=3,m=0$; 3 branches. Real-axis locus: $[-1,0]$ and $(-\infty,-2]$.
> **3.** Asymptotes: centroid $x_a=\frac{0-1-2}{3}=-1$; angles $60°,180°,300°$.
> **4.** Breakaway on $[-1,0]$: $\frac1s+\frac1{s+1}+\frac1{s+2}=0\Rightarrow3s^2+6s+2=0\Rightarrow s=-0.42$ (the other root $-1.58$ is not on the locus).
> **5.** $j\omega$ crossing: $s^3+3s^2+2s+K=0$ with $s=j\omega$: imag $2\omega-\omega^3=0\Rightarrow\omega=\sqrt2$; real $K-3\omega^2=0\Rightarrow K=6$.
> **7.** Poles stay in the LHP ⇒ **stable for $0<K<6$**; at $K=6$ the pair sits at $\pm j\sqrt2$.
> Note: same $K<6$ from Routh and from the Nyquist crossing at $-K/6$ — three methods, one answer.

#### Build it stage by stage — $L=\dfrac{K}{s(s+1)(s+2)}$

Poles $0,-1,-2$; $n=3$, $m=0$ (no zeros).

**Stage 1 — plot poles ($\times$) and zeros ($\circ$).** $n=3$ branches, one starting at each pole; with no zeros all three run off to $\infty$.
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1.1cm,y=1.1cm,font=\small,>=stealth]
  \draw[->] (-3.4,0) -- (1.0,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.3) -- (0,2.3) node[above]{$\mathrm{Im}$};
  \foreach \p in {0,-1,-2}{
    \draw[thick] (\p-0.12,-0.12)--(\p+0.12,0.12);
    \draw[thick] (\p-0.12,0.12)--(\p+0.12,-0.12);
  }
  \node[below,font=\scriptsize] at (0,-0.18) {$0$};
  \node[below,font=\scriptsize] at (-1,-0.18) {$-1$};
  \node[below,font=\scriptsize] at (-2,-0.18) {$-2$};
  \node[align=center,font=\scriptsize] at (-1,1.7) {3 poles, 0 zeros\\$\Rightarrow$ 3 branches to $\infty$};
\end{tikzpicture}
\end{document}
```

**Stage 2 — mark the real-axis segments.** A real point is on the locus iff an **odd** number of poles+zeros lie to its right: that gives $[-1,0]$ and $(-\infty,-2]$.
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1.1cm,y=1.1cm,font=\small,>=stealth]
  \draw[->] (-3.4,0) -- (1.0,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.3) -- (0,2.3) node[above]{$\mathrm{Im}$};
  \draw[very thick,blue] (-1,0) -- (0,0);
  \draw[very thick,blue] (-3.3,0) -- (-2,0);
  \foreach \p in {0,-1,-2}{
    \draw[thick] (\p-0.12,-0.12)--(\p+0.12,0.12);
    \draw[thick] (\p-0.12,0.12)--(\p+0.12,-0.12);
  }
  \node[below,font=\scriptsize] at (0,-0.18) {$0$};
  \node[below,font=\scriptsize] at (-1,-0.18) {$-1$};
  \node[below,font=\scriptsize] at (-2,-0.18) {$-2$};
  \node[blue,font=\scriptsize] at (-0.5,0.55) {$[-1,0]$};
  \node[blue,font=\scriptsize] at (-2.7,0.55) {$(-\infty,-2]$};
\end{tikzpicture}
\end{document}
```

**Stage 3 — draw the asymptotes.** $n-m=3$ of them, meeting at the centroid $x_a=\frac{0-1-2}{3}=-1$, at angles $60^\circ,180^\circ,300^\circ$.
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1.1cm,y=1.1cm,font=\small,>=stealth]
  \draw[->] (-3.4,0) -- (1.0,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.3) -- (0,2.3) node[above]{$\mathrm{Im}$};
  \draw[very thick,blue] (-1,0) -- (0,0);
  \draw[very thick,blue] (-3.3,0) -- (-2,0);
  \draw[dashed,gray] (-1,0) -- (0.5,2.598);
  \draw[dashed,gray] (-1,0) -- (0.5,-2.598);
  \draw[dashed,gray] (-1,0) -- (-3.3,0);
  \node[gray,font=\scriptsize] at (0.35,1.9) {$60^\circ$};
  \foreach \p in {0,-1,-2}{
    \draw[thick] (\p-0.12,-0.12)--(\p+0.12,0.12);
    \draw[thick] (\p-0.12,0.12)--(\p+0.12,-0.12);
  }
  \node[below,font=\scriptsize] at (0,-0.18) {$0$};
  \node[below,font=\scriptsize] at (-1,-0.28) {$-1$};
  \node[below,font=\scriptsize] at (-2,-0.18) {$-2$};
  \node[gray,above right,font=\scriptsize] at (-1,0.05) {$x_a=-1$};
\end{tikzpicture}
\end{document}
```

**Stage 4 — find breakaway & $j\omega$ crossing.** Breakaway on $[-1,0]$ from $\frac{dK}{ds}=0$: $s=-0.42$. Crossing: sub $s=j\omega$ into $s^3+3s^2+2s+K=0$ ⇒ $\omega=\sqrt2$ at $K=6$ (the stability limit).
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1.1cm,y=1.1cm,font=\small,>=stealth]
  \draw[->] (-3.4,0) -- (1.0,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.3) -- (0,2.3) node[above]{$\mathrm{Im}$};
  \draw[very thick,blue] (-1,0) -- (0,0);
  \draw[very thick,blue] (-3.3,0) -- (-2,0);
  \draw[dashed,gray] (-1,0) -- (0.5,2.598);
  \draw[dashed,gray] (-1,0) -- (0.5,-2.598);
  \draw[dashed,gray] (-1,0) -- (-3.3,0);
  \foreach \p in {0,-1,-2}{
    \draw[thick] (\p-0.12,-0.12)--(\p+0.12,0.12);
    \draw[thick] (\p-0.12,0.12)--(\p+0.12,-0.12);
  }
  \fill[red] (-0.42,0) circle (1.3pt);
  \node[red,align=center,font=\scriptsize] at (0.15,0.6) {breakaway\\$-0.42$};
  \fill[blue] (0,1.414) circle (1.3pt) node[right,font=\scriptsize]{$j\sqrt2$, $K=6$};
  \fill[blue] (0,-1.414) circle (1.3pt) node[right,font=\scriptsize]{$-j\sqrt2$};
  \node[below,font=\scriptsize] at (-2,-0.18) {$-2$};
\end{tikzpicture}
\end{document}
```

**Stage 5 — join into smooth branches.** Two poles ($0,-1$) meet at the breakaway, split off the axis and follow the $\pm60^\circ$ asymptotes; the pole at $-2$ runs left along the real axis. Branches cross into the RHP only past $K=6$ ⇒ **stable for $0<K<6$**.
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1.1cm,y=1.1cm,font=\small,>=stealth]
  \draw[->] (-3.4,0) -- (1.0,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-2.3) -- (0,2.3) node[above]{$\mathrm{Im}$};
  \draw[very thick,blue] (-1,0) -- (0,0);
  \draw[very thick,blue] (-3.3,0) -- (-2,0);
  \draw[dashed,gray] (-1,0) -- (0.5,2.598);
  \draw[dashed,gray] (-1,0) -- (0.5,-2.598);
  \draw[dashed,gray] (-1,0) -- (-3.3,0);
  \node[gray,font=\scriptsize] at (0.35,1.9) {$60^\circ$};
  \draw[blue,thick,->] (-0.42,0) .. controls (-0.32,0.9) and (-0.12,1.15) .. (0,1.414);
  \draw[blue,thick] (0,1.414) .. controls (0.12,1.7) and (0.28,2.05) .. (0.42,2.4);
  \draw[blue,thick,->] (-0.42,0) .. controls (-0.32,-0.9) and (-0.12,-1.15) .. (0,-1.414);
  \draw[blue,thick] (0,-1.414) .. controls (0.12,-1.7) and (0.28,-2.05) .. (0.42,-2.4);
  \draw[blue,thick,->] (-2,0) -- (-3.25,0);
  \foreach \p in {0,-1,-2}{
    \draw[thick] (\p-0.12,-0.12)--(\p+0.12,0.12);
    \draw[thick] (\p-0.12,0.12)--(\p+0.12,-0.12);
  }
  \fill[red] (-0.42,0) circle (1.3pt);
  \node[red,above,font=\scriptsize] at (-0.42,0.05) {$-0.42$};
  \fill[blue] (0,1.414) circle (1.3pt) node[right,font=\scriptsize]{$j\sqrt2,\ K{=}6$};
  \fill[blue] (0,-1.414) circle (1.3pt);
  \node[below,font=\scriptsize] at (0.05,-0.15) {$0$};
  \node[below,font=\scriptsize] at (-1,-0.15) {$-1{=}x_a$};
  \node[below,font=\scriptsize] at (-2,-0.15) {$-2$};
\end{tikzpicture}
\end{document}
```

---
[[3 - Linear System Theory]] · → Next: [[5 - Controller Synthesis]]
