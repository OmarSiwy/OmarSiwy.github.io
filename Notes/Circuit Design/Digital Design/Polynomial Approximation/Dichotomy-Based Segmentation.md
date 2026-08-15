---
title: "Dichotomy-Based Segmentation"
description: "Balances approximation error across arbitrary segments — best possible fit, paid for with a comparator-tree search and a subtractor for Y = X - M_A."
kind: circuit
source: "ASA §18.2.5-18.2.6, pp. 552-554"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, range-reduction, segmentation]
aliases:
  - Arbitrary Dichotomy-Based Segmentation
  - Arbitrary Segmentation
  - Arbitrary Decomposition
  - Dichotomic Search Segmentation
---

# Dichotomy-Based Segmentation

Range reduction that places its subinterval boundaries wherever the approximation error says they should go, rather than on a fixed grid — the only segmentation whose partition is chosen by the objective instead of by a wiring rule.

```tikz title="Arbitrary decomposition: comparator-tree search feeding a subtractor and a polynomial evaluator"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex,font=\small]
  \draw (0.3,0.1) rectangle (3.1,1.9);
  \node[align=center,font=\small] at (1.7,1.0) {dichotomy-based\\segmentation\\{\footnotesize(comparator tree)}};

  \draw (6.5,2.5) rectangle (8.3,3.1);
  \node at (7.4,2.8) {$-$};

  \draw (6.1,-0.1) rectangle (8.7,1.3);
  \node[align=center] at (7.4,0.6) {polynomial\\evaluator};

  \draw[->] (-1.3,3.9) -- (7.4,3.9) -- (7.4,3.1);
  \node[anchor=south] at (-1.15,3.95) {$X$};
  \draw (-0.55,3.75) -- (-0.25,4.05);
  \node[anchor=north,font=\footnotesize] at (-0.4,3.8) {$w_X$};

  \draw[->] (1.7,3.9) -- (1.7,1.9);
  \draw (1.55,3.15) -- (1.85,3.45);
  \node[anchor=west,font=\footnotesize] at (1.85,3.3) {$\alpha$};

  \draw[->] (3.1,1.5) -- (5.5,1.5) -- (5.5,2.8) -- (6.5,2.8);
  \node[anchor=south] at (4.6,1.55) {$M_A$};
  \draw (3.35,1.35) -- (3.65,1.65);
  \node[anchor=north,font=\footnotesize] at (3.5,1.4) {$w_X$};

  \draw[->] (7.4,2.5) -- (7.4,1.3);
  \draw (7.25,1.75) -- (7.55,2.05);
  \node[anchor=west,font=\footnotesize] at (7.55,1.9) {$w_Y$};
  \node[anchor=east] at (7.25,1.9) {$Y$};

  \draw[->] (3.1,1.0) -- (6.1,1.0);
  \node[anchor=south,font=\footnotesize] at (4.9,1.02) {$C_0$};
  \node[font=\footnotesize] at (4.9,0.72) {$\vdots$};
  \draw[->] (3.1,0.4) -- (6.1,0.4);
  \node[anchor=north,font=\footnotesize] at (4.9,0.38) {$C_d$};

  \draw[->] (8.7,0.6) -- (10.1,0.6);
  \node[anchor=south] at (9.95,0.65) {$R$};
  \draw (9.25,0.45) -- (9.55,0.75);
  \node[anchor=north,font=\footnotesize] at (9.4,0.5) {$w_R$};

  \node[anchor=west,font=\footnotesize,align=left] at (-1.3,-1.0)
    {segment boundaries are arbitrary, chosen so $\bar\delta_{\mathrm{approx}}$ is equal on every segment;\\
     the search reads only the top $\alpha$ bits of $X$, so $w_X-\alpha<w_Y<w_X$.};
\end{circuitikz}
\end{document}
```

*after Fig. 18.18, p. 553*

**Make the partition an unknown of the problem.** [[Uniform Piecewise Segmentation]] and [[Logarithmic Segmentation]] both fix the boundaries by a rule — the $\alpha$-bit grid, the leading-zero count — and then ask what degree survives. Dichotomy-based segmentation inverts that: fix the degree $d$ and the target $\bar\delta_{\text{approx}}^{\text{target}}$, then solve for a partition $I=\bigsqcup_A I_A$ on which the per-segment approximation errors are *equal* [SNB05; CK12; Tho15; KL14]. Every other scheme is a feasible point of that same problem, so the balanced partition is the optimum by construction, and the book's claim that this is "better from an approximation point of view" (p. 552) is a tautology rather than an empirical finding.

**Read off the segment-width law from Law 2.** Take $I_A$ of half-width $h_A$ centred at $M_A$. The Chebyshev bound of [[Remez Minimax]] — Law 2 in [[Polynomial Approximation]] — gives

$$\bar\delta_{\text{approx},A}\ \le\ \frac{\|f^{(d+1)}\|_{\infty,I_A}}{2^{2d+1}(d+1)!}\,(2h_A)^{d+1}.$$

Setting the right-hand side to a constant $\bar\delta$ for every $A$ and solving for $h_A$ — the only step is taking a $(d+1)$-th root, which is monotone on the positives, so the inequality direction is preserved — yields

$$h_A\ \propto\ \|f^{(d+1)}\|_{\infty,I_A}^{-1/(d+1)}\,\bar\delta^{\,1/(d+1)} .$$

Segment density therefore tracks $|f^{(d+1)}|^{1/(d+1)}$: dense where the $(d{+}1)$-th derivative is large, sparse where the function is nearly a degree-$d$ polynomial already. Counting segments by $N=\int_I \mathrm{d}x/(2h(x))$ turns that into

$$N\ \propto\ \bar\delta^{-1/(d+1)}\int_I\left|f^{(d+1)}(x)\right|^{1/(d+1)}\mathrm{d}x ,\qquad\text{against}\qquad N_{\text{unif}}\ \propto\ \bar\delta^{-1/(d+1)}\,|I|\cdot\Big\|f^{(d+1)}\Big\|_{\infty,I}^{1/(d+1)} .$$

The two differ by exactly the gap between a mean and a supremum, which by Hölder is never in uniform segmentation's favour and is enormous when $f^{(d+1)}$ is spiky. Uniform segmentation sets its degree from the single hardest subinterval and then spends that degree everywhere; this is the closed form of the waste. The book states the advantage only qualitatively — the scaling above is derived here from its own Eq. 18.2 bound, not quoted from it.

**The index stops being free.** With a uniform grid, $A$ is a wire slice and its cost is zero. Here the boundaries are arbitrary reals, so recovering $A$ from $X$ is a search over a sorted table of $N-1$ splitting points, and the book offers three realisations (p. 552): a tree of [[Magnitude Comparator]]s, a sequence of table lookups [SM04; SNB05], or a further polynomial threaded through the splitting points so that $A=\lfloor q(X)\rfloor$ [KL14]. The dichotomic form is the middle of the area/latency range — $\lceil\log_2 N\rceil$ comparisons in series, each on $\alpha$ bits, each selecting the boundary the next level compares against, so the depth is $\lceil\log_2 N\rceil$ comparator delays and only $\lceil\log_2 N\rceil$ comparators are needed if the boundary is muxed out of a ROM. The flat alternative compares all $N-1$ boundaries at once and priority-encodes the thermometer code: one comparator delay plus an encoder, at $\Theta(N\alpha)$ comparator area. Both sit *in front of* the polynomial evaluator on the critical path, which is the whole objection to the scheme.

**Truncate the search argument to make it affordable.** Comparing full $w_X$-bit values costs $w_X$-wide comparators at every level. Restricting the search to the top $\alpha$ bits of $X$ shrinks every comparator to $\alpha$ bits and pins each boundary to a multiple of $2^{-\alpha}$. The consequence is that the balance condition can no longer be met exactly — boundary placement is quantized, so the per-segment errors come out *comparable* rather than equal. The book's tolerance is a factor of $2$ between the largest and smallest (p. 552), which costs at most one bit of $\bar\delta_{\text{approx}}$ and is absorbed by the error budget of [[Error Accuracy]] without changing the architecture.

**The reduced argument costs one subtractor instead of one wire.** The search also emits the segment midpoint $M_A$, $w_X$ bits, read from the same table as the coefficients, and

$$Y=X-M_A$$

is a single $w_X$-bit subtraction — an [[RCA, Ripple-Carry Adder]] with the inverted operand and $c_{\text{in}}=1$, by the two's-complement identity $-M_A=\overline{M_A}+1$ (see [[Number Formats]]). $Y$ is signed and centred on zero exactly as in the $Y_s\in[-1,1)$ variant of uniform segmentation, so Law 2 applies about the midpoint rather than the left edge and the coefficients keep their leading zeros. The width is the honest cost: $Y$'s magnitude is bounded by the *widest* segment's half-width, and because that segment is wider than $2^{-\alpha}$ but narrower than $|I|$,

$$w_X-\alpha\ <\ w_Y\ <\ w_X ,$$

with the exact value function- and degree-dependent (p. 552). Uniform segmentation gets $w_Y=w_X-\alpha$ exactly and for free; every bit of the difference is extra multiplier width in every stage of [[Horner Evaluation]].

**FPGA versus ASIC.** The comparator tree is the part that moves. On an ASIC the $\alpha$-bit comparisons are ordinary carry-propagate structures and the flat $N-1$-comparator form is usually affordable. On an FPGA an $\alpha$-bit unsigned comparison maps onto the hard carry chain at roughly one LUT per two bits and costs about the same as an addition, so $N-1$ of them is genuinely expensive, and the dichotomic $\lceil\log_2 N\rceil$-deep form — comparator, then a small distributed-RAM lookup of the next boundary — is the better mapping. The $M_A$ table costs nothing extra: it widens the coefficient BRAM already needed by [[Polynomial Coefficient Table]] by $w_X$ bits, and BRAMs come in fixed widths.

$$\boxed{\ \bar\delta_{\text{approx},A}=\bar\delta\ \ \forall A\ \iff\ h_A\propto\big\|f^{(d+1)}\big\|_{\infty,I_A}^{-1/(d+1)},\qquad Y=X-M_A,\qquad w_X-\alpha<w_Y<w_X\ }$$

**When it breaks.**

- **$f^{(d+1)}$ nearly constant on $I$.** Then $h_A$ is constant, the balanced partition *is* the uniform grid, and the comparator tree and subtractor buy exactly nothing over a wire split. This is the common case for well-behaved $f$ on a well-chosen $I$, and it is why [[Uniform Piecewise Segmentation]] remains the default.
- **Small $N$.** The search is $\lceil\log_2 N\rceil$ comparator delays plus a subtraction, both ahead of the evaluator. Below a few dozen segments that latency is a significant fraction of a whole Horner chain, so the approximation win is paid back in delay.
- **Singularity at an endpoint.** Balancing drives $h_A\to0$ where $f^{(d+1)}$ blows up, so $N$ diverges. [[Logarithmic Segmentation]] absorbs the same singularity with a bounded leading-zero count and degenerate single-point leftmost intervals; dichotomy has no such escape.
- **Shared buses erase the local win.** $w_Y$, and the coefficient formats $(m_i,\ell_p)$, are worst-cased over all $A$ because the wires are shared. A partition with one segment much wider than the rest pays that segment's $w_Y$ in every multiplier.
- **$\alpha$ too small.** Once $2^{-\alpha}$ approaches the narrowest required segment, distinct segments collide on the same $\alpha$-bit prefix and the partition is no longer realisable at all — not merely imbalanced.

**RTL.** One instance of the search — four segments, $\alpha=2$ — with the boundaries and midpoints baked in as constants, which is what a generated operator looks like.

```spade
entity dichotomy_seg(x: uint<8>) -> (uint<2>, int<7>) {
    // splitting points of an arbitrary (non-uniform) partition into 4 segments
    let s1: uint<8> = 0x20;
    let s2: uint<8> = 0x60;
    let s3: uint<8> = 0xb0;

    // dichotomic search: level 1 picks the half, level 2 picks within it
    let hi = x >= s2;
    let lo_bit = if hi { x >= s3 } else { x >= s1 };
    let a: uint<2> = hi.to_uint().concat(lo_bit.to_uint());

    // midpoint table, then Y = X - M_A
    let mids: [uint<8>; 4] = [0x10, 0x40, 0x88, 0xd8];
    let m = mids[a];
    let y: int<7> = trunc(x.to_int() - m.to_int());
    (a, y)
}
```

`x` is $X$ at $w_X=8$; `a` is the index $A$ at $\alpha=2$; `y` is the $Y$ bus into the polynomial evaluator. The two comparisons are the two levels of the comparator tree in the diagram, `mids[a]` is the $M_A$ port of the segmentation block, and the `to_int` pair plus `-` is the subtractor: `to_int` widens $8\to9$ value-preservingly, the subtraction widens $9\to10$, and `trunc` takes the low 7. That 7 is the point — the widest segment spans $[\text{0xb0},\text{0xff}]$ so $|Y|\le40$, giving $w_Y=7$ and realising $w_X-\alpha=6<7<8=w_X$ exactly as the book brackets it. Everything is combinational; there is no clock. Synthesis will not build the drawing literally: the emitted Verilog has *two* physical comparators with a mux on their outputs rather than one comparator with a muxed boundary, and `mids[a]` becomes a part-select on a 32-bit constant — a 4:1 mux, not a memory — because four entries never reach a RAM primitive.

Simulated against a behavioural reference over all 256 inputs plus a 3000-vector random sweep and ten named vectors on both sides of every boundary: 3266/3266 pass.

**Related notes.**

- [[Uniform Piecewise Segmentation]] – compares: the same range reduction with the partition fixed to a grid, so $A$ is a wire slice and $w_Y=w_X-\alpha$ exactly.
- [[Logarithmic Segmentation]] – compares: the other non-uniform partition, chosen by a leading-zero count instead of by error, and the one that survives a singularity at $0$.
- [[Hierarchical Segmentation]] – compares: buys most of the same non-uniformity with two nested wire splits and no comparator tree.
- [[Magnitude Comparator]] – depends-on: the primitive at every level of the dichotomic search.
- [[RCA, Ripple-Carry Adder]] – depends-on: the $w_X$-bit subtractor that forms $Y=X-M_A$.
- [[Polynomial Coefficient Table]] – supports: holds $M_A$ alongside $C_0\dots C_d$ at the same address.
- [[Horner Evaluation]] – supports: consumes $Y$, and pays for every bit by which $w_Y$ exceeds $w_X-\alpha$.
- [[Choosing a Polynomial Evaluator]] – compares: where this sits in the latency/area/memory mix against the other three reductions.
- [[Remez Minimax]] – supports: supplies the per-segment error bound that the partition is chosen to equalise.
- [[Error Accuracy]] – supports: the budget that absorbs the factor-of-2 imbalance from truncating the search to $\alpha$ bits.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §18.2.5 "Arbitrary Dichotomy-Based Segmentation", p. 552, and Fig. 18.18 "Arbitrary decomposition architecture", p. 553.
- §18.2.6 "Discussion", pp. 553-554 — universal versus function-specific approximators, and the inverse-cumulative-distribution case [Che+07] where no algebraic range reduction exists.
- §18.1 Law 2 (Chebyshev interval-shrinking bound) via [[Polynomial Approximation]], p. 535, used to derive the segment-width law.
