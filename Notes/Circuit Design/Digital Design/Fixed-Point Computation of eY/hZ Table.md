---
title: hZ Table
description: "A small correctly-rounded ROM for h(Z) = e^Z - Z - 1, whose MSB sits at -2k-1 so the table is 2k bits narrower than e^Z; 2^8 x 6 bits for IEEE single, and it needs only the top bits of Z."
kind: circuit
source: "ASA 22.5.1, pp. 655-661"
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey]
aliases:
  - hZ ROM
  - h(Z) Table
  - eZ minus Z minus 1 Box
---

# hZ Table

A read-only table holding $h(Z)=e^{Z}-Z-1$, the one genuinely transcendental term left in the higher-order $e^Y$ datapath after $e^Z$ has had its leading $1$ and its linear term algebraically peeled off — which is what makes it $2k$ bits narrower, and therefore small enough to tabulate outright where $e^Z$ is not.

```tikz title="The h(Z) ROM: Z_trunc address, H output, and the 2k+1 provably-zero leading positions"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- the Z word and the Z_trunc tap ----------
  \draw (0,4.0) rectangle (8.5,4.6);
  \draw[very thick] (4.0,4.0) -- (4.0,4.6);
  \node at (2.0,4.3) {$Z_{\mathrm{trunc}}$};
  \node[font=\footnotesize] at (6.25,4.3) {dropped: $0\le e<2^{p}$};
  \node[anchor=east] at (-0.1,4.3) {$Z$};
  \node[anchor=east,font=\footnotesize] at (-0.1,3.85) {\texttt{ufix}$(-k-1,\ell)$};
  \node[anchor=south,font=\footnotesize] at (0.0,4.65) {$-k-1$};
  \node[anchor=south,font=\footnotesize] at (4.0,4.65) {$p$};
  \node[anchor=south,font=\footnotesize] at (8.5,4.65) {$\ell$};
  \draw[<->] (0,3.72) -- (4.0,3.72);
  \node[anchor=north,font=\footnotesize] at (1.15,3.68) {$-k-p$ bits};

  % ---------- the ROM ----------
  \draw[->] (2.9,3.72) -- (2.9,2.98);
  \draw (0.2,2.0) rectangle (5.0,2.98);
  \node[align=center] at (2.6,2.49) {$h(Z)=e^{Z}-Z-1$\\[-1pt]\footnotesize ROM, $2^{-k-p}$ entries};
  \draw[->] (2.6,2.0) -- (2.6,1.3);
  \node[anchor=west] at (2.7,1.65) {$H$\quad\texttt{ufix}$(-2k-1,\ \ell-g')$};

  % ---------- bit-position comparison ----------
  \draw[gray!60] (0,0.5) -- (8.5,0.5);
  \node[anchor=north west,font=\footnotesize] at (0,0.46) {position $0$};
  \node[anchor=north east,font=\footnotesize] at (8.5,0.46) {LSB $\ell-g'$};

  \draw[fill=black!10] (0,-0.65) rectangle (8.5,-0.15);
  \node at (4.25,-0.4) {$e^{Z}=1+Z+h(Z)$};

  \draw[fill=black!25] (6.375,-1.55) rectangle (8.5,-1.05);
  \node[anchor=east] at (6.275,-1.3) {$h(Z)$};
  \node[anchor=west,font=\footnotesize] at (8.6,-1.3) {$-2k-\ell+g'$ bits};
  \draw[<->] (0,-1.9) -- (6.375,-1.9);
  \node[anchor=north,font=\footnotesize] at (3.19,-1.94) {$2k+1$ leading positions are provably zero};
\end{circuitikz}
\end{document}
```

*After Fig. 22.6, p. 657; the lower bit-position panel is my own construction from (22.25)-(22.26), p. 656. $\ell=-w_F-g$, $g'$ = guard bits internal to the $e^Y$ operator, $p$ = LSB of $Z_{\mathrm{trunc}}$.*

**Peel the cheap terms off $e^Z$ before deciding what to tabulate.** The second range reduction of [[Higher-Order eY Architecture]] splits $Y=A+Z$ so that $0\le Z<2^{-k}$, and $e^Y=e^A e^Z$ by the exponential's additive-to-multiplicative law $e^{a+b}=e^a e^b$. Tabulating $e^Z$ directly would be absurd: $e^Z\in[1,\,1+2^{-k+1})$, so its top $k-1$ fraction bits are always zero and its leading bit is always one. Define $f(Z)=e^{Z}-1$ (22.23) and $h(Z)=e^{Z}-1-Z$ (22.24); then distributivity of $\times$ over $+$ gives $e^A e^Z = e^A + e^A f(Z)$ (22.27), and the definition of $h$ gives $f(Z)=Z+h(Z)$ (22.28) with no approximation whatsoever. Two subtractions of things that are free in hardware — a constant $1$ that is just a bit position, and $Z$ itself, which is already a wire — leave $h$ as the only summand needing a function evaluator.

**Read the output width straight off the Taylor bound.** From $e^{Z}=1+Z+\tfrac{Z^2}{2}+\tfrac{Z^3}{6}+\cdots$, the definition cancels the first two terms, so $h(Z)=\tfrac{Z^2}{2}\left(1+\tfrac{Z}{3}+\cdots\right)$, and with $0\le Z<2^{-k}$ the book records the round bound

$$0\le h(Z)<2^{-2k}\qquad(22.26)$$

putting the MSB of $H\approx h(Z)$ at position $-2k-1$. Its LSB is the datapath LSB $\ell-g'$, so $H$ is $-2k-\ell+g'$ bits wide — against $-\ell+g'+1$ bits for $e^Z$ at the same LSB. That is the whole argument for the note: **$2k+1$ fewer bits of output, at zero cost in approximation error**, because (22.28) is an identity and not an approximation. Bit positions and the `ufix`/`sfix` notation used here are [[Number Formats]].

**The address is a truncation of $Z$, and the error analysis says how brutal it may be.** $Z$ is `ufix`$(-k-1,\ell)$, but $H$ only has $-2k-\ell+g'$ bits of output, so feeding it all $-k-\ell$ bits of $Z$ would be paying for address bits that cannot move the answer. Write $Z=Z_{\mathrm{trunc}}+e$ with $0\le e<2^{p}$, where $p$ is the LSB kept. A first-order Taylor expansion of $h$ about $Z_{\mathrm{trunc}}$ gives $h(Z_{\mathrm{trunc}})-h(Z)\approx e\,h'(Z)=e\,(e^{Z}-1)\approx eZ$, and with $|Z|<2^{-k}$ and the amplification by $T\approx e^A<1.65$ folded in as a factor 2,

$$\bar\delta_{\mathrm{trunc}Z}=2\cdot 2^{\,p-k}$$

Setting this equal to one ulp $u=2^{\ell-g'}$ of the internal datapath gives $p=\ell-g'+k-1$ (p. 659), hence an address of $-k-p=-2k-\ell+g'+1$ bits. The table is therefore always **one bit deeper than it is wide**: $2^{w+1}$ entries of $w$ bits, with $w=-2k-\ell+g'$.

**Correct rounding here buys a factor of two on the dominant error term.** $\delta_H=T\left(H-h(Z_{\mathrm{trunc}})\right)$ is the evaluator's own error amplified by $T\approx e^A$, and $T<1.65$ because $e^Y\in[0.65,1.65)$ and $e^A\le e^Y$ by monotonicity of $e^x$ with $A\le Y$. A table can be filled with the correctly rounded value of $h$, so its error is at most half an ulp and $\bar\delta_H=1.65u/2$; a generic faithful approximator ([[Polynomial hZ Evaluator]]) only promises one ulp and gives $\bar\delta_H=1.65u$. That extra $0.825u$ is not free elsewhere — it is exactly what forces $t=k-1$ instead of $t=k$ on the [[eA Table]] truncation to keep $\bar\delta_{\mathrm{arch}}$ under $5u$ (pp. 658-659). Half-ulp versus one-ulp accuracy and the meaning of "faithful" are [[Error Accuracy]]; the rounding mode used to fill the entries is [[Rounding]].

**At useful sizes this table is a squaring table, and that is worth knowing before you instantiate a function evaluator.** Since $h(Z)=\tfrac{Z^2}{2}(1+Z/3+\cdots)$ and $Z<2^{-k}$, the correction factor differs from $1$ by less than $2^{-k}/3$. For IEEE single with $w_F=23$, $g=4$, $g'=0$, $k=10$ — so $\ell=-27$, $p=-18$, an 8-bit address $a$ and a 7-bit entry — the stored value is $\mathrm{round}\!\left(h(a\,2^{-18})\,2^{27}\right)$, and evaluating both sides for all 256 addresses shows it equals $\mathrm{round}(a^2/1024)$ **exactly, for every entry**: the cubic term never reaches half an ulp anywhere in range. The consequence is practical — the generic table-generation machinery of [[Table-Based Function Evaluation]] is not needed at this size, and a synthesiser handed these 256 words will logic-minimise them like the squarer they are.

> [!warning] Source discrepancy — 6 bits or 7?
> p. 657 gives the size of $H$ as $-2k-\ell+g'$, which for the case study of p. 661 ($k=10$, $\ell=-27$, $g'=0$) is **7** bits; p. 661 then states the $h(Z)$ table is $2^8\times 6$ bits. Recomputing every entry settles it: the largest, at $a=255$, is $h(255\cdot2^{-18})=63.52$ ulps of $2^{-27}$, which rounds to **nearest** as $64=2^6$ and needs a seventh bit. 6 bits is correct only if that table is filled by truncation, which contradicts the same page's "$h(Z)$ will be tabulated with correct rounding". The frontmatter keeps the book's figure; the RTL below stores 7 bits. The difference is 256 bits of ROM, so nothing downstream changes — the $2^{10}\times36$ dual-port packing of [[eY DSP and BRAM Mapping]] still absorbs it.

**On FPGA this table does not want a memory block of its own; on ASIC it does not want a memory at all.** $2^8\times7=1792$ bits is far below any block-RAM granularity, so the point of the [[FPGAs]] mapping is that it rides along in the *unused* width of the $2^{10}\times36$ block already holding the 28-bit [[eA Table]] entries — the $h$ table is free, not cheap. On ASIC a 256-word ROM macro would be the wrong instrument entirely: after logic minimisation of a monotone, mostly-repeating quadratic, this is a few hundred gates of combinational logic with a delay well under one adder. Either way the box is combinational; only the surrounding pipeline registers make it look like a memory. General ROM structuring and the multipartite alternatives live in [[Lookup-Tables]].

$$\boxed{\ h(Z)=e^{Z}-Z-1,\quad 0\le h(Z)<2^{-2k},\quad \text{ROM: } 2^{\,w+1}\times w \text{ bits},\ \ w=-2k-\ell+g'\ }$$

**When it breaks.** The table is exponential in $-2k-\ell+g'$, so every bit of extra precision doubles it while shrinking nothing else — past roughly $w=12$ ($k$ around $9$ at double precision) the [[Polynomial hZ Evaluator]] takes over, trading the ROM for a degree-$d$ Horner chain that fits the same interface. In the other direction, once $k\approx(\ell+1)/2$ the second-order term itself falls below one ulp and the whole box disappears into the [[First-Order eY Architecture]]. The $p=\ell-g'+k-1$ sizing assumes the amplification bound $T<1.65$; on the $e^Y<1$ branch $T<1$ holds and $p$ could legitimately be one bit coarser, halving the table — the book does not take this option because the branch is not known at design time. And the derivation of $\bar\delta_{\mathrm{trunc}Z}$ is first-order Taylor: it is only sound because $Z<2^{-k}$ makes $h''$ negligible, which stops being true if this box is ever reused with a $Z$ range wider than $2^{-k}$.

## RTL (Spade)

```spade
/// h(Z) = e^Z - Z - 1 for IEEE single: k = 10, l = -27, g' = 0,
/// p = l + k - 1 = -18. Entry a holds round(h(a * 2^-18) * 2^27).
entity h_table(z: uint<17>) -> uint<7> {
    let z_trunc = z.as_bits()[9..17].as_uint();
    let rom: [uint<7>; 256] = [
         0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
         0,  0,  0,  0,  0,  0,  0,  1,  1,  1,  1,  1,  1,  1,  1,  1,
         1,  1,  1,  1,  1,  1,  1,  1,  2,  2,  2,  2,  2,  2,  2,  2,
         2,  2,  2,  3,  3,  3,  3,  3,  3,  3,  3,  3,  4,  4,  4,  4,
         4,  4,  4,  4,  5,  5,  5,  5,  5,  5,  5,  5,  6,  6,  6,  6,
         6,  6,  7,  7,  7,  7,  7,  7,  8,  8,  8,  8,  8,  8,  9,  9,
         9,  9,  9, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 12, 12, 12,
        12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16,
        16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20,
        20, 21, 21, 21, 21, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 25,
        25, 25, 26, 26, 26, 27, 27, 27, 28, 28, 28, 29, 29, 29, 30, 30,
        30, 31, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34, 35, 35, 35, 36,
        36, 36, 37, 37, 38, 38, 38, 39, 39, 39, 40, 40, 41, 41, 41, 42,
        42, 43, 43, 43, 44, 44, 45, 45, 46, 46, 46, 47, 47, 48, 48, 49,
        49, 49, 50, 50, 51, 51, 52, 52, 53, 53, 53, 54, 54, 55, 55, 56,
        56, 57, 57, 58, 58, 59, 59, 60, 60, 61, 61, 62, 62, 63, 63, 64
    ];
    rom[z_trunc]
}
```

`z` is the full $Z$ of the diagram, `ufix`$(-11,-27)$, so 17 bits; `z.as_bits()[9..17]` keeps positions $-11$ through $-18$ — index 0 is the LSB in Spade, so bit 9 is position $-18=p$ — and that slice *is* $Z_{\mathrm{trunc}}$, a bare wire fan-out with no gates behind it. The 7-bit result is $H$, weighted at positions $-21$ down to $-27$; nothing in the RTL carries that weight, it lives in the alignment of the adder that consumes it. Synthesis will not build the 256-word memory the array literal suggests: with 233 of 256 entries below 32 and a monotone quadratic profile, it collapses into logic.

Simulated with `iverilog` against a behavioural reference `(a*a + 512) >> 10`: **4009 vectors, 0 failures** — 9 named vectors (address 0, 1, the last entry that rounds to 0 at $a=22$, the first that rounds to 1 at $a=23$, $a=128$, $a=255$ where the seventh bit appears, and three asymmetric cases with the truncated low bits set) plus a 4000-vector random sweep over the full 17-bit $Z$. The random sweep is what checks the truncation: a slice taken from the wrong end of `z` passes every aligned vector and fails immediately on a random one.

## Related Notes

- [[Higher-Order eY Architecture]] - depends-on: this is the $e^Z-Z-1$ box of that datapath, and its $p$ and output width come from that note's error budget.
- [[eA Table]] - compares: the other ROM in the same architecture, $2^{10}\times28$ against this $2^8\times7$; the two share one block RAM.
- [[Polynomial hZ Evaluator]] - extends: same interface, same $h$, evaluated instead of tabulated once the table stops fitting.
- [[First-Order eY Architecture]] - counter-example: drops this box entirely by taking $f(Z)\approx Z$, which is what happens when $k$ is large enough that $h$ is below one ulp.
- [[eY DSP and BRAM Mapping]] - supports: where the 1792 bits actually land on an FPGA.
- [[Table-Based Function Evaluation]] - extends: the generic machinery this table is a degenerate, one-region instance of.
- [[Lookup-Tables]] - depends-on: ROM structuring, and the multipartite methods that beat a flat table at larger widths.
- [[Rounding]] - supports: filling entries to nearest is what halves $\bar\delta_H$ to $1.65u/2$.
- [[Error Accuracy]] - depends-on: ulp, faithful versus correctly rounded, and the amplification bookkeeping around $\bar\delta_H$.
- [[Number Formats]] - depends-on: the `ufix`$(m,\ell)$ bit-position notation used for every width above.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- 22.5.1 Using large tables and square multipliers - pp. 655-659. Eqs. (22.23)-(22.28) define $f$ and $h$ and bound them; Fig. 22.6, p. 657, is the architecture and the source of the `ufix` annotations; p. 657 defines $p$ and gives the size of $H$ as $-2k-\ell+g'$.
- Error analysis - pp. 658-659. $\bar\delta_H=1.65u/2$ tabulated versus $1.65u$ faithful; $\bar\delta_{\mathrm{trunc}Z}=2\cdot2^{p-k}$ and the choice $p=\ell-g'+k-1$; the $T<1$ tightening on the $e^Y<1$ branch.
- 22.5.4 FPGA-specific remarks, IEEE single case study - p. 661. $k=10$, $p=-18$, $t=10$, the $2^8\times6$-bit $h$ table and the shared $2^{10}\times36$ dual-port block RAM.

Table entries and the $2^8\times7$ width were recomputed here at 60 decimal digits; the $\mathrm{round}(a^2/1024)$ identity and the 4009-vector simulation are this note's own verification, not the book's.
