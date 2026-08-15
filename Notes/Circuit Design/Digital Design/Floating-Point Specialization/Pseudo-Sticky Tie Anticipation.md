---
title: "Pseudo-Sticky Tie Anticipation"
description: "Replaces the sticky path of round-to-nearest-even with a precomputed test on F_X, after a parity argument proves most tie cases impossible."
kind: circuit
source: "ASA §15.1.3, pp. 457-459"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, rounding, sticky, constant-multiplication]
aliases:
  - Pseudo-Sticky
  - Tie Anticipation
  - Anticipated Sticky Bit
---

# Pseudo-Sticky Tie Anticipation

A tie detector for round-to-nearest-**even** that reads the input fraction instead of the product, because when the constant's integer significand is odd a tie in $I_CI_X$ is decidable from $I_X$ alone.

```tikz title="Tie patterns in the exact product of a floating-point constant multiplier, and the anticipator that detects them from the input fraction"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  \def\cw{0.58}

  % ---------------- panel (a): tie patterns in the exact product ----------
  % row A: product normalized (>= 2). MSB 1, w_F kept bits, round bit, k zeros
  \foreach \i/\t in {0/1,7/1,8/0,9/0,10/0,11/0,12/0} {
    \draw ({\i*\cw},1.55) rectangle ({(\i+1)*\cw},2.05);
    \node at ({(\i+0.5)*\cw},1.80) {\tiny \t};
  }
  \foreach \i in {1,...,6} {
    \fill[green!18] ({\i*\cw},1.55) rectangle ({(\i+1)*\cw},2.05);
    \draw ({\i*\cw},1.55) rectangle ({(\i+1)*\cw},2.05);
  }
  % row B: product not normalized (< 2). leading 0, then 1, ..., k-1 zeros
  \foreach \i/\t in {0/0,1/1,8/1,9/0,10/0,11/0,12/0} {
    \draw ({\i*\cw},0.45) rectangle ({(\i+1)*\cw},0.95);
    \node at ({(\i+0.5)*\cw},0.70) {\tiny \t};
  }
  \foreach \i in {2,...,7} {
    \fill[green!18] ({\i*\cw},0.45) rectangle ({(\i+1)*\cw},0.95);
    \draw ({\i*\cw},0.45) rectangle ({(\i+1)*\cw},0.95);
  }

  % spans over row A
  \draw[<->] ({1*\cw},2.20) -- ({7*\cw},2.20)
        node[midway,above,inner sep=1pt] {\tiny $w_F$ kept};
  \draw[<->] ({8*\cw},2.20) -- ({13*\cw},2.20)
        node[midway,above,inner sep=1pt] {\tiny $k$ zeros};
  \node[anchor=west] at ({13*\cw+0.12},1.80) {\tiny $I_X \ge I_{C^{-1}}$};
  \node[anchor=east] at (-0.12,1.80) {$I_CI_X =$};
  % spans under row B
  \draw[<->] ({2*\cw},0.30) -- ({8*\cw},0.30)
        node[midway,below,inner sep=1pt] {\tiny $w_F$ kept};
  \draw[<->] ({9*\cw},0.30) -- ({13*\cw},0.30)
        node[midway,below,inner sep=1pt] {\tiny $k-1$ zeros};
  \node[anchor=west] at ({13*\cw+0.12},0.70) {\tiny $I_X < I_{C^{-1}}$};
  \node[anchor=east] at (-0.12,0.70) {$I_CI_X =$};

  % round-bit markers
  \draw[dashed] ({8*\cw},2.05) -- ({8*\cw},2.14);
  \node at ({7.5*\cw},2.50) {\tiny round bit};
  \draw[->] ({7.5*\cw},2.42) -- ({7.5*\cw},2.07);
  \node at ({8.5*\cw},-0.12) {\tiny round bit};
  \draw[->] ({8.5*\cw},-0.04) -- ({8.5*\cw},0.43);

  \draw[<->] (0,-0.60) -- ({13*\cw},-0.60)
        node[midway,below,inner sep=1pt] {\tiny $w_F+k+2$ bits};

  % ---------------- panel (b): the anticipator ---------------------------
  \node[anchor=east] at (0.55,-1.95) {$I_X=1.F_X$};
  \draw[->] (0.70,-1.95) -- (1.30,-1.95);
  \draw (1.30,-2.25) rectangle (3.55,-1.65);
  \node at (2.42,-1.95) {\tiny $I_X \ge I_{C^{-1}}$?};

  \node[anchor=east] at (0.55,-3.30) {$F_X$};
  \draw[->] (0.70,-3.30) -- (1.30,-3.30);
  \draw (1.30,-3.60) rectangle (3.55,-3.00);
  \node at (2.42,-3.16) {\tiny odd multiple of};
  \node at (2.42,-3.44) {\tiny $2^{k-1}$ / $2^{k}$ ?};

  \draw[->] (3.55,-1.95) -- (4.55,-1.95) -- (4.55,-2.45);
  \node[anchor=west] at (4.65,-2.20) {\tiny select};
  \draw[->] (3.55,-3.30) -- (4.55,-3.30) -- (4.55,-2.95);
  \draw (4.20,-2.95) -- (4.90,-2.95) -- (4.75,-2.45) -- (4.35,-2.45) -- cycle;
  \draw[->] (4.55,-2.45) -- (4.55,-1.35);
  \node[anchor=south] at (4.55,-1.33) {\tiny \emph{tie}, 1 b};

  \draw[dashed] (5.55,-3.75) rectangle (8.05,-3.00);
  \node at (6.80,-3.22) {\tiny sticky: OR of the};
  \node at (6.80,-3.53) {\tiny $k{-}1$ product bits};
  \draw[dashed,->] (5.50,-3.38) -- (5.00,-3.38);
  \node[anchor=north] at (6.80,-3.85) {\tiny replaced: never sees};
  \node[anchor=north] at (6.80,-4.13) {\tiny the product};
\end{circuitikz}
\end{document}
```

*after Fig. 15.4, p. 458*

**Move the whole question onto integers.** Correct rounding of $X\times C$ where $C$ is itself a float is settled by the exact significand product, so reason on integer significands rather than fractions. Write $I_X=2^{w_F}(1+F_X)$, an integer on $w_F+1$ bits with $I_X\in[2^{w_F},2^{w_F+1}-1]$, and $I_C=2^k(1+F_C)$ on $k+1$ bits with $I_C\in[2^k,2^{k+1}-1]$, where $k\le w_F$ is the constant's *minimal* precision — $F_C\in\mathrm{ufix}(-1,-k)$ with its last bit set. Minimality is the whole lever: it forces $I_C$ **odd**. The exact product $I_CI_X$ then occupies $w_F+k+2$ bits, and the exact constant multiplier of [[Correctly Rounded Floating-Point Constant Multiplier]] delivers all of them.

**Read the tie condition straight off the product's bit pattern.** Round-to-nearest-ties-to-away needs only the round bit, so it is free; ties-to-even is the only mode that needs to know whether everything *below* the round bit is zero, which is what a sticky bit reports (see [[Rounding]]). A tie is therefore exactly: round bit $=1$, every lower bit $=0$. The round bit's position is set by the one-bit normalization, and the diagram gives both cases. If the product is normalized ($\ge 2$, top row) the leading $1$ sits at weight $2^{w_F+k+1}$, the $w_F$ kept bits follow, the round bit lands at weight $2^{k}$ and $k$ bits lie below it. If it is not normalized (bottom row) everything slides right by one: the round bit lands at $2^{k-1}$ with $k-1$ bits below. A tie in either case means the product is an odd multiple of $2^{k}$ or of $2^{k-1}$ respectively — in both, $2^{k-1}\mid I_CI_X$.

**Push the divisibility through the odd constant.** $2^{k-1}\mid I_CI_X$ with $I_C$ odd forces $2^{k-1}\mid I_X$, because $\gcd(2^{k-1},I_C)=1$ and Euclid's lemma lets the whole power of two pass to the other factor. This is a two-line parity argument that never mentions the multiplier, and it immediately kills the general case: $I_X<2^{w_F+1}$, so a nonzero multiple of $2^{k-1}$ in range needs $k-1\le w_F$. **When $k-1>w_F$ no tie can ever occur**, the sticky path is dead code, and correct rounding costs exactly what faithful rounding costs. That is the regime a truncated *real* constant lands in, where correct rounding demands $k\approx 2w_F+1$ bits (§15.1.4, p. 460) and $k-1$ therefore clears $w_F$ by a wide margin.

**Turn the surviving cases into a test on $F_X$ alone.** The implication runs both ways — the round bit is $1$ and the bits below are $0$ **iff** $2^{r}$ exactly divides $I_CI_X$ at the round position $r$, iff $2^{r}$ exactly divides $I_X$ — so, splitting on the normalization case and using the same threshold $I_{C^{-1}}=2^k(1+F_{C^{-1}})$ that the [[Product Normalization Predictor]] already compares against,

- $I_X<I_{C^{-1}}$ (no normalization): a tie iff $I_X$ is an **odd** multiple of $2^{k-1}$;
- $I_X\ge I_{C^{-1}}$ (normalize right by one): a tie iff $I_X$ is an **odd** multiple of $2^{k}$.

"Odd multiple of $2^{e}$" is a $(e+1)$-bit pattern match on the low end of $I_X$ — bit $e$ set, bits $e-1\ldots0$ clear — i.e. one AND of one bit with the NOR of $e$ bits. Both variants read only the input fraction, so both evaluate while the significand multiplier is still compressing its bit heap.

> [!important] This is a replacement, not a filter.
> The tie condition is an *equivalence*, not a necessary condition that still needs confirming against the product. Nothing downstream re-checks it, and no OR-tree is ever built over the product's low bits. What varies with $k$ is only how wide the input-side NOR has to be, never whether the answer is trustworthy.

**Two degenerate cases are worth naming because they are the common ones.** At $k-1=w_F$ the only in-range multiple of $2^{k-1}=2^{w_F}$ is $I_X=2^{w_F}$ itself, i.e. a significand of exactly $1$: the pseudo-sticky collapses to $F_X=0$, a single $w_F$-input NOR. At $k=w_F$ the odd multiples of $2^{w_F}$ in range reduce to $I_X=2^{w_F}$ again, and the odd multiples of $2^{w_F-1}$ reduce to the single value $I_X=3\cdot 2^{w_F-1}$, i.e. $F_X=\tfrac12$. Whether that one survives depends on the constant through $I_{C^{-1}}=2^{2k+1}/I_C$: if $I_C>\tfrac43\,2^{w_F}$ then $I_{C^{-1}}<3\cdot2^{w_F-1}$, the value falls on the wrong side of the comparison, and the constant admits no tie at all.

> [!warning] Source arithmetic to check before quoting
> p. 459 prints this threshold as "$I_C>\tfrac23\cdot2^{w_F}$", but for $k=w_F$ every $I_C$ lies in $[2^{w_F},2^{w_F+1})$, so that condition is vacuously true and cannot be the one being tested. The book's own consequence on the same line, $I_{C^{-1}}<\tfrac32\cdot2^{w_F}=3\cdot2^{w_F-1}$, follows from $I_{C^{-1}}=2^{2w_F+1}/I_C$ only for $I_C>\tfrac43\cdot2^{w_F}$, which is the reading used above. The companion sentence's "$I_X$ is $3\cdot2^{w_F}$" is likewise out of $I_X$'s range $[2^{w_F},2^{w_F+1})$ and must be $3\cdot2^{w_F-1}$.

**What it actually buys is latency, not area, and the book is honest that it is modest.** The sticky computation it displaces is the expensive half of correct rounding: a full-width OR reduction over the low $k-1$ bits of the product, which cannot start until the multiplier's carry-propagate adder has finished ([[Sticky Bit Computation]] shows the same reduction folded into a shifter for the adder case). The anticipator instead shares the comparator that the `product normal?` block already instantiates — a constant comparison, so it degenerates to a comparison of $F_X$'s leading bits against a constant pattern (§6.3.3, p. 149) — and adds only a NOR over input bits. de Dinechin & Kumm's own verdict is that this "may slightly reduce the critical path, but not dramatically"; the real prize is the $k-1>w_F$ case where the path disappears outright. On an FPGA the saving is sharper than the gate count suggests, because a $(k-1)$-input NOR maps to $\lceil\log_6(k-1)\rceil$ levels of 6-LUT fed directly by the unpacked input register, off the DSP-cascade or bit-heap path entirely; on an ASIC the two structures are similar in area and only the source of their inputs differs.

$$\boxed{\ I_C\ \text{odd}\ \Longrightarrow\ \Big[\ \text{tie}\iff I_X\ \text{is an odd multiple of}\ 2^{k-1+[\,I_X\ge I_{C^{-1}}\,]}\ \Big],\qquad k-1>w_F\Rightarrow\text{no tie}\ }$$

**When it breaks.**

- $k$ must be *minimal*. Pad $F_C$ with trailing zeros and $I_C$ turns even, the parity argument evaporates, and every conclusion above is void — while the circuit still compiles and still looks right.
- $k<w_F$: the odd-multiple tests still hold, but the sets of tie-producing $I_X$ grow, the NOR narrows toward a single bit, and the anticipator stops being cheaper than the thing it replaces. Below some $k$ the honest answer is a real sticky over the low product bits (§11.2.2).
- Ties-to-away needs none of this; the machinery exists only for ties-to-even.
- Subnormal inputs break the premise $I_X\ge2^{w_F}$ outright — the analysis assumes a normalized significand, so the anticipator sits after whatever normalization [[Constant Multiplier with Subnormal Support]] performs, not before it.
- $C$ irrational: there is no finite $I_C$ and no parity to argue from until the constant is truncated to $k$ bits, after which $k>w_F$ and the whole question is usually moot.

```spade
/// Anticipated tie detection for round-to-nearest-even in a correctly rounded
/// FP multiplier by a floating-point constant.
///   W = w_F + 1 bits of integer significand I_X = 1.F_X
///   K = k, the constant's minimal fraction precision (I_C odd)
///   icinv = the compile-time constant I_{C^-1} = 2^k (1 + F_{C^-1})
fn odd_multiple<#uint W, #uint E>(b: [bool; W]) -> bool {
    b[E] && !b[0..E].reduce_or()
}

entity tie_anticipate<#uint W, #uint K>(ix: uint<W>, icinv: uint<W>) -> bool {
    let b = ix.as_bits();
    if ix < icinv {
        odd_multiple::<W, {K - 1}>(b)   // product < 2, round bit at 2^(k-1)
    } else {
        odd_multiple::<W, K>(b)         // product >= 2, round bit at 2^k
    }
}
```

`ix` is the input's integer significand on $w_F+1$ bits and is the only runtime input; `icinv` carries $I_{C^{-1}}$ on the same $w_F+1$ bits and is tied to a literal at every real call site, so synthesis folds the comparator down to the constant comparison the drawing labels `product normal?` and shares it with the exponent path. The two `odd_multiple` instances are the drawing's two pattern-match blocks: `b[E]` is the round bit's preimage in $I_X$, `!b[0..E].reduce_or()` the NOR under it, and index 0 is the LSB. Everything here is combinational and the entire block is off the multiplier's path — the one thing synthesis does differently from the drawing is the multiplexer, which collapses into the NOR's LUT rather than standing as a separate gate.

**Related Notes**

- [[Correctly Rounded Floating-Point Constant Multiplier]] – supports: this is the block that lets that operator omit its sticky path.
- [[Product Normalization Predictor]] – depends-on: supplies the $I_X\ge I_{C^{-1}}$ comparison that selects between the two odd-multiple tests.
- [[Sticky Bit Computation]] – compares: the general-purpose reduction this anticipates away, and what it costs when the anticipation is unavailable.
- [[Faithful Floating-Point Constant Multiplier]] – counter-example: faithful rounding never needs a sticky, so none of this analysis applies.
- [[Constant Multiplier with Subnormal Support]] – compares: restores the normalized-significand premise that the parity argument assumes.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where the correctly rounded constant multiplier sits against its siblings.
- [[Rounding]] – depends-on: defines ties-to-even and the round/sticky decomposition used throughout.
- [[Error Accuracy]] – supports: correct rounding is the accuracy target that makes ties worth detecting at all.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §15.1.3 "Correctly Rounded Multiplication by a Floating-Point Constant", pp. 457–459; Fig. 15.4 (tie situations), p. 458.
- Same volume: §15.1.2 baseline faithful multiplier and the `product normal?` block, pp. 455–457; §15.1.4 correct rounding by a real constant and the $k\approx 2w_F+1$ estimate, pp. 459–460; §11.2.2 sticky bit computation; §6.3.3 comparison to a constant, p. 149.
