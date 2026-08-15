---
title: Direct eY Table
description: "A single ROM addressed by the whole reduced argument Y — no arithmetic at all, and the only eY evaluator that is correctly rounded; costs 2^(wF+g) entries, so it dies above about 8 fraction bits."
kind: circuit
source: "ASA §22.5 intro, pp. 654-655 (cf. §22.2.4, p. 645)"
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey, table, rom, exponential, bfloat, fpga]
aliases:
  - Direct eY Tabulation
  - Direct Tabulation of eY
  - eY Table
---

# Direct eY Table

Evaluate the reduced-argument exponential by looking $e^Y$ up in one ROM addressed by every bit of $Y$: the only architecture in this topic that contains no arithmetic, and the only one whose output is correctly rounded.

```tikz title="Direct e^Y table: the whole reduced argument is the ROM address"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- the reduced argument Y, one word ----
  \draw (-3.0,7.0) rectangle (3.0,7.6);
  \draw (-2.4,7.0) -- (-2.4,7.6);
  \node at (-2.7,7.3) {$s$};
  \node at (0.3,7.3) {fraction bits of $Y$};
  \node[anchor=east] at (-3.1,7.3) {$Y$ \ \texttt{sfix}$(-1,\ell)$};
  \node[anchor=south,font=\footnotesize] at (-2.7,7.62) {pos.\ $-1$};
  \node[anchor=south east,font=\footnotesize] at (3.05,7.62) {pos.\ $\ell=-w_F-g$};
  \node[anchor=west] at (3.15,7.3) {$w_F+g$ bits};

  % ---- address ----
  \draw[->] (0,7.0) -- (0,6.3);
  \node[anchor=west,font=\footnotesize] at (0.1,6.65) {address: the whole word, sign bit included};

  % ---- the table ----
  \draw (-3.5,5.1) rectangle (3.5,6.3);
  \node[align=center] at (0,5.7)
    {ROM, $2^{\,w_F+g}$ entries $\times\ (w_F+g+1)$ bits\\[1pt]
     entry$[Y]=\mathrm{RN}\!\left(e^{Y}\right)$};

  % ---- output ----
  \draw[->] (0,5.1) -- (0,4.3);
  \node[anchor=west] at (0.1,4.7) {$M$ \ \texttt{ufix}$(0,\ell)$, \ $w_F+g+1$ bits};

  % ---- annotations ----
  \node[anchor=west,align=left,font=\footnotesize] at (3.75,5.7)
    {no adder,\\ no multiplier};
  \node[anchor=north,align=center,font=\footnotesize] at (0,4.1)
    {$\bar\delta_{\mathrm{arch}}\le u/2$, \ $u=2^{\ell}$ \ (correctly rounded)\\[1pt]
     latency: one memory read\\[3pt]
     BFloat, $w_F=7$, $g=3$: \ $2^{10}\times11=11$ Kbit\\
     binary16, $w_F=10$, $g=3$: \ $2^{13}\times14=112$ Kbit\\
     IEEE single, $w_F=23$, $g=3$: \ $2^{26}\times27\approx1.7$ Gbit};
\end{circuitikz}
\end{document}
```

*$\ell=-w_F-g$ and $u=2^{\ell}$ throughout; Kbit is $1024$ bits, matching the book's own usage.*

**Both formats are fixed before any design choice is made.** The reduced argument arriving from the range reduction of [[Floating-Point Exponential]] is $Y\in[-\tfrac12,\tfrac12]$ held as `sfix`$(-1,\ell)$ with $\ell=-w_F-g$ and $g\ge3$: MSB at position $-1$, LSB at position $\ell$, hence $-1-\ell+1 = w_F+g$ bits. Its exponential satisfies $e^{-1/2}=0.6065\le e^Y\le e^{1/2}=1.6487<2$, so the MSB of the result sits at position $0$ and the output $M$ is `ufix`$(0,\ell)$ — one bit wider than the input at $w_F+g+1$ bits. Those two widths are the entire specification of this circuit; see [[Number Formats]] for the `sfix`/`ufix` notation and [[Floating-Point Formats]] for where $w_F$ comes from.

> [!warning] Source states a bound slightly above the true one
> p. 655 gives the output range as $e^Y\in[0.65,1.65]$, but $e^{-1/2}=0.6065<0.65$. Only the *upper* bound matters — it is what puts the MSB at position $0$ and what supplies the amplification factor $1.65$ in the [[Higher-Order eY Architecture]] error budget — so nothing downstream is affected. Use $[0.6065,\,1.6487]$ if you need a tight range.

**The whole word is the address, so the sign bit costs nothing.** Every other architecture in this topic must split $Y$ and then reason about the sign of the high part; here the address is $Y$'s bit pattern verbatim. Reading a two's-complement `sfix`$(-1,\ell)$ word as an unsigned integer maps $Y\ge0$ to addresses $0\ldots2^{w_F+g-1}-1$ and $Y<0$ to the *upper* half $2^{w_F+g-1}\ldots2^{w_F+g}-1$, by the two's-complement identity $\text{unsigned}(x) = x\cdot2^{-\ell} \bmod 2^{w_F+g}$. That reordering is a permutation of the address space, and a permutation of the address space is absorbed for free into the order the entries are written in. There is no decoder, no sign extension, and no correction term — the wire from $Y$ to the address port is the identity function on bits.

**Correct rounding is obtained by enumeration, not by argument.** Fill entry $i$ with $\mathrm{RN}(e^{Y_i})$ computed offline in arbitrary precision. Then by definition of round-to-nearest ([[Rounding]]),

$$\bar\delta_{\mathrm{arch}} \;=\; \max_i\left|M_i - e^{Y_i}\right| \;\le\; \tfrac12\,\mathrm{ulp} \;=\; \tfrac{u}{2},\qquad u=2^{\ell}.$$

The Table Maker's Dilemma — not knowing how much precision suffices to decide a rounding — never arises, because there are only $2^{w_F+g}$ arguments and the table generator can simply push the offline precision up until every one of them decides. Exhaustive tabulation is the one construction where correct rounding is a build-time property rather than a proof obligation. Every arithmetic sibling lands between $3u$ and $6u$ instead ([[Higher-Order eY Architecture]]), because each of its truncations, multipliers and sub-approximations contributes a term to a telescoping budget; see [[Error Accuracy]] for how those terms compose.

> [!important] Correctly rounded *as an $e^Y$ evaluator* is not correctly rounded *as an exponential*.
> $M$ is the correctly rounded exponential of the $Y$ it was handed — but $Y$ is itself the lossy output of a floating-point range reduction that has already spent roughly $3u$ of the budget. The surrounding operator is therefore still only faithful. The genuinely correctly rounded option is to tabulate the *whole* operator (§22.2.4, p. 645), which is a different circuit with a different, larger table.

**Size is the only cost, and it is exponential in $w_F$.** The table holds

$$2^{\,w_F+g}\ \text{entries}\times(w_F+g+1)\ \text{bits},$$

so each extra fraction bit doubles it and each extra *guard* bit doubles it too. That second doubling is the sharper constraint in practice: architectures downstream can afford $g=4$ to buy slack in their error budget, whereas this one wants $g$ pinned at its minimum of $3$. At $w_F=7$ (BFloat) the table is $2^{10}\times11 = 11$ Kbit; at $w_F=10$ (binary16) it is already $112$ Kbit; at $w_F=23$ it is $\approx1.7$ Gbit and the architecture is simply gone. The book's own verdict (p. 655) is that this is a relevant option for the very small formats used in machine learning — BFloat, DLFloat, MSFP8-11 — and for nothing above them.

**On FPGA the table is embedded memory, which changes the shape of the trade-off but not its slope.** Below the capacity of one or two blocks the design is essentially free — no LUTs, no DSP, no carry chain — and the output register that block RAM provides anyway gives a pipelined operator for nothing ([[Block Memory]]). Past that capacity the growth is a cliff, not a slope, because block count jumps in integer steps and routing between blocks appears at the same moment. Contrast [[eY DSP and BRAM Mapping]], where a single-precision higher-order evaluator fits one BRAM plus one DSP: the arithmetic architectures buy their table size back with hard multipliers that the direct table cannot use because it has no multiplication to spend them on. On ASIC there is no such quantum — a $2^{10}\times11$ ROM or a synthesized mux tree scales smoothly — but the $2^{w_F}$ growth is unchanged. The general machinery for choosing table dimensions is [[Table-Based Function Evaluation]].

**Its real competitor is not the other $e^Y$ architectures.** Since this circuit needs no arithmetic, everything expensive in the operator around it is now the range reduction. Tabulating the *entire* floating-point exponential instead (§22.2.4) needs $2\times2^{4+7}\times15$ bits for BFloat — more than four times the table — but deletes the range reduction outright and is correctly rounded end to end. The book states plainly (p. 655) that it is unclear which of the two wins. So the decision to use this circuit is a decision about the hardware *in front of it*, not about the table itself.

$$\boxed{\ \mathrm{ROM}[Y]=\mathrm{RN}\!\left(e^{Y}\right),\qquad 2^{\,w_F+g}\times(w_F+g+1)\ \text{bits},\qquad \bar\delta_{\mathrm{arch}}=\tfrac{u}{2}\ }$$

**When it breaks.**

- Above roughly $w_F=8$ the table stops fitting the embedded memory of a small device, and above $w_F\approx10$ it stops being defensible at all; [[First-Order eY Architecture]] takes over by splitting $Y$ and paying one small multiplier.
- $g$ is not free here. Anywhere else in this topic an extra guard bit is a bit of wire; here it doubles the area, so this architecture can never be the one that absorbs a range-reduction accuracy shortfall.
- There is no design knob. The arithmetic architectures expose $k$ (and the polynomial one exposes $d$ as well), letting you trade table bits against multipliers; this one has a fixed area and a fixed latency and nothing to tune between them.
- Correct rounding does not survive composition — see the callout above. If a correctly rounded *operator* is the requirement, the direct tabulation of §22.2.4 is the circuit to reach for, not this one.
- If $Y$ ever leaves $[-\tfrac12,\tfrac12]$ the table is not merely inaccurate, it is unaddressable: there is no graceful degradation, so the range reduction's output bound is a hard precondition.

**RTL (Spade).**

```spade
/// Direct e^Y table for sfix(-1,-5) in, ufix(0,-5) out: w_F = 2, g = 3.
/// Entry i holds RN(2^5 * e^(Y_i)), Y_i = (i as two's complement) / 2^5.
entity exp_y_table(y: int<5>) -> uint<6> {
    let rom: [uint<6>; 32] = [
        32, 33, 34, 35, 36, 37, 39, 40,
        41, 42, 44, 45, 47, 48, 50, 51,
        19, 20, 21, 21, 22, 23, 23, 24,
        25, 26, 27, 27, 28, 29, 30, 31,
    ];
    rom[y.as_uint()]
}
```

`y` is the $Y$ word of the diagram (`int<5>` $=$ `sfix`$(-1,-5)$, the smallest instance with $g=3$), `rom` is the ROM box, and the return value is $M$ as `ufix`$(0,-5)$ — six bits, one wider than the input, exactly as the diagram's widths demand. `y.as_uint()` is the address wire: a reinterpretation of the same 5 bits with no logic behind it, which is why the second half of the array (addresses $16\ldots31$, i.e. $Y<0$) holds the entries below $32 = 1.0$ while the first half holds those above. The entity is purely combinational; synthesis will not leave it that way — at BFloat size it infers a block RAM whose output register adds a cycle the drawing does not show, and at this toy size a LUT mux tree.

Verified with `.zettel/sim.sh`: 3037 vectors, all 32 addresses exhaustively plus a 3000-vector random sweep, checked against `$rtoi($exp($itor($signed(y))/32.0)*32.0 + 0.5)` as an independent behavioural reference, with named asymmetric vectors at addresses $1$ and $16$ (which a bit-reversed address decode would swap).

**Related Notes.**

- [[Choosing an eY Architecture]] – compares: places this against the four arithmetic architectures and gives the crossover precisions.
- [[First-Order eY Architecture]] – extends: the cheapest architecture that splits $Y$ instead of tabulating it whole, and the one that takes over as soon as $2^{w_F+g}$ stops fitting.
- [[eA Table]] – extends: the same ROM primitive, but addressed by only the $k$ MSBs of $Y$, which is what makes the table size a knob instead of a fate.
- [[Higher-Order eY Architecture]] – counter-example: $4.7u$ of error and a multiplier, yet strictly better above single precision because its table stops growing with $w_F$.
- [[eY DSP and BRAM Mapping]] – compares: what one BRAM buys when there is arithmetic to spend a DSP on.
- [[Table-Based Function Evaluation]] – depends-on: the general theory of sizing and filling a function table.
- [[Block Memory]] – supports: the FPGA primitive this circuit compiles to in its entirety.
- [[Rounding]] – supports: the round-to-nearest that gives the $u/2$ bound.
- [[Floating-Point Formats]] – depends-on: BFloat, DLFloat and MSFP8-11 are the formats whose $w_F$ makes this viable.
- [[Floating-Point Exponential]] – depends-on: the operator that produces $Y$ and consumes $M$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5 introduction, tabulation of $e^Y$ for very small formats — pp. 654–655 (output format `ufix`$(0,-w_F-g)$; BFloat $2^{10}\times11$; comparison with §22.2.4)
- §22.2.4 "A First Architecture: Direct Tabulation" — p. 645 (Fig. 22.3; BFloat $2\times2^{4+7}\times15$ bits, correctly rounded)
- §22.5.1 for the $3u$–$6u$ error budgets of the arithmetic alternatives — pp. 655–659
