---
title: "Fixed-Point Format Narrowing"
description: "Splits the unavoidable loss of bits into two independent failure modes — catastrophic overflow at the MSB, quantifiable rounding at the LSB — and makes l the cursor of the area-versus-accuracy trade."
kind: circuit
source: "ASA §2.2.4, pp. 42-43"
status: seed
spade: simulated
tags: [digital, number-formats, fixed-point, overflow, rounding, saturation]
aliases:
  - Fixed-Point Narrowing
  - Narrowing Conversion
  - Format Narrowing
  - Overflow and Rounding
---

# Fixed-Point Format Narrowing

The conversion $\mathrm{sfix}(m,\ell)\to\mathrm{sfix}(m',\ell')$ with $m'<m$ or $\ell'>\ell$ — the only lossy operation in a fixed-point datapath, and the only one whose two ends fail in completely different ways.

```tikz title="Narrowing sfix(7,-8) to sfix(3,-4): the top slice is errorless only when it sign-extends the retained word, the bottom slice is discarded into a bounded one-sided error"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=0.92cm,y=1cm,font=\footnotesize]

% ---------- input word: sfix(7,-8), 16 cells, position 7 at the left ----------
\foreach \p/\j in {7/0,6/1,5/2,4/3} {
  \draw[fill=red!22] (\j,2.1) rectangle ++(1,0.55);
  \node at ({\j+0.5},2.375) {$x_{\p}$};
}
\foreach \p/\j in {3/4,2/5,1/6,0/7,-1/8,-2/9,-3/10,-4/11} {
  \draw[fill=green!14] (\j,2.1) rectangle ++(1,0.55);
  \node at ({\j+0.5},2.375) {$x_{\p}$};
}
\foreach \p/\j in {-5/12,-6/13,-7/14,-8/15} {
  \draw[fill=blue!12] (\j,2.1) rectangle ++(1,0.55);
  \node at ({\j+0.5},2.375) {$x_{\p}$};
}
\draw[gray!55,dashed] (8,1.55) -- (8,3.35);

% ---------- position axis of the input ----------
\foreach \p/\j in {7/0,6/1,5/2,4/3,3/4,2/5,1/6,0/7,-1/8,-2/9,-3/10,-4/11,-5/12,-6/13,-7/14,-8/15}
  \node at ({\j+0.5},1.78) {$\p$};
\node[left] at (-0.15,2.375) {$\mathrm{sfix}(7,-8)$, $w=16$};
\node[left] at (-0.15,1.78) {position $i$};

% ---------- the MSB test spans the 4 dropped bits AND the new sign bit ----------
\draw[|<->|,red!55!black] (0,3.02) -- (5,3.02);
\node[red!55!black] at (2.5,3.36) {$x_7=x_6=x_5=x_4=x_3$, or the value overflows};

% ---------- output word: sfix(3,-4), aligned under what it keeps ----------
\draw[fill=red!22] (4,0.45) rectangle ++(1,0.55);
\node at (4.5,0.725) {$y_{3}$};
\foreach \p/\j in {2/5,1/6,0/7,-1/8,-2/9,-3/10,-4/11} {
  \draw[fill=green!14] (\j,0.45) rectangle ++(1,0.55);
  \node at ({\j+0.5},0.725) {$y_{\p}$};
}
\node[left] at (3.85,0.725) {$\mathrm{sfix}(3,-4)$, $w'=8$};
\node[red!55!black] at (4.5,0.05) {$-2^{3}$};

% ---------- the two losses ----------
\node[red!55!black] at (2.0,1.34) {discarded at the MSB: \emph{overflow}};
\node[blue!45!black] at (14.0,1.34) {discarded at the LSB: \emph{rounding}};

\draw[|<->|,blue!45!black] (12,-0.12) -- (16,-0.12);
\node[blue!45!black] at (14,-0.58) {$\varepsilon=\sum_{i=-8}^{-5}2^{i}x_i\in[0,\,2^{-4})$, never negative};

\node[anchor=west] at (16.25,2.375) {$\mathrm{ulp}=2^{-8}$};
\node[anchor=west] at (16.25,0.725) {$\mathrm{ulp}'=2^{-4}$};
\node at (8,-0.85) {binary point at $i=0\,|\,i=-1$};

\end{circuitikz}
\end{document}
```

**Narrowing is forced on you, not chosen.** Exact arithmetic grows words without bound: the product of two $w$-bit numbers occupies $2w$ bits, a sum of $n$ terms occupies $\lceil\log_2 n\rceil$ extra bits, and $\ln 2$ occupies infinitely many because it is irrational. A datapath of finite width must therefore discard bits somewhere, and the only question is *which* bits and *with what consequence* (p. 42). The two ends of the format are governed by different parameters — $m$ sets range, $\ell$ sets accuracy ([[Signed Fixed-Point Format]]) — so discarding at one end has nothing in common with discarding at the other.

**Split the value at the two cut points and the two failure modes fall out algebraically.** Take $X\in\mathrm{sfix}(m,\ell)$, $w=m-\ell+1$ bits, and read out the window $\ell'\dots m'$ as a word $Y\in\mathrm{sfix}(m',\ell')$ of $w'=m'-\ell'+1$ bits. Starting from the signed weight equation $X=-2^{m}x_{m}+\sum_{i=\ell}^{m-1}2^{i}x_{i}$ (2.8, p. 41), separate the three ranges of positions and use $+2^{m'}x_{m'}=-2^{m'}x_{m'}+2^{m'+1}x_{m'}$ to convert the retained window's own MSB into a sign bit:

$$X\;=\;\underbrace{2^{m'+1}K}_{\text{high slice}}\;+\;\underbrace{Y}_{\text{kept}}\;+\;\underbrace{\varepsilon}_{\text{low slice}},\qquad \varepsilon=\sum_{i=\ell}^{\ell'-1}2^{i}x_{i},\qquad K=-2^{\,m-m'-1}x_{m}+\sum_{i=m'+1}^{m-1}2^{\,i-m'-1}x_{i}+x_{m'}$$

$K$ is an integer because every term of the high slice is a multiple of $2^{m'+1}$. So the conversion is errorless exactly when $K=0$ **and** $\varepsilon=0$, and those two conditions are independent: one is about the top of the word, the other about the bottom.

**Narrowing at the MSB is errorless precisely when the discarded bits were a sign extension.** $K=0$ holds in two cases, and only two. If $x_m=\dots=x_{m'}=0$ every term vanishes. If $x_m=\dots=x_{m'}=1$, the geometric sum $\sum_{j=0}^{m-m'-2}2^{j}=2^{\,m-m'-1}-1$ gives $K=-2^{\,m-m'-1}+(2^{\,m-m'-1}-1)+1=0$. That is the *same* identity that makes [[Sign Extension]] free, run backwards: widening replicates $x_{m'}$ upward, narrowing is legal only if it finds those replicas still there. Anything else leaves $K\neq0$, and then the error $2^{m'+1}K$ is at least $2^{m'+1}$ — one full output range. The wrapped result is $X$ reduced modulo $2^{m'+1}$ into $[-2^{m'},2^{m'})$, so a large positive input can emerge as a large negative output: not merely inaccurate, but wrong in sign and in order of magnitude (p. 43). This is **overflow**, and the book's standing instruction is that it is to be avoided rather than measured.

**The discipline that avoids it is a worst-case bound on $m$, tightened by context.** Every fixed-point operator chapter of the book opens the same way: derive the smallest output MSB position $m$ that provably cannot overflow *for any input*, given the input formats. That generic bound treats the operator in isolation. In practice the surrounding application supplies more — a mathematical bound on the quantity being computed, a correlation between the operator's inputs, a physically limited sensor range — and licenses a smaller, cheaper $m$ than the isolated analysis allows (p. 43). Safe MSB narrowing is therefore a *proof obligation discharged at design time*, and the detection hardware below exists only for the cases where the proof cannot be made.

**Narrowing at the LSB is a bounded, one-sided, and therefore biased error.** Dropping positions $\ell\dots\ell'-1$ removes $\varepsilon=\sum_{i=\ell}^{\ell'-1}2^{i}x_{i}$, whose extreme values are $0$ and $2^{\ell'}-2^{\ell}$, so

$$0\;\le\;\varepsilon\;<\;2^{\ell'}=\mathrm{ulp}'$$

The error never exceeds one ulp of the *output* format and never changes the order of magnitude — it is always quantifiable, and by controlling $\ell$ at each intermediate node the accuracy of a whole datapath stays under control ([[Error Accuracy]]). It is also always non-negative, which means plain truncation is *biased*: over a long accumulation the errors do not cancel, they sum. Half-ulp-accurate alternatives — round to nearest, and the cheaper faithful roundings — are the subject of [[Rounding]]; the bound and the composition rules are [[Error Analysis]]. Neither is re-derived here.

> [!important] Truncation of a two's-complement word is $\lfloor\cdot\rfloor$, not truncation toward zero
> $X=2^{\ell'}\lfloor X/2^{\ell'}\rfloor+\varepsilon$ with $\varepsilon\ge0$ holds for negative $X$ as well, because dropping low bits leaves the sign bit's weight untouched. Narrowing $X=-2^{-8}$ from $\mathrm{sfix}(7,-8)$ to $\mathrm{sfix}(3,-4)$: the word is all ones, the retained window is all ones, and the result is $-2^{-4}$ — sixteen times further from zero, not nearer, and not $0$. This is C's `>>` on a signed integer, not C's `/`, and a reference model written with integer division will disagree with the hardware on exactly half the number line.

**$\ell$ is the cursor of the area-versus-accuracy trade, and it is the only knob that is continuous.** Width is $w=m-\ell+1$; $m$ is pinned by the overflow proof, so $\ell$ is what the designer actually moves. Raising $\ell$ by one bit removes one bit from every downstream operator: linear savings in an adder, roughly quadratic in a multiplier, and exponential in a lookup table addressed by the value. The last two are why the trade is worth making at all, and why the aggressive version — never *building* the partial products that would land below $\ell'$ — gets its own operator in [[Truncated Multipliers]].

**In hardware the two narrowings cost nothing alike.** LSB narrowing by truncation is *free*: the discarded bits are simply not routed, no gate, no delay, and the saving is in the operators upstream that no longer have to produce them. MSB narrowing is free too **when the no-overflow proof exists** — again just unrouted wires. When it does not, the guard costs an all-equal test over the $m-m'+1$ bits $x_m\dots x_{m'}$, which is one OR tree and one AND tree of that width, $O(\log)$ depth; saturation adds one 2-input multiplexer per output bit, $w'$ of them, all driven by the same one-bit select. On an FPGA the test is nearly invisible — a 6-input LUT swallows a 6-bit all-equal check in a single level, and the saturation multiplexer folds into the LUT that was already computing each output bit, so a $w'$-bit saturating narrow often costs zero extra logic levels ([[FPGAs]]). On an ASIC the same structure is a real gate tree in series with the mux, and it lands on the critical path of whatever produced $X$ — which is the practical reason designers work hard to discharge the proof instead.

$$\boxed{\ X=2^{m'+1}K+Y+\varepsilon,\qquad \varepsilon\in[0,2^{\ell'}),\qquad K=0\iff x_m=\dots=x_{m'}\ }$$

**When it breaks.**

- **Saturation is not the arithmetically correct answer, it is the least-bad one.** Clamping to $\pm$ the format extremes bounds the error by the whole output range instead of leaving it unbounded; that is an improvement in a control loop or an audio path, and no improvement at all in an address calculation, where the right response is an exception.
- **The asymmetric range bites at the negative extreme.** $\mathrm{sfix}(m',\ell')$ reaches $-2^{m'}$ but only $2^{m'}-2^{\ell'}$, so the positive saturation constant is not the negation of the negative one, and a saturating narrow followed by a negation can itself overflow ([[Two's Complement Negator]]).
- **Truncation bias accumulates linearly, error magnitude does not.** $n$ truncations contribute up to $n\cdot 2^{\ell'}$ of systematic drift while a round-to-nearest datapath contributes $O(\sqrt{n})$ of noise. Below a handful of stages nobody notices; in a long IIR filter or an integrator the bias is the dominant error term and truncation must be replaced.
- **The unsigned case has no all-equal test.** For $\mathrm{ufix}$, $K=0$ reduces to $x_m=\dots=x_{m'+1}=0$ — the retained MSB is not part of the test, and reusing the signed detector on unsigned data reports overflow on every value with its top retained bit set.
- **$m'\ge\ell'$ must still hold.** Narrow both ends far enough and the formats cross; a zero-width format is not a value, it is a bug in the width propagation.
- **A conversion may narrow at one end and widen at the other.** $m'<m$ with $\ell'<\ell$ is legal and common after a multiplication; only the MSB side is lossy, and code that treats "narrowing" as a single predicate on total width gets this wrong.

**RTL (Spade).**

```spade
/// Narrowing conversion sfix(7,-8) -> sfix(3,-4), 16 bits down to 8, with
/// truncation at the LSB and saturating overflow detection at the MSB.
/// Bit index j of the input carries position j-8; index k of the output, k-4.
fn narrow_sfix(x: int<16>) -> (int<8>, bool) {
    let b = x.as_bits();
    // positions m=7 down to m'=3, i.e. indices 15..11: the four dropped bits
    // plus the new sign bit. K = 0 exactly when all five agree.
    let top: [bool; 5] = b[11..16];
    let ovf = top.reduce_or() && !top.reduce_and();
    let wrapped: int<8> = b[4..12].as_int();
    let sat: int<8> = if x.sign_bit() { -128 } else { 127 };
    (if ovf { sat } else { wrapped }, ovf)
}
```

`b[4..12]` is the green window of the diagram — indices $4\dots11$, positions $-4\dots3$, so the whole LSB narrowing is a slice and costs nothing. `b[11..16]` deliberately *overlaps* it by one bit: index 11 is the retained sign bit $y_3$, and the all-equal test must include it, which is why the detector is $m-m'+1=5$ bits wide and not $4$. `reduce_or && !reduce_and` is "not all zeros and not all ones"; `as_int` reinterprets the 8-bit window without changing a wire. All of it is a `fn`, hence purely combinational — no `reg`, no `inst`. What synthesis does differently from the drawing: the diagram shows two independent slices, but `sat` and `wrapped` both feed one 8-bit multiplexer, so the overflow path adds a mux delay to *every* output bit, including the seven the overflow logic cannot change.

**Related Notes.**

- [[Sign Extension]] – depends-on: the widening direction, whose replicated sign bits are exactly what the MSB test looks for on the way back down.
- [[Rounding]] – extends: what to do at the LSB instead of truncating, once a one-sided error is not good enough.
- [[Error Analysis]] – supports: how the $[0,2^{\ell'})$ bound composes through a datapath into an end-to-end accuracy budget.
- [[Truncated Multipliers]] – extends: LSB narrowing pushed back into the operator, so the discarded bits are never computed at all.
- [[Signed Fixed-Point Format]] – depends-on: the $\mathrm{sfix}(m,\ell)$ weight equation (2.8) that the three-way split is derived from.
- [[Choosing a Number Format]] – compares: when the answer to "this keeps overflowing" is a different format rather than a wider one.

> [!warning] Not covered in the source — needs outside research
> §2.2.4 says MSB narrowing "should be avoided" but gives no cost model for the alternative: no gate count, LUT count or delay figure for overflow detection or saturation logic anywhere in Chapter 2. The gate-tree and LUT reasoning above is structural, derived from the width of the test, not quoted. A real comparison of *detect-and-saturate* against *widen $m$ by one bit* needs synthesis numbers this book does not provide.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §2.2.4 "Conversion to a Narrower Format: Overflow and Rounding", pp. 42–43.
- §2.2.2 "Two's Complement Fixed-Point Binary Representation", p. 41 (eq. 2.8, the asymmetric range $[-2^m,2^m-2^\ell]$).
- §2.2.3 "Conversion to a Wider Format: Sign Extension", p. 42 (the identity $-2^m=-2^{m'}+\sum_{i=m}^{m'-1}2^i$, Fig. 2.8).
- §2.2.1, pp. 39–40 (width $w=m-\ell+1$, ulp $2^\ell$, scaling identity 2.7).
- §2.2.5 "Alternative Notations for Fixed-Point Formats", pp. 43–44 (rounding and overflow behaviour attached to a type in `ap_fixed`/`ac_fixed`).
