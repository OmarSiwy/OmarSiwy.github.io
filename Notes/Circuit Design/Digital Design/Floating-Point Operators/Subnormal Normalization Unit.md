---
title: Subnormal Normalization Unit
description: "Turns subnormal inputs into an internal normal format with a leading zero counter, one shifter and a 1-bit wider exponent — plus the cheaper trick of feeding the \"is normal\" bit in as the implicit bit and shifting only the result."
kind: circuit
source: "ASA §2.5.1, pp. 48-51; §11.1.3, pp. 339-340; §11.2.2, pp. 345-346; §11.3.2.2, p. 350"
status: seed
spade: simulated
tags: [digital, floating-point-operators, subnormal, normalization, lzc, ieee754]
aliases:
  - Subnormal Support
  - Subnormal Handling
  - Denormal Normalization
  - Prenormalization
  - Is-Normal Bit
---

# Subnormal Normalization Unit

A subnormal normalization unit converts an input whose exponent field is zero into the internal $M\in[1,2)$ form a significand datapath expects, and what separates it from every other normalizer is that its cheapest correct version contains no shifter at all.

```tikz title="Subnormal normalization: unpack, and the LZC + shifter the one-shift route deletes"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,
  blk/.style={draw,rounded corners=1pt,minimum height=0.55cm,inner sep=3pt,fill=black!5},
  lbl/.style={font=\scriptsize}]

% ---------------- inputs ----------------
\node[anchor=south] at (1.0,0.35) {$E$};
\node[anchor=south] at (5.6,0.35) {$F$};
\node[lbl,anchor=west] at (1.15,0.10) {$w_E=5$};
\node[lbl,anchor=west] at (5.75,0.10) {$w_F=10$};
\draw[-latex] (1.0,0.30) -- (1.0,-0.40);
\draw[-latex] (5.6,0.30) -- (5.6,-0.40);

% ---------------- unpack ----------------
\node[blk,minimum width=7.8cm] (up) at (3.3,-0.68)
  {unpack:\ \ $n=(E\neq 0)$,\quad $M=n.F$,\quad $\tilde E=E-n$};

\draw[-latex] (1.0,-0.96) -- (1.0,-2.60);
\node[lbl,anchor=east] at (0.90,-1.30) {$\tilde E$\ \ $w_E=5$};
\draw (5.6,-0.96) -- (5.6,-2.05);
\node[lbl,anchor=west] at (5.70,-1.30) {$M$\ \ $w_F{+}1=11$};

% ---------------- one-shift tap ----------------
\draw[dashed,-latex] (1.0,-1.75) -- (8.3,-1.75);
\node[circ,scale=0.55] at (1.0,-1.75) {};
\node[circ,scale=0.55] at (5.6,-1.75) {};
\node[lbl,anchor=west,align=left] at (8.4,-1.75)
  {one-shift route:\\ $(\tilde E,M)$ straight to the\\ multiplier / alignment};

% M fans to the LZC and to the shifter
\draw (5.6,-2.05) -- (4.2,-2.05);
\draw[-latex] (4.2,-2.05) -- (4.2,-2.85);
\draw[-latex] (5.6,-2.05) -- (5.6,-4.20);

% ---------------- explicit normalization box ----------------
\draw[dashed,black!55] (-0.15,-2.35) rectangle (7.3,-5.10);
\node[lbl,anchor=west,black!55,align=left] at (7.45,-3.60)
  {explicit normalization ---\\ deleted in the\\ one-shift route};

\node[blk,minimum width=1.6cm] (lzc) at (4.2,-3.12) {LZC};
\draw[-latex] (lzc.west) -- (2.55,-3.12) -- (2.55,-3.70);
\node[lbl,anchor=south] at (3.05,-3.66) {$\lambda$\ \ 4};

% lambda to the exponent subtractor and to the shifter
\draw (2.55,-3.70) -- (1.55,-3.70);
\draw[-latex] (1.55,-3.70) -- (1.55,-4.20);
\draw (2.55,-3.70) -- (4.60,-3.70);
\draw[-latex] (4.60,-3.70) -- (4.60,-4.20);

\node[blk,minimum width=1.7cm] (esub) at (1.0,-4.48) {$\tilde E-\lambda$};
\node[blk,minimum width=2.0cm] (sh) at (5.1,-4.48) {$\ll\lambda$};
\node[lbl,anchor=west] at (6.20,-4.48) {barrel};

\draw[-latex] (1.0,-4.76) -- (1.0,-5.90);
\draw[-latex] (5.1,-4.76) -- (5.1,-5.90);
\node[lbl,anchor=east] at (0.90,-5.45) {$w_E{+}1=6$};
\node[lbl,anchor=west] at (5.20,-5.45) {$w_F{+}1=11$};
\node[anchor=north] at (1.0,-5.92) {$\hat E$};
\node[anchor=north] at (5.1,-5.92) {$M'\in[1,2)$};

\end{circuitikz}
\end{document}
```

**Collapse the two encodings into one expression before building anything.** An IEEE $(w_E,w_F)$ number carries a sign $s$ on 1 bit, an exponent field $E$ on $w_E$ bits and a fraction $F$ on $w_F$ bits read as a $\mathrm{ufix}(-1,-w_F)$ number in $[0,1)$ — and the standard reads those same fields two different ways ([[Floating-Point Formats]]). For $E\in[1,2^{w_E}-2]$ the value is $(-1)^s2^{E-E_0}(1+F)$, with the implicit leading $1$ that gives every significand a unique representation. For $E=0$ the value is $(-1)^s2^{e_{\min}}(0+F)$ with $e_{\min}=1-E_0$: the same exponent as the smallest normals, but no implicit bit. Two encodings, one piece of hardware. Define the **is-normal** bit, 1 bit wide,

$$n=\begin{cases}0 & \text{if } E=0\\[2pt] 1 & \text{otherwise}\end{cases}\tag{2.17}$$

and one substitution merges the branches. In the normal case $n=1$, so by adding and subtracting one in the exponent, $E-E_0=(E-n)-E_0+1$. In the subnormal case $E=n=0$, so $(E-n)-E_0+1=1-E_0=e_{\min}$. The implicit bit is $1$ in the first case and $0$ in the second, which is $n$ in both. Therefore

$$X=(-1)^s\,2^{(E-n)-E_0+1}\,(n+F)\tag{2.18}$$

holds for normals, subnormals and zero alike. Nothing was approximated: this is the same case split, rewritten so the case variable appears as an *arithmetic operand* rather than as a control signal.

> [!note] The trick is that the case selector and the implicit bit are the same wire
> A mux-based reading of the format would compute $n$, then use it to select between two significands and two exponents. Equation (2.18) instead lets $n$ *be* the implicit bit and *be* the exponent correction. A select becomes a concatenation and a subtraction; both are cheaper than the mux they replace, and neither adds a level of logic to the significand path.

**Read (2.18) as a netlist and most of the unit disappears.** The significand $M=n+F$ is literally the $(w_F{+}1)$-bit vector $n.F$ in $\mathrm{ufix}(0,-w_F)$ — a concatenation, zero gates, in the place where the baseline datapath hardwired a leading $1$. The exponent becomes $\tilde E=E-n$, and it needs **no extra bits**: $n=1$ only when $E\ge1$, so $\tilde E\in[0,2^{w_E}-2]$ stays a $w_E$-bit unsigned number. The bit $n$ itself is the NOR of the $w_E$ exponent bits, one wide gate. That is the whole cost of *accepting* subnormal inputs — one wide NOR, one subtract-a-bit on $w_E$ bits, and a rename — which is why the book hides it entirely inside the unpack block (p. 340).

**The $-n$ is what keeps the alignment shift honest.** Feed the significands through without it and a subnormal is read as $2^{E-E_0}\cdot F=2^{-E_0}F$ where the truth is $2^{1-E_0}F$: a factor of two, one binade too small. In an adder the damage lands in the exponent difference, which must therefore be formed as $\tilde E_X-\tilde E_Y=(E_X-n_X)-(E_Y-n_Y)$ rather than $E_X-E_Y$ ([[Exponent Difference and Swap Unit]]); each subnormal operand contributes exactly one bit of correction, so the difference is off by at most one and the alignment shifter would otherwise shift the wrong operand by one position. Correcting the exponent *before* the difference is what makes the rest of the datapath oblivious to subnormals, and the rounding adder then needs no change at all, thanks to the biased-exponent encoding of Table 2.1 that makes exponent and fraction contiguous fields of one integer ([[Floating-Point Rounding Adder]], p. 340).

**Normalization proper is only needed when the consumer insists on $M\in[1,2)$.** Then, and only then, do the counter and the shifter appear. The leading zero count $\lambda=\mathrm{LZC}(M)$ runs over the $w_F{+}1$ bits of $M$ and takes values in $[0,w_F]$ for $M\neq0$, so it is $\lceil\log_2(w_F+1)\rceil$ bits wide — 4 bits for binary16 ([[Leading Zero Counters]]). A left barrel shifter on $w_F{+}1$ bits produces $M'=M\ll\lambda$, whose leading bit is now $1$ by construction ([[Normalizers]]), and the exponent absorbs the same factor: $\hat E=\tilde E-\lambda$. This is where the extra exponent bit is spent. Since $\hat E\in[-w_F,\,2^{w_E}-2]$ can now be negative, it needs a sign bit, i.e. $w_E{+}1$ bits in two's complement ([[Number Formats]]) — and one bit is always enough because $w_F\le 2^{w_E}$ for every practical format ($10\le32$ for binary16, $23\le256$ for binary32), so $-w_F$ never underflows the range. The book's "1-bit wider exponent" is therefore not the price of the is-normal trick; it is the price of the shift.

**Prenormalizing costs two slow blocks in front of an operator that had none.** The LZC and the barrel shifter both have $\log_2 w_F$-class depth — the naive LZC is $O(\log^2 w_F)$ with linear area (p. 319) — and they sit in series ahead of a significand multiplier that is itself $\log$-depth. Bolt them onto the front of the baseline multiplier and add a denormalizing shift on the output, and the latency "more than doubles" (p. 345). The one-shift alternative removes both from the critical path by exploiting the fact that **a multiplier tree does not care whether its inputs are normalized**: $P=M_XM_Y$ is correct for $M_X,M_Y\in[0,2)$ just as it is for $[1,2)$, only its range grows from $[1,4)$ to $[0,4)$. So $M=n.F$ goes straight into the multiplier while the LZC, the exponent sum $\tilde E_X+\tilde E_Y$ and the shift-distance computation all run *in parallel* with it; a single shift of $P$ before rounding then places the result correctly, whether it lands back in the normal range or in the subnormal one (pp. 345–346). The precondition is that at most one input is subnormal, which holds for multiplication because the product of two subnormals always rounds to $0$.

**In the adder the input side is free and the output side is where subnormals bite.** The post-addition normalization LZC must be **saturated**: $\hat E=\tilde E_X-\lambda$ must not go negative, because a sum that would normalize below $e_{\min}$ is not representable as a normal number and has to be delivered subnormal instead. Saturation means comparing $\lambda$ against the exponent and multiplexing — a comparator and a mux inserted *between* the counter and the shifter, which is exactly the seam that a fused LZC-and-shifter closes. Subnormal support therefore **forbids the fusion** ([[Normalizers]]). The area overhead stays limited and mostly on the exponent datapath, but it lands on the critical path (p. 340), and in a [[Dual-Path Floating-Point Adder]] it pushes the near path from 2 slow blocks to 3, making it the critical path (p. 342) — the point at which a [[Leading Zero Anticipator]] starts earning its area.

**On FPGAs the comparator is nearly free and the lost fusion is not.** The saturating comparison $\lambda\ge\tilde E_X$ maps onto the hard carry chain, the same structure that makes fast comparison cheap in the exponent datapath (Sect. 6.3, p. 148, cited p. 338), so it costs a carry chain and no LUT depth worth naming. The fusion loss is the real bill: a fused normalizer reuses each LZC level's own NOR output as that stage's shifter select, so the two structures share their control entirely; break them apart and you pay a full $\lceil\log_2(w_F+1)\rceil$-stage barrel shifter in LUTs *plus* the counter. On ASIC the same separation costs proportionally less, because the shifter's control was a smaller fraction of a datapath that already buys its muxes individually.

**Division does not get the multiplier's shortcut.** Two subnormal operands must both be handled — unlike multiplication, their quotient is not automatically zero, although for standard formats it is never subnormal — and, more decisively, the digit-recurrence dividers of Chap. 9 require the *divisor* significand $M_Y$ to be normal, where a multiplier tolerated an arbitrary leading bit. Division therefore falls back to genuine prenormalization: an LZC and one shifter on the input, into an internal format with a 1-bit larger exponent, before the baseline architecture runs (p. 350). Subnormal outputs — "tiny results" — can be predicted early from the exponent difference with an uncertainty of one bit, which lets the quotient be computed to lower precision when the result will be subnormal anyway; in Bruguera's radix-64 divider subnormal inputs add two cycles before the main computation and tiny results add one at the end (p. 350).

$$\boxed{\;\begin{aligned}
n&=[\,E\neq0\,], & M&=n.F\ \ (w_F{+}1\ \text{bits}), & \tilde E&=E-n\ \ (w_E\ \text{bits})\\[2pt]
\lambda&=\mathrm{LZC}(M), & M'&=M\ll\lambda\in[1,2), & \hat E&=\tilde E-\lambda\ \ (w_E{+}1\ \text{bits, signed})
\end{aligned}\;}$$

**When it breaks.**

- $M=0$ — true zero. $\lambda$ saturates at $w_F{+}1$, $M'$ is zero and $\hat E$ is meaningless; the value is only correct because [[Floating-Point Exception Handling]] overrides the exponent downstream. The unit does not detect zero and must not be asked to.
- Input normalization alone is not subnormal *support*. A result that normalizes below $e_{\min}$ must be shifted back down and rounded in the subnormal grid; the return trip is a second shifter, or the saturated LZC that forbids fusion.
- The "only one input can be subnormal" shortcut is multiplication-only. Addition can see two subnormal operands at once (their sum is exact and needs no alignment, which is why it is harmless), and division must manage both.
- The one-shift route needs a consumer that tolerates $M\in[0,2)$. Multiplier trees do; Chap. 9 digit-recurrence dividers do not, and neither does anything that assumes a leading $1$ for range analysis.
- Flush-to-zero makes the whole note disappear into one comparator. The chapter's own thesis is that widening the exponent field by one bit is usually cheaper than subnormal support (p. 330) — if the format is yours to choose, choose the wider exponent.
- The $w_E{+}1$-bit exponent claim assumes $w_F\le2^{w_E}$. It holds for every IEEE format and for Nfloat, but a deliberately lopsided application-specific format with a tiny exponent and a wide fraction would need $\lceil\log_2 w_F\rceil+1$ bits instead.

```spade
/// Naive leading-zero counter, MSB first: one wide NOR + one 1-bit mux per level.
fn lzc16(x: uint<16>) -> uint<4> {
    let c3 = (x >> 8) == 0;
    let u  = if c3 { x } else { x >> 8 };
    let c2 = (u >> 4) == 0;
    let v  = if c2 { u } else { u >> 4 };
    let c1 = (v >> 2) == 0;
    let w  = if c1 { v } else { v >> 2 };
    let c0 = (w >> 1) == 0;
    [c0, c1, c2, c3].as_uint()
}

/// Subnormal normalization for binary16 (w_E = 5, w_F = 10).
/// (E, F) -> (M', Ehat), with M' in [1,2) as ufix(0,-10) and Ehat = E - n - lambda.
entity subnorm_norm16(e: uint<5>, f: uint<10>) -> (uint<11>, int<6>) {
    let n = e != 0;                                     // is-normal bit, eq. (2.17)
    let m: uint<11> = n.as_uint().concat(f);            // M = n.F, no gates
    let padded: uint<16> = m.concat(0b11111u5);         // pad LOW with ones: saturates lambda at 11
    let lam = lzc16(padded);
    let m_norm: uint<11> = m << zext::<4, 11>(lam);
    let ee: int<6> = zext::<5, 6>(e).as_int()
                  -. (zext::<4, 6>(lam).as_int() +. zext::<1, 6>(n.as_uint()).as_int());
    (m_norm, ee)
}
```

`e`/`f` are the unpacked fields at the top of the diagram; `n`, `m` and the `-. n` term are the whole one-shift route, and everything from `padded` down is the dashed box. Widths follow the boxed result: `m` is $w_F{+}1=11$ bits, `lam` is 4, and `ee` is `int<6>` because $\hat E$ ranges over $[-11,30]$ once the $M=0$ case is counted in — the extra bit is the sign. The low-side padding with ones is the [[Leading Zero Counters]] saturation convention, and it is what makes $\lambda$ stop at 11 instead of running to 15 when $M=0$. The block is purely combinational; synthesis will not build the 4-level mux chain the `lzc16` source suggests but a balanced LUT/carry structure, and it will merge the `-.` chain into a single 6-bit subtractor.

- [[Leading Zero Counters]] – depends-on: supplies $\lambda$, and its saturating padding convention is what makes $M=0$ safe here.
- [[Normalizers]] – depends-on: the LZC-plus-shifter pair inside the dashed box, and the fusion that saturation forbids.
- [[Floating-Point Formats]] – depends-on: eqs. (2.17)–(2.18) and Table 2.1, on which every line above rests.
- [[Floating-Point Multiplier]] – supports: the one-shift route exists because a multiplier tree tolerates $M\in[0,2)$.
- [[Floating-Point Adder]] – supports: input handling hides in unpack, and the cost migrates to the output LZC.
- [[Floating-Point Divider]] – counter-example: digit recurrences need a normal divisor, so division must prenormalize for real.
- [[Dual-Path Floating-Point Adder]] – compares: subnormal support turns the near path into the critical path.
- [[Leading Zero Anticipator]] – extends: moves the near-path LZC off the critical path once subnormals have put it there.
- [[Floating-Point Exception Handling]] – depends-on: owns the $M=0$ case this unit deliberately mishandles.
- [[Choosing a Floating-Point Operator]] – compares: where subnormal support sits against flushing to zero and against a wider exponent.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - Sect. 2.5.1 — IEEE 754 fields, subnormals, the is-normal bit, eqs. (2.16)–(2.18), Table 2.1, pp. 48–51.
  - Chapter 11 introduction — compliance as a context-specific choice; a wider exponent as the cheaper alternative to subnormal support, p. 330.
  - Sect. 11.1.3 — subnormal handling in the adder: unpack, the $E_X-n_X-(E_Y-n_Y)$ difference, the saturated LZC and the lost LZC/shifter fusion, pp. 339–340.
  - Sect. 11.1.4 — the near path becoming critical under subnormal support, p. 342.
  - Sect. 11.2.2 — subnormals in the multiplier: naive prenormalization more than doubles latency; the one-shift route, pp. 345–346.
  - Sect. 11.3.2.2 — subnormals in the divider: both inputs, normal divisor required, tiny results, Bruguera's cycle counts, p. 350.
  - Sect. 10.2 — naive LZC delay and area, p. 319; Sect. 6.3 — fast carry-chain comparison on FPGAs, p. 148.
