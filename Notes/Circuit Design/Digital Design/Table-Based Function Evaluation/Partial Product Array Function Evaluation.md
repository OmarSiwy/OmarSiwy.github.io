---
title: Partial Product Array Function Evaluation
description: "Flattens a polynomial approximation and all its coefficients into weighted products of input bits, prunes the array, and partitions the survivors into tables — a bit heap that loses the continuity multipartite exploits."
kind: circuit
source: "ASA §17.3.2, pp. 526-527"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, bit-heap, polynomial, partial-products]
aliases:
  - Partial Product Arrays
  - Hassler-Takagi Method
---

# Partial Product Array Function Evaluation

Hassler and Takagi's method evaluates $f$ by expanding a polynomial approximation into a single bit heap of weighted AND-products of the input bits, pruning it, and partitioning the survivors into tables — the only table method here whose starting point is Boolean rather than numerical.

```tikz title="Degree-2 partial product array for a 4-bit input, with the pruning cut and the table partition"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % column weight header
  \node[font=\scriptsize] at (0.00,2.30) {$2^{-2}$};
  \node[font=\scriptsize] at (1.05,2.30) {$2^{-3}$};
  \node[font=\scriptsize] at (2.10,2.30) {$2^{-4}$};
  \node[font=\scriptsize] at (3.15,2.30) {$2^{-5}$};
  \node[font=\scriptsize] at (4.20,2.30) {$2^{-6}$};
  \node[font=\scriptsize] at (5.25,2.30) {$2^{-7}$};
  \node[font=\scriptsize] at (6.30,2.30) {$2^{-8}$};
  \draw[thin] (-0.55,2.05) -- (6.85,2.05);
  \node[font=\scriptsize,anchor=east] at (-0.65,2.30) {weight};

  % the array: one node per weighted product, stacked in its column
  \node[font=\scriptsize,draw,rounded corners,inner sep=1.5pt] at (0.00,0.35) {$x_1$};
  \node[font=\scriptsize,draw,rounded corners,inner sep=1.5pt] at (0.00,0.95) {$x_1x_2$};
  \node[font=\scriptsize,inner sep=1.5pt] at (1.05,0.35) {$x_1x_3$};
  \node[font=\scriptsize,draw,rounded corners,inner sep=1.5pt] at (2.10,0.35) {$x_2$};
  \node[font=\scriptsize,inner sep=1.5pt] at (2.10,0.95) {$x_1x_4$};
  \node[font=\scriptsize,inner sep=1.5pt] at (2.10,1.55) {$x_2x_3$};
  \node[font=\scriptsize,inner sep=1.5pt] at (3.15,0.35) {$x_2x_4$};
  \node[font=\scriptsize,inner sep=1.5pt] at (4.20,0.35) {$x_3$};
  \node[font=\scriptsize,inner sep=1.5pt] at (4.20,0.95) {$x_3x_4$};
  \node[font=\scriptsize,inner sep=1.5pt] at (6.30,0.35) {$x_4$};

  % second approximation: everything right of the cut is discarded
  \draw[dashed,thick] (3.70,-0.30) -- (3.70,2.05);
  \node[font=\scriptsize,anchor=west] at (3.85,1.75) {discarded:};
  \node[font=\scriptsize,anchor=west] at (3.85,1.42) {mass $\le 9\cdot 2^{-8}$};

  % input bus
  \node[font=\scriptsize,anchor=east] at (-0.65,0.95) {$X=\sum_{i=1}^{4}x_i2^{-i}$};
  \node[font=\scriptsize,anchor=east] at (-0.65,0.55) {$w_X=4$ bits};

  % survivors go down into tables, then a compressor tree
  \draw[->] (0.00,-0.05) -- (0.00,-0.75);
  \draw[->] (1.05,0.05) -- (1.05,-0.75);
  \draw[->] (2.10,-0.05) -- (2.10,-0.75);
  \draw[->] (3.15,0.05) -- (3.15,-0.75);
  \draw (-0.85,-0.75) rectangle (4.00,-1.45);
  \node[font=\scriptsize] at (1.575,-1.10) {partition into tables ($2^{k}\times n$ each)};
  \draw[->] (1.575,-1.45) -- (1.575,-2.05);
  \node[font=\scriptsize,anchor=west] at (4.15,-1.75) {table outputs, $n$ bits each};
  \draw (-0.85,-2.05) rectangle (4.00,-2.75);
  \node[font=\scriptsize] at (1.575,-2.40) {compressor tree $+$ final CPA};
  \draw[->] (1.575,-2.75) -- (1.575,-3.30);
  \node[font=\scriptsize,anchor=west] at (1.70,-3.15) {$R\approx f(X)$, $w_R$ bits};

  % legend for the boxed subset
  \node[font=\scriptsize,anchor=west] at (-0.85,-3.85)
    {boxed: support $\subseteq\{x_1,x_2\}$ $\Rightarrow$ one $2^2$-entry table of 4 bits replaces three rows};
\end{circuitikz}
\end{document}
```

**Start from an ordinary polynomial and refuse to build a multiplier for it.** The first approximation is the one everybody uses: replace $f$ on $[0,1)$ by

$$p(X)=\sum_{j=0}^{d} C_j X^j,$$

Taylor or minimax, of whatever degree the accuracy demands — see [[Polynomial Approximation]]. What makes this a *table* method rather than a Horner evaluator is that $p$ is never evaluated with arithmetic operators. The input is $w_X$ bits, $X=\sum_{i=1}^{w_X}x_i2^{-i}$ with $x_i\in\{0,1\}$ and $\ell_X=-w_X$, and every coefficient is a known constant. Both facts are exploited to dissolve the polynomial into Boolean products.

**Expand each power by the multinomial theorem, then collapse it with idempotence.** Substituting the bit expansion into $X^j$ and distributing gives $X^j=\sum_{i_1,\dots,i_j}2^{-(i_1+\cdots+i_j)}x_{i_1}\cdots x_{i_j}$, a sum over all $w_X^{\,j}$ ordered index tuples. Two Boolean laws shrink it. First, **idempotence of AND**, $x_i\wedge x_i=x_i$ — as arithmetic on a bit, $x_i^2=x_i$ — so a repeated index contributes nothing to the *product*, only to the *weight*. Second, **commutativity** lets tuples that are permutations of one another be merged. Every monomial therefore reduces to a squarefree product $\prod_{i\in S}x_i$ over a set $S$ of at most $j$ distinct indices, and only its weight remembers the multiplicities. At degree two this is worth writing out in full:

$$X^2=\sum_{i=1}^{w_X}2^{-2i}\,x_i\;+\;\sum_{1\le i<k\le w_X}2^{-(i+k)+1}\,x_ix_k,$$

the diagonal terms coming from $x_i^2=x_i$ and the off-diagonal ones doubled because the pair $(i,k)$ appears twice in the double sum. For $w_X=4$ and $X=\mathtt{0.1011}_2=11/16$: the diagonal gives $2^{-2}+2^{-6}+2^{-8}=69/256$, the cross terms $x_1x_3,x_1x_4,x_3x_4$ give $2^{-3}+2^{-4}+2^{-6}=52/256$, and $69+52=121=11^2$. That array of ten terms is what the diagram draws.

**Flatten the coefficients as well, and the multiplications vanish into wires.** Each $C_j$ is itself written as a sum of weighted bits, $C_j=\sum_k c_{j,k}2^{-k}$ (see [[Number Formats]] for the fixed-point conventions and for the two's-complement handling of negative $C_j$). Because $c_{j,k}$ is a *design-time constant*, the product $c_{j,k}\cdot 2^{-k}\cdot 2^{-e}\prod_{i\in S}x_i$ is not hardware: the row is either present in the array or absent from it. So the whole polynomial becomes one [[Bit Heaps|bit heap]] whose rows are AND-gates of input bits, at a cost of zero multipliers and zero adders — the additions all move into the heap. This is the same accounting as [[Sums of Weighted Bits]], with negative coefficient bits contributing negatively-weighted entries.

**Count the terms: exponential becomes polynomial, but the constant is savage.** The distinct squarefree monomials of degree at most $d$ number $\sum_{k=1}^{d}\binom{w_X}{k}=\Theta(w_X^{\,d})$, against $2^{w_X}$ entries for a plain table — a genuine change of asymptotics, and the reason the method exists at all. It is a bad bargain at realistic widths. At $w_X=16$ and $d=3$ that is $16+120+560=696$ distinct AND-products *before* the coefficient bits multiply the row count, each row landing somewhere in a heap $\sim 2w_X$ columns wide.

**The second approximation is pruning, and its error bound is a sum of magnitudes.** A row of weight $2^{-e}$ contributes at most $2^{-e}$ to the result, so deleting a set $D$ of rows perturbs $p(X)$ by at most $\sum_{r\in D}2^{-e_r}$ — no cancellation may be assumed, since the $x_i$ are adversarial. That bound must fit inside the error budget of [[Error Accuracy]] alongside the polynomial's own $\overline{\delta_{\text{approx}}}$ and the final rounding. It is exactly the reasoning of [[Truncated Multipliers]], applied to a heap that is not a multiplier. In the 4-bit array above, deleting the three rows of weight $\le 2^{-6}$ — $x_3$, $x_3x_4$ and $x_4$ — bounds the loss by $2^{-6}+2^{-6}+2^{-8}=9\cdot 2^{-8}=0.0352$, which is $0.56$ ulp at $\ell_R=-4$ and leaves under half an ulp for the final rounding: tight enough to show that the pruning depth *is* the design decision, not a cleanup pass.

**Partitioning turns sub-arrays back into tables, which is what makes this a table method.** Take any subset of surviving rows whose supports all lie inside a fixed set $T$ of $k$ input bits. Their weighted sum is a function of those $k$ bits alone, so it is a $2^k\times n$ ROM addressed by $T$, and the many rows collapse to one heap entry of $n$ bits. In the diagram the boxed rows — $x_1$ at $2^{-2}$, $x_1x_2$ at $2^{-2}$, $x_2$ at $2^{-4}$ — have support inside $\{x_1,x_2\}$, and tabulating them over the two address bits gives $\{0,16,64,144\}$ in units of $2^{-8}$. All four are multiples of $16$, so the table stores $\{0,1,4,9\}$ in **4 bits aligned at $2^{-4}$**: three AND/heap rows replaced by one lookup. What remains after all partitions is a short heap, reduced by a [[Compressor Trees|compressor tree]] and one final carry-propagate adder.

**On FPGAs the partition should be sized to the LUT, not to the bit count.** A $\lambda$-input LUT computes *any* function of $\lambda$ bits, so a partition over $k\le\lambda$ address bits costs exactly $n$ LUTs regardless of $k$ — the $2^{\max(k-\lambda,0)}\times n$ cost model of Sect. 16.4.2 (p. 492) is flat below the knee. Growing a table from $k=3$ to $k=\lambda=6$ address bits is therefore free, and any heuristic that scores partitions by table *bits* will systematically under-partition on an FPGA. On an ASIC the same move is not free: standard-cell area grows in both $k$ and $n$.

**Why it loses, and the diagnosis is the interesting part.** The implementation space — degree, coefficient formats, which rows to prune, how to partition the survivors — is enormous, which is the appeal and the problem: it can only be explored heuristically. The heuristic Hassler and Takagi chose produces architectures *less compact than their multipartite counterparts, and interestingly similar to them* (p. 527). The book's explanation is worth internalising because it generalises: flattening to partial products destroys the high-level property that multipartite exploits directly, namely **continuity**. Multipartite's offset table exists because $f(A+\varepsilon)\approx f(A)+\varepsilon f'(A)$ and neighbouring segments share a slope; once $f$ has been ground into AND-gates, the fact that nearby inputs have nearby outputs is invisible to the optimiser, and every structural saving must be rediscovered combinationally.

$$\boxed{\;p(X)=\sum_{j=0}^{d}C_jX^{\,j}=\sum_{\substack{S\subseteq\{1,\dots,w_X\}\\ |S|\le d}}\ \sum_{e}a_{S,e}\,2^{-e}\prod_{i\in S}x_i,\qquad a_{S,e}\in\{-1,0,1\}\ \text{fixed at design time}\;}$$

**Where it stops working.**

- **Small $w_X$.** At $w_X\le\lambda$ the entire function is one LUT-depth away: the 4-bit example costs $8$ LUTs as a plain $2^4\times 8$ ROM on a $\lambda=6$ device, and no array can beat that. The method only has room above the width where a plain table stops fitting.
- **Degree above two or three.** $\Theta(w_X^{\,d})$ is polynomial in $w_X$ but exponential in $d$; the row count outruns the compressor tree's ability to reduce it, and a real multiplier (or a DSP block) becomes cheaper than the array that replaced it.
- **The pruning bound is worst-case only.** Summing magnitudes over the deleted rows ignores every cancellation, so the bound is conservative and gets more conservative as more rows go — which pushes the search toward under-pruning.
- **No optimality claim exists.** Both the pruning and the partitioning are heuristic searches over a space with no known structure, so a result is only as good as the heuristic; there is no analogue of multipartite's $\alpha\gtrsim w_X/2$ argument to tell you when to stop.
- **Continuity-based tricks do not port.** Symmetry of the offset table, the $\overline{\delta}$ balancing argument, monotonicity reasoning — all of these are statements about $f$ as a function, not about its bit array, and none survive the flattening. [[Multipartite Methods]] takes over wherever they apply, which is most of the order-one range.

> [!warning] The book gives no numbers for this method
> Sect. 17.3.2 is two paragraphs (pp. 526–527) with no figure, no worked instance, no table sizes and no LUT counts — only the qualitative verdict "less compact ... and interestingly similar". The 4-bit array, the pruning bound and the $\{x_1,x_2\}$ table above are this note's own construction, checked by exhaustive simulation. Quantitative comparison against multipartite or against a Horner evaluator needs the original [HT95] and would have to be re-measured.

**The flattening step in RTL.** Only the array itself is synthesizable without a memory generator, so the block below is the degree-2 kernel of the diagram — the exact array and its pruned variant. The constant coefficients would gate further rows into the same heap, and the partition would replace sub-arrays with ROMs.

```spade
/// One row of the array: a weighted bit.
fn row(c: bool, weight: uint<8>) -> uint<8> {
    if c { weight } else { 0 }
}

/// Degree-2 partial product array for X = x / 16 on [0,1).
/// Returns 2^8 * X^2, exactly, as a sum of weighted products of the x_i.
entity ppa_square4(x: uint<4>) -> uint<8> {
    let b = x.as_bits();   // b[3] = x_1 (weight 2^-1) ... b[0] = x_4 (2^-4)
    // squares: x_i^2 = x_i, so each contributes 2^-2i
    row(b[3], 64) +. row(b[2], 16) +. row(b[1], 4) +. row(b[0], 1)
    // cross terms, each doubled: 2 * 2^-(i+k)
    +. row(b[3] && b[2], 64) +. row(b[3] && b[1], 32) +. row(b[3] && b[0], 16)
    +. row(b[2] && b[1], 16) +. row(b[2] && b[0],  8) +. row(b[1] && b[0],  4)
}

/// The same array with every row of weight <= 2^-6 deleted: x_3, x_3x_4, x_4.
entity ppa_square4_pruned(x: uint<4>) -> uint<8> {
    let b = x.as_bits();
    row(b[3], 64) +. row(b[2], 16)
    +. row(b[3] && b[2], 64) +. row(b[3] && b[1], 32) +. row(b[3] && b[0], 16)
    +. row(b[2] && b[1], 16) +. row(b[2] && b[0],  8)
}
```

Each `row` call is one node of the diagram: its `bool` argument is the AND of the input bits in $S$, its `weight` is $2^{8-e}$ for column $e$, and the whole array is purely combinational — no clock appears. The sum is written with the truncating `+.` rather than `+` because $256X^2\le 225$ never leaves 8 bits, whereas the widening `+` would grow the accumulator by one bit per row and refuse to type-check after the first. Synthesis will not build the ten-adder chain the code appears to describe: it flattens the whole entity into four-input logic, which is exactly the point of the partitioning step — and equally the reason the plain table wins at this width.

Simulated with `.zettel/sim.sh`: 3020 vectors, all passing. Four named vectors pin the weighting, including the asymmetric pair $\mathtt{0001}\to 1$ and $\mathtt{1000}\to 64$ that a reversed bit order would swap; all 16 inputs exhaustively against `x*x`; 3000 random inputs against the same reference, with the pruned entity checked against $0\le x^2-\hat{y}\le 9$ on every vector, the bound of $9\cdot 2^{-8}$ derived above.

**Related notes.**

- [[Sums of Weighted Bits]] – depends-on: the whole method's output is a heap in exactly this formalism, and its cost is the heap's cost.
- [[Bit Heaps]] – depends-on: the array is a bit heap whose rows are AND-gates rather than partial products of two numbers.
- [[Compressor Trees]] – depends-on: what reduces the surviving rows after partitioning, and the dominant delay term.
- [[Polynomial Approximation]] – supports: supplies the $C_j$ and the degree, and takes over entirely when the array grows past a real multiplier.
- [[Truncated Multipliers]] – compares: the same prune-the-low-columns-and-bound-the-mass argument, applied to a heap that really is a multiplier.
- [[Multipartite Methods]] – compares: strictly more compact here, because it exploits the continuity this method flattens away.
- [[Choosing a Table Method]] – compares: where this sits against every sibling in the chapter.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17 "Function Evaluation Using Tables and Additions".

- Sect. 17.3.2 "Partial Product Arrays", pp. 526–527 — the method, the two approximations, and the verdict against multipartite; cites [HT95] (Hassler and Takagi) and [SS99b].
- Sect. 17.2.12, p. 523 — why multipartite is close to optimal among order-one methods, the standard this method is measured against.
- Sect. 16.4.2 "Actual Cost of a ROM", p. 492 — the $2^{\max(k-\lambda,0)}\times n$ LUT cost model used for the partition-sizing argument.
