---
title: "Speculative Floating-Point Adder"
description: "Lutz's 1-cycle double-precision adder: compute all four near-path differences, both far-path shifts and both rounding pre-additions while the exponents are still subtracting, then mux. Two 54-bit incrementers and seven 54-bit adders."
kind: circuit
source: "ASA §11.1.4, pp. 340-342"
status: seed
spade: simulated
tags: [digital, floating-point-operators, adder, rounding, speculation, latency]
aliases:
  - "Fully Speculative Floating-Point Adder"
  - "Speculative FP Adder"
  - "Lutz Adder"
  - "1-Cycle Floating-Point Adder"
---

# Speculative Floating-Point Adder

The [[Dual-Path Floating-Point Adder|dual-path]] adder pushed to its limit: every operand ordering, every alignment and every rounding decision is evaluated before the exponent subtraction resolves, so the only thing left behind that subtraction is a row of multiplexers.

```tikz title="Fully speculative floating-point adder: four near-path differences, two far-path shifts, two rounding pre-increments and three far-path sums, all started at t=0, resolved by a late mux row"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
% ---------------- unpack ----------------
\node[draw,minimum width=18cm,minimum height=0.8cm] at (-0.7,0)
  {unpack \& exception handling: $M_X,M_Y$ : 54, signs, effective op};
\draw[<-] (-3.0,0.4) -- ++(0,0.8) node[above]{$X_\mathrm{in}$};
\draw[<-] ( 2.0,0.4) -- ++(0,0.8) node[above]{$Y_\mathrm{in}$};
% ---------------- near path ----------------
\draw[dashed] (-9.65,-1.3) rectangle (-2.6,-2.9);
\node[font=\tiny,rotate=90] at (-9.85,-2.1) {near path};
\foreach \x/\lab in {-8.8/{$M_X{-}M_Y$}, -7.1/{$M_Y{-}M_X$}, -5.4/{$M_X{-}M_Y'$}, -3.7/{$M_Y{-}M_X'$}}
  {\node[draw,minimum width=1.5cm,minimum height=0.7cm,font=\small] at (\x,-2.05) {\lab};
   \draw[->] (\x,-0.4) -- (\x,-1.7);
   \draw[->] (\x,-2.4) -- (\x,-4.35);}
% ---------------- far path ----------------
\draw[dashed] (0.2,-1.3) rectangle (8.3,-3.95);
\node[font=\tiny,rotate=-90] at (8.5,-2.6) {far path};
\node[draw,minimum width=1.7cm,minimum height=0.7cm] at (1.6,-2.05) {$\gg\! d$ : $M_X$};
\node[draw,minimum width=1.7cm,minimum height=0.7cm] at (3.5,-2.05) {$\gg\! d$ : $M_Y$};
\node[draw,minimum width=1.5cm,minimum height=0.7cm] at (5.35,-2.05) {$+\frac{1}{2}$ulp};
\node[draw,minimum width=1.9cm,minimum height=0.7cm] at (7.2,-2.05) {$+1\,|\,{+}\frac{1}{4}$ulp};
\foreach \x in {1.6,3.5,5.35,7.2} {\draw[->] (\x,-0.4) -- (\x,-1.7);}
\node[draw,minimum width=1.9cm,minimum height=0.55cm] at (1.5,-3.4) {$+\,M_X$};
\node[draw,minimum width=2.0cm,minimum height=0.55cm] at (4.0,-3.4) {$+\,M_X^{+\frac{1}{2}}$};
\node[draw,minimum width=2.2cm,minimum height=0.55cm] at (6.8,-3.4) {$+\,M_X^{+1\,|\,+\frac{1}{4}}$};
% M_X straight to the unrounded adder
\draw[->] (0.45,-0.4) -- (0.45,-3.4) -- (0.55,-3.4);
\node[font=\tiny,anchor=south] at (0.45,-1.02) {$M_X$ : 54};
% aligned M_Ya bus
\draw (1.6,-2.4) -- (1.6,-2.75) (3.5,-2.4) -- (3.5,-2.75);
\draw (1.6,-2.75) -- (6.8,-2.75);
\node[font=\tiny,anchor=south] at (2.55,-2.73) {$M_{Y_\mathrm{a}}$ : 54};
\foreach \x in {1.5,4.0,6.8} {\draw[->] (\x,-2.75) -- (\x,-3.12);}
\draw[->] (5.35,-2.4) -- (5.35,-2.95) -- (4.6,-2.95) -- (4.6,-3.12);
\draw[->] (7.2,-2.4) -- (7.2,-3.12);
\foreach \x in {1.5,4.0,6.8} {\draw[->] (\x,-3.68) -- (\x,-4.35);}
% ---------------- the late mux row ----------------
\node[draw,minimum width=7.05cm,minimum height=0.5cm] at (-6.1,-4.6) {4:1 mux};
\node[draw,minimum width=8.1cm,minimum height=0.5cm] at (4.25,-4.6) {3:1 mux};
\node[draw,align=center,minimum width=2.15cm,minimum height=1.0cm,font=\tiny] at (-1.15,-4.6)
  {$E_X{-}E_Y$\\ swap, near$/\overline{\text{far}}$};
\draw[->] (-1.15,-0.4) -- (-1.15,-4.1);
\draw[->] (-2.23,-4.6) -- (-2.58,-4.6);
\draw[->] (-0.07,-4.6) -- (0.2,-4.6);
% ---------------- normalise, final mux, pack ----------------
\node[draw,minimum width=2.8cm,minimum height=0.6cm] at (-6.1,-5.7) {$\ll\lambda$ normalise};
\node[draw,minimum width=2.4cm,minimum height=0.6cm] at (4.25,-5.7) {1-bit norm.};
\draw[->] (-6.1,-4.85) -- node[right,font=\tiny]{54} (-6.1,-5.4);
\draw[->] (4.25,-4.85) -- node[right,font=\tiny]{54} (4.25,-5.4);
\draw[->] (-9.4,-5.7) -- node[above,font=\tiny]{$\lambda$ (LZA)} (-7.5,-5.7);
\node[draw,minimum width=3.4cm,minimum height=0.5cm] at (-1.15,-6.6) {near$/$far mux};
\draw[->] (-6.1,-6.0) -- (-6.1,-6.6) -- (-2.85,-6.6);
\draw[->] (4.25,-6.0) -- (4.25,-6.6) -- (0.55,-6.6);
\draw[->] (-1.15,-5.1) -- (-1.15,-6.35);
\node[draw,minimum width=18cm,minimum height=0.8cm] at (-0.7,-7.6) {exception handling \& pack};
\draw[->] (-1.15,-6.85) -- node[right,font=\tiny]{$w_E{+}2{+}w_F$} (-1.15,-7.2);
\draw[->] (-0.7,-8.0) -- ++(0,-0.55) node[below]{$R$};
\node[font=\tiny,align=center] at (-0.7,-9.35)
  {$M'=M\gg1$. Every block above the mux row starts at $t=0$: nothing in the datapath waits for the\\
   exponent subtraction, only the mux row does. The near path is one operation deep, the far path three.\\
   Seven 54-bit adders (four near, three far) and two 54-bit incrementers, against one of each in the baseline.};
\end{circuitikz}
\end{document}
```

**Name what the exponent subtraction is actually gating.** In every non-speculative adder the block $E_X-E_Y$ sits in front of the significand datapath, and it produces three control facts, not one: the swap decision (which operand is larger, hence which one gets shifted and whose sign the result carries), the near/far decision ($d\in\{0,1\}$ with an effective subtraction, versus $d\ge2$), and the alignment distance $d$ itself, saturated at $w_F+2$ and therefore $\lceil\log_2(w_F+2)\rceil=6$ bits wide for binary64. The [[Dual-Path Floating-Point Adder|dual path]] already removed one of the five slow blocks by running the two regimes concurrently, but both regimes still wait for those bits. Speculation removes the wait rather than the work: make the datapath independent of the control by evaluating it at every possible value of the control, and the control signal then arrives at a multiplexer select instead of at a shifter input. Widths below are Lutz's: 54 bits, the $1+w_F=53$-bit significand of binary64 plus one extra position — an overflow bit above the point in the far path, a guard position below it in the rounding blocks.

**The near path enumerates to exactly four differences.** Near means $d\in\{0,1\}$ *and* an effective subtraction, so the alignment shift is $0$ or $1$ bit and is pure wiring rather than a shifter, and the result is $|M_X-M_{Y_\mathrm{a}}|$. Two binary unknowns remain: which significand is larger, and which of $d=0$ or $d=1$ holds. Their product is four, and the four are the book's list (p. 342): $M_X-M_Y$ and $M_Y-M_X$ for $d=0$, and $M_X-(M_Y\gg1)$ and $M_Y-(M_X\gg1)$ for $d=1$. Each is a full 54-bit carry-propagate subtraction, and all four are available at $t_\mathrm{unpack}+t_\mathrm{add}$ rather than $t_\mathrm{unpack}+t_{E_X-E_Y}+t_\mathrm{add}$. Exactly one is non-negative, which is why the absolute value and the "sign change" flag of the baseline's compound adder both vanish — the 4:1 multiplexer *is* the absolute value. Sterbenz's lemma still applies here: a near-case cancellation is exact, there is no sticky bit to compute, and the only slow block left on this path is the leading-zero count, which is why speculation is paired with a [[Leading Zero Anticipator]] rather than an LZC.

**The far path pays twice for not knowing which operand to shift.** For $d\ge2$ the difference cannot fall below $\tfrac12$, so at most one bit of left normalisation is ever needed — the argument is in [[Dual-Path Floating-Point Adder]] and is not repeated here. But the alignment shifter needs both $d$ and the swap decision, and speculating on the swap means starting the barrel shift on $M_X$ *and* on $M_Y$ (p. 342). That is precisely the duplication the dual-path architecture was proud of avoiding: it built one shifter because it knew which operand to feed it. Speculation gives that back. What it does not duplicate is the barrel shifter's control — $d$ still has to arrive before the shift completes, so the far path is speculative in the operand, not in the distance, and the exponent subtraction is only overlapped with the shift rather than hidden behind it.

**Move the rounding constant to the front of the addition.** The baseline's fifth slow block is the [[Floating-Point Rounding Adder|rounding adder]], and it is last because its position is circular: round-to-nearest adds a $\tfrac12$ ulp constant at the *result's* ulp position, which depends on the normalisation shift, which depends on the sum. The book breaks the circle by enumerating it (p. 335): with respect to the significand of $X$, the rounding position is $-w_F-1$ when there is no normalisation shift (Figs. 11.1a and 11.1d), $-w_F$ when the sum overflows and is right-shifted one bit (Fig. 11.1b), and $-w_F-2$ when one bit of cancellation forces a left shift (Fig. 11.1c). In ulps of $M_X$ those constants are $\tfrac12$, $1$ and $\tfrac14$. An effective addition can only overflow, never cancel, so its two live cases are $M_X+\tfrac12$ and $M_X+1$; a far effective subtraction can only cancel by one bit, so its two are $M_X+\tfrac12$ and $M_X+\tfrac14$. Two constants either way — two blocks, and because the addend is a constant they are *incrementers*, not adders. Commutativity and associativity of integer addition then let the constant be applied before the sum instead of after it, $\big(M_X+c\big)+M_{Y_\mathrm{a}} = \big(M_X+M_{Y_\mathrm{a}}\big)+c$, so all three candidate sums — unrounded, and the two pre-rounded — can be computed in parallel and selected once the normalisation case is known.

> [!important]
> The reason the pre-increment is free is that it is applied to the operand that is *not* shifted. $M_{Y_\mathrm{a}}$ needs the barrel shifter; $M_X$ is available the instant the unpack block finishes, so the two incrementers run entirely underneath the shifter's delay and add nothing to the critical path (p. 342). Applying the same constant to $M_{Y_\mathrm{a}}$ instead would be arithmetically identical and architecturally worthless — it would serialise behind the shift. This is the whole technique in one line: speculation only pays where the speculative work fits inside somebody else's latency.

**Count the operators and read off what was bought.** Four near-path subtractions plus three far-path additions is seven 54-bit adders; the rounding pre-additions are two 54-bit incrementers; the far path holds two 54-bit barrel shifters where the dual path held one; and everything is resolved by three levels of 54-bit multiplexing (4:1, 3:1, then near/far). Against the [[Floating-Point Adder|baseline]]'s one significand adder, one rounding adder and one shifter, that is roughly an order of magnitude more significand hardware for a datapath whose depth is now one 54-bit addition. The exchange is favourable because the two costs scale differently in the significand width $w$: a carry-propagate adder is $\Theta(\log w)$ deep, while an $n{:}1$ multiplexer is $\Theta(\log n)$ deep *independently* of $w$ — widening the mux costs area and wire, not depth. Lutz reports the result as 1-cycle double-precision addition at 1 GHz (p. 342).

$$\boxed{\ \underbrace{4}_{\text{near}}+\underbrace{3}_{\text{far}}=7\ \text{54-bit adders},\quad 2\ \text{54-bit incrementers},\quad \text{depth}=1\ \text{add}+3\ \text{mux levels}\ }$$

> [!warning] No synthesis numbers exist in this chapter
> Chapter 11 gives the operator count and the "1 GHz, 1 cycle, double precision" headline and nothing else — no area, no power, no gate delay, no comparison against the dual-path adder in the same technology. Every quantitative claim about whether this trade is worth making in *your* technology needs [Lut19] itself or your own synthesis run.

**Where it breaks.**

- **Any pipeline that has stages to spare.** Five slow blocks in series is not a problem when the operator is buried in an application-specific datapath and the pipeline is deep; the baseline is then strictly better on every axis. This architecture answers exactly one requirement — single-cycle latency at a high clock — and is indefensible otherwise. See [[Choosing a Floating-Point Operator]].
- **Small $w_F$.** The gain is $\Theta(\log w)$ adder depth traded for $\Theta(1)$ mux depth. At $w_F=8$ the significand adder is a short carry chain of comparable delay to the three mux levels it would be replaced by, and speculation buys nothing while costing everything.
- **The exponent branch itself.** Speculation takes $E_X-E_Y$ off the *datapath*, not out of the *cycle*: it must still resolve before the mux row, so the period is $\max(\text{datapath},\,\text{exponent branch})+\text{mux}$. Widen the exponent (binary128, $w_E=15$) or lengthen that branch with the subnormal correction $E_X-n_X-(E_Y-n_Y)$ and the control side becomes critical on its own.
- **Subnormals.** The operator count above is for the normal path. The book points at Sohn et al. [Soh+22] for a state-of-the-art adder with full denormal support and gives no cost for adding it here, and the [[Subnormal Normalization Unit|saturated-LZC]] requirement that already forbids fusing the count with the shifter applies unchanged.
- **Switching power.** Every speculative branch toggles on every operation, including the five to six candidates that are discarded, and none of them can be operand-gated because the gating signal is the very thing being waited for. In a latency-critical FPU that is accepted; in anything energy-constrained it is the reason not to build this.
- **FPGAs.** The book stops at ASIC here, but the direction is forced by the same fast carry logic that makes the FPGA swap-by-comparison a good trade (Sect. 6.3, p. 148, cited p. 338): a hard carry chain makes the 54-bit add cheap and short, so there is little adder depth left to hide, while wide multiplexers cost general LUTs and routing — the expensive resource. On FPGA the useful point on this curve is dual path plus leading-zero anticipation, not full speculation.

**RTL.**

```spade
/// The four near-path candidate differences, all started before the exponent
/// subtraction resolves. Wrapping W-bit subtraction: exactly one candidate is
/// the non-negative one, and `sel` names it once the exponents have settled.
fn near4<#uint W>(mx: uint<W>, my: uint<W>, sel: uint<2>) -> uint<W> {
    let cand = [mx -. my, my -. mx, mx -. (my >> 1), my -. (mx >> 1)];
    cand[sel]
}

/// Far path: two rounding pre-increments of M_X, then three speculative
/// additions to the aligned M_Ya. Two guard bits below the target ulp, so
/// 1 ulp = 4, 1/2 ulp = 2, 1/4 ulp = 1. sel 3 is unreachable.
fn far3<#uint W>(mx: uint<W>, mya: uint<W>, sub: bool, sel: uint<2>) -> uint<W> {
    let hi: uint<W> = if sub { 1 } else { 4 };
    let cand = [mx +. mya, (mx +. 2) +. mya, (mx +. hi) +. mya, mx +. mya];
    cand[sel]
}

entity spec_add54(mx: uint<54>, my: uint<54>, mya: uint<54>, sub: bool,
                  nsel: uint<2>, fsel: uint<2>, near: bool) -> uint<54> {
    if near { near4::<54>(mx, my, nsel) } else { far3::<54>(mx, mya, sub, fsel) }
}
```

`cand` is the row of boxes in the diagram and the index is the mux: `nsel` carries the swap and $d\in\{0,1\}$ bits, `fsel` the normalisation case, `near` the final select — all three are the wires leaving the $E_X-E_Y$ block. Widths are held at 54 throughout by the wrapping operators `-.` and `+.`, which is what the hardware does: the near differences are taken modulo $2^{54}$ and the selected one is the non-negative representative, so no absolute-value block appears. The two incrementers are the constant addends `2` and `hi`, and the model puts two guard bits below the target ulp so that $1$, $\tfrac12$ and $\tfrac14$ ulp are the literals `4`, `2` and `1`; `sub` chooses between the effective-addition and effective-subtraction constant exactly as the book's two lists do. Everything is combinational — no clock, no register, because the point is that it all completes inside one cycle. The one thing synthesis will do differently from the drawing is the thing that destroys the design: resource sharing sees `mx + mya`, `(mx+2) + mya` and `(mx+hi) + mya` sharing an operand and will happily factor them into one adder behind a mux, restoring the serial rounding adder this architecture exists to delete. The three far-path adders need a preserve/`dont_touch` attribute or structural instantiation.

Verified against a behavioural reference for all seven select codes at $W=54$: 13 named vectors including the asymmetric $1$ against $128$ through all four near candidates and both effective operations on the far path, plus a 4000-vector random sweep over all inputs and selects, all passing. Ulp positions and the $\tfrac12$-ulp rounding constant are as defined in [[Error Accuracy]]; the 54-bit datapath and the $1+w_F$ significand come from [[Number Formats]].

**Related notes.**

- [[Dual-Path Floating-Point Adder]] – extends: this is that architecture with the operand ordering, the alignment and the rounding case all enumerated instead of decided, and with the shifter duplication it avoided put back.
- [[Carry-Select Adder]] – compares: the same trade one abstraction down — compute both carry-in cases and mux on the real carry — which is why the speculative FP adder is best read as carry-select applied to control bits instead of carry bits.
- [[Floating-Point Adder]] – compares: the five-slow-block baseline whose critical path this collapses to one addition and three mux levels.
- [[Floating-Point Rounding Adder]] – counter-example: the block deleted here, by pre-adding the rounding constant to the unshifted operand.
- [[Leading Zero Anticipator]] – supports: without it the near path's leading-zero count stays on the critical path and the speculation is wasted.
- [[Exponent Difference and Swap Unit]] – depends-on: the only block still in front of the result, now feeding mux selects rather than datapath operands.
- [[Choosing a Floating-Point Operator]] – compares: the one requirement — single-cycle latency — under which this is the right answer.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Sect. 11.1.4 "Dual-Path Architectures and Other Speculative Techniques", pp. 340–342 — the four near-path differences, the two far-path shifts, the two rounding pre-additions, the three far-path sums, and the "two 54-bit incrementers and seven 54-bit adders" total.
- Sect. 11.1.1, p. 335 and Fig. 11.1, p. 332 — the three rounding positions $-w_F-1$, $-w_F$, $-w_F-2$ with respect to the significand of $X$, which is what makes the rounding cases enumerable.
- Sect. 11.1.2, Fig. 11.5, pp. 336–338 — the baseline the operator count is measured against; Sect. 11.1.3, p. 340 — saturated LZC and the subnormal cost on the exponent datapath.
- Sect. 6.3, p. 148 (cited p. 338) — FPGA fast carry logic, the basis for the FPGA remark above.
- [Lut19] D. Lutz, "ARM Floating-Point 2019: Latency, Area, Power", *ARITH* 2019, pp. 69–76 — the 1-cycle, 1 GHz double-precision adder; cited p. 342.
- [Soh+22] Sohn et al., "Enhanced Floating-Point Adder with Full De-normal Support", *ARITH* 2022; cited p. 342.
</content>
</invoke>
