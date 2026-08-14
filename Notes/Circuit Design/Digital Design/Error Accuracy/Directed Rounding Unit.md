---
title: Directed Rounding Unit
description: "Round toward zero, away from zero, or toward +inf — the only modes that give provably one-signed interval bounds, and the only ones that are both less accurate and more expensive than round-to-nearest."
kind: circuit
status: seed
spade: simulated
tags: [digital, error-accuracy, rounding, interval-arithmetic]
aliases:
  - Directed Rounding
  - Directed Rounding Modes
  - Round Toward Zero
  - Round Away From Zero
  - Round Toward Infinity
---

# Directed Rounding Unit

A rounding circuit whose output is guaranteed to lie on a *chosen* side of the exact value, bought by replacing round-to-nearest's single round bit with a sticky bit over the whole discarded field.

```tikz title="Directed rounding unit: two's-complement truncation plus one conditional increment, enabled by the sticky OR of the discarded field and a mode-selected function of the sign"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  box/.style={draw, rounded corners=1pt, align=center, font=\footnotesize},
  lbl/.style={font=\scriptsize}]

  % ---- input bus, split into kept field K and discarded field D ----
  \draw[thick] (0,4.0) rectangle (7.0,4.6);
  \draw[thick] (4.6,4.0) -- (4.6,4.6);
  \node[lbl] at (2.3,4.3) {$K$};
  \node[lbl] at (5.8,4.3) {$D$};
  \node[lbl, anchor=east] at (-0.15,4.3) {$Y\in\mathrm{sfix}(m,\ell_{\mathrm{ext}})$};

  % sign tap
  \draw (0.4,4.6) -- (0.4,5.3) -- (9.0,5.3);
  \node[lbl, anchor=south west] at (0.5,5.35) {$\mathrm{sign}=$ MSB of $Y$};

  % ---- sticky bit: OR-reduce of the discarded field ----
  \node[box, minimum width=22mm, minimum height=8mm] (or) at (5.8,2.4)
       {OR-reduce\\{\scriptsize $g-1$ gates, depth $\lceil\log_2 g\rceil$}};
  \draw[->] (5.8,4.0) -- node[lbl,right]{$g=\ell_R-\ell_{\mathrm{ext}}$} (or.north);

  % ---- mode select and the AND ----
  \node[box, minimum width=24mm, minimum height=8mm] (sel) at (9.0,0.9)
       {mode select\\{\scriptsize $2$:$1$ on $\mathrm{sign}$}};
  \node[box, minimum width=12mm, minimum height=6mm] (and) at (5.8,0.9) {AND};
  \draw[->] (9.0,5.3) -- (sel.north);
  \draw[->] (or.south) -- node[lbl,right]{$\mathrm{sticky}$} (and.north);
  \draw[->] (sel.west) -- node[lbl,above]{$c_{\mathrm{mode}}$} (and.east);
  \draw[->] (9.0,-0.4) -- node[lbl,right]{mode} (sel.south);

  % ---- incrementer ----
  \node[box, minimum width=40mm, minimum height=8mm] (inc) at (2.0,-0.8)
       {incrementer\\{\scriptsize $w_K$-bit, one carry chain}};
  \draw[->] (2.3,4.0) -- node[lbl,left]{$w_K=m-\ell_R+1$} (2.3,-0.4);
  \draw[->] (and.south) -- (5.8,-0.8) -- node[lbl,above]{$\mathrm{inc}$} (inc.east);
  \draw[->] (inc.south) -- node[lbl,left]{$w_K+1$} (2.0,-2.4);
  \node[lbl, anchor=north] at (2.0,-2.45) {$R\in\mathrm{sfix}(m+1,\ell_R)$};

  % ---- what the mode select drives ----
  \node[anchor=west, font=\scriptsize, align=left] at (5.4,-2.0)
    {$c_{\mathrm{mode}}=0$\hspace{3mm}: toward $-\infty$ (truncation)\\
     $c_{\mathrm{mode}}=1$\hspace{3mm}: toward $+\infty$\\
     $c_{\mathrm{mode}}=\mathrm{sign}$\hspace{0.2mm}: toward $0$\\
     $c_{\mathrm{mode}}=\overline{\mathrm{sign}}$\hspace{0.2mm}: away from $0$};
\end{circuitikz}
\end{document}
```

**Split the input at the rounding point and the algebra becomes exact.** The input $Y$ is in $\mathrm{sfix}(m,\ell_{\mathrm{ext}})$, i.e. $w_{\mathrm{in}}=m-\ell_{\mathrm{ext}}+1$ bits; the output format is $\mathrm{sfix}(m,\ell_R)$ with $\ell_R>\ell_{\mathrm{ext}}$ and ulp $u=2^{\ell_R}$ — see [[Number Formats]]. Cut the bit vector at position $\ell_R$ into a **kept field** $K$ of $w_K=m-\ell_R+1$ bits and a **discarded field** $D$ of $g=\ell_R-\ell_{\mathrm{ext}}$ bits, and read $D$ as *unsigned*:

$$Y \;=\; K\cdot 2^{\ell_R} \;+\; D\cdot 2^{\ell_{\mathrm{ext}}},\qquad 0\le D<2^{g}$$

The decomposition is exact — no reinterpretation, just a rename of the two halves of the same wire bundle. What makes it useful is the two's-complement identity: the sign bit carries weight $-2^{m}$ in both the long and the short vector, so shortening the vector never touches it, and therefore $K$ is exactly $\lfloor Y\rfloor_{\ell_R}$ **including for negative $Y$**. Dropping bits in two's complement is round toward $-\infty$, not round toward zero. That circuit is the [[Truncation Unit]], and it is free.

**All four directed modes are that floor plus one conditional increment.** A directed rounding returns one of the two neighbours $\lfloor Y\rfloor_{\ell_R}=K$ and $\lceil Y\rceil_{\ell_R}$, and by the decomposition above $\lceil Y\rceil_{\ell_R}=K+[D\neq 0]$ — the ceiling coincides with the floor exactly when $Y$ is already representable. Writing $s=\operatorname{sign}(Y)$ for the MSB (true when $Y<0$) and choosing between floor and ceiling per mode:

| mode | $Y\ge 0$ | $Y<0$ | increment enable $c_{\mathrm{mode}}$ |
| --- | --- | --- | --- |
| toward $-\infty$ | floor | floor | $0$ |
| toward $+\infty$ | ceil | ceil | $1$ |
| toward $0$ | floor | ceil | $s$ |
| away from $0$ | ceil | floor | $\bar{s}$ |

Toward-zero and away-from-zero are *sign-dependent* only because two's complement is not a sign-magnitude encoding; toward $\pm\infty$ are sign-blind. All four share one $w_K$-bit incrementer whose carry-in is $[D\neq 0]\wedge c_{\mathrm{mode}}$, so the mode is a two-bit pin, not four datapaths.

**The sticky bit is the entire extra cost, and it is the same sticky bit as IEEE 754's.** $[D\neq 0]=\bigvee_{i=0}^{g-1}d_i$ costs $g-1$ two-input OR gates at depth $\lceil\log_2 g\rceil$. Set that against [[Round-to-Nearest Ties-Up]], whose enable follows from the same decomposition applied to Eq. (3.1): $\lfloor Y+2^{\ell_R-1}\rfloor_{\ell_R}=K+[D\ge 2^{g-1}]$, and $[D\ge 2^{g-1}]$ is simply $d_{g-1}$ — **one wire**, the round bit. Both modes drive the identical incrementer; the directed unit differs by an OR tree over the remaining $g-1$ bits and a $2$:$1$ select on the sign. On an FPGA the incrementer is a carry-chain row that ties-up also needs, and the OR tree is $\lceil\log_6 g\rceil$ levels of LUT — one LUT for any $g\le 6$. Cheap in area; the point is that it buys you nothing in accuracy.

> [!warning] The source's cost phrasing is imprecise
> ASA p. 71 says the directed modes need, "on top of the rounding addition", logic to detect all-zero discarded bits. Taken literally that is wrong: a directed rounder must **replace** the ties-up enable, not augment it. Adding $2^{\ell_R-1}$ and then correcting by $[D\neq0]$ gives $\lceil 17.6\rceil=19$ (since $\lfloor 17.6+0.5\rfloor=18$ and $D\neq0$ adds one more), not $18$. The correct reading is the one derived above — same adder, different enable, and the *delta* in cost is the OR tree alone.

**What you buy is a bound with a known sign; what you pay is a factor of two in accuracy.** For round toward $+\infty$, $\delta(Y)=\lceil Y\rceil_{\ell_R}-Y\in[0,u)$: one-signed, and like truncation the bound $u$ is approached but never attained, since $D\cdot2^{\ell_{\mathrm{ext}}}\le u-2^{\ell_{\mathrm{ext}}}$ on a finite input. Round toward $-\infty$ gives $\delta\in(-u,0]$, and the sign-dependent modes give $|\delta|<u$ with the sign of $\delta$ tied to the sign of $Y$. Compare round-to-nearest's $\delta\in(-u/2,+u/2]$: the directed bound is twice as large, and it is deliberately biased, with mean $\pm u/2$ for uniform $Y$, so $N$ chained directed roundings drift by $\pm Nu/2$ rather than averaging out — the accumulation argument of [[Error Analysis]]. Every directed mode still satisfies $\delta<u$, so a directed rounding unit *is* a [[Faithful Operator]]; it is simply the most expensive way to be one.

**The bias is the product, not the defect — that is the only reason to build this.** An interval $[\mathrm{lo},\mathrm{hi}]$ is a machine object that claims to enclose an exact real. Quantising $\mathrm{hi}$ with any mode that can round *down* destroys the claim in one step; only round toward $+\infty$ preserves $\mathrm{hi}\ge$ exact, and only round toward $-\infty$ preserves $\mathrm{lo}\le$ exact. Round-to-nearest is inadmissible however accurate it is, because accuracy is not the property being asked for. And because two's-complement truncation already *is* round toward $-\infty$, an interval datapath pays for exactly one of its two bounds: the lower one is a wire cut, the upper one is this circuit.

> [!important] Directed rounding is a datapath-wide discipline, not a final-stage mode pin
> The enclosure property composes only if **every** rounding inside the upper-bound datapath goes toward $+\infty$ and every step is monotone increasing in the value being rounded (a subtraction flips the requirement, so the operand's *other* bound is the one to use). One internal truncation left in the $\mathrm{hi}$ path and the interval stops being a proof — it is then just two numbers. Worse, if the datapath contains an *approximation* rather than an exact computation, directed rounding of an already-wrong intermediate proves nothing at all: the pre-rounding value must itself be exact or a proven bound. This is why interval hardware is built as two datapaths with fixed directions, not one datapath with a mode input, and why the mode input in the diagram above belongs to a library element, not to a designed operator.

**Which mode is free depends on the encoding, not on the mode.** Truncation is free precisely because it agrees with the direction the encoding's bit-drop already goes. Two's complement drops toward $-\infty$; an IEEE significand is sign-magnitude, so dropping its low bits reduces the *magnitude* and round-toward-zero is the free mode there, while toward $\pm\infty$ costs the sticky — the mirror image of the fixed-point situation, and worth remembering when a fixed-point block is dropped into a [[Floating-Point Operators|floating-point]] pipeline with the mode name carried across unchanged.

$$\boxed{\;\circ_{\ell_R}(Y)\;=\;\lfloor Y\rfloor_{\ell_R}\;+\;\big(\mathrm{sticky}\wedge c_{\mathrm{mode}}\big)\cdot 2^{\ell_R},\qquad \mathrm{sticky}=\bigvee_{i=0}^{g-1} d_i\;}$$

**When it breaks.**

- **The increment overflows.** $\lceil\cdot\rceil$ on the largest representable $Y$ with $D\neq0$ carries out of the kept field, so the honest output format is $\mathrm{sfix}(m+1,\ell_R)$. Forcing it back to $m$ needs either a range argument or a [[Saturating Overflow Unit]] — and note that saturation is itself directed, so it does not break an upper bound.
- **$g=0$.** Nothing is discarded, the OR-reduce is the empty disjunction $0$, and all four modes collapse to the identity. Correct, but synthesis should be checked to have removed the logic rather than built a zero-width tree.
- **$g=1$.** Sticky and round bit coincide, so a directed mode costs exactly what ties-up costs. Below two guard bits the whole trade-off in this note disappears.
- **The value is approximate.** Then a directed mode is strictly worse than round-to-nearest on every axis: bigger bound, biased, dearer, and the directional guarantee it was chosen for does not hold. See the callout above.
- **You wanted one-signed error, not a bound.** Truncation already gives that, for free, in the $-\infty$ direction. Reach for this circuit only when the direction you need is not the one your encoding hands you.

**RTL.** One entity, parameterised on input width and guard-bit count.

```spade
enum RMode {
    Down,   // toward -inf  (= plain truncation in two's complement)
    Up,     // toward +inf
    Zero,   // toward zero
    Away,   // away from zero
}

/// Directed rounding of a two's-complement fixed-point value.
/// W = input width, G = number of discarded LSBs. Output is W-G+1 bits:
/// the increment can carry out of the kept field.
entity dround<#uint W, #uint G>(y: int<W>, mode: RMode) -> int<{W - G + 1}> {
    let b = y.as_bits();
    let kept: int<{W - G}> = b[G..W].as_int();
    let sticky = b[0..G].reduce_or();
    let neg = y.sign_bit();

    let inc = match mode {
        RMode::Down => false,
        RMode::Up   => sticky,
        RMode::Zero => sticky && neg,
        RMode::Away => sticky && !neg,
    };

    let one: uint<{W - G}> = zext(inc.as_uint());
    kept + one.as_int()
}
```

`b[G..W]` is the kept field $K$ — index 0 is the LSB, so the slice is the *upper* $W-G$ bits, and `as_int` reinterprets it as two's complement, which is the floor identity above and costs no gates. `b[0..G]` is $D$; `reduce_or` is the sticky OR tree. `kept + one.as_int()` is the incrementer: Spade's `+` widens by one bit, which is exactly the $\mathrm{sfix}(m+1,\ell_R)$ output the overflow case demands — using `+.` here to keep $w_K$ bits would silently wrap the ceiling of the largest input. Purely combinational, no clock; synthesis will merge the mode mux and the AND into the carry-chain LUTs rather than building them as the three separate blocks the diagram draws.

**Related Notes**

- [[Truncation Unit]] – depends-on: supplies the floor this unit conditionally increments, and is itself the free directed mode (toward $-\infty$) in two's complement.
- [[Round-to-Nearest Ties-Up]] – compares: identical incrementer, enable is the single round bit $d_{g-1}$ instead of the sticky OR — cheaper *and* twice as accurate.
- [[Choosing a Rounding Mode]] – compares: where a directed mode sits against every sibling once cost, bias and bound are put side by side.
- [[Faithful Operator]] – supports: $\delta<u$ holds for all four modes, so a directed rounding still meets the default accuracy specification.
- [[Error Analysis]] – supports: the one-signed bound composes linearly, which is what turns a per-site mode choice into a datapath-wide guarantee.
- [[Saturating Overflow Unit]] – supports: absorbs the carry-out of the incrementer without breaking the bound's direction.
- [[Round-to-Nearest Ties-to-Even]] – counter-example: the other expensive mode, dear for the opposite reason — it detects ties to *remove* bias rather than to impose one.
- [[Floating-Point Operators]] – counter-example: sign-magnitude significands make round-toward-zero the free mode, inverting which directed mode costs a sticky bit.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 3.

| § | Topic | Pages |
| --- | --- | --- |
| 3.1.3 | rounding to the nearest, Eq. (3.1), the tie rule | 68–69 |
| 3.1.4 | truncation versus rounding to the nearest, the 1-ulp bound | 70 |
| 3.1.5 | rounding and overflow specification in fixed-point libraries; the directed modes and their cost; `fixed_pkg`, `ap_fixed`, `ac_fixed` | 71 |

Interval-analysis motivation is the book's citation [MKC09] (Moore, Kearfott & Cloud, *Introduction to Interval Analysis*); the decomposition $Y=K2^{\ell_R}+D2^{\ell_{\mathrm{ext}}}$, the per-mode enable table and the sticky-versus-round-bit cost comparison are worked out here from the source's statements.
