---
title: HOTBM
description: "Splits each power term into subwords and tabulates C_i(A)*P_k,i against a truncated interval index — the table-based route to a parallel evaluator of any degree."
kind: circuit
source: "ASA §18.3.2, pp. 558-561"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, table-based, multipartite, fpga]
aliases:
  - High-Order Table-Based Method
  - Higher-Order Table-Based Method
  - HOTBM method
  - Table-Based Polynomial Evaluation
---

# HOTBM

The one parallel polynomial evaluator that is generic in degree: it forms each power term $P_i=\left[\widetilde Y_i^{\,i}\right]$ explicitly, then replaces the multiplication $C_i\times P_i$ by a set of subword tables addressed by a **truncated** interval index.

```tikz title="HOTBM realisation of one parallel-evaluator term, with the truncated interval index feeding the low-subword table"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- inputs ----------
\node[font=\small] at (0.6,7.55) {$A$};
\node[font=\tiny,anchor=west] at (0.85,7.55) {$\alpha$ bits, the interval index};
\draw[thick] (0.6,7.35) -- (0.6,5.65);
\node[font=\small] at (5.4,6.55) {$\widetilde Y_i$};
\node[font=\tiny,anchor=west] at (5.65,6.55) {$w_{Y_i}$ bits};
\draw[thick] (5.4,6.35) -- (5.4,5.65);
% ---------- truncated index bus, routed over the top ----------
\draw[thick] (0.6,6.9) -- (8.5,6.9) -- (8.5,2.65);
\node[circ] at (0.6,6.9) {};
\node[font=\tiny,anchor=south] at (4.3,6.95)
  {$\lfloor A\rfloor$ — the top $\alpha-t$ bits only};
% ---------- blocks ----------
\node[draw,thick,minimum width=2.4cm,minimum height=0.9cm,align=center]
  (ct) at (1.4,5.2) {coefficient table\\$C_i(A)$};
\node[draw,thick,minimum width=2.6cm,minimum height=0.9cm,align=center]
  (pow) at (5.4,5.2) {$P_i=\left[\widetilde Y_i^{\,i}\right]$\\table or powering unit};
\node[draw,thick,minimum width=3.0cm,minimum height=0.7cm] (spl) at (5.4,3.8) {};
\draw[thick] (5.4,3.45) -- (5.4,4.15);
\node at (4.65,3.8) {$P_{1,i}$};
\node at (6.15,3.8) {$P_{0,i}$};
\node[draw,thick,minimum width=2.2cm,minimum height=0.9cm,align=center]
  (mul) at (2.8,2.2) {truncated\\$\times$};
\node[draw,thick,minimum width=2.6cm,minimum height=0.9cm,align=center]
  (rom) at (7.8,2.2) {ROM\\$\left[C_i(\lfloor A\rfloor)\,P_{0,i}\right]$};
\draw[thick] (0.4,0.7) rectangle (9.1,1.3);
\node at (4.75,1.0) {compressor tree (one bit heap for all $d+1$ terms)};
% ---------- wiring ----------
\draw[thick] (1.4,4.75) -- (1.4,3.0) -- (2.3,3.0) -- (2.3,1.75+0.9);
\node[font=\tiny,anchor=west] at (1.5,4.35) {$C_i(A)$};
\node[font=\tiny,anchor=west] at (1.5,3.95) {$m_i-\ell_i$ bits};
\draw[thick] (5.4,4.75) -- (5.4,4.15);
\node[font=\tiny,anchor=west] at (5.5,4.45) {$w_P$ bits};
\draw[thick] (4.65,3.45) -- (4.65,3.0) -- (3.3,3.0) -- (3.3,2.65);
\node[font=\tiny,anchor=south] at (3.9,3.03) {$w_1$};
\draw[thick] (6.15,3.45) -- (6.15,3.0) -- (7.2,3.0) -- (7.2,2.65);
\node[font=\tiny,anchor=south] at (6.7,3.03) {$w_0$};
\draw[thick] (2.8,1.75) -- (2.8,1.3);
\draw[thick] (7.8,1.75) -- (7.8,1.3);
\node[font=\tiny,anchor=west] at (2.9,1.52) {shifted $w_0$ bits left in the heap};
\draw[thick,->] (4.75,0.7) -- (4.75,0.1);
\node[font=\small,anchor=west] at (4.85,0.3) {$T_i$};
% ---------- footnote ----------
\node[font=\tiny,anchor=west,align=left] at (0.2,-0.6)
  {Left branch: an ordinary truncated multiplier. Right branch: the HOTBM move. Because $C_i$ varies\\
   smoothly with $A$, the product $C_i(\lfloor A\rfloor)\,P_{0,i}$ fits a ROM of $2^{\,\alpha-t+w_0}$ words --- bought by\\
   substituting a neighbouring coefficient, at the price of one extra term in the error budget.};
\end{circuitikz}
\end{document}
```

*own construction, expanding the $\left[C_ix^i\right]$ box of Fig. 18.20, p. 560 with the variant described on p. 560 and the three realisations of Fig. 18.21, p. 561*

**Start from the box the parallel form leaves undefined.** A [[Parallel Polynomial Evaluator]] computes the developed form $p(Y)=\sum_{i=0}^{d}C_iY^i$ as $d+1$ independent terms $T_i=\left[C_iY^i\right]$ summed in one compressor tree. Fig. 18.21 (p. 561) offers three ways to fill that box: a faithful powering unit followed by a truncated multiplier, a tabulated rounded power followed by a truncated multiplier, or a fused partial-product generator. HOTBM [DD05] is the second, pushed one step further — the multiplier that follows the tabulated power is itself dissolved into tables.

**Form the power explicitly, then forget it is a power.** The term first computes
$$P_i=\left[\widetilde Y_i^{\,i}\right],$$
a faithfully rounded $w_P$-bit value, from a dedicated powering unit or from a table addressed by $\widetilde Y_i$ — the copy of $Y$ truncated to $w_{Y_i}$ bits. Truncating $Y$ per degree is free accuracy, not a compromise: after a range reduction of parameter $\alpha$ the coefficients decay by roughly $\alpha$ bits per degree, so $\widetilde Y_i^{\,i}$ may be quantised to about the size of $C_i$ itself (p. 559). For large $i$, $w_{Y_i}$ is small enough that the whole power *is* a table, read in parallel with the coefficient table that the range reduction already requires. Once $P_i$ exists, its provenance is irrelevant: what remains is a single product $C_i\times P_i$ of two $\le\!16$-bit words.

**Split that product by subwords, by distributivity of $\times$ over $+$.** Write $P_i$ as a positional sum of $K$ subwords, $P_i=\sum_{k=0}^{K-1}2^{s_k}P_{k,i}$ with $P_{k,i}$ of width $w_k$ and $s_k=\sum_{j<k}w_j$. Distributivity gives
$$C_iP_i=\sum_{k=0}^{K-1}2^{s_k}\,C_iP_{k,i},$$
and each summand is now a function of a *small* argument. This is exactly the decomposition that [[Multipartite Methods]] applies to the input word, and [[KCM, Table-Based Constant Multiplication]] applies to a compile-time constant; HOTBM's contribution is to apply it when the multiplicand is not a constant but a table entry.

**Kill the address explosion by truncating the interval index.** The multiplicand is not $C_i$ but $C_i(A)$, read from the coefficient table indexed by the $\alpha$-bit interval index $A$ produced by [[Uniform Piecewise Segmentation]]. So $C_i(A)P_{k,i}$ is a function of two words, of $\alpha$ and $w_k$ bits, and tabulating it directly costs $2^{\alpha+w_k}$ words — as large as the coefficient table times a factor $2^{w_k}$, which is hopeless. HOTBM addresses the table with only a *subset of the leading bits* of $A$, $\lfloor A\rfloor$ of width $\alpha-t$, cutting the table by $2^{t}$:
$$T_{k,i}=\Bigl[\,C_i(\lfloor A\rfloor)\,P_{k,i}\,\Bigr],\qquad 2^{\alpha-t+w_k}\ \text{words}.$$
This is legitimate only because the coefficient curves are smooth in $A$ — perfectly smooth for Remez or Chebyshev polynomials, near-smooth for `fpminimax` output (Figs. 18.12–18.14, pp. 545–546) — so the neighbouring coefficient $C_{i,\lfloor A\rfloor}$ is a usable approximation of $C_{i,A}$. It is the same smoothness that [[Polynomial Coefficient Table]] exploits for lossless differential compression, put to a different use: Hsiao's scheme *stores* the difference, HOTBM simply *discards* it and pays for it in the error budget.

**Only the low-weight subwords may take the truncated index.** The substitution error enters $T_i$ scaled by $2^{s_k}$, so it is affordable precisely where $s_k$ is small. The highest subword keeps the full coefficient and goes through a real truncated multiplier ([[Truncated Multipliers]]); the lower ones become ROMs. That asymmetry is what the diagram draws, and it is also the reason a HOTBM term is not simply "a pile of tables": it is a multiplier for the bits that matter and tables for the bits that do not.

> [!warning] The book states that the error of the $C_{i,A}\to C_{i,\lfloor A\rfloor}$ substitution "must be accounted for in the error analysis" (p. 560) and gives no bound, deferring to [DD05]. It also declines to give an error model for parallel evaluation at all, calling it architecture-dependent and leaving it as an exercise (p. 561). Sizing $t$ therefore needs the original paper, not this chapter.

**Two cheap consequences of centring and parity.** HOTBM is the only architecture in this family that centres the reduced argument on its subinterval (p. 561), i.e. uses $Y_s\in[-1,1)$ from (18.5)–(18.6) rather than $Y\in[0,1)$ — one inverter on the MSB, and every coefficient gains leading zeros, which shrinks both the coefficient table and every subword ROM addressed by it. On top of that, $x^i$ has the parity of $i$: for even $i$ the computation of $\left[C_ix^i\right]$ can ignore the sign bit of $Y$ entirely, and for odd $i$ negation is the XOR-based trick already used in the multipartite method (Fig. 17.11). Signed arithmetic in a table-based term is therefore nearly free — see [[Number Formats]] for the two's-complement identity behind the XOR negation, and [[Error Accuracy]] for the ulp bookkeeping that turns "faithful $P_i$" into a number.

**Everything merges into one bit heap.** Each $T_{k,i}$ leaves its ROM as a set of weighted bits, shifted left by $s_k$, and joins the terms of all other degrees in a single compressor tree ([[Sums of Weighted Bits]]) rather than being summed per-degree first. The final round then costs nothing: pre-adding a half-ulp into $C_0$ makes truncation of the heap output equal to round-to-nearest. On FPGAs the split is unusually favourable — the ROMs land in block memory or in LUTs directly (a $2^{\alpha-t+w_k}$-word table with $\alpha-t+w_k\le6$ is *one LUT per output bit*, see [[FPGAs]]), while the single surviving multiplier maps to one DSP block; on ASIC the same tables are synthesised logic and the trade-off swings back toward keeping the multipliers.

$$\boxed{\ \left[C_iY^i\right]=\sum_{k=0}^{K-1}2^{s_k}\Bigl[\,C_i(\lfloor A\rfloor)\,P_{k,i}\,\Bigr],\quad P_i=\left[\widetilde Y_i^{\,i}\right]=\sum_k 2^{s_k}P_{k,i},\quad \lfloor A\rfloor=\text{top }\alpha-t\text{ bits of }A\ }$$

## When it breaks

- **Table size is exponential in the subword width.** $2^{\alpha-t+w_k}$ words means $w_k$ must stay around 4–8 bits, so a 16-bit $P_i$ needs several subwords, and every extra subword adds a row to the bit heap. Past some $K$ the compressor tree costs more than the multiplier the tables replaced.
- **Smoothness is an empirical claim, not a theorem.** The `fpminimax` wiggles concentrate on the highest-degree coefficient (p. 546) — exactly the $C_i$ whose term is smallest and most tempting to tabulate. Check the actual coefficient curve before choosing $t$; there is no proof to lean on.
- **Non-uniform segmentation removes the premise.** Under logarithmic, hierarchical or dichotomy-based reduction the index $A$ is no longer a plain wire slice of $X$ and "neighbouring $A$" no longer means "neighbouring subinterval of comparable width", so truncating it has no smoothness argument behind it.
- **Degree above 3 is unexplored.** HOTBM is generic in $d$, but every published parallel evaluator targets 24 bits at degree $\le3$ with uniform segmentation (p. 560), and a higher degree implies a smaller $\alpha$, which shrinks $A$ until there is nothing left to truncate.
- **It buys depth, not area.** Against [[Horner Evaluation]] the win is $O(\log d)$ latency instead of $O(d)$; if latency is not the binding constraint, Horner's per-stage truncation already recovers ~26% of the multiplier area with one multiplier per degree and no tables at all.

## RTL (Spade)

```spade
/// One HOTBM term unit [C_i Y^i] for i=1, alpha=6, w_P=8, two 4-bit subwords.
/// ctab[A] = round(2^13 / ((64+A) ln 2)), i.e. C_1(A) for f(X) = log2(1+X).
entity hotbm_term(a: uint<6>, p: uint<8>) -> uint<16> {
    let ctab: [uint<8>; 64] = [
        185, 182, 179, 176, 174, 171, 169, 166, 164, 162, 160, 158, 156, 153, 152, 150,
        148, 146, 144, 142, 141, 139, 137, 136, 134, 133, 131, 130, 128, 127, 126, 124,
        123, 122, 121, 119, 118, 117, 116, 115, 114, 113, 111, 110, 109, 108, 107, 106,
        106, 105, 104, 103, 102, 101, 100,  99,  98,  98,  97,  96,  95,  95,  94,  93,
    ];
    // subword split of the power term P_i: P_1,i is the high subword, P_0,i the low one
    let p1: uint<4> = p.as_bits()[4..8].as_uint();
    let p0: uint<4> = p.as_bits()[0..4].as_uint();

    // high subword sees the full interval index
    let hi: uint<16> = ctab[a] * zext::<4, 8>(p1);

    // low subword sees A truncated to its top 3 bits: the neighbouring coefficient
    let a_trunc: uint<6> = a.as_bits()[3..6].as_uint() `concat` 0u3;
    let lo: uint<16> = ctab[a_trunc] * zext::<4, 8>(p0);

    trunc((hi << 4) + lo)
}
```

`a` is the interval index $A$ of the diagram ($\alpha=6$), `p` is the power term $P_i$ leaving the powering unit ($w_P=8$), `p1`/`p0` are the two 4-bit subwords, and `a_trunc` is $\lfloor A\rfloor$ — the top three bits re-zero-padded, which is what "address the ROM with a subset of the leading bits" means as a wire operation ($t=3$, so the low table is $2^{3+4}=128$ words instead of $2^{6+4}=1024$). The whole thing is combinational, one lookup deep; widths grow $8\times8\to16$ for each product, and the `<< 4` is the $2^{s_1}$ alignment, then `trunc` to 16 bits because $(2^8-1)^2<2^{16}$ makes the sum exactly representable. Synthesis will not build it this way: the right-hand product is a **ROM** holding $C_1(\lfloor A\rfloor)P_{0,i}$ directly, so the second `ctab` read and its multiplier collapse into one 128-word table — the multiply here computes exactly that table's contents, which is what makes the value checkable.

Verified by exhausting the entire $64\times256$ input space against a behavioural reference, plus 3000 random vectors and ten named ones including deliberately asymmetric subword patterns (`a=1, p=128` — high subword only — against `a=1, p=8`, the same bit pattern shifted into the low subword, which is precisely the case a swapped subword order would pass symmetrically and fail here).

## Related Notes

- [[Parallel Polynomial Evaluator]] – extends: HOTBM is one concrete realisation of the $\left[C_ix^i\right]$ box the parallel form leaves open, and the only one generic in degree.
- [[Multipartite Methods]] – depends-on: the subword decomposition, the ROM-per-subword structure and the XOR-based negation are lifted wholesale from Chap. 17.
- [[KCM, Table-Based Constant Multiplication]] – compares: the same product-by-table idea when the multiplicand is a compile-time constant rather than a table entry indexed by $A$.
- [[Polynomial Coefficient Table]] – supports: supplies $C_i(A)$, and its smoothness is the property HOTBM spends when it truncates $A$.
- [[Uniform Piecewise Segmentation]] – depends-on: supplies $A$ and $Y$ as a wire split, without which "truncate the interval index" is meaningless.
- [[Horner Evaluation]] – compares: the $O(d)$-depth alternative, cheaper in area, with a per-stage truncation analysis that HOTBM's structure has no equivalent of.
- [[Sums of Weighted Bits]] – supports: all $T_{k,i}$ across all degrees merge in one compressor tree, not one per term.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 18 "Polynomial-Based Architectures for Function Evaluation".

- §18.3.2 "Parallel Evaluation", pp. 558–561 — Eq. (18.30) and the three hardware observations, pp. 558–559; Fig. 18.20 (generic parallel architecture) and the HOTBM description, p. 560; Fig. 18.21 (three realisations of $\left[C_ix^i\right]$), centring and the missing error model, p. 561.
- §18.2.1 "Uniform piecewise splitting", pp. 541–547 — Eqs. (18.3)–(18.6) for $A$/$Y$ and the centred variant; Figs. 18.12–18.14, pp. 545–546, for the coefficient smoothness the truncated index relies on.
- Chapter 17 "Function Evaluation Using Tables and Additions", pp. 497 ff. — the subword decomposition and Fig. 17.11's XOR negation, cited from p. 559.
- [DD05] Jérémie Detrey and Florent de Dinechin, "Table-based polynomials for fast hardware function evaluation", *ASAP* 2005, pp. 328–333 — the original HOTBM, and the only source for its error analysis.
