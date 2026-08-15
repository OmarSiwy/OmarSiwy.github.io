---
title: CORDIC Rotation Mode
description: "Sine and cosine of an angle from three adders and two shifts per step: choosing micro-rotations of arctan(2^-i) makes tan alpha_i a right shift, so a transcendental costs an adder."
kind: circuit
source: "ASA §20.4.1, pp. 605-609"
status: seed
spade: simulated
tags: [digital, cordic, trigonometry, shift-and-add, fpga]
aliases:
  - CORDIC
  - CORDIC rotation mode
  - CORDIC micro-rotation
  - Volder's algorithm
  - CORDIC iteration
---

# CORDIC Rotation Mode

A shift-and-add digit recurrence that drives a residual angle $Z_i$ to zero while an auxiliary vector $(C_i,S_i)$ follows the same rotation, so that the vector lands on $(\cos\pi Y',\sin\pi Y')$ — and it does this with no multiplier anywhere, because every micro-rotation angle is chosen to make its tangent a power of two.

```tikz title="One CORDIC rotation-mode iteration: the C, S and Z datapaths with sign(Z_i) as the only control signal"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- state entering the iteration
\node[font=\small] at (0,4.95) {$C_i$};
\node[font=\small] at (3.2,4.95) {$S_i$};
\node[font=\small] at (8.2,4.95) {$Z_i$};
\draw (0,4.75) -- (0,4.4);
\draw (3.2,4.75) -- (3.2,4.4);
\draw (8.2,4.75) -- (8.2,4.4);
% ---- shifters (wiring when i is a constant, barrel shifter when it is not)
\node[draw,minimum width=1.5cm,minimum height=0.6cm] (shc) at (0,3.3) {$\gg i$};
\node[draw,minimum width=1.5cm,minimum height=0.6cm] (shs) at (3.2,3.3) {$\gg i$};
\draw[->] (0,4.4) -- (shc.north);
\draw[->] (3.2,4.4) -- (shs.north);
% ---- bypass paths: the unshifted state into its own adder
\draw (0,4.4) -- (-1.5,4.4) -- (-1.5,1.5);
\draw[->] (-1.5,1.5) -- (-1.0,1.5);
\draw (3.2,4.4) -- (4.7,4.4) -- (4.7,1.5);
\draw[->] (4.7,1.5) -- (4.2,1.5);
% ---- the cross-over: shifted C feeds the S adder and vice versa
\draw (shc.south) -- (0,2.35) -- (3.2,2.35);
\draw[->] (3.2,2.35) -- (3.2,1.8);
\draw (shs.south) -- (3.2,2.05) -- (0,2.05);
\draw[->] (0,2.05) -- (0,1.8);
% ---- the three adders
\node[draw,minimum width=2.0cm,minimum height=0.6cm] (addc) at (0,1.5) {$\mp$\, sub/add};
\node[draw,minimum width=2.0cm,minimum height=0.6cm] (adds) at (3.2,1.5) {$\pm$\, add/sub};
\node[draw,minimum width=2.2cm,minimum height=0.6cm] (addz) at (8.2,1.5) {$\pm$\, sub/add};
\draw[->] (8.2,4.4) -- (addz.north);
\draw[<-] (addz.east) -- ++(1.15,0) node[right,font=\small] {$\tfrac1\pi\arctan 2^{-i}$};
% ---- outputs
\draw[->] (addc.south) -- (0,0.45) node[below,font=\small] {$C_{i+1}$};
\draw[->] (adds.south) -- (3.2,0.45) node[below,font=\small] {$S_{i+1}$};
\draw[->] (addz.south) -- (8.2,0.45) node[below,font=\small] {$Z_{i+1}$};
% ---- the only control signal in the whole circuit
\draw (8.2,4.15) -- (6.6,4.15) -- (6.6,2.75) -- (-0.6,2.75);
\draw[->] (-0.6,2.75) -- (-0.6,1.8);
\draw[->] (2.6,2.75) -- (2.6,1.8);
\draw (6.6,2.75) -- (6.6,2.35) -- (7.5,2.35);
\draw[->] (7.5,2.35) -- (7.5,1.8);
\fill (6.6,2.75) circle (1.6pt);
\fill (2.6,2.75) circle (1.6pt);
\node[font=\tiny,anchor=east] at (6.5,4.62) {$d_i$ from $\mathrm{sign}(Z_i)$, 1 bit};
% ---- widths
\node[font=\tiny,anchor=east] at (-0.1,4.1) {$w$};
\node[font=\tiny,anchor=west] at (3.3,4.1) {$w$};
\node[font=\tiny,anchor=west] at (8.3,4.1) {$w$};
\node[font=\tiny,anchor=west] at (0.1,0.85) {$w$};
\node[font=\tiny,anchor=west] at (3.3,0.85) {$w$};
\node[font=\tiny,anchor=west] at (8.3,0.85) {$w$};
\node[font=\tiny,align=center] at (4.0,-0.5)
  {all three signals are $\mathrm{sfix}(0,\ell-g)$, i.e.\ $w=-\ell+g+1$ bits, and every box is a plain carry-propagate adder;\\
   $i$ constant $\Rightarrow$ the shifters are routing and the $\arctan$ is a literal (unrolled), $i$ from a counter $\Rightarrow$ two barrel shifters and a ROM (iterative)};
\end{circuitikz}
\end{document}
```

*after Fig. 20.8, p. 608, with the datapath widths of Sect. 20.4.4*

**Start from the rotation matrix and factor out the cosine.** A planar rotation by $\theta$ is

$$\begin{pmatrix}x'\\y'\end{pmatrix}=\underbrace{\begin{pmatrix}\cos\theta&-\sin\theta\\ \sin\theta&\cos\theta\end{pmatrix}}_{R}\begin{pmatrix}x\\y\end{pmatrix}\tag{20.22}$$

and since $\cos\theta\neq0$ on the reduced range it may be pulled out as a scalar, leaving the tangent behind by the definition $\tan\theta=\sin\theta/\cos\theta$:

$$R=\cos\theta\begin{pmatrix}1&-\tan\theta\\ \tan\theta&1\end{pmatrix}\tag{20.23}$$

Nothing has been gained yet — $\cos\theta$ and $\tan\theta$ are both transcendental. What has changed is that the *shape* of the matrix now depends on $\theta$ through one quantity only.

**Split the angle into micro-rotations whose tangent is a power of two.** By the angle-addition identity $e^{j(a+b)}=e^{ja}e^{jb}$, whose real and imaginary parts are (20.14), rotating by $a+b$ is rotating by $a$ then by $b$; so the angle may be decomposed as $\theta=\sum_i\alpha_i$ and the rotation as a product of matrices. Choose the pieces to be exactly the angles whose tangent is a negative power of two,

$$\alpha_i=\pm\arctan 2^{-i}\quad\Longrightarrow\quad \tan\alpha_i=\pm2^{-i},$$

and (20.23) becomes

$$R'=\cos\alpha_i\begin{pmatrix}1&\mp2^{-i}\\ \pm2^{-i}&1\end{pmatrix}\tag{20.25}$$

> [!important] The matrix has no multiplier in it
> $\arctan2^{-i}$ is a horrible constant, but $\tan(\arctan 2^{-i})=2^{-i}$ is a **right shift**. Multiplying by $\begin{pmatrix}1&-2^{-i}\\2^{-i}&1\end{pmatrix}$ is therefore two shifts and two additions and nothing else. That is the whole of CORDIC: it buys a transcendental function with the hardware budget of an adder.

**Drop the scale factor and pay for it once, in the initialisation.** Deleting $\cos\alpha_i$ from (20.25) is what makes the step multiplier-free, and the result is no longer a rotation — it is a rotation composed with a dilation. By $\cos^2+\sin^2=1$,

$$\cos\alpha_i=\frac{1}{\sqrt{1+\tan^2\alpha_i}}=\frac{1}{\sqrt{1+2^{-2i}}},$$

so each shift-and-add step magnifies the modulus by $\sqrt{1+2^{-2i}}$. The decisive point is that this factor is **even in the sign $\pm$** — it depends on $|\tan\alpha_i|$ only — hence not on the data. The total growth over $n$ steps is a known constant

$$K=\prod_{i=1}^{n}\sqrt{1+2^{-2i}},$$

and because the initial vector is $\binom{1}{0}$, pre-dividing it by $K$ cancels the growth exactly, in one hardwired literal and zero gates. The output scaling $(1-2^{\ell})$ of the [[Number Formats|fixed-point specification]] rides along in that same literal, which is why it too costs nothing.

**Drive the residual angle to zero with a greedy sign choice.** Three values iterate in parallel: an angle $Z_i$ initialised to the reduced argument $Y'$ and steered toward $0$, and a vector $(C_i,S_i)$ starting on the $x$ axis and rotated by the same amounts in the opposite direction. As $Z_i\to0$ the vector converges to $(\cos\pi Y',\sin\pi Y')$:

$$
\begin{cases}
C_1=\dfrac{1}{\prod_{i=1}^{n}\sqrt{1+2^{-2i}}}\\ S_1=0\\ Z_1=Y'
\end{cases}
\qquad\forall i\ge1\ \begin{cases}
d_i=+1\ \text{if}\ Z_i>0,\ \text{else}\ -1\\
C_{i+1}=C_i-2^{-i}d_iS_i\\
S_{i+1}=S_i+2^{-i}d_iC_i\\
Z_{i+1}=Z_i-d_i\arctan(2^{-i})
\end{cases}\tag{20.26–20.27}
$$

Because $Z$ carries a *binary* angle — $\mathrm{sfix}(0,\ell)$ holding $\theta/\pi$, see [[Number Formats]] — every stored constant is $\frac1\pi\arctan(2^{-i})$ rather than $\arctan(2^{-i})$. That is a change of literal, not of hardware. All three signals are carried on a $g$-guard-bit datapath, $w=-\ell+g+1$ bits each.

**Why the greedy choice converges.** The set of representable angles is bounded by $\sum_{i\ge1}\arctan2^{-i}$; summed from $i=0$ this is $1.7433$ rad $=99.88^\circ$ (p. 607). Reaching *every* angle inside that bound, not merely the endpoints, requires the tail to dominate each term, $\arctan 2^{-i}\le\sum_{j>i}\arctan 2^{-j}$. Bound both sides with the alternating Taylor series of $\arctan$, whose terms decrease in absolute value, so consecutive partial sums bracket the true value:

$$
\arctan 2^{-i}\le 2^{-i}-\tfrac13 2^{-3i}+\tfrac15 2^{-5i},\qquad
\sum_{j>i}\arctan 2^{-j}\ \ge\ \sum_{j>i}\left(2^{-j}-\tfrac13 2^{-3j}\right)=2^{-i}-\tfrac{1}{21}2^{-3i}
$$

using the geometric sums $\sum_{j>i}2^{-j}=2^{-i}$ and $\sum_{j>i}2^{-3j}=\frac17 2^{-3i}$. The condition collapses to $\left(\tfrac13-\tfrac1{21}\right)2^{-3i}\ge\tfrac15 2^{-5i}$, i.e. $0.286\ge0.2\cdot2^{-2i}$, true for every $i\ge0$ with room to spare. The greedy rule therefore keeps the residual inside the reachable tail, $|Z_{i+1}|\le\sum_{j>i}\alpha_j\approx\alpha_i<2^{-i}$: **the residual bracket halves at every stage, which is simultaneously the convergence proof and the reason each successive $Z$ adder can be one bit narrower** ([[Reduced-Z CORDIC Datapath]]).

**Start at $i=1$, not $i=0$.** [[Octant Argument Reduction]] has already folded the argument into $[0,\tfrac14)$, an angle below $45^\circ$, and the reach from $i=1$ onward is $1.7433-0.7854=0.958$ rad $=54.9^\circ$ — comfortably more. Dropping the $i=0$ stage saves one full iteration. Textbooks that start at $i=0$ are covering the full $\pm99.88^\circ$ range and consequently use a different scale constant $C_1$; the two are not interchangeable.

**How many iterations, and how wide.** For large $i$, $\arctan 2^{-i}\approx2^{-i}$ by the same Taylor series, so stage $i$ removes from $Z$ a quantity of order $2^{-i}$ and adds to $C,S$ something strictly smaller than $2^{-i}$ because $|C_i|,|S_i|<1$ — **each iteration buys at least one bit of result**. Last-bit accuracy against a budget of $2^{\ell-2}$ for the approximation error therefore fixes

$$n=-\ell+2$$

iterations, linear in the target precision. That linearity is what eventually loses CORDIC the comparison against [[Table-and-Multiplier Sine and Cosine]]: latency and area both scale with a chain of $n$ dependent carry propagations.

**What one stage actually costs.** Three carry-propagate additions of $w$ bits ([[RCA, Ripple-Carry Adder]] or an FPGA carry chain — see [[Adders]]), two right shifts, and one 1-bit control signal. In an *unrolled* pipeline $i$ is fixed per stage, so both shifts are pure routing and $\frac1\pi\arctan2^{-i}$ is a wired constant: on FPGA the $C$ and $S$ updates pack into one LUT per bit while still driving the fast carry logic. In an *iterative* implementation $i$ comes from a counter, and the same drawing costs two genuine barrel shifters ([[Shifters]]) plus a ROM of the $\arctan$ constants — more logic than the three adders they serve. **The loop control is not free, and it is more expensive than the arithmetic it schedules**, which is the entire argument of [[Unrolled CORDIC]] versus [[Iterative CORDIC]].

**A worked instance, $\ell=-8$, four iterations.** Take $X=0.00110100_2=0.203125$, whose leading bits are $s=q=o=000$, so the reduction is the identity and $Y'=X$; the target is $\pi Y'=0.63813$ rad $=36.56^\circ$. Constants $\frac1\pi\arctan2^{-i}$ rounded to 8 fractional bits are $38,20,10,5$ in units of $2^{-8}$, and $K=\prod_{i=1}^{4}\sqrt{1+2^{-2i}}=1.16368$ gives $C_1=1/K\to220/256$. With everything in units of $2^{-8}$:

| $i$ | $Z_i$ | $d_i$ | $\lfloor2^{-i}C_i\rfloor$ | $\lfloor2^{-i}S_i\rfloor$ | $C_{i+1}$ | $S_{i+1}$ | $Z_{i+1}$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | $+52$ | $+$ | $110$ | $0$ | $220$ | $110$ | $+14$ |
| 2 | $+14$ | $+$ | $55$ | $27$ | $193$ | $165$ | $-6$ |
| 3 | $-6$ | $-$ | $24$ | $20$ | $213$ | $141$ | $+4$ |
| 4 | $+4$ | $+$ | $13$ | $8$ | $205$ | $154$ | $-1$ |

Row $i=3$ in full, with $d_3=-1$ because $Z_3=-6<0$, so the signs in (20.27) flip:

$$C_4=C_3+\left\lfloor2^{-3}S_3\right\rfloor=193+\left\lfloor\tfrac{165}{8}\right\rfloor=193+20=213,\qquad
S_4=S_3-\left\lfloor2^{-3}C_3\right\rfloor=165-24=141,$$
$$Z_4=Z_3+\tfrac1\pi\arctan2^{-3}=-6+10=+4.$$

The discarded $0.625$ ulp in $\lfloor165/8\rfloor=20$ is the truncation of the shifted operand, bounded by one ulp of the internal datapath. The residual column $52\to14\to-6\to4\to-1$ **shrinks by about one bit per row and alternates in sign** — the greedy rule overshooting and correcting, which is the convergence proof made concrete.

$$\boxed{\ \begin{aligned}C_{i+1}&=C_i-d_i\,(S_i\gg i)\\ S_{i+1}&=S_i+d_i\,(C_i\gg i)\\ Z_{i+1}&=Z_i-d_i\,\tfrac1\pi\arctan 2^{-i}\end{aligned}\qquad d_i=\mathrm{sign}(Z_i),\quad n=-\ell+2\ \ }$$

**When it breaks**

- **Outside the reachable cone.** The recurrence converges only for $|\theta|\le\sum_i\arctan2^{-i}$: $99.88^\circ$ from $i=0$, $54.9^\circ$ from $i=1$. Feed it an unreduced argument and it silently returns the wrong answer — [[Octant Argument Reduction]] is a precondition, not an optimisation.
- **Four iterations are not ten.** In the table above $\delta_S=+1.50$ ulp, missing last-bit accuracy, because stopping at $n=4$ leaves $|Z_5|=1$ ulp of *unrotated angle*, worth $\approx2.5$ ulp on $S$. The specification demands $n=-\ell+2=10$. The recurrence is only as accurate as its termination.
- **The $d_i$ sequence can diverge from the ideal one.** When $Z_i$ sits near zero, rounding can make the real datapath pick a different sign from the infinitely precise algorithm, after which the two computations are simply different. This is not a bug and must not be engineered away — forcing agreement would need prohibitive accuracy. The repair is definitional: take as reference the exact sequence that makes the *same* decisions the architecture makes. Both branches converge, because either sign at a near-zero residual leaves a residual the tail can still absorb.
- **Linear depth.** $n=-\ell+2$ dependent carry-propagate additions is a long critical path, and it grows with precision while a table-based evaluator's does not. Past roughly 16 bits a table-and-multiplier operator is 2–3× faster for comparable logic; see [[Choosing a CORDIC Architecture]].
- **Only the $C,S$ half is trigonometric.** Vectoring mode — driving $S_i$ to zero instead of $Z_i$, which yields $\arctan$ and the modulus — uses the same hardware with the sign taken from $S_i$. This note covers rotation mode only.

> [!warning] Vectoring mode is not covered in the source chapter — needs outside research
> Chapter 20 is a sine/cosine case study and only ever runs CORDIC in rotation mode. The $\arctan$/magnitude variant, the hyperbolic and linear coordinate systems, and the repeated iterations they require for convergence are outside it.

**RTL (Spade)**

One iteration of the recurrence — the whole of the drawing above, exactly once.

```spade
entity cordic_step<#uint W>(
    c: int<W>,
    s: int<W>,
    z: int<W>,
    atan: int<W>,
    sh: int<W>,
) -> (int<W>, int<W>, int<W>) {
    let d = z > 0;
    let sc = c >>> sh;
    let ss = s >>> sh;
    (
        if d { c -. ss } else { c +. ss },
        if d { s +. sc } else { s -. sc },
        if d { z -. atan } else { z +. atan }
    )
}
```

`c`, `s`, `z` are the three vertical wires; `sh` is the drawing's $i$ and `atan` the constant entering the $Z$ adder from the right. `d` is the single control wire, and `z > 0` (not `>=`) reproduces (20.27)'s tie-break, which sends $Z_i=0$ down the $d_i=-1$ branch. `>>>` is the arithmetic right shift, so a negative operand truncates toward $-\infty$ — the $\lfloor\cdot\rfloor$ of the worked example, and the reason the error analysis may assume a one-sided truncation error. All three outputs use the wrapping operators `-.` and `+.` to stay at $W$ bits: the guard-bit format is chosen so that $|C_i|,|S_i|<1$ and $|Z_i|<2^{-i}$ never overflow it, so the wrap is unreachable rather than merely tolerated. The block is purely combinational — pipeline registers belong to the stage that instantiates it. Synthesis will do one thing the drawing does not: with `sh` a per-stage constant both shifts vanish into routing, whereas the drawing shows a box.

Verified by simulation at $W=9$: the four rows of the worked example above reproduce exactly, plus asymmetric named vectors (`c=1, s=128` and its transpose, which a bit-reversed datapath would fail) and 4000 random vectors against a behavioural reference — 4008 vectors, zero failures.

**Related Notes**

- [[Octant Argument Reduction]] – depends-on: supplies the $Y'\in[0,\tfrac14)$ this recurrence assumes; without it the $i=1$ start does not converge.
- [[Sine-Cosine Octant Reconstruction]] – depends-on: turns $(C_n,S_n)$ back into $\sin\pi X,\cos\pi X$ using the $sqo$ bits the reduction stripped off.
- [[Unrolled CORDIC]] – extends: replicates this stage $n=-\ell+2$ times with $i$ hardwired, so the shifters become routing.
- [[Iterative CORDIC]] – extends: folds this stage onto itself for $n$ cycles, and pays two barrel shifters and an arctan ROM for the privilege.
- [[Reduced-Z CORDIC Datapath]] – extends: exploits the $|Z_i|<2^{-i}$ bound proved here to shave one bit off each successive $Z$ adder.
- [[Reduced-Iteration CORDIC]] – extends: stops the recurrence halfway and finishes the residual rotation with two multipliers.
- [[Digit Recurrence for Algebraic Functions]] – compares: the same shape of algorithm — one digit of result per shift-and-add step, selected from the sign of a residual — applied to roots and quotients instead of rotations.
- [[Table-and-Multiplier Sine and Cosine]] – counter-example: computes the same specification in three logic levels instead of $-\ell+2$ dependent additions, with a guard-bit count independent of the precision.
- [[Choosing a CORDIC Architecture]] – compares: where this recurrence and its variants sit against each other on area, latency and DSP usage.
- [[Shifters]] – supports: the barrel shifters an iterative implementation needs, and does not need when unrolled.
- [[RCA, Ripple-Carry Adder]] – supports: the three adders per stage; on FPGA they map onto the fast carry chain at one LUT per bit.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 20 "Fixed-Point Sine and Cosine".

- **§20.4.1** "Description of the Algorithm", pp. 605–609 — rotation matrix (20.22), factored form (20.23), micro-rotation decomposition (20.24)–(20.25), Table 20.1 of $\arctan2^{-i}$ (p. 607), the scale factor and the $\binom10$ initialisation (p. 607), the $99.88^\circ$ reach and the $i=1$ start (p. 607), the complete iteration (20.26)–(20.27) and Fig. 20.7/Fig. 20.8 (p. 608), the $i=0$ remark and constant-input observation (p. 609).
- **§20.4.3** "Approximation Error and Number of Iterations", p. 610 — one bit per iteration, $n=-\ell+2$.
- **§20.4.4** "Rounding Errors", pp. 610–612 — the $u=2^{\ell-g}$ datapath, truncation (20.32)–(20.33), and the divergent-$d_i$ argument (p. 612).
- **§20.3**, pp. 605–606 — the octant reduction this recurrence presupposes, Figs. 20.5–20.6.
- **§20.7**, p. 621 — iterative vs unrolled, the barrel-shifter and arctan-table cost of a runtime $i$.
- [Vol59] J. Volder, "The CORDIC Computing Technique", *IRE Trans. Electronic Computers* EC-8.3 (1959), pp. 330–334.
