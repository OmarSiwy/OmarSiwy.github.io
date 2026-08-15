---
title: "Newton-Raphson Reciprocal"
description: "r_{i+1} = 2r_i - D r_i^2 doubles the correct bits per step and is self-correcting because e_i is re-measured against D — one exact squarer then one truncated multiplier in sequence, datapath doubling every step."
kind: circuit
source: "ASA §9.3.3, pp. 291-294"
status: seed
spade: simulated
tags: [digital, divider, reciprocal, newton-raphson, iterative, fpga]
aliases:
  - NR Reciprocal
  - Newton-Raphson Division
  - Newton-Raphson Reciprocal Iteration
  - Reciprocal Using Newton-Raphson Iteration
---

# Newton-Raphson Reciprocal

A multiplicative reciprocal iteration whose error obeys $e_{i+1} = e_i^2$ *measured on the value the hardware actually holds*, which is what makes it the only quadratic reciprocal scheme that repairs its own rounding.

```tikz title="One Newton-Raphson reciprocal iteration: exact squarer then truncated multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]
  % --- inputs -------------------------------------------------------
  \node at (0,6.25) {$D\in[1,2)$};
  \node at (4.6,6.25) {$R_i\in[1/2,1)$};

  % --- blocks -------------------------------------------------------
  \node[draw, minimum size=0.5cm]                       (T)  at (0,5.3)  {\scriptsize T};
  \node[draw, minimum width=1cm, minimum height=0.8cm]  (SH) at (2.4,5.0) {$\ll 1$};
  \node[draw, minimum width=1cm, minimum height=0.8cm]  (SQ) at (4.6,5.0) {$x^2$};
  \node[draw, minimum width=1cm, minimum height=0.8cm]  (M)  at (4.6,3.3) {$\times$};
  \node[draw, minimum width=3.4cm, minimum height=0.6cm](S)  at (3.5,2.05) {};
  \node at (2.62,2.05) {\small $+$};
  \node at (4.38,2.05) {\small $-$};

  % --- wiring -------------------------------------------------------
  \draw[->] (0,6.0) -- (0,5.55);
  \draw[->] (0,5.05) -- (0,3.3) -- (4.1,3.3);
  \draw     (4.6,6.0) -- (4.6,5.8);
  \draw[->] (4.6,5.8) -- (4.6,5.4);
  \draw[->] (4.6,5.8) -- (2.4,5.8) -- (2.4,5.4);
  \draw[->] (4.6,4.6) -- (4.6,3.7);
  \draw[->] (4.6,2.9) -- (4.6,2.35);
  \draw[->] (2.4,4.6) -- (2.4,2.35);
  \draw[->] (3.5,1.75) -- (3.5,1.05);
  \node at (3.5,0.78) {$R_{i+1}$};

  % --- widths -------------------------------------------------------
  \node[anchor=west] at (0.12,5.75) {\tiny ufix$(0,-w_F)$};
  \node[anchor=west] at (0.12,4.55) {\tiny ufix$(0,2\ell_i)$};
  \node[anchor=west] at (0.12,3.52) {\tiny $D_i$};
  \node[anchor=west] at (4.72,5.72) {\tiny ufix$(-1,\ell_i)$};
  \node[anchor=west] at (4.72,4.32) {\tiny ufix$(-1,2\ell_i)$};
  \node[anchor=west] at (4.72,3.95) {\tiny $R_i^2$};
  \node[anchor=west] at (2.52,4.32) {\tiny ufix$(0,\ell_i+1)$};
  \node[anchor=west] at (2.52,3.95) {\tiny $2R_i$};
  \node[anchor=west] at (4.72,2.62) {\tiny ufix$(-1,\ell_{i+1})$};
  \node[anchor=west] at (3.62,1.42) {\tiny ufix$(-1,\ell_{i+1})$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.16b, p. 292. The `T` box is a truncation, free in hardware; the wide box is the subtracter.*

**Turn the reciprocal into a root-finding problem that never divides.** The reciprocal of $D$ is the zero of $f(r) = 1/r - D$. The Newton step $r_{i+1} = r_i - f(r_i)/f'(r_i)$ (9.52) would normally need a division by $f'$, but here $f'(r) = -1/r^2$, so $f(r_i)/f'(r_i) = -r_i^2(1/r_i - D)$ and the offending $1/r_i$ *cancels against* the $r_i^2$:

$$r_{i+1} = r_i + r_i^2\Big(\frac{1}{r_i} - D\Big) = 2r_i - D r_i^2 \tag{9.53}$$

That cancellation is the whole reason this iteration is usable in hardware: the update contains one squaring, one multiplication and one doubling, and doubling is a rewiring. The squaring and the multiplication are **necessarily in sequence** — the multiplier consumes the squarer's output — which fixes the latency of a step at $T_{\text{sq}} + T_{\text{mult}} + T_{\text{sub}}$.

**Square the error, do not merely shrink it.** Define the *reciprocal remainder* $e_i = 1 - Dr_i$ (9.54). Multiply (9.53) by $-D$ and add 1:

$$e_{i+1} = 1 - Dr_{i+1} = 1 - 2Dr_i + (Dr_i)^2 = (1 - Dr_i)^2 = e_i^2 \tag{9.55}$$

by the binomial identity $1 - 2u + u^2 = (1-u)^2$ with $u = Dr_i$. The relative error is $\varepsilon_i = (r_i - 1/D)/(1/D) = Dr_i - 1 = -e_i$, so $\varepsilon_{i+1} = \varepsilon_i^2$ too and **the number of correct bits doubles per iteration**, provided only that $|e_0| < 1$. Two structural facts fall out for free: $e_i = e_{i-1}^2 \ge 0$ for every $i \ge 1$, hence $r_i \le 1/D$, and since $D \in [1,2)$ that keeps $R_i \in [1/2, 1)$ — the bit of weight $2^0$ is never needed and the datapath carries `ufix(-1, ...)` throughout. The absolute error follows the same law, $\delta_i = -e_i/D$ with $D \in [1,2)$.

> [!note] The squaring law is stated on the value the hardware holds, not the ideal one
> Nothing in the derivation of (9.55) assumed $r_i$ was exact. $e_i = 1 - Dr_i$ *re-measures* whatever the register contains against $D$, so a rounding error injected at step $i$ becomes part of $e_i$ and is squared away at step $i+1$. Newton-Raphson is therefore self-correcting, and the book's design rule follows directly: keep each step's rounding errors of the order of $e_i^2$ and near-quadratic convergence survives (p. 293). [[Goldschmidt Division]] has the same convergence law but computes its correction factor from the denominator alone, so its numerator errors are never re-measured — that is the single reason to prefer this iteration over that one.

**Seed it from a table, and pay for the seed twice over.** The iteration converges only from $|e_0| < 1$, so $R_0$ comes from a table addressed by the leading bits of $D$. Truncate $D$ to $\ell_T$ fractional bits, $D_0 = \lfloor D \rfloor_{\ell_T} \in \mathrm{ufix}(0,\ell_T)$ (9.56), and store

$$R_0 = \left\lfloor \frac{1}{D_0 + 2^{\ell_T}}\right\rfloor_{\ell_0} \tag{9.57}$$

Dividing by $D_0 + 2^{\ell_T} \ge D$ rather than $D_0 \le D$ is what forces $R_0 \le 1/D$, preserving the weight-$2^0$ saving from the first step; the outer truncation to $\ell_0$ bits only pushes $R_0$ further down. Splitting $e_0$ across the two truncations and bounding each factor,

$$e_0 = \underbrace{(D_0+2^{\ell_T})}_{\le\,2}\underbrace{\Big(\tfrac{1}{D_0+2^{\ell_T}} - R_0\Big)}_{<\,2^{\ell_0}} + \underbrace{(D_0 - D + 2^{\ell_T})}_{<\,2^{\ell_T}}\underbrace{R_0}_{<\,1} \;\Longrightarrow\; 0 \le e_0 < 2\cdot 2^{\ell_0} + 2^{\ell_T} \tag{9.61–9.62}$$

Choosing $\ell_T = \ell_0 + 1$ balances the two contributions and gives $0 \le e_0 < 4\cdot 2^{\ell_0}$, i.e. roughly $|\ell_0| - 2$ correct bits out of the table. Table geometry is in [[Reciprocal Seed Table]].

> [!warning] The tighter seed bound and the full error analysis are left as exercises
> The book states the real bound is nearer $3\cdot2^{\ell_0}$ once the correlation between $D_0$ and $R_0$ is accounted for — "we leave this as an exercise for the reader" (p. 293) — and likewise "the detailed error analysis is left as an exercise to the reader" (p. 294), pointing at §9.4 for a sketch on a different algorithm. Sizing a production Newton-Raphson datapath needs that analysis done, or [[Error Analysis]] applied from scratch.

**Size each block so its rounding is of the order of $e_i^2$.** Because accuracy doubles, target $\ell_{i+1} \approx 2\ell_i$ and $\delta_i \approx 2^{\ell_i}$, with $\ell_0$ set by the table. Three sizing rules follow (p. 294):

- The squarer must be **exact**. $R_i$ is $|\ell_i|$ bits, so $R_i^2$ is exactly $2|\ell_i|$ bits and fits `ufix(-1, 2ℓ_i)` with no rounding at all. A truncated squarer would inject an error of order $2^{\ell_i}$, not $2^{2\ell_i}$, and $R_{i+1}$ would simply not be twice as accurate as $R_i$. Use a dedicated squarer rather than a multiplier — it is roughly half the area, see [[Squarers and Integer Powers]].
- The multiplier must be **truncated**. Its exact output would be $\mathrm{ufix}(-1, 2\ell_i + \ell_T)$-wide and every bit below $2^{\ell_{i+1}}$ is thrown away immediately by the subtracter; a [[Truncated Multipliers|truncated multiplier]] computes only what survives.
- $D$ may be truncated in early iterations, since it need not be more accurate than $R_i$ — hence the `T` box feeding $D_i$ at `ufix(0, 2ℓ_i)`. In the last iteration `T` does nothing and full-width $D$ goes straight to the multiplier.

Net: exactly **two** rounding errors per iteration, the truncation of $D$ and the truncation of the product, and a datapath whose width **doubles every step**.

**Count the iterations, then decide whether to unroll.** Starting from $e_0 < 2^{\ell_0+2}$ and squaring, $e_n < 2^{2^n(\ell_0+2)}$. Against the faithful-reciprocal target $|\delta_{\text{recip}}| < 2^{\ell_R}$, $\ell_R = -w_F-4$, fixed by the error split in [[Division by Reciprocal]],

$$n = \left\lceil \log_2 \frac{w_F + 4}{|\ell_0| - 2} \right\rceil$$

so an 8-bit-output seed table ($\ell_0 = -8$) needs $n = 3$ steps for single precision ($w_F = 23$) and $n = 4$ for double ($w_F = 52$); widening the table to $\ell_0 = -12$ buys back one step. **Loop control is the reason this is normally unrolled in space.** Because the widths double, a folded implementation that reuses one squarer and one multiplier across all $n$ steps must size both for the *final* iteration — a $2|\ell_{n-1}|$-bit squarer and a full-$w_F$ multiplier — and then run them a quarter-utilised in the early steps, plus multiplexers on both operands, a step counter, and a per-step selection of how far to truncate $D$. Unrolled, each step gets operators sized to its own $\ell_i$ and the total area is dominated by the last stage alone, which is close to what the folded version costs anyway. The trade is throughput: unrolled pipelines at one result per cycle, folded occupies one multiplier for $n$ cycles.

**The critical path is what loses to the quadratic series.** A Newton-Raphson step is a squarer *followed by* a multiplier. [[Quadratic Series Divider|Quadratic series expansion]] reaches the same quadratic convergence with $E_{i+1} = E_i^2$ and $Q_{i+1} = Q_i(1+E_i)$, two operations that depend on the same inputs and therefore issue **in parallel**, and its squarer datapath *shrinks* each step instead of growing. Newton-Raphson keeps the advantage where the multiplication count matters more than the depth. On FPGAs both mapped onto [[DSP Blocks]], where a fixed-width multiplier makes the exact/truncated distinction partly moot, and Pasca found reciprocal-specific iterations to beat generic polynomial approximation only at double precision (p. 291).

$$\boxed{\ R_{i+1} = 2R_i - D_i R_i^2, \qquad e_i = 1 - DR_i \;\Longrightarrow\; e_{i+1} = e_i^2\ }$$

**Where it stops paying.**

- **$D$ near zero.** The whole reciprocal family requires $D$ bounded away from $0$; it is defined only on normalised significands $D \in [1,2)$. An integer divider must normalise first, and exponent handling belongs to [[Floating-Point Operators]].
- **A truncated squarer.** The single most damaging shortcut: it costs the $e_i^2$ term and degrades convergence to linear-ish, which is invisible in a compile and only shows up as missing bits after three steps.
- **$e_0 \ge 1$.** With no seed table, or a table too coarse for the chosen $\ell_T$, the iteration diverges rather than converging slowly. There is no graceful degradation.
- **Small $w_F$.** Below roughly 16-bit results the table plus one step already costs more than a [[SRT Division|radix-4 SRT]] recurrence, and at very small $w_F$ a direct table for $X/D$ or a degree-2 polynomial for $1/D$ wins outright.
- **When latency, not multiplier count, is the budget.** One Halley step ([[Halley Reciprocal Iteration]]) triples the bits for one squarer and two multipliers, filling the gap between one and two Newton steps.

**RTL.** One iteration, at $\ell_i = -8 \to \ell_{i+1} = -16$. Widths are the diagram's, made concrete.

```spade
/// One Newton-Raphson reciprocal step  R_{i+1} = 2 R_i - D_i R_i^2
///   r : R_i  in ufix(-1, -8)   -> uint<8>,  value r * 2^-8,  R_i in [1/2, 1)
///   d : D_i  in ufix( 0, -16)  -> uint<17>, value d * 2^-16, D   in [1, 2)
///   out: R_{i+1} in ufix(-1, -16) -> uint<16>
entity nr_recip_step(r: uint<8>, d: uint<17>) -> uint<16> {
    // exact squarer: 8 x 8 -> 16, R_i^2 in ufix(-1, -16)
    let rsq: uint<16> = r * r;
    // D_i * R_i^2 in ufix(-1, -32); product < 2^32 because D R_i^2 <= R_i < 1
    let prod: uint<33> = zext::<16, 33>(rsq) *. zext::<17, 33>(d);
    // truncating multiplier: drop the low 16 bits -> ufix(-1, -16)
    let dr2: uint<17> = trunc(prod >> 16);
    // 2 R_i realigned to LSB 2^-16 is r << 9, in ufix(0, -16)
    let two_r: uint<17> = zext::<8, 17>(r) << 9;
    trunc(two_r - dr2)
}
```

`rsq` is the `x²` box and is the one place `*` is used at full width — that is the exact squarer. `prod >> 16` is the truncated multiplier: synthesis will never build the 33-bit product and then discard half of it, it builds only the columns at weight $\ge 2^{-16}$, which is the whole point of [[Truncated Multipliers]]. `two_r` is the `≪ 1` box combined with the realignment from LSB $2^{-8}$ to $2^{-16}$, so it is a shift of 9, not 1, and costs no logic. The final `trunc` to `uint<16>` is the `ufix(-1,·)` claim: it is only sound because $e_i \ge 0$ guarantees $R_{i+1} < 1$, and it is exactly the bit the weight-$2^0$ argument above saves. Everything here is combinational; a folded divider registers `two_r - dr2` and feeds it back as `r` with the widths of the widest step.

Simulated with iverilog: 5407 checks pass — 7 named vectors (including $R_i = 2^{-8}$ against $D \to 2^-$, and $R_i = 137/256$ against $D = 1 + 2^{-16}$, deliberately asymmetric in both fields), 5000 random $(r,d)$ pairs against a behavioural model, and 400 randomised runs asserting $0 \le e_{i+1} \le e_i^2 + 10^{-4}$ from a deliberately crude seed with $e_i \approx 0.1$–$0.3$. That last check is what distinguishes this from a compile: mutating the `<< 9` to `<< 8` fails all 400.

**Related notes.**

- [[Reciprocal Seed Table]] – depends-on: supplies $R_0$ and hence $\ell_0$, which sets the iteration count.
- [[Division by Reciprocal]] – depends-on: the $\delta_{\text{mult}} + X\delta_{\text{recip}}$ split that fixes the $\ell_R$ this iteration must hit.
- [[Squarers and Integer Powers]] – supports: the $x^2$ box, which must be exact here.
- [[Truncated Multipliers]] – supports: the $\times$ box, which must not be.
- [[Quadratic Series Divider]] – compares: same quadratic law, but squarer and multiplier run in parallel and the error datapath shrinks.
- [[Goldschmidt Division]] – counter-example: identical convergence, no self-correction, because the correction factor never re-measures the numerator.
- [[Halley Reciprocal Iteration]] – extends: the degree-2 Householder step, cubic convergence for one extra multiplier.
- [[Newton-Raphson Square Root]] – extends: the same zero-finding applied to $1/x^2 - X$.
- [[Error Analysis]] – supports: the per-step rounding budget the sizing rules implement.
- [[Choosing a Divider]] – compares: where the multiplicative family sits against digit recurrence.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 9 "Fixed-Point Division".

- §9.3.3 "Reciprocal Using Newton-Raphson Iteration", (9.52)–(9.62), Fig. 9.16, pp. 291–294.
- §9.3 reciprocal-based division and the $\ell_Q/\ell_R$ error budget, (9.46)–(9.51), Fig. 9.15, pp. 288–290.
- §9.3.2 generic approximation and the Pasca [Pas12] comparison, p. 291.
- §9.4 quadratic series expansion, the parallel-step contrast, Fig. 9.17, pp. 296–297.
