---
title: Argmax Unit
description: "A comparator tree emitting a one-hot winner: replaces softmax at inference because softmax is monotonic, trading an exponential-and-divide layer for log N comparator levels."
kind: circuit
source: "ASA §24.2.5, pp. 721-722"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, comparator, classifier, one-hot]
aliases:
  - Argmax
  - Arg Max
  - Argmax Layer
  - Argmax Tree
---

# Argmax Unit

The output stage of a classifier that returns *which* class won rather than *how likely* each class is: a tree of $N-1$ magnitude comparators over the logit vector, and the only layer in an inference datapath containing no adder, no multiplier and no divider.

```tikz title="Argmax over 8 scores: three levels of compare-and-select carrying (value, index), then a 1-of-8 decoder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % inputs
  \foreach \i in {0,...,7} {
    \node[anchor=east] at (-0.05,\i) {$X_{\i}$ [$m$]};
    \draw (0.0,\i) -- (1.6,\i);
  }

  % level 1: 4 compare-and-select
  \foreach \j in {0,1,2,3} {
    \draw (2.0, 2*\j+0.05) rectangle (3.4, 2*\j+0.95);
    \node at (2.7, 2*\j+0.5) {$\max$};
    \draw[->] (1.6, 2*\j)     -- (2.0, 2*\j+0.28);
    \draw[->] (1.6, 2*\j+1)   -- (2.0, 2*\j+0.72);
  }

  % level 2
  \foreach \j in {0,1} {
    \draw (4.6, 4*\j+1.05) rectangle (6.0, 4*\j+1.95);
    \node at (5.3, 4*\j+1.5) {$\max$};
    \draw[->] (3.4, 4*\j+0.5) -- (4.6, 4*\j+1.28);
    \draw[->] (3.4, 4*\j+2.5) -- (4.6, 4*\j+1.72);
  }

  % level 3
  \draw (7.2,3.05) rectangle (8.6,3.95);
  \node at (7.9,3.5) {$\max$};
  \draw[->] (6.0,1.5) -- (7.2,3.28);
  \draw[->] (6.0,5.5) -- (7.2,3.72);

  % decoder
  \draw (10.0,3.05) rectangle (11.9,3.95);
  \node[align=center] at (10.95,3.5) {1-of-8\\decoder};
  \draw[->] (8.6,3.5) -- (10.0,3.5);
  \draw[->] (11.9,3.5) -- (13.1,3.5);

  % discarded max value
  \draw[->] (7.9,3.05) -- (7.9,2.1);

  % annotations
  \node[anchor=south,font=\footnotesize] at (2.7,7.4) {level 1: 4 cmp};
  \node[anchor=south,font=\footnotesize] at (5.3,7.4) {level 2: 2 cmp};
  \node[anchor=south,font=\footnotesize] at (7.9,7.4) {level 3: 1 cmp};
  \node[anchor=west,font=\footnotesize] at (3.55,0.20)  {$(V{:}m,\ I{:}1)$};
  \node[anchor=south west,font=\footnotesize] at (6.2,5.6)  {$(V{:}m,\ I{:}2)$};
  \node[anchor=south,font=\footnotesize] at (9.3,3.55) {$I$ [$3$]};
  \node[anchor=south west,font=\footnotesize] at (12.0,3.55) {[$8$] one-hot};
  \node[anchor=north,font=\footnotesize,align=center] at (7.9,2.05) {$V$ [$m$]\\unused};
\end{circuitikz}
\end{document}
```

*Own construction; $N=8$ shown, general $N$ needs $\lceil\log_2 N\rceil$ levels and $N-1$ comparators. The carried index widens by one bit per level.*

**Justify deleting the softmax before building anything.** The softmax layer maps the $N$-vector of logits $X$ to

$$\sigma(X_i) = \frac{e^{X_i}}{\sum_j e^{X_j}}, \qquad \sum_i \sigma(X_i) = 1$$

which costs $N$ exponentials and one division — a floating-point exponential and a reciprocal are among the most expensive operators in the book, and here they sit in the shallowest, least-parallel layer of the network. The escape is that $t \mapsto e^{t}$ is strictly increasing on $\mathbb{R}$ and the denominator $S = \sum_j e^{X_j}$ is a single *positive* constant shared by every output, so $\sigma$ is the composition of a strictly increasing map with multiplication by a positive constant: strictly increasing, hence order-preserving. A strictly increasing map does not move the position of the maximum, so the whole layer is invisible to $\arg\max$. Softmax survives in *training* only because it is smooth and differentiable, which the comparator tree is emphatically not.

**Push the same monotonicity argument one layer further back.** The final dense layer produces a wide accumulator that a [[Requantization Unit]] normally scales back to $n$ bits by multiplying by a scale $s>0$ and adding a zero point $z$. Since $t \mapsto st+z$ with $s>0$ is affine increasing, it is order-preserving too, and the argmax over the requantised outputs equals the argmax over the raw accumulators — so an argmax classifier can compare the accumulators directly and the last requantisation disappears as well. This holds only for a *per-tensor* scale. Per-channel quantisation gives each class its own $s_i$, the comparison is then between $s_i A_i + z_i$ terms with different slopes, and no such cancellation exists; you must requantise first.

**Reassociate the reduction into a tree.** $\max$ over a totally ordered set is associative and commutative, so the sequential scan $\max(\dots\max(\max(X_0,X_1),X_2)\dots,X_{N-1})$ — depth $N-1$ — reassociates into a balanced binary tree of depth $\lceil\log_2 N\rceil$ without changing the result. This is exactly the reassociation that turns a ripple carry into a prefix tree in [[Adders]], with the difference that $\max$ has no carry to propagate, so the tree is *free*: it costs the same $N-1$ operators as the scan and only reorders them. Comparator count is therefore $N-1$ regardless of shape, and only the depth is a design choice.

**Carry the index, never recompute it.** Each tree node takes two pairs $(V,I)$ and emits the pair whose $V$ is larger, so it is one $m$-bit [[Magnitude Comparator]] driving one multiplexer over $m + \ell$ bits, where $\ell$ is the level number. At level $\ell$ the surviving index only needs to distinguish $2^{\ell}$ candidates, so $I$ is $\ell$ bits wide and reaches $k = \lceil\log_2 N\rceil$ bits at the root: level 1 muxes $m+1$ bits, level $k$ muxes $m+k$. Values are $m$-bit two's-complement logits — signed, because a logit is a bare accumulator with no ReLU in front of it, and treating it as unsigned inverts the ordering of every negative score. The final $k$-bit index goes through a 1-of-$N$ decoder ([[Decoders]]) to give the one-hot code; the winning *value* $V$ is dead in a pure classifier and its half of the root mux is trimmed away by synthesis.

**Reject the obvious alternative.** The one-hot output invites a two-pass structure: reduce to the maximum $V^\*$ with a plain $\max$ tree carrying no index, then broadcast $V^\*$ to $N$ equality comparators, one per class. That is $N-1$ magnitude comparators *plus* $N$ equality comparators plus a broadcast net with fanout $N$, against $N-1$ comparators and a $\log_2 N$-input decoder for the index-carrying tree — strictly worse. Worse still, it is *wrong on ties*: if two classes share the maximum, both equality comparators fire and the output is multi-hot, which a downstream one-hot consumer is not built to survive.

**Make tie-breaking explicit.** Ties are common in a quantised network, where an 8-bit logit has only 256 possible values and two classes colliding is routine. In the compare-and-select node, taking the right operand only on a strict $V_b > V_a$ keeps the left one on equality, and since the tree preserves left-to-right order at every level, the global winner is the *lowest* index among the maxima; swapping to $\ge$ gives the highest. Either is fine, but it must be pinned down, because the software reference (NumPy `argmax`, PyTorch `argmax`) resolves ties to the lowest index and any hardware that does otherwise will produce a mismatch on real data that looks like an arithmetic bug and is not.

**Cost the comparator honestly.** An $m$-bit signed comparison is a subtraction that keeps only its sign bit: the carry chain of an $m$-bit adder with the sum XORs deleted. On an FPGA that lands on the hardened carry chain ([[FPGAs]]), so its delay is the same carry-propagate delay an adder of that width pays, and the argmax tree's critical path is $\lceil\log_2 N\rceil$ carry chains plus $\lceil\log_2 N\rceil$ mux levels. For the VGG-7/CIFAR-10 classifier of the long-form note, $N = 10$: nine comparators and four levels replace ten exponentials and a reciprocal. On an ASIC the ratio is even more lopsided, because the exponential needs a table plus a polynomial ([[Fixed-Point Function Approximation]]) while the comparator needs no memory at all.

**Serialise it when the logits are.** The tree assumes the whole logit vector is available in one cycle, which it is only if the final dense layer is fully unrolled. In a time-multiplexed datapath the logits arrive one per cycle, and argmax collapses to a running maximum: one $m$-bit comparator, an $m$-bit value register, a $k$-bit index register and a $k$-bit counter, $N$ cycles of latency and $O(1)$ area independent of $N$. This is almost always the right choice, since $N$ is 10 or 1000 and the classifier head runs once per inference — the tree buys latency nobody is measuring. The saving that actually matters is the deletion of the exponentials, not the shape of what replaces them.

$$\boxed{\ \arg\max_i \sigma(X_i) \;=\; \arg\max_i X_i \quad\text{at cost } (N-1)\ \text{comparators},\ \lceil\log_2 N\rceil\ \text{levels}\ }$$

**When it breaks.**

- **You need more than the winner.** Top-$k$, beam search or a runner-up margin needs a partial sorting network, not a max tree; the cost jumps from $N-1$ comparators to $O(N\log^2 N)$ and the index bookkeeping stops being a single mux.
- **You need a calibrated number.** Confidence thresholding, "reject if $p < 0.9$", temperature scaling, and knowledge distillation all read the *value* of the probability, not its position. Then softmax is back — though the cheaper $\max_i X_i - \log\sum_j e^{X_j}$ form gives log-probabilities with one exponential-sum instead of $N$ divisions.
- **The scores are floating-point.** IEEE-754 is sign-magnitude, so a bitwise unsigned comparison orders positive floats correctly and negative floats backwards; the tree needs either a real floating-point comparator or the standard monotone bit-pattern remap before the integer comparison is valid. NaN has no ordering at all and will silently pick whichever operand the tie-break rule favours.
- **Per-channel quantisation.** As above, the requantisation-skipping corollary fails and the argmax must run on requantised values.
- **Training.** $\arg\max$ has zero gradient almost everywhere and is discontinuous at ties, so the training graph keeps the softmax regardless of what the inference datapath does.

> [!warning] Not covered in the source — needs outside research
> The book states the softmax-to-argmax substitution in one paragraph (p. 722) and gives no argmax architecture, no tie-break convention and no cost figure. The tree structure, index widths, comparator counts and the floating-point ordering caveat above are standard construction, not citations.

```spade
/// One compare-and-select node: keep the larger score, and on a tie keep the
/// left operand so that the lowest index wins.
fn cmax(a: (int<8>, uint<3>), b: (int<8>, uint<3>)) -> (int<8>, uint<3>) {
    if b.0 > a.0 { b } else { a }
}

/// Balanced comparator tree over 8 scores: 7 comparators, 3 levels.
fn argmax8(x: [int<8>; 8]) -> (int<8>, uint<3>) {
    let a = cmax((x[0], 0), (x[1], 1));
    let b = cmax((x[2], 2), (x[3], 3));
    let c = cmax((x[4], 4), (x[5], 5));
    let d = cmax((x[6], 6), (x[7], 7));
    cmax(cmax(a, b), cmax(c, d))
}

/// 1-of-8 decoder.
fn onehot8(i: uint<3>) -> uint<8> {
    let one: uint<8> = 1;
    one << zext::<3, 8>(i)
}

entity argmax8_onehot(x: [int<8>; 8]) -> uint<8> {
    onehot8(argmax8(x).1)
}
```

`cmax` is one box in the diagram: the `>` is the magnitude comparator, the `if` is the mux, and the tuple is the $(V,I)$ pair on the wire. The index literals are `uint<3>` at every level — Spade has no per-level width for them, so the source is one bit wider than the drawing at levels 1 and 2 and synthesis prunes the constant-zero bits back out. The whole block is combinational, with `argmax8(x).1` discarding the winning value so the root mux's data half is dead logic; a real design registers the one-hot output, and a serial datapath would replace the tree with a `reg` holding the running `(V,I)` pair.

**Related Notes**

- [[Softmax Unit]] – compares: the layer this one deletes, and the only one of the two that survives into training.
- [[Magnitude Comparator]] – depends-on: every node in the tree is one of these, and its carry-chain cost sets the level delay.
- [[Max Pooling Unit]] – extends: the same compare-and-select tree without the index, applied per channel over a spatial window instead of once over the class vector.
- [[Requantization Unit]] – supports: its per-tensor scale is order-preserving, which is what lets the argmax read raw accumulators.
- [[Choosing a Deep Learning Datapath]] – compares: where the classifier head sits against the layers that actually dominate area.
- [[Comparators]] – depends-on: the topic hub for the comparator structures the tree is built from.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 24.

- §24.2.5 Softmax Layer — pp. 721–722 (eqs. 24.16, 24.17; the monotonicity argument and the one-hot substitution)
- §24.2.6 An Example CNN — p. 722 (the VGG-7/CIFAR-10 classifier, $N = 10$)
