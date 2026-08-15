---
title: Sticky Bit Generator
description: "The OR of everything shifted past the round bit — either a full shifter plus a wide OR tree, or generation folded into the shifter itself. Mandatory for directed rounding, and the bulk of an adder's IEEE 754 compliance cost."
kind: circuit
source: "ASA §11.1.3, pp. 339-340; §10.1.5, pp. 315-316"
status: seed
spade: simulated
tags: [digital, floating-point-operators, rounding, shifter, ieee754, fpga]
aliases:
  - Sticky Bit
  - Sticky Bit Generation
  - Sticky Flag
---

# Sticky Bit Generator

The one-bit summary of everything the alignment shifter threw away — the only piece of an infinitely wide exact sum that rounding still needs, and the only block in an IEEE 754 adder whose cost is set by the bits the datapath does *not* keep.

```tikz title="Two ways to build a sticky bit generator: an exact full shifter followed by a wide OR, versus a barrel shifter with the OR folded into each stage in reverse order"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
% ---------- (a) exact full shifter + wide OR ----------
\node[font=\footnotesize\itshape] at (0,2.5) {(a) exact full shifter $+$ wide OR};
\node[draw,minimum width=5.0cm,minimum height=0.65cm] (fs) at (0,0.6)
  {exact right shifter, $S_{\max}=w_F{+}3$};
\draw[->] (-1.3,1.5) node[above,font=\footnotesize]{$M_Y$ : $w_F{+}1$} -- (-1.3,0.93);
\draw[->] (2.9,1.5) node[above,font=\footnotesize]{$d$} -- (2.9,0.6) -- (2.55,0.6);
\node[draw,minimum width=2.7cm,minimum height=0.5cm] (keep) at (-1.15,-0.65) {kept field};
\node[draw,fill=black!10,minimum width=2.1cm,minimum height=0.5cm] (tail) at (1.35,-0.65) {discarded tail};
\draw[->] (-1.15,0.27) -- (-1.15,-0.40);
\draw[->] (1.35,0.27) -- (1.35,-0.40);
\node[font=\tiny] at (-1.15,-1.15) {$w_F{+}3$};
\node[font=\tiny] at (1.35,-1.15) {$w_F{+}1$};
\node[draw,minimum width=1.8cm,minimum height=0.5cm] (wor) at (1.35,-2.0) {wide OR};
\draw[->] (1.35,-0.90) -- (1.35,-1.75);
\draw[->] (1.35,-2.25) -- (1.35,-2.85) node[below,font=\footnotesize]{sticky};
\draw[->] (-1.15,-0.90) -- (-1.15,-2.85) node[below,font=\footnotesize]{$M_{Y_\mathrm{a}}$ : $w_F{+}3$};
\node[font=\tiny,align=center] at (0,-3.6) {shifter datapath is $2w_F{+}4$ bits wide};

% ---------- (b) barrel shifter with folded sticky ----------
\begin{scope}[xshift=9.2cm,yshift=1.1cm]
\node[font=\footnotesize\itshape] at (1.1,1.4) {(b) sticky folded into the barrel shifter, largest stage first};
\draw[->] (0,0.45) node[above,font=\footnotesize]{$M_Y$ : $w_F{+}3$} -- (0,-0.22);
\foreach \k/\d/\y in {3/8/-0.5, 2/4/-1.75, 1/2/-3.0, 0/1/-4.25} {
  \node[draw,minimum width=2.8cm,minimum height=0.55cm] (m\k) at (0,\y) {$\gg\d$ \ or \ pass};
  \node[draw,fill=black!10,minimum width=1.7cm,minimum height=0.45cm] (o\k) at (3.1,\y) {OR of low $\d$};
  \draw[->] (-2.35,\y) node[left,font=\footnotesize]{$s_\k$} -- (-1.4,\y);
  \draw (0,\y+0.42) -- (3.1,\y+0.42) -- (3.1,\y+0.225);
  \fill (0,\y+0.42) circle (1.2pt);
  \draw (o\k.east) -- (4.6,\y);
  \fill (4.6,\y) circle (1.2pt);
}
\foreach \ya/\yb in {-0.775/-1.475, -2.025/-2.725, -3.275/-3.975} { \draw[->] (0,\ya) -- (0,\yb); }
\draw[->] (0,-4.53) -- (0,-5.15) node[below,font=\footnotesize]{$M_{Y_\mathrm{a}}$ : $w_F{+}3$};
\draw[->] (4.6,-0.5) -- (4.6,-5.15) node[below,font=\footnotesize]{sticky};
\node[font=\tiny,align=center] at (1.4,-5.85)
  {every stage is $w_F{+}3$ bits; the widest OR is driven by the shifter input};
\end{scope}
\end{circuitikz}
\end{document}
```

*Panel (b) after Fig. 10.7, p. 317, whose four stages and distances $8,4,2,1$ are the binary16 instance; widths are given in general $w_F$ form. Panel (a) is the baseline it replaces (Fig. 10.5, p. 314).*

**Pin down what the bit must equal before choosing hardware for it.** In the alignment step of a [[Floating-Point Adder]] the smaller significand $M_Y$ — $w_F+1$ bits, one implicit leading bit plus the fraction — is shifted right by the exponent difference $d=E_X-E_Y$, carried on $\lceil\log_2(w_F+2)\rceil$ bits and saturated at $w_F+2$. The significand datapath keeps positions $0$ down to $-(w_F+2)$, that is $w_F+3$ bits, so everything strictly below $-(w_F+2)$ leaves the datapath. The sticky is the OR of exactly that set:

$$\mathrm{sticky}\;=\;\bigvee_{j\,<\,-(w_F+2)}\big(M_Y\,2^{-d}\big)_j$$

It is one bit for a tail that is at most $w_F+1$ bits wide, because $d\le w_F+2$ and $M_Y$ has $w_F+1$ bits. Nothing else about the tail is ever consulted.

**One bit suffices because rounding only needs a three-way discrimination.** Write the exact sum as $N = F \,+\, r\cdot 2^{-w_F-1} \,+\, \tau$, where $F$ is the retained $w_F$-bit fraction, $r$ is the round bit at position $-(w_F+1)$ and $\tau\ge 0$ is everything below it. A round-to-nearest decision needs to know whether $N$ lies below, at, or above the midpoint of its two neighbours, and by the trichotomy of the reals that is decided by $(r,\;\tau>0)$ alone: $r=0$ means below, $r=1\wedge\tau=0$ means exactly at, $r=1\wedge\tau>0$ means above. Since $\tau>0$ iff some bit of the tail is $1$, the predicate $\tau>0$ *is* the OR of the tail. Compressing $w_F+1$ bits to one loses nothing that any rounding mode of [[Rounding]] can observe.

> [!important] Ties-to-even is a free rider on hardware the directed modes already force you to build
> The sticky is *mandatory* for round-toward-$+\infty$ and its siblings: $N=1.101\,0001$ must round up to $1.110$, while $N=1.101\,0000$ rounds up to $1.101$ — the two differ only in $\tau$, so a directed-mode operator that does not compute the sticky is simply wrong. Once that hardware exists, ties-to-even costs a handful of extra gates in the [[Floating-Point Rounding Adder]] and nothing else, which is precisely why IEEE 754 chose it (p. 336). Run the implication backwards and you get the application-specific escape hatch: an operator with no directed modes can use *ties to away*, a lone $1$ injected at position $-w_F-1$ with no tail inspection at all, and drop this whole note's circuit (p. 335).

**Option (a) buys the sticky by making the shifter exact.** Feed $M_Y$ ($w_F+1$ bits) into a right shifter that discards nothing: with $S_{\max}=w_F+3$ its output is $w_X+S_{\max}=2w_F+4$ bits. Slice off the top $w_F+3$ as $M_{Y_\mathrm{a}}$ and reduce the remaining $w_F+1$ through an OR tree of depth $\lceil\log_2(w_F+1)\rceil$. This is honest and obviously correct, and it is also the expensive answer: the shifter's own datapath has roughly doubled, and the OR tree sits *after* the last shift stage, so its depth adds to the alignment delay rather than hiding inside it.

**Option (b) exploits the fact that OR over a disjoint partition can be taken piecewise.** A barrel shifter of $n=\lceil\log_2(w_F+2)\rceil$ stages realises $\gg d$ as a product of stages, stage $k$ shifting by $2^k$ when the control bit $s_k$ (bit $k$ of $d$) is set. Let $X^{(n)}=M_Y$ zero-padded to $w_R=w_F+3$ bits and

$$X^{(k)} \;=\; \begin{cases} X^{(k+1)}\gg 2^k, & s_k=1\\ X^{(k+1)}, & s_k=0\end{cases}\qquad\qquad t_k \;=\; s_k \wedge \bigvee_{i=0}^{2^k-1} X^{(k+1)}_i$$

Each stage discards exactly the low $2^k$ bits of its own input, and those sets are pairwise disjoint — a bit leaves the datapath at exactly one stage — while their union is the whole tail. By associativity and commutativity of $\vee$ the total OR may be regrouped along any partition, and by idempotence the regrouping would survive even an overlapping one, so $\mathrm{sticky}=\bigvee_k t_k$ is *exact*, not an approximation. Every stage stays $w_F+3$ bits wide, so the shifter is a plain [[Barrel Shifters|barrel shifter]] and the doubled datapath of option (a) is gone; what is added is $n$ small OR reductions of $1,2,4,\dots$ bits plus an $n$-input OR to combine them.

**Reversing the stage order moves the wide OR off the critical path.** The conventional barrel shifter orders stages smallest-first, so the $2^{n-1}$-bit OR — by far the deepest of them — is driven by the *last* stage's input and its $\lceil\log_2 2^{n-1}\rceil=n-1$ levels of gates land entirely after the shift completes. Order the stages largest-first instead, exactly as drawn, and that same widest OR is driven by the shifter's primary input: it starts at $t=0$ and runs concurrently with the remaining $n-1$ shift stages, while the ORs that do start late are the narrow ones. The arithmetic is unchanged — the stages commute, since $\gg 2^a$ then $\gg 2^b$ is $\gg(2^a+2^b)$ either way — so this is pure scheduling. Measured on a binary32 adder, reverse-order incremental sticky against an exact full shifter plus wide OR: **20% less area and 5% less delay**, the area coming from replacing a $w_X=w_F+1$, $S_{\max}=w_F+3$ exact shifter with a $w_R=w_F+3$ barrel shifter, the delay from the earlier sticky (p. 316). Comparable savings are reported for posit addition [UFD19].

**The sticky is not finished when the shifter is.** The alignment sticky is a first value that must be *updated* after normalization: in the far case of Fig. 11.1b the sum overflows and needs a one-bit **right** normalization shift, which pushes one further bit below the round position. Sticky' $=$ sticky $\vee$ (the bit that just fell off) — one OR gate, but it is on the path between the normalizer and the rounding adder. Only then is the tie test "round bit $=1$ and sticky $=0$", and the fix is to force the retained LSB even (p. 339).

**On FPGA the wide OR is not an OR tree.** A reduction over many bits maps onto the fast carry chain rather than onto generic LUT logic, and vendor synthesis performs that substitution unasked (p. 315) — see [[FPGAs]]. That flattens the delay difference between options (a) and (b) somewhat, but not the area difference, which comes from the shifter datapath width and is technology-independent.

> [!warning] The 20% / 5% figures are a whole-shifter measurement, not a sticky-generator cost
> They compare two complete alignment shifters inside a binary32 adder (§10.1.5, p. 316). Chapter 11 reports no synthesis results at all — no LUT, slice or gate count for the OR tree in isolation, no delay for the post-normalization sticky update. Quantifying the sticky generator on its own needs outside research or your own synthesis run.

> [!warning] The saturated case is only analysed for round to nearest
> When $d>w_F+1$ the book concludes the sum "is by definition equal to the input of largest magnitude" (Fig. 11.2, p. 333) and the alignment shifter saturates. Under round to nearest that is correct. Under a directed mode a nonzero $Y$ must still be able to nudge the result by one ulp, which requires the saturation logic to keep OR-ing the whole of $M_Y$ into the sticky rather than discarding it with the shift. The text does not state this; it follows from the definition of the directed modes, and is worth checking against a reference implementation before trusting it.

$$\boxed{\ \mathrm{sticky}\;=\;\bigvee_{j\,<\,-(w_F+2)}\big(M_Y2^{-d}\big)_j\;=\;\bigvee_{k=0}^{n-1}\Big(s_k\wedge\bigvee_{i=0}^{2^k-1}X^{(k+1)}_i\Big),\qquad n=\lceil\log_2(w_F+2)\rceil\ }$$

**When it breaks.**

- **Ties-away or faithful operators.** Both discard the tail unread, so the generator has no consumer. If the operator is buried in an application-specific datapath and exposes no directed modes, deleting this block is the single largest saving available on the compliance bill.
- **The near path.** With $d\in\{0,1\}$ nothing is shifted out, so the sticky is identically zero. A [[Dual-Path Floating-Point Adder]] therefore builds the generator on the far path only, and the near path's rounding logic ties its sticky input to $0$.
- **Small $w_F$.** The OR tree is $\lceil\log_2(w_F+1)\rceil$ deep and the exact shifter's excess width is $w_F+1$ bits; at $w_F=3$ the two options differ by a couple of gates and the folding is not worth the irregular structure. The 20%/5% gap is a $w_F=23$ number.
- **Multiplication.** There is no alignment shifter to fold into: the exact $(2w_F+2)$-bit product already exists, and its low half is OR-ed in parallel with the significand adder, off the critical path (p. 345). The dominant trick there is [[Injection Rounding]], not this one.
- **Confusing the sticky with the round bit.** The sticky excludes position $-(w_F+1)$. OR the round bit into it and every exact tie is reported as "above the midpoint", so ties-to-even degrades silently into ties-away.
- **Forgetting the post-normalization update.** Omit it and Fig. 11.1b's overflow case rounds on a stale sticky — a rare, input-dependent, half-ulp error that no symmetric test vector will find.

**RTL.**

```spade
/// One stage of a right barrel shifter with the sticky folded in.
/// D = 2^k is this stage's shift distance and s the matching bit of the
/// shift amount; the bits about to be discarded are OR-ed out first.
fn sticky_stage<#uint W, #uint D>(x: uint<W>, s: bool) -> (uint<W>, bool) {
    let lost = x.as_bits()[0..D].reduce_or();
    let d: uint<W> = D;
    (if s { x >> d } else { x }, s && lost)
}

/// Fig. 10.7: a 12-bit right barrel shifter whose stages run in reverse
/// (largest-first) order, with early sticky bit computation.
fn shift_sticky12(x: uint<12>, s: uint<4>) -> (uint<12>, bool) {
    let b = s.as_bits();
    let (x3, t3) = sticky_stage::<12, 8>(x,  b[3]);
    let (x2, t2) = sticky_stage::<12, 4>(x3, b[2]);
    let (x1, t1) = sticky_stage::<12, 2>(x2, b[1]);
    let (x0, t0) = sticky_stage::<12, 1>(x1, b[0]);
    (x0, t3 || t2 || t1 || t0)
}
```

`sticky_stage` is one row of panel (b): `x` is the bus entering from above, `lost` is the grey OR box tapping that same bus, and the tuple's two elements are the two arrows leaving — the shifted bus downward and $t_k$ rightward. The width never changes, `uint<W>` in and `uint<W>` out, which is the whole point of option (b); `x.as_bits()[0..D]` is a compile-time constant slice, so each stage's OR is a fixed-width reduction, and `s && lost` is the $s_k\wedge(\cdot)$ of the recurrence — a stage that does not shift contributes nothing. `shift_sticky12` writes the stages in the order $8,4,2,1$, which is the reversal that matters; writing them $1,2,4,8$ computes the identical function and only changes where the delay lands. All combinational: no clock, no register, and the whole thing is one alignment stage of an adder, not a pipeline. Synthesis will not preserve the drawing — on an FPGA the four `reduce_or` reductions become carry-chain logic rather than gate trees, and the four muxes and the ORs merge into shared LUTs.

Simulated against the behavioural reference "$r = x\gg s$, and $\mathrm{sticky}=1$ exactly when one of the low $s$ bits of $x$ is set": 9 named vectors plus a 4000-vector random sweep over all $(x,s)$, 4009 passing. The named set includes the asymmetric pair `x=000000000001, s=1` (sticky $=1$, result $0$) against `x=100000000000, s=1` (sticky $=0$, result $2^{10}$), which is exactly the vector a reversed bit order would fail, and the saturating case $s\ge 12$.

**Related notes.**

- [[Floating-Point Rounding Adder]] – supports: the only consumer of this bit; the tie fix it enables is a handful of gates there, against a whole shifter here.
- [[Floating-Point Adder]] – depends-on: this block is what upgrades the baseline's ties-away to IEEE 754 ties-to-even, and the bulk of that upgrade's cost.
- [[Barrel Shifters]] – extends: option (b) is a barrel shifter with a per-stage OR bolted on and the stage order reversed.
- [[Shifters]] – depends-on: the exact-versus-barrel choice, and the reverse-order argument, are shifter-level results imported here.
- [[Dual-Path Floating-Point Adder]] – counter-example: the near path shifts nothing out, so half the architecture needs no sticky generator at all.
- [[Injection Rounding]] – compares: the other route to cheap correct rounding, adding a constant instead of inspecting a tail; the natural choice on multiply, useless on add.
- [[Rounding]] – depends-on: which modes need the tail's zero/nonzero status, and which can ignore it.
- [[Choosing a Floating-Point Operator]] – compares: whether IEEE compliance, and therefore this block, should be bought at all.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §11.1.1, "Origin of the ties to even rule" box and Fig. 11.2, pp. 333, 335–336 — the directed-rounding argument, the saturated exponent-difference case, and the ties-away alternative.
  - §11.1.3 From Baseline Adder to IEEE 754 Compliance, p. 339 — the two implementation options, the post-normalization sticky update, tie detection, and "the bulk of the overhead is in the sticky computation".
  - §11.1.4 Dual-Path Architectures, p. 342 — "no sticky computation is needed on the near path".
  - §10.1.5 and Figs. 10.5–10.7, pp. 314–317 — incremental sticky in a barrel shifter, the reverse stage ordering, the FPGA wide-OR remark, and the measured 20% area / 5% delay result for binary32; `flopoco Shifter wX=12 maxShift=12 wR=12 dir=1 computeSticky=1`.
  - §11.2.2, p. 345 — the multiplier's sticky as an OR tree off the critical path.
- [UFD19] posit addition, cited p. 316 for comparable savings from the same technique.
