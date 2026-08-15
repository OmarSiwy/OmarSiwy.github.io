---
title: Tabulated Constant Multiplier
description: "One LUT per output bit and one LUT of delay while the input fits the LUT's alpha inputs — unbeatable, and exponentially bad one bit past that."
kind: circuit
source: "ASA §12.2.1, p. 383; §12.3.1, p. 387"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, lut, fpga, table]
aliases:
  - Tabulated Constant Multipliers
  - Tabulated Constant Multiplication
  - Full-Table Constant Multiplier
---

# Tabulated Constant Multiplier

A constant multiplier built by storing every possible product in a single lookup table, which is the cheapest multiplier that exists as long as the input is no wider than one LUT's address, and the most expensive one bit later.

```tikz title="Tabulating the product CX for all values of X: word-level block and bit-level LUT view"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- (a) word-level view ----------
\node[font=\small] at (0,2.15) {$X$};
\draw[->] (0,1.95) -- (0,1.05);
\node[anchor=west,font=\tiny] at (0.1,1.5) {$w_X=6$};
\node[draw,minimum width=2.4cm,minimum height=0.8cm] at (0,0.6) {Look-Up Table};
\draw[->] (0,0.2) -- (0,-0.7);
\node[anchor=west,font=\tiny] at (0.1,-0.25) {$w_X+w_C=11$};
\node[font=\small] at (0,-0.95) {$CX$};
\node[font=\small] at (0,-1.75) {(a) word-level view};
% ---------- (b) bit-level view ----------
\begin{scope}[xshift=5.6cm]
  \foreach \i/\lab in {0/5,1/4,2/3,3/2,4/1,5/0}{
    \draw (\i*0.45,1.75) rectangle (\i*0.45+0.45,2.2);
    \node[font=\tiny] at (\i*0.45+0.225,1.975) {$x_\lab$};
    \draw (\i*0.45+0.225,1.75) -- (\i*0.45+0.225,1.35);
  }
  \node[left,font=\small] at (-0.1,1.975) {$X$};
  \node[anchor=west,font=\tiny] at (2.85,1.975) {$w_X=\alpha=6$};
  \draw[very thick] (0.15,1.35) -- (4.75,1.35);
  \foreach \j in {0,...,10}{
    \draw (\j*0.44+0.2,1.35) -- (\j*0.44+0.2,0.75);
    \draw (\j*0.44+0.03,0.75) rectangle (\j*0.44+0.37,-0.15);
    \node[font=\tiny,rotate=90] at (\j*0.44+0.2,0.3) {LUT};
    \draw[->] (\j*0.44+0.2,-0.15) -- (\j*0.44+0.2,-0.55);
    \draw (\j*0.44+0.03,-0.55) rectangle (\j*0.44+0.37,-1.0);
  }
  \node[left,font=\small] at (-0.1,-0.775) {$CX$};
  \node[anchor=west,font=\tiny] at (4.85,-0.775) {$11$ bits};
  \node[font=\small,anchor=north] at (2.4,-1.55) {(b) bit-level view, $w_C=5$: one LUT per output bit};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 12.9, p. 383*

**Delete the arithmetic and keep only the function.** An input $X$ of $w_X$ bits takes exactly $2^{w_X}$ values, and $C$ never changes, so $X\mapsto CX$ is a total function on a finite domain. Nothing about it needs to be *computed*: it can be enumerated offline and stored. The output width follows from the extremes of that domain — for unsigned $X<2^{w_X}$ and $C<2^{w_C}$ the product satisfies $CX\le(2^{w_X}-1)(2^{w_C}-1)<2^{w_X+w_C}$, so $w_X+w_C$ bits suffice and the table is $2^{w_X}$ words of $w_X+w_C$ bits. Signedness changes the format bookkeeping, not the construction; see [[Number Formats]].

**Let the target's own primitive fix the useful range.** On an FPGA the logic fabric is built from small lookup tables, and $\alpha$ denotes the number of inputs of one architectural LUT — 4 to 6 on mainstream devices at the time of writing (p. 383). A LUT is by definition a device that realizes *any* boolean function of $\alpha$ variables at unit cost. Slice the word-level table of panel (a) into its output bits: bit $j$ of $CX$ is a single boolean function of the $w_X$ bits of $X$. If $w_X\le\alpha$, each of those functions has at most $\alpha$ variables, so each costs **exactly one LUT** (p. 383). That is panel (b): $w_X+w_C$ LUTs in parallel, all fed by the same $w_X$ address wires, one LUT of delay end to end.

**No structure can beat it, because the cost has already collapsed onto the output width.** Any circuit built from $\alpha$-input LUTs must devote at least one LUT to each output bit that depends on more than one input, since one LUT drives one bit. The tabulated multiplier meets that bound with equality, so within the LUT cost model it is not merely good but optimal, and no adder graph can improve on it — a shift-and-add graph pays roughly $w_C$ LUTs *per adder*, and it needs at least one. The corollary is that the value of $C$ becomes completely irrelevant: a lucky constant like $2^k+1$ and an adversarial one such as a 5-bit prime cost the same, because both are only table contents. Every other technique in this topic spends its intelligence on the bit pattern of $C$; this one refuses to look at it.

**One bit past $\alpha$ the same argument runs backwards.** Take $w_X=\alpha+k$. Output bit $j$ is now a function of $\alpha+k$ variables, and the way to build it from $\alpha$-input pieces is Shannon decomposition on the $k$ excess variables: expand $f$ over all $2^k$ valuations of the high $k$ bits, each cofactor being a function of only the remaining $\alpha$ low variables, then select among the cofactors using the high bits as an address. That costs $2^k$ LUTs per output bit plus the address-decoding multiplexer, which may or may not be free in the fabric (p. 383). The book gives the $k=1$ case explicitly — 2 LUTs per output bit plus one decoding multiplexer — and the general $2^k$ figure. Doubling per input bit is exponential in $w_X$, so this technique has a hard ceiling rather than a soft one: excellent at $w_X=6$, tolerable at 7, indefensible at 12.

> [!important]
> You never write the table. Writing `C * X` in the HDL and letting the mapper enumerate the truth table gives exactly this circuit, because technology mapping of a combinational cone whose support is $\le\alpha$ *is* tabulation. Hand-writing a $2^{w_X}$-entry ROM produces the same netlist from more source that can be got wrong.

**On an ASIC the $\alpha$ cliff does not exist.** There is no architectural LUT, so the cost of the table is the cost of minimising a $w_X$-input, $(w_X+w_C)$-output truth table into standard cells — smooth in $w_X$, strongly dependent on the bit pattern of $C$ (the exact opposite of the FPGA case), and precisely what a logic synthesiser does unaided. "Cheapest possible, then abruptly worst possible" is an artefact of quantising logic into $\alpha$-input tiles; see [[Lookup-Tables]] and [[FPGAs]]. A hard block memory can hold the same table on either target, trading the LUT count for one BRAM and a longer, usually registered, access path.

**It is a special case of a more general facility.** $f(x)=Cx$ is one function among many, and a generator that tabulates arbitrary $f$ subsumes this circuit entirely: FloPoCo's fix-by-real KCM defaults to tabulation for very small input sizes, and the identical operator can be obtained by handing $f(x)=Cx$ to the universal table generator (p. 387). The durable content of this note is therefore not the construction but the threshold, and [[Table-Based Function Evaluation]] inherits both the $w_X\le\alpha$ regime and the collapse beyond it.

$$\boxed{\ \#\mathrm{LUT}=(w_X+w_C)\cdot 2^{\max(0,\;w_X-\alpha)}\quad(+\ \text{address decoding}),\qquad \text{delay}=1\ \text{LUT for }w_X\le\alpha\ }$$

**When it breaks.**

- $w_X>\alpha$, which is the whole story. [[KCM, Table-Based Constant Multiplication]] takes over by tabulating $\alpha$-bit *chunks* of $X$ and summing them, converting the exponential into a linear cost.
- Real (non-integer) $C$: the entries have infinitely many bits and must be rounded, turning an exact circuit into an approximate one with an error budget — [[Tabulated Perfectly Rounded Constant Multiplier]].
- Several constants sharing one input: tabulating each separately duplicates the address decoding — [[Table-Based Multiple Constant Multiplication]].
- The optimality claim is stated in the LUT cost model only. Against a DSP block or a hardened multiplier the comparison is a different currency entirely.

> [!warning] Not covered in the source — needs outside research
> Neither p. 383 nor the surrounding section quantifies the address-decoding multiplexer for $w_X=\alpha+k$, nor the $w_X$ at which a block-RAM implementation of the same table overtakes the LUT array. Both are device-specific and would need measurement.

```spade
entity tab_mul_21(x: uint<6>) -> uint<11> {
    let c: uint<6> = 21;
    trunc(x * c)
}
```

The whole circuit is that one combinational expression. `x` is the $w_X=6$-bit address bus running along the top of panel (b), and the 11-bit result is the row of output bits at the bottom. Spade's `*` doubles the width, giving `uint<12>`, and `trunc` cuts it back to the $w_X+w_C=11$ bits the bound above guarantees are sufficient — lossless here because $63\times21=1323<2^{11}$, and it would silently wrap if $w_C$ were understated. `c` is declared `uint<6>` rather than `uint<5>` only because `*` requires both operands to have the same width; the constant is still a 5-bit value. No clock and no register: this is a pure cone of logic. What synthesis does differently from the drawing is that it never builds a multiplier at all — the mapper sees a 6-input cone and emits 11 LUT init masks, so the `*` in the source and the LUT array in the figure are the same object seen from opposite ends.

## Related Notes

- [[Lookup-Tables]] – depends-on: the $\alpha$-input LUT is the cost unit that makes this circuit optimal, and the quantisation that makes it collapse.
- [[FPGAs]] – depends-on: the "one LUT per output bit" result is FPGA-specific and has no ASIC analogue.
- [[KCM, Table-Based Constant Multiplication]] – extends: applies this table to $\alpha$-bit chunks of $X$ and sums them, buying linear rather than exponential growth for one adder of delay.
- [[Table-Based Function Evaluation]] – compares: the same table and the same $w_X\le\alpha$ threshold for an arbitrary $f$, of which $Cx$ is one instance.
- [[Tabulated Perfectly Rounded Constant Multiplier]] – extends: same structure, real $C$, entries rounded offline so the operator is correctly rounded by construction.
- [[Binary Shift-and-Add Constant Multiplier]] – counter-example: the adder-graph family whose careful exploitation of $C$'s bit pattern this circuit beats outright below $\alpha$ bits and loses to immediately above.
- [[Table-Based Multiple Constant Multiplication]] – extends: one address, several constants, shared decoding.
- [[Choosing a Constant Multiplier]] – compares: where this sits against every sibling once $w_X$, $w_C$ and the target are fixed.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §12.2 "Integer Constant Multiplication Using Tables" and §12.2.1 "Tabulated Constant Multipliers", p. 383 — Fig. 12.9, the parameter $\alpha$ and its 4-to-6 range, the $w_X\le\alpha$ cost, and the $2^k$ LUTs per output bit for $w_X=\alpha+k$.
  - §12.2.2 "The Table-and-Addition KCM Algorithm", pp. 384-385 — the technique that replaces this one past the threshold.
  - §12.3.1 "Tabulated Perfectly Rounded Constant Multipliers", p. 387 — Fig. 12.12 and the FloPoCo hands-on box: tabulation as the default for very small inputs, via the universal table generator.
