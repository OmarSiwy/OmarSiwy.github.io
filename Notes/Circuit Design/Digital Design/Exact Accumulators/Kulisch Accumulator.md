---
title: Kulisch Accumulator
description: "The universal sizing: 277 bits for a binary32 sum, 554 for a sum of products, plus 58 guard bits against spurious overflow — exact on data it has never seen, at ten times the area of an FP adder."
kind: circuit
source: "ASA §21.1.1–21.1.3, pp. 625–627"
status: seed
spade: simulated
tags: [digital, exact-accumulators, floating-point, fixed-point, accumulator]
aliases:
  - Kulisch accumulator
  - Universal Exact Accumulator
  - Large Accumulator
  - Exact Accumulator
---

# Kulisch Accumulator

A fixed-point accumulator whose width is derived from the *format* of the summands rather than from the data or the number of them, so that any sum or sum of products of machine numbers is accumulated with no rounding at all.

```tikz title="Kulisch sizing as a union bound: every placement a binary32 summand or product can take, drawn on one bit ruler"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % bit ruler, linear: x(b) = 1.225 + (255 - b) * 0.021254, high weight on the left
  % 255 -> 1.225   127 -> 3.946   -149 -> 9.833   -298 -> 13.0   guard: 0 .. 1.225

  % ================= accumulator bar =================
  \draw[fill=black!12] (0,4.2) rectangle (1.225,4.8);
  \draw (0,4.2) rectangle (13,4.8);
  \draw (1.225,4.2) -- (1.225,4.8);
  \draw (3.946,4.2) -- (3.946,4.8);
  \draw (9.833,4.2) -- (9.833,4.8);
  \node[anchor=east,scale=0.85] at (-0.15,4.5) {accumulator};
  \node[scale=0.6,rotate=90] at (0.61,4.5) {$58$ b};
  \node[scale=0.7] at (2.59,4.5) {$128$ b};
  \node[scale=0.7] at (6.89,4.5) {$277$ b $=$ exact sum};
  \node[scale=0.7] at (11.42,4.5) {$149$ b};

  % ---- ticks and staggered labels
  \draw (0,4.8) -- (0,5.35);
  \draw[<->,>=stealth] (0,5.35) -- (1.225,5.35);
  \node[anchor=south,scale=0.7] at (0.61,5.38) {$g$};
  \draw (1.225,4.8) -- (1.225,5.95);
  \node[anchor=west,scale=0.7] at (1.28,5.95) {$m_A = 2e_{max}{+}1 = 255$};
  \draw (3.946,4.8) -- (3.946,5.35);
  \node[anchor=west,scale=0.7] at (4.0,5.35) {$e_{max} = 127$};
  \draw (9.833,4.8) -- (9.833,5.95);
  \node[anchor=east,scale=0.7] at (9.78,5.95) {$e_{min}{-}w_F = -149$};
  \draw (13,4.8) -- (13,5.35);
  \node[anchor=east,scale=0.7] at (12.95,5.35) {$\ell_A = 2e_{min}{-}2w_F = -298$};

  % ================= sum case: every summand is a 24-bit block =================
  \node[anchor=east,scale=0.85] at (-0.15,3.0) {$\textstyle\sum X_i$};
  \draw[dashed,black!55] (3.946,4.2) -- (3.946,2.25);
  \draw[dashed,black!55] (9.833,4.2) -- (9.833,2.25);

  \draw[fill=black!40] (3.946,3.45) rectangle (4.456,3.75);
  \node[anchor=west,scale=0.7,fill=white,inner sep=1.5pt] at (4.51,3.60)
    {largest normal $X_i$: leading bit at $e_{max}$ --- none reaches higher};
  \draw[fill=black!40] (5.795,3.05) rectangle (6.305,3.35);
  \node[anchor=west,scale=0.7,fill=white,inner sep=1.5pt] at (6.36,3.20)
    {every other summand: the same $w_F{+}1 = 24$ bits, only shifted};
  \draw[fill=black!40] (7.495,2.65) rectangle (8.005,2.95);
  \draw[fill=black!40] (9.323,2.25) rectangle (9.833,2.55);
  \node[anchor=east,scale=0.7] at (9.27,2.40)
    {smallest subnormal: LSB at $e_{min}{-}w_F$, so no summand reaches lower};

  % ================= sum-of-products case: 48-bit blocks =================
  \node[anchor=east,scale=0.85] at (-0.15,1.15) {$\textstyle\sum X_iY_i$};
  \draw[dashed,black!55] (1.225,4.2) -- (1.225,0.6);
  \draw[dashed,black!55] (13,4.2) -- (13,0.6);

  \draw[fill=black!40] (1.225,1.40) rectangle (2.245,1.70);
  \node[anchor=west,scale=0.7] at (2.30,1.55)
    {largest product: $M_XM_Y \in [1,4)$ needs $2w_F{+}2 = 48$ bits, MSB at $2e_{max}{+}1$};
  \draw[fill=black!40] (6.645,1.00) rectangle (7.665,1.30);
  \node[anchor=west,scale=0.7,fill=white,inner sep=1.5pt] at (7.72,1.15) {unnormalised: $E_X{+}E_Y$ places it directly};
  \draw[fill=black!40] (11.98,0.60) rectangle (13.0,0.90);
  \node[anchor=east,scale=0.7] at (11.92,0.75) {smallest product: LSB at $2e_{min}{-}2w_F$};

  % ================= reading of the figure =================
  \node[anchor=west,scale=0.75,align=left] at (0,-0.15)
    {the accumulator is the \emph{union} of every placement a summand can take:
     $w_A = m_A - \ell_A + 1$, independent of $N$};
\end{circuitikz}
\end{document}
```

*Own construction, merging Fig. 21.3 (p. 625) and Fig. 21.4 (p. 627) onto one binary32 bit ruler, with the widths of Tables 21.1 and 21.2 (pp. 626–627).*

**Bound where a single summand can land, and the width falls out.** A normal $\text{float}(w_E,w_F)$ number is $2^{e}\cdot 1.f$ with $e\in[e_{min},e_{max}]$ and $f$ on $w_F$ bits; a subnormal is $2^{e_{min}}\cdot 0.f$ ([[Floating-Point Formats]]). The highest-weight bit any summand can own is therefore the leading $1$ of the largest normal, at position $e_{max}$; the lowest-weight bit any summand can own is the last fraction bit of a subnormal, at position $e_{min}-w_F$, which is the finest grid step the format can express at all. Every $X_i$ is thus an exact element of the fixed-point format $\text{sfix}(e_{max},\,e_{min}-w_F)$ ([[Fixed-Point Representations]]) — the conversion is a left shift of the significand and nothing else: no rounding decision, no discarded bit. Counting bit positions inclusively,

$$w_A \;=\; e_{max} - (e_{min}-w_F) + 1 \;=\; (e_{max}-e_{min}) + w_F + 1$$

| Format | $(w_E,w_F)$ | $(e_{max},\;e_{min}-w_F)$ | min. accumulator size |
| --- | --- | --- | --- |
| binary16 | $(5,10)$ | $(15,\,-24)$ | 40 |
| binary32 | $(8,23)$ | $(127,\,-149)$ | 277 |
| binary64 | $(11,52)$ | $(1023,\,-1074)$ | 2098 |

*Table 21.1, p. 626.*

> [!important] This is a union bound over placements, not an error bound over a sequence
> The diagram is the entire argument. A summand contributes a window of $w_F+1$ significand bits; the exponent only decides *where* that window sits; the accumulator is the union of every window the format admits. Nothing about $N$ can enter, because no arrival — however many, in whatever order — can create a bit outside the union. Every other accumulator sizing rule in the literature is an error bound that degrades with $N$; this one is a containment argument that does not.

**Products double the ruler, and the $+1$ is not a rounding margin.** From $XY = 2^{E_X+E_Y}\cdot M_XM_Y$ (eq. 21.1, p. 626) the exponents add and the significands multiply. Since $M_X,M_Y\in[1,2)$, their product lies in $[1,4)$ and may carry one bit *past* the leading position — hence the MSB is $2e_{max}+\mathbf{1}$, not $2e_{max}$. Each significand's LSB has weight $2^{-w_F}$ relative to its own exponent, so by adding exponents the exact product's LSB has weight $2^{2e_{min}-2w_F}$. The same inclusive count gives

$$w_A \;=\; (2e_{max}+1) - (2e_{min}-2w_F) + 1 \;=\; 2(e_{max}-e_{min}) + 2w_F + 2$$

| Format | $(w_E,w_F)$ | $(2e_{max}+1,\;2e_{min}-2w_F)$ | min. accumulator size |
| --- | --- | --- | --- |
| binary16 | $(5,10)$ | $(31,\,-48)$ | 80 |
| binary32 | $(8,23)$ | $(255,\,-298)$ | 554 |
| binary64 | $(11,52)$ | $(2047,\,-2148)$ | 4196 |

*Table 21.2, p. 627.* Exactly twice the sum-only width, as the formula says. The product needs no normalisation before it is shifted: $E_X+E_Y$ is precisely the exponent belonging to the *unnormalised* $M_XM_Y$, so it can drive the alignment shifter directly ([[Exact Unnormalized Multiplier]], [[Sign-Padding Alignment Shifter]]).

**Almost every one of those bits is dynamic range, not precision.** Because $e_{max}-e_{min}\approx 2^{w_E}$, the width grows *exponentially* in the exponent field and only *linearly* in the significand field. Of the 554 bits of a binary32 sum-of-products accumulator, at most 48 ever hold the bits of any one product; the other 506 exist so that two products $2^{500}$ apart in magnitude can still share a register. That ratio is what makes the universal sizing so expensive and what [[Application-Specific Exact Accumulator]] attacks — it is the exponent range, not the accuracy, that is being paid for.

**Guard the top, because an intermediate overflow is not the same event as a final one.** The LSB is not negotiable: no mechanism in the datapath can create a bit below $2^{2e_{min}-2w_F}$, and subnormals are included for free since in this fixed-point view a subnormal is just a number whose leading bits happen to be zero. The MSB is more open. No single product exceeds $2^{2e_{max}+1}$, but a *sum* of them can. A final result above $2^{e_{max}}$ is legitimately converted to an infinity, so that case needs no extra register; the problem is the *spurious* overflow — an intermediate partial sum leaves range and is then cancelled back into range by later summands of opposite sign, which in a plain wrapping register silently corrupts the result. Kulisch's answer is $g$ guard bits above $m_A$, sized by the worst case a machine can physically reach — a 5 GHz processor accumulating one product per cycle:

$$g \;=\; \left\lceil \log_2\!\left(365\times24\times60\times60\times5\cdot10^{9}\right)\right\rceil \;=\; 58$$

That nearly doubles a binary16 exact accumulator ($80\to138$) and is noise on a binary64 one ($4196\to4254$). The guard field is also where the sign lives: the register is read as two's complement ([[Two's-Complement Exact Accumulator]]), and sign extension needs exactly the headroom the guard bits already provide.

> [!warning] The book's guard-bit arithmetic and its stated assumption disagree
> p. 627 motivates $g$ with "one product per cycle for 10 years", but the expression it then evaluates, $365\times24\times60\times60\times5\cdot10^{9}\approx1.58\cdot10^{17}$, is **one** year of 5 GHz cycles; $\lceil\log_2\rceil$ of it is indeed 58. Ten years is $1.58\cdot10^{18}$ and needs $\lceil\log_2\rceil = 61$ bits. Take 58 as the one-year number and add $\lceil\log_2(\text{years})\rceil$ if your uptime claim is longer — the cost of being wrong here is a silent wrong answer, and three bits on a 554-bit register is free.

**One iteration is a plain integer add, and there is no loop control to speak of.** With $\ell_A$ the accumulator LSB, put $a_i = X_i\cdot 2^{-\ell_A}$; exactness of the embedding means every $a_i\in\mathbb{Z}$, and the recurrence the hardware runs is

$$A_k \;=\; A_{k-1} + a_k \pmod{2^{w_A}},\qquad A_0 = 0$$

taken over $w_A$-bit two's complement, i.e. in the ring $\mathbb{Z}/2^{w_A}\mathbb{Z}$. Reduction mod $2^{w_A}$ is a ring homomorphism, so while the true sum stays inside the representable interval — which is what $m_A$ and $g$ are chosen to guarantee — the register content equals $\sum_i a_i$ computed in $\mathbb{Z}$, where addition is associative and commutative. That is the reproducibility property: the answer does not depend on arrival order, and intermediate wraparound is harmless rather than merely unlikely.

The iteration count is $N$, one summand per cycle, and it is set by *the data* — unlike SRT division or CORDIC, where the count is fixed by the target precision. Accuracy therefore does not improve with more iterations and does not degrade with them either. Loop control costs one `reset` line to start a summation and one enable; there is no counter, no convergence test, no per-iteration constant table, because the width already covers every case the format can produce. The only cost inside the loop that scales with $w_A$ is the carry propagation across $w_A$ bits — one clock period must cover 554 of them, which is precisely why the chunked [[High-Radix Carry-Save Accumulator]] exists.

**On FPGA the register is the cheap part; on both targets the shifter is not.** Each FPGA logic cell provides a flip-flop directly behind the adder bit it computes, so the accumulator register occupies flops that would otherwise sit idle, the addition rides the dedicated carry chain, and the feedback is local routing inside one column — a 64-bit accumulator built this way exceeds 200 MHz (p. 635). What is expensive, on FPGA and ASIC alike, is the $w_A$-bit alignment shifter and the conversion back to floating point: together with the fixed-point adder they are comparable to a floating-point adder with a $w_A$-bit fraction, which makes a *universal* binary32 exact accumulator about **ten times** the size of a binary32 floating-point adder (p. 638). The register is not the bill; the shifting is.

$$\boxed{\ w_A^{\text{sum}} = (e_{max}-e_{min})+w_F+1,\qquad w_A^{\text{prod}} = 2(e_{max}-e_{min})+2w_F+2,\qquad w_A^{\text{Kulisch}} = w_A^{\text{prod}} + g\ }$$

**When it breaks.**

- **Exact is not accurate.** The fallacy box on p. 628: an exact accumulation is no more accurate than the data thrown into it. If some $X_i$ was itself the rounded output of an earlier operation, the "exact sum" holds no meaningful bits below *that* summand's discarded LSB. What is guaranteed is that the summation process contributes nothing to the error budget ([[Error Accuracy]]) — one term in the budget, not the budget.
- **The universal sizing is almost always over-provisioned.** 554 bits cover an exponent range no application uses; profiling or physics usually collapses it by an order of magnitude ([[Application-Specific Exact Accumulator]]). Reserve the full width for a general-purpose unit that must be exact on data it has never seen, or where the register is amortised over an entire coprocessor.
- **The guard-bit argument is wall-clock, not a theorem.** $g=58$ assumes a stated clock and uptime. A faster machine, a longer run, or a stream that is adversarially rather than randomly signed can still exhaust the guard field, so overflow past $m_A+g$ must still be detected and reported ([[Accumulator Exception FSM]]).
- **binary64 is where it stops being an engineering trade.** 4196 bits before guards; the shifter that feeds it spans the same range.
- **Reading the value out is a separate, non-trivial operator.** The register carries no exponent, so extraction needs a leading-sign count and a normaliser ([[Accumulator-to-Float Converter]]); when the accumulator is wider than the output's exponent range — exactly the sum-of-products case — it must be split into overflow, normal and sticky zones first ([[Three-Zone Accumulator Converter]]).
- **The exactness argument covers $+$ and $\times$ only.** Division, square root and products of three or more floats have no bounded exact fixed-point image, so nothing here extends to them.

**RTL (Spade).** One iteration of the recurrence — embed one summand exactly, add it in — parameterised so the toy format below and a real binary32 accumulator are the same entity:

```spade
/// One iteration of the Kulisch recurrence: embed one float(WE,WF) summand
/// into sfix(m_A, l_A) exactly, then add it into the accumulator.
entity kulisch_step<#uint WE, #uint WF, #uint WA>(
    clk: clock,
    rst: bool,
    s: bool,
    e: uint<WE>,
    f: uint<WF>,
) -> int<WA> {
    // isNormal: one wide OR over the exponent field
    let n: uint<1> = [e != 0].as_uint();
    // M = n.f on WF+1 bits, exact: no rounding, no normalisation
    let m: uint<{WF + 1}> = n.concat(f);
    // left-shift distance E - n places M on the accumulator's grid
    let sh: uint<WA> = zext(e - zext::<1, WE>(n));
    let mag: uint<WA> = zext::<{WF + 1}, WA>(m) << sh;
    let xfix: int<WA> = if s { -(mag.as_int()) } else { mag.as_int() };
    reg(clk) a: int<WA> reset(rst: 0) = trunc(a + xfix);
    a
}
```

`mag` is the shifter output — the $X_{\text{fix}}$ wire of the datapath — and `a` is the accumulator bar of the diagram; the entity contains exactly one register, everything else being combinational. The shift distance needs no bias subtraction: with $\ell_A = e_{min}-w_F$ the stored exponent field minus the `isNormal` bit *is* the left-shift distance, the same saving the exact multiplier gets from its doubly-biased exponent. `trunc(a + xfix)` discards the carry-out of the $w_A$-bit add, which is the $\bmod\ 2^{w_A}$ wraparound argued above and is harmless while the true sum stays in range. Synthesis will not build `<< sh` as the single box the drawing shows: it becomes a $\lceil\log_2 w_A\rceil$-stage mux network, and at $w_A=554$ that network, not the register, dominates the area.

Instantiated at $\text{float}(4,3)$ — $e_{max}=7$, $e_{min}=-6$, so $w_A = 13+3+1 = 17$ magnitude bits plus $g=3$ guard bits — and simulated against a behavioural reference over 3009 vectors, including $2^{7}\cdot1.111_2$ and the smallest subnormal $2^{-9}$ accumulated together (13 binades apart, both kept exactly) and the same multiset applied in two different orders for the same final register value.

**Related notes.**

- [[Application-Specific Exact Accumulator]] – compares: identical recurrence, with $m_A$, $\ell_A$ and $m_X$ cut to profiled data instead of to the format.
- [[Exact Sum-of-Products Operator]] – extends: the 554-bit sizing wired into a complete $\sum X_iY_i$ operator.
- [[Exact Unnormalized Multiplier]] – depends-on: supplies the unnormalised, unrounded product this width was derived for.
- [[Sign-Padding Alignment Shifter]] – supports: the block that actually spends the $w_A$ bits, and the one to shrink first.
- [[Two's-Complement Exact Accumulator]] – depends-on: the register encoding that makes wraparound harmless and keeps one carry propagation in the loop.
- [[High-Radix Carry-Save Accumulator]] – extends: breaks the $w_A$-bit carry propagation so the width stops setting the clock period.
- [[Accumulator-to-Float Converter]] – extends: the single $0.5$ ulp rounding in the whole datapath, at the very end.
- [[Floating-Point Accumulator Loop]] – counter-example: the FP adder in the loop, whose error grows as $(N-1)u\sum_i|X_i|$ and whose result depends on arrival order.
- [[Choosing an Accumulator]] – compares: where the universal sizing wins against every sibling.
- [[Floating-Point Operators]] – compares: the rounding-every-step arithmetic this register is built to avoid.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21, "Floating-Point Accumulation and Sum of Products".

- §21.1.1 Exact floating-point sum; Fig. 21.3; Table 21.1: pp. 625–626
- §21.1.2 Exact floating-point sum of products; eq. (21.1); Fig. 21.4; Table 21.2: pp. 626–627
- §21.1.3 Kulisch's universal exact accumulator; spurious overflow and the 58 guard bits: p. 627
- Fallacy box, "Application-Level Accuracy Using Exact Accumulators"; associativity of the exact sum: p. 628
- FPGA accumulator frequency (200 MHz at 64 bits): p. 635
- §21.3 Cost, speed and accuracy; the $10\times$ area figure: p. 638
