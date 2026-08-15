---
title: Correctly Rounded Multiplier
description: "Round-to-nearest-ties-up for the price of one constant bit: inject a 1 at position l_P - 1 into the exact multiplier's bit heap and truncate the compressed result at l_P."
kind: circuit
source: "ASA §8.5, p. 237"
status: seed
spade: simulated
tags: [digital, multipliers, rounding, bit-heap, fixed-point]
aliases:
  - Correctly Rounded Multiplication
  - Rounded Multiplier
  - Round-to-Nearest Multiplier
  - Exact Multiplier with Rounding
  - Half-Ulp Injection
---

# Correctly Rounded Multiplier

An exact multiplier whose rounding step has been dissolved into its own bit heap — the only member of the truncation family that still returns the nearest representable product, and the only one that saves no hardware at all.

```tikz title="Half-ulp constant injected into the bit heap of a 6x6 multiplier, truncated at l_P"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,font=\small]
  % ---- bit heap of a 6x6 unsigned multiplier, MSB column on the left ----
  % column n = i+j carries weight 2^(n-12) and holds min(n+1,11-n) bits
  \foreach \n/\h in {10/1,9/2,8/3,7/4,6/5,5/6,4/5,3/4,2/3,1/2,0/1}
    \foreach \t in {1,...,\h}
      \fill ({(10-\n)*0.55},{-0.10-0.26*\t}) circle (1.6pt);

  % ---- the injected constant: one extra bit in the column of weight 2^(-7) ----
  \draw[thick] (2.75,0.18) circle (2.8pt);
  \draw[->] (2.75,0.74) -- (2.75,0.30);
  \node[anchor=west,font=\footnotesize] at (2.98,0.82)
    {constant $1$ in column $2^{\ell_P-1}$};

  % ---- truncation line ----
  \draw[dashed,thick] (2.475,1.05) -- (2.475,-4.05);
  \node[anchor=east,font=\footnotesize] at (2.36,0.92) {$\ell_P$};

  % ---- column weight ruler ----
  \node[font=\footnotesize] at (0,-2.10) {$2^{-2}$};
  \node[font=\footnotesize] at (2.00,-2.10) {$2^{-6}$};
  \node[font=\footnotesize] at (5.50,-2.10) {$2^{-12}$};

  % ---- compression + final adder, full width ----
  \draw (-0.40,-2.60) rectangle (5.90,-3.20);
  \node[font=\footnotesize,text width=5.4cm,align=center] at (2.75,-2.90)
    {compressor tree + carry-propagate adder, full $2w$ width};

  % ---- output word ----
  \draw[fill=black!8]  (-0.40,-3.60) rectangle (2.475,-4.10);
  \draw[fill=black!25] (2.475,-3.60) rectangle (5.90,-4.10);
  \node[font=\footnotesize] at (1.03,-3.85) {$\widehat{P}$ on $w_P=6$ bits};
  \node[font=\footnotesize] at (4.18,-3.85) {discarded};

  % ---- annotations ----
  \node[anchor=west,font=\footnotesize,text width=4.6cm] at (6.35,-0.60)
    {$6\times6$ heap: $2w-1=11$ columns, and the constant lands in the tallest one};
  \node[anchor=west,font=\footnotesize,text width=4.6cm] at (6.35,-2.90)
    {every bit below $\ell_P$ is still generated and summed};
  \node[anchor=west,font=\footnotesize,text width=4.6cm] at (6.35,-3.85)
    {$|\widehat{P}-P|\le 2^{\ell_P-1}=\tfrac12\,\mathrm{ulp}$};
\end{circuitikz}
\end{document}
```

**Fix the formats first, because they are what makes rounding mandatory.** Take fixed-point operands in $[0,1)$, $X$ in $\mathrm{ufix}(-1,\ell_X)$ on $w_X=-\ell_X$ bits and $Y$ in $\mathrm{ufix}(-1,\ell_Y)$ on $w_Y=-\ell_Y$ bits ([[Number Formats]]); the book illustrates the section with the square case $w_X=w_Y=w_P=w$, $\ell_P=-w$, and defers saturation to a separate mechanism (p. 237). The exact product $P=XY$ lives in $\mathrm{ufix}(-1,\ell_X+\ell_Y)$ on $w_X+w_Y$ bits, so requesting an output format with $\ell_P>\ell_X+\ell_Y$ is *by definition* a request for a result the exact product cannot hold. Every architecture in [[Truncated Multipliers]] and this one are answers to that single request; they differ only in how much of the exact product they bother to build first.

**Rewrite round-to-nearest as add-then-truncate — that is the whole circuit.** Rounding $P$ to the nearest multiple of $\mathrm{ulp}=2^{\ell_P}$, with exact halves going up, is by definition

$$\widehat{P}=2^{\ell_P}\left\lfloor 2^{-\ell_P}P+\tfrac12\right\rfloor$$

and by **distributivity of $\times$ over $+$** the $\tfrac12$ can be pulled inside the scaling,

$$2^{-\ell_P}P+\tfrac12=2^{-\ell_P}\left(P+2^{\ell_P-1}\right)
\qquad\Longrightarrow\qquad
\widehat{P}=2^{\ell_P}\left\lfloor 2^{-\ell_P}\left(P+2^{\ell_P-1}\right)\right\rfloor$$

The remaining operator $2^{\ell_P}\lfloor 2^{-\ell_P}\cdot\rfloor$ is *free in binary*: flooring to a multiple of $2^{\ell_P}$ means discarding every bit of weight below $2^{\ell_P}$, which is a wire cut, not a gate. So round-to-nearest-ties-up on a binary number is exactly **add $2^{\ell_P-1}$, then truncate at $\ell_P$** — one addend and one cut.

> [!important] A constant is just another weighted bit, so the addend costs no adder
> The exact product is not a number in the middle of the datapath; it is the [[Bit Heaps|bit heap]] $\sum_{i,j}2^{i+j}x_iy_j$ of $w_Xw_Y$ weighted bits waiting to be compressed. The rounding constant $2^{\ell_P-1}$ is one more weighted bit of the same kind, so by **commutativity and associativity of $+$** it may be dropped into the heap *before* compression instead of added *after* it — the total is identical either way. Added after the final carry-propagate adder it would be a $w_P$-bit incrementer sitting on the critical path; added before, the compressor tree that had to reduce that column anyway swallows it. This is the same constant-folding argument that lets [[Baugh-Wooley Multiplier]] pay for sign extension with constant bits, and it is why all the constants in a heap — sign-extension, Booth recoding, rounding — can be pre-summed at elaboration time into a single constant word.

**Locate the constant and you can predict when it is not free.** In the square case $\ell_X=\ell_Y=\ell_P=-w$, the partial product $x_iy_j$ carries weight $2^{i+j-2w}$, so the column of weight $2^{\ell_P-1}=2^{-w-1}$ is the one with $i+j=w-1$. The number of index pairs satisfying that with $0\le i,j\le w-1$ is exactly $w$ — which is also the maximum over all columns, so **the rounding bit lands in the single tallest column of the heap**, taking its height from $w$ to $w+1$ (the diagram's centre column, $6\to7$ at $w=6$). On an ASIC that promotes one half adder into a full adder; on an FPGA the column is already being reduced by a LUT-based counter or a carry chain ([[FPGAs]]), and a compile-time input changes that LUT's initialisation and nothing else. It costs a whole extra reduction level only in the unlucky case where $w$ sits exactly on a boundary of the reduction schedule — the book's summary is that a correctly rounded multiplier has "almost the same area and delay as an exact one, the difference being one constant bit in the bit array" (p. 237).

**Nothing is removed, and that is the distinction from a truncated multiplier.** All $w_Xw_Y$ partial products are generated, all $2w-1$ columns are compressed, and the final carry-propagate adder still spans the full $w_X+w_Y$ bits, because a carry born in the lowest column can propagate all the way up into the kept bits and change $\widehat{P}$. What disappears is only the *wiring* of the low $\ell_P-\ell_X-\ell_Y$ result bits to the output port. So this architecture buys accuracy, not silicon: it is an exact multiplier plus one bit. [[Truncated Multipliers]] is where hardware genuinely vanishes, and the price of that is relaxing the specification from correct rounding to faithful rounding ([[Error Accuracy]]) so the low partial products need not be computed at all.

**The bound is half an ulp and it is tight.** Since $\lfloor z\rfloor\in(z-1,z]$, the derivation above gives $|\widehat{P}-P|\le 2^{\ell_P-1}$, with equality precisely when $P$ is an exact tie — and correct rounding is *defined* as returning a nearest representable value, so this operator meets the definition. The comparison that matters is with plain truncation, which returns $2^{\ell_P}\lfloor 2^{-\ell_P}P\rfloor$ and therefore has error in $[0,2^{\ell_P})$: twice as wide, and **one-sided**, so a sum of $n$ truncated products drifts low by about $n\cdot\mathrm{ulp}/2$ while a sum of correctly rounded ones does not drift at all except through ties. The constant is what re-centres a one-sided error interval on zero, which is the general trick of §7.2.4.3 applied at its simplest.

$$\boxed{\ \widehat{P}=2^{\ell_P}\left\lfloor 2^{-\ell_P}\left(P+2^{\ell_P-1}\right)\right\rfloor,\qquad \left|\widehat{P}-P\right|\le 2^{\ell_P-1}=\tfrac12\,\mathrm{ulp}\ }$$

**When it breaks.**

- **Rounding up can leave the output format.** The result must be able to represent the value $\widehat{P}$ rounds *to*. For the square case it never overflows: $P_{\max}=(1-2^{-w})^2$ and $P_{\max}+2^{-w-1}=1-\tfrac32 2^{-w}+2^{-2w}<1$, so $\widehat{P}\le 1-2^{-w}$ and $\mathrm{ufix}(-1,-w)$ suffices. For a coarse $\ell_P$ it does: at $\ell_P=-1$ (ulp $=\tfrac12$) a product just below $1$ plus $2^{-2}$ exceeds $1$, and $\widehat{P}=1$ needs $m_P=0$, one bit more than the operands. Size the output word from the rounded value, not the exact one.
- **Ties-up is biased and is not IEEE round-to-nearest-even.** Every exact tie moves up, and ties are not rare for a multiplier — any operand with a short significand produces them systematically. Accumulating many such products drifts upward; if the specification says IEEE-754, this operator is not a legal substitute, and if it says "unbiased", see [[Exact Accumulators]] instead of a better rounding mode.
- **It saves nothing when the low bits are unused.** If the specification simply does not consume positions below $\ell_P$, paying for the full exact multiplier to then discard them is the most expensive way to meet it. That is the entire motivation for the faithful architectures.
- **The constant is only free while the heap exists.** Merged into a hard DSP block's internal product, or into a [[Multiplier Tiling|tiled]] multiplier whose sub-products are already summed inside the blocks, there may be no heap column at $\ell_P-1$ left to inject into, and the constant reappears as a real addend.
- **Correct rounding does not compose.** Two correctly rounded multipliers feeding an adder do not give a correctly rounded sum of products; each rounding contributes its own half ulp. Correct rounding is a property of one operator, never of a datapath built from them.

> [!warning] Not covered in the source — needs outside research
> §8.5 quantifies the cost of correct rounding only qualitatively ("almost the same area and delay", one constant bit, p. 237). There are no LUT, DSP or delay figures for a correctly rounded multiplier against its exact counterpart, and no data on how often the extra bit in the tallest column actually forces an additional compression level, so the "free" claim has no measured margin here.

**RTL (Spade).**

```spade
/// Truncation at l_P: keep the top 8 bits of the exact 16-bit product,
/// i.e. round toward zero. Error in [0, ulp), one-sided.
fn tmul8(x: uint<8>, y: uint<8>) -> uint<8> {
    let p: uint<16> = x * y;
    p.as_bits()[8..16].as_uint()
}

/// Correctly rounded 8x8 -> 8 multiplier for ufix(-1,-8) operands.
/// One constant bit of weight 2^(l_P - 1) = 2^-9 joins the exact bit heap
/// (bit 7 of the 16-bit integer product), then the sum is truncated at l_P.
/// `+.` is the wrapping add: safe because 255*255 + 128 = 65153 < 2^16.
fn crmul8(x: uint<8>, y: uint<8>) -> uint<8> {
    let p: uint<16> = x * y;
    let rounded: uint<16> = p +. 0x0080;
    rounded.as_bits()[8..16].as_uint()
}
```

`p` is the full heap already compressed — `*` on two `uint<8>` yields `uint<16>`, the exact $w_X+w_Y$-bit product, and every one of its bits exists whether or not it is read. `0x0080` is the diagram's open circle: weight $2^7$ in integer units, which is $2^{-9}=2^{\ell_P-1}$ once the implicit scale $2^{-16}$ is applied, and it is the *only* difference between the two functions. `as_bits()[8..16]` is the truncation at $\ell_P$ — index 0 is the LSB, so this selects positions $2^{-1}$ down to $2^{-8}$, giving $w_P=8$; it is a bit-slice, so it costs nothing. Both are `fn`s and therefore purely combinational. Synthesis will not build the drawing: it never materialises a 16-bit product and then slices it, it propagates the constant into the compressor tree and prunes the logic feeding the eight discarded bits down to just the carry path into position $\ell_P$.

Verified by simulation over 5010 vectors: ten named cases plus a 5000-point random sweep against the behavioural reference `(x*y + 128) >> 8`, zero mismatches. The observed maximum $|\widehat{P}-P|$ was exactly $128=\tfrac12\,\mathrm{ulp}$ (attained at ties such as $1\times128$), against $255=\mathrm{ulp}-1$ for the truncating version — the half-ulp bound and the factor-of-two claim, both measured.

**Related Notes.**

- [[Bit Heaps]] – depends-on: the weighted-bit multiset that makes a rounding constant an addend with no adder behind it.
- [[Truncated Multipliers]] – compares: the same truncation line, but with the partial products below it never generated, trading correct for faithful.
- [[Rounding]] – depends-on: the definition of round-to-nearest, ties-up and faithful that this operator is measured against, and the ulp it is measured in.
- [[Number Formats]] – depends-on: why $\ell_P>\ell_X+\ell_Y$ is a rounding request and how $\mathrm{ufix}(-1,\ell_P)$ sizes the output word.
- [[Unsigned Array Multiplier]] – depends-on: the exact heap this note adds exactly one bit to.
- [[Baugh-Wooley Multiplier]] – supports: the same constant-folding argument used for sign extension, so both constants collapse into one word.
- [[Booth's Algorithm]] – extends: recoding changes the heap's shape but not the argument — the rounding constant still enters the column at $\ell_P-1$.
- [[Multiplier Tiling]] – counter-example: once sub-products are summed inside DSP blocks there may be no heap column left to inject into.
- [[Choosing a Multiplier]] – compares: where paying full exact-multiplier cost for half an ulp is and is not the right call.
- [[Exact Accumulators]] – compares: the answer when per-product rounding bias is the actual problem.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Chapter 8, "Fixed-Point Multiplication":

- §8.5 "Truncated Multipliers", p. 237 — the correctly rounded architecture: constant $1$ at position $\ell_P-1$ in the bit array, truncation of the compression at $\ell_P$, "almost the same area and delay as an exact one"; the $\mathrm{ufix}(-1,\ell_P)$ setting with $w_X=w_Y=w_P=w$ and saturation handled separately.
- §8.5.1 "Plain or Booth Truncated Multipliers", p. 237 — why this architecture "is usually not called a truncated multiplier": a truncated multiplier relaxes the specification to faithful and then omits partial products.
- §8.1.2 "Fixed-Point Numbers", p. 207 — the exact product format $\ell_P=\ell_X+\ell_Y$, $m_P=m_X+m_Y+1$, from which $\ell_P>\ell_X+\ell_Y$ is a rounding request.
- §7.2.4.3, referenced from p. 241 — the constant correction trick that turns a one-sided error interval into a two-sided one, of which the half-ulp constant is the simplest instance.
