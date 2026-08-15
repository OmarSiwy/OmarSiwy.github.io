---
title: Biquad Section
description: "Second-order IIR section whose two coefficients follow directly from a resonance frequency and a 60 dB decay time; the numerically best-conditioned unit from which larger filters are assembled."
kind: circuit
source: "ASA §23.1.7, pp. 681-682 (Fig. 23.12); §23.3.5, p. 694"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, biquad, resonator, fixed-point]
aliases:
  - Biquad
  - Biquads
  - Biquadratic Section
  - Second-Order Section
  - Second-Order IIR Section
  - SOS
  - Two-Pole Resonator
---

# Biquad Section

The smallest real-coefficient recursion that can ring: a second-order IIR section whose pole radius is *exactly* $\sqrt{a_2}$ and whose pole angle is set by $a_1$ alone, so rounding one coefficient perturbs the decay and rounding the other perturbs the frequency, and neither perturbs both.

```tikz title="Biquad section, direct form I, in the resonator form of the bell model: two input delays, two feedback delays, two constant multipliers and one summation bar, with fixed-point formats on every wire"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---------- forward path: x(k) and its two delays ----------
  \draw[->] (-2.2,3) -- (0,3);
  \node[anchor=south, font=\tiny] at (-1.5,3.08) {$x(k)$};
  \node[anchor=north, font=\tiny] at (-1.5,2.92) {sfix$(0,\ell)$};
  \fill (0,3) circle (0.055);
  \draw[->] (0,3) -- (1.05,3);
  \draw[fill=black!8] (1.05,2.72) rectangle (1.35,3.28);
  \node[font=\tiny] at (1.2,3.0) {$\mathcal{D}$};
  \draw[->] (1.35,3) -- (2.45,3);
  \draw[fill=black!8] (2.45,2.72) rectangle (2.75,3.28);
  \node[font=\tiny] at (2.6,3.0) {$\mathcal{D}$};
  \draw (2.75,3) -- (3.4,3);
  \node[anchor=south, font=\tiny] at (1.9,3.08) {$x(k{-}1)$};
  \node[anchor=north west, font=\tiny] at (3.48,2.94) {$x(k{-}2)$};

  % drops into the summation bar
  \draw[->] (0,3) -- (0,1.14);
  \draw[->] (3.4,3) -- (3.4,1.14);

  % ---------- feedback path: y(k) and its two delays ----------
  \draw (7.6,0.75) -- (8.4,0.75) -- (8.4,3);
  \fill (8.4,3) circle (0.055);
  \draw[->] (8.4,3) -- (9.7,3);
  \node[anchor=south, font=\tiny] at (9.1,3.08) {$y(k)$};
  \node[anchor=north, font=\tiny] at (9.15,2.92) {sfix$(m',\ell_{\text{ext}})$};
  \draw[->] (8.4,3) -- (7.35,3);
  \draw[fill=black!8] (7.05,2.72) rectangle (7.35,3.28);
  \node[font=\tiny] at (7.2,3.0) {$\mathcal{D}$};
  \draw (7.05,3) -- (6.6,3);
  \fill (6.6,3) circle (0.055);
  \draw[->] (6.6,3) -- (5.55,3);
  \draw[fill=black!8] (5.25,2.72) rectangle (5.55,3.28);
  \node[font=\tiny] at (5.4,3.0) {$\mathcal{D}$};
  \draw (5.25,3) -- (4.9,3);
  \node[anchor=south, font=\tiny] at (6.55,3.12) {$y(k{-}1)$};
  \node[anchor=south, font=\tiny] at (4.72,3.12) {$y(k{-}2)$};

  % ---------- the two constant multipliers ----------
  \draw[->] (4.9,3) -- (4.9,2.42);
  \draw[->] (6.6,3) -- (6.6,2.42);
  \draw[fill=black!3] (4.5,2.42) -- (5.3,2.42) -- (4.9,1.72) -- cycle;
  \node[font=\tiny] at (4.9,2.20) {$a_2$};
  \draw[fill=black!3] (6.2,2.42) -- (7.0,2.42) -- (6.6,1.72) -- cycle;
  \node[font=\tiny] at (6.6,2.20) {$a_1$};
  \draw[->] (4.9,1.72) -- (4.9,1.14);
  \draw[->] (6.6,1.72) -- (6.6,1.14);
  \node[anchor=west, font=\tiny] at (7.12,2.05) {sfix$(1,\ell_c)$};

  % ---------- summation bar ----------
  \draw[fill=black!4] (-0.6,0.5) rectangle (7.6,1.0);
  \node[font=\small] at (1.75,0.75) {$\Sigma$};
  \draw[fill=white] (0,1.0) circle (0.15);   \node[font=\scriptsize] at (0,1.0) {$+$};
  \draw[fill=white] (3.4,1.0) circle (0.15); \node[font=\scriptsize] at (3.4,1.0) {$-$};
  \draw[fill=white] (4.9,1.0) circle (0.15); \node[font=\scriptsize] at (4.9,1.0) {$-$};
  \draw[fill=white] (6.6,1.0) circle (0.15); \node[font=\scriptsize] at (6.6,1.0) {$-$};

  % ---------- annotations ----------
  \node[anchor=north, font=\tiny, align=center] at (3.5,0.36)
    {numerator $1-z^{-2}$: two structural adds, no multiplier\quad\textbar\quad denominator $1+a_1z^{-1}+a_2z^{-2}$: the loop};
  \node[anchor=north, font=\tiny, align=center] at (3.5,-0.20)
    {one bit heap, one rounding at the bottom:\quad $\ell_{\text{ext}}=\ell'-1-\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.12 (the inset), p. 682, with the formats of Fig. 23.17, p. 690.*

**Two is the smallest order that can hold a frequency.** A hardware filter has real coefficients, so the denominator $1+a_1z^{-1}+a_2z^{-2}$ is a real polynomial and its roots are either both real or a complex-conjugate pair — the complex-conjugate root theorem, which is just the statement that conjugation is a ring homomorphism fixing $\mathbb{R}$. A first-order section $1+a_1z^{-1}$ has one real root, so its free response is a pure geometric $p^k$: it decays, it never oscillates. Only a conjugate pair $Re^{\pm j\theta}$ produces the free response $R^k\cos(\theta k+\varphi)$, and by the fundamental theorem of algebra a conjugate pair needs a real *quadratic* factor. Degree two is therefore the minimum, and it is also enough: over $\mathbb{R}$ every polynomial factors into linear and quadratic factors, so every real rational $H(z)$ is a product of biquads and at most one first-order section ([[Biquad Cascade]]). The biquad is a basis, not a convenience.

**Read the two coefficients straight off the pole pair.** Expand the factored denominator and match coefficients — an identity of polynomials, valid term by term:

$$
(1-Re^{j\theta}z^{-1})(1-Re^{-j\theta}z^{-1})
= 1-\underbrace{2R\cos\theta}_{-a_1}z^{-1}+\underbrace{R^2}_{a_2}z^{-2}
$$

using $e^{j\theta}+e^{-j\theta}=2\cos\theta$ and $e^{j\theta}e^{-j\theta}=1$. These are Vieta's formulas for a monic quadratic: the product of the roots is $a_2=p\bar p=|p|^2$ and their sum is $-a_1=2\operatorname{Re}p$. Both relations are **exact**, not linearisations, and the pair is genuinely complex exactly when the discriminant is negative, $a_1^2<4a_2$.

**The physical specification $(f,\,T^{60})$ fixes $R$ and $\theta$ with no filter design step in between.** The angle is the position on the unit circle where $z=e^{j\omega}$ evaluates the transfer function at frequency $f$, so $\theta=\omega=2\pi f/f_s$ ([[LTI Filters]]). The radius is the per-sample decay of the envelope $R^k$: a 60 dB decay means the amplitude is multiplied by $10^{-60/20}=10^{-3}$ after $T^{60}f_s$ samples, so $R^{T^{60}f_s}=10^{-3}$ and $R=10^{-3/(T^{60}f_s)}$. Run the book's bell coefficients backwards through this to check it: $a_1=-1.99510896$, $a_2=0.999985754$ give $R=\sqrt{a_2}=0.99999288$ and $\theta=\arccos(1.99510896/2R)=0.069848$ rad, i.e. $f=490.2$ Hz and $T^{60}=22.0$ s at $f_s=44.1$ kHz — the lowest partial of a large bell, ringing for twenty-two seconds, exactly as the additive-synthesis model claims (p. 682, p. 694; [[Additive Synthesis Filter Bank]]).

**Quantising $a_2$ moves the decay and only the decay; quantising $a_1$ moves the frequency and only the frequency.** This is the conditioning argument, and it is stronger than the usual hand-wave. Because $|p|^2=a_2$ *identically*, the pole radius does not depend on $a_1$ at all, so the entire stability question reduces to how finely $a_2$ is stored. Conversely at fixed $a_2$ the radius is pinned, and $a_1$ can only slide the pair around the circle of radius $R$. Compare a direct form of order $n$, where the roots are those of a degree-$n$ polynomial and the classical root sensitivity is $\partial p_i/\partial a_k=-p_i^{\,n-k}\big/\prod_{j\neq i}(p_i-p_j)$: with poles clustered near the unit circle that product is minuscule and *every* coefficient displaces *every* pole. At $n=2$ the product collapses to the single factor $p-\bar p=2jR\sin\theta$, and the radius sensitivity does not contain even that. Factoring into biquads before quantising is not tidiness; it is the removal of the ill-conditioned object.

**Size $a_2$ for stability first, and only then for accuracy.** Round-to-nearest quantisation of $a_2$ at LSB $2^{\ell_c}$ gives $|\delta a_2|\le 2^{\ell_c-1}$, and differentiating $R=\sqrt{a_2}$ gives $\delta R=\delta a_2/(2R)$. The pole crosses the unit circle when $\delta R>1-R$, so stability demands

$$2^{\ell_c-1}<2R(1-R)$$

For the bell resonator $1-R=7.123\times10^{-6}$, so $2R(1-R)=1.4246\times10^{-5}$ and $\ell_c\le-16$. **Sixteen fractional bits on $a_2$ buy no accuracy whatsoever — they are the price of the filter still being a filter**, and the standard design-then-quantise flow is exactly the flow that never computes this number (p. 685). The frequency side is milder: at fixed $a_2$, differentiating $a_1=-2R\cos\theta$ gives $\delta\theta=\delta a_1/(2R\sin\theta)$, so with $\sin\theta=0.0698$ one ulp of $a_1$ at $2^{-16}$ shifts the resonance by $1.09\times10^{-4}$ rad, i.e. $0.77$ Hz on a $490$ Hz partial — $0.16\,\%$, audible as mistuning but not fatal. Coefficients are `sfix(1, ℓ_c)`: $|a_1|<2$ needs MSB $1$, $|a_2|<1$ does not, and one format for both keeps the two constants in a single multiple-constant-multiplication problem ([[Fixed-Point Representations]]).

**The datapath width comes from the loop, not from the coefficients.** Normalise $\overline{x}=1$ so the input is `sfix(0, ℓ)`; the output LSB $\ell'$ *is* the accuracy specification. Deleting the numerator leaves the error filter $\mathcal{H}_\delta(z)=1/(1+a_1z^{-1}+a_2z^{-2})$, which has the section's own poles, and every rounding error injected into the loop is amplified by its worst-case peak gain ([[LTI Filters]], [[Error Accuracy]]). FloPoCo reports $\langle\!\langle\mathcal{H}\rangle\!\rangle=178\,750$ and $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.2806\times10^{6}$ for the bell resonator, so $1+\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil=22$ guard bits below the output LSB, and $m'\le\lceil\log_2(178\,750+2^{\ell'})\rceil=18$. At $\ell'=-8$ that is $\ell_{\text{ext}}=-30$ and an internal word of $18-(-30)+1=49$ bits — for a *second-order* filter with an 8-bit input and an 8-bit output (p. 691, p. 694; [[FloPoCo]]). Overflow inside the section is harmless because fixed-point accumulation is modulo $2^{m'}$ and the final value is still right, which is what licenses wrapping arithmetic on every internal wire.

**The numerator of a resonator is free, so the section costs exactly two multiplications.** The bell model takes $b=(1,0,-1)$, i.e. $1-z^{-2}$, whose zeros are $z=\pm1$: the section is pinned to zero at DC and at Nyquist and passes only its own band. Neither zero is a multiplication — the forward path is a two-stage [[Tapped Delay Line]] and two structural adds. What is left, $-a_1y(k-1)-a_2y(k-2)$, is a sum of products by two constants, so the honest implementation is one bit heap with a single rounding at the bottom rather than two rounded multipliers followed by an adder ([[SOPC, Sum of Products by Constants]], [[Multiple Constant Multiplication]]). A general biquad carries three $b$'s and costs five multiplications and two registers per section ([[Direct Form I IIR Filter]]).

**On FPGA the wide loop word, not the multiplication count, is what hurts.** A 49-bit internal word against a 17-bit coefficient is far past any hard multiplier's input geometry, so each constant becomes a tiled multiplication spread over several [[DSP Blocks]] or a shift-and-add tree in LUTs; since $a_1$ and $a_2$ are synthesis-time constants and share sub-expressions, the shift-and-add route usually wins outright and the DSP blocks are better spent elsewhere. On ASIC there is no hard block to forgo and the two constants go straight into one MCM adder graph. The leverage on both targets is the same and it is at the top of the word: $m'=18$ is the adversarial-signal bound, while a hammer strike drives this resonator to $|y|\le2$, so overriding the worst-case peak gain — which FloPoCo's `FixIIR` explicitly allows — cuts the internal word from 49 bits to 33 and takes 16 bits out of *both* feedback registers and *both* constant multipliers at once (p. 691, p. 694).

$$\boxed{\;|p|=\sqrt{a_2}=10^{-3/(T^{60}f_s)},\qquad \arg p=\arccos\!\frac{-a_1}{2\sqrt{a_2}}=\frac{2\pi f}{f_s},\qquad a_1^2<4a_2\;}$$

**When it breaks.**

- **$\theta\to0$ or $\theta\to\pi$.** The frequency sensitivity $1/(2R\sin\theta)$ diverges as the conjugate pair collapses onto the real axis, so a resonance far below $f_s$ — which is most audio filters at 44.1 kHz — needs many more bits in $a_1$ than the radius needs in $a_2$. The bell partial at $f/f_s=0.011$ already pays a factor of $7.2$.
- **$a_1^2\ge4a_2$.** The poles are real, the section no longer resonates, and $R=\sqrt{a_2}$ stops being the pole radius: the roots are $(-a_1\pm\sqrt{a_1^2-4a_2})/2$ and one of them exceeds $\sqrt{a_2}$. Every formula above silently changes meaning, including the stability test.
- **$R\to1$.** The guard-bit count grows like $\log_2$ of the error filter's peak gain — 22 bits for a 22-second decay. An arbitrarily high-Q resonator is not implementable at any fixed width, and no amount of coefficient precision substitutes for the guard bits.
- **The worst-case peak gain is a bound, not a behaviour.** $m'=18$ against an actual $|y|\le2$ is 16 bits of pure pessimism. It is the right default and the wrong answer whenever the excitation is known.
- **One section is well-conditioned; a cascade of them is a new problem.** Pairing poles with zeros and ordering the sections changes every internal range, and none of that is settled by the section in isolation ([[Biquad Cascade]], [[Choosing a Filter Structure]]).
- **The one-ulp bound on limit cycles is a consequence of faithfulness**, so it holds only if the guard bits were actually paid. Under-provision $\ell_{\text{ext}}$ and the section can sustain a limit cycle of arbitrary amplitude, or leave the unit circle outright.

> [!warning] Not covered in the source — needs outside research
> Chapter 23 treats only the direct forms. The standard fixes for the $\theta\to0$ conditioning collapse — the coupled (Gold–Rader) form, normalised ladder and lattice-wave structures — are named in passing on p. 696 as "other well-studied realizations" and never analysed, so their guard-bit and coefficient-width formulas are not available here.

**RTL (Spade).**

```spade
/// Multiply a state sample by a coefficient held with 16 fractional bits and
/// bring the product back to the state format: (a*y) >> 16, wrapped to 24 bits.
fn scale(a: int<24>, y: int<24>) -> int<24> {
    let p: int<48> = a * y;
    trunc(p >>> 16)
}

/// One biquad section, direct form I, in the resonator form of Fig. 23.12:
///     y(k) = x(k) - x(k-2) - a1*y(k-1) - a2*y(k-2)
/// State, coefficients and datapath are all sfix(7, -16): 24 bits, 16 of them
/// fractional. A real section narrows the coefficients to sfix(1, l_c).
entity biquad(clk: clock, rst: bool, x: int<24>, a1: int<24>, a2: int<24>) -> int<24> {
    decl y;
    reg(clk) x1 reset(rst: 0) = x;
    reg(clk) x2 reset(rst: 0) = x1;
    reg(clk) y1: int<24> reset(rst: 0) = y;
    reg(clk) y2 reset(rst: 0) = y1;
    let y = (x -. x2) -. (scale(a1, y1) +. scale(a2, y2));
    y
}
```

`x1`/`x2` are the two grey delay boxes on the input line and `y1`/`y2` the two on the feedback line; `decl y` is what lets the register read a value the summation bar has not produced yet, and it is the only reason this is expressible at all — the loop closes through a *register*, not combinationally. `int<48>` is the exact product width, `>>> 16` is the arithmetic realignment of `sfix(7,-16)`$\times$`sfix(7,-16)` back to the state format — every wire here is 24 bits with 16 fractional, which over-provisions the coefficients relative to the diagram's `sfix(1, ℓ_c)` and keeps one width in play — and every `+.`/`-.` is deliberately the wrapping variant: the value is correct modulo $2^{24}$, which is what the book means by internal overflows being harmless. Synthesis will not build the drawing — the two `scale` calls are constant multiplications once `a1` and `a2` are frozen, so they collapse into one shift-and-add graph, and the four terms of the final expression become one compressor tree with a single rounding rather than three chained adders.

Simulated against a behavioural reference at $f/f_s=0.05$, $R=0.99$ ($a_1=-123410\cdot2^{-16}$, $a_2=64232\cdot2^{-16}$): 3010 checks, including the first eight samples of the impulse response computed offline in exact integer arithmetic — the vector that catches a swapped $x(k{-}1)/x(k{-}2)$ or $y(k{-}1)/y(k{-}2)$ tap, which a symmetric input never would.

**Related Notes.**

- [[Biquad Cascade]] – extends: the factorisation that makes this section a basis, and the pairing and ordering questions one section cannot answer.
- [[Additive Synthesis Filter Bank]] – extends: the same section replicated per harmonic, weighted by $g_i$ and summed, which is where the bell coefficients come from.
- [[Direct Form I IIR Filter]] – depends-on: the general structure this is the order-2 instance of, and the source of the $5$-multiplier count when the numerator is not trivial.
- [[Transposed Direct Form II IIR Filter]] – compares: the same transfer function with shared registers and narrow forward multipliers, at the cost of two multipliers in the critical path.
- [[Choosing a Filter Structure]] – compares: where a cascade of these sits against the flat direct forms at equal guaranteed accuracy.
- [[SOPC, Sum of Products by Constants]] – depends-on: the two feedback multiplications as one bit heap with a single rounding.
- [[Tapped Delay Line]] – depends-on: the two-stage input delay that makes $1-z^{-2}$ cost no multiplier.
- [[Error Accuracy]] – depends-on: faithfulness, and the guard-bit budget the loop's peak gain consumes.
- [[Fixed-Point Representations]] – depends-on: the `sfix(m, ℓ)` formats on every wire, and why overflow modulo $2^{m'}$ is harmless.
- [[Multiple Constant Multiplication]] – supports: $a_1$ and $a_2$ frozen at synthesis time and shared as one adder graph.
- [[DSP Blocks]] – counter-example: the 49-bit loop word does not fit a hard multiplier, so the FPGA answer is usually LUTs.
- [[FloPoCo]] – supports: the tool that computes the safe peak-gain overestimate and emits the section from $(a_i)$, $(b_i)$, $\ell$, $\ell'$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), §23.1.7 "Filters Directly Defined by Their Coefficients", pp. 681–682 — multimodal additive synthesis, the biquad per harmonic parameterised by $f_i$ and $T_i^{60}$, and Fig. 23.12 whose inset this diagram redraws.
- §23.1.8, pp. 682–684 — the $z$-transform, $\omega=2\pi f/f_s$ on the unit circle, (23.19), and pole position as the stability criterion.
- §23.1.9, p. 685 — quantising after design breaks the frequency specification or the stability, because interesting IIR poles sit near the unit circle.
- §23.3.2, pp. 690–691 — the `sfix(0, ℓ)` / `sfix(m', ℓ')` interface, the output-MSB bound (23.24), and internal overflow modulo $2^{m'}$.
- §23.3.5, p. 694 — the guard-bit formula (23.37) and the "Hands on: FixIIR" box: $a_1^1=-1.99510896$, $a_2^1=0.999985754$, $\langle\!\langle\mathcal{H}\rangle\!\rangle=178\,750$, $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.2806\times10^{6}$, and the impulse-response bound of $2$ that motivates overriding the peak gain.
- §23.4.2, p. 696 — filter structure as a performance parameter; lattice wave filters and cascades named but not analysed.
