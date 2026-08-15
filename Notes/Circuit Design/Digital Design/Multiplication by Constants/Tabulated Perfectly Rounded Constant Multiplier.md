---
title: Tabulated Perfectly Rounded Constant Multiplier
description: "Stores the offline-rounded product of a real constant so exactly one rounding happens — the half-ulp reference every other real-constant technique is measured against."
kind: circuit
source: "ASA §12.3.1, pp. 386-387"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, tables, rounding, fpga]
aliases:
  - Perfectly Rounded Constant Multiplier
  - Tabulated Perfectly Rounded Constant Multipliers
  - Correctly Rounded Tabulated Constant Multiplier
---

# Tabulated Perfectly Rounded Constant Multiplier

A lookup table whose entry $i$ holds $\lfloor C\cdot i\rceil_{\ell_R}$ computed offline in arbitrary precision, so the operator commits exactly one rounding error and is correctly rounded by construction.

```tikz title="Tabulated perfectly rounded constant multiplier: one table, entry i = round(C i), with contents for C = pi"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% --- the operator: one table, nothing else -------------------------------
\node[font=\small] (xin) at (0,1.7) {$X$};
\draw[->] (0,1.5) -- node[left,font=\tiny,align=right]
  {$(m_X,\ell_X)$\\$w_X$ bits} (0,0.45);
\node[draw,minimum width=3.4cm,minimum height=0.9cm,align=center] (t) at (0,0)
  {Look-Up Table\\[-1pt]{\tiny entry $i \;=\; \lfloor C\cdot i\rceil_{\ell_R}$}};
\draw[->] (0,-0.45) -- node[left,font=\tiny,align=right]
  {$(m_R,\ell_R)$\\$w_R$ bits} (0,-1.5);
\node[font=\small] at (0,-1.75) {$\lfloor CX\rceil_{\ell_R}$};
\node[font=\tiny,align=center] at (0,-2.8)
  {$2^{w_X}$ entries $\times\ w_R$ bits\\
   $=w_R$ LUTs, 1 LUT of delay, while $w_X\le\alpha$};

% --- the contents, for C = pi, w_X = 4, l_R = -4 -------------------------
\draw (2.6,-2.0) rectangle (7.4,1.7);
\node[font=\tiny] at (5.0,1.45) {$C=\pi$, \ $X\in\{0..15\}$, \ $\ell_R=-4$};
\draw (2.6,1.2) -- (7.4,1.2);
\draw (4.0,1.2) -- (4.0,-2.0);
\node[font=\tiny] at (3.3,0.95) {$i$};
\node[font=\tiny] at (5.7,0.95) {stored $\lfloor \pi i\rceil_{-4}\cdot 2^{4}$};
\draw (2.6,0.75) -- (7.4,0.75);
\node[font=\tiny] at (3.3, 0.50) {$0$};
\node[font=\tiny] at (3.3, 0.15) {$1$};
\node[font=\tiny] at (3.3,-0.20) {$2$};
\node[font=\tiny] at (3.3,-0.55) {$\vdots$};
\node[font=\tiny] at (3.3,-0.95) {$8$};
\node[font=\tiny] at (3.3,-1.30) {$\vdots$};
\node[font=\tiny] at (3.3,-1.70) {$15$};
\node[font=\tiny] at (5.7, 0.50) {$0000000000 = 0$};
\node[font=\tiny] at (5.7, 0.15) {$0000110010 = 50$};
\node[font=\tiny] at (5.7,-0.20) {$0001100101 = 101$};
\node[font=\tiny] at (5.7,-0.55) {$\vdots$};
\node[font=\tiny] at (5.7,-0.95) {$0110010010 = 402$};
\node[font=\tiny] at (5.7,-1.30) {$\vdots$};
\node[font=\tiny] at (5.7,-1.70) {$1011110010 = 754$};
\draw[->,dashed] (1.7,0) -- (2.6,0);
\node[font=\tiny] at (5.0,-2.25)
  {rounded once, offline, in arbitrary precision};
\end{circuitikz}
\end{document}
```

*after Fig. 12.12, p. 387*

**Turn "multiply by a real" into a finite problem by never representing the real.** A generator for $C\in\mathbb R$ takes an argument the integer-constant generators never needed: the output LSB $\ell_R$ (Fig. 12.11, p. 386). $\pi$, $1/\log 2$ and an FFT twiddle $\cos\frac{k\pi}{n}$ have infinitely many bits, so *where to stop* is an input to the problem rather than a property of the answer. Every other technique in this topic answers it by first rounding $C$ to a finite $\widetilde C$ and then building a multiplier for $\widetilde C$ — which is exactly why their error analyses all carry two terms, the constant's own error and the operator's final rounding. Tabulation never forms $\widetilde C$ at all. It stores the $2^{w_X}$ **products**, and a product is a number rather than a constant, so nothing gets approximated twice.

**Fill the table offline, in software, at whatever precision you like.** $X$ is a fixed-point `ufix`$(m_X,\ell_X)$ of

$$w_X=m_X-\ell_X+1\ \text{bits}$$

(format notation is [[Number Formats]]), so it takes $2^{w_X}$ values and the whole function $X\mapsto CX$ is a finite object. Entry $i$ holds $\lfloor C\cdot i\rceil_{\ell_R}$, the perfect rounding to nearest of the real product, evaluated by an arbitrary-precision library at generation time (p. 386). The output format `ufix`$(m_R,\ell_R)$ takes $m_R$ large enough that no entry overflows, $2^{m_R+1}>C\cdot X_{\max}$, giving $w_R=m_R-\ell_R+1$ bits. No hardware ever touches $C$; the constant lives entirely in the generator.

**Count the roundings and the error analysis is finished.** There is exactly one, and by definition of round-to-nearest at precision $\ell_R$ it moves the result by at most half the spacing of the output format:

$$|\delta_{\text{total}}(X)|=\big|\lfloor CX\rceil_{\ell_R}-CX\big|\le2^{\ell_R-1}=\tfrac12\,\mathrm{ulp}$$

No telescoping decomposition, no guard bits, no $g>\log_2 D$ side condition. Compare the two operators that actually scale: the shift-and-add path splits one ulp between the constant error $\delta_C$ and the final round (eqs. 12.16–12.22, p. 388), and [[Fix-by-Real KCM]] commits $D$ table roundings plus a final one, $\overline\delta_{\text{total}}=2^{\ell_R-1}+D\times2^{\ell_R-g-1}$ (eq. 12.35, p. 392). Both land at *faithful*, under one ulp. Only tabulation lands at half.

**Half an ulp is a floor, not a lucky number.** An operator whose output format has LSB $\ell_R$ can only emit integer multiples of $2^{\ell_R}$, and $CX$ for irrational $C$ is generically not one of them. The distance from an arbitrary real to the nearest such multiple is at most $2^{\ell_R-1}$, and that bound is attained, so $2^{\ell_R-1}$ is the best accuracy any operator with this output format may achieve (p. 386) — and any operator meeting it is correctly rounded. That is what makes this circuit the reference point: every other technique in [[Multiplication by Constants]] is quoted as a multiple of this bound, and the design question is always how much accuracy is being sold for how much area. Definitions of ulp, faithful and correctly rounded are in [[Error Analysis]] and [[Rounding]]; do not re-derive them here.

**The cost law is the integer one, unchanged.** Each of the $w_R$ output bits is a Boolean function of the $w_X$ address bits and of nothing else. While $w_X\le\alpha$ — the architectural LUT input count, 4 to 6 on mainstream parts, see [[FPGAs]] — each such function fits in exactly one LUT, so the multiplier is $w_R$ LUTs with **one LUT of delay**, and no real-constant operator can be smaller or faster (p. 383). One bit past $\alpha$ it collapses: each output bit becomes $2^{w_X-\alpha}$ LUTs plus address decoding, exponential in $w_X$ and still only linear in $w_R$. That asymmetry is the whole engineering content — a wide *result* is nearly free, a wide *input* is fatal, the opposite of how shift-and-add behaves, where the result width is what drives adder cost. On ASIC the same table is $2^{w_X}\times w_R$ bits of ROM or of synthesised random logic; the exponential is identical and only the constant factor moves.

> [!note]
> The address is the raw bit pattern of $X$, so $\ell_X$ never reaches the hardware — scaling the input by $2^{\ell_X}$ is absorbed into the stored values at generation time. Two multipliers with the same $w_X$ and different binary points are the *same circuit* with different table contents, at identical cost. Only $w_X$ and $w_R$ appear in the cost annotation on the diagram, and that is why.

**FloPoCo reaches this operator from two directions.** `FixRealKCM` falls back to plain tabulation for very small input sizes, and the universal table generator of §16.4 produces it directly with $f(x)=Cx$ (p. 387):

```
flopoco FixFunctionByTable f="2/pi*x" signedIn=false lsbIn=-8 lsbOut=-24
```

— an 8-bit in, 24-bit out multiplier by $2/\pi$, i.e. a 256-entry table. Signed input is a generator flag rather than a structural change: a two's-complement $X$ addresses the same table with a different interpretation of the index, and the entries are filled with the correspondingly signed products ([[Number Formats]]).

> [!warning] Not covered in the source — needs outside research
> The book states that `FixRealKCM` "defaults to tabulation for very small input sizes" but never gives the crossover $w_X$ at which the chunked architecture wins, nor a measured LUT comparison between the two. The crossover depends on $\alpha$ and on whether the table maps to LUTs or to block RAM, and is not derivable from the material in this chapter.

$$\boxed{\ T[i]=\lfloor C\cdot i\rceil_{\ell_R}\ \Longrightarrow\ |\delta_{\text{total}}|\le2^{\ell_R-1},\qquad \text{cost}=w_R\ \text{LUTs while}\ w_X\le\alpha\ }$$

## When it breaks

- **$w_X>\alpha$.** Each output bit becomes $2^{w_X-\alpha}$ LUTs plus decoding. With $\alpha=6$ a 12-bit input already costs $64\times$ the logic per output bit, and a 16-bit input is not buildable. [[Fix-by-Real KCM]] takes over by chunking the address, paying $D$ extra roundings and $g>\log_2 D$ guard bits for linear scaling.
- **You only needed faithful.** Half an ulp is strictly more than most DSP specifications ask for. If the requirement is $<1$ ulp, this operator over-delivers, and a faithful sibling is smaller at every $w_X$ where both are buildable.
- **Two variable operands.** The table is indexed by all of $X$; a second variable input makes it $2^{2w}$ entries. This is a *constant* multiplier and degrades into the full [[Multipliers]] problem the moment $C$ can move at run time.
- **Several constants, one input.** Nothing is shared — each constant needs its own independent table, so multiple-constant cost is exactly the sum with no sub-expression sharing to find. [[Table-Based Multiple Constant Multiplication]] is where sharing reappears.
- **Deep pipelining.** With one LUT of delay there is nothing to pipeline. Pushing the table into block RAM to escape the LUT explosion makes the read registered, so the operator gains a cycle of latency it did not previously have.

## RTL (Spade)

$C=\pi$, $X$ a 4-bit unsigned integer (`ufix`$(3,0)$), $\ell_R=-4$. Then $C\cdot X_{\max}=15\pi\approx47.1<64$, so $m_R=5$ and $w_R=5-(-4)+1=10$ bits, and entry $i$ stores the integer $\lfloor\pi i\cdot2^4\rceil$.

```spade
/// Perfectly rounded multiplication by pi: entry i = round(pi * i * 2^4).
/// One LUT per output bit while the 4-bit address fits alpha.
fn pi_table(x: uint<4>) -> uint<10> {
    [0, 50, 101, 151, 201, 251, 302, 352, 402, 452, 503, 553, 603, 653, 704, 754][x]
}

entity pi_mul4(x: uint<4>) -> uint<10> {
    pi_table(x)
}
```

`x` is the address wire entering the box in the diagram and the array literal *is* the contents panel beside it, element $0$ at index $0$. The result is `uint<10>` with a binary point four places from the right that exists only on paper — Spade has no fixed-point type here, so $\ell_R=-4$ lives in the generator and in the entries, never in the hardware, exactly as the note argues. The `fn` is purely combinational, one level of logic, no clock. Synthesis will not infer a memory from this: it feeds the sixteen constants to logic optimisation and emits ten independent 4-input Boolean functions, ten LUTs on an FPGA and ten small gate cones on an ASIC, several of which collapse further because the low bits of the table are far from random functions of the address.

Simulated exhaustively over all 16 addresses plus a 3000-vector random sweep, with named checks at $x=0,1,8,15$ ($1$ and $8$ differ in every address bit, so a reversed decode cannot pass both). The reference is a double-precision evaluation of $\pi x2^4$ and the tolerance is exactly half an ulp, so the testbench asserts the accuracy *claim* rather than a second copy of the table.

## Related Notes

- [[Tabulated Constant Multiplier]] – compares: the integer sibling, same $w_R$-LUT law and same exponential wall, but exact rather than rounded because an integer product is already finite.
- [[Fix-by-Real KCM]] – extends: chunks the address into $\alpha$-bit pieces to escape the exponential, and pays with $D+1$ roundings and $g>\log_2 D$ guard bits.
- [[Faithful Shift-and-Add Real Constant Multiplier]] – compares: spends the second half-ulp on approximating $C$ itself, which is what buys it adders instead of memory.
- [[Error Analysis]] – depends-on: supplies the ulp, faithful and correctly-rounded definitions this note's bound is stated in.
- [[Rounding]] – depends-on: "perfectly rounded" here means round-to-nearest, performed offline at unlimited precision.
- [[Table-Based Function Evaluation]] – extends: the same one-table structure with an arbitrary $f$ in place of $Cx$, which is literally how FloPoCo generates this operator.
- [[Choosing a Constant Multiplier]] – compares: where a plain table sits against every sibling once $w_X$, $\ell_R$ and the accuracy requirement are all on the table.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.3.1 "Tabulated Perfectly Rounded Constant Multipliers", pp. 386-387 — Fig. 12.12 and the FloPoCo hands-on box.
- §12.3, p. 386 — the real-constant generator interface and its $\ell_R$ argument (Fig. 12.11).
- §12.2.1, p. 383 — the one-LUT-per-output-bit law and its collapse for $w_X>\alpha$.
- §12.3.2, pp. 388-389 — the two-term error decomposition that tabulation avoids.
- §12.3.3.1, pp. 391-392 — the fix-by-real KCM error budget, eqs. 12.35-12.36.
