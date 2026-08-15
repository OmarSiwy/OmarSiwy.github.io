---
title: "Faithful Floating-Point Multiplier"
description: "Swap the exact significand multiplier for a truncated one faithful to ufix(1,-wF-1): the error budget closes at 1 ulp in both binades and the architecture is unchanged, for an appreciable area and delay saving."
kind: circuit
source: "ASA §11.2.3, pp. 344-346"
status: seed
spade: simulated
tags: [digital, floating-point, multiplier, faithful, rounding, fpga]
aliases:
  - Faithful Multiplier
  - Faithful FP Multiplier
  - Faithful Floating-Point Multiplication
  - Degraded-Accuracy Floating-Point Multiplier
---

# Faithful Floating-Point Multiplier

The baseline floating-point multiplier with its exact $(w_F{+}1)\times(w_F{+}1)$ significand multiplier replaced by a truncated one: every block downstream keeps its function and its position, and the only thing that changes is that $P$ arrives $w_F{-}1$ bits narrower and slightly wrong.

```tikz title="Faithful floating-point multiplier: the baseline datapath with a narrower P"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small, >=latex,
  blk/.style={draw, rounded corners=1pt, align=center, inner sep=3pt},
  w/.style={font=\scriptsize, inner sep=1pt}]

\node (X) at (5.2,9.5) {$X$};
\node (Y) at (6.8,9.5) {$Y$};
\node[blk, minimum width=8.0cm, minimum height=0.55cm] (unp) at (4.0,8.6) {unpack \& exception handling};
\draw[->] (5.2,9.3) -- (5.2,8.88);
\draw[->] (6.8,9.3) -- (6.8,8.88);

% ---- exponent path
\node[blk, minimum width=1.6cm, minimum height=0.5cm] (add) at (1.6,7.5) {$+$};
\draw[->] (1.0,8.32) -- (1.0,7.75); \node[w,anchor=east] at (0.92,8.15) {$E_X$};
\draw[->] (2.2,8.32) -- (2.2,7.75); \node[w,anchor=west] at (2.28,8.15) {$E_Y$};
\draw[->] (1.6,7.25) -- (1.6,6.9) -- (0.7,6.9) -- (0.7,6.65);
\draw[->] (1.6,7.25) -- (1.6,6.9) -- (2.6,6.9) -- (2.6,6.65);
\node[w,anchor=west] at (1.68,7.08) {$w_E{+}1$};
\node[blk, minimum width=1.2cm, minimum height=0.5cm] (e0) at (0.7,6.4) {$-E_0$};
\node[blk, minimum width=1.7cm, minimum height=0.5cm] (e1) at (2.6,6.4) {$-E_0{+}1$};
\node[blk, minimum width=2.6cm, minimum height=0.5cm] (mux) at (1.65,5.2) {$0$ \hspace{1.1cm} $1$};
\draw[->] (0.7,6.15) -- (0.7,5.45); \node[w,anchor=east] at (0.62,5.8) {$w_E{+}2$};
\draw[->] (2.6,6.15) -- (2.6,5.45); \node[w,anchor=west] at (2.68,5.8) {$w_E{+}2$};
\draw[->] (1.65,4.95) -- (1.65,1.53); \node[w,anchor=east] at (1.57,3.2) {$w_E{+}2$};

% ---- significand path
\node[blk, minimum width=2.6cm, minimum height=1.6cm] (mul) at (6.0,6.9) {faithful\\[2pt]$\times$};
\draw[->] (5.2,8.32) -- (5.2,7.7); \node[w,anchor=east] at (5.12,8.15) {$M_X$};
\draw[->] (6.8,8.32) -- (6.8,7.7); \node[w,anchor=west] at (6.88,8.15) {$M_Y$};
\node[blk, minimum width=2.6cm, minimum height=0.5cm] (nrm) at (6.0,4.9) {1-bit norm.};
\node[blk, minimum width=2.6cm, minimum height=0.5cm] (rad) at (6.0,3.4) {rounding adder};
\draw[->] (6.0,6.1) -- (6.0,5.15);
\node[w,anchor=west] at (6.08,5.72) {$P$: ufix$(1,-w_F{-}1)$};
\node[w,anchor=west] at (6.08,5.42) {$w_F{+}3$ bits};
\draw[->] (6.0,4.65) -- (6.0,3.65);
\node[w,anchor=west] at (6.08,4.32) {ufix$(-1,-w_F{-}1)$};
\node[w,anchor=west] at (6.08,4.02) {$w_F{+}1$ bits};
\draw[->] (6.0,3.15) -- (6.0,1.53);
\node[w,anchor=west] at (6.08,2.5) {ufix$(-1,-w_F)$};
\node[w,anchor=west] at (6.08,2.2) {$w_F$ bits};

% ---- overflow OR into the exponent mux
\node[or port, scale=0.5, xscale=-1] (org) at (3.95,4.15) {};
\draw (6.0,5.55) -- (4.45,5.55) -- (4.45,4.3) -- (org.in 1);
\node[w,anchor=east] at (4.38,4.95) {$P_{\text{ovf}}$};
\draw (4.7,3.4) -- (4.3,3.4) |- (org.in 2);
\node[w,anchor=north east] at (4.42,3.32) {$c_{\text{out}}$};
\draw[->] (org.out) -- (3.4,4.15) -- (3.4,5.2) -- (2.95,5.2);

% ---- pack
\node[blk, minimum width=8.0cm, minimum height=0.55cm] (pak) at (4.0,1.25) {exception handling \& pack};
\draw[->] (4.0,0.97) -- (4.0,0.5); \node at (4.0,0.28) {$R$};
\end{circuitikz}
\end{document}
```

*after Fig. 11.7, p. 344, with the exact significand multiplier replaced by a faithful one; the sign path $s_R=s_X\oplus s_Y$ is omitted.*

**Put the specification on the significand multiplier, not on the result.** The inputs $M_X,M_Y$ are $(w_F{+}1)$-bit `ufix(0,`$-w_F$`)` significands with the implicit leading one made explicit, and the [[Floating-Point Multiplier|baseline]] builds their exact product $P=M_XM_Y$ as a $(2w_F{+}2)$-bit `ufix(1,`$-2w_F$`)` number. The faithful variant asks for far less: any $\tilde P$ in the $(w_F{+}3)$-bit format `ufix(1,`$-w_F-1$`)` whose error obeys $|\tilde P-M_XM_Y|<2^{-w_F-1}$, i.e. strictly below one ulp of *that* format — which is precisely what a [[Truncated Multipliers|truncated multiplier]] delivers by never assembling the low $w_F-1$ columns of the partial-product array. Faithful is a *relation*, not a function: two different implementations may return different $\tilde P$ for the same inputs, and both are correct.

**Close the budget in the lower binade.** Suppose $\tilde P\in[1,2)$, so the 1-bit normalization does nothing. The rounding adder then rounds `ufix(1,`$-w_F-1$`)` to `ufix(1,`$-w_F$`)`, which by the definition of round-to-nearest contributes at most half an ulp of the target, $2^{-w_F-1}$. Errors compose additively by the triangle inequality, so

$$\underbrace{2^{-w_F-1}}_{\text{faithful }\tilde P}+\underbrace{2^{-w_F-1}}_{\text{final rounding}}=2^{-w_F}.$$

**Close it in the upper binade, where the shift both helps and hurts.** If $\tilde P\in[2,4)$ the normalization divides by two. Division by two is linear, so it *halves the incoming error* to $2^{-w_F-2}$ — but it also pushes the least significant bit of $\tilde P$, weight $2^{-w_F-1}$, down to weight $2^{-w_F-2}$, below the retained format, and that bit is dropped. Three terms now:

$$\underbrace{2^{-w_F-2}}_{\text{halved by the }\gg 1}+\underbrace{2^{-w_F-2}}_{\text{dropped bit}}+\underbrace{2^{-w_F-1}}_{\text{final rounding}}=2^{-w_F}.$$

Both bounds are strict — the first term in each is a strict inequality — and $2^{-w_F}$ is exactly $1\,\mathrm{ulp}$ of a result whose significand lies in $[1,2)$ (see [[Error Accuracy]] for the ulp convention and for why "faithful" means $<1$ ulp rather than $\le\frac12$). The result is therefore faithful, not correctly rounded: it is one of the two floating-point numbers bracketing the exact product, but which one is implementation-defined.

**Check that the range survives, or the 1-bit normalization stops being enough.** The whole architecture rests on $P\in[1,4)$ — exactly two binades, so normalization is a multiplexer rather than a shifter. A perturbed $\tilde P$ must stay inside. At the bottom, the smallest product is $M_XM_Y=1$, which is exactly representable in `ufix(1,`$-w_F-1$`)`, and a faithful operator returns an exactly representable result exactly, so $\tilde P=1$. At the top, the largest product is $(2-2^{-w_F})^2=4-4\cdot2^{-w_F}+2^{-2w_F}$, and adding the error bound $2^{-w_F-1}$ leaves it well below $4$ for every $w_F\ge1$. Both ends hold, so Fig. 11.7's normalization is still sufficient (p. 346).

**The exponent path is untouched, including the argument that makes it a multiplexer.** Two tentative exponents $E_X+E_Y-E_0$ and $E_X+E_Y-E_0+1$ are precomputed on $w_E+2$ bits, and the incremented one is selected when the product overflows into $[2,4)$ **or** when the rounding addition carries out of the fraction. That this is a select and not a carry propagation depends on the two events being exclusive (p. 345), and the exclusivity argument survives the perturbation: in the upper binade the normalized significand is bounded by

$$\tfrac12\left(4-4\cdot2^{-w_F}+2^{-2w_F}+2^{-w_F-1}\right)=2-\tfrac74\cdot2^{-w_F}+2^{-2w_F-1}\;<\;2-2^{-w_F-1},$$

which is below the threshold at which round-to-nearest would carry into the next binade. So a product overflow still guarantees no rounding overflow, and the exponent stays a mux.

**Multiply is the operator where faithfulness actually pays.** The last ulp is expensive here — an exact $(2w_F{+}2)$-bit product where a $(w_F{+}3)$-bit one would do — and cheap in the adder, whose significand datapath is already only $w_F+3$ bits wide, which is why the book calls a faithful adder "little benefit" (p. 339) and a faithful multiplier "an appreciable reduction in area and delay" (p. 346). On FPGAs the saving lands on whatever builds the partial-product array, DSP tiles or a bit heap; the mechanism is the truncated multiplier's, so it belongs to [[Truncated Multipliers]] and not here.

> [!warning] No measured saving is given
> Chapter 11 quantifies nothing for this variant — no LUT, DSP, area or delay figure, and no error distribution. "Appreciable reduction" (p. 346) is the whole of the claim. Sizing the win needs [[Truncated Multipliers]]' own cost model or your own synthesis run.

$$\boxed{\ \big|\tilde P-M_XM_Y\big|<2^{-w_F-1}\ \Longrightarrow\ |R-XY|<2^{-w_F}\cdot 2^{E_R}=1\ \mathrm{ulp}(R)\ }$$

**When it breaks.** The bound is exactly $1$ ulp with nothing left over, so the multiplier is faithful and *cannot* be made correctly rounded by tightening only the final rounding — you would have to tighten $\tilde P$ itself, at which point you are paying for the exact product again. Faithful results are not reproducible across implementations and not associative-friendly, so anything user-visible, anything requiring bit-identical results between two builds, and anything claiming IEEE 754 compliance must use the baseline. Error analysis over a datapath of such operators no longer composes with the $\frac12$ ulp constant: every multiply contributes up to $1$ ulp, doubling the growth term ([[Error Analysis]]). Ties-to-even is meaningless here — a tie in $\tilde P$ carries no information about the exact product — so the [[Rounding]] mode degrades to "round to nearest, ties whatever". Finally, subnormal support is orthogonal and unhelped: it remains the expensive part of the multiplier, and the faithful variant saves nothing there.

**In Spade,** the significand path of the whole operator, parameterised on $w_F$:

```spade
/// Significand datapath of a faithful floating-point multiplier, parameterised
/// on the fraction width WF. mx, my are normalized significands in ufix(0,-WF),
/// held as integers in [2^WF, 2^{WF+1}).
/// Returns {exp_inc, frac}: WF fraction bits plus the exponent-increment flag.
entity fp_mul_faithful<#uint WF>(mx: uint<{WF + 1}>, my: uint<{WF + 1}>)
    -> uint<{WF + 1}>
{
    // faithful significand multiplier: P to ufix(1,-WF-1), error < 2^-WF-1.
    // Modelled here by discarding the WF-1 lowest columns of the exact product;
    // a real one never builds them.
    let drop: uint<{2 * WF + 2}> = WF - 1;
    let pf: uint<{WF + 3}> = trunc((mx * my) >> drop);

    // 1-bit normalization: a mux, not a shifter, because P is in [1,4).
    let ovf = pf.msb();
    let pn: uint<{WF + 2}> = if ovf { trunc(pf >> 1) } else { trunc(pf) };
    let fr: uint<{WF + 1}> = trunc(pn);          // ufix(-1,-WF-1), leading 1 dropped

    // rounding adder: inject half an ulp, then drop the round bit.
    let s = fr + 1;
    let frac: uint<WF> = trunc(s >> 1);
    (ovf || s.msb()).as_uint().concat(frac)
}
```

`pf` is the $P$ wire of the diagram, $w_F{+}3$ bits, and the `>> drop` is the only line that differs from the baseline — it is a *specification*, not a structure, since the point of a truncated multiplier is that those columns are never built. `ovf` is $P_{\text{ovf}}$, `s.msb()` is $c_{\text{out}}$, and their `||` is the OR gate feeding the exponent mux. The whole entity is combinational; `fr + 1` widens to $w_F{+}2$ bits per Spade's `+` rule, which is exactly the rounding adder's carry-out position, and `s >> 1` discards the round bit. Synthesis will not build the $(2w_F{+}2)$-bit product and then shift it — the constant shift lets the whole low triangle of the array be swept away, which is the area the note is about.

Simulated at $w_F=8$ over all $2^{16}$ normalized significand pairs plus six named vectors, checking both the structural reference and the arithmetic claim $|R-M_XM_Y|<1\,\mathrm{ulp}$ directly: 65542 vectors, zero failures.

**Related notes.**

- [[Floating-Point Multiplier]] – extends: the baseline this degrades; every block outside the multiplier is taken from it unchanged.
- [[Truncated Multipliers]] – depends-on: supplies the $\tilde P$ that meets the $2^{-w_F-1}$ bound, and the cost model for what the truncation saves.
- [[Error Analysis]] – supports: how a $1$ ulp per-operation bound composes across a datapath, versus $\frac12$ ulp.
- [[Rounding]] – compares: correct rounding is the property this deliberately gives up; ties-to-even has no meaning once $\tilde P$ is inexact.
- [[Injection Rounding]] – compares: the other way to make the multiplier cheaper, attacking delay by fusing the rounding adder into the array rather than shrinking the array.
- [[Correct Rounding from Faithful Quotient]] – counter-example: division recovers correct rounding from a faithful result; for multiplication the recovery costs the exact product back.
- [[Choosing a Floating-Point Operator]] – compares: where faithful sits against correctly rounded, per operator.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §11.2.3 "Faithful Floating-Point Multiplier", p. 346; §11.2.1 and Fig. 11.7, pp. 343-345; §11.2.2, pp. 345-346; trade-off discussion pp. 339, 344-346.
