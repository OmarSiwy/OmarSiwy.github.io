---
title: Bit Heaps
description: "One canonical form — a multiset of weighted bits — that swallows partial products, table outputs, sign-extension and rounding constants alike, so every operator reduces to one summation problem; costs you the word-level structure that made resource sharing obvious."
kind: concept
source: "ASA §7.1, pp. 152-161"
status: seed
spade: verified
tags: [digital, sums-of-weighted-bits, bit-heap, compressor, carry-save]
aliases:
  - Bit Heap
  - Bit Array
  - Dot Diagram
  - Weighted Bits
---

# Bit Heaps

A bit heap is a finite multiset of *weighted bits* $(i,b)$ evaluated as $\sum 2^i b$ — the one intermediate form in which a multiplier, an accumulator, a polynomial and a filter become the same problem, because it deliberately forgets which word each bit came from.

```tikz title="The 16 partial products of a 4x4 multiplier, first as four rows, then as a heap of seven columns"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % --- Fig 7.1: the 16 partial products, still organised as four rows ---
  \foreach \j in {0,...,3}
    \foreach \i in {0,...,3}
      \node[draw,ellipse,inner sep=1pt,font=\tiny,minimum width=0.88cm]
        at ({-1.0*(\i+\j)}, {3.0-0.62*\j}) {$x_\i y_\j$};
  \foreach \j in {1,2,3} \node[font=\small] at (1.0,{3.0-0.62*\j}) {$+$};
  \node[anchor=west,font=\footnotesize] at (1.45,1.76)
    {4 rows of 4 bits, one AND gate each};

  % --- position / weight axis ---
  \draw[->] (0.6,0.0) -- (-6.7,0.0);
  \foreach \c in {0,...,6} {
    \draw (-1.0*\c,-0.12) -- (-1.0*\c,0.12);
    \node[anchor=north,font=\tiny] at (-1.0*\c,-0.16) {\c};
    \node[anchor=south,font=\tiny] at (-1.0*\c,0.16) {$2^{\c}$};
  }
  \node[anchor=west,font=\footnotesize] at (0.75,0.42) {weight};
  \node[anchor=west,font=\footnotesize] at (0.75,-0.42) {position};

  % --- forgetting the rows ---
  \node[font=\large] at (-3.0,-1.25) {$\Downarrow$};
  \node[anchor=west,font=\footnotesize] at (-2.7,-1.25)
    {commutativity: the order inside a column carries no information};

  % --- Fig 7.2: the same 16 bits as a heap of columns ---
  \foreach \c/\h in {0/1,1/2,2/3,3/4,4/3,5/2,6/1}
    \foreach \r in {1,...,\h} \fill (-1.0*\c,{-3.5+0.38*\r}) circle (3pt);
  \node[anchor=east,font=\small] at (-6.7,-2.6) {$\mathcal{B}$};
  \node[anchor=west,font=\footnotesize] at (0.75,-2.6)
    {16 bits, 7 columns, $h_{\max}=4$};
  \node[anchor=north,font=\footnotesize] at (-3.0,-3.35)
    {column heights $1,2,3,4,3,2,1$;\quad $V(\mathcal{B})=X\times Y$ on 8 bits};
\end{circuitikz}
\end{document}
```

*after Fig. 7.1, p. 153 and Fig. 7.2, p. 154.*

**Start from the identity binary arithmetic has already committed to.** A $w_X$-bit unsigned integer is by definition a sum of weighted bits (7.1, p. 152),

$$X=\sum_{i=0}^{w_X-1}2^i x_i ,$$

where $2^i$ is the *weight* and $i$ the *position* of $x_i$. Position and weight are in bijection, so "the bit at position $i$" and "the bit of weight $2^i$" name the same object, and the book indexes a bit by its position even when that position is negative — a fractional bit of a fixed-point value sits at $i<0$ with no change of machinery ([[Signed Fixed-Point Format]]). A **bit heap** generalizes this to a finite multiset $\mathcal{B}$ of pairs $(i,b)$ with $b\in\{0,1\}$, of value

$$V(\mathcal{B})=\sum_{(i,b)\in\mathcal{B}}2^i\,b .$$

*Multiset*, not set: three distinct bits may all sit at position $i$, and their multiplicity — the column height $h_i$ — is exactly what drives the cost model of everything downstream.

**A multiplication is nothing but a heap, once distributivity is applied twice.** Expanding the product of two binary integers (7.2–7.3, p. 153),

$$X\times Y=\Big(\sum_{i=0}^{w_X-1}2^ix_i\Big)\Big(\sum_{j=0}^{w_Y-1}2^jy_j\Big)=\sum_{i=0}^{w_X-1}\sum_{j=0}^{w_Y-1}2^{i+j}x_iy_j$$

by distributivity of $\times$ over $+$, applied once per factor. Every term $x_iy_j$ is a single weighted bit of position $i+j$ produced by one AND gate: $w_Xw_Y$ gates, all independent, one gate delay, no carry anywhere. The heap spans positions $0\dots w_X{+}w_Y{-}2$ with column heights $1,2,\dots,\min(w_X,w_Y),\dots,2,1$, and the result occupies $w_X+w_Y$ bits. Nothing in a multiplier is difficult *except* evaluating that heap — which is why the multiplier as a component largely dissolves in this framework and reappears as a heap-generation rule plus a shared summation engine.

> [!important] The whole framework follows from two axioms
> $V(\mathcal{B})$ is defined by a **sum**, and addition in $\mathbb{Z}$ is **commutative** and **associative**. Commutativity says the vertical order inside a column carries no information — nothing distinguishes $x_3y_0$ from $x_0y_3$ once both are known to weigh $2^3$. Associativity says any bracketing of that sum computes the same value: by rows (paper-and-pencil, a chain of adders), by columns (a compressor tree), or by neither. Every architecture in this topic is a different bracketing of the *same* expression, and nothing but these two laws licenses the reordering.

**A compressor is any weight-preserving rewriting of a sub-multiset.** A circuit mapping input bits at positions $p_k$ to output bits at positions $q_k$ is a compressor exactly when

$$\sum_{k}2^{p_k}\,\mathrm{in}_k \;=\; \sum_{k}2^{q_k}\,\mathrm{out}_k$$

holds for *every* input assignment. That equality is the entire correctness condition: by associativity, replacing a sub-multiset of $\mathcal{B}$ by the compressor's outputs leaves $V(\mathcal{B})$ unchanged, so a tree of them is a sequence of purely local rewrites that never has to be argued about globally. The [[Full Adder]] is the smallest useful one — three bits $a_k,b_k,c_k$ of weight $2^k$ in, a sum bit $s_k$ of weight $2^k$ and a carry $c_{k+1}$ of weight $2^{k+1}$ out, valid because $a+b+c\in\{0,1,2,3\}$ and $2c_{k+1}+s_k$ spans exactly that range (Fig. 7.3, p. 154). Three dots in, two dots out. Crucially the carry is never *propagated* inside the tree; it is simply a dot deposited in the next column, which is [[CSA, Carry-Save Adder|carry-save arithmetic]] generalized from a fixed row structure to an arbitrary multiset. The tree is combinational with no carry chain at all, and only the final adder — 2 rows, up to $w_X+w_Y$ bits — ever propagates.

**Closure under $+$ and $\times$ is what upgrades this from a trick to a substrate.** The sum of two bit heaps is a bit heap: concatenate the multisets, legal by associativity. The product of two bit heaps is a bit heap: distribute exactly as in the $X\times Y$ derivation above, and each cross term $2^{i+j}b_ic_j$ is one AND gate. By induction over an expression tree, **any multivariate polynomial with fixed-point inputs is a single sum of weighted bits** (p. 159). That one sentence covers complex products, sums of squares for linear algebra and signal transforms, polynomial approximations of elementary functions, and digital filters. Bits may equally come from a table lookup rather than a gate, which pulls table-based evaluation into the same summation problem; and constants — half-ulps for rounding, sign-extension rows — are just further bits whose values are known at synthesis time ([[Constant-One Sign Extension]], [[Error Analysis]]).

**The shape is ragged, which is why "heap" and not "array".** The multiplier literature calls the dot diagram a *bit array*, which suggests a rectangle; real heaps look nothing like one (Fig. 7.9, p. 158 shows six from FloPoCo — a truncated multiplier's staircase, an FIR filter's stepped block, a DSP-mapped heap that is one thin row). A multiply-accumulate $XY+A$ is the product's heap with one extra row of $n$ bits appended (Fig. 7.8, p. 157): at most one extra compression level of delay and an area overhead linear in $n$, against a separate adder behind the multiplier costing $n$ in both delay and area, or $\log n$ delay and $n\log n$ area with a fast adder (p. 157, [[Merged Multiply-Accumulate]]). The saving comes entirely from refusing to resolve the multiplier's two carry-save rows before the accumulation.

**The forgetting is not free.** An operator usually contains *several* heaps, and merging them all into one is not automatically better (Fig. 7.10, p. 159, a fixed-point sine/cosine datapath). Merging the $\times\pi$ stage into $Z^2/2$ and into $Z^3/6$ means the shared intermediate $Z=\pi Y_{\text{red}}$ is computed twice, once inside each merged heap — **operator fusion trades directly against resource sharing** (p. 160). The heap is precisely the level at which word-level structure has been discarded, and word-level structure is what made the sharing visible in the first place.

**Splitting the design flow at the heap is the architectural payoff.** Fig. 7.11 (p. 160) places an algorithmic front end above the heap — adder, multi-adder, multiplier, constant multiplier, complex product, polynomial, elementary function, filter — and an architecture generator below it, targeting one ASIC node or one FPGA family. The two halves meet only at the multiset, so each algorithm is optimized for every technology for free, and each new compression heuristic benefits every operator at once. This is also where the ASIC and FPGA paths genuinely diverge, and they diverge *only* below the line: an ASIC back end covers the heap with full adders and [[4-2 Compressor|4:2 compressors]] chosen for cell area and gate delay, while an FPGA back end covers the same heap with [[Generalized Parallel Counter|generalized parallel counters]] shaped by the LUT's fixed input count and the hard carry chain. When a new device appears, only the compressor-tree generator is retargeted; no operator is touched.

$$\boxed{\ V(\mathcal{B})=\!\!\sum_{(i,b)\in\mathcal{B}}\!\!2^i b\quad\text{is invariant under any rewrite satisfying}\quad \sum_k 2^{p_k}\mathrm{in}_k=\sum_k 2^{q_k}\mathrm{out}_k\ }$$

**When it breaks.**

- **Height-1 columns are not a summation problem.** The lowest columns of a multiplier heap have height 1; those bits bypass the compressor tree *and* the final adder entirely. A cost model that charges for them is wrong at small widths, where they are a visible fraction of the operator.
- **Negative weights are outside the definition.** $V(\mathcal{B})$ is a sum of non-negative terms. A signed summand only enters after $-2^p s = 2^p\bar s - 2^p$ is applied, which pushes a synthesis-time constant into a separate constant row ([[Constant-One Sign Extension]]).
- **A heap can be infinite.** Merging a division by a constant produces $1/3 = 0.010101\dots_2$, an unbounded tail of weighted bits. That is harmless only because the output is truncated to a target ulp anyway ([[Truncated Bit Heap]]); as an exact object the heap does not terminate.
- **Cubic growth catches up.** Expressed as a single heap, $X^3$ contributes $w + w(w-1) + w(w-1)(w-2)/6$ terms against $3w^2$ for two chained multipliers, so the single heap wins only for $w<14$ (p. 165, [[Single-Heap Polynomial Evaluation]]).
- **Merging past a certain radius loses more than it saves.** See Fig. 7.10 above: recomputation of a shared subexpression costs more than the compression level it removed.
- **Hard blocks are not free to reshape.** When bits arrive from an FPGA DSP block rather than from LUT logic, the heap's shape is dictated by the block's output format and the tiling decision, not by the algorithm ([[Multiplier Tiling]]).

**RTL (Spade).**

```spade
/// Height of one column, i.e. how many of its weighted bits are 1.
fn column_height(col: [bool; 4]) -> uint<3> {
    let b0: uint<3> = zext(col[0].as_uint());
    let b1: uint<3> = zext(col[1].as_uint());
    let b2: uint<3> = zext(col[2].as_uint());
    let b3: uint<3> = zext(col[3].as_uint());
    b0 +. b1 +. b2 +. b3
}

/// The bit heap of a 4x4 unsigned multiplier: column c holds the bits of
/// weight 2^c. Real heaps are ragged (heights 1,2,3,4,3,2,1) but a Spade array
/// is rectangular, so short columns are padded with constant `false`.
fn and_array(x: uint<4>, y: uint<4>) -> [[bool; 4]; 7] {
    let a = x.as_bits();
    let b = y.as_bits();
    [[a[0] && b[0], false,          false,          false         ],
     [a[0] && b[1], a[1] && b[0],   false,          false         ],
     [a[0] && b[2], a[1] && b[1],   a[2] && b[0],   false         ],
     [a[0] && b[3], a[1] && b[2],   a[2] && b[1],   a[3] && b[0]  ],
     [a[1] && b[3], a[2] && b[2],   a[3] && b[1],   false         ],
     [a[2] && b[3], a[3] && b[2],   false,          false         ],
     [a[3] && b[3], false,          false,          false         ]]
}

/// V(B) = sum over columns of 2^c * (number of 1s in column c).
fn heap_value(h: [[bool; 4]; 7]) -> uint<8> {
    let c0: uint<8> = zext(column_height(h[0]));
    let c1: uint<8> = zext(column_height(h[1]));
    let c2: uint<8> = zext(column_height(h[2]));
    let c3: uint<8> = zext(column_height(h[3]));
    let c4: uint<8> = zext(column_height(h[4]));
    let c5: uint<8> = zext(column_height(h[5]));
    let c6: uint<8> = zext(column_height(h[6]));
    c0 +. (c1 << 1) +. (c2 << 2) +. (c3 << 3)
       +. (c4 << 4) +. (c5 << 5) +. (c6 << 6)
}

fn mul4(x: uint<4>, y: uint<4>) -> uint<8> {
    heap_value(and_array(x, y))
}
```

`and_array` is the top half of the diagram: 16 AND gates, `a[i] && b[j]` landing in column $i+j$, with `as_bits()` index 0 = LSB. `heap_value` is the bottom half — one height per column, at most $4$ and therefore `uint<3>`, weighted and summed into `uint<8>`, the exact output width $w_X+w_Y$. Every `+.` is the wrapping variant, safe here because the maximum heap value is $15\times15=225<256$; the widening `+` grows one bit per term and would need a final `trunc`. All of it is combinational — these are `fn`s, so Spade forbids `reg` and `inst` inside them. The one thing synthesis does differently from the drawing is the point of the note: the seven column counters and the weighted sum written above are a *specification* of $V(\mathcal{B})$, and a compressor-tree generator will implement them as a single [[Wallace Tree]] or [[Dadda Tree]] followed by one final adder, sharing carries across columns that this code writes as independent.

**Related Notes.**

- [[Compressor Trees]] – extends: the architecture that actually evaluates $V(\mathcal{B})$, by iterated weight-preserving rewrites down to height 2.
- [[Full Adder]] – depends-on: the smallest weight-preserving rewrite, 3 dots to 2, from which the whole compressor library generalizes.
- [[CSA, Carry-Save Adder]] – supports: the fixed-row special case of leaving carries unresolved that the heap generalizes to an arbitrary multiset.
- [[Constant-One Sign Extension]] – extends: how negatively-weighted bits are admitted into a definition that only sums non-negative terms.
- [[Truncated Bit Heap]] – extends: which bits of the heap need not be built at all, given a target accuracy.
- [[Merged Multiply-Accumulate]] – supports: the cheapest demonstration that merging two operators into one heap beats chaining them.
- [[Single-Heap Polynomial Evaluation]] – compares: closure under $\times$ taken to its limit, and the width at which it stops paying.
- [[Multiplier Tiling]] – counter-example: when bits come from hard DSP blocks, the heap is no longer free to be reshaped and tiling decides the architecture instead.
- [[Signed Fixed-Point Format]] – depends-on: what a position $i<0$ means, and how the output format pins the heap's LSB.
- [[Error Analysis]] – depends-on: the accuracy budget that decides which heap bits are worth building.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.1 "Definitions and Motivation", pp. 152–161.
- §7.1.1 "A Multiplier Using a Compressor Tree", pp. 153–156 (eqs. 7.1–7.3; Figs. 7.1–7.7).
- §7.1.2 "From Bit Arrays to Bit Heaps", pp. 157–160 (Figs. 7.8–7.10).
- §7.1.3 "Bit Heaps for Portable Application-Specific Arithmetic", pp. 160–161 (Fig. 7.11).
- §7.2.3 "Algebraic Optimizations", p. 165 (the $w\ge14$ crossover for $X^3$).
