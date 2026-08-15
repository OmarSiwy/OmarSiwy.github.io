---
title: "Floating-Point Polynomial Function Evaluator"
description: "Wraps a fixed-point polynomial core in exponent handling, and gets a logarithmic segmentation for free because the input exponent is already a crude log2(X)."
kind: circuit
source: "ASA §18.5, pp. 568-569"
status: seed
spade: simulated
tags: [digital, polynomial-approximation, floating-point, segmentation, table, fpga]
aliases:
  - Floating-Point Function Evaluator
  - Floating-Point Polynomial Evaluator
  - Floating-Point Elementary Function Evaluator
  - Floating-Point Architectures Based on Fixed-Point Polynomials
---

# Floating-Point Polynomial Function Evaluator

A floating-point elementary function is a fixed-point polynomial core with an exponent wrapper around it, and the wrapper is nearly free: the exponent field of the input is already a crude $\log_2 X$, so it supplies the segmentation that a fixed-point operator would have to build an LZC and a barrel shifter to obtain.

```tikz title="Floating-point wrapper around a fixed-point polynomial core: the exponent field becomes the table address, the low significand bits become the reduced argument Y"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- input floating-point word ----------
\draw[thick] (0,4.2) rectangle (9.0,4.8);
\draw[thick] (0.6,4.2) -- (0.6,4.8);
\draw[thick] (3.0,4.2) -- (3.0,4.8);
\draw[thick,dashed] (4.2,4.2) -- (4.2,4.8);
\node[font=\tiny] at (0.3,4.5) {$S$};
\node at (1.8,4.5) {$E$};
\node[font=\tiny] at (3.6,4.5) {$\alpha$};
\node at (6.6,4.5) {$Y$};
\node[anchor=east] at (-0.15,4.5) {$X\ =$};
\draw[<->] (0.6,5.25) -- node[above,font=\tiny]{$w_E$} (3.0,5.25);
\draw[<->] (3.0,5.25) -- node[above,font=\tiny]{$\alpha$} (4.2,5.25);
\draw[<->] (4.2,5.25) -- node[above,font=\tiny]{$w_Y=w_F-\alpha$} (9.0,5.25);
\node[font=\tiny,anchor=west] at (9.15,4.5) {LSB $2^{-w_F}$};

% ---------- exponent -> saturating segment index ----------
\node[draw,thick,minimum width=2.0cm,minimum height=0.6cm,align=center] (sat) at (1.8,3.4)
  {{\tiny saturate to}\\[-3pt]{\tiny $[E_{\min},E_{\max}]$}};
\draw[->,thick] (1.8,4.2) -- (sat.north);
\node[font=\tiny,anchor=west,align=left] at (6.75,3.6) {$E$ is a crude $\log_2 X$:\\a free logarithmic segmentation};

% ---------- coefficient + exponent table ----------
\node[draw,thick,minimum width=3.4cm,minimum height=1.1cm,align=center] (tab) at (2.6,2.15)
  {{\tiny coefficient $+$}\\[-3pt]{\tiny output-exponent table}\\[-3pt]{\tiny $2^{k+\alpha}$ entries}};
\draw[->,thick] (sat.south) -- node[right,font=\tiny]{$k$} (1.8,2.65);
\draw[->,thick] (3.6,4.2) -- (3.6,2.65);

% ---------- fixed-point core ----------
\node[draw,thick,minimum width=3.0cm,minimum height=1.0cm,align=center] (hor) at (7.0,0.9)
  {fixed-point\\[-2pt]Horner evaluator};
\draw[->,thick] (6.6,4.2) -- node[right,font=\tiny,pos=0.62]{$w_Y$} (6.6,1.4);
\draw[thick] (4.3,2.45) -- (5.0,2.45) -- (5.0,0.9);
\draw[->,thick] (5.0,0.9) -- (5.5,0.9);
\node[font=\tiny,anchor=east] at (4.92,1.2) {$C_0\dots C_d$};

% ---------- normalise / round / repack ----------
\node[draw,thick,minimum width=3.0cm,minimum height=0.6cm,align=center] (nrm) at (7.0,-0.7)
  {{\tiny normalise $+$ round}};
\draw[->,thick] (7.0,0.4) -- node[right,font=\tiny]{$R_{\text{ext}}$} (7.0,-0.4);
\draw[thick] (2.0,1.6) -- (2.0,-0.7);
\draw[->,thick] (2.0,-0.7) -- node[above,font=\tiny,pos=0.35]{$E_R$} (5.5,-0.7);

% ---------- sign / special path ----------
\draw[thick] (0.3,4.2) -- (0.3,-1.9);
\draw[->,thick] (0.3,-1.9) -- node[above,font=\tiny,pos=0.55]{sign, zero/Inf/NaN} (4.0,-1.9);

% ---------- output word ----------
\draw[thick] (4.0,-2.2) rectangle (10.0,-1.6);
\draw[thick] (4.6,-2.2) -- (4.6,-1.6);
\draw[thick] (6.4,-2.2) -- (6.4,-1.6);
\node[font=\tiny] at (4.3,-1.9) {$S_R$};
\node at (5.5,-1.9) {$E_R$};
\node at (8.2,-1.9) {$F_R$};
\node[anchor=west] at (10.15,-1.9) {$=\ \mathrm{fl}(f(X))$};
\draw[->,thick] (7.0,-1.0) -- (7.0,-1.6);

\node[font=\tiny,align=left,anchor=north west] at (-0.6,-2.7)
  {the exponent field costs nothing and already segments $[X_{\min},X_{\max}]$ logarithmically;\\
   $\alpha$ significand bits refine it, everything right of the table is the fixed-point operator unchanged};
\end{circuitikz}
\end{document}
```

**Cut the operator at the format boundary, not at the function.** A normal floating-point input is $X=(-1)^{S}2^{E-b}(1+F)$ with $S$ one bit, $E$ of $w_E$ bits, $F$ of $w_F$ bits and LSB $2^{-w_F}$, and an implicit leading one ([[Floating-Point Formats]]); binary32 is $(1,8,23)$ with bias $b=127$. Every efficient hardware architecture for a floating-point elementary function [PBM01; OS05; LP13; Che15; JP20] is built the same way: a fixed-point polynomial core, plus logic that manipulates $E$ around it (p. 568). Nothing in [[Polynomial Approximation]] is lost by the chapter's fixed-point focus, because the significand $1+F\in[1,2)$ *is* a fixed-point word of $w_F$ bits, and $E$ is an integer. The wrapper's whole job is to turn $(S,E,F)$ into (address, $Y$) on the way in and to turn (fixed-point result, tabulated exponent) back into $(S_R,E_R,F_R)$ on the way out — the operators in between are the ones the rest of this topic describes.

**The exponent is the segmentation, and it has already been paid for.** For a normal $X$, $E-b=\lfloor\log_2|X|\rfloor$ exactly, so reading $E$ as an index partitions the input domain into binades — intervals $[2^{e},2^{e+1})$ whose widths grow geometrically. That is precisely the partition [[Logarithmic Segmentation]] constructs in fixed point, where it costs a leading-zero counter and a barrel shifter ([[Shifters]]). Here the LZC and the shift were performed by whatever normalized $X$ in the first place, so the segmentation is a **wire naming** and not a circuit (p. 568). Refine it by concatenating the top $\alpha$ bits of $F$ onto $E$: within one binade the significand is uniform, so this is a uniform sub-segmentation nested inside a logarithmic one — an LU [[Hierarchical Segmentation]] whose expensive first level is free. [JP20] uses exactly this, with a very small look-up table, for the probit function, i.e. the inverse cumulative distribution of the Gaussian, which is the canonical function with no usable algebraic identity.

**$Y$ is a slice, and unlike fixed-point logarithmic segmentation its width does not blow up.** Splitting $F$ at bit $\alpha$ gives $Y=F_{[w_F-\alpha-1\,..\,0]}$ of $w_Y=w_F-\alpha$ bits, LSB $2^{-w_F}$, and the change of variable

$$X=(-1)^{S}2^{E-b}\left(1+2^{-\alpha}A_F+2^{-\alpha}Y'\right),\qquad Y'=2^{\alpha-w_F}\,Y\in[0,1)$$

is exact and contributes no term to the error budget ([[Error Accuracy]]), for the same reason (18.3) does not: it is a renaming of bits already present. This is where the floating-point wrapper beats its fixed-point twin. In fixed point, logarithmic segmentation cannot promise a reduced $w_Y$ — at leading-zero count $A=0$ nothing is shifted away and $w_Y$ stays at $w_X-1$ — whereas here the significand is normalized by construction in *every* segment, so $w_Y=w_F-\alpha$ holds unconditionally, the clean guarantee of [[Uniform Piecewise Segmentation]]. The free segmentation is not merely free; it is the better of the two.

**Saturate the index, because the table cannot cover $2^{w_E}$ binades.** The exponent field spans $2^{w_E}$ values — $254$ normal binades in binary32 — while the table depth is the operator's only exponential resource ([[Polynomial Coefficient Table]]). Outside a window $[E_{\min},E_{\max}]$ of $2^{k}$ binades the function is handled without a polynomial at all: below $E_{\min}$ the result is a constant to within one ulp, above $E_{\max}$ it saturates, overflows, or is a special value. Clamping $E$ into that window and indexing on $k=\lceil\log_2(E_{\max}-E_{\min}+1)\rceil$ bits is the same repair §18.2.3 prescribes for fixed-point logarithmic segmentation — saturating the leading-bit count at $\alpha=\lceil\log_2 w_X\rceil$ or less, merging the leftmost intervals into one — and it is what turns a non-power-of-two, mostly-unused address space into a $2^{k+\alpha}$-entry ROM. Which constant the low end returns, and where the window edges sit, are properties of $f$ and of the target format; for $\exp$ they are worked out in full in [[Floating-Point Exponential]].

**[Tho15] turns the whole floating-point problem into a fixed-point one by splitting until the exponents stop moving.** The universal approximator of [Tho15] takes an arbitrary $f$ and a degree $d$, and first partitions the floating-point input domain into subdomains on which *neither the input nor its image changes exponent* (p. 569). Inside such a subdomain both the argument and the result have a fixed scale, so the operator is a fixed-point one and the machinery of this topic applies verbatim. Each subdomain is then split further, if needed, until $f$ is monotone on it and faithfully approximable by degree $d$. The table stores the coefficients **and the output exponent** $E_R$ — the tabulated exponent is what makes the repacking on the output side a concatenation rather than a computation. The resulting segmentation is arbitrary, so the segment index is located by [[Dichotomy-Based Segmentation]]; other schemes make much less sense once the domain is floating-point, because the natural boundaries are binades and those are already consumed by the first split. One shared [[Horner Evaluation]] datapath serves every subdomain's polynomial, and $d$ is again the memory/arithmetic knob it is in the fixed-point uniform generator.

**On FPGAs the wrapper is the cheap half.** The coefficient-and-exponent table is a wide, shallow ROM and maps to block RAM; the $d$ multipliers of decreasing width map to DSP blocks; the additions collapse into one compressor tree ([[FPGAs]]). What the floating-point wrapper adds on top is the saturating comparison on $E$, a concatenation, and the final normalise-and-round — comparisons and a small shift, all LUT-and-carry-chain work. It notably does *not* add the LZC and barrel shifter that fixed-point logarithmic segmentation needs, which is the concrete form the "free segmentation" claim takes in resources rather than in prose.

$$\boxed{\ X=(-1)^{S}2^{E-b}(1+F)\ \Longrightarrow\ A=\big(\mathrm{sat}_{[E_{\min},E_{\max}]}(E)\ \big\|\ F_{\text{top }\alpha}\big),\quad Y=F_{\text{low }w_F-\alpha},\quad f(X)=2^{E_R(A)}\,p_A(Y)\ }$$

> [!important] The exponent field is the one range reduction whose hardware someone else already built.
> Every other reduction in this topic buys accuracy with a circuit — a comparator tree, an LZC and shifter, a subtractor, a second-level table. The floating-point input arrives pre-reduced, so the operator gets $\lfloor\log_2|X|\rfloor$ and a normalized significand for the cost of reading two fields of a word it was handed anyway. That is why a floating-point elementary function is, in hardware, usually *smaller* than the fixed-point one of the same significand width, not larger.

> [!warning] §18.5 is two pages and gives no architecture-level detail
> The section states the two structural facts above and defers everything else — how $E_{\min}$ and $E_{\max}$ are chosen, how the tentative exponent is computed, how normalisation and rounding interact with the fixed-point error budget — to Chapter 22, which works one function ($\exp$) end to end. The window-and-saturation formulation above is this note's own reading of §18.2.3's saturated leading-bit count applied to the exponent field; the book does not write it that way.

> [!warning] No synthesis figures in the source
> Chapter 18 reports no LUT, DSP, BRAM or delay numbers for any of its architectures, floating-point ones included. Every quantity above is a wire width or a table depth derived from the chapter's own equations.

**When it breaks.**

- **Subnormals have no leading one and no meaningful exponent.** For $E=0$ the significand is $0+F$ and $\lfloor\log_2|X|\rfloor$ is no longer $E-b$, so the free segmentation collapses exactly where the input is smallest. The wrapper must either flush to zero, or pay for the LZC and shifter it was avoiding — at which point it is doing ordinary fixed-point logarithmic segmentation on $F$.
- **The image must stay in one binade too, not just the argument.** [Tho15]'s first split is on *both* $X$ and $f(X)$. A function whose output ranges over many binades within one input binade — anything with a pole, or $\exp$ over a wide argument — forces a split driven by the image, and the input-side "free" segmentation then buys nothing beyond the split it was already forced into.
- **Wide exponent, narrow window.** If $f$ is interesting over only a few binades, most of the $2^{w_E}$ address space is saturation logic and special cases, and the polynomial core is a small part of the operator. If $f$ is interesting over most of them, $2^{k+\alpha}$ outgrows the BRAM before $\alpha$ does anything useful.
- **Faithful in fixed point is not faithful in floating point.** The core produces $R_{\text{ext}}$ to some fixed LSB; the floating-point result's ulp depends on $E_R$, so a normalisation that shifts left by one costs a bit of accuracy that the fixed-point budget never accounted for. The budget has to be written against the *smallest* $E_R$ in the subdomain, which is one more reason the subdomains are split until the output exponent is constant ([[Rounding]]).
- **Correct rounding is out of reach here.** Faithful is what the fixed-point core delivers, and the ILP formulation that recovers correct rounding ([[ILP-Optimized Polynomial Evaluator]]) enumerates every input value of a subinterval — tractable at $w_X\le24$ in fixed point, not over a floating-point domain.

**RTL.** The wrapper's input side: saturate the exponent into the table's window, then form the address as the clamped index concatenated with $\alpha$ leading significand bits, and slice $Y$ off the bottom.

```spade
/// Floating-point wrapper for a fixed-point polynomial core: turn the exponent
/// and significand of X into a coefficient-table address and the fixed-point
/// reduced argument Y.
///   E is already a crude log2(X), so it *is* the segment index;
///   ALPHA leading significand bits refine it into a finer segmentation;
///   the index saturates because the table covers only part of the exponent range.
fn fp_segment<#uint WE, #uint WF, #uint ALPHA, #uint WY, #uint AW>(
    e: uint<WE>,
    f: uint<WF>,
    emin: uint<WE>,
    emax: uint<WE>,
) -> (uint<AW>, uint<WY>)
where WF == ALPHA + WY else "fp_segment: alpha + w_Y must equal w_F",
      AW == WE + ALPHA else "fp_segment: address is the exponent index plus alpha bits"
{
    let fb = f.as_bits();
    let k: uint<WE> = if e < emin {
        0
    } else if e > emax {
        emax -. emin
    } else {
        e -. emin
    };
    let a: uint<AW> = k.concat(fb[WY..WF].as_uint());
    let y: uint<WY> = fb[0..WY].as_uint();
    (a, y)
}
```

`e` and `f` are the two fields of the input word at the top of the diagram; `k` is the output of the saturating box; `a` is the ROM address and `y` is the $w_Y$-bit bus into the Horner evaluator. Only the clamp is arithmetic — `-.` is the wrapping subtraction, chosen over `-` because the guarded branches make the result provably non-negative and $w_E$ bits wide, so the $N\to N+1$ growth of `-` would be dead width. `concat` on integers puts its left argument high, which is what makes `a` read as (binade, sub-index) rather than the reverse; `fb[WY..WF]` and `fb[0..WY]` are the two halves of the significand with index 0 at the LSB. It is a `fn`, hence combinational, with no clock and nothing to register. Synthesis emits less than the drawing: the two slices are renaming (`assign a = {k, f[22:20]}`), and the two comparators against constant `emin`/`emax` collapse to a handful of LUTs on the carry chain — in a generated operator both bounds are constants folded at elaboration, so the mux tree shrinks further.

Instantiated as `fp_segment::<8, 23, 3, 20, 11>` — binary32 with $\alpha=3$, a $32$-binade window $E\in[\text{0x70},\text{0x8f}]$, giving an $11$-bit address over $2^{11}$ entries and $w_Y=20$. Simulated against a behavioural reference: eight named vectors, including the asymmetric pair $(E,\ F_{\text{top}})=(\text{0x71},4)$ against $(\text{0x74},0)$ and the $Y$-LSB-only case against the $\alpha$-MSB-only case, which is what would catch a swapped `concat` order, plus a 4000-vector random sweep over both fields including both saturation regions: 4008/4008 pass.

**Related notes.**

- [[Logarithmic Segmentation]] – compares: the same binade partition, built in fixed point out of an LZC and a barrel shifter that the floating-point input has already paid for.
- [[Floating-Point Operators]] – depends-on: supplies the normalisation, rounding and special-case handling that the wrapper is made of.
- [[Floating-Point Formats]] – depends-on: the $(S,E,F)$ field split is the entire range reduction, so the format *is* the segmentation.
- [[Floating-Point Specialization]] – supports: the same argument one level up, that fixing what the exponent can be is where floating-point hardware gets cheap.
- [[Floating-Point Exponential]] – extends: this structure worked end to end for $f=\exp$, with the window bounds, the tentative exponent and the error analysis all made concrete.
- [[Hierarchical Segmentation]] – extends: exponent-then-significand is an LU hierarchy whose costly first level comes for free.
- [[Uniform Piecewise Segmentation]] – supports: the $\alpha$ refinement bits inside one binade are exactly this, with $w_Y=w_F-\alpha$ unconditionally.
- [[Dichotomy-Based Segmentation]] – supports: [Tho15]'s subdomains are arbitrary, so the segment index is found by dichotomy.
- [[Horner Evaluation]] – supports: one shared evaluator serves every subdomain's polynomial, which is why $d$ stays the memory/arithmetic knob.
- [[Polynomial Coefficient Table]] – depends-on: holds $E_R$ alongside $C_0\dots C_d$, which is what makes the output repacking a concatenation.
- [[ILP-Optimized Polynomial Evaluator]] – counter-example: recovers correct rounding by enumerating a whole subinterval, which does not survive the move to a floating-point domain.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §18.5 "Floating-Point Architectures Based on Fixed-Point Polynomials", pp. 568-569 — the fixed-point-core-plus-exponent-handling structure, the free logarithmic segmentation from the exponent field, and [Tho15]'s universal floating-point approximator.
- §18.2.3 "Logarithmic Piecewise Splitting", pp. 548-551 — the leading-zero-count partition this one gets for free, and the saturation of the leading-bit count that becomes the exponent window here.
- §18.2.4 "Hierarchical Segmentation", pp. 551-552 — the LU combination that exponent-then-significand indexing realises.
- §18.2.5 "Arbitrary Dichotomy-Based Segmentation", pp. 552-553 — how [Tho15]'s subdomain index is located.
- §18.4.1 "Overall Error Analysis and Error Budget", p. 563 — the faithful-rounding budget the fixed-point core is dimensioned against.
- Chapter 22 "Floating-Point Exponential", pp. 641-663 — the worked instance of this architecture, to which §18.5 defers all of its detail.
- Cited works: [PBM01], [OS05], [LP13], [Che15] (floating-point elementary functions on a fixed-point core), [JP20] (probit, exponent-plus-significand-LUT segmentation), [Tho15] (universal floating-point approximator).
