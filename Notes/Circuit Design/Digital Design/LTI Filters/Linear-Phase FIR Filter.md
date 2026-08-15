---
title: "Linear-Phase FIR Filter"
description: "Symmetric (or antisymmetric) coefficients let taps be pre-added in pairs, halving the multiplications and making the zero-phase response real-valued — the property that lets a frequency mask enter a linear program at all."
kind: circuit
source: "ASA §23.4.4, pp. 698-702"
status: seed
spade: simulated
tags: [digital, lti-filters, fir, linear-phase, ilp, mcm]
aliases:
  - Linear Phase FIR Filter
  - Linear-Phase FIR
  - Linear-Phase FIR Filters
  - Symmetric FIR Filter
  - Folded FIR Filter
  - Zero-Phase Frequency Response
---

# Linear-Phase FIR Filter

A FIR filter whose impulse response is its own mirror image, $h_i=\pm h_{n-i}$ — a constraint that simultaneously fixes the group delay at exactly $n/2$ samples, halves the multiplier count, and makes the frequency response real-valued so a frequency mask becomes a set of *linear* inequalities.

```tikz title="Folded order-6 linear-phase FIR: symmetric taps pre-added in pairs before three constant multipliers"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- clock spine ----
  \draw[->] (-1.7,4.85) -- (8.6,4.85);
  \node[anchor=south, font=\tiny] at (-1.35,4.90) {$clk$};
  \foreach \x in {0.75,2.25,3.75,5.25,6.75,8.25} {
    \fill (\x,4.85) circle (0.04);
    \draw[->] (\x,4.85) -- (\x,4.26);
  }

  % ---- tapped delay line ----
  \draw[->] (-1.7,4.0) -- (9.35,4.0);
  \node[anchor=south, font=\tiny] at (-1.30,4.06) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.30,3.94) {$8$};
  \foreach \x in {0.75,2.25,3.75,5.25,6.75,8.25} {
    \draw[fill=black!10] (\x-0.30,3.70) rectangle (\x+0.30,4.30);
    \node[font=\tiny] at (\x,4.0) {$z^{-1}$};
  }
  \foreach \x in {0,1.5,3,4.5,6,7.5,9} \fill (\x,4.0) circle (0.05);
  \node[font=\tiny, anchor=south] at (0,4.36) {$t_0$};
  \node[font=\tiny, anchor=south] at (1.5,4.36) {$t_1$};
  \node[font=\tiny, anchor=south] at (3,4.36) {$t_2$};
  \node[font=\tiny, anchor=south] at (4.5,4.36) {$t_3$};
  \node[font=\tiny, anchor=south] at (6,4.36) {$t_4$};
  \node[font=\tiny, anchor=south] at (7.5,4.36) {$t_5$};
  \node[font=\tiny, anchor=south] at (9,4.36) {$t_6$};

  % ---- pre-adders (the fold) ----
  \node[circle, draw, inner sep=1.1pt, font=\tiny] (A0) at (0.9,2.6) {$+$};
  \node[circle, draw, inner sep=1.1pt, font=\tiny] (A2) at (3.9,2.6) {$+$};

  \draw (0,4.0) -- (0,2.6) -- (A0.west);
  \draw (9,4.0) -- (9,3.32) -- (0.9,3.32) -- (A0.north);
  \draw (3,4.0) -- (3,2.6) -- (A2.west);
  \draw (6,4.0) -- (6,3.0) -- (3.9,3.0) -- (A2.north);
  \draw (4.5,4.0) -- (4.5,2.05) -- (5.3,2.05) -- (5.3,1.96);

  % dropped pairs
  \node[font=\tiny, anchor=north] at (1.5,3.62) {$c_1{=}0$};
  \node[font=\tiny, anchor=north] at (7.5,3.62) {$c_5{=}0$};

  % ---- constant multipliers ----
  \draw[fill=black!4] (0.9-0.42,1.42) rectangle (0.9+0.42,1.96);
  \node[font=\tiny] at (0.9,1.69) {$\times(-3)$};
  \draw[fill=black!4] (3.9-0.36,1.42) rectangle (3.9+0.36,1.96);
  \node[font=\tiny] at (3.9,1.69) {$\times 19$};
  \draw[fill=black!4] (5.3-0.44,1.42) rectangle (5.3+0.44,1.96);
  \node[font=\tiny] at (5.3,1.69) {$\ll 5$};

  \draw (A0.south) -- (0.9,1.96);
  \draw (A2.south) -- (3.9,1.96);

  \node[font=\tiny, anchor=west] at (0.98,2.22) {$9$};
  \node[font=\tiny, anchor=west] at (3.98,2.22) {$9$};
  \node[font=\tiny, anchor=west] at (4.58,2.32) {$8$};

  % ---- structural adder chain ----
  \node[circle, draw, inner sep=1.1pt, font=\tiny] (S1) at (2.4,0.72) {$+$};
  \node[circle, draw, inner sep=1.1pt, font=\tiny] (S2) at (5.3,-0.10) {$+$};

  \draw (0.9,1.42) -- (0.9,0.72) -- (S1.west);
  \draw (3.9,1.42) -- (3.9,0.72) -- (S1.east);
  \draw (S1.south) -- (2.4,-0.10) -- (S2.west);
  \draw (5.3,1.42) -- (S2.north);
  \draw[->] (S2.east) -- (7.4,-0.10);
  \node[anchor=south, font=\tiny] at (6.9,-0.04) {$y(k)$};
  \node[anchor=north, font=\tiny] at (6.9,-0.16) {$15$};
  \node[font=\tiny, anchor=west] at (0.98,1.06) {$18$};
  \node[font=\tiny, anchor=west] at (5.38,0.62) {$18$};

  % ---- annotation ----
  \node[anchor=west, font=\tiny] at (-1.7,-0.95)
    {$n{=}6$, symmetric $h=2^{-6}(-3,0,19,32,19,0,-3)$: $7$ taps $\to$ $4$ distinct coefficients $\to$ $2$ pre-adders,};
  \node[anchor=west, font=\tiny] at (-1.7,-1.32)
    {$2$ nontrivial multipliers ($3{=}2{+}1$, $19{=}16{+}2{+}1$: $3$ MCM adders), $1$ shift, $2$ structural adders.};
\end{circuitikz}
\end{document}
```

*Own construction; the folding is not drawn in the source, whose Fig. 23.22 (p. 701) shows the unfolded MCM-plus-structural-adder form.*

**Turn the mirror symmetry into a real-valued frequency response.** Start from the FIR transfer function on the unit circle, $H(e^{j\omega})=\sum_{i=0}^{n}h_ie^{-j\omega i}$, and take $n$ even with $h_i=h_{n-i}$ (type I). Factor the constant $e^{-j\omega n/2}$ out — legal because $e^{-j\omega i}=e^{-j\omega n/2}e^{j\omega(n/2-i)}$ by the exponent law — and reindex with $m=n/2-i$, which runs over $-n/2,\ldots,n/2$:

$$H(e^{j\omega})=e^{-j\omega n/2}\sum_{m=-n/2}^{n/2}h_{n/2-m}\,e^{j\omega m}$$

The symmetry now reads $h_{n/2-m}=h_{n/2+m}$, so the $+m$ and $-m$ terms carry the *same* coefficient and can be paired. Euler's identity $e^{j\theta}+e^{-j\theta}=2\cos\theta$ collapses each pair:

$$H(e^{j\omega})=e^{-j\omega n/2}\underbrace{\left[h_{n/2}+\sum_{m=1}^{n/2}2h_{n/2-m}\cos(\omega m)\right]}_{H_R(\omega)\ \in\ \mathbb{R}}$$

Everything imaginary cancelled. What is left multiplying the pure delay term is a *real* function of $\omega$ — the **zero-phase frequency response** $H_R$ — which the source writes in the reduced form

$$H_R(\omega)=\sum_{i=0}^{m-1}h_ic_i(\omega),\qquad\omega\in[0,\pi] \tag{23.38}$$

where $m$ is the number of coefficients surviving after identical or negated ones are removed, and $c_i$ is trigonometric. Beware the source's notation: $m$ is both the coefficient *count* in (23.38) and the summation *index* inside Table 23.1.

| Type | Symmetry | $n$ | $m$ | $c_i(\omega)$ |
| --- | --- | --- | --- | --- |
| I | symmetric | even | $\tfrac{n}{2}+1$ | $1$ if $m=0$, else $2\cos(\omega m)$ |
| II | symmetric | odd | $\tfrac{n+1}{2}$ | $2\cos(\omega(m+\tfrac12))$ |
| III | antisymmetric | even | $\tfrac{n}{2}$ | $2\sin(\omega(m-1))$ |
| IV | antisymmetric | odd | $\tfrac{n+1}{2}$ | $2\sin(\omega(m+\tfrac12))$ |

*Table 23.1, p. 699.*

**Read the phase off the factorisation.** $\arg H(e^{j\omega})=-\omega n/2+\arg H_R(\omega)$, and since $H_R$ is real its argument is $0$ or $\pi$. The phase is therefore affine in $\omega$ up to $\pi$ jumps at the sign changes of $H_R$, and the group delay $\tau=-\mathrm{d}(\arg H)/\mathrm{d}\omega=n/2$ samples is **constant at every frequency**. That is the whole functional value of the structure: every spectral component of the input is delayed by the same amount, so pulse shapes survive the filter undistorted. It is also the cost — $n/2$ samples of latency you cannot design away, and half of that is not even an integer number of samples when $n$ is odd. For the antisymmetric types the pairing produces $e^{j\theta}-e^{-j\theta}=2j\sin\theta$ instead, so an extra constant factor $j=e^{j\pi/2}$ appears; the phase gains a fixed $\pi/2$ offset but its *slope* is still $-n/2$, which is why types III and IV are still called linear-phase.

**Fold the datapath by distributivity.** The same identity that made the cosines appear makes multipliers disappear. In

$$y(k)=\sum_{i=0}^{n}h_i\,u(k-i)$$

the terms $i$ and $n-i$ share a coefficient, so by distributivity of multiplication over addition, $a x+a y=a(x+y)$:

$$y(k)=\sum_{i=0}^{n/2-1}h_i\Big[u(k-i)+u(k-n+i)\Big]+h_{n/2}\,u(k-\tfrac n2)$$

The bracket is a **pre-adder**: it runs *before* the constant multiplier rather than after it, and it costs one addition to save one multiplication. Counting the order-$n$ type-I case against the plain [[Direct-Form FIR Filter]]: multipliers drop from $n+1$ to $n/2+1$, the wide product-width [[Adders]] drop from $n$ to $n/2$, and $n/2$ narrow pre-adders appear. The total adder count is unchanged at $n$ — which is why the source counts 24 structural adders for its 25-tap example (12 pre-adders plus 12 summing adders) — but half of them have moved to the narrow side of the multipliers, and *half the multipliers are gone*. The antisymmetric types use a pre-**subtractor** and lose the middle term outright, since $h_{n/2}=-h_{n/2}$ forces $h_{n/2}=0$ for type III.

**State every width, and notice the one bit the fold costs.** With input $u$ on $W$ bits (the source's normalised `sfix(0, ℓ)`, $W=1-\ell$; see [[Number Formats]]), every tap of the [[Tapped Delay Line]] is $W$ bits, because a delay permutes samples in time and touches no bit. The pre-adder output is $W+1$ bits — one bit of growth, exactly as for any two's-complement addition — so the shared multiplier is one bit wider than the two it replaced. With coefficients written as integers $C_i$ on $B$ bits, each product is $W+1+B$ bits and the exact output needs $W+\lceil\log_2\sum_i|C_i|\rceil$ bits, the tight bound rather than the naive product-tree width. The source's optimised example takes 8-bit input and 10-bit coefficients and states the exact output as $8+10=18$ bits (p. 700). Nothing here rounds: this is an exact operator, which is why the filter lands in the near-empty intersection $\mathcal{L}\cap\mathcal{C}$ and why [[Error Accuracy]] has nothing to contribute until an output format is imposed.

**Now the payoff: a real $H_R$ is a linear constraint.** Because $|H(e^{j\omega})|=|H_R(\omega)|$ — the delay factor has unit modulus — a magnitude mask given by a lower bound $\underline{D}$ and an upper bound $\overline{D}$ becomes

$$\underline{D}(\omega)\le H_R(\omega)\le\overline{D}(\omega)\qquad\forall\omega\in[0,\pi] \tag{23.40}$$

and by (23.38) each side is a **linear function of the coefficients**. A general FIR response is complex, and $|H|\le\overline{D}$ on a complex quantity is a quadratic (second-order cone) constraint; linear phase is what removes the modulus and leaves a plain pair of inequalities. Two more steps finish the reduction. First, $\omega$ is continuous, so evaluate on a discrete set $\Omega_d\subset[0,\pi]$; a uniform discretisation of $16m$ points is typically dense enough (p. 699). Second, replace the real coefficients with scaled integers

$$h_m=2^{\ell}C_m \tag{23.41}$$

where $\ell$ is the coefficient LSB, fixed in advance and explored *outside* the program, and $C_m$ is an integer variable. The result is an integer linear program whose variables are the very constants that a [[Multiple Constant Multiplication]] block would multiply by — so it drops directly into the MCM formulation of [[ILP for Arithmetic Design]], with a variable gain and a count of structural adders (zero coefficients cost nothing) available as objective terms.

> [!important] Asking one question instead of three is worth 38 % of the adders
> The classical flow is three separate optimisations — filter design, then quantisation, then implementation — and the I-step result depends strongly and *non-monotonically* on coefficient values that FD and Q have already frozen (p. 697). The source's low-pass example ($\omega_p=0.3\pi$, $\delta_p=0.0157$, $\omega_s=0.5\pi$, $-43.6$ dB): [[Remez Minimax]] followed by quantisation needs 25 coefficients on 12 bits, 11 nontrivial multiplications reducible to 13 MCM adders, plus 24 structural adders — **37 adders**. Solving FD+Q+I jointly as one ILP gives 24 coefficients on 10 bits, 4 MCM adders and 19 structural adders (four saved by zero coefficients) — **23 adders**. Both meet the same mask (Fig. 23.21, p. 700). The saving is not a better multiplier; it is choosing coefficients that were *cheap to multiply by in the first place*.

$$\boxed{\ H(e^{j\omega})=e^{-j\omega n/2}H_R(\omega),\ H_R\in\mathbb{R}\quad\Longleftrightarrow\quad y(k)=\sum_{i=0}^{n/2-1}h_i\big[u(k{-}i)+u(k{-}n{+}i)\big]+h_{n/2}u(k{-}\tfrac n2)\ }$$

with $\lceil (n+1)/2\rceil$ multipliers, $n$ adders of which half are at input width, and group delay $n/2$ samples independent of $\omega$.

**When it breaks.**

- **The symmetry type constrains the mask, not the other way round.** Type II forces $H_R(\pi)=0$, so it cannot be a high-pass; types III and IV force $H_R(0)=0$, so they cannot pass DC, and type III is additionally zero at $\pi$. Picking a type is picking which band edges you are allowed to specify.
- **Quantise the reduced set, not the full one.** The linear-phase property is exact only while $h_i=\pm h_{n-i}$ holds *after* rounding. Round the $n+1$ coefficients independently and the mirror breaks by an ulp, the response acquires a small imaginary part, and the phase stops being linear — quantise the $m$ distinct $C_i$ and mirror afterwards.
- **The mask is only checked at $16m$ points.** Between the samples of $\Omega_d$ the response is unconstrained and can overshoot. The source recommends re-checking the optimisation result with safe arbitrary-precision arithmetic, which also guards against rounding errors inside the FD+Q *software* itself (p. 696).
- **The ILP result is an exact operator with no output format.** 8-bit in, 18-bit out. Rounding it faithfully to 8 bits afterwards is a known recipe, but the circuit can then no longer claim optimality: truncations must live *inside* the MCM problem, which means counting full adders rather than adders, and that single global FD+Q+I formulation "remains to be written" (p. 702).
- **Narrow words make the fold a wash.** The pre-adder buys a multiplier only if the multiplier is expensive. At $W=4$ or $5$, or when every coefficient is a single shift, the extra $W+1$-bit adder and its routing can cost as much as the [[Multipliers]] it eliminates.
- **Latency is structural.** Group delay $n/2$ is not a pipeline choice; it is the price of the mirror. A control loop that cannot tolerate it needs a minimum-phase FIR or an IIR from [[Choosing a Filter Structure]], and gives up constant group delay in exchange.

```spade
entity fir_linphase(clk: clock, rst: bool, u: int<8>) -> int<15> {
    reg(clk) line: [int<8>; 6] reset(rst: [0; 6]) = line.shift_front(u);
    let t: [int<8>; 7] = line.push_front(u);

    // pre-adders: h_i = h_{6-i}, so each pair shares one multiplier
    let p0: int<9> = t[0] + t[6];
    let p2: int<9> = t[2] + t[4];
    let mid: int<9> = sext(t[3]);

    // MCM on the pre-added pairs: c = (-3, 0, 19, 32, 19, 0, -3), h = 2^-6 c
    let q0: int<18> = p0 * (-3);
    let q2: int<18> = p2 * 19;
    let q3: int<18> = sext(mid) << 5;

    let s02: int<18> = trunc(q0 + q2);
    let s: int<18> = trunc(s02 + q3);
    trunc(s)
}
```

`t[i]` is $u(k-i)$, the seven tap dots of the drawing; `p0` and `p2` are the two $\oplus$ pre-adders, `int<8> + int<8>` growing to `int<9>` exactly as the diagram's $8\to9$ annotation says. `mid` is the unpaired centre tap $t_3$, sign-extended only so that its $\ll 5$ shares the product width — the shift *is* the $\times 32$ multiplier, since $32=2^5$ is trivial. The `c_1 = c_5 = 0` pair is absent from the RTL entirely, which is the "structural adders saved by zero coefficients" effect: two pre-adders, not three. Products are `int<18>` because Spade's `*` doubles the operand width; the final `trunc` to `int<15>` discards three bits that are provably sign extension, since $\sum_i|c_i|=76<2^7$ bounds the exact result by $2^{8+7}$ — this is the structural-adder word-size reduction of [Che+17] (p. 697) done by hand. Everything below the register is combinational, so the critical path is pre-adder, multiplier, two adders; synthesis will flatten `p2 * 19` into the shift-and-add $16p_2+2p_2+p_2$ rather than building a multiplier array, and will merge the two structural additions into one compressor tree.

Compiled clean on the first attempt and simulated against a behavioural Verilog reference computing $\sum_i c_i\,u(k-i)$ directly: **3058 vector checks, 0 mismatches** — an asymmetric impulse ($127$ into an empty line), the asymmetric burst $1,-128,3,-1,100$, two opposite-signed step responses, and a 3000-sample random sweep. A negative control that permuted one reference tap produced 2990 mismatches, confirming the vectors actually discriminate tap order.

> [!warning] FPGA mapping of the pre-adder is not covered in the source
> Chapter 23 defers all constant multiplication to Ch. 12 and says nothing about FPGA primitives. The relevant fact from outside the book is that modern DSP slices expose a dedicated pre-adder on one input port precisely to make this fold free, so a folded linear-phase FIR maps to half as many DSP slices as its unfolded twin at no extra fabric cost — but the pre-adder's width is fixed by the vendor and the saving evaporates once $W+1$ exceeds it. See [[DSP Blocks]] and [[FPGAs]]; the exact port widths are device-specific and are not stated here.

**Related Notes**

- [[Direct-Form FIR Filter]] – extends: the unfolded structure this specialises, with $n+1$ multipliers instead of $\lceil(n+1)/2\rceil$.
- [[Tapped Delay Line]] – depends-on: supplies the seven taps that the pre-adders pair up.
- [[Multiple Constant Multiplication]] – supports: the pre-added pairs feed one MCM block whose constants are what the ILP is choosing.
- [[ILP for Arithmetic Design]] – extends: (23.40) and (23.41) drop the frequency mask into the same integer program that picks the adder graph.
- [[Remez Minimax]] – compares: the classical FD step, optimal in coefficient error but blind to adder cost — 37 adders against 23.
- [[Minimum-Adder FIR Filter]] – extends: what the joint FD+Q+I optimisation produces once this note's constraints are in the program.
- [[SOPC, Sum of Products by Constants]] – compares: the general sum-of-products block, with no symmetry to exploit and no pre-adders.
- [[Transposed Direct-Form FIR Filter]] – counter-example: transposition destroys the tap pairing, so linear phase survives but the fold does not.
- [[Choosing a Filter Structure]] – compares: where guaranteed linear phase is worth a much longer impulse response than an IIR.
- [[Number Formats]] – depends-on: the `sfix` notation fixing $W$ on the taps and $W+1$ after the pre-adder.
- [[Error Accuracy]] – compares: this operator is exact, so the error analysis only starts when an output format is imposed.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.5, pp. 676-677 — the non-recursive difference equation (23.14) and the direct form whose multipliers the fold halves.
- §23.1.9, pp. 685-686 — the FD / Q / I flow, and the fact that many coefficient sets satisfy one mask.
- §23.4.2, pp. 696-697 — filter structure as part of the *functional* specification when linear phase is required; frequency constraints embedded into the optimisation; safe re-checking of the ILP result.
- §23.4.3, p. 697 — state of the art; the non-monotonic dependence of I-step cost on coefficients frozen by FD and Q; structural-adder word-size reduction.
- §23.4.4, pp. 698-700 — (23.38)-(23.41), Table 23.1 (p. 699), the $16m$-point discretisation, and the low-pass example with its 37-versus-23 adder comparison (Figs. 23.21, 23.22, pp. 700-701).
- §23.4.4, p. 702 — the exact-datapath caveat, $8+10=18$ bits, and why rounding inside the MCM problem remains unwritten.
