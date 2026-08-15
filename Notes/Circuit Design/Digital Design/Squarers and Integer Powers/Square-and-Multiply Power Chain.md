---
title: "Square-and-Multiply Power Chain"
description: "Builds X^p from floor(log2 p) squarers and popcount(p)-1 multipliers; operator count is logarithmic in p but exact widths double at every stage."
kind: circuit
source: "ASA §14.3.2, pp. 449-451"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, exponentiation, iterative, fixed-point]
aliases:
  - Binary Exponentiation
  - Square-and-Multiply
  - Addition Chain Exponentiation
  - Computing Powers by Squaring and Multiplying
---

# Square-and-Multiply Power Chain

Evaluates $X^{p}$ as an addition chain of $\lfloor\log_2 p\rfloor$ squarings and $\mathrm{popcount}(p)-1$ multiplications — the only construction in this topic whose *operator count* is logarithmic in $p$, at the price of operator *widths* that double at every squaring.

```tikz title="Addition chain for X^34: five squarings and one multiplication, exact widths against clamped faithful widths"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
% operator boxes at x = 0, 2.15, 4.30, 6.45, 8.60, 10.75
\foreach \i/\lbl in {0/$(\cdot)^2$, 1/$(\cdot)^2$, 2/$(\cdot)^2$, 3/$(\cdot)^2$, 5/$(\cdot)^2$}{
  \draw[thick,fill=black!6] ({\i*2.15-0.42},-0.42) rectangle ({\i*2.15+0.42},0.42);
  \node[font=\small] at ({\i*2.15},0) {\lbl};}
% the one multiplier
\draw[thick,fill=blue!10] ({4*2.15-0.42},-0.42) rectangle ({4*2.15+0.42},0.42);
\node[font=\small] at ({4*2.15},0) {$\times$};
\draw[->,thick] ({4*2.15},1.05) -- ({4*2.15},0.42);
\node[font=\scriptsize,anchor=south] at ({4*2.15},1.07) {$X$ \ ($n$)};
% wires between operators
\draw[->,thick] (-1.95,0) -- (-0.42,0);
\foreach \i in {0,...,4}{\draw[->,thick] ({\i*2.15+0.42},0) -- ({\i*2.15+2.15-0.42},0);}
\draw[->,thick] ({5*2.15+0.42},0) -- ({5*2.15+1.95},0);
% node values on the wires
\node[font=\scriptsize,anchor=south] at (-1.25,0.10) {$X$};
\foreach \i/\v in {0/$X^{2}$, 1/$X^{4}$, 2/$X^{8}$, 3/$X^{16}$, 4/$X^{17}$}{
  \node[font=\scriptsize,anchor=south] at ({\i*2.15+1.075},0.10) {\v};}
\node[font=\scriptsize,anchor=south] at ({5*2.15+1.18},0.10) {$X^{34}$};
% exact widths (above), faithful clamped widths (below)
\node[font=\scriptsize,anchor=east] at (-1.98,0) {in};
\foreach \i/\e/\f in {-1/$n$/$w$, 0/$2n$/$w{+}1$, 1/$4n$/$w{+}2$, 2/$8n$/$w{+}3$,
                      3/$16n$/$w{+}4$, 4/$17n$/$w{+}5$}{
  \node[font=\scriptsize] at ({\i*2.15+1.075},0.62) {\e};
  \node[font=\scriptsize,blue!70!black] at ({\i*2.15+1.075},-0.62) {\f};}
\node[font=\scriptsize] at ({5*2.15+1.18},0.62) {$34n$};
\node[font=\scriptsize,blue!70!black] at ({5*2.15+1.18},-0.62) {$w{+}6$};
% legend
\node[font=\scriptsize,anchor=west] at (-2.60,1.95)
  {exact widths (top) --- each squaring doubles the width, so the last squarer is $17n$ bits wide};
\node[font=\scriptsize,anchor=west,blue!70!black] at (-2.60,-1.35)
  {faithful widths (bottom) --- every operator truncated to the output width $w$ plus one guard bit per operation};
\node[font=\scriptsize,anchor=west] at (-2.60,-1.90)
  {$p=34=100010_2$: $\lfloor\log_2 34\rfloor=5$ squarings $+\ (k-1)=1$ multiplication, $k=\mathrm{popcount}(34)=2$};
\end{circuitikz}
\end{document}
```

*Own construction, drawing eq. (14.10), p. 450, with the guard-bit sizing rule of p. 451.*

**Rule out the direct expansion before reaching for a chain.** Expanding $X^{p}$ over the bits of $X$ pays off exactly once. At $p=2$, idempotence $x_i^2=x_i$ collapses the square's own diagonal and the symmetry $x_ix_j=x_jx_i$ folds the off-diagonal pairs, halving the bit heap ([[Folded Array Squarer]]). At $p=3$ the multinomial coefficient $3$ appears and $3x=2x+x$ merely *replicates* a bit at two adjacent weights rather than cancelling anything, so the heap already grows as $n^{3}$ ([[Cube Bit Heap]]). Beyond that there is nothing left to collapse, and the source's own verdict on the direct cube is that it "is not very interesting" (p. 450). $X^{4}$ is better built as $(X^{2})^{2}$, and that observation generalises into the whole construction below.

**Turn exponentiation into a recurrence on the exponent, not on the operand.** Two exponent laws do all the work: $X^{a+b}=X^{a}X^{b}$ and $X^{2a}=(X^{a})^{2}$. Writing $p$ in binary and recursing on its length gives

- $p=2q$ even: $X^{p}=(X^{q})^{2}$ — one squaring,
- $p=2q+1$ odd: $X^{p}=X\cdot(X^{q})^{2}$ — one squaring and one multiplication.

Unrolled for $p=34$ this is the addition chain drawn above:

$$X^{34}=\big(X^{17}\big)^{2}=\big(X\cdot X^{16}\big)^{2}=\Big(X\cdot\big(X^{8}\big)^{2}\Big)^{2}=\dots=\left(X\cdot\left(\big(\big(X^{2}\big)^{2}\big)^{2}\right)^{2}\right)^{2}\tag{14.10}$$

**Count the operators from the binary representation of $p$ alone.** Each recursion step halves $p$, so the recursion has depth $\lfloor\log_2 p\rfloor$ and contributes exactly that many squarings. A multiplication is emitted only on an odd step, i.e. once per set bit of $p$ — except the leading set bit, which is consumed by the base case $X^{1}=X$ and costs nothing. With $k=\mathrm{popcount}(p)$:

$$\text{cost}(p)=\lfloor\log_2 p\rfloor\ \text{squarings}\ +\ (k-1)\ \text{multiplications}.$$

For $p=34=100010_2$, $k=2$: five squarings and one multiplication, against the $33$ multiplications a naive left-to-right product would need.

**Price the exact version by its last operator, not by its operator count.** Take $X\in\mathrm{ufix}(m,\ell)$, so $X$ is $n=m-\ell+1$ bits and the exact $X^{p}$ lives in $\mathrm{ufix}\big(p(m+1),\,p\ell\big)$ — roughly $pn$ bits, as fixed by the format rules in [[Number Formats]]. Every squaring *doubles* the width of its operand, so the wires down the chain carry $n,2n,4n,8n,16n$ bits, the multiplier sees $16n\times n\to 17n$, and the final squarer is a $17n\to 34n$ operator. A plain squarer on $N$ bits emits a heap of $N(N+1)/2$ bits, so the heap sizes along the chain form a geometric series of ratio $4$: the last squarer alone carries about three quarters of the total. The operator count is logarithmic in $p$ and the total *area* is quadratic in $pn$ — "this solution can become quite expensive" (p. 450). Nothing about the chain's shape can fix this, because the width growth is a property of the exact result, not of the schedule.

**Read the exponent left to right and the chain becomes a fixed-width iteration.** Equation (14.10) is a right-to-left reading: it recurses on $q=\lfloor p/2\rfloor$ and builds the nesting from the inside out, which is a *chain of distinct operators*. Scanning the bits of $p$ from MSB to LSB instead turns the same identity into a single accumulator update. Let $p$ have $L=\lfloor\log_2 p\rfloor+1$ bits $p_{L-1}\dots p_0$ with $p_{L-1}=1$ by definition. Seed the accumulator with the leading bit — $A_0=X$ — and consume one further bit per step. The operator count is unchanged; what changes is that there is now **one** squarer and **one** multiplier, reused for $L-1$ cycles.

**Clamping is what makes that iteration implementable at all.** A recurrence needs a state of fixed width, and the exact accumulator doubles every step, so exactness and iteration are mutually exclusive here. They become compatible in the one case that matters in practice: when $X$ arrives in $\mathrm{ufix}(-1,\ell)$ or $\mathrm{sfix}(0,\ell)$ we have $|X|<1$, hence $|X^{p}|<1$, and the output almost always uses the *same* format — so the result has to be truncated anyway (p. 451). Limit every intermediate to the output width $w$ plus a few guard bits and use only truncated squarers ([[Truncated Squarer]]) and truncated multipliers; the widths then stay flat down the chain, as the lower row of the diagram shows. The source's sizing rule is **one guard bit per squaring or multiplication** (p. 451), which is why the final wire is $w+6$ for $p=34$. Correct rounding is not on the table — deciding the last bit needs the exact tail ([[Error Accuracy]]) — but a faithful result is, and the error budget is [[Faithful Fixed-Point Power]]'s subject.

> [!warning] Not covered in the source — needs outside research
> The one-guard-bit-per-operation rule is stated without derivation: "We do not provide a detailed error analysis here" (p. 451). Errors from truncated squarers and truncated multipliers compound multiplicatively down a chain of length $\log_2 p$, and the source gives no bound on the accumulation.

**On FPGA the iterative form is the one that pays.** A squarer maps onto fewer DSP blocks than a general multiplier of the same width — a 2-way split needs $3$ DSPs instead of $4$ — so every stage is individually cheaper than a multiplier ([[Choosing a Squarer]]). But an unrolled chain instantiates $\lfloor\log_2 p\rfloor$ of those operators, each a different width, and none can share a DSP with another. Folding the chain into the recurrence below amortises a single DSP-resident squarer over $\log_2 p$ cycles and, unlike the unrolled chain, accepts $p$ as a **runtime input** rather than a synthesis parameter: the exponent is just a shift register feeding one bit per cycle. On ASIC, where the unrolled chain can be pipelined at full throughput, the trade reverses.

$$\boxed{\;A_0 = X,\qquad A_i = A_{i-1}^{2}\cdot X^{\,p_{L-1-i}}\quad(1\le i<L),\qquad X^{p}=A_{L-1}\;}$$

with $L=\lfloor\log_2 p\rfloor+1$, costing $\lfloor\log_2 p\rfloor$ squarings and $\mathrm{popcount}(p)-1$ multiplications.

**When it breaks**

- **Exact mode, any interesting $p$.** The $17n\to 34n$ final squarer for $p=34$ is not a rounding error in the cost model, it *is* the cost model. Exact square-and-multiply is only defensible for tiny $p$ and narrow $n$.
- **$p=2$ and $p=3$.** At $p=2$ the chain degenerates to one [[Folded Array Squarer]]. At $p=3$ a fused [[Cube Bit Heap]] shares one compressor tree and one carry-propagate adder, where square-then-multiply pays two of each — the chain only starts winning once $\lfloor\log_2 p\rfloor$ exceeds the number of heaps you would otherwise fuse.
- **Binary exponentiation is not the minimal addition chain.** For $p=15=1111_2$ the rule gives $3+3=6$ operations, but $X^2,\,X^3=X^2\!\cdot\!X,\,X^6,\,X^{12},\,X^{15}=X^{12}\!\cdot\!X^{3}$ needs $5$. The gap is bounded and small, but for a fixed compile-time $p$ a shortest-addition-chain search is strictly better. The source does not discuss optimal chains.
- **Precisions of 8 bits and below.** Plain tabulation of $X^{p}$ beats every architecture here and delivers correct rounding for free (p. 451).
- **Correct rounding at any width.** Unreachable without the exact $X^{p}$, so the clamped iteration is faithful-only by construction.

**RTL (Spade)**

One iteration of the recurrence. `acc` is the accumulator $A_i$; its synchronous load path implements $A_0=X$, and each subsequent clock edge applies one step of the boxed recurrence for one exponent bit.

```spade
/// Keep the top W bits of a W x W fixed-point product: both operands are
/// ufix(-1,-W), so the exact product is ufix(-1,-2W) and we truncate the tail.
fn fixmul<#uint W>(a: uint<W>, b: uint<W>) -> uint<W> {
    trunc((a * b) >> W)
}

/// One iteration of left-to-right binary exponentiation, clamped to W bits.
/// `start` loads acc <- X (the leading exponent bit is always 1); every other
/// cycle squares acc and, when this cycle's exponent bit is set, multiplies by X.
entity power_step<#uint W>(clk: clock, start: bool, x: uint<W>, pbit: bool) -> uint<W> {
    reg(clk) acc: uint<W> reset(start: x) =
        if pbit { fixmul(fixmul(acc, acc), x) } else { fixmul(acc, acc) };
    acc
}
```

`acc` is the horizontal wire of the diagram, folded back on itself: the grey $(\cdot)^2$ box is the inner `fixmul(acc, acc)` and the blue $\times$ box is the outer `fixmul(_, x)`, gated by `pbit`. `a * b` widens to $2W$ bits and `>> W` keeps the high half — the truncation the lower row of the diagram calls $w$ plus guard bits, with the guard bits left to the caller's choice of $W$. Everything is combinational except the one accumulator register, so the critical path is squarer-then-multiplier in series; synthesis will *not* build two independent multipliers as drawn, and on FPGA the `pbit` mux is what stops both `fixmul` calls collapsing into one DSP. A full operator wraps this with a down-counter and a shift register holding $p$, which is the entire loop-control cost: $\lceil\log_2 L\rceil$ flip-flops for the counter, $L$ for the exponent, one comparator for `done`.

**Related Notes**

- [[Folded Array Squarer]] – depends-on: every $(\cdot)^2$ box in the chain is one of these, and its $n(n+1)/2$ heap is what makes the last stage dominate.
- [[Multipliers]] – depends-on: the $k-1$ odd steps are ordinary multipliers with no symmetry to exploit.
- [[Horner Evaluation]] – compares: reaches the same powers by a different addition chain, one multiply-add per degree, and is the right choice when *all* the powers are wanted rather than one.
- [[Truncated Squarer]] – supports: supplies the clamped squaring the fixed-width recurrence depends on.
- [[Faithful Fixed-Point Power]] – extends: takes the clamped chain and asks what the accumulated error actually is.
- [[Cube Bit Heap]] – counter-example: at $p=3$ fusing into one heap beats chaining two operators.
- [[Choosing a Squarer]] – compares: places the per-stage squarer against its siblings, including the DSP counts quoted above.
- [[Number Formats]] – depends-on: fixes $\mathrm{ufix}(p(m+1),p\ell)$ as the exact output format.
- [[Error Accuracy]] – depends-on: why correct rounding needs the exact tail and faithful rounding does not.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chap. 14, *Fixed-Point Squares, Cubes, and Other Integer Powers*:

- §14.3.1 Direct Algebraic Expression — eqs. (14.7)–(14.8), the factor-3 replication, "not very interesting", $X^4=(X^2)^2$, pp. 449–450
- §14.3.2 Computing Powers by Squaring and Multiplying — the even/odd recursion, eqs. (14.9)–(14.10), the $\lfloor\log_2 p\rfloor + (k-1)$ cost, "this solution can become quite expensive", p. 450
- §14.3.3 Approximate Fixed-Point Powers — $|X|<1\Rightarrow|X^p|<1$, truncated squarers and multipliers, one guard bit per operation, tabulation at very small precisions, p. 451
- §14.1 Generalities — exact output format from the input format, pp. 443–444
- Cited work: [PBM01] Piñeiro, Bruguera & Muller, *Faithful Powering Computation Using Table Look-Up and a Fused Accumulation Tree*, ARITH 2001 (cited on p. 451)
