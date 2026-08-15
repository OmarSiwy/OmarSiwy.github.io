---
title: "Application-Specific Exact Accumulator"
description: "Three parameters (m_A, l_A, m_X) from physics and profiling collapse 177 bits to 63 — at the price of an overflow comparator and a truncating or rounding shifter that the exact version never needs."
kind: circuit
source: "ASA §21.1.4, §21.2.2.3, §21.3, pp. 628-639"
status: seed
spade: simulated
tags: [digital, exact-accumulators, accumulator, floating-point, fixed-point, fpga]
aliases:
  - Application-Specific Accumulator
  - Application-Specific Accumulators
  - Tailored Exact Accumulator
  - Application-Specific Parametrization
---

# Application-Specific Exact Accumulator

A wide fixed-point accumulator whose MSB, LSB and input-shifter span are set from application knowledge rather than from the input format's exponent range, trading unconditional exactness for a register that is three times smaller.

```tikz title="Accumulator parameters m_A, l_A and m_X drawn on a bit ruler, with one summand falling below l_A"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % bit ruler: x(b) = (13 - b) * 0.4 ; m_A = 13, l_A = -12, m_X = 5, w''_F = 8
  % ---------- accumulator register, w_A = 26 cells
  \draw[fill=black!8] (0,0) rectangle (10.4,0.4);
  \foreach \i in {1,...,25} \draw[black!35] ({\i*0.4},0) -- ({\i*0.4},0.4);
  \node[anchor=north,scale=0.8] at (5.2,-0.55)
    {accumulator: $w_A = m_A-\ell_A+1 = 26$ b, two's complement};
  \draw[<->,>=stealth] (0,-0.25) -- (10.4,-0.25);

  % ---------- summands, w''_F = 8 b each
  \draw[fill=black!25] (3.2,2.35) rectangle (6.4,2.7);
  \draw[fill=black!25] (4.4,1.9)  rectangle (7.6,2.25);
  \draw[fill=black!25] (5.2,1.45) rectangle (8.4,1.8);
  \draw[fill=black!25] (6.8,1.0)  rectangle (10.0,1.35);
  \node[anchor=west,scale=0.75] at (6.5,2.52) {$w''_F = 8$ b};

  % ---------- one summand that falls off the bottom
  \draw[fill=black!25] (8.0,0.55) rectangle (10.4,0.9);
  \draw[dashed,draw=black!60,fill=white] (10.4,0.55) rectangle (11.2,0.9);
  \node[anchor=west,scale=0.72] at (11.3,0.72) {truncated / rounded};

  % ---------- parameter markers
  \draw[dashed,black!70] (0,-0.1) -- (0,3.35);
  \draw[dashed,black!70] (3.2,-0.1) -- (3.2,3.35);
  \draw[dashed,black!70] (10.4,-0.1) -- (10.4,3.35);
  \node[anchor=south,scale=0.9] at (0,3.35) {$m_A$};
  \node[anchor=south,scale=0.9] at (3.2,3.35) {$m_X$};
  \node[anchor=south,scale=0.9] at (10.4,3.35) {$\ell_A$};

  % ---------- the two spans
  \draw[<->,>=stealth] (0,3.15) -- (3.2,3.15);
  \node[anchor=south,scale=0.72] at (1.6,3.13) {overflow margin: 8 b};
  \draw[<->,>=stealth] (3.2,3.15) -- (10.4,3.15);
  \node[anchor=south,scale=0.72] at (6.8,3.13) {shifter span $m_X-\ell_A+1 = 18$ b};

  % ---------- weight ruler
  \draw[->,>=stealth] (0,-1.35) -- (11.4,-1.35);
  \foreach \b in {13,8,3,-2,-7,-12}{
    \draw ({(13-\b)*0.4},-1.28) -- ({(13-\b)*0.4},-1.42);
    \node[anchor=north,scale=0.7] at ({(13-\b)*0.4},-1.44) {$2^{\b}$};
  }
  \node[anchor=west,scale=0.7] at (11.45,-1.35) {weight};
\end{circuitikz}
\end{document}
```

*After Fig. 21.5, p. 629, with the book's parameter values $m_A=13$, $\ell_A=-12$, $m_X=5$; the truncated tail and the two span markers are added.*

**Replace the format's exponent range with three application constants.** A [[Kulisch Accumulator]] sizes its register from $e_{max}$ and $e_{min}$ alone, so it is exact for every machine number the format can express — including the ones no real application ever produces. The tailored version instead fixes three positions on the same bit ruler:

| Parameter | Meaning | What it buys |
| --- | --- | --- |
| $m_A$ | MSB of the accumulator | no overflow ever occurs while the running sum stays below $2^{m_A}$ |
| $\ell_A$ | LSB of the accumulator | the accuracy of the summation, and the only knob that trades area for error |
| $m_X$ | maximum expected MSB of a *summand* | the span of the alignment shifter, which is the expensive block |

and derives the register width from them:

$$w_A = m_A - \ell_A + 1$$

$m_X$ is the parameter people forget. Very often each summand is orders of magnitude smaller than the final sum, and the shifter only has to reach from $m_X$ down to $\ell_A$ rather than from $m_A$ down to $\ell_A$ — in the drawing above, 18 positions instead of 26, one barrel-shifter stage saved ([[Sign-Padding Alignment Shifter]], [[Shifters]]).

**Work the numbers on the book's inductance integrator.** Computing the inductance of a set of coils by numerical integration, physics bounds the final sum below $10^5$ in the units chosen, and software profiling shows every summand has magnitude between $10^{-2}$ and $2$. Adding two orders of magnitude — $\lceil\log_2 10^2\rceil = 7$ bits — of margin in every direction gives

$$m_A = \left\lceil \log_2\!\left(10^{2}\times 10^{5}\right)\right\rceil = 24, \qquad m_X = 8, \qquad \ell_A = -w_F - 15$$

For single precision, $w_F = 23$, so $\ell_A = -38$ and

$$w_A = 24 + 38 + 1 = 63 \text{ bits} \qquad\text{against}\qquad 127 + 149 + 1 = 177 \text{ bits}$$

for the exact binary32 sum accumulator, and 554 bits for the exact sum-of-products one ([[Exact Sum-of-Products Operator]]).

> [!important] Only $\ell_A$ depends on the arithmetic
> $m_A$ is fixed by the *physics of the problem*, whatever precision is used to simulate it; $m_X$ depends on the physics and on the discretisation step of the integration. Neither moves when you switch from binary32 to binary64. Only $\ell_A$ is written in terms of $w_F$, and it is therefore the designer's single accuracy/area knob. Getting this separation right is what makes the parametrization survive a format change.

**Set $\ell_A$ from an accuracy target when profiling gives you one.** If the requirement is stated as "the result must be accurate to $2^{\ell}$" together with a bound $\overline N$ on the number of summands, then each of the $\overline N$ truncations contributes at most $2^{\ell_A}$, so their sum is below $2^{\ell}$ as soon as

$$\ell_A = \ell - \left\lceil \log_2 \overline N \right\rceil \tag{21.2}$$

This bounds only the error *of the accumulation itself*; it is one term in a complete error budget, not the budget ([[Error Analysis]], [[Error Accuracy]]).

**Pay for the two blocks the exact version does not need.** Once $m_A$ is finite, a summand can arrive above the top of the accumulator, and once $\ell_A > 2e_{min}-2w_F$ a summand can carry bits below the bottom. Both are impossible by construction in the exact accumulator, so both are new hardware:

- **overflow detection** — the input exponent $E$, on $w''_E = w_E+1$ bits, is compared against the constant $m_A$ corrected for the bias. That is a constant-comparand [[Magnitude Comparator]], the cheapest kind: no second operand to route, and the comparison collapses to a small AND/OR tree over the $w''_E$ exponent bits. Its output, together with the summand's sign, is an input to the exception FSM ([[Accumulator Exception FSM]]), which then behaves exactly as a floating-point adder that overflowed. The same subtraction $E - (\ell_A - \text{const})$ that produces the shift distance is already there, so the comparator shares its operand.
- **underflow handling in the shifter** — bits pushed below $\ell_A$ must go somewhere. Truncating them is free: the [[Sign-Padding Alignment Shifter]] simply drops the low columns it would otherwise have to carry, which makes it *narrower*, not wider — the same economy as a [[Truncated Multipliers|truncated multiplier]], and analysed the same way.

**Round the underflowing summands for one extra adder bit, not one extra register bit.** The shifter is still a truncating shifter, but it emits $\text{sfix}(m_A,\ \ell_A-1)$ — one guard column below the accumulator's LSB, so $w_A+1$ bits. The adder is widened by one bit and its LSB input is tied to the constant $1$; the LSB of the adder output is then discarded. Writing $X$ for the shifter output and $A$ for the register content, the adder computes $2A + X + 1$ and the register keeps $\lfloor (2A + X + 1)/2 \rfloor = A + \lfloor X/2 \rceil$, which is round-to-nearest with ties toward $+\infty$ ([[Rounding]]). **The accumulator register stays $w_A$ bits** — only the combinational adder grows, and it grows by one full-adder cell. Halving the per-summand error from $2^{\ell_A}$ to $2^{\ell_A-1}$ for one cell is usually worth it, but it is not free the way truncation is.

**Everything else is the exact accumulator unchanged.** The register stays in two's complement, negation is still $-x = \bar{x}+1$ realised as a $w''_F$-bit XOR row before the shifter plus a carry-in of $s$ ([[Two's-Complement Exact Accumulator]]), and the loop-carried dependency is still one integer addition, so the [[High-Radix Carry-Save Accumulator]] chunking applies verbatim if $w_A$ is still too wide for the target frequency. Conversion back to floating point is a separate block ([[Accumulator-to-Float Converter]]), and with $m_A$ and $\ell_A$ chosen inside the output format's exponent range it is the simple single-zone version rather than the [[Three-Zone Accumulator Converter]].

**The register is not the cost; the shifting is.** Rules of thumb from the implementations behind the chapter (p. 638): the fixed-point adder and its registers are much smaller than either the shifter or the converter, and shifter $+$ accumulator $+$ converter together are comparable in size to a floating-point adder with a $w_A$-bit fraction. For the universal accumulator that comparison is brutal — an exact binary32 accumulator is about **ten times** a binary32 floating-point adder. For the tailored one it is a good deal: a 64-bit accumulator for 32-bit data costs about a **64-bit floating-point adder**, while accepting a new summand every cycle and being exact on the data it was sized for. Smaller still when $m_X < m_A$, because that shrinks the block that actually dominates.

**Which is why the margins should be generous.** Three orders of magnitude of safety costs $\lceil\log_2 10^3\rceil \approx 10$ bits of $w_A$, and 10 bits of accumulator barely move the area — they move the *shifter* not at all if they are spent above $m_X$. Ten more bits of confidence in a parametrization derived from profiling is the cheapest insurance in the design. In an HLS flow the three parameters are `#pragma`s with Tables 21.1/21.2 as fallback defaults, and the compiler can detect the plain-sum case and instantiate the half-size accumulator automatically ([[FloPoCo]]).

**On FPGA the tailored width is what makes the loop close.** Each logic cell provides a flip-flop directly behind the adder bit it computes, so the accumulator register is free — it occupies registers that would otherwise sit idle — and the feedback is local routing inside one column over the dedicated carry chain ([[FPGAs]]). A 64-bit accumulator built this way clocks above 200 MHz (p. 635); the 554-bit universal one does not, and needs the carry-save chunking to get there. On ASIC the register is real area and the argument for a small $w_A$ is stronger still, but the frequency argument is weaker because a fast 554-bit adder can be bought with a prefix tree.

> [!warning] The book quantifies the whole operator, not the tailoring
> §21.3 gives rules of thumb for shifter, accumulator and converter as blocks, but nowhere states the area or delay of the overflow comparator, the rounding cell or the exception FSM relative to them. Treat "the extras are cheap" as an argument from their structure — a constant-comparand comparator on $w''_E \le 12$ bits, one full adder, a four-state FSM — not as a measured claim.

**The recurrence, one iteration.** With $d_k = E_k - \ell_A + 1$ the bias-corrected alignment distance of summand $k$ and $M_k$ its unnormalised significand on $w''_F$ bits:

$$\boxed{\ A_{k+1} = A_k \;+\; \left\lfloor \frac{(-1)^{s_k} M_k\, 2^{d_k}}{2^{w''_F}} \right\rceil \bmod 2^{w_A}, \qquad w_A = m_A - \ell_A + 1\ }$$

exact whenever $d_k \le m_A - \ell_A$ and $d_k \ge w''_F$; the rounding operator is the only source of error, and it fires only on summands that reach below $\ell_A$.

**Where it breaks.**

- **The profiling was not exhaustive.** $m_X$ and $\ell_A$ come from observed runs. A summand outside the observed range is not a hardware fault — it is silently truncated (error $2^{\ell_A}$ per occurrence) or flagged as overflow — but the "exact" claim is void for that run. This is the failure mode a [[Kulisch Accumulator]] does not have.
- **Cancellation-heavy sums.** $m_A$ bounds the *final* sum. An intermediate partial sum can exceed it and be cancelled back into range by later summands; the comparator sees the summand, not the running sum, so a spurious overflow latches in the FSM and poisons a result that was mathematically fine. Kulisch's guard bits exist exactly for this; here the only defence is margin on $m_A$.
- **$N$ genuinely unbounded.** Eq. (21.2) needs $\overline N$. Without it, the truncation error has no bound and the accuracy argument collapses to "$\ell_A$ is small enough, probably".
- **A general-purpose unit.** If the operator must be exact on data it has never seen — a library FMA, a coprocessor instruction — no profiling exists and the tailoring has nothing to stand on.
- **Sum of products near the top of the range.** $w_A$ doubles for $\sum X_iY_i$; if the tailored $m_A - \ell_A$ approaches the exact width, the tailoring has bought nothing and the exact version is simpler.

**RTL (Spade).** One iteration of the recurrence. The generics are the three parameters: `WA` $= m_A-\ell_A+1$, `WM` $= w''_F$, and `DMAX` $= m_A-\ell_A$, the constant the overflow comparator tests against.

```spade
/// One iteration of an application-specific exact accumulator.
///   WA   = m_A - l_A + 1   accumulator / adder width
///   WM   = w''_F           unnormalised significand width
///   WD                     width of the alignment distance
///   DMAX = m_A - l_A       largest alignment distance that cannot overflow
entity acc_step<#uint WA, #uint WM, #uint WD, #uint DMAX>(
    clk: clock,
    rst: bool,
    s: bool,
    d: uint<WD>,
    m: uint<WM>,
) -> (uint<WA>, bool) {
    // overflow comparator against the constant m_A
    let ovf = d > DMAX;

    // sign-padding alignment shifter over sfix(m_A, l_A - w''_F)
    let dw: uint<{WA + WM}> = zext(d);
    let aligned: uint<{WA + WM}> = zext(m) << dw;
    let full: uint<{WA + WM}> = if s { ~aligned } else { aligned };

    // truncating shifter, keeping one guard column: sfix(m_A, l_A - 1)
    let g: uint<{WA + WM}> = WM - 1;
    let xr: uint<{WA + 1}> = trunc(full >> g);

    decl next;
    reg(clk) a: uint<WA> reset(rst: 0) = next;
    reg(clk) sticky: bool reset(rst: false) = sticky || ovf;

    // adder widened by one bit, constant LSB of 1, carry-in s, output LSB dropped
    let a_ext: uint<{WA + 1}> = a.concat(1u1);
    let cin: uint<{WA + 1}> = if s { 1 } else { 0 };
    let sum: uint<{WA + 1}> = a_ext +. xr +. cin;
    let next: uint<WA> = trunc(sum >> 1);

    (a, sticky)
}
```

`d` is the shifter control of the diagram, `m` the summand bar, `a` the register row; `xr` is the bar clipped to the ruler plus its one guard column, and everything the bar had below that column is what `full >> g` discards. The whole body is combinational except the two `reg`s: the accumulator itself and the sticky overflow bit that feeds the exception FSM — **that is the entire loop control**, one $w_A$-bit register and one flip-flop, for $N$ iterations at one summand per cycle and no flush. `if s { ~aligned }` reads as a $w_A+w''_F$-bit XOR row; the hardware does the XOR on the $w''_F$-bit significand *before* the shifter and lets the shifter pad with $s$, which is the same function on a fraction of the gates. Synthesis will also turn `<< dw` into a barrel shifter spanning only $m_X-\ell_A+1$ columns once `d`'s range is constrained, and `a.concat(1u1)` into no gates at all — a tied-high adder input.

Simulated at `WA=16, WM=8, WD=5, DMAX=15`: 4008 vectors, including $1+128$, a summand whose guard bit rounds up, one that truncates away, a two's-complement cancellation through zero, and 4000 random $(s,d,m)$ against a behavioural reference; overflow verified to stay low for all in-range distances and to latch on $d>15$.

**Related notes.**

- [[Kulisch Accumulator]] – compares: the untailored extreme, exact on every machine number and 177 or 554 bits wide for binary32.
- [[Two's-Complement Exact Accumulator]] – extends: this is that datapath plus an overflow comparator and a truncating or rounding shifter.
- [[Sign-Padding Alignment Shifter]] – depends-on: the block $m_X$ sizes, and where truncation is implemented for free.
- [[Accumulator Exception FSM]] – depends-on: consumes the overflow flag and its sign, and turns them into the standard floating-point result.
- [[High-Radix Carry-Save Accumulator]] – extends: applies unchanged when the tailored $w_A$ is still too wide to close timing.
- [[Choosing an Accumulator]] – compares: where this sits against every sibling in the family.
- [[Magnitude Comparator]] – supports: the overflow test is a constant-comparand instance on $w''_E$ bits.
- [[Error Analysis]] – supports: eq. (21.2) is how a summation-error budget becomes the value of $\ell_A$.
- [[Rounding]] – supports: the guard column and the tied-high adder LSB implement round-to-nearest, ties toward $+\infty$.
- [[Truncated Multipliers]] – compares: the same argument, that a column you never compute is cheaper than a column you compute and discard.
- [[FloPoCo]] – supports: generates the operator from $m_A$, $\ell_A$, $m_X$ given as HLS pragmas.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21, "Floating-Point Accumulation and Sum of Products".

- §21.1.4 Application-specific parameterization, Fig. 21.5, the inductance example, eq. (21.2): pp. 628–630
- §21.2.2.3 Application-specific accumulator — overflow comparison against $m_A$, truncated versus rounded underflow: p. 634
- §21.2.2 Simple accumulator architectures, Figs. 21.8–21.9 — the two's-complement datapath this extends: pp. 632–633
- §21.2.3 High-radix carry-save architecture, FPGA frequency of a 64-bit accumulator: pp. 635–636
- §21.3 Cost, speed, and accuracy — rules of thumb, the 10× and 64-bit-adder comparisons, the 10-bit margin message: pp. 638–639
- Tables 21.1 and 21.2, exact accumulator widths for binary16/32/64: pp. 626–627
