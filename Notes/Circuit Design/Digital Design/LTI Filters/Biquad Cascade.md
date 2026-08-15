---
title: Biquad Cascade
description: "Factor the transfer function into second-order sections chained in series; each section's poles are conditioned independently, so coefficient quantisation cannot drag a whole high-order denominator outside the unit circle."
kind: circuit
source: "ASA §23.1.4.3, pp. 674-675; §23.1.7, p. 682; §23.4.1, pp. 696-697"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, quantisation, stability, fpga]
aliases:
  - Cascade of Biquads
  - Cascade Form
  - Second-Order Sections
  - SOS
  - Series Form IIR
---

# Biquad Cascade

An order-$n$ IIR filter realised as $\lceil n/2\rceil$ second-order sections in series rather than as one $n$-th degree difference equation, so that coefficient quantisation perturbs one conjugate pole pair at a time instead of perturbing the roots of a single degree-$n$ polynomial.

```tikz title="Two orderings of the same two-section cascade, with fixed-point formats and the peak gains that the reordering does not preserve"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]

  % ---------------- ordering A : wide section first ----------------
  \node[anchor=west, font=\footnotesize] at (-2.7,3.30) {ordering A};
  \draw[->] (-2.7,2.6) -- (-0.1,2.6);
  \node[anchor=south, font=\tiny] at (-2.1,2.68) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.4,2.52) {sfix$(0,-15)$, 16\,b};

  \draw[fill=black!5] (-0.1,2.25) rectangle (1.9,2.95);
  \node[font=\small] at (0.9,2.74) {$\mathcal{H}_1$};
  \node[font=\tiny] at (0.9,2.44) {poles $r=0.795$};

  \draw[->] (1.9,2.6) -- (3.5,2.6);
  \node[anchor=south, font=\tiny] at (2.7,2.68) {$v(k)$};
  \node[anchor=north, font=\tiny] at (2.7,2.50) {sfix$(\mathbf{1},-20)$};
  \node[anchor=north, font=\tiny] at (2.7,2.22) {22\,b};

  \draw[fill=black!5] (3.5,2.25) rectangle (5.5,2.95);
  \node[font=\small] at (4.5,2.74) {$\mathcal{H}_2$};
  \node[font=\tiny] at (4.5,2.44) {poles $r=0.544$};

  \draw[->] (5.5,2.6) -- (6.5,2.6);
  \draw[fill=black!5] (6.5,2.25) rectangle (7.8,2.95);
  \node[font=\tiny] at (7.15,2.6) {final round};
  \draw[->] (7.8,2.6) -- (9.3,2.6);
  \node[anchor=south, font=\tiny] at (8.55,2.68) {$\widetilde{y}_{\mathrm{out}}(k)$};
  \node[anchor=north, font=\tiny] at (8.55,2.52) {sfix$(1,-15)$};

  % ---------------- the equivalence ----------------
  \node[font=\footnotesize] at (3.4,1.55)
    {$h_1 * h_2 \;=\; h_2 * h_1$ \quad (commutativity of convolution)};

  % ---------------- ordering B : narrow section first ----------------
  \node[anchor=west, font=\footnotesize] at (-2.7,1.20) {ordering B};
  \draw[->] (-2.7,0.5) -- (-0.1,0.5);
  \node[anchor=south, font=\tiny] at (-2.1,0.58) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.4,0.42) {sfix$(0,-15)$, 16\,b};

  \draw[fill=black!5] (-0.1,0.15) rectangle (1.9,0.85);
  \node[font=\small] at (0.9,0.64) {$\mathcal{H}_2$};
  \node[font=\tiny] at (0.9,0.34) {poles $r=0.544$};

  \draw[->] (1.9,0.5) -- (3.5,0.5);
  \node[anchor=south, font=\tiny] at (2.7,0.58) {$v'(k)$};
  \node[anchor=north, font=\tiny] at (2.7,0.40) {sfix$(\mathbf{0},-20)$};
  \node[anchor=north, font=\tiny] at (2.7,0.12) {21\,b};

  \draw[fill=black!5] (3.5,0.15) rectangle (5.5,0.85);
  \node[font=\small] at (4.5,0.64) {$\mathcal{H}_1$};
  \node[font=\tiny] at (4.5,0.34) {poles $r=0.795$};

  \draw[->] (5.5,0.5) -- (6.5,0.5);
  \draw[fill=black!5] (6.5,0.15) rectangle (7.8,0.85);
  \node[font=\tiny] at (7.15,0.5) {final round};
  \draw[->] (7.8,0.5) -- (9.3,0.5);
  \node[anchor=south, font=\tiny] at (8.55,0.58) {$\widetilde{y}_{\mathrm{out}}(k)$};
  \node[anchor=north, font=\tiny] at (8.55,0.42) {sfix$(1,-15)$};

  % ---------------- what the equivalence does not preserve ------
  \node[anchor=west, font=\tiny] at (-2.7,-0.75)
    {A: intermediate peak $1.80$ (MSB $1$),\quad error gain
     $6.03\times 1.00 + 4.05 = 10.07$};
  \node[anchor=west, font=\tiny] at (-2.7,-1.15)
    {B: intermediate peak $1.00$ (MSB $0$),\quad error gain
     $4.05\times 1.80 + 6.03 = 13.33$};
  \node[anchor=west, font=\tiny] at (-2.7,-1.55)
    {equivalent 4th-order direct form: error gain $18.44$ --- one guard bit more
     than either cascade};

\end{circuitikz}
\end{document}
```

*after Fig. 23.4, p. 674 — the book draws the equivalence abstractly, for two unnamed impulse responses; the formats and the peak gains are the running 4th-order Butterworth example below.*

**Two is the smallest real factor that isolates a pole.** The transfer function (23.19) of a real-coefficient filter is a ratio of real polynomials in $z^{-1}$, so its roots are real or come in conjugate pairs. Multiplying a conjugate pair back together, $(1-pz^{-1})(1-\bar{p}z^{-1}) = 1 - 2\Re(p)z^{-1} + |p|^2z^{-2}$, gives a **real** quadratic; a single complex root does not. A first-order section would therefore need complex arithmetic for anything but a real pole, and a third-order section would bundle a conjugate pair with a spare real root for no benefit. Grouping the $n$ poles into $\lceil n/2\rceil$ conjugate pairs and the $m$ zeros likewise, and pulling the leading scale factor out as one gain $g$, factors $H$ into second-order sections — *biquads*, because numerator and denominator are both quadratic.

**Cascading is legal because convolution is associative and commutative.** A series chain of filters convolves their impulse responses, $y = h_2 \circledast (h_1 \circledast u) = (h_1\circledast h_2)\circledast u$, and $h_1\circledast h_2 = h_2\circledast h_1$ (p. 674). Fig. 23.4 draws exactly this: two sections in either order, and their product as one block, are three mathematically equal filters. In the $z$ domain it is the trivial statement that a product of rational functions may be regrouped and reordered. The catch is stated on the same page: **these identities hold for the ideal filters and not for the circuits**, because rounded addition and multiplication are not linear. The equality picks out a family of implementations; which member you build is an arithmetic decision, and the rest of this note is that decision.

**Quantise a quadratic and the pole barely moves.** Write the denominator monically in $z$, $D(z)=z^n+a_1z^{n-1}+\dots+a_n$, with roots $p_k$. Implicit differentiation of $D(p_k)=0$ with respect to one coefficient — the chain rule, then divide by $D'(p_k)$, which is nonzero for simple roots — gives Kaiser's root sensitivity

$$\frac{\partial p_k}{\partial a_i} \;=\; -\frac{p_k^{\,n-i}}{D'(p_k)} \;=\; -\frac{p_k^{\,n-i}}{\prod_{j\ne k}(p_k-p_j)} .$$

The whole hazard lives in that denominator: it is a product of $n-1$ pole *differences*, and a filter with a sharp transition band has clustered poles, so several of those differences are small and their product is smaller still. Cut the same filter into biquads and $n=2$ for every section, leaving a single factor $p_k - \bar{p}_k = 2j\,r\sin\theta$ for a pole at $re^{j\theta}$, hence $|\partial p/\partial a_1| = 1/(2\sin\theta)$ and $|\partial p/\partial a_2| = 1/(2r\sin\theta)$ — bounded by the section's own pole angle and nothing else. For the running example, a 4th-order Butterworth low-pass at $f_c = 0.1f_s$, the poles are $0.795e^{\pm j0.591}$ and $0.544e^{\pm j0.269}$; as one 4th-order denominator the worst sensitivity is $\max_i|\partial p_k/\partial a_i| = 17.47$, and as two biquads it is $3.46$. **Five times less pole motion for the same coefficient rounding, with no change to the ideal filter at all.**

**Each section carries a stability certificate you can check by hand.** For a monic quadratic $z^2+a_1z+a_2$, the product of the roots is $a_2$, so $|a_2|<1$ is necessary for both roots to be inside the unit circle. It is also, together with $|a_1|<1+a_2$, sufficient: $a_2<1$ forces any complex pair to have $r=\sqrt{a_2}<1$, and for a real pair the two conditions are exactly $D(1)>0$ and $D(-1)>0$ with the parabola's minimum inside $[-1,1]$, so no real root escapes. That pair of inequalities is a triangle in the $(a_1,a_2)$ plane, and **quantised coefficients either lie in it or they do not** — a two-line test per section, run on integers, no root-finding. The equivalent test on a degree-$n$ denominator is the full Schur–Cohn recursion, whose intermediate quantities are themselves ill-conditioned for the clustered poles that made you worry in the first place. Here: section 1 has $\hat{a}_2 = 648/1024 = 0.633 < 1$ and $|\hat{a}_1| = 1.321 < 1.633$; section 2 has $0.296 < 1$ and $1.049 < 1.296$. Both inside, so the quantised cascade is stable by inspection.

**The feedback amplification splits into a sum instead of a product.** [[Error Analysis]] establishes that a rounding error $\delta_{\text{r}}$ injected in the loop of a direct form emerges amplified by the worst-case peak gain of the *error filter* $\mathcal{H}_\delta(z)=1/(1+\sum a_iz^{-i})$ — the filter with its numerator deleted (23.33) — and that faithfulness therefore costs $1+\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$ guard bits (23.37). Apply that section by section. An error born in section $s$ is amplified by that section's own error filter $1/A_s$, and then travels through the sections downstream of it, which together form an LTI filter of peak gain $\langle\!\langle\mathcal{H}_{s+1..S}\rangle\!\rangle$; summing the contributions with (23.23),

$$\overline{\delta_{\text{t}}} \;\le\; \sum_{s=1}^{S}\Big\langle\!\Big\langle\tfrac{1}{A_s}\Big\rangle\!\Big\rangle\,\big\langle\!\big\langle\mathcal{H}_{s+1..S}\big\rangle\!\big\rangle\;\overline{\delta_{\text{r},s}} .$$

The direct form's single factor $\langle\!\langle 1/(A_1A_2\cdots)\rangle\!\rangle$ is a WCPG of a *product* of near-unit-circle denominators; the cascade's is a *sum* of WCPGs of individual ones. For the Butterworth example, $\langle\!\langle 1/A_1\rangle\!\rangle = 6.03$, $\langle\!\langle 1/A_2\rangle\!\rangle = 4.05$, $\langle\!\langle\mathcal{H}_2\rangle\!\rangle = 1.00$, so the cascade totals $6.03\times1.00+4.05 = 10.07$ against $\langle\!\langle 1/(A_1A_2)\rangle\!\rangle = 18.44$ for the direct form: $\lceil\log_2\rceil$ drops from $5$ to $4$, one guard bit saved on every word in the datapath.

> [!warning] The chapter derives (23.37) for a direct form only — the cascade composition above is not in the book
> §23.3 constructs its guard-bit rule for the single SOPC of Fig. 23.17, and the state-of-the-art table (p. 697) records that the Q+I step is solved "only [for] direct form I". The sum above follows from applying (23.23) and (23.34) to each section, which is legitimate, but a *tight* rule would also allocate the total budget $2^{\ell'-1}$ across the $S$ sections rather than assuming each gets the same $\overline{\delta_{\text{r},s}}$. Split it evenly and you lose $\lceil\log_2 S\rceil$ bits back; split it in proportion to each section's amplification and you do better. FloPoCo does not generate cascades, so there is no reference implementation to compare against.

**Reordering is free on paper and is not free in bits.** Both orderings of the diagram compute the same LTI filter, yet the *intermediate* signal differs. Ordering A puts the resonant section first, so the wire between sections carries a signal of peak $\langle\!\langle\mathcal{H}_1\rangle\!\rangle = 1.80$, needing MSB $m=1$; ordering B puts the tame section first and that wire peaks at $0.998$, MSB $m=0$ — **one bit narrower for the whole intermediate word and every multiplier fed by it**. The error gain moves the other way, $4.05\times1.80+6.03 = 13.33$ instead of $10.07$, which at these coefficient values still rounds up to the same 4-bit shift and so costs nothing; at slightly different coefficients it would cost a guard bit and the trade would reverse. With $S$ sections there are $S!$ orderings and, independently, $S!$ ways of pairing the numerator's zero pairs with the denominator's pole pairs — pair a pole with a nearby zero and that section's peak gain collapses, pair it with a distant one and the section is a resonator. This is a combinatorial optimisation over a cost model, which is exactly the shape of problem [[ILP for Arithmetic Design]] handles for coefficients; the chapter names filter structure as one of its performance parameters and cascades as one of the choices (p. 696), but stops there.

**The multipliers come out even once the gains are collected.** A section has five coefficients $b_0,b_1,b_2,a_1,a_2$, so a naive cascade of $S=\lceil n/2\rceil$ sections costs $5\lceil n/2\rceil$ constant multiplications against $n+m+1$ for the direct form — for $n=m$, $2.5n$ against $2n+1$, seemingly worse. But $b_0$ of every section is a free scale factor: divide the section's numerator by $b_0$ and multiply the cascade's single gain $g$ by it. That is one multiplier saved per section and one added globally, $4\lceil n/2\rceil + 1 = 2n+1$ for even $n$ — **the same count as the direct form**. Registers match too, $2$ per section against $\max(n,m)$ for a shared-delay-line direct form II. What the cascade genuinely costs is the critical path, $S$ multiply–add pairs in series rather than one multiply and one adder chain; the compensation is that a cascade has $S-1$ natural register boundaries, and inserting a pipeline register on each intermediate wire costs one word of state and one cycle of latency while cutting the path back to a single section, without touching any feedback loop.

For FPGA the section boundary is the right granularity for a different reason: a biquad's five constants are a small [[Multiplication by Constants|multiple-constant-multiplication]] instance with its own subexpression sharing, and the sections are independent, so a generator can map each one to whichever of DSP blocks or LUT-based shift-and-add is cheaper on the device at hand — see [[FPGAs]]. The direct form offers one large MCM instead, where more sharing is available in principle but a single overflowing DSP allocation has no local fallback.

$$\boxed{\ H(z) \;=\; g\prod_{s=1}^{S}\frac{1+\beta_{1s}z^{-1}+\beta_{2s}z^{-2}}{1+a_{1s}z^{-1}+a_{2s}z^{-2}},\qquad S=\lceil n/2\rceil\ }$$

$$2n+1 \text{ constant multiplications},\quad n \text{ registers},\quad
\overline{\delta_{\text{t}}}\le\sum_{s}\Big\langle\!\Big\langle\tfrac{1}{A_s}\Big\rangle\!\Big\rangle\big\langle\!\big\langle\mathcal{H}_{s+1..S}\big\rangle\!\big\rangle\,\overline{\delta_{\text{r},s}}$$

**When it breaks.**

- Odd $n$ leaves one first-order section ($a_2=0$, $\beta_2=0$), which occupies a full section slot unless the generator special-cases it. The same happens to a numerator of lower degree than the denominator.
- The factorisation needs the roots, and root-finding on a degree-$n$ polynomial with clustered roots is the very ill-conditioned computation the structure exists to avoid. It is tolerable only because it happens **once, offline, in software**, where you can spend hundreds of bits of precision — the same "compute the hard thing at design time" move as computing a safe WCPG bound.
- Section ordering and pole–zero pairing are unfixed by the mathematics and matter by whole bits. A cascade shipped without an explicit scaling analysis at every intermediate node is one loud input away from an overflow the direct form would not have had.
- Each section is a small feedback loop with its own limit cycle. A cycle in section $s$ is a *legitimate input* to section $s+1$ and gets its peak gain applied to it — a per-section faithfulness argument bounds this, an ad-hoc width choice does not.
- For FIR ($a_i=0$) the factorisation is still legal — the numerator is a polynomial and factors — but pointless: there are no poles to condition, $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1$ either way, and splitting one MCM into $S$ small ones destroys the subexpression sharing that made [[Minimum-Adder FIR Filter|the adder count]] small.
- At $n=2$ the cascade *is* a [[Biquad Section]] and every claim here degenerates to an identity. The structure only starts paying at $n\ge4$.

**RTL (Spade).** Two direct-form II sections chained, coefficients as Q10 12-bit constants, internal format `sfix(3,-20)` in an `int<24>` word.

```spade
/// Multiply a Q10 coefficient by a sfix(3,-20) datapath word, truncating
/// back to the datapath format.  ce*v is exact (48 bits); >>> 10 undoes the
/// coefficient scale; trunc keeps the low 24 bits, i.e. computes modulo 2^m'.
fn q10(c: int<12>, v: int<24>) -> int<24> {
    let ce: int<24> = sext(c);
    trunc((ce * v) >>> 10)
}

/// One direct-form II second-order section.
/// t(k) = x(k) - a1 t(k-1) - a2 t(k-2)      (recursive part, the two poles)
/// y(k) = b0 t(k) + b1 t(k-1) + b2 t(k-2)   (non-recursive part, the two zeros)
entity biquad(clk: clock, rst: bool, x: int<24>,
              b0: int<12>, b1: int<12>, b2: int<12>,
              a1: int<12>, a2: int<12>) -> int<24> {
    decl t;
    reg(clk) t1: int<24> reset(rst: 0) = t;
    reg(clk) t2: int<24> reset(rst: 0) = t1;
    let t: int<24> = x -. q10(a1, t1) -. q10(a2, t2);
    q10(b0, t) +. q10(b1, t1) +. q10(b2, t2)
}

/// 4th-order Butterworth low-pass, f_c = 0.1 f_s, as two cascaded sections.
entity biquad_cascade2(clk: clock, rst: bool, u: int<16>) -> int<24> {
    let x: int<24> = sext::<16, 24>(u) << 5;
    let v = inst biquad(clk, rst, x,  80, 160,  80, -1353, 648);
    inst biquad(clk, rst, v,  63, 126,  63, -1074, 303)
}
```

`v` is the wire between the two boxes of the diagram, ordering A. The `<< 5` is the format change and nothing else: it aligns the input's $\ell=-15$ onto the internal $\ell_{\text{ext}}=-20$, five guard bits, one more than the four the sum rule above demands. Each section's `t1`/`t2` are the two shared delay registers, so the whole cascade holds $4=n$ words of state; everything between the registers is combinational, and the critical path really is two multipliers and four adders deep — the diagram's box boundary is not a register unless you put one there. Every addition is the truncating `+.`/`-.`, keeping 24 bits: widening `+` would grow the word by one bit per term and never typecheck, and the modular wrap it implies is the fixed-point-is-modulo-$2^{m'}$ argument of p. 691. Synthesis will not build ten multipliers — the coefficients are constants, so each `q10` collapses into a shift-and-add graph, and the `>>> 10` disappears into the wiring.

Verified by simulation: 3285 vectors — impulse, a burst of three $+1$ samples followed by a single $-32768$ (asymmetric, so a swapped $b_1/b_2$ or a swapped $t_1/t_2$ cannot hide), a step with an abrupt release, and 3000 random samples — all bit-exact against an independently written behavioural model of the same integer recurrence. Swapping $b_1$ and $b_2$ in section 2 produces 3197 mismatches, which is the check that the check works.

**Related notes.**

- [[Biquad Section]] – depends-on: the single section this note chains; its five coefficients and two registers are the unit of cost counted here.
- [[Direct Form II IIR Filter]] – compares: the same $n$-th order filter as one difference equation, with the $17.47$-versus-$3.46$ pole sensitivity and one extra guard bit.
- [[Transposed Direct Form II IIR Filter]] – compares: the structure that wins *inside* each section, since the $b_i$ then multiply the narrow section input rather than the wide recursive node.
- [[Choosing a Filter Structure]] – compares: where the cascade sits against every other realisation of the same transfer function.
- [[Additive Synthesis Filter Bank]] – counter-example: the same biquads wired in parallel and summed, which is the distributivity of convolution rather than its associativity, and which does not compound peak gains.
- [[Error Analysis]] – depends-on: the WCPG error filter and the guard-bit rule (23.37) that this note applies once per section instead of once per filter.
- [[Error Accuracy]] – supports: the faithfulness definition that makes "how many guard bits" a well-posed question at all.
- [[ILP for Arithmetic Design]] – extends: section ordering, pole–zero pairing and per-section coefficient widths are integer variables in the same optimisation that picks the adder graph.
- [[Multiplication by Constants]] – supports: each section's five constants are a small MCM instance, and the sections do not share subexpressions with each other.
- [[Number Formats]] – supports: the `sfix(m, ℓ)` notation and the ulp arithmetic used throughout the width discussion.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), §23.1.4.3, pp. 674-675 — commutativity, associativity and distributivity of convolution; Fig. 23.4 (the three equivalent cascades) and Fig. 23.5; the warning that finite-precision hardware breaks these identities and that limit cycles follow.
- §23.1.6, pp. 679-681 — direct form II, the shared delay line, and the multiplier-width argument that carries over to each section.
- §23.1.7, p. 682 — biquads as the natural unit of a physics-derived filter (Fig. 23.12, there wired in parallel).
- §23.1.9, p. 685 — quantising coefficients afterwards can break the frequency specification or the stability, because interesting IIR poles sit close to the unit circle.
- §23.3.2-23.3.5, pp. 690-694 — the `sfix` interface and (23.24); the error decomposition; the error filter (23.33), the WCPG amplification (23.34) and the guard-bit count (23.37) that this note composes across sections; the fixed-point-modulo argument for internal overflows, p. 691.
- §23.4.1, pp. 696-697 — filter structure, including cascades, as a performance parameter of the joint FD+Q+I optimisation; the state-of-the-art table recording that Q+I is solved for direct form I only.
- Root sensitivity $\partial p_k/\partial a_i = -p_k^{n-i}/\prod_{j\ne k}(p_k-p_j)$ and the order-2 stability triangle are standard results not given in Ch. 23; both are derived in full above.
