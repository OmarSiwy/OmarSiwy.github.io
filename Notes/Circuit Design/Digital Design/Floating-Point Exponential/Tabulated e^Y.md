---
title: Tabulated e^Y
description: "After range reduction the inner evaluator can be a single correctly-rounded ROM addressed by Y — 2^10 x 11 bits at BFloat, four times smaller than tabulating the whole operator, but it pays for the range-reduction hardware in front of it."
kind: circuit
source: "ASA §22.5, p. 655"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, table, rom, bram, bfloat]
aliases:
  - Tabulated eY
  - e^Y ROM
---

# Tabulated e^Y

The degenerate inner evaluator of a floating-point exponential: a $2^{w_F+g}\times(w_F+g+1)$-bit ROM addressed by the whole reduced argument $Y$, with no arithmetic at all after the range reduction, and the only $e^Y$ evaluator whose output is correctly rounded.

```tikz title="The e^Y ROM in the FPExp datapath, with its table area drawn to scale against direct tabulation"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small]
  % =============== datapath: the ROM in its context ===============
  \draw[-latex] (-0.5,9.15) -- (-0.5,8.7);
  \node[anchor=west,font=\footnotesize] at (-0.4,8.95) {$X$\quad\texttt{float}$(w_E,w_F)$};

  \draw (-3.4,7.9) rectangle (2.4,8.7);
  \node[font=\footnotesize] at (-0.5,8.3) {range reduction (Fig.~22.4 front end)};

  % E branch, routed clear on the far left
  \draw (-2.6,7.9) -- (-2.6,7.6) -- (-4.4,7.6) -- (-4.4,4.75);
  \draw[-latex] (-4.4,4.75) -- (-3.4,4.75);
  \node[anchor=south,font=\tiny,rotate=90] at (-4.5,6.1) {$E$, \ $w_E{+}1$ bits};

  % Y branch
  \draw[-latex] (0.6,7.9) -- (0.6,7.0);
  \node[anchor=east,font=\tiny] at (0.5,7.45) {$Y$\ \ \texttt{sfix}$(-1,-w_F{-}g)$, \ $w_F{+}g$ bits};

  \draw[thick] (-2.4,6.1) rectangle (2.8,7.0);
  \node[font=\footnotesize] at (0.2,6.73) {ROM $2^{\,w_F+g}\times(w_F{+}g{+}1)$};
  \node[font=\tiny] at (0.2,6.35) {BFloat: $2^{10}\times11 = 11$\,Kbit, one read};

  \draw[-latex] (0.6,6.1) -- (0.6,5.2);
  \node[anchor=east,font=\tiny] at (0.5,5.65) {$M$\ \ \texttt{ufix}$(0,-w_F{-}g)$, \ $w_F{+}g{+}1$ bits};

  \draw (-3.4,4.3) rectangle (2.4,5.2);
  \node[font=\footnotesize] at (-0.5,4.93) {normalize -- round -- pack};
  \node[font=\tiny] at (-0.5,4.57) {1-bit shift on the MSB of $M$, then round to $-w_F$};
  \draw[-latex] (-0.5,4.3) -- (-0.5,3.75);
  \node[anchor=west,font=\footnotesize] at (-0.4,3.95) {$R$\quad\texttt{float}$(w_E,w_F)$};

  % =============== address map inset ===============
  \node[anchor=west,font=\tiny] at (3.6,7.45)
    {the address is the $w_F{+}g$ two's-complement bits of $Y$, verbatim:};
  \draw (3.9,6.5) rectangle (9.3,7.05);
  \draw (6.6,6.5) -- (6.6,7.05);
  \node[font=\tiny] at (5.25,6.775) {addresses $0\ldots511$};
  \node[font=\tiny] at (7.95,6.775) {addresses $512\ldots1023$};
  \node[anchor=north,font=\tiny] at (5.25,6.45) {$Y = 0 \ \to\ +\tfrac{511}{1024}$};
  \node[anchor=north,font=\tiny] at (7.95,6.45) {$Y = -\tfrac12 \ \to\ -\tfrac{1}{1024}$};
  \node[anchor=west,font=\tiny] at (3.6,5.55)
    {no bias adder --- the wrap is baked into the stored order};

  % =============== to-scale area comparison ===============
  \node[anchor=west,font=\footnotesize] at (-4.5,2.75) {Table area, drawn to scale (width $\propto$ entries, height $\propto$ word):};

  \fill[black!12] (-4.4,0.9) rectangle (-0.4,2.4);
  \draw (-4.4,0.9) rectangle (-0.4,2.4);
  \node[font=\tiny,align=center] at (-2.4,1.65) {$2^{12}\times15$\\$=60$\,Kbit};
  \node[anchor=north,font=\tiny,align=center] at (-2.4,0.8)
    {direct tabulation of $e^X$\\\emph{correctly rounded}; no reduction hardware};

  \fill[black!30] (1.0,0.9) rectangle (2.0,2.0);
  \draw (1.0,0.9) rectangle (2.0,2.0);
  \node[font=\tiny,align=center] at (1.5,1.45) {$2^{10}$\\$\times11$};
  \node[anchor=north,font=\tiny,align=center] at (1.5,0.8) {tabulated $e^Y$\\$11$\,Kbit, $5.45\times$ smaller};

  \node[font=\large] at (2.6,1.45) {$+$};

  \fill[black!6] (3.2,0.9) rectangle (8.0,2.0);
  \draw[dashed] (3.2,0.9) rectangle (8.0,2.0);
  \node[font=\tiny,align=center] at (5.6,1.45)
    {shifter, two constant multipliers,\\subtractor, negate};
  \node[anchor=north,font=\tiny,align=center] at (5.6,0.8)
    {the price of the small table --- paid in LUTs and DSPs,\\so the two columns are not comparable in bits};
\end{circuitikz}
\end{document}
```

*Own construction from §22.5, p. 655, with the BFloat $=$ IEEEfloat$(8,7)$, $g=3$ instance the book quotes. The two rectangles at the bottom are drawn at true relative area: $2^{12}\times15$ against $2^{10}\times11$.*

**Take the reduced argument and read it as an address.** The range reduction of [[Reduced Argument Subtractor]] delivers $Y$ in `sfix`$(-1,\,-w_F-g)$ — bit positions $-1$ down to $-w_F-g$, so exactly $w_F+g$ bits, and by construction that bit vector is the *entire* state the inner evaluator is allowed to depend on. A function of $n$ bits is a $2^n$-entry table, and there is nothing to be clever about: address $=Y$, one read, done. Every other architecture in [[Fixed-Point Computation of eY]] exists only because $2^{w_F+g}$ eventually stops fitting; none of them is *simpler* than this.

**Fix the word width from the range of $e^Y$, not from the format.** Because $Y\in[-\tfrac12,\tfrac12)$, $e^Y\in[0.6065,1.6487]$ — strictly positive, so no sign bit, and bounded by $2$, so the MSB sits at position $0$ and never moves. The stored word is therefore `ufix`$(0,\,-w_F-g)$: positions $0$ down to $-w_F-g$, $w_F+g+1$ bits, no exponent field, no sign, no leading-zero encoding. That fixed MSB is the whole reason the inner evaluation can be fixed point at all (see [[Number Formats]] for what a static format buys); a function whose output crossed a power of two would need either a wider word or a normalising shifter behind the ROM.

**Skip the bias adder — two's complement is already a bijection onto the address space.** $Y$ is signed, addresses are not, so the instinct is to add $2^{w_F+g-1}$ to centre it. Do not. The map $n\mapsto n \bmod 2^{w_F+g}$ from two's-complement patterns to unsigned addresses is a bijection, so feeding the raw bits in stores the table in *rotated* order: addresses $0\ldots2^{w_F+g-1}-1$ hold $e^Y$ for $Y\ge0$ and the upper half holds $Y<0$. A ROM has no opinion about the order of its own contents, and the rotation costs exactly zero gates. This is the general table-addressing argument of [[Table-Based Function Evaluation]] in its cheapest possible case: the argument needs no transformation at all.

**Price it against the table it replaces.** [[Direct Tabulation Exponential]] tabulates the whole operator: $\lceil\log_2(w_E+w_F+1)\rceil+w_F$ address bits for one sign, $+1$ more to fold both signs into one table, and a $w_E+w_F$-bit word (the output sign is a known constant). Tabulating $e^Y$ instead uses $w_F+g$ address bits and a $w_F+g+1$-bit word, so the ratio is

$$\frac{2^{\lceil\log_2(w_E+w_F+1)\rceil+w_F+1}\,(w_E+w_F)}{2^{w_F+g}\,(w_F+g+1)} \;=\; 2^{\,\lceil\log_2(w_E+w_F+1)\rceil+1-g}\cdot\frac{w_E+w_F}{w_F+g+1}$$

with the $2^{w_F}$ cancelling — **the shrink is independent of the fraction width.** For BFloat $=$ IEEEfloat$(8,7)$ at $g=3$ the exponent term is $2^{4+1-3}=4$ and the word term is $15/11$, giving $2^{12}\times15 = 60$ Kbit against $2^{10}\times11 = 11$ Kbit, a factor $5.45$ — the book's "more than four times smaller" (p. 655). The saving comes from two places only: the range reduction destroys $\lceil\log_2(w_E+w_F+1)\rceil+1$ address bits' worth of input dynamic range, and $g$ buys $g$ of them back.

**Cash the accuracy, then discover you cannot spend it.** Every entry can be the correctly rounded $e^Y$ at LSB $\ell=-w_F-g$, so $\bar\delta_{\mathrm{arch}} = \tfrac12 u$ with $u=2^{-w_F-g}$ — against a budget of $1-2u$ from [[FPExp Operator]]'s error analysis, this is the most accurate inner evaluator in the chapter by a factor of two. Push it back through the binding branch (22.18), $|\delta_R| < 2^{-w_F-1} + 2|\delta_{\mathrm{arch}}| + 2(1+u)|\delta_Y|$ with $\bar\delta_Y=1u$:

$$|\delta_R| < 4u + 1u + 2u = 7u < 8u = 2^{-w_F}$$

so $g=3$ is faithful with $1u$ to spare. That spare ulp is not a guard bit. At $g=2$ the internal ulp coarsens to $u=2^{-w_F-2}$, the final rounding term alone becomes $2^{-w_F-1}=2u$, and the same sum gives $2u+1u+2u=5u=1.25\cdot2^{-w_F}$ — over budget. **The final rounding to $w_F$ bits takes half the budget no matter what the evaluator does**, so a perfect inner evaluator cannot shrink $g$, and since $g$ sits in the table's exponent, a perfect evaluator cannot shrink its own table either. See [[Rounding]] for why that $2^{-w_F-1}$ term is irreducible.

> [!important] A correctly rounded table does not make a correctly rounded operator
> The ROM returns the correctly rounded $e^Y$ *for the $Y$ it was handed*, and that is all. Upstream, $Y$ already carries $\bar\delta_Y=1u$ from the constant multiplication by $\ln 2$; downstream, $M$ is rounded again to $w_F$ bits. Correct rounding survives neither. [[Direct Tabulation Exponential]] is correctly rounded precisely because nothing at all happens on either side of its table — $X$ is the exact address and the entry is the exact result. That is the property being traded away for $5.45\times$ fewer bits, and it is why the book calls the comparison undecided rather than won.

**Map it to a tile, and watch the $5.45\times$ collapse to $2:1$.** On an AMD FPGA the 36 Kbit block is configurable down to $1024$ deep, so $2^{10}\times11$ is **one** tile using $11$ of its $36$ available bits; the $2^{12}\times15$ direct table needs $4096$ deep, where the widest supported aspect ratio is $9$ bits, hence **two** tiles ([[Block Memory]]). A $5.45\times$ shrink in bits buys exactly one BRAM, and leaves 69% of the surviving tile stranded. On ASIC there is no quantisation: a compiled ROM macro or synthesised logic costs what its bits cost, the $5.45\times$ is a real $5.45\times$, and this architecture looks considerably better than it does on an [[FPGAs|FPGA]]. Note also that the "one read" in the diagram is a throughput figure, not a latency one — a BRAM read is registered, adding one to two cycles the combinational drawing does not show.

$$\boxed{\ \text{ROM} = 2^{\,w_F+g}\times(w_F+g+1)\ \text{bits},\qquad \bar\delta_{\mathrm{arch}} = \tfrac12 u\ }$$

**When it breaks.**

- **Above about 8 fraction bits.** The table is $2^{w_F+g}$ entries with $g\ge3$ fixed by the error budget, so it doubles per fraction bit with no compensating term. BFloat $(w_F=7)$: 11 Kbit. binary16 $(w_F=10)$: $2^{13}\times14 = 114$ Kbit, already several tiles, and [[First-Order e^Y Evaluator]] does the same job in a $2^7$-entry table and one small multiplier. Single precision $(w_F=23)$: $2^{26}\times27\approx1.8$ Gbit. The book restricts this option to "the very small formats used for machine learning such as BFloat, DLFloat, and MSFP8-11".
- **Any pressure that raises $g$ to 4 doubles the table.** The XOR-only `negate` shortcut and the flattened-guard-bit analyses of [DD07] and [PS09] all push $g$ up; here that is not one extra bit on a datapath, it is $2\times$ the entire memory.
- **The upstream cost does not go away.** The shifter, the two constant multipliers, the subtractor and the negate are still there, and at BFloat scale they plausibly cost more than the 49 Kbit they saved — which is why the parent chapter leaves the comparison against direct tabulation open.
- **It is the wrong answer when correct rounding is the requirement.** See the callout above; [[Direct Tabulation Exponential]] is the only exponential architecture in the chapter that delivers it.

> [!warning] Not covered in the source — needs outside research
> The book gives no LUT, BRAM, DSP or delay figures for any exponential architecture, and states outright that whether this table beats direct tabulation "is unclear" (p. 655) — the range-reduction overhead has never been quantified against the 49 Kbit it saves. The tile counts above are read off published BRAM aspect ratios, not off a synthesis run.

**RTL.** A ROM in Spade is an array indexed by a runtime value. Shown at $\ell=-4$ (that is $w_F=1$, $g=3$) so the 16 entries fit on the page; the BFloat instance is character-for-character the same entity with a generated 1024-entry array.

```spade
// e^Y ROM: Y in sfix(-1,-4) (4-bit two's complement), M in ufix(0,-4) (5 bits)
entity exp_y_rom4(y: int<4>) -> uint<5> {
    let table: [uint<5>; 16] = [
        16, 17, 18, 19, 21, 22, 23, 25,   // addresses 0..7:   Y = 0 .. +7/16
        10, 10, 11, 12, 12, 13, 14, 15,   // addresses 8..15:  Y = -1/2 .. -1/16
    ];
    table[y.as_uint()]
}
```

`y` is the $Y$ wire of the diagram, `table` is the ROM box, and the return value is $M$; the two halves of the array literal are the two halves of the address-map inset, which is why the sequence is not monotone. Entry $i$ is $\lfloor e^{Y}\cdot 2^{4}+\tfrac12\rfloor$, the correct rounding that gives $\bar\delta_{\mathrm{arch}}=\tfrac12 u$. The `as_uint` is a reinterpretation, not a conversion — it is the zero-gate two's-complement-to-address bijection argued above, and it is the only operator in the entity. Widths: $4$ in, $5$ out, no growth rule involved because there is no arithmetic. The block is combinational as drawn, and at 16 entries synthesis will keep it that way in LUTs; at $2^{10}$ entries the tool infers a block RAM instead and inserts a read register the drawing does not show.

Verified by exhaustive sweep of all 16 addresses plus 3000 random vectors against a Verilog `$exp` reference, including the asymmetric pairs $Y=+\tfrac{1}{16}\to17$ against $Y=-\tfrac{1}{16}\to15$ and $Y=+\tfrac{7}{16}\to25$ against $Y=-\tfrac12\to10$, which a reversed or mis-signed address decode would fail.

**Related notes.**

- [[Direct Tabulation Exponential]] – compares: the same idea applied to $X$ instead of $Y$, four times the bits but correctly rounded and with no reduction hardware in front.
- [[Reduced Argument Subtractor]] – depends-on: produces the $w_F+g$-bit $Y$ that is this table's address, and contributes the $\bar\delta_Y=1u$ that destroys correct rounding.
- [[Exponential Normalize-Round-Pack]] – supports: consumes $M$ and applies the final $2^{-w_F-1}$ rounding that eats half the error budget.
- [[First-Order e^Y Evaluator]] – extends: replaces the full table by a $2^k$-entry $e^A$ table and one multiplier once $2^{w_F+g}$ stops fitting.
- [[Higher-Order e^Y Evaluator]] – extends: the same trade pushed further, trading a second table and a square multiplier for another halving of the address space.
- [[Choosing an Exponential Architecture]] – compares: where the crossover between this and the multiplier-based evaluators actually sits.
- [[Block Memory]] – supports: the tile geometry that turns a $5.45\times$ bit saving into a $2:1$ tile saving.
- [[Table-Based Function Evaluation]] – depends-on: the general theory; this is its degenerate case, a plain ROM with no argument transformation.
- [[Rounding]] – supports: why the correctly rounded entries do not survive to the output.
- [[Fixed-Point Computation of eY]] – compares: the full family of inner evaluators this is the cheapest and smallest-range member of.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22:

- §22.5 Fixed-point computation of $e^Y$ — pp. 654–655: the $Y\in[-\tfrac12,\tfrac12]$, `sfix`$(-1,-w_F-g)$ input and `ufix`$(0,-w_F-g)$ output formats; the BFloat $2^{10}\times11$ table, its comparison to the $2^{12}\times15$ table of Fig. 22.3, and the statement that the comparison is unclear.
- §22.2.4 A first architecture: direct tabulation — pp. 645–646 (Fig. 22.3): the $2^{12}\times15$ figure and the sign-folding that supplies the extra address bit.
- §22.3.8 Overall error analysis — pp. 651–653: (22.18), $\bar\delta_Y=1u$, and the $g=3$ closure re-run here with $\bar\delta_{\mathrm{arch}}=\tfrac12u$.
- §22.5.4 FPGA-specific remarks — p. 661: BRAM-oriented sizing of exponential tables.

Long-form treatment: [[Floating-Point Exponential]] and [[Fixed-Point Computation of eY]].
