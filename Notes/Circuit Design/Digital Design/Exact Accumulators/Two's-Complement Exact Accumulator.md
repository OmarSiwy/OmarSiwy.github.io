---
title: "Two's-Complement Exact Accumulator"
description: "The core loop: aligned summand, XOR row plus carry-in for negation, one w_A-bit adder and register — the only thing left in the feedback path is an integer add."
kind: circuit
source: "ASA §21.2.2, pp. 632-635"
status: seed
spade: simulated
tags: [digital, exact-accumulators, accumulator, fixed-point, fpga]
aliases:
  - Two's Complement Exact Accumulator
  - Two's Complement Accumulator
  - Two's-Complement Accumulator
  - Simple Exact Accumulator
---

# Two's-Complement Exact Accumulator

The loop body of every exact accumulator: an aligned summand is negated by an XOR row and a carry-in, then added into a $w_A$-bit two's-complement register — so the only thing on the loop-carried dependency is one integer addition.

```tikz title="Two's-complement exact accumulator: shifter, w_A-bit XOR row, adder with carry-in s, and the accumulator register closing the loop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------------- FloatToFix dashed envelope
  \draw[dashed,black!55] (-1.9,4.35) rectangle (7.9,7.15);
  \node[anchor=west,scale=0.8,black!55] at (7.98,5.6) {FloatToFix};

  % ---------------- inputs
  \node[anchor=south] at (-1.3,7.75) {$s$};
  \node[anchor=south] at (1.6,7.75) {$E$};
  \node[anchor=south] at (4.4,7.75) {$M$};
  \draw (-1.3,7.7) -- (-1.3,3.2);
  \fill (-1.3,4.82) circle (1.6pt);
  \draw[->,>=stealth] (1.6,7.7) -- (1.6,6.85);
  \draw[->,>=stealth] (4.4,7.7) -- (4.4,6.85);
  \node[anchor=west,scale=0.75] at (1.68,7.35) {$w''_E$};
  \node[anchor=west,scale=0.75] at (4.48,7.35) {$w''_F$};

  % ---------------- shifter (trapezoid, wide side down: it grows the word)
  \draw (0.9,6.85) -- (7.2,6.85) -- (7.2,6.05) -- (0.2,6.05) -- cycle;
  \node[scale=0.9] at (4.0,6.45) {shifter (left shift by $E$)};

  \draw[->,>=stealth] (3.0,6.05) -- (3.0,5.15);
  \node[anchor=west,scale=0.75] at (3.08,5.55) {$w_A$};

  % ---------------- xor row, w_A bits wide
  \draw (0.2,4.5) rectangle (7.2,5.15);
  \node[scale=0.9] at (3.7,4.82) {xor \ ($w_A$ 2-input XOR gates)};

  % s into the xor row
  \draw[->,>=stealth] (-1.3,4.82) -- (0.2,4.82);

  \draw[->,>=stealth] (3.0,4.5) -- (3.0,3.55);
  \node[anchor=west,scale=0.75] at (3.08,4.15) {$X_{\text{fix}}$: $w_A$};

  % ---------------- adder
  \draw (0.2,2.85) rectangle (7.2,3.55);
  \node[scale=1.0] at (3.7,3.2) {$+$};

  % carry-in = s
  \draw[->,>=stealth] (-1.3,3.2) -- (0.2,3.2);
  \node[anchor=south,scale=0.75] at (-0.55,3.22) {$c_{\text{in}}{=}s$};

  \draw[->,>=stealth] (3.0,2.85) -- (3.0,2.0);
  \node[anchor=west,scale=0.75] at (3.08,2.4) {$w_A$};

  % ---------------- accumulator register
  \draw[fill=black!8] (0.2,1.2) rectangle (7.2,2.0);
  \node[scale=0.9] at (3.7,1.6) {2's complement accumulator register};
  \draw[->,>=stealth] (-0.9,1.6) -- (0.2,1.6);
  \node[anchor=east,scale=0.75] at (-0.95,1.6) {reset};

  % ---------------- feedback: register out -> right-hand adder input
  \draw (7.2,1.6) -- (8.6,1.6) -- (8.6,3.2) -- (7.2,3.2);
  \draw[->,>=stealth] (7.25,3.2) -- (7.2,3.2);
  \node[anchor=west,scale=0.75] at (8.68,2.4) {$A$: $w_A$};

  % ---------------- output
  \draw[->,>=stealth] (3.0,1.2) -- (3.0,0.35);
  \node[anchor=west,scale=0.75] at (3.08,0.72) {$w_A$};
  \node[anchor=north] at (3.0,0.3) {$A$};
\end{circuitikz}
\end{document}
```

*After Fig. 21.8, p. 633, drawn inside the `FloatToFix` + adder + register skeleton of Fig. 21.2, p. 625.*

**Fix the interface before the recurrence.** The accumulator consumes an unpacked summand $(s, E, M)$: a sign on 1 bit, a biased exponent $E$ on $w''_E$ bits, and an *unnormalised* significand $M$ on $w''_F$ bits. For a plain $\sum X_i$ these are just the fields of $X_i$, so $w''_E = w_E$ and $w''_F = w_F$; for $\sum X_iY_i$ they come from an [[Exact Unnormalized Multiplier]] and $w''_E = w_E+1$, $w''_F = 2w_F+2$ (p. 632). $E$ is the *doubly biased* exponent, chosen so that it is directly the left-shift distance — no subtraction, no normalisation. The shifter therefore emits the summand's magnitude already on the accumulator's grid, $X_{\text{fix}}$ on $w_A = m_A - \ell_A + 1$ bits, an $\text{sfix}(m_A,\ell_A)$ word in the sense of [[Fixed-Point Representations]].

**Turn the sum into a recurrence over $\mathbb{Z}/2^{w_A}\mathbb{Z}$.** With $a_i = X_i \cdot 2^{-\ell_A} \in \mathbb{Z}$ the whole operator is one line, $A_{i+1} = A_i + a_i$, iterated once per input. Because $w_A$ was sized so that every summand embeds without rounding, the recurrence runs entirely in $\mathbb{Z}$ — addition there is associative and commutative, which is exactly why the result does not depend on arrival order. Two's complement on $w_A$ bits is that ring reduced mod $2^{w_A}$, and reduction is a ring homomorphism, so the register content is the image of the true sum as long as the true sum stays inside $[-2^{m_A}, 2^{m_A})$.

**Negate with an XOR row and a carry-in, never with a subtractor.** A signed summand arrives as (sign, magnitude), and the loop needs it in two's complement. Apply the two's-complement identity $-x = \bar{x} + 1$: an array of $w_A$ 2-input XOR gates, each fed by $s$, conditionally complements every bit ($x \oplus 0 = x$, $x \oplus 1 = \bar{x}$), and $s$ is simultaneously driven into the adder's carry-in, supplying the $+1$. When $s = 0$ both are inert. The $+1$ costs *nothing*: it rides in on a carry input the adder already has, so a negation is one XOR delay ahead of an addition the circuit was going to perform anyway. There is no second operator and no extra carry propagation.

**Where the XOR row sits is a real area decision.** Fig. 21.8 places it *after* the shifter, so it is $w_A$ bits wide — 554 XOR gates for a binary32 exact sum of products. Fig. 21.9 places it *before*, on $M$, where it is only $w''_F$ bits wide, at the price of a shifter that pads with $s$ on both sides instead of zeros — see [[Sign-Padding Alignment Shifter]]. The fan-out on $s$ stays near $w_A$ either way, because that is what the padding itself consumes, so the saving is genuine and essentially free (p. 633). Neither variant changes the loop: the XOR row is upstream of the register in both.

> [!note] The carry-out is discarded, and that is not a bug
> A cancellation such as $+16$ followed by $-16$ produces a carry out of the top bit which is simply dropped. That is legitimate precisely because dropping it *is* the reduction mod $2^{w_A}$, and the homomorphism guarantees the surviving $w_A$ bits are still the true sum's image. Intermediate values may wrap arbitrarily; only the final value has to lie in range. This is the same property that lets [[Kulisch Accumulator]] absorb spurious overflows with a handful of guard bits instead of an overflow FSM.

**Why not sign-magnitude, given the output must be sign-magnitude anyway?** Because it puts a second carry propagation on the loop. A sign-magnitude accumulator must add *or* subtract depending on the relative signs of $A$ and $X_{\text{fix}}$, and then re-negate whenever the running sum crosses zero — two $w_A$-bit adders in series. Avoiding the series path means computing $A + X_{\text{fix}}$ and $A - X_{\text{fix}}$ in parallel with a compound adder, which is *more* hardware than the two's-complement version, not less (p. 634). The conversion to sign-magnitude does have to happen, but it happens in the [[Accumulator-to-Float Converter]] *after* normalisation, on $w'_F$ bits instead of $w_A$. Cheaper, and — the point that actually decides it — a shorter loop. See [[Sign-Magnitude Accumulator]] for the full comparison.

**On FPGA the register is free and the adder is a hard macro.** Each logic cell provides a flip-flop directly behind the bit of addition it computes, so the accumulator register occupies flip-flops that would otherwise sit idle; the addition uses the dedicated fast carry chain rather than LUT logic; and the feedback path is local routing inside a single column. A 64-bit accumulator built this way clocks above 200 MHz (p. 635). On ASIC none of the three is free — the register is real area, the adder is whatever [[RCA, Ripple-Carry Adder]] or prefix structure you pick from [[Adders]], and the feedback is ordinary routing — which is why the FPGA case tolerates much wider $w_A$ before needing chunking. See [[FPGAs]].

**A trace makes the exactness concrete.** Take $\text{float}(4,3)$: $w_E=4$, $w_F=3$, $e\in[-6,7]$, so $m_A = e_{max} = 7$, $\ell_A = e_{min}-w_F = -9$ and $w_A = 17$. Feed $X_1{=}16$, $X_2{=}1$, $X_3{=}1$, $X_4{=}-16$, $X_5{=}0.125$, true sum $2.125$. On the accumulator grid ($p_7\ldots p_0\,.\,p_{-1}\ldots p_{-9}$):

```text
A0 =       0 0 0 0 0 0 0 0 . 0 0 0 0 0 0 0 0 0     0
A1 = A0+X1 0 0 0 1 0 0 0 0 . 0 0 0 0 0 0 0 0 0    16
A2 = A1+X2 0 0 0 1 0 0 0 1 . 0 0 0 0 0 0 0 0 0    17
A3 = A2+X3 0 0 0 1 0 0 1 0 . 0 0 0 0 0 0 0 0 0    18
A4 = A3+X4 0 0 0 0 0 0 1 0 . 0 0 0 0 0 0 0 0 0     2   (carry-out dropped)
A5 = A4+X5 0 0 0 0 0 0 1 0 . 0 0 1 0 0 0 0 0 0     2.125
```

$X_4$ enters as $\overline{X_{\text{fix}}}+1$ with $s=1$, and the wraparound at step 4 is the discarded carry-out above. Every intermediate is exact. A [[Floating-Point Accumulator Loop]] on the same data returns $0.125$ — $8$ ulp off — because at exponent 4 the ulp is $2^{4-3}=2$ and each unit summand is exactly half an ulp, so round-to-nearest-even swallows both; reorder the inputs and it returns $2$ instead. The exact accumulator returns $1088 = 2.125 \times 2^{9}$ for every one of the $5!$ orderings.

$$\boxed{\ A_{i+1} \;=\; A_i + \big(X^{\text{fix}}_i \oplus s_i^{(w_A)}\big) + s_i \bmod 2^{w_A},\qquad w_A = m_A-\ell_A+1\ }$$

where $s_i^{(w_A)}$ is $s_i$ replicated $w_A$ times — the XOR row — and the trailing $+s_i$ is the adder's carry-in.

**When it breaks.**

- The $w_A$-bit carry propagation is on the loop, so $f_{max} \approx 1/t_{\text{add}}(w_A)$. Past roughly 64 bits on FPGA this is the binding constraint and the loop must be chunked — [[High-Radix Carry-Save Accumulator]] takes over.
- Exactness is conditional on the sizing. A summand with bits below $\ell_A$ is truncated; a running sum leaving $[-2^{m_A},2^{m_A})$ *and not returning* is silently wrong, with no flag. Only the full-width sizing makes both impossible by construction; anything narrower needs the overflow comparator and rounding shifter of [[Application-Specific Exact Accumulator]].
- Infinities and NaNs are not representable in a fixed-point register at all and are handled entirely outside this datapath, by [[Accumulator Exception FSM]].
- The circuit is exact, the *answer* need not be: if the $X_i$ were themselves rounded upstream, no bit below their own discarded LSB means anything.

> [!warning] The ">200 MHz for 64 bits" figure names no device
> p. 635 gives it without a family, speed grade or synthesis tool, so it is a
> rough order of magnitude and not a portable number. Re-measure on your target
> before choosing $\alpha$ for the chunked variant.

**RTL (Spade).** One iteration of the recurrence, generic in $w_A$:

```spade
entity tc_accumulator<#uint WA>(
    clk: clock,
    rst: bool,
    x_fix: uint<WA>,
    s: bool,
) -> uint<WA> {
    let xn: uint<WA> = if s { ~x_fix } else { x_fix };
    let cin: uint<WA> = zext(s.as_uint());
    reg(clk) acc: uint<WA> reset(rst: 0) = acc +. xn +. cin;
    acc
}
```

`xn` is the XOR row (`~` is the bitwise complement; `!` would be a type error, being bool-only) and `cin` is $s$ zero-extended so the adder's operands match width. `+.` is the *truncating* add — plain `+` returns `uint<WA+1>`, and taking the low $w_A$ bits is not a shortcut here but the reduction mod $2^{w_A}$ the note is built on. The register is the only sequential element and is the entire loop; everything above it in the diagram — shifter, XOR row — is combinational and can be pipelined freely. Synthesis will not build the drawn "XOR row then adder" as two stages: on FPGA it folds the XOR into the adder's LUT and maps the whole row onto the hard carry chain, and the register vanishes into the carry-chain flip-flops.

**Iterations and loop control.** One iteration per summand, so $N$ summands take $N$ cycles at an initiation interval of 1 — unlike SRT or CORDIC there is no fixed iteration count, because each iteration consumes fresh input rather than refining a residual. Loop control is correspondingly cheap: a reset on the $w_A$ flip-flops and nothing else — no counter, no sequencer, no shift-amount state machine. The chunked variant adds $k-1$ carry flip-flops plus a $k$-cycle flush at the end.

**Related Notes**

- [[Floating-Point Accumulator Loop]] – counter-example: the circuit this replaces; its error grows with $N$ and its latency sits inside the loop.
- [[Sign-Magnitude Accumulator]] – compares: the alternative representation, rejected because it puts a second carry propagation on the loop.
- [[High-Radix Carry-Save Accumulator]] – extends: chunks this same adder every $\alpha$ bits to break the $w_A$-bit critical path.
- [[Application-Specific Exact Accumulator]] – extends: adds overflow detection and input rounding once $m_A$ and $\ell_A$ are finite.
- [[Sign-Padding Alignment Shifter]] – supports: moves the XOR row upstream, shrinking it from $w_A$ to $w''_F$ bits.
- [[Accumulator-to-Float Converter]] – depends-on: consumes $A$ and does the single rounding of the whole datapath.
- [[Accumulator Exception FSM]] – supports: handles the infinities and NaNs this fixed-point loop cannot represent.
- [[Kulisch Accumulator]] – extends: the same loop sized so no application can ever overflow it.
- [[Fixed-Point Representations]] – depends-on: defines the $\text{sfix}(m_A,\ell_A)$ format $X_{\text{fix}}$ and $A$ live in.
- [[RCA, Ripple-Carry Adder]] – depends-on: the $w_A$-bit adder itself, and the source of the loop's delay.
- [[Adders]] – compares: which adder structure to put in the loop once $w_A$ makes ripple-carry too slow.
- [[FPGAs]] – supports: why the register and the carry chain are free here.
- [[Choosing an Accumulator]] – compares: where this sits against every sibling.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21.

- §21.2.2.1 Exact accumulator, Figs. 21.8 and 21.9 (XOR row placement, $-x=\bar x+1$): pp. 632–633
- §21.2.2.4 Two's complement versus sign-magnitude: p. 634
- FPGA mapping of the two's-complement accumulator, 64 bits above 200 MHz: p. 635
- Fig. 21.2, keeping the accumulator in fixed point; unpacked interface $w''_E$, $w''_F$: pp. 625, 632
