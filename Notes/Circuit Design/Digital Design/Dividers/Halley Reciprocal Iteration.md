---
title: Halley Reciprocal Iteration
description: "Order-2 Householder: x_i(1 + e_i + e_i^2) triples the precision of the seed per step for one squarer and two multipliers, filling the gap between one and two quadratic steps."
kind: circuit
source: "ASA §9.5.2, p. 301"
status: seed
spade: simulated
tags: [digital, dividers, reciprocal, householder, fpga]
aliases:
  - Halley's Method
  - Halley Iteration
  - Householder Reciprocal Iteration
  - Order-2 Householder
  - Cubic Reciprocal Iteration
---

# Halley Reciprocal Iteration

The order-2 member of the Householder family, adapted so that it does not degenerate into the division it is meant to replace: it triples the correct bits of the reciprocal estimate per step instead of doubling them.

```tikz title="One Halley reciprocal iteration, folded onto one datapath"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small,
  blk/.style={draw, rounded corners=1pt, minimum width=2.3cm, minimum height=0.62cm},
  opb/.style={draw, minimum width=1.3cm, minimum height=0.62cm},
  wl/.style={font=\scriptsize, inner sep=1.5pt}]

% ---- main column -------------------------------------------------------
\node[blk] (mux) at (0, 0)     {mux};
\node[blk] (reg) at (0,-1.15)  {reg $x_i$};
\node[opb] (m1)  at (0,-2.35)  {$\times$};
\node[blk] (cmp) at (0,-3.50)  {$1-{}\cdot$};
\node[opb] (sq)  at (0,-4.65)  {$(\;)^2$};
\node[opb] (a1)  at (0,-5.80)  {$+$};
\node[opb] (m2)  at (0,-6.95)  {$\times$};
\node[opb] (a2)  at (0,-8.10)  {$+$};

\draw[->] (mux) -- (reg);
\draw[->] (reg) -- (m1);
\draw[->] (m1)  -- (cmp);
\draw[->] (cmp) -- (sq);
\draw[->] (sq)  -- (a1);
\draw[->] (a1)  -- (m2);
\draw[->] (m2)  -- (a2);

\node[wl, anchor=east] at (-0.10,-1.82) {$x_i$, 33\,b};
\node[wl, anchor=west] at (0.10,-2.93) {$Dx_i$, 33\,b};
\node[wl, anchor=west] at (0.10,-4.08) {$e_i$, 22\,b};
\node[wl, anchor=west] at (0.10,-5.23) {$e_i^2$, 11\,b};
\node[wl, anchor=west] at (0.10,-6.38) {$e_i+e_i^2$, 22\,b};
\node[wl, anchor=west] at (0.10,-7.53) {$x_i(e_i+e_i^2)$, 22\,b};

% ---- left-hand inputs --------------------------------------------------
\draw[->] (-3.9, 0)     -- (mux.west);
\draw[->] (-3.9,-2.35)  -- (m1.west);
\node[wl, anchor=east] at (-3.95, 0)    {seed table, 11 in / 12\,b};
\node[wl, anchor=east] at (-3.95,-2.35) {$D\in[1,2)$, 33\,b};

% ---- e_i bypass into the adder (left) ----------------------------------
\draw (0,-4.08) -- (-1.95,-4.08) -- (-1.95,-5.80);
\draw[->] (-1.95,-5.80) -- (a1.west);
\node[wl, anchor=east] at (-2.00,-4.95) {$e_i$};

% ---- x_i rail into both right-hand operands ----------------------------
\draw (0,-1.60) -- (2.15,-1.60) -- (2.15,-6.95);
\draw[->] (2.15,-6.95) -- (m2.east);
\draw (2.15,-6.95) -- (2.15,-8.10);
\draw[->] (2.15,-8.10) -- (a2.east);
\node[wl, anchor=west] at (2.20,-4.40) {$x_i$};

% ---- feedback ----------------------------------------------------------
\draw (0,-8.95) -- (3.60,-8.95) -- (3.60, 0);
\draw[->] (3.60, 0) -- (mux.east);
\draw (a2.south) -- (0,-8.95);
\node[wl, anchor=west] at (0.10,-8.62) {$x_{i+1}$, 33\,b};
\node[wl, anchor=west] at (3.65,-4.40) {feedback: $n$ steps};

\end{circuitikz}
\end{document}
```

*Own construction; the recurrence is (9.105), p. 301, and the widths are the 11-bit-table / 32-bit-reciprocal instance of that page.*

**Place Newton inside a family before asking what comes after it.** Newton-Raphson approximates $f$ near $x_i$ by its tangent — it uses $f(x_i)$ and $f'(x_i)$ and nothing else. The Householder method of order $d$ generalises this to a degree-$d$ local model built from derivatives up to the $d$-th; the higher the degree, the closer $x_{i+1}$ lands to the root, and the standing result is that an order-$d$ Householder method **multiplies the number of correct bits by $d+1$ at each iteration** (p. 301). Newton is $d = 1$ and doubles; $d = 2$ is Halley and triples. The cost of evaluating the model grows with $d$ too, so the family is only interesting for the first step or two past Newton.

**The textbook Halley formula collapses on this particular $f$, which is why it must be adapted.** Take the same zero-finding target as [[Newton-Raphson Reciprocal]], $f(x) = 1/x - D$, whose root is $1/D$, and substitute it into Halley's classical form $x_{i+1} = x_i - \dfrac{2ff'}{2f'^2 - ff''}$. With $f' = -1/x^2$ and $f'' = 2/x^3$,

$$ff' = -\frac{1}{x^3} + \frac{D}{x^2}, \qquad 2f'^2 - ff'' = \frac{2}{x^4} - \left(\frac{2}{x^4} - \frac{2D}{x^3}\right) = \frac{2D}{x^3}$$

— the $2/x^4$ terms cancel exactly — so the correction is $\dfrac{2ff'}{2f'^2-ff''} = \left(\dfrac{-2}{x^3}+\dfrac{2D}{x^2}\right)\dfrac{x^3}{2D} = x - \dfrac{1}{D}$ and the iteration reads $x_{i+1} = x_i - (x_i - 1/D) = 1/D$. It converges in one step to the exact answer, and it is useless: the "iteration" contains the division we were trying to build [Fly70]. This is the degeneracy the book means when it says the method must be *slightly adapted* [IP17] (p. 301).

**Recover a usable order-2 step from the series instead of from the derivatives.** Define the reciprocal remainder exactly as Newton does, $e_i = 1 - Dx_i$, so that $Dx_i = 1 - e_i$ and

$$\frac{1}{D} = \frac{x_i}{Dx_i} = \frac{x_i}{1-e_i} = x_i\left(1 + e_i + e_i^2 + e_i^3 + \cdots\right)$$

by the geometric series $\sum_{n\ge 0} u^n = 1/(1-u)$, valid because $|e_i| < 1$. This is (9.65) again, the identity behind the [[Quadratic Series Divider]]. Truncating it after three terms gives the adapted Halley iteration (9.105):

$$x_{i+1} = x_i\left(1 + e_i + e_i^2\right), \qquad e_i = 1 - Dx_i \tag{9.105}$$

and the general order-$d$ Householder step is the same series truncated after $d+1$ terms, with $e_i$ **recomputed from $D$** at every step rather than carried forward.

**One polynomial identity gives the whole family's convergence order.** Substitute (9.105) into the definition of the remainder and use $Dx_i = 1-e_i$:

$$e_{i+1} = 1 - Dx_{i+1} = 1 - (1-e_i)(1 + e_i + e_i^2) = 1 - (1 - e_i^3) = e_i^3$$

the middle step being the telescoping factorisation $(1-u)\sum_{n=0}^{d}u^n = 1-u^{d+1}$ at $d = 2$. So the remainder is *cubed* per iteration and the count of correct bits triples — and the same line at general $d$ gives $e_{i+1} = e_i^{d+1}$, i.e. the $\times(d+1)$ rule quoted above, proved rather than asserted. The relative error obeys the same law, since $\varepsilon_i = (x_i - 1/D)/(1/D) = Dx_i - 1 = -e_i$.

**It is self-correcting for the same reason Newton is.** Equation (9.105) is written in terms of the $x_i$ the register actually holds, not an ideal one: $e_i$ is re-derived from $D$ and the rounded $x_i$ every step, so a rounding error committed in iteration $i$ is measured by iteration $i+1$ and cubed away. That is the structural difference from [[Goldschmidt Division]], where the numerator error is never re-observed, and from the $Q$ datapath of the [[Quadratic Series Divider]], which propagates $e_{i+1} = e_i^2$ forward from the stored value instead of re-measuring it. The design rule inherited from Newton applies unchanged: keep the per-step rounding errors on the order of $e_i^3$ and near-cubic convergence survives. See [[Error Analysis]] for the ulp accounting.

**Three products per step, and only one of them is wide.** Reading (9.105) as hardware gives one multiplier for $Dx_i$, one squarer for $e_i^2$, and one multiplier for $x_i \cdot (\cdot)$ — *one squarer and two multipliers*, the cost the book quotes (p. 301). The widths are what make it affordable, and they follow from the error budget rather than from the algebra. Take the book's instance: an 11-input-bit seed table giving a 32-bit faithful reciprocal, so $D$ carries one integer bit and 32 fraction bits (33 b), the target LSB is $2^{-33}$, and the seed spans $2^{-1}\ldots2^{-12}$ (12 b) with $e_0 < 2^{-11}$.

- $Dx_i$ is a **rectangular** $33 \times 12$ product, wide only because $D$ is; $e_i = 1 - Dx_i$ then spans $2^{-12}\ldots2^{-33}$, 22 b, and must be that accurate because an error $\delta$ in $e_i$ passes into $x_{i+1}$ essentially undamped ($\partial x_{i+1}/\partial e_i = x_i(1+2e_i) \approx x_i$).
- $e_i^2 < 2^{-22}$, so above the target LSB it occupies only $2^{-23}\ldots2^{-33}$ — **11 b out, and it needs only the top 11 b of $e_i$ in**. A $2^{-11}$-relative squarer is a small one; see [[Squarers and Integer Powers]].
- $e_i + e_i^2$ is a 22-bit add whose operands barely overlap, and $x_i(e_i+e_i^2) < 2^{-11}$ needs 22 significant bits — a [[Truncated Multipliers|truncated multiplier]], not a full one, since everything below $2^{-33}$ is discarded anyway.
- The final $x_i + {\cdot}$ is written as an add rather than as $x_i \times (1+e_i+e_i^2)$ precisely because $1 + e_i + e_i^2$ is a 1 followed by eleven known zeros; multiplying by known zeros is waste, exactly as in the quadratic series. On a DSP-block FPGA with a fixed-width multiplier the two forms cost the same and the product form is fine.

**Truncate every product downward, and the loop invariant survives for free.** With exact arithmetic $e_{i+1} = e_i^3 \ge 0$ whenever $e_i \ge 0$, which is what a floor-rounded [[Reciprocal Seed Table]] delivers ($x_0 \le 1/D$). Rounding each product down can only decrease $x_{i+1}$, hence only increase $e_{i+1}$ above $e_i^3$ — never below zero. So $x_i \le 1/D$ holds for every $i$, the weight-$2^0$ bit of the estimate is never needed, and the convergence bound stays one-sided and easy to check in simulation.

**Iteration count, and what folding the loop costs.** With a seed accurate to $2^{m_0}$ and a target LSB $2^{\ell}$, cubic convergence needs $3^n |m_0| \ge |\ell|$, i.e.

$$n = \left\lceil \log_3 \frac{|\ell|}{|m_0|} \right\rceil$$

which for the book's $|m_0| = 11$, $|\ell| = 33$ is $n = 1$. Folding the datapath, as drawn above, costs a $33$-bit mux on the $x$ input, the $x$ register itself, a $\lceil \log_2 n\rceil$-bit iteration counter and a done comparator — and, far more expensively, it forces every block to be sized for the **last** iteration, because $|m_i| = 3^i|m_0|$ means the widths grow by a factor of three per step. A folded Halley operator therefore runs its first iteration on hardware three times wider than that iteration needs. At the precisions where Halley is actually attractive $n$ is 1 or 2, so the operator is unrolled in space and the loop control disappears entirely; the recurrence is *iterative* in derivation more than in silicon.

**Where it wins is a gap in the cost ladder, not a latency record.** One reciprocal-only quadratic step doubles the seed for two multipliers; two of them quadruple it for one squarer and three multipliers. Halley sits between: it triples for one squarer and two multipliers, so when the seed table and the target precision happen to be a factor of three apart — 11 bits in, 32 bits out — it delivers exactly what is needed and nothing more, saving the third multiplier. [IP17] show this to be the relevant choice on FPGAs for precisions up to 32 bits (p. 301). Note what it does *not* buy: the step is $\text{mult} \to \text{squarer} \to \text{mult}$ in series, three multiplier delays deep, whereas two quadratic steps are $\text{mult} \to (\text{squarer} \parallel \text{mult}) \to \text{mult}$, also three deep but quadrupling. The argument for Halley is area at a fixed precision ratio, not critical path.

$$\boxed{\ x_{i+1} = x_i\left(1 + e_i + e_i^2\right),\quad e_i = 1 - Dx_i \ \Longrightarrow\ e_{i+1} = e_i^3\ }$$

**When it breaks.**

- $|e_0| < 1$ is required for the series to converge at all, and $D$ must be bounded away from zero — this is a significand operator, $D \in [1,2)$, reached through [[Division by Reciprocal]]. It is not a general integer divider.
- $n = 1$ in the intended use, so the "iteration" is a single unrolled block. Building the folded loop drawn above buys nothing at $n=1$ and costs a mux, a counter and a datapath sized three times too wide for the only step it runs.
- If you can afford the third multiplier, two quadratic-series steps give $\times 4$ at the same multiplier depth. Halley wins only when the precision ratio you need is close to 3 and the extra $\times 4/\times 3$ would be thrown away.
- Above 32 bits the source stops claiming relevance; at double precision the reciprocal-specific quadratic iterations are what the book recommends (p. 291).
- Higher orders ($d \ge 3$) keep the same structure but the per-step evaluation cost grows faster than $\log(d+1)$, which is why the family is not pursued past Halley.

> [!warning] No area or delay figures for this iteration exist in the source
> Chapter 9 gives the operator count ("one squarer and two multipliers") and the 11-in/32-out table result, but no LUT, DSP or delay numbers, and no comparison against a synthesised quadratic-series divider. The width breakdown above is derived from the stated error budget, not measured. Sizing a real Halley operator needs a FloPoCo run or outside data.

**RTL (Spade).** One iteration, plus the register and seed mux that make it a loop.

```spade
/// One Halley (order-2 Householder) reciprocal iteration, 16 fraction bits.
///   d = D * 2^16, D in [1,2)     -> uint<17>
///   x = X * 2^16, X in (1/2,1],  X <= 1/D
fn halley_step(d: uint<17>, x: uint<17>) -> uint<17> {
    let one: uint<34> = 4294967296;          // 2^32
    let p: uint<34> = d * x;                 //  D*X       * 2^32
    let e: uint<34> = one -. p;              //  e         * 2^32
    let e2: uint<68> = e * e;                //  e^2       * 2^64
    let z32: uint<32> = 0;
    let eh: uint<68> = zext(e.concat(z32));  //  e         * 2^64
    let t: uint<68> = eh +. e2;              // (e + e^2)  * 2^64
    let xz: uint<68> = zext(x);
    let prod: uint<136> = xz * t;            //  X(e+e^2)  * 2^80
    let corr: uint<17> = prod.as_bits()[64..81].as_uint();
    x +. corr
}

/// The folded operator: one step per cycle, `start` loads the seed table value.
entity halley_recip(clk: clock, start: bool, d: uint<17>, seed: uint<17>) -> uint<17> {
    decl next;
    reg(clk) x: uint<17> reset(start: seed) = next;
    let next = halley_step(d, x);
    x
}
```

`p`, `e2` and `prod` are the three products of the diagram — the wide multiplier, the squarer and the truncated multiplier — and `x +. corr` is the final adder; `e.concat(z32)` is the alignment that lets $e_i$ (scale $2^{-32}$) and $e_i^2$ (scale $2^{-64}$) meet in one adder, and the slice `prod.as_bits()[64..81]` is the truncation back to the working scale, taking bit 64 as the new LSB. `halley_step` is pure combinational logic; the only state is the single `x` register, and `reset(start: seed)` **is** the seed mux drawn above — Spade's synchronous reset lowers to exactly that. Synthesis will not build the 136-bit multiplier literally: the note's widths say only 22 of those bits are ever read, so a real operator truncates `prod` and `e2` at generation time and maps to a handful of DSP tiles instead.

**Related Notes.**

- [[Newton-Raphson Reciprocal]] – extends: Halley is the same self-correcting scheme one Householder order up, cubing $e_i$ instead of squaring it.
- [[Quadratic Series Divider]] – compares: (9.105) is that note's series truncated at three terms with $e_i$ re-measured; two of its steps are the cost benchmark Halley is judged against.
- [[Goldschmidt Division]] – counter-example: same multiplicative family, but its error is never re-measured, so it gains none of the self-correction that makes recomputing $e_i$ worth the multiplier.
- [[Reciprocal Seed Table]] – depends-on: supplies $x_0$ and therefore $|m_0|$, which alone fixes the iteration count $\lceil\log_3(|\ell|/|m_0|)\rceil$.
- [[Division by Reciprocal]] – depends-on: the surrounding operator that restricts $D$ to $[1,2)$ and multiplies the reciprocal by $X$.
- [[Squarers and Integer Powers]] – supports: $e_i^2$ needs only 11 input bits here, which is where the squarer beats a general multiplier.
- [[Truncated Multipliers]] – supports: both products are faithful-to-$2^{\ell}$, not exact, and this is where that budget is spent.
- [[Table-Based Function Evaluation]] – compares: at these precisions a direct tabulated or piecewise-polynomial $1/D$ is the rival, not another iteration.
- [[Error Analysis]] – supports: the ulp and faithful-rounding accounting the $\ell$ and $m_0$ budget above is written in.
- [[Choosing a Divider]] – compares: where this sits against every sibling in the chapter.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.5.2 higher-order Householder methods, Halley's adapted reciprocal iteration (9.105), the $\times(d+1)$ bits-per-iteration rule, and the 11-input-bit table / 32-bit faithful reciprocal result [IP17], p. 301; degeneracy of the unadapted method [Fly70], p. 301.
- §9.4 quadratic series expansion, (9.65) and the cost of one and two steps, pp. 294–297.
- §9.3 reciprocal-based division, the $[1,2)$ domain and the faithful-rounding budget, pp. 288–294.
- References cited on p. 301: [Fly70] M. J. Flynn, "On Division by Functional Iteration", *IEEE Trans. Computers* C-19.8 (1970), pp. 702–706; [IP17] M. Iştoan and B. Pasca, "Flexible Fixed-Point Function Generation for FPGAs", *ARITH* (2017), pp. 123–130.
