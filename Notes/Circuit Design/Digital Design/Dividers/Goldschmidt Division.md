---
title: Goldschmidt Division
description: "Two coupled recurrences driving the denominator to 1, with both multiplications issuing in the same cycle — pipelines beautifully, but the numerator error is never re-measured so it accumulates and must be paid for in guard bits."
kind: circuit
source: "ASA §9.5.1, pp. 300-301; error recurrences §9.4, pp. 298-299"
status: seed
spade: simulated
tags: [digital, dividers, multiplicative, iterative, fpga]
aliases:
  - Goldschmidt
  - Goldschmidt Division
  - Goldschmidt's Algorithm
  - Goldschmidt Divider
  - Goldschmidt Iteration
  - Multiplicative Normalization
  - Multiplicative Normalisation
---

# Goldschmidt Division

Multiplicative normalisation: scale numerator and denominator by the same factor every step until the denominator is 1, which makes the step's two multiplications independent of each other — the only multiplicative divider whose iteration is *one* multiplier deep, and the only one that never re-measures its own numerator error.

```tikz title="One Goldschmidt iteration: two independent multiplications sharing one complement-derived factor"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,x=0.85cm,y=0.85cm,>=latex]
  %% ---------- the two state registers: the whole state of the operator ----------
  \draw[thick] (0.4,8.0) rectangle (3.6,8.9);
  \node at (2.0,8.45) {\textsf{reg} $n_j$};
  \draw[thick] (8.0,8.0) rectangle (11.6,8.9);
  \node at (9.8,8.45) {\textsf{reg} $d_j$};

  %% ---------- seeding ----------
  \draw[->] (-1.0,8.45) -- (0.4,8.45);
  \node[anchor=east,font=\footnotesize] at (-1.05,8.45) {$n_0$};
  \draw[->] (13.0,8.45) -- (11.6,8.45);
  \node[anchor=west,font=\footnotesize] at (13.05,8.45) {$d_0$};

  %% ---------- n_j down to its multiplier ----------
  \draw[thick] (1.2,8.0) -- (1.2,4.9);
  \node[anchor=east,font=\footnotesize] at (1.15,7.4) {$n_j$};

  %% ---------- d_j down to its multiplier, tapped for the complementer ----------
  \draw[thick] (10.8,8.0) -- (10.8,4.9);
  \node[anchor=west,font=\footnotesize] at (10.85,7.4) {$d_j$};
  \draw[thick] (10.8,6.65) -- (8.1,6.65);

  %% ---------- p_j = 2 - d_j : one complement row, no multiplier ----------
  \draw[thick,blue] (4.0,6.2) rectangle (8.1,7.1);
  \node[font=\footnotesize,text=blue] at (6.05,6.65) {$2-d_j \;=\; \overline{d_j}+1\,\mathrm{ulp}$};
  \draw[thick,blue] (4.0,6.65) -- (3.6,6.65) -- (3.6,5.5);
  \draw[thick,blue] (3.6,5.5) -- (2.8,5.5) -- (2.8,4.9);
  \draw[thick,blue] (3.6,5.5) -- (9.2,5.5) -- (9.2,4.9);
  \node[anchor=south,font=\footnotesize,text=blue] at (6.6,5.55) {$p_j$, $w$ bits};

  %% ---------- the two multiplications: independent, same cycle ----------
  \draw[thick,red] (0.4,3.9) rectangle (3.6,4.9);
  \node[font=\footnotesize] at (2.0,4.4) {$\times$ trunc to $w$};
  \draw[thick,red] (8.0,3.9) rectangle (11.6,4.9);
  \node[font=\footnotesize] at (9.8,4.4) {$\times$ trunc to $w$};
  \draw[red,dashed] (3.6,4.4) -- (8.0,4.4);

  %% ---------- outputs and feedback ----------
  \draw[thick] (2.0,3.9) -- (2.0,2.6);
  \node[anchor=north,font=\footnotesize] at (2.0,2.55) {$n_{j+1}=p_jn_j$};
  \draw[thick] (9.8,3.9) -- (9.8,2.6);
  \node[anchor=north,font=\footnotesize] at (9.8,2.55) {$d_{j+1}=p_jd_j$};
  \node[anchor=north,font=\footnotesize,text=red] at (5.9,3.5) {issued in the same cycle};

  \draw (2.0,3.2) -- (-2.1,3.2) -- (-2.1,9.7) -- (2.0,9.7) -- (2.0,8.9);
  \draw (9.8,3.2) -- (14.1,3.2) -- (14.1,9.7) -- (9.8,9.7) -- (9.8,8.9);
  \node[anchor=south,font=\footnotesize] at (2.0,9.75) {next cycle};
  \node[anchor=south,font=\footnotesize] at (9.8,9.75) {next cycle};

  %% ---------- widths ----------
  \node[align=center,font=\footnotesize] at (5.9,10.1)
    {all buses $w=w_F+g$ bits,\\ format ufix$(1,-(w{-}1))$};

  %% ---------- annotations ----------
  \node[anchor=north west,align=left,font=\footnotesize,text=red] at (-2.1,1.9)
    {$n_{j+1}$ and $d_{j+1}$ read only $(p_j,n_j)$ and $(p_j,d_j)$: neither needs the other,\\
     so both multipliers start together. Critical path $=$ one complement row $+$ \emph{one} multiplier.};
  \node[anchor=north west,align=left,font=\footnotesize] at (-2.1,0.5)
    {Nothing in the loop ever reads $X$ or $D$ again $\Rightarrow$ an error injected into $n_j$ is never\\
     re-measured. Only the $g$ guard bits stop it reaching the result.\\
     Seed: $n_0 = p_0X$, $d_0 = p_0D$, $p_0 \approx 1/D$ from the reciprocal table.};
\end{circuitikz}
\end{document}
```

*own construction; the book states the recurrence (9.96)–(9.101), p. 300, without a figure.*

**Replace "compute the quotient" by "normalise the denominator".** Every other divider computes something that converges to $X/D$. Goldschmidt instead maintains a *pair* $(n_i, d_i)$ under the invariant

$$\frac{n_i}{d_i} = \frac{X}{D}, \qquad n_i = X\cdot p_0p_1\cdots p_i, \qquad d_i = D\cdot p_0p_1\cdots p_i \tag{9.94–9.95}$$

and drives $d_i \to 1$. The invariant needs no proof beyond cancellation: numerator and denominator are multiplied by the *same* $p_j$ at every step, so the ratio is untouched, and $d_i \to 1$ therefore forces $n_i \to X/D$. (The book writes $n_i = 1\cdot p_0\cdots p_i$, computing the reciprocal; folding $X$ into $n_0$ gives the quotient directly at no extra cost, and is the version drawn above.)

**The factor is forced by the convergence you demand, not chosen.** Define the denominator's error $e_j = 1 - d_j$ and *impose* quadratic convergence $e_{j+1} = e_j^2$. Then $d_{j+1} = 1 - e_j^2 = (1-e_j)(1+e_j) = d_j(1+e_j)$ by the difference-of-squares factorisation, so $p_j = 1 + e_j = 2 - d_j$. Read forward instead, the same algebra is the completed square

$$e_{j+1} = 1 - p_jd_j = 1 - (2-d_j)d_j = 1 - 2d_j + d_j^2 = (1-d_j)^2 = e_j^2$$

using the binomial identity $1 - 2u + u^2 = (1-u)^2$ with $u = d_j$. The number of correct bits of $d_j$ doubles per step, exactly as in [[Newton-Raphson Reciprocal]], and for the same reason. The complete recurrence is (9.96)–(9.101), p. 300:

$$p_0 \approx \tfrac1D, \quad d_0 = Dp_0, \quad n_0 = p_0X, \qquad n_{j+1} = p_jn_j, \quad d_{j+1} = p_jd_j, \quad p_{j+1} = 2-d_j$$

**The multiplier factor costs no multiplier and no adder.** Carry the datapath in `ufix(1, -(w-1))`: a $w$-bit unsigned code $u$ denotes $u\cdot2^{-(w-1)}$, so the representable range is $[0,2)$ and arithmetic wraps modulo $2$. In that format $2 - d_j \equiv -d_j$, and the two's-complement identity $-x = \bar{x} + 1\,\text{ulp}$ (see [[Number Formats]]) gives

$$p_j = \overline{d_j} + 2^{-(w-1)}$$

— a row of inverters and an increment. The increment is not even a separate adder: it is a constant $1$ entering the following multiplier's partial-product array as a carry-in. This is why the "$2-d$" block in the diagram is drawn as a wire-level box, and it is the whole reason Goldschmidt's step is *one* multiplier deep while [[Newton-Raphson Reciprocal]]'s is a squarer followed by a multiplier.

**Widths, end to end.** $X$ and $D$ are significands with $w_F$ fraction bits and an implicit leading one, both in $[1,2)$; $D$ bounded away from zero is what makes any reciprocal method legal at all ([[Division by Reciprocal]]). The seed $p_0$ comes from a [[Reciprocal Seed Table]] accurate to $\ell_0$ bits and lies in $(\tfrac12, 1]$. Every datapath bus is $w = w_F + g$ bits in `ufix(1,-(w-1))`, where $g$ is the guard-bit count sized below. $d_j \in (0,1]$ by $d_{j+1} = 1 - e_j^2 \le 1$, and $n_j \le X/D < 2$ by the invariant, so one integer bit suffices for both — the format's headroom is thin, and §"When it breaks" shows exactly where it runs out. Each product is $2w$ bits and is truncated back to $w$: two [[Truncated Multipliers]] per iteration, never rounded, because a rounder in the loop is a carry chain in the critical path.

**Iteration count and what the loop costs.** $e_{j+1} = e_j^2$ means $|e_k| \approx |e_0|^{2^k} = 2^{\ell_0 2^k}$, so reaching $2^{-w_F}$ takes

$$k = \left\lceil \log_2\frac{w_F}{|\ell_0|} \right\rceil$$

iterations — the same count as Newton-Raphson (pp. 291–294), because it is the same quadratic convergence. Double precision from an 8-bit table is $k = 2$; from a 4-bit table, $k = 4$. Control is a $\lceil\log_2 k\rceil$-bit down-counter, a terminal comparator, and one load multiplexer per register — and on FPGA that multiplexer is free, because the flip-flop's synchronous load port already exists. Add one cycle at the front for the table read and the two seeding products $p_0X$, $p_0D$, which reuse the same two multipliers. Total latency $k+2$ cycles; the *datapath* cost of the loop is zero, which is the point.

> [!important] Goldschmidt does not self-correct
> $p_{j+1} = 2 - d_j$ depends only on the *denominator* recurrence. A rounding error injected into $n_j$ is multiplied by $\prod_k p_k \approx 1$ forever and is never observed by anything, because nothing in the loop ever recomputes $n_j$ against $X$ or $D$. Newton-Raphson's $e_i = 1 - Dr_i$ re-derives the error from $D$ at every step and squares it away; Goldschmidt's numerator error only accumulates. The book's own bound makes it concrete — the $Q$/numerator datapath carries $(1+2^{m_i})\overline{\delta}_i \approx \overline{\delta}_i$ forward, "contrary to the $E_i$ datapath where the error from step $i$ was scaled down" (9.91, p. 299), which is why a *common* LSB $\ell$ is used for all steps rather than a shrinking one.
>
> Consequence: guard bits must be sized for the *accumulated* error rather than the last step's, and the multipliers cannot be truncated as aggressively ([[Error Analysis]]). The compensation is structural, and it is the only reason to choose this algorithm: $n_{j+1}$ and $d_{j+1}$ depend on nothing of each other, so the two multiplications issue in the same cycle and the whole iteration pipelines cleanly.

**Multiplying by numbers close to one is waste, and removing the waste removes the algorithm.** Since $d_j \to 1$, the factor $p_j = 1 + e_j$ has a run of $|{\log_2 e_j}|$ known zeros just below the binary point. Rewriting $p_j \times d_j$ as $d_j + d_je_j$ (distributivity) replaces a full $w\times w$ multiplier with one whose second operand is only the $\sim|\log_2 e_j|$ significant bits of $e_j$. Do the same to $p_j \times n_j$ and the recurrence you are left with **is** the quadratic series of §9.4 — the book says so outright (p. 300). So the honest position: Goldschmidt as written is the unoptimised presentation of [[Quadratic Series Divider]]; what survives the optimisation is the structure (two independent products per step), and what disappears is the full-width multiplier. Keep the full-width form only when the multiplier is a fixed-size resource you cannot shrink, which on FPGA means a [[DSP Blocks|DSP block]]: a $18\times25$ hard multiplier costs the same whether you feed it 25 significant bits or 6, so the "smaller multiplier" optimisation buys literally nothing and you may as well keep the clean $p_j\times d_j$ form (p. 297).

**Where FPGA and ASIC part company.** Two full-width $w\times w$ multipliers per step, every step, with no shrinkage — contrast the quadratic series, whose squarer input and output shrink by a doubling number of bits per iteration (a 21-bit input at step 0 becoming 7 bits at step 1, p. 298). Unrolled in space for throughput, Goldschmidt therefore costs $2k$ full multipliers where the quadratic series costs $k$ multipliers plus $k$ *shrinking* squarers. On ASIC that is a decisive area loss. On a DSP-rich FPGA it is often free: the blocks are there, they are a fixed granularity, and the flat structure maps to a deep pipeline with one DSP pair per stage and no reconvergent path to balance. That is the machine Goldschmidt is for — high throughput, latency irrelevant, multipliers already paid for ([[Floating-Point Operators]]).

$$\boxed{\ n_{j+1} = p_jn_j,\quad d_{j+1} = p_jd_j,\quad p_{j+1} = 2-d_j = \overline{d_j}+1\,\mathrm{ulp},\quad e_{j+1}=e_j^2,\quad k = \lceil\log_2(w_F/|\ell_0|)\rceil\ }$$

> [!warning] The source gives no closed form for $g$, and no area or delay figures
> On the error recurrence (9.93) the book says outright that "there is probably no nice closed-form formulation, but it is easy to write a program that implements these equations" (p. 299) — so the guard-bit count for a given $w_F$ and $k$ must be *computed*, not looked up, and this note deliberately gives no formula. Chapter 9 reports no LUT, DSP or delay numbers for any divider either; the FPGA-versus-ASIC verdict below is structural reasoning, not measurement.

**Where it breaks.**

- **The numerator overflows its format when $X/D$ approaches 2.** Truncating $d_j$ downward makes $p_{j+1} = 2 - d_j$ *larger* than it should be, so $n_j$ creeps up past $X/D$ by a couple of ulp instead of approaching it from below. Measured on the RTL below at $w=16$: with $X, D \in [1,2)$ unconstrained, $X = 1.99997$, $D = 1.00003$ produced $n = 0$ — a clean wrap through the format's ceiling of 2. Fix as every real significand divider does: pre-align so $X < D$ (one conditional shift of $X$ and an exponent decrement), putting $Q \in (\tfrac14, 1)$ with the whole top of the format as headroom. This is *not* a corner case you can round away; it is the accumulation of the callout above hitting a hard bound.
- **No remainder, ever.** The loop never forms $X - QD$, so there is nothing to round correctly against. Faithful only; if you need an exact $R$ or correct rounding, [[SRT Division]] is the family, not this one.
- **$D$ must be bounded away from zero**, and $d_j = 0$ makes $p_j = 2 - 0$ wrap to $0$ in the modulo-2 format and kills the recurrence silently. Significands are fine by construction; a general fixed-point divisor is not.
- **The iteration count is logarithmic only in the seed's quality.** Halving $|\ell_0|$ adds a whole iteration, and here an iteration is *two* full multipliers, not one. Below roughly 32 bits the seed table plus a single [[Halley Reciprocal Iteration]] beats any number of quadratic steps.
- **Optimise the multipliers and it stops being Goldschmidt** (previous paragraph). If your multipliers are soft logic rather than DSP blocks, you have already decided to build the quadratic series.

**Express one iteration in RTL.** The entity is the recurrence body, not the operator: two registers, one complement, two multiplies, and a `load` port that seeds the pair.

```spade
/// Truncated fixed-point product in format ufix(1, -(W-1)):
/// value = u * 2^-(W-1), so the product's useful window is bits W-1 .. 2W-2.
fn mulhi<#uint W>(a: uint<W>, b: uint<W>) -> uint<W> {
    let p: uint<{2*W}> = a * b;
    p.as_bits()[W-1..2*W-1].as_uint()
}

/// One Goldschmidt iteration. `load` seeds the pair (n_0, d_0) = (p_0 X, p_0 D);
/// every other cycle advances n_{j+1} = p_j n_j, d_{j+1} = p_j d_j, p_j = 2 - d_j.
entity gs_step<#uint W>(
    clk: clock,
    load: bool,
    n0: uint<W>,
    d0: uint<W>,
) -> (uint<W>, uint<W>) {
    decl nn;
    decl nd;
    reg(clk) n: uint<W> reset(load: n0) = nn;
    reg(clk) d: uint<W> reset(load: d0) = nd;

    // p_j = 2 - d_j is the two's-complement negation modulo 2: complement + 1 ulp.
    let p: uint<W> = ~d +. 1;

    // the two multiplications are independent: same cycle, no serialisation
    let nn: uint<W> = mulhi(p, n);
    let nd: uint<W> = mulhi(p, d);

    (n, d)
}
```

`n` and `d` are the two registers at the top of the diagram, `p` the blue complement box, and the two `mulhi` calls the two red multipliers — written as separate statements with no data dependence between them, which is precisely the property the diagram's dashed line marks. `mulhi` is the truncation: `a * b` grows to $2W$ bits and the slice `[W-1..2W-1]` keeps the window that re-lands in `ufix(1,-(W-1))`, discarding the low $W-1$ bits downward. Only the two registers are sequential; everything else is combinational, so one call of this entity is one clock cycle. Synthesis will not build `~d +. 1` as an incrementer — the constant $1$ is absorbed as a carry-in to the multiplier's compressor tree, so the complement row costs $W$ inverters and nothing else.

Simulated at $W=16$ with a deliberately crude seed (5 correct bits) and 5 iterations: 3008 vectors — 8 named asymmetric cases plus a 3000-point random sweep over $X \in [\tfrac12,1)$, $D \in [1,2)$ — all within **2 ulp** of $\lfloor 2^{15}X/D\rfloor$, with the maximum error at exactly 2 ulp and always on the low side, which is the one-directional truncation bias the guard-bit argument predicts.

**Related notes.**

- [[Newton-Raphson Reciprocal]] – compares: the self-correcting sibling; $e_i = 1 - Dr_i$ re-derived from $D$ every step, a squarer *then* a multiplier per step, and a datapath that grows instead of staying flat.
- [[Quadratic Series Divider]] – extends: what Goldschmidt becomes once you rewrite $p_jd_j$ as $d_j + d_je_j$ to skip the known zeros; the book proves the two identical.
- [[Division by Reciprocal]] – depends-on: the error budget $|\delta_Q| < |\delta_{\text{mult}}| + 2|\delta_{\text{recip}}|$ and the $D \in [1,2)$ restriction that make any multiplicative divider legal.
- [[Reciprocal Seed Table]] – depends-on: supplies $p_0$ and its $\ell_0$ correct bits, which set the iteration count outright.
- [[Truncated Multipliers]] – depends-on: the two products per step are faithful truncated multipliers, and their one-sided error is what accumulates in $n$.
- [[Error Analysis]] – supports: sizing $g$ for an error that is carried forward rather than squared away.
- [[Halley Reciprocal Iteration]] – compares: cubic convergence for one squarer and two multipliers, which beats a Goldschmidt step at the same multiplier budget below 32 bits.
- [[SRT Division]] – counter-example: exact remainder and correct rounding, obtained by never leaving the integer domain — everything Goldschmidt gives up.
- [[DSP Blocks]] – supports: fixed-granularity hard multipliers are the one target where "don't shrink the multiplier" costs nothing.
- [[Choosing a Divider]] – compares: where Goldschmidt sits against every sibling in latency, area and rounding guarantee.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.5.1 multiplicative normalisation (Goldschmidt's algorithm), (9.94)–(9.101), and the rewrite $p_j d_j = d_j + d_je_j$ collapsing it into the quadratic series, p. 300.
- §9.4 error recurrences: the $Q$/numerator datapath bound (9.88)–(9.93) with its $(1+2^{m_i})\overline{\delta}_i$ term and the common-LSB argument, pp. 298–299; the shrinking $E$ datapath and the worked $\ell = -32$, $m_0 = -7$ sizing, p. 298; the DSP-block remark on $Q_i(1+E_i)$, p. 297.
- §9.3 reciprocal-based division, faithful-divider budget (9.46)–(9.51) and iteration count, pp. 288–294.
- §9.5.2 Halley's method and the cubic-convergence comparison, (9.105), p. 301.
