---
title: "Lookup-Tables"
description: "A 2^alpha-bit SRAM read through a 2^alpha:1 multiplexer — realizes ANY Boolean function of alpha inputs, which is why FPGA area is counted in LUTs and not in gates."
kind: circuit
source: "ASA §4.1.1, pp. 89-91 (Figs. 4.2-4.4, eqs. 4.1-4.3)"
status: seed
spade: simulated
tags: [digital, fpga, lut, sram, boolean, mux]
aliases:
  - LUT
  - LUTs
  - Look-Up Table
  - Look-Up Tables
  - Lookup Table
  - Lookup Tables
  - LUT4
  - LUT6
  - k-LUT
---

# Lookup-Tables

A $2^\alpha$-bit SRAM read through a $2^\alpha{:}1$ multiplexer, storing a truth table verbatim — the one combinational primitive whose delay and area are the same for *every* function of its $\alpha$ inputs.

```tikz title="LUT4: 16 SRAM configuration cells addressed by a 16:1 multiplexer whose select lines are the four inputs"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,line width=0.5pt]
% ---- MUX body: vertical left edge carries all 16 data inputs, output on the right
\draw (1.8,0.6) -- (3.2,-0.4) -- (3.2,-4.9) -- (1.8,-5.9) -- cycle;
\node[rotate=90] at (2.55,-2.65) {$2^4{:}1$ MUX};

% ---- select inputs a..d drop onto the slanted top edge
\foreach \n/\x/\yh in {a/2.0/0.457, b/2.3/0.243, c/2.6/0.029, d/2.9/-0.186} {
  \draw (\x,1.55) -- (\x,\yh);
  \node[anchor=south] at (\x,1.58) {$\n$};
}
\node[anchor=west] at (3.05,1.35) {4 select bits};

% ---- SRAM configuration cells
\foreach \k/\y/\lbl in {0/-0.10/0, 1/-0.80/1, 2/-1.50/2, 3/-2.20/3, 4/-5.35/15} {
  \draw (0.55,{\y-0.17}) rectangle (0.95,{\y+0.17});
  \draw (0.95,\y) -- (1.8,\y);
  \node[anchor=west] at (1.86,\y) {\lbl};
}
\node at (0.75,-3.55) {$\vdots$};
\node at (1.95,-3.55) {$\vdots$};
\node[anchor=north,align=center] at (0.75,-5.75) {$2^4=16$ SRAM\\config cells\\(1 bit each)};

% ---- output
\draw (3.2,-2.65) -- (4.6,-2.65);
\node[anchor=south] at (3.9,-2.62) {$o$};
\node[anchor=north] at (3.9,-2.68) {1};
\end{circuitikz}
\end{document}
```

*After Fig. 4.3, p. 90.*

**Store the answer, not the derivation.** A LUT with $\alpha$ inputs — written **LUT$\alpha$** — is $2^\alpha$ SRAM cells of 1 bit each, addressed by the $\alpha$ input wires through a $2^\alpha{:}1$ multiplexer, producing 1 output bit (p. 89). Widths: $\alpha$ bits of address in, $2^\alpha$ bits of configuration held in the bitstream, 1 bit out. The cells hold the function's truth table column, one row per input combination, so the LUT realizes *any* Boolean function of $\alpha$ variables. That universality is a statement about truth tables, not about gates: there is nothing to prove beyond "a function of $\alpha$ bits has $2^\alpha$ rows, and we stored all of them". It is also the reason FPGA area is billed in LUTs rather than in gates — the gate count of the function you configured is not a quantity the fabric can observe.

**Turn universality into a recurrence.** The recursive statement is **Boole's (Shannon's) expansion theorem**, the same cofactor identity that builds multiplexer trees in [[Combinational Logic]]. Split the truth table on the last variable (eq. 4.1, p. 90):

$$f(a,b,c,d) \;=\; \overline{d}\wedge f_{\overline d}(a,b,c) \;\vee\; d \wedge f_d(a,b,c)$$

where the **cofactors** are obtained by substitution, not by manipulation (eqs. 4.2, 4.3):

$$f_{\overline d}(a,b,c) = f(a,b,c,0), \qquad f_d(a,b,c) = f(a,b,c,1)$$

The identity holds because for each fixed value of $d$ exactly one of the two conjunctions survives — $\overline d \wedge X \vee d \wedge Y$ is the definition of a 2:1 multiplexer with select $d$, and the complementary literals $\overline d, d$ are what makes the disjunction a *selection* rather than a merge. So the right-hand side is literally one MUX over two LUT3s:

$$\text{LUT}\alpha \;=\; 2\times\text{LUT}(\alpha-1) \;+\; 1\ \text{2:1 MUX}$$

Read forwards (Fig. 4.4, p. 91) this is how a LUT4 is built from LUT3s; read backwards it is why a LUT6 can be **fractured** into two LUT5s, which is what every AMD BLE since Virtex 5 does — see [[Fracturable LUT]]. The catch is on the address, not the data: the two halves of a real fracturable LUT sit behind the *same* input wires, so two independent LUT5s are only free when their support sets coincide.

**Why $\alpha$ lands between 4 and 6, and never moves.** Both terms of the cost grow as $2^\alpha$ — the SRAM cell count and the MUX size — while the delay of a $2^\alpha{:}1$ MUX built as a binary tree grows only as $\alpha$. Area is exponential, speed is logarithmic in area, so there is an interior optimum, and architectural exploration on real benchmark circuits found the best area–delay products for **4 to 6 inputs** [AR04] (p. 90). Every commercial family sits in that window, which is why the number has not drifted in twenty years despite everything else about the fabric changing. The consequence for the designer is a flat cost model: on a Virtex 6 at speed grade 3, one LUT6 costs $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns whether it is configured as a 6-input XOR or a 6-input AND (p. 127).

> [!important] The FPGA cost model is discontinuous at $\alpha$, and flat below it
> On ASIC, a 6-input XOR costs far more than a 6-input AND, and minimizing literals is the whole game. On FPGA both are exactly one LUT6 and one $\tau_{\text{LUT}}$, and the only question that matters is how many inputs a sub-function *touches*. Logic minimization is replaced by **support-set partitioning**: cut the netlist into pieces of $\le 6$ inputs. This is why an FPGA-optimal circuit and an ASIC-optimal circuit for the same function usually look nothing alike.

**Past $\alpha$, the cost doubles per input.** For an arbitrary $n$-input function with $n > 6$, apply the expansion $n-6$ times down to LUT6 leaves. You get $2^{n-6}$ residual 6-input functions plus a MUX tree over the $n-6$ select bits. One LUT6 implements a 4:1 MUX (4 data + 2 select), so the tree collapses 4 signals per LUT and needs $\lceil (2^{n-6}-1)/3 \rceil$ of them by the standard $k$-ary-tree internal-node count:

$$L(n) \;=\; 2^{n-6} + \left\lceil \frac{2^{n-6}-1}{3} \right\rceil \;\approx\; \frac{4}{3}\,2^{\,n-6} \quad\text{LUT6 per output bit}$$

$L(6)=1$, $L(8)=5$, $L(10)=21$, $L(16)=1365$. A blind $8\times8\to16$ multiplier table is a 16-input, 16-output function: $16\times1365 \approx 21{,}800$ LUT6, two orders of magnitude worse than the same product built as an array of partial products. **Any time a reported LUT count looks reasonable, it is because the mapper found algebraic structure** — never because the table was small. That exponential is also the entire motivation for [[Table-Based Function Evaluation]], whose techniques all attack the *address width* and nothing else.

**A LUT is a ROM, and the equality is exact.** A $2^6\times m$ table costs exactly $m$ LUT6, which is precisely the arbitrary-function bound $L(6)=1$ per output bit — not a coincidence but the same silicon counted twice. The output width is where the naive intuition fails: a LUT has **one** output bit, so an $m$-bit result costs $m$ LUTs even though all $m$ share the address decode. In a SLICEM the same cells become writable and the primitive turns into [[Distributed Memory]] or a [[Shift Register LUT]]; past roughly 11 address bits the dedicated tile of [[Block Memory]] takes over, and [[Choosing an FPGA Primitive]] draws the boundary.

$$\boxed{\ \text{LUT}\alpha \;=\; 2^\alpha\ \text{SRAM cells} \;+\; 2^\alpha{:}1\ \text{MUX} \;=\; 2\times\text{LUT}(\alpha-1) + \text{MUX},\qquad L(n)\approx\tfrac{4}{3}2^{\,n-6}\ }$$

**When it breaks.**

- **Above $\alpha$ inputs**, cost doubles per extra input. A function of 12 inputs that does not factor is 85 LUT6 *per output bit*; one of 20 is 21 thousand. The asymptotics never stop mattering — there is no width at which they soften.
- **Wide outputs get no discount.** $m$ output bits cost $m$ times the single-bit figure. Shared address logic is free only because the address wires are routing, not logic.
- **Fracturing is not free.** Two LUT5s in one LUT6 share the same five input wires. Two 5-input functions on disjoint supports need two whole LUT6s, so "half a LUT6" is a claim about the *support sets*, not about the functions.
- **The $[4,6]$ optimum is an average over benchmark circuits** [AR04], not a result about arithmetic. Arithmetic datapaths are dominated by the carry chain and 2-input XORs; they under-use $\alpha$, which is exactly the slack the merged-functionality adders in [[Adders]] spend.
- **Delay is flat in the function, not in the netlist.** Chaining LUTs is where time goes: $\tau_{\text{LUT}}$ per level plus programmable routing between them, and beyond a couple of levels routing dominates. The [[Fast Carry Chain]] exists precisely to bypass that routing.
- **Read-only unless the slice says otherwise.** Ordinary SLICEL/ALM LUTs are written once at configuration time. Runtime writes need a SLICEM.
- **No accuracy story.** A LUT is exact by construction; it emits the bit you stored. Every ulp of error in a table-based operator comes from the *values chosen* for the cells — a format and rounding decision, see [[Number Formats]] and [[Error Accuracy]] — never from the primitive.

**RTL (Spade).** The direct form and the Shannon-expanded form of the same LUT4, so the expansion theorem is checked rather than asserted:

```spade
/// LUT3: 8 configuration bits, 3 address bits, 1 output.
fn lut3(config: uint<8>, a: bool, b: bool, c: bool) -> bool {
    config.as_bits()[[a, b, c].as_uint()]
}

/// LUT4 as a direct 2^4-bit SRAM read: address the cells, emit the cell.
fn lut4(config: uint<16>, a: bool, b: bool, c: bool, d: bool) -> bool {
    config.as_bits()[[a, b, c, d].as_uint()]
}

/// The same function via Boole's expansion: two LUT3s and a 2:1 MUX.
fn lut4_shannon(config: uint<16>, a: bool, b: bool, c: bool, d: bool) -> bool {
    let cofactor_lo = config.as_bits()[0..8].as_uint();   // f_dbar : d = 0
    let cofactor_hi = config.as_bits()[8..16].as_uint();  // f_d    : d = 1
    if d { lut3(cofactor_hi, a, b, c) } else { lut3(cofactor_lo, a, b, c) }
}
```

`config` is the 16 SRAM cells of the diagram, `[a,b,c,d].as_uint()` is the 4-bit address on the MUX select lines (array element 0 is the LSB, so $a$ is the least significant address bit and the cell numbering matches the figure), and the array index *is* the $2^4{:}1$ MUX. In `lut4_shannon` the low and high halves of the same 16 bits are the cofactors $f_{\overline d}$ and $f_d$ — splitting the configuration word is all that eq. 4.1 amounts to structurally — and the `if d` is the one extra 2:1 MUX. Both are `fn`s, purely combinational; the optional flip-flop that would make this a [[Basic Logic Element]] belongs to the BLE, not to the LUT. Synthesis will do the one thing the drawing hides: with `config` tied to a constant the whole MUX tree constant-folds away, which is exactly what happens on a real FPGA — the "multiplexer" is never built, it is the bitstream.

**Related notes.**

- [[Basic Logic Element]] – depends-on: the LUT is layer one of the three-layer BLE; the carry chain and the flip-flop are layers two and three.
- [[Fracturable LUT]] – extends: Boole's expansion read backwards, splitting one LUT6 into two LUT5s behind shared inputs.
- [[Boolean Algebra]] – depends-on: cofactors, complementary literals and distributivity, which is all the expansion theorem uses.
- [[Combinational Logic]] – depends-on: the multiplexer tree the expansion recursion unrolls into.
- [[Table-Based Function Evaluation]] – extends: every technique there exists to shrink the address, because $L(n)$ doubles per input bit.
- [[Distributed Memory]] – extends: in a SLICEM the same SRAM cells become writable, turning the LUT into a $64\times1$ RAM.
- [[Shift Register LUT]] – extends: the same cells written sequentially, which reprograms the table at runtime through one wire.
- [[Block Memory]] – compares: past ~11 address bits the dedicated RAM tile is the cheaper table.
- [[Choosing an FPGA Primitive]] – compares: where LUT logic loses to a DSP block or a block RAM.
- [[Fast Carry Chain]] – counter-example: the one signal deliberately routed around the LUT, because $\tau_{\text{LUT}}$ plus programmable routing is too slow for a carry.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 4 "Field Programmable Gate Arrays":

- §4.1.1 Look-Up Tables and Flip-Flops, pp. 89–91 — minimal BLE (Fig. 4.2, p. 89), LUT4 realization as 16 SRAM cells plus a MUX (Fig. 4.3, p. 90), $2^\alpha$ growth of cells and MUX, best input sizes 4–6 [AR04], Boole's expansion eqs. 4.1–4.3 (p. 90), LUT4 from two LUT3s (Fig. 4.4, p. 91).
- §4.1.2 Basic Logic Elements of AMD FPGAs, pp. 91–92 — LUT6 fractured into two LUT5s with shared inputs.
- §4.3.1 Distributed memory, pp. 96–97 — the LUT reused as ROM/RAM, $64\times1$ per LUT6.
- §5.4.1 Addition support on AMD FPGAs, p. 127 — $\tau_{\text{LUT}} = 0.14\ldots0.32$ ns [Xil14].

Architectural exploration of LUT input size: Ahmed & Rose [AR04].
