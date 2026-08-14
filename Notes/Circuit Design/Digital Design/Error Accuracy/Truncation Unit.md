---
title: Truncation Unit
description: "Free rounding — the discarded bits are simply not routed — at the cost of a one-signed error under 1 ulp whose mean drifts by -u/2 per site."
kind: circuit
source: "ASA §3.1.3–3.1.5, pp. 68–71"
status: seed
spade: simulated
tags: [digital, error-accuracy, rounding, fixed-point]
aliases:
  - Truncation
  - Truncation Units
  - Round Toward Minus Infinity
  - Floor Quantizer
---

# Truncation Unit

The quantizer that implements $\lfloor Y\rfloor_\ell$ by not wiring the bits below weight $2^\ell$ anywhere — the only rounding mode with zero gates, zero delay and zero energy, and the only one whose error never changes sign.

```tikz title="Truncation as a cut in a bit vector: the kept field routes straight through, the discarded field is the entire error"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % ---------------- input word Y ----------------
  \foreach \k in {0,...,7} \draw (0.55*\k,0) rectangle (0.55*\k+0.55,0.55);
  \foreach \k in {8,...,11} \filldraw[fill=black!12] (0.55*\k,0) rectangle (0.55*\k+0.55,0.55);
  \node[font=\scriptsize,anchor=south east] at (4.3,0.66)
    {$Y$ on $\mathrm{ufix}(m,\ell_{\mathrm{ext}})$, $\;w_{\mathrm{in}}=m-\ell_{\mathrm{ext}}+1=12$ bits};
  \node[font=\scriptsize,anchor=north] at (0.275,-0.04) {$2^{m}$};
  \node[font=\scriptsize,anchor=north east] at (4.33,-0.04) {$2^{\ell}$};
  \node[font=\scriptsize,anchor=north west] at (4.47,-0.04) {$2^{\ell-1}$};
  \node[font=\scriptsize,anchor=north] at (6.325,-0.04) {$2^{\ell_{\mathrm{ext}}}$};

  % ---------------- the cut ----------------
  \draw[red!75,dashed,thick] (4.4,1.42) -- (4.4,-2.4);
  \node[font=\scriptsize,anchor=south,red!75] at (4.4,1.44) {cut at weight $2^{\ell}$};

  % ---------------- kept bits fall straight through ----------------
  \foreach \k in {0,...,7} \draw[->] (0.55*\k+0.275,-0.42) -- (0.55*\k+0.275,-1.55);
  \foreach \k in {0,...,7} \draw (0.55*\k,-2.1) rectangle (0.55*\k+0.55,-1.55);
  \node[font=\scriptsize,anchor=north] at (2.2,-2.2)
    {$\lfloor Y\rfloor_{\ell}$ on $\mathrm{ufix}(m,\ell)$, $\;w_{\mathrm{out}}=8$ bits};
  \node[font=\scriptsize,anchor=east,align=right] at (-0.12,-0.85)
    {straight-through\\routing: no gate,\\no carry, no delay};

  % ---------------- dropped bits go nowhere ----------------
  \foreach \k in {8,...,11} \draw[black!45] (0.55*\k+0.16,0.14) -- (0.55*\k+0.39,0.41);
  \foreach \k in {8,...,11} \draw[black!45] (0.55*\k+0.16,0.41) -- (0.55*\k+0.39,0.14);
  \draw[->,black!55] (5.9,-0.55) -- (5.9,-1.1);
  \node[font=\scriptsize,anchor=north west,align=left,black!55] at (4.62,-1.15)
    {$d=\ell-\ell_{\mathrm{ext}}=4$ bits discarded:\\$r=Y\bmod 2^{\ell}$, never routed};

  % ---------------- error interval ----------------
  \draw[->] (0.3,-3.9) -- (6.9,-3.9);
  \draw (1.2,-3.76) -- (1.2,-4.04);
  \draw (6.2,-3.76) -- (6.2,-4.04);
  \draw[line width=2pt] (1.5125,-3.9) -- (6.2,-3.9);
  \node[ocirc,scale=0.55] at (1.2,-3.9) {};
  \node[circ,scale=0.55] at (6.2,-3.9) {};
  \node[circ,scale=0.55] at (1.5125,-3.9) {};
  \node[font=\scriptsize,anchor=south] at (1.2,-3.72) {$-u$};
  \node[font=\scriptsize,anchor=south] at (6.2,-3.72) {$0$};
  \node[font=\scriptsize,anchor=north east] at (6.9,-3.98) {$\delta=-r$};
  \node[font=\scriptsize,anchor=north,align=center] at (1.55,-4.06)
    {$-(u-2^{\ell_{\mathrm{ext}}})$\\attained};
  \draw[dashed] (3.7,-3.9) -- (3.7,-4.35);
  \node[font=\scriptsize,anchor=north] at (3.7,-4.4) {mean $-\tfrac{u}{2}(1-2^{-d})$};
\end{circuitikz}
\end{document}
```

**Split the word at the weight you are quantizing to.** Let $Y$ be carried on $\mathrm{ufix}(m,\ell_{\mathrm{ext}})$, $w_{\mathrm{in}}=m-\ell_{\mathrm{ext}}+1$ bits, and let the output format be $\mathrm{ufix}(m,\ell)$ with $\ell>\ell_{\mathrm{ext}}$, so $u=\mathrm{ulp}=2^{\ell}$ and $w_{\mathrm{out}}=m-\ell+1$ bits ([[Fixed-Point Representations]]). Euclidean division by $2^{\ell}$ writes $Y=q\,2^{\ell}+r$ uniquely with $0\le r<2^{\ell}$, and because the radix is 2 that division is not a computation: $q$ is the field of $w_{\mathrm{out}}$ high bits and $r$ the field of $d=\ell-\ell_{\mathrm{ext}}$ low bits of the *same* vector. So $\lfloor Y\rfloor_\ell = q\,2^{\ell}$ is obtained by naming a sub-range of an existing bus. Zero gates, zero delay, zero switching energy in the unit itself — the entire content of "truncation is free in hardware" (p. 70).

**The error is the discarded field, read as a number.** By the definition of absolute error and the division above,

$$\delta_{\mathrm{trunc}} \;=\; \lfloor Y\rfloor_\ell - Y \;=\; q2^\ell - (q2^\ell + r) \;=\; -r$$

so the error is not merely *bounded* by the dropped bits, it **is** the dropped bits, with a minus sign. Two consequences fall out immediately. First, $r\ge0$ forces $\delta\le0$: truncation is round-toward-$-\infty$, a **directed** mode, and its error is one-signed. Second, $r<2^{\ell}$ gives $|\delta|<u$, so a truncation unit is on its own a [[Faithful Operator]] — but only just, and it consumes the *entire* 1-ulp budget.

**Why the 1-ulp bound is never attained, and why that matters.** $r$ is not a real number in $[0,u)$; it is a $d$-bit vector, so it ranges over $\{0,\,2^{\ell_{\mathrm{ext}}},\dots,\,2^{\ell}-2^{\ell_{\mathrm{ext}}}\}$ and its maximum is $u-2^{\ell_{\mathrm{ext}}} = u(1-2^{-d})$, strictly below $u$ and attained at that one code. Round-to-nearest is the opposite case: its $\tfrac12$-ulp bound *is* attained, at every tie. The distinction is not pedantry — Definition 3.5 asks for $\delta<u$ **strictly**, precisely so that a faithful operator must return $f(X)$ exactly when $f(X)$ is representable, and truncation clears that strict bar for free on any finite input word. Feeding a truncation unit a value with an infinite expansion, as [[Half-Unit Biased Format]] does when it rounds an arbitrary real, is what restores the supremum $u$ as unattained-but-approached.

**The two's-complement identity survives the cut untouched.** For a signed word the value is $-b_m2^m+\sum_{i<m}b_i2^i$; only the MSB carries a negative weight, and the cut removes bits of weight $2^{\ell_{\mathrm{ext}}}\dots2^{\ell-1}$, all positive. So dropping them subtracts $r\ge0$ from the value regardless of sign, and truncation is round-toward-$-\infty$ on $\mathrm{sfix}$ exactly as on $\mathrm{ufix}$: $-1.5\mapsto-2$. That is the whole reason the book qualifies "round toward zero ... **for a two's complement number**" as *not* implementable by truncation (p. 71) — toward-zero needs $-1.5\mapsto-1$, hence a conditional increment on negatives plus a detection of the all-zero-remainder case, which is why a [[Directed Rounding Unit]] is simultaneously less accurate and dearer than round-to-nearest.

> [!note] The bias is a DC offset, and a DC offset is a constant you can subtract
> With $Y$ uniform over the input grid, $r$ is uniform over its $2^{d}$ codes, so $\mathbb{E}[\delta]=-\tfrac{u}{2}(1-2^{-d})$ and $\mathrm{Var}[\delta]=\tfrac{u^2}{12}(1-4^{-d})$ — a mean that is $O(u)$ against a standard deviation that is also $O(u)$. Over $N$ independent truncation sites the means add coherently while the deviations add in quadrature, so the drift-to-noise ratio grows as $\tfrac{Nu/2}{u\sqrt{N/12}}=\sqrt{3N}$: truncation error in a long computation is overwhelmingly **offset, not noise**. But that offset is a known constant, and adding $+\tfrac{u}{2}=2^{\ell-1}$ to $Y$ before the same cut cancels it — which is not a new circuit but exactly Eq. (3.1), [[Round-to-Nearest Ties-Up]]. Read that way, round-to-nearest *is* truncation with its mean error compensated, and the whole cost of the mode is the cost of injecting one constant bit.

**What the extra bit buys, and against what.** With $f(X)$ available exactly on too many bits there are three ways to reach the output grid (pp. 69–70): truncate to $\ell$, bound $<1\,u$, free; round to nearest at $\ell$ via Eq. (3.1), bound $\le\tfrac12 u$, one carry propagation across $w_{\mathrm{out}}$ bits; or truncate to $\ell-1$, bound $\le\tfrac12\cdot2^{\ell}$, free but one bit wider. The last two are numerically equivalent, and the choice between them is **one adder against one bit of format**. The adder is paid once, locally, in this operator; the bit is paid by every downstream consumer that must route, register and compute on it. That asymmetry is why the answer flips with position in the datapath: near a leaf, take the free extra bit; near a bus, buy the adder.

**On FPGA the unit is free but the bits behind it were not.** A truncation unit synthesises to routing, so it consumes no LUT and adds no level of logic — but the discarded columns still had to be *computed*, and that computation is the real bill. The correct FPGA move is therefore not to truncate a result but to never build the columns: in a [[Bit Heaps|bit heap]] the low columns are simply omitted from the compressor tree, which is what makes [[Truncated Multipliers]] cheaper rather than merely narrower. Note that this changes the error model — omitted partial-product columns contribute an approximation error of their own, on top of the $-r$ above, and both terms must appear in the [[Error Analysis]] chain. The one thing that stays free either way is the final cut itself.

**Sizing the guard bits.** In the standard faithful architecture — approximate datapath at $\ell_{\mathrm{ext}}=\ell_R-g$, one final rounding to $\ell_R$ — the final round eats $u/2$ incompressibly, so the whole datapath must fit in the remaining $u/2$. Each internal truncation site contributes less than $2^{\ell_{\mathrm{ext}}}=u2^{-g}$, so $n$ of them need

$$n\,u\,2^{-g} \;<\; \frac{u}{2} \qquad\Longleftrightarrow\qquad g \;>\; 1+\log_2 n$$

leaving nothing for the approximation error. A single internal truncation already forces $g\ge2$; this is the mechanism behind the $g=2$ of the [[Faithful Multiplier by Pi]], where $\log_2 3\approx1.585$ comes from one truncation plus one constant-approximation term sharing the same budget.

$$\boxed{\;\lfloor Y\rfloor_\ell = Y-r,\quad r=Y\bmod 2^{\ell},\qquad \delta=-r\in\big[-(u-2^{\ell_{\mathrm{ext}}}),\,0\big],\qquad \mathbb{E}[\delta]=-\tfrac{u}{2}\big(1-2^{-d}\big)\;}$$

**When it breaks.**

- **At $d=1$ the statistics are not what the asymptotics say.** Dropping a single bit gives $\delta\in\{0,-u/2\}$ with mean $-u/4$, half the quoted drift, and the "uniform remainder" model is a two-point distribution. The $-u/2$ mean and the $u^2/12$ variance are limits in $d$, reached to within 1 % by $d\ge7$.
- **The remainder is only uniform if the input is.** After a multiplier the low bits are products of bits and are not uniformly distributed; after an accumulator they are correlated with the previous sample. The worst-case bound $|\delta|<u$ is unconditional and is what you ship; the mean and variance are modelling assumptions, and the whole point of the error-budget method in [[Error Analysis]] is that only the former composes.
- **Truncating the MSBs is a different operation with the same name.** Fixed-point libraries call the wrap-on-overflow mode "truncation" too (p. 71). Dropping low bits costs at most 1 ulp; dropping high bits maps large values to small ones and is numerically catastrophic — see [[Saturating Overflow Unit]]. Same verb, opposite end of the word, incomparable consequences.
- **In sign-magnitude the same wire cut is a different rounding mode.** There the cut reduces the *magnitude*, so it rounds toward zero: $\delta\le0$ for positive values and $\delta\ge0$ for negative ones. On a sign-symmetric input distribution the mean error is then $0$ — better statistics than two's complement for free — but the mode is directed-toward-zero, not toward $-\infty$, and the composition rules and the sign of the drift change with it. Never carry a bias figure across a change of representation.
- **Inside a feedback loop the offset is amplified, not merely accumulated.** The $\sqrt{3N}$ argument above assumes an open chain of $N$ sites.

> [!warning] Not covered in the source — needs outside research
> Chapter 3 treats truncation only in open (feed-forward) datapaths. A truncation inside a recursive loop — an IIR filter, an accumulator with a pole, a digit-recurrence residual — has its DC offset multiplied by the loop's DC gain and can sustain quantization limit cycles that no worst-case-per-site bound predicts. That analysis is standard DSP material and is absent from this book; do not extrapolate the numbers above into a loop.

**RTL (Spade).**

```spade
fn truncate<#uint W, #uint D>(y: uint<W>) -> uint<{W - D}> {
    y.as_bits()[D..W].as_uint()
}
```

`y` is the top vector in the diagram and the returned value is the bottom one; `D` is the count of greyed cells, $d=\ell-\ell_{\mathrm{ext}}$, and the result width $W-D$ is $w_{\mathrm{out}}$ — the only width arithmetic in the whole circuit, and it must be braced in the type position. Index 0 of `as_bits()` is the **LSB**, so the kept field is the *upper* slice `[D..W]`, and getting that inclusion backwards yields a design that compiles and type-checks perfectly while quantizing the wrong end of the word. Combinational and unclocked, necessarily: there is no state and no operator, and the emitted Verilog is a single part-select, `assign _e = _bits[11-:8];`, with no gate for synthesis to map. Spade's own `trunc(x)` is *not* this function — it drops the high bits, i.e. it is the wrap-on-overflow mode of the third bullet above.

Simulated through a concrete `entity trunc12to8(y: uint<12>) -> uint<8>` wrapper against the behavioural reference `y >> 4`: 10 named vectors plus a 3000-vector random sweep, 3010 total, zero failures. The named set includes `12'h801` and `12'h00F` — asymmetric words whose halves differ — which is what catches a reversed or off-by-one slice; `12'h000` and `12'hFFF` pass under every wrong slicing and prove nothing on their own.

**Related Notes (with context):**

- [[Round-to-Nearest Ties-Up]] – compares: the same cut with $2^{\ell-1}$ added first, which is exactly this unit's mean error subtracted; halves the bound for one carry propagation.
- [[Half-Unit Biased Format]] – extends: keeps the cut free and still reaches $\tfrac12$ ulp, by moving the half-ulp into the format's implicit trailing 1 instead of into an adder.
- [[Directed Rounding Unit]] – counter-example: same 1-ulp bound, strictly more hardware — the modes that truncation cannot implement because they need the all-zero-remainder test.
- [[Fixed-Point Representations]] – depends-on: supplies $\mathrm{ufix}(m,\ell)$, $u=2^{\ell}$ and the two's-complement weighting the sign argument rests on.
- [[Bit Heaps]] – supports: on FPGA the cheap form of truncation is columns never built, not bits dropped afterwards.
- [[Faithful Operator]] – supports: $|\delta|<u$ makes a lone truncation faithful, and simultaneously spends the entire budget.
- [[Faithful Multiplier by Pi]] – extends: the worked instance where this unit's $<2^{\ell_{\mathrm{ext}}}$ term sets the guard-bit count.
- [[Error Analysis]] – depends-on: the composition rules that turn $N$ of these $-r$ terms into one operator-level bound.
- [[Saturating Overflow Unit]] – counter-example: the other "truncation", at the MSB end, where the error is unbounded rather than sub-ulp.
- [[Choosing a Rounding Mode]] – compares: where this sits against every sibling mode on cost, bound and bias.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

| § | Topic | Pages |
| --- | --- | --- |
| 3.1.3 | rounding to the nearest, Eq. (3.1), floor as bit-dropping | 68–69 |
| 3.1.4 | truncation versus rounding to the nearest; the 1-ulp bound and why it is never attained; the free-rounding-bit trick; truncate-to-$\ell-1$ as the third option | 70 |
| 3.1.5 | library rounding modes; directed modes not implementable by truncation; wrap versus saturation on overflow | 70–71 |
| 3.1.8 | Definition 3.5, faithful / last-bit accurate, $\delta<u$ strictly | 76 |
| 3.3.3 | error budget, the incompressible final $u/2$, guard bits | 83 |

- Local: [[1.2) Error Accuracy]], §"Rounding" (the trade-off table and the bias paragraph) and §"Trade-offs" (the mode-by-mode comparison this note's row expands).
