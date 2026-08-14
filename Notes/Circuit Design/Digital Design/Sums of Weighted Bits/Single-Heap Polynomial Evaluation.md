---
title: "Single-Heap Polynomial Evaluation"
description: "Expands a polynomial such as X−X³/6 directly into one heap using x^k=x and 2·2^p a = 2^(p+1) a, beating two chained multipliers on area for w<14 and always on latency because it is one compression instead of two; the 1/3 becomes an infinite tail of weighted bits, which truncation handles anyway."
kind: circuit
source: "ASA §7.2.3, pp. 164-167"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, bit-heap, polynomial, multiplier, fpga]
aliases:
  - Polynomial Bit Heap
  - Single Bit Heap Polynomial
  - Polynomial as a Single Bit Heap
---

# Single-Heap Polynomial Evaluation

A polynomial in a fixed-point variable is expanded term by term into **one** bit heap and compressed once, rather than evaluated by a chain of multipliers each of which builds and compresses a heap of its own.

```tikz title="Exact bit heap of X cubed for a 4-bit input"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
  % --- exact bit heap of X^3 for X = sum_{i=0..3} 2^i x_i, eq. (7.6) ---
  % column c is drawn at x = (9-c)*0.62, so the MSB column is leftmost
  \draw[gray!60] (-0.4,0.10) -- (5.95,0.10);
  \foreach \c in {0,...,9} {
    \node[font=\scriptsize,gray!70] at ({(9-\c)*0.62},-0.13) {$2^{\c}$};
  }
  % 4 dots: 2^{3i} x_i          (x_i^3 = x_i, idempotence)
  \foreach \c/\r in {0/0, 3/0, 6/0, 9/0} {
    \fill ({(9-\c)*0.62},{0.30+\r*0.34}) circle (0.075);
  }
  % 24 dots: 3(2^{i+2j}+2^{2i+j}) x_i x_j, the 3 expanded as two dots
  \foreach \c/\r in {1/0, 2/0,2/1,2/2, 3/1,3/2,3/3, 4/0,4/1,4/2,
                     5/0,5/1,5/2,5/3, 6/1,6/2,6/3, 7/0,7/1,7/2,
                     8/0,8/1,8/2, 9/1} {
    \draw ({(9-\c)*0.62},{0.30+\r*0.34}) circle (0.075);
  }
  % 8 dots: 3 . 2^{i+j+k+1} x_i x_j x_k
  \foreach \c/\r in {4/3, 5/4,5/5, 6/4,6/5, 7/3,7/4, 8/3} {
    \filldraw[fill=gray!55] ({(9-\c)*0.62},{0.30+\r*0.34}) circle (0.075);
  }
  % tallest column marker
  \draw[gray!60,dashed] (-0.4,2.11) -- (5.95,2.11);
  \node[anchor=west,font=\scriptsize] at (6.05,2.11)
    {$h_{\max}=6 \Rightarrow 3$ compression levels};
  \node[anchor=west,font=\scriptsize] at (6.05,1.55)
    {36 dots, 12-bit result};
  % legend
  \fill (0.0,-0.85) circle (0.075);
  \node[anchor=west,font=\scriptsize] at (0.18,-0.85) {$x_i$ at $2^{3i}$};
  \draw (2.1,-0.85) circle (0.075);
  \node[anchor=west,font=\scriptsize] at (2.28,-0.85) {$x_ix_j$};
  \filldraw[fill=gray!55] (3.6,-0.85) circle (0.075);
  \node[anchor=west,font=\scriptsize] at (3.78,-0.85) {$x_ix_jx_k$};
\end{circuitikz}
\end{document}
```

*after Fig. 7.15 and Fig. 7.16, pp. 166-167 — drawn for $w=4$ and for $X^3$ alone, where the book draws $X-X^3/6$ on a 16-bit input; the $\times 3$ is already expanded into pairs of dots.*

**Get the closure property to do the work.** [[Bit Heaps]] establishes that the sum of two heaps is a heap (concatenate the multisets — associativity of $+$) and the product of two heaps is a heap (distributivity, each cross term $2^{i+j}b_ic_j$ being one AND gate). By induction on the expression tree, **any multivariate polynomial with fixed-point inputs is a single sum of weighted bits**. Nothing forces you to stop at operator boundaries: the heap of $X^3$ is not the heap of $X^2$ fed into a second multiplier, it is the heap of the whole cube written out at once.

**Cube the heap and let idempotence collapse it.** Take $X$ in $\text{ufix}(m,\ell)$, i.e. $X=\sum_{\ell\le i\le m}2^ix_i$ on $w=m-\ell+1$ bits. The multinomial theorem gives (7.5),

$$X^3=\sum_{i}2^{3i}x_i^3+\sum_{\ell\le i\ne j\le m}3\cdot 2^{i+2j}x_ix_j^2+\sum_{\ell\le i<j<k\le m}6\cdot 2^{i+j+k}x_ix_jx_k .$$

Two rewrites make it a heap. First **idempotence of AND**: each $x_i\in\{0,1\}$, so $x_i^k=x_i$ — every squared and cubed variable flattens to a single dot, which is the whole reason a *bit* heap beats a numeric expansion. Second the **doubling rule** $2\cdot 2^pa=2^{p+1}a$, which merges the $6$ into the weight, since $6\cdot 2^{i+j+k}=3\cdot 2^{i+j+k+1}$. Folding the $i\ne j$ sum into $i<j$ pairs then yields (7.6), the boxed result below. Every $x_ix_j$ is one AND gate; every $x_ix_jx_k$ is one 3-input AND — on an FPGA both are absorbed into the LUT that already feeds the compressor input, so a dot with a product on it costs no more than a plain dot.

**Count the dots before believing the asymptotics.** The three sums of (7.6) contribute $w$, $w(w-1)$ and $w(w-1)(w-2)/6$ dots, so the heap grows as $\Theta(w^3)$. The alternative is two chained multipliers: a $w\times w$ producing $2w$ bits, then a $2w\times w$, for $w^2+2w^2=3w^2$ partial-product dots. Cubic loses to quadratic eventually, but the crossover is late — $3w^2<w+w(w-1)+w(w-1)(w-2)/6$ only from $w=15$ upward (the book says $w\ge14$; see the warning below). **Below that the single heap is simultaneously smaller and faster**, and the speed half holds at every width: the chain pays two rounds of compression plus a final adder in the middle, the heap pays one, and the depth of a [[Compressor Trees|compressor tree]] is only $\Theta(\log_{1.5}h_{\max})$ in the heap height, so absorbing a whole polynomial costs very few extra levels.

**Multiply by three without a multiplier.** $3=11_2$, so $3\cdot 2^pa=2^{p+1}a+2^pa$: one dot becomes two dots in adjacent columns (Fig. 7.14b, p. 164). That is what the diagram above shows — the 6 pair terms produce 24 dots, the 4 triples produce 8. If the exact $X^3$ is really wanted, the cheaper order is to compress everything that gets tripled down to two rows *first* and duplicate only those two rows, rather than duplicating each term.

**Let the constant divisor cancel the tripling.** For the book's set piece, the third-order Taylor sine $\sin X\approx X-X^3/6$, the $\times 3$ never has to be built: dividing (7.6) by $6$ turns $3/6$ into $1/2$, a weight shift, and leaves only the diagonal sum needing a genuine $1/3$. That is (7.7),

$$X-\frac{X^3}{6}=\sum_{\ell\le i\le m}2^ix_i-\frac13\sum_{\ell\le i\le m}2^{3i-1}x_i-\sum_{\ell\le i\ne j\le m}2^{i+2j-1}x_ix_j-\sum_{\ell\le i<j<k\le m}2^{i+j+k}x_ix_jx_k .$$

Only $w$ bits of the whole heap now need dividing by three, though the $2^{3i-1}$ weights spread them over $3w$ columns.

**Spend a divider, or spend an infinite tail.** Option one is a [[Division by Constants|constant divider]] by 3 specialised to inputs that are non-zero only at positions $3i-1$; it adds **one row** to the heap, arriving late, which does not matter because late bits are simply scheduled into later compression stages (Fig. 7.15a, p. 166). Option two removes the divider entirely by expanding the constant as bits: $\tfrac13=0.010101\ldots_2=\sum_{j\le-1}2^{2j}$ (geometric series with ratio $\tfrac14$), so the diagonal sum becomes $\sum_i\sum_{j\le-1}2^{3i-1+2j}x_i$ — a second, *infinite* triangular tail of dots, each of which is a **fanout of the same wire $x_i$**, not a gate. This is (7.8) and it is what Fig. 7.15b and Fig. 7.16 draw.

> [!warning] Typo in (7.8) and in the Fig. 7.16 label
> The book prints the tail as $\sum_{\ell\le i<j\le m,\ j\le-1}2^{3i-1-2j}x_i$. Both index and exponent are wrong. With $j\le-1$ the exponent $3i-1-2j$ *increases* without bound — for $i=0$ it gives $2^{1},2^{3},2^{5},\dots$, a divergent sum, where (7.7) requires the finite value $\tfrac13\cdot2^{-1}$. The sign must be $+$: $\sum_{j\le-1}2^{3i-1+2j}=2^{3i-1}\sum_{j\le-1}2^{2j}=\tfrac13 2^{3i-1}$. The constraint $i<j\le m$ is also stray — it is copied from the pair sum; $j$ here indexes the geometric tail and is unrelated to $i$ or to $m$.

**An infinite heap is finite once you round.** Every real operator outputs finitely many bits, so the heap gets truncated whether or not it was infinite to begin with; see [[Truncated Bit Heap]] for the two-parameter $(\ell_{\text{ext}},t)$ search and [[Error Accuracy]] for the faithfulness budget $\bar\delta_R<2^\ell$. The relevant fact here is that $\Delta^{\text{minor}}$ converges even for an infinite tail because $\sum_{i<p}2^i=2^p$, so the divergence-looking construction costs nothing. It is often possible to discard a large fraction of the exact heap and still be faithful, which is why the raw $\Theta(w^3)$ dot count overstates the real cost of both the heap and the two multipliers.

**Subtractions are not a special case.** The three negative sums in (7.7) enter as negatively-weighted bits, and $-2^ps=2^p\bar s-2^p$ turns each into a complemented bit plus a synthesis-time constant; all those constants collapse into a single row (see [[Constant-One Sign Extension]]). Signedness therefore costs inverters and one row, not one row per subtracted term, so the $-$ signs above do not change the dot count materially.

> [!important] Merging is not free: operator fusion trades against resource sharing. Flattening $\times\pi$, $Z^2/2$ and $Z^3/6$ into one heap recomputes the shared sub-expression $Z=\pi Y_{\text{red}}$ once per heap it was merged into (p. 160). One heap is right when the shared work is small relative to the compression it saves, and wrong when a sub-expression feeds many consumers.

On FPGA, add one more consideration the dot count does not see: the two-multiplier alternative can be mapped onto hardened DSP blocks, which are effectively free until you exhaust them, while the single heap spends LUTs. The crossover above is a fabric-neutral count of dots; on a device with spare DSPs the chain can win at any width, and on a device that has run out the heap wins at every width. Count the resource that is scarce, not the dots.

$$\boxed{\ X^3=\sum_{\ell\le i\le m}2^{3i}x_i+3\Big(\sum_{\ell\le i<j\le m}(2^{i+2j}+2^{2i+j})x_ix_j+\sum_{\ell\le i<j<k\le m}2^{i+j+k+1}x_ix_jx_k\Big)\ }$$

$$\text{one heap of } w+w(w-1)+\tfrac{w(w-1)(w-2)}{6}\text{ dots} \ \lessgtr\ \text{two multipliers of } 3w^2 \text{ dots, crossing at } w=15 .$$

> [!warning] The stated crossover $w\ge14$ is off by one
> Evaluate the book's own inequality (p. 165). At $w=14$ the heap has $14+182+364=560$ dots against $3\cdot14^2=588$ for the two multipliers — the heap is still the smaller of the two, so $3w^2$ is *not* smaller at $w=14$. The first width at which the multipliers win is $w=15$: $680$ dots versus $675$. Nothing else in the argument changes; the threshold should read $w\ge15$.

**When it breaks.**

- $w\ge15$: the cubic dot count overtakes $3w^2$ and the chained multipliers win on area. Latency still favours the single heap.
- Degree $d$ costs $\Theta(w^d)$ dots. The method is for low degree; for anything deep, [[Horner Evaluation]] with per-step truncation is the structure that keeps widths bounded.
- Shared sub-expressions get duplicated once per heap they are merged into. Fuse only where the shared work is cheap.
- If $X$ is itself computed (a range-reduced argument on $2w$ bits, say), the heap is built on *its* bits and explodes; the dot count is in the width of the actual heap inputs, not the nominal precision.
- The tail is infinite only if you keep it: without a truncation analysis, $1/3$ as bits is not implementable at all, so the technique depends on [[Truncated Bit Heap]] rather than merely benefiting from it.
- Idempotence $x^k=x$ is what kills the powers, so the trick applies to *bits*, never to a general summand. A heap containing a partial product $p=x_iy_j$ still obeys it ($p^2=p$), but a multi-bit intermediate does not.

**RTL (Spade).** The entity below is exactly (7.6) at $w=4$: 36 dots, sorted into the diagonal, pair and triple groups of the diagram, accumulated into a 12-bit heap value.

```spade
/// one dot: bit b at weight w, materialised in the 12-bit heap accumulator
fn dot(b: bool, w: uint<12>) -> uint<12> {
    if b { w } else { 0 }
}

/// 3 * 2^p a  ->  a dot at p and a dot at p+1   (rule 3x, Fig. 7.14b)
fn dot3(b: bool, w: uint<12>) -> uint<12> {
    dot(b, w) +. dot(b, w << 1)
}

/// X^3 for X = sum_{i=0..3} 2^i x_i, expanded by (7.6) into ONE heap.
fn cube_heap4(x: uint<4>) -> uint<12> {
    let b = x.as_bits();

    // sum 2^{3i} x_i     -- x_i^3 = x_i by idempotence of AND
    let diag = dot(b[0], 1) +. dot(b[1], 8) +. dot(b[2], 64) +. dot(b[3], 512);

    let p01 = b[0] && b[1];
    let p02 = b[0] && b[2];
    let p03 = b[0] && b[3];
    let p12 = b[1] && b[2];
    let p13 = b[1] && b[3];
    let p23 = b[2] && b[3];

    // 3 (2^{i+2j} + 2^{2i+j}) x_i x_j ,  i < j
    let pairs = dot3(p01, 4) +. dot3(p01, 2)
            +. dot3(p02, 16) +. dot3(p02, 4)
            +. dot3(p03, 64) +. dot3(p03, 8)
            +. dot3(p12, 32) +. dot3(p12, 16)
            +. dot3(p13, 128) +. dot3(p13, 32)
            +. dot3(p23, 256) +. dot3(p23, 128);

    // 3 * 2^{i+j+k+1} x_i x_j x_k ,  i < j < k
    let triples = dot3(p01 && b[2], 16)
              +. dot3(p01 && b[3], 32)
              +. dot3(p02 && b[3], 64)
              +. dot3(p12 && b[3], 128);

    diag +. pairs +. triples
}

entity cube4(x: uint<4>) -> uint<12> {
    cube_heap4(x)
}
```

`x.as_bits()[i]` is $x_i$ with index 0 the LSB, so `b[3]` is the black dot in column $2^9$ of the diagram; each `dot3` call emits the two adjacent dots of the $3x$ rule, and `p01 && b[2]` is one 3-input AND driving a triple dot. Widths: the result of $X^3$ on 4 bits is at most $15^3=3375<2^{12}$, so every accumulation uses the **truncating** `+.` (12 bits in, 12 bits out) — plain `+` would widen by one bit per term and never typecheck across 36 of them. The block is purely combinational and carries no structure: `+.` is written as an addition, and synthesis will *not* build 36 adders — it flattens the whole expression, which is precisely the point, since the compressor tree is the back end's job ([[Dadda Tree]], [[Compressor Trees]]) and not the algebra's.

**Related notes.**

- [[Bit Heaps]] – depends-on: closure of heaps under $+$ and $\times$ is what licenses expanding a whole polynomial into one heap.
- [[Truncated Bit Heap]] – depends-on: makes the infinite $1/3$ tail implementable and cuts the $\Theta(w^3)$ dot count down to what accuracy actually requires.
- [[Squarers and Integer Powers]] – extends: the same idempotence $x_i^k=x_i$ specialised to $X^2$, where the symmetry of the heap halves the pair terms.
- [[Horner Evaluation]] – compares: the opposite structuring, a chain of multiply-adds with bounded intermediate widths, which wins as the degree grows.
- [[Polynomial Approximation]] – supports: supplies the coefficients this note flattens; the $X-X^3/6$ example is its degree-3 minimax cousin.
- [[Division by Constants]] – supports: the alternative to expanding $1/3$ as bits, costing one late-arriving heap row.
- [[Constant-One Sign Extension]] – depends-on: how the minus signs of (7.7) become complemented bits plus one constant row.
- [[Merged Multiply-Accumulate]] – compares: the smallest instance of the same idea, one extra heap row instead of an adder behind the multiplier.
- [[CORDIC]] – counter-example: computes the same elementary functions with no polynomial and no heap at all, trading area for a per-bit iteration count.
- [[Compressor Trees]] – supports: the back end that turns whichever heap you built into a netlist.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.2.3 "Algebraic Optimizations", pp. 164-167 — Fig. 7.14 (dot transformations), eqs. (7.4)-(7.8), the $w=14$ crossover, Figs. 7.15-7.16.
- §7.2 pp. 158-160 — closure of bit heaps under sum and product; operator fusion versus resource sharing (Fig. 7.10).
- §7.2.2 pp. 162-163 — negatively-weighted bits and the single constant row.
- §7.2.4 pp. 167-173 — truncating an infinite heap for last-bit accuracy.
- §7.3.1 p. 176 — the $\Theta(\log_{1.5}h_{\max})$ compression depth quoted for the latency argument.
