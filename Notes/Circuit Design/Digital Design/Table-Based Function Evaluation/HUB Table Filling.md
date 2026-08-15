---
title: HUB Table Filling
description: "Fills every offset table in HUB format so negation is bitwise complement, then folds the surviving half-ulps into the TIV constant so the final rounding is pure truncation — zero hardware."
kind: circuit
source: "ASA §17.2.7, pp. 517-518"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, multipartite, rounding, hub]
aliases:
  - Filling the Tables Using HUB Format
  - Half-Unit-Biased Table Filling
  - HUB Table Fill
---

# HUB Table Filling

A choice of rounding mode *at ROM fill time* that costs nothing to make and removes two pieces of runtime hardware from a multipartite operator: the $+1$ of every symmetry negation, and the final rounding adder.

```tikz title="Multipartite datapath filled in HUB format: TIV and two offset tables, symmetry XOR rows negating by complement alone, one adder, and a final rounding implemented as a wire cut at l_R"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- tables ----------
\node[draw,thick,minimum width=2.9cm,minimum height=1.0cm,align=center] at (1.6,5.0)
  {TIV\\[-3pt]{\tiny $2^{\alpha}$ entries, $w_R+g$ bits}};
\node[draw,thick,minimum width=2.3cm,minimum height=1.0cm,align=center] at (5.2,5.0)
  {$\mathrm{TO}_1$\\[-3pt]{\tiny $m_1-\ell_R+g$ bits}};
\node[draw,thick,minimum width=2.3cm,minimum height=1.0cm,align=center] at (8.6,5.0)
  {$\mathrm{TO}_0$\\[-3pt]{\tiny $m_0-\ell_R+g$ bits}};
\node[font=\tiny,anchor=south] at (1.6,5.62) {filled $\lfloor 2^{g-\ell_R}\mathrm{TIV}^*+c+2^{g-1}\rfloor$, $c=\lfloor m/2\rfloor$};
\node[font=\tiny,anchor=south] at (6.9,5.62) {filled $\lfloor 2^{g-\ell_R}\mathrm{TO}^*_i\rfloor$, HUB};
% ---------- symmetry XOR rows ----------
\node[draw,thick,minimum width=2.3cm,minimum height=0.5cm] at (5.2,3.6) {$\oplus$};
\node[draw,thick,minimum width=2.3cm,minimum height=0.5cm] at (8.6,3.6) {$\oplus$};
\draw[->] (5.2,4.5) -- (5.2,3.85);
\draw[->] (8.6,4.5) -- (8.6,3.85);
\draw[->] (3.30,3.6) -- (4.00,3.6);
\draw[->] (6.70,3.6) -- (7.40,3.6);
\node[font=\tiny,anchor=south] at (3.65,3.68) {$b_1$};
\node[font=\tiny,anchor=south] at (7.05,3.68) {$b_0$};
\node[font=\tiny,anchor=west,align=left] at (9.95,3.6)
  {bitwise complement is\\[-2pt]exact negation in HUB:\\[-2pt]no $+1$ to carry in};
% ---------- adder ----------
\node[draw,thick,minimum width=9.6cm,minimum height=0.55cm] at (4.95,2.1) {$+$};
\draw[->] (1.6,4.5) -- (1.6,2.38);
\draw[->] (5.2,3.35) -- (5.2,2.38);
\draw[->] (8.6,3.35) -- (8.6,2.38);
\draw[->] (4.95,1.82) -- (4.95,1.15);
\node[font=\tiny,anchor=west] at (5.10,1.50) {$S$, format $(m_R,\ \ell_R-g)$};
% ---------- truncation ----------
\draw[thick] (2.55,0.55) rectangle (7.35,1.15);
\draw[very thick,densely dashed] (6.15,0.30) -- (6.15,1.26);
\node[font=\tiny] at (4.35,0.85) {$w_R$ bits kept};
\node[font=\tiny] at (6.75,0.85) {$g$ bits};
\node[font=\tiny,anchor=north] at (6.15,0.26) {cut at $\ell_R$};
\draw[->] (2.55,0.85) -- (1.70,0.85);
\node[font=\tiny,anchor=east] at (1.65,0.85) {$R$, $w_R$ bits};
\node[font=\tiny,anchor=north,align=center] at (4.95,-0.30)
  {the final rounding is a wire cut: the one surviving half-ulp was pre-added\\[-2pt]
   into every TIV entry at fill time, so plain truncation rounds to nearest};
\end{circuitikz}
\end{document}
```

**Choose the rounding mode that makes negation free.** The error budget of [[Multipartite Methods]] requires each of the $m+1$ tables to be filled to precision $\ell_R-g$ with error below $2^{\ell_R-g-1}$, and [[Rounding]] offers two ways to hit that: round-to-nearest, or HUB — truncate to $\ell_R-g$ and let an *implicit* $1$ sit at position $\ell_R-g-1$, so a stored $t$-bit word $v$ denotes $V=2^{\ell_R-g}\!\left(v+\tfrac12\right)$. The two bounds are identical; what separates them is what happens under negation. Applying the two's-complement identity $-x=\bar{x}+1$ in the rearranged form $\bar{v}=-v-1$,

$$2^{\ell_R-g}\!\left(\bar{v}+\tfrac12\right)=2^{\ell_R-g}\!\left(-v-1+\tfrac12\right)=-\,2^{\ell_R-g}\!\left(v+\tfrac12\right)$$

so **complementing every bit of a HUB word negates it exactly**, with no correction term. The reason is structural: the HUB grid $\{2^{\ell_R-g}(k+\tfrac12)\}$ is symmetric about the origin — it represents no zero and has no lone most-negative value — whereas the two's-complement grid is not, which is what the $+1$ has always been paying for.

**Cash that in at the symmetry XORs.** [[Symmetric Table of Offsets]] halves each $\mathrm{TO}_i$ by storing one half-segment and generating the other by negation, driven by $b_i$, the MSB of $B_i$. With round-to-nearest fill that negation is $\bar{v}+1$ with the $+1$ **conditional on $b_i$** — a data-dependent term, so it cannot be folded into any fill-time constant, and it is not free the way a carry-in to a two-operand adder is free: all $m+1$ tables land in one adder or compressor tree, which has one carry-in, not $m$. Each conditional $+1$ is therefore one extra entry in the bit heap at weight $2^{\ell_R-g}$ — roughly one extra row of the tree for $m\ge 2$. HUB deletes all $m$ of them and leaves $m_i-\ell_R+g$ XOR gates per table as the entire cost of the symmetry.

**Settle the implicit half-ulps by parity.** Nothing is free: each HUB table has silently added $2^{\ell_R-g-1}$ to the sum, and $m$ tables add $m\cdot 2^{\ell_R-g-1}$. The accounting trick is that *any even number of half-ulps is a whole number of ulps*, and a whole-ulp constant is address-independent, so it can be added into every entry of one table when the ROM is generated — the TIV, by convention — at zero hardware cost. Hence the parity split (p. 517): for $m$ even, keep HUB for the TIV too and explicate $m/2$ ulps, leaving the TIV's own implicit half in the sum; for $m$ odd, round the TIV to nearest and explicate $(m-1)/2$ ulps, leaving one of the TOs' halves in the sum. Either way **exactly one half-ulp of the guard format survives into $S$**, which is precisely what keeps $S$ itself a HUB number.

**Spend the surviving half on the final rounding.** $S$ arrives at format $(m_R,\ \ell_R-g)$ and must become $R$ at $\ell_R$, which is $w_R=m_R-\ell_R+1$ bits. Round-to-nearest means add $2^{\ell_R-1}$ and truncate, and that addition is a $w_R+g$-bit adder sitting at the end of the critical path. But $2^{\ell_R-1}$ is a *constant*, and by associativity and commutativity of addition a constant added to a sum may instead be added to any one summand — so add it to the TIV at fill time, where in units of the fill LSB $2^{\ell_R-g}$ it is the integer $2^{g-1}$. The runtime "rounding" is then nothing but the wire cut in the diagram.

> [!important] The two constants folded into the TIV do different jobs. $2^{g-1}$ is half an **output** ulp and converts truncation into round-to-nearest. The surviving implicit half is half a **guard** ulp, $2^{\ell_R-g-1}$, and its job is to keep $S$ off the tie points.

**That is where the tightened bound comes from.** Write $S+2^{\ell_R-1}=2^{\ell_R-g}(k+\tfrac12)$ and split $k=q2^{g}+r$ with $r\in[0,2^{g}-1]$; truncation returns $R=2^{\ell_R}q$, so the discarded quantity is $2^{\ell_R-g}(r+\tfrac12)$, which ranges over $[2^{\ell_R-g-1},\ 2^{\ell_R}-2^{\ell_R-g-1}]$ — never $0$ and never a full ulp, because the trailing $\tfrac12$ can never vanish. Subtracting the pre-added $2^{\ell_R-1}$ recentres this to

$$R-S\in\left[-2^{\ell_R-1}+2^{\ell_R-g-1},\ \ 2^{\ell_R-1}-2^{\ell_R-g-1}\right],\qquad |\delta_{\text{final round}}|\le 2^{\ell_R-1}\!\left(1-2^{-g}\right)$$

which is Eq. (17.31), p. 516, and it is the term the guard-bit solve in [[Multipartite Methods]] relies on. **HUB buys accuracy by abolishing ties**, not by storing more bits: the interval is strictly interior because a HUB number is never exactly halfway between two output-format numbers.

**Widths, end to end.** The TIV holds $2^{\alpha}$ entries of $w_R+g$ bits; each symmetric $\mathrm{TO}_i$ holds $2^{\gamma_i+\beta_i-1}$ entries of $m_i-\ell_R+g$ bits, sign-extended into the adder; $b_i$ is one bit; $S$ is $w_R+g$ bits; $R$ is $w_R$ bits. On an FPGA the tables are LUT or block-RAM contents and the folded constants are literally free — they change the initialisation string, not the fabric — while the XOR row costs one LUT per TO bit unless it absorbs into a spare input of the ROM's own output LUT. On an ASIC the argument is the same one level down: the constants disappear into the ROM mask and the $m$ deleted carries disappear from the compressor tree. What HUB never does on either target is shrink a table.

$$\boxed{\ \mathrm{TO}_i(C_iB_i)=\left\lfloor 2^{\,g-\ell_R}\,\mathrm{TO}^*_i(C_iB_i)\right\rfloor,\qquad \mathrm{TIV}(A)=\left\lfloor 2^{\,g-\ell_R}\,\mathrm{TIV}^*(A)+\frac{m}{2}+2^{\,g-1}\right\rfloor\ }$$

> [!warning] Two corrections to the printed fill equations, pp. 517-518
> Eqs. (17.36)-(17.38) print the scale factor as $2^{-\ell_R}$. That would put the stored integer at the output LSB $2^{\ell_R}$, and then the additive constant $2^{g-1}$ — which is $2^{\ell_R-1}$ expressed in fill units — would be $2^{g-1}$ whole *output* ulps rather than half of one. The tables are filled to $\ell_R-g$, so the factor must be $2^{g-\ell_R}$; only then are all three terms inside the floor commensurate.
> Eq. (17.37), the $m$-odd case, prints $\lfloor\cdot+\frac{m-1}{2}+2^{g-1}\rfloor$ with no $+\tfrac12$, yet the surrounding text specifies round-to-nearest for that TIV, which *is* the $+\tfrac12$. Restore it and $\frac{m-1}{2}+\frac12=\frac{m}{2}$: **(17.37) collapses onto (17.38)**. The parity split is a real distinction in *which* half-ulp survives, but it makes no difference to the number a fill script writes, which is why the box above needs only one formula.

**When it breaks.** At $g=0$ the tightened bound degenerates to $0$, correctly but vacuously — there is nothing to cut, $R=S$, and no decomposition with $m\ge1$ passes the faithfulness inequality there anyway; at the other end the gain $2^{-g}$ is already under 3% by $g=5$, so HUB's accuracy advantage is a rounding-error footnote and its *hardware* advantage is the whole point. Drop the symmetry — fill the full $\mathrm{TO}_i$ instead of a half-table, as an unsymmetric [[ATA, Addition-Table-Addition]] variant does — and the negation argument evaporates; round-to-nearest fill is then just as good, and the free final rounding still works, because pre-adding $2^{\ell_R-1}$ into the TIV never depended on HUB. The scheme also assumes the $m+1$ tables reach one adder with **no intermediate rounding**: a pipeline stage that truncates between two partial sums injects a rounding term the budget never allocated. And because all of this happens in the generator rather than the RTL, a sign error here passes synthesis, passes timing, and shows up only in the exhaustive sweep of $\delta_{\text{total}}(X)$ over all $2^{w_X}$ inputs — see [[Error Accuracy]] for why that sweep is affordable at these widths and mandatory at any width.

```spade
/// One HUB-filled table output, negated by its symmetry bit.
/// In HUB, ~v represents exactly -(v + 1/2 ulp): no +1 correction.
fn hub_signed(to: uint<6>, sym: bool) -> int<11> {
    sext((if sym { to } else { ~to }).as_int())
}

entity hub_sum(tiv: uint<11>, to0: uint<6>, sym0: bool,
                              to1: uint<6>, sym1: bool) -> uint<8> {
    let s: int<11> = tiv.as_int() +. hub_signed(to0, sym0) +. hub_signed(to1, sym1);
    s.as_uint().as_bits()[3..11].as_uint()
}
```

Concretely $w_R=8$, $g=3$, $m=2$, each TO six bits wide. `sym0`/`sym1` are the diagram's $b_i$ and `hub_signed` is one XOR row: the *only* operation applied on the negating path is `~`, which is the whole claim of this note in one token. `tiv` already carries $c+2^{g-1}$ from the generator, so nothing here adds a rounding constant. The sum uses `+.` because $S$ must wrap in $w_R+g=11$ bits rather than grow — the multipartite error analysis guarantees no overflow, so the extra bit Spade would hand you is dead. The truncation is the bit slice `[3..11]`, index 0 being the LSB: it is pure wiring, and synthesis will not emit a single gate for it, unlike the drawing where it looks like a block. Fully combinational; a real operator registers the table outputs, which is a free pipeline cut since ROMs have output registers anyway.

**Related notes.**

- [[Multipartite Methods]] – depends-on: supplies the error budget whose $\overline{\delta}_{\text{final round}}$ term this note's fill scheme is what tightens.
- [[Symmetric Table of Offsets]] – supports: HUB exists in this architecture to make that note's negation a bare complement.
- [[Rounding]] – depends-on: defines HUB format and the error bounds of truncation versus round-to-nearest.
- [[Multipartite with Compressed TIV]] – extends: compresses the same TIV that all of these constants are folded into, losslessly, so the two optimisations commute.
- [[Monotonic Multipartite Tables]] – counter-example: pre-adding a constant improves the error *bound* but does nothing about the sign flips at segment joints, which need a different fix.
- [[STAM, Symmetric Table Addition Method]] – compares: Stine and Schulte generalised the HUB fill from Das Sarma and Matula's bipartite reciprocal tables to $m$ tables here.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §17.2.7 "Filling the Tables Using HUB Format", pp. 517-518 — parity rule, free final rounding, Eqs. (17.36)-(17.38).
- Ibid., §17.2.5.3 "Computing the Number of Guard Bits", p. 516 — Eq. (17.31), the $2^{\ell_R-1}(1-2^{-g})$ bound this note derives.
- Ibid., §17.2.6, pp. 516-517 — TO$_i$ sizes with and without symmetry.
- Ibid., §3.1.6 and Table 3.2 — HUB format and its comparison against round-to-nearest.
