---
title: Parallel Polynomial Evaluator
description: "Evaluates the developed form with all monomials in flight and one compressor tree — O(log d) depth instead of Horner's O(d), for more multipliers."
kind: circuit
source: "ASA §18.3.2, pp. 558-561"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, bit-heap, latency]
aliases:
  - Parallel Evaluation
  - Parallel Polynomial Evaluation
  - Developed-Form Polynomial Evaluator
---

# Parallel Polynomial Evaluator

An evaluator that keeps every monomial $C_iY^i$ in flight at once and merges them in a single compressor tree, so its critical path grows as $O(\log d)$ where [[Horner Evaluation]]'s multiply-add chain grows as $\Theta(d)$.

```tikz title="Degree-3 parallel polynomial evaluator: independent [C_i x^i] boxes feeding one bit heap"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- Y bus, with a truncated tap per monomial ---
  \node[anchor=east] at (-0.6,3.5) {$Y$\,\tiny(8)};
  \draw[thick] (-0.5,3.5) -- (6.3,3.5);
  \draw[->] (0.7,3.5) -- (0.7,2.65);
  \draw[->] (3.5,3.5) -- (3.5,2.65);
  \draw[->] (6.3,3.5) -- (6.3,2.65);
  \node[anchor=east] at (0.6,3.05) {$\widetilde Y_3$\,\tiny(8)};
  \node[anchor=east] at (3.4,3.05) {$\widetilde Y_2$\,\tiny(8)};
  \node[anchor=east] at (6.2,3.05) {$Y$\,\tiny(8)};

  % --- coefficient inputs ---
  \node[anchor=south] at (1.7,4.65) {$C_3$};
  \node[anchor=south] at (4.5,4.65) {$C_2$};
  \node[anchor=south] at (7.3,4.65) {$C_1$};
  \node[anchor=south] at (9.6,4.65) {$C_0$};
  \draw[->] (1.7,4.6) -- (1.7,2.65);
  \draw[->] (4.5,4.6) -- (4.5,2.65);
  \draw[->] (7.3,4.6) -- (7.3,2.65);
  \draw[->] (9.6,4.6) -- (9.6,0.95);
  \node[anchor=west] at (9.68,2.0) {\tiny(8), aligned $\ll 8$};

  % --- the [C_i x^i] boxes ---
  \draw (0.4,1.85) rectangle (2.0,2.65);
  \node at (1.2,2.25) {$\left[\,C_3x^3\,\right]$};
  \draw (3.2,1.85) rectangle (4.8,2.65);
  \node at (4.0,2.25) {$\left[\,C_2x^2\,\right]$};
  \draw (6.0,1.85) rectangle (7.6,2.65);
  \node at (6.8,2.25) {$\times$};

  % --- products into the heap ---
  \draw[->] (1.2,1.85) -- (1.2,0.95);
  \draw[->] (4.0,1.85) -- (4.0,0.95);
  \draw[->] (6.8,1.85) -- (6.8,0.95);
  \node[anchor=west] at (1.28,1.42) {$T_3$\,\tiny(16)};
  \node[anchor=west] at (4.08,1.42) {$T_2$\,\tiny(16)};
  \node[anchor=west] at (6.88,1.42) {$T_1$\,\tiny(16)};

  % --- single bit heap / compressor tree ---
  \draw (0.0,0.15) rectangle (10.4,0.95);
  \node at (5.2,0.55) {compressor tree \ (bit heap, LSB $2^{-16}$)};

  % --- final rounding ---
  \draw[->] (10.4,0.55) -- (11.9,0.55);
  \node[anchor=south] at (11.15,0.62) {$R_{\mathrm{ext}}$\,\tiny(18)};
  \draw (11.9,0.15) rectangle (13.0,0.95);
  \node[align=center] at (12.45,0.55) {\tiny final\\ \tiny round};
  \draw[->] (13.0,0.55) -- (13.7,0.55);
  \node[anchor=west] at (13.75,0.55) {$R$};
\end{circuitikz}
\end{document}
```

*after Fig. 18.20, p. 560, specialised to $d=3$ and annotated with the widths of the RTL below.*

**Spend operations to buy depth.** Do not factor the polynomial at all — evaluate the developed form (18.30) as written:

$$p(Y)=C_0+C_1Y+C_2Y^2+\dots+C_dY^d .$$

In software this is a regression: $d(d+1)/2$ multiplications against Horner's provably minimal $d$. In hardware the currency is not operation count but *depth*, and every monomial is independent. Compute $Y^{2^k}$ by repeated squaring for $2^k\le d$, then assemble each $Y^i$ from the binary decomposition of $i$ — $Y^{11}=Y^{8}Y^{2}Y$ — which takes $O(\log d)$ multiplier delays. Sum the $d+1$ products in a balanced adder tree, which by associativity of $+$ may be reassociated to depth $\lceil\log_2(d+1)\rceil$. Total $O(\log d)$ against Horner's $\Theta(d)$, paid for in multipliers. [[Estrin's Scheme]] is the recursive form of the same idea, obtained by splitting on parity, $p(x)=p_e(x^2)+x\,p_o(x^2)$.

**Let the coefficient decay pay for the powering.** The operation count would still be damning if every multiplier were full width, but it is not. After a range reduction of parameter $\alpha$ (see [[Uniform Piecewise Segmentation]]) the coefficients satisfy $C_i\approx\frac{f^{(i)}}{i!}2^{-i\alpha}$, so $|C_i|$ decays by roughly $\alpha$ bits per degree — exactly the fact that makes Horner's operands narrow, reused here. A product $C_iY^i$ whose result is only needed to the heap's LSB $2^{\ell_R}$ can therefore afford a $Y^i$ quantized to about the width of $C_i$: computing just right quantizes $\widetilde Y_i^{\,i}$ to the same size as $C_i$, hence takes a *truncated* version $\widetilde Y_i$ of $Y$ as input. The high powers, which are the expensive ones to form, are precisely the ones needed to fewest bits. Each box is then a [[Truncated Multipliers|truncated multiplier]] fed by a truncated powering unit; for $i=2$ that unit is a [[Squarers and Integer Powers|truncated squarer]], about half the area of the multiplier it replaces.

**Or skip the arithmetic and read the power from a table.** For large $i$, $\widetilde Y_i$ is narrow enough that tabulating $\widetilde Y_i^{\,i}$ becomes attractive, and there is no latency to pay for it: a table-based range reduction has already put a [[Polynomial Coefficient Table]] on the critical path, and the power table reads in parallel with it, indexed by a different slice of the input. This is what [Che15] does for the $Y^3$ term of a degree-3 Taylor evaluator while keeping a truncated squarer for $Y^2$.

**Merge every addition into one bit heap.** The three products and the constant do not need three separate adders; they are all just weighted bits. Expanding the coefficient and the argument bit by bit,

$$C_iY^i=\Bigl(\sum_j 2^j c_{i,j}\Bigr)\Bigl(\sum_k 2^k y_k\Bigr)^{i},$$

and distributing the product over both sums turns the whole evaluator into a single [[Bit Heaps|bit heap]] of partial products, compressed once by one [[Compressor Trees|compressor tree]] and carry-propagated once at the end. Every bit whose weight is low enough that the discarded set sums to less than $2^{\ell_R}$ is simply never generated — see [[Error Accuracy]] for how that bound is taken. Fig. 18.21 (p. 561) gives three realisations of a $\left[C_ix^i\right]$ box within this scheme: (a) a faithful powering unit followed by a truncated multiplier, (b) a tabulated rounded power followed by a truncated multiplier, (c) a fused partial-product generator that never materialises $P_i=\left[\widetilde Y_i^{\,i}\right]$ at all. Each may emit $T_i$ as loose weighted bits, as a carry-save pair, or fully compressed. Which combination wins is, in the authors' words, an open question.

> [!important]
> The boxes in the diagram are a *drawing* convention, not a module boundary. The best implementations dissolve them: one bit heap receives partial products from all degrees at once, so the "adder tree" and the "multipliers" are the same tree.

**Two free simplifications from parity.** $x^i$ has the parity of $i$, so for even $i$ the computation of $\left[C_ix^i\right]$ can ignore the sign bit of $Y$ entirely, and for odd $i$ the sign is handled by XOR-based negation — the same trick the multipartite method uses, and cheaper than a full two's-complement negation (see [[Number Formats]]).

**Widths, for the RTL below.** Take $Y$ and every $C_i$ as unsigned with LSB $2^{-8}$, so 8 bits each. The powers are requantized to 8 bits after each squaring, $\widetilde Y_2=\left[Y^2\right]_{-8}$ and $\widetilde Y_3=\left[\widetilde Y_2Y\right]_{-8}$, which is the "same size as $C_i$" rule at its crudest — all coefficients happen to be 8 bits here. Each product $T_i=C_i\widetilde Y_i$ is then an exact 16-bit value at LSB $2^{-16}$, which fixes the heap LSB at $\ell_R=-16$; $C_0$ enters the heap left-shifted by 8 to reach the same alignment. Four addends bounded by $2^{16}$ sum to at most $2^{18}$, so $R_{\text{ext}}$ is 18 bits and the tree is exact — every bit of error in this design was already committed by the two power truncations.

**On FPGAs the balance shifts twice.** Multipliers stop being the scarce thing (a DSP block does an $18\times 18$ product in one tile) but become a hard, countable resource, so the parallel evaluator's extra multipliers are a cliff rather than a slope; simultaneously the tabulated-power option (b) gets cheaper, because block RAM is already committed to the coefficient table and a second port or a second block is nearly free. The compressor tree is the part that maps worse: it becomes LUT logic competing with the DSP-adjacent routing rather than a dedicated carry chain (see [[FPGAs]]).

$$\boxed{\ p(Y)=\sum_{i=0}^{d}C_iY^i=\sum_{i=0}^{d}\Bigl(\sum_j 2^j c_{i,j}\Bigr)\Bigl(\sum_k 2^k y_k\Bigr)^{i},\qquad \text{depth }O(\log d)\ }$$

**When it breaks.**

- **Above degree 3 there is no published design.** Every parallel evaluator in the literature ([PBM01], [OS05], [DD05], [Che15], [De+17]) targets 24 bits with uniform segmentation and stops at $d\le3$, where $\lceil\log_2(d+1)\rceil=2$ against Horner's 3 — a factor of 1.5 in depth for roughly double the multipliers. The asymptotic argument only starts paying at degrees nobody builds.
- **It assumes $|Y|\le1$.** Without a range reduction that normalizes the argument, $Y^d$ grows instead of shrinking, the coefficient decay disappears, and every truncation argument above inverts.
- **The powering unit is a serial chain of its own.** $O(\log d)$ counts multiplier delays for the binary decomposition, but at $d=3$ that chain is $Y\to Y^2\to Y^3$: two multiplies deep, which is most of Horner's depth already. The win is real only once the products can start before all the powers are ready — i.e. once the boxes are dissolved into the heap.
- **[[SquareRich Evaluation]] competes for the same slack.** Completing the square trades a multiplier for a squarer without giving up Horner's structure, and its reported gains extend to degree 6.

**RTL (Spade).**

```spade
/// Degree-3 parallel polynomial evaluator, unsigned fixed point.
/// Y and every C_i carry LSB 2^-8; the bit heap carries LSB 2^-16.
entity ppe3(y: uint<8>, c0: uint<8>, c1: uint<8>, c2: uint<8>, c3: uint<8>) -> uint<18> {
    // powering unit: Y^2 then Y^3, each requantized to 8 bits (LSB 2^-8)
    let y2: uint<8> = trunc((y * y) >> 8);
    let y3: uint<8> = trunc((y2 * y) >> 8);

    // the [C_i x^i] boxes: exact 16-bit products, all at LSB 2^-16
    let t1: uint<16> = c1 * y;
    let t2: uint<16> = c2 * y2;
    let t3: uint<16> = c3 * y3;
    let t0: uint<16> = zext::<8, 16>(c0) << 8;   // C0 aligned into the heap

    // one bit heap, balanced: depth 2 instead of Horner's 3
    let a: uint<18> = trunc(zext::<16, 18>(t0) + zext::<16, 18>(t1));
    let b: uint<18> = trunc(zext::<16, 18>(t2) + zext::<16, 18>(t3));
    trunc(a + b)
}
```

`y2`/`y3` are the powering unit that feeds the $\widetilde Y_2$ and $\widetilde Y_3$ taps; `t1`/`t2`/`t3` are the $\left[C_ix^i\right]$ boxes and `t0` is the $C_0$ alignment shift. The `>> 8` after each `uint<8> * uint<8> -> uint<16>` product is the requantization to LSB $2^{-8}$, and it is the only lossy step — the `trunc` on `a + b` cannot lose a bit because the sum of four 16-bit addends is bounded by $2^{18}$. Everything is combinational; a real operator would register at least the table output and the heap output. Synthesis will not build the two-level adder tree drawn here: given the whole cone at once it flattens all four addends into one carry-save network, which is exactly the bit-heap merge the diagram's single box is standing in for.

> [!warning] Not covered in the source — needs outside research
> The book states that the error analysis of a parallel evaluator is *simpler* than Horner's — no recurrence, one parameter, the bit-heap LSB — and then leaves it as an exercise because it depends on which realisation of Fig. 18.21 each box uses (p. 561). There is no closed-form $\bar\delta_{\text{eval}}$ for this architecture in Chapter 18, nothing corresponding to Algorithm 18.2's sizing loop, and no published sizing procedure cited.

**Related Notes.**

- [[Horner Evaluation]] – compares: the same polynomial factored into a chain, minimal in multipliers and $\Theta(d)$ deep, against this note's $O(\log d)$ for more of them.
- [[Estrin's Scheme]] – extends: the recursive odd/even split that generates this parallelism systematically rather than by hand.
- [[Bit Heaps]] – depends-on: the representation in which all $d+1$ monomials become one summation problem.
- [[Compressor Trees]] – depends-on: what actually collapses that heap, and the reason depth is logarithmic in the number of addends.
- [[Squarers and Integer Powers]] – supports: the $\widetilde Y_i^{\,i}$ units, where a truncated squarer beats a truncated multiplier.
- [[Truncated Multipliers]] – supports: each $\left[C_ix^i\right]$ box, sized so that discarded partial products stay under the heap LSB.
- [[Polynomial Coefficient Table]] – supports: the table the powers can be read alongside for free.
- [[HOTBM]] – extends: the only generic-degree instance of this architecture, which additionally tabulates $C_i(A)P_{k,i}$ against a truncated interval index.
- [[ILP-Optimized Polynomial Evaluator]] – extends: solves for this architecture's parameters exactly, and reaches correct rounding at degrees 1-2.
- [[SquareRich Evaluation]] – counter-example: buys the same squarer-for-multiplier trade without abandoning Horner's factorisation.
- [[Choosing a Polynomial Evaluator]] – compares: where this sits against every sibling in the latency/area plane.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation".

- §18.3.2 Parallel evaluation, Eq. (18.30) and the three hardware observations, pp. 558-559; Fig. 18.20 (generic parallel architecture), p. 560; survey of published designs [PBM01], [OS05], [DD05], [Che15], [De+17], pp. 560-561; Fig. 18.21 (three realisations of $\left[C_ix^i\right]$) and the note that the error analysis is left as an exercise, p. 561.
- §18.3.3 Estrin's odd/even decomposition, p. 561.
- §18.3.1 Horner and the $\approx\alpha$-bits-per-degree coefficient decay reused above, pp. 554-558.
