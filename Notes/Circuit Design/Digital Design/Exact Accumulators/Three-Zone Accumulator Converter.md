---
title: "Three-Zone Accumulator Converter"
description: "When the accumulator outruns the output exponent range: a wide OR above e_max detects overflow, a wide OR below e_min-w_F feeds the sticky, and only the middle 277 bits reach the normaliser."
kind: circuit
source: "ASA §21.2.4, pp. 636-638"
status: seed
spade: simulated
tags: [digital, exact-accumulators, floating-point, rounding, normalizer, fpga]
aliases:
  - Three-Zone FixToFloat
  - Three-Zone Converter
  - Overflow-Normal-Sticky Zones
---

# Three-Zone Accumulator Converter

The accumulator-to-float converter for an accumulator *wider* than the output exponent range: the bits above $e_{max}$ and below $e_{min}-w_F$ can never become significand bits, so they leave the normaliser's path entirely and collapse into one overflow flag and one sticky bit.

```tikz title="Three-zone split of an accumulator wider than the output exponent range: overflow OR, normaliser, sticky OR"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % binary32 exact sum of products: w_A = 554 = 128 + 277 + 149
  % x scale: 12 cm / 554 bits

  \draw (0,1.0) rectangle (12,1.7);
  \draw (2.772,1.0) -- (2.772,1.7);
  \draw (8.772,1.0) -- (8.772,1.7);
  \fill[black!12] (0,1.0) rectangle (2.772,1.7);
  \fill[black!12] (8.772,1.0) rectangle (12,1.7);

  \node[scale=0.85] at (1.386,1.35) {overflow};
  \node[scale=0.85] at (5.772,1.35) {normal range};
  \node[scale=0.85] at (10.386,1.35) {sticky};

  \node[anchor=south,scale=0.75] at (1.386,1.72) {$128$ b};
  \node[anchor=south,scale=0.75] at (5.772,1.72) {$277$ b};
  \node[anchor=south,scale=0.75] at (10.386,1.72) {$149$ b};

  \draw (0,1.7) -- (0,2.15);
  \node[anchor=south west,scale=0.75] at (-0.05,2.13) {$m_A=2e_{max}{+}1=255$};
  \draw (2.772,1.7) -- (2.772,2.15);
  \node[anchor=south,scale=0.75] at (3.4,2.13) {$e_{max}=127$};
  \draw (8.772,1.7) -- (8.772,2.62);
  \node[anchor=south,scale=0.75] at (8.772,2.6) {$e_{min}{-}w_F=-149$};
  \draw (12,1.7) -- (12,2.15);
  \node[anchor=south east,scale=0.75] at (12.05,2.13) {$\ell_A=2e_{min}{-}2w_F=-298$};

  % ---------- arrows into the three blocks
  \draw[->] (1.386,1.0) -- (1.386,0.5);
  \node[anchor=west,scale=0.75] at (1.44,0.75) {$128$};
  \draw[->] (5.772,1.0) -- (5.772,0.5);
  \node[anchor=west,scale=0.75] at (5.83,0.75) {$277$};
  \draw[->] (10.386,1.0) -- (10.386,0.5);
  \node[anchor=west,scale=0.75] at (10.44,0.75) {$149$};

  % ---------- blocks
  \draw (0,-0.3) rectangle (2.772,0.5);
  \node[scale=0.8,align=center] at (1.386,0.1) {wide OR\\ (vs.\ sign bit)};

  \draw (2.9,-0.3) rectangle (8.65,0.5);
  \node[scale=0.8,align=center] at (5.772,0.1)
    {LZC $+$ normaliser\\ (shift $\le e_{max}-e_{min}=253$)};

  \draw (8.772,-0.3) rectangle (12,0.5);
  \node[scale=0.8,align=center] at (10.386,0.1) {wide OR};

  % ---------- outputs
  \draw[->] (1.386,-0.3) -- (1.386,-1.9);
  \node[anchor=west,scale=0.75] at (1.44,-1.1) {overflow $\pm$: $2$};

  \draw[->] (4.3,-0.3) -- (4.3,-1.9);
  \node[anchor=west,scale=0.75] at (4.36,-1.1) {$F_s$: $w'_F{+}1$};
  \draw[->] (6.6,-0.3) -- (6.6,-1.9);
  \node[anchor=west,scale=0.75] at (6.66,-1.1) {$C$: $9$};

  \node[or port,scale=0.6] (o) at (11.3,-1.5) {};
  \draw[->] (8.1,-0.3) |- (o.in 1);
  \node[anchor=west,scale=0.75] at (8.16,-0.75) {sticky$_{\text{norm}}$};
  \draw[->] (10.386,-0.3) |- (o.in 2);
  \node[anchor=west,scale=0.75] at (10.44,-0.7) {sticky$_{\text{low}}$};
  \draw[->] (o.out) -- (11.85,-1.5) -- (11.85,-1.9);
  \node[anchor=west,scale=0.75] at (11.92,-1.72) {sticky: $1$};

  % ---------- final block
  \draw (0,-2.7) rectangle (12,-1.9);
  \node[scale=0.9] at (6.0,-2.3) {exponent $E_0+e_{max}-C$, round (ties to even), exceptions \& pack};
  \draw[->] (6.0,-2.7) -- (6.0,-3.35);
  \node[anchor=west,scale=0.8] at (6.06,-3.05) {$R$: $\text{float}(w'_E,w'_F)$};
\end{circuitikz}
\end{document}
```

*After Fig. 21.12, p. 638; widths are those of a binary32 exact sum-of-products accumulator, $128+277+149=554$.*

**Ask first which accumulator columns a finite result can ever name.** A finite value of $\text{float}(w'_E,w'_F)$ has an exponent in $[e_{min},e_{max}]$ and a significand occupying $w'_F+1$ columns starting at that exponent ([[Floating-Point Formats]]). The highest column any finite result can reach is therefore $e_{max}$, and the lowest is $e_{min}-w_F$ — the LSB of the smallest subnormal, one significand-width below the smallest normal exponent. That is a band of

$$w_{\text{norm}} = e_{max}-(e_{min}-w_F)+1 = e_{max}-e_{min}+w_F+1$$

columns, $127+126+23+1 = 277$ for binary32. The exact sum-of-products accumulator ([[Exact Sum-of-Products Operator]]) spans $[\,\ell_A, m_A] = [-298, 255]$ on $w_A = 554$ bits, because a *product* of two binary32 values reaches $2e_{max}+1$ at the top and $2e_{min}-2w_F$ at the bottom (Tables 21.1–21.2, pp. 626–627). More than half the register lies outside the band and can never be copied into $R$. The whole design follows from asking what those bits are still good for.

**The high zone is a range check, not data.** The accumulator is two's complement ([[Two's-Complement Exact Accumulator]]), so $A = -a_{m_A}2^{m_A} + \sum_{i<m_A} a_i 2^{i}$ with $s = a_{m_A}$ the sign. Sign extension is the statement that a two's-complement value fits in a narrower field exactly when every bit above that field equals the sign bit: $A$ is representable in the band iff $a_i = s$ for all $i > e_{max}$. Negating that gives, by De Morgan on the conjunction of equalities,

$$\text{overflow} \;=\; \bigvee_{i>e_{max}} \left(a_i \oplus s\right)$$

a row of XORs against the broadcast sign followed by a $128$-bit OR tree — area linear in the zone width, depth $\lceil\log_2 128\rceil = 7$ two-input gates. The *direction* of the overflow needs no extra logic: it is $s$ itself, so the pair $(\text{overflow}, s)$ selects $+\infty$ or $-\infty$ in [[Accumulator Exception FSM]]. Note that the same 128 bits carry no other information — if they are all equal to $s$ they are pure sign extension and the middle zone plus $s$ reconstructs $A$ exactly.

**The low zone is a rounding input, not data.** A bit at column $i < e_{min}-w_F$ is below the ulp of the smallest subnormal; no exponent the format can encode reaches it, so it can never be copied out. What it *can* still do is decide a rounding tie. Correct rounding of a truncated tail depends only on the round bit and on whether the rest of the tail is exactly zero ([[Rounding]], [[Error Accuracy]]), so 149 bits of information collapse into one:

$$\text{sticky}_{\text{low}} \;=\; \bigvee_{i<e_{min}-w_F} a_i$$

ORed with the normaliser's own sticky — the disjunction of the bits it shifts out of the *middle* window below the retained $w'_F+1$. Two ORs into one OR; association is all that is needed to fuse them. Under round-to-nearest-**ties-away**, which is what the in-range [[Accumulator-to-Float Converter]] implements by default, no sticky is required at all and this entire zone is dead logic. The zone exists to buy ties-to-even.

**The point of the split is that the normaliser is the expensive block.** A leading-sign counter plus barrel shifter over $w_A$ bits dominates the converter's area ([[Normalizers]], [[Leading Zero Counters]]). Feeding it 277 bits instead of 554 halves the LZC tree, whose cost is roughly linear in the number of leaves, and shortens the shifter twice over: the shift distance is now bounded by $e_{max}-e_{min}=253$ instead of $w_A$, so on the log-stage barrel-shifter model of [[Shifters]] it needs $\lceil\log_2 253\rceil = 8$ stages of 277 two-input muxes rather than $\lceil\log_2 554\rceil = 10$ stages of 554 — about $2.5\times$ fewer muxes. What replaces the removed half is two reduction trees, the cheapest structure in the chapter: linear area, logarithmic depth, no carry propagation. The bound on the shift distance is also what sizes $C$: it ranges over $[0,277]$, so $9$ bits.

**Exponent bookkeeping changes by exactly one constant.** The in-range converter computes the tentative biased exponent as $E = E_0 + m_A - C$, where $m_A$ is the MSB the leading-sign count is measured from. Here the normaliser's window starts at $e_{max}$, not $m_A$, so the constant becomes

$$E = E_0 + e_{max} - C$$

and nothing else in the round-and-pack stage moves. That stage is still the single $w'_E+w'_F$-bit adder that adds $s$ and the round bit at the LSB of the concatenated fields, so a carry out of the fraction field increments the exponent field for free.

**Subnormals need no special case, and the window's lower edge is why.** In this fixed-point view a subnormal is just a value whose leading bits happen to be zero. Because the shift is capped at $e_{max}-e_{min}$, the normaliser physically cannot shift a leading one past the $e_{min}$ column; a value whose leading one lies below $e_{min}$ comes out of the capped shift with its leading zeros still in place, which *is* the subnormal fraction encoding. Choosing the window's bottom at $e_{min}-w_F$ rather than $e_{min}$ is what guarantees every subnormal fits inside it. An IEEE-754 adder pays for a dedicated denormalising path here ([[Floating-Point Operators]]); this converter pays a shift-distance comparison it needed anyway.

**On FPGA both wide ORs vanish into the fabric.** A 6-input LUT ([[FPGAs]]) computes any function of six inputs, so the first level of the overflow comparator absorbs five accumulator bits plus the broadcast $s$ per LUT — $\lceil 128/5\rceil = 26$ LUTs — and the 6-ary OR tree above it closes in two more levels: $26 \to 5 \to 1$, depth 3. The sticky OR is $\lceil 149/6\rceil = 25$ LUTs and the same depth. Against a 277-bit LZC and an 8-stage shifter that is noise, which is why the split is close to free on FPGA and worth taking even when ties-to-even is not strictly required.

$$\boxed{\ \text{ovf}=\bigvee_{i>e_{max}}\!\left(a_i \oplus s\right),\quad
\text{sticky}=\text{sticky}_{\text{norm}} \vee\!\!\bigvee_{i<e_{min}-w_F}\!\! a_i,\quad
w_{\text{norm}}=e_{max}-e_{min}+w_F+1\ }$$

**When it breaks.**

- The zone test is **necessary but not sufficient**. All high bits equal to $s$ only bounds $|A| < 2^{e_{max}+1}$, which still exceeds the largest finite float $2^{e_{max}}(2-2^{-w'_F})$. The residual overflow — and the one created by rounding up — is caught downstream by the carry out of the fraction field in the pack adder, not here.
- The extreme value $-2^{m_A}$ has all its high bits equal to $s=1$, so the OR reports *no* overflow. Same adder, same free catch; do not add logic for it.
- The split pays nothing when $w_A \le e_{max}-e_{min}+w_F+1$. For the plain exact-sum accumulator ($w_A = 277$ for binary32) both outer zones are empty and this degenerates exactly into [[Accumulator-to-Float Converter]].
- For an [[Application-Specific Exact Accumulator]] with $m_A < e_{max}$ or $\ell_A > e_{min}-w_F$ the zones are empty in the *other* direction: the window is narrower than the format and the missing low columns are known zeros, not an unknown tail — no sticky exists to compute, and the accuracy loss has already been paid at the input shifter.
- Under ties-away the sticky zone is dead logic. Synthesis will strip it, but the 149 wires still route.
- On a [[High-Radix Carry-Save Accumulator]] the zone bits are not the value until the deferred carries are flushed. A wide OR over an unresolved radix-$2^\alpha$ representation is meaningless: a chunk of all zeros with a pending carry-in is not zero. Propagate first, or take the zones from the propagating adder in the converter, never from the register.

**RTL (Spade).** The pure zone-splitting wiring — everything in the top bar of the diagram plus the two reduction trees, with the normaliser left to its own note:

```spade
fn zone_split<#uint WHI, #uint WMID, #uint WLO>(
    a: int<{WHI + WMID + WLO}>
) -> (bool, int<{WMID + 1}>, bool) {
    let s = a.sign_bit();
    let (low, rest) = a.as_bits().split_at::<WLO>();
    let (mid, high) = rest.split_at::<WMID>();

    let zero: uint<WHI> = 0;
    let ones: uint<WHI> = ~zero;
    let ovf = high.as_uint() != (if s { ones } else { zero });

    (ovf, mid.concat([s]).as_int(), low.reduce_or())
}
```

`WHI`/`WMID`/`WLO` are the three zone widths, $128/277/149$ for binary32 sum-of-products; `a` is the $w_A$-bit accumulator, `low` and `high` the two shaded blocks, `mid` the white one. The comparison against a replicated sign is the XOR row and the OR tree of the diagram fused — `high.as_uint() != mask` is one expression but synthesises to the same tree, and it never widens, unlike `+`. The returned window is `int<{WMID+1}>`: the 277 middle bits with $s$ re-attached on top, which is what a leading-*sign* counter needs, and the one place a wrong `concat` order would silently bit-reverse the operator. Everything is a `fn`, so it is purely combinational, with no register anywhere between the accumulator and the normaliser; synthesis will balance the two reduction trees rather than build the left-leaning chain `reduce_or` reads like.

Verified by monomorphising a `float(4,3)` scale model — $m_A=15$, $e_{max}=7$, $e_{min}-w_F=-9$, $\ell_A=-18$, so $8/17/9$ over $w_A=34$ — and simulating it against a behavioural Verilog reference: 11 named vectors including single-bit-set cases at every zone boundary, 5000 random 34-bit values and 2000 boundary-biased ones, 7011 total, zero mismatches.

**Related Notes**

- [[Accumulator-to-Float Converter]] – extends: the in-range converter this wraps two zones around; identical below the normaliser except for one exponent constant.
- [[Normalizers]] – depends-on: consumes the middle zone and is the block whose halving justifies the split.
- [[Leading Zero Counters]] – depends-on: produces $C$ on 9 bits, bounded by the 277-bit window rather than by $w_A$.
- [[Rounding]] – supports: the low zone exists only because ties-to-even needs a sticky bit.
- [[Floating-Point Formats]] – depends-on: $e_{max}$, $e_{min}$, $w_F$ are what place the two zone boundaries.
- [[Exact Sum-of-Products Operator]] – compares: the operator whose 554-bit accumulator makes the split necessary in the first place.
- [[Application-Specific Exact Accumulator]] – counter-example: tightening $m_A$ and $\ell_A$ empties both zones and the split disappears.
- [[High-Radix Carry-Save Accumulator]] – depends-on: its deferred carries must be flushed before any zone OR means anything.
- [[Accumulator Exception FSM]] – supports: consumes the $(\text{overflow}, s)$ pair as $\pm\infty$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §21.2.4 "Conversion of the Accumulator Back to Floating Point", pp. 636–638 — the three-zone description and Fig. 21.12, p. 638.
- Same, §21.2.4 pp. 636–637 — the in-range converter (Fig. 21.11, p. 637) whose exponent path and pack adder are reused unchanged.
- Same, Tables 21.1–21.2, pp. 626–627 — the $277$- and $554$-bit accumulator widths for binary32.
- Same, §21.3, p. 638 — the cost rule of thumb placing the converter and the shifter above the fixed-point adder.
