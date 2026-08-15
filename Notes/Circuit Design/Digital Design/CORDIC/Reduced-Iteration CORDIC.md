---
title: "Reduced-Iteration CORDIC"
description: "Stop rotating at i = floor(-l/2)+1 and finish the residual rotation with two small multipliers using sin(pi Z) ~ pi Z, cos(pi Z) ~ 1: half the pipeline depth for two DSPs."
kind: circuit
status: seed
spade: simulated
tags: [digital, cordic, multiplier, fpga, dsp]
aliases:
  - Reduced Iterations CORDIC
  - Reduced Iteration CORDIC
  - CORDIC with a Terminating Multiplier
---

# Reduced-Iteration CORDIC

A CORDIC whose micro-rotation chain is cut off at $i=\lfloor-\ell/2\rfloor+1$ and whose remaining rotation is applied in one shot by two small multipliers, trading roughly half the pipeline depth for two DSP blocks.

```tikz title="Reduced-iteration CORDIC: the chain truncated at half length, finished by two multipliers"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- the surviving CORDIC iterations ------------------------------------
\node[draw,dashed,rounded corners,minimum width=4.8cm,minimum height=3.0cm] (ch) at (2.4,3.6) {};
\node[align=center,font=\scriptsize] at (2.4,4.35)
  {one shift-and-add iteration,\\ repeated $\lfloor-\ell/2\rfloor$ times};
\node[align=left,font=\scriptsize] at (2.4,3.15)
  {$C_{i+1}=C_i-d_i2^{-i}S_i$\\ $S_{i+1}=S_i+d_i2^{-i}C_i$\\ $Z_{i+1}=Z_i-d_i\alpha_i$};
\node[font=\scriptsize] at (2.4,2.35) {3 adders/stage, no multiplier};
\draw[->] (-1.5,4.6) node[left,font=\scriptsize] {$C_1=1/K$} -- (0.0,4.6);
\draw[->] (-1.5,3.6) node[left,font=\scriptsize] {$S_1=0$} -- (0.0,3.6);
\draw[->] (-1.5,2.6) node[left,font=\scriptsize] {$Z_1=Y'$} -- (0.0,2.6);
% ---- the three buses leaving the chain ----------------------------------
\draw[->] (4.8,4.6) -- (12.9,4.6);
\draw[->] (4.8,3.6) -- (12.9,3.6);
\node[font=\scriptsize,above] at (7.9,4.65) {$C_i$, $-\ell+g+1$ bits};
\node[font=\scriptsize,above] at (7.9,3.65) {$S_i$, $-\ell+g+1$ bits};
\draw (4.8,2.6) -- (5.2,2.6) -- (5.2,0.0) -- (5.8,0.0);
\node[font=\scriptsize,anchor=east] at (5.05,1.7) {$Z_i$, $\lfloor-\ell/2\rfloor+1+g$ bits};
\node[draw,minimum width=2.4cm,minimum height=0.7cm,font=\scriptsize] (pi) at (7.0,0.0)
  {$\times\pi$, \texttt{FixRealCM}};
\draw[->] (8.2,0.0) -- (10.4,0.0) -- (10.4,0.55);
\draw (9.3,0.0) -- (9.3,6.2) -- (9.75,6.2);
\node[font=\scriptsize] at (9.6,-0.6) {$\pi Z_i$, correct to 1 ulp};
% ---- truncation of C and S to the multiplier width ----------------------
\draw (6.0,4.6) -- (6.0,1.0) -- (6.8,1.0);
\draw (6.4,3.6) -- (6.4,7.0) -- (6.8,7.0);
\node[draw,minimum width=1.2cm,minimum height=0.6cm,font=\scriptsize] (tc) at (7.4,1.0) {trunc};
\node[draw,minimum width=1.2cm,minimum height=0.6cm,font=\scriptsize] (ts) at (7.4,7.0) {trunc};
\draw[->] (8.0,1.0) -- (9.75,1.0);
\draw[->] (8.0,7.0) -- (10.4,7.0) -- (10.4,6.65);
\node[font=\scriptsize,above] at (8.6,1.05) {$\widetilde C_i$};
\node[font=\scriptsize,above] at (9.4,7.05) {$\widetilde S_i$};
% ---- the two multipliers ------------------------------------------------
\node[draw,minimum width=1.3cm,minimum height=0.9cm,font=\small] (m1) at (10.4,6.2) {$\times$};
\node[draw,minimum width=1.3cm,minimum height=0.9cm,font=\small] (m2) at (10.4,1.0) {$\times$};
\draw[->] (11.05,6.2) -- (13.2,6.2) -- (13.2,4.9);
\node[font=\scriptsize,above] at (12.1,6.25) {$\pi Z_i\widetilde S_i$};
\draw[->] (11.05,1.0) -- (13.2,1.0) -- (13.2,3.3);
\node[font=\scriptsize,above] at (12.1,1.05) {$\pi Z_i\widetilde C_i$};
% ---- final adders -------------------------------------------------------
\node[draw,circle,inner sep=1.5pt,font=\small] (ac) at (13.2,4.6) {$-$};
\node[draw,circle,inner sep=1.5pt,font=\small] (as) at (13.2,3.6) {$+$};
\draw[->] (13.5,4.6) -- (14.6,4.6) node[right,font=\scriptsize] {$C_\text{final}$};
\draw[->] (13.5,3.6) -- (14.6,3.6) node[right,font=\scriptsize] {$S_\text{final}$};
% ---- annotations --------------------------------------------------------
\node[align=center,font=\scriptsize] at (10.6,-1.2)
  {these two products replace CORDIC iterations $\lfloor-\ell/2\rfloor+1\ldots-\ell+2$:\\
   $\cos(\pi Z_i)\approx1$, $\sin(\pi Z_i)\approx\pi Z_i$, both operands $\approx\lfloor-\ell/2\rfloor+g$ bits};
\end{circuitikz}
\end{document}
```

**Read $Z_i$ as an angle still owed, not as an error term.** In [[CORDIC Rotation Mode]] the residual obeys $Z_{i+1}=Z_i-d_i\alpha_i$ and is driven to zero, so at any cut point the vector $(C_i,S_i)$ has been rotated by exactly $Y'-Z_i$ and is short of the target by the angle $\pi Z_i$. Every remaining iteration exists only to pay off that debt one bit at a time. But paying it off in one step is just the rotation identity (20.14) again — $\cos(a+b)=\cos a\cos b-\sin a\sin b$, $\sin(a+b)=\sin a\cos b+\cos a\sin b$ — applied with $a$ the angle already rotated and $b=\pi Z_i$:

$$C_\text{final}=C_i\cos(\pi Z_i)-S_i\sin(\pi Z_i),\qquad S_\text{final}=S_i\cos(\pi Z_i)+C_i\sin(\pi Z_i)$$

The whole variant is the observation that once $\pi Z_i$ is small the two transcendentals on the right collapse: by the Maclaurin series (20.15)/(20.17), $\cos(\pi Z_i)=1-\frac{(\pi Z_i)^2}{2}+\dots\approx1$ and $\sin(\pi Z_i)=\pi Z_i-\frac{(\pi Z_i)^3}{6}+\dots\approx\pi Z_i$, leaving two multiplications and two additions (20.43).

> [!warning] The book prints (20.43) with the opposite sign
> Printed p. 614 gives $C_\text{final}=C_i+\pi Z_iY_i$, $S_\text{final}=S_i-\pi Z_iX_i$ — a rotation by $-\pi Z_i$, which contradicts the rotation matrix (20.22) and the recurrence (20.27) on the same datapath, and is written in $X,Y$ rather than the $C,S$ used everywhere else in the section. The signs that agree with the rest of the chapter, and the ones simulated below, are $C_\text{final}=C_i-\pi Z_iS_i$ and $S_\text{final}=S_i+\pi Z_iC_i$: the vector must keep turning the way the surviving stages were turning it.

**The Taylor remainder is what names the stopping index.** Truncating both series after one term introduces a third error contribution, on top of the $\delta_\text{approx}$ and $\delta_\text{round}$ of the guard-bit budget. The dominant neglected term is the quadratic one, so the remainder is at most about $\frac{Z_i^2}{2}$. Demanding that it stay under $2^{\ell-3}$ — an eighth of an ulp, a third slice carved out of the half-ulp budget of §20.4.3 — gives $Z_i^2<2^{\ell-2}$, i.e. $Z_i<2^{\ell/2-1}$ by taking square roots. Convergence supplies $|Z_i|<2^{-i}$ (see [[Reduced-Z CORDIC Datapath]]), so the condition is met as soon as $2^{-i}\le2^{\ell/2-1}$, i.e.

$$i\ \ge\ -\ell/2+1\qquad\Longrightarrow\qquad i_\text{stop}=\left\lfloor-\ell/2\right\rfloor+1$$

Since a full-length unrolled CORDIC needs $n=-\ell+2$ iterations, **half the stages disappear**: at $\ell=-24$ the chain runs 12 iterations instead of 26, at $\ell=-16$ it runs 8 instead of 18.

**Every operand in the tail is about half the datapath width, and that is the point.** At the cut, $C_i$ and $S_i$ are still the full $-\ell+g+1$ bits, but $Z_i$ has lost one MSB per stage and is down to $\lfloor-\ell/2\rfloor+1+g$ bits. It is multiplied by $\pi$ with a `FixRealCM` table-based constant multiplier ([[Multiplication by Constants]]) specified to an absolute error of one ulp — a constant multiplier is used rather than a general one because $\pi$ is known at build time and the product needs no more precision than $Z_i$ carries. The two data multiplications would otherwise be $(\lfloor-\ell/2\rfloor+1+g)\times(-\ell+g+1)$, lopsided; truncating $C_i$ and $S_i$ down to the width of $\pi Z_i$ before multiplying costs one further ulp and **halves the multiplier area** ([[Truncated Multipliers]]). What is left is two roughly square multipliers of slightly more than $-\ell/2$ bits, which is why the signed $18\times18$ primitive in FPGA [[DSP Blocks]] covers every $\ell$ down to $-24$ with no cascading at all.

**On FPGAs the trade is nearly free; on ASIC it is a real choice.** Plain CORDIC's selling point is that it uses no multiplier — but on an FPGA that means it leaves the DSP columns idle while burning LUTs, so spending two of them costs nothing that was being used. Counting LUTs the way §20.4.5 does, at one LUT per bit per adder: the $C$ and $S$ datapaths contribute $2(-\ell+g)$ per stage over $\lfloor-\ell/2\rfloor$ stages, and the triangular $Z$ datapath contributes $\sum_{i=1}^{-\ell/2}(-\ell+g-i+1)$, which is $\tfrac38(-\ell)^2$ rather than the full $\tfrac12(-\ell)^2$ because the sum stops at the halfway point. Total $\approx1.4(-\ell+g)^2$ against $2.5(-\ell+g)^2$ for the full-length version — a little under half the logic, plus two DSPs. On ASIC there is no free multiplier: two $\tfrac{-\ell}{2}$-bit array multipliers cost on the order of $\tfrac{\ell^2}{4}$ full adders each, against the $\tfrac{-\ell}{2}$ removed stages of three $(-\ell+g)$-bit adders, i.e. roughly $\tfrac{3\ell^2}{2}$ cells removed — still favourable, but by a margin that depends on the multiplier architecture rather than on a hard block being idle.

**The latency win is bigger than the area win.** The loop-carried dependency of an unrolled CORDIC is $Z_i\to d_i\to Z_{i+1}$: $-\ell+2$ dependent carry propagations in a row, which is what makes the pipeline depth linear in the precision and what eventually loses to [[Table-and-Multiplier Sine and Cosine]]. Cutting the chain in half halves that chain of dependencies and replaces the removed half with two multiplications that are mutually independent and, on a DSP block, one to three registered stages deep. The critical path stops being linear in $-\ell$ and becomes $\lfloor-\ell/2\rfloor$ additions plus a fixed multiplier latency.

$$\boxed{\ i_\text{stop}=\left\lfloor-\ell/2\right\rfloor+1,\qquad C_\text{final}=C_i-\pi Z_iS_i,\qquad S_\text{final}=S_i+\pi Z_iC_i\ }$$

**Where it stops working.**

- **Above 24 bits.** The rule of thumb ties the multiplier width to $-\ell/2$, so $\ell<-24$ pushes past the $18\times18$ DSP primitive and the two multipliers start needing cascades or Karatsuba decomposition; the "two DSPs" price becomes four or six and the comparison against a plain unrolled chain has to be redone.
- **When the DSPs are already spoken for.** The entire argument is that the multipliers are otherwise idle. In a design that is DSP-bound rather than LUT-bound the direction of the trade reverses, and plain [[Unrolled CORDIC]] is the one that fits.
- **Folded implementations get nothing but latency.** In [[Iterative CORDIC]] the stages are time-multiplexed onto one datapath, so removing half of them removes cycles, not hardware — and it *adds* two multipliers and a `FixRealCM` that the folded version did not have.
- **Numerically, at the very end of the range.** $C_i$ and $S_i$ are $\mathrm{sfix}(0,\ell-g)$, whose range is $[-1,1)$, and the final rotation moves them: with the modulus pre-scaled to exactly $1$ there is no headroom and $S_\text{final}$ can wrap. The $(1-2^{\ell})$ output scaling of §20.2.2 is precisely what leaves the margin — a random sweep of the block below overflows without it.
- **The error analysis is a third term the budget was never split for.** §20.4.3 divides the half-ulp budget two ways, approximation against rounding; this variant adds a Taylor remainder and two more truncated products to the same budget, and the $2^{\ell-3}$ threshold above is a rule of thumb rather than a bound with a proof behind it.

> [!warning] The initial constant and the full error bound are not in the book
> $C_1=1/K$ was computed for $n=-\ell+2$ micro-rotations; with the chain cut short the product $K=\prod_{i=1}^{n}\sqrt{1+2^{-2i}}$ runs over fewer factors and $C_1$ must be recomputed. Adding a safe bound for the new approximation error and the two multiplication roundings is left to the reader on p. 614, with a pointer to the FloPoCo source — this note reproduces neither.

**The recurrence and its terminator, in Spade.**

```spade
/// One CORDIC micro-rotation at shift I on a W-bit two's-complement datapath
/// (sfix(0, l-g), so W = -l+g+1). atan is the pre-divided constant (1/pi)atan(2^-I).
entity cordic_step<#uint W, #uint I>(c: int<W>, s: int<W>, z: int<W>, atan: int<W>)
    -> (int<W>, int<W>, int<W>)
{
    let d = z >= 0;               // d_i = sign(Z_i): the only control signal in the loop
    let cs: int<W> = c >>> I;     // wiring in an unrolled stage, a barrel shifter in a folded one
    let ss: int<W> = s >>> I;
    (if d { c -. ss } else { c +. ss },
     if d { s +. cs } else { s -. cs },
     if d { z -. atan } else { z +. atan })
}

/// The terminating rotation by the residual: cos(pi Z) ~ 1, sin(pi Z) ~ pi Z.
/// pz is pi*Z_i already narrowed to M = floor(-l/2)+1+g bits by the FixRealCM.
fn cordic_finish<#uint W, #uint M>(c: int<W>, s: int<W>, pz: int<M>) -> (int<W>, int<W>) {
    let ch: int<M> = trunc(c >>> {W - M});          // truncate C_i, S_i to the multiplier width
    let sh: int<M> = trunc(s >>> {W - M});
    let dc: int<W> = trunc((pz * sh) >>> {M - 1});  // realign the 2M-bit product to the datapath
    let ds: int<W> = trunc((pz * ch) >>> {M - 1});
    (c -. dc, s +. ds)
}
```

`cordic_step` is the dashed box of the diagram: `>>> I` is the $\gg i$ wiring, `d` is the one-bit $d_i$ that feeds all three adders, and the three `-.`/`+.` are the three carry-propagate adders. `cordic_finish` is everything to the right of it except the $\times\pi$: the two `trunc` boxes, the two multipliers, the two final adders. The realignment shift is $M-1$ and not something less tidy because $\ell-g=1-W$ in this format, so the product's weight $2^{2(\ell-g)+(W-M)}$ differs from the datapath's $2^{\ell-g}$ by exactly $M-1$ places. Both blocks are purely combinational; a real operator puts a register between every `cordic_step` and one or two inside each multiplier. Synthesis will not build the drawing's `trunc` boxes at all — they are bit selects — and will map each `*` onto one DSP block, whose $18\times25$ asymmetry means $\widetilde C_i$ may be kept wider than $\pi Z_i$ for free.

**Iteration count and loop control.** The operator instantiates `cordic_step` with $I=1,2,\dots,\lfloor-\ell/2\rfloor$ — 12 instances at $\ell=-24$ — then `cordic_finish` once. Unrolled, the loop control is free: $I$ is a compile-time constant so the shifter is wiring, and each stage's `atan` is a hardwired constant, which is why `cordic_step` takes it as an argument rather than reading a table. Folded onto one datapath the same recurrence needs two barrel shifters, a $\lfloor-\ell/2\rfloor$-entry ROM of $\alpha_i$ addressed by an iteration counter, and a mux at every state input — the loop control then costs more than the adders it shares.

Verified with `.zettel/sim.sh` at $W=21$, $M=13$ (i.e. $\ell=-16$, $g=4$), against real-arithmetic references: `cordic_step` at $I=3$ checked geometrically — the output vector's angle must advance by $\pm\arctan2^{-3}$ and its modulus by $\sqrt{1+2^{-6}}$ — and `cordic_finish` against $C-\pi ZS$, $S+\pi ZC$ in floating point to within 6 ulp of the internal format.

**Related notes.**

- [[Unrolled CORDIC]] – extends: this is that pipeline cut at stage $\lfloor-\ell/2\rfloor+1$ and capped with a multiplier tail.
- [[Reduced-Z CORDIC Datapath]] – supports: the one-MSB-per-stage shrinkage is exactly why $Z_i$ is already narrow enough to multiply at the cut point.
- [[CORDIC Rotation Mode]] – depends-on: supplies the recurrence and the $|Z_i|<2^{-i}$ bound that fixes the stopping index.
- [[Iterative CORDIC]] – counter-example: folding the loop turns this optimisation from an area win into a pure latency win.
- [[Table-and-Multiplier Sine and Cosine]] – compares: the same rotation identity, but splitting the angle once instead of $\lfloor-\ell/2\rfloor$ times.
- [[Small-Angle Taylor Sine and Cosine]] – supports: the same $\sin z\approx z$, $\cos z\approx1$ truncation, carried one term further.
- [[Multiplication by Constants]] – supports: the $\times\pi$ is a `FixRealCM`, sized to one ulp of $Z_i$ rather than of the format.
- [[Truncated Multipliers]] – extends: narrowing $C_i$, $S_i$ to the width of $\pi Z_i$ is the same one-ulp-for-half-the-area bargain.
- [[DSP Blocks]] – depends-on: the whole trade rests on two hard $18\times18$ multipliers being idle.
- [[Choosing a CORDIC Architecture]] – compares: where this hybrid lands against the pure-shift and pure-table ends.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §20.4.6 "Replacing Half of the CORDIC Iterations with a Small Multiplier", pp. 613–614 — (20.43), the stopping index, the multiplier widths, the 18-bit DSP remark, and the error analysis left as an exercise.
- §20.2.3, p. 604 — the original "reduced iterations CORDIC" [THH89].
- §20.2.2, p. 603 — the $(1-2^{\ell})$ output scaling (20.19)–(20.20).
- §20.4.4–20.4.5, pp. 611–613 — the guard-bit budget $g$ and the shrinking $Z_i$ width the cut point depends on.
