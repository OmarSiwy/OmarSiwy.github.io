---
title: "Round-to-Nearest Ties-Up"
description: "Halves the worst-case error to 1/2 ulp for the price of one added constant 2^(l-1), and costs nothing at all when that constant can be absorbed into a bit heap or a spare carry-in."
kind: circuit
source: "ASA §3.1.3–3.1.5, pp. 68–71"
status: seed
spade: simulated
tags: [digital, error-accuracy, rounding, fixed-point, fpga]
aliases:
  - "Round to Nearest, Ties Up"
  - "Round-to-Nearest Ties Up"
  - "Round Half Up"
  - "Rounding Half-Up"
  - "Rounding Bit"
  - "Rounding Half-Ulp"
---

# Round-to-Nearest Ties-Up

The cheapest correct round-to-nearest in fixed point: add one constant of weight half an ulp, then truncate, which collapses in hardware to an incrementer whose carry-in is a single bit of the value being discarded.

```tikz title="Round-to-nearest ties-up: the round bit r drives the carry-in of an incrementer over the kept field, and the constant is free if it can be dropped into a bit heap instead"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- the word Y, split at weight 2^l ----
  \draw[fill=gray!8] (0,1.65) rectangle (4.4,2.35);
  \node at (2.2,2.0) {kept field \; $\lfloor Y\rfloor_\ell$};
  \draw[fill=black!20] (4.4,1.65) rectangle (5.1,2.35);
  \node at (4.75,2.0) {$r$};
  \draw (5.1,1.65) rectangle (8.0,2.35);
  \node at (6.55,2.0) {discarded, $g-1$ bits};

  \node at (0.35,2.62) {$2^{m}$};
  \node at (3.85,2.62) {$2^{\ell}$};
  \node at (4.75,2.62) {$2^{\ell-1}$};
  \node at (7.70,2.62) {$2^{\ell_{\mathrm{ext}}}$};
  \node at (4.0,3.15) {$Y$ on $\mathrm{ufix}(m,\ell_{\mathrm{ext}})$, \; $w=m-\ell_{\mathrm{ext}}+1$ bits};

  \draw[dashed] (4.4,1.35) -- (4.4,2.75);

  % ---- incrementer ----
  \draw[fill=gray!8] (0,0.2) rectangle (4.4,0.9);
  \node at (2.2,0.55) {incrementer \;$+\,c_{\mathrm{in}}$};

  \draw[->] (2.2,1.65) -- (2.2,0.9) node[midway,left] {$m-\ell+1$};

  \draw[->] (4.75,1.65) -- (4.75,0.55) -- (4.42,0.55);
  \node[anchor=west] at (4.85,0.55) {$c_{\mathrm{in}}=r$ \; (1 bit)};

  \draw (6.55,1.65) -- (6.55,1.05);
  \draw (6.35,1.25) -- (6.75,0.85);
  \draw (6.75,1.25) -- (6.35,0.85);
  \node[anchor=west] at (6.9,1.05) {dropped: free};

  \draw[->] (2.2,0.2) -- (2.2,-0.6);
  \node[anchor=west] at (2.35,-0.35) {$R=\lfloor Y\rceil_\ell$ on $\mathrm{ufix}(m+1,\ell)$, \; $m-\ell+2$ bits};

  % ---- inset: absorbing the half-ulp into a bit heap ----
  \node[anchor=west] at (9.0,3.15) {instead of adding it:};
  \foreach \x in {9.6,10.3,11.0,11.7} {
    \foreach \y in {1.35,1.65,1.95} \fill (\x,\y) circle (2.2pt);
  }
  \draw (11.0,2.25) circle (2.6pt);
  \node[anchor=west] at (11.25,2.55) {constant $2^{\ell-1}$};
  \node at (9.6,1.02) {$2^{\ell+1}$};
  \node at (10.3,1.02) {$2^{\ell}$};
  \node at (11.0,1.02) {$2^{\ell-1}$};
  \node at (11.7,1.02) {$2^{\ell-2}$};
  \node[align=center,anchor=north] at (10.65,0.75)
    {one more entry in a column\\the compressor tree already sums\\$\Rightarrow$ rounding costs nothing};

\end{circuitikz}
\end{document}
```

**Turn "round to nearest" into "add a constant, then truncate."** The operator to build is $\lfloor Y\rceil_\ell$, the nearest multiple of $2^\ell$ to an input $Y$ carried on $\mathrm{ufix}(m,\ell_{\mathrm{ext}})$ with $\ell_{\mathrm{ext}}<\ell$, i.e. $w=m-\ell_{\mathrm{ext}}+1$ bits in and $g=\ell-\ell_{\mathrm{ext}}$ bits to be removed (formats and their $\mathrm{ulp}=u=2^{\ell}$ are fixed in [[Number Formats]] and [[Error Accuracy]]). The identity the whole circuit rests on is

$$\lfloor Y\rceil_\ell \;=\; \big\lfloor\, Y + 2^{\ell-1} \,\big\rfloor_\ell \tag{3.1}$$

**Prove it by Euclidean division at the cut.** Split $Y$ at weight $2^\ell$ as $Y=q\,2^{\ell}+D$ with $q$ the kept field read as an integer and $0\le D<2^{\ell}$ the discarded field — this is division with remainder, and it is *free* in binary because the two parts are disjoint slices of one bit vector. The floor $\lfloor\cdot\rfloor_\ell$ is by definition $q2^\ell$, so
$\lfloor Y+2^{\ell-1}\rfloor_\ell = q2^\ell$ exactly when $D+2^{\ell-1}<2^{\ell}$, i.e. **iff $D<2^{\ell-1}$**, and otherwise the sum crosses into the next multiple and the result is $(q+1)2^\ell$. Rounding down strictly below the midpoint and up at or above it is precisely round-to-nearest with ties resolved upward. The error is $\delta = R-Y \in (-u/2,\,+u/2]$, half-open because the tie is claimed by the upper side, and the bound $u/2$ is **attained** — unlike truncation's $u$, which is not (see [[Truncation Unit]]).

**The addition is never actually an addition.** Read the condition $D\ge 2^{\ell-1}$ as a bit test: $D$ is the discarded field, and $2^{\ell-1}$ is its own MSB's weight, so $D\ge2^{\ell-1}$ **iff the bit of weight $2^{\ell-1}$ is set**. Call that bit $r$, the *round bit*. Therefore the carry that $+2^{\ell-1}$ produces into position $\ell$ is exactly $r$, independently of every bit below it, and the $g-1$ bits below $r$ influence nothing at all — they are dropped, and the drop is free. What survives is one increment of the kept field by $r$:

$$R \;=\; \lfloor Y\rfloor_\ell + r\cdot 2^{\ell},\qquad r=\text{bit of }Y\text{ at weight }2^{\ell-1}$$

Widths: the kept field is $m-\ell+1$ bits, $r$ is 1 bit, and the incrementer is a carry-propagate chain over $m-\ell+1$ bits with $c_{\mathrm{in}}=r$ and no second operand — cheaper than the general [[Ripple-Carry Adder]] by every measure, since half the full adders degenerate to half adders. The output is $m-\ell+2$ bits in the worst case: $Y$ within half an ulp of $2^{m+1}$ rounds up out of the input's own range, e.g. $111.1\to1000$ at $\ell=0$. Range analysis usually excludes that carry-out, but nothing in the rounding does, so the honest output format is $\mathrm{ufix}(m+1,\ell)$.

**Price it against the two things it competes with.** Assume $f(X)$ has been computed exactly on too many bits — the situation of §3.1.4:

| option | worst-case error | cost |
| --- | --- | --- |
| truncate at $\ell$ | $<1\,u$, never attained | free — drop $g$ bits |
| round to nearest at $\ell$ by (3.1) | $\le\tfrac12 u$, attained at ties | one incrementer over $m-\ell+1$ bits |
| truncate at $\ell-1$ | $\le\tfrac12 u$ | free, but the result is one bit wider **forever** |

Rows two and three deliver the same error bound $2^{\ell-1}$, so the real choice is *one incrementer now* versus *one extra bit in every downstream consumer* (p. 70). That is a global decision, not a local one: the extra bit widens the next multiplier quadratically, while the incrementer is paid once.

**Move the constant upstream and the price goes to zero.** Nothing forces $2^{\ell-1}$ to be added *here*. If the value $Y$ is itself produced by a summation — the usual case, since the low half of any multiplier or filter datapath is a [[Bit Heaps|bit heap]] collapsed by a [[Compressor Trees|compressor tree]] — then the rounding half-ulp is just **one more constant entry in the column of weight $2^{\ell-1}$**, and a heap column absorbs an extra bit for at most one additional row in one compressor. Equivalently, if a carry-propagate adder already sits at that point with an unused $c_{\mathrm{in}}$ at the right weight, drive it with $1$. Either way round-to-nearest costs exactly what truncation costs, and then it wins without discussion (p. 70). This trick recurs throughout the book; look for it before accepting the middle row of the table above.

> [!important] The half-ulp is free far more often than it looks.
> The constant does not have to be injected at the rounding point — only somewhere in the datapath whose exact sum reaches the rounding point, at the right weight. Any bit heap, any compressor tree, any adder with a spare carry-in anywhere upstream will take it. Check for that path *before* you cost the incrementer, because when it exists the entire trade-off in this note disappears and round-to-nearest strictly dominates truncation.

**On FPGA the incrementer is not free, but it is nearly invisible.** The kept field is already occupying $\lceil (m-\ell+1)/2\rceil$ to $m-\ell+1$ LUT/carry rows if it feeds any arithmetic at all, and an increment by $c_{\mathrm{in}}$ maps onto the hard carry chain with one LUT per bit and no general-fabric routing between bits ([[FPGAs]]). Its latency is the carry chain's, tens of picoseconds per bit, so on widths up to about 32 the rounding addition is dwarfed by the routing to and from it. What is *not* free is the extra output bit of the third table row: that one propagates into block-RAM aspect ratios, DSP port widths and register counts downstream, which is exactly the FPGA-specific reason to prefer the incrementer over the wider format.

**Ties go up, not away from zero — and that costs the symmetry.** In two's complement the discarded field $D$ is read as an unsigned slice regardless of the sign of $Y$, so the derivation above is unchanged for signed inputs and the tie is always resolved toward $+\infty$: $-1.5\to-1$. The representable set is symmetric about zero but the operator is not, so $\lfloor -Y\rceil_\ell \ne -\lfloor Y\rceil_\ell$ at ties, and any algorithm that relies on $\mathrm{round}(-x)=-\mathrm{round}(x)$ — interval arithmetic, symmetric quantizers, some CORDIC scalings — is broken by this rounder. That is the whole reason [[Round-to-Nearest Ties-to-Even]] exists, and it is why IEEE 754-1985 paid for tie detection (pp. 69–70).

> [!warning] The book's footnote conflates ties-up with IEEE's *ties to away*
> Footnote 2 on p. 69 states that "the cheaper *ties to up* rule was added in the 2008 revision of the IEEE 754 standard… called *round to nearest, ties to away (from zero)*". These are two different modes and (3.1) implements the first, not the second. Counterexample at $\ell=0$: (3.1) gives $\lfloor-1.5\rceil_0=-1$, as the book's own main text says one paragraph earlier; IEEE-754-2008 `roundTiesToAway` gives $-2$. The footnote's reasoning is sound only for a **sign-magnitude** significand, where adding a half-ulp to the magnitude does round away from zero; in the two's-complement fixed-point setting of this chapter it does not. Costing `roundTiesToAway` as "one added constant" is therefore wrong — it needs the sign to select between $+2^{\ell-1}$ and $+2^{\ell-1}-\epsilon$, or an inversion of the operand around zero.

**Bias is the reason to pay at all.** Truncation satisfies $\lfloor Y\rfloor_\ell\le Y$ always, so $\delta_{\mathrm{trunc}}\in(-u,0]$ is one-signed with mean $-u/2$ for $Y$ uniform: over $N$ accumulated truncations the *bound* grows like $Nu$ but the *expected* error grows like $-Nu/2$, a systematic drift rather than noise. Ties-up gives $\delta\in(-u/2,+u/2]$, symmetric apart from the tie, so its mean error is $O(u\cdot\Pr[\text{tie}])$ rather than $O(u)$ — and $\Pr[\text{tie}]=2^{-(g-1)}$ for a uniformly distributed $Y$ with $g$ guard bits, which decays geometrically. One guard bit of internal precision buys most of the unbiasedness that ties-to-even buys with tie-detection logic. This is the argument to make when someone proposes ties-to-even inside a fixed-point datapath; see [[Error Analysis]] for how the bias enters a composed bound.

**In a library it is one mode switch, and the modes are not ordered by cost.** `fixed_pkg` for VHDL and `ap_fixed`/`ac_fixed` for C++ HLS always offer at least round-to-nearest and round-toward-$-\infty$ (truncation), and the trade-off table above is exactly what that switch buys. The **directed** modes — toward zero, away from zero, toward $+\infty$ — are not implementable by truncation in fixed point, carry truncation's 1-ulp bound, and cost *more* than ties-up because on top of the rounding addition they must detect the all-discarded-bits-zero case (see [[Directed Rounding Unit]]). Simultaneously less accurate and more expensive; pick one only for a real reason such as safe interval bounds (p. 71). Overflow behaviour is an orthogonal switch with its own cost — [[Saturating Overflow Unit]].

$$\boxed{\ \lfloor Y\rceil_\ell=\big\lfloor Y+2^{\ell-1}\big\rfloor_\ell=\lfloor Y\rfloor_\ell+r\,2^{\ell},\quad r=Y_{[\ell-1]},\qquad \delta\in\left(-\tfrac{u}{2},+\tfrac{u}{2}\right]\ }$$

**When it breaks**

- **$g=0$.** There is no bit at weight $2^{\ell-1}$ to test, so there is nothing to round; the operator is the identity. The RTL below refuses this case at compile time rather than silently returning $Y$.
- **Symmetry about zero.** Any consumer needing $\mathrm{round}(-x)=-\mathrm{round}(x)$ must use [[Round-to-Nearest Ties-to-Even]] or the [[Half-Unit Biased Format]], whose representable set makes negation a bitwise inversion.
- **Long accumulations where the tie is not rare.** Ties-up is unbiased only to $O(u\cdot\Pr[\text{tie}])$. If $Y$ concentrates on midpoints — a common outcome when the upstream datapath is itself a rounding at $\ell-1$ — the residual bias is $u/2$ per step and behaves like truncation. Check the *distribution* of the discarded field, not just its width.
- **It is still only half an ulp.** Round-to-nearest at the output does not make an operator correctly rounded once any approximation error exists upstream: the final rounding alone spends the entire $u/2$ budget, so two half-ulps cannot fit in one. See [[Faithful Operator]] and, for the one architecture that escapes, [[Correctly-Rounded Product Table]].
- **The output carry.** $m-\ell+2$ bits, not $m-\ell+1$. Dropping the carry-out silently converts a rounding into a wraparound at the top of the range.
- **When the constant cannot be absorbed and the datapath is latency-critical.** The incrementer adds a full carry propagation over the kept field to the end of the pipeline stage. Truncating one bit lower is free in time and costs only width — the third table row is the right answer whenever the extra bit dies quickly.

**RTL (Spade)**

```spade
/// Round a W-bit value to the nearest multiple of 2^L, ties up.
/// Returns W-L+1 bits: the kept field can carry out.
fn round_ties_up<#uint W, #uint L>(y: uint<W>) -> uint<{W - L + 1}> {
    let b = y.as_bits();
    let kept: uint<{W - L}> = b[L..W].as_uint();
    let disc: uint<L> = b[0..L].as_uint();
    let r: uint<{W - L}> = zext(disc.msb().as_uint());
    kept + r
}
```

`kept` is the left-hand box of the drawing and `disc` is everything right of the dashed cut; `disc.msb()` is the round bit $r$, the one dark cell. `kept + r` *is* the incrementer: Spade's `+` grows $W-L$ to $W-L+1$ bits, which is exactly the carry-out drawn leaving the incrementer, so no `zext` is needed on the result. Only `disc`'s MSB is ever read, so the $g-1$ lower bits are dead and synthesis deletes them — the compiler performs the "truncation is free" argument for you, and the emitted Verilog contains no logic for them. Everything is a `fn`, hence purely combinational: no clock, no state. Instantiating with `L = 0` is rejected rather than mis-synthesised — `error: Expected N > 0, but N is 0` at `disc.msb()` — which is the $g=0$ corner above, caught by the type system. On FPGA the `+` collapses onto the hard carry chain and the whole rounder is one LUT row per kept bit; on ASIC the synthesiser will pick an incrementer from its library, not the ripple structure implied here.

Verified by simulation at $W=8$, $L=3$ against the behavioural reference $\lfloor (Y+4)/8\rfloor$ computed in 9 bits: 10 named vectors (including the tie $Y=28$, the carry-out case $Y=255$, and the asymmetric pair $132/33$ that a bit-reversed field would confuse), a 3000-vector random sweep, and an exhaustive sweep of all 256 inputs — 3266 vectors, no mismatch.

**Related Notes**

- [[Truncation Unit]] – compares: the free alternative this note buys a factor of two over, and the baseline for every cost claim here.
- [[Round-to-Nearest Ties-to-Even]] – compares: same error bound, unbiased and symmetric about zero, paid for with tie detection.
- [[Half-Unit Biased Format]] – counter-example: moves the half-ulp into the *format*, so this note's accuracy comes out at this note's competitor's price.
- [[Bit Heaps]] – supports: the column where the constant $2^{\ell-1}$ is absorbed for free.
- [[Compressor Trees]] – supports: what actually sums that column, and why one extra entry is nearly free in it.
- [[Ripple-Carry Adder]] – depends-on: the carry propagation the incrementer is a degenerate case of.
- [[Directed Rounding Unit]] – compares: less accurate *and* more expensive than this, because of the all-zeros detection.
- [[Choosing a Rounding Mode]] – compares: where this sits against every sibling mode.
- [[Faithful Operator]] – extends: this is the incompressible $u/2$ term in every faithful operator's error budget.
- [[Error Analysis]] – supports: how the $\pm u/2$ and the residual bias enter a composed bound.
- [[Faithful Multiplier by Pi]] – extends: a worked datapath where this rounder is the final stage and consumes the whole budget.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 3 "Computing Just Right: Accuracy Specification and Error Analysis":

- §3.1.3 Rounding to the nearest, pp. 68–70 — Eq. (3.1), the tie definition, the $-1.5\to-1$ remark, and footnote 2 on the IEEE 754-2008 naming.
- §3.1.4 Truncation versus rounding to the nearest, p. 70 — the three-way trade-off and the "add $2^{\ell-1}$ for free upstream" trick.
- §3.1.5 Rounding and overflow specification in fixed-point libraries, p. 71 — `fixed_pkg`, `ap_fixed`, `ac_fixed`; why directed modes cost more.
- [[1.2) Error Accuracy]] — §Rounding, §Rounding and Overflow in Fixed-Point Libraries, §Trade-offs.

No area or delay figures are quoted: Chapter 3 is technology-neutral and gives none.
