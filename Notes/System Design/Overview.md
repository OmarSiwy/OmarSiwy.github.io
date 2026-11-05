---
tags: [ece380, control-systems, moc]
aliases: [ECE380 Overview, Feedback Control Index]
---

# ECE 380 — Analog Control Systems

> [!info] How to read
> Topics below are ordered for a top-down read; each file links to the next. **Definition** callouts = must-know. Collapsed **Annotation** = derivations. Collapsed **Example** = fully-solved problems. Figures render via TikZJax.

Design cycle: 
- study system → define specs → model (first-principles/data) → simplify → design controller → simulate (iterate).
- Standard scheme = **negative feedback loop**: reference $r$ → error $e=r-$(measured) → controller $C$ → control input $u$ (+disturbance $d$) → actuator → plant $G$ → output $y$ (+noise $n$) → sensor → back to error.

**Fig — negative feedback loop:**
```tikz
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,calc}
\begin{document}
\begin{tikzpicture}[>=Stealth,
  blk/.style={draw,thick,minimum width=1.2cm,minimum height=0.9cm},
  sum/.style={draw,thick,circle,minimum size=6mm,inner sep=0pt},
  font=\small]
  \node (r)  at (0,0) {$r$};
  \node[sum] (s1) at (1.2,0) {};
  \node[blk] (C)  at (3,0) {$C(s)$};
  \node[sum] (s2) at (5,0) {};
  \node[blk] (G)  at (6.8,0) {$G(s)$};
  \node (y)  at (9,0) {$y$};
  \node[blk] (H)  at (5,-1.9) {sensor};
  \draw[->] (r) -- (s1);
  \draw[->] (s1) -- node[above]{$e$} (C);
  \draw[->] (C) -- node[above]{$u$} (s2);
  \draw[->] (s2) -- (G);
  \draw[->] (G) -- (y);
  \node[above=0.7cm of s2] (d) {$d$};
  \draw[->] (d) -- (s2);
  \coordinate (tap) at (8,0);
  \draw[->] (tap) |- (H.east);
  \draw[->] (H.west) -| (s1);
  \node[font=\scriptsize] at ($(s1)+(-0.3,0.22)$) {$+$};
  \node[font=\scriptsize] at ($(s1)+(0.15,-0.3)$) {$-$};
  \node[font=\scriptsize] at ($(s2)+(-0.3,0.22)$) {$+$};
  \node[font=\scriptsize] at ($(s2)+(0.16,0.3)$) {$+$};
\end{tikzpicture}
\end{document}
```

## Topic order

1. [[1 - System to Mathematical Model]] — state-space & transfer-function models
2. [[2 - Mathematical Model Theory]] — linearization, frequency response, Bode plots
3. [[3 - Linear System Theory]] — stability, performance, steady-state error, dominant poles
4. [[4 - Stability Analysis]] — Routh–Hurwitz, Nyquist, stability margins, root locus
5. [[5 - Controller Synthesis]] — loop shaping, integral, lead-lag, PID, pole placement
6. [[6 - State Feedback Control]] — controllable canonical form, pole placement, observers
- [[Appendix - Laplace Transform]] — transform pairs, properties, IVT/FVT

Practice sources: `ece380_final_practice.pdf`, `ece380_notes.pdf`. Worked solutions (Q1–Q9 + notes Ex. 9) live in the topic files under collapsed **Example** callouts.
