---
title: Product Normalization Predictor
description: "A constant comparator on the input fraction alone that decides normalization in parallel with the significand path, taking exponent update off the critical path."
kind: circuit
source: "ASA §15.1.2, pp. 455-457; §15.3, p. 468"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, normalization, comparator, rounding]
aliases:
  - product normal?
  - Product Normal Predictor
  - Normalization Prediction
  - Product Normalisation Predictor
---

# Product Normalization Predictor

A $w_F$-bit comparison of the input fraction against a single synthesis-time constant that decides the one bit of post-multiplication normalization *before* the significand product exists, which is what removes exponent update and rounding-bit placement from the critical path.

```tikz title="The product normal? block inside a floating-point constant multiplier, and its three consumers"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
% ---------------- unpack ----------------
\node[draw,minimum width=11.5cm,minimum height=0.8cm] (up) at (-0.5,6.6) {unpack \& exception handling};
\draw[<-] (up.north) -- ++(0,0.8) node[above,font=\small]{$X$};
\node[font=\tiny,anchor=west] at (-0.4,7.35) {$1{+}w_E{+}w_F$};
% ---------------- exponent column ----------------
\node[draw,minimum width=2.2cm,minimum height=0.8cm] (ea) at (-5.0,3.2) {$+E_C$};
\draw[->] (-5.0,6.2) -- node[left,font=\tiny]{$\mathrm{ufix}(w_E{-}1,0)$}
                        node[right,font=\tiny,pos=0.22]{$E_X{+}E_0$} (ea.north);
\draw[->] (ea.south) -- node[left,font=\tiny]{$\mathrm{sfix}(w_E,0)$} node[right,font=\tiny]{$E_R{+}E_0$} (-5.0,1.4);
% ---------------- significand column ----------------
\node[draw,minimum width=3.6cm,minimum height=1.0cm,align=center] (cm) at (3.6,4.0)
  {constant multiplier\\ by $1{+}F_C$};
\draw[->] (3.6,6.2) -- node[right,font=\tiny,pos=0.55]{$1{+}F_X$: $w_F{+}1$} (cm.north);
\node[draw,minimum width=3.6cm,minimum height=0.7cm] (nm) at (3.6,2.6) {1-bit norm.};
\draw[->] (cm.south) -- node[right,font=\tiny]{$P$: $\mathrm{ufix}(1,-w_F)$} (nm.north);
\draw[->] (nm.south) -- node[right,font=\tiny]{$F_R$: $\mathrm{ufix}(-1,-w_F)$} (3.6,1.4);
% ---------------- the predictor ----------------
\node[draw,very thick,minimum width=2.8cm,minimum height=0.8cm] (pn) at (-1.8,5.1) {\textbf{product normal?}};
\draw[->] (3.6,5.8) -- node[above,font=\tiny,pos=0.40]{$F_X$: $w_F$} (-1.8,5.8) -- (pn.north);
% n -> exponent adder
\draw[->] (pn.west) -- (-4.2,5.1) -- node[right,font=\tiny,pos=0.45]{$n$: ${+}1$} (-4.2,3.6);
% n -> rounding-bit position inside the multiplier
\draw[->] (pn.east) -- (0.0,5.1) -- (0.0,4.0) -- node[above,font=\tiny,pos=0.45]{rounding position} (cm.west);
% n -> the 1-bit shift
\draw[->] (pn.south) -- (-1.8,2.6) -- node[above,font=\tiny,pos=0.30]{shift by $n$} (nm.west);
% ---------------- pack ----------------
\node[draw,minimum width=11.5cm,minimum height=0.8cm] (pk) at (-0.5,1.0) {exception handling \& pack};
\draw[->] (pk.south) -- ++(0,-0.8) node[below,font=\small]{$R$};
% ---------------- inset ----------------
\draw[dashed,rounded corners] (6.6,2.9) rectangle (13.4,6.2);
\node[font=\tiny,anchor=north west,align=left] at (6.85,6.05)
  {\textbf{what the block is}: one $w_F$-bit constant comparator\\[5pt]
   $n=\big[\,F_X>\lfloor F_{C^{-1}}\rfloor_{-w_F}\,\big],
     \qquad 1+F_{C^{-1}}=\dfrac{2}{1+F_C}$\\[7pt]
   ($\ge$ replaces $>$ when the built multiplier returns $2$ on the\\
   limit fraction $F_X=\lfloor F_{C^{-1}}\rfloor_{-w_F}$.)\\[5pt]
   Rounding position: $-w_F$ when $n=0$, $-w_F{+}1$ when $n=1$.\\[5pt]
   The block reads $F_X$ only --- never $P$ --- so all three\\
   consumers are driven before the product exists.};
\end{circuitikz}
\end{document}
```

*after Fig. 15.3, p. 456*

**Bound the product before designing anything.** Restrict the constant to $1<1.F_C<2$ — the power-of-two case has no significand path at all — and the input to a normal number, so $1\le 1.F_X\le 2-2^{-w_F}$ ([[Number Formats]]). Multiplying the two bounds gives the exact product $P=(1+F_C)(1+F_X)$ in $[1,\,2(2-2^{-w_F}))$, strictly below $4$. A binary value in $[1,4)$ is either already normalized or needs exactly one right shift, so the whole normalizer degenerates to a one-bit shift and the entire architecture follows from that single interval (p. 455). $P$ is carried as $\mathrm{ufix}(1,-w_F)$, i.e. $w_F+2$ bits, and $F_R$ leaves the shifter as $\mathrm{ufix}(-1,-w_F)$.

**Turn "is the product $\ge 2$?" into a threshold on the input.** The map $t\mapsto(1+F_C)(1+t)$ is strictly increasing in $t$ for $1+F_C>0$, so the predicate $P\ge 2$ is *monotone* in $F_X$: there is one crossing point and everything above it normalizes. Solving $(1+F_C)(1+t)=2$ for the crossing gives the reciprocal-derived fraction

$$1+F_{C^{-1}}=\frac{2}{1+F_C}\ \in(1,2)$$

which is again in the significand range, so $F_{C^{-1}}$ is a legitimate fraction to compare against (p. 455). It may have an infinite binary expansion — $F_C=.011_2$ gives $2/1.375=1.4545\ldots$ — but $F_X$ only carries $w_F$ bits, so only $\lfloor F_{C^{-1}}\rfloor_{-w_F}$, the truncation of $F_{C^{-1}}$ to the *input's* format, can ever be distinguished. That truncation is a compile-time computation on $C$; nothing about it is hardware.

**Prove the two strict sides, because a threshold is only useful if it is exact.** Take $F_X>\lfloor F_{C^{-1}}\rfloor_{-w_F}$. Both are multiples of $2^{-w_F}$, so strict inequality on that grid means $F_X\ge\lfloor F_{C^{-1}}\rfloor_{-w_F}+2^{-w_F}>F_{C^{-1}}$ — the last step because truncation loses less than one ulp. Monotonicity then gives $P>2$, and the multiplier's lower return value is already $2$: shift right. Now take the other side, $F_X<\lfloor F_{C^{-1}}\rfloor_{-w_F}$, which on the same grid rewrites as $F_X\le\lfloor F_{C^{-1}}\rfloor_{-w_F}-2^{-w_F}\le F_{C^{-1}}-2^{-w_F}$. Then

$$(1+F_C)(1+F_X)\ \le\ (1+F_C)\!\left(1+F_{C^{-1}}-2^{-w_F}\right)\ =\ 2-2^{-w_F}(1+F_C)\ \le\ 2-2^{-w_F}$$

using $(1+F_C)(1+F_{C^{-1}})=2$ by the definition above for the middle equality, and $1+F_C>1$ for the last. The product stays below the largest representable significand: no normalization (p. 456).

**Resolve the limit case at compile time, not in silicon.** The two proofs leave exactly one fraction unaccounted for, $F_X=\lfloor F_{C^{-1}}\rfloor_{-w_F}$, where the *exact* product sits within one ulp of $2$ and may round either way depending on the constant and on how the faithful multiplier was built ([[Error Accuracy]]). This is not a hardware problem: a built multiplier is a fixed function, so it returns the same value for that one input every time it is asked. Look at it once, then choose the comparison operator accordingly — build $F_X\ge\lfloor F_{C^{-1}}\rfloor_{-w_F}$ if the multiplier returns $2$ there, and $F_X>\lfloor F_{C^{-1}}\rfloor_{-w_F}$ otherwise (p. 457). In the correctly-rounded variant the multiplier is exact, so the limit-case behaviour follows from the constant alone with no need to inspect the construction (p. 458). Either way the predictor is one comparator with a baked-in operator, never two.

> [!important] The saving is a dependence deleted, not a gate deleted
> In a generic multiplier the normalization bit is a function of the product, so exponent update and rounding must *wait* for the significand tree. Here the same bit is a function of $F_X$, which is available at unpack time. The comparator is not smaller than the logic it replaces — it is earlier, and earliness is what a critical path is made of.

**Spend the prediction three ways.** The bit $n$ drives (i) the exponent adder, which computes $(E_X+E_0)+E_C+n$ concurrently with the multiplication instead of after it; (ii) the position of the rounding bit inside the constant multiplier — $-w_F$ when $n=0$ and $-w_F+1$ when $n=1$ — which lets the rounding addition be dropped into the multiplier's compression tree or bit heap ([[Sums of Weighted Bits]]) rather than sitting behind the normalizer as a $(w_F{+}1)$-bit adder; and (iii) the one-bit shift itself, a single row of 2:1 multiplexers. Consumer (ii) is where the accounting closes: a post-normalization rounding adder is at least as large as the constant comparator that replaces it (Sect. 6.3.3, [[Comparators]]), so this is a delay improvement at no area cost (p. 457).

**Note what the comparator actually is after constant propagation.** Comparing a variable against a compile-time constant is not a two-operand [[Magnitude Comparator]]: with one side fixed, each bit position either forces the answer or defers to the next, and the whole thing collapses to a fixed AND/OR chain over the bits of $F_X$ — a prefix problem of depth $O(\log w_F)$, the same shape as a carry chain. On FPGA that maps onto the hard carry chain the deleted adder would have used, so the substitution is close to free in the fabric as well as in the gate count; on ASIC it is a bespoke tree with no carry to propagate. It is also the reason the block never appears in a generic multiplier: without a known $C$ there is no constant to compare against and the normalization bit genuinely is a function of the product.

**Generalize from one product to $p$ powers.** For an $X^p$ operator ([[Floating-Point Power Operator]]) the significand range widens to $(1+F_X)^p\in[1,2^p)$, so up to $p-1$ bits of normalization are needed and the naive implementation is a full leading-zero counter ([[Leading Zero Counters]]) plus a shifter ([[Normalizers]]). The same prediction applies: the boundary between an $i$-bit and an $(i{+}1)$-bit shift is at $(1+F_X)^p=2^i$, i.e.

$$F_X=\sqrt[p]{2^i}-1,\qquad i\in\{1,\dots,p-1\}$$

Concretely $X^2$ needs a 1-bit normalization iff $F_X>\sqrt2-1$; $X^3$ needs 1 bit iff $\sqrt[3]2-1<F_X<\sqrt[3]4-1$ and 2 bits iff $F_X>\sqrt[3]4-1$ (p. 468). All $p-1$ comparisons are against compile-time constants, run in parallel, and are priority-encoded into a shift amount — so exponent processing leaves the critical path for $X^p$ exactly as it does for $X\times C$. The trade is that the comparator bank grows linearly in $p$ while an LZC grows logarithmically in $w_F$, which is why the book confines $X^p$ operators to small $p$.

$$\boxed{\ n=\big[\,F_X>\lfloor F_{C^{-1}}\rfloor_{-w_F}\,\big],\qquad 1+F_{C^{-1}}=\frac{2}{1+F_C}\ }$$

**Where the prediction stops being valid.** Every case below breaks one of the two hypotheses the proofs rest on — $1<1.F_C<2$ and $1\le 1.F_X<2$ — or breaks the assumption that the threshold is a constant.

- **$F_C=0$.** $C$ is a power of two, the significand is untouched and there is no product to normalize — the predictor and the multiplier both vanish.
- **Subnormal inputs.** Every bound above assumes $1\le 1.F_X<2$. A subnormal $0.F_X$ breaks monotonicity's starting point; the input must first pass through a saturated normalizer, and only its output may be fed to this comparison.
- **Differing input and output formats.** The truncation $\lfloor\cdot\rfloor_{-w_F}$ is taken in the *input's* precision. If the result format has a different $w_F$, the threshold is wrong and the two strict proofs no longer close on the same grid.
- **Rebuilding the multiplier invalidates the constant.** In the faithful case the comparison operator ($>$ versus $\ge$) is read off the built multiplier's behaviour on one input. Re-synthesise the constant multiplier with a different bit-heap and that answer can flip; the predictor must be re-derived, not copied.
- **Small $w_F$.** The prediction only pays while the significand multiplier is deeper than a $w_F$-bit prefix comparison. For a handful of fraction bits the two are the same depth and the parallelism buys nothing.
- **Large $p$.** For $X^p$ the $p-1$ comparators plus a priority encoder eventually cost more than the LZC and shifter they replace.

> [!warning] Not covered in the source — needs outside research
> Chapter 15 quantifies this block only as a relation: the comparator is "at least as small as" the post-normalization adder it deletes (p. 457). There are no LUT counts, no delays and no crossover width anywhere in pp. 453–472, so the $w_F$ at which the prediction stops paying is not given by the source.

**In RTL.** The block and the exponent adder it feeds, generic in $w_F$, $w_E$, the threshold and the tie direction.

```spade
/// `product normal?`: does (1+F_C)(1+F_X) reach 2, decided from F_X alone.
/// THR = floor(F_{C^-1})_{-WF}; TIEUP = 1 when the built multiplier
/// returns 2 on the limit fraction, so the test becomes `>=`.
fn product_normal<#uint WF, #uint THR, #uint TIEUP>(fx: uint<WF>) -> bool {
    let thr: uint<WF> = THR;
    gen if TIEUP == 1 { fx >= thr } else { fx > thr }
}

/// The exponent path it feeds: (E_X+E_0) + E_C + n, concurrent with the significand.
entity const_mul_exp<#uint WF, #uint WE, #uint THR, #uint TIEUP>(
    fx: uint<WF>,
    ex: uint<WE>,
    ec: uint<WE>,
) -> (bool, uint<{WE + 2}>) {
    let n = product_normal::<WF, THR, TIEUP>(fx);
    let s: uint<{WE + 1}> = ex + ec;
    let nz: uint<{WE + 1}> = zext(n.as_uint());
    (n, s + nz)
}
```

`fx` is the $w_F$-bit fraction tapped straight off unpack — the horizontal wire in the diagram — and `thr` is $\lfloor F_{C^{-1}}\rfloor_{-w_F}$, materialised from a const generic so it constant-folds away and never becomes a register. `TIEUP` is the compile-time limit-case decision, resolved by `gen if` before any hardware exists, which is exactly the claim that the predictor is one comparator and not two. The exponent path shows the width growth honestly: `ex + ec` is $w_E+1$ bits and adding $n$ gives $w_E+2$, of which the architecture keeps $w_E+1$ as $\mathrm{sfix}(w_E,0)$ and hands the top bit to the exception logic as the underflow/overflow flag. Everything here is combinational; synthesis will flatten the comparison into the carry chain rather than build the subtractor the `>` implies, and it will merge the `+ n` into the `+E_C` adder as a carry-in instead of a second adder.

Simulated at $w_F=w_E=8$ with $1+F_C=1.75$, so $1+F_{C^{-1}}=8/7=1.142857\ldots$ and $\lfloor F_{C^{-1}}\rfloor_{-8}=36/256$, tie-down. The reference is the exact integer product: $n_{\text{ref}}=\big[448\cdot(256+F_X)\ge 2^{17}\big]$. 3262 vectors pass — 6 named (including the $36/37$ boundary and the asymmetric pair $F_X=1$ against $F_X=128$), an exhaustive sweep of all 256 fractions, and 3000 random triples. Flipping `TIEUP` to 1 makes the boundary vector fail, which is the check that the tie direction is really being tested.

**Related notes.**

- [[Faithful Floating-Point Constant Multiplier]] – supports: this block is the one structural difference between that operator and a generic multiplier.
- [[Correctly Rounded Floating-Point Constant Multiplier]] – extends: same predictor, but the limit case is settled from the constant alone because the multiplier is exact.
- [[Floating-Point Power Operator]] – extends: $p-1$ of these comparators, priority-encoded, replace the leading-zero counter.
- [[Magnitude Comparator]] – depends-on: what this degenerates from once one operand is a synthesis-time constant.
- [[Leading Zero Counters]] – compares: the data-dependent way of finding the same shift amount, after the product instead of before it.
- [[Normalizers]] – compares: the block being controlled, here collapsed to a single row of multiplexers.
- [[Pseudo-Sticky Tie Anticipation]] – extends: the same "decide it from $F_X$ in parallel" move, applied to tie detection instead of normalization.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where the delay saved here sits against the other specializations in the chapter.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §15.1.2 "Baseline Faithful Floating-Point Multiplier by a Constant", Eq. (15.4), Fig. 15.3, pp. 455–457 — the product bound, $F_{C^{-1}}$, both inequality proofs, the limit case, and the three consumers of the prediction.
  - §15.1.3, p. 458 — the limit case determined from the constant alone once the multiplier is exact.
  - §15.3 "Floating-Point Squares, Cubes and $X^p$", Eq. (15.16), pp. 467–468 — the $\sqrt[p]{2^i}-1$ comparison boundaries and the priority encoder.
  - Cross-referenced: §6.3.3 (comparison to a constant), Fig. 11.7 p. 344 (generic floating-point multiplier), §10.3 (normalizers).
