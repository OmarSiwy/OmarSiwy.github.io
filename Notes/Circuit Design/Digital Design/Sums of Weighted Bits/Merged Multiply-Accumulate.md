---
title: "Merged Multiply-Accumulate"
description: "Folds XY+A into the product's own heap for one extra row and at most one extra compression level, instead of a separate n-bit adder behind the multiplier costing n delay or n log n area."
kind: circuit
source: "ASA §7.1.2, pp. 157-160"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, multiplier, accumulator, mac, merged-arithmetic]
aliases:
  - MAC
  - Multiply-Accumulate
  - Merged MAC
  - Fused Multiply-Add
  - Merged Arithmetic
---

# Merged Multiply-Accumulate

A multiply-accumulate that never builds the product: $A$ enters the multiplier's own bit heap as one more row, so the whole operator still contains exactly one carry-propagating adder instead of two.

```tikz title="Bit heap of XY+A for 4-bit X and Y and a 10-bit addend: the product pyramid plus one shaded row"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % --- the 4x4 product heap: column c = i+j, drawn column-wise ---
  \foreach \c/\r/\i/\j in {%
    0/1/0/0,
    1/1/0/1, 1/2/1/0,
    2/1/0/2, 2/2/1/1, 2/3/2/0,
    3/1/0/3, 3/2/1/2, 3/3/2/1, 3/4/3/0,
    4/1/1/3, 4/2/2/2, 4/3/3/1,
    5/1/2/3, 5/2/3/2,
    6/1/3/3}
    \node[draw,ellipse,inner sep=1pt,font=\tiny,minimum width=0.86cm]
      at ({-1.05*\c}, {0.62*\r}) {$x_\i y_\j$};

  % --- A: the one extra row ---
  \foreach \k in {0,...,9}
    \node[draw,fill=black!8,ellipse,inner sep=1pt,font=\tiny,minimum width=0.86cm]
      at ({-1.05*\k}, 0) {$a_\k$};

  % --- position axis ---
  \draw[->] (0.62,-0.52) -- (-10.8,-0.52);
  \foreach \c in {0,...,10} {
    \draw (-1.05*\c,-0.64) -- (-1.05*\c,-0.40);
    \node[anchor=north,font=\tiny] at (-1.05*\c,-0.66) {\c};
  }
  \node[anchor=west,font=\footnotesize] at (0.72,-0.52) {position $i$};

  % --- column-height annotation ---
  \node[anchor=north,font=\footnotesize] at (-3.15,-1.05)
    {heights $2,3,4,5,4,3,2$};
  \node[anchor=north,font=\footnotesize,align=center] at (-8.4,-1.05)
    {heights $1,1,1$:\\ columns $7..9$ bypass the tree};
  \node[anchor=north,font=\footnotesize] at (-5.25,-2.05)
    {$h_{\max}: 4\rightarrow5$, so at most one extra compression level};

  % --- what feeds the heap, with widths ---
  \node[anchor=west,font=\footnotesize] at (0.72,2.48) {$X$: 4 bits};
  \node[anchor=west,font=\footnotesize] at (0.72,2.06) {$Y$: 4 bits};
  \node[anchor=west,font=\footnotesize] at (0.72,1.30)
    {16 AND gates, 1 gate delay};
  \node[anchor=west,font=\footnotesize] at (0.72,0.0) {$A$: 10 bits};

  % --- the ragged region: the product stops at position 6, A does not ---
  \draw[dashed] (-6.83,-0.30) -- (-6.83,2.10);
  \node[anchor=south east,font=\footnotesize,align=right] at (-6.95,1.35)
    {the product contributes\\ nothing above position 6};

  % --- output ---
  \draw[->] (-11.3,0.31) -- (-12.4,0.31);
  \node[anchor=east,font=\footnotesize,align=center] at (-12.45,0.31)
    {$XY+A$\\ 11 bits\\ (max $1248$)};
\end{circuitikz}
\end{document}
```

*after Fig. 7.8, p. 157.*

**Merge by multiset union, and the addition stops being an operator.** Write the product's heap and the addend's heap separately: distributivity gives $\mathcal{B}_{XY}=\{(i{+}j,\;x_iy_j)\}$ over $0\le i<w_X$, $0\le j<w_Y$, and the addend is already in heap form by the definition of binary notation, $\mathcal{B}_A=\{(k,\;a_k)\}$ over $0\le k<w_A$. Because $V$ is a plain sum and addition in $\mathbb{Z}$ is associative and commutative, the multiset union $\uplus$ is exactly addition of values,

$$V(\mathcal{B}_{XY}\uplus\mathcal{B}_A)=V(\mathcal{B}_{XY})+V(\mathcal{B}_A)=XY+A .$$

Nothing else is needed to justify the merge — no carry reasoning, no word-level argument ([[Bit Heaps]]). The MAC is not "a multiplier plus an adder"; it is one summation problem with $w_Xw_Y+w_A$ terms, and the output occupies $\max(w_X{+}w_Y,\;w_A)+1$ bits.

**Price the extra row in compression levels, not in adders.** The product's column heights run $1,2,\dots,\min(w_X,w_Y),\dots,2,1$. Union with $\mathcal{B}_A$ adds exactly one dot to every column $k<w_A$, so $h_{\max}$ goes from $h$ to $h+1$ and nothing else about the shape changes. A tree of [[Full Adder|full adders]] takes a height-$h$ heap to $\lceil 2h/3\rceil$ per level, so the level count $L(h)$ to reach height 2 is about $\log_{3/2}(h/2)$; and since $\lceil 2(h{+}1)/3\rceil\le h$ for every $h\ge2$, one level of compression applied to $h+1$ already lands at or below $h$, giving $L(h+1)\le L(h)+1$. **The delay overhead of merging is therefore at most one compressor delay, for any $n$.** Area is just as blunt: each 3:2 compressor consumes three dots and emits two, a net loss of exactly one dot, so absorbing $n$ extra dots costs at most $n$ extra full adders — linear in $n$ (p. 157).

**The alternative you are beating is not the adder, it is the second carry propagation.** A separate $n$-bit adder behind a finished multiplier costs $n$ in both delay and area as a [[Ripple-Carry Adder]], or $\log n$ delay and $n\log n$ area as a prefix adder. But the deeper cost is structural: the multiplier must first collapse its two carry-save rows through a final adder to produce $XY$ as a number, only for the accumulator to propagate carries a second time. The merged heap never resolves that intermediate — the two carry-save rows and $A$ compress together, and one final adder serves the whole MAC ([[Split Final Adder]], [[Compressor Trees]]). Merging is an optimization that is *global* (it forgets which operator a bit came from) and *bit-level* rather than word-level, which is the general reason merged arithmetic wins (p. 157).

**Raggedness is the whole reason the book says "heap" and not "array".** In the diagram $w_A=10$ exceeds $w_X+w_Y-1=7$, so columns 7, 8 and 9 hold a single bit each: they have no compression to do and pass straight to the final adder, while columns 0–6 stand five deep. Conversely, if $A$'s LSB sits below the product's the heap extends to the right instead. Neither case needs special handling, because a heap is indexed by *weight* and knows nothing about word boundaries — aligning a fixed-point addend of a different ulp is index arithmetic at generation time and costs no hardware ([[Number Formats]]). A cost model that assumes a rectangle overcharges every ragged column.

**A signed addend costs one row too, not one row per operand.** If $A$ is two's complement its sign bit $s$ carries weight $-2^{p}$, which is outside the definition of $V(\mathcal{B})$ as a sum of non-negative terms. The identity $-2^{p}s = 2^{p}\bar{s} - 2^{p}$ replaces it with a positively-weighted complemented bit plus a synthesis-time constant, and every such constant across the whole heap sums into a *single* constant row ([[Constant-One Sign Extension]]). So signedness on top of merging costs some inverters and one row that would very likely have existed anyway to carry the round-to-nearest half-ulp.

**Merging generalizes because heaps are closed, which makes the MAC the base case rather than a trick.** The sum of two heaps is a heap (union) and the product of two heaps is a heap (distribute; each cross term $2^{i+j}b_ic_j$ is one AND), so by induction any multivariate polynomial over fixed-point inputs is a single sum of weighted bits (p. 159). $XY+A$ is the smallest non-trivial instance. The same argument merges a sum of products into one heap — inner products, complex multiplication, sums of squares — and a transposed-form FIR tap chain is nothing but a MAC iterated, all of whose partial products can share one tree ([[LTI Filters]], [[Single-Heap Polynomial Evaluation]]). This is why merged arithmetic shows up in the literature on inner products, dataflow graphs, elementary functions and DSP kernels rather than as a multiplier trick (p. 157).

**On FPGA the merge may already be in the silicon, and then merging again is a loss.** A DSP block ships with a hardened post-adder and accumulator feedback path, so $XY+A$ inside one block costs nothing beyond the multiplication — there is no soft heap to merge into and no LUTs are saved ([[DSP Blocks]], [[FPGAs]]). Merging pays on FPGA precisely where the heap is *not* covered by hard blocks: the leftover partial products of a tiled multiplier, an addend wider than the DSP's accumulator, or a multiplicand too wide for one block, where the leftover heap absorbs $A$ using [[Generalized Parallel Counter|generalized parallel counters]] and the hard carry chain. On ASIC the trade is unconditional and merging always wins.

**Merging is not free at the architecture level, because it destroys sharing.** Once $A$ is dissolved into the product's heap it no longer exists as a word, so if $A$ also feeds another consumer that consumer must recompute it. This is the operator-fusion-versus-resource-sharing trade the book draws out of a sine/cosine datapath (Fig. 7.10, p. 159; the trade stated on p. 160): merging $\times\pi$ into both $Z^2/2$ and $Z^3/6$ computes $Z=\pi Y_{\text{red}}$ twice. Merge as long as the addend is consumed once.

$$\boxed{\ \mathcal{B}_{XY+A}=\mathcal{B}_{XY}\uplus\{(k,a_k)\}\ \Longrightarrow\ h_{\max}\!\to\!h_{\max}+1,\quad \Delta_{\text{levels}}\le1,\quad \Delta_{\text{area}}\le n\ \text{FAs}\ }$$

**When it breaks.**

- **The addend dwarfs the product.** For $w_A\gg w_X+w_Y$ almost every column of the heap has height 1, the tree has nothing to compress there, and the operator is an adder with a small multiplier bolted on. The $O(1)$-level claim is still true and still worthless: the cost is now the final adder, which merging does not touch.
- **Accumulation over time is a loop, not a merge.** $A_{t+1}=XY+A_t$ closes a feedback path through the final adder, and the merged heap is combinational. Keeping the merge means keeping the *state* in carry-save form and paying a final adder only at the end; taking the sum out as a number each cycle reinstates exactly the carry propagation merging was supposed to delete.
- **Many addends, not one.** $k$ extra rows raise $h_{\max}$ by $k$, so "at most one extra level" is a per-row statement; a $k$-input multi-add grows the tree by $\Theta(\log k)$ levels. Still better than $k$ chained adders, but not free.
- **The addend arrives late.** Merging requires $A$ at heap-construction time. If $A$ is produced several stages downstream, a separate adder at the end pipelines more naturally than re-timing a merged tree ([[Pipelined Compressor Tree]]).
- **The product was truncated.** Merging an exact $A$ into a faithfully-rounded product invalidates the multiplier's error budget: the heap's discarded columns must be re-chosen for the *merged* output ulp, not the product's ([[Truncated Multipliers]], [[Truncated Bit Heap]]).
- **The addend is shared.** See the fusion/sharing trade above.

**RTL (Spade).**

```spade
/// One partial-product row of the heap: X AND y_j, deposited at weight 2^j.
fn pp_row(x: uint<4>, yj: bool, j: uint<11>) -> uint<11> {
    let m: uint<11> = zext(if yj { x } else { 0 });
    m << j
}

/// XY + A evaluated as ONE bit heap: A is a fifth row alongside the four
/// partial-product rows, not a second operator behind a finished multiplier.
fn mac_heap(x: uint<4>, y: uint<4>, a: uint<10>) -> uint<11> {
    let yb = y.as_bits();
    let az: uint<11> = zext(a);
    pp_row(x, yb[0], 0) +. pp_row(x, yb[1], 1)
        +. pp_row(x, yb[2], 2) +. pp_row(x, yb[3], 3) +. az
}

entity mac4(x: uint<4>, y: uint<4>, a: uint<10>) -> uint<11> {
    mac_heap(x, y, a)
}
```

Each `pp_row` call is one horizontal slice of the diagram's pyramid — 16 AND gates in total, `y.as_bits()` index 0 being the LSB — and `az` is the shaded $a$ row, entering the same expression as the four product rows with no privileged position. The width is fixed at 11 everywhere because $\max(w_X{+}w_Y,w_A)+1=11$ and the true maximum $15\cdot15+1023=1248<2048$, which is what licenses the wrapping `+.` instead of the widening `+`; a `<<` in Spade needs both operands at the same type, hence `j: uint<11>`. All of it is combinational: `fn` forbids `reg` and `inst`, and `mac4` exists only to give the testbench a concrete entity. Synthesis will not build what is drawn here — the five `+.` terms are a *specification* of $V(\mathcal{B})$, and a heap generator emits one compressor tree over all five rows followed by a single final adder, whereas this expression read literally is four carry-propagating adders in series.

**Related Notes.**

- [[Bit Heaps]] – depends-on: the multiset semantics and the two axioms that make $\uplus$ legal in the first place.
- [[Compressor Trees]] – supports: the machinery whose level count the extra row perturbs by at most one.
- [[Ripple-Carry Adder]] – compares: the separate adder behind the multiplier, at $n$ delay and $n$ area, that merging deletes.
- [[Split Final Adder]] – extends: the single carry-propagation the merged operator still owes, and how to shorten it.
- [[Constant-One Sign Extension]] – depends-on: how a signed addend enters a heap of non-negative terms for one row.
- [[Truncated Multipliers]] – counter-example: merging an exact addend into a faithful product forces the truncation analysis to be redone at the merged ulp.
- [[LTI Filters]] – extends: a filter tap chain is the MAC iterated, and all its taps can share one heap.
- [[Single-Heap Polynomial Evaluation]] – extends: closure under $\times$ pushed past the base case, and the width at which it stops paying.
- [[DSP Blocks]] – counter-example: on FPGA the post-adder is already hardened, so the soft merge saves nothing inside a block.
- [[Multipliers]] – compares: where the MAC sits among the operators that dissolve into heap-generation rules.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.1.2 "From Bit Arrays to Bit Heaps", pp. 157–160 (Fig. 7.8, the $XY+A$ heap; Fig. 7.9, ragged heap shapes; Fig. 7.10, several heaps in one operator).
- §7.1.1 "A Multiplier Using a Compressor Tree", pp. 153–156 (eqs. 7.1–7.3, the partial-product heap and its column heights).
- §7.2.2 "Managing Signed Numbers", pp. 162–163 (the single constant row for signed summands).
- §7.1.3 "Bit Heaps for Portable Application-Specific Arithmetic", p. 160 (operator fusion against resource sharing).
