---
title: Error Analysis
description: "Telescoping a computation through virtual intermediate values until every term is boundable, then applying the triangle inequality exactly once at the end."
kind: concept
source: "ASA §3.3.2-3.4, pp. 80-84"
status: seed
spade: n/a
tags: [digital, error-accuracy, error-budget, faithful, dse]
aliases:
  - Error Budget
  - Error Analysis Method
---

# Error Analysis

A proof method that turns "how wrong is this operator?" into a chain of differences between successive approximations — most of which never exist in the hardware — so that a single triangle inequality at the end yields a bound expressed in the architecture's own parameters.

```tikz title="Telescoping chain for log(1+X) and the error budget its bounds must fit inside"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  val/.style={draw, rounded corners=1pt, minimum height=11mm, minimum width=25mm, align=center, font=\footnotesize}]
  % ---- chain of successive approximations
  \node[val] (fh) at (0,0)    {$\widehat f(X)$\\{\tiny concrete}\\{\tiny $m_R-\ell_R+1$ bits}};
  \node[val] (p2) at (3.9,0)  {$p_2(X)$\\{\tiny half-virtual}\\{\tiny $T_2$ has LSB $\ell_2$}};
  \node[val] (p)  at (7.8,0)  {$p(X)$\\{\tiny virtual}\\{\tiny infinite}};
  \node[val] (f)  at (11.7,0) {$\log(1+X)$\\{\tiny exact}\\{\tiny infinite}};
  \draw[->] (fh) -- (p2);
  \draw[->] (p2) -- (p);
  \draw[->] (p)  -- (f);
  \node[font=\scriptsize] at (1.95,0.45)  {$\delta_1$};
  \node[font=\scriptsize] at (5.85,0.45)  {$\delta_2$};
  \node[font=\scriptsize] at (9.75,0.45)  {$\delta_3$};
  \node[font=\scriptsize,align=center] at (1.95,-0.75) {split\\further};
  \node[font=\scriptsize,align=center] at (5.85,-0.75) {$<2^{\ell_2}$\\faithful $T_2$};
  \node[font=\scriptsize,align=center] at (9.75,-0.75) {Taylor\\remainder};
  \draw[|-|] (0,1.15) -- node[above,font=\scriptsize]
    {$\delta(X)=\delta_1+\delta_2+\delta_3\;\Rightarrow\;|\delta(X)|\le\overline{\delta_1}+\overline{\delta_2}+\overline{\delta_3}$} (11.7,1.15);

  % ---- error budget bar
  \begin{scope}[yshift=-4.3cm]
    \draw[|-|] (0,1.85) -- node[above,font=\scriptsize]
      {total budget for faithfulness: $u=2^{\ell_R}$} (11.7,1.85);
    \draw[|-|] (0,0) -- (5.85,0);
    \draw[|-|] (5.85,0) -- (11.7,0);
    \draw (2.6,0.18) -- (2.6,-0.18);
    \draw[dashed] (5.85,0.9) -- (5.85,-0.9);
    \node[font=\scriptsize,align=center] at (1.3,0.62) {$n\,u\,2^{-g}$\\{\tiny $g$ guard bits}};
    \node[font=\scriptsize,align=center] at (4.2,0.62) {$A(\theta)$\\{\tiny approximation}};
    \node[font=\scriptsize,align=center] at (8.8,0.62) {one rounding\\{\tiny to $\ell_R$}};
    \node[font=\scriptsize,align=center] at (2.9,-0.72)
      {$\delta_{\mathrm{datapath}}<u/2$\\{\itshape buyable}};
    \node[font=\scriptsize,align=center] at (8.8,-0.72)
      {$\delta_{\mathrm{final\,round}}\le u/2$\\{\itshape incompressible}};
  \end{scope}
\end{circuitikz}
\end{document}
```

> [!important] An error is a difference, never a property
> "The error of this term is about 4 ulps" is not a statement that can be composed with anything. An error is a **difference between a less accurate value and a more accurate value**, and it is a *function of $X$*, not a number: $\delta(X)=\widehat f(X)-f(X)$. Every line below is an application of that one definition. The moment a term in your analysis is not literally `(something) - (something more accurate)`, the algebra has stopped meaning anything.

**Admit values the hardware never computes.** The two ends of the chain are given: $\widehat f(X)$, the bit vector the architecture produces on $\mathrm{ufix}(m_R,\ell_R)$ — $m_R-\ell_R+1$ bits — and the exact real $f(X)$. Nothing between them has to exist in silicon. For $f(X)=\log(1+X)$ approximated by a degree-$d$ truncated Mercator series, define the **virtual** value

$$p(X)=X-\frac{X^2}{2}+\frac{X^3}{3}-\dots+(-1)^{d+1}\frac{X^d}{d}$$

$p(X)$ is a real number with an infinite binary expansion (the $1/3$ alone guarantees it), so no register ever holds it. It exists so that $\delta_{\mathrm{approx}}(X)=p(X)-\log(1+X)$ can be *written down* and handed to Taylor's theorem. See [[Polynomial Approximation]] for where the degree $d$ and the coefficients come from.

**Telescope: insert and cancel.** If $A$ approximates $B$ and $B$ approximates $C$, add and subtract $B$ — the additive identity, nothing deeper:

$$A-C=(A-B)+(B-C)\qquad\Longrightarrow\qquad\delta_{AC}=\delta_{AB}+\delta_{BC}\tag{3.8, 3.10}$$

Absolute errors compose **exactly additively**. This is the whole reason fixed-point work quotes absolute error: you may insert as many intermediate values as you like and pay nothing for the privilege.

**Relative errors compose almost additively.** Divide the same identity by $C$, then multiply and divide the first term by $B$ so it becomes a relative error *with respect to its own reference*, using $B/C=1+\varepsilon_{BC}$:

$$\frac{A-C}{C}=\frac{A-B}{B}\cdot\frac{B}{C}+\frac{B-C}{C}=\varepsilon_{AB}(1+\varepsilon_{BC})+\varepsilon_{BC}$$

$$\Longrightarrow\qquad\varepsilon_{AC}=\varepsilon_{AB}+\varepsilon_{BC}+\varepsilon_{AB}\cdot\varepsilon_{BC}\tag{3.9, 3.11}$$

Equivalently $1+\varepsilon_{AC}=(1+\varepsilon_{AB})(1+\varepsilon_{BC})$: relative errors compose *multiplicatively*, and the cross term is what is left over when you insist on writing that as a sum. It is second order and usually discarded — but discarding it is an approximation, and a chain of $k$ terms each of size $2^{-p}$ carries a cross-term residue of order $k^2 2^{-2p}$, which is only negligible while $k\ll 2^{p}$.

**Promote one concrete signal at a time.** Start the chain by isolating the piece a mathematician can bound:

$$\delta(X)=\big[\widehat f(X)-p(X)\big]+\big[\underbrace{p(X)-\log(1+X)}_{\text{Taylor remainder}}\big]$$

The right bracket is done — Taylor's theorem bounds it in terms of $d$ and the input interval; forget it. The left bracket is still *everything the hardware does*, so split again, this time by promoting one real signal into the analysis. Let $T_2(X)$ be the bit vector the architecture actually computes for $X^2/2$, with LSB weight $\ell_2$, and define the half-virtual

$$p_2(X)=X-T_2(X)+\frac{X^3}{3}-\dots+(-1)^{d+1}\frac{X^d}{d}$$

Since $p_2$ and $p$ are the same expression except in that one term, everything else cancels:

$$p_2(X)-p(X)=T_2(X)-\frac{X^2}{2}$$

and if $T_2$ is a [[Faithful Operator]] on $\mathrm{ufix}(m_2,\ell_2)$ then $|T_2(X)-X^2/2|<2^{\ell_2}$ by the definition of faithfulness, so $|p_2(X)-p(X)|<2^{\ell_2}$. The chain is now three links long and only the leftmost is unbounded. Repeat — promote the concrete value for each remaining product and sum, e.g. every partial result of a [[Horner Evaluation]] — until every link is boundable.

**Bound as late as possible.** Only when the chain is complete do you take absolute values, and you do it **once**:

$$\delta(X)=\sum_{i=1}^{k}\delta_i(X)\;\Longrightarrow\;|\delta(X)|\le\sum_i|\delta_i(X)|\;\Longrightarrow\;\delta\le\overline{\delta_1}+\dots+\overline{\delta_k}$$

by the triangle inequality. Bounding early destroys the sign information that lets terms cancel algebraically — the $p_2-p$ cancellation above is exactly the kind of simplification that is unavailable once a term has been replaced by its magnitude. Note that $\ell_2$ was never given a value: it stays an **internal parameter**, deduced later from the output format. That is deliberate; an architectural choice deferred into a parameter is a choice that design-space exploration can make for you.

**The five rules** (p. 82), in order of how often they are broken: define an error as a difference between a less accurate and a more accurate value; introduce as many virtual values as needed; introduce *all* the concrete values that appear in the architecture; introduce architecture parameters in the process; and bound the errors as late as possible.

**Products and sums are dual, and one of them always hurts.** The book warns that products need the *ranges* of the operands, not just their error terms, and leaves it there. Expand $\widehat A=A+\delta_A$, $\widehat B=B+\delta_B$:

$$\widehat A\widehat B-AB=\delta_A B+A\,\delta_B+\delta_A\delta_B
\;\Longrightarrow\;\overline{\delta_{AB}}\le\overline{\delta_A}\max|B|+\max|A|\,\overline{\delta_B}+\overline{\delta_A}\,\overline{\delta_B}$$

so an absolute-error analysis of a multiplier is only as good as its range analysis. In *relative* terms the same product is trivial — it is (3.11) verbatim. Sums invert the picture: absolute errors of a sum just add, but

$$\varepsilon_{A+B}=\frac{\varepsilon_A A+\varepsilon_B B}{A+B}$$

is a weighted average when $A$ and $B$ share a sign, and **unbounded** when they do not and $A+B\to0$. That is catastrophic cancellation, stated as an error-composition fact: the currency is not a matter of taste, it is chosen per operation, and the conversion between them is $\delta=\varepsilon\cdot|f(X)|$ — see [[Number Formats]] and [[Error Accuracy]] for which format makes which currency natural.

**Turn the chain into a budget.** Point the method at the generic faithful architecture — an extended-precision datapath producing $R_{\mathrm{ext}}$ on $\mathrm{ufix}(m_{\mathrm{ext}},\ell_{\mathrm{ext}})$, then one final rounding to $\mathrm{ufix}(m_R,\ell_R)$ — and telescope through $R_{\mathrm{ext}}$:

$$R-f(X)=\underbrace{\big[R-R_{\mathrm{ext}}\big]}_{\delta_{\mathrm{final\;round}}}+\underbrace{\big[R_{\mathrm{ext}}-f(X)\big]}_{\delta_{\mathrm{datapath}}}\tag{3.12}$$

Because $R=\lfloor R_{\mathrm{ext}}\rceil_{\ell_R}$, the first term obeys $|\delta_{\mathrm{final}}|\le u/2$ with $u=2^{\ell_R}$, and that half-ulp is **attained and incompressible**: no amount of internal precision reduces it, because it is created after the internal precision has been thrown away. Faithfulness $|\delta|<u$ therefore reduces to $|\delta_{\mathrm{datapath}}|<u/2$ — half the budget is spent before the design starts.

**Spend the other half.** Expand $\delta_{\mathrm{datapath}}$ by the chain method. Say the datapath commits $n$ internal roundings, each at the internal LSB $\ell_{\mathrm{ext}}=\ell_R-g$, plus one approximation error $A(\theta)$ controlled by an approximation parameter $\theta$ — bits of $\pi$, Taylor degree $d$, [[Polynomial Approximation]] degree, iteration count of a digit recurrence. Each rounding contributes less than $2^{\ell_{\mathrm{ext}}}=u\,2^{-g}$, so the triangle inequality gives the design constraint. Solving it for $g$,

$$g>\log_2\frac{n}{\tfrac12-A(\theta)/u}$$

which is well defined only once $\theta$ has been chosen tightly enough that $A(\theta)<u/2$: **the approximation must fit in the budget before guard bits can be bought at all.** Both knobs go to zero, but they cost differently — $\theta$ costs a bigger table, a higher-degree polynomial or more iterations, while $g$ widens every internal signal by $g$ bits.

**On FPGA the guard-bit knob is a step function.** $g$ extra bits means $g$ more carry-chain rows, $g$ more bits of routing and pipeline register, and — the part a formula misses — a possible crossing of a hard-macro threshold: a DSP block's port width, a block-RAM aspect ratio, the length of a hardened carry chain (see [[FPGAs]]). On ASIC the same $g$ is close to linear in area. This is precisely why the optimal $(g,\theta)$ is found by enumeration or by [[ILP for Arithmetic Design]] rather than by minimising a closed-form cost: the objective is not smooth.

> [!warning] Not covered in the source — needs outside research
> Chapter 3 is deliberately technology-neutral and gives **no** LUT, slice, DSP or delay figures for guard bits. The step-function claim above is the qualitative statement of the chapter pointed at the notes that carry numbers; do not quote area from here.

$$\boxed{\;|\delta_{\mathrm{datapath}}|\;\le\;n\,u\,2^{-g}+A(\theta)\;\overset{!}{<}\;\frac{u}{2}\;}$$

**When it breaks.**

- **The condition is sufficient, not necessary.** The two worst cases need not coincide, so the triangle inequality over-bounds. In the [[Faithful Multiplier by Pi]] worked example, $g=1$ has a proven bound of $1.25u$ — not faithful — yet its measured worst case over all 256 inputs is $0.708u$. It is faithful by luck. You ship the bound, not the experiment.
- **Linear growth in $n$.** The bound accumulates $n$ rounding terms with no cancellation, so a deep chain forces $g\approx\log_2 n$ extra bits purely to pay for the pessimism. Statistical error models grow like $\sqrt{n}$ instead, but they do not compose into a guarantee.
- **Correct rounding has a budget of zero.** $R=\lfloor f(X)\rceil$ demands $|\delta_{\mathrm{datapath}}|<\min_X|f(X)-m(X)|$, the hardest-to-round distance to the nearest midpoint $m$. No finite $g$ survives an input whose $f(X)$ sits closer to $m$ than $2^{-g}$, and lower-bounding that minimum is the Table Maker's Dilemma. Faithfulness is cheap because $u/2>0$ is a budget you can *buy*; correct rounding needs a number-theoretic argument or an exhaustive [[Correctly-Rounded Product Table]].
- **$A(\theta)\ge u/2$ ends the discussion.** No guard bits, ever. Change the approximation or widen the output format.
- **Products without ranges, sums with cancellation.** Both derived above; both are where a mechanically applied chain silently produces a bound that is not one.
- **The bound is worst case, per input.** It says nothing about average error, bias or SNR, and it composes only because it is worst case. Truncation-heavy datapaths additionally carry a one-signed mean of $-u/2$ per site that a magnitude bound cannot see — see [[Truncation Unit]].

**RTL (Spade).** None. Error analysis is a design-time proof about an architecture, not a structure with ports: its output is a constraint on $g$ and $\theta$, and by the time RTL exists those are integers baked into signal widths. The architecture the analysis governs is in [[Faithful Operator]], and the budget worked end to end on real numbers is in [[Faithful Multiplier by Pi]].

**Related Notes (with context):**

- [[Faithful Operator]] – depends-on: supplies the two-term decomposition (3.12) and the $\delta<u$ specification this method exists to discharge.
- [[Faithful Multiplier by Pi]] – supports: the same budget solved numerically, including the $g=1$ case that passes by luck.
- [[Polynomial Approximation]] – extends: where $A(\theta)$ comes from, and the Taylor/minimax bound the chain hands off to.
- [[Horner Evaluation]] – extends: each partial result is one more concrete value to promote into the chain, and its rounding is one more $u\,2^{-g}$ term.
- [[ILP for Arithmetic Design]] – extends: turns the search for the optimal $(g,\theta)$ into a solvable program once the cost model is linearised.
- [[Half-Unit Biased Format]] – counter-example: weakens the "incompressible" final rounding to $u/2-2^{\ell_{\mathrm{ext}}-1}$, the one term this method treats as fixed.
- [[Correctly-Rounded Product Table]] – counter-example: gets correct rounding by enumeration where no error bound can.
- [[Truncation Unit]] – supports: the per-site $<u\,2^{-g}$ term, and the bias a worst-case bound hides.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 3, "Computing Just Right: Accuracy Specification and Error Analysis".

| § | Topic | Pages |
| --- | --- | --- |
| 3.3.2 | error analysis; first principle, virtual values, Eqs. (3.8)–(3.11), the five rules, Gappa | 80–83 |
| 3.3.3 | error budget and design-space exploration, Fig. 3.4, Eq. (3.12), guard bits | 83–84 |
| 3.4 | now go divide and conquer | 84 |

The [Gappa](https://gappa.gitlabpages.inria.fr) proof assistant mechanises the bounding step safely for fixed and floating point; its limitation is that a script describes one *instance*, so a parametric design needs one generated per parameter set.
