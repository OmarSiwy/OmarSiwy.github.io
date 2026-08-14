---
title: "Three-Multiplication Complex Product"
description: "Gauss's trick mapped onto a DSP's pre- and post-adders: 3 multiplications and 5 additions instead of 4 and 2, because the adders are already sitting there unused."
kind: circuit
source: "ASA §4.2, eqs. 4.5-4.8 and Table 4.1, pp. 94-95"
status: seed
spade: simulated
tags: [digital, fpgas, dsp, multiplier, complex]
aliases:
  - 3-Multiplication Complex Product
  - Gauss Complex Multiplication
  - Complex Multiplier
  - Three-Multiplication Complex Multiplier
---

# Three-Multiplication Complex Product

A complex multiplier that spends 3 multiplications and 5 additions instead of the schoolbook 4 and 2, chosen not because additions are cheap in the abstract but because on an FPGA those five additions cost literally nothing — they land in pre- and post-adders that a DSP block contains whether you use them or not.

```tikz title="Three DSP blocks realizing a complex product, with the shared term K broadcast to both post-adders"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]

% ================= DSP 1 : K = Ar * (Br + Bi) =========================
\draw[dashed,rounded corners=3pt] (0.9,4.85) rectangle (11.6,7.15);
\node[anchor=west] at (1.0,6.95) {DSP 1};
\draw (1.6,5.5) rectangle (2.7,6.5); \node at (2.15,6.0) {$+$};
\draw[->] (0.15,6.3) -- (1.6,6.3); \node[anchor=east] at (0.1,6.3) {$B_r$\,{\scriptsize 18}};
\draw[->] (0.15,5.7) -- (1.6,5.7); \node[anchor=east] at (0.1,5.7) {$B_i$\,{\scriptsize 18}};
\draw[->] (2.7,6.0) -- (4.1,6.0); \node[anchor=south] at (3.4,6.05) {\scriptsize 19};
\draw (4.1,5.5) rectangle (5.2,6.5); \node at (4.65,6.0) {$\times$};
\draw[->] (4.65,7.05) -- (4.65,6.5); \node[anchor=west] at (4.75,6.82) {$A_r$\,{\scriptsize 18}};
\node[anchor=west] at (7.95,6.35) {post-adder idle ($Z=0$)};

% ================= K fan-out bus =====================================
\draw[->] (5.2,5.75) -- (7.9,5.75);
\node[anchor=south] at (6.5,5.80) {$K$\,{\scriptsize 37}};
\draw (7.9,5.75) -- (7.9,0.25);
\draw[->] (7.9,3.25) -- (8.6,3.25);
\draw[->] (7.9,0.25) -- (8.6,0.25);
\fill (7.9,3.25) circle (1.6pt);

% ================= DSP 2 : Pr = K - (Ar + Ai) * Bi ===================
\draw[dashed,rounded corners=3pt] (0.9,1.85) rectangle (11.6,4.15);
\node[anchor=west] at (1.0,3.95) {DSP 2};
\draw (1.6,2.5) rectangle (2.7,3.5); \node at (2.15,3.0) {$+$};
\draw[->] (0.15,3.3) -- (1.6,3.3); \node[anchor=east] at (0.1,3.3) {$A_r$\,{\scriptsize 18}};
\draw[->] (0.15,2.7) -- (1.6,2.7); \node[anchor=east] at (0.1,2.7) {$A_i$\,{\scriptsize 18}};
\draw[->] (2.7,3.0) -- (4.1,3.0); \node[anchor=south] at (3.4,3.05) {\scriptsize 19};
\draw (4.1,2.5) rectangle (5.2,3.5); \node at (4.65,3.0) {$\times$};
\draw[->] (4.65,4.05) -- (4.65,3.5); \node[anchor=west] at (4.75,3.82) {$B_i$\,{\scriptsize 18}};
\draw[->] (5.2,2.75) -- (8.6,2.75); \node[anchor=north] at (6.5,2.70) {\scriptsize 37};
\draw (8.6,2.5) rectangle (9.7,3.5); \node at (9.15,3.0) {$-$};
\draw[->] (9.7,3.0) -- (11.9,3.0); \node[anchor=south] at (10.8,3.05) {$P_r$\,{\scriptsize 48}};

% ================= DSP 3 : Pi = K - (Ar - Ai) * Br ===================
\draw[dashed,rounded corners=3pt] (0.9,-1.15) rectangle (11.6,1.15);
\node[anchor=west] at (1.0,0.95) {DSP 3};
\draw (1.6,-0.5) rectangle (2.7,0.5); \node at (2.15,0.0) {$-$};
\draw[->] (0.15,0.3) -- (1.6,0.3); \node[anchor=east] at (0.1,0.3) {$A_r$\,{\scriptsize 18}};
\draw[->] (0.15,-0.3) -- (1.6,-0.3); \node[anchor=east] at (0.1,-0.3) {$A_i$\,{\scriptsize 18}};
\draw[->] (2.7,0.0) -- (4.1,0.0); \node[anchor=south] at (3.4,0.05) {\scriptsize 19};
\draw (4.1,-0.5) rectangle (5.2,0.5); \node at (4.65,0.0) {$\times$};
\draw[->] (4.65,1.05) -- (4.65,0.5); \node[anchor=west] at (4.75,0.82) {$B_r$\,{\scriptsize 18}};
\draw[->] (5.2,-0.25) -- (8.6,-0.25); \node[anchor=north] at (6.5,-0.30) {\scriptsize 37};
\draw (8.6,-0.5) rectangle (9.7,0.5); \node at (9.15,0.0) {$-$};
\draw[->] (9.7,0.0) -- (11.9,0.0); \node[anchor=south] at (10.8,0.05) {$P_i$\,{\scriptsize 48}};

\end{circuitikz}
\end{document}
```

*Own construction; the mapping realizes eqs. 4.5-4.8 onto the datapath of eq. 4.4, p. 94. Widths are UltraScale+ (Table 4.1, p. 95).*

**Start from the definition and count what it costs.** For $A = A_r + jA_i$ and $B = B_r + jB_i$ with all four components $n$-bit two's complement, the definition of complex multiplication gives

$$P_r = A_rB_r - A_iB_i, \qquad P_i = A_rB_i + A_iB_r$$

(eqs. 4.5 and 4.7, p. 94). Four $n\times n$ products, two $2n$-bit additions. On an FPGA the multiplications are the billed resource: four DSP blocks, and the two additions are free because each product already emerges from a DSP whose post-adder can accept the other product as its $Z$ input.

**Find one product that both outputs want.** The two lines share no term as written, but they can be made to. Introduce

$$K = A_r(B_r + B_i) = A_rB_r + A_rB_i$$

by distributivity of multiplication over addition. $K$ contains $A_rB_r$, which $P_r$ wants, and $A_rB_i$, which $P_i$ wants; each output therefore needs $K$ minus the term it did not ask for. For $P_r$ that surplus is $A_rB_i$, and $P_r$ is additionally short of $-A_iB_i$, so the correction is $A_rB_i + A_iB_i = (A_r + A_i)B_i$ — again by distributivity, run backwards to factor. For $P_i$ the surplus is $A_rB_r$ and the shortfall is $A_iB_r$, giving the correction $A_rB_r - A_iB_r = (A_r - A_i)B_r$. That yields eqs. 4.6 and 4.8:

$$P_r = A_r(B_r + B_i) - (A_r + A_i)B_i, \qquad P_i = A_r(B_r + B_i) - (A_r - A_i)B_r$$

Expanding either line makes the cross terms cancel identically, so this is an exact rewrite over $\mathbb{Z}$, not an approximation — no rounding or truncation enters, and [[Error Accuracy]] has nothing to say about it.

**Count again.** Three multiplications — $K$, $(A_r+A_i)B_i$, $(A_r-A_i)B_r$ — and five additions: three pre-multiplication ($B_r+B_i$, $A_r+A_i$, $A_r-A_i$) and two post-multiplication ($K$ minus each correction). Trading one multiplication for three additions is the same bargain [[Karatsuba]] makes on wide integer multiplication, and for the same algebraic reason: a shared product bought with cheap linear combinations.

**The mapping is what makes the trade good, not the count.** In general-purpose logic, three extra $2n$-bit additions against one saved $n\times n$ multiplication is a marginal call, and at small $n$ it loses. On an FPGA it is not a call at all, because a DSP block computes $R = (X_0 + X_1)\times Y + Z$ (eq. 4.4, p. 94) — a pre-adder *and* a post-adder wrapped around the hard multiplier, present whether or not you use them. Each of the three products in the rewrite has exactly the shape $(\text{sum of two}) \times (\text{one})$, and each of the two output corrections has the shape $(\text{product}) \pm Z$. Three DSP blocks absorb all three multiplications and all five additions, with **zero fabric logic**: no LUTs, no carry chain, no [[Fast Carry Chain]]. Against four DSPs for the schoolbook form, that is a flat 25% saving in the scarce resource, paid for entirely out of hardware that was idle.

**Widths, with the pre-adder growth accounted for.** Take $n = 18$ on UltraScale+ (Table 4.1, p. 95: $18\times27$ multiplier, 27-bit pre-adder, 48-bit post-adder). Each pre-adder sum is $n+1 = 19$ bits — a signed sum of two $n$-bit values needs one more bit, and truncating it here would be a silent wrap, not a rounding. The pre-added operand feeds the wide (27-bit) multiplier port, so 19 bits is comfortable; the un-pre-added operand feeds the narrow 18-bit port. Each product is $19 + 18 = 37$ bits. The corrections subtract two $37$-bit values, and the true range of $P_r$ and $P_i$ is $2n+1 = 37$ bits signed — $P_i$ attains $2\cdot 2^{2n-2} = 2^{2n-1}$ at $A_r = A_i = B_r = B_i = -2^{n-1}$, which overflows $2n$ bits by exactly one, so $2n+1$ is tight and not conservative. The 48-bit post-adder carries all 37 with room to spare. See [[Number Formats]] for the two's-complement conventions these ranges assume.

**The narrow port is the hidden cost.** The schoolbook form puts $A_r, A_i$ always on the 27-bit port and $B_r, B_i$ always on the 18-bit port, so it exploits the multiplier's asymmetry: 27-bit $\times$ 18-bit operands. The three-multiplication form cannot. $A_r$ appears un-pre-added in DSP 1, $B_i$ in DSP 2 and $B_r$ in DSP 3 — three of the four components are forced onto the narrow port, so every component is capped at 18 bits and the wide port is wasted on a 19-bit sum. The DSP saving is real, but it is bought with roughly a third of the operand width. And on AMD parts the tabulated sizes are **signed**; an unsigned complex product must tie the MSB to zero, so an $18\times27$ signed unit is a $17\times26$ unsigned one (p. 95).

$$\boxed{\ P_r = \underbrace{A_r(B_r + B_i)}_{K} - (A_r + A_i)B_i, \qquad P_i = K - (A_r - A_i)B_r\ }$$

$$\boxed{\ 3 \text{ mult} + 5 \text{ add} = 3 \text{ DSP} + 0 \text{ LUT}\quad\text{vs.}\quad 4 \text{ mult} + 2 \text{ add} = 4 \text{ DSP} + 0 \text{ LUT}\ }$$

> [!important]
> The saving exists only because the additions are free. The moment any of the five falls out of a DSP and into the fabric, re-cost it: a $2n$-bit fabric adder plus its routing can easily be worse than the DSP it was meant to save.

**When it breaks:**

- **Intel parts, where the 4-multiplication form wins.** Stratix V and Stratix 10 DSPs run two smaller multipliers ($16\times16$, $18\times19$) per block with a single shared post-adder that sums the two results. That maps eqs. 4.5 and 4.7 directly: one DSP for $P_r$, one for $P_i$, **two** DSPs total, four multiplications (p. 95). Three is more than two — the trick loses outright on Intel unless the operands are too wide for the dual-multiplier mode.
- **Pre-adder absent.** Virtex 5 and the $9\times9$ and $36\times18$ Stratix V modes have no pre-adder (Table 4.1, p. 95). The three sums then move into the fabric and the argument collapses to the general-purpose one.
- **Operands above the narrow port width.** Once a component exceeds 18 bits (UltraScale+), each multiplication becomes a tiled multi-DSP construction and the $3:4$ ratio applies to tiles, not blocks — with three pre-adder sums now $n+1$ bits wide, which may push the tiling one DSP further than the schoolbook form does.
- **One operand is constant.** If $B$ is a fixed twiddle factor, as in an FFT butterfly, the multiplications are constant multiplications and the relevant comparison is against [[Multiplication by Constants]], not against a generic multiplier.
- **Latency matching.** $K$ is consumed one DSP later than it is produced, so its path needs one more pipeline stage than the two correction paths — or, if the DSPs are cascaded, the cascade route must be the one carrying it.

> [!warning] Not covered in the source — needs outside research
> Eq. 4.4 writes the post-adder as an addition, $R = (X_0+X_1)\times Y + Z$, but eqs. 4.6 and 4.8 both need $Z - (X_0 \pm X_1)\times Y$. Chapter 4 does not say whether the post-adder supports a subtractive mode, nor whether the pre-adder does (both DSP 3's $A_r - A_i$ and the two corrections are subtractions). The diagram above assumes both do. If a given device's pre-adder is add-only, $A_r - A_i$ must be formed in the fabric.

> [!warning] Not covered in the source — needs outside research
> Chapter 4 gives no register-stage count, latency or $f_{\max}$ for DSP blocks, so the number of pipeline stages needed to delay-match $K$ against the two correction paths cannot be read off the book.

**RTL.** The rewrite in Spade, one entity per output pair rather than one per DSP, because the shared term is a `let` and the tool decides the mapping:

```spade
/// Complex product P = A*B by Gauss's three-multiplication rewrite.
/// Combinational; three multiplications, five additions.
fn cplx3<#uint N>(ar: int<N>, ai: int<N>, br: int<N>, bi: int<N>)
    -> (int<{2 * N + 1}>, int<{2 * N + 1}>)
{
    // the three pre-adders: N+1 bits each
    let sb: int<{N + 1}> = br + bi;
    let sa: int<{N + 1}> = ar + ai;
    let da: int<{N + 1}> = ar - ai;

    // Spade's `*` needs equal operand widths, so match the pre-adder width
    let ar_w: int<{N + 1}> = sext(ar);
    let br_w: int<{N + 1}> = sext(br);
    let bi_w: int<{N + 1}> = sext(bi);

    let k = ar_w * sb;      // the shared term, 2N+2 bits
    let m1 = sa * bi_w;
    let m2 = da * br_w;

    // the two post-adders; 2N+1 bits is the exact range, so trunc is lossless
    (trunc(k - m1), trunc(k - m2))
}
```

`sb`, `sa`, `da` are the three pre-adder outputs in the diagram; `k` is the $K$ bus; `k - m1` and `k - m2` are the two subtractive post-adders. The `sext` calls are a Spade artifact, not hardware — the DSP's multiplier port is already wider than the operand, so sign extension is wiring. Widths: `*` on two `int<N+1>` gives `int<2N+2>`, `-` gives `int<2N+3>`, and the `trunc` to `int<2N+1>` is exact because $|P| < 2^{2N}$; get that bound wrong and the truncation silently wraps. The whole block is combinational, so synthesis will insert the DSP's internal pipeline registers itself and the three lanes will not be balanced unless you place them by hand.

Compiled and simulated with a concrete `N = 8` wrapper: 5010 vectors, 10 named (including the asymmetric $(1+0j)(0+127j)$ and $(-128+127j)(1-2j)$, and the corner $(-128-128j)(-128-128j)$ that forces the $2N+1$st bit) plus a 5000-vector random sweep against a behavioural `ar*br - ai*bi`, `ar*bi + ai*br` reference. No failures.

**Related notes.**

- [[DSP Blocks]] – depends-on: the $R = (X_0+X_1)\times Y + Z$ datapath is the only reason this rewrite is cheaper than the schoolbook one.
- [[Karatsuba]] – compares: the same one-multiplication-for-three-additions trade, applied to split integer operands instead of the real and imaginary parts.
- [[Multipliers]] – compares: places this against the general multiplier constructions its three products are built out of.
- [[Choosing an FPGA Primitive]] – supports: the resource argument that makes trading multiplications for additions correct here and wrong in general.
- [[Multiplication by Constants]] – counter-example: when $B$ is a fixed twiddle factor the three generic multipliers are the wrong baseline entirely.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §4.2 "DSP Blocks", pp. 94-95 — eq. 4.4 (DSP datapath), eqs. 4.5-4.8 (complex product), Table 4.1 (multiplier, pre-adder and post-adder widths per device), signed-vs-unsigned note and the Intel dual-multiplier two-DSP alternative.
