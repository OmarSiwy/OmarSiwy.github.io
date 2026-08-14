---
title: Faithful Operator
description: "The generic accuracy-driven architecture: an approximate datapath carrying g guard bits followed by one final rounding, sized so the whole block errs by strictly less than 1 ulp of its output."
kind: circuit
source: "ASA §3.1.8–3.3.3, pp. 76-84"
status: seed
spade: simulated
tags: [digital, error-accuracy, faithful, rounding, guard-bits, error-budget]
aliases:
  - Faithful Rounding
  - Faithful Operators
  - Last-Bit Accuracy
  - Faithfulness
  - Error Budget
---

# Faithful Operator

A faithful operator is any block whose worst-case absolute error is *strictly* below one ulp of its own output format — the weakest accuracy contract that still pins the result to the two representable numbers bracketing $f(X)$, and the one that lets an approximate datapath be sized by arithmetic instead of by experiment.

```tikz title="Generic faithful operator: an approximate datapath computing on g guard bits, followed by one final rounding"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  box/.style={draw, rounded corners=1pt, minimum height=14mm, align=center}]
  \node (x)  at (0,0) {$X$};
  \node[box, minimum width=32mm] (dp) at (4.0,0) {complex\\approximate datapath\\{\footnotesize(parametric)}};
  \node[box, minimum width=18mm] (rn) at (8.6,0) {final\\round};
  \node (r)  at (11.9,0) {$R\approx f(X)$};
  \draw[->] (x) -- (dp);
  \draw[->] (dp) -- (rn);
  \draw[->] (rn) -- (r);
  \node[font=\scriptsize] at (1.35,0.3) {$w_X$ bits};
  \node[font=\scriptsize, align=center] at (6.85,0.6) {$R_{\mathrm{ext}}$\\$w_R{+}g$ bits};
  \node[font=\scriptsize] at (10.3,0.3) {$w_R$ bits};
  \node[font=\scriptsize] at (1.35,-1.15) {$\mathrm{ufix}(m_X,\ell_X)$};
  \node[font=\scriptsize] at (6.85,-1.15) {$\mathrm{ufix}(m_{\mathrm{ext}},\ell_{\mathrm{ext}})$};
  \node[font=\scriptsize] at (10.6,-1.15) {$\mathrm{sfix}(m_R,\ell_R)$};
  \node[font=\scriptsize, align=center] at (4.0,-2.0)
    {$\delta_{\mathrm{datapath}}<u/2$\\{\itshape must be engineered}};
  \node[font=\scriptsize, align=center] at (8.6,-2.0)
    {$\delta_{\mathrm{final}}\le u/2$\\{\itshape incompressible}};
  \draw[<->] (5.6,1.35) -- (8.1,1.35);
  \node[font=\scriptsize] at (6.85,1.62) {$g=\ell_R-\ell_{\mathrm{ext}}$ guard bits};
\end{circuitikz}
\end{document}
```

*after Fig. 3.4, p. 83.*

**Write the specification as four lines, because there is no standard to point at.** An application-specific operator has no IEEE 754 behind it, so the contract is stated explicitly: an input $X$ in $\mathrm{ufix}(m_X,\ell_X)$ or $\mathrm{sfix}(m_X,\ell_X)$ on $w_X=m_X-\ell_X+1$ bits; an output $R$ in $\mathrm{ufix}(m_R,\ell_R)$ on $w_R=m_R-\ell_R+1$ bits, whose quantum is $u=\mathrm{ulp}=2^{\ell_R}$; an accuracy $\delta=\max_X|R(X)-f(X)|<u$; and area, latency or energy minimised *at that fixed accuracy* — accuracy is a constraint, never an objective (formats and ulp: [[Number Formats]], [[Error Accuracy]]). Fixing the output format fixes $u$, and fixing $u$ fixes the accuracy target, so **the format is the specification** and the operator generator needs no accuracy argument at all.

**Read Definition 3.5 strictly: $\delta<u$, not $\delta\le u$.** Two properties follow, and both need the strict inequality. A faithful operator returns *one of the two representable numbers bracketing* the exact $f(X)$: if it returned a third, that value would be at least $u$ away from $f(X)$. And when $f(X)$ is itself representable, a faithful operator returns it **exactly** — at $\delta=u$ the neighbouring grid point would still be admissible and exactness would evaporate. Note what is *not* claimed: nothing says which of the two bracketing values comes out, so faithful rounding is an accuracy constraint and not a rounding *function*, whatever the name suggests.

```tikz title="Faithful rounding with error bound 0.9u: two admissible outputs when f(X) falls between grid points, one when it lands on one"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  \draw[line width=2pt] (2.88,0) -- (6.12,0);
  \draw[->] (-0.4,0) -- (9.4,0);
  \foreach \x in {0,1.8,3.6,5.4,7.2,9.0} \draw (\x,0.16) -- (\x,-0.16);
  \draw[|-|] (0,-0.6) -- node[below,font=\scriptsize]{$u$} (1.8,-0.6);
  \node[font=\scriptsize] at (3.6,0.5) {$A$};
  \node[font=\scriptsize] at (5.4,0.5) {$B$};
  \node[font=\scriptsize] at (4.5,-1.45) {$f(X)$, $\delta=0.9u$: return $A$ \emph{or} $B$};
  \draw[->] (4.5,-1.25) -- (4.5,-0.16);
  \begin{scope}[yshift=-3.2cm]
  \draw[line width=2pt] (3.78,0) -- (7.02,0);
  \draw[->] (-0.4,0) -- (9.4,0);
  \foreach \x in {0,1.8,3.6,5.4,7.2,9.0} \draw (\x,0.16) -- (\x,-0.16);
  \node[font=\scriptsize] at (5.4,0.5) {$C$};
  \node[font=\scriptsize] at (5.4,-1.45) {$f(X)=C$ exactly: must return $C$};
  \draw[->] (5.4,-1.25) -- (5.4,-0.16);
  \end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 3.3, p. 77. Ticks are representable numbers; the thick segment is the admissible output interval, of half-width $\delta=0.9u$ about $f(X)$.*

**One ulp is a tight specification, not a loose one, because the format already forces half of it.** Any operator whose output lives on this grid must commit $\delta\ge u/2$ somewhere — that is the quantisation of the output alone, before a single gate is chosen. So $\delta<u$ is a factor of two off the best any hardware could do, and the entire design freedom is what happens inside that factor of two.

**Split the total error at the one signal the architecture actually carries.** The datapath produces an extended-precision $R_{\mathrm{ext}}$ on $\mathrm{ufix}(m_{\mathrm{ext}},\ell_{\mathrm{ext}})$ with $\ell_{\mathrm{ext}}<\ell_R$, and $R=\lfloor R_{\mathrm{ext}}\rceil_{\ell_R}$. Insert and cancel $R_{\mathrm{ext}}$ — the telescoping identity $A-C=(A-B)+(B-C)$ that makes errors compose additively ([[Error Analysis]]):

$$R-f(X)=\underbrace{\big[R-R_{\mathrm{ext}}\big]}_{\delta_{\mathrm{final\;round}}}+\underbrace{\big[R_{\mathrm{ext}}-f(X)\big]}_{\delta_{\mathrm{datapath}}} \tag{3.12}$$

Round-to-nearest gives $|\delta_{\mathrm{final}}|\le u/2$, **attained** at ties, and it is *incompressible*: no choice of $\ell_{\mathrm{ext}}$, no amount of internal precision, touches it. Applying the triangle inequality once, faithfulness reduces to a condition on the datapath alone, and the second half of the budget is where every architectural decision gets paid for.

**Turn the surviving half-ulp into two knobs that both go to zero.** Expand $\delta_{\mathrm{datapath}}$ by the same chain method: $n$ internal roundings, each truncating at the internal LSB $\ell_{\mathrm{ext}}=\ell_R-g$ and each contributing less than $2^{\ell_{\mathrm{ext}}}=u\,2^{-g}$, plus a mathematical approximation error $A(\theta)$ governed by an approximation parameter $\theta$ — bits of a rounded constant, Taylor or minimax degree ([[Polynomial Approximation]]), iteration count of a digit recurrence:

$$|\delta_{\mathrm{datapath}}| \;\le\; n\,u\,2^{-g} + A(\theta) \;\overset{!}{<}\; \frac{u}{2}
\qquad\Longleftrightarrow\qquad
g \;>\; \log_2\!\left(\frac{n\,u}{u/2-A(\theta)}\right)$$

The $g$ extra LSBs are the **guard bits**, and the inequality reads off cleanly: rounding noise is bought down geometrically at one bit of datapath width apiece, while $A(\theta)$ is bought down by a completely different currency. The closed form assumes $A(\theta)$ is independent of $g$; when the approximation is itself rounded *to* the internal format — a constant $\widetilde{\pi}=\lfloor\pi\rceil_{\ell_{\mathrm{ext}}}$, say — the two terms share the factor $2^{\ell_{\mathrm{ext}}}$ and must be summed before solving, which is why [[Faithful Multiplier by Pi]] lands on $g>\log_2 3$ rather than on the formula above.

> [!important] The budget is meant to be spent, not saved
> $u/2$ goes to the final rounding whatever you do; the *other* $u/2$ is a single pot shared by the approximation and every internal truncation. Spend it all on guard bits and the approximation must be near-exact; spend it all on a fancier approximation and you cannot afford to truncate anything. A sub-component more accurate than its share of the pot is wasted area — that, and not "as accurate as possible", is what *computing just right* means.

**Finding some $(g,\theta)$ is trivial; finding the cheapest is the actual design problem.** Both parameters trade accuracy against cost, but neither cost is linear: $g$ widens every internal signal, and area, delay and energy respond to that in ways that depend on the target technology. Sometimes the search is an integer linear program ([[ILP for Arithmetic Design]]); sometimes exhaustive enumeration suffices because the parameters are few. This is also the argument for refusing to make architectural choices at all — capture each one as another internal parameter, deduced from the external format parameters, and the design space stays open for a generator to search.

**Faithfulness composes, which is what makes the method divide-and-conquer.** Because a faithful sub-operator's contract is a bound, not a value, it drops straight into the error chain of its parent as one more term $<2^{\ell_i}$, and the parent never needs to know how it was built. So the same budget is applied one level down to each sub-component, recursively. The book's deepest instance is a parametric faithful floating-point exponential ([[Floating-Point Exponential]]) assembled entirely from faithful parts — constant multipliers, a polynomial approximator, truncated multipliers, tables.

**At the application level, faithful and correctly rounded are two ways to buy the same accuracy.** For a target $\delta_{\mathrm{target}}=2^k$ you may build a faithful operator on a format with $u=2^k$, or a correctly-rounded one on a format with $u=2^{k+1}$ — one bit narrower. Both deliver $2^k$. Option 1 is usually cheaper, and [[Truncated Multipliers]] are the standard demonstration: whole triangles of partial products go unbuilt precisely because the specification leaves that slack. But option 1's output is one bit wider and every downstream consumer carries that bit, so the comparison is genuinely contextual.

**Nothing is sacred about 1 ulp except the interface.** A $0.75$-ulp bound is slightly more accurate and slightly more expensive with no change of technique; a $1.5$-ulp operator is a legitimate choice under a threshold effect, provided the $1.5$ is carried into the global error analysis. The bound that is *fundamentally* harder is $0.5$ ulp, because the final rounding alone consumes it whole and no number of guard bits recovers it ([[Correctly-Rounded Product Table]]). One ulp is standardised because it follows from the output format for free — most [[FloPoCo]] operators take no accuracy argument at all — and because design-space exploration only means something when the architectures being compared are numerically equivalent.

$$\boxed{\ \delta_{\mathrm{final}}\le u/2\ \text{is incompressible}\ \Longrightarrow\ \big(\delta<u\ \Longleftrightarrow\ |\delta_{\mathrm{datapath}}|<u/2\big),\qquad |\delta_{\mathrm{datapath}}|\le n\,u\,2^{-g}+A(\theta)\ }$$

**When it breaks.**

- **$A(\theta)\ge u/2$ is unrescuable.** Guard bits attack only the $n\,u\,2^{-g}$ term. If the approximation's own bound already reaches half an ulp, $g\to\infty$ and the inequality never closes — change $\theta$, or widen the output format.
- **On FPGA the cost of $g$ is a step function, not a slope.** Extra LSBs are free until they push a signal past a hard-carry-chain length, a DSP block's port width, or a block-RAM aspect ratio ([[FPGAs]]); this is exactly why $g$ belongs in a search rather than in a formula.
- **A faithful operator is not testable against a golden value.** Two outputs are admissible for the same input, so bit-exact regression against a reference model produces false failures. Test the *bound*: assert $|R-f(X)|<u$ in high precision.
- **Faithfulness does not preserve monotonicity.** For increasing $f$ with $f(X_1)<f(X_2)$ but both in the same $u$-wide gap, returning $B$ for $X_1$ and $A$ for $X_2$ is admissible for each input separately. If a downstream stage relies on monotonicity, faithful is the wrong specification.
- **Products break naive term-by-term addition.** Bounding the error of $A\cdot B$ needs the *ranges* of $A$ and $B$, not only their error terms; the additive chain applies to sums, not to every operator ([[Error Analysis]]).
- **The final rounding can carry out of the output format.** $R_{\mathrm{ext}}$ all-ones rounds up past $2^{m_R+1}$. Range analysis must show $m_{\mathrm{ext}}$ makes this impossible, or the format absorbs one more integer bit.

> [!warning] The FPGA step function is not in the source — needs outside research
> Chapter 3 is deliberately technology-neutral and contains no LUT, slice, DSP or delay figures, so "the cost of $g$ is a step function" is stated here without numbers. Which widths are the steps is a device fact; take it from [[FPGAs]], never from this chapter.

**RTL (Spade).**

```spade
/// The `final round` box of the diagram: round-to-nearest-ties-up from the
/// internal format ufix(m_ext, l_R - G) to the output format ufix(m_R, l_R),
/// i.e. drop the G guard bits. W = w_R.
fn faithful_round<#uint W, #uint G>(rext: uint<{W + G}>) -> uint<{W + 1}> {
    let (guards, kept) = rext.as_bits().split_at::<G>();
    let keep: uint<W> = kept.as_uint();
    let inc:  uint<W> = zext(guards.last().as_uint());
    keep + inc
}
```

`rext` is the wire between the two boxes, $w_R+g$ bits wide; `guards` is the guard field that exists only inside the operator and `kept` the $w_R$ bits of the output format, with `as_bits()` index 0 = LSB, so `split_at::<G>` cuts exactly at $\ell_R$. `guards.last()` is the bit of weight $2^{\ell_R-1}$, and adding it is *exactly* equation (3.1): writing $R_{\mathrm{ext}}=q2^{\ell_R}+r$, $\lfloor R_{\mathrm{ext}}+2^{\ell_R-1}\rfloor_{\ell_R}=q+[\,r\ge2^{\ell_R-1}\,]$, and that bracket is the guard MSB — so the "one addition" of round-to-nearest degenerates to an increment, and [[Round-to-Nearest Ties-Up]] shows how even that disappears when the half-ulp can be injected upstream. All of it is combinational: a `fn` in Spade admits neither `reg` nor `inst`. The returned width is $w_R+1$, not $w_R$, because `+` widens — that extra bit is the rounding carry-out listed above, and synthesis will drop it wherever range analysis has proved it dead, which the drawing quietly assumes has already happened.

Verified by monomorphising at $W=10,\;G=2$ — the $\mathrm{ufix}(1,-8)$ output and $g=2$ of [[Faithful Multiplier by Pi]] — and simulating: all $4096$ values of `rext` against `(rext + 2) >> 2`, plus 3000 random vectors and named cases for the tie ($r=2$), the asymmetric $1+128$, and the all-ones carry-out.

**Related Notes.**

- [[Error Analysis]] – depends-on: the insert-and-cancel discipline that produces (3.12) and every term in the datapath budget.
- [[Round-to-Nearest Ties-Up]] – depends-on: the `final round` box, and the condition under which its half-ulp costs nothing.
- [[Faithful Multiplier by Pi]] – supports: the whole method on one page, including why $g=2$ and why $g=1$ passing was luck.
- [[Truncated Multipliers]] – extends: the budget spent on *not building* partial products, the standard argument for faithful over correctly rounded.
- [[Polynomial Approximation]] – extends: where $A(\theta)$ comes from and how degree trades against guard bits.
- [[Floating-Point Exponential]] – extends: the deepest recursive application, a faithful operator built entirely of faithful sub-operators.
- [[Correctly-Rounded Product Table]] – counter-example: the specification $\delta\le u/2$, which no number of guard bits buys and which needs enumeration instead.
- [[Half-Unit Biased Format]] – supports: an internal format that shaves the supposedly incompressible term to $u/2-2^{\ell_{\mathrm{ext}}-1}$.
- [[FloPoCo]] – supports: the generator whose operators take the output format and no accuracy argument.
- [[ILP for Arithmetic Design]] – supports: choosing $(g,\theta)$ optimally rather than adequately.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 3 "Computing Just Right: Accuracy Specification and Error Analysis".
- §3.1 "The accuracy of an operator" — the four-line specification template, p. 66.
- §3.1.8 "Faithful Operators and Last-Bit Accuracy" — Definition 3.5, eq. (3.7), Fig. 3.3, pp. 76–77.
- §3.1.9 "Last-Bit Accuracy Versus Rounding to the Nearest" — the $2^k$ / $2^{k+1}$ trade-off, p. 77.
- §3.2 "Using the Format to Specify the Accuracy" — 0.75, 1 and 1.5 ulp; interface economy, pp. 77–78.
- §3.3.1 "Parametric Designs" — external versus internal parameters, pp. 78–80.
- §3.3.3 "Error Budget and Design-Space Exploration" — Fig. 3.4, eq. (3.12), guard bits, pp. 83–84.
