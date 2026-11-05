---
tags: [ece380, control-systems, appendix]
---
> [[Notes/System Design/Overview]] · [[5 - Controller Synthesis|← Controller Synthesis]] · Appendix

# Appendix · System Parameters

All parameters appearing in loop-shaping and pole-placement specs — definition, analytic formula, and graphical reading from Bode and Nyquist plots.

---

## Frequency-Domain Parameters

| Parameter | Symbol | Definition |
|---|---|---|
| Gain crossover frequency | $\omega_c$ | $\lvert L(j\omega_c)\rvert=1$ |
| Phase crossover frequency | $\omega_\pi$ | $\angle L(j\omega_\pi)=-180°$ |
| Phase margin | $\varphi_m$ | $180°+\angle L(j\omega_c)$ |
| Gain margin | $k_m$ | $1/\lvert L(j\omega_\pi)\rvert$ (linear); $\;-20\log_{10}\lvert L(j\omega_\pi)\rvert$ dB |

### Analytic Extraction

For $L(s)=K\dfrac{\prod_i(s+z_i)}{\prod_j(s+p_j)}$ with $n_0$ integrators, evaluate at $s=j\omega$:

$$\lvert L(j\omega)\rvert = \lvert K\rvert\,\frac{\prod_i\sqrt{\omega^2+z_i^2}}{\omega^{n_0}\prod_j\sqrt{\omega^2+p_j^2}}, \qquad \angle L(j\omega) = \sum_i\arctan\!\tfrac{\omega}{z_i}-\sum_j\arctan\!\tfrac{\omega}{p_j}-n_0\cdot90°+\begin{cases}0°&K>0\\{-180°}&K<0\end{cases}$$

**Recipe:**

| Step | Operation |
|---|---|
| Find $\omega_c$ | Set $\lvert L(j\omega)\rvert=1$, solve (algebraic or numerical) |
| Find $\varphi_m$ | Evaluate $\angle L(j\omega_c)+180°$ |
| Find $\omega_\pi$ | Set $\angle L(j\omega)=-180°$, solve (sum of $\arctan$ terms $= -180°$) |
| Find $k_m$ | $1/\lvert L(j\omega_\pi)\rvert$; dB form: $-20\log_{10}\lvert L(j\omega_\pi)\rvert$ |

---

### Reading from the Bode Plot

**$\omega_c$**: where magnitude crosses **0 dB**. **$\omega_\pi$**: where phase crosses **−180°**. **$\varphi_m$**: gap from −180° up to the phase curve at $\omega_c$. **$k_m$** (dB): gap from magnitude curve at $\omega_\pi$ up to 0 dB.

**Fig — Bode: reading $\omega_c,\omega_\pi,\varphi_m,k_m$:**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[font=\small,>=stealth]
 \begin{scope}
  \draw[->] (0,-1.4) -- (0,1.6) node[above]{$|L|_\mathrm{dB}$};
  \draw[->] (0,0) -- (5.5,0) node[right]{$\log\omega$};
  \draw[dashed,gray] (0,0) -- (5.2,0) node[right]{\scriptsize 0 dB};
  \draw[thick,blue] (0.3,1.3) .. controls (2,0.8) and (2.6,0.2) .. (5,-1.15);
  \draw[dotted] (2.9,0.05) -- (2.9,-1.2);
  \node[above,font=\scriptsize] at (2.9,0) {$\omega_c$};
  \draw[dotted] (4.1,0.05) -- (4.1,-1.2);
  \node[above,font=\scriptsize] at (4.1,0) {$\omega_\pi$};
  \draw[<->,red] (4.1,-0.7) -- (4.1,0);
  \node[right,font=\scriptsize] at (4.1,-0.35) {$k_m$};
  \node[above left,font=\scriptsize] at (0,1.55) {\textbf{(a) Magnitude}};
 \end{scope}
 \begin{scope}[yshift=-3.6cm]
  \draw[->] (0,-2.0) -- (0,0.5) node[above]{$\angle L$};
  \draw[->] (0,0) -- (5.5,0) node[right]{$\log\omega$};
  \draw[dashed] (0,-1.4) -- (5.2,-1.4) node[right,font=\scriptsize]{$-180^\circ$};
  \draw[thick,blue] (0.3,-0.1) .. controls (2,-0.4) and (2.6,-1.0) .. (5,-1.85);
  \draw[dotted] (2.9,0.05) -- (2.9,-1.4);
  \node[above,font=\scriptsize] at (2.9,0) {$\omega_c$};
  \draw[dotted] (4.1,0.05) -- (4.1,-1.4);
  \node[above,font=\scriptsize] at (4.1,0) {$\omega_\pi$};
  \draw[<->,red] (2.9,-1.4) -- (2.9,-0.87);
  \node[right,font=\scriptsize] at (2.9,-1.13) {$\varphi_m$};
  \node[above left,font=\scriptsize] at (0,0.45) {\textbf{(b) Phase}};
 \end{scope}
\end{tikzpicture}
\end{document}
```

---

### Reading from the Nyquist Plot

- **$\varphi_m$**: where $L(j\omega)$ crosses the **unit circle** ($\lvert L\rvert=1$); $\varphi_m$ = angle from the **negative real axis** to that crossing, measured at the origin.
- **$k_m$**: where $L(j\omega)$ crosses the **negative real axis** at $-a$; then $k_m=1/a$. For a stable system $a<1$, so the crossing lies between $O$ and $-1$.

**Fig — Nyquist: reading $\varphi_m,k_m$:**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1cm,y=0.9cm,font=\small,>=stealth]
  \draw[->] (-3.2,0) -- (1.0,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-3.2) -- (0,3.2) node[above]{$\mathrm{Im}$};
  % unit circle
  \draw[dashed,gray] (0,0) circle (1.5);
  \node[gray,font=\scriptsize] at (1.1,1.1) {$|L|{=}1$};
  % Nyquist curve omega>0: from (0,-3) sweeps 3rd quadrant,
  % crosses unit circle at ~(-1.3,-0.75) [radius 1.5 at -150 deg],
  % crosses neg-real at (-0.75,0), approaches origin
  \draw[blue,thick,->] (0,-3.0)
    .. controls (-0.6,-2.7) and (-2.2,-1.5) .. (-1.3,-0.75);
  \draw[blue,thick,->] (-1.3,-0.75)
    .. controls (-1.0,-0.3) and (-0.75,-0.05) .. (-0.75,0);
  \draw[blue,thick] (-0.75,0)
    .. controls (-0.4,-0.03) and (-0.1,-0.01) .. (0,0);
  % conjugate omega<0 (dashed mirror)
  \draw[gray,thick] (0,3.0)
    .. controls (-0.6,2.7) and (-2.2,1.5) .. (-1.3,0.75);
  \draw[gray,thick] (-1.3,0.75)
    .. controls (-1.0,0.3) and (-0.75,0.05) .. (-0.75,0);
  % unit circle crossing point (omega_c, lower half)
  \fill[blue] (-1.3,-0.75) circle (1.3pt);
  \node[blue,left,font=\scriptsize] at (-1.35,-0.75) {$|L|{=}1$};
  % phi_m arc: from 180 deg to 210 deg (=-150) radius 0.85
  \draw[dashed,gray] (0,0) -- (-2.2,0);
  \draw[dashed,gray] (0,0) -- (-1.3,-0.75);
  \draw[->,red] (-0.85,0) arc(180:210:0.85);
  \node[red,font=\scriptsize] at (-1.0,-0.35) {$\varphi_m$};
  % negative real axis crossing (omega_pi)
  \fill[blue] (-0.75,0) circle (1.3pt);
  \node[blue,above,font=\scriptsize] at (-0.75,0.08) {$-\tfrac{1}{k_m}$};
  % -1 point
  \fill[red] (-1.5,0) circle (1.3pt) node[above,font=\scriptsize]{$-1$};
  % k_m brace
  \draw[<->,red] (-0.75,-0.55) -- node[below,font=\scriptsize]{$1/k_m$} (0,-0.55);
  % labels
  \node[blue,font=\scriptsize] at (0.25,-2.0) {$\omega{\uparrow}$};
  \node[gray,font=\scriptsize] at (-2.2,2.2) {$\omega{<}0$};
\end{tikzpicture}
\end{document}
```

---

## Time-Domain / $s$-Plane Parameters

For a **dominant complex pair** $s^*=-\sigma\pm j\omega_d$:

| Parameter | Symbol | Formula |
|---|---|---|
| Damping ratio | $\zeta$ | $\cos\beta$, where $\beta$ = angle from $-$Re axis to $s^*$ at the origin |
| Natural frequency | $\omega_n$ | $\lvert s^*\rvert=\sqrt{\sigma^2+\omega_d^2}$ |
| Damped frequency | $\omega_d$ | $\omega_n\sqrt{1-\zeta^2}=\mathrm{Im}(s^*)$ |
| Decay rate | $\sigma$ | $\zeta\omega_n=-\mathrm{Re}(s^*)$ |
| Overshoot | $OS\%$ | $100\,e^{-\zeta\pi/\sqrt{1-\zeta^2}}$ |
| Peak time | $T_p$ | $\pi/\omega_d$ |
| Settling time (2%) | $T_s$ | $\approx4/\sigma$ |
| Phase margin (approx) | $\varphi_m$ | $\approx100\zeta\;°\quad(\zeta\lesssim0.7)$ |
| Gain crossover (approx) | $\omega_c$ | $\approx\omega_n$ |

**Fig — dominant pole: $\zeta,\omega_n,\sigma,\omega_d$:**
```tikz
\usepackage{tikz}
\begin{document}
\begin{tikzpicture}[x=1.1cm,y=1.1cm,font=\small,>=stealth]
  \draw[->] (-3.2,0) -- (0.7,0) node[right]{$\mathrm{Re}$};
  \draw[->] (0,-0.4) -- (0,2.8) node[above]{$\mathrm{Im}$};
  % pole at (-1.5, 2.0): sigma=1.5, omega_d=2.0, omega_n=2.5, zeta=0.6
  % mark as x
  \draw[thick] (-1.5-0.12,2.0-0.12)--(-1.5+0.12,2.0+0.12);
  \draw[thick] (-1.5-0.12,2.0+0.12)--(-1.5+0.12,2.0-0.12);
  \node[above right,font=\scriptsize] at (-1.5,2.0) {$s^*$};
  % omega_n line
  \draw[thick,blue] (0,0) -- (-1.5,2.0);
  \node[above,font=\scriptsize,rotate=127] at (-0.6,0.8) {$\omega_n$};
  % dashed construction lines
  \draw[dashed,gray] (-1.5,0) -- (-1.5,2.0);
  \draw[dashed,gray] (0,2.0) -- (-1.5,2.0);
  % sigma arrow
  \draw[<->,red] (-1.5,-0.28) -- node[below,font=\scriptsize]{$\sigma=\zeta\omega_n$} (0,-0.28);
  % omega_d arrow
  \draw[<->,red] (0.3,0) -- node[right,font=\scriptsize]{$\omega_d$} (0.3,2.0);
  % beta angle arc
  \draw[->] (-0.7,0) arc(180:127:0.7);
  \node[font=\scriptsize] at (-0.88,0.38) {$\beta$};
  \node[below,font=\scriptsize] at (-0.6,-0.28) {$\zeta{=}\cos\beta$};
  % axis ticks
  \draw (-1.5,0.06)--(-1.5,-0.06) node[below,font=\scriptsize]{$-\sigma$};
  \draw (0.05,2.0)--(-0.05,2.0) node[left,font=\scriptsize]{$\omega_d$};
  % conjugate (faded)
  \draw[thick,opacity=0.25] (-1.5-0.12,-2.0-0.12)--(-1.5+0.12,-2.0+0.12);
  \draw[thick,opacity=0.25] (-1.5-0.12,-2.0+0.12)--(-1.5+0.12,-2.0-0.12);
  \draw[thick,blue,opacity=0.2] (0,0) -- (-1.5,-2.0);
\end{tikzpicture}
\end{document}
```

**Back-solve from step-response data** (read $OS\%$ and $T_p$ directly):
$$\zeta=-\frac{\ln(OS\%/100)}{\sqrt{\pi^2+\ln^2(OS\%/100)}},\qquad \omega_d=\frac{\pi}{T_p},\qquad \omega_n=\frac{\omega_d}{\sqrt{1-\zeta^2}},\qquad \sigma=\zeta\omega_n.$$

---

## Summary: Spec → Parameter Map

| Spec | Key parameter | Improve by… |
|---|---|---|
| Stability | $\varphi_m>0$, $k_m>1$ | Check both; increase loop gain / add lead |
| Damping / overshoot | $\zeta\;(\varphi_m\approx100\zeta)$ | Increase $\varphi_m$ via lead compensator |
| Speed of response | $\omega_n\;(\omega_c\approx\omega_n)$ | Increase $\omega_c$ |
| Settling | $\sigma=\zeta\omega_n$ | Move dominant poles further left |
| Steady-state error | Loop DC gain; type number | Add integrator ($C=\mu/s$) |
| Noise / delay robustness | Upper bound on $\omega_c$ | Decrease $\omega_c$; limit HF gain |
