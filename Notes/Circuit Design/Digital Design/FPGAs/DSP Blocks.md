---
title: DSP Blocks
description: "Hard multiplier wrapped in an optional pre-adder and post-adder computing R = (X0+X1)*Y+Z — a free multiplier until you run out, then the most expensive resource on the chip."
kind: circuit
source: "ASA §4.2, pp. 94-95 (eq. 4.4, Table 4.1)"
status: seed
spade: simulated
tags: [digital, fpga, dsp, multiplier, mac, hard-macro]
aliases:
  - DSP Block
  - DSP block
  - DSP blocks
  - DSP
  - DSP48
  - DSP48E2
  - DSP Slice
  - Hard Multiplier
  - Hard Multipliers
  - Embedded Multiplier
---

# DSP Blocks

A hardened multiplier sunk into the FPGA fabric as a fixed-size tile, fused with an optional pre-adder on one input and an optional post-adder on the output — the one primitive whose cost is a *count*, not a formula, because you either have a spare one or you do not.

```tikz title="DSP block datapath: 27-bit pre-adder, hard 27x18 multiplier, 48-bit post-adder, with the two optional pipeline registers"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]
\draw[dashed,rounded corners=3pt] (-0.4,-1.1) rectangle (13.2,1.7);
\node[anchor=south west] at (-0.4,1.75) {DSP48E2 (UltraScale+), one unit};

% pre-adder
\draw (1.9,-0.35) rectangle (3.3,0.95); \node at (2.6,0.3) {$+$};
\draw[->] (0.0,0.75) -- (1.9,0.75); \node[anchor=south] at (0.9,0.8) {$X_0$, 27};
\draw[->] (0.0,-0.15) -- (1.9,-0.15); \node[anchor=south] at (0.9,-0.1) {$X_1$, 27};

% multiplier
\draw (5.3,-0.35) rectangle (6.7,0.95); \node at (6.0,0.3) {$\times$};
\draw[->] (3.3,0.3) -- (5.3,0.3); \node[anchor=south] at (3.7,0.35) {27};
\draw[->] (6.0,1.4) -- (6.0,0.95); \node[anchor=west] at (6.05,1.2) {$Y$, 18};

% post-adder
\draw (8.9,-0.35) rectangle (10.3,0.95); \node at (9.6,0.3) {$+$};
\draw[->] (6.7,0.3) -- (8.9,0.3); \node[anchor=south] at (7.2,0.35) {45};
\draw[->] (9.6,1.4) -- (9.6,0.95); \node[anchor=west] at (9.65,1.2) {$Z$, 48 (cascade in)};

\draw[->] (10.3,0.3) -- (12.1,0.3); \node[anchor=south] at (11.2,0.35) {$R$, 48};
\node[anchor=north,font=\scriptsize] at (11.2,0.25) {(cascade out)};

% optional pipeline registers
\draw[dashed] (4.2,-0.1) rectangle (4.6,0.7); \node[anchor=north,font=\scriptsize] at (4.4,-0.2) {opt.\ reg};
\draw[dashed] (7.8,-0.1) rectangle (8.2,0.7); \node[anchor=north,font=\scriptsize] at (8.0,-0.2) {opt.\ reg};
\end{circuitikz}
\end{document}
```

*After eq. 4.4 and Table 4.1, pp. 94–95.*

**Read the DSP as one fused expression, not as three operators bolted together.** The whole block computes, in one pass (eq. 4.4, p. 94):

$$R = (X_0 + X_1) \times Y + Z$$

On an UltraScale+ DSP48E2 the widths are $X_0, X_1 : 27$ bits signed, $Y : 18$ bits signed, $Z : 48$ bits, $R : 48$ bits (Table 4.1, p. 95). Only the multiplier is exact by construction: a $27\times18$ signed product needs $27+18=45$ bits and gets exactly 45, so the middle stage never loses a bit. The two adders are the lossy ones. The pre-adder sums two 27-bit values into 27 bits, not 28, so it **wraps**; the post-adder sums a 45-bit product sign-extended into 48 with a 48-bit $Z$ and keeps 48, so it wraps too. The three extra bits above the product are the entire headroom the accumulator gets — enough for $2^3 = 8$ unguarded accumulations of full-scale products and no more, which is why anything longer needs a range argument from [[Number Formats]] rather than a hope.

**The post-adder is what makes a fixed-size tile composable.** A hard multiplier alone would be useless above its own width: any larger product decomposes into sub-products that must then be *summed at different shifts*, and summing them in fabric would spend the LUTs the DSP was supposed to save. The post-adder plus a dedicated cascade wire between vertically adjacent DSPs turns the sum into routing that never leaves the DSP column. Three uses fall out of the same adder. Building a wide multiplier from sub-multipliers is [[Multiplier Tiling]]. Multiply–accumulate — $Z$ fed from the block's own registered output — is what a FIR tap and a dot product are. And Horner's rule for polynomial evaluation, $p(x) = ((c_n x + c_{n-1})x + \dots)x + c_0$, is by construction a chain of multiply-then-add with no other operator in it, so an $n$-degree polynomial is $n$ cascaded DSPs and nothing else (p. 94).

**The pre-adder exists because a symmetric filter has half as many distinct coefficients as taps.** A linear-phase FIR of even length $N$ has $h_k = h_{N-1-k}$. Substituting that identity into the convolution and pairing the terms $k$ and $N-1-k$, which is legal by commutativity and associativity of the sum, collapses the tap count:

$$y[n] = \sum_{k=0}^{N-1} h_k\,x[n-k] = \sum_{k=0}^{N/2-1} h_k\,\bigl(x[n-k] + x[n-N+1+k]\bigr)$$

Each surviving term is literally $(X_0 + X_1)\times Y$ — one DSP, one coefficient, two delayed samples — so a symmetric filter costs **$N/2$ multipliers instead of $N$**, and the addition is free because the pre-adder was already sitting in the tile (p. 94). The same shape serves the two-part split of [[Karatsuba]] and the three-multiplication complex product; see [[LTI Filters]] for the delay-line side and [[Three-Multiplication Complex Product]] for the complex case.

> [!warning] The book's own equation is narrower than its own use of it
> Eq. 4.4 defines the pre-adder as $X_0 + X_1$, addition only. But eq. 4.8 on the same page needs $(A_r - A_i)B_r$, and the Karatsuba split of Sect. 8.6 needs $(A_H - A_L)$ — both require the pre-adder to **subtract**. Chapter 4 never says whether it can. Real DSP48E2 and Stratix units carry an add/subtract control on that stage, but that is vendor documentation, not this source; treat the sign as something to check per device.

**AMD widths are signed, so subtract a bit before you count.** Table 4.1 gives AMD sizes for signed operands only. A signed multiplier can do an unsigned multiplication by forcing the MSB — the sign bit — to zero, which costs one bit of each operand (p. 95). So an $18\times27$ *signed* unit is a $17\times26$ *unsigned* unit, and an unsigned $18\times18$ product does **not** fit in one UltraScale+ DSP even though the label says $18\times27$. Intel documents both signed and unsigned sizes and does not have this trap. Getting it wrong is not a compile error; it is a tiling that silently needs one more DSP than budgeted.

**Intel splits where AMD combines, and it changes the arithmetic you should choose.** AMD offers one fixed-size unit per DSP and expects you to tile upward. Intel allows two smaller multipliers per DSP whose results the *shared* post-adder sums — $2\times16\times16$ on Stratix V, $2\times18\times18$ on Stratix 10 (Table 4.1, p. 95). That mode is exactly the shape of a complex multiplication's real part, $A_rB_r - A_iB_i$: two products, one sum, one DSP. So on Intel a complex multiply is **two DSPs** by the naive 4-multiplication formula, and the 3-multiplication trick that wins on AMD buys nothing (p. 95). The right algorithm is a function of the tile, not of the operation count.

**The resource decision is a cliff, not a curve.** Take an unsigned $8\times8\to16$ product — a 16-input, 16-output Boolean function — and price it three ways on the same device. As a blind truth table in logic it is $16 \times L(16) = 21{,}840$ LUT6 (see [[Lookup-Tables]] for $L$). As a ROM it is $2^{16}\times16 = 1$ Mbit, thirty-two BRAM36 tiles in $2\text{k}\times18$ mode plus address decode ([[Block Memory]], Table 4.2, p. 99). In a DSP it is **one unit**, because $17\times26$ unsigned fits inside the $18\times27$ signed multiplier with room to spare. Three orders of magnitude, for free — right up to the moment the device's DSP count runs out, at which point the next multiplier costs a full tiling of LUTs and the marginal price jumps by those same three orders. That discontinuity is what [[Multiplier Tiling]] optimizes against and what [[Truncated Multipliers]] avoids paying at all, and [[Choosing an FPGA Primitive]] draws the boundaries.

Stratix 10 additionally hardens single-precision floating point: one block performs an FP multiply, an add/subtract, or a MAC [LP15] (p. 95).

> [!warning] Not covered in the source — needs outside research
> Chapter 4 gives no latency, no $f_{\max}$ and no register-stage count for DSP blocks, and the diagram's two pipeline registers are drawn from the equation's structure rather than from a figure in the book. Any timing claim about a DSP must come from the vendor datasheet.

> [!warning] The source contradicts itself on Stratix 10 dual-multiplier width
> The body text on p. 95 says the dual-multiplier mode uses "$16\times16$ for Stratix V and $18\times19$ for Stratix 10". Table 4.1 on the same page lists the Stratix 10 two-unit row as $18\times18$. One bit apart; the table is the more likely intent, but confirm against Intel documentation before sizing a tiling around it.

$$\boxed{\ R = (X_0 + X_1)\times Y + Z,\qquad 27 + 27 \to 27,\quad 27\times18 \to 45,\quad 45 + 48 \to 48\ }$$

**When it breaks.**

- **Operands exceed the hard width.** Past $18\times27$ signed (AMD) or $27\times27$ (Intel) the operator is no longer one DSP and becomes a tiling problem, with fabric adders on the critical path between tiles.
- **You run out of units.** This is the only FPGA resource whose cost function is a step. A design at 100% DSP utilization and 20% LUT utilization is not "efficient", it is one multiplier away from a redesign.
- **The unsigned bit.** Signed-only AMD sizing costs one bit per operand; a budget written against the nominal $18\times27$ is wrong by exactly the case that matters.
- **Accumulator headroom.** 48 bits minus a 45-bit product is 3 bits of guard. A long dot product overflows silently, because both adders wrap rather than saturate.
- **The pre-adder is on one input only.** $Y$ has no pre-adder. An expression needing $(X_0+X_1)(Y_0+Y_1)$ costs a fabric adder or a second DSP no matter how it is written.
- **Cascade routing is positional.** The dedicated $Z$ path runs between physically adjacent DSPs in a column, and vendor tools honour only specific relative shifts — a tiling that is optimal on paper can be unroutable on the die.
- **Small constants.** For a coefficient with few nonzero digits, shift-and-add in LUTs beats a DSP outright, and burning a scarce tile on $\times 3$ is the classic waste.
- **Below the tile, granularity is lost.** A $4\times4$ product occupies a whole $18\times27$ unit. The bit-level granularity that is the premise of this vault stops at the DSP boundary — inside the hard macro you pay for silicon you do not use.

**RTL (Spade).** The datapath of the diagram, with the real wrapping behaviour of both adders rather than the idealized widening one:

```spade
/// One DSP48E2 (UltraScale+): R = (X0 + X1) * Y + Z, all signed.
entity dsp48e2(x0: int<27>, x1: int<27>, y: int<18>, z: int<48>) -> int<48> {
    let a: int<27> = x0 +. x1;        // 27-bit pre-adder: wraps, does not grow
    let ye: int<27> = sext(y);
    let p: int<45> = trunc(a * ye);   // 27 x 18 -> 45 bits, exact
    let pe: int<48> = sext(p);
    trunc(pe + z)                     // 48-bit post-adder: wraps
}
```

`x0`/`x1`/`y`/`z` are the four labelled input wires and the return value is $R$; `a` is the 27-bit wire between the pre-adder and the multiplier, `p` the 45-bit wire between the multiplier and the post-adder. The two truncating operators are the whole point: `+.` is the wrapping 27-bit pre-adder and the final `trunc` is the wrapping 48-bit post-adder, whereas `trunc(a * ye)` from 54 down to 45 discards only sign-extension bits and is exact — sign-extending `y` to 27 bits is a Spade typing requirement (`*` needs equal operand widths) and costs no silicon, since the hard multiplier is natively $27\times18$. The block is written purely combinational; synthesis maps it to one DSP48E2 and will insert the tile's own pipeline registers around it, so the drawn `opt. reg` boxes are a synthesis attribute, not RTL.

Simulated against a behavioural Verilog reference: 10 named vectors — including the asymmetric $1 + 128$ and its transpose, $z$ pass-through, negative operands, and a pre-adder wrap at $2^{26}$ — plus 3000 random vectors over all four inputs. 3010/3010 pass.

**Related notes.**

- [[Multipliers]] – compares: the fabric-built multiplier the DSP replaces, and the cost model it is measured against.
- [[Multiplier Tiling]] – extends: covers a wide partial-product rectangle with DSP-sized tiles once one unit no longer suffices.
- [[Karatsuba]] – extends: uses the pre-adder to trade one sub-multiplier for two pre-additions, which is free only because the pre-adder is already there.
- [[Three-Multiplication Complex Product]] – extends: eqs. 4.5–4.8 mapped onto the pre- and post-adders of this block.
- [[LTI Filters]] – supports: the symmetric-FIR folding that the pre-adder exists to serve.
- [[Truncated Multipliers]] – compares: shrinks the product instead of spending a tile on the bits that get rounded away.
- [[Block Memory]] – compares: the other hard tile, and the other resource whose cost is a count rather than a formula.
- [[Lookup-Tables]] – counter-example: the resource with a smooth cost curve; the DSP has a step.
- [[Choosing an FPGA Primitive]] – compares: where the DSP row wins and where it loses across all three substrates.
- [[Number Formats]] – depends-on: the 3 bits of accumulator headroom are only safe with a range argument from the format.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 4 "Field Programmable Gate Arrays":

- §4.2 DSP Blocks, pp. 94–95 — eq. 4.4 $R = (X_0+X_1)\times Y + Z$; post-adder for combining blocks, MAC, polynomial evaluation and digital filters; pre-adder motivated by symmetric FIR and by Karatsuba (Sect. 8.6); complex product eqs. 4.5–4.8 with the shared term; Table 4.1 supported multiplier, pre-add and post-add sizes for Virtex 5/6/7, UltraScale(+), Stratix V and Stratix 10; AMD sizes signed-only and the MSB-zeroing rule; Intel dual-multiplier mode with shared post-adder and the two-DSP complex multiplication; Stratix 10 single-precision floating-point mode [LP15].
- §4.3.3 Block Memory, p. 98 and Table 4.2, p. 99 — 36 kbit AMD / 20 kbit Intel tiles and their depth–width configurations, used here for the $8\times8$ ROM comparison.
- §4.1.1, p. 90 — Boole's expansion and the $L(n)$ LUT6 cost used for the $8\times8$ logic comparison.
